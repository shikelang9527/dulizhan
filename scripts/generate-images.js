'use strict';
// Generates the demo product illustrations (SVG) — clean flat geometric style,
// consistent brand palette. These are placeholders-with-dignity: replace with
// real supplier/self-shot photos before launch (playbook Day 2 requires real
// photos; watermark/brand-stolen images are forbidden).
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'img');
const POUT = path.join(OUT, 'products');
fs.mkdirSync(POUT, { recursive: true });

const C = {
  brand: '#E8734A', brandLight: '#F9B384', brandSoft: '#FDF1EA',
  mint: '#7FB69D', mintSoft: '#EEF7F2', cream: '#F5E6D3',
  ink: '#3D3129', inkSoft: '#8C7D6F', white: '#FFFFFF',
  wood: '#C89B6D', gray: '#B8AFA3', yellow: '#F2C94C'
};

// ---------- shared silhouettes ----------
function catSil(x, y, s, fill) {
  return `<g transform="translate(${x},${y}) scale(${s})" fill="${fill}">
    <circle cx="0" cy="0" r="34"/>
    <path d="M-30,-18 L-38,-48 L-10,-30 Z"/><path d="M30,-18 L38,-48 L10,-30 Z"/>
    <ellipse cx="0" cy="60" rx="42" ry="34"/>
    <path d="M38,72 Q78,66 74,30 Q72,20 64,22 Q68,54 34,58 Z"/>
  </g>`;
}
function dogSil(x, y, s, fill) {
  return `<g transform="translate(${x},${y}) scale(${s})" fill="${fill}">
    <circle cx="0" cy="0" r="36"/>
    <path d="M-26,-24 Q-52,-20 -46,14 Q-40,26 -30,16 Z"/>
    <path d="M26,-24 Q52,-20 46,14 Q40,26 30,16 Z"/>
    <ellipse cx="0" cy="66" rx="46" ry="38"/>
    <path d="M40,80 Q70,88 76,60 L66,54 Q60,74 36,68 Z"/>
  </g>`;
}
function pawPrint(x, y, s, fill, rot) {
  return `<g transform="translate(${x},${y}) rotate(${rot || 0}) scale(${s})" fill="${fill}">
    <ellipse cx="0" cy="8" rx="14" ry="12"/>
    <circle cx="-14" cy="-8" r="6"/><circle cx="-5" cy="-13" r="6"/>
    <circle cx="5" cy="-13" r="6"/><circle cx="14" cy="-8" r="6"/>
  </g>`;
}

