'use strict';
// Footer legal/info pages required before launch (playbook §3 + §12):
// About, Shipping, Return & Refund, Privacy, Terms, Cookie — in EN and ZH.
const { storeLayout } = require('../lib/render');
const { escapeHtml, money } = require('../lib/util');
const db = require('../lib/db');
const { lang } = require('../lib/i18n');

function page(title, bodyHtml, description) {
  const content = `
<section class="wrap section narrow policy">
  <h1 class="page-title">${escapeHtml(title)}</h1>
  ${bodyHtml}
</section>`;
  return storeLayout({ title, description: description || title, content });
}

function vars() {
  const s = db.load('settings', {});
  return {
    name: s.store?.name || 'MewMew Co',
    email: s.store?.supportEmail || 'support@example.com',
    ship: s.shipping || {},
    updated: 'July 2, 2026',
    updatedZh: '2026 年 7 月 2 日'
  };
}

// ============================== ABOUT ==============================
function aboutEn() {
  const { name, email } = vars();
  return page('About us', `
<p><b>${name}</b> is a small, independent pet-supplies brand. We design and curate gear for cats and dogs — toys, grooming tools, beds and walk essentials — working directly with a short list of audited manufacturers.</p>
<h2>What we believe</h2>
<ul>
<li><b>Simple beats gimmicky.</b> A feather wand that flutters right beats a $90 "smart" toy your cat ignores.</li>
<li><b>Nothing ingestible.</b> We deliberately don't sell food, treats, supplements or anything medical. What your pet eats or takes should come from you and your vet — not an ad.</li>
<li><b>Honest pages.</b> Real product photos, realistic delivery estimates, no fake reviews, no miracle claims. If a product has a limitation, we write it in the FAQ.</li>
<li><b>Fix it first.</b> Wrong or damaged item? We reship or refund before we debate.</li>
</ul>
<h2>Contact</h2>
<p>Support: <a href="mailto:${email}">${email}</a> — a human replies within 1 business day.</p>`);
}
function aboutZh() {
  const { name, email } = vars();
  return page('关于我们', `
<p><b>${name}</b> 是一个小而独立的宠物用品品牌。我们为猫和狗设计与甄选好物——玩具、梳护工具、窝垫和出行装备——直接与少数经过审核的制造商合作。</p>
<h2>我们的理念</h2>
<ul>
<li><b>简单胜过花哨。</b>一支飘得恰到好处的羽毛逗猫棒，胜过一个猫咪根本不理的 $90"智能"玩具。</li>
<li><b>不卖入口的东西。</b>我们刻意不卖食品、零食、保健品和任何医疗类产品。宠物吃什么、补什么，应该由你和兽医决定——而不是一条广告。</li>
<li><b>页面诚实。</b>真实产品图、务实的时效预估、没有假评价、没有奇效宣称。产品有局限，我们直接写进问答里。</li>
<li><b>先解决问题。</b>错发或破损？我们先补发或退款，再谈别的。</li>
</ul>
<h2>联系我们</h2>
<p>客服邮箱：<a href="mailto:${email}">${email}</a>——真人回复，1 个工作日内。</p>`);
}

