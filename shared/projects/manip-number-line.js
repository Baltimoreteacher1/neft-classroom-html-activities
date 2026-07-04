/* ==========================================================================
   Neft Teacher — Depth Gauge / Vertical Number Line manipulative (self-contained)
   Drop a container on the page:
     <div class="pki-manip" data-manip="number-line" data-range="120" data-unit="m"></div>
   A vertical number line with 0 = Sea Level (positive above, negative below).
   Tap the line to drop a marker at the nearest integer; it shows the value and
   its ABSOLUTE VALUE (distance from sea level). Up to ~4 markers, listed in
   order from lowest to highest with the range (max − min). Undo / Clear buttons.
   No dependencies. Injects its own scoped styles once.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STYLE_ID = "pki-nl-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".pki-nl{border:2px solid var(--tp-line,#e4ebf2);border-radius:18px;background:#fff;padding:18px;box-shadow:var(--tp-shadow-sm,0 2px 6px rgba(12,27,42,.08));margin:14px 0}" +
      ".pki-nl h4{margin:0 0 4px;font-size:1.15rem}" +
      ".pki-nl .pki-nl-sub{margin:0 0 12px;color:var(--tp-muted,#54677c);font-size:.95rem}" +
      ".pki-nl-wrap{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}" +
      ".pki-nl-svg{flex:0 0 170px;max-width:200px}" +
      ".pki-nl-svg svg{width:100%;height:auto;border-radius:12px;background:#fbfdff;border:1px solid var(--tp-line,#e4ebf2);touch-action:manipulation;cursor:crosshair}" +
      ".pki-nl-side{flex:1 1 220px;min-width:200px}" +
      ".pki-nl-side h5{margin:0 0 8px;font-size:.95rem}" +
      ".pki-nl-list{list-style:none;margin:0 0 12px;padding:0;display:grid;gap:6px}" +
      ".pki-nl-list li{display:flex;flex-direction:column;gap:2px;background:#f4f8ff;border:1px solid var(--tp-line,#e4ebf2);border-left-width:5px;border-radius:10px;padding:7px 10px;font-size:.92rem}" +
      ".pki-nl-list li b{color:var(--tp-accent,#1763c7);font-size:1rem}" +
      ".pki-nl-list li span{color:var(--tp-muted,#54677c);font-size:.85rem}" +
      ".pki-nl-range{background:linear-gradient(135deg,var(--tp-accent,#1763c7),var(--tp-accent2,#0e9a8c));color:#fff;border-radius:10px;padding:9px 11px;font-size:.9rem;font-weight:700;margin:0 0 12px}" +
      ".pki-nl-empty{color:var(--tp-muted,#54677c);font-size:.9rem;margin:0 0 12px}" +
      ".pki-nl-actions{display:flex;gap:8px}" +
      ".pki-nl-act{flex:1;padding:.55em;border-radius:10px;border:2px solid var(--tp-line,#e4ebf2);background:#fff;color:var(--tp-ink,#172033);font-weight:700;cursor:pointer;font-size:.9rem}" +
      ".pki-nl-act:active{transform:scale(.96)}";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  // Pick a "nice" tick step so the axis shows roughly 8–12 labelled ticks.
  function niceStep(R) {
    var candidates = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500];
    for (var i = 0; i < candidates.length; i++) {
      if ((2 * R) / candidates[i] <= 12) return candidates[i];
    }
    return candidates[candidates.length - 1];
  }

  // Format a signed integer using a true minus sign (−) for negatives.
  function fmt(v) {
    return v < 0 ? "−" + Math.abs(v) : String(v);
  }
  function place(v) {
    if (v > 0) return "above sea level";
    if (v < 0) return "below sea level";
    return "at sea level";
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectStyle();

    var R = parseInt(el.dataset.range, 10) || 120;
    var UNIT = el.dataset.unit || "m";
    var MAXM = 4;
    var W = 170,
      H = 460,
      PADV = 30;
    var AXIS = W * 0.42; // x position of the vertical line
    var span = H - PADV * 2;
    var unit = span / (2 * R);
    var step = niceStep(R);
    var COLORS = ["#1763c7", "#ef6b52", "#0e9a8c", "#6d4ad6", "#f4a924", "#19a35a"];
    var markers = [];

    function sy(v) {
      return PADV + (R - v) * unit;
    }

    el.innerHTML =
      "<h4>📏 Depth Gauge — Tap the Number Line</h4>" +
      '<p class="pki-nl-sub">Tap the vertical number line to drop a depth marker. <b>0 = sea level</b> — values above are positive, below are negative. Each marker snaps to the nearest whole meter and shows its <b>absolute value</b> (its distance from sea level). Drop up to ' +
      MAXM +
      " markers to compare and order them.</p>" +
      '<div class="pki-nl-wrap">' +
      '<div class="pki-nl-svg" data-svg></div>' +
      '<div class="pki-nl-side"><h5>Your depth readings</h5><div data-list></div>' +
      '<div class="pki-nl-actions"><button type="button" class="pki-nl-act" data-undo>↶ Undo</button><button type="button" class="pki-nl-act" data-clear>✕ Clear</button></div>' +
      "</div>" +
      "</div>";

    var svgBox = el.querySelector("[data-svg]");
    var listBox = el.querySelector("[data-list]");

    function axisSvg() {
      var g = "";
      // sky tint (above sea level) and water tint (below)
      g +=
        '<rect x="0" y="' +
        PADV +
        '" width="' +
        W +
        '" height="' +
        (sy(0) - PADV) +
        '" fill="#eef6fc"/>';
      g +=
        '<rect x="0" y="' +
        sy(0) +
        '" width="' +
        W +
        '" height="' +
        (H - PADV - sy(0)) +
        '" fill="#dcecf7"/>';
      // main vertical line
      g +=
        '<line x1="' +
        AXIS +
        '" y1="' +
        PADV +
        '" x2="' +
        AXIS +
        '" y2="' +
        (H - PADV) +
        '" stroke="#475569" stroke-width="1.8"/>';
      // ticks + labels at the nice step
      for (var v = -R; v <= R; v += step) {
        var y = sy(v);
        var major = v === 0;
        g +=
          '<line x1="' +
          (AXIS - 6) +
          '" y1="' +
          y +
          '" x2="' +
          (AXIS + 6) +
          '" y2="' +
          y +
          '" stroke="' +
          (major ? "#475569" : "#94a3b8") +
          '" stroke-width="' +
          (major ? 1.8 : 1) +
          '"/>';
        if (major) {
          g +=
            '<text x="' +
            (AXIS + 11) +
            '" y="' +
            (y + 4) +
            '" font-size="11" font-weight="700" fill="#1763c7">0 ' +
            UNIT +
            "</text>";
        } else {
          g +=
            '<text x="' +
            (AXIS - 10) +
            '" y="' +
            (y + 4) +
            '" font-size="10" fill="#64748b" text-anchor="end">' +
            fmt(v) +
            "</text>";
        }
      }
      // sea level word + up/down hints
      g +=
        '<text x="' +
        (W - 4) +
        '" y="' +
        (PADV - 12) +
        '" font-size="9" fill="#94a3b8" text-anchor="end">above (+)</text>';
      g +=
        '<text x="' +
        (W - 4) +
        '" y="' +
        (H - PADV + 18) +
        '" font-size="9" fill="#94a3b8" text-anchor="end">below (−)</text>';
      return g;
    }

    function markersSvg() {
      return markers
        .map(function (m, i) {
          var c = COLORS[i % COLORS.length];
          var y = sy(m.v);
          return (
            '<g data-mk="' +
            i +
            '" style="cursor:pointer">' +
            '<line x1="' +
            (AXIS - 14) +
            '" y1="' +
            y +
            '" x2="' +
            (AXIS + 14) +
            '" y2="' +
            y +
            '" stroke="' +
            c +
            '" stroke-width="3"/>' +
            '<circle cx="' +
            AXIS +
            '" cy="' +
            y +
            '" r="6.5" fill="' +
            c +
            '" stroke="#fff" stroke-width="2"/>' +
            '<text x="' +
            (AXIS + 18) +
            '" y="' +
            (y + 4) +
            '" font-size="11" font-weight="700" fill="' +
            c +
            '">' +
            fmt(m.v) +
            " " +
            UNIT +
            "</text>" +
            "</g>"
          );
        })
        .join("");
    }

    function draw() {
      svgBox.innerHTML =
        '<svg viewBox="0 0 ' +
        W +
        " " +
        H +
        '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vertical depth number line, tap to place a marker">' +
        axisSvg() +
        markersSvg() +
        "</svg>";
      svgBox.querySelector("svg").addEventListener("click", onTap);
      renderList();
    }

    function renderList() {
      if (!markers.length) {
        listBox.innerHTML =
          '<p class="pki-nl-empty">No markers yet — tap the number line to drop your first depth reading.</p>';
        return;
      }
      var ordered = markers.slice().sort(function (a, b) {
        return a.v - b.v;
      });
      var html = "";
      if (ordered.length >= 2) {
        var lo = ordered[0].v,
          hi = ordered[ordered.length - 1].v;
        html +=
          '<p class="pki-nl-range">Ordered low → high. Range = ' +
          fmt(hi) +
          " − (" +
          fmt(lo) +
          ") = " +
          (hi - lo) +
          " " +
          UNIT +
          "</p>";
      }
      html +=
        '<ul class="pki-nl-list">' +
        ordered
          .map(function (m) {
            var c = COLORS[markers.indexOf(m) % COLORS.length];
            var av = Math.abs(m.v);
            return (
              '<li style="border-left-color:' +
              c +
              '"><b>' +
              fmt(m.v) +
              " " +
              UNIT +
              "</b><span>|" +
              fmt(m.v) +
              "| = " +
              av +
              " " +
              UNIT +
              " " +
              place(m.v) +
              "</span></li>"
            );
          })
          .join("") +
        "</ul>";
      listBox.innerHTML = html;
    }

    function onTap(e) {
      var mkEl = e.target.closest && e.target.closest("[data-mk]");
      if (mkEl) {
        markers.splice(parseInt(mkEl.getAttribute("data-mk"), 10), 1);
        draw();
        return;
      }
      var svg = e.currentTarget;
      var r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return; // guard 0-size measurement
      var py = ((e.clientY - r.top) / r.height) * H;
      var v = Math.round(R - (py - PADV) / unit);
      if (v < -R) v = -R;
      if (v > R) v = R;
      if (
        markers.some(function (m) {
          return m.v === v;
        })
      )
        return;
      if (markers.length >= MAXM) markers.shift();
      markers.push({ v: v });
      draw();
    }

    el.querySelector("[data-undo]").addEventListener("click", function () {
      markers.pop();
      draw();
    });
    el.querySelector("[data-clear]").addEventListener("click", function () {
      markers = [];
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
    document.querySelectorAll('.pki-manip[data-manip="number-line"]').forEach(init);
    setTimeout(function () {
      document.querySelectorAll('.pki-manip[data-manip="number-line"]').forEach(init);
    }, 900);
  });
})();
