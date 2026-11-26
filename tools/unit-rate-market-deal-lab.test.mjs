#!/usr/bin/env node
/* Unit Rate Market Mission · Deal Lab: independent checks of every generated item.
 * The page's modules use curriculum/projects/studio/exact.mjs; this test recomputes with a
 * DIFFERENT exact implementation (scripts/lib/rational.mjs, class Rat) from the raw shelf numbers,
 * over 300 seeds per family, and proves its own verifier rejects corrupted items. */
import assert from "node:assert/strict";
import { Rat } from "../scripts/lib/rational.mjs";
import {
  bestBuy,
  fmtExact,
  parseMoney,
  parsePrice,
  purchase,
  rng,
  unitPrice,
} from "../curriculum/unit-rate-market-mission/deal-lab-core.mjs";
import {
  CREATE_FAMILIES,
  changeTruth,
  checkChange,
  checkCreate,
  makeCreateItem,
} from "../curriculum/unit-rate-market-mission/deal-lab-create.mjs";
import {
  FAMILIES,
  checkExplain,
  checkPick,
  checkStep,
  checkUnit,
  makeShopperItem,
  makeSolveItem,
} from "../curriculum/unit-rate-market-mission/deal-lab-items.mjs";
import { ratioRows } from "../curriculum/unit-rate-market-mission/deal-lab-draw.mjs";

const SEEDS = 300;
let checks = 0;
const ok = (cond, msg) => {
  checks += 1;
  assert.ok(cond, msg);
};
const R = (n, d = 1) => new Rat(BigInt(n), BigInt(d));
const lt = (a, b) => a.n * b.d < b.n * a.d;
const money = (centsRat) => {
  // exact dollars text for a whole-cents Rat
  const c = Number(centsRat.n);
  return `$${Math.floor(c / 100)}.${String(c % 100).padStart(2, "0")}`;
};

/** Independent unit price (cents per item / per OUNCE) straight from the shelf numbers. */
function indepUnit(s) {
  const qty = s.measure === "lb" ? s.qty * 16 : s.qty;
  if (s.rule === "b2g1") return R(2 * s.cents, 3 * qty);
  return R(s.cents, qty);
}
/** Every "a ÷ b = c" written in a step must be true arithmetic (the mistakes are in the reasoning). */
function divisionsTrue(text) {
  const bad = [];
  const num = (t) => Rat.fromDecimal(t.replace("$", ""));
  for (const m of text.matchAll(/(\$?\d+(?:\.\d+)?) ÷ (\$?\d+(?:\.\d+)?) = (\$?\d+(?:\.\d+)?)/g)) {
    const [a, b, c] = [num(m[1]), num(m[2]), num(m[3])];
    if (!a.div(b).eq(c)) bad.push(m[0]);
  }
  return bad;
}
function verifyBetterBuy(item) {
  const problems = [];
  const u = { A: indepUnit(item.stores.A), B: indepUnit(item.stores.B) };
  for (const L of ["A", "B"]) {
    if (!u[L].isInt()) problems.push(`${L}: unit price ${u[L]} is not a whole number of cents`);
    if (!u[L].eq(R(item.targets[L]))) problems.push(`${L}: target ${item.targets[L]} != ${u[L]}`);
  }
  if (u.A.eq(u.B)) problems.push("tie");
  const best = lt(u.A, u.B) ? "A" : "B";
  if (best !== item.answer) problems.push(`answer ${item.answer} != ${best}`);
  return { problems, u, best };
}
function verifyShopper(item) {
  const { problems } = verifyBetterBuy(item);
  const S = item.stores;
  const f = item.family;
  if (item.shopperPick === item.answer) problems.push("the shopper's pick is not wrong");
  // The flawed method really leads to the shopper's pick.
  let flawed;
  if (f === "total") flawed = S.A.cents < S.B.cents ? "A" : "B";
  if (f === "flip") flawed = lt(R(S.A.qty, S.A.cents), R(S.B.qty, S.B.cents)) ? "A" : "B";
  if (f === "convert") flawed = lt(R(S.A.cents, S.A.qty), R(S.B.cents, S.B.qty)) ? "A" : "B";
  if (f === "bogo") flawed = lt(R(S.A.cents, S.A.qty), R(S.B.cents, S.B.qty)) ? "A" : "B";
  if (flawed !== item.shopperPick)
    problems.push(`flawed method picks ${flawed}, item says ${item.shopperPick}`);
  if (!(item.wrongStep >= 1 && item.wrongStep < item.steps.length))
    problems.push("wrongStep out of range");
  for (const s of item.steps)
    problems.push(...divisionsTrue(s.text).map((x) => `false arithmetic: ${x}`));
  return problems;
}

