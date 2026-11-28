// Math Literacy Studio: problem families for grades 3-4 (the fraction, decimal, measurement and line-plot families are also
// reused by grades 5-6 through params). Every generator is seeded (kit.makeRng), ends in kit.finalize, and is re-solved
// independently by tools/mls-verify/g34.mjs from `spec` alone.
//
// opts.level (1-3) is mathematical complexity inside the skill's grade: 1 = smaller numbers, one step, a picture; 3 = a bigger
// or extra step, still on grade. opts.ctx picks the story setting. Language levels (plain/standard/rich) always carry the
// same numerals. No stem reveals its operation through a cue word: the same phrases are used with different operations.
//
// Families and the params each honours (unknown params are ignored; defaults in each family's `defaults`):
//   muldiv     max (largest factor, default 10; products stay within max x max), story (true: only story problems),
//              steps (2 with story:true adds a second operation), mode ("factfamily": fact families and division as an unknown factor)
//   properties mode ("commute": commutative/associative; "distribute": distributive, tens and strategy comparison)
//   fracid     maxDen (largest denominator, default 8)
//   fracline   maxDen (largest denominator, default 8)
//   areaperim  max (largest side length, default 12)
//   elapsed    (none) time within/across the hour, liquid volume and mass in the same unit
//   multidigit (none) level picks the operation mix; remainders only when the ask says how to write them ("23 r 2")
//   multcompare (none) "n times as many" vs "n more than"
//   factors    max (largest number used anywhere in the problem, default 100)
//   fracequiv  (none) equivalent fractions, comparing with unlike denominators
//   fracops    level: "like" (grade 4), "unlike" (grade 5), "scale" (multiplication as scaling), "divide" (fraction / fraction)
//   decimals   places (1-3 decimal places in operands, default 2), ops (true adds + - x / with decimals)
//   convert    system ("mixed" | "metric" | "customary"), decimals (true allows non-integer results)
//   angles     (none)
//   lineplot   frac (always fractional scales), operations (true adds total and equal-share mean)
import { Fr, MINUS, TIMES, DIVIDE, NAMES, CONTEXTS, twoNames, num, finalize, gcd } from "../kit.js";

// ---------------------------------------------------------------------------------------------------- helpers
const T3 = (plain, standard, rich) => ({ plain, standard, rich });
const S3 = (s) => ({ plain: s, standard: s, rich: s });
const vnum = (v) => (v instanceof Fr ? v.value : v);
const fmtInt = (v) => (Number.isInteger(v) && v >= 0 ? num(v) : null);
const plain = (n) => String(n);

/** Distractors: candidates are [value, tag, textOverride?]; a candidate equal to the answer, negative, unformattable or repeated is dropped. */
function mkD(ans, ansText, cands, fmt, n = 3) {
  const a = vnum(ans);
  const seen = new Set([String(ansText).trim().toLowerCase()]);
  const out = [];
  for (const c of cands) {
    if (!c) continue;
    const [v, tag, over] = c;
    if (v == null) continue;
    const x = vnum(v);
    if (!Number.isFinite(x) || x < 1e-9 || Math.abs(x - a) < 1e-9) continue;
    const t = over ?? fmt(v);
    if (t == null) continue;
    const k = String(t).trim().toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ text: String(t), misconception: tag });
    if (out.length >= n) break;
  }
  return out;
}
/** Text distractors (no numeric comparison): [text, tag]. */
function mkT(ansText, cands, n = 3) {
  const seen = new Set([String(ansText).trim().toLowerCase()]);
  const out = [];
  for (const c of cands) {
    if (!c) continue;
    const [t, tag] = c;
    if (t == null) continue;
    const k = String(t).trim().toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ text: String(t), misconception: tag });
    if (out.length >= n) break;
  }
  return out;
}
const nearInts = (a) => [[a + 1, "off-by-one"], [a - 1, "off-by-one"], [a + 10, "place-value-slip"], [a + 2, "counting-slip"], [a * 2, "doubled-the-answer"], [a + 5, "counting-slip"], [a - 2, "counting-slip"], [a + 3, "counting-slip"]];
const ansInt = (n) => ({ value: String(n), text: num(n), kind: "int" });
const STRUCT = (happening, known, unknown, relationship, model, reasonable) => ({ happening, known, unknown, relationship, model, reasonable });
const fail = (m) => {
  throw new Error(m);
};
/** Retry a constructor until it returns something (generators sometimes need a lucky draw to satisfy a bound). */
function until(fn, tries = 60) {
  for (let i = 0; i < tries; i++) {
    const r = fn(i);
    if (r) return r;
  }
  return fail("could not build a problem inside the bounds");
}
/** Story packs: [container one, container many, item one, item many] per context ("each shelf has 6 books"). */
const PACKS = {
  store: [["box", "boxes", "pencil", "pencils"], ["pack", "packs", "sticker", "stickers"], ["bag", "bags", "eraser", "erasers"], ["shelf", "shelves", "notebook", "notebooks"]],
  garden: [["row", "rows", "tomato plant", "tomato plants"], ["tray", "trays", "seed", "seeds"], ["bed", "beds", "flower", "flowers"], ["pot", "pots", "bean plant", "bean plants"]],
  sports: [["team", "teams", "player", "players"], ["bag", "bags", "cone", "cones"], ["box", "boxes", "ball", "balls"], ["relay team", "relay teams", "runner", "runners"]],
  kitchen: [["tray", "trays", "cookie", "cookies"], ["box", "boxes", "muffin", "muffins"], ["bowl", "bowls", "apple", "apples"], ["plate", "plates", "slice of bread", "slices of bread"]],
  pets: [["tank", "tanks", "fish", "fish"], ["cage", "cages", "bird", "birds"], ["pen", "pens", "rabbit", "rabbits"], ["bag", "bags", "dog treat", "dog treats"]],
  library: [["shelf", "shelves", "book", "books"], ["stack", "stacks", "magazine", "magazines"], ["box", "boxes", "bookmark", "bookmarks"], ["table", "tables", "chair", "chairs"]],
  crafts: [["bag", "bags", "bead", "beads"], ["box", "boxes", "ribbon", "ribbons"], ["pack", "packs", "paper star", "paper stars"], ["tray", "trays", "tile", "tiles"]],
  travel: [["bus", "buses", "rider", "riders"], ["rack", "racks", "bike", "bikes"], ["envelope", "envelopes", "ticket", "tickets"], ["row", "rows", "backpack", "backpacks"]],
  science: [["tray", "trays", "plant", "plants"], ["box", "boxes", "magnet", "magnets"], ["bag", "bags", "rock", "rocks"], ["shelf", "shelves", "beaker", "beakers"]],
  community: [["row", "rows", "tree", "trees"], ["stack", "stacks", "flyer", "flyers"], ["crate", "crates", "can of soup", "cans of soup"], ["wall", "walls", "poster", "posters"]],
};
function pack(rng, ctx) {
  const [co, cm, io, im] = rng.pick(PACKS[ctx] || PACKS.store);
  return { co, cm, io, im };
}

// ---------------------------------------------------------------------------------------------------- muldiv
const MD_HINT_C = "Equal groups: the number of groups times the size of each group is the total.";
function mdEq(rng, M, lv, poolOverride) {
  const lo = lv === 3 && M >= 8 ? 4 : 2;
  const hi = lv === 1 ? Math.min(M, 5) : M;
  const f = () => rng.int(lo, Math.max(lo, hi));
  const pool = lv === 1 ? ["mulc", "divc"] : lv === 2 ? ["mulc", "mula", "mulb", "divc", "divb"] : ["mula", "mulb", "diva", "divb", "divc", "mulc"];
  const kind = rng.pick(poolOverride || pool);
  let a, b, c, op, unknown, ans;
  if (kind.startsWith("mul")) {
    a = f();
    b = f();
    c = a * b;
    op = "mul";
    unknown = kind === "mulc" ? "c" : kind === "mula" ? "a" : "b";
    ans = unknown === "c" ? c : unknown === "a" ? a : b;
  } else {
    b = f();
    c = f();
    a = b * c;
    op = "div";
    unknown = kind === "divc" ? "c" : kind === "diva" ? "a" : "b";
    ans = unknown === "c" ? c : unknown === "a" ? a : b;
  }
  const show = { a: unknown === "a" ? "?" : num(a), b: unknown === "b" ? "?" : num(b), c: unknown === "c" ? "?" : num(c) };
  const sym = op === "mul" ? TIMES : DIVIDE;
  const expr = `${show.a} ${sym} ${show.b} = ${show.c}`;
  let cands;
  let work;
  let hp;
  let hc = MD_HINT_C;
  if (op === "mul" && unknown === "c") {
    cands = [[a + b, "added-instead-of-multiplied"], [c + a, "one-group-too-many"], [c - b, "one-group-too-few"], [a * (b + 1) + 1, "near-fact-slip"]];
    work = [`Multiply the factors: ${a} ${TIMES} ${b} = ${c}.`];
    hp = "Skip count by one factor, or use a fact you know that is close.";
  } else if (op === "mul") {
    const known = unknown === "a" ? b : a;
    cands = [[c - known, "subtracted-instead-of-divided"], [c + known, "added-instead-of-divided"], [known, "repeated-the-known-factor"], [ans + 1, "off-by-one"], [c, "repeated-the-product"]];
    work = [`Divide the product by the factor you know: ${c} ${DIVIDE} ${known} = ${ans}`, `Check: ${known} ${TIMES} ${ans} = ${c}`];
    hp = "Turn it into a division question: what do you multiply the known factor by to get the product?";
  } else if (unknown === "c") {
    cands = [[a - b, "subtracted-instead-of-divided"], [a * b, "multiplied-instead-of-divided"], [c + 1, "off-by-one"], [c - 1, "off-by-one"], [b, "answered-with-the-divisor"]];
    work = [`Think of a multiplication fact: ${b} ${TIMES} ? = ${a}`, `${b} ${TIMES} ${c} = ${a}, so ${a} ${DIVIDE} ${b} = ${c}`];
    hp = "Ask: how many groups of the divisor fit into the dividend? Use a multiplication fact.";
    hc = "Division and multiplication use the same three numbers. Division finds a missing factor.";
  } else if (unknown === "a") {
    cands = [[c + b, "added-instead-of-multiplied"], [c * b + b, "one-group-too-many"], [c * b - c, "one-group-too-few"], [c, "answered-with-the-quotient"], [c * b + 1, "off-by-one"]];
    work = [`Undo the division with multiplication: ${c} ${TIMES} ${b} = ${a}`, `Check: ${a} ${DIVIDE} ${b} = ${c}`];
    hp = "If a number is shared into groups of the same size, how could you rebuild the starting number?";
    hc = "Division undoes multiplication, so the missing starting number is a product.";
  } else {
    cands = [[a - c, "subtracted-instead-of-divided"], [c, "answered-with-the-quotient"], [a / c + 1, "off-by-one"], [a / c - 1, "off-by-one"], [a + c, "added-instead-of-divided"]];
    work = [`Think of a multiplication fact: ${c} ${TIMES} ? = ${a}`, `${c} ${TIMES} ${b} = ${a}, so ${a} ${DIVIDE} ${c} = ${b}`];
    hp = "Write a multiplication sentence with the same numbers and a missing factor.";
    hc = "Division can ask how big each group is. Multiplication can check it.";
  }
  const lvl1 = lv === 1 && op === "mul" && unknown === "c";
  return finalize({
    family: "muldiv",
    spec: { type: "eq", op, a: unknown === "a" ? null : a, b: unknown === "b" ? null : b, c: unknown === "c" ? null : c, unknown },
    stem: S3(expr),
    ask: T3("Find the missing number.", "What is the missing number?", "Determine the missing number in the equation."),
    expr,
    answer: ansInt(ans),
    work,
    visual: lvl1 ? { kind: "array", alt: `An array with ${a} rows and ${b} columns of dots.`, rows: a, cols: b, label: true } : null,
    distractors: mkD(ans, num(ans), [...cands, ...nearInts(ans)], fmtInt),
    hints: { conceptual: hc, procedural: hp },
    level: lv,
  });
}

function mdGroups(rng, M, lv, ctx, forceUnknown) {
  const lo = lv === 3 && M >= 8 ? 4 : 2;
  const hi = lv === 1 ? Math.min(M, 5) : M;
  const g = rng.int(lo, Math.max(lo, hi));
  const e = rng.int(lo, Math.max(lo, hi));
  const t = g * e;
  const unknown = forceUnknown || rng.pick(lv === 1 ? ["t", "t", "e", "g"] : ["t", "e", "g"]);
  const [A] = rng.sample(NAMES, 1);
  const P = pack(rng, ctx);
  let stem;
  let ask;
  let ans;
  let cands;
  let work;
  let structure;
  let hp;
  let hc;
  if (unknown === "t") {
    const v = rng.int(0, 1);
    stem =
      v === 0
        ? T3(`${A} has ${g} ${P.cm}. Each ${P.co} has ${e} ${P.im}.`, `${A} has ${g} ${P.cm}, and each ${P.co} has ${e} ${P.im}.`, `${A} arranges ${g} ${P.cm}, each with ${e} ${P.im}.`)
        : T3(`There are ${g} ${P.cm}. ${A} counts ${e} ${P.im} in each ${P.co}.`, `There are ${g} ${P.cm}, and ${A} counts ${e} ${P.im} in each ${P.co}.`, `${A} inspects ${g} ${P.cm} and finds ${e} ${P.im} in every ${P.co}.`);
    ask = T3(`How many ${P.im} are there?`, `How many ${P.im} are there in all?`, `What is the total number of ${P.im}?`);
    ans = t;
    cands = [[g + e, "added-instead-of-multiplied"], [t + e, "one-group-too-many"], [t - g, "one-group-too-few"], [t + g, "one-group-too-many"]];
    work = [`${g} groups of ${e} is ${g} ${TIMES} ${e} = ${t}`];
    hp = "Skip count by the size of one group, once for each group.";
    hc = MD_HINT_C;
    structure = STRUCT(`${A} has equal groups of ${P.im}.`, [{ label: `number of ${P.cm}`, value: g }, { label: `${P.im} in each ${P.co}`, value: e }], `total ${P.im}`, "groups x size of each group = total", "equal groups (tape or array)", "The total is more than the number of groups and more than the size of one group.");
  } else if (unknown === "e") {
    stem = T3(`${A} has ${t} ${P.im}. ${A} puts the same number in each of ${g} ${P.cm}.`, `${A} puts ${t} ${P.im} into ${g} ${P.cm}. Every ${P.co} gets the same number.`, `${A} distributes ${t} ${P.im} equally among ${g} ${P.cm}.`);
    ask = T3(`How many ${P.im} are in each ${P.co}?`, `How many ${P.im} are in each ${P.co}?`, `How many ${P.im} does each ${P.co} get?`);
    ans = e;
    cands = [[t - g, "subtracted-instead-of-divided"], [t * g, "multiplied-instead-of-divided"], [g, "answered-with-the-number-of-groups"], [e + 1, "off-by-one"]];
    work = [`Share ${t} equally into ${g} groups: ${t} ${DIVIDE} ${g} = ${e}`, `Check: ${g} ${TIMES} ${e} = ${t}`];
    hp = "Ask: what number times the number of groups makes the total?";
    hc = "Sharing equally is division. The size of each group is a missing factor.";
    structure = STRUCT(`${A} shares ${P.im} equally.`, [{ label: `total ${P.im}`, value: t }, { label: `number of ${P.cm}`, value: g }], `${P.im} in each ${P.co}`, "total / groups = size of each group", "equal groups (tape)", "Each group is smaller than the total.");
  } else {
    const q = rng.int(0, 1);
    stem = T3(`${A} has ${t} ${P.im}. Each ${P.co} gets ${e} ${P.im}.`, `${A} has ${t} ${P.im} and puts ${e} ${P.im} in each ${P.co}.`, `${A} has ${t} ${P.im} to sort into ${P.cm}, with ${e} ${P.im} in each ${P.co}.`);
    ask = q === 0 ? T3(`How many ${P.cm} does ${A} need?`, `How many ${P.cm} does ${A} fill?`, `How many ${P.cm} are needed?`) : T3(`How many ${P.cm} are there?`, `How many ${P.cm} are there in all?`, `What is the number of ${P.cm}?`);
    ans = g;
    cands = [[t - e, "subtracted-instead-of-divided"], [t * e, "multiplied-instead-of-divided"], [e, "answered-with-the-group-size"], [g + 1, "off-by-one"]];
    work = [`Count how many groups of ${e} fit in ${t}: ${t} ${DIVIDE} ${e} = ${g}`, `Check: ${g} ${TIMES} ${e} = ${t}`];
    hp = "Ask: how many groups of that size make the total?";
    hc = "Making equal groups from a total is division. The number of groups is a missing factor.";
    structure = STRUCT(`${A} sorts ${P.im} into equal groups.`, [{ label: `total ${P.im}`, value: t }, { label: `${P.im} in each ${P.co}`, value: e }], `number of ${P.cm}`, "total / size of each group = number of groups", "equal groups (tape)", "There are fewer groups than items.");
  }
  const visual =
    lv === 1 && unknown === "t" ? { kind: "array", alt: `An array with ${g} rows and ${e} columns.`, rows: g, cols: e, label: true } : lv === 1 && t <= 50 ? { kind: "counters", alt: `${t} counters.`, n: t, perRow: 10 } : null;
  return finalize({
    family: "muldiv",
    spec: { type: "groups", g: unknown === "g" ? null : g, e: unknown === "e" ? null : e, t: unknown === "t" ? null : t, unknown },
    stem,
    ask,
    expr: unknown === "t" ? `${g} ${TIMES} ${e} = ?` : unknown === "e" ? `${t} ${DIVIDE} ${g} = ?` : `${t} ${DIVIDE} ${e} = ?`,
    answer: ansInt(ans),
    work,
    visual,
    distractors: mkD(ans, num(ans), [...cands, ...nearInts(ans)], fmtInt),
    hints: { conceptual: hc, procedural: hp },
    structure,
    level: lv,
  });
}

function mdTwoStep(rng, M, lv, ctx) {
  const shapes = lv === 1 ? ["mul-add", "mul-sub"] : lv === 2 ? ["mul-add", "mul-sub", "add-div"] : ["mul-sub", "add-div", "sub-div", "mul-add"];
  const shape = rng.pick(shapes);
  const hi = lv === 1 ? Math.min(M, 5) : M;
  const lo = 2;
  const P = pack(rng, ctx);
  const [A, B] = twoNames(rng);
  let a;
  let b;
  let c;
  let stem;
  let ask;
  let ans;
  let cands;
  let work;
  let hp;
  let hc;
  let structure;
  if (shape === "mul-add" || shape === "mul-sub") {
    a = rng.int(lo, hi);
    b = rng.int(lo, hi);
    const t = a * b;
    if (shape === "mul-add") {
      c = rng.int(2, Math.max(3, Math.min(M, 9)));
      ans = t + c;
      stem = T3(`${A} has ${a} ${P.cm} with ${b} ${P.im} in each. ${A} gets ${c} more ${P.im}.`, `${A} has ${a} ${P.cm}, and each ${P.co} has ${b} ${P.im}. Then ${A} gets ${c} more ${P.im}.`, `${A} has ${a} ${P.cm} with ${b} ${P.im} in each ${P.co} and later receives ${c} additional ${P.im}.`);
      ask = T3(`How many ${P.im} does ${A} have now?`, `How many ${P.im} does ${A} have now?`, `How many ${P.im} does ${A} have in total?`);
      cands = [[a * (b + c), "added-before-multiplying"], [t, "stopped-after-the-first-step"], [a + b + c, "added-all-the-numbers"], [t - c, "used-the-wrong-operation"]];
      work = [`First find the ${P.im} in the ${P.cm}: ${a} ${TIMES} ${b} = ${t}`, `Then add the new ones: ${t} + ${c} = ${ans}`];
      structure = STRUCT(`${A} has equal groups and then gets more.`, [{ label: `${P.cm}`, value: a }, { label: `${P.im} in each`, value: b }, { label: `more ${P.im}`, value: c }], `${P.im} now`, "(groups x size) + more", "two-step equation", "The total is bigger than the amount in the groups alone.");
    } else {
      c = rng.int(2, Math.max(2, Math.min(t - 1, M + 2)));
      ans = t - c;
      stem = T3(`${A} has ${a} ${P.cm} with ${b} ${P.im} in each. ${A} gives away ${c} ${P.im}.`, `${A} has ${a} ${P.cm}, and each ${P.co} has ${b} ${P.im}. Then ${A} gives away ${c} ${P.im}.`, `${A} has ${a} ${P.cm} with ${b} ${P.im} in each ${P.co} and then gives ${c} ${P.im} to a friend.`);
      ask = T3(`How many ${P.im} does ${A} have left?`, `How many ${P.im} are left?`, `How many ${P.im} remain with ${A}?`);
      cands = [[t, "stopped-after-the-first-step"], [t + c, "added-instead-of-subtracted"], b > c ? [a * (b - c), "subtracted-before-multiplying"] : null, [a + b - c, "added-the-groups-and-size"]];
      work = [`First find all the ${P.im}: ${a} ${TIMES} ${b} = ${t}`, `Then take away the ones given away: ${t} ${MINUS} ${c} = ${ans}`];
      structure = STRUCT(`${A} has equal groups and then gives some away.`, [{ label: `${P.cm}`, value: a }, { label: `${P.im} in each`, value: b }, { label: `${P.im} given away`, value: c }], `${P.im} left`, "(groups x size) - given away", "two-step equation", "The amount left is less than the amount in the groups.");
    }
    hp = "Do one operation at a time. Write the first answer down before the second step.";
    hc = "Equal groups give a total. Then the story adds to it or takes from it.";
  } else {
    const q = rng.int(2, Math.max(2, hi));
    c = rng.int(2, Math.max(2, hi));
    const total = c * q;
    if (shape === "add-div") {
      a = rng.int(2, Math.max(2, total - 2));
      b = total - a;
      ans = q;
      stem = T3(`${A} has ${a} ${P.im}. ${B} has ${b} ${P.im}. They put all of them into ${c} ${P.cm}, the same number in each.`, `${A} has ${a} ${P.im} and ${B} has ${b} ${P.im}. They put all of their ${P.im} into ${c} ${P.cm}, with the same number in each ${P.co}.`, `${A} contributes ${a} ${P.im} and ${B} contributes ${b} ${P.im}. All of them are shared equally among ${c} ${P.cm}.`);
      ask = T3(`How many ${P.im} are in each ${P.co}?`, `How many ${P.im} are in each ${P.co}?`, `How many ${P.im} does each ${P.co} hold?`);
      cands = [[a + b, "stopped-after-the-first-step"], [total * c, "multiplied-instead-of-divided"], [b % c === 0 ? a + b / c : null, "divided-only-one-number"], [a - b > 0 ? (a - b) / c : null, "subtracted-instead-of-added"]];
      work = [`First put the ${P.im} together: ${a} + ${b} = ${total}`, `Then share equally: ${total} ${DIVIDE} ${c} = ${q}`];
      structure = STRUCT(`${A} and ${B} combine their ${P.im} and share them equally.`, [{ label: `${A}'s ${P.im}`, value: a }, { label: `${B}'s ${P.im}`, value: b }, { label: `number of ${P.cm}`, value: c }], `${P.im} in each ${P.co}`, "(a + b) / groups", "two-step equation", "Each group has fewer items than the combined total.");
    } else {
      b = rng.int(2, Math.max(2, Math.min(12, M * M - total)));
      a = total + b;
      if (a > M * M) return null;
      ans = q;
      stem = T3(`${A} has ${a} ${P.im}. ${A} gives ${b} ${P.im} to ${B}. ${A} puts the rest into ${c} ${P.cm}, the same number in each.`, `${A} has ${a} ${P.im} and gives ${b} ${P.im} to ${B}. Then ${A} puts the rest into ${c} ${P.cm}, with the same number in each ${P.co}.`, `${A} begins with ${a} ${P.im}, gives ${b} ${P.im} to ${B}, and shares the remaining ${P.im} equally among ${c} ${P.cm}.`);
      ask = T3(`How many ${P.im} are in each ${P.co}?`, `How many ${P.im} are in each ${P.co}?`, `How many ${P.im} does each ${P.co} hold?`);
      cands = [[a - b, "stopped-after-the-first-step"], [(a + b) % c === 0 ? (a + b) / c : null, "added-instead-of-subtracted"], [(a - b) * c, "multiplied-instead-of-divided"], [a % c === 0 ? a / c - b : null, "divided-before-subtracting"]];
      work = [`First find what is left: ${a} ${MINUS} ${b} = ${total}`, `Then share equally: ${total} ${DIVIDE} ${c} = ${q}`];
      structure = STRUCT(`${A} gives some away and shares the rest equally.`, [{ label: `${P.im} at the start`, value: a }, { label: `${P.im} given to ${B}`, value: b }, { label: `number of ${P.cm}`, value: c }], `${P.im} in each ${P.co}`, "(start - given away) / groups", "two-step equation", "Each group has fewer items than the amount left.");
    }
    hp = "Find the amount that gets shared first, then divide it.";
    hc = "Put the amounts together or take some away first. Then share what is left equally.";
  }
  return finalize({
    family: "muldiv",
    spec: { type: "two", shape, a, b, c },
    stem,
    ask,
    expr: shape === "mul-add" ? `(${a} ${TIMES} ${b}) + ${c} = ?` : shape === "mul-sub" ? `(${a} ${TIMES} ${b}) ${MINUS} ${c} = ?` : shape === "add-div" ? `(${a} + ${b}) ${DIVIDE} ${c} = ?` : `(${a} ${MINUS} ${b}) ${DIVIDE} ${c} = ?`,
    answer: ansInt(ans),
    work,
    visual: null,
    distractors: mkD(ans, num(ans), [...cands, ...nearInts(ans)], fmtInt),
    hints: { conceptual: hc, procedural: hp },
    structure,
    level: lv,
  });
}

function mdFam(rng, M, lv) {
  const lo = lv === 3 && M >= 8 ? 4 : 2;
  const hi = lv === 1 ? Math.min(M, 5) : M;
  const x = rng.int(lo, Math.max(lo, hi));
  const y = rng.int(lo, Math.max(lo, hi));
  const z = x * y;
  const find = rng.chance(0.5) ? "z÷x" : "z÷y";
  const ans = find === "z÷x" ? y : x;
  const div = find === "z÷x" ? x : y;
  const form = rng.pick(["usefact", "complete", "trio"]);
  let stem;
  let ask;
  if (form === "usefact") {
    stem = T3(`${x} ${TIMES} ${y} = ${z}.`, `You know that ${x} ${TIMES} ${y} = ${z}.`, `Given the multiplication fact ${x} ${TIMES} ${y} = ${z}, consider its fact family.`);
    ask = T3(`Find ${z} ${DIVIDE} ${div}.`, `Use the fact to find ${z} ${DIVIDE} ${div}.`, `Use the related multiplication fact to determine ${z} ${DIVIDE} ${div}.`);
  } else if (form === "complete") {
    stem = S3(`${x} ${TIMES} ${y} = ${z},  ${y} ${TIMES} ${x} = ${z},  ${z} ${DIVIDE} ${div} = ?`);
    ask = T3("What number goes in the blank?", "What number completes the fact family?", "Which number completes this fact family?");
  } else {
    stem = T3(`The numbers ${x}, ${y} and ${z} are a fact family.`, `A fact family uses the numbers ${x}, ${y} and ${z}.`, `The numbers ${x}, ${y} and ${z} form a multiplication and division fact family.`);
    ask = T3(`Find ${z} ${DIVIDE} ${div}.`, `What is ${z} ${DIVIDE} ${div}?`, `Determine the quotient ${z} ${DIVIDE} ${div}.`);
  }
  const cands = [[z - div, "subtracted-instead-of-divided"], [z, "repeated-the-product"], [div, "answered-with-the-divisor"], [x + y, "added-the-factors"], [z * div, "multiplied-instead-of-divided"]];
  return finalize({
    family: "muldiv",
    spec: { type: "fam", x, y, z, find },
    stem,
    ask,
    expr: `${z} ${DIVIDE} ${div} = ?`,
    answer: ansInt(ans),
    work: [`Think: ${div} ${TIMES} ? = ${z}`, `${x} ${TIMES} ${y} = ${z}, so ${z} ${DIVIDE} ${div} = ${ans}`],
    visual: lv === 1 ? { kind: "array", alt: `An array with ${x} rows and ${y} columns.`, rows: x, cols: y, label: true } : null,
    distractors: mkD(ans, num(ans), [...cands, ...nearInts(ans)], fmtInt),
    hints: { conceptual: "A fact family uses the same three numbers: two factors and their product.", procedural: "Turn the division into a multiplication with a missing factor, then use the fact." },
    level: lv,
  });
}

function genMuldiv(rng, p, o) {
  const M = Math.max(3, p.max | 0 || 10);
  const lv = o.level;
  if (p.mode === "factfamily") return rng.chance(0.55) ? mdFam(rng, M, lv) : rng.chance(0.5) ? mdEq(rng, M, lv, lv === 1 ? ["divc", "divb"] : ["divc", "divb", "diva", "mulb"]) : mdGroups(rng, M, lv, o.ctx, lv === 1 ? "e" : undefined);
  if (p.story) {
    if ((p.steps || 1) >= 2) return until(() => mdTwoStep(rng, M, lv, o.ctx));
    return mdGroups(rng, M, lv, o.ctx);
  }
  return rng.chance(0.5) ? mdEq(rng, M, lv) : mdGroups(rng, M, lv, o.ctx);
}
function checkMuldiv(p, params) {
  const M = Math.max(3, (params && params.max) | 0 || 10);
  const s = p.spec;
  const over = (v, lim) => v != null && v > lim;
  if (s.type === "eq") {
    const fac = s.op === "mul" ? [s.a, s.b] : [s.b, s.c];
    const prod = s.op === "mul" ? s.c : s.a;
    if (fac.some((v) => over(v, M)) || over(prod, M * M)) return `a number exceeds max ${M}`;
  } else if (s.type === "groups") {
    if (over(s.g, M) || over(s.e, M) || over(s.t, M * M)) return `a number exceeds max ${M}`;
  } else if (s.type === "fam") {
    if (s.x > M || s.y > M || s.z > M * M) return `a number exceeds max ${M}`;
  } else if (s.type === "two") {
    if (s.shape.startsWith("mul") && (s.a > M || s.b > M)) return `a factor exceeds max ${M}`;
    if (!s.shape.startsWith("mul") && (s.a > M * M || s.b > M * M || s.c > M)) return `a number exceeds max ${M}`;
  }
  if (params && params.story && !p.structure) return "story problem has no structure";
  if (params && params.story && (params.steps || 1) >= 2 && s.type !== "two") return "steps:2 asked for a two-step problem";
  if (params && (params.steps || 1) < 2 && s.type === "two") return "one-step skill produced a two-step problem";
  return null;
}

