// living/ratio-equiv.js — the same factor on BOTH numbers (lesson 3-9).
//
// One cast for the whole play: a two-row ratio table (the recipe and the new
// row), the arrows that carry a factor from one row to the other, and two mix
// strips. The factor arrow is found by dividing (32 people ÷ 8 people), is
// then set on each ingredient separately — equal factors keep the strips'
// boundaries lined up, unequal ones shift them — and is finally read back as a
// check: equivalent ratios have the same factor between corresponding terms.
//
// Config (3-9 authors the soup, 3 : 2 serving 8 scaled to serve 32, and the
// weDo 2 : 5 = ? : 15): { a, b, from, to, labelA, labelB, labelS, story,
// transfer:{ a, b, second, story } }. Every number and line of text comes from
// ratio-equiv-model.js (pure, tested); this file only stages it.

import { escHtml } from "../../core/living-scene.js";
import {
  factorChoices,
  H,
  MAX_FACTOR,
  missingChoices,
  placeAway,
  ratioEquivCopy,
  validateRatioEquiv,
  W,
} from "./ratio-equiv-model.js";

export { validateRatioEquiv };

const COLS = { main: [72, 206, 340], transfer: [null, 138, 300] };
const ROW = { head: 38, r0: 78, r1: 122 };
const STRIP = { x: 6, w: 428, h: 26, baseY: 180, newY: 234 };
const hi = (s) => `<span class="lsx-hi">${escHtml(String(s))}</span>`;
const lo = (s) => `<span class="lsx-lo">${escHtml(String(s))}</span>`;
const mixHtml = (x, y) => `${hi(x)} : ${lo(y)}`;

