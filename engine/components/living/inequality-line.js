// living/inequality-line.js — an inequality has MANY solutions (lessons 8-4, 8-5).
//
// One cast for the whole play: a number line with a pool of test marks, a
// boundary circle and a shaded ray with an arrow. Mode "write" (8-4): the
// student tests values against words like "at least 18", sees that 18 itself
// counts, and then names the symbol; the circle and ray appear as the picture
// of what they found. Mode "graph" (8-5): the student decides open or closed
// at the boundary, draws the circle and the shading, checks it by testing
// values, and sees every value on the ray (decimals too) is a solution.
//
// Meaning never rests on colour: a value that works gets a circle with ✓, one
// that does not gets a square with ✗; the boundary is ● (included) or ○ (not).
// Every control is a button or a slider. The stage is shared with
// inequality-solve.js (createLineStage, testPanel).
//
// Config: { mode: "write"|"graph", sym, limit, letter, story, phrase (write),
//           transfer: { sym, limit, letter, story, phrase } }.

import { escHtml } from "../../core/living-scene.js";
import {
  dirOf,
  holds,
  insideValue,
  isClosed,
  lineCopy,
  outsideValue,
  rangeFor,
  setChoices,
  symbolChoices,
  testsDone,
  validateInequalityLine,
} from "./inequality-line-model.js";

export { validateInequalityLine };

export const W = 480;
export const H = 228;
const X0 = 44;
const X1 = 436;
const AY = 150; // axis
const MARKS = 14;

