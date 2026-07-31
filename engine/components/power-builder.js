// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
// power-builder.js — Interactive powers & exponents lab. A student types a base
// and an exponent and the widget expands the power into repeated multiplication
// and evaluates it step by step: 2⁵ = 2 × 2 × 2 × 2 × 2 = 32. It is the natural
// sibling of the Factor Tree Lab (which outputs exponent notation) and reinforces
// that an exponent is a *count of factors*, not "multiply base × exponent".
//
// Pure DOM, no dependencies. Public API:
//   renderPowerBuilder(container, cfg) -> { destroy }
//     cfg.base     : starting base (default 2)
//     cfg.exponent : starting exponent (default 5)
//     cfg.presets  : quick-pick "base^exp" strings (default sensible set)
//     cfg.maxValue : cap on the evaluated result (default 1e7)

const C = {
  navy: "#12355b",
  accent: "#1d4ed8",
  teal: "#0d7a76",
  amber: "#d4952a",
  ink: "#1a2b3c",
  muted: "#54677c",
  line: "#d7e2ed",
  chipBg: "#f4f8ff",
};

const SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
function sup(n) {
  return String(n)
    .split("")
    .map((d) => SUP[d] || d)
    .join("");
}

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

export function renderPowerBuilder(container, cfg = {}) {
  const MAXV = cfg.maxValue || 1e7;
  let base = clampBase(cfg.base ?? 2);
  let exp = clampExp(cfg.exponent ?? 5);

  function clampBase(v) {
    v = Math.floor(Number(v) || 0);
    return Math.max(0, Math.min(20, v));
  }
  function clampExp(v) {
    v = Math.floor(Number(v) || 0);
    return Math.max(0, Math.min(12, v));
  }

  const presets =
    Array.isArray(cfg.presets) && cfg.presets.length
      ? cfg.presets
      : ["2^3", "3^2", "5^3", "10^4", "2^5", "4^3"];

  injectStyles();

  const root = document.createElement("div");
  root.className = "pwrlab";
  root.innerHTML =
    `<div class="pwrlab-head"><span class="pwrlab-title">Powers &amp; Exponents Lab</span></div>` +
    `<p class="pwrlab-hint">An exponent tells you <strong>how many times</strong> to use the base as a factor. Type a base and an exponent, then expand and evaluate it.</p>` +
    `<div class="pwrlab-controls">` +
    `<label class="pwrlab-field"><span>Base</span><input type="number" inputmode="numeric" min="0" max="20" value="${base}" data-inp="base" aria-label="Base (0 to 20)" /></label>` +
    `<span class="pwrlab-caret">to the</span>` +
    `<label class="pwrlab-field"><span>Exponent</span><input type="number" inputmode="numeric" min="0" max="12" value="${exp}" data-inp="exp" aria-label="Exponent (0 to 12)" /></label>` +
    `<button type="button" class="pwrlab-go">Expand &amp; evaluate →</button></div>` +
    `<div class="pwrlab-presets" role="group" aria-label="Quick-pick powers">` +
    presets
      .map(
        (p) =>
          `<button type="button" class="pwrlab-chip" data-p="${esc(p)}">${formatPreset(p)}</button>`,
      )
      .join("") +
    `</div>` +
    `<div class="pwrlab-result" aria-live="polite"></div>`;

  container.appendChild(root);

  const inBase = root.querySelector('[data-inp="base"]');
  const inExp = root.querySelector('[data-inp="exp"]');
  const result = root.querySelector(".pwrlab-result");

  function formatPreset(p) {
    const [b, e] = p.split("^");
    return `${b}${sup(e || "")}`;
  }

  function evaluate() {
    base = clampBase(inBase.value);
    exp = clampExp(inExp.value);
    inBase.value = base;
    inExp.value = exp;

    const powerText = `${base}${sup(exp)}`;
    let body = "";

    if (exp === 0) {
      body =
        `<div class="pwrlab-power">${powerText} = 1</div>` +
        `<p class="pwrlab-explain">Any number (except 0) to the <strong>zero power</strong> is <strong>1</strong> — there are no factors to multiply, so you start from 1.</p>`;
    } else if (exp === 1) {
      body =
        `<div class="pwrlab-power">${powerText} = ${base}</div>` +
        `<p class="pwrlab-explain">A number to the <strong>first power</strong> is just the base itself — you use it as a factor exactly once.</p>`;
    } else {
      const factors = Array(exp).fill(base);
      const value = factors.reduce((a, b) => a * b, 1);
      const expanded = factors.join(" × ");
      const over = value > MAXV;
      body =
        `<div class="pwrlab-power">${powerText} = ${expanded}${over ? "" : ` = <strong>${value.toLocaleString("en-US")}</strong>`}</div>` +
        `<p class="pwrlab-explain">Use the base <strong>${base}</strong> as a factor <strong>${exp} times</strong>` +
        (over
          ? ` — this one grows past ${MAXV.toLocaleString("en-US")}, so keep the exponent smaller to see the exact value.`
          : `. Notice it is <em>not</em> ${base} × ${exp} = ${base * exp}; a common mistake is to multiply the base by the exponent.`) +
        `</p>`;
    }
    result.innerHTML = body;
  }

  root.querySelector(".pwrlab-go").addEventListener("click", evaluate);
  root.querySelectorAll(".pwrlab-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const [b, e] = chip.dataset.p.split("^");
      inBase.value = b;
      inExp.value = e || "1";
      evaluate();
    });
  });
  [inBase, inExp].forEach((inp) =>
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        evaluate();
      }
    }),
  );

  evaluate();

  return {
    destroy() {
      root.remove();
    },
  };
}

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || document.getElementById("pwrlab-styles")) {
    stylesInjected = true;
    return;
  }
  stylesInjected = true;
  const s = document.createElement("style");
  s.id = "pwrlab-styles";
  s.textContent = `
  .pwrlab{max-width:640px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:16px 16px 18px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .pwrlab-title{font-family:"Outfit",system-ui,sans-serif;font-weight:800;color:${C.navy};font-size:1.05rem;}
  .pwrlab-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.4;}
  .pwrlab-controls{display:flex;flex-wrap:wrap;align-items:flex-end;gap:10px;}
  .pwrlab-field{display:flex;flex-direction:column;gap:3px;font-size:.72rem;font-weight:700;color:${C.muted};text-transform:uppercase;letter-spacing:.03em;}
  .pwrlab-field input{width:86px;padding:8px 10px;font-size:1.1rem;font-weight:700;color:${C.ink};border:2px solid ${C.line};border-radius:10px;background:#fbfcfe;text-transform:none;}
  .pwrlab-field input:focus-visible{outline:3px solid ${C.accent};outline-offset:1px;border-color:${C.accent};}
  .pwrlab-caret{align-self:center;padding-bottom:9px;color:${C.muted};font-size:.85rem;font-weight:600;}
  .pwrlab-go{padding:9px 16px;font-size:.95rem;font-weight:800;color:#fff;background:linear-gradient(135deg,#4f46e5,#0e8a7d);border:0;border-radius:10px;cursor:pointer;}
  .pwrlab-go:hover{filter:brightness(1.08);}
  .pwrlab-go:focus-visible,.pwrlab-chip:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .pwrlab-presets{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0;}
  .pwrlab-chip{padding:5px 12px;font-size:.95rem;font-weight:700;color:${C.navy};background:${C.chipBg};border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .pwrlab-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .pwrlab-result{margin-top:14px;padding:14px;background:#f8fbff;border:1px solid ${C.line};border-radius:14px;text-align:center;}
  .pwrlab-power{font-family:"Outfit",system-ui,sans-serif;font-weight:800;font-size:1.2rem;color:${C.navy};line-height:1.5;word-break:break-word;}
  .pwrlab-explain{margin:8px auto 0;max-width:540px;color:${C.ink};font-size:.92rem;line-height:1.5;}
  @media (max-width:480px){.pwrlab-field input{width:72px;}}
  `;
  document.head.appendChild(s);
}

export default renderPowerBuilder;
