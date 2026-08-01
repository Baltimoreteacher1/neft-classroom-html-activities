// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
//
// The existing controls are ADOPTED — their live DOM nodes are moved into the
// dropdown — rather than reimplemented, so every behavior keeps its single
// canonical implementation. Adoption re-runs on every open (and on two late
// passes) because the mode pill and shared widgets can (re)mount after us.
// Save/Resume also lives here (per Joel 2026-07-14): the menu item drives the
// hidden #nsr-launcher, whose panel still opens in its usual spot.

import { applyPlainLanguage, isPlainLanguageOn, setPlainLanguage } from "./plain-language.js";
import { isTeacherMode } from "./teacher-mode.js";

export function mountUtilityMenu() {
  if (document.querySelector(".nt-utility-menu")) return;
  document.body.classList.add("has-nt-utility-menu");

  const root = document.createElement("div");
  root.className = "nt-utility-menu";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nt-utility-btn";
  btn.setAttribute("aria-haspopup", "true");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-label", "Lesson tools menu");
  btn.innerHTML =
    '<span aria-hidden="true">🧰</span><span>Tools</span>' +
    '<span class="nt-utility-caret" aria-hidden="true">▾</span>';

  const pop = document.createElement("div");
  pop.className = "nt-utility-pop";
  pop.hidden = true;
  pop.innerHTML =
    '<div class="nt-utility-section" data-slot="actions"></div>' +
    '<div class="nt-utility-section" data-slot="export"></div>' +
    '<div class="nt-utility-section" data-slot="mode"></div>';

  const actions = pop.querySelector('[data-slot="actions"]');

  // Clear answers (teacher-only) — wipes THIS lesson's saved answers/progress on
  // this device and reloads it blank, so a teacher can project a fresh copy
  // without last period's (or their own demo) responses showing. Gated to
  // teacher mode so students can never erase their own work from here.
  const clearAnswers = document.createElement("button");
  clearAnswers.type = "button";
  clearAnswers.className = "nt-utility-item nt-utility-item-danger";
  clearAnswers.innerHTML = '<span aria-hidden="true">🧹</span><span>Clear all answers</span>';
  clearAnswers.addEventListener("click", () => {
    if (
      !window.confirm(
        "Clear the answers on this lesson and reload it fresh? This only affects this device.",
      )
    )
      return;
    if (typeof window.__ntClearLessonAnswers === "function") {
      window.__ntClearLessonAnswers();
    } else {
      // Fallback for pages without the lesson-engine hook: at least drop the
      // Save/Resume pointer so auto-restore can't re-fill fields, then reload.
      try {
        window.NeftSaveResume?.reset?.();
      } catch (_) {
        /* save/resume not present */
      }
      window.location.reload();
    }
    close();
  });
  actions.appendChild(clearAnswers);

  // Plain words — the same problems at a lower reading level. A student choice,
  // not a teacher one: reading level is an access need and the student is the
  // one who knows whether they can read the sentence. The numbers never change
  // (see plain-language.js, which verifies that before showing a rewrite).
  const plainWords = document.createElement("button");
  plainWords.type = "button";
  plainWords.className = "nt-utility-item";
  const paintPlain = () => {
    plainWords.innerHTML = `<span aria-hidden="true">🔤</span><span>Plain words${
      isPlainLanguageOn() ? " ✓" : ""
    }</span>`;
    plainWords.setAttribute("aria-pressed", isPlainLanguageOn() ? "true" : "false");
  };
  paintPlain();
  plainWords.addEventListener("click", () => {
    const next = !isPlainLanguageOn();
    setPlainLanguage(next);
    paintPlain();
    // The lesson re-applies on every phase render (see app.js renderPhase); this
    // covers the phase already on screen.
    applyPlainLanguage(document, next, window.__ntProtectedTerms || []);
    close();
  });
  actions.appendChild(plainWords);

  // Save / Resume — drives the save-resume engine's launcher (hidden by the
  // menu's CSS on lesson pages); its panel opens in its usual corner.
  const saveResume = document.createElement("button");
  saveResume.type = "button";
  saveResume.className = "nt-utility-item";
  saveResume.innerHTML = '<span aria-hidden="true">💾</span><span>Save / Resume</span>';
  saveResume.addEventListener("click", () => {
    const launcher = document.getElementById("nsr-launcher");
    if (launcher) launcher.click();
    close();
  });
  actions.appendChild(saveResume);

  // Math Workbench — resolves to the lesson-aware launcher's deep link when
  // that shared script is on the page (its FAB is hidden by the menu's CSS).
  const workbench = document.createElement("a");
  workbench.className = "nt-utility-item";
  workbench.target = "_blank";
  workbench.rel = "noopener";
  workbench.href = "/curriculum/math-workbench/";
  workbench.innerHTML = '<span aria-hidden="true">✱</span><span>Math Workbench</span>';
  workbench.addEventListener("click", () => {
    const fab = document.getElementById("mwb-launcher");
    if (fab && fab.href) workbench.href = fab.href;
    close();
  });
  actions.appendChild(workbench);

  // Learning-supports dock (reading & focus tools) — shown only when the
  // supports script mounted its dock on this page.
  const supports = document.createElement("button");
  supports.type = "button";
  supports.className = "nt-utility-item";
  supports.innerHTML = '<span aria-hidden="true">🛠️</span><span>Reading &amp; focus tools</span>';
  supports.addEventListener("click", () => {
    const dock = document.querySelector(".ewl-supports-tools-dock");
    if (!dock) return;
    const reopen = dock.querySelector(".ewl-supports-dock-reopen");
    const collapse = dock.querySelector(".ewl-supports-dock-collapse");
    if (dock.classList.contains("is-collapsed")) {
      if (reopen) reopen.click();
    } else if (collapse) {
      collapse.click();
    }
    close();
  });
  actions.appendChild(supports);

  function adopt() {
    const exportBar = document.querySelector(".export-toolbar");
    const exportSlot = pop.querySelector('[data-slot="export"]');
    if (exportBar && exportBar.parentElement !== exportSlot) exportSlot.appendChild(exportBar);
    const pill = document.querySelector(".mode-toggle-pill");
    const modeSlot = pop.querySelector('[data-slot="mode"]');
    if (pill && pill.parentElement !== modeSlot) modeSlot.appendChild(pill);
    supports.style.display = document.querySelector(".ewl-supports-tools-dock") ? "" : "none";
    saveResume.style.display = document.getElementById("nsr-launcher") ? "" : "none";
    // Clear answers is a teacher affordance only — never expose it to students.
    clearAnswers.style.display = isTeacherMode() ? "" : "none";
  }

  function open() {
    adopt();
    pop.hidden = false;
    btn.setAttribute("aria-expanded", "true");
  }
  function close() {
    pop.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  }
  btn.addEventListener("click", () => (pop.hidden ? open() : close()));
  document.addEventListener("click", (e) => {
    if (!root.contains(e.target)) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !pop.hidden) {
      close();
      btn.focus();
    }
  });

  root.append(btn, pop);
  document.body.appendChild(root);

  // Late adoption passes for controls that mount after the app boots
  // (teacher-mode pill re-renders, shared widget scripts load deferred).
  setTimeout(adopt, 1200);
  setTimeout(adopt, 3500);
}
