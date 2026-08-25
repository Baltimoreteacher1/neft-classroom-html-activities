// focus-mode.js — Clean, native distraction-free Focus Mode across whole-group lessons,
// small-group studios, interactive labs, and math tools.

export function toggleFocusMode(forceState) {
  if (typeof document === "undefined") return false;
  const isNowOn =
    typeof forceState === "boolean"
      ? document.body.classList.toggle("nt-focus-mode", forceState)
      : document.body.classList.toggle("nt-focus-mode");

  updateFocusControls();
  return isNowOn;
}

export function isFocusModeActive() {
  return typeof document !== "undefined" && document.body.classList.contains("nt-focus-mode");
}

function updateFocusControls() {
  const active = isFocusModeActive();
  document.querySelectorAll("[data-nt-focus-toggle]").forEach((btn) => {
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
    const label = btn.querySelector(".nt-focus-label");
    if (label) {
      label.textContent = active
        ? "Show buttons"
        : btn.id === "nt-focus-fab"
          ? "Hide buttons"
          : "Focus Mode";
    }
  });

  // Ensure the exit pill exists when focus is active
  let exitPill = document.getElementById("nt-exit-focus-pill");
  if (active) {
    if (!exitPill) {
      exitPill = document.createElement("button");
      exitPill.id = "nt-exit-focus-pill";
      exitPill.className = "nt-exit-focus-pill no-print";
      exitPill.type = "button";
      exitPill.innerHTML = `✕ Exit Focus Mode <kbd>Esc</kbd>`;
      exitPill.title = "Show sidebar and all menus (Esc)";
      exitPill.addEventListener("click", () => toggleFocusMode(false));
      document.body.appendChild(exitPill);
    }
  } else if (exitPill) {
    exitPill.remove();
  }
}

