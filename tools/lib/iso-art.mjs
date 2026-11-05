/* The ten unit emblems and the homepage hero, drawn with tools/lib/iso.mjs.
 * Each emblem is a small solid sculpture of what the unit is about, lit the same
 * way, so the set reads as one family. Tone a is the unit's own colour (set by
 * the page through --tone-a-base); b is brass, c is ink, d is ceramic, e is teal. */
import { fitSvg } from "./iso.mjs";

const EMBLEM = { width: 168, height: 112, pad: 4 };

/** Draw boxes back to front: farther corner first, then lower first. */
function stack(sc, boxes) {
  [...boxes]
    .sort(
      (p, q) =>
        p.x + (p.w ?? 1) + p.y + (p.d ?? 1) - (q.x + (q.w ?? 1) + q.y + (q.d ?? 1)) ||
        (p.z ?? 0) - (q.z ?? 0),
    )
    .forEach((b) => sc.box(b));
}

/** A thin ceramic base every emblem stands on, so each one has a floor and a shadow. */
function plinth(sc, w, d, x = 0, y = 0) {
  sc.shadow({ x, y, w, d, grow: 0.7 });
  sc.box({ x, y, z: -0.22, w, d, h: 0.22, tone: "d" });
}

const emblems = {
  /* 1 Math Is Discovery: a staircase of blocks with a find at the top. */
  1: (sc) => {
    plinth(sc, 4, 2);
    stack(sc, [
      { x: 0.2, y: 0.5, w: 1, d: 1, h: 1 },
      { x: 1.2, y: 0.5, w: 1, d: 1, h: 1 },
      { x: 2.2, y: 0.5, w: 1, d: 1, h: 1 },
      { x: 0.2, y: 0.5, z: 1, w: 1, d: 1, h: 1, tone: "e" },
      { x: 1.2, y: 0.5, z: 1, w: 1, d: 1, h: 1, tone: "e" },
      { x: 0.2, y: 0.5, z: 2, w: 1, d: 1, h: 1, tone: "c" },
    ]);
    sc.sphere({ x: 0.7, y: 1, z: 3, r: 0.38, tone: "b" });
  },
  /* 2 Statistics: columns of a bar chart with the tallest picked out. */
  2: (sc) => {
    plinth(sc, 5.2, 2);
    stack(
      sc,
      [1, 2, 3.2, 2.2, 1.4].map((h, i) => ({
        x: 0.2 + i * 1,
        y: 0.4,
        w: 0.8,
        d: 1.2,
        h,
        tone: i === 2 ? "b" : "a",
      })),
    );
    sc.box({ x: 0.1, y: 0.2, z: 0, w: 5, d: 0.1, h: 0.06, tone: "c" });
  },
  /* 3 Ratios & Rates: a 2 : 3 pair of tile rows, side by side. */
  3: (sc) => {
    plinth(sc, 5.6, 3);
    const tiles = [];
    for (let i = 0; i < 2; i++)
      tiles.push({ x: 0.2 + i * 1.2, y: 0.2, w: 1.05, d: 1.05, h: 0.7, tone: "a" });
    for (let i = 0; i < 3; i++)
      tiles.push({ x: 0.2 + i * 1.2, y: 1.5, w: 1.05, d: 1.05, h: 0.7, tone: "b" });
    stack(sc, tiles);
  },
  /* 4 Percents: a hundred-grid plate with a quarter of it raised. */
  4: (sc) => {
    plinth(sc, 4.4, 4.4);
    sc.box({ x: 0, y: 0, z: 0, w: 4.4, d: 4.4, h: 0.26, tone: "d" });
    sc.grid({ x: 0, y: 0, z: 0.26, w: 4.4, d: 4.4, step: 0.44 });
    sc.box({ x: 0, y: 0, z: 0.26, w: 2.2, d: 2.2, h: 0.55, tone: "a" });
    sc.label({ text: "25%", x: 1.1, y: 1.45, z: 0.81, size: 0.62 });
  },
  /* 5 Area, Surface Area & Volume: a prism built from unit cubes. */
  5: (sc) => {
    plinth(sc, 4.4, 3.4);
    const cubes = [];
    for (let x = 0; x < 3; x++)
      for (let y = 0; y < 2; y++)
        for (let z = 0; z < 2; z++)
          cubes.push({
            x: 0.2 + x,
            y: 0.4 + y,
            z,
            tone: z === 1 && x === 2 && y === 1 ? "b" : "a",
          });
    stack(sc, cubes);
    sc.box({ x: 3.4, y: 2.2, w: 0.8, d: 0.8, h: 0.8, tone: "e" });
  },
  /* 6 Expressions: algebra tiles, an x bar and unit squares. */
  6: (sc) => {
    plinth(sc, 5.4, 3);
    sc.box({ x: 0.2, y: 0.3, w: 3.6, d: 1.1, h: 0.4, tone: "a" });
    sc.label({ text: "x", x: 2, y: 1.02, z: 0.4, size: 0.9 });
    stack(
      sc,
      [0, 1, 2].map((i) => ({ x: 0.2 + i * 1.2, y: 1.7, w: 1.05, d: 1.05, h: 0.4, tone: "b" })),
    );
    sc.box({ x: 4.2, y: 0.3, w: 1.05, d: 1.05, h: 0.4, tone: "e" });
  },
  /* 7 Integers & the Coordinate Plane: a gridded plane, axes and two points. */
  7: (sc) => {
    plinth(sc, 5, 5);
    sc.box({ x: 0, y: 0, z: 0, w: 5, d: 5, h: 0.22, tone: "d" });
    sc.grid({ x: 0, y: 0, z: 0.22, w: 5, d: 5, step: 0.625 });
    sc.strip({ x: 0.1, y: 2.4, z: 0.23, w: 4.8, d: 0.2, tone: "c" });
    sc.strip({ x: 2.4, y: 0.1, z: 0.23, w: 0.2, d: 4.8, tone: "c" });
    sc.sphere({ x: 3.4, y: 1.3, z: 0.22, r: 0.34, tone: "a" });
    sc.sphere({ x: 1.0, y: 3.5, z: 0.22, r: 0.34, tone: "b" });
  },
  /* 8 Equations & Inequalities: a balance, both pans carrying equal weight. */
  8: (sc) => {
    plinth(sc, 5.6, 2.4);
    sc.box({ x: 2.2, y: 0.7, w: 1.2, d: 1, h: 1.4, tone: "c" });
    sc.box({ x: 0.1, y: 0.8, z: 2.1, w: 5.4, d: 0.8, h: 0.22, tone: "d" });
    stack(sc, [
      { x: 0.4, y: 0.9, z: 2.32, w: 0.9, d: 0.6, h: 0.9, tone: "a" },
      { x: 1.3, y: 0.9, z: 2.32, w: 0.9, d: 0.6, h: 0.9, tone: "a" },
    ]);
    sc.box({ x: 4.2, y: 0.9, z: 2.32, w: 1.1, d: 0.6, h: 1.8, tone: "b" });
  },
  /* 9 Two-Variable Relationships: steps that climb at a constant rate, points on top. */
  9: (sc) => {
    plinth(sc, 5.2, 2);
    stack(
      sc,
      [1, 2, 3, 4].map((h, i) => ({
        x: 0.2 + i * 1.2,
        y: 0.5,
        w: 1.1,
        d: 1,
        h: h * 0.7,
        tone: "a",
      })),
    );
    [1, 2, 3, 4].forEach((h, i) =>
      sc.sphere({ x: 0.45 + i * 1.2, y: 0.75, z: h * 0.7, r: 0.26, tone: "b" }),
    );
  },
  /* 10 Math Is Synthesis: the year's solids together. */
  10: (sc) => {
    plinth(sc, 5.2, 3.4);
    sc.box({ x: 0.2, y: 0.6, w: 1.6, d: 1.6, h: 1.6, tone: "a" });
    sc.cyl({ x: 3.2, y: 1.4, r: 0.8, h: 1.2, tone: "b" });
    sc.box({ x: 2.1, y: 2.1, w: 2.4, d: 0.9, h: 0.5, tone: "e" });
    sc.sphere({ x: 1, y: 1.4, z: 1.6, r: 0.5, tone: "c" });
  },
};