// ---------- product artwork (each returns svg group centered ~300,300) ----------
const art = {
  'whisker-chase-feather-wand': () => `
    <g transform="rotate(-24 300 300)">
      <rect x="285" y="180" width="14" height="240" rx="7" fill="${C.wood}"/>
      <rect x="285" y="180" width="14" height="50" rx="7" fill="#B0834F"/>
    </g>
    <path d="M240,215 Q160,170 150,260 Q148,300 185,320" stroke="${C.inkSoft}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <g transform="translate(185,330)">
      <path d="M0,0 Q-38,44 -8,96 Q6,60 6,30 Z" fill="${C.brand}"/>
      <path d="M4,4 Q40,50 12,100 Q0,62 -2,32 Z" fill="${C.brandLight}"/>
      <path d="M0,8 Q-4,70 2,104 Q8,66 4,28 Z" fill="${C.mint}"/>
      <circle cx="2" cy="2" r="9" fill="${C.ink}"/>
    </g>`,
  'burrow-trio-cat-tunnel': () => `
    <g>
      <path d="M140,330 L240,270 L240,390 L140,450 Z" fill="${C.brandLight}"/>
      <ellipse cx="140" cy="390" rx="34" ry="62" fill="${C.ink}" opacity=".85"/>
      <ellipse cx="140" cy="390" rx="34" ry="62" fill="none" stroke="${C.brand}" stroke-width="9"/>
      <path d="M460,330 L360,270 L360,390 L460,450 Z" fill="${C.mint}"/>
      <ellipse cx="460" cy="390" rx="34" ry="62" fill="${C.ink}" opacity=".85"/>
      <ellipse cx="460" cy="390" rx="34" ry="62" fill="none" stroke="${C.mint}" stroke-width="9"/>
      <path d="M240,270 L300,180 L360,270 L360,390 L300,440 L240,390 Z" fill="${C.brand}"/>
      <ellipse cx="300" cy="205" rx="52" ry="40" fill="${C.ink}" opacity=".85"/>
      <ellipse cx="300" cy="205" rx="52" ry="40" fill="none" stroke="${C.brandLight}" stroke-width="9"/>
      <circle cx="300" cy="330" r="17" fill="${C.cream}"/>
      <line x1="240" y1="300" x2="240" y2="380" stroke="${C.ink}" stroke-width="3" opacity=".2"/>
      <line x1="360" y1="300" x2="360" y2="380" stroke="${C.ink}" stroke-width="3" opacity=".2"/>
    </g>`,
  'sniffquest-snuffle-mat': () => `
    <g transform="rotate(-6 300 300)">
      <rect x="140" y="210" width="320" height="200" rx="22" fill="${C.mint}"/>
      ${Array.from({ length: 6 }, (_, r) => Array.from({ length: 9 }, (_, c) => {
        const colors = [C.brand, C.brandLight, C.cream, C.mintSoft];
        return `<circle cx="${168 + c * 33}" cy="${240 + r * 29}" r="11" fill="${colors[(r + c) % 4]}"/>`;
      }).join('')).join('')}
      <circle cx="430" cy="250" r="8" fill="${C.ink}"/>
    </g>`,
  'cornercomb-self-grooming-brush': () => `
    <g>
      <path d="M180,160 L180,460 L200,460 L200,160 Z" fill="${C.cream}"/>
      <path d="M200,160 L420,240 L420,380 L200,460 Z" fill="#EFE0CB"/>
      <g transform="translate(210,310) rotate(-20)">
        <path d="M0,-70 Q95,-40 95,40 Q95,58 78,52 Q20,30 0,70 Z" fill="${C.brand}"/>
        ${Array.from({ length: 6 }, (_, i) => `<path d="M${18 + i * 12},${-58 + i * 9} q26,4 44,22" stroke="${C.brandSoft}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}
      </g>
      ${catSil(360, 420, 0.9, C.inkSoft)}
    </g>`,
  'furaway-reusable-hair-roller': () => `
    <g transform="rotate(-18 300 300)">
      <rect x="180" y="200" width="150" height="180" rx="34" fill="${C.brand}"/>
      <rect x="196" y="216" width="118" height="148" rx="24" fill="${C.brandLight}"/>
      <rect x="212" y="232" width="86" height="116" rx="16" fill="${C.brandSoft}"/>
      <rect x="330" y="266" width="140" height="48" rx="24" fill="${C.ink}"/>
      <rect x="440" y="272" width="36" height="36" rx="18" fill="${C.inkSoft}"/>
      <path d="M226,250 q30,-14 58,0" stroke="${C.gray}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M226,290 q30,-14 58,0" stroke="${C.gray}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M226,330 q30,-14 58,0" stroke="${C.gray}" stroke-width="5" fill="none" stroke-linecap="round"/>
    </g>`,
  'undercoat-pro-deshedding-brush': () => `
    <g transform="rotate(14 300 300)">
      <rect x="270" y="290" width="60" height="150" rx="28" fill="${C.mint}"/>
      <rect x="282" y="302" width="36" height="90" rx="18" fill="${C.mintSoft}"/>
      <path d="M190,220 Q300,160 410,220 L410,270 Q300,230 190,270 Z" fill="${C.brand}"/>
      ${Array.from({ length: 11 }, (_, i) => `<rect x="${205 + i * 19}" y="${248 - Math.sin(i / 10 * Math.PI) * 22}" width="6" height="46" rx="3" fill="${C.gray}"/>`).join('')}
      <circle cx="300" cy="330" r="12" fill="${C.brand}"/>
    </g>`,
  'cloudnine-donut-cuddler-bed': () => `
    <g>
      <ellipse cx="300" cy="330" rx="190" ry="130" fill="${C.brandLight}"/>
      <ellipse cx="300" cy="316" rx="188" ry="122" fill="${C.cream}"/>
      <ellipse cx="300" cy="330" rx="120" ry="74" fill="#EFE0CB"/>
      <ellipse cx="300" cy="336" rx="112" ry="66" fill="${C.brandSoft}"/>
      ${Array.from({ length: 12 }, (_, i) => {
        const a = i / 12 * Math.PI * 2;
        return `<ellipse cx="${300 + Math.cos(a) * 156}" cy="${316 + Math.sin(a) * 98}" rx="26" ry="20" fill="${C.cream}" stroke="#EADCC6" stroke-width="3" transform="rotate(${a * 57.3} ${300 + Math.cos(a) * 156} ${316 + Math.sin(a) * 98})"/>`;
      }).join('')}
      ${catSil(300, 320, 1.05, C.inkSoft)}
    </g>`,
  'pawprint-waffle-fleece-blanket': () => `
    <g transform="rotate(-5 300 300)">
      <rect x="150" y="200" width="300" height="220" rx="20" fill="${C.mint}"/>
      ${Array.from({ length: 5 }, (_, r) => Array.from({ length: 7 }, (_, c) =>
        `<rect x="${168 + c * 38}" y="${218 + r * 38}" width="30" height="30" rx="7" fill="${C.mintSoft}" opacity=".6"/>`).join('')).join('')}
      ${pawPrint(240, 290, 1.1, C.white, -12)}
      ${pawPrint(340, 350, 0.9, C.white, 14)}
      <path d="M150,390 Q300,430 450,390 L450,420 L150,420 Z" fill="#6FA58C"/>
    </g>`,
  'stridesafe-no-pull-harness': () => `
    <g>
      <path d="M300,170 Q420,200 430,300 Q434,380 300,400 Q166,380 170,300 Q180,200 300,170 Z" fill="${C.brand}"/>
      <path d="M300,190 Q404,216 412,300 Q414,366 300,382 Q186,366 188,300 Q196,216 300,190 Z" fill="${C.brandLight}"/>
      <ellipse cx="300" cy="292" rx="66" ry="80" fill="${C.brandSoft}"/>
      <rect x="278" y="150" width="44" height="34" rx="8" fill="${C.ink}"/>
      <circle cx="300" cy="208" r="16" fill="${C.gray}"/>
      <circle cx="300" cy="208" r="8" fill="${C.white}"/>
      <path d="M186,296 L414,296" stroke="${C.mint}" stroke-width="14" stroke-linecap="round"/>
      <path d="M196,320 L404,320" stroke="${C.white}" stroke-width="5" stroke-dasharray="14 10" stroke-linecap="round"/>
      <rect x="228" y="336" width="40" height="26" rx="10" fill="${C.ink}"/>
      <rect x="332" y="336" width="40" height="26" rx="10" fill="${C.ink}"/>
    </g>`,
  'roambowl-collapsible-travel-bowl': () => `
    <g>
      <g transform="translate(220,300)">
        <ellipse cx="0" cy="66" rx="104" ry="26" fill="#D8CFC2" opacity=".5"/>
        <path d="M-96,-10 L96,-10 L74,58 L-74,58 Z" fill="${C.brand}"/>
        <path d="M-78,8 L78,8 L64,58 L-64,58 Z" fill="${C.brandLight}" opacity=".55"/>
        <ellipse cx="0" cy="-10" rx="96" ry="30" fill="${C.brandLight}"/>
        <ellipse cx="0" cy="-10" rx="72" ry="20" fill="#B3502C"/>
      </g>
      <g transform="translate(415,330)">
        <ellipse cx="0" cy="34" rx="72" ry="18" fill="#D8CFC2" opacity=".5"/>
        <path d="M-66,-6 L66,-6 L58,28 L-58,28 Z" fill="${C.mint}"/>
        <ellipse cx="0" cy="-6" rx="66" ry="20" fill="#A8CCBB"/>
        <ellipse cx="0" cy="-6" rx="46" ry="13" fill="#578A72"/>
      </g>
      <path d="M330,196 q22,-30 44,0 q10,16 -6,24 l-30,0 q-18,-8 -8,-24 Z" fill="none" stroke="${C.gray}" stroke-width="9"/>
    </g>`,
  'nightbeacon-led-collar-light': () => `
    <g>
      <circle cx="300" cy="300" r="150" fill="${C.yellow}" opacity=".14"/>
      <circle cx="300" cy="300" r="105" fill="${C.yellow}" opacity=".2"/>
      ${Array.from({ length: 8 }, (_, i) => {
        const a = i / 8 * Math.PI * 2;
        return `<line x1="${300 + Math.cos(a) * 128}" y1="${300 + Math.sin(a) * 128}" x2="${300 + Math.cos(a) * 158}" y2="${300 + Math.sin(a) * 158}" stroke="${C.yellow}" stroke-width="7" stroke-linecap="round"/>`;
      }).join('')}
      <rect x="248" y="244" width="104" height="120" rx="34" fill="${C.ink}"/>
      <circle cx="300" cy="292" r="34" fill="${C.yellow}"/>
      <circle cx="300" cy="292" r="20" fill="#FBE59B"/>
      <rect x="272" y="352" width="56" height="16" rx="8" fill="${C.inkSoft}"/>
      <path d="M258,238 q42,-26 84,0" stroke="${C.brand}" stroke-width="12" fill="none" stroke-linecap="round"/>
    </g>`
};

// ---------- sizes/dimension labels per product ----------
const dims = {
  'whisker-chase-feather-wand': ['30 cm / 11.8 in', 'wand length'],
  'burrow-trio-cat-tunnel': ['Ø 25 cm / 9.8 in', 'tunnel diameter'],
  'sniffquest-snuffle-mat': ['50 × 35 cm', '19.7 × 13.8 in'],
  'cornercomb-self-grooming-brush': ['13 × 9 cm', '5.1 × 3.5 in'],
  'furaway-reusable-hair-roller': ['25 cm / 9.8 in', 'total length'],
  'undercoat-pro-deshedding-brush': ['18 × 9 cm', '7.1 × 3.5 in'],
  'cloudnine-donut-cuddler-bed': ['Ø 60 cm / 23.6 in', 'size M · pets up to 10 kg'],
  'pawprint-waffle-fleece-blanket': ['100 × 80 cm', '39.4 × 31.5 in'],
  'stridesafe-no-pull-harness': ['S · M · L', 'see size chart'],
  'nightbeacon-led-collar-light': ['5 × 3 × 2 cm', '18 g · USB-C']
};
const details = {
  'whisker-chase-feather-wand': ['Natural feathers', 'Beech wood · nylon cord'],
  'burrow-trio-cat-tunnel': ['Crinkle lining', 'Spring-steel frame'],
  'sniffquest-snuffle-mat': ['Polar fleece', 'Machine washable'],
  'cornercomb-self-grooming-brush': ['TPR soft bristles', 'Adhesive or screw mount'],
  'furaway-reusable-hair-roller': ['No refills needed', 'One-click empty'],
  'undercoat-pro-deshedding-brush': ['Rounded steel pins', 'One-click fur release'],
  'cloudnine-donut-cuddler-bed': ['Faux fur · PP fill', 'Machine washable'],
  'pawprint-waffle-fleece-blanket': ['Double-layer fleece', 'Waffle weave'],
  'stridesafe-no-pull-harness': ['Front + back clips', 'Reflective piping'],
  'nightbeacon-led-collar-light': ['3 light modes', 'IPX5 · USB-C']
};
const petFor = {
  'whisker-chase-feather-wand': 'cat', 'burrow-trio-cat-tunnel': 'cat',
  'sniffquest-snuffle-mat': 'dog', 'cornercomb-self-grooming-brush': 'cat',
  'furaway-reusable-hair-roller': 'cat', 'undercoat-pro-deshedding-brush': 'dog',
  'cloudnine-donut-cuddler-bed': 'cat', 'pawprint-waffle-fleece-blanket': 'dog',
  'stridesafe-no-pull-harness': 'dog', 'roambowl-collapsible-travel-bowl': 'dog',
  'nightbeacon-led-collar-light': 'dog'
};
dims['roambowl-collapsible-travel-bowl'] = ['350 ml / 12 oz', 'collapses to 2.5 cm'];
details['roambowl-collapsible-travel-bowl'] = ['Food-grade silicone', 'Dishwasher safe'];

function svgWrap(inner, bg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
<rect width="600" height="600" fill="${bg}"/>
${inner}
</svg>`;
}

