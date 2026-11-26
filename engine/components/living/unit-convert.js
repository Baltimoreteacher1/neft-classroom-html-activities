// living/unit-convert.js — one length measured in two units.
//
// One cast for the whole play: a double number line (top = the first unit,
// bottom = the second) and ONE bar that reaches down through both. The bar
// never changes when the unit changes; only the number that names it does, by
// the conversion factor. Scenes: the two lines, a prediction, sliding the bar
// stop by stop, the number sentence, the trip back, and a new bar to convert.
//
// Config: { from:{one,many}, to:{one,many}, factor, amount, step, approx,
//           story, verdict, transfer:{...same} } — the lesson's own numbers
// (3-6 authors 4 feet = 48 inches; 3-7 100 km ≈ 60 mi; 3-10 5 feet = 60 inches).
// Every number and sentence comes from unit-convert-model.js (pure, tested).

import { escHtml } from "../../core/living-scene.js";
import {
  convertCopy,
  convH,
  fmt,
  forwardChoices,
  okInt,
  placeNotFirst,
  reverseChoices,
  un,
  validateUnitConvert,
} from "./unit-convert-model.js";

export { validateUnitConvert };

const W = 480;
const H = 310;
const X0 = 40;
const SPAN = 400;
const TOP = 110;
const BOT = 210;
const MAXT = 10;

const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;