/** Inline SVG for one unit emblem. Colours come from the page's tone variables. */
export const unitEmblem = (unit) =>
  fitSvg(emblems[unit], {
    ...EMBLEM,
    className: "course-unit-art iso",
    attrs: 'aria-hidden="true" focusable="false"',
  });

/** The homepage hero: a still life of the course's three big ideas on graph paper. */
function hero(sc) {
  const L = 10;
  sc.shadow({ x: 0, y: 0, w: L, d: L, grow: 1.1 });
  sc.box({ x: 0, y: 0, z: -0.5, w: L, d: L, h: 0.5, tone: "c" });
  sc.box({ x: 0, y: 0, z: 0, w: L, d: L, h: 0.12, tone: "d" });
  sc.grid({ x: 0, y: 0, z: 0.12, w: L, d: L, step: 1 });

  /* The ratio: five tiles, two blue and three gold, standing in a row. */
  const tiles = [];
  for (let i = 0; i < 5; i++)
    tiles.push({
      x: 0.7 + i * 1.25,
      y: 0.9,
      z: 0.12,
      w: 1.1,
      d: 1.9,
      h: 1.1,
      tone: i < 2 ? "e" : "b",
    });
  stack(sc, tiles);

  /* The percent: a hundred-grid plate with a quarter raised. */
  sc.box({ x: 5.4, y: 4.1, z: 0.12, w: 4.2, d: 4.2, h: 0.2, tone: "d" });
  sc.grid({ x: 5.4, y: 4.1, z: 0.32, w: 4.2, d: 4.2, step: 0.42 });
  sc.box({ x: 5.4, y: 4.1, z: 0.32, w: 2.1, d: 2.1, h: 0.62, tone: "a" });
  sc.label({ text: "25%", x: 6.45, y: 5.0, z: 0.94, size: 0.58 });

  /* The graph: steps rising at a constant rate with a bead on every tread. */
  const steps = [5, 4, 3, 2, 1].map((n, i) => ({
    x: 0.7,
    y: 3.7 + i * 1.1,
    z: 0.12,
    w: 2.6,
    d: 1,
    h: n * 0.62,
    tone: "a",
  }));
  stack(sc, steps);
  steps.forEach((s, i) => sc.sphere({ x: 1.75, y: s.y + 0.5, z: 0.12 + s.h, r: 0.3, tone: "b" }));

  /* Geometry: a cylinder and a cube to give the group scale. */
  sc.cyl({ x: 4.4, y: 7.4, z: 0.12, r: 0.8, h: 1.7, tone: "c" });
  sc.box({ x: 3.5, y: 4.6, z: 0.12, w: 1.3, d: 1.3, h: 1.3, tone: "e" });
  sc.sphere({ x: 8.7, y: 8.9, z: 0.12, r: 0.55, tone: "b" });
}
const HERO_TITLE = "Three ideas from the course, built as solid objects";
const HERO_DESC =
  "Five tiles stand in a row, two teal and three gold, so teal to gold is 2 to 3. A hundred-grid plate has a quarter of its squares raised, which is 25 percent. A staircase rises by the same amount at every step with a bead on each tread, which is a constant rate.";
