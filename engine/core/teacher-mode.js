import {
  PHASE_TIME_ESTIMATES,
  countPracticeProblems,
} from "./content-enrichment.js";
import { t, stackHtml, phaseName } from "./i18n.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

export function isTeacherMode() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("teacher") === "1" || params.get("mode") === "teacher";
}

/** Floating teacher panel with answer keys, pacing, listen-fors, differentiation. */
export function mountTeacherPanel(root, config, state) {
  if (!isTeacherMode()) return null;

  document.documentElement.classList.add("teacher-mode");

  const panel = document.createElement("aside");
  panel.className = "teacher-panel";
  panel.setAttribute("aria-label", "Teacher view");
  panel.innerHTML = `
    <button type="button" class="teacher-panel-toggle" aria-expanded="true" aria-controls="teacher-panel-body">
      👩‍🏫 ${stackHtml(t("teacherView", "en"), t("teacherView", "es"))}
    </button>
    <div id="teacher-panel-body" class="teacher-panel-body">
      <div class="teacher-panel-section teacher-projection">
        <h4>🎥 Project &amp; Pace</h4>
        <div class="teacher-proj-controls">
          <button type="button" class="btn btn-secondary btn-sm teacher-proj-toggle" aria-pressed="false">🔍 Projector view</button>
          <button type="button" class="btn btn-secondary btn-sm teacher-answers-toggle" aria-pressed="true">🙈 Hide answers</button>
        </div>
        <div class="teacher-timer">
          <span class="teacher-timer-display" role="timer" aria-live="polite">00:00</span>
          <button type="button" class="btn btn-secondary btn-sm teacher-timer-start">▶︎ Start</button>
          <button type="button" class="btn btn-secondary btn-sm teacher-timer-reset">↺ Reset</button>
        </div>
      </div>
      <div class="teacher-panel-section" data-bind="discuss"></div>
      <div class="teacher-panel-section">
        <h4>${stackHtml(t("pacingGuide", "en"), t("pacingGuide", "es"))}</h4>
        <ul class="teacher-pacing-list">
          ${PHASE_TIME_ESTIMATES.map(
            (p, i) =>
              `<li><span>${p.icon} ${phaseName(i)}</span><span>~${p.minutes} min</span></li>`,
          ).join("")}
        </ul>
        <p class="teacher-meta">Total: ${esc(config.timeEstimate || "~45 min")} · ${countPracticeProblems(config)} ${t("practiceItems")}</p>
      </div>
      <div class="teacher-panel-section">
        <h4>${stackHtml(t("standardsObjectives", "en"), t("standardsObjectives", "es"))}</h4>
        <p><strong>${esc(config.standard)}</strong></p>
        <p class="teacher-obj">${esc(config.contentObjective || config.objective || "")}</p>
        <p class="teacher-obj">${esc(config.languageObjective || "")}</p>
      </div>
      <div class="teacher-panel-section" data-bind="listen-fors"></div>
      <div class="teacher-panel-section" data-bind="answer-key"></div>
      <div class="teacher-panel-section">
        <h4>${stackHtml(t("differentiationTips", "en"), t("differentiationTips", "es"))}</h4>
        <ul class="teacher-tips">
          <li><strong>Level 1:</strong> Scaffold hints + remediation flow on misses</li>
          <li><strong>Adaptive:</strong> Auto-adjusts tier based on accuracy</li>
          <li><strong>Level 2:</strong> Stretch items + extend stems in Turn & Talk</li>
        </ul>
      </div>
      <button type="button" class="btn btn-secondary btn-sm teacher-print-packet">🖨️ ${stackHtml(t("printPacingSheet", "en"), t("printPacingSheet", "es"))}</button>
    </div>`;

  const toggle = panel.querySelector(".teacher-panel-toggle");
  const body = panel.querySelector(".teacher-panel-body");
  toggle.addEventListener("click", () => {
    const open = body.hidden;
    body.hidden = !open;
    toggle.setAttribute("aria-expanded", String(!open));
    panel.classList.toggle("is-collapsed", open);
  });

  // ── Projection tools ──────────────────────────────────────────────────────
  // Projector view: enlarge the whole lesson for whole-class display.
  const projBtn = panel.querySelector(".teacher-proj-toggle");
  projBtn?.addEventListener("click", () => {
    const on = document.documentElement.classList.toggle("projector");
    projBtn.setAttribute("aria-pressed", String(on));
    projBtn.textContent = on ? "🔍 Exit projector" : "🔍 Projector view";
  });

  // Hide/show the teacher answer key on screen (for projecting without spoilers).
  const ansBtn = panel.querySelector(".teacher-answers-toggle");
  ansBtn?.addEventListener("click", () => {
    const hidden = panel.classList.toggle("answers-hidden");
    ansBtn.setAttribute("aria-pressed", String(!hidden));
    ansBtn.textContent = hidden ? "👁 Show answers" : "🙈 Hide answers";
  });

  // Simple class timer (count-up). No Date dependency beyond runtime clock.
  const timerDisplay = panel.querySelector(".teacher-timer-display");
  const startBtn = panel.querySelector(".teacher-timer-start");
  const resetBtn = panel.querySelector(".teacher-timer-reset");
  let elapsed = 0;
  let ticking = null;
  const renderTimer = () => {
    const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const s = String(elapsed % 60).padStart(2, "0");
    if (timerDisplay) timerDisplay.textContent = `${m}:${s}`;
  };
  startBtn?.addEventListener("click", () => {
    if (ticking) {
      clearInterval(ticking);
      ticking = null;
      startBtn.textContent = "▶︎ Start";
    } else {
      ticking = setInterval(() => {
        elapsed += 1;
        renderTimer();
      }, 1000);
      startBtn.textContent = "⏸ Pause";
    }
  });
  resetBtn?.addEventListener("click", () => {
    elapsed = 0;
    renderTimer();
  });

  // Launch question + Exit reflection — quick discussion prompts for the teacher.
  const discussSlot = panel.querySelector('[data-bind="discuss"]');
  const launchQ =
    config.launch?.question ||
    config.launch?.prompt ||
    config.launch?.narrative ||
    "";
  const exitR =
    config.reflect?.exitTicket ||
    config.reflect?.prompt ||
    (Array.isArray(config.reflect?.prompts) ? config.reflect.prompts[0] : "");
  const discussBits = [];
  if (launchQ)
    discussBits.push(
      `<p><strong>🚀 Launch question:</strong> ${esc(launchQ)}</p>`,
    );
  if (exitR)
    discussBits.push(
      `<p><strong>🎟 Exit reflection:</strong> ${esc(exitR)}</p>`,
    );
  if (discussBits.length && discussSlot) {
    discussSlot.innerHTML = `<h4>💬 Discuss</h4>${discussBits.join("")}`;
  } else if (discussSlot) {
    discussSlot.remove();
  }

  // Listen-fors from turnAndTalk
  const listenSlot = panel.querySelector('[data-bind="listen-fors"]');
  const listenFors = (config.turnAndTalk || [])
    .filter((t) => t.listenFor)
    .map(
      (t) =>
        `<li><strong>${esc(t.phase || "Phase")}:</strong> ${esc(t.listenFor)}</li>`,
    );
  if (listenFors.length) {
    listenSlot.innerHTML = `<h4>${stackHtml(t("listenFor", "en"), t("listenFor", "es"))}</h4><ul class="teacher-listen">${listenFors.join("")}</ul>`;
  } else {
    listenSlot.remove();
  }

  // Answer key summary from practice items
  const keySlot = panel.querySelector('[data-bind="answer-key"]');
  const items = collectAnswerKey(config);
  if (items.length) {
    keySlot.innerHTML = `
      <h4>${stackHtml(t("answerKey", "en"), t("answerKey", "es"))}</h4>
      <ol class="teacher-answer-key">${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ol>`;
  } else {
    keySlot.remove();
  }

  panel
    .querySelector(".teacher-print-packet")
    ?.addEventListener("click", () => {
      window.print();
    });

  root.append(panel);
  return panel;
}

