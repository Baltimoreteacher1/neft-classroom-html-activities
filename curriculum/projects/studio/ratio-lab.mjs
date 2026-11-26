/**
 * Ratio lab for the ratio missions: the Smoothie Bar mixing station (unit-3-a) and the Sports Stats Scout
 * rate comparator (unit-3-b). Pure; no DOM. Every quantity is an exact fraction (exact.mjs).
 *
 * The design numbers stay the single source of truth (a : b base ratio, scale factor c, offers/players
 * d/e and f/g). This module only adds the student's own exploration, stored under `workbench.ratiolab`:
 * a batch count, a taste-test attempt, a purchase plan, per-attempt stats and a comparison basis.
 *
 * Hidden-answer rule: the six answers are scale-a (a·c), scale-b (b·c), base-rate (a/b), rate-a (d/e),
 * rate-b (f/g) and difference (|d/e − f/g|). Helpers below return `guard` ids so the view prints "?"
 * for any value equal to one of those answers until it is checked in Test.
 */
import { abs, cmp, eq, frac, gcd, mul, num, parse, sub, add } from "./exact.mjs";

export const MAX_BATCH = 20;
export const MAX_PACKS = 50;
export const INGREDIENTS = {
  mango: { en: "Mango", es: "Mango", color: "#f2b33d" },
  strawberry: { en: "Strawberry", es: "Fresa", color: "#d9534f" },
  banana: { en: "Banana", es: "Plátano", color: "#f3e08a" },
  spinach: { en: "Spinach", es: "Espinaca", color: "#5c9e4f" },
  yogurt: { en: "Yogurt", es: "Yogur", color: "#f4f1ea" },
  oat: { en: "Oat milk", es: "Leche de avena", color: "#e3d3b4" },
  pineapple: { en: "Pineapple", es: "Piña", color: "#f6d55c" },
  blueberry: { en: "Blueberry", es: "Arándano", color: "#3d5a9e" },
};
export const INGREDIENT_KEYS = Object.keys(INGREDIENTS);
export const BASES = ["total", "game", "attempt"];

const clip = (s, n) => String(s ?? "").slice(0, n);
const int = (v, lo, hi, dflt) => (Number.isInteger(v) && v >= lo && v <= hi ? v : dflt);

/** Validate stored lab data. Never throws; garbage becomes the starting lab. */
export function cleanRatioLab(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const ia = INGREDIENT_KEYS.includes(r.ia) ? r.ia : "mango";
  let ib = INGREDIENT_KEYS.includes(r.ib) ? r.ib : "yogurt";
  if (ib === ia) ib = ia === "yogurt" ? "mango" : "yogurt";
  return {
    kind: r.kind === "scout" ? "scout" : "smoothie",
    ia,
    ib,
    k: int(r.k, 1, MAX_BATCH, 1),
    tx: clip(r.tx, 8),
    ty: clip(r.ty, 8),
    na: int(r.na, 0, MAX_PACKS, 0),
    nb: int(r.nb, 0, MAX_PACKS, 0),
    budget: clip(r.budget, 8),
    attA: clip(r.attA, 6),
    attB: clip(r.attB, 6),
    basis: BASES.includes(r.basis) ? r.basis : "total",
    common: int(r.common, 0, 100000, 0),
  };
}

/** The mission numbers, exact. Null when the design is invalid. */
export function ratioOf(values) {
  if (!values) return null;
  const out = {};
  for (const k of ["a", "b", "c", "d", "e", "f", "g"]) {
    if (typeof values[k] !== "number" || !Number.isFinite(values[k]) || values[k] <= 0) return null;
    out[k] = num(String(values[k]));
    if (!out[k]) return null;
  }
  return out;
}

const div = (x, y) => frac(x.n * y.d, x.d * y.n);
const of = (n) => frac(BigInt(n));

/** The mission's six answers, exact (the same formulas as math.mjs case "ratio"). */
export function answersOf(r) {
  const rateA = div(r.d, r.e), rateB = div(r.f, r.g);
  return {
    "scale-a": mul(r.a, r.c),
    "scale-b": mul(r.b, r.c),
    "base-rate": div(r.a, r.b),
    "rate-a": rateA,
    "rate-b": rateB,
    difference: abs(sub(rateA, rateB)),
  };
}
/** Question ids whose answer equals `value` (so the view must hide it until checked). */
export function guardFor(value, r, ids) {
  const ans = answersOf(r);
  return ids.filter((id) => eq(value, ans[id]));
}

