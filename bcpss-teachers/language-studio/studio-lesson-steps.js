// Language Studio Player — lessons: the arc stepper. Mounts each step's activity with the same kind modules the
// unit player uses (every kind, old and new), and adds projector mode, a student link + QR, home-language help
// and on-device stars. Teacher-only elements are never built when route.view === "student".
import {
  announce,
  h,
  makeVocabIcon,
  rng,
  shuffle,
  starSvg,
  stopSpeaking,
  storeGet,
  storeSet,
  tts,
} from "./studio-core.js";
import {
  buildSteps,
  extensionStep,
  readPrefs,
  readRecord,
  replaceLessonUrl,
  stateKey,
  writePrefs,
  writeRecord,
} from "./studio-lesson-data.js";
import { icon } from "./studio-icons.js";
import { glossNode, glossPairs, placeholder, sharePanel } from "./studio-lesson-extras.js";

const KIND_NAME = /^[a-z_]+$/;
const importKind = (kind) => import(`./studio-kinds/${kind}.js`);

/**
 * Build the stepper for one lesson. Returns `{ el, dispose }`; `pageRoot` receives the `sl-projector` class.
 * `route` is `{ lesson, step, track, view }` from the URL.
 */
export function createStepper(app, lesson, route, pageRoot) {
  const student = route.view === "student";
  const ext = route.track ? null : extensionStep(lesson);
  const all = [
    ...buildSteps(lesson, route.track),
    ...(ext && (!student || app.level === "l5_6") ? [ext] : []),
  ];
  const prefs = readPrefs();
  const vocabIcon = makeVocabIcon(app.studio.vocab);
  let index = Math.max(
    0,
    all.findIndex((s) => s.id === (route.step || (student ? readRecord(lesson.id).last : ""))),
  );
  let kindCleanup = null;
  let token = 0;
  let disposed = false;
  const baseCount = all.filter((s) => s.key !== "ext").length;
  const position = (step) =>
    step.key === "ext" ? "Extension (optional)" : `Step ${index + 1} of ${baseCount}`;
  let projecting = false;
  let projectBtn = null;

  const buttons = all.map((step, i) => {
    const btn = h(
      "button",
      { type: "button", class: "sl-step", "data-step": step.id },
      h("span", { class: "sl-step__num", "aria-hidden": "true" }, String(i + 1)),
      h("span", { class: "sl-step__name" }, step.label),
      step.key === "ext" ? h("span", { class: "st-sr" }, " (optional, levels 5 and 6)") : null,
      h("span", { class: "st-sr sl-step__done" }),
    );
    btn.addEventListener("click", () => show(i, { focus: true }));
    return btn;
  });
  const nav = h(
    "nav",
    { class: "sl-steps", "aria-label": route.track ? "Newcomer path steps" : "Lesson steps" },
    h(
      "ol",
      null,
      buttons.map((b) => h("li", null, b)),
    ),
  );
  nav.addEventListener("keydown", (e) => {
    const at = buttons.indexOf(document.activeElement);
    if (at < 0) return;
    const to = {
      ArrowRight: at + 1,
      ArrowDown: at + 1,
      ArrowLeft: at - 1,
      ArrowUp: at - 1,
      Home: 0,
      End: buttons.length - 1,
    }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    buttons[Math.max(0, Math.min(buttons.length - 1, to))].focus();
  });
  const host = h("div", { class: "sl-panel-host" });
  const el = h(
    "section",
    { class: "sl-stepper", "aria-labelledby": "slStepsH" },
    h(
      "div",
      { class: "sl-sechead" },
      h("p", { class: "sh-eyebrow" }, route.track ? "Newcomer path" : "Lesson arc"),
      h("h2", { id: "slStepsH" }, student ? "Your steps" : "Teach it step by step"),
    ),
    nav,
    host,
  );

  function refreshNav() {
    const done = readRecord(lesson.id).done;
    buttons.forEach((btn, i) => {
      const isDone = Boolean(done[all[i].key]);
      if (i === index) btn.setAttribute("aria-current", "step");
      else btn.removeAttribute("aria-current");
      btn.classList.toggle("is-done", isDone);
      btn.querySelector(".sl-step__done").textContent = isDone ? " (done)" : "";
    });
  }

  function disposeKind() {
    token++;
    stopSpeaking();
    try {
      kindCleanup?.();
    } catch (err) {
      console.warn("[lesson] cleanup failed", err);
    }
    kindCleanup = null;
  }

  async function mount(step, root, onDone) {
    const mine = token;
    const act = step.activity;
    root.replaceChildren();
    if (!KIND_NAME.test(act.kind) || (app.hasKind && !app.hasKind(act.kind)))
      return placeholder(root, false);
    const key = stateKey(lesson.id, step.key);
    try {
      const mod = await importKind(act.kind);
      if (mine !== token || disposed) return;
      const result = mod.default(root, {
        unit: app.unit,
        studio: app.studio,
        activity: act,
        payload: act.payload,
        level: app.level,
        rng,
        shuffle,
        tts,
              announce,
        vocabIcon,
        done: onDone,
        saveState: (obj) => storeSet(key, obj),
        loadState: () => storeGet(key),
        homeLanguage: prefs.es ? "es" : null,
        root,
      });
      kindCleanup = typeof result === "function" ? result : null;
    } catch (err) {
      console.warn(`[lesson] ${act.kind} unavailable:`, err);
      if (mine === token) placeholder(root, true, () => mount(step, root, onDone));
    }
  }

  function doneCard(step, result, host) {
    const stars = Math.max(1, Math.min(3, Math.round(result?.stars || 1)));
    const rec = readRecord(lesson.id).done;
    const entry = { stars: Math.max(rec[step.key]?.stars || 0, stars) };
    if (result?.rating != null) entry.rating = String(result.rating).slice(0, 40);
    writeRecord(lesson.id, { done: { ...rec, [step.key]: entry } });
    refreshNav();
    const heading = h("h3", { tabindex: "-1" }, "Step done");
    const next = all[index + 1];
    host.replaceChildren(
      h(
        "section",
        { class: "st-win sl-win", "aria-label": "Step complete" },
        h(
          "div",
          { class: "st-stars", role: "img", "aria-label": `${stars} of 3 stars` },
          [1, 2, 3].map((n) => starSvg(n <= stars)),
        ),
        heading,
        h("p", { class: "st-win__detail" }, result?.detail || "Your stars stay on this device."),
        h(
          "div",
          { class: "st-win__actions" },
          next
            ? h(
                "button",
                {
                  type: "button",
                  class: "st-btn st-btn--primary st-btn--lg",
                  onclick: () => show(index + 1, { focus: true }),
                },
                `Next: ${next.label}`,
                icon("arrow", 20),
              )
            : null,
          h(
            "button",
            { type: "button", class: "st-btn", onclick: () => show(index, { focus: true }) },
            "Play again",
          ),
        ),
      ),
    );
    announce(`Step complete. ${stars} of 3 stars.`);
    heading.focus({ preventScroll: true });
  }

  function exitProjector() {
    if (!projecting) return;
    projecting = false;
    pageRoot.classList.remove("sl-projector");
    if (document.fullscreenElement) document.exitFullscreen?.().catch?.(() => {});
    projectBtn?.focus();
  }
  function enterProjector() {
    projecting = true;
    pageRoot.classList.add("sl-projector");
    try {
      pageRoot.requestFullscreen?.()?.catch?.(() => {});
    } catch {
      /* the large-type layout still works without fullscreen */
    }
    pageRoot.querySelector(".sl-exit-projector")?.focus();
    announce("Projector view. Press Escape to leave.");
  }
  const onKey = (e) => {
    if (e.key === "Escape") exitProjector();
  };
  const onFs = () => {
    if (projecting && !document.fullscreenElement && pageRoot.dataset.fs === "1") exitProjector();
    pageRoot.dataset.fs = document.fullscreenElement ? "1" : "";
  };
  document.addEventListener("keydown", onKey);
  document.addEventListener("fullscreenchange", onFs);

  function buildPanel(step) {
    const act = step.activity;
    const support = act.support?.[app.level];
    const heading = h("h3", { id: "slStepH", tabindex: "-1" }, act.title);
    const root = h("div", { class: "st-kind", "data-kind": act.kind });
    const doneHost = h("div", { "aria-live": "polite" });
    let finished = false;
    const onDone = (result) => {
      if (finished) return;
      finished = true;
      doneCard(step, result, doneHost);
    };
    const gloss = h("div", { class: "sl-gloss-host" });
    const paintGloss = () =>
      gloss.replaceChildren(prefs.es ? glossNode(glossPairs(app.studio.vocab, lesson, act)) : "");
    paintGloss();

    const tools = student
      ? h(
          "div",
          { class: "sl-tools" },
          h(
            "button",
            { type: "button", class: "st-btn st-btn--lg", onclick: () => tts(act.mission) },
            icon("speaker", 22),
            "Listen to the directions",
          ),
          h(
            "button",
            {
              type: "button",
              class: "st-btn st-btn--lg sl-es",
              "aria-pressed": String(prefs.es),
              title: "Show Spanish help",
              onclick: (e) => {
                prefs.es = !prefs.es;
                writePrefs({ es: prefs.es });
                e.currentTarget.setAttribute("aria-pressed", String(prefs.es));
                paintGloss();
                announce(prefs.es ? "Spanish help on." : "Spanish help off.");
              },
            },
            "Español",
          ),
        )
      : h(
          "div",
          { class: "sl-tools" },
          (projectBtn = h(
            "button",
            { type: "button", class: "st-btn", onclick: enterProjector },
            icon("eye", 18),
            "Project this step",
          )),
          sharePanel(app, lesson, route, step),
        );

    const prev = h(
      "button",
      {
        type: "button",
        class: "st-btn st-btn--lg",
        disabled: index === 0,
        onclick: () => show(index - 1, { focus: true }),
      },
      "Back",
    );
    const nextStep = all[index + 1];
    const next = nextStep
      ? h(
          "button",
          {
            type: "button",
            class: "st-btn st-btn--lg st-btn--primary",
            onclick: () => show(index + 1, { focus: true }),
          },
          `Next: ${nextStep.label}`,
          icon("arrow", 20),
        )
      : h(
          "button",
          { type: "button", class: "st-btn st-btn--lg", onclick: () => show(0, { focus: true }) },
          "Back to the first step",
        );

    const panel = h(
      "article",
      { class: "sl-panel", "data-domain": act.domain, "aria-labelledby": "slStepH" },
      h(
        "header",
        { class: "sl-panel__head" },
        h(
          "p",
          { class: "sl-panel__meta" },
          h("span", { class: "st-tag" }, position(step)),
          h("span", { class: "st-tag", "data-domain": act.domain }, act.domain),
          h("span", { class: "st-tag" }, `${act.minutes} min`),
          h("span", { class: "st-tag" }, act.grouping),
        ),
        heading,
        h("p", { class: "st-run__mission sl-mission" }, act.mission),
        support
          ? h(
              "p",
              { class: "st-run__support" },
              h("b", null, "Help for your level: "),
              h("span", null, support),
            )
          : null,
        !student && act.tip
          ? h(
              "details",
              { class: "st-tip" },
              h("summary", null, "Teacher tip"),
              h("p", null, act.tip),
            )
          : null,
      ),
      tools,
      !student
        ? h(
            "button",
            { type: "button", class: "st-btn sl-exit-projector", onclick: exitProjector },
            "Leave projector view (Esc)",
          )
        : null,
      gloss,
      h("section", { class: "st-stage sl-stage", "aria-label": act.title }, root),
      doneHost,
      h("div", { class: "sl-pager" }, prev, next),
    );
    return { panel, root, onDone, heading };
  }

  function show(i, { focus = false } = {}) {
    index = Math.max(0, Math.min(all.length - 1, i));
    const step = all[index];
    disposeKind();
    replaceLessonUrl(app, {
      lesson: lesson.id,
      step: step.id,
      track: route.track,
      view: route.view,
    });
    if (student) writeRecord(lesson.id, { last: step.id });
    refreshNav();
    const { panel, root, onDone, heading } = buildPanel(step);
    host.replaceChildren(panel);
    announce(`${position(step)}: ${step.label}.`);
    if (focus) heading.focus({ preventScroll: true });
    mount(step, root, onDone);
  }

  show(index);
  return {
    el,
    dispose() {
      disposed = true;
      disposeKind();
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
      pageRoot.classList.remove("sl-projector");
      if (document.fullscreenElement) document.exitFullscreen?.().catch?.(() => {});
    },
  };
}
