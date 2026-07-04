'use strict';
const db = require('../lib/db');
const { adminLayout } = require('../lib/render');
const { money, escapeHtml: esc, fmtDate } = require('../lib/util');
const analytics = require('../lib/analytics');
const { categories, checklistItems } = require('../lib/seed-data');

const ORDER_STATUS = {
  pending_payment: ['待支付', 'st-gray'], paid: ['已支付', 'st-blue'],
  fulfilled: ['已发货', 'st-orange'], delivered: ['已送达', 'st-green'],
  refunded: ['已退款', 'st-red'], canceled: ['已取消', 'st-gray']
};
function statusBadge(st) {
  const [label, cls] = ORDER_STATUS[st] || [st, 'st-gray'];
  return `<span class="st ${cls}">${label}</span>`;
}
function catName(k) { const c = categories.find(x => x.key === k); return c ? (c.zh || c.name) : k; }
function productDisplayName(p) { return p?.zh?.name || p?.name || ''; }

function pendingBadges() {
  const orders = db.load('orders', []);
  const badge = {};
  const toShip = orders.filter(o => o.status === 'paid').length;
  if (toShip) badge.orders = toShip;
  const pendingReviews = db.load('reviews', []).filter(r => r.status === 'pending').length;
  if (pendingReviews) badge.reviews = pendingReviews;
  const openMsgs = db.load('messages', []).filter(m => m.status === 'open').length;
  if (openMsgs) badge.messages = openMsgs;
  return badge;
}
function layout(opts) { return adminLayout({ ...opts, badge: pendingBadges() }); }

