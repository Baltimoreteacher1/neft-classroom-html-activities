/**
 * Supply-plan simulator for the division missions (Launch Day Supply Depot, Block Party Planner,
 * Build-a-Bot Budget Lab, Deep Space Supply Mission). Pure; no DOM. Exact rational arithmetic.
 *
 * The design numbers stay the single source of truth (a people, b per group, c budget, d pack price,
 * e material length, f piece length). The student's PLAN is stored under `workbench.supply`:
 *   groups  how many tables / pods / crews they set up
 *   packs   how many complete supply packs they buy
 *   cuts    how many pieces they cut from the material
 *   limit   a cap on groups (Block Party twist: one table is unavailable)
 *   twist   { key, from, to } once the mission twist has been applied
 * The simulation reports consequences of the plan (seats provided, cost, material used, constraint
 * verdicts). It never computes the six Test answers (groups needed, remainder, complete packs, money
 * left, exact quotient, leftover length); the view shows those only after they are checked.
 */
import { cmp, mul, num, show, sub } from "./exact.mjs";

export const MAX_COUNT = 9999;
const count = (n) => (Number.isInteger(n) && n >= 0 && n <= MAX_COUNT ? n : 0);

export const TWISTS = {
  "pre-unit-a": { key: "a", delta: 12, en: "Twelve more people arrive.", es: "Llegan doce personas más." },
  "unit-1-a": { key: "limit", en: "One table is unavailable: you may use one table fewer than your plan.", es: "Una mesa no está disponible: puedes usar una mesa menos que en tu plan." },
  "unit-1-b": { key: "f", delta: 0.25, en: "Each wire segment must be 0.25 m longer.", es: "Cada segmento de alambre debe medir 0.25 m más." },
  "unit-1-c": { key: "b", delta: -4, en: "Each shuttle loses four seats.", es: "Cada transbordador pierde cuatro asientos." },
};

export const empty = () => ({ groups: 0, packs: 0, cuts: 0, limit: null, twist: null });

/** Validate stored plan data. Never throws. */
export function cleanPlan(raw) {
  const out = empty();
  if (!raw || typeof raw !== "object") return out;
  out.groups = count(raw.groups);
  out.packs = count(raw.packs);
  out.cuts = count(raw.cuts);
  out.limit = Number.isInteger(raw.limit) && raw.limit >= 1 && raw.limit <= MAX_COUNT ? raw.limit : null;
  const t = raw.twist;
  if (t && ["a", "b", "f", "limit"].includes(t.key) && Number.isFinite(t.from) && Number.isFinite(t.to)) out.twist = { key: t.key, from: t.from, to: t.to };
  return out;
}

/** Exact copies of the design numbers the simulator needs (null when the design is invalid). */
export function numbersOf(values) {
  if (!values) return null;
  const keys = ["a", "b", "c", "d", "e", "f"];
  if (!keys.every((k) => Number.isFinite(values[k]) && values[k] > 0)) return null;
  const out = {};
  for (const k of keys) out[k] = num(values[k]);
  return out.a && out.f ? { ...out, raw: values } : null;
}

const N = (n) => num(n);

/** Consequences of the plan. Every number here is the plan's own result, never a Test answer. */
export function evaluate(plan, x) {
  const seats = mul(N(plan.groups), x.b);
  const cost = mul(N(plan.packs), x.d);
  const used = mul(N(plan.cuts), x.f);
  const everyone = cmp(seats, x.a) >= 0;
  // A group is completely empty when the others already hold everyone: (groups − 1) × b ≥ a.
  const noEmpty = plan.groups === 0 || cmp(mul(N(plan.groups - 1), x.b), x.a) < 0;
  const withinLimit = plan.limit === null || plan.groups <= plan.limit;
  const withinBudget = cmp(cost, x.c) <= 0;
  const enough = cmp(used, x.e) <= 0;
  return {
    seats,
    cost,
    used,
    everyone,
    noEmpty,
    withinLimit,
    withinBudget,
    enough,
    seatingOk: plan.groups > 0 && everyone && noEmpty && withinLimit,
    ok: plan.groups > 0 && everyone && noEmpty && withinLimit && withinBudget && plan.packs > 0 && enough && plan.cuts > 0,
  };
}

