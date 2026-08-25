//
// API:  renderPercentGridLab(host, cfg) -> { destroy() } | null   (null ⇒ static fallback)

const STYLE_ID = "percent-grid-lab-styles";

function injectStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
  .pgl{color-scheme:light;--pg-teal:var(--teal,#2a9d8f);--pg-coral:var(--coral,#d9795d);--pg-navy:var(--navy,#264653);--pg-muted:var(--muted,#6b7280);
    border:1px solid rgba(38,70,83,.14);border-radius:12px;padding:12px;margin:var(--sp-3,12px) 0;background:#fff}
  .pgl-title{font-weight:700;color:var(--pg-navy);margin:0 0 8px;font-size:.92rem}
  .pgl-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:2px;max-width:260px;margin:0 auto;touch-action:manipulation}
  .pgl-cell{aspect-ratio:1;border:1px solid rgba(38,70,83,.25);border-radius:3px;background:#fff;cursor:pointer;padding:0}
  .pgl-cell[aria-pressed="true"]{background:var(--pg-teal);border-color:var(--pg-teal)}
  .pgl-read{text-align:center;font-weight:700;color:var(--pg-navy);margin:10px 0 6px}
  .pgl-tools{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
  .pgl-btn{font:inherit;font-size:.82rem;font-weight:600;color:var(--pg-navy);background:#fff;border:1.5px solid rgba(38,70,83,.22);border-radius:999px;padding:6px 12px;cursor:pointer}
  .pgl-btn:hover{border-color:var(--pg-teal);color:var(--pg-teal)}
  .pgl-btn[aria-pressed="true"]{background:var(--pg-teal);border-color:var(--pg-teal);color:#fff}
  .pgl-forms{display:none;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:10px}
  .pgl.show .pgl-forms{display:flex}
  .pgl-form{background:#fff;border:1px solid rgba(38,70,83,.14);border-radius:10px;padding:6px 12px;text-align:center;min-width:74px}
  .pgl-form b{display:block;font-size:1.05rem;color:var(--pg-navy)}
  .pgl-form span{font-size:.66rem;color:var(--pg-muted);font-weight:600;text-transform:uppercase;letter-spacing:.03em}
`;
  document.head.appendChild(s);
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}
function trimDec(n) {
  return String(Math.round(n * 100) / 100);
}

export function renderPercentGridLab(host, cfg = {}) {
  try {
    if (typeof document === "undefined") return null;
    const authored = Math.round(Number(cfg.percent));
    if (!Number.isFinite(authored) || authored < 0 || authored > 100) return null;
    injectStyles();

    const root = document.createElement("div");
    root.className = "pgl";
    root.innerHTML =
      `<p class="pgl-title">This grid shows the amount shaded. Reveal its equivalent forms — or tap squares to explore.</p>` +
      `<div class="pgl-grid" role="group" aria-label="Hundred-square grid"></div>` +
      `<div class="pgl-read" data-el="read" aria-live="polite"></div>` +
      `<div class="pgl-tools">` +
      `<button type="button" class="pgl-btn" data-el="reveal" aria-pressed="false">🔎 Reveal the forms</button>` +
      `<button type="button" class="pgl-btn" data-el="reset">↺ Reset</button></div>` +
      `<div class="pgl-forms" data-el="forms"></div>`;
    host.appendChild(root);
    const grid = root.querySelector(".pgl-grid");
    const read = root.querySelector('[data-el="read"]');
    const forms = root.querySelector('[data-el="forms"]');

    const cells = [];
    let shaded = 0;
    const setCell = (c, on) => {
      c.setAttribute("aria-pressed", String(on));
    };
    const recount = () => {
      shaded = cells.reduce((n, c) => n + (c.getAttribute("aria-pressed") === "true" ? 1 : 0), 0);
      read.textContent = `${shaded} of 100 squares shaded`;
      if (root.classList.contains("show")) renderForms();
    };
    function renderForms() {
      const g = gcd(shaded, 100);
      const frac = shaded === 0 ? "0" : `${shaded / g}/${100 / g}`;
      forms.innerHTML =
        `<div class="pgl-form"><b>${shaded}%</b><span>percent</span></div>` +
        `<div class="pgl-form"><b>${trimDec(shaded / 100)}</b><span>decimal</span></div>` +
        `<div class="pgl-form"><b>${frac}</b><span>fraction</span></div>`;
    }

    for (let i = 0; i < 100; i++) {
      const c = document.createElement("button");
      c.type = "button";
      c.className = "pgl-cell";
      c.setAttribute("aria-pressed", "false");
      c.setAttribute("aria-label", `Square ${i + 1}`);
      c.addEventListener("click", () => {
        setCell(c, c.getAttribute("aria-pressed") !== "true");
        recount();
      });
      cells.push(c);
      grid.appendChild(c);
    }
    const applyAuthored = () => cells.forEach((c, i) => setCell(c, i < authored));
    applyAuthored();
    recount();

    root.querySelector('[data-el="reveal"]').addEventListener("click", (e) => {
      const on = root.classList.toggle("show");
      /** @type {HTMLElement} */ (e.currentTarget).setAttribute("aria-pressed", String(on));
      if (on) renderForms();
    });
    root.querySelector('[data-el="reset"]').addEventListener("click", () => {
      applyAuthored();
      recount();
    });

    return {
      destroy() {
        root.remove();
      },
    };
  } catch (e) {
    console.warn("percent-grid-lab: render failed", e);
    return null;
  }
}

export default renderPercentGridLab;
