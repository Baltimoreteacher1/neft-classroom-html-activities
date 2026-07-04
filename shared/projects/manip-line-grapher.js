/* ==========================================================================
   Neft Teacher — "y = kx Grapher" manipulative (self-contained)
   Drop a container on the page and this renders a drag-to-explore widget:
     <div class="pki-manip" data-manip="line-grapher"
          data-x-name="weeks" data-y-name="subscribers"
          data-k-name="new subscribers per week"></div>
   A slider (and − / + stepper) sets the constant k. Live update of:
     (1) the equation  y = kx
     (2) a table of (x, y) for x = 0, 1, 2, 5, 10
     (3) an SVG first-quadrant graph: the straight line through the origin
         with slope k, with the table points plotted.
   Tap / drag on the graph to read the y value at any whole-number x.
   Optional attributes: data-k-min, data-k-max, data-k-step, data-k-default,
   data-y-prefix (e.g. "$"). No dependencies. Injects its own scoped styles.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STYLE_ID = "pki-linegraph-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".pki-lg{border:2px solid var(--tp-line,#e4ebf2);border-radius:18px;background:#fff;padding:18px;box-shadow:var(--tp-shadow-sm,0 2px 6px rgba(12,27,42,.08));margin:14px 0}" +
      ".pki-lg h4{margin:0 0 4px;font-size:1.15rem}" +
      ".pki-lg .pki-lg-sub{margin:0 0 14px;color:var(--tp-muted,#54677c);font-size:.95rem}" +
      ".pki-lg-ctrl{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:14px}" +
      ".pki-lg-ctrl label{font-size:.8rem;font-weight:800;letter-spacing:.03em;color:var(--tp-muted,#54677c);width:100%}" +
      ".pki-lg-btn{width:42px;height:42px;border-radius:12px;border:2px solid var(--tp-line,#e4ebf2);background:#fff;color:var(--tp-accent,#1763c7);font-size:1.5rem;font-weight:800;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center}" +
      ".pki-lg-btn:active{transform:scale(.9)}" +
      ".pki-lg-range{flex:1 1 160px;min-width:140px;accent-color:var(--tp-accent,#1763c7);height:28px}" +
      ".pki-lg-kbox{min-width:64px;text-align:center;font-size:1.15rem;font-weight:800;padding:.35em .5em;border:2px solid var(--tp-line,#e4ebf2);border-radius:12px}" +
      ".pki-lg-eq{display:inline-block;background:linear-gradient(135deg,var(--tp-accent,#1763c7),var(--tp-accent2,#0e9a8c));color:#fff;border-radius:12px;padding:10px 16px;font-size:1.25rem;font-weight:800;letter-spacing:.01em;margin:0 0 14px}" +
      ".pki-lg-eq small{font-weight:600;opacity:.85;font-size:.8rem;display:block;letter-spacing:.02em}" +
      ".pki-lg-wrap{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}" +
      ".pki-lg-svg{flex:1 1 320px;max-width:460px}" +
      ".pki-lg-svg svg{width:100%;height:auto;border-radius:12px;background:#fbfdff;border:1px solid var(--tp-line,#e4ebf2);touch-action:none;cursor:crosshair}" +
      ".pki-lg-side{flex:1 1 180px;min-width:170px}" +
      ".pki-lg-side h5{margin:0 0 8px;font-size:.95rem;color:var(--tp-ink,#172033)}" +
      ".pki-lg-table{border-collapse:collapse;width:100%;font-size:.95rem}" +
      ".pki-lg-table caption{caption-side:top;font-size:.78rem;font-weight:800;letter-spacing:.03em;color:var(--tp-muted,#54677c);text-transform:uppercase;margin-bottom:6px;text-align:left}" +
      ".pki-lg-table th,.pki-lg-table td{border:1px solid var(--tp-line,#e4ebf2);padding:7px 10px;text-align:center}" +
      ".pki-lg-table th{background:#f4f8ff;color:var(--tp-accent,#1763c7);font-weight:800}" +
      ".pki-lg-table td b{color:var(--tp-ink,#172033)}" +
      ".pki-lg-table tr.hot td{background:#eafaf0}" +
      ".pki-lg-read{margin-top:10px;border-radius:10px;padding:9px 12px;background:#f4f8ff;border:1px solid var(--tp-line,#e4ebf2);font-size:.92rem;color:var(--tp-ink,#172033)}" +
      ".pki-lg-read b{color:var(--tp-accent,#1763c7)}";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  var XS = [0, 1, 2, 5, 10];

  function fmtNum(n) {
    // up to 2 decimals, trim trailing zeros
    var r = Math.round(n * 100) / 100;
    return String(r);
  }
  function niceMax(v) {
    if (v <= 0) return 10;
    var pow = Math.pow(10, Math.floor(Math.log(v) / Math.LN10));
    var steps = [1, 2, 2.5, 5, 10];
    for (var i = 0; i < steps.length; i++) {
      var cand = steps[i] * pow;
      if (cand >= v) return cand;
    }
    return 10 * pow;
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectStyle();

    var xName = el.dataset.xName || "x";
    var yName = el.dataset.yName || "y";
    var kName = el.dataset.kName || "amount per " + xName.replace(/s$/, "");
    var yPrefix = el.dataset.yPrefix || "";
    var kMin = parseFloat(el.dataset.kMin);
    var kMax = parseFloat(el.dataset.kMax);
    var kStep = parseFloat(el.dataset.kStep);
    var kDef = parseFloat(el.dataset.kDefault);
    if (isNaN(kMin)) kMin = 0;
    if (isNaN(kMax)) kMax = 50;
    if (isNaN(kStep) || kStep <= 0) kStep = 1;
    if (isNaN(kDef)) kDef = Math.round((kMin + kMax) / 5);
    var k = Math.min(kMax, Math.max(kMin, kDef));

    var XMAX = 10;
    var SZ_W = 420,
      SZ_H = 330,
      PADL = 52,
      PADR = 16,
      PADT = 16,
      PADB = 40;
    var hotX = null; // tapped/dragged whole-number x

    el.innerHTML =
      "<h4>📈 y = kx Grapher</h4>" +
      '<p class="pki-lg-sub">Drag the slider to set <b>k</b> (' +
      kName +
      "). Watch the equation, the table, and the line all change together. The line always starts at the origin (0, 0) — that is what makes it a <b>proportional</b> relationship. Tap the graph to read the " +
      yName +
      " at any " +
      xName.replace(/s$/, "") +
      "." +
      "</p>" +
      '<div class="pki-lg-ctrl">' +
      "<label>k = " +
      kName +
      "</label>" +
      '<button type="button" class="pki-lg-btn" data-dec aria-label="decrease k">−</button>' +
      '<input type="range" class="pki-lg-range" data-range min="' +
      kMin +
      '" max="' +
      kMax +
      '" step="' +
      kStep +
      '" value="' +
      k +
      '" aria-label="constant k">' +
      '<button type="button" class="pki-lg-btn" data-inc aria-label="increase k">+</button>' +
      '<input type="text" inputmode="decimal" class="pki-lg-kbox" data-kbox value="' +
      k +
      '" aria-label="value of k">' +
      "</div>" +
      '<div class="pki-lg-eq" data-eq></div>' +
      '<div class="pki-lg-wrap">' +
      '<div class="pki-lg-svg" data-svg></div>' +
      '<div class="pki-lg-side">' +
      '<table class="pki-lg-table"><caption>Table of values</caption>' +
      "<thead><tr><th>x (" +
      xName +
      ")</th><th>y (" +
      yName +
      ")</th></tr></thead>" +
      "<tbody data-tbody></tbody></table>" +
      '<div class="pki-lg-read" data-read></div>' +
      "</div>" +
      "</div>";

    var rangeEl = el.querySelector("[data-range]");
    var kboxEl = el.querySelector("[data-kbox]");
    var eqBox = el.querySelector("[data-eq]");
    var svgBox = el.querySelector("[data-svg]");
    var tbody = el.querySelector("[data-tbody]");
    var readBox = el.querySelector("[data-read]");

    function clampK() {
      if (isNaN(k)) k = kMin;
      k = Math.min(kMax, Math.max(kMin, k));
      // snap to step grid
      var snapped = kMin + Math.round((k - kMin) / kStep) * kStep;
      k = Math.round(snapped * 100) / 100;
    }

    function yAt(x) {
      return k * x;
    }

    function sx(x, yMax) {
      var span = SZ_W - PADL - PADR;
      return PADL + (x / XMAX) * span;
    }
    function sy(y, yMax) {
      var span = SZ_H - PADT - PADB;
      return SZ_H - PADB - (yMax ? (y / yMax) * span : 0);
    }

    function buildSvg(yMax) {
      var g = "";
      // axes
      var x0 = sx(0, yMax),
        y0 = sy(0, yMax);
      var xEnd = sx(XMAX, yMax),
        yTop = sy(yMax, yMax);
      // gridlines (x)
      var xi;
      for (xi = 0; xi <= XMAX; xi += 2) {
        var gx = sx(xi, yMax);
        g +=
          '<line x1="' +
          gx +
          '" y1="' +
          yTop +
          '" x2="' +
          gx +
          '" y2="' +
          y0 +
          '" stroke="#eef2f7" stroke-width="1"/>';
        g +=
          '<text x="' +
          gx +
          '" y="' +
          (y0 + 16) +
          '" font-size="10" fill="#94a3b8" text-anchor="middle">' +
          xi +
          "</text>";
      }
      // gridlines (y) — 5 ticks
      var t;
      for (t = 1; t <= 5; t++) {
        var yv = (yMax / 5) * t;
        var gy = sy(yv, yMax);
        g +=
          '<line x1="' +
          x0 +
          '" y1="' +
          gy +
          '" x2="' +
          xEnd +
          '" y2="' +
          gy +
          '" stroke="#eef2f7" stroke-width="1"/>';
        g +=
          '<text x="' +
          (x0 - 6) +
          '" y="' +
          (gy + 3) +
          '" font-size="10" fill="#94a3b8" text-anchor="end">' +
          yPrefix +
          fmtNum(yv) +
          "</text>";
      }
      // main axes
      g +=
        '<line x1="' +
        x0 +
        '" y1="' +
        y0 +
        '" x2="' +
        xEnd +
        '" y2="' +
        y0 +
        '" stroke="#475569" stroke-width="1.6"/>';
      g +=
        '<line x1="' +
        x0 +
        '" y1="' +
        y0 +
        '" x2="' +
        x0 +
        '" y2="' +
        yTop +
        '" stroke="#475569" stroke-width="1.6"/>';
      // axis labels
      g +=
        '<text x="' +
        (x0 + xEnd) / 2 +
        '" y="' +
        (SZ_H - 6) +
        '" font-size="11" font-weight="700" fill="#475569" text-anchor="middle">' +
        xName +
        " (x)</text>";
      g +=
        '<text transform="translate(13,' +
        (y0 + yTop) / 2 +
        ') rotate(-90)" font-size="11" font-weight="700" fill="#475569" text-anchor="middle">' +
        yName +
        " (y)</text>";
      // the line y = kx
      g +=
        '<line x1="' +
        x0 +
        '" y1="' +
        y0 +
        '" x2="' +
        sx(XMAX, yMax) +
        '" y2="' +
        sy(yAt(XMAX), yMax) +
        '" stroke="var(--tp-accent,#1763c7)" stroke-width="3" stroke-linecap="round"/>';
      // table points
      XS.forEach(function (x) {
        g +=
          '<circle cx="' +
          sx(x, yMax) +
          '" cy="' +
          sy(yAt(x), yMax) +
          '" r="5" fill="var(--tp-accent2,#0e9a8c)" stroke="#fff" stroke-width="2"/>';
      });
      // hot (tapped) readout marker
      if (hotX != null) {
        var hx = sx(hotX, yMax),
          hy = sy(yAt(hotX), yMax);
        g +=
          '<line x1="' +
          hx +
          '" y1="' +
          y0 +
          '" x2="' +
          hx +
          '" y2="' +
          hy +
          '" stroke="#ef6b52" stroke-width="1.5" stroke-dasharray="4 3"/>';
        g +=
          '<line x1="' +
          x0 +
          '" y1="' +
          hy +
          '" x2="' +
          hx +
          '" y2="' +
          hy +
          '" stroke="#ef6b52" stroke-width="1.5" stroke-dasharray="4 3"/>';
        g +=
          '<circle cx="' +
          hx +
          '" cy="' +
          hy +
          '" r="6" fill="#ef6b52" stroke="#fff" stroke-width="2"/>';
      }
      return g;
    }

    function render() {
      clampK();
      rangeEl.value = k;
      kboxEl.value = k;
      eqBox.innerHTML =
        "y = " +
        fmtNum(k) +
        "x" +
        "<small>" +
        yName +
        " = " +
        fmtNum(k) +
        " × " +
        xName +
        "</small>";
      // table
      tbody.innerHTML = XS.map(function (x) {
        var hot = hotX === x;
        return (
          '<tr class="' +
          (hot ? "hot" : "") +
          '"><td>' +
          x +
          "</td><td><b>" +
          yPrefix +
          fmtNum(yAt(x)) +
          "</b></td></tr>"
        );
      }).join("");
      // graph
      var yMax = niceMax(yAt(XMAX)) || 10;
      svgBox.innerHTML =
        '<svg viewBox="0 0 ' +
        SZ_W +
        " " +
        SZ_H +
        '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Graph of y equals ' +
        fmtNum(k) +
        ' times x">' +
        buildSvg(yMax) +
        "</svg>";
      var svg = svgBox.querySelector("svg");
      svg.addEventListener("pointerdown", onPoint);
      svg.addEventListener("pointermove", onMove);
      // readout
      if (hotX == null) {
        readBox.innerHTML =
          "Tap the graph to read a point. Every step of 1 " +
          xName.replace(/s$/, "") +
          " adds <b>" +
          yPrefix +
          fmtNum(k) +
          "</b> " +
          yName +
          ".";
      } else {
        readBox.innerHTML =
          "At x = <b>" +
          hotX +
          "</b> " +
          xName +
          ", y = <b>" +
          yPrefix +
          fmtNum(yAt(hotX)) +
          "</b> " +
          yName +
          ".";
      }
    }

    function pickX(e, svg) {
      var r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      var px = ((e.clientX - r.left) / r.width) * SZ_W;
      var span = SZ_W - PADL - PADR;
      var xv = ((px - PADL) / span) * XMAX;
      var x = Math.round(xv);
      if (x < 0) x = 0;
      if (x > XMAX) x = XMAX;
      return x;
    }
    function onPoint(e) {
      var svg = e.currentTarget;
      var x = pickX(e, svg);
      if (x == null) return;
      hotX = x;
      render();
    }
    function onMove(e) {
      if (e.buttons !== 1) return; // only while dragging
      onPoint(e);
    }

    rangeEl.addEventListener("input", function () {
      k = parseFloat(rangeEl.value);
      render();
    });
    kboxEl.addEventListener("input", function () {
      var v = parseFloat(kboxEl.value);
      if (isNaN(v)) return;
      k = v;
      render();
    });
    el.querySelector("[data-inc]").addEventListener("click", function () {
      k += kStep;
      render();
    });
    el.querySelector("[data-dec]").addEventListener("click", function () {
      k -= kStep;
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
    document.querySelectorAll('.pki-manip[data-manip="line-grapher"]').forEach(init);
    setTimeout(function () {
      document.querySelectorAll('.pki-manip[data-manip="line-grapher"]').forEach(init);
    }, 900);
  });
})();
