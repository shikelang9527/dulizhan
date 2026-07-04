'use strict';
const { storeLayout } = require('../lib/render');
const { money, escapeHtml, fmtDate } = require('../lib/util');
const db = require('../lib/db');
const { categories } = require('../lib/seed-data');
const { t, lang, pick } = require('../lib/i18n');

function catName(key) {
  const c = categories.find(c => c.key === key);
  if (!c) return key;
  return lang() === 'zh' && c.zh ? c.zh : c.name;
}
// product content helpers (fall back to English when no zh copy)
function pName(p) { return pick(p.name, p.zh?.name); }
function pTagline(p) { return pick(p.tagline, p.zh?.tagline); }
function pAudience(p) { return pick(p.audience, p.zh?.audience); }
function pBenefits(p) { return (lang() === 'zh' && p.zh?.benefits?.length) ? p.zh.benefits : (p.benefits || []); }
function pSpecs(p) { return (lang() === 'zh' && p.zh?.specs && Object.keys(p.zh.specs).length) ? p.zh.specs : (p.specs || {}); }
function pFaqs(p) { return (lang() === 'zh' && p.zh?.faqs?.length) ? p.zh.faqs : (p.faqs || []); }
function pSizeGuide(p) { return (lang() === 'zh' && p.zh?.sizeGuide?.length) ? p.zh.sizeGuide : p.sizeGuide; }

function productCard(p) {
  const compare = p.compareAtPrice && p.compareAtPrice > p.price
    ? `<span class="price-compare">${money(p.compareAtPrice)}</span>` : '';
  const reviews = db.load('reviews', []).filter(r => r.productId === p.id && r.status === 'approved');
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;
  const stars = reviews.length
    ? `<span class="card-stars">★ ${avg.toFixed(1)} (${reviews.length})</span>`
    : `<span class="card-stars muted">${t('card_new')}</span>`;
  return `<article class="product-card">
    <a class="product-link" href="/products/${p.slug}" aria-label="${escapeHtml(pName(p))}">
      <div class="card-img">
        <img src="${p.images[0]}" alt="${escapeHtml(pName(p))}" loading="lazy">
        <span class="card-badge">${escapeHtml(catName(p.category))}</span>
      </div>
      <div class="card-body">
        <h3>${escapeHtml(pName(p))}</h3>
        ${stars}
        <div class="card-price">${money(p.price)} ${compare}</div>
      </div>
    </a>
    <button class="quick-add" data-add="${p.id}" aria-label="${t('card_add')} ${escapeHtml(pName(p))}">+</button>
  </article>`;
}

function catalogScript(products) {
  const map = {};
  for (const p of products) {
    map[p.id] = { id: p.id, name: pName(p), price: p.price, image: p.images[0], slug: p.slug, stock: p.stock };
  }
  return `<script>window.__CATALOG=${JSON.stringify(map)};</script>`;
}

