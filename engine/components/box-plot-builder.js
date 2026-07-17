// box-plot-builder.js — Interactive box-plot construction lab. Students don't
// just *read* a box plot here — they build one: sort the data, then drag the
// five-number-summary handles (min, Q1, median, Q3, max) onto a number line
// that shows the data as a dot plot. The box-and-whisker drawing follows their
// handles live, and "Check my box plot" coaches each statistic separately
// (what to recount, never the value itself). When all five are right the plot
// locks in and the lab surfaces range + IQR from *their* box.
//
// Quartile convention matches Grade 6 / Reveal Math: order the data, the
// median splits it, and when n is odd the median itself belongs to neither
// half; Q1/Q3 are the medians of the halves.
//
// Pure SVG + DOM, no dependencies. Public API:
//   renderBoxPlotBuilder(container, cfg) -> { destroy }
//     cfg.data    : array of numbers (default sample set)
//     cfg.unit    : axis label, e.g. "points"
//     cfg.presets : optional [{ label, data, unit? }] quick-pick data sets
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
  draft: "#8aa3bd",
};

const HANDLES = [
  { key: "min", label: "Min", color: "#12355b" },
  { key: "q1", label: "Q1", color: "#b45309" },
  { key: "med", label: "Med", color: "#0d7a76" },
  { key: "q3", label: "Q3", color: "#b45309" },
  { key: "max", label: "Max", color: "#12355b" },
];

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

