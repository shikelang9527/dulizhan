'use strict';
// Seed catalog: non-ingestible, low-compliance-risk, light/small pet supplies
// per the 2026 playbook (toys, grooming, beds, walk, feeding accessories).
// No food/treats/supplements/medications. No medical or anti-anxiety claims.
// Scoring: margin/logistics/compliance/content/differentiation/aftersale, 1-5
// each; products below 24 total must not be published.

const now = Date.now();

const products = [
  {
    id: 'p_featherwand', slug: 'whisker-chase-feather-wand', status: 'published',
    name: 'Whisker Chase Feather Wand', category: 'toys',
    price: 1499, compareAtPrice: 1999, cost: 280, shipCost: 320, stock: 120,
    tagline: 'A natural-feather teaser wand that turns lazy afternoons into play sessions.',
    audience: 'For indoor cats that need more daily activity — and owners who want an easy way to play together.',
    benefits: [
      'Real feathers with an erratic, bird-like flutter cats chase instinctively',
      'Solid beech-wood handle with a comfortable grip',
      'Elastic nylon cord makes movement unpredictable and fun',
      'Includes 3 replaceable feather refills — rotate to keep it interesting',
      'Lightweight and easy to store'
    ],
    specs: {
      'Wand length': '30 cm / 11.8 in',
      'Cord length': '60 cm / 23.6 in, elastic',
      'Materials': 'Beech wood, natural feathers, nylon cord',
      'Weight': '45 g',
      'In the box': '1 wand + 3 feather refills',
      'Care': 'Supervised play; store away from pets when not in use'
    },
    faqs: [
      { q: 'Are the feathers safe if my cat bites them?', a: 'Feathers are natural and dye-free, but this is a supervised-play toy. Put it away after each session and replace refills once worn.' },
      { q: 'How do I attach the refills?', a: 'Each refill clips onto the cord loop in seconds — no tools needed.' },
      { q: 'Is it suitable for kittens?', a: 'Yes, for kittens 3 months and older under supervision.' }
    ],
    scoring: { margin: 5, logistics: 5, compliance: 5, content: 5, differentiation: 4, aftersale: 5 },
    images: ['/img/products/whisker-chase-feather-wand-1.svg', '/img/products/whisker-chase-feather-wand-2.svg', '/img/products/whisker-chase-feather-wand-3.svg', '/img/products/whisker-chase-feather-wand-4.svg'],
    createdAt: now
  },
  {
    id: 'p_cattunnel', slug: 'burrow-trio-cat-tunnel', status: 'published',
    name: 'Burrow Trio 3-Way Cat Tunnel', category: 'toys',
    price: 2499, compareAtPrice: 3299, cost: 550, shipCost: 520, stock: 80,
    tagline: 'A collapsible 3-way tunnel that gives indoor cats a place to dash, hide and pounce.',
    audience: 'For single- or multi-cat homes where cats need a hideout and a runway — folds flat when guests come over.',
    benefits: [
      'Three connected tunnels with a peep hole in the center hub',
      'Crinkle fabric lining adds sound feedback cats love',
      'Spring-steel frame pops open in seconds, folds flat for storage',
      'Hanging ball toy included at one entrance',
      'Fits multiple cats playing at once'
    ],
    specs: {
      'Tunnel diameter': '25 cm / 9.8 in',
      'Each arm length': '45 cm / 17.7 in',
      'Folded thickness': '3 cm / 1.2 in',
      'Materials': 'Polyester, spring steel frame, crinkle film lining',
      'Weight': '480 g',
      'Care': 'Spot clean with damp cloth; air dry'
    },
    faqs: [
      { q: 'Will it stay open on hard floors?', a: 'Yes — the spring frame holds its shape, and the fabric base keeps it from sliding on most floors.' },
      { q: 'Can small dogs use it?', a: 'It fits pets up to roughly 4 kg / 9 lb comfortably. It is designed for cats and very small dogs.' },
      { q: 'How small does it fold?', a: 'Each arm folds flat to about 3 cm thick with the included elastic band.' }
    ],
    scoring: { margin: 4, logistics: 4, compliance: 5, content: 5, differentiation: 3, aftersale: 4 },
    images: ['/img/products/burrow-trio-cat-tunnel-1.svg', '/img/products/burrow-trio-cat-tunnel-2.svg', '/img/products/burrow-trio-cat-tunnel-3.svg', '/img/products/burrow-trio-cat-tunnel-4.svg'],
    createdAt: now
  },
  {
    id: 'p_snufflemat', slug: 'sniffquest-snuffle-mat', status: 'published',
    name: 'SniffQuest Snuffle Mat', category: 'toys',
    price: 2299, compareAtPrice: 2899, cost: 520, shipCost: 480, stock: 90,
    tagline: 'A foraging mat that turns mealtime into a nose-work game for your dog.',
    audience: 'For dogs that gulp food too fast or need an indoor activity on rainy days.',
    benefits: [
      'Hide kibble in the fleece layers and let your dog sniff it out',
      'Slows down fast eaters at mealtime',
      'Machine washable — throw it in a laundry bag on cold',
      'Non-slip backing stays put on hard floors',
      'Rolls up for travel and storage'
    ],
    specs: {
      'Size': '50 × 35 cm / 19.7 × 13.8 in',
      'Materials': 'Polar fleece top, oxford non-slip base',
      'Weight': '350 g',
      'Care': 'Machine wash cold in laundry bag, air dry',
      'Note': 'Feeding accessory — use with your dog’s regular food'
    },
    faqs: [
      { q: 'Is it suitable for large dogs?', a: 'Yes. For very enthusiastic diggers, supervise the first few sessions so the mat is sniffed, not shredded.' },
      { q: 'How often should I wash it?', a: 'We recommend washing once a week with regular use, or whenever food residue builds up.' },
      { q: 'Can cats use it too?', a: 'Absolutely — many cats enjoy foraging for treats the same way.' }
    ],
    scoring: { margin: 4, logistics: 4, compliance: 5, content: 5, differentiation: 4, aftersale: 4 },
    images: ['/img/products/sniffquest-snuffle-mat-1.svg', '/img/products/sniffquest-snuffle-mat-2.svg', '/img/products/sniffquest-snuffle-mat-3.svg', '/img/products/sniffquest-snuffle-mat-4.svg'],
    createdAt: now
  },
  {
    id: 'p_cornerbrush', slug: 'cornercomb-self-grooming-brush', status: 'published',
    name: 'CornerComb Self-Grooming Corner Brush', category: 'grooming',
    price: 1299, compareAtPrice: 1699, cost: 220, shipCost: 260, stock: 150,
    tagline: 'A wall-corner brush your cat uses to groom itself — even when you are not home.',
    audience: 'For cats that love face rubs and owners tired of fur on furniture corners.',
    benefits: [
      'Mounts on any wall corner or table edge at cat height',
      'Soft rounded bristles collect loose fur while your cat rubs',
      'Installs with included adhesive strips or screws — two options',
      'Detaches in one click for rinsing clean',
      'Works while you are away'
    ],
    specs: {
      'Size': '13 × 9 × 5 cm / 5.1 × 3.5 × 2 in',
      'Materials': 'ABS base, TPR bristles',
      'Weight': '95 g',
      'In the box': 'Brush, adhesive strips, screws + anchors',
      'Care': 'Pull collected fur off; rinse bristles weekly'
    },
    faqs: [
      { q: 'Will the adhesive damage my wall?', a: 'The included strips are the removable type. For textured walls we recommend the screw mount instead.' },
      { q: 'What height should I install it?', a: 'About the height of your cat’s cheek when standing — typically 20–25 cm from the floor.' },
      { q: 'My cat ignores it. Any tips?', a: 'Rub a little of your cat’s own scent onto it (a quick wipe with a cloth your cat sleeps on usually works).' }
    ],
    scoring: { margin: 5, logistics: 5, compliance: 5, content: 4, differentiation: 3, aftersale: 5 },
    images: ['/img/products/cornercomb-self-grooming-brush-1.svg', '/img/products/cornercomb-self-grooming-brush-2.svg', '/img/products/cornercomb-self-grooming-brush-3.svg', '/img/products/cornercomb-self-grooming-brush-4.svg'],
    createdAt: now
  },
  {
    id: 'p_hairroller', slug: 'furaway-reusable-hair-roller', status: 'published',
    name: 'FurAway Reusable Pet Hair Roller', category: 'grooming',
    price: 1699, compareAtPrice: 2199, cost: 340, shipCost: 340, stock: 140,
    tagline: 'Roll fur off sofas and car seats — no refills, no batteries, empties in one click.',
    audience: 'For every home with a shedding cat or dog and fabric furniture.',
    benefits: [
      'Bi-directional brush head lifts embedded fur from fabric',
      'Fur collects in a chamber — open the lid, dump it, done',
      'No sticky refills to rebuy, no batteries',
      'Works on sofas, beds, car seats, cat trees and carpets',
      'Sturdy handle with soft-touch grip'
    ],
    specs: {
      'Size': '25 × 7.5 × 10 cm / 9.8 × 3 × 3.9 in',
      'Materials': 'ABS body, nylon micro-bristle head',
      'Weight': '220 g',
      'Care': 'Empty chamber after use; wipe bristles with a dry cloth'
    },
    faqs: [
      { q: 'Does it work on clothes?', a: 'It is designed for larger fabric surfaces. For clothing, a small lint brush is more practical.' },
      { q: 'Does it pick up short fine fur?', a: 'Yes — short back-and-forth strokes work best for fine embedded fur.' },
      { q: 'Can I wash the roller?', a: 'Wipe the head with a dry or slightly damp cloth. Do not submerge in water.' }
    ],
    scoring: { margin: 4, logistics: 5, compliance: 5, content: 5, differentiation: 3, aftersale: 5 },
    images: ['/img/products/furaway-reusable-hair-roller-1.svg', '/img/products/furaway-reusable-hair-roller-2.svg', '/img/products/furaway-reusable-hair-roller-3.svg', '/img/products/furaway-reusable-hair-roller-4.svg'],
    createdAt: now
  },
  {
    id: 'p_deshedbrush', slug: 'undercoat-pro-deshedding-brush', status: 'published',
    name: 'UnderCoat Pro De-shedding Brush', category: 'grooming',
    price: 1899, compareAtPrice: 2499, cost: 360, shipCost: 320, stock: 110,
    tagline: 'Reaches the loose undercoat before it reaches your couch.',
    audience: 'For double-coated cats and dogs during shedding season — and the humans who vacuum after them.',
    benefits: [
      'Rounded stainless-steel teeth comb out loose undercoat gently',
      'One-click button retracts pins and releases collected fur',
      'Curved head follows your pet’s body shape',
      'Non-slip ergonomic handle for longer grooming sessions',
      'Suitable for medium and long coats'
    ],
    specs: {
      'Size': '18 × 9 cm / 7.1 × 3.5 in',
      'Materials': 'Stainless steel pins (rounded tips), ABS + TPE handle',
      'Weight': '160 g',
      'Coat types': 'Medium to long, double coats',
      'Care': 'Click to release fur; wipe pins dry after cleaning'
    },
    faqs: [
      { q: 'Will it scratch my pet’s skin?', a: 'The pins have rounded tips and should be used with light pressure. Always brush along the coat direction.' },
      { q: 'How often should I use it?', a: '2–3 short sessions a week during shedding season; once a week otherwise.' },
      { q: 'Is it OK for short-haired pets?', a: 'For very short single coats, a softer rubber brush is usually more comfortable.' }
    ],
    scoring: { margin: 4, logistics: 5, compliance: 5, content: 5, differentiation: 3, aftersale: 4 },
    images: ['/img/products/undercoat-pro-deshedding-brush-1.svg', '/img/products/undercoat-pro-deshedding-brush-2.svg', '/img/products/undercoat-pro-deshedding-brush-3.svg', '/img/products/undercoat-pro-deshedding-brush-4.svg'],
    createdAt: now
  },
  {
    id: 'p_donutbed', slug: 'cloudnine-donut-cuddler-bed', status: 'published',
    name: 'CloudNine Donut Cuddler Bed', category: 'beds',
    price: 3699, compareAtPrice: 4599, cost: 980, shipCost: 850, stock: 60,
    tagline: 'A plush donut bed with a raised rim your pet can curl into and lean against.',
    audience: 'For cats and small-to-medium dogs that like to curl up and rest their head on something soft.',
    benefits: [
      'Raised rim doubles as a head and neck rest',
      'Long faux-fur surface is soft and warm to the touch',
      'Anti-slip dots on the base keep it in place on hard floors',
      'Whole bed is machine washable (gentle cycle)',
      'Neutral colors that fit your living room'
    ],
    specs: {
      'Size M': 'Ø 60 cm / 23.6 in — pets up to 10 kg / 22 lb',
      'Materials': 'Faux fur, PP cotton fill, oxford base with anti-slip dots',
      'Weight': '780 g',
      'Care': 'Machine wash gentle, air dry; wash separately first time',
      'Note': 'Colors may look slightly different between screens and daylight'
    },
    faqs: [
      { q: 'Which size for my pet?', a: 'Measure your pet curled up and add ~15 cm. The M (60 cm) fits most cats and dogs up to 10 kg.' },
      { q: 'Does it flatten over time?', a: 'The PP-cotton fill can compress with heavy daily use. Fluff it after washing to restore loft.' },
      { q: 'Is the fur shed-proof?', a: 'A small amount of loose faux fur on first use is normal and stops after the first wash.' }
    ],
    scoring: { margin: 4, logistics: 3, compliance: 5, content: 5, differentiation: 4, aftersale: 4 },
    images: ['/img/products/cloudnine-donut-cuddler-bed-1.svg', '/img/products/cloudnine-donut-cuddler-bed-2.svg', '/img/products/cloudnine-donut-cuddler-bed-3.svg', '/img/products/cloudnine-donut-cuddler-bed-4.svg'],
    createdAt: now
  },
  {
    id: 'p_blanket', slug: 'pawprint-waffle-fleece-blanket', status: 'published',
    name: 'PawPrint Waffle Fleece Blanket', category: 'beds',
    price: 1999, compareAtPrice: 2599, cost: 420, shipCost: 420, stock: 100,
    tagline: 'A double-layer fleece blanket that protects your sofa and keeps your pet cozy.',
    audience: 'For pets that claim the couch, the bed and the back seat of your car.',
    benefits: [
      'Waffle-textured fleece traps warmth without weight',
      'Protects sofas, duvets and car seats from fur and paw prints',
      'Double-layer stitching resists light kneading and digging',
      'Machine washable and quick to dry',
      'Folds small for travel'
    ],
    specs: {
      'Size': '100 × 80 cm / 39.4 × 31.5 in',
      'Materials': 'Double-layer polar fleece, waffle weave',
      'Weight': '380 g',
      'Care': 'Machine wash cold, tumble dry low or air dry'
    },
    faqs: [
      { q: 'Does fur stick to it badly?', a: 'Fleece does attract some fur — most of it lifts off with a quick shake or a pass of a pet hair roller.' },
      { q: 'Is it safe for pets that chew fabric?', a: 'For heavy chewers, supervise use. It is a blanket, not a chew-resistant product.' },
      { q: 'Can I use it in a pet carrier?', a: 'Yes — folded in half it lines most standard carriers nicely.' }
    ],
    scoring: { margin: 4, logistics: 4, compliance: 5, content: 4, differentiation: 3, aftersale: 5 },
    images: ['/img/products/pawprint-waffle-fleece-blanket-1.svg', '/img/products/pawprint-waffle-fleece-blanket-2.svg', '/img/products/pawprint-waffle-fleece-blanket-3.svg', '/img/products/pawprint-waffle-fleece-blanket-4.svg'],
    createdAt: now
  },
  {
    id: 'p_harness', slug: 'stridesafe-no-pull-harness', status: 'published',
    name: 'StrideSafe No-Pull Dog Harness', category: 'walk',
    price: 2699, compareAtPrice: 3499, cost: 640, shipCost: 460, stock: 85,
    tagline: 'A padded step-in harness with a front clip that helps discourage pulling on walks.',
    audience: 'For dogs that pull on the leash and owners who want more control without pressure on the throat.',
    benefits: [
      'Front and back leash clips — use the front clip to discourage pulling',
      'Breathable padded mesh spreads pressure across the chest, not the neck',
      'Reflective strips for visibility on evening walks',
      'Four adjustment points for a secure fit',
      'Top handle for extra control in busy areas'
    ],
    specs: {
      'Sizes': 'S / M / L (see size chart)',
      'Materials': 'Nylon webbing, breathable mesh, EVA padding',
      'Buckles': 'Quick-release, load-tested',
      'Reflective': '3M-style reflective piping',
      'Care': 'Hand wash, air dry'
    },
    sizeGuide: [
      { size: 'S', chest: '35–45 cm / 13.8–17.7 in', weight: 'up to 7 kg / 15 lb' },
      { size: 'M', chest: '45–60 cm / 17.7–23.6 in', weight: '7–15 kg / 15–33 lb' },
      { size: 'L', chest: '60–80 cm / 23.6–31.5 in', weight: '15–30 kg / 33–66 lb' }
    ],
    faqs: [
      { q: 'How do I measure my dog?', a: 'Measure the widest part of the chest, just behind the front legs. If between sizes, size up and tighten the straps.' },
      { q: 'Will it stop pulling completely?', a: 'A front-clip harness redirects pulling and makes walks easier to manage; consistent leash training is still what changes the habit.' },
      { q: 'Can my dog slip out of it?', a: 'Fitted correctly (two fingers under each strap), escapes are rare. For known escape artists, use the top handle in risky areas.' }
    ],
    scoring: { margin: 4, logistics: 4, compliance: 5, content: 5, differentiation: 4, aftersale: 3 },
    images: ['/img/products/stridesafe-no-pull-harness-1.svg', '/img/products/stridesafe-no-pull-harness-2.svg', '/img/products/stridesafe-no-pull-harness-3.svg', '/img/products/stridesafe-no-pull-harness-4.svg'],
    createdAt: now
  },
  {
    id: 'p_travelbowl', slug: 'roambowl-collapsible-travel-bowl', status: 'published',
    name: 'RoamBowl Collapsible Travel Bowl (2-Pack)', category: 'feeding',
    price: 1399, compareAtPrice: 1899, cost: 290, shipCost: 280, stock: 160,
    tagline: 'Two silicone bowls that collapse flat and clip onto your leash or backpack.',
    audience: 'For hikes, road trips and park days — one bowl for water, one for food.',
    benefits: [
      'Food-grade silicone, BPA-free',
      'Collapses to 2.5 cm flat and weighs almost nothing',
      'Carabiner included — clips to leash, bag or belt loop',
      'Holds 350 ml each when fully open',
      'Dishwasher safe'
    ],
    specs: {
      'Capacity': '350 ml / 12 oz each',
      'Open size': 'Ø 13 × 5.5 cm',
      'Collapsed': '2.5 cm flat',
      'Materials': 'Food-grade silicone, PP rim, aluminum carabiner',
      'Weight': '90 g each',
      'Care': 'Dishwasher safe or rinse with warm water'
    },
    faqs: [
      { q: 'Is the silicone food-safe?', a: 'Yes — food-grade, BPA-free silicone. We publish material specs on every batch.' },
      { q: 'Does it leak when collapsed?', a: 'It is a bowl, not a sealed container — empty it before collapsing.' },
      { q: 'Can large dogs use it?', a: '350 ml suits small and medium dogs per serving; refill for large breeds.' }
    ],
    scoring: { margin: 4, logistics: 5, compliance: 4, content: 4, differentiation: 3, aftersale: 5 },
    images: ['/img/products/roambowl-collapsible-travel-bowl-1.svg', '/img/products/roambowl-collapsible-travel-bowl-2.svg', '/img/products/roambowl-collapsible-travel-bowl-3.svg', '/img/products/roambowl-collapsible-travel-bowl-4.svg'],
    createdAt: now
  },
  {
    id: 'p_ledcollar', slug: 'nightbeacon-led-collar-light', status: 'published',
    name: 'NightBeacon LED Collar Light', category: 'walk',
    price: 1199, compareAtPrice: 1599, cost: 240, shipCost: 240, stock: 130,
    tagline: 'A clip-on LED light so drivers and cyclists see your dog on evening walks.',
    audience: 'For anyone who walks their dog before sunrise or after sunset.',
    benefits: [
      'Three modes: steady, slow flash, fast flash',
      'USB-C rechargeable — about 10 hours per charge',
      'IPX5 water resistant for rainy walks',
      'Clips onto any collar or harness webbing in seconds',
      'Visible from up to ~350 m in the dark'
    ],
    specs: {
      'Size': '5 × 3 × 2 cm',
      'Battery': '120 mAh, USB-C, ~10 h steady mode',
      'Water resistance': 'IPX5 (rain-proof, not for swimming)',
      'Weight': '18 g',
      'In the box': 'Light + USB-C cable'
    },
    faqs: [
      { q: 'Can my dog swim with it?', a: 'No — IPX5 handles rain and splashes, but it should not be submerged.' },
      { q: 'How do I know when it’s charged?', a: 'The indicator glows red while charging and turns green when full (about 1 hour).' },
      { q: 'Does the light bother the dog?', a: 'It points outward, away from the eyes. Most dogs ignore it after the first minute.' }
    ],
    scoring: { margin: 4, logistics: 5, compliance: 4, content: 5, differentiation: 3, aftersale: 3 },
    images: ['/img/products/nightbeacon-led-collar-light-1.svg', '/img/products/nightbeacon-led-collar-light-2.svg', '/img/products/nightbeacon-led-collar-light-3.svg', '/img/products/nightbeacon-led-collar-light-4.svg'],
    createdAt: now
  }
];

