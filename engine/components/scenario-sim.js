//
// Design principle — EXPLORE-BEFORE-WRITE:
//   The output is computed deterministically from the single input, so the student
//   builds intuition by dragging: "when I double the hours, the pay doubles too."
//   Everything is native and keyboard-operable (a real <input type=range>), and a
//   polite aria-live region announces the current result on every move.
//
// Public API:  renderScenarioSim(host, cfg) -> { destroy } | null
//   cfg.type ∈ "proportional" | "percent" | "linear"  (see per-type builders).
//   cfg.title (optional heading) · cfg.caption (optional footnote).
// Also:        scenarioAria(cfg) -> one-line plain-language description string.

// Data-encoding colours: fixed, not theme tokens. Inside .sg-lab the generic
// palette is remapped onto the group accent (--teal becomes var(--sg)), which
// turns every data mark the same navy. Colour that carries meaning belongs to
// the figure. See engine/light-only-surfaces.test.mjs.
const DATA_1 = "#0f8a84"; // teal - primary
const DATA_2 = "#c2603f"; // clay - secondary

const STYLE_ID = "scenario-sim-styles";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
  .ssim{color-scheme:light;--ss-teal:${DATA_1};--ss-coral:${DATA_2};--ss-navy:var(--navy,#264653);--ss-ink:var(--ink,#333);--ss-muted:var(--muted,#6b7280);
    border:1px solid rgba(38,70,83,.14);border-radius:14px;padding:14px 14px 12px;margin:var(--sp-3,12px) 0;background:linear-gradient(180deg,#fff,#fbfdfc);box-shadow:0 1px 3px rgba(38,70,83,.06)}
  .ssim-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}
  .ssim-title{font-weight:800;color:var(--ss-navy);font-size:1rem}
  .ssim-badge{font-size:.68rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--ss-teal);border:1px solid currentColor;border-radius:999px;padding:2px 8px}
  .ssim-read{font-size:1.35rem;font-weight:800;color:var(--ss-navy);text-align:center;line-height:1.25;margin:4px 0 2px;overflow-wrap:anywhere}
  .ssim-read b{color:var(--ss-coral)}
  .ssim-rel{text-align:center;font-size:.9rem;color:var(--ss-muted);font-weight:700;margin-bottom:10px;overflow-wrap:anywhere}
  .ssim-model{margin:8px 0}
  .ssim-model svg{width:100%;height:auto;max-width:520px;display:block;margin:0 auto;touch-action:manipulation}
  .ssim-ctl{display:flex;flex-direction:column;gap:6px;margin:12px 0 2px}
  .ssim-ctl-row{display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap}
  .ssim-ctl label{font-weight:700;color:var(--ss-navy);font-size:.9rem}
  .ssim-ctl output{font-weight:800;color:var(--ss-teal);font-size:1.05rem;font-variant-numeric:tabular-nums}
  .ssim-range{width:100%;accent-color:var(--ss-teal);height:30px;cursor:pointer;touch-action:pan-y}
  .ssim-range:focus-visible{outline:3px solid rgba(42,157,143,.5);outline-offset:3px;border-radius:6px}
  .ssim-ends{display:flex;justify-content:space-between;font-size:.72rem;color:var(--ss-muted);font-weight:700}
  .ssim-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:2px;max-width:260px;margin:0 auto}
  .ssim-cell{aspect-ratio:1;border-radius:2px;background:rgba(38,70,83,.1);transition:background .08s}
  .ssim-cell.on{background:var(--ss-teal)}
  .ssim-cap{margin-top:10px;font-size:.8rem;color:var(--ss-muted);text-align:center;font-style:italic}
  .ssim-cap:empty{display:none}
  .ssim-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
