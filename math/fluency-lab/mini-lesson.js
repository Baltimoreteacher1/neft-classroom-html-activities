// Mini-lesson player (owner: lessons workstream). Learn It, Watch It, Try It, Explain It for any of the 96 skills.
// config: { skill, grade, lang, supportLevel (1-4), onEvidence({ correct, independent: false }), onDone({ explained }),
//           onExit() }  (onExit draws the "Back" control; the rest is optional)
// handle: { destroy(), goTo(stepId) }
// The data model is built by lesson-4/build.js (pure, tested); this file draws the chrome, keeps the learner's
// place, and hands each step to its view.
import { getLang, setLang, t } from "./i18n.js";
import { getLevel } from "./language-settings.js";
import { esc } from "./lesson-4/dom.js";
import { STEP_IDS, buildMiniLesson } from "./lesson-4/build.js";
import { explainModel } from "./lesson-4/explain-model.js";
import { clearResume, loadResume, saveResume } from "./lesson-4/resume.js";
import { renderExplain } from "./mini-lesson-explain.js";
import { renderLearn, renderWatch } from "./mini-lesson-learn.js";
import { renderTry } from "./mini-lesson-try.js";
import { handleModelInput, handleModelTap } from "./trail-pictures.js";

const VIEWS = { learn: renderLearn, watch: renderWatch, try: renderTry, explain: renderExplain };
const NAMES = { learn: () => t("Learn It"), watch: () => t("Watch It"), try: () => t("Try It"), explain: () => t("Explain It") };
const NEXT = { learn: () => t("Next: Watch It"), watch: () => t("Next: Try It"), try: () => t("Next: Explain It"), explain: () => t("Finish") };

