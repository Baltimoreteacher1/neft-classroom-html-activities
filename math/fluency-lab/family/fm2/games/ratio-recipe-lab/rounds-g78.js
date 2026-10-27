// Grades 7 and 8: constant of proportionality, y = kx, scale drawings, percent as a proportion, lines through the origin,
// comparing rates given in different forms, direct variation. The "recipe" is hidden behind a table, equation or graph,
// so the batch is simply the value of x. @fm2 FM-014 FM-056 FM-057 FM-058 FM-060
import { int, pick, sample } from "../../rng.js";
import { cmp, frac, mul, toDecimalString } from "../../rational.js";
import { GRAPH_CONTEXTS, MAPS, PERCENT_SHOPS, XY } from "./contexts.js";
import { asR, attempt, both, makeBench, qty, R, rowLabel, wordOf } from "./kit.js";
import { measured } from "./recipes.js";

const cap1 = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const nice = (v) => [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200, 250, 300, 400, 500, 1000].find((m) => m >= v) ?? v;
const dec = (r) => toDecimalString(r) ?? `${r.n}/${r.d}`;
const xyRows = (ctx) => [ctx.x, ctx.y];
const xBatch = (ctx) => ({ batchWord: wordOf(ctx.x), batchLabel: both((lang) => rowLabel(ctx.x, lang)) });
const recipeOf = (id) => ({ id, family: "rate", name: { en: "relationship", es: "relación" } });

function graphFor(points, k, extraX = 0) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return { xMax: nice(Math.max(...xs, extraX) + 1), yMax: nice(Math.max(...ys, extraX * k) + 1) };
}

// 17. Constant of proportionality from a table of pairs.
export function constK(level, rng, grade) {
  return attempt(() => {
    const ctx = pick(rng, XY);
    const k = asR(pick(rng, ctx.ks));
    if (level === 1 && (k.d !== 1 || k.n > 15)) return null;
    if (level === 2 && k.d === 1) return null;
    const xs = sample(rng, [2, 3, 4, 5, 6, 8, 10], 3).sort((a, b) => a - b);
    const pairs = xs.map((x) => [R(x), mul(k, R(x))]);
    const per = { x: R(1), y: k };
    const cols = [{ label: { en: "Unit rate", es: "Tasa unitaria" }, per, pin: { key: "x", value: R(1) }, ask: ["y"], showBase: false, rep: "table" }];
    if (level === 3) cols.push({ label: { en: "Bigger value", es: "Valor mayor" }, per, pin: { key: "x", value: R(pick(rng, [12, 15, 20, 25])) }, ask: ["y"], showBase: false, rep: "table" });
    return makeBench({
      skillId: "const-k",
      level,
      grade,
      hintKind: "read",
      view: "graph",
      hide: level === 3,
      style: "dec",
      recipe: recipeOf(ctx.id),
      rows: xyRows(ctx),
      cols,
      source: { rep: "table", pairs },
      graph: { ...graphFor(pairs.map(([x, y]) => [x.n, y.n / y.d]), k.n / k.d), showLine: false },
      ...xBatch(ctx),
      prompt: both((lang) => {
        const first = lang === "en" ? `${cap1(ctx.yDesc.en)} and ${ctx.xDesc.en} are proportional. The table shows pairs. Find the constant of proportionality k (${ctx.y.name.en} per 1 ${wordOf(ctx.x).one.en}).` : `${cap1(ctx.yDesc.es)} y ${ctx.xDesc.es} son proporcionales. La tabla muestra pares. Halla la constante de proporcionalidad k (${ctx.y.name.es} por 1 ${wordOf(ctx.x).one.es}).`;
        const second = level === 3 ? (lang === "en" ? ` Then use k to find ${ctx.y.name.en} when ${ctx.x.name.en} is ${cols[1].pin.value.n}.` : ` Luego usa k para hallar ${ctx.y.name.es} cuando ${ctx.x.name.es} es ${cols[1].pin.value.n}.`) : "";
        return first + second;
      }),
    });
  });
}