// ---- core ----
ok(
  parseMoney("$0.45").cents.n === 45n &&
    parseMoney(".45").cents.n === 45n &&
    parseMoney("45¢").cents.n === 45n,
  "money parsing",
);
ok(parseMoney("0.4").cents.n === 40n, "0.4 dollars = 40 cents");
ok(
  parsePrice("1.234").error === "partCent" && parsePrice("3.25").cents === 325,
  "price needs whole cents",
);
ok(parseMoney("abc").error && parseMoney("-1").error, "bad money rejected");
ok(
  fmtExact({ n: 85n, d: 2n }).text === "$0.425" && fmtExact({ n: 40n, d: 3n }).exact === false,
  "exact vs about",
);
{
  const d = { qty: 6, cents: 300, rule: "b2g1" };
  const p = purchase(d);
  ok(p.qty === 18n && p.cost.n === 600n, "b2g1 = 3 packs for the price of 2");
  const u = unitPrice({ qty: 10, cents: 500, rule: "off20" });
  ok(R(500 * 80, 100 * 10).eq(R(Number(u.n), Number(u.d))), "20% off unit price");
  // Ratio-table rows agree with the unit price (same source for every view).
  for (const r of ratioRows({ qty: 7, cents: 455, rule: "off25" })) {
    const cost = R(Number(r.cost.n), Number(r.cost.d));
    ok(cost.eq(R(455 * 75, 100 * 7).mul(R(Number(r.items)))), "ratio row on the unit-price line");
  }
}

