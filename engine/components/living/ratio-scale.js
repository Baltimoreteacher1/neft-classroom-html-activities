// living/ratio-scale.js — one batch of a : b becomes a ratio table and a line.
//
// One cast for the whole play: MAXB batches, each `a` tiles of the first
// quantity and `b` tiles of the second. The tiles ARE the batches on cards,
// ARE the tape diagram, squeeze onto the double number line, drop into the
// rows of the ratio table, and the rows become points on one line through
// (0, 0). A "mix strip" shows each mix as shares of one bar, so "same mix"
// is something the student compares by length, not by colour.
//
// Config: { a, b, k, labelA, labelB, transfer:{a, b, k, labelA?, labelB?} } —
// the lesson's own numbers (3-3 authors 2 cups of mix : 3 cups of milk, the
// 4-batch question 8 : 12, and the 1 : 4 juice drink). Every number and line of
// text comes from ratio-scale-model.js (pure, tested); this file only stages it.

import { escHtml } from "../../core/living-scene.js";
import {
  H,
  MAXB,
  okInt,
  placeCorrect,
  ratioCopy,
  ratioGeometry,
  scaleChoices,
  validateRatioScale,
  W,
} from "./ratio-scale-model.js";

export { validateRatioScale };

const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;
const pairHtml = (A, B) => `${hi(String(A))} : ${lo(String(B))}`;