// ---------- Home ----------
function home({ products }) {
  const featured = products.filter(p => p.status === 'published').slice(0, 8);
  const cats = categories.map(c => `
    <a class="cat-card" href="/shop?category=${c.key}">
      <span class="cat-emoji">${c.emoji}</span>
      <span>${escapeHtml(lang() === 'zh' && c.zh ? c.zh : c.name)}</span>
    </a>`).join('');
  const content = `
<section class="hero premium-hero">
  <div class="hero-copy">
    <h1>${t('hero_title')}</h1>
    <p>${t('hero_lead')}</p>
    <div class="hero-cta">
      <a class="btn btn-primary btn-lg" href="/shop">${t('hero_cta_shop')}</a>
      <a class="btn btn-ghost btn-lg" href="/pages/about">${t('hero_cta_story')}</a>
    </div>
  </div>
  <div class="hero-media"><img src="/img/hero.svg" alt="Illustration of a cat and dog with pet supplies"></div>
</section>
<section class="trust-bar">
  <div class="trust-in">
    <div><strong>${t('trust_1')}</strong><span>Premium daily essentials</span></div>
    <div><strong>${t('trust_2')}</strong><span>Clear delivery promises</span></div>
    <div><strong>${t('trust_3')}</strong><span>Real support, real policies</span></div>
    <div><strong>${t('trust_4')}</strong><span>Secure checkout path</span></div>
  </div>
</section>
<section class="wrap section">
  <h2 class="section-title">${t('home_cats_title')}</h2>
  <div class="cat-grid">${cats}</div>
</section>
<section class="wrap section">
  <div class="section-head">
    <h2 class="section-title">${t('home_feat_title')}</h2>
    <a class="link-more" href="/shop">${t('view_all')}</a>
  </div>
  <div class="product-grid">${featured.map(productCard).join('')}</div>
</section>
<section class="promise">
  <div class="wrap promise-in">
    <h2 class="section-title">${t('promise_title')}</h2>
    <div class="promise-grid">
      <div class="promise-card"><h3>${t('promise_1_t')}</h3><p>${t('promise_1_p')}</p></div>
      <div class="promise-card"><h3>${t('promise_2_t')}</h3><p>${t('promise_2_p')}</p></div>
      <div class="promise-card"><h3>${t('promise_3_t')}</h3><p>${t('promise_3_p')}</p></div>
      <div class="promise-card"><h3>${t('promise_4_t')}</h3><p>${t('promise_4_p')}</p></div>
    </div>
  </div>
</section>
<section class="wrap section footnote-sec">
  <p class="footnote">${t('home_footnote')}</p>
</section>
${catalogScript(featured)}`;
  return storeLayout({ title: '', description: t('hero_lead'), content });
}

// ---------- Shop ----------
function shop({ products, category }) {
  const list = products.filter(p => p.status === 'published' && (!category || p.category === category));
  const tabs = [{ key: '', name: t('filter_all') }, ...categories.map(c => ({ key: c.key, name: lang() === 'zh' && c.zh ? c.zh : c.name }))].map(c =>
    `<a class="filter-tab ${((category || '') === c.key) ? 'active' : ''}" href="/shop${c.key ? '?category=' + c.key : ''}">${escapeHtml(c.name)}</a>`).join('');
  const content = `
<section class="wrap section">
  <h1 class="page-title">${t('shop_title')}</h1>
  <div class="filter-tabs">${tabs}</div>
  ${list.length ? `<div class="product-grid">${list.map(productCard).join('')}</div>`
    : `<p class="empty-note">${t('shop_empty')}</p>`}
</section>
${catalogScript(list)}`;
  return storeLayout({ title: category ? catName(category) : t('shop_title'), description: t('shop_title'), content });
}