function variant1(slug) { // hero shot
  return svgWrap(`
  <circle cx="300" cy="310" r="215" fill="${C.white}" opacity=".55"/>
  ${art[slug]()}
  ${pawPrint(80, 90, 0.8, C.white, -18)}${pawPrint(520, 510, 0.7, C.white, 24)}`, C.brandSoft);
}
function variant2(slug) { // lifestyle scene with pet silhouette
  const pet = petFor[slug] === 'dog' ? dogSil(140, 170, 1.15, '#5E5248') : catSil(140, 160, 1.15, '#5E5248');
  return svgWrap(`
  <circle cx="300" cy="300" r="252" fill="${C.mintSoft}"/>
  <path d="M48,470 Q300,400 552,470 L552,600 L48,600 Z" fill="${C.mint}" opacity=".35"/>
  ${pet}
  <g transform="translate(30,40) scale(.92)">${art[slug]()}</g>
  ${pawPrint(500, 120, 0.9, C.mint, 20)}`, C.white);
}
function variant3(slug) { // dimensions
  const [d1, d2] = dims[slug];
  return svgWrap(`
  <g opacity=".92">${art[slug]()}</g>
  <line x1="110" y1="520" x2="490" y2="520" stroke="${C.ink}" stroke-width="3"/>
  <line x1="110" y1="508" x2="110" y2="532" stroke="${C.ink}" stroke-width="3"/>
  <line x1="490" y1="508" x2="490" y2="532" stroke="${C.ink}" stroke-width="3"/>
  <rect x="180" y="494" width="240" height="52" rx="26" fill="${C.ink}"/>
  <text x="300" y="521" text-anchor="middle" font-family="Arial" font-size="21" font-weight="bold" fill="${C.white}">${d1}</text>
  <text x="300" y="76" text-anchor="middle" font-family="Arial" font-size="19" fill="${C.inkSoft}">${d2}</text>`, C.white);
}
function variant4(slug) { // detail / materials
  const [t1, t2] = details[slug];
  return svgWrap(`
  <clipPath id="zoom"><circle cx="300" cy="270" r="200"/></clipPath>
  <circle cx="300" cy="270" r="200" fill="${C.brandSoft}"/>
  <g clip-path="url(#zoom)"><g transform="translate(-90,-120) scale(1.35)">${art[slug]()}</g></g>
  <circle cx="300" cy="270" r="200" fill="none" stroke="${C.brand}" stroke-width="7"/>
  <rect x="120" y="500" width="360" height="66" rx="18" fill="${C.mintSoft}"/>
  <text x="300" y="528" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="${C.ink}">${t1}</text>
  <text x="300" y="552" text-anchor="middle" font-family="Arial" font-size="16" fill="${C.inkSoft}">${t2}</text>`, C.white);
}

