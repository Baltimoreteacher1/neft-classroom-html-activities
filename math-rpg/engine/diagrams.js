/* =============================================================================
 * Number Realm — SVG Diagram Renderers
 * -----------------------------------------------------------------------------
 * Turns a problem's `diagram` descriptor into an accessible inline SVG string.
 * Supported kinds: coordinate, figure, prism, numberline, dotplot, cubenet.
 * Exposes window.MRPG_DIAGRAMS.render(diagram) -> html string ("" if none).
 *
 * All SVGs use a viewBox (scale to container), role="img" with a <title>, and
 * the CSS var --accent for theming. Pure string builders, no DOM.
 * ========================================================================== */
(function () {
  "use strict";
  if (window.MRPG_DIAGRAMS) return;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function wrap(title, w, hgt, inner) {
    return (
      '<svg class="mrpg-svg" viewBox="0 0 ' + w + " " + hgt + '" role="img" ' +
      'aria-label="' + esc(title) + '" preserveAspectRatio="xMidYMid meet">' +
      "<title>" + esc(title) + "</title>" + inner + "</svg>"
    );
  }

  /* ---- coordinate plane -------------------------------------------------- */
  function coordinate(d) {
    var min = -10, max = 10, size = 260, pad = 20;
    var span = max - min;
    var scale = (size - pad * 2) / span;
    function px(x) { return pad + (x - min) * scale; }
    function py(y) { return pad + (max - y) * scale; }
    var g = "";
    // grid
    for (var i = min; i <= max; i++) {
      var op = i === 0 ? 0.9 : 0.18;
      var sw = i === 0 ? 2 : 1;
      g += '<line x1="' + px(i) + '" y1="' + pad + '" x2="' + px(i) + '" y2="' + (size - pad) +
        '" stroke="#94a3b8" stroke-opacity="' + op + '" stroke-width="' + sw + '"/>';
      g += '<line x1="' + pad + '" y1="' + py(i) + '" x2="' + (size - pad) + '" y2="' + py(i) +
        '" stroke="#94a3b8" stroke-opacity="' + op + '" stroke-width="' + sw + '"/>';
    }
    // axis ticks (labels at ±5)
    [-5, 5].forEach(function (t) {
      g += '<text x="' + px(t) + '" y="' + (py(0) + 14) + '" font-size="9" fill="#64748b" text-anchor="middle">' + t + "</text>";
      g += '<text x="' + (px(0) - 12) + '" y="' + (py(t) + 3) + '" font-size="9" fill="#64748b" text-anchor="middle">' + t + "</text>";
    });
    // connect points if a segment
    var pts = d.points || [];
    if (d.segment && pts.length === 2) {
      g += '<line x1="' + px(pts[0].x) + '" y1="' + py(pts[0].y) + '" x2="' + px(pts[1].x) +
        '" y2="' + py(pts[1].y) + '" stroke="var(--accent,#0f766e)" stroke-width="2.5" stroke-dasharray="5 4"/>';
    }
    pts.forEach(function (p) {
      g += '<circle cx="' + px(p.x) + '" cy="' + py(p.y) + '" r="5" fill="var(--accent,#0f766e)"/>';
      var lbl = p.label != null ? p.label : "(" + p.x + ", " + p.y + ")";
      g += '<text x="' + (px(p.x) + 8) + '" y="' + (py(p.y) - 8) + '" font-size="11" font-weight="700" fill="#0f172a">' + esc(lbl) + "</text>";
    });
    return wrap(d.title || "Coordinate plane", size, size, g);
  }

  /* ---- 2D figures (area) ------------------------------------------------- */
  function figure(d) {
    var W = 260, H = 190, cx = 130, cy = 110;
    var acc = "var(--accent,#0f766e)";
    var fill = 'fill="var(--accent,#0f766e)" fill-opacity="0.15"';
    var stroke = 'stroke="' + acc + '" stroke-width="2.5"';
    var g = "";
    var b = d.base, ht = d.height, b2 = d.b2;
    // scale drawing to fit
    var maxDim = Math.max(b || 6, ht || 6, b2 || 0);
    var u = 120 / maxDim; // px per unit
    function lbl(x, y, t) { return '<text x="' + x + '" y="' + y + '" font-size="12" font-weight="700" fill="#0f172a" text-anchor="middle">' + esc(t) + "</text>"; }
    if (d.shape === "parallelogram") {
      var bw = b * u, hh = ht * u, sk = hh * 0.4;
      var x0 = cx - bw / 2 - sk / 2, y0 = cy + hh / 2;
      g += '<polygon points="' + x0 + "," + y0 + " " + (x0 + bw) + "," + y0 + " " +
        (x0 + bw + sk) + "," + (y0 - hh) + " " + (x0 + sk) + "," + (y0 - hh) + '" ' + fill + " " + stroke + "/>";
      // height (dashed)
      g += '<line x1="' + (x0 + sk) + '" y1="' + (y0 - hh) + '" x2="' + (x0 + sk) + '" y2="' + y0 + '" stroke="#be123c" stroke-width="1.5" stroke-dasharray="4 3"/>';
      g += lbl(x0 + bw / 2, y0 + 18, "b = " + b);
      g += lbl(x0 + sk - 18, y0 - hh / 2, "h = " + ht);
    } else if (d.shape === "triangle") {
      var bw2 = b * u, hh2 = ht * u;
      var x1 = cx - bw2 / 2, y1 = cy + hh2 / 2;
      var apexX = cx - bw2 / 6;
      g += '<polygon points="' + x1 + "," + y1 + " " + (x1 + bw2) + "," + y1 + " " + apexX + "," + (y1 - hh2) + '" ' + fill + " " + stroke + "/>";
      g += '<line x1="' + apexX + '" y1="' + (y1 - hh2) + '" x2="' + apexX + '" y2="' + y1 + '" stroke="#be123c" stroke-width="1.5" stroke-dasharray="4 3"/>';
      g += lbl(cx, y1 + 18, "b = " + b);
      g += lbl(apexX - 16, y1 - hh2 / 2, "h = " + ht);
    } else if (d.shape === "trapezoid") {
      var bb = b * u, tb = b2 * u, hh3 = ht * u;
      var y2 = cy + hh3 / 2;
      var xbl = cx - bb / 2, xtl = cx - tb / 2;
      g += '<polygon points="' + xbl + "," + y2 + " " + (xbl + bb) + "," + y2 + " " +
        (xtl + tb) + "," + (y2 - hh3) + " " + xtl + "," + (y2 - hh3) + '" ' + fill + " " + stroke + "/>";
      g += '<line x1="' + cx + '" y1="' + (y2 - hh3) + '" x2="' + cx + '" y2="' + y2 + '" stroke="#be123c" stroke-width="1.5" stroke-dasharray="4 3"/>';
      g += lbl(cx, y2 + 18, "b₁ = " + b);
      g += lbl(cx, y2 - hh3 - 6, "b₂ = " + b2);
      g += lbl(cx + 22, y2 - hh3 / 2, "h = " + ht);
    } else if (d.shape === "lshape") {
      // L: big rectangle w×h with a small s×s square attached at top-right
      var rw = d.w * u, rh = d.h * u, s = d.s * u;
      var x = cx - (rw) / 2, y = cy + rh / 2;
      g += '<polygon points="' +
        x + "," + y + " " + (x + rw) + "," + y + " " +
        (x + rw) + "," + (y - rh) + " " + (x + rw + s) + "," + (y - rh) + " " +
        (x + rw + s) + "," + (y - rh - s) + " " + x + "," + (y - rh - s) +
        '" ' + fill + " " + stroke + "/>";
      g += lbl(x + rw / 2, y + 18, d.w + " × " + d.h);
      g += lbl(x + rw + s / 2, y - rh - s - 6, d.s + "×" + d.s);
    }
    return wrap(d.title || "Figure", W, H, g);
  }

  /* ---- rectangular prism (volume / surface area) ------------------------- */
  function prism(d) {
    var W = 260, H = 200;
    var acc = "var(--accent,#0f766e)";
    var l = d.l, w = d.w, ht = d.h;
    var maxDim = Math.max(l, w, ht);
    var u = 90 / maxDim;
    var lw = l * u, hh = ht * u, dw = w * u * 0.5;
    var x = 70, y = 150;
    var stroke = 'stroke="' + acc + '" stroke-width="2"';
    var faceF = 'fill="var(--accent,#0f766e)" fill-opacity="0.15"';
    var faceT = 'fill="var(--accent,#0f766e)" fill-opacity="0.30"';
    var faceR = 'fill="var(--accent,#0f766e)" fill-opacity="0.22"';
    var g = "";
    // front face
    g += '<rect x="' + x + '" y="' + (y - hh) + '" width="' + lw + '" height="' + hh + '" ' + faceF + " " + stroke + "/>";
    // top face
    g += '<polygon points="' + x + "," + (y - hh) + " " + (x + dw) + "," + (y - hh - dw) + " " +
      (x + lw + dw) + "," + (y - hh - dw) + " " + (x + lw) + "," + (y - hh) + '" ' + faceT + " " + stroke + "/>";
    // right face
    g += '<polygon points="' + (x + lw) + "," + (y - hh) + " " + (x + lw + dw) + "," + (y - hh - dw) + " " +
      (x + lw + dw) + "," + (y - dw) + " " + (x + lw) + "," + y + '" ' + faceR + " " + stroke + "/>";
    // bottom-front edge
    g += '<line x1="' + x + '" y1="' + y + '" x2="' + (x + lw) + '" y2="' + y + '" ' + stroke + "/>";
    g += '<line x1="' + x + '" y1="' + (y - hh) + '" x2="' + x + '" y2="' + y + '" ' + stroke + "/>";
    function lbl(px, py, t) { return '<text x="' + px + '" y="' + py + '" font-size="12" font-weight="700" fill="#0f172a" text-anchor="middle">' + esc(t) + "</text>"; }
    g += lbl(x + lw / 2, y + 18, "l = " + l);
    g += lbl(x + lw + dw + 20, y - hh / 2, "h = " + ht);
    g += lbl(x + lw + dw / 2 + 6, y - hh - dw - 6, "w = " + w);
    return wrap(d.title || "Rectangular prism", W, H, g);
  }

  /* ---- cube net ---------------------------------------------------------- */
  function cubenet(d) {
    var W = 240, H = 200, s = 44;
    var acc = "var(--accent,#0f766e)";
    var face = 'fill="var(--accent,#0f766e)" fill-opacity="0.15" stroke="' + acc + '" stroke-width="2"';
    // cross layout
    var cells = [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]];
    var ox = 40, oy = 20;
    var g = "";
    cells.forEach(function (c) {
      g += '<rect x="' + (ox + c[0] * s) + '" y="' + (oy + c[1] * s) + '" width="' + s + '" height="' + s + '" ' + face + "/>";
    });
    g += '<text x="' + (ox + 1.5 * s) + '" y="' + (oy + 1.6 * s) + '" font-size="12" font-weight="700" fill="#0f172a" text-anchor="middle">edge = ' + esc(d.s) + "</text>";
    return wrap(d.title || "Cube net (6 equal faces)", W, H, g);
  }

  /* ---- number line ------------------------------------------------------- */
  function numberline(d) {
    var W = 300, H = 80, pad = 20;
    var min = d.min, max = d.max;
    var span = max - min || 1;
    var scale = (W - pad * 2) / span;
    var y = 44;
    function px(v) { return pad + (v - min) * scale; }
    var g = '<line x1="' + pad + '" y1="' + y + '" x2="' + (W - pad) + '" y2="' + y + '" stroke="#475569" stroke-width="2"/>';
    // ticks
    for (var v = min; v <= max; v++) {
      var big = v === 0;
      g += '<line x1="' + px(v) + '" y1="' + (y - (big ? 8 : 5)) + '" x2="' + px(v) + '" y2="' + (y + (big ? 8 : 5)) +
        '" stroke="#475569" stroke-width="' + (big ? 2 : 1) + '"/>';
      if (v % 2 === 0 || big) {
        g += '<text x="' + px(v) + '" y="' + (y + 22) + '" font-size="9" fill="#64748b" text-anchor="middle">' + v + "</text>";
      }
    }
    (d.marks || []).forEach(function (m) {
      g += '<circle cx="' + px(m.v) + '" cy="' + y + '" r="6" fill="var(--accent,#0f766e)"/>';
      if (m.label != null) {
        g += '<text x="' + px(m.v) + '" y="' + (y - 12) + '" font-size="11" font-weight="700" fill="#0f172a" text-anchor="middle">' + esc(m.label) + "</text>";
      }
    });
    return wrap(d.title || "Number line", W, H, g);
  }

  /* ---- dot plot (statistics) -------------------------------------------- */
  function dotplot(d) {
    var vals = (d.values || []).slice();
    var min = Math.min.apply(null, vals);
    var max = Math.max.apply(null, vals);
    min = Math.min(min, min); // keep
    var W = 300, pad = 24;
    var span = (max - min) || 1;
    var scale = (W - pad * 2) / span;
    // count stacks
    var counts = {};
    var maxStack = 1;
    vals.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; maxStack = Math.max(maxStack, counts[v]); });
    var dot = 12;
    var baseY = 30 + maxStack * dot;
    var H = baseY + 30;
    function px(v) { return pad + (v - min) * scale; }
    var g = '<line x1="' + (pad - 8) + '" y1="' + baseY + '" x2="' + (W - pad + 8) + '" y2="' + baseY + '" stroke="#475569" stroke-width="2"/>';
    for (var v = min; v <= max; v++) {
      g += '<text x="' + px(v) + '" y="' + (baseY + 18) + '" font-size="9" fill="#64748b" text-anchor="middle">' + v + "</text>";
      g += '<line x1="' + px(v) + '" y1="' + baseY + '" x2="' + px(v) + '" y2="' + (baseY + 4) + '" stroke="#475569"/>';
    }
    var placed = {};
    vals.forEach(function (val) {
      placed[val] = (placed[val] || 0);
      var cy = baseY - dot / 2 - placed[val] * dot;
      g += '<circle cx="' + px(val) + '" cy="' + cy + '" r="' + (dot / 2 - 1) + '" fill="var(--accent,#0f766e)" fill-opacity="0.85"/>';
      placed[val]++;
    });
    return wrap(d.title || "Dot plot", W, H, g);
  }

  var RENDERERS = {
    coordinate: coordinate,
    figure: figure,
    prism: prism,
    cubenet: cubenet,
    numberline: numberline,
    dotplot: dotplot,
  };

  function render(diagram) {
    if (!diagram || !diagram.kind || !RENDERERS[diagram.kind]) return "";
    try {
      return RENDERERS[diagram.kind](diagram);
    } catch (e) {
      return "";
    }
  }

  window.MRPG_DIAGRAMS = { render: render };
})();
