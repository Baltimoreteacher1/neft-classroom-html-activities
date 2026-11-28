// Math Literacy Studio: grade 7-8 problem families (docs/math-literacy/architecture.md).
// Each family is { title, grades, defaults, gen(rng, params, opts), check?(problem, params) } and every generator ends with finalize().
// The independent solvers live in tools/mls-verify/g78.mjs and re-solve from `spec` alone.
//
// Params honoured (any other param is ignored):
//   proportional  mode: "" (constant of proportionality, graph/table/equation/verbal, missing value, meaning of (1, r) and (0, 0))
//                       | "compare" (one relationship in two representations: greater rate, same rate, difference)
//                       | "argue" (a claim that a table, graph or equation is proportional: verdict, or the row that breaks it)
//   linear        mode: "" (equations with variables on both sides, distributing, rational coefficients, number of solutions)
//                       | "model" (a situation as y = mx + b: value at a stated x, x for a stated y, or the equation)
//   scale, circle, probability, sampling, systems, functions, slope, exponents, irrational, transform, similarity, pythag, scatter
//                 take no params (their levels 1-3 are the only dial).
// opts.level (1-3) is mathematical complexity inside the skill's own grade; opts.ctx picks the story setting where one is natural.
import { Fr, fr, num, fracText, MINUS, TIMES, DIVIDE, NAMES, twoNames, thing, finalize } from "../kit.js";

export const FAMILIES = {};

// ---------------------------------------------------------------------------------------------------------------- helpers
const ST = (plain, standard, rich) => ({ plain, standard, rich });
/** Spec string of an exact rational: "7", "-3", "5/2". Solvers parse it back exactly. */
const S = (f) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);
const eqF = (a, b) => a.cmp(b) === 0;
const absF = (f) => (f.n < 0 ? fr(-f.n, f.d) : f);
const negF = (f) => fr(-f.n, f.d);
/** A number that is a fraction gets brackets inside a calculation, so 56 ÷ (8/3) cannot be read as (56 ÷ 8)/3. */
const par = (t) => (t.includes("/") || t.startsWith(MINUS) ? `(${t})` : t);
const pf = (f, dm = false) => par(T(f, dm));
/** "lhs = result", or "lhs gives result" when the result carries a thousands comma (a comma would read as the end of the number to the checkers). */
const E = (lhs, res, dm = false) => {
  const t = typeof res === "number" ? num(res) : T(res, dm);
  return t.includes(",") ? `${lhs} gives ${t}` : `${lhs} = ${t}`;
};
const an = (w) => (/^[aeiou]/i.test(w) ? "an" : "a");
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const isTerm = (f) => {
  let d = f.d;
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  return d === 1;
};
/** Terminating decimal text of a Fr with at least `min` places and no needless trailing zeros; null when it does not terminate. */
function decOf(f, min = 1) {
  let d = f.d;
  let a = 0;
  let b = 0;
  while (d % 2 === 0) {
    d /= 2;
    a++;
  }
  while (d % 5 === 0) {
    d /= 5;
    b++;
  }
  if (d !== 1) return null;
  const places = Math.max(a, b, min);
  const digits = String((Math.abs(f.n) * 10 ** places) / f.d).padStart(places + 1, "0");
  let s = `${digits.slice(0, -places)}.${digits.slice(-places)}`;
  const keep = s.indexOf(".") + 1 + min;
  let end = s.length;
  while (end > keep && s[end - 1] === "0") end--;
  s = s.slice(0, end);
  return (f.n < 0 ? "-" : "") + s;
}
/** Display text of a Fr: integer, decimal (when `dm` and it terminates), else a slash fraction. */
function T(f, dm = false) {
  if (f.d === 1) return num(f.n);
  if (dm) {
    const d = decOf(f);
    if (d) return d.replace("-", MINUS);
  }
  return fracText(f.n, f.d);
}
/** "3 pencils" / "1/2 hour" / "0.5 hours": a quantity with the right noun form. */
function qty(f, noun, dm = false) {
  const t = T(f, dm);
  const one = eqF(f, fr(1)) || (f.d !== 1 && !(dm && decOf(f)) && f.n > 0 && f.n < f.d);
  return `${t} ${one ? noun[0] : noun[1]}`;
}
/** Canonical numeric answer: int when whole, dec when asked and terminating, else reduced frac. */
function A(f, { dec = false, unit } = {}) {
  let value;
  let kind;
  if (f.d === 1) {
    value = String(f.n);
    kind = "int";
  } else if (dec && decOf(f)) {
    value = decOf(f);
    kind = "dec";
  } else {
    value = `${f.n}/${f.d}`;
    kind = "frac";
  }
  const a = { value, kind, text: kind === "int" ? num(f.n) : value.replace("-", MINUS) };
  if (unit) a.unit = unit;
  return a;
}
/** Up to three numeric distractors from [Fr, tag] candidates (skips the answer and repeats), formatted like the answer. */
function D(ans, cands, dm = false) {
  const seen = [ans];
  const out = [];
  const ok = cands.filter(([v]) => v != null);
  // Prefer wrong answers that look like the right one: whole when it is whole, and not negative when it is not.
  const passes = [(v) => (ans.d !== 1 || v.d === 1) && (ans.n < 0 || v.n >= 0), (v) => ans.n < 0 || v.n >= 0, () => true];
  for (const want of passes) {
    for (const [v, tag] of ok) {
      if (out.length === 3) break;
      if (!want(v) || seen.some((o) => eqF(o, v))) continue;
      seen.push(v);
      out.push({ text: T(v, dm), misconception: tag });
    }
  }
  for (const off of [1, -1, 10, -10, 2]) {
    if (out.length >= 3) break;
    const v = ans.add(fr(off));
    if (ans.n >= 0 && v.n < 0) continue;
    if (seen.some((o) => eqF(o, v))) continue;
    seen.push(v);
    out.push({ text: T(v, dm), misconception: "arithmetic-slip-in-the-last-step" });
  }
  return out;
}
/** Distractors for a decimal-string answer (value already rounded): candidates are [string, tag]. */
function DS(ansStr, cands) {
  const seen = new Set([ansStr]);
  const out = [];
  for (const [v, tag] of cands) {
    if (v == null || seen.has(v)) continue;
    seen.add(v);
    out.push({ text: v, misconception: tag });
    if (out.length === 3) break;
  }
  return out;
}
const dist = (arr) => arr.map(([text, misconception]) => ({ text, misconception }));
const pairText = (a, b) => `(${a}, ${b})`;
const pairsText = (rows) => rows.map(([x, y]) => pairText(x, y)).join(", ");
const H = (conceptual, procedural) => ({ conceptual, procedural });
/** A type table entry: { lv: [levels it serves], gen(ctxObj) -> problem parts }. */
function pickType(rng, level, types) {
  const ok = types.filter((t) => t.lv.includes(level));
  return rng.pick(ok.length ? ok : types);
}
/** Finalize with a safety net: a hint may never state the answer, so a collision swaps in number-free hints. */
function done(p) {
  const ans = String(p.answer.text ?? p.answer.value);
  const hit = (s) => ans.length >= 3 && new RegExp(`(^|[^\\d./])${ans.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\d/]|$)`).test(s);
  if (hit(p.hints.conceptual) || hit(p.hints.procedural)) {
    p.hints = H("Say in your own words what the question is asking before you calculate.", "Work one step at a time, write each step down, then check it against the facts in the problem.");
  }
  return finalize(p);
}
const modeCheck = (def) => (p, params) => {
  const want = (params && params.mode) || def;
  return (p.spec.mode || def) === want ? "" : `mode ${p.spec.mode} does not match the skill's mode ${want}`;
};
/** A plot box with tidy grid step. */
const niceStep = (m) => (m <= 10 ? 1 : m <= 20 ? 2 : m <= 50 ? 5 : m <= 100 ? 10 : 20);
function box(maxX, maxY, minX = 0, minY = 0) {
  const step = niceStep(Math.max(maxX, maxY, -minX, -minY));
  const up = (v) => (Math.floor(v / step) + 1) * step;
  const dn = (v) => (v >= 0 ? 0 : -(Math.floor(-v / step) + 1) * step);
  return { xmin: dn(minX), xmax: up(maxX), ymin: dn(minY), ymax: up(maxY), step };
}
const gcdI = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};
/** Integer sqrt/cbrt for exact checks in generators. */
const isqrt = (n) => {
  let x = Math.floor(Math.sqrt(n));
  while (x * x > n) x--;
  while ((x + 1) * (x + 1) <= n) x++;
  return x;
};
/** sqrt(v) rounded to `places` decimals, exactly (integer comparison), as text. */
function roundSqrt(v, places) {
  const scale = 10 ** places;
  const scaled = v * scale * scale;
  const r = isqrt(scaled);
  const t = scaled >= r * r + r + 1 ? r + 1 : r;
  return `${Math.floor(t / scale)}.${String(t % scale).padStart(places, "0")}`;
}

// ---------------------------------------------------------------------------------------------------------------- story scenes
const SC = (x, y, did) => ({ x, y, did });
/** Rate stories: two counted quantities and a sentence giving "y for x" with a steady rate. */
const SCENES = {
  store: [
    SC(["pencil", "pencils"], ["dollar", "dollars"], (n, x, y) => `${n} pays ${y} for ${x}.`),
    SC(["notebook", "notebooks"], ["dollar", "dollars"], (n, x, y) => `${n} spends ${y} on ${x}.`),
  ],
  garden: [
    SC(["minute", "minutes"], ["liter", "liters"], (n, x, y) => `${n}'s hose pours ${y} of water in ${x}.`),
    SC(["bean plant", "bean plants"], ["bean", "beans"], (n, x, y) => `${n} picks ${y} from ${x}.`),
  ],
  sports: [
    SC(["minute", "minutes"], ["lap", "laps"], (n, x, y) => `${n} runs ${y} in ${x}.`),
    SC(["game", "games"], ["goal", "goals"], (n, x, y) => `${n}'s team scores ${y} in ${x}.`),
  ],
  kitchen: [
    SC(["tray", "trays"], ["cookie", "cookies"], (n, x, y) => `${n} bakes ${y} on ${x}.`),
    SC(["cup of flour", "cups of flour"], ["muffin", "muffins"], (n, x, y) => `${n} makes ${y} with ${x}.`),
  ],
  pets: [
    SC(["day", "days"], ["kilogram", "kilograms"], (n, x, y) => `${n}'s rabbits eat ${y} of food in ${x}.`),
    SC(["tank", "tanks"], ["fish", "fish"], (n, x, y) => `${n} puts ${y} into ${x}.`),
  ],
  library: [
    SC(["hour", "hours"], ["page", "pages"], (n, x, y) => `${n} reads ${y} in ${x}.`),
    SC(["shelf", "shelves"], ["book", "books"], (n, x, y) => `${n} puts ${y} on ${x}.`),
  ],
  crafts: [
    SC(["bracelet", "bracelets"], ["bead", "beads"], (n, x, y) => `${n} uses ${y} to make ${x}.`),
    SC(["minute", "minutes"], ["paper star", "paper stars"], (n, x, y) => `${n} folds ${y} in ${x}.`),
  ],
  travel: [
    SC(["hour", "hours"], ["mile", "miles"], (n, x, y) => `${n}'s bus travels ${y} in ${x}.`),
    SC(["ticket", "tickets"], ["dollar", "dollars"], (n, x, y) => `${n} pays ${y} for ${x}.`),
  ],
  science: [
    SC(["second", "seconds"], ["centimeter", "centimeters"], (n, x, y) => `${n}'s toy car rolls ${y} in ${x}.`),
    SC(["minute", "minutes"], ["milliliter", "milliliters"], (n, x, y) => `A beaker collects ${y} of water in ${x}.`),
  ],
  community: [
    SC(["hour", "hours"], ["flyer", "flyers"], (n, x, y) => `${n} hands out ${y} in ${x}.`),
    SC(["box", "boxes"], ["can", "cans"], (n, x, y) => `${n} packs ${y} into ${x}.`),
  ],
};
const sceneOf = (rng, ctx) => rng.pick(SCENES[ctx] || SCENES.store);
/** Start-and-change stories (y = mx + b): [a quantity that grows, a quantity that shrinks] per context. */
const MS = (what, x, y) => ({ what, x, y });
const MODELS = {
  store: [MS("savings", ["week", "weeks"], ["dollar", "dollars"]), MS("money left on a lunch card", ["day", "days"], ["dollar", "dollars"])],
  garden: [MS("height of a bean plant", ["week", "weeks"], ["centimeter", "centimeters"]), MS("water in a rain barrel", ["day", "days"], ["liter", "liters"])],
  sports: [MS("distance a runner has covered", ["minute", "minutes"], ["meter", "meters"]), MS("number of snack bars left in a team box", ["game", "games"], ["bar", "bars"])],
  kitchen: [MS("number of cookies baked", ["hour", "hours"], ["cookie", "cookies"]), MS("flour left in a bag", ["batch", "batches"], ["cup", "cups"])],
  pets: [MS("weight of a puppy", ["week", "weeks"], ["pound", "pounds"]), MS("food left in a pet food bin", ["day", "days"], ["pound", "pounds"])],
  library: [MS("number of books a class has read", ["week", "weeks"], ["book", "books"]), MS("number of pages left in a book", ["day", "days"], ["page", "pages"])],
  crafts: [MS("length of a paper chain", ["minute", "minutes"], ["centimeter", "centimeters"]), MS("number of beads left in a jar", ["bracelet", "bracelets"], ["bead", "beads"])],
  travel: [MS("distance from home", ["hour", "hours"], ["mile", "miles"]), MS("fuel left in a tank", ["hour", "hours"], ["liter", "liters"])],
  science: [MS("temperature of a heated liquid", ["minute", "minutes"], ["degree", "degrees"]), MS("liquid left in a beaker", ["minute", "minutes"], ["milliliter", "milliliters"])],
  community: [MS("money raised for a food drive", ["day", "days"], ["dollar", "dollars"]), MS("number of flyers left in a pile", ["hour", "hours"], ["flyer", "flyers"])],
};
const modelOf = (rng, ctx, grows = true) => (MODELS[ctx] || MODELS.store)[grows ? 0 : 1];

/** The string "mx" for a coefficient, e.g. x, −x, 3x, 2.5x, (3/4)x. */
function mx(f, dm = false) {
  if (eqF(f, fr(1))) return "x";
  if (eqF(f, fr(-1))) return `${MINUS}x`;
  if (f.d === 1) return `${num(f.n)}x`;
  return dm && decOf(f) ? `${T(f, true)}x` : `(${T(f)})x`;
}
/** "mx + b" with typographic signs. */
const linText = (m, b, dm = false) => `${mx(m, dm)}${b.n === 0 ? "" : ` ${b.n < 0 ? MINUS : "+"} ${T(absF(b), dm)}`}`;

// ================================================================================================================ proportional
function kChoice(rng, level) {
  if (level === 1) return fr(rng.int(2, 9));
  if (level === 2) return rng.pick([fr(3, 2), fr(5, 2), fr(7, 2), fr(9, 2), fr(3, 4), fr(5, 4), fr(7, 4), fr(1, 2), fr(2, 5), fr(6, 5), fr(8, 5), fr(4, 5)]);
  let k;
  do k = fr(rng.int(2, 19), rng.pick([2, 3, 4, 5, 6, 8]));
  while (k.d === 1);
  return k;
}
const dmFor = (rng, k) => isTerm(k) && k.d !== 1 && rng.chance(0.65);
const xsFor = (rng, k, dm, n = 4) => {
  const unit = dm ? 1 : k.d;
  const start = rng.int(1, 3);
  const step = rng.int(1, 2);
  return Array.from({ length: n }, (_, i) => unit * (start + i * step));
};
/** Increasing x-values that are not evenly spaced (so "y goes up by the same amount" is not true of a proportional table). */
function unevenXs(rng, unit, n = 4) {
  for (;;) {
    const xs = rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], n).sort((a, b) => a - b);
    const d = xs.slice(1).map((v, i) => v - xs[i]);
    if (new Set(d).size > 1) return xs.map((x) => x * unit);
  }
}
const rowsOf = (k, xs) => xs.map((x) => [fr(x), k.mul(fr(x))]);
const disp = (rows, dm) => rows.map(([x, y]) => [T(x), T(y, dm)]);
const specRows = (rows) => rows.map(([x, y]) => [S(x), S(y)]);
const ratioVis = (s, rows, hide, alt) => ({ kind: "ratiotable", alt, headers: [cap(s.x[1]), cap(s.y[1])], rows, hide });

const propTableK = {
  lv: [1, 2, 3],
  gen({ rng, level, s }) {
    const k = kChoice(rng, level);
    const dm = dmFor(rng, k);
    const rows = rowsOf(k, xsFor(rng, k, dm, 4));
    const d = disp(rows, dm);
    const pr = pairsText(d);
    const [x1, y1] = d[0];
    const [x2, y2] = d[1];
    const kT = T(k, dm);
    return {
      spec: { type: "table-k", mode: "", rows: specRows(rows) },
      stem: ST(
        `A table shows two numbers. x is the number of ${s.x[1]}. y is the number of ${s.y[1]}. The pairs (x, y) are ${pr}. The table is proportional.`,
        `A table shows a proportional relationship. The number of ${s.x[1]} is x and the number of ${s.y[1]} is y. The pairs (x, y) are ${pr}.`,
        `The ordered pairs ${pr} describe a proportional relationship between the number of ${s.x[1]} (x) and the number of ${s.y[1]} (y).`,
      ),
      ask: ST("What is k, if y = k times x?", "What is the constant of proportionality k in the equation y = kx?", "Determine the constant of proportionality k such that y = kx."),
      expr: "y = kx",
      answer: A(k, { dec: dm }),
      work: [`The constant of proportionality is k = y ${DIVIDE} x.`, `Use the first pair: ${y1} ${DIVIDE} ${x1} = ${kT}.`, `Check the second pair: ${y2} ${DIVIDE} ${x2} = ${kT}. It matches, so k = ${kT}.`],
      visual: ratioVis(s, d, [], `A table of ${s.x[1]} and ${s.y[1]} with the pairs ${pr}.`),
      distractors: D(k, [[rows[0][0].div(rows[0][1]), "inverted-ratio"], [rows[0][1].sub(rows[0][0]), "subtracts-instead-of-divides"], [rows[0][1], "reads-y-as-the-rate"], [rows[1][1].sub(rows[0][1]), "uses-change-in-y"], [rows[0][1].add(rows[0][0]), "adds-x-and-y"]], dm),
      hints: H("In a proportional relationship every pair has the same ratio of y to x. That ratio is the constant of proportionality.", "Divide a y-value by the x-value from the same pair, then test a second pair to be sure."),
    };
  },
};

const propTableMissing = {
  lv: [1, 2, 3],
  gen({ rng, level, s }) {
    const k = kChoice(rng, level);
    const dm = dmFor(rng, k);
    const unit = dm ? 1 : k.d;
    const xs = xsFor(rng, k, dm, 3);
    const last = xs[2];
    const xq = level === 3 && rng.chance(0.5) ? last + rng.int(1, 6) : last + unit * rng.int(1, 3);
    const rows = rowsOf(k, xs);
    const d = disp(rows, dm);
    const pr = pairsText(d);
    const ans = k.mul(fr(xq));
    const kT = T(k, dm);
    const aT = T(ans, dm);
    const [x1, y1] = d[0];
    return {
      spec: { type: "table-missing", mode: "", rows: specRows(rows), x: String(xq) },
      stem: ST(
        `A table is proportional. x is the number of ${s.x[1]}. y is the number of ${s.y[1]}. Some pairs (x, y) are ${pr}. One more row has x = ${xq}. Its y is missing.`,
        `A table shows a proportional relationship between ${s.x[1]} (x) and ${s.y[1]} (y). Some pairs (x, y) are ${pr}. In another row, x is ${xq} and y is missing.`,
        `A proportional relationship between the number of ${s.x[1]} (x) and the number of ${s.y[1]} (y) includes the pairs ${pr}. A further row has x equal to ${xq}, with y not recorded.`,
      ),
      ask: ST("What is the missing y?", "What is the missing value of y?", "Determine the missing value of y."),
      expr: null,
      answer: A(ans, { dec: dm }),
      work: [`Find k: ${y1} ${DIVIDE} ${x1} = ${kT}.`, `Multiply k by the new x: ${pf(k, dm)} ${TIMES} ${xq} = ${aT}.`],
      visual: ratioVis(s, [...d, [String(xq), "?"]], [[3, 1]], `A table of ${s.x[1]} and ${s.y[1]} with the pairs ${pr}, and a last row with x = ${xq} and y missing.`),
      distractors: D(ans, [[fr(xq).div(k), "divides-instead-of-multiplies"], [rows[0][1].add(fr(xq).sub(rows[0][0])), "additive-thinking"], [k.add(fr(xq)), "adds-k-and-x"], [rows[2][1].add(fr(xq).sub(rows[2][0])), "adds-the-same-amount-to-both"]], dm),
      hints: H("The constant of proportionality links every x to its y, so the same rule works for the new row.", "First find k from a complete row. Then use k with the x-value of the new row."),
    };
  },
};

const propEqSolve = {
  lv: [1, 2, 3],
  gen({ rng, level, s }) {
    const k = kChoice(rng, level);
    const dm = dmFor(rng, k);
    const unit = dm ? 1 : k.d;
    const findY = level === 1 ? true : rng.chance(0.5);
    let g;
    let a;
    if (findY) {
      g = fr(level === 3 ? rng.int(3, 24) : unit * rng.int(2, 8));
      a = k.mul(g);
    } else {
      a = fr(unit * rng.int(2, 8));
      g = k.mul(a);
    }
    const eq = `y = ${mx(k, dm)}`;
    const kT = T(k, dm);
    const gT = T(g, dm);
    const aT = T(a, dm);
    const given = findY ? `x is ${gT}` : `y is ${gT}`;
    return {
      spec: { type: "eq-solve", mode: "", k: S(k), find: findY ? "y" : "x", given: S(g) },
      stem: ST(
        `The equation ${eq} is proportional. x is the number of ${s.x[1]}. y is the number of ${s.y[1]}. Now ${given}.`,
        `The equation ${eq} shows how the number of ${s.y[1]} (y) depends on the number of ${s.x[1]} (x). Suppose ${given}.`,
        `The proportional relationship ${eq} relates the number of ${s.y[1]} (y) to the number of ${s.x[1]} (x). Consider the case in which ${given}.`,
      ),
      ask: findY ? ST("What is y?", "What is the value of y?", "Determine the value of y.") : ST("What is x?", "What is the value of x?", "Determine the value of x."),
      expr: eq,
      answer: A(a, { dec: dm }),
      work: findY ? [`Put x = ${gT} into ${eq}.`, `${pf(k, dm)} ${TIMES} ${gT} = ${aT}.`] : [`Put y = ${gT} into ${eq}.`, `Divide both sides by ${kT}: ${gT} ${DIVIDE} ${pf(k, dm)} = ${aT}.`],
      visual: null,
      distractors: findY ? D(a, [[g.add(k), "adds-instead-of-multiplies"], [g.div(k), "divides-instead-of-multiplies"], [g, "ignores-the-constant"], [g.sub(k), "subtracts-k"]], dm) : D(a, [[g.mul(k), "multiplies-instead-of-dividing"], [g.sub(k), "subtracts-k"], [g.add(k), "adds-k"], [k.div(g), "inverts-the-division"]], dm),
      hints: H("In y = kx, y is k times as big as x.", findY ? "Replace x with the given number and multiply." : "Replace y with the given number, then undo the multiplication by k."),
    };
  },
};

const propGraphUnit = {
  lv: [1, 2, 3],
  gen({ rng, level, s }) {
    const k = kChoice(rng, level);
    const dm = dmFor(rng, k);
    const a = level === 1 ? rng.int(2, 5) : (dm ? 1 : k.d) * rng.int(2, 5);
    const b = k.mul(fr(a));
    const aT = T(fr(a));
    const bT = T(b, dm);
    const pt = pairText(aT, bT);
    const bx = box(a + 1, Math.ceil(b.n / b.d) + 1);
    return {
      spec: { type: "graph-unit", mode: "", pt: [String(a), S(b)] },
      stem: ST(
        `A graph shows a proportional relationship. It is a straight line through (0, 0). It also goes through the point ${pt}. The x-axis is the number of ${s.x[1]}. The y-axis is the number of ${s.y[1]}.`,
        `The graph of a proportional relationship is a straight line through (0, 0). It passes through the point ${pt}. The x-axis shows the number of ${s.x[1]} and the y-axis shows the number of ${s.y[1]}.`,
        `A proportional relationship is graphed as a line through the origin, (0, 0), and through the point ${pt}. The horizontal axis represents the number of ${s.x[1]}; the vertical axis represents the number of ${s.y[1]}.`,
      ),
      ask: ST(`How many ${s.y[1]} for 1 ${s.x[0]}?`, `What is the unit rate: how many ${s.y[1]} for 1 ${s.x[0]}?`, `Determine the unit rate, in ${s.y[1]} per 1 ${s.x[0]}.`),
      expr: null,
      answer: A(k, { dec: dm }),
      work: [`The unit rate is y ${DIVIDE} x at the point ${pt}.`, `${bT} ${DIVIDE} ${aT} = ${T(k, dm)}.`],
      visual: { kind: "coord", alt: `A coordinate grid with a straight line through (0, 0) and the point ${pt}.`, xmin: bx.xmin, xmax: bx.xmax, ymin: bx.ymin, ymax: bx.ymax, step: bx.step, points: [{ x: String(a), y: S(b), label: pt }], lines: [{ m: S(k), b: 0 }], labelAxes: [cap(s.x[1]), cap(s.y[1])] },
      distractors: D(k, [[fr(a).div(b), "inverted-ratio"], [b.sub(fr(a)), "subtracts-instead-of-divides"], [b, "reads-y-as-the-rate"], [b.add(fr(a)), "adds-the-coordinates"]], dm),
      hints: H("The point (1, r) on a proportional graph tells the unit rate, so look for how y compares with x.", "Divide the y-coordinate by the x-coordinate of the point you were given."),
    };
  },
};

const propVerbalK = {
  lv: [1, 2, 3],
  gen({ rng, level, s, name }) {
    let x;
    let y;
    let k;
    let dm = false;
    if (level < 3) {
      k = kChoice(rng, level);
      dm = dmFor(rng, k);
      const unit = dm ? 1 : k.d;
      x = fr(unit * rng.int(2, 8));
      y = k.mul(x);
    } else {
      x = rng.pick([fr(1, 2), fr(1, 4), fr(3, 4), fr(2, 3), fr(3, 2), fr(5, 2), fr(3, 5)]);
      do y = fr(rng.int(1, 9), rng.pick([2, 3, 4, 5]));
      while (eqF(y, x));
      k = y.div(x);
    }
    const sentence = s.did(name, qty(x, s.x, dm), qty(y, s.y, dm));
    return {
      spec: { type: "verbal-k", mode: "", x: S(x), y: S(y) },
      stem: ST(`${sentence} The rate does not change.`, `${sentence} The rate stays the same.`, `${sentence} Assume the rate is constant.`),
      ask: ST(`How many ${s.y[1]} for 1 ${s.x[0]}?`, `How many ${s.y[1]} is that for 1 ${s.x[0]}?`, `Calculate the unit rate: ${s.y[1]} per 1 ${s.x[0]}.`),
      expr: null,
      answer: A(k, { dec: true }),
      work: [`Unit rate = ${s.y[1]} ${DIVIDE} ${s.x[1]}.`, `${T(y, dm)} ${DIVIDE} ${T(x, dm)} = ${T(k, true)}.`],
      visual: ratioVis(s, [[T(x, dm), T(y, dm)], ["1", "?"]], [[1, 1]], `A ratio table: ${T(x, dm)} ${s.x[1]} goes with ${T(y, dm)} ${s.y[1]}; 1 ${s.x[0]} goes with an unknown amount.`),
      distractors: D(k, [[x.div(y), "divides-in-the-wrong-order"], [y.sub(x), "subtracts-instead-of-dividing"], [y, "ignores-the-amount-of-x"], [y.add(x), "adds-the-quantities"]], true),
      hints: H("A unit rate tells how much of one quantity goes with exactly 1 of the other.", "Divide the quantity you want per one by the quantity you are sharing it over."),
    };
  },
};

const propMeaning = {
  lv: [1, 2, 3],
  gen({ rng, level, s }) {
    const origin = level === 1 ? rng.chance(0.3) : rng.chance(0.4);
    const x = s.x;
    const y = s.y;
    if (origin) {
      const k = kChoice(rng, level);
      const dm = dmFor(rng, k);
      const bx = box(4, Math.ceil(k.n / k.d) * 4);
      return {
        spec: { type: "meaning", mode: "", which: "origin", pt: ["0", "0"], x, y },
        stem: ST(
          `A graph shows a proportional relationship. The x-axis is the number of ${x[1]}. The y-axis is the number of ${y[1]}. The line goes through the point (0, 0).`,
          `The graph of a proportional relationship shows the number of ${x[1]} (x) and the number of ${y[1]} (y). The line passes through the point (0, 0).`,
          `A proportional relationship is graphed with the number of ${x[1]} on the horizontal axis and the number of ${y[1]} on the vertical axis. The line contains the origin, (0, 0).`,
        ),
        ask: ST("What does the point (0, 0) tell us?", "What does the point (0, 0) mean in this situation?", "Interpret the point (0, 0) in the context of this situation."),
        expr: null,
        answer: { value: `With 0 ${x[1]}, there are 0 ${y[1]}.`, kind: "text" },
        work: ["The first number in (0, 0) is x, the number of " + x[1] + ".", "The second number is y, the number of " + y[1] + ".", `So with 0 ${x[1]}, there are 0 ${y[1]}.`],
        visual: { kind: "coord", alt: "A coordinate grid with a straight line through the origin (0, 0).", xmin: bx.xmin, xmax: bx.xmax, ymin: bx.ymin, ymax: bx.ymax, step: bx.step, points: [{ x: "0", y: "0", label: "(0, 0)" }], lines: [{ m: S(k), b: 0 }], labelAxes: [cap(x[1]), cap(y[1])] },
        distractors: dist([
          [`The rate is 0 ${y[1]} for every 1 ${x[0]}.`, "zero-point-means-zero-rate"],
          ["The graph is not proportional.", "origin-means-no-relationship"],
          [`There is 1 ${y[0]} for every 1 ${x[0]}.`, "confuses-origin-with-one-to-one"],
        ]),
        hints: H("Each point on the graph is a pair (x, y): the first number goes with the horizontal axis and the second with the vertical axis.", "Read the first number as an amount of the x quantity and the second number as an amount of the y quantity."),
      };
    }
    let r;
    do r = kChoice(rng, level);
    while (eqF(r, fr(1)));
    const dm = isTerm(r) && r.d !== 1;
    const rT = T(r, dm);
    const bx = box(4, Math.ceil(r.n / r.d) * 3);
    const pt = pairText("1", rT);
    return {
      spec: { type: "meaning", mode: "", which: "unit", pt: ["1", S(r)], x, y },
      stem: ST(
        `A graph shows a proportional relationship. The x-axis is the number of ${x[1]}. The y-axis is the number of ${y[1]}. The line goes through the point ${pt}.`,
        `The graph of a proportional relationship shows the number of ${x[1]} (x) and the number of ${y[1]} (y). The line passes through the point ${pt}.`,
        `A proportional relationship is graphed with the number of ${x[1]} on the horizontal axis and the number of ${y[1]} on the vertical axis. The line contains the point ${pt}.`,
      ),
      ask: ST(`What does the point ${pt} tell us?`, `What does the point ${pt} mean in this situation?`, `Interpret the point ${pt} in the context of this situation.`),
      expr: null,
      answer: { value: `${rT} ${y[1]} for every 1 ${x[0]}`, kind: "text" },
      work: [`The point ${pt} has x = 1, so y is the amount for one ${x[0]}.`, `That amount is ${rT} ${y[1]}, so there are ${rT} ${y[1]} for every 1 ${x[0]}.`],
      visual: { kind: "coord", alt: `A coordinate grid with a straight line through (0, 0) and the point ${pt}.`, xmin: bx.xmin, xmax: bx.xmax, ymin: bx.ymin, ymax: bx.ymax, step: bx.step, points: [{ x: "1", y: S(r), label: pt }], lines: [{ m: S(r), b: 0 }], labelAxes: [cap(x[1]), cap(y[1])] },
      distractors: dist([
        [`${rT} ${x[1]} for every 1 ${y[0]}`, "swaps-the-axes"],
        [`${T(r.add(fr(1)), dm)} ${y[1]} in all`, "adds-the-coordinates"],
        [`a starting amount of ${rT} ${y[1]}`, "unit-rate-as-starting-amount"],
      ]),
      hints: H("A point with x equal to 1 shows what happens for exactly one unit of x.", "Say what the first number counts, say what the second number counts, then join them with the word 'for'."),
    };
  },
};

// ---- compare: one relationship in two representations
function repMake(rng, kind, k, s, name, dm, level) {
  if (kind === "table") {
    const rows = rowsOf(k, xsFor(rng, k, dm, 3));
    const d = disp(rows, dm);
    return { spec: { kind, rows: specRows(rows) }, text: `${name}'s table has the pairs (x, y): ${pairsText(d)}.`, vis: ratioVis(s, d, [], `${name}'s table of ${s.x[1]} and ${s.y[1]}: ${pairsText(d)}.`), words: `a table with ${pairsText(d)}` };
  }
  if (kind === "eq") return { spec: { kind, k: S(k) }, text: `${name}'s equation is y = ${mx(k, dm)}.`, vis: null };
  if (kind === "graph") {
    const a = (dm ? 1 : k.d) * rng.int(2, 5);
    const b = k.mul(fr(a));
    const pt = pairText(String(a), T(b, dm));
    const bx = box(a + 1, Math.ceil(b.n / b.d) + 1);
    return { spec: { kind, pt: [String(a), S(b)] }, text: `${name}'s graph is a straight line through (0, 0) and the point ${pt}.`, vis: { kind: "coord", alt: `${name}'s graph: a straight line through (0, 0) and the point ${pt}.`, xmin: bx.xmin, xmax: bx.xmax, ymin: bx.ymin, ymax: bx.ymax, step: bx.step, points: [{ x: String(a), y: S(b), label: pt }], lines: [{ m: S(k), b: 0 }], labelAxes: [cap(s.x[1]), cap(s.y[1])] } };
  }
  const x = fr((dm ? 1 : k.d) * rng.int(2, 8));
  return { spec: { kind: "verbal", x: S(x), y: S(k.mul(x)) }, text: s.did(name, qty(x, s.x, dm), qty(k.mul(x), s.y, dm)), vis: null };
}
function pairOfReps(rng, level) {
  const withVis = rng.pick(["table", "graph"]);
  const other = rng.pick(level === 1 ? ["eq", "verbal"] : ["eq", "verbal", level === 3 ? "graph" : "eq", withVis === "table" ? "graph" : "table"]);
  const kinds = other === withVis ? [withVis, "verbal"] : [withVis, other];
  return rng.chance(0.5) ? kinds : kinds.reverse();
}
function twoRates(rng, level, same) {
  const k1 = kChoice(rng, level);
  if (same) return [k1, k1];
  let k2;
  do {
    if (level === 1) k2 = fr(rng.int(2, 9));
    else if (level === 2) k2 = k1.add(fr(rng.pick([-1, 1, 2, -2]), 2));
    else k2 = k1.add(fr(rng.pick([-1, 1]), rng.pick([4, 8, 6])));
  } while (eqF(k1, k2) || k2.n <= 0);
  return [k1, k2];
}
const sharedUnit = (k1, k2) => isTerm(k1) && isTerm(k2) && (k1.d !== 1 || k2.d !== 1);
function compareCommon(rng, level, s, same) {
  const [k1, k2] = twoRates(rng, level, same);
  const dm = sharedUnit(k1, k2) && rng.chance(0.65);
  const [n1, n2] = twoNames(rng);
  const kinds = pairOfReps(rng, level);
  const r1 = repMake(rng, kinds[0], k1, s, n1, dm, level);
  const r2 = repMake(rng, kinds[1], k2, s, n2, dm, level);
  return { k1, k2, dm, n1, n2, r1, r2, vis: r1.vis || r2.vis };
}
const intro = (s) => ST(`${cap(s.x[1])} are counted by x. ${cap(s.y[1])} are counted by y. Two people show the same kind of relationship in two ways.`, `Two students show the same kind of proportional relationship between ${s.x[1]} (x) and ${s.y[1]} (y), each in a different way.`, `Two students represent a proportional relationship between the number of ${s.x[1]} (x) and the number of ${s.y[1]} (y) using different representations.`);
const joinSt = (i, a, b) => ST(`${i.plain} ${a} ${b}`, `${i.standard} ${a} ${b}`, `${i.rich} ${a} ${b}`);

const cmpWhich = {
  lv: [1, 2, 3],
  gen({ rng, level, s }) {
    const c = compareCommon(rng, level, s, false);
    const bigger = c.k1.cmp(c.k2) > 0 ? c.n1 : c.n2;
    const small = bigger === c.n1 ? c.n2 : c.n1;
    const sT = (k) => T(k, c.dm);
    return {
      spec: { type: "cmp-which", mode: "compare", people: [c.n1, c.n2], reps: [c.r1.spec, c.r2.spec] },
      stem: joinSt(intro(s), c.r1.text, c.r2.text),
      ask: ST("Whose relationship has the greater unit rate (y for 1 x)?", "Whose representation shows the greater unit rate (y for 1 x)?", "Which student's representation has the greater unit rate (the amount of y per 1 unit of x)?"),
      expr: null,
      answer: { value: bigger, kind: "text" },
      work: [`Find the unit rate y ${DIVIDE} x for each representation.`, `${c.n1}: the unit rate is ${sT(c.k1)}.`, `${c.n2}: the unit rate is ${sT(c.k2)}.`, `${sT(c.k1.cmp(c.k2) > 0 ? c.k1 : c.k2)} is greater than ${sT(c.k1.cmp(c.k2) > 0 ? c.k2 : c.k1)}, so ${bigger} has the greater unit rate.`],
      visual: c.vis,
      distractors: dist([
        [small, "compares-the-numbers-not-the-rates"],
        ["The unit rates are equal", "assumes-equal-rates"],
        ["It is impossible to tell from two different representations", "cannot-compare-representations"],
      ]),
      hints: H("Different representations can show the same kind of rate, so compare the unit rates, not the pictures or the raw numbers.", "Turn each representation into y for 1 x by dividing a y-value by its x-value, then compare the two results."),
    };
  },
};

const cmpSame = {
  lv: [1, 2, 3],
  gen({ rng, level, s }) {
    const same = rng.chance(0.5);
    const c = compareCommon(rng, level, s, same);
    return {
      spec: { type: "cmp-same", mode: "compare", people: [c.n1, c.n2], reps: [c.r1.spec, c.r2.spec] },
      stem: joinSt(intro(s), c.r1.text, c.r2.text),
      ask: ST("Do the two people show the same unit rate?", "Do the two representations show the same unit rate?", "Do the two representations have equal unit rates?"),
      expr: null,
      answer: { value: same ? "true" : "false", kind: "bool", text: same ? "Yes. The unit rates are equal." : "No. The unit rates are different." },
      work: [`Find the unit rate y ${DIVIDE} x for each representation.`, `${c.n1}: ${T(c.k1, c.dm)}. ${c.n2}: ${T(c.k2, c.dm)}.`, same ? "The two unit rates are equal." : "The two unit rates are not equal."],
      visual: c.vis,
      distractors: dist([
        [same ? "No. The unit rates are different." : "Yes. The unit rates are equal.", same ? "treats-different-forms-as-different-rates" : "treats-similar-looking-numbers-as-equal"],
        ["There is not enough information to compare.", "cannot-compare-representations"],
        ["Only if both are turned into tables first.", "must-use-the-same-representation"],
      ]),
      hints: H("Two representations show the same relationship only when they have the same unit rate.", "Calculate y for 1 x in each representation, then see whether the two results are equal."),
    };
  },
};

const cmpDiff = {
  lv: [3],
  gen({ rng, level, s }) {
    const c = compareCommon(rng, level, s, false);
    const hi = c.k1.cmp(c.k2) > 0 ? c.k1 : c.k2;
    const lo = hi === c.k1 ? c.k2 : c.k1;
    const diff = hi.sub(lo);
    const dm = c.dm;
    return {
      spec: { type: "cmp-diff", mode: "compare", people: [c.n1, c.n2], reps: [c.r1.spec, c.r2.spec] },
      stem: joinSt(intro(s), c.r1.text, c.r2.text),
      ask: ST(`How many more ${s.y[1]} for 1 ${s.x[0]} does the greater rate give?`, `How much greater is the greater unit rate (${s.y[1]} for 1 ${s.x[0]}) than the other one?`, `By how much does the greater unit rate exceed the lesser one, in ${s.y[1]} per 1 ${s.x[0]}?`),
      expr: null,
      answer: A(diff, { dec: dm }),
      work: [`${c.n1}: the unit rate is ${T(c.k1, dm)}.`, `${c.n2}: the unit rate is ${T(c.k2, dm)}.`, `Subtract: ${pf(hi, dm)} ${MINUS} ${pf(lo, dm)} = ${T(diff, dm)}.`],
      visual: c.vis,
      distractors: D(diff, [[hi.div(lo), "divides-instead-of-subtracting"], [hi.add(lo), "adds-the-rates"], [lo, "reports-the-lesser-rate"], [hi, "reports-the-greater-rate"]], dm),
      hints: H("A difference between two rates compares them by subtraction, once both are written as y for 1 x.", "Find each unit rate first, then subtract the smaller one from the larger one."),
    };
  },
};

// ---- argue: a claim that is true or false
const claimIntro = (name, thingText) => ST(`${name} says: "This ${thingText} is proportional."`, `${name} says, "This ${thingText} shows a proportional relationship."`, `${name} claims that this ${thingText} represents a proportional relationship.`);
const verdictAsk = (name) => ST(`Is ${name}'s claim true or false?`, `Is ${name}'s claim true or false?`, `Determine whether ${name}'s claim is true or false.`);
const boolAns = (v, yes, no) => ({ value: v ? "true" : "false", kind: "bool", text: v ? yes : no });

const argTable = {
  lv: [1, 2, 3],
  gen({ rng, level, s, name }) {
    const variant = rng.pick(level === 1 ? ["true", "additive"] : ["true", "additive", "affine"]);
    let rows;
    let dm = false;
    if (variant === "true") {
      const k = kChoice(rng, level === 1 ? 1 : level);
      dm = dmFor(rng, k);
      rows = rowsOf(k, unevenXs(rng, dm ? 1 : k.d));
    } else {
      const start = rng.int(1, 3);
      const step = rng.int(1, 2);
      const xs = Array.from({ length: 4 }, (_, i) => start + i * step);
      if (variant === "additive") {
        const c = rng.int(2, 9);
        rows = xs.map((x) => [fr(x), fr(x + c)]);
      } else {
        const m = rng.int(2, 5);
        const b = rng.int(1, 9);
        rows = xs.map((x) => [fr(x), fr(m * x + b)]);
      }
    }
    const d = disp(rows, dm);
    const pr = pairsText(d);
    const truth = variant === "true";
    const r1 = rows[0][1].div(rows[0][0]);
    const wrongIfFalse = [
      ["True. y gets bigger when x gets bigger.", "increasing-means-proportional"],
      [`True. The first pair gives y ${DIVIDE} x = ${T(r1)}.`, "checks-only-one-pair"],
      ["True. y goes up by the same amount each time x goes up by the same amount.", "constant-difference-means-proportional"],
    ];
    const wrongIfTrue = [
      ["False. y is not equal to x.", "expects-y-to-equal-x"],
      ["False. The table does not include the pair (0, 0).", "needs-the-origin-in-the-table"],
      ["False. The y-values do not go up by the same amount each time.", "needs-a-constant-difference"],
    ];
    const ratios = d.map(([x, y], i) => `${y} ${DIVIDE} ${x}`);
    const ratioVals = rows.map(([x, y]) => T(y.div(x), true));
    return {
      spec: { type: "arg-table", mode: "argue", rows: specRows(rows) },
      stem: ST(`${name} looks at a table. The pairs (x, y) are ${pr}. ${claimIntro(name, "table").plain}`, `${name} looks at a table with the pairs (x, y): ${pr}. ${claimIntro(name, "table").standard}`, `A table lists the ordered pairs ${pr}. ${claimIntro(name, "table").rich}`),
      ask: verdictAsk(name),
      expr: null,
      answer: boolAns(truth, "True. Every pair has the same ratio y ÷ x.", "False. The ratios y ÷ x are not all the same."),
      work: truth ? [`Find y ${DIVIDE} x for each pair: ${ratioVals.join(", ")}.`, "All the ratios are equal, so the table is proportional."] : [`Find y ${DIVIDE} x for each pair: ${ratioVals.join(", ")}.`, "The ratios are not all equal, so the table is not proportional."],
      visual: ratioVis(s, d, [], `A table of ${s.x[1]} and ${s.y[1]} with the pairs ${pr}.`),
      distractors: dist(truth ? wrongIfTrue : wrongIfFalse),
      hints: H("A table is proportional only when every pair has the same ratio of y to x.", "Divide y by x for every pair, then see whether all the results match."),
    };
  },
};

const argWhich = {
  lv: [2, 3],
  gen({ rng, level, s, name }) {
    const k = kChoice(rng, level === 3 ? 2 : 1);
    const dm = dmFor(rng, k);
    const xs = unevenXs(rng, dm ? 1 : k.d);
    const rows = rowsOf(k, xs);
    const j = rng.int(0, 3);
    let delta;
    do delta = rng.int(-3, 3);
    while (delta === 0 || rows[j][1].add(fr(delta)).n <= 0);
    rows[j] = [rows[j][0], rows[j][1].add(fr(delta))];
    const d = disp(rows, dm);
    const pr = pairsText(d);
    const others = rows.map(([x]) => x).filter((_, i) => i !== j);
    return {
      spec: { type: "arg-which", mode: "argue", rows: specRows(rows) },
      stem: ST(
        `${name} says this table should be proportional. One pair has a mistake. The pairs (x, y) are ${pr}.`,
        `${name} says this table should show a proportional relationship, but one pair has a mistake. The pairs (x, y) are ${pr}.`,
        `A table intended to represent a proportional relationship lists the ordered pairs ${pr}. Exactly one pair is inconsistent with the others.`,
      ),
      ask: ST("Which x-value belongs to the pair with the mistake?", "Which x-value belongs to the pair that breaks the pattern?", "Identify the x-value of the pair that is inconsistent with a proportional relationship."),
      expr: null,
      answer: { value: String(rows[j][0].n), kind: "int", text: String(rows[j][0].n) },
      work: [`Find y ${DIVIDE} x for each pair: ${rows.map(([x, y]) => T(y.div(x), true)).join(", ")}.`, `Three pairs share one ratio. The pair with x = ${rows[j][0].n} does not match it.`],
      visual: ratioVis(s, d, [], `A table of ${s.x[1]} and ${s.y[1]} with the pairs ${pr}.`),
      distractors: others.map((x) => ({ text: String(x.n), misconception: "picks-a-pair-that-fits-the-pattern" })),
      hints: H("In a proportional table every pair gives the same ratio of y to x, so the pair that does not match stands out.", "Divide y by x in every pair and look for the one result that is different from the other three."),
    };
  },
};

const argLine = {
  lv: [1, 2, 3],
  gen({ rng, level, s, name }) {
    const truth = rng.chance(0.4);
    const m = level === 3 && rng.chance(0.5) ? rng.pick([fr(1, 2), fr(3, 2), fr(2, 3), fr(3, 4)]) : fr(rng.int(1, 4));
    const b = truth ? fr(0) : fr(rng.int(1, 6) * (level > 1 && rng.chance(0.4) ? -1 : 1));
    const eq = `y = ${linText(m, b, true)}`;
    const my = Math.max(10, Math.abs(b.n) + Math.ceil((m.n / m.d) * 5) + 2);
    const bx = box(5, my, -2, b.n < 0 ? b.n - 1 : 0);
    return {
      spec: { type: "arg-line", mode: "argue", m: S(m), b: S(b) },
      stem: ST(
        `A graph is a straight line. It is the graph of ${eq}. ${claimIntro(name, "graph").plain}`,
        `A graph is a straight line with the equation ${eq}. ${claimIntro(name, "graph").standard}`,
        `A straight line is the graph of ${eq}. ${claimIntro(name, "graph").rich}`,
      ),
      ask: verdictAsk(name),
      expr: eq,
      answer: boolAns(truth, "True. The line goes through (0, 0).", "False. The line does not go through (0, 0)."),
      work: truth ? ["In y = mx + b the number b is where the line crosses the y-axis.", "Here b is 0, so the line goes through (0, 0). A straight line through (0, 0) is proportional."] : ["In y = mx + b the number b is where the line crosses the y-axis.", "Here b is not 0, so the line misses (0, 0). It is not proportional."],
      visual: { kind: "coord", alt: `A coordinate grid with the straight line ${eq}.`, xmin: bx.xmin, xmax: bx.xmax, ymin: bx.ymin, ymax: bx.ymax, step: bx.step, points: [], lines: [{ m: S(m), b: S(b) }], labelAxes: ["x", "y"] },
      distractors: dist(
        truth
          ? [["False. A proportional graph must also pass through (1, 1).", "must-pass-through-one-one"], ["False. A line with no starting value cannot be proportional.", "zero-intercept-means-not-proportional"], ["False. A proportional graph must start above the x-axis.", "needs-a-positive-start"]]
          : [["True. It is a straight line.", "straight-means-proportional"], ["True. y gets bigger when x gets bigger.", "increasing-means-proportional"], ["True. The rate of change is the same everywhere.", "constant-rate-means-proportional"]],
      ),
      hints: H("A graph is proportional only if it is a straight line that goes through the origin.", "Check where the line crosses the y-axis, which is the number added in y = mx + b."),
    };
  },
};

const argEq = {
  lv: [2, 3],
  gen({ rng, level, s, name }) {
    const form = rng.pick(["lin", "lin", "inv", "div", "mul"]);
    let eq;
    let spec;
    let truth;
    if (form === "lin") {
      const m = rng.int(2, 9);
      const b = rng.int(1, 9) * (rng.chance(0.3) ? -1 : 1);
      eq = `y = ${m}x ${b < 0 ? MINUS : "+"} ${Math.abs(b)}`;
      spec = { form, m: String(m), b: String(b) };
      truth = false;
    } else if (form === "inv") {
      const c = rng.pick([6, 8, 10, 12, 18, 24]);
      eq = `y = ${c}/x`;
      spec = { form, c: String(c) };
      truth = false;
    } else if (form === "div") {
      const dd = rng.int(2, 9);
      eq = `y = x/${dd}`;
      spec = { form, d: String(dd) };
      truth = true;
    } else {
      const m = rng.int(2, 9);
      eq = `y = ${m}x`;
      spec = { form, m: String(m) };
      truth = true;
    }
    const wrong =
      form === "lin"
        ? [["True. The equation is linear.", "linear-means-proportional"], ["True. y gets bigger when x gets bigger.", "increasing-means-proportional"], [`True. The rate of change is always ${spec.m}.`, "constant-rate-means-proportional"]]
        : form === "inv"
          ? [["True. x and y follow a rule.", "any-rule-means-proportional"], ["True. The product x × y is always the same.", "confuses-inverse-with-direct"], ["True. There is no added number, so the graph goes through (0, 0).", "no-added-number-means-origin"]]
          : [["False. A proportional equation must look like y = x + b.", "mixes-up-the-form"], ["False. The graph of y = kx never goes through (0, 0).", "origin-confusion"], ["False. A proportional equation needs an added number.", "needs-an-added-number"]];
    return {
      spec: { type: "arg-eq", mode: "argue", ...spec },
      stem: ST(`${name} looks at the equation ${eq}. ${claimIntro(name, "equation").plain}`, `${name} looks at the equation ${eq}. ${claimIntro(name, "equation").standard}`, `The equation ${eq} is given. ${claimIntro(name, "equation").rich}`),
      ask: verdictAsk(name),
      expr: eq,
      answer: boolAns(truth, "True. It can be written as y = kx.", "False. It cannot be written as y = kx."),
      work: truth ? ["A proportional relationship can be written as y = kx.", `The equation ${eq} has that form, with k a fixed number.`] : form === "inv" ? ["A proportional relationship can be written as y = kx.", "In this equation x is in the denominator, so it cannot be written as y = kx."] : ["A proportional relationship can be written as y = kx.", "This equation has an added number, so it cannot be written as y = kx."],
      visual: null,
      distractors: dist(wrong),
      hints: H("A proportional relationship always has the form y = kx, where k is one fixed number.", "Look for an added or subtracted number, or for x in the denominator. If you find one, the equation does not fit y = kx."),
    };
  },
};

const PROP_TYPES = { "": [propTableK, propTableMissing, propEqSolve, propGraphUnit, propVerbalK, propMeaning], compare: [cmpWhich, cmpSame, cmpDiff], argue: [argTable, argWhich, argLine, argEq] };
FAMILIES.proportional = {
  title: "Proportional relationships",
  grades: [7],
  defaults: { mode: "" },
  gen(rng, params, opts) {
    const level = opts.level;
    const mode = params.mode || "";
    const s = sceneOf(rng, opts.ctx);
    const name = rng.pick(NAMES);
    const t = pickType(rng, level, PROP_TYPES[mode] || PROP_TYPES[""]);
    return done({ family: "proportional", level, ...t.gen({ rng, level, s, name, ctx: opts.ctx }) });
  },
  check: modeCheck(""),
};

// ================================================================================================================ scale drawings
const UNIT = { cm: ["centimeter", "centimeters"], m: ["meter", "meters"], km: ["kilometer", "kilometers"], in: ["inch", "inches"], ft: ["foot", "feet"], mi: ["mile", "miles"] };
const TOBASE = { cm: 1, m: 100, km: 100000, in: 1, ft: 12, mi: 63360 };
const UPAIRS = [["cm", "m"], ["in", "ft"], ["cm", "km"], ["cm", "m"], ["in", "ft"]];
const SOBJ = ["wall", "path", "fence", "hallway", "bridge", "garden bed", "road", "dock"];
const uq = (f, u) => qty(f, UNIT[u], true);
/** The scale sentence in three language levels. */
const scaleSt = (a, b, du, au) => {
  const l = uq(fr(a), du);
  const r = uq(fr(b), au);
  return ST(`On the drawing, ${l} stands for ${r} in real life.`, `The scale of the drawing is ${l} to ${r}.`, `The drawing uses a scale in which ${l} on the drawing represents ${r} of actual length.`);
};
const scaleJoin = (sc, plain, standard, rich) => ST(`${sc.plain} ${plain}`, `${sc.standard} ${standard}`, `${sc.rich} ${rich}`);

const scActual = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const [du, au] = rng.pick(UPAIRS);
    const a = level === 1 ? 1 : level === 2 ? rng.pick([1, 1, 2, 4, 5]) : rng.pick([2, 4, 5]);
    const b = au === "km" ? rng.int(2, 9) * 5 : rng.int(2, 15);
    const d = level === 1 ? fr(rng.int(2, 12)) : level === 2 ? fr(rng.int(3, 24), rng.pick([1, 1, 2])) : fr(rng.int(5, 48), rng.pick([2, 4]));
    const per = fr(b, a);
    const ans = d.mul(per);
    const obj = rng.pick(SOBJ);
    const sc = scaleSt(a, b, du, au);
    const dT = T(d, true);
    return {
      spec: { type: "actual", d: S(d), sc: [a, b], du, au },
      stem: scaleJoin(sc, `The ${obj} is ${uq(d, du)} long on the drawing.`, `The ${obj} measures ${uq(d, du)} on the drawing.`, `On the drawing, the ${obj} measures ${uq(d, du)}.`),
      ask: ST(`How long is the ${obj} in real life?`, `What is the actual length of the ${obj}?`, `Determine the actual length of the ${obj}.`),
      expr: null,
      answer: A(ans, { dec: true, unit: UNIT[au][1] }),
      work: a === 1 ? [`Each 1 ${UNIT[du][0]} on the drawing is ${b} ${UNIT[au][1]} in real life.`, `${E(`${dT} ${TIMES} ${b}`, ans, true)}.`] : [`Find the real length for 1 ${UNIT[du][0]}: ${b} ${DIVIDE} ${a} = ${T(per, true)}.`, `${E(`${dT} ${TIMES} ${T(per, true)}`, ans, true)}.`],
      visual: { kind: "ratiotable", alt: `A ratio table: ${a} ${UNIT[du][a === 1 ? 0 : 1]} on the drawing is ${b} ${UNIT[au][1]} in real life; ${dT} ${UNIT[du][1]} on the drawing goes with an unknown real length.`, headers: [`Drawing (${du})`, `Real (${au})`], rows: [[String(a), String(b)], [dT, "?"]], hide: [[1, 1]] },
      distractors: D(ans, [[d.add(fr(b)), "adds-instead-of-multiplying"], [d.div(per), "divides-instead-of-multiplying"], [d.mul(fr(b)), "ignores-the-first-scale-number"], [d.mul(fr(a * b)), "multiplies-by-both-scale-numbers"], [d, "forgets-the-scale"]], true),
      hints: H("A scale tells how much real length one unit of drawing length stands for.", "Find the real length for 1 unit on the drawing, then multiply by the number of units you measured."),
    };
  },
};

const scDrawing = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const [du, au] = rng.pick(UPAIRS);
    const a = level === 1 ? 1 : rng.pick([1, 2, 4, 5]);
    const b = au === "km" ? rng.int(2, 9) * 5 : rng.int(2, 15);
    const d = level === 1 ? fr(rng.int(2, 12)) : fr(rng.int(3, 30), rng.pick([1, 2]));
    const L = d.mul(fr(b, a));
    const q = L.div(fr(b));
    const obj = rng.pick(SOBJ);
    const sc = scaleSt(a, b, du, au);
    return {
      spec: { type: "drawing", d: S(d), sc: [a, b], du, au, actual: S(L) },
      stem: scaleJoin(sc, `The ${obj} is ${uq(L, au)} long in real life.`, `The ${obj} is ${uq(L, au)} long.`, `The actual ${obj} has a length of ${uq(L, au)}.`),
      ask: ST(`How long is the ${obj} on the drawing?`, `How long should the ${obj} be on the drawing?`, `Determine the length of the ${obj} on the drawing.`),
      expr: null,
      answer: A(d, { dec: true, unit: UNIT[du][1] }),
      work: a === 1 ? [`Each ${b} ${UNIT[au][1]} in real life is 1 ${UNIT[du][0]} on the drawing.`, `${T(L, true)} ${DIVIDE} ${b} = ${T(d, true)}.`] : [`Count how many groups of ${b} ${UNIT[au][1]} fit: ${T(L, true)} ${DIVIDE} ${b} = ${T(q, true)}.`, `Each group is ${a} ${UNIT[du][1]} on the drawing: ${T(q, true)} ${TIMES} ${a} = ${T(d, true)}.`],
      visual: { kind: "ratiotable", alt: `A ratio table: ${a} ${UNIT[du][a === 1 ? 0 : 1]} on the drawing is ${b} ${UNIT[au][1]} in real life; an unknown drawing length goes with ${T(L, true)} ${UNIT[au][1]}.`, headers: [`Drawing (${du})`, `Real (${au})`], rows: [[String(a), String(b)], ["?", T(L, true)]], hide: [[1, 0]] },
      distractors: D(d, [[L.mul(fr(b, a)), "multiplies-instead-of-dividing"], [L.sub(fr(b)), "subtracts-the-scale-number"], [a === 1 ? L.div(fr(b + 1)) : L.div(fr(a)), "uses-the-wrong-scale-number"], [q, "forgets-the-drawing-side-of-the-scale"], [L, "forgets-the-scale"]], true),
      hints: H("The real length is much longer than the drawing length, so the drawing length must be a smaller number.", "Find how many real-life groups of the scale fit into the real length, then turn each group into its drawing length."),
    };
  },
};

const scFactor = {
  lv: [2, 3],
  gen({ rng, level }) {
    let du;
    let au;
    let dr;
    let ac;
    let f;
    const conv = level === 3;
    if (!conv) {
      du = au = rng.pick(["cm", "in"]);
      dr = rng.int(2, 9);
      f = rng.pick([10, 12, 20, 24, 25, 30, 40, 50, 100]);
      ac = dr * f;
    } else {
      [du, au] = rng.pick([["cm", "m"], ["in", "ft"], ["cm", "km"], ["cm", "m"]]);
      for (let tries = 0; tries < 200; tries++) {
        dr = rng.pick([2, 3, 4, 5, 6, 8, 10]);
        ac = rng.int(4, 90);
        if ((ac * TOBASE[au]) % (dr * TOBASE[du]) === 0) break;
      }
      if ((ac * TOBASE[au]) % (dr * TOBASE[du]) !== 0) {
        dr = 4;
        ac = 20;
        du = "cm";
        au = "m";
      }
      f = (ac * TOBASE[au]) / (dr * TOBASE[du]);
    }
    const obj = rng.pick(["bridge", "ship", "tower", "stage", "garden", "bus"]);
    const inDu = (ac * TOBASE[au]) / TOBASE[du];
    const ans = fr(f);
    const note = conv ? ` ${ac} ${au} = ${num(inDu)} ${du}.` : "";
    return {
      spec: { type: "factor", dr: String(dr), du, ac: String(ac), au },
      stem: ST(
        `A drawing of a ${obj} is ${uq(fr(dr), du)} long. The real ${obj} is ${uq(fr(ac), au)} long.`,
        `On a scale drawing, a ${obj} is ${uq(fr(dr), du)} long. The actual ${obj} is ${uq(fr(ac), au)} long.`,
        `A scale drawing shows a ${obj} with a length of ${uq(fr(dr), du)}. The actual ${obj} has a length of ${uq(fr(ac), au)}.`,
      ),
      ask: ST("How many times as long is the real object as the drawing? Use the same unit for both.", "What is the scale factor from the drawing to the real object?", "Determine the scale factor from the drawing to the actual object."),
      expr: null,
      answer: A(ans),
      work: conv ? [`Write both lengths in ${UNIT[du][1]}:${note}`, `Divide the real length by the drawing length: ${E(`${num(inDu)} ${DIVIDE} ${dr}`, f)}.`] : [`Both lengths use ${UNIT[du][1]}, so divide: ${E(`${num(ac)} ${DIVIDE} ${dr}`, f)}.`],
      visual: null,
      distractors: D(ans, [[fr(ac, dr), "skips-the-unit-conversion"], [fr(dr * TOBASE[du], ac * TOBASE[au]), "inverts-the-scale-factor"], [fr(f * 10), "wrong-conversion-factor"], [fr(f, 10), "wrong-conversion-factor"], [fr(ac - dr), "subtracts-the-lengths"]]),
      hints: H("A scale factor compares two lengths, so both lengths must be in the same unit before you compare them.", "Change the real length to the unit of the drawing, then divide the real length by the drawing length."),
    };
  },
};

const scArea = {
  lv: [2, 3],
  gen({ rng, level }) {
    const k = level === 2 ? fr(rng.pick([2, 3, 4])) : rng.pick([fr(1, 2), fr(3, 2), fr(5, 2), fr(1, 2), fr(3, 2)]);
    const u = rng.pick(["cm", "m", "in", "ft"]);
    const unitStep = k.d === 1 ? 1 : k.d;
    const w = unitStep * rng.int(2, 6);
    const h = unitStep * rng.int(2, 6);
    const nw = k.mul(fr(w));
    const nh = k.mul(fr(h));
    const area = nw.mul(nh);
    const area0 = fr(w * h);
    const kT = T(k, true);
    return {
      spec: { type: "area", w: String(w), h: String(h), k: S(k), unit: u },
      stem: ST(
        `A rectangle is ${w} ${UNIT[u][1]} long and ${h} ${UNIT[u][1]} wide. A new rectangle is made with a scale factor of ${kT}.`,
        `A rectangle is ${w} ${UNIT[u][1]} long and ${h} ${UNIT[u][1]} wide. It is scaled by a scale factor of ${kT}.`,
        `A rectangle measures ${w} ${UNIT[u][1]} by ${h} ${UNIT[u][1]}. A scaled copy is produced using a scale factor of ${kT}.`,
      ),
      ask: ST(`What is the area of the new rectangle, in square ${UNIT[u][1]}?`, `What is the area of the scaled rectangle, in square ${UNIT[u][1]}?`, `Determine the area of the scaled copy, in square ${UNIT[u][1]}.`),
      expr: null,
      answer: A(area, { unit: `square ${UNIT[u][1]}` }),
      work: [`New length: ${w} ${TIMES} ${kT} = ${T(nw, true)}.`, `New width: ${h} ${TIMES} ${kT} = ${T(nh, true)}.`, `Area = ${T(nw, true)} ${TIMES} ${T(nh, true)} = ${T(area, true)}.`],
      visual: { kind: "rect", alt: `The original rectangle, ${w} ${UNIT[u][1]} long and ${h} ${UNIT[u][1]} wide.`, w, h, unit: u, showArea: false, labels: [`${w} ${u}`, `${h} ${u}`] },
      distractors: D(area, [[area0.mul(k), "scales-the-area-by-k-only"], [area0, "forgets-to-scale"], [area0.mul(k).mul(fr(2)), "doubles-the-scale-factor-effect"], [nw.add(nh), "adds-the-new-sides"], [area0.add(k.mul(k)), "adds-k-squared"]]),
      hints: H("When every length is multiplied by the scale factor, the area changes by more than the scale factor.", "Find the new length and the new width first, then multiply them to get the new area."),
    };
  },
};

const scRedraw = {
  lv: [3],
  gen({ rng }) {
    const [du, au] = rng.pick([["cm", "m"], ["cm", "km"], ["cm", "m"]]);
    const base = rng.pick([2, 5, 10, 20]);
    const t = rng.pick([2, 4, 5]);
    let b1;
    let b2;
    let d;
    if (rng.chance(0.5)) {
      b1 = base;
      b2 = base * t;
      d = t * rng.int(2, 6);
    } else {
      b2 = base;
      b1 = base * t;
      d = rng.int(2, 8);
    }
    const real = d * b1;
    const ans = fr(real, b2);
    const obj = rng.pick(["road", "river", "trail", "bridge", "ferry route"]);
    return {
      spec: { type: "redraw", d: String(d), s1: [1, b1], s2: [1, b2], du, au },
      stem: ST(
        `A map uses a scale of 1 ${UNIT[du][0]} to ${b1} ${UNIT[au][1]}. On this map, a ${obj} is ${d} ${UNIT[du][1]} long. A new map uses a scale of 1 ${UNIT[du][0]} to ${b2} ${UNIT[au][1]}.`,
        `A map has a scale of 1 ${UNIT[du][0]} to ${b1} ${UNIT[au][1]}. A ${obj} is ${d} ${UNIT[du][1]} long on this map. The ${obj} is redrawn on a new map with a scale of 1 ${UNIT[du][0]} to ${b2} ${UNIT[au][1]}.`,
        `On a map with the scale 1 ${UNIT[du][0]} to ${b1} ${UNIT[au][1]}, a ${obj} measures ${d} ${UNIT[du][1]}. The same ${obj} is to be reproduced on a map with the scale 1 ${UNIT[du][0]} to ${b2} ${UNIT[au][1]}.`,
      ),
      ask: ST(`How long is the ${obj} on the new map?`, `How long will the ${obj} be on the new map?`, `Determine the length of the ${obj} on the new map.`),
      expr: null,
      answer: A(ans, { dec: true, unit: UNIT[du][1] }),
      work: [`Real length: ${E(`${d} ${TIMES} ${b1}`, real)} ${UNIT[au][1]}.`, `Length on the new map: ${num(real)} ${DIVIDE} ${b2} = ${T(ans, true)} ${UNIT[du][1]}.`],
      visual: null,
      distractors: D(ans, [[fr(d * b2, b1), "inverts-the-scale-ratio"], [fr(d), "assumes-the-length-does-not-change"], [fr(real), "stops-at-the-real-length"], [fr(d + (b2 - b1)), "adds-the-change-in-scale"]], true),
      hints: H("The real object does not change, only the scale used to draw it.", "Use the first scale to find the real length, then use the second scale to turn that real length into a drawing length."),
    };
  },
};

FAMILIES.scale = {
  title: "Scale drawings",
  grades: [7],
  defaults: {},
  gen(rng, params, opts) {
    const level = opts.level;
    const t = pickType(rng, level, [scActual, scDrawing, scFactor, scArea, scRedraw]);
    return done({ family: "scale", level, ...t.gen({ rng, level, ctx: opts.ctx }) });
  },
};

// ================================================================================================================ geometry (circle)
const PI3 = fr(314, 100);
const piTag = (pi) => (pi === "3.14" ? "Use 3.14 for π." : "Leave your answer in terms of π.");
const piTagSt = (pi) => ST(pi === "3.14" ? "Use 3.14 for pi." : "Leave your answer in terms of pi.", piTag(pi), pi === "3.14" ? "Use 3.14 as the approximation of π." : "Give the exact answer in terms of π.");
const withPi = (arr) => arr.map((d) => ({ ...d, text: `${d.text}π` }));

const geoCirc = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const pi = level === 1 ? "3.14" : rng.chance(0.5) ? "3.14" : "pi";
    const what = rng.pick(["circumference", "area"]);
    const given = level === 1 ? (rng.chance(0.7) ? "r" : "d") : rng.pick(["r", "d"]);
    const r = level === 1 ? rng.int(2, 10) : rng.int(3, 15);
    const d = 2 * r;
    const gv = given === "r" ? r : d;
    const [obj, objUnits] = rng.pick([["round pond", ["m", "ft"]], ["circular table", ["cm", "in"]], ["clock face", ["cm", "in"]], ["round rug", ["ft", "m"]], ["circular garden", ["m", "ft"]], ["pizza pan", ["cm", "in"]], ["bicycle wheel", ["cm", "in"]]]);
    const u = rng.pick(objUnits);
    const coef = what === "circumference" ? fr(given === "r" ? 2 * r : d) : fr(r * r);
    const ans = pi === "3.14" ? PI3.mul(coef) : coef;
    const given_st = given === "r" ? ST(`The radius is ${gv} ${UNIT[u][1]}.`, `It has a radius of ${gv} ${UNIT[u][1]}.`, `Its radius measures ${gv} ${UNIT[u][1]}.`) : ST(`The diameter is ${gv} ${UNIT[u][1]}.`, `It has a diameter of ${gv} ${UNIT[u][1]}.`, `Its diameter measures ${gv} ${UNIT[u][1]}.`);
    const tag = piTagSt(pi);
    const unitOut = what === "circumference" ? UNIT[u][1] : `square ${UNIT[u][1]}`;
    // work
    const work = [];
    if (what === "circumference") {
      if (given === "r") {
        if (pi === "3.14") work.push("The circumference is C = 2 × π × r.", `2 ${TIMES} 3.14 = 6.28.`, `6.28 ${TIMES} ${r} = ${T(ans, true)}.`);
        else work.push("The circumference is C = 2 × π × r.", `2 ${TIMES} ${r} = ${2 * r}, so C = ${2 * r}π.`);
      } else if (pi === "3.14") work.push("The circumference is C = π × d.", `3.14 ${TIMES} ${d} = ${T(ans, true)}.`);
      else work.push("The circumference is C = π × d.", `With d = ${d}, C = ${d}π.`);
    } else {
      if (given === "d") work.push(`The radius is half the diameter: ${d} ${DIVIDE} 2 = ${r}.`);
      work.push("The area is A = π × r × r.", `${r} ${TIMES} ${r} = ${r * r}.`);
      work.push(pi === "3.14" ? `3.14 ${TIMES} ${r * r} = ${T(ans, true)}.` : `So the area is ${r * r}π.`);
    }
    // distractors on the coefficient (multiplier of pi)
    let wrong;
    if (what === "circumference" && given === "r") wrong = [[fr(r * r), "uses-the-area-formula"], [fr(r), "forgets-to-double-the-radius"], [fr(4 * r), "doubles-the-diameter-again"], [fr(2 * r + r), "adds-instead-of-multiplying"]];
    else if (what === "circumference") wrong = [[fr(2 * d), "treats-the-diameter-as-the-radius"], [fr(r * r), "uses-the-area-formula"], [fr(r), "uses-the-radius-in-the-diameter-formula"], [fr(d + r), "adds-the-diameter-and-radius"]];
    else if (given === "r") wrong = [[fr(2 * r), "uses-the-circumference-formula"], [fr(r), "forgets-to-square-the-radius"], [fr(4 * r * r), "squares-the-diameter-instead"], [fr(r * r * 2), "doubles-instead-of-squaring"]];
    else wrong = [[fr(d * d), "uses-the-diameter-as-the-radius"], [fr(d), "forgets-to-halve-and-square"], [fr((d * d) / 2), "halves-the-square-of-the-diameter"], [fr(2 * r), "uses-the-circumference-formula"]];
    let distractors;
    if (pi === "3.14") distractors = D(ans, [...wrong.map(([c, t]) => [PI3.mul(c), t]), [coef, "forgets-to-multiply-by-pi"]], true);
    else distractors = withPi(D(ans, wrong, false));
    return {
      spec: { type: "circ", what, given, n: gv, pi },
      stem: ST(`A ${obj} is a circle. ${given_st.plain} ${tag.plain}`, `A ${obj} is a circle. ${given_st.standard} ${tag.standard}`, `A ${obj} is shaped like a circle. ${given_st.rich} ${tag.rich}`),
      ask: what === "circumference" ? ST("What is the distance around the circle?", "What is the circumference?", "Determine the circumference.") : ST("How much space is inside the circle?", "What is the area?", "Determine the area."),
      expr: null,
      answer: pi === "3.14" ? A(ans, { dec: true, unit: unitOut }) : { value: `${coef.n}π`, kind: "text", unit: unitOut },
      work,
      visual: { kind: "circle", alt: `A circle with its ${given === "r" ? "radius" : "diameter"} labeled ${gv} ${UNIT[u][1]}.`, r: gv / (given === "r" ? 1 : 2), show: given === "r" ? "radius" : "diameter", unit: u },
      distractors,
      hints: H(what === "circumference" ? "The circumference is a length, the distance around the circle. It uses pi times the diameter." : "The area is the space inside the circle. It uses pi times the radius times the radius.", given === "r" && what === "circumference" ? "The diameter is twice the radius. Multiply pi by the diameter." : given === "d" && what === "area" ? "Halve the diameter to get the radius before you use the area formula." : "Pick the correct formula, replace the letters with the numbers you know, then multiply."),
    };
  },
};

const geoCircInv = {
  lv: [3],
  gen({ rng }) {
    const from = rng.pick(["circumference", "area"]);
    const r = rng.int(2, 12);
    const val = from === "circumference" ? PI3.mul(fr(2 * r)) : PI3.mul(fr(r * r));
    const u = rng.pick(["cm", "m", "in", "ft"]);
    const vT = T(val, true);
    const ans = fr(r);
    const wrong =
      from === "circumference"
        ? [[val.div(PI3), "finds-the-diameter-not-the-radius"], [val.div(fr(2)), "forgets-to-divide-by-pi"], [val.mul(PI3), "multiplies-by-pi"], [val.div(PI3).div(fr(4)), "divides-by-4-pi"]]
        : [[val.div(PI3), "forgets-the-square-root"], [val.div(PI3.mul(fr(2))), "uses-the-circumference-formula"], [val.div(PI3).div(fr(2)), "halves-instead-of-square-rooting"], [val.div(fr(2)), "forgets-pi-and-the-square-root"]];
    return {
      spec: { type: "circ-inv", from, v: S(val), pi: "3.14" },
      stem: from === "circumference" ? ST(`A circle has a circumference of ${vT} ${UNIT[u][1]}. Use 3.14 for pi.`, `A circle has a circumference of ${vT} ${UNIT[u][1]}. Use 3.14 for π.`, `The circumference of a circle is ${vT} ${UNIT[u][1]}. Use 3.14 as the approximation of π.`) : ST(`A circle has an area of ${vT} square ${UNIT[u][1]}. Use 3.14 for pi.`, `A circle has an area of ${vT} square ${UNIT[u][1]}. Use 3.14 for π.`, `The area of a circle is ${vT} square ${UNIT[u][1]}. Use 3.14 as the approximation of π.`),
      ask: ST("What is the radius?", "What is the radius of the circle?", "Determine the radius of the circle."),
      expr: null,
      answer: A(ans, { unit: UNIT[u][1] }),
      work: from === "circumference" ? [`C = 2 × π × r, so r = C ${DIVIDE} (2 × π).`, `2 ${TIMES} 3.14 = 6.28.`, `${vT} ${DIVIDE} 6.28 = ${r}.`] : [`A = π × r × r, so r × r = A ${DIVIDE} π.`, `${vT} ${DIVIDE} 3.14 = ${r * r}.`, `${r} ${TIMES} ${r} = ${r * r}, so r = ${r}.`],
      visual: null,
      distractors: D(ans, wrong, true),
      hints: H("Work backward from the formula: undo each operation in the reverse order.", from === "circumference" ? "Divide the circumference by 2 times pi." : "Divide the area by pi, then find the number that multiplies by itself to give that result."),
    };
  },
};

const geoComposite = {
  lv: [2, 3],
  gen({ rng, level }) {
    const shape = level === 2 ? rng.pick(["hole", "l"]) : rng.pick(["hole", "l", "semi", "perim", "semi", "perim"]);
    const u = rng.pick(shape === "hole" ? ["cm", "in", "ft"] : shape === "semi" ? ["ft", "m", "in"] : ["m", "ft"]);
    const un = UNIT[u][1];
    if (shape === "hole") {
      const W = rng.int(8, 16);
      const Hh = rng.int(6, 12);
      const s = rng.int(2, 4);
      const ans = fr(W * Hh - s * s);
      return {
        spec: { type: "comp", shape, W, H: Hh, s },
        stem: ST(
          `A flat board is a rectangle. It is ${W} ${un} long and ${Hh} ${un} wide. A square hole is cut out of it. The hole is ${s} ${un} on each side.`,
          `A rectangular board is ${W} ${un} long and ${Hh} ${un} wide. A square with sides of ${s} ${un} is cut out of the board.`,
          `A rectangular board measures ${W} ${un} by ${Hh} ${un}. A square opening with side length ${s} ${un} is removed from it.`,
        ),
        ask: ST("What is the area of the board that is left?", "What is the area of the remaining board, in square " + un + "?", "Determine the area of the remaining board, in square " + un + "."),
        expr: null,
        answer: A(ans, { unit: `square ${un}` }),
        work: [`Area of the whole rectangle: ${W} ${TIMES} ${Hh} = ${W * Hh}.`, `Area of the square hole: ${s} ${TIMES} ${s} = ${s * s}.`, `Subtract: ${W * Hh} ${MINUS} ${s * s} = ${W * Hh - s * s}.`],
        visual: { kind: "rect", alt: `The whole rectangle, ${W} ${un} long and ${Hh} ${un} wide.`, w: W, h: Hh, unit: u, showArea: false, labels: [`${W} ${u}`, `${Hh} ${u}`] },
        distractors: D(ans, [[fr(W * Hh + s * s), "adds-the-hole"], [fr(W * Hh), "ignores-the-hole"], [fr((W - s) * (Hh - s)), "subtracts-the-side-from-both-lengths"], [fr(2 * (W + Hh) - 4 * s), "uses-perimeter-ideas"]]),
        hints: H("Find the area of the whole shape first, then take away the part that is missing.", "Multiply to find each area before you subtract."),
      };
    }
    if (shape === "l") {
      const w1 = rng.int(6, 12);
      const h1 = rng.int(3, 6);
      const w2 = rng.int(2, 5);
      const h2 = rng.int(3, 7);
      const ans = fr(w1 * h1 + w2 * h2);
      return {
        spec: { type: "comp", shape, w1, h1, w2, h2 },
        stem: ST(
          `An L-shaped room is made from two rectangles that do not overlap. One rectangle is ${w1} ${un} by ${h1} ${un}. The other rectangle is ${w2} ${un} by ${h2} ${un}.`,
          `An L-shaped room is made by joining two rectangles that do not overlap. One measures ${w1} ${un} by ${h1} ${un}. The other measures ${w2} ${un} by ${h2} ${un}.`,
          `An L-shaped floor consists of two non-overlapping rectangles, one measuring ${w1} ${un} by ${h1} ${un} and the other measuring ${w2} ${un} by ${h2} ${un}.`,
        ),
        ask: ST("What is the area of the whole room?", "What is the total area of the room, in square " + un + "?", "Determine the total area of the floor, in square " + un + "."),
        expr: null,
        answer: A(ans, { unit: `square ${un}` }),
        work: [`First rectangle: ${w1} ${TIMES} ${h1} = ${w1 * h1}.`, `Second rectangle: ${w2} ${TIMES} ${h2} = ${w2 * h2}.`, `Add: ${w1 * h1} + ${w2 * h2} = ${w1 * h1 + w2 * h2}.`],
        visual: null,
        distractors: D(ans, [[fr(Math.max(w1, w2) * (h1 + h2)), "treats-the-shape-as-one-big-rectangle"], [fr(w1 * h1), "forgets-one-rectangle"], [fr(w1 + h1 + w2 + h2), "adds-the-side-lengths"], [fr(w1 * h1 * w2 * h2), "multiplies-everything"]]),
        hints: H("Break the shape into pieces whose areas you know, and add the pieces.", "Find the area of each rectangle by multiplying its two sides, then add."),
      };
    }
    if (shape === "semi") {
      const w = 2 * rng.int(2, 6);
      const hh = rng.int(3, 9);
      const r = w / 2;
      const semi = PI3.mul(fr(r * r)).div(fr(2));
      const ans = fr(w * hh).add(semi);
      return {
        spec: { type: "comp", shape, w, h: hh, pi: "3.14" },
        stem: ST(
          `A window is a rectangle with a half circle on top. The rectangle is ${w} ${un} wide and ${hh} ${un} tall. The half circle sits on the ${w} ${un} side. Use 3.14 for pi.`,
          `A window is a rectangle with a semicircle on top. The rectangle is ${w} ${un} wide and ${hh} ${un} tall, and the semicircle's diameter is the ${w} ${un} side. Use 3.14 for π.`,
          `A window consists of a rectangle that is ${w} ${un} wide and ${hh} ${un} tall, topped by a semicircle whose diameter is the ${w} ${un} side. Use 3.14 as the approximation of π.`,
        ),
        ask: ST("What is the area of the whole window?", "What is the total area of the window, in square " + un + "?", "Determine the total area of the window, in square " + un + "."),
        expr: null,
        answer: A(ans, { dec: true, unit: `square ${un}` }),
        work: [`Rectangle: ${w} ${TIMES} ${hh} = ${w * hh}.`, `The radius is half of ${w}: ${w} ${DIVIDE} 2 = ${r}.`, `Whole circle: 3.14 ${TIMES} ${r * r} = ${T(PI3.mul(fr(r * r)), true)}.`, `Half circle: ${T(PI3.mul(fr(r * r)), true)} ${DIVIDE} 2 = ${T(semi, true)}.`, `Add: ${w * hh} + ${T(semi, true)} = ${T(ans, true)}.`],
        visual: null,
        distractors: D(ans, [[fr(w * hh).add(PI3.mul(fr(r * r))), "uses-a-whole-circle"], [fr(w * hh), "ignores-the-half-circle"], [fr(w * hh).add(PI3.mul(fr(w * w)).div(fr(2))), "uses-the-diameter-as-the-radius"], [fr(w * hh).add(PI3.mul(fr(r)).div(fr(2))), "forgets-to-square-the-radius"]], true),
        hints: H("The shape is a rectangle plus half of a circle. Find each area separately.", "The radius is half of the width. Find the whole circle, take half of it, and add the rectangle."),
      };
    }
    // perimeter of an L-shape cut from a corner
    const W = rng.int(10, 18);
    const Hh = rng.int(8, 14);
    const cw = rng.int(3, W - 4);
    const ch = rng.int(2, Hh - 3);
    const ans = fr(2 * (W + Hh));
    return {
      spec: { type: "comp-perim", shape: "perim", W, H: Hh, cw, ch },
      stem: ST(
        `A patio is a rectangle that is ${W} ${un} long and ${Hh} ${un} wide. A rectangle that is ${cw} ${un} by ${ch} ${un} is cut out of one corner. This makes an L shape.`,
        `A rectangular patio is ${W} ${un} long and ${Hh} ${un} wide. A rectangle that measures ${cw} ${un} by ${ch} ${un} is cut out of one corner, leaving an L shape.`,
        `A rectangular patio measures ${W} ${un} by ${Hh} ${un}. A rectangle measuring ${cw} ${un} by ${ch} ${un} is removed from one corner, leaving an L-shaped patio.`,
      ),
      ask: ST("What is the distance around the L shape?", "What is the perimeter of the L-shaped patio?", "Determine the perimeter of the L-shaped patio."),
      expr: null,
      answer: A(ans, { unit: un }),
      work: [`Cutting a corner does not change the outside distance, because the new edges add up to the lengths they replace.`, `Perimeter of the original rectangle: 2 ${TIMES} (${W} + ${Hh}).`, `${W} + ${Hh} = ${W + Hh}.`, `2 ${TIMES} ${W + Hh} = ${2 * (W + Hh)}.`],
      visual: { kind: "rect", alt: `The original rectangle, ${W} ${un} long and ${Hh} ${un} wide, before the corner is cut out.`, w: W, h: Hh, unit: u, showPerimeter: false, labels: [`${W} ${u}`, `${Hh} ${u}`] },
      distractors: D(ans, [[fr(W * Hh), "finds-the-area-instead"], [fr(W + Hh), "forgets-to-double"], [fr(2 * (W + Hh) - 2 * (cw + ch)), "subtracts-the-cut-out-sides"], [fr(2 * (W + Hh) + 2 * (cw + ch)), "adds-the-cut-out-sides"]]),
      hints: H("Picture sliding the new inside edges to the outside. They line up with the sides that were removed.", "Find the perimeter of the whole rectangle before the corner was cut."),
    };
  },
};

const angDeg = (n) => `${n}°`;
const angTerm = (a, c) => `${a === 1 ? "" : a}x${c === 0 ? "" : ` ${c < 0 ? MINUS : "+"} ${Math.abs(c)}`}`;
function algWork(a1, c1, a2, c2, total, x, big) {
  const sumC = c1 + c2;
  const w = [`Add the two angles and set the sum equal to ${total}.`, `${angTerm(a1 + a2, sumC)} = ${total}.`];
  if (sumC > 0) w.push(`Subtract ${sumC} from both sides: ${total} ${MINUS} ${sumC} = ${total - sumC}.`);
  else if (sumC < 0) w.push(`Add ${Math.abs(sumC)} to both sides: ${total} + ${Math.abs(sumC)} = ${total - sumC}.`);
  w.push(`So ${a1 + a2}x = ${total - sumC}.`, `Divide both sides by ${a1 + a2}: ${total - sumC} ${DIVIDE} ${a1 + a2} = ${x}.`);
  if (big) w.push(`The angles are ${big[0]}° and ${big[1]}°. The larger angle is ${big[2]}°.`);
  return w;
}
const geoAngle = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    if (level === 3 && rng.chance(0.7)) {
      const total = rng.pick([90, 180]);
      let x;
      let a1;
      let a2;
      let c1;
      let c2;
      for (let t = 0; t < 400; t++) {
        x = rng.int(4, 30);
        a1 = rng.int(1, 4);
        a2 = rng.int(1, 4);
        c1 = rng.int(0, 20);
        c2 = total - (a1 + a2) * x - c1;
        if (a1 * x + c1 > 0 && a2 * x + c2 > 0 && Math.abs(c2) <= 40 && a1 * x + c1 !== a2 * x + c2) break;
      }
      const ask = rng.pick(["x", "larger"]);
      const rel = total === 90 ? "complementary" : "supplementary";
      const A1 = a1 * x + c1;
      const A2 = a2 * x + c2;
      const larger = Math.max(A1, A2);
      const e1 = `(${angTerm(a1, c1)})°`;
      const e2 = `(${angTerm(a2, c2)})°`;
      const wrongX = [[fr(total - c1 - c2), "forgets-to-divide-by-the-sum-of-the-coefficients"], [fr(total + c1 + c2, a1 + a2), "adds-the-constants"], [fr(total, a1 + a2), "ignores-the-constants"], [fr((total === 90 ? 180 : 90) - c1 - c2, a1 + a2), "uses-the-wrong-total"]];
      const wrongL = [[fr(Math.min(A1, A2)), "picks-the-smaller-angle"], [fr(x), "reports-x-instead-of-the-angle"], [fr(total, 2), "assumes-the-angles-are-equal"], [fr(total), "reports-the-sum-of-the-angles"]];
      return {
        spec: { type: "angle-alg", total, a1, c1, a2, c2, ask },
        stem: ST(
          `Two angles are ${rel}. Their sum is ${total}°. One angle is ${e1}. The other angle is ${e2}.`,
          `Two ${rel} angles measure ${e1} and ${e2}. The sum of ${rel} angles is ${total}°.`,
          `Two angles are ${rel}, so their measures sum to ${total}°. Their measures are ${e1} and ${e2}.`,
        ),
        ask: ask === "x" ? ST("What is x?", "What is the value of x?", "Determine the value of x.") : ST("How many degrees is the bigger angle?", "What is the measure of the larger angle, in degrees?", "Determine the measure of the larger angle, in degrees."),
        expr: `${angTerm(a1, c1)} + ${angTerm(a2, c2)} = ${total}`,
        answer: A(fr(ask === "x" ? x : larger), { unit: ask === "x" ? undefined : "degrees" }),
        work: algWork(a1, c1, a2, c2, total, x, ask === "larger" ? [A1, A2, larger] : null),
        visual: null,
        distractors: D(fr(ask === "x" ? x : larger), ask === "x" ? wrongX : wrongL),
        hints: H("Complementary angles add to 90 degrees and supplementary angles add to 180 degrees. Write that as an equation.", "Combine the x-terms and the numbers on the left, then solve the equation step by step."),
      };
    }
    const rel = level === 1 ? rng.pick(["complementary", "supplementary"]) : rng.pick(["complementary", "supplementary", "vertical", "straight"]);
    let aa;
    do aa = rel === "complementary" ? rng.int(2, 17) * 5 : rel === "vertical" ? rng.int(3, 33) * 5 : rng.int(2, 34) * 5;
    while (aa === 90 || aa === 45);
    const target = rel === "complementary" ? 90 - aa : rel === "vertical" ? aa : 180 - aa;
    const flavor = {
      complementary: ST(`Two angles are complementary. One angle measures ${angDeg(aa)}.`, `Two angles are complementary. One measures ${angDeg(aa)}.`, `Two angles are complementary, and one of them measures ${angDeg(aa)}.`),
      supplementary: ST(`Two angles are supplementary. One angle measures ${angDeg(aa)}.`, `Two angles are supplementary. One measures ${angDeg(aa)}.`, `Two angles are supplementary, and one of them measures ${angDeg(aa)}.`),
      vertical: ST(`Two lines cross. One angle is ${angDeg(aa)}. The angle across from it is a vertical angle.`, `Two lines intersect. One angle measures ${angDeg(aa)}. Its vertical angle is directly across from it.`, `Two lines intersect, forming an angle of ${angDeg(aa)}. Consider the angle vertical to it.`),
      straight: ST(`Two angles are next to each other. Together they make a straight line. One angle is ${angDeg(aa)}.`, `Two adjacent angles together form a straight line. One measures ${angDeg(aa)}.`, `Two adjacent angles form a linear pair, and one of them measures ${angDeg(aa)}.`),
    }[rel];
    const wrong = {
      complementary: [[fr(180 - aa), "mixes-up-complementary-and-supplementary"], [fr(aa), "assumes-the-angles-are-equal"], [fr(90 + aa), "adds-to-90-instead-of-subtracting"], [fr(360 - aa), "uses-360-degrees"]],
      supplementary: [[fr(90 - aa), "mixes-up-complementary-and-supplementary"], [fr(aa), "assumes-the-angles-are-equal"], [fr(180 + aa), "adds-to-180-instead-of-subtracting"], [fr(360 - aa), "uses-360-degrees"]],
      straight: [[fr(90 - aa), "mixes-up-straight-and-right-angles"], [fr(aa), "assumes-the-angles-are-equal"], [fr(360 - aa), "uses-360-degrees"], [fr(180 + aa), "adds-to-180-instead-of-subtracting"]],
      vertical: [[fr(180 - aa), "treats-vertical-angles-as-supplementary"], [fr(90 - aa), "treats-vertical-angles-as-complementary"], [fr(360 - aa), "uses-360-degrees"], [fr(2 * aa), "doubles-the-angle"]],
    }[rel];
    const w = {
      complementary: [`Complementary angles add to 90°.`, `${90} ${MINUS} ${aa} = ${target}.`],
      supplementary: [`Supplementary angles add to 180°.`, `${180} ${MINUS} ${aa} = ${target}.`],
      straight: [`Angles that form a straight line add to 180°.`, `${180} ${MINUS} ${aa} = ${target}.`],
      vertical: [`Vertical angles are equal.`, `So the angle measures ${aa}°.`],
    }[rel];
    return {
      spec: { type: "angle", rel, a: aa },
      stem: flavor,
      ask: rel === "vertical" ? ST("What is the other angle, in degrees?", "What is the measure of the vertical angle, in degrees?", "Determine the measure of the vertical angle, in degrees.") : ST("What is the other angle, in degrees?", "What is the measure of the other angle, in degrees?", "Determine the measure of the other angle, in degrees."),
      expr: null,
      answer: A(fr(target), { unit: "degrees" }),
      work: w,
      visual: { kind: "angle", alt: `An angle that measures ${aa} degrees.`, deg: aa, label: angDeg(aa), protractor: false },
      distractors: D(fr(target), wrong.map(([f, t]) => [f.n > 0 ? f : null, t])),
      hints: H(rel === "vertical" ? "Two lines that cross make pairs of angles that sit across from each other. Think about what is the same about them." : "The word tells you what the two angles must add to. Use that total.", rel === "vertical" ? "Write down the angle across from the one you know." : "Subtract the angle you know from the total."),
    };
  },
};

const CROSS = {
  prism: (rng) => {
    const [l, w, h] = rng.sample([3, 4, 5, 6, 7, 8, 9, 10], 3);
    const cut = rng.pick(["parallel", "vertical"]);
    return { dims: [l, w, h], cut, text: `A rectangular prism is ${l} cm long, ${w} cm wide and ${h} cm tall.`, cutText: cut === "parallel" ? "A plane cuts the prism parallel to its base (the " + l + " cm by " + w + " cm face)." : `A plane cuts the prism straight down, parallel to a side face.` };
  },
  cube: (rng) => {
    const e = rng.int(3, 9);
    return { dims: [e], cut: "parallel", text: `A cube has edges of ${e} cm.`, cutText: "A plane cuts the cube parallel to one of its faces." };
  },
  cylinder: (rng) => {
    const r = rng.int(2, 6);
    const h = rng.int(7, 12);
    const cut = rng.pick(["parallel", "vertical"]);
    return { dims: [r, h], cut, text: `A cylinder has a radius of ${r} cm and a height of ${h} cm.`, cutText: cut === "parallel" ? "A plane cuts the cylinder parallel to its base." : "A plane cuts straight down through the center of the cylinder, perpendicular to the base." };
  },
  cone: (rng) => {
    const r = rng.int(2, 6);
    const h = rng.int(7, 12);
    const cut = rng.pick(["parallel", "vertical"]);
    return { dims: [r, h], cut, text: `A cone has a base radius of ${r} cm and a height of ${h} cm.`, cutText: cut === "parallel" ? "A plane cuts the cone parallel to its base." : "A plane cuts straight down through the tip of the cone and the center of its base." };
  },
  sphere: (rng) => {
    const r = rng.int(3, 9);
    return { dims: [r], cut: "any", text: `A sphere has a radius of ${r} cm.`, cutText: "A plane cuts through the sphere." };
  },
  pyramid: (rng) => {
    const b = rng.int(4, 10);
    const h = rng.int(5, 12);
    const cut = rng.pick(["parallel", "vertical"]);
    return { dims: [b, h], cut, text: `A pyramid has a square base with sides of ${b} cm and a height of ${h} cm.`, cutText: cut === "parallel" ? "A plane cuts the pyramid parallel to its base." : "A plane cuts straight down through the tip of the pyramid and the middle of two opposite base edges." };
  },
};
const crossAnswer = (solid, cut, dims) => {
  if (solid === "prism") return cut === "parallel" ? "rectangle" : "rectangle";
  if (solid === "cube") return "square";
  if (solid === "cylinder") return cut === "parallel" ? "circle" : "rectangle";
  if (solid === "cone") return cut === "parallel" ? "circle" : "triangle";
  if (solid === "sphere") return "circle";
  return cut === "parallel" ? "square" : "triangle";
};
const geoCross = {
  lv: [2, 3],
  gen({ rng }) {
    const solid = rng.pick(Object.keys(CROSS));
    const c = CROSS[solid](rng);
    const ans = crossAnswer(solid, c.cut, c.dims);
    const pool = ["circle", "rectangle", "triangle", "square", "trapezoid"].filter((s) => s !== ans && !(ans === "square" && s === "rectangle") && !(ans === "rectangle" && s === "square"));
    const tags = { circle: "thinks-every-slice-is-round", rectangle: "thinks-every-slice-is-a-rectangle", triangle: "thinks-the-cut-follows-a-slanted-side", square: "thinks-every-slice-matches-the-base", trapezoid: "slants-the-cut" };
    return {
      spec: { type: "cross", solid, cut: c.cut, dims: c.dims },
      stem: ST(`${c.text} ${c.cutText}`, `${c.text} ${c.cutText}`, `${c.text} ${c.cutText}`),
      ask: ST("What shape is the cut face?", "What shape is the cross section?", "Name the shape of the cross section."),
      expr: null,
      answer: { value: ans, kind: "text" },
      work: [`Picture the plane slicing through the solid.`, `The face the plane makes inside the solid is a ${ans}.`],
      visual: null,
      distractors: rng.shuffle(pool).slice(0, 3).map((s) => ({ text: s, misconception: tags[s] })),
      hints: H("A cross section is the flat shape you see where a plane cuts through a solid.", "Imagine slicing a block of clay. Say what the new flat face looks like."),
    };
  },
};

FAMILIES.circle = {
  title: "Geometry and measurement",
  grades: [7],
  defaults: {},
  gen(rng, params, opts) {
    const level = opts.level;
    const t = pickType(rng, level, [geoCirc, geoCirc, geoCircInv, geoComposite, geoAngle, geoAngle, geoCross]);
    return done({ family: "circle", level, ...t.gen({ rng, level, ctx: opts.ctx }) });
  },
};

// ================================================================================================================ probability
const COLORS = ["red", "blue", "green", "yellow", "orange", "white"];
const BAGS = [
  { c: "bag", it: ["marble", "marbles"] },
  { c: "jar", it: ["bead", "beads"] },
  { c: "box", it: ["crayon", "crayons"] },
];
/** Sum lines with one addition each ("3 + 4 = 7", "7 + 2 = 9"): chained sums would read as false facts. */
function chainSum(nums) {
  const out = [];
  let acc = nums[0];
  for (let i = 1; i < nums.length; i++) {
    out.push(`${acc} + ${nums[i]} = ${acc + nums[i]}`);
    acc += nums[i];
  }
  return out;
}
const listCounts = (colors, counts, item) => {
  const parts = colors.map((c, i) => (item ? `${counts[i]} ${c} ${counts[i] === 1 ? item[0] : item[1]}` : `${counts[i]} ${c}`));
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
};
const spinnerVis = (colors, counts, alt) => ({ kind: "spinner", alt, sections: colors.flatMap((c, i) => Array.from({ length: counts[i] }, () => ({ label: c, weight: 1 }))) });

const prSimple = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const story0 = level === 1 ? "spinner" : rng.pick(["bag", "spinner", "bag"]);
    const ncol = level === 1 ? rng.pick([2, 3]) : rng.pick([3, 3, 4]);
    const colors = rng.sample(COLORS, ncol);
    const form = level === 1 ? "frac" : rng.pick(["frac", "dec"]);
    let counts = null;
    for (let t = 0; t < 3000 && !counts; t++) {
      const cs = colors.map(() => rng.int(1, level === 3 ? 7 : level === 2 ? 6 : 4));
      const tot = cs.reduce((a, b) => a + b, 0);
      if (form === "dec" && ![4, 5, 8, 10, 20, 25].includes(tot)) continue;
      if (tot > (level === 1 ? 10 : 20) || tot < 4) continue;
      counts = cs;
    }
    if (!counts) counts = ncol === 2 ? [3, 2] : ncol === 3 ? [2, 3, 5] : [1, 2, 3, 4];
    const total = counts.reduce((a, b) => a + b, 0);
    const story = story0 === "spinner" && total > 12 ? "bag" : story0;
    const idx = rng.shuffle(colors.map((_, i) => i));
    const kind = level === 1 ? "in1" : level === 2 ? rng.pick(["in1", "notin", "in2"]) : rng.pick(["notin", "in2", "in2", "notin"]);
    const setIdx = kind === "in2" && ncol >= 3 ? idx.slice(0, 2) : idx.slice(0, 1);
    const ev = kind === "notin" ? "notin" : "in";
    const set = setIdx.map((i) => colors[i]);
    const inSum = setIdx.reduce((a, i) => a + counts[i], 0);
    const fav = ev === "in" ? inSum : total - inSum;
    const P = fr(fav, total);
    const bag = rng.pick(BAGS);
    const cnt = Object.fromEntries(colors.map((c, i) => [c, counts[i]]));
    const np = story === "bag" ? (ev === "notin" ? `a ${bag.it[0]} that is not ${set[0]}` : set.map((c) => `${an(c)} ${c} ${bag.it[0]}`).join(" or ")) : ev === "notin" ? `a color that is not ${set[0]}` : set.join(" or ");
    const verb = story === "bag" ? "picking" : "landing on";
    const verbRich = story === "bag" ? "selecting" : "landing on";
    const formAsk = form === "frac" ? ["Write a fraction in simplest form.", "Write your answer as a fraction in simplest form.", "Express the answer as a fraction in simplest form."] : ["Write a decimal.", "Write your answer as a decimal.", "Express the answer as a decimal."];
    const stem =
      story === "bag"
        ? ST(`A ${bag.c} has ${listCounts(colors, counts, bag.it)}. One ${bag.it[0]} is picked without looking.`, `A ${bag.c} has ${listCounts(colors, counts, bag.it)}. One ${bag.it[0]} is picked at random.`, `A ${bag.c} contains ${listCounts(colors, counts, bag.it)}. One ${bag.it[0]} is selected at random.`)
        : ST(`A spinner has ${total} equal sections: ${listCounts(colors, counts)}. The spinner is spun one time.`, `A spinner has ${total} equal sections: ${listCounts(colors, counts)}. The spinner is spun once.`, `A spinner is divided into ${total} equal sections: ${listCounts(colors, counts)}. The spinner is spun once.`);
    const favLines = ev === "in" ? (setIdx.length === 2 ? chainSum(setIdx.map((i) => counts[i])) : []) : [`${total} ${MINUS} ${inSum} = ${fav}`];
    const work = [`Total: ${chainSum(counts).join(", ") || counts[0]}.`];
    work.push(ev === "in" ? `Favorable outcomes (${set.join(" or ")}): ${favLines.length ? favLines[0] : counts[setIdx[0]]}.` : `Outcomes that are not ${set[0]}: ${favLines[0]}.`);
    work.push(form === "frac" ? `Probability = favorable ${DIVIDE} total = ${fav}/${total}${P.d !== total ? `, which is ${P.n}/${P.d} in simplest form` : ""}.` : `${fav} ${DIVIDE} ${total} = ${T(P, true)}.`);
    return {
      spec: { type: "simple", counts: cnt, event: { kind: ev, set }, form },
      stem,
      ask: ST(`What is the chance of ${verb} ${np}? ${formAsk[0]}`, `What is the probability of ${verb} ${np}? ${formAsk[1]}`, `Determine the probability of ${verbRich} ${np}. ${formAsk[2]}`),
      expr: null,
      answer: A(P, { dec: form === "dec" }),
      work,
      visual: story === "spinner" ? spinnerVis(colors, counts, `A spinner with ${total} equal sections: ${listCounts(colors, counts)}.`) : { kind: "bar", alt: `A bar chart of the ${bag.it[1]} in the ${bag.c}: ${listCounts(colors, counts, bag.it)}.`, title: `${cap(bag.it[1])} in the ${bag.c}`, cats: colors, values: counts, scale: 1, orient: "v", picture: false, unit: "", axisLabel: `Number of ${bag.it[1]}` },
      distractors: D(P, [[fr(fav, total - fav), "compares-favorable-to-unfavorable-instead-of-total"], [fr(total - fav, total), "finds-the-opposite-event"], [fr(setIdx.length, ncol), "counts-colors-instead-of-items"], fav > 1 ? [fr(1, total), "uses-one-over-the-total"] : [fr(fav, total + 1), "counts-one-extra-outcome"], [fr(fav, ncol + fav), "mixes-up-the-total"]], form === "dec"),
      hints: H("A probability compares the number of outcomes you want with the number of all equally likely outcomes.", "Count all the outcomes, count the ones that match the event, and write favorable over total."),
    };
  },
};

// ---- compound events: the solver re-enumerates the sample space from the spec
const dieSet = (pred) => [1, 2, 3, 4, 5, 6].filter((f) => (pred.op === "gt" ? f > pred.v : pred.op === "lt" ? f < pred.v : pred.op === "even" ? f % 2 === 0 : pred.op === "odd" ? f % 2 === 1 : pred.op === "prime" ? [2, 3, 5].includes(f) : f % pred.v === 0));
const predText = (p) => (p.op === "gt" ? `a number greater than ${p.v}` : p.op === "lt" ? `a number less than ${p.v}` : p.op === "even" ? "an even number" : p.op === "odd" ? "an odd number" : p.op === "prime" ? "a prime number" : `a multiple of ${p.v}`);
const prCompound = {
  lv: [2, 3],
  gen({ rng, level }) {
    const kind = level === 2 ? rng.pick(["two-coins", "coin-die", "coin-die"]) : rng.pick(["two-dice", "two-dice", "draws", "draws", "coin-die"]);
    if (kind === "two-coins") {
      const ev = rng.pick([{ kind: "heads-eq", n: 0 }, { kind: "heads-eq", n: 1 }, { kind: "heads-eq", n: 2 }, { kind: "heads-ge", n: 1 }]);
      const outs = ["HH", "HT", "TH", "TT"];
      const heads = (o) => [...o].filter((c) => c === "H").length;
      const fav = outs.filter((o) => (ev.kind === "heads-eq" ? heads(o) === ev.n : heads(o) >= ev.n));
      const P = fr(fav.length, 4);
      const phrase = ev.kind === "heads-eq" ? (ev.n === 0 ? "no heads" : `exactly ${ev.n} ${ev.n === 1 ? "head" : "heads"}`) : `at least ${ev.n} head`;
      return {
        spec: { type: "compound", kind, event: ev },
        stem: ST(`A coin is flipped 2 times. Each flip lands on heads or tails. Both are equally likely.`, `A fair coin is flipped 2 times.`, `A fair coin is flipped 2 times, and the flips do not affect each other.`),
        ask: ST(`What is the chance of getting ${phrase}? Write a fraction in simplest form.`, `What is the probability of getting ${phrase}? Write your answer as a fraction in simplest form.`, `Determine the probability of getting ${phrase}. Express the answer as a fraction in simplest form.`),
        expr: null,
        answer: A(P),
        work: [`List the 4 equally likely outcomes: ${outs.join(", ")}.`, `Outcomes with ${phrase}: ${fav.join(", ")} (${fav.length} of 4).`, `Probability = ${fav.length}/4${P.d !== 4 ? `, which is ${P.n}/${P.d} in simplest form` : ""}.`],
        visual: null,
        distractors: D(P, [[fr(1, 3), "counts-head-counts-as-equally-likely"], [fr(1, 2), "uses-the-probability-of-one-flip"], [fr(1, 4), "counts-only-one-ordering"], [fr(3, 4), "finds-a-different-event"], [fr(2, 3), "mixes-up-favorable-and-unfavorable"]]),
        hints: H("Write down every possible result of the two flips, in order, so that none is missed.", "Count the results that match the event, then divide by the total number of results."),
      };
    }
    if (kind === "coin-die") {
      const side = rng.pick(["H", "T"]);
      const pred = rng.pick([{ op: "gt", v: rng.int(2, 4) }, { op: "lt", v: rng.int(3, 5) }, { op: "even" }, { op: "odd" }, { op: "prime" }, { op: "mult", v: rng.pick([2, 3]) }]);
      const k = dieSet(pred).length;
      if (k === 0 || k === 6) return prCompound.gen({ rng, level });
      const P = fr(k, 12);
      const sw = side === "H" ? "heads" : "tails";
      const pT = predText(pred);
      return {
        spec: { type: "compound", kind, coin: side, die: pred },
        stem: ST(`A coin is flipped. A 6-sided die is rolled. Each side is equally likely.`, `A fair coin is flipped and a fair 6-sided die is rolled.`, `A fair coin is flipped and, independently, a fair 6-sided die is rolled.`),
        ask: ST(`What is the chance of getting ${sw} and ${pT}? Write a fraction in simplest form.`, `What is the probability of getting ${sw} and ${pT}? Write your answer as a fraction in simplest form.`, `Determine the probability of getting ${sw} and ${pT}. Express the answer as a fraction in simplest form.`),
        expr: null,
        answer: A(P),
        work: [`Die faces that work: ${dieSet(pred).join(", ")} (${k} of 6). Coin: 1 of 2.`, `Total outcomes: 2 ${TIMES} 6 = 12.`, `Favorable outcomes: 1 ${TIMES} ${k} = ${k}.`, `Probability = ${k}/12${P.d !== 12 ? `, which is ${P.n}/${P.d} in simplest form` : ""}.`],
        visual: null,
        distractors: D(P, [[fr(1, 2).add(fr(k, 6)).cmp(fr(1)) < 0 ? fr(1, 2).add(fr(k, 6)) : null, "adds-the-probabilities"], [fr(k, 6), "ignores-the-coin"], [fr(1, 2), "ignores-the-die"], [fr(k, 8), "counts-outcomes-as-6-plus-2"], [fr(k + 1, 12), "counts-one-extra-outcome"]]),
        hints: H("The two events happen together, so the number of outcomes is the number of coin results times the number of die results.", "Count how many pairs match, using the coin side and the die faces that work, then divide by the total number of pairs."),
      };
    }
    if (kind === "two-dice") {
      const evk = rng.pick(["sum-eq", "sum-eq", "sum-ge", "doubles", "sum-lt"]);
      const ev = evk === "sum-eq" ? { kind: evk, v: rng.int(3, 10) } : evk === "sum-ge" ? { kind: evk, v: rng.int(8, 11) } : evk === "sum-lt" ? { kind: evk, v: rng.int(4, 6) } : { kind: evk };
      let fav = 0;
      let favU = 0;
      for (let a = 1; a <= 6; a++)
        for (let b = 1; b <= 6; b++) {
          const s = a + b;
          const ok = ev.kind === "sum-eq" ? s === ev.v : ev.kind === "sum-ge" ? s >= ev.v : ev.kind === "sum-lt" ? s < ev.v : a === b;
          if (ok) {
            fav++;
            if (a <= b) favU++;
          }
        }
      const P = fr(fav, 36);
      const phrase = ev.kind === "sum-eq" ? `a sum of ${ev.v}` : ev.kind === "sum-ge" ? `a sum of ${ev.v} or more` : ev.kind === "sum-lt" ? `a sum less than ${ev.v}` : "the same number on both dice (doubles)";
      const rowsT = [1, 2, 3, 4, 5, 6].map((a) => [String(a), ...[1, 2, 3, 4, 5, 6].map((b) => String(a + b))]);
      return {
        spec: { type: "compound", kind, event: ev },
        stem: ST(`Two 6-sided dice are rolled. Each side is equally likely. The table shows the sum for every pair of results.`, `Two fair 6-sided dice are rolled. The table shows the sum of the two dice for every possible pair of results.`, `Two fair 6-sided dice are rolled. The table lists the sum of the two numbers for each of the equally likely pairs of results.`),
        ask: ST(`What is the chance of getting ${phrase}? Write a fraction in simplest form.`, `What is the probability of getting ${phrase}? Write your answer as a fraction in simplest form.`, `Determine the probability of getting ${phrase}. Express the answer as a fraction in simplest form.`),
        expr: null,
        answer: A(P),
        work: [`There are 6 ${TIMES} 6 = 36 equally likely pairs.`, `Count the pairs that match: ${fav}.`, `Probability = ${fav}/36${P.d !== 36 ? `, which is ${P.n}/${P.d} in simplest form` : ""}.`],
        visual: { kind: "table", alt: "A 6 by 6 table. The row is the first die and the column is the second die. Each cell shows the sum of the two dice.", headers: ["First die \\ second die", "1", "2", "3", "4", "5", "6"], rows: rowsT, caption: "Sums of two dice" },
        distractors: D(P, [[fr(fav, 12), "adds-6-and-6-for-the-sample-space"], [fr(favU, 21), "counts-each-unordered-pair-once"], [fr(fav, 11), "treats-each-sum-as-equally-likely"], [ev.kind === "sum-eq" ? fr(1, 11) : null, "uses-one-over-the-number-of-sums"], [fr(fav + 1, 36), "counts-one-extra-pair"]]),
        hints: H("Each die has 6 results, and any result of the first die can go with any result of the second die.", "Count the cells in the table that match the event. Then divide by the total number of cells."),
      };
    }
    // two draws
    const replace = rng.chance(0.5);
    const cols = rng.sample(COLORS, 3);
    const counts = [rng.int(2, 4), rng.int(2, 4), rng.int(1, 3)];
    const total = counts.reduce((a, b) => a + b, 0);
    const evk = rng.pick(["both", "different", "ordered"]);
    const ev = evk === "both" ? { kind: "both", color: cols[0] } : evk === "different" ? { kind: "different" } : { kind: "ordered", first: cols[0], second: cols[1] };
    const items = cols.flatMap((c, i) => Array.from({ length: counts[i] }, () => c));
    const prob = (rep) => {
      let f = 0;
      let t = 0;
      for (let i = 0; i < items.length; i++)
        for (let j = 0; j < items.length; j++) {
          if (!rep && i === j) continue;
          t++;
          const ok = ev.kind === "both" ? items[i] === ev.color && items[j] === ev.color : ev.kind === "different" ? items[i] !== items[j] : items[i] === ev.first && items[j] === ev.second;
          if (ok) f++;
        }
      return { f, t };
    };
    const { f: fav, t: tot } = prob(replace);
    const alt = prob(!replace);
    const P = fr(fav, tot);
    const bag = rng.pick(BAGS);
    const it = bag.it;
    const phrase = ev.kind === "both" ? `two ${ev.color} ${it[1]}` : ev.kind === "different" ? `two ${it[1]} of different colors` : `${an(ev.first)} ${ev.first} ${it[0]} first and then ${an(ev.second)} ${ev.second} ${it[0]}`;
    const c1 = counts[0];
    const c2 = counts[1];
    const wrongRepl = fr(alt.f, alt.t);
    const oneDraw = ev.kind === "different" ? null : fr(c1, total);
    const addDraws = ev.kind === "both" ? fr(2 * c1, total) : ev.kind === "ordered" ? fr(c1 + c2, total) : null;
    const wl = ev.kind === "both" ? [`First draw: ${c1}/${total}.`, replace ? `Second draw (the ${it[0]} was put back): ${c1}/${total}.` : `Second draw (one ${ev.color} ${it[0]} is gone): ${c1 - 1}/${total - 1}.`] : ev.kind === "ordered" ? [`First draw (${ev.first}): ${c1}/${total}.`, replace ? `Second draw (${ev.second}, the ${it[0]} was put back): ${c2}/${total}.` : `Second draw (${ev.second}, one ${it[0]} is gone): ${c2}/${total - 1}.`] : [`Count the ordered pairs of draws that have different colors: ${fav}.`];
    return {
      spec: { type: "compound", kind: "draws", counts: Object.fromEntries(cols.map((c, i) => [c, counts[i]])), replace, event: ev },
      stem: ST(
        `A ${bag.c} has ${listCounts(cols, counts, it)}. Two ${it[1]} are picked one at a time without looking. ${replace ? `After the first one is picked, it is put back.` : `The first one is not put back.`}`,
        `A ${bag.c} has ${listCounts(cols, counts, it)}. Two ${it[1]} are picked at random, one at a time. ${replace ? `The first ${it[0]} is put back before the second is picked.` : `The first ${it[0]} is not put back.`}`,
        `A ${bag.c} contains ${listCounts(cols, counts, it)}. Two ${it[1]} are selected at random, one after the other. ${replace ? `The first ${it[0]} is replaced before the second selection.` : `The first ${it[0]} is not replaced.`}`,
      ),
      ask: ST(`What is the chance of picking ${phrase}? Write a fraction in simplest form.`, `What is the probability of picking ${phrase}? Write your answer as a fraction in simplest form.`, `Determine the probability of selecting ${phrase}. Express the answer as a fraction in simplest form.`),
      expr: null,
      answer: A(P),
      work: [...wl, `Probability = ${fav}/${tot}${P.d !== tot ? `, which is ${P.n}/${P.d} in simplest form` : ""}.`],
      visual: { kind: "bar", alt: `A bar chart of the ${it[1]} in the ${bag.c}: ${listCounts(cols, counts, it)}.`, title: `${cap(it[1])} in the ${bag.c}`, cats: cols, values: counts, scale: 1, orient: "v", picture: false, unit: "", axisLabel: `Number of ${it[1]}` },
      distractors: D(P, [[wrongRepl, replace ? "removes-the-first-item-by-mistake" : "forgets-the-first-item-is-gone"], [oneDraw, "uses-only-one-draw"], [addDraws, "adds-instead-of-multiplying"], [fr(1).sub(P), "finds-the-opposite-event"], [fr(fav, tot + 1), "counts-a-wrong-total"]]),
      hints: H(replace ? "Because the first item is put back, the second draw starts from the same group as the first." : "Because the first item is not put back, the second draw starts from a smaller group.", "Find the probability of each draw, multiply them, and write the result in simplest form."),
    };
  },
};

const prExperimental = {
  lv: [2, 3],
  gen({ rng, level }) {
    const n = rng.pick([2, 4, 5, 10]);
    const trials = rng.pick([20, 25, 40, 50, 100]);
    const base = Math.round(trials / n);
    let hits;
    do hits = base + rng.int(-3, 5);
    while (hits < 2 || hits >= trials || hits * n === trials);
    const ask = level === 3 ? "diff" : "exp";
    const form = ask === "exp" && rng.chance(0.5) ? "dec" : "frac";
    const colors = ["blue", ...rng.sample(COLORS.filter((c) => c !== "blue"), Math.min(n - 1, 5))];
    const secs = n <= 6 ? colors.slice(0, n) : [...colors, ...Array.from({ length: n - colors.length }, (_, i) => "white")];
    const exp = fr(hits, trials);
    const theo = fr(1, n);
    const diff = exp.cmp(theo) > 0 ? exp.sub(theo) : theo.sub(exp);
    const [name] = rng.sample(NAMES, 1);
    const stem = ST(
      `A spinner has ${n} equal sections. One section is blue. ${name} spins it ${trials} times and gets blue ${hits} times.`,
      `A spinner has ${n} equal sections, and one of them is blue. ${name} spins the spinner ${trials} times and it lands on blue ${hits} times.`,
      `A spinner is divided into ${n} equal sections, exactly one of which is blue. ${name} spins it ${trials} times and records ${hits} landings on blue.`,
    );
    const ans = ask === "exp" ? exp : diff;
    const dm = ask === "diff" || form === "dec";
    return {
      spec: { type: "exp", n, trials, hits, ask },
      stem,
      ask: ask === "exp" ? ST(`Using ${name}'s results, what is the chance of blue? Write ${form === "dec" ? "a decimal" : "a fraction in simplest form"}.`, `What is the experimental probability of landing on blue? Write ${form === "dec" ? "a decimal" : "a fraction in simplest form"}.`, `Determine the experimental probability of landing on blue. Express the answer as ${form === "dec" ? "a decimal" : "a fraction in simplest form"}.`) : ST(`How far apart are the experimental and theoretical chances of blue? Write a decimal.`, `What is the difference between the experimental probability and the theoretical probability of landing on blue? Write a decimal.`, `Determine the absolute difference between the experimental and the theoretical probability of landing on blue. Express the answer as a decimal.`),
      expr: null,
      answer: A(ans, { dec: dm }),
      work: ask === "exp" ? [`Experimental probability = hits ${DIVIDE} spins.`, form === "dec" ? `${hits} ${DIVIDE} ${trials} = ${T(exp, true)}.` : `${hits}/${trials}${exp.d !== trials ? ` = ${exp.n}/${exp.d} in simplest form` : ""}.`] : [`Experimental probability: ${hits} ${DIVIDE} ${trials} = ${T(exp, true)}.`, `Theoretical probability: 1 ${DIVIDE} ${n} = ${T(theo, true)}.`, `Subtract the smaller from the larger: ${T(exp.cmp(theo) > 0 ? exp : theo, true)} ${MINUS} ${T(exp.cmp(theo) > 0 ? theo : exp, true)} = ${T(diff, true)}.`],
      visual: { kind: "spinner", alt: `A spinner with ${n} equal sections. One section is blue.`, sections: secs.map((c) => ({ label: c, weight: 1 })) },
      distractors: ask === "exp" ? D(exp, [[fr(hits, trials - hits), "compares-hits-to-misses"], [fr(trials - hits, trials), "finds-the-opposite-event"], [theo, "reports-the-theoretical-probability"], [fr(hits, n), "divides-hits-by-the-sections"]], dm) : D(diff, [[exp, "reports-the-experimental-probability"], [theo, "reports-the-theoretical-probability"], [exp.add(theo), "adds-the-probabilities"], [fr(Math.abs(hits * n - trials), n), "compares-counts-not-probabilities"]], dm),
      hints: H(ask === "exp" ? "Experimental probability comes from what actually happened in the trials, not from the shape of the spinner." : "Experimental probability uses the results of the trials. Theoretical probability uses the equal sections of the spinner.", ask === "exp" ? "Divide the number of times blue came up by the number of spins." : "Find both probabilities as decimals, then subtract the smaller from the larger."),
    };
  },
};

const prExpected = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    let p;
    let pStr;
    let N;
    if (level === 1) {
      const b = rng.pick([2, 4, 5, 10]);
      p = fr(1, b);
      pStr = `1/${b}`;
      N = b * rng.int(3, 15);
    } else if (level === 2) {
      const b = rng.pick([4, 5, 8, 10]);
      const a = rng.int(2, b - 1);
      p = fr(a, b);
      pStr = `${p.n}/${p.d}`;
      N = p.d * rng.int(3, 12);
    } else {
      const dp = rng.pick([0.15, 0.35, 0.45, 0.65, 0.12, 0.08, 0.3, 0.75]);
      pStr = String(dp);
      p = fr(Math.round(dp * 100), 100);
      N = rng.pick([100, 200, 300, 400, 500]);
    }
    const ans = p.mul(fr(N));
    const [name] = rng.sample(NAMES, 1);
    const sc = rng.pick([
      { n: (a) => ST(`A spinner lands on green with probability ${a.p}. ${a.name} spins it ${a.N} times.`, `The probability that a spinner lands on green is ${a.p}. ${a.name} spins it ${a.N} times.`, `A spinner has a probability of ${a.p} of landing on green. ${a.name} spins it ${a.N} times.`), q: (a) => ST("About how many times will the spinner land on green?", `How many times should ${a.name} expect the spinner to land on green?`, "Predict the number of times the spinner will land on green.") },
      { n: (a) => ST(`A player makes a free throw with probability ${a.p}. ${a.name} takes ${a.N} shots.`, `The probability that a player makes a free throw is ${a.p}. ${a.name} takes ${a.N} free throws.`, `A player has a probability of ${a.p} of making each free throw. ${a.name} attempts ${a.N} free throws.`), q: (a) => ST("About how many shots will go in?", `How many free throws should ${a.name} expect to make?`, "Predict the number of free throws that will be made.") },
      { n: (a) => ST(`A seed grows into a plant with probability ${a.p}. ${a.name} plants ${a.N} seeds.`, `The probability that a seed grows into a plant is ${a.p}. ${a.name} plants ${a.N} seeds.`, `Each seed has a probability of ${a.p} of growing into a plant. ${a.name} plants ${a.N} seeds.`), q: (a) => ST("About how many seeds will grow?", `How many of the seeds should ${a.name} expect to grow?`, "Predict the number of seeds that will grow into plants.") },
      { n: (a) => ST(`A bus is late with probability ${a.p}. ${a.name} rides the bus on ${a.N} days.`, `The probability that a bus is late is ${a.p}. ${a.name} rides the bus on ${a.N} days.`, `On any day the bus has a probability of ${a.p} of being late. ${a.name} rides it on ${a.N} days.`), q: (a) => ST("About how many days will the bus be late?", `On how many days should ${a.name} expect the bus to be late?`, "Predict the number of days on which the bus will be late.") },
    ]);
    const arg = { p: pStr, N, name };
    const dm = true;
    const den = p.d;
    return {
      spec: { type: "expected", p: pStr, N },
      stem: sc.n(arg),
      ask: sc.q(arg),
      expr: null,
      answer: A(ans),
      work: [`Expected number = probability ${TIMES} number of trials.`, `${pStr} ${TIMES} ${N} = ${T(ans, true)}.`],
      visual: null,
      distractors: D(ans, [[fr(N).mul(fr(1).sub(p)), "uses-the-complement"], [fr(N, den), "uses-only-the-denominator"], [fr(N).div(p), "divides-instead-of-multiplying"], [fr(N).mul(p).add(fr(den)), "adds-the-denominator"]], dm),
      hints: H("The probability tells what share of all the trials should have the event, so the answer is a part of the total number of trials.", "Multiply the number of trials by the probability. With a fraction, divide by the denominator and multiply by the numerator."),
    };
  },
};

const prConvert = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const pct = level === 1 ? rng.pick([10, 20, 25, 40, 50, 60, 75, 80]) : level === 2 ? rng.pick([5, 15, 35, 45, 65, 85, 12, 24, 36, 48]) : rng.pick([2, 4, 6, 8, 14, 22, 55, 72, 95, 4]);
    const to = rng.pick(["frac", "dec"]);
    const p = fr(pct, 100);
    const ctxs = ["rain", "win", "pass"];
    const sc = rng.pick(ctxs);
    const st = sc === "rain" ? ST(`The weather report says there is a ${pct}% chance of rain.`, `A weather report says there is a ${pct}% chance of rain tomorrow.`, `A forecast states a ${pct}% probability of rain tomorrow.`) : sc === "win" ? ST(`A game says you win ${pct}% of the time.`, `A game says the chance to win a prize is ${pct}%.`, `The probability of winning a prize in a game is ${pct}%.`) : ST(`A school says ${pct}% of the students ride the bus. One student is picked.`, `${pct}% of the students at a school ride the bus. One student is chosen at random.`, `${pct}% of the students at a school ride the bus, and one student is chosen at random.`);
    const ev = sc === "rain" ? "it rains" : sc === "win" ? "you win" : "the student rides the bus";
    const dm = to === "dec";
    const ans = p;
    return {
      spec: { type: "convert", pct, to },
      stem: st,
      ask: to === "dec" ? ST(`Write the chance that ${ev} as a decimal.`, `What is the probability that ${ev}, written as a decimal?`, `Express the probability that ${ev} as a decimal.`) : ST(`Write the chance that ${ev} as a fraction in simplest form.`, `What is the probability that ${ev}, written as a fraction in simplest form?`, `Express the probability that ${ev} as a fraction in simplest form.`),
      expr: null,
      answer: A(ans, { dec: dm }),
      work: [`A percent means "out of 100".`, to === "dec" ? `${pct} ${DIVIDE} 100 = ${T(p, true)}.` : `${pct}% = ${pct}/100, which is ${p.n}/${p.d} in simplest form.`],
      visual: null,
      distractors: D(ans, [[fr(pct, 10), "moves-the-decimal-one-place-too-few"], [fr(pct, 1000), "moves-the-decimal-one-place-too-many"], [fr(100 - pct, 100), "gives-the-chance-it-does-not-happen"], [fr(1, pct), "makes-the-percent-the-denominator"], [fr(pct), "forgets-to-convert"]], dm),
      hints: H("A probability written as a percent is a number out of 100.", to === "dec" ? "Divide the percent by 100." : "Write the percent over 100, then reduce the fraction."),
    };
  },
};

FAMILIES.probability = {
  title: "Probability",
  grades: [7],
  defaults: {},
  gen(rng, params, opts) {
    const level = opts.level;
    const t = pickType(rng, level, [prSimple, prCompound, prExperimental, prExpected, prConvert]);
    return done({ family: "probability", level, ...t.gen({ rng, level, ctx: opts.ctx }) });
  },
};

// ================================================================================================================ sampling
const POPS = [
  (n, k, N, ask) => ({ s: ST(`A random sample of ${n} students was asked how they get to school. ${k} of them walk. The school has ${num(N)} students.`, `${n} students were chosen at random and asked how they get to school. ${k} of them walk. The school has ${num(N)} students in all.`, `A random sample of ${n} students was surveyed about how they travel to school, and ${k} of them walk. The school has ${num(N)} students in total.`), what: "students at the school walk to school", doNot: "students at the school do not walk to school" }),
  (n, k, N) => ({ s: ST(`A farmer picks ${n} tomatoes at random. ${k} of them have spots. The farm picks ${num(N)} tomatoes in all.`, `A farmer chooses ${n} tomatoes at random from a harvest and finds spots on ${k} of them. The harvest has ${num(N)} tomatoes.`, `A farmer examines a random sample of ${n} tomatoes and finds spots on ${k} of them. The whole harvest is ${num(N)} tomatoes.`), what: "tomatoes in the harvest have spots", doNot: "tomatoes in the harvest do not have spots" }),
  (n, k, N) => ({ s: ST(`A library asks ${n} visitors at random if they borrowed a book. ${k} of them did. ${num(N)} people visited the library last month.`, `A library asks ${n} randomly chosen visitors if they borrowed a book. ${k} of them did. The library had ${num(N)} visitors last month.`, `A library surveys a random sample of ${n} visitors, and ${k} of them borrowed a book. The library had ${num(N)} visitors last month.`), what: "visitors borrowed a book last month", doNot: "visitors did not borrow a book last month" }),
  (n, k, N) => ({ s: ST(`A factory tests ${n} light bulbs picked at random. ${k} of them do not work. The factory made ${num(N)} bulbs today.`, `A factory tests ${n} light bulbs chosen at random and finds that ${k} of them do not work. The factory made ${num(N)} bulbs today.`, `A factory tests a random sample of ${n} light bulbs, and ${k} of them are defective. The factory produced ${num(N)} bulbs today.`), what: "of the bulbs made today are defective", doNot: "of the bulbs made today work" }),
];
const smEstimate = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const n = level === 1 ? rng.pick([20, 25, 50, 100]) : rng.pick([40, 50, 60, 80, 100, 120]);
    let k = rng.int(2, Math.floor(n * (level === 1 ? 0.6 : 0.8)));
    if (level === 1) k = Math.max(2, Math.round(k / 5) * 5 || 2);
    if (k >= n) k = n - 1;
    const unitN = n / gcdI(n, k);
    const N = unitN * rng.int(Math.ceil((level === 1 ? 200 : 400) / unitN), Math.ceil((level === 1 ? 900 : 1600) / unitN));
    const ask = level === 3 ? "no" : "yes";
    const t = rng.pick(POPS)(n, k, N);
    const ans = fr(ask === "yes" ? (N * k) / n : (N * (n - k)) / n);
    const askT = ask === "yes" ? ST(`About how many ${t.what}?`, `Use the sample to estimate how many ${t.what}.`, `Use the sample proportion to estimate how many ${t.what}.`) : ST(`About how many ${t.doNot}?`, `Use the sample to estimate how many ${t.doNot}.`, `Use the sample proportion to estimate how many ${t.doNot}.`);
    const fav = ask === "yes" ? k : n - k;
    const per = fr(fav, n);
    return {
      spec: { type: "estimate", n, k, N, ask },
      stem: t.s,
      ask: askT,
      expr: null,
      answer: A(ans),
      work: [`In the sample, ${fav} out of ${n} is the same as ${per.n}/${per.d}.`, `Use the same share for all ${num(N)}: ${E(`${num(N)} ${TIMES} ${fav}`, N * fav)}.`, `Divide by the sample size: ${E(`${N * fav} ${DIVIDE} ${n}`, (N * fav) / n)}.`],
      visual: { kind: "ratiotable", alt: `A ratio table: ${fav} out of ${n} in the sample goes with an unknown number out of ${N}.`, headers: ["Count in the sample", "Sample size"], rows: [[String(fav), String(n)], ["?", String(N)]], hide: [[1, 0]] },
      distractors: D(ans, [[fr(N + fav), "adds-the-sample-count"], [fr(N * fav), "forgets-to-divide-by-the-sample-size"], [fr(N * (ask === "yes" ? n - k : k), n), "uses-the-opposite-group"], [fr(N * n, fav), "inverts-the-sample-ratio"], [fr(N - fav), "subtracts-the-sample-count"]]),
      hints: H("A random sample is a small copy of the whole group, so the share in the sample is about the share in the whole group.", "Write the share found in the sample as a fraction, then take that same share of the whole group."),
    };
  },
};

const REP_METHODS = [
  { random: true, whole: true, txt: (N) => `She picks 30 names at random from the list of all ${N} students.`, why: "Every student had an equal chance of being picked." },
  { random: true, whole: true, txt: (N) => `She puts all ${N} student names in a hat and draws 30 names.`, why: "Every student had an equal chance of being picked." },
  { random: false, whole: true, txt: () => "She asks the first 30 students who walk into the gym.", why: "The students were not picked at random." },
  { random: false, whole: false, txt: () => "She asks 30 students on the basketball team.", why: "Students who are not on the team had no chance to be picked." },
  { random: false, whole: true, txt: () => "She posts the survey online and uses the first 30 answers.", why: "Only students who chose to answer were counted." },
  { random: true, whole: false, txt: () => "She picks 30 students at random from the seventh grade only.", why: "Students in other grades had no chance to be picked." },
];
const smRep = {
  lv: [1, 2],
  gen({ rng }) {
    const m = rng.pick(REP_METHODS);
    const N = rng.pick([300, 400, 500, 600, 800]);
    const rep = m.random && m.whole;
    const topic = rng.pick(["whether students want a later start time", "what kind of lunch students like best", "how many hours students sleep on school nights"]);
    return {
      spec: { type: "rep", random: m.random, whole: m.whole, n: 30, N },
      stem: ST(
        `A principal wants to know ${topic}. The school has ${N} students. ${m.txt(N)}`,
        `A principal wants to find out ${topic} for all ${N} students at the school. ${m.txt(N)}`,
        `A principal wishes to learn ${topic} among all ${N} students at the school. ${m.txt(N)}`,
      ),
      ask: ST("Is this sample a good copy of all the students?", "Is this sample representative of all the students?", "Is this sample representative of the population of all students?"),
      expr: null,
      answer: { value: rep ? "representative" : "not representative", kind: "text", text: rep ? `Representative. ${m.why}` : `Not representative. ${m.why}` },
      work: rep ? ["A representative sample gives every member of the group an equal chance of being picked.", `Here, ${m.why.toLowerCase()}`] : ["A representative sample gives every member of the group an equal chance of being picked.", `Here, ${m.why.toLowerCase()} So the sample is not representative.`],
      visual: null,
      distractors: dist(
        rep
          ? [["Not representative. Only 30 of the students were asked.", "small-share-means-biased"], ["Not representative. A sample must ask every student.", "only-asking-everyone-counts"], ["Not representative. A sample must have the same number of students from each grade.", "equal-numbers-from-each-group-needed"]]
          : [["Representative. Thirty students is a large enough sample.", "a-bigger-sample-fixes-bias"], ["Representative. The students who answer are the ones who care most.", "willing-students-are-representative"], ["Representative. All of the students go to the same school.", "same-school-means-representative"]],
      ),
      hints: H("A sample is useful for a whole group only if every member of the group had a fair chance to be in it.", "Ask how the 30 students were chosen, and whether any group of students was left out."),
    };
  },
};

const DATA_STORIES = [
  (n) => ST(`${n} students read these numbers of books last month:`, `${n} students read these numbers of books last month:`, `The numbers of books read last month by ${n} students are:`),
  (n) => ST(`A player scored these numbers of points in ${n} games:`, `A player scored these numbers of points in ${n} games:`, `A player's points in ${n} games were:`),
  (n) => ST(`A student practiced for these numbers of minutes on ${n} days:`, `A student practiced for these numbers of minutes on ${n} days:`, `The numbers of minutes a student practiced on ${n} days were:`),
  (n) => ST(`${n} bean plants grew these numbers of centimeters:`, `${n} bean plants grew these numbers of centimeters:`, `The growth, in centimeters, of ${n} bean plants was:`),
];
function dataset(rng, n, mean, spread = 6) {
  for (let t = 0; t < 5000; t++) {
    const dev = Array.from({ length: n - 1 }, () => rng.int(-spread, spread));
    const last = -dev.reduce((a, b) => a + b, 0);
    if (Math.abs(last) > spread + 3) continue;
    const vals = rng.shuffle([...dev, last]).map((d) => mean + d);
    if (vals.some((v) => v < 1) || new Set(vals).size < Math.min(n, 4)) continue;
    return vals;
  }
  return Array.from({ length: n }, (_, i) => mean + (i - (n - 1) / 2) * 2).map((v) => Math.round(v));
}
const sumAbs = (vals, m) => vals.reduce((a, v) => a + Math.abs(v - m), 0);
const median = (vals) => {
  const s = [...vals].sort((a, b) => a - b);
  const h = s.length >> 1;
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
};
const smMean = {
  lv: [1],
  gen({ rng }) {
    const n = rng.pick([5, 6, 8]);
    const mean = rng.int(8, 30);
    const vals = dataset(rng, n, mean, 5);
    const sum = vals.reduce((a, b) => a + b, 0);
    const st = rng.pick(DATA_STORIES)(n);
    const list = vals.join(", ");
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    return {
      spec: { type: "mean", vals },
      stem: ST(`${st.plain} ${list}.`, `${st.standard} ${list}.`, `${st.rich} ${list}.`),
      ask: ST("What is the mean?", "What is the mean of the data?", "Calculate the mean of the data."),
      expr: null,
      answer: A(fr(mean)),
      work: [`Add the values: ${chainSum(vals).join(", ")}.`, `Divide the sum by the number of values: ${sum} ${DIVIDE} ${n} = ${mean}.`],
      visual: { kind: "lineplot", alt: `A line plot of the values ${list}.`, min: Math.max(0, lo - 1), max: hi + 1, step: 1, values: vals, label: "Value" },
      distractors: D(fr(mean), [[fr(median(vals) * 2, 2), "uses-the-median"], [fr(sum), "forgets-to-divide"], [fr(sum, n + 1), "divides-by-the-wrong-count"], [fr(sum, n - 1), "divides-by-the-wrong-count"], [fr(hi - lo), "finds-the-range"]], true),
      hints: H("The mean is the amount each value would have if all the values were shared out equally.", "Add all the values, then divide by how many values there are."),
    };
  },
};

const smMad = {
  lv: [2, 3],
  gen({ rng, level }) {
    const n = level === 2 ? rng.pick([4, 5]) : rng.pick([5, 8]);
    const mean = rng.int(10, 30);
    const vals = dataset(rng, n, mean, 5);
    const S = sumAbs(vals, mean);
    const mad = fr(S, n);
    const st = rng.pick(DATA_STORIES)(n);
    const list = vals.join(", ");
    const dists = vals.map((v) => Math.abs(v - mean));
    const sum = vals.reduce((a, b) => a + b, 0);
    return {
      spec: { type: "mad", vals },
      stem: ST(`${st.plain} ${list}. The mean is ${mean}.`, `${st.standard} ${list}. The mean is ${mean}.`, `${st.rich} ${list}. The mean of the data is ${mean}.`),
      ask: ST("What is the mean absolute deviation (MAD)? It is the mean of the distances from the mean.", "What is the mean absolute deviation (MAD) of the data?", "Calculate the mean absolute deviation (MAD) of the data."),
      expr: null,
      answer: A(mad, { dec: true }),
      work: [`Find the distance of each value from ${mean}: ${dists.join(", ")}.`, `Add the distances: ${chainSum(dists).join(", ")}.`, `Divide by the number of values: ${S} ${DIVIDE} ${n} = ${T(mad, true)}.`],
      visual: { kind: "lineplot", alt: `A line plot of the values ${list}.`, min: Math.max(0, Math.min(...vals) - 1), max: Math.max(...vals) + 1, step: 1, values: vals, label: "Value" },
      distractors: D(mad, [[fr(S), "forgets-to-divide"], [fr(mean), "reports-the-mean"], [fr(0), "uses-signed-differences-that-cancel"], [fr(Math.max(...vals) - Math.min(...vals)), "finds-the-range"], [fr(S, n - 1), "divides-by-the-wrong-count"]], true),
      hints: H("The MAD tells how far the values typically are from the mean, ignoring whether they are above or below it.", "Find each distance from the mean as a positive number, add the distances, then divide by the number of values."),
    };
  },
};

const GROUPS = [["Class A", "Class B"], ["Team Red", "Team Blue"], ["Garden A", "Garden B"], ["Group A", "Group B"]];
const smDiff = {
  lv: [2, 3],
  gen({ rng, level }) {
    const stat = level === 2 ? "median" : rng.pick(["mean", "median", "mean"]);
    const [g1, g2] = rng.pick(GROUPS);
    const n = 5;
    let a;
    let b;
    let diff;
    for (let t = 0; t < 400; t++) {
      const mA = rng.int(14, 34);
      const mB = rng.int(8, 30);
      a = dataset(rng, n, mA, 5);
      b = dataset(rng, n, mB, 5);
      const sa = stat === "mean" ? mA : median(a);
      const sb = stat === "mean" ? mB : median(b);
      diff = sa - sb;
      if (diff > 0 && diff <= 20) break;
    }
    const la = a.join(", ");
    const lb = b.join(", ");
    const other = stat === "mean" ? median(a) - median(b) : a.reduce((x, y) => x + y, 0) / n - b.reduce((x, y) => x + y, 0) / n;
    const stT = stat === "mean" ? "mean" : "median";
    const sa = stat === "mean" ? a.reduce((x, y) => x + y, 0) / n : median(a);
    const sb = stat === "mean" ? b.reduce((x, y) => x + y, 0) / n : median(b);
    const sorted = (arr) => [...arr].sort((x, y) => x - y).join(", ");
    return {
      spec: { type: "diffcent", a, b, stat },
      stem: ST(`${g1} scores: ${la}. ${g2} scores: ${lb}.`, `${g1} has these scores: ${la}. ${g2} has these scores: ${lb}.`, `The scores for ${g1} are ${la}. The scores for ${g2} are ${lb}.`),
      ask: ST(`How much greater is the ${stT} of ${g1} than the ${stT} of ${g2}?`, `What is the difference between the ${stT} of ${g1} and the ${stT} of ${g2}?`, `Determine by how much the ${stT} of ${g1} exceeds the ${stT} of ${g2}.`),
      expr: null,
      answer: A(fr(diff), { dec: true }),
      work: stat === "mean" ? [`${g1}: ${chainSum(a).join(", ")}, so the mean is ${a.reduce((x, y) => x + y, 0)} ${DIVIDE} ${n} = ${sa}.`, `${g2}: ${chainSum(b).join(", ")}, so the mean is ${b.reduce((x, y) => x + y, 0)} ${DIVIDE} ${n} = ${sb}.`, `Subtract: ${sa} ${MINUS} ${sb} = ${diff}.`] : [`Put each set in order. ${g1}: ${sorted(a)}. ${g2}: ${sorted(b)}.`, `The middle value of ${g1} is ${sa}. The middle value of ${g2} is ${sb}.`, `Subtract: ${sa} ${MINUS} ${sb} = ${diff}.`],
      visual: null,
      distractors: D(fr(diff), [[Math.round(other) > 0 ? fr(Math.round(other)) : null, "compares-the-wrong-center"], [fr(sa + sb), "adds-the-centers"], [fr(Math.max(...a) - Math.max(...b)), "compares-the-greatest-values"], [fr(Math.abs(Math.max(...a) - Math.min(...a) - (Math.max(...b) - Math.min(...b)))), "compares-the-ranges"], [fr(a[0] - b[0]), "compares-the-first-values"]], true),
      hints: H(`A ${stT} is one number that describes the center of a set, so compare the centers by subtracting them.`, stat === "mean" ? "Find the mean of each set by adding and dividing, then subtract." : "Put each set in order and find the middle value, then subtract."),
    };
  },
};

const smTimesMad = {
  lv: [3],
  gen({ rng }) {
    const [g1, g2] = rng.pick(GROUPS);
    const n = 5;
    let a;
    let b;
    let sft;
    let S;
    let ratio;
    for (let t = 0; t < 2000; t++) {
      const mean = rng.int(20, 40);
      a = dataset(rng, n, mean, 4);
      S = sumAbs(a, mean);
      if (S === 0) continue;
      sft = rng.int(2, 12);
      ratio = fr(sft * n, S);
      if (isTerm(ratio) && ratio.d <= 2 && sft * 1 < mean - 6) break;
      ratio = null;
    }
    if (!ratio) {
      a = [20, 22, 24, 26, 28];
      S = 12;
      sft = 6;
      ratio = fr(30, 12);
    }
    b = a.map((v) => v - sft);
    const mad = fr(S, n);
    return {
      spec: { type: "times-mad", a, b },
      stem: ST(`${g1} scores: ${a.join(", ")}. ${g2} scores: ${b.join(", ")}. The two sets have the same MAD.`, `${g1} has these scores: ${a.join(", ")}. ${g2} has these scores: ${b.join(", ")}. Both sets have the same mean absolute deviation (MAD).`, `The scores for ${g1} are ${a.join(", ")}. The scores for ${g2} are ${b.join(", ")}. The two sets have the same mean absolute deviation (MAD).`),
      ask: ST("The means are different. The difference of the means is how many times the MAD?", "The difference between the two means is how many times the MAD?", "Express the difference between the two means as a multiple of the MAD."),
      expr: null,
      answer: A(ratio, { dec: true }),
      work: [`Mean of ${g1}: ${a.reduce((x, y) => x + y, 0)} ${DIVIDE} ${n} = ${a.reduce((x, y) => x + y, 0) / n}.`, `Mean of ${g2}: ${b.reduce((x, y) => x + y, 0)} ${DIVIDE} ${n} = ${b.reduce((x, y) => x + y, 0) / n}.`, `Difference of the means: ${a.reduce((x, y) => x + y, 0) / n} ${MINUS} ${b.reduce((x, y) => x + y, 0) / n} = ${sft}.`, `The MAD of each set is ${S} ${DIVIDE} ${n} = ${T(mad, true)}.`, `${sft} ${DIVIDE} ${T(mad, true)} = ${T(ratio, true)}.`],
      visual: null,
      distractors: D(ratio, [[fr(sft), "forgets-to-divide-by-the-MAD"], [mad, "reports-the-MAD"], [mad.mul(fr(sft)), "multiplies-instead-of-dividing"], [fr(sft, S), "divides-by-the-sum-of-the-distances"], [fr(S, sft), "divides-in-the-wrong-order"]], true),
      hints: H("To compare how far apart two centers are, measure the gap in units of the typical spread.", "Find the difference of the means and the MAD, then divide the difference by the MAD."),
    };
  },
};

FAMILIES.sampling = {
  title: "Sampling and statistical inference",
  grades: [7],
  defaults: {},
  gen(rng, params, opts) {
    const level = opts.level;
    const t = pickType(rng, level, [smEstimate, smRep, smMean, smMad, smDiff, smTimesMad]);
    return done({ family: "sampling", level, ...t.gen({ rng, level, ctx: opts.ctx }) });
  },
};

// ================================================================================================================ linear equations
/** A side of an equation is a list of terms k(mx + c). The solver expands them exactly. */
const term = (k, m, c) => ({ k: typeof k === "number" ? fr(k) : k, m: typeof m === "number" ? fr(m) : m, c: typeof c === "number" ? fr(c) : c });
const expandSide = (terms) => terms.reduce((acc, t) => ({ m: acc.m.add(t.k.mul(t.m)), c: acc.c.add(t.k.mul(t.c)) }), { m: fr(0), c: fr(0) });
const termStr = ({ k, m, c }) => {
  if (m.n === 0) return T(k.mul(c));
  if (eqF(k, fr(1))) return linText(m, c);
  return `${T(k)}(${linText(m, c)})`;
};
const sideStr = (terms) => terms.map(termStr).reduce((acc, s, i) => (i === 0 ? s : s.startsWith(MINUS) ? `${acc} ${MINUS} ${s.slice(1)}` : `${acc} + ${s}`), "");
const specSide = (terms) => terms.map((t) => ({ k: S(t.k), m: S(t.m), c: S(t.c) }));
const solveX = (m1, c1, m2, c2) => (eqF(m1, m2) ? null : c2.sub(c1).div(m1.sub(m2)));
const nz = (rng, lo, hi, not = []) => {
  let v;
  do v = rng.int(lo, hi);
  while (v === 0 || not.includes(v));
  return v;
};

function genSolveForms(rng, level) {
  for (let tries = 0; tries < 4000; tries++) {
    let L;
    let Rr;
    if (level === 1) {
      const c = rng.int(1, 6);
      const a = c + rng.int(1, 5);
      const x0 = rng.int(1, 9);
      const b = rng.int(1, 9);
      L = [term(1, a, b)];
      Rr = [term(1, c, (a - c) * x0 + b)];
    } else {
      const style = level === 2 ? rng.pick(["neg", "neg", "dist", "dist"]) : rng.pick(["frac", "frac", "dist2", "dist2", "negdist"]);
      if (style === "neg") {
        const a = nz(rng, -6, 9);
        const c = nz(rng, -6, 9, [a]);
        L = [term(1, a, nz(rng, -12, 12))];
        Rr = [term(1, c, rng.int(-12, 12))];
      } else if (style === "dist") {
        const k = rng.int(2, 6);
        const c = nz(rng, -3, 5, [k]);
        L = [term(k, 1, nz(rng, -6, 6))];
        Rr = [term(1, c, rng.int(-20, 20))];
      } else if (style === "negdist") {
        const k = -rng.int(2, 5);
        const c = nz(rng, -4, 6, [k]);
        L = [term(k, 1, nz(rng, -6, 6))];
        Rr = [term(1, c, rng.int(-20, 20))];
      } else if (style === "frac") {
        const den = [2, 3, 4, 5];
        const a = fr(nz(rng, -5, 7), rng.pick(den));
        const c = fr(nz(rng, -5, 7), rng.pick(den));
        if (a.d === 1 && c.d === 1) continue;
        L = [term(1, a, nz(rng, -9, 9))];
        Rr = [term(1, c, rng.int(-9, 9))];
      } else {
        const k1 = rng.int(2, 5);
        const e = nz(rng, -3, 4);
        const k2 = rng.int(2, 5);
        L = [term(k1, 1, nz(rng, -5, 5)), term(1, e, 0)];
        Rr = [term(k2, 1, nz(rng, -5, 5))];
      }
    }
    const l = expandSide(L);
    const r = expandSide(Rr);
    const x = solveX(l.m, l.c, r.m, r.c);
    if (!x) continue;
    if (level === 1) return { L, R: Rr, x };
    const smallDen = x.d === 1 || (level === 3 && x.d <= 4);
    if (!smallDen || Math.abs(x.n / x.d) > 12 || x.n === 0) continue;
    if (L.every((t) => t.m.n === 0) || Math.abs(l.c.n / l.c.d) > 40 || Math.abs(r.c.n / r.c.d) > 40) continue;
    return { L, R: Rr, x };
  }
  throw new Error("could not build a linear equation");
}

function opText(v, word) {
  // "Subtract 2x" / "Add 2x" for a term (positive or negative) taken from a side.
  return v.n > 0 ? `Subtract ${word(v)} from both sides` : `Add ${word(negF(v))} to both sides`;
}

const lnSolve = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const { L, R: Rr, x } = genSolveForms(rng, level);
    const l = expandSide(L);
    const r = expandSide(Rr);
    const eq = `${sideStr(L)} = ${sideStr(Rr)}`;
    const dM = l.m.sub(r.m);
    const dC = r.c.sub(l.c);
    const needExpand = L.concat(Rr).some((t) => !eqF(t.k, fr(1)) || t.m.n === 0) || L.length > 1;
    const work = [];
    if (needExpand) work.push(`Expand and combine like terms. Left side: ${linText(l.m, l.c)}. Right side: ${linText(r.m, r.c)}.`);
    if (r.m.n !== 0) {
      work.push(`${opText(r.m, (v) => mx(v))}: ${linText(dM, l.c)} = ${T(r.c)}.`);
    }
    if (l.c.n !== 0) {
      work.push(`${l.c.n > 0 ? `Subtract ${T(l.c)}` : `Add ${T(negF(l.c))}`} ${l.c.n > 0 ? "from" : "to"} both sides: ${mx(dM)} = ${T(dC)}.`);
    }
    work.push(eqF(dM, fr(1)) ? `So x = ${T(x)}.` : `Divide both sides by ${T(dM)}: ${E(`${pf(dC)} ${DIVIDE} ${pf(dM)}`, x)}.`);
    const wrongs = [
      [solveX(l.m, negF(l.c), r.m, r.c), "adds-the-constants-instead-of-subtracting"],
      [solveX(l.m, l.c, negF(r.m), r.c), "adds-the-x-terms-instead-of-subtracting"],
      [x.mul(fr(-1)), "moves-terms-across-with-the-wrong-sign"],
      [L.some((t) => !eqF(t.k, fr(1))) ? solveX(L.reduce((acc, t) => acc.add(t.k.mul(t.m)), fr(0)), L.reduce((acc, t) => acc.add(t.c), fr(0)), r.m, r.c) : null, "forgets-to-distribute-to-every-term"],
      [dC, "forgets-to-divide-by-the-coefficient"],
    ];
    return {
      spec: { type: "solve", mode: "", L: specSide(L), R: specSide(Rr) },
      stem: ST(`Look at this equation: ${eq}.`, `Consider the equation ${eq}.`, `The equation ${eq} is given.`),
      ask: ST("What is x?", "Solve the equation for x.", "Determine the value of x that satisfies the equation."),
      expr: eq,
      answer: A(x),
      work,
      visual: null,
      distractors: D(x, wrongs.map(([v, t]) => [v && (v.d === 1 || v.d <= 6) ? v : null, t]), false),
      hints: H("Both sides of an equation stay balanced when you do the same thing to each side.", "Expand any parentheses, collect the x terms on one side and the numbers on the other, then divide by the coefficient of x."),
    };
  },
};

const NSOL = { one: "one solution", none: "no solution", many: "infinitely many solutions" };
const lnCount = {
  lv: [2, 3],
  gen({ rng, level }) {
    const kind = rng.pick(["one", "none", "many", "none", "many", "one"]);
    let L = [term(2, 1, 3)];
    let Rr = [term(1, 3, 5)];
    for (let t = 0; t < 500; t++) {
      const k = rng.int(2, 6);
      const p = nz(rng, -6, 6);
      const lt = level === 2 ? [term(k, 1, p)] : rng.chance(0.5) ? [term(k, 1, p), term(1, nz(rng, -3, 4), 0)] : [term(1, nz(rng, 2, 8), nz(rng, -8, 8))];
      const l = expandSide(lt);
      let mR;
      let cR;
      if (kind === "one") {
        mR = fr(nz(rng, -6, 9, [Number(l.m.n / l.m.d)]));
        cR = fr(rng.int(-12, 12));
      } else if (kind === "none") {
        mR = l.m;
        cR = l.c.add(fr(nz(rng, -8, 8)));
      } else {
        mR = l.m;
        cR = l.c;
      }
      // write the right side in a different shape from the expanded form so the student must work
      let rt;
      if (kind !== "one" && mR.d === 1 && rng.chance(0.6)) {
        const j = [2, 3].find((d) => mR.n % d === 0 && cR.n % d === 0 && d !== Math.abs(mR.n)) || null;
        rt = j ? [term(j, fr(mR.n, j), fr(cR.n, j))] : [term(1, mR, cR)];
      } else rt = [term(1, mR, cR)];
      if (lt.length === 1 && lt[0].k.d === 1 && sideStr(lt) === sideStr(rt)) continue;
      L = lt;
      Rr = rt;
      break;
    }
    const l = expandSide(L);
    const r = expandSide(Rr);
    const eq = `${sideStr(L)} = ${sideStr(Rr)}`;
    const real = eqF(l.m, r.m) ? (eqF(l.c, r.c) ? "many" : "none") : "one";
    const ans = NSOL[real];
    const tags = { one: "thinks-every-equation-has-one-solution", none: real === "one" ? "stops-early-and-calls-it-no-solution" : "calls-a-true-statement-no-solution", many: real === "one" ? "thinks-matching-terms-mean-every-x-works" : "calls-a-false-statement-true-for-every-x" };
    const pool = [[NSOL.one, tags.one], [NSOL.none, tags.none], [NSOL.many, tags.many], ["two solutions", "thinks-two-sides-give-two-solutions"]].filter(([t]) => t !== ans);
    const lt = linText(l.m, l.c);
    const rtT = linText(r.m, r.c);
    return {
      spec: { type: "count", mode: "", L: specSide(L), R: specSide(Rr) },
      stem: ST(`Look at this equation: ${eq}.`, `Consider the equation ${eq}.`, `The equation ${eq} is given.`),
      ask: ST("How many solutions does it have?", "How many solutions does the equation have?", "Determine the number of solutions of the equation."),
      expr: eq,
      answer: { value: ans, kind: "text" },
      work: [`Expand and combine like terms. Left side: ${lt}. Right side: ${rtT}.`, real === "one" ? "The x terms are different, so there is exactly one value of x that works." : real === "none" ? "The x terms are the same on both sides, but the numbers are different. Subtracting the x terms leaves a false statement, so no value of x works." : "Both sides are exactly the same expression. Subtracting the x terms leaves a true statement, so every value of x works."],
      visual: null,
      distractors: pool.slice(0, 3).map(([text, misconception]) => ({ text, misconception })),
      hints: H("Think about what is left when you take the x terms from both sides: a statement that is true, false, or still has x in it.", "Expand and combine like terms on each side. Then compare the two sides: same x terms and same numbers, same x terms but different numbers, or different x terms."),
    };
  },
};

// ---- modeling: y = mx + b
/** Canonical text of y = mx + b (ASCII signs, decimals when they terminate, (n/d)x otherwise). The solvers build the same string. */
const eqStr = (m, b) => {
  const mp = eqF(m, fr(1)) ? "x" : eqF(m, fr(-1)) ? "-x" : m.d === 1 ? `${m.n}x` : decOf(m) ? `${decOf(m)}x` : `(${m.n}/${m.d})x`;
  const ab = absF(b);
  const bp = b.n === 0 ? "" : ` ${b.n > 0 ? "+" : "-"} ${ab.d === 1 ? ab.n : decOf(ab) || `${ab.n}/${ab.d}`}`;
  return `y = ${mp}${bp}`;
};
const lnModel = {
  lv: [1, 2, 3],
  gen({ rng, level, ctx, name }) {
    const grows = level === 1 ? true : rng.chance(0.6);
    const sc = modelOf(rng, ctx, grows);
    let m;
    let b;
    let find;
    let g;
    let x0;
    const unitsOf = (f) => qty(f, sc.y, true);
    if (level === 1) {
      m = fr(rng.int(2, 9));
      b = fr(rng.int(3, 30));
      find = rng.chance(0.2) ? "eq" : "y";
      x0 = rng.int(2, 8);
    } else if (level === 2) {
      m = grows ? rng.pick([fr(5, 2), fr(3, 2), fr(7, 2), fr(3, 4), fr(9, 2), fr(4), fr(6)]) : fr(-rng.pick([2, 3, 4, 5, 6]));
      b = grows ? fr(rng.int(2, 40)) : fr(rng.int(40, 90));
      find = rng.pick(["y", "eq", "y"]);
      x0 = rng.int(2, 9);
    } else {
      m = grows ? rng.pick([fr(5, 2), fr(3, 2), fr(7, 4), fr(9, 4), fr(3, 5), fr(6, 5), fr(7, 2)]) : fr(-rng.pick([2, 3, 4, 5, 6, 8])).add(fr(rng.pick([0, 0, 1, 0]), 2));
      b = grows ? fr(rng.int(5, 60)) : fr(rng.int(60, 120));
      find = rng.pick(["x", "x", "y", "eq"]);
      x0 = rng.int(3, 12);
    }
    if (!grows) {
      const maxX = Math.floor((b.n / b.d - 1) / Math.abs(m.n / m.d));
      x0 = Math.min(x0, Math.max(maxX, 2));
    }
    const yAt = m.mul(fr(x0)).add(b);
    const amt = absF(m);
    const move = grows ? "goes up" : "goes down";
    const what = sc.what;
    const inU = /^number of/.test(what) ? "" : `, in ${sc.y[1]}`;
    const stem = ST(
      `${name} tracks the ${what}. At the start, it is ${unitsOf(b)}. Each ${sc.x[0]}, it ${move} by ${unitsOf(amt)}. Let x be the number of ${sc.x[1]} and y be the ${what}${inU}.`,
      `The ${what} starts at ${unitsOf(b)}, and each ${sc.x[0]} it ${move} by ${unitsOf(amt)}. Let x be the number of ${sc.x[1]} and let y be the ${what}${inU}.`,
      `The ${what} is ${unitsOf(b)} at the start and ${grows ? "increases" : "decreases"} by ${unitsOf(amt)} each ${sc.x[0]}. Let x represent the number of ${sc.x[1]} and y represent the ${what}${inU}.`,
    );
    const mT = T(m, true);
    const bT = T(b, true);
    if (find === "eq") {
      const ans = eqStr(m, b);
      const cands = [eqStr(b, m), grows ? eqStr(negF(m), b) : eqStr(amt, b), eqStr(m, negF(b)), eqStr(m.add(b), fr(0))];
      const tagsEq = ["swaps-the-rate-and-the-starting-amount", grows ? "gets-the-sign-of-the-rate-wrong" : "ignores-that-the-amount-goes-down", "gets-the-sign-of-the-starting-amount-wrong", "adds-the-rate-and-the-starting-amount"];
      const eqD = [];
      cands.forEach((t, i) => {
        if (t !== ans && !eqD.some((d) => d[0] === t)) eqD.push([t, tagsEq[i]]);
      });
      return {
        spec: { type: "model", mode: "model", m: S(m), b: S(b), find: "eq" },
        stem,
        ask: ST("Write an equation for y in terms of x.", "Write an equation in the form y = mx + b that models this situation.", "Write a linear equation in the form y = mx + b that models this situation."),
        expr: null,
        answer: { value: ans, kind: "text" },
        work: [`The starting amount is the number added: b = ${bT}.`, `The change for each ${sc.x[0]} is ${grows ? "added" : "subtracted"}, so m = ${mT}.`, `Put them in y = mx + b: ${ans}.`],
        visual: null,
        distractors: dist(eqD.slice(0, 3)),
        hints: H("In y = mx + b, m is how much y changes for each 1 of x, and b is the value of y when x is 0.", "Find the starting amount and the change per step, and watch whether the change goes up or down."),
      };
    }
    if (find === "y") {
      return {
        spec: { type: "model", mode: "model", m: S(m), b: S(b), find: "y", given: String(x0) },
        stem,
        ask: ST(`What is the ${what} after ${x0} ${sc.x[1]}?`, `What is the ${what} after ${x0} ${sc.x[1]}?`, `Determine the ${what} after ${x0} ${sc.x[1]}.`),
        expr: `y = ${linText(m, b, true)}`,
        answer: A(yAt, { dec: true, unit: sc.y[1] }),
        work: [`The equation is y = ${linText(m, b, true)}.`, E(`${mT} ${TIMES} ${x0}`, m.mul(fr(x0)), true) + ".", m.mul(fr(x0)).n >= 0 ? E(`${T(m.mul(fr(x0)), true)} + ${bT}`, yAt, true) + "." : E(`${bT} ${MINUS} ${T(absF(m.mul(fr(x0))), true)}`, yAt, true) + "."],
        visual: null,
        distractors: D(yAt, [[m.add(b), "adds-the-rate-and-the-start"], [m.mul(fr(x0)), "forgets-the-starting-amount"], [b.mul(fr(x0)).add(m), "swaps-the-rate-and-the-start"], [grows ? b.sub(m.mul(fr(x0))) : b.add(amt.mul(fr(x0))), grows ? "subtracts-the-change" : "adds-instead-of-subtracting-the-decrease"]], true),
        hints: H("Each step changes the amount by the same number, starting from the starting amount.", "Multiply the change per step by the number of steps, then combine it with the starting amount."),
      };
    }
    const yT = T(yAt, true);
    return {
      spec: { type: "model", mode: "model", m: S(m), b: S(b), find: "x", given: S(yAt) },
      stem,
      ask: ST(`After how many ${sc.x[1]} is the ${what} ${yT} ${sc.y[1]}?`, `After how many ${sc.x[1]} is the ${what} ${yT} ${sc.y[1]}?`, `Determine after how many ${sc.x[1]} the ${what} is ${yT} ${sc.y[1]}.`),
      expr: `y = ${linText(m, b, true)}`,
      answer: A(fr(x0), { unit: sc.x[1] }),
      work: [`Set y = ${yT} in y = ${linText(m, b, true)}.`, `Subtract ${bT} from both sides: ${E(`${yT} ${MINUS} ${bT}`, yAt.sub(b), true)}.`, `Divide both sides by ${T(m, true)}: ${E(`${T(yAt.sub(b), true)} ${DIVIDE} ${T(m, true)}`, fr(x0))}.`],
      visual: null,
      distractors: D(fr(x0), [[yAt.add(b).div(m), "adds-the-starting-amount-instead-of-subtracting"], [yAt.div(m), "ignores-the-starting-amount"], [yAt.sub(b), "forgets-to-divide-by-the-rate"], [yAt.mul(m), "multiplies-instead-of-dividing"]], true),
      hints: H("Work backward: undo the starting amount first, then undo the change per step.", "Subtract the starting amount from the target amount, then divide by the change per step."),
    };
  },
};

FAMILIES.linear = {
  title: "Linear equations and modeling",
  grades: [8],
  defaults: { mode: "" },
  gen(rng, params, opts) {
    const level = opts.level;
    const mode = params.mode || "";
    const name = rng.pick(NAMES);
    const types = mode === "model" ? [lnModel] : [lnSolve, lnSolve, lnCount];
    const t = pickType(rng, level, types);
    return done({ family: "linear", level, ...t.gen({ rng, level, ctx: opts.ctx, name }) });
  },
  check: modeCheck(""),
};

// ================================================================================================================ systems of equations
const coefTxt = (c, v) => (c === 1 ? v : c === -1 ? `${MINUS}${v}` : `${num(c)}${v}`);
/** "ax + by = c" with typographic signs (a or b may be 0). */
function stdEq(a, b, c) {
  const parts = [];
  if (a !== 0) parts.push([a, "x"]);
  if (b !== 0) parts.push([b, "y"]);
  const lhs = parts
    .map(([co, v], i) => {
      const t = coefTxt(Math.abs(co), v);
      return i === 0 ? (co < 0 ? `${MINUS}${t}` : t) : `${co < 0 ? MINUS : "+"} ${t}`;
    })
    .join(" ");
  return `${lhs} = ${num(c)}`;
}
/** "mV + k" in a named variable, integers. */
const linInt = (m, k, v) => `${m === 0 ? "" : coefTxt(m, v)}${k === 0 ? (m === 0 ? "0" : "") : m === 0 ? num(k) : ` ${k < 0 ? MINUS : "+"} ${num(Math.abs(k))}`}`;
/** Calculations with negative numbers in brackets, so "(−5) + 8" is never read as "5 + 8". */
const sumTxt = (p, q) => `${par(num(p))} + ${par(num(q))}`;
const subTxt = (p, q) => `${par(num(p))} ${MINUS} ${par(num(q))}`;
const mulTxt = (p, q) => `${par(num(p))} ${TIMES} ${par(num(q))}`;
const divTxt = (p, q) => `${par(num(p))} ${DIVIDE} ${par(num(q))}`;
/** "Divide both sides by q: p ÷ q = res", or just the result when q is 1. */
const divStep = (v, p, q, res) => (q === 1 ? `So ${v} = ${num(res)}.` : `Divide both sides by ${num(q)}: ${E(divTxt(p, q), res)}.`);
const pairStr = (x, y) => `(${x},${y})`;
function pairDist(x0, y0) {
  const ans = pairStr(x0, y0);
  const cands = [
    [pairStr(y0, x0), "swaps-x-and-y"],
    [pairStr(-x0, y0), "makes-a-sign-error-on-x"],
    [pairStr(x0, -y0), "makes-a-sign-error-on-y"],
    [pairStr(x0, x0), "stops-after-finding-x-and-reuses-it-for-y"],
    [pairStr(y0, y0), "stops-after-finding-y-and-reuses-it-for-x"],
    [pairStr(x0 + 1, y0), "arithmetic-slip-in-x"],
    [pairStr(x0, y0 + 1), "arithmetic-slip-in-y"],
  ];
  return DS(ans, cands.map(([t, m]) => [t, m]));
}
const sysSpec = (e1, e2) => ({ eqs: [e1, e2] });
const sysHints = H("The solution of a system is the pair (x, y) that makes both equations true at the same time.", "Remove one variable first, solve for the other, then put that value back into an equation to find the second variable.");
const NSOLS = { one: "one solution", none: "no solution", many: "infinitely many solutions" };

/** Shared work lines for "solve a linear equation lside = rside" (used by systems word problems). */
function solveLines(l, r, x) {
  const dM = l.m.sub(r.m);
  const dC = r.c.sub(l.c);
  const w = [];
  if (r.m.n !== 0) w.push(`${opText(r.m, (v) => mx(v))}: ${linText(dM, l.c)} = ${T(r.c)}.`);
  if (l.c.n !== 0) w.push(`${l.c.n > 0 ? `Subtract ${T(l.c)}` : `Add ${T(negF(l.c))}`} ${l.c.n > 0 ? "from" : "to"} both sides: ${mx(dM)} = ${T(dC)}.`);
  w.push(eqF(dM, fr(1)) ? `So x = ${T(x)}.` : `Divide both sides by ${T(dM)}: ${E(`${pf(dC)} ${DIVIDE} ${pf(dM)}`, x)}.`);
  return w;
}

const sySub = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    let P;
    let Q;
    let Q0;
    let P0;
    let m;
    let k;
    let pc;
    let qc;
    for (let t = 0; t < 4000; t++) {
      P = level === 1 || rng.chance(0.65) ? "y" : "x";
      Q = P === "y" ? "x" : "y";
      if (level === 1) {
        Q0 = rng.int(1, 6);
        m = rng.int(1, 4);
        k = rng.int(1, 9);
        pc = 1;
        qc = rng.int(1, 4);
      } else {
        Q0 = nz(rng, -6, 8);
        m = nz(rng, -4, 5);
        k = nz(rng, -9, 9);
        pc = rng.pick([1, 1, 2, 3, -1, -2]);
        qc = nz(rng, -5, 5);
      }
      P0 = m * Q0 + k;
      if (pc * m + qc === 0 || Math.abs(P0) > (level === 3 ? 60 : 35) || (level === 1 && P0 < 1)) continue;
      if (level === 3 && Math.abs(Q0) < 3) continue;
      break;
    }
    const c = pc * P0 + qc * Q0;
    const e1 = P === "y" ? { a: -m, b: 1, c: k } : { a: 1, b: -m, c: k };
    const e2 = P === "y" ? { a: qc, b: pc, c } : { a: pc, b: qc, c };
    const x0 = P === "y" ? Q0 : P0;
    const y0 = P === "y" ? P0 : Q0;
    const rhs = linInt(m, k, Q);
    const eq1 = `${P} = ${rhs}`;
    const eq2 = stdEq(e2.a, e2.b, e2.c);
    const cm = pc * m + qc;
    const cc = pc * k;
    return {
      spec: { type: "sub", ...sysSpec(e1, e2) },
      stem: ST(`Here are two equations: ${eq1} and ${eq2}. One is already solved for ${P}.`, `Consider the system ${eq1} and ${eq2}.`, `The system of equations ${eq1} and ${eq2} is given.`),
      ask: ST("What is the solution? Write it as (x,y).", "Solve the system by substitution. Write the solution as (x,y).", "Solve the system by substitution. Express the solution as an ordered pair (x,y)."),
      expr: null,
      answer: { value: pairStr(x0, y0), kind: "pair" },
      work: [
        `Put ${rhs} in place of ${P} in the second equation.`,
        `Combine like terms: ${linInt(cm, cc, Q)} = ${num(c)}.`,
        ...(cc !== 0 ? [`${cc > 0 ? `Subtract ${num(cc)}` : `Add ${num(-cc)}`} ${cc > 0 ? "from" : "to"} both sides: ${coefTxt(cm, Q)} = ${num(c - cc)}.`] : []),
        divStep(Q, c - cc, cm, Q0),
        `Now find ${P}: ${E(mulTxt(m, Q0), m * Q0)}, and ${E(sumTxt(m * Q0, k), P0)}.`,
        `The solution is x = ${num(x0)} and y = ${num(y0)}.`,
      ],
      visual: null,
      distractors: pairDist(x0, y0),
      hints: sysHints,
    };
  },
};

const syElim = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    let e1;
    let e2;
    let x0;
    let y0;
    let mode;
    for (let t = 0; t < 4000; t++) {
      x0 = level === 1 ? rng.int(1, 8) : nz(rng, -6, 8);
      y0 = level === 1 ? rng.int(1, 8) : nz(rng, -6, 8);
      if (level === 1) {
        mode = "add";
        const b = rng.int(1, 4);
        const a1 = rng.int(1, 4);
        const a2 = rng.int(1, 4);
        e1 = { a: a1, b, c: a1 * x0 + b * y0 };
        e2 = { a: a2, b: -b, c: a2 * x0 - b * y0 };
      } else if (level === 2) {
        mode = "subtract";
        const a = rng.int(1, 5);
        const b1 = nz(rng, -5, 5);
        const b2 = nz(rng, -5, 5, [b1]);
        e1 = { a, b: b1, c: a * x0 + b1 * y0 };
        e2 = { a, b: b2, c: a * x0 + b2 * y0 };
      } else {
        mode = "scale";
        const a1 = rng.int(1, 3);
        const kk = rng.int(2, 3);
        const b1 = nz(rng, -4, 4);
        const b2 = nz(rng, -5, 5, [kk * b1]);
        e1 = { a: a1, b: b1, c: a1 * x0 + b1 * y0 };
        e2 = { a: kk * a1, b: b2, c: kk * a1 * x0 + b2 * y0 };
        e2.k = kk;
      }
      if (Math.abs(e1.c) <= 60 && Math.abs(e2.c) <= 60) break;
    }
    const kk = e2.k || 1;
    const E2 = { a: e2.a, b: e2.b, c: e2.c };
    const t1 = stdEq(e1.a, e1.b, e1.c);
    const t2 = stdEq(E2.a, E2.b, E2.c);
    const work = [];
    if (mode === "add") {
      work.push(`The y terms are opposites, so add the equations: ${stdEq(e1.a + E2.a, 0, e1.c + E2.c)}.`);
      work.push(divStep("x", e1.c + E2.c, e1.a + E2.a, x0));
      work.push(`Put x = ${num(x0)} in the first equation: ${E(mulTxt(e1.a, x0), e1.a * x0)}, and ${E(subTxt(e1.c, e1.a * x0), e1.c - e1.a * x0)}, so ${stdEq(0, e1.b, e1.c - e1.a * x0)}.`);
      work.push(divStep("y", e1.c - e1.a * x0, e1.b, y0));
    } else {
      let top = e1;
      if (mode === "scale") {
        top = { a: e1.a * kk, b: e1.b * kk, c: e1.c * kk };
        work.push(`Multiply the first equation by ${kk}: ${stdEq(top.a, top.b, top.c)}. Now both equations have ${num(top.a)}x.`);
      }
      const db = top.b - E2.b;
      const dc = top.c - E2.c;
      work.push(`Subtract the second equation from the ${mode === "scale" ? "new first" : "first"} equation. The x terms cancel: ${stdEq(0, db, dc)}.`);
      work.push(divStep("y", dc, db, y0));
      work.push(`Put y = ${num(y0)} in the first equation: ${E(mulTxt(e1.b, y0), e1.b * y0)}, and ${E(subTxt(e1.c, e1.b * y0), e1.c - e1.b * y0)}, so ${stdEq(e1.a, 0, e1.c - e1.b * y0)}.`);
      work.push(divStep("x", e1.c - e1.b * y0, e1.a, x0));
    }
    const how = mode === "add" ? "Solve by adding the equations." : mode === "subtract" ? "Solve by subtracting the equations." : "Solve by elimination.";
    return {
      spec: { type: "elim", ...sysSpec(e1, { a: E2.a, b: E2.b, c: E2.c }) },
      stem: ST(`Here are two equations: ${t1} and ${t2}.`, `Consider the system ${t1} and ${t2}.`, `The system of equations ${t1} and ${t2} is given.`),
      ask: ST(`${how} Write the solution as (x,y).`, `Solve the system by elimination. Write the solution as (x,y).`, `Solve the system by elimination. Express the solution as an ordered pair (x,y).`),
      expr: null,
      answer: { value: pairStr(x0, y0), kind: "pair" },
      work,
      visual: null,
      distractors: pairDist(x0, y0),
      hints: sysHints,
    };
  },
};

const sheetBox = (x0, y0, lines) => {
  const xl = Math.min(0, x0) - 3;
  const xh = Math.max(0, x0) + 3;
  const ys = [y0, ...lines.flatMap((l) => [l.m * xl + l.b, l.m * xh + l.b])];
  return box(xh, Math.max(...ys) + 1, xl, Math.min(...ys) - 1);
};
const syGraph = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    let x0;
    let y0;
    let m1;
    let m2;
    let b1;
    let b2;
    for (let t = 0; t < 2000; t++) {
      x0 = level === 1 ? rng.int(1, 5) : nz(rng, -5, 6);
      y0 = level === 1 ? rng.int(1, 8) : nz(rng, -6, 8);
      m1 = level === 1 ? rng.int(1, 3) : nz(rng, -3, 3);
      m2 = level === 1 ? rng.int(-3, 0) || -1 : nz(rng, -3, 3, [m1]);
      if (level === 1 && m2 === m1) continue;
      b1 = y0 - m1 * x0;
      b2 = y0 - m2 * x0;
      if (m1 === m2 || Math.abs(b1) > 9 || Math.abs(b2) > 9 || (level === 1 && (b1 < 0 || b2 < 0))) continue;
      break;
    }
    const l1 = `y = ${linText(fr(m1), fr(b1))}`;
    const l2 = `y = ${linText(fr(m2), fr(b2))}`;
    const bx = sheetBox(x0, y0, [{ m: m1, b: b1 }, { m: m2, b: b2 }]);
    return {
      spec: { type: "graph", ...sysSpec({ a: -m1, b: 1, c: b1 }, { a: -m2, b: 1, c: b2 }) },
      stem: ST(`The graph shows the lines ${l1} and ${l2}.`, `The graph shows the lines ${l1} and ${l2}.`, `The graph displays the lines ${l1} and ${l2}.`),
      ask: ST("Where do the lines cross? Write the point as (x,y).", "What is the solution of the system? Write it as (x,y).", "Determine the solution of the system, the point of intersection, as an ordered pair (x,y)."),
      expr: null,
      answer: { value: pairStr(x0, y0), kind: "pair" },
      work: ["The solution of a system is the point where the two lines cross.", `Find the point that is on both lines. At x = ${num(x0)}, the first line gives y = ${num(y0)} and the second line gives y = ${num(y0)}.`, `The lines cross at (${num(x0)}, ${num(y0)}), so the solution is (${num(x0)}, ${num(y0)}).`],
      visual: { kind: "coord", alt: `A coordinate grid with the two lines ${l1} and ${l2}.`, xmin: bx.xmin, xmax: bx.xmax, ymin: bx.ymin, ymax: bx.ymax, step: bx.step, points: [], lines: [{ m: String(m1), b: String(b1) }, { m: String(m2), b: String(b2) }], labelAxes: ["x", "y"] },
      distractors: pairDist(x0, y0),
      hints: sysHints,
    };
  },
};

const pl = (v, one, many) => (v === 1 ? one : many);
const DUELS = [
  { x: ["week", "weeks"], y: ["dollar", "dollars"], down: true, q: "have the same amount of money", line: (n, s, r) => (r > 0 ? `${n} has ${s} ${pl(s, "dollar", "dollars")} and saves ${r} ${pl(r, "dollar", "dollars")} each week.` : `${n} has ${s} ${pl(s, "dollar", "dollars")} and spends ${-r} ${pl(-r, "dollar", "dollars")} each week.`) },
  { x: ["day", "days"], y: ["page", "pages"], down: false, q: "have read the same number of pages", line: (n, s, r) => `${n} has read ${s} ${pl(s, "page", "pages")} and reads ${r} more ${pl(r, "page", "pages")} each day.` },
  { x: ["minute", "minutes"], y: ["liter", "liters"], down: true, q: "have the same amount of water", line: (n, s, r) => (r > 0 ? `${n}'s tank has ${s} ${pl(s, "liter", "liters")} of water and fills by ${r} ${pl(r, "liter", "liters")} each minute.` : `${n}'s tank has ${s} ${pl(s, "liter", "liters")} of water and drains by ${-r} ${pl(-r, "liter", "liters")} each minute.`) },
  { x: ["week", "weeks"], y: ["centimeter", "centimeters"], down: false, q: "be the same height", line: (n, s, r) => `${n}'s plant is ${s} ${pl(s, "centimeter", "centimeters")} tall and grows ${r} ${pl(r, "centimeter", "centimeters")} each week.` },
  { x: ["minute", "minutes"], y: ["meter", "meters"], down: true, q: "be the same distance from the start", line: (n, s, r) => (r > 0 ? `${n} is ${s} ${pl(s, "meter", "meters")} from the start and runs away from it at ${r} ${pl(r, "meter", "meters")} each minute.` : `${n} is ${s} ${pl(s, "meter", "meters")} from the start and runs back toward it at ${-r} ${pl(-r, "meter", "meters")} each minute.`) },
];
const syWord = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const askY = level >= 2 && rng.chance(0.5);
    let r1;
    let r2;
    let s1;
    let s2;
    let x0;
    let y0;
    let duel;
    for (let t = 0; t < 2000; t++) {
      x0 = level === 3 ? rng.int(4, 15) : rng.int(2, 9);
      r1 = level === 3 ? rng.int(3, 12) : rng.int(2, 6);
      const down = level >= 2 && rng.chance(0.5);
      r2 = down ? -rng.int(1, 5) : rng.int(1, r1 - 1);
      if (r2 === 0) continue;
      s1 = rng.int(1, level === 3 ? 30 : 12);
      y0 = s1 + r1 * x0;
      s2 = y0 - r2 * x0;
      duel = rng.pick(DUELS.filter((d) => d.down || r2 > 0));
      if (s2 <= 0 || y0 > 200) continue;
      break;
    }
    const [n1, n2] = twoNames(rng);
    const eqA = `y = ${linText(fr(r1), fr(s1))}`;
    const eqB = `y = ${linText(fr(r2), fr(s2))}`;
    const L = { m: fr(r1), c: fr(s1) };
    const Rr = { m: fr(r2), c: fr(s2) };
    const ans = askY ? y0 : x0;
    const wrong = askY
      ? [[fr(x0), "reports-x-instead-of-y"], [fr(s1 + s2), "adds-the-starting-amounts"], [fr(r1 * x0), "forgets-the-starting-amount"], [fr(y0 + s1), "adds-an-extra-starting-amount"]]
      : [[fr(y0), "reports-y-instead-of-x"], [fr(Math.round(Math.abs(s2 - s1) / Math.max(r1 + Math.abs(r2), 1))), "divides-by-the-wrong-rate"], [fr(s2 - s1), "forgets-to-divide-by-the-difference-in-rates"], [fr(x0 + 1), "arithmetic-slip"]];
    const stem = ST(`${duel.line(n1, s1, r1)} ${duel.line(n2, s2, r2)}`, `${duel.line(n1, s1, r1)} ${duel.line(n2, s2, r2)}`, `${duel.line(n1, s1, r1)} ${duel.line(n2, s2, r2)}`);
    return {
      spec: { type: "word", ask: askY ? "y" : "x", ...sysSpec({ a: -r1, b: 1, c: s1 }, { a: -r2, b: 1, c: s2 }) },
      stem,
      ask: askY ? ST(`Find when ${n1} and ${n2} will ${duel.q}. What is the amount, in ${duel.y[1]}, at that time?`, `When ${n1} and ${n2} ${duel.q.replace(/^(have|be)/, (m) => `will ${m}`)}, what is the amount, in ${duel.y[1]}, at that time?`, `Determine the amount, in ${duel.y[1]}, at the moment when ${n1} and ${n2} will ${duel.q}.`) : ST(`After how many ${duel.x[1]} will ${n1} and ${n2} ${duel.q}?`, `After how many ${duel.x[1]} will ${n1} and ${n2} ${duel.q}?`, `Determine after how many ${duel.x[1]} ${n1} and ${n2} will ${duel.q}.`),
      expr: null,
      answer: A(fr(ans), { unit: askY ? duel.y[1] : duel.x[1] }),
      work: [`Let x be the number of ${duel.x[1]} and y the amount, in ${duel.y[1]}.`, `${n1}: ${eqA}. ${n2}: ${eqB}.`, `We want the time when the two amounts are equal: ${linText(L.m, L.c)} = ${linText(Rr.m, Rr.c)}.`, ...solveLines(L, Rr, fr(x0)), ...(askY ? [`Now put x = ${x0} in the first equation: ${E(mulTxt(r1, x0), r1 * x0)}, and ${E(`${r1 * x0} + ${s1}`, y0)}.`] : [])],
      visual: null,
      distractors: D(fr(ans), wrong),
      hints: H("Write an equation for each person, using the starting amount and the change each time. They are equal when both equations give the same y.", "Set the two expressions for y equal to each other, solve for x, and put x back in if the amount is asked."),
    };
  },
};

const syCount = {
  lv: [3],
  gen({ rng }) {
    const kind = rng.pick(["one", "none", "many", "none", "many"]);
    let e1;
    let e2;
    for (let t = 0; t < 1000; t++) {
      const a = nz(rng, -6, 6);
      const b = nz(rng, -6, 6);
      const c = rng.int(-12, 12);
      e1 = { a, b, c };
      if (kind === "one") {
        e2 = { a: nz(rng, -6, 6), b: nz(rng, -6, 6), c: rng.int(-12, 12) };
        if (e2.a * b - e1.a * e2.b === 0) continue;
      } else {
        const kk = rng.pick([2, 3, -1, -2]);
        e2 = { a: kk * a, b: kk * b, c: kk * c + (kind === "none" ? nz(rng, -6, 6) : 0) };
      }
      break;
    }
    const slope = (e) => fr(-e.a, e.b);
    const icept = (e) => fr(e.c, e.b);
    const real = e1.a * e2.b - e2.a * e1.b !== 0 ? "one" : e1.a * e2.c === e2.a * e1.c && e1.b * e2.c === e2.b * e1.c ? "many" : "none";
    const ans = NSOLS[real];
    const tags = { one: "thinks-every-system-has-one-solution", none: real === "one" ? "stops-early-and-calls-it-no-solution" : "calls-the-same-line-no-solution", many: real === "one" ? "thinks-matching-numbers-mean-every-point-works" : "calls-parallel-lines-infinitely-many" };
    const pool = [[NSOLS.one, tags.one], [NSOLS.none, tags.none], [NSOLS.many, tags.many], ["two solutions", "thinks-two-lines-give-two-solutions"]].filter(([t]) => t !== ans);
    const t1 = stdEq(e1.a, e1.b, e1.c);
    const t2 = stdEq(e2.a, e2.b, e2.c);
    const s1 = slope(e1);
    const s2 = slope(e2);
    return {
      spec: { type: "count", ...sysSpec(e1, e2) },
      stem: ST(`Here are two equations: ${t1} and ${t2}.`, `Consider the system ${t1} and ${t2}.`, `The system of equations ${t1} and ${t2} is given.`),
      ask: ST("How many solutions does the system have?", "How many solutions does the system have?", "Determine the number of solutions of the system."),
      expr: null,
      answer: { value: ans, kind: "text" },
      work: [`Write each equation as y = mx + b. First line: y = ${linText(s1, icept(e1))}. Second line: y = ${linText(s2, icept(e2))}.`, real === "one" ? "The slopes are different, so the lines cross exactly once." : real === "none" ? "The slopes are the same but the y-intercepts are different, so the lines are parallel and never meet." : "The slopes and the y-intercepts are the same, so both equations make the same line."],
      visual: null,
      distractors: pool.slice(0, 3).map(([text, misconception]) => ({ text, misconception })),
      hints: H("Each equation makes a line. Two lines can cross once, never, or lie on top of each other.", "Compare the slopes and the y-intercepts of the two lines."),
    };
  },
};

FAMILIES.systems = {
  title: "Systems of equations",
  grades: [8],
  defaults: {},
  gen(rng, params, opts) {
    const level = opts.level;
    const t = pickType(rng, level, [sySub, syElim, syGraph, syWord, syCount]);
    return done({ family: "systems", level, ...t.gen({ rng, level, ctx: opts.ctx }) });
  },
};

// ================================================================================================================ functions
const fnPairs = (ps) => ps.map(([x, y]) => pairText(num(x), num(y))).join(", ");
const FN_NO = ["Each input must go with its own different output.", "The points do not make a straight line.", "The outputs are not in order from least to greatest."];
const fnIsFunction = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const form = level === 1 ? rng.pick(["pairs", "table"]) : rng.pick(["pairs", "table", "mapping", "graph"]);
    const truth = rng.chance(0.5);
    const n = level === 3 ? 6 : level === 2 ? 5 : 4;
    const neg = level === 3;
    const xsAll = neg ? [-4, -3, -2, -1, 1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 7, 8];
    const xs = rng.sample(xsAll, truth ? n : n - 1).sort((a, b) => a - b);
    const yr = () => (neg ? nz(rng, -6, 8) : rng.int(1, 9));
    let ps = xs.map((x) => [x, yr()]);
    let dupX = null;
    if (!truth) {
      dupX = rng.pick(xs);
      const orig = ps.find(([x]) => x === dupX)[1];
      let y2;
      do y2 = yr();
      while (y2 === orig);
      ps.push([dupX, y2]);
      ps = rng.shuffle(ps);
    } else if (level >= 2) {
      // let two inputs share an output (still a function)
      const j = rng.int(1, ps.length - 1);
      ps[j][1] = ps[j - 1][1];
    }
    if (truth) ps.sort((a, b) => a[0] - b[0]);
    const list = fnPairs(ps);
    const listBrace = `{${list}}`;
    const text = {
      pairs: ST(`A relation is a set of pairs (input, output): ${listBrace}.`, `A relation is given as a set of ordered pairs (input, output): ${listBrace}.`, `A relation is given by the set of ordered pairs (input, output) ${listBrace}.`),
      table: ST(`A table shows inputs (x) and outputs (y). The pairs are ${list}.`, `A table shows inputs (x) and outputs (y). The pairs are ${list}.`, `A table lists inputs (x) and outputs (y) as the ordered pairs ${list}.`),
      mapping: ST(`An arrow diagram sends each input to an output: ${ps.map(([x, y]) => `${num(x)} goes to ${num(y)}`).join(", ")}.`, `A mapping sends inputs to outputs: ${ps.map(([x, y]) => `${num(x)} goes to ${num(y)}`).join(", ")}.`, `A mapping assigns outputs to inputs as follows: ${ps.map(([x, y]) => `${num(x)} goes to ${num(y)}`).join(", ")}.`),
      graph: ST(`A graph shows these points (x, y): ${list}.`, `A graph shows these points (x, y): ${list}.`, `A graph displays the points ${list}.`),
    }[form];
    const maxX = Math.max(...ps.map((p) => p[0]));
    const maxY = Math.max(...ps.map((p) => p[1]));
    const minX = Math.min(...ps.map((p) => p[0]));
    const minY = Math.min(...ps.map((p) => p[1]));
    const bx = box(maxX + 1, maxY + 1, minX - 1, minY - 1);
    const visual =
      form === "table"
        ? { kind: "table", alt: `A table of inputs and outputs: ${list}.`, headers: ["Input (x)", "Output (y)"], rows: ps.map(([x, y]) => [num(x), num(y)]), caption: "Inputs and outputs" }
        : form === "graph"
          ? { kind: "coord", alt: `A coordinate grid with the points ${list}.`, xmin: bx.xmin, xmax: bx.xmax, ymin: bx.ymin, ymax: bx.ymax, step: bx.step, points: ps.map(([x, y]) => ({ x: String(x), y: String(y), label: pairText(num(x), num(y)) })), lines: [], labelAxes: ["x", "y"] }
          : null;
    const outs = dupX != null ? ps.filter(([x]) => x === dupX).map((p) => num(p[1])) : [];
    return {
      spec: { type: "is-function", form, pairs: ps },
      stem: text,
      ask: ST("Is this relation a function?", "Is this relation a function?", "Does this relation represent a function?"),
      expr: null,
      answer: { value: truth ? "true" : "false", kind: "bool", text: truth ? "Yes. Each input has exactly one output." : `No. The input ${num(dupX)} has two different outputs, ${outs[0]} and ${outs[1]}.` },
      work: truth ? ["A function gives each input exactly one output.", "Check each input: none of them is paired with two different outputs.", "So the relation is a function."] : ["A function gives each input exactly one output.", `The input ${num(dupX)} is paired with ${outs[0]} and with ${outs[1]}.`, "One input has two different outputs, so the relation is not a function."],
      visual,
      distractors: dist(
        truth
          ? [[`No. ${FN_NO[0]}`, "thinks-each-input-needs-its-own-different-output"], [`No. ${FN_NO[1]}`, "thinks-a-function-must-be-a-straight-line"], [`No. ${FN_NO[2]}`, "thinks-the-outputs-must-be-in-order"]]
          : [["Yes. Every input has an output.", "thinks-any-pairing-of-inputs-and-outputs-is-a-function"], ["Yes. No input is used twice with the same output.", "mixes-up-repeated-pairs-with-repeated-inputs"], ["Yes. A relation with this many pairs is a function.", "thinks-more-data-makes-it-a-function"]],
      ),
      hints: H("In a function, each input has exactly one output. An output may be used more than once.", "Look at the inputs one at a time. Does any input appear with two different outputs?"),
    };
  },
};

const fnEvalRule = (kind, p) => (kind === "lin" ? linText(p.m, p.b, true) : `${p.a === 1 ? "" : p.a}x² ${p.b === 0 ? "" : `${p.b < 0 ? MINUS : "+"} ${Math.abs(p.b) === 1 ? "" : Math.abs(p.b)}x `}${p.c === 0 ? "" : `${p.c < 0 ? MINUS : "+"} ${Math.abs(p.c)}`}`.trim().replace(/\s+/g, " "));
const fnEval = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const quad = level === 3 && rng.chance(0.55);
    const inv = !quad && level >= 2 && rng.chance(0.3);
    if (quad) {
      const a = rng.pick([1, 1, 2, 3]);
      const b = rng.pick([0, 0, -2, 3, -1, 4]);
      const c = nz(rng, -6, 8);
      const x = rng.pick([-3, -2, 2, 3, 4, -1, 5]);
      const val = a * x * x + b * x + c;
      const rule = fnEvalRule("quad", { a, b, c });
      const xt = num(x);
      return {
        spec: { type: "eval", form: "quad", a, b, c, x },
        stem: ST(`A function machine uses the rule f(x) = ${rule}.`, `A function is given by f(x) = ${rule}.`, `The function f is defined by f(x) = ${rule}.`),
        ask: ST(`What is f(${xt})?`, `What is f(${xt})?`, `Evaluate f(${xt}).`),
        expr: `f(x) = ${rule}`,
        answer: A(fr(val)),
        work: [`Put ${xt} in place of x.`, `x² is ${num(x * x)}, because ${xt} times ${xt} is ${num(x * x)}.`, `Then ${num(a)} ${TIMES} ${num(x * x)} is ${num(a * x * x)}${b !== 0 ? `, and ${num(b)} ${TIMES} ${xt} is ${num(b * x)}` : ""}.`, `Add the parts: the total is ${num(val)}.`],
        visual: { kind: "machine", alt: `A function machine with the rule ${rule}. The input is ${xt} and the output is unknown.`, rule, input: String(x), output: "?" },
        distractors: D(fr(val), [[fr(a * (2 * x) + b * x + c), "doubles-x-instead-of-squaring"], [fr((a * x) * (a * x) + b * x + c), "squares-the-coefficient-too"], [fr(-(x * x) * a + b * x + c), "treats-the-square-of-a-negative-as-negative"], [fr(a * x * x + b + c), "forgets-to-multiply-the-x-term"]]),
        hints: H("A function takes an input, follows the rule, and gives one output. The input goes where x is.", "Replace x with the input. Do the exponent first, then the multiplication, then the addition and subtraction."),
      };
    }
    let m;
    let b;
    let x;
    const dm = level >= 2 && rng.chance(0.4);
    if (level === 1) {
      m = fr(rng.int(2, 9));
      b = fr(nz(rng, -9, 12));
      x = rng.int(2, 8);
    } else if (level === 2) {
      m = dm ? rng.pick([fr(5, 2), fr(3, 2), fr(3, 4), fr(7, 2)]) : fr(nz(rng, -6, 9, [1, -1]));
      b = fr(nz(rng, -12, 12));
      x = dm ? rng.pick([2, 4, 6, 8]) : rng.pick([-5, -4, -3, -2, 2, 3, 4, 5]);
    } else {
      m = rng.pick([fr(1, 2), fr(3, 4), fr(-1, 2), fr(-3, 2), fr(5, 2), fr(-2), fr(-5)]);
      b = fr(nz(rng, -12, 12));
      x = m.d === 1 ? rng.pick([-6, -4, 3, 5, 7, -3]) : rng.pick([-8, -4, 4, 8, 12, -12]);
    }
    const val = m.mul(fr(x)).add(b);
    const rule = linText(m, b, true);
    if (inv) {
      return {
        spec: { type: "eval-inv", m: S(m), b: S(b), out: S(val) },
        stem: ST(`A function machine uses the rule f(x) = ${rule}. The output is ${T(val, true)}.`, `A function is given by f(x) = ${rule}. For one input, the output f(x) is ${T(val, true)}.`, `The function f is defined by f(x) = ${rule}. For some input x, the output f(x) equals ${T(val, true)}.`),
        ask: ST("What is the input x?", "What input x gives that output?", "Determine the input x that produces that output."),
        expr: `f(x) = ${rule}`,
        answer: A(fr(x)),
        work: [`Set the rule equal to the output: ${rule} = ${T(val, true)}.`, `Subtract ${T(b, true)} from both sides: ${E(`${T(val, true)} ${MINUS} ${T(b, true)}`, val.sub(b), true)}.`, `Divide both sides by ${T(m, true)}: ${E(`${T(val.sub(b), true)} ${DIVIDE} ${T(m, true)}`, fr(x))}.`],
        visual: { kind: "machine", alt: `A function machine with the rule ${rule}. The output is ${T(val, true)} and the input is unknown.`, rule, input: "?", output: T(val, true).replace(MINUS, "-") },
        distractors: D(fr(x), [[val.sub(b), "forgets-to-divide-by-the-coefficient"], [val.add(b).div(m), "adds-the-constant-instead-of-subtracting"], [val.div(m), "ignores-the-constant"], [val.mul(m).sub(b), "multiplies-instead-of-dividing"]], true),
        hints: H("To find the input, work backward through the machine: undo the last step first.", "Undo the addition or subtraction, then undo the multiplication."),
      };
    }
    const xt = num(x);
    return {
      spec: { type: "eval", form: "lin", m: S(m), b: S(b), x },
      stem: ST(`A function machine uses the rule f(x) = ${rule}.`, `A function is given by f(x) = ${rule}.`, `The function f is defined by f(x) = ${rule}.`),
      ask: ST(`What is f(${xt})?`, `What is f(${xt})?`, `Evaluate f(${xt}).`),
      expr: `f(x) = ${rule}`,
      answer: A(val, { dec: true }),
      work: [`Put ${xt} in place of x.`, `Multiply first: ${T(m, true)} times ${xt} is ${T(m.mul(fr(x)), true)}.`, b.n < 0 ? `Then subtract ${T(absF(b), true)}: ${T(m.mul(fr(x)), true)} minus ${T(absF(b), true)} is ${T(val, true)}.` : `Then add the constant: ${T(m.mul(fr(x)), true)} plus ${T(b, true)} is ${T(val, true)}.`],
      visual: { kind: "machine", alt: `A function machine with the rule ${rule}. The input is ${xt} and the output is unknown.`, rule, input: String(x), output: "?" },
      distractors: D(val, [[m.add(fr(x)).add(b), "adds-instead-of-multiplying"], [m.mul(fr(x)).sub(b), "changes-the-sign-of-the-constant"], [m.mul(fr(x).add(b)), "adds-before-multiplying"], [m.mul(fr(x)), "forgets-the-constant"], [fr(x < 0 ? -x : x).mul(m).add(b), "drops-the-negative-sign-of-the-input"]], true),
      hints: H("A function takes an input, follows the rule, and gives one output. The input goes where x is.", "Replace x with the input. Multiply first, then add or subtract."),
    };
  },
};

const fnCompare = {
  lv: [2, 3],
  gen({ rng, level }) {
    const ask = rng.pick(["rate", "initial"]);
    let mA;
    let bA;
    let mB;
    let bB;
    for (let t = 0; t < 500; t++) {
      mA = level === 2 ? fr(rng.int(1, 8)) : fr(nz(rng, -6, 8), rng.pick([1, 1, 2]));
      bA = level === 2 ? fr(rng.int(1, 12)) : fr(nz(rng, -8, 14));
      mB = level === 2 ? fr(rng.int(1, 8)) : fr(nz(rng, -6, 8), rng.pick([1, 1, 2]));
      bB = level === 2 ? fr(rng.int(1, 12)) : fr(nz(rng, -8, 14));
      if (ask === "rate" ? !eqF(mA, mB) : !eqF(bA, bB)) break;
    }
    const xsA = rng.pick([[1, 2, 3, 4], [2, 3, 4, 5], [1, 3, 5, 7], [2, 4, 6, 8]]);
    const rowsA = xsA.map((x) => [x, mA.mul(fr(x)).add(bA)]);
    const prA = pairsText(rowsA.map(([x, y]) => [String(x), T(y, true)]));
    const verbal = rng.chance(0.4);
    const bText = verbal ? `Function B starts at ${T(bB, true)} and ${mB.n >= 0 ? "goes up" : "goes down"} by ${T(absF(mB), true)} each time x goes up by 1.` : `Function B is y = ${linText(mB, bB, true)}.`;
    const names = ["Function A", "Function B"];
    const pickA = ask === "rate" ? mA.cmp(mB) > 0 : bA.cmp(bB) > 0;
    const ans = pickA ? names[0] : names[1];
    const q = ask === "rate" ? ST("Which function changes faster? (Which has the greater rate of change?)", "Which function has the greater rate of change?", "Which function has the greater rate of change?") : ST("Which function has the greater starting value? (the greater y when x is 0)", "Which function has the greater initial value (the value of y when x = 0)?", "Which function has the greater initial value, that is, the greater value of y when x = 0?");
    return {
      spec: { type: "compare", ask, names, A: { rows: rowsA.map(([x, y]) => [String(x), S(y)]) }, B: { m: S(mB), b: S(bB) } },
      stem: ST(`Function A is a table with the pairs (x, y): ${prA}. ${bText}`, `Function A is shown in a table with the pairs (x, y): ${prA}. ${bText}`, `Function A is represented by a table with the ordered pairs ${prA}. ${bText}`),
      ask: q,
      expr: null,
      answer: { value: ans, kind: "text" },
      work: [`Function A: the rate of change is ${T(mA, true)} and the value at x = 0 is ${T(bA, true)}.`, `Function B: the rate of change is ${T(mB, true)} and the value at x = 0 is ${T(bB, true)}.`, ask === "rate" ? `${T(pickA ? mA : mB, true)} is greater than ${T(pickA ? mB : mA, true)}, so ${ans} has the greater rate of change.` : `${T(pickA ? bA : bB, true)} is greater than ${T(pickA ? bB : bA, true)}, so ${ans} has the greater initial value.`],
      visual: { kind: "table", alt: `Function A as a table of inputs and outputs: ${prA}.`, headers: ["x", "y"], rows: rowsA.map(([x, y]) => [String(x), T(y, true)]), caption: "Function A" },
      distractors: dist([[pickA ? names[1] : names[0], "compares-the-wrong-feature"], ["They are equal", "assumes-they-match"], ["It is impossible to tell because they use different representations", "cannot-compare-representations"]]),
      hints: H("A table, an equation and a description can all show the same two features: the rate of change and the starting value.", ask === "rate" ? "Find how much y changes when x goes up by 1 in the table, then compare it with the rate in the equation." : "Find y when x is 0 for the table, then compare it with the starting value of the other function."),
    };
  },
};

const fnLinear = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const lin = rng.chance(0.5);
    const xs = level === 3 && rng.chance(0.5) ? [1, 2, 4, 5] : rng.pick([[1, 2, 3, 4], [0, 1, 2, 3], [2, 4, 6, 8], [1, 2, 3, 4, 5]]);
    let rows;
    let firstRate;
    if (lin) {
      const m = nz(rng, -5, 6);
      const b = rng.int(-6, 10);
      rows = xs.map((x) => [x, m * x + b]);
    } else {
      const kind = rng.pick(["sq", "sq", "exp", "steps"]);
      if (kind === "sq") rows = xs.map((x) => [x, x * x + (level === 3 ? 1 : 0)]);
      else if (kind === "exp") rows = xs.map((x) => [x, 2 ** x]);
      else {
        const c = rng.int(1, 4);
        rows = xs.map((x, i) => [x, c * i * i + 2 * i]);
      }
    }
    const slopes = rows.slice(1).map((r, i) => (r[1] - rows[i][1]) / (r[0] - rows[i][0]));
    firstRate = slopes[0];
    const real = new Set(slopes.map((s) => s.toFixed(9))).size === 1;
    const list = fnPairs(rows);
    const stem = ST(`A table shows inputs (x) and outputs (y). The pairs are ${list}.`, `A function is given by a table of (x, y) pairs: ${list}.`, `A function is represented by a table with the ordered pairs ${list}.`);
    return {
      spec: { type: "linearity", rows },
      stem,
      ask: ST("Is the function linear or non-linear?", "Is the function linear or non-linear?", "Is the function linear or non-linear?"),
      expr: null,
      answer: { value: real ? "linear" : "non-linear", kind: "text", text: real ? "Linear. The rate of change is constant." : "Non-linear. The rate of change is not constant." },
      work: [`Find how much y changes for each 1 that x changes, for every pair of neighbors: ${slopes.map((s) => (Number.isInteger(s) ? String(s).replace("-", MINUS) : s.toFixed(2).replace("-", MINUS))).join(", ")}.`, real ? "The rate of change is the same every time, so the function is linear." : "The rate of change is not the same every time, so the function is not linear."],
      visual: { kind: "table", alt: `A table of inputs and outputs: ${list}.`, headers: ["x", "y"], rows: rows.map(([x, y]) => [num(x), num(y)]), caption: "A function" },
      distractors: dist(
        real
          ? [["Non-linear. The y-values are not multiples of the x-values.", "thinks-linear-means-proportional"], ["Non-linear. The y-values do not go up by 1 each time.", "thinks-linear-means-y-goes-up-by-one"], ["Non-linear. The x-values do not go up by the same amount.", "thinks-x-must-go-up-by-one-each-time"]]
          : [["Linear. The y-values keep getting bigger.", "thinks-increasing-means-linear"], [`Linear. The first two rows have a rate of change of ${Number.isInteger(firstRate) ? firstRate : firstRate.toFixed(1)}.`.replace("-", MINUS), "checks-only-the-first-two-rows"], ["Linear. It is a function.", "thinks-every-function-is-linear"]],
      ),
      hints: H("A function is linear when its rate of change is the same between every pair of rows.", "Find the change in y divided by the change in x for each pair of neighboring rows and compare the results."),
    };
  },
};

FAMILIES.functions = {
  title: "Functions",
  grades: [8],
  defaults: {},
  gen(rng, params, opts) {
    const level = opts.level;
    const t = pickType(rng, level, [fnIsFunction, fnEval, fnCompare, fnLinear]);
    return done({ family: "functions", level, ...t.gen({ rng, level, ctx: opts.ctx }) });
  },
};

// ================================================================================================================ slope and rate of change
const slopeBox = (pts, extraY = []) => {
  const xs = pts.map((p) => p[0]).concat([0]);
  const ys = pts.map((p) => p[1]).concat(extraY, [0]);
  return box(Math.max(...xs) + 1, Math.max(...ys) + 1, Math.min(...xs) - 1, Math.min(...ys) - 1);
};
function twoPoints(rng, level, opts = {}) {
  for (let t = 0; t < 3000; t++) {
    const frac = opts.frac ?? (level >= 2 && rng.chance(0.5));
    const q = frac ? rng.pick([2, 2, 3, 4]) : 1;
    let p = nz(rng, level === 1 ? 1 : -6, level === 1 ? 5 : 6);
    if (level === 1) p = Math.abs(p);
    if (frac && gcdI(p, q) !== 1) continue;
    if (!frac && opts.noInt) continue;
    const b = level === 1 ? rng.int(0, 5) : nz(rng, -6, 8);
    const x1 = q * (opts.x0 ? 0 : nz(rng, level === 1 ? 1 : -3, 3));
    const run = q * rng.int(1, 3);
    const x2 = x1 + run;
    const y1 = (p / q) * x1 + b;
    const y2 = (p / q) * x2 + b;
    if (!Number.isInteger(y1) || !Number.isInteger(y2)) continue;
    if (opts.noOrigin && (x1 === 0 || x2 === 0)) continue;
    if (opts.nzB && b === 0) continue;
    if (Math.max(Math.abs(y1), Math.abs(y2), Math.abs(x1), Math.abs(x2)) > 14) continue;
    return { p1: [x1, y1], p2: [x2, y2], m: fr(p, q), b };
  }
  throw new Error("no points");
}
const pointsVisual = (pts, alt, extraY = []) => {
  const bx = slopeBox(pts, extraY);
  return { kind: "coord", alt, xmin: bx.xmin, xmax: bx.xmax, ymin: bx.ymin, ymax: bx.ymax, step: bx.step, points: pts.map(([x, y]) => ({ x: String(x), y: String(y), label: pairText(num(x), num(y)) })), lines: [{ p1: { x: pts[0][0], y: pts[0][1] }, p2: { x: pts[1][0], y: pts[1][1] } }], labelAxes: ["x", "y"] };
};
const slTwo = {
  lv: [1, 2, 3],
  gen({ rng, level, ctx }) {
    const { p1, p2, m } = twoPoints(rng, level);
    const ctxd = level >= 2 && rng.chance(0.5);
    const sc = sceneOf(rng, ctx);
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const a1 = pairText(num(p1[0]), num(p1[1]));
    const a2 = pairText(num(p2[0]), num(p2[1]));
    const unit = ctxd ? `${sc.y[1]} per ${sc.x[0]}` : undefined;
    const stem = ctxd ? ST(`A line on a graph shows the number of ${sc.y[1]} (y) and the number of ${sc.x[1]} (x). The line goes through ${a1} and ${a2}.`, `A graph shows the number of ${sc.y[1]} (y) for the number of ${sc.x[1]} (x). The line passes through ${a1} and ${a2}.`, `A line graph relates the number of ${sc.y[1]} (y) to the number of ${sc.x[1]} (x). The line contains the points ${a1} and ${a2}.`) : ST(`A line goes through the points ${a1} and ${a2}.`, `A line passes through the points ${a1} and ${a2}.`, `A line contains the points ${a1} and ${a2}.`);
    const ask = ctxd ? ST(`What is the rate of change, in ${sc.y[1]} per ${sc.x[0]}?`, `What is the rate of change (slope), in ${sc.y[1]} per ${sc.x[0]}?`, `Determine the rate of change (the slope) in ${sc.y[1]} per ${sc.x[0]}.`) : ST("What is the slope of the line?", "What is the slope of the line?", "Determine the slope of the line.");
    const dmm = isTerm(m) && m.d !== 1 && rng.chance(0.5);
    return {
      spec: { type: "two-points", p1, p2 },
      stem,
      ask,
      expr: null,
      answer: A(m, { dec: dmm, unit }),
      work: [`The slope is rise ${DIVIDE} run, the change in y over the change in x.`, `Rise: ${E(subTxt(p2[1], p1[1]), dy)}. Run: ${E(subTxt(p2[0], p1[0]), dx)}.`, `${divTxt(dy, dx)} is ${T(m, dmm)}.`],
      visual: pointsVisual([p1, p2], `A coordinate grid with the points ${a1} and ${a2} and the line through them.`),
      distractors: D(m, [[fr(dx, dy || 1), "inverts-rise-and-run"], [fr(-dy, dx), "gets-the-sign-wrong"], [fr(p2[1] - p1[1] + (p2[0] - p1[0])), "adds-the-changes"], [fr(dy - dx), "subtracts-run-from-rise"], [dx !== 0 ? fr(p2[1], p2[0] || 1) : null, "divides-the-second-point-coordinates"]], dmm),
      hints: H("Slope tells how much y changes each time x goes up by 1.", "Subtract the y-values in the same order as the x-values, then divide the change in y by the change in x."),
    };
  },
};
const slTable = {
  lv: [2, 3],
  gen({ rng, level, ctx }) {
    const sc = sceneOf(rng, ctx);
    const frac = level === 3 && rng.chance(0.5);
    const m = frac ? fr(rng.pick([1, 3, 5, 7]), 2) : fr(nz(rng, -5, 8));
    const b = rng.int(-4, 12);
    const step = frac ? 2 : rng.int(1, 3);
    const x0 = rng.int(0, 4);
    const rows = Array.from({ length: 4 }, (_, i) => [x0 + i * step, m.mul(fr(x0 + i * step)).add(fr(b))]);
    const dm = true;
    const pr = pairsText(rows.map(([x, y]) => [num(x), T(y, dm)]));
    return {
      spec: { type: "table-rate", rows: rows.map(([x, y]) => [x, S(y)]) },
      stem: ST(`A table shows the number of ${sc.x[1]} (x) and the number of ${sc.y[1]} (y). The pairs are ${pr}. The change is steady.`, `A table shows the number of ${sc.y[1]} (y) for the number of ${sc.x[1]} (x). The pairs (x, y) are ${pr}. The rate of change is constant.`, `A table relates the number of ${sc.y[1]} (y) to the number of ${sc.x[1]} (x) with the ordered pairs ${pr}. The rate of change is constant.`),
      ask: ST(`What is the rate of change, in ${sc.y[1]} per ${sc.x[0]}?`, `What is the rate of change, in ${sc.y[1]} per ${sc.x[0]}?`, `Determine the rate of change, in ${sc.y[1]} per ${sc.x[0]}.`),
      expr: null,
      answer: A(m, { dec: true, unit: `${sc.y[1]} per ${sc.x[0]}` }),
      work: [`Choose two rows: x = ${num(rows[0][0])} and x = ${num(rows[1][0])}.`, `The change in y is ${T(rows[1][1].sub(rows[0][1]), dm)}, and the change in x is ${num(step)}.`, `${T(rows[1][1].sub(rows[0][1]), dm)} ${DIVIDE} ${num(step)} is ${T(m, dm)}.`],
      visual: { kind: "table", alt: `A table of ${sc.x[1]} and ${sc.y[1]}: ${pr}.`, headers: [cap(sc.x[1]), cap(sc.y[1])], rows: rows.map(([x, y]) => [num(x), T(y, dm)]), caption: "Table of values" },
      distractors: D(m, [[rows[1][1].sub(rows[0][1]), "forgets-to-divide-by-the-change-in-x"], [fr(step).div(rows[1][1].sub(rows[0][1]).n === 0 ? fr(1) : rows[1][1].sub(rows[0][1])), "inverts-the-rate"], [rows[0][1].div(fr(rows[0][0] || 1)), "divides-y-by-x-in-the-first-row"], [rows[3][1].sub(rows[0][1]), "uses-the-total-change"]], dm),
      hints: H("The rate of change is how much y changes for each 1 that x changes.", "Subtract two y-values, subtract the matching two x-values, and divide the first difference by the second."),
    };
  },
};
const slIntercept = {
  lv: [2, 3],
  gen({ rng, level }) {
    const { p1, p2, m, b } = twoPoints(rng, level === 2 ? 1 : 2, { noOrigin: true, frac: false, nzB: true });
    const a1 = pairText(num(p1[0]), num(p1[1]));
    const a2 = pairText(num(p2[0]), num(p2[1]));
    const slopeT = T(m);
    return {
      spec: { type: "find-b", p1, p2 },
      stem: ST(`A line goes through the points ${a1} and ${a2}.`, `A line passes through the points ${a1} and ${a2}.`, `A line contains the points ${a1} and ${a2}.`),
      ask: ST("Where does the line cross the y-axis? What is the y-intercept?", "What is the y-intercept of the line?", "Determine the y-intercept of the line."),
      expr: null,
      answer: A(fr(b)),
      work: [`First find the slope: ${E(subTxt(p2[1], p1[1]), p2[1] - p1[1])} and ${E(subTxt(p2[0], p1[0]), p2[0] - p1[0])}, so the slope is ${slopeT}.`, `Use y = mx + b with the point ${a1}: ${num(p1[1])} = ${slopeT} ${TIMES} ${par(num(p1[0]))} + b.`, `${E(mulTxt(m.n / m.d, p1[0]), m.mul(fr(p1[0])))}, so b = ${E(subTxt(p1[1], m.n * p1[0] / m.d), b)}.`],
      visual: pointsVisual([p1, p2], `A coordinate grid with the points ${a1} and ${a2} and the line through them.`, [b]),
      distractors: D(fr(b), [[m, "reports-the-slope"], [fr(p1[1]), "reports-the-y-value-of-a-point"], [fr(p1[1]).add(m.mul(fr(p1[0]))), "adds-instead-of-subtracting-mx"], [fr(-b), "gets-the-sign-wrong"]], false),
      hints: H("The y-intercept is the value of y when x is 0. You can find it from the slope and any point on the line.", "Find the slope, then put the slope and one point into y = mx + b and solve for b."),
    };
  },
};
const slGraphEq = {
  lv: [3],
  gen({ rng }) {
    const { p1, p2, m, b } = twoPoints(rng, 2, { noOrigin: true, nzB: true });
    const a1 = pairText(num(p1[0]), num(p1[1]));
    const a2 = pairText(num(p2[0]), num(p2[1]));
    const ans = eqStr(m, fr(b));
    const cands = [eqStr(fr(b), m), eqStr(m, fr(-b)), eqStr(negF(m), fr(b)), eqStr(m.d === 1 ? fr(1).div(m) : fr(m.d, m.n), fr(b))];
    const tg = ["swaps-the-slope-and-the-intercept", "gets-the-sign-of-the-intercept-wrong", "gets-the-sign-of-the-slope-wrong", "inverts-the-slope"];
    const dd = [];
    cands.forEach((t, i) => {
      if (t !== ans && !dd.some((d) => d[0] === t)) dd.push([t, tg[i]]);
    });
    return {
      spec: { type: "graph-eq", p1, p2 },
      stem: ST(`A line goes through the points ${a1} and ${a2}.`, `A line passes through the points ${a1} and ${a2}.`, `A line contains the points ${a1} and ${a2}.`),
      ask: ST("Write the equation of the line in the form y = mx + b.", "Write the equation of the line in the form y = mx + b.", "Write the equation of the line in slope-intercept form, y = mx + b."),
      expr: null,
      answer: { value: ans, kind: "text" },
      work: [`Slope: ${E(subTxt(p2[1], p1[1]), p2[1] - p1[1])} over ${E(subTxt(p2[0], p1[0]), p2[0] - p1[0])}, so m = ${T(m)}.`, `Put m and the point ${a1} into y = mx + b and solve: b = ${num(b)}.`, `The equation is ${ans}.`],
      visual: pointsVisual([p1, p2], `A coordinate grid with the points ${a1} and ${a2} and the line through them.`, [b]),
      distractors: dist(dd.slice(0, 3)),
      hints: H("In y = mx + b, m is the slope and b is where the line crosses the y-axis.", "Find the slope from the two points, then use one point to find b."),
    };
  },
};
const slProp = {
  lv: [3],
  gen({ rng }) {
    const prop = rng.chance(0.45);
    let p1;
    let p2;
    let m;
    let b = 0;
    if (prop) {
      const q = rng.pick([1, 1, 2, 3]);
      let pn;
      do pn = nz(rng, -5, 6);
      while (gcdI(pn, q) !== 1);
      m = fr(pn, q);
      const x1 = q * rng.int(1, 3);
      const x2 = x1 + q * rng.int(1, 2);
      p1 = [x1, (pn * x1) / q];
      p2 = [x2, (pn * x2) / q];
    } else ({ p1, p2, m, b } = twoPoints(rng, 2, { noOrigin: true, nzB: true }));
    const a1 = pairText(num(p1[0]), num(p1[1]));
    const a2 = pairText(num(p2[0]), num(p2[1]));
    const truth = b === 0;
    return {
      spec: { type: "prop-line", p1, p2 },
      stem: ST(`A line goes through the points ${a1} and ${a2}.`, `A line passes through the points ${a1} and ${a2}.`, `A line contains the points ${a1} and ${a2}.`),
      ask: ST("Does this line show a proportional relationship?", "Does this line show a proportional relationship?", "Does this line represent a proportional relationship?"),
      expr: null,
      answer: { value: truth ? "proportional" : "not proportional", kind: "text", text: truth ? "Proportional. The line goes through (0, 0)." : "Not proportional. The line does not go through (0, 0)." },
      work: [`The slope is ${T(m)}.`, `Find the y-intercept: ${num(b)}.`, truth ? "The y-intercept is 0, so the line goes through (0, 0). The relationship is proportional." : "The y-intercept is not 0, so the line misses (0, 0). The relationship is not proportional."],
      visual: pointsVisual([p1, p2], `A coordinate grid with the points ${a1} and ${a2} and the line through them.`, [b]),
      distractors: dist(truth ? [["Not proportional. The slope is not 1.", "thinks-the-slope-must-be-1"], ["Not proportional. The line has no starting value.", "thinks-a-zero-intercept-means-not-proportional"], ["Not proportional. The line does not go through (1, 1).", "thinks-the-line-must-go-through-one-one"]] : [["Proportional. The line is straight.", "thinks-straight-means-proportional"], ["Proportional. The slope is the same everywhere.", "thinks-a-constant-slope-means-proportional"], ["Proportional. The line goes up as x goes up.", "thinks-increasing-means-proportional"]]),
      hints: H("A proportional relationship has a graph that is a straight line through the origin.", "Find the slope, then use a point to find the y-intercept. A proportional line has a y-intercept of 0."),
    };
  },
};

FAMILIES.slope = {
  title: "Slope and rate of change",
  grades: [8],
  defaults: {},
  gen(rng, params, opts) {
    const level = opts.level;
    const t = pickType(rng, level, [slTwo, slTwo, slTable, slIntercept, slGraphEq, slProp]);
    return done({ family: "slope", level, ...t.gen({ rng, level, ctx: opts.ctx }) });
  },
};

// ================================================================================================================ exponents and scientific notation
const caret = (base, e) => `${base}^${e < 0 ? MINUS : ""}${Math.abs(e)}`;
const powF = (f, e) => {
  let r = fr(1);
  for (let i = 0; i < Math.abs(e); i++) r = r.mul(f);
  return e < 0 ? fr(1).div(r) : r;
};
const sciText = (m, e) => `${m.d === 1 ? m.n : decOf(m)} x 10^${e}`;
/** v as scientific notation: { m: Fr in [1,10), e } (v positive, and m terminating). */
function sciOf(v) {
  let e = 0;
  let m = v;
  while (m.cmp(fr(10)) >= 0) {
    m = m.div(fr(10));
    e++;
  }
  while (m.cmp(fr(1)) < 0) {
    m = m.mul(fr(10));
    e--;
  }
  return { m, e };
}
const pow10 = (e) => (e >= 0 ? fr(10 ** e) : fr(1, 10 ** -e));

const exExpoN = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const base = rng.pick(level === 1 ? [2, 3, 4, 5, 10] : [2, 3, 5, 6, 7, 10]);
    const op = rng.pick(["mul", "div", "pow", "mul", "div"]);
    let a;
    let b;
    if (level === 1) {
      a = rng.int(2, 7);
      b = rng.int(2, 6);
      if (op === "div") a = b + rng.int(1, 5);
      if (op === "pow") {
        a = rng.int(2, 5);
        b = rng.int(2, 4);
      }
    } else if (level === 2) {
      a = rng.int(2, 9);
      b = rng.int(2, 9);
      if (op === "div" && rng.chance(0.5)) b = a + rng.int(0, 4);
      if (op === "pow") {
        a = rng.int(2, 6);
        b = rng.int(2, 4);
      }
    } else {
      a = nz(rng, -6, 8);
      b = nz(rng, -5, 7);
      if (op === "pow") {
        a = nz(rng, -5, 6);
        b = rng.pick([2, 3, -2, -3, 4]);
      }
    }
    const n = op === "mul" ? a + b : op === "div" ? a - b : a * b;
    const outerB = b < 0 ? `(${MINUS}${Math.abs(b)})` : String(b);
    const expr = op === "mul" ? `${caret(base, a)} ${TIMES} ${caret(base, b)} = ${base}^n` : op === "div" ? `${caret(base, a)} ${DIVIDE} ${caret(base, b)} = ${base}^n` : `(${caret(base, a)})^${outerB} = ${base}^n`;
    const rule = op === "mul" ? "When you multiply powers with the same base, add the exponents." : op === "div" ? "When you divide powers with the same base, subtract the exponents." : "When you raise a power to a power, multiply the exponents.";
    const calc = op === "mul" ? E(sumTxt(a, b), n) : op === "div" ? E(subTxt(a, b), n) : E(mulTxt(a, b), n);
    const wrong = op === "mul" ? [[a * b, "multiplies-the-exponents"], [a - b, "subtracts-the-exponents"], [a + b + 1, "adds-one-too-many"]] : op === "div" ? [[a + b, "adds-the-exponents"], [b - a, "subtracts-in-the-wrong-order"], [a * b, "multiplies-the-exponents"]] : [[a + b, "adds-the-exponents"], [a ** Math.min(Math.abs(b), 3) * (b < 0 ? -1 : 1), "raises-one-exponent-to-the-other"], [a - b, "subtracts-the-exponents"]];
    return {
      spec: { type: "expo-n", base, op, a, b },
      stem: ST(`Use exponent rules. ${expr}.`, `Use the properties of exponents to complete the statement ${expr}.`, `Apply the properties of exponents to complete the statement ${expr}.`),
      ask: ST("What is the exponent n?", "What is the value of n?", "Determine the value of n."),
      expr,
      answer: A(fr(n)),
      work: [rule, `${calc}.`, `So n = ${num(n)}.`],
      visual: null,
      distractors: D(fr(n), wrong.map(([v, t]) => [fr(v), t])),
      hints: H("Powers with the same base follow rules that connect the operation on the powers to an operation on the exponents.", "Decide whether the exponents should be added, subtracted or multiplied, then do that arithmetic carefully with the signs."),
    };
  },
};

const termTxt = (t) => `${t.base.d === 1 && t.base.n >= 0 ? T(t.base) : `(${T(t.base)})`}^${t.e < 0 ? MINUS : ""}${Math.abs(t.e)}`;
const exEval = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    let terms;
    let op = null;
    if (level === 1) {
      const kind = rng.pick(["zero", "pos", "pos", "negbase"]);
      terms = kind === "zero" ? [{ base: fr(rng.int(2, 9)), e: 0 }] : kind === "negbase" ? [{ base: fr(-rng.int(2, 4)), e: rng.pick([2, 3]) }] : [{ base: fr(rng.int(2, 6)), e: rng.int(2, 4) }];
    } else if (level === 2) {
      const kind = rng.pick(["neg", "neg", "zero", "negbase", "frac"]);
      terms = kind === "neg" ? [{ base: fr(rng.pick([2, 3, 4, 5, 10])), e: -rng.int(1, 4) }] : kind === "zero" ? [{ base: fr(-rng.int(2, 9)), e: 0 }] : kind === "negbase" ? [{ base: fr(-rng.int(2, 5)), e: rng.pick([2, 3, 4]) }] : [{ base: rng.pick([fr(1, 2), fr(1, 3), fr(2, 3)]), e: rng.pick([2, 3]) }];
    } else {
      const kind = rng.pick(["two", "two", "fracneg", "neg"]);
      if (kind === "two") {
        const base = fr(rng.pick([2, 3, 5, 10]));
        op = rng.pick(["mul", "div"]);
        terms = [{ base, e: nz(rng, -3, 4) }, { base, e: nz(rng, -3, 4) }];
      } else if (kind === "fracneg") terms = [{ base: fr(1, rng.pick([2, 3, 4, 5])), e: -rng.int(1, 3) }];
      else terms = [{ base: fr(rng.pick([2, 3, 4])), e: -rng.int(2, 4) }];
    }
    const val = op ? (op === "mul" ? powF(terms[0].base, terms[0].e).mul(powF(terms[1].base, terms[1].e)) : powF(terms[0].base, terms[0].e).div(powF(terms[1].base, terms[1].e))) : powF(terms[0].base, terms[0].e);
    const expr = op ? `${termTxt(terms[0])} ${op === "mul" ? TIMES : DIVIDE} ${termTxt(terms[1])}` : termTxt(terms[0]);
    const t0 = terms[0];
    let wrong;
    if (op) {
      const b = t0.base;
      wrong = [[powF(b, op === "mul" ? terms[0].e * terms[1].e : terms[0].e * terms[1].e), "multiplies-the-exponents"], [op === "mul" ? powF(b, terms[0].e - terms[1].e) : powF(b, terms[0].e + terms[1].e), op === "mul" ? "subtracts-the-exponents" : "adds-the-exponents"], [powF(b, terms[0].e).add(powF(b, terms[1].e)), "adds-the-values-of-the-powers"], [powF(b, -(terms[0].e + (op === "mul" ? terms[1].e : -terms[1].e))), "flips-the-sign-of-the-result-exponent"]];
    } else if (t0.e === 0) wrong = [[fr(0), "thinks-a-zero-exponent-gives-zero"], [t0.base, "thinks-a-zero-exponent-gives-the-base"], [fr(-1), "thinks-a-zero-exponent-gives-negative-one"], [t0.base.mul(fr(2)), "doubles-the-base"]];
    else if (t0.e < 0) wrong = [[powF(t0.base, -t0.e), "ignores-the-negative-sign-of-the-exponent"], [negF(powF(t0.base, -t0.e)), "makes-the-answer-negative"], [t0.base.mul(fr(t0.e)), "multiplies-the-base-by-the-exponent"], [powF(t0.base.mul(fr(-1)), -t0.e).mul(fr(-1)), "mixes-up-signs"]];
    else wrong = [[t0.base.mul(fr(t0.e)), "multiplies-the-base-by-the-exponent"], [negF(powF(t0.base.n < 0 ? negF(t0.base) : t0.base, t0.e)), "gets-the-sign-wrong"], [powF(t0.base, t0.e - 1), "uses-one-fewer-factor"], [powF(t0.base, t0.e + 1), "uses-one-extra-factor"]];
    const work = [];
    if (op) {
      work.push(`${termTxt(terms[0])} = ${T(powF(terms[0].base, terms[0].e))} and ${termTxt(terms[1])} = ${T(powF(terms[1].base, terms[1].e))}.`);
      work.push(`${op === "mul" ? "Multiply" : "Divide"} the two values to get ${T(val)}.`);
    } else if (t0.e === 0) work.push("Any nonzero number to the power 0 is 1.");
    else if (t0.e < 0) work.push("A negative exponent means the reciprocal of the matching positive power.", `${termTxt({ base: t0.base, e: -t0.e })} is ${T(powF(t0.base, -t0.e))}.`, `${E(`1 ${DIVIDE} ${pf(powF(t0.base, -t0.e))}`, val)}.`);
    else work.push(`${T(t0.base)} to the power ${t0.e} means ${T(t0.base)} used as a factor ${t0.e} times.`, `That product is ${T(val)}.`);
    return {
      spec: { type: "eval", terms: terms.map((t) => ({ base: S(t.base), e: t.e })), op },
      stem: ST(`Find the value of ${expr}.`, `Evaluate ${expr}.`, `Evaluate the expression ${expr}.`),
      ask: ST("Write the value as a whole number or a fraction.", "Write your answer as a whole number or a fraction.", "Write the value as a whole number or as a fraction in simplest form."),
      expr,
      answer: A(val),
      work,
      visual: null,
      distractors: D(val, wrong),
      hints: H("An exponent tells how many times the base is used as a factor, and zero and negative exponents follow patterns that continue the same rules.", "Rewrite the power using its meaning, then compute. For a negative exponent, take the reciprocal of the matching positive power."),
    };
  },
};

const BIG_THINGS = ["pencils", "books", "stickers", "tickets"];
const SMALL_ITEMS = [(v) => `A grain of dust is ${v} meters wide.`, (v) => `A thread is ${v} meters thick.`, (v) => `A cell is ${v} meters across.`, (v) => `A speck of pollen is ${v} meters wide.`];
const sciAsk = ST("Write it in scientific notation. The first number must be at least 1 and less than 10.", "Write the number in scientific notation. The first number must be at least 1 and less than 10.", "Write the number in scientific notation, with a first factor that is at least 1 and less than 10.");
const exSciTo = {
  lv: [1, 2, 3],
  gen({ rng, level, ctx }) {
    const small = level >= 2 && rng.chance(0.55);
    const mm = rng.chance(0.25) ? fr(rng.int(2, 9)) : level === 3 && rng.chance(0.4) ? fr(rng.int(101, 999), 100) : fr(rng.int(11, 99), 10);
    const e = small ? -rng.int(3, 8) : rng.int(level === 1 ? 3 : 4, level === 1 ? 6 : 9);
    const v = mm.mul(pow10(e));
    const vT = T(v, true);
    const { m: m2, e: e2 } = sciOf(v);
    const zeros = e2 > 0 ? String(v.n).replace(/[1-9]/g, "").length : null;
    const ans = sciText(m2, e2);
    const th = thing(rng, ctx);
    const stem = small ? (() => { const f = rng.pick(SMALL_ITEMS)(vT); return ST(f, f, f); })() : ST(`A factory makes ${vT} ${th.many}.`, `A factory makes ${vT} ${th.many} in one year.`, `A factory produces ${vT} ${th.many} in one year.`);
    const digitsMoved = Math.abs(e2);
    const cands = [
      [sciText(m2.mul(fr(10)), e2 - 1), "leaves-the-first-number-too-large"],
      [sciText(m2, e2 + (e2 > 0 ? 1 : -1)), "miscounts-the-places-moved"],
      [sciText(m2, -e2), "gets-the-sign-of-the-exponent-wrong"],
      [zeros != null && zeros !== e2 ? sciText(m2, zeros) : null, "counts-the-zeros-instead-of-the-places-moved"],
    ];
    return {
      spec: { type: "sci-to", v: S(v) },
      stem,
      ask: sciAsk,
      expr: null,
      answer: { value: ans, kind: "text" },
      work: [`Move the decimal point so that the first number is at least 1 and less than 10: the first number is ${m2.d === 1 ? m2.n : decOf(m2)}.`, `The decimal point moves ${digitsMoved} places ${e2 > 0 ? "to the left, so the exponent is positive" : "to the right, so the exponent is negative"}.`, `So the number is ${ans}.`],
      visual: null,
      distractors: DS(ans, cands),
      hints: H("Scientific notation writes a number as a first factor between 1 and 10 times a power of 10.", "Count how many places the decimal point moves to get a first factor between 1 and 10. Large numbers give a positive exponent and small numbers give a negative exponent."),
    };
  },
};

const exSciFrom = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const m = rng.chance(0.3) ? fr(rng.int(2, 9)) : fr(rng.int(11, 99), 10);
    const e = level === 1 ? rng.int(2, 5) : level === 2 ? (rng.chance(0.5) ? -rng.int(2, 5) : rng.int(3, 7)) : rng.pick([-6, -5, 6, 7, 8, -4]);
    const v = m.mul(pow10(e));
    const mT = m.d === 1 ? String(m.n) : decOf(m);
    const ans = A(v, { dec: true });
    ans.text = T(v, true);
    const cands = e >= 0 ? [[v.mul(fr(10)), "moves-the-decimal-point-one-place-too-far"], [v.div(fr(10)), "moves-the-decimal-point-one-place-too-few"], [m.mul(m.d === 1 ? fr(1) : fr(10)).mul(pow10(e)), "adds-zeros-and-ignores-the-decimal-point"], [m.mul(pow10(-e)), "moves-the-decimal-point-the-wrong-way"]] : [[m.mul(pow10(-e)), "moves-the-decimal-point-the-wrong-way"], [v.mul(fr(10)), "moves-the-decimal-point-one-place-too-few"], [v.div(fr(10)), "moves-the-decimal-point-one-place-too-far"], [fr(-1).mul(v), "makes-the-answer-negative"]];
    const sexp = `${mT} ${TIMES} 10^${e < 0 ? MINUS : ""}${Math.abs(e)}`;
    return {
      spec: { type: "sci-from", m: S(m), e },
      stem: ST(`Write ${sexp} as a regular number.`, `Write ${sexp} in standard form.`, `Write ${sexp} in standard form.`),
      ask: ST("What is the regular number?", "What is the number in standard form?", "What is the number in standard form?"),
      expr: sexp,
      answer: ans,
      work: [`The exponent is ${e < 0 ? MINUS : ""}${Math.abs(e)}, so move the decimal point ${Math.abs(e)} places ${e > 0 ? "to the right" : "to the left"}.`, `${sexp} gives ${T(v, true)}.`],
      visual: null,
      distractors: D(v, cands, true),
      hints: H("A positive power of 10 makes a number larger and a negative power of 10 makes it smaller.", "Move the decimal point as many places as the exponent says, to the right if the exponent is positive and to the left if it is negative."),
    };
  },
};

const SCI_THINGS = [{ what: "mass", unit: "grams", a: "Sample A", b: "Sample B" }, { what: "length", unit: "meters", a: "Rope A", b: "Rope B" }, { what: "number of seeds", unit: "seeds", a: "Bag A", b: "Bag B" }, { what: "volume", unit: "liters", a: "Tank A", b: "Tank B" }];
const exSciRatio = {
  lv: [2, 3],
  gen({ rng, level }) {
    let ma;
    let mb;
    let ea;
    let eb;
    if (level === 2) {
      ma = fr(1);
      mb = fr(1);
      eb = rng.int(1, 4);
      ea = eb + rng.int(2, 5);
    } else {
      mb = fr(rng.pick([1, 2, 4, 5]));
      do ma = fr(rng.int(1, 9));
      while (eqF(ma, mb));
      eb = rng.int(-2, 4);
      ea = eb + rng.int(2, 6);
    }
    const ratio = ma.div(mb).mul(pow10(ea - eb));
    const th = rng.pick(SCI_THINGS);
    const fa = eqF(ma, fr(1)) ? caret(10, ea) : `${T(ma)} ${TIMES} ${caret(10, ea)}`;
    const fb = eqF(mb, fr(1)) ? caret(10, eb) : `${T(mb)} ${TIMES} ${caret(10, eb)}`;
    const ans = A(ratio);
    ans.text = T(ratio);
    return {
      spec: { type: "sci-ratio", a: { m: S(ma), e: ea }, b: { m: S(mb), e: eb } },
      stem: ST(`The ${th.what} of ${th.a} is ${fa} ${th.unit}. The ${th.what} of ${th.b} is ${fb} ${th.unit}.`, `The ${th.what} of ${th.a} is ${fa} ${th.unit}, and the ${th.what} of ${th.b} is ${fb} ${th.unit}.`, `${th.a} has a ${th.what} of ${fa} ${th.unit}. ${th.b} has a ${th.what} of ${fb} ${th.unit}.`),
      ask: ST(`How many times as big is the ${th.what} of ${th.a} as the ${th.what} of ${th.b}?`, `${th.a} is how many times as great as ${th.b}?`, `By what factor does the ${th.what} of ${th.a} exceed the ${th.what} of ${th.b}?`),
      expr: null,
      answer: ans,
      work: [`Divide the first factors: ${T(ma)} ${DIVIDE} ${T(mb)} is ${T(ma.div(mb), true)}.`, `Divide the powers of 10 by subtracting the exponents: ${E(subTxt(ea, eb), ea - eb)}, so the powers of 10 give 10^${ea - eb}.`, `Multiply: ${T(ma.div(mb), true)} times ${T(pow10(ea - eb))} is ${T(ratio)}.`],
      visual: null,
      distractors: D(ratio, [[pow10(ea - eb), "ignores-the-first-factors"], [ma.div(mb), "ignores-the-powers-of-ten"], [ratio.mul(fr(10)), "is-off-by-one-power-of-ten"], [ratio.div(fr(10)), "is-off-by-one-power-of-ten"], [pow10(ea + eb), "adds-the-exponents"]], true),
      hints: H("Comparing two numbers by size means dividing them. Divide the first factors and the powers of 10 separately.", "Divide the numbers in front, subtract the exponents of 10, then multiply the two results."),
    };
  },
};

const exSciMul = {
  lv: [3],
  gen({ rng }) {
    let op;
    let ma;
    let mb;
    let ea;
    let eb;
    let value;
    for (let t = 0; t < 2000; t++) {
      op = rng.pick(["mul", "div", "mul"]);
      ma = fr(rng.pick([1.5, 2, 2.5, 3, 4, 4.8, 5, 6, 7, 8, 9].map((x) => Math.round(x * 10)), ), 10);
      mb = fr(rng.pick([1.2, 2, 2.4, 2.5, 3, 4, 5, 6, 8].map((x) => Math.round(x * 10))), 10);
      ea = nz(rng, -6, 8);
      eb = nz(rng, -6, 8);
      value = op === "mul" ? ma.mul(mb).mul(pow10(ea + eb)) : ma.div(mb).mul(pow10(ea - eb));
      if (!isTerm(value)) continue;
      if (Math.abs(ea + (op === "mul" ? eb : -eb)) > 11 || eqF(ma, mb)) continue;
      break;
    }
    const f = (m, e) => `${T(m, true)} ${TIMES} 10^${e < 0 ? MINUS : ""}${Math.abs(e)}`;
    const { m, e } = sciOf(value);
    const ans = sciText(m, e);
    const mProd = op === "mul" ? ma.mul(mb) : ma.div(mb);
    const eRaw = op === "mul" ? ea + eb : ea - eb;
    const normalized = mProd.cmp(fr(10)) >= 0 || mProd.cmp(fr(1)) < 0;
    const cands = [
      normalized ? [sciText(mProd, eRaw), "forgets-to-write-the-first-number-between-1-and-10"] : null,
      normalized ? [sciText(m, eRaw), "forgets-to-adjust-the-exponent"] : null,
      op === "mul" ? [sciText(mProd, ea - eb), "subtracts-the-exponents-when-multiplying"] : [sciText(mProd, ea + eb), "adds-the-exponents-when-dividing"],
      [sciText(m, op === "mul" ? ea * eb : ea * eb), "multiplies-the-exponents"],
      [sciText(m, e + 1), "adjusts-the-exponent-the-wrong-way"],
      [sciText(m, e - 1), "adjusts-the-exponent-the-wrong-way"],
      [sciText(m, ea), "uses-only-the-first-exponent"],
      [sciText(m, eb), "uses-only-the-second-exponent"],
    ].filter(Boolean);
    const work = [];
    work.push(op === "mul" ? `Multiply the first factors: ${T(ma, true)} ${TIMES} ${T(mb, true)} = ${T(mProd, true)}.` : `Divide the first factors: ${T(ma, true)} ${DIVIDE} ${T(mb, true)} = ${T(mProd, true)}.`);
    work.push(op === "mul" ? `Add the exponents: ${E(sumTxt(ea, eb), eRaw)}.` : `Subtract the exponents: ${E(subTxt(ea, eb), eRaw)}.`);
    if (normalized) work.push(`${T(mProd, true)} is not between 1 and 10, so rewrite ${T(mProd, true)} as ${T(m, true)} times ${mProd.cmp(fr(10)) >= 0 ? "10" : "one tenth"}, and change the exponent to ${num(e)}.`);
    work.push(`The answer is ${ans}.`);
    const expr = op === "mul" ? `(${f(ma, ea)}) ${TIMES} (${f(mb, eb)})` : `(${f(ma, ea)}) ${DIVIDE} (${f(mb, eb)})`;
    return {
      spec: { type: "sci-mul", op, a: { m: S(ma), e: ea }, b: { m: S(mb), e: eb } },
      stem: ST(`Work out ${expr}.`, `Find ${expr}.`, `Calculate ${expr}.`),
      ask: ST("Write the answer in scientific notation. The first number must be at least 1 and less than 10.", "Write the answer in scientific notation. The first number must be at least 1 and less than 10.", "Write the answer in scientific notation, with a first factor that is at least 1 and less than 10."),
      expr,
      answer: { value: ans, kind: "text" },
      work,
      visual: null,
      distractors: DS(ans, cands),
      hints: H("Multiply or divide the first factors, and handle the powers of 10 with the exponent rules. The final first factor must be between 1 and 10.", "Do the first factors, then add the exponents for multiplication or subtract them for division. If the first factor is out of range, move the decimal point and adjust the exponent."),
    };
  },
};

FAMILIES.exponents = {
  title: "Exponents and scientific notation",
  grades: [8],
  defaults: {},
  gen(rng, params, opts) {
    const level = opts.level;
    const t = pickType(rng, level, [exExpoN, exExpoN, exEval, exSciTo, exSciFrom, exSciRatio, exSciMul]);
    return done({ family: "exponents", level, ...t.gen({ rng, level, ctx: opts.ctx }) });
  },
};

// ================================================================================================================ irrational numbers
const sqrtTxt = (v) => (v.d === 1 ? `√${num(v.n)}` : `√(${T(v)})`);
const cubeWord = (v) => (v.d === 1 ? `the cube root of ${num(v.n)}` : `the cube root of ${T(v)}`);
const irRoot = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const cube = level === 1 ? rng.chance(0.3) : rng.chance(0.45);
    let r = fr(2);
    if (!cube) r = level === 1 ? fr(rng.int(2, 12)) : level === 2 ? (rng.chance(0.5) ? fr(rng.int(13, 20)) : fr(rng.int(1, 8), rng.pick([3, 4, 5, 6, 7, 9]))) : fr(rng.int(1, 9), rng.pick([2, 3, 4, 5, 7, 8, 10, 11]));
    else r = level === 1 ? fr(rng.int(2, 5)) : level === 2 ? (rng.chance(0.6) ? fr(rng.int(2, 10)) : fr(rng.int(1, 4), rng.pick([2, 3, 4, 5]))) : fr(rng.chance(0.55) ? -rng.int(2, 9) : rng.int(1, 4), rng.chance(0.5) ? 1 : rng.pick([2, 3, 4, 5]));
    if (eqF(r, fr(1))) r = fr(2);
    const v = cube ? r.mul(r).mul(r) : r.mul(r);
    const expr = cube ? cubeWord(v) : sqrtTxt(v);
    const rT = T(r);
    const wrong = cube ? [[v.div(fr(3)), "divides-by-3-instead-of-taking-the-root"], [r.add(fr(1)), "uses-a-nearby-cube"], [r.sub(fr(1)), "uses-a-nearby-cube"], [absF(r), "drops-the-negative-sign"], [r.mul(fr(3)), "multiplies-the-root-by-3"]] : [[v.div(fr(2)), "halves-instead-of-taking-the-root"], [r.add(fr(1)), "uses-a-nearby-square"], [r.sub(fr(1)), "uses-a-nearby-square"], [v.mul(v), "squares-instead-of-taking-the-root"], [r.mul(fr(2)), "doubles-the-root"]];
    return {
      spec: { type: "root", n: cube ? 3 : 2, v: S(v) },
      stem: ST(`Find ${expr}.`, `Evaluate ${expr}.`, `Evaluate ${expr}.`),
      ask: ST("What is the value? Write a whole number or a fraction.", "Write your answer as a whole number or a fraction.", "Write the exact value as a whole number or as a fraction in simplest form."),
      expr: cube ? null : sqrtTxt(v),
      answer: A(r),
      work: cube ? [`Look for a number that, used as a factor 3 times, gives ${T(v)}.`, `${rT} times ${rT} times ${rT} makes ${T(v)}, so the cube root is ${rT}.`] : [`Look for a number that multiplies by itself to give ${T(v)}.`, `${rT} times ${rT} makes ${T(v)}, so the square root is ${rT}.`],
      visual: null,
      distractors: D(r, wrong),
      hints: H(cube ? "A cube root undoes cubing: it is the number that, multiplied by itself three times, gives the number inside." : "A square root undoes squaring: it is the number that, multiplied by itself, gives the number inside.", "Think of a number that works, and check it by multiplying. For a fraction, take the root of the top and the bottom separately."),
    };
  },
};

const irBetween = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const cube = level === 3 && rng.chance(0.4);
    let v;
    let k;
    if (cube) {
      do v = rng.int(2, 215);
      while (Math.round(Math.cbrt(v)) ** 3 === v);
      k = Math.floor(Math.cbrt(v));
      while ((k + 1) ** 3 <= v) k++;
      while (k ** 3 > v) k--;
    } else {
      do v = level === 1 ? rng.int(2, 50) : rng.int(2, 170);
      while (isqrt(v) ** 2 === v);
      k = isqrt(v);
    }
    const ans = `${k} and ${k + 1}`;
    const expr = cube ? `the cube root of ${v}` : `√${v}`;
    const cands = [[`${k + 1} and ${k + 2}`, "picks-the-next-pair-of-integers"], [k >= 1 ? `${k - 1} and ${k}` : null, "picks-the-previous-pair-of-integers"], [`${Math.floor(v / (cube ? 3 : 2))} and ${Math.floor(v / (cube ? 3 : 2)) + 1}`, cube ? "divides-by-3-instead-of-estimating-the-root" : "halves-instead-of-estimating-the-root"], [`${k + 2} and ${k + 3}`, "overestimates-the-root"]];
    return {
      spec: { type: "between", n: cube ? 3 : 2, v },
      stem: ST(`Think about ${expr}. It is not a whole number.`, `${cap(expr)} is not a whole number.`, `${cap(expr)} is irrational.`),
      ask: ST("Between which two whole numbers is it?", "Between which two consecutive integers does it lie?", "Between which two consecutive integers does its value lie?"),
      expr: null,
      answer: { value: ans, kind: "text" },
      work: cube ? [`Find the nearest perfect cubes: ${k}^3 is ${k ** 3} and ${k + 1}^3 is ${(k + 1) ** 3}.`, `${v} is between ${k ** 3} and ${(k + 1) ** 3}, so the cube root of ${v} is between ${k} and ${k + 1}.`] : [`Find the nearest perfect squares: ${k} times ${k} is ${k * k} and ${k + 1} times ${k + 1} is ${(k + 1) * (k + 1)}.`, `${v} is between ${k * k} and ${(k + 1) * (k + 1)}, so √${v} is between ${k} and ${k + 1}.`],
      visual: { kind: "numberline", alt: `A number line from 0 to ${k + 3} with whole numbers marked.`, min: 0, max: k + 3, ticks: k + 3, marks: [], hops: [], show: "int" },
      distractors: DS(ans, cands),
      hints: H("A number that is not a perfect square or cube sits between two perfect squares or cubes, so its root sits between two whole numbers.", "List perfect squares (or cubes) near the number, find the two it sits between, and take their roots."),
    };
  },
};

const irClosest = {
  lv: [2, 3],
  gen({ rng }) {
    let v;
    do v = rng.int(3, 150);
    while (isqrt(v) ** 2 === v);
    const k = isqrt(v);
    const near = v <= k * k + k ? k : k + 1;
    return {
      spec: { type: "closest", v },
      stem: ST(`Think about √${v}. It is not a whole number.`, `√${v} is not a whole number.`, `√${v} is irrational.`),
      ask: ST("Which whole number is it closest to?", "Which whole number is it closest to?", "Which integer is nearest to its value?"),
      expr: null,
      answer: A(fr(near)),
      work: [`The perfect squares around ${v} are ${k * k} and ${(k + 1) * (k + 1)}, so √${v} is between ${k} and ${k + 1}.`, `The halfway point between ${k} and ${k + 1} is ${k}.5, and ${k}.5 times ${k}.5 is ${k * k + k}.25.`, `${v} is ${v <= k * k + k ? "less than" : "greater than"} ${k * k + k}.25, so √${v} is closer to ${near}.`],
      visual: null,
      distractors: D(fr(near), [[fr(near === k ? k + 1 : k), "picks-the-other-end-of-the-interval"], [fr(Math.round(v / 2)), "halves-instead-of-estimating-the-root"], [fr(k + 2), "overestimates-the-root"], [fr(Math.max(k - 1, 0)), "underestimates-the-root"]]),
      hints: H("A square root is closer to the whole number whose square is closer to the number.", "Find the two perfect squares around the number, then see which one is nearer."),
    };
  },
};

const irCompare = {
  lv: [2, 3],
  gen({ rng, level }) {
    let a;
    let bT;
    if (level === 2) {
      const b = rng.int(4, 13);
      a = b * b + rng.pick([-3, -2, -1, 1, 2, 3, 5, -5]);
      bT = String(b);
    } else {
      const bd = rng.int(31, 129) / 10;
      const b2 = bd * bd;
      a = Math.round(b2) + rng.pick([-1, 0, 1, 2, -2]);
      bT = bd.toFixed(1);
      if (Math.abs(a - b2) < 0.02) a += 1;
    }
    const aBig = R_gt(a, bT);
    const ans = aBig ? `√${a}` : bT;
    const other = aBig ? bT : `√${a}`;
    return {
      spec: { type: "compare", a, b: bT },
      stem: ST(`Look at the numbers √${a} and ${bT}.`, `Compare the numbers √${a} and ${bT}.`, `Compare the numbers √${a} and ${bT}.`),
      ask: ST("Which number is greater?", "Which number is greater?", "Which number is greater?"),
      expr: null,
      answer: { value: ans, kind: "text" },
      work: [`Square ${bT}: ${bT} times ${bT} is ${sqD(bT)}.`, `Compare ${a} with ${sqD(bT)}: ${a} is ${aBig ? "greater" : "less"} than ${sqD(bT)}.`, `So ${aBig ? `√${a}` : bT} is greater.`],
      visual: null,
      distractors: dist([[other, "compares-the-wrong-way"], ["They are equal", "assumes-a-square-root-equals-the-nearby-number"], ["It is impossible to tell without a calculator", "thinks-a-calculator-is-needed"]]),
      hints: H("To compare a square root with another number, square both numbers and compare the squares.", "Square the number that is not a root, then compare it with the number under the square root sign."),
    };
  },
};
const sqD = (s) => {
  const f = s.includes(".") ? Number(s.replace(".", "")) : Number(s);
  const places = s.includes(".") ? s.split(".")[1].length : 0;
  const sq = f * f;
  return places === 0 ? String(sq) : (sq / 10 ** (2 * places)).toFixed(2 * places);
};
const R_gt = (a, bT) => {
  // a > b^2 with b a decimal text, in exact integer arithmetic
  const places = bT.includes(".") ? bT.split(".")[1].length : 0;
  const bi = Number(bT.replace(".", ""));
  return a * 10 ** (2 * places) > bi * bi;
};

const CLASSIFY = [
  (rng) => {
    let v;
    do v = rng.int(2, 99);
    while (isqrt(v) ** 2 === v);
    return { k: "sqrt", v: String(v), text: `√${v}`, ans: "irrational", wrongTag: "thinks-a-calculator-decimal-means-rational" };
  },
  (rng) => {
    const r = rng.int(2, 12);
    return { k: "sqrt", v: String(r * r), text: `√${r * r}`, ans: "rational", wrongTag: "thinks-every-square-root-is-irrational" };
  },
  (rng) => {
    const r = rng.int(2, 6);
    return { k: "cbrt", v: String(r ** 3), text: `the cube root of ${r ** 3}`, ans: "rational", wrongTag: "thinks-every-root-is-irrational" };
  },
  (rng) => {
    let v;
    do v = rng.int(2, 100);
    while (Math.round(Math.cbrt(v)) ** 3 === v);
    return { k: "cbrt", v: String(v), text: `the cube root of ${v}`, ans: "irrational", wrongTag: "thinks-a-calculator-decimal-means-rational" };
  },
  (rng) => {
    const d = rng.pick(["0.75", "2.5", "0.125", "3.2", "1.6"]);
    return { k: "dec", v: d, text: d, ans: "rational", wrongTag: "thinks-decimals-are-irrational" };
  },
  (rng) => {
    const d = rng.pick(["3", "6", "7", "1", "4"]);
    return { k: "rep", v: d, text: `0.${d}${d}${d}... (the digit ${d} repeats forever)`, ans: "rational", wrongTag: "thinks-a-decimal-that-never-ends-is-irrational" };
  },
  () => ({ k: "pi", v: "pi", text: "π", ans: "irrational", wrongTag: "thinks-pi-equals-22-over-7" }),
  (rng) => {
    const f = rng.pick(["−7/3", "5/8", "−4/9", "11/6"]);
    return { k: "frac", v: f, text: f, ans: "rational", wrongTag: "thinks-a-fraction-with-a-repeating-decimal-is-irrational" };
  },
  () => ({ k: "pattern", v: "pattern", text: "0.1010010001... (the pattern never repeats)", ans: "irrational", wrongTag: "thinks-a-decimal-that-never-ends-is-rational" }),
];
const irClassify = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const pool = level === 1 ? [0, 1, 4, 6] : level === 2 ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 3, 5, 6, 7, 8, 2];
    const it = CLASSIFY[rng.pick(pool)](rng);
    const opp = it.ans === "rational" ? "irrational" : "rational";
    return {
      spec: { type: "classify", kind: it.k, v: it.v },
      stem: ST(`Look at this number: ${it.text}.`, `Consider the number ${it.text}.`, `Consider the number ${it.text}.`),
      ask: ST("Is it rational or irrational?", "Is the number rational or irrational?", "Is the number rational or irrational?"),
      expr: null,
      answer: { value: it.ans, kind: "text" },
      work: it.ans === "rational" ? [`A rational number can be written as a fraction of two integers.`, it.k === "sqrt" || it.k === "cbrt" ? `The number under the root is a perfect ${it.k === "sqrt" ? "square" : "cube"}, so the root is a whole number, which is rational.` : it.k === "rep" ? "A decimal that repeats can be written as a fraction, so it is rational." : it.k === "dec" ? "A decimal that stops can be written as a fraction, so it is rational." : "It is already written as a fraction of integers, so it is rational."] : [`An irrational number cannot be written as a fraction of two integers. Its decimal never stops and never repeats.`, it.k === "sqrt" || it.k === "cbrt" ? `The number under the root is not a perfect ${it.k === "sqrt" ? "square" : "cube"}, so the root is irrational.` : it.k === "pi" ? "The decimal for pi never stops and never repeats, so pi is irrational." : "The pattern in its decimal never repeats, so it is irrational."],
      visual: null,
      distractors: dist([[opp, it.wrongTag], ["neither rational nor irrational", "thinks-it-is-not-a-real-number"], ["both rational and irrational", "mixes-up-the-definitions"]]),
      hints: H("A rational number can be written as a fraction of two integers. An irrational number cannot.", "Ask whether the decimal stops, repeats, or goes on forever with no pattern. For a root, ask whether the number inside is a perfect square or cube."),
    };
  },
};

const irOrder = {
  lv: [3],
  gen({ rng }) {
    for (let t = 0; t < 500; t++) {
      const n = 3;
      const items = [];
      const seen = new Set();
      while (items.length < n) {
        if (rng.chance(0.55)) {
          const v = rng.int(5, 120);
          if (isqrt(v) ** 2 === v) continue;
          items.push({ k: "sqrt", v: String(v) });
        } else items.push({ k: "num", v: (rng.int(20, 110) / 10).toFixed(1) });
      }
      const sq = (it) => (it.k === "sqrt" ? Number(it.v) : Number(it.v) ** 2);
      const sorted = [...items].sort((a, b) => sq(a) - sq(b));
      const sqs = sorted.map(sq);
      if (new Set(sqs.map((v) => v.toFixed(6))).size < 3) continue;
      if (items.filter((i) => i.k === "sqrt").length < 1 || items.filter((i) => i.k === "num").length < 1) continue;
      if (Math.min(sqs[1] - sqs[0], sqs[2] - sqs[1]) < 1.5) continue;
      const txt = (it) => (it.k === "sqrt" ? `√${it.v}` : it.v);
      const ans = sorted.map(txt).join(", ");
      const rev = [...sorted].reverse().map(txt).join(", ");
      const lit = [...items].sort((a, b) => Number(a.v) - Number(b.v)).map(txt).join(", ");
      const swap = [sorted[1], sorted[0], sorted[2]].map(txt).join(", ");
      const swap2 = [sorted[0], sorted[2], sorted[1]].map(txt).join(", ");
      const shown = rng.shuffle(items);
      return {
        spec: { type: "order", items: shown },
        stem: ST(`Look at these three numbers: ${shown.map(txt).join(", ")}.`, `Consider the numbers ${shown.map(txt).join(", ")}.`, `Consider the numbers ${shown.map(txt).join(", ")}.`),
        ask: ST("Write them from least to greatest. Put a comma between the numbers.", "Write the numbers in order from least to greatest, separated by commas.", "Order the numbers from least to greatest, separated by commas."),
        expr: null,
        answer: { value: ans, kind: "text" },
        work: [`Compare √ numbers with decimals by squaring: the square of a decimal is its value times itself, and the square of √v is v.`, `The squares in order are ${sorted.map((it) => (it.k === "sqrt" ? it.v : sqD(it.v))).join(", ")}.`, `So the order is ${ans}.`],
        visual: null,
        distractors: DS(ans, [[rev, "orders-from-greatest-to-least"], [lit, "orders-by-the-number-without-looking-at-the-root-sign"], [swap, "mixes-up-two-numbers"], [swap2, "mixes-up-two-numbers"]]),
        hints: H("A square root and a decimal can be compared by squaring both of them, because squaring keeps the order of positive numbers.", "Square each number. The square of √v is v. Then put the squares in order and rewrite the original numbers."),
      };
    }
    throw new Error("could not build an ordering problem");
  },
};

const irSolve = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const cube = level === 1 ? rng.chance(0.3) : rng.chance(0.4);
    let r;
    if (!cube) r = level === 3 ? fr(rng.int(1, 12), rng.pick([1, 2, 3, 4, 5, 6, 7, 8, 9])) : fr(rng.int(2, level === 1 ? 12 : 16));
    else r = level === 3 ? fr(-rng.int(2, 7)) : fr(rng.int(2, level === 1 ? 5 : 8));
    const v = cube ? r.mul(r).mul(r) : r.mul(r);
    const story = r.d === 1 && r.n > 0 && rng.chance(0.65);
    const u = rng.pick(["feet", "meters", "inches", "centimeters"]);
    const units = { feet: "square feet", meters: "square meters", inches: "square inches", centimeters: "square centimeters" };
    const cubes = { feet: "cubic feet", meters: "cubic meters", inches: "cubic inches", centimeters: "cubic centimeters" };
    const stem = story ? (cube ? ST(`A cube-shaped box holds ${num(v.n)} ${cubes[u]}. All its edges have the same length.`, `A cube-shaped box has a volume of ${num(v.n)} ${cubes[u]}.`, `A cube has a volume of ${num(v.n)} ${cubes[u]}.`) : ST(`A square garden has an area of ${num(v.n)} ${units[u]}. All its sides have the same length.`, `A square garden has an area of ${num(v.n)} ${units[u]}.`, `A square has an area of ${num(v.n)} ${units[u]}.`)) : cube ? ST(`Look at the equation x^3 = ${T(v)}.`, `Solve the equation x^3 = ${T(v)}.`, `Solve the equation x^3 = ${T(v)}.`) : ST(`Look at the equation x^2 = ${T(v)}. Only the positive answer counts.`, `Solve the equation x^2 = ${T(v)}. Give the positive solution.`, `Solve the equation x^2 = ${T(v)}. Give the positive solution.`);
    const ask = story ? (cube ? ST("How long is each edge?", "What is the length of each edge?", "Determine the length of each edge.") : ST("How long is each side?", "What is the length of each side?", "Determine the length of each side.")) : ST("What is x?", "What is x?", "Determine x.");
    const wrong = cube ? [[v.div(fr(3)), "divides-by-3-instead-of-taking-the-cube-root"], [r.add(fr(1)), "uses-a-nearby-cube"], [r.sub(fr(1)), "uses-a-nearby-cube"], [absF(r), "drops-the-negative-sign"], [r.mul(fr(3)), "multiplies-the-root-by-3"]] : [[v.div(fr(2)), "divides-by-2-instead-of-taking-the-square-root"], [r.add(fr(1)), "uses-a-nearby-square"], [r.sub(fr(1)), "uses-a-nearby-square"], [v.mul(fr(2)), "doubles-instead-of-taking-the-square-root"], [r.mul(fr(2)), "doubles-the-root"]];
    return {
      spec: { type: "solve", n: cube ? 3 : 2, v: S(v) },
      stem,
      ask,
      expr: cube ? `x^3 = ${T(v)}` : `x^2 = ${T(v)}`,
      answer: A(r, story ? { unit: u } : {}),
      work: cube ? [story ? `The volume of a cube is edge times edge times edge, so x^3 = ${num(v.n)}.` : `Take the cube root of both sides.`, `${T(r)} times ${T(r)} times ${T(r)} makes ${T(v)}, so x = ${T(r)}.`] : [story ? `The area of a square is side times side, so x^2 = ${num(v.n)}.` : `Take the positive square root of both sides.`, `${T(r)} times ${T(r)} makes ${T(v)}, so x = ${T(r)}.`],
      visual: null,
      distractors: D(r, wrong),
      hints: H(cube ? "To undo x cubed, take the cube root of both sides." : "To undo x squared, take the square root of both sides.", "Think of a number that works and check it by multiplying it by itself the right number of times."),
    };
  },
};

FAMILIES.irrational = {
  title: "Irrational numbers and square roots",
  grades: [8],
  defaults: {},
  gen(rng, params, opts) {
    const level = opts.level;
    const t = pickType(rng, level, [irRoot, irBetween, irClosest, irCompare, irClassify, irOrder, irSolve]);
    return done({ family: "irrational", level, ...t.gen({ rng, level, ctx: opts.ctx }) });
  },
};

// ================================================================================================================ transformations
const pairF = (x, y) => `(${S(x)},${S(y)})`;
const applyStep = (st, [x, y]) => {
  if (st.op === "translate") return [x.add(fr(st.dx)), y.add(fr(st.dy))];
  if (st.op === "reflect") return st.axis === "x" ? [x, negF(y)] : [negF(x), y];
  if (st.op === "rotate") return st.deg === 180 ? [negF(x), negF(y)] : st.dir === "ccw" ? [negF(y), x] : [y, negF(x)];
  return [x.mul(st.kF), y.mul(st.kF)];
};
const stepMutants = (st) => {
  if (st.op === "translate")
    return [[(p) => [p[0].add(fr(st.dy)), p[1].add(fr(st.dx))], "swaps-the-horizontal-and-vertical-moves"], [(p) => [p[0].sub(fr(st.dx)), p[1].sub(fr(st.dy))], "moves-in-the-opposite-direction"], [(p) => [p[0].add(fr(st.dx)), p[1].sub(fr(st.dy))], "gets-the-vertical-direction-wrong"]];
  if (st.op === "reflect") {
    const wrongAxis = st.axis === "x" ? (p) => [negF(p[0]), p[1]] : (p) => [p[0], negF(p[1])];
    return [[wrongAxis, "reflects-over-the-wrong-axis"], [(p) => [negF(p[0]), negF(p[1])], "changes-the-signs-of-both-coordinates"], [(p) => [p[1], p[0]], "swaps-the-coordinates"]];
  }
  if (st.op === "rotate") {
    if (st.deg === 180) return [[(p) => [negF(p[0]), p[1]], "reflects-instead-of-rotating"], [(p) => [p[0], negF(p[1])], "reflects-instead-of-rotating"], [(p) => [p[1], negF(p[0])], "rotates-90-instead-of-180"]];
    return [[(p) => (st.dir === "ccw" ? [p[1], negF(p[0])] : [negF(p[1]), p[0]]), "rotates-the-wrong-direction"], [(p) => [p[1], p[0]], "swaps-the-coordinates-without-changing-a-sign"], [(p) => [negF(p[0]), negF(p[1])], "rotates-180-instead-of-90"]];
  }
  const k = st.kF;
  return [[(p) => [p[0].add(k), p[1].add(k)], "adds-the-scale-factor"], [(p) => [p[0].mul(k), p[1]], "scales-only-the-x-coordinate"], [(p) => [p[0].div(k), p[1].div(k)], "divides-instead-of-multiplying"]];
};
const unitsW = (n) => `${Math.abs(n)} ${Math.abs(n) === 1 ? "unit" : "units"}`;
const stepPhrase = (st) => {
  if (st.op === "translate") {
    const parts = [];
    if (st.dx) parts.push(`${unitsW(st.dx)} ${st.dx > 0 ? "right" : "left"}`);
    if (st.dy) parts.push(`${unitsW(st.dy)} ${st.dy > 0 ? "up" : "down"}`);
    return `translated ${parts.join(" and ")}`;
  }
  if (st.op === "reflect") return `reflected over the ${st.axis}-axis`;
  if (st.op === "rotate") return st.deg === 180 ? "rotated 180° about the origin" : `rotated 90° ${st.dir === "cw" ? "clockwise" : "counterclockwise"} about the origin`;
  return `dilated by a scale factor of ${T(st.kF, true)} from the origin`;
};
const stepRule = (st) => {
  if (st.op === "translate") return `A translation adds ${num(st.dx)} to x and ${num(st.dy)} to y.`;
  if (st.op === "reflect") return st.axis === "x" ? "A reflection over the x-axis keeps x and changes the sign of y." : "A reflection over the y-axis changes the sign of x and keeps y.";
  if (st.op === "rotate") return st.deg === 180 ? "A rotation of 180° about the origin changes the sign of both coordinates." : st.dir === "cw" ? "A rotation of 90° clockwise about the origin sends (x, y) to (y, −x)." : "A rotation of 90° counterclockwise about the origin sends (x, y) to (−y, x).";
  return `A dilation from the origin multiplies both coordinates by the scale factor, ${T(st.kF, true)}.`;
};
const specStep = (st) => (st.op === "dilate" ? { op: "dilate", k: S(st.kF) } : st);
function makeShape(rng, level, even) {
  const tri = level === 1 || rng.chance(0.55);
  for (let t = 0; t < 400; t++) {
    const step = even ? 2 : 1;
    const R = (lo, hi) => step * rng.int(lo, hi);
    if (tri) {
      const pts = [[R(-5, 4), R(-5, 4)], [R(-5, 5), R(-5, 5)], [R(-5, 5), R(-5, 5)]];
      const area2 = (pts[1][0] - pts[0][0]) * (pts[2][1] - pts[0][1]) - (pts[2][0] - pts[0][0]) * (pts[1][1] - pts[0][1]);
      if (area2 !== 0 && new Set(pts.map((p) => p.join())).size === 3 && !pts.some((p) => p[0] === 0 && p[1] === 0)) return { names: "ABC", pts };
    } else {
      const x = R(-5, 2);
      const y = R(-5, 2);
      const w = R(1, 4);
      const h = R(1, 4);
      const rect = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
      if ((w !== h || rng.chance(0.3)) && !rect.some((p) => p[0] === 0 && p[1] === 0)) return { names: "ABCD", pts: rect };
    }
  }
  return { names: "ABC", pts: [[1, 1], [4, 1], [1, 5]] };
}
function randomSteps(rng, level) {
  const tr = () => ({ op: "translate", dx: nz(rng, -6, 6), dy: rng.pick([0, nz(rng, -6, 6), nz(rng, -5, 5)]) });
  const rf = () => ({ op: "reflect", axis: rng.pick(["x", "y"]) });
  const ro = () => (rng.chance(0.3) ? { op: "rotate", deg: 180, dir: "" } : { op: "rotate", deg: 90, dir: rng.pick(["cw", "ccw"]) });
  const di = () => ({ op: "dilate", kF: rng.pick([fr(2), fr(3), fr(1, 2), fr(2)]) });
  if (level === 1) return [rng.chance(0.5) ? tr() : rf()];
  if (level === 2) return rng.pick([[ro()], [di()], [rf(), tr()], [tr(), rf()], [ro()], [di()]]);
  const a = [tr, rf, ro, di];
  const first = rng.pick(a)();
  let second = rng.pick(a)();
  while (second.op === first.op) second = rng.pick(a)();
  return [first, second];
}
const shapeVisual = (names, pts, alt) => {
  const bx = box(Math.max(...pts.map((p) => p[0])) + 1, Math.max(...pts.map((p) => p[1])) + 1, Math.min(...pts.map((p) => p[0])) - 1, Math.min(...pts.map((p) => p[1])) - 1);
  return { kind: "coord", alt, xmin: bx.xmin, xmax: bx.xmax, ymin: bx.ymin, ymax: bx.ymax, step: bx.step, points: [], lines: [], polys: [{ pts: pts.map(([x, y], i) => ({ x: String(x), y: String(y), label: names[i] })), label: names }], labelAxes: ["x", "y"] };
};
const shapeText = (names, pts) => {
  const parts = pts.map(([x, y], i) => `${names[i]}(${num(x)}, ${num(y)})`);
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
};
const shapeNoun = (names) => (names.length === 3 ? "Triangle" : "Rectangle");
const trImage = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    let steps;
    let shape;
    for (let t = 0; t < 400; t++) {
      steps = randomSteps(rng, level);
      const hasHalf = steps.some((s) => s.op === "dilate" && s.kF.d !== 1);
      shape = makeShape(rng, level, hasHalf);
      const target = rng.int(0, shape.pts.length - 1);
      shape.target = target;
      const imgs = shape.pts.map((p) => steps.reduce((q, s) => applyStep(s, q), [fr(p[0]), fr(p[1])]));
      let q = [fr(shape.pts[target][0]), fr(shape.pts[target][1])];
      const moves = steps.every((s) => {
        const nq = applyStep(s, q);
        const moved = !(eqF(nq[0], q[0]) && eqF(nq[1], q[1]));
        q = nq;
        return moved;
      });
      if (moves && imgs.every(([x, y]) => Math.abs(x.n / x.d) <= 14 && Math.abs(y.n / y.d) <= 14) && imgs.every(([x, y]) => x.d === 1 && y.d === 1)) break;
    }
    const { names, pts, target } = shape;
    const v = names[target];
    let cur = [fr(pts[target][0]), fr(pts[target][1])];
    const work = [];
    for (const st of steps) {
      const next = applyStep(st, cur);
      work.push(`${stepRule(st)} The point (${T(cur[0])}, ${T(cur[1])}) goes to (${T(next[0])}, ${T(next[1])}).`);
      cur = next;
    }
    const noun = shapeNoun(names);
    const seq = steps.map(stepPhrase);
    const did = seq.length === 1 ? seq[0] : `${seq[0]}, and then ${seq[1]}`;
    const prime = `${names.split("").map((c) => `${c}′`).join("")}`;
    const ans = pairF(cur[0], cur[1]);
    const cands = [];
    steps.forEach((st, i) => {
      for (const [fn, tag] of stepMutants(st)) {
        let q = [fr(pts[target][0]), fr(pts[target][1])];
        steps.forEach((s, j) => {
          q = j === i ? fn(q) : applyStep(s, q);
        });
        cands.push([pairF(q[0], q[1]), tag]);
      }
    });
    const x0 = pts[target][0];
    const y0 = pts[target][1];
    cands.push([pairF(fr(x0), fr(y0)), "forgets-to-transform-the-point"]);
    cands.push([pairF(cur[0].add(fr(1)), cur[1]), "arithmetic-slip-in-x"]);
    cands.push([pairF(cur[0], cur[1].add(fr(1))), "arithmetic-slip-in-y"]);
    cands.push([pairF(cur[0].sub(fr(1)), cur[1].add(fr(1))), "arithmetic-slip-in-both-coordinates"]);
    cands.push([pairF(cur[0].add(fr(2)), cur[1]), "arithmetic-slip-in-x"]);
    return {
      spec: { type: "transform", names, pts, target, steps: steps.map(specStep) },
      stem: ST(`${noun} ${names} has vertices ${shapeText(names, pts)}. It is ${did}. The new vertices are ${prime}.`, `${noun} ${names} has vertices ${shapeText(names, pts)}. It is ${did}. The image is ${prime}.`, `${noun} ${names} has vertices ${shapeText(names, pts)}. It is ${did}, producing the image ${prime}.`),
      ask: ST(`What are the coordinates of ${v}′? Write them as (x,y).`, `What are the coordinates of ${v}′? Write them as (x,y).`, `Determine the coordinates of ${v}′. Write them as an ordered pair (x,y).`),
      expr: null,
      answer: { value: ans, kind: "pair" },
      work: [...work, `So ${v}′ is at (${T(cur[0])}, ${T(cur[1])}).`],
      visual: shapeVisual(names, pts, `A coordinate grid with ${noun.toLowerCase()} ${names}: ${shapeText(names, pts)}.`),
      distractors: DS(ans, cands),
      hints: H("Every point of a shape moves by the same rule, so you can follow one vertex through each step.", "Write the rule for each transformation as a change to (x, y), then apply the steps to the vertex in order."),
    };
  },
};

const trCongruent = {
  lv: [3],
  gen({ rng, level }) {
    const withDil = rng.chance(0.5);
    const rigidKinds = [() => ({ op: "translate", dx: nz(rng, -6, 6), dy: nz(rng, -6, 6) }), () => ({ op: "reflect", axis: rng.pick(["x", "y"]) }), () => (rng.chance(0.3) ? { op: "rotate", deg: 180, dir: "" } : { op: "rotate", deg: 90, dir: rng.pick(["cw", "ccw"]) })];
    const steps = rng.sample(rigidKinds, withDil ? 2 : rng.pick([2, 3])).map((f) => f());
    if (withDil) steps.splice(rng.int(0, steps.length), 0, { op: "dilate", kF: rng.pick([fr(2), fr(3), fr(1, 2)]) });
    const shape = makeShape(rng, 1, withDil && steps.some((s) => s.kF && s.kF.d !== 1));
    const names = shape.names;
    const noun = shapeNoun(names);
    const prime = names.split("").map((c) => `${c}′`).join("");
    const seq = steps.map(stepPhrase);
    const did = `${seq.slice(0, -1).join(", ")}, and then ${seq[seq.length - 1]}`;
    const congruent = !withDil;
    const dil = steps.find((s) => s.op === "dilate");
    return {
      spec: { type: "congruent", steps: steps.map(specStep) },
      stem: ST(`${noun} ${names} has vertices ${shapeText(names, shape.pts)}. It is ${did}. The new shape is ${prime}.`, `${noun} ${names} has vertices ${shapeText(names, shape.pts)}. It is ${did}. The image is ${prime}.`, `${noun} ${names} has vertices ${shapeText(names, shape.pts)}. It is ${did}, producing the image ${prime}.`),
      ask: ST(`Is ${prime} congruent to ${names}?`, `Is the image ${prime} congruent to the original ${names}?`, `Is the image ${prime} congruent to the original figure ${names}?`),
      expr: null,
      answer: { value: congruent ? "true" : "false", kind: "bool", text: congruent ? "Yes. Translations, reflections and rotations keep every length and angle the same." : `No. The dilation by a scale factor of ${T(dil.kF, true)} changes the side lengths.` },
      work: congruent ? ["Translations, reflections and rotations are rigid motions. They keep side lengths and angle measures the same.", "All the steps are rigid motions, so the image is congruent to the original."] : ["Translations, reflections and rotations are rigid motions. They keep side lengths and angle measures the same.", `A dilation by a scale factor of ${T(dil.kF, true)} changes the side lengths. The image is similar to the original but not congruent.`],
      visual: shapeVisual(names, shape.pts, `A coordinate grid with ${noun.toLowerCase()} ${names}: ${shapeText(names, shape.pts)}.`),
      distractors: dist(congruent ? [["No. The image is in a different place.", "thinks-moving-a-figure-makes-it-not-congruent"], ["No. The image is flipped or turned.", "thinks-flipping-or-turning-makes-it-not-congruent"], ["No. The coordinates are different.", "thinks-different-coordinates-mean-not-congruent"]] : [["Yes. The image has the same shape.", "thinks-same-shape-means-congruent"], ["Yes. The matching angles are equal.", "thinks-equal-angles-mean-congruent"], ["Yes. Every step is a slide, flip or turn.", "overlooks-the-dilation"]]),
      hints: H("Congruent figures have the same size and the same shape. Some transformations keep the size and others change it.", "Look at each step. Does it keep the side lengths the same?"),
    };
  },
};

FAMILIES.transform = {
  title: "Transformations",
  grades: [8],
  defaults: {},
  gen(rng, params, opts) {
    const level = opts.level;
    const t = pickType(rng, level, [trImage, trImage, trCongruent]);
    return done({ family: "transform", level, ...t.gen({ rng, level, ctx: opts.ctx }) });
  },
};

// ================================================================================================================ congruence and similarity
const RIGHT = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [9, 12, 15]];
const OBLIQUE = [[4, 5, 6], [6, 7, 8], [5, 6, 7], [7, 8, 9], [4, 6, 8]];
const sideList = (arr) => (arr.length === 3 ? `${arr[0]}, ${arr[1]} and ${arr[2]}` : arr.join(", "));
const smMissing = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    let k;
    let base;
    let right;
    for (let t = 0; t < 400; t++) {
      right = level < 3 || rng.chance(0.4);
      k = level === 1 ? fr(rng.pick([2, 3, 4])) : level === 2 ? rng.pick([fr(2), fr(3), fr(3, 2), fr(1, 2), fr(5, 2), fr(4)]) : rng.pick([fr(3, 2), fr(5, 2), fr(7, 2), fr(3, 4)]);
      base = rng.pick(right ? RIGHT : OBLIQUE);
      if (level === 3) {
        // allow decimals in the image
        break;
      }
      if (base.every((s) => k.mul(fr(s)).d === 1)) break;
    }
    const t1 = base.map(String);
    const t2F = base.map((s) => k.mul(fr(s)));
    const idx = rng.int(0, 2);
    const which = level >= 2 && rng.chance(0.5) ? "t1" : "t2";
    const unknownInSecond = which === "t2";
    const shown1 = t1.map((s, i) => (!unknownInSecond && i === idx ? "x" : s));
    const shown2 = t2F.map((f, i) => (unknownInSecond && i === idx ? "x" : T(f, true)));
    const j = [0, 1, 2].find((i) => i !== idx && (level !== 3 || true));
    const ans = unknownInSecond ? t2F[idx] : fr(base[idx]);
    const spec1 = base.map((s, i) => (!unknownInSecond && i === idx ? null : s));
    const spec2 = t2F.map((f, i) => (unknownInSecond && i === idx ? null : S(f)));
    const dm = true;
    const visSides = unknownInSecond ? t2F : base.map((s) => fr(s));
    const visShown = unknownInSecond ? shown2 : shown1;
    const bigger = unknownInSecond ? t2F : base.map((s) => fr(s));
    const scaleKnown = unknownInSecond ? t2F[j].div(fr(base[j])) : fr(base[j]).div(t2F[j]);
    const wrong = unknownInSecond
      ? [[fr(base[idx]).add(t2F[j].sub(fr(base[j]))), "adds-the-same-amount-instead-of-multiplying"], [fr(base[idx]).div(k), "uses-the-inverse-of-the-scale-factor"], [fr(base[idx]), "reports-the-matching-side-of-the-first-triangle"], [t2F[j], "reports-a-known-side-of-the-second-triangle"]]
      : [[t2F[idx].sub(t2F[j].sub(fr(base[j]))), "subtracts-the-same-amount-instead-of-dividing"], [t2F[idx].mul(k), "uses-the-inverse-of-the-scale-factor"], [t2F[idx], "reports-the-matching-side-of-the-second-triangle"], [fr(base[j]), "reports-a-known-side-of-the-first-triangle"]];
    const unitText = "centimeters";
    const dims = visSides.map((f) => f.n / f.d);
    const aTri = { a: dims[0], b: dims[1], c: dims[2] };
    return {
      spec: { type: "missing", t1: spec1, t2: spec2, idx, which },
      stem: ST(
        `Triangle ABC has sides ${sideList(shown1)} centimeters. Triangle DEF is similar to triangle ABC. Its sides, in the same order, are ${sideList(shown2)} centimeters.`,
        `Triangle ABC has side lengths ${sideList(shown1)} centimeters. Triangle DEF is similar to triangle ABC, and its side lengths in the same order are ${sideList(shown2)} centimeters.`,
        `Triangle ABC has side lengths ${sideList(shown1)} centimeters and is similar to triangle DEF, whose corresponding side lengths are ${sideList(shown2)} centimeters.`,
      ),
      ask: ST("What is x?", "What is the value of x, in centimeters?", "Determine the value of x, in centimeters."),
      expr: null,
      answer: A(ans, { dec: dm, unit: unitText }),
      work: [`The scale factor from ${unknownInSecond ? "ABC to DEF" : "DEF to ABC"} is found from two sides that you know: ${T(unknownInSecond ? t2F[j] : fr(base[j]), true)} ${DIVIDE} ${T(unknownInSecond ? fr(base[j]) : t2F[j], true)} is ${T(scaleKnown, true)}.`, `Multiply the matching known side by the scale factor: ${T(unknownInSecond ? fr(base[idx]) : t2F[idx], true)} ${TIMES} ${T(scaleKnown, true)} is ${T(ans, true)}.`],
      visual: { kind: "triangle", alt: `Triangle ${unknownInSecond ? "DEF" : "ABC"} with side lengths ${sideList(visShown)} centimeters.`, a: aTri.a, b: aTri.b, c: aTri.c, right, labels: visShown.map((s) => (s === "x" ? "x" : `${s} cm`)), unit: "cm" },
      distractors: D(ans, wrong, dm),
      hints: H("Similar triangles have matching sides in the same ratio, so one scale factor connects every pair of matching sides.", "Use the two matching sides that you know to find the scale factor, then use it on the matching side of the unknown one."),
    };
  },
};

const smAngleSum = {
  lv: [1, 2],
  gen({ rng, level }) {
    const kind = level === 1 ? "general" : rng.pick(["general", "isosceles", "right"]);
    let given;
    let story;
    if (kind === "isosceles") {
      const b = rng.int(25, 80);
      given = [b, b];
      story = ST(`A triangle has two angles that are the same. Each of them is ${b}°.`, `An isosceles triangle has two equal angles. Each of them measures ${b}°.`, `An isosceles triangle has two congruent angles, each measuring ${b}°.`);
    } else if (kind === "right") {
      const a = rng.int(20, 70);
      given = [90, a];
      story = ST(`A triangle has a right angle. Another angle is ${a}°.`, `A right triangle has an angle that measures ${a}°.`, `A right triangle has one acute angle that measures ${a}°.`);
    } else {
      let a;
      let b;
      do {
        a = rng.int(20, 90);
        b = rng.int(20, 90);
      } while (a + b >= 165 || a + b <= 60 || a === b);
      given = [a, b];
      story = ST(`A triangle has two angles. They are ${a}° and ${b}°.`, `Two angles of a triangle measure ${a}° and ${b}°.`, `Two interior angles of a triangle measure ${a}° and ${b}°.`);
    }
    const ans = 180 - given[0] - given[1];
    const [a, b] = given;
    const askT = kind === "isosceles" ? ST("What is the third angle?", "What is the measure of the third angle, in degrees?", "Determine the measure of the third angle, in degrees.") : ST("What is the third angle?", "What is the measure of the third angle, in degrees?", "Determine the measure of the third angle, in degrees.");
    return {
      spec: { type: "angle-sum", given },
      stem: story,
      ask: askT,
      expr: null,
      answer: A(fr(ans), { unit: "degrees" }),
      work: ["The angles of a triangle add up to 180°.", `${E(sumTxt(a, b), a + b)}.`, `${E(subTxt(180, a + b), ans)}.`],
      visual: null,
      distractors: D(fr(ans), [[fr(180 - a), "forgets-one-of-the-given-angles"], [fr(a + b), "adds-the-given-angles-and-stops"], [fr(360 - a - b), "uses-360-degrees"], [fr(90 - Math.min(a + b, 89)), "uses-90-degrees"]]),
      hints: H("The three angles of any triangle always add up to the same total.", "Add the two angles you know, then subtract the sum from the total."),
    };
  },
};

const smExterior = {
  lv: [2, 3],
  gen({ rng, level }) {
    const ask = level === 2 ? "ext" : rng.pick(["ext", "remote"]);
    let a;
    let b;
    do {
      a = rng.int(25, 80);
      b = rng.int(25, 85);
    } while (a + b >= 170);
    const ext = a + b;
    return {
      spec: ask === "ext" ? { type: "exterior", ask, a, b } : { type: "exterior", ask, ext, a },
      stem: ask === "ext" ? ST(`A triangle has two inside angles of ${a}° and ${b}°. One side is made longer. This makes an outside angle next to the third inside angle.`, `Two interior angles of a triangle measure ${a}° and ${b}°. One side is extended to form an exterior angle at the third vertex.`, `Two interior angles of a triangle measure ${a}° and ${b}°. A side is extended to form an exterior angle at the third vertex.`) : ST(`A triangle has an outside angle of ${ext}°. One of the two far inside angles is ${a}°.`, `A triangle has an exterior angle of ${ext}°. One of the two remote interior angles measures ${a}°.`, `An exterior angle of a triangle measures ${ext}°. One of its two remote interior angles measures ${a}°.`),
      ask: ask === "ext" ? ST("What is the outside angle?", "What is the measure of the exterior angle, in degrees?", "Determine the measure of the exterior angle, in degrees.") : ST("What is the other far inside angle?", "What is the measure of the other remote interior angle, in degrees?", "Determine the measure of the other remote interior angle, in degrees."),
      expr: null,
      answer: A(fr(ask === "ext" ? ext : ext - a), { unit: "degrees" }),
      work: ask === "ext" ? ["An exterior angle equals the sum of the two remote interior angles.", `${E(sumTxt(a, b), ext)}.`] : ["An exterior angle equals the sum of the two remote interior angles.", `${E(subTxt(ext, a), ext - a)}.`],
      visual: null,
      distractors: ask === "ext" ? D(fr(ext), [[fr(180 - ext), "finds-the-third-interior-angle-instead"], [fr(180 - a), "uses-only-one-of-the-angles"], [fr(Math.abs(a - b)), "subtracts-the-angles"], [fr(360 - ext), "uses-360-degrees"]]) : D(fr(ext - a), [[fr(180 - ext), "finds-the-third-interior-angle-instead"], [fr(180 - a), "uses-the-straight-angle-with-one-angle"], [fr(ext + a), "adds-instead-of-subtracting"], [fr(360 - ext - a), "uses-360-degrees"]]),
      hints: H("An exterior angle and the inside angle next to it make a straight line. Both facts about triangles help.", "Use the rule that the exterior angle equals the sum of the two inside angles that are not next to it."),
    };
  },
};

const REL = { corresponding: ["corresponding angles", false, "corresponding angle"], "alternate interior": ["alternate interior angles", false, "alternate interior angle"], "alternate exterior": ["alternate exterior angles", false, "alternate exterior angle"], "same-side interior": ["same-side interior angles", true, "same-side interior angle"], "linear pair": ["a linear pair", true, "linear pair"] };
const art = (w) => (/^[aeiou]/.test(w) ? "an" : "a");
const smParallel = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const rels = level === 1 ? ["corresponding", "alternate interior", "same-side interior"] : Object.keys(REL);
    const rel = rng.pick(rels);
    let a;
    do a = rng.int(2, 34) * 5;
    while (a === 90 || a >= 175);
    const supp = REL[rel][1];
    const ans = supp ? 180 - a : a;
    const ctx = rel === "linear pair" ? ST(`Two angles make a straight line. One of them is ${a}°.`, `Two angles form a linear pair. One of them measures ${a}°.`, `Two angles form a linear pair, and one of them measures ${a}°.`) : ST(`Two parallel lines are cut by a third line. One angle is ${a}°. A second angle is ${art(REL[rel][2])} ${REL[rel][2]} of the first.`, `Two parallel lines are cut by a transversal. One angle measures ${a}°. A second angle is ${art(REL[rel][2])} ${REL[rel][2]} of the first.`, `Two parallel lines are cut by a transversal. One angle measures ${a}°. A second angle is ${art(REL[rel][2])} ${REL[rel][2]} of the first.`);
    return {
      spec: { type: "parallel", rel, a },
      stem: ctx,
      ask: ST("What is the other angle, in degrees?", "What is the measure of the second angle, in degrees?", "Determine the measure of the second angle, in degrees."),
      expr: null,
      answer: A(fr(ans), { unit: "degrees" }),
      work: supp ? [`${cap(REL[rel][0])} ${rel === "linear pair" ? "are" : "between parallel lines are"} supplementary: they add to 180°.`, `${E(subTxt(180, a), ans)}.`] : [`${cap(REL[rel][0])} between parallel lines are equal.`, `So the second angle measures ${a}°.`],
      visual: { kind: "angle", alt: `An angle that measures ${a} degrees.`, deg: a, label: `${a}°`, protractor: false },
      distractors: D(fr(ans), supp ? [[fr(a), "treats-supplementary-angles-as-equal"], [fr(a < 90 ? 90 - a : 360 - a), "treats-the-angles-as-complementary"], [fr(360 - a), "uses-360-degrees"], [fr(180 + a), "adds-to-180-instead-of-subtracting"]] : [[fr(180 - a), "treats-equal-angles-as-supplementary"], [fr(a < 90 ? 90 - a : 360 - a), "treats-the-angles-as-complementary"], [fr(360 - a), "uses-360-degrees"], [fr(2 * a), "doubles-the-angle"]]),
      hints: H("When a line cuts two parallel lines, the angles it makes come in two sizes: some are equal and the rest add to 180 degrees.", `Decide whether ${REL[rel][0]} are equal or add up to 180°, then find the second angle.`),
    };
  },
};

const smDecision = {
  lv: [2, 3],
  gen({ rng, level }) {
    const kind = rng.pick(level === 2 ? ["congruent", "similar", "similar", "neither"] : ["similar", "neither", "neither", "congruent", "similar"]);
    const base = rng.pick([...RIGHT, ...OBLIQUE]);
    let t1 = [...base];
    let t2;
    if (kind === "congruent") t2 = rng.shuffle([...base]);
    else if (kind === "similar") {
      const k = rng.pick([2, 3, 2]);
      t2 = rng.shuffle(base.map((s) => s * k));
    } else if (rng.chance(0.6)) {
      const c = rng.int(1, 3);
      t2 = rng.shuffle(base.map((s) => s + c));
    } else {
      t2 = [...base];
      t2[rng.int(0, 2)] += rng.pick([1, 2, 3]);
      t2 = rng.shuffle(t2);
    }
    t1 = rng.shuffle(t1);
    const ok = (t) => t[0] + t[1] > t[2] && t[0] + t[2] > t[1] && t[1] + t[2] > t[0];
    if (!ok(t1) || !ok(t2)) return smDecision.gen({ rng, level });
    const sortN = (t) => [...t].sort((a, b) => a - b);
    const s1 = sortN(t1);
    const s2 = sortN(t2);
    const congruent = s1.every((v, i) => v === s2[i]);
    const similar = !congruent && s1[0] * s2[1] === s1[1] * s2[0] && s1[0] * s2[2] === s1[2] * s2[0];
    const real = congruent ? "congruent" : similar ? "similar but not congruent" : "neither";
    const ASK = ST("Are the two triangles congruent, similar, or neither?", "Are the two triangles congruent, similar but not congruent, or neither?", "Are the two triangles congruent, similar but not congruent, or neither?");
    const pool = [["congruent", "thinks-same-shape-means-congruent"], ["similar but not congruent", real === "neither" ? "thinks-adding-the-same-amount-keeps-the-shape" : "thinks-different-side-lengths-mean-similar-only"], ["neither", real === "similar but not congruent" ? "thinks-different-side-lengths-mean-not-similar" : "thinks-matching-sides-are-not-enough"], ["not enough information", "thinks-the-angles-are-needed-too"]].filter(([t]) => t !== real);
    return {
      spec: { type: "decision", t1, t2 },
      stem: ST(`Triangle P has sides ${sideList(t1)} centimeters. Triangle Q has sides ${sideList(t2)} centimeters.`, `Triangle P has side lengths ${sideList(t1)} centimeters. Triangle Q has side lengths ${sideList(t2)} centimeters.`, `Triangle P has side lengths ${sideList(t1)} centimeters, and triangle Q has side lengths ${sideList(t2)} centimeters.`),
      ask: ASK,
      expr: null,
      answer: { value: real, kind: "text" },
      work: congruent ? [`Put the sides in order. Triangle P: ${s1.join(", ")}. Triangle Q: ${s2.join(", ")}.`, "The side lengths match exactly, so the triangles are congruent."] : similar ? [`Put the sides in order. Triangle P: ${s1.join(", ")}. Triangle Q: ${s2.join(", ")}.`, `Divide matching sides: ${T(fr(s2[0], s1[0]))} for the shortest sides, and the same number for the others.`, "Every side is multiplied by the same number, so the triangles are similar, but the sides are not equal, so they are not congruent."] : [`Put the sides in order. Triangle P: ${s1.join(", ")}. Triangle Q: ${s2.join(", ")}.`, `Divide matching sides: ${T(fr(s2[0], s1[0]))}, ${T(fr(s2[1], s1[1]))} and ${T(fr(s2[2], s1[2]))}. The ratios are not all the same.`, "The sides are not equal and not in the same ratio, so the triangles are neither congruent nor similar."],
      visual: null,
      distractors: pool.slice(0, 3).map(([text, misconception]) => ({ text, misconception })),
      hints: H("Congruent triangles have equal matching sides. Similar triangles have matching sides in the same ratio.", "Put the sides of each triangle in order, then compare the matching sides by subtracting (equal?) and by dividing (same ratio?)."),
    };
  },
};

FAMILIES.similarity = {
  title: "Congruence and similarity",
  grades: [8],
  defaults: {},
  gen(rng, params, opts) {
    const level = opts.level;
    const t = pickType(rng, level, [smMissing, smMissing, smAngleSum, smExterior, smParallel, smParallel, smDecision]);
    return done({ family: "similarity", level, ...t.gen({ rng, level, ctx: opts.ctx }) });
  },
};

// ================================================================================================================ Pythagorean theorem
const PY = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
const exactOrRound = (v) => {
  const r = isqrt(v);
  return r * r === v ? { exact: true, text: String(r), kind: "int" } : { exact: false, text: roundSqrt(v, 1), kind: "dec" };
};
const STORIES = {
  hyp: [
    { ctx: "ladder", mk: (a, b, u) => ST(`A ladder leans on a wall. The bottom of the ladder is ${a} ${u} from the wall. The top reaches ${b} ${u} up the wall. The wall and the ground make a right angle.`, `A ladder leans against a wall. The bottom of the ladder is ${a} ${u} from the wall, and the top reaches ${b} ${u} up the wall.`, `A ladder leans against a vertical wall. Its base is ${a} ${u} from the wall, and its top reaches a height of ${b} ${u}.`), q: ST("How long is the ladder?", "How long is the ladder?", "Determine the length of the ladder.") },
    { ctx: "screen", mk: (a, b, u) => ST(`A TV screen is a rectangle. It is ${a} ${u} wide and ${b} ${u} tall.`, `A TV screen is a rectangle that is ${a} ${u} wide and ${b} ${u} tall.`, `A rectangular TV screen measures ${a} ${u} wide and ${b} ${u} tall.`), q: ST("How long is the diagonal of the screen?", "What is the length of the diagonal of the screen?", "Determine the length of the diagonal of the screen.") },
    { ctx: "field", mk: (a, b, u) => ST(`A field is a rectangle. It is ${a} ${u} long and ${b} ${u} wide. A path goes from one corner to the opposite corner.`, `A rectangular field is ${a} ${u} long and ${b} ${u} wide. A path crosses the field from one corner to the opposite corner.`, `A rectangular field measures ${a} ${u} by ${b} ${u}. A straight path joins two opposite corners.`), q: ST("How long is the path?", "How long is the path across the field?", "Determine the length of the path across the field.") },
    { ctx: "ramp", mk: (a, b, u) => ST(`A ramp goes up to a platform. The ramp starts ${a} ${u} away from the platform. The platform is ${b} ${u} high.`, `A ramp rises to a platform that is ${b} ${u} high. The bottom of the ramp is ${a} ${u} from the platform.`, `A straight ramp rises to a platform ${b} ${u} high. The base of the ramp is ${a} ${u} from the platform.`), q: ST("How long is the ramp?", "How long is the ramp?", "Determine the length of the ramp.") },
  ],
};
const pyHyp = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const exactMode = level < 3 ? true : rng.chance(0.3);
    let a;
    let b;
    if (exactMode) {
      const [x, y] = rng.pick(level === 1 ? PY.slice(0, 2) : PY);
      const k = level === 1 ? rng.pick([1, 2]) : rng.pick([1, 1, 2, 3]);
      a = x * k;
      b = y * k;
      if (rng.chance(0.5)) [a, b] = [b, a];
    } else {
      do {
        a = rng.int(3, 15);
        b = rng.int(3, 15);
      } while (a === b || isqrt(a * a + b * b) ** 2 === a * a + b * b);
    }
    const v = a * a + b * b;
    const res = exactOrRound(v);
    const story = rng.pick(STORIES.hyp);
    const u = rng.pick({ ladder: ["feet", "meters"], screen: ["inches"], field: ["meters", "feet"], ramp: ["feet", "meters"] }[story.ctx]);
    const stem = story.mk(a, b, u);
    const ask = res.exact ? story.q : ST(`${story.q.plain} Round to the nearest tenth.`, `${story.q.standard} Round to the nearest tenth.`, `${story.q.rich} Round to the nearest tenth.`);
    const cands = res.exact
      ? [[String(a + b), "adds-the-legs"], [String(v), "forgets-to-take-the-square-root"], [String(Math.max(a, b) + 1), "guesses-near-the-longer-leg"], [String(Math.abs(a - b)), "subtracts-the-legs"]]
      : [[String(a + b), "adds-the-legs"], [String(v), "forgets-to-take-the-square-root"], [roundSqrt(Math.abs(b * b - a * a) || 1, 1), "subtracts-the-squares"], [roundSqrt(v, 0).replace(/\.0*$/, ""), "rounds-to-the-nearest-whole-number"], [roundSqrt(v, 2), "rounds-to-the-wrong-place"]];
    const dd = res.exact ? DS(res.text, cands) : DS(res.text, cands.filter(([t]) => t !== res.text));
    return {
      spec: { type: "hyp", a, b, round: res.exact ? 0 : 1 },
      stem,
      ask,
      expr: null,
      answer: { value: res.text, kind: res.kind, unit: u },
      work: [`The legs of the right triangle are ${a} ${u} and ${b} ${u}. The Pythagorean theorem says a² + b² = c².`, `${E(`${a * a} + ${b * b}`, v)}, because ${a} times ${a} is ${a * a} and ${b} times ${b} is ${b * b}.`, res.exact ? `√${v} = ${res.text}, so the length is ${res.text} ${u}.` : `√${v} is about ${res.text} when rounded to the nearest tenth, so the length is about ${res.text} ${u}.`],
      visual: { kind: "triangle", alt: `A right triangle with legs ${a} and ${b} and an unknown hypotenuse.`, a: Math.max(a, b), b: Math.min(a, b), c: "?", right: true, labels: [String(Math.max(a, b)), String(Math.min(a, b)), "?"] },
      distractors: dd,
      hints: H("In a right triangle, the square of the longest side equals the sum of the squares of the two shorter sides.", "Square each leg, add the squares, then take the square root of the total."),
    };
  },
};

const pyLeg = {
  lv: [1, 2, 3],
  gen({ rng, level }) {
    const exactMode = level < 3 ? true : rng.chance(0.3);
    let leg;
    let hyp;
    let other;
    if (exactMode) {
      const [x, y, z] = rng.pick(level === 1 ? PY.slice(0, 2) : PY);
      const k = level === 1 ? rng.pick([1, 2]) : rng.pick([1, 1, 2, 3]);
      [leg, other] = rng.chance(0.5) ? [x * k, y * k] : [y * k, x * k];
      hyp = z * k;
    } else {
      do {
        leg = rng.int(3, 14);
        hyp = leg + rng.int(1, 9);
        other = hyp * hyp - leg * leg;
      } while (isqrt(other) ** 2 === other);
    }
    const v = hyp * hyp - leg * leg;
    const res = exactOrRound(v);
    const kind = rng.int(0, 2);
    const u = rng.pick([["feet", "meters"], ["inches", "centimeters", "feet"], ["meters", "feet"]][kind]);
    const st = [
      { stem: ST(`A ladder is ${hyp} ${u} long. It leans on a wall. The bottom is ${leg} ${u} from the wall.`, `A ladder that is ${hyp} ${u} long leans against a wall. Its bottom is ${leg} ${u} from the wall.`, `A ladder that is ${hyp} ${u} long leans against a vertical wall. Its base is ${leg} ${u} from the wall.`), q: ST("How high does it reach on the wall?", "How high up the wall does the ladder reach?", "Determine the height that the ladder reaches on the wall.") },
      { stem: ST(`A rectangle has a diagonal of ${hyp} ${u}. One side is ${leg} ${u}.`, `A rectangle has a diagonal of ${hyp} ${u} and one side of ${leg} ${u}.`, `A rectangle has a diagonal measuring ${hyp} ${u} and one side measuring ${leg} ${u}.`), q: ST("How long is the other side?", "What is the length of the other side?", "Determine the length of the other side.") },
      { stem: ST(`A kite string is ${hyp} ${u} long and goes straight to the ground. The kite is ${leg} ${u} high.`, `A kite string ${hyp} ${u} long is pulled straight to the ground. The kite is ${leg} ${u} above the ground, directly over a point on the ground.`, `A kite string of length ${hyp} ${u} is stretched straight to the ground. The kite is ${leg} ${u} above the ground.`), q: ST("How far is the kite's spot on the ground from the person?", "How far is the person from the point on the ground directly below the kite?", "Determine the horizontal distance from the person to the point on the ground directly below the kite.") },
    ][kind];
    const ask = res.exact ? st.q : ST(`${st.q.plain} Round to the nearest tenth.`, `${st.q.standard} Round to the nearest tenth.`, `${st.q.rich} Round to the nearest tenth.`);
    const cands = res.exact ? [[String(hyp - leg), "subtracts-the-lengths"], [String(hyp + leg), "adds-the-lengths"], [String(v), "forgets-to-take-the-square-root"], [roundSqrt(hyp * hyp + leg * leg, 0).replace(/\.0*$/, ""), "adds-the-squares-instead-of-subtracting"]] : [[String(hyp - leg), "subtracts-the-lengths"], [roundSqrt(hyp * hyp + leg * leg, 1), "adds-the-squares-instead-of-subtracting"], [String(v), "forgets-to-take-the-square-root"], [roundSqrt(v, 0).replace(/\.0*$/, ""), "rounds-to-the-nearest-whole-number"], [roundSqrt(v, 2), "rounds-to-the-wrong-place"]];
    return {
      spec: { type: "leg", leg, hyp, round: res.exact ? 0 : 1 },
      stem: st.stem,
      ask,
      expr: null,
      answer: { value: res.text, kind: res.kind, unit: u },
      work: [`The hypotenuse is ${hyp} and one leg is ${leg}. The Pythagorean theorem says a² + b² = c², so b² = c² ${MINUS} a².`, `${hyp} times ${hyp} is ${hyp * hyp} and ${leg} times ${leg} is ${leg * leg}, and ${E(`${hyp * hyp} ${MINUS} ${leg * leg}`, v)}.`, res.exact ? `√${v} = ${res.text}, so the length is ${res.text} ${u}.` : `√${v} is about ${res.text} when rounded to the nearest tenth, so the length is about ${res.text} ${u}.`],
      visual: { kind: "triangle", alt: `A right triangle with hypotenuse ${hyp}, one leg ${leg} and an unknown leg.`, a: leg, b: "?", c: hyp, right: true, labels: [String(leg), "?", String(hyp)] },
      distractors: DS(res.text, cands),
      hints: H("The longest side of a right triangle is the hypotenuse. The squares of the two legs add up to its square.", "Square the hypotenuse and the known leg, subtract, then take the square root."),
    };
  },
};

const pyConverse = {
  lv: [2, 3],
  gen({ rng, level }) {
    const truth = rng.chance(0.5);
    let sides;
    for (;;) {
      const [x, y, z] = rng.pick(PY);
      const k = rng.pick([1, 1, 2, 3]);
      if (truth) sides = [x * k, y * k, z * k];
      else {
        const d = rng.pick([-2, -1, 1, 2]);
        sides = [x * k, y * k, z * k + d];
        if (d < 0 && sides[2] <= Math.max(sides[0], sides[1])) continue;
      }
      const s = [...sides].sort((p, q) => p - q);
      if (s[0] + s[1] > s[2]) break;
    }
    sides = rng.shuffle(sides);
    const s = [...sides].sort((p, q) => p - q);
    const u = rng.pick(["feet", "meters", "inches", "centimeters"]);
    const lhs = s[0] * s[0] + s[1] * s[1];
    const rhs = s[2] * s[2];
    return {
      spec: { type: "converse", sides },
      stem: ST(`A triangle has sides of ${sideList(sides)} ${u}.`, `A triangle has side lengths of ${sideList(sides)} ${u}.`, `A triangle has side lengths of ${sideList(sides)} ${u}.`),
      ask: ST("Is it a right triangle?", "Is the triangle a right triangle?", "Is the triangle a right triangle?"),
      expr: null,
      answer: { value: truth ? "true" : "false", kind: "bool", text: truth ? `Yes. ${s[0] * s[0]} + ${s[1] * s[1]} = ${rhs}, so the squares add up.` : `No. ${s[0] * s[0]} + ${s[1] * s[1]} is ${lhs}, but ${s[2]} squared is ${rhs}.` },
      work: [`Put the sides in order. The longest side is ${s[2]}.`, `Square the two shorter sides and add: ${s[0] * s[0]} + ${s[1] * s[1]} is ${lhs}.`, `Square the longest side: ${s[2]} times ${s[2]} is ${rhs}.`, truth ? "The two results are equal, so the triangle is a right triangle." : "The two results are not equal, so the triangle is not a right triangle."],
      visual: null,
      distractors: dist(truth ? [["No. The sides are not all equal.", "thinks-a-right-triangle-needs-equal-sides"], ["No. The two short sides do not add up to the long side.", "adds-the-sides-instead-of-squaring-them"], ["No. Only the 3-4-5 triangle is a right triangle.", "thinks-only-one-triple-works"]] : [["Yes. The two short sides add up to more than the long side.", "mixes-up-the-triangle-inequality-with-the-right-angle-test"], ["Yes. The sides make a triangle.", "thinks-every-triangle-is-a-right-triangle"], ["Yes. The sides are all different.", "thinks-different-sides-mean-a-right-triangle"]]),
      hints: H("If the squares of the two shorter sides add up to the square of the longest side, the triangle has a right angle.", "Square all three sides. Check whether the two smaller squares add to the largest square."),
    };
  },
};

const pyDistance = {
  lv: [2, 3],
  gen({ rng, level }) {
    const exactMode = level === 2 ? true : rng.chance(0.35);
    let p1;
    let p2;
    for (let t = 0; t < 2000; t++) {
      let dx;
      let dy;
      if (exactMode) {
        const [x, y] = rng.pick(PY.slice(0, 3));
        const k = x <= 5 ? rng.pick([1, 1, 2]) : 1;
        [dx, dy] = rng.chance(0.5) ? [x * k, y * k] : [y * k, x * k];
        if (rng.chance(0.5)) dx = -dx;
        if (rng.chance(0.5)) dy = -dy;
      } else {
        dx = nz(rng, -9, 9);
        dy = nz(rng, -9, 9);
        const q = dx * dx + dy * dy;
        if (isqrt(q) ** 2 === q) continue;
      }
      p1 = [nz(rng, -6, 6), nz(rng, -6, 6)];
      p2 = [p1[0] + dx, p1[1] + dy];
      if (Math.max(...p1.map(Math.abs), ...p2.map(Math.abs)) <= 11) break;
    }
    const dx = Math.abs(p2[0] - p1[0]);
    const dy = Math.abs(p2[1] - p1[1]);
    const v = dx * dx + dy * dy;
    const res = exactOrRound(v);
    const a1 = pairText(num(p1[0]), num(p1[1]));
    const a2 = pairText(num(p2[0]), num(p2[1]));
    const cands = res.exact ? [[String(dx + dy), "adds-the-horizontal-and-vertical-distances"], [String(v), "forgets-to-take-the-square-root"], [String(Math.max(dx, dy)), "uses-only-the-longer-distance"], [String(Math.abs(dx - dy)), "subtracts-the-distances"]] : [[String(dx + dy), "adds-the-horizontal-and-vertical-distances"], [String(v), "forgets-to-take-the-square-root"], [String(Math.max(dx, dy)), "uses-only-the-longer-distance"], [roundSqrt(Math.abs(dx * dx - dy * dy) || 1, 1), "subtracts-the-squares"], [roundSqrt(v, 0).replace(/\.0*$/, ""), "rounds-to-the-nearest-whole-number"]];
    const bx = box(Math.max(p1[0], p2[0]) + 1, Math.max(p1[1], p2[1]) + 1, Math.min(p1[0], p2[0]) - 1, Math.min(p1[1], p2[1]) - 1);
    return {
      spec: { type: "distance", p1, p2, round: res.exact ? 0 : 1 },
      stem: ST(`On a coordinate grid, point P is at ${a1} and point Q is at ${a2}. Each grid square is 1 unit long.`, `On a coordinate plane, point P is at ${a1} and point Q is at ${a2}. Each grid square is 1 unit long.`, `On a coordinate plane, point P is at ${a1} and point Q is at ${a2}. Each grid square has a side of 1 unit.`),
      ask: res.exact ? ST("How far is P from Q, in units?", "What is the distance from P to Q, in units?", "Determine the distance from P to Q, in units.") : ST("How far is P from Q, in units? Round to the nearest tenth.", "What is the distance from P to Q, in units? Round to the nearest tenth.", "Determine the distance from P to Q, in units. Round to the nearest tenth."),
      expr: null,
      answer: { value: res.text, kind: res.kind, unit: "units" },
      work: [`The horizontal distance is ${dx} and the vertical distance is ${dy}. These are the legs of a right triangle, and the distance is its hypotenuse.`, `${E(`${dx * dx} + ${dy * dy}`, v)}, because ${dx} times ${dx} is ${dx * dx} and ${dy} times ${dy} is ${dy * dy}.`, res.exact ? `√${v} = ${res.text}, so the distance is ${res.text} units.` : `√${v} is about ${res.text} when rounded to the nearest tenth, so the distance is about ${res.text} units.`],
      visual: { kind: "coord", alt: `A coordinate grid with points P ${a1} and Q ${a2} and the segment between them.`, xmin: bx.xmin, xmax: bx.xmax, ymin: bx.ymin, ymax: bx.ymax, step: bx.step, points: [{ x: String(p1[0]), y: String(p1[1]), label: "P" }, { x: String(p2[0]), y: String(p2[1]), label: "Q" }], lines: [{ p1: { x: p1[0], y: p1[1] }, p2: { x: p2[0], y: p2[1] } }], labelAxes: ["x", "y"] },
      distractors: DS(res.text, cands),
      hints: H("The horizontal and vertical distances between two points are the legs of a right triangle. The distance between the points is its hypotenuse.", "Find how far apart the x-coordinates and the y-coordinates are, square both distances, add, and take the square root."),
    };
  },
};

FAMILIES.pythag = {
  title: "Pythagorean theorem",
  grades: [8],
  defaults: {},
  gen(rng, params, opts) {
    const level = opts.level;
    const t = pickType(rng, level, [pyHyp, pyHyp, pyLeg, pyLeg, pyConverse, pyDistance, pyDistance]);
    return done({ family: "pythag", level, ...t.gen({ rng, level, ctx: opts.ctx }) });
  },
};

// ================================================================================================================ scatter plots
const mean1 = (a) => a.reduce((s, v) => s + v, 0) / a.length;
function corr2(xs, ys) {
  const mx = mean1(xs);
  const my = mean1(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  xs.forEach((x, i) => {
    sxy += (x - mx) * (ys[i] - my);
    sxx += (x - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  });
  return sxx === 0 || syy === 0 ? 0 : (sxy * sxy) / (sxx * syy);
}
const covSign = (xs, ys) => {
  const mx = mean1(xs);
  const my = mean1(ys);
  return xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
};
function genCloud(rng, kind) {
  const n = rng.int(8, 11);
  const xs = Array.from({ length: n }, (_, i) => i + 1);
  for (let t = 0; t < 5000; t++) {
    let ys;
    if (kind === "pos" || kind === "neg") {
      const m = rng.int(1, 4);
      const noise = Math.max(1, Math.round(m * 1.2));
      const b = kind === "pos" ? rng.int(noise + 1, noise + 8) : rng.int(m * n + noise + 1, m * n + noise + 12);
      ys = xs.map((x) => (kind === "pos" ? m * x + b : b - m * x) + rng.int(-noise, noise));
      if (corr2(xs, ys) < 0.85 || ys.some((y) => y < 0)) continue;
    } else if (kind === "none") {
      ys = xs.map(() => rng.int(2, 22));
      if (corr2(xs, ys) > 0.15) continue;
      const mx = mean1(xs);
      if (corr2(xs.map((x) => (x - mx) ** 2), ys) > 0.4) continue;
    } else {
      const a = rng.pick([1, 2, -1, -2]);
      const c = (n + 1) / 2;
      const d = a > 0 ? rng.int(1, 6) : rng.int(a * -1 * Math.ceil(((n - 1) / 2) ** 2) + 2, a * -1 * Math.ceil(((n - 1) / 2) ** 2) + 8);
      ys = xs.map((x) => Math.round(a * (x - c) ** 2 + d) + rng.int(-1, 1));
      if (ys.some((y) => y < 0)) continue;
      const mx = mean1(xs);
      if (corr2(xs, ys) > 0.25 || corr2(xs.map((x) => (x - mx) ** 2), ys) < 0.9) continue;
    }
    return { xs, ys };
  }
  throw new Error("could not generate a scatter cloud");
}
const scatterVis = (xs, ys, scene, alt, line) => {
  const maxY = Math.max(...ys);
  const maxX = Math.max(...xs);
  const stepY = niceStep(maxY + 2);
  const ymax = (Math.floor((maxY + 1) / stepY) + 1) * stepY;
  const v = { kind: "scatter", alt, xmin: 0, xmax: maxX + 1, ymin: 0, ymax, points: xs.map((x, i) => ({ x, y: ys[i] })), xLabel: cap(scene.x[1]), yLabel: cap(scene.y[1]) };
  if (line) v.line = line;
  return v;
};
const ASSOC = { pos: "A positive linear association", neg: "A negative linear association", none: "No association", nonlin: "A non-linear association" };
const SC_TOKEN = { pos: "positive linear", neg: "negative linear", none: "no association", nonlin: "non-linear" };
const scAssoc = {
  lv: [1, 2, 3],
  gen({ rng, level, ctx }) {
    const kind = level === 1 ? rng.pick(["pos", "neg", "none"]) : level === 2 ? rng.pick(["pos", "neg", "none", "nonlin"]) : rng.pick(["nonlin", "none", "pos", "neg", "nonlin"]);
    const { xs, ys } = genCloud(rng, kind);
    const sc = modelOf(rng, ctx, kind !== "neg");
    const list = xs.map((x, i) => pairText(num(x), num(ys[i]))).join(", ");
    const tagsFor = {
      pos: { neg: "reverses-the-direction-of-the-trend", none: "ignores-the-trend", nonlin: "sees-a-curve-in-a-line" },
      neg: { pos: "reverses-the-direction-of-the-trend", none: "ignores-the-trend", nonlin: "sees-a-curve-in-a-line" },
      none: { pos: "sees-a-trend-in-scattered-points", neg: "sees-a-trend-in-scattered-points", nonlin: "sees-a-curve-in-scattered-points" },
      nonlin: { pos: "fits-a-line-to-a-curve", neg: "fits-a-line-to-a-curve", none: "sees-no-pattern-in-a-curve" },
    }[kind];
    const peak = kind === "nonlin" ? ys[Math.floor(ys.length / 2)] > ys[0] : null;
    return {
      spec: { type: "assoc", points: xs.map((x, i) => [x, ys[i]]) },
      stem: ST(`A scatter plot shows ${sc.x[1]} (x) and the ${sc.what} (y, in ${sc.y[1]}). The points (x, y) are ${list}.`, `A scatter plot shows the number of ${sc.x[1]} (x) and the ${sc.what} (y, in ${sc.y[1]}). The points (x, y) are ${list}.`, `A scatter plot displays the number of ${sc.x[1]} (x) against the ${sc.what} (y, in ${sc.y[1]}). The points (x, y) are ${list}.`),
      ask: ST("What pattern do the points show?", "Which statement best describes the association between x and y?", "Which statement best describes the association between the two variables?"),
      expr: null,
      answer: { value: SC_TOKEN[kind], kind: "text", text: ASSOC[kind] },
      work: kind === "pos" ? ["Look at the points from left to right.", "They go up in a fairly straight band, so y gets larger as x gets larger.", "This is a positive linear association."] : kind === "neg" ? ["Look at the points from left to right.", "They go down in a fairly straight band, so y gets smaller as x gets larger.", "This is a negative linear association."] : kind === "none" ? ["Look at the points from left to right.", "They are spread out with no direction: they do not follow a line or a curve.", "There is no association."] : ["Look at the points from left to right.", `They ${peak ? "rise and then fall" : "fall and then rise"}, following a curve and not a straight band.`, "This is a non-linear association."],
      visual: scatterVis(xs, ys, sc, `A scatter plot of the ${sc.what} against the number of ${sc.x[1]}: ${list}.`),
      distractors: Object.keys(tagsFor).map((k) => ({ text: ASSOC[k], misconception: tagsFor[k] })),
      hints: H("An association describes how y changes as x changes. Look for a direction and for the shape of the pattern.", "Scan the points from left to right. Do they go up, go down, bend, or show no pattern at all?"),
    };
  },
};

function pointsAround(rng, m, b, xs, noise) {
  return xs.map((x) => m.mul(fr(x)).add(b).n / m.mul(fr(x)).add(b).d + rng.int(-noise, noise)).map((y) => Math.max(0, Math.round(y)));
}
const scPredict = {
  lv: [1, 2, 3],
  gen({ rng, level, ctx }) {
    const grows = level === 1 || rng.chance(0.65);
    const sc = modelOf(rng, ctx, grows);
    const find = level === 3 ? rng.pick(["x", "resid", "y"]) : "y";
    let m;
    let b;
    if (level === 1) {
      m = fr(rng.int(2, 6));
      b = fr(rng.int(2, 15));
    } else if (level === 2) {
      m = grows ? rng.pick([fr(5, 2), fr(3, 2), fr(7, 2), fr(3), fr(4), fr(9, 2)]) : fr(-rng.pick([2, 3, 4, 5]));
      b = grows ? fr(rng.int(3, 25)) : fr(rng.int(40, 80));
    } else {
      m = grows ? rng.pick([fr(5, 2), fr(3, 4), fr(7, 2), fr(9, 4), fr(6, 5), fr(4)]) : fr(-rng.pick([2, 3, 4, 5, 6]));
      b = grows ? fr(rng.int(5, 40)) : fr(rng.int(50, 100));
    }
    const dm = true;
    const unitX = m.d === 1 ? 1 : m.d;
    const xs = [1, 2, 3, 4, 5, 6, 7, 8].map((x) => x);
    let x0 = m.d === 1 ? rng.int(3, 12) : unitX * rng.int(1, 3);
    if (!grows) x0 = Math.min(x0, Math.max(2, Math.floor((b.n / b.d - 1) / Math.abs(m.n / m.d))));
    const predAt = (x) => m.mul(fr(x)).add(b);
    const y0 = predAt(x0);
    let ysPts;
    let actual = null;
    if (find === "resid") {
      let delta;
      do delta = rng.pick([-6, -5, -4, -3, 3, 4, 5, 6, 7]);
      while (y0.add(fr(delta)).cmp(fr(1)) < 0);
      actual = y0.add(fr(delta));
    }
    const lineStr = `y = ${linText(m, b, dm)}`;
    const mathLine = { m: S(m), b: S(b) };
    const ptsX = [1, 2, 3, 4, 5, 6, 7, 8].filter((x) => x !== x0);
    const ptsY = pointsAround(rng, m, b, ptsX, Math.max(1, Math.round(Math.abs(m.n / m.d))));
    const allX = find === "resid" ? [...ptsX, x0] : ptsX;
    const allY = find === "resid" ? [...ptsY, Math.round(actual.n / actual.d)] : ptsY;
    const stemBase = (x0txt) => ST(`A scatter plot shows the number of ${sc.x[1]} (x) and the ${sc.what} (y, in ${sc.y[1]}). The line of best fit is ${lineStr}.${x0txt.plain}`, `A scatter plot shows the number of ${sc.x[1]} (x) and the ${sc.what} (y, in ${sc.y[1]}). The line of best fit is ${lineStr}.${x0txt.standard}`, `A scatter plot relates the number of ${sc.x[1]} (x) to the ${sc.what} (y, in ${sc.y[1]}). The line of best fit is ${lineStr}.${x0txt.rich}`);
    const xT = T(fr(x0), dm);
    const yT = T(y0, dm);
    const vis = (alt) => {
      const ymaxPts = Math.max(...allY, Math.round(y0.n / y0.d), Math.round(b.n / b.d)) + 2;
      const v = scatterVis(allX, allY, sc, alt, mathLine);
      v.ymax = Math.max(v.ymax, (Math.floor(ymaxPts / niceStep(ymaxPts)) + 1) * niceStep(ymaxPts));
      v.xmax = Math.max(v.xmax, x0 + 1);
      return v;
    };
    if (find === "y") {
      const ans = A(y0, { dec: dm, unit: sc.y[1] });
      return {
        spec: { type: "predict", find, m: S(m), b: S(b), x: String(x0) },
        stem: stemBase(ST(` Use it to predict the ${sc.what} for ${x0} ${sc.x[1]}.`, ` Use the line to predict the ${sc.what} for ${x0} ${sc.x[1]}.`, ` Use the line of best fit to predict the ${sc.what} for ${x0} ${sc.x[1]}.`)),
        ask: ST("What is the prediction?", "What is the predicted value of y?", "Determine the predicted value of y."),
        expr: lineStr,
        answer: ans,
        work: [`Put x = ${x0} into ${lineStr}.`, ...(m.n * x0 >= 0 ? [`${E(`${T(m, dm)} ${TIMES} ${x0}`, m.mul(fr(x0)), dm)}.`, `${E(`${T(m.mul(fr(x0)), dm)} + ${T(b, dm)}`, y0, dm)}.`] : [`${E(`${T(m, dm)} ${TIMES} ${x0}`, m.mul(fr(x0)), dm)}.`, `${E(`${T(b, dm)} ${MINUS} ${T(absF(m.mul(fr(x0))), dm)}`, y0, dm)}.`])],
        visual: vis(`A scatter plot with the line of best fit ${lineStr}.`),
        distractors: D(y0, [[m.add(b), "adds-the-slope-and-the-intercept"], [m.mul(fr(x0)), "forgets-the-intercept"], [b.mul(fr(x0)).add(m), "swaps-the-slope-and-the-intercept"], [fr(x0).add(b), "adds-x-and-the-intercept"]], dm),
        hints: H("The line of best fit is a rule that gives a predicted y for any x.", "Replace x in the equation with the given number. Multiply first, then add or subtract."),
      };
    }
    if (find === "x") {
      return {
        spec: { type: "predict", find, m: S(m), b: S(b), y: S(y0) },
        stem: stemBase(ST(` The predicted y is ${yT}.`, ` Suppose the predicted value of y is ${yT} ${sc.y[1]}.`, ` Suppose the predicted value of y is ${yT} ${sc.y[1]}.`)),
        ask: ST(`How many ${sc.x[1]} does the line predict?`, `For how many ${sc.x[1]} does the line predict that value?`, `Determine the number of ${sc.x[1]} for which the line predicts that value.`),
        expr: lineStr,
        answer: A(fr(x0), { unit: sc.x[1] }),
        work: [`Put y = ${yT} into ${lineStr}.`, `Subtract ${T(b, dm)} from both sides: ${E(`${yT} ${MINUS} ${T(b, dm)}`, y0.sub(b), dm)}.`, `Divide both sides by ${T(m, dm)}: ${E(`${T(y0.sub(b), dm)} ${DIVIDE} ${T(m, dm)}`, fr(x0))}.`],
        visual: vis(`A scatter plot with the line of best fit ${lineStr}.`),
        distractors: D(fr(x0), [[y0.add(b).div(m), "adds-the-intercept-instead-of-subtracting"], [y0.div(m), "ignores-the-intercept"], [y0.sub(b), "forgets-to-divide-by-the-slope"], [y0.mul(m), "multiplies-instead-of-dividing"]], dm),
        hints: H("Working backward from a predicted value to x means undoing the rule: first the intercept, then the slope.", "Subtract the intercept from the predicted value, then divide by the slope."),
      };
    }
    const act = actual;
    const diff = absF(act.sub(y0));
    return {
      spec: { type: "predict", find, m: S(m), b: S(b), x: String(x0), actual: S(act) },
      stem: stemBase(ST(` One real data point is at x = ${x0}. Its y-value is ${T(act, dm)}.`, ` One real data point has x = ${x0} and y = ${T(act, dm)}.`, ` One observed data point has x = ${x0} and y = ${T(act, dm)}.`)),
      ask: ST("How far is the real y from the y that the line predicts?", "What is the difference between the actual y-value and the y-value that the line predicts?", "Determine the absolute difference between the observed y-value and the y-value that the line predicts."),
      expr: lineStr,
      answer: A(diff, { dec: dm, unit: sc.y[1] }),
      work: [`Put x = ${x0} into ${lineStr} to get the predicted y: ${T(y0, dm)}.`, `The real y is ${T(act, dm)}.`, `Subtract the smaller from the larger: ${E(`${T(act.cmp(y0) > 0 ? act : y0, dm)} ${MINUS} ${T(act.cmp(y0) > 0 ? y0 : act, dm)}`, diff, dm)}.`],
      visual: vis(`A scatter plot with the line of best fit ${lineStr}. One point is not on the line.`),
      distractors: D(diff, [[act, "reports-the-actual-value"], [y0, "reports-the-predicted-value"], [act.add(y0), "adds-the-two-values"], [fr(x0).sub(diff), "mixes-up-x-and-the-difference"]], dm),
      hints: H("The difference between a real value and the predicted value shows how far a point is from the line.", "Find the predicted y first. Then subtract the smaller of the two y-values from the larger."),
    };
  },
};

const scInterpret = {
  lv: [2, 3],
  gen({ rng, level, ctx }) {
    const ask = rng.pick(["slope", "intercept"]);
    const grows = rng.chance(0.65);
    const sc = modelOf(rng, ctx, grows);
    let m;
    do m = grows ? rng.pick([fr(2), fr(3), fr(4), fr(5, 2), fr(3, 2), fr(6), fr(7, 2), fr(9, 2)]) : fr(-rng.pick([2, 3, 4, 5, 6]));
    while (level === 2 && m.d !== 1);
    const b = fr(grows ? rng.int(2, 40) : rng.int(30, 90));
    const dm = true;
    const lineStr = `y = ${linText(m, b, dm)}`;
    const mathLine = { m: S(m), b: S(b) };
    const amt = T(absF(m), dm);
    const more = m.n > 0 ? "more" : "fewer";
    const ans = ask === "slope" ? `${amt} ${more} ${sc.y[1]} for each extra ${sc.x[0]}` : `${T(b, dm)} ${sc.y[1]} when there are 0 ${sc.x[1]}`;
    const wrong =
      ask === "slope"
        ? [[`${amt} ${sc.x[1]} for each extra ${sc.y[0]}`, "reverses-the-two-quantities"], [`${T(b, dm)} ${more} ${sc.y[1]} for each extra ${sc.x[0]}`, "reads-the-intercept-as-the-slope"], [`${amt} ${m.n > 0 ? "fewer" : "more"} ${sc.y[1]} for each extra ${sc.x[0]}`, "gets-the-direction-of-the-change-wrong"], [`${amt} ${sc.y[1]} when there are 0 ${sc.x[1]}`, "reads-the-slope-as-the-intercept"]]
        : [[`${T(b, dm)} more ${sc.y[1]} for each extra ${sc.x[0]}`, "reads-the-intercept-as-the-slope"], [`${amt} ${sc.y[1]} when there are 0 ${sc.x[1]}`, "reads-the-slope-as-the-intercept"], [`${T(b, dm)} ${sc.x[1]} when there are 0 ${sc.y[1]}`, "swaps-the-two-quantities"], [`${T(b.add(m), dm)} ${sc.y[1]} when there are 0 ${sc.x[1]}`, "adds-the-slope-to-the-intercept"]];
    const xs = [1, 2, 3, 4, 5, 6, 7, 8];
    const ys = pointsAround(rng, m, b, xs, Math.max(1, Math.round(Math.abs(m.n / m.d) * 0.8)));
    const v = scatterVis(xs, ys, sc, `A scatter plot of the ${sc.what} against the number of ${sc.x[1]} with the line of best fit ${lineStr}.`, mathLine);
    return {
      spec: { type: "interpret", ask, m: S(m), b: S(b), x: sc.x, y: sc.y },
      stem: ST(`A scatter plot shows the number of ${sc.x[1]} (x) and the ${sc.what} (y, in ${sc.y[1]}). The line of best fit is ${lineStr}.`, `A scatter plot shows the number of ${sc.x[1]} (x) and the ${sc.what} (y, in ${sc.y[1]}). The line of best fit is ${lineStr}.`, `A scatter plot relates the number of ${sc.x[1]} (x) to the ${sc.what} (y, in ${sc.y[1]}). The line of best fit is ${lineStr}.`),
      ask: ask === "slope" ? ST("What does the slope tell us?", "What does the slope of the line mean in this situation?", "Interpret the slope of the line in the context of this situation.") : ST("What does the y-intercept tell us?", "What does the y-intercept of the line mean in this situation?", "Interpret the y-intercept of the line in the context of this situation."),
      expr: lineStr,
      answer: { value: ans, kind: "text" },
      work: ask === "slope" ? [`In y = mx + b, the slope m is the change in y for each 1 that x goes up.`, `Here m is ${T(m, dm)}, so y ${m.n > 0 ? "goes up" : "goes down"} by ${amt} for each extra ${sc.x[0]}.`] : [`In y = mx + b, the y-intercept b is the value of y when x is 0.`, `Here b is ${T(b, dm)}, so the predicted ${sc.what} is ${T(b, dm)} ${sc.y[1]} when there are 0 ${sc.x[1]}.`],
      visual: v,
      distractors: dist(wrong.filter(([t]) => t !== ans).slice(0, 3)),
      hints: H(ask === "slope" ? "The slope is a rate: it compares the change in y with a change of 1 in x." : "The y-intercept is the predicted y when x is 0.", ask === "slope" ? "Say what y does for each extra 1 of x, using the units of the problem." : "Replace x with 0 in the equation and say what the result means, with units."),
    };
  },
};

const scOutlier = {
  lv: [3],
  gen({ rng, level, ctx }) {
    const sc = modelOf(rng, ctx, true);
    const m = fr(rng.int(2, 5));
    const b = fr(rng.int(2, 12));
    const n = rng.int(7, 9);
    const xs = Array.from({ length: n }, (_, i) => i + 1);
    const out = rng.int(2, n - 1);
    const pts = xs.map((x) => {
      const yline = m.mul(fr(x)).add(b).n / m.mul(fr(x)).add(b).d;
      return [x, yline + rng.int(-2, 2)];
    });
    pts[out - 1][1] += (pts[out - 1][1] >= 17 && rng.chance(0.5) ? -1 : 1) * rng.int(9, 14);
    const res = (p) => Math.abs(p[1] - (m.n / m.d) * p[0] - b.n / b.d);
    const sorted = [...pts].sort((p, q) => res(q) - res(p));
    const o = sorted[0];
    const lineStr = `y = ${linText(m, b, true)}`;
    const list = pts.map(([x, y]) => pairText(num(x), num(y))).join(", ");
    const ans = pairStr(o[0], o[1]);
    const others = pts.filter((p) => p !== o);
    const hiPoint = [...others].sort((p, q) => q[1] - p[1])[0];
    const rightPoint = others[others.length - 1];
    const cands = [[pairStr(o[0], o[1]) === pairStr(hiPoint[0], hiPoint[1]) ? null : pairStr(hiPoint[0], hiPoint[1]), "picks-the-highest-point"], [pairStr(rightPoint[0], rightPoint[1]), "picks-the-point-farthest-to-the-right"], [pairStr(others[0][0], others[0][1]), "picks-the-first-point"], [pairStr(others[Math.floor(others.length / 2)][0], others[Math.floor(others.length / 2)][1]), "picks-a-point-that-fits-the-trend"]];
    const v = scatterVis(pts.map((p) => p[0]), pts.map((p) => p[1]), sc, `A scatter plot with the line of best fit ${lineStr}. The points are ${list}.`, { m: S(m), b: S(b) });
    return {
      spec: { type: "outlier", m: S(m), b: S(b), points: pts },
      stem: ST(`A scatter plot shows the number of ${sc.x[1]} (x) and the ${sc.what} (y, in ${sc.y[1]}). The line of best fit is ${lineStr}. The points are ${list}.`, `A scatter plot shows the number of ${sc.x[1]} (x) and the ${sc.what} (y, in ${sc.y[1]}). The line of best fit is ${lineStr}. The points (x, y) are ${list}.`, `A scatter plot relates the number of ${sc.x[1]} (x) to the ${sc.what} (y, in ${sc.y[1]}). The line of best fit is ${lineStr}. The points (x, y) are ${list}.`),
      ask: ST("Which point is the outlier, the point farthest from the line? Write it as (x,y).", "Which point is an outlier, the point farthest from the line? Write it as (x,y).", "Which point is an outlier, that is, the point farthest from the line of best fit? Write it as an ordered pair (x,y)."),
      expr: lineStr,
      answer: { value: ans, kind: "pair" },
      work: [`For each point, find how far its y-value is from the y that the line predicts.`, `Most points are within 2 of the line. The point (${num(o[0])}, ${num(o[1])}) is ${Math.round(res(o))} away, much farther than the rest.`, `So the outlier is (${num(o[0])}, ${num(o[1])}).`],
      visual: v,
      distractors: DS(ans, cands),
      hints: H("An outlier is a point that is far from the pattern of the rest, so it is far from the line of best fit.", "Use the equation to find the predicted y for each x, and compare it with the real y."),
    };
  },
};

FAMILIES.scatter = {
  title: "Scatter plots and association",
  grades: [8],
  defaults: {},
  gen(rng, params, opts) {
    const level = opts.level;
    const t = pickType(rng, level, [scAssoc, scAssoc, scPredict, scPredict, scInterpret, scOutlier]);
    return done({ family: "scatter", level, ...t.gen({ rng, level, ctx: opts.ctx }) });
  },
};