export const heroScene = () =>
  fitSvg(hero, {
    width: 640,
    height: 520,
    pad: 14,
    indexed: true,
    className: "iso hero-iso curriculum-hero-model",
    attrs:
      'role="img" aria-labelledby="curriculum-model-title curriculum-model-desc" focusable="false"',
    inner: `<title id="curriculum-model-title">${HERO_TITLE}</title><desc id="curriculum-model-desc">${HERO_DESC}</desc>`,
  });

/* Small objects for the destination tiles on the homepage. */
const GLYPH = { width: 72, height: 56, pad: 3 };
const glyphs = {
  lessons: (sc) => {
    sc.shadow({ x: 0, y: 0, w: 3, d: 2.2, grow: 0.5 });
    stack(sc, [
      { x: 0, y: 0, w: 3, d: 2.2, h: 0.55, tone: "a" },
      { x: 0.1, y: 0.1, z: 0.55, w: 2.8, d: 2, h: 0.5, tone: "e" },
      { x: 0.2, y: 0.15, z: 1.05, w: 2.6, d: 1.9, h: 0.45, tone: "b" },
    ]);
  },
  practice: (sc) => {
    sc.shadow({ x: 0, y: 0, w: 3, d: 2.4, grow: 0.5 });
    sc.box({ x: 0, y: 0, w: 3, d: 2.4, h: 0.18, tone: "d" });
    sc.grid({ x: 0, y: 0, z: 0.18, w: 3, d: 2.4, step: 0.6 });
    sc.box({ x: 0.5, y: 0.7, z: 0.18, w: 0.3, d: 0.3, h: 0.3, tone: "a" });
    sc.box({ x: 1.2, y: 1.2, z: 0.18, w: 1.6, d: 0.22, h: 0.22, tone: "b" });
  },
  games: (sc) => {
    sc.shadow({ x: 0, y: 0, w: 2, d: 2, grow: 0.5 });
    sc.box({ x: 0, y: 0, w: 2, d: 2, h: 2, tone: "a" });
    sc.sphere({ x: 0.35, y: 0.35, z: 2, r: 0.22, tone: "d" });
    sc.sphere({ x: 1.45, y: 1.45, z: 2, r: 0.22, tone: "d" });
    sc.sphere({ x: 0.9, y: 0.9, z: 2, r: 0.22, tone: "d" });
  },
  labs: (sc) => {
    sc.shadow({ x: 0.2, y: 0.2, w: 2.2, d: 2.2, grow: 0.5 });
    sc.cyl({ x: 1.3, y: 1.3, r: 1, h: 1.5, tone: "e" });
    sc.sphere({ x: 1.3, y: 1.3, z: 1.5, r: 0.6, tone: "b" });
  },
  fluency: (sc) => {
    sc.shadow({ x: 0, y: 0, w: 3.4, d: 1.2, grow: 0.5 });
    stack(
      sc,
      [0.8, 1.5, 2.3].map((h, i) => ({
        x: i * 1.15,
        y: 0,
        w: 1,
        d: 1.2,
        h,
        tone: i === 2 ? "b" : "a",
      })),
    );
  },
  help: (sc) => {
    sc.shadow({ x: 0, y: 0, w: 2.4, d: 2.4, grow: 0.5 });
    sc.box({ x: 0, y: 0, w: 2.4, d: 2.4, h: 0.5, tone: "c" });
    sc.cyl({ x: 1.2, y: 1.2, z: 0.5, r: 0.45, h: 1.3, tone: "e" });
    sc.sphere({ x: 1.2, y: 1.2, z: 1.8, r: 0.55, tone: "b" });
  },
  progress: (sc) => {
    sc.shadow({ x: 0, y: 0, w: 3.6, d: 1.4, grow: 0.5 });
    stack(
      sc,
      [1, 2, 3].map((h, i) => ({ x: i * 1.2, y: 0, w: 1.1, d: 1.4, h: h * 0.55, tone: "a" })),
    );
    sc.box({ x: 3.7, y: 0.6, w: 0.2, d: 0.2, h: 2.6, tone: "c" });
    sc.box({ x: 2.5, y: 0.6, z: 2.2, w: 1.2, d: 0.14, h: 0.7, tone: "b" });
  },
};
export const glyphNames = Object.keys(glyphs);
export const destGlyph = (name) =>
  fitSvg(glyphs[name], {
    ...GLYPH,
    className: "dest-glyph iso",
    attrs: 'aria-hidden="true" focusable="false"',
  });

