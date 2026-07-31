// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
// percent-builder.js — Interactive "percent of a number" lab. A student types a
// percent and a whole; the widget draws a double number line (0 → whole on top,
// 0% → 100% on the bottom) with a marker at the chosen percent, and shows
// p% of w = (p / 100) × w. Reinforces that "percent" means "out of 100" and that
// finding a percent of a number is scaling along the same line.
//
// Pure SVG + DOM, no dependencies. Public API:
//   renderPercentBuilder(container, cfg) -> { destroy }
//     cfg.percent, cfg.whole : starting values (default 25, 80)
//     cfg.presets            : quick-pick "p%ofw" strings, e.g. "25%of80"

const C = {
  navy: "#12355b",
  accent: "#1d4ed8",
  teal: "#0d7a76",
  fill: "#e2f9f5",
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

function round2(n) {
  return Math.round(n * 100) / 100;
}

export function renderPercentBuilder(container, cfg = {}) {
  let pct = clamp(cfg.percent ?? 25, 0, 100);
  let whole = clampWhole(cfg.whole ?? 80);

  function clamp(v, lo, hi) {
    v = Math.floor(Number(v) || 0);
    return Math.max(lo, Math.min(hi, v));
  }
  function clampWhole(v) {
    v = Math.floor(Number(v) || 0);
    return Math.max(1, Math.min(10000, v));
  }

  const presets =
    Array.isArray(cfg.presets) && cfg.presets.length
      ? cfg.presets
      : ["25%of80", "10%of50", "50%of36", "75%of120", "20%of45"];

  injectStyles();

  const root = document.createElement("div");
  root.className = "pctlab";
  root.innerHTML =
    `<div class="pctlab-title">Percent of a Number Lab</div>` +
    `<p class="pctlab-hint">"Percent" means "out of 100." Type a percent and a whole to find that part of the number.</p>` +
    `<div class="pctlab-controls">` +
    `<label class="pctlab-field"><span>Percent</span><input type="number" min="0" max="100" value="${pct}" data-inp="pct" aria-label="Percent (0 to 100)"/></label>` +
    `<span class="pctlab-of">% of</span>` +
    `<label class="pctlab-field"><span>Whole</span><input type="number" min="1" max="10000" value="${whole}" data-inp="whole" aria-label="The whole number"/></label>` +
    `<button type="button" class="pctlab-go">Find it →</button></div>` +
    `<div class="pctlab-presets" role="group" aria-label="Quick-pick problems">` +
    presets
      .map(
        (p) =>
          `<button type="button" class="pctlab-chip" data-p="${esc(p)}">${esc(p.replace("of", "% of ").replace("%%", "%"))}</button>`,
      )
      .join("") +
    `</div>` +
    `<div class="pctlab-stage"></div>` +
    `<div class="pctlab-result" aria-live="polite"></div>`;

  container.appendChild(root);

  const inP = root.querySelector('[data-inp="pct"]');
  const inW = root.querySelector('[data-inp="whole"]');
  const stage = root.querySelector(".pctlab-stage");
  const result = root.querySelector(".pctlab-result");

  function draw() {
    pct = clamp(inP.value, 0, 100);
    whole = clampWhole(inW.value);
    inP.value = pct;
    inW.value = whole;
    const part = round2((pct / 100) * whole);

    const W = 380;
    const H = 118;
    const PADL = 20;
    const PADR = 42;
    const lineW = W - PADL - PADR;
    const yTop = 34;
    const yBot = 84;
    const fx = PADL + (pct / 100) * lineW;

    const svg =
      `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;height:auto;display:block;margin:0 auto;" role="img" aria-label="Double number line: ${pct} percent of ${whole} is ${part}">` +
      // top line (quantity)
      `<line x1="${PADL}" y1="${yTop}" x2="${PADL + lineW}" y2="${yTop}" stroke="${C.line}" stroke-width="3"/>` +
      `<line x1="${PADL}" y1="${yTop}" x2="${fx}" y2="${yTop}" stroke="${C.teal}" stroke-width="4"/>` +
      `<text x="${PADL}" y="${yTop - 10}" font-family="Outfit,sans-serif" font-weight="700" font-size="12" fill="${C.muted}">0</text>` +
      `<text x="${PADL + lineW}" y="${yTop - 10}" text-anchor="end" font-family="Outfit,sans-serif" font-weight="800" font-size="13" fill="${C.navy}">${whole}</text>` +
      `<text x="${fx}" y="${yTop - 10}" text-anchor="middle" font-family="Outfit,sans-serif" font-weight="800" font-size="14" fill="${C.teal}">${part}</text>` +
      // bottom line (percent)
      `<line x1="${PADL}" y1="${yBot}" x2="${PADL + lineW}" y2="${yBot}" stroke="${C.line}" stroke-width="3"/>` +
      `<line x1="${PADL}" y1="${yBot}" x2="${fx}" y2="${yBot}" stroke="${C.accent}" stroke-width="4"/>` +
      `<text x="${PADL}" y="${yBot + 18}" font-family="Outfit,sans-serif" font-weight="700" font-size="12" fill="${C.muted}">0%</text>` +
      `<text x="${PADL + lineW}" y="${yBot + 18}" text-anchor="end" font-family="Outfit,sans-serif" font-weight="800" font-size="13" fill="${C.navy}">100%</text>` +
      `<text x="${fx}" y="${yBot + 18}" text-anchor="middle" font-family="Outfit,sans-serif" font-weight="800" font-size="14" fill="${C.accent}">${pct}%</text>` +
      // connector
      `<line x1="${fx}" y1="${yTop}" x2="${fx}" y2="${yBot}" stroke="${C.teal}" stroke-width="2" stroke-dasharray="4 3"/>` +
      `<circle cx="${fx}" cy="${yTop}" r="4.5" fill="${C.teal}"/>` +
      `<circle cx="${fx}" cy="${yBot}" r="4.5" fill="${C.accent}"/>` +
      `</svg>`;

    stage.innerHTML = svg;
    result.innerHTML =
      `<div class="pctlab-eqn">${pct}% of ${whole} = ${pct}/100 × ${whole} = <strong>${part}</strong></div>` +
      `<p class="pctlab-explain">Move ${pct}% of the way along the line: ${pct}% is the same fraction as ${pct}/100, so you take ${pct}/100 of ${whole}.</p>`;
  }

  root.querySelector(".pctlab-go").addEventListener("click", draw);
  root.querySelectorAll(".pctlab-chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      const m = chip.dataset.p.match(/(\d+)%?of(\d+)/);
      if (m) {
        inP.value = m[1];
        inW.value = m[2];
        draw();
      }
    }),
  );
  [inP, inW].forEach((inp) =>
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        draw();
      }
    }),
  );

  draw();
  return { destroy: () => root.remove() };
}

