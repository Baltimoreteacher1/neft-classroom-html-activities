// living/ratio-compare.js — two ratios, one common amount (lesson 3-5).
//
// Each mix is two bars built from equal batches: the second amount (milk) on
// top, the first amount (cocoa) below. The batches are the same elements in
// every scene — one batch each in the situation, more and more as the student
// matches the milk, and the same bars reused for the transfer mix. A dashed
// guide shows whether the two milk bars end together; once they do, the cocoa
// bars are compared by length and the extra piece is outlined.
//
// Config (3-5 authors Chef Reyes 3 : 5 against Chef Tran 4 : 7, cocoa to milk,
// and the pens at Store A 6 : 2 against Store B 12 : 3 as the transfer):
//   { first:{name,a,b}, second:{name,a,b}, labelA, labelB, tagA, tagB, moneyA,
//     goal:"more"|"less", question, verdict, story, transfer:{ …same… } }
// Every number and line of text comes from ratio-compare-model.js (pure, tested).

import {
  commonTerm,
  H,
  matchedChoices,
  placeCorrect,
  qty,
  ratioCompareCopy,
  validateRatioCompare,
  W,
  whichChoices,
} from "./ratio-compare-model.js";

export { validateRatioCompare };

const X0 = 10;
const BAR = 300; // pixels for the longest bar
const ROW_Y = [26, 150];

