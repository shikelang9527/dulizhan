'use strict';
// Simple JSON-file datastore with atomic writes. Suited to an early-stage
// store (low write volume); swap for SQLite/Postgres when order volume grows.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const cache = new Map();

function fileOf(name) {
  return path.join(DATA_DIR, name + '.json');
}

function load(name, fallback) {
  if (cache.has(name)) return cache.get(name);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(fileOf(name), 'utf8'));
  } catch {
    data = typeof fallback === 'function' ? fallback() : (fallback ?? []);
  }
  cache.set(name, data);
  return data;
}

function save(name, data) {
  if (data !== undefined) cache.set(name, data);
  const payload = JSON.stringify(cache.get(name), null, 2);
  const file = fileOf(name);
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, payload);
  fs.renameSync(tmp, file);
}

// Collections used across the app (all arrays unless noted):
// settings (object), products, orders, discounts, subscribers, messages,
// reviews, events, outbox, checkouts, adtests, checklist (object)

module.exports = { load, save, DATA_DIR };
