'use strict';
const express = require('express');
const crypto = require('crypto');
const db = require('../lib/db');
const { id, hashPassword, verifyPassword, toCents, slugify } = require('../lib/util');
const payments = require('../lib/payments');
const emails = require('../lib/emails');
const views = require('../views/admin-pages');

const router = express.Router();
const sessions = new Map(); // token -> {createdAt}
const SESSION_MS = 12 * 3600 * 1000;

function settings() { return db.load('settings', {}); }

function authed(req) {
  const token = req.cookies.mw_admin;
  const s = token && sessions.get(token);
  if (!s) return false;
  if (Date.now() - s.createdAt > SESSION_MS) { sessions.delete(token); return false; }
  return true;
}

router.get('/login', (req, res) => {
  if (authed(req)) return res.redirect('/admin');
  const firstRun = !settings().admin?.passwordHash;
  res.send(views.login({ firstRun, error: null }));
});

router.post('/login', (req, res) => {
  const s = settings();
  const firstRun = !s.admin?.passwordHash;
  if (firstRun) {
    const pw = String(req.body.newPassword || '');
    if (pw.length < 8) return res.send(views.login({ firstRun, error: '密码至少 8 位。' }));
    if (pw !== req.body.newPassword2) return res.send(views.login({ firstRun, error: '两次输入不一致。' }));
    s.admin = { passwordHash: hashPassword(pw), mustChangePassword: false };
    db.save('settings', s);
  } else if (!verifyPassword(req.body.password, s.admin.passwordHash)) {
    return res.send(views.login({ firstRun: false, error: '密码错误。' }));
  }
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { createdAt: Date.now() });
  res.cookie('mw_admin', token, { httpOnly: true, sameSite: 'lax', maxAge: SESSION_MS });
  res.redirect('/admin');
});

router.get('/logout', (req, res) => {
  const token = req.cookies.mw_admin;
  if (token) sessions.delete(token);
  res.clearCookie('mw_admin');
  res.redirect('/admin/login');
});

// auth gate for everything below
router.use((req, res, next) => {
  if (!authed(req)) return res.redirect('/admin/login');
  next();
});

router.get('/', (req, res) => res.send(views.dashboard()));

// ---------- orders ----------
router.get('/orders', (req, res) => res.send(views.orders({ filter: req.query.status || '' })));
router.get('/orders/:id', (req, res) => {
  const order = db.load('orders', []).find(o => o.id === req.params.id);
  if (!order) return res.redirect('/admin/orders');
  res.send(views.orderDetail({ order, msg: req.query.msg, err: req.query.err }));
});

router.post('/orders/:id/fulfill', async (req, res) => {
  const orders = db.load('orders', []);
  const order = orders.find(o => o.id === req.params.id);
  if (!order || !['paid'].includes(order.status)) return res.redirect('/admin/orders/' + req.params.id + '?err=' + encodeURIComponent('只有已支付订单可以发货'));
  order.status = 'fulfilled';
  order.fulfilledAt = Date.now();
  order.carrier = String(req.body.carrier || '').slice(0, 60);
  order.trackingNumber = String(req.body.trackingNumber || '').slice(0, 60);
  order.timeline.push({ at: Date.now(), text: `已发货 · ${order.carrier} ${order.trackingNumber}` });
  db.save('orders', orders);
  await emails.shippingNotice(order).catch(() => {});
  res.redirect('/admin/orders/' + order.id + '?msg=' + encodeURIComponent('已标记发货，发货通知邮件已生成'));
});

router.post('/orders/:id/deliver', (req, res) => {
  const orders = db.load('orders', []);
  const order = orders.find(o => o.id === req.params.id);
  if (!order || order.status !== 'fulfilled') return res.redirect('/admin/orders/' + req.params.id);
  order.status = 'delivered';
  order.deliveredAt = Date.now();
  order.timeline.push({ at: Date.now(), text: '已送达' });
  db.save('orders', orders);
  res.redirect('/admin/orders/' + order.id + '?msg=' + encodeURIComponent('已标记送达'));
});

