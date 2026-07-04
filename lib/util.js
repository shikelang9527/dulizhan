'use strict';
const crypto = require('crypto');

const SECRET_FILE = require('path').join(__dirname, '..', 'data', '.secret');
const fs = require('fs');

let _secret = null;
function secret() {
  if (_secret) return _secret;
  try {
    _secret = fs.readFileSync(SECRET_FILE, 'utf8').trim();
  } catch {
    _secret = crypto.randomBytes(32).toString('hex');
    fs.mkdirSync(require('path').dirname(SECRET_FILE), { recursive: true });
    fs.writeFileSync(SECRET_FILE, _secret);
  }
  return _secret;
}

function id(prefix) {
  return (prefix ? prefix + '_' : '') + crypto.randomBytes(8).toString('hex');
}

// Human-friendly order number, e.g. MW-84F2K9
function orderNumber() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[crypto.randomInt(chars.length)];
  return 'MW-' + s;
}

function hashPassword(pw, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(String(pw), salt, 32).toString('hex');
  return salt + ':' + h;
}
function verifyPassword(pw, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, h] = stored.split(':');
  const test = crypto.scryptSync(String(pw), salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(test, 'hex'));
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(String(value)).digest('hex').slice(0, 24);
}
function verifySign(value, sig) {
  try {
    return crypto.timingSafeEqual(Buffer.from(sign(value)), Buffer.from(String(sig)));
  } catch { return false; }
}

function money(cents) {
  return '$' + (cents / 100).toFixed(2);
}
function toCents(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return 0;
  return Math.round(n * 100);
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fmtDate(ts, withTime) {
  if (!ts) return '—';
  const d = new Date(ts);
  const p = n => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  return withTime ? `${date} ${p(d.getHours())}:${p(d.getMinutes())}` : date;
}

function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function isEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

module.exports = { id, orderNumber, hashPassword, verifyPassword, sign, verifySign, money, toCents, escapeHtml, fmtDate, slugify, isEmail, secret };
