// The DOM side of prerequisite rescue: the offer under a missed problem, and a dialog that shows the short
// mini-lesson before the repair practice starts. All state decisions live in rescue.js; this file only draws.
import { t } from "./i18n.js";
import { mountMiniLesson } from "./mini-lesson.js";
import { rescueOfferText } from "./rescue.js";
import { findSkill } from "./tutor-engine.js";
import { mountVisualLesson } from "./visual-lab.js";

const button = (label, attrs = {}, className = "outline-action") => {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = label;
  Object.assign(element.dataset, attrs);
  return element;
};

// Offered under a missed problem when repeated independent misses point at a prerequisite.
export function rescueOfferElement(plan) {
  const offer = document.createElement("div");
  offer.className = "quick-boost-offer rescue-offer";
  const text = document.createElement("p");
  text.textContent = rescueOfferText(plan);
  const actions = document.createElement("div");
  actions.className = "rescue-offer-actions";
  actions.append(
    button(t("Start a short rescue: {skill}", { skill: findSkill(plan.prereq).title }), { rescue: "start" }),
    // The earlier three-problem Quick Boost stays available as the lighter choice.
    button(t("Quick Boost: Practice {skill} for 3 problems", { skill: findSkill(plan.prereq).title }), { quickBoost: plan.prereq }),
    button(t("Not now"), { rescue: "decline" }),
  );
  offer.append(text, actions);
  return offer;
}

export function returnBanner(message) {
  const banner = document.createElement("div");
  banner.className = "rescue-return";
  banner.dataset.rescueReturn = "";
  banner.setAttribute("role", "status");
  banner.textContent = message;
  return banner;
}

// Shows the mini-lesson. onStart runs when the learner chooses repair practice (always available, so nobody is
// held in the lesson); onLeave when they go back to their problem; onEvidence for answers inside the lesson.
export function openRescueDialog(plan, { grade, lang, onStart, onLeave, onEvidence }) {
  const prereq = findSkill(plan.prereq);
  const goal = findSkill(plan.goal);
  const opener = document.activeElement;
  const dialog = document.createElement("dialog");
  dialog.className = "rescue-dialog";
  dialog.setAttribute("aria-labelledby", "rescue-title");
  const title = document.createElement("h2");
  title.id = "rescue-title";
  title.textContent = t("Let's strengthen {skill}", { skill: prereq.title });
  const why = document.createElement("p");
  why.textContent = t("{goal} builds on this idea. Learn it, practice it three times with help, show it once on your own, then come right back to {goal}.", { goal: goal.title });
  const steps = document.createElement("ol");
  steps.className = "rescue-steps";
  steps.setAttribute("aria-label", t("Rescue steps"));
  [t("Learn it"), t("Practice with help"), t("Show it on your own"), t("Back to your problem")].forEach((label, index) => {
    const item = document.createElement("li");
    item.textContent = label;
    if (index === 0) item.setAttribute("aria-current", "step");
    steps.append(item);
  });
  const body = document.createElement("div");
  body.className = "rescue-lesson";
  const actions = document.createElement("div");
  actions.className = "rescue-actions";
  const go = button(t("Start practice"), {}, "primary-action");
  const leave = button(t("Back to my problem"));
  actions.append(go, leave);
  dialog.append(title, why, steps, body, actions);
  document.body.append(dialog);

  let cleanup = null;
  let handled = false;
  const close = (callback) => {
    if (handled) return;
    handled = true;
    cleanup?.();
    dialog.close();
    dialog.remove();
    opener?.focus?.();
    callback();
  };
  const ready = () => { go.focus(); };
  const lesson = mountMiniLesson(body, { skill: prereq, grade, lang, supportLevel: 2, onEvidence, onDone: ready });
  cleanup = () => lesson?.destroy?.();
  // The mini-lesson player may not be installed: fall back to the visual lesson every skill already has.
  if (!body.childElementCount && !body.textContent.trim()) {
    cleanup = mountVisualLesson(body, prereq, { onComplete: ready, onPractice: ready }) || (() => {});
  }
  go.addEventListener("click", () => close(onStart));
  leave.addEventListener("click", () => close(onLeave));
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); close(onLeave); });
  dialog.showModal();
  title.tabIndex = -1;
  title.focus();
  return dialog;
}
