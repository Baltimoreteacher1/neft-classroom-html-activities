// Teacher goal bank: a goal is chosen by a teacher, never inferred. Each goal names the evidence the lab
// already collects for it, and `goalEvidence` reports what that evidence shows as counts and a plain
// status. Statuses: "not-enough" (under three observations), "building", "on-own" (shown without
// supports at least twice, on different days or tasks). A goal is never a level, a score or a prediction.
import { buildProfile, dayNumber, MIN_POINTS, patternReviewEvents } from "./ledger.js";
import { SKILLS, buildSkillGraph } from "./skill-graph.js";
import { CONFERENCE_NEEDS, needEvidence } from "./teacher.js";

export const GOAL_STATUS = Object.freeze({
  "not-enough": { en: "Not enough evidence yet", es: "Todavía no hay suficiente evidencia" },
  building: { en: "Building", es: "En desarrollo" },
  "on-own": { en: "Shown on my own", es: "Demostrado por mi cuenta" },
});
export const GOAL_DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];
const KINDS = new Set(["skill", "need", "pattern"]);

/** Problems with the bank as a list of strings; empty means the bank is sound. */
export function validateGoalBank(bank, { patterns = {} } = {}) {
  const errors = [];
  const ids = new Set();
  const skillIds = new Set(SKILLS.map((s) => s.id));
  const needIds = new Set(CONFERENCE_NEEDS.map((n) => n.id));
  for (const g of bank?.goals || []) {
    const at = `goal ${g?.id}`;
    if (!g?.id || ids.has(g.id)) errors.push(`${at}: missing or duplicate id`);
    ids.add(g?.id);
    if (
      !Array.isArray(g.domains) ||
      !g.domains.length ||
      g.domains.some((d) => !GOAL_DOMAINS.includes(d))
    )
      errors.push(`${at}: domains`);
    if (!g.en || !g.es || g.en === g.es) errors.push(`${at}: needs distinct English and Spanish`);
    if (/\b(level|score|proficien|percent|%)/i.test(`${g.en} ${g.es}`))
      errors.push(`${at}: wording must not claim a level or score`);
    if (!g.tryTomorrow || g.tryTomorrow.split(/\s+/).length > 40) errors.push(`${at}: needs a tryTomorrow move of at most 40 words`);
    else if (/\b(cut|scissors|laminate|cards?|print out|worksheet)\b/i.test(g.tryTomorrow)) errors.push(`${at}: tryTomorrow must need no prepared materials`);
    const { kind, ref } = g.evidence || {};
    if (!KINDS.has(kind)) errors.push(`${at}: evidence kind`);
    else if (kind === "skill" && !skillIds.has(ref)) errors.push(`${at}: unknown skill ${ref}`);
    else if (kind === "need" && !needIds.has(ref)) errors.push(`${at}: unknown need ${ref}`);
    else if (kind === "pattern" && !Object.hasOwn(patterns, ref))
      errors.push(`${at}: unknown pattern ${ref}`);
  }
  return errors;
}

/** Goals a teacher can pick for one domain, in bank order. */
export const goalsForDomain = (bank, domain) =>
  (bank?.goals || []).filter((g) => g.domains.includes(domain));

/** Everything `goalEvidence` needs from one student, computed once per student. */
export function goalContext(student) {
  const entries = student?.ledger?.entries || [];
  return {
    student,
    graph: new Map(buildSkillGraph(entries, student?.records || {}).map((n) => [n.id, n])),
    profile: buildProfile(entries, { band: student?.band || null }),
    patterns: patternReviewEvents(entries),
  };
}

const result = (status, en, es) => ({ status, en, es });
const times = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function goalEvidence(goal, ctx) {
  const { kind, ref } = goal.evidence || {};
  if (kind === "skill") {
    const node = ctx.graph.get(ref);
    const n = node?.evidenceCount || 0;
    if (!node || n < MIN_POINTS)
      return result(
        "not-enough",
        `${times(n, "observation", "observations")} so far (3 needed).`,
        `${times(n, "observación", "observaciones")} hasta ahora (se necesitan 3).`,
      );
    const own = node.independentEvidenceCount || 0;
    const on = node.status === "demonstrated";
    return result(
      on ? "on-own" : "building",
      `${times(n, "observation", "observations")}; ${own} on their own.`,
      `${times(n, "observación", "observaciones")}; ${own} sin ayuda.`,
    );
  }
  if (kind === "need") {
    const need = CONFERENCE_NEEDS.find((x) => x.id === ref);
    const ev = need ? needEvidence(ctx.student, need) : null;
    if (!ev || ev.total < MIN_POINTS)
      return result(
        "not-enough",
        `${times(ev?.total || 0, "attempt", "attempts")} so far (3 needed).`,
        `${times(ev?.total || 0, "intento", "intentos")} hasta ahora (se necesitan 3).`,
      );
    const i = ev.independent;
    const on = i.n >= 2 && i.met / i.n >= 2 / 3;
    return result(
      on ? "on-own" : "building",
      `Met in ${ev.total - ev.notMet} of ${ev.total} attempts; on their own in ${i.met} of ${i.n}.`,
      `Logrado en ${ev.total - ev.notMet} de ${ev.total} intentos; sin ayuda en ${i.met} de ${i.n}.`,
    );
  }
  if (kind === "pattern") {
    const events = ctx.patterns.get(ref) || [];
    if (events.length < MIN_POINTS)
      return result(
        "not-enough",
        `${times(events.length, "piece of work", "pieces of work")} checked so far (3 needed).`,
        `${times(events.length, "trabajo revisado", "trabajos revisados")} hasta ahora (se necesitan 3).`,
      );
    const days = new Set(events.filter((e) => e.independent && e.ok).map((e) => dayNumber(e.t)));
    const missed = events.filter((e) => !e.ok).length;
    return result(
      days.size >= 2 ? "on-own" : "building",
      `Showed up in ${missed} of ${events.length} pieces of work; used correctly on their own on ${times(days.size, "day", "days")}.`,
      `Apareció en ${missed} de ${events.length} trabajos; usado correctamente sin ayuda en ${times(days.size, "día", "días")}.`,
    );
  }
  return result(
    "not-enough",
    "No evidence is linked to this goal.",
    "No hay evidencia vinculada a esta meta.",
  );
}
