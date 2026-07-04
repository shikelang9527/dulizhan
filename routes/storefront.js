'use strict';
const express = require('express');
const db = require('../lib/db');
const { verifySign, sign, escapeHtml, isEmail, id } = require('../lib/util');
const pages = require('../views/store-pages');
const policies = require('../views/store-policies');
const emails = require('../lib/emails');
const { t } = require('../lib/i18n');

const router = express.Router();

function products() { return db.load('products', []); }
function settings() { return db.load('settings', {}); }

router.get('/', (req, res) => {
  res.send(pages.home({ products: products() }));
});

router.get('/shop', (req, res) => {
  const category = ['toys', 'grooming', 'beds', 'walk', 'feeding'].includes(req.query.category) ? req.query.category : '';
  res.send(pages.shop({ products: products(), category }));
});

router.get('/products/:slug', (req, res) => {
  const p = products().find(x => x.slug === req.params.slug && x.status === 'published');
  if (!p) return res.status(404).send(pages.notFound());
  res.send(pages.productDetail({ product: p, settings: settings() }));
});

router.get('/cart', (req, res) => res.send(pages.cart({ settings: settings() })));
router.get('/checkout', (req, res) => res.send(pages.checkout({ settings: settings() })));

router.get('/order/confirm/:id', (req, res) => {
  const order = db.load('orders', []).find(o => o.id === req.params.id);
  if (!order || !verifySign(order.id, req.query.t)) return res.status(404).send(pages.notFound());
  res.send(pages.orderConfirm({ order }));
});

router.get('/track-order', (req, res) => {
  res.send(pages.trackOrder({ order: null, error: null, settings: settings() }));
});
router.post('/track-order', (req, res) => {
  const number = String(req.body.number || '').trim().toUpperCase();
  const email = String(req.body.email || '').trim().toLowerCase();
  const order = db.load('orders', []).find(o =>
    o.number === number && o.email.toLowerCase() === email);
  res.send(pages.trackOrder({
    order,
    error: order ? null : t('tr_not_found'),
    settings: settings()
  }));
});

router.get('/contact', (req, res) => {
  res.send(pages.contact({ sent: false, settings: settings() }));
});
router.post('/contact', async (req, res) => {
  const { name, email, orderNumber, topic, message } = req.body;
  if (!isEmail(email) || !String(message || '').trim()) {
    return res.send(pages.contact({ sent: false, settings: settings() }));
  }
  const messages = db.load('messages', []);
  messages.unshift({
    id: id('msg'), name: String(name || '').slice(0, 80), email: email.toLowerCase(),
    orderNumber: String(orderNumber || '').slice(0, 20), topic: String(topic || '').slice(0, 60),
    message: String(message).slice(0, 4000), status: 'open', createdAt: Date.now()
  });
  db.save('messages', messages);
  emails.contactAutoReply(email, name).catch(() => {});
  res.send(pages.contact({ sent: true, settings: settings() }));
});

router.get('/faq', (req, res) => res.send(pages.faq({ settings: settings() })));

// Policy pages
router.get('/pages/:key', (req, res) => {
  const fn = policies.pages[req.params.key];
  if (!fn) return res.status(404).send(pages.notFound());
  res.send(fn());
});

// Review submission (link from post-delivery invitation email)
function reviewOrder(req) {
  const order = db.load('orders', []).find(o => o.id === req.params.orderId);
  if (!order || !verifySign('review:' + order.id, req.query.t)) return null;
  return order;
}
router.get('/review/:orderId', (req, res) => {
  const order = reviewOrder(req);
  if (!order) return res.status(404).send(pages.notFound());
  res.send(pages.reviewForm({ order }));
});
router.post('/review/:orderId', (req, res) => {
  const order = reviewOrder(req);
  if (!order) return res.status(404).send(pages.notFound());
  const { productId, rating, name, text } = req.body;
  const item = order.items.find(i => i.productId === productId);
  const r = parseInt(rating, 10);
  if (!item || !(r >= 1 && r <= 5) || !String(text || '').trim()) {
    return res.send(pages.reviewForm({ order, error: t('rv_fill') }));
  }
  const reviews = db.load('reviews', []);
  if (reviews.some(x => x.orderId === order.id && x.productId === productId)) {
    return res.send(pages.reviewForm({ order, error: t('rv_already') }));
  }
  reviews.unshift({
    id: id('rev'), orderId: order.id, productId,
    rating: r, name: String(name || 'Customer').slice(0, 60), text: String(text).slice(0, 2000),
    status: 'pending', // admin approves; verified because it comes from a real order link
    createdAt: Date.now()
  });
  db.save('reviews', reviews);
  res.send(pages.reviewForm({ order, done: true }));
});

module.exports = router;
