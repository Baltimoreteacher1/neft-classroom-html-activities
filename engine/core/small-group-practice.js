import { celebrate, el, esc } from "./small-group-ui.js";

const norm = (value) =>
  String(value == null ? "" : value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,;:]+$/, "")
    .replace(/,(?=\d)/g, "");

const numberOf = (value) => {
  const match = String(value)
    .replace(/[$,\s]/g, "")
    .match(/-?\d+(?:\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : null;
};

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

function isRight(input, answer) {
  if (answer == null || !norm(input)) return false;
  if (norm(input) === norm(answer)) return true;
  const left = numberOf(input);
  const right = numberOf(answer);
  return left != null && right != null && Math.abs(left - right) < 1e-9;
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
        showFeedback(
          status,
          "no",
          "That choice does not fit yet. Compare it with the question, open a hint, and try again.",
        );
        return;
      }
      complete = true;
      button.classList.add("correct");
      [...choices.children].forEach((child) => (child.disabled = true));
      showFeedback(
        status,
        "ok",
        `✅ <b>Your reasoning landed.</b> ${esc(item.explanation || "Explain why this choice works to your group.")}`,
      );
      celebrate("✓");
      onSolved();
    };
    choices.appendChild(button);
  });
  card.appendChild(choices);
  appendHints(card, item, events);
  card.appendChild(status);
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
      events.onAttempt?.({ correct: optionIndex + 1 === item.errorStep });
      if (optionIndex + 1 !== item.errorStep) {
        button.classList.add("wrong");
        button.disabled = true;
        showFeedback(
          status,
          "no",
          "That step may be okay. Test what it does and inspect another step.",
        );
        return;
      }
      complete = true;
      button.classList.add("correct");
      [...options.children].forEach((child) => (child.disabled = true));
      showFeedback(
        status,
        "ok",
        `✅ <b>You found the reasoning break.</b> ${item.correctWork ? `Repair: ${esc(item.correctWork)}` : "Explain the repair to your group."}`,
      );
      celebrate("🔧");
      onSolved();
    };
    options.appendChild(button);
  });
  card.appendChild(options);
  appendHints(card, item, events);
  card.appendChild(status);
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

function answerControl(item, answer, scaffold, status, onSolved, events = {}) {
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
      showFeedback(
        status,
        "no",
        tries === 1
          ? "Not yet. Re-read the question, check one step, and try again."
          : "Still building. Open the next hint or ask your coach to question one step—then revise your answer.",
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
      `✅ <b>Correct.</b> ${esc(item.explanation || "Explain the step that convinced you.")}`,
    );
    celebrate("✓");
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
  if (!steps.length) return;
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
  button.onclick = () => {
    list.hidden = !list.hidden;
    button.textContent = list.hidden ? "🧩 Break it into steps" : "Hide step guide";
  };
  row.appendChild(button);
  card.append(row, list);
}

function responseCard(item, index, variant, onSolved, scaffold, events = {}) {
  const card = questionCard(index, itemStem(item));
  const status = feedback();
  const answer = answerOf(item);
  if (answer != null)
    card.appendChild(answerControl(item, answer, scaffold, status, onSolved, events));
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
        "✓ Share your reasoning aloud. Your group should ask one question about your evidence.",
      );
      onSolved();
    };
    card.append(response, el("div", "row"));
    card.lastElementChild.appendChild(ready);
  }
  appendStepGuide(card, item, scaffold);
  appendHints(card, item, events);
  card.appendChild(status);
  return card;
}

function collectItems(config) {
  const tiers = ["approaching", "onLevel", "extending", "optional"];
  const seen = new Set();
  const items = [];
  for (const tier of tiers) {
    for (const item of config.practice?.[tier] || []) {
      const key = item.stem || item.title || JSON.stringify(item).slice(0, 60);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
  }
  return items.slice(0, 6);
}

function problemCard(item, index, variant, onSolved, scaffold, events = {}) {
  if (item.type === "multiple-choice" && item.choices?.length)
    return multipleChoiceCard(item, index, onSolved, events);
  if (item.type === "error-analysis" && item.workedExample?.length)
    return errorAnalysisCard(item, index, onSolved, events);
  return responseCard(item, index, variant, onSolved, scaffold, events);
}

export function createPracticeSection(config, onPhaseDone, tally, events = {}) {
  const section = el("section", "sg-sec");
  section.id = "sg-practice";
  const title =
    config.variant === "group2" ? "Challenge, justify, generalize" : "Practice with a coach nearby";
  section.appendChild(
    el(
      "div",
      "sg-h",
      `<span class="n">5</span><div><div class="sg-eyebrow">Try · revise · explain</div><h2>${title}</h2></div>`,
    ),
  );
  const mistake = config.practice?.commonMistake;
  const mistakeText = typeof mistake === "string" ? mistake : mistake?.text || mistake?.mistake;
  if (mistakeText && config.variant !== "group2")
    section.appendChild(el("div", "mistake", `<b>⚠️ Thinking trap:</b> ${esc(mistakeText)}`));
  const items = collectItems(config);
  let solved = 0;
  items.forEach((item, index) => {
    tally.total++;
    const scaffold = config.variant === "group2" ? false : index % 2 === 0;
    section.appendChild(
      problemCard(
        item,
        index,
        config.variant,
        () => {
          solved++;
          tally.solved++;
          events.onSolved?.();
          tally.update?.();
          if (solved >= Math.ceil(items.length * 0.6)) onPhaseDone();
        },
        scaffold,
        events,
      ),
    );
  });
  const optional = config.practice?.optionalActivity;
  if (optional)
    section.appendChild(
      el(
        "div",
        "card",
        `<div class="sg-eyebrow">Bonus move</div><h3>${esc(optional.emoji || "⭐")} ${esc(optional.name || "Try one more")}</h3><p>${esc(optional.intro || "Use this if your group is ready to keep going.")}</p>`,
      ),
    );
  return section;
}

export function createCheckSection(config, onSolved, tally, events = {}) {
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
  tally.total++;
  const finish = () => {
    tally.solved++;
    events.onSolved?.();
    tally.update?.();
    onSolved();
  };
  section.appendChild(
    ticket.choices?.length
      ? multipleChoiceCard({ ...ticket, type: "multiple-choice" }, 0, finish, events)
      : responseCard(ticket, 0, config.variant, finish, config.variant !== "group2", events),
  );
  return section;
}
