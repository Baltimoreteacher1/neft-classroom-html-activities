/* ==========================================================================
   Neft Teacher — Dot Plot Builder manipulative (self-contained)
   Drop a container on the page:
     <div class="pki-manip" data-manip="dot-plot" data-max="20"></div>
   Tap a value on the number line to ADD a dot above it (dots stack at the
   same value). Tap a dot to remove it. Live stats — mean, median, mode,
   range, MAD — update as the data changes, so students SEE how adding a
   value shifts center and spread. Undo / Clear buttons.
   No dependencies. Injects its own scoped styles once. Uses its OWN dataset,
   not the page's.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STYLE_ID = "pki-dotplot-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".pki-dot{border:2px solid var(--tp-line,#e4ebf2);border-radius:18px;background:#fff;padding:18px;box-shadow:var(--tp-shadow-sm,0 2px 6px rgba(12,27,42,.08));margin:14px 0}" +
      ".pki-dot h4{margin:0 0 4px;font-size:1.15rem}" +
      ".pki-dot .pki-d-sub{margin:0 0 12px;color:var(--tp-muted,#54677c);font-size:.95rem}" +
      ".pki-d-svg svg{width:100%;height:auto;border-radius:12px;background:#fbfdff;border:1px solid var(--tp-line,#e4ebf2);touch-action:manipulation;cursor:pointer}" +
      ".pki-d-stats{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}" +
      ".pki-d-stat{flex:1 1 90px;min-width:84px;background:#f4f8ff;border:1px solid var(--tp-line,#e4ebf2);border-radius:12px;padding:8px 10px;text-align:center}" +
      ".pki-d-stat .pki-d-k{display:block;font-size:.68rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--tp-muted,#54677c)}" +
      ".pki-d-stat .pki-d-v{display:block;font-size:1.25rem;font-weight:800;color:var(--tp-accent,#1763c7);line-height:1.3}" +
      ".pki-d-stat.pki-d-count .pki-d-v{color:var(--tp-accent2,#0e9a8c)}" +
      ".pki-d-actions{display:flex;gap:8px}" +
      ".pki-d-act{flex:1;padding:.55em;border-radius:10px;border:2px solid var(--tp-line,#e4ebf2);background:#fff;color:var(--tp-ink,#172033);font-weight:700;cursor:pointer;font-size:.9rem}" +
      ".pki-d-act:active{transform:scale(.96)}";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectStyle();

    var MAX = parseInt(el.dataset.max, 10);
    if (isNaN(MAX) || MAX < 2) MAX = 20;
    var MIN = 0;
    var COUNT = MAX - MIN; // intervals
    var W = 480,
      PADX = 30,
      AXIS_Y = 210,
      TICK_TOP = 30;
    var span = W - PADX * 2;
    var step = span / COUNT;
    var STACK = 17,
      DOT_R = 7;
    var data = []; // array of integer values

    function vx(v) {
      return PADX + (v - MIN) * step;
    }

    el.innerHTML =
      "<h4>📊 Dot Plot Builder</h4>" +
      '<p class="pki-d-sub">Tap a number on the line to add a dot. Tap a dot to remove it. Watch the <b>mean</b>, <b>median</b>, <b>mode</b>, <b>range</b>, and <b>MAD</b> change as you build the data — see how one value can shift the center and the spread.</p>' +
      '<div class="pki-d-svg" data-svg></div>' +
      '<div class="pki-d-stats" data-stats></div>' +
      '<div class="pki-d-actions"><button type="button" class="pki-d-act" data-undo>↶ Undo</button><button type="button" class="pki-d-act" data-clear>✕ Clear</button></div>';

    var svgBox = el.querySelector("[data-svg]");
    var statsBox = el.querySelector("[data-stats]");

    function axisSvg() {
      var g =
        '<line x1="' +
        (PADX - 8) +
        '" y1="' +
        AXIS_Y +
        '" x2="' +
        (W - PADX + 8) +
        '" y2="' +
        AXIS_Y +
        '" stroke="#475569" stroke-width="2"/>';
      // tick label spacing: keep labels readable even for large MAX
      var labelEvery = COUNT > 24 ? 5 : COUNT > 12 ? 2 : 1;
      for (var v = MIN; v <= MAX; v++) {
        var x = vx(v);
        g +=
          '<line x1="' +
          x +
          '" y1="' +
          (AXIS_Y - 4) +
          '" x2="' +
          x +
          '" y2="' +
          (AXIS_Y + 4) +
          '" stroke="#475569" stroke-width="1.4"/>';
        if ((v - MIN) % labelEvery === 0) {
          g +=
            '<text x="' +
            x +
            '" y="' +
            (AXIS_Y + 20) +
            '" font-size="12" fill="#475569" text-anchor="middle">' +
            v +
            "</text>";
        }
      }
      return g;
    }

    function dotsSvg() {
      // group by value to stack
      var counts = {};
      var g = "";
      data.forEach(function (v, idx) {
        var k = counts[v] || 0;
        counts[v] = k + 1;
        var cx = vx(v);
        var cy = AXIS_Y - 12 - k * STACK;
        if (cy < TICK_TOP) cy = TICK_TOP; // clamp tall stacks
        g +=
          '<circle data-dot="' +
          idx +
          '" cx="' +
          cx +
          '" cy="' +
          cy +
          '" r="' +
          DOT_R +
          '" fill="var(--tp-accent,#1763c7)" stroke="#fff" stroke-width="2" style="cursor:pointer"/>';
      });
      return g;
    }

    function draw() {
      svgBox.innerHTML =
        '<svg viewBox="0 0 ' +
        W +
        ' 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Number line dot plot, tap a number to add a dot">' +
        axisSvg() +
        dotsSvg() +
        "</svg>";
      svgBox.querySelector("svg").addEventListener("click", onTap);
      renderStats();
    }

    function renderStats() {
      var n = data.length;
      var mean = "—",
        median = "—",
        mode = "—",
        range = "—",
        mad = "—";
      if (n) {
        var sorted = data.slice().sort(function (a, b) {
          return a - b;
        });
        var sum = sorted.reduce(function (a, b) {
          return a + b;
        }, 0);
        var m = sum / n;
        mean = round1(m);
        var mid = Math.floor(n / 2);
        median = n % 2 ? sorted[mid] : round1((sorted[mid - 1] + sorted[mid]) / 2);
        range = sorted[n - 1] - sorted[0];
        // mode(s)
        var freq = {},
          best = 0;
        sorted.forEach(function (v) {
          freq[v] = (freq[v] || 0) + 1;
          if (freq[v] > best) best = freq[v];
        });
        if (best <= 1) {
          mode = "none";
        } else {
          var modes = Object.keys(freq)
            .filter(function (k) {
              return freq[k] === best;
            })
            .map(Number)
            .sort(function (a, b) {
              return a - b;
            });
          mode = modes.join(", ");
        }
        var madSum = sorted.reduce(function (a, v) {
          return a + Math.abs(v - m);
        }, 0);
        mad = round1(madSum / n);
      }
      statsBox.innerHTML =
        stat("count", n, "pki-d-count") +
        stat("mean", mean) +
        stat("median", median) +
        stat("mode", mode) +
        stat("range", range) +
        stat("MAD", mad);
    }

    function stat(k, v, extra) {
      return (
        '<div class="pki-d-stat ' +
        (extra || "") +
        '"><span class="pki-d-k">' +
        k +
        '</span><span class="pki-d-v">' +
        v +
        "</span></div>"
      );
    }

    function onTap(e) {
      var dotEl = e.target.closest && e.target.closest("[data-dot]");
      if (dotEl) {
        data.splice(parseInt(dotEl.getAttribute("data-dot"), 10), 1);
        draw();
        return;
      }
      var svg = e.currentTarget;
      var r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return; // guard 0-size measurement
      var px = ((e.clientX - r.left) / r.width) * W;
      var v = Math.round((px - PADX) / step) + MIN;
      if (v < MIN || v > MAX) return;
      if (data.length >= 200) return; // sane cap
      data.push(v);
      draw();
    }

    el.querySelector("[data-undo]").addEventListener("click", function () {
      data.pop();
      draw();
    });
    el.querySelector("[data-clear]").addEventListener("click", function () {
      data = [];
      draw();
    });

    draw();
  }

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }
  ready(function () {
    document.querySelectorAll('.pki-manip[data-manip="dot-plot"]').forEach(init);
    setTimeout(function () {
      document.querySelectorAll('.pki-manip[data-manip="dot-plot"]').forEach(init);
    }, 900);
  });
})();