router.post('/orders/:id/refund', async (req, res) => {
  const orders = db.load('orders', []);
  const order = orders.find(o => o.id === req.params.id);
  if (!order || !['paid', 'fulfilled', 'delivered'].includes(order.status)) {
    return res.redirect('/admin/orders/' + req.params.id + '?err=' + encodeURIComponent('该订单状态不可退款'));
  }
  const refunded = (order.refunds || []).reduce((s, r) => s + r.amountCents, 0);
  const maxLeft = order.totalCents - refunded;
  let amount = toCents(req.body.amount);
  if (!amount || amount <= 0) amount = maxLeft;
  if (amount > maxLeft) {
    return res.redirect('/admin/orders/' + order.id + '?err=' + encodeURIComponent('退款金额超过剩余可退金额'));
  }
  try {
    await payments.refund(order, amount);
  } catch (e) {
    return res.redirect('/admin/orders/' + order.id + '?err=' + encodeURIComponent('网关退款失败：' + e.message));
  }
  order.refunds = order.refunds || [];
  order.refunds.push({ amountCents: amount, reason: String(req.body.reason || '').slice(0, 200), at: Date.now() });
  const isFull = refunded + amount >= order.totalCents;
  if (isFull) order.status = 'refunded';
  order.timeline.push({ at: Date.now(), text: `退款 $${(amount / 100).toFixed(2)}${isFull ? '（全额，订单关闭）' : '（部分）'}` });
  db.save('orders', orders);
  await emails.refundNotice(order, amount, !isFull).catch(() => {});
  res.redirect('/admin/orders/' + order.id + '?msg=' + encodeURIComponent('退款完成，退款通知邮件已生成'));
});

router.post('/orders/:id/note', (req, res) => {
  const orders = db.load('orders', []);
  const order = orders.find(o => o.id === req.params.id);
  if (order && String(req.body.note || '').trim()) {
    order.timeline.push({ at: Date.now(), text: '备注：' + String(req.body.note).slice(0, 500) });
    db.save('orders', orders);
  }
  res.redirect('/admin/orders/' + req.params.id);
});

// ---------- products ----------
router.get('/products', (req, res) => res.send(views.products()));
router.get('/products/new', (req, res) => res.send(views.productEdit({ product: null })));
router.get('/products/:id', (req, res) => {
  const p = db.load('products', []).find(x => x.id === req.params.id);
  if (!p) return res.redirect('/admin/products');
  res.send(views.productEdit({ product: p, msg: req.query.msg, err: req.query.err }));
});

function parseLines(s) { return String(s || '').split('\n').map(x => x.trim()).filter(Boolean); }

