// teacher-clear.js — a teacher-only, always-visible floating "Clear answers"
// button. Mounted from BOTH lesson renderers (createApp Reveal lessons and the
// small-group / catch-up studios) so every curriculum lesson gets the same
// control. It only renders in teacher mode; a student never sees it and can
// never erase work from here.
//
// Clicking it runs the page's clearFn — which wipes THIS device's saved answers
// for the current lesson and reloads it blank — so a teacher can project a
// fresh copy without last period's (or their own demo) responses showing.
//
// Placement follows the lesson "dock contract": bottom-LEFT, stacked just above
// the minimap HUD (bottom:16). On pages with no minimap it simply floats in the
// otherwise-empty lower-left corner, clear of the next-phase button (bottom-
// right) and the Tools menu (top-right).
//
// Teacher-mode detection is inlined (not imported from teacher-mode.js) so this
// shared module stays dependency-light: teacher-mode.js pulls in the whole
// lesson-renderer/app graph, which would drag app.js's Vite-only aliases into
// the small-group renderer's module graph and break its node-run test. The key
// `nt-teacher-mode` is the documented single source of truth (see
// teacher-mode.js / assets/curriculum-enhancements.js); this only reads it.
const CONFIRM_MSG =
  "Clear the answers on this lesson and reload it fresh? This only affects this device.";

function isTeacherMode() {
  try {
    const params = new URLSearchParams(window.location.search);
    // Force-student wins, mirroring teacher-mode.js.
    if (params.get("teacher") === "0" || params.get("student") === "1") return false;
    return localStorage.getItem("nt-teacher-mode") === "1";
  } catch (_) {
    return false;
  }
}

export function mountTeacherClearButton(clearFn) {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  if (!isTeacherMode()) return null;
  if (document.querySelector(".nt-teacher-clear")) return null;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nt-teacher-clear";
  btn.title = "Clear the answers on this page and reload it fresh (teacher only)";
  btn.setAttribute("aria-label", "Clear answers on this lesson (teacher only)");
  btn.innerHTML = '<span aria-hidden="true">🧹</span><span>Clear answers</span>';
  btn.addEventListener("click", () => {
    if (!window.confirm(CONFIRM_MSG)) return;
    try {
      if (typeof clearFn === "function") clearFn();
      else window.location.reload();
    } catch (_) {
      // Whatever failed, a reload still drops the on-screen answers.
      window.location.reload();
    }
  });
  document.body.appendChild(btn);
  return btn;
}