/* Page-stage artwork. One object per destination, baked to the brand palette
 * because a CSS background image cannot read the page's variables. The CSS
 * block that carries these is written by tools/sync-curriculum-shell.mjs. */
const STAGE = { width: 360, height: 240, pad: 6 };
export const STAGE_PALETTE = {
  a: "#2f84b6",
  b: "#e8b23f",
  c: "#17324d",
  d: "#ece6d6",
  e: "#1fa6a2",
};
const stageDrawings = {
  /* Practice: a stack of worksheets with a pencil laid across them. */
  practice: (sc) => {
    sc.shadow({ x: 0, y: 0, w: 5, d: 4, grow: 0.8 });
    sc.box({ x: 0, y: 0, w: 5, d: 4, h: 0.22, tone: "d" });
    sc.box({ x: 0.2, y: 0.2, z: 0.22, w: 4.6, d: 3.6, h: 0.22, tone: "d" });
    sc.box({ x: 0.4, y: 0.4, z: 0.44, w: 4.2, d: 3.2, h: 0.22, tone: "d" });
    sc.grid({ x: 0.4, y: 0.4, z: 0.66, w: 4.2, d: 3.2, step: 0.7 });
    sc.strip({ x: 0.8, y: 1.0, z: 0.67, w: 2.4, d: 0.12, tone: "a" });
    sc.strip({ x: 0.8, y: 1.6, z: 0.67, w: 1.8, d: 0.12, tone: "a" });
    sc.box({ x: 1.2, y: 2.5, z: 0.66, w: 3.2, d: 0.34, h: 0.34, tone: "b" });
    sc.box({ x: 4.4, y: 2.5, z: 0.66, w: 0.4, d: 0.34, h: 0.34, tone: "c" });
  },
  /* Labs: apparatus on a bench. */
  labs: (sc) => {
    sc.shadow({ x: 0, y: 0, w: 5, d: 3.4, grow: 0.8 });
    sc.box({ x: 0, y: 0, w: 5, d: 3.4, h: 0.3, tone: "d" });
    sc.cyl({ x: 1.4, y: 1.8, z: 0.3, r: 0.95, h: 1.9, tone: "e" });
    sc.sphere({ x: 1.4, y: 1.8, z: 2.2, r: 0.62, tone: "b" });
    sc.cyl({ x: 3.5, y: 1.2, z: 0.3, r: 0.55, h: 1.1, tone: "a" });
    sc.box({ x: 3.2, y: 2.1, z: 0.3, w: 1.1, d: 0.9, h: 0.9, tone: "c" });
  },
  /* Family: a home built from blocks. */
  families: (sc) => {
    sc.shadow({ x: 0, y: 0, w: 5, d: 4, grow: 0.8 });
    sc.box({ x: 0, y: 0, w: 5, d: 4, h: 0.25, tone: "d" });
    sc.box({ x: 0.8, y: 0.7, z: 0.25, w: 3.4, d: 2.6, h: 1.7, tone: "b" });
    sc.box({ x: 0.6, y: 0.5, z: 1.95, w: 3.8, d: 3, h: 0.35, tone: "a" });
    sc.box({ x: 1.1, y: 0.8, z: 2.3, w: 2.8, d: 2.4, h: 0.35, tone: "a" });
    sc.box({ x: 1.6, y: 1.1, z: 2.65, w: 1.8, d: 1.8, h: 0.35, tone: "a" });
    sc.box({ x: 2.0, y: 3.25, z: 0.25, w: 0.9, d: 0.1, h: 1.2, tone: "c" });
    sc.sphere({ x: 4.5, y: 3.3, z: 0.25, r: 0.4, tone: "e" });
  },
  /* Extra Help: step by step toward an idea. */
  help: (sc) => {
    sc.shadow({ x: 0, y: 0, w: 5, d: 3, grow: 0.8 });
    sc.box({ x: 0, y: 0, w: 5, d: 3, h: 0.25, tone: "d" });
    [0.8, 1.5, 2.2].forEach((h, i) =>
      sc.box({ x: 0.3 + i * 1.1, y: 0.8, z: 0.25, w: 1, d: 1.6, h, tone: "a" }),
    );
    sc.cyl({ x: 4.1, y: 1.6, z: 0.25, r: 0.42, h: 1.7, tone: "c" });
    sc.sphere({ x: 4.1, y: 1.6, z: 1.95, r: 0.62, tone: "b" });
  },
  /* Fluency: facts climbing to fast and easy. */
  fluency: (sc) => {
    sc.shadow({ x: 0, y: 0, w: 5.6, d: 2, grow: 0.8 });
    sc.box({ x: 0, y: 0, w: 5.6, d: 2, h: 0.25, tone: "d" });
    [0.8, 1.4, 2.0, 2.6, 3.2].forEach((h, i) =>
      sc.box({ x: 0.2 + i * 1.08, y: 0.4, z: 0.25, w: 0.9, d: 1.2, h, tone: i === 4 ? "b" : "a" }),
    );
    sc.sphere({ x: 4.9, y: 0.7, z: 3.45, r: 0.3, tone: "e" });
  },
  /* Progress: a flag at the top of the steps. */
  progress: (sc) => {
    sc.shadow({ x: 0, y: 0, w: 5.2, d: 2.2, grow: 0.8 });
    sc.box({ x: 0, y: 0, w: 5.2, d: 2.2, h: 0.25, tone: "d" });
    [1, 2, 3].forEach((n, i) =>
      sc.box({ x: 0.3 + i * 1.3, y: 0.5, z: 0.25, w: 1.2, d: 1.4, h: n * 0.7, tone: "a" }),
    );
    sc.box({ x: 4.3, y: 0.9, z: 0.25, w: 0.18, d: 0.18, h: 3, tone: "c" });
    sc.box({ x: 3.1, y: 0.9, z: 2.6, w: 1.2, d: 0.14, h: 0.65, tone: "b" });
  },
  /* Resources (and any page without its own): a crate of tools. */
  resources: (sc) => {
    sc.shadow({ x: 0, y: 0, w: 5, d: 3.4, grow: 0.8 });
    sc.box({ x: 0, y: 0, w: 5, d: 3.4, h: 0.25, tone: "d" });
    sc.box({ x: 0.3, y: 0.4, z: 0.25, w: 2, d: 1.5, h: 1.2, tone: "a" });
    sc.box({ x: 2.5, y: 0.4, z: 0.25, w: 2, d: 1.5, h: 0.8, tone: "e" });
    sc.box({ x: 0.3, y: 2.0, z: 0.25, w: 1.5, d: 1.2, h: 0.7, tone: "b" });
    sc.cyl({ x: 3.4, y: 2.6, z: 0.25, r: 0.6, h: 1.3, tone: "c" });
  },
};
export const stageNames = Object.keys(stageDrawings);

