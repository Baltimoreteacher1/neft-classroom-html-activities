// Language Studio Player — lessons: the timeline on a unit's page and the lesson page itself
// (`?unit=<id>&lesson=<lessonId>`, add `&view=student` for the student view, `&track=newcomer` for the newcomer path).
import { LEVEL_INFO, h } from "./studio-core.js";
import { icon } from "./studio-icons.js";
import { renderTeacherCard } from "./studio-lesson-card.js";
import {
  DRAFT_SOURCE,
  DRAFT_TEXT,
  demandLevel,
  goLesson,
  lessonHref,
  lessonRoute,
  loadLessonById,
  loadUnitLessons,
  replaceLessonUrl,
  unitHref,
} from "./studio-lesson-data.js";
import { createStepper } from "./studio-lesson-steps.js";

export { lessonKeep, lessonRoute } from "./studio-lesson-data.js";

const DEMAND = { low: ["Low", 1], medium: ["Medium", 2], high: ["High", 3] };
const LEVEL_TOGGLE = [
  ["l1_2", "L1–2"],
  ["l3_4", "L3–4"],
  ["l5_6", "L5–6"],
];
const NS = "http://www.w3.org/2000/svg";

// ---------- shared bits ----------
/** Language-demand badge: a text label plus a 1/2/3-bar shape, never color alone. */
export function demandBadge(score) {
  const level = demandLevel(score);
  const [label, bars] = DEMAND[level];
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 18 14");
  svg.setAttribute("class", "sl-bars");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  [0, 1, 2].forEach((i) => {
    const bar = document.createElementNS(NS, "rect");
    bar.setAttribute("x", String(i * 6.5));
    bar.setAttribute("y", String(10 - i * 4));
    bar.setAttribute("width", "5");
    bar.setAttribute("height", String(4 + i * 4));
    bar.setAttribute("rx", "1");
    bar.setAttribute("class", i < bars ? "is-on" : "is-off");
    svg.append(bar);
  });
  return h(
    "span",
    { class: `sl-chip sl-demand`, "data-level": level },
    svg,
    `Language demand: ${label}`,
  );
}
const draftChip = () => h("span", { class: "sl-chip sl-draft" }, DRAFT_TEXT);
const minutesChip = (min) => h("span", { class: "sl-chip" }, icon("clock", 14), `${min} min`);
const kluChip = (klu) => h("span", { class: "sl-chip sl-klu" }, klu);

function failCard(title, text, retry, back) {
  return h(
    "div",
    { class: "st-fail st-card sl-fail", role: "alert" },
    h("h2", null, title),
    h("p", { class: "st-run__mission" }, text),
    h(
      "p",
      { class: "sl-fail__actions" },
      retry
        ? h(
            "button",
            { type: "button", class: "st-btn st-btn--primary", onclick: retry },
            "Try again",
          )
        : null,
      back,
    ),
  );
}
const offlineText = () =>
  window.navigator.onLine === false
    ? "You seem to be offline. Reconnect and try again."
    : "Check your connection and try again.";

// ---------- timeline on the unit page ----------
function navClick(fn) {
  return (e) => {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    fn();
  };
}

function timelineItem(app, l) {
  return h(
    "li",
    { class: "sl-tl__item" },
    h("span", { class: "sl-tl__num", "aria-hidden": "true" }, String(l.sequence)),
    h(
      "div",
      { class: "sl-tl__body" },
      h(
        "h3",
        null,
        h(
          "a",
          {
            class: "sl-tl__link",
            href: lessonHref(app, { lesson: l.id }),
            onclick: navClick(() => goLesson(app, { lesson: l.id })),
          },
          `Lesson ${l.sequence}: ${l.title}`,
        ),
      ),
      h(
        "p",
        { class: "sl-chips" },
        minutesChip(l.minutes),
        kluChip(l.klu),
        demandBadge(l.language_demand_score),
        l.source === DRAFT_SOURCE ? draftChip() : null,
      ),
      h("p", { class: "sl-tl__goal" }, `Language goal: ${l.function}.`),
      l.vocab?.length
        ? h("p", { class: "sl-tl__vocab" }, h("b", null, "Words: "), l.vocab.join(", "))
        : null,
    ),
  );
}

/** "Lessons" section for the unit home. Removes itself when the unit has no lessons. */
export function lessonsSection(app) {
  const body = h(
    "div",
    { class: "sl-tl-host" },
    h("p", { class: "sh-sub", role: "status" }, "Loading lessons…"),
  );
  const section = h(
    "section",
    { class: "sh-section sl-section", id: "lessons", "aria-labelledby": "slLessonsH" },
    h(
      "div",
      { class: "sh-sechead" },
      h("p", { class: "sh-eyebrow" }, "Lessons"),
      h("h2", { id: "slLessonsH" }, "Lessons in this unit"),
      h(
        "p",
        { class: "sh-sub" },
        "Teach in order, or open any lesson. Each one has a teacher card and six short steps.",
      ),
    ),
    body,
  );
  const load = async () => {
    body.replaceChildren(h("p", { class: "sh-sub", role: "status" }, "Loading lessons…"));
    try {
      const data = await loadUnitLessons(app.unitId);
      if (!data?.lessons?.length) return section.remove();
      body.replaceChildren(
        data.lessons.some((l) => l.source === DRAFT_SOURCE)
          ? h("p", { class: "sl-chips" }, draftChip())
          : null,
        h(
          "ol",
          { class: "sl-tl" },
          data.lessons.map((l) => timelineItem(app, l)),
        ),
      );
    } catch (err) {
      console.warn("[studio] lessons failed", err);
      body.replaceChildren(failCard("Lessons did not load", offlineText(), load, null));
    }
  };
  load();
  return section;
}