// ============================== SHIPPING ==============================
function shippingEn() {
  const { name, email, ship, updated } = vars();
  return page('Shipping Policy', `
<p class="muted">Last updated: ${updated}</p>
<h2>Processing time</h2>
<p>Orders are processed and dispatched within <b>${ship.handlingDays || '1-3'} business days</b> (Mon–Fri, excluding US public holidays). During promotions this may extend by 1–2 days — we'll note it at checkout when that happens.</p>
<h2>Transit time</h2>
<p>Standard tracked shipping takes an estimated <b>${ship.transitDays || '7-15'} business days</b> from dispatch. <b>This is an estimate based on our carriers' typical performance, not a guarantee.</b> Carrier delays, customs checks and weather can extend it.</p>
<h2>Shipping rates</h2>
<ul>
<li>Orders over ${money(ship.freeThreshold ?? 3500)}: <b>FREE standard shipping</b></li>
<li>Orders under ${money(ship.freeThreshold ?? 3500)}: flat ${money(ship.standardRate ?? 495)}</li>
</ul>
<h2>Destinations</h2>
<p>We currently ship to: <b>${(ship.countries || ['United States']).join(', ')}</b>. We do not ship to PO boxes for some oversized items (noted on the product page), APO/FPO addresses, or US territories at this time.</p>
<h2>Tracking</h2>
<p>You'll receive a tracking number by email when your order ships. Tracking typically begins updating <b>2–5 days after dispatch</b> as the parcel enters the carrier network. If your tracking hasn't moved for 7+ days, contact us and we'll open a carrier investigation.</p>
<h2>Delays</h2>
<p>If we cannot dispatch within the stated processing time, or transit meaningfully exceeds the estimate, <b>we will notify you proactively</b> and offer the choice to keep waiting or cancel undelivered items for a full refund, consistent with the FTC Mail Order Rule.</p>
<h2>Duties & import fees</h2>
<p>${ship.dutiesNote || 'US orders typically incur no import charges; any duties or taxes, if assessed, are the buyer\'s responsibility.'}</p>
<h2>Lost or stuck parcels</h2>
<p>If a parcel is confirmed lost by the carrier, or shows no movement for 20+ days, we reship free of charge or issue a full refund — your choice. Contact <a href="mailto:${email}">${email}</a> with your order number.</p>
<p class="footnote">${name} — this policy is part of our Terms of Service.</p>`);
}
function shippingZh() {
  const { name, email, ship, updatedZh } = vars();
  return page('配送政策', `
<p class="muted">最近更新：${updatedZh}</p>
<h2>处理时效</h2>
<p>订单在 <b>${ship.handlingDays || '1-3'} 个工作日</b>内处理并发出（周一至周五，美国法定假日除外）。促销期间可能延长 1–2 天，届时会在结账页注明。</p>
<h2>运输时效</h2>
<p>标准跟踪物流自发货起预计 <b>${ship.transitDays || '7-15'} 个工作日</b>送达。<b>该时效为基于承运商通常表现的预估值，不构成保证。</b>承运延误、海关查验和天气都可能延长时效。</p>
<h2>运费标准</h2>
<ul>
<li>订单满 ${money(ship.freeThreshold ?? 3500)}：<b>免标准运费</b></li>
<li>未满 ${money(ship.freeThreshold ?? 3500)}：固定运费 ${money(ship.standardRate ?? 495)}</li>
</ul>
<h2>配送范围</h2>
<p>目前配送：<b>${(ship.countries || ['United States']).join(', ')}</b>。部分大件不支持 PO Box（产品页会注明）；暂不支持 APO/FPO 军邮地址及美国海外属地。</p>
<h2>物流跟踪</h2>
<p>订单发货后你会收到含运单号的邮件。包裹进入承运网络后，运单通常在<b>发货后 2–5 天</b>开始更新。如超过 7 天无更新，请联系我们，我们会向承运商发起查件。</p>
<h2>延误处理</h2>
<p>如果我们无法在承诺的处理时效内发货，或运输明显超出预估时效，<b>我们会主动通知你</b>，你可以选择继续等待，或取消未送达商品并获得全额退款（符合美国 FTC 邮购规则）。</p>
<h2>关税与进口费用</h2>
<p>美国订单在 $800 免税额度（de minimis）内通常不产生进口费用；如有任何关税或税费产生，由买家承担。</p>
<h2>丢件与停滞包裹</h2>
<p>承运商确认丢件，或包裹超过 20 天无物流动态的，我们免费补发或全额退款——由你选择。请附订单号联系 <a href="mailto:${email}">${email}</a>。</p>
<p class="footnote">${name} —— 本政策是服务条款的组成部分。</p>`);
}

