'use strict';
// Payment adapter. mode = test | stripe | alipay | paypal (set in admin settings).
// - test:   simulates success/failure locally so the full order→refund loop
//           can be verified before any real gateway exists (playbook Day 5).
// - stripe: real Stripe Checkout via REST (no SDK needed). Requires secretKey.
// - paypal: real PayPal Orders v2. Requires clientId/secret (sandbox or live).
const db = require('./db');

function settings() { return db.load('settings', {}); }
function mode() { return settings().payments?.mode || 'test'; }

function baseUrl(req) {
  const s = settings();
  if (s.store?.domain) return 'https://' + s.store.domain.replace(/^https?:\/\//, '');
  return `${req.protocol}://${req.get('host')}`;
}

// ---------- Stripe ----------
async function stripeRequest(path, params, secretKey, method = 'POST') {
  const body = params ? new URLSearchParams(params).toString() : undefined;
  const res = await fetch('https://api.stripe.com/v1/' + path, {
    method,
    headers: {
      'Authorization': 'Basic ' + Buffer.from(secretKey + ':').toString('base64'),
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {})
    },
    body
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Stripe error ' + res.status);
  return json;
}

async function createStripeCheckout(order, req, opts = {}) {
  const key = settings().payments.stripe.secretKey;
  if (!key) throw new Error('Stripe secret key not configured');
  const params = {
    'mode': 'payment',
    'success_url': `${baseUrl(req)}/api/pay/stripe/return?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    'cancel_url': `${baseUrl(req)}/checkout?canceled=1`,
    'customer_email': order.email,
    'metadata[orderId]': order.id
  };
  (opts.paymentMethodTypes || []).forEach((type, i) => {
    params[`payment_method_types[${i}]`] = type;
  });
  order.items.forEach((item, i) => {
    params[`line_items[${i}][price_data][currency]`] = 'usd';
    params[`line_items[${i}][price_data][product_data][name]`] = item.name;
    params[`line_items[${i}][price_data][unit_amount]`] = String(item.price);
    params[`line_items[${i}][quantity]`] = String(item.qty);
  });
  let idx = order.items.length;
  if (order.shippingCents > 0) {
    params[`line_items[${idx}][price_data][currency]`] = 'usd';
    params[`line_items[${idx}][price_data][product_data][name]`] = 'Shipping';
    params[`line_items[${idx}][price_data][unit_amount]`] = String(order.shippingCents);
    params[`line_items[${idx}][quantity]`] = '1';
    idx++;
  }
  if (order.discountCents > 0) {
    // Stripe checkout can't take negative lines without Coupons API; create an ad-hoc coupon
    const coupon = await stripeRequest('coupons', {
      'amount_off': String(order.discountCents), 'currency': 'usd', 'duration': 'once'
    }, key);
    params['discounts[0][coupon]'] = coupon.id;
  }
  const session = await stripeRequest('checkout/sessions', params, key);
  return { redirectUrl: session.url, gatewayRef: session.id };
}

async function createAlipayCheckout(order, req) {
  return createStripeCheckout(order, req, { paymentMethodTypes: ['alipay'] });
}

async function confirmStripe(sessionId) {
  const key = settings().payments.stripe.secretKey;
  const session = await stripeRequest('checkout/sessions/' + sessionId, null, key, 'GET');
  return {
    paid: session.payment_status === 'paid',
    paymentIntent: session.payment_intent
  };
}

async function refundStripe(order, amountCents) {
  const key = settings().payments.stripe.secretKey;
  if (!order.paymentIntent) throw new Error('No payment intent stored on order');
  return stripeRequest('refunds', {
    'payment_intent': order.paymentIntent,
    'amount': String(amountCents)
  }, key);
}

// ---------- PayPal ----------
function paypalBase() {
  return settings().payments.paypal.sandbox === false
    ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}
async function paypalToken() {
  const { clientId, secret } = settings().payments.paypal;
  if (!clientId || !secret) throw new Error('PayPal credentials not configured');
  const res = await fetch(paypalBase() + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + secret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description || 'PayPal auth failed');
  return json.access_token;
}

async function createPaypalOrder(order, req) {
  const token = await paypalToken();
  const res = await fetch(paypalBase() + '/v2/checkout/orders', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: order.id,
        amount: { currency_code: 'USD', value: (order.totalCents / 100).toFixed(2) },
        description: `Order ${order.number}`
      }],
      application_context: {
        return_url: `${baseUrl(req)}/api/pay/paypal/return?orderId=${order.id}`,
        cancel_url: `${baseUrl(req)}/checkout?canceled=1`,
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW'
      }
    })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'PayPal order creation failed');
  const approve = (json.links || []).find(l => l.rel === 'approve');
  return { redirectUrl: approve?.href, gatewayRef: json.id };
}

async function capturePaypal(paypalOrderId) {
  const token = await paypalToken();
  const res = await fetch(paypalBase() + `/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'PayPal capture failed');
  const capture = json.purchase_units?.[0]?.payments?.captures?.[0];
  return { paid: json.status === 'COMPLETED', captureId: capture?.id };
}

async function refundPaypal(order, amountCents) {
  const token = await paypalToken();
  if (!order.captureId) throw new Error('No PayPal capture id stored on order');
  const res = await fetch(paypalBase() + `/v2/payments/captures/${order.captureId}/refund`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: { currency_code: 'USD', value: (amountCents / 100).toFixed(2) } })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'PayPal refund failed');
  return json;
}

// ---------- unified refund ----------
async function refund(order, amountCents) {
  const m = order.paymentMethod || 'test';
  if (m === 'stripe' || m === 'alipay') return refundStripe(order, amountCents);
  if (m === 'paypal') return refundPaypal(order, amountCents);
  return { simulated: true }; // test mode
}

module.exports = { mode, createStripeCheckout, createAlipayCheckout, confirmStripe, createPaypalOrder, capturePaypal, refund };
