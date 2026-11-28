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
    if (!Number.isFinite(x) || x < -1e-9 || Math.abs(x - a) < 1e-9) continue;
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
function mdEq(rng, M, lv) {
  const lo = lv === 3 && M >= 8 ? 4 : 2;
  const hi = lv === 1 ? Math.min(M, 5) : M;
  const f = () => rng.int(lo, Math.max(lo, hi));
  const pool = lv === 1 ? ["mulc", "divc"] : lv === 2 ? ["mulc", "mula", "mulb", "divc", "divb"] : ["mula", "mulb", "diva", "divb", "divc", "mulc"];
  const kind = rng.pick(pool);
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
  if (p.mode === "factfamily") return rng.chance(0.55) ? mdFam(rng, M, lv) : rng.chance(0.5) ? mdEq(rng, M, lv) : mdGroups(rng, M, lv, o.ctx, lv === 1 ? "e" : undefined);
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
  const b2 = rng.int(2, 5);
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
      b = rng.int(lv === 2 ? 11 : 24, lv === 2 ? 49 : 98);
      work = mulWork2(a, b);
      hints = MDHINTS.mul2;
      const tens = Math.floor(b / 10) * 10;
      const ones = b % 10;
      cands = [[a * ones + a * (tens / 10), "forgot-the-zero-placeholder"], [a * ones, "left-out-the-tens-partial-product"], [a * tens, "left-out-the-ones-partial-product"], [a * b + a * 10, "added-an-extra-partial-product"], [a * b - a, "one-group-too-few"], [a * b + 100, "regrouping-slip"]];
      visual = lv === 2 && rng.chance(0.5) ? { kind: "areamodel", alt: `A partial-product rectangle for ${a} times ${b}.`, w: a, h: b, cutW: Math.floor(a / 10) * 10, cutH: tens, labels: true } : null;
    } else {
      const m = rng.int(2, 9);
      a = lv === 1 ? rng.int(120, 999) : rng.int(1200, 9999);
      b = m;
      work = mulWork1(a, m);
      hints = MDHINTS.mul1;
      const noCarry = fromDigitsRev(digitsRev(a).map((d) => (d * m) % 10));
      cands = [[noCarry, "forgot-to-add-the-regrouped-amount"], [a * (m - 1), "one-group-too-few"], [a * (m + 1), "one-group-too-many"], [a * m * 10, "place-value-slip"], [a + m, "added-instead-of-multiplied"], [a * m + 100, "regrouping-slip"]];
      visual = lv === 1 && a < 1000 ? { kind: "areamodel", alt: `A partial-product rectangle for ${a} times ${m}.`, w: a, h: m, cutW: Math.floor(a / 100) * 100, labels: true } : null;
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
    tags = new Map(bad.map((x) => [x, x % 2 === 1 ? "thought-odd-means-prime" : "did-not-check-all-the-factors"]));
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
    const [bd, k] = rng.pick(eqPairs(false).filter(([a]) => a <= 6));
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
  const cands = down ? [[`${n - (d - D)}/${D}`, "subtracted-the-same-amount"], [`${n}/${D}`, "changed-only-the-denominator"], [`${d - D}/${D}`, "used-the-difference-as-the-numerator"], [`${x}/${d}`, "changed-only-the-numerator"], [`${x + 1}/${D}`, "off-by-one"]] : [[`${n + (D - d)}/${D}`, "added-the-same-amount"], [`${n}/${D}`, "changed-only-the-denominator"], [`${D / d}/${D}`, "used-the-multiplier-as-the-numerator"], [`${x}/${d}`, "changed-only-the-numerator"], [`${x + 1}/${D}`, "off-by-one"]];
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
    ].filter(([f]) => f[1] > 0 && f[0] > 0 && new Fr(f[0], f[1]).cmp(target) !== 0);
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
    const tagOf = (f) => (f[1] === extD ? "bigger-denominator-means-bigger-fraction" : f[0] === extN ? "compared-numerators-only" : "compared-different-size-parts");
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
      hints: { conceptual: "You can only compare fractions fairly when the parts are the same size, or when you compare each one with a benchmark such as 1/2 or 1.", procedural: "Rename the fractions with a common denominator, or sort them by comparing each one with 1/2." },
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
    hints: { conceptual: "One half is a benchmark. A fraction is equal to 1/2 when the numerator is half of the denominator.", procedural: "Find half of the denominator. Then compare it with the numerator." },
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
};
