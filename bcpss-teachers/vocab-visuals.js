// Deterministic concept visuals for the Visual Vocabulary Studio.
//
// A diagram is drawn ONLY for a term that has an entry in VISUAL_SPECS. Every label, number and
// <title> comes from that spec (or is computed from it), never from the card's position in the
// list. A term with no entry gets no diagram: the card shows the authored cue text instead,
// because a wrong picture is worse than none (see gate G-02, tools/language-page-vocab.test.mjs).
// Palette is the site's navy / teal / amber family. No purple anywhere.

const NAVY = "#1e3a5f";
const TEAL = "#0f766e";
const AMBER = "#b45309";
const NAVY_FILL = "#e8eef6";
const TEAL_FILL = "#e1f2ef";
const AMBER_FILL = "#fffbeb";
const INK = "#182230";
const MUTED = "#475467";

const W = 320;
const H = 132;
const FONT = 'font-family="Inter, sans-serif"';

/** The only terms that may show a ratio tape diagram. */
export const RATIO_TAPE_TERMS = Object.freeze([
  "ratio",
  "ratios",
  "equivalent ratio",
  "equivalent ratios",
]);

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch],
  );

const text = (x, y, body, { size = 11, weight = 600, fill = INK, anchor = "middle" } = {}) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" ${FONT} font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(body)}</text>`;

function frame(spec, term, inner) {
  const title = `${term}: ${spec.title}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" data-visual-type="${spec.type}" data-visual-term="${esc(term)}" style="background:#ffffff"><title>${esc(title)}</title><rect width="${W}" height="${H}" fill="#ffffff"/>${inner}</svg>`;
}

