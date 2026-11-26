// living/plane-points.js — an ordered pair is a trip from the origin.
//
// Two modes share one plane and one placer:
//   "walk"     (7-5)  x is how far right, y is how far up: plot (5, 4) and (2, 1)
//                     by walking, read (8, 1), see that (3, 5) is not (5, 3),
//                     then name a point from "right 7, up 2".
//   "quadrant" (7-8)  negative numbers walk the other way, and the pair of signs
//                     names the quadrant (plane-points-quadrant.js).
//
// Config (walk): { mode, range, story, first, second, third, swap, reverse }
// Config (quadrant): { mode, range, story, first, second, others:[a, b], reading }
// Every point is a whole-number pair in the lesson; the play refuses to draw
// numbers it cannot place exactly.

import { escHtml } from "../../core/living-scene.js";
import { pt } from "./plane-model.js";
import { pointsCopy, readChoices, validatePlanePoints, walkChoices } from "./plane-points-model.js";
import { quadrantScenes } from "./plane-points-quadrant.js";
import { choiceGate, ORIGIN, pairHtml, placeSequence } from "./plane-scene.js";
import { drawPlane, planeLayout, stopPlacer } from "./plane-stage.js";

export { validatePlanePoints };

/** The two legs of a trip to p (right along the x-axis, then up), with their labels. */
export function legSpec(p, lay, T, ctx) {
  const nearEdge = p.x > lay.r.xmax - 2;
  return {
    segs: [
      { i: 0, a: { x: 0, y: 0 }, b: { x: p.x, y: 0 }, tone: "hi" },
      { i: 1, a: { x: p.x, y: 0 }, b: { x: p.x, y: p.y }, tone: "lo" },
    ],
    txt: [
      { i: 0, x: p.x / 2, y: 0, dy: -13, text: ctx.L(T.legs(p).x), tone: "hi" },
      {
        i: 1,
        x: p.x,
        y: p.y / 2,
        dx: nearEdge ? -14 : 14,
        anchor: nearEdge ? "end" : "start",
        text: ctx.L(T.legs(p).y),
        tone: "lo",
      },
    ],
  };
}

export function buildPlanePointsPlay(cfg) {
  const v = validatePlanePoints(cfg);
  if (!v) return null;
  const T = pointsCopy(v);
  const lay = planeLayout(v.range);
  let stage = null;
  const env = {
    v,
    T,
    lay,
    stage: () => stage,
    view: (ctx, spec, ms) => ctx.tween(stage.moves(spec), ms),
  };
  return {
    kicker: T.kicker,
    title: T.title,
    viewBox: `0 0 ${lay.W} ${lay.H}`,
    ariaLabel: T.ariaLabel,
    printSummary: T.printSummary,
    setup(ctx) {
      const quad =
        v.mode === "quadrant" ? T.quadLabels.map(([a, b]) => [ctx.L(a), ctx.L(b)]) : null;
      stage = drawPlane(ctx.svg, lay, quad);
    },
    scenes: v.mode === "walk" ? walkScenes(env) : quadrantScenes(env),
  };
}

