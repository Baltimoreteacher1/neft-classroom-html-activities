/**
 * projects-gallery-art.mjs — one original, hand-drawn SVG scene per project FAMILY.
 *
 * Every picture draws real values (a 30 / 8 seating plan, a 25%-off tag, a net whose faces
 * add to 40, two lines that cross at (2, 28) ...), so the illustration is also a worked
 * example. Pure: returns strings; the generator inlines them as <symbol>s, one per family,
 * and each card references its family with <use>. Colour: palette hex values, plus the
 * unit accent through `--art-accent` (set on the card from the unit's `--unit-N` token).
 * Alt text lives in ALT; labels inside the drawing are not read separately.
 */
const INK = "#142c3b";
const PAPER = "#fffdf6";
const SOFT = "#fce8dc";
const LIME = "#e4efbb";
const ORANGE = "#b53e20";
const BLUE = "#124f7a";
const GRID = "#d5dcd6";
const ACC = "var(--art-accent,#14594f)";

const f = (n) => Number(n.toFixed(2));
/** Shapes inherit stroke from the wrapper; texts opt out of it. */
const rect = (x, y, w, h, extra = "") =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" ${extra}/>`;
const circle = (x, y, r, extra = "") => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" ${extra}/>`;
const line = (x1, y1, x2, y2, extra = "") =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${extra}/>`;
const path = (d, extra = "") => `<path d="${d}" ${extra}/>`;
const text = (x, y, s, { anchor = "middle", size = 13, fill = INK, weight = 700 } = {}) =>
  `<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}" stroke="none">${s}</text>`;
const accentFill = (op = 0.22) => `style="fill:${ACC};fill-opacity:${op}"`;
const accentStroke = `style="stroke:${ACC}"`;

const frame = (inner) =>
  `<rect width="320" height="180" rx="14" fill="${PAPER}" stroke="none"/><g fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" font-family="'Atkinson Hyperlegible',system-ui,sans-serif">${inner}</g>`;

/* ---- division: 30 guests, 8 seats a table; 2.5 m ribbon, 0.5 m pieces ---- */
function division() {
  const tables = [44, 116, 188, 260];
  let out = text(160, 22, "30 ÷ 8 = 3 R 6", { size: 16 });
  tables.forEach((cx, t) => {
    out += circle(cx, 66, 15, `fill="${LIME}"`);
    const seats = t < 3 ? 8 : 6;
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4 - Math.PI / 2;
      const x = cx + 25 * Math.cos(a);
      const y = 66 + 25 * Math.sin(a);
      const used = k < seats;
      out += circle(
        x,
        y,
        5,
        used
          ? t === 3
            ? `fill="${ORANGE}" stroke="${ORANGE}"`
            : `fill="${INK}"`
          : `stroke-dasharray="2 3" stroke-width="1.5"`,
      );
    }
  });
  out += text(160, 109, "3 full tables + 6 guests need a 4th", { size: 12, weight: 600 });
  for (let i = 0; i < 5; i++)
    out += rect(22 + i * 55.2, 122, 55.2, 20, `fill="${i % 2 ? SOFT : PAPER}" ${accentStroke}`);
  out += text(160, 160, "ribbon: 2.5 ÷ 0.5 = 5 pieces", { size: 13 });
  return out;
}

/* ---- statistics: dot plot of 8 9 9 10 11 15 ---- */
function statistics() {
  const x = (v) => 30 + (v - 6) * 27;
  let out = text(160, 22, "6 build times, in minutes", { size: 14 });
  out += line(24, 140, 300, 140);
  for (let v = 6; v <= 16; v++) {
    out += line(x(v), 136, x(v), 144, `stroke-width="1.5"`);
    if (v % 2 === 0) out += text(x(v), 159, String(v), { size: 12 });
  }
  const data = [8, 9, 9, 10, 11, 15];
  const seen = {};
  for (const v of data) {
    seen[v] = (seen[v] || 0) + 1;
    out += circle(x(v), 140 - 9 - (seen[v] - 1) * 17, 7.5, `fill="${LIME}"`);
  }
  out += line(x(9.5), 74, x(9.5), 138, `stroke="${ORANGE}" stroke-dasharray="5 4"`);
  out += path(
    `M${x(62 / 6) - 8},66 L${x(62 / 6) + 8},66 L${x(62 / 6)},80 Z`,
    `fill="${BLUE}" stroke="${BLUE}"`,
  );
  out += path("M36,44 l10,0 l-5,10 z", `fill="${BLUE}" stroke="${BLUE}"`);
  out += text(54, 54, "mean 10.3", { anchor: "start", size: 12 });
  out += line(150, 44, 150, 56, `stroke="${ORANGE}" stroke-dasharray="4 3"`);
  out += text(158, 54, "median 9.5", { anchor: "start", size: 12 });
  return out;
}

