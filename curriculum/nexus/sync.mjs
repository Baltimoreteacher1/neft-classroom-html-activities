// nexus/sync.mjs — explicit, previewable synchronization. When a teacher edits
// the authoritative resource (numbers, vocabulary, objective), planSync lists,
// per derived version, exactly what will change, and flags every place where a
// teacher's own wording override sits on a question whose generated wording just
// changed. Nothing is overwritten silently: applySync keeps each override unless
// the teacher chose "use the new wording" for it, and every applied change
// becomes a numbered version that can be restored. Pure.

import { questions, story } from "./resource.mjs";

const OUTPUTS = ["mission", "worksheet", "key", "docx", "offline"];
const MAX_HISTORY = 15;

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * @returns {{ changes: {where:string, what:string, from:string, to:string}[], conflicts: {key:string, yours:string, newBase:string}[], outputs:string[], empty:boolean }}
 */
export function planSync(prev, next) {
  const changes = [];
  const conflicts = [];
  const pq = questions(prev);
  const nq = questions(next);
  for (const q of nq) {
    const old = pq.find((x) => x.id === q.id);
    if (!old) continue;
    if (old.answer !== q.answer) changes.push({ where: q.id.toUpperCase(), what: "answer", from: String(old.answer), to: String(q.answer) });
    const oldGen = old.generatedStem || old.stem;
    const newGen = q.generatedStem || q.stem;
    if (!same(oldGen, newGen)) {
      if (q.overridden) conflicts.push({ key: `${q.id}:stem`, yours: q.stem.en, newBase: newGen.en });
      else changes.push({ where: q.id.toUpperCase(), what: "wording", from: oldGen.en, to: newGen.en });
    }
  }
  if (!same(story(prev), story(next))) changes.push({ where: "Situation", what: "text", from: story(prev).en, to: story(next).en });
  if (!same(prev.objective, next.objective)) changes.push({ where: "Objective", what: "text", from: prev.objective.en, to: next.objective.en });
  if (!same(prev.vocab, next.vocab)) changes.push({ where: "Vocabulary", what: "words", from: prev.vocab.map((v) => v.term.en).join(", "), to: next.vocab.map((v) => v.term.en).join(", ") });
  if (prev.support !== next.support) changes.push({ where: "Language support", what: "level", from: prev.support, to: next.support });
  if (prev.goal !== next.goal) changes.push({ where: "Goal", what: "sequence", from: prev.goal, to: next.goal });
  const empty = !changes.length && !conflicts.length;
  return { changes, conflicts, outputs: empty ? [] : OUTPUTS, empty };
}

/**
 * Apply a planned change. `useNew` lists override keys the teacher chose to replace with the new
 * generated wording; every other override is kept (and re-based so the next plan compares fairly).
 */
export function applySync(prev, next, plan, useNew = []) {
  const overrides = { ...next.overrides };
  for (const c of plan.conflicts) {
    if (useNew.includes(c.key)) delete overrides[c.key];
  }
  const entry = { v: prev.version, at: new Date().toISOString().slice(0, 16), summary: summarize(plan), snapshot: { ...prev, history: undefined } };
  const history = [entry, ...(prev.history || [])].slice(0, MAX_HISTORY);
  return { ...next, overrides, version: prev.version + 1, history };
}

export function summarize(plan) {
  const parts = plan.changes.map((c) => `${c.where} ${c.what}`);
  if (plan.conflicts.length) parts.push(`${plan.conflicts.length} wording edit(s) reviewed`);
  return parts.join("; ").slice(0, 200) || "No changes";
}

/** Restore a saved version as a NEW version (history is never rewritten). */
export function restore(current, v) {
  const h = (current.history || []).find((x) => x.v === v);
  if (!h) return null;
  const entry = { v: current.version, at: new Date().toISOString().slice(0, 16), summary: `Restored version ${v}`, snapshot: { ...current, history: undefined } };
  return { ...h.snapshot, version: current.version + 1, history: [entry, ...(current.history || [])].slice(0, MAX_HISTORY) };
}
