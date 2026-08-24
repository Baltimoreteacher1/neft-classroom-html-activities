// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
//
// The `focus` config tunes the emphasis and coaching per lesson:
//   "variability" (8-1) · "center" (8-2) · "spread" (8-3) · "choose" (8-4)
//
// Pure SVG + DOM, no dependencies. Public API:
//   renderStatsDataLab(container, cfg) -> { destroy }
//     cfg.data    : starting values (default sample set)
//     cfg.unit    : what the values measure, e.g. "points"
//     cfg.focus   : "center" (default) | "spread" | "choose" | "variability"
//     cfg.max     : largest allowed value (default 40)
//     cfg.presets : optional [{ label, data, unit? }]
//     cfg.intro   : optional coaching sentence under the title

const C = {
  navy: "#12355b",
  accent: "#1d4ed8",
  teal: "#0d7a76",
  amber: "#b45309",
  ink: "#1a2b3c",
  muted: "#54677c",
  line: "#d7e2ed",
  chipBg: "#f4f8ff",
  mean: "#7c3aed",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

const round = (v, d = 2) => {
  const p = 10 ** d;
  return Math.round(v * p) / p;
};
const fmt = (v) => String(round(v, 2));

function mean(a) {
  return a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN;
}
function median(a) {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
// Mode: every value tied for the highest frequency. Returns [] when every
// value is unique (no mode), or the sorted list of most-frequent values.
function modes(a) {
  const count = new Map();
  for (const v of a) count.set(v, (count.get(v) || 0) + 1);
  const max = Math.max(0, ...count.values());
  if (max <= 1) return [];
  return [...count.entries()]
    .filter(([, n]) => n === max)
    .map(([v]) => v)
    .sort((x, y) => x - y);
}
function mad(a) {
  if (!a.length) return NaN;
  const m = mean(a);
  return mean(a.map((v) => Math.abs(v - m)));
}

const FOCUS_COPY = {
  variability:
    "These are answers to a statistical question — they vary from case to case. Add or remove values and watch how spread out the data is.",
  center:
    "Three ways to describe the center. Add an outlier and watch the mean chase it while the median barely moves.",
  spread:
    "The MAD measures spread: the average distance each value sits from the mean. Spread the data out and watch it grow.",
  choose:
    "Which measure best describes this data? Add an outlier and compare: the mean gets pulled toward it, the median resists.",
};

export function renderStatsDataLab(container, cfg = {}) {
  const focus = ["variability", "center", "spread", "choose"].includes(cfg.focus)
    ? cfg.focus
    : "center";
  const MAXV = Number(cfg.max) > 0 ? Number(cfg.max) : 40;
  const presets = Array.isArray(cfg.presets)
    ? cfg.presets.filter((p) => p && Array.isArray(p.data))
    : [];
  let data =
    Array.isArray(cfg.data) && cfg.data.length ? cfg.data.slice() : [8, 10, 9, 12, 11, 10, 30];
  let unit = cfg.unit || "";

  injectStyles();
  const root = document.createElement("div");
  root.className = "sdlab";
  root.innerHTML =
    `<div class="sdlab-head"><span class="sdlab-title">📈 Data Lab</span></div>` +
    `<p class="sdlab-hint">${esc(cfg.intro || FOCUS_COPY[focus])}</p>` +
    (presets.length
      ? `<div class="sdlab-presets" role="group" aria-label="Pick a data set">` +
        presets
          .map(
            (p, i) =>
              `<button type="button" class="sdlab-chip" data-preset="${i}">${esc(p.label || `Data set ${i + 1}`)}</button>`,
          )
          .join("") +
        `</div>`
      : "") +
    `<div class="sdlab-datarow"><span class="sdlab-datalabel" data-el="datalabel"></span><span class="sdlab-chips" data-el="chips"></span></div>` +
    `<div class="sdlab-addrow">` +
    `<input type="number" inputmode="numeric" class="sdlab-input" data-el="add" placeholder="value" aria-label="New data value" min="0" max="${MAXV}"/>` +
    `<button type="button" class="sdlab-addbtn" data-el="addbtn">+ Add value</button>` +
    `<button type="button" class="sdlab-clear" data-el="clear">Clear</button></div>` +
    `<div class="sdlab-plot" data-el="plot"></div>` +
    `<div class="sdlab-measures" data-el="measures"></div>` +
    `<div class="sdlab-note" data-el="note" role="status" aria-live="polite"></div>`;
  container.appendChild(root);
  const el = (n) => root.querySelector(`[data-el="${n}"]`);

  function renderChips() {
    el("datalabel").textContent = `Data${unit ? ` (${unit})` : ""}`;
    el("chips").innerHTML = data.length
      ? data
          .map(
            (v, i) =>
              `<button type="button" class="sdlab-datachip" data-i="${i}" title="Tap to remove" aria-label="Remove ${v}">${v}<span class="sdlab-x">×</span></button>`,
          )
          .join("")
      : `<span class="sdlab-empty">No data — add some values.</span>`;
    el("chips")
      .querySelectorAll("[data-i]")
      .forEach((b) =>
        b.addEventListener("click", () => {
          data.splice(Number(b.dataset.i), 1);
          renderAll();
        }),
      );
  }

  function renderPlot() {
    const plot = el("plot");
    if (!data.length) {
      plot.innerHTML = "";
      return;
    }
    const lo = Math.min(0, ...data);
    const hi = Math.max(...data);
    const axMin = lo;
    const axMax = hi + Math.max(1, Math.round((hi - lo) * 0.1));
    const W = 640;
    const L = 30;
    const R = 610;
    const AX = 120;
    const x = (v) => L + ((v - axMin) / (axMax - axMin || 1)) * (R - L);
    const counts = new Map();
    let dots = "";
    for (const v of [...data].sort((a, b) => a - b)) {
      const k = counts.get(v) || 0;
      counts.set(v, k + 1);
      dots += `<circle cx="${x(v)}" cy="${AX - 12 - k * 12}" r="5" fill="${C.teal}" fill-opacity="0.8"/>`;
    }
    const tick = Math.max(1, Math.round((axMax - axMin) / 12));
    let axis = `<line x1="${L}" y1="${AX}" x2="${R}" y2="${AX}" stroke="${C.navy}" stroke-width="2"/>`;
    for (let t = axMin; t <= axMax; t += tick) {
      axis +=
        `<line x1="${x(t)}" y1="${AX - 4}" x2="${x(t)}" y2="${AX + 4}" stroke="${C.navy}"/>` +
        `<text x="${x(t)}" y="${AX + 20}" text-anchor="middle" font-size="11" fill="${C.muted}">${t}</text>`;
    }
    const m = mean(data);
    const meanLine =
      `<line x1="${x(m)}" y1="18" x2="${x(m)}" y2="${AX}" stroke="${C.mean}" stroke-width="2" stroke-dasharray="4 3"/>` +
      `<polygon points="${x(m)},${AX} ${x(m) - 7},${AX + 11} ${x(m) + 7},${AX + 11}" fill="${C.mean}"/>` +
      `<text x="${x(m)}" y="14" text-anchor="middle" font-size="11" font-weight="800" fill="${C.mean}">mean ${fmt(m)}</text>`;
    plot.innerHTML = `<svg viewBox="0 0 ${W} 150" role="img" aria-label="Dot plot of the data with the mean marked as a balance point">${axis}${dots}${meanLine}</svg>`;
  }

  function measureCard(label, value, hi = false) {
    return `<div class="sdlab-mcard${hi ? " sdlab-mcard-hi" : ""}"><span class="sdlab-mlabel">${label}</span><span class="sdlab-mval">${value}</span></div>`;
  }

  function renderMeasures() {
    if (!data.length) {
      el("measures").innerHTML = "";
      el("note").innerHTML = "";
      return;
    }
    const md = modes(data);
    const modeText = md.length ? md.map(fmt).join(", ") : "none";
    const cards = [
      measureCard("Mean", fmt(mean(data)), focus === "center" || focus === "choose"),
      measureCard("Median", fmt(median(data)), focus === "center" || focus === "choose"),
      measureCard("Mode", modeText, focus === "center"),
      measureCard("Range", fmt(Math.max(...data) - Math.min(...data)), focus === "variability"),
      measureCard("MAD", fmt(mad(data)), focus === "spread" || focus === "choose"),
    ];
    el("measures").innerHTML = cards.join("");
    renderNote();
  }

  function renderNote() {
    let msg = "";
    const m = mean(data);
    const md = median(data);
    if (focus === "choose" || focus === "center") {
      const gap = Math.abs(m - md);
      // Flag skew when the mean pulls away from the median by a meaningful
      // amount relative to the median itself. The median is used as the yard-
      // stick (not the range or MAD) because both of those are inflated by the
      // very outlier we're trying to surface, which would hide the skew.
      if (data.length >= 3 && gap >= Math.max(1, 0.12 * Math.abs(md))) {
        msg = `The mean (${fmt(m)}) and median (${fmt(md)}) are far apart — a sign of an <strong>outlier or skew</strong>. When that happens the <strong>median</strong> usually describes the typical value better.`;
      } else if (data.length >= 3) {
        msg = `The mean (${fmt(m)}) and median (${fmt(md)}) are close, so the data is fairly <strong>symmetric</strong> — the mean is a good summary of the center.`;
      }
    } else if (focus === "spread") {
      msg = `On average each value sits <strong>${fmt(mad(data))} ${unit}</strong> from the mean. A larger MAD means the data is more spread out; a smaller MAD means it clusters near the mean.`;
    } else if (focus === "variability") {
      const set = new Set(data);
      msg =
        set.size <= 1
          ? "Every value is the same — there's no variability, so this wouldn't be a statistical question."
          : `The values range across <strong>${fmt(Math.max(...data) - Math.min(...data))} ${unit}</strong>. Because the answers vary, this is a <strong>statistical question</strong> worth collecting data on.`;
    }
    el("note").innerHTML = msg ? `<div class="sdlab-msg">${msg}</div>` : "";
  }

  function renderAll() {
    renderChips();
    renderPlot();
    renderMeasures();
  }

  function addValue() {
    const raw = el("add").value.trim();
    const n = Number(raw);
    if (raw === "" || !Number.isFinite(n)) {
      el("add").focus();
      return;
    }
    const v = Math.max(0, Math.min(MAXV, Math.round(n)));
    if (data.length >= 40) return; // keep the dot plot legible
    data.push(v);
    el("add").value = "";
    renderAll();
    el("add").focus();
  }

  el("addbtn").addEventListener("click", addValue);
  el("add").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addValue();
    }
  });
  el("clear").addEventListener("click", () => {
    data = [];
    renderAll();
  });
  root.querySelectorAll("[data-preset]").forEach((b) =>
    b.addEventListener("click", () => {
      const p = presets[Number(b.dataset.preset)];
      data = p.data.slice();
      unit = p.unit || unit;
      renderAll();
    }),
  );

  renderAll();

  return {
    destroy() {
      root.remove();
    },
  };
}

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || document.getElementById("sdlab-styles")) {
    stylesInjected = true;
    return;
  }
  stylesInjected = true;
  const s = document.createElement("style");
  s.id = "sdlab-styles";
  s.textContent = `
  .sdlab{max-width:720px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:16px 16px 18px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .sdlab-title{font-family:"Outfit",system-ui,sans-serif;font-weight:700;color:${C.navy};font-size:1.05rem;}
  .sdlab-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.45;}
  .sdlab-presets{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px;}
  .sdlab-chip{padding:5px 12px;font-size:.9rem;font-weight:600;color:${C.navy};background:${C.chipBg};border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;font-family:inherit;}
  .sdlab-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .sdlab-datarow{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:10px 12px;background:#f8fbff;border:1px solid ${C.line};border-radius:12px;}
  .sdlab-datalabel{font-size:.7rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:${C.muted};}
  .sdlab-chips{display:flex;flex-wrap:wrap;gap:5px;}
  .sdlab-datachip{display:inline-flex;align-items:center;gap:3px;padding:3px 6px 3px 9px;font-weight:700;font-size:.95rem;color:${C.navy};background:#fff;border:1.5px solid ${C.line};border-radius:8px;cursor:pointer;font-family:inherit;}
  .sdlab-datachip:hover{border-color:${C.amber};color:${C.amber};}
  .sdlab-x{font-size:.85rem;opacity:.6;}
  .sdlab-empty{color:${C.muted};font-size:.9rem;}
  .sdlab-addrow{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}
  .sdlab-input{width:110px;padding:9px 10px;font-size:1rem;font-weight:600;color:${C.ink};border:2px solid ${C.line};border-radius:10px;background:#fbfcfe;font-family:inherit;}
  .sdlab-input:focus-visible{outline:3px solid ${C.accent};outline-offset:1px;border-color:${C.accent};}
  .sdlab-addbtn{padding:9px 16px;font-size:.9rem;font-weight:700;color:#fff;background:linear-gradient(135deg,#4f46e5,#0e8a7d);border:0;border-radius:10px;cursor:pointer;font-family:inherit;}
  .sdlab-addbtn:hover{filter:brightness(1.08);}
  .sdlab-clear{padding:9px 14px;font-size:.85rem;font-weight:700;color:${C.navy};background:#fff;border:1.5px solid ${C.line};border-radius:10px;cursor:pointer;font-family:inherit;}
  .sdlab-clear:hover{background:${C.chipBg};}
  .sdlab-addbtn:focus-visible,.sdlab-clear:focus-visible,.sdlab-chip:focus-visible,.sdlab-datachip:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .sdlab-plot{margin-top:10px;}
  .sdlab-plot svg{width:100%;height:auto;display:block;}
  .sdlab-measures{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;}
  .sdlab-mcard{flex:1 1 90px;min-width:84px;padding:9px 10px;background:#fbfcfe;border:1px solid ${C.line};border-radius:12px;text-align:center;}
  .sdlab-mcard-hi{background:#f4f2ff;border-color:#d9d0ff;}
  .sdlab-mlabel{display:block;font-size:.68rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:${C.muted};}
  .sdlab-mval{display:block;margin-top:2px;font-family:"Outfit",system-ui,sans-serif;font-size:1.2rem;font-weight:700;color:${C.navy};}
  .sdlab-note{margin-top:10px;}
  .sdlab-msg{padding:10px 14px;border-radius:12px;font-size:.92rem;line-height:1.5;background:#f4f2ff;color:${C.navy};border:1px solid #d9d0ff;}
  @media (max-width:480px){.sdlab-mcard{flex-basis:calc(50% - 4px);}}
  `;
  document.head.appendChild(s);
}

export default renderStatsDataLab;
