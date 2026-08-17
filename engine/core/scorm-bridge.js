/**
 * scorm-bridge.js — connect an engine lesson to the shared Canvas/SCORM bridge.
 *
 * THE GAP THIS CLOSES. An engine lesson already reports its SCORE to Canvas:
 * app.js fires once when every phase reaches "completed" → grade-emit.js
 * completeLesson() → canvas-code.js showCanvasCode() → assets/canvas-code-ui.js,
 * which posts {source:"neft-lesson", type:"score", percent} to the SCORM
 * wrapper. That path is instructionally correct and is NOT touched here.
 *
 * What an engine lesson never had is the other half of the protocol — the
 * `ready` handshake and the `state`/`location` relay that assets/canvas-bridge.js
 * provides. Without them the SCORM Runtime v2 wrapper never receives a
 * handshake (it falls back to its degraded reveal) and, more importantly,
 * NOTHING is ever written to cmi.suspend_data or cmi.core.lesson_location — so
 * a student who closes a Canvas assignment half-way through and comes back
 * starts over, on any device, with no warning.
 *
 * Standalone activities and homework pages got the bridge from a build-time
 * injector (tools/inject-canvas-bridge.js), whose target list is the activity
 * catalog plus every lessons/<id>/homework.html. Engine lesson index.html files
 * were never in that list. Rather than add ~289 more injection targets — a
 * second list to keep in step with the curriculum forever — the bridge is
 * loaded HERE, from the shared boot every engine lesson already passes through.
 * Every current and future engine lesson inherits it with no per-lesson change.
 *
 * DIVISION OF LABOUR (deliberate — there is no second scoring system):
 *   engine  → score + completion   (its own phase-completion contract)
 *   bridge  → ready, state, location, height, heartbeat  (resume + handshake)
 *   wrapper → SCORM 1.2 translation
 */

const BRIDGE_SRC = "/assets/canvas-bridge.js";

/**
 * True when this page was launched inside a SCORM package.
 *
 * Deliberately the same test canvas-bridge.js itself uses. Two spellings of
 * "are we in SCORM?" that can disagree is how a lesson ends up half-connected —
 * loading the bridge while the bridge decides it is not in a SCORM launch.
 */
export function isScormLaunch() {
  try {
    return /(?:^|[?&])lms=scorm(?:&|$)/.test(window.location.search);
  } catch {
    return false;
  }
}

/**
 * Load the shared Canvas bridge, once, only in a SCORM launch.
 *
 * Lazy on purpose: a normal student opening a lesson from the curriculum hub,
 * a teacher previewing it, and every print/export path download nothing extra
 * and run byte-identically to before. LMS code is only ever fetched when an LMS
 * actually launched the page.
 *
 * Never throws. A failure to load the bridge costs resume relay, not the
 * lesson: instruction must not depend on LMS connectivity.
 *
 * @param {{lessonId?: string, title?: string}} config the lesson config
 */
export function ensureCanvasBridge(config) {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") return false;
    if (!isScormLaunch()) return false;
    // Idempotent three ways over, because double-loading would mean two
    // `ready` messages and two state relays for one lesson. The bridge itself
    // also guards (`if (global.NeftCanvasBridge) return`), but a second
    // <script> would still be fetched and parsed.
    if (window.NeftCanvasBridge) return false;
    if (document.querySelector(`script[src="${BRIDGE_SRC}"]`)) return false;

    // MUST be set before the script executes: canvas-bridge.js reads
    // window.NeftCanvasBridgeConfig once, at IIFE time, into its `cfg`.
    window.NeftCanvasBridgeConfig = Object.assign({}, window.NeftCanvasBridgeConfig, {
      activityId: config?.lessonId || "lesson",
      activityTitle: config?.title || config?.lessonId || "Lesson",
      // The engine owns score and completion. `manual` stops the bridge's
      // save/resume auto-watcher from ALSO posting a score — two independent
      // completion sources for one lesson would race, and the bridge's watcher
      // reads percentComplete (how much of the lesson was touched), which is a
      // different quantity from the lesson's percent correct.
      //
      // It also removes a setInterval: the auto-watcher polls every 1.5s and is
      // the timer that hung `npm test` during Runtime v2 development.
      manual: true,
      // The bridge's floating "I'm finished" button posts a hardcoded 100. The
      // engine has a real completion contract, so that button would let a
      // student send a perfect score without doing the lesson.
      finishButton: false,
    });

    const s = document.createElement("script");
    s.src = BRIDGE_SRC;
    s.defer = true;
    s.addEventListener(
      "error",
      () => {
        try {
          console.info(
            "[ewl-engine] Canvas bridge unavailable — the lesson runs normally; SCORM resume relay is off.",
          );
        } catch {
          /* never break the lesson */
        }
      },
      { once: true },
    );
    (document.body || document.head || document.documentElement).appendChild(s);
    return true;
  } catch {
    // A lesson must never fail to render because an LMS integration did.
    return false;
  }
}