// ---------------------------------------------------------------------------------------------------- properties
const PROP = { comm: "commutative property", assoc: "associative property", distr: "distributive property", ident: "identity property" };
function nameEq(pattern, a, b, c) {
  if (pattern === "comm") return `${a} ${TIMES} ${b} = ${b} ${TIMES} ${a}`;
  if (pattern === "assoc") return `(${a} ${TIMES} ${b}) ${TIMES} ${c} = ${a} ${TIMES} (${b} ${TIMES} ${c})`;
  if (pattern === "distr") return `${a} ${TIMES} (${b} + ${c}) = ${a} ${TIMES} ${b} + ${a} ${TIMES} ${c}`;
  return `${a} ${TIMES} 1 = ${a}`;
}
function prName(rng, lv, pats) {
  const pattern = rng.pick(pats);
  const a = rng.int(2, lv === 1 ? 6 : 9);
  const b = rng.int(2, 9);
  const c = rng.int(2, lv >= 3 ? 9 : 6);
  const eq = nameEq(pattern, a, b, c);
  const ans = PROP[pattern];
  const tag = { comm: "commutative", assoc: "associative", distr: "distributive", ident: "identity" };
  const cands = Object.keys(PROP)
    .filter((k) => k !== pattern)
    .map((k) => [PROP[k], `confused-with-${tag[k]}-property`]);
  const note = {
    comm: "Only the order of the two factors changed.",
    assoc: "The factors stay in the same order. Only the grouping changed.",
    distr: "One factor is split into parts that are added, and each part is multiplied.",
  };
  return finalize({
    family: "properties",
    spec: { type: "name", eq, a, b, c },
    stem: S3(eq),
    ask: T3("Which property does the equation show?", "Which property of multiplication does the equation show?", "Which property of multiplication is illustrated by this equation?"),
    expr: eq,
    answer: { value: ans, text: ans, kind: "text" },
    work: [`${note[pattern]} That is the ${ans}.`],
    visual: null,
    distractors: mkT(ans, cands),
    hints: { conceptual: "Each property describes one kind of change: the order, the grouping, or splitting a number into parts.", procedural: "Look at what is different between the two sides of the equation. What moved, and what stayed the same?" },
    level: lv,
  });
}
function prCommute(rng, lv) {
  const form = rng.pick(["b×?", "?×a", "turn"]);
  const a = rng.int(2, lv === 1 ? 6 : 9);
  let b = rng.int(2, lv === 1 ? 6 : 10);
  if (b === a) b = a === 9 ? 8 : a + 1;
  const ans = form === "?×a" ? b : a;
  let stem;
  let ask;
  let expr;
  if (form === "turn") {
    const [A] = rng.sample(NAMES, 1);
    stem = T3(`${A} makes an array with ${a} rows and ${b} counters in each row. Then ${A} turns the array so there are ${b} rows.`, `${A} makes an array of counters with ${a} rows and ${b} counters in each row. ${A} turns it so that it has ${b} rows.`, `${A} arranges counters in an array with ${a} rows of ${b}. The array is then rotated so that it has ${b} rows.`);
    ask = T3("How many counters are in each row now?", "How many counters are in each row now?", "How many counters are now in each row?");
    expr = `${a} ${TIMES} ${b} = ${b} ${TIMES} ?`;
  } else {
    expr = form === "b×?" ? `${a} ${TIMES} ${b} = ${b} ${TIMES} ?` : `${a} ${TIMES} ${b} = ? ${TIMES} ${a}`;
    stem = S3(expr);
    ask = T3("Find the missing number.", "What number is missing?", "Which number makes the equation true?");
  }
  const other = ans === a ? b : a;
  return finalize({
    family: "properties",
    spec: { type: "commute", a, b, form },
    stem,
    ask,
    expr,
    answer: ansInt(ans),
    work: [`Changing the order of the factors does not change the product, so the same two numbers appear on both sides. The missing number is ${ans}.`],
    visual: lv === 1 ? { kind: "array", alt: `An array with ${a} rows and ${b} columns.`, rows: a, cols: b, label: true } : null,
    distractors: mkD(ans, num(ans), [[other, "repeated-a-given-factor-in-the-same-place"], [a * b, "gave-the-product"], [a + b, "added-the-factors"], [ans + 1, "off-by-one"], ...nearInts(ans)], fmtInt),
    hints: { conceptual: "Multiplying two numbers in a different order gives the same product.", procedural: "List the two factors on the left. The right side must use the same two factors." },
    level: lv,
  });
}
function prAssoc(rng, lv) {
  const form = rng.pick(lv === 2 ? ["a×(b×?)", "?×(b×c)", "both"] : ["a×(b×?)", "?×(b×c)", "both", "both"]);
  const hi = lv === 2 ? 5 : 9;
  const a = rng.int(2, hi);
  const b = rng.int(2, hi);
  const c = rng.int(2, hi);
  const prod = a * b * c;
  let stem;
  let ask;
  let ans;
  let expr;
  let work;
  let cands;
  if (form === "both") {
    const [A, B] = twoNames(rng);
    ans = prod;
    expr = `(${a} ${TIMES} ${b}) ${TIMES} ${c} = ${a} ${TIMES} (${b} ${TIMES} ${c})`;
    stem = T3(`${A} finds ${a} ${TIMES} ${b} ${TIMES} ${c} by doing ${a} ${TIMES} ${b} first. ${B} does ${b} ${TIMES} ${c} first.`, `${A} finds ${a} ${TIMES} ${b} ${TIMES} ${c} by multiplying ${a} ${TIMES} ${b} first. ${B} multiplies ${b} ${TIMES} ${c} first.`, `${A} evaluates ${a} ${TIMES} ${b} ${TIMES} ${c} by multiplying ${a} ${TIMES} ${b} first, and ${B} begins with ${b} ${TIMES} ${c}.`);
    ask = T3("What product do they both get?", "What product do both students get?", "What product do both students obtain?");
    work = [`${A}: ${a} ${TIMES} ${b} = ${a * b}, then ${a * b} ${TIMES} ${c} = ${prod}`, `${B}: ${b} ${TIMES} ${c} = ${b * c}, then ${a} ${TIMES} ${b * c} = ${prod}`];
    cands = [[a * b + c, "added-the-last-factor"], [a + b + c, "added-the-factors"], [a * b, "stopped-after-the-first-product"], [b * c + a, "added-the-first-factor"]];
  } else if (form === "a×(b×?)") {
    ans = c;
    expr = `(${a} ${TIMES} ${b}) ${TIMES} ${c} = ${a} ${TIMES} (${b} ${TIMES} ?)`;
    stem = S3(expr);
    ask = T3("Find the missing number.", "What number is missing?", "Which number makes the equation true?");
    work = [`Only the grouping changed. The factors ${a}, ${b} and ${c} stay in the same order, so the missing number is ${c}.`];
    cands = [[a, "chose-the-first-factor"], [b, "chose-the-repeated-factor"], [a * b, "chose-a-product"], [b * c, "chose-a-product"]];
  } else {
    ans = a;
    expr = `(${a} ${TIMES} ${b}) ${TIMES} ${c} = ? ${TIMES} (${b} ${TIMES} ${c})`;
    stem = S3(expr);
    ask = T3("Find the missing number.", "What number is missing?", "Which number makes the equation true?");
    work = [`The same three factors are multiplied. The grouping moves to the last two, so the missing number is ${a}.`];
    cands = [[c, "chose-the-last-factor"], [b, "chose-the-repeated-factor"], [a * b, "chose-a-product"], [b * c, "chose-a-product"]];
  }
  return finalize({
    family: "properties",
    spec: { type: "assoc", a, b, c, form },
    stem,
    ask,
    expr,
    answer: ansInt(ans),
    work,
    visual: null,
    distractors: mkD(ans, num(ans), [...cands, ...nearInts(ans)], fmtInt),
    hints: { conceptual: "When you only multiply, you can group the factors in any way and the product stays the same.", procedural: "Match the three factors on the left to the three factors on the right. Which one is missing?" },
    level: lv,
  });
}
function prProduct3(rng, lv) {
  const pairs = [[5, 2], [5, 4], [2, 5], [4, 5], [5, 6], [2, 5]];
  const [x, y] = rng.pick(pairs);
  const z = rng.int(3, 9);
  const order = rng.shuffle([x, y, z]);
  const ans = x * y * z;
  const e = `${order[0]} ${TIMES} ${order[1]} ${TIMES} ${order[2]}`;
  return finalize({
    family: "properties",
    spec: { type: "product3", a: order[0], b: order[1], c: order[2] },
    stem: S3(e),
    ask: T3("Find the product. Pick the order that is easiest.", "Find the product. Choose the grouping that makes it easiest.", "Evaluate the product, choosing the grouping that simplifies the work."),
    expr: e,
    answer: ansInt(ans),
    work: [`Group ${x} and ${y} first, because ${x} ${TIMES} ${y} = ${x * y}`, `Then multiply by ${z}: ${x * y} ${TIMES} ${z} = ${ans}`],
    visual: null,
    distractors: mkD(ans, num(ans), [[x + y + z, "added-the-factors"], [x * y + z, "multiplied-two-and-added-one"], [x * y, "stopped-early"], [x * z * 10 + y, "place-value-slip"], ...nearInts(ans)], fmtInt),
    hints: { conceptual: "The grouping of factors does not change a product, so you may choose the grouping that is easiest to compute.", procedural: "Look for two factors whose product is a friendly number such as 10, 20 or 40." },
    level: lv,
  });
}
function prDMiss(rng, lv) {
  const side = lv >= 2 && rng.chance(0.4) ? "a" : "b";
  const a = rng.int(2, lv === 1 ? 5 : lv === 2 ? 9 : 7);
  const b = lv === 3 ? rng.int(11, Math.floor(100 / a) > 14 ? 14 : Math.floor(100 / a)) : rng.int(4, lv === 1 ? 9 : 10);
  let known;
  let ans;
  let expr;
  let big;
  if (side === "b") {
    known = lv === 3 ? 10 : rng.int(2, b - 2);
    ans = b - known;
    expr = `${a} ${TIMES} ${b} = ${a} ${TIMES} ${known} + ${a} ${TIMES} ?`;
    big = b;
  } else {
    known = rng.int(2, Math.max(2, a - 2));
    ans = a - known;
    expr = `${a} ${TIMES} ${b} = ${known} ${TIMES} ${b} + ? ${TIMES} ${b}`;
    big = a;
  }
  if (ans < 1 || known < 1) return null;
  return finalize({
    family: "properties",
    spec: { type: "dmiss", a, b, s: known, side },
    stem: S3(expr),
    ask: T3("Find the missing number.", "What number is missing?", "Which number makes the equation true?"),
    expr,
    answer: ansInt(ans),
    work: [`The ${big} is split into ${known} and the missing part, so the parts must add to ${big}: ${known} + ${ans} = ${big}`],
    visual: lv === 1 ? { kind: "array", alt: `An array with ${a} rows and ${b} columns. The first ${known} ${side === "b" ? "columns" : "rows"} are shaded.`, rows: a, cols: b, shade: side === "b" ? { rows: a, cols: known } : { rows: known, cols: b }, label: false } : null,
    distractors: mkD(ans, num(ans), [[big, "repeated-the-whole-number"], [known, "repeated-the-known-part"], [a * ans, "multiplied-the-missing-part"], [big + known, "added-instead-of-subtracted"], ...nearInts(ans)], fmtInt),
    hints: { conceptual: "The distributive property splits one factor into parts. The parts must still make the whole factor.", procedural: "Ask: which number added to the known part makes the factor that was split?" },
    level: lv,
  });
}
function prDProd(rng, lv) {
  const [A] = rng.sample(NAMES, 1);
  const a = rng.int(3, lv === 2 ? 8 : 9);
  const b1 = rng.int(2, 5);
  const b2 = rng.pick([2, 3, 4, 5, 6].filter((v) => v !== b1));
  const b = b1 + b2;
  const ans = a * b;
  return finalize({
    family: "properties",
    spec: { type: "dprod", a, b1, b2 },
    stem: T3(`${A} wants ${a} ${TIMES} ${b}. ${A} adds ${a} ${TIMES} ${b1} and ${a} ${TIMES} ${b2}.`, `${A} wants to know ${a} ${TIMES} ${b}. ${A} adds ${a} ${TIMES} ${b1} and ${a} ${TIMES} ${b2}.`, `To evaluate ${a} ${TIMES} ${b}, ${A} adds the partial products ${a} ${TIMES} ${b1} and ${a} ${TIMES} ${b2}.`),
    ask: T3(`What is ${a} ${TIMES} ${b}?`, `What is ${a} ${TIMES} ${b}?`, `What is the value of ${a} ${TIMES} ${b}?`),
    expr: `${a} ${TIMES} ${b} = (${a} ${TIMES} ${b1}) + (${a} ${TIMES} ${b2})`,
    answer: ansInt(ans),
    work: [`${a} ${TIMES} ${b1} = ${a * b1}`, `${a} ${TIMES} ${b2} = ${a * b2}`, `${a * b1} + ${a * b2} = ${ans}`],
    visual: null,
    distractors: mkD(ans, num(ans), [[a * b1 + b2, "multiplied-only-one-part"], [a + b, "added-the-factors"], [a * b1 * b2, "multiplied-the-parts"], [a * b + a, "counted-an-extra-group"], ...nearInts(ans)], fmtInt),
    hints: { conceptual: "Splitting a factor into two parts and multiplying each part gives the same product as multiplying the whole factor.", procedural: "Find each partial product first, then add the two partial products." },
    level: lv,
  });
}
function prTens(rng, lv) {
  const a = rng.int(2, 9);
  const t = rng.int(2, lv === 1 ? 5 : 9);
  const ans = a * t * 10;
  const e = `${a} ${TIMES} ${t * 10}`;
  return finalize({
    family: "properties",
    spec: { type: "tens", a, t },
    stem: S3(e),
    ask: T3(`Find ${e}.`, `What is ${e}?`, `Calculate the product ${e}.`),
    expr: e,
    answer: ansInt(ans),
    work: [`${t * 10} is ${t} tens, so ${a} ${TIMES} ${t} tens`, `${a} ${TIMES} ${t} = ${a * t}, so ${a * t} tens is ${ans}`],
    visual: null,
    distractors: mkD(ans, num(ans), [[a * t, "forgot-the-tens-zero"], [a * t * 100, "added-an-extra-zero"], [a * t + 10, "added-the-ten"], [a + t * 10, "added-instead-of-multiplied"], ...nearInts(ans)], fmtInt),
    hints: { conceptual: "A multiple of ten is a number of tens. Multiply the number of tens, then name the result in tens.", procedural: "Multiply the single digits first, then think about what the tens mean." },
    level: lv,
  });
}
function prCompare(rng, lv) {
  const [A, B] = twoNames(rng);
  const a = rng.int(3, 9);
  const half = rng.int(3, 5);
  const b = half * 2;
  const b1 = 5;
  const b2 = b - b1;
  const strat = (kind) => {
    if (kind === "split") return { text: `${a} ${TIMES} ${b1} + ${a} ${TIMES} ${b2}`, k: 1, terms: [[a, b1], [a, b2]], add: 0 };
    if (kind === "double") return { text: `doubles ${a} ${TIMES} ${half}`, k: 2, terms: [[a, half]], add: 0 };
    if (kind === "near") return { text: `${a + 1} ${TIMES} ${b} ${MINUS} ${b}`, k: 1, terms: [[a + 1, b]], add: -b };
    if (kind === "badsplit") return { text: `${a} ${TIMES} ${b1} + ${b2}`, k: 1, terms: [[a, b1], [b2]], add: 0 };
    return { text: `${a + 1} ${TIMES} ${b} ${MINUS} ${a}`, k: 1, terms: [[a + 1, b]], add: -a };
  };
  const good = ["split", "double", "near"];
  const bad = ["badsplit", "badnear"];
  const r = rng.next();
  let ka;
  let kb;
  if (r < 0.3) [ka, kb] = rng.sample(good, 2);
  else if (r < 0.8) {
    ka = rng.pick(good);
    kb = rng.pick(bad);
    if (rng.chance(0.5)) [ka, kb] = [kb, ka];
  } else [ka, kb] = [rng.pick(bad), rng.pick(bad)];
  const sa = strat(ka);
  const sb = strat(kb);
  const val = (s) => s.k * s.terms.reduce((t, term) => t + term.reduce((m, x) => m * x, 1), 0) + s.add;
  const okA = val(sa) === a * b;
  const okB = val(sb) === a * b;
  const texts = { both: "Both strategies work", a: `Only ${A}'s strategy works`, b: `Only ${B}'s strategy works`, none: "Neither strategy works" };
  const key = okA && okB ? "both" : okA ? "a" : okB ? "b" : "none";
  const ans = texts[key];
  const TAGS = {
    both: { a: "rejected-a-valid-strategy", b: "rejected-a-valid-strategy", none: "rejected-a-valid-strategy" },
    a: { both: "did-not-check-each-strategy", b: "chose-the-wrong-strategy", none: "rejected-a-valid-strategy" },
    b: { both: "did-not-check-each-strategy", a: "chose-the-wrong-strategy", none: "rejected-a-valid-strategy" },
    none: { both: "did-not-check-each-strategy", a: "accepted-a-flawed-strategy", b: "accepted-a-flawed-strategy" },
  };
  const cands = Object.keys(texts)
    .filter((k) => k !== key)
    .map((k) => [texts[k], TAGS[key][k]]);
  const calc = (s, who) => `${who}: ${s.text.replace("doubles ", "double ")} gives ${val(s)}${val(s) === a * b ? ", which matches" : ", which does not match"} ${a} ${TIMES} ${b}`;
  const work = [`Find ${a} ${TIMES} ${b}: ${a} ${TIMES} ${b} = ${a * b}`, calc(sa, A), calc(sb, B)];
  return finalize({
    family: "properties",
    spec: { type: "compare", a, b, names: [A, B], strategies: [{ k: sa.k, terms: sa.terms, add: sa.add }, { k: sb.k, terms: sb.terms, add: sb.add }] },
    stem: T3(`${A} finds ${a} ${TIMES} ${b} with ${sa.text}. ${B} uses ${sb.text}.`, `${A} finds ${a} ${TIMES} ${b} this way: ${sa.text}. ${B} finds it this way: ${sb.text}.`, `To find ${a} ${TIMES} ${b}, ${A} uses the strategy ${sa.text}, and ${B} uses the strategy ${sb.text}.`),
    ask: T3("Which strategies work?", "Which statement is true?", "Which statement about the two strategies is true?"),
    expr: null,
    answer: { value: ans, text: ans, kind: "text" },
    work,
    visual: null,
    distractors: mkT(ans, cands),
    hints: { conceptual: "A strategy works only if it gives the same product as the fact it is meant to find.", procedural: "Work out each strategy to a single number. Then compare each number with the product of the fact." },
    level: lv,
  });
}
function genProperties(rng, p, o) {
  const lv = o.level;
  if (p.mode === "distribute") {
    if (lv === 1) return until(() => (rng.chance(0.55) ? prDMiss(rng, 1) : prTens(rng, 1)));
    if (lv === 2) {
      const r = rng.next();
      return until(() => (r < 0.35 ? prDMiss(rng, 2) : r < 0.6 ? prDProd(rng, 2) : r < 0.8 ? prTens(rng, 2) : prName(rng, 2, ["distr"])));
    }
    const r = rng.next();
    return until(() => (r < 0.4 ? prCompare(rng, 3) : r < 0.7 ? prDMiss(rng, 3) : prTens(rng, 3)));
  }
  if (lv === 1) return rng.chance(0.85) ? prCommute(rng, 1) : prName(rng, 1, ["comm", "assoc"]);
  if (lv === 2) {
    const r = rng.next();
    return r < 0.3 ? prCommute(rng, 2) : r < 0.75 ? prAssoc(rng, 2) : prName(rng, 2, ["comm", "assoc"]);
  }
  const r = rng.next();
  return r < 0.4 ? prAssoc(rng, 3) : r < 0.7 ? prProduct3(rng, 3) : prName(rng, 3, ["comm", "assoc", "distr"]);
}

// ---------------------------------------------------------------------------------------------------- shared text helpers
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const fmtFr = (f) => (f.d === 1 ? num(f.n) : `${f.n}/${f.d}`);
const fracAns = (n, d) => ({ value: `${n}/${d}`, text: `${n}/${d}`, kind: "frac" });
const coprimeNums = (d) => {
  const out = [];
  for (let n = 1; n < d; n++) if (gcd(n, d) === 1) out.push(n);
  return out;
};

// ---------------------------------------------------------------------------------------------------- fracid
const FOBJ = {
  store: { obj: "a paper banner", short: "banner", verb: "colors", res: "colored" },
  garden: { obj: "a garden bed", short: "garden bed", verb: "plants beans in", res: "planted with beans" },
  sports: { obj: "a playing field", short: "field", verb: "paints", res: "painted" },
  kitchen: { obj: "a pan of cornbread", short: "cornbread", verb: "eats", res: "eaten" },
  pets: { obj: "a rabbit pen", short: "pen", verb: "puts straw in", res: "covered with straw" },
  library: { obj: "a bookshelf", short: "bookshelf", verb: "fills", res: "filled" },
  crafts: { obj: "a quilt", short: "quilt", verb: "sews", res: "sewn" },
  travel: { obj: "a bike path", short: "bike path", verb: "paints", res: "painted" },
  science: { obj: "a tray of soil", short: "tray", verb: "waters", res: "watered" },
  community: { obj: "a mural", short: "mural", verb: "paints", res: "painted" },
};
const partsWord = (n) => (n === 1 ? "part" : "parts");
function strip(rng, n, d) {
  if (rng.chance(0.5)) return { kind: "fracstrip", alt: `A strip split into ${d} equal parts with ${n} shaded.`, parts: d, shaded: n };
  const shape = d <= 8 && rng.chance(0.5) ? "circle" : "rect";
  return { kind: "fracshape", alt: `A ${shape === "circle" ? "circle" : "rectangle"} split into ${d} equal parts with ${n} shaded.`, shape, parts: d, shaded: n };
}
function fiShaded(rng, lv, maxDen, ctx) {
  const d = rng.int(2, lv === 1 ? Math.min(4, maxDen) : maxDen);
  const n = rng.pick(coprimeNums(d));
  const O = FOBJ[ctx] || FOBJ.store;
  const [N] = rng.sample(NAMES, 1);
  const pic = rng.chance(lv === 1 ? 0.5 : lv === 2 ? 0.4 : 0.25);
  const stem = pic
    ? T3("Look at the picture.", "Look at the picture. The whole is split into equal parts.", "The picture shows a whole that is divided into equal parts.")
    : T3(`${cap(O.obj)} has ${d} equal parts. ${N} ${O.verb} ${n} ${partsWord(n)}.`, `${cap(O.obj)} is split into ${d} equal parts. ${N} ${O.verb} ${n} of the parts.`, `${cap(O.obj)} is divided into ${d} equal-sized parts. ${N} ${O.verb} ${n} of those parts.`);
  const ask = pic ? T3("What fraction is shaded?", "What fraction of the whole is shaded?", "What fraction of the whole is shaded?") : T3(`What fraction of the ${O.short} is ${O.res}?`, `What fraction of the ${O.short} is ${O.res}?`, `What fraction of the ${O.short} is ${O.res}? Write it as a fraction.`);
  const cands = [[new Fr(d, n), "flipped-numerator-and-denominator", `${d}/${n}`], [d - n >= 1 ? new Fr(n, d - n) : null, "compared-shaded-to-unshaded", `${n}/${d - n}`], [d - n >= 1 ? new Fr(d - n, d) : null, "named-the-unshaded-part", `${d - n}/${d}`], [n > 1 ? new Fr(1, d) : null, "named-one-part-only", `1/${d}`], [new Fr(n, d + 1), "counted-an-extra-part", `${n}/${d + 1}`], [new Fr(n + 1, d), "counted-an-extra-shaded-part", `${n + 1}/${d}`]];
  return finalize({
    family: "fracid",
    spec: { type: "shaded", n, d, pic },
    stem,
    ask,
    expr: null,
    answer: fracAns(n, d),
    work: [`The whole is split into ${d} equal parts, so the denominator is ${d}.`, `${n} of the parts are shaded, so the numerator is ${n}.`, `The fraction is ${n}/${d}.`],
    visual: lv === 1 || pic || rng.chance(0.4) ? strip(rng, n, d) : null,
    distractors: mkD(new Fr(n, d), `${n}/${d}`, cands, fmtFr),
    hints: { conceptual: "The bottom number tells how many equal parts make the whole. The top number tells how many of those parts are counted.", procedural: "Count all the equal parts first. Then count only the parts that are shaded." },
    level: lv,
  });
}
function fiUnit(rng, lv, maxDen) {
  const d = rng.int(2, lv === 1 ? Math.min(4, maxDen) : maxDen);
  const cands = [[new Fr(d, 1), "named-by-the-number-of-parts", `${d}/1`], [d > 2 ? new Fr(1, d - 1) : null, "counted-the-cuts-not-the-parts", `1/${d - 1}`], [new Fr(1, d + 1), "counted-an-extra-part", `1/${d + 1}`], [d > 2 ? new Fr(d - 1, d) : null, "named-all-the-other-parts", `${d - 1}/${d}`], [d > 3 ? new Fr(2, d) : null, "named-two-parts", `2/${d}`], [new Fr(1, d + 2), "counted-extra-parts", `1/${d + 2}`]];
  return finalize({
    family: "fracid",
    spec: { type: "unit", d },
    stem: T3(`A whole is cut into ${d} equal parts. The parts are the same size.`, `A whole is cut into ${d} equal parts, all the same size.`, `A whole is partitioned into ${d} parts of equal size.`),
    ask: T3("What fraction names one part?", "What fraction names one of the parts?", "What unit fraction names one of the equal parts?"),
    expr: null,
    answer: fracAns(1, d),
    work: [`There are ${d} equal parts, so each part is 1 out of ${d}.`, `One part is 1/${d} of the whole.`],
    visual: lv === 1 ? strip(rng, 1, d) : null,
    distractors: mkD(new Fr(1, d), `1/${d}`, cands, fmtFr),
    hints: { conceptual: "A unit fraction has 1 on top. The bottom number is the number of equal parts in the whole.", procedural: "Write the number of equal parts on the bottom and the number of parts you are naming on top." },
    level: lv,
  });
}
function fiMeaning(rng, lv, maxDen) {
  const d = rng.int(3, Math.max(3, maxDen));
  const n = rng.int(2, d - 1);
  const ask = rng.pick(["den", "num"]);
  const ans = ask === "den" ? d : n;
  const other = ask === "den" ? n : d;
  return finalize({
    family: "fracid",
    spec: { type: "meaning", n, d, ask },
    stem: T3(`Look at the fraction ${n}/${d}.`, `Look at the fraction ${n}/${d}.`, `Consider the fraction ${n}/${d}.`),
    ask: ask === "den" ? T3("How many equal parts make the whole?", "How many equal parts make up the whole?", "Into how many equal parts is the whole divided?") : T3("How many of the parts are counted?", "How many of the equal parts are counted?", "How many of the equal parts does this fraction count?"),
    expr: null,
    answer: ansInt(ans),
    work: [ask === "den" ? `The denominator, the bottom number, is ${d}. The whole is split into ${d} equal parts.` : `The numerator, the top number, is ${n}. The fraction counts ${n} parts.`],
    visual: lv === 1 ? strip(rng, n, d) : null,
    distractors: mkD(ans, num(ans), [[other, "swapped-numerator-and-denominator"], [d - n, "found-the-difference"], [d + n, "added-the-numbers"], [ans + 1, "off-by-one"], ...nearInts(ans)], fmtInt),
    hints: { conceptual: ask === "den" ? "The bottom number names the size of the parts: it says how many make one whole." : "The top number counts how many of the equal parts you have.", procedural: "Say the fraction out loud, for example: this many out of that many equal parts." },
    level: lv,
  });
}
function fiCount(rng, lv, maxDen) {
  const d = rng.int(2, maxDen);
  const whole = rng.chance(0.35);
  const n = whole ? d : rng.int(2, Math.max(2, d - 1) + (lv === 3 ? 2 : 0));
  const target = whole ? "one whole" : `${n}/${d}`;
  const ans = n;
  return finalize({
    family: "fracid",
    spec: { type: "count", n, d },
    stem: T3(`Each piece is 1/${d} of a whole.`, `Each piece is 1/${d} of a whole.`, `Every piece is the unit fraction 1/${d} of one whole.`),
    ask: whole ? T3("How many pieces make one whole?", "How many pieces make one whole?", "How many pieces are needed to make one whole?") : T3(`How many pieces make ${target}?`, `How many pieces make ${target}?`, `How many of these pieces are needed to make ${target}?`),
    expr: null,
    answer: ansInt(ans),
    work: [whole ? `The whole is ${d} equal parts, and each piece is one part, so it takes ${d} pieces.` : `${n}/${d} means ${n} parts that are each 1/${d}, so it takes ${n} pieces.`],
    visual: lv === 1 ? strip(rng, n > d ? d : n, d) : null,
    distractors: mkD(ans, num(ans), [[whole ? d + 1 : d, whole ? "off-by-one" : "answered-with-the-denominator"], [whole ? d - 1 : d - n, whole ? "off-by-one" : "counted-the-missing-pieces"], [1, "answered-with-one-piece"], [ans + 1, "off-by-one"], ...nearInts(ans)], fmtInt),
    hints: { conceptual: "A fraction a/b is a pieces that are each 1/b of the whole.", procedural: "Look at the top number. It tells how many unit pieces are put together." },
    level: lv,
  });
}
function fiWhole(rng, lv, maxDen) {
  const d = rng.int(2, maxDen);
  const [N] = rng.sample(NAMES, 1);
  const ans = `${d}/${d}`;
  const cands = [[`1/${d}`, "named-one-part"], [`${d}/1`, "flipped-numerator-and-denominator"], [`${d - 1}/${d}`, "left-one-part-out"], [`0/${d}`, "confused-zero-and-the-whole"], [`${d + 1}/${d}`, "counted-an-extra-part"]];
  return finalize({
    family: "fracid",
    spec: { type: "whole", d },
    stem: T3(`A whole is cut into ${d} equal parts. ${N} takes all ${d} parts.`, `A whole is cut into ${d} equal parts, and ${N} takes all ${d} of them.`, `A whole is divided into ${d} equal parts, and ${N} takes every one of the ${d} parts.`),
    ask: T3("What fraction is that?", "What fraction names the parts that were taken?", "What fraction names all of the parts that were taken?"),
    expr: null,
    answer: { value: ans, text: ans, kind: "text" },
    work: [`The whole has ${d} equal parts, so the denominator is ${d}.`, `All ${d} parts are taken, so the numerator is ${d}. The fraction is ${d}/${d}, which is one whole.`],
    visual: lv === 1 ? strip(rng, d, d) : null,
    distractors: mkT(ans, cands),
    hints: { conceptual: "When you take every part, the numerator equals the denominator and you have one whole.", procedural: "Write the number of equal parts on the bottom. Write the number of parts taken on the top." },
    level: lv,
  });
}
function fiBuild(rng, lv, maxDen) {
  const d = rng.int(3, Math.max(3, maxDen));
  const n = rng.int(2, d - 1);
  const [N] = rng.sample(NAMES, 1);
  const ans = `${d} parts, ${n} shaded`;
  const cands = [[`${n} parts, ${d} shaded`, "swapped-numerator-and-denominator"], [`${d} parts, ${d - n} shaded`, "shaded-the-rest"], [`${d + n} parts, ${n} shaded`, "added-numerator-and-denominator"], [`${d - n} parts, ${n} shaded`, "used-the-difference-for-the-parts"], [`${d + 1} parts, ${n} shaded`, "counted-an-extra-part"]];
  return finalize({
    family: "fracid",
    spec: { type: "build", n, d },
    stem: T3(`${N} wants to show ${n}/${d}. ${N} cuts a strip into equal parts and shades some.`, `${N} wants to show the fraction ${n}/${d} on a strip. ${N} cuts the strip into equal parts and shades some of them.`, `${N} models the fraction ${n}/${d} with a strip that is cut into equal parts, some of which are shaded.`),
    ask: T3("How many parts should the strip have? How many should be shaded?", "How many equal parts should the strip have, and how many should be shaded?", "Into how many equal parts should the strip be cut, and how many of them should be shaded?"),
    expr: null,
    answer: { value: ans, text: ans, kind: "text" },
    work: [`The denominator ${d} is the number of equal parts, so cut the strip into ${d} parts.`, `The numerator ${n} is the number of parts counted, so shade ${n} of them.`],
    visual: null,
    distractors: mkT(ans, cands),
    hints: { conceptual: "In a fraction, the bottom number names the equal parts of the whole and the top number names how many are shaded.", procedural: "Decide the number of equal parts first. Then decide how many of those parts to shade." },
    level: lv,
  });
}
function genFracid(rng, p, o) {
  const maxDen = Math.max(4, p.maxDen | 0 || 8);
  const lv = o.level;
  const r = rng.next();
  if (lv === 1) return r < 0.55 ? fiShaded(rng, 1, maxDen, o.ctx) : r < 0.8 ? fiUnit(rng, 1, maxDen) : r < 0.9 ? fiWhole(rng, 1, maxDen) : fiMeaning(rng, 1, Math.min(4, maxDen));
  if (lv === 2) return r < 0.3 ? fiShaded(rng, 2, maxDen, o.ctx) : r < 0.5 ? fiMeaning(rng, 2, maxDen) : r < 0.7 ? fiCount(rng, 2, maxDen) : r < 0.8 ? fiUnit(rng, 2, maxDen) : r < 0.9 ? fiWhole(rng, 2, maxDen) : fiBuild(rng, 2, maxDen);
  return r < 0.28 ? fiCount(rng, 3, maxDen) : r < 0.52 ? fiBuild(rng, 3, maxDen) : r < 0.72 ? fiShaded(rng, 3, maxDen, o.ctx) : r < 0.86 ? fiWhole(rng, 3, maxDen) : fiMeaning(rng, 3, maxDen);
}
function checkFracid(p, params) {
  const maxDen = Math.max(4, (params && params.maxDen) | 0 || 8);
  if (p.spec.d > maxDen) return `denominator ${p.spec.d} exceeds maxDen ${maxDen}`;
  return null;
}

// ---------------------------------------------------------------------------------------------------- fracline
function flLocate(rng, lv, maxDen) {
  const whole = lv === 3 && rng.chance(0.6) ? 2 : 1;
  const d = rng.int(2, lv === 1 ? Math.min(4, maxDen) : maxDen);
  const choices = [];
  for (let n = 1; n < d * whole; n++) if (gcd(n, d) === 1) choices.push(n);
  const n = rng.pick(choices);
  const stem =
    whole === 1
      ? T3(`The number line goes from 0 to 1. It is split into ${d} equal parts. Point P is ${n} ${partsWord(n)} from 0.`, `A number line goes from 0 to 1 and is split into ${d} equal parts. Point P is ${n} ${partsWord(n)} from 0.`, `On a number line from 0 to 1 that is divided into ${d} equal parts, point P is ${n} ${partsWord(n)} from 0.`)
      : T3(`The number line goes from 0 to 2. Each whole is split into ${d} equal parts. Point P is ${n} ${partsWord(n)} from 0.`, `A number line goes from 0 to 2, and each whole is split into ${d} equal parts. Point P is ${n} ${partsWord(n)} from 0.`, `On a number line from 0 to 2 where each whole is divided into ${d} equal parts, point P is ${n} ${partsWord(n)} from 0.`);
  const cands = [[new Fr(d, n), "flipped-numerator-and-denominator", `${d}/${n}`], [n > 1 ? new Fr(n - 1, d) : null, "counted-the-starting-mark", `${n - 1}/${d}`], [new Fr(n + 1, d), "counted-one-part-too-many", `${n + 1}/${d}`], [new Fr(n, d * whole), "used-all-the-parts-on-the-line", `${n}/${d * whole}`], [new Fr(n, d + 1), "counted-the-marks-not-the-parts", `${n}/${d + 1}`], [new Fr(1, n + 1), "named-one-part", `1/${n + 1}`]];
  return finalize({
    family: "fracline",
    spec: { type: "locate", n, d, whole },
    stem,
    ask: T3("Which fraction names point P?", "Which fraction names point P?", "Which fraction is point P located at?"),
    expr: null,
    answer: fracAns(n, d),
    work: [`Each part is 1/${d}. Point P is ${n} parts from 0.`, `${n} parts of size 1/${d} make ${n}/${d}.`],
    visual: { kind: "numberline", alt: `A number line from 0 to ${whole} with each whole split into ${d} equal parts. Point P is marked.`, min: 0, max: whole, ticks: d * whole, marks: [{ at: `${n}/${d}`, label: "P" }], show: "frac" },
    distractors: mkD(new Fr(n, d), `${n}/${d}`, cands, fmtFr),
    hints: { conceptual: "A fraction on a number line counts equal steps of one unit fraction starting at 0.", procedural: "Decide how big one step is. Then count the steps from 0 to the point." },
    level: lv,
  });
}
function flCmp(rng, lv, maxDen) {
  const mode = lv === 1 ? "sameDen" : rng.pick(["sameDen", "sameNum"]);
  const pick = lv === 3 ? rng.pick(["max", "min"]) : "max";
  return until(() => {
    let fr4;
    if (mode === "sameDen") {
      const d = rng.int(5, Math.max(5, maxDen));
      fr4 = rng.sample(
        Array.from({ length: d - 1 }, (_, i) => i + 1),
        4,
      ).map((n) => [n, d]);
    } else {
      const n = rng.int(1, 3);
      const dens = [];
      for (let d = n + 1; d <= maxDen; d++) dens.push(d);
      if (dens.length < 4) return null;
      fr4 = rng.sample(dens, 4).map((d) => [n, d]);
    }
    const val = ([n, d]) => n / d;
    const sorted = fr4.slice().sort((a, b) => val(a) - val(b));
    const best = pick === "max" ? sorted[3] : sorted[0];
    const opp = pick === "max" ? sorted[0] : sorted[3];
    if (gcd(best[0], best[1]) !== 1) return null;
    const shown = rng.shuffle(fr4);
    const list = `${shown.slice(0, 3).map(([n, d]) => `${n}/${d}`).join(", ")} and ${shown[3][0]}/${shown[3][1]}`;
    const word = pick === "max" ? "greatest" : "least";
    const tagOf = (f) => (f === opp ? (mode === "sameDen" ? "picked-the-opposite-extreme" : "bigger-denominator-means-bigger-fraction") : mode === "sameDen" ? "did-not-compare-all-the-numerators" : "did-not-compare-all-the-denominators");
    const cands = shown.filter((f) => f !== best).map((f) => [new Fr(f[0], f[1]), tagOf(f), `${f[0]}/${f[1]}`]);
    return finalize({
      family: "fracline",
      spec: { type: "cmp", fracs: fr4, pick },
      stem: T3(`Look at these fractions: ${list}.`, `Here are four fractions: ${list}.`, `Consider the fractions ${list}.`),
      ask: T3(`Which fraction is the ${word}?`, `Which fraction is the ${word}?`, `Which of these fractions has the ${word} value?`),
      expr: null,
      answer: fracAns(best[0], best[1]),
      work: [mode === "sameDen" ? `The parts are all the same size, so compare how many parts each fraction has: the ${word} is ${best[0]}/${best[1]}.` : `The same number of parts is counted, so compare the size of the parts: a larger denominator means smaller parts. The ${word} is ${best[0]}/${best[1]}.`],
      visual: null,
      distractors: mkD(new Fr(best[0], best[1]), `${best[0]}/${best[1]}`, cands, fmtFr),
      hints: { conceptual: mode === "sameDen" ? "When the parts are the same size, the fraction with more parts is greater." : "When the same number of parts is counted, the fraction with larger parts is greater. A larger denominator means smaller parts.", procedural: "Compare two fractions at a time and keep the one that fits the question. Then compare it with the next." },
      level: lv,
    });
  });
}
function flWholeFrac(rng, lv, maxDen) {
  const d = rng.int(2, maxDen);
  const w = rng.int(1, 4);
  const ans = `${w * d}/${d}`;
  const cands = [[`${d}/${w * d}`, "flipped-numerator-and-denominator"], [`${w}/${d}`, "used-the-whole-number-as-the-numerator"], [`${w + d}/${d}`, "added-instead-of-multiplied"], [`${w * d}/${w}`, "used-the-whole-number-as-the-denominator"], [`${w}/${d + 1}`, "changed-the-denominator"]];
  return finalize({
    family: "fracline",
    spec: { type: "wholefrac", w, d },
    stem: "",
    ask: T3(`Write ${w} as a fraction. Use ${d} on the bottom.`, `Write ${w} as a fraction with a denominator of ${d}.`, `Express the whole number ${w} as a fraction with denominator ${d}.`),
    expr: null,
    answer: { value: ans, text: ans, kind: "text" },
    work: [`One whole is ${d}/${d}, so ${w} wholes are ${w} groups of ${d} parts: ${w} ${TIMES} ${d} = ${w * d}`, `So ${w} is the same as ${w * d}/${d}.`],
    visual: null,
    distractors: mkT(ans, cands),
    hints: { conceptual: "One whole is a fraction with the same number on the top and the bottom. Several wholes are several of those.", procedural: "Find how many parts of that size are in one whole. Then count the parts in all the wholes." },
    level: lv,
  });
}
function flJumps(rng, lv, maxDen) {
  const d = rng.int(2, maxDen);
  const n = lv === 3 ? rng.int(d + 1, d * 2) : rng.int(2, d);
  const top = Math.ceil(n / d);
  const ans = n;
  return finalize({
    family: "fracline",
    spec: { type: "jumps", n, d },
    stem: T3(`A frog starts at 0. Each hop is 1/${d} long.`, `A frog starts at 0 on a number line. Each hop is 1/${d} long.`, `A frog starts at 0 on a number line and moves in hops that are each 1/${d} long.`),
    ask: T3(`How many hops reach ${n}/${d}?`, `How many hops does it take to reach ${n}/${d}?`, `How many hops are needed to land on ${n}/${d}?`),
    expr: null,
    answer: ansInt(ans),
    work: [`Each hop is 1/${d}, and ${n}/${d} is ${n} of those parts, so ${n} hops land on ${n}/${d}.`],
    visual: { kind: "numberline", alt: `A number line from 0 to ${top} split into ${d} equal parts per whole. The first hop of 1/${d} is drawn and the goal is marked.`, min: 0, max: top, ticks: d * top, marks: [{ at: `${n}/${d}`, label: "goal" }], hops: [{ from: 0, to: `1/${d}`, label: `1/${d}` }], show: "frac" },
    distractors: mkD(ans, num(ans), [[d, "answered-with-the-denominator"], [n + 1, "counted-the-starting-point"], [n - 1, "stopped-one-hop-early"], [d + n, "added-the-numbers"], ...nearInts(ans)], fmtInt),
    hints: { conceptual: "Each hop covers one unit fraction. The numerator of the goal tells how many unit fractions there are.", procedural: "Count by 1/" + d + " from 0, one hop at a time, until you land on the goal." },
    level: lv,
  });
}
function genFracline(rng, p, o) {
  const maxDen = Math.max(5, p.maxDen | 0 || 8);
  const lv = o.level;
  const r = rng.next();
  if (lv === 1) return r < 0.6 ? flLocate(rng, 1, maxDen) : flCmp(rng, 1, maxDen);
  if (lv === 2) return r < 0.35 ? flLocate(rng, 2, maxDen) : r < 0.7 ? flCmp(rng, 2, maxDen) : flJumps(rng, 2, maxDen);
  return r < 0.3 ? flLocate(rng, 3, maxDen) : r < 0.55 ? flWholeFrac(rng, 3, maxDen) : r < 0.8 ? flCmp(rng, 3, maxDen) : flJumps(rng, 3, maxDen);
}
function checkFracline(p, params) {
  const maxDen = Math.max(5, (params && params.maxDen) | 0 || 8);
  const s = p.spec;
  const dens = s.type === "cmp" ? s.fracs.map((f) => f[1]) : [s.d];
  if (dens.some((d) => d > maxDen)) return `denominator exceeds maxDen ${maxDen}`;
  return null;
}

