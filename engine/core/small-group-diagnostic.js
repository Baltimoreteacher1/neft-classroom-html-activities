// small-group-diagnostic.js — the two minutes that decide what the group needs.
//
// A small-group rotation is short, and until now it opened by teaching. The only
// thing the studio asked before teaching was the readiness pulse — "how ready do
// you feel?" — which is a feeling, not a finding. A student who confidently
// inverts every ratio rates themselves ready, and the teacher discovers the
// actual error eight minutes in, with four minutes left.
//
// This asks up to three questions first and reports what it found. It invents no
// mathematics: every item is one the lesson already authored and validate:math
// already checked, and every diagnosis comes from the shared taxonomy, which
// names an error only when exactly one predicted wrong result matches the
// student's answer. When it cannot name anything it says so plainly rather than
// guessing, because a teacher will act on the label.
//
// Where the items come from matters. It takes them from the END of the practice
// pool — the overflow set that, in a fifteen-minute rotation, most students never
// reach (see the note in small-group-practice.js). Those items were authored,
// validated, and then effectively unreachable. Spending them here costs the
// practice sequence nothing it was reliably delivering, and buys the highest
// leverage two minutes in the rotation. The items are removed from the pool, so
// nothing is asked twice.
//
// Three rules keep it from becoming a test:
//   - No hints, no scaffolds, no retry. It is measuring, not teaching, and a
//     hinted answer measures the hint.
//   - Nothing is scored, and nothing gates. A student can skip the whole thing
//     in one click and land exactly where they would have landed anyway.
//   - It never says "wrong". It names the thinking, in the taxonomy's student
//     voice, and moves on.

import {
  detectMisconception,
  misconceptionLabel,
  resolveAuthoredTag,
  studentExplanation,
} from "./misconceptions.js";
import { bi, el, esc, speak } from "./small-group-ui.js";

/** Ceiling on questions asked. Three at ~30–40s each is the two-minute budget. */
export const MAX_DIAGNOSTIC_ITEMS = 3;

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * Can this item produce a NAMED diagnosis from a wrong answer?
 *
 * Only multiple choice, and only when a wrong choice actually resolves to a
 * taxonomy entry — either because the author tagged the distractor, or because
 * the predictor can derive the error from the stem's own arithmetic. An item
 * whose wrong answers all resolve to nothing is a fine practice problem and a
 * useless diagnostic: it can report "missed", which is what the studio already
 * knew, and nothing more.
 */
export function isDiagnosable(item) {
  if (!item || item.type === "open-response") return false;
  const choices = item.choices;
  if (!Array.isArray(choices) || choices.length < 2) return false;
  const correct = correctIndexOf(item);
  if (correct == null) return false;
  for (let i = 0; i < choices.length; i++) {
    if (i === correct) continue;
    if (diagnose(item, i)) return true;
  }
  return false;
}

/** The authored correct index, however this item spells it. */
export function correctIndexOf(item) {
  if (Number.isInteger(item?.correctIndex)) return item.correctIndex;
  if (Number.isInteger(item?.answerIndex)) return item.answerIndex;
  const answer = item?.answer;
  if (answer != null && Array.isArray(item?.choices)) {
    const i = item.choices.findIndex((c) => String(c).trim() === String(answer).trim());
    if (i >= 0) return i;
  }
  return null;
}

/**
 * Name the misconception behind choice `index`, or null.
 *
 * Authored tags win over inference — an author who named the distractor knows
 * something the arithmetic cannot see — and both are resolved through the same
 * taxonomy, so an unknown or retired tag reports nothing rather than a label the
 * teacher cannot look up.
 */
export function diagnose(item, index) {
  const authored =
    (Array.isArray(item?.misconceptionTags) && item.misconceptionTags[index]) ||
    item?.misconceptionTag ||
    null;
  const choiceText = Array.isArray(item?.choices) ? item.choices[index] : undefined;
  // Authored tags come in two forms — a short alias ("place-value") and a
  // taxonomy id verbatim ("decimal-place-value") — and only resolveAuthoredTag
  // knows both. Testing the raw string against the taxonomy silently rejects
  // every aliased tag, which is most of the authored coverage in the fleet.
  const tag = resolveAuthoredTag(authored) || detectMisconception(item, choiceText, index);
  if (!tag) return null;
  // Round-trip through the taxonomy: a tag with no label is a tag we cannot
  // explain to anyone, and reporting it would be worse than silence.
  return misconceptionLabel(tag) ? tag : null;
}

