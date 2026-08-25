import { attachRegenPractice } from "../components/regen-practice.js";
import { isRight, numberOf } from "./answer-match.js";
import { detectConceptTool } from "./concept-tool.js";
import { hasConversionFacts, renderConversionChip } from "./conversion-chart.js";
import { extractDivisionDiagram } from "./division-helper.js";
import { MISCONCEPTIONS } from "./misconceptions.js";
import { compareYourWorkFor } from "./notebook-prompt.js";
import { pickWorkedModel } from "./small-group-adaptive.js";
import { figureBlock } from "./small-group-labs.js";
import { mountReasoningReader } from "./small-group-reasoning.js";
import { createRubricDetails } from "./small-group-rubric.js";
import { appendTryAnotherWay } from "./small-group-strategies.js";
import { bi, biHtml, celebrate, el, esc, speak } from "./small-group-ui.js";
import { appendVisualPractice } from "./small-group-visual-practice.js";
import { mountSymbolPad, needsSymbolPad } from "./symbol-pad.js";
import { renderToolChip } from "./tool-drawer.js";

const firstHint = (item) => item.hints?.[0] || item.hint || null;

/**
 * The distinct misconceptions THIS lesson's own practice items are tagged with,
 * in the order they first appear.
 *
 * The authored `commonMistake` paragraph runs 85 words at the median and 145 at
 * the longest, and it opened the practice phase — for the support group, behind
 * a disclosure, in English only. A Level 1 student meeting a wall of prose
 * before the first problem reads none of it. These tags are the same warning,
 * already written short and already bilingual, and every one of them is a tag
 * the lesson itself put on one of its own items — nothing here is inferred from
 * the prose. Capped at three: a list of six things to avoid is a wall again.
 */
function lessonMisconceptions(config, limit = 3) {
  const seen = new Set();
  const out = [];
  const take = (item) => {
    for (const tag of item?.misconceptionTags || []) {
      const entry = tag && MISCONCEPTIONS[tag];
      if (!entry?.label || seen.has(tag)) continue;
      seen.add(tag);
      out.push(entry);
    }
  };
  for (const tier of ["approaching", "onLevel", "extending", "optional"])
    for (const item of config.practice?.[tier] || []) take(item);
  for (const item of config.parallelPractice || []) take(item);
  return out.slice(0, limit);
}

/**
 * The mistake itself, as one short line, taken verbatim from the authored text.
 *
 * The paragraph is written to a house shape — "A common mistake in <Topic> is
 * <THE MISTAKE> — for example, <an instance>." — so the mistake is a contiguous
 * run inside the first sentence, wrapped in a stock preamble and trailed by an
 * illustration. Both wrappers are dropped and the run between them is kept
 * WORD FOR WORD; nothing is rewritten, summarised or composed. Measured over
 * the 10 lessons that reach this path, it turns 19-67 words into 6-20.
 *
 * A trim that does not land short enough is abandoned in favour of the whole
 * sentence — a half-cut sentence reads as a rendering fault, and the full text
 * is one tap away under "Why this happens" either way.
 */
const MISTAKE_PREAMBLE =
  /^(?:a|the|one|another)\s+(?:most\s+)?common\s+(?:mistake|error)\b[^.]*?\bis\s+/i;
const MISTAKE_ASIDE = /\s+[—–-]\s+|:\s+|,\s+(?:for example|like|such as)\b|;\s+/;

function shortMistake(text) {
  const trimmed = String(text || "").trim();
  const sentence = (trimmed.match(/^.*?[.!?](?=\s|$)/)?.[0] || trimmed).trim();
  const body = sentence.replace(MISTAKE_PREAMBLE, "");
  const clause = body
    .split(MISTAKE_ASIDE)[0]
    .replace(/[\s.,;:—–-]+$/, "")
    .trim();
  if (!clause || clause.split(/\s+/).length > 22) return sentence;
  return clause.charAt(0).toUpperCase() + clause.slice(1);
}

function answerOf(item) {
  if (
    item.type === "multiple-choice" &&
    Array.isArray(item.choices) &&
    Number.isInteger(item.correctIndex)
  )
    return String(item.choices[item.correctIndex]);
  if (item.answer != null) return String(item.answer);
  if (item.sampleAnswer != null) return String(item.sampleAnswer);
  return null;
}

// Momentum note for consecutive-correct answers. Quiet by design: it only
// ever appears on a correct answer and resets silently after a miss.
function streakNote(events) {
  const streak = events.streak?.() || 0;
  if (streak < 2) return "";
  return `🔥 <b>${biHtml(
    `${streak} in a row — your method is working.`,
    `${streak} seguidas: tu método está funcionando.`,
  )}</b> `;
}

// Bilingual correct-answer leads shared by every checkable card.
//
// This was a single constant — "✅ Your reasoning landed." — which meant a
// student working an 18-item set read the identical sentence up to 18 times in
// one rotation. Praise that never varies stops reading as a response to what
// the student did and starts reading as machinery. The voice rule stays the
// same across all of these: name the METHOD working, never rate the child.
//
// Rotation is a plain counter, not Math.random: successive corrects walk the
// list in order, so no two consecutive answers repeat and the sequence is
// deterministic for tests and replays.
export const CORRECT_LEADS = [
  ["Your reasoning landed.", "¡Tu razonamiento dio en el blanco!"],
  ["That's your method working.", "Así funciona tu método."],
  ["Clean thinking — it held up.", "Pensamiento claro: se sostuvo."],
  ["You checked it, and it checks out.", "Lo comprobaste, y cuadra."],
  ["Right — and you could explain why.", "Correcto, y podrías explicar por qué."],
  ["Solid step. Keep that strategy.", "Paso sólido. Conserva esa estrategia."],
];
let correctLeadCursor = 0;
const correctLead = () => {
  const [en, es] = CORRECT_LEADS[correctLeadCursor % CORRECT_LEADS.length];
  correctLeadCursor += 1;
  return `✅ <b>${biHtml(en, es)}</b>`;
};

function itemStem(item) {
  return item.stem || item.title || item.instructions || item.prompt || "Try this problem.";
}

function questionCard(index, stem, stemEs, item = {}) {
  const card = el("div", "prob");
  const p = el("p", "q", `<span class="pn">${index + 1}</span><span>${bi(stem, stemEs)}</span>`);
  if (item.hasConversionChart || hasConversionFacts(stem) || hasConversionFacts(item)) {
    renderConversionChip(p, { label: "Conversion Chart", icon: "📋" });
  }
  const conceptTool = detectConceptTool(stem) || detectConceptTool(itemStem(item));
  if (conceptTool) {
    renderToolChip(p, conceptTool, { label: conceptTool.label, icon: conceptTool.icon });
  }
  card.appendChild(p);

  // Strategy Choice Bar (BCPS UIFR Level 4 T2: Student Strategy Choice & Voice)
  const stratBar = el("div", "sg-strategy-bar");
  stratBar.setAttribute("role", "group");
  stratBar.setAttribute("aria-label", "Choose your strategy");
  stratBar.innerHTML =
    `<span class="sg-strat-label">Strategy:</span>` +
    `<button type="button" class="sg-strat-btn active" data-strat="calc">✍️ Write &amp; Calculate</button>` +
    `<button type="button" class="sg-strat-btn" data-strat="model">🎨 Draw Visual Model</button>` +
    `<button type="button" class="sg-strat-btn" data-strat="manip">🧱 Manipulatives</button>` +
    `<button type="button" class="sg-strat-btn" data-strat="talk">💬 Talk Step-by-Step</button>`;

  const strategyButtons = [...stratBar.querySelectorAll(".sg-strat-btn")];
  strategyButtons.forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.classList.contains("active")));
    btn.onclick = () => {
      strategyButtons.forEach((button) => {
        button.classList.remove("active");
        button.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
    };
  });
  card.appendChild(stratBar);

  const diagramDef = item.diagram || extractDivisionDiagram(item);
  if (diagramDef?.kind) {
    const fig = figureBlock(diagramDef);
    if (fig) card.appendChild(fig);
  }

  const lens = teacherLens(item);
  if (lens) card.appendChild(lens);

  return card;
}

/**
 * Per-item teacher lens — the in-the-moment moves for THIS problem, visible
 * only in Teacher Mode (`body.sg-is-teacher`, set by the authenticated
 * ?teacher=1 flow in small-group-teacher-access.js).
 *
 * The lesson-level studio guide (teacherPanel) answers "how do I run this
 * session"; this strip answers "what do I ask about problem 4 while six
 * students wait". It is built ONLY from fields already authored on the item —
 * the per-distractor probing questions in `choiceFeedback` (which already ship
 * in the student DOM as answer feedback, so nothing new leaks) and the first
 * hint as the nudge. No field is required: an item with neither renders no
 * lens at all.
 *
 * CSS-gated rather than JS-gated on purpose: teacher access resolves ASYNC
 * (an authenticated fetch), and practice may mount first. A hidden element
 * that the `sg-is-teacher` class reveals is immune to that race.
 */
