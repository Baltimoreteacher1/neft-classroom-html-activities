/* Unit Rate Market Mission · Deal Lab items. DOM-free, seeded, exact.
 * Four "Almost-Right shopper" traps share one builder with the direct better-buy items, so a
 * debugging case and its fresh attempt / transfer test the same mathematics with new numbers.
 * Every target is a whole number of cents by construction (never a repeating decimal). */
import { cmp, eq, frac } from "../projects/studio/exact.mjs";
import { fmtCents, fmtExact, int, parseMoney, pick, rng, shuffle, unitPrice } from "./deal-lab-core.mjs";

export const COUNT_PRODUCTS = [
  { one: "juice box", many: "juice boxes" },
  { one: "granola bar", many: "granola bars" },
  { one: "pencil", many: "pencils" },
  { one: "yogurt cup", many: "yogurt cups" },
  { one: "marker", many: "markers" },
  { one: "glue stick", many: "glue sticks" },
  { one: "battery", many: "batteries" },
  { one: "water bottle", many: "water bottles" },
];
export const WEIGHT_PRODUCTS = ["cereal", "trail mix", "rice", "oats", "dog food", "coffee beans"];
const SHOPPERS = ["Jordan", "Amara", "Luis", "Mei", "Kofi", "Sam", "Nia", "Diego"];
export const FAMILIES = ["total", "flip", "convert", "bogo"];

export const ERRORS = {
  total: "compared the total prices instead of the price for 1",
  flip: "divided items by dollars, which gives items per dollar, not dollars per item",
  convert: "compared a price per ounce with a price per pound",
  bogo: "left out the free pack in the deal",
};
export const FIXES = {
  total: "divide each total by its number of items, then compare",
  flip: "divide the cost by the number of items",
  convert: "change pounds to ounces first (1 lb = 16 oz), then compare per ounce",
  bogo: "divide the price of 2 packs by the items in all 3 packs",
};

/** Store -> deal in the item's comparison unit (per item, or per OUNCE for weights). */
export const asDeal = (s) => ({ qty: s.measure === "lb" ? s.qty * 16 : s.qty, cents: s.cents, rule: s.rule });
const other = (L) => (L === "A" ? "B" : "A");

function family(r, fam) {
  const flipLetters = r() < 0.5;
  const L = flipLetters ? ["B", "A"] : ["A", "B"]; // L[0] is always the better buy
  const store = (qty, cents, measure = "count", rule = "none") => ({ qty, cents, measure, rule });
  let good, bad, unit, product, targets;
  if (fam === "total") {
    // The better unit price sits on the bigger, MORE expensive package.
    const uLow = 5 * int(r, 4, 30);
    const uHigh = uLow + 5 * int(r, 1, 3);
    const qSmall = pick(r, [4, 5, 6, 8, 10, 12]);
    const sizes = [];
    for (let q = qSmall + 2; q <= Math.min(qSmall * 3, 48); q++) if (uHigh * qSmall < uLow * q) sizes.push(q);
    const qBig = pick(r, sizes);
    good = store(qBig, uLow * qBig);
    bad = store(qSmall, uHigh * qSmall);
    targets = [uLow, uHigh];
  } else if (fam === "flip") {
    // Items per dollar is 100/u, a terminating decimal for these u (cents per item).
    const [uLow, uHigh] = shuffle(r, [20, 25, 40, 50, 80, 100, 125, 200, 250])
      .slice(0, 2)
      .sort((a, b) => a - b);
    const qa = int(r, 3, 20);
    const qb = int(r, 3, 20);
    good = store(qa, uLow * qa);
    bad = store(qb, uHigh * qb);
    targets = [uLow, uHigh];
  } else if (fam === "convert") {
    // The pound bag is cheaper per ounce; per POUND it looks far more expensive.
    const uOz = int(r, 9, 30);
    const uLb = uOz - int(r, 1, 4);
    const lbs = int(r, 1, 5);
    const oz = pick(r, [12, 18, 20, 24, 28, 36, 40]);
    good = store(lbs, uLb * 16 * lbs, "lb");
    bad = store(oz, uOz * oz, "oz");
    targets = [uLb, uOz];
  } else {
    // Buy 2 get 1 free: regular 3k per item, with the deal 2k per item; the other store sits between.
    const k = int(r, 4, 30);
    const q = pick(r, [4, 6, 8, 10, 12]);
    const v = 2 * k + int(r, 1, k - 1);
    const q2 = pick(r, [5, 6, 8, 9, 10, 12, 15]);
    good = store(q, 3 * k * q, "count", "b2g1");
    bad = store(q2, v * q2);
    targets = [2 * k, v];
  }
  if (fam === "convert") product = { one: "ounce", many: "ounces", name: pick(r, WEIGHT_PRODUCTS) };
  else product = pick(r, COUNT_PRODUCTS);
  unit = product.one;
  const names = shuffle(r, ["Corner Market", "Lantern Grocer", "Harbor Foods", "Value Mart", "Fresh Stop"]);
  const stores = { [L[0]]: { ...good, name: "" }, [L[1]]: { ...bad, name: "" } };
  stores.A.name = names[0];
  stores.B.name = names[1];
  return { family: fam, product, unit, stores, answer: L[0], shopperPick: L[1], targets: { [L[0]]: targets[0], [L[1]]: targets[1] } };
}