// ---------- Product detail ----------
function productDetail({ product: p, settings }) {
  const ship = settings.shipping || {};
  const reviews = db.load('reviews', []).filter(r => r.productId === p.id && r.status === 'approved');
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;

  const thumbs = p.images.map((src, i) =>
    `<button class="thumb ${i === 0 ? 'active' : ''}" data-img="${src}"><img src="${src}" alt="${escapeHtml(pName(p))} ${i + 1}"></button>`).join('');

  const benefits = pBenefits(p).map(b => `<li>${escapeHtml(b)}</li>`).join('');
  const specs = Object.entries(pSpecs(p)).map(([k, v]) =>
    `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join('');
  const sg = pSizeGuide(p);
  const sizeGuide = sg ? `
    <h3 class="acc-sub">${t('size_chart')}</h3>
    <table class="spec-table"><tr><th>${t('size_size')}</th><th>${t('size_chest')}</th><th>${t('size_weight')}</th></tr>
    ${sg.map(s => `<tr><td>${escapeHtml(s.size)}</td><td>${escapeHtml(s.chest)}</td><td>${escapeHtml(s.weight)}</td></tr>`).join('')}
    </table>` : '';
  const faqs = pFaqs(p).map(f => `
    <details class="faq-item"><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`).join('');

  const reviewHtml = reviews.length
    ? reviews.map(r => `
      <div class="review">
        <div class="review-head"><span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
        <b>${escapeHtml(r.name)}</b> <span class="verified">${t('verified')}</span> <span class="muted">${fmtDate(r.createdAt)}</span></div>
        <p>${escapeHtml(r.text)}</p>
      </div>`).join('')
    : `<p class="empty-note">${t('reviews_empty')}</p>`;

  const compare = p.compareAtPrice && p.compareAtPrice > p.price
    ? `<span class="price-compare">${money(p.compareAtPrice)}</span><span class="save-badge">${t('save_badge', { amt: money(p.compareAtPrice - p.price) })}</span>` : '';

  const content = `
<section class="wrap section">
  <nav class="crumbs"><a href="/">${t('nav_home')}</a> / <a href="/shop">${t('nav_shop')}</a> / <a href="/shop?category=${p.category}">${escapeHtml(catName(p.category))}</a> / ${escapeHtml(pName(p))}</nav>
  <div class="pdp">
    <div class="pdp-gallery">
      <div class="pdp-main"><img id="mainImg" src="${p.images[0]}" alt="${escapeHtml(pName(p))}"></div>
      <div class="pdp-thumbs">${thumbs}</div>
    </div>
    <div class="pdp-info">
      <span class="card-cat">${escapeHtml(catName(p.category))}</span>
      <h1>${escapeHtml(pName(p))}</h1>
      <div class="pdp-rating">${reviews.length ? t('pdp_reviews_line', { avg: avg.toFixed(1), n: reviews.length }) : t('pdp_new')}</div>
      <div class="pdp-price">${money(p.price)} ${compare}</div>
      <p class="pdp-tagline">${escapeHtml(pTagline(p))}</p>
      <p class="pdp-audience"><b>${t('who_for')}</b> ${escapeHtml(pAudience(p))}</p>
      <ul class="pdp-benefits">${benefits}</ul>
      <div class="pdp-buy">
        <div class="qty-picker"><button type="button" data-qty="-1">−</button><input id="qtyInput" type="number" value="1" min="1" max="${Math.max(1, p.stock)}"><button type="button" data-qty="1">+</button></div>
        <button class="btn btn-primary btn-lg pdp-add" data-add="${p.id}" ${p.stock < 1 ? 'disabled' : ''}>${p.stock < 1 ? t('out_of_stock') : t('add_to_cart')}</button>
      </div>
      <div class="pdp-ship">
        <div>${t('ship_line1', { handling: escapeHtml(ship.handlingDays || '1-3'), transit: escapeHtml(ship.transitDays || '7-15') })}</div>
        <div>${t('ship_line2')}</div>
        <div>${t('ship_line3', { countries: escapeHtml((ship.countries || []).join(', ')) })}</div>
      </div>
      <details class="acc" open><summary>${t('acc_specs')}</summary><table class="spec-table">${specs}</table>${sizeGuide}</details>
      <details class="acc"><summary>${t('acc_shipping')}</summary>
        <p>${t('acc_ship_p1', { handling: escapeHtml(ship.handlingDays || '1-3'), transit: escapeHtml(ship.transitDays || '7-15'), free: money(ship.freeThreshold ?? 3500), rate: money(ship.standardRate ?? 495) })}</p>
        <p>${t('acc_ship_p2')}</p>
      </details>
      <details class="acc"><summary>${t('acc_faq')}</summary>${faqs}</details>
    </div>
  </div>
  <section class="pdp-reviews">
    <h2 class="section-title">${t('reviews_title')}</h2>
    ${reviewHtml}
  </section>
</section>
${catalogScript([p])}
<script>window.__VIEW_ITEM=${JSON.stringify({ id: p.id, name: p.name, price: p.price })};</script>`;
  return storeLayout({ title: pName(p), description: pTagline(p), content });
}

// ---------- Cart ----------
function cart({ settings }) {
  const ship = settings.shipping || {};
  const products = db.load('products', []).filter(p => p.status === 'published');
  const content = `
<section class="wrap section narrow">
  <h1 class="page-title">${t('cart_title')}</h1>
  <div id="cartRoot" data-free="${ship.freeThreshold ?? 3500}" data-rate="${ship.standardRate ?? 495}">
    <p class="empty-note">…</p>
  </div>
</section>
${catalogScript(products)}`;
  return storeLayout({ title: t('cart_title'), description: t('cart_title'), content });
}

// ---------- Checkout ----------
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

function checkout({ settings }) {
  const ship = settings.shipping || {};
  const payMode = settings.payments?.mode || 'test';
  const products = db.load('products', []).filter(p => p.status === 'published');
  const stateOpts = US_STATES.map(s => `<option value="${s}">${s}</option>`).join('');
  const payLabel = { test: t('pay_test_label'), stripe: t('pay_stripe_label'), alipay: t('pay_alipay_label'), paypal: t('pay_paypal_label') }[payMode];
  const addrHint = t('co_addr_hint');
  const content = `
<section class="wrap section narrow">
  <h1 class="page-title">${t('checkout_title')}</h1>
  <div class="checkout-grid">
    <form id="checkoutForm" class="checkout-form" autocomplete="on">
      <h2>${t('co_contact')}</h2>
      <label>${t('co_email')} <input type="email" name="email" required placeholder="you@email.com"></label>
      <h2>${t('co_ship_addr')}</h2>
      ${addrHint ? `<p class="footnote">${addrHint}</p>` : ''}
      <div class="form-row">
        <label>${t('co_first')} <input name="firstName" required></label>
        <label>${t('co_last')} <input name="lastName" required></label>
      </div>
      <label>${t('co_addr1')} <input name="address1" required placeholder="${t('co_addr1_ph')}"></label>
      <label>${t('co_addr2')} <input name="address2"></label>
      <div class="form-row form-row-3">
        <label>${t('co_city')} <input name="city" required></label>
        <label>${t('co_state')} <select name="state" required><option value="">—</option>${stateOpts}</select></label>
        <label>${t('co_zip')} <input name="zip" required pattern="[0-9]{5}(-[0-9]{4})?"></label>
      </div>
      <label>${t('co_country')} <select name="country">${(ship.countries || ['United States']).map(c => `<option>${escapeHtml(c)}</option>`).join('')}</select></label>
      <label class="check-line"><input type="checkbox" id="billingSame" checked> ${t('co_billing_same')}</label>
      <div id="billingBlock" hidden>
        <h2>${t('co_billing')}</h2>
        <label>${t('co_addr1')} <input name="billAddress1"></label>
        <div class="form-row form-row-3">
          <label>${t('co_city')} <input name="billCity"></label>
          <label>${t('co_state')} <select name="billState"><option value="">—</option>${stateOpts}</select></label>
          <label>${t('co_zip')} <input name="billZip"></label>
        </div>
      </div>
      <h2>${t('co_payment')}</h2>
      <div class="pay-method">${payLabel}</div>
      ${payMode === 'test' ? `<label class="check-line muted"><input type="checkbox" id="simulateFail"> ${t('co_sim_fail')}</label>` : ''}
      <button class="btn btn-primary btn-lg btn-block" id="placeOrder" type="submit">${t('co_place')}</button>
      <p class="footnote">${t('co_agree', { duties: escapeHtml(ship.dutiesNote || '') })}</p>
    </form>
    <aside class="checkout-summary" id="summaryRoot" data-free="${ship.freeThreshold ?? 3500}" data-rate="${ship.standardRate ?? 495}">
      <h2>${t('co_summary')}</h2>
      <div id="summaryItems"></div>
      <div class="discount-row">
        <input id="discountInput" placeholder="${t('co_discount_ph')}">
        <button class="btn btn-ghost" id="applyDiscount" type="button">${t('co_apply')}</button>
      </div>
      <p class="sub-msg" id="discountMsg"></p>
      <div class="sum-lines" id="sumLines"></div>
    </aside>
  </div>
</section>
${catalogScript(products)}
<script>window.__CHECKOUT=1;</script>`;
  return storeLayout({ title: t('checkout_title'), description: t('checkout_title'), content });
}

// ---------- Order confirmation ----------
function orderConfirm({ order }) {
  const catalog = db.load('products', []);
  const itemName = i => {
    const p = catalog.find(x => x.id === i.productId);
    return p ? pName(p) : i.name;
  };
  const items = order.items.map(i => `
    <div class="sum-item"><img src="${i.image}" alt=""><span>${escapeHtml(itemName(i))} × ${i.qty}</span><b>${money(i.price * i.qty)}</b></div>`).join('');
  const content = `
<section class="wrap section narrow center">
  <div class="confirm-card">
    <div class="confirm-emoji">🎉</div>
    <h1>${t('cf_thanks', { name: escapeHtml(order.shipping.firstName || '') })}</h1>
    <p>${t('cf_confirmed', { number: escapeHtml(order.number) })}${order.paymentMethod === 'test' ? ` <span class="badge-test">${t('cf_test_badge')}</span>` : ''}</p>
    <p class="muted">${t('cf_email_note', { email: escapeHtml(order.email) })}</p>
    <div class="confirm-items">${items}</div>
    <div class="confirm-total">
      <div><span>${t('sum_shipping')}</span><b>${order.shippingCents ? money(order.shippingCents) : t('sum_free')}</b></div>
      ${order.discountCents ? `<div><span>${t('sum_discount')} (${escapeHtml(order.discountCode || '')})</span><b>−${money(order.discountCents)}</b></div>` : ''}
      <div class="grand"><span>${t('sum_total')}</span><b>${money(order.totalCents)}</b></div>
    </div>
    <div class="hero-cta center">
      <a class="btn btn-primary" href="/shop">${t('cf_continue')}</a>
      <a class="btn btn-ghost" href="/track-order">${t('cf_track')}</a>
    </div>
  </div>
</section>
<script>window.__PURCHASE=${JSON.stringify({ id: order.id, number: order.number, value: order.totalCents / 100 })};</script>`;
  return storeLayout({ title: t('cf_track'), description: 'Order confirmation', content });
}

// ---------- Track order ----------
function trackOrder({ order, error, settings }) {
  const ship = settings.shipping || {};
  let result = '';
  if (error) result = `<p class="form-error">${escapeHtml(error)}</p>`;
  if (order) {
    const steps = [
      { label: t('tr_step_confirmed'), ts: order.paidAt },
      { label: t('tr_step_shipped'), ts: order.fulfilledAt },
      { label: t('tr_step_delivered'), ts: order.deliveredAt }
    ];
    const stageIdx = order.status === 'delivered' ? 2 : order.status === 'fulfilled' ? 1 : ['paid'].includes(order.status) ? 0 : -1;
    const timeline = steps.map((s, i) => `
      <div class="track-step ${i <= stageIdx ? 'done' : ''}">
        <span class="dot"></span>
        <div><b>${s.label}</b><span class="muted">${s.ts ? fmtDate(s.ts, true) : i > stageIdx ? t('tr_pending') : ''}</span></div>
      </div>`).join('');
    const statusLabel = t('st_' + order.status);
    result = `
    <div class="track-result">
      <h2>${t('tr_order_line', { number: escapeHtml(order.number), status: statusLabel })}</h2>
      ${order.status === 'refunded' ? `<p class="muted">${t('tr_refunded_note')}</p>` : `<div class="track-timeline">${timeline}</div>`}
      ${order.trackingNumber ? `<p>${t('tr_carrier')}: <b>${escapeHtml(order.carrier || '—')}</b> · ${t('tr_tracking_no')}: <b>${escapeHtml(order.trackingNumber)}</b><br><span class="muted">${t('tr_tracking_start')}</span></p>` : order.status === 'paid' ? `<p class="muted">${t('tr_awaiting_ship', { handling: escapeHtml(ship.handlingDays || '1-3') })}</p>` : ''}
    </div>`;
  }
  const content = `
<section class="wrap section narrow">
  <h1 class="page-title">${t('tr_title')}</h1>
  <p class="muted">${t('tr_lead')}</p>
  <form method="POST" action="/track-order" class="track-form">
    <input name="number" placeholder="${t('tr_num_ph')}" required value="">
    <input name="email" type="email" placeholder="${t('tr_email_ph')}" required>
    <button class="btn btn-primary" type="submit">${t('tr_btn')}</button>
  </form>
  ${result}
  <p class="footnote">${t('tr_footnote', { transit: escapeHtml(ship.transitDays || '7-15') })}</p>
</section>`;
  return storeLayout({ title: t('tr_title'), description: t('tr_title'), content });
}

// ---------- Contact ----------
function contact({ sent, settings }) {
  const topics = [t('ct_topic_1'), t('ct_topic_2'), t('ct_topic_3'), t('ct_topic_4'), t('ct_topic_5')];
  const content = `
<section class="wrap section narrow">
  <h1 class="page-title">${t('ct_title')}</h1>
  <p class="muted">${t('ct_lead')}</p>
  ${sent ? `<div class="form-success">${t('ct_sent')}</div>` : `
  <form method="POST" action="/contact" class="contact-form">
    <div class="form-row">
      <label>${t('ct_name')} <input name="name" required maxlength="80"></label>
      <label>${t('ct_email')} <input name="email" type="email" required></label>
    </div>
    <label>${t('ct_order')} <input name="orderNumber" placeholder="MW-XXXXXX" maxlength="20"></label>
    <label>${t('ct_topic')} <select name="topic">
      ${topics.map(x => `<option>${escapeHtml(x)}</option>`).join('')}
    </select></label>
    <label>${t('ct_message')} <textarea name="message" rows="6" required maxlength="4000"></textarea></label>
    <button class="btn btn-primary btn-lg" type="submit">${t('ct_send')}</button>
  </form>`}
  <p class="footnote">${t('ct_direct')} <a href="mailto:${escapeHtml(settings.store?.supportEmail || '')}">${escapeHtml(settings.store?.supportEmail || '')}</a></p>
</section>`;
  return storeLayout({ title: t('ct_title'), description: t('ct_title'), content });
}

// ---------- FAQ ----------
function faq({ settings }) {
  const ship = settings.shipping || {};
  const free = money(ship.freeThreshold ?? 3500);
  const rate = money(ship.standardRate ?? 495);
  const countries = (ship.countries || ['United States']).join(', ');
  const handling = ship.handlingDays || '1-3';
  const transit = ship.transitDays || '7-15';
  const qaEn = [
    ['How long does shipping take?', `Orders are processed in ${handling} business days, then transit takes an estimated ${transit} business days with tracking. These are estimates, not guarantees — if your order runs late we'll notify you proactively and you may cancel undelivered items for a full refund.`],
    ['How much is shipping?', `US shipping is free over ${free}; below that it's a flat ${rate}.`],
    ['Where do you ship?', `Currently: ${countries}. We're adding regions carefully so delivery promises stay honest.`],
    ['Will I pay customs or import fees?', ship.dutiesNote || 'US orders typically incur no import charges; if any are assessed they are the buyer\'s responsibility.'],
    ['What is your return policy?', 'Unused items in original packaging can be returned within 30 days of delivery. Return shipping is on you unless we sent a wrong or damaged item — in that case, photo within 48h and we reship or refund, your choice. Refunds are issued within 5–10 business days of approval.'],
    ['My tracking number isn\'t updating.', 'Tracking usually begins updating 2–5 days after dispatch as the parcel enters the carrier network. If nothing changes for 7+ days, contact us and we\'ll investigate with the carrier.'],
    ['What payment methods do you accept?', 'Credit/debit cards and PayPal, depending on checkout options shown. All payments are processed by certified providers — we never see or store your card number.'],
    ['Are your reviews real?', 'Yes — we only publish reviews submitted by verified customers through post-delivery invitations, with no rewards attached. That\'s why new products show "no reviews yet" instead of suspiciously perfect star walls.'],
    ['Do you sell pet food or supplements?', 'No. We deliberately stock only non-ingestible supplies (toys, grooming, beds, walk gear) so everything we sell is simple, safe and honestly described.'],
    ['How do I contact support?', 'Use the contact form or email us — a human replies within 1 business day.']
  ];
  const qaZh = [
    ['配送需要多久？', `订单在 ${handling} 个工作日内处理发出，运输预计 ${transit} 个工作日、全程可跟踪。时效为预估、不作保证——如有延误我们会主动通知，未送达商品可随时取消并全额退款。`],
    ['运费多少？', `全美满 ${free} 免邮；未满收固定运费 ${rate}。`],
    ['配送哪些地区？', `目前配送：${countries}。我们会谨慎地逐步增加地区，确保时效承诺始终可靠。`],
    ['需要付关税或进口费吗？', '美国订单在 $800 免税额度内通常不产生进口费用；如有产生，由买家承担。'],
    ['退货政策是什么？', '签收后 30 天内，未使用且保留原包装即可退货。退货运费由买家承担；若是错发或破损，48 小时内附照片联系我们，补发或退款任选，运费我们出。退款在审核通过后 5–10 个工作日内原路退回。'],
    ['运单号一直不更新？', '包裹进入承运网络后，运单通常在发货后 2–5 天开始更新。如超过 7 天无变化，请联系我们，我们会向承运商发起查件。'],
    ['支持哪些付款方式？', '信用卡/借记卡和 PayPal（以结账页显示为准）。所有支付均由持牌支付机构处理——我们不接触、不存储你的卡号。'],
    ['你们的评价是真的吗？', '是——我们只发布已验证买家通过收货后邀请提交的评价，且没有任何奖励。所以新品会显示"暂无评价"，而不是可疑的满分刷屏。'],
    ['卖宠物食品或保健品吗？', '不卖。我们刻意只做非入口用品（玩具、梳护、窝垫、出行），保证卖的每一件都简单、安全、描述诚实。'],
    ['怎么联系客服？', '用联系表单或直接发邮件——真人客服 1 个工作日内回复。']
  ];
  const qa = lang() === 'zh' ? qaZh : qaEn;
  const content = `
<section class="wrap section narrow">
  <h1 class="page-title">${t('faq_title')}</h1>
  ${qa.map(([q, a]) => `<details class="faq-item big"><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join('')}
  <p class="footnote">${t('faq_footnote')}</p>