/**
 * Split a practice pool into the diagnostic set and what remains.
 *
 * Pure, so the selection can be tested without a DOM. Picks from the tail
 * (least-reached first) and preserves the relative order of everything left, so
 * the practice sequence a student then works through is unchanged apart from the
 * absence of the items they have already answered.
 *
 * @param {any[]} items
 * @param {{ max?: number }} [opts]
 * @returns {{ picked: any[], remaining: any[] }}
 */
export function selectDiagnosticItems(items, { max = MAX_DIAGNOSTIC_ITEMS } = {}) {
  const pool = Array.isArray(items) ? items : [];
  // Never strip a pool down to nothing: a diagnostic that consumes the entire
  // practice set has replaced the lesson rather than opened it.
  const budget = Math.max(0, Math.min(max, pool.length - 2));
  if (budget <= 0) return { picked: [], remaining: pool.slice() };

  const chosen = new Set();
  for (let i = pool.length - 1; i >= 0 && chosen.size < budget; i--) {
    if (isDiagnosable(pool[i])) chosen.add(i);
  }
  if (!chosen.size) return { picked: [], remaining: pool.slice() };

  const picked = [];
  const remaining = [];
  pool.forEach((item, i) => (chosen.has(i) ? picked.push(item) : remaining.push(item)));
  // Ask them front-to-back, so the diagnostic reads in the curriculum's order
  // rather than backwards.
  return { picked, remaining };
}

/**
 * Summarise what the diagnostic found, for the student card and the teacher.
 *
 * @param {Array<{ tag: string|null, correct: boolean }>} results
 */
export function summarize(results = []) {
  const answered = results.length;
  const correct = results.filter((r) => r.correct).length;
  const counts = new Map();
  for (const r of results) {
    if (r.correct || !r.tag) continue;
    counts.set(r.tag, (counts.get(r.tag) || 0) + 1);
  }
  const named = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count, label: misconceptionLabel(tag) || tag }));
  return {
    answered,
    correct,
    missed: answered - correct,
    // The single error worth acting on, or null. One, not a list: a teacher
    // mid-rotation can change one thing.
    focus: named[0] || null,
    named,
    // "Clean" is only meaningful if they actually answered something.
    clean: answered > 0 && correct === answered,
  };
}

/**
 * Build the diagnostic launch card.
 *
 * @param {object} opts
 * @param {any[]} opts.items          the items chosen by selectDiagnosticItems
 * @param {object} [opts.store]       studio device store (resume + skip memory)
 * @param {object} [opts.events]      studio event hub; attempts are reported
 *                                    through onAttempt so the existing
 *                                    misconception tally, auto-support tracker
 *                                    and adaptive autopilot all see them, rather
 *                                    than this module keeping a second ledger
 * @param {(summary: any) => void} [opts.onDone]
 * @returns {HTMLElement|null} null when there is nothing worth asking
 */
