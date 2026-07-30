import { attachRegenPractice } from "../components/regen-practice.js";
import { isRight, numberOf } from "./small-group-answers.js";
import { createRubricDetails } from "./small-group-rubric.js";
import { bi, biHtml, celebrate, el, esc, speak } from "./small-group-ui.js";
import { appendVisualPractice } from "./small-group-visual-practice.js";

const firstHint = (item) => item.hints?.[0] || item.hint || null;

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

// Bilingual correct-answer lead shared by every checkable card.
const correctLead = () =>
  `✅ <b>${biHtml("Your reasoning landed.", "¡Tu razonamiento dio en el blanco!")}</b>`;

function itemStem(item) {
  return item.stem || item.title || item.instructions || item.prompt || "Try this problem.";
}

function questionCard(index, stem, stemEs) {
  const card = el("div", "prob");
  card.appendChild(
    el("p", "q", `<span class="pn">${index + 1}</span><span>${bi(stem, stemEs)}</span>`),
  );
  return card;
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

function multipleChoiceCard(item, index, onSolved, events = {}) {
  const card = questionCard(index, itemStem(item), item.stemEs);
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
        `${streakNote(events)}${correctLead()} ${bi(item.explanation || "Say out loud why this choice works.", item.explanationEs)}`,
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
      `${streakNote(events)}${correctLead()} ${bi(item.explanation || "Explain the step that convinced you.", item.explanationEs)}`,
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

function explanationSteps(item) {
  return String(item.explanation || "")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 2)
    .slice(0, 4);
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
  const card = questionCard(index, itemStem(item), item.stemEs);
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
      () => revealGuide?.(),
      () => openHint?.(),
    );
    card.appendChild(control);
  } else {
    const response = el("textarea", "sg-ta");
    response.placeholder =
      variant === "group2"
        ? "Make a claim, use evidence, and explain why…"
        : "Show or explain your thinking…";
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
    card.append(response, el("div", "row"));
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

function problemCard(item, index, variant, onSolved, scaffold, events = {}) {
  if (item.type === "multiple-choice" && item.choices?.length)
    return multipleChoiceCard(item, index, onSolved, events);
  if (item.type === "error-analysis" && item.workedExample?.length)
    return errorAnalysisCard(item, index, onSolved, events);
  return responseCard(item, index, variant, onSolved, scaffold, events);
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
  const ordered = orderItemsForAdaptivePath(collected, pathId);
  // Interactive, checkable problems first; written responses close the set
  // (stable partition — relative order inside each group is preserved).
  const items = [
    ...ordered.filter((item) => answerOf(item) != null || item.type === "error-analysis"),
    ...ordered.filter((item) => answerOf(item) == null && item.type !== "error-analysis"),
  ];
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
    section.appendChild(
      el(
        "details",
        "mistake",
        `<summary>⚠️ Before you start: common mistake</summary><p>${esc(mistakeText)}</p>`,
      ),
    );
  }
  let solved = 0;
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
    card = problemCard(item, index, config.variant, solve, scaffold, events);
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
      for (const control of card.querySelectorAll("input, textarea, .choice, .btn:not(.ghost)"))
        control.disabled = true;
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
    const reordered = orderItemsForAdaptivePath(displayItems, nextPath || "connect");
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
    const nextPath = event.detail;
    if (options.mode === "more") applyPathOrder(nextPath);
    else if (nextPath === "stabilize") {
      for (const card of section.querySelectorAll(":scope > .prob:not(.sg-done-all)"))
        card.sgApplySupport?.();
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
      wrap.append(ta, row, status, createRubricDetails(config.variant));
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
    ? multipleChoiceCard({ ...ticket, type: "multiple-choice" }, 0, finish, ticketEvents)
    : responseCard(ticket, 0, config.variant, finish, config.variant !== "group2", ticketEvents);
  if (store?.get("checkSolved")) {
    card.prepend(
      el(
        "div",
        "sg-donechip",
        "✓ Exit ticket completed last session — prove it again if you want.",
      ),
    );
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
    multipleChoiceCard(
      { ...pick, type: "multiple-choice" },
      1,
      () => settle(firstTryCorrect),
      scoped,
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
