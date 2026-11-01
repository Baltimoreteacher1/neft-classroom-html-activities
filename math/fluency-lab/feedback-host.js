// One feedback surface for every Game Room game and trail round. It turns a phase from feedback-machine.js into the
// same panel the practice screen shows: a large check, "Correct!" or "Not quite. Let's work through it.", the kept
// answer, one short explanation line, and the next step. Games keep their own rules; this only draws the result.
import { feedbackView } from "./feedback-machine.js";
import { paintFeedback } from "./feedback-panel.js";
import { t } from "./i18n.js";
import { announce } from "./speech.js";

const SETTLED = new Set(["correct", "assisted", "revealed", "revised"]);

// Which phase each game event reports. The table is the audit record: tools/fluency-screens.test.mjs checks that
// every Game Room game and every puzzle world has a row, and that a first miss never maps to a phase that
// states the answer. "miss" is a first wrong try (scaffold, no answer); "right" is a correct first try;
// "right-after-miss" is supported work; "revealed" shows the answer only after the learner has tried more than once.
export const GAME_PHASES = Object.freeze({
  trail: { right: "correct", miss: "retry", "right-after-miss": "assisted" },
  match: { right: "correct", miss: "retry" },
  hunt: { right: "correct", miss: "retry" },
  sort: { right: "correct", miss: "retry" },
  mistake: { right: "correct", miss: "retry", "right-after-miss": "assisted" },
  make: { right: "correct", miss: "retry" },
  make24: { right: "correct", miss: "retry", "right-after-miss": "assisted", revealed: "revealed" },
  teamrelay: { right: "correct", miss: "retry", "right-after-miss": "assisted", revealed: "revealed" },
  challenge: { right: "correct", miss: "retry", "right-after-miss": "assisted", revealed: "revealed" },
  family: { right: "correct", miss: "retry" },
  balance: { right: "correct", miss: "retry", "right-after-miss": "assisted" },
  flip: { right: "correct", miss: "retry", "right-after-miss": "assisted" },
  picture: { right: "correct", miss: "retry", "right-after-miss": "assisted" },
  mathworldbuilder: { right: "correct", miss: "retry", "right-after-miss": "assisted" },
  numberpuzzlestudio: { right: "correct", miss: "retry", "right-after-miss": "assisted" },
  fluencyrally: { right: "correct", miss: "retry", "right-after-miss": "assisted" },
  numberquest: { right: "correct", miss: "retry", "right-after-miss": "assisted" },
  arrayarchitect: { right: "correct", miss: "retry", "right-after-miss": "assisted" },
  fractionforge: { right: "correct", miss: "retry", "right-after-miss": "assisted" },
  puzzleworld: { right: "correct", miss: "retry", "right-after-miss": "assisted" },
  strategymatch: { right: "correct", miss: "retry", "right-after-miss": "assisted" },
  targethive: { right: "correct", miss: "retry", "right-after-miss": "assisted" },
  factorfractionpath: { right: "correct", miss: "retry", "right-after-miss": "assisted" },
  ghostsprint: { right: "correct", miss: "retry", "right-after-miss": "assisted" },
});

export function phaseFor(game, event) {
  const phase = GAME_PHASES[game]?.[event];
  if (!phase) throw new Error(`No feedback phase for ${game}:${event}`);
  return phase;
}

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// The shared view, with the game defaults: no hint or worked example unless the game offers one, and a Next
// button (not a timer) once a result is settled.
export function gameFeedbackView(phase, ctx = {}) {
  const { next, ...rest } = ctx;
  const view = feedbackView(phase, { hintAvailable: false, stepsAvailable: false, ...rest });
  if (!view) return null;
  if (next && SETTLED.has(phase)) view.actions = [{ id: "next", label: next }];
  return view;
}

const actionHtml = (action) =>
  `<button type="button" class="${action.id === "try-again" || action.id === "next" ? "primary-action" : "outline-action"}" data-feedback-action="${action.id}"${action.id === "next" ? " data-gm-next" : ""}>${esc(action.label)}</button>`;

