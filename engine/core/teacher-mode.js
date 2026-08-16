// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
import { countPracticeProblems, PHASE_TIME_ESTIMATES } from "./content-enrichment.js";
import { phaseName, stackHtml, t } from "./i18n.js";
// Objective vocab popups + highlight, shared with the student-facing Launch
// header / Objectives page so teacher-mode objectives read identically.
// Runtime-only use, so the teacher-mode ↔ lesson-renderer import cycle is safe.
import {
  linkifyObjectiveTerms,
  resolveContentObjective,
  resolveLanguageObjective,
  wireObjectiveTermPopups,
} from "./lesson-renderer.js";
import { teachEvidencePanelHtml } from "./uifr.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

const TEACHER_KEY = "nt-teacher-mode";
// Which accepted PIN unlocked Teacher Mode (master | coteacher). Nice-to-have
// for future rotation; does not grant SITE_PASSWORD / Basic Auth.
const TEACHER_PIN_ROLE_KEY = "nt-teacher-pin-role";

// Classroom deterrent passwords for entering Teacher Mode. NOTE: this is a
// client-side gate, not real security — answer-key content still ships in the
// page, so a determined student could read it from source. It stops casual
// clicking/peeking, which is the real classroom risk. Either PIN unlocks the
// same Teacher Mode sticky flag; neither is SITE_PASSWORD.
// ⚠️ THIS FILE IS THE CANONICAL COPY. The same literal is duplicated in five
// other places, and the sync comments used to disagree with each other — this
// one named a single file, so a rotation that followed it left three live
// surfaces on the old PIN. Rotate ALL of these together:
//   assets/curriculum-enhancements.js      (TEACHER_PINS)
//   math/student-board/index.html          (TEACHER_PIN)
//   shared/projects/projects-gold.js       (TEACHER_PIN)
//   teacher-tools/teaching-evidence/index.html (PIN)
//   tests/curriculum-journey.spec.ts       (TEACHER_PIN)
// tools/validate-projects-award.mjs reads the values below at runtime, so it
// needs no edit — it follows a rotation on its own.
const TEACHER_PINS = Object.freeze({
  master: "BlueHeron2026",
  coteacher: "RiverStone2026",
  masterAlt: "CedarLoop2026",
  coteacherAlt: "SableCreek2026",
});
// Order is load-bearing: matchTeacherPin() derives the role from the index
// (even = master, odd = co-teacher), so the two roles must keep alternating.
// Derived from TEACHER_PINS rather than repeated, so a rotation cannot update
// one and miss the other — and TEACHER_PINS keeps the literal `master:` /
// `coteacher:` shape that tools/validate-projects-award.mjs reads at runtime.
const ACCEPTED_TEACHER_PINS = [
  TEACHER_PINS.master,
  TEACHER_PINS.coteacher,
  TEACHER_PINS.masterAlt,
  TEACHER_PINS.coteacherAlt,
];

function matchTeacherPin(pin) {
  if (!pin) return null;
  const cleaned = String(pin).trim();
  const lower = cleaned.toLowerCase();
  for (let i = 0; i < ACCEPTED_TEACHER_PINS.length; i++) {
    if (cleaned === ACCEPTED_TEACHER_PINS[i] || lower === ACCEPTED_TEACHER_PINS[i].toLowerCase()) {
      return i % 2 === 0 ? "master" : "coteacher";
    }
  }
  return null;
}

function readStickyTeacher() {
  try {
    return localStorage.getItem(TEACHER_KEY) === "1";
  } catch {
    return false;
  }
}
function setStickyTeacher(on, role) {
  try {
    if (on) {
      localStorage.setItem(TEACHER_KEY, "1");
      if (role) localStorage.setItem(TEACHER_PIN_ROLE_KEY, role);
    } else {
      localStorage.removeItem(TEACHER_KEY);
      localStorage.removeItem(TEACHER_PIN_ROLE_KEY);
    }
  } catch {
    /* storage blocked — fall back to URL param only */
  }
}

// The teacher PIN is typed on a shared classroom device, often several times a
// day. A bare <input> the browser cannot recognise as a credential is never
// offered for saving, so the PIN got retyped every single time. These fields
// make the form a real login as far as Chrome/Safari are concerned: a stable
// username, a `current-password` field, and a submit button. The teacher saves
// it once per device and it autofills after that.
const TEACHER_USERNAME_FIELD =
  '<input type="text" name="username" value="teacher" autocomplete="username" readonly tabindex="-1" aria-hidden="true" class="nt-credential-user" />';

