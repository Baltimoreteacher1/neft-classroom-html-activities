// living/plane-reflect.js — a reflection is a flip over a mirror line.
//
// One cast: an original dot, its image, and a mirror that is highlighted on
// the axis being flipped over. The student predicts where (3, 2) lands over
// the y-axis, places the image themselves, and watches it cross the mirror to
// the same distance on the other side (only x changes sign). The mirror then
// switches to the x-axis for (4, -5), and finally a whole triangle flies
// across: three originals, three images, the same rule on every vertex.
//
// Config: { range, story, first:{p, axis}, second:{p, axis}, shape:{axis, vs:[3]} }
// — points are whole-number pairs off both axes; first and second use
// different axes; the triangle sits wholly on one side of its mirror.

import { escHtml } from "../../core/living-scene.js";
import { fmt, pt } from "./plane-model.js";
import {
  changedCoord,
  classifyReflection,
  distToAxis,
  pointChoices,
  reflect,
  reflectCopy,
  validatePlaneReflect,
} from "./plane-reflect-model.js";
import { choiceGate, hi, placeSequence } from "./plane-scene.js";
import { drawPlane, planeLayout, stopPlacer } from "./plane-stage.js";

export { validatePlaneReflect };

export function buildPlaneReflectPlay(cfg) {
  const v = validatePlaneReflect(cfg);
  if (!v) return null;
  const T = reflectCopy(v);
  const lay = planeLayout(v.range);
  const { P, Q, vs, range } = v;
  let stage = null;
  const quiet = () => stopPlacer(stage);

  const mirror = (ctx, axis) => ({
    segs: [
      {
        i: 8,
        a: axis === "y" ? { x: 0, y: range.ymin } : { x: range.xmin, y: 0 },
        b: axis === "y" ? { x: 0, y: range.ymax } : { x: range.xmax, y: 0 },
        tone: "hi",
      },
    ],
    txt: [
      axis === "y"
        ? {
            i: 5,
            x: 0,
            y: range.ymin,
            dx: 12,
            dy: -8,
            anchor: "start",
            text: ctx.L(T.mirror),
            tone: "hi",
          }
        : { i: 5, x: range.xmax, y: 0, dy: -12, anchor: "end", text: ctx.L(T.mirror), tone: "hi" },
    ],
  });
  /** Draw a scene's parts on top of the highlighted mirror. */
  const show = (ctx, axis, { pts = [], segs = [], txt = [] }, ms) => {
    const m = mirror(ctx, axis);
    return ctx.tween(stage.moves({ pts, segs: [...m.segs, ...segs], txt: [...m.txt, ...txt] }), ms);
  };
  // `plain` labels a vertex by its letter alone (the triangle's six labels would collide).
  const orig = (_ctx, p, i = 0, plain = false) => ({
    i,
    x: p.x,
    y: p.y,
    label: plain ? p.name.en : T.label(p),
  });
  const image = (p, axis, at, i = 3, plain = false) => ({
    i,
    x: at.x,
    y: at.y,
    tone: "alt",
    label: plain ? T.prime(p) : T.imageLabel(p, axis),
  });
  // The dashed hop from a point to its image, with the equal distances to the mirror.
  const hop = (p, axis) => {
    const t = reflect(p, axis);
    const d = fmt(distToAxis(p, axis));
    const half = (q) =>
      axis === "y"
        ? { x: q.x / 2, y: q.y, dy: 22, anchor: "middle" }
        : { x: q.x, y: q.y / 2, dx: 10, anchor: "start" };
    return {
      segs: [{ i: 0, a: p, b: t, tone: "ghost" }],
      txt: [
        { i: 0, ...half(p), text: d, tone: "lo", size: 15 },
        { i: 1, ...half(t), text: d, tone: "lo", size: 15 },
      ],
    };
  };
  const mapHtml = (p, axis) => {
    const t = reflect(p, axis);
    const c = changedCoord(axis);
    const cell = (q, k) => (k === c ? hi(fmt(q[k])) : escHtml(fmt(q[k])));
    return `(${cell(p, "x")}, ${cell(p, "y")}) → (${cell(t, "x")}, ${cell(t, "y")})`;
  };
  const ghost = (opt) => ({ i: 6, x: opt.p.x, y: opt.p.y, tone: "ghost", label: pt(opt.p) });
  const withLabel = (opts) => opts.map((o) => ({ ...o, label: pt(o.p) }));

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        quiet();
        ctx.say(T.situateSay);
        ctx.expr(escHtml(pt(P)));
        await show(ctx, v.axisP, { pts: [orig(ctx, P)] }, 400);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        quiet();
        ctx.say(T.situateSay);
        ctx.expr(escHtml(pt(P)));
        const base = { pts: [orig(ctx, P)] };
        await show(ctx, v.axisP, base, 0);
        ctx.panel.appendChild(
          choiceGate(ctx, {
            question: T.predictQ,
            options: withLabel(pointChoices(P, v.axisP, range)),
            seed: P.x * 3 + P.y,
            saved,
            onMiss: (opt) => {
              ctx.feedback(T.cue(P, v.axisP, opt), "cue");
              return show(ctx, v.axisP, { pts: [...base.pts, ghost(opt)] }, 300);
            },
            onCorrect: () => {
              ctx.feedback(T.predictOk);
              ctx.unlock();
              return show(ctx, v.axisP, base, 200);
            },
          }),
        );
      },
    },
    {
      id: "flip",
      label: T.scene.flip,
      gate: true,
      async enter(ctx) {
        const target = reflect(P, v.axisP);
        await placeSequence(ctx, stage, {
          targets: [target],
          placeLabel: T.place,
          startFor: () => ({ x: P.x, y: P.y }),
          classify: (_t, p) => classifyReflection(P, v.axisP, p),
          cue: (kind, _t, p) => T.cue(P, v.axisP, { kind, p }),
          say: () => T.flipSay(P, v.axisP),
          ask: () => T.flipAsk(P, v.axisP),
          ok: () => T.flipOk(P, v.axisP),
          done: () => ctx.unlock(),
          render(n, ms) {
            ctx.expr(n ? mapHtml(P, v.axisP) : escHtml(pt(P)));
            const parts = n ? hop(P, v.axisP) : {};
            const pts = n ? [orig(ctx, P), image(P, v.axisP, target)] : [orig(ctx, P)];
            return show(ctx, v.axisP, { pts, ...parts }, ms);
          },
        });
      },
    },
    {
      id: "why",
      label: T.scene.why,
      async enter(ctx) {
        quiet();
        const t = reflect(P, v.axisP);
        ctx.say(T.whySay);
        ctx.expr(escHtml(T.rule(v.axisP)));
        await show(ctx, v.axisP, { pts: [orig(ctx, P), image(P, v.axisP, P)] }, 0);
        await show(
          ctx,
          v.axisP,
          { pts: [orig(ctx, P), image(P, v.axisP, t)], ...hop(P, v.axisP) },
          900,
        );
        ctx.expr(mapHtml(P, v.axisP));
        ctx.feedback(T.whyDone);
      },
    },
    {
      id: "other",
      label: T.scene.other,
      gate: true,
      async enter(ctx) {
        const target = reflect(Q, v.axisQ);
        ctx.expr(escHtml(pt(Q)));
        await placeSequence(ctx, stage, {
          targets: [target],
          placeLabel: T.place,
          startFor: () => ({ x: Q.x, y: Q.y }),
          classify: (_t, p) => classifyReflection(Q, v.axisQ, p),
          cue: (kind, _t, p) => T.cue(Q, v.axisQ, { kind, p }),
          say: () => T.otherSay,
          ask: () => T.flipAsk(Q, v.axisQ),
          ok: () => T.otherDone,
          done: () => ctx.unlock(),
          render(n, ms) {
            ctx.expr(n ? mapHtml(Q, v.axisQ) : escHtml(pt(Q)));
            const parts = n ? hop(Q, v.axisQ) : {};
            const pts = n ? [orig(ctx, Q), image(Q, v.axisQ, target)] : [orig(ctx, Q)];
            return show(ctx, v.axisQ, { pts, ...parts }, ms);
          },
        });
      },
    },
    {
      id: "shape",
      label: T.scene.shape,
      async enter(ctx, saved) {
        quiet();
        const axis = v.axisS;
        const C = vs[2];
        const imgs = vs.map((p) => reflect(p, axis));
        const sidesOf = (pts, base, tone) =>
          pts.map((p, i) => ({ i: base + i, a: p, b: pts[(i + 1) % 3], tone }));
        const originals = vs.map((p, i) => orig(ctx, p, i, true));
        const flipped = (at) => vs.map((p, i) => image(p, axis, at(i), 3 + i, true));
        const before = { pts: originals, segs: sidesOf(vs, 1, "poly") };
        const at = (list) => (i) => list[i];
        const after = {
          pts: [...originals, ...flipped(at(imgs))],
          segs: [...sidesOf(vs, 1, "poly"), ...sidesOf(imgs, 4, "lo")],
        };
        ctx.say(T.shapeSay);
        ctx.expr(saved.solved ? escHtml(T.rule(axis)) : "");
        await show(ctx, axis, saved.solved ? after : before, 400);
        if (saved.solved) ctx.feedback(T.shapeOk);
        ctx.panel.appendChild(
          choiceGate(ctx, {
            question: T.shapeQ,
            options: withLabel(pointChoices(C, axis, range)),
            seed: C.x * 5 + C.y,
            saved,
            onMiss: (opt) => {
              ctx.feedback(T.cue(C, axis, opt), "cue");
              return show(ctx, axis, { ...before, pts: [...originals, ghost(opt)] }, 300);
            },
            onCorrect: async () => {
              ctx.feedback(T.shapeOk);
              ctx.expr(escHtml(T.rule(axis)));
              const start = {
                pts: [...originals, ...flipped(at(vs))],
                segs: [...sidesOf(vs, 1, "poly"), ...sidesOf(vs, 4, "lo")],
              };
              await show(ctx, axis, start, 0);
              await show(ctx, axis, after, 1000);
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
    viewBox: `0 0 ${lay.W} ${lay.H}`,
    ariaLabel: T.ariaLabel,
    printSummary: T.printSummary,
    setup(ctx) {
      stage = drawPlane(ctx.svg, lay);
    },
    scenes,
  };
}
