// living/spread-iqr.js — range and interquartile range: two ways to say "how
// spread out".
//
// One cast for the whole play: a dot for every score on a number line. A
// bracket from the least to the greatest dot is the range (scene 3); a box
// around the middle half of the dots is the interquartile range (scene 4). In
// scene 5 the student drags the lowest score far away: the range follows it and
// the IQR does not move. Scene 6 compares two classes with the same median.
//
// Config: { values:[12|16|20|24 scores, in order], story:{en,es}, outlierMin,
//           transfer:{ a:{label,min,q1,med,q3,max}, b:{...} } }
// Anything the stage cannot draw makes the play refuse (null).

import { escHtml } from "../../core/living-scene.js";
import { boxMoves, drawTicks, makeBoxCast } from "./box-build.js";
import { stackIndex } from "./box-build-model.js";
import { fiveNumber, okInt, placeCorrect, sum } from "./median-fold-model.js";
import {
  axisOf,
  fmtNum,
  iqrChoices,
  middleHalf,
  rangeChoices,
  spreadIqrCopy,
  validateSpreadIqr,
} from "./spread-iqr-model.js";

export { validateSpreadIqr };

const W = 480;
const H = 352;
const AX = 312;
const PX0 = 36;
const PX1 = 444;
const BY = 112; // box centre
const BH = 44;
const RANGE_Y = 46;
const IQR_Y = 182;
const TA = { box: 110, name: 78, sum: 150, res: 170 };
const TB = { box: 230, name: 198, sum: 270, res: 290 };

const DOT = {
  x: { fill: "var(--lsx-x)", stroke: "var(--lsx-x-edge)", "stroke-width": 2 },
  u: { fill: "var(--lsx-u)", stroke: "var(--lsx-u-edge)", "stroke-width": 3 },
  ring: { fill: "var(--lsx-card)", stroke: "var(--lsx-ink)", "stroke-width": 3 },
};

/** A bracket made of three lines, so it tweens like everything else. */
function makeBracket(svgEl, g, attrs) {
  const l = (extra = {}) =>
    svgEl(
      "line",
      {
        x1: 0,
        x2: 0,
        y1: 0,
        y2: 0,
        stroke: "var(--lsx-ink)",
        "stroke-width": 4,
        opacity: 0,
        ...attrs,
        ...extra,
      },
      g,
    );
  return { bar: l(), a: l({ "stroke-dasharray": null }), b: l({ "stroke-dasharray": null }) };
}
const bracketMoves = (br, x1, x2, y, on) => {
  const o = on ? 1 : 0;
  return [
    [br.bar, { x1, x2, y1: y, y2: y, opacity: o }],
    [br.a, { x1, x2: x1, y1: y - 8, y2: y + 8, opacity: o }],
    [br.b, { x1: x2, x2, y1: y - 8, y2: y + 8, opacity: o }],
  ];
};

