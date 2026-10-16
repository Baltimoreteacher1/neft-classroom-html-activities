// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
//
// Pure SVG + DOM, no dependencies. Public API:
//   renderPercentBuilder(container, cfg) -> { destroy }
//     cfg.percent, cfg.whole : starting values (default 25, 80)
//     cfg.presets            : quick-pick "p%ofw" strings, e.g. "25%of80"
//     cfg.apply              : opt-in second step. Percent-of-a-number is only
//                              HALF of a discount/tax/tip/markup problem — the
//                              student still has to subtract or add the part to
//                              the original price, which is exactly the step
//                              they lose. With apply:true the lab adds a "then
//                              what?" dropdown (part only / take it off / add it
//                              on) and shows the finishing line. Off by default
//                              so the plain percent-of-a-number lessons (4-4)
//                              are untouched.

import { labT } from "./lab-strings-es.js";

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

function chipLabel(p) {
  const m = String(p).match(/(\d+)%?of(\d+)(?::(part|off|on))?/);
  if (!m) return String(p).replace("of", "% of ").replace("%%", "%");
  const v = { p: m[1], w: m[2] };
  if (m[3] === "off") return labT("percent-builder.chip-off", "{p}% of {w} off", v);
  if (m[3] === "on") return labT("percent-builder.chip-on", "{p}% of {w} added", v);
  return labT("percent-builder.chip", "{p}% of {w}", v);
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

  const apply = cfg.apply === true;
  // label: what the dropdown calls the starting number and the finished answer,
  // so the tool reads like the word problems instead of like a naked equation.
  const OPS = {
    part: { label: labT("percent-builder.op-part", "just the part"), verb: null },
    off: {
      label: labT("percent-builder.op-off", "take it OFF (discount, sale)"),
      verb: "−",
      word: "you pay",
    },
    on: {
      label: labT("percent-builder.op-on", "add it ON (tax, tip, markup)"),
      verb: "+",
      word: "you pay",
    },
  };
  let op = OPS[cfg.op] ? cfg.op : apply ? "off" : "part";

  injectStyles();

  const root = document.createElement("div");
  root.className = "pctlab";
  root.innerHTML =
    `<div class="pctlab-title">${apply ? labT("percent-builder.title-apply", "Percent Problem Lab") : labT("percent-builder.title", "Percent of a Number Lab")}</div>` +
    `<p class="pctlab-hint">${
      apply
        ? labT(
            "percent-builder.hint-apply",
            `Finding the percent is only step 1. Pick what the problem does with that amount — a discount comes <strong>off</strong> the price, while tax, a tip, and markup go <strong>on</strong> top.`,
          )
        : labT(
            "percent-builder.hint",
            `"Percent" means "out of 100." Type a percent and a whole to find that part of the number.`,
          )
    }</p>` +
    `<div class="pctlab-controls">` +
    `<label class="pctlab-field"><span>${labT("percent-builder.percent", "Percent")}</span><input type="number" min="0" max="100" value="${pct}" data-inp="pct" aria-label="${labT("percent-builder.percent-aria", "Percent (0 to 100)")}"/></label>` +
    `<span class="pctlab-of">${labT("percent-builder.of", "% of")}</span>` +
    `<label class="pctlab-field"><span>${labT("percent-builder.whole", "Whole")}</span><input type="number" min="1" max="10000" value="${whole}" data-inp="whole" aria-label="${labT("percent-builder.whole-aria", "The whole number")}"/></label>` +
    (apply
      ? `<label class="pctlab-field pctlab-field-op"><span>${labT("percent-builder.then", "Then")}</span><select data-inp="op" aria-label="${labT("percent-builder.then-aria", "What the problem does with that amount")}">` +
        Object.entries(OPS)
          .map(
            ([k, v]) =>
              `<option value="${k}"${k === op ? " selected" : ""}>${esc(v.label)}</option>`,
          )
          .join("") +
        `</select></label>`
      : "") +
    `<button type="button" class="pctlab-go">${labT("percent-builder.find", "Find it →")}</button></div>` +
    `<div class="pctlab-presets" role="group" aria-label="${labT("percent-builder.quick-pick", "Quick-pick problems")}">` +
    presets
      .map(
        (p) =>
          `<button type="button" class="pctlab-chip" data-p="${esc(p)}">${esc(chipLabel(p))}</button>`,
      )
      .join("") +
    `</div>` +
    `<div class="pctlab-stage"></div>` +
    `<div class="pctlab-result" aria-live="polite"></div>`;

  container.appendChild(root);

  const inP = root.querySelector('[data-inp="pct"]');
  const inW = root.querySelector('[data-inp="whole"]');
  const inOp = root.querySelector('[data-inp="op"]');
  const stage = root.querySelector(".pctlab-stage");
  const result = root.querySelector(".pctlab-result");

  function draw() {
    if (inOp) op = OPS[inOp.value] ? inOp.value : "part";
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
      `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;height:auto;display:block;margin:0 auto;" role="img" aria-label="${labT("percent-builder.svg-aria", "Double number line: {pct} percent of {whole} is {part}", { pct, whole, part })}">` +
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
    const money = (n) => `$${round2(n).toFixed(2)}`;
    const step2 =
      op === "part" || !OPS[op].verb
        ? ""
        : (() => {
            const total = round2(op === "off" ? whole - part : whole + part);
            return (
              `<div class="pctlab-step2">` +
              `<div class="pctlab-eqn">${labT("percent-builder.step-2", "Step 2 — {whole} {verb} {part} = <strong>{total}</strong>", { whole: money(whole), verb: OPS[op].verb, part: money(part), total: money(total) })}</div>` +
              `<p class="pctlab-explain">${
                op === "off"
                  ? labT(
                      "percent-builder.explain-off",
                      "A discount comes off the original price, so the answer must be <strong>less</strong> than {whole}.",
                      { whole: money(whole) },
                    )
                  : labT(
                      "percent-builder.explain-on",
                      "Tax, a tip, and markup go on top of the original price, so the answer must be <strong>more</strong> than {whole}.",
                      { whole: money(whole) },
                    )
              } ${labT(
                "percent-builder.finished",
                "The finished answer is {total} — not {part}, which is only the amount you found in step 1.",
                { total: money(total), part: money(part) },
              )}</p>` +
              `</div>`
            );
          })();
    result.innerHTML =
      `<div class="pctlab-eqn">${
        op === "part"
          ? labT(
              "percent-builder.eqn",
              "{pct}% of {whole} = {pct}/100 × {whole} = <strong>{part}</strong>",
              { pct, whole, part },
            )
          : labT(
              "percent-builder.eqn-step-1",
              "Step 1 — {pct}% of {whole} = {pct}/100 × {whole} = <strong>{part}</strong>",
              { pct, whole, part },
            )
      }</div>` +
      `<p class="pctlab-explain">${labT("percent-builder.explain", "Move {pct}% of the way along the line: {pct}% is the same fraction as {pct}/100, so you take {pct}/100 of {whole}.", { pct, whole })}</p>` +
      step2;
  }

  root.querySelector(".pctlab-go").addEventListener("click", draw);
  if (inOp) inOp.addEventListener("change", draw);
  root.querySelectorAll(".pctlab-chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      // "20%of60" or, when apply is on, "20%of60:off" — the trailing op lets a
      // preset stand for a whole word problem (sale price, total with tax)
      // rather than only its first step.
      const m = chip.dataset.p.match(/(\d+)%?of(\d+)(?::(part|off|on))?/);
      if (m) {
        inP.value = m[1];
        inW.value = m[2];
        if (inOp && m[3]) inOp.value = m[3];
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
  .pctlab-title{font-family:"Outfit",system-ui,sans-serif;font-weight:700;color:${C.navy};font-size:1.05rem;}
  .pctlab-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.4;}
  .pctlab-controls{display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px;}
  .pctlab-field{display:flex;flex-direction:column;gap:3px;font-size:.72rem;font-weight:600;color:${C.muted};text-transform:uppercase;}
  .pctlab-field input{width:92px;padding:8px 10px;font-size:1.1rem;font-weight:600;color:${C.ink};border:2px solid ${C.line};border-radius:10px;background:#fbfcfe;}
  .pctlab-field input:focus-visible{outline:3px solid ${C.accent};outline-offset:1px;border-color:${C.accent};}
  .pctlab-of{align-self:center;padding-bottom:9px;font-weight:600;color:${C.muted};font-size:.9rem;}
  .pctlab-go{padding:9px 16px;font-size:.95rem;font-weight:700;color:#fff;background:linear-gradient(135deg,#4f46e5,#0e8a7d);border:0;border-radius:10px;cursor:pointer;}
  .pctlab-go:hover{filter:brightness(1.08);}
  .pctlab-go:focus-visible,.pctlab-chip:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .pctlab-presets{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0;}
  .pctlab-chip{padding:5px 12px;font-size:.88rem;font-weight:600;color:${C.navy};background:#f4f8ff;border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .pctlab-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .pctlab-stage{margin:14px 0 6px;padding:12px;background:#f8fbff;border:1px solid ${C.line};border-radius:14px;}
  .pctlab-result{text-align:center;}
  .pctlab-eqn{font-family:"Outfit",system-ui,sans-serif;font-weight:700;font-size:1.1rem;color:${C.navy};line-height:1.5;}
  .pctlab-explain{margin:6px auto 0;max-width:500px;color:${C.ink};font-size:.9rem;line-height:1.5;}
  .pctlab-field-op select{padding:8px 10px;font-size:.95rem;font-weight:600;color:${C.ink};border:2px solid ${C.line};border-radius:10px;background:#fbfcfe;text-transform:none;max-width:100%;}
  .pctlab-field-op select:focus-visible{outline:3px solid ${C.accent};outline-offset:1px;border-color:${C.accent};}
  .pctlab-step2{margin-top:12px;padding-top:10px;border-top:2px dashed ${C.line};}
  `;
  document.head.appendChild(s);
}

export default renderPercentBuilder;
