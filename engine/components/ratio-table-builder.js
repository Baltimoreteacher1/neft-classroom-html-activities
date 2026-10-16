// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
//
// Pure DOM, no dependencies. Public API:
//   renderRatioTableBuilder(container, cfg) -> { destroy }
//     cfg.a, cfg.b       : starting ratio (default 2, 3)
//     cfg.labelA, labelB : column labels (default "A", "B")
//     cfg.steps          : how many multiples to show (default 6)
//     cfg.presets        : quick-pick "a:b" strings
//     cfg.model          : optional linked model (components/linked-model.js).
//                          Building a ratio here publishes it to the model; a
//                          ratio or scale set in another view redraws this one,
//                          and a column header becomes a button that picks the
//                          scale every view shows. Absent, nothing changes.

import { stackContent } from "../core/i18n.js";
import { MAX_TERM } from "./linked-model.js";

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

/**
 * The same equivalent ratios the table just listed, drawn as a double number
 * line: two parallel scales whose tick k sits at the same x for both rows.
 *
 * A ratio table and a double number line are the two representations Grade 6
 * uses for exactly the same relationship, and a student who meets them in
 * separate lessons reads them as two procedures. Rendering both from one state
 * — same a, same b, same k — is what makes them one relationship: column ×3 of
 * the table IS the third pair of ticks, at the same place on both lines.
 *
 * Built as a string alongside the table so a single `stage.innerHTML` write
 * keeps them literally impossible to get out of sync.
 *
 * `activeK`, when it names one of the pairs, draws that pair's ticks heavier
 * and in the accent colour: the scale a linked model is currently looking at.
 */
export function doubleNumberLineSVG(a, b, steps, labelA, labelB, activeK = null) {
  const W = 560;
  const PAD = 54;
  const usable = W - PAD - 16;
  const x = (k) => PAD + (usable * k) / steps;
  const yA = 42;
  const yB = 92;
  const esc2 = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  let ticks = "";
  for (let k = 0; k <= steps; k += 1) {
    const px = x(k);
    const on = k === activeK;
    const tick = on ? C.accent : C.navy;
    const weight = on ? 4 : 2;
    ticks +=
      `<line x1="${px}" y1="${yA - 7}" x2="${px}" y2="${yA + 7}" stroke="${tick}" stroke-width="${weight}"/>` +
      `<line x1="${px}" y1="${yB - 7}" x2="${px}" y2="${yB + 7}" stroke="${tick}" stroke-width="${weight}"/>` +
      // The vertical tie is the whole point: these two values are one pair.
      `<line x1="${px}" y1="${yA + 7}" x2="${px}" y2="${yB - 7}" stroke="${C.line}" stroke-width="1.5" stroke-dasharray="3 3"/>` +
      `<text x="${px}" y="${yA - 13}" text-anchor="middle" font-size="13" font-weight="700" fill="${tick}">${fmt(a * k)}</text>` +
      `<text x="${px}" y="${yB + 24}" text-anchor="middle" font-size="13" font-weight="700" fill="${tick}">${fmt(b * k)}</text>`;
  }

  const pairs = Array.from({ length: steps + 1 }, (_, k) => `${fmt(a * k)} to ${fmt(b * k)}`).join(
    ", ",
  );
  return (
    `<svg class="rtlab-dnl" viewBox="0 0 ${W} 120" role="img" ` +
    `aria-label="Double number line for ${esc2(labelA)} and ${esc2(labelB)}. Paired values: ${esc2(pairs)}.">` +
    `<text x="4" y="${yA + 5}" font-size="12" font-weight="800" fill="${C.muted}">${esc2(labelA)}</text>` +
    `<text x="4" y="${yB + 5}" font-size="12" font-weight="800" fill="${C.muted}">${esc2(labelB)}</text>` +
    `<line x1="${PAD}" y1="${yA}" x2="${W - 10}" y2="${yA}" stroke="${C.accent}" stroke-width="2.5"/>` +
    `<line x1="${PAD}" y1="${yB}" x2="${W - 10}" y2="${yB}" stroke="${C.teal}" stroke-width="2.5"/>` +
    ticks +
    `</svg>`
  );
}

