/**
 * Pure-logic tests for the Project Studio pop-up shop (percent missions).
 * Receipts are recomputed INDEPENDENTLY with integer arithmetic in hundredths of a cent, and the mission
 * receipt is cross-checked against math.mjs's own answers. Negative controls prove a corrupted amount,
 * tax on the original price and garbage save data are all rejected.
 */
import assert from "node:assert/strict";
import { addCheckpoint, cleanCheckpoints } from "../curriculum/projects/studio/checkpoints.mjs";
import { DESIGNERS } from "../curriculum/projects/studio/designers.mjs";
import { toNumber } from "../curriculum/projects/studio/exact.mjs";
import { model } from "../curriculum/projects/studio/math.mjs";
import {
  answersOf,
  cleanShop,
  compareOffers,
  evaluateShop,
  guardKeys,
  missionOffer,
  money,
  parseCoupon,
  parsePrice,
  receipt,
  ring,
  setQty,
  shopOf,
  shopReport,
  stepPrice,
  stock,
  unstock,
} from "../curriculum/projects/studio/percent-shop.mjs";
import { PROJECTS } from "../curriculum/projects/studio/projects.mjs";

let n = 0;
const test = (name, fn) => {
  try {
    fn();
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  }
  n++;
};
const halfUp = (num, den) => (2n * num + den) / (2n * den);
const cents = (x) => {
  assert.equal((x.n * 100n) % x.d, 0n, "expected whole cents");
  return (x.n * 100n) / x.d;
};

/** Independent register: gross in cents, b whole percent, c given in tenths of a percent. */
function oracle(grossCents, b, c10, budgetCents) {
  const sale = grossCents * BigInt(100 - b); // hundredths of a cent
  const discount = grossCents * BigInt(b); // hundredths of a cent
  const taxCents = halfUp(sale * BigInt(c10), 100n * 1000n);
  const totalCents = halfUp(sale + taxCents * 100n, 100n);
  return { discount, sale, taxCents, totalCents, changeCents: budgetCents - totalCents };
}
const hundredths = (x) => (x.n * 10000n) / x.d;

const pop = PROJECTS.find((p) => p.id === "unit-4-a");
const smart = PROJECTS.find((p) => p.id === "unit-4-b");

test("mission receipt matches math.mjs answers for every authored default and variant", () => {
  const designs = [
    pop.defaults,
    smart.defaults,
    { a: 48, b: 20, c: 4, d: 55 },
    { a: 72, b: 15, c: 4, d: 80 },
    { a: 59.99, b: 15, c: 4.5, d: 50 },
    { a: 6.17, b: 35, c: 7, d: 5 },
  ];
  for (const d of designs) {
    const design = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, String(v)]));
    const mm = model(pop, design);
    assert.equal(mm.errors.length, 0);
    const m = shopOf(mm.values);
    const ans = answersOf(m);
    for (const q of mm.checks)
      assert.ok(
        Math.abs(toNumber(ans[q.id]) - q.answer) < 1e-9,
        `${q.id} for ${JSON.stringify(d)}`,
      );
  }
});

test("receipts equal the integer oracle on many baskets", () => {
  const shop0 = cleanShop(null);
  let s = stock(shop0, "stickers").shop;
  s = stock(s, "tote").shop;
  s = stock(s, "bookmark").shop;
  const ids = ["tag", ...s.shelf.map((x) => x.id)];
  let checked = 0;
  for (const [b, c10] of [
    [25, 40],
    [15, 45],
    [35, 70],
    [5, 0],
    [75, 100],
  ])
    for (let seed = 0; seed < 40; seed++) {
      const qty = ids.map((_, i) => (seed * (i + 3) + i) % 4);
      let shop = s;
      ids.forEach((id, i) => (shop = setQty(shop, "b1", id, qty[i])));
      const values = { a: 60, b, c: c10 / 10, d: 65 };
      const m = shopOf(values);
      const r = receipt(shop, "b1", missionOffer(m), m);
      const unit = { tag: 6000n, s1: 350n, s2: 1200n, s3: 120n };
      const gross = ids.reduce((sum, id, i) => sum + unit[id] * BigInt(qty[i]), 0n);
      assert.equal(cents(r.gross), gross);
      const o = oracle(gross, b, c10, 6500n);
      assert.equal(hundredths(r.discount), o.discount);
      assert.equal(hundredths(r.sale), o.sale);
      assert.equal(cents(r.tax), o.taxCents);
      assert.equal(cents(r.total), o.totalCents);
      assert.equal(cents(r.change), o.changeCents);
      assert.equal(r.within, o.totalCents <= 6500n);
      checked++;
    }
  assert.equal(checked, 200);
});

