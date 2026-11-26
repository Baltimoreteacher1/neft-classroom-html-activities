/* Unit Rate Market Mission · Deal Lab: "Create a deal" (inverse problems) and the What-If
 * explanation check. DOM-free and exact. A created deal is judged by cross-multiplying whole
 * cents, so any valid package is accepted and an invalid one is told which condition fails. */
import { cmp, frac } from "../projects/studio/exact.mjs";
import { bestBuy, fmtCents, fmtExact, int, parseCount, parsePrice, pick, rng, unitPrice } from "./deal-lab-core.mjs";
import { COUNT_PRODUCTS } from "./deal-lab-items.mjs";

export const CREATE_FAMILIES = ["cheaperBigger", "pricierSmaller", "sameRate", "between"];

export function makeCreateItem(seed, fam) {
  const r = rng(seed);
  const family = fam || pick(r, CREATE_FAMILIES);
  const product = pick(r, COUNT_PRODUCTS);
  const item = { seed, kind: "create", family, product, refs: {}, conditions: [] };
  let uA = int(r, 15, 95);
  if (family === "pricierSmaller") uA = int(r, 30, 95);
  const qA = int(r, 4, 16);
  item.refs.A = { qty: qA, cents: uA * qA, unit: uA };
  const A = `Store A sells ${qA} ${product.many} for ${fmtCents(uA * qA)}.`;
  if (family === "cheaperBigger") {
    const limit = uA * qA + 50 * int(r, 1, 4);
    item.conditions = [
      { kind: "unit", ref: "A", rel: "lt" },
      { kind: "total", rel: "gt", cents: limit },
    ];
    item.prompt = `${A} Create a package for your store with a LOWER unit price than Store A but a HIGHER total price than ${fmtCents(limit)}.`;
  } else if (family === "pricierSmaller") {
    const limit = uA * qA - 25 * int(r, 1, 3);
    item.conditions = [
      { kind: "unit", ref: "A", rel: "gt" },
      { kind: "total", rel: "lt", cents: limit },
    ];
    item.prompt = `${A} Create a package for your store with a HIGHER unit price than Store A but a LOWER total price than ${fmtCents(limit)}.`;
  } else if (family === "sameRate") {
    item.conditions = [
      { kind: "unit", ref: "A", rel: "eq" },
      { kind: "size", rel: "ne", qty: qA },
    ];
    item.prompt = `${A} Create a package with the SAME unit price as Store A but a different number of ${product.many}.`;
  } else {
    const uB = uA - int(r, 2, Math.min(12, uA - 5));
    const qB = int(r, 4, 16);
    item.refs.B = { qty: qB, cents: uB * qB, unit: uB };
    item.conditions = [
      { kind: "unit", ref: "A", rel: "lt" },
      { kind: "unit", ref: "B", rel: "gt" },
    ];
    item.prompt = `${A} Store B sells ${qB} ${product.many} for ${fmtCents(uB * qB)}. Create a package whose unit price is LOWER than Store A's but HIGHER than Store B's.`;
  }
  return item;
}

