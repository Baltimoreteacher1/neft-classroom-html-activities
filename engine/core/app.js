import { createState, normalizeStudentId, findSavedStudents } from "./state.js";
import { createEngagement } from "../engagement/engagement.js";
import "@engine/styles/design-system.css";
import "@engine/styles/themes.css";

export function createApp(config) {
  const root = document.getElementById("app");
  root.innerHTML = "";
  root.className = "app";
  if (config.theme) {
    document.documentElement.setAttribute("data-theme", config.theme);
    root.setAttribute("data-theme", config.theme);
  }

  showIdentityScreen(root, config);
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
      state.setPhase(index);
      if (config.phases[index]) {
        this.renderPhase(index, config.phases[index]);
      }
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

    <div class="phase-nav" data-bind="phases"></div>

    <div style="margin-top:auto; opacity:0.5; font-size:0.7rem; text-align:center;">
      Neft Teacher · ${escHtml(config.standard)}
    </div>
  `;

  return sidebar;
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
        phase.status === "locked" ? "locked" : "",
      ]
        .filter(Boolean)
        .join(" ");

      const stars = Array.from(
        { length: 3 },
        (_, si) =>
          `<span class="star ${si < phase.stars ? "earned" : ""}">★</span>`,
      ).join("");

      return `
      <button class="${cls}" data-phase="${i}" ${phase.status === "locked" ? "disabled" : ""}>
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

function escAttr(str) {
  return (str ?? "").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
