// living/inequality-solve.js — solve an inequality, then graph it (lesson 8-6).
//
// Same number line as inequality-line.js (shared stage). The student predicts
// the solution of x + 3 > 53, chooses the move that gets x alone (the same
// inverse operation on BOTH sides, and the symbol stays), then tests values in
// the original AND the solved inequality — they always agree, which is why the
// solved graph shows every solution. The transfer solves the lesson's second
// form, x − 5 ≤ 8.
//
// Config: { mode: "solve", form: "add"|"sub", a, sym, b, letter, story,
//           transfer: { form, a, sym, b, letter, story } }.

import { escHtml } from "../../core/living-scene.js";
import {
  createLineStage,
  explainBox,
  H,
  markOf,
  pickScene,
  testPanel,
  W,
} from "./inequality-line.js";
import { dirOf, isClosed, rangeFor } from "./inequality-line-model.js";
import {
  holdsOrig,
  moveChoices,
  origText,
  solveCopy,
  solvedChoices,
  solvedText,
  stepText,
  testsDone,
  validateInequalitySolve,
  verdictBoth,
} from "./inequality-solve-model.js";

export { validateInequalitySolve };

export function buildInequalitySolvePlay(cfg) {
  const v = validateInequalitySolve(cfg);
  if (!v) return null;
  const T = solveCopy(v);
  const { main: q, transfer: t } = v;
  const stage = createLineStage();
  const enterCommon = () => {
    stage.pick = null;
  };
  const line = (p, extra = {}) => ({ ...rangeFor(p.limit), bold: p.limit, ...extra });
  const ray = (p) => ({
    ray: { limit: p.limit, dir: dirOf(p.sym) },
    dot: { limit: p.limit, closed: isClosed(p.sym) },
    note: T.marker(p),
  });
  const markFor = (p) => (opt) =>
    opt.v == null ? [] : [{ ...markOf(p, opt.v), ok: holdsOrig(p, opt.v) }];
  const labelled = (opts) =>
    opts.map((o) => ({ ...o, label: o.label || { en: o.text, es: o.text } }));
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  const finalOf = (p) => line(p, { top: solvedText(p), sub: stepText(p), ...ray(p) });

  const scenes = [
    {
      id: "inequality",
      label: T.labels[0],
      async enter(ctx) {
        enterCommon();
        ctx.say(T.situateSay);
        ctx.expr(escHtml(origText(q)));
        await stage.view(ctx, line(q, { top: origText(q) }), 500);
      },
    },
    {
      id: "predict",
      label: T.labels[1],
      gate: true,
      async enter(ctx, saved) {
        enterCommon();
        ctx.say(T.predictSay);
        ctx.expr(escHtml(origText(q)));
        const shown = line(q, { top: origText(q) });
        await pickScene(ctx, stage, saved, {
          options: labelled(solvedChoices(q)),
          question: T.predictQ,
          ok: T.predictOk,
          shown,
          final: shown,
          mark: markFor(q),
        });
      },
    },
    {
      id: "move",
      label: T.labels[2],
      gate: true,
      async enter(ctx, saved) {
        enterCommon();
        const st = ctx.state;
        const start = line(q, { top: origText(q) });
        ctx.say(T.moveSay);
        ctx.expr(escHtml(origText(q)));
        const options = moveChoices(q);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.moveQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              ctx.feedback(opt.cue, "cue");
              await stage.view(ctx, { ...start, marks: markFor(q)(opt) }, 250);
            },
            onCorrect: async () => {
              st.solved = true;
              ctx.save();
              ctx.expr(`${escHtml(stepText(q))} → ${hi(solvedText(q))}`);
              ctx.feedback(T.moveOk(q));
              ctx.unlock();
              await stage.view(ctx, { ...start, sub: stepText(q) }, 500);
              await stage.view(ctx, finalOf(q), 700);
            },
          }),
        );
        if (saved.solved) {
          ctx.expr(`${escHtml(stepText(q))} → ${hi(solvedText(q))}`);
          ctx.feedback(T.moveOk(q));
          await stage.view(ctx, finalOf(q), 0);
        } else await stage.view(ctx, start, 300);
      },
    },
    {
      id: "check",
      label: T.labels[3],
      gate: true,
      async enter(ctx, saved) {
        enterCommon();
        const st = ctx.state;
        const base = line(q, { top: solvedText(q), sub: origText(q), ...ray(q) });
        ctx.say(T.checkSay);
        ctx.expr(`${escHtml(origText(q))} → ${hi(solvedText(q))}`);
        const status = (seen) => {
          const d = testsDone(q, seen);
          const last = ctx.L(verdictBoth(q, seen[seen.length - 1]));
          if (d.boundary && d.inside && d.outside) {
            st.found = true;
            ctx.save();
            ctx.unlock();
            return ctx.feedback(`${last} — ${ctx.L(T.checkDone)}`);
          }
          const need = !d.boundary ? T.needBoundary : !d.inside ? T.needInside : T.needOutside;
          ctx.feedback(`${last} ${ctx.L(need)}`, "cue");
        };
        const { lo, hi: top } = rangeFor(q.limit);
        const tp = testPanel(ctx, stage, {
          lo,
          hi: top,
          ok: (x) => holdsOrig(q, x),
          verdict: (x) => verdictBoth(q, x),
          base,
          label: { en: q.letter, es: q.letter },
          onTest: status,
        });
        ctx.panel.appendChild(tp.el);
        await tp.paint(0);
        if (saved.found) ctx.feedback(T.checkDone);
      },
    },
    {
      id: "transfer",
      label: T.labels[4],
      async enter(ctx, saved) {
        enterCommon();
        ctx.say(T.transferSay);
        ctx.expr(escHtml(origText(t)));
        const shown = line(t, { top: origText(t) });
        await pickScene(ctx, stage, saved, {
          options: labelled(solvedChoices(t)),
          question: T.transferQ,
          ok: T.transferOk,
          shown,
          final: finalOf(t),
          mark: markFor(t),
          after: () => ctx.expr(`${escHtml(stepText(t))} → ${hi(solvedText(t))}`),
        });
        if (saved.solved) ctx.expr(`${escHtml(stepText(t))} → ${hi(solvedText(t))}`);
        explainBox(ctx, T);
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
    scenes,
  };
}