// ---------- login ----------
function login({ firstRun, error }) {
  const body = firstRun ? `
    <p class="muted">首次使用：请设置管理员密码（至少 8 位）。</p>
    <label>设置密码 <input type="password" name="newPassword" required minlength="8"></label>
    <label>再输一遍 <input type="password" name="newPassword2" required minlength="8"></label>
    <button class="btn btn-primary btn-block" type="submit">设置并登录</button>`
    : `
    <label>管理员密码 <input type="password" name="password" required autofocus></label>
    <button class="btn btn-primary btn-block" type="submit">登录</button>`;
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>管理后台登录</title><link rel="stylesheet" href="/css/admin.css?v=20260704-dashboard-actions"><link rel="icon" href="/img/favicon.svg"></head>
<body class="login-body"><form class="login-card" method="POST" action="/admin/login">
<div class="login-logo">🐾 喵喵宠物独立站</div><h1>管理后台</h1>
${error ? `<p class="form-error">${esc(error)}</p>` : ''}
${body}
<p class="muted small center-text"><a href="/">← 返回店铺前台</a></p>
</form></body></html>`;
}

// ---------- dashboard ----------
function metricCard(label, value, target, ok) {
  return `<div class="metric">
    <span class="metric-label">${label}</span>
    <span class="metric-value">${value}</span>
    ${target ? `<span class="metric-target ${ok === null ? '' : ok ? 'good' : 'warn'}">${target}</span>` : ''}
  </div>`;
}

function actionCard(href, icon, title, desc, meta, tone = '') {
  return `<a class="action-card ${tone}" href="${href}">
    <span class="action-icon">${icon}</span>
    <span><b>${title}</b><em>${desc}</em></span>
    ${meta ? `<strong>${meta}</strong>` : ''}
  </a>`;
}

function dashboard() {
  const s7 = analytics.summarize(7);
  const s30 = analytics.summarize(30);
  const orders = db.load('orders', []);
  const products = db.load('products', []);
  const toShip = orders.filter(o => o.status === 'paid');
  const flagged = orders.filter(o => (o.riskFlags || []).length && ['paid'].includes(o.status));
  const pendingReviews = db.load('reviews', []).filter(r => r.status === 'pending').length;
  const openMsgs = db.load('messages', []).filter(m => m.status === 'open').length;
  const abandoned = db.load('checkouts', []).filter(c => c.email && !c.converted).length;
  const subs = db.load('subscribers', []).length;

  const paidAll = orders.filter(o => ['paid', 'fulfilled', 'delivered', 'refunded'].includes(o.status));
  const hasPayment = paidAll.length > 0;
  const hasRefund = orders.some(o => (o.refunds || []).length);
  const stage = !hasPayment ? 0 : (s30.orders < 10 ? 1 : 2);
  const stages = [
    ['① 流程验证（第 1-2 周）', '能访问、能支付、能退款、能提现', hasPayment && hasRefund],
    ['② 产品验证（第 3-6 周）', '有点击、加购、购买和真实反馈', s30.orders >= 10],
    ['③ 渠道验证（第 7-12 周）', '找到可重复获客渠道', false]
  ].map(([t, d, done], i) => `
    <div class="stage ${i === stage ? 'current' : ''} ${done ? 'done' : ''}">
      <b>${t}</b><span>${d}</span>${done ? '<em>✓ 已达成</em>' : i === stage ? '<em>当前阶段</em>' : ''}
    </div>`).join('');

  const todo = [];
  if (flagged.length) todo.push(`<a href="/admin/orders" class="todo warn">⚠️ ${flagged.length} 笔风控标记订单待人工审核（发货前必看）</a>`);
  if (toShip.length) todo.push(`<a href="/admin/orders?status=paid" class="todo">📦 ${toShip.length} 笔已支付订单待发货</a>`);
  if (pendingReviews) todo.push(`<a href="/admin/reviews" class="todo">⭐ ${pendingReviews} 条评价待审核</a>`);
  if (openMsgs) todo.push(`<a href="/admin/messages" class="todo">💬 ${openMsgs} 条客服消息待处理</a>`);
  if (abandoned) todo.push(`<a href="/admin/emails" class="todo">🛒 ${abandoned} 个弃购（自动挽回邮件已启用）</a>`);
  const settings = db.load('settings', {});
  if ((settings.store?.supportEmail || '').includes('example.com')) {
    todo.push('<a href="/admin/settings" class="todo warn">✉️ 客服邮箱还是占位符，上线前必须改成品牌邮箱</a>');
  }
  if (settings.payments?.mode === 'test') {
    todo.push('<a href="/admin/settings" class="todo">🧪 当前为测试支付模式 — 配置 Stripe/PayPal 后可真实收款</a>');
  }

  const published = products.filter(p => p.status === 'published');
  const drafts = products.filter(p => p.status !== 'published');
  const lowStock = products.filter(p => p.stock <= 10);
  const weakProducts = products.filter(p => scoreTotal(p) < 24);
  const checklist = db.load('checklist', {});
  const auto = autoChecks();
  const checklistDone = checklistItems.filter(i => (i.manual ? checklist[i.key]?.checked : auto[i.key])).length;
  const checklistPct = Math.round(checklistDone / checklistItems.length * 100);

  const recentOrders = orders.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5).map(o => `
    <tr>
      <td><a href="/admin/orders/${o.id}"><b>${esc(o.number)}</b></a><br><span class="muted small">${fmtDate(o.createdAt, true)}</span></td>
      <td>${esc(o.shipping?.firstName || '')} ${esc(o.shipping?.lastName || '')}<br><span class="muted small">${esc(o.email || '')}</span></td>
      <td><b>${money(o.totalCents)}</b></td>
      <td>${statusBadge(o.status)}</td>
    </tr>`).join('');

  const productHealth = [
    ['已上架产品', published.length, '/admin/products', 'green'],
    ['草稿产品', drafts.length, '/admin/products', drafts.length ? 'orange' : 'gray'],
    ['低库存', lowStock.length, '/admin/products', lowStock.length ? 'red' : 'green'],
    ['评分低于 24', weakProducts.length, '/admin/products', weakProducts.length ? 'red' : 'green']
  ].map(([label, value, href, tone]) => `
    <a class="health-item ${tone}" href="${href}">
      <span>${label}</span><b>${value}</b>
    </a>`).join('');

  const content = `
<section class="panel command-panel">
  <div class="panel-head">
    <div>
      <h2>今日工作台</h2>
      <p class="muted small">把最常用的后台功能放在首页，打开就能处理订单、商品、评论、邮件和上线配置。</p>
    </div>
    <a class="btn btn-primary" href="/admin/products/new">＋ 新建产品</a>
  </div>
  <div class="action-grid">
    ${actionCard('/admin/orders?status=paid', '📦', '处理待发货', '查看已支付订单并录入物流', toShip.length, toShip.length ? 'hot' : '')}
    ${actionCard('/admin/products', '🏷️', '管理产品', '上架、库存、价格和选品评分', published.length + '/' + products.length)}
    ${actionCard('/admin/reviews', '⭐', '审核评价', '批准或拒绝前台买家评价', pendingReviews, pendingReviews ? 'hot' : '')}
    ${actionCard('/admin/messages', '💬', '客服消息', '处理联系表单和售后咨询', openMsgs, openMsgs ? 'hot' : '')}
    ${actionCard('/admin/emails', '✉️', '邮件中心', '弃购、订单确认和自动化记录', abandoned ? abandoned + ' 弃购' : '正常')}
    ${actionCard('/admin/settings', '⚙️', '站点设置', '支付、物流、像素、品牌邮箱', settings.payments?.mode === 'test' ? '测试' : '正式', settings.payments?.mode === 'test' ? 'warn' : '')}
  </div>
</section>
<div class="grid-2">
  <section class="panel">
    <h2>近 7 天</h2>
    <div class="metric-grid">
      ${metricCard('访客', s7.visitors, '', null)}
      ${metricCard('订单', s7.orders, '', null)}
      ${metricCard('销售额', money(s7.revenueCents), '', null)}
      ${metricCard('转化率', s7.conversionRate.toFixed(2) + '%', '目标 0.5%–2%', s7.visitors < 30 ? null : s7.conversionRate >= 0.5)}
      ${metricCard('加购率', s7.addToCartRate.toFixed(1) + '%', '目标 >3%', s7.visitors < 30 ? null : s7.addToCartRate > 3)}
      ${metricCard('AOV 客单价', money(s7.aovCents), '目标 $40–80', s7.orders < 3 ? null : s7.aovCents >= 4000)}
    </div>
  </section>
  <section class="panel">
    <h2>近 30 天</h2>
    <div class="metric-grid">
      ${metricCard('访客', s30.visitors, '', null)}
      ${metricCard('订单', s30.orders, '', null)}
      ${metricCard('销售额', money(s30.revenueCents), '', null)}
      ${metricCard('转化率', s30.conversionRate.toFixed(2) + '%', '目标 0.5%–2%', s30.visitors < 100 ? null : s30.conversionRate >= 0.5)}
      ${metricCard('退款率', s30.refundRate.toFixed(1) + '%', '目标 <8%', s30.orders < 5 ? null : s30.refundRate < 8)}
      ${metricCard('邮件订阅', subs, '', null)}
    </div>
  </section>
</div>
<section class="panel">
  <h2>阶段目标（文档 §10：早期不要只看销售额）</h2>
  <div class="stage-row">${stages}</div>
</section>
<div class="grid-2 dashboard-ops">
  <section class="panel">
    <h2>待处理事项</h2>
    ${todo.length ? todo.join('') : '<p class="muted">🎉 没有待办事项。</p>'}
  </section>
  <section class="panel">
    <h2>商品健康</h2>
    <div class="health-grid">${productHealth}</div>
    <div class="progress-line admin-progress"><span style="width:${checklistPct}%"></span></div>
    <p class="muted small">上线验收 ${checklistDone}/${checklistItems.length} 项完成 · <a href="/admin/checklist">打开验收清单</a></p>
  </section>
</div>
<section class="panel">
  <div class="panel-head">
    <h2>近期订单</h2>
    <a class="btn btn-ghost btn-sm" href="/admin/orders">查看全部</a>
  </div>
  ${recentOrders ? `<table class="tbl"><tr><th>订单</th><th>客户</th><th>金额</th><th>状态</th></tr>${recentOrders}</table>` : '<p class="muted">暂无订单。可以先在前台下一笔测试订单。</p>'}
</section>`;
  return layout({ title: '仪表盘', active: 'dashboard', content });
}

// ---------- orders ----------
function orders({ filter }) {
  let list = db.load('orders', []);
  if (filter) list = list.filter(o => o.status === filter);
  const tabs = ['', 'pending_payment', 'paid', 'fulfilled', 'delivered', 'refunded'].map(k =>
    `<a class="filter-tab ${filter === k ? 'active' : ''}" href="/admin/orders${k ? '?status=' + k : ''}">${k ? ORDER_STATUS[k][0] : '全部'}</a>`).join('');
  const rows = list.map(o => `
    <tr>
      <td><a href="/admin/orders/${o.id}"><b>${esc(o.number)}</b></a></td>
      <td>${fmtDate(o.createdAt, true)}</td>
      <td>${esc(o.shipping?.firstName || '')} ${esc(o.shipping?.lastName || '')}<br><span class="muted small">${esc(o.email)}</span></td>
      <td>${o.items.reduce((s, i) => s + i.qty, 0)} 件</td>
      <td><b>${money(o.totalCents)}</b></td>
      <td>${statusBadge(o.status)}</td>
      <td>${(o.riskFlags || []).map(f => `<span class="st st-red small">⚠ ${esc(f.label)}</span>`).join(' ') || '<span class="muted">—</span>'}</td>
    </tr>`).join('');
  const content = `
<div class="filter-tabs">${tabs}</div>
<section class="panel">
${list.length ? `<table class="tbl"><tr><th>订单号</th><th>时间</th><th>客户</th><th>数量</th><th>金额</th><th>状态</th><th>风控</th></tr>${rows}</table>`
    : '<p class="muted">暂无订单。前台下一笔测试订单试试闭环？</p>'}
</section>`;
  return layout({ title: '订单', active: 'orders', content });
}

function orderDetail({ order: o, msg, err }) {
  const items = o.items.map(i => `
    <tr><td><img class="mini" src="${esc(i.image)}"></td><td>${esc(i.name)}</td><td>× ${i.qty}</td><td>${money(i.price)}</td><td><b>${money(i.price * i.qty)}</b></td></tr>`).join('');
  const timeline = (o.timeline || []).slice().reverse().map(t =>
    `<div class="tl-item"><span class="muted small">${fmtDate(t.at, true)}</span><span>${esc(t.text)}</span></div>`).join('');
  const refunded = (o.refunds || []).reduce((s, r) => s + r.amountCents, 0);
  const canRefund = ['paid', 'fulfilled', 'delivered'].includes(o.status) && refunded < o.totalCents;
  const flags = (o.riskFlags || []).length
    ? `<div class="risk-box">⚠️ 风控标记：${o.riskFlags.map(f => esc(f.label)).join('；')}<br><span class="small">发货前人工核对地址、金额与 IP。保留物流单号和签收证明以应对拒付。</span></div>` : '';

  const actions = [];
  if (o.status === 'paid') actions.push(`
    <form method="POST" action="/admin/orders/${o.id}/fulfill" class="inline-form">
      <input name="carrier" placeholder="承运商 如 USPS / YunExpress" required>
      <input name="trackingNumber" placeholder="物流单号" required>
      <button class="btn btn-primary">标记发货 + 发通知邮件</button>
    </form>`);
  if (o.status === 'fulfilled') actions.push(`
    <form method="POST" action="/admin/orders/${o.id}/deliver" class="inline-form">
      <button class="btn btn-primary">标记已送达</button>
    </form>`);
  if (canRefund) actions.push(`
    <form method="POST" action="/admin/orders/${o.id}/refund" class="inline-form">
      <input name="amount" placeholder="退款金额 $（留空=全额剩余 ${(o.totalCents - refunded) / 100}）" type="number" step="0.01" min="0.01" max="${(o.totalCents - refunded) / 100}">
      <input name="reason" placeholder="退款原因（内部记录）">
      <button class="btn btn-danger" onclick="return confirm('确认退款？')">退款</button>
    </form>`);

  const content = `
${msg ? `<p class="form-success">${esc(msg)}</p>` : ''}${err ? `<p class="form-error">${esc(err)}</p>` : ''}
<div class="grid-2">
  <section class="panel">
    <h2>订单 ${esc(o.number)} ${statusBadge(o.status)} ${o.paymentMethod === 'test' ? '<span class="st st-gray">测试支付</span>' : ''}</h2>
    ${flags}
    <table class="tbl"><tr><th></th><th>商品</th><th>数量</th><th>单价</th><th>小计</th></tr>${items}</table>
    <div class="sum-box">
      <div><span>商品小计</span><b>${money(o.subtotalCents)}</b></div>
      ${o.discountCents ? `<div><span>折扣 ${esc(o.discountCode || '')}</span><b>−${money(o.discountCents)}</b></div>` : ''}
      <div><span>运费</span><b>${o.shippingCents ? money(o.shippingCents) : '免邮'}</b></div>
      <div class="grand"><span>合计</span><b>${money(o.totalCents)}</b></div>
      ${refunded ? `<div><span>已退款</span><b class="red">−${money(refunded)}</b></div>` : ''}
    </div>
    <h3>操作</h3>
    ${actions.join('') || '<p class="muted">当前状态无可用操作。</p>'}
    <form method="POST" action="/admin/orders/${o.id}/note" class="inline-form">
      <input name="note" placeholder="添加内部备注…" required>
      <button class="btn btn-ghost">记录</button>
    </form>
  </section>
  <section class="panel">
    <h2>客户与配送</h2>
    <p><b>${esc(o.shipping.firstName)} ${esc(o.shipping.lastName)}</b><br>
    ${esc(o.email)}<br>
    ${esc(o.shipping.address1)} ${esc(o.shipping.address2 || '')}<br>
    ${esc(o.shipping.city)}, ${esc(o.shipping.state)} ${esc(o.shipping.zip)}<br>
    ${esc(o.shipping.country)}</p>
    ${o.billing ? `<p class="muted small">账单地址：${esc(o.billing.address1)}, ${esc(o.billing.city)}, ${esc(o.billing.state)} ${esc(o.billing.zip)}</p>` : '<p class="muted small">账单地址 = 配送地址</p>'}
    <p class="muted small">IP：${esc(o.ip || '—')} · 下单时间：${fmtDate(o.createdAt, true)}</p>
    ${o.trackingNumber ? `<p>物流：<b>${esc(o.carrier)}</b> ${esc(o.trackingNumber)}</p>` : ''}
    <h3>时间线</h3>
    <div class="tl">${timeline}</div>
  </section>
</div>
<p><a href="/admin/orders">← 返回订单列表</a></p>`;
  return layout({ title: '订单详情', active: 'orders', content });
}

// ---------- products ----------
function scoreTotal(p) {
  return Object.values(p.scoring || {}).reduce((s, v) => s + (v || 0), 0);
}
function products() {
  const list = db.load('products', []);
  const rows = list.map(p => {
    const total = scoreTotal(p);
    const marginPct = p.price ? Math.round((p.price - p.cost - p.shipCost) / p.price * 100) : 0;
    return `<tr>
      <td><img class="mini" src="${esc(p.images?.[0] || '')}"></td>
      <td><a href="/admin/products/${p.id}"><b>${esc(productDisplayName(p))}</b></a><br><span class="muted small">/${esc(p.slug)}</span></td>
      <td>${esc(catName(p.category))}</td>
      <td>${money(p.price)}</td>
      <td class="${marginPct >= 50 ? 'green' : 'red'}">${marginPct}%</td>
      <td class="${total >= 24 ? 'green' : 'red'}">${total}/30</td>
      <td>${p.stock}</td>
      <td>${p.status === 'published' ? '<span class="st st-green">已上架</span>' : '<span class="st st-gray">草稿</span>'}</td>
    </tr>`;
  }).join('');
  const content = `
<p><a class="btn btn-primary" href="/admin/products/new">＋ 新建产品</a>
<span class="muted small">　毛利 = (售价−成本−物流)/售价，文档要求到岸后仍有 50%+ · 选品评分低于 24 分不允许上架</span></p>
<section class="panel">
<table class="tbl"><tr><th></th><th>产品</th><th>分类</th><th>售价</th><th>毛利</th><th>选品评分</th><th>库存</th><th>状态</th></tr>${rows}</table>
</section>`;
  return layout({ title: '产品', active: 'products', content });
}

function productEdit({ product: p, msg, err }) {
  const v = k => p ? esc(p[k] ?? '') : '';
  const cents = k => p && p[k] != null ? (p[k] / 100).toFixed(2) : '';
  const score = k => p?.scoring?.[k] || 3;
  const scoreSelect = (k, label, hint) => `
    <label>${label} <span class="muted small">${hint}</span>
      <select name="score_${k}" class="score-sel">${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${score(k) === n ? 'selected' : ''}>${n}</option>`).join('')}</select>
    </label>`;
  const specsText = p ? Object.entries(p.specs || {}).map(([k, val]) => `${k}: ${val}`).join('\n') : '';
  const faqsText = p ? (p.faqs || []).map(f => `${f.q} | ${f.a}`).join('\n') : '';
  const action = p ? `/admin/products/${p.id}` : '/admin/products/new';

  const content = `
${msg ? `<p class="form-success">${esc(msg)}</p>` : ''}${err ? `<p class="form-error">${esc(err)}</p>` : ''}
<form method="POST" action="${action}">
<div class="grid-2">
  <section class="panel">
    <h2>基本信息</h2>
    <label>名称（英文，面向美国买家）<input name="name" required value="${v('name')}"></label>
    <label>Slug（URL）<input name="slug" value="${v('slug')}" placeholder="留空自动生成"></label>
    <label>分类 <select name="category">${categories.map(c => `<option value="${c.key}" ${p?.category === c.key ? 'selected' : ''}>${c.name}</option>`).join('')}</select></label>
    <div class="form-row-4">
      <label>售价 $ <input name="price" type="number" step="0.01" required value="${cents('price')}"></label>
      <label>划线价 $ <input name="compareAtPrice" type="number" step="0.01" value="${cents('compareAtPrice')}"></label>
      <label>采购成本 $ <input name="cost" type="number" step="0.01" value="${cents('cost')}"></label>
      <label>物流成本 $ <input name="shipCost" type="number" step="0.01" value="${cents('shipCost')}"></label>
    </div>
    <div class="form-row-4">
      <label>库存 <input name="stock" type="number" value="${p ? p.stock : 50}"></label>
      <label>状态 <select name="status">
        <option value="draft" ${p?.status !== 'published' ? 'selected' : ''}>草稿</option>
        <option value="published" ${p?.status === 'published' ? 'selected' : ''}>上架</option>
      </select></label>
    </div>
    <div class="calc-box" id="priceCalc" data-price="${cents('price') || 0}" data-cost="${cents('cost') || 0}" data-ship="${cents('shipCost') || 0}">
      <b>定价核算（文档 Day 4 公式）</b>
      <div class="calc-grid">
        <label>支付费率 % <input id="calcFee" type="number" value="3.4" step="0.1"></label>
        <label>预估获客 $/单 <input id="calcCac" type="number" value="8" step="0.5"></label>
        <label>退款补发预留 % <input id="calcRefund" type="number" value="5" step="1"></label>
        <label>目标利润 $/单 <input id="calcProfit" type="number" value="6" step="0.5"></label>
      </div>
      <p id="calcOut" class="calc-out"></p>
    </div>
    <h2>文案（英文）</h2>
    <label>一句话卖点 <input name="tagline" value="${v('tagline')}"></label>
    <label>适合谁 / 解决什么问题 <textarea name="audience" rows="2">${v('audience')}</textarea></label>
    <label>利益点（每行一条，3–5 条）<textarea name="benefits" rows="5">${p ? esc((p.benefits || []).join('\n')) : ''}</textarea></label>
    <label>规格参数（每行 <code>名称: 值</code>）<textarea name="specs" rows="6">${esc(specsText)}</textarea></label>
    <label>产品 FAQ（每行 <code>问题 | 回答</code>）<textarea name="faqs" rows="4">${esc(faqsText)}</textarea></label>
    <label>图片路径（每行一个，建议 4–6 张实拍图；上线前替换演示插画）<textarea name="images" rows="4">${p ? esc((p.images || []).join('\n')) : ''}</textarea></label>
    <h2>中文文案（可选 — 前台切换中文时显示，留空则回落英文）</h2>
    <label>中文名称 <input name="zhName" value="${esc(p?.zh?.name || '')}"></label>
    <label>中文一句话卖点 <input name="zhTagline" value="${esc(p?.zh?.tagline || '')}"></label>
    <label>中文·适合谁 <textarea name="zhAudience" rows="2">${esc(p?.zh?.audience || '')}</textarea></label>
    <label>中文·利益点（每行一条）<textarea name="zhBenefits" rows="5">${p?.zh?.benefits ? esc(p.zh.benefits.join('\n')) : ''}</textarea></label>
    <label>中文·规格参数（每行 <code>名称: 值</code>）<textarea name="zhSpecs" rows="6">${p?.zh?.specs ? esc(Object.entries(p.zh.specs).map(([k, v]) => `${k}: ${v}`).join('\n')) : ''}</textarea></label>
    <label>中文·产品 FAQ（每行 <code>问题 | 回答</code>）<textarea name="zhFaqs" rows="4">${p?.zh?.faqs ? esc(p.zh.faqs.map(f => `${f.q} | ${f.a}`).join('\n')) : ''}</textarea></label>
  </section>
  <section class="panel">
    <h2>选品评分表（文档 §1：低于 24 分不要上）</h2>
    ${scoreSelect('margin', '毛利空间', '到岸成本后是否仍有 50%+ 毛利')}
    ${scoreSelect('logistics', '物流友好', '小、轻、不易碎、不超长')}
    ${scoreSelect('compliance', '合规风险', '非入口、非医疗、无夸张功效宣称')}
    ${scoreSelect('content', '内容传播', '适合短视频前后对比')}
    ${scoreSelect('differentiation', '差异化', '有明确卖点，不只是通货')}
    ${scoreSelect('aftersale', '售后风险', '尺码/破损/漏液/噪音/充电问题少')}
    <p class="score-total">总分：<b id="scoreTotal">—</b>/30 <span id="scoreVerdict"></span></p>
    <div class="hint-box">
      合规提醒（文档 §3）：<br>
      · 不写医疗/治疗/抗焦虑等宣称<br>
      · 不用供应商水印图、不盗品牌图<br>
      · 入口类（食品/零食/保健品）不要作为 MVP 品类
    </div>
    <button class="btn btn-primary btn-block" type="submit">保存</button>
    ${p ? `<button class="btn btn-danger btn-block" formaction="/admin/products/${p.id}/delete" formmethod="POST" onclick="return confirm('确认删除该产品？')">删除产品</button>` : ''}
    ${p ? `<p class="center-text"><a href="/products/${esc(p.slug)}" target="_blank">↗ 查看前台页面</a></p>` : ''}
  </section>
</div>
</form>`;
  return layout({ title: p ? '编辑产品' : '新建产品', active: 'products', content });
}

// ---------- discounts ----------
function discounts() {
  const list = db.load('discounts', []);
  const rows = list.map(d => `
    <tr><td><b>${esc(d.code)}</b></td>
    <td>${d.type === 'percent' ? d.value + '%' : money(d.value)}</td>
    <td>${d.minSubtotal ? '满 ' + money(d.minSubtotal) : '—'}</td>
    <td>${d.firstOrderOnly ? '仅首单' : '不限'}</td>
    <td>${d.uses || 0} 次</td>
    <td>${d.active ? '<span class="st st-green">启用</span>' : '<span class="st st-gray">停用</span>'}</td>
    <td>
      <form method="POST" action="/admin/discounts/${d.id}/toggle" class="inline"><button class="btn btn-ghost btn-sm">${d.active ? '停用' : '启用'}</button></form>
      <form method="POST" action="/admin/discounts/${d.id}/delete" class="inline"><button class="btn btn-danger btn-sm" onclick="return confirm('删除优惠码？')">删除</button></form>
    </td></tr>`).join('');
  const content = `
<section class="panel">
  <h2>新建优惠码</h2>
  <form method="POST" action="/admin/discounts" class="inline-form wrap-form">
    <input name="code" placeholder="代码 如 SUMMER15" required style="text-transform:uppercase">
    <select name="type"><option value="percent">百分比 %</option><option value="fixed">固定金额 $</option></select>
    <input name="value" type="number" step="0.01" placeholder="数值" required>
    <input name="minSubtotal" type="number" step="0.01" placeholder="最低消费 $（可选）">
    <label class="check-inline"><input type="checkbox" name="firstOrderOnly"> 仅限首单</label>
    <input name="note" placeholder="备注">
    <button class="btn btn-primary">创建</button>
  </form>
</section>
<section class="panel">
  <table class="tbl"><tr><th>代码</th><th>折扣</th><th>门槛</th><th>限制</th><th>已用</th><th>状态</th><th>操作</th></tr>${rows}</table>
</section>`;
  return layout({ title: '优惠码', active: 'discounts', content });
}

// ---------- reviews ----------
function reviews() {
  const list = db.load('reviews', []);
  const products = db.load('products', []);
  const pName = pid => products.find(p => p.id === pid)?.name || pid;
  const section = (title, items, showActions) => `
  <section class="panel"><h2>${title}（${items.length}）</h2>
  ${items.length ? items.map(r => `
    <div class="review-row">
      <div><b>${esc(pName(r.productId))}</b> · ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} · ${esc(r.name)} · <span class="muted small">${fmtDate(r.createdAt)}</span>
      <p>${esc(r.text)}</p></div>
      ${showActions ? `<div class="review-actions">
        <form method="POST" action="/admin/reviews/${r.id}/approve" class="inline"><button class="btn btn-primary btn-sm">通过</button></form>
        <form method="POST" action="/admin/reviews/${r.id}/reject" class="inline"><button class="btn btn-ghost btn-sm">拒绝</button></form>
      </div>` : ''}
    </div>`).join('') : '<p class="muted">暂无。评价只能由真实订单的客户通过邮件邀请链接提交 — 我们不造假评（文档 §11）。</p>'}
  </section>`;
  const content =
    section('待审核', list.filter(r => r.status === 'pending'), true) +
    section('已发布', list.filter(r => r.status === 'approved'), false) +
    section('已拒绝', list.filter(r => r.status === 'rejected'), false);
  return layout({ title: '评价审核', active: 'reviews', content });
}

