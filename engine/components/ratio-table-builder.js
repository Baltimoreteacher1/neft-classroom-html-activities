// ratio-table-builder.js — Interactive ratio-table lab. A student types a base
// ratio a : b and the widget builds a scalable ratio table (×1 … ×6) of
// equivalent ratios, highlights the unit rate (per 1 of the first quantity), and
// lets the student change the ratio to regenerate. Reinforces that scaling both
// quantities by the same factor keeps the ratio equivalent.
//
// Pure DOM, no dependencies. Public API:
//   renderRatioTableBuilder(container, cfg) -> { destroy }
//     cfg.a, cfg.b       : starting ratio (default 2, 3)
//     cfg.labelA, labelB : column labels (default "A", "B")
//     cfg.steps          : how many multiples to show (default 6)
//     cfg.presets        : quick-pick "a:b" strings

const C = {
  navy: "#12355b",
  accent: "#1d4ed8",
  teal: "#0d7a76",
  ink: "#1a2b3c",
  muted: "#54677c",
  line: "#d7e2ed",
  headA: "#eef4ff",
  headB: "#f2fcfa",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

function fmt(n) {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function renderRatioTableBuilder(container, cfg = {}) {
  const labelA = cfg.labelA || "A";
  const labelB = cfg.labelB || "B";
  const STEPS = Math.max(3, Math.min(8, cfg.steps || 6));
  let a = clamp(cfg.a ?? 2);
  let b = clamp(cfg.b ?? 3);

  function clamp(v) {
    v = Math.floor(Number(v) || 0);
    return Math.max(1, Math.min(99, v));
  }

  const presets =
    Array.isArray(cfg.presets) && cfg.presets.length ? cfg.presets : ["2:3", "3:4", "5:2", "1:4"];

  injectStyles();

  const root = document.createElement("div");
  root.className = "rtlab";
  root.innerHTML =
    `<div class="rtlab-title">Ratio Table Lab</div>` +
    `<p class="rtlab-hint">Multiply <strong>both</strong> numbers by the same factor to build equivalent ratios. Type a ratio to fill the table.</p>` +
    `<div class="rtlab-controls">` +
    `<label class="rtlab-field"><span>${esc(labelA)}</span><input type="number" min="1" max="99" value="${a}" data-inp="a" aria-label="${esc(labelA)} part of the ratio"/></label>` +
    `<span class="rtlab-colon">:</span>` +
    `<label class="rtlab-field"><span>${esc(labelB)}</span><input type="number" min="1" max="99" value="${b}" data-inp="b" aria-label="${esc(labelB)} part of the ratio"/></label>` +
    `<button type="button" class="rtlab-go">Build table →</button></div>` +
    `<div class="rtlab-presets" role="group" aria-label="Quick-pick ratios">` +
    presets
      .map((p) => `<button type="button" class="rtlab-chip" data-p="${esc(p)}">${esc(p)}</button>`)
      .join("") +
    `</div>` +
    `<div class="rtlab-stage"></div>` +
    `<div class="rtlab-result" aria-live="polite"></div>`;

  container.appendChild(root);

  const inA = root.querySelector('[data-inp="a"]');
  const inB = root.querySelector('[data-inp="b"]');
  const stage = root.querySelector(".rtlab-stage");
  const result = root.querySelector(".rtlab-result");

  function build() {
    a = clamp(inA.value);
    b = clamp(inB.value);
    inA.value = a;
    inB.value = b;

    let head = `<tr><th class="rtlab-corner">×</th>`;
    let rowA = `<tr><th class="rtlab-rowlab" style="background:${C.headA}">${esc(labelA)}</th>`;
    let rowB = `<tr><th class="rtlab-rowlab" style="background:${C.headB}">${esc(labelB)}</th>`;
    for (let k = 1; k <= STEPS; k++) {
      head += `<th>×${k}</th>`;
      rowA += `<td class="${k === 1 ? "rtlab-base" : ""}">${a * k}</td>`;
      rowB += `<td class="${k === 1 ? "rtlab-base" : ""}">${b * k}</td>`;
    }
    head += `</tr>`;
    rowA += `</tr>`;
    rowB += `</tr>`;
    stage.innerHTML = `<table class="rtlab-table"><thead>${head}</thead><tbody>${rowA}${rowB}</tbody></table>`;

    const unit = fmt(b / a);
    result.innerHTML =
      `<div class="rtlab-answer">${a} : ${b}  →  1 : ${unit}</div>` +
      `<p class="rtlab-explain">Every column is the same ratio as ${a} : ${b}. The <strong>unit rate</strong> is ${unit} ${esc(labelB)} for each 1 ${esc(labelA)} (divide both by ${a}).</p>`;
  }

  root.querySelector(".rtlab-go").addEventListener("click", build);
  root.querySelectorAll(".rtlab-chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      const [x, y] = chip.dataset.p.split(":");
      inA.value = x;
      inB.value = y;
      build();
    }),
  );
  [inA, inB].forEach((inp) =>
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        build();
      }
    }),
  );

  build();
  return { destroy: () => root.remove() };
}

