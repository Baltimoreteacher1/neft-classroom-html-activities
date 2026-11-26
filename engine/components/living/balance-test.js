// living/balance-test.js — "is it a solution?" on a balance scale (lesson 8-1).
//
// The scale holds the equation n + 8 = 20 (a clue turned into symbols): the left
// pan holds the unknown n and 8, the right pan holds 20. The student predicts
// what a detective's guess does to the scale, slides n through values to find
// the one that balances it (a solution is a value that makes both sides equal),
// sees the substitution table that records the same test in symbols, and then
// writes and tests a second equation from a new clue.
//
// Config: { mode: "test", form: "add", a, b, letter, story, words:[3 phrases],
//           guess, transfer: { a, b, letter, story } }. See balance-test-model.js.
// The stage is shared with balance-solve.js (createBalanceStage).

import { escHtml } from "../../core/living-scene.js";
import { createBalanceStage, HS, W } from "./balance-solve.js";
import { eqText, P, pan, tiltFor } from "./balance-solve-model.js";
import {
  guessChoices,
  testCopy,
  testPans,
  testScale,
  validateBalanceTest,
  valueChoices,
  writeChoices,
} from "./balance-test-model.js";

export { validateBalanceTest };

export function buildBalanceTestPlay(cfg) {
  const v = validateBalanceTest(cfg);
  if (!v) return null;
  const T = testCopy(v);
  const e = v.eq;
  const t2 = v.transfer.eq;
  const stage = createBalanceStage();
  const ex = (s) => ({ en: s, es: s });
  const textOptions = (opts) => opts.map((o) => ({ ...o, label: o.label || ex(o.text) }));

  /** Both pans of equation q with the unknown at its true value (balanced). */
  const balanced = (q, label) => ({
    scale: testScale(q),
    L: pan([P(q.x, label ?? q.L, "x"), P(q.a, String(q.a))]),
    R: pan([P(q.b, String(q.b))]),
    top: { L: `${q.L} + ${q.a}`, R: String(q.b) },
    sym: "=",
    tilt: 0,
  });
  /** The scale with the unknown replaced by the tested value t. */
  const tested = (q, t) => {
    const l = t + q.a;
    return {
      scale: testScale(q),
      ...testPans(q, t),
      top: { L: `${t} + ${q.a} = ${l}`, R: String(q.b) },
      sym: l === q.b ? "=" : "≠",
      tilt: tiltFor(l - q.b),
    };
  };
  const blank = { scale: 1, L: pan([]), R: pan([]), top: { L: "", R: "" } };
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;

  const scenes = [
    {
      id: "clue",
      label: T.labels[0],
      async enter(ctx) {
        ctx.say(T.situateSay);
        const full = balanced(e);
        const just = (L, R, topL) => ({ ...full, L, R, top: { L: topL, R: "" }, sym: "" });
        await stage.view(ctx, blank, 0);
        ctx.expr(escHtml(T.exprSteps[0]));
        await stage.view(ctx, just(pan([full.L[0]]), pan([]), e.L), 450);
        ctx.expr(escHtml(T.exprSteps[1]));
        await stage.view(ctx, just(pan(full.L.slice(0, 2)), pan([]), T.exprSteps[1]), 450);
        ctx.expr(`${escHtml(T.exprSteps[2])}`);
        await stage.view(ctx, full, 600);
      },
    },
    {
      id: "predict",
      label: T.labels[1],
      gate: true,
      async enter(ctx, saved) {
        ctx.say(T.predictSay);
        ctx.expr(escHtml(eqText(e)));
        const guess = tested(e, v.guess);
        await stage.view(ctx, saved.solved ? guess : balanced(e), 300);
        const options = guessChoices(e, v.guess);
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.predictOk);
              ctx.unlock();
              await stage.view(ctx, guess, 650);
            },
          }),
        );
        if (saved.solved) ctx.feedback(T.predictOk);
      },
    },
    {
      id: "test",
      label: T.labels[2],
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        const start = Number.isInteger(st.t) && st.t >= 0 && st.t <= e.b ? st.t : v.guess;
        const apply = async (n, ms) => {
          const l = n + e.a;
          ctx.expr(escHtml(`${n} + ${e.a} = ${l}`));
          if (l === e.b) {
            st.found = true;
            ctx.save();
            ctx.feedback(T.testFound);
            ctx.unlock();
          } else ctx.feedback(T.testMiss(n), "cue");
          await stage.view(ctx, tested(e, n), ms);
        };
        ctx.say(T.testSay);
        ctx.panel.appendChild(
          ctx.range({
            label: ex(e.L),
            min: 0,
            max: e.b,
            value: start,
            onInput: (n) => {
              st.t = n;
              ctx.save();
              return apply(n, 250);
            },
          }),
        );
        await apply(start, 400);
        if (!st.found && start === v.guess) ctx.feedback("");
      },
    },
    {
      id: "check",
      label: T.labels[3],
      async enter(ctx) {
        ctx.say(T.connectSay);
        ctx.expr(`${escHtml(eqText(e))} → ${hi(`${e.L} = ${e.x}`)}`);
        const base = { ...balanced(e, String(e.x)), top: { L: `${e.x} + ${e.a}`, R: String(e.b) } };
        await stage.view(ctx, { ...base, ladder: T.rows, ladderOn: 0 }, 0);
        for (let k = 1; k <= T.rows.length; k++)
          await stage.view(ctx, { ...base, ladder: T.rows, ladderOn: k }, 350);
      },
    },
    {
      id: "transfer",
      label: T.labels[4],
      async enter(ctx) {
        const st = ctx.state;
        ctx.say(T.transferSay);
        ctx.expr("");
        await stage.view(ctx, blank, 0);
        const frame = ctx.frame({ label: T.explainLabel, frame: T.explainFrame });
        const solvedState = {
          ...tested(t2, t2.x),
          top: { L: `${t2.x} + ${t2.a} = ${t2.b}`, R: String(t2.b) },
        };
        const q2 = () => {
          const options = textOptions(valueChoices(t2));
          return ctx.choices({
            question: T.q2,
            options,
            restore: st.q2 ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              st.q2 = true;
              ctx.save();
              ctx.expr(escHtml(`${t2.x} + ${t2.a} = ${t2.b}`));
              ctx.feedback(T.ok2);
              await stage.view(ctx, solvedState, 650);
            },
          });
        };
        const options = textOptions(writeChoices(t2));
        ctx.panel.appendChild(
          ctx.choices({
            question: T.q1,
            options,
            restore: st.q1 ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              st.q1 = true;
              ctx.save();
              ctx.expr(escHtml(eqText(t2)));
              ctx.feedback(T.ok1);
              ctx.panel.insertBefore(q2(), frame);
              await stage.view(ctx, balanced(t2), 650);
            },
          }),
        );
        ctx.panel.appendChild(frame);
        if (st.q1) {
          ctx.expr(escHtml(eqText(t2)));
          ctx.panel.insertBefore(q2(), frame);
          await stage.view(ctx, st.q2 ? solvedState : balanced(t2), 0);
          if (st.q2) {
            ctx.expr(escHtml(`${t2.x} + ${t2.a} = ${t2.b}`));
            ctx.feedback(T.ok2);
          }
        }
      },
    },
  ];

  return {
    kicker: T.kicker,
    title: T.title,
    viewBox: `0 0 ${W} ${HS}`,
    ariaLabel: T.ariaLabel,
    printSummary: T.printSummary,
    setup: stage.setup,
    scenes,
  };
}
