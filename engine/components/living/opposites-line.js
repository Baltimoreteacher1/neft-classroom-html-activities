// living/opposites-line.js — an integer and its opposite on a vertical number
// line (Lesson 7-1: Toronto's 9°C and Reykjavik's −9°C; Badwater Basin's −86 m).
//
// One cast: two dots on one equally spaced line. Scene 1 places the first dot
// from a real situation; scene 2 asks where its opposite will go; scene 3 lets
// the student slide the dot and watch the opposite mirror it across 0 with two
// equal distance bars; scene 4 writes it as −(a) and takes the opposite twice;
// scene 5 asks about 0; scene 6 changes the scale (±100) for Badwater Basin.
//
// Config: { min, max, labelEvery, tickEvery, unit, uw, up, down, zero, story,
//           value, pos, neg, transfer: { min, max, labelEvery, tickEvery, unit,
//           uw, up, down, zero, name, story, value } }
// min must equal −max. Anything the stage cannot draw makes the play refuse.

import { escHtml } from "../../core/living-scene.js";
import { slotFor, withUnit } from "./numline-model.js";
import { createStage, layoutOf } from "./numline-stage.js";
import {
  oppositesCopy,
  placeCorrect,
  predictChoices,
  transferChoices,
  validateOppositesLine,
} from "./opposites-line-model.js";

export { validateOppositesLine };

