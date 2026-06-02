// ── Worked-along guided steps — derivation core ──────────────────────────────
// Pure logic (no DOM, no Node APIs) so it can be imported by BOTH the notes
// generator and the DOCX generator. This guarantees the HTML/PDF packet and the
// Word document show the SAME worked example, in the SAME order, with the SAME
// labeled steps.
//
// Goal: let students "see the notes in action." Inside the guided notes we now
// show a gradual-release worked frame:
//   • I Do   — one problem solved all the way through, in simple numbered steps.
//   • We Do  — the next problem with the same step scaffold (blank, solved as a
//              class). Its answer lives only in the Answer Key.
//   • You Do — one more problem to try independently (blank work space).
//
// EVERYTHING is auto-derived from a lesson's existing `config.json` practice
// items (stem, choices, correctIndex, explanation, sampleAnswer). No math facts
// are invented: the I-Do steps are the item's real `explanation`, split into
// sentences; the answer is the item's real correct choice / sample answer.

export const choiceLetter = (i) => String.fromCharCode(65 + i);

// Split a block of explanation text into clean, numbered "steps". Each sentence
// of the real explanation becomes one labeled step.
function explanationToSteps(text) {
  if (!text) return [];
  return String(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// The correct answer for an item, as a student-facing string (for I-Do reveal
// and for the Answer Key). Returns "" when no answer can be derived.
export function answerOf(it = {}) {
  if (Array.isArray(it.choices) && typeof it.correctIndex === "number") {
    return `${choiceLetter(it.correctIndex)}. ${it.choices[it.correctIndex]}`;
  }
  if (it.sampleAnswer) return String(it.sampleAnswer);
  return "";
}

function gatherPractice(practice = {}) {
  return [].concat(
    practice.approaching || [],
    practice.onLevel || [],
    practice.extending || [],
    practice.optional || [],
  );
}

// Build the worked-along model for a lesson config.
//
// Returns:
//   {
//     iDo:  { problem, choices, steps:[string], answer } | null,
//     weDo: { problem, choices, answer } | null,
//     youDo:{ problem, choices, answer } | null,
//     usedStems: string[],           // stems consumed by the worked frame
//     keyRows:  [{ label, answer, why }]  // We-Do / You-Do answers for the key
//   }
export function deriveWorkedSteps(config = {}) {
  const items = gatherPractice(config.practice).filter(
    (it) => it && it.stem && it.type !== "error-analysis",
  );

  const empty = {
    iDo: null,
    weDo: null,
    youDo: null,
    usedStems: [],
    keyRows: [],
  };
  if (!items.length) return empty;

  // Reserve at least one practice item for the independent "Try It" / "On Your
  // Own" section at the end, so the worked frame never swallows every problem.
  const maxWorked = Math.min(3, Math.max(1, items.length - 1));
  const workedItems = items.slice(0, maxWorked);

  // The I-Do must be fully worked, so it needs a real explanation. If the first
  // candidate has none, promote the first candidate that does.
  const hasExpl = (it) => Boolean(it.explanation || it.sampleAnswer);
  if (!hasExpl(workedItems[0])) {
    const idx = workedItems.findIndex(hasExpl);
    if (idx > 0) {
      const [picked] = workedItems.splice(idx, 1);
      workedItems.unshift(picked);
    }
  }

  const [iItem, weItem, youItem] = workedItems;

  const toProblem = (it) =>
    it
      ? {
          problem: it.stem,
          choices: Array.isArray(it.choices) ? it.choices : null,
          answer: answerOf(it),
        }
      : null;

  let steps = explanationToSteps(iItem.explanation || iItem.sampleAnswer);
  if (!steps.length) {
    steps = ["Work through the problem one step at a time, showing each move."];
  }

  const iDo = {
    problem: iItem.stem,
    choices: Array.isArray(iItem.choices) ? iItem.choices : null,
    steps,
    answer: answerOf(iItem),
  };

  const weDo = toProblem(weItem);
  const youDo = toProblem(youItem);

  const keyRows = [];
  if (weDo && weDo.answer) {
    keyRows.push({
      label: "We Try (notes)",
      answer: weDo.answer,
      why: weItem.explanation || "",
    });
  }
  if (youDo && youDo.answer) {
    keyRows.push({
      label: "You Try (notes)",
      answer: youDo.answer,
      why: youItem.explanation || "",
    });
  }

  return {
    iDo,
    weDo,
    youDo,
    usedStems: workedItems.map((it) => it.stem).filter(Boolean),
    keyRows,
  };
}