router.post('/products/:id', (req, res) => {
  const products = db.load('products', []);
  const isNew = req.params.id === 'new';
  let p = isNew ? null : products.find(x => x.id === req.params.id);
  if (!isNew && !p) return res.redirect('/admin/products');

  const b = req.body;
  const scoring = {};
  for (const k of ['margin', 'logistics', 'compliance', 'content', 'differentiation', 'aftersale']) {
    scoring[k] = Math.min(5, Math.max(1, parseInt(b['score_' + k], 10) || 1));
  }
  const total = Object.values(scoring).reduce((s, v) => s + v, 0);
  let status = ['published', 'draft'].includes(b.status) ? b.status : 'draft';
  let warn = '';
  if (status === 'published' && total < 24) {
    status = 'draft';
    warn = `选品评分 ${total} 分低于 24 分门槛（文档规则：低于 24 分不要上架），已保存为草稿。`;
  }

  const specs = {};
  for (const line of parseLines(b.specs)) {
    const i = line.indexOf(':');
    if (i > 0) specs[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const faqs = parseLines(b.faqs).map(l => {
    const i = l.indexOf('|');
    return i > 0 ? { q: l.slice(0, i).trim(), a: l.slice(i + 1).trim() } : null;
  }).filter(Boolean);

  // optional Chinese copy (storefront zh mode; falls back to English)
  const zhSpecs = {};
  for (const line of parseLines(b.zhSpecs)) {
    const i = line.indexOf(':');
    if (i > 0) zhSpecs[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const zhFaqs = parseLines(b.zhFaqs).map(l => {
    const i = l.indexOf('|');
    return i > 0 ? { q: l.slice(0, i).trim(), a: l.slice(i + 1).trim() } : null;
  }).filter(Boolean);
  const zh = {
    name: String(b.zhName || '').slice(0, 140),
    tagline: String(b.zhTagline || '').slice(0, 300),
    audience: String(b.zhAudience || '').slice(0, 400),
    benefits: parseLines(b.zhBenefits).slice(0, 8),
    specs: zhSpecs, faqs: zhFaqs
  };
  const zhEmpty = !zh.name && !zh.tagline && !zh.audience && !zh.benefits.length &&
    !Object.keys(zh.specs).length && !zh.faqs.length;

  const data = {
    name: String(b.name || '').slice(0, 140),
    slug: slugify(b.slug || b.name || 'product'),
    category: ['toys', 'grooming', 'beds', 'walk', 'feeding'].includes(b.category) ? b.category : 'toys',
    price: toCents(b.price), compareAtPrice: toCents(b.compareAtPrice) || null,
    cost: toCents(b.cost), shipCost: toCents(b.shipCost),
    stock: Math.max(0, parseInt(b.stock, 10) || 0),
    tagline: String(b.tagline || '').slice(0, 300),
    audience: String(b.audience || '').slice(0, 400),
    benefits: parseLines(b.benefits).slice(0, 8),
    specs, faqs,
    images: parseLines(b.images).slice(0, 8),
    scoring, status,
    zh: zhEmpty ? (p?.zh?.sizeGuide ? { sizeGuide: p.zh.sizeGuide } : null) : { ...zh, ...(p?.zh?.sizeGuide ? { sizeGuide: p.zh.sizeGuide } : {}) }
  };
  if (!data.name || !data.price) {
    return res.redirect((isNew ? '/admin/products/new' : '/admin/products/' + p.id) + '?err=' + encodeURIComponent('名称和售价必填'));
  }
  if (isNew) {
    p = { id: id('p'), createdAt: Date.now(), ...data };
    products.push(p);
  } else {
    Object.assign(p, data);
  }
  db.save('products', products);
  res.redirect('/admin/products/' + p.id + '?msg=' + encodeURIComponent(warn || '已保存'));
});

router.post('/products/:id/delete', (req, res) => {
  const products = db.load('products', []);
  const i = products.findIndex(x => x.id === req.params.id);
  if (i >= 0) { products.splice(i, 1); db.save('products', products); }
  res.redirect('/admin/products');
});

// ---------- discounts ----------
router.get('/discounts', (req, res) => res.send(views.discounts()));
router.post('/discounts', (req, res) => {
  const discounts = db.load('discounts', []);
  const code = String(req.body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
  if (!code) return res.redirect('/admin/discounts');
  if (discounts.some(d => d.code === code)) return res.redirect('/admin/discounts');
  discounts.push({
    id: id('d'), code,
    type: req.body.type === 'fixed' ? 'fixed' : 'percent',
    value: req.body.type === 'fixed' ? toCents(req.body.value) : Math.min(100, Math.max(1, parseInt(req.body.value, 10) || 10)),
    minSubtotal: toCents(req.body.minSubtotal),
    firstOrderOnly: req.body.firstOrderOnly === 'on',
    active: true, uses: 0, note: String(req.body.note || '').slice(0, 200), createdAt: Date.now()
  });
  db.save('discounts', discounts);
  res.redirect('/admin/discounts');
});
router.post('/discounts/:id/toggle', (req, res) => {
  const discounts = db.load('discounts', []);
  const d = discounts.find(x => x.id === req.params.id);
  if (d) { d.active = !d.active; db.save('discounts', discounts); }
  res.redirect('/admin/discounts');
});
router.post('/discounts/:id/delete', (req, res) => {
  const discounts = db.load('discounts', []);
  const i = discounts.findIndex(x => x.id === req.params.id);
  if (i >= 0) { discounts.splice(i, 1); db.save('discounts', discounts); }
  res.redirect('/admin/discounts');
});

// ---------- reviews ----------
router.get('/reviews', (req, res) => res.send(views.reviews()));
router.post('/reviews/:id/:action', (req, res) => {
  const reviews = db.load('reviews', []);
  const r = reviews.find(x => x.id === req.params.id);
  if (r) {
    if (req.params.action === 'approve') r.status = 'approved';
    else if (req.params.action === 'reject') r.status = 'rejected';
    db.save('reviews', reviews);
  }
  res.redirect('/admin/reviews');
});

// ---------- subscribers / messages ----------
router.get('/subscribers', (req, res) => res.send(views.subscribers()));
router.get('/messages', (req, res) => res.send(views.messages()));
router.post('/messages/:id/close', (req, res) => {
  const messages = db.load('messages', []);
  const m = messages.find(x => x.id === req.params.id);
  if (m) { m.status = m.status === 'open' ? 'closed' : 'open'; db.save('messages', messages); }
  res.redirect('/admin/messages');
});

// ---------- emails ----------
router.get('/emails', (req, res) => res.send(views.emailCenter({ view: req.query.view })));
router.post('/emails/automation', (req, res) => {
  const s = settings();
  s.emailAutomation = {
    enabled: req.body.enabled === 'on',
    abandoned1Hours: Math.max(0.5, parseFloat(req.body.abandoned1Hours) || 1),
    abandoned2Hours: Math.max(1, parseFloat(req.body.abandoned2Hours) || 24),
    reviewInviteDays: Math.max(1, parseInt(req.body.reviewInviteDays, 10) || 12)
  };
  db.save('settings', s);
  res.redirect('/admin/emails');
});

// ---------- ad tests ----------
router.get('/ads', (req, res) => res.send(views.ads()));
router.post('/ads', (req, res) => {
  const adtests = db.load('adtests', []);
  adtests.unshift({
    id: id('ad'),
    name: String(req.body.name || '').slice(0, 120),
    channel: String(req.body.channel || 'Meta').slice(0, 40),
    productId: String(req.body.productId || ''),
    spend: toCents(req.body.spend), impressions: parseInt(req.body.impressions, 10) || 0,
    clicks: parseInt(req.body.clicks, 10) || 0, addToCarts: parseInt(req.body.addToCarts, 10) || 0,
    orders: parseInt(req.body.orders, 10) || 0, revenue: toCents(req.body.revenue),
    unitMargin: toCents(req.body.unitMargin),
    createdAt: Date.now()
  });
  db.save('adtests', adtests);
  res.redirect('/admin/ads');
});
router.post('/ads/:id/delete', (req, res) => {
  const adtests = db.load('adtests', []);
  const i = adtests.findIndex(x => x.id === req.params.id);
  if (i >= 0) { adtests.splice(i, 1); db.save('adtests', adtests); }
  res.redirect('/admin/ads');
});

// ---------- checklist ----------
router.get('/checklist', (req, res) => res.send(views.checklist()));
router.post('/checklist/:key', (req, res) => {
  const cl = db.load('checklist', {});
  cl[req.params.key] = { checked: req.body.checked === 'on', at: Date.now() };
  db.save('checklist', cl);
  res.redirect('/admin/checklist');
});

// ---------- settings ----------
router.get('/settings', (req, res) => res.send(views.settingsPage({ msg: req.query.msg, err: req.query.err })));

router.post('/settings/:section', (req, res) => {
  const s = settings();
  const b = req.body;
  const sec = req.params.section;
  if (sec === 'store') {
    s.store = {
      ...s.store,
      name: String(b.name || 'MewMew Co').slice(0, 80),
      tagline: String(b.tagline || '').slice(0, 160),
      domain: String(b.domain || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, ''),
      supportEmail: String(b.supportEmail || '').trim().slice(0, 120),
      market: String(b.market || 'United States').slice(0, 60)
    };
  } else if (sec === 'shipping') {
    s.shipping = {
      ...s.shipping,
      freeThreshold: toCents(b.freeThreshold),
      standardRate: toCents(b.standardRate),
      handlingDays: String(b.handlingDays || '1-3').slice(0, 20),
      transitDays: String(b.transitDays || '7-15').slice(0, 20),
      countries: String(b.countries || 'United States').split(',').map(x => x.trim()).filter(Boolean),
      dutiesNote: String(b.dutiesNote || '').slice(0, 400)
    };
  } else if (sec === 'payments') {
    s.payments = {
      mode: ['test', 'stripe', 'alipay', 'paypal'].includes(b.mode) ? b.mode : 'test',
      stripe: { secretKey: String(b.stripeSecretKey || '').trim(), publishableKey: String(b.stripePublishableKey || '').trim() },
      paypal: { clientId: String(b.paypalClientId || '').trim(), secret: String(b.paypalSecret || '').trim(), sandbox: b.paypalSandbox === 'on' }
    };
    if (s.payments.mode === 'stripe' && !s.payments.stripe.secretKey) {
      return res.redirect('/admin/settings?err=' + encodeURIComponent('选择 Stripe 模式需要填入 Secret Key'));
    }
    if (s.payments.mode === 'alipay' && !s.payments.stripe.secretKey) {
      return res.redirect('/admin/settings?err=' + encodeURIComponent('选择支付宝国际收款需要先填入 Stripe 密钥'));
    }
    if (s.payments.mode === 'paypal' && !s.payments.paypal.clientId) {
      return res.redirect('/admin/settings?err=' + encodeURIComponent('选择 PayPal 模式需要填入 Client ID 和 Secret'));
    }
  } else if (sec === 'pixels') {
    s.pixels = { ga4: String(b.ga4 || '').trim().slice(0, 40), meta: String(b.meta || '').trim().slice(0, 40), tiktok: String(b.tiktok || '').trim().slice(0, 40) };
  } else if (sec === 'smtp') {
    s.smtp = {
      host: String(b.host || '').trim(), port: parseInt(b.port, 10) || 465,
      secure: b.secure === 'on', user: String(b.user || '').trim(),
      pass: String(b.pass || ''), from: String(b.from || '').trim()
    };
  } else if (sec === 'risk') {
    s.risk = { highValueCents: toCents(b.highValue) || 15000, ipOrders24h: Math.max(2, parseInt(b.ipOrders24h, 10) || 3) };
  } else if (sec === 'password') {
    if (!verifyPassword(b.currentPassword, s.admin.passwordHash)) {
      return res.redirect('/admin/settings?err=' + encodeURIComponent('当前密码错误'));
    }
    if (String(b.newPassword || '').length < 8) {
      return res.redirect('/admin/settings?err=' + encodeURIComponent('新密码至少 8 位'));
    }
    s.admin.passwordHash = hashPassword(b.newPassword);
    s.admin.mustChangePassword = false;
  }
  db.save('settings', s);
  res.redirect('/admin/settings?msg=' + encodeURIComponent('设置已保存'));
});

module.exports = router;