const poly = (pts, fill, stroke = NAVY, sw = 1.5) =>
  `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;

// ── cubes (isometric) ─────────────────────────────────────────────────────────

function cubeAt(x, y, s) {
  const a = s * 0.866;
  const b = s * 0.5;
  return (
    poly(
      [
        [x, y],
        [x + a, y + b],
        [x, y + 2 * b],
        [x - a, y + b],
      ],
      TEAL_FILL,
      TEAL,
    ) +
    poly(
      [
        [x - a, y + b],
        [x, y + 2 * b],
        [x, y + 2 * b + s],
        [x - a, y + b + s],
      ],
      NAVY_FILL,
      NAVY,
    ) +
    poly(
      [
        [x, y + 2 * b],
        [x + a, y + b],
        [x + a, y + b + s],
        [x, y + 2 * b + s],
      ],
      "#cfe0f1",
      NAVY,
    )
  );
}

function drawCubes({ l, w, h }, s) {
  const a = s * 0.866;
  const b = s * 0.5;
  const ox = W / 2 - ((l - w) * a) / 2;
  const oy = 22 + (h - 1) * s;
  const cells = [];
  for (let k = 0; k < h; k += 1)
    for (let i = 0; i < l; i += 1) for (let j = 0; j < w; j += 1) cells.push({ i, j, k });
  cells.sort((p, q) => p.i + p.j - (q.i + q.j) || p.k - q.k);
  return cells.map(({ i, j, k }) => cubeAt(ox + (i - j) * a, oy + (i + j) * b - k * s, s)).join("");
}

// ── renderers: each takes (spec, term) and returns an <svg> string ─────────────

const RENDERERS = {
  "unit-cube": (spec, term) =>
    frame(
      spec,
      term,
      drawCubes({ l: 1, w: 1, h: 1 }, 40) + text(W / 2, 124, "1 cubic unit", { fill: NAVY }),
    ),

  "prism-cubes": (spec, term) => {
    const total = spec.l * spec.w * spec.h;
    return frame(
      spec,
      term,
      drawCubes(spec, 18) +
        text(W / 2, 124, `${spec.l} × ${spec.w} × ${spec.h} = ${total} cubic units`, {
          fill: NAVY,
        }),
    );
  },

  "area-grid": (spec, term) => {
    const cell = 24;
    const x0 = (W - spec.cols * cell) / 2;
    let g = "";
    for (let r = 0; r < spec.rows; r += 1)
      for (let c = 0; c < spec.cols; c += 1)
        g += `<rect x="${x0 + c * cell}" y="${10 + r * cell}" width="${cell}" height="${cell}" fill="${TEAL_FILL}" stroke="${TEAL}" stroke-width="1"/>`;
    return frame(
      spec,
      term,
      g +
        text(W / 2, 124, `${spec.cols} × ${spec.rows} = ${spec.cols * spec.rows} square units`, {
          fill: NAVY,
        }),
    );
  },

  "array-dots": (spec, term) => {
    const gap = 22;
    const x0 = (W - (spec.cols - 1) * gap) / 2;
    let g = "";
    for (let r = 0; r < spec.rows; r += 1)
      for (let c = 0; c < spec.cols; c += 1)
        g += `<circle cx="${x0 + c * gap}" cy="${22 + r * gap}" r="7" fill="${TEAL}"/>`;
    return frame(
      spec,
      term,
      g +
        text(W / 2, 124, `${spec.rows} rows of ${spec.cols} = ${spec.rows * spec.cols}`, {
          fill: NAVY,
        }),
    );
  },

  "perimeter-rect": (spec, term) => {
    const u = 22;
    const w = spec.w * u;
    const h = spec.h * u;
    const x0 = (W - w) / 2;
    const y0 = 26;
    const perimeter = 2 * (spec.w + spec.h);
    return frame(
      spec,
      term,
      `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${NAVY_FILL}" stroke="${AMBER}" stroke-width="3"/>` +
        text(W / 2, y0 - 6, `${spec.w}`) +
        text(W / 2, y0 + h + 14, `${spec.w}`) +
        text(x0 - 10, y0 + h / 2 + 4, `${spec.h}`) +
        text(x0 + w + 10, y0 + h / 2 + 4, `${spec.h}`) +
        text(
          W / 2,
          124,
          `${spec.w} + ${spec.h} + ${spec.w} + ${spec.h} = ${perimeter} units around`,
          { fill: NAVY },
        ),
    );
  },

  "number-line": (spec, term) => {
    const x0 = 24;
    const x1 = W - 24;
    const n = spec.max - spec.min;
    const px = (v) => x0 + ((v - spec.min) / n) * (x1 - x0);
    let g = `<line x1="${x0}" y1="62" x2="${x1}" y2="62" stroke="${NAVY}" stroke-width="2"/>`;
    for (let v = spec.min; v <= spec.max; v += 1)
      g += `<line x1="${px(v)}" y1="56" x2="${px(v)}" y2="68" stroke="${NAVY}" stroke-width="1.5"/>${text(px(v), 86, v, { size: 10, fill: MUTED })}`;
    for (const m of spec.marks)
      g += `<circle cx="${px(m)}" cy="62" r="6" fill="${AMBER}"/>${text(px(m), 46, m, { size: 11, fill: AMBER, weight: 700 })}`;
    return frame(
      spec,
      term,
      g + text(W / 2, 118, spec.note, { size: 10, fill: MUTED, weight: 500 }),
    );
  },

  "fraction-bar": (spec, term) => {
    const w = 240;
    const x0 = (W - w) / 2;
    let g = "";
    for (let i = 0; i < spec.d; i += 1)
      g += `<rect x="${x0 + (i * w) / spec.d}" y="30" width="${w / spec.d}" height="36" fill="${i < spec.n ? TEAL : "#ffffff"}" stroke="${NAVY}" stroke-width="1.5"/>`;
    return frame(
      spec,
      term,
      g +
        text(W / 2, 96, `${spec.n}/${spec.d}`, { size: 16, weight: 700, fill: NAVY }) +
        text(W / 2, 118, `${spec.n} of ${spec.d} equal parts shaded`, {
          size: 10,
          fill: MUTED,
          weight: 500,
        }),
    );
  },

  "ratio-tape": (spec, term) => {
    const u = 40;
    const x0 = 70;
    const row = (label, count, y, fill, stroke) =>
      text(36, y + 17, label, { size: 11, fill: MUTED }) +
      Array.from(
        { length: count },
        (_, i) =>
          `<rect x="${x0 + i * (u + 4)}" y="${y}" width="${u}" height="24" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`,
      ).join("");
    return frame(
      spec,
      term,
      row(spec.aLabel, spec.a, 30, NAVY_FILL, NAVY) +
        row(spec.bLabel, spec.b, 66, TEAL_FILL, TEAL) +
        text(W / 2, 114, `${spec.a} : ${spec.b}`, { size: 14, weight: 700, fill: AMBER }),
    );
  },

  shape: (spec, term) => {
    const cx = W / 2;
    const shapes = {
      triangle: poly(
        [
          [cx, 14],
          [cx + 56, 90],
          [cx - 56, 90],
        ],
        NAVY_FILL,
      ),
      rectangle: poly(
        [
          [cx - 64, 26],
          [cx + 64, 26],
          [cx + 64, 86],
          [cx - 64, 86],
        ],
        NAVY_FILL,
      ),
      parallelogram: poly(
        [
          [cx - 40, 26],
          [cx + 80, 26],
          [cx + 40, 86],
          [cx - 80, 86],
        ],
        NAVY_FILL,
      ),
      rhombus: poly(
        [
          [cx, 12],
          [cx + 56, 56],
          [cx, 100],
          [cx - 56, 56],
        ],
        NAVY_FILL,
      ),
      quadrilateral: poly(
        [
          [cx - 60, 30],
          [cx + 50, 18],
          [cx + 66, 88],
          [cx - 40, 96],
        ],
        NAVY_FILL,
      ),
      polygon: poly(
        [
          [cx, 12],
          [cx + 58, 54],
          [cx + 36, 98],
          [cx - 36, 98],
          [cx - 58, 54],
        ],
        NAVY_FILL,
      ),
      hexagon: poly(
        [
          [cx - 30, 16],
          [cx + 30, 16],
          [cx + 60, 56],
          [cx + 30, 96],
          [cx - 30, 96],
          [cx - 60, 56],
        ],
        NAVY_FILL,
      ),
      circle: `<circle cx="${cx}" cy="56" r="44" fill="${NAVY_FILL}" stroke="${NAVY}" stroke-width="1.5"/>`,
    };
    return frame(
      spec,
      term,
      shapes[spec.shape] + text(cx, 124, spec.note, { size: 10, fill: MUTED, weight: 500 }),
    );
  },

  "circle-part": (spec, term) => {
    const cx = W / 2;
    const cy = 56;
    const r = 44;
    const parts = {
      radius: `<line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${AMBER}" stroke-width="3"/>`,
      diameter: `<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${AMBER}" stroke-width="3"/>`,
      circumference: `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${AMBER}" stroke-width="4"/>`,
    };
    return frame(
      spec,
      term,
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${NAVY_FILL}" stroke="${NAVY}" stroke-width="1.5"/><circle cx="${cx}" cy="${cy}" r="2.5" fill="${NAVY}"/>${parts[spec.part]}` +
        text(cx, 124, spec.note, { size: 10, fill: MUTED, weight: 500 }),
    );
  },

  lines: (spec, term) => {
    const g = {
      parallel: `<line x1="60" y1="40" x2="260" y2="40" stroke="${NAVY}" stroke-width="3"/><line x1="60" y1="80" x2="260" y2="80" stroke="${TEAL}" stroke-width="3"/>`,
      perpendicular: `<line x1="100" y1="90" x2="240" y2="90" stroke="${NAVY}" stroke-width="3"/><line x1="170" y1="90" x2="170" y2="14" stroke="${TEAL}" stroke-width="3"/><polyline points="170,76 184,76 184,90" fill="none" stroke="${AMBER}" stroke-width="2"/>`,
      angle: `<polyline points="230,30 100,90 240,90" fill="none" stroke="${NAVY}" stroke-width="3"/><path d="M 140 90 A 40 40 0 0 0 128 66" fill="none" stroke="${AMBER}" stroke-width="2.5"/>`,
    }[spec.line];
    return frame(
      spec,
      term,
      g + text(W / 2, 124, spec.note, { size: 10, fill: MUTED, weight: 500 }),
    );
  },

  "data-center": (spec, term) => {
    const sorted = [...spec.data].sort((p, q) => p - q);
    const median = sorted[Math.floor(sorted.length / 2)];
    const mean = sorted.reduce((s, v) => s + v, 0) / sorted.length;
    const x0 = 40;
    const x1 = W - 40;
    const lo = 0;
    const hi = 8;
    const px = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
    const seen = {};
    let g = `<line x1="${x0}" y1="90" x2="${x1}" y2="90" stroke="${NAVY}" stroke-width="2"/>`;
    for (let v = lo; v <= hi; v += 1) g += text(px(v), 106, v, { size: 10, fill: MUTED });
    for (const v of sorted) {
      seen[v] = (seen[v] || 0) + 1;
      g += `<circle cx="${px(v)}" cy="${84 - seen[v] * 14}" r="6" fill="${TEAL}"/>`;
    }
    const mark = spec.stat === "median" ? median : mean;
    g += `<line x1="${px(mark)}" y1="14" x2="${px(mark)}" y2="90" stroke="${AMBER}" stroke-width="2" stroke-dasharray="4 3"/>`;
    return frame(
      spec,
      term,
      g +
        text(W / 2, 124, `data ${sorted.join(", ")} · ${spec.stat} = ${mark}`, {
          size: 10,
          fill: NAVY,
        }),
    );
  },

  "coord-plane": (spec, term) => {
    const x0 = 80;
    const y0 = 66;
    const u = 14;
    let g = `<line x1="40" y1="${y0}" x2="${W - 40}" y2="${y0}" stroke="${NAVY}" stroke-width="2"/><line x1="${x0 + 80}" y1="8" x2="${x0 + 80}" y2="124" stroke="${NAVY}" stroke-width="2"/>`;
    const ox = x0 + 80;
    g += `<circle cx="${ox}" cy="${y0}" r="3" fill="${NAVY}"/>`;
    g += `<circle cx="${ox + spec.x * u}" cy="${y0 - spec.y * u}" r="6" fill="${AMBER}"/>`;
    g += text(ox + spec.x * u + 8, y0 - spec.y * u - 10, `(${spec.x}, ${spec.y})`, {
      size: 11,
      fill: AMBER,
      weight: 700,
      anchor: "start",
    });
    g += text(ox + 4, y0 + 14, "(0, 0)", { size: 9, fill: MUTED, anchor: "start" });
    g += text(W - 36, y0 - 6, "x", { size: 11, fill: NAVY });
    g += text(ox + 10, 16, "y", { size: 11, fill: NAVY, anchor: "start" });
    return frame(spec, term, g);
  },
};

