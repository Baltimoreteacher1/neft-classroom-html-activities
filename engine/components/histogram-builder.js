// histogram-builder.js — Build-a-histogram exercise. The student is given a raw
// data set and a bin width; they bin the data into equal-width intervals and
// type the FREQUENCY (count of values) for each interval. As they type, the SVG
// bars grow to the entered heights; "Check" compares each entry to the true
// count. The data set + bin width ARE the answer key — the true frequencies are
// computed here, so no separate authoring is needed.
//
// Skill: 6.DS.5 — display numerical data with histograms.
//
// Pure SVG + DOM, no dependencies. Matches the histogramSVG() palette (teal
// bars, touching, white separators) so the live builder and static figures read
// as one family.
//
// Public API:
//   renderHistogramBuilder(host, cfg) -> { destroy }
//     cfg.data     : number[]  raw data values
//     cfg.binWidth : number    width of each equal interval
//     cfg.min      : number    optional first interval start
//                              (default floor(min(data)/binWidth) * binWidth)
//     cfg.title    : string    optional heading
//     cfg.xLabel   : string    optional x-axis label
//   Example: { data:[7,12,15,15,18,22,23,24,28,31,33,35,41], binWidth:10, min:0 }
//     -> intervals [0–9],[10–19],[20–29],[30–39],[40–49].

const C = {
  navy: "#12355b",
  ink: "#1a2b3c",
  muted: "#54677c",
  line: "#d7e2ed",
  accent: "#1d4ed8",
  bar: "#2a9d8f",
  ok: "#0d7a76",
  okFill: "#e2f9f5",
  okInk: "#095350",
  wrong: "#d9534f",
};

function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

// One-time scoped styles, guarded by id so repeated mounts share one <style>.
function ensureStyles() {
  if (document.getElementById("hist-builder-styles")) return;
  const s = document.createElement("style");
  s.id = "hist-builder-styles";
  s.textContent = `
  .hb-wrap{margin:var(--sp-3,12px) 0;display:flex;flex-direction:column;align-items:center;}
  .hb-title{font-weight:700;color:var(--navy,${C.navy});margin-bottom:6px;font-size:.95rem;text-align:center;}
  .hb-hint{font-size:.8rem;color:${C.muted};margin-bottom:8px;text-align:center;max-width:520px;}
  .hb-data{font-size:.82rem;color:${C.ink};margin-bottom:10px;text-align:center;max-width:520px;line-height:1.5;}
  .hb-data b{color:${C.navy};}
  .hb-stage{width:100%;max-width:560px;background:#fff;border:1px solid ${C.line};border-radius:12px;padding:10px 10px 4px;box-sizing:border-box;}
  .hb-stage svg{width:100%;height:auto;display:block;}
  .hb-bar{transform:scaleY(0);transition:transform .35s ease;}
  @media (prefers-reduced-motion:reduce){.hb-bar{transition:none;}}
  .hb-inputs{width:100%;max-width:560px;box-sizing:border-box;display:grid;margin-top:2px;}
  .hb-cell{display:flex;justify-content:center;}
  .hb-input{width:88%;max-width:56px;text-align:center;font-weight:800;font-size:clamp(13px,3.4vw,16px);
    color:${C.ink};padding:6px 2px;border:2px solid ${C.line};border-radius:8px;background:#fff;
    box-sizing:border-box;-moz-appearance:textfield;}
  .hb-input::-webkit-outer-spin-button,.hb-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
  .hb-input:focus{outline:none;border-color:${C.accent};box-shadow:0 0 0 3px rgba(29,78,216,.18);}
  .hb-input.correct{border-color:${C.ok};background:${C.okFill};color:${C.okInk};}
  .hb-input.wrong{border-color:${C.wrong};background:#fdeceb;color:${C.wrong};animation:hb-shake .32s;}
  @keyframes hb-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
  @media (prefers-reduced-motion:reduce){.hb-input.wrong{animation:none;}}
  .hb-controls{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px;}
  .hb-btn{font:inherit;font-weight:700;font-size:.85rem;border-radius:999px;padding:7px 16px;cursor:pointer;border:2px solid transparent;}
  .hb-btn-check{background:${C.accent};color:#fff;}
  .hb-btn-check:hover{filter:brightness(1.05);}
  .hb-btn-reveal{background:#fff;color:${C.navy};border-color:${C.line};}
  .hb-status{min-height:1.2em;margin-top:8px;font-size:.85rem;font-weight:700;text-align:center;}
  .hb-status.ok{color:${C.ok};}
  .hb-status.no{color:${C.wrong};}
  `;
  document.head.appendChild(s);
}

