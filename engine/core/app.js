import { createState, normalizeStudentId, findSavedStudents } from "./state.js";
import { createEngagement } from "../engagement/engagement.js";
import { mountExportToolbar } from "./export.js";
import { reportScore } from "./score-reporter.js";
import { runComponentList } from "../components/activity-chooser.js";
import {
  renderComponent,
  resolveContentObjective,
  resolveLanguageObjective,
} from "./lesson-renderer.js";
import {
  buildLessonCoverExtras,
  mountCoverArt,
  applyPhaseAccent,
} from "./premium.js";
import { mountTeacherPanel, buildWelcomeTeacherNotes, isTeacherMode } from "./teacher-mode.js";
import { t, stackHtml, phaseName } from "./i18n.js";
import "@engine/styles/design-system.css";
import "@engine/styles/themes.css";

export function createApp(config) {
  const root = document.getElementById("app");
  root.innerHTML = "";
  root.className = "app";
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

  // Global sound hooks
  window.AudioSynth = {
    ctx: null,
    init() {
      if (!this.ctx)
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    playTone(freq, type, duration, vol = 0.1) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.ctx.currentTime + duration,
      );
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

  window.fireConfetti = function () {
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.inset = 0;
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = 9999;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.random() * 5 + 5,
      color: ["#F2A93B", "#387F84", "#C85A3A", "#4A7C6F"][
        Math.floor(Math.random() * 4)
      ],
      size: Math.random() * 8 + 4,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
    }));
    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.rot += p.rotSpeed;
        if (p.y < canvas.height) active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      if (active) requestAnimationFrame(loop);
      else canvas.remove();
    }
    loop();
  };

  document.addEventListener("click", (e) => {
    if (
      e.target.closest(
        'button, a, select, input[type="radio"], input[type="checkbox"], .phase-btn',
      )
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
    upsertLinkRel("canonical", `/lessons/${config.lessonId}/`);
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
function formsCardHtml(config) {
  const gf = config.googleForms;
  if (!gf || !gf.student) return "";
  const s = gf.student;
  const link = (href, label, emoji) =>
    href
      ? `<a href="${href}" target="_blank" rel="noopener" style="flex:1; min-width:84px; display:flex; flex-direction:column; align-items:center; gap:4px; text-decoration:none; color:inherit; background:#fff; border:1px solid var(--gold,#d4952a); border-radius:10px; padding:10px 8px; font-weight:700;"><span style="font-size:1.3rem;" aria-hidden="true">${emoji}</span><span>${label}</span></a>`
      : "";
  return `
      <div class="identity-forms" style="background:var(--cream,#fdf3e0); border:1px solid var(--gold,#d4952a); border-radius:12px; padding:12px 16px; margin:0 0 16px; text-align:left;">
        <div style="font-weight:800; margin-bottom:8px;">📋 ${t("lessonForms")}</div>
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

function objectivesBlockHtml(config) {
  return `
    <div class="identity-objectives">
      <div class="identity-objective-row">
        <span class="identity-objective-badge">${t("target")}</span>
        <span>${resolveContentObjective(config)}</span>
      </div>
      <div class="identity-objective-row">
        <span class="identity-objective-badge">${t("discuss")}</span>
        <span>${resolveLanguageObjective(config)}</span>
      </div>
    </div>`;
}

function showIdentityScreen(root, config) {
  const themeEmoji = config.themeEmoji || "📐";
  const saved = findSavedStudents(config.lessonId);
  const homeworkHtmlHref = `/lessons/${encodeURIComponent(config.lessonId)}/homework.html`;
  const handoutHref = `/lessons/${encodeURIComponent(config.lessonId)}/handout.html`;
  const slidesHref = `/lessons/${encodeURIComponent(config.lessonId)}/slides.html`;

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
        ${objectivesBlockHtml(config)}
      </div>
      <div class="identity-body">
        ${
          config.readiness
            ? `<a class="identity-readiness" href="/lessons/${encodeURIComponent(config.lessonId)}/readiness/" style="display:flex; align-items:center; gap:10px; text-decoration:none; color:inherit; background:var(--cream,#fdf3e0); border:1px solid var(--gold,#d4952a); border-radius:12px; padding:12px 16px; margin:0 0 16px; text-align:left;">
                <span style="font-size:1.5rem;" aria-hidden="true">📚</span>
                <span><strong>${t("newToTopic")}</strong> ${t("getReadyDesc")} <span style="white-space:nowrap; font-weight:700; color:var(--blue,#1a6fb5);">${t("startArrow")}</span></span>
              </a>`
            : ""
        }
        <p class="instruction-callout" style="margin-bottom:var(--sp-4); font-size:0.88rem;">
          <span class="instruction-callout-icon" aria-hidden="true">👋</span>
          <span>${t("enterNamePrompt")}</span>
        </p>
        ${formsCardHtml(config)}
        <div id="welcome-teacher-slot"></div>
        <div class="identity-form">
          <label for="id-name">${stackHtml(t("yourName", "en"), t("yourName", "es"))}</label>
          <input id="id-name" type="text" placeholder="${t("namePlaceholder")}" autocomplete="off" />
          <label for="id-period">${stackHtml(t("period", "en"), t("period", "es"))}</label>
          <input id="id-period" type="text" placeholder="${t("periodPlaceholder")}" autocomplete="off" />
          <button id="id-start" class="identity-btn" disabled>${stackHtml(t("startActivity", "en"), t("startActivity", "es"))}</button>
        </div>
        <p style="margin:var(--sp-4) 0 0; font-size:0.82rem; text-align:center;">
          <a href="${homeworkHtmlHref}" style="color:var(--teal); font-weight:700;">🏠 ${stackHtml(t("familyHomework", "en"), t("familyHomework", "es"))}</a>
          · <a href="/lessons/${encodeURIComponent(config.lessonId)}/notes.html" style="color:var(--navy); font-weight:700;">📝 ${stackHtml(t("guidedNotes", "en"), t("guidedNotes", "es"))}</a>
          · <a href="${slidesHref}" target="_blank" rel="noopener" style="color:var(--blue,#1a6fb5); font-weight:700;">📊 ${stackHtml(t("lessonSlides", "en"), t("lessonSlides", "es"))}</a>
          · <a href="${handoutHref}" target="_blank" rel="noopener" style="color:var(--amber,#c85a3a); font-weight:700;">📄 ${stackHtml(t("studentHandout", "en"), t("studentHandout", "es"))}</a>
        </p>
        ${saved.length ? `<div class="identity-saved" id="id-saved-list"></div>` : ""}
      </div>
    </div>
  `;
  root.append(screen);

  const teacherSlot = screen.querySelector("#welcome-teacher-slot");
  if (teacherSlot && !isTeacherMode()) {
    teacherSlot.append(buildWelcomeTeacherNotes(config));
  }

  const coverExtras = screen.querySelector("#cover-extras");
  if (coverExtras) {
    const savedMatch = saved[0];
    coverExtras.innerHTML = buildLessonCoverExtras(config, savedMatch);
    const artSlot = coverExtras.querySelector(".lesson-cover-art");
    if (artSlot) mountCoverArt(artSlot, config);
    const stdBtn = coverExtras.querySelector('[data-action="standards-explainer"]');
    if (stdBtn) {
      stdBtn.addEventListener("click", () => {
        const open = stdBtn.getAttribute("aria-expanded") === "true";
        stdBtn.setAttribute("aria-expanded", String(!open));
        let panel = coverExtras.querySelector(".standards-explainer-panel");
        if (!open && !panel) {
          panel = document.createElement("div");
          panel.className = "standards-explainer-panel";
          panel.innerHTML = `
            <p><strong>${escHtml(config.standard)}</strong> — This lesson aligns to Grade 6 Reveal Math standards.</p>
            <p>${escHtml(resolveContentObjective(config))}</p>
            <p style="color:var(--muted); font-size:0.88rem;">Use <code>?teacher=1</code> in the URL for pacing guide, answer keys, and listen-fors.</p>`;
          stdBtn.after(panel);
        } else if (panel) {
          panel.hidden = open;
        }
      });
    }
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
      const when = s.lastSaved
        ? new Date(s.lastSaved).toLocaleDateString()
        : "";
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
    screen.remove();
    initMainApp(root, config, studentId, name, periodInput.value.trim());
  }

  setTimeout(() => nameInput.focus(), 100);
}

function initMainApp(root, config, studentId, studentName, studentPeriod) {
  const state = createState(config.lessonId, studentId);
  const engagement = createEngagement(state);

  if (!state.get().studentName) {
    state.set({ studentName, studentPeriod });
  }

  const phaseConfigs = [
    { name: phaseName(0), icon: "🚀" },
    { name: phaseName(1), icon: "📖" },
    { name: phaseName(2), icon: "🔍" },
    { name: phaseName(3), icon: "✏️" },
    { name: phaseName(4), icon: "🌎" },
    { name: phaseName(5), icon: "💡" },
  ];

  state.initPhases(phaseConfigs);

  const sidebar = buildSidebar(config, state, phaseConfigs);
  const main = document.createElement("div");
  main.className = "main";
  main.setAttribute("role", "main");

  root.append(sidebar, main);

  mountTeacherPanel(root, config, state);

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
    "position:fixed; bottom:24px; right:24px; background:rgba(255,255,255,0.85); backdrop-filter:blur(12px); border:1px solid rgba(0,0,0,0.1); border-radius:50px; padding:10px 14px; display:flex; gap:8px; z-index:9999; box-shadow:0 10px 30px rgba(0,0,0,0.15); transition:0.3s;";
  document.body.append(minimapHUD);

  function updateMinimap() {
    const s = state.get();
    minimapHUD.innerHTML = s.phases
      .map((p, i) => {
        const isCurrent = i === s.currentPhase;
        const done = p.status === "completed";
        const bg = isCurrent ? "#387F84" : done ? "#F2A93B" : "rgba(0,0,0,0.1)";
        const scale = isCurrent ? "scale(1.2)" : "scale(1)";
        return `<div style="width:12px;height:12px;border-radius:50%;background:${bg}; transform:${scale}; transition:0.3s; cursor:pointer;" title="Phase ${i + 1}" onclick="document.dispatchEvent(new CustomEvent('rma:navigate', {detail:{phase:${i}}}))"></div>`;
      })
      .join("");
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

    renderPhase(index, renderFn) {
      applyPhaseAccent(main, index);
      phaseContainer.innerHTML = "";
      const el = document.createElement("div");
      el.className = "phase active phase-enter";
      el.setAttribute("role", "region");
      el.setAttribute(
        "aria-label",
        phaseConfigs[index]?.name || `Phase ${index + 1}`,
      );
      phaseContainer.append(el);
      renderFn(el, state, this);
      el.addEventListener(
        "animationend",
        () => el.classList.remove("phase-enter"),
        { once: true },
      );
    },

    navigateTo(index) {
      this.clearExtraActive();
      state.setPhase(index);
      if (config.phases[index]) {
        this.renderPhase(index, config.phases[index]);
      }
    },

    // Mark/unmark which (if any) pre-lesson tab is currently being viewed.
    setExtraActive(kind) {
      sidebar
        .querySelectorAll(".extra-btn")
        .forEach((b) => b.classList.toggle("active", b.dataset.extra === kind));
      sidebar.setAttribute("data-viewing-extra", kind || "");
    },
    clearExtraActive() {
      this.setExtraActive(null);
    },

    // Render a pre-lesson material (Readiness or Guided Notes) inline in the
    // lesson shell. Non-graded: this never touches phase state, XP, or stars —
    // the student's place in the graded flow is preserved underneath.
    openExtra(kind) {
      if (kind === "projects") return this.openProjects();
      if (kind === "activity") return this.openActivity();
      const id = encodeURIComponent(config.lessonId);
      const meta =
        kind === "readiness"
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

      this.setExtraActive(kind);
      phaseContainer.innerHTML = "";
      const el = document.createElement("div");
      el.className = "phase active extra-panel";
      el.setAttribute("role", "region");
      el.setAttribute("aria-label", meta.title);
      el.innerHTML = `
        <div class="extra-head" style="display:flex; flex-wrap:wrap; gap:var(--sp-3, 12px); align-items:center; justify-content:space-between; margin-bottom:var(--sp-3, 12px);">
          <div>
            <div class="section-title" style="font-size:1.6rem;">${meta.icon} ${escHtml(meta.title)}</div>
            <div class="section-desc">${escHtml(meta.desc)}</div>
          </div>
          <div class="extra-actions" style="display:flex; gap:var(--sp-2, 8px); flex-wrap:wrap;">
            ${kind === "notes" ? `<button class="btn btn-secondary" data-act="print">🖨️ Print</button>` : ""}
            <a class="btn btn-secondary" href="${meta.full}" target="_blank" rel="noopener">Open full page ↗</a>
          </div>
        </div>
        <iframe class="extra-frame" title="${escHtml(meta.title)}" src="${meta.src}"
          style="width:100%; height:calc(100vh - 190px); min-height:560px; border:1px solid var(--line, #e4ddc9); border-radius:var(--radius-md, 12px); background:var(--card, #fff);"></iframe>
      `;
      phaseContainer.append(el);

      const frame = el.querySelector(".extra-frame");
      const printBtn = el.querySelector('[data-act="print"]');
      if (printBtn) {
        printBtn.addEventListener("click", () => {
          try {
            frame.contentWindow.focus();
            frame.contentWindow.print();
          } catch (e) {
            window.open(meta.full, "_blank", "noopener");
          }
        });
      }
      el.scrollIntoView({ block: "start" });
    },

    // Bonus Activity: the lesson's named TPT-style activity
    // (config.practice.optionalActivity + config.practice.optional). Opens
    // inline from the lesson menu so students can launch it directly instead of
    // only at the end of Practice. Non-graded: never touches phase state, XP, or
    // stars. No-op when the lesson has no optional activity.
    openActivity() {
      const act = config.practice && config.practice.optionalActivity;
      const items =
        config.practice && Array.isArray(config.practice.optional)
          ? config.practice.optional
          : [];
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
    },

    // Projects: a non-graded "extend" tab present on every lesson. Filled in
    // per-lesson via config.projects (added as projects get built). Each project
    // links out to a standalone activity/game; shows a friendly empty state when
    // a lesson has no projects yet. Never touches phase state, XP, or stars.
    openProjects() {
      const projects = Array.isArray(config.projects)
        ? [...config.projects]
        : [];
      // Auto-append this unit's culminating project (mapped by verified subject)
      // after any lesson-specific projects, unless it is already listed.
      const unitHref = UNIT_CULMINATING_PROJECT[config.unit];
      if (
        unitHref &&
        !projects.some(
          (p) =>
            p.href === unitHref ||
            (Array.isArray(p.links) &&
              p.links.some((l) => l.href === unitHref)),
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
            <div style="font-weight:800; font-size:1.1rem; color:var(--navy, #264653);">${escHtml(p.title || "Project")}</div>
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
            <div style="font-weight:800; font-size:1.15rem; color:var(--navy, #264653); margin-top:var(--sp-2, 8px);">Projects coming soon</div>
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
    },

    start() {
      const s = state.get();
      const startIndex = s.currentPhase || 0;
      this.navigateTo(startIndex);
    },
  };

  document.addEventListener("rma:navigate", (e) =>
    app.navigateTo(e.detail.phase),
  );

  // Pre-lesson tabs (Get Ready / Notes) open inline without disturbing the
  // graded phase flow.
  sidebar.querySelectorAll(".extra-btn").forEach((btn) => {
    btn.addEventListener("click", () => app.openExtra(btn.dataset.extra));
  });

  // Mount the export toolbar (sticky top bar with Save / Copy buttons)
  mountExportToolbar(state, config);

  app.start();

  // Deep-link from curriculum hub: /lessons/3-1/?extra=activity
  var pendingExtra = new URLSearchParams(window.location.search).get("extra");
  if (pendingExtra) {
    setTimeout(function () {
      app.openExtra(pendingExtra);
    }, 0);
  }

  return app;
}

function buildSidebar(config, state, phaseConfigs) {
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
        <span data-bind="phase-count">0 / 6</span>
      </div>
      <div class="xp-bar-track">
        <div class="xp-bar-fill" data-bind="phase-bar"></div>
      </div>
    </div>

    ${preLessonNavHtml(config)}

    <div class="phase-nav" data-bind="phases"></div>

    ${bonusNavHtml(config)}

    ${projectsNavHtml(config)}

    <div style="margin-top:auto; opacity:0.5; font-size:0.7rem; text-align:center;">
      Neft Teacher · ${escHtml(config.standard)}
    </div>
  `;

  return sidebar;
}

// "Before the lesson" group: non-graded tabs for the pre-lesson materials that
// used to live only as links on the Launch screen. Get Ready (Readiness) shows
// only when the lesson ships a readiness check; Guided Notes is always present.
// These open inline in the lesson shell (see app.openExtra) and never affect
// XP, stars, or phase completion.
function preLessonNavHtml(config) {
  const items = [];
  if (config.readiness) {
    items.push(
      `<button class="phase-btn extra-btn" data-extra="readiness">
        <span class="phase-num">📚</span>
        <span>Get Ready</span>
      </button>`,
    );
  }
  items.push(
    `<button class="phase-btn extra-btn" data-extra="notes">
      <span class="phase-num">📝</span>
      <span>Notes</span>
    </button>`,
  );
  return `
    <div class="prelesson-nav" data-bind="prelesson">
      <div class="prelesson-label" style="font-size:0.68rem; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; opacity:0.55; padding:0 var(--sp-2, 8px); margin:var(--sp-3, 12px) 0 var(--sp-1, 4px);">Before the lesson</div>
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
      <div class="prelesson-label" style="font-size:0.68rem; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; opacity:0.55; padding:0 var(--sp-2, 8px); margin:var(--sp-3, 12px) 0 var(--sp-1, 4px);">Bonus</div>
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
// (statistics, 6.SP) has no classroom culminating-project page, so it is omitted.
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

// "Extend" group: a non-graded Projects tab shown on every lesson. It opens
// inline (see app.openProjects) and lists config.projects, or a "coming soon"
// empty state when a lesson has none yet. Always present so projects can be
// wired in per-lesson as they get built.
function projectsNavHtml(_config) {
  return `
    <div class="projects-nav" data-bind="projects">
      <div class="prelesson-label" style="font-size:0.68rem; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; opacity:0.55; padding:0 var(--sp-2, 8px); margin:var(--sp-3, 12px) 0 var(--sp-1, 4px);">Extend</div>
      <button class="phase-btn extra-btn" data-extra="projects">
        <span class="phase-num">🛠️</span>
        <span>Projects</span>
      </button>
    </div>`;
}

function buildLessonHero(config, state, phaseConfigs) {
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
        <span class="lesson-hero-badge" data-bind="hero-phase">Phase 1</span>
        <span class="lesson-hero-badge">🪙 <span data-bind="hero-coins">0</span></span>
        <span class="lesson-hero-badge">⭐ <span data-bind="hero-stars">0</span>/18</span>
      </div>
    </div>
    <div class="phase-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="6" aria-valuenow="0" data-bind="hero-progressbar">
      <div class="phase-progress-fill" data-bind="hero-progress" style="width:0%"></div>
    </div>
    <div class="phase-progress-label">
      <span data-bind="hero-phase-name">${escHtml(phaseConfigs[0]?.name || "Launch")}</span>
      <span data-bind="hero-phase-count">0 of 6 complete</span>
    </div>`;
  return hero;
}

function updateLessonHero(hero, state, phaseConfigs) {
  if (!hero) return;
  const s = state.get();
  const completed = s.phases.filter((p) => p.status === "completed").length;
  const total = s.phases.length || 6;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const current = phaseConfigs[s.currentPhase] || phaseConfigs[0];

  const phaseBadge = hero.querySelector('[data-bind="hero-phase"]');
  if (phaseBadge)
    phaseBadge.textContent = `Phase ${(s.currentPhase ?? 0) + 1} of ${total}`;

  const stars = hero.querySelector('[data-bind="hero-stars"]');
  if (stars)
    stars.textContent = String(s.phases.reduce((sum, p) => sum + (p.stars || 0), 0));

  const coins = hero.querySelector('[data-bind="hero-coins"]');
  if (coins) coins.textContent = String(s.coins || 0);

  const fill = hero.querySelector('[data-bind="hero-progress"]');
  if (fill) fill.style.width = `${pct}%`;

  const bar = hero.querySelector('[data-bind="hero-progressbar"]');
  if (bar) {
    bar.setAttribute("aria-valuenow", String(completed));
    bar.setAttribute("aria-valuemax", String(total));
  }

  const phaseName = hero.querySelector('[data-bind="hero-phase-name"]');
  if (phaseName) phaseName.textContent = current?.name || `Phase ${s.currentPhase + 1}`;

  const phaseCount = hero.querySelector('[data-bind="hero-phase-count"]');
  if (phaseCount)
    phaseCount.textContent = `${completed} of ${total} complete`;
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
  if (phaseBar)
    phaseBar.style.width = `${total ? Math.round((completed / total) * 100) : 0}%`;

  const nav = sidebar.querySelector('[data-bind="phases"]');
  if (!nav) return;

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
        (_, si) =>
          `<span class="star ${si < phase.stars ? "earned" : ""}">★</span>`,
      ).join("");

      return `
      <button class="${cls}" data-phase="${i}">
        <span class="phase-num">${i + 1}</span>
        <span>${escHtml(phaseConfigs[i]?.name || `Phase ${i + 1}`)}</span>
        <span class="phase-stars">${stars}</span>
      </button>
    `;
    })
    .join("");

  nav.querySelectorAll(".phase-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.phase, 10);
      document.dispatchEvent(
        new CustomEvent("rma:navigate", { detail: { phase: idx } }),
      );
    });
  });
}

function escHtml(str) {
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}
