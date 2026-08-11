/* ==========================================================================
   Neft Teacher — "Percent Bar" manipulative (self-contained)
   Two modes, chosen by data-mode on the container:

   1) PERCENT mode (markup / discount / tax) — single base price bar:
        <div class="pki-manip" data-manip="percent-bar" data-mode="tax"
             data-base="40" data-percent="6"></div>
      A slider (0–50%) and a stepped base-price number input drive a horizontal
      bar. In Markup/Tax the percent amount STACKS on top of the base; in
      Discount it is SUBTRACTED. Live math reads "base $X, +Y% = $Z" (or −).

   2) UNIT-PRICE mode — two bars comparing $ per unit of Package A vs B:
        <div class="pki-manip" data-manip="percent-bar" data-mode="unit-price"
             data-a-price="3.60" data-a-size="12"
             data-b-price="5.25" data-b-size="20"></div>
      Each package has stepped price + size inputs; bars show unit price
      (price ÷ size) to scale, and the lower (better buy) is highlighted green.

   No dependencies. Injects its own scoped styles once. Re-scans at 900ms so it
   still mounts inside panels revealed after first paint.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STYLE_ID = "pki-pbar-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".pki-pbar{border:2px solid var(--tp-line,#e4ebf2);border-radius:18px;background:#fff;padding:18px;box-shadow:var(--tp-shadow-sm,0 2px 6px rgba(12,27,42,.08));margin:14px 0}" +
      ".pki-pbar h4{margin:0 0 4px;font-size:1.15rem}" +
      ".pki-pbar .pki-pb-sub{margin:0 0 14px;color:var(--tp-muted,#54677c);font-size:.95rem}" +
      ".pki-pb-modes{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}" +
      ".pki-pb-mode{padding:.4em .9em;border-radius:999px;border:2px solid var(--tp-line,#e4ebf2);background:#fff;color:var(--tp-ink,#172033);font-weight:800;font-size:.85rem;cursor:pointer;line-height:1}" +
      '.pki-pb-mode[aria-pressed="true"]{background:var(--tp-accent,#1763c7);border-color:var(--tp-accent,#1763c7);color:#fff}' +
      ".pki-pb-mode:active{transform:scale(.96)}" +
      ".pki-pb-row{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;margin-bottom:14px}" +
      ".pki-pb-field{flex:1 1 130px}.pki-pb-field label{display:block;font-size:.8rem;font-weight:800;letter-spacing:.03em;color:var(--tp-muted,#54677c);margin-bottom:5px}" +
      ".pki-pb-stepwrap{display:flex;align-items:center;gap:8px}" +
      ".pki-pb-stepwrap input{width:84px;text-align:center;font-size:1.1rem;font-weight:800;padding:.45em;border:2px solid var(--tp-line,#e4ebf2);border-radius:12px}" +
      ".pki-pb-btn{width:42px;height:42px;border-radius:12px;border:2px solid var(--tp-line,#e4ebf2);background:#fff;color:var(--tp-accent,#1763c7);font-size:1.5rem;font-weight:800;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center;flex:0 0 auto}" +
      ".pki-pb-btn:active{transform:scale(.9)}" +
      ".pki-pb-slider{margin:4px 0 14px}" +
      ".pki-pb-slider label{display:flex;justify-content:space-between;font-size:.8rem;font-weight:800;letter-spacing:.03em;color:var(--tp-muted,#54677c);margin-bottom:6px}" +
      ".pki-pb-slider label b{color:var(--tp-accent,#1763c7);font-size:1rem}" +
      ".pki-pb-slider input[type=range]{width:100%;height:30px;accent-color:var(--tp-accent,#1763c7);cursor:pointer}" +
      ".pki-pb-bars{display:grid;gap:12px;margin:6px 0 14px}" +
      ".pki-pb-track{position:relative;height:46px;border-radius:12px;background:#f1f5f9;border:1px solid var(--tp-line,#e4ebf2);overflow:hidden;display:flex}" +
      ".pki-pb-seg{height:100%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.85rem;color:#fff;white-space:nowrap;transition:width .18s ease;overflow:hidden}" +
      ".pki-pb-seg.base{background:var(--tp-accent,#1763c7)}" +
      ".pki-pb-seg.add{background:var(--tp-accent2,#0e9a8c)}" +
      ".pki-pb-seg.cut{background:repeating-linear-gradient(45deg,#f0b8a6,#f0b8a6 7px,#f6cdbf 7px,#f6cdbf 14px);color:#7a3315}" +
      ".pki-pb-cap{display:flex;justify-content:space-between;font-size:.82rem;font-weight:700;color:var(--tp-ink,#172033);margin-bottom:5px}" +
      ".pki-pb-cap .tag{font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--tp-muted,#54677c)}" +
      ".pki-pb-unit{color:var(--tp-muted,#54677c);font-weight:800}" +
      ".pki-pb-bar.win .pki-pb-track{outline:3px solid #19a35a;outline-offset:1px}" +
      ".pki-pb-bar.win .pki-pb-seg.base{background:#19a35a}" +
      ".pki-pb-bar.win .pki-pb-cap .tag{color:#0f7a40}" +
      ".pki-pb-status{border-radius:12px;padding:12px 14px;font-weight:700;font-size:1rem}" +
      ".pki-pb-status.add{background:linear-gradient(135deg,var(--tp-accent,#1763c7),var(--tp-accent2,#0e9a8c));color:#fff;border:none;box-shadow:0 8px 20px -8px rgba(12,27,42,.4)}" +
      ".pki-pb-status.cut{background:#fff4ef;color:#b4470f;border:1px solid #f6c9b4}" +
      ".pki-pb-status.win{background:#eafaf0;color:#0f7a40;border:1px solid #b6e6c8}";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function money(n) {
    return "$" + (Math.round(n * 100) / 100).toFixed(2);
  }
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }
  function pctWidth(part, whole) {
    if (whole <= 0) return 0;
    return clamp((part / whole) * 100, 0, 100);
  }

  /* ----- PERCENT mode (markup / discount / tax) ----------------------- */
  var PMODES = {
    markup: { sign: 1, verb: "markup", note: "stacks on top of your cost" },
    discount: { sign: -1, verb: "discount", note: "comes off your price" },
    tax: { sign: 1, verb: "tax", note: "is added on top" },
  };

  function initPercent(el, startMode) {
    var base = parseFloat(el.dataset.base);
    if (isNaN(base)) base = 40;
    var pct = parseFloat(el.dataset.percent);
    if (isNaN(pct)) pct = 10;
    // The slider used to be hard-wired to 0-50% in 1% steps, so a lesson about
    // percents GREATER than 100% (or less than 1%) was handed a tool that could
    // not show one: an authored data-percent of 150 was silently clamped to 50.
    // The ceiling and the step are now data-driven, and an authored percent
    // above the ceiling raises it rather than being thrown away.
    var pctMax = parseFloat(el.dataset.percentMax);
    if (isNaN(pctMax) || pctMax <= 0) pctMax = 50;
    if (pct > pctMax) pctMax = pct;
    var pctStep = parseFloat(el.dataset.percentStep);
    if (isNaN(pctStep) || pctStep <= 0) pctStep = 1;
    // Taking more than 100% off would price the item below zero, so Discount
    // keeps the old ceiling no matter how high the others go.
    function maxFor(m) {
      return m === "discount" ? Math.min(pctMax, 100) : pctMax;
    }
    var mode = PMODES[startMode] ? startMode : "tax";

    el.innerHTML =
      "<h4>📊 Percent Bar</h4>" +
      '<p class="pki-pb-sub">Set a base price, then drag the slider to add a markup or tax (stacked on top) or take a discount off. Watch the bar and the math change together.</p>' +
      '<div class="pki-pb-modes" data-modes>' +
      modeBtn("markup", "+ Markup", mode) +
      modeBtn("discount", "− Discount", mode) +
      modeBtn("tax", "+ Tax", mode) +
      "</div>" +
      '<div class="pki-pb-row">' +
      '<div class="pki-pb-field"><label>Base price ($)</label>' +
      '<div class="pki-pb-stepwrap">' +
      '<button type="button" class="pki-pb-btn" data-dec aria-label="decrease price">−</button>' +
      '<input type="text" inputmode="decimal" data-base value="' +
      base +
      '">' +
      '<button type="button" class="pki-pb-btn" data-inc aria-label="increase price">+</button>' +
      "</div></div></div>" +
      '<div class="pki-pb-slider"><label>Percent <b data-pctlabel></b></label>' +
      '<input type="range" min="0" max="' +
      maxFor(mode) +
      '" step="' +
      pctStep +
      '" value="' +
      pct +
      '" data-pct aria-label="percent"></div>' +
      '<div class="pki-pb-bars"><div class="pki-pb-bar"><div class="pki-pb-cap">' +
      '<span data-caplead></span><span class="tag" data-captag></span></div>' +
      '<div class="pki-pb-track" data-track></div></div></div>' +
      '<div class="pki-pb-status" data-status></div>';

    function modeBtn(key, label, cur) {
      return (
        '<button type="button" class="pki-pb-mode" data-mode="' +
        key +
        '" aria-pressed="' +
        (key === cur ? "true" : "false") +
        '">' +
        label +
        "</button>"
      );
    }

    var trackBox = el.querySelector("[data-track]");
    var statusBox = el.querySelector("[data-status]");
    var baseInput = el.querySelector("[data-base]");
    var pctInput = el.querySelector("[data-pct]");
    var pctLabel = el.querySelector("[data-pctlabel]");
    var capLead = el.querySelector("[data-caplead]");
    var capTag = el.querySelector("[data-captag]");

    function render() {
      base = clamp(isNaN(base) ? 0 : base, 0, 100000);
      pct = clamp(isNaN(pct) ? 0 : pct, 0, maxFor(mode));
      pctInput.max = maxFor(mode);
      pctInput.step = pctStep;
      pctInput.value = pct;
      pctLabel.textContent = pct + "%";

      var m = PMODES[mode];
      var amount = base * (pct / 100);
      var total = base + m.sign * amount;
      var maxScale = mode === "discount" ? base : base + amount;
      var html = "";
      if (mode === "discount") {
        // remaining (paid) segment + struck-through cut segment
        var paid = base - amount;
        html =
          '<div class="pki-pb-seg base" style="width:' +
          pctWidth(paid, base) +
          '%">' +
          (paid > 0 ? money(paid) : "") +
          "</div>" +
          '<div class="pki-pb-seg cut" style="width:' +
          pctWidth(amount, base) +
          '%">' +
          (amount > 0 ? "−" + money(amount) : "") +
          "</div>";
      } else {
        html =
          '<div class="pki-pb-seg base" style="width:' +
          pctWidth(base, maxScale) +
          '%">' +
          money(base) +
          "</div>" +
          '<div class="pki-pb-seg add" style="width:' +
          pctWidth(amount, maxScale) +
          '%">' +
          (amount > 0 ? "+" + money(amount) : "") +
          "</div>";
      }
      trackBox.innerHTML = html;
      capLead.textContent = "Base " + money(base);
      capTag.textContent = m.verb + " " + pct + "%";

      var sign = m.sign > 0 ? "+" : "−";
      if (mode === "discount") {
        statusBox.className = "pki-pb-status cut";
        statusBox.innerHTML =
          "Base " +
          money(base) +
          ", −" +
          pct +
          "% (" +
          money(amount) +
          " off) = <b>" +
          money(total) +
          "</b> sale price.";
      } else {
        statusBox.className = "pki-pb-status add";
        statusBox.innerHTML =
          "Base " +
          money(base) +
          ", " +
          sign +
          pct +
          "% (" +
          money(amount) +
          " " +
          m.verb +
          ") = <b>" +
          money(total) +
          "</b> total.";
      }
    }

    el.querySelector("[data-modes]").addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest("[data-mode]");
      if (!btn) return;
      mode = btn.getAttribute("data-mode");
      Array.prototype.forEach.call(el.querySelectorAll("[data-mode]"), function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      render();
    });
    el.addEventListener("click", function (e) {
      var t = e.target;
      if (!t.hasAttribute) return;
      if (t.hasAttribute("data-inc")) {
        base = Math.round(base) + 1;
        render();
      } else if (t.hasAttribute("data-dec")) {
        base = Math.max(0, Math.round(base) - 1);
        render();
      }
    });
    baseInput.addEventListener("input", function () {
      var v = parseFloat(baseInput.value);
      if (isNaN(v)) return;
      base = v;
      render();
    });
    pctInput.addEventListener("input", function () {
      var v = parseInt(pctInput.value, 10);
      if (isNaN(v)) return;
      pct = v;
      render();
    });

    render();
  }

  /* ----- UNIT-PRICE mode (better buy) --------------------------------- */
  function initUnitPrice(el) {
    var pkg = {
      a: {
        price: num(el.dataset.aPrice, 3.6),
        size: num(el.dataset.aSize, 12),
      },
      b: {
        price: num(el.dataset.bPrice, 5.25),
        size: num(el.dataset.bSize, 20),
      },
    };
    function num(v, d) {
      var n = parseFloat(v);
      return isNaN(n) ? d : n;
    }

    el.innerHTML =
      "<h4>⚖️ Unit-Price Bars — Better Buy</h4>" +
      '<p class="pki-pb-sub">Enter each package’s price and size. The bars show the <b>unit price</b> (price ÷ size). The shorter bar — the lower price per unit — is the better buy and turns green.</p>' +
      pkgRow("a", "Package A", pkg.a) +
      pkgRow("b", "Package B", pkg.b) +
      '<div class="pki-pb-bars">' +
      bar("a", "Package A") +
      bar("b", "Package B") +
      "</div>" +
      '<div class="pki-pb-status" data-status></div>';

    function pkgRow(key, label, p) {
      return (
        '<div class="pki-pb-row">' +
        '<div class="pki-pb-field"><label>' +
        label +
        " price ($)</label>" +
        '<div class="pki-pb-stepwrap">' +
        '<button type="button" class="pki-pb-btn" data-dec="' +
        key +
        '-price" aria-label="decrease ' +
        label +
        ' price">−</button>' +
        '<input type="text" inputmode="decimal" data-val="' +
        key +
        '-price" value="' +
        p.price +
        '">' +
        '<button type="button" class="pki-pb-btn" data-inc="' +
        key +
        '-price" aria-label="increase ' +
        label +
        ' price">+</button>' +
        "</div></div>" +
        '<div class="pki-pb-field"><label>' +
        label +
        " size (units)</label>" +
        '<div class="pki-pb-stepwrap">' +
        '<button type="button" class="pki-pb-btn" data-dec="' +
        key +
        '-size" aria-label="decrease ' +
        label +
        ' size">−</button>' +
        '<input type="text" inputmode="decimal" data-val="' +
        key +
        '-size" value="' +
        p.size +
        '">' +
        '<button type="button" class="pki-pb-btn" data-inc="' +
        key +
        '-size" aria-label="increase ' +
        label +
        ' size">+</button>' +
        "</div></div></div>"
      );
    }
    function bar(key, label) {
      return (
        '<div class="pki-pb-bar" data-bar="' +
        key +
        '"><div class="pki-pb-cap">' +
        "<span>" +
        label +
        '</span><span class="tag" data-tag="' +
        key +
        '"></span></div>' +
        '<div class="pki-pb-track"><div class="pki-pb-seg base" data-seg="' +
        key +
        '"></div></div></div>'
      );
    }

    var statusBox = el.querySelector("[data-status]");

    function unit(p) {
      return p.size > 0 ? p.price / p.size : Infinity;
    }
    function render() {
      pkg.a.price = clamp(pkg.a.price, 0, 100000);
      pkg.b.price = clamp(pkg.b.price, 0, 100000);
      pkg.a.size = clamp(pkg.a.size, 0, 100000);
      pkg.b.size = clamp(pkg.b.size, 0, 100000);
      el.querySelector('[data-val="a-price"]').value = pkg.a.price;
      el.querySelector('[data-val="b-price"]').value = pkg.b.price;
      el.querySelector('[data-val="a-size"]').value = pkg.a.size;
      el.querySelector('[data-val="b-size"]').value = pkg.b.size;

      var ua = unit(pkg.a),
        ub = unit(pkg.b);
      var maxU = Math.max(isFinite(ua) ? ua : 0, isFinite(ub) ? ub : 0, 0.0001);
      var winner = ua === ub ? null : ua < ub ? "a" : ub < ua ? "b" : null;
      if (!isFinite(ua) || !isFinite(ub)) winner = null;

      ["a", "b"].forEach(function (key) {
        var u = key === "a" ? ua : ub;
        var seg = el.querySelector('[data-seg="' + key + '"]');
        var tag = el.querySelector('[data-tag="' + key + '"]');
        var barEl = el.querySelector('[data-bar="' + key + '"]');
        seg.style.width = (isFinite(u) ? pctWidth(u, maxU) : 0) + "%";
        seg.innerHTML = isFinite(u)
          ? money(u) + '<span class="pki-pb-unit">&nbsp;/unit</span>'
          : "";
        tag.textContent = isFinite(u) ? money(u) + " per unit" : "size needed";
        barEl.className = "pki-pb-bar" + (winner === key ? " win" : "");
      });

      if (winner === null && isFinite(ua) && isFinite(ub)) {
        statusBox.className = "pki-pb-status win";
        statusBox.innerHTML = "Both packages cost <b>" + money(ua) + " per unit</b> — it’s a tie!";
      } else if (winner) {
        var wu = winner === "a" ? ua : ub;
        var lu = winner === "a" ? ub : ua;
        statusBox.className = "pki-pb-status win";
        statusBox.innerHTML =
          "✅ <b>Package " +
          winner.toUpperCase() +
          "</b> is the better buy at <b>" +
          money(wu) +
          " per unit</b> vs " +
          money(lu) +
          ".";
      } else {
        statusBox.className = "pki-pb-status cut";
        statusBox.innerHTML =
          "Enter a price and a size (units) for both packages to compare unit prices.";
      }
    }

    el.addEventListener("click", function (e) {
      var t = e.target;
      if (!t.getAttribute) return;
      var inc = t.getAttribute("data-inc");
      var dec = t.getAttribute("data-dec");
      var ref = inc || dec;
      if (!ref) return;
      var parts = ref.split("-");
      var p = pkg[parts[0]];
      var fld = parts[1];
      var d = inc ? 1 : -1;
      p[fld] = Math.max(0, Math.round((p[fld] + d) * 100) / 100);
      render();
    });
    el.addEventListener("input", function (e) {
      var ref = e.target.getAttribute && e.target.getAttribute("data-val");
      if (!ref) return;
      var v = parseFloat(e.target.value);
      if (isNaN(v)) return;
      var parts = ref.split("-");
      pkg[parts[0]][parts[1]] = v;
      render();
    });

    render();
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    el.classList.add("pki-pbar");
    injectStyle();
    var mode = (el.dataset.mode || "tax").toLowerCase();
    if (mode === "unit-price") initUnitPrice(el);
    else initPercent(el, mode);
  }

  function scan() {
    document.querySelectorAll('.pki-manip[data-manip="percent-bar"]').forEach(init);
  }
  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }
  ready(function () {
    scan();
    setTimeout(scan, 900);
  });
  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["percent-bar"] = init;
  }
})();