/** A CSS-ready data URI for one page-stage drawing. */
export function stageArt(name) {
  const svg = fitSvg(stageDrawings[name], {
    ...STAGE,
    palette: STAGE_PALETTE,
    attrs: 'aria-hidden="true"',
  }).replaceAll('"', "'");
  return `url("data:image/svg+xml,${svg.replaceAll("%", "%25").replaceAll("<", "%3C").replaceAll(">", "%3E").replaceAll("#", "%23")}")`;
}

/* ---- Unit plates and the Units page stage (baked, for CSS backgrounds) ----
 * Added for the Units, Arcade and Projects surfaces. Both exports take the unit
 * colours as an argument (tools/generate-unit-art.mjs reads them from the
 * --unit-N tokens in assets/dimension.css) so no hex is copied here. */
const dataUri = (svg) =>
  `url("data:image/svg+xml,${svg.replaceAll('"', "'").replaceAll("%", "%25").replaceAll("<", "%3C").replaceAll(">", "%3E").replaceAll("#", "%23")}")`;

/** One unit emblem baked in that unit's own colour (tone a), as a CSS url(). */
export const unitEmblemArt = (unit, hex) =>
  dataUri(
    fitSvg(emblems[unit], {
      ...EMBLEM,
      palette: { ...STAGE_PALETTE, a: hex },
      attrs: 'aria-hidden="true"',
    }),
  );

/** The ten units as a rising staircase of blocks, each in its own unit colour. */
export function unitsStageArt(unitHexes) {
  const palette = {
    ...STAGE_PALETTE,
    ...Object.fromEntries(unitHexes.map((hex, i) => [`u${i + 1}`, hex])),
  };
  const draw = (sc) => {
    sc.shadow({ x: 0, y: 0, w: 8.4, d: 2.6, grow: 0.8 });
    sc.box({ x: 0, y: 0, w: 8.4, d: 2.6, h: 0.25, tone: "d" });
    stack(
      sc,
      unitHexes.map((_, i) => ({
        x: 0.25 + i * 0.78,
        y: 0.55,
        z: 0.25,
        w: 0.7,
        d: 1.5,
        h: 0.6 + i * 0.28,
        tone: `u${i + 1}`,
      })),
    );
    sc.sphere({ x: 7.7, y: 1.1, z: 0.25 + 0.6 + 9 * 0.28, r: 0.3, tone: "b" });
  };
  return dataUri(fitSvg(draw, { ...STAGE, palette, attrs: 'aria-hidden="true"' }));
}