// 18. Equation y = kx: evaluate and, at level 3, solve backward.
export function equationYKX(level, rng, grade) {
  return attempt(() => {
    const ctx = pick(rng, XY);
    const k = asR(pick(rng, ctx.ks));
    if (level === 1 && k.d !== 1) return null;
    if (level === 2 && k.d === 1) return null;
    const x0 = int(rng, 3, level === 1 ? 10 : 20);
    const x1 = int(rng, 3, 20);
    const per = { x: R(1), y: k };
    const [sx, sy] = ctx.sym;
    const cols = [{ label: { en: `Find ${sy}`, es: `Halla ${sy}` }, per, pin: { key: "x", value: R(x0) }, ask: ["y"], showBase: false, rep: "equation" }];
    if (level === 3) cols.push({ label: { en: `Find ${sx}`, es: `Halla ${sx}` }, per, pin: { key: "y", value: mul(k, R(x1)) }, ask: ["x"], showBase: false, rep: "equation" });
    return makeBench({
      skillId: "equation-ykx",
      level,
      grade,
      hintKind: "equation",
      view: "graph",
      hide: level === 3,
      style: "dec",
      recipe: recipeOf(ctx.id),
      rows: xyRows(ctx),
      cols,
      source: { rep: "equation", text: `${sy} = ${dec(k)}${sx}`, syms: [sx, sy] },
      graph: { ...graphFor([[x0, k.n / k.d]], k.n / k.d, Math.max(x0, x1)), showLine: true },
      ...xBatch(ctx),
      prompt: both((lang) => {
        const base = lang === "en" ? `${cap1(ctx.yDesc.en)} (${sy}) and ${ctx.xDesc.en} (${sx}) follow the equation ${sy} = ${dec(k)}${sx}. Find ${sy} when ${sx} is ${x0}.` : `${cap1(ctx.yDesc.es)} (${sy}) y ${ctx.xDesc.es} (${sx}) siguen la ecuación ${sy} = ${dec(k)}${sx}. Halla ${sy} cuando ${sx} es ${x0}.`;
        const more = level === 3 ? (lang === "en" ? ` Then find ${sx} when ${sy} is ${dec(mul(k, R(x1)))}.` : ` Luego halla ${sx} cuando ${sy} es ${dec(mul(k, R(x1)))}.`) : "";
        return base + more;
      }),
    });
  });
}

// 19. Scale drawings: lengths on a drawing and in real life share one scale factor.
export function scaleDrawing(level, rng, grade) {
  return attempt(() => {
    const map = pick(rng, MAPS);
    const k = asR(pick(rng, map.ks));
    if (level === 1 && k.d !== 1) return null;
    const d = level === 1 ? R(int(rng, 2, 9)) : pick(rng, [R(5, 2), R(7, 2), R(9, 2), R(13, 2), R(3), R(4), R(6)]);
    const per = { drawing: R(1), actual: k };
    const col = (pin, ask, extra = {}) => ({ per, pin, ask, step: R(1, 2), ...extra });
    const cols = [col({ key: "drawing", value: d }, ["actual"])];
    if (level === 3) cols.push(col({ key: "actual", value: mul(k, pick(rng, [R(3, 2), R(5, 2), R(7, 2), R(9, 2)])) }, ["drawing"], { label: { en: "Real to drawing", es: "De real a dibujo" } }));
    if (level === 3) cols[0].label = { en: "Drawing to real", es: "De dibujo a real" };
    return makeBench({
      skillId: "scale-drawing",
      level,
      grade,
      hintKind: "scale",
      view: "tape",
      line: true,
      hide: level === 3,
      style: "dec",
      recipe: recipeOf(map.id),
      rows: [map.drawing, map.actual],
      cols,
      batchWord: { one: { en: "scale unit", es: "unidad de la escala" }, many: { en: "scale units", es: "unidades de la escala" } },
      batchLabel: { en: "Number of scale units", es: "Número de unidades de la escala" },
      prompt: both((lang) => {
        const kText = dec(k);
        const first = lang === "en" ? `${map.place.en}: ${map.scaleText.en(kText)}. A line on the drawing is ${qty(map.drawing, d, "en", "dec")} long. How long is it in real life?` : `${map.place.es}: ${map.scaleText.es(kText)}. Una línea del dibujo mide ${qty(map.drawing, d, "es", "dec")}. ¿Cuánto mide en la realidad?`;
        if (level < 3) return first;
        const c = cols[1].pin.value;
        const second = lang === "en" ? ` A real wall is ${qty(map.actual, c, "en", "dec")} long. How long is it on the drawing?` : ` Una pared real mide ${qty(map.actual, c, "es", "dec")}. ¿Cuánto mide en el dibujo?`;
        return first + second;
      }),
    });
  });
}