/* ---- ratio: smoothie 2 berry : 3 banana, scaled by 2 ---- */
function ratio() {
  let out = path(
    "M20,48 L80,48 L72,132 Q70,138 64,138 L36,138 Q30,138 28,132 Z",
    `fill="${PAPER}"`,
  );
  out += path(
    "M24,70 L76,70 L72,132 Q70,138 64,138 L36,138 Q30,138 28,132 Z",
    `${accentFill(0.35)}`,
  );
  out += path("M58,48 L66,22 L74,22", "");
  out += text(50, 106, "2 : 3", { size: 15 });
  const u = 26;
  const x0 = 150;
  out += text(x0 - 8, 68, "berry", { anchor: "end", size: 12, weight: 600 });
  out += text(x0 - 8, 106, "banana", { anchor: "end", size: 12, weight: 600 });
  for (let i = 0; i < 4; i++) out += rect(x0 + i * u, 50, u, 26, `fill="${SOFT}"`);
  for (let i = 0; i < 6; i++) out += rect(x0 + i * u, 88, u, 26, `fill="${LIME}"`);
  out += line(x0 + 2 * u, 46, x0 + 2 * u, 80, `stroke="${ORANGE}" stroke-width="4"`);
  out += line(x0 + 3 * u, 84, x0 + 3 * u, 118, `stroke="${ORANGE}" stroke-width="4"`);
  out += text(x0 + u, 40, "batch 1", { size: 11 });
  out += text(x0 + 3 * u, 40, "batch 2", { size: 11 });
  out += text(230, 148, "2 : 3  =  4 : 6", { size: 16 });
  out += text(230, 168, "same flavor, bigger batch", { size: 11, weight: 600 });
  return out;
}

/* ---- percent: $60 at 25% off, then 4% tax ---- */
function percent() {
  let out = path("M18,46 L112,46 L134,74 L112,102 L18,102 Z", `fill="${SOFT}"`);
  out += circle(32, 74, 5, `fill="${PAPER}"`);
  out += text(80, 82, "$60", { size: 24 });
  out += text(165, 44, "$60 in 4 equal parts", { anchor: "start", size: 12, weight: 600 });
  for (let i = 0; i < 4; i++)
    out += rect(165 + i * 35, 52, 35, 30, i === 0 ? accentFill(0.3) : `fill="${PAPER}"`);
  for (let i = 0; i < 4; i++) out += text(182.5 + i * 35, 72, "$15", { size: 12 });
  out += text(182.5, 100, "25%", { size: 13, fill: ORANGE });
  out += line(182.5, 84, 182.5, 90, `stroke="${ORANGE}" stroke-width="2"`);
  out += text(160, 128, "$60 − $15 = $45", { size: 15 });
  out += text(160, 152, "+ 4% tax ($1.80) = $46.80", { size: 13 });
  return out;
}

