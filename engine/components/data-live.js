import { pickLang } from "../core/i18n.js";

// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
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

// Data-encoding colours for the figures below.
//
// These are deliberately NOT the theme tokens. `.sg-lab` remaps the generic
// palette onto the small-group accent (--teal becomes var(--sg), --navy becomes
// var(--sg-deep)), which is right for chrome and wrong for data: inside a
// small-group lesson every bar, dot and box rendered in the same navy, and a
// tape diagram's first and last segment colours collapsed into two shades of
// one blue, so the parts stopped being tellable apart. Colour here encodes
// meaning, so it is fixed, and picked to clear 3:1 on white for graphical
// objects.
const DATA_1 = "#0f8a84"; // teal - primary series
const DATA_2 = "#c2603f"; // clay - second series
const _DATA_3 = "#b07d12"; // ochre - third series (reserved; documents the palette)
const DATA_4 = "#3b6ea5"; // blue - fourth series

const STYLE_ID = "data-live-styles";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
  .dlive{color-scheme:light;--dl-teal:${DATA_1};--dl-coral:${DATA_2};--dl-navy:var(--navy,#264653);--dl-ink:var(--ink,#333);--dl-muted:var(--muted,#6b7280);
    border:1px solid rgba(38,70,83,.14);border-radius:14px;padding:14px 14px 12px;margin:var(--sp-3,12px) 0;background:linear-gradient(180deg,#fff, #fbfdfc);box-shadow:0 1px 3px rgba(38,70,83,.06)}
  .dlive-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}
  .dlive-title{font-weight:700;color:var(--dl-navy);font-size:1rem}
  .dlive-badge{font-size:.68rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--dl-teal);border:1px solid currentColor;border-radius:999px;padding:2px 8px}
  .dlive-plot{position:relative}
  .dlive-plot svg{width:100%;height:auto;max-width:560px;display:block;margin:0 auto;touch-action:manipulation}
  .dlive [data-hit]{cursor:pointer}
  .dlive [data-hit]:hover,.dlive [data-hit][data-on="1"]{filter:brightness(1.06)}
  .dlive-tools{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 2px;align-items:center}
  .dlive-btn{font:inherit;font-size:.82rem;font-weight:600;color:var(--dl-navy);background:#fff;border:1.5px solid rgba(38,70,83,.22);border-radius:999px;padding:6px 12px;cursor:pointer;transition:.15s}
  .dlive-btn:hover{border-color:var(--dl-teal);color:var(--dl-teal)}
  .dlive-btn[aria-pressed="true"]{background:var(--dl-teal);border-color:var(--dl-teal);color:#fff}
  .dlive-btn.ghost{border-style:dashed}
  .dlive-nudge{display:inline-flex;gap:4px;align-items:center;margin-left:auto;flex-wrap:wrap}
  .dlive-nudge button{font:inherit;font-weight:700;width:34px;height:34px;border-radius:9px;border:1.5px solid rgba(38,70,83,.22);background:#fff;color:var(--dl-navy);cursor:pointer}
  .dlive-nudge button:hover{border-color:var(--dl-teal);color:var(--dl-teal)}
  .dlive-nudge .lab{font-size:.78rem;color:var(--dl-muted);font-weight:600;margin-right:2px}
  .dlive-measures{display:none;grid-template-columns:repeat(auto-fit,minmax(84px,1fr));gap:8px;margin-top:10px}
  .dlive.show-m .dlive-measures{display:grid}
  .dlive-stat{background:#fff;border:1px solid rgba(38,70,83,.14);border-radius:10px;padding:7px 9px;text-align:center}
  .dlive-stat b{display:block;font-size:1.12rem;color:var(--dl-navy);line-height:1.1}
  .dlive-stat span{font-size:.68rem;color:var(--dl-muted);font-weight:600;text-transform:uppercase;letter-spacing:.03em}
  .dlive-stat.hi b{color:var(--dl-coral)}
  .dlive-note{margin-top:9px;font-size:.86rem;color:var(--dl-ink);background:rgba(42,157,143,.08);border-left:3px solid var(--dl-teal);border-radius:0 8px 8px 0;padding:7px 10px;min-height:1.2em}
  .dlive-note:empty{display:none}
`;
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
/**
 * Mean absolute deviation — the average distance of the data from its own mean.
 *
 * 6.SP.B.5c asks students to describe variability, and MAD is the measure the
 * standard names. It was the one statistic this lab could not show, which left
 * the What-if sandbox able to demonstrate that moving a point changes the mean
 * while silently unable to demonstrate the more interesting fact: that moving a
 * point AWAY from the mean changes the typical distance far more than it moves
 * the centre.
 */
function mad(v) {
  if (!v.length) return 0;
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  return v.reduce((a, b) => a + Math.abs(b - m), 0) / v.length;
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
  const state = { whatif: false, revealed: false, note: "", lastSummary: null };

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
    /* Repaint, and when the student is editing data, say what the edit did to
     * the centre and to the spread. The instructional point of a dot-plot
     * sandbox is that moving a value AWAY from the mean barely shifts the
     * centre but moves MAD a lot — and that is invisible if the numbers simply
     * change while the student is looking at the dots. */
    /* Repaint, and when the student is editing data, say what the edit did to
     * the centre and to the spread. The instructional point of a dot-plot
     * sandbox is that moving a value AWAY from the mean barely shifts the
     * centre but moves MAD a lot — and that is invisible if the numbers simply
     * change while the student is looking at the dots.
     *
     * The comparison is against the LAST PAINTED summary, not one snapshotted
     * at the top of this function: the controllers mutate their data array and
     * then call repaint(), so a snapshot taken here is already the new value
     * and every edit reported "nothing changed". */
    repaint() {
      const before = state.lastSummary;
      paint();
      const after = ctrl.summary?.() || null;
      state.lastSummary = after;
      if (!state.whatif || !before || !after) return;
      const moved = (a, b) => Math.abs(a - b) > 1e-9;
      const bits = [];
      if (moved(before.mean, after.mean))
        bits.push(`mean ${num(before.mean)} → ${num(after.mean)}`);
      if (moved(before.median, after.median))
        bits.push(`median ${num(before.median)} → ${num(after.median)}`);
      if (moved(before.mad, after.mad)) bits.push(`MAD ${num(before.mad)} → ${num(after.mad)}`);
      if (!bits.length) {
        api.say("The data changed, but the mean, median and MAD all stayed the same.");
        return;
      }
      const spread =
        moved(before.mad, after.mad) && !moved(before.median, after.median)
          ? " The typical distance from the mean changed while the middle value did not."
          : "";
      api.say(`${bits.join(" · ")}.${spread}`);
    },
    state,
  };

  state.lastSummary = ctrl.summary?.() || null;

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
function dotPlot(host, cfg, viewOpts) {
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
    editable: viewOpts?.sandbox !== false,
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
          return `<circle data-hit data-v="${v}" cx="${xOf(v).toFixed(1)}" cy="${cy.toFixed(1)}" r="6.5" fill="${DATA_1}" stroke="#fff" stroke-width="1.5"/>`;
        })
        .join("");
      let overlay = "";
      if (state.revealed && data.length) {
        const mn = mean(data),
          md = median([...data].sort((x, y) => x - y));
        overlay =
          `<line x1="${xOf(md).toFixed(1)}" y1="26" x2="${xOf(md).toFixed(1)}" y2="${baseY}" stroke="${DATA_2}" stroke-width="2.5" stroke-dasharray="4 3"/>` +
          `<text x="${xOf(md).toFixed(1)}" y="20" text-anchor="middle" font-size="10.5" font-weight="800" fill="${DATA_2}">median ${num(md)}</text>` +
          `<path d="M${xOf(mn).toFixed(1)},${baseY - 2} l-7,12 l14,0 z" fill="${DATA_4}"/>` +
          `<text x="${xOf(mn).toFixed(1)}" y="${baseY + 34}" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--navy,#264653)">mean ${num(mn)}</text>`;
      }
      const xLabel = cfg.xLabel
        ? `<text x="${(W / 2).toFixed(1)}" y="${H - 4}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--muted)">${esc(pickLang(cfg.xLabel, cfg.xLabelEs))}</text>`
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
        statCard("MAD", num(mad(data)), true) +
        statCard("Mode", mo.length ? mo.map(num).join(", ") : "none")
      );
    },
    /* The three numbers the What-if sandbox exists to move. Exposed so the
     * repaint wrapper can report what a student's edit actually DID, rather
     * than silently redrawing and leaving them to spot the difference across
     * six stat cards. Only the numeric plots implement this; a bar chart of
     * categories has no mean to report. */
    summary() {
      if (!data.length) return null;
      return { mean: mean(data), median: median([...data].sort((x, y) => x - y)), mad: mad(data) };
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
          const { a, b } = scale(),
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
    editable: opts.sandbox !== false,
    exploreHint: opts.exploreHint,
    editHint: "Choose a bar, then use ▲ ▼ to change its value.",
    reset() {
      bars = orig.map((b) => ({ ...b }));
      focus = 0;
    },
    svg(state) {
      // Signed domain. Unit 7 plots depths below sea level, and anchoring the
      // baseline to the bottom of the plot turned every negative bar into a
      // <rect height="-214.7"> — invalid, so the browser drew nothing and the
      // bar the caption asks about was simply missing. Zero always sits inside
      // the domain, and each bar grows from the zero line in its own direction.
      const minV = Math.min(0, ...bars.map((b) => b.value));
      const signed = minV < 0;
      // All-positive charts keep the original domain exactly — including the
      // `, 1` floor, without which a chart of fractions below 1 would rescale.
      const maxV = signed
        ? Math.max(0, ...bars.map((b) => b.value))
        : Math.max(...bars.map((b) => b.value), 1);
      const span = maxV - minV || 1;
      const yOf = (v) => padT + (plotH * (maxV - v)) / span;
      const zeroY = signed ? yOf(0) : baseY;
      const scale = (v) => (signed ? yOf(v) : baseY - (v / maxV) * plotH);
      const slot = plotW / bars.length,
        bw = touching ? slot - 1 : slot * 0.6;
      const rects = bars
        .map((b, i) => {
          const vy = scale(b.value),
            y = Math.min(vy, zeroY),
            h = Math.abs(vy - zeroY),
            x = padL + i * slot + (touching ? 0 : (slot - bw) / 2);
          const on = state.whatif && i === focus;
          const fill = on ? DATA_2 : DATA_1;
          const valY = b.value < 0 ? vy + 15 : vy - 6;
          return (
            `<rect data-hit data-i="${i}" data-on="${on ? 1 : 0}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}"${touching ? ' stroke="#fff" stroke-width="1"' : ' rx="3"'} fill="${fill}"/>` +
            `<text x="${(x + bw / 2).toFixed(1)}" y="${valY.toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--navy,#264653)">${b.value}</text>` +
            `<text x="${(x + bw / 2).toFixed(1)}" y="${(baseY + (signed ? 32 : 18)).toFixed(1)}" text-anchor="middle" font-size="11" fill="var(--ink,#333)">${esc(b.label)}</text>`
          );
        })
        .join("");
      const zeroTick = signed
        ? `<text x="${padL - 6}" y="${(zeroY + 4).toFixed(1)}" text-anchor="end" font-size="11" font-weight="700" fill="var(--ink,#333)">0</text>`
        : "";
      const yl = cfg.yLabel
        ? `<text x="13" y="${(padT + plotH / 2).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--muted)" transform="rotate(-90 13 ${(padT + plotH / 2).toFixed(1)})">${esc(pickLang(cfg.yLabel, cfg.yLabelEs))}</text>`
        : "";
      const xl = cfg.xLabel
        ? `<text x="${(padL + plotW / 2).toFixed(1)}" y="${H - 4}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--muted)">${esc(pickLang(cfg.xLabel, cfg.xLabelEs))}</text>`
        : "";
      return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Interactive ${opts.title.toLowerCase()}"><line x1="${padL}" y1="${zeroY.toFixed(1)}" x2="${W - padR}" y2="${zeroY.toFixed(1)}" stroke="var(--ink,#333)" stroke-width="1.5"/>${zeroTick}${rects}${xl}${yl}</svg>`;
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
        // Histogram frequencies floor at 0; a signed bar chart may legitimately
        // go below it (Unit 7 plots depths), so only clamp the counting case.
        const floored = touching || bars.every((b) => b.value >= 0);
        bars[focus].value = floored ? Math.max(0, bars[focus].value - 1) : bars[focus].value - 1;
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

function histogram(host, cfg, viewOpts) {
  return barFigure(host, cfg, {
    title: "Histogram",
    touching: true,
    sandbox: viewOpts?.sandbox,
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

function barChart(host, cfg, viewOpts) {
  return barFigure(host, cfg, {
    title: "Bar chart",
    touching: false,
    sandbox: viewOpts?.sandbox,
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
        statCard("Least", `${esc(minB.label)} (${minB.value})`)
      );
    },
  });
}

// ── BOX PLOT ──────────────────────────────────────────────────────────────────
function boxPlot(host, cfg, viewOpts) {
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
    editable: viewOpts?.sandbox !== false,
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
        teal = DATA_1;
      const region = (id, x1, x2, tip) =>
        `<rect data-hit data-r="${id}" x="${Math.min(x1, x2).toFixed(1)}" y="${top - 8}" width="${Math.abs(x2 - x1).toFixed(1)}" height="${boxH + 16}" fill="transparent"><title>${esc(tip)}</title></rect>`;
      const handles = KEYS.map((k, i) => {
        const on = state.whatif && i === sel;
        return `<circle data-hit data-h="${i}" cx="${xOf(fn[k]).toFixed(1)}" cy="${midY}" r="${on ? 8 : 5}" fill="${on ? DATA_2 : "#fff"}" stroke="${k === "median" ? DATA_2 : "var(--navy,#264653)"}" stroke-width="2"/>`;
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
        `<line x1="${xOf(fn.median)}" y1="${top}" x2="${xOf(fn.median)}" y2="${bot}" stroke="${DATA_2}" stroke-width="3"/>` +
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

// Normalize the small-group practice authoring shapes onto the shapes the
// figure builders expect, so the SAME widget serves both surfaces:
//   • `data-dots` is a dot plot authored with `values`.
//   • SG `histogram` authors interval frequencies as `values:[…]` (no `bars`);
//     turn each into a numbered interval bar.
//   • SG `box-plot` may carry raw `values` instead of a five-number summary.
function normalize(cfg) {
  const kind = String(cfg.kind || "");
  if (kind === "data-dots") return { ...cfg, kind: "dot-plot" };
  if (kind === "histogram" && !Array.isArray(cfg.bars) && Array.isArray(cfg.values)) {
    return {
      ...cfg,
      bars: cfg.values.map((v, i) => ({ label: String(i + 1), value: Number(v) || 0 })),
    };
  }
  if (
    kind === "box-plot" &&
    Array.isArray(cfg.values) &&
    ["min", "q1", "median", "q3", "max"].some((k) => cfg[k] == null)
  ) {
    const nums = cfg.values.map(Number).filter((n) => !isNaN(n));
    if (nums.length) return { ...cfg, ...fiveNum(nums) };
  }
  return cfg;
}

export function renderDataLive(host, cfg = {}, opts = {}) {
  try {
    const v = normalize(cfg);
    switch (v.kind) {
      case "dot-plot":
        return dotPlot(host, v, opts);
      case "histogram":
        return histogram(host, v, opts);
      case "bar-chart":
        return barChart(host, v, opts);
      case "box-plot":
        return boxPlot(host, v, opts);
      default:
        return null;
    }
  } catch (e) {
    console.warn("data-live: render failed", e);
    return null;
  }
}

export default renderDataLive;