// ---------- lesson page ----------
function levelToggle(app, route, lesson) {
  const pick = (level) => {
    if (level !== app.level) {
      if (route.track) replaceLessonUrl(app, { lesson: lesson.id, view: route.view });
      app.setLevel(level);
    } else if (route.track) goLesson(app, { lesson: lesson.id, view: route.view }, { replace: true });
  };
  return h(
    "div",
    { class: "sl-toggle", role: "group", "aria-label": "Differentiation: choose a level" },
    LEVEL_TOGGLE.map(([level, label]) =>
      h(
        "button",
        {
          type: "button",
          class: "st-chip",
          "aria-pressed": String(!route.track && app.level === level),
          title: `${LEVEL_INFO[level].name}: ${LEVEL_INFO[level].wida}`,
          onclick: () => pick(level),
        },
        label,
      ),
    ),
    h(
      "button",
      {
        type: "button",
        class: "st-chip",
        "aria-pressed": String(route.track === "newcomer"),
        title: "Newcomer path: no English reading needed",
        onclick: () =>
          goLesson(
            app,
            { lesson: lesson.id, track: "newcomer", view: route.view },
            { replace: true },
          ),
      },
      "Newcomer",
    ),
  );
}

function pageHead(app, route, lesson) {
  const student = route.view === "student";
  const tc = lesson.teacher_card;
  return h(
    "header",
    { class: "sl-head" },
    student
      ? null
      : h(
          "a",
          {
            class: "st-btn st-btn--ghost st-btn--sm sl-back",
            href: unitHref(app),
            onclick: navClick(() => app.go(null)),
          },
          "← Unit lessons",
        ),
    h(
      "p",
      { class: "sl-chips" },
      h("span", { class: "sl-chip" }, `Lesson ${lesson.sequence}`),
      student ? null : minutesChip(tc.minutes),
      student ? null : kluChip(lesson.language_objective.klu),
      student ? null : demandBadge(lesson.language_demand_score),
      !student && lesson.source === DRAFT_SOURCE ? draftChip() : null,
    ),
    h("h1", null, lesson.title),
    student
      ? h(
          "p",
          { class: "sl-ican" },
          h("b", null, "Today I can: "),
          lesson.language_objective.by_level?.[app.level] || lesson.language_objective.function,
        )
      : h(
          "div",
          { class: "sl-controls" },
          levelToggle(app, route, lesson),
          h(
            "a",
            {
              class: "st-btn",
              href: `/api/bcpss/lessons/${encodeURIComponent(lesson.id)}/export?format=html`,
              target: "_blank",
              rel: "noopener",
            },
            icon("print", 18),
            "Print lesson",
          ),
        ),
  );
}

/** Render the lesson named by the URL into `root`. Returns the cleanup the router calls on the next route. */
export function renderLessonPage(root, app) {
  const route = lessonRoute();
  const student = route.view === "student";
  let disposed = false;
  let stepper = null;
  if (student) document.documentElement.dataset.slView = "student";
  else delete document.documentElement.dataset.slView;

  const back = student
    ? null
    : h(
        "a",
        { class: "st-btn", href: unitHref(app), onclick: navClick(() => app.go(null)) },
        "Back to the unit",
      );
  const fail = (title, text, retry) => root.replaceChildren(failCard(title, text, retry, back));

  const run = async () => {
    root.replaceChildren(h("p", { class: "st-loading", role: "status" }, "Loading lesson…"));
    if (!route.lesson || !route.lesson.startsWith(`${app.unitId.toLowerCase()}-l`))
      return fail(
        "We could not find that lesson",
        "Check the link, or pick a lesson from the unit page.",
        null,
      );
    let lesson;
    try {
      lesson = await loadLessonById(route.lesson);
    } catch (err) {
      console.warn("[studio] lesson failed", err);
      if (!disposed) fail("The lesson did not load", offlineText(), run);
      return;
    }
    if (disposed) return;
    if (!lesson)
      return fail(
        "We could not find that lesson",
        "Check the link, or pick a lesson from the unit page.",
        null,
      );
    const page = h("div", { class: "sl st-view", "data-view": route.view });
    stepper = createStepper(app, lesson, route, page);
    page.append(
      ...[
        pageHead(app, route, lesson),
        student ? null : renderTeacherCard(lesson, app.level),
        stepper.el,
      ].filter(Boolean),
    );
    root.replaceChildren(page);
    document.title = `${lesson.title} — ${app.unit.unit_title} · Language Studio`;
  };
  run();

  return () => {
    disposed = true;
    stepper?.dispose();
    delete document.documentElement.dataset.slView;
  };
}
