// cross-section.js — Interactive "slice a solid" explorer. Drag a horizontal
// plane up and down through a solid and see the 2D cross-section it makes, drawn
// to scale with its dimensions. Contrasts the big idea that a PRISM has the same
// cross-section at every height while a PYRAMID's cross-section shrinks (and stays
// a similar shape). Pure SVG, no dependencies.
//
// Public API:
//   renderCrossSection(container, { shape, w, d, h }) -> { destroy }
//     shape: "rectangular-prism" | "triangular-prism" | "square-pyramid"
//     w,d,h: base width, base depth, height (grid units; sensible defaults)

const C = {
  navy: "#12355b",
  teal: "#1fa6a2",
  tealFill: "rgba(31,166,162,0.28)",
  amber: "#f2c15b",
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

// Oblique offset (for the "depth" direction) as a fraction of a unit.
const OX = 16;
const OY = -10;

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
    "display:flex; flex-wrap:wrap; gap:16px; align-items:flex-start; background:#fff; border:1px solid var(--line," +
    C.line +
    "); border-radius:16px; padding:16px; box-shadow:0 2px 8px rgba(12,27,42,.08);";

  // ── Left: the solid with a movable slice plane ──
  const SW = 280,
    SH = 300;
  const px = 30; // px per unit (solid panel)
  const baseY = SH - 40;
  const cx = 90;

  const left = document.createElement("div");
  left.style.cssText = "flex:1; min-width:240px;";
  const solidSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  solidSvg.setAttribute("viewBox", `0 0 ${SW} ${SH}`);
  solidSvg.setAttribute("width", "100%");
  solidSvg.setAttribute("role", "img");
  solidSvg.style.maxWidth = "340px";
  left.appendChild(solidSvg);

  const control = document.createElement("div");
  control.style.cssText = "margin-top:10px;";
  control.innerHTML =
    '<label style="font-weight:800;color:' +
    C.muted +
    ';font-size:.85rem;display:block;margin-bottom:6px;">Slice height</label>' +
    '<input type="range" min="2" max="98" value="45" step="1" aria-label="Slice height" style="width:100%;">';
  left.appendChild(control);
  const slider = control.querySelector("input");

  // ── Right: the 2D cross-section ──
  const right = document.createElement("div");
  right.style.cssText = "flex:1; min-width:200px;";
  right.innerHTML =
    '<div style="font-weight:800;color:' + C.navy + ';margin-bottom:8px;">Cross-section here</div>';
  const xsvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  xsvg.setAttribute("viewBox", "0 0 200 180");
  xsvg.setAttribute("width", "100%");
  xsvg.style.maxWidth = "240px";
  right.appendChild(xsvg);
  const caption = document.createElement("div");
  caption.setAttribute("aria-live", "polite");
  caption.style.cssText = "margin-top:8px; font-size:1.05rem; color:" + C.ink + ";";
  right.appendChild(caption);

  root.appendChild(left);
  root.appendChild(right);
  container.appendChild(root);

  // Top-face scale factor of the solid at height fraction t (0 base .. 1 top).
  function scaleAt(t) {
    return isPyramid ? 1 - t : 1;
  }

  function drawSolid(t) {
    const H = h * px;
    const topY = baseY - H;
    const bw = w * px;
    const parts = [];

    if (isPyramid) {
      const apex = { x: cx + bw / 2 + (OX * d) / 2, y: topY };
      const b = [
        { x: cx, y: baseY },
        { x: cx + bw, y: baseY },
        { x: cx + bw + OX * d, y: baseY + OY * d },
        { x: cx + OX * d, y: baseY + OY * d },
      ];
      parts.push(poly([b[0], b[1], apex], "rgba(31,166,162,0.10)", C.teal));
      parts.push(poly([b[1], b[2], apex], "rgba(31,166,162,0.20)", C.teal));
      parts.push(poly([b[3], b[0], apex], "rgba(31,166,162,0.05)", C.teal));
      parts.push(poly(b, "rgba(31,166,162,0.12)", C.teal));
    } else if (isTri) {
      // Triangular prism standing on its triangular base (constant triangle).
      const apexX = cx + bw / 2;
      const front = [
        { x: cx, y: baseY },
        { x: cx + bw, y: baseY },
        { x: apexX, y: topY },
      ];
      const back = front.map((p) => ({ x: p.x + OX * d, y: p.y + OY * d }));
      parts.push(poly(back, "rgba(31,166,162,0.10)", C.teal));
      parts.push(poly([front[1], back[1], back[2], front[2]], "rgba(31,166,162,0.20)", C.teal));
      parts.push(poly([front[0], back[0], back[2], front[2]], "rgba(31,166,162,0.05)", C.teal));
      parts.push(poly(front, "rgba(31,166,162,0.14)", C.teal));
    } else {
      const front = [
        { x: cx, y: baseY },
        { x: cx + bw, y: baseY },
        { x: cx + bw, y: topY },
        { x: cx, y: topY },
      ];
      const off = { x: OX * d, y: OY * d };
      const topFace = [
        { x: cx, y: topY },
        { x: cx + bw, y: topY },
        { x: cx + bw + off.x, y: topY + off.y },
        { x: cx + off.x, y: topY + off.y },
      ];
      const side = [
        { x: cx + bw, y: baseY },
        { x: cx + bw, y: topY },
        { x: cx + bw + off.x, y: topY + off.y },
        { x: cx + bw + off.x, y: baseY + off.y },
      ];
      parts.push(poly(topFace, "rgba(31,166,162,0.20)", C.teal));
      parts.push(poly(side, "rgba(31,166,162,0.10)", C.teal));
      parts.push(poly(front, "rgba(31,166,162,0.14)", C.teal));
    }

    // Slice plane at height fraction t.
    const sy = baseY - t * H;
    const s = scaleAt(t);
    const sw = bw * s;
    const sxLeft = cx + (bw - sw) / 2;
    const plane = [
      { x: sxLeft, y: sy },
      { x: sxLeft + sw, y: sy },
      { x: sxLeft + sw + OX * d, y: sy + OY * d },
      { x: sxLeft + OX * d, y: sy + OY * d },
    ];
    parts.push(poly(plane, C.tealFill, C.navy, 2.5));

    solidSvg.innerHTML = parts.join("");
    solidSvg.setAttribute(
      "aria-label",
      `${shape.replace(/-/g, " ")} sliced by a horizontal plane; the cross-section is drawn to the right.`,
    );
  }

  function poly(pts, fill, stroke, sw = 1.5) {
    return (
      '<polygon points="' +
      pts.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ") +
      '" fill="' +
      fill +
      '" stroke="' +
      stroke +
      '" stroke-width="' +
      sw +
      '" stroke-linejoin="round" />'
    );
  }

  function drawCross(t) {
    const s = scaleAt(t);
    const cw = (w * s).toFixed(1);
    const cd = (d * s).toFixed(1);
    const scale = 26;
    const pw = w * s * scale;
    const pd = d * s * scale;
    const ox = 100,
      oy = 90;
    let shapeSvg = "";
    let name = "";
    if (isTri) {
      // constant triangle (base w, the prism's depth d is its "height")
      const th = d * scale;
      const tri = [
        { x: ox - pw / 2, y: oy + th / 2 },
        { x: ox + pw / 2, y: oy + th / 2 },
        { x: ox, y: oy - th / 2 },
      ];
      shapeSvg = poly(tri, C.tealFill, C.navy, 2);
      name = "a triangle (base " + w + ")";
    } else {
      shapeSvg =
        '<rect x="' +
        (ox - pw / 2) +
        '" y="' +
        (oy - pd / 2) +
        '" width="' +
        Math.max(1, pw) +
        '" height="' +
        Math.max(1, pd) +
        '" fill="' +
        C.tealFill +
        '" stroke="' +
        C.navy +
        '" stroke-width="2" />';
      name = isPyramid ? "a square, " + cw + " × " + cw : "a rectangle, " + cw + " × " + cd;
    }
    xsvg.innerHTML = shapeSvg;

    const note = isPyramid
      ? "As you slice higher up the pyramid, the square stays the same shape but gets smaller — the slices are <b>similar</b>."
      : "No matter where you slice this prism, the cross-section is the same — that's what makes it a prism.";
    caption.innerHTML =
      "The cross-section is " +
      esc(name) +
      (isPyramid && s < 0.05 ? " (nearly a point at the top)" : "") +
      ".<br><span style='color:" +
      C.muted +
      "'>" +
      note +
      "</span>";
  }

  function update() {
    const t = Math.max(0, Math.min(1, (parseInt(slider.value, 10) || 45) / 100));
    drawSolid(t);
    drawCross(t);
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