export function mountUniversalFocusButton() {
  if (typeof document === "undefined") return;

  // Inject focus mode stylesheet once
  if (!document.getElementById("nt-focus-mode-styles")) {
    const style = document.createElement("style");
    style.id = "nt-focus-mode-styles";
    style.textContent = `
      /* Exit Focus floating pill — ONLY visible when in Focus Mode */
      .nt-exit-focus-pill {
        position: fixed;
        top: 14px;
        right: 18px;
        z-index: 2147483647;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: #0f172a;
        color: #ffffff;
        font-family: "Hanken Grotesk", system-ui, -apple-system, sans-serif;
        font-size: 0.88rem;
        font-weight: 800;
        letter-spacing: 0.02em;
        border: 1.5px solid rgba(255, 255, 255, 0.4);
        border-radius: 999px;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .nt-exit-focus-pill kbd {
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-family: monospace;
      }
      .nt-exit-focus-pill:hover {
        background: #1e293b;
        transform: translateY(-1px);
        box-shadow: 0 10px 32px rgba(0, 0, 0, 0.45);
      }

      /* ── Full Screen Clean Focus Mode Layout ───────────────────────────── */
      body.nt-focus-mode {
        background: #f8fafc !important;
      }

      body.nt-focus-mode .app,
      body.nt-focus-mode #app {
        display: block !important;
        grid-template-columns: minmax(0, 1fr) !important;
        max-width: 1100px !important;
        margin: 0 auto !important;
        padding: 24px 20px 80px !important;
        width: 100% !important;
      }

      body.nt-focus-mode .app .sidebar,
      body.nt-focus-mode .sidebar,
      body.nt-focus-mode .lesson-hero,
      body.nt-focus-mode .site-header,
      body.nt-focus-mode .export-toolbar,
      body.nt-focus-mode .nt-next-phase-btn,
      body.nt-focus-mode .utility-menu,
      body.nt-focus-mode .nt-utility-menu,
      body.nt-focus-mode .status-bar-wrapper,
      body.nt-focus-mode .minimap,
      body.nt-focus-mode .topbar,
      body.nt-focus-mode .phero,
      body.nt-focus-mode .breadcrumb,
      body.nt-focus-mode .nav-links,
      body.nt-focus-mode .sg-hero,
      body.nt-focus-mode .sg-nav,
      body.nt-focus-mode .sg-footer,
      body.nt-focus-mode #nsr-launcher,
      body.nt-focus-mode #mwb-launcher,
      body.nt-focus-mode .ewl-supports-launcher,
      body.nt-focus-mode #nt-present-widget,
      body.nt-focus-mode .sg-station-timer,
      body.nt-focus-mode .annot-dock,
      body.nt-focus-mode .sg-annotation-tools,
      body.nt-focus-mode .class-board-strip,
      body.nt-focus-mode .phase-subcards-ribbon,
      body.nt-focus-mode .teacher-panel {
        display: none !important;
      }

      /* The one button left standing: a quiet pill that puts everything back. */
      .nt-focus-fab {
        position: fixed;
        left: 14px;
        bottom: 14px;
        z-index: 2147483000;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 44px;
        padding: 8px 16px;
        background: #ffffff;
        color: #12355b;
        font-family: "Hanken Grotesk", system-ui, -apple-system, sans-serif;
        font-size: 0.86rem;
        font-weight: 700;
        border: 1.5px solid #d7e2ed;
        border-radius: 999px;
        box-shadow: 0 2px 8px rgba(18, 53, 91, 0.14);
        cursor: pointer;
      }
      .nt-focus-fab:hover {
        border-color: #12355b;
      }
      body.nt-focus-mode .nt-focus-fab,
      body.nt-present .nt-focus-fab {
        display: none !important;
      }
      @media print {
        .nt-focus-fab {
          display: none !important;
        }
      }

      body.nt-focus-mode .main,
      body.nt-focus-mode .main-content,
      body.nt-focus-mode .phase-container,
      body.nt-focus-mode .phase,
      body.nt-focus-mode .sg-panel,
      body.nt-focus-mode .sg-main,
      body.nt-focus-mode .sg-stage,
      body.nt-focus-mode .sg-container,
      body.nt-focus-mode .sg-wrap,
      body.nt-focus-mode main,
      body.nt-focus-mode .container,
      body.nt-focus-mode .wrap {
        padding: 0 !important;
        margin: 0 auto !important;
        max-width: 100% !important;
        width: 100% !important;
      }

      body.nt-focus-mode .card,
      body.nt-focus-mode .vl-container,
      body.nt-focus-mode .ldl,
      body.nt-focus-mode .sg-card {
        max-width: 100% !important;
        margin-left: auto !important;
        margin-right: auto !important;
        box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08) !important;
      }
    `;
    document.head.appendChild(style);
  }

  // The visible entry point: one small pill that hides every other button,
  // menu, and floating widget on the page. Despite this function's name it
  // used to mount nothing — Focus Mode was only reachable through the Tools
  // menu, which is itself one of the buttons a distracted student never opens.
  if (!document.getElementById("nt-focus-fab")) {
    const fab = document.createElement("button");
    fab.id = "nt-focus-fab";
    fab.type = "button";
    fab.className = "nt-focus-fab no-print";
    fab.setAttribute("data-nt-focus-toggle", "");
    fab.setAttribute("aria-pressed", "false");
    fab.title = "Hide every other button and menu — Esc brings them back";
    fab.innerHTML = `<span aria-hidden="true">🙈</span> <span class="nt-focus-label">Hide buttons</span>`;
    fab.addEventListener("click", () => toggleFocusMode());
    document.body.appendChild(fab);
  }

  // Keyboard shortcut listener (Esc exits focus mode, Alt+F toggles)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isFocusModeActive()) {
      toggleFocusMode(false);
    } else if ((e.key === "f" || e.key === "F") && (e.altKey || e.metaKey)) {
      toggleFocusMode();
    }
  });
}
