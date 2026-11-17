// Living Language Simulation Engine: the mission evidence report. Pure (no DOM, no storage): plain text for the
// class review queue with the path taken, the evidence collected, the decision, the outcome and each piece of the
// learner's language. Every part is labelled, and work done on the learner's own is kept apart from work done with
// supports. A revision is always labelled as supported; the transfer task is labelled as done with help closed.
// The outcome is reported as a story consequence, never as a grade.
import { characterOf, evidenceOf, sceneOf, taskOf } from "./schema.js";

/** The class review queue accepts this many characters (src/intel/share.js MAX_SHARE). */
export const REPORT_MAX = 3900;

const en = (pair) => (Array.isArray(pair) ? pair[0] : String(pair || ""));
const count = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const HELP_NAMES = { bank: "word bank", frames: "sentence frames", words: "word meanings" };
const how = (result) => {
  const used = Object.keys(result.supports || {}).filter((k) => result.supports[k]);
  return used.length
    ? `[with supports: ${used.map((k) => HELP_NAMES[k] || k).join(", ")}]`
    : "[on my own]";
};

/**
 * The mission evidence report as plain text (English labels: it is read by the teacher). Pure.
 * @param {number} [max] longest report; the learner's own words are shortened first, never the labels
 */
export function missionReport(def, state, max = REPORT_MAX) {
  const result = (id) => state.tasks?.[id];
  const outcome = def.outcomes.find((o) => o.id === state.outcome);
  const places = (state.path || []).map((id) => en(sceneOf(def, id)?.title)).join(" > ");
  const held = Object.entries(state.evidence || {}).map(([id, e]) => {
    const item = evidenceOf(def, id);
    const note =
      item?.kind === "audio"
        ? e.supported
          ? " (listened with the transcript open)"
          : " (listened without the transcript)"
        : "";
    return `- ${en(item?.title)}, found at ${en(sceneOf(def, e.scene)?.title)}${note}`;
  });
  const people = Object.entries(state.talk || {})
    .filter(([, m]) => m.asked.length)
    .map(
      ([id, m]) =>
        `${characterOf(def, id)?.name} (${count(m.asked.length, "question")}, ${count(m.clarified.length, "clarification")})`,
    );
  const lines = [
    `MISSION: ${en(def.title)} (simulation). ${state.complete ? "Finished." : "In progress."}`,
    outcome && `STORY OUTCOME (a consequence of the choices, not a grade): ${en(outcome.title)}`,
    `PATH TAKEN: ${places}`,
    `EVIDENCE COLLECTED (${held.length} of ${def.evidence.length}):\n${held.join("\n")}`,
    people.length && `PEOPLE QUESTIONED: ${people.join("; ")}`,
  ];
  for (const t of def.tasks) {
    const r = result(t.id);
    if (!r?.done) continue;
    if (t.type === "compare")
      lines.push(
        `COMPARED EVIDENCE: ${en(t.prompt)} ${r.resolved ? `Settled${r.firstTry ? " on the first try" : ` after ${r.tries} tries`}.` : "Not settled."} Reason given: ${r.reason || ""}`,
      );
    else if (t.type === "decide") {
      const option = t.options.find((o) => o.id === r.choice);
      const cited = (r.cited || []).map((id) => en(evidenceOf(def, id)?.title)).join("; ");
      lines.push(
        `DECISION: ${en(option?.label)}\nEVIDENCE CITED: ${cited}${r.reason ? `\nREASON GIVEN: ${r.reason}` : ""}`,
      );
    }
  }
  const spoken = (r) =>
    r.source === "transcript"
      ? " (speech turned into words; may contain recognition errors)"
      : " (typed)";
  const texts = [];
  for (const t of def.tasks) {
    const r = result(t.id);
    if (!r?.done || !r.text) continue;
    const label =
      t.type === "speak"
        ? `SPOKEN EXPLANATION ${how(r)}${spoken(r)}`
        : t.type === "write"
          ? `WRITTEN RECOMMENDATION ${how(r)}`
          : t.type === "revise"
            ? "REVISION (after feedback, counted as supported)"
            : `NEW PROBLEM, TRANSFER [on my own, help closed]: ${en(taskOf(def, t.id).prompt).slice(0, 160)}`;
    texts.push({ label, text: r.text });
  }
  const head = lines.filter(Boolean).join("\n\n");
  // Share the remaining room between the learner's texts so every labelled part survives.
  const room = Math.max(0, max - head.length - texts.reduce((n, t) => n + t.label.length + 8, 0));
  const each = texts.length ? Math.floor(room / texts.length) : 0;
  const body = texts.map(
    (t) =>
      `${t.label}:\n${t.text.length > each ? `${t.text.slice(0, Math.max(0, each - 1))}…` : t.text}`,
  );
  return [head, ...body].join("\n\n").slice(0, max);
}
