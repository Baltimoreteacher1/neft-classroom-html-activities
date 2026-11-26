// living/plane-points-quadrant.js — the scenes of plane-points in "quadrant"
// mode (lesson 7-8): negative numbers walk the other way, and the signs of a
// pair name its quadrant.

import { escHtml } from "../../core/living-scene.js";
import { pt, quadrant } from "./plane-model.js";
import { moveWords, quadReadChoices, quadrantChoices } from "./plane-points-model.js";
import { choiceGate, ORIGIN, pairHtml, placeSequence } from "./plane-scene.js";
import { stopPlacer } from "./plane-stage.js";

export function quadrantScenes({ v, T, stage, view }) {
  const { A, B, others, E, range } = v;
  const named = (ctx, p, i, tone = "main") => ({
    i,
    x: p.x,
    y: p.y,
    tone,
    label: ctx.L(T.label(p)),
  });
  const ghost = (opt) => ({ i: 6, x: opt.p.x, y: opt.p.y, tone: "ghost", label: pt(opt.p) });
  const quiet = () => stopPlacer(stage());
  /** Show the quadrant names and/or their sign patterns. */
  const labels = (ctx, { names = true, signs = false }, ms) =>
    ctx.tween(
      stage().qEls.map((el, i) => [el, { opacity: i % 2 ? (signs ? 1 : 0) : names ? 1 : 0 }]),
      ms,
    );

  return [
    {
      id: "start",
      label: T.scene.start,
      async enter(ctx) {
        quiet();
        ctx.say(T.startSay);
        ctx.expr("");
        await view(ctx, { pts: [ORIGIN] }, 300);
        await labels(ctx, { names: false }, 0);
        const els = stage().qEls;
        for (let k = 0; k < 4; k++) await ctx.tween([[els[2 * k], { opacity: 1 }]], 450);
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
        await labels(ctx, {}, 0);
        await view(ctx, { pts: [ORIGIN] }, 0);
        const options = quadrantChoices(A, range).map((o) => ({ ...o, label: moveWords(o.p) }));
        ctx.panel.appendChild(
          choiceGate(ctx, {
            question: T.predictQ,
            options,
            seed: Math.abs(A.x) * 3 + Math.abs(A.y),
            saved,
            onMiss: (opt) => {
              ctx.feedback(T.quadCue(opt), "cue");
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
        await labels(ctx, {}, 0);
        await placeSequence(ctx, stage(), {
          targets,
          say: (i) => T.plotSay(targets[i]),
          placeLabel: T.place,
          ask: (i) => T.plotQ(targets[i]),
          ok: (i) => T.plotOk(targets[i]),
          done: () => ctx.unlock(),
          render(n, ms) {
            const last = targets[n - 1];
            ctx.expr(last ? pairHtml(last.x, last.y) : escHtml(pt(targets[0])));
            const pts = targets.slice(0, n).map((p, i) => named(ctx, p, i));
            return view(ctx, { pts: [ORIGIN, ...pts] }, ms);
          },
        });
      },
    },
    {
      id: "signs",
      label: T.scene.signs,
      async enter(ctx) {
        quiet();
        ctx.say(T.signsSay);
        ctx.expr([A, B].map((p) => escHtml(ctx.L(T.signsRow(p)))).join("<br>"));
        await view(ctx, { pts: [ORIGIN, named(ctx, A, 0), named(ctx, B, 1)] }, 300);
        await labels(ctx, { signs: true }, 500);
      },
    },
    {
      id: "name",
      label: T.scene.name,
      gate: true,
      async enter(ctx) {
        quiet();
        const st = ctx.state;
        let k = Math.min(Math.max(0, Number(st.k) || 0), others.length);
        ctx.say(T.nameSay);
        ctx.expr("");
        await labels(ctx, { signs: true }, 0);
        const draw = (ms) => {
          const upto = Math.min(k + 1, others.length);
          const pts = others.slice(0, upto).map((p, i) => named(ctx, p, 2 + i));
          return view(ctx, { pts: [ORIGIN, ...pts] }, ms);
        };
        const ask = () => {
          ctx.panel.innerHTML = "";
          if (k >= others.length) return;
          const p = others[k];
          const options = [1, 2, 3, 4].map((n) => ({
            n,
            label: T.quadOpt(n),
            correct: n === quadrant(p),
          }));
          ctx.panel.appendChild(
            ctx.choices({
              question: T.nameQ(p),
              options,
              onMiss: (_i, opt) => ctx.feedback(T.nameCue(opt.n, p), "cue"),
              onCorrect: async () => {
                k += 1;
                st.k = k;
                ctx.save();
                ctx.feedback(T.nameOk(p));
                if (k >= others.length) ctx.unlock();
                await draw(400);
                ask();
              },
            }),
          );
        };
        await draw(300);
        if (k >= others.length) {
          ctx.feedback(T.nameOk(others[others.length - 1]));
          ctx.unlock();
          return;
        }
        ask();
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        quiet();
        ctx.say(T.transferSay);
        ctx.expr(saved.solved ? pairHtml(E.x, E.y) : "");
        await labels(ctx, { signs: true }, 0);
        const dot = (label) => ({ i: 5, x: E.x, y: E.y, tone: "alt", label });
        await view(ctx, { pts: [ORIGIN, dot(saved.solved ? pt(E) : "?")] }, 400);
        const options = quadReadChoices(E, range).map((o) => ({ ...o, label: pt(o.p) }));
        ctx.panel.appendChild(
          choiceGate(ctx, {
            question: T.transferQ,
            options,
            seed: Math.abs(E.x) * 5 + Math.abs(E.y),
            saved,
            onMiss: (opt) => {
              ctx.feedback(T.readCue(opt), "cue");
              return view(ctx, { pts: [ORIGIN, dot("?"), ghost(opt)] }, 300);
            },
            onCorrect: () => {
              ctx.feedback(T.transferOk);
              ctx.expr(pairHtml(E.x, E.y));
              return view(ctx, { pts: [ORIGIN, dot(pt(E))] }, 300);
            },
          }),
        );
        ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
      },
    },
  ];
}
