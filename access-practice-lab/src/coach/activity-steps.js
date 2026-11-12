// Coach steps for the lab's real activities: what each step points at and when it is done.
//
// Two activity shells exist and both are covered by one list: the leveled activity player (views/activity.js: skill
// lesson [data-frame-ready], directions, choices [data-ans-choice], "How sure are you?" [data-sure], "Check my answer"
// [data-check], .feedback with [data-retry]) and the K–3 player (early/player.js: "Hear it again" [data-early-replay],
// picture choices [data-early-pick], "Check" [data-early-check], .early-feedback). Each step lists both shells'
// selectors and a `when` so the coach passes over a step the open activity does not have.
//
// The words are passed in (`say`): the teacher tour speaks to a teacher in English, the family walkthrough speaks to a
// parent in the family's language. Selectors and completion rules are written once, here.

const shown = (el) => Boolean(el) && el.getBoundingClientRect().width > 0;
const has = (sel) => (doc) => shown(doc?.querySelector(sel));

/** The box that holds the answer choices (lab: the .choice labels' parent; K–3: the picture buttons' parent). */
export const choicesBox = (doc) =>
  doc.querySelector("[data-ans-choice]")?.closest(".choice")?.parentElement ||
  doc.querySelector("[data-early-pick]")?.parentElement ||
  null;
const sureBox = (doc) => doc.querySelector("[data-sure]")?.parentElement || null;
const feedback = (doc) => doc.querySelector(".feedback, .early-feedback");
const isRight = (el) => Boolean(el?.classList.contains("is-right"));
const hasFeedback = (doc) => shown(feedback(doc));

export const SEL = {
  skill: "[data-frame-ready]",
  directions: [".directions", "[data-early-replay]"],
  hearDirections: [".directions [data-say]", ".directions [data-say-es]", "[data-early-replay]"],
  spanish: "details.es-preview > summary",
  words: "details.gloss-list > summary",
  helpChild: "details.copilot > summary",
  choice: "[data-ans-choice], [data-early-pick]",
  check: ["[data-check]", "[data-early-check]"],
  feedback: [".feedback", ".early-feedback"],
  retry: "[data-retry]",
};

/** A step that only some audiences get (the family walkthrough points at Spanish directions and word help). */
const optional = (say, id) =>
  say[id]
    ? [
        {
          id,
          when: has(SEL[id]),
          target: SEL[id],
          title: say[id].title,
          body: say[id].body,
          done: { click: SEL[id] },
        },
      ]
    : [];

/**
 * The student loop in one activity: start, read or hear the task, answer, check, read the feedback, try again.
 * `say` holds every sentence (see TEACHER_SAY / FAMILY_SAY); `say.final` labels the last step's button.
 */
export function loopSteps(say) {
  return [
    {
      id: "intro",
      target: null,
      title: say.intro.title,
      body: say.intro.body,
      why: say.intro.why,
    },
    {
      id: "skill",
      when: has(SEL.skill),
      target: SEL.skill,
      title: say.skill.title,
      body: say.skill.body,
      done: { click: SEL.skill },
      fallback: say.skill.fallback,
    },
    {
      id: "directions",
      target: SEL.directions,
      title: say.directions.title,
      body: say.directions.body,
      why: say.directions.why,
      done: { click: SEL.hearDirections.join(", ") },
      fallback: say.directions.fallback,
    },
    ...optional(say, "helpChild"),
    ...optional(say, "spanish"),
    ...optional(say, "words"),
    {
      id: "answer",
      target: choicesBox,
      title: say.answer.title,
      body: say.answer.body,
      // The lab re-renders on click, so a later change event lands on a detached input: listen for the click.
      done: { click: "[data-ans-choice], label.choice, [data-early-pick]" },
      fallback: say.answer.fallback,
    },
    {
      id: "sure",
      when: (doc) => Boolean(sureBox(doc)) && !hasFeedback(doc),
      target: sureBox,
      title: say.sure.title,
      body: say.sure.body,
      why: say.sure.why,
      done: { click: "[data-sure]" },
    },
    {
      id: "check",
      when: (doc) => !hasFeedback(doc),
      target: SEL.check,
      title: say.check.title,
      body: say.check.body,
      appear: SEL.feedback,
      fallback: say.check.fallback,
    },
    {
      id: "feedback",
      target: SEL.feedback,
      title: (el) => (isRight(el) ? say.feedback.rightTitle : say.feedback.title),
      body: (el) => (isRight(el) ? say.feedback.right : say.feedback.body),
      why: say.feedback.why,
      fallback: say.feedback.fallback,
    },
    {
      id: "retry",
      when: (doc) => hasFeedback(doc) && !isRight(feedback(doc)),
      target: (doc) => doc.querySelector(SEL.retry) || choicesBox(doc),
      title: say.retry.title,
      body: (el) => (el?.matches?.(SEL.retry) ? say.retry.body : say.retry.early),
      done: { click: `${SEL.retry}, [data-early-pick]` },
    },
    {
      id: "end",
      target: null,
      title: say.end.title,
      body: say.end.body,
      primary: say.final,
    },
  ];
}

/** Speaking and writing previews in Part 3 of the teacher tour: the controls that make each skill different. */
export const PREVIEW_SEL = {
  speaking: {
    model: ["[data-early-model]", "[data-say]"],
    record: ["[data-rec-start]", "[data-early-done]"],
  },
  writing: {
    box: ["textarea[data-note]", "textarea", "[data-early-print]"],
    check: ["[data-check-writing]", "[data-early-done]"],
  },
};