/** The number line: build once with setup(ctx), repaint with view(ctx, state, ms). */
export function createLineStage() {
  let c = null;
  let range = { lo: 0, hi: 10, step: 1 };
  const stage = {
    pick: null,
    xOf: (v) => X0 + ((v - range.lo) / (range.hi - range.lo)) * (X1 - X0),
    valueAt: (x) => {
      const v = Math.round(range.lo + ((x - X0) / (X1 - X0)) * (range.hi - range.lo));
      return Math.min(range.hi, Math.max(range.lo, v));
    },
  };

  stage.setup = (ctx) => {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const g = svgEl("g", {}, svg);
    const line = (a) =>
      svgEl("line", { stroke: "var(--lsx-ink)", "stroke-linecap": "round", ...a }, g);
    const text = (a) =>
      svgEl(
        "text",
        { "text-anchor": "middle", "font-weight": 800, fill: "var(--lsx-ink)", opacity: 0, ...a },
        g,
      );
    line({ x1: 16, x2: 464, y1: AY, y2: AY, "stroke-width": 3 });
    for (const s of [-1, 1]) {
      const x = s < 0 ? 16 : 464;
      line({ x1: x, x2: x - s * 10, y1: AY, y2: AY - 7, "stroke-width": 3 });
      line({ x1: x, x2: x - s * 10, y1: AY, y2: AY + 7, "stroke-width": 3 });
    }
    const ticks = svgEl("g", {}, g);
    const ray = line({
      x1: 0,
      x2: 0,
      y1: AY,
      y2: AY,
      "stroke-width": 10,
      stroke: "var(--lsx-hi)",
      opacity: 0,
    });
    const chev = [-1, 1].map((s) =>
      line({
        x1: 0,
        x2: 0,
        y1: AY,
        y2: AY,
        "stroke-width": 6,
        stroke: "var(--lsx-hi)",
        opacity: 0,
        "data-s": s,
      }),
    );
    const dot = svgEl(
      "circle",
      {
        cx: 0,
        cy: AY,
        r: 11,
        "stroke-width": 4,
        stroke: "var(--lsx-hi)",
        fill: "var(--lsx-card)",
        opacity: 0,
      },
      g,
    );
    const marks = Array.from({ length: MARKS }, () => ({
      stem: line({
        x1: 0,
        x2: 0,
        y1: AY - 24,
        y2: AY - 10,
        "stroke-width": 2,
        stroke: "var(--lsx-muted)",
        opacity: 0,
      }),
      yes: svgEl("circle", { cx: 0, cy: AY - 36, r: 13, "stroke-width": 3, opacity: 0 }, g),
      no: svgEl(
        "rect",
        {
          x: 0,
          y: AY - 49,
          width: 26,
          height: 26,
          rx: 3,
          "stroke-width": 3,
          "stroke-dasharray": "4 3",
          opacity: 0,
        },
        g,
      ),
      glyph: text({ x: 0, y: AY - 29, "font-size": 20 }),
      val: text({ x: 0, y: AY - 58, "font-size": 16, fill: "var(--lsx-muted)" }),
    }));
    const top = text({ x: W / 2, y: 38, "font-size": 28 });
    const sub = text({ x: W / 2, y: 66, "font-size": 19, fill: "var(--lsx-muted)" });
    const note = text({ x: 0, y: 208, "font-size": 19, fill: "var(--lsx-hi)" });
    const hit = svgEl("rect", { x: 0, y: 80, width: W, height: 120, fill: "transparent" }, g);
    hit.addEventListener("click", (ev) => {
      if (!stage.pick) return;
      const r = svg.getBoundingClientRect();
      stage.pick(stage.valueAt(((ev.clientX - r.left) / r.width) * W));
    });
    c = { ticks, ray, chev, dot, marks, top, sub, note, hit, svgEl };
  };

  /**
   * Paint the whole line. o: { lo, hi, step, bold, ray:{limit,dir}|null,
   * dot:{limit,closed}|null, marks:[{v,ok,cur}], top, sub, note }.
   */
  stage.view = (ctx, o, ms = 0) => {
    range = { lo: o.lo, hi: o.hi, step: o.step || 1 };
    c.ticks.innerHTML = "";
    for (let v = range.lo; v <= range.hi + 1e-9; v += range.step) {
      const x = stage.xOf(v);
      const bold = v === o.bold;
      c.svgEl(
        "line",
        {
          x1: x,
          x2: x,
          y1: AY - 7,
          y2: AY + 7,
          stroke: "var(--lsx-ink)",
          "stroke-width": bold ? 4 : 2,
        },
        c.ticks,
      );
      c.svgEl(
        "text",
        {
          x,
          y: AY + 30,
          "text-anchor": "middle",
          "font-size": 19,
          "font-weight": bold ? 800 : 500,
          fill: bold ? "var(--lsx-ink)" : "var(--lsx-muted)",
          text: v,
        },
        c.ticks,
      );
    }
    const m = [];
    const xb = o.ray ? stage.xOf(o.ray.limit) : o.dot ? stage.xOf(o.dot.limit) : 0;
    const right = o.ray?.dir === "right";
    const end = right ? 462 : 18;
    m.push([c.ray, { opacity: o.ray ? 1 : 0, x1: xb, x2: o.ray ? end : xb }]);
    c.chev.forEach((s, i) => {
      const dy = i ? 11 : -11;
      const dx = right ? -14 : 14;
      m.push([
        s,
        { opacity: o.ray ? 1 : 0, x1: o.ray ? end : xb, x2: (o.ray ? end : xb) + dx, y2: AY + dy },
      ]);
    });
    const closed = o.dot?.closed;
    m.push([
      c.dot,
      {
        opacity: o.dot ? 1 : 0,
        cx: xb,
        r: closed == null ? 7 : 11,
        fill: closed ? "var(--lsx-hi)" : "var(--lsx-card)",
      },
    ]);
    const note = o.dot && closed != null ? ctx.L(o.note) : "";
    m.push([
      c.note,
      { opacity: note ? 1 : 0, x: xb, text: note, "text-anchor": xb > W - 90 ? "end" : "middle" },
    ]);
    c.marks.forEach((s, i) => {
      const k = o.marks?.[i];
      const x = k ? stage.xOf(k.v) : 0;
      const on = k ? 1 : 0;
      m.push([s.stem, { opacity: on, x1: x, x2: x }]);
      const look = k?.ok
        ? { fill: "var(--lsx-ok-bg)", stroke: "var(--lsx-ok-edge)" }
        : { fill: "var(--lsx-cue-bg)", stroke: "var(--lsx-miss)" };
      m.push([s.yes, { opacity: k?.ok ? 1 : 0, cx: x, "stroke-width": k?.cur ? 5 : 3, ...look }]);
      m.push([
        s.no,
        { opacity: k && !k.ok ? 1 : 0, x: x - 13, "stroke-width": k?.cur ? 5 : 3, ...look },
      ]);
      m.push([s.glyph, { opacity: on, x, text: k ? (k.ok ? "✓" : "✗") : "" }]);
      m.push([s.val, { opacity: on, x, text: k ? String(k.v) : "" }]);
    });
    m.push([c.top, { opacity: o.top ? 1 : 0, text: o.top || "" }]);
    m.push([c.sub, { opacity: o.sub ? 1 : 0, text: o.sub || "" }]);
    c.hit.style.cursor = stage.pick ? "pointer" : "default";
    return ctx.tween(m, ms);
  };
  return stage;
}

