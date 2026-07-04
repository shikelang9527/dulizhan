'use strict';
const db = require('./db');
const { escapeHtml } = require('./util');

function pixelScripts(settings) {
  const p = settings.pixels || {};
  if (!p.ga4 && !p.meta && !p.tiktok) return '';
  // Third-party pixels load only after cookie consent (see store.js gate).
  return `<script>
window.__loadPixels = function(){
  ${p.ga4 ? `
  var g=document.createElement('script');g.async=1;g.src='https://www.googletagmanager.com/gtag/js?id=${escapeHtml(p.ga4)}';document.head.appendChild(g);
  window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments);};gtag('js',new Date());gtag('config','${escapeHtml(p.ga4)}');` : ''}
  ${p.meta ? `
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init','${escapeHtml(p.meta)}');fbq('track','PageView');` : ''}
  ${p.tiktok ? `
  !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i='https://analytics.tiktok.com/i18n/pixel/events.js';ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement('script');o.type='text/javascript';o.async=!0;o.src=i+'?sdkid='+e+'&lib='+t;var a=document.getElementsByTagName('script')[0];a.parentNode.insertBefore(o,a)};ttq.load('${escapeHtml(p.tiktok)}');ttq.page();}(window,document,'ttq');` : ''}
};
</script>`;
}

function storeLayout({ title, description, content, cartCount, extraHead, bodyClass }) {
  const settings = db.load('settings', {});
  const s = settings.store || {};
  const name = s.name || 'MewMew Co';
  const free = ((settings.shipping?.freeThreshold ?? 3500) / 100).toFixed(0);
  const { t, lang, switchUrl } = require('./i18n');
  const zh = lang() === 'zh';
  const langBtn = zh
    ? `<a class="lang-switch" href="${escapeHtml(switchUrl('en'))}" title="Switch to English">EN</a>`
    : `<a class="lang-switch" href="${escapeHtml(switchUrl('zh'))}" title="切换到中文">中文</a>`;
  const { categories } = require('./seed-data');
  const catLink = key => {
    const c = categories.find(x => x.key === key);
    return c ? (zh && c.zh ? c.zh : c.name) : key;
  };
  return `<!doctype html>
<html lang="${zh ? 'zh-CN' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title ? title + ' — ' + name : name + ' — ' + (s.tagline || ''))}</title>
<meta name="description" content="${escapeHtml(description || s.tagline || '')}">
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/css/store.css?v=20260704-static-ui-fix">
<script>window.__LANG=${JSON.stringify(lang())};</script>
${pixelScripts(settings)}
${extraHead || ''}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<div class="announce">${t('announce', { free })}</div>
<header class="site-header">
  <div class="wrap header-in">
    <a class="logo" href="/">🐾 <span>${escapeHtml(name)}</span></a>
    <nav class="main-nav" id="mainNav">
      <a href="/">${t('nav_home')}</a>
      <a href="/shop">${t('nav_shop')}</a>
      <a href="/faq">${t('nav_faq')}</a>
      <a href="/track-order">${t('nav_track')}</a>
      <a href="/contact">${t('nav_contact')}</a>
    </nav>
    <div class="header-actions">
      ${langBtn}
      <a class="cart-btn cart-drawer-toggle" href="/cart" aria-label="Cart">
        <span class="cart-icon" aria-hidden="true">🛒</span><span class="cart-count" id="cartCount">${cartCount || 0}</span>
      </a>
      <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
    </div>
  </div>
</header>
<main>${content}</main>
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <div class="footer-logo">🐾 ${escapeHtml(name)}</div>
      <p class="footer-tag">${escapeHtml(s.tagline || '')}</p>
      <p class="footer-tag">${t('footer_support')} <a href="mailto:${escapeHtml(s.supportEmail || '')}">${escapeHtml(s.supportEmail || '')}</a></p>
    </div>
    <div>
      <h4>${t('footer_shop')}</h4>
      <a href="/shop">${t('footer_all')}</a>
      <a href="/shop?category=toys">${escapeHtml(catLink('toys'))}</a>
      <a href="/shop?category=grooming">${escapeHtml(catLink('grooming'))}</a>
      <a href="/shop?category=beds">${escapeHtml(catLink('beds'))}</a>
      <a href="/shop?category=walk">${escapeHtml(catLink('walk'))}</a>
    </div>
    <div>
      <h4>${t('footer_help')}</h4>
      <a href="/faq">${t('nav_faq')}</a>
      <a href="/track-order">${t('footer_track')}</a>
      <a href="/pages/shipping-policy">${t('footer_shipping')}</a>
      <a href="/pages/return-refund-policy">${t('footer_returns')}</a>
      <a href="/contact">${t('footer_contact')}</a>
    </div>
    <div>
      <h4>${t('footer_company')}</h4>
      <a href="/pages/about">${t('footer_about')}</a>
      <a href="/pages/privacy-policy">${t('footer_privacy')}</a>
      <a href="/pages/terms-of-service">${t('footer_terms')}</a>
      <a href="/pages/cookie-policy">${t('footer_cookie')}</a>
    </div>
    <div class="footer-sub">
      <h4>${t('footer_sub_title')}</h4>
      <p class="footer-tag">${t('footer_sub_desc')}</p>
      <form id="subscribeForm" class="sub-form">
        <input type="email" name="email" placeholder="${t('footer_sub_ph')}" required>
        <button type="submit">${t('footer_sub_btn')}</button>
      </form>
      <p class="sub-msg" id="subMsg"></p>
    </div>
  </div>
  <div class="wrap footer-bottom">© ${new Date().getFullYear()} ${escapeHtml(name)}. ${t('footer_rights')}</div>
