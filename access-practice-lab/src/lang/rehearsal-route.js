// "Rehearsal that adapts": routing for the opt-in adaptive flow on the four-part practice forms. Real ACCESS Online
// uses Listening and Reading results to choose how demanding the Speaking and Writing tasks are; this lab imitates
// only the SHAPE of that flow. After Listening and Reading, Speaking and Writing prompts are drawn from the lab's
// own more-supported (level A, "Starting support") or more-demanding (level C, "Stretching support") prompt sets.
//
// Honesty rules (PLATFORM.md, BRIEF): the route is never a tier, level, score or placement. Learners see only
// "your next part was chosen from your answers"; the teacher view says "easier/harder prompt set". Pure: no DOM.

/** The two prompt sets and the content level each is drawn from. */
export const ROUTE_SETS = Object.freeze({ supported: "A", demanding: "C" });
/** Share of auto-checked Listening + Reading answers that routes to the more-demanding set. */
export const ROUTE_SHARE = 0.6;
/** Fewer checked answers than this is too little to route on: the learner gets the more-supported set. */
export const ROUTE_MIN_ITEMS = 4;
/** Neutral classmate names for the model student in routed Speaking prompts (the lab's own, not WIDA's). */
export const MODEL_NAMES = Object.freeze(["Sam", "Lina", "Omar", "Rosa"]);

export const isRoutingDomain = (d) => d === "Listening" || d === "Reading";
export const isRoutedDomain = (d) => d === "Speaking" || d === "Writing";
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);

/** Only the full four-part forms can adapt: they have Listening/Reading to route from and Speaking/Writing to route. */
export function adaptiveEligible(test) {
  const ds = (test?.sections || []).map((s) => s.domain);
  return (
    test?.kind === "full" &&
    ["3-5", "6-8"].includes(test.band) &&
    ds.some(isRoutingDomain) &&
    ds.some(isRoutedDomain)
  );
}

/**
 * Pick the prompt set from Listening + Reading outcomes ([{ domain, scored, right }], as runOutcomes returns).
 * @returns {{ set: "supported"|"demanding", right: number, total: number }}
 */
export function chooseRoute(outcomes) {
  const checked = (outcomes || []).filter((o) => o?.scored && isRoutingDomain(o.domain));
  const right = checked.filter((o) => o.right).length;
  const total = checked.length;
  const set = total >= ROUTE_MIN_ITEMS && right / total >= ROUTE_SHARE ? "demanding" : "supported";
  return { set, right, total };
}

/** The model student's line for a pool prompt: its own model text, the stronger sample for the demanding set. */
export function modelLine(activity, set) {
  const m = activity?.model ?? activity?.models;
  if (typeof m === "string") return m.trim() || null;
  if (!m || typeof m !== "object") return null;
  const order = set === "demanding" ? ["C", "B", "A"] : ["B", "A", "C"];
  for (const k of order) if (typeof m[k] === "string" && m[k].trim()) return m[k].trim();
  return null;
}

/** Stable small hash so each form draws its own prompts, the same ones every time. */
export function seedOf(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0;
  return h;
}

/** Pool prompts a routed section can use: open responses only; Speaking needs a model line for the model student. */
export function routablePrompts(activities, domain, set) {
  return (activities || []).filter(
    (a) =>
      a?.type === "constructed" && a.id && a.prompt && (domain !== "Speaking" || modelLine(a, set)),
  );
}

/** `n` distinct prompt ids from the pool, rotated by `seed`, skipping ids in `avoid`. */
export function pickPromptIds(pool, n, seed, avoid = []) {
  const list = pool.filter((a) => !avoid.includes(a.id));
  if (!list.length) return [];
  const start = seed % list.length;
  return Array.from(
    { length: Math.min(n, list.length) },
    (_, i) => list[(start + i) % list.length].id,
  );
}

/** A pool activity shaped as a practice-test item. Speaking prompts get the model-student-then-respond routine. */
export function toTestItem(activity, domain, set, index = 0) {
  const item = { ...activity };
  if (!asList(item.passage).length && item.directions) item.passage = [item.directions];
  if (domain === "Speaking") {
    const line = modelLine(activity, set);
    if (line)
      item.modelStudent = { name: MODEL_NAMES[index % MODEL_NAMES.length], line, partial: false };
  }
  return item;
}

/**
 * Decide the route once, when the learner first reaches Speaking or Writing.
 * @param {object} test  the practice form
 * @param {Array} outcomes  runOutcomes() for the run so far
 * @param {Record<string, {A?: object[], C?: object[]}>} pools  { Speaking: { A: [...], C: [...] }, Writing: ... }
 * @returns {{ set, right, total, items: Record<number, string[]> }}  item ids per routed section index
 */
export function buildRoute(test, outcomes, pools) {
  const { set, right, total } = chooseRoute(outcomes);
  const level = ROUTE_SETS[set];
  const items = {};
  const used = [];
  (test.sections || []).forEach((s, si) => {
    if (!isRoutedDomain(s.domain)) return;
    const pool = routablePrompts(pools?.[s.domain]?.[level], s.domain, set);
    const ids = pickPromptIds(pool, (s.items || []).length, seedOf(`${test.id}:${si}`), used);
    if (ids.length === (s.items || []).length) {
      items[si] = ids;
      used.push(...ids);
    }
  });
  return { set, right, total, items };
}

/** The form with each routed section's items swapped for its routed prompts. Unrouted sections are untouched. */
export function routedTest(test, route, pools) {
  if (!route?.items) return test;
  const level = ROUTE_SETS[route.set];
  return {
    ...test,
    sections: (test.sections || []).map((s, si) => {
      const ids = route.items[si];
      if (!ids?.length) return s;
      const byId = new Map((pools?.[s.domain]?.[level] || []).map((a) => [a.id, a]));
      const picked = ids.map((id) => byId.get(id)).filter(Boolean);
      if (picked.length !== ids.length) return s;
      return {
        ...s,
        title: s.domain,
        items: picked.map((a, i) => toTestItem(a, s.domain, route.set, i)),
      };
    }),
  };
}

/** Teacher wording only. Never shown to the learner, never a tier or level. */
export const routeTeacherText = (route) =>
  route?.set === "demanding"
    ? ["harder prompt set", "conjunto de tareas más exigente"]
    : ["easier prompt set", "conjunto de tareas con más apoyo"];
