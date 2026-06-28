/* ==========================================================================
   Neft Teacher — "Cube Builder" volume manipulative (self-contained)
   Drop a container on the page:
     <div class="pki-manip" data-manip="cube-builder"
          data-unit="in" data-mode="box"></div>          (box: V & full SA)
     <div class="pki-manip" data-manip="cube-builder"
          data-unit="in" data-mode="tank"></div>          (tank: + water + open-top SA)
   − / + steppers set Length, Width, Height (1–10). An isometric rectangular
   prism is drawn from unit cubes (top + two side faces, gridded). Live math
   shows L × W × H = volume cubic units. In "tank" mode a Fill stepper (≤ H)
   shows the water volume and the OPEN-TOP surface area (5 faces, lw + 2lh + 2wh).
   No dependencies. Injects its own scoped styles once. Guards 0-size.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STYLE_ID = "pki-cube-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".pki-cube{border:2px solid var(--tp-line,#e4ebf2);border-radius:18px;background:#fff;padding:18px;box-shadow:var(--tp-shadow-sm,0 2px 6px rgba(12,27,42,.08));margin:14px 0}" +
      ".pki-cube h4{margin:0 0 4px;font-size:1.15rem}" +
      ".pki-cube .pki-cb-sub{margin:0 0 14px;color:var(--tp-muted,#54677c);font-size:.95rem}" +
      ".pki-cb-wrap{display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start}" +
      ".pki-cb-svg{flex:1 1 280px;max-width:420px;min-width:240px}" +
      ".pki-cb-svg svg{width:100%;height:auto;border-radius:12px;background:#fbfdff;border:1px solid var(--tp-line,#e4ebf2)}" +
      ".pki-cb-side{flex:1 1 220px;min-width:200px}" +
      ".pki-cb-row{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:14px}" +
      ".pki-cb-field{flex:1 1 92px}" +
      ".pki-cb-field label{display:block;font-size:.74rem;font-weight:800;letter-spacing:.03em;color:var(--tp-muted,#54677c);margin-bottom:5px;text-transform:uppercase}" +
      ".pki-cb-stepwrap{display:flex;align-items:center;gap:6px}" +
      ".pki-cb-stepwrap input{width:52px;text-align:center;font-size:1.1rem;font-weight:800;padding:.4em;border:2px solid var(--tp-line,#e4ebf2);border-radius:10px}" +
      ".pki-cb-btn{width:38px;height:38px;border-radius:10px;border:2px solid var(--tp-line,#e4ebf2);background:#fff;color:var(--tp-accent,#1763c7);font-size:1.4rem;font-weight:800;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center}" +
      ".pki-cb-btn:active{transform:scale(.9)}" +
      ".pki-cb-btn[disabled]{opacity:.35;cursor:not-allowed}" +
      ".pki-cb-eq{border-radius:12px;padding:12px 14px;font-size:1.02rem;font-weight:700;margin-bottom:10px;background:linear-gradient(135deg,var(--tp-accent,#1763c7),var(--tp-accent2,#0e9a8c));color:#fff;box-shadow:0 8px 20px -10px rgba(12,27,42,.4)}" +
      ".pki-cb-eq b{font-size:1.18rem}" +
      ".pki-cb-note{border-radius:12px;padding:10px 13px;font-size:.92rem;font-weight:600;margin-bottom:8px;background:#f4f8ff;border:1px solid var(--tp-line,#e4ebf2);color:var(--tp-ink,#172033)}" +
      ".pki-cb-note.water{background:#eef6ff;border-color:#bcdcff;color:#0b4a8a}" +
      ".pki-cb-note.glass{background:#eafaf0;border-color:#b6e6c8;color:#0f7a40}";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  var UNIT_WORD = { in: "inches", ft: "feet", cm: "centimeters", u: "units" };

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectStyle();

    var unit = (el.dataset.unit || "in").toLowerCase();
    var word = UNIT_WORD[unit] || "units";
    var isTank = (el.dataset.mode || "box").toLowerCase() === "tank";
    var MAX = 10;

    var L = 4,
      W = 3,
      H = 3,
      fill = 2;

    el.innerHTML =
      "<h4>🧊 Cube Builder" +
      (isTank ? " — Aquarium" : "") +
      "</h4>" +
      '<p class="pki-cb-sub">Tap − / + to set the ' +
      (isTank ? "tank" : "box") +
      " dimensions. The prism is built from unit cubes so you can SEE the volume. " +
      (isTank
        ? "Set a fill height to see the <b>water volume</b>, and remember an aquarium is <b>open-top</b> (only 5 glass faces)."
        : "Volume = how many unit cubes fit inside.") +
      "</p>" +
      '<div class="pki-cb-wrap">' +
      '<div class="pki-cb-svg" data-svg></div>' +
      '<div class="pki-cb-side">' +
      '<div class="pki-cb-row">' +
      field("l", "Length", L) +
      field("w", "Width", W) +
      field("h", "Height", H) +
      (isTank ? '</div><div class="pki-cb-row">' + field("f", "Fill ≤ H", fill) : "") +
      "</div>" +
      "<div data-out></div>" +
      "</div>" +
      "</div>";

    function field(key, label, val) {
      return (
        '<div class="pki-cb-field"><label>' +
        label +
        "</label>" +
        '<div class="pki-cb-stepwrap">' +
        '<button type="button" class="pki-cb-btn" data-dec="' +
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
        '<button type="button" class="pki-cb-btn" data-inc="' +
        key +
        '" aria-label="increase ' +
        label +
        '">+</button>' +
        "</div></div>"
      );
    }

    var svgBox = el.querySelector("[data-svg]");
    var outBox = el.querySelector("[data-out]");

    function clamp() {
      L = Math.max(1, Math.min(MAX, L | 0));
      W = Math.max(1, Math.min(MAX, W | 0));
      H = Math.max(1, Math.min(MAX, H | 0));
      fill = Math.max(0, Math.min(H, fill | 0));
    }

    // isometric projection: x=length, y=width(depth), z=height
    var S = 24; // unit-cube edge in px
    var KX = 0.866,
      KY = 0.5;
    function proj(x, y, z) {
      return { x: (x - y) * KX * S, y: (x + y) * KY * S - z * S };
    }
    function pts(arr) {
      return arr
        .map(function (p) {
          return p.x.toFixed(1) + "," + p.y.toFixed(1);
        })
        .join(" ");
    }

    function draw() {
      // bounds from the 8 corners
      var corners = [];
      [0, L].forEach(function (x) {
        [0, W].forEach(function (y) {
          [0, H].forEach(function (z) {
            corners.push(proj(x, y, z));
          });
        });
      });
      var minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      corners.forEach(function (c) {
        if (c.x < minX) minX = c.x;
        if (c.x > maxX) maxX = c.x;
        if (c.y < minY) minY = c.y;
        if (c.y > maxY) maxY = c.y;
      });
      var pad = 14;
      var ox = -minX + pad,
        oy = -minY + pad;
      var vbW = maxX - minX + pad * 2;
      var vbH = maxY - minY + pad * 2;
      if (!(vbW > 0) || !(vbH > 0)) return; // guard 0-size

      function P(x, y, z) {
        var p = proj(x, y, z);
        return { x: p.x + ox, y: p.y + oy };
      }
      function poly(corn, fillCol, strokeCol, sw, op) {
        return (
          '<polygon points="' +
          pts(corn) +
          '" fill="' +
          fillCol +
          '" stroke="' +
          (strokeCol || "none") +
          '" stroke-width="' +
          (sw || 0) +
          '"' +
          (op != null ? ' fill-opacity="' + op + '"' : "") +
          "/>"
        );
      }
      function line(a, b, col, sw) {
        return (
          '<line x1="' +
          a.x.toFixed(1) +
          '" y1="' +
          a.y.toFixed(1) +
          '" x2="' +
          b.x.toFixed(1) +
          '" y2="' +
          b.y.toFixed(1) +
          '" stroke="' +
          col +
          '" stroke-width="' +
          sw +
          '"/>'
        );
      }

      var ACCENT = "var(--tp-accent,#1763c7)";
      var GRID = "rgba(255,255,255,.55)";
      var EDGE = "#28435f";
      var svg = "";

      // ---- LEFT face (x = 0): W × H, darkest ----
      svg += poly([P(0, 0, 0), P(0, W, 0), P(0, W, H), P(0, 0, H)], "#9fb7d4");
      for (var yi = 1; yi < W; yi++) svg += line(P(0, yi, 0), P(0, yi, H), GRID, 1);
      for (var zi = 1; zi < H; zi++) svg += line(P(0, 0, zi), P(0, W, zi), GRID, 1);

      // ---- RIGHT face (y = 0): L × H, medium ----
      svg += poly([P(0, 0, 0), P(L, 0, 0), P(L, 0, H), P(0, 0, H)], "#c2d4ea");
      for (var xi = 1; xi < L; xi++) svg += line(P(xi, 0, 0), P(xi, 0, H), GRID, 1);
      for (var zj = 1; zj < H; zj++) svg += line(P(0, 0, zj), P(L, 0, zj), GRID, 1);

      // ---- WATER (tank mode) — translucent fill on the two side faces + surface ----
      if (isTank && fill > 0) {
        svg += poly(
          [P(0, 0, 0), P(0, W, 0), P(0, W, fill), P(0, 0, fill)],
          "#2f7fd6",
          null,
          0,
          0.5,
        );
        svg += poly(
          [P(0, 0, 0), P(L, 0, 0), P(L, 0, fill), P(0, 0, fill)],
          "#3f93e8",
          null,
          0,
          0.5,
        );
        svg += poly(
          [P(0, 0, fill), P(L, 0, fill), P(L, W, fill), P(0, W, fill)],
          "#6fb4f5",
          "#2f7fd6",
          1.4,
          0.7,
        );
      }

      // ---- TOP face (z = H) ----
      if (isTank) {
        // open-top: rim only (dashed opening), no lid
        svg += poly([P(0, 0, H), P(L, 0, H), P(L, W, H), P(0, W, H)], "#fbfdff", EDGE, 1.6, 0.18);
      } else {
        svg += poly([P(0, 0, H), P(L, 0, H), P(L, W, H), P(0, W, H)], "#e3edf9");
        for (var xk = 1; xk < L; xk++) svg += line(P(xk, 0, H), P(xk, W, H), "#b8c9de", 1);
        for (var yk = 1; yk < W; yk++) svg += line(P(0, yk, H), P(L, yk, H), "#b8c9de", 1);
      }

      // ---- bold visible edges ----
      var edges = [
        [P(0, 0, 0), P(L, 0, 0)],
        [P(0, 0, 0), P(0, W, 0)],
        [P(0, 0, 0), P(0, 0, H)],
        [P(L, 0, 0), P(L, 0, H)],
        [P(0, W, 0), P(0, W, H)],
        [P(0, 0, H), P(L, 0, H)],
        [P(0, 0, H), P(0, W, H)],
        [P(L, 0, H), P(L, W, H)],
        [P(0, W, H), P(L, W, H)],
      ];
      edges.forEach(function (e) {
        svg += line(e[0], e[1], EDGE, 2);
      });
      // void ACCENT reference (keeps theme var resolvable if ever needed)
      void ACCENT;

      svgBox.innerHTML =
        '<svg viewBox="0 0 ' +
        vbW.toFixed(1) +
        " " +
        vbH.toFixed(1) +
        '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
        L +
        " by " +
        W +
        " by " +
        H +
        ' unit-cube rectangular prism">' +
        svg +
        "</svg>";
    }

    function render() {
      clamp();
      el.querySelector('[data-val="l"]').value = L;
      el.querySelector('[data-val="w"]').value = W;
      el.querySelector('[data-val="h"]').value = H;
      if (isTank) el.querySelector('[data-val="f"]').value = fill;

      var fDec = el.querySelector('[data-dec="f"]');
      var fInc = el.querySelector('[data-inc="f"]');
      if (fDec) fDec.disabled = fill <= 0;
      if (fInc) fInc.disabled = fill >= H;

      var V = L * W * H;
      var html =
        '<div class="pki-cb-eq">' +
        "L × W × H = " +
        L +
        " × " +
        W +
        " × " +
        H +
        " = <b>" +
        V +
        "</b> cubic " +
        word +
        "</div>";

      if (isTank) {
        var Vw = L * W * fill;
        var openSA = L * W + 2 * L * H + 2 * W * H; // lw + 2lh + 2wh (5 faces)
        html +=
          '<div class="pki-cb-note water">💧 Water volume = L × W × fill = ' +
          L +
          " × " +
          W +
          " × " +
          fill +
          " = <b>" +
          Vw +
          "</b> cubic " +
          word +
          (fill === 0 ? " (empty tank)" : " — that's " + Math.round((Vw / V) * 100) + "% full") +
          "</div>" +
          '<div class="pki-cb-note glass">🔷 Open-top glass (5 faces) = lw + 2lh + 2wh = ' +
          L * W +
          " + " +
          2 * L * H +
          " + " +
          2 * W * H +
          " = <b>" +
          openSA +
          "</b> square " +
          word +
          " (no lid!)</div>";
      } else {
        var SA = 2 * (L * W + L * H + W * H);
        html +=
          '<div class="pki-cb-note">🔷 Closed-box surface area = 2(lw + lh + wh) = 2(' +
          L * W +
          " + " +
          L * H +
          " + " +
          W * H +
          ") = <b>" +
          SA +
          "</b> square " +
          word +
          "</div>";
      }
      outBox.innerHTML = html;
      draw();
    }

    el.addEventListener("click", function (e) {
      var t = e.target;
      if (!t.getAttribute) return;
      var inc = t.getAttribute("data-inc");
      var dec = t.getAttribute("data-dec");
      var key = inc || dec;
      if (!key) return;
      var d = inc ? 1 : -1;
      if (key === "l") L += d;
      else if (key === "w") W += d;
      else if (key === "h") H += d;
      else if (key === "f") fill += d;
      render();
    });
    el.addEventListener("input", function (e) {
      var t = e.target;
      if (!t.getAttribute) return;
      var key = t.getAttribute("data-val");
      if (!key) return;
      var v = parseInt(t.value, 10);
      if (isNaN(v)) return;
      if (key === "l") L = v;
      else if (key === "w") W = v;
      else if (key === "h") H = v;
      else if (key === "f") fill = v;
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
    document.querySelectorAll('.pki-manip[data-manip="cube-builder"]').forEach(init);
    setTimeout(function () {
      document.querySelectorAll('.pki-manip[data-manip="cube-builder"]').forEach(init);
    }, 900);
  });
})();
