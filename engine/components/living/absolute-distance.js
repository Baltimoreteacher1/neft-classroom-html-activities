// living/absolute-distance.js — absolute value as DISTANCE from 0 (Lesson 7-3:
// |−6| from a debt of $6, |−2.5| and |3/4|, and the five treasures).
//
// One horizontal, equally spaced line. The student predicts the distance of a
// dot from 0, slides the dot and finds two spots with the same bar (a number
// and its opposite), sees value (the side of 0) beside size (the bar), takes
// a decimal and a fraction, and finally picks the treasure farthest from 0,
// where the greatest number is the trap.
//
// Config: { min, max, value, story, prefix, neg, pos,
//           decimal:{value}, fraction:{value,den},
//           transfer:{ items:[{v,name}] } }  (see validateAbsoluteDistance)

import { escHtml } from "../../core/living-scene.js";
import {
  abs,
  absoluteCopy,
  decimalChoices,
  foundPair,
  placeCorrect,
  predictChoices,
  validateAbsoluteDistance,
} from "./absolute-distance-model.js";
import { fracText, num, slotFor } from "./numline-model.js";
import { createStage, layoutOf } from "./numline-stage.js";

export { validateAbsoluteDistance };

export function buildAbsoluteDistancePlay(cfg) {
  const v = validateAbsoluteDistance(cfg);
  if (!v) return null;
  const T = absoluteCopy(v);
  const { value: x, decimal: d, fraction: f, transfer: tr } = v;
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  const scale = { min: v.min, max: v.max, labelEvery: v.labelEvery, tickEvery: 1 };
  let stage = null;

  function setup(ctx) {
    stage = createStage(ctx, { axis: "h" });
    stage.scale(scale);
    stage.mark("a", "x");
    stage.mark("b", "u");
    tr.items.forEach((_, i) => stage.mark(`t${i}`, "x"));
  }
  const view = (ctx, states, ms) => stage.show(ctx, states, ms);
  const withBar = (ctx, n, extra = {}) => ({
    v: n,
    label: num(n),
    bar: n !== 0,
    lane: "up",
    barLabel: ctx.L(T.unitsOf(n)),
    ...extra,
  });

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.expr(hi(num(x)));
        ctx.say(T.situateSay);
        await view(ctx, { a: { v: 0, label: null } }, 0);
        await view(ctx, { a: { v: x, label: num(x) } }, 600);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        ctx.say(T.predictSay);
        const reveal = (ms) => {
          ctx.expr(hi(`|${num(x)}| = ${abs(x)}`));
          return view(ctx, { a: withBar(ctx, x) }, ms);
        };
        if (saved.solved) await reveal(0);
        else {
          ctx.expr(hi(`|${num(x)}| = ?`));
          await view(ctx, { a: { v: x, label: num(x) } }, 300);
        }
        const options = placeCorrect(
          predictChoices(x).map((o) => ({ ...o, label: T.predictLabel(o) })),
          slotFor(abs(x), 3),
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.predictCue(opt.kind), "cue");
              const ghost = opt.kind === "span" ? { v: abs(x) * Math.sign(-x) } : null;
              return view(ctx, { a: { v: x, label: num(x) }, ghost }, 300);
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              await reveal(700);
            },
          }),
        );
        if (saved.solved) ctx.feedback(T.predictOk);
      },
    },
    {
      id: "explore",
      label: T.scene.explore,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        const M = v.max;
        st.seen = Array.isArray(st.seen)
          ? st.seen.filter((n) => Number.isInteger(n) && abs(n) <= M)
          : [];
        if (!st.seen.includes(x)) st.seen.push(x);
        const cur0 = Number.isInteger(st.cur) && abs(st.cur) <= M ? st.cur : x;
        const row = document.createElement("p");
        row.className = "lsx-fb";
        row.setAttribute("aria-live", "polite");
        const pairOf = () => st.seen.find((n) => n !== 0 && st.seen.includes(-n));
        const apply = (n, ms) => {
          ctx.expr(hi(`|${num(n)}| = ${abs(n)}`));
          row.textContent = ctx.L(T.exploreRow(n));
          const states = { a: withBar(ctx, n) };
          const p = pairOf();
          if (p != null)
            states.b = withBar(ctx, -p, { look: "u", lane: "down", v: -p, label: num(-p) });
          return view(ctx, states, ms);
        };
        const progress = () => {
          const p = pairOf();
          if (foundPair(st.seen) && p != null) {
            ctx.feedback(T.exploreOk(abs(p)));
            ctx.unlock();
          } else ctx.feedback(T.exploreCue(st.seen.length), "cue");
        };
        ctx.say(T.exploreSay);
        const rng = ctx.range({
          label: T.exploreLabel,
          min: -M,
          max: M,
          value: cur0,
          onInput: async (n) => {
            st.cur = n;
            if (!st.seen.includes(n)) st.seen.push(n);
            ctx.save();
            await apply(n, 200);
            progress();
          },
        });
        const input = /** @type {HTMLInputElement} */ (rng.querySelector("input"));
        const out = /** @type {HTMLOutputElement} */ (rng.querySelector("output"));
        out.textContent = num(cur0);
        input.addEventListener("input", () => {
          out.textContent = num(Number(input.value));
        });
        ctx.panel.append(rng, row);
        await apply(cur0, 500);
        progress();
      },
    },
    {
      id: "symbols",
      label: T.scene.symbols,
      async enter(ctx) {
        const m = abs(x);
        ctx.say(T.symbolsSay);
        ctx.expr(hi(T.symbolsExpr));
        ctx.feedback(T.symbolsFb);
        await view(
          ctx,
          {
            a: withBar(ctx, -m, { label: ctx.L(T.owe) }),
            b: withBar(ctx, m, { look: "u", lane: "down", label: ctx.L(T.have) }),
          },
          700,
        );
      },
    },
    {
      id: "decimal",
      label: T.scene.decimal,
      gate: true,
      async enter(ctx, saved) {
        ctx.say(T.decimalSay);
        const states = (solved) => ({
          a: solved ? withBar(ctx, d) : { v: d, label: num(d) },
          ...(solved
            ? {
                b: withBar(ctx, f.value, {
                  look: "u",
                  lane: "down",
                  label: fracText(f.value, f.den),
                  barLabel: fracText(abs(f.value), f.den),
                }),
              }
            : {}),
        });
        ctx.expr(hi(T.decimalExpr(!!saved.solved)));
        await view(ctx, states(!!saved.solved), saved.solved ? 0 : 400);
        const options = placeCorrect(
          decimalChoices(d).map((o) => ({ ...o, label: { en: num(o.value), es: num(o.value) } })),
          slotFor(abs(d) * 2, 3),
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.decimalQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.decimalCue(opt.kind), "cue");
              return view(ctx, { ...states(false), ghost: null }, 250);
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T.decimalOk);
              ctx.expr(hi(T.decimalExpr(true)));
              ctx.unlock();
              await view(ctx, states(true), 700);
            },
          }),
        );
        if (saved.solved) ctx.feedback(T.decimalOk);
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        ctx.say(T.transferSay);
        const states = (solved) =>
          Object.fromEntries(
            tr.items.map((it, i) => [
              `t${i}`,
              solved && it === tr.far
                ? withBar(ctx, it.v, { look: "u" })
                : { v: it.v, label: num(it.v) },
            ]),
          );
        ctx.expr(saved.solved ? hi(T.transferExpr) : "");
        await view(ctx, states(!!saved.solved), saved.solved ? 0 : 500);
        const options = tr.items.map((it) => ({
          item: it,
          correct: it === tr.far,
          label: T.transferLabel(it),
        }));
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.transferCue(opt.item), "cue");
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              ctx.expr(hi(T.transferExpr));
              await view(ctx, states(true), 600);
            },
          }),
        );
        if (saved.solved) ctx.feedback(T.transferOk);
        ctx.panel.appendChild(ctx.frame({ label: T.explainLabel, frame: T.explainFrame }));
      },
    },
  ];

  return {
    kicker: T.kicker,
    title: T.title,
    viewBox: `0 0 ${layoutOf("h").W} ${layoutOf("h").H}`,
    ariaLabel: T.ariaLabel,
    printSummary: T.printSummary,
    setup,
    scenes,
  };
}
