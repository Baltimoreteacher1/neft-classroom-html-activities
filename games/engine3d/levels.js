import { onActivate } from "./a11y.js";

export const LEVELS = {
  1: {
    id: 1,
    label: "Level 1",
    kind: "support",
    blurb: "Step-by-step help and key words first.",
  },
  2: {
    id: 2,
    label: "Level 2",
    kind: "enrichment",
    blurb: "Extra challenge and bigger goals.",
  },
};

/**
 * Level selection UI. Level 1 = support/scaffolded, Level 2 = enrichment.
 * Never uses the word "ESOL".
 * onSelect receives the numeric level (1 or 2).
 */
export function showLevelSelect(
  mountEl,
  { onSelect, title = "Choose your level" } = {},
) {
  if (!mountEl) throw new Error("showLevelSelect: mountEl is required");
  injectLevelStyles();

  const overlay = document.createElement("div");
  overlay.className = "e3d-levels";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", title);
  overlay.innerHTML = `
    <div class="e3d-levels-card">
      <h2 class="e3d-levels-title">${title}</h2>
      <div class="e3d-levels-grid">
        <button class="e3d-level-btn" data-level="1" type="button">
          <span class="e3d-level-name">${LEVELS[1].label}</span>
          <span class="e3d-level-blurb">${LEVELS[1].blurb}</span>
        </button>
        <button class="e3d-level-btn" data-level="2" type="button">
          <span class="e3d-level-name">${LEVELS[2].label}</span>
          <span class="e3d-level-blurb">${LEVELS[2].blurb}</span>
        </button>
      </div>
    </div>`;
  mountEl.appendChild(overlay);

  overlay.querySelectorAll(".e3d-level-btn").forEach((btn) => {
    onActivate(btn, () => {
      const level = Number(btn.getAttribute("data-level"));
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (onSelect) onSelect(level);
    });
  });
  const first = overlay.querySelector(".e3d-level-btn");
  if (first) first.focus();

  return {
    dispose() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    },
  };
}

export function levelInfo(level) {
  return LEVELS[level] || LEVELS[1];
}

function injectLevelStyles() {
  if (document.getElementById("e3d-levels-styles")) return;
  const s = document.createElement("style");
  s.id = "e3d-levels-styles";
  s.textContent = `
  .e3d-levels{position:absolute;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;
    background:rgba(18,53,91,.94);padding:var(--sp-4,16px);font-family:var(--font-body,system-ui,sans-serif);}
  .e3d-levels-card{background:var(--card,#fff);color:var(--ink,#21313f);max-width:480px;width:100%;
    border-radius:var(--radius-lg,22px);padding:var(--sp-6,24px);text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.4);}
  .e3d-levels-title{font-family:var(--font-display,system-ui,sans-serif);color:var(--navy,#12355b);margin:0 0 var(--sp-5,20px);}
  .e3d-levels-grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4,16px);}
  @media (max-width:480px){.e3d-levels-grid{grid-template-columns:1fr;}}
  .e3d-level-btn{display:flex;flex-direction:column;gap:6px;padding:var(--sp-5,20px);cursor:pointer;
    border:2px solid var(--line,#d7e2ed);border-radius:var(--radius-md,14px);background:var(--cream,#f7f4ec);text-align:center;}
  .e3d-level-btn:hover{border-color:var(--teal,#1fa6a2);}
  .e3d-level-btn:focus-visible{outline:3px solid var(--amber,#f2c15b);outline-offset:2px;}
  .e3d-level-name{font-family:var(--font-display,system-ui,sans-serif);font-size:22px;font-weight:700;color:var(--navy,#12355b);}
  .e3d-level-blurb{font-size:15px;color:var(--muted,#5f6f80);}`;
  document.head.appendChild(s);
}
