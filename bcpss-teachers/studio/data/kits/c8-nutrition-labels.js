// Shared data and pictures for the grade 5 nutrition label lesson (worker c8).
// The two snacks are invented for this lesson. Every % Daily Value is computed from the FDA Daily Values for a 2,000 calorie day
// (total fat 78 g, saturated fat 20 g, sodium 2300 mg, carbohydrate 275 g, fiber 28 g, added sugars 50 g) and rounded.

export const DV = { fat: 78, satFat: 20, sodium: 2300, carb: 275, fiber: 28, added: 50 };
export const pct = (amount, daily) => Math.round((amount / daily) * 100);

const mk = (name, per, size, cal, fat, sat, sodium, carb, fiber, sugars, added, protein) => ({
  name,
  servings: per,
  size,
  cal,
  rows: [
    { t: `Total Fat ${fat}g`, dv: `${pct(fat, DV.fat)}%`, ind: 0 },
    { t: `Saturated Fat ${sat}g`, dv: `${pct(sat, DV.satFat)}%`, ind: 1 },
    { t: `Sodium ${sodium}mg`, dv: `${pct(sodium, DV.sodium)}%`, ind: 0 },
    { t: `Total Carbohydrate ${carb}g`, dv: `${pct(carb, DV.carb)}%`, ind: 0 },
    { t: `Dietary Fiber ${fiber}g`, dv: `${pct(fiber, DV.fiber)}%`, ind: 1 },
    { t: `Total Sugars ${sugars}g`, dv: "", ind: 1 },
    { t: `Includes ${added}g Added Sugars`, dv: `${pct(added, DV.added)}%`, ind: 2 },
    { t: `Protein ${protein}g`, dv: "", ind: 0 },
  ],
});

export const SNACK_A = mk("Crunchy Oat Rounds", 6, "1 cup (40g)", 150, 2, 0, 190, 32, 4, 6, 5, 4);
export const SNACK_B = mk("Berry Pop Bites", 4, "3/4 cup (35g)", 140, 1, 0, 160, 31, 1, 18, 17, 1);

// Row indexes used for hotspots and regions.
export const ROW = {
  fat: 0,
  sat: 1,
  sodium: 2,
  carb: 3,
  fiber: 4,
  sugars: 5,
  added: 6,
  protein: 7,
};
export const rowY = (i) => 200 + 22 * i;

const text = (x, y, s, size, weight = 400, anchor = "start") => ({
  t: "text",
  x,
  y,
  text: s,
  size,
  weight,
  anchor,
});
const rule = (x1, y, x2, sw) => ({ t: "line", x1, y1: y, x2, y2: y, stroke: "ink", sw });

/** Shape primitives for one Nutrition Facts label, 320 by 420, placed at (ox, oy). */
export function labelItems(d, ox = 0, oy = 0) {
  const X = (x) => x + ox;
  const Y = (y) => y + oy;
  const items = [
    { t: "rect", x: X(4), y: Y(4), w: 312, h: 412, rx: 6, fill: "paper", stroke: "ink", sw: 3 },
    text(X(14), Y(36), "Nutrition Facts", 26, 700),
    rule(X(10), Y(48), X(310), 3),
    text(X(14), Y(66), `${d.servings} servings per container`, 14),
    text(X(14), Y(90), "Serving size", 15, 700),
    text(X(306), Y(90), d.size, 15, 700, "end"),
    rule(X(10), Y(100), X(310), 9),
    text(X(14), Y(118), "Amount per serving", 12, 700),
    text(X(14), Y(143), "Calories", 24, 700),
    text(X(306), Y(143), String(d.cal), 32, 700, "end"),
    rule(X(10), Y(156), X(310), 5),
    text(X(306), Y(174), "% Daily Value*", 12, 700, "end"),
    rule(X(10), Y(180), X(310), 1.5),
  ];
  d.rows.forEach((r, i) => {
    const y = rowY(i);
    items.push(text(X(14 + 14 * r.ind), Y(y), r.t, 14, r.ind === 0 ? 700 : 400));
    if (r.dv) items.push(text(X(306), Y(y), r.dv, 14, 700, "end"));
    items.push(rule(X(10), Y(y + 6), X(310), 1));
  });
  items.push(
    rule(X(10), Y(366), X(310), 8),
    text(X(14), Y(382), "*The % Daily Value (DV) tells how much a nutrient in", 10),
    text(X(14), Y(394), "one serving adds to a daily diet. 2,000 calories a", 10),
    text(X(14), Y(406), "day is used for general nutrition advice.", 10),
  );
  return items;
}