// ---- shopper + solve items ----
const answers = { A: 0, B: 0 };
for (const fam of FAMILIES) {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const item = makeShopperItem(seed, fam);
    ok(
      JSON.stringify(item) === JSON.stringify(makeShopperItem(seed, fam)),
      `reproducible ${fam} ${seed}`,
    );
    const probs = verifyShopper(item);
    assert.deepEqual(probs, [], `${fam} seed ${seed}: ${probs.join("; ")}`);
    checks += 1;
    answers[item.answer] += 1;
    item.steps.forEach((_, i) =>
      ok(checkStep(item, i).ok === (i === item.wrongStep), "step check"),
    );
    ok(checkExplain(item, fam, fam).ok, "right explanation accepted");
    for (const g of FAMILIES)
      if (g !== fam)
        ok(
          !checkExplain(item, g, fam).ok && !checkExplain(item, fam, g).ok,
          "wrong explanation rejected",
        );
    for (const L of ["A", "B"]) {
      const target = R(item.targets[L]);
      ok(
        checkUnit(item, L, money(target)).status === "right",
        `right unit price accepted ${fam} ${seed}`,
      );
      ok(
        checkUnit(item, L, money(target.add(R(1)))).status !== "right",
        "corrupted unit price rejected",
      );
      const s = item.stores[L];
      ok(checkUnit(item, L, money(R(s.cents))).status === "total", "whole-package price diagnosed");
      if (s.measure === "lb" && s.qty > 1 && R(s.cents, s.qty).isInt())
        ok(checkUnit(item, L, money(R(s.cents, s.qty))).status === "perlb", "per-pound diagnosed");
      if (s.rule === "b2g1")
        ok(
          checkUnit(item, L, money(R(s.cents, s.qty))).status === "nodeal",
          "ignored deal diagnosed",
        );
      const flip = R((s.measure === "lb" ? s.qty * 16 : s.qty) * 10000, s.cents);
      // When the flipped value coincides with another mistake's value, that mistake is named instead.
      const others = [
        R(s.cents),
        ...(s.measure === "lb" || s.rule === "b2g1"
          ? [R(s.cents, s.qty), R(2 * s.cents, s.qty)]
          : []),
      ];
      if (flip.isInt() && !flip.eq(target) && !others.some((o) => o.eq(flip)))
        ok(checkUnit(item, L, money(flip)).status === "flip", "flipped division diagnosed");
    }
    ok(checkPick(item, item.answer).ok && !checkPick(item, item.shopperPick).ok, "better-buy pick");
    // Page arithmetic (exact.mjs) agrees with the independent Rat arithmetic.
    const deal = (L) => ({
      qty: item.stores[L].measure === "lb" ? item.stores[L].qty * 16 : item.stores[L].qty,
      cents: item.stores[L].cents,
      rule: item.stores[L].rule,
    });
    ok(bestBuy(deal("A"), deal("B")) === item.answer, "page bestBuy agrees");

    const solve = makeSolveItem(seed + 7, fam);
    assert.deepEqual(verifyBetterBuy(solve).problems, [], `solve ${fam} ${seed}`);
    checks += 1;
  }
}
ok(
  answers.A > SEEDS * 0.3 && answers.B > SEEDS * 0.3,
  `answer letter balanced (${answers.A}/${answers.B})`,
);
// Negative controls: the verifier must catch corrupted items.
{
  const item = makeShopperItem(42, "total");
  const t = JSON.parse(JSON.stringify(item));
  t.targets[t.answer] += 1;
  ok(verifyShopper(t).length > 0, "verifier catches a corrupted target");
  const a = JSON.parse(JSON.stringify(item));
  a.answer = a.shopperPick;
  ok(verifyShopper(a).length > 0, "verifier catches a wrong answer key");
  const s = JSON.parse(JSON.stringify(makeShopperItem(9, "flip")));
  s.steps[0].text += " 12 ÷ $3.00 = $5.00";
  ok(verifyShopper(s).length > 0, "verifier catches false arithmetic");
}

// ---- create a deal ----
function pred(item, size, price) {
  for (const c of item.conditions) {
    if (c.kind === "unit") {
      const mine = R(price, size);
      const ref = R(item.refs[c.ref].cents, item.refs[c.ref].qty);
      const rel = lt(mine, ref) ? "lt" : mine.eq(ref) ? "eq" : "gt";
      if (rel !== c.rel) return false;
    } else if (c.kind === "total") {
      if (c.rel === "gt" ? !(price > c.cents) : !(price < c.cents)) return false;
    } else if (size === c.qty) return false;
  }
  return true;
}
for (const fam of CREATE_FAMILIES) {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const item = makeCreateItem(seed, fam);
    ok(JSON.stringify(item) === JSON.stringify(makeCreateItem(seed, fam)), "create reproducible");
    for (const ref of Object.values(item.refs))
      ok(R(ref.cents, ref.qty).eq(R(ref.unit)), "reference unit price is whole cents");
    // Independent search for a valid package proves the item is solvable.
    let found = null;
    for (let size = 1; size <= 200 && !found; size++) {
      const cands = [];
      for (const ref of Object.values(item.refs))
        cands.push(ref.unit * size - 1, ref.unit * size, ref.unit * size + 1);
      for (const c of item.conditions) if (c.kind === "total") cands.push(c.cents - 1, c.cents + 1);
      for (const p of cands) if (p >= 1 && p <= 99999 && pred(item, size, p)) found = [size, p];
    }
    ok(found, `create ${fam} ${seed} is solvable`);
    ok(checkCreate(item, String(found[0]), (found[1] / 100).toFixed(2)).ok, "valid deal accepted");
    // Random candidates: the page checker and the independent predicate always agree.
    const r = rng(seed * 13 + 1);
    for (let k = 0; k < 40; k++) {
      const size = 1 + Math.floor(r() * 60);
      const price = 1 + Math.floor(r() * 4000);
      const res = checkCreate(item, String(size), (price / 100).toFixed(2));
      ok(res.ok === pred(item, size, price), `checker agrees ${fam} ${seed} ${size} ${price}`);
      if (!res.ok)
        ok(
          res.results.some((x) => !x.ok && x.msg.length > 20),
          "a failed condition is explained",
        );
    }
    ok(
      checkCreate(item, "2.5", "1.00").input === "size" &&
        checkCreate(item, "3", "1.005").input === "price",
      "bad input named",
    );
  }
}
// Negative controls for the predicate itself.
{
  const it = makeCreateItem(5, "sameRate");
  const u = it.refs.A.unit;
  ok(
    pred(it, it.refs.A.qty + 1, u * (it.refs.A.qty + 1)) &&
      !pred(it, it.refs.A.qty + 1, u * (it.refs.A.qty + 1) + 1),
    "same-rate control",
  );
  ok(
    !checkCreate(it, String(it.refs.A.qty), (it.refs.A.cents / 100).toFixed(2)).ok,
    "same size as A rejected",
  );
}