// ---------------------------------------------------------------------------------------------------- areaperim
const APOBJ = {
  store: { obj: "a sign", short: "sign", unit: "feet" },
  garden: { obj: "a garden bed", short: "garden bed", unit: "meters" },
  sports: { obj: "a playing field", short: "field", unit: "meters" },
  kitchen: { obj: "a baking tray", short: "baking tray", unit: "inches" },
  pets: { obj: "a rabbit pen", short: "pen", unit: "feet" },
  library: { obj: "a reading rug", short: "rug", unit: "feet" },
  crafts: { obj: "a piece of felt", short: "piece of felt", unit: "inches" },
  travel: { obj: "a bus-stop sign", short: "sign", unit: "feet" },
  science: { obj: "a lab table", short: "table", unit: "feet" },
  community: { obj: "a mural", short: "mural", unit: "feet" },
};
const ABBR = { feet: "ft", meters: "m", inches: "in", centimeters: "cm" };
function apRectVisual(w, h, unit, hideH) {
  return { kind: "rect", alt: `A rectangle ${w} ${unit} wide and ${hideH ? "of unknown height" : `${h} ${unit} tall`}.`, w, h, unit: ABBR[unit], showArea: false, showPerimeter: false, labels: [`${w}`, hideH ? "?" : `${h}`] };
}
function apBasic(rng, lv, M, ctx, kind) {
  const O = APOBJ[ctx] || APOBJ.store;
  const hi = lv === 1 ? Math.min(M, 6) : M;
  let w = rng.int(2, hi);
  let h = rng.int(2, hi);
  if (w === h) h = w === hi ? w - 1 : w + 1;
  if (h < 2) h = 2;
  const u = O.unit;
  const tiles = kind === "area" && rng.chance(0.3);
  const stem = tiles
    ? T3(`${cap(O.obj)} is covered with square tiles. There are ${h} rows with ${w} tiles in each row.`, `${cap(O.obj)} is covered with square tiles in ${h} rows, with ${w} tiles in each row.`, `${cap(O.obj)} is tiled with unit squares arranged in ${h} rows of ${w}.`)
    : T3(`${cap(O.obj)} is a rectangle. It is ${w} ${u} wide and ${h} ${u} tall.`, `${cap(O.obj)} is shaped like a rectangle that is ${w} ${u} wide and ${h} ${u} tall.`, `${cap(O.obj)} is a rectangle with a width of ${w} ${u} and a height of ${h} ${u}.`);
  let ask;
  let ans;
  let cands;
  let work;
  let hints;
  let unit;
  if (kind === "area") {
    ans = w * h;
    ask = tiles ? T3(`How many tiles cover the ${O.short}?`, `How many tiles cover the ${O.short}?`, `How many tiles cover the ${O.short}?`) : T3(`What is the area? Use square ${u}.`, `What is the area of the ${O.short} in square ${u}?`, `What is the area of the ${O.short}, in square ${u}?`);
    cands = [[2 * (w + h), "found-the-perimeter-instead"], [w + h, "added-the-side-lengths"], [w * h * 2, "doubled-the-area"], [w * h + w, "counted-an-extra-row"], [w * (h - 1), "counted-a-row-too-few"]];
    work = [`Area is the number of square units inside. Multiply the side lengths: ${w} ${TIMES} ${h} = ${ans}`];
    hints = { conceptual: "Area counts the square units that cover the inside of a shape. Rows of equal size can be multiplied.", procedural: "Multiply the number of rows by the number of squares in each row, that is, the two side lengths." };
    unit = tiles ? "tiles" : `square ${u}`;
  } else {
    ans = 2 * (w + h);
    ask = T3(`What is the perimeter? It is the distance around.`, `What is the perimeter of the ${O.short}?`, `What is the perimeter of the ${O.short}?`);
    cands = [[w * h, "found-the-area-instead"], [w + h, "added-only-two-sides"], [2 * w + h, "left-out-one-side"], [w + 2 * h, "left-out-one-side"], [2 * w * h, "doubled-the-area"]];
    work = [`Perimeter is the distance around. Add the two sides: ${w} + ${h} = ${w + h}`, `A rectangle has two of each side, so double it: ${w + h} ${TIMES} 2 = ${ans}`];
    hints = { conceptual: "Perimeter is the distance all the way around the outside of a shape.", procedural: "Add all four sides. Opposite sides of a rectangle are equal." };
    unit = u;
  }
  return finalize({
    family: "areaperim",
    spec: { type: kind, w, h },
    stem,
    ask,
    expr: kind === "area" ? `${w} ${TIMES} ${h} = ?` : `${w} + ${h} + ${w} + ${h} = ?`,
    answer: { ...ansInt(ans), unit },
    work,
    visual: lv <= 2 && !tiles ? apRectVisual(w, h, u, false) : null,
    distractors: mkD(ans, num(ans), [...cands, ...nearInts(ans)], fmtInt),
    hints,
    level: lv,
  });
}
function apMissing(rng, lv, M, ctx) {
  const O = APOBJ[ctx] || APOBJ.store;
  const u = O.unit;
  const kind = rng.pick(["area", "perim"]);
  const w = rng.int(2, lv === 1 ? Math.min(M, 6) : M);
  const h = rng.int(2, lv === 1 ? Math.min(M, 6) : M);
  let stem;
  let ask;
  let ans;
  let cands;
  let work;
  let hints;
  let total;
  if (kind === "area") {
    total = w * h;
    ans = h;
    stem = T3(`${cap(O.obj)} is a rectangle. Its area is ${total} square ${u}. It is ${w} ${u} wide.`, `${cap(O.obj)} is a rectangle with an area of ${total} square ${u}. It is ${w} ${u} wide.`, `${cap(O.obj)} is a rectangle whose area is ${total} square ${u} and whose width is ${w} ${u}.`);
    ask = T3(`How tall is the ${O.short}?`, `How tall is the ${O.short}?`, `What is the height of the ${O.short}?`);
    cands = [[total - w, "subtracted-instead-of-divided"], [total + w, "added-instead-of-divided"], [total * w, "multiplied-instead-of-divided"], [w, "repeated-the-known-side"], [h + 1, "off-by-one"]];
    work = [`Area = width ${TIMES} height, so the height is a missing factor.`, `${total} ${DIVIDE} ${w} = ${h}`, `Check: ${w} ${TIMES} ${h} = ${total}`];
    hints = { conceptual: "Area is width times height. If you know the area and one side, the other side is a missing factor.", procedural: "Divide the area by the side you know." };
  } else {
    total = 2 * (w + h);
    ans = h;
    stem = T3(`${cap(O.obj)} is a rectangle. Its perimeter is ${total} ${u}. It is ${w} ${u} wide.`, `${cap(O.obj)} is a rectangle with a perimeter of ${total} ${u}. It is ${w} ${u} wide.`, `${cap(O.obj)} is a rectangle whose perimeter is ${total} ${u} and whose width is ${w} ${u}.`);
    ask = T3(`How tall is the ${O.short}?`, `How tall is the ${O.short}?`, `What is the height of the ${O.short}?`);
    cands = [[total - w, "subtracted-one-side-only"], [total / 2, "stopped-after-halving"], [total - 2 * w, "forgot-to-halve"], [w, "repeated-the-known-side"], [h + 1, "off-by-one"]];
    work = [`The two widths and two heights add to ${total}. Half of that is the width plus the height: ${total} ${DIVIDE} 2 = ${w + h}`, `The height is what is left after the width: ${w + h} ${MINUS} ${w} = ${h}`];
    hints = { conceptual: "The perimeter has two widths and two heights. Half the perimeter is one width plus one height.", procedural: "Halve the perimeter first. Then take away the side you know." };
  }
  return finalize({
    family: "areaperim",
    spec: { type: "missing", kind, known: w, total },
    stem,
    ask,
    expr: null,
    answer: { ...ansInt(ans), unit: u },
    work,
    visual: lv <= 2 ? apRectVisual(w, h, u, true) : null,
    distractors: mkD(ans, num(ans), [...cands, ...nearInts(ans)], fmtInt),
    hints,
    level: lv,
  });
}
function apSameArea(rng, M, ctx) {
  const O = APOBJ[ctx] || APOBJ.store;
  const u = O.unit;
  const [A, B] = twoNames(rng);
  return until(() => {
    const w1 = rng.int(2, M);
    const h1 = rng.int(2, M);
    const area = w1 * h1;
    const opts = [];
    for (let w2 = 2; w2 <= M; w2++) if (area % w2 === 0 && area / w2 <= M && area / w2 >= 2 && w2 !== w1 && w2 !== h1) opts.push(w2);
    if (!opts.length) return null;
    const w2 = rng.pick(opts);
    const h2 = area / w2;
    const ans = 2 * (w2 + h2);
    const cands = [[2 * (w1 + h1), "used-the-first-rectangle-perimeter"], [area, "found-the-area-instead"], [w2 + h2, "added-only-two-sides"], [2 * w2 + h2, "left-out-one-side"], [ans + 2, "off-by-one-side-length"]];
    return finalize({
      family: "areaperim",
      spec: { type: "samearea", w1, h1, w2 },
      stem: T3(`${A} draws a rectangle that is ${w1} ${u} by ${h1} ${u}. ${B} draws a different rectangle with the same area. ${B}'s rectangle is ${w2} ${u} wide.`, `${A} draws a rectangle that is ${w1} ${u} by ${h1} ${u}. ${B} draws a different rectangle with the same area that is ${w2} ${u} wide.`, `${A} draws a ${w1} ${u} by ${h1} ${u} rectangle. ${B} draws a different rectangle of equal area with a width of ${w2} ${u}.`),
      ask: T3(`What is the perimeter of ${B}'s rectangle?`, `What is the perimeter of ${B}'s rectangle?`, `What is the perimeter of ${B}'s rectangle?`),
      expr: null,
      answer: { ...ansInt(ans), unit: u },
      work: [`Find the shared area: ${w1} ${TIMES} ${h1} = ${area}`, `Find ${B}'s height: ${area} ${DIVIDE} ${w2} = ${h2}`, `Perimeter: ${w2} + ${h2} = ${w2 + h2}, and ${w2 + h2} ${TIMES} 2 = ${ans}`],
      visual: null,
      distractors: mkD(ans, num(ans), [...cands, ...nearInts(ans)], fmtInt),
      hints: { conceptual: "Rectangles with the same area can have different perimeters. The area tells you the missing side.", procedural: "Find the area first. Divide it by the known width to get the height. Then add up the four sides." },
      level: 3,
    });
  });
}
function apComposite(rng, M, ctx) {
  const O = APOBJ[ctx] || APOBJ.store;
  const u = O.unit;
  const w1 = rng.int(3, M);
  const h1 = rng.int(2, M);
  const w2 = rng.int(2, M);
  const h2 = h1;
  const ans = w1 * h1 + w2 * h2;
  const cands = [[w1 * h1, "found-only-one-rectangle"], [(w1 + w2) * (h1 + h2), "multiplied-the-sums"], [w1 + h1 + w2 + h2, "added-the-sides"], [w1 * h1 * w2 * h2 > 0 ? (w1 + w2) * h1 + h1 : null, "counted-a-row-twice"], [2 * (w1 + h1) + 2 * (w2 + h2), "found-the-perimeter-instead"]];
  return finalize({
    family: "areaperim",
    spec: { type: "composite", rects: [[w1, h1], [w2, h2]] },
    stem: T3(`${cap(O.obj)} is made of two rectangles side by side. One is ${w1} ${u} by ${h1} ${u}. The other is ${w2} ${u} by ${h2} ${u}.`, `${cap(O.obj)} is made of two rectangles joined side by side. One rectangle is ${w1} ${u} by ${h1} ${u}, and the other is ${w2} ${u} by ${h2} ${u}.`, `${cap(O.obj)} is composed of two rectangles joined along a side: one measures ${w1} ${u} by ${h1} ${u}, and the other measures ${w2} ${u} by ${h2} ${u}.`),
    ask: T3(`What is the area of the whole shape in square ${u}?`, `What is the total area in square ${u}?`, `What is the total area of the shape, in square ${u}?`),
    expr: `(${w1} ${TIMES} ${h1}) + (${w2} ${TIMES} ${h2}) = ?`,
    answer: { ...ansInt(ans), unit: `square ${u}` },
    work: [`First rectangle: ${w1} ${TIMES} ${h1} = ${w1 * h1}`, `Second rectangle: ${w2} ${TIMES} ${h2} = ${w2 * h2}`, `Add the two areas: ${w1 * h1} + ${w2 * h2} = ${ans}`],
    visual: null,
    distractors: mkD(ans, num(ans), [...cands, ...nearInts(ans)], fmtInt),
    hints: { conceptual: "The area of a shape made of rectangles is the sum of the areas of its parts.", procedural: "Find the area of each rectangle separately. Then add the two areas." },
    level: 3,
  });
}
function genAreaperim(rng, p, o) {
  const M = Math.max(6, p.max | 0 || 12);
  const lv = o.level;
  const r = rng.next();
  if (lv === 1) return r < 0.5 ? apBasic(rng, 1, M, o.ctx, "area") : apBasic(rng, 1, M, o.ctx, "perim");
  if (lv === 2) return r < 0.3 ? apBasic(rng, 2, M, o.ctx, "area") : r < 0.55 ? apBasic(rng, 2, M, o.ctx, "perim") : apMissing(rng, 2, M, o.ctx);
  return r < 0.3 ? apSameArea(rng, M, o.ctx) : r < 0.55 ? apComposite(rng, M, o.ctx) : r < 0.8 ? apMissing(rng, 3, M, o.ctx) : apBasic(rng, 3, M, o.ctx, rng.chance(0.5) ? "area" : "perim");
}
function checkAreaperim(p, params) {
  const M = Math.max(6, (params && params.max) | 0 || 12);
  const s = p.spec;
  const sides = s.type === "composite" ? s.rects.flat() : s.type === "missing" ? [s.known] : s.type === "samearea" ? [s.w1, s.h1, s.w2] : [s.w, s.h];
  if (sides.some((v) => v > M)) return `a side length exceeds max ${M}`;
  return null;
}

// ---------------------------------------------------------------------------------------------------- elapsed (time, volume, mass)
const ACT = {
  store: "worked at the school store",
  garden: "watered the garden",
  sports: "practiced soccer",
  kitchen: "baked muffins",
  pets: "walked the dog",
  library: "read in the library",
  crafts: "made paper stars",
  travel: "rode the bus",
  science: "ran a plant experiment",
  community: "picked up litter at the park",
};
const tf = (h, m) => `${h}:${String(m).padStart(2, "0")}`;
const hr12 = (mins) => {
  const t = ((mins % 720) + 720) % 720;
  const h = Math.floor(t / 60) || 12;
  return [h, t % 60];
};
const toMin = (h, m) => (h % 12) * 60 + m;
function elTime(rng, lv, ctx) {
  const [N] = rng.sample(NAMES, 1);
  const act = ACT[ctx] || ACT.store;
  let sh = rng.int(1, 12);
  let sm;
  let mins;
  if (lv === 1) {
    sm = rng.int(0, 9) * 5;
    mins = rng.int(1, Math.floor((55 - sm) / 5)) * 5;
  } else if (lv === 2) {
    sm = rng.int(7, 11) * 5;
    mins = rng.int(Math.floor((65 - sm) / 5), 9) * 5;
  } else {
    sm = rng.int(1, 58);
    mins = rng.int(25, Math.min(90, 119 - sm));
    if (sm + mins < 60 && rng.chance(0.7)) mins = 60 - sm + rng.int(5, 25);
  }
  if (mins < 5 || mins > 90 || sm + mins === 60 || sm + mins >= 120) return null;
  const startTotal = toMin(sh, sm);
  const [eh, em] = hr12(startTotal + mins);
  const crosses = sm + mins >= 60;
  const find = rng.pick(["end", "elapsed", "start"]);
  const s = tf(sh, sm);
  const e = tf(eh, em);
  let stem;
  let ask;
  let ans;
  let cands;
  let work;
  let kind = "text";
  if (find === "end") {
    stem = T3(`${N} ${act}. ${N} started at ${s}. It took ${mins} minutes.`, `${N} ${act}. ${N} started at ${s}, and it took ${mins} minutes.`, `${N} ${act}, beginning at ${s}. The activity lasted ${mins} minutes.`);
    ask = T3(`What time did ${N} finish?`, `What time did ${N} finish?`, "At what time did the activity end?");
    ans = e;
    const [bh, bm] = hr12(startTotal - mins);
    cands = [[tf(bh, bm), "subtracted-instead-of-added"], crosses ? [`${sh}:${sm + mins}`, "forgot-to-regroup-minutes"] : [tf(sh === 12 ? 1 : sh + 1, em), "added-an-extra-hour"], crosses ? [tf(sh, em), "forgot-the-hour-changed"] : [tf(sh === 1 ? 12 : sh - 1, em), "hour-slip"], [tf(...hr12(startTotal + mins + 10)), "counted-on-too-far"], [tf(...hr12(startTotal + mins - 10)), "counted-on-too-little"]];
    work = [crosses ? `From ${s}, add minutes to reach the next hour: 60 ${MINUS} ${sm} = ${60 - sm}` : `From ${s}, count on ${mins} minutes.`, crosses ? `That leaves ${mins - (60 - sm)} more minutes after the hour. The end time is ${e}.` : `${sm} + ${mins} = ${sm + mins}, so the end time is ${e}.`];
  } else if (find === "elapsed") {
    stem = T3(`${N} ${act}. ${N} started at ${s}. ${N} stopped at ${e}.`, `${N} ${act}. ${N} started at ${s} and stopped at ${e}.`, `${N} ${act}, starting at ${s} and stopping at ${e}.`);
    ask = T3("How many minutes did it take?", "How many minutes did it take?", "How many minutes did the activity last?");
    ans = mins;
    kind = "int";
    cands = [[crosses ? Math.abs(em - sm) : mins + 10, crosses ? "subtracted-smaller-from-larger" : "counted-on-too-far"], [crosses ? 60 - sm : mins - 5, crosses ? "counted-only-to-the-next-hour" : "counted-on-too-little"], [crosses ? mins + 60 : mins + 60, "added-an-extra-hour"], [crosses ? em : mins + 5, crosses ? "used-only-the-end-minutes" : "counted-on-too-far"], [mins - 10, "counted-on-too-little"]];
    work = [crosses ? `Count to the next hour: 60 ${MINUS} ${sm} = ${60 - sm}` : `Subtract the minutes: ${em} ${MINUS} ${sm} = ${mins}`, crosses ? `Then count the minutes after the hour: ${60 - sm} + ${em} = ${mins}` : `It took ${mins} minutes.`];
  } else {
    stem = T3(`${N} ${act}. ${N} finished at ${e}. It took ${mins} minutes.`, `${N} ${act}. ${N} finished at ${e}, and it took ${mins} minutes.`, `${N} ${act}, finishing at ${e}. The activity lasted ${mins} minutes.`);
    ask = T3(`What time did ${N} start?`, `What time did ${N} start?`, "At what time did the activity begin?");
    ans = s;
    cands = [[tf(...hr12(startTotal + 2 * mins)), "added-instead-of-subtracted"], em < mins ? [`${eh}:${String(Math.abs(em - mins)).padStart(2, "0")}`, "subtracted-smaller-from-larger"] : [tf(eh === 12 ? 1 : eh + 1, sm), "hour-slip"], [tf(...hr12(startTotal + 10)), "counted-back-too-little"], [tf(...hr12(startTotal - 10)), "counted-back-too-far"], [tf(eh, sm), "kept-the-end-hour"]];
    work = [crosses ? `Count back to the hour: ${em} minutes goes to ${eh}:00, and ${mins} ${MINUS} ${em} = ${mins - em}` : `Count back ${mins} minutes from ${e}: ${em} ${MINUS} ${mins} = ${sm}`, crosses ? `Count back ${mins - em} more minutes before the hour. The start time is ${s}.` : `The start time is ${s}.`];
  }
  const clockOf = find === "start" ? [eh, em] : [sh, sm];
  const answer = kind === "int" ? { ...ansInt(ans), unit: "minutes" } : { value: ans, text: ans, kind: "text" };
  const dist = kind === "int" ? mkD(ans, num(ans), [...cands, ...nearInts(ans)], fmtInt) : mkT(ans, cands);
  return finalize({
    family: "elapsed",
    spec: { type: "time", find, start: find === "start" ? null : [sh, sm], end: find === "end" ? null : [eh, em], mins: find === "elapsed" ? null : mins },
    stem,
    ask,
    expr: null,
    answer,
    work,
    visual: lv <= 2 ? { kind: "clock", alt: `An analog clock showing ${tf(...clockOf)}.`, h: clockOf[0], m: clockOf[1], numerals: true } : null,
    distractors: dist,
    hints: { conceptual: "Elapsed time is how much time passes from the start to the end. An hour has 60 minutes.", procedural: "Use a number line or a clock. Count to the next hour first if the time crosses it." },
    level: lv,
  });
}
const QTY = {
  store: { vol: "paint", mass: "rice" },
  garden: { vol: "water", mass: "soil" },
  sports: { vol: "sports drink", mass: "sand" },
  kitchen: { vol: "milk", mass: "flour" },
  pets: { vol: "water", mass: "dog food" },
  library: { vol: "water", mass: "clay" },
  crafts: { vol: "paint", mass: "clay" },
  travel: { vol: "fuel", mass: "luggage" },
  science: { vol: "water", mass: "sand" },
  community: { vol: "juice", mass: "apples" },
};
function elMeasure(rng, lv, ctx) {
  const Q = QTY[ctx] || QTY.store;
  const isVol = rng.chance(0.5);
  const s = isVol ? Q.vol : Q.mass;
  const [N] = rng.sample(NAMES, 1);
  const op = lv === 3 ? rng.pick(["mul", "div", "mul", "div", "add", "sub"]) : rng.pick(["add", "sub"]);
  const small = lv >= 2;
  const unit = isVol ? (small ? "mL" : "L") : small ? "g" : "kg";
  let a;
  let b;
  if (op === "add") {
    a = small ? rng.int(120, 640) : rng.int(8, 60);
    b = small ? rng.int(100, 1000 - a) : rng.int(5, 100 - a);
  } else if (op === "sub") {
    a = small ? rng.int(300, 950) : rng.int(30, 95);
    b = small ? rng.int(40, a - 50) : rng.int(5, a - 5);
  } else if (op === "mul") {
    a = rng.int(3, 9);
    b = small ? rng.int(12, Math.floor(950 / a)) : rng.int(3, Math.floor(100 / a));
  } else {
    b = rng.int(3, 9);
    const q = small ? rng.int(12, Math.floor(950 / b)) : rng.int(3, Math.floor(95 / b));
    a = b * q;
  }
  const holder = isVol ? "container" : "bag";
  const holders = isVol ? "jugs" : "bags";
  const verbPut = isVol ? "pours" : "puts";
  const verbIn = isVol ? "pours" : "adds";
  let stem;
  let ask;
  let ans;
  let cands;
  let work;
  if (op === "add") {
    ans = a + b;
    stem = T3(`${N} ${verbPut} ${a} ${unit} of ${s} into a ${holder}. Then ${N} ${verbIn} ${b} ${unit} more.`, `${N} ${verbPut} ${a} ${unit} of ${s} into a ${holder}. Then ${N} ${verbIn} ${b} ${unit} more.`, `${N} ${verbPut} ${a} ${unit} of ${s} into a ${holder} and then ${verbIn} ${b} ${unit} more.`);
    ask = T3(`How much ${s} is in the ${holder} now?`, `How much ${s} is in the ${holder} now?`, `How much ${s} is in the ${holder} in total?`);
    cands = [[a - b > 0 ? a - b : null, "subtracted-instead-of-added"], [a * b, "multiplied-instead-of-added"], [ans + 10, "regrouping-slip"], [ans - 10, "regrouping-slip"], [ans + 100, "place-value-slip"]];
    work = [`Add the two amounts: ${a} + ${b} = ${ans}`];
  } else if (op === "sub") {
    ans = a - b;
    stem = T3(`A ${holder} has ${a} ${unit} of ${s}. ${N} takes out ${b} ${unit}.`, `A ${holder} has ${a} ${unit} of ${s}. ${N} takes out ${b} ${unit}.`, `A ${holder} contains ${a} ${unit} of ${s}, and ${N} removes ${b} ${unit}.`);
    ask = T3(`How much ${s} is left?`, `How much ${s} is left in the ${holder}?`, `How much ${s} remains in the ${holder}?`);
    cands = [[a + b, "added-instead-of-subtracted"], [b - a > 0 ? b - a : null, "subtracted-smaller-from-larger"], [ans + 10, "regrouping-slip"], [ans - 10, "regrouping-slip"], [ans + 100, "place-value-slip"]];
    work = [`Subtract the amount taken out: ${a} ${MINUS} ${b} = ${ans}`];
  } else if (op === "mul") {
    ans = a * b;
    stem = T3(`${N} fills ${a} ${holders} with ${b} ${unit} of ${s} in each.`, `${N} fills ${a} ${holders}, with ${b} ${unit} of ${s} in each one.`, `${N} fills ${a} ${holders} so that each one holds ${b} ${unit} of ${s}.`);
    ask = T3(`How much ${s} is that in all?`, `How much ${s} is that in all?`, `What is the total amount of ${s}?`);
    cands = [[a + b, "added-instead-of-multiplied"], [ans + b, "one-group-too-many"], [ans - b, "one-group-too-few"], [ans * 10, "place-value-slip"], [a * (b + 10), "multiplication-slip"]];
    work = [`${a} ${holders} with ${b} ${unit} each: ${a} ${TIMES} ${b} = ${ans}`];
  } else {
    ans = a / b;
    stem = T3(`${N} has ${a} ${unit} of ${s}. ${N} shares it equally into ${b} ${holders}.`, `${N} shares ${a} ${unit} of ${s} equally into ${b} ${holders}.`, `${N} divides ${a} ${unit} of ${s} equally among ${b} ${holders}.`);
    ask = T3(`How much ${s} is in each of the ${holders}?`, `How much ${s} is in each of the ${holders}?`, `How much ${s} does each of the ${holders} get?`);
    cands = [[a - b, "subtracted-instead-of-divided"], [a * b, "multiplied-instead-of-divided"], [b, "answered-with-the-number-of-containers"], [ans + 10, "division-slip"], [ans - 1, "off-by-one"]];
    work = [`Share equally: ${a} ${DIVIDE} ${b} = ${ans}`, `Check: ${b} ${TIMES} ${ans} = ${a}`];
  }
  return finalize({
    family: "elapsed",
    spec: { type: "meas", op, a, b, unit },
    stem,
    ask,
    expr: null,
    answer: { ...ansInt(ans), unit },
    work,
    visual: null,
    distractors: mkD(ans, num(ans), [...cands, ...nearInts(ans)], fmtInt),
    hints: { conceptual: `Both amounts are in ${unit}, so you can add, subtract, multiply or divide them as ordinary numbers.`, procedural: "Decide what the story is doing to the amount: putting together, taking away, making equal groups or sharing equally." },
    level: lv,
  });
}
function genElapsed(rng, p, o) {
  const lv = o.level;
  const t = lv === 1 ? 0.6 : lv === 2 ? 0.5 : 0.45;
  return rng.chance(t) ? until(() => elTime(rng, lv, o.ctx)) : elMeasure(rng, lv, o.ctx);
}