// ---------- subscribers ----------
function subscribers() {
  const list = db.load('subscribers', []);
  const rows = list.map(s => `<tr><td>${esc(s.email)}</td><td>${fmtDate(s.createdAt, true)}</td>
    <td>${s.sent2 ? '✓' : '—'} / ${s.sent3 ? '✓' : '—'}</td></tr>`).join('');
  const content = `
<section class="panel">
  <p class="muted">欢迎邮件第 1 封在订阅时立即发送；第 2/3 封由自动化在第 2/4 天发送（可在邮件中心调整）。</p>
  ${list.length ? `<table class="tbl"><tr><th>邮箱</th><th>订阅时间</th><th>欢迎邮件 2/3 已发</th></tr>${rows}</table>` : '<p class="muted">暂无订阅者。前台页脚订阅框可获取。</p>'}
</section>`;
  return layout({ title: '订阅者', active: 'subscribers', content });
}

// ---------- messages ----------
function messages() {
  const list = db.load('messages', []);
  const rows = list.map(m => `
    <div class="msg-row ${m.status === 'open' ? 'open' : ''}">
      <div class="msg-head"><b>${esc(m.name)}</b> &lt;${esc(m.email)}&gt; · ${esc(m.topic)} ${m.orderNumber ? '· 订单 ' + esc(m.orderNumber) : ''} · <span class="muted small">${fmtDate(m.createdAt, true)}</span>
        <form method="POST" action="/admin/messages/${m.id}/close" class="inline"><button class="btn btn-ghost btn-sm">${m.status === 'open' ? '标记已处理' : '重新打开'}</button></form>
      </div>
      <p>${esc(m.message)}</p>
      <p class="muted small">回复方式：直接用你的客服邮箱回信至 ${esc(m.email)}</p>
    </div>`).join('');
  const content = `<section class="panel">${list.length ? rows : '<p class="muted">暂无客服消息。</p>'}</section>`;
  return layout({ title: '客服消息', active: 'messages', content });
}

