'use strict';
const express = require('express');
const db = require('../lib/db');
const { id, orderNumber, sign, isEmail } = require('../lib/util');
const analytics = require('../lib/analytics');
const risk = require('../lib/risk');
const payments = require('../lib/payments');
const emails = require('../lib/emails');
const { t } = require('../lib/i18n');

const router = express.Router();

// ---------- first-party analytics ----------
router.post('/track', (req, res) => {
  const { event, visitorId, meta } = req.body || {};
  analytics.track(event, String(visitorId || '').slice(0, 64), meta);
  res.json({ ok: true });
});

// ---------- newsletter ----------
router.post('/subscribe', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!isEmail(email)) return res.json({ ok: false, error: t('err_email_short') });
  const subs = db.load('subscribers', []);
  if (subs.some(s => s.email === email)) {
    return res.json({ ok: true }); // already in — don't leak membership
  }
  subs.push({ id: id('sub'), email, createdAt: Date.now(), source: 'footer' });
  db.save('subscribers', subs);
  const welcomeCode = db.load('discounts', []).find(d => d.active && d.firstOrderOnly);
  emails.welcome1(email, welcomeCode ? welcomeCode.code : 'WELCOME10').catch(() => {});
  res.json({ ok: true });
});

// ---------- abandoned-checkout capture ----------
router.post('/checkout/start', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!isEmail(email)) return res.json({ ok: false });
  const checkouts = db.load('checkouts', []);
  // one open checkout per email; refresh items if they return
  let c = checkouts.find(x => x.email === email && !x.converted);
  if (!c) {
    c = { id: id('chk'), email, createdAt: Date.now(), converted: false, sent1: false, sent2: false };
    checkouts.push(c);
  }
  c.items = Array.isArray(req.body.items) ? req.body.items.slice(0, 30).map(i => ({
    productId: String(i.productId || ''), name: String(i.name || '').slice(0, 120), qty: Math.max(1, parseInt(i.qty, 10) || 1)
  })) : [];
  c.visitorId = String(req.body.visitorId || '').slice(0, 64);
  db.save('checkouts', checkouts);
  res.json({ ok: true });
});

// ---------- discount validation ----------
function validateDiscount(code, email, subtotalCents) {
  const d = db.load('discounts', []).find(x => x.code.toUpperCase() === String(code || '').toUpperCase());
  if (!d || !d.active) return { valid: false, reason: t('dc_invalid') };
  if (d.minSubtotal && subtotalCents < d.minSubtotal) {
    return { valid: false, reason: t('dc_min', { min: '$' + (d.minSubtotal / 100).toFixed(2) }) };
  }
  if (d.firstOrderOnly && email) {
    const prior = db.load('orders', []).some(o =>
      o.email === String(email).toLowerCase() && ['paid', 'fulfilled', 'delivered'].includes(o.status));
    if (prior) return { valid: false, reason: t('dc_first_only') };
  }
  return { valid: true, discount: { code: d.code, type: d.type, value: d.value } };
}
router.post('/discount/validate', (req, res) => {
  const { code, email, subtotal } = req.body || {};
  res.json(validateDiscount(code, email, parseInt(subtotal, 10) || 0));
});

