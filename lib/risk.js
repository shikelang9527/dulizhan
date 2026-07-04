'use strict';
// Order risk flags per playbook §11: address mismatch, high-value first
// order, multiple orders from the same IP in 24h. Flagged orders default to
// "needs manual review" — fulfill only after a human has reviewed them.
const db = require('./db');

function assess(order, allOrders) {
  const settings = db.load('settings', {});
  const risk = settings.risk || {};
  const flags = [];

  const ship = order.shipping || {};
  const bill = order.billing || {};
  if (!order.billingSameAsShipping) {
    if ((bill.state && ship.state && bill.state !== ship.state) ||
        (bill.country && ship.country && bill.country !== ship.country)) {
      flags.push({ key: 'address_mismatch', label: '账单/配送地址差异较大' });
    }
  }

  const prior = allOrders.filter(o =>
    o.id !== order.id && o.email === order.email &&
    ['paid', 'fulfilled', 'delivered'].includes(o.status));
  if (order.totalCents >= (risk.highValueCents || 15000) && prior.length === 0) {
    flags.push({ key: 'high_value_first', label: '高客单首单' });
  }

  if (order.ip) {
    const dayAgo = Date.now() - 864e5;
    const sameIp = allOrders.filter(o =>
      o.id !== order.id && o.ip === order.ip && o.createdAt > dayAgo);
    if (sameIp.length + 1 >= (risk.ipOrders24h || 3)) {
      flags.push({ key: 'multi_ip', label: `同 IP 24h 内多笔订单（${sameIp.length + 1} 笔）` });
    }
  }

  return flags;
}

module.exports = { assess };