test("negative controls: corrupted totals and tax on the original price are rejected", () => {
  const m = shopOf({ a: 60, b: 25, c: 4, d: 65 });
  const r = ring(m.a, missionOffer(m), m);
  const o = oracle(6000n, 25, 40, 6500n);
  assert.notEqual(cents(r.total) + 1n, o.totalCents);
  // The misconception: tax on the ORIGINAL price (6000 × 4% = 240) gives a different total.
  const wrongTotal = 4500n + 240n;
  assert.notEqual(cents(r.total), wrongTotal);
  assert.equal(cents(r.total), 4680n);
  // A math.mjs answer nudged by one cent must not be treated as equal.
  assert.ok(Math.abs(toNumber(answersOf(m).total) - (46.8 + 0.01)) > 0.005);
});

test("hidden-answer guard: the mission basket masks all five amounts, other baskets do not", () => {
  const m = shopOf({ a: 60, b: 25, c: 4, d: 65 });
  const shop = cleanShop(null);
  const tagOnly = receipt(shop, "b1", missionOffer(m), m);
  assert.deepEqual(guardKeys(tagOnly, m).sort(), ["change", "discount", "sale", "tax", "total"]);
  let s = stock(shop, "stickers").shop;
  s = setQty(setQty(s, "b1", "tag", 0), "b1", s.shelf[0].id, 2);
  assert.deepEqual(guardKeys(receipt(s, "b1", missionOffer(m), m), m), []);
  // A shelf basket that sums to the mission price is the same receipt, so it is masked too.
  let t = stock(cleanShop(null), "tote").shop;
  t = setQty(setQty(t, "b1", "tag", 0), "b1", t.shelf[0].id, 5); // 5 × $12 = $60
  assert.equal(guardKeys(receipt(t, "b1", missionOffer(m), m), m).length, 5);
});

test("report withholds mission answers and lists shelf and receipts", () => {
  const values = { a: 60, b: 25, c: 4, d: 65 };
  const lines = shopReport(cleanShop(null), values).join("\n");
  for (const secret of ["$15.00", "$45.00", "$1.80", "$46.80", "$18.20", "0.25"])
    assert.ok(!lines.includes(secret), secret);
  assert.ok(lines.includes("(see your Test answer)"));
  let s = stock(cleanShop(null), "pins").shop;
  s = setQty(setQty(s, "b1", "tag", 0), "b1", s.shelf[0].id, 4); // $9.00 → $6.75 sale, $0.27 tax, $7.02
  const text = shopReport(s, values).join("\n");
  assert.ok(text.includes("$7.02") && text.includes("$6.75") && text.includes("$0.27"), text);
});

