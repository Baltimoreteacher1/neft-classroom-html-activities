// Math Literacy Studio: problem families for grades 4-7 (docs/math-literacy/architecture.md).
// Every generator is seeded (uses only the rng it is given), ends with kit.finalize, and is re-solved independently by
// tools/mls-verify/g56.mjs from `spec` alone. `opts.level` (1-3) is mathematical complexity inside the skill's own grade;
// `opts.ctx` is a kit context id (it only chooses nouns; the mathematics never depends on it).
//
// Params honoured (everything else is ignored):
//   multistep   fractions (false = whole-number two- and three-step stories, remainders, estimates, equations with a letter;
//               true = the same structures with decimals and fractions)
//   exprs       none (grouping symbols, writing expressions from phrases, interpreting expressions without evaluating)
//   patterns    none (two rules, ordered pairs, relationships, which rule, extend)
//   volume      none (count unit cubes, V = l x w x h, V = B x h, composite prisms, missing dimension)
//   coordinate  quadrant (1 only: first-quadrant plane; any other value is treated as 1)
//   ratio       none (ratio language, equivalent ratios, tables, tape diagrams, double number lines, compare)
//   unitrate    none (unit rate and unit price, better buy, constant speed, solve with a rate)
//   percent     level ("basic" = percent of a quantity with models; "apps" = tax, tip, discount, markup, percent change, simple interest)
//   integers    ops (false = integers and rationals in context, opposites, absolute value, order, four quadrants, distance;
//               true = add, subtract, multiply and divide rational numbers; negative answers are allowed in this family)
//   algexpr     none (evaluate with exponents, write, parts of an expression, distributive property, combine like terms)
//   equation    steps (1 = x + p = q, px = q, x/p = q; 2 = px + q = r and p(x + q) = r with rational numbers)
//   inequality  steps (1 = write, test and solve one-step; 2 = also px + q > r with a negative divisor, and number-line graphs)
//   indepdep    none (independent and dependent variables, equations from tables, missing table values)
//   surfarea    none (triangles, parallelograms, trapezoids, composites, surface area from nets, fractional-edge volume, polygons in the plane)
//   stats       mode ("display" = statistical questions and reading dot plots, histograms and box plots; "center" = mean, median, mode, range, MAD, IQR)
import { MINUS, TIMES, DIVIDE, Fr, fr, gcd, num, NAMES, twoNames, finalize } from "../kit.js";

export const FAMILIES = {};

// ---------------------------------------------------------------------------------------------------- shared helpers
const T3 = (plain, standard, rich) => ({ plain, standard, rich });
const ri = (rng, a, b) => rng.int(a, b);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const sum = (a) => a.reduce((x, y) => x + y, 0);
const S = (happening, known, unknown, relationship, model, reasonable) => ({ happening, known, unknown, relationship, model, reasonable });
const toFr = (x) => (x instanceof Fr ? x : Number.isInteger(x) ? fr(x) : fr(Math.round(x * 10000), 10000));
const frS = (f) => (f.d === 1 ? num(f.n) : `${f.n < 0 ? MINUS : ""}${Math.abs(f.n)}/${f.d}`);
const mixS = (f) => {
  if (f.d === 1) return num(f.n);
  const a = Math.abs(f.n);
  const neg = f.n < 0 ? MINUS : "";
  if (a > f.d) return `${neg}${Math.floor(a / f.d)} ${a % f.d}/${f.d}`;
  return `${neg}${a}/${f.d}`;
};
/** Decimal places a fraction needs, or -1 when it does not terminate. */
const decPlaces = (f) => {
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
  return d === 1 ? Math.max(a, b) : -1;
};
/** Exact decimal string for a fraction (pretty: thousands commas and a real minus sign). */
function dStr(f, p, pretty) {
  const neg = f.n < 0;
  const scaled = Math.round((Math.abs(f.n) * 10 ** p) / f.d);
  const s = String(scaled).padStart(p + 1, "0");
  let ip = p ? s.slice(0, -p) : s;
  const fp = p ? s.slice(-p) : "";
  if (pretty) ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (neg ? (pretty ? MINUS : "-") : "") + ip + (p ? `.${fp}` : "");
}
const usd = (cents) => `$${num(Math.floor(cents / 100))}.${String(cents % 100).padStart(2, "0")}`;
/** Text of a fraction in an answer style: {k:"int"|"dec"|"money"|"frac", p, mixed, sfx}. null when the style cannot show it. */
function fmt(f, st) {
  const sfx = st.sfx || "";
  if (st.k === "int") return f.d === 1 ? num(f.n) + sfx : null;
  if (st.k === "frac") return (st.mixed ? mixS(f) : frS(f)) + sfx;
  const p = st.k === "money" ? 2 : st.p;
  const dp = decPlaces(f);
  if (dp < 0 || dp > p) return null;
  if (st.k === "money") return (f.n < 0 ? MINUS : "") + "$" + dStr(new Fr(Math.abs(f.n), f.d), 2, true) + sfx;
  return dStr(f, p, true) + sfx;
}
/** The Problem's `answer` for a fraction value in a style. */
function ans(f, st = { k: "int" }, unit) {
  let k = st.k;
  if (k === "frac" && f.d === 1) k = "int";
  const text = fmt(f, { ...st, k });
  if (text == null) throw new Error(`ans: ${f} does not fit style ${JSON.stringify(st)}`);
  let value;
  if (k === "int") value = String(f.n);
  else if (k === "frac") value = `${f.n}/${f.d}`;
  else value = dStr(f, k === "money" ? 2 : st.p, false);
  const out = { value, text, kind: k === "int" ? "int" : k === "frac" ? "frac" : "dec" };
  if (unit) out.unit = unit;
  return out;
}
/**
 * Distractors: list of [value, tag]; a value is a number / Fr (formatted like the answer, dropped when equal to it, not
 * representable, or not positive when pos) or a string (used as written). Needs at least `min`.
 */
function distr(a, st, list, { pos = true, min = 3, max = 4 } = {}) {
  const sa = st.k === "frac" && a.d === 1 ? { ...st, k: "int" } : st;
  const seen = new Set([a == null ? "" : fmt(a, sa)]);
  const out = [];
  for (const [v, tag] of list) {
    if (v == null) continue;
    let text;
    if (typeof v === "string") text = v;
    else {
      const f = toFr(v);
      if (a && f.cmp(a) === 0) continue;
      if (pos && f.n <= 0) continue;
      text = fmt(f, f.d === 1 && st.k === "frac" ? { ...st, k: "int" } : sa);
    }
    if (text == null || seen.has(text)) continue;
    seen.add(text);
    out.push({ text, misconception: tag });
    if (out.length >= max) break;
  }
  if (out.length < min && a) {
    // safety net: careless slips that fit the answer's style
    const one = fr(1);
    for (const f of [a.add(one), a.sub(one), a.mul(fr(10)), a.add(fr(10)), a.sub(fr(10)), a.add(fr(1, 10)), a.sub(fr(1, 10)), a.add(fr(1, 2)), a.mul(fr(2))]) {
      if (out.length >= min) break;
      if (pos && f.n <= 0) continue;
      const text = fmt(f, f.d === 1 && st.k === "frac" ? { ...st, k: "int" } : sa);
      if (text == null || seen.has(text)) continue;
      seen.add(text);
      out.push({ text, misconception: "arithmetic-slip" });
    }
  }
  if (out.length < min) throw new Error(`distr: only ${out.length} distractors for ${a}`);
  return out;
}
/** Text-only distractors for text answers. */
function tdistr(answerText, list, { min = 3, max = 4 } = {}) {
  const seen = new Set([String(answerText).trim().toLowerCase()]);
  const out = [];
  for (const [text, tag] of list) {
    const k = String(text).trim().toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ text, misconception: tag });
    if (out.length >= max) break;
  }
  if (out.length < min) throw new Error(`tdistr: only ${out.length} distractors for ${answerText}`);
  return out;
}
/** Generic slip candidates appended to a list so a family always has enough distractors. */
const slips = (v) => [[v + 10, "regrouping-slip"], [v - 10, "regrouping-slip"], [v + 1, "off-by-one-slip"], [v - 1, "off-by-one-slip"], [v * 10, "place-value-slip"]];
const cm = (cond, msg) => (cond ? msg : null);

// ---------------------------------------------------------------------------------------------------- nouns by context
const SALE = {
  store: [{ one: "notebook", many: "notebooks" }, { one: "pencil case", many: "pencil cases" }, { one: "sticker pack", many: "sticker packs" }],
  garden: [{ one: "flower", many: "flowers" }, { one: "tomato plant", many: "tomato plants" }, { one: "herb pot", many: "herb pots" }],
  sports: [{ one: "water bottle", many: "water bottles" }, { one: "whistle", many: "whistles" }, { one: "headband", many: "headbands" }],
  kitchen: [{ one: "muffin", many: "muffins" }, { one: "pie", many: "pies" }, { one: "loaf of bread", many: "loaves of bread" }],
  pets: [{ one: "dog toy", many: "dog toys" }, { one: "pet bowl", many: "pet bowls" }, { one: "cat brush", many: "cat brushes" }],
  library: [{ one: "bookmark", many: "bookmarks" }, { one: "paperback book", many: "paperback books" }, { one: "book light", many: "book lights" }],
  crafts: [{ one: "ribbon", many: "ribbons" }, { one: "paint set", many: "paint sets" }, { one: "bead kit", many: "bead kits" }],
  travel: [{ one: "map", many: "maps" }, { one: "luggage tag", many: "luggage tags" }, { one: "travel mug", many: "travel mugs" }],
  science: [{ one: "magnet", many: "magnets" }, { one: "rock kit", many: "rock kits" }, { one: "magnifying glass", many: "magnifying glasses" }],
  community: [{ one: "poster", many: "posters" }, { one: "tree seedling", many: "tree seedlings" }, { one: "reusable bag", many: "reusable bags" }],
};
const sale = (rng, ctx) => rng.pick(SALE[ctx] || SALE.store);
const PACK = {
  store: [{ item: "pencils", g: "box", gs: "boxes" }, { item: "stickers", g: "sheet", gs: "sheets" }, { item: "erasers", g: "pack", gs: "packs" }],
  garden: [{ item: "seeds", g: "packet", gs: "packets" }, { item: "flowers", g: "bunch", gs: "bunches" }, { item: "bean plants", g: "tray", gs: "trays" }],
  sports: [{ item: "cones", g: "stack", gs: "stacks" }, { item: "tennis balls", g: "can", gs: "cans" }, { item: "jerseys", g: "bag", gs: "bags" }],
  kitchen: [{ item: "muffins", g: "tray", gs: "trays" }, { item: "cookies", g: "plate", gs: "plates" }, { item: "apples", g: "basket", gs: "baskets" }],
  pets: [{ item: "dog treats", g: "bag", gs: "bags" }, { item: "cat toys", g: "box", gs: "boxes" }, { item: "fish flakes cups", g: "case", gs: "cases" }],
  library: [{ item: "books", g: "shelf", gs: "shelves" }, { item: "bookmarks", g: "pack", gs: "packs" }, { item: "magazines", g: "stack", gs: "stacks" }],
  crafts: [{ item: "beads", g: "bag", gs: "bags" }, { item: "paper stars", g: "jar", gs: "jars" }, { item: "tiles", g: "box", gs: "boxes" }],
  travel: [{ item: "tickets", g: "book", gs: "books" }, { item: "water bottles", g: "case", gs: "cases" }, { item: "maps", g: "bundle", gs: "bundles" }],
  science: [{ item: "rocks", g: "tray", gs: "trays" }, { item: "magnets", g: "box", gs: "boxes" }, { item: "seedlings", g: "shelf", gs: "shelves" }],
  community: [{ item: "flyers", g: "stack", gs: "stacks" }, { item: "posters", g: "roll", gs: "rolls" }, { item: "cans of food", g: "crate", gs: "crates" }],
};
const pack = (rng, ctx) => rng.pick(PACK[ctx] || PACK.store);

// ================================================================================================ multistep (g4.multistep, g5.modeling)
// A core is one story: its prog (a straight-line program over named values, re-run by the solver), the expression that models it,
// and the wrong expressions students actually write. The same core is asked as "find the value" or "which equation".

function mGroups(rng, L, ctx) {
  const pk = pack(rng, ctx);
  const who = rng.pick(NAMES);
  const k = L === 1 ? ri(rng, 3, 7) : L === 2 ? ri(rng, 6, 14) : ri(rng, 12, 25);
  const n = L === 1 ? ri(rng, 4, 9) : L === 2 ? ri(rng, 8, 19) : ri(rng, 12, 40);
  const m = L === 1 ? ri(rng, 3, 15) : L === 2 ? ri(rng, 10, 60) : ri(rng, 20, 120);
  const g = L === 3 ? ri(rng, 15, 80) : 0;
  const base = k * n + m;
  const val = base - g;
  const tail = (a) => (g ? a : "");
  return {
    stem: T3(
      `${who} has ${k} ${pk.gs}. Each ${pk.g} has ${n} ${pk.item}. ${who} also has ${m} more ${pk.item} that are not in a ${pk.g}.${tail(` Then ${who} gives away ${g} ${pk.item}.`)}`,
      `${who} has ${k} ${pk.gs} with ${n} ${pk.item} in each ${pk.g}, and ${m} extra ${pk.item} that are not in a ${pk.g}.${tail(` ${who} then gives away ${g} ${pk.item}.`)}`,
      `${who} is organizing ${pk.item}: ${k} ${pk.gs} each contain exactly ${n}, and a further ${m} are loose, not in any ${pk.g}.${tail(` Afterward, ${who} gives away ${g} of them.`)}`,
    ),
    ask: T3(`How many ${pk.item} does ${who} have${g ? " now" : ""}?`, `How many ${pk.item} does ${who} have${g ? " left" : ""}?`, `Find the number of ${pk.item} ${who} has${g ? " afterward" : ""}.`),
    unk: `the number of ${pk.item} ${who} has${g ? " at the end" : ""}`,
    prog: g ? [["a", "mul", k, n], ["b", "add", "a", m], ["c", "sub", "b", g]] : [["a", "mul", k, n], ["b", "add", "a", m]],
    out: g ? "c" : "b",
    expr: `${k} ${TIMES} ${n} + ${m}${g ? ` ${MINUS} ${g}` : ""}`,
    val: fr(val),
    st: { k: "int" },
    unit: pk.item,
    wrong: [
      { expr: `${k} ${TIMES} ${n}${g ? ` ${MINUS} ${g}` : ""}`, val: k * n - g, m: "leaves-out-the-loose-items" },
      { expr: `${k} + ${n} + ${m}${g ? ` ${MINUS} ${g}` : ""}`, val: k + n + m - g, m: "adds-the-group-numbers-instead-of-multiplying" },
      { expr: `${k} ${TIMES} (${n} + ${m})${g ? ` ${MINUS} ${g}` : ""}`, val: k * (n + m) - g, m: "multiplies-the-loose-items-too" },
      g
        ? { expr: `${k} ${TIMES} ${n} + ${m} + ${g}`, val: base + g, m: "adds-the-items-given-away" }
        : { expr: `${k} ${TIMES} ${n} ${MINUS} ${m}`, val: k * n - m, m: "subtracts-the-loose-items" },
      g ? { expr: `${k} ${TIMES} ${n} + ${m}`, val: base, m: "forgets-the-items-given-away" } : { expr: `${k} + ${n} ${TIMES} ${m}`, val: k + n * m, m: "multiplies-the-wrong-pair" },
    ],
    work: [
      `Items in the ${pk.gs}: ${k} ${TIMES} ${n} = ${num(k * n)}`,
      `Add the loose ${pk.item}: ${num(k * n)} + ${m} = ${num(base)}`,
      ...(g ? [`Take away what was given away: ${num(base)} ${MINUS} ${g} = ${num(val)}`] : []),
    ],
    hints: {
      conceptual: `Ask what each number counts. Which numbers are about the full ${pk.gs}, and which are about ${pk.item} outside them?`,
      procedural: `Find how many ${pk.item} are in the ${pk.gs} first. Then change that amount by the other ${pk.item}${g ? ", one step at a time" : ""}.`,
    },
    structure: S(`${who} is counting ${pk.item}`, [{ label: pk.gs, value: k }, { label: `${pk.item} in each ${pk.g}`, value: n }, { label: "extra items", value: m }, ...(g ? [{ label: "given away", value: g }] : [])], `how many ${pk.item} ${who} has`, "equal groups, then more or fewer", "tape diagram with equal groups and one extra piece", `The answer should be more than ${k * n - g > 0 ? k * n - g : 0} because the loose ones are extra.`),
  };
}

function mTakeBags(rng, L, ctx) {
  const pk = pack(rng, ctx);
  const who = rng.pick(NAMES);
  const n = L === 1 ? ri(rng, 4, 9) : L === 2 ? ri(rng, 8, 25) : ri(rng, 15, 48);
  const k = L === 1 ? ri(rng, 2, 6) : L === 2 ? ri(rng, 3, 9) : ri(rng, 6, 14);
  const e = L === 3 ? ri(rng, 20, 90) : 0;
  const start = k * n + e + ri(rng, L === 1 ? 8 : 30, L === 1 ? 40 : 300);
  const val = start - k * n - e;
  return {
    stem: T3(
      `${who} starts with ${start} ${pk.item}. ${who} gives away ${k} ${pk.gs}. Each ${pk.g} has ${n} ${pk.item}.${e ? ` ${who} also gives away ${e} more ${pk.item}.` : ""}`,
      `${who} had ${start} ${pk.item} and gave away ${k} ${pk.gs} with ${n} ${pk.item} in each ${pk.g}.${e ? ` ${who} also gave away ${e} loose ${pk.item}.` : ""}`,
      `${who} began with ${start} ${pk.item}. ${who} then gave away ${k} full ${pk.gs}, each holding ${n} ${pk.item}${e ? `, together with ${e} loose ${pk.item}` : ""}.`,
    ),
    ask: T3(`How many ${pk.item} does ${who} have left?`, `How many ${pk.item} remain?`, `Determine how many ${pk.item} ${who} still has.`),
    unk: `the number of ${pk.item} ${who} has left`,
    prog: e ? [["a", "mul", k, n], ["b", "sub", start, "a"], ["c", "sub", "b", e]] : [["a", "mul", k, n], ["b", "sub", start, "a"]],
    out: e ? "c" : "b",
    expr: `${start} ${MINUS} ${k} ${TIMES} ${n}${e ? ` ${MINUS} ${e}` : ""}`,
    val: fr(val),
    st: { k: "int" },
    unit: pk.item,
    wrong: [
      { expr: `${start} ${MINUS} ${k}${e ? ` ${MINUS} ${e}` : ""}`, val: start - k - e, m: "subtracts-the-number-of-groups-not-the-items" },
      { expr: `${start} ${MINUS} ${n}${e ? ` ${MINUS} ${e}` : ""}`, val: start - n - e, m: "removes-only-one-group" },
      { expr: `${start} + ${k} ${TIMES} ${n}${e ? ` ${MINUS} ${e}` : ""}`, val: start + k * n - e, m: "adds-instead-of-removing" },
      { expr: `${k} ${TIMES} ${n}${e ? ` + ${e}` : ""}`, val: k * n + e, m: "finds-the-amount-given-away-not-the-amount-left" },
      { expr: `(${start} ${MINUS} ${k}) ${TIMES} ${n}`, val: (start - k) * n, m: "multiplies-before-taking-away" },
    ],
    work: [`Items given away in ${pk.gs}: ${k} ${TIMES} ${n} = ${num(k * n)}`, `Take them from the start: ${num(start)} ${MINUS} ${num(k * n)} = ${num(start - k * n)}`, ...(e ? [`Take away the loose ones: ${num(start - k * n)} ${MINUS} ${e} = ${num(val)}`] : [])],
    hints: {
      conceptual: "Decide how many items leave in all. Then decide whether the story asks for what left or what is still there.",
      procedural: `Turn the ${pk.gs} into a number of ${pk.item} first. Then compare that with the starting amount.`,
    },
    structure: S(`${who} gives ${pk.item} away`, [{ label: "start", value: start }, { label: pk.gs, value: k }, { label: `${pk.item} in each ${pk.g}`, value: n }, ...(e ? [{ label: "loose items given away", value: e }] : [])], `${pk.item} left`, "start, minus equal groups", "tape diagram: whole with a part removed", "The amount left must be less than the start."),
  };
}

function mShare(rng, L, ctx) {
  const pk = pack(rng, ctx);
  const who = rng.pick(NAMES);
  const q = L === 1 ? ri(rng, 3, 9) : L === 2 ? ri(rng, 8, 25) : ri(rng, 12, 60);
  const g = L === 1 ? ri(rng, 2, 5) : L === 2 ? ri(rng, 3, 8) : ri(rng, 4, 12);
  const u = L === 1 ? ri(rng, 2, 9) : L === 2 ? ri(rng, 5, 30) : ri(rng, 10, 90);
  const total = g * q + u;
  return {
    stem: T3(
      `There are ${total} ${pk.item}. ${u} of them cannot be used. ${who} sets them aside. ${who} puts the rest into ${g} equal groups.`,
      `${who} has ${total} ${pk.item}. ${u} of them cannot be used. ${who} shares the rest equally among ${g} groups.`,
      `Of ${total} ${pk.item}, ${u} are unusable. ${who} divides the remaining ${pk.item} equally among ${g} groups.`,
    ),
    ask: T3(`How many ${pk.item} are in each group?`, `How many ${pk.item} does each group get?`, `How many ${pk.item} are in each group?`),
    unk: `the number of ${pk.item} in each group`,
    prog: [["a", "sub", total, u], ["b", "div", "a", g]],
    out: "b",
    expr: `(${total} ${MINUS} ${u}) ${DIVIDE} ${g}`,
    val: fr(q),
    st: { k: "int" },
    unit: pk.item,
    wrong: [
      { expr: `${total} ${DIVIDE} ${g} ${MINUS} ${u}`, val: total / g - u, m: "takes-away-the-unusable-items-after-sharing" },
      { expr: `${total} ${MINUS} ${u} ${MINUS} ${g}`, val: total - u - g, m: "subtracts-the-number-of-groups" },
      { expr: `(${total} + ${u}) ${DIVIDE} ${g}`, val: (total + u) / g, m: "adds-the-unusable-items" },
      { expr: `${total} ${MINUS} ${u}`, val: total - u, m: "stops-before-sharing" },
      { expr: `${g} ${TIMES} (${total} ${MINUS} ${u})`, val: g * (total - u), m: "multiplies-instead-of-sharing" },
    ],
    work: [`Take away the ones that cannot be used: ${num(total)} ${MINUS} ${u} = ${num(total - u)}`, `Share equally: ${num(total - u)} ${DIVIDE} ${g} = ${q}`],
    hints: {
      conceptual: "Only the usable items get shared. Think about which amount is split into equal groups.",
      procedural: "Remove the ones that cannot be used first. Then split what remains.",
    },
    structure: S(`${who} sorts and shares ${pk.item}`, [{ label: "all items", value: total }, { label: "unusable", value: u }, { label: "groups", value: g }], `${pk.item} in each group`, "take away, then share equally", "tape diagram: whole minus part, then equal parts", "Each group's amount times the groups, plus the unusable ones, should equal the total."),
    eqOK: true,
  };
}

const CEIL_SCEN = [
  { people: "students", cont: "van", conts: "vans", verb: "holds" },
  { people: "guests", cont: "table", conts: "tables", verb: "seats" },
  { people: "campers", cont: "canoe", conts: "canoes", verb: "carries" },
];
function mRemainder(rng, L, ctx) {
  const kind = rng.pick(["ceil", "floor", "rem", "ceil"]);
  const who = rng.pick(NAMES);
  const c = L === 1 ? ri(rng, 4, 9) : L === 2 ? ri(rng, 6, 25) : ri(rng, 12, 40);
  const q = L === 1 ? ri(rng, 3, 8) : L === 2 ? ri(rng, 4, 15) : ri(rng, 8, 30);
  const r = ri(rng, 1, c - 1);
  const N = c * q + r;
  if (kind === "ceil") {
    const sc = rng.pick(CEIL_SCEN);
    const price = L === 3 ? ri(rng, 12, 60) : 0;
    const vehicles = q + 1;
    const val = price ? vehicles * price : vehicles;
    return {
      stem: T3(
        `${N} ${sc.people} need to travel. Each ${sc.cont} ${sc.verb} ${c} ${sc.people}.${price ? ` Each ${sc.cont} costs $${price}.` : ""}`,
        `A group of ${N} ${sc.people} needs ${sc.conts}. Each ${sc.cont} ${sc.verb} ${c} ${sc.people}${price ? ` and costs $${price}` : ""}.`,
        `${N} ${sc.people} must all be seated. A single ${sc.cont} ${sc.verb} at most ${c} ${sc.people}${price ? `, and each ${sc.cont} costs $${price}` : ""}.`,
      ),
      ask: price
        ? T3(`Everyone must have a place. How many dollars do the ${sc.conts} cost?`, `Everyone needs a place. What is the total cost of the ${sc.conts} in dollars?`, `Every person must be seated. Find the total cost of the ${sc.conts}, in dollars.`)
        : T3(`Everyone must have a place. How many ${sc.conts} are needed?`, `How many ${sc.conts} are needed so everyone has a place?`, `Find the fewest ${sc.conts} that will seat everyone.`),
      unk: "",
      prog: price ? [["a", "cdiv", N, c], ["b", "mul", "a", price]] : [["a", "cdiv", N, c]],
      out: price ? "b" : "a",
      expr: `${N} ${DIVIDE} ${c}`,
      val: fr(val),
      st: { k: "int" },
      unit: price ? "dollars" : sc.conts,
      eqOK: false,
      wrong: [
        { val: price ? q * price : q, m: "ignores-the-remainder" },
        { val: price ? (q + 2) * price : q + 2, m: "adds-too-many-vehicles" },
        { val: price ? r * price : r, m: "gives-the-remainder-as-the-answer" },
        { val: price ? vehicles + price : N - c, m: price ? "adds-the-cost-instead-of-multiplying" : "subtracts-instead-of-dividing" },
      ],
      work: [`${N} ${DIVIDE} ${c} = ${q} remainder ${r}`, `${q} full ${sc.conts} leave ${r} ${sc.people} without a place, so one more ${sc.cont} is needed: ${q} + 1 = ${vehicles}`, ...(price ? [`Find the cost: ${vehicles} ${TIMES} ${price} = ${num(val)}`] : [])],
      hints: {
        conceptual: `After the full ${sc.conts} are used, think about what happens to the people who are left over.`,
        procedural: `Divide the people by the number each ${sc.cont} holds. Then decide what the remainder means in this story.`,
      },
      structure: S(`${sc.people} are being grouped into ${sc.conts}`, [{ label: sc.people, value: N }, { label: `${sc.people} per ${sc.cont}`, value: c }], price ? "total cost" : `${sc.conts} needed`, "division with a remainder that must be interpreted", "equal groups with a leftover group", "A remainder means one more vehicle is needed, because you cannot use part of one."),
    };
  }
  const pk = pack(rng, ctx);
  if (kind === "floor") {
    return {
      stem: T3(`${who} has ${N} ${pk.item}. ${who} puts ${c} ${pk.item} in each ${pk.g}.`, `${who} has ${N} ${pk.item} and packs ${c} in each ${pk.g}.`, `${who} packs ${N} ${pk.item} into ${pk.gs}, placing exactly ${c} in each ${pk.g}.`),
      ask: T3(`How many full ${pk.gs} can ${who} make?`, `How many full ${pk.gs} can ${who} fill?`, `How many complete ${pk.gs} can ${who} fill?`),
      unk: "",
      prog: [["a", "fdiv", N, c]],
      out: "a",
      expr: `${N} ${DIVIDE} ${c}`,
      val: fr(q),
      st: { k: "int" },
      unit: pk.gs,
      eqOK: false,
      wrong: [
        { val: q + 1, m: "rounds-up-though-the-last-box-is-not-full" },
        { val: r, m: "gives-the-remainder-as-the-answer" },
        { val: N - c, m: "subtracts-instead-of-dividing" },
        { val: N + c, m: "adds-instead-of-dividing" },
      ],
      work: [`${N} ${DIVIDE} ${c} = ${q} remainder ${r}`, `The quotient ${q} counts the full ${pk.gs}. The ${r} left over do not fill another ${pk.g}`],
      hints: { conceptual: `A ${pk.g} only counts if it is full. Think about what the leftover ${pk.item} can and cannot do.`, procedural: `Divide the number of ${pk.item} by the number in each ${pk.g}. Look at the quotient and the remainder.` },
      structure: S(`${who} packs ${pk.item}`, [{ label: pk.item, value: N }, { label: `${pk.item} per ${pk.g}`, value: c }], `full ${pk.gs}`, "division; only the quotient counts", "equal groups with a leftover part", `The ${pk.gs} times ${c} must be no more than ${N}.`),
    };
  }
  return {
    stem: T3(`${who} has ${N} ${pk.item}. ${who} puts ${c} ${pk.item} in each ${pk.g}. ${who} fills as many ${pk.gs} as possible.`, `${who} packs ${N} ${pk.item} into ${pk.gs} of ${c} and fills as many as possible.`, `${who} packs ${N} ${pk.item} into as many full ${pk.gs} of ${c} as possible.`),
    ask: T3(`How many ${pk.item} are left over?`, `How many ${pk.item} are left over?`, `How many ${pk.item} remain unpacked?`),
    unk: "",
    prog: [["a", "rem", N, c]],
    out: "a",
    expr: `${N} ${DIVIDE} ${c}`,
    val: fr(r),
    st: { k: "int" },
    unit: pk.item,
    eqOK: false,
    wrong: [
      { val: q, m: "gives-the-quotient-as-the-answer" },
      { val: q + 1, m: "rounds-the-quotient-up" },
      { val: c - r, m: "finds-how-many-more-would-fill-a-box" },
      { val: N - q, m: "subtracts-the-quotient-from-the-total" },
    ],
    work: [`${N} ${DIVIDE} ${c} = ${q} remainder ${r}`, `${q} full ${pk.gs} use ${num(q * c)} ${pk.item}`, `Left over: ${N} ${MINUS} ${num(q * c)} = ${r}`],
    hints: { conceptual: `Left over means what stays after all the full ${pk.gs} are made.`, procedural: `Divide, then look at the remainder. You can check by multiplying the quotient by ${c} and comparing with the total.` },
    structure: S(`${who} packs ${pk.item}`, [{ label: pk.item, value: N }, { label: `${pk.item} per ${pk.g}`, value: c }], `${pk.item} left over`, "division; the remainder is the answer", "equal groups with a leftover part", `The leftover must be less than ${c}.`),
  };
}

function mCompare(rng, L, ctx) {
  const pk = pack(rng, ctx);
  const [A, B] = twoNames(rng);
  const k = L === 1 ? ri(rng, 3, 8) : L === 2 ? ri(rng, 6, 15) : ri(rng, 12, 30);
  const n = L === 1 ? ri(rng, 4, 9) : L === 2 ? ri(rng, 8, 20) : ri(rng, 15, 45);
  const m = ri(rng, Math.max(3, Math.floor((k * n) / 4)), Math.floor((k * n) / 1.5));
  const val = k * n - m;
  return {
    stem: T3(
      `${A} has ${k} ${pk.gs} with ${n} ${pk.item} in each ${pk.g}. ${B} has ${m} ${pk.item}.`,
      `${A} collected ${k} ${pk.gs} of ${pk.item}, with ${n} in each ${pk.g}. ${B} collected ${m} ${pk.item}.`,
      `${A} has gathered ${k} ${pk.gs} containing ${n} ${pk.item} each. ${B} has gathered ${m} ${pk.item} in total.`,
    ),
    ask: T3(`How many more ${pk.item} does ${A} have than ${B}?`, `How many more ${pk.item} does ${A} have than ${B}?`, `By how many ${pk.item} does ${A}'s collection exceed ${B}'s?`),
    unk: `how many more ${pk.item} ${A} has than ${B}`,
    prog: [["a", "mul", k, n], ["b", "sub", "a", m]],
    out: "b",
    expr: `${k} ${TIMES} ${n} ${MINUS} ${m}`,
    val: fr(val),
    st: { k: "int" },
    unit: pk.item,
    wrong: [
      { expr: `${k} ${TIMES} ${n} + ${m}`, val: k * n + m, m: "adds-instead-of-comparing" },
      { expr: `${k} ${TIMES} ${n}`, val: k * n, m: "forgets-to-compare-with-the-other-total" },
      { expr: `${k} + ${n} ${MINUS} ${m}`, val: k + n - m, m: "adds-the-group-numbers-instead-of-multiplying" },
      { expr: `${k} ${TIMES} ${n} ${MINUS} ${m} ${MINUS} ${k}`, val: val - k, m: "subtracts-an-extra-number" },
      { expr: `${k} ${TIMES} ${n} ${MINUS} ${n}`, val: k * n - n, m: "uses-the-wrong-number-in-the-comparison" },
    ],
    work: [`${A}'s total: ${k} ${TIMES} ${n} = ${num(k * n)}`, `Compare with ${B}: ${num(k * n)} ${MINUS} ${m} = ${num(val)}`],
    hints: { conceptual: `Before you compare, make both amounts the same kind of number: how many ${pk.item} each person has.`, procedural: `Find ${A}'s total first. Then find the difference between the two totals.` },
    structure: S(`${A} and ${B} compare ${pk.item}`, [{ label: `${A}'s ${pk.gs}`, value: k }, { label: `${pk.item} per ${pk.g}`, value: n }, { label: `${B}'s ${pk.item}`, value: m }], "the difference", "equal groups, then compare two totals", "tape diagram with two bars", `The difference must be smaller than ${A}'s total.`),
  };
}

function mChange(rng, L, ctx) {
  const it = sale(rng, ctx);
  const who = rng.pick(NAMES);
  const price = L === 1 ? ri(rng, 3, 9) : L === 2 ? ri(rng, 7, 29) : ri(rng, 12, 48);
  const k = L === 1 ? ri(rng, 2, 5) : L === 2 ? ri(rng, 3, 8) : ri(rng, 4, 12);
  const extra = L === 3 ? ri(rng, 5, 30) : 0;
  const cost = k * price + extra;
  const pay = Math.ceil((cost + 1) / 10) * 10 + (L === 1 ? 0 : rng.pick([0, 10]));
  const val = pay - cost;
  return {
    stem: T3(
      `${who} buys ${k} ${it.many}. Each ${it.one} costs $${price}.${extra ? ` ${who} also buys a bag for $${extra}.` : ""} ${who} pays with $${pay}.`,
      `${who} buys ${k} ${it.many} at $${price} each${extra ? ` and a bag for $${extra}` : ""}, then pays with $${pay}.`,
      `${who} purchases ${k} ${it.many} priced at $${price} each${extra ? `, plus a bag costing $${extra}` : ""}, and hands over $${pay}.`,
    ),
    ask: T3(`How many dollars does ${who} get back?`, `How much money does ${who} get back?`, `How much money should ${who} receive back?`),
    unk: `the number of dollars ${who} gets back`,
    prog: extra ? [["a", "mul", k, price], ["b", "add", "a", extra], ["c", "sub", pay, "b"]] : [["a", "mul", k, price], ["b", "sub", pay, "a"]],
    out: extra ? "c" : "b",
    expr: `${pay} ${MINUS} (${k} ${TIMES} ${price}${extra ? ` + ${extra}` : ""})`,
    val: fr(val),
    st: { k: "int" },
    unit: "dollars",
    wrong: [
      { expr: `${k} ${TIMES} ${price}${extra ? ` + ${extra}` : ""}`, val: cost, m: "finds-the-cost-not-the-change" },
      { expr: `${pay} ${MINUS} ${price}${extra ? ` ${MINUS} ${extra}` : ""}`, val: pay - price - extra, m: "pays-for-only-one-item" },
      { expr: `${pay} + ${k} ${TIMES} ${price}${extra ? ` + ${extra}` : ""}`, val: pay + cost, m: "adds-the-cost-to-the-payment" },
      extra ? { expr: `${pay} ${MINUS} ${k} ${TIMES} ${price}`, val: pay - k * price, m: "leaves-out-the-bag" } : { expr: `${pay} ${MINUS} ${k} ${MINUS} ${price}`, val: pay - k - price, m: "subtracts-the-count-instead-of-multiplying" },
    ],
    work: [`Cost of the ${it.many}: ${k} ${TIMES} ${price} = ${num(k * price)}`, ...(extra ? [`Add the bag: ${num(k * price)} + ${extra} = ${num(cost)}`] : []), `Change: ${pay} ${MINUS} ${num(cost)} = ${num(val)}`],
    hints: { conceptual: "Money paid, money spent and money returned are three different amounts. Which one does the question want?", procedural: "Find the total cost first. Then compare it with the money that was handed over." },
    structure: S(`${who} shops`, [{ label: it.many, value: k }, { label: "price each", value: `$${price}` }, ...(extra ? [{ label: "bag", value: `$${extra}` }] : []), { label: "paid", value: `$${pay}` }], "money returned", "equal groups of money, then pay minus cost", "bar model: paid = cost + change", `The change must be less than $${pay}.`),
  };
}