export function buildRatioScalePlay(cfg) {
  const v = validateRatioScale(cfg);
  if (!v) return null;
  const { a, b, k, labelA, labelB } = v;
  const copy = ratioCopy(v);
  const { rate, rows, addRows, wrong } = copy;
  const { cardW, T, cardH, X0, TT, S, DY, COL, rowY, G, xMax, yMax, gx, gy, tickStep } =
    ratioGeometry(a, b);

  let cast = null;

  function setup(ctx) {
    const { svg, svgEl, L } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs, parent = g) => svgEl(tag, { opacity: 0, ...attrs }, parent);
    const txt = (attrs, parent = g) =>
      el(
        "text",
        {
          "text-anchor": "middle",
          "font-size": 16,
          "font-weight": 700,
          fill: "var(--lsx-ink)",
          ...attrs,
        },
        parent,
      );
    const line = (x1, y1, x2, y2, stroke, more = {}, parent = g) =>
      el("line", { x1, y1, x2, y2, stroke: `var(--lsx-${stroke})`, ...more }, parent);
    // A filled box in the colour of quantity A (first) or B (second): tiles and strip shares.
    const box = (q, more) =>
      el("rect", {
        x: 0,
        y: 0,
        fill: q === "A" ? "var(--lsx-x)" : "var(--lsx-u)",
        stroke: q === "A" ? "var(--lsx-x-edge)" : "var(--lsx-u-edge)",
        "stroke-width": 2,
        ...more,
      });
    const qFill = (q) => (q === "A" ? "var(--lsx-hi)" : "var(--lsx-lo)");
    const ON = { opacity: 1 };

    // Table grid and graph axes are static groups that only fade in and out.
    const tableG = el("g", {});
    const tableBottom = rowY(MAXB - 1) + 17;
    el(
      "rect",
      {
        x: 20,
        y: 30,
        width: 280,
        height: tableBottom - 30,
        rx: 6,
        fill: "var(--lsx-card)",
        stroke: "var(--lsx-ink)",
        "stroke-width": 2,
        ...ON,
      },
      tableG,
    );
    for (const x of [90, 195])
      line(x, 30, x, tableBottom, "rule-strong", { "stroke-width": 1.5, ...ON }, tableG);
    for (let i = 0; i < MAXB; i++)
      line(
        20,
        rowY(i) - 18,
        300,
        rowY(i) - 18,
        i ? "rule" : "ink",
        { "stroke-width": i ? 1 : 2, ...ON },
        tableG,
      );
    const head = { y: 53, "font-size": 14, ...ON };
    txt({ x: COL.n, ...head, text: L({ en: "batches", es: "tandas" }) }, tableG);
    txt({ x: COL.A, ...head, fill: qFill("A"), text: L(labelA) }, tableG);
    txt({ x: COL.B, ...head, fill: qFill("B"), text: L(labelB) }, tableG);
    const cells = rows.map((r, i) => [
      txt({ x: COL.n, y: rowY(i) + 6, text: String(r.n) }),
      txt({ x: COL.A, y: rowY(i) + 6, fill: qFill("A"), text: String(r.A) }),
      txt({ x: COL.B, y: rowY(i) + 6, fill: qFill("B"), text: String(r.B) }),
    ]);

    const graphG = el("g", {});
    const tick = { "font-size": 14, "font-weight": 600, ...ON };
    for (let x = tickStep(xMax); x <= xMax; x += tickStep(xMax)) {
      line(gx(x), G.y0, gx(x), G.y0 - G.h, "rule", ON, graphG);
      txt({ x: gx(x), y: G.y0 + 20, ...tick, text: String(x) }, graphG);
    }
    for (let y = tickStep(yMax); y <= yMax; y += tickStep(yMax)) {
      line(G.x0, gy(y), G.x0 + G.w, gy(y), "rule", ON, graphG);
      txt({ x: G.x0 - 8, y: gy(y) + 5, "text-anchor": "end", ...tick, text: String(y) }, graphG);
    }
    line(G.x0, G.y0, G.x0 + G.w + 8, G.y0, "ink", { "stroke-width": 2, ...ON }, graphG);
    line(G.x0, G.y0, G.x0, G.y0 - G.h - 8, "ink", { "stroke-width": 2, ...ON }, graphG);
    txt(
      {
        x: G.x0 + G.w / 2,
        y: G.y0 + 44,
        fill: qFill("A"),
        "font-size": 15,
        ...ON,
        text: L(labelA),
      },
      graphG,
    );
    const yl = { x: G.x0 - 40, y: G.y0 - G.h / 2 };
    txt(
      {
        ...yl,
        fill: qFill("B"),
        "font-size": 15,
        ...ON,
        transform: `rotate(-90 ${yl.x} ${yl.y})`,
        text: L(labelB),
      },
      graphG,
    );
    txt({ x: G.x0 - 8, y: G.y0 + 20, "text-anchor": "end", ...tick, text: "0" }, graphG);
    const lineEnd = Math.min(xMax, (yMax * a) / b);
    const last = addRows[MAXB - 1];
    const dot = (fill, stroke, w) =>
      el("circle", { cx: 0, cy: 0, r: 7, fill, stroke, "stroke-width": w });

    cast = {
      tableG,
      graphG,
      cells,
      eqLine: line(gx(0), gy(0), gx(lineEnd), gy((lineEnd * b) / a), "hi", { "stroke-width": 3 }),
      addLine: line(gx(a), gy(b), gx(last.A), gy(last.B), "lo", {
        "stroke-width": 3,
        "stroke-dasharray": "8 6",
      }),
      tilesA: rows.map(() =>
        Array.from({ length: a }, () => box("A", { width: T, height: T, rx: 3 })),
      ),
      tilesB: rows.map(() =>
        Array.from({ length: b }, () => box("B", { width: T, height: T, rx: 3 })),
      ),
      cards: rows.map((_, i) =>
        el("rect", {
          x: 20 + i * (cardW + 12),
          y: 40,
          width: cardW,
          height: cardH,
          rx: 10,
          fill: "none",
          stroke: "var(--lsx-ink)",
          "stroke-width": 2,
          "stroke-dasharray": "6 5",
        }),
      ),
      cardLbl: rows.map((_, i) =>
        txt({
          x: 20 + i * (cardW + 12) + cardW / 2,
          y: 32,
          "font-size": 14,
          text: `${L({ en: "batch", es: "tanda" })} ${i + 1}`,
        }),
      ),
      stackTotal: txt({ x: W / 2, y: 40 + cardH + 34, "font-size": 20, "font-weight": 800 }),
      rowLblA: txt({ x: X0 - 12, y: 0, "text-anchor": "end", fill: qFill("A"), text: L(labelA) }),
      rowLblB: txt({ x: X0 - 12, y: 0, "text-anchor": "end", fill: qFill("B"), text: L(labelB) }),
      lineA: line(X0, DY.A, X0, DY.A, "ink", { "stroke-width": 2 }),
      lineB: line(X0, DY.B, X0, DY.B, "ink", { "stroke-width": 2 }),
      ticks: Array.from({ length: MAXB + 1 }, (_, i) =>
        ["A", "B"].map((q) => ({
          line: line(X0 + i * S, DY[q] - 22, X0 + i * S, DY[q] + 6, "ink", { "stroke-width": 2 }),
          num: txt({
            x: X0 + i * S,
            y: DY[q] + 26,
            fill: qFill(q),
            text: String((q === "A" ? a : b) * i),
          }),
        })),
      ),
      points: rows.map(() => dot("var(--lsx-x)", "var(--lsx-ink)", 2)),
      addPts: addRows.map(() => dot("var(--lsx-card)", "var(--lsx-lo)", 3)),
      // Where one batch's share ends, dashed through both strips: a changed mix shows as a shifted boundary.
      guide: line(0, 0, 0, 0, "ink", { "stroke-width": 2, "stroke-dasharray": "5 4" }),
      strips: [0, 1].map(() => ({
        label: txt({
          x: 0,
          y: 0,
          "text-anchor": "start",
          "font-size": 15,
          stroke: "var(--lsx-card)",
          "stroke-width": 5,
          "paint-order": "stroke",
        }),
        A: box("A", { width: 0, height: 20 }),
        B: box("B", { width: 0, height: 20 }),
      })),
    };
    // The guide sits above the strips it crosses; labels (with a halo) sit above the guide.
    g.appendChild(cast.guide);
    for (const st of cast.strips) g.appendChild(st.label);
  }

  /**
   * Every cast member's place in one view. Views: stack | tape | dnl |
   * tablein (tiles inside the cells) | table | graph | off.
   */
  function layout(view, n) {
    const m = [];
    const put = (node, attrs, show) => m.push([node, { ...attrs, opacity: show ? 1 : 0 }]);
    const inTable = view === "tablein" || view === "table" || view === "graph";
    for (let i = 0; i < MAXB; i++) {
      const live = i < n && view !== "off";
      const cx = 20 + i * (cardW + 12);
      for (const q of ["A", "B"]) {
        const tiles = q === "A" ? cast.tilesA[i] : cast.tilesB[i];
        const per = q === "A" ? a : b;
        tiles.forEach((t, j) => {
          let at;
          if (view === "tape")
            at = {
              x: X0 + i * (per * TT + 6) + j * TT,
              y: q === "A" ? 70 : 140,
              width: TT,
              height: 26,
            };
          else if (view === "dnl")
            at = { x: X0 + i * S + (j * S) / per, y: DY[q] - 14, width: S / per, height: 14 };
          else if (inTable)
            at = { x: COL[q] - (per * 9) / 2 + j * 9, y: rowY(i) - 4, width: 8, height: 8 };
          else
            at = {
              x: cx + (cardW - per * T) / 2 + j * T,
              y: q === "A" ? 52 : 60 + T,
              width: T,
              height: T,
            };
          put(t, at, live && view !== "table" && view !== "graph");
        });
      }
      put(cast.cards[i], {}, live && view === "stack");
      put(cast.cardLbl[i], {}, live && view === "stack");
      cast.cells[i].forEach((c) => put(c, {}, live && (view === "table" || view === "graph")));
      put(
        cast.points[i],
        view === "graph" ? { cx: gx(rows[i].A), cy: gy(rows[i].B) } : { cx: 300, cy: rowY(i) },
        view === "graph" && i < n,
      );
    }
    put(cast.stackTotal, {}, view === "stack" && n > 1);
    put(cast.guide, {}, false);
    cast.stackTotal.textContent = `${n} × (${a} : ${b}) = ${n * a} : ${n * b}`;
    const lblY = view === "tape" ? { A: 89, B: 159 } : { A: DY.A - 2, B: DY.B - 2 };
    put(cast.rowLblA, { y: lblY.A }, view === "tape" || view === "dnl");
    put(cast.rowLblB, { y: lblY.B }, view === "tape" || view === "dnl");
    put(cast.lineA, { x2: X0 + n * S + 16 }, view === "dnl");
    put(cast.lineB, { x2: X0 + n * S + 16 }, view === "dnl");
    cast.ticks.forEach((pair, i) =>
      pair.forEach((tk) => {
        put(tk.line, {}, view === "dnl" && i <= n);
        put(tk.num, {}, view === "dnl" && i <= n);
      }),
    );
    put(cast.tableG, {}, inTable);
    put(cast.graphG, {}, view === "graph");
    put(cast.eqLine, {}, view === "graph");
    put(cast.addLine, {}, false);
    cast.addPts.forEach((p, j) => put(p, { cx: gx(addRows[j].A), cy: gy(addRows[j].B) }, false));
    cast.strips.forEach((s) => {
      put(s.label, {}, false);
      put(s.A, {}, false);
      put(s.B, {}, false);
    });
    return m;
  }

  /** A mix strip: one bar split into the two shares of A : B. */
  let stripTop = 0;
  let stripShare = 0; // strip 0's first share: the guide marks it on strip 1
  function strip(ctx, idx, { A, B, x, y, w, label }) {
    const s = cast.strips[idx];
    s.label.textContent = `${ctx.L(label)}  ${A} : ${B}`;
    const wa = (w * A) / (A + B);
    if (idx === 0) {
      stripTop = y;
      stripShare = A / (A + B);
    }
    const gx0 = x + w * stripShare;
    const guide =
      idx === 1
        ? [[cast.guide, { x1: gx0, x2: gx0, y1: stripTop - 6, y2: y + 26, opacity: 1 }]]
        : [];
    return [
      ...guide,
      [s.label, { x, y: y - 8, opacity: 1 }],
      [s.A, { x, y, width: wa, opacity: 1 }],
      [s.B, { x: x + wa, y, width: w - wa, opacity: 1 }],
    ];
  }
  const ONE = { en: "one batch:", es: "una tanda:" };

  const scenes = [
    {
      id: "situate",
      label: { en: "One batch", es: "Una tanda" },
      async enter(ctx) {
        await ctx.tween(layout("stack", 0), 0);
        await ctx.tween(
          [
            ...layout("stack", 1),
            ...strip(ctx, 0, { A: a, B: b, x: 140, y: 290, w: 440, label: ONE }),
          ],
          500,
        );
        ctx.expr(pairHtml(a, b));
        ctx.say(copy.situate);
      },
    },
    {
      id: "predict",
      label: { en: "Predict", es: "Predice" },
      gate: true,
      async enter(ctx, saved) {
        const base = strip(ctx, 0, { A: a, B: b, x: 140, y: 270, w: 440, label: ONE });
        const yours = (A, B, label) => strip(ctx, 1, { A, B, x: 140, y: 340, w: 440, label });
        const solvedMoves = () => [
          ...layout("stack", k),
          ...base,
          ...yours(k * a, k * b, { en: `${k} batches:`, es: `${k} tandas:` }),
        ];
        await ctx.tween(saved.solved ? solvedMoves() : [...layout("stack", 1), ...base], 300);
        ctx.expr(`${k} × (${pairHtml(a, b)}) = ?`);
        ctx.say(copy.predict.say);
        const options = placeCorrect(scaleChoices(a, b, k), a + b + k).map((o) => ({
          ...o,
          label: `${o.A} : ${o.B}`,
          cue: copy.predict.cues[o.kind],
        }));
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.predict.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              await ctx.tween(yours(opt.A, opt.B, { en: "your mix:", es: "tu mezcla:" }), 350);
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(solvedMoves(), 700);
              ctx.feedback(copy.predict.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "build",
      label: { en: "Build batches", es: "Construye tandas" },
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        st.views = Array.isArray(st.views) ? st.views : [];
        st.ns = Array.isArray(st.ns) ? st.ns : [];
        st.n = okInt(st.n, 1, MAXB) ? st.n : k;
        st.view = ["stack", "tape", "dnl", "table"].includes(st.view) ? st.view : "stack";
        const { say: SAY, views } = copy.build;
        const show = async (ms) => {
          const n = st.n;
          if (st.view === "table" && ms > 0) await ctx.tween(layout("tablein", n), ms);
          await ctx.tween(layout(st.view, n), st.view === "table" ? ms / 2 : ms);
          ctx.expr(`${n} × (${a} : ${b}) = ${pairHtml(n * a, n * b)}`);
          ctx.say(SAY[st.view]);
          const left = 4 - st.views.length;
          if (left > 0 || st.ns.length < 3)
            ctx.feedback(copy.build.progress(st.views.length, st.ns.length), "cue");
          else {
            ctx.feedback(copy.build.done);
            ctx.unlock();
          }
          ctx.save();
        };
        const mark = () => {
          if (!st.views.includes(st.view)) st.views.push(st.view);
          if (!st.ns.includes(st.n)) st.ns.push(st.n);
        };
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", ctx.L({ en: "Picture", es: "Dibujo" }));
        const btns = views.map(([id, label]) => {
          const btn = ctx.button({
            label,
            onClick: async () => {
              st.view = id;
              for (const x of btns) x.setAttribute("aria-pressed", String(x === btn));
              mark();
              await show(650);
            },
          });
          btn.setAttribute("aria-pressed", String(id === st.view));
          return btn;
        });
        row.append(...btns);
        ctx.panel.append(
          ctx.range({
            label: { en: "Batches", es: "Tandas" },
            min: 1,
            max: MAXB,
            value: st.n,
            onInput: async (n) => {
              st.n = n;
              mark();
              await ctx.tween(layout(st.view, n), 400);
              await show(0);
            },
          }),
          row,
        );
        mark();
        await show(500);
      },
    },
    {
      id: "graph",
      label: { en: "The graph", es: "La gráfica" },
      async enter(ctx) {
        await ctx.tween(layout("table", MAXB), 300);
        await ctx.tween(layout("graph", MAXB), 900);
        ctx.expr(
          `${copy.graph.points} &nbsp;·&nbsp; ${escHtml(ctx.L({ en: "unit rate", es: "tasa unitaria" }))} ${pairHtml(1, rate.text)}`,
        );
        ctx.say(copy.graph.say);
      },
    },
    {
      id: "nonequal",
      label: { en: "Adding instead", es: "Si sumamos" },
      gate: true,
      async enter(ctx, saved) {
        const reveal = () => [
          [cast.addLine, { opacity: 1 }],
          ...cast.addPts.map((p) => [p, { opacity: 1 }]),
          ...strip(ctx, 0, { A: a, B: b, x: 20, y: 300, w: 280, label: ONE }),
          ...strip(ctx, 1, {
            A: wrong.A,
            B: wrong.B,
            x: 20,
            y: 360,
            w: 280,
            label: copy.nonequal.stripLabel,
          }),
        ];
        await ctx.tween(layout("graph", MAXB), 0);
        await ctx.tween(reveal(), saved.solved ? 0 : 700);
        ctx.expr(
          `(${a} + ${a}) : (${b} + ${a}) = ${pairHtml(wrong.A, wrong.B)} &nbsp;?&nbsp; ${pairHtml(a, b)}`,
        );
        ctx.say(copy.nonequal.say);
        const options = copy.nonequal.options;
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.nonequal.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(copy.nonequal.ok);
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
        const scaled = () =>
          strip(ctx, 1, {
            A: t.k * t.a,
            B: t.k * t.b,
            x: 140,
            y: 200,
            w: 440,
            label: { en: `× ${t.k}:`, es: `× ${t.k}:` },
          });
        await ctx.tween(
          [
            ...layout("off", 0),
            ...strip(ctx, 0, { A: t.a, B: t.b, x: 140, y: 120, w: 440, label: ONE }),
            ...(saved.solved ? scaled() : []),
          ],
          400,
        );
        ctx.expr(`${pairHtml(t.a, t.b)} = ${hi(String(t.k * t.a))} : ?`);
        ctx.say(copy.transfer.say);
        const options = placeCorrect(scaleChoices(t.a, t.b, t.k), t.a + 2 * t.b + t.k).map((o) => ({
          ...o,
          label: String(o.B),
          cue: copy.transfer.cues[o.kind],
        }));
        ctx.panel.append(
          ctx.choices({
            question: copy.transfer.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.expr(`${pairHtml(t.a, t.b)} = ${pairHtml(t.k * t.a, t.k * t.b)}`);
              ctx.tween(scaled(), 600);
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