/* ---- area: 6 x 4 m room plus a triangle with base 3 m, height 2 m ---- */
function area() {
  const u = 16;
  let out = "";
  out += rect(40, 84, 6 * u, 4 * u, `fill="${LIME}"`);
  for (let i = 1; i < 6; i++)
    out += line(40 + i * u, 84, 40 + i * u, 148, `stroke="${GRID}" stroke-width="1"`);
  for (let j = 1; j < 4; j++)
    out += line(40, 84 + j * u, 136, 84 + j * u, `stroke="${GRID}" stroke-width="1"`);
  out += rect(40, 84, 6 * u, 4 * u, "");
  out += path("M40,84 L88,84 L40,52 Z", `fill="${SOFT}"`);
  out += text(88, 166, "6 m", { size: 12 });
  out += text(144, 120, "4 m", { anchor: "start", size: 12 });
  out += text(34, 74, "2 m", { anchor: "end", size: 12 });
  out += line(40, 92, 88, 92, `stroke-width="1.5"`);
  out += line(40, 88, 40, 96, `stroke-width="1.5"`);
  out += line(88, 88, 88, 96, `stroke-width="1.5"`);
  out += text(64, 107, "3 m", { size: 11 });
  out += text(190, 62, "rectangle", { anchor: "start", size: 12, weight: 600 });
  out += text(190, 80, "6 × 4 = 24", { anchor: "start", size: 15 });
  out += text(190, 106, "triangle", { anchor: "start", size: 12, weight: 600 });
  out += text(190, 124, "½ × 3 × 2 = 3", { anchor: "start", size: 15 });
  out += line(190, 134, 300, 134, `stroke-width="1.5"`);
  out += text(190, 156, "24 + 3 = 27 m²", { anchor: "start", size: 16, fill: ORANGE });
  return out;
}

/* ---- expressions: score = 3t + 2 with t = 3 ---- */
function expressions() {
  let out = text(160, 24, "score = 3t + 2", { size: 16 });
  for (let g = 0; g < 3; g++) {
    for (let k = 0; k < 3; k++)
      out += rect(26 + g * 80 + k * 22, 44, 18, 18, g === 1 ? accentFill(0.3) : `fill="${LIME}"`);
  }
  out += circle(272, 53, 8, `fill="${SOFT}"`);
  out += circle(294, 53, 8, `fill="${SOFT}"`);
  out += text(76, 82, "3 levels × 3 points", { size: 12, weight: 600 });
  out += text(283, 82, "+ 2 bonus", { size: 12, weight: 600 });
  const cols = [150, 190, 230, 270];
  out += rect(cols[2] - 18, 96, 36, 62, accentFill(0.25) + ` stroke-width="1.5"`);
  out += text(100, 116, "t", { size: 13 });
  out += text(100, 146, "3t + 2", { size: 13 });
  out += line(80, 126, 296, 126, `stroke-width="1.5"`);
  [1, 2, 3, 4].forEach((t, i) => {
    out += text(cols[i], 116, String(t), { size: 14 });
    out += text(cols[i], 146, String(3 * t + 2), { size: 14 });
  });
  return out;
}

/* ---- coordinates: A(-3, 2) reflected over the y-axis to A'(3, 2), then down to B(3, -3) ---- */
function coordinates() {
  const cx = 110;
  const cy = 94;
  const u = 17;
  const X = (v) => cx + u * v;
  const Y = (v) => cy - u * v;
  let out = "";
  for (let k = -4; k <= 4; k++) {
    out += line(X(k), Y(-4), X(k), Y(4), `stroke="${GRID}" stroke-width="1"`);
    out += line(X(-4), Y(k), X(4), Y(k), `stroke="${GRID}" stroke-width="1"`);
  }
  out += line(X(-4.6), Y(0), X(4.6), Y(0), `stroke-width="2"`);
  out += line(X(0), Y(-4.6), X(0), Y(4.6), `stroke-width="2"`);
  out += path(
    `M${X(4.6) - 6},${Y(0) - 4} L${X(4.6)},${Y(0)} L${X(4.6) - 6},${Y(0) + 4}`,
    `stroke-width="2"`,
  );
  out += path(
    `M${X(0) - 4},${Y(4.6) + 6} L${X(0)},${Y(4.6)} L${X(0) + 4},${Y(4.6) + 6}`,
    `stroke-width="2"`,
  );
  out += line(X(-3), Y(2), X(3), Y(2), `stroke="${ORANGE}" stroke-dasharray="5 4"`);
  out += line(X(3), Y(2), X(3), Y(-3), accentStroke);
  out += circle(X(-3), Y(2), 5, `fill="${INK}"`);
  out += circle(X(3), Y(2), 5, `fill="${ORANGE}" stroke="${ORANGE}"`);
  out += circle(X(3), Y(-3), 5, `fill="${BLUE}" stroke="${BLUE}"`);
  out += text(X(-3) - 2, Y(2) - 9, "A", { size: 12 });
  out += text(X(3) + 12, Y(2) - 4, "A′", { size: 12 });
  out += text(X(3) + 12, Y(-3) + 4, "B", { size: 12 });
  out += text(206, 50, "A(−3, 2)", { anchor: "start", size: 14 });
  out += text(206, 74, "A′(3, 2)", { anchor: "start", size: 14, fill: ORANGE });
  out += text(206, 98, "B(3, −3)", { anchor: "start", size: 14, fill: BLUE });
  out += text(206, 128, "|−3| + |3| = 6", { anchor: "start", size: 13 });
  out += text(206, 148, "2 − (−3) = 5", { anchor: "start", size: 13 });
  return out;
}

