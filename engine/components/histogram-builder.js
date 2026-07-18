// histogram-builder.js — Interactive histogram construction lab. Students
// don't read a finished histogram — they build one: sort the data, count how
// many values land in each interval, and raise each bar to that count (drag
// the bar top, or focus a bar and use ↑ ↓). "Check my histogram" coaches each
// interval separately — what to recount and the boundary rule, never the
// count itself. When every bar is right the histogram locks in and the lab
// reads the shape back from *their* bars.
//
// Interval convention matches Grade 6 / Reveal Math: equal-width bins where a
// value equal to a bin's upper boundary belongs to the NEXT bin (0–9, 10–19, …
// for whole-number data with width 10).
//
// Pure SVG + DOM, no dependencies. Public API:
//   renderHistogramBuilder(container, cfg) -> { destroy }
//     cfg.data     : array of numbers (default sample set)
//     cfg.binWidth : interval width (default 10)
//     cfg.start    : lower bound of the first interval (default floor to width)
//     cfg.unit     : what the values measure, e.g. "minutes"
//     cfg.presets  : optional [{ label, data, binWidth?, start?, unit? }]
//     cfg.intro    : optional coaching sentence under the title

const C = {
  navy: "#12355b",
  accent: "#1d4ed8",
  teal: "#0d7a76",
  ink: "#1a2b3c",
  muted: "#54677c",
  line: "#d7e2ed",
  chipBg: "#f4f8ff",
  draft: "#8aa3bd",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

// Bin the data into [lo, lo+w) intervals covering every value.
function makeBins(data, width, start) {
  const lo0 = start != null ? start : Math.floor(Math.min(...data) / width) * width;
  const bins = [];
  let lo = lo0;
  const max = Math.max(...data);
  while (lo <= max) {
    bins.push({ lo, hi: lo + width, count: data.filter((v) => v >= lo && v < lo + width).length });
    lo += width;
  }
  return bins;
}

const binLabel = (b, intData) => (intData ? `${b.lo}–${b.hi - 1}` : `${b.lo}–<${b.hi}`);

export function renderHistogramBuilder(container, cfg = {}) {
  const presets = Array.isArray(cfg.presets)
    ? cfg.presets.filter((p) => p && Array.isArray(p.data))
    : [];
  let data =
    Array.isArray(cfg.data) && cfg.data.length >= 6
      ? cfg.data.slice()
      : [12, 25, 8, 31, 19, 22, 14, 27, 5, 16, 24, 33, 18, 21, 9];
  let width = Number(cfg.binWidth) > 0 ? Number(cfg.binWidth) : 10;
  let start = cfg.start;
  let unit = cfg.unit || "";
  let bins = [];
  let student = []; // student's bar height per bin
  let yMax = 8;
  let sortedView = false;
  let solved = false;
  const dragCleanups = new Set();

  injectStyles();
  const root = document.createElement("div");
  root.className = "hglab";
  root.innerHTML =
    `<div class="hglab-head"><span class="hglab-title">📊 Histogram Builder</span></div>` +
    `<p class="hglab-hint">${esc(cfg.intro || "Build the histogram yourself: sort the data, count how many values fall in each interval, then raise each bar to match. A value on a boundary belongs to the interval it STARTS (20 goes in 20–29, not 10–19).")}</p>` +
    (presets.length
      ? `<div class="hglab-presets" role="group" aria-label="Pick a data set">` +
        presets
          .map(
            (p, i) =>
              `<button type="button" class="hglab-chip" data-preset="${i}">${esc(p.label || `Data set ${i + 1}`)}</button>`,
          )
          .join("") +
        `</div>`
      : "") +
    `<div class="hglab-datarow"><span class="hglab-datalabel" data-el="datalabel"></span><span class="hglab-chips" data-el="chips"></span>` +
    `<button type="button" class="hglab-sort" data-el="sort">Sort the data →</button></div>` +
    `<div class="hglab-plot" data-el="plot"></div>` +
    `<p class="hglab-tip">drag a bar's top edge, or focus a bar and use ↑ ↓</p>` +
    `<div class="hglab-actions"><button type="button" class="hglab-go" data-el="check">Check my histogram</button></div>` +
    `<div class="hglab-feed" data-el="feed" role="status" aria-live="polite"></div>`;
  container.appendChild(root);
  const el = (name) => root.querySelector(`[data-el="${name}"]`);

  const intData = () => data.every((v) => Number.isInteger(v));

  function resetBars() {
    bins = makeBins(data, width, start);
    yMax = Math.max(4, ...bins.map((b) => b.count)) + 2;
    student = bins.map(() => 0);
    solved = false;
  }

  function renderChips() {
    const shown = sortedView ? [...data].sort((a, b) => a - b) : data;
    el("datalabel").textContent = `Data${unit ? ` (${unit})` : ""}`;
    el("chips").innerHTML = shown
      .map((v) => `<span class="hglab-datachip${sortedView ? " hglab-sorted" : ""}">${v}</span>`)
      .join("");
    el("sort").hidden = sortedView;
  }

  // Plot geometry: y axis on the left, one column per bin.
  const W = 640;
  const H = 240;
  const L = 46;
  const R = 620;
  const TOP = 16;
  const AX = 204;

  function renderPlot() {
    const n = bins.length;
    const colW = (R - L) / n;
    const y = (count) => AX - (count / yMax) * (AX - TOP);
    let grid = "";
    for (let t = 0; t <= yMax; t++) {
      if (yMax > 10 && t % 2) continue;
      grid +=
        `<line x1="${L}" y1="${y(t)}" x2="${R}" y2="${y(t)}" stroke="${t ? "#eef3f8" : C.navy}" stroke-width="${t ? 1 : 2}"/>` +
        `<text x="${L - 8}" y="${y(t) + 4}" text-anchor="end" font-size="11" fill="${C.muted}">${t}</text>`;
    }
    const barColor = solved ? C.teal : C.draft;
    const bars = bins
      .map((b, i) => {
        const x = L + i * colW;
        const h = student[i];
        const top = y(h);
        return (
          `<g class="hglab-bar" data-bin="${i}" tabindex="0" role="slider" aria-label="Bar for interval ${binLabel(b, intData())}" ` +
          `aria-valuemin="0" aria-valuemax="${yMax}" aria-valuenow="${h}" aria-valuetext="${binLabel(b, intData())}: ${h}">` +
          `<rect x="${x + 4}" y="${top}" width="${colW - 8}" height="${Math.max(0, AX - top)}" fill="${barColor}" fill-opacity="${h ? 0.75 : 0.12}" stroke="${barColor}" stroke-width="2"/>` +
          `<rect x="${x + 4}" y="${top - 7}" width="${colW - 8}" height="14" fill="transparent" class="hglab-grip"/>` +
          `<text x="${x + colW / 2}" y="${top - 10}" text-anchor="middle" font-size="12" font-weight="800" fill="${C.navy}">${h || ""}</text>` +
          `<text x="${x + colW / 2}" y="${AX + 16}" text-anchor="middle" font-size="11" fill="${C.muted}">${binLabel(b, intData())}</text>` +
          `</g>`
        );
      })
      .join("");
    const axisTitle = unit
      ? `<text x="${(L + R) / 2}" y="${AX + 32}" text-anchor="middle" font-size="11" font-weight="700" fill="${C.muted}">${esc(unit)}</text>`
      : "";
    el("plot").innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Histogram you are building, one bar per interval">` +
      grid +
      bars +
      axisTitle +
      `</svg>`;
    wireBars();
  }

  function wireBars() {
    const svg = el("plot").querySelector("svg");
    svg.querySelectorAll(".hglab-bar").forEach((g) => {
      const i = Number(g.dataset.bin);
      g.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        const move = (ev) => {
          const liveSvg = el("plot").querySelector("svg");
          if (!liveSvg) return;
          const rect = liveSvg.getBoundingClientRect();
          const py = ((ev.clientY - rect.top) / rect.height) * H;
          const count = Math.round(((AX - py) / (AX - TOP)) * yMax);
          const v = Math.max(0, Math.min(yMax, count));
          if (v !== student[i]) {
            student[i] = v;
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
        move(e);
      });
      g.addEventListener("keydown", (e) => {
        const delta = e.key === "ArrowUp" ? 1 : e.key === "ArrowDown" ? -1 : 0;
        if (!delta) return;
        e.preventDefault();
        student[i] = Math.max(0, Math.min(yMax, student[i] + delta));
        solved = false;
        renderPlot();
        el("plot").querySelector(`[data-bin="${i}"]`)?.focus();
      });
    });
  }

  function check() {
    const wrong = bins.map((b, i) => ({ b, i })).filter(({ b, i }) => student[i] !== b.count);
    const feed = el("feed");
    const totalPlaced = student.reduce((a, v) => a + v, 0);
    if (!wrong.length) {
      solved = true;
      renderPlot();
      const peak = bins.reduce((best, b) => (b.count > best.count ? b : best), bins[0]);
      feed.innerHTML =
        `<div class="hglab-msg hglab-msg-win">🎉 <strong>That's the histogram!</strong> All ${bins.length} bars match the data (${data.length} values total). ` +
        `Now read your own display: the tallest bar is <strong>${binLabel(peak, intData())}</strong> — that interval holds the most values. Where is the data clustered, and where are the gaps?</div>`;
      return;
    }
    const items = wrong
      .slice(0, 4)
      .map(
        ({ b }) =>
          `<li><strong>${binLabel(b, intData())}</strong>: recount the values from ${b.lo} up to (but not including) ${b.hi}.</li>`,
      )
      .join("");
    const totalNote =
      totalPlaced === data.length
        ? ""
        : ` Your bars add up to ${totalPlaced}, but there are ${data.length} data values — every value belongs in exactly one bar.`;
    feed.innerHTML =
      `<div class="hglab-msg hglab-msg-warn"><strong>${bins.length - wrong.length} of ${bins.length} bars correct.</strong>` +
      `${totalNote} ${sortedView ? "" : "Tip: sort the data first — counting each interval gets much easier. "}Check:<ul class="hglab-list">${items}</ul></div>`;
  }

  function setData(p) {
    data = p.data.slice();
    width = Number(p.binWidth) > 0 ? Number(p.binWidth) : width;
    start = p.start != null ? p.start : start;
    unit = p.unit || unit;
    sortedView = false;
    resetBars();
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

  resetBars();
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
  if (stylesInjected || document.getElementById("hglab-styles")) {
    stylesInjected = true;
    return;
  }
  stylesInjected = true;
  const s = document.createElement("style");
  s.id = "hglab-styles";
  s.textContent = `
  .hglab{max-width:720px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:16px 16px 18px;box-shadow:0 2px 12px rgba(12,27,42,.08);font-family:"Hanken Grotesk",system-ui,sans-serif;color:${C.ink};}
  .hglab-title{font-family:"Outfit",system-ui,sans-serif;font-weight:800;color:${C.navy};font-size:1.05rem;}
  .hglab-hint{margin:4px 0 12px;color:${C.muted};font-size:.9rem;line-height:1.45;}
  .hglab-presets{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px;}
  .hglab-chip{padding:5px 12px;font-size:.9rem;font-weight:700;color:${C.navy};background:${C.chipBg};border:1.5px solid ${C.line};border-radius:999px;cursor:pointer;}
  .hglab-chip:hover{background:#e2ecff;border-color:${C.accent};}
  .hglab-datarow{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:10px 12px;background:#f8fbff;border:1px solid ${C.line};border-radius:12px;}
  .hglab-datalabel{font-size:.7rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:${C.muted};}
  .hglab-chips{display:flex;flex-wrap:wrap;gap:5px;}
  .hglab-datachip{min-width:2em;text-align:center;padding:3px 8px;font-weight:800;font-size:.95rem;color:${C.navy};background:#fff;border:1.5px solid ${C.line};border-radius:8px;}
  .hglab-datachip.hglab-sorted{border-color:#9adbd2;background:#f2fbf9;}
  .hglab-sort{margin-left:auto;padding:6px 12px;font-size:.85rem;font-weight:800;color:${C.navy};background:${C.chipBg};border:1.5px solid ${C.line};border-radius:8px;cursor:pointer;}
  .hglab-sort:hover{background:#e2ecff;}
  .hglab-plot{margin-top:10px;}
  .hglab-plot svg{width:100%;height:auto;display:block;}
  .hglab-bar{cursor:grab;}
  .hglab-grip{cursor:ns-resize;}
  .hglab-bar:focus-visible{outline:none;}
  .hglab-bar:focus-visible rect{stroke:${C.accent};stroke-width:3;}
  .hglab-tip{margin:4px 0 0;font-size:.8rem;color:${C.muted};font-style:italic;text-align:right;}
  .hglab-actions{margin-top:8px;}
  .hglab-go{padding:9px 16px;font-size:.95rem;font-weight:800;color:#fff;background:linear-gradient(135deg,#4f46e5,#0e8a7d);border:0;border-radius:10px;cursor:pointer;}
  .hglab-go:hover{filter:brightness(1.08);}
  .hglab-go:focus-visible,.hglab-chip:focus-visible,.hglab-sort:focus-visible{outline:3px solid ${C.accent};outline-offset:2px;}
  .hglab-feed{margin-top:10px;}
  .hglab-msg{padding:10px 14px;border-radius:12px;font-size:.95rem;line-height:1.5;}
  .hglab-msg-warn{background:#fbf4e6;color:#8a5800;border:1px solid #ecd9ae;}
  .hglab-msg-win{background:linear-gradient(135deg,#e2f9f5,#eef2ff);color:${C.navy};border:1px solid #9adbd2;}
  .hglab-list{margin:6px 0 0;padding-left:18px;}
  .hglab-list li{margin:3px 0;}
  @media (max-width:480px){.hglab-sort{margin-left:0;width:100%;}}
  `;
  document.head.appendChild(s);
}

export default renderHistogramBuilder;
