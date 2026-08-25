// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
//
//   parallelogram → slice the slanted triangle off, slide it across → rectangle
//   triangle      → spin a copy 180° onto itself → parallelogram (so ÷ 2)
//   trapezoid     → spin a copy 180° and dock it  → parallelogram of base (a+b)
//   polygon       → regular hexagon explodes into 6 congruent triangles
//   composite     → an L-shape splits apart into two labeled rectangles
//
// Public API:
//   renderAreaMorph(container, { figure, b, h, a, unit, label }) -> { destroy }
//     figure: "parallelogram" | "triangle" | "trapezoid" | "polygon" | "composite"
//     b/h:    base / height in units (sensible defaults per figure)
//     a:      second base (trapezoid only)
//     unit:   display unit, e.g. "cm" (optional)
//
// Layout contract (2026-08 redesign — the old build read as four competing
// controls with no hierarchy, an uncaptioned slider, a figure that was already
// cut apart on frame one, no dimension labels, and a formula bar that sat on
// "A = ?" for two thirds of the timeline):
//   figure (with b / h / a measured ON the drawing)
//   → fill-in-the-blank formula that assembles as the figure resolves
//   → caption
//   → PRIMARY control: one labelled slider, directly under the sentence that
//     points at it, with its endpoints named
//   → SECONDARY: three named step chips + Watch. No emoji, no Prev/Next — the
//     chips ARE the discrete positions of the same axis.
//
// Honors prefers-reduced-motion: the slider still works (it IS the animation
// timeline, user-driven), but the "Watch it" auto-demo never plays.

