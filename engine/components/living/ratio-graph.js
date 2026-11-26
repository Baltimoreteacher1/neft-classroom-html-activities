// living/ratio-graph.js — a ratio table becomes points on a line (lesson 3-4).
//
// One cast for the whole play: a ratio table with an ordered-pair column, and
// a coordinate graph. The row of the table that is being read is highlighted,
// its pair (x, y) is written in the third column, and the same row becomes a
// point on the graph — right x first, then up y. A ghost point with two guide
// lines follows the student's two sliders, so the "right then up" walk is
// something they do, not something they read. The points of equal ratios fall
// on one line through (0, 0); a hollow point that is one ounce short is off it.
//
// Config (3-4 authors 2 ounces of sauce per sundae, 1 cup of sugar to 3 cups
// of flour as the transfer): { a, b, labelX, labelY, story, transfer:{…} }.
// Every number and line of text comes from ratio-graph-model.js (pure, tested).

import { escHtml } from "../../core/living-scene.js";
import {
  ASKED_ROW,
  checkPlot,
  H,
  PLOT_ROWS,
  pairChoices,
  placeAway,
  ROWS,
  ratioGraphCopy,
  tickStep,
  validateRatioGraph,
  W,
} from "./ratio-graph-model.js";

export { validateRatioGraph };

const TBL = { x0: 6, cols: [6, 56, 106, 162], top: 50, head: 32, rowH: 40 };
const G = { x0: 198, y0: 236, w: 206, h: 188 };
const TICKS = 8;
const hi = (s) => `<span class="lsx-hi">${escHtml(String(s))}</span>`;
const lo = (s) => `<span class="lsx-lo">${escHtml(String(s))}</span>`;
const pairHtml = (x, y) => `(${hi(x)}, ${lo(y)})`;
const rowY = (i) => TBL.top + TBL.head + i * TBL.rowH;

