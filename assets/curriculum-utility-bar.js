/**
 * curriculum-utility-bar.js — Runtime controller for 38px in-tool utility bar.
 *
 * Mounts into sub-tools (/curriculum/learning-labs/*, /curriculum/math-canvas/,
 * /curriculum/extra-help/, /curriculum/notes-studio/) with:
 * - 1-click return to exact Hub unit and lesson drawer (#lesson-X-Y).
 * - Tool & lesson breadcrumb.
 * - Mini-utility segment synchronized with CurriculumShell (Language, Role, Supports).
 */

(function () {
  "use strict";

  function parseParams() {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    let lesson = params.get("lesson") || "";
    if (!lesson && hash.startsWith("#lesson-")) {
      lesson = hash.replace("#lesson-", "");
    }
    let unit = params.get("unit") || "";
    if (!unit && hash.startsWith("#unit-")) {
      unit = hash.replace("#unit-", "");
    }
    if (!unit && lesson) {
      const m = lesson.match(/^(\d+)-/);
      if (m) unit = m[1];
    }
    return { lesson: lesson, unit: unit };
  }

  function mountBar() {
    const bar = document.querySelector(".curriculum-in-tool-bar");
    if (!bar) return;

    const detected = parseParams();
    const lesson = bar.getAttribute("data-lesson") || detected.lesson || "";
    const unit = bar.getAttribute("data-unit") || detected.unit || "";
    const toolName = bar.getAttribute("data-tool") || document.title || "Tool";
    const subTitle = bar.getAttribute("data-title") || "";

    // 1-Click return target
    let returnUrl = "/curriculum/";
    if (lesson) {
      returnUrl = `/curriculum/#lesson-${lesson}`;
    } else if (unit) {
      returnUrl = `/curriculum/#unit-${unit}`;
    }

    const lang = window.CurriculumShell ? window.CurriculumShell.getLanguage() : "en";
    const isTeacher = window.CurriculumShell ? window.CurriculumShell.isTeacher() : false;
    const isSupports = window.CurriculumShell ? window.CurriculumShell.getSupports() : false;

    // Breadcrumb text
    let crumbHtml = "";
    if (unit) {
      crumbHtml += `<span class="in-tool-sep">/</span> <span>Unit ${unit}</span>`;
    }
    if (lesson) {
      crumbHtml += `<span class="in-tool-sep">/</span> <span>Lesson ${lesson}</span>`;
    }

    const displayTitle = subTitle ? `${toolName}: ${subTitle}` : toolName;

    bar.innerHTML = `
      <div class="in-tool-bar-inner">
        <div class="in-tool-left">
          <a href="${returnUrl}" class="in-tool-hub-btn" aria-label="Return to Curriculum Hub">
            <span aria-hidden="true">◂</span> Hub
          </a>
          <div class="in-tool-crumb-trail" aria-label="Breadcrumb">
            ${crumbHtml}
          </div>
        </div>

        <div class="in-tool-center" title="${displayTitle}">
          ${displayTitle}
        </div>

        <div class="in-tool-right">
          <div class="mini-segment" role="group" aria-label="Language">
            <button type="button" class="mini-segment-btn" data-mini-lang="en" aria-pressed="${
              lang === "en" ? "true" : "false"
            }">EN</button>
            <button type="button" class="mini-segment-btn" data-mini-lang="es" aria-pressed="${
              lang === "es" ? "true" : "false"
            }">ES</button>
          </div>
          <div class="mini-segment" role="group" aria-label="Role">
            <button type="button" class="mini-segment-btn" data-mini-role="student" aria-pressed="${
              !isTeacher ? "true" : "false"
            }" title="Student Mode">S</button>
            <button type="button" class="mini-segment-btn" data-mini-role="teacher" aria-pressed="${
              isTeacher ? "true" : "false"
            }" title="Teacher Mode">T</button>
          </div>
          <button type="button" class="mini-pill-btn" data-mini-supports aria-pressed="${
            isSupports ? "true" : "false"
          }" title="Toggle Supports">
            <span aria-hidden="true">💬</span>
          </button>
        </div>
      </div>
    `;

    document.body.classList.add("has-in-tool-bar");
    bindEvents(bar);
  }

  function bindEvents(bar) {
    const langBtns = bar.querySelectorAll("[data-mini-lang]");
    for (let i = 0; i < langBtns.length; i++) {
      langBtns[i].addEventListener("click", () => {
        const l = langBtns[i].getAttribute("data-mini-lang");
        if (window.CurriculumShell) {
          window.CurriculumShell.setLanguage(l);
        }
      });
    }

    const roleBtns = bar.querySelectorAll("[data-mini-role]");
    for (let j = 0; j < roleBtns.length; j++) {
      roleBtns[j].addEventListener("click", () => {
        const r = roleBtns[j].getAttribute("data-mini-role");
        if (window.CurriculumShell) {
          window.CurriculumShell.setRole(r);
        }
      });
    }

    const suppBtn = bar.querySelector("[data-mini-supports]");
    if (suppBtn) {
      suppBtn.addEventListener("click", () => {
        if (window.CurriculumShell) {
          window.CurriculumShell.setSupports(!window.CurriculumShell.getSupports());
        }
      });
    }
  }

  function syncState() {
    const bar = document.querySelector(".curriculum-in-tool-bar");
    if (!bar || !window.CurriculumShell) return;

    const lang = window.CurriculumShell.getLanguage();
    const isTeacher = window.CurriculumShell.isTeacher();
    const isSupports = window.CurriculumShell.getSupports();

    const langBtns = bar.querySelectorAll("[data-mini-lang]");
    for (let i = 0; i < langBtns.length; i++) {
      langBtns[i].setAttribute(
        "aria-pressed",
        langBtns[i].getAttribute("data-mini-lang") === lang ? "true" : "false",
      );
    }

    const roleBtns = bar.querySelectorAll("[data-mini-role]");
    for (let j = 0; j < roleBtns.length; j++) {
      const isT = roleBtns[j].getAttribute("data-mini-role") === "teacher";
      roleBtns[j].setAttribute("aria-pressed", isT === isTeacher ? "true" : "false");
    }

    const suppBtn = bar.querySelector("[data-mini-supports]");
    if (suppBtn) {
      suppBtn.setAttribute("aria-pressed", isSupports ? "true" : "false");
    }
  }

  window.addEventListener("curriculum:state-change", syncState);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountBar);
  } else {
    mountBar();
  }
})();