export function buildRatioComparePlay(cfg) {
  const v = validateRatioCompare(cfg);
  if (!v) return null;
  const copy = ratioCompareCopy(v);
  const sets = { m: v, t: v.transfer };
  const terms = {
    m: commonTerm(v.first, v.second),
    t: commonTerm(v.transfer.first, v.transfer.second),
  };
  const pool = ["first", "second"].map((k) =>
    Math.max(terms.m.L / v[k].b, terms.t.L / v.transfer[k].b),
  );
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
        "font-size": 18,
        "font-weight": 700,
        "text-anchor": "start",
        fill: "var(--lsx-ink)",
        ...more,
      });
    const seg = (fill, edge) =>
      el("rect", {
        x: 0,
        y: 0,
        width: 0,
        height: 28,
        rx: 4,
        fill,
        stroke: edge,
        "stroke-width": 2,
      });
    cast = {
      rows: pool.map((n) => ({
        name: text({ x: X0, "font-size": 19 }),
        milk: Array.from({ length: n }, () => seg("var(--lsx-u)", "var(--lsx-u-edge)")),
        cocoa: Array.from({ length: n }, () => seg("var(--lsx-x)", "var(--lsx-x-edge)")),
        milkLbl: text({
          fill: "var(--lsx-lo)",
          stroke: "var(--lsx-card)",
          "stroke-width": 5,
          "paint-order": "stroke",
        }),
        cocoaLbl: text({
          fill: "var(--lsx-hi)",
          stroke: "var(--lsx-card)",
          "stroke-width": 5,
          "paint-order": "stroke",
        }),
      })),
      guide: el("line", {
        x1: 0,
        x2: 0,
        y1: 0,
        y2: 0,
        stroke: "var(--lsx-ink)",
        "stroke-width": 3,
        "stroke-dasharray": "6 5",
      }),
      diff: el("rect", {
        x: 0,
        y: 0,
        width: 0,
        height: 32,
        rx: 4,
        fill: "none",
        stroke: "var(--lsx-ink)",
        "stroke-width": 3,
        "stroke-dasharray": "5 4",
      }),
    };
  }

  /**
   * The stage for one mix pair. set: "m" | "t". n: batches of each mix.
   * guide: "milk" | "cocoa" | null. diff: outline the extra cocoa.
   */
  function view(ctx, set, { n = [1, 1], guide = null, diff = false }) {
    const s = sets[set];
    const c = terms[set];
    const unit = BAR / Math.max(c.L, c.mF, c.mS);
    const m = [];
    const put = (node, attrs, show) => m.push([node, { ...attrs, opacity: show ? 1 : 0 }]);
    const mixes = [s.first, s.second];
    const ends = { milk: [], cocoa: [] };
    cast.rows.forEach((r, i) => {
      const mx = mixes[i];
      const y0 = ROW_Y[i];
      const live = n[i];
      put(r.name, { y: y0, text: `${ctx.L(mx.name)} · ${mx.a} : ${mx.b}` }, true);
      r.milk.forEach((rect, j) =>
        put(rect, { x: X0 + j * mx.b * unit, y: y0 + 10, width: mx.b * unit - 3 }, j < live),
      );
      r.cocoa.forEach((rect, j) =>
        put(rect, { x: X0 + j * mx.a * unit, y: y0 + 48, width: mx.a * unit - 3 }, j < live),
      );
      const mEnd = X0 + live * mx.b * unit;
      const cEnd = X0 + live * mx.a * unit;
      ends.milk.push(mEnd);
      ends.cocoa.push(cEnd);
      put(
        r.milkLbl,
        {
          x: mEnd + 8,
          y: y0 + 31,
          text: `${live * mx.b} ${ctx.L(s.tagB)}`.trim(),
        },
        true,
      );
      put(
        r.cocoaLbl,
        {
          x: cEnd + 8,
          y: y0 + 69,
          text: s.moneyA ? `$${live * mx.a}` : `${live * mx.a} ${ctx.L(s.tagA)}`,
        },
        true,
      );
    });
    const gx = guide === "milk" ? ends.milk[0] - 1.5 : Math.min(...ends.cocoa) - 1.5;
    const gy = guide === "milk" ? [ROW_Y[0] + 4, ROW_Y[1] + 42] : [ROW_Y[0] + 44, ROW_Y[1] + 82];
    put(cast.guide, { x1: gx, x2: gx, y1: gy[0], y2: gy[1] }, Boolean(guide));
    const longer = ends.cocoa[0] > ends.cocoa[1] ? 0 : 1;
    const lo = Math.min(...ends.cocoa);
    put(
      cast.diff,
      {
        x: lo,
        y: ROW_Y[longer] + 46,
        width: Math.max(0, Math.max(...ends.cocoa) - lo - 3),
      },
      diff,
    );
    return m;
  }

  const names = (s) => [s.first.name, s.second.name];
  const sliderRow = (ctx, st, k, max, onChange) =>
    ctx.range({
      label: copy.match.sliderLabel(k),
      min: 1,
      max,
      value: st[k === "first" ? "nF" : "nS"],
      onInput: onChange,
    });

  const scenes = [
    {
      id: "situate",
      label: { en: "Two recipes", es: "Dos recetas" },
      async enter(ctx) {
        await ctx.tween(view(ctx, "m", { n: [1, 1] }), 500);
        ctx.expr("");
        ctx.say(copy.situate);
      },
    },
    {
      id: "predict",
      label: { en: "Predict", es: "Predice" },
      gate: true,
      async enter(ctx, saved) {
        await ctx.tween(view(ctx, "m", { n: [1, 1] }), 300);
        ctx.expr("");
        ctx.say(copy.predict.say);
        const [a, b] = names(v);
        const label = { first: a, second: b, same: { en: "They are the same", es: "Son iguales" } };
        const options = placeCorrect(whichChoices(v), v.first.a + v.second.b).map((o) => ({
          ...o,
          label: label[o.key],
          cue: copy.predict.cues[o.kind],
        }));
        ctx.panel.appendChild(
          ctx.choices({
            question: v.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              await ctx.tween(view(ctx, "m", { n: [1, 1], guide: "milk" }), 300);
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(copy.predict.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "match",
      label: { en: "Match the amount", es: "Iguala la cantidad" },
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        const c = terms.m;
        st.nF = Number.isInteger(st.nF) && st.nF >= 1 && st.nF <= c.fF ? st.nF : 1;
        st.nS = Number.isInteger(st.nS) && st.nS >= 1 && st.nS <= c.fS ? st.nS : 1;
        const matched = () => st.nF === c.fF && st.nS === c.fS;
        const show = async (ms) => {
          await ctx.tween(
            view(ctx, "m", { n: [st.nF, st.nS], guide: matched() ? null : "milk" }),
            ms,
          );
          ctx.expr("");
          if (matched()) {
            ctx.feedback(copy.match.done);
            ctx.unlock();
          } else ctx.feedback(copy.match.status(st.nF, st.nS), "cue");
          ctx.save();
        };
        ctx.panel.append(
          sliderRow(ctx, st, "first", c.fF, (n) => {
            st.nF = n;
            show(350);
          }),
          sliderRow(ctx, st, "second", c.fS, (n) => {
            st.nS = n;
            show(350);
          }),
        );
        ctx.say(copy.match.say);
        await show(300);
      },
    },
    {
      id: "compare",
      label: { en: "Compare", es: "Compara" },
      async enter(ctx) {
        const c = terms.m;
        await ctx.tween(view(ctx, "m", { n: [c.fF, c.fS], guide: "cocoa", diff: true }), 500);
        ctx.expr(escapeLt(copy.compare.rows, ctx));
        ctx.say(copy.compare.say);
      },
    },
    {
      id: "transfer",
      label: { en: "On your own", es: "Por tu cuenta" },
      async enter(ctx, saved) {
        const t = v.transfer;
        const c = terms.t;
        const solved = Boolean(saved.solved);
        await ctx.tween(
          solved
            ? view(ctx, "t", { n: [c.fF, c.fS], guide: "cocoa", diff: true })
            : view(ctx, "t", { n: [1, 1] }),
          solved ? 0 : 400,
        );
        ctx.expr("");
        ctx.say(copy.transfer.say);
        const options = placeCorrect(matchedChoices(t), t.second.a + t.first.b).map((o) => ({
          ...o,
          label: { en: qty(t, o.n, "A", "en"), es: qty(t, o.n, "A", "es") },
          cue: copy.transfer.cues[o.kind],
        }));
        ctx.panel.append(
          ctx.choices({
            question: copy.transfer.question,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(view(ctx, "t", { n: [c.fF, c.fS], guide: "cocoa", diff: true }), 700);
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

/** The expression line is HTML: escape the pair's text for the current language. */
function escapeLt(pair, ctx) {
  return ctx.L(pair).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