/**
 * Ratio table rows: n copies of the base ratio for n = 1..6 (and the student's batch count when larger).
 * A row whose A or B equals scale-a / scale-b is flagged so the view can mask it.
 */
export function tableRows(r, k) {
  const ns = [1, 2, 3, 4, 5, 6];
  if (k > 6) ns.push(k);
  return ns.map((n) => {
    const A = mul(r.a, of(n)), B = mul(r.b, of(n));
    const guardA = guardFor(A, r, ["scale-a"]), guardB = guardFor(B, r, ["scale-b"]);
    return { n, A, B, total: add(A, B), guardA, guardB };
  });
}

/**
 * Taste test: is the student's batch x : y equivalent to a : b? Names the additive-scaling misconception
 * (the same amount added to both parts) and says which ingredient a non-equivalent batch tastes more of.
 */
export function tasteTest(r, xText, yText) {
  const x = parse(xText), y = parse(yText);
  if (!x || !y || x.n <= 0n || y.n <= 0n || cmp(x, of(10000)) > 0 || cmp(y, of(10000)) > 0) return { status: "invalid" };
  const fa = div(x, r.a), fb = div(y, r.b);
  if (eq(fa, fb)) return { status: "equivalent", factor: fa, x, y };
  const richer = cmp(fa, fb) > 0 ? "A" : "B";
  const dA = sub(x, r.a), dB = sub(y, r.b);
  if (eq(dA, dB)) return { status: "additive", added: dA, richer, x, y, fa, fb };
  return { status: "different", fa, fb, richer, x, y };
}

/** Purchase plan for k batches: ingredient A needed (1 part = 1 cup), cups bought, cost, leftover, budget. */
export function purchase(r, lab) {
  const need = mul(r.a, of(lab.k));
  const bought = add(mul(of(lab.na), r.e), mul(of(lab.nb), r.g));
  const cost = add(mul(of(lab.na), r.d), mul(of(lab.nb), r.f));
  const budget = parse(lab.budget);
  const validBudget = budget && budget.n > 0n ? budget : null;
  const covers = cmp(bought, need) >= 0;
  return {
    need,
    bought,
    cost,
    covers,
    leftover: covers ? sub(bought, need) : null,
    short: covers ? null : sub(need, bought),
    budget: validBudget,
    within: validBudget ? cmp(cost, validBudget) <= 0 : null,
    guardNeed: guardFor(need, r, ["scale-a"]),
  };
}

/* ------------------------------------------------------------------ scout */
const isWhole = (x) => x.d === 1n;
/** Common game counts both players can be scaled to with whole multipliers (first three, up to 1000). */
export function commonGames(r) {
  if (!isWhole(r.e) || !isWhole(r.g)) return [];
  const l = (r.e.n * r.g.n) / gcd(r.e.n, r.g.n);
  return [1n, 2n, 3n].map((m) => l * m).filter((v) => v <= 1000n).map(Number);
}
/** Both players projected to G games at their own constant rate. Values equal to an answer are guarded. */
export function projection(r, G) {
  const g = of(G);
  const pA = div(mul(r.d, g), r.e), pB = div(mul(r.f, g), r.g);
  const c = cmp(pA, pB);
  const gap = abs(sub(pA, pB));
  return {
    G,
    pA,
    pB,
    leader: c > 0 ? "A" : c < 0 ? "B" : "tie",
    gap,
    guardA: guardFor(pA, r, ["rate-a"]),
    guardB: guardFor(pB, r, ["rate-b"]),
    guardGap: guardFor(gap, r, ["difference"]),
  };
}
/** Points per attempt from the student's own attempts stat. Null when attempts is not a positive whole. */
export function perAttempt(points, attemptsText) {
  const att = parse(attemptsText);
  if (!att || att.d !== 1n || att.n <= 0n || att.n > 100000n) return null;
  return div(points, att);
}
/** Is a comparison by totals fair? Only when both players had the same number of games. */
export const totalsFair = (r) => eq(r.e, r.g);

