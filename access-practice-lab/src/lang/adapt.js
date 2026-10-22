// Adaptive choices made from demonstrated performance (the ledger), never from a fixed level.
// Every function returns a recommendation AND the reason, and the learner can always override it.
import { buildProfile } from "./ledger.js";

/** Rank tasks to suggest next: unattempted ones, in the Key Language Use with the least independent evidence. */
export function recommendTasks(tasks, entries, { n = 3, band = null } = {}) {
  const profile = buildProfile(entries, { band });
  const tried = new Set(entries.map((e) => e.task));
  const scored = tasks.map((t) => {
    const u = profile.byUse[t.keyUse] || { n: 0, independent: 0 };
    let score = 0;
    const why = [];
    if (!tried.has(t.id)) { score += 10; why.push("new to you"); }
    if (u.independent === 0) { score += 6; why.push(`you have not tried a ${t.keyUse} task on your own yet`); }
    if (u.n === 0) { score += 3; }
    const hit = profile.errors.find((e) => !e.mastered && e.drafts >= 2);
    if (hit && t.dimensions?.includes("Sentence")) { score += 2; why.push("a chance to practice a pattern from your recent work"); }
    return { task: t, score, why: why.join("; ") || "more practice" };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, n);
}

/**
 * Which mission questions to show. "stretch" questions appear only after independent success on core
 * questions of the same skill — demonstrated performance, not a level.
 */
export function showStretch(entries, skill) {
  const qs = entries.filter((e) => e.src === "mission" || e.src === "item").flatMap((e) => (e.m?.questions || []).map((q) => ({ ...q, stage: e.stage })));
  const mine = qs.filter((q) => q.skill === skill && q.tier !== "stretch");
  const independentOk = mine.filter((q) => q.stage === "independent" && q.ok).length;
  const independentTotal = mine.filter((q) => q.stage === "independent").length;
  return independentTotal >= 2 && independentOk / independentTotal >= 0.75;
}

/** Support level for a mission phase from the learner's history on that skill. */
export function missionSupport(entries, use) {
  const profile = buildProfile(entries);
  const u = profile.byUse[use] || { n: 0, independent: 0 };
  if (u.n >= 3 && u.independent >= 2) return { stage: "supported", reason: "You have shown this on your own — you start with a word bank only." };
  if (u.n >= 1) return { stage: "supported", reason: "You have tried this before — you start with a word bank." };
  return { stage: "guided", reason: "New kind of task — frames, words and a model are open. Fade them when you are ready." };
}
