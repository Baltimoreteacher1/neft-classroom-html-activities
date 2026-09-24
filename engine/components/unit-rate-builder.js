// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
//
// Pure DOM, no dependencies. Public API:
//   renderUnitRateBuilder(container, cfg) -> { destroy }
//     cfg.a, cfg.b     : starting quantities (default 120, 3)
//     cfg.unitA,unitB  : unit labels (default "miles", "hours")
//     cfg.presets      : quick-pick "a/b" strings

const C = {
  navy: "#12355b",
  accent: "#1d4ed8",
  teal: "#0d7a76",
  ink: "#1a2b3c",
  muted: "#54677c",
  line: "#d7e2ed",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

function fmt(n) {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0$/, "");
}

export function renderUnitRateBuilder(container, cfg = {}) {
  const unitA = cfg.unitA || "miles";
  const unitB = cfg.unitB || "hours";
  const unitAsing = cfg.unitASingular || unitA.replace(/s$/, "");
  const unitBsing = cfg.unitBSingular || unitB.replace(/s$/, "");
  let a = clamp(cfg.a ?? 120);
  let b = clamp(cfg.b ?? 3);

  function clamp(v) {
    v = Math.floor(Number(v) || 0);
    return Math.max(1, Math.min(100000, v));
  }

  const presets =
    Array.isArray(cfg.presets) && cfg.presets.length
      ? cfg.presets
      : ["120/3", "150/5", "84/7", "200/8"];

  injectStyles();

  const root = document.createElement("div");
  root.className = "urlab";
  root.innerHTML =
    `<div class="urlab-title">Unit Rate Lab</div>` +
    `<p class="urlab-hint">A <strong>unit rate</strong> tells you how much for just <strong>one</strong>. Type the two amounts and divide to find each per-1 rate.</p>` +
    `<div class="urlab-controls">` +
    `<label class="urlab-field"><span>${esc(unitA)}</span><input type="number" min="1" value="${a}" data-inp="a" aria-label="${esc(unitA)}"/></label>` +
    `<span class="urlab-per">per</span>` +
    `<label class="urlab-field"><span>${esc(unitB)}</span><input type="number" min="1" value="${b}" data-inp="b" aria-label="${esc(unitB)}"/></label>` +
    `<button type="button" class="urlab-go">Find unit rate →</button></div>` +
    `<div class="urlab-presets" role="group" aria-label="Quick-pick rates">` +
    presets
      .map(
        (p) =>
          `<button type="button" class="urlab-chip" data-p="${esc(p)}">${esc(p.replace("/", ` ${unitA} / `))} ${esc(unitB)}</button>`,
      )
      .join("") +
    `</div>` +
    `<div class="urlab-result" aria-live="polite"></div>`;

  container.appendChild(root);

  const inA = root.querySelector('[data-inp="a"]');
  const inB = root.querySelector('[data-inp="b"]');
  const result = root.querySelector(".urlab-result");

  function compute() {
    a = clamp(inA.value);
    b = clamp(inB.value);
    inA.value = a;
    inB.value = b;
    const rateAB = a / b; // unitA per 1 unitB
    const rateBA = b / a; // unitB per 1 unitA

    result.innerHTML =
      `<div class="urlab-card urlab-card-main">` +
      `<div class="urlab-step"><span class="urlab-badge">Step 1</span> <strong>Rate as a Fraction:</strong> <span class="urlab-frac"><span class="urlab-frac-top">${a} ${esc(unitA)}</span><span class="urlab-frac-bottom">${b} ${esc(unitB)}</span></span></div>` +
      `<div class="urlab-step"><span class="urlab-badge">Step 2</span> <strong>Divide both parts by the bottom number (${b}):</strong> <span class="urlab-frac"><span class="urlab-frac-top">${a} ÷ ${b}</span><span class="urlab-frac-bottom">${b} ÷ ${b}</span></span></div>` +
      `<div class="urlab-step urlab-step-highlight"><span class="urlab-badge urlab-badge-gold">Step 3</span> <strong>Unit Rate in fraction form over 1:</strong>` +
      `<div class="urlab-big"><span class="urlab-frac"><span class="urlab-frac-top">${fmt(rateAB)} ${esc(unitA)}</span><span class="urlab-frac-bottom">1 ${esc(unitBsing)}</span></span></div>` +
      `<div class="urlab-subnote">${fmt(rateAB)} ${esc(unitA)} per 1 ${esc(unitBsing)}</div></div>` +
      `</div>` +
      `<div class="urlab-card">` +
      `<div class="urlab-step"><span class="urlab-badge">Alternative</span> <strong>${esc(unitB)} per 1 ${esc(unitAsing)}:</strong></div>` +
      `<div class="urlab-step">Fraction: <span class="urlab-frac"><span class="urlab-frac-top">${b} ${esc(unitB)}</span><span class="urlab-frac-bottom">${a} ${esc(unitA)}</span></span></div>` +
      `<div class="urlab-step">Divide both by ${a}: <span class="urlab-frac"><span class="urlab-frac-top">${b} ÷ ${a}</span><span class="urlab-frac-bottom">${a} ÷ ${a}</span></span></div>` +
      `<div class="urlab-big urlab-alt"><span class="urlab-frac"><span class="urlab-frac-top">${fmt(rateBA)} ${esc(unitB)}</span><span class="urlab-frac-bottom">1 ${esc(unitAsing)}</span></span></div>` +
      `<div class="urlab-work">${fmt(rateBA)} ${esc(unitB)} per 1 ${esc(unitAsing)}</div>` +
      `</div>` +
      `<p class="urlab-explain"><strong>How to find a Unit Rate:</strong> Write the rate as a fraction, divide both parts (top and bottom) by the bottom number, and write your unit rate in fraction form over 1!</p>`;
  }

  root.querySelector(".urlab-go").addEventListener("click", compute);
  root.querySelectorAll(".urlab-chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      const [x, y] = chip.dataset.p.split("/");
      inA.value = x;
      inB.value = y;
      compute();
    }),
  );
  [inA, inB].forEach((inp) =>
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        compute();
      }
    }),
  );

  compute();
  return { destroy: () => root.remove() };
}