// ---------- email center ----------
function emailCenter() {
  const outbox = db.load('outbox', []);
  const settings = db.load('settings', {});
  const auto = settings.emailAutomation || {};
  const smtpOk = settings.smtp?.host && settings.smtp?.user;
  const kindNames = {
    order_confirmation: '订单确认', shipping_notice: '发货通知', refund_notice: '退款通知',
    review_invitation: '评价邀请', welcome_1: '欢迎①', welcome_2: '欢迎②', welcome_3: '欢迎③',
    abandoned_1: '弃购提醒①', abandoned_2: '弃购提醒②', contact_autoreply: '客服自动回复'
  };
  const rows = outbox.slice(0, 100).map(m => `
    <tr><td>${fmtDate(m.createdAt, true)}</td><td>${esc(kindNames[m.kind] || m.kind)}</td><td>${esc(m.to)}</td><td>${esc(m.subject)}</td>
    <td>${m.status === 'sent' ? '<span class="st st-green">已发送</span>' : m.status === 'failed' ? `<span class="st st-red" title="${esc(m.error || '')}">失败</span>` : '<span class="st st-orange">发件箱</span>'}</td>
    <td><button class="btn btn-ghost btn-sm" onclick="showMail('${m.id}')">预览</button></td></tr>`).join('');
  const mailData = {};
  outbox.slice(0, 100).forEach(m => { mailData[m.id] = m.html; });

  const content = `
${smtpOk ? '' : `<div class="hint-box">📮 尚未配置 SMTP：所有邮件进入下方"发件箱"供预览（闭环照常可测）。在 <a href="/admin/settings">设置 → SMTP</a> 填入品牌邮箱后即可真实发送。</div>`}
<section class="panel">
  <h2>自动化规则（文档 §8）</h2>
  <form method="POST" action="/admin/emails/automation" class="inline-form wrap-form">
    <label class="check-inline"><input type="checkbox" name="enabled" ${auto.enabled !== false ? 'checked' : ''}> 启用自动化</label>
    <label>弃购邮件① 延迟(小时) <input name="abandoned1Hours" type="number" step="0.5" value="${auto.abandoned1Hours ?? 1}" style="width:90px"></label>
    <label>弃购邮件② 延迟(小时) <input name="abandoned2Hours" type="number" step="1" value="${auto.abandoned2Hours ?? 24}" style="width:90px"></label>
    <label>评价邀请 发货后(天) <input name="reviewInviteDays" type="number" value="${auto.reviewInviteDays ?? 12}" style="width:90px"></label>
    <button class="btn btn-primary">保存</button>
  </form>
  <p class="muted small">自动流：订阅 → 欢迎①(即时)/②(第2天)/③(第4天) · 结账留邮箱未支付 → 弃购①/② · 支付 → 订单确认 · 发货 → 物流通知 → N 天后评价邀请 · 退款 → 退款通知</p>
</section>
<section class="panel">
  <h2>发件记录（最近 100 封）</h2>
  ${outbox.length ? `<table class="tbl"><tr><th>时间</th><th>类型</th><th>收件人</th><th>主题</th><th>状态</th><th></th></tr>${rows}</table>` : '<p class="muted">暂无邮件。触发方式：前台订阅、下单、后台发货/退款。</p>'}
</section>
<div class="mail-modal" id="mailModal" hidden><div class="mail-modal-in"><button class="mail-close" onclick="document.getElementById('mailModal').hidden=true">✕ 关闭</button><iframe id="mailFrame"></iframe></div></div>
<script>window.__MAILS=${JSON.stringify(mailData)};
function showMail(id){var m=document.getElementById('mailModal');m.hidden=false;document.getElementById('mailFrame').srcdoc=window.__MAILS[id]||'';}</script>`;
  return layout({ title: '邮件中心', active: 'emails', content });
}

