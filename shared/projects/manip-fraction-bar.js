/* ==========================================================================
   Neft Teacher — "Fraction Bars" manipulative (self-contained)
   Drop a container on the page:
     <div class="pki-manip" data-manip="fraction-bar"
          data-parts-a="2" data-shaded-a="1"
          data-parts-b="4" data-shaded-b="2"></div>
   Two tape bars. For each: −/+ change the number of equal parts (denominator);
   tap the bar to shade that many parts (numerator). Live readout of each
   fraction (reduced), its percent, and a comparison symbol (< = >) between the
   two — so students can SEE equivalent fractions and compare unlike fractions.
   Optional data-label-a / data-label-b caption each bar. No dependencies.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STYLE_ID = "pki-fracbar-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".pki-fb{border:2px solid var(--tp-line,#e4ebf2);border-radius:18px;background:#fff;padding:18px;box-shadow:var(--tp-shadow-sm,0 2px 6px rgba(12,27,42,.08));margin:14px 0}" +
      ".pki-fb h4{margin:0 0 12px;font-size:1.15rem;color:#12355b}" +
      ".pki-fb-bar-wrap{margin:12px 0}" +
      ".pki-fb-cap{font-weight:800;color:#54677c;font-size:.85rem;margin-bottom:6px}" +
      ".pki-fb-ctrl{display:flex;align-items:center;gap:10px;margin-bottom:8px}" +
      ".pki-fb-ctrl label{font-size:.8rem;font-weight:800;color:#54677c}" +
      ".pki-fb-btn{width:38px;height:38px;border-radius:10px;border:2px solid #e4ebf2;background:#fff;color:#1fa6a2;font-size:1.3rem;font-weight:800;cursor:pointer;line-height:1}" +
      ".pki-fb-btn:active{transform:scale(.9)}" +
      ".pki-fb-btn:focus-visible{outline:3px solid #1fa6a2;outline-offset:2px}" +
      ".pki-fb-bar{display:flex;height:52px;border:2px solid #12355b;border-radius:8px;overflow:hidden;cursor:pointer}" +
      ".pki-fb-seg{flex:1;border-right:1px solid rgba(18,53,91,.35);transition:background .12s}" +
      ".pki-fb-seg:last-child{border-right:0}" +
      ".pki-fb-seg.on{background:#1fa6a2}" +
      ".pki-fb-read{font-size:1.05rem;color:#12355b;margin-top:4px}" +
      ".pki-fb-read b{font-size:1.2rem}" +
      ".pki-fb-compare{text-align:center;font-size:1.6rem;font-weight:800;color:#12355b;margin:6px 0}" +
      ".pki-fb-compare span{color:#1fa6a2}";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function gcd(a, b) {
    return b ? gcd(b, a % b) : a;
  }
  function reduced(n, d) {
    if (n === 0) return "0";
    var g = gcd(n, d) || 1;
    return n / g + "/" + d / g;
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectStyle();

    var MAX = 12,
      MIN = 1;
    var bars = [
      {
        parts: clamp(parseInt(el.dataset.partsA, 10) || 2),
        shaded: parseInt(el.dataset.shadedA, 10),
        label: el.dataset.labelA || "Bar A",
      },
      {
        parts: clamp(parseInt(el.dataset.partsB, 10) || 4),
        shaded: parseInt(el.dataset.shadedB, 10),
        label: el.dataset.labelB || "Bar B",
      },
    ];
    function clamp(v) {
      return Math.max(MIN, Math.min(MAX, v || 1));
    }
    bars.forEach(function (b) {
      if (isNaN(b.shaded)) b.shaded = Math.round(b.parts / 2);
      b.shaded = Math.max(0, Math.min(b.parts, b.shaded));
    });

    el.innerHTML =
      "<h4>🍫 Fraction Bars — Tap to shade, compare the two</h4>" +
      bars
        .map(function (b, i) {
          return (
            '<div class="pki-fb-bar-wrap" data-bar="' +
            i +
            '">' +
            '<div class="pki-fb-cap">' +
            esc(b.label) +
            "</div>" +
            '<div class="pki-fb-ctrl"><label>Equal parts</label>' +
            '<button class="pki-fb-btn" data-parts-dec aria-label="Fewer parts">−</button>' +
            '<span data-parts-val style="font-weight:800;min-width:24px;text-align:center">' +
            b.parts +
            "</span>" +
            '<button class="pki-fb-btn" data-parts-inc aria-label="More parts">+</button></div>' +
            '<div class="pki-fb-bar" data-bar-track role="slider" tabindex="0" aria-label="' +
            esc(b.label) +
            ' fraction bar"></div>' +
            '<div class="pki-fb-read" data-read></div>' +
            "</div>"
          );
        })
        .join("") +
      '<div class="pki-fb-compare" data-compare></div>';

    function esc(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
      });
    }

    function renderBar(i) {
      var b = bars[i];
      var wrap = el.querySelector('[data-bar="' + i + '"]');
      wrap.querySelector("[data-parts-val]").textContent = b.parts;
      var track = wrap.querySelector("[data-bar-track]");
      track.innerHTML = "";
      for (var k = 0; k < b.parts; k++) {
        var seg = document.createElement("div");
        seg.className = "pki-fb-seg" + (k < b.shaded ? " on" : "");
        seg.dataset.idx = String(k);
        track.appendChild(seg);
      }
      var pct = Math.round((b.shaded / b.parts) * 1000) / 10;
      wrap.querySelector("[data-read]").innerHTML =
        "<b>" +
        b.shaded +
        "/" +
        b.parts +
        "</b> shaded" +
        (reduced(b.shaded, b.parts) !== b.shaded + "/" + b.parts
          ? " = " + reduced(b.shaded, b.parts)
          : "") +
        " = " +
        pct +
        "%";
    }

    function renderCompare() {
      var a = bars[0].shaded / bars[0].parts;
      var c = bars[1].shaded / bars[1].parts;
      var sym = a < c ? "&lt;" : a > c ? "&gt;" : "=";
      el.querySelector("[data-compare]").innerHTML =
        reduced(bars[0].shaded, bars[0].parts) +
        " <span>" +
        sym +
        "</span> " +
        reduced(bars[1].shaded, bars[1].parts);
    }

    function refresh(i) {
      renderBar(i);
      renderCompare();
    }

    bars.forEach(function (b, i) {
      var wrap = el.querySelector('[data-bar="' + i + '"]');
      wrap.querySelector("[data-parts-dec]").addEventListener("click", function () {
        b.parts = Math.max(MIN, b.parts - 1);
        b.shaded = Math.min(b.shaded, b.parts);
        refresh(i);
      });
      wrap.querySelector("[data-parts-inc]").addEventListener("click", function () {
        b.parts = Math.min(MAX, b.parts + 1);
        refresh(i);
      });
      var track = wrap.querySelector("[data-bar-track]");
      track.addEventListener("click", function (e) {
        var seg = e.target.closest(".pki-fb-seg");
        if (!seg) return;
        var idx = parseInt(seg.dataset.idx, 10);
        // Tapping shades from the left up to (and including) the tapped part;
        // tapping the last shaded part clears it.
        b.shaded = idx + 1 === b.shaded ? idx : idx + 1;
        refresh(i);
      });
      track.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          b.shaded = Math.min(b.parts, b.shaded + 1);
          refresh(i);
          e.preventDefault();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          b.shaded = Math.max(0, b.shaded - 1);
          refresh(i);
          e.preventDefault();
        }
      });
      renderBar(i);
    });
    renderCompare();
  }

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }
  ready(function () {
    document.querySelectorAll('.pki-manip[data-manip="fraction-bar"]').forEach(init);
    setTimeout(function () {
      document.querySelectorAll('.pki-manip[data-manip="fraction-bar"]').forEach(init);
    }, 900);
  });

  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["fraction-bar"] = init;
  }
})();