/**
 * A slider that tests values on the line. verdict(v) -> {en, es}; ok(v) -> bool.
 * Every tested value is kept (saved) and drawn as a ✓ circle or ✗ square.
 * onTest(seen) runs after each test; clicking the line picks a value too.
 * @param {any} ctx
 * @param {any} stage
 * @param {{lo: number, hi: number, ok: (v: number) => boolean, verdict: (v: number) => any, base: any, label: any, onTest?: (seen: number[]) => any}} opts
 */
export function testPanel(ctx, stage, { lo, hi, ok, verdict, base, onTest, label }) {
  const st = ctx.state;
  st.seen = Array.isArray(st.seen)
    ? st.seen.filter((v) => Number.isInteger(v) && v >= lo && v <= hi)
    : [];
  const marks = () =>
    st.seen.slice(-MARKS).map((v, i, a) => ({ v, ok: ok(v), cur: i === a.length - 1 }));
  const baseOf = () => (typeof base === "function" ? base() : base);
  const paint = (ms) => stage.view(ctx, { ...baseOf(), marks: marks() }, ms);
  const rng = ctx.range({
    label,
    min: lo,
    max: hi,
    value: st.seen.length ? st.seen[st.seen.length - 1] : lo,
    onInput: (v) => {
      if (!st.seen.includes(v)) st.seen.push(v);
      else st.seen.push(st.seen.splice(st.seen.indexOf(v), 1)[0]);
      ctx.save();
      ctx.feedback(verdict(v), ok(v) ? "" : "cue");
      onTest?.(st.seen);
      return paint(200);
    },
  });
  const input = /** @type {HTMLInputElement} */ (rng.querySelector("input"));
  stage.pick = (v) => {
    input.value = String(v);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };
  return { el: rng, paint };
}

export const ex = (s) => ({ en: s, es: s });
export const solvedText = (q) => `${q.letter} ${q.sym} ${q.limit}`;
export const lineBase = (q, extra = {}) => ({ ...rangeFor(q.limit), bold: q.limit, ...extra });
export const markOf = (q, x) => ({ v: x, ok: holds(q.sym, x, q.limit), cur: true });
/** The finished picture of "q": circle, ray and the symbol on top. */
export const doneView = (T, q) => ({
  ...lineBase(q),
  ray: { limit: q.limit, dir: dirOf(q.sym) },
  dot: { limit: q.limit, closed: isClosed(q.sym) },
  note: T.marker(q),
  top: solvedText(q),
});
export const explainBox = (ctx, T) =>
  ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
export const hiSpan = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;

/**
 * A choice whose wrong picks show their cue and (optionally) a mark on the line.
 * @param {any} ctx
 * @param {any} stage
 * @param {any} saved
 * @param {{options: any[], question: any, ok: any, shown: any, final: any, mark?: (opt: any) => any[], after?: () => any}} opts
 */
export function pickScene(ctx, stage, saved, { options, question, ok, mark, shown, final, after }) {
  ctx.panel.appendChild(
    ctx.choices({
      question,
      options,
      restore: saved.solved ? options.findIndex((o) => o.correct) : null,
      onMiss: async (_i, opt) => {
        ctx.feedback(opt.cue, "cue");
        await stage.view(ctx, { ...shown, marks: mark?.(opt) ?? [] }, 250);
      },
      onCorrect: async () => {
        ctx.state.solved = true;
        ctx.save();
        ctx.feedback(ok);
        ctx.unlock();
        await after?.();
        await stage.view(ctx, final, 650);
      },
    }),
  );
  if (saved.solved) ctx.feedback(ok);
  return stage.view(ctx, saved.solved ? final : shown, 0);
}

