// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
//
// Pure DOM, no dependencies. Public API:
//   renderLongDivisionBuilder(container, cfg) -> { destroy }
//     cfg.dividend, cfg.divisor : starting values (default 754, 6)
//     cfg.presets               : quick-pick "dividend/divisor" strings

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

// Partial-quotients steps: greedily subtract divisor × (chunk) where chunk is the
// largest multiple of a descending power of ten that fits. Returns {steps, q, r}.
function partialQuotients(dividend, divisor) {
  const steps = [];
  let remaining = dividend;
  let quotient = 0;
  let place = 1;
  while (divisor * place * 10 <= remaining) place *= 10;
  while (place >= 1) {
    const chunk = Math.floor(remaining / (divisor * place)) * place;
    if (chunk > 0) {
      const sub = divisor * chunk;
      steps.push({ remaining, chunk, sub, after: remaining - sub });
      remaining -= sub;
      quotient += chunk;
    }
    place /= 10;
  }
  return { steps, q: quotient, r: remaining };
}

export function renderLongDivisionBuilder(container, cfg = {}) {
  let dividend = clamp(cfg.dividend ?? 754, 1, 999999);
  let divisor = clamp(cfg.divisor ?? 6, 1, 999);

  function clamp(v, lo, hi) {
    v = Math.floor(Number(v) || 0);
    return Math.max(lo, Math.min(hi, v));
  }

  const presets =
    Array.isArray(cfg.presets) && cfg.presets.length
      ? cfg.presets
      : ["754/6", "432/8", "1250/5", "987/3"];

  injectStyles();

  const root = document.createElement("div");
  root.className = "ldlab";
  root.innerHTML =
    `<div class="ldlab-title">Long Division Lab</div>` +
    `<p class="ldlab-hint">Divide with <strong>partial quotients</strong>: keep subtracting easy multiples of the divisor, then add up how many you took out.</p>` +
    `<div class="ldlab-controls">` +
    `<label class="ldlab-field"><span>Dividend</span><input type="number" min="1" value="${dividend}" data-inp="dividend" aria-label="Dividend"/></label>` +
    `<span class="ldlab-div">÷</span>` +
    `<label class="ldlab-field"><span>Divisor</span><input type="number" min="1" value="${divisor}" data-inp="divisor" aria-label="Divisor"/></label>` +
    `<button type="button" class="ldlab-go">Divide →</button></div>` +
    `<div class="ldlab-presets" role="group" aria-label="Quick-pick problems">` +
    presets
      .map(
        (p) =>
          `<button type="button" class="ldlab-chip" data-p="${esc(p)}">${esc(p.replace("/", " ÷ "))}</button>`,
      )
      .join("") +
    `</div>` +
    `<div class="ldlab-stage"></div>` +
    `<div class="ldlab-result" aria-live="polite"></div>`;

  container.appendChild(root);

  const inD = root.querySelector('[data-inp="dividend"]');
  const inV = root.querySelector('[data-inp="divisor"]');
  const stage = root.querySelector(".ldlab-stage");
  const result = root.querySelector(".ldlab-result");

  function compute() {
    dividend = clamp(inD.value, 1, 999999);
    divisor = clamp(inV.value, 1, 999);
    inD.value = dividend;
    inV.value = divisor;
    const { steps, q, r } = partialQuotients(dividend, divisor);

    const rows = steps
      .map(
        (s) =>
          `<tr><td class="ldlab-rem">${s.remaining}</td><td>− ${divisor} × ${s.chunk}</td>` +
          `<td>= ${s.sub}</td><td class="ldlab-arrow">→</td><td class="ldlab-rem">${s.after}</td>` +
          `<td class="ldlab-chunk">+${s.chunk}</td></tr>`,
      )
      .join("");
    stage.innerHTML =
      `<table class="ldlab-table"><thead><tr><th>have</th><th>take out</th><th></th><th></th><th>left</th><th>quotient</th></tr></thead>` +
      `<tbody>${rows}</tbody></table>`;

    result.innerHTML =
      `<div class="ldlab-answer">${dividend} ÷ ${divisor} = ${q}${r ? ` R ${r}` : ""}</div>` +
      `<p class="ldlab-explain">Add the partial quotients: <strong>${q}</strong>${r ? `, with <strong>${r}</strong> left over` : " with nothing left over"}. ` +
      `Check: ${divisor} × ${q}${r ? ` + ${r}` : ""} = <strong>${divisor * q + r}</strong> = ${dividend}. ✓</p>`;
  }

  root.querySelector(".ldlab-go").addEventListener("click", compute);
  root.querySelectorAll(".ldlab-chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      const [x, y] = chip.dataset.p.split("/");
      inD.value = x;
      inV.value = y;
      compute();
    }),
  );
  [inD, inV].forEach((inp) =>
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
  if (injected || document.getElementById("ldlab-styles")) {
    injected = true;
    return;
  }
  injected = true;
  const s = document.createElement("style");
  s.id = "ldlab-styles";
  s.textContent = `
  .ldlab{max-width:600px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:16px 16px 18px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .ldlab-title{font-family:"Outfit",system-ui,sans-serif;font-weight:800;color:${C.navy};font-size:1.05rem;}
  .ldlab-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.4;}
  .ldlab-controls{display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px;}
  .ldlab-field{display:flex;flex-direction:column;gap:3px;font-size:.72rem;font-weight:700;color:${C.muted};text-transform:uppercase;}
  .ldlab-field input{width:104px;padding:8px 10px;font-size:1.1rem;font-weight:700;color:${C.ink};border:2px solid ${C.line};border-radius:10px;background:#fbfcfe;}
  .ldlab-field input:focus-visible{outline:3px solid ${C.accent};outline-offset:1px;border-color:${C.accent};}
  .ldlab-div{align-self:center;padding-bottom:9px;font-weight:800;color:${C.navy};font-size:1.2rem;}
  .ldlab-go{padding:9px 16px;font-size:.95rem;font-weight:800;color:#fff;background:linear-gradient(135deg,#4f46e5,#0e8a7d);border:0;border-radius:10px;cursor:pointer;}
  .ldlab-go:hover{filter:brightness(1.08);}
  .ldlab-go:focus-visible,.ldlab-chip:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .ldlab-presets{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0;}
  .ldlab-chip{padding:5px 12px;font-size:.88rem;font-weight:700;color:${C.navy};background:#f4f8ff;border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .ldlab-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .ldlab-stage{margin:14px 0 8px;padding:8px;background:#f8fbff;border:1px solid ${C.line};border-radius:14px;overflow-x:auto;}
  .ldlab-table{width:100%;border-collapse:collapse;font-size:.92rem;}
  .ldlab-table th{font-size:.68rem;text-transform:uppercase;letter-spacing:.03em;color:${C.muted};padding:4px 8px;text-align:left;}
  .ldlab-table td{padding:5px 8px;border-top:1px solid ${C.line};white-space:nowrap;}
  .ldlab-rem{font-weight:800;color:${C.navy};}
  .ldlab-arrow{color:${C.muted};}
  .ldlab-chunk{font-weight:800;color:${C.teal};text-align:right;}
  .ldlab-result{text-align:center;}
  .ldlab-answer{font-family:"Outfit",system-ui,sans-serif;font-weight:900;font-size:1.25rem;color:${C.teal};}
  .ldlab-explain{margin:6px auto 0;max-width:520px;color:${C.ink};font-size:.9rem;line-height:1.5;}
  `;
  document.head.appendChild(s);
}

export default renderLongDivisionBuilder;