/* ---- equations: 2x + 5 = 17 on a tape, lock opens at x = 6 ---- */
function equations() {
  let out = path("M46,82 L46,64 A24,24 0 0 1 94,64 L94,82", "");
  out += rect(30, 82, 80, 66, `fill="${SOFT}"`);
  out += circle(70, 108, 7, `fill="${INK}"`);
  out += path("M70,114 L70,134", `stroke-width="4"`);
  const w = 165 / 17;
  out += path("M135,64 L135,58 L300,58 L300,64", "");
  out += text(217, 50, "17", { size: 15 });
  out += rect(135, 68, 6 * w, 30, `fill="${LIME}"`);
  out += rect(135 + 6 * w, 68, 6 * w, 30, `fill="${LIME}"`);
  out += rect(135 + 12 * w, 68, 5 * w, 30, accentFill(0.3));
  out += text(135 + 3 * w, 89, "x", { size: 15 });
  out += text(135 + 9 * w, 89, "x", { size: 15 });
  out += text(135 + 14.5 * w, 89, "5", { size: 15 });
  out += text(217, 126, "2x + 5 = 17", { size: 17 });
  out += text(217, 148, "x = 6, since 2 · 6 + 5 = 17", { size: 12, weight: 600 });
  return out;
}

/* ---- relationships: pass A 4 + 12h, pass B 12 + 8h cross at (2, 28) ---- */
function relationships() {
  const ox = 38;
  const oy = 150;
  const X = (h) => ox + h * 26;
  const Y = (d) => oy - d * 1.4;
  let out = line(ox, oy, X(6.4), oy) + line(ox, oy, ox, Y(82));
  for (const h of [2, 4, 6]) {
    out += line(X(h), oy - 4, X(h), oy + 4, `stroke-width="1.5"`);
    out += text(X(h), oy + 17, String(h), { size: 11 });
  }
  for (const d of [40, 80]) {
    out += line(ox - 4, Y(d), ox + 4, Y(d), `stroke-width="1.5"`);
    out += text(ox - 8, Y(d) + 4, `$${d}`, { anchor: "end", size: 11 });
  }
  out += text(X(3), oy + 17, "hours", { size: 11, weight: 600 }).replace(
    `x="${f(X(3))}"`,
    `x="${f(X(5))}"`,
  );
  out += line(X(0), Y(4), X(6), Y(76), `stroke="${ORANGE}" stroke-width="3"`);
  out += line(X(0), Y(12), X(6), Y(60), `stroke="${BLUE}" stroke-width="3"`);
  out += circle(X(2), Y(28), 6, `fill="${PAPER}"`);
  out += line(X(2), Y(28), X(2), oy, `stroke-width="1.5" stroke-dasharray="3 3"`);
  out += line(64, 24, 84, 24, `stroke="${ORANGE}" stroke-width="3"`);
  out += text(90, 28, "A: 4 + 12h", { anchor: "start", size: 12 });
  out += line(64, 42, 84, 42, `stroke="${BLUE}" stroke-width="3"`);
  out += text(90, 46, "B: 12 + 8h", { anchor: "start", size: 12 });
  out += text(266, 78, "at 2 hours", { size: 12, weight: 600 });
  out += text(266, 100, "A = $28", { size: 15, fill: ORANGE });
  out += text(266, 122, "B = $28", { size: 15, fill: BLUE });
  out += text(266, 144, "same cost", { size: 12, weight: 600 });
  return out;
}