`;
  document.head.appendChild(s);
}

function esc(v) {
  const d = document.createElement("div");
  d.textContent = v ?? "";
  return d.innerHTML;
}
// Integer when the value is whole, else 2 dp with trailing zeros trimmed.
function fmt(n) {
  if (!isFinite(n)) return "0";
  return Number.isInteger(n)
    ? String(n)
    : (Math.round(n * 100) / 100).toFixed(2).replace(/\.?0+$/, "");
}
const isNum = (v) => typeof v === "number" && isFinite(v);
const toNum = (v) => (v === "" || v == null ? NaN : Number(v));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Shared shell: header, live readout + relationship line, model slot, the native
// range slider, caption, and a hidden aria-live region. `ctrl` supplies the math.
function shell(host, cfg, ctrl) {
  injectStyles();
  const root = document.createElement("div");
  root.className = "ssim";
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", scenarioAria(cfg));
  const uid = "ss" + Math.random().toString(36).slice(2, 8);
  root.innerHTML =
    `<div class="ssim-head"><span class="ssim-title">${esc(cfg.title || ctrl.defaultTitle)}</span>` +
    `<span class="ssim-badge">Scenario</span></div>` +
    `<div class="ssim-read" data-el="read"></div>` +
    `<div class="ssim-rel" data-el="rel"></div>` +
    `<div class="ssim-model" data-el="model"></div>` +
    `<div class="ssim-ctl">` +
    `<div class="ssim-ctl-row"><label for="${uid}">${esc(ctrl.sliderLabel)}</label>` +
    `<output for="${uid}" data-el="out"></output></div>` +
    `<input class="ssim-range" id="${uid}" type="range" data-el="range" ` +
    `min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${ctrl.start}" ` +
    `aria-label="${esc(ctrl.sliderLabel)}"/>` +
    `<div class="ssim-ends"><span>${esc(ctrl.minLabel)}</span><span>${esc(ctrl.maxLabel)}</span></div>` +
    `</div>` +
    `<div class="ssim-cap" data-el="cap">${esc(cfg.caption || "")}</div>` +
    `<div class="ssim-sr" data-el="live" role="status" aria-live="polite"></div>`;
  host.appendChild(root);
  const el = (n) => root.querySelector(`[data-el="${n}"]`);
  const range = el("range");

  function paint() {
    const x = Number(/** @type {HTMLInputElement} */ (range).value);
    const view = ctrl.compute(x);
    el("out").textContent = view.slider;
    el("read").innerHTML = view.readout;
    el("rel").innerHTML = view.relation || "";
    el("model").innerHTML = view.model || "";
    el("live").textContent = view.announce;
  }
  range.addEventListener("input", paint);
  range.addEventListener("change", paint);
  paint();

  return {
    destroy() {
      root.remove();
    },
  };
}

// ── PROPORTIONAL:  y = rate * x ───────────────────────────────────────────────
function proportional(host, cfg) {
  const rate = toNum(cfg.rate);
  const xMax = toNum(cfg.xMax);
  if (!isNum(rate) || !isNum(xMax)) return null;
  const xMin = isNum(toNum(cfg.xMin)) ? toNum(cfg.xMin) : 0;
  const xStep = isNum(toNum(cfg.xStep)) ? toNum(cfg.xStep) : 1;
  const xStart = isNum(toNum(cfg.xStart)) ? clamp(toNum(cfg.xStart), xMin, xMax) : xMin;
  const xName = cfg.xName || "x";
  const yName = cfg.yName || "y";
  const xUnit = cfg.xUnit || "";
  const yUnit = cfg.yUnit || "";
  const yMax = Math.max(Math.abs(rate * xMax), Math.abs(rate * xMin), 1);
  const W = 500,
    H = 46,
    padL = 4,
    padR = 4,
    barMax = W - padL - padR;
  return shell(host, cfg, {
    defaultTitle: "Proportional relationship",
    sliderLabel: xName,
    min: xMin,
    max: xMax,
    step: xStep,
    start: xStart,
    minLabel: `${fmt(xMin)} ${xUnit}`.trim(),
    maxLabel: `${fmt(xMax)} ${xUnit}`.trim(),
    compute(x) {
      const y = rate * x;
      const len = Math.max(2, (Math.abs(y) / yMax) * barMax);
      const model =
        `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar showing ${esc(yName)}">` +
        `<rect x="${padL}" y="10" width="${barMax}" height="${H - 20}" rx="6" fill="rgba(38,70,83,.08)"/>` +
        `<rect x="${padL}" y="10" width="${len.toFixed(1)}" height="${H - 20}" rx="6" fill="${DATA_1}"/>` +
        `<text x="${padL + 8}" y="${H / 2 + 4}" font-size="13" font-weight="800" fill="#fff">${fmt(y)} ${esc(yUnit)}</text>` +
        `</svg>`;
      const readout = `${fmt(x)} ${esc(xUnit)} &rarr; <b>${fmt(y)} ${esc(yUnit)}</b>`;
      const relation = `${esc(yName)} = ${fmt(rate)} &times; ${esc(xName)}`;
      return {
        slider: `${fmt(x)} ${xUnit}`.trim(),
        readout,
        relation,
        model,
        announce: `${fmt(x)} ${xUnit} gives ${fmt(y)} ${yUnit}.`.replace(/\s+/g, " ").trim(),
      };
    },
  });
}