for (const slug of Object.keys(art)) {
  fs.writeFileSync(path.join(POUT, `${slug}-1.svg`), variant1(slug));
  fs.writeFileSync(path.join(POUT, `${slug}-2.svg`), variant2(slug));
  fs.writeFileSync(path.join(POUT, `${slug}-3.svg`), variant3(slug));
  fs.writeFileSync(path.join(POUT, `${slug}-4.svg`), variant4(slug));
}

// ---------- hero + favicon ----------
fs.writeFileSync(path.join(OUT, 'hero.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 480">
<circle cx="280" cy="240" r="216" fill="${C.brandSoft}"/>
<path d="M60,384 Q280,320 500,384 L500,480 L60,480 Z" fill="${C.mint}" opacity=".3"/>
${dogSil(370, 240, 1.5, '#8A6E52')}
${catSil(180, 260, 1.35, '#5E5248')}
<circle cx="180" cy="252" r="7" fill="#fff"/><circle cx="205" cy="252" r="7" fill="#fff"/>
<circle cx="182" cy="254" r="3.4" fill="${C.ink}"/><circle cx="207" cy="254" r="3.4" fill="${C.ink}"/>
<path d="M186,272 q8,8 16,0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
<circle cx="362" cy="232" r="8" fill="#fff"/><circle cx="392" cy="232" r="8" fill="#fff"/>
<circle cx="364" cy="234" r="3.8" fill="${C.ink}"/><circle cx="394" cy="234" r="3.8" fill="${C.ink}"/>
<ellipse cx="378" cy="252" rx="9" ry="7" fill="${C.ink}"/>
<path d="M370,264 q8,9 18,0" stroke="${C.ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<circle cx="292" cy="360" r="26" fill="${C.brand}"/>
<path d="M270,352 q22,-12 44,4 M268,364 q24,-8 46,6" stroke="${C.brandLight}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
${pawPrint(90, 100, 1, C.brandLight, -16)}
${pawPrint(470, 90, 0.85, C.mint, 18)}
${pawPrint(500, 400, 0.8, C.brandLight, -8)}
<g transform="translate(120,392)"><path d="M0,0 Q-30,36 -6,76 Q4,48 4,24 Z" fill="${C.brand}" transform="rotate(20)"/></g>
</svg>`);

fs.writeFileSync(path.join(OUT, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="${C.brand}"/>
${pawPrint(32, 34, 1.35, '#fff', 0)}
</svg>`);

console.log('Generated', Object.keys(art).length * 4 + 2, 'SVG assets.');