/* ---- solids: open box 4 x 3 x 2: net faces 12 + 16 + 12 = 40, volume 24 ---- */
function solids() {
  const u = 15;
  let out = rect(60, 70, 4 * u, 3 * u, `fill="${LIME}"`);
  out += rect(60, 40, 4 * u, 2 * u, `fill="${SOFT}"`);
  out += rect(60, 70 + 3 * u, 4 * u, 2 * u, `fill="${SOFT}"`);
  out += rect(30, 70, 2 * u, 3 * u, accentFill(0.25));
  out += rect(60 + 4 * u, 70, 2 * u, 3 * u, accentFill(0.25));
  out += text(90, 96, "4 × 3", { size: 13 });
  out += text(90, 59, "4 × 2", { size: 12 });
  out += text(90, 134, "4 × 2", { size: 12 });
  out += text(45, 96, "3×2", { size: 11 });
  out += text(135, 96, "3×2", { size: 11 });
  out += rect(196, 92, 60, 30, `fill="${SOFT}"`);
  out += path("M256,92 L280,76 L280,106 L256,122 Z", accentFill(0.25));
  out += path("M196,92 L220,76 L280,76 L256,92", `stroke-dasharray="4 3" stroke-width="2"`);
  out += text(236, 150, "V = 4 × 3 × 2 = 24", { size: 13 });
  out += text(236, 169, "5 faces: 12 + 16 + 12 = 40", { size: 12, weight: 600 });
  return out;
}

/* ---- discovery: stage n has 3n + 1 tiles ---- */
function discovery() {
  let out = text(160, 24, "tiles = 3n + 1", { size: 16 });
  const xs = [28, 66, 118, 190];
  [1, 2, 3, 4].forEach((n, i) => {
    for (let c = 0; c < n; c++)
      for (let r = 0; r < 3; r++)
        out += rect(xs[i] + c * 17, 62 + r * 17, 15, 15, `fill="${LIME}"`);
    out += rect(xs[i], 45, 15, 15, accentFill(0.45));
    out += text(xs[i] + (n * 17 - 2) / 2, 128, `Stage ${n}`, { size: 12, weight: 600 });
    out += text(xs[i] + (n * 17 - 2) / 2, 150, String(3 * n + 1), { size: 16 });
  });
  out += text(160, 172, "each stage adds a column of 3", { size: 11, weight: 600 });
  return out;
}

/* ---- synthesis: space (8 x 5 = 40), price (25% off $24 = $18), growth (y = 3x) ---- */
function synthesis() {
  let out = "";
  [12, 112, 212].forEach((x0) => {
    out += rect(x0, 10, 96, 160, `stroke-width="1.5" fill="none"`);
  });
  out += text(60, 30, "space", { size: 13 });
  out += text(160, 30, "price", { size: 13 });
  out += text(260, 30, "growth", { size: 13 });
  out += rect(28, 50, 64, 40, `fill="${LIME}"`);
  for (let i = 1; i < 8; i++)
    out += line(28 + i * 8, 50, 28 + i * 8, 90, `stroke="${GRID}" stroke-width="1"`);
  for (let j = 1; j < 5; j++)
    out += line(28, 50 + j * 8, 92, 50 + j * 8, `stroke="${GRID}" stroke-width="1"`);
  out += rect(28, 50, 64, 40, "");
  out += text(60, 112, "8 × 5 = 40", { size: 13 });
  out += text(60, 138, "units²", { size: 12, weight: 600 });
  for (let i = 0; i < 4; i++)
    out += rect(124 + i * 18, 52, 18, 26, i === 0 ? accentFill(0.3) : `fill="${PAPER}"`);
  out += text(160, 46, "$24", { size: 12 });
  out += text(160, 100, "25% = $6", { size: 12, fill: ORANGE });
  out += text(160, 122, "$24 − $6", { size: 13 });
  out += text(160, 142, "= $18", { size: 14 });
  const ox = 230;
  const oy = 140;
  out += line(ox, oy, 300, oy, "") + line(ox, oy, ox, 46, "");
  out += line(ox, oy, ox + 56, oy - 84, `stroke="${ORANGE}" stroke-width="3"`);
  out += circle(ox + 56, oy - 84, 4, `fill="${ORANGE}" stroke="${ORANGE}"`);
  out += text(ox + 50, oy - 94, "(4, 12)", { anchor: "end", size: 11 });
  out += text(260, 160, "y = 3x", { size: 13 });
  return out;
}