// ── PERCENT:  part = whole * p/100 ────────────────────────────────────────────
function percent(host, cfg) {
  const whole = toNum(cfg.whole);
  if (!isNum(whole)) return null;
  const xMin = isNum(toNum(cfg.xMin)) ? toNum(cfg.xMin) : 0;
  const xMax = isNum(toNum(cfg.xMax)) ? toNum(cfg.xMax) : 100;
  const xStep = isNum(toNum(cfg.xStep)) ? toNum(cfg.xStep) : 5;
  const xStart = isNum(toNum(cfg.xStart)) ? clamp(toNum(cfg.xStart), xMin, xMax) : xMin;
  const wholeName = cfg.wholeName || "the whole";
  return shell(host, cfg, {
    defaultTitle: "Percent of a number",
    sliderLabel: "Percent",
    min: xMin,
    max: xMax,
    step: xStep,
    start: xStart,
    minLabel: `${fmt(xMin)}%`,
    maxLabel: `${fmt(xMax)}%`,
    compute(p) {
      const part = (whole * p) / 100;
      const shaded = clamp(Math.round(p), 0, 100);
      let cells = "";
      for (let i = 0; i < 100; i++)
        cells += `<span class="ssim-cell${i < shaded ? " on" : ""}"></span>`;
      const model = `<div class="ssim-grid" role="img" aria-label="${shaded} of 100 squares shaded">${cells}</div>`;
      const readout = `<b>${fmt(p)}%</b> of ${fmt(whole)} = <b>${fmt(part)}</b>`;
      const relation = esc(wholeName) === "the whole" ? "" : `part of ${esc(wholeName)}`;
      return {
        slider: `${fmt(p)}%`,
        readout,
        relation,
        model,
        announce: `${fmt(p)} percent of ${fmt(whole)} is ${fmt(part)}.`,
      };
    },
  });
}

