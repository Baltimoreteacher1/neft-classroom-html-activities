// Adding fractions with unlike denominators by cutting both into common units.
// Config: { a: {n, d}, b: {n, d}, lang }. Proper fractions, denominators 2-12, common denominator at most 36.
import { cap, fracText, gcd, intIn, label, lcm, line, rect } from "./anim-kit.js";
import { createPlayer } from "./player.js";

const C = {
  title: "Adding fractions with unlike denominators using a common unit",
  start:
    "{an}/{ad} and {bn}/{bd} use different size pieces, so we cannot add the pieces yet. We need pieces of the same size.",
  cut: "Cut both bars into equal pieces that are each 1/{L} of the whole. Then {an}/{ad} = {fa}/{L} and {bn}/{bd} = {fb}/{L}.",
  join: "Slide the shaded pieces onto one bar. They are the same size now, so we can count them: {fa} + {fb} = {T} pieces of size 1/{L}.",
  sum: "{an}/{ad} + {bn}/{bd} = {fa}/{L} + {fb}/{L} = {T}/{L}.",
  simplest: "{an}/{ad} + {bn}/{bd} = {fa}/{L} + {fb}/{L} = {T}/{L}. This is already in simplest form.",
  reduce:
    "Divide the top and the bottom by {g}: {T}/{L} = {sn}/{sd}. So {an}/{ad} + {bn}/{bd} = {sn}/{sd}.",
  mixed:
    "{T}/{L} is more than one whole: {T}/{L} = {w} {rn}/{rd}. So {an}/{ad} + {bn}/{bd} = {w} {rn}/{rd}.",
  reduceMixed:
    "Divide the top and the bottom by {g}: {T}/{L} = {sn}/{sd}, which is {w} {rn}/{rd}. So {an}/{ad} + {bn}/{bd} = {w} {rn}/{rd}.",
  whole: "{T}/{L} is exactly 1 whole. So {an}/{ad} + {bn}/{bd} = 1.",
};
export const KEYS = Object.values(C);

const MAX_COMMON = 36;
const DEFAULT = { a: { n: 1, d: 3 }, b: { n: 1, d: 4 } };
const BAR = { x: 24, w: 360, h: 44 };
const ROW = { a: 28, b: 100, sum: 190, wrap: 60 };

function readFraction(f) {
  const d = intIn(f?.d, 2, 12, 0);
  const n = d ? intIn(f?.n, 1, d - 1, 0) : 0;
  return n ? { n, d } : null;
}

export function normalizeConfig(config = {}) {
  const a = readFraction(config.a);
  const b = readFraction(config.b);
  if (!a || !b || lcm(a.d, b.d) > MAX_COMMON) return { a: { ...DEFAULT.a }, b: { ...DEFAULT.b } };
  return { a, b };
}

