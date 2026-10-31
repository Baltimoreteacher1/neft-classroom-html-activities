// Mini-lesson steps 1 and 2: Learn It (idea, worked example, picture you can use, words) and Watch It (an animation
// where one fits the mathematics, otherwise a step-through of the worked example).
import { t } from "./i18n.js";
import { createLesson } from "./lesson-content.js";
import { esc, givens, pick, reducedMotion } from "./lesson-4/dom.js";
import { attachAnimation, attachGraphic } from "./lesson-4/visual-host.js";
import { whyFor } from "./step-whys.js";
import { interactivePicture, mathText, stepVisual, trailPicture } from "./trail-pictures.js";
import { renderInlineProblemModel, renderModel } from "./visual-lab.js";

// The exact picture the lab already draws for this problem; it always works, with or without the new graphics.
// `own` is false when the problem has no picture of its own and the skill's general model (other numbers) is shown.
export function pictureOf(skill, item, model = item.model) {
  const own = (model && (interactivePicture({ ...model, worked: true }) || trailPicture(model))) || renderInlineProblemModel(skill, item);
  return own ? { html: own, own: true } : { html: renderModel(createLesson(skill).model), own: false };
}
// Watch It shows the picture without its tap prompts: the step-through is the thing to watch.
export const stillPictureHtml = (skill, item) => (item.model && trailPicture(item.model)) || renderInlineProblemModel(skill, item) || renderModel(createLesson(skill).model);

const question = (example) => `<p class="ml-q">${mathText(example.question)}${example.unit ? ` <span class="ml-unit">${esc(example.unit)}</span>` : ""}</p>`;

// The question in Español when the learner reads Spanish (the English stays: it is what they will practise with).
export const spanishLine = (example, lang) =>
  lang === "es" && example.questionEs ? `<p class="ml-q-es" lang="es">${esc(example.questionEs)}</p>` : "";

const stepItem = (line, index, steps, last) => {
  const why = whyFor(line, index, steps);
  const picture = stepVisual(line);
  return `<li class="ml-step${last ? " ml-step-final" : ""}"><span class="ml-step-num" aria-hidden="true">${index + 1}</span><div class="ml-step-body"><p class="ml-step-text">${mathText(line)}</p>${why ? `<p class="ml-step-why">${esc(why)}</p>` : ""}${picture}</div></li>`;
};

const wordCards = (words, lang) =>
  words
    .map((word) => {
      const primary = lang === "es" ? word.es : word.en;
      const other = lang === "es" ? word.en : word.es;
      const meaning = lang === "es" ? word.defEs : word.defEn;
      return `<li class="ml-word"><p class="ml-word-head"><strong lang="${lang}">${esc(primary)}</strong> <span class="ml-word-other" lang="${lang === "es" ? "en" : "es"}">${esc(other)}</span>${word.cognate ? ` <span class="ml-cognate">${esc(t("looks alike in both languages"))}</span>` : ""}</p><p class="ml-word-def">${esc(meaning)}</p></li>`;
    })
    .join("");

const slotHtml = (fallback) => `<div class="ml-slot"><div class="ml-fallback">${fallback}</div><div class="ml-live" hidden></div></div>`;

export function renderLearn(ctx) {
  const { stage, step, skill, lang } = ctx;
  const { example } = step;
  const last = example.steps.length;
  const picture = pictureOf(skill, example.item);
  let shown = ctx.state.learnShown || 1;
  const stepsHtml = () => example.steps.slice(0, shown).map((line, i) => stepItem(line, i, example.steps, i === last - 1)).join("");
  stage.innerHTML = `<div class="ml-learn">
    <h4 class="ml-idea" id="ml-stage-title" tabindex="-1">${esc(pick(step.idea, lang))}</h4>
    <div class="ml-learn-grid">
      <section class="ml-card ml-example" aria-labelledby="ml-ex-label">
        <p class="ml-label" id="ml-ex-label">${esc(t("Worked example"))}</p>
        ${question(example)}${spanishLine(example, lang)}
        <ol class="ml-steps" aria-live="polite"></ol>
        <p class="ml-answer" hidden><span>${esc(t("Answer"))}</span> <strong>${mathText(example.displayAnswer)}${example.unit ? ` ${esc(example.unit)}` : ""}</strong></p>
        <div class="ml-row"><button type="button" class="ml-btn ml-btn-primary" data-more>${esc(t("Show the next step"))}</button><button type="button" class="ml-btn ml-btn-quiet" data-all>${esc(t("Show all steps"))}</button></div>
      </section>
      <section class="ml-card ml-visual" aria-labelledby="ml-vis-label">
        <p class="ml-label" id="ml-vis-label">${esc(picture.own ? t("Try the picture") : t("A picture of a similar problem"))}</p>
        ${slotHtml(picture.html)}
        <p class="ml-hint-line">${esc(picture.own ? t("Tap or type in the picture to explore it.") : t("This picture uses different numbers. It shows the same idea."))}</p>
      </section>
    </div>
    <p class="ml-watch"><strong>${esc(t("Watch out:"))}</strong> ${esc(pick(step.watch, lang))}</p>
    <section class="ml-words" aria-labelledby="ml-words-label"><p class="ml-label" id="ml-words-label">${esc(t("Words to know"))}</p><ul class="ml-word-list">${wordCards(step.words, lang)}</ul></section>
  </div>`;
  const list = stage.querySelector(".ml-steps");
  const more = stage.querySelector("[data-more]");
  const all = stage.querySelector("[data-all]");
  const draw = (focusLast = false) => {
    list.innerHTML = stepsHtml();
    const done = shown >= last;
    stage.querySelector(".ml-answer").hidden = !done;
    more.hidden = done;
    all.hidden = done;
    ctx.state.learnShown = shown;
    if (focusLast) list.lastElementChild?.querySelector(".ml-step-text")?.setAttribute("tabindex", "-1");
    if (focusLast) list.lastElementChild?.querySelector(".ml-step-text")?.focus();
  };
  draw();
  more.addEventListener("click", () => {
    shown = Math.min(last, shown + 1);
    draw(true);
  });
  all.addEventListener("click", () => {
    shown = last;
    draw(true);
  });
  const slot = stage.querySelector(".ml-slot");
  const stopGraphic = attachGraphic(slot, step.visual.graphic, { mode: "explore", lang, label: skill.title, values: givens(example.question) });
  return stopGraphic;
}