export function buildUnitConvertPlay(cfg) {
  const v = validateUnitConvert(cfg);
  if (!v) return null;
  const copy = convertCopy(v);
  const tv = v.transfer;
  let cast = null;
  let L = (p) => p.en;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    L = ctx.L;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, a) => svgEl(tag, { opacity: 0, ...a }, g);
    const txt = (a) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 16,
        "font-weight": 700,
        fill: "var(--lsx-ink)",
        stroke: "var(--lsx-card)",
        "stroke-width": 4,
        "paint-order": "stroke",
        ...a,
      });
    const line = (a) => el("line", { stroke: "var(--lsx-ink)", "stroke-width": 2, ...a });
    const ticks = (y, color) =>
      Array.from({ length: MAXT + 1 }, () => ({
        line: line({ y1: y - 8, y2: y + 8, stroke: color }),
        num: txt({ y: y === TOP ? y - 16 : y + 30, fill: color }),
      }));
    cast = {
      band: el("rect", {
        x: X0,
        y: TOP,
        width: 0,
        height: BOT - TOP,
        fill: "var(--lsx-x)",
        "fill-opacity": 0.16,
      }),
      lineTop: line({ x1: X0, x2: X0 + SPAN, y1: TOP, y2: TOP, stroke: "var(--lsx-hi)" }),
      lineBot: line({ x1: X0, x2: X0 + SPAN, y1: BOT, y2: BOT, stroke: "var(--lsx-lo)" }),
      segTop: line({
        x1: X0,
        x2: X0,
        y1: TOP,
        y2: TOP,
        stroke: "var(--lsx-hi)",
        "stroke-width": 8,
      }),
      segBot: line({
        x1: X0,
        x2: X0,
        y1: BOT,
        y2: BOT,
        stroke: "var(--lsx-lo)",
        "stroke-width": 8,
      }),
      endLine: line({
        x1: X0,
        x2: X0,
        y1: TOP,
        y2: BOT,
        "stroke-dasharray": "6 5",
        "stroke-width": 2,
      }),
      topTicks: ticks(TOP, "var(--lsx-hi)"),
      botTicks: ticks(BOT, "var(--lsx-lo)"),
      axisTop: txt({
        x: X0,
        y: 52,
        "text-anchor": "start",
        "font-size": 18,
        fill: "var(--lsx-hi)",
      }),
      axisBot: txt({
        x: X0,
        y: BOT + 92,
        "text-anchor": "start",
        "font-size": 18,
        fill: "var(--lsx-lo)",
      }),
      factor: txt({ x: W / 2, y: 24, "font-size": 20, "font-weight": 800 }),
      endTop: txt({ y: 78, "font-size": 20, fill: "var(--lsx-hi)" }),
      endBot: txt({ y: BOT + 64, "font-size": 20, fill: "var(--lsx-lo)" }),
      op: txt({ y: 166, "font-size": 22, "font-weight": 800 }),
      ghostLine: line({ y1: BOT - 16, y2: BOT + 16, "stroke-dasharray": "4 3", "stroke-width": 3 }),
      ghostTxt: txt({ y: BOT - 26, "font-size": 15 }),
    };
  }

  const clampX = (x, text, size = 18) => {
    const hw = String(text).length * size * 0.3;
    return Math.min(W - 6 - hw, Math.max(6 + hw, x));
  };

  /**
   * Every cast member's place for setting `s` (copy `c`). o = { k: steps drawn,
   * bottom: none|first|all, topEnd, botEnd, op, ghost:{h,line}, emph:top|bot }.
   */
  function paint(s, c, o) {
    const m = [];
    const N = s.N;
    const tx = (i) => X0 + (i * SPAN) / N;
    const set = (node, a, show) => m.push([node, { ...a, opacity: show ? 1 : 0 }]);
    cast.topTicks.forEach((t, i) => {
      t.num.textContent = fmt(i * s.step * 100);
      set(t.line, { x1: tx(i), x2: tx(i) }, i <= N);
      set(t.num, { x: tx(i) }, i <= N);
    });
    cast.botTicks.forEach((t, i) => {
      t.num.textContent = fmt(i * s.step * s.f100);
      const show = i === 0 || (o.bottom === "all" && i <= N) || (o.bottom === "first" && i === 1);
      set(t.line, { x1: tx(i), x2: tx(i) }, show);
      set(t.num, { x: tx(i) }, show);
    });
    const xe = tx(o.k);
    const bar = o.k > 0;
    const thick = (side) => (o.emph === side ? 12 : o.emph ? 5 : 8);
    set(cast.band, { x: X0, width: xe - X0 }, bar);
    set(cast.segTop, { x2: xe, "stroke-width": thick("top") }, bar);
    set(cast.segBot, { x2: xe, "stroke-width": thick("bot") }, bar);
    set(cast.endLine, { x1: xe, x2: xe }, bar);
    set(cast.lineTop, {}, true);
    set(cast.lineBot, {}, true);
    cast.axisTop.textContent = L(c.axisTop);
    cast.axisBot.textContent = L(c.axisBot);
    set(cast.axisTop, {}, true);
    set(cast.axisBot, {}, true);
    cast.factor.textContent = L(c.factorLine);
    set(cast.factor, {}, true);
    cast.endTop.textContent = o.topEnd || "";
    cast.endBot.textContent = o.botEnd || "";
    set(cast.endTop, { x: clampX(xe, o.topEnd || "") }, bar && !!o.topEnd);
    set(cast.endBot, { x: clampX(xe, o.botEnd || "") }, bar && !!o.botEnd);
    cast.op.textContent = c.opLabel;
    set(cast.op, { x: X0 + (xe - X0) / 2 }, bar && !!o.op);
    const gh = o.ghost;
    if (gh) {
      const unitH = gh.line === "top" ? 100 : s.f100;
      const gx = X0 + SPAN * Math.min(1, gh.h / (N * s.step * unitH));
      const gy = gh.line === "top" ? TOP : BOT;
      cast.ghostTxt.textContent = `${L({ en: "your pick", es: "tu elección" })} ${fmt(gh.h)}`;
      set(cast.ghostLine, { x1: gx, x2: gx, y1: gy - 16, y2: gy + 16 }, true);
      set(
        cast.ghostTxt,
        { x: clampX(gx, cast.ghostTxt.textContent, 15), y: gh.line === "top" ? gy + 36 : gy - 26 },
        true,
      );
    } else {
      set(cast.ghostLine, {}, false);
      set(cast.ghostTxt, {}, false);
    }
    return m;
  }

  const pr = (c, k, extra = {}) => ({
    k,
    bottom: "all",
    topEnd: L(c.barTop),
    botEnd: L(c.barBot),
    ...extra,
  });
  const mainFull = (extra) => pr(copy.m, v.N, extra);

  const opts = (list, seed, label, cue) =>
    placeNotFirst(
      list.map((o) => ({ ...o, label: label(o.h), cue: o.correct ? null : cue(o.kind, o.h) })),
      seed,
    );
  const toLabel = (s) => (h) => `${fmt(h)} ${L(un(s.to, h))}`;
  const fromLabel = (s) => (h) => `${fmt(h)} ${L(un(s.from, h))}`;
  const exprFor = (s, c, solved) =>
    `${hi(`${c.A} ${L(un(s.from, s.amount * 100))}`)} ${c.eq === "≈" ? "≈" : "="} ${solved ? lo(`${c.M} ${L(un(s.to, s.mH))}`) : hi("?")}`;

  const scenes = [
    {
      id: "situate",
      label: copy.scene.situate,
      async enter(ctx) {
        L = ctx.L;
        await ctx.tween(paint(v, copy.m, { k: 0, bottom: "none" }), 0);
        await ctx.tween(
          paint(v, copy.m, { k: v.N, bottom: "first", topEnd: L(copy.m.barTop), botEnd: "?" }),
          700,
        );
        ctx.expr(exprFor(v, copy.m, false));
        ctx.say(copy.m.situate);
        ctx.feedback(copy.m.situateLink);
      },
    },
    {
      id: "predict",
      label: copy.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        L = ctx.L;
        const unsolved = { k: v.N, bottom: "first", topEnd: L(copy.m.barTop), botEnd: "?" };
        await ctx.tween(paint(v, copy.m, saved.solved ? mainFull({ op: true }) : unsolved), 300);
        ctx.expr(exprFor(v, copy.m, !!saved.solved));
        ctx.say(copy.m.predict.say);
        const options = opts(forwardChoices(v), v.amount + v.f100, toLabel(v), (kind, h) =>
          L(copy.m.predict.cue(kind, h)),
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.m.predict.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              await ctx.tween(
                paint(v, copy.m, { ...unsolved, ghost: { h: opt.h, line: "bot" } }),
                350,
              );
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(paint(v, copy.m, mainFull({ op: true })), 800);
              ctx.expr(exprFor(v, copy.m, true));
              ctx.feedback(copy.m.predict.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "slide",
      label: copy.scene.slide,
      gate: true,
      async enter(ctx) {
        L = ctx.L;
        const st = ctx.state;
        const N = v.N;
        st.seen = Array.isArray(st.seen) ? st.seen.filter((k) => okInt(k, 1, N)) : [];
        const k0 = okInt(st.k, 1, N) ? st.k : 1;
        if (!st.seen.includes(k0)) st.seen.push(k0);
        const log = document.createElement("p");
        log.className = "lsx-fb";
        log.setAttribute("aria-live", "polite");
        const view = (k) => ({
          k,
          bottom: "all",
          topEnd: `${fmt(k * v.step * 100)} ${L(un(v.from, k * v.step * 100))}`,
          botEnd: `${fmt(convH(v, k))} ${L(un(v.to, convH(v, k)))}`,
        });
        const apply = async (k, ms) => {
          st.k = k;
          if (!st.seen.includes(k)) st.seen.push(k);
          ctx.save();
          await ctx.tween(paint(v, copy.m, view(k)), ms);
          ctx.expr(
            `${hi(fmt(k * v.step * 100))} ${L(un(v.from, k * v.step * 100))} ${copy.m.eq} ${lo(fmt(convH(v, k)))} ${L(un(v.to, convH(v, k)))}`,
          );
          const rows = [...st.seen]
            .sort((a, b) => a - b)
            .slice(-5)
            .map((q) => escHtml(L(copy.m.slide.row(q))));
          log.innerHTML = rows.join(" · ");
          if (st.seen.length >= 3) {
            ctx.feedback(copy.m.slide.done);
            ctx.unlock();
          } else ctx.feedback(copy.m.slide.tryMore, "cue");
        };
        ctx.say(copy.m.slide.say);
        const rng = ctx.range({
          label: copy.m.slide.label,
          min: 1,
          max: N,
          value: k0,
          onInput: (k) => apply(k, 250),
        });
        ctx.panel.append(rng, log);
        await apply(k0, 500);
      },
    },
    {
      id: "connect",
      label: copy.scene.connect,
      async enter(ctx) {
        L = ctx.L;
        const st = ctx.state;
        const c = copy.m.connect;
        const emph = st.emph === "top" || st.emph === "bot" ? st.emph : null;
        const show = async (side, ms) => {
          st.emph = side;
          ctx.save();
          await ctx.tween(paint(v, copy.m, mainFull({ op: true, emph: side })), ms);
          ctx.say(side ? (side === "top" ? c.top : c.bot) : c.say);
          for (const [b, id] of btns) b.setAttribute("aria-pressed", String(id === side));
        };
        const btns = [
          [ctx.button({ label: c.topBtn, onClick: () => show("top", 350) }), "top"],
          [ctx.button({ label: c.botBtn, onClick: () => show("bot", 350) }), "bot"],
        ];
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.append(...btns.map(([b]) => b));
        ctx.panel.appendChild(row);
        ctx.expr(`${hi(copy.m.A)} × ${escHtml(copy.m.F)} ${copy.m.eq} ${lo(copy.m.M)}`);
        await show(emph, 500);
        ctx.feedback(copy.m.connect.note);
      },
    },
    {
      id: "reverse",
      label: copy.scene.reverse,
      gate: true,
      async enter(ctx, saved) {
        L = ctx.L;
        const hidden = { op: false, topEnd: "?" };
        await ctx.tween(paint(v, copy.m, mainFull(saved.solved ? {} : hidden)), 300);
        ctx.expr(
          `${lo(`${copy.m.M} ${L(un(v.to, v.mH))}`)} ${copy.m.eq} ${saved.solved ? hi(`${copy.m.A} ${L(un(v.from, v.amount * 100))}`) : hi("?")}`,
        );
        ctx.say(copy.m.reverse.say);
        const options = opts(reverseChoices(v), v.amount + 2 * v.f100, fromLabel(v), (kind, h) =>
          L(copy.m.reverse.cue(kind, h)),
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.m.reverse.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              await ctx.tween(
                paint(v, copy.m, mainFull({ ...hidden, ghost: { h: opt.h, line: "top" } })),
                350,
              );
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(paint(v, copy.m, mainFull()), 600);
              ctx.expr(
                `${lo(`${copy.m.M} ${L(un(v.to, v.mH))}`)} ${copy.m.eq} ${hi(`${copy.m.A} ${L(un(v.from, v.amount * 100))}`)}`,
              );
              ctx.feedback(copy.m.reverse.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "transfer",
      label: copy.scene.transfer,
      async enter(ctx, saved) {
        L = ctx.L;
        const t = copy.t;
        const base = { k: tv.N, bottom: "first", topEnd: L(t.barTop), botEnd: "?" };
        const solved = pr(t, tv.N, { op: true });
        await ctx.tween(paint(tv, t, saved.solved ? solved : base), 600);
        ctx.expr(exprFor(tv, t, !!saved.solved));
        ctx.say(copy.transferSay);
        const options = opts(forwardChoices(tv), tv.amount * 3 + tv.f100, toLabel(tv), (kind, h) =>
          L(t.predict.cue(kind, h)),
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.transferQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              await ctx.tween(paint(tv, t, { ...base, ghost: { h: opt.h, line: "bot" } }), 350);
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(paint(tv, t, solved), 700);
              ctx.expr(exprFor(tv, t, true));
              ctx.feedback(copy.transferOk);
            },
          }),
        );
        ctx.panel.appendChild(ctx.frame({ label: copy.explain, frame: copy.frame }));
      },
    },
  ];

  return {
    kicker: copy.kicker,
    title: copy.title,
    viewBox: `0 0 ${W} ${H}`,
    ariaLabel: copy.ariaLabel,
    printSummary: copy.printSummary,
    setup,
    scenes,
  };
}