// 20. Percent as a proportion: part / whole = p / 100.
export function percentProp(level, rng, grade) {
  return attempt(() => {
    const shop = pick(rng, PERCENT_SHOPS);
    const p = pick(rng, level === 1 ? shop.easy : shop.ps);
    const W = level === 1 ? pick(rng, [20, 40, 60, 80, 120, 200]) : pick(rng, [24, 36, 45, 48, 52, 64, 75, 85, 96, 120]);
    const money = (key, en, es) => measured(key, en, es, "usd");
    const rows = [money("whole", shop.whole.en, shop.whole.es), money("part", shop.part.en, shop.part.es), money("total", shop.total.en, shop.total.es)];
    const per = { whole: R(100), part: R(p), total: R(100 + shop.sign * p) };
    const usd = (v, lang) => qty(rows[0], v, lang, "dec");
    const fwd = (label) => ({ label, per, pin: { key: "whole", value: R(W) }, ask: level === 1 ? ["part"] : ["part", "total"], step: R(1, 20) });
    const cols = [fwd(undefined)];
    if (level === 3) {
      const W2 = pick(rng, [40, 60, 80, 100, 150]);
      cols[0] = { per, pin: { key: "part", value: frac(p * W, 100) }, ask: ["whole"], step: R(1, 20), label: { en: "Find the whole", es: "Halla el total" } };
      cols.push({ per, pin: { key: "whole", value: R(W2) }, ask: ["total"], step: R(1, 20), label: { en: "Find the total", es: "Halla el resultado" }, showBase: false });
    }
    const W2v = cols[1]?.pin.value;
    return makeBench({
      skillId: "percent-prop",
      level,
      grade,
      hintKind: "scale",
      view: "tape",
      line: true,
      hide: level === 3,
      style: "dec",
      recipe: recipeOf(shop.id),
      rows,
      cols,
      batchWord: { one: { en: "group of 100", es: "grupo de 100" }, many: { en: "groups of 100", es: "grupos de 100" } },
      batchLabel: { en: "Groups of $100", es: "Grupos de $100" },
      prompt: both((lang) => {
        if (level < 3) {
          const asks = level === 1 ? shop.part[lang] : lang === "en" ? `${shop.part.en} and the ${shop.total.en}` : `${shop.part.es} y el ${shop.total.es}`;
          return lang === "en" ? `${shop.story.en(p, usd(R(W), "en"))} ${p}% means $${p} for every $100. Find the ${asks}.` : `${shop.story.es(p, usd(R(W), "es"))} El ${p} % significa $${p} por cada $100. Halla ${level === 1 ? `el ${asks}` : `el ${asks}`}.`;
        }
        const part = usd(frac(p * W, 100), lang);
        return lang === "en"
          ? `The ${shop.part.en} is ${part}, and that is ${p}% of the ${shop.whole.en}. Find the ${shop.whole.en}. Then find the ${shop.total.en} when the ${shop.whole.en} is ${usd(W2v, "en")} and the rate is ${p}%.`
          : `El ${shop.part.es} es ${part}, que es el ${p} % del ${shop.whole.es}. Halla el ${shop.whole.es}. Luego halla el ${shop.total.es} cuando el ${shop.whole.es} es ${usd(W2v, "es")} y la tasa es ${p} %.`;
      }),
    });
  });
}

const LINES_UP = [[2], [3], [4], [3, 2], [5, 2], [3, 4], [5, 4], [1, 2], [7, 2]];

