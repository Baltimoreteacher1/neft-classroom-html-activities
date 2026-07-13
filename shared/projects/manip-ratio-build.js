/* ==========================================================================
   Neft Teacher — "Ratio Builder" manipulative (self-contained)
   Drop a container on the page and this renders a tap-to-build widget:
     <div class="pki-manip" data-manip="ratio-build"
          data-label-a="cups of fruit" data-label-b="cups of yogurt"
          data-rate-name="cups"
          data-tile-a="🟢" data-tile-b="🟡"
          data-default-a="6" data-default-b="4"></div>
   Students set a base ratio a:b with − / + steppers, then a ×1..×6 "scale"
   stepper builds the EQUIVALENT ratio (a·n : b·n) out of colored tiles. The
   widget shows the equation (6 : 4 = 12 : 8), the simplified ratio, and the
   UNIT RATE (a ÷ b per 1).
   No dependencies. Injects its own scoped styles once.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STYLE_ID = "pki-ratio-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".pki-ratio{border:2px solid var(--tp-line,#e4ebf2);border-radius:18px;background:#fff;padding:18px;box-shadow:var(--tp-shadow-sm,0 2px 6px rgba(12,27,42,.08));margin:14px 0}" +
      ".pki-ratio h4{margin:0 0 4px;font-size:1.15rem;color:var(--tp-ink,#172033)}" +
      ".pki-ratio .pki-r-sub{margin:0 0 14px;color:var(--tp-muted,#54677c);font-size:.95rem}" +
      ".pki-r-row{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;margin-bottom:14px}" +
      ".pki-r-field{flex:1 1 130px}.pki-r-field label{display:block;font-size:.8rem;font-weight:800;letter-spacing:.03em;color:var(--tp-muted,#54677c);margin-bottom:5px}" +
      ".pki-r-stepwrap{display:flex;align-items:center;gap:8px}" +
      ".pki-r-stepwrap input{width:64px;text-align:center;font-size:1.15rem;font-weight:800;padding:.45em;border:2px solid var(--tp-line,#e4ebf2);border-radius:12px;color:var(--tp-ink,#172033)}" +
      ".pki-r-btn{width:42px;height:42px;border-radius:12px;border:2px solid var(--tp-line,#e4ebf2);background:#fff;color:var(--tp-accent,#1763c7);font-size:1.5rem;font-weight:800;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center}" +
      ".pki-r-btn:active{transform:scale(.9)}" +
      ".pki-r-build{border:1px solid var(--tp-line,#e4ebf2);border-radius:14px;background:#f8fafc;padding:12px;margin:4px 0 14px}" +
      ".pki-r-line{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-bottom:8px}" +
      ".pki-r-line:last-child{margin-bottom:0}" +
      ".pki-r-cap{flex:0 0 auto;min-width:118px;font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.03em;color:var(--tp-muted,#54677c)}" +
      ".pki-r-tiles{display:flex;flex-wrap:wrap;gap:4px;align-items:center;font-size:1.3rem;line-height:1.2}" +
      ".pki-r-num{font-weight:800;color:var(--tp-ink,#172033);font-size:1rem;margin-left:4px}" +
      ".pki-r-eq{font-size:1.15rem;font-weight:800;color:var(--tp-ink,#172033);background:#eef4ff;border:1px solid #cfe0f7;border-radius:12px;padding:10px 14px;text-align:center;margin-bottom:10px;letter-spacing:.01em}" +
      ".pki-r-eq b{color:var(--tp-accent,#1763c7)}" +
      ".pki-r-facts{display:flex;flex-wrap:wrap;gap:10px}" +
      ".pki-r-fact{flex:1 1 150px;border-radius:12px;padding:11px 13px;background:#f4f8ff;border:1px solid var(--tp-line,#e4ebf2)}" +
      ".pki-r-fact .pki-r-flab{font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--tp-muted,#54677c);margin-bottom:3px}" +
      ".pki-r-fact .pki-r-fval{font-size:1.15rem;font-weight:800;color:var(--tp-ink,#172033)}" +
      ".pki-r-fact.rate{background:linear-gradient(135deg,var(--tp-accent,#1763c7),var(--tp-accent2,#0e9a8c));border:none;color:#fff}" +
      ".pki-r-fact.rate .pki-r-flab,.pki-r-fact.rate .pki-r-fval{color:#fff}";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }
  function fmt(n) {
    // round to 2 decimals, strip trailing zeros
    var r = Math.round(n * 100) / 100;
    return String(r);
  }
  function tiles(ch, n) {
    n = Math.max(0, n | 0);
    if (n === 0) return "";
    if (n <= 36) {
      var out = "";
      for (var i = 0; i < n; i++) out += ch;
      return out;
    }
    return ch + " ×" + n;
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectStyle();

    var labelA = el.dataset.labelA || "part A";
    var labelB = el.dataset.labelB || "part B";
    var rateName = el.dataset.rateName || labelA + " per 1 " + labelB;
    var tileA = el.dataset.tileA || "🟢";
    var tileB = el.dataset.tileB || "🟡";
    var A = parseInt(el.dataset.defaultA, 10) || 6;
    var B = parseInt(el.dataset.defaultB, 10) || 4;
    var scale = 1;
    var MAXBASE = 99;
    var MAXSCALE = 6;

    el.innerHTML =
      "<h4>🧱 Ratio Builder</h4>" +
      '<p class="pki-r-sub">Set the base ratio of <b>' +
      labelA +
      "</b> to <b>" +
      labelB +
      "</b>, then turn up the <b>scale</b> to build an <b>equivalent ratio</b> out of tiles. Watch the unit rate stay the same.</p>" +
      '<div class="pki-r-row">' +
      field("a", labelA, A) +
      field("b", labelB, B) +
      field("s", "scale (×)", scale) +
      "</div>" +
      '<div class="pki-r-build">' +
      '<div class="pki-r-line"><span class="pki-r-cap">' +
      labelA +
      '</span><span class="pki-r-tiles" data-tiles-a></span><span class="pki-r-num" data-num-a></span></div>' +
      '<div class="pki-r-line"><span class="pki-r-cap">' +
      labelB +
      '</span><span class="pki-r-tiles" data-tiles-b></span><span class="pki-r-num" data-num-b></span></div>' +
      "</div>" +
      '<div class="pki-r-eq" data-eq></div>' +
      '<div class="pki-r-facts">' +
      '<div class="pki-r-fact"><div class="pki-r-flab">Simplified ratio</div><div class="pki-r-fval" data-simp></div></div>' +
      '<div class="pki-r-fact rate"><div class="pki-r-flab">Unit rate (' +
      rateName +
      ')</div><div class="pki-r-fval" data-rate></div></div>' +
      "</div>";

    function field(key, label, val) {
      return (
        '<div class="pki-r-field"><label>' +
        label +
        "</label>" +
        '<div class="pki-r-stepwrap">' +
        '<button type="button" class="pki-r-btn" data-dec="' +
        key +
        '" aria-label="decrease ' +
        label +
        '">−</button>' +
        '<input type="text" inputmode="numeric" data-val="' +
        key +
        '" value="' +
        val +
        '" aria-label="' +
        label +
        '">' +
        '<button type="button" class="pki-r-btn" data-inc="' +
        key +
        '" aria-label="increase ' +
        label +
        '">+</button>' +
        "</div></div>"
      );
    }

    var tilesA = el.querySelector("[data-tiles-a]");
    var tilesB = el.querySelector("[data-tiles-b]");
    var numA = el.querySelector("[data-num-a]");
    var numB = el.querySelector("[data-num-b]");
    var eqBox = el.querySelector("[data-eq]");
    var simpBox = el.querySelector("[data-simp]");
    var rateBox = el.querySelector("[data-rate]");

    function clampAll() {
      A = Math.max(1, Math.min(MAXBASE, A));
      B = Math.max(1, Math.min(MAXBASE, B));
      scale = Math.max(1, Math.min(MAXSCALE, scale));
    }

    function render() {
      clampAll();
      el.querySelector('[data-val="a"]').value = A;
      el.querySelector('[data-val="b"]').value = B;
      el.querySelector('[data-val="s"]').value = scale;

      var sa = A * scale;
      var sb = B * scale;
      tilesA.textContent = tiles(tileA, sa);
      tilesB.textContent = tiles(tileB, sb);
      numA.textContent = sa;
      numB.textContent = sb;

      // equation: base = scaled (only show the "=" branch when scaled up)
      if (scale === 1) {
        eqBox.innerHTML =
          "<b>" +
          A +
          "</b> : <b>" +
          B +
          "</b>　(base ratio — raise the scale to build an equal ratio)";
      } else {
        eqBox.innerHTML = A + " : " + B + " = <b>" + sa + "</b> : <b>" + sb + "</b>";
      }

      var g = gcd(A, B);
      simpBox.textContent = A / g + " : " + B / g;
      rateBox.textContent = "1 " + labelB + " → " + fmt(A / B) + " " + labelA;
    }

    el.addEventListener("click", function (e) {
      var inc = e.target.getAttribute && e.target.getAttribute("data-inc");
      var dec = e.target.getAttribute && e.target.getAttribute("data-dec");
      var key = inc || dec;
      if (!key) return;
      var d = inc ? 1 : -1;
      if (key === "a") A += d;
      else if (key === "b") B += d;
      else scale += d;
      render();
    });
    el.addEventListener("input", function (e) {
      var key = e.target.getAttribute && e.target.getAttribute("data-val");
      if (!key) return;
      var v = parseInt(e.target.value, 10);
      if (isNaN(v)) return;
      if (key === "a") A = v;
      else if (key === "b") B = v;
      else scale = v;
      render();
    });

    render();
  }

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }
  ready(function () {
    document.querySelectorAll('.pki-manip[data-manip="ratio-build"]').forEach(init);
    setTimeout(function () {
      document.querySelectorAll('.pki-manip[data-manip="ratio-build"]').forEach(init);
    }, 900);
  });
  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["ratio-build"] = init;
  }
})();