// ---- fractions and decimals
function fMoney(rng, L, ctx) {
  const a = sale(rng, ctx);
  const b = rng.pick(SALE[ctx].filter((x) => x.one !== a.one));
  const who = rng.pick(NAMES);
  const k = L === 1 ? ri(rng, 2, 4) : ri(rng, 3, 6);
  const p5 = ri(rng, 21, 79);
  const q5 = ri(rng, 30, 130);
  const p = p5 * 5;
  const q = q5 * 5;
  const coupon = L === 3 ? ri(rng, 6, 24) * 5 : 0;
  const total = k * p + q - coupon;
  const pay = rng.pick([20, 25, 30, 40, 50].filter((x) => x * 100 > total + 99));
  const change = pay * 100 - total;
  const D = (c) => (c / 100).toFixed(2);
  return {
    stem: T3(
      `${who} buys ${k} ${a.many} for $${D(p)} each and 1 ${b.one} for $${D(q)}.${coupon ? ` ${who} has a coupon for $${D(coupon)} off.` : ""} ${who} pays with $${pay}.`,
      `${who} buys ${k} ${a.many} at $${D(p)} each and 1 ${b.one} for $${D(q)}${coupon ? `, and uses a coupon for $${D(coupon)} off` : ""}. ${who} pays with $${pay}.`,
      `${who} purchases ${k} ${a.many} priced at $${D(p)} each and 1 ${b.one} priced at $${D(q)}${coupon ? `, then applies a $${D(coupon)} coupon` : ""}. ${who} pays with $${pay}.`,
    ),
    ask: T3(`How much change does ${who} get?`, `How much change does ${who} receive?`, `How much change should ${who} receive?`),
    unk: `the change ${who} gets`,
    prog: coupon ? [["a", "mul", k, D(p)], ["b", "add", "a", D(q)], ["c", "sub", "b", D(coupon)], ["d", "sub", pay, "c"]] : [["a", "mul", k, D(p)], ["b", "add", "a", D(q)], ["c", "sub", pay, "b"]],
    out: coupon ? "d" : "c",
    expr: `${pay} ${MINUS} (${k} ${TIMES} ${D(p)} + ${D(q)}${coupon ? ` ${MINUS} ${D(coupon)}` : ""})`,
    val: fr(change, 100),
    st: { k: "money" },
    unit: "",
    wrong: [
      { expr: `${k} ${TIMES} ${D(p)} + ${D(q)}${coupon ? ` ${MINUS} ${D(coupon)}` : ""}`, val: fr(total, 100), m: "finds-the-cost-not-the-change" },
      { expr: `${pay} ${MINUS} ${D(p)} ${MINUS} ${D(q)}${coupon ? ` + ${D(coupon)}` : ""}`, val: fr(pay * 100 - p - q + coupon, 100), m: "counts-the-price-of-only-one-item" },
      { expr: `${pay} ${MINUS} ${k} ${TIMES} ${D(p)}${coupon ? ` + ${D(coupon)}` : ""}`, val: fr(pay * 100 - k * p + coupon, 100), m: "leaves-out-one-of-the-purchases" },
      coupon ? { expr: `${pay} ${MINUS} (${k} ${TIMES} ${D(p)} + ${D(q)} + ${D(coupon)})`, val: fr(pay * 100 - total - 2 * coupon, 100), m: "adds-the-coupon-instead-of-subtracting" } : { expr: `${pay} ${MINUS} (${k} + ${D(p)} + ${D(q)})`, val: fr(pay * 100 - k * 100 - p - q, 100), m: "adds-the-count-instead-of-multiplying" },
    ],
    work: [`Cost of the ${a.many}: ${k} ${TIMES} $${D(p)} = $${D(k * p)}`, `Add the ${b.one}: $${D(k * p)} + $${D(q)} = $${D(k * p + q)}`, ...(coupon ? [`Subtract the coupon: $${D(k * p + q)} ${MINUS} $${D(coupon)} = $${D(total)}`] : []), `Change: $${pay} ${MINUS} $${D(total)} = $${D(change)}`],
    hints: { conceptual: "Line up the cents when you add or subtract money. Keep the decimal points in the same column.", procedural: "Find what is spent in total first. Then compare it with the money paid." },
    structure: S(`${who} shops with decimal prices`, [{ label: a.many, value: k }, { label: "price each", value: `$${D(p)}` }, { label: b.one, value: `$${D(q)}` }, { label: "paid", value: `$${pay}` }], "change", "equal groups of money, add, then subtract from the payment", "bar model: paid = spent + change", `The cost should be close to ${k} ${TIMES} $${Math.round(p / 100)} plus $${Math.round(q / 100)}.`),
  };
}

const FOODS = ["flour", "sugar", "oil", "rice", "milk"];
function fRecipe(rng, L, ctx) {
  const who = rng.pick(NAMES);
  const food = rng.pick(FOODS);
  const d = L === 1 ? rng.pick([2, 4]) : L === 2 ? rng.pick([3, 4, 5, 6]) : rng.pick([5, 6, 8]);
  let a;
  do a = ri(rng, 1, d - 1);
  while (gcd(a, d) !== 1);
  const k = L === 1 ? ri(rng, 2, 4) : L === 2 ? ri(rng, 3, 6) : ri(rng, 4, 8);
  const gn = ri(rng, Math.max(1, Math.floor((k * a) / 3)), k * a - 1);
  const g = fr(gn, d);
  const f = fr(a, d);
  const total = f.mul(fr(k));
  const need = total.sub(g);
  const gT = mixS(g);
  const fT = `${a}/${d}`;
  const gU = gn > d ? "cups" : "cup";
  return {
    stem: T3(
      `Each batch uses ${fT} cup of ${food}. ${who} makes ${k} batches. ${who} already measured ${gT} ${gU} of ${food}.`,
      `A batch of dough uses ${fT} cup of ${food}. ${who} is making ${k} batches and has already measured ${gT} ${gU} of ${food}.`,
      `One batch of dough requires ${fT} cup of ${food}. ${who} plans ${k} batches and has already measured ${gT} ${gU} of ${food}.`,
    ),
    ask: T3(`How many more cups of ${food} does ${who} need?`, `How many more cups of ${food} does ${who} need?`, `How many additional cups of ${food} are required?`),
    unk: `the number of cups of ${food} ${who} still needs`,
    prog: [["a", "mul", k, `${a}/${d}`], ["b", "sub", "a", `${gn}/${d}`]],
    out: "b",
    expr: `${k} ${TIMES} ${fT} ${MINUS} ${gT}`,
    val: need,
    st: { k: "frac", mixed: true },
    unit: "cups",
    wrong: [
      { expr: `${k} ${TIMES} ${fT} + ${gT}`, val: total.add(g), m: "adds-the-amount-already-measured" },
      { expr: `${k} ${TIMES} ${fT}`, val: total, m: "forgets-what-is-already-measured" },
      { expr: `${gT} ${MINUS} ${fT}`, val: g.sub(f), m: "uses-one-batch-instead-of-all-batches" },
      { expr: `${k} + ${fT} ${MINUS} ${gT}`, val: fr(k).add(f).sub(g), m: "adds-the-batches-instead-of-multiplying" },
      { expr: `${k} ${TIMES} ${fT} ${MINUS} ${fT}`, val: total.sub(f), m: "subtracts-one-batch-instead-of-the-amount-measured" },
      { expr: `${k} ${TIMES} (${fT} ${MINUS} ${gT})`, val: f.sub(g).mul(fr(k)), m: "multiplies-the-wrong-difference" },
    ],
    work: [`Cups needed for ${k} batches: ${k} ${TIMES} ${fT} = ${mixS(total)}`, `Subtract what is measured: ${mixS(total)} ${MINUS} ${gT} = ${mixS(need)}`],
    hints: { conceptual: "Find the total amount the recipe needs. Then compare it with the amount already measured.", procedural: `Use a common denominator when you subtract. Write the improper fraction first if that helps.` },
    structure: S(`${who} is baking`, [{ label: "per batch", value: `${fT} cup` }, { label: "batches", value: k }, { label: "already measured", value: `${gT} ${gU}` }], "amount still needed", "multiply a fraction by a whole number, then subtract", "tape diagram: needed = measured + still needed", `The total needed is more than ${gT} cups, so some more is needed.`),
    eqOK: true,
  };
}

const LONG = [{ one: "ribbon", unit: "meters" }, { one: "rope", unit: "meters" }, { one: "board", unit: "meters" }];
function fPieces(rng, L, ctx) {
  const o = rng.pick(LONG);
  const who = rng.pick(NAMES);
  const N = L === 1 ? ri(rng, 2, 5) : ri(rng, 3, 9);
  const m = L === 1 ? rng.pick([2, 3, 4]) : rng.pick([3, 4, 5, 6, 8]);
  const total = N * m;
  const u = ri(rng, Math.max(1, Math.floor(total / 3)), total - 1);
  return {
    stem: T3(
      `A ${o.one} is ${N} ${o.unit} long. ${who} cuts it into pieces. Each piece is 1/${m} meter long. Then ${who} uses ${u} pieces.`,
      `A ${o.one} ${N} ${o.unit} long is cut into pieces that are each 1/${m} meter long. ${who} uses ${u} of the pieces.`,
      `A ${o.one} measuring ${N} ${o.unit} is cut into pieces of length 1/${m} meter. ${who} uses ${u} of the pieces.`,
    ),
    ask: T3(`How many pieces are left?`, `How many pieces are left?`, `How many pieces remain unused?`),
    unk: "the number of pieces left",
    prog: [["a", "div", N, `1/${m}`], ["b", "sub", "a", u]],
    out: "b",
    expr: `${N} ${DIVIDE} 1/${m} ${MINUS} ${u}`,
    val: fr(total - u),
    st: { k: "int" },
    unit: "pieces",
    wrong: [
      { expr: `${N} ${TIMES} 1/${m} ${MINUS} ${u}`, val: fr(N, m).sub(fr(u)), m: "multiplies-by-the-fraction-instead-of-dividing" },
      { expr: `${N} ${DIVIDE} ${m} ${MINUS} ${u}`, val: fr(N, m).sub(fr(u)), m: "divides-by-the-denominator-only" },
      { expr: `${N} ${DIVIDE} 1/${m}`, val: total, m: "forgets-the-pieces-that-were-used" },
      { expr: `${N} ${DIVIDE} 1/${m} + ${u}`, val: total + u, m: "adds-the-pieces-that-were-used" },
      { expr: `${N} ${MINUS} ${u}`, val: N - u, m: "ignores-the-length-of-each-piece" },
    ],
    work: [`Pieces in ${N} meters: each meter makes ${m} pieces, so ${N} ${TIMES} ${m} = ${total}`, `Pieces left: ${total} ${MINUS} ${u} = ${total - u}`],
    hints: { conceptual: "How many pieces of length 1/" + m + " fit into one whole meter? Use that to count the pieces in all the meters.", procedural: "Find the number of pieces first. Then take away the pieces that were used." },
    structure: S(`${who} cuts a ${o.one}`, [{ label: "length", value: `${N} meters` }, { label: "piece length", value: `1/${m} meter` }, { label: "used", value: `${u} pieces` }], "pieces left", "divide a whole number by a unit fraction, then subtract", "number line marked in equal pieces", `The number of pieces should be greater than ${N} because each piece is shorter than 1 meter.`),
    eqOK: true,
  };
}

const LIQ = [{ jug: "jug", liquid: "juice", cup: "cups" }, { jug: "bottle", liquid: "water", cup: "glasses" }, { jug: "pitcher", liquid: "milk", cup: "mugs" }];
function fShare(rng, L, ctx) {
  const o = rng.pick(LIQ);
  const b = L === 1 ? rng.pick([2, 3]) : rng.pick([2, 3, 4, 5]);
  const k = L === 1 ? ri(rng, 3, 4) : ri(rng, 3, 6);
  const m = ri(rng, 2, k - 1);
  const val = fr(m, b * k);
  return {
    stem: T3(
      `A ${o.jug} holds 1/${b} liter of ${o.liquid}. It is poured equally into ${k} ${o.cup}. Then ${m} of the ${o.cup} go on a table.`,
      `A ${o.jug} holds 1/${b} liter of ${o.liquid}. All of it is poured equally into ${k} ${o.cup}. Then ${m} of the ${o.cup} are put on a table.`,
      `A ${o.jug} contains 1/${b} liter of ${o.liquid}, which is poured equally into ${k} ${o.cup}. ${m} of the ${o.cup} are then placed on a table.`,
    ),
    ask: T3(`How many liters of ${o.liquid} are on the table?`, `How many liters of ${o.liquid} are on the table?`, `How many liters of ${o.liquid} are on the table in total?`),
    unk: `the number of liters of ${o.liquid} on the table`,
    prog: [["a", "div", `1/${b}`, k], ["b", "mul", "a", m]],
    out: "b",
    expr: `1/${b} ${DIVIDE} ${k} ${TIMES} ${m}`,
    val,
    st: { k: "frac" },
    unit: "liters",
    wrong: [
      { expr: `1/${b} ${DIVIDE} ${k}`, val: fr(1, b * k), m: "finds-only-one-cup" },
      { expr: `1/${b} ${TIMES} ${k} ${TIMES} ${m}`, val: fr(k * m, b), m: "multiplies-instead-of-dividing" },
      { expr: `1/${b} ${TIMES} ${m}`, val: fr(m, b), m: "forgets-to-share-equally" },
      { expr: `1/${b} ${DIVIDE} ${m}`, val: fr(1, b * m), m: "divides-by-the-wrong-number" },
      { expr: `1/${b} ${DIVIDE} ${k} + ${m}`, val: fr(1, b * k).add(fr(m)), m: "adds-the-count-of-cups" },
    ],
    work: [`One cup holds 1/${b} ${DIVIDE} ${k} = 1/${b * k} liter`, `${m} ${o.cup} hold ${m} ${TIMES} 1/${b * k} = ${m}/${b * k}${val.d === b * k ? "" : `, or ${frS(val)},`} liter`],
    hints: { conceptual: "Sharing a fraction equally makes the pieces smaller. Think about how much one cup holds first.", procedural: "Divide the fraction by the number of cups. Then multiply by the number of cups on the table." },
    structure: S(`${o.liquid} is shared`, [{ label: "in the " + o.jug, value: `1/${b} liter` }, { label: o.cup, value: k }, { label: "on the table", value: m }], "liters on the table", "divide a unit fraction by a whole number, then multiply", "fraction strip cut into equal parts", "One cup holds less than the whole amount, so the answer must be less than the amount in the jug.") ,
  };
}

function fBoard(rng, L, ctx) {
  const who = rng.pick(NAMES);
  const o = rng.pick([{ one: "board", unit: "meters" }, { one: "rope", unit: "meters" }, { one: "ribbon", unit: "meters" }]);
  const k = L === 1 ? ri(rng, 2, 5) : ri(rng, 3, 8);
  const u10 = L === 1 ? ri(rng, 3, 15) : ri(rng, 4, 28);
  const D10 = u10 * k;
  const m = ri(rng, 2, k - 1);
  const t = (x) => (x / 10).toFixed(1);
  const val = fr(u10 * m, 10);
  return {
    stem: T3(
      `A ${o.one} is ${t(D10)} ${o.unit} long. ${who} cuts it into ${k} equal pieces. ${who} uses ${m} of the pieces.`,
      `A ${o.one} ${t(D10)} ${o.unit} long is cut into ${k} equal pieces. ${who} uses ${m} of the pieces.`,
      `A ${o.one} measuring ${t(D10)} ${o.unit} is cut into ${k} pieces of equal length. ${who} uses ${m} of them.`,
    ),
    ask: T3(`How many ${o.unit} of the ${o.one} does ${who} use?`, `How many ${o.unit} of the ${o.one} does ${who} use?`, `What total length of the ${o.one} does ${who} use?`),
    unk: `the length of ${o.one} ${who} uses`,
    prog: [["a", "div", t(D10), k], ["b", "mul", "a", m]],
    out: "b",
    expr: `${t(D10)} ${DIVIDE} ${k} ${TIMES} ${m}`,
    val,
    st: { k: "dec", p: 1 },
    unit: o.unit,
    wrong: [
      { expr: `${t(D10)} ${DIVIDE} ${k}`, val: fr(u10, 10), m: "finds-the-length-of-one-piece-only" },
      { expr: `${t(D10)} ${DIVIDE} ${m}`, val: fr(D10, 10 * m), m: "divides-by-the-number-of-pieces-used" },
      { expr: `${t(D10)} ${MINUS} ${m}`, val: fr(D10 - 10 * m, 10), m: "subtracts-the-count-of-pieces" },
      { expr: `${t(D10)} ${TIMES} ${m}`, val: fr(D10 * m, 10), m: "multiplies-the-whole-length-instead-of-one-piece" },
      { expr: `${t(D10)} ${DIVIDE} ${k} ${TIMES} (${k} ${MINUS} ${m})`, val: fr(u10 * (k - m), 10), m: "finds-the-part-not-used" },
    ],
    work: [`Length of one piece: ${t(D10)} ${DIVIDE} ${k} = ${t(u10)}`, `Length of ${m} pieces: ${m} ${TIMES} ${t(u10)} = ${t(u10 * m)}`],
    hints: { conceptual: "Find the size of one equal piece before you decide how many pieces are used.", procedural: "Divide the length by the number of pieces. Then multiply by the number of pieces used. Keep the decimal point in the right place." },
    structure: S(`${who} cuts a ${o.one}`, [{ label: "length", value: `${t(D10)} ${o.unit}` }, { label: "equal pieces", value: k }, { label: "pieces used", value: m }], "length used", "divide a decimal by a whole number, then multiply", "tape diagram split into equal parts", `The length used must be less than ${t(D10)} meters.`),
  };
}

// ---- estimation
function roundTo(x, place) {
  return Math.floor((x + place / 2) / place) * place;
}
function mEstimate(rng, L, ctx, frac) {
  const who = rng.pick(NAMES);
  const pk = pack(rng, ctx);
  if (frac) {
    // decimals rounded to the nearest whole number
    const mk = () => {
      let x;
      do x = ri(rng, 12, 99);
      while (x % 10 === 5);
      return x / 10;
    };
    const a = mk();
    const bc = ri(rng, 3, 9) * 100 + rng.pick([30, 70, 20, 80]);
    const b = (bc / 100).toFixed(2);
    const ra = Math.round(a);
    const rb = Math.round(bc / 100);
    const val = ra * rb;
    const exact = ((Math.round(a * 10) * bc) / 1000).toFixed(2);
    const food = rng.pick(["rice", "beans", "apples", "grapes"]);
    return {
      spec: { kind: "estimate", op: "mul", a: String(a), b, place: 1 },
      stem: T3(
        `${who} buys ${a} pounds of ${food}. Each pound costs $${b}.`,
        `${who} buys ${a} pounds of ${food} at $${b} per pound.`,
        `${who} purchases ${a} pounds of ${food} priced at $${b} per pound.`,
      ),
      ask: T3(`Round each number to the nearest whole number. Then multiply. About how many dollars?`, `Round each number to the nearest whole number, then multiply. About how many dollars is the cost?`, `Round each factor to the nearest whole number and multiply to estimate the cost, in dollars.`),
      expr: `${a} ${TIMES} ${b}`,
      answer: { value: String(val), text: num(val), kind: "int", unit: "dollars" },
      work: [`Round ${a} to ${ra} and ${b} to ${rb}`, `Multiply the rounded numbers: ${ra} ${TIMES} ${rb} = ${val}`, `The estimate is about ${val} dollars. The exact cost, $${exact}, is close to it`],
      distractors: distr(fr(val), { k: "int" }, [[ra * Math.ceil(bc / 100), "rounds-one-number-up-only"], [Math.floor(a) * Math.floor(bc / 100), "cuts-off-the-decimal-parts"], [val * 10, "moves-the-decimal-point-wrongly"], [ra + rb, "adds-the-rounded-numbers"], ...slips(val)]),
      hints: { conceptual: "An estimate uses friendly numbers so the arithmetic is easy. Round first, then compute.", procedural: "Round each number to the nearest whole number. Then multiply the rounded numbers." },
      structure: S(`${who} is shopping`, [{ label: "weight", value: `${a} pounds` }, { label: "price per pound", value: `$${b}` }], "an estimate of the cost", "multiplication of rounded numbers", "rounded numbers on a number line", "The estimate should be close to the exact product."),
    };
  }
  const op = L === 1 ? "mul" : rng.pick(["mul", "add", "sub"]);
  const place = op === "mul" ? 10 : 100;
  const mk = (lo, hi) => {
    let x;
    do x = ri(rng, lo, hi);
    while (x % place === place / 2 || (place === 100 && x % 100 === 50));
    return x;
  };
  let a;
  let b;
  if (op === "mul") {
    a = mk(L === 1 ? 12 : 22, L === 1 ? 49 : 89);
    b = mk(L === 1 ? 12 : 21, L === 1 ? 39 : 69);
  } else if (op === "add") {
    a = mk(210, 890);
    b = mk(110, 790);
  } else {
    a = mk(L === 3 ? 4100 : 810, L === 3 ? 8900 : 990);
    b = mk(L === 3 ? 1100 : 210, L === 3 ? 3900 : 590);
  }
  const ra = roundTo(a, place);
  const rb = roundTo(b, place);
  const val = op === "mul" ? ra * rb : op === "add" ? ra + rb : ra - rb;
  const exact = op === "mul" ? a * b : op === "add" ? a + b : a - b;
  const sym = op === "mul" ? TIMES : op === "add" ? "+" : MINUS;
  const placeName = place === 10 ? "ten" : "hundred";
  const stems = {
    mul: T3(`A hall has ${a} rows. Each row has ${b} seats.`, `A concert hall has ${a} rows with ${b} seats in each row.`, `A concert hall contains ${a} rows, and every row has ${b} seats.`),
    add: T3(`${who} reads ${a} pages in one month and ${b} pages in the next month.`, `${who} read ${a} pages one month and ${b} pages the next month.`, `${who} read ${a} pages during one month and ${b} pages during the following month.`),
    sub: T3(`A game has ${a} points to win. ${who} has ${b} points.`, `A game needs ${a} points to win. ${who} has scored ${b} points so far.`, `A game is won at ${a} points. ${who} has scored ${b} points so far.`),
  };
  const noun = op === "mul" ? "seats" : op === "add" ? "pages" : "points";
  const ask = op === "sub" ? "How many more points does " + who + " need" : op === "add" ? "How many pages did " + who + " read" : "How many seats are there";
  return {
    spec: { kind: "estimate", op, a, b, place },
    stem: stems[op],
    ask: T3(`Round each number to the nearest ${placeName}. Then ${op === "mul" ? "multiply" : op === "add" ? "add" : "subtract"}. About how many ${noun}?`, `Round each number to the nearest ${placeName}, then ${op === "mul" ? "multiply" : op === "add" ? "add" : "subtract"}. ${ask}, about?`, `Estimate by rounding each number to the nearest ${placeName} first. ${ask}, approximately?`),
    expr: `${num(a)} ${sym} ${num(b)}`,
    answer: { value: String(val), text: num(val), kind: "int", unit: noun },
    work: [`Round ${num(a)} to ${num(ra)} and ${num(b)} to ${num(rb)}`, `Compute with the rounded numbers: ${num(ra)} ${sym} ${num(rb)} = ${num(val)}`, `The estimate is about ${num(val)}. The exact answer is ${num(exact)}, which is close`],
    distractors: distr(fr(val), { k: "int" }, [
      [exact, "finds-the-exact-answer-when-asked-to-estimate"],
      [op === "mul" ? ra * b : op === "add" ? ra + b : ra - b, "rounds-only-one-number"],
      [op === "mul" ? Math.floor(a / place) * place * (Math.floor(b / place) * place) : op === "add" ? Math.floor(a / place) * place + Math.floor(b / place) * place : Math.floor(a / place) * place - Math.floor(b / place) * place, "always-rounds-down"],
      [val * 10, "adds-a-zero-too-many"],
      [op === "mul" ? ra + rb : val + place, "uses-the-wrong-operation-or-place"],
      ...slips(val),
    ]),
    hints: { conceptual: "An estimate is close to the exact answer but easier to find. Rounding makes the numbers friendlier.", procedural: `Round both numbers to the nearest ${placeName}. Then do the operation with the rounded numbers.` },
    structure: S(`${who} needs a quick estimate`, [{ label: "first number", value: num(a) }, { label: "second number", value: num(b) }], `about how many ${noun}`, "rounding, then one operation", "number line to see which way to round", "The estimate should be close to the exact answer."),
  };
}

function mFinish(rng, c, level, mode) {
  const wrongs = c.wrong.map((w) => ({ ...w, f: toFr(w.val) })).filter((w) => w.f.cmp(c.val) !== 0);
  const exprW = wrongs.filter((w) => w.expr);
  const eq = c.eqOK !== false && exprW.length >= 3 && rng.chance(0.22);
  const common = { family: "multistep", level, stem: c.stem, hints: c.hints, structure: c.structure };
  if (eq) {
    const v = rng.pick(["n", "t", "p", "w"]);
    const answerText = `${v} = ${c.expr}`;
    const ds = tdistr(answerText, exprW.map((w) => [`${v} = ${w.expr}`, w.m]));
    return finalize({
      ...common,
      spec: { kind: "eqpick", letter: v, prog: c.prog, out: c.out, options: [c.expr, ...ds.map((d) => d.text.slice(v.length + 3))] },
      ask: T3(`Let ${v} stand for ${c.unk}. Which equation can be used to find ${v}?`, `Let ${v} be ${c.unk}. Which equation shows how to find ${v}?`, `Let ${v} represent ${c.unk}. Which equation correctly models this situation?`),
      expr: null,
      answer: { value: answerText, text: answerText, kind: "text" },
      work: [`Name the unknown: ${v} is ${c.unk}`, `Write the steps in the order they happen: ${v} = ${c.expr}`, ...c.work],
      distractors: ds,
      hints: { conceptual: "Write what happens in the story in order. Use a letter for the number you do not know yet.", procedural: "Decide which step happens first. Join the steps with the operations the story uses." },
    });
  }
  return finalize({
    ...common,
    spec: { kind: "prog", prog: c.prog, out: c.out },
    ask: c.ask,
    expr: c.expr,
    answer: ans(c.val, c.st, c.unit),
    work: c.work,
    distractors: distr(c.val, c.st, [...wrongs.map((w) => [w.f, w.m]), ...slips(Number(c.val.value))]),
  });
}

FAMILIES.multistep = {
  title: "Multistep problems",
  grades: [4, 5],
  defaults: { fractions: false },
  gen(rng, P, { level = 1, ctx = "store" } = {}) {
    const L = level;
    if (rng.chance(0.15)) {
      const e = mEstimate(rng, L, ctx, !!P.fractions);
      return finalize({ family: "multistep", level, ...e });
    }
    const pool = P.fractions ? [fMoney, fRecipe, fPieces, fShare, fBoard] : [mGroups, mTakeBags, mShare, mRemainder, mCompare, mChange];
    const core = rng.pick(pool)(rng, L, ctx);
    return mFinish(rng, core, level);
  },
  check(p, params) {
    const P = { fractions: false, ...params };
    if (!P.fractions && p.answer.kind !== "int" && p.answer.kind !== "text") return `whole-number mode produced a ${p.answer.kind} answer`;
    return null;
  },
};

// ================================================================================================ exprs (g5.expressions)
// Expressions are small trees so the same object gives the displayed text, the text the solver re-parses, the worked steps and
// the wrong answers a student gets by ignoring the grouping or the order of operations.
const N_ = (n) => ({ n });
const B_ = (op, l, r, g = false) => ({ op, l, r, g });
function evT(t) {
  if (!t.op) return t.n;
  const a = evT(t.l);
  const b = evT(t.r);
  if (a == null || b == null) return null;
  if (t.op === "^") return a ** b;
  if (t.op === "+") return a + b;
  if (t.op === MINUS) return a - b < 0 ? null : a - b;
  if (t.op === TIMES) return a * b;
  return b === 0 || a % b ? null : a / b;
}
const gdT = (t) => (!t.op ? 0 : Math.max(gdT(t.l), gdT(t.r)) + (t.g ? 1 : 0));
const BR = [["(", ")"], ["[", "]"], ["{", "}"]];
function showT(t) {
  if (!t.op) return num(t.n);
  const s = `${showT(t.l)} ${t.op} ${showT(t.r)}`;
  if (!t.g) return s;
  const [o, c] = BR[Math.min(Math.max(gdT(t.l), gdT(t.r)), 2)];
  return `${o}${s}${c}`;
}
const specT = (t) => {
  if (!t.op) return String(t.n);
  const s = `${specT(t.l)} ${t.op} ${specT(t.r)}`;
  return t.g ? `(${s})` : s;
};
const OPNAME = { "+": "add", [MINUS]: "subtract", [TIMES]: "multiply", [DIVIDE]: "divide" };
function traceT(t, lines) {
  if (!t.op) return t.n;
  const a = traceT(t.l, lines);
  const b = traceT(t.r, lines);
  const v = evT({ op: t.op, l: N_(a), r: N_(b) });
  lines.push(`${t.g ? `Inside the grouping symbols, ${OPNAME[t.op]}` : cap(OPNAME[t.op])}: ${num(a)} ${t.op} ${num(b)} = ${num(v)}`);
  return v;
}
const flatT = (t) => (!t.op ? [t.n] : [...flatT(t.l), t.op, ...flatT(t.r)]);
const ap = (op, a, b) => (op === "+" ? a.add(b) : op === MINUS ? a.sub(b) : op === TIMES ? a.mul(b) : a.div(b));
function ltrT(tok) {
  let v = fr(tok[0]);
  for (let i = 1; i < tok.length; i += 2) {
    const b = fr(tok[i + 1]);
    if (tok[i] === DIVIDE && b.n === 0) return null;
    v = ap(tok[i], v, b);
  }
  return v;
}
function precT(tok) {
  const t = tok.slice();
  for (const group of [[TIMES, DIVIDE], ["+", MINUS]]) {
    for (let i = 1; i < t.length; ) {
      if (group.includes(t[i])) {
        const a = t[i - 1] instanceof Fr ? t[i - 1] : fr(t[i - 1]);
        const b = t[i + 1] instanceof Fr ? t[i + 1] : fr(t[i + 1]);
        if (t[i] === DIVIDE && b.n === 0) return null;
        t.splice(i - 1, 3, ap(t[i], a, b));
      } else i += 2;
    }
  }
  return t[0] instanceof Fr ? t[0] : fr(t[0]);
}

const EXPR_FORMS = {
  1: [
    (r) => B_(TIMES, N_(ri(r, 2, 9)), B_("+", N_(ri(r, 2, 12)), N_(ri(r, 2, 12)), true)),
    (r) => B_(TIMES, B_("+", N_(ri(r, 2, 12)), N_(ri(r, 2, 12)), true), N_(ri(r, 2, 9))),
    (r) => B_("+", N_(ri(r, 2, 30)), B_(TIMES, N_(ri(r, 2, 9)), N_(ri(r, 2, 9)))),
    (r) => {
      const c = ri(r, 2, 9);
      const b = ri(r, 2, 20);
      return B_(DIVIDE, B_(MINUS, N_(b + c * ri(r, 2, 9)), N_(b), true), N_(c));
    },
    (r) => B_(MINUS, B_(TIMES, N_(ri(r, 3, 9)), N_(ri(r, 3, 9))), N_(ri(r, 2, 20))),
    (r) => B_(MINUS, N_(ri(r, 25, 60)), B_("+", N_(ri(r, 2, 14)), N_(ri(r, 2, 14)), true)),
    (r) => {
      const b = ri(r, 2, 9);
      return B_("+", B_(DIVIDE, N_(b * ri(r, 2, 12)), N_(b)), N_(ri(r, 2, 20)));
    },
  ],
  2: [
    (r) => B_(MINUS, B_(TIMES, N_(ri(r, 2, 9)), B_("+", N_(ri(r, 2, 12)), N_(ri(r, 2, 12)), true)), N_(ri(r, 2, 20))),
    (r) => B_(TIMES, B_("+", N_(ri(r, 2, 15)), N_(ri(r, 2, 15)), true), B_(MINUS, N_(ri(r, 8, 20)), N_(ri(r, 2, 7)), true)),
    (r) => B_(MINUS, B_("+", N_(ri(r, 5, 30)), B_(TIMES, N_(ri(r, 2, 9)), N_(ri(r, 2, 9)))), N_(ri(r, 2, 15))),
    (r) => {
      const c = ri(r, 2, 9);
      const b = ri(r, 2, 20);
      return B_("+", B_(DIVIDE, B_(MINUS, N_(b + c * ri(r, 2, 9)), N_(b), true), N_(c)), N_(ri(r, 2, 20)));
    },
    (r) => {
      const d = ri(r, 2, 9);
      return B_("+", B_(TIMES, N_(ri(r, 2, 12)), N_(ri(r, 2, 9))), B_(DIVIDE, N_(d * ri(r, 2, 9)), N_(d)));
    },
  ],
  3: [
    (r) => B_(TIMES, B_("+", N_(ri(r, 2, 15)), B_(MINUS, N_(ri(r, 8, 20)), N_(ri(r, 2, 7)), true), true), N_(ri(r, 2, 9))),
    (r) => B_(TIMES, N_(ri(r, 2, 9)), B_(MINUS, B_("+", N_(ri(r, 3, 15)), N_(ri(r, 3, 15)), true), N_(ri(r, 2, 8)), true)),
    (r) => {
      const e = ri(r, 2, 6);
      const b = ri(r, 2, 6);
      const c = ri(r, 6, 12);
      const d = ri(r, 2, 5);
      const need = b * (c - d);
      const q = Math.ceil((need + 2) / e) + ri(r, 0, 5);
      return B_(DIVIDE, B_("+", N_(e * q - need), B_(TIMES, N_(b), B_(MINUS, N_(c), N_(d), true), true), true), N_(e));
    },
    (r) => {
      const c = ri(r, 2, 6);
      const b = ri(r, 2, 15);
      return B_(TIMES, B_("+", B_(DIVIDE, B_(MINUS, N_(b + c * ri(r, 2, 8)), N_(b), true), N_(c)), N_(ri(r, 2, 12)), true), N_(ri(r, 2, 9)));
    },
    (r) => B_(MINUS, N_(ri(r, 60, 120)), B_("+", N_(ri(r, 2, 15)), B_(TIMES, N_(ri(r, 2, 9)), N_(ri(r, 2, 9)), true), true)),
  ],
};
function exprTree(rng, L) {
  for (let i = 0; i < 300; i++) {
    const t = rng.pick(EXPR_FORMS[L])(rng);
    const v = evT(t);
    if (v != null && v > 0 && v <= 600) return t;
  }
  throw new Error("exprTree: no valid expression");
}

