'use strict';
// Email templates + automation per playbook §8:
// welcome ×3, abandoned-cart ×2, order confirmation, shipping notice,
// review invitation (with disclosure-safe wording), refund notice.
const db = require('./db');
const mailer = require('./mailer');
const { money, escapeHtml, sign } = require('./util');

function store() { return db.load('settings', {}).store || {}; }
function baseUrl() {
  const s = db.load('settings', {});
  return s.store?.domain ? 'https://' + s.store.domain.replace(/^https?:\/\//, '') : 'http://localhost:4180';
}

function layout(title, bodyHtml) {
  const s = store();
  return `<!doctype html><html><body style="margin:0;padding:0;background:#faf6f0;font-family:Arial,Helvetica,sans-serif;color:#3d3129;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="text-align:center;padding:18px 0;">
      <span style="font-size:22px;font-weight:bold;color:#e8734a;">🐾 ${escapeHtml(s.name || 'MewMew Co')}</span>
    </div>
    <div style="background:#ffffff;border-radius:14px;padding:28px 26px;border:1px solid #f0e6da;">
      <h1 style="font-size:19px;margin:0 0 14px;">${title}</h1>
      ${bodyHtml}
    </div>
    <p style="font-size:11px;color:#a89a8c;text-align:center;line-height:1.6;margin-top:18px;">
      ${escapeHtml(s.name || '')} · Questions? Reply to this email or write to ${escapeHtml(s.supportEmail || '')}<br>
      You received this email because of your order or subscription at our store.
    </p>
  </div></body></html>`;
}

function btn(href, label) {
  return `<p style="text-align:center;margin:22px 0;"><a href="${href}" style="background:#e8734a;color:#fff;text-decoration:none;padding:12px 26px;border-radius:999px;font-weight:bold;display:inline-block;">${label}</a></p>`;
}

function orderTable(order) {
  const rows = order.items.map(i =>
    `<tr><td style="padding:6px 0;border-bottom:1px solid #f0e6da;">${escapeHtml(i.name)} × ${i.qty}</td>
     <td style="padding:6px 0;border-bottom:1px solid #f0e6da;text-align:right;">${money(i.price * i.qty)}</td></tr>`).join('');
  const discount = order.discountCents ? `<tr><td style="padding:6px 0;">Discount (${escapeHtml(order.discountCode || '')})</td><td style="text-align:right;">-${money(order.discountCents)}</td></tr>` : '';
  return `<table style="width:100%;font-size:14px;border-collapse:collapse;">${rows}
    <tr><td style="padding:6px 0;">Shipping</td><td style="text-align:right;">${order.shippingCents ? money(order.shippingCents) : 'FREE'}</td></tr>
    ${discount}
    <tr><td style="padding:8px 0;font-weight:bold;">Total</td><td style="text-align:right;font-weight:bold;">${money(order.totalCents)}</td></tr></table>`;
}

async function orderConfirmation(order) {
  const url = `${baseUrl()}/order/confirm/${order.id}?t=${sign(order.id)}`;
  return mailer.send({
    to: order.email, kind: 'order_confirmation', meta: { orderId: order.id },
    subject: `Order ${order.number} confirmed — thank you! 🐾`,
    html: layout(`Thanks for your order, ${escapeHtml(order.shipping.firstName || 'friend')}!`, `
      <p style="font-size:14px;line-height:1.7;">We've received your order <b>${order.number}</b> and it's now being prepared. We'll email you tracking details as soon as it ships (typically within ${escapeHtml(db.load('settings', {}).shipping?.handlingDays || '1-3')} business days).</p>
      ${orderTable(order)}
      ${btn(url, 'View your order')}
      <p style="font-size:12px;color:#8c7d6f;line-height:1.6;">Estimated delivery: ${escapeHtml(db.load('settings', {}).shipping?.transitDays || '7-15')} business days after dispatch (estimate, not a guarantee). See our Shipping Policy for details.</p>`)
  });
}

async function shippingNotice(order) {
  const url = `${baseUrl()}/track-order`;
  return mailer.send({
    to: order.email, kind: 'shipping_notice', meta: { orderId: order.id },
    subject: `Your order ${order.number} is on its way 📦`,
    html: layout('Good news — your order has shipped!', `
      <p style="font-size:14px;line-height:1.7;">Order <b>${order.number}</b> left our warehouse.</p>
      <p style="font-size:14px;line-height:1.7;">Carrier: <b>${escapeHtml(order.carrier || '—')}</b><br>
      Tracking number: <b>${escapeHtml(order.trackingNumber || '—')}</b></p>
      <p style="font-size:13px;color:#8c7d6f;">Tracking usually starts updating within 2–5 days. Estimated transit: ${escapeHtml(db.load('settings', {}).shipping?.transitDays || '7-15')} business days (estimate).</p>
      ${btn(url, 'Track your order')}`)
  });
}

async function refundNotice(order, amountCents, partial) {
  return mailer.send({
    to: order.email, kind: 'refund_notice', meta: { orderId: order.id },
    subject: `Refund issued for order ${order.number}`,
    html: layout(partial ? 'Your partial refund is on its way' : 'Your refund is on its way', `
      <p style="font-size:14px;line-height:1.7;">We've issued a refund of <b>${money(amountCents)}</b> for order <b>${order.number}</b>.</p>
      <p style="font-size:14px;line-height:1.7;">Depending on your bank or payment provider, it typically takes 5–10 business days to appear on your statement.</p>
      <p style="font-size:13px;color:#8c7d6f;">If you have any questions, just reply to this email.</p>`)
  });
}

async function reviewInvitation(order) {
  const url = `${baseUrl()}/review/${order.id}?t=${sign('review:' + order.id)}`;
  return mailer.send({
    to: order.email, kind: 'review_invitation', meta: { orderId: order.id },
    subject: `How is everything with your ${store().name || ''} order?`,
    html: layout('How are the new goodies working out?', `
      <p style="font-size:14px;line-height:1.7;">Your order <b>${order.number}</b> should have arrived by now. If anything isn't right, reply to this email and we'll fix it first.</p>
      <p style="font-size:14px;line-height:1.7;">If you have a minute, an honest review helps other pet parents choose well. Good or bad — we publish real reviews only, and there's no reward attached, so it's 100% your call.</p>
      ${btn(url, 'Write a review')}`)
  });
}

async function welcome1(email, discountCode) {
  return mailer.send({
    to: email, kind: 'welcome_1',
    subject: `Welcome to ${store().name || 'our store'} — here's 10% off 🐾`,
    html: layout('Welcome to the family!', `
      <p style="font-size:14px;line-height:1.7;">We're ${escapeHtml(store().name || '')} — we design and curate simple, safe, non-gimmicky gear for cats and dogs: toys, grooming tools, beds and walk accessories. No food, no meds, no miracle claims.</p>
      <p style="font-size:14px;line-height:1.7;">Here's <b>10% off your first order</b>:</p>
      <p style="text-align:center;font-size:22px;letter-spacing:2px;font-weight:bold;background:#fdf1ea;border:1px dashed #e8734a;border-radius:10px;padding:12px;">${escapeHtml(discountCode || 'WELCOME10')}</p>
      ${btn(baseUrl() + '/shop', 'Shop bestsellers')}`)
  });
}

async function welcome2(email) {
  return mailer.send({
    to: email, kind: 'welcome_2',
    subject: 'Three little upgrades your pet will notice',
    html: layout('Small things, big tail wags', `
      <p style="font-size:14px;line-height:1.7;">Our three most-loved picks and when they shine:</p>
      <ul style="font-size:14px;line-height:1.9;padding-left:18px;">
        <li><b>Whisker Chase Feather Wand</b> — 10 minutes of play before dinner works wonders for indoor cats.</li>
        <li><b>SniffQuest Snuffle Mat</b> — rainy-day nose work for dogs that gulp their food.</li>
        <li><b>FurAway Roller</b> — the sofa, de-furred in a minute, no refills ever.</li>
      </ul>
      ${btn(baseUrl() + '/shop', 'See them all')}`)
  });
}

async function welcome3(email) {
  return mailer.send({
    to: email, kind: 'welcome_3',
    subject: 'Our promises to you (and your pet)',
    html: layout('Why shopping with us is low-risk', `
      <ul style="font-size:14px;line-height:1.9;padding-left:18px;">
        <li><b>30-day returns</b> — unused items in original packaging, no interrogation.</li>
        <li><b>Damaged or wrong item?</b> Photo within 48h of delivery → we reship or refund.</li>
        <li><b>Real reviews only</b> — we never buy or fabricate reviews.</li>
        <li><b>Human support</b> — email us and a person answers.</li>
      </ul>
      <p style="font-size:14px;line-height:1.7;">Questions before you order? Just reply — we read everything.</p>
      ${btn(baseUrl() + '/faq', 'Read the FAQ')}`)
  });
}

async function abandoned1(checkout) {
  const url = `${baseUrl()}/cart?restore=${encodeURIComponent(checkout.id)}`;
  const names = (checkout.items || []).map(i => escapeHtml(i.name)).join(', ');
  return mailer.send({
    to: checkout.email, kind: 'abandoned_1', meta: { checkoutId: checkout.id },
    subject: 'You left something behind 🐾',
    html: layout('Still thinking it over?', `
      <p style="font-size:14px;line-height:1.7;">Your cart is saved: <b>${names}</b>.</p>
      <p style="font-size:14px;line-height:1.7;">Checkout takes under a minute, and our 30-day return policy has your back.</p>
      ${btn(url, 'Return to your cart')}`)
  });
}

async function abandoned2(checkout) {
  const url = `${baseUrl()}/cart?restore=${encodeURIComponent(checkout.id)}`;
  return mailer.send({
    to: checkout.email, kind: 'abandoned_2', meta: { checkoutId: checkout.id },
    subject: 'Free US shipping over $35 — your cart qualifies?',
    html: layout('A little nudge (the last one, promise)', `
      <p style="font-size:14px;line-height:1.7;">Quick reminders while your cart is still saved:</p>
      <ul style="font-size:14px;line-height:1.9;padding-left:18px;">
        <li>Free US shipping on orders over $35</li>
        <li>30-day returns on unused items</li>
        <li>Damaged in transit? We reship or refund — photo within 48h is all we need</li>
      </ul>
      ${btn(url, 'Finish checkout')}`)
  });
}

async function contactAutoReply(email, name) {
  return mailer.send({
    to: email, kind: 'contact_autoreply',
    subject: `We got your message — ${store().name || ''}`,
    html: layout(`Thanks, ${escapeHtml(name || 'friend')} — message received`, `
      <p style="font-size:14px;line-height:1.7;">A real human will reply within 1 business day (usually much faster).</p>
      <p style="font-size:14px;line-height:1.7;">If it's about an existing order, including your order number (MW-XXXXXX) speeds things up.</p>`)
  });
}

// ---- Automation loop (runs every minute from server.js) ----
async function runAutomation() {
  const settings = db.load('settings', {});
  const auto = settings.emailAutomation || {};
  if (auto.enabled === false) return;
  const nowTs = Date.now();

  // Abandoned checkouts: email captured but never converted
  const checkouts = db.load('checkouts', []);
  let dirty = false;
  for (const c of checkouts) {
    if (!c.email || c.converted) continue;
    const ageH = (nowTs - c.createdAt) / 36e5;
    if (!c.sent1 && ageH >= (auto.abandoned1Hours ?? 1)) {
      c.sent1 = true; dirty = true;
      await abandoned1(c).catch(() => {});
    }
    if (!c.sent2 && ageH >= (auto.abandoned2Hours ?? 24)) {
      c.sent2 = true; dirty = true;
      await abandoned2(c).catch(() => {});
    }
  }
  if (dirty) db.save('checkouts');

  // Welcome series 2 & 3 (welcome 1 sends immediately on subscribe)
  const subs = db.load('subscribers', []);
  let sDirty = false;
  for (const s of subs) {
    const ageD = (nowTs - s.createdAt) / 864e5;
    if (!s.sent2 && ageD >= 2) { s.sent2 = true; sDirty = true; await welcome2(s.email).catch(() => {}); }
    if (!s.sent3 && ageD >= 4) { s.sent3 = true; sDirty = true; await welcome3(s.email).catch(() => {}); }
  }
  if (sDirty) db.save('subscribers');

  // Review invitations N days after fulfillment
  const orders = db.load('orders', []);
  let oDirty = false;
  const inviteDays = auto.reviewInviteDays ?? 12;
  for (const o of orders) {
    if (o.status !== 'fulfilled' && o.status !== 'delivered') continue;
    if (o.reviewInviteSent || !o.fulfilledAt) continue;
    if ((nowTs - o.fulfilledAt) / 864e5 >= inviteDays) {
      o.reviewInviteSent = true; oDirty = true;
      await reviewInvitation(o).catch(() => {});
    }
  }
  if (oDirty) db.save('orders');
}

module.exports = {
  orderConfirmation, shippingNotice, refundNotice, reviewInvitation,
  welcome1, welcome2, welcome3, abandoned1, abandoned2, contactAutoReply,
  runAutomation
};
