import { isRight, numberOf } from "./small-group-answers.js";
import { celebrate, el, esc } from "./small-group-ui.js";
import { appendVisualPractice } from "./small-group-visual-practice.js";

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
  return streak >= 2 ? `🔥 <b>${streak} in a row — your method is working.</b> ` : "";
}

function itemStem(item) {
  return item.stem || item.title || item.instructions || item.prompt || "Try this problem.";
}

function questionCard(index, stem) {
  const card = el("div", "prob");
  card.appendChild(el("p", "q", `<span class="pn">${index + 1}</span><span>${esc(stem)}</span>`));
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
  if (!hints.length) return;
  let shown = 0;
  const row = el("div", "row");
  const button = el("button", "btn ghost", "💡 Open hint 1");
  button.type = "button";
  const box = el("div", "hintbox");
  button.onclick = () => {
    events.onHint?.();
    box.appendChild(el("p", null, `<b>Hint ${shown + 1}:</b> ${esc(hints[shown])}`));
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
}

function multipleChoiceCard(item, index, onSolved, events = {}) {
  const card = questionCard(index, itemStem(item));
  const status = feedback();
  const choices = el("div", "choices");
  let complete = false;
  item.choices.forEach((choice, optionIndex) => {
    const button = el(
      "button",
      "choice",
      `<span class="k">${String.fromCharCode(65 + optionIndex)}</span><span>${esc(choice)}</span>`,
    );
    button.type = "button";
    button.onclick = () => {
      if (complete) return;
      events.onAttempt?.({ correct: optionIndex === item.correctIndex });
      if (optionIndex !== item.correctIndex) {
        button.classList.add("wrong");
        button.disabled = true;
        const targeted = item.choiceFeedback?.[optionIndex];
        showFeedback(
          status,
          "no",
          targeted
            ? `<b>Look closer:</b> ${esc(targeted)}`
            : "That choice does not fit yet. Compare it with the question, open a hint, and try again.",
        );
        return;
      }
      complete = true;
      button.classList.add("correct");
      [...choices.children].forEach((child) => (child.disabled = true));
      showFeedback(
        status,
        "ok",
        `${streakNote(events)}✅ <b>Correct.</b> ${esc(item.explanation || "Say out loud why this choice works.")}`,
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
  const card = questionCard(index, item.title || item.stem || "Find the reasoning break.");
  const work = el("div", "we-steps");
  const list = el("ol", "steps");
  item.workedExample.forEach((step) =>
    list.appendChild(
      el("li", null, `<b>${esc(step.label || "")}</b>${step.work ? ` — ${esc(step.work)}` : ""}`),
    ),
  );
  work.appendChild(list);
  card.append(work, el("p", "block-lab", "Which step needs repair?"));
  const options = el("div", "choices");
  const status = feedback();
  let complete = false;
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
        showFeedback(status, "no", "That step looks correct. Check the math in a different step.");
        return;
      }
      complete = true;
      button.classList.add("correct");
      [...options.children].forEach((child) => (child.disabled = true));
      showFeedback(
        status,
        "ok",
        `✅ <b>You found the reasoning break.</b> ${item.correctWork ? `Repair: ${esc(item.correctWork)}` : "Say the repair out loud in your own words."}`,
      );
      celebrate("🔧");
      onSolved();
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

function answerControl(item, answer, scaffold, status, onSolved, events = {}, onStruggle) {
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
  if (scaffold && item.choices?.length) {
    const bank = el("div", "wbank");
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
    box.appendChild(bank);
  }
  const row = el("div", "row");
  const check = el("button", "btn", "Check my thinking");
  check.type = "button";
  let tries = 0;
  check.onclick = () => {
    tries++;
    const correct = isRight(input.value, answer);
    events.onAttempt?.({ correct });
    if (!correct) {
      input.classList.add("bad");
      const opened = tries >= 2 && onStruggle?.();
      showFeedback(
        status,
        "no",
        tries === 1
          ? "Not yet. Re-read the question, check one step, and try again."
          : opened
            ? "Still building — so the step guide below just opened for you. Walk it one line at a time, then revise your answer."
            : "Still building. Open the next hint or re-walk the worked example in Build — then revise your answer.",
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
      `${streakNote(events)}✅ <b>Correct.</b> ${esc(item.explanation || "Explain the step that convinced you.")}`,
    );
    celebrate((events.streak?.() || 0) >= 3 ? "🔥" : "✓");
    onSolved();
  };
  input.onkeydown = (event) => {
    if (event.key === "Enter") check.click();
  };
  row.appendChild(check);
  box.appendChild(row);
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
  const card = questionCard(index, itemStem(item));
  const status = feedback();
  const answer = answerOf(item);
  // Wired after the guide exists (it renders below the control); after two
  // misses the control auto-opens it so support arrives without a hunt.
  let revealGuide = null;
  if (answer != null)
    card.appendChild(
      answerControl(item, answer, scaffold, status, onSolved, events, () => revealGuide?.()),
    );
  else {
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
          "Add one complete thought before you share. A sentence frame or word bank can help.",
        );
        return;
      }
      events.onAttempt?.({ correct: true });
      response.disabled = true;
      ready.disabled = true;
      showFeedback(
        status,
        "ok",
        "✓ Read your reasoning out loud, then ask yourself: what evidence makes it convincing?",
      );
      onSolved();
    };
    card.append(response, el("div", "row"));
    card.lastElementChild.appendChild(ready);
  }
  // Feedback lands directly under the answer control so it is on-screen the
  // moment it appears; the step guide and hints render below it.
  card.appendChild(status);
  revealGuide = appendStepGuide(card, item, scaffold);
  appendHints(card, item, events);
  return card;
}

const itemKey = (item) => item.stem || item.title || JSON.stringify(item).slice(0, 60);

export function collectPracticeItems(config) {
  if (Array.isArray(config.parallelPractice) && config.parallelPractice.length) {
    const items = [...config.parallelPractice];
    // Group 2's authored enrichment (justify, error-analysis, challenge
    // panels) is real content — append it after the parallel set instead of
    // dropping it, so mastery students get genuine extension work.
    if (config.variant === "group2") {
      const seen = new Set(items.map(itemKey));
      for (const item of config.practice?.extending || []) {
        const key = itemKey(item);
        if (seen.has(key)) continue;
        seen.add(key);
        items.push(item);
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
      items.push(item);
    }
  }
  return items;
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
  const items = options.items || collectPracticeItems(config);
  if (!items.length) return null;
  const section = el("section", "sg-sec");
  section.id = options.id || "sg-practice";
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
  if (options.directions) section.appendChild(el("p", "sg-directions", esc(options.directions)));
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
  const solveItem = (index) => {
    const storeIndex = (options.indexOffset || 0) + index;
    if (counted.has(storeIndex)) return;
    counted.add(storeIndex);
    solved++;
    tally.solved++;
    events.onSolved?.();
    tally.update?.();
    store?.addTo("solvedPractice", storeIndex);
    if (solved >= Math.ceil(items.length * 0.6)) onPhaseDone();
  };
  items.forEach((item, index) => {
    tally.total++;
    const scaffold =
      options.scaffold === "all"
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
      solveItem(index);
    };
    card = problemCard(item, index, config.variant, solve, scaffold, events);
    appendVisualPractice(card, item, { mode: options.mode || "guided", events });
    const storeIndex = (options.indexOffset || 0) + index;
    if (store?.has("solvedPractice", storeIndex)) {
      card.prepend(
        el("div", "sg-donechip", "✓ Solved last session — explain your reasoning again, out loud."),
      );
      // Freeze the restored card so an already-counted problem reads as
      // finished instead of inviting a confusing re-solve.
      for (const control of card.querySelectorAll("input, textarea, .choice, .btn:not(.ghost)"))
        control.disabled = true;
      solveItem(index);
    }
    section.appendChild(card);
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
  };
  const card = ticket.choices?.length
    ? multipleChoiceCard({ ...ticket, type: "multiple-choice" }, 0, finish, events)
    : responseCard(ticket, 0, config.variant, finish, config.variant !== "group2", events);
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
  return section;
}