export function mountMiniLesson(container, config = {}) {
  const skill = config.skill.grade === undefined ? { ...config.skill, grade: config.grade } : config.skill;
  const key = `${skill.grade}:${skill.id}`;
  const level = Math.min(4, Math.max(1, Number(config.supportLevel) || getLevel()));
  if (config.lang && config.lang !== getLang()) setLang(config.lang, { persist: false });
  let lang = getLang();

  const saved = loadResume(key);
  const progress = { seed: saved?.seed || (Math.random() * 2 ** 32) >>> 0, tried: saved?.tried || [null, null, null], step: saved?.step || "learn", writing: saved?.writing || lang };
  let lesson = buildMiniLesson(skill, { supportLevel: level, lang, seed: progress.seed, missed: progress.tried.includes(false) });
  // Per-view working state survives a language change or going Back.
  const state = {};
  let finished = false;
  let explained = false;
  let cleanupView = () => {};
  let alive = true;

  container.innerHTML = `<section class="ml">
    <header class="ml-head"><h3 class="ml-title" id="ml-title"></h3>${config.onExit ? `<button type="button" class="ml-btn ml-btn-quiet" data-exit></button>` : ""}</header>
    <nav class="ml-nav" aria-label=""><ol class="ml-dots"></ol></nav>
    <div class="ml-stage" tabindex="-1"></div>
    <footer class="ml-foot"><button type="button" class="ml-btn" data-back></button><button type="button" class="ml-btn ml-btn-primary" data-next></button></footer>
  </section>`;
  const root = container.querySelector(".ml");
  const stage = root.querySelector(".ml-stage");
  const dots = root.querySelector(".ml-dots");
  const back = root.querySelector("[data-back]");
  const next = root.querySelector("[data-next]");
  const exit = root.querySelector("[data-exit]");

  const index = () => STEP_IDS.indexOf(progress.step);
  const persist = () => saveResume(key, { step: progress.step, seed: progress.seed, tried: progress.tried, writing: state.explain?.writing || progress.writing });

  function chrome() {
    root.querySelector("#ml-title").textContent = t("Mini-lesson");
    root.setAttribute("aria-label", `${t("Mini-lesson")}: ${t(skill.title)}`);
    root.querySelector(".ml-nav").setAttribute("aria-label", t("Mini-lesson steps"));
    const at = index();
    dots.innerHTML = STEP_IDS.map((id, i) => {
      const done = finished || i < at;
      const name = NAMES[id]();
      return `<li class="${i === at ? "now" : ""} ${done ? "done" : ""}"><button type="button" class="ml-dot" data-step="${id}"${i === at ? ' aria-current="step"' : ""} aria-label="${esc(t("Step {n} of {total}: {name}", { n: i + 1, total: STEP_IDS.length, name }) + (done ? `, ${t("done")}` : ""))}"><span class="ml-dot-num" aria-hidden="true">${i + 1}</span><span class="ml-dot-label">${esc(name)}</span></button></li>`;
    }).join("");
    back.textContent = t("Back");
    back.disabled = at === 0 || finished;
    next.textContent = NEXT[progress.step]();
    next.hidden = finished;
    back.hidden = finished;
    if (exit) exit.textContent = t("Back to the skill page");
  }

  const ctx = {
    stage,
    skill,
    key,
    level,
    get lang() {
      return lang;
    },
    state,
    get tried() {
      return progress.tried;
    },
    onTried(i, correct) {
      progress.tried[i] = correct;
      persist();
      config.onEvidence?.({ correct, independent: false });
    },
    onExplained() {
      explained = true;
    },
    goTo: (id) => show(id),
    rerender: (focus) => show(progress.step, { focus }),
  };

  function show(id, { focus = "#ml-stage-title" } = {}) {
    if (!alive || !STEP_IDS.includes(id)) return;
    cleanupView();
    progress.step = id;
    // Explain It opens on "fix it" when a Try-It problem needed the steps, so it is built when the step opens.
    if (id === "explain") lesson.steps[3] = { id: "explain", model: explainModel(skill, { supportLevel: level, missed: progress.tried.includes(false) }) };
    ctx.step = lesson.steps[STEP_IDS.indexOf(id)];
    chrome();
    stage.replaceChildren();
    cleanupView = VIEWS[id]({ ...ctx, lang, step: ctx.step }) || (() => {});
    persist();
    const target = stage.querySelector(focus || "#ml-stage-title");
    if (target) target.focus({ preventScroll: false });
  }

  function finish() {
    finished = true;
    clearResume(key);
    cleanupView();
    chrome();
    stage.innerHTML = `<section class="ml-card ml-done" aria-labelledby="ml-stage-title"><h4 class="ml-idea" id="ml-stage-title" tabindex="-1">${esc(t("Mini-lesson complete"))}</h4><p>${esc(explained ? t("You learned it, watched it, tried it, and explained it. Your explanation is in your math journal.") : t("You learned it, watched it, and tried it. You can come back and explain it any time."))}</p><p>${esc(t("Mini-lessons are guided, so a fresh practice set shows what you can do on your own."))}</p><div class="ml-row"><button type="button" class="ml-btn ml-btn-primary" data-again>${esc(t("Do this mini-lesson again"))}</button>${config.onExit ? `<button type="button" class="ml-btn" data-exit-done>${esc(t("Back to the skill page"))}</button>` : ""}</div></section>`;
    stage.querySelector("#ml-stage-title").focus();
    config.onDone?.({ explained });
  }

  function restart() {
    progress.seed = (Math.random() * 2 ** 32) >>> 0;
    progress.tried = [null, null, null];
    lesson = buildMiniLesson(skill, { supportLevel: level, lang, seed: progress.seed });
    for (const name of Object.keys(state)) delete state[name];
    finished = false;
    explained = false;
    show("learn");
  }

  const onClick = (event) => {
    // The lab's tap-to-build pictures are driven by delegated handlers; handle them here so they work in any host.
    if (handleModelTap(event.target)) return event.stopPropagation();
    const dot = event.target.closest("[data-step]");
    if (dot && root.contains(dot) && dot.classList.contains("ml-dot")) return show(dot.dataset.step);
    if (event.target.closest("[data-back]")) return show(STEP_IDS[Math.max(0, index() - 1)]);
    if (event.target.closest("[data-next]")) return index() === STEP_IDS.length - 1 ? finish() : show(STEP_IDS[index() + 1]);
    if (event.target.closest("[data-exit], [data-exit-done]")) return config.onExit?.();
    if (event.target.closest("[data-again]")) restart();
  };
  const onInput = (event) => {
    if (handleModelInput(event.target)) event.stopPropagation();
  };
  root.addEventListener("click", onClick);
  root.addEventListener("input", onInput);
  // A language switch redraws the current step in place; nothing the learner typed is lost.
  const watcher = typeof MutationObserver === "function" ? new MutationObserver(() => {
    if (getLang() === lang || finished) return;
    lang = getLang();
    show(progress.step, { focus: "" });
  }) : null;
  watcher?.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  show(progress.step);
  return {
    destroy() {
      alive = false;
      watcher?.disconnect();
      cleanupView();
      root.removeEventListener("click", onClick);
      root.removeEventListener("input", onInput);
      container.textContent = "";
    },
    goTo(id) {
      show(id);
    },
  };
}