export function buildOppositesLinePlay(cfg) {
  const v = validateOppositesLine(cfg);
  if (!v) return null;
  const T = oppositesCopy(v);
  const a = v.value;
  const t = v.transfer;
  const u = (x) => withUnit(x, v.unit);
  const tu = (x) => withUnit(x, t.unit);
  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;
  const mainScale = { min: v.min, max: v.max, labelEvery: v.labelEvery, tickEvery: v.tickEvery };
  const transferScale = {
    min: t.min,
    max: t.max,
    labelEvery: t.labelEvery,
    tickEvery: t.tickEvery,
  };
  let stage = null;

  function setup(ctx) {
    stage = createStage(ctx, { axis: "v" });
    stage.scale(mainScale);
    stage.mark("a", "x");
    stage.mark("b", "u");
  }

  /** Put the whole stage in one state; `o` carries only what differs between scenes. */
  const view = (ctx, o, ms) => {
    const zero = o.zero === false ? "" : ctx.L("zeroNote" in o ? o.zeroNote : T.zeroNote);
    return stage.show(ctx, { zero, ...o.states, ghost: o.ghost || null }, ms);
  };
  const dot = (ctx, x, name, look, fmtU, w) => ({
    v: x,
    look,
    label: `${name ? `${ctx.L(name)} ` : ""}${fmtU(x)}`,
    bar: x !== 0,
    barLabel: ctx.L(T.plain(x, w)),
  });
  const posDot = (ctx) => dot(ctx, a, T.names.pos, "x", u, v.uw);
  const negDot = (ctx) => dot(ctx, -a, T.names.neg, "u", u, v.uw);
  const choiceLabel = (x) => ({ en: u(x), es: u(x) });

  const scenes = [
    {
      id: "situate",
      label: T.scene.situate,
      async enter(ctx) {
        stage.scale(mainScale);
        ctx.expr(hi(u(a)));
        ctx.say(T.situateSay);
        await view(ctx, { states: { a: { v: 0, label: u(0), bar: false } } }, 0);
        await view(ctx, { states: { a: posDot(ctx) } }, 700);
      },
    },
    {
      id: "predict",
      label: T.scene.predict,
      gate: true,
      async enter(ctx, saved) {
        stage.scale(mainScale);
        ctx.say(T.predictSay);
        const reveal = (ms) => {
          ctx.expr(`${hi(u(a))} → ${lo(u(-a))}`);
          return view(ctx, { states: { a: posDot(ctx), b: negDot(ctx) } }, ms);
        };
        if (saved.solved) await reveal(0);
        else {
          ctx.expr(`${hi(u(a))} → ?`);
          await view(ctx, { states: { a: posDot(ctx) } }, 300);
        }
        const options = placeCorrect(
          predictChoices(a).map((o) => ({ ...o, label: choiceLabel(o.value) })),
          slotFor(a, 4),
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.predictQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.predictCue(opt.kind), "cue");
              return view(ctx, { states: { a: posDot(ctx) }, ghost: { v: opt.value } }, 300);
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.feedback(T.predictOk);
              ctx.unlock();
              await reveal(700);
            },
          }),
        );
      },
    },
    {
      id: "mirror",
      label: T.scene.mirror,
      gate: true,
      async enter(ctx) {
        stage.scale(mainScale);
        const st = ctx.state;
        const M = v.max;
        st.seen = Array.isArray(st.seen)
          ? st.seen.filter((x) => Number.isInteger(x) && Math.abs(x) <= M)
          : [];
        const startX = st.seen.length ? st.seen[st.seen.length - 1] : a;
        const row = document.createElement("p");
        row.className = "lsx-fb";
        row.setAttribute("aria-live", "polite");
        const apply = (x, ms) => {
          ctx.expr(`${hi(u(x))} ↔ ${lo(u(-x))}`);
          row.textContent = ctx.L(T.mirrorRow(x));
          const pair = {
            a: { ...dot(ctx, x, T.names.dot, "x", u, v.uw) },
            b: { ...dot(ctx, -x, T.names.opp, "u", u, v.uw) },
          };
          if (x === 0) pair.b.label = null;
          return view(ctx, { states: pair, zero: false }, ms);
        };
        const progress = () => {
          if (st.seen.length >= 3) {
            ctx.feedback(T.mirrorLesson);
            ctx.unlock();
          } else ctx.feedback(T.mirrorTry(3 - st.seen.length), "cue");
        };
        ctx.say(T.mirrorSay);
        const rng = ctx.range({
          label: T.mirrorLabel,
          min: -M,
          max: M,
          value: startX,
          onInput: async (x) => {
            if (!st.seen.includes(x) && x !== a) st.seen.push(x);
            ctx.save();
            await apply(x, 200);
            progress();
          },
        });
        const input = /** @type {HTMLInputElement} */ (rng.querySelector("input"));
        const out = /** @type {HTMLOutputElement} */ (rng.querySelector("output"));
        out.textContent = u(startX);
        input.addEventListener("input", () => {
          out.textContent = u(Number(input.value));
        });
        ctx.panel.append(rng, row);
        await apply(startX, 500);
        progress();
      },
    },
    {
      id: "notation",
      label: T.scene.notation,
      gate: true,
      async enter(ctx, saved) {
        stage.scale(mainScale);
        let n = Number.isInteger(saved.n) && saved.n >= 0 && saved.n <= 2 ? saved.n : 0;
        const paint = (ms) => {
          ctx.expr(hi(T.notationExpr(n)));
          const bDot = { ...negDot(ctx), v: n === 2 ? a : -a };
          if (n === 2) bDot.label = null;
          const states = n === 0 ? { a: posDot(ctx) } : { a: posDot(ctx), b: bDot };
          return view(ctx, { states }, ms);
        };
        const btn = ctx.button({
          label: T.notationBtn(n),
          primary: true,
          onClick: async () => {
            if (n >= 2) return;
            n += 1;
            ctx.state.n = n;
            ctx.save();
            btn.textContent = ctx.L(T.notationBtn(n));
            btn.disabled = n >= 2;
            ctx.feedback(T.notationFb(n));
            await paint(700);
            if (n === 2) ctx.unlock();
          },
        });
        btn.textContent = ctx.L(T.notationBtn(n));
        btn.disabled = n >= 2;
        ctx.say(T.notationSay);
        ctx.panel.appendChild(btn);
        await paint(n ? 0 : 300);
        if (n === 2) {
          ctx.feedback(T.notationFb(2));
          ctx.unlock();
        }
      },
    },
    {
      id: "zero",
      label: T.scene.zero,
      gate: true,
      async enter(ctx, saved) {
        stage.scale(mainScale);
        const zeroStates = {
          a: { v: 0, label: u(0), bar: false },
          b: { v: 0, look: "u", label: null, bar: false },
        };
        ctx.say(T.zeroSay);
        ctx.expr(saved.solved ? hi("−(0) = 0") : hi("−(0) = ?"));
        await view(ctx, { states: zeroStates, zero: false }, 400);
        const O = T.zeroOpts;
        const options = placeCorrect(
          [
            { kind: "self", correct: true, label: O.self },
            { kind: "minus1", label: O.minus1 },
            { kind: "none", label: O.none },
          ],
          slotFor(a, 3),
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.zeroQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.zeroCue[opt.kind], "cue");
              return view(
                ctx,
                { states: zeroStates, zero: false, ghost: { v: opt.kind === "minus1" ? -1 : 0 } },
                250,
              );
            },
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.expr(hi("−(0) = 0"));
              ctx.feedback(T.zeroOk);
              ctx.unlock();
            },
          }),
        );
        if (saved.solved) ctx.feedback(T.zeroOk);
      },
    },
    {
      id: "transfer",
      label: T.scene.transfer,
      async enter(ctx, saved) {
        stage.scale(transferScale);
        const b = t.value;
        const startA = {
          ...dot(ctx, -b, t.name, "x", tu, t.uw),
        };
        const oppDot = () => dot(ctx, b, T.names.tOpp, "u", tu, t.uw);
        const note = t.zero;
        const base = { zeroNote: note || "" };
        const reveal = (ms) => {
          ctx.expr(`${hi(tu(-b))} → ${lo(tu(b))}`);
          return view(ctx, { ...base, states: { a: startA, b: oppDot() } }, ms);
        };
        ctx.say(T.transferSay);
        if (saved.solved) await reveal(0);
        else {
          ctx.expr(`${hi(tu(-b))} → ?`);
          await view(ctx, { ...base, states: { a: startA } }, 600);
        }
        const options = placeCorrect(
          transferChoices(b, t.max).map((o) => ({
            ...o,
            label: { en: tu(o.value), es: tu(o.value) },
          })),
          slotFor(b, 3),
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: T.transferQ,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              ctx.feedback(T.transferCue(opt.kind), "cue");
              const g = opt.kind === "end" ? { v: opt.value } : { v: -b };
              return view(ctx, { ...base, states: { a: startA }, ghost: g }, 300);
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.feedback(T.transferOk);
              await reveal(700);
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
    viewBox: `0 0 ${layoutOf("v").W} ${layoutOf("v").H}`,
    ariaLabel: T.ariaLabel,
    printSummary: T.printSummary,
    setup,
    scenes,
  };
}