// 21. Lines through the origin: the slope is the unit rate.
export function lineOrigin(level, rng, grade) {
  return attempt(() => {
    const ctx = pick(rng, GRAPH_CONTEXTS);
    const k = asR(pick(rng, level === 1 ? [[2], [3], [4], [5], [6]] : LINES_UP));
    const unit = k.d === 1 ? 1 : k.d;
    const x1 = level === 1 ? pick(rng, [2, 3]) : unit * pick(rng, [1, 2]);
    const points = [[x1, mul(k, R(x1))], [x1 + (level === 1 ? 1 : unit), mul(k, R(x1 + (level === 1 ? 1 : unit)))]];
    const per = { x: R(1), y: k };
    const cols = [{ label: { en: "Unit rate", es: "Tasa unitaria" }, per, pin: { key: "x", value: R(1) }, ask: ["y"], showBase: false, rep: "graph" }];
    const far = pick(rng, [R(5, 2), R(7, 2), R(5), R(6)]);
    if (level === 3) cols.push({ label: { en: "Farther along", es: "Más adelante" }, per, pin: { key: "x", value: far }, ask: ["y"], showBase: false, rep: "graph" });
    const gx = nice(Math.max(...points.map((p) => p[0]), level === 3 ? Math.ceil(far.n / far.d) : 0) + 1);
    const gy = nice(Math.max(...points.map((p) => p[1].n / p[1].d), level === 3 ? (far.n / far.d) * (k.n / k.d) : 0) + 1);
    return makeBench({
      skillId: "line-origin",
      level,
      grade,
      hintKind: "read",
      view: "graph",
      hide: level === 3,
      style: "dec",
      recipe: recipeOf("line"),
      rows: [ctx.x, ctx.y],
      cols,
      source: { rep: "graph", points: points.map(([x, y]) => [R(x), y]) },
      graph: { xMax: gx, yMax: gy, showLine: true },
      ...xBatch(ctx),
      prompt: both((lang) => {
        const base = lang === "en" ? `${ctx.says.en} The graph shows a line through the origin. What is the unit rate, or slope (${ctx.y.name.en} per 1 ${wordOf(ctx.x).one.en})?` : `${ctx.says.es} La gráfica muestra una recta que pasa por el origen. ¿Cuál es la tasa unitaria, o pendiente (${ctx.y.name.es} por 1 ${wordOf(ctx.x).one.es})?`;
        const more = level === 3 ? (lang === "en" ? ` Then find ${ctx.y.name.en} when ${ctx.x.name.en} is ${dec(far)}.` : ` Luego halla ${ctx.y.name.es} cuando ${ctx.x.name.es} es ${dec(far)}.`) : "";
        return base + more;
      }),
    });
  });
}

// 22. Compare two rates given as a table, an equation or a graph.
export function compareRates(level, rng, grade) {
  return attempt(() => {
    const ctx = pick(rng, GRAPH_CONTEXTS);
    const pool = level === 1 ? [[2], [3], [4], [5], [6], [8]] : level === 2 ? [[3, 2], [5, 2], [3, 4], [5, 4], [7, 2], [2], [3], [4]] : [[9, 4], [5, 2], [11, 4], [12, 5], [13, 5], [7, 4], [9, 5]];
    const rA = asR(pick(rng, pool));
    const rB = asR(pick(rng, pool));
    if (cmp(rA, rB) === 0) return null;
    if (level === 3 && Math.abs(rA.n / rA.d - rB.n / rB.d) > 0.45) return null;
    const combos = level === 1 ? [["table", "equation"]] : level === 2 ? [["table", "graph"], ["graph", "equation"]] : [["equation", "graph"], ["table", "equation"], ["graph", "table"]];
    const reps = pick(rng, combos);
    const rates = [rA, rB];
    const sources = reps.map((rep, i) => {
      const r = rates[i];
      if (rep === "graph" && r.d > 5) return null;
      if (rep === "table") return { rep, pairs: [2, 4, 6].map((x) => [R(x), mul(r, R(x))]) };
      if (rep === "equation") return { rep, text: `y = ${dec(r)}x` };
      return { rep, points: [[R(r.d), mul(r, R(r.d))], [R(2 * r.d), mul(r, R(2 * r.d))]], k: r };
    });
    if (sources.includes(null)) return null;
    const shown = (s, r) => (s.rep === "table" ? r.n / r.d * 6 : s.rep === "equation" ? r.n / r.d : (r.n / r.d) * 2 * r.d);
    const winner = cmp(rA, rB) > 0 ? 0 : 1;
    const trap = shown(sources[1 - winner], rates[1 - winner]) > shown(sources[winner], rates[winner]);
    const label = (t) => ({ en: `Relationship ${t}`, es: `Relación ${t}` });
    const per = (r) => ({ x: R(1), y: r });
    return makeBench({
      skillId: "compare-rates",
      level,
      grade,
      hintKind: "compare",
      view: "graph",
      hide: level === 3,
      style: "dec",
      layout: "stack",
      recipe: recipeOf("compare"),
      rows: [ctx.x, ctx.y],
      cols: reps.map((rep, i) => ({ label: label("AB"[i]), per: per(rates[i]), pin: { key: "x", value: R(1) }, ask: ["y"], showBase: false, rep, source: sources[i] })),
      pick: { question: { en: "Which relationship has the greater rate?", es: "¿Qué relación tiene la tasa mayor?" }, options: [label("A"), label("B")], answer: winner, wrong: trap ? "pick-bigger-number" : "pick-weaker" },
      ...xBatch(ctx),
      prompt: both((lang) =>
        lang === "en"
          ? `${ctx.says.en} Relationship A and Relationship B are both proportional. Find each unit rate (${ctx.y.name.en} per 1 ${wordOf(ctx.x).one.en}), then choose the greater rate.`
          : `${ctx.says.es} La relación A y la relación B son proporcionales. Halla cada tasa unitaria (${ctx.y.name.es} por 1 ${wordOf(ctx.x).one.es}) y elige la tasa mayor.`,
      ),
    });
  });
}

