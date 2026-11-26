// living/choose-measure.js — choosing the MEAN or the MEDIAN (lesson 2-10).
//
// One cast: a dot plot, a dashed line at the median and a fulcrum at the mean.
// The student predicts which way one far-away value moves the mean, drags that
// value and watches the mean follow it while the median stays put, sees how many
// of the values the mean is pulled past, then decides which of two sets can use
// its mean and which measure fits a new set. The dots keep their identity from
// scene to scene; scene 5 shows two sets on two lines.
//
// Config: { values:[...odd count...], editIndex, edit:{min,max}, unit, story,
//   item:{en:{one,many},es:{one,many}},
//   sets:{ a:{name, values}, b:{name, values} },        // a: no outlier, b: outlier
//   transfer:{ values, unit, story } }
// The authored claims are checked against the numbers (the outlier really pulls
// the mean from the median; the quiet set really does not), or the play refuses.

import { escHtml } from "../../core/living-scene.js";
import {
  chooseMeasureCopy,
  mstats,
  okInt,
  placeCorrect,
  ranks,
  validateChooseMeasure,
} from "./choose-measure-model.js";

export { validateChooseMeasure };

const W = 480;
const AX0 = 40;
const AX1 = W - 40;
const D = 11; // a dot
const SINGLE_Y = 112;
const LINE_Y = [100, 240];
const H = 300;
const NMAX = 7;
const X = { fill: "var(--lsx-x)", stroke: "var(--lsx-x-edge)" };
const U = { fill: "var(--lsx-u)", stroke: "var(--lsx-u-edge)" };

