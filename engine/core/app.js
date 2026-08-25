// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
import { renderActivityChooser, runComponentList } from "../components/activity-chooser.js";
import {
  renderLearnItPanel,
  renderVocabAndLearnIt,
  renderVocabPanel,
} from "../components/vocab-learn-panel.js";
import { createEngagement } from "../engagement/engagement.js";
import { fireCelebrationFX } from "./celebration-picker.js";
import { PHASE_TIME_ESTIMATES } from "./content-enrichment.js";
import { mountExportToolbar } from "./export.js";
import { completeLesson, reportExitTicketScore } from "./grade-emit.js";
import { getPreferredLang, phaseName, setPreferredLang, stackHtml, t } from "./i18n.js";
import { enableKeyboardScrolling } from "./keyboard-scroll.js";
import {
  linkifyObjectiveTerms,
  observeVocabTerms,
  renderComponent,
  renderLearnItExtrasInto,
  resolveContentObjective,
  resolveLanguageObjective,
  underlineVocabTerms,
  wireObjectiveTermPopups,
} from "./lesson-renderer.js";
import { augmentVocabWithGlossary } from "./math-glossary.js";
import {
  announceBlocked,
  canLeavePhase,
  closeMathNotesModel,
  initNotebook,
  mountNotebookCheckpoint,
  openMathNotesModel,
} from "./notebook-checkpoint.js";
import { applyPlainLanguage, isPlainLanguageOn } from "./plain-language.js";
import { applyPhaseAccent, buildLessonCoverExtras, mountCoverArt } from "./premium.js";
import { initPresentMode } from "./present-mode.js";
import { reportScore } from "./score-reporter.js";
import { clearLessonStorage, createState, findSavedStudents, normalizeStudentId } from "./state.js";
import { mountTeacherClearButton } from "./teacher-clear.js";
import {
  buildWelcomeTeacherNotes,
  initTeacherAccess,
  isTeacherMode,
  mountIdentityTeacherButton,
} from "./teacher-mode.js";
import { mountTranslate } from "./translate.js";
import { mountUtilityMenu } from "./utility-menu.js";
import { mountVoiceNav } from "./voice-nav.js";
import "@engine/styles/design-system.css";
import "@engine/styles/motion.css";
import "@engine/styles/themes.css";
import "@engine/styles/editorial.css";
import "@engine/styles/present-mode.css";
import "@engine/styles/theme-warm.css";
import "@engine/styles/notebook-checkpoint.css";

export function createApp(config) {
  const root = document.getElementById("app");
  root.innerHTML = "";
  root.className = "app";

  // Arrow / Page / Home / End keys scroll the lesson — including the Vocab,
  // Learn It and Guided Notes takeovers, which lock the document scroller and
  // scroll inside their own panel.
  enableKeyboardScrolling();

  // Device-local learning signals (assets/nt-signal.js → window.NTSignal).
  // Lazy-loaded so lesson launchers need no HTML change; every consumer
  // guards on window.NTSignal so a failed load is a silent no-op. The tiny
  // meta global gives deep engine components (misconception capture) the
  // lesson's standard without threading config through every call.
  try {
    window.__ntLessonMeta = { standard: config.standard || "", lesson: config.lessonId || "" };
    if (!window.NTSignal && !document.querySelector('script[src^="/assets/nt-signal.js"]')) {
      const sig = document.createElement("script");
      sig.src = "/assets/nt-signal.js";
      sig.defer = true;
      document.head.append(sig);
    }
    /* Teacher-facing telemetry (assets/lesson-telemetry.js → window.NTtelemetry).
       Lazy-loaded here for the same reason as nt-signal above: no HTML change to
       975 lesson shells, and every consumer already guards on window.NTtelemetry
       so a failed load is a silent no-op.

       Why this was needed: reportMisconception() in lesson-renderer.js has always
       called window.NTtelemetry.track("misconception", …) — one of the exact
       event types the teacher analytics query — but nothing on a /lessons/<id>/
       page ever loaded the telemetry module, so that sink never fired and these
       pages contributed no evidence at all. Loading it AFTER __ntLessonMeta is
       set (line above) also means the module can read the lesson's canonical
       standard on init, which matters because the page is a runtime-rendered
       shell with no standard in its static HTML. */
    if (
      !window.NTtelemetry &&
      !document.querySelector('script[src^="/assets/lesson-telemetry.js"]')
    ) {
      const tel = document.createElement("script");
      tel.src = "/assets/lesson-telemetry.js";
      tel.defer = true;
      document.head.append(tel);
    }
  } catch {
    /* signals are optional */
  }
  // a11y: the rendered lesson is the page's primary content (landmark-one-main).
  root.setAttribute("role", "main");
  // Publisher-grade editorial design layer (engine/styles/editorial.css) — the
  // approved look now applies to EVERY lesson, not just flagship pilots.
  document.body.classList.add("editorial");
  // Visual skin (engine/styles/theme-warm.css) — warm-deck is the canonical
  // look for every lesson; config.skin can name another `skin-*` class, and
  // `"skin": "editorial"` opts a lesson back to the bare editorial layer.
  // DOM, flow, and interactivity are untouched by skins.
  const skin = config.skin || "warm-deck";
  if (skin !== "editorial") document.body.classList.add(`skin-${skin}`);

  // High Contrast stylesheet overrides
  const hcSheet = document.createElement("style");
  hcSheet.textContent = `
    body.high-contrast {
      filter: contrast(1.4) !important;
      background: #000 !important;
      color: #fff !important;
    }
    body.high-contrast input,
    body.high-contrast select,
    body.high-contrast button {
      border: 2px solid #fff !important;
      outline: 2px solid #000 !important;
      background: #000 !important;
      color: #fff !important;
    }
  `;
  document.head.append(hcSheet);

  // Easy teacher-mode access: sticky per-device toggle + Alt+Shift+T + badge.
  initTeacherAccess();
  // Flag teacher mode on the root so CSS can hide student-only affordances
  // (Save/Resume, Save to Google Docs). Formerly set by the teacher panel,
  // which was removed; keep the class so those hooks still work.
  if (isTeacherMode()) document.documentElement.classList.add("teacher-mode");
  // Browser tab / SEO title (the engine shell ships a generic <title>).
  if (config.title) {
    const bits = [config.title];
    if (config.lessonId) bits.push("Lesson " + config.lessonId);
    document.title = bits.join(" · ") + " — Neft Teacher";
  }
  // SEO meta (the static lesson shell has no description/canonical).
  injectSeoMeta(config);
  if (config.theme) {
    document.documentElement.setAttribute("data-theme", config.theme);
    root.setAttribute("data-theme", config.theme);
  }

  showIdentityScreen(root, config);

  // Teacher-only "Clear answers" — available immediately on the cover/identity
  // screen, BEFORE the activity is entered, so a teacher can reset a lesson to
  // blank between class periods (wiping last period's saved work) without having
  // to sign in as a student. Wipes every saved-state key for this lesson on this
  // device plus the Save/Resume pointer, then reloads. When the activity is
  // later entered, initMainApp re-registers a state-aware clearFn; the button's
  // own mount guard prevents a duplicate. Renders only in teacher mode — a
  // student never sees it and can never erase work from here.
  window.__ntClearLessonAnswers = () => {
    clearLessonStorage(config.lessonId);
    try {
      sessionStorage.removeItem(`nt-active-session:${config.lessonId}`);
      sessionStorage.removeItem("nt-active-session");
      localStorage.removeItem(`nt-active-student:${config.lessonId}`);
      window.NeftSaveResume?.reset?.();
    } catch (_) {
      /* save/resume not present on this page */
    }
    // Clear DOM input fields on current screen in-place
    try {
      document.querySelectorAll('input:not([type="hidden"]), textarea').forEach((input) => {
        if (input.type === "checkbox" || input.type === "radio") input.checked = false;
        else if (input.id !== "studentNameInput" && input.name !== "studentName") input.value = "";
      });
      document
        .querySelectorAll(".is-selected, .is-correct, .is-incorrect, .correct, .wrong, .selected")
        .forEach((el) => {
          el.classList.remove(
            "is-selected",
            "is-correct",
            "is-incorrect",
            "correct",
            "wrong",
            "selected",
          );
        });
    } catch (_) {}
  };
  mountTeacherClearButton(window.__ntClearLessonAnswers);

  // Global sound hooks
  window.AudioSynth = {
    ctx: null,
    init() {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    playTone(freq, type, duration, vol = 0.1) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    },
    click() {
      this.init();
      this.playTone(600, "sine", 0.05, 0.05);
    },
    success() {
      this.init();
      this.playTone(800, "sine", 0.1, 0.1);
      setTimeout(() => this.playTone(1200, "sine", 0.2, 0.1), 100);
    },
    error() {
      this.init();
      this.playTone(200, "sawtooth", 0.2, 0.1);
    },
    tada() {
      this.init();
      this.playTone(523.25, "sine", 0.1, 0.1);
      setTimeout(() => this.playTone(659.25, "sine", 0.1, 0.1), 100);
      setTimeout(() => this.playTone(783.99, "sine", 0.4, 0.15), 200);
    },
  };

  window.fireConfetti = function (type) {
    let pref = type;
    if (!pref) {
      try {
        pref = localStorage.getItem("nt-celebration-style") || "polygon_3d";
      } catch {
        pref = "polygon_3d";
      }
    }
    fireCelebrationFX(pref);
  };

  document.addEventListener("click", (e) => {
    if (
      e.target.closest('button, a, select, input[type="radio"], input[type="checkbox"], .phase-btn')
    ) {
      if (window.AudioSynth) window.AudioSynth.click();
    }
  });
}

/** Lazy-load EduPulse bridge for score reporting (fire-and-forget). */
function ensureEduPulse() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.EduPulse?.record) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => resolve();
    if (!document.querySelector('script[src*="edupulse-config"]')) {
      const cfg = document.createElement("script");
      cfg.src = "/assets/edupulse-config.js";
      cfg.onload = () => {
        const bridge = document.createElement("script");
        bridge.src = "/assets/edupulse-bridge.js";
        bridge.onload = done;
        bridge.onerror = done;
        document.body.append(bridge);
      };
      cfg.onerror = done;
      document.body.append(cfg);
    } else {
      done();
    }
  });
}

function injectSeoMeta(config) {
  if (typeof document === "undefined" || !document.head) return;

  // Build a sensible description: prefer the lesson's content objective.
  const description =
    config.contentObjective ||
    `${config.title} — Grade 6 Reveal Math (${config.standard}), Unit ${config.unit}.`;
  upsertMetaName("description", description);

  if (config.lessonId) {
    // Absolute URL — Lighthouse/SEO rejects relative rel=canonical values.
    const origin =
      typeof location !== "undefined" && /^https?:/.test(location.origin)
        ? location.origin
        : "https://eduwonderlab.com";
    upsertLinkRel("canonical", `${origin}/lessons/${config.lessonId}/`);
  }
}

function upsertMetaName(name, content) {
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.append(el);
  }
  el.setAttribute("content", content);
}

function upsertLinkRel(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.append(el);
  }
  el.setAttribute("href", href);
}

// Per-lesson Google Forms card (opt-in via config.googleForms). Shows ONLY the
// three student forms (Notes / Practice / Quiz). Teacher edit links are
// intentionally NOT rendered here — the student lesson page must not expose any
// teacher-facing Drive/edit links (teacherEditFolder is ignored).
function _formsCardHtml(config) {
  const gf = config.googleForms;
  if (!gf || !gf.student) return "";
  const s = gf.student;
  const link = (href, label, emoji) =>
    href
      ? `<a href="${href}" target="_blank" rel="noopener" style="flex:1; min-width:84px; display:flex; flex-direction:column; align-items:center; gap:4px; text-decoration:none; color:inherit; background:#fff; border:1px solid var(--gold,#d4952a); border-radius:10px; padding:10px 8px; font-weight:600;"><span style="font-size:1.3rem;" aria-hidden="true">${emoji}</span><span>${label}</span></a>`
      : "";
  return `
      <div class="identity-forms" style="background:var(--cream,#fdf3e0); border:1px solid var(--gold,#d4952a); border-radius:12px; padding:12px 16px; margin:0 0 16px; text-align:left;">
        <div style="font-weight:700; margin-bottom:8px;">📋 ${t("lessonForms")}</div>
        <p style="margin:0 0 8px; font-size:0.84rem; color:var(--muted,#52606d);">These optional links open Google Forms. Responses leave this site and follow your school Google account and form settings.</p>
        <div style="display:flex; gap:8px;">
          ${link(s.notes, t("notes"), "📝")}
          ${link(s.practice, t("practice"), "✏️")}
          ${link(s.quiz, t("quiz"), "✅")}
        </div>
      </div>`;
}

function lessonTimeEstimate(config) {
  if (config.timeEstimate) return String(config.timeEstimate);
  if (String(config.lessonId || "").includes("flagship")) return "~50 min";
  return "~45 min";
}

function _objectivesBlockHtml(config) {
  // Same treatment as the Launch header and Objectives page: key vocabulary
  // words are underlined + tap-to-open the glossary popup, and the goal text is
  // bold. wireObjectiveTermPopups(screen, …) is called after the cover mounts.
  const vocab = augmentVocabWithGlossary(config.vocabulary);
  const content = linkifyObjectiveTerms(resolveContentObjective(config), vocab);
  const language = linkifyObjectiveTerms(resolveLanguageObjective(config), vocab);
  return `
    <div class="identity-objectives">
      <div class="identity-objective-row">
        <span class="identity-objective-badge">${t("target")}</span>
        <span style="font-weight:500;">${content}</span>
      </div>
      <div class="identity-objective-row">
        <span class="identity-objective-badge">${t("discuss")}</span>
        <span style="font-weight:500;">${language}</span>
      </div>
    </div>`;
}