// 23. Direct variation: find k from one pair, then use y = kx forward or backward.
export function directVariation(level, rng, grade) {
  return attempt(() => {
    const ctx = pick(rng, XY);
    const k = asR(pick(rng, ctx.ks));
    if (level === 1 && (k.d !== 1 || k.n > 15)) return null;
    if (level > 1 && k.d === 1) return null;
    const x0 = pick(rng, [2, 4, 5, 8]);
    const x1 = level === 1 ? x0 * int(rng, 2, 4) : int(rng, 3, 16);
    if (x1 === x0) return null;
    const y0 = mul(k, R(x0));
    const per = { x: R(x0), y: y0 };
    const back = level === 3;
    const col = back ? { per, pin: { key: "y", value: mul(k, R(x1)) }, ask: ["x"], step: R(1, x0) } : { per, pin: { key: "x", value: R(x1) }, ask: ["y"], step: R(1, x0) };
    return makeBench({
      skillId: "direct-variation",
      level,
      grade,
      hintKind: "scale",
      view: "graph",
      hide: level === 3,
      style: "dec",
      recipe: recipeOf(ctx.id),
      rows: xyRows(ctx),
      cols: [col],
      extra: [{ key: "k", kind: "num", answer: k, label: { en: "The constant k in y = kx", es: "La constante k en y = kx" } }],
      graph: { ...graphFor([[x0, y0.n / y0.d]], k.n / k.d, x1), showLine: true },
      batchWord: { one: { en: "copy of the first pair", es: "copia del primer par" }, many: { en: "copies of the first pair", es: "copias del primer par" } },
      batchLabel: { en: "Copies of the first pair", es: "Copias del primer par" },
      prompt: both((lang) => {
        const head = lang === "en" ? `${cap1(ctx.yDesc.en)} and ${ctx.xDesc.en} vary directly. When ${ctx.x.name.en} is ${x0}, ${ctx.y.name.en} is ${dec(y0)}.` : `${cap1(ctx.yDesc.es)} y ${ctx.xDesc.es} varían directamente. Cuando ${ctx.x.name.es} es ${x0}, ${ctx.y.name.es} es ${dec(y0)}.`;
        const tail = back ? (lang === "en" ? ` Find k, then find ${ctx.x.name.en} when ${ctx.y.name.en} is ${dec(col.pin.value)}.` : ` Halla k y luego halla ${ctx.x.name.es} cuando ${ctx.y.name.es} es ${dec(col.pin.value)}.`) : lang === "en" ? ` Find k, then find ${ctx.y.name.en} when ${ctx.x.name.en} is ${x1}.` : ` Halla k y luego halla ${ctx.y.name.es} cuando ${ctx.x.name.es} es ${x1}.`;
        return head + tail;
      }),
    });
  });
}