// ============================== RETURNS ==============================
function returnsEn() {
  const { name, email, updated } = vars();
  return page('Return & Refund Policy', `
<p class="muted">Last updated: ${updated}</p>
<h2>30-day return window</h2>
<p>You may return items within <b>30 days of delivery</b> (per tracking) if they are <b>unused, in original packaging and resalable condition</b>.</p>
<h2>What can and can't be returned</h2>
<ul>
<li>✅ Returnable: toys, grooming tools, beds, blankets, harnesses, bowls and accessories that are unused.</li>
<li>❌ Not returnable: items visibly used by a pet (hygiene), washed textiles, and final-sale items marked as such on the product page.</li>
</ul>
<h2>Return shipping costs</h2>
<ul>
<li>Change of mind / wrong size ordered: <b>buyer pays return shipping</b>. Tip for harnesses: check the size chart before ordering, and we're happy to advise sizing by email first.</li>
<li>Our error (wrong, defective or damaged item): <b>we pay</b> — we'll email a prepaid label or simply reship/refund without requiring a return, depending on the case.</li>
</ul>
<h2>Damaged, wrong or missing items</h2>
<p>Email <a href="mailto:${email}">${email}</a> within <b>48 hours of delivery</b> with your order number and a photo of the item and packaging. We'll reship a replacement or issue a full refund — your choice. No photo of a damaged item = slower resolution, so please snap one.</p>
<h2>How to start a return</h2>
<ol>
<li>Email <a href="mailto:${email}">${email}</a> with your order number (MW-XXXXXX) and reason.</li>
<li>We reply within 1 business day with the return address and instructions. <b>Do not ship returns without contacting us first</b> — unauthorized returns can't be matched to orders reliably.</li>
<li>Ship the item with tracking and send us the tracking number.</li>
</ol>
<h2>Refund timing</h2>
<p>Refunds are issued to your original payment method within <b>5 business days</b> of us receiving the return (or approving the case, for no-return resolutions). Banks typically take another <b>5–10 business days</b> to post it. If 15 business days pass with nothing, contact us with your order number.</p>
<h2>Late or lost orders</h2>
<p>Orders that never arrive (carrier-confirmed lost, or 30+ days with no movement) are reshipped or fully refunded — your choice.</p>
<p class="footnote">${name} — this policy is part of our Terms of Service.</p>`);
}
function returnsZh() {
  const { name, email, updatedZh } = vars();
  return page('退换与退款政策', `
<p class="muted">最近更新：${updatedZh}</p>
<h2>30 天退货窗口</h2>
<p>自签收之日（以物流记录为准）起 <b>30 天内</b>，商品<b>未使用、保留原包装、不影响二次销售</b>即可退货。</p>
<h2>可退与不可退</h2>
<ul>
<li>✅ 可退：未使用的玩具、梳护工具、窝垫、毯子、胸背带、碗具及配件。</li>
<li>❌ 不可退：宠物已明显使用过的商品（卫生原因）、已清洗过的织物类、以及产品页标注"特价不退"的商品。</li>
</ul>
<h2>退货运费</h2>
<ul>
<li>不想要了 / 尺码买错：<b>退货运费由买家承担</b>。胸背带下单前请先看尺码表，也欢迎邮件找我们帮你判断尺码。</li>
<li>我们的失误（错发、瑕疵、破损）：<b>运费我们承担</b>——视情况提供预付退货标签，或直接补发/退款、无需退回。</li>
</ul>
<h2>破损、错发或缺件</h2>
<p>签收后 <b>48 小时内</b>邮件联系 <a href="mailto:${email}">${email}</a>，附订单号和商品及包装照片。补发或全额退款——由你选择。没有照片会拖慢处理速度，请随手拍一张。</p>
<h2>退货流程</h2>
<ol>
<li>邮件联系 <a href="mailto:${email}">${email}</a>，写明订单号（MW-XXXXXX）和退货原因。</li>
<li>我们 1 个工作日内回复退货地址和说明。<b>请勿未联系我们就直接寄回</b>——无法可靠匹配订单的包裹会影响退款。</li>
<li>用可跟踪的方式寄回，并把运单号发给我们。</li>
</ol>
<h2>退款时效</h2>
<p>我们在收到退货（或免退回场景下审核通过）后 <b>5 个工作日内</b>按原路退款；银行/支付机构通常还需 <b>5–10 个工作日</b>入账。如超过 15 个工作日未收到，请附订单号联系我们。</p>
<h2>延误或丢失的订单</h2>
<p>始终未送达的订单（承运商确认丢件，或超过 30 天无物流动态），补发或全额退款——由你选择。</p>
<p class="footnote">${name} —— 本政策是服务条款的组成部分。</p>`);
}

