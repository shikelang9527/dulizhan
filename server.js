'use strict';
const express = require('express');
const path = require('path');
const db = require('./lib/db');
const seed = require('./lib/seed-data');
const emails = require('./lib/emails');
const storefront = require('./routes/storefront');
const api = require('./routes/api');
const admin = require('./routes/admin');
const { notFound } = require('./views/store-pages');

const PORT = process.env.PORT || 4180;
const app = express();

app.disable('x-powered-by');
// behind a tunnel/reverse proxy (Cloudflare, Nginx): trust X-Forwarded-* so
// req.protocol/req.ip reflect the real visitor, not the local hop
app.set('trust proxy', 1);
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));

// tiny cookie parser (request side; express handles res.cookie natively)
app.use((req, res, next) => {
  req.cookies = {};
  const raw = req.headers.cookie;
  if (raw) for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) req.cookies[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  next();
});

// storefront language: ?lang=zh|en switches and persists via cookie
const i18n = require('./lib/i18n');
app.use((req, res, next) => {
  let lang;
  if (req.query.lang === 'zh' || req.query.lang === 'en') {
    lang = req.query.lang;
    res.cookie('mw_lang', lang, { maxAge: 365 * 24 * 3600 * 1000, sameSite: 'lax' });
  } else {
    lang = req.cookies.mw_lang === 'zh' ? 'zh' : 'en';
  }
  req.lang = lang;
  i18n.setContext(lang, req.originalUrl);
  next();
});

app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));

// ---- first-run seeding ----
function ensureSeed() {
  const products = db.load('products', []);
  if (!products.length) db.save('products', seed.products);
  const discounts = db.load('discounts', []);
  if (!discounts.length) db.save('discounts', seed.discounts);
  const settings = db.load('settings', null);
  if (!settings || !settings.store) db.save('settings', seed.defaultSettings);
}
ensureSeed();

app.use('/api', api.router);
app.use('/admin', admin);
app.use('/', storefront);
app.use((req, res) => res.status(404).send(notFound()));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).send(notFound());
});

// ---- email automation loop (abandoned carts, welcome series, review invites) ----
setInterval(() => { emails.runAutomation().catch(e => console.error('[automation]', e.message)); }, 60 * 1000);

app.listen(PORT, () => {
  console.log(`MewMew Co store running:`);
  console.log(`  Storefront  http://localhost:${PORT}`);
  console.log(`  Admin       http://localhost:${PORT}/admin`);
});