let googleSlidesUrlMapPromise = null;

function loadGoogleSlidesUrlMap() {
  if (!googleSlidesUrlMapPromise) {
    googleSlidesUrlMapPromise = fetch("/data/google-slides-urls.json")
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return googleSlidesUrlMapPromise;
}

function mountWelcomeGoogleSlidesLink(lessonId, slot) {
  if (!slot || !lessonId) return;
  loadGoogleSlidesUrlMap().then((map) => {
    const url = map && map[lessonId];
    if (!url) return;
    slot.innerHTML = ` · <a href="${escHtml(url)}" target="_blank" rel="noopener" style="color:var(--teal-ink); font-weight:600;">↗ ${stackHtml(t("googleSlides", "en"), t("googleSlides", "es"))}</a>`;
  });
}

// Class roster on the name screen, from any of three sources (first wins):
//   1. ?class=<code>  — base64url JSON {p:"period", n:["First L.", ...]} living
//      only inside the teacher's link (nothing on the server).
//   2. ?join=<CODE>   — a short class code; the name list is fetched from
//      /api/roster (teacher-synced, first name + last initial only). The code
//      persists on this device so every later lesson shows the picker too.
//   3. A previously saved class code (localStorage "nt-class-code").
// Picking from a roster keeps the name byte-identical on every device, which
// keeps the derived studentId — and with it progress — stable across devices.
const CLASS_CODE_LS = "nt-class-code";

function renderRosterPicker(screen, nameInput, periodInput, startBtn, names, period) {
  const form = screen.querySelector(".identity-form");
  if (!form || form.querySelector(".identity-roster")) return;
  const wrap = document.createElement("div");
  wrap.className = "identity-roster";
  wrap.style.cssText = "margin-bottom:12px;text-align:left;";
  wrap.innerHTML =
    `<label for="id-roster">${escHtml(t("yourName", "en") || "Pick your name")}</label>` +
    `<select id="id-roster" style="width:100%;padding:11px;border-radius:10px;border:1px solid #cbd5e1;font:inherit;">` +
    `<option value="">— choose your name —</option>` +
    names.map((n) => `<option>${escHtml(String(n))}</option>`).join("") +
    `</select>` +
    `<p style="margin:6px 0 0;font-size:0.78rem;color:#64748b;">Not listed? Type your name below instead.</p>`;
  form.insertBefore(wrap, form.firstChild);
  if (period && periodInput && !periodInput.value) periodInput.value = period;
  wrap.querySelector("#id-roster").addEventListener("change", (e) => {
    if (e.target.value) {
      nameInput.value = e.target.value;
      startBtn.disabled = false;
    }
  });
}

function fetchJoinRoster(code) {
  return fetch(`/api/roster/get?code=${encodeURIComponent(code)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => (d && d.ok && Array.isArray(d.students) && d.students.length ? d : null))
    .catch(() => null);
}

function mountJoinCodeEntry(screen, nameInput, periodInput, startBtn) {
  const form = screen.querySelector(".identity-form");
  if (!form) return;
  const wrap = document.createElement("div");
  wrap.className = "identity-join";
  wrap.style.cssText = "margin-bottom:12px;text-align:left;";
  wrap.innerHTML =
    `<button type="button" id="id-join-toggle" style="background:none;border:0;padding:0;font:inherit;font-size:0.82rem;font-weight:600;color:var(--teal-ink,#0f766e);cursor:pointer;text-decoration:underline;">` +
    `${stackHtml("Have a class code?", "¿Tienes un código de clase?")}</button>` +
    `<span id="id-join-row" hidden style="display:inline-flex;gap:8px;margin-left:10px;align-items:center;">` +
    `<input id="id-join-code" type="text" autocomplete="off" autocapitalize="characters" placeholder="MK7Q9C" maxlength="8" style="width:110px;padding:8px;border-radius:8px;border:1px solid #cbd5e1;font:inherit;text-transform:uppercase;letter-spacing:2px;" />` +
    `<button type="button" id="id-join-go" style="padding:8px 12px;border-radius:8px;border:0;background:var(--teal-ink,#0f766e);color:#fff;font:inherit;font-weight:600;cursor:pointer;">Go</button>` +
    `<span id="id-join-msg" style="font-size:0.78rem;color:#64748b;"></span></span>`;
  form.insertBefore(wrap, form.firstChild);
  const row = wrap.querySelector("#id-join-row");
  const codeInput = wrap.querySelector("#id-join-code");
  const msg = wrap.querySelector("#id-join-msg");
  wrap.querySelector("#id-join-toggle").addEventListener("click", () => {
    row.hidden = !row.hidden;
    if (!row.hidden) codeInput.focus();
  });
  const go = () => {
    const code = (codeInput.value || "").trim().toUpperCase();
    if (code.length < 4) return;
    msg.textContent = "…";
    fetchJoinRoster(code).then((d) => {
      if (!d) {
        msg.textContent = "Code not found — check with your teacher.";
        return;
      }
      try {
        localStorage.setItem(CLASS_CODE_LS, code);
      } catch {}
      wrap.remove();
      renderRosterPicker(
        screen,
        nameInput,
        periodInput,
        startBtn,
        d.students.map((s) => s.name),
        d.section,
      );
    });
  };
  wrap.querySelector("#id-join-go").addEventListener("click", go);
  codeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      go();
    }
  });
}

function mountClassRoster(screen, nameInput, periodInput, startBtn) {
  // 1. Link-embedded roster (?class=) — fully offline, unchanged behavior.
  try {
    const m = /[?&]class=([A-Za-z0-9_-]+)/.exec(window.location.search);
    if (m) {
      let b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const roster = JSON.parse(decodeURIComponent(escape(window.atob(b64))));
      const names = Array.isArray(roster) ? roster : roster.n || roster.names || [];
      if (names.length) {
        const period = (!Array.isArray(roster) && (roster.p || roster.period)) || "";
        renderRosterPicker(screen, nameInput, periodInput, startBtn, names, period);
        return;
      }
    }
  } catch (_e) {
    /* malformed ?class= — fall through to the other sources */
  }

  // 2. Class code from the URL (?join=) or 3. remembered on this device.
  let joinCode = "";
  try {
    const j = /[?&]join=([A-Za-z0-9]+)/.exec(window.location.search);
    joinCode = (j && j[1]) || localStorage.getItem(CLASS_CODE_LS) || "";
  } catch {}
  if (joinCode) {
    fetchJoinRoster(joinCode.toUpperCase()).then((d) => {
      if (d) {
        try {
          localStorage.setItem(CLASS_CODE_LS, d.code);
        } catch {}
        renderRosterPicker(
          screen,
          nameInput,
          periodInput,
          startBtn,
          d.students.map((s) => s.name),
          d.section,
        );
      } else {
        mountJoinCodeEntry(screen, nameInput, periodInput, startBtn);
      }
    });
    return;
  }

  // No roster anywhere yet — offer the class-code entry.
  mountJoinCodeEntry(screen, nameInput, periodInput, startBtn);
}

function showIdentityScreen(root, config) {
  // Canvas/SCORM auto-identify: when the SCORM wrapper hands us the LMS student
  // name (sn) — and optional roster id (si) — skip the name-entry screen and
  // launch straight in, already identified. Guarded on `sn` so a normal visit
  // to the live site is byte-identical to before.
  const launchParams = new URLSearchParams(window.location.search);
  const lmsName = (launchParams.get("sn") || "").trim();
  if (lmsName) {
    const lmsId = (launchParams.get("si") || "").trim();
    const studentId = normalizeStudentId(lmsId || lmsName);
    try {
      window.NeftIdentity?.set({ name: lmsName, section: "" });
    } catch {
      /* identity is an enhancement — never block launching the lesson */
    }
    initMainApp(root, config, studentId, lmsName, "");
    return;
  }

  // Mode-switch resume: toggling between Student and Teacher view reloads the
  // page so answer keys and the teacher panel render correctly. Rather than
  // dropping the student back to this name-entry screen, teacher-mode.js stashes
  // the running identity just before that reload — relaunch straight into the
  // lesson here. state.currentPhase restores from localStorage, so they land
  // exactly where they were, in the new mode.
  try {
    const raw = sessionStorage.getItem("nt-mode-resume");
    if (raw) {
      sessionStorage.removeItem("nt-mode-resume");
      const intent = JSON.parse(raw);
      if (intent && intent.lessonId === config.lessonId && intent.name) {
        const studentId = normalizeStudentId(intent.name);
        try {
          window.NeftIdentity?.set({ name: intent.name, section: intent.period || "" });
        } catch {
          /* identity is an enhancement — never block launching the lesson */
        }
        initMainApp(root, config, studentId, intent.name, intent.period || "");
        return;
      }
    }
  } catch (_) {}

  // Auto-resume active session on page reload:
  // When a student/teacher refreshes the page, avoid dropping them back to the
  // name-entry screen. Restore their active session seamlessly.
  try {
    let activeSession = null;
    const sessRaw = sessionStorage.getItem(`nt-active-session:${config.lessonId}`) || sessionStorage.getItem("nt-active-session");
    if (sessRaw) {
      const parsed = JSON.parse(sessRaw);
      if (parsed && (parsed.lessonId === config.lessonId || !parsed.lessonId) && parsed.name) {
        activeSession = parsed;
      }
    }
    if (!activeSession) {
      const localRaw = localStorage.getItem(`nt-active-student:${config.lessonId}`);
      if (localRaw) {
        const parsed = JSON.parse(localRaw);
        if (parsed && parsed.name && (Date.now() - (parsed.time || 0) < 12 * 3600 * 1000)) {
          activeSession = parsed;
        }
      }
    }
    if (activeSession && activeSession.name) {
      const studentId = normalizeStudentId(activeSession.name);
      try {
        window.NeftIdentity?.set({ name: activeSession.name, section: activeSession.period || "" });
      } catch (_) {}
      initMainApp(root, config, studentId, activeSession.name, activeSession.period || "");
      return;
    }
  } catch (_) {
    /* session restore error — fall through to name screen */
  }

  const themeEmoji = config.themeEmoji || "📐";
  const saved = findSavedStudents(config.lessonId);
  const _homeworkHtmlHref = `/lessons/${encodeURIComponent(config.lessonId)}/homework.html`;
  const _handoutHref = `/lessons/${encodeURIComponent(config.lessonId)}/handout.html`;
  const _slidesHref = `/lessons/${encodeURIComponent(config.lessonId)}/slides.html`;

  const screen = document.createElement("div");
  screen.className = "identity-screen";
  screen.innerHTML = `
    <div class="identity-card">
      <div class="identity-hero lesson-cover-hero">
        <p class="identity-meta">Grade 6 Reveal Math · Unit ${config.unit} · Lesson ${config.lesson ?? ""}</p>
        <div class="identity-unit-badge">Unit ${config.unit}</div>
        <div class="identity-emoji" aria-hidden="true">${themeEmoji}</div>
        <h1 class="identity-title">${escHtml(config.title)}</h1>
        <p class="identity-sub">${escHtml(config.standard)}</p>
        <div class="identity-time" aria-label="Estimated time">⏱️ ${escHtml(lessonTimeEstimate(config))}</div>
        <div class="lesson-cover-extras" id="cover-extras"></div>
      </div>
      <div class="identity-body">
        <p class="instruction-callout" style="margin-bottom:var(--sp-4); font-size:0.88rem;">
          <span class="instruction-callout-icon" aria-hidden="true">👋</span>
          <span>${t("enterNamePrompt")}</span>
          <button type="button" id="id-lang-toggle" aria-pressed="${getPreferredLang() === "es" ? "true" : "false"}"
            style="margin-left:auto;flex:none;padding:6px 12px;border-radius:999px;border:1px solid #cbd5e1;background:${getPreferredLang() === "es" ? "var(--teal-ink,#0f766e)" : "#fff"};color:${getPreferredLang() === "es" ? "#fff" : "var(--teal-ink,#0f766e)"};font:inherit;font-size:0.8rem;font-weight:600;cursor:pointer;"
            title="Cambiar el idioma de la lección / Switch lesson language">🌎 Español</button>
        </p>
        <div id="welcome-teacher-slot"></div>
        <div class="identity-form">
          <label for="id-name">${stackHtml(t("yourName", "en"), t("yourName", "es"))}</label>
          <input id="id-name" type="text" placeholder="${t("namePlaceholder")}" autocomplete="off" />
          <label for="id-period">${stackHtml(t("period", "en"), t("period", "es"))}</label>
          <input id="id-period" type="text" placeholder="${t("periodPlaceholder")}" autocomplete="off" />
          <button id="id-start" class="identity-btn" disabled>${stackHtml(t("startActivity", "en"), t("startActivity", "es"))}</button>
        </div>
        <div id="identity-teacher-slot"></div>
        ${saved.length ? `<div class="identity-saved" id="id-saved-list"></div>` : ""}
      </div>
    </div>
  `;
  root.append(screen);

  // Cover objectives share the Launch/Objectives glossary popups: tapping an
  // underlined vocab word opens the same EN/ES explanation card — definition in
  // English and Spanish plus the term's illustration.
  wireObjectiveTermPopups(screen, augmentVocabWithGlossary(config.vocabulary));

  mountWelcomeGoogleSlidesLink(
    config.lessonId,
    screen.querySelector("#welcome-google-slides-slot"),
  );

  // Teacher pacing notes are teacher-only: shown on the cover when ?teacher=1,
  // never to students. (Students previously saw this panel — removed.)
  const teacherSlot = screen.querySelector("#welcome-teacher-slot");
  if (teacherSlot && isTeacherMode()) {
    teacherSlot.append(buildWelcomeTeacherNotes(config));
  }

  // Password-gated Teacher entry, right under the Start button.
  mountIdentityTeacherButton(screen.querySelector("#identity-teacher-slot"));

  // Language toggle (English ⇄ Español). Persists in localStorage "nt-lang"
  // and reloads so every t()/phaseName() call re-renders in the chosen
  // language — same reload pattern as the Student⇄Teacher mode switch.
  const langBtn = screen.querySelector("#id-lang-toggle");
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      setPreferredLang(getPreferredLang() === "es" ? "en" : "es");
      window.location.reload();
    });
  }

  const coverExtras = screen.querySelector("#cover-extras");
  if (coverExtras) {
    const savedMatch = saved[0];
    coverExtras.innerHTML = buildLessonCoverExtras(config, savedMatch);
    const artSlot = coverExtras.querySelector(".lesson-cover-art");
    if (artSlot) mountCoverArt(artSlot, config);
  }

  const nameInput = screen.querySelector("#id-name");
  const periodInput = screen.querySelector("#id-period");
  const startBtn = screen.querySelector("#id-start");

  nameInput.addEventListener("input", () => {
    startBtn.disabled = !nameInput.value.trim();
    updateSavedHighlight();
  });

  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && nameInput.value.trim()) launchApp();
  });
  periodInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && nameInput.value.trim()) launchApp();
  });

  startBtn.addEventListener("click", launchApp);

  // Optional class roster: when the lesson is opened with ?class=<code> (a link
  // the teacher distributes), show a name dropdown instead of free typing so
  // names match Canvas exactly. No roster data is stored on the server — it
  // travels only in the teacher's link.
  mountClassRoster(screen, nameInput, periodInput, startBtn);

  if (saved.length) {
    const list = screen.querySelector("#id-saved-list");
    const label = document.createElement("div");
    label.className = "identity-saved-label";
    label.textContent = t("savedProgress");
    list.append(label);

    saved.forEach((s) => {
      const btn = document.createElement("button");
      btn.className = "identity-saved-btn";
      btn.dataset.studentId = s.id;
      const when = s.lastSaved ? new Date(s.lastSaved).toLocaleDateString() : "";
      btn.innerHTML = `<strong>${escHtml(s.name)}</strong> ${s.period ? `· P${escHtml(s.period)}` : ""} · ${s.phasesCompleted}/6 phases ${when ? `· ${when}` : ""}`;
      btn.addEventListener("click", () => {
        nameInput.value = s.name;
        periodInput.value = s.period;
        startBtn.disabled = false;
        launchApp();
      });
      list.append(btn);
    });
  }

  function updateSavedHighlight() {
    const id = normalizeStudentId(nameInput.value);
    screen.querySelectorAll(".identity-saved-btn").forEach((btn) => {
      btn.classList.toggle("match", btn.dataset.studentId === id);
    });
  }

  function launchApp() {
    const name = nameInput.value.trim();
    if (!name) return;
    const studentId = normalizeStudentId(name);
    const period = periodInput.value.trim();
    // Persist active session so page refresh never returns to sign-in screen
    try {
      sessionStorage.setItem(`nt-active-session:${config.lessonId}`, JSON.stringify({ lessonId: config.lessonId, name, period }));
      localStorage.setItem(`nt-active-student:${config.lessonId}`, JSON.stringify({ name, period, time: Date.now() }));
    } catch (_) {}
    // Share the typed identity site-wide so grade sync, the save-code gradebook,
    // and curriculum progress sync all pick it up without the student retyping.
    try {
      window.NeftIdentity?.set({ name, section: period });
    } catch {
      /* identity is an enhancement — never block launching the lesson */
    }
    playLessonEntrance(config, name, () => {
      screen.remove();
      initMainApp(root, config, studentId, name, period);
    });
  }

  setTimeout(() => nameInput.focus(), 100);
}

// ── Lesson entrance: the "ID badge" beat between the name gate and the lesson.
//
// After the student starts, a badge card stamps in over the cover — their name,
// the lesson title, and a bilingual "let's go" — while the real lesson boots
// UNDERNEATH it, so the entrance also hides first-render jank. Three hard
// rules keep it classroom-safe: reduced-motion students skip it entirely (no
// delay, not a still frame); it plays at most once per lesson per day per
// device (30 students log in daily — anything that replays every time gets
// old by Tuesday); and a tap anywhere lifts it early. The lesson must launch
// even if every line of this fails, so the boot callback runs first-class and
// the overlay is pure chrome on top.
function playLessonEntrance(config, name, boot) {
  let overlay = null;
  const lift = () => {
    if (!overlay) return;
    const o = overlay;
    overlay = null;
    o.classList.add("leaving");
    setTimeout(() => o.remove(), 420);
  };
  try {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const key = `nt-entrance:${config.lessonId}`;
    const today = new Date().toISOString().slice(0, 10);
    let seen = null;
    try {
      seen = localStorage.getItem(key);
    } catch {
      /* storage blocked — treat as unseen, it just won't persist */
    }
    if (reduced || seen === today) return boot();
    try {
      localStorage.setItem(key, today);
    } catch {
      /* storage blocked — the entrance simply replays next time */
    }
    overlay = document.createElement("div");
    overlay.className = "nt-entrance-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="nt-entrance-badge">
        <div class="nt-entrance-emoji">${config.themeEmoji || "📐"}</div>
        <p class="nt-entrance-welcome">${stackHtml(`${t("entranceWelcome", "en")} ${name}!`, `${t("entranceWelcome", "es")} ${name}!`)}</p>
        <p class="nt-entrance-title">${escHtml(config.title)}</p>
        <p class="nt-entrance-go">${stackHtml(t("entranceGo", "en"), t("entranceGo", "es"))}</p>
      </div>`;
    overlay.addEventListener("click", lift);
    document.body.append(overlay);
    setTimeout(lift, 1600);
  } catch {
    lift();
  }
  try {
    boot();
  } catch (e) {
    // Never leave a broken lesson hidden behind the entrance card.
    lift();
    throw e;
  }
}

function initMainApp(root, config, studentId, studentName, studentPeriod) {
  const state = createState(config.lessonId, studentId);
  const engagement = createEngagement(state);

  // Expose the running identity so a Student⇄Teacher mode switch can relaunch
  // into the same lesson (and, via restored state, the same phase) instead of
  // falling back to the name-entry screen — see teacher-mode.js stashModeResume()
  // and showIdentityScreen()'s mode-resume block.
  window.__ntLessonSession = {
    lessonId: config.lessonId,
    name: studentName,
    period: studentPeriod || "",
  };

  // Teacher-only "Clear answers" hook (invoked from the Tools menu item in
  // utility-menu.js). Wipes THIS lesson's saved responses/progress on this
  // device in-place and re-renders the current phase blank without reloading
  // or redirecting back to the sign-in screen.
  window.__ntClearLessonAnswers = () => {
    try {
      state.clearAllResponses();
    } catch (_) {
      const phases = state.get().phases || [];
      phases.forEach((_, i) => state.clearPhaseResponses(i));
    }
    try {
      document.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach((input) => {
        if (input.type === "checkbox" || input.type === "radio") input.checked = false;
        else if (input.id !== "studentNameInput" && input.name !== "studentName") input.value = "";
      });
      document
        .querySelectorAll(".is-selected, .is-correct, .is-incorrect, .correct, .wrong, .selected")
        .forEach((el) => {
          el.classList.remove(
            "is-selected",
            "is-correct",
            "is-incorrect",
            "correct",
            "wrong",
            "selected",
          );
        });
    } catch (_) {}
    const cur = state.get().currentPhase ?? 0;
    document.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: cur } }));
  };

  // Per-page teacher "Clear answers" API. Lets the compact control clear the
  // current page, any set of pages, or all pages on this device in-place,
  // re-rendering the active phase blank without reloading or navigating away.
  window.__ntLessonClearApi = {
    phases: () =>
      (state.get().phases || []).map((p, i) => ({ index: i, name: p.name, icon: p.icon })),
    currentPhase: () => state.get().currentPhase ?? 0,
    clearPages: (indices) => {
      (indices || []).forEach((i) => {
        try {
          state.clearPhaseResponses(i);
        } catch (_) {
          /* storage blocked — re-render still blanks the on-screen inputs */
        }
      });
      const cur = state.get().currentPhase ?? 0;
      document.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: cur } }));
    },
    clearAll: () => {
      try {
        state.clearAllResponses();
      } catch (_) {
        const phases = state.get().phases || [];
        phases.forEach((_, i) => state.clearPhaseResponses(i));
      }
      try {
        document
          .querySelectorAll('input:not([type="hidden"]), textarea, select')
          .forEach((input) => {
            if (input.type === "checkbox" || input.type === "radio") input.checked = false;
            else if (input.id !== "studentNameInput" && input.name !== "studentName")
              input.value = "";
          });
        document
          .querySelectorAll(".is-selected, .is-correct, .is-incorrect, .correct, .wrong, .selected")
          .forEach((el) => {
            el.classList.remove(
              "is-selected",
              "is-correct",
              "is-incorrect",
              "correct",
              "wrong",
              "selected",
            );
          });
      } catch (_) {}
      const cur = state.get().currentPhase ?? 0;
      document.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: cur } }));
    },
  };

  if (!state.get().studentName) {
    state.set({ studentName, studentPeriod });
  }

  // Named indices for the phases the pre-lesson tabs hand off to. The tabs
  // used to hardcode raw numbers (3, 2) that no longer matched this list.
  const PHASE_WARMUP = 0;
  const PHASE_LAUNCH = 2;
  const PHASE_EXPLORE = 3;

  const phaseConfigs = [
    { name: phaseName(0), icon: "⚡" }, // Warmup (Phase 1)
    { name: phaseName(1), icon: "🎯" }, // Objectives (Phase 2)
    { name: phaseName(2), icon: "🚀" }, // Launch (Phase 3)
    { name: phaseName(3), icon: "🔍" }, // Explore (Phase 4)
    { name: phaseName(4), icon: "✏️" }, // Practice (Phase 5)
    { name: phaseName(5), icon: "🌎" }, // Connect (Phase 6)
    { name: phaseName(6), icon: "💡" }, // Reflect (Phase 7)
    { name: phaseName(7), icon: "🎯" }, // Objectives (Phase 8)
  ];

  state.initPhases(phaseConfigs);

  // Compact teacher-only "Clear answers" control (also mirrored in the Tools
  // menu). Renders only in teacher mode; no-op for students. Mounted AFTER
  // initPhases so phases() is populated on a fresh lesson — it upgrades the
  // clear-all-only button the cover screen mounts into the full page picker.
  mountTeacherClearButton(window.__ntLessonClearApi);

  const sidebar = buildSidebar(config, state, phaseConfigs);
  const main = document.createElement("div");
  main.className = "main";
  main.setAttribute("role", "main");

  root.append(sidebar, main);

  // ---- Publisher-Grade Accessibility & Drawing Overlay ----
  (function initA11yAndDrawing() {
    // 1. Accessibility Controls
    const a11yBar = document.createElement("div");
    a11yBar.id = "lesson-a11y-bar";
    a11yBar.style.cssText =
      "display:flex; gap:8px; padding:8px 12px; margin-bottom:12px; flex-wrap:wrap; justify-content:center; border-bottom:1px solid rgba(255,255,255,0.1);";
    a11yBar.innerHTML = `
      <button class="pub-btn" id="btn-lesson-read" type="button" style="padding:4px 8px; font-size:11px; flex:1; min-width:80px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:6px; cursor:pointer;">🔊 Read Aloud</button>
      <button class="pub-btn" id="btn-lesson-draw" type="button" style="padding:4px 8px; font-size:11px; flex:1; min-width:80px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:6px; cursor:pointer;">✏️ Draw: OFF</button>
    `;

    // Insert into sidebar before student-info or progress
    const sidebarProgress =
      sidebar.querySelector(".sidebar-progress") || sidebar.querySelector(".student-info");
    if (sidebarProgress) {
      sidebarProgress.parentNode.insertBefore(a11yBar, sidebarProgress);
    } else {
      sidebar.append(a11yBar);
    }

    // Read Aloud toggle handler
    const readBtn = a11yBar.querySelector("#btn-lesson-read");
    readBtn.addEventListener("click", () => {
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        readBtn.textContent = "🔊 Read Aloud";
        readBtn.style.background = "rgba(255,255,255,0.1)";
        return;
      }
      readBtn.textContent = "⏹️ Stop";
      readBtn.style.background = "#ef4444";

      const texts = [];
      document
        .querySelectorAll(".section-title, .section-desc, p, li, h1, h2, h3, .problem-prompt")
        .forEach((el) => {
          if (
            el.offsetParent !== null &&
            !el.closest("#lesson-a11y-bar") &&
            !el.closest(".sidebar")
          ) {
            texts.push(el.textContent.trim());
          }
        });
      const speechText = texts.slice(0, 8).join(". ");
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.onend = () => {
        readBtn.textContent = "🔊 Read Aloud";
        readBtn.style.background = "rgba(255,255,255,0.1)";
      };
      window.speechSynthesis.speak(utterance);
    });

    // 4. Whiteboard Canvas Drawing Overlay
    const canvas = document.createElement("canvas");
    canvas.id = "lesson-drawing-canvas";
    canvas.style.cssText =
      "position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:9998; display:none;";
    // `.main` is `position:static` in the design system, so an absolutely
    // positioned child anchors to the nearest POSITIONED ancestor instead —
    // the canvas was laid out over a different box than the one it measured,
    // which is why ink landed away from the pen. Promote main to a containing
    // block (nothing else about its layout changes).
    if (getComputedStyle(main).position === "static") main.style.position = "relative";
    main.append(canvas);

    // The drawing canvas (z-index 9998) spans the viewport when active and would
    // otherwise paint OVER the sidebar — the sidebar (position:sticky) forms its
    // own stacking context at level 0, so its controls (incl. the Draw toggle)
    // would sit under the canvas and become unclickable, leaving no way to turn
    // drawing back off. Lift the whole sidebar just above the canvas.
    sidebar.style.zIndex = "9999";

    const ctx = canvas.getContext("2d");
    let drawing = false;
    let color = "#ef4444";
    let width = 3;

    // Strokes are kept as point arrays in CSS pixels relative to the canvas
    // box, NOT just painted and forgotten. Assigning canvas.width/height wipes
    // the bitmap, so a resize (or the lesson growing as a phase opens) used to
    // erase everything a student had drawn; with a model we simply repaint.
    /** @type {{color:string,width:number,pts:{x:number,y:number}[]}[]} */
    const strokes = [];
    /** @type {{color:string,width:number,pts:{x:number,y:number}[]}|null} */
    let current = null;

    function paintStroke(s) {
      if (!s.pts.length) return;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      if (s.pts.length === 1) {
        // A single tap is a dot, not nothing.
        ctx.moveTo(s.pts[0].x, s.pts[0].y);
        ctx.lineTo(s.pts[0].x + 0.01, s.pts[0].y);
      } else {
        // Quadratic curves through the midpoints of consecutive samples. A raw
        // lineTo polyline shows every pointer sample as a visible corner, which
        // is what made the ink look ragged; midpoint smoothing costs nothing
        // and renders a continuous line.
        ctx.moveTo(s.pts[0].x, s.pts[0].y);
        for (let i = 1; i < s.pts.length - 1; i++) {
          const mx = (s.pts[i].x + s.pts[i + 1].x) / 2;
          const my = (s.pts[i].y + s.pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(s.pts[i].x, s.pts[i].y, mx, my);
        }
        const last = s.pts[s.pts.length - 1];
        ctx.lineTo(last.x, last.y);
      }
      ctx.stroke();
    }

    function repaint() {
      const r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      strokes.forEach(paintStroke);
      if (current) paintStroke(current);
    }

    function resizeCanvas() {
      // Measure the CANVAS, not `main`: the canvas is the box the ink lands in,
      // and `main`'s clientWidth/Height is a different rectangle once padding
      // and the containing block are taken into account.
      const r = canvas.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      // Back the canvas with real device pixels so lines are crisp instead of
      // upscaled and fuzzy on a retina screen or a projector.
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const w = Math.round(r.width * dpr);
      const h = Math.round(r.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      // One transform, so every coordinate below stays in plain CSS pixels.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      repaint();
    }
    window.addEventListener("resize", resizeCanvas);
    // A lesson grows as phases open; without this the backing store keeps the
    // size it had when Draw was switched on and the ink drifts from the pen.
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(() => {
        if (canvas.style.display !== "none") resizeCanvas();
      }).observe(main);
    }

    function pointFrom(e) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    // Drawing event listeners
    canvas.addEventListener("pointerdown", (e) => {
      // Let taps on real controls pass THROUGH the full-page draw overlay: it
      // otherwise sits over every button in the phase (answer choices, "Check",
      // "Continue to …", "Next") and swallows the tap, so the buttons feel dead
      // whenever Draw is on. Momentarily disable the canvas to see what is under
      // the pointer; if it's an interactive control, forward the click to it and
      // do NOT start a stroke. z-index can't fix this because those buttons live
      // in nested stacking contexts below the canvas.
      canvas.style.pointerEvents = "none";
      const under = document.elementFromPoint(e.clientX, e.clientY);
      canvas.style.pointerEvents = "auto";
      const control =
        under &&
        under.closest(
          "button, a[href], input, select, textarea, label, summary, [role='button'], [role='link'], [role='tab']",
        );
      if (control) {
        control.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true, view: window }),
        );
        return;
      }
      drawing = true;
      current = { color, width, pts: [pointFrom(e)] };
      // Capture keeps the stroke alive when the pointer crosses a child element
      // or briefly leaves the canvas — previously the line just stopped dead.
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* capture unsupported — events still fire */
      }
      e.preventDefault();
      repaint();
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!drawing || !current) return;
      // A fast drag delivers several positions per frame. Reading the coalesced
      // events keeps the corners the browser would otherwise throw away, which
      // is the difference between a smooth arc and a chain of straight chords.
      const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [e];
      for (const ev of events.length ? events : [e]) current.pts.push(pointFrom(ev));
      e.preventDefault();
      repaint();
    });

    function endStroke(e) {
      if (!drawing) return;
      drawing = false;
      if (current && current.pts.length) strokes.push(current);
      current = null;
      if (e && e.pointerId != null) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          /* nothing captured */
        }
      }
      repaint();
    }
    canvas.addEventListener("pointerup", endStroke);
    canvas.addEventListener("pointercancel", endStroke);

    // Drawing Tool controls HUD
    const drawHud = document.createElement("div");
    drawHud.id = "lesson-draw-hud";
    drawHud.style.cssText =
      "position:fixed; bottom:24px; left:270px; background:rgba(15,23,42,0.9); border:1px solid rgba(255,255,255,0.15); border-radius:30px; padding:6px 12px; display:none; gap:8px; z-index:9999; box-shadow:0 6px 18px -8px rgba(0,0,0,0.35);";
    drawHud.innerHTML = `
      <button class="color-btn" data-color="#ef4444" style="width:20px; height:20px; border-radius:50%; border:2px solid #fff; background:#ef4444; cursor:pointer; padding:0;"></button>
      <button class="color-btn" data-color="#3b82f6" style="width:20px; height:20px; border-radius:50%; border:none; background:#3b82f6; cursor:pointer; padding:0;"></button>
      <button class="color-btn" data-color="#10b981" style="width:20px; height:20px; border-radius:50%; border:none; background:#10b981; cursor:pointer; padding:0;"></button>
      <button class="color-btn" data-color="rgba(253,224,71,0.5)" style="width:20px; height:20px; border-radius:50%; border:none; background:#fde047; cursor:pointer; padding:0;"></button>
      <button id="draw-undo-btn" style="background:transparent; border:none; color:#f3f4f6; font-size:12px; font-weight:600; cursor:pointer; margin-left:8px;">Undo</button>
      <button id="draw-clear-btn" style="background:transparent; border:none; color:#f3f4f6; font-size:12px; font-weight:600; cursor:pointer;">Clear</button>
    `;
    document.body.append(drawHud);

    // Color controls wiring
    drawHud.querySelectorAll(".color-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        color = btn.dataset.color;
        width = color.startsWith("rgba") ? 12 : 3; // Highlighter width is larger
        drawHud.querySelectorAll(".color-btn").forEach((b) => (b.style.border = "none"));
        btn.style.border = "2px solid #fff";
      });
    });

    // Undo is only possible now that strokes exist as data. One click removes
    // one whole mark, which is what a student means by "undo".
    drawHud.querySelector("#draw-undo-btn").addEventListener("click", () => {
      strokes.pop();
      repaint();
    });

    drawHud.querySelector("#draw-clear-btn").addEventListener("click", () => {
      strokes.length = 0;
      current = null;
      repaint();
    });

    // Toggle draw mode
    const drawBtn = a11yBar.querySelector("#btn-lesson-draw");
    drawBtn.addEventListener("click", () => {
      const active = canvas.style.display === "none";
      canvas.style.display = active ? "block" : "none";
      drawHud.style.display = active ? "flex" : "none";
      canvas.style.pointerEvents = active ? "auto" : "none";
      drawBtn.textContent = active ? "✏️ Draw: ON" : "✏️ Draw: OFF";
      drawBtn.style.background = active ? "#10b981" : "rgba(255,255,255,0.1)";
      if (active) resizeCanvas();
    });
  })();

  // Floating in-lesson Teacher View panel removed per teacher request — it popped
  // out over the left sidebar and covered lesson content. Teacher pacing/answers
  // remain available on the lesson start screen ("Show teacher pacing & tips")
  // and in the teacher notes. Prepare Supports (right dock) is unaffected.
  // mountTeacherPanel(root, config, state);

  const lessonHero = buildLessonHero(config, state, phaseConfigs);
  main.append(lessonHero);

  const phaseContainer = document.createElement("div");
  phaseContainer.className = "phase-container";
  main.append(phaseContainer);

  const celebrationOverlay = document.createElement("div");
  celebrationOverlay.className = "celebration-overlay";
  celebrationOverlay.setAttribute("aria-hidden", "true");
  document.body.append(celebrationOverlay);

  const minimapHUD = document.createElement("div");
  minimapHUD.className = "minimap-hud";
  minimapHUD.style.cssText =
    // Bottom-LEFT: the bottom-right corner belongs to the Save/Resume pill
    // and the next-phase button (see the dock contract in design-system.css).
    // `left` is deliberately NOT set here — design-system.css offsets it past
    // the phase rail (--nt-rail-w) so the pill cannot cover a phase button's
    // label. An inline left would beat that rule and re-break it.
    "position:fixed; bottom:16px; background:rgba(255,255,255,0.85); backdrop-filter:blur(12px); border:1px solid rgba(0,0,0,0.1); border-radius:50px; padding:10px 14px; gap:8px; z-index:9999; box-shadow:0 6px 18px -8px rgba(15,23,42,0.22); transition:0.3s;";
  document.body.append(minimapHUD);

  // The phase dots PERSIST across renders, and that is the whole point.
  //
  // This used to re-write minimapHUD.innerHTML on every state change, which
  // replaced each dot with a brand-new element. A CSS transition can only
  // animate from a previous value on the SAME node, so the `transition: 0.3s`
  // these dots declared never ran once — the map snapped between phases while
  // appearing, in source, to glide. Keeping the nodes and mutating only their
  // colour and scale lets that transition finally play, so the map travels
  // alongside the phase slide instead of teleporting after it.
  //
  // They are also <button>s now rather than divs carrying an inline onclick:
  // the dots are real navigation, and a div is not reachable by keyboard.
  let minimapDots = [];
  function updateMinimap() {
    const s = state.get();
    if (minimapDots.length !== s.phases.length) {
      minimapHUD.innerHTML = "";
      minimapDots = s.phases.map((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "minimap-dot";
        dot.title = `Phase ${i + 1}`;
        dot.setAttribute("aria-label", `Go to phase ${i + 1}`);
        dot.style.cssText =
          "width:12px; height:12px; padding:0; border:0; border-radius:50%; cursor:pointer;" +
          "transition:background-color 0.3s ease, transform 0.3s ease;";
        dot.addEventListener("click", () =>
          document.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: i } })),
        );
        minimapHUD.append(dot);
        return dot;
      });
    }
    s.phases.forEach((p, i) => {
      const dot = minimapDots[i];
      if (!dot) return;
      const isCurrent = i === s.currentPhase;
      dot.style.backgroundColor = isCurrent
        ? "#387F84"
        : p.status === "completed"
          ? "#F2A93B"
          : "rgba(0,0,0,0.1)";
      dot.style.transform = isCurrent ? "scale(1.2)" : "scale(1)";
      dot.setAttribute("aria-current", isCurrent ? "step" : "false");
    });
  }

  state.subscribe(() => {
    updateSidebar(sidebar, state, phaseConfigs);
    updateLessonHero(lessonHero, state, phaseConfigs);
    updateMinimap();
  });

  let scoreReported = false;
  state.subscribe(() => {
    if (scoreReported) return;
    const phases = state.get().phases;
    if (phases.length && phases.every((p) => p.status === "completed")) {
      scoreReported = true;
      if (window.AudioSynth) window.AudioSynth.tada();
      if (window.fireConfetti) window.fireConfetti();
      ensureEduPulse().finally(() => reportScore(state, config));
      completeLesson(state, config);
    }
  });

  // Interim grade: fire to Canvas/LTI when exit ticket (Phase 7 Reflect) is done,
  // so teachers see grades without waiting for Phase 8 Objectives Review.
  let exitTicketReported = false;
  state.subscribe(() => {
    if (exitTicketReported) return;
    const phases = state.get().phases;
    if (phases.length > 6 && phases[6]?.status === "completed") {
      exitTicketReported = true;
      reportExitTicketScore(state, config);
    }
  });

  updateSidebar(sidebar, state, phaseConfigs);
  updateLessonHero(lessonHero, state, phaseConfigs);
  updateMinimap();

  const app = {
    state,
    engagement,
    main,
    phaseContainer,
    celebrationOverlay,

    renderPhase(index, renderFn, jump) {
      closeMathNotesModel();
      applyPhaseAccent(main, index);
      // Stop watching the phase we're replacing so its observer doesn't linger.
      if (this._vocabObserver) {
        this._vocabObserver.disconnect();
        this._vocabObserver = null;
      }
      phaseContainer.innerHTML = "";
      const el = document.createElement("div");
      // Direction-aware slide: moving forward enters from the right, jumping
      // back (sidebar, minimap) enters from the left — the content moves the
      // way the student moved along the phase strip, so the transition reads
      // as travel instead of decoration. Same 0.45s, same reduced-motion off
      // switch as the original single-direction phase-enter.
      const backward = this._lastRenderedPhase != null && index < this._lastRenderedPhase;
      this._lastRenderedPhase = index;
      el.className = `phase active phase-enter${backward ? " phase-enter-back" : ""}`;
      el.setAttribute("role", "region");
      el.setAttribute("aria-label", phaseConfigs[index]?.name || `Phase ${index + 1}`);
      phaseContainer.append(el);
      renderFn(el, state, this);

      // Mount subcards ribbon for 1-click jumps between lesson parts
      const PHASE_SUBCARDS = {
        0: [
          { extra: "mathnotes", icon: "📓", label: "Math Notes" },
          { jump: ".card", icon: "⚡", label: "Warmup" },
        ],
        1: [
          { jump: ".card", icon: "🎯", label: "Goals" },
        ],
        2: [
          { extra: "vocab", icon: "🔑", label: "Vocab" },
          { extra: "learn", icon: "💡", label: "Learn It" },
          { extra: "watchme", icon: "👀", label: "Watch Me" },
        ],
        3: [
          { jump: ".card", icon: "🤝", label: "Guided Practice" },
        ],
        4: [
          { level: "1", icon: "🟢", label: "Level 1" },
          { level: "2", icon: "🔵", label: "Level 2" },
          { level: "3", icon: "🟣", label: "Level 3" },
        ],
        5: [
          { jump: ".card", icon: "👥", label: "Small Group" },
        ],
        6: [
          { jump: ".card", icon: "📝", label: "Exit Ticket" },
        ],
        7: [
          { jump: ".card", icon: "🏆", label: "Mastery" },
        ],
      };

      const subcards = PHASE_SUBCARDS[index] || [];
      if (subcards.length > 0) {
        const isEs = getPreferredLang() === "es";
        const ribbon = document.createElement("div");
        ribbon.className = "phase-subcards-ribbon no-print";
        ribbon.setAttribute("role", "navigation");
        ribbon.setAttribute("aria-label", "Lesson sub-parts");
        ribbon.innerHTML = `
          <span class="phase-subcards-label">📍 ${isEs ? "Partes:" : "Subcards:"}</span>
          <div class="phase-subcards-list">
            ${subcards
              .map(
                (t) => `
              <button type="button" class="phase-subcard-chip" ${t.extra ? `data-sub-extra="${t.extra}"` : t.level ? `data-sub-level="${t.level}"` : `data-sub-jump="${t.jump}"`}>
                <span class="phase-subcard-icon">${t.icon}</span> <span>${escHtml(t.label)}</span>
              </button>`,
              )
              .join("")}
          </div>
        `;
        ribbon.querySelectorAll("[data-sub-extra]").forEach((b) => {
          b.addEventListener("click", () => this.openExtra(b.dataset.subExtra));
        });
        ribbon.querySelectorAll("[data-sub-level]").forEach((b) => {
          b.addEventListener("click", () => {
            const lvl = b.dataset.subLevel;
            const targetBtn = el.querySelector(`.practice-level-btn[data-level="${lvl}"], [data-level="${lvl}"]`);
            if (targetBtn) targetBtn.click();
          });
        });
        ribbon.querySelectorAll("[data-sub-jump]").forEach((b) => {
          b.addEventListener("click", () => {
            const sel = b.dataset.subJump;
            const target = el.querySelector(sel);
            if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        });

        const header = el.querySelector(".phase-title, .lesson-hero, .phase-header, h1");
        if (header && header.parentElement) {
          header.insertAdjacentElement("afterend", ribbon);
        } else {
          el.prepend(ribbon);
        }
      }

      // Auto-scroll to top smoothly on phase navigation so the student's attention
      // immediately lands on the new phase header.
      if (main) main.scrollTo({ top: 0, behavior: "smooth" });
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Plain-words pass runs BEFORE the vocabulary underliner. It rewrites text
      // nodes, and the underliner replaces matched terms with tappable glossary
      // spans — doing it the other way round would rewrite the glossary markup
      // instead of the prose. Today's vocabulary is passed through as protected
      // terms so the words the lesson is TEACHING are never paraphrased away.
      const protectedTerms = (config.vocabulary || []).map((v) => v?.term).filter(Boolean);
      window.__ntProtectedTerms = protectedTerms;
      if (isPlainLanguageOn()) applyPlainLanguage(el, true, protectedTerms);
      // Underline every lesson-vocabulary term in the rendered phase body and
      // wire it to the tap-to-open glossary popup (EN/ES + illustration), so
      // academic math words are defined in context throughout the lesson — the
      // same treatment the small-group renderer gives (e.g. 7-2-group2).
      // Augment the lesson's own vocabulary with the shared math glossary so a
      // math word opens its definition+image popup wherever it appears — not only
      // in lessons that happen to list it. Lesson entries win on any duplicate.
      const glossaryVocab = augmentVocabWithGlossary(config.vocabulary);
      underlineVocabTerms(el, glossaryVocab);
      // Practice serves problems one at a time, the level selector re-serves,
      // and matching/optional activities mount their own markup after this
      // point — keep underlining that dynamically-added content too.
      this._vocabObserver = observeVocabTerms(el, glossaryVocab);
      el.addEventListener(
        "animationend",
        () => el.classList.remove("phase-enter", "phase-enter-back"),
        { once: true },
      );
    },

    navigateTo(index, jump) {
      // THE gate. Every way out of a phase — Continue, the sidebar, a minimap
      // dot, an in-phase control — arrives here, so a notebook checkpoint is
      // enforced once, in one place, by phase INDEX. Backward moves are never
      // blocked.
      const from = state.get().currentPhase ?? 0;
      if (!canLeavePhase(config, from, index)) {
        announceBlocked(config, from);
        return false;
      }
      closeMathNotesModel();
      this.clearExtraActive();
      state.setPhase(index);
      if (config.phases[index]) {
        this.renderPhase(index, config.phases[index], jump);
      }
    },

    // Canonical forward navigation for controls rendered inside a phase. Some
    // lesson sections (Warmup and Objectives) previously called this API even
    // though it did not exist, leaving their bottom Continue buttons inert.
    // Resolve the next index from live state so the same control works after a
    // resume, a sidebar jump, or future phase insertions.
    nextPhase() {
      const current = state.get().currentPhase ?? 0;
      const next = current + 1;
      if (next >= config.phases.length) return false;
      // navigateTo returns false when a notebook checkpoint blocks the move, and
      // that answer belongs to the caller: a Continue button must not report a
      // successful advance that did not happen.
      return this.navigateTo(next) !== false;
    },

    // Mark/unmark which (if any) pre-lesson tab is currently being viewed.
    setExtraActive(kind) {
      sidebar
        .querySelectorAll(".extra-btn")
        .forEach((b) => b.classList.toggle("active", b.dataset.extra === kind));
      sidebar.setAttribute("data-viewing-extra", kind || "");
      // Vocab, Learn It, and Guided Notes open as a full-viewport takeover; lock
      // the page behind it so there's no double scrollbar and it sits truly
      // edge-to-edge. Every panel transition (openExtra/openProjects/…/
      // navigateTo→clearExtraActive) routes through here, so this both sets and
      // clears the lock.
      document.documentElement.classList.toggle(
        "nt-extra-fullpage-open",
        kind === "vocab" || kind === "learn" || kind === "notes",
      );
    },
    clearExtraActive() {
      closeMathNotesModel();
      this.setExtraActive(null);
    },

    // Render a pre-lesson material (Readiness or Guided Notes) inline in the
    // lesson shell. Non-graded: this never touches phase state, XP, or stars —
    // the student's place in the graded flow is preserved underneath.
    openExtra(kind) {
      // The canonical Math Notes model opens OVER the lesson rather than
      // replacing the phase body — a student checking the page layout has not
      // left the lesson and loses nothing on screen.
      if (kind === "mathnotes") return openMathNotesModel(config);
      if (kind === "projects") return this.openProjects();
      if (kind === "printables") return this.openPrintables();
      if (kind === "activity") return this.openActivity();
      if (kind === "objectives") return this.openObjectives();
      if (kind === "watchme") {
        this.openExtra("learn");
        setTimeout(() => {
          const w = phaseContainer.querySelector(".vl-step-crumbs, .vl-stage-think, .vl-solve-steps, [data-learn-step]");
          if (w) w.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
        return;
      }

      if (kind === "vocab") {
        this.setExtraActive("vocab");
        phaseContainer.innerHTML = "";
        const el = document.createElement("div");
        el.className = "phase active extra-panel extra-panel--fullpage";
        // Focusable (never in the tab order) so the takeover — which scrolls
        // inside itself while the document scroller is locked — responds to the
        // keyboard as soon as it opens.
        el.tabIndex = -1;
        el.setAttribute("role", "region");
        el.setAttribute("aria-label", "Vocabulary");
        phaseContainer.append(el);
        renderVocabPanel(el, config, {
          state,
          onComplete: () => this.openExtra("learn"),
        });
        // Term Match, Fill-the-Blanks, Example Sort and Memory Match all exist,
        // but the only place they were rendered was the end-of-lesson completion
        // screen — a student had to finish all eight phases before the word games
        // for this lesson's vocabulary appeared. They belong next to the words
        // they practise, so the same chooser is offered here too, in vocab-only
        // mode (the word wall is already above it, and Extra Practice is not a
        // vocabulary activity). Ungraded, exactly as on the completion screen.
        const vocabGames = document.createElement("div");
        vocabGames.style.cssText = "margin-top:var(--sp-6, 24px);";
        renderActivityChooser(vocabGames, { config, only: "vocab" });
        if (vocabGames.childNodes.length) el.append(vocabGames);
        el.append(chainContinueButton("Continue to Learn It 📖 →", () => this.openExtra("learn")));
        el.scrollIntoView({ block: "start" });
        el.focus?.({ preventScroll: true });
        return;
      }

      if (kind === "learn" || kind === "notes") {
        this.setExtraActive(kind);
        phaseContainer.innerHTML = "";
        const el = document.createElement("div");
        el.className = "phase active extra-panel extra-panel--fullpage";
        // Focusable (never in the tab order) so the takeover — which scrolls
        // inside itself while the document scroller is locked — responds to the
        // keyboard as soon as it opens.
        el.tabIndex = -1;
        el.setAttribute("role", "region");
        el.setAttribute("aria-label", "Learn It");
        phaseContainer.append(el);
        renderLearnItPanel(el, config, {
          // Canonical lesson order: Launch → Vocab → Learn It → Explore.
          // Learn It is pre-work for Explore, so it hands off to EXPLORE
          // (phase index 3), not Practice — sending a student straight to
          // Practice skipped the Explore phase entirely.
          state,
          onComplete: () => this.navigateTo(PHASE_EXPLORE),
          // The application scenario + Show Your Work moved out of Launch to
          // live under Learn It. This branch predates the
          // ctx.renderLearnItExtras hook and never called it, so the moved
          // content rendered NOWHERE — the panel now hosts it as its final
          // "Apply It" step. Called directly (not via the hook) because the
          // hook is only assigned once the Launch phase has rendered.
          renderExtras: (host) => renderLearnItExtrasInto(host, config, state),
        });
        el.append(
          chainContinueButton("Continue to Explore 🔍 →", () => this.navigateTo(PHASE_EXPLORE)),
        );
        el.scrollIntoView({ block: "start" });
        el.focus?.({ preventScroll: true });
        return;
      }
      const id = encodeURIComponent(config.lessonId);
      const gn = config.graphicNovel || {};
      const meta =
        kind === "graphicnovel"
          ? {
              src: gn.href,
              full: gn.href,
              icon: "📖",
              title: gn.title || "Graphic Novel",
              desc:
                gn.desc ||
                "Read the Axiom City episode for this lesson — solve the math to turn the page. Open full page for the best experience.",
            }
          : kind === "learn"
            ? {
                src: `/lessons/${id}/learn.html?embed=1`,
                full: `/lessons/${id}/learn.html`,
                icon: "📖",
                title: "Learn It",
                desc: "How the math works — read this and see it solved step by step before you practice.",
              }
            : kind === "vocab"
              ? {
                  src: `/lessons/${id}/vocab.html?embed=1`,
                  full: `/lessons/${id}/vocab.html`,
                  icon: "🔑",
                  title: "Vocab",
                  desc: "The key words for this lesson — word, plain-language meaning, and a picture.",
                }
              : kind === "readiness"
                ? {
                    src: `/lessons/${id}/readiness/?embed=1`,
                    full: `/lessons/${id}/readiness/`,
                    icon: "📚",
                    title: "Get Ready",
                    desc: "A quick check of the skills you need first — not graded.",
                  }
                : {
                    src: `/lessons/${id}/notes.html?embed=1`,
                    full: `/lessons/${id}/notes.html`,
                    icon: "📝",
                    title: "Guided Notes",
                    desc: "Read along and fill these in. Use Print for a paper copy.",
                  };

      // Vocab, Learn It, and Guided Notes open as an immersive full-viewport
      // takeover that stays on the same page (no separate tab). The panel still
      // lives inside phaseContainer, so navigating to any phase/tab tears it
      // down for free.
      const fullPage = kind === "vocab" || kind === "learn" || kind === "notes";

      this.setExtraActive(kind);
      phaseContainer.innerHTML = "";
      const el = document.createElement("div");
      el.className = "phase active extra-panel" + (fullPage ? " extra-panel--fullpage" : "");
      el.tabIndex = -1;
      el.setAttribute("role", "region");
      el.setAttribute("aria-label", meta.title);
      const frameStyle = fullPage
        ? "width:100%; height:calc(100vh - 64px); min-height:520px; border:0; border-radius:0; background:var(--card, #fff);"
        : "width:100%; height:calc(100vh - 190px); min-height:560px; border:1px solid var(--line, #e4ddc9); border-radius:var(--radius-md, 12px); background:var(--card, #fff);";
      // On the full-page takeover the same-page view IS the full experience, so
      // the "open in a new tab" affordance is replaced by a Close button.
      const trailingAction = fullPage
        ? `<button class="btn btn-secondary" data-act="close">✕ Close</button>`
        : `<a class="btn btn-secondary" href="${meta.full}" target="_blank" rel="noopener">Open full page ↗</a>`;
      el.innerHTML = `
        <div class="extra-head" style="display:flex; flex-wrap:wrap; gap:var(--sp-3, 12px); align-items:center; justify-content:space-between; margin-bottom:var(--sp-3, 12px);">
          <div>
            <div class="section-title" style="font-size:1.6rem;">${meta.icon} ${escHtml(meta.title)}</div>
            <div class="section-desc">${escHtml(meta.desc)}</div>
          </div>
          <div class="extra-actions" style="display:flex; gap:var(--sp-2, 8px); flex-wrap:wrap;">
            ${kind === "notes" || kind === "learn" || kind === "vocab" ? `<button class="btn btn-secondary" data-act="print">🖨️ Print</button>` : ""}
            ${trailingAction}
          </div>
        </div>
        <iframe class="extra-frame" title="${escHtml(meta.title)}" src="${meta.src}"
          style="${frameStyle}"></iframe>
      `;
      phaseContainer.append(el);

      const frame = el.querySelector(".extra-frame");
      const printBtn = el.querySelector('[data-act="print"]');
      // Close / Escape return to the graded lesson underneath (state untouched).
      if (fullPage) {
        const closeToLesson = () => this.navigateTo(state.get().currentPhase ?? 0);
        const closeBtn = el.querySelector('[data-act="close"]');
        if (closeBtn) closeBtn.addEventListener("click", closeToLesson);
        const onKey = (e) => {
          if (!document.body.contains(el)) {
            document.removeEventListener("keydown", onKey);
            return;
          }
          if (e.key === "Escape") {
            document.removeEventListener("keydown", onKey);
            closeToLesson();
          }
        };
        document.addEventListener("keydown", onKey);
      }
      if (printBtn) {
        printBtn.addEventListener("click", () => {
          try {
            frame.contentWindow.focus();
            frame.contentWindow.print();
          } catch (_e) {
            window.open(meta.full, "_blank", "noopener");
          }
        });
      }

      // ── Curated forward flow: Launch → Vocab → Notes → Launch → Explore ──────
      const addContinue = (label, onClick) => {
        const wrap = document.createElement("div");
        wrap.style.cssText =
          "margin-top:var(--sp-4, 16px); text-align:center; padding-bottom:24px;";
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn btn-primary btn-lg";
        b.style.cssText =
          "padding:14px 28px; font-weight:700; font-size:1.05rem; background:#14223a; color:#fff; border:none; border-radius:12px; cursor:pointer;";
        b.textContent = label;
        b.addEventListener("click", onClick);
        wrap.append(b);
        el.append(wrap);
      };

      // Each tab's bottom button moves to the NEXT thing in the lesson chain:
      // Launch → Vocab → Learn It → Explore. Vocab used to jump to Guided Notes
      // (skipping Learn It entirely) and Learn It used to go back to Launch, so
      // neither button did what its position implied. Guided Notes is a side
      // tab, not a link in the chain, so it still returns to Launch.
      if (kind === "readiness") {
        // Get Ready is the on-ramp to the Warm-Up, so finishing it moves the
        // student on WITHOUT leaving the page: the embedded readiness page
        // posts `nt-readiness-complete` when its exit ticket is done (or when
        // the student presses "Continue to Warm-Up"), and we swap the panel
        // for the Warm-Up phase in place. The button below is the same door
        // for anyone who wants to move on early.
        const toWarmup = () => {
          window.removeEventListener("message", onReadinessMessage);
          this.navigateTo(PHASE_WARMUP);
        };
        const onReadinessMessage = (e) => {
          if (!document.body.contains(el)) {
            window.removeEventListener("message", onReadinessMessage);
            return;
          }
          if (e.origin !== window.location.origin) return;
          if (e.source !== frame.contentWindow) return;
          if (e.data?.type !== "nt-readiness-complete") return;
          toWarmup();
        };
        window.addEventListener("message", onReadinessMessage);
        addContinue("Continue to Warm-Up ⚡ →", toWarmup);
      } else if (kind === "vocab") {
        addContinue("Continue to Learn It 📖 →", () => this.openExtra("learn"));
      } else if (kind === "learn") {
        this.renderLearnItExtras?.(el);
        addContinue("Continue to Explore 🔍 →", () => {
          try {
            state.set({ notesVisited: true });
          } catch (_) {}
          this.navigateTo(PHASE_EXPLORE);
        });
      } else if (kind === "notes") {
        addContinue("Continue to Launch 🚀 →", () => {
          try {
            state.set({ notesVisited: true });
          } catch (_) {}
          this.navigateTo(PHASE_LAUNCH);
        });
      }

      el.scrollIntoView({ block: "start" });
      el.focus?.({ preventScroll: true });
    },

    // Objectives: a non-graded pre-lesson page (between Get Ready and Notes)
    // that shows today's Content + Language objectives in student-friendly
    // wording, with a "Talk about it" discussion prompt and sentence starter
    // under each so students can unpack what the goals mean before starting.
    // Objectives are resolved from the lesson config (contentObjective /
    // languageObjective), so this stays in sync with the Launch header and the
    // notes. Non-graded: never touches phase state, XP, or stars.
    openObjectives() {
      // resolveContentObjective / resolveLanguageObjective return text that is
      // already HTML-escaped, so insert directly (do not re-escape).
      const content = resolveContentObjective(config);
      const language = resolveLanguageObjective(config);
      const objectiveVocab = augmentVocabWithGlossary(config.vocabulary);

      this.setExtraActive("objectives");
      phaseContainer.innerHTML = "";
      const el = document.createElement("div");
      el.className = "phase active extra-panel";
      el.setAttribute("role", "region");
      el.setAttribute("aria-label", "Objectives");

      // Underline + bold the lesson's key math words wherever they appear in an
      // objective, so English learners can spot the academic vocabulary.
      const _highlightKeyWords = (text) => {
        const terms = (Array.isArray(config.vocabulary) ? config.vocabulary : [])
          .map((v) => v && v.term)
          .filter(Boolean)
          .sort((a, b) => b.length - a.length);
        let out = String(text);
        terms.forEach((term) => {
          const e = escHtml(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          out = out.replace(new RegExp("\\b(" + e + ")\\b", "gi"), '<u class="obj-key">$1</u>');
        });
        return out;
      };

      const objectiveCard = ({ accent, color, icon, label, text, key, prompt, starter }) =>
        `<div class="card ${accent} obj-card" style="margin-bottom:var(--sp-4, 18px); padding:var(--sp-5, 22px);">
          <div style="font-size:1.15rem; font-weight:700; color:var(${color}); margin-bottom:var(--sp-2, 8px);">${icon} ${label}</div>
          <p style="margin:0 0 var(--sp-4, 18px); font-size:1.45rem; line-height:1.6; font-weight:500; color:var(--navy, #264653);">${linkifyObjectiveTerms(text, objectiveVocab)}</p>
          <div style="display:flex; flex-direction:column; gap:var(--sp-2, 8px); background:#fff; border:2px solid var(${color}); border-radius:var(--radius-md, 12px); padding:var(--sp-3, 14px) var(--sp-4, 18px); margin-bottom:var(--sp-3, 12px);">
            <div style="font-weight:700; color:var(--navy, #264653); font-size:1.05rem;">Can I do this?</div>
            <label style="display:flex; align-items:center; gap:10px; font-size:1.2rem; cursor:pointer;"><input type="checkbox" data-obj-check="${key}-before" style="width:22px; height:22px; flex:0 0 auto;" /> <span>⏱️ <strong>Before</strong> the lesson — I can do this.</span></label>
            <label style="display:flex; align-items:center; gap:10px; font-size:1.2rem; cursor:pointer;"><input type="checkbox" data-obj-check="${key}-after" style="width:22px; height:22px; flex:0 0 auto;" /> <span>✅ <strong>After</strong> the lesson — I can do this now!</span></label>
          </div>
          <div class="objective-talk" style="background:var(--cream, #fdf3e0); border:1px solid var(--gold, #d4952a); border-radius:var(--radius-md, 12px); padding:var(--sp-3, 12px) var(--sp-4, 16px);">
            <div style="font-weight:700; color:var(--navy, #264653); margin-bottom:var(--sp-1, 4px);">💬 Talk about it</div>
            <p style="margin:0 0 var(--sp-2, 8px); font-size:1.1rem;">${prompt}</p>
            <p style="margin:0; font-style:italic; color:var(--navy, #264653); font-size:1.1rem;">Say: "${starter}"</p>
          </div>
        </div>`;

      el.innerHTML = `
        <style>.obj-key{ text-decoration-thickness:2px; text-underline-offset:2px; font-weight:700; color:var(--navy, #264653); }</style>
        <div class="extra-head" style="margin-bottom:var(--sp-4, 18px);">
          <div>
            <div class="section-title" style="font-size:2rem;">🎯 Today's Goals</div>
            <div class="section-desc" style="font-size:1.1rem;">Read each goal. <strong>Tap</strong> an <u class="obj-key">underlined</u> word to see what it means in English and Spanish. Check a box before we start, and again at the end.</div>
          </div>
        </div>
        ${objectiveCard({
          accent: "card-teal",
          color: "--teal",
          icon: "📘",
          label: "Content Objective — What I will learn",
          text: content,
          key: "content",
          prompt:
            "Turn and talk: In your own words, what will you be able to do by the end of this lesson?",
          starter: "By the end of today, I will be able to ______.",
        })}
        ${objectiveCard({
          accent: "card-coral",
          color: "--coral",
          icon: "🗣️",
          label: "Language Objective — Words I will use",
          text: language,
          key: "language",
          prompt:
            "Turn and talk: Which math words will you use today, and what do you think they mean?",
          starter: "One math word I will use is ______. I think it means ______.",
        })}
      `;
      phaseContainer.append(el);

      // Make the underlined vocab terms tap-to-open the glossary popup here too,
      // exactly like the Launch objectives (shared engine machinery) —
      // definition only; the objective's picture opens from the picture itself.
      wireObjectiveTermPopups(el, objectiveVocab);

      // Persist the before/after self-check on this device.
      const objKey = "nt-obj:" + config.lessonId;
      let objStore = {};
      try {
        objStore = JSON.parse(localStorage.getItem(objKey) || "{}") || {};
      } catch (_e) {}
      el.querySelectorAll("[data-obj-check]").forEach((cb) => {
        const k = cb.getAttribute("data-obj-check");
        cb.checked = !!objStore[k];
        cb.addEventListener("change", () => {
          objStore[k] = cb.checked;
          try {
            localStorage.setItem(objKey, JSON.stringify(objStore));
          } catch (_e) {}
        });
      });

      el.scrollIntoView({ block: "start" });
      el.focus?.({ preventScroll: true });
    },

    // Bonus Activity: the lesson's named TPT-style activity
    // (config.practice.optionalActivity + config.practice.optional). Opens
    // inline from the lesson menu so students can launch it directly instead of
    // only at the end of Practice. Non-graded: never touches phase state, XP, or
    // stars. No-op when the lesson has no optional activity.
    openActivity() {
      const act = config.practice && config.practice.optionalActivity;
      const items =
        config.practice && Array.isArray(config.practice.optional) ? config.practice.optional : [];
      if (!act || !items.length) return;

      this.setExtraActive("activity");
      phaseContainer.innerHTML = "";
      const el = document.createElement("div");
      el.className = "phase active extra-panel";
      el.setAttribute("role", "region");
      el.setAttribute("aria-label", act.name || "Bonus Activity");
      el.innerHTML = `
        <div class="extra-head" style="display:flex; flex-wrap:wrap; gap:var(--sp-3, 12px); align-items:center; justify-content:space-between; margin-bottom:var(--sp-3, 12px);">
          <div>
            <div class="section-title" style="font-size:1.6rem;">${escHtml((act.emoji ? act.emoji + " " : "") + (act.name || "Bonus Activity"))}</div>
            <div class="section-desc">${escHtml(act.intro || "A bonus challenge activity — not graded.")}</div>
          </div>
          <div><span class="badge badge-teal">Bonus · Ungraded</span></div>
        </div>
        <div class="activity-run"></div>`;
      phaseContainer.append(el);

      const host = el.querySelector(".activity-run");
      runComponentList(host, items, renderComponent, () => {
        const done = document.createElement("div");
        done.className = "feedback feedback-success visible";
        done.style.cssText = "margin-top:var(--sp-3, 12px);";
        done.innerHTML = `<span class="feedback-icon">✓</span><span>Activity complete — nice work!</span>`;
        host.append(done);
      });
      el.scrollIntoView({ block: "start" });
      el.focus?.({ preventScroll: true });
    },

    // Projects: a non-graded "extend" tab present on every lesson. Filled in
    // per-lesson via config.projects (added as projects get built). Each project
    // links out to a standalone activity/game; shows a friendly empty state when
    // a lesson has no projects yet. Never touches phase state, XP, or stars.
    openProjects() {
      const projects = Array.isArray(config.projects) ? [...config.projects] : [];
      // Auto-append this unit's culminating project (mapped by verified subject)
      // after any lesson-specific projects, unless it is already listed.
      const unitHref = UNIT_CULMINATING_PROJECT[config.unit];
      if (
        unitHref &&
        !projects.some(
          (p) =>
            p.href === unitHref ||
            (Array.isArray(p.links) && p.links.some((l) => l.href === unitHref)),
        )
      ) {
        projects.push({
          emoji: "🏆",
          title: "Unit Culminating Projects",
          desc: "Multi-day projects that bring this unit's skills together.",
          href: unitHref,
        });
      }
      this.setExtraActive("projects");
      phaseContainer.innerHTML = "";
      const el = document.createElement("div");
      el.className = "phase active extra-panel";
      el.setAttribute("role", "region");
      el.setAttribute("aria-label", "Projects");

      const card = (p) => {
        const links = Array.isArray(p.links)
          ? p.links
          : p.href
            ? [{ label: p.label || "Open", href: p.href }]
            : [];
        return `
          <div class="project-card" style="border:1px solid var(--line, #e4ddc9); border-radius:var(--radius-md, 12px); background:var(--card, #fff); padding:var(--sp-4, 16px); display:flex; flex-direction:column; gap:var(--sp-2, 8px);">
            <div style="font-size:1.8rem; line-height:1;">${escHtml(p.emoji || "🎮")}</div>
            <div style="font-weight:700; font-size:1.1rem; color:var(--navy, #264653);">${escHtml(p.title || "Project")}</div>
            ${p.desc ? `<div class="section-desc" style="font-size:0.9rem;">${escHtml(p.desc)}</div>` : ""}
            <div style="display:flex; flex-wrap:wrap; gap:var(--sp-2, 8px); margin-top:auto; padding-top:var(--sp-2, 8px);">
              ${links
                .map(
                  (l) =>
                    `<a class="btn btn-secondary" href="${escHtml(l.href)}" target="_blank" rel="noopener">${escHtml(l.label || "Open")} ↗</a>`,
                )
                .join("")}
            </div>
          </div>`;
      };

      const body = projects.length
        ? `<div class="project-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:var(--sp-3, 12px);">${projects.map(card).join("")}</div>`
        : `<div class="project-empty" style="text-align:center; padding:var(--sp-6, 32px) var(--sp-4, 16px); border:2px dashed var(--line, #e4ddc9); border-radius:var(--radius-md, 12px); background:var(--cream, #fdf6ec);">
            <div style="font-size:2.4rem;">🚧</div>
            <div style="font-weight:700; font-size:1.15rem; color:var(--navy, #264653); margin-top:var(--sp-2, 8px);">Projects coming soon</div>
            <div class="section-desc" style="max-width:46ch; margin:var(--sp-2, 8px) auto 0;">Hands-on projects and challenge games for this lesson will appear here as they are built. Check back soon!</div>
          </div>`;

      el.innerHTML = `
        <div class="extra-head" style="display:flex; flex-wrap:wrap; gap:var(--sp-3, 12px); align-items:center; justify-content:space-between; margin-bottom:var(--sp-3, 12px);">
          <div>
            <div class="section-title" style="font-size:1.6rem;">🛠️ Projects</div>
            <div class="section-desc">Hands-on projects and challenge games for this lesson — explore and have fun. Not graded.</div>
          </div>
        </div>
        ${body}
      `;
      phaseContainer.append(el);
      el.scrollIntoView({ block: "start" });
      el.focus?.({ preventScroll: true });
    },

    // Printables: a non-graded "extra" tab listing this lesson's print-ready
    // paper resources (paper game/activity, color-by-number, vocabulary word
    // search, MCAP-style practice) from config.printables. Each card has a
    // Preview button (PDFs load inline below) plus Download buttons. Never
    // touches phase state, XP, or stars. No-op when the lesson has none.
    openPrintables() {
      const items = Array.isArray(config.printables) ? config.printables : [];
      if (!items.length) return;

      this.setExtraActive("printables");
      phaseContainer.innerHTML = "";
      const el = document.createElement("div");
      el.className = "phase active extra-panel";
      el.setAttribute("role", "region");
      el.setAttribute("aria-label", "Printables");

      const card = (p, i) => {
        const chips = [p.type, p.standard].filter(Boolean);
        return `
          <div class="printable-card" style="border:1px solid var(--line, #e4ddc9); border-radius:var(--radius-md, 12px); background:var(--card, #fff); padding:var(--sp-4, 16px); display:flex; flex-direction:column; gap:var(--sp-2, 8px);">
            <div style="font-size:1.8rem; line-height:1;">${escHtml(p.emoji || "📄")}</div>
            <div style="font-weight:700; font-size:1.05rem; color:var(--navy, #264653);">${escHtml(p.name || "Printable")}</div>
            ${p.desc ? `<div class="section-desc" style="font-size:0.9rem;">${escHtml(p.desc)}</div>` : ""}
            ${
              chips.length
                ? `<div style="display:flex; flex-wrap:wrap; gap:var(--sp-1, 4px);">${chips
                    .map(
                      (c) =>
                        `<span style="font-size:0.72rem; font-weight:600; background:var(--cream, #fdf6ec); border:1px solid var(--line, #e4ddc9); border-radius:999px; padding:2px 10px; color:var(--navy, #264653);">${escHtml(c)}</span>`,
                    )
                    .join("")}</div>`
                : ""
            }
            <div style="display:flex; flex-wrap:wrap; gap:var(--sp-2, 8px); margin-top:auto; padding-top:var(--sp-2, 8px);">
              ${p.pdf ? `<button class="btn btn-secondary" data-preview="${i}">👁️ Preview</button>` : ""}
              ${p.pdf ? `<a class="btn btn-secondary" href="${escHtml(p.pdf)}" download>📄 PDF</a>` : ""}
              ${p.docx ? `<a class="btn btn-secondary" href="${escHtml(p.docx)}" download>📝 Word</a>` : ""}
            </div>
          </div>`;
      };

      el.innerHTML = `
        <div class="extra-head" style="display:flex; flex-wrap:wrap; gap:var(--sp-3, 12px); align-items:center; justify-content:space-between; margin-bottom:var(--sp-3, 12px);">
          <div>
            <div class="section-title" style="font-size:1.6rem;">🖨️ Printables</div>
            <div class="section-desc">Print-ready paper games and practice for this lesson — preview here or download to print. Not graded.</div>
          </div>
        </div>
        <div class="printable-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:var(--sp-3, 12px);">${items
          .map(card)
          .join("")}</div>
        <iframe class="printable-frame" title="Printable preview" hidden
          style="width:100%; height:calc(100vh - 320px); min-height:480px; margin-top:var(--sp-4, 16px); border:1px solid var(--line, #e4ddc9); border-radius:var(--radius-md, 12px); background:var(--card, #fff);"></iframe>
      `;
      phaseContainer.append(el);

      const frame = el.querySelector(".printable-frame");
      el.querySelectorAll("[data-preview]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const p = items[Number(btn.dataset.preview)];
          if (!p || !p.pdf) return;
          frame.src = p.pdf;
          frame.hidden = false;
          frame.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      });
      el.scrollIntoView({ block: "start" });
      el.focus?.({ preventScroll: true });
    },

    start() {
      const s = state.get();
      const startIndex = s.currentPhase || 0;
      this.navigateTo(startIndex);
    },
  };

  document.addEventListener("rma:navigate", (e) => app.navigateTo(e.detail.phase));

  // Vocab/Notes sub-tabs live inside the data-bound phase nav (rebuilt on every
  // state change), so they signal via an event instead of a one-time binding.
  document.addEventListener("rma:openextra", (e) => app.openExtra(e.detail.kind));

  // Pre-lesson tabs (Get Ready / Objectives) open inline without disturbing the
  // graded phase flow.
  sidebar.querySelectorAll(".extra-btn").forEach((btn) => {
    btn.addEventListener("click", () => app.openExtra(btn.dataset.extra));
  });

  // Mount the export toolbar (sticky top bar with Save / Copy buttons)
  mountExportToolbar(state, config);
  mountUtilityMenu();
  initNotebook(config);
  window.openMathNotesModel = (cfg) => openMathNotesModel(cfg || config);

  app.start();

  // Deep-link from curriculum hub: /lessons/3-1/?extra=activity
  // Otherwise the lesson opens on the Launch phase (phase 1). Get Ready is an
  // optional warm-up reachable from the "📚 Get Ready" tab — students are no
  // longer auto-routed into it, so they land in the lesson itself by default.
  var pendingExtra = new URLSearchParams(window.location.search).get("extra");
  if (pendingExtra) {
    setTimeout(function () {
      app.openExtra(pendingExtra);
    }, 0);
  }

  // Floating "Next" button (bottom-right) so students always have a clear way to
  // continue to the next part of the lesson. It mirrors clicking the next phase
  // in the sidebar rail, but as a prominent, always-reachable control. Sits above
  // the Save/Resume launcher; hidden on the final phase and while a full-page
  // pre-lesson tab (Vocab / Learn It / Notes) is open.
  (function mountNextButton() {
    const hasVocab = Array.isArray(config.vocabulary) && config.vocabulary.length > 0;
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "nt-next-phase-btn";
    nextBtn.setAttribute("aria-label", "Go to the next part of the lesson");
    nextBtn.style.cssText =
      // The lone bottom-right control (dock contract in design-system.css):
      // Save/Resume and the workbench live in the top-right Tools menu.
      // z-index sits ABOVE the lesson drawing canvas (z-index 9998) so the
      // "continue to next part" control is never trapped under an active Draw
      // overlay — turning Draw on used to cover this button and make it dead.
      "position:fixed; right:16px; bottom:16px; z-index:9999; display:inline-flex; " +
      "align-items:center; gap:8px; min-height:48px; padding:0 22px; border:0; " +
      "border-radius:99px; background:#12355b; color:#fff; font-weight:700; " +
      "font-size:1rem; cursor:pointer; box-shadow:0 1px 2px rgba(18,53,91,.06);";
    document.body.appendChild(nextBtn);

    function refresh() {
      const st = state.get();
      const cur = st.currentPhase ?? 0;
      const total = config.phases.length;
      const onExtra = document.documentElement.classList.contains("nt-extra-fullpage-open");
      // Canonical order is Launch → Vocab → Learn It → Explore. Vocab and
      // Learn It are full-page extras, not entries in `phases`, so stepping
      // cur+1 from Launch skipped straight past both of them and landed on
      // Explore — the opposite of what the lesson chain says. From Launch the
      // control therefore points at Vocab (when the lesson has vocabulary);
      // everywhere else it is still the next phase.
      const toVocab = cur === PHASE_LAUNCH && hasVocab;
      const nextName = toVocab ? "Vocabulary" : phaseConfigs[cur + 1]?.name || "Next";
      const hide = cur >= total - 1 || onExtra;
      nextBtn.innerHTML = `Next: ${nextName} <span aria-hidden="true">→</span>`;
      nextBtn.hidden = hide;
      // `hidden` alone was not enough. The UA rule is [hidden] { display: none },
      // and this button carries an INLINE display:inline-flex, which wins on
      // specificity — so on the last phase (Objectives Review) the control stayed
      // on screen reading "Next: Next →" with nowhere to go. Drive display
      // directly, from the same condition, so the two can never disagree.
      nextBtn.style.display = hide ? "none" : "inline-flex";
    }
    nextBtn.addEventListener("click", () => {
      const cur = state.get().currentPhase ?? 0;
      if (cur === PHASE_LAUNCH && hasVocab) {
        app.openExtra("vocab");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (cur < config.phases.length - 1) {
        app.navigateTo(cur + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
    state.subscribe(refresh);
    // A full-page extra toggles a documentElement class outside the state store,
    // so watch that too.
    new MutationObserver(refresh).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    refresh();
  })();

  // Hands-free voice control (only appears where the browser supports it).
  /*
  mountVoiceNav({
    getCurrentPhase: () => state.get().currentPhase ?? 0,
    phaseCount: config.phases.length,
    phaseNames: phaseConfigs.map((p) => p?.name || ""),
    navigateTo: (i) => {
      app.navigateTo(i);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    getPhaseEl: () => phaseContainer.querySelector(".phase"),
  });
  */

  // One-tap ESOL translation of the current part.
  mountTranslate({ getPhaseEl: () => phaseContainer.querySelector(".phase") });

  // Teacher-facing Present toggle (engine/core/present-mode.js): Tools > Present
  // or ?present=1 turns the current phase into projector slides.
  initPresentMode({ app, config, phaseConfigs, phaseContainer, state });

  return app;
}

/**
 * The forward button for a pre-lesson step: Launch → Vocab → Learn It → Practice.
 *
 * The native Vocab and Learn It panels advanced ONLY through their `onComplete`
 * hook — finish the vocabulary activity and you were moved on. A student who
 * read the words without completing the activity had no way forward at all: the
 * panel replaces the phase container, so there was no Continue button and no
 * visible next step. The iframe-backed panels further down openExtra() have had
 * their own addContinue() for exactly this reason; the native ones never got it.
 *
 * Styling matches that addContinue() so the chain looks like one flow.
 */
function chainContinueButton(label, onClick) {
  const wrap = document.createElement("div");
  wrap.style.cssText = "margin-top:var(--sp-4, 16px); text-align:center; padding-bottom:24px;";
  const b = document.createElement("button");
  b.type = "button";
  b.className = "btn btn-primary btn-lg";
  b.style.cssText =
    "padding:14px 28px; font-weight:700; font-size:1.05rem; background:#14223a; color:#fff; border:none; border-radius:12px; cursor:pointer;";
  b.textContent = label;
  b.addEventListener("click", onClick);
  wrap.append(b);
  return wrap;
}

function buildSidebar(config, state, _phaseConfigs) {
  const sidebar = document.createElement("nav");
  sidebar.className = "sidebar";
  sidebar.setAttribute("role", "navigation");
  sidebar.setAttribute("aria-label", "Activity navigation");

  const themeEmoji = config.themeEmoji || "📐";
  const s = state.get();

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-badge">${themeEmoji}</div>
      <div>
        <div class="sidebar-title">${escHtml(config.title)}</div>
        <div class="sidebar-subtitle">${escHtml(config.standard)} · Unit ${config.unit}</div>
      </div>
    </div>

    <div class="student-info">
      <span class="student-name-display">${escHtml(s.studentName || "Student")}</span>
      ${s.studentPeriod ? `<span class="student-period-display">Period ${escHtml(s.studentPeriod)}</span>` : ""}
    </div>

    <div class="xp-container">
      <div class="xp-header">
        <span class="xp-label">⭐ XP</span>
        <span class="xp-value" data-bind="xp">${s.xp} / ${s.maxXp}</span>
      </div>
      <div class="xp-bar-track">
        <div class="xp-bar-fill" data-bind="xp-bar"></div>
      </div>
    </div>

    <div class="coins-container" data-bind="coins-row">
      <span class="coins-label">🪙 <span data-bind="coins">${s.coins || 0}</span> coins</span>
    </div>

    <div class="sidebar-progress" data-bind="sidebar-progress">
      <div class="sidebar-progress-label">
        <span>Progress</span>
        <span data-bind="phase-count">0 / 5</span>
      </div>
      <div class="xp-bar-track">
        <div class="xp-bar-fill" data-bind="phase-bar"></div>
      </div>
    </div>

    ${preLessonNavHtml(config)}

    <div class="phase-nav" data-bind="phases"></div>

    ${bonusNavHtml(config)}

    <div style="margin-top:auto; opacity:0.5; font-size:0.7rem; text-align:center;">
      Neft Teacher · ${escHtml(config.standard)}
    </div>
  `;

  // Collapse toggle (per Joel 2026-07-20): slims the rail to a numbered strip
  // so the lesson gets the full width; the choice persists on this device.
  const sbToggle = document.createElement("button");
  sbToggle.type = "button";
  sbToggle.className = "nt-sb-toggle";
  const syncToggle = () => {
    const collapsed = document.body.classList.contains("nt-sidebar-collapsed");
    sbToggle.textContent = collapsed ? "›" : "‹";
    sbToggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
    sbToggle.setAttribute("aria-expanded", String(!collapsed));
  };
  sbToggle.addEventListener("click", () => {
    const collapsed = document.body.classList.toggle("nt-sidebar-collapsed");
    try {
      localStorage.setItem("nt-sidebar-collapsed", collapsed ? "1" : "0");
    } catch (_) {
      /* private-mode storage — collapse just won't persist */
    }
    syncToggle();
  });
  try {
    if (localStorage.getItem("nt-sidebar-collapsed") === "1") {
      document.body.classList.add("nt-sidebar-collapsed");
    }
  } catch (_) {
    /* private-mode storage */
  }
  syncToggle();
  sidebar.prepend(sbToggle);

  return sidebar;
}

// "Before the lesson" group: non-graded tabs for the pre-lesson materials that
// used to live only as links on the Launch screen. Get Ready (Readiness) shows
// only when the lesson ships a readiness check; Guided Notes is always present.
// These open inline in the lesson shell (see app.openExtra) and never affect
// XP, stars, or phase completion.
function preLessonNavHtml(config) {
  const tabs = [];
  if (config.readiness) tabs.push({ extra: "readiness", icon: "📚", label: "Get Ready" });
  if (!tabs.length) return "";
  const items = tabs.map(
    (t) =>
      `<button class="phase-btn extra-btn" data-extra="${t.extra}">
        <span class="phase-num" style="background:transparent; box-shadow:none; font-size:1.15rem;">${t.icon}</span>
        <span>${t.label}</span>
      </button>`,
  );
  return `
    <div class="prelesson-nav" data-bind="prelesson">
      ${items.join("\n      ")}
    </div>`;
}

// "Bonus" group: a non-graded menu item for the lesson's named TPT-style
// activity (config.practice.optionalActivity). Shown only when the lesson has
// one. Opens inline via app.openActivity(); the tile shows the activity's real
// title + emoji so students can launch it straight from the lesson menu.
function bonusNavHtml(config) {
  const act = config.practice && config.practice.optionalActivity;
  const hasItems =
    config.practice &&
    Array.isArray(config.practice.optional) &&
    config.practice.optional.length > 0;
  if (!act || !hasItems) return "";
  return `
    <div class="bonus-nav" data-bind="bonus">
      <div class="prelesson-label" style="font-size:0.68rem; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; opacity:0.55; padding:0 var(--sp-2, 8px); margin:var(--sp-3, 12px) 0 var(--sp-1, 4px);">Bonus</div>
      <button class="phase-btn extra-btn" data-extra="activity">
        <span class="phase-num">${escHtml(act.emoji || "🎯")}</span>
        <span>${escHtml(act.name || "Bonus Activity")}</span>
      </button>
    </div>`;
}

// Each Reveal lesson unit's culminating-project page. Mapped by VERIFIED SUBJECT
// (standard family), not raw number, because the classroom /math/unit-N folders
// are reordered vs Reveal lesson units for 7/8/9: Reveal 7 (equations) ->
// /math/unit-8, Reveal 9 (coordinate plane) -> /math/unit-7. Reveal unit 8
// (statistics, 6.DS) has no classroom culminating-project page, so it is omitted.
export const UNIT_CULMINATING_PROJECT = {
  1: "/math/unit-1/projects/",
  2: "/math/unit-2/projects/",
  3: "/math/unit-3/projects/",
  4: "/math/unit-4/projects/",
  5: "/math/unit-5/projects/",
  6: "/math/unit-6/projects/",
  7: "/math/unit-8/projects/",
  8: "/math/statistics/projects/",
  9: "/math/unit-7/projects/",
  10: "/math/unit-10/projects/",
};

function buildLessonHero(config, _state, _phaseConfigs) {
  const hero = document.createElement("header");
  hero.className = "lesson-hero";
  hero.setAttribute("aria-label", "Lesson overview");
  hero.innerHTML = `
    <div class="lesson-hero-top">
      <div>
        <h2 class="lesson-hero-title">${escHtml(config.title)}</h2>
        <div class="lesson-hero-meta">${escHtml(config.standard)} · Unit ${config.unit} · ${escHtml(lessonTimeEstimate(config))}</div>
      </div>
      <div class="lesson-hero-badges">
        <span class="lesson-hero-badge lesson-hero-standard" data-bind="hero-standard" title="${escHtml(config.standard)}">${escHtml(config.standard)}</span>
        <span class="lesson-hero-badge">🪙 <span data-bind="hero-coins">0</span></span>
        <span class="lesson-hero-badge">⭐ <span data-bind="hero-stars">0</span>/18</span>
      </div>
    </div>`;
  return hero;
}

function updateLessonHero(hero, state, _phaseConfigs) {
  if (!hero) return;
  const s = state.get();

  const stars = hero.querySelector('[data-bind="hero-stars"]');
  if (stars) stars.textContent = String(s.phases.reduce((sum, p) => sum + (p.stars || 0), 0));

  const coins = hero.querySelector('[data-bind="hero-coins"]');
  if (coins) coins.textContent = String(s.coins || 0);
}

function updateSidebar(sidebar, state, phaseConfigs) {
  const s = state.get();

  const xpVal = sidebar.querySelector('[data-bind="xp"]');
  if (xpVal) xpVal.textContent = `${s.xp} / ${s.maxXp}`;

  const xpBar = sidebar.querySelector('[data-bind="xp-bar"]');
  if (xpBar) xpBar.style.width = `${Math.min(100, (s.xp / s.maxXp) * 100)}%`;

  const coinsEl = sidebar.querySelector('[data-bind="coins"]');
  if (coinsEl) coinsEl.textContent = String(s.coins || 0);

  const completed = s.phases.filter((p) => p.status === "completed").length;
  const total = s.phases.length || 6;
  const phaseCount = sidebar.querySelector('[data-bind="phase-count"]');
  if (phaseCount) phaseCount.textContent = `${completed} / ${total}`;
  const phaseBar = sidebar.querySelector('[data-bind="phase-bar"]');
  if (phaseBar) phaseBar.style.width = `${total ? Math.round((completed / total) * 100) : 0}%`;

  const nav = sidebar.querySelector('[data-bind="phases"]');
  if (!nav) return;

  // The canonical Math Notes model, right under the Warmup (phase 1) button.
  const mathNotesBtn = `
    <button class="phase-btn extra-btn" data-extra="mathnotes">
      <span class="phase-num" style="background:transparent; box-shadow:none; font-size:1.15rem;">📓</span>
      <span>Math Notes</span>
    </button>`;

  // Vocab → Learn It → Watch Me ride directly under the Launch (phase 1) button as
  // indented sub-tabs — reference material that lives with the lesson flow.
  const launchSubTabs = [
    { extra: "vocab", icon: "🔑", label: "Vocab" },
    { extra: "learn", icon: "💡", label: "Learn It" },
    { extra: "watchme", icon: "👀", label: "Watch Me" },
  ]
    .map(
      (t) =>
        `<button class="phase-btn extra-btn phase-subtab" data-extra="${t.extra}" style="margin-left:var(--sp-4, 18px);">
        <span class="phase-num" style="background:transparent; box-shadow:none; font-size:1.05rem;">${t.icon}</span>
        <span>${t.label}</span>
      </button>`,
    )
    .join("\n");

  nav.innerHTML = s.phases
    .map((phase, i) => {
      const isCurrent = i === s.currentPhase;
      const cls = [
        "phase-btn",
        isCurrent ? "active" : "",
        phase.status === "completed" ? "completed" : "",
      ]
        .filter(Boolean)
        .join(" ");

      const stars = Array.from(
        { length: 3 },
        (_, si) => `<span class="star ${si < phase.stars ? "earned" : ""}">★</span>`,
      ).join("");

      const btn = `
      <button class="${cls}" data-phase="${i}">
        <span class="phase-num">${i + 1}</span>
        <span>${escHtml(phaseConfigs[i]?.name || `Phase ${i + 1}`)}</span>
        <span class="phase-stars">${stars}</span>
      </button>
    `;
      // Warmup is index 0 — drop Math Notes right beneath it.
      if (i === 0) return btn + mathNotesBtn;
      // Launch is phase index 2 (Phase 3) — drop Vocab/Learn It right beneath it.
      if (i === 2) return btn + launchSubTabs;
      return btn;
    })
    .join("");

  nav.querySelectorAll("[data-phase]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.phase, 10);
      document.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: idx } }));
    });
  });


  nav.querySelectorAll(".extra-btn[data-extra]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.dispatchEvent(
        new CustomEvent("rma:openextra", {
          detail: { kind: btn.dataset.extra },
        }),
      );
    });
  });

  // Re-assert the active highlight on the sub-tabs after this rebuild, so the
  // open Vocab/Notes tab stays highlighted across state-driven re-renders.
  const viewing = sidebar.getAttribute("data-viewing-extra");
  if (viewing) {
    nav
      .querySelectorAll(".extra-btn[data-extra]")
      .forEach((b) => b.classList.toggle("active", b.dataset.extra === viewing));
  }
}

function escHtml(str) {
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}

function initDeployWatcher() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  // Periodic update check every 2 minutes
  setInterval(
    () => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) reg.update();
      });
    },
    2 * 60 * 1000,
  );
  // Auto-reload when new SW takes control
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    const toast = document.createElement("div");
    toast.setAttribute("role", "status");
    toast.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(135deg,#155fa0,#0f6d78);color:#fff;text-align:center;padding:12px 20px;font-weight:500;font-size:14px;box-shadow:0 2px 12px rgba(0,0,0,.2);";
    toast.textContent = "🚀 New version deployed — refreshing now…";
    document.body.appendChild(toast);
    setTimeout(() => window.location.reload(), 1500);
  });
}

initDeployWatcher();
