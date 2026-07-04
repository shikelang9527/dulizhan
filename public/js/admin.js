/* Admin console client script: scoring total + pricing calculator */
(function () {
  'use strict';

  // ---- product scoring live total (threshold 24 per playbook §1) ----
  var sels = document.querySelectorAll('.score-sel');
  var totalEl = document.getElementById('scoreTotal');
  var verdictEl = document.getElementById('scoreVerdict');
  function updateScore() {
    if (!totalEl || !sels.length) return;
    var t = 0;
    sels.forEach(function (s) { t += parseInt(s.value, 10) || 0; });
    totalEl.textContent = t;
    totalEl.style.color = t >= 24 ? '#2e8b57' : '#c0392b';
    if (verdictEl) {
      verdictEl.innerHTML = t >= 24
        ? '<span class="st st-green">达标，可上架</span>'
        : '<span class="st st-red">低于 24 分 — 按文档规则不要上架（保存将强制转为草稿）</span>';
    }
  }
  if (sels.length) {
    sels.forEach(function (s) { s.addEventListener('change', updateScore); });
    updateScore();
  }

  // ---- pricing calculator (playbook Day 4 formula) ----
  var calc = document.getElementById('priceCalc');
  if (calc) {
    var out = document.getElementById('calcOut');
    var priceInput = document.querySelector('input[name=price]');
    var costInput = document.querySelector('input[name=cost]');
    var shipInput = document.querySelector('input[name=shipCost]');
    function num(el, fallback) { var v = parseFloat(el && el.value); return isNaN(v) ? (fallback || 0) : v; }
    function recalc() {
      var price = num(priceInput), cost = num(costInput), ship = num(shipInput);
      var feePct = num(document.getElementById('calcFee'), 3.4) / 100;
      var cac = num(document.getElementById('calcCac'), 8);
      var refundPct = num(document.getElementById('calcRefund'), 5) / 100;
      var profit = num(document.getElementById('calcProfit'), 6);
      // 零售价 >= (成本+物流+CAC+目标利润) / (1 - 费率 - 退款预留)
      var denom = 1 - feePct - refundPct;
      var suggested = denom > 0 ? (cost + ship + cac + profit) / denom : 0;
      var grossMargin = price > 0 ? ((price - cost - ship) / price * 100) : 0;
      var netPerOrder = price > 0 ? (price - cost - ship - price * feePct - cac - price * refundPct) : 0;
      out.innerHTML =
        '建议零售价 ≥ <b>$' + suggested.toFixed(2) + '</b><br>' +
        '当前毛利率：<b style="color:' + (grossMargin >= 50 ? '#2e8b57' : '#c0392b') + '">' + grossMargin.toFixed(0) + '%</b>（文档要求 50%+）' +
        '　当前单单净利估算：<b style="color:' + (netPerOrder > 0 ? '#2e8b57' : '#c0392b') + '">$' + netPerOrder.toFixed(2) + '</b>';
    }
    ['calcFee', 'calcCac', 'calcRefund', 'calcProfit'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', recalc);
    });
    [priceInput, costInput, shipInput].forEach(function (el) {
      if (el) el.addEventListener('input', recalc);
    });
    recalc();
  }

  // ---- premium admin interaction layer ----
  var panels = document.querySelectorAll('.panel');
  if ('IntersectionObserver' in window && panels.length) {
    var panelObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          panelObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    panels.forEach(function (panel, index) {
      panel.style.transitionDelay = Math.min(index * 45, 220) + 'ms';
      panelObserver.observe(panel);
    });
  } else {
    panels.forEach(function (panel) { panel.classList.add('is-visible'); });
  }

  document.querySelectorAll('form').forEach(function (form) {
    form.addEventListener('submit', function () {
      var btn = form.querySelector('button[type="submit"], button:not([type])');
      if (!btn || btn.dataset.keepLabel) return;
      btn.dataset.label = btn.textContent;
      btn.textContent = '处理中...';
      btn.style.pointerEvents = 'none';
    });
  });
})();