export function renderRatioTableBuilder(container, cfg = {}) {
  const labelA = cfg.labelA || "A";
  const labelB = cfg.labelB || "B";
  const STEPS = Math.max(3, Math.min(8, cfg.steps || 6));
  // With a linked model the table can show any ratio the other views can hold.
  const model = cfg.model || null;
  const maxTerm = model ? MAX_TERM : 99;
  const token = Symbol("ratio-table");
  let a = clamp(cfg.a ?? 2);
  let b = clamp(cfg.b ?? 3);

  function clamp(v) {
    v = Math.floor(Number(v) || 0);
    return Math.max(1, Math.min(maxTerm, v));
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
    `<label class="rtlab-field"><span>${esc(labelA)}</span><input type="number" min="1" max="${maxTerm}" value="${model ? "" : a}" data-inp="a" aria-label="${esc(labelA)} part of the ratio"/></label>` +
    `<span class="rtlab-colon">:</span>` +
    `<label class="rtlab-field"><span>${esc(labelB)}</span><input type="number" min="1" max="${maxTerm}" value="${model ? "" : b}" data-inp="b" aria-label="${esc(labelB)} part of the ratio"/></label>` +
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

  /** Read the two boxes, tell the model, and draw. */
  function build() {
    // A linked table is the student's own: it never invents a missing number.
    if (model && (inA.value === "" || inB.value === "")) return waiting();
    a = clamp(inA.value);
    b = clamp(inB.value);
    inA.value = a;
    inB.value = b;
    // Writing the ratio first lets the model's scale (set by another view) be
    // read back in draw(), so a rebuild keeps the column the student was on.
    if (model) model.set({ a, b }, token);
    draw();
  }

  function waiting() {
    stage.innerHTML = `<p class="rtlab-wait">${stackContent(
      "Type both numbers of a ratio, then press Build table. Every picture will show it.",
      "Escribe los dos números de una razón y presiona Construir tabla. Todas las imágenes la mostrarán.",
    )}</p>`;
    result.innerHTML = "";
  }

  /** Draw the table, line and readout for the current (a, b) and scale. */
  function draw() {
    const activeK = model ? model.get().k : null;

    let head = `<tr><th class="rtlab-corner">×</th>`;
    let rowA = `<tr><th class="rtlab-rowlab" style="background:${C.headA}">${esc(labelA)}</th>`;
    let rowB = `<tr><th class="rtlab-rowlab" style="background:${C.headB}">${esc(labelB)}</th>`;
    for (let k = 1; k <= STEPS; k++) {
      const cls = [k === 1 ? "rtlab-base" : "", k === activeK ? "rtlab-active" : ""]
        .filter(Boolean)
        .join(" ");
      head += model
        ? `<th><button type="button" class="rtlab-col" data-k="${k}" aria-pressed="${k === activeK}" aria-label="Show scale ×${k} in every view">×${k}</button></th>`
        : `<th>×${k}</th>`;
      rowA += `<td class="${cls}">${a * k}</td>`;
      rowB += `<td class="${cls}">${b * k}</td>`;
    }
    head += `</tr>`;
    rowA += `</tr>`;
    rowB += `</tr>`;
    stage.innerHTML =
      `<table class="rtlab-table"><thead>${head}</thead><tbody>${rowA}${rowB}</tbody></table>` +
      doubleNumberLineSVG(a, b, STEPS, labelA, labelB, activeK);

    const unit = fmt(b / a);
    result.innerHTML =
      `<div class="rtlab-answer">${a} : ${b}  →  1 : ${unit}</div>` +
      `<p class="rtlab-explain">Every column is the same ratio as ${a} : ${b}. The <strong>unit rate</strong> is ${unit} ${esc(labelB)} for each 1 ${esc(labelA)} (divide both by ${a}).</p>`;
  }

  root.querySelector(".rtlab-go").addEventListener("click", () => build());
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
  // A column header picks the scale for every view that shares the model.
  stage.addEventListener("click", (e) => {
    const col = model && e.target.closest?.(".rtlab-col");
    if (!col) return;
    const k = Number(col.dataset.k);
    // This view ignores its own broadcast, so it redraws itself, then puts
    // keyboard focus back on the header it just replaced.
    if (!model.set({ k }, token)) return;
    draw();
    stage.querySelector(`.rtlab-col[data-k="${k}"]`)?.focus();
  });

  let unsubscribe = null;
  const state = model?.get();
  if (state && state.a != null) {
    a = state.a;
    b = state.b;
    inA.value = a;
    inB.value = b;
    draw();
  } else if (model) {
    // A linked table waits for the student's own ratio instead of showing 2 : 3.
    waiting();
  } else {
    build();
  }
  if (model) {
    unsubscribe = model.subscribe((next, meta) => {
      if (meta.source === token) return;
      if (next.a == null) return;
      const ratioChanged = meta.changed.includes("a") || meta.changed.includes("b");
      if (ratioChanged) {
        a = clamp(next.a);
        b = clamp(next.b);
        inA.value = a;
        inB.value = b;
      }
      // Only the ratio or the scale changes what this view draws.
      if (ratioChanged || meta.changed.includes("k")) draw();
    });
  }

  return {
    destroy: () => {
      unsubscribe?.();
      root.remove();
    },
  };
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
  .rtlab-title{font-family:"Outfit",system-ui,sans-serif;font-weight:700;color:${C.navy};font-size:1.05rem;}
  .rtlab-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.4;}
  .rtlab-controls{display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px;}
  .rtlab-field{display:flex;flex-direction:column;gap:3px;font-size:.72rem;font-weight:600;color:${C.muted};text-transform:uppercase;}
  .rtlab-field input{width:76px;padding:8px 10px;font-size:1.1rem;font-weight:600;color:${C.ink};border:2px solid ${C.line};border-radius:10px;background:#fbfcfe;}
  .rtlab-field input:focus-visible{outline:3px solid ${C.accent};outline-offset:1px;border-color:${C.accent};}
  .rtlab-colon{align-self:center;padding-bottom:9px;font-weight:700;color:${C.navy};font-size:1.2rem;}
  .rtlab-go{padding:9px 16px;font-size:.95rem;font-weight:700;color:#fff;background:linear-gradient(135deg,#4f46e5,#0e8a7d);border:0;border-radius:10px;cursor:pointer;}
  .rtlab-go:hover{filter:brightness(1.08);}
  .rtlab-go:focus-visible,.rtlab-chip:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .rtlab-presets{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0;}
  .rtlab-chip{padding:5px 12px;font-size:.9rem;font-weight:600;color:${C.navy};background:#f4f8ff;border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .rtlab-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .rtlab-stage{margin:14px 0 8px;padding:8px;background:#f8fbff;border:1px solid ${C.line};border-radius:14px;overflow-x:auto;}
  /* The double number line sits directly under the table it mirrors, so the
     eye can travel from column ×3 to the third pair of ticks. */
  .rtlab-dnl{display:block;width:100%;height:auto;margin-top:10px;}
  .rtlab-table{width:100%;border-collapse:collapse;font-size:.95rem;text-align:center;min-width:340px;}
  .rtlab-table th{padding:6px 8px;font-size:.8rem;color:${C.muted};font-weight:600;}
  .rtlab-corner{color:${C.navy};}
  .rtlab-rowlab{color:${C.navy};font-weight:700;}
  .rtlab-table td{padding:7px 8px;border:1px solid ${C.line};font-weight:600;color:${C.navy};}
  .rtlab-base{background:#eef4ff;color:${C.accent};}
  .rtlab-table td.rtlab-active{background:#dbe7ff;color:${C.accent};border-color:${C.accent};border-width:2px;}
  .rtlab-col{min-width:44px;min-height:44px;font:inherit;font-weight:700;font-size:.85rem;color:${C.navy};background:#fff;border:1.5px solid ${C.line};border-radius:8px;cursor:pointer;}
  .rtlab-col[aria-pressed="true"]{background:${C.accent};border-color:${C.accent};color:#fff;}
  .rtlab-col:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .rtlab-wait{margin:6px 4px;color:${C.muted};font-size:.95rem;line-height:1.5;text-align:center;}
  .rtlab-result{text-align:center;}
  .rtlab-answer{font-family:"Outfit",system-ui,sans-serif;font-weight:800;font-size:1.2rem;color:${C.teal};}
  .rtlab-explain{margin:6px auto 0;max-width:520px;color:${C.ink};font-size:.9rem;line-height:1.5;}
  `;
  document.head.appendChild(s);
}

export default renderRatioTableBuilder;