export function renderHistogramBuilder(host, cfg) {
  ensureStyles();

  const data = (Array.isArray(cfg.data) ? cfg.data : [])
    .map(Number)
    .filter((n) => Number.isFinite(n));
  const binWidth = Number(cfg.binWidth) > 0 ? Number(cfg.binWidth) : 10;
  const dataMin = data.length ? Math.min(...data) : 0;
  const dataMax = data.length ? Math.max(...data) : 0;
  const min = cfg.min != null ? Number(cfg.min) : Math.floor(dataMin / binWidth) * binWidth;

  // Bins of width binWidth from `min` upward until every value is covered.
  // A value v is in bin k where min + k*binWidth <= v < min + (k+1)*binWidth.
  const nBins = Math.max(1, Math.floor((dataMax - min) / binWidth) + 1);
  const intCounts = /* true frequency per bin — the answer key */ new Array(nBins).fill(0);
  for (const v of data) {
    let k = Math.floor((v - min) / binWidth);
    if (k < 0) k = 0;
    if (k >= nBins) k = nBins - 1;
    intCounts[k] += 1;
  }
  const intWidth = Number.isInteger(binWidth);
  const bins = intCounts.map((count, k) => {
    const lo = min + k * binWidth;
    const hi = lo + binWidth;
    const label = intWidth ? `${lo}–${hi - 1}` : `${lo}–${hi}`;
    return { lo, hi, label, count };
  });
  const total = data.length;
  const trueMax = Math.max(1, ...intCounts);
  const yMax = Math.max(2, trueMax + 1); // headroom so the answer isn't at the ceiling

  // ── SVG frame geometry ─────────────────────────────────────────────────────
  const W = 520,
    H = 300,
    padL = 46,
    padR = 18,
    padT = 26,
    padB = 66;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const baseY = padT + plotH;
  const bw = plotW / nBins;
  const yStep = yMax <= 10 ? 1 : Math.ceil(yMax / 8);

  let grid = "";
  for (let v = 0; v <= yMax; v += yStep) {
    const y = baseY - (v / yMax) * plotH;
    grid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${(W - padR).toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>`;
    grid += `<text x="${padL - 7}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="${C.muted}">${v}</text>`;
  }
  const axis =
    `<line x1="${padL}" y1="${baseY}" x2="${(W - padR).toFixed(1)}" y2="${baseY}" stroke="${C.ink}" stroke-width="1.5"/>` +
    `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${baseY}" stroke="${C.ink}" stroke-width="1.5"/>`;

  const barsSvg = bins
    .map((b, i) => {
      const x = padL + i * bw;
      const cx = x + bw / 2;
      // Full-height rect anchored at the baseline; scaleY (set in JS) grows it.
      return (
        `<rect class="hb-bar" data-i="${i}" x="${x.toFixed(1)}" y="${padT}" width="${(bw - 1).toFixed(1)}" height="${plotH.toFixed(1)}" fill="${C.bar}" stroke="#fff" stroke-width="1"/>` +
        `<text class="hb-barval" data-i="${i}" x="${cx.toFixed(1)}" y="${(baseY - 6).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="${C.navy}"></text>` +
        `<text x="${cx.toFixed(1)}" y="${(baseY + 18).toFixed(1)}" text-anchor="middle" font-size="11" fill="${C.ink}">${esc(b.label)}</text>`
      );
    })
    .join("");

  const yTitle = `<text x="14" y="${(padT + plotH / 2).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" fill="${C.muted}" transform="rotate(-90 14 ${(padT + plotH / 2).toFixed(1)})">Frequency</text>`;
  const xTitle = cfg.xLabel
    ? `<text x="${(padL + plotW / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="12" font-weight="600" fill="${C.muted}">${esc(cfg.xLabel)}</text>`
    : "";

  const aria =
    `Histogram to build: ${nBins} intervals of width ${binWidth}` +
    (cfg.xLabel ? ` for ${cfg.xLabel}` : "") +
    `. Enter the frequency for each interval; bars grow to your values.`;

  // Column template lines the inputs up under the bars: pad the grid by the same
  // left/right fractions the SVG reserves for its axis, then split into nBins.
  const padLPct = ((padL / W) * 100).toFixed(3);
  const padRPct = ((padR / W) * 100).toFixed(3);

  const wrap = document.createElement("div");
  wrap.className = "hb-wrap";
  wrap.innerHTML = `
    ${cfg.title ? `<div class="hb-title">${esc(cfg.title)}</div>` : ""}
    <div class="hb-hint">Sort each value into its interval and type how many values land in it. Intervals are left-closed, right-open: a value equal to an interval's top goes in the next interval.</div>
    <div class="hb-data"><b>Data (${total}):</b> ${data.join(", ")}</div>
    <div class="hb-stage">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}">
        ${grid}${axis}${barsSvg}${yTitle}${xTitle}
      </svg>
    </div>
    <div class="hb-inputs" style="grid-template-columns:repeat(${nBins},1fr);padding-left:${padLPct}%;padding-right:${padRPct}%;"></div>
    <div class="hb-controls">
      <button type="button" class="hb-btn hb-btn-check">Check</button>
      <button type="button" class="hb-btn hb-btn-reveal">Show me</button>
    </div>
    <div class="hb-status" role="status" aria-live="polite"></div>
  `;

  const svg = wrap.querySelector("svg");
  const inputsRow = wrap.querySelector(".hb-inputs");
  const status = wrap.querySelector(".hb-status");
  const rects = [...svg.querySelectorAll(".hb-bar")];
  const barVals = [...svg.querySelectorAll(".hb-barval")];

  // Anchor each bar's scale transform at its baseline so it grows upward.
  rects.forEach((r, i) => {
    const cx = padL + i * bw + bw / 2;
    r.style.transformOrigin = `${cx}px ${baseY}px`;
    r.style.transform = "scaleY(0)";
  });

  const inputs = bins.map((b, i) => {
    const cell = document.createElement("div");
    cell.className = "hb-cell";
    const inp = document.createElement("input");
    inp.className = "hb-input";
    inp.type = "text";
    inp.inputMode = "numeric";
    inp.setAttribute("pattern", "[0-9]*");
    inp.maxLength = 3;
    inp.setAttribute("aria-label", `frequency for interval ${b.label}`);
    inp.addEventListener("input", () => {
      inp.value = inp.value.replace(/[^0-9]/g, "");
      inp.classList.remove("correct", "wrong");
      updateBar(i);
    });
    cell.appendChild(inp);
    inputsRow.appendChild(cell);
    return inp;
  });

  const valOf = (i) => {
    const t = inputs[i].value.trim();
    return t === "" ? Number.NaN : parseInt(t, 10);
  };

  function updateBar(i) {
    const v = valOf(i);
    const ratio = Number.isNaN(v) ? 0 : Math.max(0, Math.min(1, v / yMax));
    rects[i].style.transform = `scaleY(${ratio})`;
    if (Number.isNaN(v)) {
      barVals[i].textContent = "";
    } else {
      barVals[i].textContent = String(v);
      barVals[i].setAttribute("y", (baseY - ratio * plotH - 6).toFixed(1));
    }
  }

  function check() {
    let anyEmpty = false;
    let allRight = true;
    let sum = 0;
    inputs.forEach((inp) => inp.classList.remove("correct", "wrong"));
    for (let i = 0; i < nBins; i++) {
      const v = valOf(i);
      if (Number.isNaN(v)) {
        anyEmpty = true;
        allRight = false;
        continue;
      }
      sum += v;
      if (v === bins[i].count) inputs[i].classList.add("correct");
      else {
        inputs[i].classList.add("wrong");
        allRight = false;
      }
    }

    if (anyEmpty) {
      status.textContent = "Fill in every interval.";
      status.className = "hb-status no";
      return;
    }
    if (allRight) {
      status.textContent = `All ${total} values placed ✓ \u{1F389}`;
      status.className = "hb-status ok";
      return;
    }
    // Total mismatch is the most useful nudge when counts are off.
    if (sum !== total) {
      status.textContent = `Not yet — your frequencies add up to ${sum}, but there are ${total} values. Recount the red intervals.`;
    } else {
      status.textContent =
        "Not yet — the red intervals have the wrong count. Recount those values.";
    }
    status.className = "hb-status no";
  }

  function reveal() {
    inputs.forEach((inp, i) => {
      inp.value = String(bins[i].count);
      inp.classList.remove("wrong");
      inp.classList.add("correct");
      updateBar(i);
    });
    status.textContent = `Here are the true frequencies — all ${total} values placed ✓`;
    status.className = "hb-status ok";
  }

  const checkBtn = wrap.querySelector(".hb-btn-check");
  const revealBtn = wrap.querySelector(".hb-btn-reveal");
  checkBtn.addEventListener("click", check);
  revealBtn.addEventListener("click", reveal);

  host.appendChild(wrap);
  if (inputs[0]) setTimeout(() => inputs[0].focus(), 0);

  return {
    destroy() {
      checkBtn.removeEventListener("click", check);
      revealBtn.removeEventListener("click", reveal);
      wrap.remove();
    },
  };
}

export default renderHistogramBuilder;