// ---------- ad tests ----------
function ads() {
  const list = db.load('adtests', []);
  const products = db.load('products', []);
  const rows = list.map(a => {
    const ctr = a.impressions ? (a.clicks / a.impressions * 100) : 0;
    const cpc = a.clicks ? (a.spend / a.clicks) : 0;
    const atcRate = a.clicks ? (a.addToCarts / a.clicks * 100) : 0;
    const cvr = a.clicks ? (a.orders / a.clicks * 100) : 0;
    const cac = a.orders ? (a.spend / a.orders) : 0;
    const margin = a.unitMargin || 0;
    // 停止规则（文档 §7）
    let verdict = '';
    if (margin > 0 && a.spend >= margin * 2 && a.addToCarts === 0) verdict = '<span class="st st-red">⛔ 停素材：花费≥2×毛利仍无加购</span>';
    else if (margin > 0 && a.spend >= margin * 3 && a.orders === 0) verdict = '<span class="st st-red">⛔ 停产品或重做页面：花费≥3×毛利仍无购买</span>';
    else if (a.addToCarts > 0 && a.orders === 0) verdict = '<span class="st st-orange">⚠ 有加购无购买：查运费/结账/信任感/价格</span>';
    else if (a.orders > 0 && cac > 0 && margin > 0) verdict = cac <= margin ? '<span class="st st-green">✓ CAC 低于单单毛利，可加预算</span>' : '<span class="st st-red">CAC 高于毛利，越卖越亏</span>';
    const pill = (val, ok, text) => `<span class="${ok === null ? '' : ok ? 'green' : 'red'}">${text}</span>`;
    return `<tr>
      <td><b>${esc(a.name)}</b><br><span class="muted small">${esc(a.channel)} · ${esc(products.find(p => p.id === a.productId)?.name || '')}</span></td>
      <td>${money(a.spend)}</td>
      <td>${pill(ctr, a.impressions ? ctr > 1.5 : null, ctr.toFixed(2) + '%')}<br><span class="muted small">目标 >1.5%</span></td>
      <td>${pill(cpc, a.clicks ? cpc < 150 : null, money(Math.round(cpc)))}<br><span class="muted small">目标 <$1.5</span></td>
      <td>${pill(atcRate, a.clicks ? atcRate > 3 : null, atcRate.toFixed(1) + '%')}<br><span class="muted small">目标 >3%</span></td>
      <td>${pill(cvr, a.orders ? (cvr >= 0.5) : null, cvr.toFixed(2) + '%')}<br><span class="muted small">正常 0.5–2%</span></td>
      <td>${a.orders ? money(Math.round(cac)) : '—'}<br><span class="muted small">须低于毛利 ${margin ? money(margin) : ''}</span></td>
      <td>${verdict || '<span class="muted">数据不足</span>'}
        <form method="POST" action="/admin/ads/${a.id}/delete" class="inline"><button class="btn btn-ghost btn-sm">删</button></form></td>
    </tr>`;
  }).join('');
  const content = `
<div class="hint-box">投放前提（文档 §7）：支付成功 ✓ 退款成功 ✓ 像素购买事件正常 ✓ 产品页移动端体验 ✓ 物流/退货政策清楚 ✓ 至少 3 个素材、2 个落地页角度。首轮：7 天 · $20–50/天 · 1–3 个产品。</div>
<section class="panel">
  <h2>记录一轮测试</h2>
  <form method="POST" action="/admin/ads" class="inline-form wrap-form">
    <input name="name" placeholder="测试名 如 羽毛棒-素材A" required>
    <select name="channel"><option>元广告</option><option>抖音海外版</option><option>谷歌</option><option>图片种草</option><option>其他</option></select>
    <select name="productId"><option value="">关联产品…</option>${products.map(p => `<option value="${p.id}">${esc(productDisplayName(p))}</option>`).join('')}</select>
    <input name="spend" type="number" step="0.01" placeholder="花费 $" required>
    <input name="impressions" type="number" placeholder="展示">
    <input name="clicks" type="number" placeholder="点击">
    <input name="addToCarts" type="number" placeholder="加购">
    <input name="orders" type="number" placeholder="订单">
    <input name="revenue" type="number" step="0.01" placeholder="销售额 $">
    <input name="unitMargin" type="number" step="0.01" placeholder="单单毛利 $">
    <button class="btn btn-primary">保存</button>
  </form>
</section>
<section class="panel">
  ${list.length ? `<table class="tbl"><tr><th>测试</th><th>花费</th><th>CTR</th><th>CPC</th><th>加购率</th><th>转化率</th><th>CAC</th><th>判定（自动按文档规则）</th></tr>${rows}</table>` : '<p class="muted">暂无记录。每轮广告测试结束后把数据填进来，系统按文档 §7 的判断标准自动给出继续/停止建议。</p>'}
</section>`;
  return layout({ title: '广告测试', active: 'ads', content });
}

