// distributive-builder.js — Interactive distributive-property lab. A student
// types a, b, c and the widget draws an area (box) model of a(b + c): one
// rectangle of height a split into an a×b part and an a×c part, then shows
// a(b + c) = a·b + a·c with the numbers filled in. Reinforces WHY the property
// works (same total area, two ways to count it).
//
// Pure SVG + DOM, no dependencies. Public API:
//   renderDistributiveBuilder(container, cfg) -> { destroy }
//     cfg.a, cfg.b, cfg.c : starting values (default 3, 4, 2)
//     cfg.presets         : quick-pick "a(b+c)" strings

const C = {
  navy: "#12355b",
  accent: "#1d4ed8",
  ink: "#1a2b3c",
  muted: "#54677c",
  line: "#d7e2ed",
  boxB: "#e2f9f5",
  boxBstroke: "#0d7a76",
  boxC: "#fbf4e6",
  boxCstroke: "#d4952a",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

function clamp(v, lo, hi) {
  v = Math.floor(Number(v) || 0);
  return Math.max(lo, Math.min(hi, v));
}

export function renderDistributiveBuilder(container, cfg = {}) {
  let a = clamp(cfg.a ?? 3, 1, 12);
  let b = clamp(cfg.b ?? 4, 1, 20);
  let c = clamp(cfg.c ?? 2, 1, 20);

  const presets =
    Array.isArray(cfg.presets) && cfg.presets.length
      ? cfg.presets
      : ["3(4+2)", "5(2+7)", "2(10+3)", "4(6+1)"];

  injectStyles();

  const root = document.createElement("div");
  root.className = "distlab";
  root.innerHTML =
    `<div class="distlab-title">Distributive Property Lab</div>` +
    `<p class="distlab-hint">The area of the whole rectangle can be counted two ways. Type a, b, and c to see why <strong>a(b + c) = a·b + a·c</strong>.</p>` +
    `<div class="distlab-controls">` +
    `<label class="distlab-field"><span>a</span><input type="number" min="1" max="12" value="${a}" data-inp="a" aria-label="a (1 to 12)"/></label>` +
    `<span class="distlab-x">(</span>` +
    `<label class="distlab-field"><span>b</span><input type="number" min="1" max="20" value="${b}" data-inp="b" aria-label="b (1 to 20)"/></label>` +
    `<span class="distlab-x">+</span>` +
    `<label class="distlab-field"><span>c</span><input type="number" min="1" max="20" value="${c}" data-inp="c" aria-label="c (1 to 20)"/></label>` +
    `<span class="distlab-x">)</span>` +
    `<button type="button" class="distlab-go">Show →</button></div>` +
    `<div class="distlab-presets" role="group" aria-label="Quick-pick expressions">` +
    presets
      .map(
        (p) => `<button type="button" class="distlab-chip" data-p="${esc(p)}">${esc(p)}</button>`,
      )
      .join("") +
    `</div>` +
    `<div class="distlab-stage"></div>` +
    `<div class="distlab-result" aria-live="polite"></div>`;

  container.appendChild(root);

  const inA = root.querySelector('[data-inp="a"]');
  const inB = root.querySelector('[data-inp="b"]');
  const inC = root.querySelector('[data-inp="c"]');
  const stage = root.querySelector(".distlab-stage");
  const result = root.querySelector(".distlab-result");

  function draw() {
    a = clamp(inA.value, 1, 12);
    b = clamp(inB.value, 1, 20);
    c = clamp(inC.value, 1, 20);
    inA.value = a;
    inB.value = b;
    inC.value = c;

    const W = 360;
    const H = 150;
    const PADL = 34;
    const PADT = 26;
    const plotW = W - PADL - 14;
    const plotH = H - PADT - 20;
    const total = b + c;
    const bw = (b / total) * plotW;
    const cw = (c / total) * plotW;

    const svg =
      `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;height:auto;display:block;margin:0 auto;" role="img" aria-label="Area model of ${a} times open paren ${b} plus ${c} close paren">` +
      // height label a
      `<text x="${PADL - 10}" y="${PADT + plotH / 2}" text-anchor="middle" transform="rotate(-90 ${PADL - 10} ${PADT + plotH / 2})" font-family="Outfit,sans-serif" font-weight="800" font-size="14" fill="${C.navy}">${a}</text>` +
      // b box
      `<rect x="${PADL}" y="${PADT}" width="${bw}" height="${plotH}" fill="${C.boxB}" stroke="${C.boxBstroke}" stroke-width="2"/>` +
      `<text x="${PADL + bw / 2}" y="${PADT + plotH / 2 + 5}" text-anchor="middle" font-family="Outfit,sans-serif" font-weight="800" font-size="15" fill="${C.boxBstroke}">${a * b}</text>` +
      `<text x="${PADL + bw / 2}" y="${PADT - 8}" text-anchor="middle" font-family="Outfit,sans-serif" font-weight="800" font-size="13" fill="${C.navy}">${b}</text>` +
      // c box
      `<rect x="${PADL + bw}" y="${PADT}" width="${cw}" height="${plotH}" fill="${C.boxC}" stroke="${C.boxCstroke}" stroke-width="2"/>` +
      `<text x="${PADL + bw + cw / 2}" y="${PADT + plotH / 2 + 5}" text-anchor="middle" font-family="Outfit,sans-serif" font-weight="800" font-size="15" fill="${C.boxCstroke}">${a * c}</text>` +
      `<text x="${PADL + bw + cw / 2}" y="${PADT - 8}" text-anchor="middle" font-family="Outfit,sans-serif" font-weight="800" font-size="13" fill="${C.navy}">${c}</text>` +
      `</svg>`;

    stage.innerHTML = svg;
    result.innerHTML =
      `<div class="distlab-eqn">${a}(${b} + ${c}) = ${a}·${b} + ${a}·${c}</div>` +
      `<div class="distlab-eqn distlab-eqn-final">= ${a * b} + ${a * c} = <strong>${a * (b + c)}</strong></div>` +
      `<p class="distlab-explain">Both the whole rectangle (${a} × ${b + c} = ${a * (b + c)}) and the two parts (${a * b} + ${a * c}) count the same area.</p>`;
  }

  root.querySelector(".distlab-go").addEventListener("click", draw);
  root.querySelectorAll(".distlab-chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      const m = chip.dataset.p.match(/(\d+)\((\d+)\+(\d+)\)/);
      if (m) {
        inA.value = m[1];
        inB.value = m[2];
        inC.value = m[3];
        draw();
      }
    }),
  );
  [inA, inB, inC].forEach((inp) =>
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
  if (injected || document.getElementById("distlab-styles")) {
    injected = true;
    return;
  }
  injected = true;
  const s = document.createElement("style");
  s.id = "distlab-styles";
  s.textContent = `
  .distlab{max-width:600px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:16px 16px 18px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .distlab-title{font-family:"Outfit",system-ui,sans-serif;font-weight:800;color:${C.navy};font-size:1.05rem;}
  .distlab-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.4;}
  .distlab-controls{display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px;}
  .distlab-field{display:flex;flex-direction:column;gap:3px;font-size:.72rem;font-weight:700;color:${C.muted};text-transform:uppercase;}
  .distlab-field input{width:66px;padding:8px 10px;font-size:1.1rem;font-weight:700;color:${C.ink};border:2px solid ${C.line};border-radius:10px;background:#fbfcfe;}
  .distlab-field input:focus-visible{outline:3px solid ${C.accent};outline-offset:1px;border-color:${C.accent};}
  .distlab-x{align-self:center;padding-bottom:9px;font-weight:800;color:${C.navy};font-size:1.1rem;}
  .distlab-go{padding:9px 16px;font-size:.95rem;font-weight:800;color:#fff;background:linear-gradient(135deg,#4f46e5,#0e8a7d);border:0;border-radius:10px;cursor:pointer;}
  .distlab-go:hover{filter:brightness(1.08);}
  .distlab-go:focus-visible,.distlab-chip:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .distlab-presets{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0;}
  .distlab-chip{padding:5px 12px;font-size:.9rem;font-weight:700;color:${C.navy};background:#f4f8ff;border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .distlab-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .distlab-stage{margin:14px 0 6px;padding:12px;background:#f8fbff;border:1px solid ${C.line};border-radius:14px;}
  .distlab-result{text-align:center;}
  .distlab-eqn{font-family:"Outfit",system-ui,sans-serif;font-weight:800;font-size:1.1rem;color:${C.navy};line-height:1.5;}
  .distlab-eqn-final{color:${C.boxBstroke};}
  .distlab-explain{margin:6px auto 0;max-width:500px;color:${C.ink};font-size:.9rem;line-height:1.5;}
  `;
  document.head.appendChild(s);
}

export default renderDistributiveBuilder;
