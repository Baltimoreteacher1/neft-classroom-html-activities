// @ts-nocheck
// focus-mode.js — Distraction-free Focus Mode across whole-group lessons,
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
        top: 12px;
        right: 84px;
        z-index: 9999;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        background: #ffffff;
        color: #0f172a;
        font-family: "Hanken Grotesk", system-ui, -apple-system, sans-serif;
        font-size: 0.82rem;
        font-weight: 700;
        border: 1.5px solid #cbd5e1;
        border-radius: 999px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
        cursor: pointer;
        user-select: none;
        transition: all 0.15s ease;
      }
      .nt-universal-focus-btn:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
      }
      .nt-universal-focus-btn:active {
        transform: translateY(0);
      }

      /* In Focus Mode: position prominently at top right */
      body.nt-focus-mode .nt-universal-focus-btn {
        position: fixed !important;
        top: 14px !important;
        right: 18px !important;
        z-index: 100000 !important;
        background: #0f172a !important;
        color: #ffffff !important;
        border: 1.5px solid rgba(255,255,255,0.4) !important;
        padding: 8px 16px !important;
        font-size: 0.88rem !important;
        font-weight: 800 !important;
        box-shadow: 0 6px 24px rgba(0,0,0,0.35) !important;
      }
      body.nt-focus-mode .nt-universal-focus-btn:hover {
        background: #1e293b !important;
        border-color: #ffffff !important;
      }

      /* ── Universal Focus Mode Layout Rules ────────────────────────────── */
      body.nt-focus-mode {
        background: #f8fafc !important;
      }

      body.nt-focus-mode .app,
      body.nt-focus-mode #app {
        display: block !important;
        grid-template-columns: minmax(0, 1fr) !important;
        max-width: 1080px !important;
        margin: 0 auto !important;
        padding: 24px 16px 80px !important;
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
      body.nt-focus-mode .ewl-supports-launcher {
        display: none !important;
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

      @media (max-width: 768px) {
        .nt-universal-focus-btn {
          top: 8px;
          right: 64px;
          padding: 5px 10px;
          font-size: 0.75rem;
        }
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
  btn.title = "Hide surrounding menus and focus directly on the screen (Esc to exit)";
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