// ── LINEAR:  y = m*x + b ──────────────────────────────────────────────────────
function linear(host, cfg) {
  const m = toNum(cfg.m);
  const b = toNum(cfg.b);
  const xMin = toNum(cfg.xMin);
  const xMax = toNum(cfg.xMax);
  if (!isNum(m) || !isNum(b) || !isNum(xMin) || !isNum(xMax) || xMax <= xMin) return null;
  const xStep = isNum(toNum(cfg.xStep)) ? toNum(cfg.xStep) : 1;
  const xStart = isNum(toNum(cfg.xStart)) ? clamp(toNum(cfg.xStart), xMin, xMax) : xMin;
  const xName = cfg.xName || "x";
  const yName = cfg.yName || "y";
  // y-range across the whole domain (line is monotone, so endpoints bound it).
  const yA = m * xMin + b,
    yB = m * xMax + b;
  const yLo = Math.min(yA, yB, 0),
    yHi = Math.max(yA, yB, 0);
  const W = 300,
    H = 200,
    padL = 34,
    padR = 12,
    padT = 12,
    padB = 26;
  const plotW = W - padL - padR,
    plotH = H - padT - padB,
    baseY = padT + plotH;
  const xOf = (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW;
  const yOf = (y) => baseY - ((y - yLo) / Math.max(1e-9, yHi - yLo)) * plotH;
  const sign = (v) => (v < 0 ? `- ${fmt(Math.abs(v))}` : `+ ${fmt(v)}`);
  return shell(host, cfg, {
    defaultTitle: "Linear relationship",
    sliderLabel: xName,
    min: xMin,
    max: xMax,
    step: xStep,
    start: xStart,
    minLabel: `${esc(xName)} = ${fmt(xMin)}`,
    maxLabel: `${esc(xName)} = ${fmt(xMax)}`,
    compute(x) {
      const y = m * x + b;
      const px = xOf(x),
        py = yOf(y);
      const model =
        `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Point plotted on the line">` +
        `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${baseY}" stroke="var(--ink,#333)" stroke-width="1.5"/>` +
        `<line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="var(--ink,#333)" stroke-width="1.5"/>` +
        `<line x1="${xOf(xMin).toFixed(1)}" y1="${yOf(yA).toFixed(1)}" x2="${xOf(xMax).toFixed(1)}" y2="${yOf(yB).toFixed(1)}" stroke="${DATA_1}" stroke-width="2.5" stroke-dasharray="5 4"/>` +
        `<line x1="${px.toFixed(1)}" y1="${baseY}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" stroke="var(--muted,#6b7280)" stroke-width="1" stroke-dasharray="2 3"/>` +
        `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6" fill="${DATA_2}" stroke="#fff" stroke-width="1.5"/>` +
        `<text x="${(W / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--muted,#6b7280)">${esc(xName)}</text>` +
        `<text x="10" y="${(padT + plotH / 2).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--muted,#6b7280)" transform="rotate(-90 10 ${(padT + plotH / 2).toFixed(1)})">${esc(yName)}</text>` +
        `</svg>`;
      const readout = `${esc(yName)} = ${fmt(m)}&middot;${fmt(x)} ${sign(b)} = <b>${fmt(y)}</b>`;
      const relation = `${esc(yName)} = ${fmt(m)}${esc(xName)} ${sign(b)}`;
      return {
        slider: `${esc(xName)} = ${fmt(x)}`,
        readout,
        relation,
        model,
        announce: `When ${xName} is ${fmt(x)}, ${yName} is ${fmt(y)}.`,
      };
    },
  });
}

// One-line plain-language description for a screen reader / host aria-label.
export function scenarioAria(cfg = {}) {
  const t = String(cfg.type || "");
  if (t === "proportional") {
    const x = cfg.xName || "the input",
      y = cfg.yName || "the output";
    return `Proportional relationship simulator: adjust ${x}, watch ${y} update.`;
  }
  if (t === "percent") {
    const w = cfg.wholeName || "the whole";
    return `Percent simulator: adjust the percent, watch the part of ${w} update.`;
  }
  if (t === "linear") {
    const x = cfg.xName || "x",
      y = cfg.yName || "y";
    return `Linear relationship simulator: adjust ${x}, watch ${y} update.`;
  }
  return "Scenario simulator: adjust a slider and watch the result update.";
}

export function renderScenarioSim(host, cfg = {}) {
  try {
    switch (String(cfg.type || "")) {
      case "proportional":
        return proportional(host, cfg);
      case "percent":
        return percent(host, cfg);
      case "linear":
        return linear(host, cfg);
      default:
        return null;
    }
  } catch (e) {
    console.warn("scenario-sim: render failed", e);
    return null;
  }
}

export default renderScenarioSim;