// ── specs: term -> what to draw ───────────────────────────────────────────────

const RATIO = (title) => ({
  type: "ratio-tape",
  a: 3,
  b: 2,
  aLabel: "Part A",
  bLabel: "Part B",
  title,
});
const FRACTION = (n, d) => ({
  type: "fraction-bar",
  n,
  d,
  title: `${n} of ${d} equal parts shaded`,
});
const SHAPE = (shape, note) => ({ type: "shape", shape, note, title: note });

export const VISUAL_SPECS = Object.freeze({
  "cubic unit": { type: "unit-cube", title: "one unit cube, the unit of volume" },
  cube: { type: "unit-cube", title: "a cube" },
  volume: {
    type: "prism-cubes",
    l: 3,
    w: 2,
    h: 2,
    title: "a 3 by 2 by 2 prism built from unit cubes",
  },
  prism: {
    type: "prism-cubes",
    l: 3,
    w: 2,
    h: 2,
    title: "a rectangular prism built from unit cubes",
  },
  area: {
    type: "area-grid",
    cols: 4,
    rows: 3,
    title: "a 4 by 3 rectangle covered by square units",
  },
  array: { type: "array-dots", rows: 3, cols: 4, title: "3 rows of 4 dots" },
  perimeter: {
    type: "perimeter-rect",
    w: 4,
    h: 3,
    title: "the distance around a 4 by 3 rectangle",
  },
  "number line": {
    type: "number-line",
    min: 0,
    max: 10,
    marks: [3],
    note: "Each tick is one unit; the dot sits at 3.",
    title: "a number line from 0 to 10 with 3 marked",
  },
  integer: {
    type: "number-line",
    min: -4,
    max: 4,
    marks: [-3, 3],
    note: "Integers include negatives, zero and positives.",
    title: "integers from -4 to 4 with -3 and 3 marked",
  },
  opposite: {
    type: "number-line",
    min: -4,
    max: 4,
    marks: [-3, 3],
    note: "-3 and 3 are the same distance from 0.",
    title: "opposites -3 and 3 on a number line",
  },
  fraction: FRACTION(3, 4),
  "unit fraction": FRACTION(1, 4),
  numerator: FRACTION(3, 4),
  denominator: FRACTION(3, 4),
  half: FRACTION(1, 2),
  fourth: FRACTION(1, 4),
  tenth: FRACTION(1, 10),
  ratio: RATIO("a 3 to 2 ratio drawn as two tapes"),
  ratios: RATIO("a 3 to 2 ratio drawn as two tapes"),
  "equivalent ratio": RATIO("a 3 to 2 ratio drawn as two tapes"),
  "equivalent ratios": RATIO("a 3 to 2 ratio drawn as two tapes"),
  triangle: SHAPE("triangle", "3 sides, 3 corners"),
  rectangle: SHAPE("rectangle", "4 sides, 4 right angles"),
  parallelogram: SHAPE("parallelogram", "2 pairs of parallel sides"),
  rhombus: SHAPE("rhombus", "4 sides of equal length"),
  quadrilateral: SHAPE("quadrilateral", "any shape with 4 sides"),
  polygon: SHAPE("polygon", "a closed shape made of straight sides"),
  hexagon: SHAPE("hexagon", "6 sides, 6 corners"),
  circle: SHAPE("circle", "every point is the same distance from the center"),
  radius: {
    type: "circle-part",
    part: "radius",
    note: "radius: center to the edge",
    title: "the radius of a circle",
  },
  diameter: {
    type: "circle-part",
    part: "diameter",
    note: "diameter: edge to edge through the center",
    title: "the diameter of a circle",
  },
  circumference: {
    type: "circle-part",
    part: "circumference",
    note: "circumference: the distance around",
    title: "the circumference of a circle",
  },
  parallel: {
    type: "lines",
    line: "parallel",
    note: "parallel lines never meet",
    title: "two parallel lines",
  },
  perpendicular: {
    type: "lines",
    line: "perpendicular",
    note: "perpendicular lines meet at a right angle",
    title: "two perpendicular lines",
  },
  angle: {
    type: "lines",
    line: "angle",
    note: "an angle is formed where two rays meet",
    title: "an angle between two rays",
  },
  median: {
    type: "data-center",
    stat: "median",
    data: [2, 3, 3, 5, 7],
    title: "the median of a small data set",
  },
  mean: {
    type: "data-center",
    stat: "mean",
    data: [2, 3, 3, 5, 7],
    title: "the mean of a small data set",
  },
  origin: {
    type: "coord-plane",
    x: 3,
    y: 2,
    title: "the origin and the point (3, 2) on a coordinate plane",
  },
  axis: { type: "coord-plane", x: 3, y: 2, title: "the x-axis and y-axis with the point (3, 2)" },
  coordinate: {
    type: "coord-plane",
    x: 3,
    y: 2,
    title: "the coordinate pair (3, 2) on a coordinate plane",
  },
  quadrant: { type: "coord-plane", x: 3, y: 2, title: "a point in the first quadrant" },
});

/** The visual spec for a term, or null when no honest diagram exists. */
export function visualSpecFor(term) {
  return (
    VISUAL_SPECS[
      String(term || "")
        .trim()
        .toLowerCase()
    ] || null
  );
}

/**
 * An <svg> for the term, or "" when it has no spec (the caller then shows the cue text).
 * Specs are mathematics, so they apply only inside Math units: "origin", "coordinate",
 * "parallel" and "volume" mean other things in ELA, Science and Social Studies.
 */
export function renderConceptVisual(term, subject) {
  if (String(subject || "").toLowerCase() !== "math") return "";
  const spec = visualSpecFor(term);
  if (!spec) return "";
  return RENDERERS[spec.type](spec, String(term).trim());
}

/** The first vocabulary term of a Math unit that has an honest diagram, or "" (no diagram at all). */
export function unitConceptVisual(vocabTerms, subject) {
  for (const term of vocabTerms || []) {
    const svg = renderConceptVisual(term, subject);
    if (svg) return svg;
  }
  return "";
}
