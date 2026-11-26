// living/data-bins.js — a dot plot becomes a histogram.
//
// One cast for the whole play: a dot for every value. The dots start on a number
// line (scene 1), the student predicts how tall one interval's bar will be (scene
// 2), then the SAME dots drop into equal intervals and stack into touching bars
// (scene 3). In scene 4 the student changes the interval width and the bars
// regroup while the data stays exactly the same. Scene 5 reads a new histogram.
//
// Config: { values:[...], start, widths:[2-3 widths], binWidth, askBin, unit,
//           story:{en,es}, transfer:{ values, start, binWidth, askBin, story } }
// Anything the stage cannot draw makes the play refuse (null).

import { escHtml } from "../../core/living-scene.js";
import { stackIndex } from "./box-build-model.js";
import {
  binOf,
  binsFor,
  dataBinsCopy,
  fmtNum,
  heightChoices,
  MAX_BINS,
  placeCorrect,
  sum,
  validateDataBins,
} from "./data-bins-model.js";

export { validateDataBins };

const W = 480;
const H = 316;
const PX0 = 36;
const PX1 = 444;
const Y0 = 250;
const PLOT_H = 160;

const BAR = { fill: "var(--lsx-ok-bg)", stroke: "var(--lsx-x-edge)", "stroke-width": 2.5 };
const BAR_HI = { fill: "var(--lsx-cue-bg)", stroke: "var(--lsx-u-edge)", "stroke-width": 4 };