/** Plain-language shelf line for one store. */
export function shelfText(item, L) {
  const s = item.stores[L];
  if (s.measure === "lb") return `Store ${L} (${s.name}): ${s.qty} lb of ${item.product.name} for ${fmtCents(s.cents)}`;
  if (s.measure === "oz") return `Store ${L} (${s.name}): ${s.qty} oz of ${item.product.name} for ${fmtCents(s.cents)}`;
  const deal = s.rule === "b2g1" ? " — buy 2, get 1 free" : "";
  return `Store ${L} (${s.name}): ${s.qty} ${item.product.many} for ${fmtCents(s.cents)}${deal}`;
}

/** A direct better-buy item ("fresh attempt" or "transfer"). */
export function makeSolveItem(seed, fam) {
  const r = rng(seed);
  const item = family(r, fam || pick(r, FAMILIES));
  item.seed = seed;
  item.kind = "solve";
  item.question =
    item.family === "convert"
      ? `Find the cost per OUNCE at each store, then choose the better buy.`
      : item.family === "bogo"
        ? `You will take any deal (buy 3 packs). Find the cost per ${item.unit} at each store, then choose the better buy.`
        : `Find the cost per ${item.unit} at each store, then choose the better buy.`;
  return item;
}

/** An Almost-Right shopper case: reasoning with exactly ONE wrong step. */
export function makeShopperItem(seed, fam) {
  const r = rng(seed);
  const item = family(r, fam || pick(r, FAMILIES));
  item.seed = seed;
  item.kind = "shopper";
  item.shopper = pick(r, SHOPPERS);
  const { stores: S, answer: good, shopperPick: bad, unit } = item;
  const read = `${shelfText(item, "A")}. ${shelfText(item, "B")}.`;
  const readWhy = "This step only copies the shelf tags, and it copies them correctly.";
  const up = (L) => unitPrice(asDeal(S[L]));
  if (item.family === "total") {
    item.steps = [
      { text: read, why: readWhy },
      { text: `${fmtCents(S[bad].cents)} is less than ${fmtCents(S[good].cents)}, so Store ${bad} charges less.` },
      { text: `So Store ${bad} is the better buy.` },
    ];
    item.wrongStep = 1;
  } else if (item.family === "flip") {
    // Items per dollar, mislabelled as dollars: q ÷ (cents/100) = 10000q/cents "cents".
    const ipd = (L) => fmtExact(frac(BigInt(S[L].qty) * 10000n, BigInt(S[L].cents))).text;
    item.steps = [
      { text: read, why: readWhy },
      { text: `A unit price is the cost for 1 ${unit}, so ${item.shopper} will divide.`, why: "A unit price really is the cost for 1, and dividing is the right tool." },
      {
        text: `Cost per ${unit}: A is ${S.A.qty} ÷ ${fmtCents(S.A.cents)} = ${ipd("A")}, and B is ${S.B.qty} ÷ ${fmtCents(S.B.cents)} = ${ipd("B")}.`,
      },
      { text: `${ipd(bad)} is smaller, so Store ${bad} is the better buy.` },
    ];
    item.wrongStep = 2;
  } else if (item.family === "convert") {
    const lb = S[good].measure === "lb" ? good : bad;
    const oz = other(lb);
    const perLb = fmtExact(frac(BigInt(S[lb].cents), BigInt(S[lb].qty))).text;
    item.steps = [
      { text: read, why: readWhy },
      {
        text: `Store ${oz}: ${fmtCents(S[oz].cents)} ÷ ${S[oz].qty} = ${fmtExact(up(oz)).text} per ounce. Store ${lb}: ${fmtCents(S[lb].cents)} ÷ ${S[lb].qty} = ${perLb} per pound.`,
        why: "Both divisions are right, and each answer has the right label.",
      },
      { text: `${fmtExact(up(oz)).text} is less than ${perLb}, so Store ${oz} is the better buy.` },
    ];
    item.wrongStep = 2;
  } else {
    const d = S[good];
    item.steps = [
      { text: read, why: readWhy },
      {
        text: `With the deal, ${item.shopper} pays for 2 packs and gets 3 packs: ${3 * d.qty} ${item.product.many}.`,
        why: "Buy 2, get 1 free really does mean 3 packs for the price of 2.",
      },
      { text: `Store ${good}: ${fmtCents(d.cents)} ÷ ${d.qty} = ${fmtCents(d.cents / d.qty)} per ${unit}.` },
      {
        text: `Store ${bad}: ${fmtCents(S[bad].cents)} ÷ ${S[bad].qty} = ${fmtCents(item.targets[bad])}. That is less, so Store ${bad} is the better buy.`,
      },
    ];
    item.wrongStep = 2;
  }
  return item;
}

