/* MewMew Co storefront client script */
(function () {
  'use strict';
  var CATALOG = window.__CATALOG || {};
  var ZH = window.__LANG === 'zh';
  // path prefix for static exports (GitHub Pages demo); empty on the live server
  var P = window.__PATH_PREFIX || '';
  if (!P) {
    var scriptSrc = document.currentScript ? document.currentScript.getAttribute('src') || '' : '';
    var prefixMatch = scriptSrc.match(/^(.*)\/js\/store\.js/);
    if (prefixMatch) P = prefixMatch[1];
  }

  // client-side i18n (mirrors server-side lang cookie)
  var MSG = {
    added: ZH ? '已加入购物车 🐾' : 'Added to cart 🐾',
    unavailable: ZH ? '商品暂不可购买' : 'Product unavailable',
    each: ZH ? '/件' : ' each',
    remove: ZH ? '移除' : 'Remove',
    subtotal: ZH ? '商品小计' : 'Subtotal',
    shipping: ZH ? '运费' : 'Shipping',
    total: ZH ? '合计' : 'Total',
    free: ZH ? '免邮' : 'FREE',
    unlocked: ZH ? '🎉 已解锁<b>免邮</b>！' : '🎉 You\'ve unlocked <b>FREE shipping</b>!',
    addMore: ZH ? '再买 <b>{amt}</b> 即可<b>免邮</b>' : 'Add <b>{amt}</b> more for <b>FREE shipping</b>',
    discountNote: ZH ? '优惠码在结算页填写。' : 'Discount codes are applied at checkout.',
    toCheckout: ZH ? '去结算' : 'Proceed to checkout',
    emptyCart: ZH ? '购物车是空的。<a href="' + P + '/shop">去逛逛 →</a>' : 'Your cart is empty. <a href="' + P + '/shop">Browse the shop →</a>',
    applied: ZH ? '✓ 已使用 ' : '✓ ',
    appliedSuffix: ZH ? '' : ' applied',
    invalid: ZH ? '优惠码无效' : 'Invalid code',
    validateFail: ZH ? '优惠码校验失败，请重试' : 'Could not validate code',
    processing: ZH ? '提交中…' : 'Processing…',
    place: ZH ? '提交订单' : 'Place order',
    wrong: ZH ? '出了点问题，请重试。' : 'Something went wrong — please try again.',
    subOk: ZH ? '🎉 欢迎！9 折码已发送到你的邮箱。' : '🎉 Welcome! Check your inbox for your 10% code.',
    subFail: ZH ? '订阅失败，请稍后再试' : 'Could not subscribe'
  };

  // ---------- helpers ----------
  function $(s, el) { return (el || document).querySelector(s); }
  function $all(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function money(c) { return '$' + (c / 100).toFixed(2); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
  function asset(src) {
    if (!src || /^https?:|^data:|^\./.test(src)) return src || '';
    return src.charAt(0) === '/' ? P + src : src;
  }

  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2600);
  }

  // ---------- visitor id (first-party, anonymous) ----------
  function visitorId() {
    var v = localStorage.getItem('mw_vid');
    if (!v) { v = 'v' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('mw_vid', v); }
    return v;
  }
  function track(event, meta) {
    try {
      navigator.sendBeacon('/api/track', new Blob([JSON.stringify({ event: event, visitorId: visitorId(), meta: meta || {} })], { type: 'application/json' }));
    } catch (e) { /* noop */ }
  }

  // ---------- third-party pixels (consent-gated) ----------
  function consent() { return localStorage.getItem('mw_cookie_consent'); }
  function firePixel(name, data) {
    if (consent() !== 'accepted') return;
    try {
      if (window.gtag) {
        if (name === 'view_item') gtag('event', 'view_item', { currency: 'USD', value: data.value, items: [{ item_id: data.id, item_name: data.name }] });
        if (name === 'add_to_cart') gtag('event', 'add_to_cart', { currency: 'USD', value: data.value, items: [{ item_id: data.id, item_name: data.name, quantity: data.qty }] });
        if (name === 'begin_checkout') gtag('event', 'begin_checkout', { currency: 'USD', value: data.value });
        if (name === 'purchase') gtag('event', 'purchase', { transaction_id: data.number, currency: 'USD', value: data.value });
      }
      if (window.fbq) {
        if (name === 'view_item') fbq('track', 'ViewContent', { content_ids: [data.id], content_name: data.name, value: data.value, currency: 'USD' });
        if (name === 'add_to_cart') fbq('track', 'AddToCart', { content_ids: [data.id], value: data.value, currency: 'USD' });
        if (name === 'begin_checkout') fbq('track', 'InitiateCheckout', { value: data.value, currency: 'USD' });
        if (name === 'purchase') fbq('track', 'Purchase', { value: data.value, currency: 'USD' });
      }
      if (window.ttq) {
        if (name === 'view_item') ttq.track('ViewContent', { content_id: data.id, value: data.value, currency: 'USD' });
        if (name === 'add_to_cart') ttq.track('AddToCart', { content_id: data.id, value: data.value, currency: 'USD' });
        if (name === 'begin_checkout') ttq.track('InitiateCheckout', { value: data.value, currency: 'USD' });
        if (name === 'purchase') ttq.track('CompletePayment', { value: data.value, currency: 'USD' });
      }
    } catch (e) { /* noop */ }
  }

  // Cookie banner
  var banner = $('#cookieBanner');
  if (banner) {
    if (!consent()) banner.hidden = false;
    else if (consent() === 'accepted' && window.__loadPixels) window.__loadPixels();
    var acc = $('#cookieAccept'), dec = $('#cookieDecline');
    if (acc) acc.addEventListener('click', function () {
      localStorage.setItem('mw_cookie_consent', 'accepted'); banner.hidden = true;
      if (window.__loadPixels) window.__loadPixels();
    });
    if (dec) dec.addEventListener('click', function () {
      localStorage.setItem('mw_cookie_consent', 'declined'); banner.hidden = true;
    });
  }

  // ---------- cart ----------
  function getCart() {
    try { return JSON.parse(localStorage.getItem('mw_cart') || '{}'); } catch (e) { return {}; }
  }
  function setCart(c) {
    localStorage.setItem('mw_cart', JSON.stringify(c));
    updateBadge();
  }
  function cartCount() {
    var c = getCart(), n = 0;
    for (var k in c) n += c[k];
    return n;
  }
  function updateBadge() {
    var el = $('#cartCount');
    if (el) {
      el.textContent = cartCount();
      el.classList.remove('pulse');
      void el.offsetWidth;
      el.classList.add('pulse');
    }
  }
  updateBadge();

  var drawer = $('#cartDrawer');
  var overlay = $('#cartOverlay');
  var drawerItems = $('#drawerItems');
  var drawerFoot = $('#drawerFoot');
  var drawerTotal = $('#drawerTotal');
  var drawerShipping = $('#drawerShipping');
  var drawerShippingText = $('#drawerShippingText');
  var drawerProgressBar = $('#drawerProgressBar');

  function openDrawer() {
    if (!drawer || !overlay) return;
    renderCartDrawer();
    overlay.hidden = false;
    drawer.hidden = false;
    requestAnimationFrame(function () {
      document.body.classList.add('drawer-open');
      drawer.setAttribute('aria-hidden', 'false');
      var close = $('#cartDrawerClose');
      if (close) close.focus();
    });
  }

  function closeDrawer() {
    if (!drawer || !overlay) return;
    document.body.classList.remove('drawer-open');
    drawer.setAttribute('aria-hidden', 'true');
    setTimeout(function () {
      overlay.hidden = true;
    }, 260);
  }

  function cartPayload() {
    var c = getCart(), items = [];
    for (var id in c) items.push({ productId: id, qty: c[id] });
    return items;
  }

  function fallbackQuote() {
    var lines = cartLines().map(function (l) {
      return {
        productId: l.p.id,
        name: l.p.name,
        slug: l.p.slug,
        image: l.p.image,
        price: l.p.price,
        qty: l.qty,
        lineTotal: l.p.price * l.qty
      };
    });
    var subtotal = lines.reduce(function (sum, line) { return sum + line.lineTotal; }, 0);
    var freeThreshold = 3500;
    return {
      lines: lines,
      subtotal: subtotal,
      shippingCents: subtotal && subtotal < freeThreshold ? 495 : 0,
      totalCents: subtotal + (subtotal && subtotal < freeThreshold ? 495 : 0),
      freeThreshold: freeThreshold,
      amountToFree: Math.max(0, freeThreshold - subtotal)
    };
  }

  function syncCartFromQuote(quote) {
    var next = {};
    (quote.lines || []).forEach(function (line) {
      next[line.productId] = line.qty;
    });
    setCart(next);
  }

  function renderDrawerQuote(quote) {
    if (!drawerItems) return;
    var lines = quote.lines || [];
    if (!lines.length) {
      drawerItems.innerHTML = '<p class="drawer-empty">' + MSG.emptyCart + '</p>';
      if (drawerFoot) drawerFoot.hidden = true;
      if (drawerShipping) drawerShipping.hidden = true;
      return;
    }
    if (drawerFoot) drawerFoot.hidden = false;
    if (drawerShipping) drawerShipping.hidden = false;
    if (drawerTotal) drawerTotal.textContent = money(quote.totalCents || quote.subtotal || 0);
    if (drawerShippingText) {
      drawerShippingText.innerHTML = quote.amountToFree > 0
        ? MSG.addMore.replace('{amt}', money(quote.amountToFree))
        : MSG.unlocked;
    }
    if (drawerProgressBar) {
      var threshold = quote.freeThreshold || 3500;
      drawerProgressBar.style.width = Math.min(100, Math.round((quote.subtotal || 0) / threshold * 100)) + '%';
    }
    drawerItems.innerHTML = lines.map(function (line, index) {
      return '<div class="drawer-item" style="animation-delay:' + (index * 45) + 'ms">' +
        '<a href="' + P + '/products/' + esc(line.slug) + '"><img src="' + esc(asset(line.image)) + '" alt=""></a>' +
        '<div><h3>' + esc(line.name) + '</h3><div class="drawer-item-price">' + money(line.price) + MSG.each + '</div>' +
        '<div class="drawer-stepper"><button data-dqty="-1" data-id="' + esc(line.productId) + '" aria-label="Decrease quantity">-</button><span>' + line.qty + '</span><button data-dqty="1" data-id="' + esc(line.productId) + '" aria-label="Increase quantity">+</button></div></div>' +
        '<button class="drawer-remove" data-dremove="' + esc(line.productId) + '" aria-label="' + MSG.remove + '">×</button>' +
        '</div>';
    }).join('');
  }

  function renderCartDrawer() {
    if (!drawerItems) return;
    var items = cartPayload();
    if (!items.length) {
      renderDrawerQuote({ lines: [], subtotal: 0, totalCents: 0, freeThreshold: 3500, amountToFree: 3500 });
      return;
    }
    drawerItems.innerHTML = '<p class="drawer-empty">Loading your cart...</p>';
    fetch('/api/cart/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items })
    }).then(function (r) { return r.json(); }).then(function (quote) {
      if (!quote || !quote.ok) throw new Error('quote failed');
      syncCartFromQuote(quote);
      renderDrawerQuote(quote);
    }).catch(function () {
      renderDrawerQuote(fallbackQuote());
    });
  }

  if (overlay) overlay.addEventListener('click', closeDrawer);
  var closeDrawerBtn = $('#cartDrawerClose');
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });
  $all('.cart-drawer-toggle').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      openDrawer();
    });
  });
  if (drawerItems) {
    drawerItems.addEventListener('click', function (e) {
      var q = e.target.closest('[data-dqty]');
      if (q) {
        var c = getCart(), id = q.getAttribute('data-id');
        c[id] = Math.max(0, (c[id] || 0) + parseInt(q.getAttribute('data-dqty'), 10));
        if (!c[id]) delete c[id];
        setCart(c); renderCartDrawer();
      }
      var r = e.target.closest('[data-dremove]');
      if (r) {
        var c2 = getCart(); delete c2[r.getAttribute('data-dremove')];
        setCart(c2); renderCartDrawer(); toast(MSG.remove);
      }
    });
  }

  function addToCart(id, qty) {
    var p = CATALOG[id];
    if (!p) { toast(MSG.unavailable); return; }
    var c = getCart();
    c[id] = Math.min((c[id] || 0) + (qty || 1), Math.max(1, p.stock || 99));
    setCart(c);
    toast(MSG.added);
    track('add_to_cart', { productId: id, qty: qty || 1 });
    firePixel('add_to_cart', { id: id, name: p.name, value: p.price / 100, qty: qty || 1 });
    setTimeout(openDrawer, 160);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add]');
    if (btn) {
      e.preventDefault(); e.stopPropagation();
      btn.classList.add('loading');
      var oldText = btn.textContent;
      if (oldText && oldText.trim() !== '+') btn.textContent = ZH ? '加入中...' : 'Adding...';
      var qtyInput = $('#qtyInput');
      addToCart(btn.getAttribute('data-add'), qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1);
      setTimeout(function () {
        btn.classList.remove('loading');
        if (oldText && oldText.trim() !== '+') btn.textContent = oldText;
      }, 700);
    }
  });

  // nav toggle (mobile)
  var navT = $('#navToggle');
  if (navT) navT.addEventListener('click', function () { $('#mainNav').classList.toggle('open'); });

  var siteHeader = $('.site-header');
  function updateHeaderState() {
    if (siteHeader) siteHeader.classList.toggle('compact', window.scrollY > 36);
  }
  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    $all('.product-card').forEach(function (card, index) {
      card.style.transitionDelay = (index % 4) * 55 + 'ms';
      revealObserver.observe(card);
    });
  } else {
    $all('.product-card').forEach(function (card) { card.classList.add('revealed'); });
  }

  // ---------- PDP ----------
  if (window.__VIEW_ITEM) {
    track('view_item', { productId: window.__VIEW_ITEM.id });
    firePixel('view_item', { id: window.__VIEW_ITEM.id, name: window.__VIEW_ITEM.name, value: window.__VIEW_ITEM.price / 100 });
  }
  $all('.thumb').forEach(function (t) {
    t.addEventListener('click', function () {
      $all('.thumb').forEach(function (x) { x.classList.remove('active'); });
      t.classList.add('active');
      var main = $('#mainImg');
      if (!main) return;
      main.style.opacity = '0';
      setTimeout(function () {
        main.src = t.getAttribute('data-img');
        main.style.opacity = '1';
      }, 140);
    });
  });
  var pdpMain = $('.pdp-main');
  if (pdpMain) {
    pdpMain.addEventListener('click', function () {
      pdpMain.classList.toggle('zoomed');
    });
  }
  $all('[data-qty]').forEach(function (b) {
    b.addEventListener('click', function () {
      var input = $('#qtyInput');
      var v = Math.max(1, (parseInt(input.value, 10) || 1) + parseInt(b.getAttribute('data-qty'), 10));
      input.value = Math.min(v, parseInt(input.max, 10) || 99);
    });
  });

  // ---------- cart page ----------
  var cartRoot = $('#cartRoot');
  function cartLines() {
    var c = getCart(), lines = [];
    for (var id in c) { if (CATALOG[id] && c[id] > 0) lines.push({ p: CATALOG[id], qty: c[id] }); }
    return lines;
  }
  function renderCart() {
    if (!cartRoot) return;
    var lines = cartLines();
    if (!lines.length) {
      cartRoot.innerHTML = '<p class="empty-note">' + MSG.emptyCart + '</p>';
      return;
    }
    var free = parseInt(cartRoot.getAttribute('data-free'), 10) || 3500;
    var rate = parseInt(cartRoot.getAttribute('data-rate'), 10) || 495;
    var subtotal = lines.reduce(function (s, l) { return s + l.p.price * l.qty; }, 0);
    var shipping = subtotal >= free ? 0 : rate;
    var toFree = Math.max(0, free - subtotal);
    var pct = Math.min(100, Math.round(subtotal / free * 100));
    var html = lines.map(function (l) {
      return '<div class="cart-item">' +
        '<a href="' + P + '/products/' + esc(l.p.slug) + '"><img src="' + esc(asset(l.p.image)) + '" alt=""></a>' +
        '<div><div class="cart-item-name">' + esc(l.p.name) + '</div><div class="cart-item-price">' + money(l.p.price) + MSG.each + '</div></div>' +
        '<div class="cart-item-right">' +
        '<div class="qty-picker"><button data-cqty="-1" data-id="' + esc(l.p.id) + '">−</button><input value="' + l.qty + '" readonly><button data-cqty="1" data-id="' + esc(l.p.id) + '">+</button></div>' +
        '<b>' + money(l.p.price * l.qty) + '</b>' +
        '<button class="cart-remove" data-remove="' + esc(l.p.id) + '">' + MSG.remove + '</button>' +
        '</div></div>';
    }).join('');
    html += '<div class="free-progress">' +
      (shipping === 0 ? MSG.unlocked : MSG.addMore.replace('{amt}', money(toFree))) +
      '<div class="free-bar"><span style="width:' + pct + '%"></span></div></div>';
    html += '<div class="cart-summary"><div class="sum-lines">' +
      '<div><span>' + MSG.subtotal + '</span><b>' + money(subtotal) + '</b></div>' +
      '<div><span>' + MSG.shipping + '</span><b>' + (shipping ? money(shipping) : MSG.free) + '</b></div>' +
      '<div class="grand"><span>' + MSG.total + '</span><b>' + money(subtotal + shipping) + '</b></div></div>' +
      '<p class="footnote">' + MSG.discountNote + '</p>' +
      '<a class="btn btn-primary btn-lg btn-block" href="' + P + '/checkout">' + MSG.toCheckout + '</a></div>';
    cartRoot.innerHTML = html;
  }
  if (cartRoot) {
    renderCart();
    cartRoot.addEventListener('click', function (e) {
      var q = e.target.closest('[data-cqty]');
      if (q) {
        var c = getCart(), id = q.getAttribute('data-id');
        c[id] = Math.max(0, (c[id] || 0) + parseInt(q.getAttribute('data-cqty'), 10));
        if (!c[id]) delete c[id];
        setCart(c); renderCart();
      }
      var r = e.target.closest('[data-remove]');
      if (r) {
        var c2 = getCart(); delete c2[r.getAttribute('data-remove')];
        setCart(c2); renderCart();
      }
    });
  }

  // ---------- checkout page ----------
  if (window.__CHECKOUT) {
    var lines = cartLines();
    if (!lines.length) { location.href = P + '/cart'; return; }
    var sumRoot = $('#summaryRoot');
    var free = parseInt(sumRoot.getAttribute('data-free'), 10) || 3500;
    var rate = parseInt(sumRoot.getAttribute('data-rate'), 10) || 495;
    var discount = null; // {code, type, value}

    function calc() {
      var subtotal = lines.reduce(function (s, l) { return s + l.p.price * l.qty; }, 0);
      var discountCents = 0;
      if (discount) {
        discountCents = discount.type === 'percent'
          ? Math.round(subtotal * discount.value / 100)
          : Math.min(discount.value, subtotal);
      }
      var shipping = (subtotal - discountCents) >= free ? 0 : rate;
      if (subtotal >= free) shipping = 0;
      return { subtotal: subtotal, discountCents: discountCents, shipping: shipping, total: subtotal - discountCents + shipping };
    }
    function renderSummary() {
      $('#summaryItems').innerHTML = lines.map(function (l) {
        return '<div class="sum-item"><img src="' + esc(asset(l.p.image)) + '" alt=""><span>' + esc(l.p.name) + ' × ' + l.qty + '</span><b>' + money(l.p.price * l.qty) + '</b></div>';
      }).join('');
      var t = calc();
      $('#sumLines').innerHTML =
        '<div><span>' + MSG.subtotal + '</span><b>' + money(t.subtotal) + '</b></div>' +
        (t.discountCents ? '<div><span>' + (ZH ? '折扣' : 'Discount') + ' (' + esc(discount.code) + ')</span><b>−' + money(t.discountCents) + '</b></div>' : '') +
        '<div><span>' + MSG.shipping + '</span><b>' + (t.shipping ? money(t.shipping) : MSG.free) + '</b></div>' +
        '<div class="grand"><span>' + MSG.total + '</span><b>' + money(t.total) + '</b></div>';
    }
    renderSummary();
    track('begin_checkout', {});
    firePixel('begin_checkout', { value: calc().total / 100 });

    // discount code
    $('#applyDiscount').addEventListener('click', function () {
      var code = $('#discountInput').value.trim();
      var msg = $('#discountMsg');
      if (!code) return;
      fetch('/api/discount/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code, email: $('#checkoutForm [name=email]').value, subtotal: calc().subtotal })
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d.valid) {
          discount = d.discount; msg.textContent = MSG.applied + d.discount.code + MSG.appliedSuffix; msg.classList.remove('err');
        } else {
          discount = null; msg.textContent = d.reason || MSG.invalid; msg.classList.add('err');
        }
        renderSummary();
      }).catch(function () { msg.textContent = MSG.validateFail; msg.classList.add('err'); });
    });

    // billing toggle
    var billSame = $('#billingSame');
    billSame.addEventListener('change', function () { $('#billingBlock').hidden = billSame.checked; });

    // abandoned-cart capture: register checkout once email is typed
    var emailInput = $('#checkoutForm [name=email]');
    var checkoutRegistered = false;
    emailInput.addEventListener('blur', function () {
      var email = emailInput.value.trim();
      if (!email || checkoutRegistered || !/@/.test(email)) return;
      checkoutRegistered = true;
      fetch('/api/checkout/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email, visitorId: visitorId(),
          items: lines.map(function (l) { return { productId: l.p.id, name: l.p.name, qty: l.qty }; })
        })
      }).catch(function () {});
    });

    // submit
    $('#checkoutForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var btn = $('#placeOrder');
      btn.disabled = true; btn.textContent = MSG.processing;
      var payload = {
        email: f.email.value.trim(),
        visitorId: visitorId(),
        items: lines.map(function (l) { return { productId: l.p.id, qty: l.qty }; }),
        discountCode: discount ? discount.code : null,
        shipping: {
          firstName: f.firstName.value.trim(), lastName: f.lastName.value.trim(),
          address1: f.address1.value.trim(), address2: f.address2.value.trim(),
          city: f.city.value.trim(), state: f.state.value, zip: f.zip.value.trim(),
          country: f.country.value
        },
        billingSameAsShipping: billSame.checked,
        billing: billSame.checked ? null : {
          address1: f.billAddress1.value.trim(), city: f.billCity.value.trim(),
          state: f.billState.value, zip: f.billZip.value.trim(), country: f.country.value
        },
        simulateFail: !!($('#simulateFail') && $('#simulateFail').checked)
      };
      fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d.error) {
          toast(d.error); btn.disabled = false; btn.textContent = MSG.place;
          return;
        }
        if (d.redirectUrl) { location.href = d.redirectUrl; return; } // stripe / paypal
        if (d.confirmUrl) {
          localStorage.removeItem('mw_cart');
          location.href = d.confirmUrl;
        }
      }).catch(function () {
        toast(MSG.wrong);
        btn.disabled = false; btn.textContent = MSG.place;
      });
    });
  }

  // ---------- confirmation page ----------
  if (window.__PURCHASE) {
    localStorage.removeItem('mw_cart');
    updateBadge();
    var pKey = 'mw_purchase_' + window.__PURCHASE.id;
    if (!localStorage.getItem(pKey)) {
      localStorage.setItem(pKey, '1');
      firePixel('purchase', { number: window.__PURCHASE.number, value: window.__PURCHASE.value });
    }
  }

  // ---------- subscribe form ----------
  var subForm = $('#subscribeForm');
  if (subForm) {
    subForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = subForm.email.value.trim();
      var msg = $('#subMsg');
      fetch('/api/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      }).then(function (r) { return r.json(); }).then(function (d) {
        msg.textContent = d.ok ? MSG.subOk : (d.error || MSG.subFail);
        msg.classList.toggle('err', !d.ok);
        if (d.ok) subForm.reset();
      }).catch(function () { msg.textContent = MSG.subFail; msg.classList.add('err'); });
    });
  }

  // ---------- page view ----------
  track('page_view', { path: location.pathname });
})();
