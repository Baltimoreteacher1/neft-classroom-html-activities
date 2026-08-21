#!/usr/bin/env node
// add-table-debug-items.mjs — one "Fix our table's thinking" debugging task
// per small-group / catch-up lesson, derived ENTIRELY from authored fields.
//
// The item shows a classmate's wrong answer to a problem the group knows and
// asks the table to find where the thinking turned. Every string is already
// authored on the source item — stem/stemEs, a distractor from choices/
// choicesEs, the correct choice, and explanation/explanationEs — so nothing
// is invented (the copy-panel incident is the standing warning against
// manufacturing content to fill a slot; see docs/notebook-work-surface
// provenance notes). An item lacking any required bilingual field is skipped,
// and absence is a pass: coverage is REPORTED, never demanded.
//
// Placement follows engine/core/small-group-practice.js collectPracticeItems:
//   group1 / catchup → onLevel  (varietySlice draws from approaching+onLevel,
//                                round-robin by type, so a new error-analysis
//                                lane is actually reached)
//   group2           → extending (appended after the parallel set for mastery
//                                students)
//
// Idempotent: reruns skip lessons that already carry the item. Safe to run
// after any practice-tier graft.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const TITLE = "Fix our table's thinking";
const TIERS = ["approaching", "onLevel", "extending", "optional"];
const VARIANT_RE = /^\d+-\d+-(group\d|catchup)$/;

const hasText = (value) => Boolean(String(value ?? "").trim());

/** The richest debuggable source: an MC item whose distractor carries real
 *  feedback and whose Spanish is complete enough to keep parity at 100%. */
function pickSource(config) {
  let best = null;
  for (const tier of TIERS) {
    for (const item of config.practice?.[tier] || []) {
      if (item.type !== "multiple-choice") continue;
      if (!Array.isArray(item.choices) || !Array.isArray(item.choicesEs)) continue;
      if (item.choices.length !== item.choicesEs.length) continue;
      if (!Number.isInteger(item.correctIndex)) continue;
      if (!hasText(item.stem) || !hasText(item.stemEs)) continue;
      if (!hasText(item.explanation) || !hasText(item.explanationEs)) continue;
      if (!Array.isArray(item.choiceFeedback)) continue;
      let wrongIndex = -1;
      let feedbackLength = 0;
      item.choiceFeedback.forEach((feedback, index) => {
        if (index === item.correctIndex) return;
        const text = String(feedback ?? "").trim();
        if (text.length > feedbackLength) {
          feedbackLength = text.length;
          wrongIndex = index;
        }
      });
      if (wrongIndex === -1) continue;
      if (!best || feedbackLength > best.feedbackLength) {
        best = { item, wrongIndex, feedbackLength };
      }
    }
  }
  return best;
}

function buildDebugItem({ item, wrongIndex }) {
  const wrong = item.choices[wrongIndex];
  const wrongEs = item.choicesEs[wrongIndex];
  const correct = item.choices[item.correctIndex];
  const correctEs = item.choicesEs[item.correctIndex];
  const out = {
    type: "error-analysis",
    title: TITLE,
    // Machine marker so the practice collector can guarantee this item a seat
    // without matching on a human-facing English title.
    tableDebug: true,
    workedExample: [
      {
        label: "The problem",
        work: item.stem,
        labelEs: "El problema",
        workEs: item.stemEs,
      },
      {
        label: "A classmate at our table answered",
        work: String(wrong),
        labelEs: "Un compañero de nuestra mesa respondió",
        workEs: String(wrongEs),
      },
    ],
    // 0-based: step 1 is the classmate's answer (the eval's range check and
    // the authored exemplars both index workedExample from 0).
    errorStep: 1,
    correctWork: `The correct answer is ${correct}. ${item.explanation}`,
    correctWorkEs: `La respuesta correcta es ${correctEs}. ${item.explanationEs}`,
  };
  // The distractor's probing question is the ideal hint, but choiceFeedback
  // has no Spanish lane — so the hint inherits the SOURCE item's bilingual
  // hints instead, and is omitted entirely when they are not both present
  // (es-parity treats hints as all-or-nothing).
  if (Array.isArray(item.hints) && item.hints.length && Array.isArray(item.hintsEs)) {
    out.hints = item.hints.slice(0, 1);
    out.hintsEs = item.hintsEs.slice(0, 1);
  }
  return out;
}

let added = 0;
let skippedExisting = 0;
let skippedNoSource = 0;
for (const id of readdirSync("lessons").sort()) {
  const match = VARIANT_RE.exec(id);
  if (!match) continue;
  const path = `lessons/${id}/config.json`;
  let config;
  try {
    config = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    continue;
  }
  const already = TIERS.some((tier) =>
    (config.practice?.[tier] || []).some((item) => item.title === TITLE),
  );
  if (already) {
    skippedExisting += 1;
    continue;
  }
  const source = pickSource(config);
  if (!source) {
    skippedNoSource += 1;
    continue;
  }
  const targetTier = match[1] === "group2" ? "extending" : "onLevel";
  if (!Array.isArray(config.practice[targetTier])) config.practice[targetTier] = [];
  config.practice[targetTier].push(buildDebugItem(source));
  writeFileSync(path, JSON.stringify(config, null, 2) + "\n");
  added += 1;
}
console.log(
  `table-debug items: added ${added}, already present ${skippedExisting}, no bilingual source ${skippedNoSource}`,
);