export function teacherLens(item) {
  const probes = [];
  if (Array.isArray(item.choices) && Array.isArray(item.choiceFeedback)) {
    item.choices.forEach((choice, choiceIndex) => {
      if (choiceIndex === item.correctIndex) return;
      const feedbackLine = String(item.choiceFeedback[choiceIndex] || "").trim();
      if (feedbackLine) probes.push({ choice, feedbackLine });
    });
    // Two probes cover the discussion without turning the strip into a study
    // guide; the longest feedback lines carry the richest questions.
    probes.sort((x, y) => y.feedbackLine.length - x.feedbackLine.length);
    probes.length = Math.min(probes.length, 2);
  }
  const nudge = Array.isArray(item.hints) && item.hints.length ? String(item.hints[0]) : "";
  const errorStep =
    item.type === "error-analysis" && Number.isFinite(item.errorStep) ? item.errorStep : null;
  if (!probes.length && !nudge && errorStep == null) return null;

  const rows = [];
  for (const probe of probes) {
    rows.push(
      `<div class="sg-lens-row"><b>If they pick “${esc(probe.choice)}”</b><span>${esc(
        probe.feedbackLine,
      )}</span></div>`,
    );
  }
  if (errorStep != null) {
    rows.push(
      `<div class="sg-lens-row"><b>The error lives at step ${errorStep}</b><span>Let a student find it before you point — ask “which step would you defend?”</span></div>`,
    );
  }
  if (nudge) {
    rows.push(`<div class="sg-lens-row"><b>Nudge, not answer</b><span>${esc(nudge)}</span></div>`);
  }
  const lens = el("div", "sg-lens");
  lens.innerHTML = `<div class="sg-lens-tag">👩‍🏫 Teacher lens · ask before telling</div>${rows.join("")}`;
  return lens;
}

/**
 * Table check — the show-me rhythm for a teacher-led table. Every third solve
 * in a section, the just-finished card grows a group prompt: notebooks up,
 * first steps visible. It rides INSIDE the solved card (never between cards)
 * so pagination and Save/Resume indexes are untouched, and it is dismissible
 * honor-system — the software cannot see a notebook, and pretending otherwise
 * trains dismissal (the same reasoning as the no-lock notebook decision).
 */
