// living/unit-rate.js — a rate becomes "per 1" by dividing both numbers (3-2, 3-8).
//
// One cast for the whole play: a double number line (top: the first quantity,
// bottom: the second) whose tick marks keep their identity from scene to scene
// — the deal's far tick stays the same tick when the mark for 1 appears beside
// 0, when the student walks the line to other quantities, and when the same
// line is reused for the transfer deal. Small deals (up to 8 items) are drawn
// to scale with equal jumps; large ones (500 tokens) are drawn with a break
// and say so, because a mark for 1 beside a mark for 500 cannot be to scale.
// A second "price bars" view puts two deals of different sizes side by side
// by their price for ONE.
//
// Config (3-2 authors $3 for 5 games; 3-8 authors 500 tokens for $60):
//   { total, units, money, totalLabel, unitOne, unitMany, story, stops?,
//     nameA?, compare?:{name, total, units}, transfer:{ …a second deal… } }
// Every number and line of text comes from unit-rate-model.js (pure, tested).

import { escHtml } from "../../core/living-scene.js";
import {
  choiceLabel,
  H,
  MAX_SLOTS,
  numText,
  placeAway,
  rateChoices,
  unitRateCopy,
  validateUnitRate,
  W,
} from "./unit-rate-model.js";

export { validateUnitRate };