/* Page-stage objects for the Projects gallery, the Arcade and the teacher-tool hub. */
const surfaceDrawings = {
  /* Projects: a blueprint sheet, a pencil, and the thing being built. */
  projects: (sc) => {
    sc.shadow({ x: 0, y: 0, w: 5.2, d: 4, grow: 0.8 });
    sc.box({ x: 0, y: 0, w: 5.2, d: 4, h: 0.25, tone: "d" });
    sc.box({ x: 0.3, y: 0.3, z: 0.25, w: 3, d: 2.6, h: 0.1, tone: "d" });
    sc.grid({ x: 0.3, y: 0.3, z: 0.35, w: 3, d: 2.6, step: 0.5 });
    sc.strip({ x: 0.7, y: 0.9, z: 0.36, w: 1.8, d: 0.12, tone: "a" });
    sc.strip({ x: 0.7, y: 1.5, z: 0.36, w: 1.2, d: 0.12, tone: "a" });
    sc.box({ x: 3.5, y: 0.6, z: 0.25, w: 1.3, d: 1.3, h: 1.3, tone: "a" });
    sc.box({ x: 3.75, y: 0.85, z: 1.55, w: 0.8, d: 0.8, h: 0.8, tone: "b" });
    sc.cyl({ x: 4.2, y: 3.1, z: 0.25, r: 0.5, h: 1.1, tone: "e" });
    sc.box({ x: 0.6, y: 3.2, z: 0.25, w: 2.6, d: 0.3, h: 0.3, tone: "b" });
    sc.box({ x: 3.2, y: 3.2, z: 0.25, w: 0.4, d: 0.3, h: 0.3, tone: "c" });
  },
  /* Arcade: a cabinet with a control deck, a stick and two buttons. */
  arcade: (sc) => {
    sc.shadow({ x: 0, y: 0, w: 5, d: 3.4, grow: 0.8 });
    sc.box({ x: 0, y: 0, w: 5, d: 3.4, h: 0.25, tone: "d" });
    sc.box({ x: 1.4, y: 0.5, z: 0.25, w: 2.2, d: 1.8, h: 2.2, tone: "c" });
    sc.box({ x: 1.4, y: 0.5, z: 2.45, w: 2.2, d: 1.8, h: 0.5, tone: "b" });
    sc.box({ x: 1.6, y: 2.3, z: 1.15, w: 1.8, d: 0.6, h: 0.2, tone: "d" });
    sc.sphere({ x: 2.0, y: 2.55, z: 1.35, r: 0.22, tone: "b" });
    sc.sphere({ x: 2.7, y: 2.55, z: 1.35, r: 0.17, tone: "e" });
    sc.sphere({ x: 3.1, y: 2.55, z: 1.35, r: 0.17, tone: "a" });
    sc.box({ x: 0.2, y: 2.0, z: 0.25, w: 0.9, d: 0.9, h: 0.9, tone: "a" });
    sc.box({ x: 4.0, y: 1.9, z: 0.25, w: 0.8, d: 0.8, h: 0.8, tone: "e" });
  },
  /* Teacher tools: a gradebook slab, a bar chart and an insight bead. */
  teacher: (sc) => {
    sc.shadow({ x: 0, y: 0, w: 5.2, d: 3.6, grow: 0.8 });
    sc.box({ x: 0, y: 0, w: 5.2, d: 3.6, h: 0.25, tone: "d" });
    sc.box({ x: 0.3, y: 0.3, z: 0.25, w: 2.4, d: 3, h: 0.14, tone: "c" });
    sc.grid({ x: 0.45, y: 0.45, z: 0.39, w: 2.1, d: 2.7, step: 0.45 });
    [0.8, 1.5, 2.2].forEach((h, i) =>
      sc.box({ x: 3.0 + i * 0.7, y: 0.5, z: 0.25, w: 0.55, d: 1.2, h, tone: i === 2 ? "b" : "a" }),
    );
    sc.cyl({ x: 3.4, y: 2.7, z: 0.25, r: 0.45, h: 0.9, tone: "e" });
    sc.sphere({ x: 4.5, y: 2.6, z: 0.25, r: 0.4, tone: "b" });
  },
};
export const surfaceStageNames = Object.keys(surfaceDrawings);
/** A CSS url() for one surface stage drawing, baked to the stage palette. */
export const surfaceStageArt = (name) =>
  dataUri(
    fitSvg(surfaceDrawings[name], {
      ...STAGE,
      palette: STAGE_PALETTE,
      attrs: 'aria-hidden="true"',
    }),
  );

/* ---- Practice, family and learning-lab art (class mode, inline SVG) ----
 * Added for the family homework hero and the learning labs. Colours come from the
 * page's tone variables, so the home takes its unit colour from the lesson. */

/** Draw through an offset so an emblem can stand on someone else's plate. */
const offsetScene = (sc, dx, dy) =>
  new Proxy(sc, {
    get(target, key) {
      const value = target[key];
      if (typeof value !== "function") return value;
      return (o = {}) =>
        value.call(target, typeof o.x === "number" ? { ...o, x: o.x + dx, y: o.y + dy } : o);
    },
  });

