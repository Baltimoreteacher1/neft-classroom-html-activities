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
// Honors prefers-reduced-motion: the slider still works (it IS the animation
// timeline, user-driven), but the idle "watch it" auto-demo never plays.

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

// Each figure def returns, for progress t ∈ [0,1]:
//   pieces: [{ points | rect, fill, stroke, dash }]
//   caption(t): one plain-language sentence describing what the student sees
//   formula: { start, end } — the equivalence being built
// Coordinates are in an abstract unit box; we scale into the viewBox.
function figureDef(figure, { b, h, a }) {
  switch (figure) {
    case "triangle": {
      const B = b || 8;
      const H = h || 5;
      return {
        area: (B * H) / 2,
        formulaStart: "A = ?",
        formulaEnd: `A = ½ · b · h = ½ · ${B} · ${H}`,
        grid: true,
        pieces(t) {
          const apex = B * 0.4;
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
        caption(t) {
          if (t < 0.05) return "One triangle. Its area formula is the mystery.";
          if (t < 0.95) return "A copy of the SAME triangle is rotating 180°…";
          return `Two identical triangles tile a parallelogram (area b · h) — so ONE triangle is HALF: ½ · ${B} · ${H} = ${(B * H) / 2}.`;
        },
      };
    }
    case "trapezoid": {
      const A = a || 4;
      const B = b || 8;
      const H = h || 4;
      return {
        area: ((A + B) / 2) * H,
        formulaStart: "A = ?",
        formulaEnd: `A = ½ (a + b) h = ½ (${A} + ${B}) · ${H}`,
        grid: true,
        pieces(t) {
          const off = (B - A) / 2;
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
        caption(t) {
          if (t < 0.05) return "One trapezoid — two different parallel bases, a and b.";
          if (t < 0.95) return "An identical copy is rotating 180° to dock against it…";
          return `Together they make a parallelogram with base (a + b) = ${A + B}. One trapezoid is HALF of it: ½ (${A} + ${B}) · ${H} = ${((A + B) / 2) * H}.`;
        },
      };
    }
    case "polygon": {
      // Regular hexagon → 6 congruent triangles fanning out from the center.
      const S = b || 4; // side length
      const R = S; // circumradius of a regular hexagon = side
      const ap = (S * Math.sqrt(3)) / 2;
      return {
        area: 6 * ((S * ap) / 2),
        formulaStart: "A = ?",
        formulaEnd: `A = 6 triangles = 6 · (½ · ${S} · h)`,
        grid: false,
        pieces(t) {
          const cx = R * 1.5;
          const cy = R * 1.3;
          const out = [];
          for (let i = 0; i < 6; i++) {
            const a1 = (Math.PI / 3) * i - Math.PI / 2;
            const a2 = (Math.PI / 3) * (i + 1) - Math.PI / 2;
            // Each triangle slides radially outward as t grows — an exploded view
            // that shows the hexagon is literally built from 6 equal triangles.
            const mid = (a1 + a2) / 2;
            const push = t * R * 0.42;
            const ox = Math.cos(mid) * push;
            const oy = Math.sin(mid) * push;
            out.push({
              points: [
                [cx + ox, cy + oy],
                [cx + Math.cos(a1) * R + ox, cy + Math.sin(a1) * R + oy],
                [cx + Math.cos(a2) * R + ox, cy + Math.sin(a2) * R + oy],
              ],
              fill: i % 2 ? C.coralSoft : C.tealSoft,
              stroke: i % 2 ? C.coral : C.teal,
            });
          }
          return out;
        },
        caption(t) {
          if (t < 0.05) return "A regular hexagon looks hard to measure…";
          if (t < 0.95) return "…until it explodes into congruent triangles.";
          return `6 identical triangles — find ONE triangle's area, multiply by 6. Decomposition beats memorization.`;
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
      return {
        area: a1 + a2,
        formulaStart: "A = ?",
        formulaEnd: `A = ${B}·${cutY} + ${cutX}·${H - cutY} = ${a1} + ${a2}`,
        grid: true,
        pieces(t) {
          // L-shape splits: the top rectangle slides up-right away from the
          // bottom one, revealing the two simple rectangles it was made of.
          const gap = t * 1.6;
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
              // Top rectangle slides right, cleanly separating the two parts.
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
        caption(t) {
          if (t < 0.05) return "A composite (L-shaped) figure — no single formula fits it.";
          if (t < 0.95) return "Pull it apart…";
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
        formulaStart: "A = ?",
        formulaEnd: `A = b · h = ${B} · ${H}`,
        grid: true,
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
        caption(t) {
          if (t < 0.05) return "A slanted parallelogram. Slide the slider →";
          if (t < 0.95) return "Slicing the triangle off one end and carrying it to the other…";
          return `Same pieces, zero area lost — it IS a ${B} × ${H} rectangle. That is why A = b · h.`;
        },
      };
    }
  }
}

export function renderAreaMorph(container, cfg = {}) {
  const figure = cfg.figure || "parallelogram";
  const def = figureDef(figure, cfg);
  const unit = cfg.unit ? String(cfg.unit) : "";

  const reduceMotion =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const root = document.createElement("div");
  root.className = "area-morph";
  root.style.cssText =
    "max-width:600px; margin:0 auto; background:#fff; border:1px solid " +
    C.line +
    "; border-radius:16px; padding:16px; box-shadow:0 2px 10px rgba(12,27,42,.08);";

  // Size the viewBox from the ACTUAL sweep of every piece across the whole
  // animation (rotating copies swing outside the resting figure), so nothing
  // ever clips mid-motion.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i <= 24; i++) {
    for (const p of def.pieces(ease(i / 24))) {
      for (const [x, y] of p.points) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  const W = 560;
  const PAD = 30;
  const scale = (W - PAD * 2) / (maxX - minX);
  const H = Math.round((maxY - minY) * scale) + PAD * 2;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("role", "img");
  svg.style.cssText = "display:block; width:100%; height:auto;";
  root.appendChild(svg);

  // Caption — narrates the transformation as it happens.
  const caption = document.createElement("div");
  caption.setAttribute("aria-live", "polite");
  caption.style.cssText =
    "text-align:center; color:" +
    C.ink +
    "; font-size:1rem; margin:10px 4px 12px; min-height:2.6em; font-weight:600;";
  root.appendChild(caption);

  // Formula chip — flips from mystery to derived formula at the end.
  const formula = document.createElement("div");
  formula.style.cssText =
    "text-align:center; font-size:1.05rem; font-weight:800; color:" +
    C.navy +
    "; background:" +
    C.tealSoft +
    "; border-radius:12px; padding:8px 12px; margin-bottom:12px; font-family:ui-monospace,Menlo,monospace;";
  root.appendChild(formula);

  // The one control: a big, labeled transform slider.
  const controls = document.createElement("div");
  controls.style.cssText = "display:flex; align-items:center; gap:12px;";
  controls.innerHTML =
    '<span style="font-size:.85rem; font-weight:700; color:' +
    C.muted +
    ';">Transform</span>' +
    '<input type="range" min="0" max="1000" value="0" step="1" aria-label="Transform the figure" style="flex:1; min-height:44px; accent-color:' +
    C.teal +
    ';" />' +
    '<button type="button" data-act="play" aria-label="Play the transformation" style="min-height:44px; min-width:44px; padding:0 14px; border:2px solid ' +
    C.line +
    "; border-radius:12px; background:#fff; color:" +
    C.navy +
    '; font-weight:700; cursor:pointer;">▶ Watch</button>';
  root.appendChild(controls);

  const slider = controls.querySelector("input");
  const playBtn = controls.querySelector("button");

  const ux = (x) => PAD + (x - minX) * scale;
  const uy = (y) => PAD + (y - minY) * scale;
  const px = ([x, y]) => `${ux(x).toFixed(1)},${uy(y).toFixed(1)}`;

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
    for (const p of def.pieces(t)) {
      const pts = p.points.map(px).join(" ");
      body += `<polygon points="${pts}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="2.5" ${
        p.dash ? `stroke-dasharray="${p.dash}"` : ""
      } stroke-linejoin="round"/>`;
      if (p.label) {
        const cx = p.points.reduce((s, q) => s + q[0], 0) / p.points.length;
        const cy = p.points.reduce((s, q) => s + q[1], 0) / p.points.length;
        body += `<text x="${ux(cx)}" y="${uy(cy)}" text-anchor="middle" font-size="14" font-weight="800" font-family="system-ui" fill="${C.navy}">${esc(
          p.label,
        )}</text>`;
      }
    }
    svg.innerHTML = body;
    caption.textContent = def.caption(t);
    formula.textContent =
      t >= 0.95
        ? `${def.formulaEnd} = ${def.area}${unit ? ` ${unit}²` : " square units"}`
        : def.formulaStart;
    svg.setAttribute(
      "aria-label",
      `${figure} area transformation, ${Math.round(t * 100)}% complete. ${def.caption(t)}`,
    );
  }

  let raf = 0;
  function playDemo() {
    cancelAnimationFrame(raf);
    const t0 = performance.now();
    const DUR = 2600;
    const step = (now) => {
      if (!root.isConnected) return; // self-cancel when detached
      const t = Math.min(1, (now - t0) / DUR);
      slider.value = String(Math.round(t * 1000));
      draw(t);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  slider.addEventListener("input", () => {
    cancelAnimationFrame(raf);
    draw(Number(slider.value) / 1000);
  });
  playBtn.addEventListener("click", () => {
    if (reduceMotion) {
      // Respect reduced motion: jump straight to the finished decomposition.
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
