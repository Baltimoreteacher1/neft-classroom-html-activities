// Content validation: does every question have an answer key that matches what is displayed? Errors block
// publishing (the teacher must fix them); warnings are the teacher's call. Pure, deterministic, no model.
//
// This is the guard against silent wrong answers: generated and AI-drafted content runs through the same checks
// as hand-typed content, and the math is re-computed with exact arithmetic, never string-compared.

import { expectedNumber, marksOf, tableBlanks } from "./check.js";
import { checkAnimation, explainAnimation } from "../x/animations.js";
import { checkDiagram } from "../x/diagram-render.js";
import { explainDiagram } from "../x/diagram-words.js";
import { SCHEMA_ID, questionsOf } from "./schema.js";
import { evalExpr, parseAnswer, parseNumber, plainMath, ratEquals } from "./math.js";

const words = (s) =>
  String(s ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
const key = (s) => plainMath(s).toLowerCase().replace(/\s+/g, " ").trim();
const hasDupes = (list) => new Set(list.map(key)).size !== list.length;

/** One check per format: returns [[code, message], ...] errors. */
const FORMAT_ERRORS = {
  choice: (q) => {
    const e = [];
    if (q.options.length < 2) e.push(["few-options", "Add at least two answer choices."]);
    if (q.options.some((o) => !o.text.trim()))
      e.push(["empty-option", "An answer choice is empty."]);
    if (!q.options.some((o) => o.id === q.answer))
      e.push(["no-answer", "Pick which choice is correct."]);
    if (hasDupes(q.options.map((o) => o.text)))
      e.push([
        "dup-option",
        "Two answer choices say the same thing, so more than one could be right.",
      ]);
    return e;
  },
  multi: (q) => {
    const e = [];
    if (q.options.length < 3) e.push(["few-options", "Add at least three choices for select-all."]);
    if (!q.answers.length || !q.answers.every((a) => q.options.some((o) => o.id === a)))
      e.push(["no-answer", "Mark every correct choice."]);
    if (q.answers.length === q.options.length)
      e.push(["all-correct", "Every choice is marked correct."]);
    return e;
  },
  match: (q) => {
    const e = [];
    if (q.pairs.length < 2) e.push(["few-pairs", "Add at least two pairs."]);
    if (q.pairs.some((p) => !p.left.trim() || !p.right.trim()))
      e.push(["empty-pair", "A pair is missing one side."]);
    if (hasDupes(q.pairs.map((p) => p.left)) || hasDupes(q.pairs.map((p) => p.right)))
      e.push(["dup-pair", "Two pairs repeat the same word, so a match could be right either way."]);
    return e;
  },
  sort: (q) => {
    const e = [];
    if (q.categories.length < 2) e.push(["few-categories", "Add at least two groups."]);
    if (q.items.length < 2) e.push(["few-items", "Add at least two items to sort."]);
    if (q.items.some((i) => !q.categories.some((c) => c.id === i.category)))
      e.push(["no-category", "Every item needs its correct group."]);
    return e;
  },
  order: (q) =>
    q.items.length < 2
      ? [["few-items", "Add at least two items to put in order."]]
      : q.items.some((i) => !i.text.trim())
        ? [["empty-item", "An item is empty."]]
        : [],
  blank: (q) =>
    marksOf(q.text).length ? [] : [["no-blank", "Mark the missing word with [[double brackets]]."]],
  number: (q) => {
    const e = [];
    const typed = parseAnswer(q.answer, q.unit);
    if (q.expr) {
      const computed = evalExpr(q.expr);
      if (!computed)
        e.push(["bad-expr", "The expression for this answer could not be calculated."]);
      else if (typed && !ratEquals(computed, typed, q.tolerance || 0))
        e.push([
          "wrong-math",
          `The answer key says ${q.answer} but ${q.expr} equals ${computed.d === 1n ? computed.n : `${computed.n}/${computed.d}`}.`,
        ]);
    }
    if (!expectedNumber(q))
      e.push(["no-answer", "Type the correct number (for example 3/4, 0.75, or 12)."]);
    return e;
  },
  short: () => [],
  identify: (q) =>
    marksOf(q.text).length
      ? []
      : [["no-target", "Mark each correct word or phrase with [[double brackets]]."]],
  hotspot: (q) => {
    const e = [];
    if (!q.image?.src) e.push(["no-image", "Add the picture students will click on."]);
    if (q.regions.length < 2) e.push(["few-regions", "Add at least two clickable areas."]);
    if (!q.regions.some((r) => r.id === q.answer)) e.push(["no-answer", "Pick the correct area."]);
    if (
      q.regions.some(
        (r) =>
          r.w <= 0 || r.h <= 0 || r.x < 0 || r.y < 0 || r.x + r.w > 100.01 || r.y + r.h > 100.01,
      )
    )
      e.push(["bad-region", "A clickable area is outside the picture."]);
    return e;
  },
  numberline: (q) => {
    const e = [];
    const a = parseNumber(q.answer);
    if (!(q.max > q.min))
      e.push(["bad-range", "The number line's end must be greater than its start."]);
    if (!a) e.push(["no-answer", "Type the correct number."]);
    else if (a && (Number(a.n) / Number(a.d) < q.min || Number(a.n) / Number(a.d) > q.max))
      e.push(["out-of-range", "The answer is off the number line."]);
    return e;
  },
  build: (q) =>
    q.words.length < 2 ? [["few-words", "Add at least two words to build a sentence."]] : [],
  error: (q) => {
    const e = [];
    if (q.steps.length < 2) e.push(["few-steps", "Show at least two steps."]);
    if (!q.steps.some((s) => s.id === q.errorStep))
      e.push(["no-error-step", "Mark which step has the mistake."]);
    if (q.fixOptions.length < 2 || !q.fixOptions.some((o) => o.id === q.fixAnswer))
      e.push(["no-fix", "Add the fix choices and mark the correct one."]);
    return e;
  },
  fillTable: (q) => {
    const e = [];
    if (!tableBlanks(q).length)
      e.push(["no-blank", "Leave at least one cell for students to fill in."]);
    if (q.rows.some((r) => r.length !== q.headers.length))
      e.push(["ragged", "Every row needs one cell per column."]);
    return e;
  },
  plot: (q) =>
    !q.points.length
      ? [["no-points", "Add the points students should plot."]]
      : q.points.some((p) => p.x < q.min || p.x > q.max || p.y < q.min || p.y > q.max)
        ? [["out-of-range", "A point is off the grid."]]
        : [],
};

/** Prompt-optional formats: the stem is the interaction itself. */
const PROMPT_OPTIONAL = new Set(["blank", "identify", "fillTable"]);
const MIN_ITEMS = { game: 3, interactive: 1, worksheet: 1, check: 1 };

/**
 * @returns {{ok: boolean, errors: Issue[], warnings: Issue[]}} where Issue = {code, blockId, message}.
 * ok means nothing blocks publishing.
 */
export function validateActivity(activity) {
  const errors = [];
  const warnings = [];
  const add = (list, code, message, blockId = "") => list.push({ code, message, blockId });
  if (!activity || activity.schema !== SCHEMA_ID)
    return {
      ok: false,
      errors: [{ code: "bad-schema", message: "This is not an activity.", blockId: "" }],
      warnings,
    };

  const questions = questionsOf(activity);
  if (!activity.title.trim() || activity.title === "Untitled activity")
    add(warnings, "no-title", "Give the activity a title students will recognize.");
  if (questions.length < MIN_ITEMS[activity.kind])
    add(
      errors,
      "few-questions",
      activity.kind === "game"
        ? "A game needs at least three questions to be playable."
        : "Add at least one question.",
    );
  if (!activity.context.grade && !activity.context.subject)
    add(
      warnings,
      "no-context",
      "Choose a grade and subject so students and teachers can find this.",
    );

  const seen = new Map();
  questions.forEach((q, i) => {
    const label = `Question ${i + 1}: `;
    if (!PROMPT_OPTIONAL.has(q.format) && !q.prompt.trim())
      add(errors, "no-prompt", `${label}write the question students will see.`, q.id);
    for (const [code, message] of FORMAT_ERRORS[q.format](q))
      add(errors, code, `${label}${message}`, q.id);
    const p = key(q.prompt + (q.text || ""));
    if (p && seen.has(p))
      add(warnings, "dup-question", `${label}repeats Question ${seen.get(p) + 1}.`, q.id);
    seen.set(p, i);
    if (q.format === "short" && !q.sample.trim() && !q.rubric.length)
      add(
        warnings,
        "no-sample",
        `${label}add a sample response so you and students know what good looks like.`,
        q.id,
      );
    if (activity.supports.hints && !q.hint.trim() && q.format !== "short")
      add(warnings, "no-hint", `${label}add a hint so students who are stuck can try again.`, q.id);
    if (!q.explanation.trim() && q.format !== "short")
      add(
        warnings,
        "no-explanation",
        `${label}add a short explanation shown after students answer.`,
        q.id,
      );
    if (q.image?.src && !q.image.alt.trim() && !q.image.decorative)
      add(warnings, "no-alt", `${label}describe the picture for students who cannot see it.`, q.id);
    if (words(q.prompt) > 60)
      add(warnings, "long-prompt", `${label}is long. Consider splitting it into steps.`, q.id);
    if (
      q.format === "choice" &&
      q.options.some((o) => /^(all|none) of the above$/i.test(o.text.trim()))
    )
      add(warnings, "all-above", `${label}"all/none of the above" makes answers ambiguous.`, q.id);
  });

  for (const b of activity.blocks) {
    if (b.type === "image" && b.src && !b.alt.trim() && !b.decorative)
      add(warnings, "no-alt", "A picture is missing its description for screen readers.", b.id);
    if (b.type === "image" && !b.src)
      add(errors, "bad-image", "A picture could not be used. Use a PNG, JPG, WebP or GIF.", b.id);
    if (b.type === "diagram") {
      const problem = checkDiagram(b);
      if (problem)
        add(errors, "bad-diagram", `A diagram cannot be drawn yet. ${explainDiagram(problem).en}`, b.id);
    }
    if (b.type === "animation") {
      const problem = checkAnimation(b);
      if (problem)
        add(errors, "bad-animation", `An animation cannot be played yet. ${explainAnimation(problem).en}`, b.id);
    }
    if (b.type === "vocab" && b.items.some((v) => !v.term.trim() || !v.def.trim()))
      add(errors, "vocab-empty", "A vocabulary word is missing its meaning.", b.id);
  }
  if (activity.supports.spanish)
    add(
      warnings,
      "check-spanish",
      "Spanish support is on: have a Spanish speaker check the translations before you share.",
    );
  if (
    activity.supports.spanish &&
    activity.blocks.some((b) => b.type === "vocab" && b.items.some((v) => !v.es.trim()))
  )
    add(
      warnings,
      "no-spanish-word",
      "Some vocabulary words have no Spanish. Add them or turn Spanish support off for those words.",
    );
  const standardsClaimed = activity.context.standards.filter((s) => s.origin === "teacher");
  if (standardsClaimed.length)
    add(
      warnings,
      "teacher-standards",
      "Standards you added are labeled as your choice, not official alignment.",
    );
  return { ok: errors.length === 0, errors, warnings };
}
