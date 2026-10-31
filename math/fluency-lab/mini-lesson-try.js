// Mini-lesson step 3: Try It. Three fresh problems with support that fades by level, hints that never state the
// answer, a revision after a miss, and feedback through the shared feedback machine and panel. Results are supported
// evidence only (onEvidence({ correct, independent: false })), never independent mastery.
import { FEEDBACK_PHASES, feedbackView, nextPhase } from "./feedback-machine.js";
import { paintFeedback } from "./feedback-panel.js";
import { t } from "./i18n.js";
import { esc, givens, pick } from "./lesson-4/dom.js";
import { TRY_COUNT, supportFor } from "./lesson-4/practice.js";
import { attachGraphic } from "./lesson-4/visual-host.js";
import { spanishLine } from "./mini-lesson-learn.js";
import { validateAnswer } from "./problem-bank.js";
import { whyFor } from "./step-whys.js";
import { interactivePicture, mathText, stepVisual } from "./trail-pictures.js";
import { renderInlineProblemModel } from "./visual-lab.js";

const SETTLED = new Set(["assisted", "revised", "correct"]);
const MAX_MISSES = 3;

const modelPicture = (skill, problem) => (problem.model && interactivePicture(problem.model)) || renderInlineProblemModel(skill, problem.item) || "";
const wholeNumber = (problem) => problem.kind === "number" && problem.answers.every((answer) => /^\d+$/.test(answer));

function answerControl(problem, run, lang, disabled) {
  const dis = disabled ? " disabled" : "";
  if (problem.choices) {
    const labels = problem.choicesEs && lang === "es" ? problem.choicesEs : problem.choices;
    return `<fieldset class="ml-choices"${dis}><legend>${esc(t("Choose one"))}</legend>${problem.choices
      .map((choice, i) => `<label class="ml-choice"><input type="radio" name="ml-answer" value="${esc(choice)}"${String(run.submitted) === String(choice) ? " checked" : ""}${dis}><span lang="${lang}">${esc(labels[i])}</span></label>`)
      .join("")}</fieldset>`;
  }
  return `<label class="ml-label" for="ml-answer">${esc(t("Your answer"))}</label><div class="ml-input-row"><input id="ml-answer" class="ml-input" name="ml-answer" type="text" inputmode="${wholeNumber(problem) ? "numeric" : "text"}" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(run.submitted)}"${dis}>${problem.unit ? `<span class="ml-unit">${esc(problem.unit)}</span>` : ""}</div>`;
}

const hintList = (problem, run, lang) =>
  problem.hints
    .slice(0, run.hints)
    .map((hint, i) => `<li><span class="ml-label">${esc(t("Hint {n}", { n: i + 1 }))}</span> <span lang="${hint.es && lang === "es" ? "es" : "en"}">${mathText(pick(hint, lang))}</span></li>`)
    .join("");

const workedList = (problem) => `<ol class="ml-steps ml-steps-worked">${problem.steps.map((line, i) => `<li class="ml-step${i === problem.steps.length - 1 ? " ml-step-final" : ""}"><span class="ml-step-num" aria-hidden="true">${i + 1}</span><div class="ml-step-body"><p class="ml-step-text">${mathText(line)}</p>${whyFor(line, i, problem.steps) ? `<p class="ml-step-why">${esc(whyFor(line, i, problem.steps))}</p>` : ""}${stepVisual(line)}</div></li>`).join("")}</ol>`;

const trackerState = (run) => (SETTLED.has(run.phase) ? (run.phase === "assisted" ? t("Got it") : t("Needed the steps")) : t("Not done yet"));