const ord = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10 < 4 ? n % 10 : 0]}`;

function exprEval(rng, L) {
  const t = exprTree(rng, L);
  const val = evT(t);
  const disp = showT(t);
  const lines = [];
  traceT(t, lines);
  const flat = flatT(t);
  return finalize({
    family: "exprs",
    level: L,
    spec: { kind: "eval", expr: specT(t) },
    stem: T3("", "", ""),
    ask: T3(`What is the value of ${disp}?`, `Evaluate: ${disp}`, `Find the value of the numerical expression ${disp}.`),
    expr: disp,
    answer: { value: String(val), text: num(val), kind: "int" },
    work: lines,
    visual: null,
    distractors: distr(fr(val), { k: "int" }, [
      [ltrT(flat), "works-left-to-right-ignoring-the-order-of-operations"],
      [precT(flat), "ignores-the-grouping-symbols"],
      ...slips(val),
    ]),
    hints: {
      conceptual: "Grouping symbols tell you which part to work out first. After that, multiplication and division come before addition and subtraction.",
      procedural: "Find the innermost group, work it out, and rewrite the expression with that number. Repeat until no grouping symbols are left.",
    },
  });
}
const WFORMS = ["sumTimes", "diffTimes", "prodPlus", "sumDiv", "plusProd", "minusSum"];
function exprWrite(rng, L) {
  const form = rng.pick(WFORMS);
  const hi = L === 1 ? 12 : L === 2 ? 25 : 60;
  let a = ri(rng, 3, hi);
  let b = ri(rng, 2, hi);
  let c = ri(rng, 2, 9);
  const k = ri(rng, 2, 9);
  let phrase;
  let expr;
  let wrong;
  let val;
  if (form === "sumTimes") {
    phrase = T3(`Add ${a} and ${b}. Then multiply the answer by ${k}.`, `Add ${a} and ${b}, then multiply the sum by ${k}.`, `Find the sum of ${a} and ${b}, then multiply that sum by ${k}.`);
    expr = `${k} ${TIMES} (${a} + ${b})`;
    val = k * (a + b);
    wrong = [[`${k} ${TIMES} ${a} + ${b}`, k * a + b, "multiplies-only-the-first-number"], [`${a} + ${b} ${TIMES} ${k}`, a + b * k, "does-not-group-the-sum"], [`${k} + ${a} + ${b}`, k + a + b, "adds-every-number"], [`(${a} + ${b}) ${DIVIDE} ${k}`, (a + b) / k, "divides-instead-of-multiplying"]];
  } else if (form === "diffTimes") {
    if (a <= b) [a, b] = [b + 1, a];
    phrase = T3(`Subtract ${b} from ${a}. Then multiply the answer by ${k}.`, `Subtract ${b} from ${a}, then multiply the difference by ${k}.`, `Find the difference when ${b} is subtracted from ${a}, then multiply that difference by ${k}.`);
    expr = `${k} ${TIMES} (${a} ${MINUS} ${b})`;
    val = k * (a - b);
    wrong = [[`${k} ${TIMES} ${a} ${MINUS} ${b}`, k * a - b, "multiplies-only-the-first-number"], [`${k} ${TIMES} (${b} ${MINUS} ${a})`, k * (b - a), "reverses-the-subtraction"], [`${b} ${MINUS} ${a} ${TIMES} ${k}`, b - a * k, "reverses-the-subtraction-and-skips-the-group"], [`${a} ${MINUS} ${b} ${TIMES} ${k}`, a - b * k, "does-not-group-the-difference"]];
  } else if (form === "prodPlus") {
    phrase = T3(`Multiply ${a} by ${b}. Then add ${c}.`, `Multiply ${a} by ${b}, then add ${c} to the product.`, `Find the product of ${a} and ${b}, then add ${c} to that product.`);
    expr = `${a} ${TIMES} ${b} + ${c}`;
    val = a * b + c;
    wrong = [[`${a} ${TIMES} (${b} + ${c})`, a * (b + c), "groups-the-wrong-numbers"], [`${a} + ${b} ${TIMES} ${c}`, a + b * c, "multiplies-the-wrong-pair"], [`${a} ${TIMES} ${b} ${MINUS} ${c}`, a * b - c, "uses-the-wrong-operation"], [`(${a} + ${b}) ${TIMES} ${c}`, (a + b) * c, "adds-before-multiplying"]];
  } else if (form === "sumDiv") {
    const q = ri(rng, 2, 9);
    const s = c * q;
    a = ri(rng, 2, s - 1);
    b = s - a;
    phrase = T3(`Add ${a} and ${b}. Then divide the answer by ${c}.`, `Add ${a} and ${b}, then divide the sum by ${c}.`, `Find the sum of ${a} and ${b}, then divide that sum by ${c}.`);
    expr = `(${a} + ${b}) ${DIVIDE} ${c}`;
    val = q;
    wrong = [[`${a} + ${b} ${DIVIDE} ${c}`, a + b / c, "does-not-group-the-sum"], [`${a} ${DIVIDE} ${c} + ${b}`, a / c + b, "divides-only-the-first-number"], [`${c} ${DIVIDE} (${a} + ${b})`, c / (a + b), "reverses-the-division"], [`(${a} + ${b}) ${TIMES} ${c}`, (a + b) * c, "multiplies-instead-of-dividing"]];
  } else if (form === "plusProd") {
    phrase = T3(`Find the product of ${b} and ${c}. Then add ${a} to it.`, `Add ${a} to the product of ${b} and ${c}.`, `Add ${a} to the product of ${b} and ${c}.`);
    expr = `${a} + ${b} ${TIMES} ${c}`;
    val = a + b * c;
    wrong = [[`(${a} + ${b}) ${TIMES} ${c}`, (a + b) * c, "adds-before-multiplying"], [`${a} + ${b} + ${c}`, a + b + c, "adds-every-number"], [`${a} ${TIMES} ${b} + ${c}`, a * b + c, "multiplies-the-wrong-pair"], [`${a} ${TIMES} (${b} + ${c})`, a * (b + c), "groups-the-wrong-numbers"]];
  } else {
    if (a <= b + c) a = b + c + ri(rng, 2, 12);
    phrase = T3(`Add ${b} and ${c}. Then subtract that from ${a}.`, `Subtract the sum of ${b} and ${c} from ${a}.`, `Subtract the sum of ${b} and ${c} from ${a}.`);
    expr = `${a} ${MINUS} (${b} + ${c})`;
    val = a - b - c;
    wrong = [[`${a} ${MINUS} ${b} + ${c}`, a - b + c, "adds-the-second-number-instead-of-subtracting-it"], [`(${b} + ${c}) ${MINUS} ${a}`, b + c - a, "reverses-the-subtraction"], [`${a} + ${b} + ${c}`, a + b + c, "adds-every-number"], [`${a} ${MINUS} ${b} ${TIMES} ${c}`, a - b * c, "uses-the-wrong-operation"]];
  }
  const ds = tdistr(expr, wrong.filter((w) => w[1] !== val).map((w) => [w[0], w[2]]));
  return finalize({
    family: "exprs",
    level: L,
    spec: { kind: "write", form, a, b, c, k },
    stem: phrase,
    ask: T3("Which expression matches the words?", "Which expression matches the words?", "Which expression correctly represents the words, without being evaluated?"),
    expr: null,
    answer: { value: expr, text: expr, kind: "text" },
    work: [`Read the words in order and write each step as it happens: ${expr}`, `Use grouping symbols when one step must happen before the next`],
    distractors: ds,
    hints: { conceptual: "The order of the words tells you the order of the steps. If a step must come first, it may need grouping symbols.", procedural: "Write the first step. Then ask whether the next step uses that whole result or only one number." },
  });
}

function exprInterp(rng, L) {
  const k = ri(rng, 2, 9);
  const minus = rng.chance(0.4);
  let a;
  let b;
  if (L === 1) {
    a = ri(rng, 12, 60);
    b = ri(rng, 4, 11);
  } else if (L === 2) {
    a = ri(rng, 120, 900);
    b = ri(rng, 30, 99);
  } else {
    a = ri(rng, 12000, 29999);
    b = ri(rng, 300, 999);
  }
  const part = minus ? "difference" : "sum";
  const sym = minus ? MINUS : "+";
  const inner = `${num(a)} ${sym} ${num(b)}`;
  const text = `${k} times as large as the ${part} ${inner}`;
  const ds = tdistr(text, [
    [`${k} more than the ${part} ${inner}`, "reads-times-as-more-than"],
    [`${k} times ${num(a)}, ${minus ? "minus" : "plus"} ${num(b)}`, "multiplies-only-the-first-number"],
    [`the ${part} ${inner}, divided by ${k}`, "reads-multiplying-as-dividing"],
    [`the ${part} of ${k} and ${num(a)}, ${minus ? "minus" : "plus"} ${num(b)}`, "ignores-the-grouping-symbols"],
  ]);
  return finalize({
    family: "exprs",
    level: L,
    spec: { kind: "interp", k, a, b, sign: sym },
    stem: T3(`Look at ${k} ${TIMES} (${num(a)} ${sym} ${num(b)}).`, `Look at the expression ${k} ${TIMES} (${num(a)} ${sym} ${num(b)}).`, `Consider the expression ${k} ${TIMES} (${num(a)} ${sym} ${num(b)}).`),
    ask: T3("Do not find the value. Which sentence is true?", "Without finding its value, which statement describes the expression?", "Without evaluating, which statement correctly interprets the expression?"),
    expr: null,
    answer: { value: text, text, kind: "text" },
    work: [`The ${part} ${inner} is inside the grouping symbols, so it is one number`, `The expression multiplies that whole number by ${k}`, `So it is ${k} times as large as the ${part}`],
    distractors: ds,
    hints: { conceptual: "Grouping symbols make everything inside them act like one number. Ask what is being multiplied.", procedural: "Cover the part in the grouping symbols with your hand. What is left tells you how the expression compares with it." },
  });
}

FAMILIES.exprs = {
  title: "Numerical expressions",
  grades: [5],
  defaults: {},
  gen(rng, P, { level = 1 } = {}) {
    const r = rng.next();
    if (r < (level === 1 ? 0.5 : 0.4)) return exprEval(rng, level);
    if (r < (level === 1 ? 0.8 : 0.7)) return exprWrite(rng, level);
    return exprInterp(rng, level);
  },
};

// ================================================================================================ patterns (g5.patterns)
const stepOf = (r, t) => (r.op === "add" ? t + r.by : t * r.by);
const termN = (r, n) => {
  let t = r.start;
  for (let i = 1; i < n; i++) t = stepOf(r, t);
  return t;
};
const ruleText = (r) => `Start at ${r.start}, ${r.op === "add" ? "add" : "multiply by"} ${r.by}`;
const seqOf = (r, n) => Array.from({ length: n }, (_, i) => termN(r, i + 1));
const seqText = (s) => s.join(", ");

function patTerm(rng, L) {
  const mul = L >= 2 && rng.chance(0.4);
  const r = mul ? { start: ri(rng, 1, 3), op: "mul", by: ri(rng, 2, 3) } : { start: rng.pick([0, 1, 2, 3, 4, 5]), op: "add", by: ri(rng, 2, L === 1 ? 6 : 12) };
  const n = mul ? ri(rng, 5, 6) : L === 1 ? ri(rng, 5, 7) : ri(rng, 7, L === 2 ? 10 : 14);
  const val = termN(r, n);
  const rule = mul ? `Start at ${r.start} and multiply by ${r.by} each time.` : `Start at ${r.start} and add ${r.by} each time.`;
  const first = seqOf(r, 4);
  return finalize({
    family: "patterns",
    level: L,
    spec: { kind: "term", rule: r, n },
    stem: T3(`${rule} The first term is ${r.start}.`, `A pattern follows this rule: ${rule[0].toLowerCase()}${rule.slice(1)} The first term is ${r.start}.`, `A numerical pattern is generated by this rule: ${rule[0].toLowerCase()}${rule.slice(1)} Its first term is ${r.start}.`),
    ask: T3(`What is the ${ord(n)} term?`, `What is the ${ord(n)} term of the pattern?`, `Determine the ${ord(n)} term of the pattern.`),
    expr: null,
    answer: { value: String(val), text: num(val), kind: "int" },
    work: [`The first terms are ${seqText(first)}`, mul ? `Each term is ${r.by} times the one before it` : `Each term is ${r.by} more than the one before it`, `Keep going until you reach term ${n}: the ${ord(n)} term is the value after ${n - 1} steps`],
    visual: null,
    distractors: distr(fr(val), { k: "int" }, [
      [termN(r, n - 1), "stops-one-term-early"],
      [termN(r, n + 1), "takes-one-step-too-many"],
      [mul ? r.start + (n - 1) * r.by : n * r.by, mul ? "adds-instead-of-multiplying" : "forgets-the-starting-number"],
      [mul ? r.start * n * r.by : r.start + n * r.by, "counts-n-steps-instead-of-n-minus-1"],
      ...slips(val),
    ], { pos: false }),
    hints: { conceptual: "The first term is where the pattern begins. Moving to the next term uses the rule once.", procedural: "Write the terms in a row. Apply the rule to get each new term until you reach the one you need." },
  });
}

function patPair(rng, L) {
  const a = ri(rng, 2, L === 1 ? 5 : 9);
  const k = ri(rng, 2, L === 3 ? 5 : 4);
  const A = { start: 0, op: "add", by: a };
  const Bp = { start: 0, op: "add", by: a * k };
  const n = ri(rng, 3, L === 1 ? 5 : 7);
  const x = termN(A, n);
  const y = termN(Bp, n);
  const rows = seqOf(A, 4).map((v, i) => [String(v), String(termN(Bp, i + 1))]);
  return finalize({
    family: "patterns",
    level: L,
    spec: { kind: "pair", a: A, b: Bp, n },
    stem: T3(`Rule A: start at 0, add ${a}. Rule B: start at 0, add ${a * k}.`, `Rule A: start at 0 and add ${a}. Rule B: start at 0 and add ${a * k}. Matching terms form ordered pairs (A, B).`, `Two patterns are built from these rules. Rule A: start at 0 and add ${a}. Rule B: start at 0 and add ${a * k}. Matching terms form ordered pairs (A, B).`),
    ask: T3(`What is the ordered pair for the ${ord(n)} terms?`, `Write the ordered pair for the ${ord(n)} terms of the two patterns.`, `State the ordered pair formed by the ${ord(n)} terms of the two patterns.`),
    expr: null,
    answer: { value: `(${x},${y})`, text: `(${x}, ${y})`, kind: "pair" },
    work: [`Pattern A: ${seqText(seqOf(A, n))}`, `Pattern B: ${seqText(seqOf(Bp, n))}`, `The ${ord(n)} terms make the ordered pair (A, B)`],
    visual: { kind: "table", alt: `A table of the first four matching terms of Rule A and Rule B.`, headers: ["Rule A", "Rule B"], rows, caption: "First four matching terms" },
    distractors: tdistr(`(${x}, ${y})`, [
      [`(${y}, ${x})`, "swaps-the-order-of-the-pair"],
      [`(${termN(A, n + 1)}, ${termN(Bp, n + 1)})`, "uses-the-next-terms"],
      [`(${termN(A, n - 1)}, ${termN(Bp, n - 1)})`, "uses-the-previous-terms"],
      [`(${x}, ${x + a * k})`, "adds-the-second-rules-step-to-the-first-term"],
      [`(${n}, ${y})`, "uses-the-term-number-as-the-first-value"],
    ]),
    hints: { conceptual: "An ordered pair lists the first pattern's term first, then the second pattern's term at the same position.", procedural: "List each pattern until you reach the same position. Then write the two terms in order." },
  });
}

function patRelation(rng, L) {
  const times = rng.chance(0.55);
  let A;
  let Bp;
  let how;
  let ans;
  if (times) {
    const a = ri(rng, 2, L === 1 ? 5 : 8);
    const k = ri(rng, 2, L === 3 ? 6 : 4);
    A = { start: 0, op: "add", by: a };
    Bp = { start: 0, op: "add", by: a * k };
    how = "times";
    ans = k;
  } else {
    const s = ri(rng, 0, 4);
    const d = ri(rng, 2, L === 1 ? 6 : 10);
    const by = ri(rng, 2, 8);
    A = { start: s, op: "add", by };
    Bp = { start: s + d, op: "add", by };
    how = "more";
    ans = d;
  }
  const rows = [1, 2, 3, 4].map((i) => [String(termN(A, i)), String(termN(Bp, i))]);
  const phrase = how === "times" ? "times as large as" : "more than";
  return finalize({
    family: "patterns",
    level: L,
    spec: { kind: "relation", a: A, b: Bp, how },
    stem: T3(`Rule A: start at ${A.start}, add ${A.by}. Rule B: start at ${Bp.start}, add ${Bp.by}.`, `Rule A: start at ${A.start} and add ${A.by}. Rule B: start at ${Bp.start} and add ${Bp.by}. Compare each term of B with the matching term of A.`, `Two patterns follow these rules. Rule A: start at ${A.start} and add ${A.by}. Rule B: start at ${Bp.start} and add ${Bp.by}. Compare each term of B with the matching term of A.`),
    ask: how === "times"
      ? T3("Each B term is how many times as large as the matching A term?", "Each term of B is how many times as large as the matching term of A? Look past the first pair.", "By what factor is each term of B larger than the matching term of A? Ignore the first pair.")
      : T3("Each B term is how much more than the matching A term?", "Each term of B is how much more than the matching term of A?", "By how much does each term of B exceed the matching term of A?"),
    expr: null,
    answer: { value: String(ans), text: String(ans), kind: "int" },
    work: [`Matching terms: ${rows.map((r) => `(${r[0]}, ${r[1]})`).join(", ")}`, how === "times" ? `Compare a pair that is not 0: ${rows[2][1]} ${DIVIDE} ${rows[2][0]} = ${ans}` : `Compare a pair: ${rows[2][1]} ${MINUS} ${rows[2][0]} = ${ans}`, `The same ${how === "times" ? "multiple" : "difference"} works for every pair, so each B term is ${ans} ${phrase} its A term`],
    visual: { kind: "table", alt: "A table of the first four matching terms of Rule A and Rule B.", headers: ["Rule A", "Rule B"], rows, caption: "Matching terms" },
    distractors: distr(fr(ans), { k: "int" }, how === "times"
      ? [[Bp.by - A.by, "compares-the-steps-by-subtracting"], [ans + 1, "off-by-one"], [Bp.by, "uses-the-step-of-rule-B"], [A.by, "uses-the-step-of-rule-A"], [ans * 2, "doubles-the-factor"], ...slips(ans)]
      : [[A.start, "uses-the-starting-number-of-rule-A"], [Bp.start, "uses-the-starting-number-of-rule-B"], [ans + 1, "off-by-one"], [A.by, "uses-the-step-instead-of-the-difference"], [ans * 2, "doubles-the-difference"], ...slips(ans)]),
    hints: { conceptual: how === "times" ? "Divide a B term by the matching A term to see how many times as large it is. Skip the pair with 0." : "Subtract an A term from the matching B term. Check that another pair gives the same difference.", procedural: "Line the terms up in pairs. Choose one pair, compare it, then check a second pair." },
  });
}

function patRule(rng, L) {
  const mul = L >= 2 && rng.chance(0.4);
  const r = mul ? { start: ri(rng, 1, 4), op: "mul", by: ri(rng, 2, 3) } : { start: ri(rng, 1, 20), op: "add", by: ri(rng, 2, L === 1 ? 6 : 9) };
  const seq = seqOf(r, mul ? 4 : 5);
  const text = ruleText(r);
  const second = seq[1];
  return finalize({
    family: "patterns",
    level: L,
    spec: { kind: "rule", seq },
    stem: T3(`Look at the pattern: ${seqText(seq)}, ...`, `A pattern begins: ${seqText(seq)}, ...`, `A numerical pattern begins with these terms: ${seqText(seq)}, ...`),
    ask: T3("Which rule makes this pattern?", "Which rule makes this pattern?", "Which rule generates this pattern?"),
    expr: null,
    answer: { value: text, text, kind: "text" },
    work: [mul ? `Each term is ${r.by} times the one before it` : `Each term is ${r.by} more than the one before it`, `The first term is ${r.start}`, `So the rule is: ${text}`],
    visual: null,
    distractors: tdistr(text, [
      [mul ? `Start at ${r.start}, add ${second - r.start}` : `Start at ${r.start}, multiply by ${r.by}`, mul ? "uses-the-first-difference-as-the-rule" : "uses-the-wrong-operation"],
      [mul ? `Start at ${second}, multiply by ${r.by}` : `Start at ${second}, add ${r.by}`, "starts-at-the-second-term"],
      [mul ? `Start at ${r.start}, multiply by ${r.by + 1}` : `Start at ${r.start}, add ${r.by + 1}`, "off-by-one-in-the-step"],
      [mul ? `Start at ${r.by}, multiply by ${r.start}` : `Start at ${r.by}, add ${r.start}`, "swaps-the-start-and-the-step"],
      [mul ? `Start at ${r.start}, add ${r.by}` : `Start at ${r.start}, add ${r.by - 1}`, "mixes-up-the-operation-or-step"],
    ]),
    hints: { conceptual: "A rule has a starting number and one operation that is repeated. Compare neighbouring terms to find that operation.", procedural: "Check what you add and what you multiply by to get from one term to the next. Test your rule on every term." },
  });
}

function patExtend(rng, L) {
  const mul = L >= 2 && rng.chance(0.4);
  const r = mul ? { start: ri(rng, 1, 4), op: "mul", by: ri(rng, 2, 3) } : { start: ri(rng, 0, 25), op: "add", by: ri(rng, 2, L === 1 ? 6 : 12) };
  const shown = mul ? 4 : ri(rng, 4, 5);
  const seq = seqOf(r, shown);
  const ahead = L === 1 ? 1 : ri(rng, 1, 2);
  const target = shown + ahead;
  const val = termN(r, target);
  return finalize({
    family: "patterns",
    level: L,
    spec: { kind: "extend", seq, ahead },
    stem: T3(`Here is a pattern: ${seqText(seq)}, ...`, `A pattern begins: ${seqText(seq)}, ...`, `A numerical pattern begins with these terms: ${seqText(seq)}, ...`),
    ask: T3(`What is the ${ord(target)} term?`, `What is the ${ord(target)} term of the pattern?`, `Determine the ${ord(target)} term of the pattern.`),
    expr: null,
    answer: { value: String(val), text: num(val), kind: "int" },
    work: [mul ? `Each term is ${r.by} times the one before it` : `Each term is ${r.by} more than the one before it`, `Continue the list: ${seqText(seqOf(r, target))}`],
    visual: null,
    distractors: distr(fr(val), { k: "int" }, [
      [termN(r, target - 1), "gives-the-term-before-the-one-asked-for"],
      [termN(r, target + 1), "goes-one-term-too-far"],
      [mul ? seq[shown - 1] + (seq[shown - 1] - seq[shown - 2]) * ahead : seq[shown - 1] * 2 * ahead, mul ? "keeps-adding-the-last-difference" : "doubles-instead-of-adding"],
      [seq[shown - 1] + r.by * (ahead + 1), "counts-an-extra-step"],
      ...slips(val),
    ]),
    hints: { conceptual: "First find out how one term turns into the next. Then keep using that same step.", procedural: "Compare the last two terms. Apply that same change to continue the pattern until you reach the term you want." },
  });
}

FAMILIES.patterns = {
  title: "Numerical patterns",
  grades: [5],
  defaults: {},
  gen(rng, P, { level = 1 } = {}) {
    const r = rng.next();
    if (r < 0.22) return patTerm(rng, level);
    if (r < 0.44) return patPair(rng, level);
    if (r < 0.64) return patRelation(rng, level);
    if (r < 0.84) return patRule(rng, level);
    return patExtend(rng, level);
  },
};

// ================================================================================================ volume (g5.volume)
function volCount(rng, L) {
  const l = ri(rng, 2, L === 1 ? 4 : 5);
  const w = ri(rng, 2, L === 1 ? 3 : 4);
  const h = ri(rng, 2, L === 1 ? 3 : 4);
  const v = l * w * h;
  return finalize({
    family: "volume",
    level: L,
    spec: { kind: "count", l, w, h },
    stem: T3(`A box is filled with unit cubes. It is ${l} cubes long, ${w} cubes wide and ${h} cubes tall.`, `A box is packed with unit cubes. It is ${l} cubes long, ${w} cubes wide and ${h} cubes tall.`, `A rectangular box is packed completely with unit cubes. It is ${l} cubes long, ${w} cubes wide and ${h} cubes high.`),
    ask: T3("How many unit cubes fill the box?", "How many unit cubes fill the box?", "What is the volume of the box, in unit cubes?"),
    expr: `${l} ${TIMES} ${w} ${TIMES} ${h}`,
    answer: { value: String(v), text: num(v), kind: "int", unit: "unit cubes" },
    work: [`One layer has ${l} ${TIMES} ${w} = ${l * w} cubes`, `There are ${h} layers: ${l * w} ${TIMES} ${h} = ${v}`],
    visual: { kind: "prism", alt: `A rectangular prism built from unit cubes: ${l} cubes long, ${w} cubes wide, ${h} cubes tall.`, l, w, h, units: true, unit: "cubes" },
    distractors: distr(fr(v), { k: "int" }, [[l + w + h, "adds-the-three-dimensions"], [l * w, "counts-only-one-layer"], [2 * (l * w + l * h + w * h), "finds-the-surface-area"], [l * w + h, "adds-the-height-to-one-layer"], ...slips(v)]),
    hints: { conceptual: "Volume counts the cubes that fill the whole box, not just the outside.", procedural: "Count the cubes in one layer. Then think about how many layers are stacked." },
  });
}
function volFormula(rng, L) {
  const l = ri(rng, 3, L === 1 ? 8 : L === 2 ? 15 : 24);
  const w = ri(rng, 2, L === 1 ? 6 : L === 2 ? 10 : 15);
  const h = ri(rng, 2, L === 1 ? 6 : L === 2 ? 9 : 12);
  const unit = rng.pick(["cm", "in", "ft", "m"]);
  const v = l * w * h;
  const un = { cm: "centimeters", in: "inches", ft: "feet", m: "meters" }[unit];
  return finalize({
    family: "volume",
    level: L,
    spec: { kind: "formula", l, w, h },
    stem: T3(`A box is ${l} ${unit} long, ${w} ${unit} wide and ${h} ${unit} tall.`, `A rectangular prism is ${l} ${unit} long, ${w} ${unit} wide and ${h} ${unit} high.`, `A right rectangular prism has a length of ${l} ${un}, a width of ${w} ${un} and a height of ${h} ${un}.`),
    ask: T3(`What is the volume in cubic ${un}?`, `What is its volume in cubic ${un}?`, `Find the volume of the prism in cubic ${un}.`),
    expr: `${l} ${TIMES} ${w} ${TIMES} ${h}`,
    answer: { value: String(v), text: num(v), kind: "int", unit: `${unit}³` },
    work: [`Volume = length ${TIMES} width ${TIMES} height`, `${l} ${TIMES} ${w} = ${l * w}`, `${l * w} ${TIMES} ${h} = ${num(v)}`],
    visual: L === 1 ? { kind: "prism", alt: `A rectangular prism with length ${l} ${unit}, width ${w} ${unit} and height ${h} ${unit}.`, l, w, h, units: false } : null,
    distractors: distr(fr(v), { k: "int" }, [[l + w + h, "adds-the-three-dimensions"], [l * w, "finds-the-area-of-the-base-only"], [2 * (l * w + l * h + w * h), "finds-the-surface-area"], [l * w + h, "adds-the-height-to-the-base-area"], [l * h * 2 + w, "mixes-up-the-formula"], ...slips(v)]),
    hints: { conceptual: "Volume measures how much space is inside. It is measured in cubic units.", procedural: "Multiply the length and width to find the area of the base. Then multiply by the height." },
  });
}
function volBase(rng, L) {
  const B = ri(rng, 6, L === 1 ? 30 : L === 2 ? 64 : 150);
  const h = ri(rng, 2, L === 1 ? 6 : 12);
  const v = B * h;
  return finalize({
    family: "volume",
    level: L,
    spec: { kind: "base", B, h },
    stem: T3(`The base of a prism has an area of ${B} square centimeters. The prism is ${h} centimeters tall.`, `A rectangular prism has a base with an area of ${B} square centimeters and a height of ${h} centimeters.`, `The base of a rectangular prism has an area of ${B} square centimeters, and the prism has a height of ${h} centimeters.`),
    ask: T3("What is the volume in cubic centimeters?", "What is the volume of the prism in cubic centimeters?", "Use V = B × h to find the volume, in cubic centimeters."),
    expr: `${B} ${TIMES} ${h}`,
    answer: { value: String(v), text: num(v), kind: "int", unit: "cm³" },
    work: [`V = B ${TIMES} h`, `${B} ${TIMES} ${h} = ${num(v)}`],
    distractors: distr(fr(v), { k: "int" }, [[B + h, "adds-the-base-area-and-height"], [B * h + B, "adds-an-extra-layer"], [B * h * h, "multiplies-by-the-height-twice"], [Math.round(v / 2), "halves-the-product"], ...slips(v)]),
    hints: { conceptual: "The base area already tells how many unit squares cover one layer. The height tells how many layers there are.", procedural: "Multiply the area of the base by the height." },
  });
}
function volComposite(rng, L) {
  const mk = () => ({ l: ri(rng, 2, L === 2 ? 6 : 10), w: ri(rng, 2, L === 2 ? 5 : 8), h: ri(rng, 2, L === 2 ? 5 : 8) });
  const p = mk();
  const q = mk();
  const v1 = p.l * p.w * p.h;
  const v2 = q.l * q.w * q.h;
  const v = v1 + v2;
  const sz = (x) => `${x.l} by ${x.w} by ${x.h}`;
  return finalize({
    family: "volume",
    level: L,
    spec: { kind: "composite", parts: [p, q] },
    stem: T3(`A solid is made of two boxes joined together. They do not overlap. One box is ${sz(p)} centimeters. The other box is ${sz(q)} centimeters.`, `A solid is made of two rectangular prisms that do not overlap. One measures ${sz(p)} centimeters. The other measures ${sz(q)} centimeters.`, `A composite solid consists of two non-overlapping rectangular prisms. One prism measures ${sz(p)} centimeters, and the other measures ${sz(q)} centimeters.`),
    ask: T3("What is the volume of the solid in cubic centimeters?", "What is the volume of the whole solid in cubic centimeters?", "Find the total volume of the composite solid, in cubic centimeters."),
    expr: `${p.l} ${TIMES} ${p.w} ${TIMES} ${p.h} + ${q.l} ${TIMES} ${q.w} ${TIMES} ${q.h}`,
    answer: { value: String(v), text: num(v), kind: "int", unit: "cm³" },
    work: [`First prism: ${p.l} ${TIMES} ${p.w} = ${p.l * p.w}`, `${p.l * p.w} ${TIMES} ${p.h} = ${num(v1)}`, `Second prism: ${q.l} ${TIMES} ${q.w} = ${q.l * q.w}`, `${q.l * q.w} ${TIMES} ${q.h} = ${num(v2)}`, `Add the volumes: ${num(v1)} + ${num(v2)} = ${num(v)}`],
    distractors: distr(fr(v), { k: "int" }, [[v1, "finds-only-the-first-prism"], [v2, "finds-only-the-second-prism"], [v1 * v2, "multiplies-the-two-volumes"], [(p.l + q.l) * (p.w + q.w) * (p.h + q.h), "adds-the-dimensions-before-multiplying"], ...slips(v)]),
    hints: { conceptual: "Volume is additive: the volume of the whole is the sum of the volumes of the parts that do not overlap.", procedural: "Find the volume of each box separately. Then put the two volumes together." },
  });
}
function volMissing(rng, L) {
  const l = ri(rng, 2, L === 2 ? 9 : 14);
  const w = ri(rng, 2, L === 2 ? 8 : 12);
  const h = ri(rng, 2, L === 2 ? 9 : 15);
  const V = l * w * h;
  const which = rng.pick(["height", "width", "length"]);
  const known = which === "height" ? [["length", l], ["width", w]] : which === "width" ? [["length", l], ["height", h]] : [["width", w], ["height", h]];
  const val = which === "height" ? h : which === "width" ? w : l;
  const dims = [known[0][1], known[1][1]];
  return finalize({
    family: "volume",
    level: L,
    spec: { kind: "missing", V, dims, find: which },
    stem: T3(`A box has a volume of ${num(V)} cubic centimeters. Its ${known[0][0]} is ${known[0][1]} centimeters. Its ${known[1][0]} is ${known[1][1]} centimeters.`, `A rectangular prism has a volume of ${num(V)} cubic centimeters, a ${known[0][0]} of ${known[0][1]} centimeters and a ${known[1][0]} of ${known[1][1]} centimeters.`, `A rectangular prism has a volume of ${num(V)} cubic centimeters. Its ${known[0][0]} measures ${known[0][1]} centimeters, and its ${known[1][0]} measures ${known[1][1]} centimeters.`),
    ask: T3(`What is the ${which} in centimeters?`, `What is the ${which} of the prism, in centimeters?`, `Determine the ${which} of the prism, in centimeters.`),
    expr: `${num(V)} ${DIVIDE} (${dims[0]} ${TIMES} ${dims[1]})`,
    answer: { value: String(val), text: String(val), kind: "int", unit: "cm" },
    work: [`The two known dimensions multiply to ${dims[0]} ${TIMES} ${dims[1]} = ${dims[0] * dims[1]}`, `Volume ${DIVIDE} that product: ${num(V)} ${DIVIDE} ${dims[0] * dims[1]} = ${val}`],
    distractors: distr(fr(val), { k: "int" }, [[Math.round(V / dims[0]), "divides-by-only-one-dimension"], [V - dims[0] * dims[1], "subtracts-instead-of-dividing"], [Math.round(V / (dims[0] + dims[1])), "adds-the-dimensions-before-dividing"], [val + 1, "off-by-one"], ...slips(val)]),
    hints: { conceptual: "Volume is the product of three dimensions. If you know the volume and two of them, the third is what is missing in the product.", procedural: "Multiply the two known dimensions first. Then ask what number times that product gives the volume." },
  });
}

FAMILIES.volume = {
  title: "Volume",
  grades: [5],
  defaults: {},
  gen(rng, P, { level = 1 } = {}) {
    const pool = level === 1 ? [volCount, volCount, volFormula, volBase] : level === 2 ? [volCount, volFormula, volBase, volComposite, volMissing] : [volFormula, volBase, volComposite, volMissing, volMissing];
    return rng.pick(pool)(rng, level);
  },
};

// ================================================================================================ coordinate (g5.coordinate)
const pairV = (x, y) => `(${x},${y})`;
const pairT = (x, y) => `(${x}, ${y})`;
function coName(rng, L) {
  const m = L === 1 ? 6 : L === 2 ? 8 : 10;
  let x;
  let y;
  do {
    x = ri(rng, 1, m);
    y = ri(rng, 1, m);
  } while (x === y);
  const pts = [{ x, y, label: "A" }];
  const used = new Set([`${x},${y}`]);
  for (const lab of L === 1 ? [] : ["B", "C"]) {
    let px;
    let py;
    do {
      px = ri(rng, 1, m);
      py = ri(rng, 1, m);
    } while (used.has(`${px},${py}`) || px === py);
    used.add(`${px},${py}`);
    pts.push({ x: px, y: py, label: lab });
  }
  const target = rng.pick(pts);
  const text = pairT(target.x, target.y);
  return finalize({
    family: "coordinate",
    level: L,
    spec: { kind: "name", points: pts, target: target.label },
    stem: T3(`Look at the graph. The points are ${pts.map((p) => p.label).join(", ")}.`, `The graph shows the point${pts.length > 1 ? "s" : ""} ${pts.map((p) => p.label).join(", ")}.`, `The coordinate plane shows the point${pts.length > 1 ? "s" : ""} ${pts.map((p) => p.label).join(", ")}.`),
    ask: T3(`What are the coordinates of point ${target.label}?`, `What is the ordered pair for point ${target.label}?`, `State the coordinates of point ${target.label} as an ordered pair.`),
    expr: null,
    answer: { value: pairV(target.x, target.y), text, kind: "pair" },
    work: [`Start at the origin (0, 0)`, `Move right to find the x-coordinate`, `Move up to find the y-coordinate`, `Write the pair with x first: ${text}`],
    visual: { kind: "coord", alt: `A coordinate grid in the first quadrant with ${pts.length} labeled point${pts.length > 1 ? "s" : ""}.`, xmin: 0, xmax: m, ymin: 0, ymax: m, step: 1, points: pts, labelAxes: ["x", "y"] },
    distractors: tdistr(text, [
      [pairT(target.y, target.x), "reads-the-pair-backwards-y-first"],
      [pairT(target.x, target.y + 1), "counts-one-too-far-up"],
      [pairT(target.x + 1, target.y), "counts-one-too-far-right"],
      [pairT(target.x - 1 < 0 ? target.x + 2 : target.x - 1, target.y), "counts-one-too-few-right"],
      [pairT(target.x + target.y, 0), "adds-the-coordinates"],
    ]),
    hints: { conceptual: "An ordered pair tells how far to go right first, then how far to go up, starting at the origin.", procedural: "Put your finger on the origin. Move right along the x-axis until you are under the point, then count up." },
  });
}
function coAxis(rng, L) {
  const m = L === 1 ? 8 : 10;
  let x;
  let y;
  do {
    x = ri(rng, 1, m);
    y = ri(rng, 1, m);
  } while (x === y);
  const from = rng.pick(["y-axis", "x-axis"]);
  const val = from === "y-axis" ? x : y;
  return finalize({
    family: "coordinate",
    level: L,
    spec: { kind: "axisdist", x, y, from },
    stem: T3(`A point is at ${pairT(x, y)}.`, `A point is at ${pairT(x, y)} on a coordinate plane.`, `A point is located at ${pairT(x, y)} on a coordinate plane.`),
    ask: T3(`How many units is the point from the ${from}?`, `How many units is the point from the ${from}?`, `How far is the point from the ${from}, in units?`),
    expr: null,
    answer: { value: String(val), text: String(val), kind: "int", unit: "units" },
    work: [`The first number is the distance from the y-axis, going right`, `The second number is the distance from the x-axis, going up`, `The point is ${val} units from the ${from}`],
    visual: { kind: "coord", alt: `A coordinate grid with one point plotted.`, xmin: 0, xmax: m, ymin: 0, ymax: m, step: 1, points: [{ x, y, label: "P" }], labelAxes: ["x", "y"] },
    distractors: distr(fr(val), { k: "int" }, [[from === "y-axis" ? y : x, "mixes-up-which-axis-is-which"], [x + y, "adds-the-coordinates"], [val + 1, "counts-one-too-far"], [Math.abs(x - y), "subtracts-the-coordinates"], ...slips(val)]),
    hints: { conceptual: "Distance from an axis is measured straight across or straight up. One coordinate tells that distance.", procedural: "Decide which axis you measure from. Then look at which number counts steps in that direction." },
  });
}
function coDist(rng, L) {
  const m = L === 1 ? 8 : 10;
  const horizontal = rng.chance(0.5);
  let a;
  let b;
  let c;
  do {
    a = ri(rng, 1, m);
    b = ri(rng, 1, m);
    c = ri(rng, 1, m);
  } while (a === b);
  const p = horizontal ? { x: a, y: c } : { x: c, y: a };
  const q = horizontal ? { x: b, y: c } : { x: c, y: b };
  const d = Math.abs(a - b);
  return finalize({
    family: "coordinate",
    level: L,
    spec: { kind: "dist", p: [p.x, p.y], q: [q.x, q.y] },
    stem: T3(`Point A is at ${pairT(p.x, p.y)}. Point B is at ${pairT(q.x, q.y)}.`, `Point A is at ${pairT(p.x, p.y)} and point B is at ${pairT(q.x, q.y)}.`, `Point A is located at ${pairT(p.x, p.y)}, and point B is located at ${pairT(q.x, q.y)}.`),
    ask: T3("How many units apart are A and B?", "How many units apart are the two points?", "What is the distance between the two points, in units?"),
    expr: null,
    answer: { value: String(d), text: String(d), kind: "int", unit: "units" },
    work: [`The points share the same ${horizontal ? "y" : "x"}-coordinate, so they are on a ${horizontal ? "horizontal" : "vertical"} line`, `Count the units between the other coordinates: ${Math.max(a, b)} ${MINUS} ${Math.min(a, b)} = ${d}`],
    visual: { kind: "coord", alt: `A coordinate grid with points A and B on the same ${horizontal ? "horizontal" : "vertical"} line.`, xmin: 0, xmax: m, ymin: 0, ymax: m, step: 1, points: [{ x: p.x, y: p.y, label: "A" }, { x: q.x, y: q.y, label: "B" }], labelAxes: ["x", "y"] },
    distractors: distr(fr(d), { k: "int" }, [[a + b, "adds-the-coordinates"], [d + 1, "counts-both-end-points"], [d - 1, "misses-one-unit"], [c, "uses-the-shared-coordinate"], ...slips(d)]),
    hints: { conceptual: "When two points are on the same horizontal or vertical line, the distance is how far apart the coordinates that change are.", procedural: "Find which coordinate is the same. Then find the difference between the two other coordinates." },
  });
}
function coRule(rng, L) {
  const add = rng.chance(0.5);
  const by = add ? ri(rng, 2, 6) : ri(rng, 2, 3);
  const x0 = ri(rng, L === 1 ? 3 : 4, L === 3 ? 6 : 5);
  const f = (x) => (add ? x + by : x * by);
  const y = f(x0);
  const pts = [1, 2, 3].map((x) => ({ x, y: f(x), label: "" })).filter((p) => p.y <= 20);
  const ymax = Math.max(8, Math.ceil(y / 2) * 2 + 2);
  const rule = add ? `add ${by}` : `multiply by ${by}`;
  return finalize({
    family: "coordinate",
    level: L,
    spec: { kind: "rule", op: add ? "add" : "mul", by, x: x0 },
    stem: T3(`The rule is: start with x, then ${rule} to get y. The points (1, ${f(1)}), (2, ${f(2)}) and (3, ${f(3)}) follow the rule.`, `A rule makes the y-coordinate from the x-coordinate: ${rule}. The points (1, ${f(1)}), (2, ${f(2)}) and (3, ${f(3)}) follow this rule.`, `A rule produces each y-coordinate from the x-coordinate: ${rule}. The points (1, ${f(1)}), (2, ${f(2)}) and (3, ${f(3)}) follow this rule.`),
    ask: T3(`What is y when x is ${x0}?`, `What is the y-coordinate of the point whose x-coordinate is ${x0}?`, `Determine the y-coordinate of the point whose x-coordinate is ${x0}.`),
    expr: null,
    answer: { value: String(y), text: String(y), kind: "int" },
    work: [`Use the rule on x = ${x0}: ${add ? `${x0} + ${by}` : `${x0} ${TIMES} ${by}`} = ${y}`, `The point is ${pairT(x0, y)}`],
    visual: { kind: "coord", alt: `A coordinate grid with the three points from the rule.`, xmin: 0, xmax: 8, ymin: 0, ymax: Math.max(ymax, 10), step: 1, points: [1, 2, 3].map((x) => ({ x, y: f(x), label: "" })), labelAxes: ["x", "y"] },
    distractors: distr(fr(y), { k: "int" }, [[add ? x0 * by : x0 + by, add ? "multiplies-instead-of-adding" : "adds-instead-of-multiplying"], [f(x0 - 1), "uses-the-previous-x"], [f(x0 + 1), "uses-the-next-x"], [x0, "forgets-to-use-the-rule"], ...slips(y)]),
    hints: { conceptual: "Every point on the graph follows the same rule. The x-coordinate goes in, the y-coordinate comes out.", procedural: "Use the given points to check the rule. Then apply it to the new x-value." },
  });
}
const CT = [
  { x: "hours", y: "miles", sx: "a hiker walks", ask: (X, Y) => ({ x: `After how many hours has the hiker walked ${Y} miles?`, y: `How many miles has the hiker walked after ${X} hours?` }) },
  { x: "minutes", y: "pages", sx: "a student reads", ask: (X, Y) => ({ x: `After how many minutes has the student read ${Y} pages?`, y: `How many pages has the student read after ${X} minutes?` }) },
  { x: "weeks", y: "centimeters", sx: "a plant grows", ask: (X, Y) => ({ x: `After how many weeks is the plant ${Y} centimeters tall?`, y: `How tall is the plant after ${X} weeks, in centimeters?` }) },
];
function coCtx(rng, L) {
  const c = rng.pick(CT);
  const x = ri(rng, 2, L === 1 ? 6 : 9);
  const y = ri(rng, 3, L === 1 ? 9 : 14);
  const askX = rng.chance(0.5);
  const q = c.ask(x, y);
  const val = askX ? x : y;
  const m = Math.max(x, 8) + 1;
  const mm = Math.max(y, 8) + 1;
  return finalize({
    family: "coordinate",
    level: L,
    spec: { kind: "ctxpoint", x, y, ask: askX ? "x" : "y" },
    stem: T3(`A graph shows how ${c.sx}. The x-axis shows ${c.x}. The y-axis shows ${c.y}. One point on the graph is ${pairT(x, y)}.`, `A graph shows how ${c.sx} over time. The x-axis shows ${c.x} and the y-axis shows ${c.y}. One point on the graph is ${pairT(x, y)}.`, `A graph shows how ${c.sx} over time. The horizontal axis represents ${c.x} and the vertical axis represents ${c.y}. One point on the graph is ${pairT(x, y)}.`),
    ask: T3(askX ? q.x : q.y, askX ? q.x : q.y, askX ? q.x : q.y),
    expr: null,
    answer: { value: String(val), text: String(val), kind: "int", unit: askX ? c.x : c.y },
    work: [`In ${pairT(x, y)}, the first number is the x-coordinate: ${c.x}`, `The second number is the y-coordinate: ${c.y}`, `The question asks about ${askX ? c.x : c.y}, so use the ${askX ? "first" : "second"} number`],
    visual: { kind: "coord", alt: `A coordinate grid with the point ${pairT(x, y)} marked.`, xmin: 0, xmax: m, ymin: 0, ymax: mm, step: 1, points: [{ x, y, label: "P" }], labelAxes: [c.x, c.y] },
    distractors: distr(fr(val), { k: "int" }, [[askX ? y : x, "reads-the-pair-backwards"], [x + y, "adds-the-coordinates"], [val + 1, "counts-one-too-far"], [Math.abs(x - y), "subtracts-the-coordinates"], ...slips(val)]),
    hints: { conceptual: "Each axis names a quantity. In an ordered pair the first number goes with the x-axis and the second with the y-axis.", procedural: "Match each number in the pair to its axis label. Then answer about the quantity the question names." },
  });
}
FAMILIES.coordinate = {
  title: "Coordinate planes",
  grades: [5],
  defaults: { quadrant: 1 },
  gen(rng, P, { level = 1 } = {}) {
    const pool = level === 1 ? [coName, coName, coAxis, coDist] : level === 2 ? [coName, coAxis, coDist, coRule, coCtx] : [coName, coDist, coRule, coCtx, coCtx];
    return rng.pick(pool)(rng, level);
  },
};

// ================================================================================================ ratio (g6.ratios)
// Ratios are taught as multiplicative relationships: equivalent ratios scale both quantities by the same factor, never "add the same number".
const RSC = {
  store: [{ A: "pencils", B: "pens", loc: "in a box" }, { A: "red markers", B: "blue markers", loc: "in a cup" }],
  garden: [{ A: "tomato plants", B: "pepper plants", loc: "in the garden" }, { A: "rose bushes", B: "daisy plants", loc: "along the fence" }],
  sports: [{ A: "soccer balls", B: "basketballs", loc: "in the gym closet" }, { A: "wins", B: "losses", loc: "this season" }],
  kitchen: [{ A: "cups of flour", B: "cups of sugar", loc: "in a recipe" }, { A: "cups of rice", B: "cups of water", loc: "in a pot" }],
  pets: [{ A: "cats", B: "dogs", loc: "at the shelter" }, { A: "goldfish", B: "guppies", loc: "in the tank" }],
  library: [{ A: "fiction books", B: "science books", loc: "on a shelf" }, { A: "picture books", B: "chapter books", loc: "in a bin" }],
  crafts: [{ A: "red beads", B: "yellow beads", loc: "on a bracelet" }, { A: "cups of blue paint", B: "cups of white paint", loc: "in a mix" }],
  travel: [{ A: "buses", B: "vans", loc: "at the station" }, { A: "cars", B: "trucks", loc: "on a ferry" }],
  science: [{ A: "red magnets", B: "green magnets", loc: "in a tray" }, { A: "seeds that sprouted", B: "seeds that did not sprout", loc: "in the tray" }],
  community: [{ A: "adults", B: "children", loc: "at the cleanup" }, { A: "oak trees", B: "maple trees", loc: "in the park" }],
};
const rScene = (rng, ctx) => rng.pick(RSC[ctx] || RSC.store);
const coprime = (rng, lo, hi) => {
  let a;
  let b;
  do {
    a = ri(rng, lo, hi);
    b = ri(rng, lo, hi);
  } while (a === b || gcd(a, b) !== 1);
  return [a, b];
};

function raWrite(rng, L, ctx) {
  const sc = rScene(rng, ctx);
  const [a, b] = coprime(rng, 2, L === 1 ? 7 : L === 2 ? 12 : 20);
  const t = a + b;
  const val = { a, b, total: t };
  const nm = { a: sc.A, b: sc.B, total: `all the ${sc.A} and ${sc.B} together` };
  const given = rng.chance(0.4);
  const pairs = given ? [["a", "total"], ["b", "total"], ["b", "a"]] : [["a", "b"], ["b", "a"], ["a", "total"], ["b", "total"], ["total", "b"]];
  const [num_, den] = rng.pick(pairs);
  const x = val[num_];
  const y = val[den];
  const text = `${x}:${y}`;
  const cands = [];
  for (const p of ["a", "b", "total"]) {
    for (const q of ["a", "b", "total"]) {
      if (p === q || (p === num_ && q === den)) continue;
      const tag = p === den && q === num_ ? "reverses-the-order-of-the-quantities" : p === "total" || q === "total" ? (num_ === "total" || den === "total" ? "uses-the-wrong-quantity-for-the-total" : "compares-a-part-with-the-total") : "compares-the-two-parts-not-the-total";
      cands.push([`${val[p]}:${val[q]}`, tag]);
    }
  }
  cands.push([String(Math.abs(a - b)), "subtracts-instead-of-writing-a-ratio"]);
  const ds = tdistr(text, cands);
  return finalize({
    family: "ratio",
    level: L,
    spec: { kind: "write", a, b, num: num_, den },
    stem: given
      ? T3(`The ratio of ${sc.A} to ${sc.B} is ${a}:${b}.`, `The ratio of ${sc.A} to ${sc.B} ${sc.loc} is ${a}:${b}.`, `The ratio of ${sc.A} to ${sc.B} ${sc.loc} is ${a}:${b}.`)
      : T3(`There are ${a} ${sc.A} and ${b} ${sc.B} ${sc.loc}.`, `There are ${a} ${sc.A} and ${b} ${sc.B} ${sc.loc}.`, `There are ${a} ${sc.A} and ${b} ${sc.B} ${sc.loc}.`),
    ask: T3(`Write the ratio of ${nm[num_]} to ${nm[den]}. Use a colon.`, `What is the ratio of ${nm[num_]} to ${nm[den]}? Write it with a colon.`, `Express the ratio of ${nm[num_]} to ${nm[den]} in colon form, using the quantities from the situation.`),
    expr: null,
    answer: { value: text, text, kind: "text" },
    work: [`Name the two quantities in the order the question gives them: ${nm[num_]} first, ${nm[den]} second`, `${num_ === "total" || den === "total" ? `The total is ${a} + ${b} = ${t}` : "Both quantities are parts"}`, `The ratio is ${x} to ${y}, which can be written ${x}:${y} or ${x}/${y}`],
    visual: null,
    distractors: ds,
    hints: { conceptual: "A ratio compares two quantities. The order of the words in the question is the order of the numbers.", procedural: "Decide which quantity is named first. Then decide whether the second quantity is a part or the whole group." },
    structure: S(`Two quantities ${sc.loc}`, [{ label: sc.A, value: a }, { label: sc.B, value: b }], "a ratio in the order asked", "ratio of two quantities (part to part or part to whole)", "tape diagram with two parts", "The order of the numbers must match the order of the words."),
  });
}

function raEquiv(rng, L, ctx) {
  const sc = rScene(rng, ctx);
  const [a, b] = coprime(rng, 2, L === 1 ? 5 : 9);
  const k = ri(rng, 2, L === 1 ? 5 : L === 2 ? 9 : 12);
  const second = L === 1 ? true : rng.chance(0.5);
  const v = second ? a * k : b * k;
  const val = second ? b * k : a * k;
  const row0 = [a, b];
  const row1 = [a * k, b * k];
  return finalize({
    family: "ratio",
    level: L,
    spec: { kind: "equiv", a, b, given: { pos: second ? "first" : "second", value: v } },
    stem: T3(
      `The ratio of ${sc.A} to ${sc.B} is ${a} to ${b}. The ratio stays the same. There are ${v} ${second ? sc.A : sc.B}.`,
      `The ratio of ${sc.A} to ${sc.B} ${sc.loc} is ${a} to ${b}. The ratio stays the same, and there are ${v} ${second ? sc.A : sc.B}.`,
      `The ratio of ${sc.A} to ${sc.B} ${sc.loc} is ${a} to ${b}, and it does not change. There are ${v} ${second ? sc.A : sc.B}.`,
    ),
    ask: T3(`How many ${second ? sc.B : sc.A} are there?`, `How many ${second ? sc.B : sc.A} are there?`, `How many ${second ? sc.B : sc.A} are there?`),
    expr: null,
    answer: { value: String(val), text: String(val), kind: "int" },
    work: [`Find the scale factor: ${v} ${DIVIDE} ${second ? a : b} = ${k}`, `Multiply the other quantity by the same factor: ${second ? b : a} ${TIMES} ${k} = ${val}`, `Check: ${a}:${b} and ${a * k}:${b * k} describe the same relationship`],
    visual: { kind: "ratiotable", alt: `A ratio table with the headings ${sc.A} and ${sc.B}. The first row is ${a} and ${b}. The second row has one box left blank.`, headers: [cap(sc.A), cap(sc.B)], rows: [row0, row1], hide: [[1, second ? 1 : 0]] },
    distractors: distr(fr(val), { k: "int" }, second
      ? [[b + (v - a), "adds-the-same-number-to-both-quantities"], [v + b, "adds-the-two-quantities"], [k, "gives-the-scale-factor"], [v * b, "multiplies-the-two-numbers"], [b * (k - 1), "multiplies-by-one-less-than-the-factor"], ...slips(val)]
      : [[a + (v - b), "adds-the-same-number-to-both-quantities"], [v + a, "adds-the-two-quantities"], [k, "gives-the-scale-factor"], [v * a, "multiplies-the-two-numbers"], [a * (k - 1), "multiplies-by-one-less-than-the-factor"], ...slips(val)]),
    hints: { conceptual: "In equivalent ratios, both quantities are multiplied by the same number. Adding the same number to both changes the relationship.", procedural: "Find what number you multiply the known quantity by to go from the first row to the second. Use that same number on the other quantity." },
    structure: S(`A ratio of ${sc.A} to ${sc.B} stays the same`, [{ label: "ratio", value: `${a}:${b}` }, { label: second ? sc.A : sc.B, value: v }], `the number of ${second ? sc.B : sc.A}`, "equivalent ratios: multiply both quantities by the same factor", "ratio table", "Both rows must have the same ratio."),
  });
}

function raTable(rng, L, ctx) {
  const sc = rScene(rng, ctx);
  const [a, b] = coprime(rng, 2, L === 2 ? 8 : 12);
  const ks = L === 2 ? [1, 2, 3, 5] : [1, 3, 4, 7];
  const rows = ks.map((k) => [a * k, b * k]);
  const hr = ri(rng, 1, 3);
  const hc = ri(rng, 0, 1);
  const val = rows[hr][hc];
  const prev = rows[hr - 1];
  const shown = rows.map((r, i) => (i === hr ? (hc === 0 ? [null, r[1]] : [r[0], null]) : r));
  const cx = hc === 0 ? 1 : 0;
  const diff = rows[hr][cx] - prev[cx];
  return finalize({
    family: "ratio",
    level: L,
    spec: { kind: "table", headers: [sc.A, sc.B], rows: shown },
    stem: T3(
      `The table shows equivalent ratios of ${sc.A} to ${sc.B}. One box is empty.`,
      `The ratio table shows equivalent ratios of ${sc.A} to ${sc.B}. One box is empty.`,
      `The ratio table shows equivalent ratios of ${sc.A} to ${sc.B}. One entry is missing.`,
    ),
    ask: T3("What number goes in the empty box?", "What number belongs in the empty box?", "Determine the missing entry in the ratio table."),
    expr: null,
    answer: { value: String(val), text: String(val), kind: "int" },
    work: [`Use a complete row to find the relationship: ${a}:${b}`, `Find the factor between this row and the row with the empty box, then use it on the other number`, `The missing number is ${val}`],
    visual: { kind: "ratiotable", alt: `A ratio table with the headings ${sc.A} and ${sc.B}, four rows and one empty box.`, headers: [cap(sc.A), cap(sc.B)], rows, hide: [[hr, hc]] },
    distractors: distr(fr(val), { k: "int" }, [
      [prev[hc] + diff, "adds-the-same-number-as-the-other-column"],
      [rows[hr][cx] + prev[hc], "adds-numbers-from-different-rows"],
      [rows[hr][cx], "copies-the-other-number-in-the-row"],
      [Math.round((val + prev[hc]) / 2), "averages-instead-of-scaling"],
      ...slips(val),
    ]),
    hints: { conceptual: "Every row of a ratio table shows the same ratio. Multiplying or dividing a whole row keeps it equivalent.", procedural: "Pick a row that is complete. Find what you multiply to reach the row with the empty box, then use it on the other number in that row." },
  });
}

function raTape(rng, L, ctx) {
  const sc = rScene(rng, ctx);
  const [a, b] = coprime(rng, 2, L === 1 ? 5 : 7);
  const k = ri(rng, 2, L === 1 ? 6 : L === 2 ? 9 : 14);
  const T = k * (a + b);
  const findA = rng.chance(0.5);
  const val = k * (findA ? a : b);
  const other = k * (findA ? b : a);
  const ask = findA ? sc.A : sc.B;
  return finalize({
    family: "ratio",
    level: L,
    spec: { kind: "tape", a, b, total: T, find: findA ? "a" : "b" },
    stem: T3(
      `The ratio of ${sc.A} to ${sc.B} is ${a}:${b}. The total is ${T}.`,
      `The ratio of ${sc.A} to ${sc.B} ${sc.loc} is ${a}:${b}. There are ${T} altogether.`,
      `The ratio of ${sc.A} to ${sc.B} ${sc.loc} is ${a}:${b}, and the two groups total ${T}.`,
    ),
    ask: T3(`How many ${ask} are there?`, `How many ${ask} are there?`, `How many ${ask} are there?`),
    expr: null,
    answer: { value: String(val), text: String(val), kind: "int" },
    work: [`The tape has ${a} + ${b} = ${a + b} equal units`, `Each unit is ${T} ${DIVIDE} ${a + b} = ${k}`, `${cap(ask)} use ${findA ? a : b} units: ${findA ? a : b} ${TIMES} ${k} = ${val}`],
    visual: { kind: "tape", alt: `A tape diagram with two rows. The first row has ${a} equal parts for ${sc.A}. The second row has ${b} equal parts for ${sc.B}. The whole tape is ${T}.`, rows: [{ label: cap(sc.A), parts: [{ label: "?", value: "?", n: a }] }, { label: cap(sc.B), parts: [{ label: "?", value: "?", n: b }] }], total: T },
    distractors: distr(fr(val), { k: "int" }, [[other, "finds-the-other-quantity"], [k, "gives-the-value-of-one-unit"], [T - (findA ? a : b), "subtracts-the-ratio-number-from-the-total"], [Math.round(T / (findA ? a : b)), "divides-the-total-by-one-part"], [T / 2, "splits-the-total-into-two-equal-groups"], ...slips(val)]),
    hints: { conceptual: "Each part of the ratio is the same size. The whole is made of all the parts together.", procedural: "Count all the equal parts in the tape. Divide the total by that number to find one unit. Then count the units you need." },
    structure: S(`Two groups ${sc.loc}`, [{ label: "ratio", value: `${a}:${b}` }, { label: "total", value: T }], `the number of ${ask}`, "part-part-whole ratio: equal units that add to the total", "tape diagram", "The two groups must add to the total."),
  });
}

function raDnl(rng, L, ctx) {
  const sc = rScene(rng, ctx);
  const [a, b] = coprime(rng, 2, L === 1 ? 6 : 10);
  const ks = [1, 2, 3, ri(rng, 4, L === 3 ? 9 : 6)];
  const top = ks.map((k) => a * k);
  const bot = ks.map((k) => b * k);
  const hi = ri(rng, 1, 3);
  const onTop = rng.chance(0.5);
  const val = (onTop ? top : bot)[hi];
  const t2 = top.map((x, i) => (onTop && i === hi ? null : x));
  const b2 = bot.map((x, i) => (!onTop && i === hi ? null : x));
  return finalize({
    family: "ratio",
    level: L,
    spec: { kind: "dnl", top: { label: sc.A, values: t2 }, bottom: { label: sc.B, values: b2 } },
    stem: T3(`A double number line shows ${sc.A} and ${sc.B} in the same ratio. One number is missing.`, `A double number line shows ${sc.A} and ${sc.B} in a constant ratio. One number is missing.`, `A double number line shows ${sc.A} and ${sc.B} in a constant ratio. One value is missing.`),
    ask: T3("What number is missing?", "What is the missing number?", "Determine the missing value."),
    expr: null,
    answer: { value: String(val), text: String(val), kind: "int" },
    work: [`Use a pair that is complete: ${top[0]} and ${bot[0]}`, `The ratio ${a}:${b} stays the same along the whole number line`, `Scale from the complete pair to the pair with the missing number`],
    visual: { kind: "doublenl", alt: `A double number line. The top line shows ${sc.A} and the bottom line shows ${sc.B}. One number is missing.`, top: { label: cap(sc.A), values: t2 }, bottom: { label: cap(sc.B), values: b2 } },
    distractors: distr(fr(val), { k: "int" }, [
      [val + (onTop ? 1 : -1), "off-by-one"],
      [onTop ? bot[hi] : top[hi], "reads-the-number-from-the-other-line"],
      [val + a + b, "adds-the-numbers-in-the-ratio"],
      [Math.abs((onTop ? top[hi - 1] + (bot[hi] - bot[hi - 1]) : bot[hi - 1] + (top[hi] - top[hi - 1]))), "adds-the-same-number-as-on-the-other-line"],
      ...slips(val),
    ]),
    hints: { conceptual: "Numbers lined up on a double number line always have the same ratio. Equal steps on one line match equal steps on the other.", procedural: "Compare the missing number's column to a complete column. Find the factor between them and apply it." },
  });
}

const MIXES = [
  { p: "blue paint", q: "white paint", noun: "Mix", ask: "Which mix has more blue paint for each cup of white paint?" },
  { p: "lemon juice", q: "water", noun: "Drink", ask: "Which drink has more lemon juice for each cup of water?" },
  { p: "orange juice", q: "sparkling water", noun: "Punch", ask: "Which punch has more orange juice for each cup of sparkling water?" },
];
function raCompare(rng, L) {
  const m = rng.pick(MIXES);
  const hi = L === 2 ? 6 : 9;
  let x1;
  let y1;
  let x2;
  let y2;
  do {
    x1 = ri(rng, 1, hi);
    y1 = ri(rng, 2, hi);
    x2 = ri(rng, 1, hi);
    y2 = ri(rng, 2, hi);
  } while (x1 * y2 === x2 * y1 || (x1 === x2 && y1 === y2));
  const first = x1 * y2 > x2 * y1;
  const text = `${m.noun} ${first ? 1 : 2}`;
  const biggerFirst = x1 > x2 ? 1 : x2 > x1 ? 2 : 0;
  const ds = tdistr(text, [
    [`${m.noun} ${first ? 2 : 1}`, biggerFirst === (first ? 2 : 1) ? "compares-only-the-first-numbers" : "compares-the-totals-instead-of-the-ratios"],
    [`The ${m.noun.toLowerCase()}s are the same`, "thinks-different-numbers-cannot-be-compared"],
    [`Cannot tell without the totals`, "thinks-ratios-cannot-be-compared"],
  ]);
  return finalize({
    family: "ratio",
    level: L,
    spec: { kind: "compare", m1: [x1, y1], m2: [x2, y2], noun: m.noun },
    stem: T3(
      `${m.noun} 1 uses ${x1} cups of ${m.p} and ${y1} cups of ${m.q}. ${m.noun} 2 uses ${x2} cups of ${m.p} and ${y2} cups of ${m.q}.`,
      `${m.noun} 1 is made with ${x1} cups of ${m.p} and ${y1} cups of ${m.q}. ${m.noun} 2 is made with ${x2} cups of ${m.p} and ${y2} cups of ${m.q}.`,
      `${m.noun} 1 is prepared with ${x1} cups of ${m.p} and ${y1} cups of ${m.q}, and ${m.noun} 2 is prepared with ${x2} cups of ${m.p} and ${y2} cups of ${m.q}.`,
    ),
    ask: T3(m.ask, m.ask, m.ask),
    expr: null,
    answer: { value: text, text, kind: "text" },
    work: [`Find ${m.p} for each 1 cup of ${m.q} in ${m.noun} 1: ${x1}/${y1} of a cup`, `Find ${m.p} for each 1 cup of ${m.q} in ${m.noun} 2: ${x2}/${y2} of a cup`, `Compare the two with a common denominator: ${x1 * y2}/${y1 * y2} and ${x2 * y1}/${y1 * y2}`, `${first ? `${x1 * y2} is greater than ${x2 * y1}` : `${x2 * y1} is greater than ${x1 * y2}`}, so ${text} has more ${m.p} for each cup of ${m.q}`],
    visual: null,
    distractors: ds,
    hints: { conceptual: "To compare ratios, compare how much of one quantity goes with one unit of the other, or use equivalent ratios with a common number.", procedural: "Write each ratio as a fraction, or scale both mixes so the amount of one ingredient matches. Then compare the other ingredient." },
  });
}

FAMILIES.ratio = {
  title: "Ratios",
  grades: [6],
  defaults: {},
  gen(rng, P, { level = 1, ctx = "store" } = {}) {
    const pool = level === 1 ? [raWrite, raWrite, raEquiv, raEquiv, raDnl, raTape] : level === 2 ? [raWrite, raEquiv, raTable, raTape, raDnl, raCompare] : [raTape, raTable, raCompare, raEquiv, raDnl, raWrite];
    return rng.pick(pool)(rng, level, ctx);
  },
};

// ================================================================================================ unitrate (g6.unitrates)
const RATES = [
  { who: "A cyclist", verb: "rides", q: "miles", per: "hours", per1: "hour", unit: "miles per hour" },
  { who: "A water pump", verb: "moves", q: "liters", per: "minutes", per1: "minute", unit: "liters per minute" },
  { who: "A reader", verb: "reads", q: "pages", per: "minutes", per1: "minute", unit: "pages per minute" },
  { who: "A machine", verb: "fills", q: "bottles", per: "minutes", per1: "minute", unit: "bottles per minute" },
  { who: "A hiker", verb: "walks", q: "kilometers", per: "hours", per1: "hour", unit: "kilometers per hour" },
];
const D2 = (cents) => (cents / 100).toFixed(2);
function urUnit(rng, L, ctx) {
  const money = rng.chance(0.5);
  const per = rng.pick(L === 1 ? [2, 3, 4, 5, 6, 8, 10] : [2, 4, 5, 8, 10, 12]);
  if (money) {
    const it = sale(rng, ctx);
    const u = L === 1 ? ri(rng, 2, 9) * 100 : ri(rng, 4, 59) * 5 + (L === 3 ? 0 : 0);
    const total = u * per;
    const t = D2(total);
    const val = fr(u, 100);
    return finalize({
      family: "unitrate",
      level: L,
      spec: { kind: "unit", qty: t, per },
      stem: T3(`${per} ${it.many} cost $${t}. All the ${it.many} cost the same.`, `${per} ${it.many} cost $${t} in all, and each one costs the same.`, `${per} ${it.many} cost $${t} in total. Every ${it.one} has the same price.`),
      ask: T3(`What is the price of one ${it.one}?`, `What is the unit price of one ${it.one}?`, `Find the unit price of one ${it.one}.`),
      expr: `$${t} ${DIVIDE} ${per}`,
      answer: ans(val, { k: "money" }, `per ${it.one}`),
      work: [`The unit price is the cost for 1 ${it.one}`, `$${t} ${DIVIDE} ${per} = $${D2(u)}`],
      visual: { kind: "ratiotable", alt: `A ratio table with ${it.many} and cost. One row shows ${per} and $${t}. The next row shows 1 and an empty box.`, headers: [cap(it.many), "Cost ($)"], rows: [[per, Number(t)], [1, Number(D2(u))]], hide: [[1, 1]] },
      distractors: distr(val, { k: "money" }, [[fr(per * 100, total), "divides-the-number-of-items-by-the-cost"], [fr(total + per * 100, 100), "adds-the-items-to-the-cost"], [fr(total, 100).mul(fr(per)), "multiplies-instead-of-dividing"], [fr(total - per * 100, 100), "subtracts-the-number-of-items-from-the-cost"], [val.add(fr(5, 100)), "rounding-slip"]]),
      hints: { conceptual: "A unit rate tells how much for exactly one. Share the total cost equally among the items.", procedural: "Divide the total cost by the number of items. Line up the decimal point in your answer." },
      structure: S(`Items are sold at one price each`, [{ label: it.many, value: per }, { label: "total cost", value: `$${t}` }], `the cost of one ${it.one}`, "unit rate: cost per item", "ratio table with a 1 row", "Multiplying the unit price by the number of items should give the total."),
    });
  }
  const sc = rng.pick(RATES);
  const tenths = L === 1 ? ri(rng, 2, 12) * 10 : ri(rng, 12, 98) * (L === 3 ? 1 : 5);
  const u = fr(tenths, 10);
  const qty = u.mul(fr(per));
  const qtyS = dStr(qty, decPlaces(qty) < 0 ? 1 : Math.max(0, decPlaces(qty)), false);
  const st = decPlaces(u) === 0 ? { k: "int" } : { k: "dec", p: decPlaces(u) };
  return finalize({
    family: "unitrate",
    level: L,
    spec: { kind: "unit", qty: qtyS, per },
    stem: T3(`${sc.who} ${sc.verb} ${qtyS} ${sc.q} in ${per} ${sc.per}. The rate stays the same.`, `${sc.who} ${sc.verb} ${qtyS} ${sc.q} in ${per} ${sc.per} at a constant rate.`, `${sc.who} ${sc.verb} ${qtyS} ${sc.q} in ${per} ${sc.per} at a constant rate.`),
    ask: T3(`How many ${sc.q} is that in one ${sc.per1}?`, `What is the unit rate in ${sc.unit}?`, `Find the unit rate, in ${sc.unit}.`),
    expr: `${qtyS} ${DIVIDE} ${per}`,
    answer: ans(u, st, sc.unit),
    work: [`The unit rate is the amount for 1 ${sc.per1}`, `${qtyS} ${DIVIDE} ${per} = ${fmtPlain(u)}`],
    visual: { kind: "doublenl", alt: `A double number line. The top line shows ${sc.per} and the bottom line shows ${sc.q}. ${per} ${sc.per} goes with ${qtyS} ${sc.q}. The number that goes with 1 is missing.`, top: { label: cap(sc.per), values: [0, 1, per] }, bottom: { label: cap(sc.q), values: [0, null, Number(qtyS)] } },
    distractors: distr(u, st, [[fr(per).div(qty), "divides-the-time-by-the-amount"], [qty.add(fr(per)), "adds-the-two-numbers"], [qty.mul(fr(per)), "multiplies-instead-of-dividing"], [qty.sub(fr(per)), "subtracts-the-two-numbers"], [u.mul(fr(10)), "decimal-point-slip"], [u.add(fr(1)), "off-by-one"]]),
    hints: { conceptual: `A unit rate tells how many ${sc.q} go with exactly one ${sc.per1}. Share the amount equally across the ${sc.per}.`, procedural: `Divide the number of ${sc.q} by the number of ${sc.per}.` },
    structure: S(`${sc.who} works at a steady rate`, [{ label: sc.q, value: qtyS }, { label: sc.per, value: per }], sc.unit, "unit rate: amount for 1 unit of time", "double number line", "The rate times the time should give the amount."),
  });
}
const fmtPlain = (f) => {
  const dp = decPlaces(f);
  return dp <= 0 ? String(f.n / f.d) : dStr(f, dp, false);
};

function urBetter(rng, L, ctx) {
  const it = sale(rng, ctx);
  const pick = () => rng.pick(L === 1 ? [2, 4, 5, 10] : [2, 4, 5, 8, 10, 12, 20]);
  let n1;
  let n2;
  let u1;
  let u2;
  do {
    n1 = pick();
    n2 = pick();
    u1 = ri(rng, L === 1 ? 2 : 20, L === 1 ? 9 : 160) * (L === 1 ? 100 : 5);
    u2 = ri(rng, L === 1 ? 2 : 20, L === 1 ? 9 : 160) * (L === 1 ? 100 : 5);
  } while (n1 === n2 || Math.abs(u1 - u2) < (L === 1 ? 100 : 10));
  const c1 = n1 * u1;
  const c2 = n2 * u2;
  const first = u1 < u2;
  const text = `Offer ${first ? "A" : "B"}`;
  const ds = tdistr(text, [
    [`Offer ${first ? "B" : "A"}`, (first ? c1 < c2 : c2 < c1) ? "picks-the-offer-with-the-higher-unit-price" : "picks-the-offer-with-the-lower-total-price"],
    [`The offers cost the same for each ${it.one}`, "thinks-the-unit-prices-are-equal"],
    [`Cannot tell: the offers have different numbers of ${it.many}`, "thinks-offers-of-different-sizes-cannot-be-compared"],
  ]);
  return finalize({
    family: "unitrate",
    level: L,
    spec: { kind: "better", offers: [{ label: "A", qty: n1, cost: D2(c1) }, { label: "B", qty: n2, cost: D2(c2) }] },
    stem: T3(`Offer A: ${n1} ${it.many} for $${D2(c1)}. Offer B: ${n2} ${it.many} for $${D2(c2)}.`, `Offer A sells ${n1} ${it.many} for $${D2(c1)}. Offer B sells ${n2} ${it.many} for $${D2(c2)}.`, `Offer A sells ${n1} ${it.many} for $${D2(c1)}, and Offer B sells ${n2} ${it.many} for $${D2(c2)}.`),
    ask: T3(`Which offer has the lower price for each ${it.one}?`, `Which offer is the better buy?`, `Which offer is the better buy, based on the price of one ${it.one}?`),
    expr: null,
    answer: { value: text, text, kind: "text" },
    work: [`Offer A: $${D2(c1)} ${DIVIDE} ${n1} = $${D2(u1)} for each ${it.one}`, `Offer B: $${D2(c2)} ${DIVIDE} ${n2} = $${D2(u2)} for each ${it.one}`, `$${D2(Math.min(u1, u2))} is less than $${D2(Math.max(u1, u2))}, so ${text} costs less for each ${it.one}`],
    visual: null,
    distractors: ds,
    hints: { conceptual: "To compare prices fairly, find the price of one item in each offer. Then you are comparing the same amount.", procedural: "Divide each offer's cost by its number of items. Compare the two unit prices." },
    structure: S("Two offers are compared", [{ label: "Offer A", value: `${n1} for $${D2(c1)}` }, { label: "Offer B", value: `${n2} for $${D2(c2)}` }], "the better buy", "unit price comparison", "ratio tables with a 1 row", "The lower unit price is the better buy."),
  });
}

function urSolve(rng, L) {
  const sc = rng.pick(RATES);
  const per = rng.pick([2, 3, 4, 5, 6, 8]);
  const uT = L === 1 ? ri(rng, 2, 9) * 10 : ri(rng, 12, 95) * 5;
  const u = fr(uT, 10);
  const qty = u.mul(fr(per));
  const qtyS = fmtPlain(qty);
  const findQty = L === 3 ? rng.chance(0.4) : true;
  const m = ri(rng, 3, 12);
  if (findQty) {
    let g = m;
    if (g === per) g += 1;
    const val = u.mul(fr(g));
    const st = decPlaces(val) === 0 ? { k: "int" } : { k: "dec", p: decPlaces(val) };
    return finalize({
      family: "unitrate",
      level: L,
      spec: { kind: "solve", qty: qtyS, per, given: g, find: "qty" },
      stem: T3(`${sc.who} ${sc.verb} ${qtyS} ${sc.q} in ${per} ${sc.per}. The rate stays the same.`, `${sc.who} ${sc.verb} ${qtyS} ${sc.q} in ${per} ${sc.per} at a constant rate.`, `${sc.who} ${sc.verb} ${qtyS} ${sc.q} in ${per} ${sc.per} at a constant rate.`),
      ask: T3(`How many ${sc.q} in ${g} ${sc.per}?`, `At this rate, how many ${sc.q} will there be in ${g} ${sc.per}?`, `At this constant rate, how many ${sc.q} correspond to ${g} ${sc.per}?`),
      expr: null,
      answer: ans(val, st, sc.q),
      work: [`Find the unit rate: ${qtyS} ${DIVIDE} ${per} = ${fmtPlain(u)} ${sc.unit}`, `Multiply by the time: ${fmtPlain(u)} ${TIMES} ${g} = ${fmtPlain(val)}`],
      visual: L === 1 ? { kind: "doublenl", alt: `A double number line. The top line shows ${sc.per}: ${per} and ${g}. The bottom line shows ${sc.q}: ${qtyS} and an empty box.`, top: { label: cap(sc.per), values: [per, g] }, bottom: { label: cap(sc.q), values: [Number(qtyS), null] } } : null,
      distractors: distr(val, st, [[fr(g).add(qty).sub(fr(per)), "adds-the-same-number-to-both-quantities"], [qty.mul(fr(g)), "multiplies-the-two-given-numbers"], [u, "stops-at-the-unit-rate"], [qty.add(fr(g)), "adds-the-given-numbers"], [fr(g).div(u), "divides-the-time-by-the-rate"], [val.add(fr(1)), "off-by-one"]]),
      hints: { conceptual: "A constant rate means every unit of time gives the same amount. Find the amount for one unit first.", procedural: "Divide to find the unit rate. Then multiply the unit rate by the number of units you are asked about." },
      structure: S(`${sc.who} works at a constant rate`, [{ label: sc.q, value: qtyS }, { label: sc.per, value: per }, { label: `new ${sc.per}`, value: g }], `${sc.q} in ${g} ${sc.per}`, "constant rate: amount = rate times time", "double number line", "More time should give more of the amount."),
    });
  }
  const need = u.mul(fr(m));
  const needS = fmtPlain(need);
  return finalize({
    family: "unitrate",
    level: L,
    spec: { kind: "solve", qty: qtyS, per, given: needS, find: "per" },
    stem: T3(`${sc.who} ${sc.verb} ${qtyS} ${sc.q} in ${per} ${sc.per}. The rate stays the same.`, `${sc.who} ${sc.verb} ${qtyS} ${sc.q} in ${per} ${sc.per} at a constant rate.`, `${sc.who} ${sc.verb} ${qtyS} ${sc.q} in ${per} ${sc.per} at a constant rate.`),
    ask: T3(`How many ${sc.per} for ${needS} ${sc.q}?`, `At this rate, how many ${sc.per} will it take for ${needS} ${sc.q}?`, `At this constant rate, how many ${sc.per} are needed for ${needS} ${sc.q}?`),
    expr: null,
    answer: ans(fr(m), { k: "int" }, sc.per),
    work: [`Find the unit rate: ${qtyS} ${DIVIDE} ${per} = ${fmtPlain(u)} ${sc.unit}`, `Find how many ${sc.per} give ${needS} ${sc.q}: ${needS} ${DIVIDE} ${fmtPlain(u)} = ${m}`],
    visual: null,
    distractors: distr(fr(m), { k: "int" }, [[Math.round(need.value) + per, "adds-instead-of-dividing"], [per + (m > 1 ? 1 : 2), "adds-to-the-time-given"], [Math.round(need.value), "gives-the-amount-instead-of-the-time"], [m + 1, "off-by-one"], [m * 2, "doubles-the-time"], ...slips(m)]),
    hints: { conceptual: "Divide to find how many units of time fit into the new amount at the unit rate.", procedural: "Find the unit rate first. Then divide the new amount by the unit rate." },
    structure: S(`${sc.who} works at a constant rate`, [{ label: sc.q, value: qtyS }, { label: sc.per, value: per }, { label: "target amount", value: needS }], `${sc.per} needed`, "constant rate: time = amount divided by rate", "double number line", "A larger amount needs more time."),
  });
}

FAMILIES.unitrate = {
  title: "Unit rates",
  grades: [6],
  defaults: {},
  gen(rng, P, { level = 1, ctx = "store" } = {}) {
    const pool = level === 1 ? [urUnit, urUnit, urBetter, urSolve] : [urUnit, urBetter, urSolve, urSolve];
    return rng.pick(pool)(rng, level, ctx);
  },
};

// ================================================================================================ percent (g6.percents, g7.percentapps)
const PCTS = [10, 20, 25, 30, 40, 50, 60, 75, 80, 5, 15, 90];
const pctModel = (alt, rows, hide) => ({ kind: "ratiotable", alt, headers: ["Percent", "Amount"], rows, hide });
function pcPart(rng, L, ctx) {
  const pk = pack(rng, ctx);
  const pct = rng.pick(L === 1 ? [10, 20, 25, 50] : PCTS);
  const whole = L === 1 ? ri(rng, 2, 10) * 20 : L === 2 ? ri(rng, 2, 24) * 20 : ri(rng, 6, 80) * 5;
  const val = fr(pct * whole, 100);
  const dp = decPlaces(val);
  const st = dp === 0 ? { k: "int" } : { k: "dec", p: dp };
  return finalize({
    family: "percent",
    level: L,
    spec: { kind: "part", pct, whole },
    stem: T3(`There are ${whole} ${pk.item}. ${pct}% of them are donated.`, `There are ${whole} ${pk.item}, and ${pct}% of them are donated.`, `A group has ${whole} ${pk.item}, and ${pct}% of them are donated.`),
    ask: T3(`How many ${pk.item} are donated?`, `How many ${pk.item} are donated?`, `How many of the ${pk.item} are donated?`),
    expr: `${pct}% ${TIMES} ${whole}`,
    answer: ans(val, st, pk.item),
    work: [`${pct}% means ${pct} out of every 100`, `${pct}% of ${whole} = ${pct}/100 ${TIMES} ${whole}`, `Divide ${whole} by 100 and multiply by ${pct}, or use equal parts of the whole: the answer is ${fmtPlain(val)}`],
    visual: L === 1 ? pctModel(`A ratio table with percent and amount. The row 100 percent matches ${whole}. The row ${pct} percent has an empty amount.`, [[100, whole], [pct, Number(fmtPlain(val))]], [[1, 1]]) : null,
    distractors: distr(val, st, [[fr(whole * 100, pct), "divides-instead-of-finding-the-percent"], [fr(whole - pct), "subtracts-the-percent-number"], [fr(whole + pct), "adds-the-percent-number"], [fr(pct * whole), "forgets-to-divide-by-100"], [fr(whole).sub(val), "finds-the-part-that-is-left"], [val.mul(fr(10)), "decimal-point-slip"]]),
    hints: { conceptual: "A percent is a rate per hundred. Think about what part of the whole matches one percent, then scale.", procedural: "Find what one percent of the amount is, or use a friendly benchmark such as one tenth or one half. Then scale up to the percent you need." },
    structure: S(`Some of a group of ${pk.item} are donated`, [{ label: "whole", value: whole }, { label: "percent", value: `${pct}%` }], "the part", "part = percent of whole", "ratio table with 100 percent and the whole", "The part must be less than the whole."),
  });
}
function pcWhole(rng, L, ctx) {
  const pct = rng.pick(L === 1 ? [10, 20, 25, 50] : [10, 20, 25, 30, 40, 60, 75, 80]);
  const whole = L === 1 ? ri(rng, 2, 10) * 20 : ri(rng, 3, 30) * 20;
  const part = (pct * whole) / 100;
  const pk = pack(rng, ctx);
  return finalize({
    family: "percent",
    level: L,
    spec: { kind: "whole", pct, part },
    stem: T3(`${pct}% of the ${pk.item} are new. That is ${part} ${pk.item}.`, `${pct}% of the ${pk.item} are new. That is ${part} ${pk.item}.`, `${pct}% of the ${pk.item} are new, and that amount is ${part} ${pk.item}.`),
    ask: T3(`How many ${pk.item} are there in all?`, `How many ${pk.item} are there in total?`, `What is the total number of ${pk.item}?`),
    expr: null,
    answer: { value: String(whole), text: num(whole), kind: "int", unit: pk.item },
    work: [`${pct}% of the whole is ${part}`, `Find 1%: ${part} ${DIVIDE} ${pct} = ${fmtPlain(fr(part, pct))}`, `Find 100%: ${fmtPlain(fr(part, pct))} ${TIMES} 100 = ${whole}`],
    visual: L === 1 ? pctModel(`A ratio table with percent and amount. The row ${pct} percent matches ${part}. The row 100 percent has an empty amount.`, [[pct, part], [100, whole]], [[1, 1]]) : null,
    distractors: distr(fr(whole), { k: "int" }, [[Math.round((part * pct) / 100) || part + pct, "multiplies-the-part-by-the-percent"], [part + pct, "adds-the-percent-number-to-the-part"], [part * pct, "forgets-to-divide-by-100"], [Math.round(part / (pct / 100) / 2), "halves-the-whole"], [100 - pct, "subtracts-the-percent-from-100"], ...slips(whole)]),
    hints: { conceptual: "The part you are given matches the percent, not the whole. Find the size of one percent or ten percent, then build up to the whole.", procedural: "Divide the part by the percent to find one percent. Then multiply by one hundred to find the whole." },
    structure: S(`A percent of a whole is known`, [{ label: "part", value: part }, { label: "percent", value: `${pct}%` }], "the whole", "part = percent of whole, so whole = part / percent", "ratio table or bar split into tenths", "The whole must be greater than the part."),
  });
}
function pcPercent(rng, L, ctx) {
  const pct = rng.pick(PCTS);
  const whole = ri(rng, 1, L === 1 ? 5 : 10) * 20;
  const part = (pct * whole) / 100;
  const pk = pack(rng, ctx);
  const bare = rng.chance(0.3);
  const pctS = String(pct);
  return finalize({
    family: "percent",
    level: L,
    spec: { kind: "pct", part, whole },
    stem: bare ? T3(`A fraction is ${part}/${whole}.`, `Consider the fraction ${part}/${whole}.`, `Consider the fraction ${part}/${whole}.`) : T3(`${part} of the ${whole} ${pk.item} are new.`, `${part} out of ${whole} ${pk.item} are new.`, `${part} of the ${whole} ${pk.item} are new.`),
    ask: bare ? T3(`What is ${part}/${whole} as a percent?`, `Write ${part}/${whole} as a percent.`, `Express ${part}/${whole} as a percent.`) : T3("What percent are new?", "What percent of the " + pk.item + " are new?", "What percent of the " + pk.item + " are new?"),
    expr: null,
    answer: { value: pctS, text: `${pct}%`, kind: "int", unit: "percent" },
    work: [`Write the part as a fraction of the whole: ${part}/${whole}`, `Scale to a denominator of 100: ${part}/${whole} = ${pct}/100`, `${pct} out of 100 is ${pct}%`],
    visual: L === 1 ? pctModel(`A ratio table with percent and amount. The row 100 percent matches ${whole}. The row with ${part} has an empty percent.`, [[100, whole], [pct, part]], [[1, 0]]) : null,
    distractors: distr(fr(pct), { k: "int", sfx: "%" }, [[Math.round((part / (whole + part)) * 100) || part, "uses-the-sum-as-the-whole"], [part, "gives-the-part-as-the-percent"], [whole - part, "gives-the-part-that-is-not-new"], [100 - pct, "subtracts-from-100"], [Math.round((whole / part) * 10) / 10, "divides-whole-by-part"], ...slips(pct)]),
    hints: { conceptual: "A percent compares a part with a whole of one hundred. Make the whole one hundred and see what the part becomes.", procedural: "Write the part over the whole as a fraction. Scale the fraction so the denominator is one hundred." },
    structure: S(`A part of a whole is known`, [{ label: "part", value: part }, { label: "whole", value: whole }], "the percent", "percent = part per 100", "ratio table", "The percent should be between 0% and 100%."),
  });
}

function pcApp(rng, L, ctx) {
  const it = sale(rng, ctx);
  const who = rng.pick(NAMES);
  const money = (f) => ({ k: "money" });
  const price = L === 1 ? ri(rng, 4, 40) * 5 : L === 2 ? ri(rng, 10, 90) * 2 + 0 : ri(rng, 20, 190);
  const rates = L === 1 ? [5, 10, 20, 25] : [5, 6, 8, 10, 12, 15, 20, 25, 30, 40];
  const rate = rng.pick(rates);
  const app = rng.pick(L === 1 ? ["tax", "tip", "discount", "change"] : ["tax", "tip", "discount", "markup", "change", "interest", "orig", "orig"]);
  const pr = fr(price);
  const amt = pr.mul(fr(rate, 100));
  const cents = (f) => f.mul(fr(100));
  if (app === "tax" || app === "tip" || app === "discount" || app === "markup") {
    const askTotal = rng.chance(0.55);
    const sign = app === "discount" ? -1 : 1;
    const total = sign > 0 ? pr.add(amt) : pr.sub(amt);
    const target = askTotal ? total : amt;
    const tr = {
      tax: [`${who} buys a ${it.one} for $${price}. The sales tax is ${rate}%.`, `${who} buys a ${it.one} that costs $${price}. The sales tax rate is ${rate}%.`, `${who} buys a ${it.one} priced at $${price}, and the sales tax rate is ${rate}%.`, askTotal ? "What is the total cost?" : "How much is the tax?", askTotal ? "What is the total cost, including tax?" : "How much is the sales tax?", askTotal ? "Find the total cost, including sales tax." : "Find the amount of the sales tax."],
      tip: [`The bill at a restaurant is $${price}. ${who} leaves a ${rate}% tip.`, `${who}'s restaurant bill is $${price}. ${who} leaves a ${rate}% tip.`, `The restaurant bill is $${price}, and ${who} leaves a tip of ${rate}% of the bill.`, askTotal ? "What is the total, with the tip?" : "How much is the tip?", askTotal ? "What is the total, including the tip?" : "How much is the tip?", askTotal ? "Find the total amount paid, including the tip." : "Find the amount of the tip."],
      discount: [`A ${it.one} costs $${price}. It is on sale for ${rate}% off.`, `A ${it.one} regularly costs $${price}. It is on sale for ${rate}% off.`, `A ${it.one} is regularly priced at $${price} and is on sale for ${rate}% off.`, askTotal ? "What is the sale price?" : "How much money does the sale save?", askTotal ? "What is the sale price?" : "How much does the sale save?", askTotal ? "Find the sale price." : "Find the amount of the discount."],
      markup: [`A shop buys a ${it.one} for $${price}. It marks the price up ${rate}%.`, `A shop buys a ${it.one} for $${price} and marks up the price by ${rate}%.`, `A shop buys a ${it.one} for $${price} and increases the price by ${rate}%.`, askTotal ? "What is the selling price?" : "How much is the markup?", askTotal ? "What is the selling price?" : "How much is the markup?", askTotal ? "Find the selling price." : "Find the amount of the markup."],
    }[app];
    const kindName = { tax: "tax", tip: "tip", discount: "discount", markup: "markup" }[app];
    const wrong = askTotal
      ? [[amt, `gives-the-${kindName}-not-the-total`], [sign > 0 ? pr.sub(amt) : pr.add(amt), `${sign > 0 ? "subtracts" : "adds"}-the-${kindName}-the-wrong-way`], [pr.mul(fr(rate)), "forgets-to-divide-the-percent-by-100"], [pr.add(fr(rate)), "adds-the-percent-number-to-the-price"], [pr.sub(fr(rate)), "subtracts-the-percent-number-from-the-price"]]
      : [[total, `gives-the-total-not-the-${kindName}`], [pr.mul(fr(rate)), "forgets-to-divide-the-percent-by-100"], [pr.div(fr(rate)), "divides-by-the-percent"], [fr(rate), "gives-the-percent-number"], [pr.sub(amt), "finds-the-price-after-subtracting"]];
    if (decPlaces(target) < 0 || decPlaces(target) > 2) return pcApp(rng, L, ctx);
    return finalize({
      family: "percent",
      level: L,
      spec: { kind: "app", app, price, rate, ask: askTotal ? "total" : "part" },
      stem: T3(tr[0], tr[1], tr[2]),
      ask: T3(tr[3], tr[4], tr[5]),
      expr: null,
      answer: ans(target, { k: "money" }),
      work: [`${rate}% of $${price}: ${rate}/100 ${TIMES} ${price} = $${dStr(amt, Math.max(2, decPlaces(amt)), false)}`, ...(askTotal ? [`${sign > 0 ? "Add to" : "Subtract from"} the price: $${price} ${sign > 0 ? "+" : MINUS} $${dStr(amt, 2, false)} = $${dStr(total, 2, false)}`] : [`The ${kindName} is $${dStr(amt, 2, false)}`])],
      distractors: distr(target, { k: "money" }, wrong, { pos: true }),
      hints: { conceptual: `The ${kindName} is a percent of the price, so it is a part of the price, not the price itself.`, procedural: `Change the percent to a decimal or a fraction out of one hundred. Multiply by the price${askTotal ? ", then decide whether to add or subtract" : ""}.` },
      structure: S(`${who} deals with a percent of a price`, [{ label: "price", value: `$${price}` }, { label: "rate", value: `${rate}%` }], askTotal ? "the final amount" : `the ${kindName}`, "percent of a quantity, then combine with the price", "bar model: 100% plus the percent", "The result should be a little more or less than the price."),
    });
  }
  if (app === "change") {
    const from = rng.pick([20, 25, 40, 50, 80, 100, 120, 200, 250, 400]);
    const p = rng.pick([10, 20, 25, 30, 40, 50, 60, 75]);
    const inc = rng.chance(0.5);
    const dif = (from * p) / 100;
    if (!Number.isInteger(dif)) return pcApp(rng, L, ctx);
    const to = inc ? from + dif : from - dif;
    const sc = rng.pick([{ n: "members in a club", u: "members" }, { n: "students in a school", u: "students" }, { n: "tickets sold", u: "tickets" }]);
    return finalize({
      family: "percent",
      level: L,
      spec: { kind: "app", app: "change", from, to },
      stem: T3(`The number of ${sc.n} went from ${from} to ${to}.`, `The number of ${sc.n} changed from ${from} to ${to}.`, `The number of ${sc.n} changed from ${from} to ${to}.`),
      ask: T3(`What is the percent ${inc ? "increase" : "decrease"}?`, `What is the percent ${inc ? "increase" : "decrease"}?`, `Find the percent ${inc ? "increase" : "decrease"}.`),
      expr: null,
      answer: { value: String(p), text: `${p}%`, kind: "int", unit: "percent" },
      work: [`Find the change: ${Math.max(from, to)} ${MINUS} ${Math.min(from, to)} = ${dif}`, `Compare the change with the original amount, ${from}: ${dif}/${from} = ${p}/100`, `The percent ${inc ? "increase" : "decrease"} is ${p}%`],
      distractors: distr(fr(p), { k: "int", sfx: "%" }, [[Math.round((dif / to) * 100), "divides-by-the-new-amount"], [dif, "gives-the-change-not-the-percent"], [Math.round((to / from) * 100), "gives-the-new-amount-as-a-percent-of-the-old"], [100 - p, "subtracts-from-100"], [p + 10, "slip"], [p * 2, "doubles"]]),
      hints: { conceptual: "A percent change compares the amount of change with the starting amount, not with the new amount.", procedural: "Find how much the amount changed. Divide that change by the original amount. Write the result as a percent." },
      structure: S(`A quantity changes`, [{ label: "original", value: from }, { label: "new", value: to }], "the percent change", "percent change = change / original", "bar model for the original amount", "The percent should be about the change over the original."),
    });
  }
  if (app === "interest") {
    const P = ri(rng, 4, 60) * 50;
    const t = ri(rng, 2, 5);
    const r = rng.pick([2, 3, 4, 5, 6, 8]);
    const I = fr(P * r * t, 100);
    const askI = rng.chance(0.6);
    const target = askI ? I : I.add(fr(P));
    return finalize({
      family: "percent",
      level: L,
      spec: { kind: "app", app: "interest", P, rate: r, t, ask: askI ? "interest" : "total" },
      stem: T3(`${who} puts $${num(P)} in a savings account. It earns simple interest of ${r}% each year. ${who} leaves it for ${t} years.`, `${who} puts $${num(P)} in a savings account that earns simple interest at ${r}% per year for ${t} years.`, `${who} deposits $${num(P)} in an account that earns simple interest at ${r}% per year, for ${t} years.`),
      ask: T3(askI ? "How much interest is earned?" : "How much money is in the account at the end?", askI ? "How much interest is earned in all?" : "What is the account balance after the interest is added?", askI ? "Find the total interest earned." : "Find the balance after the interest is added."),
      expr: null,
      answer: ans(target, { k: "money" }),
      work: [`Interest for 1 year: ${r}% of ${num(P)} = $${dStr(fr(P * r, 100), 2, false)}`, `Interest for ${t} years: ${t} ${TIMES} ${dStr(fr(P * r, 100), 2, false)} = $${dStr(I, 2, false)}`, ...(askI ? [] : [`Add the starting amount: ${num(P)} + ${dStr(I, 2, false)} = $${dStr(target, 2, false)}`])],
      distractors: distr(target, { k: "money" }, askI
        ? [[fr(P * r, 100), "finds-only-one-years-interest"], [fr(P * r * t), "forgets-to-divide-by-100"], [I.add(fr(P)), "adds-the-starting-amount"], [fr(P * r * t, 10), "divides-by-10-instead-of-100"], [fr(P * (r + t), 100), "adds-the-rate-and-the-years"]]
        : [[I, "gives-the-interest-not-the-balance"], [fr(P * r, 100).add(fr(P)), "adds-only-one-years-interest"], [fr(P * r * t).add(fr(P)), "forgets-to-divide-by-100"], [fr(P).sub(I), "subtracts-the-interest"], [I.mul(fr(2)), "doubles-the-interest"]]),
      hints: { conceptual: "Simple interest is the same amount every year. It is a percent of the starting amount, found once per year.", procedural: "Find one year's interest as a percent of the starting amount. Multiply by the number of years. Decide whether the question wants the interest or the balance." },
      structure: S(`${who} earns simple interest`, [{ label: "principal", value: `$${num(P)}` }, { label: "rate per year", value: `${r}%` }, { label: "years", value: t }], askI ? "the interest" : "the balance", "I = P × r × t (rate as a decimal)", "bar model repeated for each year", "The interest should be small compared with the principal."),
    });
  }
  // orig: find the original price after a percent off or a percent added on
  const off = rng.chance(0.6);
  const rr = rng.pick(off ? [10, 20, 25, 30, 40, 50] : [5, 10, 20, 25]);
  const orig = ri(rng, 4, 40) * 20;
  const finalP = off ? fr(orig * (100 - rr), 100) : fr(orig * (100 + rr), 100);
  if (decPlaces(finalP) > 2) return pcApp(rng, L, ctx);
  const fp = dStr(finalP, 2, false);
  return finalize({
    family: "percent",
    level: L,
    spec: { kind: "app", app: "orig", price: fp, rate: rr, dir: off ? "off" : "on" },
    stem: off
      ? T3(`A ${it.one} is on sale for $${fp}. That is ${rr}% off the regular price.`, `A ${it.one} is on sale for $${fp} after a ${rr}% discount.`, `After a ${rr}% discount, a ${it.one} costs $${fp}.`)
      : T3(`${who} pays $${fp} for a ${it.one}. This includes ${rr}% sales tax.`, `${who} pays $${fp} for a ${it.one}, which includes a ${rr}% sales tax.`, `${who} pays a total of $${fp} for a ${it.one}, including ${rr}% sales tax.`),
    ask: T3(off ? "What was the regular price?" : "What was the price before tax?", off ? "What was the regular price before the discount?" : "What was the price before tax was added?", off ? "Find the regular price before the discount." : "Find the price before the tax was added."),
    expr: null,
    answer: ans(fr(orig), { k: "money" }),
    work: [off ? `The sale price is ${100 - rr}% of the regular price` : `The total is ${100 + rr}% of the price before tax`, `${off ? 100 - rr : 100 + rr}% of the price is $${fp}, so 1% is $${fp} ${DIVIDE} ${off ? 100 - rr : 100 + rr} = $${dStr(fr(orig, 100), 2, false)}`, `100% is ${dStr(fr(orig, 100), 2, false)} ${TIMES} 100 = $${dStr(fr(orig), 2, false)}`],
    distractors: distr(fr(orig), { k: "money" }, [[off ? finalP.mul(fr(100 + rr, 100)) : finalP.mul(fr(100 - rr, 100)), `${off ? "adds" : "subtracts"}-the-percent-to-the-given-price`], [finalP.add(fr(rr)), "adds-the-percent-number"], [finalP.add(finalP.mul(fr(rr, 100))), "finds-the-percent-of-the-wrong-amount"], [finalP.sub(finalP.mul(fr(rr, 100))), "uses-the-wrong-direction"], [finalP.mul(fr(rr)), "forgets-to-divide-by-100"]]),
    hints: { conceptual: `The given price is ${off ? "what is left after the discount" : "the whole amount including tax"}. Its percent of the original is not the full amount.`, procedural: "Decide what percent of the original the given price is. Find one percent, then find the whole." },
    structure: S(`${who} works backwards from a final price`, [{ label: "final price", value: `$${fp}` }, { label: off ? "discount" : "tax", value: `${rr}%` }], off ? "the regular price" : "the price before tax", "final = percent of original, so original = final / percent", "bar model with 100% as the original", off ? "The regular price must be higher than the sale price." : "The price before tax must be lower than the total."),
  });
}