// Watch It: the animation when the skill has one, else the worked example one step at a time.
export function renderWatch(ctx) {
  const { stage, step, skill, lang } = ctx;
  const { example } = step;
  const steps = example.steps;
  let at = ctx.state.watchAt ?? 0;
  let timer = null;
  const still = reducedMotion();
  stage.innerHTML = `<div class="ml-watch-view">
    <h4 class="ml-idea" id="ml-stage-title" tabindex="-1">${esc(t("Watch it work"))}</h4>
    ${step.animation ? `<section class="ml-card ml-anim" aria-label="${esc(t("Animation"))}" hidden>${slotHtml("")}</section>` : ""}
    <section class="ml-card ml-film" aria-labelledby="ml-film-label">
      <p class="ml-label" id="ml-film-label">${esc(step.animation ? t("The same example, one step at a time") : t("One step at a time"))}</p>
      ${question(example)}${spanishLine(example, lang)}
      <div class="ml-film-grid"><div class="ml-film-frame" aria-live="polite"></div><div class="ml-film-picture">${slotHtml(stillPictureHtml(skill, example.item))}</div></div>
      <div class="ml-row ml-film-controls" role="group" aria-label="${esc(t("Step controls"))}">
        <button type="button" class="ml-btn" data-film-prev>${esc(t("Back"))}</button>
        ${still ? "" : `<button type="button" class="ml-btn ml-btn-primary" data-film-play>${esc(t("Play"))}</button>`}
        <button type="button" class="ml-btn ml-btn-primary" data-film-next>${esc(t("Next step"))}</button>
      </div>
    </section>
  </div>`;
  const frame = stage.querySelector(".ml-film-frame");
  const prev = stage.querySelector("[data-film-prev]");
  const next = stage.querySelector("[data-film-next]");
  const play = stage.querySelector("[data-film-play]");
  const stopTimer = () => {
    clearInterval(timer);
    timer = null;
    if (play) play.textContent = at >= steps.length - 1 ? t("Watch again") : t("Play");
  };
  const draw = () => {
    const line = steps[at];
    const why = whyFor(line, at, steps);
    frame.innerHTML = `<p class="ml-film-count">${esc(t("Step {n} of {total}", { n: at + 1, total: steps.length }))}</p><p class="ml-film-text${at === steps.length - 1 ? " ml-film-final" : ""}">${mathText(line)}</p>${why ? `<p class="ml-step-why">${esc(why)}</p>` : ""}${stepVisual(line)}<ol class="ml-film-dots" aria-hidden="true">${steps.map((_, i) => `<li class="${i === at ? "now" : i < at ? "past" : ""}"></li>`).join("")}</ol>`;
    prev.disabled = at === 0;
    next.disabled = at >= steps.length - 1;
    ctx.state.watchAt = at;
    if (at >= steps.length - 1 && timer) stopTimer();
  };
  draw();
  prev.addEventListener("click", () => {
    stopTimer();
    at = Math.max(0, at - 1);
    draw();
  });
  next.addEventListener("click", () => {
    at = Math.min(steps.length - 1, at + 1);
    draw();
  });
  play?.addEventListener("click", () => {
    if (timer) return stopTimer();
    if (at >= steps.length - 1) at = 0;
    draw();
    play.textContent = t("Pause");
    timer = setInterval(() => {
      at = Math.min(steps.length - 1, at + 1);
      draw();
    }, 2600);
  });
  // The animation card stays hidden unless the module mounts; the step-through below always works.
  const card = stage.querySelector(".ml-anim");
  const stopAnimation = card
    ? attachAnimation(card.querySelector(".ml-slot"), step.animation, { lang, label: skill.title, values: givens(example.question) }, { onMount: () => (card.hidden = false) })
    : () => {};
  return () => {
    clearInterval(timer);
    stopAnimation();
  };
}
