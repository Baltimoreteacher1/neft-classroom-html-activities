// Equal groups -> rows of an array -> product. Config: { groups: 2-10, size: 2-10, lang }, groups x size <= 100.
import { cap, circle, intIn, label, rect } from "./anim-kit.js";
import { createPlayer } from "./player.js";

const C = {
  title: "Multiplication as equal groups and as an array",
  groups: "{g} equal groups, with {s} in each group.",
  count: "Count by {s}, one group at a time: {run}. That is {p} in all.",
  rows: "Line the groups up. Each group becomes one row of {s}.",
  array: "The rows make an array with {g} rows and {s} columns. {g} groups of {s} is {g} × {s}.",
  done: "{g} equal groups of {s} make {p} in all, so {g} × {s} = {p}.",
  eqGroups: "{g} groups of {s}",
  rowsLabel: "{g} rows",
  colsLabel: "{s} columns",
};
export const KEYS = Object.values(C);

const PER_ROW = [0, 1, 2, 3, 2, 3, 3, 4, 4, 3, 5];
const TOP = 84;

export function normalizeConfig(config = {}) {
  const g = intIn(config.groups, 2, 10, 3);
  const s = intIn(config.size, 2, 10, 4);
  return g * s <= 100 ? { groups: g, size: s } : { groups: 3, size: 4 };
}

export function buildModel(config = {}) {
  const { groups: g, size: s } = normalizeConfig(config);
  const product = g * s;
  // Group layout: g rounded boxes, each holding s dots.
  const perRow = PER_ROW[g];
  const boxRows = Math.ceil(g / perRow);
  const gap = 14;
  const gapY = boxRows > 1 ? 30 : gap;
  const bw = Math.min(130, (440 - (perRow - 1) * gap) / perRow);
  const bh = Math.min(124, (230 - (boxRows - 1) * gapY) / boxRows);
  const boxX0 = (480 - (perRow * bw + (perRow - 1) * gap)) / 2;
  // Dot grid inside a box: the shape with the fewest empty slots, then the one closest to the box's proportions.
  let cols = s;
  let best = Number.POSITIVE_INFINITY;
  for (let r = 1; r <= s; r += 1) {
    const c = Math.ceil(s / r);
    const score = (r * c - s) * 100 + Math.abs(c / r - bw / bh);
    if (score < best) [best, cols] = [score, c];
  }
  const dotRows = Math.ceil(s / cols);
  const pitch = Math.min(bw / (cols + 0.4), bh / (dotRows + 0.4), 30);
  const dotR = Math.min(pitch * 0.36, 14);
  const boxAt = (i) => ({ x: boxX0 + (i % perRow) * (bw + gap), y: TOP + Math.floor(i / perRow) * (bh + gapY) });
  const inGroup = (i, k) => {
    const b = boxAt(i);
    return {
      x: b.x + bw / 2 + ((k % cols) - (cols - 1) / 2) * pitch,
      y: b.y + bh / 2 + (Math.floor(k / cols) - (dotRows - 1) / 2) * pitch,
    };
  };
  // Array layout: g rows of s dots.
  const cell = Math.min(46, 340 / s, 230 / g);
  const arrX = (480 - s * cell) / 2 + 18;
  const inArray = (i, k) => ({ x: arrX + (k + 0.5) * cell, y: TOP + (i + 0.5) * cell });
  const arrR = Math.min(cell * 0.36, 15);
  const bottom = TOP + Math.max(boxRows * bh + (boxRows - 1) * gapY, g * cell);
  const eqY = bottom + 48;

  const dots = (layout, radius) => {
    const items = [];
    for (let i = 0; i < g; i += 1)
      for (let k = 0; k < s; k += 1) {
        const p = layout(i, k);
        items.push(circle(`d${i}-${k}`, p.x, p.y, radius, "an-dot", { role: "dot" }));
      }
    return items;
  };
  const boxes = () =>
    Array.from({ length: g }, (_, i) => rect(`box${i}`, boxAt(i).x, boxAt(i).y, bw, bh, "an-box", { a: { rx: 12 } }));
  const eq = (content) => label("eq", 240, eqY, content, "an-eq", { a: { "text-anchor": "middle" } });
  const run = Array.from({ length: g }, (_, i) => (i + 1) * s).join(", ");

  const groupScene = [...boxes(), ...dots(inGroup, dotR)];
  const runningLabels = Array.from({ length: g }, (_, i) =>
    label(`run${i}`, boxAt(i).x + bw / 2, boxAt(i).y - 10, String((i + 1) * s), "an-chip", { a: { "text-anchor": "middle" } }),
  );
  const arrayScene = dots(inArray, arrR);
  const arrayLabels = [
    label("rows-lab", arrX - 8, TOP + (g * cell) / 2 + 6, cap(C.rowsLabel, { g }), "an-note", { a: { "text-anchor": "end" } }),
    label("cols-lab", arrX + (s * cell) / 2, TOP - 14, cap(C.colsLabel, { s }), "an-note", { a: { "text-anchor": "middle" } }),
  ];
  const steps = [
    { caption: cap(C.groups, { g, s }), scene: [...groupScene, eq(cap(C.eqGroups, { g, s }))], state: { layout: "groups", g, s } },
    { caption: cap(C.count, { s, run, p: product }), scene: [...groupScene, ...runningLabels, eq(cap(C.eqGroups, { g, s }))], state: { layout: "groups", running: Array.from({ length: g }, (_, i) => (i + 1) * s) } },
    { caption: cap(C.rows, { s }), scene: [...arrayScene, eq(`${g} × ${s}`)], state: { layout: "array", g, s } },
    { caption: cap(C.array, { g, s }), scene: [...arrayScene, ...arrayLabels, eq(`${g} × ${s}`)], state: { layout: "array", g, s } },
    { caption: cap(C.done, { g, s, p: product }), scene: [...arrayScene, ...arrayLabels, eq(`${g} × ${s} = ${product}`)], state: { layout: "array", g, s, product } },
  ];
  return { kind: "multiplication-grouping", title: cap(C.title), view: [480, eqY + 28], steps, result: { groups: g, size: s, product } };
}

export const play = (container, config = {}) => createPlayer(container, buildModel(config), config);