// ---------------------------------------------------------------------------------------------------- multidigit
const PLACES = ["ones", "tens", "hundreds", "thousands", "ten thousands", "hundred thousands", "millions"];
const digitsRev = (n) => String(n).split("").reverse().map(Number);
const fromDigitsRev = (ds) => Number(ds.slice().reverse().join("") || 0);
function addWork(a, b) {
  const A = digitsRev(a);
  const B = digitsRev(b);
  const n = Math.max(A.length, B.length);
  const lines = [];
  let carry = 0;
  for (let i = 0; i < n; i++) {
    const da = A[i] ?? 0;
    const db = B[i] ?? 0;
    const s0 = da + db;
    const s = s0 + carry;
    let line = `${cap(PLACES[i])}: ${da} + ${db} = ${s0}`;
    if (carry) line += `, then ${s0} + ${carry} = ${s}`;
    if (s >= 10) {
      line += `. Write ${s % 10} and regroup 1 to the ${PLACES[i + 1]}`;
      carry = 1;
    } else carry = 0;
    lines.push(`${line}.`);
  }
  if (carry) lines.push(`Write the last 1 in the ${PLACES[n]} place.`);
  lines.push(`${num(a)} + ${num(b)} = ${num(a + b)}`);
  return lines;
}
function subWork(a, b) {
  const A = digitsRev(a);
  const B = digitsRev(b);
  const lines = [];
  let borrow = 0;
  for (let i = 0; i < A.length; i++) {
    let da = A[i] - borrow;
    const db = B[i] ?? 0;
    let note = "";
    if (da < db) {
      da += 10;
      borrow = 1;
      note = `. Regroup 1 from the ${PLACES[i + 1]} first`;
    } else borrow = 0;
    lines.push(`${cap(PLACES[i])}: ${da} ${MINUS} ${db} = ${da - db}${note}.`);
  }
  lines.push(`${num(a)} ${MINUS} ${num(b)} = ${num(a - b)}`);
  return lines;
}
function runningSum(parts) {
  const lines = [];
  let acc = parts[0];
  for (let i = 1; i < parts.length; i++) {
    lines.push(`${num(acc)} + ${num(parts[i])} = ${num(acc + parts[i])}`);
    acc += parts[i];
  }
  return lines;
}
function mulWork1(a, m) {
  const ds = String(a).split("");
  const parts = ds.map((d, i) => Number(d) * 10 ** (ds.length - 1 - i)).filter((x) => x > 0);
  const lines = [`Break ${num(a)} into ${parts.map(num).join(" + ")}.`];
  for (const p of parts) lines.push(`${num(p)} ${TIMES} ${m} = ${num(p * m)}`);
  lines.push(...runningSum(parts.map((p) => p * m)));
  lines.push(`${num(a)} ${TIMES} ${m} = ${num(a * m)}`);
  return lines;
}
function mulWork2(a, b) {
  const tens = Math.floor(b / 10) * 10;
  const ones = b % 10;
  const parts = [a * ones, a * tens].filter((x) => x > 0);
  const lines = [`Break ${b} into ${tens} and ${ones}.`];
  if (ones) lines.push(`${a} ${TIMES} ${ones} = ${num(a * ones)}`);
  lines.push(`${a} ${TIMES} ${tens} = ${num(a * tens)}`);
  if (parts.length > 1) lines.push(...runningSum(parts));
  lines.push(`${a} ${TIMES} ${b} = ${num(a * b)}`);
  return lines;
}
function divWork(a, b) {
  const ds = String(a).split("").map(Number);
  const lines = [];
  let rem = 0;
  let started = false;
  const qd = [];
  for (const d of ds) {
    const cur = rem * 10 + d;
    const q = Math.floor(cur / b);
    if (!started && q === 0) {
      rem = cur;
      continue;
    }
    started = true;
    rem = cur - q * b;
    qd.push(q);
    lines.push(q === 0 ? `${cur}: ${b} fits 0 times, so write 0 in the quotient and keep ${cur}` : `${cur}: ${b} fits ${q} times, because ${q} ${TIMES} ${b} = ${q * b} and ${cur} ${MINUS} ${q * b} = ${rem}`);
  }
  const Q = Math.floor(a / b);
  const r = a % b;
  lines.push(r === 0 ? `${num(a)} ${DIVIDE} ${b} = ${num(Q)}` : `The quotient is ${num(Q)} with a remainder of ${r}`);
  lines.push(`Check: ${num(Q)} ${TIMES} ${b} = ${num(Q * b)}${r ? `, and ${num(Q * b)} + ${r} = ${num(a)}` : ""}`);
  return lines;
}
function noCarrySum(a, b) {
  const A = digitsRev(a);
  const B = digitsRev(b);
  const out = [];
  for (let i = 0; i < Math.max(A.length, B.length); i++) out.push(((A[i] ?? 0) + (B[i] ?? 0)) % 10);
  return fromDigitsRev(out);
}
function noBorrowDiff(a, b) {
  const A = digitsRev(a);
  const B = digitsRev(b);
  return fromDigitsRev(A.map((d, i) => Math.abs(d - (B[i] ?? 0))));
}
function firstCarry(a, b) {
  const A = digitsRev(a);
  const B = digitsRev(b);
  for (let i = 0; i < Math.max(A.length, B.length); i++) if ((A[i] ?? 0) + (B[i] ?? 0) >= 10) return i;
  return -1;
}
function firstBorrow(a, b) {
  const A = digitsRev(a);
  const B = digitsRev(b);
  for (let i = 0; i < A.length; i++) if (A[i] < (B[i] ?? 0)) return i;
  return -1;
}
const MDHINTS = {
  add: { conceptual: "Add the same place values together: ones with ones, tens with tens. When a column makes ten or more, regroup to the next place.", procedural: "Line up the digits. Add from the ones place to the left and write the regrouped digit above the next place." },
  sub: { conceptual: "Subtract each place value. If the top digit is too small, regroup one from the next place to the left.", procedural: "Line up the digits. Start at the ones place and regroup before you subtract when you need to." },
  mul1: { conceptual: "Multiplying a number by one digit means multiplying each of its place values and adding the partial products.", procedural: "Break the larger number into thousands, hundreds, tens and ones. Multiply each part, then add the partial products." },
  mul2: { conceptual: "Break the second number into tens and ones. Each part makes its own partial product, and the tens part ends in zero.", procedural: "Multiply by the ones digit, then by the tens, then add the two partial products." },
  div: { conceptual: "Division shares a number into equal groups. A remainder is what is left over when it cannot make another full group.", procedural: "Work from the left one place at a time: divide, multiply, subtract, then bring down the next digit." },
};
function mdNumbers(rng, lv, op) {
  if (op === "add") {
    if (lv === 1) {
      const a = rng.int(1200, 79999);
      return [a, rng.int(1000, 99999 - a)];
    }
    if (lv === 2) {
      const a = rng.int(20000, 700000);
      return [a, rng.int(10000, 999999 - a)];
    }
    const a = rng.int(100000, 850000);
    const b = Number(Array.from({ length: 5 }, () => rng.int(5, 9)).join(""));
    return [a, b];
  }
  if (op === "sub") {
    if (lv === 1) {
      const a = rng.int(3000, 99999);
      return [a, rng.int(1200, a - 500)];
    }
    if (lv === 2) {
      const a = rng.int(100000, 999999);
      return [a, rng.int(20000, a - 10000)];
    }
    const zeros = [100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 40000, 50000, 60000, 70000, 80000];
    const a = rng.pick(zeros) + rng.pick([0, 0, 4, 8, 400, 3000]);
    return [a, rng.int(Math.floor(a / 12), Math.floor(a / 3))];
  }
  return null;
}
function genMultidigit(rng, p, o) {
  const lv = o.level;
  const op = rng.pick(lv === 1 ? ["add", "sub", "mul", "div"] : lv === 2 ? ["add", "sub", "mul", "mul", "div", "div"] : ["add", "sub", "mul", "div", "div"]);
  const P = pack(rng, o.ctx);
  const story = rng.chance(lv === 1 ? 0.3 : 0.4);
  const [A] = rng.sample(NAMES, 1);
  let a;
  let b;
  let ans;
  let ansText;
  let work;
  let hints;
  let cands;
  let isText = false;
  let visual = null;
  let sym;
  let stem = null;
  let ask;
  let structure;
  let bareAsk;
  if (op === "add" || op === "sub") {
    [a, b] = mdNumbers(rng, lv, op);
    ans = op === "add" ? a + b : a - b;
    work = op === "add" ? addWork(a, b) : subWork(a, b);
    hints = MDHINTS[op];
    sym = op === "add" ? "+" : MINUS;
    if (op === "add") {
      const k = firstCarry(a, b);
      cands = [[noCarrySum(a, b), "forgot-to-regroup"], k >= 0 ? [ans - 10 ** (k + 1), "forgot-the-regrouped-one"] : null, [Math.abs(a - b), "subtracted-instead-of-added"], k >= 0 ? [ans + 10 ** (k + 1), "regrouped-twice"] : [ans + 1000, "place-value-slip"], [ans + 10, "regrouping-slip"], [ans - 100, "regrouping-slip"]];
    } else {
      const k = firstBorrow(a, b);
      cands = [[noBorrowDiff(a, b), "subtracted-the-smaller-digit-from-the-larger"], k >= 0 ? [ans + 10 ** (k + 1), "did-not-reduce-after-regrouping"] : null, [a + b, "added-instead-of-subtracted"], k >= 0 ? [ans - 10 ** k, "regrouped-the-wrong-amount"] : [ans - 100, "regrouping-slip"], [ans + 1000, "place-value-slip"], [ans - 10, "regrouping-slip"]];
    }
    stem = story
      ? T3(`A warehouse has ${num(a)} ${P.im} in one room. It has ${num(b)} ${P.im} in another room.`, `A warehouse has ${num(a)} ${P.im} in one room and ${num(b)} ${P.im} in another room.`, `A warehouse stores ${num(a)} ${P.im} in one room and ${num(b)} ${P.im} in a second room.`)
      : null;
    if (story) {
      ask = op === "add" ? T3(`How many ${P.im} are in both rooms?`, `How many ${P.im} are in the two rooms?`, `How many ${P.im} does the warehouse store altogether?`) : T3(`How many more ${P.im} are in the first room?`, `How many more ${P.im} are in the first room than in the second room?`, `By how many ${P.im} does the first room exceed the second room?`);
      if (op === "sub") {
        stem = T3(`A warehouse has ${num(a)} ${P.im} in one room. It has ${num(b)} ${P.im} in another room.`, `A warehouse has ${num(a)} ${P.im} in one room and ${num(b)} ${P.im} in another room.`, `A warehouse stores ${num(a)} ${P.im} in one room and ${num(b)} ${P.im} in a second room.`);
      }
      structure = STRUCT(op === "add" ? "A warehouse has stock in two rooms." : "A warehouse has stock in two rooms and the rooms are compared.", [{ label: "first room", value: a }, { label: "second room", value: b }], op === "add" ? "stock in both rooms" : "how many more in the first room", op === "add" ? "part + part = whole" : "bigger amount - smaller amount = difference", op === "add" ? "part-part-whole tape" : "comparison tape", op === "add" ? "The total is more than either room." : "The difference is less than the first room.");
    } else {
      bareAsk = op === "add" ? T3("Add.", "Find the sum.", "Calculate the sum using the standard algorithm.") : T3("Subtract.", "Find the difference.", "Calculate the difference using the standard algorithm.");
    }
    ansText = num(ans);
  } else if (op === "mul") {
    const two = lv >= 2 && rng.chance(lv === 2 ? 0.45 : 0.5);
    if (two) {
      a = rng.int(lv === 2 ? 12 : 23, lv === 2 ? 52 : 99);
      if (a % 10 === 0) a += 1;
      b = rng.int(lv === 2 ? 11 : 24, lv === 2 ? 49 : 98);
      work = mulWork2(a, b);
      hints = MDHINTS.mul2;
      const tens = Math.floor(b / 10) * 10;
      const ones = b % 10;
      cands = [[a * ones + a * (tens / 10), "forgot-the-zero-placeholder"], [a * ones, "left-out-the-tens-partial-product"], [a * tens, "left-out-the-ones-partial-product"], [a * b + a * 10, "added-an-extra-partial-product"], [a * b - a, "one-group-too-few"], [a * b + 100, "regrouping-slip"]];
      const cutW = Math.floor(a / 10) * 10;
      visual = lv === 2 && rng.chance(0.5) ? { kind: "areamodel", alt: `A partial-product rectangle for ${a} times ${b}.`, w: a, h: b, ...(cutW > 0 && cutW < a ? { cutW } : {}), ...(tens > 0 && tens < b ? { cutH: tens } : {}), labels: true } : null;
    } else {
      const m = rng.int(2, 9);
      a = lv === 1 ? rng.int(120, 999) : rng.int(1200, 9999);
      b = m;
      work = mulWork1(a, m);
      hints = MDHINTS.mul1;
      const noCarry = fromDigitsRev(digitsRev(a).map((d) => (d * m) % 10));
      cands = [[noCarry, "forgot-to-add-the-regrouped-amount"], [a * (m - 1), "one-group-too-few"], [a * (m + 1), "one-group-too-many"], [a * m * 10, "place-value-slip"], [a + m, "added-instead-of-multiplied"], [a * m + 100, "regrouping-slip"]];
      const cut = Math.floor(a / 100) * 100;
      visual = lv === 1 && a < 1000 ? { kind: "areamodel", alt: `A partial-product rectangle for ${a} times ${m}.`, w: a, h: m, ...(cut > 0 && cut < a ? { cutW: cut } : {}), labels: true } : null;
    }
    ans = a * b;
    sym = TIMES;
    ansText = num(ans);
    if (story) {
      stem = T3(`A box holds ${num(a)} ${P.im}. A school orders ${num(b)} boxes.`, `Each box holds ${num(a)} ${P.im}, and a school orders ${num(b)} boxes.`, `A school orders ${num(b)} boxes, and each box holds ${num(a)} ${P.im}.`);
      ask = T3(`How many ${P.im} are in the order?`, `How many ${P.im} are in the order?`, `How many ${P.im} are in the whole order?`);
      structure = STRUCT("A school orders boxes that each hold the same number of items.", [{ label: "items in each box", value: a }, { label: "number of boxes", value: b }], "items in the order", "size of each group x number of groups = total", "equal groups (area model)", "The total is more than the number in one box.");
    } else bareAsk = T3("Multiply.", "Find the product.", "Calculate the product using the standard algorithm.");
  } else {
    b = rng.int(2, 9);
    let q;
    let r = 0;
    if (lv === 1) q = rng.int(Math.max(12, Math.ceil(100 / b)), Math.min(99, Math.floor(999 / b)));
    else {
      const withRem = rng.chance(lv === 2 ? 0.5 : 0.8);
      q = lv === 3 && rng.chance(0.45) ? rng.int(1, Math.max(1, Math.floor(9999 / b / 1000))) * 1000 + rng.int(1, 9) : rng.int(100, Math.floor(9990 / b) - 1);
      if (withRem) r = rng.int(1, b - 1);
      if (b * q + r > 9999) q = Math.floor((9999 - r) / b);
    }
    a = b * q + r;
    sym = DIVIDE;
    hints = MDHINTS.div;
    work = divWork(a, b);
    if (r === 0) {
      ans = q;
      ansText = num(q);
      const noZero = Number(String(q).replace(/(?<=\d)0/g, ""));
      cands = [[q + 1, "off-by-one"], [q - 1, "off-by-one"], noZero !== q ? [noZero, "left-out-a-zero-in-the-quotient"] : [q * 10, "added-an-extra-zero"], [Math.floor(q / 10), "left-out-a-digit-of-the-quotient"], [q + 10, "place-value-slip"]];
    } else {
      isText = true;
      ans = `${q} r ${r}`;
      ansText = `${num(q)} r ${r}`;
      cands = [
        [`${num(q + 1)} r ${r}`, "rounded-the-quotient-up"],
        [`${num(q - 1)} r ${r + b}`, "remainder-larger-than-the-divisor"],
        [r !== b - r ? `${num(q)} r ${b - r}` : null, "used-the-wrong-remainder"],
        [num(q), "left-out-the-remainder"],
        [`${num(Math.floor(a / (b + 1)))} r ${a % (b + 1)}`, "divided-by-the-wrong-number"],
        [`${num(q)} r ${r + 1}`, "miscounted-the-remainder"],
      ];
    }
    if (story) {
      stem = T3(`A shop has ${num(a)} ${P.im}. It puts ${b} ${P.im} in each box.`, `A shop has ${num(a)} ${P.im} and packs ${b} in each box.`, `A shop packs its ${num(a)} ${P.im} into boxes that hold ${b} each.`);
      ask =
        r === 0
          ? T3("How many boxes does the shop fill?", "How many boxes does the shop fill?", "How many boxes does the shop fill?")
          : T3(`How many full boxes are there? How many ${P.im} are left? Write the full boxes, then r, then the number left.`, `How many full boxes can the shop fill, and how many ${P.im} are left over? Write the number of full boxes, then r, then the number left over.`, `Determine the number of full boxes and the number of ${P.im} left over. Write the number of full boxes, then r, then the number left over.`);
      structure = STRUCT("A shop packs items into boxes of the same size.", [{ label: "items to pack", value: a }, { label: "items in each box", value: b }], r === 0 ? "number of boxes" : "full boxes and items left over", "total / size of each group = number of groups, with a remainder", "equal groups (long division)", r === 0 ? "There are fewer boxes than items." : "The left-over items are fewer than one box holds.");
    } else {
      bareAsk = r === 0 ? T3("Divide.", "Find the quotient.", "Calculate the quotient using long division.") : T3("Divide. Write the quotient, then r, then the remainder.", "Divide. Write your answer as the quotient, then r, then the remainder.", "Find the quotient and the remainder. Write the quotient, then the letter r, then the remainder.");
    }
  }
  const expr = `${num(a)} ${sym} ${num(b)}`;
  const answer = isText ? { value: ans, text: ansText, kind: "text" } : ansInt(ans);
  const dist = isText ? mkT(ansText, cands) : mkD(ans, ansText, [...cands, ...nearInts(ans)], fmtInt);
  return finalize({
    family: "multidigit",
    spec: { type: op, a, b },
    stem: story ? stem : S3(expr),
    ask: story ? ask : bareAsk,
    expr,
    answer,
    work,
    visual,
    distractors: dist,
    hints,
    structure: story ? structure : undefined,
    level: lv,
  });
}
function checkMultidigit(p) {
  const s = p.spec;
  const d = (n) => String(n).length;
  if (s.type === "add" && s.a + s.b > 1000000) return "sum exceeds 1,000,000";
  if (s.type === "sub" && (s.a > 1000000 || s.b > s.a)) return "difference out of range";
  if (s.type === "mul" && !((d(s.a) <= 4 && d(s.b) === 1) || (d(s.a) === 2 && d(s.b) === 2))) return "factor sizes outside 4x1 and 2x2";
  if (s.type === "div" && (s.b > 9 || s.a > 9999)) return "divisor or dividend too large";
  return null;
}

// ---------------------------------------------------------------------------------------------------- multcompare
const ownThing = (rng, ctx) => {
  const c = CONTEXTS[ctx] || CONTEXTS.store;
  const ok = c.things.filter((t) => !(ctx === "sports" && t.one === "lap") && !(ctx === "travel" && t.one === "bus"));
  return rng.pick(ok);
};
const LENGTHS = [
  { small: "red ribbon", big: "blue ribbon", adj: "long", unit: "centimeters" },
  { small: "short rope", big: "long rope", adj: "long", unit: "meters" },
  { small: "young bean plant", big: "older bean plant", adj: "tall", unit: "centimeters" },
  { small: "short path", big: "long path", adj: "long", unit: "meters" },
];
function mcTimes(rng, lv, ctx, type) {
  const sHi = lv === 1 ? 6 : lv === 2 ? 12 : 25;
  const kHi = lv === 1 ? 5 : lv === 2 ? 9 : 10;
  const s = rng.int(2, sHi);
  const k = rng.int(2, kHi);
  const big = s * k;
  const [A, B] = twoNames(rng);
  const lengths = lv >= 2 && rng.chance(0.35);
  let stem;
  let ask;
  let ans;
  let cands;
  let work;
  let rel;
  let known;
  let unknown;
  if (lengths) {
    const L = rng.pick(LENGTHS);
    const u = L.unit;
    if (type === "big") {
      stem = T3(`The ${L.small} is ${s} ${u} ${L.adj}. The ${L.big} is ${k} times as ${L.adj} as the ${L.small}.`, `The ${L.small} is ${s} ${u} ${L.adj}. The ${L.big} is ${k} times as ${L.adj} as the ${L.small} is.`, `The ${L.small} measures ${s} ${u}. The ${L.big} is ${k} times as ${L.adj} as the ${L.small}.`);
      ask = T3(`How ${L.adj} is the ${L.big}?`, `How ${L.adj} is the ${L.big}?`, `What is the measure of the ${L.big}, in ${u}?`);
    } else if (type === "small") {
      stem = T3(`The ${L.big} is ${big} ${u} ${L.adj}. That is ${k} times as ${L.adj} as the ${L.small}.`, `The ${L.big} is ${big} ${u} ${L.adj}, which is ${k} times as ${L.adj} as the ${L.small}.`, `The ${L.big} measures ${big} ${u}, which is ${k} times as ${L.adj} as the ${L.small}.`);
      ask = T3(`How ${L.adj} is the ${L.small}?`, `How ${L.adj} is the ${L.small}?`, `What is the measure of the ${L.small}, in ${u}?`);
    } else {
      stem = T3(`The ${L.small} is ${s} ${u} ${L.adj}. The ${L.big} is ${big} ${u} ${L.adj}.`, `The ${L.small} is ${s} ${u} ${L.adj}, and the ${L.big} is ${big} ${u} ${L.adj}.`, `The ${L.small} measures ${s} ${u}, and the ${L.big} measures ${big} ${u}.`);
      ask = T3(`The ${L.big} is how many times as ${L.adj} as the ${L.small}?`, `The ${L.big} is how many times as ${L.adj} as the ${L.small}?`, `How many times as ${L.adj} is the ${L.big} as the ${L.small}?`);
    }
  } else {
    const t = ownThing(rng, ctx);
    const im = t.many;
    if (type === "big") {
      stem = T3(`${A} has ${s} ${im}. ${B} has ${k} times as many.`, `${A} has ${s} ${im}. ${B} has ${k} times as many ${im} as ${A}.`, `${A} has ${s} ${im}. ${B} has ${k} times as many ${im} as ${A} has.`);
      ask = T3(`How many ${im} does ${B} have?`, `How many ${im} does ${B} have?`, `How many ${im} does ${B} have?`);
    } else if (type === "small") {
      stem = T3(`${B} has ${big} ${im}. That is ${k} times as many as ${A} has.`, `${B} has ${big} ${im}, which is ${k} times as many as ${A} has.`, `${B} has ${big} ${im}. This is ${k} times as many ${im} as ${A} has.`);
      ask = T3(`How many ${im} does ${A} have?`, `How many ${im} does ${A} have?`, `How many ${im} does ${A} have?`);
    } else {
      stem = T3(`${A} has ${s} ${im}. ${B} has ${big} ${im}.`, `${A} has ${s} ${im}, and ${B} has ${big} ${im}.`, `${A} has ${s} ${im}, while ${B} has ${big} ${im}.`);
      ask = T3(`${B} has how many times as many ${im} as ${A}?`, `${B} has how many times as many ${im} as ${A}?`, `How many times as many ${im} does ${B} have as ${A}?`);
    }
  }
  if (type === "big") {
    ans = big;
    cands = [[s + k, "added-instead-of-multiplied"], [big + s, "one-group-too-many"], [big - s, "one-group-too-few"], [s * (k + 1), "used-the-next-multiple"], [s + k + 1, "added-instead-of-multiplied"]];
    work = [`${k} times as many as ${s} means ${k} groups of ${s}: ${k} ${TIMES} ${s} = ${big}`];
    rel = "small amount x times as many = big amount";
    known = [{ label: "the smaller amount", value: s }, { label: "times as many", value: k }];
    unknown = "the bigger amount";
  } else if (type === "small") {
    ans = s;
    cands = [[big - k, "subtracted-instead-of-divided"], [big * k, "multiplied-instead-of-divided"], [k, "answered-with-the-number-of-times"], [s + 1, "off-by-one"], [big - s, "found-a-difference"]];
    work = [`The bigger amount is ${k} times the smaller one, so divide: ${big} ${DIVIDE} ${k} = ${s}`, `Check: ${k} ${TIMES} ${s} = ${big}`];
    rel = "small amount x times as many = big amount";
    known = [{ label: "the bigger amount", value: big }, { label: "times as many", value: k }];
    unknown = "the smaller amount";
  } else {
    ans = k;
    cands = [[big - s, "found-the-difference"], [big * s, "multiplied-instead-of-divided"], [s, "answered-with-the-smaller-amount"], [k + 1, "off-by-one"], [big + s, "added-instead-of-divided"]];
    work = [`Ask how many groups of ${s} make ${big}: ${big} ${DIVIDE} ${s} = ${k}`, `Check: ${k} ${TIMES} ${s} = ${big}`];
    rel = "small amount x times as many = big amount";
    known = [{ label: "the smaller amount", value: s }, { label: "the bigger amount", value: big }];
    unknown = "how many times as many";
  }
  const visual =
    lv === 1
      ? {
          kind: "tape",
          alt: type === "small" ? `Two bars. One bar is split into ${k} equal parts and is ${k} times as long as the short bar.` : `A short bar of ${s} and a long bar made of ${k} bars the same length as the short one.`,
          rows: [
            { label: lengths ? "small" : A, parts: [{ label: type === "small" ? "?" : `${s}`, value: type === "small" ? "?" : s }] },
            { label: lengths ? "big" : B, parts: [{ label: type === "small" ? "?" : `${s}`, value: type === "small" ? "?" : s, n: k }] },
          ],
        }
      : null;
  return finalize({
    family: "multcompare",
    spec: type === "big" ? { type, s, k } : type === "small" ? { type, b: big, k } : { type, s, b: big },
    stem,
    ask,
    expr: type === "big" ? `${k} ${TIMES} ${s} = ?` : type === "small" ? `${k} ${TIMES} ? = ${big}` : `? ${TIMES} ${s} = ${big}`,
    answer: ansInt(ans),
    work,
    visual,
    distractors: mkD(ans, num(ans), [...cands, ...nearInts(ans)], fmtInt),
    hints: { conceptual: `"${k} times as many" compares by multiplying: the bigger amount is made of equal groups the size of the smaller amount. It is not the same as "${k} more".`, procedural: "Draw two bars. Make the long bar from copies of the short bar, then decide whether to multiply or divide." },
    structure: STRUCT("Two amounts are compared with 'times as many'.", known, unknown, rel, "tape diagram (one bar is made of copies of the other)", "The bigger amount is more than the smaller one."),
    level: lv,
  });
}
function mcMore(rng, lv, ctx) {
  const s = rng.int(4, lv === 1 ? 12 : 30);
  const n = rng.int(2, lv === 1 ? 9 : 15);
  const [A, B] = twoNames(rng);
  const im = ownThing(rng, ctx).many;
  const ans = s + n;
  return finalize({
    family: "multcompare",
    spec: { type: "more", s, n },
    stem: T3(`${A} has ${s} ${im}. ${B} has ${n} more than ${A}.`, `${A} has ${s} ${im}. ${B} has ${n} more ${im} than ${A}.`, `${A} has ${s} ${im}. ${B} has ${n} more ${im} than ${A} has.`),
    ask: T3(`How many ${im} does ${B} have?`, `How many ${im} does ${B} have?`, `How many ${im} does ${B} have?`),
    expr: `${s} + ${n} = ?`,
    answer: ansInt(ans),
    work: [`"${n} more" compares by adding: ${s} + ${n} = ${ans}`],
    visual: null,
    distractors: mkD(ans, num(ans), [[s * n, "multiplied-for-more-than"], [n, "answered-with-the-amount-more"], [s - n > 0 ? s - n : null, "subtracted-instead-of-added"], [ans + 1, "off-by-one"], ...nearInts(ans)], fmtInt),
    hints: { conceptual: `"${n} more than" compares by adding the same amount. It is different from "${n} times as many".`, procedural: "Start with the smaller amount and add the extra amount." },
    structure: STRUCT("Two amounts are compared with 'more than'.", [{ label: "the smaller amount", value: s }, { label: "how many more", value: n }], "the bigger amount", "small amount + how many more = big amount", "tape diagram (a bar plus an extra piece)", "The bigger amount is more than the smaller one."),
    level: lv,
  });
}
function mcEq(rng, lv, ctx) {
  const [s, k] = until(() => {
    const a = rng.int(2, lv === 1 ? 6 : 12);
    const b = rng.int(2, lv === 1 ? 5 : 9);
    return a === 2 && b === 2 ? null : [a, b];
  });
  const big = s * k;
  const [A, B] = twoNames(rng);
  const im = ownThing(rng, ctx).many;
  const ans = `${k} ${TIMES} ${s} = ${big}`;
  const cands = [[`${s} + ${k} = ${big}`, "used-an-additive-comparison"], [`${big} ${TIMES} ${k} = ${s}`, "swapped-the-big-and-small-numbers"], [`${big} + ${s} = ${k}`, "added-the-two-amounts"], [`${k} ${TIMES} ${big} = ${s}`, "multiplied-the-wrong-numbers"], [`${s} ${TIMES} ${s} = ${big}`, "repeated-the-small-number"]];
  return finalize({
    family: "multcompare",
    spec: { type: "eq", s, k },
    stem: T3(`${A} has ${s} ${im}. ${B} has ${big} ${im}, which is ${k} times as many.`, `${A} has ${s} ${im}. ${B} has ${big} ${im}, which is ${k} times as many as ${A} has.`, `${A} has ${s} ${im}, and ${B} has ${big} ${im}. That is ${k} times as many as ${A} has.`),
    ask: T3("Which equation shows this?", "Which equation shows this comparison?", "Which equation represents this multiplicative comparison?"),
    expr: null,
    answer: { value: ans, text: ans, kind: "text" },
    work: [`${B} has ${k} times as many as ${A}, so ${k} groups of ${s} make ${big}: ${k} ${TIMES} ${s} = ${big}`],
    visual: null,
    distractors: mkT(ans, cands),
    hints: { conceptual: "A comparison with 'times as many' is written as a number of times multiplied by the smaller amount.", procedural: "Check each equation by calculating it. The true one uses the times-as-many number and the smaller amount as factors." },
    structure: STRUCT("Two amounts are compared with 'times as many'.", [{ label: "the smaller amount", value: s }, { label: "the bigger amount", value: big }, { label: "times as many", value: k }], "the equation", "times as many x smaller amount = bigger amount", "equation", "Both sides of the equation must have the same value."),
    level: lv,
  });
}
function mcContrast(rng, lv, ctx) {
  return until(() => {
    const s = rng.int(3, 15);
    const n = rng.int(2, 20);
    const k = rng.int(3, 9);
    const diff = s * k - (s + n);
    if (diff < 2) return null;
    const [A, B, C] = rng.sample(NAMES, 3);
    const im = ownThing(rng, ctx).many;
    const cands = [[s * k, "gave-the-times-as-many-amount"], [s + n, "gave-the-more-than-amount"], [s * k + s + n, "added-the-two-amounts"], [k * n, "multiplied-the-wrong-numbers"], [diff + s, "counted-the-smaller-amount-again"]];
    return finalize({
      family: "multcompare",
      spec: { type: "contrast", s, n, k },
      stem: T3(`${A} has ${s} ${im}. ${B} has ${n} more than ${A}. ${C} has ${k} times as many as ${A}.`, `${A} has ${s} ${im}. ${B} has ${n} more ${im} than ${A}. ${C} has ${k} times as many ${im} as ${A}.`, `${A} has ${s} ${im}. ${B} has ${n} more ${im} than ${A}, and ${C} has ${k} times as many ${im} as ${A}.`),
      ask: T3(`How many more ${im} does ${C} have than ${B}?`, `How many more ${im} does ${C} have than ${B}?`, `By how many ${im} does ${C}'s amount exceed ${B}'s amount?`),
      expr: null,
      answer: ansInt(diff),
      work: [`${B}: ${s} + ${n} = ${s + n}`, `${C}: ${k} ${TIMES} ${s} = ${s * k}`, `Compare: ${s * k} ${MINUS} ${s + n} = ${diff}`],
      visual: null,
      distractors: mkD(diff, num(diff), [...cands, ...nearInts(diff)], fmtInt),
      hints: { conceptual: "'More than' adds the same amount, and 'times as many' multiplies. The two comparisons give different amounts for the same starting number.", procedural: "Find each person's amount separately, one using addition and one using multiplication. Then subtract." },
      structure: STRUCT("Three people have different amounts, compared two different ways.", [{ label: `${A}'s amount`, value: s }, { label: `${B} has more than ${A}`, value: n }, { label: `${C} has times as many as ${A}`, value: k }], `how many more ${C} has than ${B}`, "add for 'more than', multiply for 'times as many', then subtract", "two tape diagrams", `${C} has more than ${B} here, so the difference is positive.`),
      level: lv,
    });
  });
}
function genMultcompare(rng, p, o) {
  const lv = o.level;
  const r = rng.next();
  if (lv === 1) return r < 0.3 ? mcTimes(rng, 1, o.ctx, "big") : r < 0.55 ? mcTimes(rng, 1, o.ctx, "small") : r < 0.8 ? mcTimes(rng, 1, o.ctx, "factor") : mcMore(rng, 1, o.ctx);
  if (lv === 2) return r < 0.2 ? mcTimes(rng, 2, o.ctx, "big") : r < 0.4 ? mcTimes(rng, 2, o.ctx, "small") : r < 0.6 ? mcTimes(rng, 2, o.ctx, "factor") : r < 0.75 ? mcEq(rng, 2, o.ctx) : mcMore(rng, 2, o.ctx);
  return r < 0.4 ? mcContrast(rng, 3, o.ctx) : r < 0.55 ? mcTimes(rng, 3, o.ctx, "big") : r < 0.7 ? mcTimes(rng, 3, o.ctx, "small") : r < 0.85 ? mcTimes(rng, 3, o.ctx, "factor") : mcEq(rng, 3, o.ctx);
}