</footer>
<div class="cookie-banner" id="cookieBanner" hidden>
  <p>${t('cookie_msg')}</p>
  <div class="cookie-actions">
    <button class="btn btn-ghost" id="cookieDecline">${t('cookie_decline')}</button>
    <button class="btn btn-primary" id="cookieAccept">${t('cookie_accept')}</button>
  </div>
</div>
<div class="toast" id="toast" hidden></div>
<div class="cart-overlay" id="cartOverlay" hidden></div>
<aside class="cart-drawer" id="cartDrawer" aria-labelledby="cartDrawerTitle" aria-hidden="true">
  <div class="drawer-head">
    <h2 id="cartDrawerTitle">${t('cart_title')}</h2>
    <button class="drawer-close" id="cartDrawerClose" type="button" aria-label="Close cart">×</button>
  </div>
  <div class="drawer-body">
    <div class="drawer-shipping" id="drawerShipping" hidden>
      <p id="drawerShippingText"></p>
      <div class="drawer-progress" aria-hidden="true"><span id="drawerProgressBar"></span></div>
    </div>
    <div id="drawerItems" class="drawer-items"></div>
  </div>
  <div class="drawer-foot" id="drawerFoot" hidden>
    <div class="drawer-total"><span>${t('sum_total')}</span><strong id="drawerTotal">$0.00</strong></div>
    <a class="btn btn-primary btn-block drawer-checkout" href="/checkout">${t('checkout_title')}</a>
    <p class="drawer-note">30-day happiness guarantee</p>
  </div>
</aside>
<script src="/js/store.js?v=20260704-static-ui-fix"></script>
</body>
</html>`;
}

const ADMIN_NAV = [
  { href: '/admin', key: 'dashboard', label: '📊 仪表盘' },
  { href: '/admin/orders', key: 'orders', label: '📦 订单' },
  { href: '/admin/products', key: 'products', label: '🏷️ 产品' },
  { href: '/admin/discounts', key: 'discounts', label: '🎟️ 优惠码' },
  { href: '/admin/reviews', key: 'reviews', label: '⭐ 评价审核' },
  { href: '/admin/subscribers', key: 'subscribers', label: '📮 订阅者' },
  { href: '/admin/messages', key: 'messages', label: '💬 客服消息' },
  { href: '/admin/emails', key: 'emails', label: '✉️ 邮件中心' },
  { href: '/admin/ads', key: 'ads', label: '📈 广告测试' },
  { href: '/admin/checklist', key: 'checklist', label: '✅ 上线验收' },
  { href: '/admin/settings', key: 'settings', label: '⚙️ 设置' }
];

function adminLayout({ title, content, active, badge }) {
  const settings = db.load('settings', {});
  const name = settings.store?.name || 'MewMew Co';
  const nav = ADMIN_NAV.map(n =>
    `<a class="${n.key === active ? 'active' : ''}" href="${n.href}">${n.label}${badge && badge[n.key] ? `<span class="nav-badge">${badge[n.key]}</span>` : ''}</a>`
  ).join('');
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · ${escapeHtml(name)} 管理后台</title>
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/css/admin.css?v=20260704-dashboard-actions">
</head>
<body>
<div class="admin-shell">
  <aside class="admin-side">
    <div class="admin-brand">🐾 ${escapeHtml(name)}<span>管理后台</span></div>
    <nav class="admin-nav">${nav}</nav>
    <div class="admin-side-foot">
      <a href="/" target="_blank">↗ 查看店铺前台</a>
      <a href="/admin/logout">退出登录</a>
    </div>
  </aside>
  <main class="admin-main">
    <div class="admin-topbar">
      <div>
        <span class="admin-kicker">独立站运营后台</span>
        <h1 class="admin-title">${escapeHtml(title)}</h1>
      </div>
      <a class="btn btn-ghost admin-store-link" href="/" target="_blank">查看前台</a>
    </div>
    ${content}
  </main>
</div>
<div class="toast" id="toast" hidden></div>
<script src="/js/admin.js"></script>
</body>
</html>`;
}

module.exports = { storeLayout, adminLayout };