// ============================== PRIVACY ==============================
function privacyEn() {
  const { name, email, updated } = vars();
  return page('Privacy Policy', `
<p class="muted">Last updated: ${updated}</p>
<p>This policy explains what ${name} ("we") collects, why, and your choices.</p>
<h2>What we collect</h2>
<ul>
<li><b>Order data</b> — name, email, shipping/billing address, items ordered. Used to fulfill your order, provide support and meet tax/accounting obligations.</li>
<li><b>Payment data</b> — processed entirely by our payment providers (e.g. Stripe or PayPal). <b>We never see or store your card number.</b></li>
<li><b>Email subscription</b> — your email, if you opt in. Used for the welcome series, order-related messages and occasional product updates. Every marketing email has an unsubscribe path; you can also just reply "unsubscribe".</li>
<li><b>Site analytics</b> — anonymous first-party usage events (page views, cart adds) to improve the store; and, <b>only if you accept cookies</b>, third-party pixels (Google Analytics 4, Meta, TikTok) that help us measure advertising.</li>
<li><b>Support messages</b> — kept so we can resolve your issue and reference past cases.</li>
</ul>
<h2>What we don't do</h2>
<ul>
<li>We don't sell your personal information.</li>
<li>We don't send marketing email without an opt-in.</li>
<li>We don't load marketing pixels if you decline cookies.</li>
</ul>
<h2>Sharing</h2>
<p>We share data only with processors needed to run the store: payment providers, shipping carriers (name/address on the label), our email service, and analytics/advertising platforms you consented to. Each processes data under its own privacy terms.</p>
<h2>Retention</h2>
<p>Order records are kept as long as required for tax and accounting purposes. Subscription data is kept until you unsubscribe. Analytics events rotate automatically.</p>
<h2>Your rights</h2>
<p>Depending on your state (including rights under the CCPA/CPRA for California residents), you may request access to, correction of, or deletion of your personal data, and opt out of targeted advertising. Email <a href="mailto:${email}">${email}</a> — we honor verified requests within 30 days and never discriminate for exercising your rights.</p>
<h2>Children</h2>
<p>Our store is not directed at children under 13 and we do not knowingly collect their data.</p>
<h2>Contact</h2>
<p><a href="mailto:${email}">${email}</a></p>`);
}
function privacyZh() {
  const { name, email, updatedZh } = vars();
  return page('隐私政策', `
<p class="muted">最近更新：${updatedZh}</p>
<p>本政策说明 ${name}（"我们"）收集哪些信息、用途以及你的选择。</p>
<h2>我们收集什么</h2>
<ul>
<li><b>订单信息</b>——姓名、邮箱、收货/账单地址、所购商品。用于履行订单、提供售后和满足税务/记账要求。</li>
<li><b>支付信息</b>——完全由支付服务商（如 Stripe 或 PayPal）处理。<b>我们不接触、不存储你的卡号。</b></li>
<li><b>邮件订阅</b>——仅在你主动订阅时收集邮箱，用于欢迎系列、订单相关通知和偶尔的新品信息。每封营销邮件都可退订，回复"unsubscribe"也可以。</li>
<li><b>站点统计</b>——匿名的第一方行为事件（页面浏览、加购）用于改进商店；<b>仅在你同意 Cookie 后</b>，才会加载第三方像素（Google Analytics 4、Meta、TikTok）用于广告衡量。</li>
<li><b>客服消息</b>——保留用于解决问题和追溯历史工单。</li>
</ul>
<h2>我们不做什么</h2>
<ul>
<li>不出售你的个人信息。</li>
<li>未经订阅不发营销邮件。</li>
<li>你拒绝 Cookie 时不加载营销像素。</li>
</ul>
<h2>信息共享</h2>
<p>仅与运营商店所必需的处理方共享：支付服务商、物流承运商（面单上的姓名/地址）、邮件服务商，以及你同意过的统计/广告平台。各方按其自身隐私条款处理数据。</p>
<h2>保存期限</h2>
<p>订单记录按税务和会计要求的期限保存；订阅数据保存至你退订为止；统计事件自动滚动清理。</p>
<h2>你的权利</h2>
<p>依据你所在州的法律（包括加州 CCPA/CPRA），你可以请求访问、更正或删除个人数据，并拒绝定向广告。发邮件至 <a href="mailto:${email}">${email}</a>——经验证的请求我们在 30 天内处理，且绝不因你行使权利而区别对待。</p>
<h2>未成年人</h2>
<p>本商店不面向 13 岁以下儿童，我们不会有意收集其数据。</p>
<h2>联系方式</h2>
<p><a href="mailto:${email}">${email}</a></p>`);
}

