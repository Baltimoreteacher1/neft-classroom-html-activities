// Language Studio Player — links between activities and lessons.
// Data comes from the API (`activity.lessons`, `lesson.studio_activities`, `lesson.reveal`), generated per unit by
// tools/build-bcpss-activity-lessons.mjs. Nothing here guesses a link: it only renders what the data names.
import { h } from "./studio-core.js";
import { goLesson, lessonHref } from "./studio-lesson-data.js";

const plain = (e) => e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
const REVEAL_HOST = "https://eduwonderlab.com";

/** "Part of: Lesson 1 · Meet decompose" chips under an activity's goal. Null in family mode or when unlinked. */
export function lessonChips(app, activity) {
  const lessons = activity.lessons || [];
  if (app.family || !lessons.length) return null;
  return h(
    "p",
    { class: "st-run__lessons" },
    h("span", { class: "st-run__lessons-tag" }, lessons.length > 1 ? "Part of lessons" : "Part of lesson"),
    ...lessons.map((l) => {
      const route = { lesson: l.id, view: "student" };
      return h(
        "a",
        {
          class: "st-lessonlink",
          href: lessonHref(app, route),
          onclick: (e) => {
            if (plain(e)) return;
            e.preventDefault();
            goLesson(app, route);
          },
        },
        `Lesson ${l.sequence} · ${l.title}`,
      );
    }),
  );
}

const HOW = {
  uses: "Used in this lesson",
  terms: "Practises this lesson's words",
  topic: "Closest topic",
};

/** "Practice in the Studio" list for a lesson page: the activities linked to this lesson, each one tap away. */
export function practiceSection(app, lesson) {
  const rows = lesson.studio_activities || [];
  if (!rows.length) return null;
  return h(
    "section",
    { class: "sl-practice", "aria-label": "Practice in the Studio" },
    h("h2", null, "Practice in the Studio"),
    h(
      "ul",
      { class: "sl-practice__list" },
      ...rows.map((a) =>
        h(
          "li",
          null,
          h(
            "a",
            {
              class: "sl-practice__link",
              href: `${window.location.pathname}?unit=${encodeURIComponent(app.unitId)}&a=${a.n}&level=${app.level}`,
            },
            h("b", null, a.title),
            h("span", { class: "sl-practice__how" }, HOW[a.how] || ""),
          ),
        ),
      ),
    ),
  );
}

/** Grade 6 math: the Reveal Math lessons that teach the same words. Teacher view only; null when none. */
export function revealSection(lesson) {
  const rows = lesson.reveal || [];
  if (!rows.length) return null;
  return h(
    "section",
    { class: "sl-reveal", "aria-label": "Reveal Math connection" },
    h("h2", null, "Reveal Math connection"),
    h("p", { class: "sl-reveal__note" }, "Lessons in Reveal Math that teach the same words:"),
    h(
      "ul",
      { class: "sl-practice__list" },
      ...rows.map((r) =>
        h(
          "li",
          null,
          h(
            "a",
            {
              class: "sl-practice__link",
              href: `${REVEAL_HOST}/lessons/${encodeURIComponent(r.id)}/`,
              target: "_blank",
              rel: "noopener",
            },
            h("b", null, `${r.id} · ${r.title}`),
            h("span", { class: "sl-practice__how" }, `Shared words: ${r.terms.join(", ")}`),
          ),
        ),
      ),
    ),
  );
}
