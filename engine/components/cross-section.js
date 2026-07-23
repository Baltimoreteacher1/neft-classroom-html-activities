// cross-section.js — Interactive "slice a solid" explorer. Drag a horizontal
// plane up and down through a solid and see the 2D cross-section it makes, drawn
// to scale with its dimensions. Contrasts the big idea that a PRISM has the same
// cross-section at every height (so V = base area × height) while a PYRAMID's
// cross-section shrinks and stays a similar shape. Pure SVG, no dependencies.
//
// Rendering: a shaded cabinet-oblique projection (top/front/side in three tones
// for depth) with a bright, clearly-readable slice plane. The whole solid is
// auto-centered and scaled to fit, so any dimensions render cleanly.
//
// Public API:
//   renderCrossSection(container, { shape, w, d, h }) -> { destroy }
//     shape: "rectangular-prism" | "triangular-prism" | "square-pyramid"
//     w,d,h: base width, base depth, height (grid units)

const C = {
  navy: "#12355b",
  top: "#4fc3bf", // lightest face (top)
  front: "#1fa6a2", // medium face (front)
  side: "#14807c", // darkest face (side)
  edge: "#0e5c59",
  slice: "#f2913b", // vivid slice plane
  sliceEdge: "#c9600f",
  sliceFill: "rgba(242,145,59,0.55)",
  xfill: "rgba(31,166,162,0.30)",
  line: "#cfe0f0",
  ink: "#1a2b3c",
  muted: "#54677c",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

export function renderCrossSection(
  container,
  { shape = "rectangular-prism", w = 4, d = 3, h = 5 } = {},
) {
  const isPyramid = shape === "square-pyramid";
  const isTri = shape === "triangular-prism";
  if (isPyramid) d = w; // square base

  const root = document.createElement("div");
  root.className = "xsec";
  root.style.cssText =
    "display:flex; flex-wrap:wrap; gap:20px; align-items:center; justify-content:center; max-width:600px; margin:0 auto; background:#fff; border:1px solid " +
    C.line +
    "; border-radius:16px; padding:18px; box-shadow:0 2px 10px rgba(12,27,42,.08);";

  // ── Cabinet-oblique projection helpers (x right, y up, z depth toward viewer) ──
  const OB = 0.5; // depth foreshortening
  const ANG = { x: 0.72, y: 0.46 }; // depth pushes right & up
  function project(x, y, z) {
    return { x: x + z * OB * ANG.x, y: -y - z * OB * ANG.y };
  }
  function face(v3s, fill, opacity = 1) {
    return { pts: v3s.map((p) => project(p[0], p[1], p[2])), fill, opacity };
  }

  // Build the list of faces (painter order: back → front) for the solid at
  // slice fraction t, plus the slice plane. Returns { faces, planeVerts2D }.
  function buildFaces(t) {
    const faces = [];
    const sliceY = t * h;
    const s = isPyramid ? 1 - t : 1;

    if (isPyramid) {
      const b = [
        [0, 0, 0],
        [w, 0, 0],
        [w, 0, d],
        [0, 0, d],
      ];
      const apex = [w / 2, h, d / 2];
      faces.push(face([b[3], b[2], apex], C.side, 1)); // back-right
      faces.push(face([b[0], b[3], apex], C.side, 1)); // left
      faces.push(face(b, C.top, 1)); // base (top-ish)
      faces.push(face([b[1], b[2], apex], C.front, 1)); // front-right
      faces.push(face([b[0], b[1], apex], C.front, 1)); // front-left
    } else if (isTri) {
      // Triangular prism standing on its triangular base (constant triangle).
      const front = [
        [0, 0, d],
        [w, 0, d],
        [w / 2, h, d],
      ];
      const back = [
        [0, 0, 0],
        [w, 0, 0],
        [w / 2, h, 0],
      ];
      faces.push(face(back, C.side, 1));
      faces.push(face([front[0], back[0], back[2], front[2]], C.side, 1)); // left slope
      faces.push(face([front[1], back[1], back[2], front[2]], C.top, 1)); // right slope
      faces.push(face(front, C.front, 1));
    } else {
      // Rectangular prism.
      const v = {
        A: [0, 0, 0],
        B: [w, 0, 0],
        C: [w, 0, d],
        D: [0, 0, d],
        E: [0, h, 0],
        F: [w, h, 0],
        G: [w, h, d],
        H: [0, h, d],
      };
      faces.push(face([v.D, v.C, v.G, v.H], C.side, 1)); // back
      faces.push(face([v.E, v.H, v.G, v.F], C.top, 1)); // top
      faces.push(face([v.B, v.C, v.G, v.F], C.side, 1)); // right
      faces.push(face([v.A, v.B, v.F, v.E], C.front, 1)); // front
    }

    // Slice plane at height sliceY, size scaled for pyramid.
    const sw = w * s,
      sd = d * s;
    const ox = (w - sw) / 2,
      oz = (d - sd) / 2;
    const plane = [
      [ox, sliceY, oz],
      [ox + sw, sliceY, oz],
      [ox + sw, sliceY, oz + sd],
      [ox, sliceY, oz + sd],
    ];
    const sliceFace = face(plane, C.sliceFill, 1);
    sliceFace.slice = true;

    return { faces, sliceFace };
  }

  // Render the solid SVG, auto-centering/scaling all geometry to fit.
  const solidSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  solidSvg.setAttribute("width", "100%");
  solidSvg.setAttribute("role", "img");
  solidSvg.style.cssText = "display:block; width:100%; max-width:280px; height:auto;";

  function drawSolid(t) {
    const { faces, sliceFace } = buildFaces(t);
    const all = [...faces, sliceFace];
    // Global bbox in projected space.
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const f of all)
      for (const p of f.pts) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
    const pad = 0.6;
    const spanX = maxX - minX + pad * 2;
    const spanY = maxY - minY + pad * 2;
    const VB = 300;
    const scale = Math.min(VB / spanX, VB / spanY) * 0.92;
    const offX = (VB - (maxX + minX) * scale) / 2;
    const offY = (VB - (maxY + minY) * scale) / 2;
    const tp = (p) => (p.x * scale + offX).toFixed(1) + "," + (p.y * scale + offY).toFixed(1);

    solidSvg.setAttribute("viewBox", `0 0 ${VB} ${VB}`);
    const body = all
      .map((f) => {
        const stroke = f.slice ? C.sliceEdge : C.edge;
        const sw = f.slice ? 2.5 : 1.4;
        const dash = f.slice ? ' stroke-dasharray="6 4"' : "";
        return (
          '<polygon points="' +
          f.pts.map(tp).join(" ") +
          '" fill="' +
          f.fill +
          '" stroke="' +
          stroke +
          '" stroke-width="' +
          sw +
          '" stroke-linejoin="round"' +
          dash +
          " />"
        );
      })
      .join("");
    solidSvg.innerHTML = body;
    solidSvg.setAttribute(
      "aria-label",
      `A ${shape.replace(/-/g, " ")} cut by a bright horizontal slice plane; the 2D cross-section is shown beside it.`,
    );
  }

  // ── Right: the 2D cross-section, to scale, with dimension labels ──
  const xsvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  xsvg.setAttribute("viewBox", "0 0 200 190");
  xsvg.style.cssText = "display:block; width:100%; max-width:220px; height:auto;";

  function drawCross(t) {
    const s = isPyramid ? 1 - t : 1;
    const cw = Math.round(w * s * 10) / 10;
    const cd = Math.round(d * s * 10) / 10;
    const scale = 118 / Math.max(w, d, isTri ? d : 1);
    const cx = 100,
      cy = 92;
    let body = "";
    let name = "";
    if (isTri) {
      const pw = w * scale,
        ph = d * s * scale;
      const tri = [
        [cx - pw / 2, cy + ph / 2],
        [cx + pw / 2, cy + ph / 2],
        [cx, cy - ph / 2],
      ];
      body =
        '<polygon points="' +
        tri.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ") +
        '" fill="' +
        C.xfill +
        '" stroke="' +
        C.navy +
        '" stroke-width="2.5" stroke-linejoin="round" />' +
        dimLabel(cx - pw / 2, cy + ph / 2 + 16, cx + pw / 2, cy + ph / 2 + 16, "base " + w);
      name = "a triangle (base " + w + ")";
    } else {
      const pw = Math.max(6, w * s * scale),
        ph = Math.max(6, d * s * scale);
      body =
        '<rect x="' +
        (cx - pw / 2) +
        '" y="' +
        (cy - ph / 2) +
        '" width="' +
        pw +
        '" height="' +
        ph +
        '" rx="3" fill="' +
        C.xfill +
        '" stroke="' +
        C.navy +
        '" stroke-width="2.5" />' +
        dimLabel(cx - pw / 2, cy + ph / 2 + 16, cx + pw / 2, cy + ph / 2 + 16, String(cw)) +
        dimLabelV(cx + pw / 2 + 14, cy - ph / 2, cy + ph / 2, String(cd));
      name = isPyramid ? "a square, " + cw + " × " + cw : "a rectangle, " + cw + " × " + cd;
    }
    xsvg.innerHTML = body;
    return name;
  }

  function dimLabel(x1, y, x2, _ny, text) {
    const mid = (x1 + x2) / 2;
    return (
      '<line x1="' +
      x1 +
      '" y1="' +
      y +
      '" x2="' +
      x2 +
      '" y2="' +
      y +
      '" stroke="' +
      C.muted +
      '" stroke-width="1.2" />' +
      '<text x="' +
      mid +
      '" y="' +
      (y + 14) +
      '" text-anchor="middle" font-size="13" font-family="system-ui" fill="' +
      C.muted +
      '">' +
      esc(text) +
      "</text>"
    );
  }
  function dimLabelV(x, y1, y2, text) {
    const mid = (y1 + y2) / 2;
    return (
      '<line x1="' +
      x +
      '" y1="' +
      y1 +
      '" x2="' +
      x +
      '" y2="' +
      y2 +
      '" stroke="' +
      C.muted +
      '" stroke-width="1.2" />' +
      '<text x="' +
      (x + 4) +
      '" y="' +
      (mid + 4) +
      '" font-size="13" font-family="system-ui" fill="' +
      C.muted +
      '">' +
      esc(text) +
      "</text>"
    );
  }

  // ── Layout ──
  const left = document.createElement("div");
  left.style.cssText = "flex:0 1 300px; min-width:200px; text-align:center;";
  left.appendChild(solidSvg);
  const control = document.createElement("div");
  control.style.cssText = "margin-top:8px;";
  control.innerHTML =
    '<label style="font-weight:800;color:' +
    C.muted +
    ';font-size:.8rem;display:block;margin-bottom:4px;">◀ Slide the cut up and down ▶</label>' +
    '<input type="range" min="4" max="96" value="45" step="1" aria-label="Slice height" style="width:90%;accent-color:' +
    C.slice +
    ';">';
  left.appendChild(control);
  const slider = control.querySelector("input");

  const right = document.createElement("div");
  right.style.cssText = "flex:0 1 240px; min-width:180px; text-align:center;";
  right.innerHTML =
    '<div style="font-weight:800;color:' + C.navy + ';margin-bottom:6px;">The cut face</div>';
  right.appendChild(xsvg);
  const caption = document.createElement("div");
  caption.setAttribute("aria-live", "polite");
  caption.style.cssText = "margin-top:8px; font-size:1rem; color:" + C.ink + "; line-height:1.4;";
  right.appendChild(caption);

  root.appendChild(left);
  root.appendChild(right);
  container.appendChild(root);

  function update() {
    const t = Math.max(0, Math.min(1, (parseInt(slider.value, 10) || 45) / 100));
    drawSolid(t);
    const name = drawCross(t);
    const s = isPyramid ? 1 - t : 1;
    const note = isPyramid
      ? "Slice higher and the square stays the same shape but gets smaller — the slices are <b>similar</b>."
      : "Slice anywhere and the cross-section is the same — that's what makes it a <b>prism</b> (V = base area × height).";
    caption.innerHTML =
      "It's " +
      esc(name) +
      (isPyramid && s < 0.06 ? " (nearly a point at the top)" : "") +
      ".<br><span style='color:" +
      C.muted +
      ";font-size:.92rem'>" +
      note +
      "</span>";
  }
  slider.addEventListener("input", update);
  update();

  return {
    destroy() {
      root.remove();
    },
  };
}

export default renderCrossSection;