/** Tier 1 the home, tier 2 the unit's own object on its plate, tier 3 six beads for tonight's six steps. */
function familyHome(unit) {
  return (sc) => {
    sc.shadow({ x: 0, y: 0, w: 12.4, d: 5.9, grow: 0.9 });
    sc.box({ x: 0, y: 0, z: -0.3, w: 12.4, d: 5.9, h: 0.3, tone: "c" });
    sc.box({ x: 0, y: 0, w: 12.4, d: 5.9, h: 0.1, tone: "d" });
    sc.grid({ x: 0, y: 0, z: 0.1, w: 12.4, d: 5.9, step: 0.62 });
    sc.box({ x: 0.7, y: 0.8, z: 0.1, w: 3.6, d: 2.6, h: 1.8, tone: "b" });
    sc.box({ x: 3.5, y: 1, z: 1.9, w: 0.5, d: 0.5, h: 1.2, tone: "c" });
    sc.box({ x: 0.5, y: 0.6, z: 1.9, w: 4, d: 3, h: 0.35, tone: "a" });
    sc.box({ x: 1, y: 1, z: 2.25, w: 3, d: 2.2, h: 0.35, tone: "a" });
    sc.box({ x: 1.5, y: 1.4, z: 2.6, w: 2, d: 1.4, h: 0.35, tone: "a" });
    sc.box({ x: 1.9, y: 3.4, z: 0.1, w: 0.8, d: 0.1, h: 1.25, tone: "c" });
    sc.box({ x: 3.2, y: 3.4, z: 0.9, w: 0.75, d: 0.08, h: 0.62, tone: "d" });
    sc.box({ x: 4.3, y: 1.5, z: 0.9, w: 0.08, d: 0.75, h: 0.62, tone: "d" });
    emblems[unit](offsetScene(sc, 6.6, 0.4));
    for (let i = 0; i < 6; i++)
      sc.sphere({ x: 0.9 + i * 0.95, y: 4.9, z: 0.1, r: 0.3, tone: i < 3 ? "b" : "e" });
  };
}
const FAMILY_HOME = { width: 380, height: 220, pad: 4 };
/** The family hero's inline object for a unit. Decorative; the page names the lesson. */
export const familyHomeScene = (unit) =>
  fitSvg(familyHome(Math.min(10, Math.max(1, Number(unit) || 1))), {
    ...FAMILY_HOME,
    className: "iso fm-iso fm-hero__home",
    attrs: 'aria-hidden="true" focusable="false"',
  });

/* ---- Learning-lab emblems: one small solid sculpture per lab model, in the lab's unit colour (tone a) ----
 * Six reuse the unit emblems of the matching topic so the family reads as one; the rest are drawn here. */