function teacherPinInput(cls) {
  return (
    `<input type="password" name="password" class="${cls}" ` +
    'autocomplete="current-password" placeholder="Enter teacher password" ' +
    'aria-label="Enter teacher password" />'
  );
}

export function isTeacherMode() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  // Force-student always wins (lets a teacher hand a device back instantly).
  if (params.get("teacher") === "0" || params.get("student") === "1") return false;
  // No URL backdoor INTO teacher mode — entry requires the password.
  return readStickyTeacher();
}

/**
 * Adopt a server teacher session, if there is one.
 *
 * A teacher who has signed in at /teacher-login/ has already proved who they
 * are to the server; making them type a second, different, weaker string into
 * this box is the two-credentials-for-one-workflow problem that broke the
 * planner, one surface further along. So: if the session cookie is valid,
 * Teacher Mode turns itself on and the PIN box is never shown.
 *
 * The PIN stays as the offline path. It is a classroom deterrent, not a
 * credential — it is readable in this file, which is exactly why the real
 * teacher keys are not.
 *
 * Fire-and-forget, and failure is silent: a network hiccup must leave the
 * lesson working as a student page, never blocked on an auth probe.
 */
export async function adoptTeacherSession() {
  if (typeof fetch !== "function" || readStickyTeacher()) return false;
  try {
    const res = await fetch("/api/teacher-auth/session", { credentials: "same-origin" });
    const data = await res.json();
    if (!data?.authenticated) return false;
    setStickyTeacher(true, data.teacher === "Alba" ? "coteacher" : "master");
    return true;
  } catch {
    return false;
  }
}

/** Check the password and, if correct, stick teacher mode on this device.
 *  Accepts master or co-teacher PIN (same Teacher Mode; no Basic Auth grant). */
export function unlockTeacher(pin) {
  const role = matchTeacherPin(pin);
  if (!role) return false;
  setStickyTeacher(true, role);
  return true;
}

/**
 * Teacher-mode access — call once at app boot (before mountTeacherPanel).
 * - Entry is PASSWORD-GATED via the Teacher button on the lesson login screen
 *   (mountIdentityTeacherButton). The sticky key (`nt-teacher-mode`) is shared
 *   with the curriculum hub, so unlocking once carries across every lesson.
 * - Exit is free: the floating "Exit" pill (teacher only), `?student=1`, or
 *   Alt+Shift+T. There is intentionally no keyboard/URL way IN.
 */
export function initTeacherAccess() {
  if (typeof window === "undefined") return;
  // `?student=1` is a route-level safety boundary, not a request to erase the
  // teacher's saved mode across every tab. isTeacherMode() still forces this
  // page into Student Mode while the teacher's hub state remains intact.

  document.addEventListener("keydown", (e) => {
    // Ignore while typing in a field so it never collides with student work.
    const el = e.target;
    const tag = (el && el.tagName ? el.tagName : "").toLowerCase();
    if (tag === "input" || tag === "textarea" || (el && el.isContentEditable)) return;
    // Alt+Shift+T only EXITS (entry needs the password). e.code is
    // layout/Option-proof (Mac Option+Shift+T composes a glyph).
    if (e.altKey && e.shiftKey && e.code === "KeyT" && isTeacherMode()) {
      e.preventDefault();
      switchToStudent();
    }
  });

  mountModeToggle();
}

/** Before a mode-switch reload, remember the running lesson identity so the
 *  reload relaunches into the same lesson+phase instead of the name-entry
 *  screen. No-ops (and keeps the prior behavior) outside a running lesson or
 *  when sessionStorage is blocked. */
function stashModeResume() {
  try {
    const s = window.__ntLessonSession;
    if (s && s.lessonId && s.name) {
      sessionStorage.setItem("nt-mode-resume", JSON.stringify(s));
    }
  } catch (_e) {
    /* sessionStorage blocked — fall back to the login screen (prior behavior) */
  }
}

/** Drop back to Student view and reload to re-render. */
function switchToStudent() {
  setStickyTeacher(false);
  stashModeResume();
  // Drop any one-shot params so the sticky key is the single source of truth.
  const url = new URL(window.location.href);
  url.searchParams.delete("teacher");
  url.searchParams.delete("mode");
  url.searchParams.delete("student");
  window.location.href = url.toString();
}

