// Auto-tick for the Guided Tour checklist: the live activity runs in a same-origin frame, so the tour listens inside it
// for the real actions each step names and ticks that step. The teacher can still tick and untick by hand; an
// automatic tick only ever turns a step on.
//
// A step's triggers come from the button names it quotes (“Check.”, “Hear it again”, “Hear: sun”), matched against the
// visible text or accessible name of the control that was pressed. Quotes that are not controls (“I see ___.”) never
// match anything, so they are harmless. Steps whose action names no button, or names one ambiguously, get an explicit
// trigger in STEP_TRIGGERS. Steps with no detectable action (looking at a page, speaking aloud) stay manual.
import { BASE } from "../util.js";

/** Explicit triggers by `${pick}:${domain}` and step index: a CSS selector to click, or `typing` in a text box. */
// Steps that point at an icon button ("the speaker button on a picture choice", "beside “I see ___.”") match the
// button's accessible name, since the icon has no visible text.
const CHOICE_SPEAKER = { click: "[aria-label^='Hear: ']" };
const STARTER_SPEAKER = { click: "[aria-label='Hear the sentence starter']" };
export const STEP_TRIGGERS = {
  "K:listening": { 2: CHOICE_SPEAKER },
  "2-3:listening": { 2: CHOICE_SPEAKER },
  "K:speaking": { 1: STARTER_SPEAKER },
  "1:speaking": { 1: STARTER_SPEAKER },
  "2-3:speaking": { 1: STARTER_SPEAKER },
  "1:writing": { 0: STARTER_SPEAKER },
  "2-3:writing": { 0: STARTER_SPEAKER },
  "1:reading": { 0: { click: ".early-sentence" }, 1: { click: ".early-pick" } },
  "2-3:reading": { 0: { click: ".early-sentence" }, 1: { click: ".early-pick" } },
  "K:reading": { 1: { click: ".early-pick" } },
  "4-5:writing": { 1: { typing: true } },
  "6-8:writing": { 1: { typing: true } },
};

const QUOTE = /“([^”]+)”/g;

/** Lower case, curly quotes straightened, trailing punctuation and pictographs dropped, spaces collapsed. */
export const normLabel = (s) =>
  String(s || "")
    .replace(/[^\p{L}\p{N}\s:,'’_-]/gu, "")
    .replace(/’/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\s.,;:!?]+$/, "")
    .toLowerCase();

/** The control names a step quotes. “Hear: sun” means any one-choice read-aloud button, so it becomes a prefix. */
export function stepLabels(step) {
  return [...String(step).matchAll(QUOTE)].map((m) => {
    const label = normLabel(m[1]);
    return /^hear: /.test(label) ? { prefix: "hear: " } : { exact: label };
  });
}

/** Every step's triggers for one tour activity. */
export function stepTriggers(a) {
  const extra = STEP_TRIGGERS[`${a.pick}:${a.domain.id}`] || {};
  return a.steps.map((s, i) => ({ labels: stepLabels(s), ...(extra[i] || {}) }));
}

const controlNames = (el) =>
  [el.textContent, el.getAttribute("aria-label")].map(normLabel).filter(Boolean);

// A disclosure's summary carries a count after its name ("Word help · 2 words"), so a summary matches by its start.
const labelHit = (names, labels, isSummary) =>
  labels.some((l) =>
    names.some((n) =>
      l.prefix
        ? n.startsWith(l.prefix)
        : n === l.exact || (isSummary && n.startsWith(`${l.exact} `)),
    ),
  );

/** Step indexes a click on `target` completes (pure, so a test can drive it with any element). */
export function stepsForClick(triggers, target) {
  const control = target.closest?.("button, summary, a, [role=button]");
  const names = control ? controlNames(control) : [];
  const isSummary = control?.tagName === "SUMMARY";
  return triggers.flatMap((t, i) =>
    (control && labelHit(names, t.labels, isSummary)) || (t.click && target.closest?.(t.click))
      ? [i]
      : [],
  );
}

/** Step indexes typing in `target` completes. */
export const stepsForTyping = (triggers, target) =>
  target.matches?.("textarea, input[type=text]")
    ? triggers.flatMap((t, i) => (t.typing ? [i] : []))
    : [];

/** True when the frame still shows the tour's activity (the teacher may have pressed Next inside it). */
export function onActivity(frameWin, a) {
  const want = new URL(`${BASE}${a.route}`, "https://x");
  const loc = frameWin.location;
  if (loc.pathname !== want.pathname) return false;
  const item = want.searchParams.get("item");
  return !item || new URLSearchParams(loc.search).get("item") === item;
}

/**
 * Listen inside `frame` for the activity's real actions and call `tick(index)` for each step they complete. The
 * listeners attach on every load (the first load, "Start over", and any full navigation inside the frame).
 */
export function watchFrame(frame, a, tick) {
  const triggers = stepTriggers(a);
  const fire = (steps) => {
    if (onActivity(frame.contentWindow, a)) for (const i of steps) tick(i);
  };
  const attach = () => {
    let doc;
    try {
      doc = frame.contentDocument;
    } catch {
      return; // not same-origin: nothing to watch, ticking stays manual
    }
    if (!doc || doc.__trWatched) return;
    doc.__trWatched = true;
    doc.addEventListener("click", (e) => fire(stepsForClick(triggers, e.target)), true);
    doc.addEventListener("input", (e) => fire(stepsForTyping(triggers, e.target)), true);
  };
  frame.addEventListener("load", attach);
}