const X0 = 112;
const X1 = W - 26;
const Y = { top: 92, bot: 178 };
const hi = (s) => `<span class="lsx-hi">${escHtml(String(s))}</span>`;
const lo = (s) => `<span class="lsx-lo">${escHtml(String(s))}</span>`;
const group = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export function buildUnitRatePlay(cfg) {
  const v = validateUnitRate(cfg);
  if (!v) return null;
  const copy = unitRateCopy(v);
  const cmp = copy.compareCopy;
  const rival = v.compare;
  const markerId = `lsx-ur-${Math.random().toString(36).slice(2, 8)}`;
  let cast = null;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const defs = svgEl("defs", {}, svg);
    const mk = svgEl(
      "marker",
      {
        id: markerId,
        viewBox: "0 0 10 10",
        refX: 8,
        refY: 5,
        markerWidth: 6,
        markerHeight: 6,
        orient: "auto",
      },
      defs,
    );
    svgEl("path", { d: "M0 0 L10 5 L0 10 z", fill: "var(--lsx-ink)" }, mk);
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs) => svgEl(tag, { opacity: 0, ...attrs }, g);
    const text = (more) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 16,
        "font-weight": 700,
        fill: "var(--lsx-ink)",
        x: 0,
        y: 0,
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
    const halo = { stroke: "var(--lsx-card)", "stroke-width": 5, "paint-order": "stroke" };
    const slots = Array.from({ length: MAX_SLOTS }, () => ({
      tTop: line({ "stroke-width": 3 }),
      tBot: line({ "stroke-width": 3 }),
      link: line({
        stroke: "var(--lsx-rule-strong)",
        "stroke-dasharray": "4 4",
        "stroke-width": 2,
      }),
      nTop: text({ fill: "var(--lsx-hi)", "font-size": 17 }),
      nBot: text({ fill: "var(--lsx-lo)", "font-size": 17 }),
    }));
    const arrow = () => ({
      path: el("path", {
        d: "M0 0",
        fill: "none",
        stroke: "var(--lsx-ink)",
        "stroke-width": 2.5,
        "marker-end": `url(#${markerId})`,
      }),
      label: text({ "font-size": 17, ...halo }),
    });
    cast = {
      col: el("rect", {
        x: 0,
        y: 46,
        width: 56,
        height: 176,
        rx: 8,
        fill: "none",
        stroke: "var(--lsx-ink)",
        "stroke-width": 3,
        "stroke-dasharray": "7 5",
      }),
      lineTop: line({ x1: X0 - 6, x2: X1 + 6, y1: Y.top, y2: Y.top, "stroke-width": 3 }),
      lineBot: line({ x1: X0 - 6, x2: X1 + 6, y1: Y.bot, y2: Y.bot, "stroke-width": 3 }),
      lblTop: text({ x: 6, y: Y.top + 5, "text-anchor": "start", fill: "var(--lsx-hi)" }),
      lblBot: text({ x: 6, y: Y.bot + 5, "text-anchor": "start", fill: "var(--lsx-lo)" }),
      slots,
      brTop: Array.from({ length: MAX_SLOTS - 1 }, () => text({ "font-size": 22, ...halo })),
      brBot: Array.from({ length: MAX_SLOTS - 1 }, () => text({ "font-size": 22, ...halo })),
      jumps: Array.from({ length: MAX_SLOTS - 1 }, () =>
        text({ "font-size": 15, fill: "var(--lsx-lo)" }),
      ),
      scaleNote: text({
        x: (X0 + X1) / 2,
        y: 128,
        "font-size": 13,
        "font-weight": 600,
        fill: "var(--lsx-muted)",
      }),
      dTop: el("circle", {
        cx: 0,
        cy: Y.top,
        r: 9,
        fill: "var(--lsx-x)",
        stroke: "var(--lsx-x-edge)",
        "stroke-width": 3,
      }),
      dBot: el("circle", {
        cx: 0,
        cy: Y.bot,
        r: 9,
        fill: "var(--lsx-u)",
        stroke: "var(--lsx-u-edge)",
        "stroke-width": 3,
      }),
      opTop: arrow(),
      opBot: arrow(),
      rows: [0, 1].map(() => ({
        name: text({ x: 14, "text-anchor": "start", "font-size": 17 }),
        bar: el("rect", {
          x: 14,
          y: 0,
          width: 0,
          height: 28,
          rx: 5,
          fill: "var(--lsx-u)",
          stroke: "var(--lsx-u-edge)",
          "stroke-width": 3,
        }),
        per: text({ x: 14, "text-anchor": "start", "font-size": 19, fill: "var(--lsx-lo)" }),
      })),
    };
  }

  /**
   * The double number line for one deal. vis: tick values to show; dot: the
   * value the marker sits on; op: {from, to, label} arrow; jumps: label each
   * equal step; col: ring the deal's far tick.
   */
  function line(ctx, d, { vis, dot = null, op = null, jumps = false, col = false }) {
    const m = [];
    const put = (node, attrs, show) => m.push([node, { ...attrs, opacity: show ? 1 : 0 }]);
    const k = vis.length;
    const xAt = (val) => {
      const i = vis.indexOf(val);
      return X0 + 8 + (i * (X1 - X0 - 16)) / (k - 1);
    };
    d.ticks.forEach((val, s) => {
      const sl = cast.slots[s];
      const show = vis.includes(val);
      const x = show ? xAt(val) : X0 + 8;
      put(sl.tTop, { x1: x, x2: x, y1: Y.top - 9, y2: Y.top + 9 }, show);
      put(sl.tBot, { x1: x, x2: x, y1: Y.bot - 9, y2: Y.bot + 9 }, show);
      put(sl.link, { x1: x, x2: x, y1: Y.top + 12, y2: Y.bot - 12 }, show);
      put(sl.nTop, { x, y: Y.top - 18, text: group(val) }, show);
      put(
        sl.nBot,
        { x, y: Y.bot + 30, text: (d.money ? "$" : "") + numText(val * d.rateH, d.money) },
        show,
      );
    });
    for (let s = d.ticks.length; s < MAX_SLOTS; s++) {
      const sl = cast.slots[s];
      for (const n of Object.values(sl)) put(n, {}, false);
    }
    let broken = false;
    for (let i = 0; i < MAX_SLOTS - 1; i++) {
      const gap = !toScale(d) && i < k - 1 && vis[i + 1] - vis[i] > 1;
      broken ||= gap;
      const x = gap ? (xAt(vis[i]) + xAt(vis[i + 1])) / 2 : X0;
      put(cast.brTop[i], { x, y: Y.top + 7, text: "//" }, gap);
      put(cast.brBot[i], { x, y: Y.bot + 7, text: "//" }, gap);
      const step = i < k - 1 && vis[i + 1] - vis[i] === 1;
      put(
        cast.jumps[i],
        { x: step ? (xAt(vis[i]) + xAt(vis[i + 1])) / 2 : X0, y: 140, text: copy.connect.jump(1) },
        jumps && step,
      );
    }
    put(cast.scaleNote, { text: ctx.L({ en: "not to scale", es: "sin escala" }) }, broken);
    put(cast.lineTop, {}, true);
    put(cast.lineBot, {}, true);
    put(cast.lblTop, { text: ctx.L(d.unitMany) }, true);
    put(cast.lblBot, { text: ctx.L(d.totalLabel) }, true);
    const dx = dot == null ? X0 : xAt(dot);
    put(cast.dTop, { cx: dx }, dot != null);
    put(cast.dBot, { cx: dx }, dot != null);
    put(cast.col, { x: xAt(d.units) - 28 }, col);
    const arrowAt = (a, edge, label) => {
      if (!op) return put(a.path, {}, false), put(a.label, {}, false);
      const x1 = xAt(op.from);
      const x2 = xAt(op.to);
      const top = edge === "top";
      const y0 = top ? Y.top - 40 : Y.bot + 42;
      const ctl = top ? y0 - 36 : y0 + 36;
      m.push([a.path, { d: `M${x1} ${y0} Q${(x1 + x2) / 2} ${ctl} ${x2} ${y0}`, opacity: 1 }]);
      put(a.label, { x: (x1 + x2) / 2, y: top ? y0 - 26 : y0 + 39, text: label }, true);
    };
    arrowAt(cast.opTop, "top", op?.label);
    arrowAt(cast.opBot, "bot", op?.label);
    for (const r of cast.rows) for (const n of Object.values(r)) put(n, {}, false);
    return m;
  }

  /** The two deals as price bars: length = the price of ONE. */
  function bars(ctx, { solved }) {
    const m = [];
    const put = (node, attrs, show) => m.push([node, { ...attrs, opacity: show ? 1 : 0 }]);
    const top = Math.max(v.rateH, rival.rateH);
    cast.slots.forEach((sl) => {
      for (const n of Object.values(sl)) put(n, {}, false);
    });
    for (const n of [
      cast.lineTop,
      cast.lineBot,
      cast.lblTop,
      cast.lblBot,
      cast.dTop,
      cast.dBot,
      cast.col,
      cast.scaleNote,
    ])
      put(n, {}, false);
    for (const n of [...cast.brTop, ...cast.brBot, ...cast.jumps]) put(n, {}, false);
    for (const a of [cast.opTop, cast.opBot]) put(a.path, {}, false), put(a.label, {}, false);
    cast.rows.forEach((r, i) => {
      const key = i === 0 ? "A" : "B";
      const d = i === 0 ? v : rival;
      const y = 40 + i * 100;
      put(r.name, { y, text: ctx.L(cmp.rows[key]) }, true);
      put(r.bar, { y: y + 14, width: solved ? Math.max(8, (380 * d.rateH) / top) : 0 }, solved);
      put(r.per, { y: y + 66, text: ctx.L(cmp.barLabel(key)) }, solved);
    });
    return m;
  }

  const money = v.money;
  const price = (n) => (money ? "$" : "") + numText(n, money);
  // A small deal is drawn to scale, every whole step; a big one gets a mark for 1 and a break.
  const toScale = (d) => d.units <= 8 && d.ticks.every((x, i) => x === i);
  const half = (d) => (toScale(d) ? d.ticks : [0, 1, d.units]);
  const wrong = (d, copyBlock, seed) =>
    placeAway(rateChoices(d), seed).map((o) => ({
      ...o,
      label: choiceLabel(o),
      cue: copyBlock.cues[o.kind],
    }));

  const scenes = [
    {
      id: "situate",
      label: { en: "The deal", es: "La oferta" },
      async enter(ctx) {
        await ctx.tween(line(ctx, v, { vis: [0, v.units] }), 500);
        ctx.expr(`${hi(ctx.L(copy.dealText))}`);
        ctx.say(copy.situate);
      },
    },
    {
      id: "predict",
      label: { en: "Predict", es: "Predice" },
      gate: true,
      async enter(ctx, saved) {
        const done = () =>
          line(ctx, v, {
            vis: half(v),
            op: { from: v.units, to: 1, label: `÷ ${group(v.units)}` },
          });
        await ctx.tween(
          saved.solved ? done() : line(ctx, v, { vis: [0, v.units] }),
          saved.solved ? 0 : 300,
        );
        ctx.expr(`${hi(ctx.L(copy.dealText))}`);
        ctx.say(copy.predict.say);
        const options = wrong(v, copy.predict, v.units + v.totalH);
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.predict.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              await ctx.tween(line(ctx, v, { vis: [0, v.units], col: opt.kind === "whole" }), 300);
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(done(), 700);
              ctx.expr(`${lo(ctx.L(copy.ratePhrase))}`);
              ctx.feedback(copy.predict.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "use",
      label: { en: "Use the rate", es: "Usa la tasa" },
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        st.tried = Array.isArray(st.tried) ? st.tried.filter((n) => v.stops.includes(n)) : [];
        const need = Math.min(3, v.stops.length);
        const place = async (n, ms) => {
          const op = n > 1 ? { from: 1, to: n, label: `× ${group(n)}` } : null;
          await ctx.tween(line(ctx, v, { vis: v.ticks, dot: n, op }), ms);
          ctx.expr(`${hi(group(n))} × ${lo(price(v.rateH))} = ${lo(price(n * v.rateH))}`);
          ctx.say(copy.use.line(n));
          if (st.tried.length >= need && st.tried.includes(1)) {
            ctx.feedback(copy.use.done);
            ctx.unlock();
          } else ctx.feedback(copy.use.progress(st.tried.length, need), "cue");
          ctx.save();
        };
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", ctx.L({ en: "Quantity", es: "Cantidad" }));
        const btns = v.stops.map((n) => {
          const b = ctx.button({
            label: copy.use.button(n),
            onClick: async () => {
              for (const x of btns) x.setAttribute("aria-pressed", String(x === b));
              if (!st.tried.includes(n)) st.tried.push(n);
              st.last = n;
              await place(n, 500);
            },
          });
          b.setAttribute("aria-pressed", String(st.last === n));
          return b;
        });
        row.append(...btns);
        ctx.panel.appendChild(row);
        await ctx.tween(line(ctx, v, { vis: v.ticks }), 300);
        ctx.say(copy.use.say);
        ctx.expr(`${lo(ctx.L(copy.ratePhrase))}`);
        if (st.tried.length >= need && st.tried.includes(1)) {
          ctx.feedback(copy.use.done);
          ctx.unlock();
        } else ctx.feedback(copy.use.progress(st.tried.length, need), "cue");
      },
    },
    {
      id: "connect",
      label: { en: "Divide both", es: "Divide los dos" },
      async enter(ctx) {
        const small = toScale(v);
        await ctx.tween(
          line(ctx, v, {
            vis: half(v),
            op: { from: v.units, to: 1, label: `÷ ${group(v.units)}` },
            jumps: small,
          }),
          600,
        );
        ctx.expr(`${price(v.totalH)} ÷ ${group(v.units)} = ${lo(price(v.rateH))}`);
        ctx.say(copy.connect.say);
      },
    },
    ...(cmp
      ? [
          {
            id: "compare",
            label: { en: "Better buy", es: "Mejor compra" },
            gate: true,
            async enter(ctx, saved) {
              await ctx.tween(bars(ctx, { solved: Boolean(saved.solved) }), saved.solved ? 0 : 500);
              ctx.expr(saved.solved ? cmp.expr : "");
              ctx.say(cmp.say);
              const options = cmp.options;
              ctx.panel.appendChild(
                ctx.choices({
                  question: cmp.question,
                  options,
                  restore: saved.solved ? options.findIndex((o) => o.correct) : null,
                  onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
                  onCorrect: async () => {
                    ctx.state.solved = true;
                    ctx.save();
                    await ctx.tween(bars(ctx, { solved: true }), 700);
                    ctx.expr(cmp.expr);
                    ctx.feedback(cmp.ok);
                    ctx.unlock();
                  },
                }),
              );
            },
          },
        ]
      : []),
    {
      id: "transfer",
      label: { en: "On your own", es: "Por tu cuenta" },
      async enter(ctx, saved) {
        const t = v.transfer;
        const solvedView = () =>
          line(ctx, t, {
            vis: half(t),
            op: { from: t.units, to: 1, label: `÷ ${group(t.units)}` },
          });
        await ctx.tween(
          saved.solved ? solvedView() : line(ctx, t, { vis: [0, t.units] }),
          saved.solved ? 0 : 400,
        );
        ctx.expr(`${hi(ctx.L(copy.tdealText))}`);
        ctx.say(copy.transferCopy.say);
        const options = wrong(t, copy.transferCopy, t.units + t.totalH);
        ctx.panel.append(
          ctx.choices({
            question: copy.transferCopy.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              await ctx.tween(line(ctx, t, { vis: [0, t.units], col: opt.kind === "whole" }), 300);
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(solvedView(), 700);
              ctx.expr(`${lo(ctx.L(copy.perOneT))}`);
              ctx.feedback(copy.transferCopy.ok);
            },
          }),
          ctx.frame({ label: copy.transferCopy.explain, frame: copy.transferCopy.frame }),
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