let injected = false;
function injectStyles() {
  if (injected || document.getElementById("urlab-styles")) {
    injected = true;
    return;
  }
  injected = true;
  const s = document.createElement("style");
  s.id = "urlab-styles";
  s.textContent = `
  .urlab{max-width:640px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:18px 18px 20px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .urlab-title{font-family:"Outfit",system-ui,sans-serif;font-weight:800;color:${C.navy};font-size:1.15rem;}
  .urlab-hint{margin:4px 0 12px;color:${C.muted};font-size:.95rem;line-height:1.5;}
  .urlab-controls{display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px;}
  .urlab-field{display:flex;flex-direction:column;gap:3px;font-size:.78rem;font-weight:700;color:${C.muted};text-transform:uppercase;}
  .urlab-field input{width:104px;padding:8px 10px;font-size:1.15rem;font-weight:700;color:${C.ink};border:2px solid ${C.line};border-radius:10px;background:#fbfcfe;}
  .urlab-field input:focus-visible{outline:3px solid ${C.accent};outline-offset:1px;border-color:${C.accent};}
  .urlab-per{align-self:center;padding-bottom:9px;font-weight:700;color:${C.muted};font-size:.95rem;}
  .urlab-go{padding:10px 18px;font-size:1rem;font-weight:800;color:#fff;background:linear-gradient(135deg,#1d4ed8,#0d7a76);border:0;border-radius:10px;cursor:pointer;transition:transform 0.15s ease;}
  .urlab-go:hover{filter:brightness(1.08);transform:translateY(-1px);}
  .urlab-go:focus-visible,.urlab-chip:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .urlab-presets{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0 0;}
  .urlab-chip{padding:6px 14px;font-size:.9rem;font-weight:700;color:${C.navy};background:#f4f8ff;border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;transition:all 0.15s ease;}
  .urlab-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .urlab-result{margin-top:16px;display:flex;flex-wrap:wrap;gap:12px;justify-content:center;}
  .urlab-card{flex:1 1 280px;min-width:260px;background:#f8fbff;border:1.5px solid ${C.line};border-radius:14px;padding:16px;text-align:left;}
  .urlab-card-main{border-color:${C.teal};background:#f0faf8;}
  .urlab-step{margin-bottom:8px;font-size:.95rem;line-height:1.45;color:${C.ink};}
  .urlab-badge{display:inline-block;padding:2px 8px;font-size:.75rem;font-weight:800;border-radius:999px;background:#e0f2fe;color:#0369a1;margin-right:6px;}
  .urlab-badge-gold{background:#fef3c7;color:#b45309;}
  .urlab-frac{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;font-weight:700;margin:0 4px;font-size:.9rem;}
  .urlab-frac-top{border-bottom:2px solid ${C.ink};padding:0 4px;}
  .urlab-frac-bottom{padding:0 4px;}
  .urlab-step-highlight{background:#ffffff;border:1.5px solid #0d7a76;border-radius:10px;padding:10px 12px;margin-top:10px;text-align:center;}
  .urlab-big{font-family:"Outfit",system-ui,sans-serif;font-weight:800;font-size:1.35rem;color:${C.teal};margin-top:4px;}
  .urlab-subnote{font-size:.85rem;font-weight:700;color:#b45309;margin-top:2px;}
  .urlab-alt{color:${C.accent};}
  .urlab-work{margin-top:4px;color:${C.muted};font-size:.88rem;}
  .urlab-explain{flex-basis:100%;margin:6px auto 0;max-width:560px;color:${C.ink};font-size:.95rem;line-height:1.55;text-align:center;}
  `;
  document.head.appendChild(s);
}

export default renderUnitRateBuilder;