export function buildSpreadIqrPlay(cfg) {
  const v = validateSpreadIqr(cfg);
  if (!v) return null;
  const T = spreadIqrCopy(v);
  const f = fmtNum;
  const S = fiveNumber(v.values);
  const n = S.n;
  const mh = middleHalf(n);
  const { a: cA, b: cB } = v.transfer;
  const baseAxis = axisOf(S.min, S.max);
  const zoomAxis = axisOf(v.outlierMin, S.max);
  const xferAxis = axisOf(Math.min(cA.min, cB.min), Math.max(cA.max, cB.max));
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;
  const optionsOf = (list, seed) =>
    placeCorrect(
      list.map((o) => ({ ...o, label: f(o.value) })),
      seed,
    );

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
          "font-size": 16,
          "font-weight": 800,
          fill: "var(--lsx-ink)",
          opacity: 0,
          ...attrs,
        },
        g,
      );
    svgEl(
      "line",
      { x1: PX0 - 8, x2: PX1 + 8, y1: AX, y2: AX, stroke: "var(--lsx-ink)", "stroke-width": 2 },
      g,
    );
    const ticks = svgEl("g", {}, g);
    const cueRects = [0, 1].map(() =>
      svgEl(
        "rect",
        {
          x: 0,
          y: 0,
          width: 0,
          height: 70,
          rx: 8,
          fill: "none",
          stroke: "var(--lsx-lo)",
          "stroke-width": 3,
          "stroke-dasharray": "7 5",
          opacity: 0,
        },
        g,
      ),
    );
    const boxes = [makeBoxCast(svgEl, g), makeBoxCast(svgEl, g), makeBoxCast(svgEl, g)];
    const rangeBr = makeBracket(svgEl, g, { stroke: "var(--lsx-lo)", "stroke-dasharray": "9 6" });
    const iqrBr = makeBracket(svgEl, g, { stroke: "var(--lsx-hi)" });
    const dots = v.values.map(() =>
      svgEl("rect", { x: 0, y: AX - 16, width: 12, height: 12, rx: 6, opacity: 0, ...DOT.x }, g),
    );
    c = {
      ticks,
      cueRects,
      boxes,
      rangeBr,
      iqrBr,
      dots,
      rangeTxt: text({ y: RANGE_Y - 16, fill: "var(--lsx-lo)", "font-size": 18 }),
      iqrTxt: text({ y: IQR_Y + 28, fill: "var(--lsx-hi)", "font-size": 18 }),
      medTxt: text({ y: BY - BH / 2 - 10 }),
      q1Txt: text({ y: BY + BH / 2 + 22 }),
      q3Txt: text({ y: BY + BH / 2 + 22 }),
      names: [0, 1].map(() => text({ "text-anchor": "start", x: PX0, "font-size": 18 })),
      sums: [0, 1].map(() => text({ "font-size": 16, "font-weight": 700, x: W / 2 })),
      results: [0, 1].map(() => text({ "font-size": 17, fill: "var(--lsx-hi)", x: W / 2 })),
      svgEl,
    };
  }

  /**
   * One state for the whole stage. o: { axis, vals, dots, look(i), box, range,
   * iqr, transfer: null | { done, cue } }
   */
  function view(ctx, o, ms) {
    const unit = (PX1 - PX0) / (o.axis.hi - o.axis.lo);
    const xOf = (val) => PX0 + (val - o.axis.lo) * unit;
    const D = Math.min(14, unit - 1.5);
    const stack = stackIndex(o.vals);
    const xf = !!o.transfer;
    const m = [];
    c.dots.forEach((d, i) => {
      const on = !!o.dots && !xf;
      m.push([
        d,
        {
          x: xOf(o.vals[i]) - D / 2,
          y: AX - D - 3 - stack[i] * (D + 1),
          width: D,
          height: D,
          rx: D / 2,
          opacity: on ? 1 : 0,
          ...DOT[o.look(i)],
        },
      ]);
    });
    const F = fiveNumber(o.vals);
    const showBox = !!o.box && !xf;
    m.push(...boxMoves(c.boxes[0], F, xOf, BY, BH, showBox));
    for (const [t, x, label] of [
      [c.medTxt, F.med, T.labelMed(F)],
      [c.q1Txt, F.q1, T.labelQ1],
      [c.q3Txt, F.q3, T.labelQ3],
    ]) {
      t.textContent = ctx.L(label);
      m.push([t, { x: xOf(x), opacity: showBox ? 1 : 0 }]);
    }
    const showRange = !!o.range && !xf;
    c.rangeTxt.textContent = ctx.L(T.rangeSum(F.min, F.max));
    m.push(...bracketMoves(c.rangeBr, xOf(F.min), xOf(F.max), RANGE_Y, showRange));
    m.push([c.rangeTxt, { x: (xOf(F.min) + xOf(F.max)) / 2, opacity: showRange ? 1 : 0 }]);
    const showIqr = !!o.iqr && !xf;
    c.iqrTxt.textContent = ctx.L({
      en: `IQR = ${f(F.q3)} − ${f(F.q1)} = ${f(F.iqr)}`,
      es: `RIC = ${f(F.q3)} − ${f(F.q1)} = ${f(F.iqr)}`,
    });
    m.push(...bracketMoves(c.iqrBr, xOf(F.q1), xOf(F.q3), IQR_Y, showIqr));
    m.push([c.iqrTxt, { x: (xOf(F.q1) + xOf(F.q3)) / 2, opacity: showIqr ? 1 : 0 }]);
    [cA, cB].forEach((k, i) => {
      const row = i ? TB : TA;
      m.push(...boxMoves(c.boxes[i + 1], k, xOf, row.box, BH, xf));
      c.names[i].textContent = ctx.L(k.label);
      c.sums[i].textContent = ctx.L(T.sumLine(k));
      c.results[i].textContent = ctx.L(T.resultLine(k));
      m.push([c.names[i], { y: row.name, opacity: xf ? 1 : 0 }]);
      m.push([c.sums[i], { y: row.sum, opacity: xf ? 1 : 0 }]);
      m.push([c.results[i], { y: row.res, opacity: xf && o.transfer.done ? 1 : 0 }]);
      const r = c.cueRects[i];
      r.setAttribute("y", String(row.box - 35));
      m.push([
        r,
        {
          x: xOf(k.min) - 8,
          width: xOf(k.max) - xOf(k.min) + 16,
          opacity: xf && o.transfer.cue ? 1 : 0,
        },
      ]);
    });
    // Scenes that draw only the dots crop the empty space above them.
    const top = o.top ?? 6;
    ctx.svg.setAttribute("viewBox", `0 ${top} ${W} ${H - top}`);
    drawTicks(c.svgEl, c.ticks, { ...o.axis, xOf, y: AX });
    return ctx.tween(m, ms);
  }

  const quarters = (i) => (i >= mh.from && i < mh.to ? "u" : "x");
  const ends = (i) => (i === 0 || i === n - 1 ? "ring" : "x");
  const crop = AX - 82; // dots only: nothing is drawn above the tallest stack
  const main = (extra) => ({
    axis: baseAxis,
    vals: v.values,
    dots: true,
    look: () => "x",
    ...extra,
  });

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.expr(escHtml(T.list));
        ctx.say(T.situateSay);
        await view(ctx, main({ top: crop }), 500);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        ctx.expr(escHtml(T.list));
        ctx.say(T.predictSay);
        const shown = view(ctx, main({ top: crop }), 0);
        const options = optionsOf(rangeChoices(v.values), sum(v.values) + n);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.cueRange(opt), "cue");
              view(ctx, main({ look: ends, top: crop }), 250);
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              view(ctx, main({ top: crop }), 250);
            },
          }),
        );
        await shown;
      },
    },
    {
      id: "range",
      label: T.scene.range,
      async enter(ctx) {
        ctx.say(T.rangeSay);
        ctx.expr(`<span class="lsx-lo">${escHtml(ctx.L(T.rangeSum(S.min, S.max)))}</span>`);
        await view(ctx, main({}), 0);
        await view(ctx, main({ range: true }), 700);
        ctx.feedback(T.rangeDone);
      },
    },
    {
      id: "iqr",
      label: T.scene.iqr,
      gate: true,
      async enter(ctx, saved) {
        const solved = !!saved.solved;
        const full = (extra) => main({ range: true, box: true, look: quarters, ...extra });
        ctx.say(T.iqrSay);
        ctx.expr(
          solved ? `<span class="lsx-hi">${escHtml(ctx.L(T.iqrSum))}</span>` : escHtml(T.list),
        );
        if (solved) ctx.feedback(T.iqrOk);
        await view(ctx, main({ range: true }), 0);
        const shown = view(ctx, full({ iqr: solved }), solved ? 0 : 800);
        const options = optionsOf(iqrChoices(v.values), sum(v.values) + 2 * n + 1);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.iqrQ,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(T.cueIqr(opt), "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T.iqrOk);
              ctx.expr(`<span class="lsx-hi">${escHtml(ctx.L(T.iqrSum))}</span>`);
              ctx.unlock();
              await view(ctx, full({ iqr: true }), 500);
            },
          }),
        );
        await shown;
      },
    },
    {
      id: "outlier",
      label: T.scene.outlier,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        const top = S.min;
        const low = v.outlierMin;
        st.seen = Array.isArray(st.seen) ? st.seen.filter((x) => okInt(x, low, top)) : [];
        const start = st.seen.length ? st.seen[st.seen.length - 1] : top;
        const table = document.createElement("p");
        table.className = "lsx-fb";
        table.setAttribute("aria-live", "polite");
        const look = (i) => (i === 0 ? "ring" : quarters(i));
        const apply = (x, ms) => {
          const vals = [x, ...v.values.slice(1)];
          table.innerHTML = ctx.L(T.outlierRow(x, escHtml));
          const F = fiveNumber(vals);
          ctx.expr(
            `${lo(`${ctx.L({ en: "range", es: "rango" })} ${F.range}`)} · ${hi(`${ctx.L({ en: "IQR", es: "RIC" })} ${f(F.iqr)}`)}`,
          );
          return view(
            ctx,
            { axis: zoomAxis, vals, dots: true, look, box: true, range: true, iqr: true },
            ms,
          );
        };
        const progress = () => {
          if (st.seen.length >= 3) {
            ctx.feedback(T.outlierLesson);
            ctx.unlock();
          } else ctx.feedback(st.seen.length ? T.tryMore(3 - st.seen.length) : T.tryThree, "cue");
        };
        ctx.say(T.outlierSay);
        const rng = ctx.range({
          label: T.lowestWord,
          min: low,
          max: top,
          value: start,
          onInput: async (val) => {
            if (val !== top && !st.seen.includes(val)) st.seen.push(val);
            ctx.save();
            await apply(val, 200);
            progress();
          },
        });
        ctx.panel.append(rng, table);
        await apply(start, 600);
        progress();
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        const solved = !!saved.solved;
        const xf = (extra) => ({
          axis: xferAxis,
          vals: v.values,
          dots: false,
          look: () => "x",
          transfer: { done: solved, cue: false, ...extra },
        });
        ctx.say(T.transferSay);
        ctx.expr("");
        if (solved) ctx.feedback(T.transferOk);
        const shown = view(ctx, xf({}), solved ? 0 : 500);
        const kinds = [
          { kind: "less", label: T.classOption(T.lessSpread), correct: true },
          { kind: "more", label: T.classOption(T.moreSpread) },
          { kind: "same", label: T.sameOption },
        ];
        const options = placeCorrect(kinds, sum(v.values) + 3);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.cueClass(opt.kind), "cue");
              view(ctx, xf({ cue: opt.kind !== "same" }), 250);
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              await view(ctx, { ...xf({}), transfer: { done: true, cue: false } }, 500);
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