function collectAnswerKey(config) {
  const answers = [];
  const buckets = ["approaching", "onLevel", "extending"];
  for (const b of buckets) {
    const items = config.practice?.[b] || [];
    items.forEach((item, i) => {
      if (
        item.type === "multiple-choice" &&
        item.choices?.[item.correctIndex]
      ) {
        answers.push(
          `${b} #${i + 1}: ${item.choices[item.correctIndex]}${item.explanation ? ` — ${item.explanation}` : ""}`,
        );
      } else if (item.answer) {
        answers.push(`${b} #${i + 1}: ${item.answer}`);
      }
    });
  }
  return answers.slice(0, 12);
}

/** Collapsible teacher notes for welcome/cover (no ?teacher=1 required).
 * NOTE: This panel is rendered to STUDENTS (caller gates on !isTeacherMode()),
 * so it must never include answer-bearing content. "Listen for" notes (which
 * spell out the worked answers) are intentionally omitted here — teachers get
 * them via the ?teacher=1 answer key. Keep this panel to pacing only. */
export function buildWelcomeTeacherNotes(config) {
  const pacing = PHASE_TIME_ESTIMATES.map(
    (p, i) =>
      `<li><span>${p.icon} ${phaseName(i)}</span><span>~${p.minutes} min</span></li>`,
  ).join("");

  const wrap = document.createElement("div");
  wrap.className = "welcome-teacher-notes";
  wrap.innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm welcome-teacher-toggle" aria-expanded="false">
      📋 ${stackHtml(t("teacherNotesToggle", "en"), t("teacherNotesToggle", "es"))}
    </button>
    <div class="welcome-teacher-panel" hidden>
      <h4>${stackHtml(t("teacherNotes", "en"), t("teacherNotes", "es"))}</h4>
      <p class="teacher-meta">${esc(config.standard)} · ${esc(config.timeEstimate || "~45 min")} · ${countPracticeProblems(config)} ${t("practiceItems")}</p>
      <div class="teacher-panel-section">
        <h5>${stackHtml(t("pacingGuide", "en"), t("pacingGuide", "es"))}</h5>
        <ul class="teacher-pacing-list">${pacing}</ul>
      </div>
    </div>`;

  const toggle = wrap.querySelector(".welcome-teacher-toggle");
  const panel = wrap.querySelector(".welcome-teacher-panel");
  toggle.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.innerHTML = open
      ? `📋 ${stackHtml(t("teacherNotesHide", "en"), t("teacherNotesHide", "es"))}`
      : `📋 ${stackHtml(t("teacherNotesToggle", "en"), t("teacherNotesToggle", "es"))}`;
  });

  return wrap;
}
