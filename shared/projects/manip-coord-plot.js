/* ==========================================================================
   Neft Teacher — Coordinate Plotting manipulative (self-contained)
   Drop a container on the page:
     <div class="pki-manip" data-manip="coord-plot" data-range="10"></div>
   Tap the grid to plot an integer point; it labels the (x, y) coordinates
   and the quadrant. Tap a point to remove it. Undo / Clear buttons.
   No dependencies. Injects its own scoped styles once.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STYLE_ID = "pki-coord-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".pki-coord{border:2px solid var(--tp-line,#e4ebf2);border-radius:18px;background:#fff;padding:18px;box-shadow:var(--tp-shadow-sm,0 2px 6px rgba(12,27,42,.08));margin:14px 0}" +
      ".pki-coord h4{margin:0 0 4px;font-size:1.15rem}" +
      ".pki-coord .pki-c-sub{margin:0 0 12px;color:var(--tp-muted,#54677c);font-size:.95rem}" +
      ".pki-c-wrap{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}" +
      ".pki-c-svg{flex:1 1 320px;max-width:440px}" +
      ".pki-c-svg svg{width:100%;height:auto;border-radius:12px;background:#fbfdff;border:1px solid var(--tp-line,#e4ebf2);touch-action:manipulation;cursor:crosshair}" +
      ".pki-c-side{flex:1 1 180px;min-width:170px}" +
      ".pki-c-side h5{margin:0 0 8px;font-size:.95rem}" +
      ".pki-c-list{list-style:none;margin:0 0 12px;padding:0;display:grid;gap:6px}" +
      ".pki-c-list li{display:flex;justify-content:space-between;gap:8px;background:#f4f8ff;border:1px solid var(--tp-line,#e4ebf2);border-radius:10px;padding:7px 10px;font-size:.92rem}" +
      ".pki-c-list b{color:var(--tp-accent,#1763c7)}" +
      ".pki-c-empty{color:var(--tp-muted,#54677c);font-size:.9rem;margin:0 0 12px}" +
      ".pki-c-actions{display:flex;gap:8px}" +
      ".pki-c-act{flex:1;padding:.55em;border-radius:10px;border:2px solid var(--tp-line,#e4ebf2);background:#fff;color:var(--tp-ink,#172033);font-weight:700;cursor:pointer;font-size:.9rem}" +
      ".pki-c-act:active{transform:scale(.96)}";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function quadrant(x, y) {
    if (x === 0 || y === 0) return x === 0 && y === 0 ? "the Origin" : "on an axis";
    if (x > 0 && y > 0) return "Quadrant I";
    if (x < 0 && y > 0) return "Quadrant II";
    if (x < 0 && y < 0) return "Quadrant III";
    return "Quadrant IV";
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectStyle();

    var R = parseInt(el.dataset.range, 10) || 10;
    var SZ = 400,
      PAD = 24;
    var span = SZ - PAD * 2;
    var unit = span / (2 * R);
    var COLORS = ["#1763c7", "#ef6b52", "#0e9a8c", "#6d4ad6", "#f4a924", "#19a35a"];
    var points = [];

    function sx(x) {
      return PAD + (x + R) * unit;
    }
    function sy(y) {
      return PAD + (R - y) * unit;
    }

    el.innerHTML =
      "<h4>📍 Tap to Plot Your Places</h4>" +
      '<p class="pki-c-sub">Tap anywhere on the map to drop a point. It snaps to the nearest whole-number coordinates and tells you the quadrant. Tap a point again to remove it.</p>' +
      '<div class="pki-c-wrap">' +
      '<div class="pki-c-svg" data-svg></div>' +
      '<div class="pki-c-side"><h5>Plotted points</h5><div data-list></div>' +
      '<div class="pki-c-actions"><button type="button" class="pki-c-act" data-undo>↶ Undo</button><button type="button" class="pki-c-act" data-clear>✕ Clear</button></div>' +
      "</div>" +
      "</div>";

    var svgBox = el.querySelector("[data-svg]");
    var listBox = el.querySelector("[data-list]");

    function gridSvg() {
      var g = "";
      for (var i = -R; i <= R; i++) {
        var x = sx(i),
          y = sy(i);
        var major = i === 0;
        g +=
          '<line x1="' +
          x +
          '" y1="' +
          PAD +
          '" x2="' +
          x +
          '" y2="' +
          (SZ - PAD) +
          '" stroke="' +
          (major ? "#475569" : "#e2e8f0") +
          '" stroke-width="' +
          (major ? 1.6 : 1) +
          '"/>';
        g +=
          '<line x1="' +
          PAD +
          '" y1="' +
          y +
          '" x2="' +
          (SZ - PAD) +
          '" y2="' +
          y +
          '" stroke="' +
          (major ? "#475569" : "#e2e8f0") +
          '" stroke-width="' +
          (major ? 1.6 : 1) +
          '"/>';
      }
      g +=
        '<text x="' +
        (SZ - PAD + 4) +
        '" y="' +
        (sy(0) + 4) +
        '" font-size="11" fill="#475569">x</text>';
      g +=
        '<text x="' +
        (sx(0) - 8) +
        '" y="' +
        (PAD - 6) +
        '" font-size="11" fill="#475569">y</text>';
      g +=
        '<text x="' +
        (sx(R) - 4) +
        '" y="' +
        (sy(0) + 14) +
        '" font-size="9" fill="#94a3b8" text-anchor="end">' +
        R +
        "</text>";
      g +=
        '<text x="' +
        (sx(0) + 4) +
        '" y="' +
        (sy(R) + 10) +
        '" font-size="9" fill="#94a3b8">' +
        R +
        "</text>";
      return g;
    }
    function pointsSvg() {
      return points
        .map(function (p, i) {
          var c = COLORS[i % COLORS.length];
          return (
            '<g data-pt="' +
            i +
            '" style="cursor:pointer">' +
            '<circle cx="' +
            sx(p.x) +
            '" cy="' +
            sy(p.y) +
            '" r="7" fill="' +
            c +
            '" stroke="#fff" stroke-width="2"/>' +
            '<text x="' +
            (sx(p.x) + 10) +
            '" y="' +
            (sy(p.y) - 8) +
            '" font-size="11" font-weight="700" fill="' +
            c +
            '">(' +
            p.x +
            ", " +
            p.y +
            ")</text>" +
            "</g>"
          );
        })
        .join("");
    }
    function draw() {
      svgBox.innerHTML =
        '<svg viewBox="0 0 ' +
        SZ +
        " " +
        SZ +
        '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Coordinate grid, tap to plot points">' +
        gridSvg() +
        pointsSvg() +
        "</svg>";
      var svg = svgBox.querySelector("svg");
      svg.addEventListener("click", onTap);
      if (!points.length) {
        listBox.innerHTML = '<p class="pki-c-empty">No points yet — tap the map to start.</p>';
      } else {
        listBox.innerHTML =
          '<ul class="pki-c-list">' +
          points
            .map(function (p) {
              return (
                "<li><b>(" + p.x + ", " + p.y + ")</b><span>" + quadrant(p.x, p.y) + "</span></li>"
              );
            })
            .join("") +
          "</ul>";
      }
    }
    function onTap(e) {
      var ptEl = e.target.closest && e.target.closest("[data-pt]");
      if (ptEl) {
        points.splice(parseInt(ptEl.getAttribute("data-pt"), 10), 1);
        draw();
        return;
      }
      var svg = e.currentTarget;
      var r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var px = ((e.clientX - r.left) / r.width) * SZ;
      var py = ((e.clientY - r.top) / r.height) * SZ;
      var x = Math.round((px - PAD) / unit - R);
      var y = Math.round(R - (py - PAD) / unit);
      if (x < -R || x > R || y < -R || y > R) return;
      if (
        points.some(function (p) {
          return p.x === x && p.y === y;
        })
      )
        return;
      if (points.length >= 8) points.shift();
      points.push({ x: x, y: y });
      draw();
    }

    el.querySelector("[data-undo]").addEventListener("click", function () {
      points.pop();
      draw();
    });
    el.querySelector("[data-clear]").addEventListener("click", function () {
      points = [];
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
    document.querySelectorAll('.pki-manip[data-manip="coord-plot"]').forEach(init);
    setTimeout(function () {
      document.querySelectorAll('.pki-manip[data-manip="coord-plot"]').forEach(init);
    }, 900);
  });

  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["coord-plot"] = init;
  }
})();