export function buildChooseMeasurePlay(cfg) {
  const v = validateChooseMeasure(cfg);
  if (!v) return null;
  const T = chooseMeasureCopy(v);
  const { values, idx, edit, axes, sets, transfer, unit } = v;
  const S = mstats(values);

  /** One line's state: data, axis, where it sits, and what is marked. */
  const line = (vals, axis, o = {}) => ({
    vals,
    axis,
    y: SINGLE_Y,
    unit,
    title: null,
    mean: false,
    median: false,
    below: false,
    hiIdx: -1,
    ...o,
  });
  const xOf = (ln, val) => AX0 + ((val - ln.axis.lo) / (ln.axis.hi - ln.axis.lo)) * (AX1 - AX0);
  const clampX = (x) => Math.min(W - 60, Math.max(60, x));

  let c = null; // the cast: one entry per line
  let cap = null; // the single caption under the plot
  const ticked = [null, null];

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs, parent = g) => svgEl(tag, { opacity: 0, ...attrs }, parent);
    const text = (attrs) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 16,
        "font-weight": 700,
        fill: "var(--lsx-ink)",
        ...attrs,
      });
    c = [0, 1].map(() => {
      const tri = el("svg", { x: 0, y: 0, width: 22, height: 18, overflow: "visible" });
      svgEl("polygon", { points: "0,18 11,0 22,18", fill: "var(--lsx-ink)" }, tri);
      return {
        title: text({ x: 14, y: 0, "text-anchor": "start", "font-size": 16 }),
        axis: el("line", {
          x1: AX0 - 12,
          x2: AX1 + 12,
          y1: 0,
          y2: 0,
          stroke: "var(--lsx-ink)",
          "stroke-width": 2,
        }),
        ticks: svgEl("g", { opacity: 0 }, g),
        unit: text({
          x: W - 8,
          y: 0,
          "text-anchor": "end",
          "font-size": 14,
          fill: "var(--lsx-muted)",
        }),
        dots: Array.from({ length: NMAX }, () =>
          el("rect", { x: 0, y: 0, width: D, height: D, rx: D / 2, ...X, "stroke-width": 2 }),
        ),
        medLine: el("line", {
          x1: 0,
          x2: 0,
          y1: 0,
          y2: 0,
          stroke: "var(--lsx-hi)",
          "stroke-width": 3,
          "stroke-dasharray": "7 4",
        }),
        medTxt: text({ x: 0, y: 0, fill: "var(--lsx-hi)" }),
        tri,
        meanTxt: text({ x: 0, y: 0, fill: "var(--lsx-lo)", "text-anchor": "start" }),
      };
    });
    cap = text({ x: W / 2, y: SINGLE_Y + 92, "font-size": 16 });
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  }

  function useTicks(ctx, L, ln) {
    const key = `${ln.axis.lo}|${ln.axis.hi}|${ln.axis.step}|${ln.y}`;
    if (ticked[L] === key) return;
    ticked[L] = key;
    const t = c[L].ticks;
    t.innerHTML = "";
    for (let x = ln.axis.lo; x <= ln.axis.hi + 1e-9; x += ln.axis.step) {
      const px = xOf(ln, x);
      const tick = {
        x1: px,
        x2: px,
        y1: ln.y - 5,
        y2: ln.y + 5,
        stroke: "var(--lsx-ink)",
        "stroke-width": 2,
      };
      ctx.svgEl("line", tick, t);
      const label = {
        x: px,
        y: ln.y + 34,
        "text-anchor": "middle",
        "font-size": 15,
        fill: "var(--lsx-muted)",
      };
      ctx.svgEl("text", { ...label, text: String(x) }, t);
    }
  }

  function lineMoves(ctx, L, ln) {
    const e = c[L];
    const m = [];
    if (!ln) {
      const hidden = [
        e.title,
        e.axis,
        e.ticks,
        e.unit,
        e.medLine,
        e.medTxt,
        e.tri,
        e.meanTxt,
        ...e.dots,
      ];
      for (const x of hidden) m.push([x, { opacity: 0 }]);
      return m;
    }
    useTicks(ctx, L, ln);
    const s = mstats(ln.vals);
    const rk = ranks(ln.vals);
    m.push([
      e.title,
      { opacity: ln.title ? 1 : 0, y: ln.y - 82, text: ln.title ? ctx.L(ln.title) : "" },
    ]);
    m.push([e.axis, { opacity: 1, y1: ln.y, y2: ln.y }], [e.ticks, { opacity: 1 }]);
    m.push([e.unit, { opacity: 1, y: ln.y + 18, text: ctx.L(ln.unit) }]);
    e.dots.forEach((d, i) => {
      if (i >= ln.vals.length) return m.push([d, { opacity: 0 }]);
      const look = i === ln.hiIdx || (ln.below && ln.vals[i] < s.mean) ? U : X;
      const y = ln.y - 3 - D - (rk[i] % 3) * (D + 2);
      m.push([d, { ...look, x: xOf(ln, ln.vals[i]) - D / 2, y, opacity: 1 }]);
    });
    const mx = xOf(ln, s.mean);
    const dx = xOf(ln, s.median);
    m.push([e.medLine, { opacity: ln.median ? 1 : 0, x1: dx, x2: dx, y1: ln.y - 46, y2: ln.y }]);
    m.push([
      e.medTxt,
      {
        opacity: ln.median ? 1 : 0,
        x: clampX(dx),
        y: ln.y - 46,
        text: ctx.L(T.medianTag(s.median)),
      },
    ]);
    m.push([e.tri, { opacity: ln.mean ? 1 : 0, x: mx - 11, y: ln.y + 3 }]);
    m.push([
      e.meanTxt,
      {
        opacity: ln.mean ? 1 : 0,
        x: mx > W - 130 ? mx - 16 : mx + 16,
        y: ln.y + 19,
        "text-anchor": mx > W - 130 ? "end" : "start",
        text: ctx.L(T.meanTag(s.mean)),
      },
    ]);
    return m;
  }

  const view = (ctx, lines, ms, caption = "") =>
    ctx.tween(
      [
        ...[0, 1].flatMap((L) => lineMoves(ctx, L, lines[L] || null)),
        [cap, { opacity: caption ? 1 : 0, text: caption }],
      ],
      ms,
    );
  const main = (o) => [line(values, axes.main, o)];
  const withEdit = (val) => values.map((x, i) => (i === idx ? val : x));
  const setLines = (o) => [
    line(sets.a.values, axes.sets, { y: LINE_Y[0], title: sets.a.name, ...o }),
    line(sets.b.values, axes.sets, { y: LINE_Y[1], title: sets.b.name, ...o }),
  ];
  const tLine = (o) => [line(transfer.values, axes.transfer, { unit: transfer.unit, ...o })];

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.say(T.situateSay);
        ctx.expr(escHtml(T.list));
        await view(ctx, main({}), 450);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        ctx.say(T.predictSay);
        ctx.expr(escHtml(T.list));
        await view(ctx, main({ median: true, mean: !!saved.solved }), 400);
        const options = placeCorrect(T.predictOptions, S.total + 2 * S.n + 1);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.predictCue(opt.kind), "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              await view(ctx, main({ median: true, mean: true }), 450);
            },
          }),
        );
      },
    },
    {
      id: "move",
      label: T.scene.move,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        const start = values[idx];
        st.seen = Array.isArray(st.seen) ? st.seen.filter((x) => okInt(x, edit.min, edit.max)) : [];
        const startVal = st.seen.length ? st.seen[st.seen.length - 1] : start;
        const table = document.createElement("p");
        table.className = "lsx-fb";
        table.setAttribute("aria-live", "polite");
        const apply = (val, ms) => {
          ctx.expr(escHtml(withEdit(val).join(", ")));
          table.innerHTML = ctx.L(T.moveRow(val, escHtml));
          return view(
            ctx,
            [line(withEdit(val), axes.main, { median: true, mean: true, hiIdx: idx })],
            ms,
          );
        };
        const progress = () => {
          const lo = Math.min(start, ...st.seen);
          const hi = Math.max(start, ...st.seen);
          if (st.seen.length >= 3) {
            ctx.feedback(T.moveDone(lo, hi));
            ctx.unlock();
          } else ctx.feedback(st.seen.length ? T.moveTry(3 - st.seen.length) : T.moveTryAll, "cue");
        };
        ctx.say(T.moveSay);
        const rng = ctx.range({
          label: T.moveLabel,
          min: edit.min,
          max: edit.max,
          value: startVal,
          onInput: async (val) => {
            if (!st.seen.includes(val) && val !== start) st.seen.push(val);
            ctx.save();
            await apply(val, 200);
            progress();
          },
        });
        ctx.panel.append(rng, table);
        await apply(startVal, 500);
        progress();
      },
    },
    {
      id: "connect",
      label: T.scene.connect,
      async enter(ctx) {
        ctx.say(T.connectSay);
        ctx.expr(escHtml(ctx.L(T.connectExpr)));
        await view(ctx, main({ median: true, mean: true, below: true }), 500, ctx.L(T.connectCap));
        ctx.feedback(T.connectRule);
      },
    },
    {
      id: "sets",
      label: T.scene.sets,
      gate: true,
      async enter(ctx, saved) {
        ctx.say(T.setsSay);
        ctx.expr("");
        const options = placeCorrect(T.setsOptions, S.total + 1);
        const marks = { mean: true, median: true };
        await view(ctx, setLines(saved.solved ? marks : {}), saved.solved ? 0 : 600);
        if (saved.solved) ctx.feedback(T.setsOk);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.setsQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.setsCue(opt.kind), "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T.setsOk);
              ctx.unlock();
              await view(ctx, setLines(marks), 550);
            },
          }),
        );
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        ctx.say(T.transferSay);
        ctx.expr(escHtml(transfer.values.join(", ")));
        await view(ctx, tLine({ mean: true, median: true }), 600);
        const options = placeCorrect(T.transferOptions, mstats(transfer.values).total + 2);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.transferCue(opt.kind), "cue"),
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
            },
          }),
        );
        ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
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