const labModels = {
  array: (sc) => {
    plinth(sc, 4.6, 3.4);
    const cubes = [];
    for (let x = 0; x < 4; x++)
      for (let y = 0; y < 3; y++)
        cubes.push({
          x: 0.2 + x * 1.05,
          y: 0.2 + y * 1.05,
          w: 0.9,
          d: 0.9,
          h: 0.7,
          tone: x === 3 && y === 2 ? "b" : "a",
        });
    stack(sc, cubes);
  },
  decimal: (sc) => {
    plinth(sc, 5, 3);
    [1.4, 0.9, 0.5].forEach((n, i) => {
      for (let k = 0; k < Math.round(n / 0.25); k++)
        sc.cyl({
          x: 0.9 + i * 1.4,
          y: 1.1,
          z: k * 0.25,
          r: 0.55,
          h: 0.25,
          tone: i === 0 ? "b" : "e",
        });
    });
    sc.box({ x: 0.3, y: 1.9, w: 4.2, d: 0.9, h: 0.1, tone: "d" });
  },
  growth: (sc) => {
    plinth(sc, 4.8, 2);
    const cubes = [];
    for (let i = 0; i < 4; i++)
      for (let k = 0; k <= i; k++)
        cubes.push({
          x: 0.2 + i * 1.1,
          y: 0.5,
          z: k * 0.8,
          w: 1,
          d: 1,
          h: 0.8,
          tone: k === i ? "b" : "a",
        });
    stack(sc, cubes);
  },
  division: (sc) => {
    plinth(sc, 5.2, 2.6);
    for (let i = 0; i < 3; i++) {
      sc.box({ x: 0.2 + i * 1.7, y: 0.5, w: 1.5, d: 1.5, h: 0.5, tone: "d" });
      sc.sphere({ x: 0.55 + i * 1.7, y: 0.85, z: 0.5, r: 0.25, tone: "b" });
      sc.sphere({ x: 1.05 + i * 1.7, y: 1.35, z: 0.5, r: 0.25, tone: "b" });
    }
  },
  ratio: (sc) => {
    plinth(sc, 5.6, 2.2);
    const tiles = [];
    for (let i = 0; i < 5; i++)
      tiles.push({ x: 0.3 + i * 1.05, y: 0.5, w: 0.9, d: 1.4, h: 1.1, tone: i < 2 ? "a" : "b" });
    stack(sc, tiles);
  },
  conversion: (sc) => {
    plinth(sc, 5.4, 2.8);
    sc.cyl({ x: 1.1, y: 1.4, r: 0.7, h: 0.8, tone: "e" });
    sc.strip({ x: 2.1, y: 1.3, z: 0.01, w: 1.1, d: 0.2, tone: "c" });
    sc.cyl({ x: 4, y: 1.4, r: 0.9, h: 1.9, tone: "a" });
  },
  rate: (sc) => {
    plinth(sc, 5.4, 2.4);
    sc.box({ x: 0.1, y: 1.6, w: 5.2, d: 0.6, h: 0.2, tone: "c" });
    stack(sc, [
      { x: 0.3, y: 0.4, w: 1, d: 1, h: 0.8, tone: "a" },
      { x: 1.6, y: 0.4, w: 1.5, d: 1, h: 0.8, tone: "e" },
      { x: 3.4, y: 0.4, w: 1.9, d: 1, h: 0.8, tone: "b" },
    ]);
  },
  area: (sc) => {
    plinth(sc, 4.8, 3.6);
    sc.box({ x: 0.2, y: 0.3, w: 3, d: 2.2, h: 0.35, tone: "a" });
    sc.box({ x: 3.2, y: 1.2, w: 1.4, d: 1.3, h: 0.35, tone: "b" });
    sc.grid({ x: 0.2, y: 0.3, z: 0.35, w: 3, d: 2.2, step: 0.55 });
  },
  fraction: (sc) => {
    plinth(sc, 5.2, 2.4);
    stack(
      sc,
      [0, 1, 2, 3].map((i) => ({
        x: 0.2 + i * 1.2,
        y: 0.5,
        w: 1.1,
        d: 1.5,
        h: i < 3 ? 0.9 : 0.35,
        tone: i < 3 ? "a" : "d",
      })),
    );
  },
  power: (sc) => {
    plinth(sc, 3.8, 3);
    const cubes = [];
    for (let x = 0; x < 2; x++)
      for (let y = 0; y < 2; y++)
        for (let z = 0; z < 2; z++)
          cubes.push({ x: 0.3 + x, y: 0.3 + y, z, w: 0.95, d: 0.95, h: 0.95, tone: z ? "b" : "a" });
    stack(sc, cubes);
  },
  factors: (sc) => {
    plinth(sc, 4.8, 3.4);
    const tiles = [];
    for (let x = 0; x < 4; x++)
      for (let y = 0; y < 3; y++)
        tiles.push({
          x: 0.2 + x * 1.1,
          y: 0.2 + y * 1.1,
          w: 1,
          d: 1,
          h: 0.3,
          tone: x % 2 ? "b" : "a",
        });
    stack(sc, tiles);
  },
  line: (sc) => {
    plinth(sc, 5.6, 2);
    sc.box({ x: 0.2, y: 0.8, w: 5.2, d: 0.4, h: 0.15, tone: "d" });
    for (let i = 0; i < 6; i++)
      sc.box({ x: 0.3 + i * 1, y: 0.7, w: 0.08, d: 0.6, h: 0.32, tone: "c" });
    sc.sphere({ x: 1.3, y: 0.85, z: 0.15, r: 0.3, tone: "a" });
    sc.sphere({ x: 3.3, y: 0.85, z: 0.15, r: 0.3, tone: "b" });
  },
  inequality: (sc) => {
    plinth(sc, 5.6, 2);
    sc.box({ x: 0.2, y: 0.8, w: 5.2, d: 0.4, h: 0.15, tone: "d" });
    sc.box({ x: 2.4, y: 0.85, z: 0.15, w: 3, d: 0.3, h: 0.25, tone: "a" });
    sc.sphere({ x: 2.4, y: 0.85, z: 0.15, r: 0.32, tone: "d" });
  },
};
const labModelDraw = {
  ...labModels,
  percent: emblems[4],
  coordinates: emblems[7],
  balance: emblems[8],
  expression: emblems[6],
  data: emblems[2],
  solid: emblems[5],
};
export const labModelKinds = Object.keys(labModelDraw);
const labSvg = (kind, className, attrs) =>
  fitSvg(labModelDraw[kind], { ...EMBLEM, className, attrs });

/** The inline emblem for one lab model (a lab page's header). Decorative. */
export const labEmblem = (kind) =>
  labSvg(kind, "iso lab-emblem-art", 'aria-hidden="true" focusable="false"');

/** One hidden sprite holding every lab emblem, so the index draws 46 cards from 19 symbols (`<use href="#lab-emb-KIND">`). */
export function labEmblemSprite() {
  const symbols = labModelKinds.map((kind) => {
    const svg = labSvg(kind, "iso", "");
    const inner = svg.slice(svg.indexOf(">") + 1, svg.lastIndexOf("</svg>"));
    return `<symbol id="lab-emb-${kind}" viewBox="0 0 ${EMBLEM.width} ${EMBLEM.height}">${inner}</symbol>`;
  });
  return `<svg class="iso lab-emblem-sprite" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">${symbols.join("")}</svg>`;
}
