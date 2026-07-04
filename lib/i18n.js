'use strict';
// Storefront i18n: en (default, US market) + zh (中文).
// Rendering is fully synchronous per request, so a module-level context is
// safe here — server.js sets it in middleware before any view renders.
// dict values are [en, zh]; {var} placeholders are substituted by t().

const ctx = { lang: 'en', url: '/' };

function setContext(lang, url) {
  ctx.lang = lang === 'zh' ? 'zh' : 'en';
  ctx.url = url || '/';
}
function lang() { return ctx.lang; }
// choose product-content field: zh version if present & zh mode, else en
function pick(en, zh) { return ctx.lang === 'zh' && zh != null && zh !== '' ? zh : en; }

function switchUrl(target) {
  const [path, q] = (ctx.url || '/').split('?');
  const params = new URLSearchParams(q || '');
  params.set('lang', target);
  return path + '?' + params.toString();
}

const dict = {
  // ---- layout ----
  announce: ['Free US shipping on orders over ${free} · 30-day returns', '全美满 ${free} 免邮 · 30 天无忧退货'],
  nav_home: ['Home', '首页'],
  nav_shop: ['Shop', '商店'],
  nav_faq: ['FAQ', '常见问题'],
  nav_track: ['Track Order', '订单查询'],
  nav_contact: ['Contact', '联系我们'],
  footer_shop: ['Shop', '选购'],
  footer_all: ['All products', '全部商品'],
  footer_help: ['Help', '帮助'],
  footer_company: ['Company', '关于'],
  footer_track: ['Track your order', '订单查询'],
  footer_shipping: ['Shipping Policy', '配送政策'],
  footer_returns: ['Returns & Refunds', '退换与退款'],
  footer_contact: ['Contact us', '联系我们'],
  footer_about: ['About us', '关于我们'],
  footer_privacy: ['Privacy Policy', '隐私政策'],
  footer_terms: ['Terms of Service', '服务条款'],
  footer_cookie: ['Cookie Policy', 'Cookie 政策'],
  footer_sub_title: ['Get 10% off your first order', '订阅领首单 9 折券'],
  footer_sub_desc: ['Pet care tips & early access. No spam, unsubscribe anytime.', '养宠小贴士和新品优先购。绝不骚扰,随时退订。'],
  footer_sub_btn: ['Join', '订阅'],
  footer_sub_ph: ['your@email.com', '你的邮箱'],
  footer_support: ['Support:', '客服邮箱:'],
  footer_rights: ['All rights reserved.', '保留所有权利。'],
  cookie_msg: ['We use cookies to run the store and — only if you agree — analytics/marketing pixels. See our <a href="/pages/cookie-policy">Cookie Policy</a>.', '我们使用必要 Cookie 维持商店运行;仅在你同意后才会加载分析/营销像素。详见 <a href="/pages/cookie-policy">Cookie 政策</a>。'],
  cookie_accept: ['Accept', '同意'],
  cookie_decline: ['Decline', '拒绝'],

  // ---- home ----
  hero_eyebrow: ['For cats & dogs (and their humans)', '给猫猫狗狗(和它们的人类)'],
  hero_title: ['Thoughtful gear.<br>Happy pets.<br>No gimmicks.', '用心选的好物。<br>开心的毛孩子。<br>不玩噱头。'],
  hero_lead: ['Toys, grooming tools, beds and walk essentials — carefully selected, honestly described, shipped to your door with a 30-day return promise.', '玩具、梳护工具、窝垫和出行装备——认真选品、诚实描述,送货上门,30 天无忧退货。'],
  hero_cta_shop: ['Shop all products', '逛逛全部商品'],
  hero_cta_story: ['Our story', '品牌故事'],
  trust_1: ['🚚 <b>Free US shipping</b> over $35', '🚚 满 $35 <b>全美免邮</b>'],
  trust_2: ['↩️ <b>30-day returns</b> on unused items', '↩️ 未使用商品 <b>30 天退货</b>'],
  trust_3: ['📦 <b>Tracked delivery</b> 7–15 business days*', '📦 <b>全程物流跟踪</b> 7–15 个工作日*'],
  trust_4: ['💬 <b>Human support</b> within 1 business day', '💬 <b>真人客服</b> 1 个工作日内回复'],
  home_cats_title: ['Shop by category', '按分类选购'],
  home_feat_title: ['Bestsellers & new arrivals', '热卖与新品'],
  view_all: ['View all →', '查看全部 →'],
  promise_title: ['Our promises', '我们的承诺'],
  promise_1_t: ['🧸 Safe by design', '🧸 从选品就安全'],
  promise_1_p: ['We only stock non-ingestible gear — no food, treats, supplements or anything with medical claims. What we sell is exactly what it says.', '我们只卖非入口用品——不卖食品、零食、保健品,也没有任何医疗宣称。卖的是什么,写的就是什么。'],
  promise_2_t: ['⭐ Real reviews only', '⭐ 只有真实评价'],
  promise_2_p: ['Every review is written by a verified customer. We never buy, seed or fabricate reviews — even when the section looks empty.', '每条评价都来自已验证的真实买家。我们绝不买评、刷评、编评——哪怕评价区看起来空空的。'],
  promise_3_t: ['📦 Honest shipping', '📦 诚实的物流时效'],
  promise_3_p: ['Delivery estimates are estimates, clearly labeled. If your order runs late, we tell you first and you can cancel for a full refund.', '预计时效就是预计,清清楚楚标注。如果订单延误,我们会主动告知,你可以随时取消并全额退款。'],
  promise_4_t: ['↩️ Easy returns', '↩️ 退货不费劲'],
  promise_4_p: ['30 days, unused, original packaging. Damaged or wrong item? Send a photo within 48 hours and we reship or refund — your choice.', '30 天内、未使用、原包装即可退。破损或错发?48 小时内发张照片,补发或退款由你选。'],
  home_footnote: ['*Delivery times are estimates from dispatch, not guarantees. See our <a href="/pages/shipping-policy">Shipping Policy</a> for full details, covered regions and how we handle delays.', '*配送时效为发货后的预估,不作保证。完整规则、配送范围和延误处理方式见<a href="/pages/shipping-policy">配送政策</a>。'],

  // ---- shop ----
  shop_title: ['Shop', '商店'],
  filter_all: ['All', '全部'],
  shop_empty: ['No products in this category yet.', '这个分类暂时还没有商品。'],
  card_new: ['New', '新品'],
  card_add: ['Add to cart', '加入购物车'],

  // ---- product page ----
  pdp_new: ['New — no reviews yet', '新品 — 暂无评价'],
  pdp_reviews_line: ['★ {avg} · {n} reviews', '★ {avg} · {n} 条评价'],
  who_for: ["Who it's for:", '适合谁:'],
  add_to_cart: ['Add to cart', '加入购物车'],
  out_of_stock: ['Out of stock', '暂时缺货'],
  save_badge: ['Save {amt}', '立省 {amt}'],
  ship_line1: ['🚚 Ships in {handling} business days · delivery est. {transit} business days (estimate, not guaranteed)', '🚚 {handling} 个工作日内发货 · 预计 {transit} 个工作日送达(预估时效,不作保证)'],
  ship_line2: ['↩️ 30-day returns on unused items · damaged items reshipped or refunded', '↩️ 未使用商品 30 天可退 · 运输破损补发或退款'],
  ship_line3: ['🇺🇸 Ships to: {countries}', '🇺🇸 配送范围:{countries}'],
  acc_specs: ['Specifications', '规格参数'],
  acc_shipping: ['Shipping & returns', '配送与退换'],
  acc_faq: ['Product FAQ', '产品问答'],
  size_chart: ['Size chart', '尺码表'],
  size_size: ['Size', '尺码'],
  size_chest: ['Chest girth', '胸围'],
  size_weight: ['Weight', '适合体重'],
  acc_ship_p1: ['Processing time: {handling} business days. Transit: {transit} business days (estimate). Free US shipping over {free}, otherwise {rate} flat.', '处理时效:{handling} 个工作日;运输时效:预计 {transit} 个工作日。全美满 {free} 免邮,未满收固定运费 {rate}。'],
  acc_ship_p2: ['Returns accepted within 30 days of delivery for unused items in original packaging. Wrong/damaged item? Contact us with a photo within 48h — we reship or refund. Full details in our <a href="/pages/return-refund-policy">Return & Refund Policy</a>.', '签收后 30 天内,未使用且保留原包装即可退货。错发/破损?48 小时内附照片联系我们,补发或退款。完整规则见<a href="/pages/return-refund-policy">退换与退款政策</a>。'],
  reviews_title: ['Customer reviews', '用户评价'],
  reviews_empty: ['No reviews yet — we only publish reviews from verified customers, so this section starts empty and stays honest. Be the first after your order arrives!', '暂无评价——我们只发布已验证买家的真实评价,所以这里从零开始、保持诚实。收到货后欢迎来写第一条!'],
  verified: ['✓ Verified purchase', '✓ 已验证购买'],

  // ---- cart ----
  cart_title: ['Your cart', '购物车'],

  // ---- checkout ----
  checkout_title: ['Checkout', '结算'],
  co_contact: ['Contact', '联系方式'],
  co_email: ['Email', '邮箱'],
  co_ship_addr: ['Shipping address', '收货地址(美国)'],
  co_addr_hint: ['', '提示:美国地址请用英文填写(街道、城市)。'],
  co_first: ['First name', '名 First name'],
  co_last: ['Last name', '姓 Last name'],
  co_addr1: ['Address', '街道地址'],
  co_addr1_ph: ['Street and number', '门牌号 + 街道,如 1600 Pine St'],
  co_addr2: ['Apartment, suite (optional)', '公寓/房间号(选填)'],
  co_city: ['City', '城市'],
  co_state: ['State', '州'],
  co_zip: ['ZIP', '邮编 ZIP'],
  co_country: ['Country', '国家'],
  co_billing_same: ['Billing address same as shipping', '账单地址与收货地址相同'],
  co_billing: ['Billing address', '账单地址'],
  co_payment: ['Payment', '支付方式'],
  pay_test_label: ['🧪 Test payment (no real charge — store is in test mode)', '🧪 测试支付(不产生真实扣款——店铺处于测试模式)'],
  pay_stripe_label: ['💳 Credit / debit card (via Stripe secure checkout)', '💳 信用卡/借记卡(Stripe 安全支付)'],
  pay_alipay_label: ['💙 Alipay (via Stripe secure checkout)', '💙 支付宝国际收款(Stripe 安全支付)'],
  pay_paypal_label: ['🅿️ PayPal', '🅿️ PayPal'],
  co_sim_fail: ['Simulate a failed payment (for store testing)', '模拟支付失败(店铺测试用)'],
  co_place: ['Place order', '提交订单'],
  co_agree: ['By placing your order you agree to our <a href="/pages/terms-of-service">Terms</a>, <a href="/pages/shipping-policy">Shipping Policy</a> and <a href="/pages/return-refund-policy">Return Policy</a>. {duties}', '提交订单即表示同意<a href="/pages/terms-of-service">服务条款</a>、<a href="/pages/shipping-policy">配送政策</a>和<a href="/pages/return-refund-policy">退款政策</a>。{duties}'],
  co_summary: ['Order summary', '订单摘要'],
  co_discount_ph: ['Discount code', '优惠码'],
  co_apply: ['Apply', '使用'],

  // ---- confirm ----
  cf_thanks: ['Thank you, {name}!', '谢谢你,{name}!'],
  cf_confirmed: ['Your order <b>{number}</b> is confirmed.', '你的订单 <b>{number}</b> 已确认。'],
  cf_test_badge: ['TEST MODE — no real charge', '测试模式 — 未真实扣款'],
  cf_email_note: ['A confirmation email was sent to <b>{email}</b>. We\'ll email tracking as soon as it ships.', '确认邮件已发送至 <b>{email}</b>,发货后我们会第一时间把物流单号发给你。'],
  sum_shipping: ['Shipping', '运费'],
  sum_discount: ['Discount', '折扣'],
  sum_subtotal: ['Subtotal', '商品小计'],
  sum_total: ['Total', '合计'],
  sum_free: ['FREE', '免邮'],
  cf_continue: ['Continue shopping', '继续购物'],
  cf_track: ['Track order', '查询订单'],

  // ---- track order ----
  tr_title: ['Track your order', '订单查询'],
  tr_lead: ['Enter the order number from your confirmation email (looks like MW-XXXXXX) and the email you ordered with.', '输入确认邮件里的订单号(形如 MW-XXXXXX)和下单时用的邮箱。'],
  tr_num_ph: ['MW-XXXXXX', 'MW-XXXXXX'],
  tr_email_ph: ['you@email.com', '下单邮箱'],
  tr_btn: ['Track', '查询'],
  tr_not_found: ['No order found for that number and email. Double-check both — the number looks like MW-XXXXXX.', '没有找到匹配的订单,请核对订单号(形如 MW-XXXXXX)和邮箱后重试。'],
  st_pending_payment: ['Awaiting payment', '待支付'],
  st_paid: ['Being prepared', '备货中'],
  st_fulfilled: ['On its way', '运输中'],
  st_delivered: ['Delivered', '已送达'],
  st_refunded: ['Refunded', '已退款'],
  st_canceled: ['Canceled', '已取消'],
  tr_order_line: ['Order {number} — {status}', '订单 {number} — {status}'],
  tr_step_confirmed: ['Order confirmed', '订单确认'],
  tr_step_shipped: ['Shipped', '已发货'],
  tr_step_delivered: ['Delivered', '已送达'],
  tr_pending: ['Pending', '待进行'],
  tr_refunded_note: ['This order was refunded. Funds typically appear within 5–10 business days.', '该订单已退款,款项通常 5–10 个工作日内原路退回。'],
  tr_carrier: ['Carrier', '承运商'],
  tr_tracking_no: ['Tracking #', '运单号'],
  tr_tracking_start: ['Tracking usually starts updating 2–5 days after dispatch.', '运单信息通常在发货后 2–5 天开始更新。'],
  tr_awaiting_ship: ['Tracking number will appear here once your order ships (within {handling} business days).', '订单发货后(通常 {handling} 个工作日内),这里会显示运单号。'],
  tr_footnote: ['Delivery estimate: {transit} business days after dispatch — an estimate, not a guarantee. If your order is running late, we\'ll notify you and you may cancel undelivered items for a full refund. Questions? <a href="/contact">Contact us</a>.', '配送时效:发货后预计 {transit} 个工作日——预估值,不作保证。如订单延误我们会主动通知,未送达商品可随时取消并全额退款。有疑问?<a href="/contact">联系我们</a>。'],

  // ---- contact ----
  ct_title: ['Contact us', '联系我们'],
  ct_lead: ['Real humans, replies within 1 business day. For order issues, include your order number (MW-XXXXXX).', '真人客服,1 个工作日内回复。订单问题请附上订单号(MW-XXXXXX)。'],
  ct_sent: ['✅ Message received! Check your inbox for a confirmation. We usually reply within 1 business day.', '✅ 消息已收到!确认邮件已发送到你的邮箱,我们通常在 1 个工作日内回复。'],
  ct_name: ['Your name', '你的称呼'],
  ct_email: ['Email', '邮箱'],
  ct_order: ['Order number (optional)', '订单号(选填)'],
  ct_topic: ['Topic', '主题'],
  ct_topic_1: ['Order & shipping', '订单与物流'],
  ct_topic_2: ['Returns & refunds', '退换与退款'],
  ct_topic_3: ['Product question', '产品咨询'],
  ct_topic_4: ['Wholesale / partnership', '批发/合作'],
  ct_topic_5: ['Other', '其他'],
  ct_message: ['Message', '留言内容'],
  ct_send: ['Send message', '发送'],
  ct_direct: ['Or email us directly:', '或直接发邮件至:'],

  // ---- faq ----
  faq_title: ['Frequently asked questions', '常见问题'],
  faq_footnote: ['Didn\'t find your answer? <a href="/contact">Contact us</a> — we reply within 1 business day.', '没找到答案?<a href="/contact">联系我们</a>——1 个工作日内回复。'],

  // ---- review form ----
  rv_title: ['Review your order', '评价订单'],
  rv_done: ['✅ Thank you! Your review was submitted and will appear once approved. We publish honest reviews only — good or bad.', '✅ 感谢!评价已提交,审核后会展示在产品页。无论好评差评,我们只发布真实评价。'],
  rv_product: ['Product', '商品'],
  rv_rating: ['Rating', '评分'],
  rv_r5: ['★★★★★ — Love it', '★★★★★ — 非常满意'],
  rv_r4: ['★★★★☆ — Good', '★★★★☆ — 满意'],
  rv_r3: ['★★★☆☆ — Okay', '★★★☆☆ — 一般'],
  rv_r2: ['★★☆☆☆ — Not great', '★★☆☆☆ — 不太行'],
  rv_r1: ['★☆☆☆☆ — Disappointed', '★☆☆☆☆ — 失望'],
  rv_name: ['Your name (shown publicly)', '昵称(公开显示)'],
  rv_text: ['Your review', '评价内容'],
  rv_text_ph: ['How is it working out for you and your pet? Honest words help other pet parents.', '用得怎么样?你的真实感受能帮到其他铲屎官。'],
  rv_submit: ['Submit review', '提交评价'],
  rv_note: ['Reviews are voluntary and unrewarded. We publish real customer reviews only, positive or negative.', '评价完全自愿、无任何报酬。无论正面负面,我们只发布真实买家评价。'],
  rv_fill: ['Please fill in all fields.', '请把内容填写完整。'],
  rv_already: ['You already reviewed this product for this order — thank you!', '这个订单里的该商品你已经评价过了——谢谢!'],

  // ---- 404 ----
  nf_title: ['Page not found', '页面不见了'],
  nf_text: ['The page you\'re looking for wandered off like a cat at 3am.', '你找的页面像凌晨三点的猫一样,溜出去玩了。'],
  nf_back: ['Back to home', '回到首页'],

  // ---- api errors (returned to storefront toasts) ----
  err_email: ['Please enter a valid email address.', '请输入有效的邮箱地址。'],
  err_email_short: ['Please enter a valid email.', '请输入有效的邮箱。'],
  err_addr: ['Please complete your shipping address.', '请把收货地址填写完整。'],
  err_prod_gone: ['A product in your cart is no longer available. Please refresh your cart.', '购物车中有商品已不再出售，请刷新购物车。'],
  err_stock: ['Only {n} left of "{name}" — please adjust the quantity.', '"{name}" 仅剩 {n} 件，请调整数量。'],
  err_cart_empty: ['Your cart is empty.', '购物车是空的。'],
  err_test_fail: ['Test payment failed (simulated). In live mode the customer would see their bank\'s decline message here.', '测试支付失败（模拟）。真实收款模式下，买家在这里会看到银行的拒绝提示。'],
  err_pay_start: ['Payment could not be started: {msg}', '支付无法发起：{msg}'],
  dc_invalid: ['This code is not valid.', '优惠码无效。'],
  dc_min: ['This code needs a subtotal of at least {min}.', '该优惠码需满 {min} 才能使用。'],
  dc_first_only: ['This code is for first orders only.', '该优惠码仅限首单使用。']
};

function t(key, vars) {
  const entry = dict[key];
  let s = entry ? entry[ctx.lang === 'zh' ? 1 : 0] : key;
  if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}

module.exports = { setContext, lang, pick, t, switchUrl };
