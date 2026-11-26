// living/plane-polygon.js — the coordinates already know the side lengths.
//
// One cast: four vertex dots and four sides. The student PLOTS the lesson's own
// rectangle (-4.5, 3), (5, 3), (5, -3.75), (-4.5, -3.75) a vertex at a time,
// predicts one side from its shared coordinate, watches each side measured
// from coordinates alone, and adds them for the perimeter. Then the same four
// dots slide to the lesson's square and the student does it again.
//
// Config: { range, story, rect:[4 vertices], transfer:[4 vertices] } — vertices
// on the quarter grid, in order, forming an axis-aligned rectangle.

import { escHtml } from "../../core/living-scene.js";
import { fmt, placeCorrect } from "./plane-model.js";
import {
  perimeterChoices,
  polygonCopy,
  sideCalc,
  sideChoices,
  validatePlanePolygon,
} from "./plane-polygon-model.js";
import { choiceGate, placeSequence } from "./plane-scene.js";
import { drawPlane, planeLayout, stopPlacer } from "./plane-stage.js";

export { validatePlanePolygon };

export function buildPlanePolygonPlay(cfg) {
  const v = validatePlanePolygon(cfg);
  if (!v) return null;
  const T = polygonCopy(v);
  const lay = planeLayout(v.range);
  const { first: R, transfer: S } = v;
  let stage = null;
  const view = (ctx, spec, ms) => ctx.tween(stage.moves(spec), ms);
  const quiet = () => stopPlacer(stage);

  const verts = (P, n = 4) =>
    P.vs.slice(0, n).map((p, i) => ({ i, x: p.x, y: p.y, label: T.label(p, i) }));
  // Sides 0..n-1 (the closing side only once all four vertices are placed).
  const sides = (P, count, lit = []) =>
    P.sides.slice(0, count).map((s, i) => ({
      i,
      a: s.a,
      b: s.b,
      tone: lit.includes(i) ? "hi" : "poly",
    }));
  // Side lengths sit INSIDE the polygon, a quarter of the way along each side, so
  // they clear the vertex labels (outside) and the axes (which cross the middle).
  const lengths = (P, shown) => {
    const cx = P.vs.reduce((t, p) => t + p.x, 0) / 4;
    const cy = P.vs.reduce((t, p) => t + p.y, 0) / 4;
    return shown.map((i) => {
      const s = P.sides[i];
      const at = { x: s.a.x + (s.b.x - s.a.x) / 4, y: s.a.y + (s.b.y - s.a.y) / 4 };
      const out = s.horizontal
        ? { dy: s.a.y >= cy ? 18 : -8, anchor: "middle" }
        : { dx: s.a.x >= cx ? -10 : 10, dy: 5, anchor: s.a.x >= cx ? "end" : "start" };
      return { i, ...at, ...out, text: fmt(s.len), tone: "hi", size: 15 };
    });
  };
  const zeroFor = (s) => ({
    i: 5,
    x: s.horizontal ? 0 : s.fixed,
    y: s.horizontal ? s.fixed : 0,
    tone: "ghost",
    r: 9,
  });
  const units = (n) => T.units(n);
  const choose = (ctx, { options, question, seed, saved, onMiss, onCorrect }) =>
    choiceGate(ctx, {
      question,
      options: options.map((o) => ({ ...o, label: units(o.n) })),
      seed,
      saved,
      onMiss,
      onCorrect,
    });

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        quiet();
        ctx.say(T.situateSay);
        ctx.expr("");
        await view(ctx, {}, 300);
      },
    },
    {
      id: "plot",
      label: T.scene.plot,
      gate: true,
      async enter(ctx) {
        await placeSequence(ctx, stage, {
          targets: R.vs,
          step: 0.25,
          placeLabel: T.place,
          startFor: (i) => (i > 0 ? R.vs[i - 1] : { x: 0, y: 0 }),
          say: (i) => T.plotSay(i),
          ask: (i) => T.plotQ(i),
          ok: (i) => T.plotOk(i),
          done: () => ctx.unlock(),
          render(n, ms) {
            ctx.expr(escHtml(n ? T.list({ vs: R.vs.slice(0, n) }) : ""));
            const count = n === 4 ? 4 : Math.max(0, n - 1);
            return view(ctx, { pts: verts(R, n), segs: sides(R, count) }, ms);
          },
        });
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        quiet();
        const s = R.sides[0];
        ctx.say(T.predictSay);
        ctx.expr("");
        const base = { pts: verts(R), segs: sides(R, 4, [0]) };
        await view(ctx, saved.solved ? { ...base, txt: lengths(R, [0]) } : base, 400);
        if (saved.solved) {
          ctx.feedback(T.lengthOk(s));
          ctx.expr(escHtml(sideCalc(s)));
        }
        ctx.panel.appendChild(
          choose(ctx, {
            question: T.lengthQ(0),
            options: sideChoices(s),
            seed: Math.round(s.len * 4),
            saved,
            onMiss: (opt) => {
              ctx.feedback(T.lengthCue(s, opt), "cue");
              return view(ctx, { ...base, pts: [...base.pts, zeroFor(s)] }, 300);
            },
            onCorrect: () => {
              ctx.feedback(T.lengthOk(s));
              ctx.expr(escHtml(sideCalc(s)));
              ctx.unlock();
              return view(ctx, { ...base, txt: lengths(R, [0]) }, 400);
            },
          }),
        );
      },
    },
    {
      id: "measure",
      label: T.scene.measure,
      async enter(ctx) {
        quiet();
        ctx.say(T.measureSay);
        await view(ctx, { pts: verts(R), segs: sides(R, 4) }, 0);
        for (let k = 0; k < 4; k++) {
          ctx.expr(escHtml(sideCalc(R.sides[k])));
          const shown = [...Array(k + 1).keys()];
          await view(
            ctx,
            { pts: verts(R), segs: sides(R, 4, [k]), txt: lengths(R, shown) },
            k ? 1000 : 600,
          );
        }
        ctx.expr(escHtml(R.sides.map((s) => fmt(s.len)).join("   ·   ")));
        await view(ctx, { pts: verts(R), segs: sides(R, 4), txt: lengths(R, [0, 1, 2, 3]) }, 400);
        ctx.feedback(T.measureDone);
      },
    },
    {
      id: "perimeter",
      label: T.scene.perimeter,
      gate: true,
      async enter(ctx, saved) {
        quiet();
        ctx.say(T.perimeterSay);
        const all = [0, 1, 2, 3];
        const base = { pts: verts(R), txt: lengths(R, all) };
        const done = { ...base, segs: sides(R, 4, all) };
        ctx.expr(saved.solved ? escHtml(T.perimeterCalc(R)) : "");
        await view(ctx, saved.solved ? done : { ...base, segs: sides(R, 4) }, 400);
        if (saved.solved) ctx.feedback(T.perimeterOk(R));
        ctx.panel.appendChild(
          choose(ctx, {
            question: T.perimeterQ,
            options: perimeterChoices(R),
            seed: Math.round(R.perimeter * 4),
            saved,
            onMiss: (opt) => {
              ctx.feedback(T.perimeterCue(R, opt), "cue");
              const lit = opt.kind === "half" ? [0, 1] : opt.kind === "double" ? [0, 2] : [];
              return view(ctx, { ...base, segs: sides(R, 4, lit) }, 300);
            },
            onCorrect: () => {
              ctx.feedback(T.perimeterOk(R));
              ctx.expr(escHtml(T.perimeterCalc(R)));
              ctx.unlock();
              return view(ctx, done, 500);
            },
          }),
        );
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx) {
        quiet();
        const st = ctx.state;
        let k = Math.min(Math.max(0, Number(st.k) || 0), 2);
        const s = S.sides[0];
        ctx.say(T.transferSay);
        const lit = [0, 1, 2, 3];
        const draw = (ms) => {
          const txt = k >= 1 ? lengths(S, k >= 2 ? lit : [0]) : [];
          return view(ctx, { pts: verts(S), segs: sides(S, 4, k >= 2 ? lit : []), txt }, ms);
        };
        const box = document.createElement("div");
        box.className = "lsx-panel";
        ctx.panel.append(box, ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
        const ask = () => {
          box.innerHTML = "";
          if (k >= 2) return;
          const sideQ = k === 0;
          const options = sideQ ? sideChoices(s) : perimeterChoices(S);
          const opts = placeCorrect(
            options.map((o) => ({ ...o, label: units(o.n) })),
            sideQ ? 3 : 2,
          );
          box.appendChild(
            ctx.choices({
              question: sideQ ? T.lengthQ(0) : T.perimeterQ,
              options: opts,
              onMiss: (_i, opt) => {
                ctx.feedback(sideQ ? T.lengthCue(s, opt) : T.perimeterCue(S, opt), "cue");
                if (sideQ) return;
                const litSides = opt.kind === "half" ? [0, 1] : opt.kind === "double" ? [0, 2] : [];
                view(
                  ctx,
                  { pts: verts(S), segs: sides(S, 4, litSides), txt: lengths(S, lit) },
                  300,
                );
              },
              onCorrect: async () => {
                k += 1;
                st.k = k;
                ctx.save();
                ctx.feedback(sideQ ? T.transferSideOk(s) : T.perimeterOk(S));
                ctx.expr(escHtml(sideQ ? sideCalc(s) : T.perimeterCalc(S)));
                await draw(500);
                ask();
              },
            }),
          );
        };
        ctx.expr(k ? escHtml(k >= 2 ? T.perimeterCalc(S) : sideCalc(s)) : "");
        await draw(700);
        if (k >= 2) ctx.feedback(T.perimeterOk(S));
        ask();
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
