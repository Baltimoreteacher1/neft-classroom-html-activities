import { attachRegenPractice } from "../components/regen-practice.js";
import { isRight, numberOf } from "./small-group-answers.js";
import { bi, celebrate, el, esc, speak } from "./small-group-ui.js";
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
  return streak >= 2 ? `🔥 <b>${streak} in a row — your method is working.</b> ` : "";
}

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
      events.onAttempt?.({ correct: sourceIndex === item.correctIndex });
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
        `${streakNote(events)}✅ <b>Correct.</b> ${bi(item.explanation || "Say out loud why this choice works.", item.explanationEs)}`,
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
        const hint = firstHint(item);
        showFeedback(
          status,
          "no",
          hint
            ? `That step looks correct. <b>Clue:</b> ${esc(hint)}`
            : "That step looks correct. Check the math in a different step.",
        );
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
    events.onAttempt?.({ correct });
    if (!correct) {
      input.classList.add("bad");
      const opened = tries >= 2 && onStruggle?.();
      // Third miss: bring the first hint to the student instead of waiting.
      if (tries >= 3) onStuck?.();
      const hint = firstHint(item);
      showFeedback(
        status,
        "no",
        tries === 1
          ? hint
            ? `Not yet. <b>Try this:</b> ${bi(hint, item.hintsEs?.[0] || item.hintEs)}`
            : "Not yet. Re-read the question, check one step, and try again."
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
      `${streakNote(events)}✅ <b>Correct.</b> ${bi(item.explanation || "Explain the step that convinced you.", item.explanationEs)}`,
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
  const collected = options.items || collectPracticeItems(config);
  // Interactive, checkable problems first; written responses close the set
  // (stable partition — relative order inside each group is preserved).
  const items = [
    ...collected.filter((item) => answerOf(item) != null || item.type === "error-analysis"),
    ...collected.filter((item) => answerOf(item) == null && item.type !== "error-analysis"),
  ];
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
  if (options.directions)
    section.appendChild(el("p", "sg-directions", bi(options.directions, options.directionsEs)));
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
      // Hot streak in a Foundations lesson: offer the Challenge Lab bridge
      // once, as an invitation — never a requirement.
      if (
        !section.dataset.bridgeShown &&
        config.variant === "group1" &&
        (events.streak?.() || 0) >= 4
      ) {
        section.dataset.bridgeShown = "true";
        const bridge = el(
          "div",
          "card sg-bridge",
          `<div class="sg-eyebrow">On a roll</div><h3>🔥 Ready for a bigger challenge?</h3><p>${bi(
            "You are solving these confidently. The Challenge Lab version of this lesson pushes the same idea further.",
            "Estás resolviendo con confianza. La versión Challenge Lab de esta lección lleva la misma idea más lejos.",
          )}</p>`,
        );
        const go = el("a", "btn ghost", "Try the Challenge Lab →");
        go.href = window.location.pathname.replace("-group1", "-group2");
        bridge.appendChild(go);
        card?.after(bridge);
      }
    };
    card = problemCard(item, index, config.variant, solve, scaffold, events);
    appendVisualPractice(card, item, { mode: options.mode || "guided", events });
    // "Try another like this": infinite same-type reps — only appears when the
    // generator can produce a correctness-verified variant, so it stays silent
    // on problems it can't safely regenerate.
    attachRegenPractice(card, item);
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
  // The adaptive coach's "stabilize" move opens real support on every
  // unsolved problem in this set — banks and step guides appear at once.
  document.addEventListener("sg:adaptive-path", (event) => {
    if (event.detail !== "stabilize") return;
    for (const card of section.querySelectorAll(":scope > .prob:not(.sg-done-all)"))
      card.sgApplySupport?.();
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