// ---- What-If explanations ----
{
  const r = rng(2026);
  const rules = ["none", "b2g1", "off10", "off20", "off25", "off50"];
  for (let k = 0; k < 400; k++) {
    const mk = () => ({
      qty: 1 + Math.floor(r() * 30),
      cents: 5 * (1 + Math.floor(r() * 200)),
      rule: rules[Math.floor(r() * rules.length)],
    });
    const before = { A: mk(), B: mk() };
    const after = JSON.parse(JSON.stringify(before));
    const f = r() < 0.5 ? "A" : "B";
    const field = ["qty", "cents", "rule"][Math.floor(r() * 3)];
    if (field === "qty") after[f].qty = Math.max(1, after[f].qty + (r() < 0.5 ? -1 : 3));
    else if (field === "cents")
      after[f].cents = Math.max(5, after[f].cents + (r() < 0.5 ? -15 : 25));
    else after[f].rule = rules[(rules.indexOf(after[f].rule) + 1) % rules.length];
    const t = changeTruth(before, after, f);
    // Independent direction from Rat.
    const ru = (d) => {
      const q = d.rule === "b2g1" ? 3 * d.qty : d.qty;
      const c = d.rule === "b2g1" ? 2 * d.cents : d.cents;
      const off = /^off(\d+)$/.exec(d.rule);
      return off ? R(c * (100 - Number(off[1])), 100 * q) : R(c, q);
    };
    const u0 = ru(before[f]);
    const u1 = ru(after[f]);
    const dir = u1.eq(u0) ? "same" : lt(u1, u0) ? "down" : "up";
    ok(t.dir === dir, "change direction");
    if (!t.causes.length) continue;
    const cause = t.causes[0];
    const res = checkChange(before, after, f, { dir, cause, best: t.best });
    const consistent =
      dir === "same" ||
      cause === "rule" ||
      { bigger: "down", smaller: "up", pricier: "up", cheaper: "down" }[cause] === dir;
    ok(res.ok === consistent, "explanation judged");
    ok(
      !checkChange(before, after, f, { dir: dir === "up" ? "down" : "up", cause, best: t.best }).ok,
      "wrong direction rejected",
    );
    ok(
      !checkChange(before, after, f, { dir, cause, best: t.best === "same" ? "changed" : "same" })
        .ok,
      "wrong best-buy claim rejected",
    );
  }
}

console.log(`unit-rate-market-deal-lab: ${checks} checks passed (${SEEDS} seeds per family).`);