// merge in Chinese product copy (storefront zh mode)
const zhContent = require('./seed-zh');
for (const p of products) {
  if (zhContent[p.id]) p.zh = zhContent[p.id];
}

const categories = [
  { key: 'toys', name: 'Toys & Play', zh: '玩具互动', emoji: '🪶' },
  { key: 'grooming', name: 'Grooming & Cleanup', zh: '梳护清洁', emoji: '🧹' },
  { key: 'beds', name: 'Beds & Blankets', zh: '窝垫毯子', emoji: '🛏️' },
  { key: 'walk', name: 'Walk & Outdoor', zh: '出行牵引', emoji: '🦮' },
  { key: 'feeding', name: 'Bowls & Accessories', zh: '碗具配件', emoji: '🥣' }
];

const discounts = [
  {
    id: 'd_welcome10', code: 'WELCOME10', type: 'percent', value: 10,
    minSubtotal: 0, firstOrderOnly: true, active: true, uses: 0,
    note: '首单欢迎折扣（邮件订阅触达）', createdAt: now
  }
];

const defaultSettings = {
  store: {
    name: 'MewMew Co',
    tagline: 'Thoughtful gear for cats & dogs',
    domain: '',
    supportEmail: 'support@example.com', // 上线前改成品牌邮箱，如 support@yourdomain.com
    currency: 'USD',
    market: 'United States'
  },
  shipping: {
    freeThreshold: 3500,        // cents — 满 $35 免邮
    standardRate: 495,          // cents
    handlingDays: '1-3',
    transitDays: '7-15',
    countries: ['United States'],
    dutiesNote: 'US orders under $800 de minimis typically incur no import charges; any duties or taxes, if assessed, are the buyer’s responsibility.'
  },
  payments: {
    mode: 'test',               // test | stripe | alipay | paypal
    stripe: { secretKey: '', publishableKey: '' },
    paypal: { clientId: '', secret: '', sandbox: true }
  },
  pixels: { ga4: '', meta: '', tiktok: '' },
  smtp: { host: '', port: 465, secure: true, user: '', pass: '', from: '' },
  risk: { highValueCents: 15000, ipOrders24h: 3 },
  emailAutomation: { enabled: true, abandoned1Hours: 1, abandoned2Hours: 24, reviewInviteDays: 12 },
  admin: { passwordHash: '', mustChangePassword: true }
};

// 文档第 14 节 · 最终上线前验收表
const checklistItems = [
  { key: 'entity_payment', label: '主体和收款路径确认', manual: true },
  { key: 'pay_test', label: '支付测试成功', manual: false },
  { key: 'refund_test', label: '退款测试成功', manual: false },
  { key: 'payout_test', label: '提现测试成功（支付平台→银行/Wise）', manual: true },
  { key: 'compliance_check', label: '产品合规风险检查（非入口/无医疗宣称）', manual: false },
  { key: 'policy_pages', label: '所有政策页面完成', manual: false },
  { key: 'mobile_test', label: '手机端全流程测试', manual: true },
  { key: 'pixels_ok', label: 'GA4/Pixels 事件正常', manual: false },
  { key: 'email_automation', label: '邮件自动化正常', manual: false },
  { key: 'logistics_policy', label: '物流时效和退货规则清楚', manual: false },
  { key: 'support_email', label: '客服邮箱可用（品牌邮箱已配置）', manual: false },
  { key: 'no_fake', label: '没有假评、侵权图、夸张功效宣称', manual: true },
  { key: 'ad_budget', label: '已准备广告测试预算和停止规则', manual: true }
];

module.exports = { products, categories, discounts, defaultSettings, checklistItems };
