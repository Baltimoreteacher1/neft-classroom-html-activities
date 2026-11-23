// language-detective: pure logic (no DOM) for evidence checks, claim checks and the revision checklist.
import { contentWords, wordCount } from "./st1-text.js";

export const TYPE_LABEL = { detail: "Find the detail", inference: "Make an inference", evidence: "Find the proof" };

/** Scene units by id: sentences, lines, or regions. */
export function sceneUnits(scene) {
  const list = scene.kind === "passage" ? scene.sentences : scene.kind === "conversation" ? scene.lines : scene.regions;
  return new Map(list.map((u) => [u.id, u]));
}
export const unitText = (u) => (u ? u.text ?? u.label ?? "" : "");

/** Question phases: choose an answer, then tap proof. Evidence questions are proof only. */
export function phasesOf(q) {
  if (q.type === "evidence") return ["evidence"];
  return q.evidence?.length ? ["answer", "evidence"] : ["answer"];
}

/** Compare the learner's taps to the question's evidence. */
export function checkEvidence(q, selected) {
  const sel = new Set(selected);
  const allowed = new Set(q.evidence.map((e) => e.id));
  const required = q.evidence.filter((e) => !e.optional).map((e) => e.id);
  const missing = required.filter((id) => !sel.has(id));
  const extra = [...sel].filter((id) => !allowed.has(id));
  return { ok: !missing.length && !extra.length && sel.size > 0, missing: missing.length, extra, required };
}

/** Submission for createItemLoop from an evidence check. A wrong unit with a tagged misconception is passed as `pick`. */
export function evidenceSub(q, selected) {
  const r = checkEvidence(q, selected);
  if (r.ok) return { sub: { ok: true }, result: r };
  const tagged = (q.misconceptions || []).find((m) => r.extra.includes(m.pick));
  return { sub: { ok: false, pick: tagged?.pick, tag: r.extra.length ? "off-target-evidence" : "partial-evidence" }, result: r, tagged: !!tagged };
}

/** Calm, non-revealing text when no authored misconception matched. */
export function evidenceNudge(result) {
  if (result.extra.length && result.missing)
    return "Some of the sentences you chose do not prove it, and there is more proof to find. Reread the question and look again.";
  if (result.extra.length) return "One of the places you chose does not prove it. Look again at what each one tells you.";
  if (result.missing === 1) return "You found part of the proof. There is one more piece to find.";
  return `You found part of the proof. There are ${result.missing} more pieces to find.`;
}

export function checkClaimEvidence(claim, attached) {
  const ok = new Set(claim.evidenceIds);
  const good = attached.filter((id) => ok.has(id));
  const bad = attached.filter((id) => !ok.has(id));
  return { ok: !bad.length && good.length >= claim.evidenceMin, good: good.length, bad };
}

/** Run the explanation checklist. Self checks have ok:null until the learner ticks them. */
export function runRevisionChecks(checks, text, evidenceTexts, ticked = new Set()) {
  const lower = String(text).toLowerCase();
  const evWords = new Set(evidenceTexts.flatMap((t) => contentWords(t)));
  return checks.map((c) => {
    if (c.self) return { id: c.id, label: c.label, self: true, ok: ticked.has(c.id) };
    const t = c.test;
    let ok = false;
    if (t.type === "min-words") ok = wordCount(text) >= t.n;
    else if (t.type === "contains-any") ok = t.words.some((w) => lower.includes(w.toLowerCase()));
    else if (t.type === "contains-evidence") ok = contentWords(text).filter((w) => evWords.has(w)).length >= 2;
    return { id: c.id, label: c.label, self: false, ok };
  });
}
export const checksPass = (results) => results.every((r) => r.ok);

export function defaultClaimHints() {
  return [
    "Look back at your case notes. A strong claim is one your notes show directly.",
    "Cross out any claim that your notes do not mention.",
    "Choose the claim that two or more of your notes help prove.",
  ];
}