export function tableCheck(problemNumber) {
  const block = el("div", "sg-tablecheck");
  block.setAttribute("role", "status");
  block.innerHTML = `<span class="sg-tablecheck-icon" aria-hidden="true">📓</span><div>${biHtml(
    `<b>Table check.</b> Everyone hold up your notebook — show your first step for #${problemNumber}.`,
    `<b>Chequeo de mesa.</b> Todos levanten su cuaderno y muestren su primer paso del n.º ${problemNumber}.`,
  )}</div>`;
  const done = el("button", "sg-tablecheck-done", "We showed our work ✓");
  done.type = "button";
  done.onclick = () => {
    block.classList.add("sg-tablecheck-ok");
    done.disabled = true;
    done.textContent = "Nice — keep going";
  };
  block.appendChild(done);
  return block;
}

function feedback() {
  const node = el("div", "fb");
  node.setAttribute("aria-live", "polite");
  return node;
}

function showFeedback(node, type, html) {
  node.className = `fb show ${type}`;
  node.innerHTML = html;
}

function appendHints(card, item, events = {}) {
  const hints = item.hints || (item.hint ? [item.hint] : []);
  if (!hints.length) return null;
  const hintsEs = Array.isArray(item.hintsEs) ? item.hintsEs : [];
  let shown = 0;
  const row = el("div", "row");
  const button = el("button", "btn ghost", "💡 Open hint 1");
  button.type = "button";
  const box = el("div", "hintbox");
  button.onclick = () => {
    events.onHint?.();
    const line = el("p", null, `<b>Hint ${shown + 1}:</b> ${bi(hints[shown], hintsEs[shown])}`);
    const hintText = hints[shown];
    const speakHint = el("button", "sg-speak-inline", "🔊");
    speakHint.type = "button";
    speakHint.setAttribute("aria-label", `Hear hint ${shown + 1}`);
    speakHint.onclick = () => speak(hintText, speakHint);
    line.appendChild(speakHint);
    box.appendChild(line);
    shown++;
    if (shown >= hints.length) {
      button.disabled = true;
      button.textContent = "All hints opened";
    } else {
      button.textContent = `💡 Open hint ${shown + 1}`;
    }
  };
  row.appendChild(button);
  card.append(row, box);
  // Auto-opener for the adaptive miss path: surfaces the first hint only.
  return () => {
    if (shown === 0 && !button.disabled) button.click();
  };
}

// Deterministic per-problem choice order so the correct answer is not always
// choice A (authored data almost always lists it first), while staying stable
// across re-renders and Save/Resume for a given problem.
function seededOrder(length, seed) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const order = Array.from({ length }, (_, i) => i);
  for (let i = length - 1; i > 0; i--) {
    hash = (Math.imul(hash, 48271) + 1) & 0x7fffffff;
    const j = hash % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * The "compare your written work" line, for a card that asked for a notebook.
 *
 * The card's own DOM is the source of truth: the setup is appended to the card
 * by the section loop, so asking whether it is there cannot disagree with
 * whether it was rendered. Recomputing eligibility here would be a second
 * opinion that can drift from the first.
 */
function compareLine(within, item, correct) {
  // `within` may be the card itself or anything inside it — the two call sites
  // sit in different scopes (`multipleChoiceCard` has the card, `answerControl`
  // only has the status element), and passing whichever is at hand is safer
  // than threading a new parameter through a shared helper.
  const card = within?.closest?.(".prob") || (within?.querySelector ? within : null);
  // The gate is `.sg-notebook-cue`, the instruction small group has ALWAYS
  // shown ("Solve it in your notebook first"). A notebook SETUP block was added
  // here on 2026-08-20 and removed the same day: every independent-tier item
  // already carried this cue, and the section already carries `soloDir` saying
  // the same thing, so the block made three notebook instructions per problem.
  // The compare line is the part small group genuinely lacked, so it stays —
  // keyed to the cue that was already there rather than to a block that should
  // never have been added.
  if (!card?.querySelector?.(".sg-notebook-cue")) return "";
  const c = compareYourWorkFor(item, { asked: true, correct });
  if (!c) return "";
  return `<span class="nb-compare"><span class="nb-compare-icon" aria-hidden="true">\u270F\uFE0F</span>${bi(
    c.en,
    c.es,
  )}</span>`;
}

function multipleChoiceCard(item, index, onSolved, events = {}) {
  const card = questionCard(index, itemStem(item), item.stemEs, item);
  const status = feedback();
  const choices = el("div", "choices");
  let complete = false;
  // Present choices in a shuffled order keyed to the problem text; map each
  // rendered slot back to its authored index so correctIndex/choiceFeedback
  // still line up.
  const order = seededOrder(item.choices.length, itemStem(item) || String(index));
  order.forEach((sourceIndex, slotIndex) => {
    const choice = item.choices[sourceIndex];
    const button = el(
      "button",
      "choice",
      `<span class="k">${String.fromCharCode(65 + slotIndex)}</span><span>${esc(choice)}</span>`,
    );
    button.type = "button";
    button.onclick = () => {
      if (complete) return;
      events.onAttempt?.({
        correct: sourceIndex === item.correctIndex,
        item,
        response: choice,
        // Authored index, not the shuffled slot — misconceptionTags is keyed to
        // the config's original choice order.
        choiceIndex: sourceIndex,
      });
      if (sourceIndex !== item.correctIndex) {
        button.classList.add("wrong");
        button.disabled = true;
        const targeted = item.choiceFeedback?.[sourceIndex];
        // Skip generic authored filler so the engine's better default shows.
        const useful = targeted && !/^re-?read the problem carefully/i.test(targeted.trim());
        showFeedback(
          status,
          "no",
          useful
            ? `<b>Look closer:</b> ${esc(targeted)}`
            : biHtml(
                "That choice does not fit yet. Compare it with the question, open a hint, and try again.",
                "Esa opción todavía no encaja. Compárala con la pregunta, abre una pista e inténtalo de nuevo.",
              ),
        );
        return;
      }
      complete = true;
      button.classList.add("correct");
      [...choices.children].forEach((child) => (child.disabled = true));
      showFeedback(
        status,
        "ok",
        `${streakNote(events)}${correctLead()} ${bi(item.explanation || "Say out loud why this choice works.", item.explanationEs)}${compareLine(card, item, true)}`,
      );
      celebrate((events.streak?.() || 0) >= 3 ? "🔥" : "✓");
      onSolved();
    };
    choices.appendChild(button);
  });
  card.appendChild(choices);
  card.appendChild(status);
  appendHints(card, item, events);
  return card;
}

function errorAnalysisCard(item, index, onSolved, events = {}) {
  const card = questionCard(
    index,
    item.title || item.stem || "Find the reasoning break.",
    item.stemEs || item.titleEs,
    item,
  );
  const work = el("div", "we-steps");
  const list = el("ol", "steps");
  const stepNodes = [];
  item.workedExample.forEach((step) => {
    const li = el(
      "li",
      null,
      `<b>${esc(step.label || "")}</b>${step.work ? ` — ${esc(step.work)}` : ""}`,
    );
    list.appendChild(li);
    stepNodes.push(li);
  });
  work.appendChild(list);
  card.append(work, el("p", "block-lab", "Which step needs repair?"));
  const options = el("div", "choices");
  const status = feedback();
  let complete = false;
  const finish = () => {
    if (complete) return;
    complete = true;
    celebrate("🔧");
    onSolved();
  };
  item.workedExample.forEach((step, optionIndex) => {
    const button = el(
      "button",
      "choice",
      `<span class="k">${optionIndex + 1}</span><span>${esc(step.label || `Step ${optionIndex + 1}`)}</span>`,
    );
    button.type = "button";
    button.onclick = () => {
      if (complete) return;
      // Configs author errorStep as a 0-based index into workedExample.
      events.onAttempt?.({ correct: optionIndex === item.errorStep });
      if (optionIndex !== item.errorStep) {
        button.classList.add("wrong");
        button.disabled = true;
        const hint = firstHint(item);
        const hintEs = item.hintsEs?.[0] || item.hintEs;
        showFeedback(
          status,
          "no",
          hint
            ? biHtml(
                `That step looks correct. <b>Clue:</b> ${esc(hint)}`,
                `Ese paso parece correcto. <b>Pista:</b> ${esc(hintEs || hint)}`,
              )
            : biHtml(
                "That step looks correct. Check the math in a different step.",
                "Ese paso parece correcto. Revisa las cuentas en otro paso.",
              ),
        );
        return;
      }
      button.classList.add("correct");
      [...options.children].forEach((child) => (child.disabled = true));
      // Animate the mistaken step, then invite a same-visual repair.
      const broken = stepNodes[optionIndex];
      broken?.classList.add("sg-error-break");
      const repair = el("div", "sg-error-repair");
      repair.appendChild(
        el(
          "p",
          "block-lab",
          biHtml(
            "Fix it on this step — rewrite the work so the reasoning holds.",
            "Corrige este paso: reescribe el trabajo para que el razonamiento se sostenga.",
          ),
        ),
      );
      const fixInput = el("textarea", "sg-ta");
      fixInput.setAttribute("aria-label", "Your repaired step");
      fixInput.placeholder = item.correctWork
        ? "Rewrite the repaired step in your own words…"
        : "Write the correct work for this step…";
      const fixBtn = el("button", "btn", "Check my repair");
      fixBtn.type = "button";
      const fixRow = el("div", "row");
      fixRow.appendChild(fixBtn);
      repair.append(fixInput, fixRow);
      work.appendChild(repair);
      showFeedback(
        status,
        "info",
        biHtml(
          "You found the break. Now repair that step on the same visual.",
          "Encontraste el error. Ahora repara ese paso en el mismo visual.",
        ),
      );
      fixBtn.onclick = () => {
        if (fixInput.value.trim().length < 6) {
          showFeedback(
            status,
            "no",
            biHtml(
              "Add the repaired work (a full step) before checking.",
              "Escribe el trabajo corregido (un paso completo) antes de revisar.",
            ),
          );
          return;
        }
        fixInput.disabled = true;
        fixBtn.disabled = true;
        broken?.classList.remove("sg-error-break");
        broken?.classList.add("sg-error-fixed");
        showFeedback(
          status,
          "ok",
          `✅ <b>${biHtml("You repaired the reasoning.", "¡Reparaste el razonamiento!")}</b> ${item.correctWork ? `Model repair: ${esc(item.correctWork)}` : biHtml("Say the repair out loud in your own words.", "Di la corrección en voz alta con tus propias palabras.")}`,
        );
        finish();
      };
    };
    options.appendChild(button);
  });
  card.appendChild(options);
  card.appendChild(status);
  appendHints(card, item, events);
  return card;
}

const operators = { "+": "+", "-": "−", "−": "−", x: "×", "×": "×", "*": "×", "/": "÷", "÷": "÷" };
function parseEquation(stem) {
  const match = String(stem).match(/(-?\d+(?:\.\d+)?)\s*([+\-x×*/÷])\s*(-?\d+(?:\.\d+)?)/i);
  if (!match) return null;
  return {
    left: match[1],
    operator: operators[match[2].toLowerCase()] || match[2],
    right: match[3],
  };
}

function answerControl(item, answer, scaffold, status, onSolved, events = {}, onStruggle, onStuck) {
  const box = el("div");
  const equation = parseEquation(itemStem(item));
  const input = el("input", "fillin");
  input.type = "text";
  input.placeholder = "?";
  input.setAttribute("aria-label", "Your answer");
  if (numberOf(answer) != null) input.inputMode = "decimal";
  if (equation) {
    box.appendChild(
      el(
        "div",
        "eqcap",
        `${esc(equation.left)} ${esc(equation.operator)} ${esc(equation.right)} = ?`,
      ),
    );
    const stack = el("div", "colmath");
    stack.append(
      el("div", null, esc(equation.left)),
      el(
        "div",
        null,
        `<span class="col-op">${esc(equation.operator)}</span>${esc(equation.right)}`,
      ),
      el("div", "col-rule"),
    );
    const answerRow = el("div");
    answerRow.appendChild(input);
    stack.appendChild(answerRow);
    box.appendChild(stack);
  } else {
    const line = el("div", "fillline");
    line.append(el("span", "filllab", "Your answer:"), input);
    if (item.unit) line.appendChild(el("span", "fillunit", esc(item.unit)));
    box.appendChild(line);
  }
  // Inequality answers: ≤ and ≥ are not on the keyboard, so offer them as
  // buttons that type themselves into the box.
  if (needsSymbolPad(answer)) mountSymbolPad(input, { force: true });
  // The bank always exists (hidden when unscaffolded) so the adaptive coach's
  // "stabilize" move can open it later without rebuilding the card.
  let bank = null;
  if (item.choices?.length) {
    bank = el("div", "wbank");
    bank.appendChild(el("span", "wbank-lab", "Tap-to-try bank:"));
    item.choices.forEach((choice) => {
      const chip = el("button", "wchip", esc(choice));
      chip.type = "button";
      chip.onclick = () => {
        input.value = choice;
        input.focus();
      };
      bank.appendChild(chip);
    });
    bank.hidden = !scaffold;
    box.appendChild(bank);
  }
  const row = el("div", "row");
  const check = el("button", "btn", "Check my thinking");
  check.type = "button";
  let tries = 0;
  check.onclick = () => {
    tries++;
    const correct = isRight(input.value, answer);
    // The raw response travels with the attempt so the misconception detector can
    // name HOW this was wrong. It is read on-device and never leaves it.
    events.onAttempt?.({ correct, item, response: input.value });
    if (!correct) {
      input.classList.add("bad");
      const opened = tries >= 2 && onStruggle?.();
      // Third miss: bring the first hint to the student instead of waiting.
      if (tries >= 3) onStuck?.();
      const hint = firstHint(item);
      const hintEs = item.hintsEs?.[0] || item.hintEs;
      showFeedback(
        status,
        "no",
        tries === 1
          ? hint
            ? biHtml(
                `Not yet. <b>Try this:</b> ${esc(hint)}`,
                `Todavía no. <b>Prueba esto:</b> ${esc(hintEs || hint)}`,
              )
            : biHtml(
                "Not yet. Re-read the question, check one step, and try again.",
                "Todavía no. Vuelve a leer la pregunta, revisa un paso e inténtalo otra vez.",
              )
          : opened
            ? biHtml(
                "Still building — so the step guide below just opened for you. Walk it one line at a time, then revise your answer.",
                "Aún en construcción: la guía de pasos de abajo se acaba de abrir para ti. Síguela línea por línea y corrige tu respuesta.",
              )
            : biHtml(
                "Still building. Open the next hint or re-walk the worked example in Build — then revise your answer.",
                "Aún en construcción. Abre la siguiente pista o repasa el ejemplo resuelto en Build y corrige tu respuesta.",
              ),
      );
      return;
    }
    input.classList.remove("bad");
    input.classList.add("ok");
    input.disabled = true;
    check.disabled = true;
    showFeedback(
      status,
      "ok",
      `${streakNote(events)}${correctLead()} ${bi(item.explanation || "Explain the step that convinced you.", item.explanationEs)}${compareLine(status, item, true)}`,
    );
    celebrate((events.streak?.() || 0) >= 3 ? "🔥" : "✓");
    onSolved();
  };
  input.onkeydown = (event) => {
    if (event.key === "Enter") check.click();
  };
  row.appendChild(check);
  box.appendChild(row);
  box.showBank = () => {
    if (bank) bank.hidden = false;
  };
  return box;
}

// Six, not four. The cap silently truncated authored step sequences: the
// worked explanation for "What is 14.6 + 3.85?" is six clean steps — line up,
// hundredths, tenths, ones, tens, answer — and a student who pressed "Break it
// into steps" got the first four and never saw 18.45. Across the studios 27
// explanations ran past four sentences and 19 of them hid the result.
//
// Eight, with headroom. The fleet's longest authored explanation is seven
// sentences (a fill-table item in 7-2-group2, whose last line is the
// generalisation the rest builds to), and the distribution falls off a cliff
// after four: 384 items at four, 20 at five, 21 at six, exactly one at seven.
// Eight therefore shows every authored step today and leaves room for one more
// without becoming a wall of text.
//
// A first pass set this to 6 on the belief that nothing exceeded six. That was
// measured over items carrying `choices`, which silently excluded fill-table
// items — the one seven-sentence explanation in the fleet is exactly such an
// item. Count over everything with an `explanation`, not over what looks like a
// multiple-choice question.
const MAX_STEPS = 8;

export function explanationSteps(item) {
  return String(item.explanation || "")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 2)
    .slice(0, MAX_STEPS);
}

function appendStepGuide(card, item, scaffold) {
  const steps = explanationSteps(item);
  if (!steps.length) return null;
  const row = el("div", "row");
  const button = el("button", "btn ghost", "🧩 Break it into steps");
  button.type = "button";
  const list = el("div", "steplist");
  list.hidden = true;
  steps.forEach((sentence, index) => {
    const line = el("div", "stepline");
    line.appendChild(el("span", "sn", String(index + 1)));
    const match = scaffold ? sentence.match(/^(.*?)(\d+(?:\.\d+)?)(?!.*\d)(.*)$/) : null;
    if (!match) line.appendChild(el("span", null, esc(sentence)));
    else {
      line.appendChild(el("span", null, esc(match[1])));
      const blank = el("input", "stepfill");
      blank.type = "text";
      blank.inputMode = "decimal";
      blank.setAttribute("aria-label", `Step ${index + 1} blank`);
      blank.oninput = () => blank.classList.toggle("ok", isRight(blank.value, match[2]));
      line.append(blank, el("span", null, esc(match[3])));
    }
    list.appendChild(line);
  });
  const show = () => {
    if (!list.hidden) return false;
    list.hidden = false;
    button.textContent = "Hide step guide";
    return true;
  };
  button.onclick = () => {
    if (list.hidden) show();
    else {
      list.hidden = true;
      button.textContent = "🧩 Break it into steps";
    }
  };
  row.appendChild(button);
  card.append(row, list);
  return show;
}

function responseCard(item, index, variant, onSolved, scaffold, events = {}) {
  const card = questionCard(index, itemStem(item), item.stemEs, item);
  const status = feedback();
  const answer = answerOf(item);
  // Wired after the guide/hints exist (they render below the control); after
  // two misses the control auto-opens the step guide, after three it also
  // opens the first hint — support arrives without a hunt.
  let revealGuide = null;
  let openHint = null;
  let control = null;
  if (answer != null) {
    control = answerControl(
      item,
      answer,
      scaffold,
      status,
      onSolved,
      events,
      () => {
        revealGuide?.();
        // Notebook-first cards fold the workspace away by default; two misses
        // mean the notebook attempt needs the model, so it opens itself.
        card.__openGuidance?.();
      },
      () => openHint?.(),
    );
    card.appendChild(control);
  } else {
    /*
     * Sentence frames, finally rendered.
     *
     * 209 `sentenceStems` blocks are authored across 44 lesson configs and NOT
     * ONE of them reached a student: nothing in engine/, assets/ or shared/ read
     * the field. The content-preservation baseline fingerprints them, so they
     * were protected — but protected and invisible. A struggling writer was
     * being handed a blank box while the scaffold written for that exact task
     * sat in the config.
     *
     * They belong here, above the box, where a student looks before writing.
     */
    const stems = framesRow(item.sentenceStems, item.sentenceStemsEs);
    if (stems) {
      const label = el("p", "block-lab", bi("Sentence frames", "Marcos de oración"));
      label.id = `sg-frames-${index}`;
      card.appendChild(label);
      card.appendChild(stems);
    }

    const response = el("textarea", "sg-ta");
    // Point assistive tech at the frames, so the scaffold is announced with the
    // box rather than sitting near it visually and nowhere semantically.
    if (stems) response.setAttribute("aria-describedby", `sg-frames-${index}`);
    response.placeholder =
      variant === "group2"
        ? "Make a claim, use evidence, and explain why…"
        : "Show or explain your thinking…";
    // A reader on the writing. Until now this box collected a student's best
    // thinking and nothing on earth read it.
    const reader = mountReasoningReader(response, {
      prompt: itemStem(item) || "Explain your thinking.",
      standard: item._standard || "",
      answerShown: item.answer || "",
      misconception: events.misconception,
    });
    const ready = el("button", "btn", "I'm ready to share");
    ready.type = "button";
    ready.onclick = () => {
      if (response.value.trim().length < 8) {
        events.onAttempt?.({ correct: false });
        showFeedback(
          status,
          "no",
          biHtml(
            "Add one complete thought before you share. A sentence frame or word bank can help.",
            "Escribe una idea completa antes de compartir. Un marco de oración o el banco de palabras te puede ayudar.",
          ),
        );
        return;
      }
      events.onAttempt?.({ correct: true });
      response.disabled = true;
      ready.disabled = true;
      showFeedback(
        status,
        "ok",
        biHtml(
          "✓ Read your reasoning out loud, then ask yourself: what evidence makes it convincing?",
          "✓ Lee tu razonamiento en voz alta y pregúntate: ¿qué evidencia lo hace convincente?",
        ),
      );
      onSolved();
    };
    card.append(response, reader, el("div", "row"));
    card.lastElementChild.appendChild(ready);
  }
  // Feedback lands directly under the answer control so it is on-screen the
  // moment it appears; the step guide and hints render below it.
  card.appendChild(status);
  // Open-response work is judged on named criteria, not keyword luck: the
  // 4-point rubric folds in under the feedback slot so the bar is public.
  if (answer == null) card.appendChild(createRubricDetails(variant));
  revealGuide = appendStepGuide(card, item, scaffold);
  openHint = appendHints(card, item, events);
  // Hook for the adaptive coach: "stabilize" opens this card's supports
  // (tap-to-try bank + step guide) without rebuilding anything.
  card.sgApplySupport = () => {
    control?.showBank?.();
    revealGuide?.();
  };
  return card;
}

const itemKey = (item) => item.stem || item.title || JSON.stringify(item).slice(0, 60);

function tagPracticeItem(item, tier, practiceIndex, standard = "") {
  // Shallow copy so we never mutate authored config objects; tags are engine-
  // only and keep Save/Resume indices stable across adaptive reordering.
  // `_standard` gives every rendered item a standard alignment so evidence can
  // roll up per standard instead of only per lesson.
  return {
    ...item,
    _tier: tier,
    _practiceIndex: practiceIndex,
    _standard: item.standard || standard || "",
  };
}

// Level 1 and Catch-Up rendered a bank that was 100% `guided-fill` — twelve
// identical typed-step drills — while only Level 2 ever received the authored
// multiple-choice / error-analysis / sort items sitting in the same config.
// Pull a balanced, tier-appropriate slice of that authored bank so every level
// gets format variety. Support tiers draw from the easier tiers only.
const VARIETY_TIERS = {
  group1: ["approaching", "onLevel"],
  catchup: ["approaching", "onLevel"],
};
const VARIETY_LIMIT = 6;

function varietySlice(config, variant, seen) {
  const tiers = VARIETY_TIERS[variant];
  if (!tiers) return [];
  const lanes = new Map();
  for (const tier of tiers) {
    for (const item of config.practice?.[tier] || []) {
      if (!item || seen.has(itemKey(item))) continue;
      const type = item.type || "multiple-choice";
      if (!lanes.has(type)) lanes.set(type, []);
      lanes.get(type).push({ item, tier });
    }
  }
  // Round-robin across item types so the slice can never collapse into six
  // multiple-choice questions — format variety is the entire point.
  const out = [];
  const buckets = [...lanes.values()];
  for (let round = 0; out.length < VARIETY_LIMIT; round += 1) {
    let added = false;
    for (const bucket of buckets) {
      if (round >= bucket.length) continue;
      out.push(bucket[round]);
      added = true;
      if (out.length >= VARIETY_LIMIT) break;
    }
    if (!added) break;
  }
  return out;
}

export function collectPracticeItems(config) {
  const standard = config.standard || "";
  if (Array.isArray(config.parallelPractice) && config.parallelPractice.length) {
    const items = config.parallelPractice.map((item, index) =>
      tagPracticeItem(item, "onLevel", index, standard),
    );
    const seen = new Set(items.map(itemKey));
    // Group 2's authored enrichment (justify, error-analysis, challenge
    // panels) is real content — append it after the parallel set instead of
    // dropping it, so mastery students get genuine extension work.
    if (config.variant === "group2") {
      for (const item of config.practice?.extending || []) {
        const key = itemKey(item);
        if (seen.has(key)) continue;
        seen.add(key);
        items.push(tagPracticeItem(item, "extending", items.length, standard));
      }
    } else {
      // Level 1 / Catch-Up get the same courtesy: a balanced slice of the
      // authored bank so their practice is not twelve identical guided fills.
      for (const { item, tier } of varietySlice(config, config.variant, seen)) {
        seen.add(itemKey(item));
        items.push(tagPracticeItem(item, tier, items.length, standard));
      }
      // The table debugging task ("Fix our table's thinking") is a deliberate
      // group ritual, not variety filler — when the round-robin fills its six
      // seats before reaching it (an existing error-analysis item wins the
      // lane), the ritual silently vanishes for that lesson. Measured before
      // this guarantee: 30/84 group1 and 18/36 catch-up lessons reached it.
      // Presence in the config is not reachability; give it its own seat.
      for (const tier of ["approaching", "onLevel"]) {
        for (const item of config.practice?.[tier] || []) {
          if (!item?.tableDebug || seen.has(itemKey(item))) continue;
          seen.add(itemKey(item));
          items.push(tagPracticeItem(item, tier, items.length, standard));
        }
      }
    }
    return items;
  }
  const tiers = ["approaching", "onLevel", "extending", "optional"];
  const seen = new Set();
  const items = [];
  for (const tier of tiers) {
    for (const item of config.practice?.[tier] || []) {
      const key = itemKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(tagPracticeItem(item, tier, items.length, standard));
    }
  }
  return items;
}

/** Score how strongly an item matches an adaptive path (higher = promote). */
function adaptiveScore(item, pathId) {
  const tier = item?._tier || "";
  const hasHints = Boolean(item?.hints?.length || item?.hint);
  if (pathId === "stabilize") {
    if (tier === "approaching") return 40;
    if (hasHints) return 25;
    if (item?.type === "multiple-choice") return 10;
    return 0;
  }
  if (pathId === "stretch") {
    if (tier === "extending") return 40;
    if (tier === "optional") return 30;
    if (item?.type === "error-analysis") return 20;
    // Later bank items (higher authored index) read as stretch-ready.
    return Math.min(15, Number(item?._practiceIndex) || 0);
  }
  return 0;
}

/**
 * Re-order practice items for an adaptive path without dropping any.
 * Stable when scores tie — original relative order is preserved.
 * Save/Resume keys stay on `_practiceIndex`, not display position.
 */
export function orderItemsForAdaptivePath(items = [], pathId = "connect") {
  if (!Array.isArray(items) || !items.length) return [];
  if (!pathId || pathId === "connect") return items.slice();
  return items
    .map((item, index) => ({ item, index, score: adaptiveScore(item, pathId) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
}

/**
 * Spread the FORMATS through the set instead of serving them in blocks.
 *
 * Every one of the 148 generated small-group lessons opened with twelve
 * consecutive `guided-fill` items — the whole `parallelPractice` bank — and
 * only reached its multiple-choice / error-analysis variety at item 13. In a
 * 15-minute station rotation a lot of students never got there, so the variety
 * that was authored for them was, in practice, for nobody. Measured across the
 * fleet: longest single-format run 12.1 items on average, and the guided-fill
 * block was contiguous in 148 of 148 lessons.
 *
 * The dominant format is dealt into evenly sized gaps around the others, so 12
 * fills and 5 others render as `GF GF · GF GF · GF GF …` — runs of 2, the
 * arithmetic best for those counts.
 *
 * Two tempting versions are both wrong, and were both measured on this fleet
 * before this one:
 *   - Strict alternation ("most remaining format that is not the last one")
 *     pairs 1-to-1, exhausts the minority at the halfway point, and leaves the
 *     whole remainder of the majority in a tail block. Still left runs of 9.
 *   - Spreading every format independently across [0,1] by its own (k+0.5)/c
 *     fraction looks right and is close, but the separators land on their own
 *     fractions rather than on the block's, so the gaps come out uneven. Left
 *     runs of 3 where 2 was achievable, on 84 of 148 lessons.
 *
 * Ties break on the item's incoming position, so the output is deterministic:
 * the same config always renders the same order, which matters because these
 * lessons are generated and diffed.
 *
 * DISPLAY ONLY. `_practiceIndex` rides along on each item untouched, because
 * that — not display position — is the Save/Resume key (see
 * `orderItemsForAdaptivePath`, which established the same contract). A student
 * mid-lesson keeps every saved answer attached to the problem they answered.
 */
export function interleaveByFormat(items = []) {
  if (!Array.isArray(items) || items.length < 3) return (items || []).slice();
  const buckets = new Map();
  items.forEach((item, index) => {
    const key = item?.type || "?";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push({ item, index });
  });
  // One format present means there is nothing to interleave, and returning the
  // input untouched keeps single-format sets in their authored order.
  if (buckets.size < 2) return items.slice();

  // The dominant format is the one that forms the block; everything else is a
  // separator. Ties resolve to whichever appeared first, so this is stable.
  let dominantType = null;
  for (const [type, list] of buckets) {
    if (!dominantType || list.length > buckets.get(dominantType).length) dominantType = type;
  }
  const dominant = buckets.get(dominantType).slice();

  // Separators are themselves spread across their own formats, so a lesson with
  // three multiple-choice and two error-analysis alternates them instead of
  // emitting MC MC MC EA EA between the fills.
  const separators = [];
  for (const [type, list] of buckets) {
    if (type === dominantType) continue;
    list.forEach((entry, k) => separators.push({ ...entry, at: (k + 0.5) / list.length }));
  }
  separators.sort((a, b) => a.at - b.at || a.index - b.index);
  if (!separators.length) return items.slice();

  // Deal the dominant items into the gaps AROUND the separators, as evenly as
  // the counts allow. Spreading each format independently is not enough: the
  // separators land on their own fractions rather than on the block's, so the
  // gaps come out uneven and a run of 3 survives where 2 was achievable.
  const gaps = separators.length + 1;
  const base = Math.floor(dominant.length / gaps);
  const extra = dominant.length % gaps;
  const out = [];
  let cursor = 0;
  for (let gap = 0; gap < gaps; gap += 1) {
    const take = base + (gap < extra ? 1 : 0);
    for (let n = 0; n < take; n += 1) out.push(dominant[cursor++].item);
    if (gap < separators.length) out.push(separators[gap].item);
  }
  return out;
}

/**
 * The order a practice set is actually drawn in: adaptive priority first, then
 * written responses pushed to the close, then formats interleaved within the
 * checkable group.
 *
 * Extracted so the variety gate can exercise the REAL ordering instead of a
 * copy of it — a re-implementation in the test would keep passing after this
 * pipeline changed underneath it.
 *
 * Interleaving runs after the adaptive sort rather than before it, because the
 * adaptive score groups by tier and type and would otherwise re-cluster what
 * this just spread. Priority is not lost: each format bucket keeps its incoming
 * order, so the highest-scored item of a format is still the first of that
 * format to appear.
 */
export function practiceDisplayOrder(collected = [], pathId = "connect") {
  const ordered = orderItemsForAdaptivePath(collected, pathId);
  // Only a genuine WRITTEN response closes the set. This used to be "anything
  // `answerOf` cannot score", which swept the manipulatives out with the
  // essays: across the fleet that stranded 19 fill-table, 13 drag-sort, 5
  // matching-game, 3 number-line and 3 coordinate-grid items behind the whole
  // practice bank, where the students who ran out of time never reached them.
  // Position never affected whether those widgets RENDER — only whether anyone
  // got to them — so they belong in the flow with everything else.
  const written = ordered.filter((item) => item.type === "open-response");
  const interactive = ordered.filter((item) => item.type !== "open-response");
  return [...interleaveByFormat(interactive), ...written];
}

/**
 * Additive stretch: ensure authored extending items appear in the More Practice
 * set when the stretch path is chosen. Never removes existing items; tags new
 * arrivals with fresh `_practiceIndex` values past the current max so prior
 * Save/Resume slots stay intact.
 */
export function bringInExtendingItems(items = [], config = {}) {
  const extending = config.practice?.extending || [];
  if (!extending.length) return items.slice();
  const out = items.slice();
  const seen = new Set(out.map(itemKey));
  let nextIndex =
    out.reduce((max, item) => Math.max(max, Number(item._practiceIndex) || 0), -1) + 1;
  for (const item of extending) {
    const key = itemKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tagPracticeItem(item, "extending", nextIndex++, config.standard || ""));
  }
  return out;
}

function problemCard(item, index, variant, onSolved, scaffold, events = {}, strategyContext = {}) {
  let revealAlternative = () => {};
  const cardEvents = {
    ...events,
    onAttempt(payload) {
      events.onAttempt?.(payload);
      revealAlternative();
    },
  };
  const card =
    item.type === "multiple-choice" && item.choices?.length
      ? multipleChoiceCard(item, index, onSolved, cardEvents)
      : item.type === "error-analysis" && item.workedExample?.length
        ? errorAnalysisCard(item, index, onSolved, cardEvents)
        : responseCard(item, index, variant, onSolved, scaffold, cardEvents);
  revealAlternative = appendTryAnotherWay(card, {
    config: strategyContext.config,
    item,
    originalStrategy: strategyContext.getOriginalStrategy,
    storageKey: strategyContext.storageKey,
    store: strategyContext.store,
  });
  card.__showTryAnotherWay = revealAlternative;
  return card;
}

function paginateProblems(section) {
  const cards = [...section.querySelectorAll(":scope > .prob")];
  if (cards.length < 2) return;
  let index = 0;
  const controls = el("div", "sg-problem-nav");
  const previous = el("button", "btn ghost", "← Previous");
  const status = el("span", "sg-problem-count");
  status.setAttribute("aria-live", "polite");
  const next = el("button", "btn", "Next problem →");
  previous.type = next.type = "button";
  const show = (nextIndex) => {
    index = Math.max(0, Math.min(cards.length - 1, nextIndex));
    cards.forEach((card, cardIndex) => {
      card.hidden = cardIndex !== index;
    });
    previous.disabled = index === 0;
    next.disabled = index === cards.length - 1;
    status.textContent = `Problem ${index + 1} of ${cards.length}`;
    cards[index].scrollIntoView?.({ behavior: "smooth", block: "start" });
  };
  previous.onclick = () => show(index - 1);
  next.onclick = () => show(index + 1);
  controls.append(previous, status, next);
  section.appendChild(controls);
  show(0);
}

export function createPracticeSection(
  config,
  onPhaseDone,
  tally,
  events = {},
  store = null,
  options = {},
) {
  let collected = options.items || collectPracticeItems(config);
  // Stretch path can add authored extending items that weren't in this slice
  // yet — additive only, never removes what students already need.
  if (options.adaptivePath === "stretch" && options.mode === "more") {
    collected = bringInExtendingItems(collected, config);
  }
  const pathId = options.adaptivePath || "connect";
  const items = practiceDisplayOrder(collected, pathId);
  if (!items.length) return null;
  const section = el("section", "sg-sec");
  section.id = options.id || "sg-practice";
  section.dataset.adaptivePath = pathId;
  const title =
    options.title ||
    (config.variant === "group2"
      ? "Challenge, justify, generalize"
      : "Practice with hints on standby");
  section.appendChild(
    el(
      "div",
      "sg-h",
      `<span class="n">${options.number || 3}</span><div><div class="sg-eyebrow">${esc(options.eyebrow || "Try · revise · explain")}</div><h2>${esc(title)}</h2></div>`,
    ),
  );
  if (options.directions)
    section.appendChild(el("p", "sg-directions", bi(options.directions, options.directionsEs)));
  // Live path banner for More Practice — shows how the coach reordered the set.
  let pathBanner = null;
  if (options.mode === "more") {
    pathBanner = el("div", "sg-adaptive-banner");
    pathBanner.hidden = pathId === "connect";
    pathBanner.setAttribute("aria-live", "polite");
    const pathCopy = {
      stabilize: biHtml(
        "Stabilize path: scaffold-friendly problems are up front. Supports open on miss.",
        "Ruta Estabilizar: los problemas con andamiaje van primero. Los apoyos se abren al fallar.",
      ),
      stretch: biHtml(
        "Stretch path: extending challenges are promoted. Keep proving your method.",
        "Ruta Estirar: los retos de extensión van primero. Sigue demostrando tu método.",
      ),
    };
    pathBanner.innerHTML = pathCopy[pathId] || "";
    section.appendChild(pathBanner);
  }
  const mistake = config.practice?.commonMistake;
  const mistakeText = typeof mistake === "string" ? mistake : mistake?.text || mistake?.mistake;
  if (mistakeText && config.variant !== "group2" && options.showMistake !== false) {
    // Short and visual first, prose second. The chips are the lesson's own
    // misconception tags (bilingual, ~6 words each); when a lesson carries no
    // tags the paragraph's opening sentence stands in, so every lesson leads
    // with ONE readable line instead of a paragraph. The full authored text is
    // never dropped — it moves behind "Why this happens", where a student who
    // wants the whole explanation can still reach it, and print unfolds it.
    const card = el("section", "sg-watchout");
    card.setAttribute("role", "note");
    card.appendChild(el("div", "sg-watchout-head", bi("⚠️ Watch out for this", "⚠️ Ojo con esto")));
    const flags = lessonMisconceptions(config);
    const list = el("ul", "sg-watchout-list");
    if (flags.length) {
      for (const flag of flags) {
        const row = el("li", "sg-watchout-item");
        row.appendChild(el("span", "sg-watchout-x", "✗"));
        row.appendChild(el("span", "sg-watchout-text", bi(flag.label, flag.labelEs || "")));
        list.appendChild(row);
      }
    } else {
      const row = el("li", "sg-watchout-item");
      row.appendChild(el("span", "sg-watchout-x", "✗"));
      row.appendChild(el("span", "sg-watchout-text", esc(shortMistake(mistakeText))));
      list.appendChild(row);
    }
    card.appendChild(list);
    card.appendChild(
      el(
        "details",
        "mistake sg-watchout-why",
        `<summary>${bi("Why this happens", "Por qué pasa")}</summary><p>${esc(mistakeText)}</p>`,
      ),
    );
    section.appendChild(card);
  }
  let solved = 0;
  // Live solves only — feeds the every-third-solve table check. Restored
  // cards call solveItem directly and never touch this.
  let solvedLive = 0;
  // Count each item at most once so a restored-then-resolved card can't
  // double-credit the tally.
  const counted = new Set();
  const solveItem = (storeIndex) => {
    if (counted.has(storeIndex)) return;
    counted.add(storeIndex);
    solved++;
    tally.solved++;
    events.onSolved?.();
    tally.update?.();
    store?.addTo("solvedPractice", storeIndex);
    if (solved >= Math.ceil(items.length * 0.6)) onPhaseDone();
  };
  const cardsByIndex = new Map();
  items.forEach((item, index) => {
    tally.total++;
    // Persist original authored order for Save/Resume — never the display slot.
    const storeIndex =
      Number.isInteger(item._practiceIndex) && item._practiceIndex >= 0
        ? item._practiceIndex
        : (options.indexOffset || 0) + index;
    const scaffold =
      options.scaffold === "all" || pathId === "stabilize"
        ? true
        : options.scaffold === "none"
          ? false
          : config.variant === "group2"
            ? false
            : index % 2 === 0;
    // Solving reveals the whole model — the visual completes with the work.
    let card;
    const solve = () => {
      card?.classList.add("sg-done-all");
      solveItem(storeIndex);
      // Show-me rhythm: every third LIVE solve in this section (restored
      // solves bypass this closure on purpose — no ritual for last session's
      // work). One per card, appended inside it.
      solvedLive += 1;
      if (solvedLive % 3 === 0 && card && !card.querySelector(".sg-tablecheck"))
        card.appendChild(tableCheck(index + 1));
      // Hot streak in a Foundations or Catch-Up lesson: offer the Challenge
      // bridge once, as an invitation — never a requirement. Catch-up maps to
      // its base lesson's group2 sibling (every base lesson has one).
      if (
        !section.dataset.bridgeShown &&
        (config.variant === "group1" || config.variant === "catchup") &&
        (events.streak?.() || 0) >= 4
      ) {
        section.dataset.bridgeShown = "true";
        const bridge = el(
          "div",
          "card sg-bridge",
          `<div class="sg-eyebrow">On a roll</div><h3>🔥 Ready for a bigger challenge?</h3><p>${bi(
            "You're solving these confidently. The Challenge version of this lesson takes the same idea further.",
            "Estás resolviendo con confianza. La versión Challenge de esta lección lleva la misma idea más lejos.",
          )}</p>`,
        );
        const go = el("a", "btn ghost", "Try the Challenge version →");
        go.href = window.location.pathname.replace(/-(?:group1|catchup)(\/|$)/, "-group2$1");
        bridge.appendChild(go);
        card?.after(bridge);
      }
    };
    card = problemCard(item, index, config.variant, solve, scaffold, events, {
      config,
      storageKey: `practice-${storeIndex}`,
      store,
    });
    card.dataset.practiceIndex = String(storeIndex);
    card.dataset.tier = item._tier || "";

    cardsByIndex.set(storeIndex, card);
    appendVisualPractice(card, item, { mode: options.mode || "guided", events });
    // "Try another like this": infinite same-type reps — only appears when the
    // generator can produce a correctness-verified variant, so it stays silent
    // on problems it can't safely regenerate.
    attachRegenPractice(card, item);
    if (store?.has("solvedPractice", storeIndex)) {
      card.prepend(
        el("div", "sg-donechip", "✓ Solved last session — explain your reasoning again, out loud."),
      );
      // Freeze the restored card so an already-counted problem reads as
      // finished instead of inviting a confusing re-solve.
      for (const control of card.querySelectorAll(
        "input, textarea:not(.sg-another-notes), .choice, .btn:not(.ghost)",
      ))
        control.disabled = true;
      card.__showTryAnotherWay?.();
      solveItem(storeIndex);
    }
    section.appendChild(card);
  });

  const renumberCards = () => {
    [...section.querySelectorAll(":scope > .prob")].forEach((card, cardIndex) => {
      const pn = card.querySelector(".pn");
      if (pn) pn.textContent = String(cardIndex + 1);
    });
  };

  const applyPathOrder = (nextPath) => {
    if (options.mode !== "more") return;
    section.dataset.adaptivePath = nextPath || "connect";
    if (pathBanner) {
      const pathCopy = {
        stabilize: biHtml(
          "Stabilize path: scaffold-friendly problems are up front. Supports open on miss.",
          "Ruta Estabilizar: los problemas con andamiaje van primero. Los apoyos se abren al fallar.",
        ),
        stretch: biHtml(
          "Stretch path: extending challenges are promoted. Keep proving your method.",
          "Ruta Estirar: los retos de extensión van primero. Sigue demostrando tu método.",
        ),
      };
      pathBanner.innerHTML = pathCopy[nextPath] || "";
      pathBanner.hidden = !nextPath || nextPath === "connect";
    }
    // Reorder existing cards in the DOM — no remount, so Save/Resume state
    // and in-progress answers stay on the same nodes.
    let displayItems = items.slice();
    if (nextPath === "stretch") {
      const enriched = bringInExtendingItems(displayItems, config);
      // Mount any newly brought-in extending cards once, then include them.
      for (const item of enriched) {
        if (cardsByIndex.has(item._practiceIndex)) continue;
        const storeIndex = item._practiceIndex;
        tally.total++;
        const card = problemCard(
          item,
          cardsByIndex.size,
          config.variant,
          () => {
            card.classList.add("sg-done-all");
            solveItem(storeIndex);
          },
          false,
          events,
          { config, storageKey: `practice-${storeIndex}`, store },
        );
        card.dataset.practiceIndex = String(storeIndex);
        card.dataset.tier = "extending";
        cardsByIndex.set(storeIndex, card);
        appendVisualPractice(card, item, { mode: "more", events });
        attachRegenPractice(card, item);
        section.appendChild(card);
        displayItems.push(item);
      }
      displayItems = enriched;
    }
    // Same ordering as the first render, so switching adaptive path does not
    // hand the student back the twelve-in-a-row block this exists to break up.
    const reordered = practiceDisplayOrder(displayItems, nextPath || "connect");
    const nav = section.querySelector(":scope > .sg-problem-nav");
    const anchor = nav || null;
    reordered.forEach((item) => {
      const card = cardsByIndex.get(item._practiceIndex);
      if (!card) return;
      if (anchor) section.insertBefore(card, anchor);
      else section.appendChild(card);
    });
    renumberCards();
    // Stabilize also opens banks/step guides on every unsolved card.
    if (nextPath === "stabilize") {
      for (const card of section.querySelectorAll(":scope > .prob:not(.sg-done-all)"))
        card.sgApplySupport?.();
    }
    // Reset pagination to the newly promoted first problem.
    const cards = [...section.querySelectorAll(":scope > .prob")];
    if (cards.length >= 2) {
      cards.forEach((card, cardIndex) => {
        card.hidden = cardIndex !== 0;
      });
      const status = section.querySelector(".sg-problem-count");
      if (status) status.textContent = `Problem 1 of ${cards.length}`;
      const prev = section.querySelector(".sg-problem-nav .btn.ghost");
      const next = section.querySelector(".sg-problem-nav .btn:not(.ghost)");
      if (prev) prev.disabled = true;
      if (next) next.disabled = cards.length < 2;
    }
  };
  section.sgApplyAdaptivePath = applyPathOrder;

  // The adaptive coach's "stabilize" move opens real support on every
  // unsolved problem in this set — banks and step guides appear at once.
  // More Practice also reorders / promotes items for any path.
  document.addEventListener("sg:adaptive-path", (event) => {
    const nextPath = /** @type {CustomEvent} */ (event).detail;
    if (options.mode === "more") applyPathOrder(nextPath);
    else if (nextPath === "stabilize") {
      for (const card of section.querySelectorAll(":scope > .prob:not(.sg-done-all)"))
        card.sgApplySupport?.();
    }
  });

  // Automatic support escalation — dispatched by the renderer once a student has
  // missed on two DIFFERENT problems (see createAutoSupportTracker).
  //
  // Deliberately narrower than the coach's "stabilize" move: it opens supports
  // and nothing else. It never reorders the set and never resets pagination,
  // because it fires underneath a student who is mid-problem rather than in
  // answer to a button they pressed — moving the furniture at that moment would
  // read as the page breaking.
  document.addEventListener("sg:auto-support", () => {
    if (section.dataset.autoSupport === "on") return;
    const unsolved = [...section.querySelectorAll(":scope > .prob:not(.sg-done-all)")];
    if (!unsolved.length) return;
    section.dataset.autoSupport = "on";
    for (const card of unsolved) card.sgApplySupport?.();
    // Name the change. Supports that appear silently read as a glitch; announced,
    // they read as help — and the wording stays matter-of-fact, never "you are
    // struggling", which is the student's business and not the page's to narrate.
    const note = el(
      "div",
      "sg-adaptive-banner",
      biHtml(
        "Supports are open: every problem now shows its tap-to-try bank and step guide.",
        "Los apoyos están abiertos: cada problema ahora muestra su banco de opciones y su guía de pasos.",
      ),
    );
    note.setAttribute("aria-live", "polite");
    const header = section.querySelector(":scope > .sg-h");
    if (header) header.after(note);
    else section.prepend(note);
  });
  // Automatic difficulty moves — dispatched by the renderer's auto-pilot
  // (small-group-adaptive.js) on two consecutive misses or three clean solves.
  //
  // DOWN respects the same furniture rule as sg:auto-support: it opens
  // supports and adds a worked model drawn from the student's OWN solved work,
  // but never reorders — it fires mid-problem, not in answer to a button.
  // UP fires right after a third clean solve — a reward moment — so in More
  // Practice it also promotes the harder items the way the coach's path
  // buttons do.
  document.addEventListener("sg:auto-move", (event) => {
    const detail = /** @type {CustomEvent} */ (event).detail || {};
    if (detail.move === "up") {
      if (options.mode === "more") applyPathOrder(detail.path);
      if (section.dataset.autoMoveUp === "on") return;
      section.dataset.autoMoveUp = "on";
      const note = el(
        "div",
        "sg-adaptive-banner",
        biHtml(
          "Three clean solves in a row — the set just stepped up. You earned the harder problems.",
          "Tres aciertos seguidos sin pistas — el conjunto acaba de subir de nivel. Te ganaste los problemas más difíciles.",
        ),
      );
      note.setAttribute("aria-live", "polite");
      const header = section.querySelector(":scope > .sg-h");
      if (header) header.after(note);
      else section.prepend(note);
      return;
    }
    if (detail.move !== "down") return;
    for (const card of section.querySelectorAll(":scope > .prob:not(.sg-done-all)"))
      card.sgApplySupport?.();
    if (section.dataset.autoMoveDown === "on") return;
    section.dataset.autoMoveDown = "on";
    const note = el(
      "div",
      "sg-adaptive-banner",
      biHtml(
        "Let's steady this: supports are open on every problem.",
        "Vamos a afianzar esto: los apoyos están abiertos en cada problema.",
      ),
    );
    note.setAttribute("aria-live", "polite");
    const header = section.querySelector(":scope > .sg-h");
    if (header) header.after(note);
    else section.prepend(note);
    // Worked model from the student's own solved work — never from an
    // unsolved problem, which would print an answer they haven't earned.
    const model = pickWorkedModel(items, (storeIndex) =>
      Boolean(store?.has("solvedPractice", storeIndex) || counted.has(storeIndex)),
    );
    if (model) {
      const panel = el("details", "card sg-worked-model");
      panel.open = true;
      const answer = answerOf(model);
      panel.innerHTML = `<summary>📌 ${bi("Look how you solved this one", "Mira cómo resolviste este")}</summary><p class="sg-worked-model-stem">${esc(model.stem || "")}</p>${
        answer == null ? "" : `<p><b>${bi("Your answer", "Tu respuesta")}:</b> ${esc(answer)}</p>`
      }<p>${esc(model.explanation || model.sampleAnswer || "")}</p>`;
      note.after(panel);
    }
  });

  const optional = config.practice?.optionalActivity;
  if (optional && options.includeOptional)
    section.appendChild(
      el(
        "div",
        "card",
        `<div class="sg-eyebrow">Bonus move</div><h3>${esc(optional.emoji || "⭐")} ${esc(optional.name || "Try one more")}</h3><p>${esc(optional.intro || "Use this if you are ready to keep going.")}</p>`,
      ),
    );
  paginateProblems(section);
  return section;
}

export function createCheckSection(config, onSolved, tally, events = {}, store = null) {
  const ticket = config.reflect?.exitTicket;
  if (!ticket) return null;
  const section = el("section", "sg-sec");
  section.id = "sg-check";
  section.appendChild(
    el(
      "div",
      "sg-h",
      '<span class="n">6</span><div><div class="sg-eyebrow">Independent evidence</div><h2>Show what you know</h2></div>',
    ),
  );
  section.appendChild(
    el(
      "p",
      null,
      "Try this one on your own first. You can still use a hint—that is a learning tool, not a penalty.",
    ),
  );
  const revisitRow = el("div", "row");
  const revisit = el("button", "btn ghost", "↩ Revisit the worked example in Learn It");
  revisit.type = "button";
  revisit.onclick = () => document.getElementById("sg-tab-sg-tab-learn")?.click();
  revisitRow.appendChild(revisit);
  // The exit ticket is the studio's one independent-evidence item — it needs
  // the same read-aloud support every practice problem already has.
  const ticketText = ticket.stem || ticket.title || ticket.prompt || "";
  if (ticketText) {
    const read = el("button", "btn ghost sg-read-problem", "🔊 Read this problem");
    read.type = "button";
    read.setAttribute("aria-pressed", "false");
    read.onclick = () => speak(ticketText, read);
    revisitRow.appendChild(read);
  }
  section.appendChild(revisitRow);
  tally.total++;
  let counted = false;
  const finish = () => {
    if (counted) return;
    counted = true;
    tally.solved++;
    events.onSolved?.();
    tally.update?.();
    store?.set("checkSolved", true);
    onSolved();
    // Second, constructed-response step: turns the single MC check into
    // real explained evidence (MC answer + a written "how you know"), judged
    // on the same rubric. Encouraged, not a gate — completion already fired.
    explain?.reveal();
  };
  // Written follow-up (only meaningful for the auto-checkable MC ticket; an
  // open-response ticket already IS constructed response). Captured to the
  // store so the Studio Packet and telemetry carry the student's reasoning.
  let explain = null;
  if (ticket.choices?.length) {
    explain = (() => {
      const wrap = el("div", "sg-check-explain");
      wrap.hidden = true;
      wrap.appendChild(
        el(
          "p",
          "block-lab",
          "One more — explain how you know (this is the evidence that counts most).",
        ),
      );
      const ta = el("textarea", "sg-ta");
      ta.setAttribute("aria-label", "Explain how you know your answer is correct");
      ta.placeholder =
        config.variant === "group2"
          ? "Justify it: state your claim, your evidence, and why it holds…"
          : "Use a full sentence and one math word from today…";
      ta.value = store?.get("checkExplainResponse") || "";
      const status = el("div", "fb");
      status.setAttribute("aria-live", "polite");
      const explainReader = mountReasoningReader(ta, {
        prompt: "Explain how you know your answer is correct.",
        standard: config.standard || "",
        answerShown: String(ticket?.answer ?? ""),
        misconception: events.misconception,
      });
      const submit = el("button", "btn", "Submit my explanation");
      submit.type = "button";
      submit.onclick = () => {
        if (ta.value.trim().length < 8) {
          showFeedback(status, "no", "Add one complete sentence of reasoning first.");
          return;
        }
        store?.set("checkExplainResponse", ta.value.trim());
        store?.set("checkExplained", true);
        ta.disabled = true;
        submit.disabled = true;
        showFeedback(
          status,
          "ok",
          "✓ Reasoning captured — read it back out loud and check it against the rubric.",
        );
      };
      const row = el("div", "row");
      row.appendChild(submit);
      wrap.append(ta, explainReader, row, status, createRubricDetails(config.variant));
      if (store?.get("checkExplained")) {
        ta.disabled = true;
        submit.disabled = true;
        showFeedback(status, "ok", "✓ Explanation captured last session.");
      }
      return {
        node: wrap,
        reveal() {
          wrap.hidden = false;
        },
      };
    })();
  }
  // Record whether the exit ticket landed on the FIRST attempt — the transfer
  // check below bands the two items together, and a hinted retry is not the
  // same evidence as a clean first try.
  let ticketAttempted = false;
  const ticketEvents = {
    ...events,
    onAttempt: (info) => {
      if (!ticketAttempted) {
        ticketAttempted = true;
        store?.set("checkFirstTry", Boolean(info?.correct));
      }
      events.onAttempt?.(info);
    },
  };
  const card = ticket.choices?.length
    ? problemCard(
        { ...ticket, type: "multiple-choice" },
        0,
        config.variant,
        finish,
        config.variant !== "group2",
        ticketEvents,
        { config, storageKey: "check", store },
      )
    : problemCard(ticket, 0, config.variant, finish, config.variant !== "group2", ticketEvents, {
        config,
        storageKey: "check",
        store,
      });
  if (store?.get("checkSolved")) {
    card.prepend(
      el(
        "div",
        "sg-donechip",
        "✓ Exit ticket completed last session — prove it again if you want.",
      ),
    );
    card.__showTryAnotherWay?.();
    finish();
  }
  section.appendChild(card);
  if (explain) {
    section.appendChild(explain.node);
    if (store?.get("checkSolved") || store?.get("checkExplained")) explain.reveal();
  }
  const transfer = createTransferCheck(config, ticket, events, store);
  if (transfer) section.appendChild(transfer);
  return section;
}

/** Bands are earned on FIRST attempt across the two independent items. */
const CHECK_BANDS = [
  ["building", "Keep building", "Worth another pass with support before moving on."],
  ["approaching", "Approaching", "One solid piece of evidence — one more to lock it in."],
  ["meeting", "Meeting", "Two independent items, first try. That is mastery evidence."],
];

/**
 * Second independent item + mastery band. One multiple-choice question is not a
 * mastery decision, so pull a transfer item the student has NOT already
 * practised and band the two together. Deliberately does not touch `tally` —
 * this is evidence depth, not another completion gate.
 */
function createTransferCheck(config, ticket, events = {}, store = null) {
  const rendered = new Set(collectPracticeItems(config).map(itemKey));
  const ticketKey = itemKey(ticket || {});
  let pick = null;
  for (const tier of ["optional", "extending", "onLevel", "approaching"]) {
    for (const item of config.practice?.[tier] || []) {
      if (!item?.choices?.length) continue;
      const key = itemKey(item);
      if (key === ticketKey || rendered.has(key)) continue;
      pick = item;
      break;
    }
    if (pick) break;
  }
  if (!pick) return null;

  const wrap = el("div", "sg-check-transfer");
  wrap.appendChild(
    el(
      "p",
      "block-lab",
      bi(
        "Transfer check — a new situation, same idea. This one decides your band.",
        "Prueba de transferencia: una situación nueva, la misma idea.",
      ),
    ),
  );
  const banner = el("div", "fb");
  banner.setAttribute("aria-live", "polite");

  const settle = (transferFirstTry) => {
    const ticketFirstTry = Boolean(store?.get("checkFirstTry"));
    const score = (ticketFirstTry ? 1 : 0) + (transferFirstTry ? 1 : 0);
    const [id, label, note] = CHECK_BANDS[score];
    store?.set("checkBand", id);
    store?.set("checkBandScore", score);
    showFeedback(
      banner,
      score === 2 ? "ok" : "no",
      `<b>${esc(label)} (${score}/2)</b> — ${esc(note)}`,
    );
  };

  let attempted = false;
  let firstTryCorrect = false;
  const scoped = {
    ...events,
    onAttempt: (info) => {
      if (!attempted) {
        attempted = true;
        firstTryCorrect = Boolean(info?.correct);
      }
      events.onAttempt?.(info);
    },
  };
  wrap.appendChild(
    problemCard(
      { ...pick, type: "multiple-choice" },
      1,
      config.variant,
      () => settle(firstTryCorrect),
      config.variant !== "group2",
      scoped,
      { config, storageKey: "check-transfer", store },
    ),
  );
  wrap.appendChild(banner);
  const saved = store?.get("checkBand");
  if (saved) {
    const row = CHECK_BANDS.find(([id]) => id === saved);
    if (row)
      showFeedback(
        banner,
        saved === "meeting" ? "ok" : "no",
        `<b>${esc(row[1])}</b> — ${esc(row[2])} <i>(from your last session)</i>`,
      );
  }
  return wrap;
}
