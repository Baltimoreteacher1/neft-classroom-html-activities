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
          // Information only: opening the box must not move the guide on, or the tips scroll away unread.
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
      // After a second choice: check again and see what success looks like. Ends the loop on a right answer.
      id: "again",
      when: (doc) => !isRight(feedback(doc)) && has(SEL.check.join(", "))(doc),
      target: SEL.check,
      title: say.again.title,
      body: say.again.body,
      appear: ".feedback.is-right, .early-feedback.is-right",
      fallback: say.again.fallback,
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

/**
 * A speaking turn: hear the question, plan with the starters, say it (record or aloud), check it against the list.
 * Lab shell: [data-rec-start], [data-selfcheck], [data-save-speaking]. K–3 shell: [data-early-model], [data-early-done].
 */
export function speakSteps(say) {
  const checklist = (doc) => doc.querySelector("[data-selfcheck]")?.closest("fieldset, ul, ol, div") || null;
  return [
    { id: "intro", target: null, title: say.intro.title, body: say.intro.body, why: say.intro.why },
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
      id: "question",
      target: [".response-workspace [data-say]", "[data-early-model]", ".directions"],
      title: say.question.title,
      body: say.question.body,
      done: { click: ".response-workspace [data-say], [data-early-model], .directions [data-say]" },
      fallback: say.question.fallback,
    },
    {
      id: "starters",
      when: (doc) => [...doc.querySelectorAll("details > summary")].some((s) => /starter|inicio/i.test(s.textContent) && shown(s)),
      target: (doc) => [...doc.querySelectorAll("details > summary")].find((s) => /starter|inicio/i.test(s.textContent)) || null,
      title: say.starters.title,
      body: say.starters.body,
    },
    {
      id: "say",
      target: ["[data-rec-start]", "[data-early-done]"],
      title: say.say.title,
      body: say.say.body,
      why: say.say.why,
      done: { click: "[data-rec-start], [data-early-done]" },
      fallback: say.say.fallback,
    },
    {
      id: "check",
      when: (doc) => Boolean(checklist(doc)),
      target: checklist,
      title: say.check.title,
      body: say.check.body,
      done: { click: "[data-selfcheck]" },
    },
    { id: "end", target: null, title: say.end.title, body: say.end.body, primary: say.final },
  ];
}

/**
 * A writing turn: plan with the starters, write, check, read the feedback, revise and check again.
 * Lab shell: textarea[data-note], [data-check-writing], .feedback. K–3 shell: starter speaker, [data-early-print],
 * [data-early-done].
 */
export function writeSteps(say) {
  const box = (doc) => doc.querySelector(".response-workspace textarea[data-note], textarea[data-note]");
  return [
    { id: "intro", target: null, title: say.intro.title, body: say.intro.body, why: say.intro.why },
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
      target: [".directions", "[data-early-say-text]"],
      title: say.directions.title,
      body: say.directions.body,
      done: { click: ".directions [data-say], [data-early-say-text]" },
      fallback: say.directions.fallback,
    },
    {
      id: "write",
      when: (doc) => Boolean(box(doc)),
      target: box,
      title: say.write.title,
      body: say.write.body,
      done: { input: "textarea[data-note]" },
      fallback: say.write.fallback,
    },
    {
      id: "check",
      when: has("[data-check-writing]"),
      target: "[data-check-writing]",
      title: say.check.title,
      body: say.check.body,
      appear: ".response-workspace .feedback, .feedback",
      fallback: say.check.fallback,
    },
    {
      id: "feedback",
      when: (doc) => hasFeedback(doc),
      target: SEL.feedback,
      title: say.feedback.title,
      body: say.feedback.body,
      why: say.feedback.why,
    },
    {
      id: "revise",
      when: (doc) => Boolean(box(doc)) && hasFeedback(doc),
      target: box,
      title: say.revise.title,
      body: say.revise.body,
      done: { click: "[data-check-writing]" },
      fallback: say.revise.fallback,
    },
    {
      id: "paper",
      when: has("[data-early-done]"),
      target: ["[data-early-print]", "[data-early-done]"],
      title: say.paper.title,
      body: say.paper.body,
      done: { click: "[data-early-done]" },
      fallback: say.paper.fallback,
    },
    { id: "end", target: null, title: say.end.title, body: say.end.body, primary: say.final },
  ];
}

/** The steps for an activity's skill. */
export const stepsFor = (skill, say) =>
  skill === "speaking" ? speakSteps(say.speaking) : skill === "writing" ? writeSteps(say.writing) : loopSteps(say.loop);