// ---------------------------------------------------------------------------------------------------- factors
const divisors = (n) => {
  const out = [];
  for (let i = 1; i <= n; i++) if (n % i === 0) out.push(i);
  return out;
};
const isPrime = (n) => n > 1 && divisors(n).length === 2;
const listText = (xs) => xs.join(", ");
function faPairs(rng, lv, M) {
  const hi = Math.min(M, lv === 1 ? 36 : 64);
  const n = until(() => {
    const c = rng.int(8, hi);
    const d = divisors(c).length;
    return d >= 4 && d <= 9 ? c : null;
  });
  const F = divisors(n);
  const pairs = Math.ceil(F.length / 2);
  const pairText = F.slice(0, pairs).map((f) => `${f} ${TIMES} ${n / f} = ${n}`).join(", ");
  return finalize({
    family: "factors",
    spec: { type: "pairs", n },
    stem: T3("A factor pair is two numbers that multiply to make a number.", "A factor pair is two whole numbers whose product is a given number.", "A factor pair consists of two whole numbers whose product is a given number."),
    ask: S3(`How many factor pairs does ${n} have?`),
    expr: null,
    answer: ansInt(pairs),
    work: [`Look for pairs of whole numbers that multiply to ${n}: ${pairText}`, `That is ${pairs} factor pairs.`],
    visual: null,
    distractors: mkD(pairs, num(pairs), [[F.length, "counted-every-factor-not-the-pairs"], [pairs - 1, "missed-a-factor-pair"], [pairs + 1, "counted-a-pair-twice"], [Math.floor(F.length / 2) === pairs ? null : Math.floor(F.length / 2), "counted-only-half-the-factors"], ...nearInts(pairs)], fmtInt),
    hints: { conceptual: "Each factor pair is two numbers that multiply to the given number. A pair and its reverse count as one pair.", procedural: "Test 1, 2, 3, and so on in order. Stop when the numbers start to repeat." },
    level: lv,
  });
}
function faAll(rng, lv, M) {
  const hi = Math.min(M, lv === 2 ? 64 : M);
  const lo = lv === 2 ? 12 : 30;
  const n = until(() => {
    const c = rng.int(lo, Math.max(lo + 1, hi));
    const d = divisors(c).length;
    return d >= (lv === 2 ? 4 : 6) && d <= (lv === 2 ? 8 : 12) ? c : null;
  });
  const F = divisors(n);
  const ans = listText(F);
  const mid = F.length > 4 ? F[2] : F[1];
  const nonFactor = (() => {
    for (let x = F[1] + 1; x < n; x++) if (n % x !== 0) return x;
    return n + 1;
  })();
  const primes = F.filter(isPrime);
  const cands = [
    [listText(F.slice(0, -1)), "left-out-the-number-itself"],
    [listText(F.slice(1)), "left-out-1"],
    [listText(F.filter((f) => f !== mid)), "missed-a-factor"],
    [listText([...F, nonFactor].sort((a, b) => a - b)), "included-a-number-that-is-not-a-factor"],
    [primes.length > 1 ? listText(primes) : null, "listed-only-the-prime-factors"],
    [listText(F.slice(1, -1)), "left-out-1-and-the-number-itself"],
  ];
  return finalize({
    family: "factors",
    spec: { type: "allfactors", n },
    stem: "",
    ask: T3(`Write every factor of ${n}, from least to greatest.`, `List all the factors of ${n}, from least to greatest.`, `List every factor of ${n} in order, from least to greatest.`),
    expr: null,
    answer: { value: F.join(","), text: ans, kind: "set" },
    work: [`Test whole numbers in order and keep the ones that divide ${n} with nothing left over.`, `Factor pairs: ${F.slice(0, Math.ceil(F.length / 2)).map((f) => `${f} ${TIMES} ${n / f} = ${n}`).join(", ")}`, `The factors are ${ans}.`],
    visual: null,
    distractors: mkT(ans, cands),
    hints: { conceptual: "A factor divides a number exactly. Factors come in pairs, and 1 and the number itself are always factors.", procedural: "Test 1, 2, 3, and so on in order. When you find a factor, write its partner too." },
    level: lv,
  });
}
function faPick(rng, lv, M, prop) {
  const hi = Math.min(M, lv === 1 ? 36 : lv === 2 ? 64 : M);
  let n;
  let options;
  let answer;
  let tags;
  let stemText;
  let askText;
  if (prop === "factor" || prop === "multiple") {
    if (prop === "factor") {
      n = until(() => {
        const c = rng.int(12, hi);
        return divisors(c).length >= 4 ? c : null;
      });
      const F = divisors(n).filter((f) => f > 1 && f < n);
      answer = rng.pick(F);
      const bad = rng.sample(
        Array.from({ length: n - 2 }, (_, i) => i + 2).filter((x) => n % x !== 0),
        3,
      );
      options = [answer, ...bad];
      tags = new Map(bad.map((x) => [x, "did-not-check-by-dividing"]));
      if (n * 2 <= M && rng.chance(0.5)) {
        options[1] = n * 2;
        tags.set(n * 2, "confused-factor-with-multiple");
      }
      stemText = `Look at these numbers: ${listText(rng.shuffle(options))}.`;
      askText = `Which number is a factor of ${n}?`;
    } else {
      n = rng.int(3, lv === 1 ? 9 : 12);
      const mults = Array.from({ length: Math.floor(hi / n) }, (_, i) => (i + 2) * n).filter((x) => x <= hi);
      answer = rng.pick(mults);
      const bad = [];
      const pool = [answer + 1, answer - 1, answer + 2, answer - 2, answer + n + 1, answer - n + 1].filter((x) => x > 1 && x <= M && x % n !== 0);
      for (const x of rng.shuffle(pool)) if (bad.length < 3 && !bad.includes(x)) bad.push(x);
      options = [answer, ...bad];
      tags = new Map(bad.map((x) => [x, Math.abs(x - answer) <= 2 ? "off-by-one-from-a-multiple" : "did-not-check-by-skip-counting"]));
      stemText = `Look at these numbers: ${listText(rng.shuffle(options))}.`;
      askText = `Which number is a multiple of ${n}?`;
    }
    if (new Set(options).size < 4) return null;
    return finalize({
      family: "factors",
      spec: { type: "pick", prop, n, options },
      stem: S3(stemText),
      ask: S3(askText),
      expr: null,
      answer: ansInt(answer),
      work: prop === "factor" ? [`A factor divides ${n} with nothing left over: ${n} ${DIVIDE} ${answer} = ${n / answer}`, `None of the other numbers divides ${n} evenly.`] : [`Skip count by ${n}: ${[1, 2, 3, 4, 5, 6].map((i) => i * n).filter((x) => x <= answer).join(", ")}`, `${answer} is on the list, so it is a multiple of ${n}.`],
      visual: null,
      distractors: options.slice(1).map((x) => ({ text: num(x), misconception: tags.get(x) || "did-not-check" })),
      hints: prop === "factor" ? { conceptual: "A factor of a number divides it with nothing left over.", procedural: "Divide the number by each choice. The right choice gives a whole number." } : { conceptual: "A multiple of a number is what you get when you multiply it by a whole number, so you reach it when you skip count.", procedural: "Skip count by the number. Check which choice you land on." },
      level: lv,
    });
  }
  // prime / composite
  const pool = Array.from({ length: hi - 1 }, (_, i) => i + 2);
  const primes = pool.filter(isPrime);
  const composites = pool.filter((x) => !isPrime(x));
  const oddComp = composites.filter((x) => x % 2 === 1 && x > 8);
  if (prop === "prime") {
    answer = rng.pick(primes.filter((x) => x > 7));
    const bad = rng.sample(lv === 1 ? composites.filter((x) => x > 7) : oddComp, 3);
    options = [answer, ...bad];
    const spf = (x) => divisors(x).find((f) => f > 1);
    tags = new Map(bad.map((x) => [x, `did-not-test-${spf(x)}-as-a-factor`]));
    stemText = `Look at these numbers: ${listText(rng.shuffle(options))}.`;
    askText = "Which number is prime?";
  } else {
    answer = rng.pick(lv === 3 ? oddComp : composites.filter((x) => x > 7));
    const bad = rng.sample(primes.filter((x) => x > 7), 3);
    options = [answer, ...bad];
    tags = new Map(bad.map((x) => [x, "confused-prime-with-composite"]));
    stemText = `Look at these numbers: ${listText(rng.shuffle(options))}.`;
    askText = "Which number is composite?";
  }
  if (new Set(options).size < 4) return null;
  const f = divisors(answer);
  return finalize({
    family: "factors",
    spec: { type: "pick", prop, n: 0, options },
    stem: S3(stemText),
    ask: S3(askText),
    expr: null,
    answer: ansInt(answer),
    work: prop === "prime" ? [`A prime number has exactly two factors, 1 and itself. Test the other numbers: each has a factor besides 1 and itself.`, `${answer} has only the factors 1 and ${answer}.`] : [`A composite number has a factor besides 1 and itself. ${answer} has the factors ${listText(f)}.`, `The other numbers have only two factors each.`],
    visual: null,
    distractors: options.slice(1).map((x) => ({ text: num(x), misconception: tags.get(x) })),
    hints: { conceptual: "A prime number has exactly two factors: 1 and itself. A composite number has more than two factors.", procedural: "Try dividing each number by 2, 3, 5 and 7. A number that divides evenly by one of them, other than itself, is composite." },
    level: lv,
  });
}
function faNext(rng, lv, M) {
  return until(() => {
    const k = rng.int(3, 12);
    const m = rng.int(k + 1, M - k);
    const ans = (Math.floor(m / k) + 1) * k;
    if (ans > M || m % k === 0) return null;
    const below = Math.floor(m / k) * k;
    return finalize({
      family: "factors",
      spec: { type: "nextmult", k, above: m },
      stem: "",
      ask: T3(`What is the smallest multiple of ${k} that is greater than ${m}?`, `What is the smallest multiple of ${k} that is greater than ${m}?`, `Find the least multiple of ${k} that is greater than ${m}.`),
      expr: null,
      answer: ansInt(ans),
      work: [`Skip count by ${k} until you pass ${m}. The multiple just below is ${below}.`, `${below} + ${k} = ${ans}`],
      visual: null,
      distractors: mkD(ans, num(ans), [[below, "chose-the-multiple-below"], [m + k, "added-the-multiple-to-the-number"], [m + 1, "chose-the-next-number"], [ans + k, "skipped-a-multiple"], ...nearInts(ans)], fmtInt),
      hints: { conceptual: "Multiples of a number are found by skip counting. Multiples keep going without end.", procedural: "Skip count by the number and stop at the first multiple that is larger than the given number." },
      level: lv,
    });
  });
}
function faCount(rng, lv, M) {
  return until(() => {
    const k = rng.int(3, 9);
    const upto = rng.int(30, Math.min(M, 99));
    const ans = Math.floor(upto / k);
    if (ans < 4 || upto % k === 0) return null;
    return finalize({
      family: "factors",
      spec: { type: "countmult", k, upto },
      stem: "",
      ask: T3(`How many multiples of ${k} are there from 1 to ${upto}?`, `How many multiples of ${k} are there from 1 to ${upto}?`, `How many of the whole numbers from 1 to ${upto} are multiples of ${k}?`),
      expr: null,
      answer: ansInt(ans),
      work: [`The multiples of ${k} are ${k}, ${2 * k}, ${3 * k}, and so on.`, `The last one that is not more than ${upto} is ${ans * k}, and ${ans} ${TIMES} ${k} = ${ans * k}`, `There are ${ans} multiples.`],
      visual: null,
      distractors: mkD(ans, num(ans), [[ans + 1, "counted-the-next-multiple"], [ans - 1, "missed-a-multiple"], [k, "answered-with-the-number"], [upto - k, "subtracted-instead-of-counted"], ...nearInts(ans)], fmtInt),
      hints: { conceptual: "Each multiple of a number is one more group of that number than the one before it.", procedural: "Skip count by the number and count how many multiples you reach before you go past the end." },
      level: lv,
    });
  });
}
function genFactors(rng, p, o) {
  const M = Math.max(36, p.max | 0 || 100);
  const lv = o.level;
  const r = rng.next();
  return until(() => {
    if (lv === 1) return r < 0.3 ? faPairs(rng, 1, M) : r < 0.65 ? faPick(rng, 1, M, "factor") : faPick(rng, 1, M, "multiple");
    if (lv === 2) return r < 0.35 ? faAll(rng, 2, M) : r < 0.6 ? faPick(rng, 2, M, "prime") : r < 0.8 ? faPick(rng, 2, M, "composite") : faPairs(rng, 2, M);
    return r < 0.25 ? faAll(rng, 3, M) : r < 0.5 ? faNext(rng, 3, M) : r < 0.65 ? faCount(rng, 3, M) : r < 0.82 ? faPick(rng, 3, M, "composite") : faPick(rng, 3, M, "prime");
  });
}
function checkFactors(p, params) {
  const M = Math.max(36, (params && params.max) | 0 || 100);
  const s = p.spec;
  const nums = [s.n, s.k, s.upto, s.above, ...(s.options || [])].filter((v) => typeof v === "number");
  if (nums.some((v) => v > M)) return `a number exceeds max ${M}`;
  if (s.type === "nextmult" && Number(p.answer.value) > M) return `answer exceeds max ${M}`;
  return null;
}

// ---------------------------------------------------------------------------------------------------- fracequiv
const D4 = [2, 3, 4, 5, 6, 8, 10, 12, 100];
const eqPairs = (hundred) => {
  const out = [];
  for (const d of [2, 3, 4, 5, 6, 8, 10]) for (let k = 2; k <= 10; k++) if (D4.includes(d * k) && (hundred ? d * k === 100 : d * k <= 12)) out.push([d, k]);
  return out;
};
function feMissing(rng, lv) {
  const [d, k] = rng.pick(eqPairs(lv === 3 && rng.chance(0.5)));
  const D = d * k;
  const n = rng.pick(coprimeNums(d));
  const x = n * k;
  const find = lv === 1 ? "num" : rng.pick(["num", "den"]);
  const expr = find === "num" ? `${n}/${d} = ?/${D}` : `${n}/${d} = ${x}/?`;
  const ans = find === "num" ? x : D;
  const cands = find === "num" ? [[n + (D - d), "added-the-same-amount-to-the-numerator"], [k, "gave-the-multiplier"], [D, "copied-the-denominator"], [n + k, "added-the-multiplier"], [x + 1, "off-by-one"]] : [[d + (x - n), "added-the-same-amount-to-the-denominator"], [k, "gave-the-multiplier"], [x, "copied-the-numerator"], [d + k, "added-the-multiplier"], [D + 1, "off-by-one"]];
  return finalize({
    family: "fracequiv",
    spec: { type: "eqm", n, d, x: find === "num" ? null : x, y: find === "num" ? D : null },
    stem: S3(expr),
    ask: T3("Find the missing number.", "What number makes the fractions equal?", "Which number makes the two fractions equivalent?"),
    expr,
    answer: ansInt(ans),
    work: find === "num" ? [`The denominator changes from ${d} to ${D}: ${d} ${TIMES} ${k} = ${D}`, `Multiply the numerator by ${k} too: ${n} ${TIMES} ${k} = ${x}`] : [`The numerator changes from ${n} to ${x}: ${n} ${TIMES} ${k} = ${x}`, `Multiply the denominator by ${k} too: ${d} ${TIMES} ${k} = ${D}`],
    visual: lv === 1 && rng.chance(0.7) ? { kind: "fracstrip", alt: `Two strips of the same length. One is split into ${d} equal parts with ${n} shaded. The other is split into ${D} equal parts with ${x} shaded.`, parts: d, shaded: n, compare: { parts: D, shaded: x } } : null,
    distractors: mkD(ans, num(ans), [...cands, ...nearInts(ans)], fmtInt),
    hints: { conceptual: "Equivalent fractions name the same amount. Multiplying the top and the bottom by the same number cuts each part into smaller equal parts without changing the amount.", procedural: "Find what the known denominators or numerators were multiplied by, then do the same to the other number." },
    level: lv,
  });
}
function feWrite(rng, lv) {
  const down = lv === 3 && rng.chance(0.4);
  let n;
  let d;
  let D;
  let x;
  if (down) {
    const [bd, k] = rng.pick(eqPairs(false).filter(([a]) => a >= 3 && a <= 6));
    const bn = rng.pick(coprimeNums(bd));
    n = bn * k;
    d = bd * k;
    D = bd;
    x = bn;
  } else {
    const [bd, k] = rng.pick(eqPairs(lv === 3 && rng.chance(0.5)));
    n = rng.pick(coprimeNums(bd));
    d = bd;
    D = bd * k;
    x = n * (D / d);
  }
  const ans = `${x}/${D}`;
  const reduced = gcd(x, D) === 1;
  const cands = down ? [[`${n - (d - D)}/${D}`, "subtracted-the-same-amount"], [`${n}/${D}`, "changed-only-the-denominator"], [`${d - D}/${D}`, "used-the-difference-as-the-numerator"], [`${x}/${d}`, "changed-only-the-numerator"], [`${x + 1}/${D}`, "off-by-one"], [`${x}/${D + 1}`, "changed-the-denominator-by-one"]] : [[`${n + (D - d)}/${D}`, "added-the-same-amount"], [`${n}/${D}`, "changed-only-the-denominator"], [`${D / d}/${D}`, "used-the-multiplier-as-the-numerator"], [`${x}/${d}`, "changed-only-the-numerator"], [`${x + 1}/${D}`, "off-by-one"]];
  const ansObj = reduced ? { value: ans, text: ans, kind: "frac" } : { value: ans, text: ans, kind: "text" };
  return finalize({
    family: "fracequiv",
    spec: { type: "eqw", n, d, D },
    stem: "",
    ask: T3(`Write a fraction equal to ${n}/${d}. Use ${D} on the bottom.`, `Write a fraction that is equal to ${n}/${d} with a denominator of ${D}.`, `Write an equivalent fraction for ${n}/${d} that has a denominator of ${D}.`),
    expr: null,
    answer: ansObj,
    work: down ? [`The denominator changes from ${d} to ${D}: ${d} ${DIVIDE} ${D} = ${d / D}, so divide the top and bottom by ${d / D}`, `${n} ${DIVIDE} ${d / D} = ${x}`, `The fraction is ${ans}.`] : [`The denominator changes from ${d} to ${D}: ${d} ${TIMES} ${D / d} = ${D}`, `Multiply the numerator by ${D / d} too: ${n} ${TIMES} ${D / d} = ${x}`, `The fraction is ${ans}.`],
    visual: null,
    distractors: reduced ? mkD(new Fr(x, D), ans, cands.map(([t, g]) => [(([a, b]) => new Fr(Number(a), Number(b)))(t.split("/")), g, t]), fmtFr) : mkT(ans, cands),
    hints: { conceptual: "An equivalent fraction names the same amount with different-size parts. Multiply or divide the top and the bottom by the same number.", procedural: "Find the number that changes the old denominator into the new one. Use that same number on the numerator." },
    level: lv,
  });
}
function fePick(rng, lv) {
  return until(() => {
    const [bd, k0] = rng.pick(eqPairs(false));
    const n = rng.pick(coprimeNums(bd));
    const k = k0;
    const D = bd * k;
    const x = n * k;
    const target = new Fr(n, bd);
    const wrong = [
      [[n + k, D + k], "added-the-same-number-to-top-and-bottom"],
      [[x, bd], "multiplied-only-the-numerator"],
      [[n, D], "multiplied-only-the-denominator"],
      [[bd, n], "flipped-the-numerator-and-denominator"],
      [[n + 1, D - 1], "changed-the-top-and-bottom-by-different-amounts"],
      [[x + 1, D], "was-off-by-one-in-the-numerator"],
      [[x, D + 1], "was-off-by-one-in-the-denominator"],
      [[x - 1, D], "was-off-by-one-in-the-numerator"],
    ].filter(([f]) => f[1] > 0 && f[0] > 0 && f[0] < f[1] && (f[1] <= 12 || f[1] === 100) && new Fr(f[0], f[1]).cmp(target) !== 0);
    if (wrong.length < 3) return null;
    const bad = rng.sample(wrong, 3);
    const options = rng.shuffle([[x, D], ...bad.map((b) => b[0])]);
    if (new Set(options.map((f) => `${f[0]}/${f[1]}`)).size < 4) return null;
    const list = `${options.slice(0, 3).map((f) => `${f[0]}/${f[1]}`).join(", ")} and ${options[3][0]}/${options[3][1]}`;
    const ans = `${x}/${D}`;
    return finalize({
      family: "fracequiv",
      spec: { type: "equivpick", n, d: bd, opts: options },
      stem: T3(`Look at these fractions: ${list}.`, `Here are four fractions: ${list}.`, `Consider the fractions ${list}.`),
      ask: T3(`Which fraction is equal to ${n}/${bd}?`, `Which fraction is equal to ${n}/${bd}?`, `Which of these fractions is equivalent to ${n}/${bd}?`),
      expr: null,
      answer: { value: ans, text: ans, kind: "text" },
      work: [`${bd} ${TIMES} ${k} = ${D} and ${n} ${TIMES} ${k} = ${x}, so ${n}/${bd} is the same as ${ans}.`, "The other fractions change the top and the bottom in different ways, so they name different amounts."],
      visual: null,
      distractors: bad.map((b) => ({ text: `${b[0][0]}/${b[0][1]}`, misconception: b[1] })),
      hints: { conceptual: "Equivalent fractions come from multiplying the top and the bottom by the same number.", procedural: "For each choice, ask what the numerator and the denominator were multiplied by. The two numbers must match." },
      level: lv,
    });
  });
}
function feCmpList(rng, lv) {
  const pick = lv === 3 ? rng.pick(["max", "min"]) : "max";
  const dsets = lv === 1 ? [[2, 4, 8], [3, 6, 12], [2, 4, 6, 12], [5, 10, 2]] : lv === 2 ? [[2, 3, 4, 6], [3, 4, 6, 12], [2, 5, 10, 4], [4, 8, 2, 3]] : [[3, 4, 5, 6, 8], [4, 6, 8, 12, 3], [5, 6, 10, 12, 4]];
  return until(() => {
    const set = rng.pick(dsets);
    const fr4 = [];
    for (let tries = 0; tries < 40 && fr4.length < 4; tries++) {
      const d = rng.pick(set);
      const n = rng.int(1, d - 1);
      const f = new Fr(n, d);
      if (fr4.some((g) => new Fr(g[0], g[1]).cmp(f) === 0)) continue;
      fr4.push([n, d]);
    }
    if (fr4.length < 4) return null;
    const sorted = fr4.slice().sort((a, b) => a[0] / a[1] - b[0] / b[1]);
    const best = pick === "max" ? sorted[3] : sorted[0];
    if (gcd(best[0], best[1]) !== 1) return null;
    const extD = (pick === "max" ? Math.max : Math.min)(...fr4.map((f) => f[1]));
    const extN = (pick === "max" ? Math.max : Math.min)(...fr4.map((f) => f[0]));
    const shown = rng.shuffle(fr4);
    const list = `${shown.slice(0, 3).map(([n, d]) => `${n}/${d}`).join(", ")} and ${shown[3][0]}/${shown[3][1]}`;
    const word = pick === "max" ? "greatest" : "least";
    const tagOf = (f) => (f[1] === extD && f[0] !== extN ? "bigger-denominator-means-bigger-fraction" : f[0] === extN ? "compared-numerators-only" : "compared-different-size-parts");
    const cands = shown.filter((f) => f !== best).map((f) => [new Fr(f[0], f[1]), tagOf(f), `${f[0]}/${f[1]}`]);
    const L = fr4.reduce((t, f) => (t * f[1]) / gcd(t, f[1]), 1);
    return finalize({
      family: "fracequiv",
      spec: { type: "cmp", fracs: fr4, pick },
      stem: T3(`Look at these fractions: ${list}.`, `Here are four fractions: ${list}.`, `Consider the fractions ${list}.`),
      ask: T3(`Which fraction is the ${word}?`, `Which fraction is the ${word}?`, `Which of these fractions has the ${word} value?`),
      expr: null,
      answer: fracAns(best[0], best[1]),
      work: [`Rename every fraction with the same denominator, ${L}, so the parts are the same size.`, shown.map(([n, d]) => `${n}/${d} = ${(n * L) / d}/${L}`).join(", "), `The ${word} is ${best[0]}/${best[1]}.`],
      visual: null,
      distractors: mkD(new Fr(best[0], best[1]), `${best[0]}/${best[1]}`, cands, fmtFr),
      hints: { conceptual: "You can only compare fractions fairly when the parts are the same size, or when you compare each one with a benchmark such as one half or one whole.", procedural: "Rename the fractions with a common denominator, or sort them by comparing each one with one half." },
      level: lv,
    });
  });
}
function feBench(rng, lv) {
  const dens = lv === 1 ? [4, 6, 8, 10] : [3, 5, 6, 8, 10, 12];
  const d = rng.pick(dens);
  const n = rng.int(1, d - 1);
  const cmp = new Fr(n, d).cmp(new Fr(1, 2));
  const texts = { 1: "greater than 1/2", [-1]: "less than 1/2", 0: "equal to 1/2" };
  const ans = texts[cmp];
  const cands = [[texts[1], cmp === -1 ? "compared-numerators-only" : "did-not-compare-the-sizes"], [texts[-1], cmp === 1 ? "compared-denominators-only" : "did-not-compare-the-sizes"], [texts[0], "did-not-compare-the-sizes"], ["cannot be compared because the denominators are different", "thinks-unlike-denominators-cannot-be-compared"]];
  const half = d % 2 === 0 ? d / 2 : null;
  return finalize({
    family: "fracequiv",
    spec: { type: "bench", n, d },
    stem: T3(`Look at the fraction ${n}/${d}.`, `Look at the fraction ${n}/${d}.`, `Consider the fraction ${n}/${d}.`),
    ask: T3("Compare it with 1/2. Which is true?", "Compare it with 1/2. Which statement is true?", "Compare it with the benchmark 1/2. Which statement is true?"),
    expr: null,
    answer: { value: ans, text: ans, kind: "text" },
    work: [half !== null ? `Half of ${d} is ${half}. Compare the numerator ${n} with ${half}.` : `Compare ${n} out of ${d} equal parts with half of the parts.`, `So ${n}/${d} is ${ans}.`],
    visual: lv === 1 ? { kind: "fracstrip", alt: `Two strips of the same length. One has ${d} equal parts with ${n} shaded. The other has 2 equal parts with 1 shaded.`, parts: d, shaded: n, compare: { parts: 2, shaded: 1 } } : null,
    distractors: mkT(ans, cands),
    hints: { conceptual: "One half is a benchmark. A fraction names exactly one half when its numerator is half of its denominator.", procedural: "Find half of the denominator. Then compare it with the numerator." },
    level: lv,
  });
}
function genFracequiv(rng, p, o) {
  const lv = o.level;
  const r = rng.next();
  if (lv === 1) return r < 0.4 ? feMissing(rng, 1) : r < 0.7 ? feBench(rng, 1) : feCmpList(rng, 1);
  if (lv === 2) return r < 0.25 ? feMissing(rng, 2) : r < 0.45 ? feWrite(rng, 2) : r < 0.65 ? fePick(rng, 2) : r < 0.85 ? feCmpList(rng, 2) : feBench(rng, 2);
  return r < 0.25 ? feMissing(rng, 3) : r < 0.5 ? feWrite(rng, 3) : r < 0.7 ? fePick(rng, 3) : feCmpList(rng, 3);
}

