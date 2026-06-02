import { createState, normalizeStudentId, findSavedStudents } from "./state.js";
import { createEngagement } from "../engagement/engagement.js";
import { mountExportToolbar } from "./export.js";
import { reportScore } from "./score-reporter.js";
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

function showIdentityScreen(root, config) {
  const themeEmoji = config.themeEmoji || "📐";
  const saved = findSavedStudents(config.lessonId);

  const screen = document.createElement("div");
  screen.className = "identity-screen";
  screen.innerHTML = `
    <div class="identity-card">
      <div class="identity-emoji">${themeEmoji}</div>
      <h1 class="identity-title">${escHtml(config.title)}</h1>
      <p class="identity-sub">${escHtml(config.standard)} · Unit ${config.unit}</p>
      <div class="identity-form">
        <label for="id-name">Your Name</label>
        <input id="id-name" type="text" placeholder="First name Last initial" autocomplete="off" />
        <label for="id-period">Period</label>
        <input id="id-period" type="text" placeholder="e.g. 3" autocomplete="off" />
        <button id="id-start" class="identity-btn" disabled>Start Activity</button>
      </div>
      ${saved.length ? `<div class="identity-saved" id="id-saved-list"></div>` : ""}
    </div>
  `;
  root.append(screen);

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
    label.textContent = "Saved progress on this device:";
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
    { name: "Launch", icon: "🚀" },
    { name: "Vocab Builder", icon: "📖" },
    { name: "Explore", icon: "🔍" },
    { name: "Practice", icon: "✏️" },
    { name: "Connect", icon: "🌎" },
    { name: "Reflect", icon: "💡" },
  ];

  state.initPhases(phaseConfigs);

  const sidebar = buildSidebar(config, state, phaseConfigs);
  const main = document.createElement("div");
  main.className = "main";
  main.setAttribute("role", "main");

  root.append(sidebar, main);

  const phaseContainer = document.createElement("div");
  phaseContainer.className = "phase-container";
  main.append(phaseContainer);

  const celebrationOverlay = document.createElement("div");
  celebrationOverlay.className = "celebration-overlay";
  celebrationOverlay.setAttribute("aria-hidden", "true");
  document.body.append(celebrationOverlay);

  state.subscribe(() => {
    updateSidebar(sidebar, state, phaseConfigs);
  });

  let scoreReported = false;
  state.subscribe(() => {
    if (scoreReported) return;
    const phases = state.get().phases;
    if (phases.length && phases.every((p) => p.status === "completed")) {
      scoreReported = true;
      reportScore(state, config);
    }
  });

  updateSidebar(sidebar, state, phaseConfigs);

  const app = {
    state,
    engagement,
    main,
    phaseContainer,
    celebrationOverlay,

    renderPhase(index, renderFn) {
      phaseContainer.innerHTML = "";
      const el = document.createElement("div");
      el.className = "phase active";
      el.setAttribute("role", "region");
      el.setAttribute(
        "aria-label",
        phaseConfigs[index]?.name || `Phase ${index + 1}`,
      );
      phaseContainer.append(el);
      renderFn(el, state, this);
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

    ${preLessonNavHtml(config)}

    <div class="phase-nav" data-bind="phases"></div>

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

function updateSidebar(sidebar, state, phaseConfigs) {
  const s = state.get();

  const xpVal = sidebar.querySelector('[data-bind="xp"]');
  if (xpVal) xpVal.textContent = `${s.xp} / ${s.maxXp}`;

  const xpBar = sidebar.querySelector('[data-bind="xp-bar"]');
  if (xpBar) xpBar.style.width = `${Math.min(100, (s.xp / s.maxXp) * 100)}%`;

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