/** Fixed TOP-RIGHT mode toggle — always mounted so the current mode is obvious
 *  at a glance and one tap switches. Teacher Mode → one tap back to Student.
 *  Student Mode → a compact control that reveals a PIN field to enter Teacher
 *  Mode (same password gate as the login screen; students still can't get in
 *  without it). Replaces the old bottom-left exit-only pill. */
function mountModeToggle() {
  if (document.querySelector(".mode-toggle-pill")) return;

  if (isTeacherMode()) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mode-toggle-pill is-teacher";
    btn.setAttribute("aria-pressed", "true");
    btn.innerHTML =
      '<span class="mode-toggle-state">Teacher Mode</span>' +
      '<span class="mode-toggle-action">Switch to Student</span>';
    btn.title = "Switch to Student view";
    btn.addEventListener("click", switchToStudent);
    document.body.append(btn);
    return;
  }

  // Student Mode: subtle control that reveals a PIN field to enter Teacher Mode.
  const wrap = document.createElement("div");
  wrap.className = "mode-toggle-pill is-student";
  wrap.innerHTML =
    '<button type="button" class="mode-toggle-enter" aria-haspopup="true" aria-expanded="false">' +
    '<span class="mode-toggle-state">Student Mode</span>' +
    '<span class="mode-toggle-action">Teacher →</span></button>' +
    '<form class="mode-toggle-unlock" hidden>' +
    TEACHER_USERNAME_FIELD +
    teacherPinInput("mode-toggle-pin") +
    '<button type="submit" class="mode-toggle-go">Enter</button></form>';
  const enterBtn = wrap.querySelector(".mode-toggle-enter");
  const form = wrap.querySelector(".mode-toggle-unlock");
  const pin = wrap.querySelector(".mode-toggle-pin");
  enterBtn.addEventListener("click", () => {
    const open = form.hidden;
    form.hidden = !open;
    enterBtn.setAttribute("aria-expanded", String(open));
    if (open) pin.focus();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (unlockTeacher(pin.value.trim())) {
      stashModeResume();
      window.location.reload();
    } else {
      pin.value = "";
      pin.classList.add("is-error");
      pin.focus();
    }
  });
  document.body.append(wrap);
}

/** Password-gated Teacher button for the lesson login (identity) screen.
 *  Student view: a "👩‍🏫 Teacher" button that reveals a password field.
 *  Teacher view: a confirmation + one-click "Switch to Student". */
