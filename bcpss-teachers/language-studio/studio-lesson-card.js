// Language Studio Player — lessons: the teacher card (teacher view only; never rendered in the student view).
import { h } from "./studio-core.js";
import { ARC_LABELS } from "./studio-lesson-data.js";

const LEVEL_ROWS = [
  ["l1_2", "L1–2"],
  ["l3_4", "L3–4"],
  ["l5_6", "L5–6"],
];
const MOVE_STEPS = [
  ["input", "Hear it"],
  ["interact", "Talk it"],
  ["produce", "Say or write it"],
];

const list = (items, cls) =>
  h(
    "ul",
    { class: cls || "sl-list" },
    (items || []).map((t) => h("li", null, t)),
  );

function card(id, title, ...body) {
  return h(
    "section",
    { class: "sl-card st-card", "aria-labelledby": id },
    h("h3", { id }, title),
    ...body,
  );
}

function levelList(rows, level, current) {
  return h(
    "dl",
    { class: "sl-levels" },
    rows.flatMap(([key, label]) => {
      const here = key === current;
      return [
        h("dt", { class: here ? "is-current" : null }, label, here ? " (your level)" : ""),
        h("dd", { class: here ? "is-current" : null }, level[key] || ""),
      ];
    }),
  );
}

function moves(lesson) {
  const items = MOVE_STEPS.map(([step, label]) => {
    const act = lesson.arc?.find((s) => s.step === step)?.activity;
    return act
      ? h(
          "li",
          null,
          h("b", null, `${label}: `),
          `${act.title} (${ARC_LABELS[step]}, ${act.minutes} min). `,
          act.tip,
        )
      : null;
  });
  return h("ol", { class: "sl-list sl-moves" }, items);
}

function listenChecklist(lesson) {
  return h(
    "ul",
    { class: "sl-checklist" },
    (lesson.teacher_card.listen_for || []).map((text, i) => {
      const id = `slListen${i}`;
      return h(
        "li",
        null,
        h("input", { type: "checkbox", id, class: "sl-check" }),
        h("label", { for: id }, text),
      );
    }),
  );
}

/** Teacher card: objective, language objective by level, the 3 moves, materials, listen-fors, watch-outs, differentiation. */
export function renderTeacherCard(lesson, level) {
  const tc = lesson.teacher_card;
  const lo = lesson.language_objective;
  const newTerms = (lesson.vocab || []).filter((v) => v.new_or_review === "new").map((v) => v.term);
  const diff = { ...tc.differentiation };
  return h(
    "section",
    { class: "sl-teacher", "aria-labelledby": "slTeacherH" },
    h(
      "div",
      { class: "sl-sechead" },
      h("p", { class: "sh-eyebrow" }, "Teacher card"),
      h("h2", { id: "slTeacherH" }, "Plan this lesson"),
      h("p", { class: "sh-sub" }, `About ${tc.minutes} minutes. Only you see this card.`),
    ),
    h(
      "div",
      { class: "sl-grid" },
      card(
        "slObjH",
        "Objectives",
        h("p", { class: "sl-obj" }, h("b", null, "Content: "), lesson.content_objective),
        h(
          "p",
          { class: "sl-obj" },
          h("b", null, "Language: "),
          `${lo.klu}: ${lo.function}`,
          lo.forms?.length ? ` (forms: ${lo.forms.join(", ")})` : "",
        ),
        levelList(LEVEL_ROWS, lo.by_level || {}, level),
        newTerms.length
          ? h("p", { class: "sl-obj" }, h("b", null, "New words: "), newTerms.join(", "))
          : null,
      ),
      card("slMovesH", "The 3 moves", moves(lesson)),
      card("slMatH", "Materials", list(tc.materials)),
      card("slListenH", "What to listen for", listenChecklist(lesson)),
      card("slWatchH", "Watch-outs", list(tc.watchouts)),
      card(
        "slDiffH",
        "Differentiation",
        levelList(LEVEL_ROWS, diff, level),
        diff.newcomer
          ? h("p", { class: "sl-obj" }, h("b", null, "Newcomer: "), diff.newcomer)
          : null,
      ),
    ),
  );
}