/** The piece length as a fraction of a meter, for the cut diagram's tick marks (e.g. 0.75 = 3/4). */
export function pieceFraction(x) {
  return { n: Number(x.f.n), d: Number(x.f.d) };
}

/**
 * The cut diagram's marks: the material is split into 1/d-meter marks when that is drawable, and each
 * piece is n of those marks. Returns null when the marks would be too dense to draw.
 */
export function cutMarks(x) {
  const { n, d } = pieceFraction(x);
  const marks = mul(x.e, N(d));
  if (d === 1 || d > 16 || marks.d !== 1n || marks.n > 240n) return null;
  return { per: n, unit: d, total: Number(marks.n) };
}

/** Apply the mission twist. Returns { patch (design changes), plan } or { error }. */
export function applyTwist(projectId, plan, values) {
  const t = TWISTS[projectId];
  if (!t) return { error: "none" };
  if (plan.twist) return { error: "applied" };
  if (t.key === "limit") {
    if (plan.groups < 2) return { error: "plan-first" };
    const to = plan.groups - 1;
    return { patch: null, plan: { ...plan, limit: to, twist: { key: "limit", from: plan.groups, to } } };
  }
  const from = values[t.key];
  const to = Number(show(sub(N(from), N(-t.delta))));
  const bounds = { a: [12, 999], b: [2, 60], f: [0.125, 5] }[t.key];
  if (to < bounds[0] || to > bounds[1]) return { error: "bounds" };
  return { patch: { [t.key]: String(to) }, plan: { ...plan, twist: { key: t.key, from, to } } };
}

/** Undo the twist: restores the design number (or removes the table cap). */
export function revertTwist(plan) {
  if (!plan.twist) return { error: "none" };
  const { key, from } = plan.twist;
  if (key === "limit") return { patch: null, plan: { ...plan, limit: null, twist: null } };
  return { patch: { [key]: String(from) }, plan: { ...plan, twist: null } };
}

/** Is the stored twist still in effect for these design values? */
export const twistActive = (plan, values) => !!plan.twist && (plan.twist.key === "limit" || values?.[plan.twist.key] === plan.twist.to);

const money = (r) => {
  const cents = mul(r, N(100));
  return cents.d === 1n ? `$${(Number(cents.n) / 100).toFixed(2)}` : `$${show(r)}`;
};
export { money, show };

/** Plain-text lines for the downloadable defense report. Test answers are never computed here. */
export function planReport(plan, values, fmt = String) {
  const x = numbersOf(values);
  if (!x || (!plan.groups && !plan.packs && !plan.cuts)) return [];
  const v = evaluate(plan, x);
  const yes = (b) => (b ? "yes" : "NO");
  const lines = [
    "SUPPLY PLAN",
    `Groups set up: ${plan.groups} × ${fmt(values.b)} places = ${show(v.seats)} places for ${fmt(values.a)}. Everyone placed: ${yes(v.everyone)} · No completely empty group: ${yes(v.noEmpty)}${plan.limit !== null ? ` · Uses at most ${plan.limit} groups: ${yes(v.withinLimit)}` : ""}`,
    `Packs bought: ${plan.packs} × ${money(x.d)} = ${money(v.cost)} of a ${money(x.c)} budget. Within budget: ${yes(v.withinBudget)}`,
    `Pieces cut: ${plan.cuts} × ${show(x.f)} m = ${show(v.used)} m of ${show(x.e)} m. Enough material: ${yes(v.enough)}`,
  ];
  if (plan.twist) lines.push(plan.twist.key === "limit" ? `Twist applied: groups capped at ${plan.twist.to} (plan had ${plan.twist.from}).` : `Twist applied: ${plan.twist.key} changed from ${fmt(plan.twist.from)} to ${fmt(plan.twist.to)}.`);
  lines.push("");
  return lines;
}