export function mountIdentityTeacherButton(slot) {
  if (!slot) return;

  if (isTeacherMode()) {
    slot.innerHTML = `
      <div class="identity-teacher is-on">
        <span class="identity-teacher-label">Teacher Mode is on</span>
        <button type="button" class="identity-teacher-exit">Switch to Student</button>
      </div>`;
    slot.querySelector(".identity-teacher-exit").addEventListener("click", switchToStudent);
    return;
  }

  slot.innerHTML = `
    <div class="identity-teacher">
      <button type="button" class="identity-teacher-btn">Teacher</button>
      <form class="identity-teacher-unlock" hidden>
        ${TEACHER_USERNAME_FIELD}
        ${teacherPinInput("identity-teacher-pin")}
        <button type="submit" class="identity-teacher-go">Enter</button>
        <p class="identity-teacher-err" role="alert" hidden>That password did not work. Try again.</p>
      </form>
    </div>`;

  const openBtn = slot.querySelector(".identity-teacher-btn");
  const form = slot.querySelector(".identity-teacher-unlock");
  const pin = slot.querySelector(".identity-teacher-pin");
  const err = slot.querySelector(".identity-teacher-err");

  openBtn.addEventListener("click", () => {
    openBtn.hidden = true;
    form.hidden = false;
    pin.focus();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (unlockTeacher(pin.value.trim())) {
      window.location.reload();
    } else {
      err.hidden = false;
      pin.value = "";
      pin.focus();
    }
  });
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
      ${stackHtml(t("teacherView", "en"), t("teacherView", "es"))}
    </button>
    <div id="teacher-panel-body" class="teacher-panel-body">
      <div class="teacher-panel-section teacher-projection">
        <h4>🎥 Project &amp; Pace</h4>
        <div class="teacher-proj-controls">
          <button type="button" class="btn btn-secondary btn-sm teacher-proj-toggle" aria-pressed="false">🔍 Projector view</button>
          <button type="button" class="btn btn-secondary btn-sm teacher-answers-toggle" aria-pressed="true">🙈 Hide answers</button>
        </div>
        <div class="teacher-proj-controls teacher-pager">
          <button type="button" class="btn btn-secondary btn-sm teacher-prev-phase">◀ Prev</button>
          <button type="button" class="btn btn-secondary btn-sm teacher-next-phase">Next phase ▶</button>
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
        <p class="teacher-obj">${linkifyObjectiveTerms(resolveContentObjective(config), config.vocabulary || [])}</p>
        <p class="teacher-obj">${linkifyObjectiveTerms(resolveLanguageObjective(config), config.vocabulary || [])}</p>
      </div>
      <div class="teacher-panel-section" data-bind="listen-fors"></div>
      <div class="teacher-panel-section teacher-uifr" data-bind="uifr"></div>
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

  // Phase pager — jump between phases WITHOUT completing the work, so a teacher
  // can walk/project the whole lesson. Bypasses every intra-phase gate (problems,
  // Turn & Talk, writing). Bounds-checked against the phase count.
  const goPhase = (delta) => {
    const s = state.get();
    const total = (s.phases && s.phases.length) || config.phases.length || 0;
    const next = Math.min(Math.max((s.currentPhase || 0) + delta, 0), total - 1);
    document.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: next } }));
  };
  panel.querySelector(".teacher-prev-phase")?.addEventListener("click", () => goPhase(-1));
  panel.querySelector(".teacher-next-phase")?.addEventListener("click", () => goPhase(1));

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
    config.launch?.question || config.launch?.prompt || config.launch?.narrative || "";
  const exitR =
    config.reflect?.exitTicket ||
    config.reflect?.prompt ||
    (Array.isArray(config.reflect?.prompts) ? config.reflect.prompts[0] : "");
  const discussBits = [];
  if (launchQ) discussBits.push(`<p><strong>🚀 Launch question:</strong> ${esc(launchQ)}</p>`);
  if (exitR) discussBits.push(`<p><strong>🎟 Exit reflection:</strong> ${esc(exitR)}</p>`);
  if (discussBits.length && discussSlot) {
    discussSlot.innerHTML = `<h4>💬 Discuss</h4>${discussBits.join("")}`;
  } else if (discussSlot) {
    discussSlot.remove();
  }

  // Listen-fors from turnAndTalk
  const listenSlot = panel.querySelector('[data-bind="listen-fors"]');
  const listenFors = (config.turnAndTalk || [])
    .filter((t) => t.listenFor)
    .map((t) => `<li><strong>${esc(t.phase || "Phase")}:</strong> ${esc(t.listenFor)}</li>`);
  if (listenFors.length) {
    listenSlot.innerHTML = `<h4>${stackHtml(t("listenFor", "en"), t("listenFor", "es"))}</h4><ul class="teacher-listen">${listenFors.join("")}</ul>`;
  } else {
    listenSlot.remove();
  }

  // Teaching Evidence — BCPS UIFR (TEACH · Level 4). Teacher-only surface; the
  // same evidence is stamped invisibly in <head> and recorded in the coverage
  // report. Students never see this (the whole panel is teacher-gated).
  const uifrSlot = panel.querySelector('[data-bind="uifr"]');
  if (uifrSlot) uifrSlot.innerHTML = teachEvidencePanelHtml(config, esc);

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

  panel.querySelector(".teacher-print-packet")?.addEventListener("click", () => {
    window.print();
  });

  // Underlined vocab in the objectives opens the same EN/ES glossary popup.
  wireObjectiveTermPopups(panel, config.vocabulary || []);

  root.append(panel);
  return panel;
}

function collectAnswerKey(config) {
  const answers = [];
  const buckets = ["approaching", "onLevel", "extending"];
  for (const b of buckets) {
    const items = config.practice?.[b] || [];
    items.forEach((item, i) => {
      if (item.type === "multiple-choice" && item.choices?.[item.correctIndex]) {
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
    (p, i) => `<li><span>${p.icon} ${phaseName(i)}</span><span>~${p.minutes} min</span></li>`,
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