</section>`;
  return storeLayout({ title: t('faq_title'), description: t('faq_title'), content });
}

// ---------- Review form ----------
function reviewForm({ order, done, error }) {
  const catalog = db.load('products', []);
  let body;
  if (done) {
    body = `<div class="form-success">${t('rv_done')}</div>`;
  } else if (error) {
    body = `<p class="form-error">${escapeHtml(error)}</p>`;
  } else {
    const options = order.items.map(i => {
      const p = catalog.find(x => x.id === i.productId);
      return `<option value="${i.productId}">${escapeHtml(p ? pName(p) : i.name)}</option>`;
    }).join('');
    body = `
    <form method="POST" class="contact-form">
      <label>${t('rv_product')} <select name="productId" required>${options}</select></label>
      <label>${t('rv_rating')} <select name="rating" required>
        <option value="5">${t('rv_r5')}</option><option value="4">${t('rv_r4')}</option>
        <option value="3">${t('rv_r3')}</option><option value="2">${t('rv_r2')}</option>
        <option value="1">${t('rv_r1')}</option>
      </select></label>
      <label>${t('rv_name')} <input name="name" required maxlength="60"></label>
      <label>${t('rv_text')} <textarea name="text" rows="5" required maxlength="2000" placeholder="${t('rv_text_ph')}"></textarea></label>
      <button class="btn btn-primary btn-lg" type="submit">${t('rv_submit')}</button>
      <p class="footnote">${t('rv_note')}</p>
    </form>`;
  }
  const content = `
<section class="wrap section narrow">
  <h1 class="page-title">${t('rv_title')}${order ? ' ' + escapeHtml(order.number) : ''}</h1>
  ${body}
</section>`;
  return storeLayout({ title: t('rv_title'), description: t('rv_title'), content });
}

function notFound() {
  const content = `
<section class="wrap section center">
  <div class="confirm-emoji">🐾</div>
  <h1 class="page-title">${t('nf_title')}</h1>
  <p class="muted">${t('nf_text')}</p>
  <p><a class="btn btn-primary" href="/">${t('nf_back')}</a></p>
</section>`;
  return storeLayout({ title: t('nf_title'), description: '404', content });
}

module.exports = { home, shop, productDetail, cart, checkout, orderConfirm, trackOrder, contact, faq, reviewForm, notFound, US_STATES };