test("prices, coupons and comparison", () => {
  assert.equal(parsePrice("3.505"), null);
  assert.equal(parsePrice("0.10"), null);
  assert.equal(parsePrice("201"), null);
  assert.deepEqual(parsePrice("$3.50"), { n: 7n, d: 2n });
  assert.equal(parseCoupon({ kind: "percent", amount: "12.5" }), null);
  assert.equal(parseCoupon({ kind: "percent", amount: "95" }), null);
  assert.equal(parseCoupon({ kind: "dollars", amount: "10" }).kind, "dollars");
  const m = shopOf({ a: 60, b: 25, c: 5, d: 65 });
  let s = stock(cleanShop(null), "keychain").shop;
  s = setQty(s, "b1", s.shelf[0].id, 2); // $60 + $11 = $71
  s = { ...s, coupon: { kind: "dollars", amount: "20" } };
  const cmp = compareOffers(s, "b1", m);
  // A: 71 × 0.75 = 53.25, tax 2.6625 → 2.66, total 55.91. B: 51.00, tax 2.55, total 53.55.
  assert.equal(money(cmp.a.total), "$55.91");
  assert.equal(money(cmp.b.total), "$53.55");
  assert.equal(cmp.better, "B");
  assert.equal(money(cmp.gap), "$2.36");
  // Dollars off can never push a sale below zero.
  const big = { ...s, coupon: { kind: "dollars", amount: "200" } };
  assert.equal(money(compareOffers(big, "b1", m).b.total), "$0.00");
});

test("money prints exact sub-cent decimals and negatives", () => {
  assert.equal(money({ n: 179970n, d: 20000n }), "$8.9985");
  assert.equal(money({ n: -328n, d: 100n }), "−$3.28");
  assert.equal(money({ n: 5n, d: 1n }), "$5.00");
});

test("edits: stock, unstock, step, quantities and constraint verdicts", () => {
  let s = cleanShop(null);
  for (let i = 0; i < 6; i++) s = stock(s, "pins").shop;
  assert.equal(stock(s, "pins").error, "full");
  s = setQty(s, "b1", "s2", 3);
  s = unstock(s, "s2");
  assert.equal(s.baskets[0].qty.s2, undefined);
  assert.equal(stepPrice(s, "s1", -20).shelf[0].price, "0.25");
  assert.equal(setQty(s, "b1", "tag", 99).baskets[0].qty.tag, 20);
  const m = shopOf({ a: 60, b: 25, c: 4, d: 40 });
  const bad = { ...s, shelf: s.shelf.map((x, i) => (i ? x : { ...x, price: "abc" })) };
  const v = evaluateShop(bad, m);
  assert.equal(v.pricesOk, false);
  assert.equal(v.allWithin, false); // $46.80 > $40
});

test("cleanShop rejects garbage and keeps valid data", () => {
  assert.deepEqual(cleanShop("x"), cleanShop(null));
  const c = cleanShop({
    shelf: [
      { id: "s1", type: "pins", price: "2.25" },
      { id: "s1", type: "pins" },
      { id: "zz", type: "pins" },
      { id: "s2", type: "rocket" },
    ],
    baskets: [
      { id: "b1", qty: { tag: 2, s1: 1, s9: 3, x: -1 } },
      { id: "b1", qty: {} },
      { id: "b2", qty: { s1: 1.5 } },
    ],
    active: "b2",
    sel: "s9",
    coupon: { kind: "percent", amount: "15" },
  });
  assert.equal(c.shelf.length, 1);
  assert.deepEqual(c.baskets, [
    { id: "b1", qty: { tag: 2, s1: 1 } },
    { id: "b2", qty: {} },
  ]);
  assert.equal(c.active, "b2");
  assert.equal(c.sel, "tag");
  assert.equal(c.coupon.kind, "percent");
});

test("registry and checkpoints carry the shop", () => {
  assert.equal(DESIGNERS.percent.key, "shop");
  const design = Object.fromEntries(Object.entries(pop.defaults).map(([k, v]) => [k, String(v)]));
  const extra = { ...stock(cleanShop(null), "tote").shop, junk: 1 };
  const r = addCheckpoint(pop, [], { name: "A", reason: "", design, matched: 0, extra });
  assert.equal(r.entry.extra.shelf.length, 1);
  assert.equal(r.entry.extra.junk, undefined);
  assert.equal(cleanCheckpoints(pop, [r.entry])[0].extra.shelf[0].type, "tote");
});

console.log(`project-studio-percent-shop: ${n} tests passed`);
