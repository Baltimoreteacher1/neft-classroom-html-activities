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

  // Global sound hooks
  window.AudioSynth = {
    ctx: null,
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    playTone(freq, type, duration, vol=0.1) {
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
    click() { this.init(); this.playTone(600, 'sine', 0.05, 0.05); },
    success() { this.init(); this.playTone(800, 'sine', 0.1, 0.1); setTimeout(()=>this.playTone(1200, 'sine', 0.2, 0.1), 100); },
    error() { this.init(); this.playTone(200, 'sawtooth', 0.2, 0.1); },
    tada() { 
      this.init(); 
      this.playTone(523.25, 'sine', 0.1, 0.1);
      setTimeout(()=>this.playTone(659.25, 'sine', 0.1, 0.1), 100);
      setTimeout(()=>this.playTone(783.99, 'sine', 0.4, 0.15), 200);
    }
  };

  window.fireConfetti = function() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.inset = 0;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = 9999;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = Array.from({length: 120}).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.random() * 5 + 5,
      color: ['#F2A93B','#387F84','#C85A3A','#4A7C6F'][Math.floor(Math.random()*4)],
      size: Math.random() * 8 + 4,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2
    }));
    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.rot += p.rotSpeed;
        if (p.y < canvas.height) active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        ctx.restore();
      });
      if (active) requestAnimationFrame(loop);
      else canvas.remove();
    }
    loop();
  };

  document.addEventListener('click', e => { 
    if(e.target.closest('button, a, select, input[type="radio"], input[type="checkbox"], .phase-btn')) {
      if(window.AudioSynth) window.AudioSynth.click();
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
        <div style="font-weight:800; margin-bottom:8px;">📋 Lesson Forms</div>
        <div style="display:flex; gap:8px;">
          ${link(s.notes, "Notes", "📝")}
          ${link(s.practice, "Practice", "✏️")}
          ${link(s.quiz, "Quiz", "✅")}
        </div>
      </div>`;
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
      ${
        config.readiness
          ? `<a class="identity-readiness" href="/lessons/${encodeURIComponent(config.lessonId)}/readiness/" style="display:flex; align-items:center; gap:10px; text-decoration:none; color:inherit; background:var(--cream,#fdf3e0); border:1px solid var(--gold,#d4952a); border-radius:12px; padding:12px 16px; margin:0 0 16px; text-align:left;">
              <span style="font-size:1.5rem;" aria-hidden="true">📚</span>
              <span><strong>New to this topic?</strong> Take the quick 10-minute Get Ready check first — it finds what you're missing. <span style="white-space:nowrap; font-weight:700; color:var(--blue,#1a6fb5);">Start &rarr;</span></span>
            </a>`
          : ""
      }
      ${formsCardHtml(config)}
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

  const minimapHUD = document.createElement("div");
  minimapHUD.className = "minimap-hud";
  minimapHUD.style.cssText = "position:fixed; bottom:24px; right:24px; background:rgba(255,255,255,0.85); backdrop-filter:blur(12px); border:1px solid rgba(0,0,0,0.1); border-radius:50px; padding:10px 14px; display:flex; gap:8px; z-index:9999; box-shadow:0 10px 30px rgba(0,0,0,0.15); transition:0.3s;";
  document.body.append(minimapHUD);

  function updateMinimap() {
    const s = state.get();
    minimapHUD.innerHTML = s.phases.map((p, i) => {
      const isCurrent = i === s.currentPhase;
      const done = p.status === 'completed';
      const bg = isCurrent ? '#387F84' : (done ? '#F2A93B' : 'rgba(0,0,0,0.1)');
      const scale = isCurrent ? 'scale(1.2)' : 'scale(1)';
      return `<div style="width:12px;height:12px;border-radius:50%;background:${bg}; transform:${scale}; transition:0.3s; cursor:pointer;" title="Phase ${i+1}" onclick="document.dispatchEvent(new CustomEvent('rma:navigate', {detail:{phase:${i}}}))"></div>`;
    }).join('');
  }

  state.subscribe(() => {
    updateSidebar(sidebar, state, phaseConfigs);
    updateMinimap();
  });

  let scoreReported = false;
  state.subscribe(() => {
    if (scoreReported) return;
    const phases = state.get().phases;
    if (phases.length && phases.every((p) => p.status === "completed")) {
      scoreReported = true;
      if(window.AudioSynth) window.AudioSynth.tada();
      if(window.fireConfetti) window.fireConfetti();
      reportScore(state, config);
    }
  });

  updateSidebar(sidebar, state, phaseConfigs);
  updateMinimap();

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
      if (kind === "projects") return this.openProjects();
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
