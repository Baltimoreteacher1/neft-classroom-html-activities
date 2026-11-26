// living/plane-scene.js — scene helpers shared by the plane-* plays: a
// prediction gate, and a "place these points one at a time" sequence.

import { escHtml } from "../../core/living-scene.js";
import { classifyPlacement, fmt, placeCorrect, plotCue } from "./plane-model.js";
import { makePlacer } from "./plane-stage.js";

/** The origin: a small ink dot every scene keeps on the stage. */
export const ORIGIN = { i: 9, x: 0, y: 0, tone: "ink", r: 5 };

export const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
export const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;

/** An ordered pair with x in the "hi" style and y in the "lo" style, as HTML. */
export const pairHtml = (x, y) => `(${hi(fmt(x))}, ${lo(fmt(y))})`;

/**
 * A prediction / reading gate. options: [{label, correct, ...}]; `onMiss(opt)`
 * draws that choice's pointer and cue, `onCorrect()` finishes the scene.
 */
export function choiceGate(ctx, { question, options, seed, saved, onMiss, onCorrect }) {
  const opts = placeCorrect(options, seed);
  return ctx.choices({
    question,
    options: opts,
    restore: saved?.solved ? opts.findIndex((o) => o.correct) : null,
    onMiss: (_i, opt) => onMiss(opt),
    onCorrect: () => {
      ctx.state.solved = true;
      ctx.save();
      onCorrect();
    },
  });
}

const prompt = (text) => {
  const q = document.createElement("p");
  q.className = "lsx-q";
  q.textContent = text;
  return q;
};

export { prompt };

/**
 * Place `targets` one at a time with the crosshair. A miss gets a cue naming the
 * mismatch (never the target); a hit locks that point and moves to the next.
 *
 *   render(n, ms)  — draw the stage with the first n targets placed
 *   ask(i)         — {en, es} instruction for target i
 *   say(i)         — optional narration for target i
 *   ok(i)          — {en, es} feedback after target i is placed
 *   done()         — all placed (unlock the scene)
 *   startFor(i)    — where the crosshair starts for target i (default: origin)
 *   classify(t,p)  — a custom diagnosis (default: classifyPlacement; "ok" accepts)
 *   cue(kind,t,p)  — a custom cue; default is plotCue
 */
export async function placeSequence(ctx, stage, o) {
  const st = ctx.state;
  const total = o.targets.length;
  let n = Math.min(Math.max(0, Number(st.n) || 0), total);
  const mount = () => {
    ctx.panel.innerHTML = "";
    if (n >= total) return;
    const t = o.targets[n];
    if (o.say) ctx.say(o.say(n));
    const placer = makePlacer(ctx, stage, {
      step: o.step || 1,
      start: o.startFor?.(n) || { x: 0, y: 0 },
      placeLabel: o.placeLabel,
      onPlace: async (p) => {
        const kind = (o.classify || classifyPlacement)(t, p);
        if (kind !== "ok") {
          ctx.feedback((o.cue || plotCue)(kind, t, p), "cue");
          return;
        }
        placer.lock();
        n += 1;
        st.n = n;
        ctx.save();
        ctx.feedback(o.ok(n - 1));
        await o.render(n, 450);
        if (!ctx.panel.contains(placer.el)) return; // the student left this scene
        if (n >= total) {
          ctx.panel.innerHTML = "";
          o.done();
        } else mount();
      },
    });
    ctx.panel.append(prompt(ctx.L(o.ask(n))), placer.el);
  };
  await o.render(n, 300);
  if (n >= total) {
    ctx.panel.innerHTML = "";
    ctx.feedback(o.ok(total - 1));
    o.done();
    return;
  }
  mount();
}