export function createDiagnosticLaunch({ items = [], store = null, events = {}, onDone } = {}) {
  if (!items.length) return null;

  const section = el("section", "sg-sec sg-diagnostic");
  section.id = "sg-diagnostic";
  section.appendChild(
    el(
      "div",
      "sg-h",
      '<span class="n">0</span><div><div class="sg-eyebrow">Quick check — about 2 minutes</div>' +
        "<h2>Before we start: what do you already do?</h2></div>",
    ),
  );
  section.appendChild(
    el(
      "p",
      null,
      bi(
        "Answer as you would on your own. No hints, nothing counted — this just tells us where to begin.",
        "Responde como lo harías por tu cuenta. Sin pistas y sin calificación: esto solo nos dice por dónde empezar.",
      ),
    ),
  );

  const body = el("div", "sg-diagnostic-body");
  section.appendChild(body);

  const results = [];
  let index = 0;

  const finish = (skipped) => {
    body.innerHTML = "";
    const summary = { ...summarize(results), skipped: Boolean(skipped) };
    store?.set("diagnosticDone", true);
    store?.set("diagnosticSummary", summary);
    body.appendChild(renderSummary(summary));
    onDone?.(summary);
  };

  const renderNext = () => {
    if (index >= items.length) return finish(false);
    body.innerHTML = "";
    body.appendChild(
      renderItem(items[index], index, items.length, (result) => {
        results.push(result);
        index++;
        // A beat to read the response, then straight on. No "Next" button: the
        // whole point is that this takes two minutes.
        window.setTimeout(renderNext, result.correct ? 900 : 2600);
      }),
    );
  };

  const renderItem = (item, i, total, done) => {
    const card = el("div", "card sg-diagnostic-card");
    const counter = el("div", "sg-eyebrow", `Question ${i + 1} of ${total}`);
    card.appendChild(counter);

    const stemText = item.stem || item.title || item.prompt || "";
    const stem = el("p", "sg-diagnostic-stem", bi(stemText, item.stemEs || item.promptEs));
    card.appendChild(stem);
    if (stemText) {
      const read = el("button", "btn ghost sg-read-problem", "🔊 Read this problem");
      read.type = "button";
      read.setAttribute("aria-pressed", "false");
      read.onclick = () => speak(stemText, read);
      card.appendChild(read);
    }

    const correct = correctIndexOf(item);
    const list = el("div", "sg-diagnostic-choices");
    list.setAttribute("role", "group");
    list.setAttribute("aria-label", `Question ${i + 1} answer choices`);
    const feedback = el("div", "fb");
    feedback.setAttribute("aria-live", "polite");

    (item.choices || []).forEach((choice, ci) => {
      const button = el(
        "button",
        "btn ghost sg-diagnostic-choice",
        `<span class="sg-diagnostic-letter">${LETTERS[ci] || ci + 1}</span>` +
          `<span>${bi(String(choice), item.choicesEs?.[ci])}</span>`,
      );
      button.type = "button";
      button.onclick = () => {
        // One answer only. This is a measurement, and a second try measures the
        // first response's feedback instead of the student's thinking.
        list.querySelectorAll("button").forEach((b) => {
          b.disabled = true;
        });
        button.classList.add("is-chosen");
        const isCorrect = ci === correct;
        const tag = isCorrect ? null : diagnose(item, ci);

        // Report through the studio's own hub so the teacher console, the
        // auto-support tracker and the adaptive autopilot all see it.
        events.onAttempt?.({
          correct: isCorrect,
          item,
          response: String(choice),
          choiceIndex: ci,
        });

        feedback.className = "fb show ok";
        feedback.innerHTML = isCorrect
          ? "✓ That is the one — good. Next question."
          : tag
            ? `<b>${esc(misconceptionLabel(tag) || "")}</b><br>${esc(studentExplanation(tag) || "")}`
            : "Thanks — noted. Next question.";
        done({ correct: isCorrect, tag });
      };
      list.appendChild(button);
    });

    card.appendChild(list);
    card.appendChild(feedback);

    const skip = el("button", "btn ghost sg-diagnostic-skip", "Skip the quick check");
    skip.type = "button";
    skip.onclick = () => finish(true);
    card.appendChild(skip);
    return card;
  };

  const restored = store?.get("diagnosticDone") ? store?.get("diagnosticSummary") : null;
  if (restored) body.appendChild(renderSummary(restored));
  else renderNext();

  return section;
}

/**
 * How many times the same error showed up, in words a sixth grader reads at a
 * glance. Capped at the three questions the diagnostic can ask, so this never
 * has to reach for "five times".
 */
export function repeatPhrase(count) {
  if (!(count > 1)) return "";
  if (count === 2) return " — twice";
  return ` — ${count} times`;
}

/**
 * The result card. It is written to be read by a student AND glanced at by a
 * teacher walking past, so it leads with the finding rather than a score.
 */
function renderSummary(summary) {
  const card = el("div", "card sg-diagnostic-result");
  if (summary.skipped && !summary.answered) {
    card.appendChild(el("p", "block-lab", "Quick check skipped — starting from the beginning."));
    return card;
  }

  if (summary.clean) {
    card.appendChild(el("p", "block-lab", "✓ Nothing tripped you up in the quick check."));
    card.appendChild(
      el(
        "p",
        null,
        "You already have the idea. Move quickly through the build and spend your time on the harder practice and the challenge.",
      ),
    );
    return card;
  }

  if (!summary.focus) {
    card.appendChild(
      el("p", "block-lab", `Quick check done — ${summary.correct} of ${summary.answered} right.`),
    );
    card.appendChild(
      el("p", null, "Work through the build step by step; that is where the idea gets set."),
    );
    return card;
  }

  card.appendChild(el("p", "block-lab", "Here is what to watch for today"));
  card.appendChild(
    el(
      "p",
      "sg-diagnostic-focus",
      `<b>${esc(summary.focus.label)}</b>${repeatPhrase(summary.focus.count)}`,
    ),
  );
  const explanation = studentExplanation(summary.focus.tag);
  if (explanation) card.appendChild(el("p", null, esc(explanation)));
  card.appendChild(
    el(
      "p",
      "block-lab",
      "Keep that one thing in mind through the build — it is the piece today is about.",
    ),
  );
  return card;
}