// ---------- cart quote ----------
router.post('/cart/quote', (req, res) => {
  const productsList = db.load('products', []);
  const settings = db.load('settings', {});
  const ship = settings.shipping || {};
  const rawItems = Array.isArray(req.body.items) ? req.body.items.slice(0, 50) : [];
  const lines = [];

  for (const line of rawItems) {
    const productId = String(line.productId || line.id || '');
    const p = productsList.find(x => x.id === productId && x.status === 'published');
    if (!p) continue;
    const requestedQty = Math.max(1, parseInt(line.qty, 10) || 1);
    const qty = Math.min(requestedQty, Math.max(0, p.stock || 0));
    if (!qty) continue;
    lines.push({
      productId: p.id,
      name: p.name,
      slug: p.slug,
      image: p.images[0],
      price: p.price,
      qty,
      stock: p.stock,
      lineTotal: p.price * qty
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const freeThreshold = ship.freeThreshold ?? 3500;
  const shippingCents = subtotal && subtotal < freeThreshold ? (ship.standardRate ?? 495) : 0;
  res.json({
    ok: true,
    lines,
    subtotal,
    shippingCents,
    totalCents: subtotal + shippingCents,
    freeThreshold,
    amountToFree: Math.max(0, freeThreshold - subtotal)
  });
});

// ---------- order creation ----------
function computeOrder(body) {
  const productsList = db.load('products', []);
  const settings = db.load('settings', {});
  const ship = settings.shipping || {};
  const items = [];
  for (const line of (body.items || []).slice(0, 50)) {
    const p = productsList.find(x => x.id === line.productId && x.status === 'published');
    if (!p) return { error: t('err_prod_gone') };
    const qty = Math.max(1, Math.min(parseInt(line.qty, 10) || 1, 99));
    if (p.stock < qty) return { error: t('err_stock', { n: p.stock, name: p.name }) };
    items.push({ productId: p.id, name: p.name, slug: p.slug, price: p.price, qty, image: p.images[0] });
  }
  if (!items.length) return { error: t('err_cart_empty') };

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  let discountCents = 0, discountCode = null;
  if (body.discountCode) {
    const v = validateDiscount(body.discountCode, body.email, subtotal);
    if (v.valid) {
      discountCents = v.discount.type === 'percent'
        ? Math.round(subtotal * v.discount.value / 100)
        : Math.min(v.discount.value, subtotal);
      discountCode = v.discount.code;
    }
  }
  const freeThreshold = ship.freeThreshold ?? 3500;
  const shippingCents = subtotal >= freeThreshold ? 0 : (ship.standardRate ?? 495);
  return { items, subtotal, discountCents, discountCode, shippingCents, totalCents: subtotal - discountCents + shippingCents };
}

function markPaid(order, extra) {
  Object.assign(order, extra || {});
  order.status = 'paid';
  order.paidAt = Date.now();
  order.timeline.push({ at: Date.now(), text: 'Payment received (' + order.paymentMethod + ')' });

  // decrement stock
  const productsList = db.load('products', []);
  for (const item of order.items) {
    const p = productsList.find(x => x.id === item.productId);
    if (p) p.stock = Math.max(0, p.stock - item.qty);
  }
  db.save('products', productsList);

  // discount usage
  if (order.discountCode) {
    const discounts = db.load('discounts', []);
    const d = discounts.find(x => x.code === order.discountCode);
    if (d) { d.uses = (d.uses || 0) + 1; db.save('discounts', discounts); }
  }

  // convert abandoned checkout
  const checkouts = db.load('checkouts', []);
  const c = checkouts.find(x => x.email === order.email && !x.converted);
  if (c) { c.converted = true; db.save('checkouts', checkouts); }

  analytics.track('purchase', order.visitorId, { orderId: order.id, value: order.totalCents });
  db.save('orders');
  emails.orderConfirmation(order).catch(() => {});
}

router.post('/checkout', async (req, res) => {
  const body = req.body || {};
  if (!isEmail(body.email)) return res.json({ error: t('err_email') });
  const s = body.shipping || {};
  for (const f of ['firstName', 'lastName', 'address1', 'city', 'state', 'zip']) {
    if (!String(s[f] || '').trim()) return res.json({ error: t('err_addr') });
  }

  const calc = computeOrder(body);
  if (calc.error) return res.json({ error: calc.error });

  const settings = db.load('settings', {});
  const mode = settings.payments?.mode || 'test';
  const orders = db.load('orders', []);

  const order = {
    id: id('ord'), number: orderNumber(),
    email: String(body.email).trim().toLowerCase(),
    visitorId: String(body.visitorId || '').slice(0, 64),
    ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(),
    items: calc.items, subtotalCents: calc.subtotal,
    discountCents: calc.discountCents, discountCode: calc.discountCode,
    shippingCents: calc.shippingCents, totalCents: calc.totalCents,
    shipping: {
      firstName: String(s.firstName).slice(0, 60), lastName: String(s.lastName).slice(0, 60),
      address1: String(s.address1).slice(0, 120), address2: String(s.address2 || '').slice(0, 120),
      city: String(s.city).slice(0, 60), state: String(s.state).slice(0, 10),
      zip: String(s.zip).slice(0, 12), country: String(s.country || 'United States').slice(0, 60)
    },
    billingSameAsShipping: body.billingSameAsShipping !== false,
    billing: body.billing ? {
      address1: String(body.billing.address1 || '').slice(0, 120), city: String(body.billing.city || '').slice(0, 60),
      state: String(body.billing.state || '').slice(0, 10), zip: String(body.billing.zip || '').slice(0, 12),
      country: String(body.billing.country || '').slice(0, 60)
    } : null,
    paymentMethod: mode, status: 'pending_payment',
    riskFlags: [], refunds: [], reviewInviteSent: false,
    trackingNumber: '', carrier: '',
    timeline: [{ at: Date.now(), text: 'Order created' }],
    createdAt: Date.now()
  };
  order.riskFlags = risk.assess(order, orders);
  orders.unshift(order);
  db.save('orders', orders);

  try {
    if (mode === 'stripe') {
      const { redirectUrl, gatewayRef } = await payments.createStripeCheckout(order, req);
      order.gatewayRef = gatewayRef; db.save('orders');
      return res.json({ redirectUrl });
    }
    if (mode === 'alipay') {
      const { redirectUrl, gatewayRef } = await payments.createAlipayCheckout(order, req);
      order.gatewayRef = gatewayRef; db.save('orders');
      return res.json({ redirectUrl });
    }
    if (mode === 'paypal') {
      const { redirectUrl, gatewayRef } = await payments.createPaypalOrder(order, req);
      order.gatewayRef = gatewayRef; db.save('orders');
      return res.json({ redirectUrl });
    }
    // test mode
    if (body.simulateFail) {
      order.status = 'canceled';
      order.timeline.push({ at: Date.now(), text: 'Test payment failed (simulated)' });
      db.save('orders');
      return res.json({ error: t('err_test_fail') });
    }
    markPaid(order, {});
    return res.json({ confirmUrl: `/order/confirm/${order.id}?t=${sign(order.id)}` });
  } catch (e) {
    order.status = 'canceled';
    order.timeline.push({ at: Date.now(), text: 'Payment error: ' + e.message });
    db.save('orders');
    return res.json({ error: t('err_pay_start', { msg: e.message }) });
  }
});

// ---------- gateway returns ----------
router.get('/pay/stripe/return', async (req, res) => {
  const orders = db.load('orders', []);
  const order = orders.find(o => o.id === req.query.orderId);
  if (!order) return res.redirect('/checkout?canceled=1');
  try {
    const result = await payments.confirmStripe(req.query.session_id);
    if (result.paid && order.status === 'pending_payment') {
      markPaid(order, { paymentIntent: result.paymentIntent });
    }
    return res.redirect(`/order/confirm/${order.id}?t=${sign(order.id)}`);
  } catch (e) {
    return res.redirect('/checkout?canceled=1');
  }
});

router.get('/pay/paypal/return', async (req, res) => {
  const orders = db.load('orders', []);
  const order = orders.find(o => o.id === req.query.orderId);
  if (!order) return res.redirect('/checkout?canceled=1');
  try {
    const result = await payments.capturePaypal(req.query.token);
    if (result.paid && order.status === 'pending_payment') {
      markPaid(order, { captureId: result.captureId });
    }
    return res.redirect(`/order/confirm/${order.id}?t=${sign(order.id)}`);
  } catch (e) {
    return res.redirect('/checkout?canceled=1');
  }
});

module.exports = { router, markPaid };