// ---------- checklist ----------
function autoChecks() {
  const settings = db.load('settings', {});
  const orders = db.load('orders', []);
  const products = db.load('products', []).filter(p => p.status === 'published');
  const outbox = db.load('outbox', []);
  return {
    pay_test: orders.some(o => ['paid', 'fulfilled', 'delivered', 'refunded'].includes(o.status)),
    refund_test: orders.some(o => (o.refunds || []).length),
    compliance_check: products.length > 0 && products.every(p => scoreTotal(p) >= 24),
    policy_pages: true,
    pixels_ok: !!(settings.pixels?.ga4 || settings.pixels?.meta || settings.pixels?.tiktok),
    email_automation: settings.emailAutomation?.enabled !== false && outbox.some(m => m.kind === 'order_confirmation'),
    logistics_policy: !!(settings.shipping?.transitDays && settings.shipping?.handlingDays),
    support_email: !!settings.store?.supportEmail && !settings.store.supportEmail.includes('example.com')
  };
}

function checklist() {
  const cl = db.load('checklist', {});
  const auto = autoChecks();
  const hints = {
    entity_payment: '确认经营主体（个人/香港公司/美国 LLC）→ 按主体确认 Stripe/PayPal 可用性 → 完成 $50–100 测试收款、退款、提现（文档 §2）',
    pay_test: '在前台下一笔订单并支付成功（测试模式或真实网关小额）',
    refund_test: '在订单详情执行一次退款（全额或部分）',
    payout_test: '从 Stripe/PayPal 提现到银行/Wise，确认到账和费用',
    compliance_check: '所有上架产品选品评分 ≥24、非入口品类、无医疗宣称',
    policy_pages: '关于我们/联系我们/物流政策/退换货政策/隐私政策/服务条款/ Cookie 政策/常见问题 已内置于页脚',
    mobile_test: '用手机走完 首页→产品页→购物车→结账 全流程',
    pixels_ok: '在设置里填入统计和广告像素编号，并用一笔测试单验证购买事件',
    email_automation: '触发一遍订单确认/发货/弃购邮件（未配 SMTP 时查看发件箱）',
    logistics_policy: '运费规则和"预计不保证"时效已在政策页写明',
    support_email: '设置 → 店铺信息 填入品牌邮箱（如 support@yourdomain.com）并配置 SMTP',
    no_fake: '人工确认：无假评论、无水印/盗用图、无夸张功效宣称',
    ad_budget: '按 §7 准备 7 天 × $20–50/天 预算和停止规则'
  };
  const rows = checklistItems.map(item => {
    const isAuto = !item.manual;
    const autoOk = isAuto ? auto[item.key] : null;
    const manualOk = cl[item.key]?.checked;
    const ok = isAuto ? autoOk : manualOk;
    return `<div class="check-row ${ok ? 'ok' : ''}">
      <div class="check-mark">${ok ? '✅' : '⬜'}</div>
      <div class="check-body">
        <b>${esc(item.label)}</b> ${isAuto ? '<span class="st st-blue small">自动检测</span>' : '<span class="st st-gray small">人工确认</span>'}
        <p class="muted small">${hints[item.key] || ''}</p>
      </div>
      ${item.manual ? `<form method="POST" action="/admin/checklist/${item.key}">
        <input type="hidden" name="checked" value="${manualOk ? '' : 'on'}">
        <button class="btn ${manualOk ? 'btn-ghost' : 'btn-primary'} btn-sm">${manualOk ? '取消勾选' : '标记完成'}</button>
      </form>` : ''}
    </div>`;
  }).join('');
  const done = checklistItems.filter(i => (i.manual ? cl[i.key]?.checked : autoChecks()[i.key])).length;
  const content = `
<section class="panel">
  <h2>最终上线前验收表（文档 §14）— ${done}/${checklistItems.length} 完成</h2>
  <div class="progress-line"><span style="width:${Math.round(done / checklistItems.length * 100)}%"></span></div>
  ${rows}
</section>`;
  return layout({ title: '上线验收', active: 'checklist', content });
}