// ============================== TERMS ==============================
function termsEn() {
  const { name, email, updated } = vars();
  return page('Terms of Service', `
<p class="muted">Last updated: ${updated}</p>
<h2>1. The basics</h2>
<p>By using this website and placing an order, you agree to these Terms, our <a href="/pages/shipping-policy">Shipping Policy</a>, <a href="/pages/return-refund-policy">Return & Refund Policy</a>, <a href="/pages/privacy-policy">Privacy Policy</a> and <a href="/pages/cookie-policy">Cookie Policy</a>.</p>
<h2>2. Orders & payment</h2>
<p>An order is accepted when we send the order confirmation email. We may cancel and fully refund orders flagged by fraud screening, priced in error, or out of stock — we'll notify you if that happens. All prices are in USD.</p>
<h2>3. Product information</h2>
<p>We describe products as accurately as we can, including limitations. Product colors may vary slightly between screens and daylight. Our products are <b>pet supplies, not medical devices</b> — nothing we sell diagnoses, treats, cures or prevents any condition, and nothing on this site is veterinary advice.</p>
<h2>4. Safe use</h2>
<p>Supervise pets with any new product, especially toys with small or detachable parts. Discontinue use of damaged items. You are responsible for choosing products appropriate to your pet's size and behavior (size charts are provided where relevant).</p>
<h2>5. Shipping & returns</h2>
<p>Delivery times are estimates. Our delay-notification and refund commitments are described in the Shipping Policy; returns are governed by the Return & Refund Policy.</p>
<h2>6. Reviews & user content</h2>
<p>By submitting a review you grant us a non-exclusive license to display it. We publish genuine customer reviews only — including critical ones — and remove content that is spam, offensive or unrelated. We do not compensate reviews.</p>
<h2>7. Intellectual property</h2>
<p>Site content (text, graphics, product imagery) belongs to ${name} or its licensors. Don't reuse it commercially without permission.</p>
<h2>8. Liability</h2>
<p>To the maximum extent permitted by law, our liability for any claim related to an order is limited to the amount you paid for that order. Nothing in these Terms limits rights you have under applicable consumer law.</p>
<h2>9. Changes</h2>
<p>We may update these Terms; the "last updated" date reflects the current version. Material changes apply to orders placed after the change.</p>
<h2>10. Contact</h2>
<p><a href="mailto:${email}">${email}</a></p>`);
}
function termsZh() {
  const { name, email, updatedZh } = vars();
  return page('服务条款', `
<p class="muted">最近更新：${updatedZh}</p>
<h2>1. 基本约定</h2>
<p>使用本网站并下单，即表示你同意本条款以及<a href="/pages/shipping-policy">配送政策</a>、<a href="/pages/return-refund-policy">退换与退款政策</a>、<a href="/pages/privacy-policy">隐私政策</a>和<a href="/pages/cookie-policy">Cookie 政策</a>。</p>
<h2>2. 订单与支付</h2>
<p>订单在我们发出订单确认邮件时成立。被风控筛查标记、定价错误或缺货的订单，我们可能取消并全额退款——发生时会通知你。所有价格以美元（USD）计。</p>
<h2>3. 产品信息</h2>
<p>我们尽可能准确地描述产品，包括其局限。屏幕显示与自然光下的颜色可能略有差异。我们的产品是<b>宠物用品，不是医疗器械</b>——我们出售的任何商品都不用于诊断、治疗、治愈或预防任何疾病，本站内容也不构成兽医建议。</p>
<h2>4. 安全使用</h2>
<p>宠物使用任何新产品时请在旁看护，尤其是带有小部件或可拆卸部件的玩具。商品破损请停止使用。请根据宠物的体型和习性选择合适的产品（相关产品提供尺码表）。</p>
<h2>5. 配送与退换</h2>
<p>配送时效为预估值。延误通知与退款承诺见配送政策；退换货规则见退换与退款政策。</p>
<h2>6. 评价与用户内容</h2>
<p>提交评价即授予我们非独占的展示许可。我们只发布真实买家评价——包括差评——并会移除垃圾、冒犯或无关内容。我们不为评价提供任何报酬。</p>
<h2>7. 知识产权</h2>
<p>本站内容（文字、图形、产品图片）归 ${name} 或其许可方所有，未经允许请勿商用。</p>
<h2>8. 责任限制</h2>
<p>在法律允许的最大范围内，我们就任一订单相关索赔承担的责任，以你为该订单实际支付的金额为限。本条款不限制你依据适用消费者保护法享有的权利。</p>
<h2>9. 条款变更</h2>
<p>我们可能更新本条款，"最近更新"日期即当前版本。重大变更适用于变更后产生的订单。</p>
<h2>10. 联系方式</h2>
<p><a href="mailto:${email}">${email}</a></p>`);
}