function medianOf(sorted) {
  const n = sorted.length;
  if (!n) return NaN;
  const mid = Math.floor(n / 2);
  return n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Five-number summary with the grade-6 "median joins neither half" convention.
function fiveNumber(data) {
  const s = [...data].sort((a, b) => a - b);
  const n = s.length;
  const mid = Math.floor(n / 2);
  const lower = s.slice(0, mid);
  const upper = n % 2 ? s.slice(mid + 1) : s.slice(mid);
  return { min: s[0], q1: medianOf(lower), med: medianOf(s), q3: medianOf(upper), max: s[n - 1] };
}

const HINTS = {
  min: "Min should sit on the smallest data value — look at the leftmost dot.",
  max: "Max should sit on the largest data value — look at the rightmost dot.",
  med: "Med is the middle of the ordered list. Count in from both ends at the same time; with an even count, it's halfway between the two middle values.",
  q1: "Q1 is the median of the LOWER half (don't include the median itself when the count is odd).",
  q3: "Q3 is the median of the UPPER half (don't include the median itself when the count is odd).",
};

export function renderBoxPlotBuilder(container, cfg = {}) {
  const presets = Array.isArray(cfg.presets)
    ? cfg.presets.filter((p) => p && Array.isArray(p.data))
    : [];
  let data =
    Array.isArray(cfg.data) && cfg.data.length >= 5
      ? cfg.data.slice()
      : [12, 7, 15, 9, 12, 18, 10, 14, 8];
  let unit = cfg.unit || "";
  let sortedView = false;
  let solved = false;
  let pos = {}; // handle key -> current value
  let geo = {}; // axis geometry, set in computeGeo()
  const dragCleanups = new Set(); // active window drag listeners, for destroy()

  injectStyles();
  const root = document.createElement("div");
  root.className = "bplab";
  root.innerHTML =
    `<div class="bplab-head"><span class="bplab-title">📦 Box Plot Builder</span></div>` +
    `<p class="bplab-hint">${esc(cfg.intro || "Build the box plot yourself: sort the data, then drag Min, Q1, Med, Q3, and Max into place on the number line. Check when you think all five are set.")}</p>` +
    (presets.length
      ? `<div class="bplab-presets" role="group" aria-label="Pick a data set">` +
        presets
          .map(
            (p, i) =>
              `<button type="button" class="bplab-chip" data-preset="${i}">${esc(p.label || `Data set ${i + 1}`)}</button>`,
          )
          .join("") +
        `</div>`
      : "") +
    `<div class="bplab-datarow"><span class="bplab-datalabel">Data${unit ? ` (${esc(unit)})` : ""}</span><span class="bplab-chips" data-el="chips"></span>` +
    `<button type="button" class="bplab-sort" data-el="sort">Sort the data →</button></div>` +
    `<div class="bplab-plot" data-el="plot"></div>` +
    `<div class="bplab-legend">` +
    HANDLES.map(
      (h) =>
        `<span class="bplab-leg"><span class="bplab-dotkey" style="background:${h.color}"></span>${h.label}</span>`,
    ).join("") +
    `<span class="bplab-leg bplab-leg-tip">drag a handle, or focus it and use ← →</span></div>` +
    `<div class="bplab-actions"><button type="button" class="bplab-go" data-el="check">Check my box plot</button></div>` +
    `<div class="bplab-feed" data-el="feed" role="status" aria-live="polite"></div>`;
  container.appendChild(root);
  const el = (name) => root.querySelector(`[data-el="${name}"]`);

  function computeGeo() {
    const lo = Math.min(...data);
    const hi = Math.max(...data);
    const pad = Math.max(1, Math.round((hi - lo) * 0.15));
    const axMin = Math.floor(lo - pad);
    const axMax = Math.ceil(hi + pad);
    const allInts = data.every((v) => Number.isInteger(v));
    const step = allInts ? 0.5 : 0.25;
    const W = 640;
    const L = 34;
    const R = 606;
    const x = (v) => L + ((v - axMin) / (axMax - axMin)) * (R - L);
    const fromX = (px) => axMin + ((px - L) / (R - L)) * (axMax - axMin);
    let tick = Math.max(1, Math.round((axMax - axMin) / 12));
    geo = { axMin, axMax, step, W, L, R, x, fromX, tick };
  }

  function resetPositions() {
    computeGeo();
    // Park the handles evenly across the axis so nothing starts "correct".
    const span = geo.axMax - geo.axMin;
    HANDLES.forEach((h, i) => {
      pos[h.key] = snap(geo.axMin + span * (0.1 + 0.2 * i));
    });
    solved = false;
  }

  function snap(v) {
    const s = geo.step;
    return Math.min(geo.axMax, Math.max(geo.axMin, Math.round(v / s) * s));
  }

  const fmt = (v) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100));

  function renderChips() {
    const shown = sortedView ? [...data].sort((a, b) => a - b) : data;
    el("chips").innerHTML = shown
      .map(
        (v) => `<span class="bplab-datachip${sortedView ? " bplab-sorted" : ""}">${fmt(v)}</span>`,
      )
      .join("");
    el("sort").hidden = sortedView;
  }

  function renderPlot() {
    const { x, axMin, axMax, tick } = geo;
    const AX = 150;
    // Dot plot of the data (stacked for duplicates) just above the axis.
    const counts = new Map();
    let dots = "";
    for (const v of [...data].sort((a, b) => a - b)) {
      const k = counts.get(v) || 0;
      counts.set(v, k + 1);
      dots += `<circle cx="${x(v)}" cy="${AX - 12 - k * 11}" r="4" fill="#b9c9d9"/>`;
    }
    // Axis + ticks.
    let axis = `<line x1="${geo.L}" y1="${AX}" x2="${geo.R}" y2="${AX}" stroke="${C.navy}" stroke-width="2"/>`;
    for (let t = axMin; t <= axMax; t += tick) {
      axis +=
        `<line x1="${x(t)}" y1="${AX - 4}" x2="${x(t)}" y2="${AX + 4}" stroke="${C.navy}"/>` +
        `<text x="${x(t)}" y="${AX + 20}" text-anchor="middle" font-size="11" fill="${C.muted}">${t}</text>`;
    }
    // Student box plot from current handle values.
    const p = pos;
    const boxColor = solved ? C.teal : C.draft;
    const BY = 62;
    const BH = 34;
    const mid = BY + BH / 2;
    const boxPlot =
      `<g stroke="${boxColor}" stroke-width="2.5" fill="none">` +
      `<line x1="${x(p.min)}" y1="${mid}" x2="${x(p.q1)}" y2="${mid}"/>` +
      `<line x1="${x(p.q3)}" y1="${mid}" x2="${x(p.max)}" y2="${mid}"/>` +
      `<line x1="${x(p.min)}" y1="${BY + 8}" x2="${x(p.min)}" y2="${BY + BH - 8}"/>` +
      `<line x1="${x(p.max)}" y1="${BY + 8}" x2="${x(p.max)}" y2="${BY + BH - 8}"/>` +
      `<rect x="${Math.min(x(p.q1), x(p.q3))}" y="${BY}" width="${Math.abs(x(p.q3) - x(p.q1))}" height="${BH}" fill="${solved ? "rgba(13,122,118,.12)" : "rgba(138,163,189,.12)"}"/>` +
      `<line x1="${x(p.med)}" y1="${BY}" x2="${x(p.med)}" y2="${BY + BH}" stroke-width="3"/>` +
      `</g>`;
    // Draggable handles on the axis.
    const handles = HANDLES.map((h) => {
      const px = x(pos[h.key]);
      return (
        `<g class="bplab-handle" data-h="${h.key}" tabindex="0" role="slider" aria-label="${h.label} handle" ` +
        `aria-valuemin="${axMin}" aria-valuemax="${axMax}" aria-valuenow="${pos[h.key]}" aria-valuetext="${h.label} at ${fmt(pos[h.key])}">` +
        `<line x1="${px}" y1="${AX}" x2="${px}" y2="${AX - 26}" stroke="${h.color}" stroke-width="2" stroke-dasharray="3 3" opacity=".55"/>` +
        `<circle cx="${px}" cy="${AX - 34}" r="12" fill="${h.color}"/>` +
        `<text x="${px}" y="${AX - 30}" text-anchor="middle" font-size="9" font-weight="800" fill="#fff">${h.label}</text>` +
        `</g>`
      );
    }).join("");
    el("plot").innerHTML =
      `<svg viewBox="0 0 ${geo.W} 185" role="img" aria-label="Number line with data dots and your box plot">` +
      dots +
      axis +
      boxPlot +
      handles +
      `</svg>`;
    wireHandles();
  }

  function wireHandles() {
    const svg = el("plot").querySelector("svg");
    svg.querySelectorAll(".bplab-handle").forEach((g) => {
      const key = g.dataset.h;
      g.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        // Window-level listeners survive the plot re-render on every move, so
        // the drag never loses its target element.
        const move = (ev) => {
          const liveSvg = el("plot").querySelector("svg");
          if (!liveSvg) return;
          const rect = liveSvg.getBoundingClientRect();
          const px = ((ev.clientX - rect.left) / rect.width) * geo.W;
          const v = snap(geo.fromX(px));
          if (v !== pos[key]) {
            pos[key] = v;
            solved = false;
            renderPlot();
          }
        };
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          dragCleanups.delete(up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        dragCleanups.add(up);
      });
      g.addEventListener("keydown", (e) => {
        const delta =
          e.key === "ArrowRight" || e.key === "ArrowUp"
            ? geo.step
            : e.key === "ArrowLeft" || e.key === "ArrowDown"
              ? -geo.step
              : 0;
        if (!delta) return;
        e.preventDefault();
        pos[key] = snap(pos[key] + delta);
        solved = false;
        renderPlot();
        el("plot").querySelector(`[data-h="${key}"]`)?.focus();
      });
    });
  }

  function check() {
    const truth = fiveNumber(data);
    const tol = geo.step / 2 + 1e-9;
    const wrong = HANDLES.filter((h) => Math.abs(pos[h.key] - truth[h.key]) > tol);
    const feed = el("feed");
    if (!wrong.length) {
      solved = true;
      renderPlot();
      const iqr = truth.q3 - truth.q1;
      const range = truth.max - truth.min;
      feed.innerHTML =
        `<div class="bplab-msg bplab-msg-win">🎉 <strong>That's the box plot!</strong> All five values are placed correctly. ` +
        `Now read your own plot: the <strong>range</strong> is ${fmt(truth.max)} − ${fmt(truth.min)} = <strong>${fmt(range)}</strong>, and the ` +
        `<strong>IQR</strong> (the box) is ${fmt(truth.q3)} − ${fmt(truth.q1)} = <strong>${fmt(iqr)}</strong> — the spread of the middle half of the data.</div>`;
      return;
    }
    const items = wrong
      .map((h) => `<li><strong>${h.label}</strong>: ${esc(HINTS[h.key])}</li>`)
      .join("");
    feed.innerHTML =
      `<div class="bplab-msg bplab-msg-warn"><strong>${5 - wrong.length} of 5 placed correctly.</strong> ` +
      `${sortedView ? "" : "Tip: sort the data first — it makes every one of these easier. "}Check:<ul class="bplab-list">${items}</ul></div>`;
  }

  function setData(next) {
    data = next.data.slice();
    unit = next.unit || unit;
    sortedView = false;
    resetPositions();
    el("feed").innerHTML = "";
    renderChips();
    renderPlot();
  }

  el("sort").addEventListener("click", () => {
    sortedView = true;
    renderChips();
  });
  el("check").addEventListener("click", check);
  root
    .querySelectorAll("[data-preset]")
    .forEach((btn) =>
      btn.addEventListener("click", () => setData(presets[Number(btn.dataset.preset)])),
    );

  resetPositions();
  renderChips();
  renderPlot();

  return {
    destroy() {
      for (const up of [...dragCleanups]) up();
      root.remove();
    },
  };
}

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || document.getElementById("bplab-styles")) {
    stylesInjected = true;
    return;
  }
  stylesInjected = true;
  const s = document.createElement("style");
  s.id = "bplab-styles";
  s.textContent = `
  .bplab{max-width:720px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:16px 16px 18px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .bplab-title{font-family:"Outfit",system-ui,sans-serif;font-weight:800;color:${C.navy};font-size:1.05rem;}
  .bplab-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.45;}
  .bplab-presets{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px;}
  .bplab-chip{padding:5px 12px;font-size:.9rem;font-weight:700;color:${C.navy};background:${C.chipBg};border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .bplab-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .bplab-datarow{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:10px 12px;background:#f8fbff;border:1px solid ${C.line};border-radius:12px;}
  .bplab-datalabel{font-size:.7rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:${C.muted};}
  .bplab-chips{display:flex;flex-wrap:wrap;gap:5px;}
  .bplab-datachip{min-width:2em;text-align:center;padding:3px 8px;font-weight:800;font-size:.95rem;color:${C.navy};background:#fff;border:1.5px solid ${C.line};border-radius:8px;}
  .bplab-datachip.bplab-sorted{border-color:#9adbd2;background:#f2fbf9;}
  .bplab-sort{margin-left:auto;padding:6px 12px;font-size:.85rem;font-weight:800;color:${C.navy};background:${C.chipBg};border:1.5px solid ${C.line};border-radius:8px;cursor:pointer;}
  .bplab-sort:hover{background:#e2ecff;}
  .bplab-plot{margin-top:10px;}
  .bplab-plot svg{width:100%;height:auto;display:block;}
  .bplab-handle{cursor:grab;}
  .bplab-handle:focus-visible{outline:none;}
  .bplab-handle:focus-visible circle{stroke:${C.accent};stroke-width:3;}
  .bplab-legend{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:4px;font-size:.8rem;color:${C.muted};font-weight:600;}
  .bplab-leg{display:inline-flex;align-items:center;gap:5px;}
  .bplab-dotkey{width:11px;height:11px;border-radius:999px;display:inline-block;}
  .bplab-leg-tip{margin-left:auto;font-weight:500;font-style:italic;}
  .bplab-actions{margin-top:10px;}
  .bplab-go{padding:9px 16px;font-size:.95rem;font-weight:800;color:#fff;background:linear-gradient(135deg,#4f46e5,#0e8a7d);border:0;border-radius:10px;cursor:pointer;}
  .bplab-go:hover{filter:brightness(1.08);}
  .bplab-go:focus-visible,.bplab-chip:focus-visible,.bplab-sort:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .bplab-feed{margin-top:10px;}
  .bplab-msg{padding:10px 14px;border-radius:12px;font-size:.95rem;line-height:1.5;}
  .bplab-msg-warn{background:#fbf4e6;color:#8a5800;border:1px solid #ecd9ae;}
  .bplab-msg-win{background:linear-gradient(135deg,#e2f9f5,#eef2ff);color:${C.navy};border:1px solid #9adbd2;}
  .bplab-list{margin:6px 0 0;padding-left:18px;}
  .bplab-list li{margin:3px 0;}
  @media (max-width:480px){.bplab-sort{margin-left:0;width:100%;}}
  `;
  document.head.appendChild(s);
}

export default renderBoxPlotBuilder;