// ---------------------------------------------------------------------------------------------------- fracops
const lcm2 = (a, b) => (a * b) / gcd(a, b);
const mixedOf = (f) => {
  if (f.d === 1) return num(f.n);
  if (f.n > f.d) return `${Math.floor(f.n / f.d)} ${f.n % f.d}/${f.d}`;
  return `${f.n}/${f.d}`;
};
const fracAnswer = (f) => (f.d === 1 ? ansInt(f.n) : { value: `${f.n}/${f.d}`, text: mixedOf(f), kind: "frac" });
/** A [n, d] operand as text; mixed numbers print as "2 1/4" when `mix` is set and n/d > 1. */
const pText = (p, mix) => {
  const [n, d] = p;
  if (d === 1) return num(n);
  if (mix && n > d) return mixedOf(new Fr(n, d));
  return `${n}/${d}`;
};
const QTYF = {
  store: { one: "yard", many: "yards", what: "ribbon" },
  garden: { one: "pound", many: "pounds", what: "soil" },
  sports: { one: "meter", many: "meters", what: "rope" },
  kitchen: { one: "cup", many: "cups", what: "flour" },
  pets: { one: "pound", many: "pounds", what: "dog food" },
  library: { one: "yard", many: "yards", what: "book tape" },
  crafts: { one: "yard", many: "yards", what: "yarn" },
  travel: { one: "gallon", many: "gallons", what: "fuel" },
  science: { one: "liter", many: "liters", what: "water" },
  community: { one: "gallon", many: "gallons", what: "paint" },
};
const amt = (p, Q, mix) => `${pText(p, mix)} ${p[0] <= p[1] ? Q.one : Q.many} of ${Q.what}`;
const INSTR = { plain: "Write the answer in simplest form.", standard: "Write your answer in simplest form. Use a mixed number if it is greater than one.", rich: "Write the answer in simplest form, using a mixed number if it is greater than one." };
const withInstr = (ask) => ({ plain: `${ask.plain} ${INSTR.plain}`, standard: `${ask.standard} ${INSTR.standard}`, rich: `${ask.rich} ${INSTR.rich}` });
const VERB = { add: T3("Add.", "Find the sum.", "Calculate the sum."), sub: T3("Subtract.", "Find the difference.", "Calculate the difference."), mul: T3("Multiply.", "Find the product.", "Calculate the product."), div: T3("Divide.", "Find the quotient.", "Calculate the quotient.") };
const FOHINT = {
  likeAdd: { conceptual: "When the denominators are the same, the parts are the same size. You add the number of parts and keep the denominator.", procedural: "Add the numerators and keep the denominator. Then simplify." },
  likeSub: { conceptual: "When the denominators are the same, the parts are the same size. You take away parts and keep the denominator.", procedural: "Subtract the numerators and keep the denominator. Then simplify." },
  unlike: { conceptual: "You can only add or subtract fractions when the parts are the same size, so rename both fractions with a common denominator first.", procedural: "Find a common denominator, rename both fractions, then add or subtract the numerators and simplify." },
  mixed: { conceptual: "A mixed number is a whole number plus a fraction. You can work with the parts separately or rename each as an improper fraction.", procedural: "Rename each mixed number as an improper fraction, or add the wholes and the fractions separately. Regroup if the fractions make more than one whole." },
  mulWhole: { conceptual: "Multiplying a fraction by a whole number repeats the fraction that many times.", procedural: "Multiply the numerator by the whole number and keep the denominator. Then simplify." },
  mulFrac: { conceptual: "A fraction of a fraction is a part of a part, so the product is made of smaller parts.", procedural: "Multiply the numerators, multiply the denominators, then simplify." },
  unitWhole: { conceptual: "Sharing a part equally among more pieces makes each piece smaller.", procedural: "Multiply the denominator by the whole number to find the size of each piece." },
  wholeUnit: { conceptual: "Ask how many small pieces fit into the whole. Each whole holds as many pieces as the denominator says.", procedural: "Multiply the whole number by the denominator." },
  divFrac: { conceptual: "Dividing asks how many times the second fraction fits into the first one.", procedural: "Rename both with a common denominator and divide the numerators, or multiply by the reciprocal of the second fraction." },
};
function foWork(op, x, y, mix, ans) {
  const lines = [];
  const xt = pText(x, mix);
  const yt = pText(y, mix);
  if (mix && x[0] > x[1] && x[1] !== 1) lines.push(`Write ${xt} as an improper fraction: ${x[0]}/${x[1]}.`);
  if (mix && y[0] > y[1] && y[1] !== 1) lines.push(`Write ${yt} as an improper fraction: ${y[0]}/${y[1]}.`);
  let nn;
  let dd;
  if (op === "add" || op === "sub") {
    if (x[1] === y[1]) {
      const r = op === "add" ? x[0] + y[0] : x[0] - y[0];
      lines.push(op === "add" ? `The denominators are the same. Add the numerators: ${x[0]} + ${y[0]} = ${r}` : `The denominators are the same. Subtract the numerators: ${x[0]} ${MINUS} ${y[0]} = ${r}`);
      nn = r;
      dd = x[1];
    } else {
      const L = lcm2(x[1], y[1]);
      const xa = (x[0] * L) / x[1];
      const ya = (y[0] * L) / y[1];
      lines.push(`A common denominator is ${L}.`);
      lines.push(`${x[0]}/${x[1]} is the same as ${xa}/${L}, and ${y[0]}/${y[1]} is the same as ${ya}/${L}.`);
      const r = op === "add" ? xa + ya : xa - ya;
      lines.push(op === "add" ? `Add the numerators: ${xa} + ${ya} = ${r}` : `Subtract the numerators: ${xa} ${MINUS} ${ya} = ${r}`);
      nn = r;
      dd = L;
    }
  } else if (op === "mul") {
    nn = x[0] * y[0];
    dd = x[1] * y[1];
    lines.push(`Multiply the numerators: ${x[0]} ${TIMES} ${y[0]} = ${nn}`);
    lines.push(`Multiply the denominators: ${x[1]} ${TIMES} ${y[1]} = ${dd}`);
  } else if (x[1] === y[1] && x[0] % y[0] === 0) {
    nn = x[0] / y[0];
    dd = 1;
    lines.push(`Both fractions are made of parts of size 1/${x[1]}, so ask how many groups of ${y[0]} parts fit in ${x[0]} parts: ${x[0]} ${DIVIDE} ${y[0]} = ${nn}`);
  } else {
    nn = x[0] * y[1];
    dd = x[1] * y[0];
    lines.push(`Dividing by ${y[0]}/${y[1]} is the same as multiplying by its reciprocal, ${y[1]}/${y[0]}.`);
    lines.push(`Multiply the numerators: ${x[0]} ${TIMES} ${y[1]} = ${nn}`);
    lines.push(`Multiply the denominators: ${x[1]} ${TIMES} ${y[0]} = ${dd}`);
  }
  if (dd !== 1) lines.push(`The result is ${nn}/${dd}.`);
  if (gcd(nn, dd) !== 1 || ans.d === 1) lines.push(`In simplest form that is ${ans.d === 1 ? num(ans.n) : `${ans.n}/${ans.d}`}.`);
  if (ans.d !== 1 && ans.n > ans.d) lines.push(`As a mixed number: ${mixedOf(ans)}.`);
  return lines;
}
function foCands(op, x, y) {
  const X = new Fr(x[0], x[1]);
  const Y = new Fr(y[0], y[1]);
  const F = (n, d, tag, text) => (d > 0 && n >= 0 ? [new Fr(n, d), tag, text] : null);
  if (op === "add") {
    return [F(x[0] + y[0], x[1] + y[1], "added-the-denominators", `${x[0] + y[0]}/${x[1] + y[1]}`), F(x[0] + y[0], x[1] * y[1], "added-numerators-and-multiplied-denominators"), x[1] !== y[1] ? F(x[0] + y[0], lcm2(x[1], y[1]), "added-numerators-without-renaming") : F(x[0] * y[0], x[1], "multiplied-the-numerators"), [X.mul(Y), "multiplied-instead-of-added"], [X.sub(Y).n >= 0 ? X.sub(Y) : Y.sub(X), "subtracted-instead-of-added"], [X.add(Y).add(new Fr(1, X.d * Y.d)), "off-by-one-part"]];
  }
  if (op === "sub") {
    return [[X.add(Y), "added-instead-of-subtracted"], x[1] !== y[1] ? F(x[0] - y[0], lcm2(x[1], y[1]), "subtracted-numerators-without-renaming") : F(x[0] - y[0] - 1, x[1], "counted-one-part-too-many"), x[1] !== y[1] && x[1] > y[1] ? F(x[0] - y[0], x[1] - y[1], "subtracted-the-denominators") : F(x[0] - y[0] + 1, x[1], "counted-one-part-too-few"), F(x[0] - y[0], x[1] * y[1], "subtracted-numerators-and-multiplied-denominators"), [X.mul(Y), "multiplied-instead-of-subtracted"]];
  }
  if (op === "mul") {
    const whole = y[1] === 1;
    return [whole ? F(x[0] * y[0], x[1] * y[0], "multiplied-the-denominator-too") : [X.add(Y), "added-instead-of-multiplied"], whole ? F(x[0], x[1] * y[0], "divided-instead-of-multiplied") : [X.div(Y), "divided-instead-of-multiplied"], whole ? [X.add(Y), "added-the-whole-number"] : F(x[0] * y[0], x[1] + y[1], "added-the-denominators"), whole ? F(x[0] + y[0], x[1], "added-the-whole-number-to-the-numerator") : F(x[0] + y[0], x[1] * y[1], "added-the-numerators"), [X.mul(Y).add(new Fr(1, X.d * Y.d)), "off-by-one-part"]];
  }
  return [[X.mul(Y), "multiplied-without-flipping"], [Y.div(X), "divided-in-the-wrong-order"], [Y.d * X.d > 0 ? new Fr(X.d * Y.n, X.n * Y.d) : null, "flipped-the-first-fraction"], [new Fr(X.n * Y.n, X.d * Y.d + 1), "changed-the-denominator"], X.sub(Y).n >= 0 ? [X.sub(Y), "subtracted-instead-of-divided"] : [X.add(Y), "added-instead-of-divided"], [X.div(Y).add(new Fr(1, 2)), "off-by-half"]];
}
function foVisual(op, x, y, lv, mode) {
  if (lv !== 1) return null;
  if ((op === "add" || op === "sub") && x[1] === y[1]) {
    const d = x[1];
    const end = op === "add" ? x[0] + y[0] : x[0] - y[0];
    const top = Math.max(1, Math.ceil(Math.max(x[0], end) / d));
    return { kind: "numberline", alt: `A number line from 0 to ${top} split into ${d} equal parts, with a jump of ${x[0]}/${d} from 0 and then a jump ${op === "add" ? "forward" : "back"} of ${y[0]}/${d}.`, min: 0, max: top, ticks: d * top, marks: [], hops: [{ from: 0, to: `${x[0]}/${d}`, label: `${x[0]}/${d}` }, { from: `${x[0]}/${d}`, to: `${end}/${d}`, label: `${op === "add" ? "+" : MINUS}${y[0]}/${d}` }], show: "frac" };
  }
  if (op === "mul" && y[1] === 1 && y[0] <= 6) {
    return { kind: "tape", alt: `A tape made of ${y[0]} equal parts, each ${x[0]}/${x[1]}.`, rows: [{ label: `${y[0]} groups`, parts: [{ label: `${x[0]}/${x[1]}`, value: `${x[0]}/${x[1]}`, n: y[0] }] }] };
  }
  if (op === "div" && x[1] === y[1] && mode === "divide") {
    return { kind: "tape", alt: `Two tapes made of ${x[1]}ths. The first has ${x[0]} parts and the second has ${y[0]} parts.`, rows: [{ label: `${x[0]}/${x[1]}`, parts: [{ label: `1/${x[1]}`, value: `1/${x[1]}`, n: x[0] }] }, { label: `${y[0]}/${y[1]}`, parts: [{ label: `1/${y[1]}`, value: `1/${y[1]}`, n: y[0] }] }] };
  }
  return null;
}
function foStory(rng, o, ans) {
  const { op, x, y, mix, ctx } = o;
  const Q = QTYF[ctx] || QTYF.kitchen;
  const [N] = rng.sample(NAMES, 1);
  const ax = amt(x, Q, mix);
  const ay = amt(y, Q, mix);
  const w = y[0];
  let stem;
  let ask;
  let known;
  let unknown;
  let rel;
  let model;
  let reasonable;
  let happening;
  if (o.scale) {
    stem = T3(`${N} plans a project that uses ${ax}. A small version uses ${pText(y, mix)} as much.`, `${N} plans a project that uses ${ax}. A small version of the project uses ${pText(y, mix)} as much ${Q.what}.`, `${N} plans a project that calls for ${ax}, and a scaled version uses ${pText(y, mix)} as much ${Q.what}.`);
    ask = T3(`How much ${Q.what} does the small version use?`, `How much ${Q.what} does the small version use?`, `How much ${Q.what} does the scaled version use?`);
    happening = `${N} scales a project.`;
    known = [{ label: "amount in the project", value: pText(x, mix) }, { label: "scale factor", value: pText(y, mix) }];
    unknown = `amount in the small version`;
    rel = "amount x scale factor = new amount";
    model = "tape diagram or area model";
    reasonable = y[0] < y[1] ? "The small version uses less than the original project." : "The new version uses more than the original project.";
  } else if (op === "add") {
    stem = T3(`${N} uses ${ax} for the first part. ${N} uses ${ay} for the second part.`, `${N} uses ${ax} for the first part of a project and ${ay} for the second part.`, `${N} uses ${ax} in the first part of a project and ${ay} in the second part.`);
    ask = T3(`How much ${Q.what} does ${N} use in all?`, `How much ${Q.what} does ${N} use in all?`, `What is the total amount of ${Q.what} that ${N} uses?`);
    happening = `${N} uses ${Q.what} in two parts of a project.`;
    known = [{ label: "first part", value: pText(x, mix) }, { label: "second part", value: pText(y, mix) }];
    unknown = "the total amount";
    rel = "part + part = whole";
    model = "part-part-whole tape or number line";
    reasonable = "The total is more than either part.";
  } else if (op === "sub") {
    stem = T3(`${N} has ${ax}. ${N} uses ${ay}.`, `${N} has ${ax} and uses ${ay} for a project.`, `${N} begins with ${ax} and uses ${ay} for a project.`);
    ask = T3(`How much ${Q.what} is left?`, `How much ${Q.what} is left?`, `How much ${Q.what} remains?`);
    happening = `${N} uses part of an amount.`;
    known = [{ label: "amount at the start", value: pText(x, mix) }, { label: "amount used", value: pText(y, mix) }];
    unknown = "the amount left";
    rel = "whole - part = other part";
    model = "tape diagram or number line";
    reasonable = "The amount left is less than the amount at the start.";
  } else if (op === "mul" && y[1] === 1) {
    stem = T3(`${N} makes ${w} batches. Each batch uses ${ax}.`, `${N} makes ${w} batches, and each batch uses ${ax}.`, `${N} makes ${w} batches, using ${ax} in each batch.`);
    ask = T3(`How much ${Q.what} does ${N} use in all?`, `How much ${Q.what} does ${N} use in all?`, `What is the total amount of ${Q.what} that ${N} uses?`);
    happening = `${N} makes equal batches.`;
    known = [{ label: "number of batches", value: w }, { label: "amount in each batch", value: pText(x, mix) }];
    unknown = "the total amount";
    rel = "number of groups x amount in each group = total";
    model = "equal groups (tape)";
    reasonable = "The total is more than the amount in one batch.";
  } else if (op === "mul") {
    stem = T3(`${N} has ${ax}. ${N} uses ${pText(y, mix)} of it.`, `${N} has ${ax} and uses ${pText(y, mix)} of it.`, `${N} has ${ax} and uses ${pText(y, mix)} of that amount.`);
    ask = T3(`How much ${Q.what} does ${N} use?`, `How much ${Q.what} does ${N} use?`, `How much ${Q.what} does ${N} use?`);
    happening = `${N} uses a fraction of an amount.`;
    known = [{ label: "amount", value: pText(x, mix) }, { label: "fraction used", value: pText(y, mix) }];
    unknown = "the amount used";
    rel = "fraction of an amount = fraction x amount";
    model = "area model";
    reasonable = "The amount used is less than the amount N has, since the fraction is less than one.";
  } else if (op === "div" && y[1] !== 1 && y[0] === 1 && x[1] === 1) {
    stem = T3(`${N} has ${x[0]} ${x[0] === 1 ? Q.one : Q.many} of ${Q.what}. Each project uses ${pText(y, mix)} ${Q.one}.`, `${N} has ${x[0]} ${x[0] === 1 ? Q.one : Q.many} of ${Q.what}, and each project uses ${pText(y, mix)} ${Q.one}.`, `${N} has ${x[0]} ${x[0] === 1 ? Q.one : Q.many} of ${Q.what}. Each project uses ${pText(y, mix)} ${Q.one}.`);
    ask = T3(`How many projects can ${N} make?`, `How many projects can ${N} make?`, `How many projects can ${N} complete?`);
    happening = `${N} splits an amount into small equal portions.`;
    known = [{ label: "total amount", value: x[0] }, { label: "amount for each project", value: pText(y, mix) }];
    unknown = "number of projects";
    rel = "total / amount for each project = number of projects";
    model = "number line or tape";
    reasonable = "There are more projects than the number of whole units, because each project uses less than one unit.";
  } else if (op === "div" && y[1] === 1) {
    stem = T3(`${N} has ${ax}. ${N} shares it equally among ${w} people.`, `${N} shares ${ax} equally among ${w} people.`, `${N} divides ${ax} equally among ${w} people.`);
    ask = T3(`How much ${Q.what} does each person get?`, `How much ${Q.what} does each person get?`, `How much ${Q.what} does each person receive?`);
    happening = `${N} shares an amount equally.`;
    known = [{ label: "amount", value: pText(x, mix) }, { label: "number of people", value: w }];
    unknown = "the amount each person gets";
    rel = "amount / number of people = share";
    model = "tape diagram";
    reasonable = "Each share is less than the whole amount.";
  } else {
    stem = T3(`${N} has ${ax}. Each project uses ${ay}.`, `${N} has ${ax}, and each project uses ${ay}.`, `${N} has ${ax}. Each project uses ${ay}.`);
    ask = T3(`How many projects can ${N} make? A part of a project counts.`, `How many projects can ${N} make? A part of a project counts.`, `How many projects can ${N} make? Count a part of a project as a fraction.`);
    happening = `${N} divides an amount into equal portions of a fraction size.`;
    known = [{ label: "total amount", value: pText(x, mix) }, { label: "amount for each project", value: pText(y, mix) }];
    unknown = "number of projects";
    rel = "total / amount for each project = number of projects";
    model = "tape diagram or number line";
    reasonable = "Check whether each project uses more or less than the whole amount.";
  }
  return { stem, ask: withInstr(ask), structure: STRUCT(happening, known, unknown, rel, model, reasonable) };
}
function foBuild(rng, o) {
  const { op, x, y, mix = false, lv, mode } = o;
  const X = new Fr(x[0], x[1]);
  const Y = new Fr(y[0], y[1]);
  const ans = op === "add" ? X.add(Y) : op === "sub" ? X.sub(Y) : op === "mul" ? X.mul(Y) : X.div(Y);
  const sym = { add: "+", sub: MINUS, mul: TIMES, div: DIVIDE }[op];
  const expr = `${pText(x, mix)} ${sym} ${pText(y, mix)}`;
  const story = o.story ? foStory(rng, o, ans) : null;
  const hintKey = op === "add" ? (x[1] === y[1] && !mix ? "likeAdd" : mix ? "mixed" : "unlike") : op === "sub" ? (x[1] === y[1] && !mix ? "likeSub" : mix ? "mixed" : "unlike") : op === "mul" ? (y[1] === 1 ? "mulWhole" : "mulFrac") : y[1] === 1 ? "unitWhole" : x[1] === 1 && y[0] === 1 ? "wholeUnit" : "divFrac";
  const ansObj = fracAnswer(ans);
  const fmt = (v) => (v.d === 1 ? num(v.n) : mixedOf(v));
  const cands = [
    ...foCands(op, x, y)
      .filter(Boolean)
      .map(([v, tag, text]) => [v, tag, text && !(v.n > v.d) ? text : undefined]),
    [ans.add(new Fr(1, 2)), "off-by-one-half"],
    [ans.add(new Fr(1, 1)), "off-by-one-whole"],
    [ans.mul(new Fr(2, 1)), "doubled-the-answer"],
    [ans.add(new Fr(1, ans.d + 1)), "off-by-one-part"],
  ];
  const p = {
    family: "fracops",
    spec: { type: "calc", op, x, y },
    stem: story ? story.stem : S3(expr),
    ask: story ? story.ask : withInstr(VERB[op]),
    expr,
    answer: ansObj,
    work: foWork(op, x, y, mix, ans),
    visual: foVisual(op, x, y, lv, mode),
    distractors: mkD(ans, ansObj.text, cands, fmt),
    hints: FOHINT[hintKey],
    level: lv,
  };
  if (story) p.structure = story.structure;
  return finalize(p);
}
const LIKE_D = [3, 4, 5, 6, 8, 10, 12];
const REL = [[2, 4], [2, 6], [3, 6], [2, 8], [4, 8], [5, 10], [3, 12], [4, 12], [6, 12]];
const COP = [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6], [3, 8], [5, 8]];
const coprimeOf = (rng, d) => rng.pick(coprimeNums(d));
function mixedPair(rng, d, wHi) {
  const w = rng.int(1, wHi);
  const n = coprimeOf(rng, d);
  return [w * d + n, d];
}
function foLike(rng, lv, ctx) {
  const d = rng.pick(LIKE_D);
  const story = lv >= 2 && rng.chance(0.3);
  if (lv === 1) {
    const k = rng.pick(["add", "sub", "mulunit"]);
    if (k === "add") {
      const n1 = rng.int(1, d - 2);
      return { op: "add", x: [n1, d], y: [rng.int(1, d - n1), d], lv, ctx, mode: "like" };
    }
    if (k === "sub") {
      const n1 = rng.int(2, d - 1);
      return { op: "sub", x: [n1, d], y: [rng.int(1, n1 - 1), d], lv, ctx, mode: "like" };
    }
    return { op: "mul", x: [1, d], y: [rng.int(2, 6), 1], lv, ctx, mode: "like" };
  }
  if (lv === 2) {
    const k = rng.pick(["add", "sub", "mul", "mul", "mixadd"]);
    if (k === "add") {
      const n1 = rng.int(2, d - 1);
      return { op: "add", x: [n1, d], y: [rng.int(Math.max(1, d - n1 + 1), d - 1), d], lv, ctx, story, mode: "like" };
    }
    if (k === "sub") {
      const n1 = rng.int(2, d - 1);
      return { op: "sub", x: [n1, d], y: [rng.int(1, n1 - 1), d], lv, ctx, story, mode: "like" };
    }
    if (k === "mixadd") return { op: "add", x: mixedPair(rng, d, 3), y: [coprimeOf(rng, d), d], mix: true, lv, ctx, story, mode: "like" };
    return { op: "mul", x: [rng.int(2, d - 1), d], y: [rng.int(2, 9), 1], lv, ctx, story, mode: "like" };
  }
  const k = rng.pick(["mixadd", "mixsub", "mixsub", "mul"]);
  if (k === "mul") return { op: "mul", x: [rng.int(2, d - 1), d], y: [rng.int(3, 12), 1], lv, ctx, story: rng.chance(0.5), mode: "like" };
  const a = mixedPair(rng, d, 4);
  const b = mixedPair(rng, d, 3);
  if (k === "mixadd") return { op: "add", x: a, y: b, mix: true, lv, ctx, story, mode: "like" };
  const big = a[0] >= b[0] ? a : b;
  const small = a[0] >= b[0] ? b : a;
  return big[0] === small[0] ? null : { op: "sub", x: big, y: small, mix: true, lv, ctx, story, mode: "like" };
}
function foUnlike(rng, lv, ctx) {
  const story = lv >= 2 && rng.chance(0.35);
  if (lv === 1) {
    const k = rng.pick(["add", "sub", "unitwhole", "wholeunit"]);
    if (k === "unitwhole") return { op: "div", x: [1, rng.int(2, 6)], y: [rng.int(2, 5), 1], lv, ctx, mode: "unlike" };
    if (k === "wholeunit") return { op: "div", x: [rng.int(2, 6), 1], y: [1, rng.int(2, 6)], lv, ctx, mode: "unlike" };
    const [d1, d2] = rng.pick(REL);
    let x = [coprimeOf(rng, d1), d1];
    let y = [coprimeOf(rng, d2), d2];
    if (rng.chance(0.5)) [x, y] = [y, x];
    if (k === "sub") {
      if (x[0] * y[1] === y[0] * x[1]) return null;
      if (x[0] * y[1] < y[0] * x[1]) [x, y] = [y, x];
    }
    return { op: k, x, y, lv, ctx, mode: "unlike" };
  }
  if (lv === 2) {
    const k = rng.pick(["add", "sub", "mul", "mul", "unitwhole", "wholeunit"]);
    if (k === "unitwhole") return { op: "div", x: [1, rng.int(2, 8)], y: [rng.int(2, 6), 1], lv, ctx, story, mode: "unlike" };
    if (k === "wholeunit") return { op: "div", x: [rng.int(2, 9), 1], y: [1, rng.int(2, 8)], lv, ctx, story, mode: "unlike" };
    if (k === "mul") {
      const d1 = rng.int(2, 8);
      const d2 = rng.int(2, 8);
      return { op: "mul", x: [coprimeOf(rng, d1), d1], y: [coprimeOf(rng, d2), d2], lv, ctx, story, mode: "unlike" };
    }
    const [d1, d2] = rng.pick(COP);
    let x = [coprimeOf(rng, d1), d1];
    let y = [coprimeOf(rng, d2), d2];
    if (k === "sub") {
      if (x[0] * y[1] === y[0] * x[1]) return null;
      if (x[0] * y[1] < y[0] * x[1]) [x, y] = [y, x];
    }
    return { op: k, x, y, lv, ctx, story, mode: "unlike" };
  }
  const k = rng.pick(["mixadd", "mixsub", "mixsub", "mixmul", "mixadd"]);
  const [d1, d2] = rng.pick([...COP, [4, 6], [6, 8], [2, 3], [3, 4]]);
  if (k === "mixmul") return { op: "mul", x: mixedPair(rng, d1, 3), y: [coprimeOf(rng, d2), d2], mix: true, lv, ctx, story, mode: "unlike" };
  const a = mixedPair(rng, d1, 4);
  const b = mixedPair(rng, d2, 3);
  if (k === "mixadd") return { op: "add", x: a, y: b, mix: true, lv, ctx, story, mode: "unlike" };
  const A = new Fr(a[0], a[1]);
  const B = new Fr(b[0], b[1]);
  const c = A.cmp(B);
  if (c === 0) return null;
  return { op: "sub", x: c > 0 ? a : b, y: c > 0 ? b : a, mix: true, lv, ctx, story, mode: "unlike" };
}
function foDivide(rng, lv, ctx) {
  const story = lv >= 2 && rng.chance(0.4);
  if (lv === 1) {
    const b = rng.int(1, 2);
    const k = rng.int(2, 4);
    const a = b * k;
    const d = rng.int(a + 1, a + 3);
    return { op: "div", x: [a, d], y: [b, d], lv, ctx, story: false, mode: "divide" };
  }
  if (lv === 2) {
    const kind = rng.pick(["frac", "frac", "fracwhole", "wholefrac"]);
    if (kind === "fracwhole") {
      const d = rng.int(2, 8);
      return { op: "div", x: [coprimeOf(rng, d), d], y: [rng.int(2, 5), 1], lv, ctx, story, mode: "divide" };
    }
    if (kind === "wholefrac") {
      const d = rng.int(2, 8);
      return { op: "div", x: [rng.int(2, 6), 1], y: [coprimeOf(rng, d), d], lv, ctx, story, mode: "divide" };
    }
    const [d1, d2] = rng.pick([...COP, [2, 4], [3, 6], [2, 6]]);
    const x = [coprimeOf(rng, d1), d1];
    const y = [coprimeOf(rng, d2), d2];
    return { op: "div", x, y, lv, ctx, story, mode: "divide" };
  }
  const kind = rng.pick(["mixfrac", "mixfrac", "wholefrac", "frac"]);
  const d = rng.int(2, 8);
  if (kind === "wholefrac") return { op: "div", x: [rng.int(3, 9), 1], y: [coprimeOf(rng, d), d], lv, ctx, story: true, mode: "divide" };
  if (kind === "frac") {
    const [d1, d2] = rng.pick(COP);
    return { op: "div", x: [coprimeOf(rng, d1), d1], y: [coprimeOf(rng, d2), d2], lv, ctx, story: true, mode: "divide" };
  }
  const d2 = rng.pick([2, 3, 4, 5, 6, 8].filter((v) => v !== d));
  return { op: "div", x: mixedPair(rng, d, 3), y: [coprimeOf(rng, d2), d2], mix: true, lv, ctx, story, mode: "divide" };
}
// -- scaling: multiplication as scaling (5.NF.B.5) ---------------------------------------------------
const M_LT = [[1, 2], [2, 3], [3, 4], [1, 4], [3, 5], [5, 8], [4, 5], [1, 3], [7, 8]];
const M_GT = [[5, 4], [3, 2], [4, 3], [7, 4], [5, 3], [9, 8], [8, 5], [7, 6]];
function foScaleCmp(rng, lv) {
  const equal = lv === 3 && rng.chance(0.3);
  const m = equal ? rng.pick([[2, 2], [3, 3], [4, 4], [5, 5]]) : rng.chance(0.5) ? rng.pick(M_LT) : rng.pick(M_GT);
  let base;
  if (lv === 1) base = [rng.int(4, 12), 1];
  else {
    const d = rng.pick([2, 3, 4, 5, 8]);
    base = rng.chance(0.5) ? [coprimeOf(rng, d), d] : [rng.int(1, 3) * d + coprimeOf(rng, d), d];
  }
  const bt = pText(base, true);
  const mt = pText(m, lv >= 2);
  const cmp = new Fr(m[0], m[1]).cmp(new Fr(1, 1));
  const texts = { 1: `greater than ${bt}`, [-1]: `less than ${bt}`, 0: `equal to ${bt}` };
  const ans = texts[cmp];
  const why = cmp === 0 ? `${mt} is the same as one whole, so the product is the same as ${bt}.` : cmp > 0 ? `${mt} is more than one whole, so the product is more than ${bt}.` : `${mt} is less than one whole, so the product is less than ${bt}.`;
  const cands = [[texts[1], cmp === -1 ? "multiplication-always-makes-bigger" : "did-not-compare-the-factor-with-one"], [texts[-1], cmp === 1 ? "multiplying-by-a-fraction-always-makes-smaller" : "did-not-compare-the-factor-with-one"], [texts[0], "thought-fractions-do-not-change-the-value"], ["cannot tell without multiplying", "thinks-you-must-calculate"]];
  return finalize({
    family: "fracops",
    spec: { type: "scalecmp", baseText: bt, base, m },
    stem: T3(`Look at this product: ${bt} ${TIMES} ${mt}.`, `Look at this product: ${bt} ${TIMES} ${mt}.`, `Consider the product ${bt} ${TIMES} ${mt}.`),
    ask: T3(`Without multiplying, how does the product compare with ${bt}?`, `Without multiplying, how does the product compare with ${bt}?`, `Without calculating, how does the product compare with the factor ${bt}?`),
    expr: `${bt} ${TIMES} ${mt}`,
    answer: { value: ans, text: ans, kind: "text" },
    work: [why],
    visual: null,
    distractors: mkT(ans, cands),
    hints: { conceptual: "Multiplying by a number less than one makes the result smaller than the starting number. Multiplying by a number greater than one makes it larger. Multiplying by exactly one keeps it the same.", procedural: "Look only at the second factor. Compare it with one whole and decide whether it scales the first factor up, down, or not at all." },
    level: lv,
  });
}
function foScaleFactor(rng, lv) {
  return until(() => {
    const a = rng.int(4, lv === 1 ? 12 : 24);
    const b = rng.int(3, lv === 1 ? 16 : 30);
    if (a === b) return null;
    const f = new Fr(b, a);
    if (f.d === 1 || f.d > 12) return null;
    const u = rng.pick(["centimeters", "inches"]);
    const cands = [[new Fr(a, b), "flipped-the-comparison", `${a / gcd(a, b)}/${b / gcd(a, b)}`], [new Fr(Math.abs(a - b), a), "used-the-difference-over-the-original"], [new Fr(b, a + b), "compared-the-copy-with-the-total"], [new Fr(Math.abs(a - b), b), "used-the-difference-over-the-copy"], [new Fr(b, a).add(new Fr(1, 2)), "added-one-half"]];
    const fmt = (v) => (v.d === 1 ? num(v.n) : `${v.n}/${v.d}`);
    return finalize({
      family: "fracops",
      spec: { type: "ratio", from: a, to: b },
      stem: T3(`A photo is ${a} ${u} wide. A copy of the photo is ${b} ${u} wide.`, `A photo is ${a} ${u} wide, and its copy is ${b} ${u} wide.`, `An original photo is ${a} ${u} wide. A copy of it is ${b} ${u} wide.`),
      ask: T3("The copy is what fraction of the original width? Write it in simplest form.", "The copy is what fraction of the original width? Write the fraction in simplest form.", "What fraction of the original width is the copy's width? Write the fraction in simplest form."),
      expr: null,
      answer: { value: `${f.n}/${f.d}`, text: `${f.n}/${f.d}`, kind: "frac" },
      work: [`Compare the copy with the original: ${b} out of ${a}, which is ${b}/${a}.`, `In simplest form that is ${f.n}/${f.d}.`],
      visual: null,
      distractors: mkD(f, `${f.n}/${f.d}`, cands, fmt),
      hints: { conceptual: "The scale factor is the new size compared with the original size, written as a fraction: new over original.", procedural: "Put the copy's width on top and the original's width on the bottom. Then simplify." },
      level: lv,
    });
  });
}
function foScale2(rng, lv) {
  return until(() => {
    const base = lv === 1 ? [rng.int(3, 9), 1] : [rng.int(2, 9), 1];
    const pool = [...M_LT, ...M_GT];
    const m1 = rng.pick(pool);
    const m2 = rng.pick(pool);
    if (new Fr(m1[0], m1[1]).cmp(new Fr(m2[0], m2[1])) === 0) return null;
    const pick = rng.pick(["greater", "less"]);
    const bt = pText(base, false);
    const e1 = `${bt} ${TIMES} ${m1[0]}/${m1[1]}`;
    const e2 = `${bt} ${TIMES} ${m2[0]}/${m2[1]}`;
    const c = new Fr(m1[0], m1[1]).cmp(new Fr(m2[0], m2[1]));
    const ans = (pick === "greater" ? c > 0 : c < 0) ? e1 : e2;
    const other = ans === e1 ? e2 : e1;
    const cands = [[other, "chose-the-wrong-multiplier"], ["The two products are equal", "thought-the-products-are-the-same"], ["Cannot tell without multiplying", "thinks-you-must-calculate"]];
    return finalize({
      family: "fracops",
      spec: { type: "scale2", base: bt, m1: `${m1[0]}/${m1[1]}`, m2: `${m2[0]}/${m2[1]}`, pick },
      stem: T3(`Look at ${e1} and ${e2}.`, `Compare the products ${e1} and ${e2}.`, `Compare the two products ${e1} and ${e2}.`),
      ask: T3(`Which product is ${pick}? Do not multiply.`, `Without multiplying, which product is ${pick}?`, `Without calculating, which product has the ${pick === "greater" ? "greater" : "lesser"} value?`),
      expr: null,
      answer: { value: ans, text: ans, kind: "text" },
      work: [`Both products start with ${bt}. The only difference is the scale factor, so compare ${m1[0]}/${m1[1]} and ${m2[0]}/${m2[1]}.`, `The ${pick} scale factor gives the ${pick} product, so the answer is ${ans}.`],
      visual: null,
      distractors: mkT(ans, cands),
      hints: { conceptual: "When the first factor is the same, the product that is scaled by the larger factor is larger.", procedural: "Compare the two multipliers with each other. Use one whole or a common denominator to decide which is larger." },
      level: lv,
    });
  });
}
function foScaleFind(rng, lv, ctx) {
  return until(() => {
    const d = rng.pick(lv === 1 ? [2, 3, 4, 5] : [3, 4, 5, 6, 8]);
    const n = coprimeOf(rng, d);
    const gt = lv === 3 && rng.chance(0.4);
    const m = gt ? [d + coprimeOf(rng, d), d] : [n, d];
    const a = lv === 1 ? d * rng.int(2, 4) : rng.int(2, 9);
    if (new Fr(a * m[0], m[1]).d > 12) return null;
    return foBuild(rng, { op: "mul", x: [a, 1], y: m, lv, ctx, story: true, scale: true, mode: "scale" });
  });
}
function genFracops(rng, p, o) {
  const lv = o.level;
  const mode = p.level || "like";
  const ctx = o.ctx;
  if (mode === "scale") {
    const r = rng.next();
    if (lv === 1) return r < 0.55 ? foScaleCmp(rng, 1) : r < 0.8 ? foScaleFind(rng, 1, ctx) : foScaleFactor(rng, 1);
    if (lv === 2) return r < 0.3 ? foScaleCmp(rng, 2) : r < 0.5 ? foScaleFactor(rng, 2) : r < 0.75 ? foScale2(rng, 2) : foScaleFind(rng, 2, ctx);
    return r < 0.3 ? foScaleCmp(rng, 3) : r < 0.5 ? foScale2(rng, 3) : r < 0.7 ? foScaleFactor(rng, 3) : foScaleFind(rng, 3, ctx);
  }
  const sampler = mode === "unlike" ? foUnlike : mode === "divide" ? foDivide : foLike;
  return foBuild(rng, until(() => sampler(rng, lv, ctx)));
}