FAMILIES.percent = {
  title: "Percents",
  grades: [6, 7],
  defaults: { level: "basic" },
  gen(rng, P, { level = 1, ctx = "store" } = {}) {
    if (P.level === "apps") return pcApp(rng, level, ctx);
    return rng.pick(level === 1 ? [pcPart, pcWhole, pcPercent] : [pcPart, pcPart, pcWhole, pcPercent])(rng, level, ctx);
  },
  check(p, params) {
    const P = { level: "basic", ...params };
    if (P.level === "apps" && p.spec.kind !== "app") return "level apps produced a non-application problem";
    if (P.level !== "apps" && p.spec.kind === "app") return "level basic produced an application problem";
    return null;
  },
};

// ================================================================================================ integers (g6.rational, g7.rationalops)
// Negative answers are allowed here. Negatives are written with the real minus sign. In `work`, a negative operand is always put in
// parentheses so that an "a op b = c" line is never read as having a positive left operand.
const sgnN = (n) => num(n);
const pn = (f, st) => {
  const t = fmt(f, st);
  return f.n < 0 ? `(${t})` : t;
};
const absF = (f) => (f.n < 0 ? new Fr(-f.n, f.d) : f);
const negF = (f) => new Fr(-f.n, f.d);
const SCEN = [
  { pos: (m) => `A hiker is ${m} meters above sea level.`, neg: (m) => `A diver is ${m} meters below sea level.`, what: "position" },
  { pos: (m) => `The temperature is ${m} degrees above zero.`, neg: (m) => `The temperature is ${m} degrees below zero.`, what: "temperature" },
  { pos: (m) => `Mia has ${m} dollars in her account.`, neg: (m) => `Mia owes ${m} dollars.`, what: "money" },
  { pos: (m) => `A football team gains ${m} yards on a play.`, neg: (m) => `A football team loses ${m} yards on a play.`, what: "yardage" },
  { pos: (m) => `An elevator is ${m} floors above the lobby.`, neg: (m) => `An elevator is ${m} floors below the lobby.`, what: "floor" },
];
function inCtx(rng, L) {
  const sc = rng.pick(SCEN);
  const m = ri(rng, 2, L === 1 ? 12 : L === 2 ? 40 : 250);
  const neg = rng.chance(0.55);
  const v = neg ? -m : m;
  const s = (neg ? sc.neg : sc.pos)(m);
  return finalize({
    family: "integers",
    level: L,
    spec: { kind: "ctx", mag: m, dir: neg ? "down" : "up" },
    stem: T3(s, s, `Consider this situation. ${s}`),
    ask: T3("Which integer shows this situation?", "Which integer represents this situation?", "Which integer best represents this situation, with zero as the starting point?"),
    expr: null,
    answer: { value: String(v), text: sgnN(v), kind: "int" },
    work: [`Decide what zero means here`, `${neg ? "Below zero, owing, or losing" : "Above zero, having, or gaining"} is ${neg ? "negative" : "positive"}`, `The size of the amount is ${m}`],
    visual: null,
    distractors: distr(fr(v), { k: "int" }, [[-v, "uses-the-wrong-sign"], [0, "uses-zero-for-a-real-amount"], [v + 1, "off-by-one"], [v - 1, "off-by-one"], [v * 10, "place-value-slip"]], { pos: false }),
    hints: { conceptual: "Zero is the starting point. Opposite directions or opposite meanings get opposite signs.", procedural: "Decide which direction or meaning is positive. Then write the size of the amount with the right sign." },
  });
}
function inOpp(rng, L) {
  const m = ri(rng, 1, L === 1 ? 9 : L === 2 ? 25 : 120);
  const n = rng.chance(0.5) ? m : -m;
  const times = L === 3 && rng.chance(0.6) ? 2 : 1;
  const val = times === 2 ? n : -n;
  const expr = times === 2 ? `the opposite of the opposite of ${sgnN(n)}` : `the opposite of ${sgnN(n)}`;
  return finalize({
    family: "integers",
    level: L,
    spec: { kind: "opp", n, times },
    stem: T3("", "", ""),
    ask: T3(`What is ${expr}?`, `What is ${expr}?`, `Find ${expr}.`),
    expr: null,
    answer: { value: String(val), text: sgnN(val), kind: "int" },
    work: [`Opposites are the same distance from zero on opposite sides`, times === 2 ? `The opposite of ${sgnN(n)} is ${sgnN(-n)}, and its opposite is ${sgnN(n)}` : `The opposite of ${sgnN(n)} is ${sgnN(-n)}`],
    visual: m <= 12 ? { kind: "numberline", alt: `A number line with ${sgnN(n)} marked.`, min: -Math.max(m, 3) - 1, max: Math.max(m, 3) + 1, ticks: 2 * (Math.max(m, 3) + 1), marks: [{ at: n, label: "A" }], show: "int" } : null,
    distractors: distr(fr(val), { k: "int" }, [[times === 2 ? -n : n, times === 2 ? "stops-after-one-flip" : "gives-the-number-itself"], [val + 1, "off-by-one"], [val - 1, "off-by-one"], [0, "gives-zero"], [val * 2, "doubles"]], { pos: false }),
    hints: { conceptual: "Zero is the middle. A number and its opposite are the same distance from it, one on each side.", procedural: "Picture the number on a number line. Cross to the other side of zero by the same distance." },
  });
}
function inAbs(rng, L) {
  const m = ri(rng, 1, L === 1 ? 12 : L === 2 ? 60 : 300);
  const n = rng.chance(0.65) ? -m : m;
  return finalize({
    family: "integers",
    level: L,
    spec: { kind: "abs", n },
    stem: T3("", "", ""),
    ask: T3(`What is |${sgnN(n)}|?`, `What is the absolute value of ${sgnN(n)}?`, `Find the absolute value of ${sgnN(n)}, which is its distance from zero.`),
    expr: null,
    answer: { value: String(m), text: num(m), kind: "int" },
    work: [`Absolute value is the distance from zero`, `${sgnN(n)} is ${m} units from zero`],
    visual: null,
    distractors: distr(fr(m), { k: "int" }, [[-m, "keeps-or-gives-a-negative-answer"], [n === m ? -m : n, "keeps-the-sign"], [0, "gives-zero"], [m + 1, "off-by-one"], [m * 2, "doubles"]], { pos: false }),
    hints: { conceptual: "Distance cannot be negative. Absolute value tells how far a number is from zero.", procedural: "Count the units from the number to zero on a number line. Ignore which side of zero it is on." },
  });
}
function inFarther(rng, L) {
  let a;
  let b;
  do {
    a = ri(rng, 1, L === 1 ? 9 : 40) * (rng.chance(0.5) ? -1 : 1);
    b = ri(rng, 1, L === 1 ? 9 : 40) * (a < 0 ? 1 : -1);
  } while (Math.abs(a) === Math.abs(b));
  const val = Math.abs(a) > Math.abs(b) ? a : b;
  const other = val === a ? b : a;
  return finalize({
    family: "integers",
    level: L,
    spec: { kind: "farther", a, b },
    stem: T3("", "", ""),
    ask: T3(`Which number is farther from zero: ${sgnN(a)} or ${sgnN(b)}?`, `Which number is farther from zero on the number line: ${sgnN(a)} or ${sgnN(b)}?`, `Which of ${sgnN(a)} and ${sgnN(b)} has the greater absolute value?`),
    expr: null,
    answer: { value: String(val), text: sgnN(val), kind: "int" },
    work: [`Compare the distances from zero: |${sgnN(a)}| is ${Math.abs(a)} and |${sgnN(b)}| is ${Math.abs(b)}`, `${Math.max(Math.abs(a), Math.abs(b))} is greater than ${Math.min(Math.abs(a), Math.abs(b))}, so ${sgnN(val)} is farther from zero`],
    visual: null,
    distractors: distr(fr(val), { k: "int" }, [[other, "picks-the-greater-number-instead-of-the-farther-one"], [-val, "picks-the-opposite-of-the-answer"], [-other, "picks-the-opposite-of-the-other-number"], [val + (val > 0 ? 1 : -1), "off-by-one"], [0, "gives-zero"]], { pos: false }),
    hints: { conceptual: "Farther from zero means a greater absolute value. The sign tells the side, not the distance.", procedural: "Find each number's distance from zero. Then choose the number with the larger distance." },
  });
}
function inExtreme(rng, L) {
  const vals = rng.sample(Array.from({ length: L === 1 ? 19 : 41 }, (_, i) => i - (L === 1 ? 9 : 20)), 5);
  const which = rng.pick(["least", "greatest"]);
  const sorted = vals.slice().sort((x, y) => x - y);
  const val = which === "least" ? sorted[0] : sorted[sorted.length - 1];
  const minAbs = vals.slice().sort((x, y) => Math.abs(x) - Math.abs(y))[0];
  const list = vals.map(sgnN).join(", ");
  return finalize({
    family: "integers",
    level: L,
    spec: { kind: "extreme", values: vals, which },
    stem: T3(`Look at these numbers: ${list}.`, `Look at these numbers: ${list}.`, `Consider these numbers: ${list}.`),
    ask: T3(`Which number is the ${which}?`, `Which number is the ${which}?`, `Which number is the ${which}, using their positions on a number line?`),
    expr: null,
    answer: { value: String(val), text: sgnN(val), kind: "int" },
    work: [`On a number line, numbers farther to the ${which === "least" ? "left" : "right"} are ${which === "least" ? "less" : "greater"}`, `Order the numbers from least to greatest: ${sorted.map(sgnN).join(", ")}`, `The ${which} is ${sgnN(val)}`],
    visual: { kind: "numberline", alt: `A number line with the numbers ${list} marked.`, min: (L === 1 ? -10 : -21), max: (L === 1 ? 10 : 21), ticks: L === 1 ? 20 : 21, marks: vals.map((v) => ({ at: v, label: sgnN(v) })), show: "int" },
    distractors: distr(fr(val), { k: "int" }, [
      [which === "least" ? sorted.filter((x) => x < 0).slice(-1)[0] ?? minAbs : sorted.filter((x) => x < 0)[0] ?? minAbs, which === "least" ? "thinks-the-negative-closest-to-zero-is-least" : "thinks-a-negative-number-with-a-large-size-is-greatest"],
      [which === "least" ? sorted[sorted.length - 1] : sorted[0], "picks-the-opposite-extreme"],
      [minAbs, "picks-the-number-closest-to-zero"],
      ...vals.filter((x) => x !== val).map((x) => [x, "picks-another-number-from-the-list"]),
    ], { pos: false }),
    hints: { conceptual: "On a number line, numbers to the right are greater. A negative number with a big size is far to the left, so it is small.", procedural: "Put the numbers in order along a number line. Then read off the one at the end you need." },
  });
}
function inRead(rng, L) {
  const m = L === 1 ? 8 : 10;
  let v;
  do v = ri(rng, -m + 1, m - 1);
  while (v === 0);
  return finalize({
    family: "integers",
    level: L,
    spec: { kind: "read", value: v },
    stem: T3("A number line has a point P.", "A number line has a point labeled P.", "A number line shows a point labeled P."),
    ask: T3("What number is at point P?", "What number is marked by point P?", "What number does point P represent?"),
    expr: null,
    answer: { value: String(v), text: sgnN(v), kind: "int" },
    work: [`Find zero on the number line`, `Count the steps to point P, to the ${v < 0 ? "left" : "right"} of zero`, `Left of zero means negative, right of zero means positive`],
    visual: { kind: "numberline", alt: `A number line from ${-m} to ${m} with one point labeled P.`, min: -m, max: m, ticks: 2 * m, marks: [{ at: v, label: "P" }], show: "int" },
    distractors: distr(fr(v), { k: "int" }, [[-v, "reads-the-wrong-side-of-zero"], [v + 1, "counts-one-too-far-right"], [v - 1, "counts-one-too-far-left"], [0, "reads-zero-for-a-point-not-at-zero"], [v * 2, "doubles"]], { pos: false }),
    hints: { conceptual: "Numbers to the left of zero are negative and numbers to the right are positive.", procedural: "Start at zero. Count the tick marks to the point, and decide whether you moved left or right." },
  });
}
const QN = (x, y) => (x > 0 && y > 0 ? "Quadrant I" : x < 0 && y > 0 ? "Quadrant II" : x < 0 && y < 0 ? "Quadrant III" : "Quadrant IV");
function nz(rng, m) {
  const v = ri(rng, 1, m);
  return rng.chance(0.5) ? v : -v;
}
function inQuad(rng, L) {
  const m = L === 1 ? 6 : 8;
  const x = nz(rng, m);
  const y = nz(rng, m);
  const text = QN(x, y);
  const cands = [[QN(y, x), "swaps-the-coordinates"], [QN(-x, y), "ignores-the-sign-of-x"], [QN(x, -y), "ignores-the-sign-of-y"], [QN(-x, -y), "uses-the-opposite-signs"]];
  const ds = tdistr(text, [...cands, ...["Quadrant I", "Quadrant II", "Quadrant III", "Quadrant IV"].map((q) => [q, "mixes-up-the-quadrant-numbers"])]);
  return finalize({
    family: "integers",
    level: L,
    spec: { kind: "quad", x, y },
    stem: T3(`A point is at (${sgnN(x)}, ${sgnN(y)}).`, `A point is at (${sgnN(x)}, ${sgnN(y)}) on a coordinate plane.`, `A point is located at (${sgnN(x)}, ${sgnN(y)}) on a coordinate plane.`),
    ask: T3("Which quadrant is the point in?", "In which quadrant is the point?", "In which quadrant does the point lie?"),
    expr: null,
    answer: { value: text, text, kind: "text" },
    work: [`The x-coordinate ${sgnN(x)} is ${x < 0 ? "negative, so the point is left of the y-axis" : "positive, so the point is right of the y-axis"}`, `The y-coordinate ${sgnN(y)} is ${y < 0 ? "negative, so the point is below the x-axis" : "positive, so the point is above the x-axis"}`, `That region is ${text}. The quadrants are numbered counterclockwise from the upper right`],
    visual: { kind: "coord", alt: `A coordinate plane with one point plotted.`, xmin: -m, xmax: m, ymin: -m, ymax: m, step: 1, points: [{ x, y, label: "P" }], labelAxes: ["x", "y"] },
    distractors: ds,
    hints: { conceptual: "The signs of the two coordinates tell which side of each axis the point is on. The quadrants are numbered counterclockwise, starting at the upper right.", procedural: "Decide left or right from the first number, then up or down from the second number." },
  });
}
function inReflect(rng, L) {
  const m = L === 1 ? 6 : 8;
  const x = nz(rng, m);
  const y = nz(rng, m);
  const axis = rng.pick(["x", "y"]);
  const [rx, ry] = axis === "x" ? [x, -y] : [-x, y];
  const text = `(${sgnN(rx)}, ${sgnN(ry)})`;
  const ds = tdistr(text, [
    [axis === "x" ? `(${sgnN(-x)}, ${sgnN(y)})` : `(${sgnN(x)}, ${sgnN(-y)})`, "changes-the-sign-of-the-wrong-coordinate"],
    [`(${sgnN(-x)}, ${sgnN(-y)})`, "changes-both-signs"],
    [`(${sgnN(y)}, ${sgnN(x)})`, "swaps-the-coordinates"],
    [`(${sgnN(x)}, ${sgnN(y)})`, "leaves-the-point-where-it-is"],
  ]);
  return finalize({
    family: "integers",
    level: L,
    spec: { kind: "reflect", x, y, axis },
    stem: T3(`Point A is at (${sgnN(x)}, ${sgnN(y)}). It is reflected across the ${axis}-axis.`, `Point A is at (${sgnN(x)}, ${sgnN(y)}). It is reflected across the ${axis}-axis.`, `Point A is located at (${sgnN(x)}, ${sgnN(y)}) and is reflected across the ${axis}-axis.`),
    ask: T3("What are the new coordinates?", "What are the coordinates of the reflected point?", "State the coordinates of the image of point A."),
    expr: null,
    answer: { value: `(${rx},${ry})`, text, kind: "pair" },
    work: [`A reflection across the ${axis}-axis keeps the point the same distance from that axis, on the other side`, `The ${axis === "x" ? "y" : "x"}-coordinate changes to its opposite; the ${axis}-coordinate stays`, `The image is ${text}`],
    visual: { kind: "coord", alt: "A coordinate plane with point A plotted.", xmin: -m, xmax: m, ymin: -m, ymax: m, step: 1, points: [{ x, y, label: "A" }], labelAxes: ["x", "y"] },
    distractors: ds,
    hints: { conceptual: "A reflection across an axis flips the point to the other side of that axis. The point stays the same distance away.", procedural: "Decide which coordinate measures the distance from the axis you reflect across. Only that coordinate changes sign." },
  });
}
function inDist(rng, L) {
  const m = L === 1 ? 6 : 9;
  const horizontal = rng.chance(0.5);
  const a = ri(rng, 1, m);
  const b = -ri(rng, 1, m);
  const c = nz(rng, m);
  const [p, q] = rng.chance(0.5) ? [a, b] : [b, a];
  const A = horizontal ? { x: p, y: c } : { x: c, y: p };
  const B = horizontal ? { x: q, y: c } : { x: c, y: q };
  const d = a - b;
  return finalize({
    family: "integers",
    level: L,
    spec: { kind: "dist", p: [A.x, A.y], q: [B.x, B.y] },
    stem: T3(`Point A is at (${sgnN(A.x)}, ${sgnN(A.y)}). Point B is at (${sgnN(B.x)}, ${sgnN(B.y)}).`, `Point A is at (${sgnN(A.x)}, ${sgnN(A.y)}) and point B is at (${sgnN(B.x)}, ${sgnN(B.y)}).`, `Point A is at (${sgnN(A.x)}, ${sgnN(A.y)}), and point B is at (${sgnN(B.x)}, ${sgnN(B.y)}).`),
    ask: T3("How many units apart are A and B?", "How many units apart are the two points?", "What is the distance between the two points, in units?"),
    expr: null,
    answer: { value: String(d), text: String(d), kind: "int", unit: "units" },
    work: [`The points are on the same ${horizontal ? "horizontal" : "vertical"} line`, `They are on opposite sides of the ${horizontal ? "y" : "x"}-axis, so add their distances from the axis: ${a} + ${-b} = ${d}`],
    visual: { kind: "coord", alt: "A coordinate plane with points A and B on the same line.", xmin: -m, xmax: m, ymin: -m, ymax: m, step: 1, points: [{ ...A, label: "A" }, { ...B, label: "B" }], labelAxes: ["x", "y"] },
    distractors: distr(fr(d), { k: "int" }, [[Math.abs(a - -b), "subtracts-the-sizes-of-the-coordinates"], [d - 1, "misses-one-unit"], [d + 1, "counts-both-end-points"], [a, "uses-only-the-positive-coordinate"], [-b, "uses-only-the-negative-coordinate"], ...slips(d)]),
    hints: { conceptual: "When two points are on opposite sides of an axis, the distance between them goes across that axis.", procedural: "Find how far each point is from the axis. Then put those distances together." },
  });
}