const FAMILY_ART = {
  division,
  statistics,
  ratio,
  percent,
  area,
  expressions,
  coordinates,
  equations,
  relationships,
  solids,
  discovery,
  synthesis,
};

/** Accessible name and long description for each drawing (the drawing's own labels are not read). */
export const ART_ALT = {
  division: [
    "Division seating and ribbon plan",
    "Four round tables with eight seats each; thirty guests fill three tables and six sit at a fourth. A ribbon strip below is cut into five pieces of one half meter each.",
  ],
  statistics: [
    "Dot plot with mean and median",
    "A dot plot of six build times: 8, 9, 9, 10, 11 and 15 minutes, with the median marked at 9.5 and the mean at about 10.3.",
  ],
  ratio: [
    "Smoothie ratio cup and double tape diagram",
    "A cup and two tape rows: two berry parts to three banana parts, scaled by two to four berry parts to six banana parts.",
  ],
  percent: [
    "Price tag with a 25 percent discount",
    "A sixty dollar price tag next to a bar cut into four fifteen dollar parts, one shaded for 25 percent. Sixty minus fifteen is forty-five; four percent tax adds one eighty.",
  ],
  area: [
    "Floor plan with a rectangle and a triangle",
    "A room six meters by four meters with a triangle of base three and height two. Areas: 24, plus 3, makes 27 square meters.",
  ],
  expressions: [
    "Game score rule 3t plus 2",
    "Three groups of three squares plus two bonus circles show 3t + 2 at t = 3, and a table gives scores 5, 8, 11 and 14 for t from 1 to 4.",
  ],
  coordinates: [
    "Coordinate plane map with a reflection",
    "A coordinate grid with point A at negative three, two reflected across the y-axis to A prime at three, two, and point B at three, negative three.",
  ],
  equations: [
    "Lock puzzle and tape diagram for 2x plus 5 equals 17",
    "A padlock beside a tape of two x parts and a 5 part totaling 17, so x is 6.",
  ],
  relationships: [
    "Two pass prices crossing on a graph",
    "A graph of pass A, 4 plus 12 per hour, and pass B, 12 plus 8 per hour. The lines cross at 2 hours where both cost 28 dollars.",
  ],
  solids: [
    "Net of an open box with its volume",
    "A cross-shaped net of an open box four by three by two, with face areas 12, 16 and 12 adding to 40, and a drawing of the box with volume 24.",
  ],
  discovery: [
    "Growing tile pattern",
    "Four stages of a tile pattern with 4, 7, 10 and 13 tiles: three rows of n columns plus one tile, so 3n plus 1.",
  ],
  synthesis: [
    "Space, price and growth in one plan",
    "Three panels: a park of eight by five units, a twenty-four dollar price cut by 25 percent to eighteen, and a line y equals 3x through (4, 12).",
  ],
};

export const ART_FAMILIES = Object.keys(FAMILY_ART);

/** The sprite: one <symbol> per family, in a zero-size inline SVG. */
export function artSprite() {
  const symbols = ART_FAMILIES.map(
    (k) => `<symbol id="pg-art-${k}" viewBox="0 0 320 180">${frame(FAMILY_ART[k]())}</symbol>`,
  ).join("");
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${symbols}</defs></svg>`;
}

/** An accessible picture of one family. `sizeClass` lets CSS size the card and dialog copies. */
export function artFigure(family, className, uid) {
  const [name, desc] = ART_ALT[family];
  const id = `${className}-${uid}`;
  return `<svg class="${className}" viewBox="0 0 320 180" role="img" aria-labelledby="${id}-t ${id}-d"><title id="${id}-t">${name}</title><desc id="${id}-d">${desc}</desc><use href="#pg-art-${family}"/></svg>`;
}
