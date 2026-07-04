'use strict';
// Exports the storefront as a static demo site for GitHub Pages (docs/).
// Requires the local server to be running (npm start) — it crawls the pages.
//
// The static demo is browse-only: full catalog, both languages, policies,
// working client-side cart. Checkout/forms are disabled with a notice, since
// GitHub Pages has no server. Full functionality = deploy the Node app.
//
// Usage: node scripts/export-static.js  [BASE=/repo-name]

const fs = require('fs');
const path = require('path');

const ORIGIN = process.env.ORIGIN || 'http://localhost:4180';
const BASE = (process.env.BASE || '/dulizhan').replace(/\/$/, '');
const OUT = path.join(__dirname, '..', 'docs');

const seed = require('../lib/seed-data');
const slugs = seed.products.filter(p => p.status === 'published').map(p => p.slug);
const catKeys = seed.categories.map(c => c.key);

// [server route, output file, static path (for lang-switch cross links)]
const routes = [
  ['/', 'index.html', '/'],
  ['/shop', 'shop/index.html', '/shop/'],
  ...catKeys.map(k => [`/shop?category=${k}`, `shop/${k}/index.html`, `/shop/${k}/`]),
  ...slugs.map(s => [`/products/${s}`, `products/${s}/index.html`, `/products/${s}/`]),
  ['/cart', 'cart/index.html', '/cart/'],
  ['/checkout', 'checkout/index.html', '/checkout/'],
  ['/faq', 'faq/index.html', '/faq/'],
  ['/track-order', 'track-order/index.html', '/track-order/'],
  ['/contact', 'contact/index.html', '/contact/'],
  ['/pages/about', 'pages/about/index.html', '/pages/about/'],
  ['/pages/shipping-policy', 'pages/shipping-policy/index.html', '/pages/shipping-policy/'],
  ['/pages/return-refund-policy', 'pages/return-refund-policy/index.html', '/pages/return-refund-policy/'],
  ['/pages/privacy-policy', 'pages/privacy-policy/index.html', '/pages/privacy-policy/'],
  ['/pages/terms-of-service', 'pages/terms-of-service/index.html', '/pages/terms-of-service/'],
  ['/pages/cookie-policy', 'pages/cookie-policy/index.html', '/pages/cookie-policy/']
];

const RES_PREFIX = /^(css|js|img|favicon)/;

function demoScript(zh) {
  const note = zh
    ? '这是静态演示站：可浏览商品和页面、可加购物车；下单/表单功能需要部署服务器版（见仓库 README）。'
    : 'This is a static demo: browse products and pages, try the cart; checkout/forms need the server edition (see repo README).';
  const btnText = zh ? '演示站 · 下单需服务器版' : 'Demo — checkout needs server edition';
  return `<script>
window.__STATIC_DEMO=1;window.__PATH_PREFIX=${JSON.stringify(BASE + (zh ? '/zh' : ''))};
document.addEventListener('DOMContentLoaded',function(){
  var po=document.getElementById('placeOrder');
  if(po){po.disabled=true;po.textContent=${JSON.stringify(btnText)};}
  Array.prototype.forEach.call(document.querySelectorAll('form[method="POST"], form[method="post"]'),function(f){
    f.addEventListener('submit',function(e){e.preventDefault();alert(${JSON.stringify(note)});});
  });
});
</script>`;
}

function transform(html, { zh, staticPath }) {
  // 1) demo notice in the announce bar
  html = html.replace(/(<div class="announce">)([^<]*)(<\/div>)/,
    (m, a, txt, b) => a + txt + (zh ? ' · ⚠ 静态演示站' : ' · ⚠ Static demo') + b);

  // 2) /shop?category=x  ->  /shop/x/
  html = html.replace(/href="\/shop\?category=([a-z]+)"/g, 'href="/shop/$1/"');

  // 3) zh tree: prefix internal page links with /zh (resources stay shared)
  if (zh) {
    html = html.replace(/(href|action)="\/(?!\/)([^"]*)"/g, (m, attr, rest) => {
      if (RES_PREFIX.test(rest)) return m;           // shared assets
      return `${attr}="/zh/${rest}"`;
    });
  }

  // 4) prefix everything absolute with BASE
  html = html.replace(/(href|src|action)="\/(?!\/)/g, `$1="${BASE}/`);

  // 5) lang-switch cross link between the two trees — LAST, so the absolute
  //    target is not re-prefixed by the rules above
  const target = zh ? (BASE + staticPath) : (BASE + '/zh' + staticPath);
  html = html.replace(/(<a class="lang-switch" href=")[^"]*(")/, `$1${target}$2`);

  // 6) demo interception script
  html = html.replace('</body>', demoScript(zh) + '</body>');
  return html;
}

function writeOut(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name), d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

async function fetchPage(route, lang) {
  const sep = route.includes('?') ? '&' : '?';
  const res = await fetch(ORIGIN + route + sep + 'lang=' + lang);
  return res.text();
}

(async () => {
  // sanity check: server must be up
  try { await fetch(ORIGIN + '/'); } catch {
    console.error('本地服务器未运行。先执行 npm start 再导出。');
    process.exitCode = 1;
    return;
  }

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  // shared assets
  copyDir(path.join(__dirname, '..', 'public'), OUT);

  let count = 0;
  for (const zh of [false, true]) {
    const lang = zh ? 'zh' : 'en';
    for (const [route, outfile, staticPath] of routes) {
      const html = await fetchPage(route, lang);
      writeOut((zh ? 'zh/' : '') + outfile, processPage(html, zh, staticPath));
      count++;
    }
    // 404 page (GitHub Pages serves 404.html; zh tree uses the en one)
    if (!zh) {
      const nf = await fetchPage('/this-page-does-not-exist', lang);
      writeOut('404.html', processPage(nf, false, '/'));
      count++;
    }
  }
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
  console.log(`Exported ${count} pages + assets to docs/ (BASE=${BASE})`);
})();

// wrapper so the arrow fn above reads clearly
function processPage(html, zh, staticPath) {
  return transform(html, { zh, staticPath });
}