// ---- operations with rational numbers
const placesOf = (f) => Math.max(1, decPlaces(f));
function opLines(op, a, b, res, st) {
  const A = absF(a);
  const B = absF(b);
  const t = (f) => fmt(f, st);
  const same = a.n < 0 === b.n < 0;
  if (op === "+") {
    if (same) return [`The numbers have the same sign, so add their sizes: ${t(A)} + ${t(B)} = ${t(A.add(B))}`, `Keep the sign they share`];
    const big = A.cmp(B) >= 0 ? A : B;
    const small = A.cmp(B) >= 0 ? B : A;
    return [`The numbers have different signs, so subtract the smaller size from the larger: ${t(big)} ${MINUS} ${t(small)} = ${t(big.sub(small))}`, `The answer has the sign of the number that is farther from zero`];
  }
  if (op === MINUS) {
    const nb = negF(b);
    const l = [`Subtracting a number is the same as adding its opposite: ${t(a)} ${MINUS} ${pn(b, st)} becomes ${t(a)} + ${pn(nb, st)}`];
    const ns = a.n < 0 === nb.n < 0;
    const big = A.cmp(absF(nb)) >= 0 ? A : absF(nb);
    const small = A.cmp(absF(nb)) >= 0 ? absF(nb) : A;
    l.push(ns ? `Same signs: add the sizes, ${t(A)} + ${t(absF(nb))} = ${t(A.add(absF(nb)))}, and keep the sign` : `Different signs: subtract the sizes, ${t(big)} ${MINUS} ${t(small)} = ${t(big.sub(small))}, and keep the sign of the number farther from zero`);
    return l;
  }
  if (op === TIMES) return [`Multiply the sizes: ${t(A)} ${TIMES} ${t(B)} = ${t(A.mul(B))}`, same ? `The signs are the same, so the product is positive` : `The signs are different, so the product is negative`];
  return [`Divide the sizes: ${t(A)} ${DIVIDE} ${t(B)} = ${t(A.div(B))}`, same ? `The signs are the same, so the quotient is positive` : `The signs are different, so the quotient is negative`];
}
function opHops(op, a, res) {
  const lo = Math.min(a, res);
  const hi = Math.max(a, res);
  const min = Math.floor(lo) - 2;
  const max = Math.ceil(hi) + 2;
  if (max - min > 26) return null;
  const net = res - a;
  return { kind: "numberline", alt: `A number line showing a move from ${sgnN(a)} by ${net >= 0 ? "adding" : "subtracting"} ${Math.abs(net)}.`, min, max, ticks: max - min, marks: [{ at: a, label: "start" }], hops: [{ from: a, to: res, label: net >= 0 ? `+${net}` : `${MINUS}${-net}` }], show: "int" };
}
const OPCTX = [
  { up: (a, b, who) => `The temperature is ${sgnN(a)} degrees. It rises ${b} degrees.`, down: (a, b) => `The temperature is ${sgnN(a)} degrees. It drops ${b} degrees.`, ask: "What is the new temperature, in degrees?" },
  { up: (a, b) => `A hiker's elevation is ${sgnN(a)} meters. The hiker climbs ${b} meters.`, down: (a, b) => `A hiker's elevation is ${sgnN(a)} meters. The hiker descends ${b} meters.`, ask: "What is the hiker's new elevation, in meters?" },
  { up: (a, b, who) => `${who}'s account balance is ${sgnN(a)} dollars. ${who} deposits ${b} dollars.`, down: (a, b, who) => `${who}'s account balance is ${sgnN(a)} dollars. ${who} spends ${b} dollars.`, ask: "What is the new balance, in dollars?" },
];
function inOp(rng, L, ctx) {
  const mode = L === 1 ? "int" : L === 2 ? rng.pick(["int", "int", "dec"]) : rng.pick(["dec", "frac", "frac", "int"]);
  const op = L === 1 ? rng.pick(["+", MINUS, "+", MINUS]) : mode === "int" && L === 2 ? rng.pick(["+", MINUS, TIMES, DIVIDE]) : rng.pick(["+", MINUS, TIMES, DIVIDE]);
  let a;
  let b;
  const m = L === 1 ? 9 : 12;
  let st;
  let ctxText = null;
  const who = rng.pick(NAMES);
  if (mode === "int") {
    st = { k: "int" };
    if ((op === "+" || op === MINUS) && rng.chance(0.4)) {
      const c = rng.pick(OPCTX);
      a = rng.chance(0.7) ? -ri(rng, 1, m) : ri(rng, 1, m);
      b = ri(rng, 2, m);
      const up = op === "+";
      ctxText = { stem: (up ? c.up : c.down)(a, b, who), ask: c.ask };
      a = fr(a);
      b = fr(b);
    } else if (op === DIVIDE) {
      const bb = nz(rng, 9);
      const q = nz(rng, 9);
      a = fr(bb * q);
      b = fr(bb);
    } else {
      a = fr(nz(rng, m));
      b = fr(nz(rng, op === TIMES ? 9 : m));
    }
  } else if (mode === "dec") {
    const frac10 = (m) => {
      let n;
      do n = nz(rng, m);
      while (Math.abs(n) % 10 === 0);
      return fr(n, 10);
    };
    if (op === DIVIDE) {
      const bb = frac10(12);
      const q = frac10(12);
      a = q.mul(bb);
      b = bb;
    } else {
      a = frac10(99);
      b = op === TIMES ? frac10(12) : frac10(99);
    }
    const res0 = ap(op, a, b);
    st = { k: "dec", p: Math.max(placesOf(a), placesOf(b), placesOf(res0)) };
  } else {
    const dens = [2, 3, 4, 5, 6, 8];
    const mk = () => {
      const d = rng.pick(dens);
      return fr(nz(rng, d + (L === 3 ? 3 : -1)), d);
    };
    a = mk();
    b = mk();
    if (a.n === 0 || b.n === 0) return inOp(rng, L, ctx);
    st = { k: "frac" };
  }
  const res = ap(op, a, b);
  if (mode === "dec" && (decPlaces(res) < 0 || decPlaces(res) > 3)) return inOp(rng, L, ctx);
  if (Math.abs(res.n / res.d) > 400) return inOp(rng, L, ctx);
  if (mode === "dec") st = { k: "dec", p: Math.max(placesOf(a), placesOf(b), placesOf(res)) };
  const A = fmt(a, st);
  const Bn = fmt(b, st);
  const Bshow = b.n < 0 ? `(${Bn})` : Bn;
  const E = `${A} ${op} ${Bshow}`;
  const wrong = [];
  if (op === "+") wrong.push([a.sub(b), "subtracts-instead-of-adding"], [absF(a).add(absF(b)), "adds-the-sizes-and-ignores-the-signs"], [negF(res), "uses-the-wrong-sign"], [absF(absF(a).sub(absF(b))), "subtracts-the-sizes-and-ignores-the-signs"]);
  else if (op === MINUS) wrong.push([a.add(b), "adds-instead-of-subtracting"], [b.sub(a), "reverses-the-subtraction"], [a.sub(absF(b)), "ignores-the-sign-of-the-number-subtracted"], [negF(res), "uses-the-wrong-sign"]);
  else if (op === TIMES) wrong.push([negF(res), "uses-the-wrong-sign"], [a.add(b), "adds-instead-of-multiplying"], [a.sub(b), "subtracts-instead-of-multiplying"], [absF(a).mul(absF(b)).mul(fr(1)), "ignores-the-signs"]);
  else wrong.push([negF(res), "uses-the-wrong-sign"], [b.div(a), "divides-in-the-wrong-order"], [a.mul(b), "multiplies-instead-of-dividing"], [a.sub(b), "subtracts-instead-of-dividing"]);
  if (mode === "frac" && (op === "+" || op === MINUS) && a.d !== b.d) wrong.push([fr(a.n + (op === "+" ? b.n : -b.n), a.d + b.d), "adds-numerators-and-denominators"]);
  if (mode === "frac" && (op === TIMES || op === DIVIDE)) wrong.push([op === TIMES ? fr(a.n * b.d, a.d * b.n) : fr(a.n * b.n, a.d * b.d), op === TIMES ? "divides-instead-of-multiplying" : "multiplies-straight-across-instead-of-dividing"]);
  if (mode === "dec") wrong.push([res.mul(fr(10)), "decimal-point-slip"], [res.div(fr(10)), "decimal-point-slip"]);
  if (mode === "int") wrong.push([res.add(fr(res.n < 0 ? 1 : -1)), "off-by-one"], [res.mul(fr(2)), "doubles-the-result"]);
  const hops = mode === "int" && (op === "+" || op === MINUS) ? opHops(op, a.n, res.n) : null;
  return finalize({
    family: "integers",
    level: L,
    spec: { kind: "op", op, a: `${a.n}/${a.d}`, b: `${b.n}/${b.d}` },
    stem: ctxText ? T3(ctxText.stem, ctxText.stem, ctxText.stem) : T3("", "", ""),
    ask: ctxText ? T3(ctxText.ask, ctxText.ask, ctxText.ask) : T3(`What is ${E}?`, `Find ${E}.`, `Evaluate ${E}, and use a number line or sign rules to justify the sign.`),
    expr: E,
    answer: ans(res, st),
    work: opLines(op, a, b, res, st),
    visual: hops,
    distractors: distr(res, st, wrong, { pos: false }),
    hints: { conceptual: op === TIMES || op === DIVIDE ? "The size of the answer comes from the sizes of the numbers. The sign comes from whether the signs match." : "Think of moving on a number line. Adding moves one way and subtracting moves the other way, starting from the first number.", procedural: op === TIMES || op === DIVIDE ? "Work with the sizes first. Then decide the sign by comparing the signs of the two numbers." : "Rewrite subtraction as adding the opposite. Then use the sign of the number that is farther from zero." },
  });
}