// ---------- settings ----------
function settingsPage({ msg, err }) {
  const s = db.load('settings', {});
  const st = s.store || {}, sh = s.shipping || {}, pay = s.payments || {}, px = s.pixels || {}, smtp = s.smtp || {}, risk = s.risk || {};
  const content = `
${msg ? `<p class="form-success">${esc(msg)}</p>` : ''}${err ? `<p class="form-error">${esc(err)}</p>` : ''}
<div class="grid-2">
<section class="panel">
  <h2>店铺信息</h2>
  <form method="POST" action="/admin/settings/store">
    <label>店铺名 <input name="name" value="${esc(st.name || '')}"></label>
    <label>品牌标语 <input name="tagline" value="${esc(st.tagline || '')}"></label>
    <label>正式域名（部署后填，如 mewmewco.com）<input name="domain" value="${esc(st.domain || '')}" placeholder="留空=本地测试"></label>
    <label>客服邮箱（上线前务必替换占位符）<input name="supportEmail" value="${esc(st.supportEmail || '')}"></label>
    <label>目标市场 <input name="market" value="${esc(st.market || '美国')}"></label>
    <button class="btn btn-primary">保存</button>
  </form>
</section>
<section class="panel">
  <h2>运费规则</h2>
  <form method="POST" action="/admin/settings/shipping">
    <div class="form-row-4">
      <label>免邮门槛 $ <input name="freeThreshold" type="number" step="0.01" value="${((sh.freeThreshold ?? 3500) / 100).toFixed(2)}"></label>
      <label>标准运费 $ <input name="standardRate" type="number" step="0.01" value="${((sh.standardRate ?? 495) / 100).toFixed(2)}"></label>
      <label>处理时效(工作日) <input name="handlingDays" value="${esc(sh.handlingDays || '1-3')}"></label>
      <label>运输时效(工作日) <input name="transitDays" value="${esc(sh.transitDays || '7-15')}"></label>
    </div>
    <label>可配送国家（逗号分隔）<input name="countries" value="${esc((sh.countries || []).join(', '))}"></label>
    <label>关税说明（显示在结账页/FAQ）<textarea name="dutiesNote" rows="2">${esc(sh.dutiesNote || '')}</textarea></label>
    <button class="btn btn-primary">保存</button>
  </form>
</section>
<section class="panel">
  <h2>支付（文档 §2：先确认主体与收款路径）</h2>
  <form method="POST" action="/admin/settings/payments">
    <label>收款模式 <select name="mode">
      <option value="test" ${pay.mode === 'test' ? 'selected' : ''}>🧪 测试模式（模拟支付，跑通闭环用）</option>
      <option value="stripe" ${pay.mode === 'stripe' ? 'selected' : ''}>💳 Stripe 结账（需海外主体开通）</option>
      <option value="alipay" ${pay.mode === 'alipay' ? 'selected' : ''}>💙 支付宝国际收款（通过 Stripe 开通）</option>
      <option value="paypal" ${pay.mode === 'paypal' ? 'selected' : ''}>🅿️ PayPal（企业账号）</option>
    </select></label>
    <label>Stripe 密钥（信用卡/支付宝国际共用）<input name="stripeSecretKey" value="${esc(pay.stripe?.secretKey || '')}" placeholder="sk_test_... 或 sk_live_..."></label>
    <label>Stripe 公开密钥（信用卡/支付宝国际共用）<input name="stripePublishableKey" value="${esc(pay.stripe?.publishableKey || '')}" placeholder="pk_..."></label>
    <label>PayPal 客户端编号 <input name="paypalClientId" value="${esc(pay.paypal?.clientId || '')}"></label>
    <label>PayPal 密钥 <input name="paypalSecret" type="password" value="${esc(pay.paypal?.secret || '')}"></label>
    <label class="check-inline"><input type="checkbox" name="paypalSandbox" ${pay.paypal?.sandbox !== false ? 'checked' : ''}> PayPal 沙箱模式（真实收款前取消勾选）</label>
    <div class="hint-box small">上线前按文档完成：$50–100 测试收款 → 退款 → 提现全链路。中国大陆个人主体不能直接开 Stripe，先确认主体（香港公司/美国 LLC/第三方跨境收款）。</div>
    <button class="btn btn-primary">保存</button>
  </form>
</section>
<section class="panel">
  <h2>数据追踪像素（文档第 6 天）</h2>
  <form method="POST" action="/admin/settings/pixels">
    <label>谷歌统计衡量编号 <input name="ga4" value="${esc(px.ga4 || '')}" placeholder="G-XXXXXXXXXX"></label>
    <label>元广告像素编号 <input name="meta" value="${esc(px.meta || '')}" placeholder="1234567890"></label>
    <label>抖音海外版像素编号 <input name="tiktok" value="${esc(px.tiktok || '')}" placeholder="投抖音海外版才需要"></label>
    <div class="hint-box small">合规：像素只在访客点击 Cookie 横幅“同意”后加载；店铺自带第一方匿名统计驱动仪表盘，不依赖第三方。</div>
    <button class="btn btn-primary">保存</button>
  </form>
</section>
<section class="panel">
  <h2>SMTP 邮件发送</h2>
  <form method="POST" action="/admin/settings/smtp">
    <div class="form-row-4">
      <label>邮件服务器地址 <input name="host" value="${esc(smtp.host || '')}" placeholder="smtp.zoho.com"></label>
      <label>端口 <input name="port" type="number" value="${smtp.port || 465}"></label>
    </div>
    <label class="check-inline"><input type="checkbox" name="secure" ${smtp.secure !== false ? 'checked' : ''}> 加密连接</label>
    <label>用户名 <input name="user" value="${esc(smtp.user || '')}" placeholder="support@yourdomain.com"></label>
    <label>密码/应用专用密码 <input name="pass" type="password" value="${esc(smtp.pass || '')}"></label>
    <label>发件人显示 <input name="from" value="${esc(smtp.from || '')}" placeholder='"MewMew Co" &lt;support@yourdomain.com&gt;'></label>
    <div class="hint-box small">未配置时邮件进入“邮件中心 → 发件箱”供预览，闭环照常可测。推荐使用品牌域名邮箱。</div>
    <button class="btn btn-primary">保存</button>
  </form>
</section>
<section class="panel">
  <h2>风控阈值（文档 §11）</h2>
  <form method="POST" action="/admin/settings/risk">
    <div class="form-row-4">
      <label>高客单标记 $ <input name="highValue" type="number" step="0.01" value="${((risk.highValueCents ?? 15000) / 100).toFixed(2)}"></label>
      <label>同 IP 24h 订单数 ≥ <input name="ipOrders24h" type="number" value="${risk.ipOrders24h ?? 3}"></label>
    </div>
    <button class="btn btn-primary">保存</button>
  </form>
</section>
<section class="panel">
  <h2>修改管理员密码</h2>
  <form method="POST" action="/admin/settings/password">
    <label>当前密码 <input name="currentPassword" type="password" required></label>
    <label>新密码（至少 8 位）<input name="newPassword" type="password" required minlength="8"></label>
    <button class="btn btn-primary">修改密码</button>
  </form>
</section>
</div>`;
  return layout({ title: '设置', active: 'settings', content });
}

module.exports = { login, dashboard, orders, orderDetail, products, productEdit, discounts, reviews, subscribers, messages, emailCenter, ads, checklist, settingsPage };