export function buildModel(config = {}) {
  const { a, b } = normalizeConfig(config);
  const L = lcm(a.d, b.d);
  const fa = (a.n * L) / a.d;
  const fb = (b.n * L) / b.d;
  const T = fa + fb;
  const g = gcd(T, L);
  const sn = T / g;
  const sd = L / g;
  const w = Math.floor(sn / sd);
  const rn = sn - w * sd;
  const cw = BAR.w / L;
  const wholes = Math.ceil(T / L);
  const sumY = (k) => ROW.sum + k * ROW.wrap;
  const sumBottom = sumY(wholes - 1) + BAR.h;
  const names = { an: a.n, ad: a.d, bn: b.n, bd: b.d };
  const mixedText = rn ? `${w} ${rn}/${sd}` : String(w);
  const sumLabel = sn > sd ? mixedText : fracText(sn, sd);

  const rowBase = (key, y, frac, big, fine, stepNo) => {
    const items = [];
    if (stepNo >= 2)
      for (let k = 0; k < fine; k += 1)
        items.push(rect(`${key}-g${k}`, BAR.x + k * cw, y, cw, BAR.h, "an-cell an-ghost", {}));
    for (let k = 0; k < fine; k += 1)
      items.push(rect(`${key}-f${k}`, BAR.x + k * cw, y, cw, BAR.h, `an-cell ${key === "A" ? "an-on" : "an-on2"} an-flat`, { role: "piece" }));
    if (stepNo >= 1)
      for (let k = 1; k < L; k += 1)
        if (k % (L / big) !== 0) items.push(line(`${key}-cut${k}`, BAR.x + k * cw, y, BAR.x + k * cw, y + BAR.h, "an-cut"));
    for (let j = 0; j < big; j += 1)
      items.push(rect(`${key}-big${j}`, BAR.x + (j * BAR.w) / big, y, BAR.w / big, BAR.h, "an-outline", {}));
    const text = stepNo >= 1 ? fracText(key === "A" ? fa : fb, L) : fracText(frac.n, frac.d);
    items.push(label(`${key}-lab`, 396, y + BAR.h / 2 + 10, text, "an-num", { a: { "text-anchor": "start" } }));
    return items;
  };

  const sumBoxes = () => {
    const items = [];
    for (let k = 0; k < wholes; k += 1)
      items.push(rect(`S-box${k}`, BAR.x, sumY(k), BAR.w, BAR.h, "an-outline an-sumbox", {}));
    return items;
  };
  const place = (p) => ({ x: BAR.x + (p % L) * cw, y: sumY(Math.floor(p / L)) });

  const scene = (stepNo) => {
    const items = [];
    const a1 = rowBase("A", ROW.a, a, a.d, fa, stepNo);
    const b1 = rowBase("B", ROW.b, b, b.d, fb, stepNo);
    items.push(...a1, ...b1, ...sumBoxes());
    if (stepNo >= 2) {
      // The shaded pieces travel to the sum bar: A's pieces straight down, B's after A's.
      for (const it of items) {
        const m = /^([AB])-f(\d+)$/.exec(it.id);
        if (!m) continue;
        const p = m[1] === "A" ? Number(m[2]) : fa + Number(m[2]);
        Object.assign(it.a, { x: place(p).x, y: place(p).y });
        it.cls = `an-cell ${m[1] === "A" ? "an-on" : "an-on2"} an-seam`;
      }
      if (T <= L) {
        const mid = (from, to) => BAR.x + ((from + to) / 2) * cw;
        items.push(
          label("S-a", mid(0, fa), sumBottom + 26, fracText(fa, L), "an-note", { a: { "text-anchor": "middle" } }),
          label("S-b", mid(fa, T), sumBottom + 26, fracText(fb, L), "an-note", { a: { "text-anchor": "middle" } }),
        );
      }
    }
    const text = stepNo >= 3 ? fracText(T, L) : "?";
    const shown = stepNo >= 4 ? sumLabel : text;
    items.push(label("S-lab", 396, ROW.sum + BAR.h / 2 + 10, shown, "an-num", { a: { "text-anchor": "start" } }));
    return items;
  };

  const needsMore = g > 1 || sn >= sd;
  const eq = `${fracText(a.n, a.d)} + ${fracText(b.n, b.d)} = ${fracText(T, L)}`;
  const steps = [
    { caption: cap(C.start, names), stage: 0 },
    { caption: cap(C.cut, { ...names, L, fa, fb }), stage: 1 },
    { caption: cap(C.join, { L, fa, fb, T }), stage: 2 },
    { caption: cap(needsMore ? C.sum : C.simplest, { ...names, L, fa, fb, T }), stage: 3 },
  ];
  if (needsMore) {
    let key = C.reduce;
    if (sn === sd) key = C.whole;
    else if (sn > sd) key = g > 1 ? C.reduceMixed : C.mixed;
    steps.push({ caption: cap(key, { ...names, g, T, L, sn, sd, w, rn, rd: sd }), stage: 4 });
  }
  const finalText = needsMore
    ? `${fracText(a.n, a.d)} + ${fracText(b.n, b.d)} = ${sn > sd ? (rn ? `${w} ${fracText(rn, sd)}` : "1") : fracText(sn, sd)}`
    : eq;
  return {
    kind: "fraction-addition",
    title: cap(C.title),
    view: [480, sumBottom + 84],
    steps: steps.map(({ caption, stage }, i) => {
      const items = scene(stage);
      const last = i === steps.length - 1;
      const written = last ? finalText : stage >= 3 ? eq : "";
      if (written) items.push(label("eq", BAR.x, sumBottom + 70, written, "an-eq", { a: { "text-anchor": "start" } }));
      return { caption, scene: items, state: { stage, common: L, fa, fb, T } };
    }),
    result: { sum: { n: sn, d: sd }, common: { n: T, d: L }, whole: w, remainder: { n: rn, d: sd }, L, fa, fb },
  };
}

export const play = (container, config = {}) => createPlayer(container, buildModel(config), config);
