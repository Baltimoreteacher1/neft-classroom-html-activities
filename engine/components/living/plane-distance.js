// living/plane-distance.js — how far apart two points are on a row or a column.
//
// One cast, three pairs. The Chest and the Cave (7-6's own pair) sit on one
// row with 0 between them: the student predicts, then STEPS the marker along
// the segment one unit at a time so the distance is a count, then sees the
// count split at 0 into |x1| and |x2| — add the absolute values. The same two
// dots then slide to a pair on one side of 0, where the stretches overlap and
// the answer subtracts. The last pair is a column, to carry the idea to y.
//
// Config: { range, story, first:{a,b}, same:{a,b}, transfer:{a,b} } where each
// point is { x, y, name:{en,es}, the:{en,es} } and each pair shares exactly one
// coordinate. The play refuses pairs it cannot count or draw.

import { escHtml } from "../../core/living-scene.js";
import {
  analyzePair,
  choicesFor,
  distanceCopy,
  onLine,
  validatePlaneDistance,
} from "./plane-distance-model.js";
import { choiceGate, hi, lo, ORIGIN } from "./plane-scene.js";
import { drawPlane, planeLayout, stopPlacer } from "./plane-stage.js";

export { validatePlaneDistance };

export function buildPlaneDistancePlay(cfg) {
  const v = validatePlaneDistance(cfg);
  if (!v) return null;
  const T = distanceCopy(v);
  const lay = planeLayout(v.range);
  const { first, sameSide, transfer } = v;
  let stage = null;
  const view = (ctx, spec, ms) => ctx.tween(stage.moves(spec), ms);
  const quiet = () => stopPlacer(stage);

  // On a row the labels sit centred above the dots, clear of the axis and the zero ring.
  const dots = (ctx, P) =>
    [P.a, P.b].map((p, i) => ({
      i,
      x: p.x,
      y: p.y,
      label: ctx.L(T.label(p)),
      ...(P.horizontal ? { lx: 0, ly: -16, anchor: "middle" } : {}),
    }));
  const zero = (P) => ({ i: 3, ...onLine(P, 0), tone: "ghost", r: 9 });
  const marker = (P, k) => ({ i: 2, ...onLine(P, P.ua + P.dir * k), tone: "alt", r: 8 });
  // A label for a stretch of the line, kept clear of the row/column itself.
  const along = (P, u, text, tone, i, off = 0) =>
    P.horizontal
      ? { i, x: u, y: P.fixed, dy: 19 + off, text, tone, size: 14 }
      : { i, x: P.fixed, y: u, dx: 14 + off, anchor: "start", text, tone, size: 14 };
  const abs = (n) => `|${String(n).replace("-", "−")}| = ${Math.abs(n)}`;
  const pieces = (P, k) => {
    const segs = [];
    const txt = [];
    for (let j = 0; j < k; j++) {
      const u0 = P.ua + P.dir * j;
      const mid = u0 + P.dir * 0.5;
      const lowSide = P.opposite && Math.sign(mid) !== Math.sign(P.ua);
      segs.push({ i: j, a: onLine(P, u0), b: onLine(P, u0 + P.dir), tone: lowSide ? "lo" : "hi" });
      txt.push(along(P, mid, String(j + 1), lowSide ? "lo" : "hi", j));
    }
    return { segs, txt };
  };
  const stretches = (P) => ({
    segs: [
      { i: 0, a: onLine(P, P.ua), b: onLine(P, 0), tone: "hi" },
      { i: 1, a: onLine(P, 0), b: onLine(P, P.ub), tone: "lo" },
    ],
    txt: [along(P, P.ua / 2, abs(P.ua), "hi", 0), along(P, P.ub / 2, abs(P.ub), "lo", 1)],
  });
  // Two overlapping stretches from 0, drawn side by side so the overlap is visible.
  const overlap = (P) => {
    const off = (u0, u1, o) =>
      P.horizontal
        ? { a: { x: u0, y: P.fixed + o }, b: { x: u1, y: P.fixed + o } }
        : { a: { x: P.fixed + o, y: u0 }, b: { x: P.fixed + o, y: u1 } };
    return {
      segs: [
        { i: 1, ...off(0, P.ua, 0.3), tone: "thin" },
        { i: 2, ...off(0, P.ub, -0.3), tone: "thin" },
      ],
      txt: [
        along(P, P.ua / 2, abs(P.ua), "muted", 1, 8),
        along(P, P.ub / 2, abs(P.ub), "muted", 2, 8),
      ],
    };
  };
  const sumHtml = (P) =>
    `${hi(T.abs(P.ua))} + ${lo(T.abs(P.ub))} = ${hi(Math.abs(P.ua))} + ${lo(Math.abs(P.ub))} = ${P.d}`;
  const opts = (P) => choicesFor(P).map((o) => ({ ...o, label: T.units(o.n) }));
  const askDistance = (ctx, P, { question, saved, seed, onMiss, onCorrect }) =>
    choiceGate(ctx, { question, options: opts(P), seed, saved, onMiss, onCorrect });

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        quiet();
        ctx.expr("");
        ctx.say(T.situateSay);
        await view(ctx, { pts: [ORIGIN, ...dots(ctx, first)] }, 400);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        quiet();
        ctx.expr("");
        ctx.say(T.situateSay);
        const base = { pts: [ORIGIN, ...dots(ctx, first)] };
        await view(ctx, base, 0);
        ctx.panel.appendChild(
          askDistance(ctx, first, {
            question: T.predictQ(first),
            saved,
            seed: first.d + first.ua,
            onMiss: (opt) => {
              ctx.feedback(T.cue(first, opt), "cue");
              const extra = opt.kind === "sub" ? { pts: [...base.pts, zero(first)] } : base;
              return view(ctx, extra, 300);
            },
            onCorrect: () => {
              ctx.feedback(T.predictOk(first));
              ctx.unlock();
              return view(ctx, base, 200);
            },
          }),
        );
      },
    },
    {
      id: "count",
      label: T.scene.count,
      gate: true,
      async enter(ctx) {
        quiet();
        const P = first;
        const st = ctx.state;
        let k = Math.min(Math.max(0, Number(st.k) || 0), P.d);
        ctx.say(T.countSay(P));
        const prompt = document.createElement("p");
        prompt.className = "lsx-q";
        const draw = (ms) => {
          ctx.expr(escHtml(ctx.L(T.units(k))));
          prompt.textContent = ctx.L(T.countPrompt(P, k));
          return view(
            ctx,
            { pts: [ORIGIN, ...dots(ctx, P), zero(P), marker(P, k)], ...pieces(P, k) },
            ms,
          );
        };
        const row = document.createElement("div");
        row.className = "lsx-choices";
        const fwd = ctx.button({ label: T.stepFwd(P), primary: true, onClick: () => step(1) });
        const bwd = ctx.button({ label: T.stepBack, onClick: () => step(-1) });
        const finish = () => {
          fwd.disabled = true;
          prompt.textContent = ctx.L(T.countTotal(P.d));
          ctx.feedback(T.countDone(P));
          ctx.unlock();
        };
        function step(d) {
          const next = k + d;
          if (next < 0 || next > P.d || k === P.d) return;
          k = next;
          st.k = k;
          ctx.save();
          bwd.disabled = k === 0;
          draw(250).then(() => k === P.d && finish());
        }
        row.append(fwd, bwd);
        ctx.panel.append(prompt, row);
        const forward = P.horizontal
          ? P.dir > 0
            ? "ArrowRight"
            : "ArrowLeft"
          : P.dir > 0
            ? "ArrowUp"
            : "ArrowDown";
        const reverse = {
          ArrowRight: "ArrowLeft",
          ArrowLeft: "ArrowRight",
          ArrowUp: "ArrowDown",
          ArrowDown: "ArrowUp",
        }[forward];
        ctx.panel.addEventListener("keydown", (e) => {
          if (e.key === forward) step(1);
          else if (e.key === reverse) step(-1);
          else return;
          e.preventDefault();
        });
        bwd.disabled = k === 0;
        await draw(300);
        if (k === P.d) finish();
      },
    },
    {
      id: "abs",
      label: T.scene.abs,
      async enter(ctx) {
        quiet();
        const P = first;
        ctx.say(T.absSay(P));
        ctx.expr(sumHtml(P));
        await view(ctx, { pts: [ORIGIN, ...dots(ctx, P), zero(P)], ...pieces(P, P.d) }, 0);
        await view(ctx, { pts: [ORIGIN, ...dots(ctx, P), zero(P)], ...stretches(P) }, 700);
        ctx.feedback(T.absDone);
      },
    },
    {
      id: "same",
      label: T.scene.same,
      gate: true,
      async enter(ctx, saved) {
        quiet();
        const P = sameSide;
        ctx.say(T.sameSay);
        const base = { pts: [ORIGIN, ...dots(ctx, P), zero(P)] };
        const solved = { ...base, segs: [{ i: 0, a: P.a, b: P.b, tone: "hi" }] };
        const showSolved = (ms) => {
          const o = overlap(P);
          ctx.expr(escHtml(T.diffText(P)));
          return view(ctx, { ...solved, segs: [...solved.segs, ...o.segs], txt: o.txt }, ms);
        };
        ctx.expr("");
        await view(ctx, saved.solved ? solved : base, 700);
        if (saved.solved) {
          ctx.feedback(T.sameOk);
          await showSolved(0);
        }
        ctx.panel.appendChild(
          askDistance(ctx, P, {
            question: T.sameQ,
            saved,
            seed: P.d + 2,
            onMiss: (opt) => {
              ctx.feedback(T.cue(P, opt), "cue");
              return opt.kind === "add"
                ? view(ctx, { ...base, ...overlap(P) }, 400)
                : view(ctx, base, 200);
            },
            onCorrect: () => {
              ctx.feedback(T.sameOk);
              ctx.unlock();
              return showSolved(500);
            },
          }),
        );
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        quiet();
        const P = transfer;
        ctx.say(T.transferSay);
        const base = { pts: [ORIGIN, ...dots(ctx, P)] };
        const solved = { pts: [...base.pts, zero(P)], ...stretches(P) };
        ctx.expr(saved.solved ? sumHtml(P) : "");
        await view(ctx, saved.solved ? solved : base, 700);
        if (saved.solved) ctx.feedback(T.transferOk);
        ctx.panel.appendChild(
          askDistance(ctx, P, {
            question: T.predictQ(P),
            saved,
            seed: P.d * 3 + 1,
            onMiss: (opt) => {
              ctx.feedback(T.cue(P, opt), "cue");
              return view(ctx, opt.kind === "sub" ? { pts: [...base.pts, zero(P)] } : base, 300);
            },
            onCorrect: () => {
              ctx.feedback(T.transferOk);
              ctx.expr(sumHtml(P));
              return view(ctx, solved, 600);
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

export { analyzePair };
