// @ts-nocheck
// focus-mode.js — Ubiquitous distraction-free Focus Mode across whole-group lessons,
// small-group studios, interactive labs, and math tools.

export function mountUniversalFocusButton() {
  if (typeof document === "undefined") return;
  if (document.getElementById("ntUniversalFocusBtn")) return;

  // Inject scoped focus mode styles if not already present
  if (!document.getElementById("nt-focus-mode-global-styles")) {
    const style = document.createElement("style");
    style.id = "nt-focus-mode-global-styles";
    style.textContent = `
      .nt-universal-focus-btn {
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 99999;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 9px 18px;
        background: #0f172a;
        color: #ffffff;
        font-family: "Hanken Grotesk", system-ui, -apple-system, sans-serif;
        font-size: 0.88rem;
        font-weight: 800;
        letter-spacing: 0.02em;
        border: 2px solid rgba(255,255,255,0.25);
        border-radius: 999px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        cursor: pointer;
        user-select: none;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .nt-universal-focus-btn:hover {
        background: #1e293b;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        border-color: rgba(255,255,255,0.45);
      }
      .nt-universal-focus-btn:active {
        transform: translateY(0);
      }

      /* In Focus Mode, shift the button to an Exit Focus badge */
      body.nt-focus-mode .nt-universal-focus-btn {
        background: #0f766e;
        border-color: #5eead4;
        box-shadow: 0 0 0 3px rgba(94,234,212,0.3), 0 8px 24px rgba(0,0,0,0.4);
      }

      /* Universal Hide Rules in Focus Mode */
      body.nt-focus-mode .sidebar,
      body.nt-focus-mode .sg-sidebar,
      body.nt-focus-mode .lesson-hero,
      body.nt-focus-mode .sg-header,
      body.nt-focus-mode .sg-nav,
      body.nt-focus-mode .export-toolbar,
      body.nt-focus-mode .nt-next-phase-btn,
      body.nt-focus-mode .utility-menu,
      body.nt-focus-mode .nt-utility-menu,
      body.nt-focus-mode .status-bar-wrapper,
      body.nt-focus-mode .site-header,
      body.nt-focus-mode .minimap,
      body.nt-focus-mode .app-header,
      body.nt-focus-mode .topbar,
      body.nt-focus-mode .phero,
      body.nt-focus-mode .breadcrumb,
      body.nt-focus-mode .nav-links,
      body.nt-focus-mode #nsr-launcher,
      body.nt-focus-mode #mwb-launcher,
      body.nt-focus-mode .ewl-supports-launcher {
        display: none !important;
      }

      body.nt-focus-mode .main-content,
      body.nt-focus-mode .app-container,
      body.nt-focus-mode .phase,
      body.nt-focus-mode .sg-stage,
      body.nt-focus-mode .sg-main,
      body.nt-focus-mode main,
      body.nt-focus-mode .container,
      body.nt-focus-mode .wrap {
        margin: 0 auto !important;
        max-width: 100vw !important;
        width: 100% !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
      }

      body.nt-focus-mode .ldl,
      body.nt-focus-mode .vl-dual-stage,
      body.nt-focus-mode .sg-panel,
      body.nt-focus-mode .card {
        max-width: 1100px !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
    `;
    document.head.appendChild(style);
  }

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "ntUniversalFocusBtn";
  btn.className = "nt-universal-focus-btn no-print";
  btn.setAttribute("aria-pressed", "false");
  btn.setAttribute("aria-label", "Toggle Focus Mode (Hide extra menus and focus on screen)");
  btn.title = "Hide surrounding buttons and focus directly on the screen (Esc to exit)";
  btn.innerHTML = `<span class="nt-focus-icon" aria-hidden="true">🎯</span> <span class="nt-focus-text">Focus Screen</span>`;

  const syncState = () => {
    const isFocus = document.body.classList.contains("nt-focus-mode");
    btn.setAttribute("aria-pressed", isFocus ? "true" : "false");
    btn.innerHTML = isFocus
      ? `<span class="nt-focus-icon" aria-hidden="true">✕</span> <span class="nt-focus-text">Exit Focus</span>`
      : `<span class="nt-focus-icon" aria-hidden="true">🎯</span> <span class="nt-focus-text">Focus Screen</span>`;
  };

  btn.addEventListener("click", () => {
    document.body.classList.toggle("nt-focus-mode");
    syncState();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("nt-focus-mode")) {
      document.body.classList.remove("nt-focus-mode");
      syncState();
    }
  });

  document.body.appendChild(btn);
}