FAMILIES.integers = {
  title: "Rational numbers",
  grades: [6, 7],
  defaults: { ops: false },
  gen(rng, P, { level = 1, ctx = "store" } = {}) {
    if (P.ops) return inOp(rng, level, ctx);
    const pool = level === 1 ? [inCtx, inOpp, inAbs, inFarther, inExtreme, inRead, inQuad] : [inCtx, inOpp, inAbs, inFarther, inExtreme, inRead, inQuad, inReflect, inDist];
    return rng.pick(pool)(rng, level, ctx);
  },
  check(p, params) {
    const P = { ops: false, ...params };
    if (P.ops && p.spec.kind !== "op") return "ops mode produced a non-operation problem";
    if (!P.ops && p.spec.kind === "op") return "basic mode produced an operation problem";
    return null;
  },
};

// ================================================================================================ algexpr (g6.expressions)
const VARS = ["x", "n", "a", "t", "m", "p"];
const SUP = { 2: "²", 3: "³" };
/** Canonical text of a x + b: the solver builds the same string. */
const linT = (a, b, v) => {
  const body = a === 1 ? v : `${a}${v}`;
  if (a === 0) return b < 0 ? `${MINUS}${-b}` : String(b);
  if (b === 0) return body;
  return `${body} ${b < 0 ? MINUS : "+"} ${Math.abs(b)}`;
};
const termBody = (c, v) => (v ? (Math.abs(c) === 1 ? v : `${Math.abs(c)}${v}`) : String(Math.abs(c)));
const exprTerms = (terms) => terms.map((t, i) => (i === 0 ? (t.c < 0 ? MINUS : "") : ` ${t.c < 0 ? MINUS : "+"} `) + termBody(t.c, t.v)).join("");

function algEval(rng, L) {
  const v = rng.pick(VARS);
  const kinds = L === 1 ? ["lin", "linm", "div"] : L === 2 ? ["sq", "sqc", "sumsq", "cube"] : ["two", "div2", "sqc", "sumsq"];
  const kind = rng.pick(kinds);
  let disp;
  let spec;
  let tree;
  let vars;
  let wrong;
  let askVars;
  if (kind === "lin") {
    const a = ri(rng, 2, 9);
    const x = ri(rng, 2, 9);
    const b = ri(rng, 1, 20);
    disp = `${a}${v} + ${b}`;
    spec = `${a} × ${v} + ${b}`;
    tree = B_("+", B_(TIMES, N_(a), N_(x)), N_(b));
    vars = { [v]: x };
    wrong = [[a + x + b, "adds-the-coefficient-instead-of-multiplying"], [Number(`${a}${x}`) + b, "reads-the-coefficient-and-variable-as-digits"], [a * x - b, "subtracts-the-constant"]];
  } else if (kind === "linm") {
    const a = ri(rng, 2, 9);
    const x = ri(rng, 3, 12);
    const b = ri(rng, 1, a * x - 1);
    disp = `${a}${v} ${MINUS} ${b}`;
    spec = `${a} × ${v} ${MINUS} ${b}`;
    tree = B_(MINUS, B_(TIMES, N_(a), N_(x)), N_(b));
    vars = { [v]: x };
    wrong = [[a * x + b, "adds-the-constant-instead-of-subtracting"], [Number(`${a}${x}`) - b, "reads-the-coefficient-and-variable-as-digits"], [a + x - b, "adds-the-coefficient-instead-of-multiplying"]];
  } else if (kind === "div") {
    const c = ri(rng, 2, 9);
    const x = c * ri(rng, 2, 9);
    const b = ri(rng, 2, 20);
    disp = `${b} + ${v} ${DIVIDE} ${c}`;
    spec = `${b} + ${v} ${DIVIDE} ${c}`;
    tree = B_("+", N_(b), B_(DIVIDE, N_(x), N_(c)));
    vars = { [v]: x };
    wrong = [[(b + x) / c, "adds-before-dividing"], [b + c / x, "divides-in-the-wrong-order"], [b + x * c, "multiplies-instead-of-dividing"]];
  } else if (kind === "sq") {
    const x = ri(rng, 2, 9);
    const b = ri(rng, 1, 20);
    disp = `${v}² + ${b}`;
    spec = `${v}² + ${b}`;
    tree = B_("+", B_("^", N_(x), N_(2)), N_(b));
    vars = { [v]: x };
    wrong = [[2 * x + b, "multiplies-by-the-exponent"], [Number(`${x}2`) + b, "reads-the-exponent-as-a-digit"], [x + 2 + b, "adds-the-exponent"]];
  } else if (kind === "sqc") {
    const a = ri(rng, 2, 6);
    const x = ri(rng, 2, 7);
    const b = ri(rng, 1, a * x * x - 1);
    disp = `${a}${v}² ${MINUS} ${b}`;
    spec = `${a} × ${v}² ${MINUS} ${b}`;
    tree = B_(MINUS, B_(TIMES, N_(a), B_("^", N_(x), N_(2))), N_(b));
    vars = { [v]: x };
    wrong = [[(a * x) ** 2 - b, "squares-the-coefficient-too"], [a * 2 * x - b, "multiplies-by-the-exponent"], [a * x * x + b, "adds-the-constant-instead-of-subtracting"]];
  } else if (kind === "sumsq") {
    const a = ri(rng, 1, 6);
    const x = ri(rng, 2, 8);
    disp = `(${v} + ${a})²`;
    spec = `(${v} + ${a})²`;
    tree = B_("^", B_("+", N_(x), N_(a)), N_(2));
    vars = { [v]: x };
    wrong = [[x * x + a * a, "squares-each-term-separately"], [x * x + a, "squares-only-the-variable"], [2 * (x + a), "multiplies-by-the-exponent"]];
  } else if (kind === "cube") {
    const c = ri(rng, 2, 5);
    const a = ri(rng, 2, 9);
    const x = ri(rng, 2, 9);
    disp = `${c}³ + ${a}${v}`;
    spec = `${c}³ + ${a} × ${v}`;
    tree = B_("+", B_("^", N_(c), N_(3)), B_(TIMES, N_(a), N_(x)));
    vars = { [v]: x };
    wrong = [[3 * c + a * x, "multiplies-by-the-exponent"], [Number(`${c}3`) + a * x, "reads-the-exponent-as-a-digit"], [c + 3 + a * x, "adds-the-exponent"]];
  } else if (kind === "two") {
    const w = rng.pick(VARS.filter((q) => q !== v));
    const a = ri(rng, 2, 6);
    const b = ri(rng, 2, 9);
    const x = ri(rng, 2, 6);
    const y = ri(rng, 2, 9);
    disp = `${a}${v}² + ${b}${w}`;
    spec = `${a} × ${v}² + ${b} × ${w}`;
    tree = B_("+", B_(TIMES, N_(a), B_("^", N_(x), N_(2))), B_(TIMES, N_(b), N_(y)));
    vars = { [v]: x, [w]: y };
    askVars = [[v, x], [w, y]];
    wrong = [[a * x + b * y, "ignores-the-exponent"], [a * 2 * x + b * y, "multiplies-by-the-exponent"], [(a * x) ** 2 + b * y, "squares-the-coefficient-too"]];
  } else {
    const c = ri(rng, 2, 6);
    const a = ri(rng, 2, 7);
    const x = ri(rng, 2, 9);
    const q = ri(rng, 3, 9);
    const b = c * q - a * x > 0 ? c * q - a * x : c * (q + a * x) - a * x;
    disp = `(${a}${v} + ${b}) ${DIVIDE} ${c}`;
    spec = `(${a} × ${v} + ${b}) ${DIVIDE} ${c}`;
    tree = B_(DIVIDE, B_("+", B_(TIMES, N_(a), N_(x)), N_(b), true), N_(c));
    vars = { [v]: x };
    wrong = [[a * x + b / c, "ignores-the-grouping-symbols"], [(a * x) / c + b, "divides-only-the-first-term"], [a + x + b / c, "adds-the-coefficient-instead-of-multiplying"]];
  }
  if (!askVars) askVars = Object.entries(vars);
  const val = evT(tree);
  const lines = [`Replace ${askVars.length > 1 ? "each letter with its value" : `${askVars[0][0]} with ${askVars[0][1]}`}`];
  const rec = (t) => {
    if (!t.op) return t.n;
    const a = rec(t.l);
    const b = rec(t.r);
    if (t.op === "^") {
      const r = a ** b;
      lines.push(`Evaluate the power: ${num(a)}${SUP[b]} = ${num(r)}`);
      return r;
    }
    const r = evT({ op: t.op, l: N_(a), r: N_(b) });
    lines.push(`${t.g ? `Inside the grouping symbols, ${OPNAME[t.op]}` : cap(OPNAME[t.op])}: ${num(a)} ${t.op} ${num(b)} = ${num(r)}`);
    return r;
  };
  rec(tree);
  const when = askVars.map(([n, x]) => `${n} = ${x}`).join(" and ");
  return finalize({
    family: "algexpr",
    level: L,
    spec: { kind: "eval", expr: spec, vars },
    stem: T3("", "", ""),
    ask: T3(`What is ${disp} when ${when}?`, `Evaluate ${disp} when ${when}.`, `Evaluate the expression ${disp} for ${when}.`),
    expr: disp,
    answer: { value: String(val), text: num(val), kind: "int" },
    work: lines,
    visual: null,
    distractors: distr(fr(val), { k: "int" }, [...wrong, ...slips(val)]),
    hints: { conceptual: "A letter stands for a number. Replace it with the number you are given, then follow the order of operations.", procedural: "Write the expression again with the number in place of the letter. Do powers first, then multiplication and division, then addition and subtraction." },
  });
}