const C = {
  navy: "#12355b",
  teal: "#1fa6a2",
  tealSoft: "rgba(31,166,162,.18)",
  coral: "#d9795d",
  coralSoft: "rgba(217,121,93,.22)",
  amber: "#f2a516",
  line: "#cfe0f0",
  ink: "#1a2b3c",
  muted: "#54677c",
  grid: "rgba(18,53,91,.08)",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

// Smooth the raw slider value so motion feels physical, not linear.
const ease = (t) => t * t * (3 - 2 * t);

// A measurement drawn ON the figure, so "b" and "h" are never abstract names.
//   p1/p2  — the segment being measured, in figure coordinates
//   off    — label offset from the segment midpoint, in figure units
//   tickDir— when set, draws a right-angle square at p1 between the segment and
//            this direction (that is what makes a height read as PERPENDICULAR)
const dim = (p1, p2, text, off, opts = {}) => ({ p1, p2, text, off, ...opts });

// Each figure def returns, for progress t ∈ [0,1]:
//   whole:   the single uncut outline shown at t≈0 (step 1 must look like ONE
//            plain figure — the cut line is the story, so it cannot pre-exist)
//   pieces(t): [{ points, fill, stroke, dash, label }]
//   dims(t): measurements attached to the edges they measure
//   caption(t): one plain-language sentence describing what the student sees
//   tokens: fill-in-the-blank formula parts, each with the t it is earned at
//   steps: the three step names (no emoji, named for what they ARE)
// Coordinates are in an abstract unit box; we scale into the viewBox.
function figureDef(figure, { b, h, a }, unit) {
  const u = unit ? ` ${unit}` : "";
  const sq = unit ? ` ${unit}²` : " square units";

  switch (figure) {
    case "triangle": {
      const B = b || 8;
      const H = h || 5;
      const apex = B * 0.4;
      return {
        area: (B * H) / 2,
        grid: true,
        steps: ["1 · Triangle", "2 · Rotate a copy", "3 · Parallelogram"],
        whole: [
          [0, H],
          [B, H],
          [apex, 0],
        ],
        pieces(t) {
          const tri = [
            [0, H],
            [B, H],
            [apex, 0],
          ];
          // The copy rotates 180° about the midpoint of the right edge, docking
          // into the gap so together they tile a parallelogram of area b·h.
          const cx = (B + apex) / 2;
          const cy = H / 2;
          const ang = Math.PI * t;
          const rot = tri.map(([x, y]) => {
            const dx = x - cx;
            const dy = y - cy;
            return [
              cx + dx * Math.cos(ang) - dy * Math.sin(ang),
              cy + dx * Math.sin(ang) + dy * Math.cos(ang),
            ];
          });
          return [
            { points: tri, fill: C.tealSoft, stroke: C.teal },
            { points: rot, fill: C.coralSoft, stroke: C.coral, dash: t < 1 ? "6 4" : "" },
          ];
        },
        // The original triangle never moves, so its base and height stay put.
        dims() {
          return [
            dim([0, H], [B, H], `b = ${B}${u}`, [0, 0.62]),
            dim([-0.95, H], [-0.95, 0], `h = ${H}${u}`, [-0.75, 0], {
              dashed: true,
              tickDir: [1, 0],
            }),
          ];
        },
        tokens: [
          { txt: "A =", at: 0 },
          { txt: "½", at: 0.55 },
          { txt: "·", at: 0.55 },
          { txt: "b · h", at: 0.35 },
          { txt: `= ½ · ${B} · ${H}`, at: 0.8 },
          { txt: `= ${(B * H) / 2}${sq}`, at: 0.97 },
        ],
        caption(t) {
          if (t < 0.05)
            return `One triangle, base ${B}${u} and height ${H}${u}. Its area formula is the mystery — drag the slider below.`;
          if (t < 0.95) return "A copy of the SAME triangle is rotating 180°…";
          return `Two identical triangles tile a parallelogram of area b · h. So ONE triangle is HALF of it: ½ · ${B} · ${H} = ${(B * H) / 2}.`;
        },
      };
    }
    case "trapezoid": {
      const A = a || 4;
      const B = b || 8;
      const H = h || 4;
      const off = (B - A) / 2;
      return {
        area: ((A + B) / 2) * H,
        grid: true,
        steps: ["1 · Trapezoid", "2 · Rotate a copy", "3 · Parallelogram"],
        whole: [
          [0, H],
          [B, H],
          [B - off, 0],
          [off, 0],
        ],
        pieces(t) {
          const trap = [
            [0, H],
            [B, H],
            [B - off, 0],
            [off, 0],
          ];
          // Copy rotates 180° about the midpoint of the right leg → the two
          // trapezoids join into a parallelogram with base (a + b).
          const cx = (B + (B - off)) / 2;
          const cy = H / 2;
          const ang = Math.PI * t;
          const rot = trap.map(([x, y]) => {
            const dx = x - cx;
            const dy = y - cy;
            return [
              cx + dx * Math.cos(ang) - dy * Math.sin(ang),
              cy + dx * Math.sin(ang) + dy * Math.cos(ang),
            ];
          });
          return [
            { points: trap, fill: C.tealSoft, stroke: C.teal },
            { points: rot, fill: C.coralSoft, stroke: C.coral, dash: t < 1 ? "6 4" : "" },
          ];
        },
        // Both parallel bases are named, because the formula uses both.
        dims() {
          return [
            dim([0, H], [B, H], `b = ${B}${u}`, [0, 0.62]),
            dim([off, 0], [B - off, 0], `a = ${A}${u}`, [0, -0.55]),
            dim([-0.95, H], [-0.95, 0], `h = ${H}${u}`, [-0.8, 0], {
              dashed: true,
              tickDir: [1, 0],
            }),
          ];
        },
        tokens: [
          { txt: "A =", at: 0 },
          { txt: "½", at: 0.55 },
          { txt: "(a + b)", at: 0.35 },
          { txt: "h", at: 0.35 },
          { txt: `= ½ (${A} + ${B}) · ${H}`, at: 0.8 },
          { txt: `= ${((A + B) / 2) * H}${sq}`, at: 0.97 },
        ],
        caption(t) {
          if (t < 0.05)
            return `One trapezoid: two different parallel bases, a = ${A}${u} and b = ${B}${u}. Drag the slider below.`;
          if (t < 0.95) return "An identical copy is rotating 180° to dock against it…";
          return `Together they make a parallelogram with base (a + b) = ${A + B}. One trapezoid is HALF of it: ½ (${A} + ${B}) · ${H} = ${((A + B) / 2) * H}.`;
        },
      };
    }
    case "polygon": {
      // Regular hexagon → 6 congruent triangles fanning out from the center.
      const S = b || 4; // side length
      const R = S; // circumradius of a regular hexagon = side
      const ap = (S * Math.sqrt(3)) / 2; // apothem = the triangles' height
      const cx = R * 1.5;
      const cy = R * 1.3;
      const vert = (i) => [
        cx + Math.cos((Math.PI / 3) * i - Math.PI / 2) * R,
        cy + Math.sin((Math.PI / 3) * i - Math.PI / 2) * R,
      ];
      // How far wedge i has slid outward at time t, so labels ride along.
      const push = (i, t) => {
        const mid = (Math.PI / 3) * (i + 0.5) - Math.PI / 2;
        const d = t * R * 0.42;
        return [Math.cos(mid) * d, Math.sin(mid) * d];
      };
      return {
        area: 6 * ((S * ap) / 2),
        grid: false,
        steps: ["1 · Hexagon", "2 · Break apart", "3 · Six triangles"],
        whole: [0, 1, 2, 3, 4, 5].map(vert),
        pieces(t) {
          const out = [];
          for (let i = 0; i < 6; i++) {
            // Each triangle slides radially outward as t grows — an exploded view
            // that shows the hexagon is literally built from 6 equal triangles.
            const [ox, oy] = push(i, t);
            const [x1, y1] = vert(i);
            const [x2, y2] = vert(i + 1);
            out.push({
              points: [
                [cx + ox, cy + oy],
                [x1 + ox, y1 + oy],
                [x2 + ox, y2 + oy],
              ],
              fill: i % 2 ? C.coralSoft : C.tealSoft,
              stroke: i % 2 ? C.coral : C.teal,
            });
          }
          return out;
        },
        // Measure ONE wedge — side s along its outer edge, height h (the
        // apothem) from the center point out to that edge's midpoint.
        dims(t) {
          const [ox, oy] = push(0, t);
          const [x1, y1] = vert(0);
          const [x2, y2] = vert(1);
          const mx = (x1 + x2) / 2 + ox;
          const my = (y1 + y2) / 2 + oy;
          return [
            dim([x1 + ox, y1 + oy], [x2 + ox, y2 + oy], `s = ${S}${u}`, [0.85, -0.15]),
            dim([mx, my], [cx + ox, cy + oy], `h = ${ap.toFixed(1)}${u}`, [0.35, -0.5], {
              dashed: true,
              tickDir: [x2 - x1, y2 - y1],
            }),
          ];
        },
        tokens: [
          { txt: "A =", at: 0 },
          { txt: "6", at: 0.35 },
          { txt: "·", at: 0.35 },
          { txt: "(½ · s · h)", at: 0.55 },
          { txt: `= 6 · (½ · ${S} · ${ap.toFixed(1)})`, at: 0.8 },
          { txt: `≈ ${Math.round(6 * ((S * ap) / 2) * 10) / 10}${sq}`, at: 0.97 },
        ],
        caption(t) {
          if (t < 0.05)
            return "A regular hexagon looks hard to measure. Drag the slider below and watch what it is made of.";
          if (t < 0.95) return "…it breaks into congruent triangles, all the same size.";
          return `Six identical triangles. Find ONE triangle's area (½ · s · h), then multiply by 6. Decomposition beats memorization.`;
        },
      };
    }
    case "composite": {
      const B = b || 10;
      const H = h || 7;
      const cutX = Math.round(B * 0.55);
      const cutY = Math.round(H * 0.45);
      const a1 = B * cutY;
      const a2 = cutX * (H - cutY);
      const gapAt = (t) => t * 1.6;
      return {
        area: a1 + a2,
        grid: true,
        steps: ["1 · L-shape", "2 · Split it", "3 · Two rectangles"],
        whole: [
          [0, H],
          [B, H],
          [B, H - cutY],
          [cutX, H - cutY],
          [cutX, 0],
          [0, 0],
        ],
        pieces(t) {
          // L-shape splits: the top rectangle slides right away from the bottom
          // one, revealing the two simple rectangles it was made of.
          const gap = gapAt(t);
          return [
            {
              points: [
                [0, H],
                [B, H],
                [B, H - cutY],
                [0, H - cutY],
              ],
              fill: C.tealSoft,
              stroke: C.teal,
              label: t > 0.6 ? `${B} × ${cutY} = ${a1}` : "",
            },
            {
              points: [
                [gap, H - cutY],
                [cutX + gap, H - cutY],
                [cutX + gap, 0],
                [gap, 0],
              ],
              fill: C.coralSoft,
              stroke: C.coral,
              label: t > 0.6 ? `${cutX} × ${H - cutY} = ${a2}` : "",
            },
          ];
        },
        // Each rectangle carries its own base and height — that IS the formula.
        dims(t) {
          const gap = gapAt(t);
          return [
            dim([0, H], [B, H], `${B}${u}`, [0, 0.62]),
            dim([-0.85, H], [-0.85, H - cutY], `${cutY}${u}`, [-0.7, 0], {
              dashed: true,
              tickDir: [1, 0],
            }),
            dim([gap, 0], [cutX + gap, 0], `${cutX}${u}`, [0, -0.5]),
            dim([cutX + gap + 0.5, 0], [cutX + gap + 0.5, H - cutY], `${H - cutY}${u}`, [0.6, 0], {
              dashed: true,
              tickDir: [-1, 0],
            }),
          ];
        },
        tokens: [
          { txt: "A =", at: 0 },
          { txt: "(rectangle 1)", at: 0.35 },
          { txt: "+", at: 0.35 },
          { txt: "(rectangle 2)", at: 0.35 },
          { txt: `= ${B}·${cutY} + ${cutX}·${H - cutY}`, at: 0.8 },
          { txt: `= ${a1 + a2}${sq}`, at: 0.97 },
        ],
        caption(t) {
          if (t < 0.05)
            return "A composite (L-shaped) figure — no single formula fits it. Drag the slider below.";
          if (t < 0.95) return "Pull it apart into shapes you already know…";
          return `Two plain rectangles: ${a1} + ${a2} = ${a1 + a2} square units. Split, solve, add.`;
        },
      };
    }
    default: {
      // parallelogram
      const B = b || 7;
      const H = h || 4;
      const sk = H * 0.75; // horizontal skew of the slanted sides
      return {
        area: B * H,
        grid: true,
        steps: ["1 · Parallelogram", "2 · Cut & slide", "3 · Rectangle"],
        whole: [
          [0, H],
          [B, H],
          [B + sk, 0],
          [sk, 0],
        ],
        pieces(t) {
          // The slanted triangle on the left is sliced off and slides base-width
          // to the right, filling the gap → a b×h rectangle. Classic shear proof.
          const slide = t * B;
          return [
            {
              // Body: parallelogram minus the left triangle (a right-trapezoid)
              points: [
                [sk, H],
                [B, H],
                [B + sk, 0],
                [sk, 0],
              ],
              fill: C.tealSoft,
              stroke: C.teal,
            },
            {
              // The sliced triangle, translating right by t·b
              points: [
                [slide, H],
                [sk + slide, H],
                [sk + slide, 0],
              ],
              fill: C.coralSoft,
              stroke: C.coral,
              dash: t > 0 && t < 1 ? "6 4" : "",
            },
          ];
        },
        // The base travels with the figure (0→sk) so the "b" bar always sits
        // under the base it names, at the start AND on the finished rectangle.
        dims(t) {
          const q = t * sk;
          return [
            dim([q, H], [B + q, H], `b = ${B}${u}`, [0, 0.62]),
            // The height gutter travels with the figure's left edge, so it is
            // never left stranded beside empty grid once the shape moves.
            dim([q - 0.95, H], [q - 0.95, 0], `h = ${H}${u}`, [-0.8, 0], {
              dashed: true,
              tickDir: [1, 0],
            }),
          ];
        },
        tokens: [
          { txt: "A =", at: 0 },
          { txt: "b", at: 0.35 },
          { txt: "·", at: 0.35 },
          { txt: "h", at: 0.35 },
          { txt: `= ${B} · ${H}`, at: 0.8 },
          { txt: `= ${B * H}${sq}`, at: 0.97 },
        ],
        caption(t) {
          if (t < 0.05)
            return `A slanted parallelogram, base ${B}${u} and height ${H}${u}. Drag the slider below to cut and slide it.`;
          if (t < 0.95) return "Slicing the triangle off one end and carrying it to the other…";
          return `Same pieces, zero area lost — it IS a ${B} × ${H} rectangle. That is why A = b · h.`;
        },
      };
    }
  }
}

export function renderAreaMorph(container, cfg = {}) {
  // `figure` is the documented key. `shape` is accepted because three call
  // sites in vocab-learn-panel.js used it for months and silently got a
  // parallelogram for every triangle and trapezoid term; the call sites are
  // fixed, and this keeps any future stray `shape` from failing silently.
  const figure = cfg.figure || cfg.shape || "parallelogram";
  const unit = cfg.unit ? String(cfg.unit) : "";
  const def = figureDef(figure, cfg, unit);

  const reduceMotion =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const root = document.createElement("div");
  root.className = "area-morph";
  root.style.cssText =
    "max-width:600px; margin:0 auto; background:#fff; border:1px solid " +
    C.line +
    "; border-radius:16px; padding:16px; box-shadow:0 2px 10px rgba(12,27,42,.08);";

  // Size the viewBox from the ACTUAL sweep of every piece AND every dimension
  // label across the whole animation (rotating copies swing outside the resting
  // figure; gutter measurements sit outside it too), so nothing ever clips.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const seen = (x, y) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  for (let i = 0; i <= 24; i++) {
    const t = ease(i / 24);
    for (const p of def.pieces(t)) for (const [x, y] of p.points) seen(x, y);
    for (const d of def.dims(t)) {
      seen(d.p1[0], d.p1[1]);
      seen(d.p2[0], d.p2[1]);
      const mx = (d.p1[0] + d.p2[0]) / 2 + (d.off ? d.off[0] : 0);
      const my = (d.p1[1] + d.p2[1]) / 2 + (d.off ? d.off[1] : 0);
      seen(mx, my);
    }
  }
  for (const [x, y] of def.whole) seen(x, y);

  const W = 560;
  const PAD = 34;
  const scale = (W - PAD * 2) / (maxX - minX);
  const H = Math.round((maxY - minY) * scale) + PAD * 2;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("role", "img");
  svg.style.cssText = "display:block; width:100%; height:auto;";
  root.appendChild(svg);

  // Formula strip — a fill-in-the-blank that ASSEMBLES as the figure resolves.
  // Blanks show the shape of the answer without handing it over.
  const formula = document.createElement("div");
  formula.setAttribute("aria-live", "polite");
  formula.style.cssText =
    "text-align:center; font-size:1.15rem; font-weight:700; color:" +
    C.navy +
    "; background:" +
    C.tealSoft +
    "; border-radius:12px; padding:10px 12px; margin:12px 0 10px; letter-spacing:.02em; font-family:ui-monospace,Menlo,monospace;";
  root.appendChild(formula);

  // Caption — narrates the transformation, and points at the slider directly
  // beneath it.
  const caption = document.createElement("div");
  caption.setAttribute("aria-live", "polite");
  caption.style.cssText =
    "text-align:center; color:" +
    C.ink +
    "; font-size:1rem; margin:0 4px 12px; min-height:3.1em; font-weight:500; line-height:1.35;";
  root.appendChild(caption);

  /* ── Predict first ──────────────────────────────────────────────────────────
   * Every one of these transformations rearranges a figure without adding or
   * removing anything, and the closing caption says so. But a student who
   * watches an animation and then reads "zero area lost" has not decided
   * anything — the conservation of area is the entire mathematical content
   * here, and it lands only if they commit to an answer that can be wrong.
   *
   * Deliberately NOT a gate: the slider works whether or not a prediction is
   * made, because a teacher demonstrating this to a class must not have to
   * answer a student prompt first (whole-group use). Committing simply changes
   * who the ending is addressed to. */
  let prediction = null;
  const predictionVerdict = (choice) =>
    choice === "same"
      ? "You predicted the area would stay the same — watch why that is right:"
      : `You predicted the area would get ${choice}. Look closely:`;

  const predictRow = document.createElement("div");
  predictRow.style.cssText =
    "display:flex; flex-wrap:wrap; gap:8px; align-items:center; justify-content:center; margin:0 4px 12px;";
  const predictQ = document.createElement("span");
  predictQ.textContent =
    "Before you move it — does the AREA get bigger, smaller, or stay the same?";
  predictQ.style.cssText = `flex:1 1 100%; text-align:center; font-size:.9rem; font-weight:600; color:${C.navy};`;
  predictRow.appendChild(predictQ);
  const predictLive = document.createElement("span");
  predictLive.setAttribute("aria-live", "polite");
  predictLive.style.cssText = "flex:1 1 100%; text-align:center; font-size:.85rem; color:" + C.ink;
  for (const choice of ["bigger", "smaller", "same"]) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = choice === "same" ? "Stays the same" : `Gets ${choice}`;
    btn.style.cssText = `min-height:44px; padding:6px 14px; border:1.5px solid ${C.line}; border-radius:10px; background:#fff; color:${C.navy}; font-size:.85rem; font-weight:600; cursor:pointer;`;
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      prediction = choice;
      for (const other of predictRow.querySelectorAll("button")) {
        const on = other === btn;
        other.setAttribute("aria-pressed", on ? "true" : "false");
        other.style.borderColor = on ? C.navy : C.line;
        other.style.background = on ? "#eef4ff" : "#fff";
      }
      predictLive.textContent = "Prediction locked in — now move the slider and find out.";
    });
    predictRow.appendChild(btn);
  }
  predictRow.appendChild(predictLive);
  root.appendChild(predictRow);

  // PRIMARY control: one labelled slider, with its two endpoints named so a
  // student can see what the axis MEANS before touching it.
  const sliderWrap = document.createElement("div");
  sliderWrap.style.cssText =
    "border:2px solid " +
    C.teal +
    "; border-radius:14px; padding:10px 12px 6px; background:#f7fdfd;";
  sliderWrap.innerHTML =
    '<label for="am-slider-ID" style="display:block; text-align:center; font-weight:700; color:' +
    C.navy +
    '; font-size:.95rem; margin-bottom:2px;">Drag to transform the figure</label>' +
    '<input id="am-slider-ID" type="range" min="0" max="1000" value="0" step="25" style="display:block; width:100%; min-height:44px; accent-color:' +
    C.teal +
    ';" />' +
    '<div style="display:flex; justify-content:space-between; color:' +
    C.muted +
    '; font-size:.8rem; font-weight:600; margin-top:-2px;"><span>' +
    esc(def.steps[0].replace(/^\d+\s·\s/, "")) +
    "</span><span>" +
    esc(def.steps[2].replace(/^\d+\s·\s/, "")) +
    "</span></div>";
  // Unique id so several explorers can share one page without stealing labels.
  const uid = `am-${Math.random().toString(36).slice(2, 8)}`;
  sliderWrap.innerHTML = sliderWrap.innerHTML.replace(/am-slider-ID/g, uid);
  root.appendChild(sliderWrap);

  // SECONDARY: the same axis as three named stops, plus Watch. Small, quiet,
  // clearly subordinate to the slider above.
  const stepBar = document.createElement("div");
  stepBar.setAttribute("role", "group");
  stepBar.setAttribute("aria-label", "Jump to a step");
  stepBar.style.cssText =
    "display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:8px; margin-top:12px;";
  stepBar.innerHTML =
    def.steps
      .map(
        (name, i) =>
          `<button type="button" class="morph-step-btn" data-step="${i}" aria-pressed="false" style="min-height:44px; padding:6px 12px; border:1.5px solid ${C.line}; border-radius:10px; background:#fff; color:${C.navy}; font-size:.82rem; font-weight:600; cursor:pointer;">${esc(name)}</button>`,
      )
      .join("") +
    `<button type="button" data-act="play" aria-label="Watch the whole transformation" style="min-height:44px; padding:6px 14px; border:1.5px solid ${C.navy}; border-radius:10px; background:#fff; color:${C.navy}; font-size:.82rem; font-weight:600; cursor:pointer;">Watch it</button>`;
  // The step chips sit ABOVE the caption, not at the very bottom. In a lesson
  // this component mounts inside `.nt-work-tool`, a STICKY column, while the
  // lesson floats a fixed "Next: …" button over the viewport's bottom-right.
  // A sticky column never scrolls out from under it, so whatever occupies that
  // corner is unreachable for good — the last two chips were. Keeping the
  // bottom band for the full-width slider (whose centre clears the button)
  // leaves every control tappable, and preserves caption → slider adjacency.
  root.insertBefore(stepBar, caption);

  const slider = sliderWrap.querySelector("input");
  const playBtn = stepBar.querySelector('[data-act="play"]');
  const stepBtns = stepBar.querySelectorAll(".morph-step-btn");

  const stepValues = [0, 0.5, 1];
  let currentStepIdx = 0;

  function updateStepUI(t) {
    if (t < 0.25) currentStepIdx = 0;
    else if (t < 0.75) currentStepIdx = 1;
    else currentStepIdx = 2;

    stepBtns.forEach((btn, idx) => {
      const on = idx === currentStepIdx;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.style.background = on ? C.navy : "#ffffff";
      btn.style.color = on ? "#ffffff" : C.navy;
      btn.style.borderColor = on ? C.navy : C.line;
    });
    slider.setAttribute("aria-valuetext", def.steps[currentStepIdx]);
  }

  const ux = (x) => PAD + (x - minX) * scale;
  const uy = (y) => PAD + (y - minY) * scale;
  const px = ([x, y]) => `${ux(x).toFixed(1)},${uy(y).toFixed(1)}`;

  // A measurement: a thin line with end caps, an optional right-angle square,
  // and a haloed label so it stays readable over the unit grid.
  function drawDim(d) {
    const x1 = ux(d.p1[0]);
    const y1 = uy(d.p1[1]);
    const x2 = ux(d.p2[0]);
    const y2 = uy(d.p2[1]);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * 5;
    const ny = (dx / L) * 5;
    let s =
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" ` +
      `stroke="${C.navy}" stroke-width="1.6" ${d.dashed ? 'stroke-dasharray="5 4"' : ""}/>`;
    for (const [ex, ey] of [
      [x1, y1],
      [x2, y2],
    ]) {
      s += `<line x1="${(ex - nx).toFixed(1)}" y1="${(ey - ny).toFixed(1)}" x2="${(ex + nx).toFixed(1)}" y2="${(ey + ny).toFixed(1)}" stroke="${C.navy}" stroke-width="1.6"/>`;
    }
    if (d.tickDir) {
      // Right-angle square at p1, between the measured segment and tickDir.
      const tx = d.tickDir[0] * scale;
      const ty = d.tickDir[1] * scale;
      const tl = Math.hypot(tx, ty) || 1;
      const k = 9;
      const ax = (dx / L) * k;
      const ay = (dy / L) * k;
      const bx = (tx / tl) * k;
      const by = (ty / tl) * k;
      s += `<path d="M${(x1 + ax).toFixed(1)},${(y1 + ay).toFixed(1)} L${(x1 + ax + bx).toFixed(1)},${(y1 + ay + by).toFixed(1)} L${(x1 + bx).toFixed(1)},${(y1 + by).toFixed(1)}" fill="none" stroke="${C.navy}" stroke-width="1.4"/>`;
    }
    // Keep the whole label inside the viewBox, not just its anchor point — at
    // 18px a centred "h = 3.5 cm" is ~55px of ink on each side of its anchor.
    const halfW = d.text.length * 5.2 + 4;
    const lx = Math.min(
      Math.max((x1 + x2) / 2 + (d.off ? d.off[0] * scale : 0), halfW + 2),
      W - halfW - 2,
    );
    const ly = (y1 + y2) / 2 + (d.off ? d.off[1] * scale : 0) + 4;
    s +=
      `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-size="18" font-weight="800" ` +
      `font-family="system-ui" fill="${C.navy}" stroke="#fff" stroke-width="4.5" paint-order="stroke">${esc(d.text)}</text>`;
    return s;
  }

  function draw(tRaw) {
    const t = ease(Math.max(0, Math.min(1, tRaw)));
    let body = "";
    // Light unit grid so "square units" stays visible and countable.
    if (def.grid) {
      for (let gx = Math.ceil(minX); gx <= Math.floor(maxX); gx++) {
        body += `<line x1="${ux(gx)}" y1="${uy(minY)}" x2="${ux(gx)}" y2="${uy(maxY)}" stroke="${C.grid}" stroke-width="1"/>`;
      }
      for (let gy = Math.ceil(minY); gy <= Math.floor(maxY); gy++) {
        body += `<line x1="${ux(minX)}" y1="${uy(gy)}" x2="${ux(maxX)}" y2="${uy(gy)}" stroke="${C.grid}" stroke-width="1"/>`;
      }
    }
    if (t < 0.02) {
      // Step 1 is ONE whole figure. No seam, no cut line, no stacked copy —
      // the cut is the thing being explained, so it may not pre-exist.
      body += `<polygon points="${def.whole.map(px).join(" ")}" fill="${C.tealSoft}" stroke="${C.teal}" stroke-width="2.5" stroke-linejoin="round"/>`;
    } else {
      for (const p of def.pieces(t)) {
        const pts = p.points.map(px).join(" ");
        body += `<polygon points="${pts}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="2.5" ${
          p.dash ? `stroke-dasharray="${p.dash}"` : ""
        } stroke-linejoin="round"/>`;
        if (p.label) {
          const cx = p.points.reduce((s, q) => s + q[0], 0) / p.points.length;
          const cy = p.points.reduce((s, q) => s + q[1], 0) / p.points.length;
          body += `<text x="${ux(cx)}" y="${uy(cy)}" text-anchor="middle" font-size="17" font-weight="800" font-family="system-ui" fill="${C.navy}" stroke="#fff" stroke-width="3.5" paint-order="stroke">${esc(
            p.label,
          )}</text>`;
        }
      }
    }
    for (const d of def.dims(t)) body += drawDim(d);

    svg.innerHTML = body;
    /* The closing caption states the invariant ("Same pieces, zero area lost").
     * Stating it is not the same as a student deciding it — so if they made a
     * prediction, the end of the transformation answers THEIR answer instead of
     * announcing the result to nobody in particular. */
    caption.textContent =
      t >= 0.95 && prediction
        ? `${predictionVerdict(prediction)} ${def.caption(t)}`
        : def.caption(t);
    // Blanks fill in one part at a time, so the formula is visibly derived from
    // the picture rather than announced at the end.
    // An unearned part is ONE uniform slot, not a run of underscores sized to
    // the answer. Ragged underscores of five different lengths read as noise
    // ("A = __ __ b · h ______ ______") and hint at the answer's length; a row
    // of identical slots reads as an equation waiting to be filled in.
    formula.innerHTML = def.tokens
      .map((tok) => {
        if (t >= tok.at) return `<span>${esc(tok.txt)}</span>`;
        // A continuation ("= ½ · 8 · 5", "= 20 square units") is the arithmetic
        // that follows once the formula exists. Blanking those adds two wide
        // empty slots that wrap onto their own lines in a narrow lesson column
        // and swamp the formula being built, so they are simply absent until
        // earned. Only the formula's own parts hold a place.
        if (/^=/.test(tok.txt.trim())) return "";
        return `<span role="img" aria-label="blank" style="display:inline-block; width:1.9em; border-bottom:2px solid ${C.navy}; opacity:.28; vertical-align:baseline;">&nbsp;</span>`;
      })
      .filter(Boolean)
      .join(" ");
    svg.setAttribute(
      "aria-label",
      `${figure} area transformation, ${Math.round(t * 100)}% complete. ${def.caption(t)}`,
    );
    updateStepUI(tRaw);
  }

  let raf = 0;
  function playDemo() {
    cancelAnimationFrame(raf);
    const t0 = performance.now();
    const DUR = 3000;
    const step = (now) => {
      if (!root.isConnected) return; // self-cancel when detached
      const t = Math.min(1, (now - t0) / DUR);
      slider.value = String(Math.round(t * 1000));
      draw(t);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function goToStep(idx) {
    cancelAnimationFrame(raf);
    const targetT = stepValues[idx];
    slider.value = String(Math.round(targetT * 1000));
    draw(targetT);
  }

  stepBtns.forEach((btn) => {
    btn.addEventListener("click", () => goToStep(parseInt(btn.dataset.step, 10)));
  });

  slider.addEventListener("input", () => {
    cancelAnimationFrame(raf);
    draw(Number(slider.value) / 1000);
  });

  playBtn.addEventListener("click", () => {
    if (reduceMotion) {
      slider.value = "1000";
      draw(1);
    } else {
      playDemo();
    }
  });

  container.appendChild(root);
  draw(0);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      root.remove();
    },
  };
}

export default renderAreaMorph;
