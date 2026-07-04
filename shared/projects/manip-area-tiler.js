/* ==========================================================================
   Neft Teacher — Area Tiler manipulative (self-contained)
   Drop a container on the page:
     <div class="pki-manip" data-manip="area-tiler" data-unit="ft"
          data-theme="room"></div>
   Students tap − / + to set a rectangle's WIDTH and HEIGHT; the rectangle is
   drawn filled with that many unit squares on a grid and the count shows
   "width × height = area square units". A checkbox adds a SECOND rectangle
   (composite L-shape) and the total area is shown as a sum.
   Tapping the grid is optional (sets the active rectangle's size); the
   steppers are the required interaction.
   No dependencies. Injects its own scoped styles once.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STYLE_ID = "pki-area-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".pki-area{border:2px solid var(--tp-line,#e4ebf2);border-radius:18px;background:#fff;padding:18px;box-shadow:var(--tp-shadow-sm,0 2px 6px rgba(12,27,42,.08));margin:14px 0}" +
      ".pki-area h4{margin:0 0 4px;font-size:1.15rem;color:var(--tp-ink,#172033)}" +
      ".pki-area .pki-a-sub{margin:0 0 14px;color:var(--tp-muted,#54677c);font-size:.95rem}" +
      ".pki-a-wrap{display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start}" +
      ".pki-a-svg{flex:1 1 320px;max-width:460px}" +
      ".pki-a-svg svg{width:100%;height:auto;border-radius:12px;background:#fbfdff;border:1px solid var(--tp-line,#e4ebf2);touch-action:manipulation;cursor:crosshair}" +
      ".pki-a-side{flex:1 1 200px;min-width:190px}" +
      ".pki-a-row{margin-bottom:12px}" +
      ".pki-a-row > label{display:block;font-size:.78rem;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:var(--tp-muted,#54677c);margin-bottom:5px}" +
      ".pki-a-stepwrap{display:flex;align-items:center;gap:8px}" +
      ".pki-a-stepwrap input{width:64px;text-align:center;font-size:1.15rem;font-weight:800;padding:.4em;border:2px solid var(--tp-line,#e4ebf2);border-radius:12px}" +
      ".pki-a-btn{width:40px;height:40px;border-radius:12px;border:2px solid var(--tp-line,#e4ebf2);background:#fff;color:var(--tp-accent,#1763c7);font-size:1.5rem;font-weight:800;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center}" +
      ".pki-a-btn:active{transform:scale(.9)}" +
      ".pki-a-toggle{display:flex;align-items:center;gap:8px;font-size:.92rem;font-weight:700;color:var(--tp-ink,#172033);margin:4px 0 12px;cursor:pointer}" +
      ".pki-a-toggle input{width:18px;height:18px;cursor:pointer;accent-color:var(--tp-accent2,#0e9a8c)}" +
      ".pki-a-r2{border-top:1px dashed var(--tp-line,#e4ebf2);padding-top:12px}" +
      ".pki-a-r2[hidden]{display:none}" +
      ".pki-a-eq{border-radius:12px;padding:12px 14px;font-weight:800;font-size:1.02rem;background:#f4f8ff;border:1px solid var(--tp-line,#e4ebf2);color:var(--tp-ink,#172033)}" +
      ".pki-a-eq .pki-a-big{display:block;font-size:1.25rem;margin-top:4px;color:var(--tp-accent,#1763c7)}" +
      ".pki-a-key{font-size:.8rem;font-weight:700;display:flex;align-items:center;gap:6px;margin-top:8px;color:var(--tp-muted,#54677c)}" +
      ".pki-a-key i{width:14px;height:14px;border-radius:3px;display:inline-block}";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  var THEMES = {
    room: {
      title: "🏠 Floor Area Tiler",
      sub: "Set the WIDTH and HEIGHT of your room with the − / + buttons. Each square is one tile. The room fills with that many tiles, and the count shows width × height = area. Add a closet to make an L-shaped floor and the total area adds up.",
      r1: "Room floor",
      r2: "Closet / nook",
      add: "Add a closet (L-shaped floor)",
    },
    garden: {
      title: "🌱 Garden Plot Tiler",
      sub: "Set the WIDTH and HEIGHT of your plot with the − / + buttons. Each square is one unit of ground. The plot fills with that many squares, and the count shows width × height = area. Add a second bed to make an L-shaped garden and the total area adds up.",
      r1: "Garden plot",
      r2: "Extra bed",
      add: "Add a second bed (L-shaped garden)",
    },
  };

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectStyle();
    el.classList.add("pki-area");

    var theme = THEMES[el.dataset.theme] || THEMES.room;
    var unit = el.dataset.unit || "ft";
    var unitName = unit === "ft" ? "square feet" : "square units";
    var accent =
      el.dataset.accent || getComputedStyle(el).getPropertyValue("--tp-accent").trim() || "#1763c7";
    var accent2 =
      el.dataset.accent2 ||
      getComputedStyle(el).getPropertyValue("--tp-accent2").trim() ||
      "#0e9a8c";

    var GW = 12,
      GH = 10; // grid: up to 12 wide × 10 tall unit squares
    var SZ_W = 480,
      SZ_H = 400,
      PAD = 22;
    var cell = Math.min((SZ_W - PAD * 2) / GW, (SZ_H - PAD * 2) / GH);
    var ox = PAD,
      oy = PAD;

    var w1 = 5,
      h1 = 4,
      w2 = 3,
      h2 = 3;
    var composite = false;
    var active = 1;

    el.innerHTML =
      "<h4>" +
      theme.title +
      "</h4>" +
      '<p class="pki-a-sub">' +
      theme.sub +
      "</p>" +
      '<div class="pki-a-wrap">' +
      '<div class="pki-a-svg" data-svg></div>' +
      '<div class="pki-a-side">' +
      stepRow("Width (" + unit + ")", "w1") +
      stepRow("Height (" + unit + ")", "h1") +
      '<label class="pki-a-toggle"><input type="checkbox" data-toggle>' +
      theme.add +
      "</label>" +
      '<div class="pki-a-r2" data-r2 hidden>' +
      stepRow("2nd width (" + unit + ")", "w2") +
      stepRow("2nd height (" + unit + ")", "h2") +
      "</div>" +
      '<div class="pki-a-eq" data-eq></div>' +
      '<div class="pki-a-key"><i style="background:' +
      accent +
      '"></i>' +
      theme.r1 +
      '<i style="background:' +
      accent2 +
      ';margin-left:10px"></i><span data-r2key>' +
      theme.r2 +
      "</span></div>" +
      "</div></div>";

    function stepRow(label, key) {
      return (
        '<div class="pki-a-row"><label>' +
        label +
        "</label>" +
        '<div class="pki-a-stepwrap">' +
        '<button type="button" class="pki-a-btn" data-dec="' +
        key +
        '" aria-label="decrease ' +
        label +
        '">−</button>' +
        '<input type="text" inputmode="numeric" data-val="' +
        key +
        '" aria-label="' +
        label +
        '">' +
        '<button type="button" class="pki-a-btn" data-inc="' +
        key +
        '" aria-label="increase ' +
        label +
        '">+</button>' +
        "</div></div>"
      );
    }

    var svgBox = el.querySelector("[data-svg]");
    var eqBox = el.querySelector("[data-eq]");
    var r2Box = el.querySelector("[data-r2]");
    var r2Key = el.querySelector("[data-r2key]");
    var toggle = el.querySelector("[data-toggle]");

    function cx(c) {
      return ox + c * cell;
    }
    function cy(r) {
      return oy + r * cell;
    }

    function clampAll() {
      w1 = Math.max(1, Math.min(GW, w1 | 0));
      w2 = Math.max(1, Math.min(GW, w2 | 0));
      h2 = Math.max(1, Math.min(GH, h2 | 0));
      // rect1 + rect2 (stacked below) must fit within GH rows
      var maxH1 = composite ? GH - h2 : GH;
      h1 = Math.max(1, Math.min(maxH1, h1 | 0));
    }

    function gridSvg() {
      var g = '<g stroke="#e2e8f0" stroke-width="1">';
      for (var c = 0; c <= GW; c++)
        g += '<line x1="' + cx(c) + '" y1="' + cy(0) + '" x2="' + cx(c) + '" y2="' + cy(GH) + '"/>';
      for (var r = 0; r <= GH; r++)
        g += '<line x1="' + cx(0) + '" y1="' + cy(r) + '" x2="' + cx(GW) + '" y2="' + cy(r) + '"/>';
      return g + "</g>";
    }

    function tiles(col0, row0, w, h, fill) {
      var g = "";
      for (var r = 0; r < h; r++)
        for (var c = 0; c < w; c++)
          g +=
            '<rect x="' +
            (cx(col0 + c) + 1.5) +
            '" y="' +
            (cy(row0 + r) + 1.5) +
            '" width="' +
            (cell - 3) +
            '" height="' +
            (cell - 3) +
            '" rx="2" fill="' +
            fill +
            '" fill-opacity="0.78"/>';
      // outline
      g +=
        '<rect x="' +
        cx(col0) +
        '" y="' +
        cy(row0) +
        '" width="' +
        w * cell +
        '" height="' +
        h * cell +
        '" fill="none" stroke="' +
        fill +
        '" stroke-width="2.5"/>';
      return g;
    }

    function hexToRgba(hex, a) {
      var m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
      if (!m) return hex;
      var n = parseInt(m[1], 16);
      return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
    }

    function draw() {
      clampAll();
      el.querySelector('[data-val="w1"]').value = w1;
      el.querySelector('[data-val="h1"]').value = h1;
      el.querySelector('[data-val="w2"]').value = w2;
      el.querySelector('[data-val="h2"]').value = h2;

      var body = gridSvg() + tiles(0, 0, w1, h1, accent);
      if (composite) body += tiles(0, h1, w2, h2, accent2);

      svgBox.innerHTML =
        '<svg viewBox="0 0 ' +
        SZ_W +
        " " +
        SZ_H +
        '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
        theme.r1 +
        ' area grid">' +
        body +
        "</svg>";
      var svg = svgBox.querySelector("svg");
      svg.addEventListener("click", onTap);

      var a1 = w1 * h1;
      if (!composite) {
        eqBox.innerHTML =
          w1 + " × " + h1 + " = " + '<span class="pki-a-big">' + a1 + " " + unitName + "</span>";
      } else {
        var a2 = w2 * h2;
        eqBox.innerHTML =
          "(" +
          w1 +
          " × " +
          h1 +
          ") + (" +
          w2 +
          " × " +
          h2 +
          ")<br>= " +
          a1 +
          " + " +
          a2 +
          '<span class="pki-a-big">= ' +
          (a1 + a2) +
          " " +
          unitName +
          "</span>";
      }
    }

    function onTap(e) {
      var svg = e.currentTarget;
      var rct = svg.getBoundingClientRect();
      if (!rct.width || !rct.height) return; // guard 0-size
      var px = ((e.clientX - rct.left) / rct.width) * SZ_W;
      var py = ((e.clientY - rct.top) / rct.height) * SZ_H;
      var col = Math.ceil((px - ox) / cell);
      var row = Math.ceil((py - oy) / cell);
      if (col < 1 || col > GW || row < 1 || row > GH) return;
      // Tapping inside rect2's band (below rect1) sets rect2; else rect1.
      if (composite && row > h1) {
        w2 = col;
        h2 = row - h1;
      } else {
        w1 = col;
        h1 = row;
      }
      draw();
    }

    el.addEventListener("click", function (e) {
      var inc = e.target.getAttribute && e.target.getAttribute("data-inc");
      var dec = e.target.getAttribute && e.target.getAttribute("data-dec");
      var key = inc || dec;
      if (!key) return;
      var d = inc ? 1 : -1;
      if (key === "w1") w1 += d;
      else if (key === "h1") h1 += d;
      else if (key === "w2") w2 += d;
      else if (key === "h2") h2 += d;
      draw();
    });
    el.addEventListener("input", function (e) {
      var key = e.target.getAttribute && e.target.getAttribute("data-val");
      if (!key) return;
      var v = parseInt(e.target.value, 10);
      if (isNaN(v)) return;
      if (key === "w1") w1 = v;
      else if (key === "h1") h1 = v;
      else if (key === "w2") w2 = v;
      else if (key === "h2") h2 = v;
      draw();
    });
    toggle.addEventListener("change", function () {
      composite = toggle.checked;
      r2Box.hidden = !composite;
      r2Key.parentNode.querySelector("i:nth-of-type(2)").style.opacity = composite ? "1" : "0.25";
      r2Key.style.opacity = composite ? "1" : "0.4";
      draw();
    });

    // init key dimming for rect2 (hidden until toggled)
    r2Key.parentNode.querySelector("i:nth-of-type(2)").style.opacity = "0.25";
    r2Key.style.opacity = "0.4";

    draw();
  }

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }
  ready(function () {
    document.querySelectorAll('.pki-manip[data-manip="area-tiler"]').forEach(init);
    setTimeout(function () {
      document.querySelectorAll('.pki-manip[data-manip="area-tiler"]').forEach(init);
    }, 900);
  });
})();