export function renderTry(ctx) {
  const { stage, step, skill, lang, level } = ctx;
  const problems = step.problems;
  const support = supportFor(level);
  const runs = (ctx.state.runs ||= problems.map((_, i) => ({ phase: ctx.tried[i] === true ? "assisted" : ctx.tried[i] === false ? "revised" : "idle", misses: 0, hints: 0, submitted: "", worked: false, picture: support.picture === "open", settledBefore: ctx.tried[i] !== null })));
  ctx.state.tryAt ??= Math.max(0, runs.findIndex((run) => !SETTLED.has(run.phase)));
  if (ctx.state.tryAt < 0 || ctx.state.tryAt >= TRY_COUNT) ctx.state.tryAt = 0;
  let stopGraphic = () => {};
  let summary = false;

  const settleNow = () => runs.every((run) => SETTLED.has(run.phase));

  function paint(focus = "") {
    stopGraphic();
    const at = ctx.state.tryAt;
    const run = runs[at];
    const problem = problems[at];
    const done = SETTLED.has(run.phase);
    const pictureHtml = modelPicture(skill, problem);
    const showPictureToggle = pictureHtml && support.picture !== "open" && !run.picture && (support.picture === "closed" || run.misses > 0);
    const showPicture = pictureHtml && (run.picture || support.picture === "open");
    const hintReady = problem.hints.length > run.hints && !done && (support.hints === "ready" || run.misses > 0);
    stage.innerHTML = `<div class="ml-try">
      <h4 class="ml-idea" id="ml-stage-title" tabindex="-1">${esc(t("Try it with a little help"))}</h4>
      <ol class="ml-tracker" aria-label="${esc(t("Problems"))}">${runs.map((r, i) => `<li class="${i === at ? "now" : ""} ${SETTLED.has(r.phase) ? "done" : ""}"${i === at ? ' aria-current="step"' : ""}><span class="ml-tracker-num">${esc(t("Problem {n}", { n: i + 1 }))}</span><span class="ml-tracker-state">${esc(trackerState(r))}</span></li>`).join("")}</ol>
      ${summary ? summaryHtml() : `<article class="ml-card ml-problem" aria-labelledby="ml-prob-label">
        <p class="ml-label" id="ml-prob-label">${esc(t("Problem {n} of {total}", { n: at + 1, total: TRY_COUNT }))}</p>
        <p class="ml-q">${mathText(problem.question)}</p>${spanishLine(problem, lang)}
        ${support.frame && problem.startFrame && !done ? `<p class="ml-frame"><span class="ml-label">${esc(t("Start like this"))}</span> ${mathText(pick(problem.startFrame, lang))}</p>` : ""}
        ${showPicture ? `<div class="ml-slot ml-try-picture"><div class="ml-fallback">${pictureHtml}</div><div class="ml-live" hidden></div></div>` : ""}
        ${showPictureToggle ? `<button type="button" class="ml-btn ml-btn-quiet" data-picture aria-expanded="false">${esc(t("Show the picture"))}</button>` : ""}
        <form class="ml-form" novalidate>${answerControl(problem, run, lang, done)}
          <div class="ml-row"><button type="submit" class="ml-btn ml-btn-primary"${done ? " disabled" : ""}>${esc(run.phase === "revealed" ? t("Check my answer") : t("Check"))}</button>${hintReady ? `<button type="button" class="ml-btn" data-hint>${esc(t("Show a hint"))}</button>` : ""}</div>
        </form>
        <ul class="ml-hints">${hintList(problem, run, lang)}</ul>
        ${run.phase === "revealed" ? `<p class="ml-revise">${esc(t("Read the steps, then type the answer to finish."))}</p>` : ""}
        ${run.worked || run.phase === "revealed" ? workedList(problem) : ""}
        <div class="feedback ml-feedback" hidden><span class="fb-icon" aria-hidden="true"></span><div class="fb-body"><div class="fb-live" role="status" aria-live="polite"><strong class="fb-title"></strong><p class="fb-badge" hidden></p><dl class="fb-answers" hidden></dl></div><div class="fb-actions" hidden></div></div></div>
        ${done ? `<div class="ml-row"><button type="button" class="ml-btn ml-btn-primary" data-next-problem>${esc(at === TRY_COUNT - 1 ? t("See how I did") : t("Next problem"))}</button></div>` : ""}
      </article>`}
    </div>`;
    if (!summary) {
      const panel = stage.querySelector(".ml-feedback");
      showFeedback(panel, run, problem);
      const slot = stage.querySelector(".ml-try-picture");
      if (slot) stopGraphic = attachGraphic(slot, step.graphic, { mode: "build", lang, label: skill.title, values: givens(problem.question) });
    }
    const target = focus && stage.querySelector(focus);
    if (target) target.focus({ preventScroll: false });
  }

  function summaryHtml() {
    const right = runs.filter((run) => run.phase === "assisted").length;
    return `<section class="ml-card ml-summary" aria-labelledby="ml-sum-label"><p class="ml-label" id="ml-sum-label">${esc(t("Your practice"))}</p><p class="ml-big">${esc(t("{n} of {total} right without needing the answer.", { n: right, total: TRY_COUNT }))}</p><p>${esc(t("This was guided practice. It shows your thinking, and a fresh problem later checks what you can do on your own."))}</p><div class="ml-row"><button type="button" class="ml-btn ml-btn-primary" data-to-explain>${esc(t("Go to Explain It"))}</button><button type="button" class="ml-btn" data-review>${esc(t("Look at the problems again"))}</button></div></section>`;
  }

  function showFeedback(panel, run, problem) {
    if (!panel || run.phase === "idle" || !FEEDBACK_PHASES.includes(run.phase)) return;
    const view = feedbackView(run.phase, { submitted: run.submitted, expected: problem.displayAnswer, hintAvailable: problem.hints.length > run.hints, stepsAvailable: !run.worked });
    if (!view) return;
    // A first-try answer in a mini-lesson is still guided practice: say that instead of "with help".
    if (run.phase === "assisted" && run.misses === 0 && !run.settledBefore) view.badge = t("Nice work. A fresh problem later checks this on your own.");
    if (run.phase === "assisted" && run.settledBefore) view.badge = t("You finished this one earlier.");
    const els = { feedback: panel, feedbackIcon: panel.querySelector(".fb-icon"), feedbackBadge: panel.querySelector(".fb-badge"), feedbackAnswers: panel.querySelector(".fb-answers"), feedbackActions: panel.querySelector(".fb-actions") };
    paintFeedback(els, view);
    panel.querySelector(".fb-title").textContent = view.heading;
    panel.hidden = false;
  }

  function submit(value) {
    const run = runs[ctx.state.tryAt];
    const problem = problems[ctx.state.tryAt];
    if (SETTLED.has(run.phase)) return;
    const clean = String(value ?? "").trim();
    run.submitted = clean;
    let event = "empty";
    if (clean) {
      const right = validateAnswer(clean, problem);
      if (run.phase === "revealed") event = right ? "revise-right" : "revise-wrong";
      else if (run.phase === "retry") event = right ? "right" : run.misses >= MAX_MISSES - 1 ? "wrong-final" : "wrong-again";
      else event = right ? "right" : "wrong";
    }
    const { phase, accepted } = nextPhase(run.phase, event, { independent: false });
    if (!accepted) return paint('[name="ml-answer"]');
    run.phase = phase;
    if (event === "wrong" || event === "wrong-again") {
      run.misses += 1;
      // Each miss opens the next hint, so a learner is never stuck.
      if (run.hints < problem.hints.length) run.hints += 1;
    }
    if (phase === "revealed") run.worked = true;
    if (SETTLED.has(phase)) ctx.onTried(ctx.state.tryAt, phase === "assisted");
    paint(SETTLED.has(phase) ? "[data-next-problem]" : '[name="ml-answer"]');
  }

  const onSubmit = (event) => {
    if (!event.target.matches?.(".ml-form")) return;
    event.preventDefault();
    const checked = stage.querySelector('input[name="ml-answer"]:checked');
    submit(checked ? checked.value : stage.querySelector("#ml-answer")?.value);
  };
  const onChange = (event) => {
    if (event.target.matches?.('input[name="ml-answer"]')) runs[ctx.state.tryAt].submitted = event.target.value;
  };
  const onClick = (event) => {
    const run = runs[ctx.state.tryAt];
    const problem = problems[ctx.state.tryAt];
    const action = event.target.closest("[data-feedback-action]")?.dataset.feedbackAction;
    if (action === "try-again") return stage.querySelector('[name="ml-answer"]')?.focus();
    if (action === "hint" || event.target.closest("[data-hint]")) {
      if (run.hints < problem.hints.length) run.hints += 1;
      return paint(".ml-hints li:last-child");
    }
    if (action === "worked") {
      const { phase } = nextPhase(run.phase, "wrong-final", { independent: false });
      run.phase = phase;
      run.worked = true;
      return paint('[name="ml-answer"]');
    }
    if (event.target.closest("[data-picture]")) {
      run.picture = true;
      return paint();
    }
    if (event.target.closest("[data-next-problem]")) {
      if (ctx.state.tryAt >= TRY_COUNT - 1) {
        summary = true;
        return paint("#ml-stage-title");
      }
      ctx.state.tryAt += 1;
      return paint("#ml-stage-title");
    }
    if (event.target.closest("[data-to-explain]")) return ctx.goTo("explain");
    if (event.target.closest("[data-review]")) {
      summary = false;
      ctx.state.tryAt = 0;
      paint("#ml-stage-title");
    }
  };
  stage.addEventListener("submit", onSubmit);
  stage.addEventListener("change", onChange);
  stage.addEventListener("click", onClick);
  summary = settleNow() && ctx.state.tryAt === 0 && runs.every((run) => run.settledBefore);
  paint();
  return () => {
    stopGraphic();
    stage.removeEventListener("submit", onSubmit);
    stage.removeEventListener("change", onChange);
    stage.removeEventListener("click", onClick);
  };
}
