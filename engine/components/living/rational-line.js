// living/rational-line.js — placing a rational number at an EXACT spot on a
// number line (Lesson 7-2: the Buried Gem at −2.5, the Shore Marker at 0.75,
// the Tide Mark at −1/2).
//
// One horizontal, equally spaced line and a few persistent marks. Scene 2 asks
// where −2.5 goes (between which whole numbers, and where in that space);
// scene 3 lets the student slide a dot along a line that shows the equal parts
// the denominator makes; scene 4 mirrors the Gem to its opposite; scene 5 asks
// which of four lettered points is −1/2.
//
// Config: { min, max, target:{value,name}, place:{value,den,name},
//           transfer:{value,name} }  (see validateRationalLine)

import { escHtml } from "../../core/living-scene.js";
import { betweenInts, fracText, num, slotFor } from "./numline-model.js";
import { createStage, layoutOf } from "./numline-stage.js";
import {
  partsOf,
  placeCorrect,
  predictChoices,
  rationalCopy,
  validateRationalLine,
} from "./rational-line-model.js";

export { validateRationalLine };

export function buildRationalLinePlay(cfg) {
  const v = validateRationalLine(cfg);
  if (!v) return null;
  const T = rationalCopy(v);
  const { target: tg, place: pl, transfer: tr } = v;
  const tv = tg.value;
  const [tlo, thi] = betweenInts(tv);
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;
  const scale = { min: v.min, max: v.max, labelEvery: 1, tickEvery: 1 };
  let stage = null;

  function setup(ctx) {
    stage = createStage(ctx, { axis: "h" });
    stage.scale(scale);
    stage.mark("a", "x");
    stage.mark("b", "u");
    for (let i = 0; i < 4; i++) stage.mark(`t${i}`, "x");
  }
  const view = (ctx, states, ms) => stage.show(ctx, states, ms);
  const gem = (ctx) => ({ v: tv, label: `${ctx.L(T.names.tg)} ${num(tv)}` });
  const gemBand = { band: { a: tlo, b: thi }, sub: { a: tlo, b: thi, den: 2 } };

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        ctx.expr(hi(num(tv)));
        ctx.say(T.situateSay);
        await view(ctx, {}, 0);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        ctx.say(T.predictSay);
        const reveal = (ms) => {
          ctx.expr(`${hi(num(tv))} = ${lo(fracText(tv, 2))}`);
          return view(ctx, { a: gem(ctx), ...gemBand }, ms);
        };
        ctx.expr(hi(`${num(tv)}`));
        if (saved.solved) await reveal(0);
        else await view(ctx, {}, 300);
        const options = placeCorrect(
          predictChoices(tv).map((o) => ({ ...o, label: T.predictLabel(o.value) })),
          slotFor(tv * 2, 4),
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.predictCue(opt.kind, opt.value), "cue");
              return view(ctx, { ghost: { v: opt.value } }, 300);
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
      id: "place",
      label: T.scene.place,
      gate: true,
      async enter(ctx, saved) {
        const st = ctx.state;
        const kTarget = Math.round(pl.value * pl.den);
        const solved = !!saved.solved;
        const k0 = solved ? kTarget : Number.isInteger(saved.k) ? saved.k : 0;
        const row = document.createElement("p");
        row.className = "lsx-fb";
        row.setAttribute("aria-live", "polite");
        const apply = (k, ms) => {
          const x = k / pl.den;
          const b = betweenInts(x) || [x, x + 1];
          ctx.expr(hi(num(x)));
          row.textContent = ctx.L(T.placeRow(x));
          const states = { a: { v: x, label: num(x) }, band: { a: b[0], b: b[1] } };
          states.sub = { a: b[0], b: b[1], den: pl.den };
          return view(ctx, states, ms);
        };
        const check = (k) => {
          if (k === kTarget) {
            st.solved = true;
            ctx.feedback(T.placeOk);
            ctx.unlock();
          } else ctx.feedback(T.placeCue(k / pl.den), "cue");
        };
        ctx.say(T.placeSay);
        const rng = ctx.range({
          label: T.placeLabel,
          min: v.min * pl.den,
          max: v.max * pl.den,
          value: k0,
          onInput: async (k) => {
            st.k = k;
            ctx.save();
            await apply(k, 200);
            check(k);
          },
        });
        const input = /** @type {HTMLInputElement} */ (rng.querySelector("input"));
        const out = /** @type {HTMLOutputElement} */ (rng.querySelector("output"));
        out.textContent = num(k0 / pl.den);
        input.addEventListener("input", () => {
          out.textContent = num(Number(input.value) / pl.den);
        });
        ctx.panel.append(rng, row);
        await apply(k0, 500);
        if (solved) ctx.feedback(T.placeOk);
      },
    },
    {
      id: "mirror",
      label: T.scene.mirror,
      async enter(ctx) {
        ctx.say(T.mirrorSay);
        ctx.expr(hi(T.mirrorExpr));
        ctx.feedback(T.mirrorFb);
        const d = ctx.L(T.unitsOf(tv));
        await view(
          ctx,
          {
            a: { ...gem(ctx), bar: true, lane: "up", barLabel: d },
            b: {
              v: -tv,
              look: "u",
              label: `${ctx.L(T.names.opp)} ${num(-tv)}`,
              bar: true,
              lane: "down",
              barLabel: d,
            },
          },
          700,
        );
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        const letters = tr.choices;
        const mark = (c, solved) => ({
          v: c.value,
          label: c.letter,
          look: solved && c.correct ? "u" : "x",
          bar: !!(solved && c.correct),
          lane: "up",
          barLabel: ctx.L(T.unitsOf(c.value)),
        });
        const states = (solved) =>
          Object.fromEntries(letters.map((c, i) => [`t${i}`, mark(c, solved)]));
        const trFrac = fracText(tr.value, tr.den);
        const exprFor = (solved) => (solved ? `${hi(trFrac)} = ${lo(num(tr.value))}` : hi(trFrac));
        ctx.say(T.transferSay);
        ctx.expr(exprFor(!!saved.solved));
        if (saved.solved) await view(ctx, states(true), 0);
        else await view(ctx, states(false), 500);
        const options = letters.map((c) => ({
          ...c,
          label: { en: c.letter, es: c.letter },
        }));
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.transferCue(opt.kind, opt.value), "cue");
              return view(ctx, { ...states(false), ghost: { v: opt.value } }, 300);
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              ctx.expr(exprFor(true));
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