const AW = {
  moreTimes: { expr: (k, b, v) => `${k}${v} + ${b}`, text: (k, b, v) => ["Take", `${b} more than ${k} times ${v}`, `The sum of ${b} and the product of ${k} and ${v}`, `Multiply ${v} by ${k}. Then add ${b}`], wrong: (k, b, v) => [[`${k}(${v} + ${b})`, "multiplies-the-extra-amount-too"], [`${k} + ${v} + ${b}`, "adds-every-number"], [`${k}${v} ${MINUS} ${b}`, "subtracts-instead-of-adding"], [`${b}${v} + ${k}`, "swaps-the-two-numbers"]] },
  lessTimes: { expr: (k, b, v) => `${k}${v} ${MINUS} ${b}`, text: (k, b, v) => ["Take", `${b} less than ${k} times ${v}`, `The difference when ${b} is subtracted from the product of ${k} and ${v}`, `Multiply ${v} by ${k}. Then subtract ${b}`], wrong: (k, b, v) => [[`${b} ${MINUS} ${k}${v}`, "reverses-the-subtraction"], [`${k}(${v} ${MINUS} ${b})`, "subtracts-before-multiplying"], [`${k}${v} + ${b}`, "adds-instead-of-subtracting"], [`${v} ${MINUS} ${b}${k}`, "multiplies-the-wrong-parts"]] },
  sumTimes: { expr: (k, b, v) => `${k}(${v} + ${b})`, text: (k, b, v) => ["Take", `${k} times the sum of ${v} and ${b}`, `The product of ${k} and the sum of ${v} and ${b}`, `Add ${v} and ${b}. Then multiply by ${k}`], wrong: (k, b, v) => [[`${k}${v} + ${b}`, "does-not-group-the-sum"], [`${k} + ${v} + ${b}`, "adds-every-number"], [`${v}(${k} + ${b})`, "groups-the-wrong-numbers"], [`${k}(${v}) ${MINUS} ${b}`, "subtracts-instead-of-adding"]] },
  divPlus: { expr: (k, b, v) => `${v} ${DIVIDE} ${k} + ${b}`, text: (k, b, v) => ["Take", `${b} more than ${v} divided by ${k}`, `The sum of the quotient of ${v} and ${k}, and ${b}`, `Divide ${v} by ${k}. Then add ${b}`], wrong: (k, b, v) => [[`${k} ${DIVIDE} ${v} + ${b}`, "reverses-the-division"], [`${v} ${DIVIDE} (${k} + ${b})`, "groups-the-wrong-numbers"], [`${v} ${DIVIDE} ${k} ${MINUS} ${b}`, "subtracts-instead-of-adding"], [`(${v} + ${b}) ${DIVIDE} ${k}`, "adds-before-dividing"]] },
  lessFrom: { expr: (k, b, v) => `${b} ${MINUS} ${v}`, text: (k, b, v) => ["Take", `${v} less than ${b}`, `The difference when ${v} is subtracted from ${b}`, `Start with ${b}. Then subtract ${v}`], wrong: (k, b, v) => [[`${v} ${MINUS} ${b}`, "reverses-the-subtraction"], [`${b} + ${v}`, "adds-instead-of-subtracting"], [`${b}${v}`, "writes-a-product-instead-of-a-difference"], [`${b} ${DIVIDE} ${v}`, "divides-instead-of-subtracting"]] },
  diffTimes: { expr: (k, b, v) => `${k}(${v} ${MINUS} ${b})`, text: (k, b, v) => ["Take", `${k} times the difference of ${v} and ${b}`, `The product of ${k} and the difference of ${v} and ${b}`, `Subtract ${b} from ${v}. Then multiply by ${k}`], wrong: (k, b, v) => [[`${k}${v} ${MINUS} ${b}`, "does-not-group-the-difference"], [`${k}(${b} ${MINUS} ${v})`, "reverses-the-subtraction"], [`${k} ${MINUS} ${v} ${MINUS} ${b}`, "subtracts-every-number"], [`${v} ${MINUS} ${k}${b}`, "multiplies-the-wrong-parts"]] },
};
function algWrite(rng, L) {
  const form = rng.pick(L === 1 ? ["moreTimes", "lessFrom", "moreTimes"] : Object.keys(AW));
  const v = rng.pick(VARS);
  const k = ri(rng, 2, 9);
  const b = ri(rng, 2, L === 1 ? 9 : 20);
  const f = AW[form];
  const tx = f.text(k, b, v);
  const text = f.expr(k, b, v);
  const sent = (s) => `${s[0].toUpperCase()}${s.slice(1)}.`;
  return finalize({
    family: "algexpr",
    level: L,
    spec: { kind: "write", form, k, b, v },
    stem: T3(`Let ${v} stand for a number. ${sent(tx[3])}`, `Let ${v} stand for a number. ${sent(tx[1])}`, `Let ${v} stand for a number. ${sent(tx[2])}`),
    ask: T3("Which expression matches the words?", "Which expression matches the words?", "Which algebraic expression correctly represents the words?"),
    expr: null,
    answer: { value: text, text, kind: "text" },
    work: [`Write each part of the words as math, in the order it happens`, `The expression is ${text}`],
    visual: null,
    distractors: tdistr(text, f.wrong(k, b, v)),
    hints: { conceptual: "A phrase such as less than or more than can swap the order you read the numbers. Check which quantity the amount is taken from.", procedural: "Name the unknown with the letter. Build the expression one phrase at a time, using grouping symbols if one step must happen before the next." },
  });
}

function algParts(rng, L) {
  const [u, w] = rng.sample(VARS, 2);
  const nVar = L === 1 ? 1 : 2;
  const terms = [];
  const cs = rng.sample([2, 3, 4, 5, 6, 7, 8, 9, 12], 3);
  terms.push({ c: cs[0], v: u });
  if (nVar === 2) terms.push({ c: cs[1], v: w });
  const k = ri(rng, 2, 30);
  terms.push({ c: k, v: "" });
  const ask = rng.pick(["coef", "nterms", "const", "coef"]);
  const target = ask === "coef" ? rng.pick(terms.filter((t) => t.v)) : null;
  const disp = exprTerms(terms);
  let val;
  let q;
  let wrongs;
  if (ask === "coef") {
    val = target.c;
    q = T3(`What is the coefficient of ${target.v} in ${disp}?`, `What is the coefficient of ${target.v} in ${disp}?`, `Identify the coefficient of ${target.v} in the expression ${disp}.`);
    wrongs = [[k, "gives-the-constant-instead-of-the-coefficient"], [terms.length, "counts-the-terms"], [sum(terms.map((t) => t.c)), "adds-all-the-numbers"], [val + 1, "off-by-one"], [terms.find((t) => t.v && t !== target)?.c, "gives-the-coefficient-of-the-other-term"]];
  } else if (ask === "nterms") {
    val = terms.length;
    q = T3(`How many terms are in ${disp}?`, `How many terms does ${disp} have?`, `How many terms does the expression ${disp} have?`);
    wrongs = [[terms.filter((t) => t.v).length, "counts-only-the-terms-with-letters"], [val + 1, "counts-the-plus-signs-and-one-more"], [val * 2, "counts-numbers-and-letters-separately"], [val - 1, "counts-the-plus-signs"]];
  } else {
    val = k;
    q = T3(`What is the constant term in ${disp}?`, `What is the constant term in ${disp}?`, `Identify the constant term in the expression ${disp}.`);
    wrongs = [[terms[0].c, "gives-a-coefficient-instead-of-the-constant"], [sum(terms.map((t) => t.c)), "adds-all-the-numbers"], [terms.length, "counts-the-terms"], [k + 1, "off-by-one"]];
  }
  return finalize({
    family: "algexpr",
    level: L,
    spec: { kind: "parts", terms, ask, target: target ? target.v : null },
    stem: T3("", "", ""),
    ask: q,
    expr: disp,
    answer: { value: String(val), text: String(val), kind: "int" },
    work: [`Terms are the parts added together: ${terms.map((t) => termBody(t.c, t.v)).join(", ")}`, ask === "coef" ? `The coefficient is the number multiplied by the letter` : ask === "nterms" ? `Count the parts separated by plus signs` : `The constant term is the part with no letter`],
    visual: null,
    distractors: distr(fr(val), { k: "int" }, wrongs.filter((x) => x[0] != null)),
    hints: { conceptual: "A term is one part of the expression that is added. A coefficient is the number that multiplies a letter. A constant has no letter.", procedural: "Split the expression at the plus signs. Look at each part to see if it has a letter." },
  });
}

function algDist(rng, L) {
  const v = rng.pick(VARS);
  const k = ri(rng, 2, 9);
  const b = ri(rng, 2, 9);
  const minus = L >= 2 && rng.chance(0.5);
  const sg = minus ? -1 : 1;
  const text = linT(k, sg * k * b, v);
  const orig = `${k}(${v} ${minus ? MINUS : "+"} ${b})`;
  return finalize({
    family: "algexpr",
    level: L,
    spec: { kind: "dist", k, v, b: sg * b },
    stem: T3("", "", ""),
    ask: T3(`Which expression is the same as ${orig}?`, `Which expression is equivalent to ${orig}?`, `Which expression is equivalent to ${orig}, by the distributive property?`),
    expr: orig,
    answer: { value: text, text, kind: "text" },
    work: [`Multiply ${k} by each term inside the parentheses`, `${k} ${TIMES} ${v} gives ${k}${v}`, `${k} ${TIMES} ${b} = ${k * b}`, `So ${orig} is equivalent to ${text}`],
    visual: null,
    distractors: tdistr(text, [[linT(k, sg * b, v), "multiplies-only-the-first-term"], [linT(1, sg * k * b, v), "multiplies-only-the-second-term"], [linT(k, sg * (k + b), v), "adds-the-multiplier-to-the-second-term"], [`${k + b}${v}`, "adds-the-numbers-and-combines-with-the-letter"], [linT(k, sg * k * b, v) === `${k}${v} + ${k * b}` ? `${k}${v} ${MINUS} ${k * b}` : `${k}${v} + ${k * b}`, "ignores-the-sign-inside-the-parentheses"]]),
    hints: { conceptual: "The distributive property says the number outside multiplies every term inside the parentheses.", procedural: "Multiply the outside number by the first term, then by the second term, and keep the sign between them." },
  });
}

function algFactor(rng, L) {
  const v = rng.pick(VARS);
  const g = rng.pick([2, 3, 4, 5, 6, 8, 9, 10, 12]);
  let m1;
  let m2;
  do {
    m1 = ri(rng, 1, 7);
    m2 = ri(rng, 2, 9);
  } while (gcd(m1, m2) !== 1);
  const c1 = g * m1;
  const c2 = g * m2;
  const text = `${g}(${linT(m1, m2, v)})`;
  const shown = linT(c1, c2, v);
  const small = [2, 3, 4, 5, 6].filter((d) => g % d === 0 && d < g)[0];
  const cands = [[`${g}(${linT(m1, c2, v)})`, "factors-only-the-first-term"], [`${g}(${linT(c1, m2, v)})`, "factors-only-the-second-term"], [`${g}(${m1}${v} ${MINUS} ${m2})`, "changes-the-sign"], [shown, "leaves-the-expression-unchanged"]];
  if (small) cands.unshift([`${small}(${linT(c1 / small, c2 / small, v)})`, "factors-out-a-common-factor-that-is-not-the-greatest"]);
  return finalize({
    family: "algexpr",
    level: L,
    spec: { kind: "factor", c1, c2, v },
    stem: T3("", "", ""),
    ask: T3(`Factor out the greatest common factor of ${shown}.`, `Write ${shown} with the greatest common factor outside parentheses.`, `Rewrite ${shown} as a product, factoring out the greatest common factor.`),
    expr: shown,
    answer: { value: text, text, kind: "text" },
    work: [`The greatest common factor of ${c1} and ${c2} is ${g}`, `${c1} ${DIVIDE} ${g} = ${m1}`, `${c2} ${DIVIDE} ${g} = ${m2}`, `So ${shown} is the same as ${text}`],
    visual: null,
    distractors: tdistr(text, cands),
    hints: { conceptual: "Factoring is the distributive property in reverse. The factor outside must divide every term.", procedural: "Find the greatest number that divides both numbers. Divide each term by it and write what is left inside the parentheses." },
  });
}

function algCombine(rng, L) {
  const v = rng.pick(VARS);
  const nx = L === 1 ? 2 : ri(rng, 2, 3);
  const nk = 2;
  const signs = (n) => Array.from({ length: n }, () => (L === 3 && rng.chance(0.4) ? -1 : 1));
  let terms;
  let a;
  let b;
  for (let tries = 0; tries < 200; tries++) {
    const sx = signs(nx);
    const sk = signs(nk);
    terms = [...sx.map((s) => ({ c: s * ri(rng, 1, 9), v })), ...sk.map((s) => ({ c: s * ri(rng, 1, 15), v: "" }))];
    a = sum(terms.filter((t) => t.v).map((t) => t.c));
    b = sum(terms.filter((t) => !t.v).map((t) => t.c));
    if (a >= 2 && b !== 0 && terms[0].c > 0) break;
  }
  // like terms apart: variable, constant, variable, constant (…)
  const xs = terms.filter((t) => t.v);
  const ks = terms.filter((t) => !t.v);
  const mixed = [];
  while (xs.length || ks.length) {
    if (xs.length) mixed.push(xs.shift());
    if (ks.length) mixed.push(ks.shift());
  }
  if (mixed[0].c < 0) mixed.push(mixed.shift());
  const disp = exprTerms(mixed);
  const text = linT(a, b, v);
  const allSum = sum(terms.map((t) => t.c));
  return finalize({
    family: "algexpr",
    level: L,
    spec: { kind: "combine", terms: mixed, v },
    stem: T3("", "", ""),
    ask: T3(`Make ${disp} shorter by combining like terms.`, `Simplify ${disp} by combining like terms.`, `Simplify the expression ${disp} by combining like terms.`),
    expr: disp,
    answer: { value: text, text, kind: "text" },
    work: [`Like terms have the same letter part. Terms with ${v} go together, and plain numbers go together`, `The ${v} terms add to ${a}${v}`, `The numbers add to ${b < 0 ? MINUS + -b : b}`, `So the simplified expression is ${text}`],
    visual: null,
    distractors: tdistr(text, [
      [allSum === 0 ? `${a}${v}` : `${allSum < 0 ? MINUS : ""}${Math.abs(allSum)}${v}`, "combines-unlike-terms"],
      [linT(b === 0 ? 1 : Math.abs(b), a, v), "swaps-the-coefficient-and-the-constant"],
      [linT(Math.max(a - 1, 1), b, v), "drops-part-of-a-like-term"],
      [linT(a, b + (b > 0 ? 1 : -1), v), "makes-a-mistake-adding-the-numbers"],
      [linT(a, -b, v), "changes-the-sign-of-the-constant"],
    ]),
    hints: { conceptual: "Like terms can be combined because they count the same kind of thing. A term with a letter and a plain number are different kinds.", procedural: "Add the numbers in front of the same letter. Then add the plain numbers. Keep each sign with its number." },
  });
}

FAMILIES.algexpr = {
  title: "Numerical and algebraic expressions",
  grades: [6],
  defaults: {},
  gen(rng, P, { level = 1 } = {}) {
    const pool = level === 1 ? [algEval, algEval, algWrite, algWrite, algParts, algDist] : level === 2 ? [algEval, algWrite, algWrite, algParts, algDist, algCombine, algCombine] : [algEval, algWrite, algDist, algFactor, algCombine, algCombine];
    return rng.pick(pool)(rng, level);
  },
};

// ================================================================================================ equation (g6.equations, g7.expreq)
// Numbers in `work` are written through nt() so a decimal or fraction prints exactly; negative operands are parenthesized.
const nt = (f, mode) => {
  if (mode === "frac") return frS(f);
  const dp = decPlaces(f);
  return dp < 0 ? frS(f) : dStr(f, Math.max(0, dp), true);
};
const ptn = (f, mode) => (f.n < 0 ? `(${nt(f, mode)})` : nt(f, mode));
const styleOf = (x, mode, mixed = false) => (x.d === 1 ? { k: "int" } : mode === "dec" && decPlaces(x) > 0 ? { k: "dec", p: decPlaces(x) } : { k: "frac", mixed });
const SPEC = (f) => `${f.n}/${f.d}`;
const EQV = ["x", "n", "m", "y", "t"];
const money = (f) => `$${dStr(f, Math.max(2, decPlaces(f)), true)}`;

function eq1Values(rng, L, mode, form) {
  let x;
  let p;
  let q;
  if (mode === "int") {
    const hi = L === 1 ? 15 : 24;
    if (form === "add") {
      x = fr(ri(rng, 1, hi));
      p = fr(ri(rng, 1, hi));
      q = x.add(p);
    } else if (form === "sub") {
      p = fr(ri(rng, 1, hi));
      q = fr(ri(rng, 1, hi));
      x = q.add(p);
    } else if (form === "mul") {
      p = fr(ri(rng, 2, 12));
      x = fr(ri(rng, 1, 12));
      q = p.mul(x);
    } else {
      p = fr(ri(rng, 2, 9));
      q = fr(ri(rng, 1, 12));
      x = q.mul(p);
    }
  } else if (mode === "dec") {
    const d = L === 3 ? 100 : 10;
    const lo = L === 3 ? 101 : 11;
    const hi = L === 3 ? 899 : 99;
    if (form === "add") {
      x = fr(ri(rng, lo, hi), d);
      p = fr(ri(rng, lo, hi), d);
      q = x.add(p);
    } else if (form === "sub") {
      p = fr(ri(rng, 1, hi), d);
      q = fr(ri(rng, 1, hi), d);
      x = q.add(p);
    } else if (form === "mul") {
      p = fr(ri(rng, 2, 29), 10);
      x = fr(ri(rng, 2, 59), 10);
      q = p.mul(x);
    } else {
      p = fr(ri(rng, 2, 9));
      q = fr(ri(rng, 2, L === 3 ? 249 : 99), L === 3 ? 100 : 10);
      x = q.mul(p);
    }
  } else {
    const dens = L === 3 ? [2, 3, 4, 6] : [2, 4, 5, 8];
    const d1 = rng.pick(dens);
    const d2 = L === 3 ? rng.pick(dens.filter((d) => d !== d1)) : d1;
    if (form === "add") {
      x = fr(ri(rng, 1, d1 * 2), d1);
      p = fr(ri(rng, 1, d2 - 1), d2);
      q = x.add(p);
    } else if (form === "sub") {
      p = fr(ri(rng, 1, d2 - 1), d2);
      q = fr(ri(rng, 1, d1 * 2), d1);
      x = q.add(p);
    } else if (form === "mul") {
      const b = rng.pick([2, 3, 4, 5, 8]);
      p = fr(ri(rng, 1, b - 1), b);
      x = fr(ri(rng, 1, 12), rng.pick([1, 2, 3, 4]));
      q = p.mul(x);
    } else {
      p = fr(ri(rng, 2, 8));
      const b = rng.pick([2, 3, 4, 5, 8]);
      q = fr(ri(rng, 1, b * 2), b);
      x = q.mul(p);
    }
  }
  return { x, p, q };
}
const eqStr1 = (form, v, P, Q, mode, p) => {
  if (form === "add") return `${v} + ${P} = ${Q}`;
  if (form === "sub") return `${v} ${MINUS} ${P} = ${Q}`;
  if (form === "mul") return mode === "frac" ? `${P} ${TIMES} ${v} = ${Q}` : `${P}${v} = ${Q}`;
  return `${v} ${DIVIDE} ${P} = ${Q}`;
};
function eqOne(rng, L, ctx) {
  const mode = L === 1 ? "int" : L === 2 ? rng.pick(["int", "dec", "frac", "dec"]) : rng.pick(["dec", "frac", "dec", "frac"]);
  const form = rng.pick(["add", "sub", "mul", "div"]);
  const { x, p, q } = eq1Values(rng, L, mode, form);
  const v = rng.pick(EQV);
  const P = nt(p, mode);
  const Q = nt(q, mode);
  const E = eqStr1(form, v, P, Q, mode, p);
  const W = rng.pick(NAMES);
  const pk = pack(rng, ctx);
  const wordy = rng.chance(0.5);
  const st = wordy && mode === "dec" && decPlaces(x) <= 2 ? { k: "money" } : styleOf(x, mode, true);
  const amt = (f) => (mode === "int" ? `${nt(f, mode)} ${pk.item}` : mode === "dec" ? money(f) : `${nt(f, mode)} ${f.cmp(fr(1)) <= 0 ? "cup" : "cups"} of flour`);
  const thing = mode === "int" ? pk.item : mode === "dec" ? "money" : "flour";
  const HM = mode === "int" ? `How many ${pk.item}` : mode === "dec" ? "How many dollars" : "How many cups of flour";
  let stem = T3("", "", "");
  let ask = T3(`Solve for ${v}: ${E}`, `Solve: ${E}`, `Solve the equation ${E}, and check your solution by substitution.`);
  let unit;
  if (wordy) {
    if (form === "add") {
      stem = T3(`${W} has some ${thing}. ${W} gets ${amt(p)} from a friend. Now ${W} has ${amt(q)}.`, `${W} had some ${thing}, received ${amt(p)} from a friend, and now has ${amt(q)}.`, `${W} started with an unknown amount of ${thing}. After receiving ${amt(p)} from a friend, ${W} has ${amt(q)}.`);
      ask = T3(`${HM} did ${W} start with? Let ${v} be that number.`, `${HM} did ${W} have at first? Let ${v} be that number.`, `${HM} did ${W} have at the start? Let ${v} represent that number.`);
    } else if (form === "sub") {
      stem = T3(`${W} has some ${thing}. ${W} gives away ${amt(p)}. Then ${W} has ${amt(q)} left.`, `${W} had some ${thing}, gave away ${amt(p)}, and has ${amt(q)} left.`, `${W} started with an unknown amount of ${thing}. After giving away ${amt(p)}, ${W} has ${amt(q)} remaining.`);
      ask = T3(`${HM} did ${W} start with? Let ${v} be that number.`, `${HM} did ${W} have at first? Let ${v} be that number.`, `${HM} did ${W} have at the start? Let ${v} represent that number.`);
    } else if (form === "mul") {
      if (mode === "int") {
        stem = T3(`${P} ${pk.gs} hold ${Q} ${pk.item} in all. Each ${pk.g} holds the same number.`, `${P} ${pk.gs} hold ${Q} ${pk.item} altogether, with the same number in each ${pk.g}.`, `${P} ${pk.gs} contain ${Q} ${pk.item} in total, and every ${pk.g} contains the same number.`);
        ask = T3(`How many ${pk.item} are in each ${pk.g}? Let ${v} be that number.`, `How many ${pk.item} are in each ${pk.g}? Let ${v} be that number.`, `How many ${pk.item} does each ${pk.g} contain? Let ${v} represent that number.`);
      } else if (mode === "dec") {
        stem = T3(`${W} buys ${P} pounds of grapes. ${W} pays ${money(q)}.`, `${W} buys ${P} pounds of grapes for ${money(q)}.`, `${W} pays ${money(q)} for ${P} pounds of grapes.`);
        ask = T3(`What is the cost of one pound, in dollars? Let ${v} be that cost.`, `How many dollars does one pound cost? Let ${v} be that cost.`, `What is the price of one pound, in dollars? Let ${v} represent that price.`);
      } else {
        stem = T3(`${W} walks for ${P} ${p.cmp(fr(1)) <= 0 ? "hour" : "hours"} at a steady speed. ${W} goes ${Q} miles.`, `${W} walks at a steady speed for ${P} ${p.cmp(fr(1)) <= 0 ? "hour" : "hours"} and covers ${Q} miles.`, `${W} walks at a constant speed for ${P} ${p.cmp(fr(1)) <= 0 ? "hour" : "hours"} and travels ${Q} miles.`);
        ask = T3(`How many miles does ${W} walk in one hour? Let ${v} be that number.`, `How many miles does ${W} walk in one hour? Let ${v} be that number.`, `How many miles does ${W} travel in one hour? Let ${v} represent that number.`);
      }
    } else if (mode === "int") {
      stem = T3(`${W} shares some ${pk.item} equally among ${P} friends. Each friend gets ${Q} ${pk.item}.`, `${W} shares some ${pk.item} equally among ${P} friends, and each friend gets ${Q} ${pk.item}.`, `${W} distributes some ${pk.item} equally among ${P} friends, and each friend receives ${Q} ${pk.item}.`);
      ask = T3(`How many ${pk.item} did ${W} share? Let ${v} be that number.`, `How many ${pk.item} did ${W} start with? Let ${v} be that number.`, `How many ${pk.item} did ${W} have to start? Let ${v} represent that number.`);
    } else if (mode === "dec") {
      stem = T3(`${W} splits a bill equally among ${P} people. Each person pays ${money(q)}.`, `A bill is split equally among ${P} people, and each person pays ${money(q)}.`, `A bill is divided equally among ${P} people, and each person pays ${money(q)}.`);
      ask = T3(`What is the whole bill, in dollars? Let ${v} be the bill.`, `How many dollars is the whole bill? Let ${v} be the bill.`, `What is the total amount of the bill, in dollars? Let ${v} represent the bill.`);
    } else {
      stem = T3(`${W} cuts a rope into ${P} equal pieces. Each piece is ${Q} ${q.cmp(fr(1)) <= 0 ? "meter" : "meters"} long.`, `${W} cuts a rope into ${P} equal pieces, and each piece is ${Q} ${q.cmp(fr(1)) <= 0 ? "meter" : "meters"} long.`, `${W} cuts a rope into ${P} pieces of equal length, and each piece is ${Q} ${q.cmp(fr(1)) <= 0 ? "meter" : "meters"} long.`);
      ask = T3(`How many meters long was the rope? Let ${v} be that length.`, `How long was the rope, in meters? Let ${v} be that length.`, `What was the length of the rope, in meters? Let ${v} represent that length.`);
    }
    unit = null;
  }
  const inverse = { add: `Subtract ${P} from both sides`, sub: `Add ${P} to both sides`, mul: `Divide both sides by ${P}`, div: `Multiply both sides by ${P}` }[form];
  const calc = { add: `${nt(q, mode)} ${MINUS} ${P} = ${nt(x, mode)}`, sub: `${nt(q, mode)} + ${P} = ${nt(x, mode)}`, mul: `${nt(q, mode)} ${DIVIDE} ${P} = ${nt(x, mode)}`, div: `${nt(q, mode)} ${TIMES} ${P} = ${nt(x, mode)}` }[form];
  const check = { add: `${nt(x, mode)} + ${P} = ${Q}`, sub: `${nt(x, mode)} ${MINUS} ${P} = ${Q}`, mul: `${P} ${TIMES} ${nt(x, mode)} = ${Q}`, div: `${nt(x, mode)} ${DIVIDE} ${P} = ${Q}` }[form];
  const wrongs = {
    add: [[q.add(p), "adds-instead-of-subtracting"], [p.sub(q), "subtracts-in-the-wrong-order"], [q.mul(p), "multiplies-instead-of-subtracting"], [p, "gives-the-number-in-the-equation"]],
    sub: [[q.sub(p), "subtracts-instead-of-adding"], [q.mul(p), "multiplies-instead-of-adding"], [p, "gives-the-number-in-the-equation"], [q.div(p), "divides-instead-of-adding"]],
    mul: [[q.sub(p), "subtracts-instead-of-dividing"], [q.mul(p), "multiplies-instead-of-dividing"], [p.div(q), "divides-in-the-wrong-order"], [q.add(p), "adds-instead-of-dividing"]],
    div: [[q.div(p), "divides-instead-of-multiplying"], [q.add(p), "adds-instead-of-multiplying"], [q.sub(p), "subtracts-instead-of-multiplying"], [p.div(q), "divides-in-the-wrong-order"]],
  }[form];
  return finalize({
    family: "equation",
    level: L,
    spec: { kind: "eq1", form, p: SPEC(p), q: SPEC(q), v },
    stem,
    ask,
    expr: E,
    answer: ans(x, st, unit || undefined),
    work: [`The equation is ${E}`, `${inverse}, because it undoes the operation on ${v}`, calc, `Check by substituting: ${check}`],
    visual: null,
    distractors: distr(x, st, wrongs),
    hints: { conceptual: "An equation is a balance. Whatever you do to one side, you must do to the other. Use the operation that undoes the one in the equation.", procedural: `Decide which operation is applied to ${v}. Do the opposite operation on both sides. Then check your answer by putting it back in the equation.` },
  });
}

// ---- two-step equations (grade 7)
const cf = (p, mode, v) => {
  if (mode === "int" || p.d === 1) return p.n === 1 ? v : p.n === -1 ? `${MINUS}${v}` : `${nt(p, mode)}${v}`;
  if (mode === "dec") return `${nt(p, mode)}${v}`;
  return p.n < 0 ? `${MINUS}(${nt(negF(p), mode)})${v}` : `(${nt(p, mode)})${v}`;
};
function eq2Values(rng, L, mode, form) {
  let p;
  let x;
  let q;
  const sgn = () => (rng.chance(0.5) ? 1 : -1);
  if (mode === "int") {
    const neg = L >= 2;
    p = fr(ri(rng, 2, L === 3 ? 12 : 9) * (neg && rng.chance(0.4) ? -1 : 1));
    x = fr(ri(rng, 1, L === 1 ? 12 : 15) * (neg && rng.chance(0.5) ? -1 : 1));
    q = fr(ri(rng, 1, form === "paren" ? 9 : 15) * (neg && rng.chance(0.5) ? -1 : 1));
  } else if (mode === "dec") {
    p = fr(ri(rng, 2, 25) * (L === 3 && rng.chance(0.4) ? -1 : 1), rng.pick([10, 2]));
    x = fr(ri(rng, 1, 60) * (L >= 2 && rng.chance(0.4) ? -1 : 1), 10);
    q = fr(ri(rng, 1, 60) * (L >= 2 && rng.chance(0.5) ? -1 : 1), 10);
  } else {
    const b = rng.pick([2, 3, 4, 5]);
    p = fr(ri(rng, 1, b + 2) * (rng.chance(0.3) ? -1 : 1), b);
    x = fr(ri(rng, 1, 14) * sgn(), rng.pick([1, 2, 3, 4]));
    q = fr(ri(rng, 1, 12) * sgn(), rng.pick([1, 2, 4]));
    if (p.n === 0) p = fr(1, b);
  }
  if (Math.abs(p.n) === p.d) p = fr(p.n * 2, p.d);
  const r = form === "lin" ? p.mul(x).add(q) : p.mul(x.add(q));
  return { p, x, q, r };
}
function eqTwoWord(rng, L, ctx) {
  const W = rng.pick(NAMES);
  const dec = L >= 2 && rng.chance(0.5);
  const kinds = ["gym", "taxi", "tickets", "snacks"];
  const k = rng.pick(kinds);
  const m = money;
  let p;
  let x;
  let q;
  let r;
  let form;
  if (k === "gym" || k === "taxi") {
    form = "lin";
    p = dec ? fr(ri(rng, 15, 95), 10) : fr(ri(rng, 3, 25));
    x = fr(ri(rng, 2, 14));
    q = fr(ri(rng, 4, 40));
    r = p.mul(x).add(q);
  } else {
    form = "paren";
    p = fr(ri(rng, 2, 8));
    x = dec ? fr(ri(rng, 15, 95), 10) : fr(ri(rng, 2, 25));
    q = fr(ri(rng, 1, 9));
    r = p.mul(x.add(q));
  }
  const v = rng.pick(["m", "x", "n", "d"]);
  const stems = {
    gym: [T3(`A gym charges ${m(q)} to join. Then it charges ${m(p)} each month. ${W} paid ${m(r)} in all.`, `A gym charges a ${m(q)} joining fee plus ${m(p)} each month. ${W} paid ${m(r)} in all.`, `A gym charges a one-time joining fee of ${m(q)} plus ${m(p)} per month. ${W} paid a total of ${m(r)}.`), T3(`For how many months did ${W} pay? Let ${v} be the months.`, `For how many months did ${W} pay? Let ${v} be the number of months.`, `For how many months did ${W} pay? Let ${v} represent the number of months.`), `${m(p)}${v} + ${m(q)} = ${m(r)}`],
    taxi: [T3(`A taxi ride costs ${m(q)} to start. Then it costs ${m(p)} for each mile. ${W}'s ride cost ${m(r)}.`, `A taxi ride costs ${m(q)} plus ${m(p)} for each mile. ${W}'s ride cost ${m(r)}.`, `A taxi fare is a ${m(q)} base charge plus ${m(p)} per mile. ${W}'s fare was ${m(r)}.`), T3(`How many miles was the ride? Let ${v} be the miles.`, `How many miles was the ride? Let ${v} be the number of miles.`, `How many miles was the ride? Let ${v} represent the number of miles.`), `${m(p)}${v} + ${m(q)} = ${m(r)}`],
    tickets: [T3(`${W} buys ${p.n} tickets. Each ticket costs the same price. Each ticket also has a ${m(q)} fee. ${W} pays ${m(r)} in all.`, `${W} buys ${p.n} tickets. Each ticket costs the same price plus a ${m(q)} fee. ${W} pays ${m(r)} in all.`, `${W} buys ${p.n} tickets. Each ticket has the same price plus a ${m(q)} service fee. ${W} pays ${m(r)} in total.`), T3(`What is the price of one ticket, without the fee? Let ${v} be that price.`, `What is the price of one ticket, before the fee, in dollars? Let ${v} be that price.`, `What is the price of one ticket before the fee, in dollars? Let ${v} represent that price.`), `${p.n}(${v} + ${m(q)}) = ${m(r)}`],
    snacks: [T3(`${p.n} friends each buy a snack. Each friend also pays ${m(q)} for the bus. Together they pay ${m(r)}.`, `${p.n} friends each buy a snack and pay ${m(q)} for the bus. Together they spend ${m(r)}.`, `${p.n} friends each buy a snack and each pay ${m(q)} for the bus. Together they spend ${m(r)}.`), T3(`What is the price of one snack? Let ${v} be that price.`, `What is the price of one snack, in dollars? Let ${v} be that price.`, `What is the price of one snack, in dollars? Let ${v} represent that price.`), `${p.n}(${v} + ${m(q)}) = ${m(r)}`],
  }[k];
  const st = styleOf(x, dec ? "dec" : "int");
  const wrongs = form === "lin"
    ? [[r.add(q).div(p), "adds-the-fee-instead-of-subtracting"], [r.div(p).sub(q), "divides-before-subtracting-the-fee"], [r.sub(q).mul(p), "multiplies-instead-of-dividing"], [r.sub(q).sub(p), "subtracts-the-rate-instead-of-dividing"]]
    : [[r.sub(q).div(p), "treats-the-parentheses-like-a-single-fee"], [r.div(p).add(q), "adds-the-fee-instead-of-subtracting"], [p.add(q).n === 0 ? null : r.div(p.add(q)), "divides-by-the-sum"], [r.sub(p).sub(q), "subtracts-instead-of-dividing"]];
  const lines = form === "lin"
    ? [`The equation is ${stems[2]}`, `Subtract the fee from both sides: ${nt(r, "dec")} ${MINUS} ${nt(q, "dec")} = ${nt(r.sub(q), "dec")}`, `Divide both sides by the rate: ${nt(r.sub(q), "dec")} ${DIVIDE} ${nt(p, "dec")} = ${nt(x, "dec")}`, `Check: ${nt(p, "dec")} ${TIMES} ${nt(x, "dec")} = ${nt(p.mul(x), "dec")}, and ${nt(p.mul(x), "dec")} + ${nt(q, "dec")} = ${nt(r, "dec")}`]
    : [`The equation is ${stems[2]}`, `Divide both sides by ${p.n}: ${nt(r, "dec")} ${DIVIDE} ${p.n} = ${nt(r.div(p), "dec")}`, `Subtract the fee from both sides: ${nt(r.div(p), "dec")} ${MINUS} ${nt(q, "dec")} = ${nt(x, "dec")}`, `Check: ${nt(x, "dec")} + ${nt(q, "dec")} = ${nt(x.add(q), "dec")}, and ${p.n} ${TIMES} ${nt(x.add(q), "dec")} = ${nt(r, "dec")}`];
  return finalize({
    family: "equation",
    level: L,
    spec: { kind: "eq2", form, p: SPEC(p), q: SPEC(q), r: SPEC(r), v },
    stem: stems[0],
    ask: stems[1],
    expr: stems[2],
    answer: ans(x, st, k === "gym" ? "months" : k === "taxi" ? "miles" : "dollars"),
    work: lines,
    visual: null,
    distractors: distr(x, st, wrongs),
    hints: { conceptual: "Write an equation that matches the story. Then undo the operations in the reverse order of how they were applied to the unknown.", procedural: "Decide what is done to the unknown first and what is done second. Undo the last step first, on both sides." },
  });
}
function eqTwo(rng, L, ctx) {
  if (L <= 2 && rng.chance(0.4)) return eqTwoWord(rng, L, ctx);
  const mode = L === 1 ? "int" : L === 2 ? rng.pick(["int", "int", "dec"]) : rng.pick(["frac", "dec", "int", "frac"]);
  const form = rng.pick(["lin", "paren"]);
  const { p, x, q, r } = eq2Values(rng, L, mode, form);
  const v = rng.pick(EQV);
  if (mode === "dec" && (decPlaces(r) < 0 || decPlaces(r) > 3)) return eqTwo(rng, L, ctx);
  if (mode === "dec" && decPlaces(x) < 0) return eqTwo(rng, L, ctx);
  const R_ = nt(r, mode);
  const qa = nt(absF(q), mode);
  const E = form === "lin" ? `${cf(p, mode, v)} ${q.n < 0 ? MINUS : "+"} ${qa} = ${R_}` : `${p.d === 1 || mode === "dec" ? (p.n < 0 ? MINUS : "") + nt(absF(p), mode) : p.n < 0 ? `${MINUS}(${nt(absF(p), mode)})` : `(${nt(p, mode)})`}(${v} ${q.n < 0 ? MINUS : "+"} ${qa}) = ${R_}`;
  const st = styleOf(x, mode);
  const P = ptn(p, mode);
  const wrongs = form === "lin"
    ? [[r.add(q).div(p), "adds-q-instead-of-subtracting-it"], [r.div(p).sub(q), "divides-before-undoing-the-constant"], [r.sub(q).mul(p), "multiplies-instead-of-dividing"], [r.sub(q).div(p).mul(fr(-1)), "makes-a-sign-error-at-the-end"], [r.sub(q), "forgets-to-divide-by-the-coefficient"]]
    : [[r.sub(q).div(p), "treats-the-parentheses-as-if-q-were-outside"], [r.div(p).add(q), "adds-q-instead-of-subtracting-it"], [p.add(q).n === 0 ? null : r.div(p.add(q)), "divides-by-the-sum"], [r.div(p).mul(fr(-1)).sub(q), "makes-a-sign-error"], [r.div(p), "forgets-to-subtract-q"]];
  const lines = form === "lin"
    ? [`The equation is ${E}`, `${q.n < 0 ? "Add" : "Subtract"} ${qa} on both sides to undo the ${q.n < 0 ? "subtraction" : "addition"}: ${ptn(r, mode)} ${q.n < 0 ? "+" : MINUS} ${qa} = ${nt(r.sub(q), mode)}`, `Divide both sides by ${P}: ${ptn(r.sub(q), mode)} ${DIVIDE} ${P} = ${nt(x, mode)}`, `Check: ${P} ${TIMES} ${ptn(x, mode)} = ${nt(p.mul(x), mode)}, and ${ptn(p.mul(x), mode)} ${q.n < 0 ? MINUS : "+"} ${qa} = ${nt(r, mode)}`]
    : [`The equation is ${E}`, `Divide both sides by ${P}: ${ptn(r, mode)} ${DIVIDE} ${P} = ${nt(r.div(p), mode)}`, `${q.n < 0 ? "Add" : "Subtract"} ${qa} on both sides to undo the ${q.n < 0 ? "subtraction" : "addition"}: ${ptn(r.div(p), mode)} ${q.n < 0 ? "+" : MINUS} ${qa} = ${nt(x, mode)}`, `Check: ${ptn(x, mode)} ${q.n < 0 ? MINUS : "+"} ${qa} = ${nt(x.add(q), mode)}, and ${P} ${TIMES} ${ptn(x.add(q), mode)} = ${nt(r, mode)}`];
  return finalize({
    family: "equation",
    level: L,
    spec: { kind: "eq2", form, p: SPEC(p), q: SPEC(q), r: SPEC(r), v },
    stem: T3("", "", ""),
    ask: T3(`Solve for ${v}: ${E}`, `Solve: ${E}`, `Solve the equation ${E}. Check your solution by substitution.`),
    expr: E,
    answer: ans(x, st),
    work: lines,
    visual: null,
    distractors: distr(x, st, wrongs, { pos: false }),
    hints: { conceptual: "A two-step equation has two operations on the letter. Undo them one at a time, last operation first, keeping both sides balanced.", procedural: form === "lin" ? "First undo the adding or subtracting. Then undo the multiplying by dividing. Check by substituting." : "Either divide both sides by the number outside the parentheses first, or distribute it first. Then undo the adding or subtracting. Check by substituting." },
  });
}