/** Which step did the student pick? Right, an earlier correct step, or a later consequence. */
export function checkStep(item, i) {
  if (i === item.wrongStep) return { ok: true, msg: "Yes. That is the first step where the thinking goes wrong." };
  if (i < item.wrongStep) return { ok: false, msg: `Step ${i + 1} is fine: ${item.steps[i].why} Keep reading.` };
  return { ok: false, msg: `Step ${i + 1} follows from an earlier step. Look earlier: where does the thinking first go wrong?` };
}
export function checkExplain(item, errorId, fixId) {
  const issues = [];
  if (errorId !== item.family) issues.push("Read the wrong step again. What did the shopper actually do there?");
  if (fixId !== item.family) issues.push("Your fix should repair that same step.");
  return { ok: issues.length === 0, issues };
}

/** The values a common mistake produces for one store, each as exact cents. */
function traps(item, L) {
  // Order matters only when two mistakes give the same number: the more specific one is named.
  const s = item.stores[L];
  const out = [{ id: "total", v: frac(BigInt(s.cents)) }];
  if (s.measure === "lb") out.push({ id: "perlb", v: frac(BigInt(s.cents), BigInt(s.qty)) });
  if (s.rule === "b2g1") {
    out.push({ id: "nodeal", v: frac(BigInt(s.cents), BigInt(s.qty)) });
    out.push({ id: "halfDeal", v: frac(2n * BigInt(s.cents), BigInt(s.qty)) });
  }
  out.push({ id: "flip", v: frac(BigInt(asDeal(s).qty) * 10000n, BigInt(s.cents)) });
  return out;
}
export const DIAGNOSES = {
  flip: "That looks like items per dollar (items ÷ cost). A unit price is dollars for ONE item: put the cost first.",
  total: "That is the price of the whole package. Divide it by the amount to get the price for 1.",
  perlb: "That is the price per POUND. This question asks per OUNCE, and 1 lb = 16 oz.",
  nodeal: "That price leaves out the free pack. With buy 2, get 1 free you pay for 2 packs and take home 3.",
  halfDeal: "You paid for 2 packs, which is right, but you take home 3 packs. Divide by the items in all 3.",
  close: "Very close. Check your division again, one digit at a time.",
  other: "Not yet. Write the rate as cost over amount, then divide so the amount becomes 1.",
};
/** A step-by-step hint for one store that names the division but never its result. */
export function hintFor(item, L) {
  const s = item.stores[L];
  if (s.measure === "lb") return `Store ${L}: ${s.qty} lb = ${s.qty} × 16 = ${s.qty * 16} oz. Divide ${fmtCents(s.cents)} by ${s.qty * 16}.`;
  if (s.rule === "b2g1")
    return `Store ${L}: 2 packs cost 2 × ${fmtCents(s.cents)} and 3 packs hold 3 × ${s.qty} items. Divide the cost by the items.`;
  return `Store ${L}: divide ${fmtCents(s.cents)} by ${s.qty}.`;
}
/** Check a typed unit price for one store. Never reveals the target. */
export function checkUnit(item, L, text) {
  const m = parseMoney(text);
  if (m.error) return { status: "input", error: m.error };
  const target = frac(BigInt(item.targets[L]));
  if (eq(m.cents, target)) return { status: "right" };
  for (const t of traps(item, L)) if (eq(m.cents, t.v)) return { status: t.id, msg: DIAGNOSES[t.id] };
  const diff = cmp(m.cents, target) > 0 ? frac(m.cents.n - target.n * m.cents.d, m.cents.d) : frac(target.n * m.cents.d - m.cents.n, m.cents.d);
  if (cmp(diff, frac(3n)) < 0) return { status: "close", msg: DIAGNOSES.close };
  return { status: "other", msg: DIAGNOSES.other };
}
export function checkPick(item, L) {
  if (L === item.answer) return { ok: true };
  return { ok: false, msg: "Compare your two prices for 1. The better buy costs LESS for 1, whatever the package size." };
}