// ============================== COOKIE ==============================
function cookieEn() {
  const { name, email, updated } = vars();
  return page('Cookie Policy', `
<p class="muted">Last updated: ${updated}</p>
<h2>What cookies we use</h2>
<ul>
<li><b>Essential (always on):</b> cart contents, checkout session, cookie-consent memory, language preference. The store can't function without these. They contain no advertising identifiers.</li>
<li><b>First-party analytics (always on, anonymous):</b> a random visitor id that lets us count visits, cart adds and purchases in aggregate. It is never linked to advertising networks.</li>
<li><b>Third-party analytics & marketing (only with your consent):</b> Google Analytics 4, Meta Pixel and TikTok Pixel — used to measure ads and improve the store. <b>These load only after you click "Accept" on the cookie banner.</b></li>
</ul>
<h2>Your choices</h2>
<ul>
<li>Click <b>Decline</b> on the banner → no third-party pixels load. The store works fully.</li>
<li>Changed your mind? Clear this site's cookies/site-data in your browser and the banner will ask again.</li>
<li>Most browsers also let you block third-party cookies globally.</li>
</ul>
<h2>Questions</h2>
<p>${name} — <a href="mailto:${email}">${email}</a></p>`);
}
function cookieZh() {
  const { name, email, updatedZh } = vars();
  return page('Cookie 政策', `
<p class="muted">最近更新：${updatedZh}</p>
<h2>我们使用哪些 Cookie</h2>
<ul>
<li><b>必要类（始终启用）：</b>购物车内容、结账会话、Cookie 同意记录、语言偏好。没有它们商店无法运转，且不含任何广告标识。</li>
<li><b>第一方统计（始终启用、匿名）：</b>一个随机访客 ID，用于汇总统计访问、加购和购买数据，绝不与广告网络关联。</li>
<li><b>第三方统计与营销（仅经你同意）：</b>Google Analytics 4、Meta Pixel、TikTok Pixel——用于衡量广告效果和改进商店。<b>只有在你点击横幅上的"同意"后才会加载。</b></li>
</ul>
<h2>你的选择</h2>
<ul>
<li>点击横幅上的<b>拒绝</b> → 不加载任何第三方像素，商店功能完全不受影响。</li>
<li>改主意了？在浏览器中清除本站 Cookie/站点数据，横幅会重新询问。</li>
<li>大多数浏览器也支持全局屏蔽第三方 Cookie。</li>
</ul>
<h2>疑问</h2>
<p>${name} —— <a href="mailto:${email}">${email}</a></p>`);
}

const pages = {
  'about': () => lang() === 'zh' ? aboutZh() : aboutEn(),
  'shipping-policy': () => lang() === 'zh' ? shippingZh() : shippingEn(),
  'return-refund-policy': () => lang() === 'zh' ? returnsZh() : returnsEn(),
  'privacy-policy': () => lang() === 'zh' ? privacyZh() : privacyEn(),
  'terms-of-service': () => lang() === 'zh' ? termsZh() : termsEn(),
  'cookie-policy': () => lang() === 'zh' ? cookieZh() : cookieEn()
};

module.exports = { pages };