function walkScenes({ v, T, lay, stage, view }) {
  const { A, B, C, S, D, range } = v;
  const S2 = { x: S.y, y: S.x };
  const named = (ctx, p, i) => ({ i, x: p.x, y: p.y, label: ctx.L(T.label(p)) });
  const ghost = (opt) => ({ i: 6, x: opt.p.x, y: opt.p.y, tone: "ghost", label: pt(opt.p) });
  const quiet = () => stopPlacer(stage());

  return [
    {
      id: "start",
      label: T.scene.start,
      async enter(ctx) {
        quiet();
        ctx.expr(escHtml(pt(A)));
        ctx.say(T.startSay);
        await view(ctx, { pts: [ORIGIN] }, 300);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        quiet();
        ctx.expr(escHtml(pt(A)));
        ctx.say(T.predictSay);
        await view(ctx, { pts: [ORIGIN] }, 0);
        const options = walkChoices(A, range).map((o) => ({ ...o, label: o.words }));
        ctx.panel.appendChild(
          choiceGate(ctx, {
            question: T.predictQ,
            options,
            seed: A.x * 7 + A.y,
            saved,
            onMiss: (opt) => {
              ctx.feedback(T.walkCue(opt), "cue");
              return view(ctx, { pts: [ORIGIN, ghost(opt)] }, 300);
            },
            onCorrect: () => {
              ctx.feedback(T.predictOk);
              ctx.unlock();
              return view(ctx, { pts: [ORIGIN] }, 200);
            },
          }),
        );
      },
    },
    {
      id: "plot",
      label: T.scene.plot,
      gate: true,
      async enter(ctx) {
        const targets = [A, B];
        await placeSequence(ctx, stage(), {
          targets,
          say: (i) => T.plotSay(targets[i]),
          placeLabel: T.place,
          ask: (i) => T.plotQ(targets[i]),
          ok: (i) => T.plotOk(targets[i], i === 0),
          done: () => ctx.unlock(),
          render(n, ms) {
            const last = targets[n - 1];
            ctx.expr(last ? pairHtml(last.x, last.y) : escHtml(pt(targets[0])));
            const pts = targets.slice(0, n).map((p, i) => named(ctx, p, i));
            const legs = last ? legSpec(last, lay, T, ctx) : {};
            return view(ctx, { pts: [ORIGIN, ...pts], ...legs }, ms);
          },
        });
      },
    },
    {
      id: "read",
      label: T.scene.read,
      async enter(ctx) {
        quiet();
        ctx.say(T.readSay);
        ctx.expr(pairHtml(C.x, C.y));
        const ab = [named(ctx, A, 0), named(ctx, B, 1)];
        const legs = legSpec(C, lay, T, ctx);
        const walker = (x, y, label) => ({ i: 2, x, y, label });
        await view(ctx, { pts: [ORIGIN, ...ab, walker(0, 0, "")] }, 0);
        await view(
          ctx,
          {
            pts: [ORIGIN, ...ab, walker(C.x, 0, "")],
            segs: [legs.segs[0]],
            txt: [legs.txt[0]],
          },
          700,
        );
        await view(ctx, { pts: [ORIGIN, ...ab, named(ctx, C, 2)], ...legs }, 700);
        const route = [
          { i: 2, a: B, b: A, tone: "poly" },
          { i: 3, a: A, b: C, tone: "poly" },
        ];
        await view(
          ctx,
          { pts: [ORIGIN, ...ab, named(ctx, C, 2)], ...legs, segs: [...legs.segs, ...route] },
          500,
        );
        ctx.feedback(T.readDone);
      },
    },
    {
      id: "order",
      label: T.scene.order,
      gate: true,
      async enter(ctx) {
        const targets = [S, S2];
        ctx.say(T.orderSay);
        await placeSequence(ctx, stage(), {
          targets,
          placeLabel: T.place,
          ask: (i) => T.plotQ(targets[i]),
          ok: (i) => (i === 0 ? T.orderFirst(S, S2) : T.orderDone),
          done: () => ctx.unlock(),
          render(n, ms) {
            ctx.expr(`${escHtml(pt(S))} ≠ ${escHtml(pt(S2))}`);
            const pts = targets.slice(0, n).map((p, i) => ({
              i: 3 + i,
              x: p.x,
              y: p.y,
              tone: i ? "alt" : "main",
              label: pt(p),
            }));
            return view(ctx, { pts: [ORIGIN, ...pts] }, ms);
          },
        });
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        quiet();
        ctx.say(T.transferSay);
        const dock = (label) => ({ i: 5, x: D.x, y: D.y, tone: "alt", label });
        const legs = legSpec(D, lay, T, ctx);
        ctx.expr(saved.solved ? pairHtml(D.x, D.y) : "");
        await view(ctx, { pts: [ORIGIN, dock(saved.solved ? pt(D) : "?")], ...legs }, 400);
        const options = readChoices(D, range).map((o) => ({ ...o, label: pt(o.p) }));
        ctx.panel.appendChild(
          choiceGate(ctx, {
            question: T.transferQ,
            options,
            seed: D.x * 5 + D.y,
            saved,
            onMiss: (opt) => {
              ctx.feedback(T.readCue(opt), "cue");
              return view(ctx, { pts: [ORIGIN, dock("?"), ghost(opt)], ...legs }, 300);
            },
            onCorrect: () => {
              ctx.feedback(T.transferOk);
              ctx.expr(pairHtml(D.x, D.y));
              return view(ctx, { pts: [ORIGIN, dock(pt(D))], ...legs }, 300);
            },
          }),
        );
        ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
      },
    },
  ];
}
