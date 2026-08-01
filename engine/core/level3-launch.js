// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/*!
 * level3-launch.js — the ONLY change Level 3 makes to an existing lesson.
 *
 * Mounts a teacher-facing "Level 3 · Adaptive Small Group" launch link into the
 * Launch phase, and only when BOTH are true:
 *   1. Teacher Mode is on (students never see it), and
 *   2. data/level3-adaptive.json actually has a validated configuration for
 *      this lesson id — an unsupported lesson is never advertised as adaptive.
 *
 * Everything is additive, async, and swallowed on failure: the lesson renders
 * identically whether or not this file does anything. It changes no lesson
 * state, no save/resume key, and no phase behaviour.
 */
import { isTeacherMode } from "./teacher-mode.js";

let cachedIds = null;

async function level3LessonIds() {
  if (cachedIds) return cachedIds;
  try {
    const res = await fetch("/data/level3-adaptive.json", { cache: "force-cache" });
    if (!res.ok) throw new Error(String(res.status));
    const doc = await res.json();
    cachedIds = new Set(Object.keys((doc && doc.lessons) || {}));
  } catch {
    cachedIds = new Set();
  }
  return cachedIds;
}

/**
 * @param {HTMLElement} host  Launch-phase container to append into.
 * @param {object} config     The lesson config (needs `lessonId`).
 */
export function mountLevel3Launch(host, config) {
  try {
    if (!host || !config || !config.lessonId) return;
    if (!isTeacherMode()) return;

    level3LessonIds()
      .then((ids) => {
        if (!ids.has(config.lessonId)) return; // no validated config — no link
        if (host.querySelector(".level3-launch")) return; // idempotent

        const card = document.createElement("div");
        card.className = "card level3-launch no-print";
        card.style.borderLeft = "6px solid var(--teal, #0f6d7a)";

        const h = document.createElement("h4");
        h.textContent = "Level 3 · Adaptive Small Group";
        h.style.margin = "0 0 .35rem";

        const p = document.createElement("p");
        p.style.margin = "0 0 .6rem";
        p.textContent =
          "Optional. Opens a separate adaptive workspace for this lesson's target — the lesson here is unchanged.";

        const a = document.createElement("a");
        a.className = "btn btn-secondary btn-sm";
        a.href = `/small-group-level-3/?lesson=${encodeURIComponent(config.lessonId)}`;
        a.textContent = "Open adaptive small group →";
        a.setAttribute(
          "aria-label",
          `Open the Level 3 adaptive small group workspace for lesson ${config.lessonId}`,
        );

        card.append(h, p, a);
        host.append(card);
      })
      .catch(() => {
        /* additive — never block the Launch phase */
      });
  } catch {
    /* additive — never throw into the lesson renderer */
  }
}

export default mountLevel3Launch;