// ---------------------------------------------------------------------------------------------------- decimals
// A decimal is carried as a scaled integer {i, p}: the value is i / 10^p. Nothing here uses floating point for a result.
const PN = { "-1": "tens", 0: "ones", 1: "tenths", 2: "hundredths", 3: "thousandths" };
const SING = { 0: "whole number", 1: "tenth", 2: "hundredth", 3: "thousandth" };
const dstr = (i, p) => {
  const s = String(i).padStart(p + 1, "0");
  return p === 0 ? s : `${s.slice(0, s.length - p)}.${s.slice(s.length - p)}`;
};
const dparse = (s) => {
  const [a, b = ""] = String(s).split(".");
  return { i: Number(a + b), p: b.length };
};
const dtrim = (i, p, minP = 0) => {
  while (p > minP && i % 10 === 0) {
    i /= 10;
    p--;
  }
  return { i, p };
};
const withCommas = (v) => {
  const [a, b] = String(v).split(".");
  const w = a.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return b ? `${w}.${b}` : w;
};
/** An answer object from a scaled decimal. Money keeps exactly two places; otherwise trailing zeros are dropped and a whole result is an int. */
function decAnswer(i, p, money) {
  if (money) {
    const v = dstr(i * 10 ** (2 - p), 2);
    return { value: v, text: `$${withCommas(v)}`, kind: "dec" };
  }
  const t = dtrim(i, p);
  if (t.p === 0) return { value: String(t.i), text: withCommas(t.i), kind: "int" };
  const v = dstr(t.i, t.p);
  return { value: v, text: withCommas(v), kind: "dec" };
}
/** A distractor from a scaled decimal, shown the same way the answer is shown. */
const decCand = (i, p, tag, money) => {
  if (i < 0 || !Number.isFinite(i)) return null;
  const a = decAnswer(i, p, money);
  return [i / 10 ** p, tag, a.text];
};
/** A random scaled decimal with exactly p places (last digit never zero), whole part in [lo, hi]. */
const rdec = (rng, p, lo, hi) => {
  const whole = rng.int(lo, hi);
  if (p === 0) return { i: whole, p };
  let frac = rng.int(1, 10 ** p - 1);
  if (frac % 10 === 0) frac += rng.int(1, 9);
  return { i: whole * 10 ** p + frac, p };
};
const align = (a, b) => {
  const p = Math.max(a.p, b.p);
  return [a.i * 10 ** (p - a.p), b.i * 10 ** (p - b.p), p];
};
const DCH = {
  place: { conceptual: "Each place in a decimal is worth one tenth of the place to its left. The name of the place tells its size.", procedural: "Count places to the right of the decimal point: tenths first, then hundredths, then thousandths." },
  compare: { conceptual: "Compare decimals place by place from the left, using the same place values. The number of digits does not tell the size.", procedural: "Line up the decimal points. Compare the ones, then the tenths, then the hundredths, and so on." },
  round: { conceptual: "Rounding finds the nearest number with fewer decimal places. Look at the digit just to the right of the place you are rounding to.", procedural: "Underline the place you round to. If the next digit is 5 or more, round up; if it is less than 5, keep the digit." },
  convert: { conceptual: "Tenths, hundredths and thousandths are fractions with denominators 10, 100 and 1,000. The number of zeros tells the number of decimal places.", procedural: "Count the zeros in the denominator. That is the number of places after the decimal point." },
  add: { conceptual: "You can only add or subtract digits that have the same place value, so line up the decimal points.", procedural: "Line up the decimal points, write zeros as placeholders, then add or subtract as with whole numbers." },
  mul: { conceptual: "Multiply as if there were no decimal points, then place the point so the product has as many decimal places as both factors together.", procedural: "Multiply the digits, count the decimal places in both factors, then place the decimal point." },
  div: { conceptual: "Dividing by a decimal gives the same answer as dividing by a whole number if you multiply both numbers by the same power of ten.", procedural: "Move the decimal point in both numbers the same number of places until the divisor is a whole number. Then divide." },
  scale10: { conceptual: "Multiplying by 10 moves each digit one place to the left. Dividing by 10 moves each digit one place to the right.", procedural: "Count the zeros in the power of ten. Move the digits that many places." },
};
function dcPlaceName(rng, lv, P) {
  const wd = 2;
  const ds = rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], wd + P);
  const x = `${ds.slice(0, wd).join("")}.${ds.slice(wd).join("")}`;
  const k = rng.int(1, P);
  const ans = ds[wd + k - 1];
  const nameOf = (idx) => (idx < wd ? (idx === wd - 1 ? "ones" : "tens") : PN[idx - wd + 1]);
  const cands = ds.map((d, idx) => (idx === wd + k - 1 ? null : [d, `read-the-${nameOf(idx)}-place`])).filter(Boolean);
  return finalize({
    family: "decimals",
    spec: { type: "placename", x, place: PN[k] },
    stem: T3(`Look at the number ${x}.`, `Look at the number ${x}.`, `Consider the number ${x}.`),
    ask: T3(`What digit is in the ${PN[k]} place?`, `What digit is in the ${PN[k]} place?`, `Which digit is in the ${PN[k]} place?`),
    expr: null,
    answer: ansInt(ans),
    work: [`Start at the decimal point and move right. The first place is tenths, the second is hundredths${P >= 3 ? ", and the third is thousandths" : ""}.`, `The digit in the ${PN[k]} place is ${ans}.`],
    visual: null,
    distractors: mkD(ans, num(ans), [...cands, [(ans % 9) + 1, "misread-a-digit"]], fmtInt),
    hints: DCH.place,
    level: lv,
  });
}
function dcPlaceValue(rng, lv, P) {
  const wd = 2;
  const ds = rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], wd + P);
  const x = `${ds.slice(0, wd).join("")}.${ds.slice(wd).join("")}`;
  const ks = [1, 2, 3].filter((k) => k <= P);
  if (lv >= 2) ks.push(0, -1);
  const k = rng.pick(ks);
  const idx = k >= 1 ? wd + k - 1 : k === 0 ? wd - 1 : 0;
  const d = ds[idx];
  const val = (kk) => (kk >= 1 ? { i: d, p: kk } : { i: d * 10 ** -kk, p: 0 });
  const v = val(k);
  const cands = [];
  for (const kk of [-1, 0, 1, 2, 3]) if (kk !== k && (kk <= P || kk === -1)) cands.push(decCand(val(kk).i, val(kk).p, `read-it-as-${PN[kk]}`, false));
  cands.push([d, "gave-the-digit-not-its-value", String(d)]);
  const a = decAnswer(v.i, v.p, false);
  return finalize({
    family: "decimals",
    spec: { type: "placevalue", x, digitPlace: PN[k] },
    stem: T3(`Look at the number ${x}.`, `Look at the number ${x}.`, `Consider the number ${x}.`),
    ask: T3(`What is the value of the digit ${d}?`, `What is the value of the digit ${d} in this number?`, `What is the value of the digit ${d} in this number?`),
    expr: null,
    answer: a,
    work: [`The digit ${d} is in the ${PN[k]} place, so its value is ${d} ${k >= 1 ? `${PN[k]}` : PN[k]}, which is ${a.value}.`],
    visual: null,
    distractors: mkD(Number(a.value), a.text, cands, (z) => String(z)),
    hints: DCH.place,
    level: lv,
  });
}
function dcCompare(rng, lv, P) {
  return until(() => {
    const maxP = lv === 1 ? Math.min(P, 2) : P;
    const vals = [];
    const tries = 30;
    for (let t = 0; t < tries && vals.length < 4; t++) {
      const p = rng.int(1, maxP);
      const w = lv === 1 ? rng.int(0, 1) : rng.int(0, 9);
      const d = rdec(rng, p, w, w);
      if (vals.some((v) => v.i * 10 ** (4 - v.p) === d.i * 10 ** (4 - d.p))) continue;
      vals.push(d);
    }
    if (vals.length < 4) return null;
    const pick = lv === 1 ? "max" : rng.pick(["max", "min"]);
    const key = (v) => v.i * 10 ** (4 - v.p);
    const sorted = vals.slice().sort((a, b) => key(a) - key(b));
    const best = pick === "max" ? sorted[3] : sorted[0];
    const strs = vals.map((v) => dstr(v.i, v.p));
    if (new Set(strs).size < 4) return null;
    const bestS = dstr(best.i, best.p);
    const longest = vals.reduce((m, v) => (v.p > m.p ? v : m), vals[0]);
    const shortest = vals.reduce((m, v) => (v.p < m.p ? v : m), vals[0]);
    const wholeKey = (v) => v.i;
    const maxWhole = vals.reduce((m, v) => (wholeKey(v) > wholeKey(m) ? v : m), vals[0]);
    const word = pick === "max" ? "greatest" : "least";
    const tagOf = (v) => (pick === "max" ? (v === longest ? "more-digits-means-greater" : v === maxWhole ? "compared-as-whole-numbers" : "compared-only-the-first-digit") : v === shortest ? "fewer-digits-means-smaller" : v === maxWhole ? "compared-as-whole-numbers" : "compared-only-the-first-digit");
    const shown = rng.shuffle(vals).map((v) => dstr(v.i, v.p));
    const list = `${shown.slice(0, 3).join(", ")} and ${shown[3]}`;
    const cands = vals.filter((v) => v !== best).map((v) => [v.i / 10 ** v.p, tagOf(v), dstr(v.i, v.p)]);
    return finalize({
      family: "decimals",
      spec: { type: "cmp", vals: strs, pick },
      stem: T3(`Look at these decimals: ${list}.`, `Here are four decimals: ${list}.`, `Consider the decimals ${list}.`),
      ask: T3(`Which decimal is the ${word}?`, `Which decimal is the ${word}?`, `Which of these decimals has the ${word} value?`),
      expr: null,
      answer: { value: bestS, text: bestS, kind: "dec" },
      work: [`Compare place by place. Line up the decimal points: ${vals.map((v) => dstr(v.i * 10 ** (maxP - v.p), maxP)).join(", ")}`, `The ${word} is ${bestS}.`],
      visual: null,
      distractors: mkD(best.i / 10 ** best.p, bestS, cands, (z) => String(z)),
      hints: DCH.compare,
      level: lv,
    });
  });
}
function dcRound(rng, lv) {
  const ds = rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
  const whole = lv === 1 ? ds[0] : Number(`${ds[0]}${ds[1]}`);
  const frac = ds.slice(2).concat([rng.int(1, 9)]).slice(0, 3).join("");
  const i3 = whole * 1000 + Number(frac);
  const x = dstr(i3, 3);
  const k = rng.pick(lv === 1 ? [1, 2] : [0, 1, 2]);
  const rnd = (kk) => Math.floor((i3 + 10 ** (3 - kk) / 2) / 10 ** (3 - kk));
  const trunc = (kk) => Math.floor(i3 / 10 ** (3 - kk));
  const fmtK = (v, kk) => (kk === 0 ? String(v) : dstr(v, kk));
  const r = rnd(k);
  const ans = { value: fmtK(r, k), text: withCommas(fmtK(r, k)), kind: k === 0 ? "int" : "dec" };
  const cands = [[trunc(k) / 10 ** k, "dropped-the-extra-digits-without-rounding", withCommas(fmtK(trunc(k), k))], [(trunc(k) + 1) / 10 ** k, "always-rounded-up", withCommas(fmtK(trunc(k) + 1, k))]];
  for (const kk of [0, 1, 2]) if (kk !== k) cands.push([rnd(kk) / 10 ** kk, `rounded-to-the-${PN[kk]}-place-instead`, withCommas(fmtK(rnd(kk), kk))]);
  cands.push([(r + 1) / 10 ** k, "moved-one-place-value-up", withCommas(fmtK(r + 1, k))], [(r - 1) / 10 ** k, "moved-one-place-value-down", withCommas(fmtK(r - 1, k))]);
  const visual =
    lv === 1
      ? { kind: "numberline", alt: `A number line between ${fmtK(trunc(k), k)} and ${fmtK(trunc(k) + 1, k)} split into 10 equal parts with ${x} marked.`, min: fmtK(trunc(k), k), max: fmtK(trunc(k) + 1, k), ticks: 10, marks: [{ at: x, label: x }], show: "dec" }
      : null;
  return finalize({
    family: "decimals",
    spec: { type: "round", x, place: PN[k] },
    stem: S3(`${x}`),
    ask: T3(`Round ${x} to the nearest ${SING[k]}.`, `Round ${x} to the nearest ${SING[k]}.`, `Round ${x} to the nearest ${SING[k]}.`),
    expr: null,
    answer: ans,
    work: [`The digit to the right of the ${PN[k]} place decides: ${k === 0 ? x.split(".")[1][0] : x.split(".")[1][k]} is ${Number(k === 0 ? x.split(".")[1][0] : x.split(".")[1][k]) >= 5 ? "5 or more, so round up" : "less than 5, so keep the digit"}.`, `${x} rounds to ${ans.text}.`],
    visual,
    distractors: mkD(Number(ans.value), ans.text, cands, (z) => String(z)),
    hints: DCH.round,
    level: lv,
  });
}
function dcFracDec(rng, lv, P) {
  const dens = P >= 3 && lv >= 2 ? [10, 100, 1000] : [10, 100];
  const d = rng.pick(dens);
  const k = Math.log10(d);
  const toDec = rng.chance(0.5);
  let n = rng.int(1, d - 1);
  while (n % 10 === 0) n = rng.int(1, d - 1);
  const x = dstr(n, k);
  if (toDec) {
    const cands = [decCand(n, k + 1, "put-one-place-too-many-after-the-point"), decCand(n, Math.max(0, k - 1), "put-one-place-too-few-after-the-point"), [Number(`0.${n}`), "ignored-the-denominator", `0.${n}`], decCand(n * 10, k, "moved-the-decimal-point-the-wrong-way"), decCand(n, k + 2, "put-two-places-too-many-after-the-point"), decCand(n, Math.max(0, k - 2), "put-the-decimal-point-too-far-right")];
    return finalize({
      family: "decimals",
      spec: { type: "f2d", n, d },
      stem: "",
      ask: T3(`Write ${n}/${d} as a decimal.`, `Write ${n}/${d} as a decimal.`, `Express ${n}/${d} as a decimal.`),
      expr: null,
      answer: { value: x, text: x, kind: "dec" },
      work: [`The denominator ${d} has ${k} zero${k > 1 ? "s" : ""}, so the decimal has ${k} place${k > 1 ? "s" : ""}.`, `${n}/${d} is ${n} ${PN[k]}, which is ${x}.`],
      visual: null,
      distractors: mkD(n / d, x, cands, (z) => String(z)),
      hints: DCH.convert,
      level: lv,
    });
  }
  const gc = gcd(n, d);
  const ans = `${n}/${d}`;
  const cands = [[`${n}/${d * 10}`, "used-the-wrong-denominator"], [`${n * 10}/${d}`, "used-the-wrong-numerator"], [`${n}/${d / 10 >= 10 ? d / 10 : d * 100}`, "used-the-wrong-denominator"], [`${d}/${n}`, "flipped-the-numerator-and-denominator"], [`${n + 1}/${d}`, "off-by-one"]];
  const reduced = gc === 1;
  return finalize({
    family: "decimals",
    spec: { type: "d2f", x, d },
    stem: "",
    ask: T3(`Write ${x} as a fraction with ${d} on the bottom.`, `Write ${x} as a fraction with a denominator of ${d}.`, `Express ${x} as a fraction with denominator ${d}.`),
    expr: null,
    answer: { value: ans, text: ans, kind: reduced ? "frac" : "text" },
    work: [`${x} has ${k} decimal place${k > 1 ? "s" : ""}, so the denominator is ${d}.`, `The digits after the point make the numerator: ${x} is ${ans}.`],
    visual: null,
    distractors: reduced ? mkD(new Fr(n, d), ans, cands.map(([t, g]) => [(([a, b]) => new Fr(Number(a), Number(b)))(t.split("/")), g, t]), fmtFr) : mkT(ans, cands),
    hints: DCH.convert,
    level: lv,
  });
}
function dcFracSum(rng, lv) {
  const a = rng.int(1, 8);
  const c = rng.int(1, 9);
  const total = a * 10 + c;
  const ans = dstr(total, 2);
  const cands = [decCand(a + c, 2, "added-numerators-over-hundredths"), decCand(a + c, 1, "added-numerators-over-tenths"), decCand(c * 10 + a, 2, "swapped-the-places"), decCand(total, 1, "put-the-sum-in-tenths")];
  return finalize({
    family: "decimals",
    spec: { type: "fsum", n1: a, d1: 10, n2: c, d2: 100 },
    stem: S3(`${a}/10 + ${c}/100`),
    ask: T3("Add. Write the sum as a decimal.", "Find the sum. Write it as a decimal.", "Calculate the sum and write it as a decimal."),
    expr: `${a}/10 + ${c}/100`,
    answer: { value: ans, text: ans, kind: "dec" },
    work: [`Rename ${a}/10 with a denominator of 100: ${a}/10 is the same as ${a * 10}/100.`, `Add: ${a * 10} + ${c} = ${total}, so the sum is ${total}/100, which is ${ans}.`],
    visual: null,
    distractors: mkD(total / 100, ans, cands, (z) => String(z)),
    hints: { conceptual: "Tenths and hundredths can only be added after the tenths are renamed as hundredths.", procedural: "Rename the tenths as hundredths, add the numerators, then write the sum as a decimal." },
    level: lv,
  });
}
function dcScale10(rng, lv) {
  const mul = rng.chance(0.5);
  const bp = mul ? rng.int(1, 2) : rng.int(0, 1);
  const pw = rng.pick([1, 2, 3].filter((v) => mul || v <= 3 - bp));
  const base = mul ? rdec(rng, bp, 1, 9) : rdec(rng, bp, 1, 99);
  const baseS = dstr(base.i, base.p);
  const m = 10 ** pw;
  const res = mul ? { i: base.i * m, p: base.p } : { i: base.i, p: base.p + pw };
  const ans = decAnswer(res.i, res.p, false);
  const rv = res.i / 10 ** res.p;
  const cands = [];
  for (const sh of [-1, 1, -2, 2]) {
    const np = res.p + sh;
    if (np < 0 || np > 5) continue;
    const t = decAnswer(res.i, np, false);
    cands.push([res.i / 10 ** np, sh > 0 ? "moved-the-digits-too-far-right" : "moved-the-digits-too-far-left", t.text]);
  }
  cands.push([mul ? base.i / 10 ** base.p / m : (base.i / 10 ** base.p) * m, "moved-the-decimal-point-the-wrong-way", decAnswer(mul ? base.i : base.i * m, mul ? base.p + pw : base.p, false).text]);
  return finalize({
    family: "decimals",
    spec: { type: "scale10", x: baseS, p: pw, dir: mul ? "mul" : "div" },
    stem: S3(`${baseS} ${mul ? TIMES : DIVIDE} ${num(m)}`),
    ask: T3(mul ? "Multiply." : "Divide.", mul ? "Find the product." : "Find the quotient.", mul ? "Calculate the product." : "Calculate the quotient."),
    expr: `${baseS} ${mul ? TIMES : DIVIDE} ${num(m)}`,
    answer: ans,
    work: [`${num(m)} has ${pw} zero${pw > 1 ? "s" : ""}, so move the digits ${pw} place${pw > 1 ? "s" : ""} to the ${mul ? "left" : "right"}.`, `${baseS} ${mul ? TIMES : DIVIDE} ${num(m)} = ${ans.value}`],
    visual: null,
    distractors: mkD(rv, ans.text, cands, (z) => String(z)),
    hints: DCH.scale10,
    level: lv,
  });
}
const MONEY_CTX = new Set(["store", "kitchen", "community", "library"]);
const LENQ = {
  garden: { item: "garden hose", items: "garden hoses", one: "meter", many: "meters" },
  sports: { item: "chalk line", items: "chalk lines", one: "meter", many: "meters" },
  pets: { item: "roll of fencing", items: "rolls of fencing", one: "meter", many: "meters" },
  crafts: { item: "roll of ribbon", items: "rolls of ribbon", one: "meter", many: "meters" },
  travel: { item: "bike path", items: "bike paths", one: "kilometer", many: "kilometers" },
  science: { item: "roll of wire", items: "rolls of wire", one: "meter", many: "meters" },
  library: { item: "roll of tape", items: "rolls of tape", one: "meter", many: "meters" },
  store: { item: "roll of ribbon", items: "rolls of ribbon", one: "meter", many: "meters" },
  kitchen: { item: "roll of foil", items: "rolls of foil", one: "meter", many: "meters" },
  community: { item: "fence", items: "fences", one: "meter", many: "meters" },
};
function dcStory(rng, ctx, op, x, y, divByDecimal) {
  const [N] = rng.sample(NAMES, 1);
  const money = MONEY_CTX.has(ctx) && x.p <= 2 && y.p <= 2 && x.i >= 10 ** x.p && (op !== "div" || y.i >= 10 ** y.p || y.p === 0 || divByDecimal);
  const ft = (v) => (money ? `$${dstr(v.i * 10 ** (2 - v.p), 2)}` : dstr(v.i, v.p));
  const Q = LENQ[ctx] || LENQ.crafts;
  const u = (v) => (v.i === 10 ** v.p ? Q.one : Q.many);
  const lenT = (v) => `${ft(v)} ${u(v)}`;
  const A = ft(x);
  const B = ft(y);
  const item = rng.pick(["pen", "notebook", "folder", "sticker book"]);
  let stem;
  let ask;
  let known;
  let unknown;
  let rel;
  let reasonable;
  let happening;
  let unit;
  if (op === "add" || op === "sub") {
    stem = money
      ? T3(`A pen costs ${A}. A notebook costs ${B}.`, `A pen costs ${A}, and a notebook costs ${B}.`, `A pen costs ${A} and a notebook costs ${B}.`)
      : T3(`A ${Q.item} is ${lenT(x)} long. Another ${Q.item} is ${lenT(y)} long.`, `A ${Q.item} is ${lenT(x)} long, and another ${Q.item} is ${lenT(y)} long.`, `One ${Q.item} is ${lenT(x)} long and another ${Q.item} is ${lenT(y)} long.`);
    ask =
      op === "add"
        ? money
          ? T3("What is the total cost?", "What is the total cost of the pen and the notebook?", "What is the combined cost of the pen and the notebook?")
          : T3(`How long are the two ${Q.items} together?`, `How long are the two ${Q.items} when put together?`, `What is the combined length of the two ${Q.items}?`)
        : money
          ? T3("How much more does the pen cost?", "How much more does the pen cost than the notebook?", "By how much does the cost of the pen exceed the cost of the notebook?")
          : T3(`How much longer is the first ${Q.item}?`, `How much longer is the first ${Q.item} than the second one?`, `By how much does the first ${Q.item} exceed the second in length?`);
    happening = money ? "Two prices are given." : "Two lengths are given.";
    known = [{ label: money ? "price of the pen" : "first length", value: A }, { label: money ? "price of the notebook" : "second length", value: B }];
    unknown = op === "add" ? "the total" : "the difference";
    rel = op === "add" ? "part + part = whole" : "bigger - smaller = difference";
    reasonable = op === "add" ? "The total is more than either amount." : "The difference is less than the bigger amount.";
  } else if (op === "mul") {
    stem = money ? T3(`One ${item} costs ${A}. ${N} buys ${y.i} ${item}s.`, `One ${item} costs ${A}. ${N} buys ${y.i} of them.`, `${N} buys ${y.i} ${item}s that each cost ${A}.`) : T3(`${N} cuts ${y.i} pieces. Each piece is ${lenT(x)} long.`, `${N} cuts ${y.i} pieces, and each piece is ${lenT(x)} long.`, `${N} cuts ${y.i} equal pieces, each ${lenT(x)} long.`);
    ask = money ? T3(`How much do they cost?`, `What is the total cost?`, `What is the total cost of the ${item}s?`) : T3("How long are the pieces in all?", "What is the total length of the pieces?", "What is the combined length of the pieces?");
    happening = money ? "Equal-priced items are bought." : "Equal pieces are cut.";
    known = [{ label: money ? "price of one" : "length of one piece", value: A }, { label: "how many", value: y.i }];
    unknown = money ? "the total cost" : "the total length";
    rel = "size of each group x number of groups = total";
    reasonable = "The total is more than the amount for one.";
  } else if (divByDecimal) {
    stem = money ? T3(`${N} has ${A}. Each ${item} costs ${B}.`, `${N} has ${A}, and each ${item} costs ${B}.`, `${N} has ${A} to spend. Each ${item} costs ${B}.`) : T3(`${N} has ${lenT(x)} of ${Q.item}. Each piece needs ${lenT(y)}.`, `${N} has ${lenT(x)} of ${Q.item}, and each piece needs ${lenT(y)}.`, `${N} has ${lenT(x)} of ${Q.item} and cuts pieces that are each ${lenT(y)}.`);
    ask = money ? T3(`How many ${item}s can ${N} buy?`, `How many ${item}s can ${N} buy?`, `How many ${item}s can ${N} buy?`) : T3("How many pieces can N make?".replace("N", N), `How many pieces can ${N} make?`, `How many pieces can ${N} cut?`);
    happening = money ? "A budget is spent on equal-priced items." : "A length is cut into equal pieces.";
    known = [{ label: money ? "money" : "total length", value: A }, { label: money ? "price of one" : "length of each piece", value: B }];
    unknown = "how many";
    rel = "total / amount for each = number of groups";
    reasonable = "Each piece is shorter than the whole length, so there are several pieces.";
    unit = "";
  } else {
    stem = money ? T3(`${N} pays ${A} for ${y.i} ${item}s. The ${item}s cost the same.`, `${N} pays ${A} for ${y.i} ${item}s that cost the same.`, `${N} pays ${A} for ${y.i} identical ${item}s.`) : T3(`${N} cuts a ${Q.item} that is ${lenT(x)} long into ${y.i} equal pieces.`, `${N} cuts a ${Q.item} that is ${lenT(x)} long into ${y.i} equal pieces.`, `${N} cuts a ${Q.item} that is ${lenT(x)} long into ${y.i} pieces of equal length.`);
    ask = money ? T3(`How much does one ${item} cost?`, `How much does one ${item} cost?`, `What is the cost of one ${item}?`) : T3("How long is each piece?", "How long is each piece?", "What is the length of each piece?");
    happening = money ? "A price is shared across equal items." : "A length is cut into equal pieces.";
    known = [{ label: money ? "total cost" : "total length", value: A }, { label: "number of equal parts", value: y.i }];
    unknown = money ? "the cost of one" : "the length of each piece";
    rel = "total / number of groups = size of each group";
    reasonable = "Each part is less than the total.";
  }
  return { stem, ask, money, unit: money ? undefined : unit === "" ? undefined : Q.many, structure: STRUCT(happening, known, unknown, rel, "tape diagram", reasonable) };
}
function dcOp(rng, lv, P, ctx) {
  const op = rng.pick(lv === 1 ? ["add", "sub", "mul", "div"] : ["add", "sub", "mul", "div", "mul", "div"]);
  const story = lv >= 2 && rng.chance(0.4);
  let x;
  let y;
  let res;
  let cands;
  let hints;
  let divByDecimal = false;
  const SH = (i, p, tag) => decCand(i, p, tag, false);
  if (op === "add" || op === "sub") {
    const [p1, p2] = lv === 1 ? (rng.chance(0.5) ? [1, 1] : [2, 2]) : lv === 2 ? rng.pick([[1, 2], [2, 1], [2, 2], [1, 1]]) : rng.pick([[2, 3], [3, 3], [1, 3], [3, 2], [2, 2]]);
    const pp1 = Math.min(P, p1);
    const pp2 = Math.min(P, p2);
    x = rdec(rng, pp1, op === "sub" ? 5 : 1, 60);
    y = rdec(rng, pp2, 1, op === "sub" ? 4 : 60);
    if (op === "sub" && lv === 3 && rng.chance(0.4)) x = { i: rng.int(3, 9), p: 0 };
    const [a, b, p] = align(x, y);
    if (op === "sub" && a <= b) return null;
    res = { i: op === "add" ? a + b : a - b, p };
    const unaligned = op === "add" ? x.i + y.i : Math.abs(x.i - y.i);
    cands = [SH(unaligned, Math.max(x.p, y.p), op === "add" ? "added-without-lining-up-the-decimal-points" : "subtracted-without-lining-up-the-decimal-points"), SH(res.i, res.p + 1, "moved-the-decimal-point-left"), SH(res.i * 10, res.p, "moved-the-decimal-point-right"), SH(op === "add" ? Math.abs(a - b) : a + b, p, op === "add" ? "subtracted-instead-of-added" : "added-instead-of-subtracted"), SH(res.i + 10 ** p, p, "regrouping-slip"), SH(res.i + 1, p, "off-by-one-in-the-last-place")];
    hints = DCH.add;
  } else if (op === "mul") {
    const kind = lv === 1 ? "whole" : lv === 2 ? rng.pick(["whole", "tt", "tt"]) : rng.pick(["tt", "ht", "ht", "whole"]);
    if (kind === "whole") {
      x = rdec(rng, Math.min(P, rng.int(1, 2)), 1, 9);
      y = { i: rng.int(2, 9), p: 0 };
    } else if (kind === "tt") {
      x = { i: rng.int(2, 9), p: 1 };
      y = { i: rng.int(2, 9), p: 1 };
    } else {
      x = rdec(rng, 2, 0, 4);
      y = { i: rng.int(2, 9), p: 1 };
    }
    res = { i: x.i * y.i, p: x.p + y.p };
    cands = [SH(res.i, Math.max(x.p, y.p), "put-the-decimal-point-in-the-wrong-place"), SH(res.i, res.p + 1, "one-decimal-place-too-many"), res.p > 0 ? SH(res.i, res.p - 1, "one-decimal-place-too-few") : null, SH(...(([a, b, p]) => [a + b, p, "added-instead-of-multiplied"])(align(x, y))), SH(res.i * 10, res.p, "moved-the-decimal-point-right")];
    hints = DCH.mul;
  } else {
    const kind = lv === 1 ? "decwhole" : lv === 2 ? rng.pick(["decwhole", "decdec", "wholedec"]) : rng.pick(["decdec", "decdec", "decdec2", "wholedec"]);
    if (kind === "decwhole") {
      const q = rdec(rng, rng.int(1, 2), 1, 9);
      const w = rng.int(2, 9);
      x = { i: q.i * w, p: q.p };
      y = { i: w, p: 0 };
      res = q;
    } else if (kind === "decdec") {
      const yi = rng.int(2, 9);
      const q = rng.int(2, 30);
      x = { i: q * yi, p: 1 };
      y = { i: yi, p: 1 };
      res = { i: q, p: 0 };
      divByDecimal = true;
    } else if (kind === "wholedec") {
      const [yv, yp, mult] = rng.pick([[5, 1, 2], [2, 1, 5], [25, 2, 4], [1, 1, 10]]);
      const xw = rng.int(2, 12);
      x = { i: xw, p: 0 };
      y = { i: yv, p: yp };
      res = { i: xw * mult, p: 0 };
      divByDecimal = true;
    } else {
      const yi = rng.int(2, 9);
      const q = rng.int(2, 40);
      x = { i: q * yi, p: 2 };
      y = { i: yi, p: 2 };
      res = { i: q, p: 0 };
      divByDecimal = true;
    }
    const [qa, qb, qp] = align(x, y);
    cands = [SH(res.i * 10, res.p, "moved-the-decimal-point-the-wrong-way"), SH(res.i, res.p + 1, "moved-the-decimal-point-the-wrong-way"), SH(res.i + 1, res.p, "off-by-one"), SH(res.i * 100, res.p, "moved-the-decimal-point-two-places"), qa > qb ? SH(qa - qb, qp, "subtracted-instead-of-divided") : null];
    hints = DCH.div;
  }
  const sym = { add: "+", sub: MINUS, mul: TIMES, div: DIVIDE }[op];
  const xs = dstr(x.i, x.p);
  const ys = dstr(y.i, y.p);
  const storyOK = op === "add" || op === "sub" || (op === "mul" && y.p === 0) || (op === "div" && (y.p === 0 || divByDecimal));
  const S = story && storyOK ? dcStory(rng, ctx, op, x, y, divByDecimal) : null;
  if (S && S.money && !divByDecimal) {
    if (res.p > 2) return null;
  }
  const money = !!(S && S.money) && !divByDecimal;
  const ans = decAnswer(res.i, res.p, money);
  if (money && ans.kind === "int") ans.kind = "dec";
  const dists = mkD(res.i / 10 ** res.p, ans.text, cands.filter(Boolean).map(([v, t, text]) => [v, t, money ? `$${dstr(Math.round(v * 100), 2)}` : text]), (z) => String(z));
  const verbs = { add: T3("Add.", "Find the sum.", "Calculate the sum."), sub: T3("Subtract.", "Find the difference.", "Calculate the difference."), mul: T3("Multiply.", "Find the product.", "Calculate the product."), div: T3("Divide.", "Find the quotient.", "Calculate the quotient.") };
  const aW = (() => {
    if (op === "add" || op === "sub") {
      const [a, b, p] = align(x, y);
      return [`Line up the decimal points: ${dstr(a, p)} ${sym} ${dstr(b, p)}`, `${dstr(a, p)} ${sym} ${dstr(b, p)} = ${dstr(res.i, p)}`];
    }
    if (op === "mul") return [`Multiply as whole numbers: ${x.i} ${TIMES} ${y.i} = ${res.i}`, `Together the factors have ${x.p + y.p} decimal place${x.p + y.p === 1 ? "" : "s"}, so the product is ${dstr(res.i, res.p)}`];
    if (y.p === 0) return [`Divide as with whole numbers and keep the decimal point in the same place: ${xs} ${DIVIDE} ${ys} = ${ans.value}`];
    const X = x.i * 10 ** (y.p - x.p);
    return [`Multiply both numbers by ${num(10 ** y.p)} so the divisor is a whole number: ${xs} ${DIVIDE} ${ys} becomes ${X} ${DIVIDE} ${y.i}`, `${X} ${DIVIDE} ${y.i} = ${ans.value}`];
  })();
  return finalize({
    family: "decimals",
    spec: { type: "op", op, x: xs, y: ys },
    stem: S ? S.stem : S3(`${xs} ${sym} ${ys}`),
    ask: S ? S.ask : verbs[op],
    expr: `${xs} ${sym} ${ys}`,
    answer: S && S.unit && !(op === "div" && divByDecimal) ? { ...ans, unit: S.unit } : ans,
    work: aW,
    visual: null,
    distractors: dists,
    hints,
    structure: S ? S.structure : undefined,
    level: lv,
  });
}
function genDecimals(rng, p, o) {
  const P = Math.max(2, Math.min(3, p.places | 0 || 2));
  const lv = o.level;
  const ops = !!p.ops;
  const r = rng.next();
  const pick = (...fns) => until(() => fns[Math.min(fns.length - 1, Math.floor(r * fns.length))]());
  if (lv === 1) return pick(() => dcPlaceName(rng, 1, P), () => dcPlaceValue(rng, 1, P), () => dcCompare(rng, 1, P), () => dcFracDec(rng, 1, P), () => dcFracSum(rng, 1), ...(ops ? [() => dcOp(rng, 1, P, o.ctx)] : []), ...(P >= 3 ? [() => dcRound(rng, 1)] : []));
  if (lv === 2) return pick(() => dcCompare(rng, 2, P), () => dcPlaceValue(rng, 2, P), () => dcFracDec(rng, 2, P), ...(P >= 3 ? [() => dcRound(rng, 2), () => dcScale10(rng, 2)] : [() => dcFracSum(rng, 2)]), ...(ops ? [() => dcOp(rng, 2, P, o.ctx), () => dcOp(rng, 2, P, o.ctx), () => dcOp(rng, 2, P, o.ctx)] : []));
  return pick(...(ops ? [() => dcOp(rng, 3, P, o.ctx), () => dcOp(rng, 3, P, o.ctx), () => dcOp(rng, 3, P, o.ctx), () => dcOp(rng, 3, P, o.ctx)] : []), ...(P >= 3 ? [() => dcRound(rng, 3), () => dcCompare(rng, 3, P), () => dcScale10(rng, 3)] : [() => dcCompare(rng, 3, P), () => dcFracDec(rng, 3, P), () => dcPlaceValue(rng, 3, P)]));
}
function checkDecimals(p, params) {
  const P = Math.max(2, Math.min(3, (params && params.places) | 0 || 2));
  const s = p.spec;
  const places = (str) => (String(str).split(".")[1] || "").length;
  const vals = s.type === "cmp" ? s.vals : s.type === "op" ? [s.x, s.y] : s.x != null ? [s.x] : [];
  if (vals.some((v) => places(v) > P)) return `an operand has more than ${P} decimal places`;
  if (s.type === "op" && !(params && params.ops)) return "operations asked of a skill without ops:true";
  if (s.type === "round" && P < 3) return "rounding asked of a two-place skill";
  if ((s.type === "f2d" || s.type === "d2f") && Math.log10(s.d) > P) return "denominator beyond the skill's places";
  return null;
}

