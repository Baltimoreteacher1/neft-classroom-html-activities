// The daily fact session, played one fact at a time. Untimed: no clock is read or shown.
// - Introduce, then practice: before the first fact of a new or tricky fact family, the family is shown with its
//   strategy. The fact that follows straight after an introduction counts as supported (the answer was just on
//   screen); its later appearance in the session is the independent check.
// - A first-try miss shows the strategy hint (never the answer) and allows one more try; a second miss shows the
//   answer. Only the first try is evidence.
// - After a right first try on their own, the learner may tap "I just knew it", "I used a strategy" or "I counted"
//   (fact-automaticity.js). The tap is optional.
// - A teacher's fact plan (fact-plan.js) can narrow the operations and set the number of problems.
import { t } from "../i18n.js";
import { HOW_IDS, HOW_LABELS } from "./fact-automaticity.js";
import { familyOf, parseKey, strategyHint } from "./fact-model.js";
import { finishSession } from "./fact-session.js";
import { STRATEGY_LABELS, strategyFor } from "./fact-strategies.js";

const esc = (text) =>
  String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// Steps for the view: an introduction card before the first learn item of each family, then the items.
export function practiceSteps(items) {
  const steps = [];
  const introduced = new Set();
  for (const item of items || []) {
    const family = familyOf(item.key);
    if (item.phase === "learn" && item.strategyFirst && family && !introduced.has(family.id)) {
      introduced.add(family.id);
      steps.push({
        type: "intro",
        family,
        strategy: strategyFor(item.key),
        hint: strategyHint(item.key),
      });
      steps.push({ type: "item", item, afterIntro: true });
    } else steps.push({ type: "item", item, afterIntro: false });
  }
  return steps;
}

// The one evidence record a fact item leaves. Only the first try counts; an item right after its introduction is
// supported; `how` is kept only for a right first try on the learner's own.
export function itemResult(step, { firstCorrect, how = null }) {
  const supported = Boolean(step.afterIntro);
  return {
    key: step.item.key,
    correct: Boolean(firstCorrect),
    firstTry: true,
    supported,
    mode: "untimed",
    strategy: step.item.strategy || null,
    ...(firstCorrect && !supported && HOW_IDS.includes(how) ? { how } : {}),
  };
}

// Narrow a built session to a teacher's plan: keep facts of the chosen operations, then cut to the count.
export function applyFactPlan(items, plan) {
  if (!plan) return items;
  const kept = plan.ops?.length
    ? items.filter((item) => plan.ops.includes(parseKey(item.key)?.op))
    : items;
  return plan.count ? kept.slice(0, plan.count) : kept;
}

const introHtml = (step, index, total) => `<div class="fl-fact-card" data-fact-step="intro">
    <p class="fl-fact-phase">${esc(t("New fact family"))} · ${index} / ${total}</p>
    <h4>${esc(t("Meet these facts first"))}</h4>
    <ul class="fl-fact-family">${step.family.equations.map((eq) => `<li>${esc(eq)}</li>`).join("")}</ul>
    <p><strong>${esc(t("Strategy"))}: ${esc(t(STRATEGY_LABELS[step.strategy] || step.strategy))}.</strong> ${esc(t(step.hint.template, step.hint.vars))}</p>
    <p class="fl-fact-note">${esc(t("Read them aloud together. Then you will practise them one at a time."))}</p>
    <button type="button" class="fl-tt-btn fl-tt-btn--primary" data-fact-ready>${esc(t("I'm ready to practise"))}</button></div>`;

const itemHtml = (step, index, total) => `<div class="fl-fact-card" data-fact-step="item">
    <p class="fl-fact-phase">${esc(t(step.item.phase === "learn" ? "Learn it" : step.item.phase === "warm-up" ? "Warm-up" : step.item.phase === "stretch" ? "Stretch" : "Review"))} · ${index} / ${total}</p>
    <p class="fl-fact-question">${esc(step.item.questionTemplate ? t(step.item.questionTemplate, step.item.questionVars) : step.item.question)}</p>
    <form class="fl-tt-row" data-fact-form novalidate><label class="sr-only" for="fl-fact-input">${esc(t("Your answer"))}</label>
      <input id="fl-fact-input" class="fl-fact-input" inputmode="numeric" autocomplete="off" data-fact-input>
      <button type="submit" class="fl-tt-btn fl-tt-btn--primary">${esc(t("Check"))}</button></form>
    <p class="fl-fact-feedback" role="status" data-fact-feedback></p><div data-fact-after></div></div>`;