export function buildRatioGraphPlay(cfg) {
  const v = validateRatioGraph(cfg);
  if (!v) return null;
  const copy = ratioGraphCopy(v);
  const sets = {
    m: { s: v, rows: copy.rows },
    t: { s: v.transfer, rows: copy.trows },
  };
  let cast = null;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs) => svgEl(tag, { opacity: 0, ...attrs }, g);
    const text = (more) =>
      el("text", {
        x: 0,
        y: 0,
        "text-anchor": "middle",
        "font-size": 18,
        "font-weight": 700,
        fill: "var(--lsx-ink)",
        ...more,
      });
    const line = (more) =>
      el("line", {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        stroke: "var(--lsx-ink)",
        "stroke-width": 2,
        ...more,
      });
    const rect = (more) =>
      el("rect", {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        fill: "none",
        stroke: "var(--lsx-ink)",
        "stroke-width": 2,
        ...more,
      });
    const dot = (more) =>
      el("circle", { cx: 0, cy: 0, r: 8, stroke: "var(--lsx-ink)", "stroke-width": 2.5, ...more });
    const guide = { stroke: "var(--lsx-lo)", "stroke-width": 3, "stroke-dasharray": "6 5" };
    cast = {
      bg: rect({ x: TBL.x0, y: TBL.top, rx: 6, fill: "var(--lsx-card)" }),
      vLines: [1, 2].map(() => line({ stroke: "var(--lsx-rule-strong)" })),
      hLines: Array.from({ length: ROWS + 1 }, (_, i) =>
        line({ stroke: i ? "var(--lsx-rule)" : "var(--lsx-ink)" }),
      ),
      legX: text({
        x: TBL.x0,
        y: 18,
        "font-size": 16,
        "text-anchor": "start",
        fill: "var(--lsx-hi)",
      }),
      legY: text({
        x: TBL.x0,
        y: 38,
        "font-size": 16,
        "text-anchor": "start",
        fill: "var(--lsx-lo)",
      }),
      hX: text({ fill: "var(--lsx-hi)" }),
      hY: text({ fill: "var(--lsx-lo)" }),
      hP: text({}),
      cells: Array.from({ length: ROWS }, () => ({
        x: text({ fill: "var(--lsx-hi)" }),
        y: text({ fill: "var(--lsx-lo)" }),
        p: text({ "font-size": 17 }),
      })),
      rowHi: rect({ "stroke-width": 4, rx: 4 }),
      hdrHi: rect({ "stroke-width": 4, rx: 4, "stroke-dasharray": "6 4" }),
      axX: line({ "stroke-width": 3 }),
      axY: line({ "stroke-width": 3 }),
      xt: Array.from({ length: TICKS }, () => ({
        grid: line({ stroke: "var(--lsx-rule)" }),
        num: text({ "font-size": 16, "font-weight": 600 }),
      })),
      yt: Array.from({ length: TICKS }, () => ({
        grid: line({ stroke: "var(--lsx-rule)" }),
        num: text({ "font-size": 16, "font-weight": 600, "text-anchor": "end" }),
      })),
      zero: text({ "font-size": 16, "font-weight": 600, "text-anchor": "end" }),
      titleX: text({ "font-size": 16, fill: "var(--lsx-hi)" }),
      titleY: text({ "font-size": 16, "text-anchor": "start", fill: "var(--lsx-lo)" }),
      eqLine: line({ stroke: "var(--lsx-hi)", "stroke-width": 3.5 }),
      pts: Array.from({ length: ROWS }, () => dot({ fill: "var(--lsx-x)" })),
      off: dot({ fill: "var(--lsx-card)", stroke: "var(--lsx-lo)", "stroke-width": 3.5 }),
      offLbl: text({
        "font-size": 16,
        "text-anchor": "start",
        fill: "var(--lsx-lo)",
        stroke: "var(--lsx-card)",
        "stroke-width": 5,
        "paint-order": "stroke",
      }),
      ghost: dot({ fill: "var(--lsx-card)", stroke: "var(--lsx-lo)", "stroke-dasharray": "3 3" }),
      gH: line(guide),
      gV: line(guide),
    };
  }

  /**
   * One frame of the stage.
   *   set: "m" | "t"; table / graph: show them; pairs: rows (1-based) whose pair is written;
   *   pts: rows plotted; line: the line through (0, 0); off: the hollow point;
   *   rowHi: row to highlight (0 = none); hdrHi: ring the x heading;
   *   ghost: {x, y} follows the sliders; drop: x of a dashed drop line up to the line.
   */
  function frame(
    ctx,
    {
      set = "m",
      table = true,
      pairCol = false,
      graph = false,
      pairs = [],
      pts = [],
      line = false,
      off = false,
      rowHi = 0,
      hdrHi = false,
      ghost = null,
      drop = null,
    },
  ) {
    const { s, rows } = sets[set];
    const xMax = ROWS * s.a;
    const yMax = ROWS * s.b;
    const gx = (x) => G.x0 + (x / xMax) * G.w;
    const gy = (y) => G.y0 - (y / yMax) * G.h;
    const m = [];
    const put = (node, attrs, show) => m.push([node, { ...attrs, opacity: show ? 1 : 0 }]);
    const [c0, c1, c2, c3] = TBL.cols;
    const bottom = rowY(ROWS);
    put(cast.bg, { width: c3 - c0, height: bottom - TBL.top }, table);
    cast.vLines.forEach((l, i) =>
      put(
        l,
        { x1: TBL.cols[i + 1], x2: TBL.cols[i + 1], y1: TBL.top, y2: bottom },
        table && (i === 0 || pairCol),
      ),
    );
    cast.hLines.forEach((l, i) => {
      const y = i === 0 ? TBL.top + TBL.head : rowY(i);
      put(l, { x1: c0, x2: pairCol ? c3 : c2, y1: y, y2: y }, table);
    });
    put(cast.legX, { text: ctx.L({ en: `x = ${s.labelX.en}`, es: `x = ${s.labelX.es}` }) }, table);
    put(cast.legY, { text: ctx.L({ en: `y = ${s.labelY.en}`, es: `y = ${s.labelY.es}` }) }, table);
    const hy = TBL.top + 23;
    put(cast.hX, { x: (c0 + c1) / 2, y: hy, text: "x" }, table);
    put(cast.hY, { x: (c1 + c2) / 2, y: hy, text: "y" }, table);
    put(cast.hP, { x: (c2 + c3) / 2, y: hy, text: "(x, y)" }, table && pairCol);
    cast.cells.forEach((cell, i) => {
      const r = rows[i];
      const y = rowY(i) + 26;
      put(cell.x, { x: (c0 + c1) / 2, y, text: String(r.x) }, table);
      put(cell.y, { x: (c1 + c2) / 2, y, text: String(r.y) }, table);
      put(
        cell.p,
        { x: (c2 + c3) / 2, y, text: `(${r.x}, ${r.y})` },
        table && pairs.includes(i + 1),
      );
    });
    put(
      cast.rowHi,
      {
        x: c0 - 3,
        y: rowHi ? rowY(rowHi - 1) + 2 : rowY(0),
        width: (pairCol ? c3 : c2) - c0 + 6,
        height: TBL.rowH - 4,
      },
      rowHi > 0,
    );
    put(cast.hdrHi, { x: c0 + 2, y: TBL.top + 3, width: c1 - c0 - 4, height: TBL.head - 6 }, hdrHi);
    // graph
    put(cast.axX, { x1: G.x0, x2: G.x0 + G.w + 10, y1: G.y0, y2: G.y0 }, graph);
    put(cast.axY, { x1: G.x0, x2: G.x0, y1: G.y0, y2: G.y0 - G.h - 10 }, graph);
    const stepX = tickStep(xMax);
    const stepY = tickStep(yMax);
    cast.xt.forEach((t, i) => {
      const val = (i + 1) * stepX;
      const live = graph && val <= xMax;
      put(t.grid, { x1: gx(val), x2: gx(val), y1: G.y0, y2: G.y0 - G.h }, live);
      put(t.num, { x: gx(val), y: G.y0 + 19, text: String(val) }, live);
    });
    cast.yt.forEach((t, i) => {
      const val = (i + 1) * stepY;
      const live = graph && val <= yMax;
      put(t.grid, { x1: G.x0, x2: G.x0 + G.w, y1: gy(val), y2: gy(val) }, live);
      put(t.num, { x: G.x0 - 7, y: gy(val) + 5, text: String(val) }, live);
    });
    put(cast.zero, { x: G.x0 - 7, y: G.y0 + 19, text: "0" }, graph);
    put(cast.titleX, { x: G.x0 + G.w / 2, y: G.y0 + 46, text: ctx.L(s.labelX) }, graph);
    put(cast.titleY, { x: G.x0 - 30, y: 30, text: ctx.L(s.labelY) }, graph);
    put(cast.eqLine, { x1: gx(0), y1: gy(0), x2: gx(xMax), y2: gy(yMax) }, graph && line);
    cast.pts.forEach((p, i) =>
      put(p, { cx: gx(rows[i].x), cy: gy(rows[i].y) }, graph && pts.includes(i + 1)),
    );
    const o = { x: ASKED_ROW * s.a, y: ASKED_ROW * s.b - 1 };
    put(cast.off, { cx: gx(o.x), cy: gy(o.y) }, graph && off);
    put(cast.offLbl, { x: gx(o.x) + 12, y: gy(o.y) + 22, text: `(${o.x}, ${o.y})` }, graph && off);
    put(cast.ghost, { cx: gx(ghost?.x ?? 0), cy: gy(ghost?.y ?? 0) }, graph && Boolean(ghost));
    put(
      cast.gH,
      { x1: gx(0), x2: gx(ghost?.x ?? 0), y1: gy(0), y2: gy(0) },
      graph && Boolean(ghost),
    );
    put(
      cast.gV,
      drop != null
        ? { x1: gx(drop), x2: gx(drop), y1: gy(0), y2: gy((drop * s.b) / s.a) }
        : { x1: gx(ghost?.x ?? 0), x2: gx(ghost?.x ?? 0), y1: gy(0), y2: gy(ghost?.y ?? 0) },
      graph && (Boolean(ghost) || drop != null),
    );
    return m;
  }

  const asked = copy.asked;
  const pairLabel = (o) => `(${o.x}, ${o.y})`;
  const optionsFor = (a, b, n, cues, seed) =>
    placeAway(pairChoices(a, b, n), seed).map((o) => ({
      ...o,
      label: pairLabel(o),
      cue: cues[o.kind],
    }));

  const scenes = [
    {
      id: "situate",
      label: { en: "The table", es: "La tabla" },
      async enter(ctx) {
        await ctx.tween(frame(ctx, {}), 500);
        ctx.expr("");
        ctx.say(copy.situate);
      },
    },
    {
      id: "predict",
      label: { en: "Predict", es: "Predice" },
      gate: true,
      async enter(ctx, saved) {
        const solved = Boolean(saved.solved);
        const base = { pairCol: true, rowHi: ASKED_ROW };
        const done = () =>
          frame(ctx, { ...base, graph: true, pairs: [ASKED_ROW], pts: [ASKED_ROW] });
        await ctx.tween(solved ? done() : frame(ctx, base), solved ? 0 : 300);
        ctx.expr("");
        ctx.say(copy.predict.say);
        const options = optionsFor(v.a, v.b, ASKED_ROW, copy.predict.cues, v.a + v.b + 1);
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.predict.question,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              await ctx.tween(frame(ctx, { ...base, hdrHi: opt.kind === "swapped" }), 250);
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(done(), 800);
              ctx.expr(pairHtml(asked.x, asked.y));
              ctx.feedback(copy.predict.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "plot",
      label: { en: "Plot the rows", es: "Marca las filas" },
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        st.done = Array.isArray(st.done) ? st.done.filter((r) => PLOT_ROWS.includes(r)) : [];
        const xMax = ROWS * v.a;
        const yMax = ROWS * v.b;
        let gxv = 0;
        let gyv = 0;
        const target = () => PLOT_ROWS.find((r) => !st.done.includes(r)) ?? 0;
        const view = (ms) =>
          ctx.tween(
            frame(ctx, {
              pairCol: true,
              graph: true,
              pairs: [ASKED_ROW, ...st.done],
              pts: [ASKED_ROW, ...st.done],
              rowHi: target(),
              ghost: target() ? { x: gxv, y: gyv } : null,
            }),
            ms,
          );
        const prompt = () => {
          const n = target();
          if (n) ctx.say(copy.plot.say(copy.rows[n - 1]));
        };
        const finish = () => {
          ctx.expr(copy.rows.map((r) => pairHtml(r.x, r.y)).join(", "));
          ctx.feedback(copy.plot.done);
          ctx.unlock();
        };
        const rx = ctx.range({
          label: copy.plot.right,
          min: 0,
          max: xMax,
          value: gxv,
          onInput: (n) => {
            gxv = n;
            view(120);
          },
        });
        const ry = ctx.range({
          label: copy.plot.up,
          min: 0,
          max: yMax,
          value: gyv,
          onInput: (n) => {
            gyv = n;
            view(120);
          },
        });
        const btn = ctx.button({
          label: copy.plot.button,
          primary: true,
          onClick: async () => {
            const n = target();
            if (!n) return;
            const verdict = checkPlot(copy.rows[n - 1], gxv, gyv);
            if (verdict !== "ok") {
              ctx.feedback(copy.plot.cues[verdict], "cue");
              return;
            }
            st.done.push(n);
            ctx.save();
            await view(450);
            if (target()) {
              ctx.feedback(copy.plot.progress(st.done.length), "cue");
              prompt();
            } else finish();
          },
        });
        ctx.panel.append(rx, ry, btn);
        ctx.expr("");
        await view(300);
        if (target()) {
          prompt();
          if (st.done.length) ctx.feedback(copy.plot.progress(st.done.length), "cue");
        } else finish();
      },
    },
    {
      id: "line",
      label: { en: "The line", es: "La recta" },
      async enter(ctx) {
        await ctx.tween(
          frame(ctx, {
            pairCol: true,
            graph: true,
            pairs: [1, 2, 3, 4],
            pts: [1, 2, 3, 4],
            line: true,
          }),
          700,
        );
        ctx.expr(copy.rows.map((r) => pairHtml(r.x, r.y)).join(", "));
        ctx.say(copy.line.say);
      },
    },
    {
      id: "off",
      label: { en: "Off the line", es: "Fuera de la recta" },
      gate: true,
      async enter(ctx, saved) {
        const base = {
          pairCol: true,
          graph: true,
          pairs: [1, 2, 3, 4],
          pts: [1, 2, 3, 4],
          line: true,
          off: true,
        };
        await ctx.tween(frame(ctx, base), saved.solved ? 0 : 400);
        ctx.expr(`<span class="lsx-lo">${escHtml(`(${copy.offPt.x}, ${copy.offPt.y})`)}</span>`);
        ctx.say(copy.off.say);
        const options = copy.off.options;
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.off.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              await ctx.tween(frame(ctx, { ...base, drop: copy.offPt.x }), 300);
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(frame(ctx, { ...base, drop: copy.offPt.x }), 400);
              ctx.feedback(copy.off.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "transfer",
      label: { en: "On your own", es: "Por tu cuenta" },
      async enter(ctx, saved) {
        const t = v.transfer;
        const solved = Boolean(saved.solved);
        const base = { set: "t", pairCol: true, graph: true, rowHi: ASKED_ROW };
        const before = () => frame(ctx, { ...base, pairs: [1, 2], pts: [1, 2] });
        const after = () => frame(ctx, { ...base, pairs: [1, 2, 3], pts: [1, 2, 3], line: true });
        await ctx.tween(solved ? after() : before(), solved ? 0 : 500);
        ctx.expr("");
        ctx.say(copy.transfer.say);
        const options = optionsFor(t.a, t.b, ASKED_ROW, copy.transfer.cues, t.a + t.b + 2);
        ctx.panel.append(
          ctx.choices({
            question: copy.transfer.question,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(after(), 700);
              ctx.expr(pairHtml(copy.tAsked.x, copy.tAsked.y));
              ctx.feedback(copy.transfer.ok);
            },
          }),
          ctx.frame({ label: copy.transfer.explain, frame: copy.transfer.frame }),
        );
      },
    },
  ];

  return {
    kicker: { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" },
    title: copy.title,
    viewBox: `0 0 ${W} ${H}`,
    ariaLabel: copy.ariaLabel,
    printSummary: copy.printSummary,
    setup,
    scenes,
  };
}
