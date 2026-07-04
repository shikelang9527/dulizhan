'use strict';
// First-party event log: page_view / view_item / add_to_cart /
// begin_checkout / purchase. Powers the admin dashboard funnel metrics
// (conversion, AOV, refund rate) independent of GA4/Meta/TikTok pixels.
const db = require('./db');
const { id } = require('./util');

const VALID = new Set(['page_view', 'view_item', 'add_to_cart', 'begin_checkout', 'purchase']);

function track(event, visitorId, meta) {
  if (!VALID.has(event)) return;
  const events = db.load('events', []);
  events.push({ id: id('ev'), event, visitorId: visitorId || 'anon', meta: meta || {}, ts: Date.now() });
  if (events.length > 50000) events.splice(0, events.length - 50000);
  db.save('events', events);
}

function summarize(days) {
  const since = Date.now() - days * 864e5;
  const events = db.load('events', []).filter(e => e.ts >= since);
  const orders = db.load('orders', []).filter(o => o.createdAt >= since);

  const visitors = new Set(events.filter(e => e.event === 'page_view').map(e => e.visitorId));
  const carts = new Set(events.filter(e => e.event === 'add_to_cart').map(e => e.visitorId));
  const checkouts = new Set(events.filter(e => e.event === 'begin_checkout').map(e => e.visitorId));

  const paidOrders = orders.filter(o => ['paid', 'fulfilled', 'delivered', 'refunded'].includes(o.status));
  const revenue = paidOrders.reduce((s, o) => s + o.totalCents, 0);
  const refunded = orders.filter(o => o.status === 'refunded' || o.refunds?.length);
  const refundAmount = orders.reduce((s, o) => s + (o.refunds || []).reduce((x, r) => x + r.amountCents, 0), 0);

  const v = visitors.size;
  return {
    days,
    visitors: v,
    pageViews: events.filter(e => e.event === 'page_view').length,
    addToCart: carts.size,
    beginCheckout: checkouts.size,
    orders: paidOrders.length,
    revenueCents: revenue,
    aovCents: paidOrders.length ? Math.round(revenue / paidOrders.length) : 0,
    conversionRate: v ? (paidOrders.length / v * 100) : 0,
    addToCartRate: v ? (carts.size / v * 100) : 0,
    refundOrders: refunded.length,
    refundRate: paidOrders.length ? (refunded.length / paidOrders.length * 100) : 0,
    refundAmountCents: refundAmount
  };
}

module.exports = { track, summarize };