// Mounts the session in `host`. ctx: { store, save(store), onDone(receipt, results), onAnswer(result), now() }.
export function mountFactPractice(host, session, ctx) {
  const steps = practiceSteps(session.items);
  const total = steps.length;
  const results = [];
  let at = 0;
  const finish = () => {
    const { store, receipt } = finishSession(ctx.store, results, ctx.now?.() ?? Date.now());
    ctx.save?.(store);
    host.innerHTML = `<div class="fl-fact-card fl-fact-done"><h4>${esc(t("Practice routine complete"))}</h4>
      <p>${esc(t("Answered right on the first try: {n} of {total}", { n: receipt.firstTryRight, total: receipt.attempts }))}</p>
      ${receipt.needsAnotherLook.length ? `<p>${esc(t("Facts worth another look: {n}", { n: receipt.needsAnotherLook.length }))}</p>` : ""}</div>`;
    ctx.onDone?.(receipt, results);
  };
  const show = () => {
    if (at >= steps.length) return finish();
    const step = steps[at];
    host.innerHTML =
      step.type === "intro" ? introHtml(step, at + 1, total) : itemHtml(step, at + 1, total);
    (host.querySelector("[data-fact-ready]") || host.querySelector("[data-fact-input]"))?.focus();
  };
  let tries = 0;
  let firstCorrect = null;
  const next = (how = null) => {
    const step = steps[at];
    const result = itemResult(step, { firstCorrect, how });
    results.push(result);
    ctx.onAnswer?.(result);
    at += 1;
    tries = 0;
    firstCorrect = null;
    show();
  };
  host.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || !host.contains(button)) return;
    if (button.hasAttribute("data-fact-ready")) {
      at += 1;
      show();
    } else if (button.dataset.factHow !== undefined) next(button.dataset.factHow || null);
    else if (button.hasAttribute("data-fact-next")) next(null);
  });
  host.addEventListener("submit", (event) => {
    if (!event.target.matches("[data-fact-form]")) return;
    event.preventDefault();
    const step = steps[at];
    const input = host.querySelector("[data-fact-input]");
    const value = input.value.trim().replace("−", "-").toLowerCase();
    if (!value) return;
    const right = step.item.answers.some((answer) => answer.replace("−", "-").toLowerCase() === value);
    tries += 1;
    if (tries === 1) firstCorrect = right;
    const feedback = host.querySelector("[data-fact-feedback]");
    const after = host.querySelector("[data-fact-after]");
    if (right || tries >= 2) {
      input.disabled = true;
      host.querySelector("[data-fact-form] button").disabled = true;
      if (right && tries === 1 && !step.afterIntro) {
        feedback.textContent = t("Right on the first try.");
        after.innerHTML = `<p>${esc(t("How did you get it?"))}</p><div class="fl-tt-row" role="group" aria-label="${esc(t("How did you get it?"))}">${HOW_IDS.map((id) => `<button type="button" class="fl-tt-btn" data-fact-how="${id}">${esc(t(HOW_LABELS[id]))}</button>`).join("")}<button type="button" class="fl-tt-btn" data-fact-how="">${esc(t("Skip"))}</button></div>`;
      } else {
        feedback.textContent = right
          ? t("Right. It comes back later in the session for a check on your own.")
          : t("The answer is {answer}. You will see this fact again soon.", {
              answer: step.item.displayAnswer,
            });
        after.innerHTML = `<button type="button" class="fl-tt-btn fl-tt-btn--primary" data-fact-next>${esc(t("Next fact"))}</button>`;
      }
      after.querySelector("button")?.focus();
    } else {
      feedback.textContent = `${t("Not yet. Try the strategy:")} ${t(step.item.hintTemplate || step.item.hint, step.item.hintVars || {})}`;
      input.select();
    }
  });
  show();
  return { steps, results };
}
