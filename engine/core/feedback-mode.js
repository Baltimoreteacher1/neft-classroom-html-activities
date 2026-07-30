// feedback-mode.js — immediate vs delayed feedback on a fixed practice set.
//
// Immediate feedback is better for building a procedure; delayed feedback is
// better for retaining one. Both are true, and which one a teacher wants depends
// on whether today is the day the skill is introduced or the day it is
// consolidated. Until now the engine only ever did the first, so the choice was
// not available to make.
//
// SCOPE, deliberately narrow: this applies ONLY to the fixed "Practice the
// skill" set, never to the adaptive sequence. The adaptive engine picks the next
// item FROM the outcome of the current one — withholding that outcome would not
// delay its feedback, it would break its selection. A setting that silently
// degrades adaptivity is worse than no setting.
//
// The choice is a teacher decision stored per device, not a student preference:
// a student who can turn off delayed feedback will, every time, because
// immediate feedback feels better while it teaches less.

const STORAGE_KEY = "nt-feedback-mode";
export const MODES = { immediate: "immediate", delayed: "delayed" };

/**
 * The active mode.
 * A per-device teacher setting wins; otherwise the lesson's own
 * `practice.feedbackMode`; otherwise immediate.
 */
export function getFeedbackMode(config) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && MODES[stored]) return stored;
  } catch {
    /* blocked storage falls through to the authored default */
  }
  const authored = config?.practice?.feedbackMode;
  return MODES[authored] || MODES.immediate;
}

export function setFeedbackMode(mode) {
  if (!MODES[mode]) return false;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
    return true;
  } catch {
    return false;
  }
}

/**
 * Teacher-only control. Mounted by the caller behind an isTeacherMode() check —
 * this module does not gate itself, so the decision about who sees it stays in
 * one place in the renderer.
 */
export function mountFeedbackModeToggle(host, config, onChange) {
  if (!host) return null;
  const current = getFeedbackMode(config);

  const wrap = document.createElement("div");
  wrap.className = "feedback-mode-toggle no-print";
  wrap.style.cssText =
    "display:flex; gap:var(--sp-2); align-items:center; flex-wrap:wrap; margin:0 0 var(--sp-3); font-size:0.85rem;";

  const label = document.createElement("span");
  label.style.fontWeight = "700";
  label.textContent = "Feedback (teacher):";
  wrap.append(label);

  const group = document.createElement("div");
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-label", "When students see whether they were right");
  group.style.cssText = "display:flex; gap:var(--sp-2);";

  for (const [mode, text, hint] of [
    [MODES.immediate, "Right away", "Each problem is marked as soon as it is checked."],
    [MODES.delayed, "After the set", "All three are marked together, once every answer is in."],
  ]) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-sm";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", current === mode ? "true" : "false");
    btn.title = hint;
    btn.textContent = text;
    if (current === mode) btn.classList.add("btn-primary");
    btn.addEventListener("click", () => {
      if (!setFeedbackMode(mode)) return;
      group.querySelectorAll("button").forEach((b) => {
        b.setAttribute("aria-checked", b === btn ? "true" : "false");
        b.classList.toggle("btn-primary", b === btn);
      });
      onChange?.(mode);
    });
    group.append(btn);
  }

  wrap.append(group);
  host.append(wrap);
  return wrap;
}

export default getFeedbackMode;
