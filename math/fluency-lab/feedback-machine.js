// One feedback state machine for answer checking. Every practice mode sends events here and renders the view
// it returns, so "right", "not quite" and "right with help" look and read the same everywhere.
import { t } from "./i18n.js";

export const FEEDBACK_PHASES = Object.freeze(["idle", "empty", "retry", "correct", "assisted", "revealed", "revised"]);

const OPEN = { empty: "empty", right: "correct", wrong: "retry", "wrong-final": "revealed" };
const TRANSITIONS = {
  idle: OPEN,
  empty: OPEN,
  // A second try that lands is supported work, never an independent check.
  // "wrong-again" is a supported problem: each miss opens the next step and the learner keeps trying.
  retry: { empty: "retry", right: "assisted", wrong: "revealed", "wrong-again": "retry", "wrong-final": "revealed" },
  revealed: { "revise-right": "revised", "revise-wrong": "revealed" },
  correct: {},
  assisted: {},
  revised: {},
};

// Returns { phase, accepted }. A terminal phase ignores further submissions, which is what stops a double click
// from counting an answer twice. "reset" is always accepted and starts the next problem.
export function nextPhase(phase, event, { independent = true } = {}) {
  if (event === "reset") return { phase: "idle", accepted: true };
  const target = TRANSITIONS[phase]?.[event];
  if (!target) return { phase, accepted: false };
  if (target === "correct" && !independent) return { phase: "assisted", accepted: true };
  return { phase: target, accepted: true };
}

const ICONS = {
  check: '<svg viewBox="0 0 48 48" focusable="false"><circle cx="24" cy="24" r="22" fill="currentColor"/><path d="M14 25.5l7 7L34.5 17" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  think:
    '<svg viewBox="0 0 48 48" focusable="false"><circle cx="24" cy="24" r="22" fill="currentColor"/><path d="M24 12v15" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="35" r="3" fill="#fff"/></svg>',
  info: '<svg viewBox="0 0 48 48" focusable="false"><circle cx="24" cy="24" r="22" fill="currentColor"/><circle cx="24" cy="14" r="3" fill="#fff"/><path d="M24 22v15" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>',
};

// `reveal` is false in a checkup, which never shows a solution. `hintAvailable` hides "Show hint" once it is used.
export function feedbackView(phase, { submitted = "", expected = "", reveal = true, hintAvailable = true, stepsAvailable = true } = {}) {
  const yours = submitted ? { label: t("Your answer"), value: submitted } : null;
  const right = reveal && expected ? { label: t("Correct answer"), value: expected } : null;
  const views = {
    correct: { tone: "success", icon: "check", heading: t("Correct!"), badge: t("You got it on your own."), lines: [right] },
    assisted: { tone: "success", icon: "check", heading: t("Correct!"), badge: t("You got it with help. A fresh problem checks it on your own."), lines: [right] },
    retry: {
      tone: "support",
      icon: "think",
      heading: t("Not quite. Let's work through it."),
      lines: [yours],
      actions: [
        { id: "try-again", label: t("Try again") },
        hintAvailable && { id: "hint", label: t("Show hint") },
        stepsAvailable && { id: "worked", label: t("See worked example") },
      ],
    },
    revealed: { tone: "support", icon: "think", heading: t("Not quite. Let's work through it."), lines: [yours, right] },
    revised: { tone: "success", icon: "check", heading: t("Answer revised"), badge: t("A revised answer is a useful step. It does not count as an independent check."), lines: [right] },
    empty: { tone: "neutral", icon: "info", heading: t("Add an answer first."), lines: [] },
  };
  const view = views[phase];
  if (!view) return null;
  const lines = (view.lines || []).filter(Boolean);
  const actions = (view.actions || []).filter(Boolean);
  const announcement = [view.heading, view.badge, ...lines.map((line) => `${line.label}: ${line.value}`)].filter(Boolean).join(". ");
  return { phase, tone: view.tone, icon: ICONS[view.icon], heading: view.heading, badge: view.badge || "", lines, actions, announcement };
}
