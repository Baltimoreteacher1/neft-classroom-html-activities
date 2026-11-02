// 1/2 = 2/4 = 4/8: cut the same whole into more equal pieces. Config: { fraction: {n, d}, splits: [k, ...], lang }.
import { cap, fracText, intIn, label, line, rect } from "./anim-kit.js";
import { createPlayer } from "./player.js";

const C = {
  title: "Equivalent fractions: cutting the same whole into smaller equal pieces",
  start:
    "The bar is one whole, cut into {d} equal parts. {n} of them are shaded, so the shaded amount is {n}/{d}.",
  split:
    "Cut every part into {k} equal pieces. Now there are {D} equal pieces and {N} are shaded. {pn}/{pd} = {N}/{D}, because {pn} × {k} = {N} and {pd} × {k} = {D}.",
  done: "The shaded amount did not change, so {chain}. Cutting every part into equal pieces multiplies the top and the bottom number by the same amount.",
  same: "Same length",
};
export const KEYS = Object.values(C);

const MAX_PIECES = 24;
const BAR = { x: 24, w: 336, h: 48, pitch: 78, top: 20 };

export function normalizeConfig(config = {}) {
  const f = config.fraction || {};
  const d = intIn(f.d, 2, 12, 2);
  const n = intIn(f.n, 1, d - 1, 1);
  const asked = Array.isArray(config.splits) ? config.splits.slice(0, 3) : [];
  const splits = [];
  let pieces = d;
  for (const k of asked.length ? asked : [2, 2]) {
    const factor = intIn(k, 2, 6, 0);
    if (!factor || pieces * factor > MAX_PIECES) break;
    splits.push(factor);
    pieces *= factor;
  }
  if (!splits.length) splits.push(2);
  return { fraction: { n, d }, splits };
}

export function buildModel(config = {}) {
  const { fraction, splits } = normalizeConfig(config);
  const stages = [{ n: fraction.n, d: fraction.d, k: 1 }];
  for (const k of splits) {
    const prev = stages[stages.length - 1];
    stages.push({ n: prev.n * k, d: prev.d * k, k });
  }
  const rows = stages.length;
  const bottom = BAR.top + (rows - 1) * BAR.pitch + BAR.h;
  const height = bottom + 84;
  const rowY = (i) => BAR.top + i * BAR.pitch;
  const chain = stages.map((s) => fracText(s.n, s.d)).join(" = ");

  const rowItems = (i) => {
    const s = stages[i];
    const cellW = BAR.w / s.d;
    const parent = stages[i - 1];
    const items = [];
    for (let j = 0; j < s.d; j += 1) {
      const from =
        i > 0
          ? (() => {
              const p = Math.floor(j / s.k);
              return { a: { x: BAR.x + p * (BAR.w / parent.d), width: BAR.w / parent.d, y: rowY(i - 1) }, o: 0.4 };
            })()
          : undefined;
      items.push(
        rect(`r${i}c${j}`, BAR.x + j * cellW, rowY(i), cellW, BAR.h, j < s.n ? "an-cell an-on" : "an-cell an-off", {
          role: j < s.n ? "shaded" : "empty",
          ...(from ? { from } : {}),
        }),
      );
    }
    items.push(label(`lab${i}`, 384, rowY(i) + BAR.h / 2 + 10, fracText(s.n, s.d), "an-num", { a: { "text-anchor": "start" } }));
    if (i > 0)
      items.push(
        label(`mul${i}`, 384, rowY(i) - 8, `×${s.k}`, "an-chip", {
          a: { "text-anchor": "start" },
          from: { a: { y: rowY(i) - 22 }, o: 0 },
        }),
      );
    return items;
  };

  const steps = stages.map((s, i) => {
    const scene = [];
    for (let r = 0; r <= i; r += 1) scene.push(...rowItems(r));
    const caption =
      i === 0
        ? cap(C.start, { n: s.n, d: s.d })
        : cap(C.split, { k: s.k, D: s.d, N: s.n, pn: stages[i - 1].n, pd: stages[i - 1].d });
    return { caption, scene, state: { n: s.n, d: s.d, i } };
  });
  // Final summary frame: the same amount marked on every bar, with the whole chain written out.
  const final = steps[steps.length - 1];
  const edge = BAR.x + (BAR.w * fraction.n) / fraction.d;
  steps.push({
    caption: cap(C.done, { chain }),
    scene: [
      ...final.scene,
      line("same", edge, rowY(0) - 8, edge, bottom + 10, "an-guide", { from: { a: { y2: rowY(0) - 8 }, o: 1 } }),
      label("same-lab", edge, bottom + 34, cap(C.same), "an-note", { a: { "text-anchor": "middle" } }),
      label("chain", BAR.x, bottom + 72, chain, "an-eq", { a: { "text-anchor": "start" } }),
    ],
    state: { n: final.state.n, d: final.state.d, i: rows, chain },
  });
  return {
    kind: "fraction-equivalence",
    title: cap(C.title),
    view: [480, height],
    steps,
    result: { fractions: stages.map((s) => ({ n: s.n, d: s.d })), chain },
  };
}

export const play = (container, config = {}) => createPlayer(container, buildModel(config), config);