const altOf = (d) =>
  `A Nutrition Facts label for ${d.name}. ${d.servings} servings per container. Serving size ${d.size}. Calories ${d.cal}. ` +
  d.rows.map((r) => `${r.t}${r.dv ? `, ${r.dv} Daily Value` : ""}`).join("; ") +
  ".";

/** One label. `pad` adds an empty margin of that many units on the left and right (for numbered spots that must not cover text). */
export const labelVisual = (d, { pad = 0, ...extra } = {}) => ({ kind: "shapes", w: 320 + 2 * pad, h: 420, alt: altOf(d), ...extra, items: labelItems(d, pad) });

/** Height of the title strip above each label in `twoLabels`. */
export const TWO_TOP = 30;

/** Two labels side by side, 660 by 450, each with a title strip ("Snack A", "Snack B"). */
export const twoLabels = (a, b, extra = {}) => ({
  kind: "shapes",
  w: 660,
  h: 420 + TWO_TOP,
  alt: `Two Nutrition Facts labels side by side. Left, Snack A: ${a.name}. Right, Snack B: ${b.name}.`,
  longDesc: `Left label, Snack A, ${a.name}: ${altOf(a)} Right label, Snack B, ${b.name}: ${altOf(b)}`,
  ...extra,
  items: [
    { t: "text", x: 160, y: 22, text: `Snack A: ${a.name}`, size: 18, weight: 700 },
    { t: "text", x: 500, y: 22, text: `Snack B: ${b.name}`, size: 18, weight: 700 },
    ...labelItems(a, 0, TWO_TOP),
    ...labelItems(b, 340, TWO_TOP),
  ],
});

/** A callout version of one label with captions to the right (640 by 420). */
export function calloutLabel() {
  const d = SNACK_A;
  const w = 640;
  const base = { kind: "shapes", w, h: 420, alt: altOf(d), items: labelItems(d, 0) };
  const labels = [
    { text: "How many servings are in the package", x: 150, y: 62, tx: 480, ty: 40 },
    { text: "How much food is one serving", x: 280, y: 86, tx: 480, ty: 88 },
    { text: "Energy in one serving", x: 280, y: 140, tx: 480, ty: 140 },
    { text: "Share of a day's needs in one serving", x: 280, y: 170, tx: 480, ty: 196 },
    { text: "Fiber: a nutrient to get more of", x: 190, y: rowY(ROW.fiber) - 5, tx: 480, ty: 262 },
    {
      text: "Added sugars: sugar put in by the maker",
      x: 230,
      y: rowY(ROW.added) - 5,
      tx: 480,
      ty: 330,
    },
  ];
  return {
    kind: "labeled",
    w,
    h: 420,
    alt: "The Nutrition Facts label for Crunchy Oat Rounds with six callouts pointing to servings per container, serving size, calories, % Daily Value, dietary fiber and added sugars.",
    longDesc: `${altOf(d)} Callouts name what each part tells you.`,
    base,
    labels,
  };
}

