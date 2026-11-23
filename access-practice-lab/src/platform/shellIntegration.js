/**
 * Integrates Role Switcher (Teacher | Student | Family View),
 * Global Home Language (L1) Selector, Theme Toggle (Light/Dark/Auto),
 * and Hidden Diagnostics Overlay (?debug=1 or Ctrl+Shift+D).
 */

import { BASE, html, toHtml } from "../util.js";
import { HOME_LANGUAGES } from "./data/platformData.js";
import { getLogEvents, isDebugEnabled, subscribeLogs } from "./services/logger.js";
import { STORAGE_KEYS, readStorage, updateStorage } from "./services/storageService.js";

function resolveEffectiveTheme(prefTheme) {
  return prefTheme === "dark" ? "dark" : "light";
}

export function applyPlatformAttributes() {
  if (typeof document === "undefined") return;
  const prefs = readStorage(STORAGE_KEYS.PREFS);
  const root = document.documentElement;
  root.dataset.tlpRole = prefs.role || "teacher";
  root.dataset.tlpTheme = resolveEffectiveTheme(prefs.theme);
  root.dataset.tlpL1 = prefs.l1 || "es";
}

let debugBound = false;
let debugOpen = false;

function renderDiagnosticsDock() {
  if (typeof document === "undefined") return;
  let dock = document.getElementById("tlpDiagnostics");
  if (!debugOpen && !isDebugEnabled()) {
    dock?.remove();
    return;
  }
  if (!dock) {
    dock = document.createElement("aside");
    dock.id = "tlpDiagnostics";
    dock.className = "tlp-debug-dock no-print";
    dock.setAttribute("aria-label", "Platform Diagnostics");
    document.body.appendChild(dock);
  }
  const events = getLogEvents().slice(-8).reverse();
  const navTiming = typeof performance !== "undefined" && performance.now ? `${Math.round(performance.now())}ms` : "n/a";

  dock.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
      <strong>TLP Diagnostics (Ctrl+Shift+D)</strong>
      <button type="button" class="tlp-icon-btn" style="min-height:24px;padding:0 0.5rem" id="tlpDebugClose">✕</button>
    </div>
    <div style="margin-bottom:0.5rem">
      <span>Adapter: <strong>deterministic-local</strong></span> ·
      <span class="tlp-tabular">Uptime: ${navTiming}</span>
    </div>
    <div style="border-top:1px solid var(--tlp-border);padding-top:0.45rem;max-height:180px;overflow-y:auto">
      ${events.length
        ? events
            .map(
              (ev) => `<div style="margin-bottom:0.25rem"><code>${ev.category}:${ev.action}</code> <span class="tlp-muted">${JSON.stringify(ev.detail)}</span></div>`,
            )
            .join("")
        : `<p class="tlp-muted" style="margin:0">No state transitions logged yet.</p>`}
    </div>
  `;

  dock.querySelector("#tlpDebugClose")?.addEventListener("click", () => {
    debugOpen = false;
    dock.remove();
  });
}

// Home already presents the four Audience Doors right below the header; student views stay one calm column.
const CHROME_QUIET_VIEWS = new Set(["home", "students", "early", "session-done"]);

export function mountPlatformControls(ctx) {
  if (typeof document === "undefined") return;
  applyPlatformAttributes();
  const prefs = readStorage(STORAGE_KEYS.PREFS);
  const role = prefs.role || "teacher";
  const theme = prefs.theme === "dark" ? "dark" : "light";
  const l1 = prefs.l1 || "es";

  let bar = document.getElementById("tlpControlBar");
  const header = document.querySelector(".lab-top");
  if (!header) return;
  if (CHROME_QUIET_VIEWS.has(ctx?.route?.view)) {
    bar?.remove();
    document.getElementById("tlpStudioSubnav")?.remove();
    return;
  }
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "tlpControlBar";
    bar.className = "tlp-control-bar no-print";
    header.after(bar);
  }

  bar.innerHTML = toHtml(html`
    <div class="tlp-role-pills" role="group" aria-label="Workspace Role">
      ${[
        ["teacher", "Teacher"],
        ["student", "Student"],
        ["family", "Family View"],
      ].map(
        ([id, label]) => html`<button
          type="button"
          class="tlp-role-pill"
          data-tlp-role-btn="${id}"
          aria-pressed="${role === id ? "true" : "false"}"
        >
          ${label}
        </button>`,
      )}
    </div>
    <div class="tlp-control-right">
      <label style="display:inline-flex;align-items:center;gap:0.35rem">
        <span class="tlp-muted" style="font-size:0.78rem">L1:</span>
        <select id="tlpGlobalL1" class="tlp-select-compact" aria-label="Home Language (L1)">
          ${HOME_LANGUAGES.map(
            (lang) => html`<option value="${lang.code}" ${lang.code === l1 ? "selected" : ""}>${lang.label}</option>`,
          )}
        </select>
      </label>
      <button type="button" class="tlp-icon-btn" id="tlpThemeToggle" aria-label="Toggle color theme">
        ${theme === "dark" ? "Dark" : "Light"}
      </button>
    </div>
  `);

  const studioViews = new Set(["bridge", "architect", "simulator", "radar", "family-bridge"]);
  const currentView = ctx?.route?.view || "";
  let subnav = document.getElementById("tlpStudioSubnav");
  if (studioViews.has(currentView)) {
    if (!subnav) {
      subnav = document.createElement("nav");
      subnav.id = "tlpStudioSubnav";
      subnav.className = "tlp-control-bar no-print";
      subnav.style.background = "var(--tlp-bg)";
      subnav.setAttribute("aria-label", "Studio Quick Navigation");
      bar.after(subnav);
    }
    const links = [
      ["", "← Hub"],
      ["bridge", "1. Bridge"],
      ["architect", "2. Sentence Architect"],
      ["simulator", "3. Speaking Simulator"],
      ["radar", "4. Radar & Sprints"],
      ["family-bridge", "5. Family Bridge"],
    ];
    subnav.innerHTML = toHtml(html`
      <div class="tlp-actions-row" style="gap:0.35rem">
        ${links.map(
          ([path, label]) => html`<a
            class="tlp-tab"
            style="text-decoration:none;padding:0.35rem 0.75rem;font-size:0.82rem"
            href="${BASE}/${path}"
            ${currentView === path ? 'aria-selected="true"' : 'aria-selected="false"'}
          >
            ${label}
          </a>`,
        )}
      </div>
    `);
  } else {
    subnav?.remove();
  }

  bar.querySelectorAll("[data-tlp-role-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      updateStorage(STORAGE_KEYS.PREFS, { role: btn.dataset.tlpRoleBtn });
      applyPlatformAttributes();
      ctx.rerender();
    });
  });

  bar.querySelector("#tlpGlobalL1")?.addEventListener("change", (e) => {
    updateStorage(STORAGE_KEYS.PREFS, { l1: e.target.value });
    applyPlatformAttributes();
    ctx.rerender();
  });

  bar.querySelector("#tlpThemeToggle")?.addEventListener("click", () => {
    const next = theme === "dark" ? "light" : "dark";
    updateStorage(STORAGE_KEYS.PREFS, { theme: next });
    applyPlatformAttributes();
    ctx.rerender();
  });

  if (!debugBound) {
    debugBound = true;
    subscribeLogs(() => {
      if (debugOpen || isDebugEnabled()) renderDiagnosticsDock();
    });
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        debugOpen = !debugOpen;
        renderDiagnosticsDock();
      }
    });
    window.addEventListener("tlp:rerender", () => ctx.rerender());
  }
  renderDiagnosticsDock();
}
