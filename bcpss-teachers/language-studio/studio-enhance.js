// Language Studio Player — the shared enhancement pack every activity gets, whatever its kind:
// a "How to play" strip, read-aloud for the directions, and on completion a confidence check, a level nudge and the
// way into the lesson. All of it is on-device: preferences and ratings stay in localStorage and go nowhere.
import {
  LEVELS,
  LEVEL_INFO,
  announce,
  h,
  storeGet,
  storeSet,
  tts,
  ttsAvailable,
} from "./studio-core.js";
import { icon } from "./studio-icons.js";
import { howToFor } from "./studio-howto.js";
import { goLesson, lessonHref } from "./studio-lesson-data.js";

const SEEN_KEY = "bcpss-studio:prefs:howto-seen";
const confKey = (unitId) => `bcpss-studio:prefs:confidence:${unitId}`;

/** Three numbered steps for the kind. Open the first time a student meets a kind, folded away after that. */
export function howToBlock(kind) {
  const steps = howToFor(kind);
  if (!steps) return null;
  const seen = storeGet(SEEN_KEY) || [];
  const first = !seen.includes(kind);
  if (first) storeSet(SEEN_KEY, [...seen, kind]);
  const box = h(
    "details",
    { class: "st-howto" },
    h("summary", null, "How to play"),
    h("ol", { class: "st-howto__steps" }, ...steps.map((s) => h("li", null, s))),
  );
  box.open = first;
  return box;
}

/** "Read the directions" button, or null when this device cannot speak. */
export function readAloud(text) {
  if (!ttsAvailable()) return null;
  const btn = h(
    "button",
    { type: "button", class: "st-btn st-btn--ghost st-btn--sm st-run__read" },
    icon("speaker", 18),
    "Read the directions",
  );
  btn.addEventListener("click", async () => {
    btn.classList.add("is-live");
    await tts(text, { rate: 0.9 });
    btn.classList.remove("is-live");
  });
  return btn;
}

const SURE = [
  { key: "not", label: "Not yet" },
  { key: "getting", label: "Getting there" },
  { key: "got", label: "Got it" },
];

function confidence(app, index) {
  const saved = storeGet(confKey(app.unitId)) || {};
  const buttons = SURE.map((s) =>
    h(
      "button",
      { type: "button", class: "st-btn st-conf__btn", "aria-pressed": String(saved[index] === s.key) },
      s.label,
    ),
  );
  buttons.forEach((b, i) =>
    b.addEventListener("click", () => {
      const now = storeGet(confKey(app.unitId)) || {};
      storeSet(confKey(app.unitId), { ...now, [index]: SURE[i].key });
      buttons.forEach((x, k) => x.setAttribute("aria-pressed", String(k === i)));
      announce(`${SURE[i].label}. Saved on this device.`);
    }),
  );
  return h(
    "div",
    { class: "st-conf", role: "group", "aria-label": "How sure do you feel about this?" },
    h("p", { class: "st-conf__label" }, "How sure do you feel about this?"),
    h("div", { class: "st-conf__row" }, ...buttons),
  );
}

/** Next level to offer after a finish: stretch when it went smoothly, starter when it needed a lot of help. */
export function levelNudge(level, stars) {
  const i = LEVELS.indexOf(level);
  if (stars === 3 && i < LEVELS.length - 1) return { level: LEVELS[i + 1], text: "Ready for more? Try it at" };
  if (stars === 1 && i > 0) return { level: LEVELS[i - 1], text: "Want more help? Try it at" };
  return null;
}

/** Extra block for the win card: confidence check, level nudge, and the lesson this activity belongs to. */
export function winExtras(app, { index, activity, stars }) {
  const nudge = app.family ? null : levelNudge(app.level, stars);
  const lesson = app.family ? null : activity.lessons?.[0];
  return h(
    "div",
    { class: "st-win__extra" },
    confidence(app, index),
    nudge
      ? h(
          "p",
          { class: "st-win__nudge" },
          h("span", null, `${nudge.text} `),
          h(
            "button",
            { type: "button", class: "st-btn st-btn--sm", onclick: () => app.setLevel(nudge.level) },
            `${LEVEL_INFO[nudge.level].name} level`,
          ),
        )
      : null,
    lesson
      ? h(
          "p",
          { class: "st-win__lesson" },
          h("span", null, "Keep going: "),
          h(
            "a",
            {
              class: "st-lessonlink",
              href: lessonHref(app, { lesson: lesson.id, view: "student" }),
              onclick: (e) => {
                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
                e.preventDefault();
                goLesson(app, { lesson: lesson.id, view: "student" });
              },
            },
            `Lesson ${lesson.sequence} · ${lesson.title}`,
          ),
        )
      : null,
  );
}