/** A small card showing a few rows of a label with one row highlighted. rows: [[left, right, bold]] */
export function miniCard(title, rows, hl, alt, extra = {}) {
  const items = [
    {
      t: "rect",
      x: 20,
      y: 14,
      w: 280,
      h: 40 + rows.length * 38 + 14,
      rx: 8,
      fill: "paper",
      stroke: "ink",
      sw: 3,
    },
    text(32, 46, title, 18, 700),
    rule(28, 54, 292, 4),
  ];
  rows.forEach((r, i) => {
    const y = 90 + i * 38;
    if (i === hl)
      items.push({
        t: "rect",
        x: 26,
        y: y - 22,
        w: 268,
        h: 32,
        rx: 6,
        fill: "ochre",
        opacity: 0.4,
        stroke: "ink",
        sw: 2.5,
        dash: "6 4",
      });
    items.push(text(34, y, r[0], r[2] ? 17 : 15, r[2] ? 700 : 400));
    if (r[1]) items.push(text(288, y, r[1], r[2] ? 17 : 15, 700, "end"));
  });
  return { kind: "shapes", w: 320, h: 80 + rows.length * 38 + 14, alt, ...extra, items };
}

/** Two bowls: one serving and a bigger portion. */
export const BOWLS = {
  kind: "shapes",
  w: 480,
  h: 260,
  alt: "Two bowls of cereal side by side. The small bowl is labeled one serving, 1 cup. The big bowl is labeled your portion, 2 servings, 2 cups.",
  items: [
    {
      t: "path",
      d: "M50 110 Q50 200 130 200 Q210 200 210 110 Z",
      fill: "paper",
      stroke: "ink",
      sw: 4,
    },
    { t: "path", d: "M60 110 Q130 80 200 110", fill: "ochre", opacity: 0.5, stroke: "ink", sw: 2 },
    { t: "text", x: 130, y: 232, text: "1 serving (1 cup)", size: 16, weight: 700 },
    {
      t: "path",
      d: "M270 90 Q270 210 370 210 Q470 210 470 90 Z",
      fill: "paper",
      stroke: "ink",
      sw: 4,
    },
    { t: "path", d: "M282 90 Q370 52 458 90", fill: "ochre", opacity: 0.5, stroke: "ink", sw: 2 },
    { t: "text", x: 370, y: 242, text: "your portion: 2 servings", size: 16, weight: 700 },
  ],
};

/** Foods with the nutrient each is known for. */
export const NUTRIENT_FOODS = {
  kind: "scene",
  bg: "plain",
  w: 480,
  h: 320,
  alt: "Four foods, each with a nutrient name under it: an apple with fiber, a glass of milk with calcium, an egg with protein and a slice of bread with carbohydrate.",
  items: [
    { icon: "apple", x: 30, y: 60, s: 90, label: "fiber" },
    { icon: "milk", x: 140, y: 60, s: 90, label: "calcium" },
    { icon: "egg", x: 250, y: 60, s: 90, label: "protein" },
    { icon: "bread", x: 360, y: 60, s: 90, label: "carbohydrate" },
    {
      t: "text",
      x: 240,
      y: 250,
      text: "Foods give your body different nutrients",
      size: 18,
      weight: 700,
    },
  ],
};

/** An ingredient list card. */
export const INGREDIENTS = {
  kind: "shapes",
  w: 480,
  h: 220,
  alt: "A package panel that says Ingredients: whole grain oats, sugar, corn starch, salt. An arrow labeled most to least points down the list.",
  items: [
    { t: "rect", x: 20, y: 20, w: 330, h: 180, rx: 8, fill: "paper", stroke: "ink", sw: 3 },
    { t: "text", x: 36, y: 56, text: "Ingredients:", size: 20, weight: 700, anchor: "start" },
    { t: "text", x: 36, y: 92, text: "whole grain oats,", size: 18, anchor: "start" },
    { t: "text", x: 36, y: 124, text: "sugar, corn starch,", size: 18, anchor: "start" },
    { t: "text", x: 36, y: 156, text: "salt", size: 18, anchor: "start" },
    { t: "line", x1: 410, y1: 50, x2: 410, y2: 180, stroke: "ink", sw: 4, cap: "round" },
    {
      t: "poly",
      points: [
        [398, 170],
        [422, 170],
        [410, 192],
      ],
      fill: "ink",
    },
    { t: "text", x: 410, y: 34, text: "most", size: 15, weight: 700 },
    { t: "text", x: 410, y: 212, text: "least", size: 15, weight: 700 },
  ],
};