/** Graph points (games, points) for each player at 1, 2, 3 times their own record. */
export const graphPoints = (r) => ({
  A: [1, 2, 3].map((m) => [mul(r.e, of(m)), mul(r.d, of(m))]),
  B: [1, 2, 3].map((m) => [mul(r.g, of(m)), mul(r.f, of(m))]),
});

/** Exact number text: whole, terminating decimal, or a fraction n/d. */
export function show(raw) {
  const x = frac(raw.n, raw.d);
  if (x.d === 1n) return x.n.toString();
  let d = x.d, twos = 0, fives = 0;
  while (d % 2n === 0n) [d, twos] = [d / 2n, twos + 1];
  while (d % 5n === 0n) [d, fives] = [d / 5n, fives + 1];
  if (d !== 1n) return `${x.n}/${x.d}`;
  const places = Math.max(twos, fives);
  const neg = x.n < 0n;
  const s = (((neg ? -x.n : x.n) * 10n ** BigInt(places)) / x.d).toString().padStart(places + 1, "0");
  return `${neg ? "−" : ""}${s.slice(0, -places)}.${s.slice(-places)}`;
}
export const dollars = (x) => (x.d === 1n || (x.n * 100n) % x.d === 0n ? `$${(Number(x.n * 100n / x.d) / 100).toFixed(2)}` : `$${show(x)}`);

/** Plain-text report lines. Values equal to a mission answer are withheld (the Test stage owns them). */
export function ratioReport(lab, values, fmt = String) {
  const r = ratioOf(values);
  if (!r) return [];
  const hide = (value, ids) => (guardFor(value, r, ids).length ? "(see your Test answer)" : show(value));
  if (lab.kind === "scout") {
    const out = ["SCOUTING CARD", `Player A: ${show(r.d)} points in ${show(r.e)} games · Player B: ${show(r.f)} points in ${show(r.g)} games`];
    out.push(`Comparison basis chosen: ${lab.basis === "game" ? "points per game" : lab.basis === "attempt" ? "points per attempt" : "total points"}${lab.basis === "total" && !totalsFair(r) ? " (not fair: the players had different numbers of games)" : ""}`);
    const aA = perAttempt(r.d, lab.attA), aB = perAttempt(r.f, lab.attB);
    if (aA && aB) out.push(`Points per attempt: A ${show(aA)} (${lab.attA} attempts), B ${show(aB)} (${lab.attB} attempts)`);
    if (lab.common) {
      const p = projection(r, lab.common);
      out.push(`Both projected to ${lab.common} games: A ${hide(p.pA, ["rate-a"])} points, B ${hide(p.pB, ["rate-b"])} points (a prediction, not a guarantee)`);
    }
    out.push("");
    return out;
  }
  const nameA = INGREDIENTS[lab.ia].en, nameB = INGREDIENTS[lab.ib].en;
  const out = ["SMOOTHIE RECIPE CARD", `Base recipe: ${show(r.a)} parts ${nameA} : ${show(r.b)} parts ${nameB} (${nameA} is ${show(r.a)} of every ${show(add(r.a, r.b))} parts)`];
  const rows = tableRows(r, lab.k);
  out.push(`Ratio table: ${rows.map((row) => `${row.n} batch${row.n === 1 ? "" : "es"} ${row.guardA.length ? "?" : show(row.A)} : ${row.guardB.length ? "?" : show(row.B)}`).join(" · ")}`);
  const taste = tasteTest(r, lab.tx, lab.ty);
  if (taste.status !== "invalid") out.push(`Taste test ${show(taste.x)} : ${show(taste.y)}: ${taste.status === "equivalent" ? `same taste (both parts × ${show(taste.factor)})` : taste.status === "additive" ? "different taste (the same amount was added to both parts)" : "different taste (the parts were scaled by different factors)"}`);
  const p = purchase(r, lab);
  if (lab.na || lab.nb) out.push(`Purchase for ${lab.k} batch${lab.k === 1 ? "" : "es"}: ${lab.na} × Offer A, ${lab.nb} × Offer B = ${show(p.bought)} cups of ${nameA} for ${dollars(p.cost)}; needs ${hide(p.need, ["scale-a"])} cups; covers the recipe: ${p.covers ? "yes" : "NO"}${p.within === null ? "" : `; within the $${fmt(Number(p.budget.n) / Number(p.budget.d))} budget: ${p.within ? "yes" : "NO"}`}`);
  out.push("");
  return out;
}
