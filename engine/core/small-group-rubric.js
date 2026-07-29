// small-group-rubric.js — publisher-grade scoring artifacts for the studio.
//
// Two exports:
//   masteryBand(stats)        → { id, label, emoji, copy } proficiency band
//                               computed from this session's practice evidence.
//   createRubricDetails(...)  → collapsible 4-point rubric shown under every
//                               open-response prompt (and the exit ticket) so
//                               "answers may vary" work is judged on named
//                               criteria, not keyword luck.
//
// Both are derivation-only: no config authoring is required, so all 148
// generated lessons pick them up with zero regeneration. A lesson config MAY
// override the rubric rows via config.rubric = [{criterion, levels:[l1..l4]}].

import { bi, el, esc } from "./small-group-ui.js";

export const MASTERY_BANDS = {
  approaching: {
    id: "approaching",
    label: "Approaching",
    emoji: "🌱",
    copy: "Building the idea — re-teach with the worked example, then retry the guided set.",
  },
  meeting: {
    id: "meeting",
    label: "Meeting",
    emoji: "✅",
    copy: "Solid on today's skill — accurate with supports available.",
  },
  exceeding: {
    id: "exceeding",
    label: "Exceeding",
    emoji: "🚀",
    copy: "Accurate and independent — ready for the stretch path.",
  },
};

// Session evidence → band. Thresholds favor completion ratio first (did the
// work get done correctly), then independence (few misses/hints) to separate
// meeting from exceeding. Deliberately generous at the low end: a band is a
// next-step signal for the teacher, never a grade shown as a judgment.
export function masteryBand(stats = {}) {
  const total = Number(stats.total) || 0;
  const solved = Number(stats.solved) || 0;
  const attempts = Number(stats.attempts) || 0;
  const incorrect = Number(stats.incorrectAttempts) || 0;
  const hints = Number(stats.hints) || 0;
  if (!total || !solved) return MASTERY_BANDS.approaching;
  const ratio = solved / total;
  if (ratio < 0.6) return MASTERY_BANDS.approaching;
  const independent = incorrect <= Math.max(1, Math.round(attempts * 0.1)) && hints <= 1;
  if (ratio >= 0.85 && independent) return MASTERY_BANDS.exceeding;
  return MASTERY_BANDS.meeting;
}

// Generic 4-point analytic rubric for explained reasoning. Rows mirror the
// dimensions the Facilitation Console already observes, so the student-facing
// rubric and the teacher's evidence signals speak the same language.
const DEFAULT_RUBRIC = [
  {
    criterion: "Math reasoning",
    criterionEs: "Razonamiento matemático",
    levels: [
      "Answer only, or reasoning is missing.",
      "Some correct steps, with a gap or error.",
      "Complete, correct reasoning for this problem.",
      "Correct reasoning plus a check, boundary case, or second method.",
    ],
  },
  {
    criterion: "Representation",
    criterionEs: "Representación",
    levels: [
      "No model or labels.",
      "A model is started but parts are unlabeled.",
      "A labeled model matches the work.",
      "Two connected representations that show the same idea.",
    ],
  },
  {
    criterion: "Math vocabulary",
    criterionEs: "Vocabulario matemático",
    levels: [
      "Everyday words only.",
      "One lesson word, used loosely.",
      "Lesson vocabulary used correctly.",
      "Precise vocabulary that makes the argument tighter.",
    ],
  },
  {
    criterion: "Communication",
    criterionEs: "Comunicación",
    levels: [
      "Hard to follow.",
      "Followable with effort.",
      "Clear and in order — a classmate could follow it.",
      "So clear a classmate could re-teach from it.",
    ],
  },
];

const LEVEL_HEADS = ["1 · Starting", "2 · Developing", "3 · Meeting", "4 · Exceeding"];

/**
 * Collapsible "How strong explanations are judged" rubric. Group 2 studios get
 * a justification-forward lede; everyone gets the same four criteria so the
 * bar is public and consistent — the publisher's rubric page, in-line.
 */
export function createRubricDetails(variant = "group1", config = {}) {
  const rows =
    Array.isArray(config.rubric) && config.rubric.length ? config.rubric : DEFAULT_RUBRIC;
  const details = el("details", "sg-rubric");
  const lede =
    variant === "group2"
      ? "Aim for level 4: justify the claim, test a boundary, and use precise vocabulary."
      : "Aim for level 3 or higher. The rubric names exactly what a strong explanation shows.";
  const body = rows
    .map((row) => {
      const cells = (row.levels || [])
        .slice(0, 4)
        .map((levelCopy, index) => `<td data-level="${index + 1}">${esc(levelCopy)}</td>`)
        .join("");
      return `<tr><th scope="row">${bi(row.criterion, row.criterionEs)}</th>${cells}</tr>`;
    })
    .join("");
  const head = LEVEL_HEADS.map((label) => `<th scope="col">${esc(label)}</th>`).join("");
  details.innerHTML =
    `<summary>📏 ${bi("How strong work is judged (rubric)", "Cómo se evalúa un buen trabajo (rúbrica)")}</summary>` +
    `<p class="sg-rubric-lede">${esc(lede)}</p>` +
    `<div class="sg-rubric-scroll"><table class="sg-rubric-table">` +
    `<caption class="sr-only">Four-point rubric for explained reasoning</caption>` +
    `<thead><tr><th scope="col">Criteria</th>${head}</tr></thead>` +
    `<tbody>${body}</tbody></table></div>`;
  return details;
}

export default masteryBand;