FAMILIES.equation = {
  title: "Equations",
  grades: [6, 7],
  defaults: { steps: 1 },
  gen(rng, P, { level = 1, ctx = "store" } = {}) {
    return P.steps === 2 ? eqTwo(rng, level, ctx) : eqOne(rng, level, ctx);
  },
  check(p, params) {
    const P = { steps: 1, ...params };
    if (P.steps === 2 && p.spec.kind !== "eq2") return "steps 2 produced a one-step equation";
    if (P.steps !== 2 && p.spec.kind !== "eq1") return "steps 1 produced a two-step equation";
    if (P.steps !== 2 && p.answer.value.startsWith("-")) return "grade 6 one-step equations have a nonnegative solution";
    return null;
  },
};

// ================================================================================================ inequality (g6.inequalities, g7.inequalities)
const GE = "≥";
const LE = "≤";
const FLIP = { ">": "<", "<": ">", [GE]: LE, [LE]: GE };
const SWAPSTRICT = { ">": GE, [GE]: ">", "<": LE, [LE]: "<" };
const isStrict = (o) => o === ">" || o === "<";
const holds = (x, op, c) => (op === ">" ? x > c : op === "<" ? x < c : op === GE ? x >= c : x <= c);
const ineq = (v, op, c) => `${v} ${op} ${num(c)}`;
const OPWORD = { ">": "greater than", "<": "less than", [GE]: "greater than or equal to", [LE]: "less than or equal to" };

const IW = [
  { op: ">", v: "h", what: "a rider's height in inches", t: (c) => [`A ride needs riders who are more than ${c} inches tall.`, `Riders must be taller than ${c} inches.`, `A ride requires riders to be taller than ${c} inches.`] },
  { op: LE, v: "n", what: "the number of people in the elevator", t: (c) => [`The elevator can hold at most ${c} people.`, `The elevator can carry no more than ${c} people.`, `The elevator's capacity is no more than ${c} people.`] },
  { op: GE, v: "s", what: "the team's score", t: (c) => [`A team needs at least ${c} points to win.`, `A team must score at least ${c} points to win.`, `To win, a team must earn a score of at least ${c} points.`] },
  { op: "<", v: "b", what: "the number of students on the bus", t: (c) => [`The bus has fewer than ${c} students on it.`, `There are fewer than ${c} students on the bus.`, `Fewer than ${c} students are riding the bus.`] },
  { op: "<", v: "t", what: "the temperature in degrees", t: (c) => [`The temperature stays below ${c} degrees.`, `The temperature must stay below ${c} degrees.`, `The temperature must remain below ${c} degrees.`] },
  { op: ">", v: "d", what: "the dollars Mia has saved", t: (c) => [`Mia has saved more than ${c} dollars.`, `Mia has saved more than ${c} dollars so far.`, `The amount Mia has saved exceeds ${c} dollars.`] },
  { op: GE, v: "m", what: "the length of the hike in miles", t: (c) => [`The hike is at least ${c} miles long.`, `The hike is at least ${c} miles long.`, `The length of the hike is at least ${c} miles.`] },
  { op: LE, v: "w", what: "the weight of the backpack in pounds", t: (c) => [`A backpack can weigh at most ${c} pounds.`, `A backpack may weigh no more than ${c} pounds.`, `A backpack's weight may be no more than ${c} pounds.`] },
];
function ineqWrite(rng, L) {
  const sc = rng.pick(L === 1 ? IW.filter((s) => isStrict(s.op)) : IW);
  const c = ri(rng, 3, L === 3 ? 90 : 40);
  const text = ineq(sc.v, sc.op, c);
  const t = sc.t(c);
  const ds = tdistr(text, [
    [ineq(sc.v, FLIP[sc.op], c), "reverses-the-inequality-symbol"],
    [ineq(sc.v, SWAPSTRICT[sc.op], c), "confuses-strict-and-inclusive-symbols"],
    [`${c} ${sc.op} ${sc.v}`, "writes-the-numbers-in-the-wrong-order"],
    [`${sc.v} = ${c}`, "uses-an-equals-sign"],
  ]);
  return finalize({
    family: "inequality",
    level: L,
    spec: { kind: "write", v: sc.v, op: sc.op, c },
    stem: T3(`${t[0]} Let ${sc.v} be ${sc.what}.`, `${t[1]} Let ${sc.v} be ${sc.what}.`, `${t[2]} Let ${sc.v} represent ${sc.what}.`),
    ask: T3("Which inequality matches?", "Which inequality matches the situation?", "Which inequality correctly models the situation?"),
    expr: null,
    answer: { value: text, text, kind: "text" },
    work: [`The unknown is ${sc.v}, which is ${sc.what}`, `The words mean ${sc.v} is ${OPWORD[sc.op]} ${c}`, `The inequality is ${text}`],
    visual: null,
    distractors: ds,
    hints: { conceptual: "An inequality describes many possible values, not just one. The symbol points to the smaller side.", procedural: "Name the unknown first. Decide if the boundary value is allowed. Then choose the symbol that matches the words." },
  });
}
function ineqWhich(rng, L) {
  const op = rng.pick(L === 1 ? [">", "<"] : [">", "<", GE, LE]);
  const v = rng.pick(["x", "n", "t", "y"]);
  const c = ri(rng, L === 1 ? 2 : -6, L === 3 ? 25 : 12);
  const right = op === ">" || op === GE;
  const side = (k) => (right ? c + k : c - k);
  const wrongSide = (k) => (right ? c - k : c + k);
  const useBoundary = !isStrict(op) && rng.chance(0.5);
  const ansV = useBoundary ? c : side(ri(rng, 1, 5));
  const cands = [];
  cands.push(isStrict(op) ? [c, "treats-the-boundary-value-as-a-solution"] : [wrongSide(1), "picks-the-value-just-past-the-boundary"]);
  cands.push([wrongSide(ri(rng, 2, 5)), "picks-a-value-from-the-wrong-side"]);
  cands.push([wrongSide(ri(rng, 6, 9)), "picks-a-value-from-the-wrong-side"]);
  if (!useBoundary && !isStrict(op)) cands.push([wrongSide(1), "picks-the-value-just-past-the-boundary"]);
  cands.push([-ansV, "uses-the-opposite-of-a-solution"], [c + (right ? -3 : 3), "picks-a-value-from-the-wrong-side"]);
  const seen = new Set([ansV]);
  const dvals = [];
  for (const [val, tag] of cands) {
    if (seen.has(val) || holds(val, op, c)) continue;
    seen.add(val);
    dvals.push([val, tag]);
  }
  const ds = dvals.slice(0, 3);
  if (ds.length < 3) throw new Error("ineqWhich: not enough distractors");
  const options = [ansV, ...ds.map((d) => d[0])].sort((a, b) => a - b);
  return finalize({
    family: "inequality",
    level: L,
    spec: { kind: "which", v, op, c, options },
    stem: T3(`Look at ${ineq(v, op, c)}. A value is a solution if it makes the statement true.`, `Look at the inequality ${ineq(v, op, c)}. A value is a solution if it makes the inequality true.`, `Consider the inequality ${ineq(v, op, c)}. A value is a solution if substituting it makes the inequality true.`),
    ask: T3("Which value is a solution?", "Which value is a solution of the inequality?", "Which of these values is a solution of the inequality?"),
    expr: null,
    answer: { value: String(ansV), text: num(ansV), kind: "int" },
    work: [`Test ${num(ansV)} in the inequality: ${ineq(num(ansV), op, c)}`, `Is ${num(ansV)} ${OPWORD[op]} ${num(c)}? Yes, so ${num(ansV)} is a solution`, `A value on the other side of ${num(c)} would make the statement false`],
    visual: null,
    distractors: ds.map(([val, tag]) => ({ text: num(val), misconception: tag })),
    hints: { conceptual: "A solution makes the inequality true. Try a value and read the statement aloud.", procedural: "Put each value in place of the letter and ask: is the statement true? Pay attention to whether the boundary value counts." },
  });
}
function ineqSolve1(rng, L) {
  const op = rng.pick(L === 1 ? [">", "<"] : [">", "<", GE, LE]);
  const form = rng.pick(L === 1 ? ["add", "sub"] : L === 2 ? ["add", "sub", "mul"] : ["add", "sub", "mul", "div"]);
  const v = rng.pick(["x", "n", "t", "y"]);
  let p;
  let q;
  let b;
  if (form === "add") {
    p = ri(rng, 1, 15);
    b = ri(rng, 1, 15);
    q = b + p;
  } else if (form === "sub") {
    b = ri(rng, 1, 15);
    p = ri(rng, 1, 15);
    q = b + p;
    b = q + p;
  } else if (form === "mul") {
    p = ri(rng, 2, 9);
    b = ri(rng, 1, 12);
    q = p * b;
  } else {
    p = ri(rng, 2, 9);
    q = ri(rng, 1, 12);
    b = p * q;
  }
  if (form === "sub") {
    b = q + p;
  }
  const E = { add: `${v} + ${p} ${op} ${q}`, sub: `${v} ${MINUS} ${p} ${op} ${q}`, mul: `${p}${v} ${op} ${q}`, div: `${v} ${DIVIDE} ${p} ${op} ${q}` }[form];
  const text = ineq(v, op, b);
  const inverse = { add: `Subtract ${p} from both sides`, sub: `Add ${p} to both sides`, mul: `Divide both sides by ${p}`, div: `Multiply both sides by ${p}` }[form];
  const calc = { add: `${q} ${MINUS} ${p} = ${b}`, sub: `${q} + ${p} = ${b}`, mul: `${q} ${DIVIDE} ${p} = ${b}`, div: `${q} ${TIMES} ${p} = ${b}` }[form];
  const wrongBound = { add: q + p, sub: q - p, mul: q - p, div: q + p }[form];
  const ds = tdistr(text, [
    [ineq(v, FLIP[op], b), "reverses-the-inequality-symbol"],
    [ineq(v, SWAPSTRICT[op], b), "confuses-strict-and-inclusive-symbols"],
    [ineq(v, op, wrongBound), "uses-the-wrong-inverse-operation"],
    [`${v} = ${b}`, "turns-the-inequality-into-an-equation"],
    [ineq(v, op, p), "gives-the-number-in-the-inequality"],
  ]);
  return finalize({
    family: "inequality",
    level: L,
    spec: { kind: "solve1", form, op, p, q, v },
    stem: T3("", "", ""),
    ask: T3(`Solve: ${E}`, `Solve the inequality ${E}.`, `Solve the inequality ${E}, and write the solutions as an inequality.`),
    expr: E,
    answer: { value: text, text, kind: "text" },
    work: [`${inverse}; the inequality symbol stays the same because the number is positive`, calc, `The solutions are ${text}`],
    visual: null,
    distractors: ds,
    hints: { conceptual: "Solving an inequality works like solving an equation: do the same operation on both sides to keep the statement true.", procedural: "Use the inverse operation on both sides. The symbol stays the same when you add, subtract, multiply or divide by a positive number." },
  });
}
const cfI = (p, v) => (p === 1 ? v : p === -1 ? `${MINUS}${v}` : `${num(p)}${v}`);
const pI = (n) => (n < 0 ? `(${num(n)})` : num(n));
function ineqSolve2(rng, L) {
  const op = rng.pick(L === 1 ? [">", "<"] : [">", "<", GE, LE]);
  const form = L === 3 ? rng.pick(["lin", "paren", "lin"]) : "lin";
  const v = rng.pick(["x", "n", "t", "y"]);
  const neg = L >= 2 ? rng.chance(0.55) : false;
  const p = ri(rng, 2, 9) * (neg ? -1 : 1);
  const b = ri(rng, -8, 12);
  const q = ri(rng, 1, form === "paren" ? 9 : 14) * (L >= 2 && rng.chance(0.5) ? -1 : 1);
  const r = form === "lin" ? p * b + q : p * (b + q);
  const op2 = p < 0 ? FLIP[op] : op;
  const text = ineq(v, op2, b);
  const E = form === "lin" ? `${cfI(p, v)} ${q < 0 ? MINUS : "+"} ${Math.abs(q)} ${op} ${num(r)}` : `${p < 0 ? MINUS : ""}${Math.abs(p)}(${v} ${q < 0 ? MINUS : "+"} ${Math.abs(q)}) ${op} ${num(r)}`;
  const alt = form === "lin" ? (r + q) / p : r / p + q;
  const cands = [];
  if (p < 0) cands.push([ineq(v, op, b), "forgets-to-reverse-the-symbol-when-dividing-by-a-negative"]);
  else cands.push([ineq(v, FLIP[op], b), "reverses-the-symbol-although-the-divisor-is-positive"]);
  if (Number.isInteger(alt) && alt !== b) cands.push([ineq(v, op2, alt), "makes-a-sign-error-with-the-constant"]);
  cands.push([ineq(v, SWAPSTRICT[op2], b), "confuses-strict-and-inclusive-symbols"], [ineq(v, op2, -b), "uses-the-opposite-of-the-bound"], [ineq(v, op2, b + (q < 0 ? 1 : -1)), "makes-an-arithmetic-slip"]);
  const ds = tdistr(text, cands);
  const lines = form === "lin"
    ? [`${q < 0 ? "Add" : "Subtract"} ${Math.abs(q)} ${q < 0 ? "to" : "from"} both sides: ${pI(r)} ${q < 0 ? "+" : MINUS} ${Math.abs(q)} = ${num(r - q)}`, `Divide both sides by ${pI(p)}: ${pI(r - q)} ${DIVIDE} ${pI(p)} = ${num(b)}`]
    : [`Divide both sides by ${pI(p)}: ${pI(r)} ${DIVIDE} ${pI(p)} = ${num(r / p)}`, `${q < 0 ? "Add" : "Subtract"} ${Math.abs(q)} ${q < 0 ? "to" : "from"} both sides: ${pI(r / p)} ${q < 0 ? "+" : MINUS} ${Math.abs(q)} = ${num(b)}`];
  lines.push(p < 0 ? `The divisor ${num(p)} is negative, so the symbol reverses: ${op} becomes ${op2}` : `The divisor is positive, so the symbol stays ${op}`, `The solutions are ${text}`);
  return finalize({
    family: "inequality",
    level: L,
    spec: { kind: "solve2", form, op, p, q, r, v },
    stem: T3("", "", ""),
    ask: T3(`Solve: ${E}`, `Solve the inequality ${E}.`, `Solve the inequality ${E}, and write the solutions as an inequality.`),
    expr: E,
    answer: { value: text, text, kind: "text" },
    work: lines,
    visual: null,
    distractors: ds,
    hints: { conceptual: "Multiplying or dividing both sides by a negative number reverses the order of the numbers, so the inequality symbol must reverse too.", procedural: "Undo the adding or subtracting first. Then divide by the coefficient. Check whether that number is negative before you decide which way the symbol points." },
  });
}
function ineqGraph(rng, L) {
  const op = rng.pick([">", "<", GE, LE]);
  const v = rng.pick(["x", "n", "t"]);
  const c = ri(rng, -4, 8);
  const right = op === ">" || op === GE;
  const lo = c - 5;
  const hi = c + 5;
  const text = ineq(v, op, c);
  const ds = tdistr(text, [
    [ineq(v, FLIP[op], c), "reverses-the-direction-of-the-arrow"],
    [ineq(v, SWAPSTRICT[op], c), "confuses-open-and-closed-circles"],
    [ineq(v, FLIP[SWAPSTRICT[op]], c), "reverses-both-the-arrow-and-the-circle"],
    [`${v} = ${c}`, "reads-the-graph-as-a-single-point"],
  ]);
  return finalize({
    family: "inequality",
    level: L,
    spec: { kind: "graph", v, op, c },
    stem: T3(`The number line shows all the solutions of an inequality in ${v}.`, `The graph shows all the solutions of an inequality in ${v}.`, `The number line graph shows all the solutions of an inequality in ${v}.`),
    ask: T3("Which inequality does the graph show?", "Which inequality does the graph show?", "Which inequality has this graph as its set of solutions?"),
    expr: null,
    answer: { value: text, text, kind: "text" },
    work: [`The circle is at ${num(c)}, so the boundary is ${num(c)}`, `${isStrict(op) ? "An open circle means the boundary is not included" : "A closed circle means the boundary is included"}`, `The arrow points ${right ? "right, toward greater numbers" : "left, toward lesser numbers"}`, `The inequality is ${text}`],
    visual: { kind: "numberline", alt: `A number line from ${num(lo)} to ${num(hi)}. ${isStrict(op) ? "An open circle" : "A closed circle"} is drawn at ${num(c)} with a shaded arrow pointing to the ${right ? "right" : "left"}.`, min: lo, max: hi, ticks: hi - lo, marks: [{ at: c, label: num(c), hollow: isStrict(op) }], hops: [{ from: c, to: right ? hi : lo, label: "" }], show: "int" },
    distractors: ds,
    hints: { conceptual: "An open circle means the number is not a solution. A closed circle means it is. The arrow points toward the solutions.", procedural: "Read the circle first, then the direction of the arrow. Choose the symbol that matches both." },
  });
}
FAMILIES.inequality = {
  title: "Inequalities",
  grades: [6, 7],
  defaults: { steps: 1 },
  gen(rng, P, { level = 1 } = {}) {
    if (P.steps === 2) return rng.pick(level === 1 ? [ineqWhich, ineqSolve2, ineqGraph, ineqWrite] : level === 2 ? [ineqSolve2, ineqSolve2, ineqGraph, ineqWhich, ineqWrite] : [ineqSolve2, ineqSolve2, ineqGraph, ineqSolve2])(rng, level);
    return rng.pick(level === 1 ? [ineqWrite, ineqWrite, ineqWhich, ineqWhich] : level === 2 ? [ineqWrite, ineqWhich, ineqSolve1, ineqSolve1] : [ineqSolve1, ineqSolve1, ineqWhich, ineqWrite])(rng, level);
  },
  check(p, params) {
    const P = { steps: 1, ...params };
    const ok = P.steps === 2 ? ["which", "solve2", "graph", "write"] : ["write", "which", "solve1"];
    return ok.includes(p.spec.kind) ? null : `steps ${P.steps} produced a ${p.spec.kind} problem`;
  },
};

// ================================================================================================ indepdep (g6.variables)
const MULSC = [
  { xn: "hours worked", yn: "money earned", cn: "the pay for each hour", ks: [7, 8, 9, 10, 12, 15], story: (k, W) => `${W} earns $${k} for each hour of work.` },
  { xn: "number of tickets", yn: "total cost", cn: "the price of one ticket", ks: [3, 4, 5, 6, 8, 12], story: (k) => `Tickets for the school play cost $${k} each.` },
  { xn: "minutes of reading", yn: "pages read", cn: "the pages read each minute", ks: [2, 3, 4, 5], story: (k, W) => `${W} reads ${k} pages every minute.` },
  { xn: "number of days", yn: "cans collected", cn: "the cans collected each day", ks: [6, 8, 9, 12, 15], story: (k) => `A class collects ${k} cans of food each day.` },
  { xn: "hours of driving", yn: "miles traveled", cn: "the speed of the bus", ks: [40, 45, 50, 55, 60], story: (k) => `A bus travels at a steady ${k} miles per hour.` },
  { xn: "number of packs", yn: "number of markers", cn: "the markers in each pack", ks: [4, 6, 8, 10, 12], story: (k) => `Each pack has ${k} markers.` },
];
const ADDSC = [
  { xn: "Kofi's age", yn: "Lucia's age", cn: "the number of years between their ages", cs: [2, 3, 4, 5, 6], story: (c) => `Lucia is ${c} years older than Kofi.` },
  { xn: "students in the room at first", yn: "students in the room later", cn: "the number of students who join", cs: [3, 4, 5, 6, 8], story: (c) => `${c} more students join the class.` },
  { xn: "starting temperature", yn: "temperature later", cn: "the number of degrees it rises", cs: [3, 4, 5, 6, 7], story: (c) => `The temperature rises ${c} degrees.` },
];
function idScenario(rng, L, forceKind) {
  const mul = forceKind ? forceKind === "mul" : rng.chance(L === 1 ? 0.8 : 0.55);
  const W = rng.pick(NAMES);
  if (mul) {
    const sc = rng.pick(MULSC);
    const k = rng.pick(sc.ks);
    return { mul, sc, k, story: sc.story(k, W), W };
  }
  const sc = rng.pick(ADDSC);
  const c = rng.pick(sc.cs);
  return { mul, sc, k: c, story: sc.story(c, W), W };
}
const idRows = (rng, S_) => {
  const s = ri(rng, 1, 3);
  const d = rng.pick([1, 1, 2]);
  const xs = [0, 1, 2, 3].map((i) => s + i * d);
  return xs.map((x) => [x, S_.mul ? S_.k * x : x + S_.k]);
};
const eqOf = (S_) => (S_.mul ? `y = ${S_.k}x` : `y = x + ${S_.k}`);

function idRole(rng, L) {
  const S_ = idScenario(rng, L);
  const askDep = rng.chance(0.55);
  const ans_ = askDep ? S_.sc.yn : S_.sc.xn;
  const other = askDep ? S_.sc.xn : S_.sc.yn;
  const ds = tdistr(ans_, [
    [other, "swaps-the-independent-and-dependent-variables"],
    [S_.sc.cn, "treats-a-constant-as-a-variable"],
    ["Neither: the two quantities are not related", "thinks-the-quantities-are-unrelated"],
  ]);
  return finalize({
    family: "indepdep",
    level: L,
    spec: { kind: "role", indep: S_.sc.xn, dep: S_.sc.yn, ask: askDep ? "dependent" : "independent" },
    stem: T3(`${S_.story} Think about the ${S_.sc.xn} and the ${S_.sc.yn}.`, `${S_.story} The ${S_.sc.xn} and the ${S_.sc.yn} change together.`, `${S_.story} The ${S_.sc.xn} and the ${S_.sc.yn} vary together.`),
    ask: askDep ? T3("Which quantity is the dependent variable?", "Which quantity is the dependent variable?", "Which quantity is the dependent variable, the one whose value depends on the other?") : T3("Which quantity is the independent variable?", "Which quantity is the independent variable?", "Which quantity is the independent variable, the one that can be chosen freely?"),
    expr: null,
    answer: { value: ans_, text: ans_, kind: "text" },
    work: [`Ask which quantity you can choose or change freely: the ${S_.sc.xn}`, `Ask which quantity is found from the other one: the ${S_.sc.yn}`, `The ${askDep ? "dependent" : "independent"} variable is the ${ans_}`],
    visual: null,
    distractors: ds,
    hints: { conceptual: "The independent variable is the one you choose or change. The dependent variable is the one that changes because of it.", procedural: "Try changing each quantity in your mind. Which one forces the other one to change?" },
  });
}
function idRole2(rng, L) {
  const S_ = idScenario(rng, L);
  const isDep = rng.chance(0.5);
  const target = isDep ? S_.sc.yn : S_.sc.xn;
  const text = isDep ? "dependent" : "independent";
  const ds = tdistr(text, [
    [isDep ? "independent" : "dependent", "swaps-the-independent-and-dependent-variables"],
    ["a constant, because it never changes", "treats-a-variable-as-a-constant"],
    ["neither, because the quantities are unrelated", "thinks-the-quantities-are-unrelated"],
  ]);
  return finalize({
    family: "indepdep",
    level: L,
    spec: { kind: "role2", indep: S_.sc.xn, dep: S_.sc.yn, target: isDep ? "dep" : "indep" },
    stem: T3(`${S_.story}`, `${S_.story} The ${S_.sc.xn} and the ${S_.sc.yn} change together.`, `${S_.story} The ${S_.sc.xn} and the ${S_.sc.yn} vary together.`),
    ask: T3(`Is the ${target} the independent or the dependent variable?`, `Is the ${target} the independent variable or the dependent variable?`, `Classify the ${target} as the independent variable or the dependent variable.`),
    expr: null,
    answer: { value: text, text, kind: "text" },
    work: [`The ${S_.sc.xn} is the quantity that can be chosen freely`, `The ${S_.sc.yn} is found from it`, `So the ${target} is the ${text} variable`],
    visual: null,
    distractors: ds,
    hints: { conceptual: "One quantity can be chosen or changed freely. The other quantity gets its value from that choice.", procedural: "Ask: if I pick a value for this quantity, does that decide the other one, or the other way around?" },
  });
}
function idEqTable(rng, L) {
  const S_ = idScenario(rng, L);
  const rows = idRows(rng, S_);
  const text = eqOf(S_);
  const [x1, y1] = rows[0];
  const cands = S_.mul
    ? [[`y = x + ${y1 - x1}`, "uses-addition-from-the-first-row-only"], [`x = ${S_.k}y`, "swaps-the-two-variables"], [`y = ${S_.k + 1}x`, "off-by-one-in-the-multiplier"], [`y = ${S_.k}x + 1`, "adds-an-extra-constant"]]
    : [[`y = ${S_.k}x`, "multiplies-instead-of-adding"], [`x = y + ${S_.k}`, "swaps-the-two-variables"], [`y = x + ${S_.k + 1}`, "off-by-one-in-the-constant"], [`y = x ${MINUS} ${S_.k}`, "subtracts-instead-of-adding"]];
  return finalize({
    family: "indepdep",
    level: L,
    spec: { kind: "eqtable", rows, x: "x", y: "y" },
    stem: T3(`${S_.story} The table shows some values. Let x be the ${S_.sc.xn} and y be the ${S_.sc.yn}.`, `${S_.story} The table shows some values. Let x be the ${S_.sc.xn} and let y be the ${S_.sc.yn}.`, `${S_.story} The table shows corresponding values. Let x represent the ${S_.sc.xn} and y represent the ${S_.sc.yn}.`),
    ask: T3("Which equation matches the table?", "Which equation matches the table?", "Which equation represents the relationship shown in the table?"),
    expr: null,
    answer: { value: text, text, kind: "text" },
    work: [S_.mul ? `Divide y by x in each row: ${rows.map(([x, y]) => `${y} ${DIVIDE} ${x} = ${S_.k}`).join(", ")}` : `Subtract x from y in each row: ${rows.map(([x, y]) => `${y} ${MINUS} ${x} = ${S_.k}`).join(", ")}`, S_.mul ? `Every y is ${S_.k} times x, so y is ${S_.k}x` : `Every y is ${S_.k} more than x, so y is x + ${S_.k}`, `The equation is ${text}`],
    visual: { kind: "table", alt: "A table with two columns of values, one for x and one for y.", headers: [`${S_.sc.xn} (x)`, `${S_.sc.yn} (y)`], rows: rows.map((r) => r.map(String)), caption: "Values of x and y" },
    distractors: tdistr(text, cands),
    hints: { conceptual: "In a table, look for the same rule in every row. Test whether y is x times a number or x plus a number.", procedural: "Check one row with the equation, then check a second row. An equation must work for every row." },
  });
}
function idMissing(rng, L) {
  const S_ = idScenario(rng, L);
  const rows = idRows(rng, S_);
  const hideRow = ri(rng, 1, 3);
  const hideX = L >= 2 && rng.chance(0.4);
  const val = hideX ? rows[hideRow][0] : rows[hideRow][1];
  const shown = rows.map((r, i) => (i === hideRow ? (hideX ? [null, r[1]] : [r[0], null]) : r));
  const [px, py] = rows[hideRow - 1];
  const [x, y] = rows[hideRow];
  const cands = hideX
    ? [[S_.mul ? y - S_.k : y / S_.k, S_.mul ? "subtracts-instead-of-dividing" : "divides-instead-of-subtracting"], [px + (y - py), "adds-the-same-number-as-the-other-column"], [y, "copies-the-other-number-in-the-row"], [y + S_.k, "adds-instead-of-undoing-the-rule"]]
    : [[py + (x - px), "adds-the-same-number-as-the-other-column"], [S_.mul ? x + S_.k : x * S_.k, S_.mul ? "adds-instead-of-multiplying" : "multiplies-instead-of-adding"], [x, "copies-the-other-number-in-the-row"], [y + S_.k, "off-by-the-rule-amount"]];
  return finalize({
    family: "indepdep",
    level: L,
    spec: { kind: "missing", rows: shown },
    stem: T3(`${S_.story} The table shows values of x, the ${S_.sc.xn}, and y, the ${S_.sc.yn}. One box is empty.`, `${S_.story} The table shows x, the ${S_.sc.xn}, and y, the ${S_.sc.yn}. One box is empty.`, `${S_.story} The table shows x, the ${S_.sc.xn}, and y, the ${S_.sc.yn}. One entry is missing.`),
    ask: T3("What number goes in the empty box?", "What number belongs in the empty box?", "Determine the missing entry in the table."),
    expr: null,
    answer: { value: String(val), text: String(val), kind: "int" },
    work: [S_.mul ? `Find the rule: ${rows[0][1]} ${DIVIDE} ${rows[0][0]} = ${S_.k}, so y = ${S_.k}x` : `Find the rule: ${rows[0][1]} ${MINUS} ${rows[0][0]} = ${S_.k}, so y = x + ${S_.k}`, hideX ? `Use the rule backwards for y = ${y}` : `Use the rule with x = ${x}`, `The missing number is ${val}`],
    visual: { kind: "table", alt: "A table with two columns for x and y. One box is empty.", headers: [`${S_.sc.xn} (x)`, `${S_.sc.yn} (y)`], rows: shown.map((r) => r.map((c) => (c === null ? "?" : String(c)))), caption: "Values of x and y" },
    distractors: distr(fr(val), { k: "int" }, cands.map(([a, b]) => [Number.isInteger(a) ? a : null, b]), { pos: true }),
    hints: { conceptual: "A table follows one rule in every row. Find the rule from a complete row, then use it for the empty box.", procedural: "Find how y is made from x in a row that is complete. Test the rule on a second complete row, then use it." },
  });
}
function idSub(rng, L) {
  const S_ = idScenario(rng, L);
  const x = ri(rng, 2, L === 1 ? 9 : 12);
  const y = S_.mul ? S_.k * x : x + S_.k;
  const findX = L >= 2 && rng.chance(0.5);
  const val = findX ? x : y;
  const eq = eqOf(S_);
  const cands = findX
    ? [[S_.mul ? y - S_.k : Math.round(y / S_.k), S_.mul ? "subtracts-instead-of-dividing" : "divides-instead-of-subtracting"], [S_.mul ? y * S_.k : y + S_.k, S_.mul ? "multiplies-instead-of-dividing" : "adds-instead-of-subtracting"], [S_.k, "gives-the-number-in-the-equation"], [x + 1, "off-by-one"]]
    : [[S_.mul ? x + S_.k : x * S_.k, S_.mul ? "adds-instead-of-multiplying" : "multiplies-instead-of-adding"], [S_.mul ? x - S_.k : x - S_.k, "subtracts-instead-of-using-the-rule"], [S_.k, "gives-the-number-in-the-equation"], [y + 1, "off-by-one"]];
  return finalize({
    family: "indepdep",
    level: L,
    spec: { kind: "sub", form: S_.mul ? "mul" : "add", k: S_.k, value: findX ? y : x, find: findX ? "x" : "y" },
    stem: T3(`${S_.story} The equation ${eq} describes it. Here x is the ${S_.sc.xn} and y is the ${S_.sc.yn}.`, `${S_.story} The equation ${eq} describes this. Here x is the ${S_.sc.xn} and y is the ${S_.sc.yn}.`, `${S_.story} The equation ${eq} models this situation, where x is the ${S_.sc.xn} and y is the ${S_.sc.yn}.`),
    ask: findX ? T3(`What is x when y is ${y}?`, `What is x when y is ${y}?`, `Find the value of x when y is ${y}.`) : T3(`What is y when x is ${x}?`, `What is y when x is ${x}?`, `Find the value of y when x is ${x}.`),
    expr: eq,
    answer: { value: String(val), text: String(val), kind: "int" },
    work: findX ? [`Put ${y} in for y: ${S_.mul ? `${S_.k}x = ${y}` : `x + ${S_.k} = ${y}`}`, S_.mul ? `Divide both sides by ${S_.k}: ${y} ${DIVIDE} ${S_.k} = ${x}` : `Subtract ${S_.k} from both sides: ${y} ${MINUS} ${S_.k} = ${x}`] : [`Put ${x} in for x: ${S_.mul ? `${S_.k} ${TIMES} ${x}` : `${x} + ${S_.k}`}`, S_.mul ? `${S_.k} ${TIMES} ${x} = ${y}` : `${x} + ${S_.k} = ${y}`],
    visual: null,
    distractors: distr(fr(val), { k: "int" }, cands.map(([a, b]) => [Number.isInteger(a) ? a : null, b])),
    hints: { conceptual: "The equation tells how the dependent variable is found from the independent variable. Substitute the number you know.", procedural: findX ? "Put the known value in for y. Then undo the operation to get x by itself." : "Put the known value in for x. Then do the arithmetic the equation shows." },
  });
}
FAMILIES.indepdep = {
  title: "Independent and dependent variables",
  grades: [6],
  defaults: {},
  gen(rng, P, { level = 1 } = {}) {
    const pool = level === 1 ? [idRole, idRole2, idSub, idMissing] : level === 2 ? [idEqTable, idMissing, idRole, idSub, idEqTable] : [idEqTable, idMissing, idSub, idRole2, idEqTable];
    return rng.pick(pool)(rng, level);
  },
};