export function buildRatioEquivPlay(cfg) {
  const v = validateRatioEquiv(cfg);
  if (!v) return null;
  const copy = ratioEquivCopy(v);
  const { a, b, from, to, k, labelS: S, labelA: A, labelB: B } = v;
  const t = v.transfer;
  const card = copy.card;
  let cast = null;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const defs = svgEl("defs", {}, svg);
    const markerId = `lsx-eq-${Math.random().toString(36).slice(2, 8)}`;
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
        x: 0,
        y: 0,
        "text-anchor": "middle",
        "font-size": 22,
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
    const halo = { stroke: "var(--lsx-card)", "stroke-width": 5, "paint-order": "stroke" };
    const seg = (fill, edge) =>
      el("rect", {
        x: 0,
        y: 0,
        width: 0,
        height: STRIP.h,
        rx: 4,
        fill,
        stroke: edge,
        "stroke-width": 2,
      });
    const strip = () => ({
      label: text({ "font-size": 18, "text-anchor": "start", x: STRIP.x }),
      A: seg("var(--lsx-x)", "var(--lsx-x-edge)"),
      B: seg("var(--lsx-u)", "var(--lsx-u-edge)"),
      nA: text({ "font-size": 18, fill: "var(--lsx-on-x)" }),
      nB: text({ "font-size": 18 }),
    });
    cast = {
      bg: el("rect", {
        x: 6,
        y: 14,
        width: 428,
        height: 126,
        rx: 6,
        fill: "var(--lsx-card)",
        stroke: "var(--lsx-ink)",
        "stroke-width": 2,
      }),
      hLines: [
        line({ x1: 6, x2: 434, y1: 50, y2: 50 }),
        line({ x1: 6, x2: 434, y1: 92, y2: 92, stroke: "var(--lsx-rule)" }),
      ],
      vLines: [0, 1].map(() => line({ y1: 14, y2: 140, stroke: "var(--lsx-rule-strong)" })),
      head: [0, 1, 2].map((i) =>
        text({ "font-size": 18, fill: ["var(--lsx-ink)", "var(--lsx-hi)", "var(--lsx-lo)"][i] }),
      ),
      r0: [0, 1, 2].map((i) =>
        text({ fill: ["var(--lsx-ink)", "var(--lsx-hi)", "var(--lsx-lo)"][i] }),
      ),
      r1: [0, 1, 2].map((i) =>
        text({ fill: ["var(--lsx-ink)", "var(--lsx-hi)", "var(--lsx-lo)"][i] }),
      ),
      arrows: [0, 1, 2].map(() => ({
        path: el("path", {
          d: "M0 0",
          fill: "none",
          stroke: "var(--lsx-ink)",
          "stroke-width": 2.5,
          "marker-end": `url(#${markerId})`,
        }),
        label: text({ "font-size": 18, "text-anchor": "start", ...halo }),
      })),
      base: strip(),
      next: strip(),
      guide: line({ "stroke-width": 3, "stroke-dasharray": "6 5" }),
    };
  }

  /**
   * One frame. mode: main | transfer. r0 / r1: three cell strings (null = hidden). arrows: three
   * {label, dir} (null = none). base / next: mix strips {x, y, label} (null = hidden).
   */
  function view(
    ctx,
    { mode = "main", r0, r1, arrows = [null, null, null], base = null, next = null, heads },
  ) {
    const cx = COLS[mode];
    const m = [];
    const put = (node, attrs, show) => m.push([node, { ...attrs, opacity: show ? 1 : 0 }]);
    put(cast.bg, {}, true);
    put(cast.hLines[0], {}, true);
    put(cast.hLines[1], {}, true);
    const bounds = mode === "main" ? [139, 273] : [219, 219];
    cast.vLines.forEach((l, i) =>
      put(l, { x1: bounds[i], x2: bounds[i] }, mode === "main" || i === 0),
    );
    [0, 1, 2].forEach((i) => {
      const x = cx[i] ?? 0;
      const live = cx[i] != null;
      put(cast.head[i], { x, y: ROW.head, text: heads[i] ? ctx.L(heads[i]) : "" }, live);
      put(cast.r0[i], { x, y: ROW.r0, text: r0[i] ?? "" }, live && r0[i] != null);
      put(cast.r1[i], { x, y: ROW.r1, text: r1[i] ?? "" }, live && r1[i] != null);
      const ar = arrows[i];
      const ax = x + 36;
      const [y0, y1] = ar?.dir === "up" ? [ROW.r1 - 8, ROW.r0 - 14] : [ROW.r0 - 14, ROW.r1 - 8];
      m.push([
        cast.arrows[i].path,
        { d: `M${ax} ${y0} Q${ax + 26} ${(y0 + y1) / 2} ${ax} ${y1}`, opacity: ar && live ? 1 : 0 },
      ]);
      put(
        cast.arrows[i].label,
        { x: ax + 20, y: (ROW.r0 + ROW.r1) / 2 - 2 + 6, text: ar?.label ?? "" },
        Boolean(ar) && live,
      );
    });
    const stripMoves = (s, spec, y) => {
      const show = Boolean(spec);
      const total = spec ? spec.x + spec.y : 1;
      const wA = spec ? (STRIP.w * spec.x) / total : 0;
      put(s.label, { y: y - 8, text: spec ? spec.label : "" }, show);
      put(s.A, { x: STRIP.x, y, width: wA }, show);
      put(s.B, { x: STRIP.x + wA, y, width: spec ? STRIP.w - wA : 0 }, show);
      put(s.nA, { x: STRIP.x + wA / 2, y: y + 19, text: spec ? String(spec.x) : "" }, show);
      put(
        s.nB,
        {
          x: STRIP.x + wA + (spec ? STRIP.w - wA : 0) / 2,
          y: y + 19,
          text: spec ? String(spec.y) : "",
        },
        show,
      );
    };
    stripMoves(cast.base, base, STRIP.baseY);
    stripMoves(cast.next, next, STRIP.newY);
    const gx = base ? STRIP.x + (STRIP.w * base.x) / (base.x + base.y) : 0;
    put(
      cast.guide,
      { x1: gx, x2: gx, y1: STRIP.baseY - 4, y2: STRIP.newY + STRIP.h + 6 },
      Boolean(base && next),
    );
    return m;
  }

  const heads = [S, A, B];
  const baseStrip = (ctx) => ({
    x: a,
    y: b,
    label: `${ctx.L(A)} : ${ctx.L(B)} = ${a} : ${b}`,
  });
  const nextStrip = (ctx, x, y) => ({ x, y, label: `${ctx.L(A)} : ${ctx.L(B)} = ${x} : ${y}` });
  const q = "?";
  const asOptions = (list, cues, seed) =>
    placeAway(list, seed).map((o) => ({ ...o, label: String(o.n), cue: cues[o.kind] }));

  const scenes = [
    {
      id: "situate",
      label: { en: "The recipe", es: "La receta" },
      async enter(ctx) {
        await ctx.tween(
          view(ctx, { heads, r0: [from, a, b], r1: [to, q, q], base: baseStrip(ctx) }),
          500,
        );
        ctx.expr(mixHtml(a, b));
        ctx.say(copy.situate);
      },
    },
    {
      id: "predict",
      label: { en: "Predict", es: "Predice" },
      gate: true,
      async enter(ctx, saved) {
        const plain = () =>
          view(ctx, { heads, r0: [from, a, b], r1: [to, q, q], base: baseStrip(ctx) });
        const solved = () =>
          view(ctx, {
            heads,
            r0: [from, a, b],
            r1: [to, q, q],
            arrows: [{ label: `× ${k}`, dir: "down" }, null, null],
            base: baseStrip(ctx),
          });
        await ctx.tween(saved.solved ? solved() : plain(), saved.solved ? 0 : 300);
        ctx.expr(`${to} ÷ ${from} = ?`);
        ctx.say(copy.predict.say);
        const options = asOptions(factorChoices(from, to), copy.predict.cues, from + to + k);
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.predict.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(solved(), 600);
              ctx.expr(`${to} ÷ ${from} = ${k}`);
              ctx.feedback(copy.predict.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "scale",
      label: { en: "Scale both", es: "Escala los dos" },
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        const okF = (n) => Number.isInteger(n) && n >= 1 && n <= MAX_FACTOR;
        st.x = okF(st.x) ? st.x : 1;
        st.y = okF(st.y) ? st.y : 1;
        st.saw = Boolean(st.saw);
        const show = async (ms) => {
          const same = st.x === st.y;
          if (!same) st.saw = true;
          await ctx.tween(
            view(ctx, {
              heads,
              r0: [from, a, b],
              r1: [same ? from * st.x : "—", a * st.x, b * st.y],
              arrows: [
                same ? { label: `× ${st.x}`, dir: "down" } : null,
                { label: `× ${st.x}`, dir: "down" },
                { label: `× ${st.y}`, dir: "down" },
              ],
              base: baseStrip(ctx),
              next: nextStrip(ctx, a * st.x, b * st.y),
            }),
            ms,
          );
          ctx.expr(mixHtml(a * st.x, b * st.y));
          if (same && st.x === k && st.saw) {
            ctx.feedback(copy.scale.done);
            ctx.unlock();
          } else if (same && st.x === k) ctx.feedback(copy.scale.progress(false), "cue");
          else ctx.feedback(copy.scale.status(st.x, st.y), "cue");
          ctx.save();
        };
        ctx.panel.append(
          ctx.range({
            label: copy.scale.labelA,
            min: 1,
            max: MAX_FACTOR,
            value: st.x,
            onInput: (n) => {
              st.x = n;
              show(300);
            },
          }),
          ctx.range({
            label: copy.scale.labelB,
            min: 1,
            max: MAX_FACTOR,
            value: st.y,
            onInput: (n) => {
              st.y = n;
              show(300);
            },
          }),
        );
        ctx.say(copy.scale.say);
        await show(300);
      },
    },
    {
      id: "connect",
      label: { en: "Multiply, divide, check", es: "Multiplica, divide, comprueba" },
      async enter(ctx) {
        await ctx.tween(
          view(ctx, {
            heads,
            r0: [from, a, b],
            r1: [to, a * k, b * k],
            arrows: [
              { label: `÷ ${k}`, dir: "up" },
              { label: `÷ ${k}`, dir: "up" },
              { label: `÷ ${k}`, dir: "up" },
            ],
            base: baseStrip(ctx),
            next: nextStrip(ctx, a * k, b * k),
          }),
          600,
        );
        ctx.expr(`${mixHtml(a, b)} = ${mixHtml(a * k, b * k)}`);
        ctx.say(copy.connect.say);
      },
    },
    {
      id: "check",
      label: { en: "Is it equivalent?", es: "¿Es equivalente?" },
      gate: true,
      async enter(ctx, saved) {
        await ctx.tween(
          view(ctx, {
            heads,
            r0: [from, a, b],
            r1: [to, card.a, card.b],
            arrows: [null, { label: `× ${k}`, dir: "down" }, { label: `× ${k - 1}`, dir: "down" }],
            base: baseStrip(ctx),
            next: nextStrip(ctx, card.a, card.b),
          }),
          saved.solved ? 0 : 500,
        );
        ctx.expr(`${mixHtml(a, b)} ?  ${mixHtml(card.a, card.b)}`);
        ctx.say(copy.check.say);
        const options = copy.check.options;
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.check.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(copy.check.ok);
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
        const solved = Boolean(saved.solved);
        const th = [null, copy.transfer.first, copy.transfer.second];
        const both = {
          mode: "transfer",
          heads: th,
          base: { x: t.a, y: t.b, label: `${t.a} : ${t.b}` },
        };
        const before = () => view(ctx, { ...both, r0: [null, t.a, t.b], r1: [null, q, t.second] });
        const after = () =>
          view(ctx, {
            ...both,
            r0: [null, t.a, t.b],
            r1: [null, t.a * t.k, t.second],
            arrows: [null, { label: `× ${t.k}`, dir: "down" }, { label: `× ${t.k}`, dir: "down" }],
            next: { x: t.a * t.k, y: t.second, label: `${t.a * t.k} : ${t.second}` },
          });
        await ctx.tween(solved ? after() : before(), solved ? 0 : 500);
        ctx.expr(`${mixHtml(t.a, t.b)} = ? : ${t.second}`);
        ctx.say(copy.transfer.say);
        const options = asOptions(missingChoices(t), copy.transfer.cues, t.a + t.b + t.k);
        ctx.panel.append(
          ctx.choices({
            question: copy.transfer.question,
            options,
            restore: solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(after(), 600);
              ctx.expr(`${mixHtml(t.a, t.b)} = ${mixHtml(t.a * t.k, t.second)}`);
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