// Markup for games that redraw their board with innerHTML. `note` is the game's own one-line message; it stays in
// the `.gm-note` element (tests, read-aloud and the live region all read it) and sits inside the panel.
export function feedbackNoteHtml(note, fb) {
  const view = fb ? gameFeedbackView(fb.phase, fb.ctx) : null;
  const copy = `<p class="gm-note fb-copy" data-fb-copy>${note}</p>`;
  if (!view) return `<p class="gm-note">${note}</p>`;
  const rows = view.lines
    .map(
      (line) =>
        `<div class="fb-answer-row"><dt>${esc(line.label)}</dt><dd>${esc(line.value)}</dd></div>`,
    )
    .join("");
  return `<div class="feedback fb-host" data-fb-host data-phase="${view.phase}" data-tone="${view.tone}">
    <span class="fb-icon" aria-hidden="true">${view.icon}</span>
    <div class="fb-body">
      <div class="fb-live"><strong class="fb-title" data-fb-title>${esc(view.heading)}</strong>${view.badge ? `<p class="fb-badge">${esc(view.badge)}</p>` : ""}${rows ? `<dl class="fb-answers">${rows}</dl>` : ""}</div>
      ${copy}
      ${view.actions.length ? `<div class="fb-actions">${view.actions.map(actionHtml).join("")}</div>` : ""}
    </div></div>`;
}

// The id of the feedback button a click landed on ("try-again", "hint", "worked", "next"), or "".
export const feedbackAction = (event) =>
  event.target.closest?.("[data-feedback-action]")?.dataset.feedbackAction || "";

function build(copy) {
  const root = document.createElement("div");
  root.className = "feedback fb-host";
  root.dataset.fbHost = "";
  root.hidden = true;
  const icon = Object.assign(document.createElement("span"), { className: "fb-icon" });
  icon.setAttribute("aria-hidden", "true");
  const body = Object.assign(document.createElement("div"), { className: "fb-body" });
  const live = Object.assign(document.createElement("div"), { className: "fb-live" });
  const title = Object.assign(document.createElement("strong"), { className: "fb-title" });
  title.dataset.fbTitle = "";
  const badge = Object.assign(document.createElement("p"), { className: "fb-badge", hidden: true });
  const answers = Object.assign(document.createElement("dl"), {
    className: "fb-answers",
    hidden: true,
  });
  live.append(title, badge, answers);
  const actions = Object.assign(document.createElement("div"), {
    className: "fb-actions",
    hidden: true,
  });
  body.append(live);
  copy.replaceWith(root);
  copy.classList.add("fb-copy");
  body.append(copy, actions);
  root.append(icon, body);
  return {
    feedback: root,
    feedbackIcon: icon,
    feedbackBadge: badge,
    feedbackAnswers: answers,
    feedbackActions: actions,
    title,
  };
}

// Wraps an existing message element (a persistent `<p data-feedback>` in the game's own markup) in the panel and
// returns { show(phase, ctx, message), clear(), el }. Calling it again on the same element reuses the panel.
export function mountFeedback(copy, { onAction = () => {} } = {}) {
  const existing = copy.closest("[data-fb-host]");
  const els = existing?._fbEls || build(copy);
  const root = els.feedback;
  root._fbEls = els;
  if (!root._fbBound) {
    root._fbBound = true;
    root.addEventListener("click", (event) => {
      const id = feedbackAction(event);
      if (id) onAction(id);
    });
  }
  return {
    el: root,
    copy,
    show(phase, ctx = {}, message = copy.textContent) {
      const view = gameFeedbackView(phase, ctx);
      if (!view) return null;
      // A message that only repeats the heading ("Correct!" under "Correct!") adds nothing.
      const plain = (text) => String(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      copy.textContent = plain(message) === plain(view.heading) ? "" : message;
      copy.removeAttribute("role");
      copy.removeAttribute("aria-live");
      paintFeedback(els, view);
      els.title.textContent = view.heading;
      root.hidden = false;
      root.dataset.phase = view.phase;
      announce([view.heading, view.badge, message].filter(Boolean).join(". "));
      return view;
    },
    clear() {
      root.hidden = true;
      copy.textContent = "";
    },
  };
}

// Used by mixed-skill surfaces that need the same wording without drawing a panel (a toast, a status line).
export const phaseHeading = (phase, ctx) =>
  gameFeedbackView(phase, ctx)?.heading || t("Add an answer first.");