export function buildDataBinsPlay(cfg) {
  const v = validateDataBins(cfg);
  if (!v) return null;
  const T = dataBinsCopy(v);
  const { main: M, xfer: X } = v;
  const P = Math.max(M.values.length, X.values.length);
  const NB = MAX_BINS;
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;

  let c = null;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const g = svgEl("g", {}, svg);
    const text = (attrs) =>
      svgEl(
        "text",
        {
          "text-anchor": "middle",
          "font-size": 14,
          "font-weight": 800,
          fill: "var(--lsx-ink)",
          opacity: 0,
          ...attrs,
        },
        g,
      );
    const bars = Array.from({ length: NB }, () =>
      svgEl("rect", { x: PX0, y: Y0, width: 0, height: 0, opacity: 0, ...BAR }, g),
    );
    const cue = svgEl(
      "rect",
      {
        x: PX0,
        y: Y0 - 124,
        width: 0,
        height: 128,
        rx: 6,
        fill: "none",
        stroke: "var(--lsx-lo)",
        "stroke-width": 3,
        "stroke-dasharray": "7 5",
        opacity: 0,
      },
      g,
    );
    const bounds = Array.from({ length: NB + 1 }, () =>
      svgEl(
        "line",
        {
          x1: PX0,
          x2: PX0,
          y1: Y0 - 120,
          y2: Y0 + 4,
          stroke: "var(--lsx-muted)",
          "stroke-width": 2,
          "stroke-dasharray": "6 5",
          opacity: 0,
        },
        g,
      ),
    );
    svgEl(
      "line",
      { x1: PX0 - 6, x2: PX1 + 6, y1: Y0, y2: Y0, stroke: "var(--lsx-ink)", "stroke-width": 2 },
      g,
    );
    const ticks = svgEl("g", {}, g);
    const dots = Array.from({ length: P }, () =>
      svgEl(
        "rect",
        {
          x: PX0,
          y: Y0 - 12,
          width: 10,
          height: 10,
          rx: 5,
          opacity: 0,
          fill: "var(--lsx-x)",
          stroke: "var(--lsx-x-edge)",
          "stroke-width": 2,
        },
        g,
      ),
    );
    c = {
      bars,
      cue,
      bounds,
      ticks,
      dots,
      counts: Array.from({ length: NB }, () => text({ "font-size": 18 })),
      labels: Array.from({ length: NB }, () =>
        text({ fill: "var(--lsx-muted)", "font-size": 15, "font-weight": 700 }),
      ),
      svgEl,
    };
  }

  /**
   * One state for the whole stage. o: { set, w, mode "dots"|"hist", cells,
   * counts, cue (bin index), hiBar (bin index) }
   */
  function view(ctx, o, ms) {
    const { set, w } = o;
    const { values, start, end } = set;
    const unit = (PX1 - PX0) / (end - start);
    const bins = binsFor(values, start, end, w);
    const hist = o.mode === "hist";
    const cellH = Math.min(22, PLOT_H / set.maxFreq);
    const Dd = Math.min(14, unit - 1.5);
    const Di = Math.min(16, cellH - 3);
    const stack = stackIndex(values);
    const binW = w * unit;
    const seen = new Map();
    const m = [];
    c.dots.forEach((d, i) => {
      if (i >= values.length) {
        m.push([d, { opacity: 0 }]);
        return;
      }
      if (hist) {
        const b = binOf(values[i], start, w);
        const r = seen.get(b) || 0;
        seen.set(b, r + 1);
        m.push([
          d,
          {
            x: PX0 + (b + 0.5) * binW - Di / 2,
            y: Y0 - (r + 1) * cellH + (cellH - Di) / 2,
            width: Di,
            height: Di,
            rx: Di / 2,
            opacity: 1,
          },
        ]);
      } else {
        m.push([
          d,
          {
            x: PX0 + (values[i] - start + 0.5) * unit - Dd / 2,
            y: Y0 - Dd - 2 - stack[i] * (Dd + 1),
            width: Dd,
            height: Dd,
            rx: Dd / 2,
            opacity: 1,
          },
        ]);
      }
    });
    c.bars.forEach((b, j) => {
      const bin = bins[j];
      if (!bin) {
        m.push([b, { opacity: 0, width: 0, height: 0 }]);
        return;
      }
      const look = o.hiBar === j ? BAR_HI : BAR;
      m.push([
        b,
        {
          x: PX0 + j * binW,
          y: Y0 - bin.count * cellH,
          width: binW,
          height: bin.count * cellH,
          opacity: hist && bin.count > 0 ? 1 : 0,
          ...look,
        },
      ]);
    });
    c.counts.forEach((t, j) => {
      const bin = bins[j];
      if (!bin) {
        m.push([t, { opacity: 0 }]);
        return;
      }
      t.textContent = String(bin.count);
      m.push([
        t,
        {
          x: PX0 + (j + 0.5) * binW,
          y: Y0 - bin.count * cellH - 7,
          opacity: hist && o.counts ? 1 : 0,
        },
      ]);
    });
    c.labels.forEach((t, j) => {
      const bin = bins[j];
      if (!bin) {
        m.push([t, { opacity: 0 }]);
        return;
      }
      t.textContent = bin.label;
      const on = hist || o.cells;
      m.push([t, { x: PX0 + (j + 0.5) * binW, y: hist ? Y0 + 24 : Y0 + 46, opacity: on ? 1 : 0 }]);
    });
    c.bounds.forEach((l, j) => {
      const x = PX0 + j * binW;
      l.setAttribute("x2", String(x));
      m.push([l, { x1: x, x2: x, opacity: !hist && o.cells && j <= bins.length ? 1 : 0 }]);
    });
    c.cue.setAttribute("x", String(PX0 + (o.cue ?? 0) * binW));
    m.push([c.cue, { width: binW, opacity: o.cue != null ? 1 : 0 }]);
    // Dots-only scenes crop the empty space above the number line.
    const top = o.top ?? 68;
    ctx.svg.setAttribute("viewBox", `0 ${top} ${W} ${H - top}`);
    c.ticks.innerHTML = "";
    const step = end - start > 60 ? 10 : 5;
    for (let t = start; t < end; t += step) {
      c.svgEl(
        "text",
        {
          x: PX0 + (t - start + 0.5) * unit,
          y: Y0 + 22,
          "text-anchor": "middle",
          "font-size": 15,
          fill: "var(--lsx-muted)",
          text: String(t),
        },
        c.ticks,
      );
    }
    m.push([c.ticks, { opacity: hist ? 0 : 1 }]);
    return ctx.tween(m, ms);
  }

  const DOTS_TOP = 112; // dots only: nothing is drawn above the cue box
  const dotsState = (extra) => ({ set: M, w: M.w, mode: "dots", ...extra });
  const histState = (extra) => ({ set: M, w: M.w, mode: "hist", counts: true, ...extra });
  const optionsOf = (set, seed) =>
    placeCorrect(
      heightChoices(set.values, set.start, set.end, set.w, set.ask).map((o) => ({
        ...o,
        label: fmtNum(o.value),
      })),
      seed,
    );

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.expr(escHtml(T.list));
        ctx.say(T.situateSay);
        await view(ctx, dotsState({ top: DOTS_TOP }), 500);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        const ab = binsFor(M.values, M.start, M.end, M.w)[M.ask];
        ctx.expr(escHtml(T.list));
        ctx.say(T.predictSay);
        const shown = view(ctx, dotsState({ cells: true, top: DOTS_TOP }), 300);
        const options = optionsOf(M, sum(M.values) + M.values.length);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.cueHeight(opt, ab.from, ab.to), "cue");
              view(ctx, dotsState({ cells: true, cue: M.ask, top: DOTS_TOP }), 250);
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              view(ctx, dotsState({ cells: true, cue: M.ask, top: DOTS_TOP }), 250);
            },
          }),
        );
        await shown;
      },
    },
    {
      id: "bins",
      label: T.scene.bins,
      async enter(ctx) {
        const fq = binsFor(M.values, M.start, M.end, M.w).map((b) => b.count);
        ctx.say(T.binsSay);
        ctx.expr(hi(T.sumExpr(fq, M.values.length)));
        await view(ctx, dotsState({ cells: true }), 0);
        await view(ctx, histState({ counts: false }), 900);
        await view(ctx, histState({}), 300);
        ctx.feedback(T.binsDone);
      },
    },
    {
      id: "width",
      label: T.scene.width,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        st.w = M.widths.includes(st.w) ? st.w : M.w;
        st.seen = Array.isArray(st.seen)
          ? [...new Set([M.w, ...st.seen.filter((x) => M.widths.includes(x))])]
          : [M.w];
        const btns = M.widths.map((x) => ctx.button({ label: String(x), onClick: () => pick(x) }));
        const paint = (ms) => {
          M.widths.forEach((x, i) => btns[i].setAttribute("aria-pressed", String(x === st.w)));
          const fq = binsFor(M.values, M.start, M.end, st.w).map((b) => b.count);
          ctx.expr(hi(T.sumExpr(fq, M.values.length)));
          return view(ctx, { set: M, w: st.w, mode: "hist", counts: true }, ms);
        };
        const progress = () => {
          if (M.widths.every((x) => st.seen.includes(x))) {
            ctx.feedback(T.widthLesson);
            ctx.unlock();
          } else ctx.feedback(T.widthRow(st.w), "cue");
        };
        function pick(x) {
          st.w = x;
          if (!st.seen.includes(x)) st.seen.push(x);
          ctx.save();
          paint(650).then(progress);
        }
        const how = document.createElement("p");
        how.className = "lsx-q";
        how.textContent = ctx.L(T.widthLabel);
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", ctx.L(T.widthLabel));
        row.append(...btns);
        ctx.panel.append(how, row);
        ctx.say(T.widthSay);
        await view(ctx, histState({}), 0);
        await paint(500);
        progress();
        if (!M.widths.every((x) => st.seen.includes(x))) ctx.feedback(T.tryWidths, "cue");
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        const tb = binsFor(X.values, X.start, X.end, X.w)[X.ask];
        const solved = !!saved.solved;
        const state = (ok) => ({
          set: X,
          w: X.w,
          mode: "hist",
          counts: true,
          hiBar: ok ? X.ask : undefined,
        });
        ctx.expr(escHtml(T.xferList));
        ctx.say(T.transferSay);
        if (solved) ctx.feedback(T.transferOk);
        const shown = view(ctx, state(solved), solved ? 0 : 600);
        const options = optionsOf(X, sum(X.values) + 2 * X.values.length + 1);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.cueHeight(opt, tb.from, tb.to), "cue");
              view(ctx, { ...state(false), cue: X.ask }, 250);
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              await view(ctx, state(true), 400);
            },
          }),
        );
        ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
        await shown;
      },
    },
  ];

  return {
    kicker: T.kicker,
    title: T.title,
    viewBox: `0 0 ${W} ${H}`,
    ariaLabel: T.ariaLabel,
    printSummary: T.printSummary,
    setup,
    scenes,
  };
}