export function buildInequalityLinePlay(cfg) {
  const v = validateInequalityLine(cfg);
  if (!v) return null;
  const T = lineCopy(v);
  const { main: c, transfer: t } = v;
  const stage = createLineStage();
  const enterCommon = () => {
    stage.pick = null;
  };
  const hi = hiSpan;
  const base = lineBase;
  const done = (q) => doneView(T, q);
  const explain = (ctx) => explainBox(ctx, T);
  const pick = (ctx, saved, opts) => pickScene(ctx, stage, saved, opts);

  const writeScenes = [
    {
      id: "rule",
      label: T.labels[0],
      async enter(ctx) {
        enterCommon();
        ctx.say(T.situateSay);
        ctx.expr(escHtml(ctx.L(T.topWords)));
        await stage.view(ctx, base(c, { top: ctx.L(T.topWords) }), 500);
      },
    },
    {
      id: "predict",
      label: T.labels[1],
      gate: true,
      async enter(ctx, saved) {
        enterCommon();
        ctx.say(T.predictSay);
        ctx.expr(escHtml(ctx.L(T.topWords)));
        const shown = base(c, { top: ctx.L(T.topWords) });
        await pick(ctx, saved, {
          q: c,
          options: setChoices(c),
          question: T.predictQ,
          ok: T.predictOk,
          shown,
          final: shown,
          mark: (opt) => {
            const x = {
              only: insideValue(c.sym, c.limit),
              opp: outsideValue(c.sym, c.limit),
              flip: c.limit,
            }[opt.id];
            return x == null ? [] : [markOf(c, x)];
          },
        });
      },
    },
    {
      id: "test",
      label: T.labels[2],
      gate: true,
      async enter(ctx, saved) {
        enterCommon();
        const st = ctx.state;
        const shown = base(c, { top: ctx.L(T.topWords) });
        ctx.say(T.testSay);
        ctx.expr(escHtml(ctx.L(T.topWords)));
        const status = (seen) => {
          const d = testsDone(c, seen);
          if (d.boundary && d.inside && d.outside) {
            st.found = true;
            ctx.save();
            ctx.unlock();
            return ctx.feedback(
              `${ctx.L(T.verdict(seen[seen.length - 1]))} — ${ctx.L(T.testDone)}`,
            );
          }
          const need = !d.boundary ? T.needBoundary(c) : !d.inside ? T.needInside : T.needOutside;
          ctx.feedback(`${ctx.L(T.verdict(seen[seen.length - 1]))} ${ctx.L(need)}`, "cue");
        };
        const tp = testPanel(ctx, stage, {
          lo: rangeFor(c.limit).lo,
          hi: rangeFor(c.limit).hi,
          ok: (x) => holds(c.sym, x, c.limit),
          verdict: (x) => T.verdict(x),
          base: shown,
          label: ex(c.letter),
          onTest: status,
        });
        ctx.panel.appendChild(tp.el);
        await tp.paint(0);
        if (saved.found) ctx.feedback(T.testDone);
      },
    },
    {
      id: "symbol",
      label: T.labels[3],
      gate: true,
      async enter(ctx, saved) {
        enterCommon();
        ctx.say(T.symbolSay);
        ctx.expr(escHtml(ctx.L(T.topWords)));
        const shown = base(c, { top: ctx.L(T.topWords) });
        await pick(ctx, saved, {
          q: c,
          options: symbolChoices(c),
          question: T.symbolQ,
          ok: T.symbolOk,
          shown,
          final: done(c),
          mark: (opt) => [
            markOf(c, opt.cue.en.startsWith("Does") ? c.limit : insideValue(c.sym, c.limit)),
          ],
          after: () => ctx.expr(hi(solvedText(c))),
        });
        if (saved.solved) ctx.expr(hi(solvedText(c)));
      },
    },
    {
      id: "transfer",
      label: T.labels[4],
      async enter(ctx, saved) {
        enterCommon();
        ctx.say(T.transferSay);
        ctx.expr(escHtml(ctx.L(t.phrase)));
        const shown = base(t, { top: ctx.L(t.phrase) });
        await pick(ctx, saved, {
          q: t,
          options: symbolChoices(t),
          question: T.transferQ,
          ok: T.transferOk,
          shown,
          final: done(t),
          mark: (opt) => [
            markOf(t, opt.cue.en.startsWith("Does") ? t.limit : insideValue(t.sym, t.limit)),
          ],
          after: () => ctx.expr(hi(solvedText(t))),
        });
        if (saved.solved) ctx.expr(hi(solvedText(t)));
        explain(ctx);
      },
    },
  ];

  return {
    kicker: T.kicker,
    title: T.title,
    viewBox: `0 0 ${W} ${H}`,
    ariaLabel: T.ariaLabel,
    printSummary: T.printSummary,
    setup: stage.setup,
    scenes: writeScenes,
  };
}