let injected = false;
function injectStyles() {
  if (injected || document.getElementById("rtlab-styles")) {
    injected = true;
    return;
  }
  injected = true;
  const s = document.createElement("style");
  s.id = "rtlab-styles";
  s.textContent = `
  .rtlab{max-width:600px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:16px 16px 18px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .rtlab-title{font-family:"Outfit",system-ui,sans-serif;font-weight:800;color:${C.navy};font-size:1.05rem;}
  .rtlab-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.4;}
  .rtlab-controls{display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px;}
  .rtlab-field{display:flex;flex-direction:column;gap:3px;font-size:.72rem;font-weight:700;color:${C.muted};text-transform:uppercase;}
  .rtlab-field input{width:76px;padding:8px 10px;font-size:1.1rem;font-weight:700;color:${C.ink};border:2px solid ${C.line};border-radius:10px;background:#fbfcfe;}
  .rtlab-field input:focus-visible{outline:3px solid ${C.accent};outline-offset:1px;border-color:${C.accent};}
  .rtlab-colon{align-self:center;padding-bottom:9px;font-weight:800;color:${C.navy};font-size:1.2rem;}
  .rtlab-go{padding:9px 16px;font-size:.95rem;font-weight:800;color:#fff;background:linear-gradient(135deg,#4f46e5,#0e8a7d);border:0;border-radius:10px;cursor:pointer;}
  .rtlab-go:hover{filter:brightness(1.08);}
  .rtlab-go:focus-visible,.rtlab-chip:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .rtlab-presets{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0;}
  .rtlab-chip{padding:5px 12px;font-size:.9rem;font-weight:700;color:${C.navy};background:#f4f8ff;border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .rtlab-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .rtlab-stage{margin:14px 0 8px;padding:8px;background:#f8fbff;border:1px solid ${C.line};border-radius:14px;overflow-x:auto;}
  .rtlab-table{width:100%;border-collapse:collapse;font-size:.95rem;text-align:center;min-width:340px;}
  .rtlab-table th{padding:6px 8px;font-size:.8rem;color:${C.muted};font-weight:700;}
  .rtlab-corner{color:${C.navy};}
  .rtlab-rowlab{color:${C.navy};font-weight:800;}
  .rtlab-table td{padding:7px 8px;border:1px solid ${C.line};font-weight:700;color:${C.navy};}
  .rtlab-base{background:#eef4ff;color:${C.accent};}
  .rtlab-result{text-align:center;}
  .rtlab-answer{font-family:"Outfit",system-ui,sans-serif;font-weight:900;font-size:1.2rem;color:${C.teal};}
  .rtlab-explain{margin:6px auto 0;max-width:520px;color:${C.ink};font-size:.9rem;line-height:1.5;}
  `;
  document.head.appendChild(s);
}

export default renderRatioTableBuilder;