// ---------------------------------------------------------------------------------------------------- convert
const CVP = [
  { big: "km", small: "m", f: 1000, sys: "metric" },
  { big: "m", small: "cm", f: 100, sys: "metric" },
  { big: "cm", small: "mm", f: 10, sys: "metric" },
  { big: "m", small: "mm", f: 1000, sys: "metric", hard: true },
  { big: "kg", small: "g", f: 1000, sys: "metric" },
  { big: "L", small: "mL", f: 1000, sys: "metric" },
  { big: "ft", small: "in", f: 12, sys: "customary" },
  { big: "yd", small: "ft", f: 3, sys: "customary" },
  { big: "yd", small: "in", f: 36, sys: "customary", hard: true },
  { big: "lb", small: "oz", f: 16, sys: "customary" },
  { big: "gal", small: "qt", f: 4, sys: "customary" },
  { big: "qt", small: "pt", f: 2, sys: "customary" },
  { big: "pt", small: "c", f: 2, sys: "customary" },
  { big: "gal", small: "pt", f: 8, sys: "customary", hard: true },
  { big: "gal", small: "c", f: 16, sys: "customary", hard: true },
  { big: "qt", small: "c", f: 4, sys: "customary", hard: true },
  { big: "hr", small: "min", f: 60, sys: "time" },
  { big: "min", small: "s", f: 60, sys: "time" },
  { big: "hr", small: "s", f: 3600, sys: "time", hard: true },
];
const UNAME = { km: ["kilometer", "kilometers"], m: ["meter", "meters"], cm: ["centimeter", "centimeters"], mm: ["millimeter", "millimeters"], kg: ["kilogram", "kilograms"], g: ["gram", "grams"], L: ["liter", "liters"], mL: ["milliliter", "milliliters"], ft: ["foot", "feet"], in: ["inch", "inches"], yd: ["yard", "yards"], lb: ["pound", "pounds"], oz: ["ounce", "ounces"], gal: ["gallon", "gallons"], qt: ["quart", "quarts"], pt: ["pint", "pints"], c: ["cup", "cups"], hr: ["hour", "hours"], min: ["minute", "minutes"], s: ["second", "seconds"] };
const uText = (u, isOne) => UNAME[u][isOne ? 0 : 1];
const CVTHING = {
  length: { store: "roll of ribbon", garden: "garden hose", sports: "running track", kitchen: "roll of foil", pets: "leash", library: "bookshelf", crafts: "piece of string", travel: "bike path", science: "wire", community: "fence" },
  mass: { store: "bag of rice", garden: "bag of soil", sports: "bag of sand", kitchen: "bag of flour", pets: "bag of dog food", library: "box of books", crafts: "block of clay", travel: "suitcase", science: "rock sample", community: "bag of apples" },
  cap: { store: "bottle of juice", garden: "watering can", sports: "water jug", kitchen: "pitcher of milk", pets: "water bowl", library: "bottle of ink", crafts: "bottle of paint", travel: "fuel tank", science: "beaker of water", community: "bucket of paint" },
};
const CVKIND = { km: "length", m: "length", cm: "length", mm: "length", ft: "length", yd: "length", in: "length", kg: "mass", g: "mass", lb: "mass", oz: "mass", L: "cap", mL: "cap", gal: "cap", qt: "cap", pt: "cap", c: "cap" };
const CVTIME = { store: "A shift at the store", garden: "A watering session", sports: "A practice", kitchen: "A baking time", pets: "A dog walk", library: "A reading time", crafts: "A craft project", travel: "A bus ride", science: "An experiment", community: "A park clean-up" };
/** Terminating decimal string of a Fr, or null. */
function frDec(f) {
  let d = f.d;
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  if (d !== 1) return null;
  if (f.d === 1) return String(f.n);
  let p = 0;
  while (10 ** p % f.d !== 0 && p < 8) p++;
  return dstr((f.n * 10 ** p) / f.d, p);
}
const cvAns = (f) => {
  const s = frDec(f);
  if (s == null) return null;
  return f.d === 1 ? { value: s, text: withCommas(s), kind: "int" } : { value: s, text: withCommas(s), kind: "dec" };
};
function cvPickValue(rng, lv, f, dec, cap = 60) {
  // the big-unit value as a Fr whose small-unit count is a whole number
  const hi = Math.min(cap, lv === 1 ? 9 : lv === 2 ? 20 : 60);
  if (!dec || rng.chance(lv === 1 ? 0.4 : 0.25)) return new Fr(rng.int(2, hi), 1);
  for (let t = 0; t < 80; t++) {
    const hund = rng.int(5, hi * 100);
    if (hund % 100 === 0) continue;
    if ((hund * f) % 100 === 0) return new Fr(hund, 100);
  }
  return new Fr(rng.int(2, hi), 1);
}
const WRONGF = { 1000: 100, 100: 1000, 10: 100, 12: 10, 3: 10, 16: 10, 4: 10, 2: 10, 60: 100, 3600: 1000, 36: 10, 8: 10 };
function cvBuild(rng, p, o) {
  const lv = o.level;
  const dec = !!p.decimals;
  const sysP = p.system || "mixed";
  const all = CVP.filter((c) => (sysP === "mixed" ? true : c.sys === sysP || c.sys === "time"));
  const easy = all.filter((c) => !c.hard && (lv > 1 || ["km", "m", "kg", "L", "ft", "hr", "yd"].includes(c.big)));
  const pair = rng.pick(lv === 3 ? all : easy.length ? easy : all);
  const f = pair.f;
  const bigName = (one) => uText(pair.big, one);
  const smallName = (one) => uText(pair.small, one);
  if (lv === 3 && !dec && rng.chance(0.2)) {
    const a = rng.int(2, 9);
    const b = rng.int(1, Math.min(f - 1, 59));
    const ans = a * f + b;
    return finalize({
      family: "convert",
      spec: { type: "mixed", big: pair.big, small: pair.small, a, b },
      stem: T3(`A measure is ${a} ${bigName(false)} ${b} ${smallName(b === 1)}.`, `A measure is ${a} ${bigName(false)} ${b} ${smallName(b === 1)}.`, `A measure is given as ${a} ${bigName(false)} and ${b} ${smallName(b === 1)}.`),
      ask: T3(`How many ${smallName(false)} is that in all?`, `Write the measure in ${smallName(false)} only.`, `Express the whole measure in ${smallName(false)}.`),
      expr: null,
      answer: { ...ansInt(ans), unit: smallName(false) },
      work: [`Change the larger unit: ${a} ${bigName(false)} is ${a} ${TIMES} ${f} = ${a * f} ${smallName(false)}.`, `Add the extra ${smallName(false)}: ${a * f} + ${b} = ${ans}`],
      visual: null,
      distractors: mkD(ans, num(ans), [[a + b, "added-the-numbers-without-converting"], [a * f, "left-out-the-extra-units"], [a * b, "multiplied-the-two-numbers"], [a * (f + b), "converted-the-extra-units-too"], ...nearInts(ans)], fmtInt),
      hints: { conceptual: "A mixed measure has a larger unit and a smaller unit. Write the whole measure in the smaller unit by converting only the larger part.", procedural: "Convert the larger unit to the smaller unit, then add the smaller units that were left over." },
      level: lv,
    });
  }
  const up = rng.chance(lv === 1 ? 0.3 : 0.5);
  const isTable = lv >= 2 && rng.chance(0.25);
  const V = isTable ? new Fr(rng.int(2, 12), 1) : cvPickValue(rng, lv, f, dec, pair.big === "hr" ? 12 : pair.big === "km" ? 30 : 60);
  const Sm = V.mul(new Fr(f, 1));
  const given = up ? Sm : V;
  const res = up ? V : Sm;
  const unitFrom = up ? pair.small : pair.big;
  const unitTo = up ? pair.big : pair.small;
  const givenText = frDec(given);
  const ansO = cvAns(res);
  if (!ansO || givenText == null) return null;
  if (!dec && ansO.kind !== "int") return null;
  const wf = WRONGF[f] ?? 10;
  const mulK = (g, k) => new Fr(g.n * k, g.d);
  const divK = (g, k) => new Fr(g.n, g.d * k);
  const cands = [];
  const push = (v, tag) => {
    const t = frDec(v);
    if (t != null) cands.push([v.value, tag, withCommas(t)]);
  };
  const fTen = f % 10 === 0 ? f / 10 : null;
  if (!up) {
    push(divK(given, f), "divided-instead-of-multiplied");
    push(mulK(given, f * 10), "added-an-extra-zero");
    if (fTen) push(mulK(given, fTen), "left-out-a-zero");
    push(given.add(new Fr(f, 1)), "added-the-conversion-number");
    push(mulK(given, wf), "used-the-wrong-conversion-number");
  } else {
    push(mulK(given, f), "multiplied-instead-of-divided");
    push(divK(given, f * 10), "divided-by-too-large-a-power-of-ten");
    if (fTen) push(divK(given, fTen), "divided-by-too-small-a-power-of-ten");
    push(given.sub(new Fr(f, 1)).n > 0 ? given.sub(new Fr(f, 1)) : given.add(new Fr(f, 1)), "subtracted-the-conversion-number");
    push(divK(given, wf), "used-the-wrong-conversion-number");
  }
  push(res.add(new Fr(1, 1)), "off-by-one");
  push(res.mul(new Fr(10, 1)), "added-an-extra-zero");
  const answer = { ...ansO, unit: smallOrBig(unitTo) };
  function smallOrBig(u) {
    return uText(u, false);
  }
  const gOne = given.d === 1 && given.n === 1;
  const gShow = withCommas(givenText);
  const spec = { type: "conv", from: unitFrom, to: unitTo, x: givenText };
  const hints = { conceptual: "A larger unit is made of many smaller units. A measure in the smaller unit has a bigger number, and a measure in the larger unit has a smaller number.", procedural: `Find how many ${smallName(false)} make 1 ${bigName(true)}. Multiply to change to the smaller unit and divide to change to the larger unit.` };
  const distractors = mkD(res, ansO.text, [...cands, ...nearInts(Number(ansO.value)).map(([v, t]) => [v, t, withCommas(String(Number(v.toFixed(6))))])], (z) => String(z));
  if (isTable) {
    const others = rng.sample([2, 3, 4, 5, 6, 8, 10, 12].filter((v) => v !== V.n), 3);
    const xs = others.concat([V.n]).sort((a, b) => a - b);
    const hideIdx = xs.indexOf(V.n);
    const cell = (fr) => withCommas(frDec(fr));
    const rows = xs.map((x, i) => {
      const bigV = new Fr(x, 1);
      const smallV = bigV.mul(new Fr(f, 1));
      const [a, b] = up ? [smallV, bigV] : [bigV, smallV];
      return [cell(a), i === hideIdx ? "?" : cell(b)];
    });
    const hdrs = up ? [smallName(false), bigName(false)] : [bigName(false), smallName(false)];
    return finalize({
      family: "convert",
      spec: { ...spec, table: rows },
      stem: T3("Look at the table of equal measures.", "Use the table of equal measures.", "Use the pattern in the table of equal measures."),
      ask: T3("What number goes in the empty box?", "What number goes in the empty box?", "What number belongs in the empty box?"),
      expr: null,
      answer,
      work: [`Find the conversion number from a row with no empty box: 1 ${bigName(true)} is ${f} ${smallName(false)}.`, up ? `The ${smallName(false)} column is ${f} times the ${bigName(false)} column, so divide: ${givenText} ${DIVIDE} ${f} = ${ansO.value}` : `The ${smallName(false)} column is ${f} times the ${bigName(false)} column, so multiply: ${givenText} ${TIMES} ${f} = ${ansO.value}`],
      visual: { kind: "table", alt: `A table converting ${hdrs[0]} to ${hdrs[1]}. One box is empty.`, headers: hdrs.map(cap), rows, caption: "Equal measures" },
      distractors,
      hints: { conceptual: "The two columns of a table of equal measures follow one rule: multiply or divide every row by the same conversion number.", procedural: "Find the conversion number from a complete row. Then use it on the row with the empty box." },
      level: lv,
    });
  }
  const objKind = CVKIND[pair.big];
  const useStory = rng.chance(lv >= 2 ? 0.5 : 0.3);
  const [N] = rng.sample(NAMES, 1);
  let stem;
  let ask;
  if (useStory) {
    const bigUnit = pair.big;
    const pickThing = (kind) => {
      if (bigUnit === "km") return rng.pick(["bike path", "hiking trail", "road", "canal"]);
      if (bigUnit === "gal" || bigUnit === "qt") return rng.pick(["bucket", "fish tank", "water cooler", "watering can"]);
      return CVTHING[kind][o.ctx] || CVTHING[kind].store;
    };
    if (objKind === undefined) {
      const lead = CVTIME[o.ctx] || CVTIME.store;
      stem = T3(`${lead} takes ${gShow} ${uText(unitFrom, gOne)}.`, `${lead} takes ${gShow} ${uText(unitFrom, gOne)}.`, `${lead} lasts ${gShow} ${uText(unitFrom, gOne)}.`);
    } else {
      const thing = pickThing(objKind);
      const verb = objKind === "length" ? "is" : objKind === "mass" ? "has a mass of" : "holds";
      const tail = objKind === "length" ? " long" : "";
      stem = T3(`A ${thing} ${verb} ${gShow} ${uText(unitFrom, gOne)}${tail}.`, `A ${thing} ${verb} ${gShow} ${uText(unitFrom, gOne)}${tail}.`, `${N} measures a ${thing} that ${verb} ${gShow} ${uText(unitFrom, gOne)}${tail}.`);
    }
    ask = T3(`How many ${uText(unitTo, false)} is that?`, `How many ${uText(unitTo, false)} is that?`, `Express this measure in ${uText(unitTo, false)}.`);
  } else {
    stem = S3(`${gShow} ${uText(unitFrom, gOne)}`);
    ask = T3(`Write it in ${uText(unitTo, false)}.`, `How many ${uText(unitTo, false)} is that?`, `Convert the measure to ${uText(unitTo, false)}.`);
  }
  return finalize({
    family: "convert",
    spec,
    stem,
    ask,
    expr: `${givenText} ${unitFrom} = ? ${unitTo}`,
    answer,
    work: up ? [`${f} ${smallName(false)} make 1 ${bigName(true)}, so divide: ${givenText} ${DIVIDE} ${f} = ${ansO.value}`] : [`1 ${bigName(true)} is ${f} ${smallName(false)}, so multiply: ${givenText} ${TIMES} ${f} = ${ansO.value}`],
    visual: null,
    distractors,
    hints,
    level: lv,
  });
}
const genConvert = (rng, p, o) => until(() => cvBuild(rng, p, o), 200);
function checkConvert(p, params) {
  const s = p.spec;
  if (!(params && params.decimals) && p.answer.kind === "dec") return "a non-integer result from a skill without decimals:true";
  const sys = params && params.system;
  if (sys && sys !== "mixed") {
    const SYS = { km: "metric", m: "metric", cm: "metric", mm: "metric", kg: "metric", g: "metric", L: "metric", mL: "metric", ft: "customary", in: "customary", yd: "customary", lb: "customary", oz: "customary", gal: "customary", qt: "customary", pt: "customary", c: "customary", hr: "time", min: "time", s: "time" };
    const u = s.from || s.big;
    if (SYS[u] !== sys && SYS[u] !== "time") return `unit ${u} is outside the ${sys} system`;
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------- angles
const ANGH = {
  classify: { conceptual: "Angles are sorted by comparing them with a square corner, which is 90 degrees, and with a flat line, which is 180 degrees: less than the corner, exactly the corner, between the corner and the flat line, or exactly the flat line.", procedural: "Compare the angle with the square corner first. Then compare it with the flat line." },
  measure: { conceptual: "A protractor measures an angle in degrees. Line one ray up with zero and read where the other ray crosses the scale that starts at that zero.", procedural: "Find the scale that starts at zero on the first ray. Read the number where the second ray crosses it. Check that it is reasonable: is the angle acute or obtuse?" },
  line: { conceptual: "Angles that make a straight line together add up to a straight angle, which is 180 degrees.", procedural: "Subtract the angle you know from the measure of a straight angle." },
  around: { conceptual: "The angles around one point make a full turn, which is 360 degrees, so they add up to a full circle.", procedural: "Add the angles you know, then subtract the total from the measure of a full turn." },
  adjacentWhole: { conceptual: "When a ray splits an angle into two parts, the measures of the parts add up to the measure of the whole angle.", procedural: "Add the measures of the two smaller angles." },
  adjacentPart: { conceptual: "When a ray splits an angle into two parts, the two parts add up to the whole angle, so a missing part is a missing addend.", procedural: "Subtract the part you know from the whole angle." },
  circ: { conceptual: "A full circle is 360 degrees. A fraction of a circle is the same fraction of 360 degrees.", procedural: "Divide 360 by the denominator to find one part, then multiply by the numerator." },
};
const KIND_OF = (d) => (d < 90 ? "acute" : d === 90 ? "right" : d < 180 ? "obtuse" : "straight");
function anClassify(rng, lv) {
  const kind = rng.pick(lv === 1 ? ["acute", "acute", "obtuse", "obtuse", "right", "straight"] : ["acute", "obtuse", "right", "straight", "acute", "obtuse"]);
  const deg = kind === "acute" ? (lv === 3 ? rng.int(8, 88) : 5 * rng.int(2, 17)) : kind === "obtuse" ? (lv === 3 ? rng.int(92, 178) : 5 * rng.int(19, 35)) : kind === "right" ? 90 : 180;
  const tag = (right, wrong) => {
    if (right === "acute") return wrong === "right" ? (deg >= 80 ? "near-90-called-right" : "confused-acute-with-right") : wrong === "obtuse" ? "confused-acute-with-obtuse" : "confused-acute-with-straight";
    if (right === "obtuse") return wrong === "acute" ? "confused-obtuse-with-acute" : wrong === "right" ? (deg <= 100 ? "near-90-called-right" : "confused-obtuse-with-right") : deg >= 170 ? "near-180-called-straight" : "confused-obtuse-with-straight";
    if (right === "right") return wrong === "acute" ? "thought-90-is-acute" : wrong === "obtuse" ? "thought-90-is-obtuse" : "confused-right-with-straight";
    return wrong === "obtuse" ? "called-a-straight-angle-obtuse" : wrong === "acute" ? "confused-straight-with-acute" : "confused-straight-with-right";
  };
  const cands = ["acute", "right", "obtuse", "straight"].filter((k) => k !== kind).map((k) => [k, tag(kind, k)]);
  return finalize({
    family: "angles",
    spec: { type: "classify", deg },
    stem: S3(`An angle measures ${deg}°.`),
    ask: T3("What kind of angle is it?", "Is the angle acute, right, obtuse, or straight?", "Classify the angle as acute, right, obtuse, or straight."),
    expr: null,
    answer: { value: kind, text: kind, kind: "text" },
    work: [kind === "acute" ? `${deg}° is less than 90°, so the angle is acute.` : kind === "right" ? `${deg}° is exactly 90°, so the angle is a right angle.` : kind === "obtuse" ? `${deg}° is more than 90° and less than 180°, so the angle is obtuse.` : `${deg}° makes a straight line, so the angle is a straight angle.`],
    visual: lv === 1 ? { kind: "angle", alt: "An angle drawn with two rays that meet at a point.", deg, label: "P", protractor: false } : null,
    distractors: mkT(kind, cands),
    hints: ANGH.classify,
    level: lv,
  });
}
function anMeasure(rng, lv) {
  const deg = 5 * rng.int(2, 34);
  const cands = [[180 - deg, "read-the-wrong-scale"], [deg + 10, "misread-by-two-marks"], [deg - 10, "misread-by-two-marks"], [deg === 90 ? null : Math.abs(90 - deg), "gave-the-distance-from-90"], [deg + 5, "misread-by-one-mark"]];
  return finalize({
    family: "angles",
    spec: { type: "measure", deg },
    stem: T3("Use the protractor picture.", "Use the protractor in the picture.", "Read the measure from the protractor in the picture."),
    ask: T3("What is the measure of the angle in degrees?", "What is the measure of the angle in degrees?", "What is the measure of the angle, in degrees?"),
    expr: null,
    answer: { ...ansInt(deg), unit: "degrees" },
    work: [`One ray lines up with zero. The other ray crosses the same scale at ${deg}.`, `The angle is ${deg}°, which is ${KIND_OF(deg)}, so the reading is reasonable.`],
    visual: { kind: "angle", alt: "A protractor with an angle drawn from its center point.", deg, label: "P", protractor: true },
    distractors: mkD(deg, num(deg), [...cands, ...nearInts(deg)], fmtInt),
    hints: ANGH.measure,
    level: lv,
  });
}
function anLine(rng, lv) {
  const a = lv === 3 ? rng.int(12, 168) : 5 * rng.int(3, 33);
  if (a === 90) return null;
  const ans = 180 - a;
  return finalize({
    family: "angles",
    spec: { type: "line", a },
    stem: T3(`Two angles are next to each other on a straight line. One angle is ${a}°.`, `Two angles are next to each other on a straight line. One of them measures ${a}°.`, `Two adjacent angles together form a straight line. One angle measures ${a}°.`),
    ask: T3("What is the other angle?", "What is the measure of the other angle?", "What is the measure of the other angle, in degrees?"),
    expr: `${a} + ? = 180`,
    answer: { ...ansInt(ans), unit: "degrees" },
    work: [`A straight line is 180°, so the two angles add up to 180°.`, `${a} + ${ans} = 180, so the other angle is ${ans}°.`],
    visual: null,
    distractors: mkD(ans, num(ans), [[Math.abs(90 - a), "used-90-instead-of-180"], [360 - a, "used-360-instead-of-180"], [a, "repeated-the-given-angle"], [180 + a, "added-instead-of-subtracted"], [ans + 10, "regrouping-slip"], [ans - 10, "regrouping-slip"]], fmtInt),
    hints: ANGH.line,
    level: lv,
  });
}
function anAround(rng, lv) {
  const n = lv === 2 ? 2 : 3;
  const draw = () => (lv === 3 ? rng.int(25, 130) : 5 * rng.int(6, 26));
  const known = Array.from({ length: n }, draw);
  const sum = known.reduce((t, v) => t + v, 0);
  const ans = 360 - sum;
  if (ans < 20) return null;
  const list = n === 2 ? `${known[0]}° and ${known[1]}°` : `${known[0]}°, ${known[1]}° and ${known[2]}°`;
  return finalize({
    family: "angles",
    spec: { type: "around", known },
    stem: T3(`Angles meet at one point and fill the whole turn. The known angles are ${list}.`, `Angles meet at one point and fill the whole turn around it. The known angles measure ${list}.`, `Several angles meet at one point and together fill the whole turn. The angles ${list} are known.`),
    ask: T3("What is the last angle?", "What is the measure of the last angle?", "What is the measure of the remaining angle, in degrees?"),
    expr: null,
    answer: { ...ansInt(ans), unit: "degrees" },
    work: [`A full turn is 360°. Add the known angles: ${known.slice(0, -1).reduce((t, v) => t + v, 0)} + ${known[n - 1]} = ${sum}`, `Subtract from 360: 360 ${MINUS} ${sum} = ${ans}`],
    visual: null,
    distractors: mkD(ans, num(ans), [[180 - sum > 0 ? 180 - sum : null, "used-180-instead-of-360"], [sum, "gave-the-total-of-the-known-angles"], [ans + 10, "regrouping-slip"], [ans - 10, "regrouping-slip"], [360 + sum, "added-instead-of-subtracted"]], fmtInt),
    hints: ANGH.around,
    level: lv,
  });
}
function anAdjacent(rng, lv, forced) {
  const find = forced || (lv === 1 ? "whole" : rng.pick(["part", "part", "whole"]));
  const step = lv === 3 ? 1 : 5;
  const whole = step * rng.int(lv === 3 ? 40 : 8, lv === 3 ? 170 : 34);
  const p1 = step * rng.int(Math.ceil(10 / step), Math.floor((whole - 10) / step));
  const p2 = whole - p1;
  if (p1 < 10 || p2 < 10) return null;
  const ans = find === "whole" ? whole : p2;
  const stem = find === "whole" ? T3(`Ray BD splits angle ABC into two angles. Angle ABD is ${p1}°. Angle DBC is ${p2}°.`, `Ray BD splits angle ABC into two smaller angles. Angle ABD measures ${p1}° and angle DBC measures ${p2}°.`, `Ray BD divides angle ABC into angle ABD, which measures ${p1}°, and angle DBC, which measures ${p2}°.`) : T3(`Angle ABC is ${whole}°. Ray BD splits it into two angles. Angle ABD is ${p1}°.`, `Angle ABC measures ${whole}°. Ray BD splits it into two smaller angles, and angle ABD measures ${p1}°.`, `Angle ABC measures ${whole}°. Ray BD divides it into two angles, and angle ABD measures ${p1}°.`);
  const ask = find === "whole" ? T3("What is the measure of angle ABC?", "What is the measure of angle ABC?", "What is the measure of angle ABC, in degrees?") : T3("What is the measure of angle DBC?", "What is the measure of angle DBC?", "What is the measure of angle DBC, in degrees?");
  const cands = find === "whole" ? [[Math.abs(p1 - p2), "subtracted-instead-of-added"], [180 - ans > 0 ? 180 - (p1 + p2) : null, "used-180-instead-of-adding"], [p1, "gave-one-of-the-parts"], [ans + 10, "regrouping-slip"], [ans - 10, "regrouping-slip"]] : [[whole + p1, "added-instead-of-subtracted"], [p1, "gave-the-known-part"], [whole, "gave-the-whole-angle"], [ans + 10, "regrouping-slip"], [ans - 10, "regrouping-slip"]];
  return finalize({
    family: "angles",
    spec: find === "whole" ? { type: "adjacent", find, p1, p2 } : { type: "adjacent", find, whole, p1 },
    stem,
    ask,
    expr: find === "whole" ? `${p1} + ${p2} = ?` : `${p1} + ? = ${whole}`,
    answer: { ...ansInt(ans), unit: "degrees" },
    work: find === "whole" ? [`The two smaller angles make the whole angle, so add: ${p1} + ${p2} = ${whole}`, `Angle ABC is ${whole}°.`] : [`The two smaller angles add up to the whole angle, so subtract: ${whole} ${MINUS} ${p1} = ${p2}`, `Angle DBC is ${p2}°.`],
    visual: lv === 1 ? { kind: "angle", alt: "An angle split into two parts by a ray.", deg: whole, label: find === "whole" ? "?" : `${whole}°`, protractor: false } : null,
    distractors: mkD(ans, num(ans), [...cands, ...nearInts(ans)], fmtInt),
    hints: find === "whole" ? ANGH.adjacentWhole : ANGH.adjacentPart,
    level: lv,
  });
}
function anCirc(rng, lv) {
  const d = rng.pick([2, 3, 4, 5, 6, 8, 9, 10, 12]);
  const n = rng.int(1, d - 1);
  const ans = (360 * n) / d;
  const one = 360 / d;
  const cands = [[n > 1 ? one : null, "named-only-one-part"], [d, "gave-the-denominator"], [(180 * n) / d, "used-half-a-circle-as-the-whole"], [360 - ans, "gave-the-rest-of-the-circle"], [n, "gave-the-numerator"]];
  return finalize({
    family: "angles",
    spec: { type: "circfrac", n, d },
    stem: T3(`A turn is ${n}/${d} of a full circle.`, `An angle turns through ${n}/${d} of a full circle.`, `An angle opens through ${n}/${d} of a complete circle.`),
    ask: T3("How many degrees is the angle?", "How many degrees is the angle?", "What is the measure of the angle, in degrees?"),
    expr: null,
    answer: { ...ansInt(ans), unit: "degrees" },
    work: [`One part of ${d} equal parts of a circle is 360 ${DIVIDE} ${d} = ${one}°.`, `${n} parts: ${n} ${TIMES} ${one} = ${ans}°.`],
    visual: null,
    distractors: mkD(ans, num(ans), [...cands, ...nearInts(ans)], fmtInt),
    hints: ANGH.circ,
    level: lv,
  });
}
function genAngles(rng, p, o) {
  const lv = o.level;
  const r = rng.next();
  return until(() => {
    if (lv === 1) return r < 0.4 ? anClassify(rng, 1) : r < 0.7 ? anMeasure(rng, 1) : anAdjacent(rng, 1, "whole");
    if (lv === 2) return r < 0.3 ? anLine(rng, 2) : r < 0.55 ? anAdjacent(rng, 2) : r < 0.7 ? anClassify(rng, 2) : anAround(rng, 2);
    return r < 0.25 ? anAround(rng, 3) : r < 0.5 ? anCirc(rng, 3) : r < 0.7 ? anAdjacent(rng, 3) : anLine(rng, 3);
  });
}

// ---------------------------------------------------------------------------------------------------- lineplot
const LP = {
  store: { items: "pencils", one: "inch", many: "inches", verb: "measured", noun: "length", title: "lengths of pencils, in inches" },
  garden: { items: "bean seedlings", one: "inch", many: "inches", verb: "measured", noun: "height", title: "heights of bean seedlings, in inches" },
  sports: { items: "cones", one: "foot", many: "feet", verb: "measured", noun: "height", title: "heights of cones, in feet" },
  kitchen: { items: "bowls", one: "cup", many: "cups", verb: "held", noun: "amount", title: "amounts of flour in bowls, in cups" },
  pets: { items: "goldfish", one: "inch", many: "inches", verb: "measured", noun: "length", title: "lengths of goldfish, in inches" },
  library: { items: "bookmarks", one: "inch", many: "inches", verb: "measured", noun: "length", title: "lengths of bookmarks, in inches" },
  crafts: { items: "ribbons", one: "inch", many: "inches", verb: "measured", noun: "length", title: "lengths of ribbons, in inches" },
  travel: { items: "luggage tags", one: "inch", many: "inches", verb: "measured", noun: "length", title: "lengths of luggage tags, in inches" },
  science: { items: "plant cuttings", one: "inch", many: "inches", verb: "measured", noun: "length", title: "lengths of plant cuttings, in inches" },
  community: { items: "paper chains", one: "foot", many: "feet", verb: "measured", noun: "length", title: "lengths of paper chains, in feet" },
};
const vStr = (f) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);
const vText = (f) => mixedOf(f);
const sumFr = (xs) => xs.reduce((t, x) => t.add(x), new Fr(0, 1));
/** Counts of data points at each tick of a line plot. */
function lpData(rng, q, W, s0, nLo, nHi, kLo, kHi) {
  const T = W * q + 1;
  const k = rng.int(Math.min(kLo, T - 1), Math.min(kHi, T - 1));
  const first = s0 === 0 ? 1 : 0;
  const idxs = rng.sample(Array.from({ length: T - first }, (_, i) => i + first), k).sort((a, b) => a - b);
  const n = Math.max(k, rng.int(nLo, nHi));
  const counts = new Array(T).fill(0);
  for (const i of idxs) counts[i] = 1;
  for (let r = k; r < n; r++) counts[rng.pick(idxs)]++;
  const vals = [];
  counts.forEach((c, i) => {
    for (let j = 0; j < c; j++) vals.push(new Fr(s0 * q + i, q));
  });
  return { counts, vals, idxs, n, T, at: (i) => new Fr(s0 * q + i, q) };
}
function lpBuild(rng, lv, ctx, type, operations) {
  const L = LP[ctx] || LP.store;
  const q = lv === 1 ? 2 : lv === 2 ? 4 : 8;
  const W = lv === 1 ? 2 : lv === 2 ? rng.pick([1, 2]) : 1;
  const s0 = rng.int(0, lv === 3 ? 2 : 1);
  const meanType = type === "mean";
  const D = lpData(rng, q, W, s0, meanType ? 4 : lv === 1 ? 8 : 9, meanType ? 8 : lv === 1 ? 12 : 14, meanType ? 3 : lv === 1 ? 4 : 5, lv === 1 ? 5 : 7);
  const maxC = Math.max(...D.counts);
  if (maxC > 6) return null;
  const mean = sumFr(D.vals).div(new Fr(D.n, 1));
  if (meanType && ![1, 2, 4, 8].includes(mean.d)) return null;
  const nonIntSeen = D.vals.some((v) => v.d !== 1);
  if (!nonIntSeen) return null;
  const strs = D.vals.map(vStr);
  const unitOf = (f) => (f.value <= 1 ? L.one : L.many);
  const tv = (f) => `${vText(f)} ${unitOf(f)}`;
  const picks = D.idxs.map((i) => D.at(i));
  const countOf = (f) => D.vals.filter((v) => v.cmp(f) === 0).length;
  const visual = { kind: "lineplot", alt: `A line plot of the ${L.title}. Each x is one measurement.`, min: s0, max: s0 + W, step: `1/${q}`, values: strs, label: cap(L.title) };
  const stem = T3(`Look at the line plot. It shows the ${L.title}.`, `The line plot shows the ${L.title}.`, `The line plot displays data on the ${L.title}.`);
  const common = { family: "lineplot", stem, expr: null, visual, level: lv };
  const fmtF = (v) => (v instanceof Fr ? (v.d === 1 ? num(v.n) : mixedOf(v)) : num(v));
  let spec;
  let ask;
  let answer;
  let work;
  let cands;
  let hints;
  let fmt = fmtInt;
  let ans;
  if (type === "howmany") {
    const t = rng.pick(picks);
    ans = countOf(t);
    spec = { type, values: strs, t: vStr(t) };
    ask = S3(`How many ${L.items} ${L.verb} ${tv(t)}?`);
    answer = ansInt(ans);
    const nb = picks.filter((f) => f.cmp(t) !== 0).map(countOf);
    cands = [[D.n, "counted-all-the-marks"], [ans + 1, "counted-an-extra-mark"], [ans - 1, "missed-a-mark"], [picks.length, "counted-the-columns"], nb.length ? [nb[0], "read-the-wrong-column"] : null, ...nearInts(ans)];
    work = [`Find ${vText(t)} on the number line and count the x marks above it.`, `There are ${ans} marks above ${vText(t)}.`];
    hints = { conceptual: "In a line plot, each x stands for one measurement. The marks stacked above a number tell how many measurements have that value.", procedural: "Find the number on the line, then count the x marks that are stacked above it." };
  } else if (type === "most") {
    let best = picks[0];
    for (const f of picks) if (countOf(f) > countOf(best)) best = f;
    if (picks.filter((f) => countOf(f) === countOf(best)).length > 1) return null;
    const lo = picks[0];
    const hi = picks[picks.length - 1];
    ans = best;
    spec = { type, values: strs };
    ask = S3(`Which ${L.noun} was the most common?`);
    answer = fracAnswer(best);
    cands = picks.filter((f) => f.cmp(best) !== 0).map((f) => [f, f.cmp(hi) === 0 ? "chose-the-greatest-value" : f.cmp(lo) === 0 ? "chose-the-least-value" : "chose-a-value-with-fewer-marks"]);
    fmt = fmtF;
    work = [`The most common value has the tallest stack of x marks. That stack is above ${vText(best)}, with ${countOf(best)} marks.`];
    hints = { conceptual: "The most common value is the one that appears most often, so it has the tallest stack of x marks.", procedural: "Compare the heights of the stacks. Read the number under the tallest stack." };
  } else if (type === "more") {
    const t = rng.pick(picks.slice(0, -1));
    ans = D.vals.filter((v) => v.cmp(t) > 0).length;
    spec = { type, values: strs, t: vStr(t) };
    ask = S3(`How many ${L.items} ${L.verb} more than ${tv(t)}?`);
    answer = ansInt(ans);
    cands = [[D.vals.filter((v) => v.cmp(t) >= 0).length, "included-the-value-that-is-equal"], [D.vals.filter((v) => v.cmp(t) < 0).length, "counted-the-wrong-side"], [D.n, "counted-all-the-marks"], [ans + 1, "counted-an-extra-mark"], ...nearInts(ans)];
    work = [`Count the x marks to the right of ${vText(t)}. Do not count the marks above ${vText(t)} itself.`, `There are ${ans} marks.`];
    hints = { conceptual: "More than a number means greater than it, so only the values to the right of it on the number line count.", procedural: "Find the number on the line. Count the marks only on the numbers to its right." };
  } else if (type === "range") {
    const lo = picks[0];
    const hi = picks[picks.length - 1];
    const diff = hi.sub(lo);
    ans = diff;
    spec = { type, values: strs };
    ask = S3(`What is the difference between the greatest ${L.noun} and the least ${L.noun}?`);
    answer = fracAnswer(diff);
    const steps = Math.round(diff.value * q);
    cands = [[hi, "gave-the-greatest-value", fmtF(hi)], [hi.add(lo), "added-instead-of-subtracted"], [steps, "counted-the-intervals", String(steps)], [diff.add(new Fr(1, q)), "off-by-one-interval"], [diff.sub(new Fr(1, q)).n > 0 ? diff.sub(new Fr(1, q)) : null, "off-by-one-interval"], [lo, "gave-the-least-value"]];
    fmt = fmtF;
    work = [`The greatest value is ${vText(hi)} and the least value is ${vText(lo)}.`, `The difference is ${vText(hi)} ${MINUS} ${vText(lo)}, which is ${vText(diff)}.`];
    hints = { conceptual: "The difference between the greatest and the least values is how far apart the two ends of the data are.", procedural: "Read the value of the last x on the right and the first x on the left, then subtract." };
  } else if (type === "diffcount") {
    const opts = [];
    for (const a of picks) for (const b of picks) if (countOf(a) > countOf(b)) opts.push([a, b]);
    if (!opts.length) return null;
    const [t1, t2] = rng.pick(opts);
    ans = countOf(t1) - countOf(t2);
    spec = { type, values: strs, t: vStr(t1), t2: vStr(t2) };
    ask = S3(`How many more ${L.items} ${L.verb} ${tv(t1)} than ${tv(t2)}?`);
    answer = ansInt(ans);
    cands = [[countOf(t1) + countOf(t2), "added-instead-of-subtracted"], [countOf(t1), "gave-one-of-the-counts"], [countOf(t2), "gave-one-of-the-counts"], [ans + 1, "off-by-one"], ...nearInts(ans)];
    work = [`Count the marks above ${vText(t1)}: ${countOf(t1)}. Count the marks above ${vText(t2)}: ${countOf(t2)}.`, `Subtract: ${countOf(t1)} ${MINUS} ${countOf(t2)} = ${ans}`];
    hints = { conceptual: "How many more asks for the difference between two counts, so compare the heights of two stacks.", procedural: "Count the marks in each of the two stacks, then subtract the smaller count from the larger count." };
  } else if (type === "total") {
    const total = sumFr(D.vals);
    ans = total;
    spec = { type, values: strs };
    ask = S3(`What is the total ${L.noun} of all the ${L.items}, in ${L.many}?`);
    answer = fracAnswer(total);
    const distinct = sumFr(picks);
    cands = [[mean, "found-the-average", fmtF(mean)], [distinct, "forgot-the-repeated-values", fmtF(distinct)], [D.n, "gave-the-number-of-items"], [total.add(new Fr(1, q)), "off-by-one-interval"], [total.sub(new Fr(1, q)).n > 0 ? total.sub(new Fr(1, q)) : null, "off-by-one-interval"]];
    fmt = fmtF;
    const ex = picks.find((f) => countOf(f) > 1) || picks[picks.length - 1];
    work = [`Add the value of every x mark. A stack of ${countOf(ex)} marks above ${vText(ex)} adds ${countOf(ex)} copies of ${vText(ex)}.`, `The total is ${vText(total)}.`];
    hints = { conceptual: "A line plot stores every measurement, so the total adds all of them, including repeats.", procedural: "For each number on the line, multiply the number by the count of marks above it. Then add those amounts." };
  } else {
    ans = mean;
    spec = { type, values: strs };
    ask = T3(`If all the ${L.items} had the same ${L.noun}, what would that ${L.noun} be?`, `If all the ${L.items} had the same ${L.noun}, what would it be?`, `If the total were shared equally among all the ${L.items}, what would each ${L.noun} be?`);
    answer = fracAnswer(mean);
    const sorted = D.vals.slice().sort((a, b) => a.cmp(b));
    const med = sorted[Math.floor(sorted.length / 2)];
    let best = picks[0];
    for (const f of picks) if (countOf(f) > countOf(best)) best = f;
    const total = sumFr(D.vals);
    cands = [[total, "forgot-to-divide", fmtF(total)], [best, "chose-the-most-common-value", fmtF(best)], [med, "chose-the-middle-value", fmtF(med)], [total.div(new Fr(picks.length, 1)), "divided-by-the-number-of-different-values", fmtF(total.div(new Fr(picks.length, 1)))], [mean.add(new Fr(1, q)), "off-by-one-interval"], [mean.sub(new Fr(1, q)).n > 0 ? mean.sub(new Fr(1, q)) : null, "off-by-one-interval"], [picks[picks.length - 1], "chose-the-greatest-value"], [picks[0], "chose-the-least-value"]];
    fmt = fmtF;
    work = [`Add all the values: the total is ${vText(total)}.`, `Share the total equally among the ${D.n} ${L.items}: ${vText(total)} ${DIVIDE} ${D.n} gives ${vText(mean)}.`];
    hints = { conceptual: "Making all the amounts the same means sharing the total equally. That equal share is the mean.", procedural: "Find the total of all the measurements. Then divide the total by how many measurements there are." };
  }
  const ansO = answer;
  const distractors = mkD(vnum(ans), ansO.text, cands.filter(Boolean).map(([v, t, text]) => [v, t, text ?? (v instanceof Fr ? fmtF(v) : undefined)]), fmt);
  if (distractors.length < 3) return null;
  return finalize({
    ...common,
    spec,
    ask,
    answer: ansO,
    work,
    distractors,
    hints,
  });
}
function genLineplot(rng, p, o) {
  const lv = o.level;
  const ops = !!p.operations;
  const r = rng.next();
  let type;
  if (lv === 1) type = ops && r < 0.3 ? "total" : r < 0.55 ? "howmany" : r < 0.8 ? "most" : "more";
  else if (lv === 2) type = ops && r < 0.25 ? "total" : ops && r < 0.45 ? "mean" : r < 0.55 ? "howmany" : r < 0.7 ? "most" : r < 0.8 ? "range" : r < 0.9 ? "diffcount" : "more";
  else type = ops && r < 0.4 ? "mean" : ops && r < 0.6 ? "total" : r < 0.7 ? "range" : r < 0.85 ? "diffcount" : "more";
  return until(() => lpBuild(rng, lv, o.ctx, type, ops), 800);
}
function checkLineplot(p, params) {
  const s = p.spec;
  if (!(params && params.operations) && (s.type === "total" || s.type === "mean")) return "operations asked of a skill without operations:true";
  const ds = s.values.map((v) => (String(v).split("/")[1] ? Number(String(v).split("/")[1]) : 1));
  if (ds.some((d) => ![1, 2, 4, 8].includes(d))) return "a value is not a half, fourth or eighth";
  if (!ds.some((d) => d !== 1)) return "no fractional value on the line plot";
  return null;
}

export const FAMILIES = {
  muldiv: { title: "Multiplication and division", grades: [3], defaults: { max: 10, story: false, steps: 1, mode: "mixed" }, gen: genMuldiv, check: checkMuldiv },
  properties: { title: "Properties of operations", grades: [3], defaults: { mode: "commute" }, gen: genProperties },
  fracid: { title: "Understand fractions", grades: [3], defaults: { maxDen: 8 }, gen: genFracid, check: checkFracid },
  fracline: { title: "Fractions on number lines", grades: [3], defaults: { maxDen: 8 }, gen: genFracline, check: checkFracline },
  areaperim: { title: "Area and perimeter", grades: [3], defaults: { max: 12 }, gen: genAreaperim, check: checkAreaperim },
  elapsed: { title: "Time, volume and mass", grades: [3], defaults: {}, gen: genElapsed },
  multidigit: { title: "Multi-digit operations", grades: [4], defaults: {}, gen: genMultidigit, check: checkMultidigit },
  multcompare: { title: "Multiplicative comparison", grades: [4], defaults: {}, gen: genMultcompare },
  factors: { title: "Factors and multiples", grades: [4], defaults: { max: 100 }, gen: genFactors, check: checkFactors },
  fracequiv: { title: "Equivalent fractions and comparing", grades: [4], defaults: {}, gen: genFracequiv },
  fracops: { title: "Fraction operations", grades: [4, 5, 6], defaults: { level: "like" }, gen: genFracops },
  decimals: { title: "Decimals", grades: [4, 5], defaults: { places: 2, ops: false }, gen: genDecimals, check: checkDecimals },
  convert: { title: "Measurement conversions", grades: [4, 5], defaults: { system: "mixed", decimals: false }, gen: genConvert, check: checkConvert },
  angles: { title: "Angles", grades: [4], defaults: {}, gen: genAngles },
  lineplot: { title: "Line plots with fractions", grades: [4, 5], defaults: { frac: true, operations: false }, gen: genLineplot, check: checkLineplot },
};
