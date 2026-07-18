// data-live.js — "Data Live": turns an AUTHORED static data figure (histogram,
// dot plot, box plot, bar chart) into an interactive, insight-revealing widget
// IN PLACE. It reads the exact same config the static SVG builders in
// visual-figures.js read, so every existing figure upgrades with zero authoring
// changes and the static SVG stays as the JS-off / print fallback.
//
// Design principle — EXPLORE-FIRST / NON-DESTRUCTIVE:
//   The default view shows the authored data exactly as before, so lesson
//   questions that reference "the tallest bar" still hold. On top of that the
//   student can (a) tap parts of the figure to read them aloud in numbers,
//   (b) REVEAL the measures of center & spread with live markers on the plot
//   (the mean-vs-median showpiece), and (c) enter an explicit, always-reversible
//   "What if?" sandbox to change the data and watch every statistic move.
//
// Public API:  renderDataLive(host, cfg) -> { destroy }
// cfg.kind ∈ "histogram" | "dot-plot" | "box-plot" | "bar-chart" (+ the same
// fields the matching *SVG builder uses: bars[], values[], min/q1/median/q3/max,
// xLabel, yLabel, title, unit).

const STYLE_ID = "data-live-styles";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
  .dlive{--dl-teal:var(--teal,#2a9d8f);--dl-coral:var(--coral,#d9795d);--dl-navy:var(--navy,#264653);--dl-ink:var(--ink,#333);--dl-muted:var(--muted,#6b7280);
    border:1px solid rgba(38,70,83,.14);border-radius:14px;padding:14px 14px 12px;margin:var(--sp-3,12px) 0;background:linear-gradient(180deg,#fff, #fbfdfc);box-shadow:0 1px 3px rgba(38,70,83,.06)}
  .dlive-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}
  .dlive-title{font-weight:800;color:var(--dl-navy);font-size:1rem}
  .dlive-badge{font-size:.68rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--dl-teal);border:1px solid currentColor;border-radius:999px;padding:2px 8px}
  .dlive-plot{position:relative}
  .dlive-plot svg{width:100%;height:auto;max-width:560px;display:block;margin:0 auto;touch-action:manipulation}
  .dlive [data-hit]{cursor:pointer}
  .dlive [data-hit]:hover,.dlive [data-hit][data-on="1"]{filter:brightness(1.06)}
  .dlive-tools{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 2px;align-items:center}
  .dlive-btn{font:inherit;font-size:.82rem;font-weight:700;color:var(--dl-navy);background:#fff;border:1.5px solid rgba(38,70,83,.22);border-radius:999px;padding:6px 12px;cursor:pointer;transition:.15s}
  .dlive-btn:hover{border-color:var(--dl-teal);color:var(--dl-teal)}
  .dlive-btn[aria-pressed="true"]{background:var(--dl-teal);border-color:var(--dl-teal);color:#fff}
  .dlive-btn.ghost{border-style:dashed}
  .dlive-nudge{display:inline-flex;gap:4px;align-items:center;margin-left:auto;flex-wrap:wrap}
  .dlive-nudge button{font:inherit;font-weight:800;width:34px;height:34px;border-radius:9px;border:1.5px solid rgba(38,70,83,.22);background:#fff;color:var(--dl-navy);cursor:pointer}
  .dlive-nudge button:hover{border-color:var(--dl-teal);color:var(--dl-teal)}
  .dlive-nudge .lab{font-size:.78rem;color:var(--dl-muted);font-weight:700;margin-right:2px}
  .dlive-measures{display:none;grid-template-columns:repeat(auto-fit,minmax(84px,1fr));gap:8px;margin-top:10px}
  .dlive.show-m .dlive-measures{display:grid}
  .dlive-stat{background:#fff;border:1px solid rgba(38,70,83,.14);border-radius:10px;padding:7px 9px;text-align:center}
  .dlive-stat b{display:block;font-size:1.12rem;color:var(--dl-navy);line-height:1.1}
  .dlive-stat span{font-size:.68rem;color:var(--dl-muted);font-weight:700;text-transform:uppercase;letter-spacing:.03em}
  .dlive-stat.hi b{color:var(--dl-coral)}
  .dlive-note{margin-top:9px;font-size:.86rem;color:var(--dl-ink);background:rgba(42,157,143,.08);border-left:3px solid var(--dl-teal);border-radius:0 8px 8px 0;padding:7px 10px;min-height:1.2em}
  .dlive-note:empty{display:none}
  @media (prefers-color-scheme:dark){
    .dlive{background:#182226;border-color:rgba(255,255,255,.12)}
    .dlive-stat,.dlive-btn,.dlive-nudge button{background:#20303540;color:#e7eef0}
    .dlive-title{color:#e7eef0}
  }`;
  document.head.appendChild(s);
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}
const num = (n) =>
  Number.isInteger(n) ? String(n) : (Math.round(n * 100) / 100).toFixed(2).replace(/\.?0+$/, "");

// ── grade-6 statistics (median joins neither half — matches box-plot-builder) ──
function median(sorted) {
  const n = sorted.length;
  if (!n) return null;
  const m = Math.floor(n / 2);
  return n % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
}
function fiveNum(values) {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length,
    m = Math.floor(n / 2);
  return {
    min: s[0],
    q1: median(s.slice(0, m)),
    median: median(s),
    q3: median(n % 2 ? s.slice(m + 1) : s.slice(m)),
    max: s[n - 1],
  };
}
function mean(v) {
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
function modes(v) {
  const c = {};
  let best = 0;
  v.forEach((x) => {
    c[x] = (c[x] || 0) + 1;
    best = Math.max(best, c[x]);
  });
  if (best <= 1) return [];
  return Object.keys(c)
    .filter((k) => c[k] === best)
    .map(Number)
    .sort((a, b) => a - b);
}

function statCard(label, value, hi) {
  return `<div class="dlive-stat${hi ? " hi" : ""}"><b>${value}</b><span>${esc(label)}</span></div>`;
}

// Shared shell: builds DOM, wires the mode/reveal/reset toolbar, and delegates
// plot rendering + measures to the per-kind controller.
function shell(host, cfg, ctrl) {
  injectStyles();
  const root = document.createElement("div");
  root.className = "dlive";
  root.innerHTML =
    `<div class="dlive-head"><span class="dlive-title">${esc(cfg.title || ctrl.defaultTitle)}</span>` +
    `<span class="dlive-badge">Data Live</span></div>` +
    `<div class="dlive-plot" data-el="plot"></div>` +
    `<div class="dlive-tools">` +
    `<button type="button" class="dlive-btn" data-el="reveal" aria-pressed="false">📊 Reveal the math</button>` +
    (ctrl.editable
      ? `<button type="button" class="dlive-btn ghost" data-el="whatif" aria-pressed="false">🧪 What if?</button>` +
        `<button type="button" class="dlive-btn" data-el="reset" hidden>↺ Reset data</button>`
      : "") +
    `<span class="dlive-nudge" data-el="nudge" hidden></span>` +
    `</div>` +
    `<div class="dlive-measures" data-el="measures" role="group" aria-label="Measures"></div>` +
    `<div class="dlive-note" data-el="note" role="status" aria-live="polite"></div>`;
  host.appendChild(root);
  const el = (n) => root.querySelector(`[data-el="${n}"]`);
  const state = { whatif: false, revealed: false, note: "" };

  function paint() {
    el("plot").innerHTML = ctrl.svg(state);
    el("measures").innerHTML = ctrl.measures(state);
    el("note").textContent = state.note || (state.whatif ? ctrl.editHint : ctrl.exploreHint);
    root.classList.toggle("show-m", state.revealed);
    ctrl.bind(el("plot"), state, api);
    ctrl.renderNudge?.(el("nudge"), state, api);
  }
  const api = {
    say(t) {
      state.note = t;
      el("note").textContent = t;
    },
    repaint: paint,
    state,
  };

  el("reveal").addEventListener("click", () => {
    state.revealed = !state.revealed;
    el("reveal").setAttribute("aria-pressed", String(state.revealed));
    state.note = "";
    paint();
  });
  el("whatif")?.addEventListener("click", () => {
    state.whatif = !state.whatif;
    el("whatif").setAttribute("aria-pressed", String(state.whatif));
    el("reset").hidden = !state.whatif;
    el("nudge").hidden = !state.whatif;
    state.note = "";
    paint();
  });
  el("reset")?.addEventListener("click", () => {
    ctrl.reset();
    state.note = "Data reset to the original.";
    paint();
  });

  paint();
  return {
    destroy() {
      root.remove();
    },
  };
}

// ── DOT PLOT ────────────────────────────────────────────────────────────────
function dotPlot(host, cfg) {
  const orig = (cfg.values || []).map(Number).filter((n) => !isNaN(n));
  let data = orig.slice();
  const lo = () => (cfg.min != null ? Number(cfg.min) : Math.min(...data, 0));
  const hi = () => (cfg.max != null ? Number(cfg.max) : Math.max(...data, 1));
  const W = 520,
    H = 230,
    padL = 30,
    padR = 20,
    baseY = H - 54;
  const scale = () => {
    const a = lo(),
      b = Math.max(hi(), a + 1);
    return { a, b, xOf: (v) => padL + ((v - a) / (b - a)) * (W - padL - padR) };
  };
  return shell(host, cfg, {
    defaultTitle: "Dot plot",
    editable: true,
    exploreHint:
      "Tap a stack to read how many. Press “Reveal the math” to see the mean vs. median.",
    editHint: "Tap the number line to add a dot; tap a dot to remove it.",
    reset() {
      data = orig.slice();
    },
    svg(state) {
      const { a, b, xOf } = scale();
      const counts = {};
      let axisTicks = "";
      const step = b - a <= 20 ? 1 : Math.ceil((b - a) / 12);
      for (let v = a; v <= b; v += step)
        axisTicks += `<line x1="${xOf(v).toFixed(1)}" y1="${baseY}" x2="${xOf(v).toFixed(1)}" y2="${baseY + 5}" stroke="var(--ink,#333)"/><text x="${xOf(v).toFixed(1)}" y="${baseY + 20}" text-anchor="middle" font-size="11" fill="var(--ink,#333)">${v}</text>`;
      const dots = [...data]
        .sort((x, y) => x - y)
        .map((v) => {
          counts[v] = (counts[v] || 0) + 1;
          const cy = baseY - 12 - (counts[v] - 1) * 15;
          return `<circle data-hit data-v="${v}" cx="${xOf(v).toFixed(1)}" cy="${cy.toFixed(1)}" r="6.5" fill="var(--teal,#2a9d8f)" stroke="#fff" stroke-width="1.5"/>`;
        })
        .join("");
      let overlay = "";
      if (state.revealed && data.length) {
        const mn = mean(data),
          md = median([...data].sort((x, y) => x - y));
        overlay =
          `<line x1="${xOf(md).toFixed(1)}" y1="26" x2="${xOf(md).toFixed(1)}" y2="${baseY}" stroke="var(--coral,#d9795d)" stroke-width="2.5" stroke-dasharray="4 3"/>` +
          `<text x="${xOf(md).toFixed(1)}" y="20" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--coral,#d9795d)">median ${num(md)}</text>` +
          `<path d="M${xOf(mn).toFixed(1)},${baseY - 2} l-7,12 l14,0 z" fill="var(--navy,#264653)"/>` +
          `<text x="${xOf(mn).toFixed(1)}" y="${baseY + 34}" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--navy,#264653)">mean ${num(mn)}</text>`;
      }
      const xLabel = cfg.xLabel
        ? `<text x="${(W / 2).toFixed(1)}" y="${H - 4}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--muted)">${esc(cfg.xLabel)}</text>`
        : "";
      return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Interactive dot plot"><line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="var(--ink,#333)" stroke-width="1.5"/>${axisTicks}${dots}${overlay}${xLabel}</svg>`;
    },
    measures() {
      if (!data.length) return statCard("Count", "0");
      const s = [...data].sort((x, y) => x - y),
        md = median(s),
        mn = mean(data),
        mo = modes(data);
      return (
        statCard("Count", data.length) +
        statCard("Min", num(s[0])) +
        statCard("Max", num(s[s.length - 1])) +
        statCard("Range", num(s[s.length - 1] - s[0])) +
        statCard("Mean", num(mn), true) +
        statCard("Median", num(md), true) +
        statCard("Mode", mo.length ? mo.map(num).join(", ") : "none")
      );
    },
    bind(plot, state, api) {
      const svg = plot.querySelector("svg");
      if (!svg) return;
      svg.querySelectorAll("[data-v]").forEach((c) =>
        c.addEventListener("click", (e) => {
          const v = Number(c.dataset.v);
          if (state.whatif) {
            // Tapping a dot removes it; stop the event so the svg-level
            // add-handler below does not immediately re-add one at the same spot.
            const i = data.indexOf(v);
            if (i >= 0) data.splice(i, 1);
            e.stopPropagation();
            api.repaint();
          } else {
            const n = data.filter((x) => x === v).length;
            api.say(`The value ${num(v)} appears ${n} time${n === 1 ? "" : "s"}.`);
            e.stopPropagation();
          }
        }),
      );
      if (state.whatif)
        svg.addEventListener("click", (e) => {
          const { a, b, xOf } = scale(),
            pt = svg.getBoundingClientRect();
          const vx =
            a + ((((e.clientX - pt.left) / pt.width) * W - padL) / (W - padL - padR)) * (b - a);
          const v = Math.round(vx);
          if (v >= a && v <= b) {
            data.push(v);
            api.repaint();
          }
        });
    },
  });
}

// ── HISTOGRAM & BAR CHART (shared bar controller) ─────────────────────────────
function barFigure(host, cfg, opts) {
  const orig = (cfg.bars || []).map((b) => ({ label: b.label ?? "", value: Number(b.value) || 0 }));
  let bars = orig.map((b) => ({ ...b }));
  let focus = 0;
  const touching = opts.touching; // histogram bars touch; bar-chart bars have gaps
  const W = 520,
    H = 262,
    padL = 40,
    padR = 16,
    padT = 26,
    padB = 52;
  const plotW = W - padL - padR,
    plotH = H - padT - padB,
    baseY = padT + plotH;
  return shell(host, cfg, {
    defaultTitle: opts.title,
    editable: true,
    exploreHint: opts.exploreHint,
    editHint: "Choose a bar, then use ▲ ▼ to change its value.",
    reset() {
      bars = orig.map((b) => ({ ...b }));
      focus = 0;
    },
    svg(state) {
      const maxV = Math.max(...bars.map((b) => b.value), 1);
      const slot = plotW / bars.length,
        bw = touching ? slot - 1 : slot * 0.6;
      const rects = bars
        .map((b, i) => {
          const h = (b.value / maxV) * plotH,
            x = padL + i * slot + (touching ? 0 : (slot - bw) / 2),
            y = baseY - h;
          const on = state.whatif && i === focus;
          const fill = on ? "var(--coral,#d9795d)" : "var(--teal,#2a9d8f)";
          return (
            `<rect data-hit data-i="${i}" data-on="${on ? 1 : 0}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}"${touching ? ' stroke="#fff" stroke-width="1"' : ' rx="3"'} fill="${fill}"/>` +
            `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--navy,#264653)">${b.value}</text>` +
            `<text x="${(x + bw / 2).toFixed(1)}" y="${(baseY + 18).toFixed(1)}" text-anchor="middle" font-size="11" fill="var(--ink,#333)">${esc(b.label)}</text>`
          );
        })
        .join("");
      const yl = cfg.yLabel
        ? `<text x="13" y="${(padT + plotH / 2).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--muted)" transform="rotate(-90 13 ${(padT + plotH / 2).toFixed(1)})">${esc(cfg.yLabel)}</text>`
        : "";
      const xl = cfg.xLabel
        ? `<text x="${(padL + plotW / 2).toFixed(1)}" y="${H - 4}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--muted)">${esc(cfg.xLabel)}</text>`
        : "";
      return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Interactive ${opts.title.toLowerCase()}"><line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" stroke="var(--ink,#333)" stroke-width="1.5"/>${rects}${xl}${yl}</svg>`;
    },
    measures() {
      return opts.measures(bars);
    },
    renderNudge(nudge, state, api) {
      if (!state.whatif) {
        nudge.innerHTML = "";
        return;
      }
      nudge.innerHTML = `<span class="lab">${esc(bars[focus]?.label || "bar")}: ${bars[focus]?.value ?? 0}</span><button type="button" data-d="up" aria-label="Increase">▲</button><button type="button" data-d="dn" aria-label="Decrease">▼</button>`;
      nudge.querySelector('[data-d="up"]').onclick = () => {
        bars[focus].value += 1;
        api.repaint();
      };
      nudge.querySelector('[data-d="dn"]').onclick = () => {
        bars[focus].value = Math.max(0, bars[focus].value - 1);
        api.repaint();
      };
    },
    bind(plot, state, api) {
      plot.querySelectorAll("[data-i]").forEach((r) =>
        r.addEventListener("click", () => {
          const i = Number(r.dataset.i);
          if (state.whatif) {
            focus = i;
            api.repaint();
          } else api.say(opts.readOne(bars, i));
        }),
      );
    },
  });
}

function histogram(host, cfg) {
  return barFigure(host, cfg, {
    title: "Histogram",
    touching: true,
    exploreHint: "Tap an interval to read its frequency. Reveal the math to name the shape.",
    readOne: (bars, i) =>
      `The interval ${bars[i].label || "#" + (i + 1)} has a frequency of ${bars[i].value}.`,
    measures(bars) {
      const total = bars.reduce((a, b) => a + b.value, 0);
      const maxV = Math.max(...bars.map((b) => b.value), 0);
      const modal = bars
        .filter((b) => b.value === maxV && maxV > 0)
        .map((b) => b.label)
        .join(", ");
      // simple shape heuristic from the sequence of frequencies
      const vals = bars.map((b) => b.value),
        peak = vals.indexOf(maxV),
        mid = (vals.length - 1) / 2;
      const allEq = vals.every((v) => v === vals[0]);
      const shape = allEq
        ? "uniform"
        : peak < mid - 0.5
          ? "skewed right"
          : peak > mid + 0.5
            ? "skewed left"
            : "roughly symmetric";
      return (
        statCard("Total", total) +
        statCard("Intervals", bars.length) +
        statCard("Modal interval", modal || "—", true) +
        statCard("Shape", shape, true)
      );
    },
  });
}

function barChart(host, cfg) {
  return barFigure(host, cfg, {
    title: "Bar chart",
    touching: false,
    exploreHint: "Tap a bar to read its value and compare categories.",
    readOne: (bars, i) => `${bars[i].label || "That category"}: ${bars[i].value}.`,
    measures(bars) {
      if (!bars.length) return statCard("Total", "0");
      const total = bars.reduce((a, b) => a + b.value, 0);
      const maxB = bars.reduce((a, b) => (b.value > a.value ? b : a));
      const minB = bars.reduce((a, b) => (b.value < a.value ? b : a));
      return (
        statCard("Total", total) +
        statCard("Greatest", `${esc(maxB.label)} (${maxB.value})`, true) +
        statCard("Least", `${esc(minB.label)} (${minB.value})`) +
        `<div class="dlive-stat" style="grid-column:1/-1"><span>These are categories, so a mean or median has no meaning — that is what makes this a bar chart, not a histogram.</span></div>`
      );
    },
  });
}

// ── BOX PLOT ──────────────────────────────────────────────────────────────────
function boxPlot(host, cfg) {
  const KEYS = ["min", "q1", "median", "q3", "max"];
  const orig = {};
  KEYS.forEach((k) => (orig[k] = Number(cfg[k])));
  if (KEYS.some((k) => isNaN(orig[k]))) {
    host.textContent = "";
    return null;
  }
  let fn = { ...orig },
    sel = 2;
  const W = 520,
    H = 180,
    padL = 30,
    padR = 20,
    midY = 78,
    boxH = 52;
  const axisLo = () => (cfg.axisMin != null ? Number(cfg.axisMin) : orig.min);
  const axisHi = () => (cfg.axisMax != null ? Number(cfg.axisMax) : orig.max);
  const xOf = (v) => padL + ((v - axisLo()) / Math.max(1, axisHi() - axisLo())) * (W - padL - padR);
  return shell(host, cfg, {
    defaultTitle: "Box plot",
    editable: true,
    exploreHint:
      "Tap the box or a whisker to read what it shows. Reveal the math for the IQR and range.",
    editHint: "Choose a handle, then nudge it with ◀ ▶. Order stays min ≤ Q1 ≤ median ≤ Q3 ≤ max.",
    reset() {
      fn = { ...orig };
      sel = 2;
    },
    svg(state) {
      const top = midY - boxH / 2,
        bot = midY + boxH / 2,
        teal = "var(--teal,#2a9d8f)";
      const region = (id, x1, x2, tip) =>
        `<rect data-hit data-r="${id}" x="${Math.min(x1, x2).toFixed(1)}" y="${top - 8}" width="${Math.abs(x2 - x1).toFixed(1)}" height="${boxH + 16}" fill="transparent"><title>${esc(tip)}</title></rect>`;
      const handles = KEYS.map((k, i) => {
        const on = state.whatif && i === sel;
        return `<circle data-hit data-h="${i}" cx="${xOf(fn[k]).toFixed(1)}" cy="${midY}" r="${on ? 8 : 5}" fill="${on ? "var(--coral,#d9795d)" : "#fff"}" stroke="${k === "median" ? "var(--coral,#d9795d)" : "var(--navy,#264653)"}" stroke-width="2"/>`;
      }).join("");
      const labels = [
        ["min", "Min"],
        ["q1", "Q1"],
        ["median", "Med"],
        ["q3", "Q3"],
        ["max", "Max"],
      ]
        .map(
          ([k, t]) =>
            `<text x="${xOf(fn[k]).toFixed(1)}" y="${bot + 22}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--navy,#264653)">${num(fn[k])}</text><text x="${xOf(fn[k]).toFixed(1)}" y="${top - 12}" text-anchor="middle" font-size="9" fill="var(--muted)">${t}</text>`,
        )
        .join("");
      return (
        `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Interactive box plot">` +
        `<line x1="${xOf(fn.min)}" y1="${midY}" x2="${xOf(fn.q1)}" y2="${midY}" stroke="var(--ink,#333)" stroke-width="2"/>` +
        `<line x1="${xOf(fn.q3)}" y1="${midY}" x2="${xOf(fn.max)}" y2="${midY}" stroke="var(--ink,#333)" stroke-width="2"/>` +
        `<line x1="${xOf(fn.min)}" y1="${top + 8}" x2="${xOf(fn.min)}" y2="${bot - 8}" stroke="var(--ink,#333)" stroke-width="2"/>` +
        `<line x1="${xOf(fn.max)}" y1="${top + 8}" x2="${xOf(fn.max)}" y2="${bot - 8}" stroke="var(--ink,#333)" stroke-width="2"/>` +
        `<rect x="${xOf(fn.q1)}" y="${top}" width="${(xOf(fn.q3) - xOf(fn.q1)).toFixed(1)}" height="${boxH}" fill="${teal}" fill-opacity="0.22" stroke="${teal}" stroke-width="2"/>` +
        `<line x1="${xOf(fn.median)}" y1="${top}" x2="${xOf(fn.median)}" y2="${bot}" stroke="var(--coral,#d9795d)" stroke-width="3"/>` +
        region(
          "whisker-l",
          xOf(fn.min),
          xOf(fn.q1),
          `Lower whisker: the bottom 25% of the data, from ${num(fn.min)} to ${num(fn.q1)}.`,
        ) +
        region(
          "box",
          xOf(fn.q1),
          xOf(fn.q3),
          `The box holds the middle 50% of the data, from Q1 ${num(fn.q1)} to Q3 ${num(fn.q3)}.`,
        ) +
        region(
          "whisker-r",
          xOf(fn.q3),
          xOf(fn.max),
          `Upper whisker: the top 25% of the data, from ${num(fn.q3)} to ${num(fn.max)}.`,
        ) +
        `${handles}${labels}</svg>`
      );
    },
    measures() {
      return (
        statCard("Min", num(fn.min)) +
        statCard("Q1", num(fn.q1)) +
        statCard("Median", num(fn.median), true) +
        statCard("Q3", num(fn.q3)) +
        statCard("Max", num(fn.max)) +
        statCard("IQR", num(fn.q3 - fn.q1), true) +
        statCard("Range", num(fn.max - fn.min))
      );
    },
    renderNudge(nudge, state, api) {
      if (!state.whatif) {
        nudge.innerHTML = "";
        return;
      }
      nudge.innerHTML = `<span class="lab">${KEYS[sel]}: ${num(fn[KEYS[sel]])}</span><button type="button" data-d="dn" aria-label="Decrease">◀</button><button type="button" data-d="up" aria-label="Increase">▶</button>`;
      const step = () => {
        const sp = axisHi() - axisLo();
        return sp <= 20 ? 1 : Math.max(1, Math.round(sp / 20));
      };
      const nudgeBy = (d) => {
        const k = KEYS[sel];
        let v = fn[k] + d * step();
        const lower = sel > 0 ? fn[KEYS[sel - 1]] : axisLo();
        const upper = sel < 4 ? fn[KEYS[sel + 1]] : axisHi();
        fn[k] = Math.max(lower, Math.min(upper, v));
        api.repaint();
      };
      nudge.querySelector('[data-d="up"]').onclick = () => nudgeBy(1);
      nudge.querySelector('[data-d="dn"]').onclick = () => nudgeBy(-1);
    },
    bind(plot, state, api) {
      const svg = plot.querySelector("svg");
      if (!svg) return;
      svg.querySelectorAll("[data-h]").forEach((h) =>
        h.addEventListener("click", () => {
          if (state.whatif) {
            sel = Number(h.dataset.h);
            api.repaint();
          }
        }),
      );
      if (!state.whatif)
        svg.querySelectorAll("[data-r]").forEach((r) =>
          r.addEventListener("click", () => {
            const t = r.querySelector("title");
            if (t) api.say(t.textContent);
          }),
        );
    },
  });
}

export function renderDataLive(host, cfg = {}) {
  try {
    switch (cfg.kind) {
      case "dot-plot":
        return dotPlot(host, cfg);
      case "histogram":
        return histogram(host, cfg);
      case "bar-chart":
        return barChart(host, cfg);
      case "box-plot":
        return boxPlot(host, cfg);
      default:
        return null;
    }
  } catch (e) {
    console.warn("data-live: render failed", e);
    return null;
  }
}

export default renderDataLive;