const WORD = { lt: "lower than", gt: "higher than", eq: "the same as" };
/** Judge a created package. Returns { ok, input?, results: [{ ok, msg }] } — never a suggested answer. */
export function checkCreate(item, sizeText, priceText) {
  const size = parseCount(sizeText);
  if (size.error) return { ok: false, input: "size", error: size.error, results: [] };
  const price = parsePrice(priceText);
  if (price.error) return { ok: false, input: "price", error: price.error, results: [] };
  const s = size.count;
  const p = price.cents;
  const many = item.product.many;
  const results = item.conditions.map((c) => {
    if (c.kind === "unit") {
      const ref = item.refs[c.ref];
      const atRef = ref.unit * s; // what s items cost at the reference unit price, exact cents
      const rel = cmp(frac(BigInt(p)), frac(BigInt(atRef)));
      const got = rel < 0 ? "lt" : rel > 0 ? "gt" : "eq";
      const ok = got === c.rel;
      const msg =
        `At Store ${c.ref}'s price of ${fmtCents(ref.unit)} each, ${s} ${many} would cost ${s} × ${fmtCents(ref.unit)} = ${fmtCents(atRef)}. ` +
        `Your ${fmtCents(p)} is ${got === "lt" ? "less" : got === "gt" ? "more" : "exactly that"}, so your unit price is ${WORD[got]} Store ${c.ref}'s.` +
        (ok ? "" : ` It needs to be ${WORD[c.rel]} Store ${c.ref}'s.`);
      return { ok, kind: "unit", msg };
    }
    if (c.kind === "total") {
      const ok = c.rel === "gt" ? p > c.cents : p < c.cents;
      const msg = ok
        ? `Your total ${fmtCents(p)} is ${c.rel === "gt" ? "more" : "less"} than ${fmtCents(c.cents)}.`
        : `Your total ${fmtCents(p)} is not ${c.rel === "gt" ? "more" : "less"} than ${fmtCents(c.cents)}.`;
      return { ok, kind: "total", msg };
    }
    const ok = s !== c.qty;
    return {
      ok,
      kind: "size",
      msg: ok ? `Your package has ${s} ${many}, a different size from Store A.` : `Your package has ${s} ${many}, the same size as Store A. Choose a different size.`,
    };
  });
  return { ok: results.every((x) => x.ok), results, unit: fmtExact(frac(BigInt(p), BigInt(s))) };
}

/* ---------- What-If: explain a change ---------- */
export const CAUSES = {
  bigger: "the package got bigger",
  smaller: "the package got smaller",
  pricier: "the price went up",
  cheaper: "the price went down",
  rule: "the deal rule changed",
};
const PUSH = { bigger: "down", smaller: "up", pricier: "up", cheaper: "down" };
export function changedCauses(before, after) {
  const out = [];
  if (after.qty > before.qty) out.push("bigger");
  if (after.qty < before.qty) out.push("smaller");
  if (after.cents > before.cents) out.push("pricier");
  if (after.cents < before.cents) out.push("cheaper");
  if (after.rule !== before.rule) out.push("rule");
  return out;
}
export function changeTruth(before, after, focus) {
  const c = cmp(unitPrice(after[focus]), unitPrice(before[focus]));
  const b0 = bestBuy(before.A, before.B);
  const b1 = bestBuy(after.A, after.B);
  return {
    dir: c < 0 ? "down" : c > 0 ? "up" : "same",
    causes: changedCauses(before[focus], after[focus]),
    best: b0 === b1 ? "same" : "changed",
    bestBefore: b0,
    bestAfter: b1,
  };
}
/** picks = { dir: up|down|same, cause: CAUSES key, best: same|changed }. */
export function checkChange(before, after, focus, picks) {
  const t = changeTruth(before, after, focus);
  const issues = [];
  if (picks.dir !== t.dir) issues.push(`Compare Deal ${focus}'s price for 1 before and after the change. Did it go up, down, or stay the same?`);
  if (!t.causes.includes(picks.cause)) issues.push(`That is not what changed on Deal ${focus}. Look at its size, its price and its deal rule.`);
  else if (t.dir !== "same" && PUSH[picks.cause] && PUSH[picks.cause] !== t.dir && picks.dir === t.dir)
    issues.push(`On its own, “${CAUSES[picks.cause]}” would push the price for 1 ${PUSH[picks.cause]}. Which other change pushed it ${t.dir}?`);
  if (picks.best !== t.best) issues.push("Check which deal costs less for 1 now, and which one did before.");
  return { ok: issues.length === 0, issues, truth: t };
}
const WHY = {
  bigger: "the same price is now shared by more items",
  smaller: "the same price is now shared by fewer items",
  pricier: "you pay more for the same number of items",
  cheaper: "you pay less for the same number of items",
  rule: "the deal changes what you pay for each item you take home",
};
export const whyText = (cause) => WHY[cause] || "";