let injected = false;
function injectStyles() {
  if (injected || document.getElementById("pctlab-styles")) {
    injected = true;
    return;
  }
  injected = true;
  const s = document.createElement("style");
  s.id = "pctlab-styles";
  s.textContent = `
  .pctlab{max-width:600px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:16px 16px 18px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .pctlab-title{font-family:"Outfit",system-ui,sans-serif;font-weight:800;color:${C.navy};font-size:1.05rem;}
  .pctlab-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.4;}
  .pctlab-controls{display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px;}
  .pctlab-field{display:flex;flex-direction:column;gap:3px;font-size:.72rem;font-weight:700;color:${C.muted};text-transform:uppercase;}
  .pctlab-field input{width:92px;padding:8px 10px;font-size:1.1rem;font-weight:700;color:${C.ink};border:2px solid ${C.line};border-radius:10px;background:#fbfcfe;}
  .pctlab-field input:focus-visible{outline:3px solid ${C.accent};outline-offset:1px;border-color:${C.accent};}
  .pctlab-of{align-self:center;padding-bottom:9px;font-weight:700;color:${C.muted};font-size:.9rem;}
  .pctlab-go{padding:9px 16px;font-size:.95rem;font-weight:800;color:#fff;background:linear-gradient(135deg,#4f46e5,#0e8a7d);border:0;border-radius:10px;cursor:pointer;}
  .pctlab-go:hover{filter:brightness(1.08);}
  .pctlab-go:focus-visible,.pctlab-chip:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .pctlab-presets{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0;}
  .pctlab-chip{padding:5px 12px;font-size:.88rem;font-weight:700;color:${C.navy};background:#f4f8ff;border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .pctlab-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .pctlab-stage{margin:14px 0 6px;padding:12px;background:#f8fbff;border:1px solid ${C.line};border-radius:14px;}
  .pctlab-result{text-align:center;}
  .pctlab-eqn{font-family:"Outfit",system-ui,sans-serif;font-weight:800;font-size:1.1rem;color:${C.navy};line-height:1.5;}
  .pctlab-explain{margin:6px auto 0;max-width:500px;color:${C.ink};font-size:.9rem;line-height:1.5;}
  `;
  document.head.appendChild(s);
}

export default renderPercentBuilder;
