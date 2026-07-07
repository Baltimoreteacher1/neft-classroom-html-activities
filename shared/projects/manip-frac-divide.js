/* ==========================================================================
   Neft Teacher — "Fraction Divider" manipulative (self-contained)
   Drop a container on the page and this renders a tap-to-build widget:
     <div class="pki-manip" data-manip="frac-divide"
          data-whole-label="cups of batter"
          data-piece-label="cup per serving"></div>
   Students set a WHOLE amount (as a fraction) and a SERVING/PIECE size (as a
   fraction). The whole is drawn as a bar segmented into pieces of the serving
   size; full pieces light up. Shows "whole ÷ serving = N" and any remainder.
   Models 6.NOS.1 (dividing fractions). No dependencies; injects scoped styles
   once. Keep numbers friendly — denominators are clamped to ≤ 12.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STYLE_ID = "pki-fracdiv-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".pki-fd{border:2px solid var(--tp-line,#e4ebf2);border-radius:18px;background:#fff;padding:18px;box-shadow:var(--tp-shadow-sm,0 2px 6px rgba(12,27,42,.08));margin:14px 0}" +
      ".pki-fd h4{margin:0 0 4px;font-size:1.15rem}" +
      ".pki-fd .pki-fd-sub{margin:0 0 14px;color:var(--tp-muted,#54677c);font-size:.95rem}" +
      ".pki-fd-row{display:flex;flex-wrap:wrap;gap:18px;margin-bottom:16px}" +
      ".pki-fd-group{flex:1 1 230px}" +
      ".pki-fd-group>span{display:block;font-size:.8rem;font-weight:800;letter-spacing:.03em;color:var(--tp-muted,#54677c);margin-bottom:6px;text-transform:uppercase}" +
      ".pki-fd-frac{display:flex;align-items:center;gap:10px}" +
      ".pki-fd-stack{display:flex;flex-direction:column;align-items:center;gap:6px}" +
      ".pki-fd-stack .pki-fd-bar{width:84px;height:2px;background:var(--tp-ink,#172033);border-radius:2px}" +
      ".pki-fd-stepwrap{display:flex;align-items:center;gap:6px}" +
      ".pki-fd-stepwrap input{width:54px;text-align:center;font-size:1.1rem;font-weight:800;padding:.35em;border:2px solid var(--tp-line,#e4ebf2);border-radius:10px}" +
      ".pki-fd-btn{width:36px;height:36px;border-radius:10px;border:2px solid var(--tp-line,#e4ebf2);background:#fff;color:var(--tp-accent,#1763c7);font-size:1.35rem;font-weight:800;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center}" +
      ".pki-fd-btn:active{transform:scale(.9)}" +
      ".pki-fd-times{font-size:1.2rem;font-weight:800;color:var(--tp-muted,#54677c);align-self:center;padding-top:18px}" +
      ".pki-fd-barwrap{margin:6px 0 14px}" +
      ".pki-fd-track{display:flex;width:100%;height:54px;border:2px solid var(--tp-line,#e4ebf2);border-radius:12px;overflow:hidden;background:#f8fafc}" +
      ".pki-fd-seg{flex:1 1 0;min-width:0;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:800;color:#fff;border-right:2px solid #fff;background:#cbd5e1}" +
      ".pki-fd-seg:last-child{border-right:none}" +
      ".pki-fd-seg.full{background:linear-gradient(135deg,var(--tp-accent,#1763c7),var(--tp-accent2,#0e9a8c))}" +
      ".pki-fd-seg.part{background:repeating-linear-gradient(45deg,var(--tp-accent2,#0e9a8c),var(--tp-accent2,#0e9a8c) 6px,#bfe7e2 6px,#bfe7e2 12px);color:var(--tp-ink,#172033)}" +
      ".pki-fd-scale{display:flex;justify-content:space-between;font-size:.72rem;color:var(--tp-muted,#54677c);margin-top:4px;font-weight:700}" +
      ".pki-fd-eq{border-radius:12px;padding:14px 16px;font-weight:800;font-size:1.15rem;background:linear-gradient(135deg,var(--tp-accent,#1763c7),var(--tp-accent2,#0e9a8c));color:#fff;box-shadow:0 8px 20px -8px rgba(12,27,42,.4);text-align:center}" +
      ".pki-fd-eq small{display:block;font-size:.82rem;font-weight:700;opacity:.92;margin-top:6px}" +
      ".pki-fd-note{margin:10px 0 0;font-size:.9rem;color:var(--tp-muted,#54677c)}" +
      ".pki-fd-frac-disp{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 2px}" +
      ".pki-fd-frac-disp span{display:block;padding:0 4px}" +
      ".pki-fd-frac-disp .den{border-top:2px solid currentColor}";
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
  // Render a fraction as a stacked num/den (or whole number when den === 1).
  function fracDisp(n, d) {
    if (d === 1) return String(n);
    return (
      '<span class="pki-fd-frac-disp"><span class="num">' +
      n +
      '</span><span class="den">' +
      d +
      "</span></span>"
    );
  }
  // Simplify n/d to lowest terms.
  function simplify(n, d) {
    var g = gcd(n, d);
    return { n: n / g, d: d / g };
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectStyle();

    var wholeLabel = el.dataset.wholeLabel || "the whole";
    var pieceLabel = el.dataset.pieceLabel || "per piece";
    var unit = el.dataset.unit || "";

    // State: whole = wn/wd, piece = pn/pd. Friendly defaults.
    var wn = parseInt(el.dataset.defaultWholeN, 10) || 3;
    var wd = parseInt(el.dataset.defaultWholeD, 10) || 4;
    var pn = parseInt(el.dataset.defaultPieceN, 10) || 1;
    var pd = parseInt(el.dataset.defaultPieceD, 10) || 8;
    var MAXD = 12;
    var MAXSEG = 60;

    el.classList.add("pki-fd");
    el.innerHTML =
      "<h4>🍰 Fraction Divider</h4>" +
      '<p class="pki-fd-sub">Set the <b>whole</b> amount and the <b>piece</b> size. The bar splits the whole into pieces of that size — full pieces fill in. Count the full pieces to see <b>whole ÷ piece</b>.</p>' +
      '<div class="pki-fd-row">' +
      group("w", wholeLabel, wn, wd) +
      '<div class="pki-fd-times">÷</div>' +
      group("p", pieceLabel, pn, pd) +
      "</div>" +
      '<div class="pki-fd-barwrap"><div class="pki-fd-track" data-track></div>' +
      '<div class="pki-fd-scale"><span>0</span><span data-scale-end></span></div></div>' +
      '<div class="pki-fd-eq" data-eq></div>' +
      '<p class="pki-fd-note" data-note></p>';

    function group(key, label, n, d) {
      return (
        '<div class="pki-fd-group"><span>' +
        label +
        "</span>" +
        '<div class="pki-fd-frac">' +
        '<div class="pki-fd-stack">' +
        stepper(key + "n", n) +
        '<div class="pki-fd-bar"></div>' +
        stepper(key + "d", d) +
        "</div></div></div>"
      );
    }
    function stepper(key, val) {
      return (
        '<div class="pki-fd-stepwrap">' +
        '<button type="button" class="pki-fd-btn" data-dec="' +
        key +
        '" aria-label="decrease">−</button>' +
        '<input type="text" inputmode="numeric" data-val="' +
        key +
        '" value="' +
        val +
        '">' +
        '<button type="button" class="pki-fd-btn" data-inc="' +
        key +
        '" aria-label="increase">+</button>' +
        "</div>"
      );
    }

    var trackBox = el.querySelector("[data-track]");
    var scaleEnd = el.querySelector("[data-scale-end]");
    var eqBox = el.querySelector("[data-eq]");
    var noteBox = el.querySelector("[data-note]");

    function clampAll() {
      wn = Math.max(1, Math.min(144, wn));
      wd = Math.max(1, Math.min(MAXD, wd));
      pn = Math.max(1, Math.min(144, pn));
      pd = Math.max(1, Math.min(MAXD, pd));
    }

    function render() {
      clampAll();
      el.querySelector('[data-val="wn"]').value = wn;
      el.querySelector('[data-val="wd"]').value = wd;
      el.querySelector('[data-val="pn"]').value = pn;
      el.querySelector('[data-val="pd"]').value = pd;

      // whole = wn/wd, piece = pn/pd. How many pieces fit?
      // count = (wn/wd) ÷ (pn/pd) = (wn*pd)/(wd*pn)
      var numer = wn * pd;
      var denom = wd * pn;
      var whole = Math.floor(numer / denom); // full pieces
      var remNumer = numer - whole * denom; // remainder over denom (in units of piece)
      var rem = simplify(remNumer, denom); // leftover as a fraction OF a piece
      var fitsEvenly = remNumer === 0;

      // Total slots to draw = full pieces + (1 partial if remainder)
      var totalSlots = whole + (fitsEvenly ? 0 : 1);
      var unitWord = unit ? " " + unit : "";

      // Draw the bar. Each full piece is one segment; a remainder is a partial.
      var html = "";
      if (totalSlots <= 0) {
        // whole smaller than one piece -> single partial slot showing the whole
        html =
          '<div class="pki-fd-seg part" style="flex-basis:100%">' +
          fracDisp(rem.n, rem.d) +
          " of a piece</div>";
      } else if (totalSlots > MAXSEG) {
        html =
          '<div class="pki-fd-seg full" style="flex-basis:100%">' +
          whole +
          " full pieces (too many to draw)</div>";
      } else {
        for (var i = 0; i < whole; i++) {
          html += '<div class="pki-fd-seg full">' + fracDisp(pn, pd) + "</div>";
        }
        if (!fitsEvenly) {
          // partial slot sized by the leftover fraction of a piece
          var frac = remNumer / denom; // 0..1 of a piece
          html +=
            '<div class="pki-fd-seg part" style="flex-grow:' +
            Math.max(0.18, frac) +
            '">' +
            fracDisp(rem.n, rem.d) +
            "</div>";
        }
      }
      trackBox.innerHTML = html;
      scaleEnd.innerHTML = fracDisp(wn, wd) + unitWord;

      // Equation: whole ÷ piece = N (+ remainder)
      var ans = simplify(numer, denom); // exact quotient as a fraction
      var ansDisp = ans.d === 1 ? String(ans.n) : fracDisp(ans.n, ans.d);
      eqBox.innerHTML =
        fracDisp(wn, wd) +
        " ÷ " +
        fracDisp(pn, pd) +
        " = " +
        ansDisp +
        "<small>" +
        whole +
        " full piece" +
        (whole === 1 ? "" : "s") +
        (fitsEvenly
          ? " — it divides evenly!"
          : " with " + fracDisp(rem.n, rem.d) + " of a piece left over") +
        "</small>";

      // Plain-language note tying back to the project context.
      if (fitsEvenly) {
        noteBox.innerHTML =
          "You can make exactly <b>" +
          whole +
          "</b> piece" +
          (whole === 1 ? "" : "s") +
          " of " +
          fracDisp(pn, pd) +
          " from " +
          fracDisp(wn, wd) +
          " " +
          wholeLabel +
          ".";
      } else {
        noteBox.innerHTML =
          "<b>" +
          whole +
          "</b> full piece" +
          (whole === 1 ? "" : "s") +
          ", plus " +
          fracDisp(rem.n, rem.d) +
          " of one more piece — not an even split. Try a piece size that divides the whole evenly.";
      }
    }

    el.addEventListener("click", function (e) {
      var t = e.target;
      var inc = t.getAttribute && t.getAttribute("data-inc");
      var dec = t.getAttribute && t.getAttribute("data-dec");
      var key = inc || dec;
      if (!key) return;
      var d = inc ? 1 : -1;
      if (key === "wn") wn += d;
      else if (key === "wd") wd += d;
      else if (key === "pn") pn += d;
      else if (key === "pd") pd += d;
      render();
    });
    el.addEventListener("input", function (e) {
      var key = e.target.getAttribute && e.target.getAttribute("data-val");
      if (!key) return;
      var v = parseInt(e.target.value, 10);
      if (isNaN(v)) return;
      if (key === "wn") wn = v;
      else if (key === "wd") wd = v;
      else if (key === "pn") pn = v;
      else if (key === "pd") pd = v;
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
    document.querySelectorAll('.pki-manip[data-manip="frac-divide"]').forEach(init);
    setTimeout(function () {
      document.querySelectorAll('.pki-manip[data-manip="frac-divide"]').forEach(init);
    }, 900);
  });
})();
