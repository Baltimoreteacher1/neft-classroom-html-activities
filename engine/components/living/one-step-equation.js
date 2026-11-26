// living/one-step-equation.js — balance scale → symbols, fading the model.
// One persistent SVG stage; uses only var(--lsx-*) tokens; <600 lines.

import { escHtml, seededStep } from "../../core/living-scene.js";
import {
  eqChoices,
  H,
  oneStepEqCopy,
  placeCorrect,
  solveEq,
  validateOneStepEq,
  W,
} from "./one-step-equation-model.js";

export { validateOneStepEq };

const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;

export function buildOneStepEqPlay(cfg) {
  const v = validateOneStepEq(cfg);
  if (!v) return null;
  const copy = oneStepEqCopy(v);
  let cast = null;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs, parent = g) => svgEl(tag, { opacity: 0, ...attrs }, parent);
    const txt = (attrs, parent = g) =>
      el(
        "text",
        {
          "text-anchor": "middle",
          "font-size": 18,
          "font-weight": 800,
          fill: "var(--lsx-ink)",
          ...attrs,
        },
        parent,
      );

    const scaleG = el("g", { opacity: 1 });
    const pivot = el(
      "polygon",
      {
        points: "340,210 310,275 370,275",
        fill: "var(--lsx-x)",
        stroke: "var(--lsx-x-edge)",
        "stroke-width": 2,
        opacity: 1,
      },
      scaleG,
    );
    const beam = el(
      "line",
      {
        x1: 110,
        y1: 210,
        x2: 570,
        y2: 210,
        stroke: "var(--lsx-ink)",
        "stroke-width": 5,
        opacity: 1,
      },
      scaleG,
    );
    const leftBox = el(
      "rect",
      {
        x: 130,
        y: 148,
        width: 92,
        height: 54,
        rx: 8,
        fill: "var(--lsx-x)",
        stroke: "var(--lsx-x-edge)",
        "stroke-width": 2,
        opacity: 1,
      },
      scaleG,
    );
    const leftLbl = txt({ x: 176, y: 182, fill: "var(--lsx-on-x)", opacity: 1 }, scaleG);
    const leftKBox = el(
      "rect",
      {
        x: 230,
        y: 158,
        width: 76,
        height: 44,
        rx: 8,
        fill: "var(--lsx-u)",
        stroke: "var(--lsx-u-edge)",
        "stroke-width": 2,
        opacity: 1,
      },
      scaleG,
    );
    const leftKLbl = txt({ x: 268, y: 186, fill: "var(--lsx-ink)", opacity: 1 }, scaleG);
    const rightBox = el(
      "rect",
      {
        x: 420,
        y: 148,
        width: 120,
        height: 54,
        rx: 8,
        fill: "var(--lsx-u)",
        stroke: "var(--lsx-u-edge)",
        "stroke-width": 2,
        opacity: 1,
      },
      scaleG,
    );
    const rightLbl = txt({ x: 480, y: 182, fill: "var(--lsx-ink)", opacity: 1 }, scaleG);
    const eqSign = txt({ x: 340, y: 182, "font-size": 24, opacity: 1, text: "=" }, scaleG);

    const symLines = [0, 1, 2].map((i) =>
      txt({ x: 340, y: 80 + i * 52, "font-size": 24, "font-weight": 800 }),
    );
    const status = txt({ x: 340, y: 312, "font-size": 16, fill: "var(--lsx-hi)" });

    cast = {
      scaleG,
      pivot,
      beam,
      leftBox,
      leftLbl,
      leftKBox,
      leftKLbl,
      rightBox,
      rightLbl,
      eqSign,
      symLines,
      status,
    };
  }

  function scaleState(eq, { tilt = false, solved = false, fade = false, showSym = false } = {}) {
    const s = solveEq(eq);
    const ly = tilt ? 186 : 210;
    const ry = tilt ? 234 : 210;
    const m = [
      [cast.scaleG, { opacity: fade ? 0.14 : 1 }],
      [cast.beam, { y1: ly, y2: ry }],
      [cast.leftBox, { y: ly - 62 }],
      [cast.leftLbl, { y: ly - 28, text: eq.varName }],
      [cast.leftKBox, { y: ly - 52, opacity: solved ? 0 : 1 }],
      [cast.leftKLbl, { y: ly - 24, opacity: solved ? 0 : 1, text: `${s.eqOp} ${eq.k}` }],
      [cast.rightBox, { y: ry - 62 }],
      [cast.rightLbl, { y: ry - 28, text: String(solved ? s.solution : eq.rhs) }],
      [cast.eqSign, { text: tilt ? "≠" : "=", fill: tilt ? "var(--lsx-miss)" : "var(--lsx-ink)" }],
      [
        cast.status,
        {
          opacity: tilt ? 1 : 0,
          text: tilt ? `${s.invOp} ${eq.k} on one side tilts the scale!` : "",
        },
      ],
    ];
    const lines = [
      `${eq.varName} ${s.eqOp} ${eq.k} = ${eq.rhs}`,
      `${s.invOp} ${eq.k}        ${s.invOp} ${eq.k}`,
      `${eq.varName} = ${s.solution}`,
    ];
    cast.symLines.forEach((node, i) => {
      m.push([
        node,
        {
          opacity: showSym ? 1 : 0,
          text: lines[i],
          fill: i === 1 ? "var(--lsx-lo)" : i === 2 ? "var(--lsx-hi)" : "var(--lsx-ink)",
        },
      ]);
    });
    return m;
  }

  const scenes = [
    {
      id: "situate",
      label: { en: "Balanced", es: "En equilibrio" },
      askChild: copy.askChild.situate,
      async enter(ctx) {
        await ctx.tween(scaleState(v, { tilt: false, solved: false }), 400);
        ctx.expr(`${hi(v.varName)} ${copy.s.eqOp} ${lo(String(v.k))} = ${v.rhs}`);
        ctx.say(copy.situate);
      },
    },
    {
      id: "tilt",
      label: { en: "One side tilts", es: "Un solo lado se inclina" },
      askChild: copy.askChild.tilt,
      gate: true,
      async enter(ctx, saved) {
        await ctx.tween(scaleState(v, { tilt: !saved.solved, solved: saved.solved }), 450);
        ctx.expr(
          saved.solved ? `${hi(v.varName)} = ${hi(String(copy.s.solution))}` : escHtml(copy.eq),
        );
        ctx.say(copy.tilt.say);
        const options = placeCorrect(
          [
            {
              label: {
                en: `Do ${copy.s.invOp} ${v.k} on BOTH sides`,
                es: `Hacer ${copy.s.invOp} ${v.k} en LOS DOS lados`,
              },
              correct: true,
            },
            {
              label: {
                en: `Do ${copy.s.invOp} ${v.k} on the left side only`,
                es: `Hacer ${copy.s.invOp} ${v.k} solo en el lado izquierdo`,
              },
              correct: false,
              cue: {
                en: "Look at the tilted beam: changing only one side breaks equality.",
                es: "Mira la barra inclinada: cambiar solo un lado rompe la igualdad.",
              },
            },
            {
              label: {
                en: `Do ${copy.s.eqOp} ${v.k} on both sides`,
                es: `Hacer ${copy.s.eqOp} ${v.k} en los dos lados`,
              },
              correct: false,
              cue: {
                en: `That keeps it level, but it does not undo ${copy.s.eqOp} ${v.k}. Which operation is the inverse?`,
                es: `Eso mantiene el nivel, pero no deshace ${copy.s.eqOp} ${v.k}. ¿Cuál es la operación inversa?`,
              },
            },
          ],
          v.k + v.rhs,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.tilt.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: async (_i, opt) => {
              await ctx.tween(scaleState(v, { tilt: true, solved: false }), 300);
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(scaleState(v, { tilt: false, solved: true }), 550);
              ctx.expr(`${hi(v.varName)} = ${hi(String(copy.s.solution))}`);
              ctx.feedback(copy.tilt.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "solve",
      label: { en: "Solve & check", es: "Resuelve y comprueba" },
      askChild: copy.askChild.solve,
      gate: true,
      async enter(ctx, saved) {
        await ctx.tween(scaleState(v, { solved: Boolean(saved.done) }), 350);
        ctx.expr(
          saved.done
            ? `${hi(v.varName)} = ${hi(String(copy.s.solution))} · ${escHtml(copy.check)}`
            : escHtml(copy.eq),
        );
        ctx.say(copy.solve.say);
        const btn = ctx.button({
          label: {
            en: `Apply ${copy.s.invOp} ${v.k} to both sides`,
            es: `Aplicar ${copy.s.invOp} ${v.k} a ambos lados`,
          },
          primary: true,
          onClick: async () => {
            ctx.state.done = true;
            ctx.save();
            await ctx.tween(scaleState(v, { solved: true }), 550);
            ctx.expr(`${hi(v.varName)} = ${hi(String(copy.s.solution))} · ${escHtml(copy.check)}`);
            ctx.feedback(copy.solve.done);
            ctx.unlock();
          },
        });
        ctx.panel.appendChild(btn);
        if (saved.done) {
          ctx.feedback(copy.solve.done);
          ctx.unlock();
        }
      },
    },
    {
      id: "symbols",
      label: { en: "Fade to symbols", es: "Pasa a símbolos" },
      askChild: copy.askChild.symbols,
      async enter(ctx) {
        await ctx.tween(scaleState(v, { solved: true, fade: true, showSym: true }), 650);
        ctx.expr(`${escHtml(copy.eq)}  →  ${hi(`${v.varName} = ${copy.s.solution}`)}`);
        ctx.say(copy.symbols.say);
      },
    },
    {
      id: "transfer",
      label: { en: "On your own", es: "Por tu cuenta" },
      askChild: copy.askChild.transfer,
      async enter(ctx) {
        const renderVariant = async () => {
          const st = ctx.state;
          const idx = seededStep(`eq:${v.k}:${v.rhs}`, Number(st.variant) || 0, v.transfer.length);
          const t = v.transfer[idx];
          const ts = solveEq(t);
          const teq = `${t.varName} ${ts.eqOp} ${t.k} = ${t.rhs}`;
          ctx.panel.innerHTML = "";
          ctx.feedback("");
          await ctx.tween(
            scaleState(t, { solved: Boolean(st.solved), fade: true, showSym: Boolean(st.solved) }),
            350,
          );
          ctx.expr(`${escHtml(teq)} → ${hi(t.varName)} = ?`);
          ctx.say({
            en: `Solve ${teq} by applying the inverse operation to both sides.`,
            es: `Resuelve ${teq} aplicando la operación inversa en ambos lados.`,
          });
          const options = placeCorrect(eqChoices(t), t.k * 2 + t.rhs).map((o) => ({
            ...o,
            label: `${t.varName} = ${o.value}`,
            cue:
              o.kind === "wrongOp"
                ? {
                    en: `Check by substituting ${o.value} into ${teq}. Did you use the inverse of ${ts.eqOp} ${t.k}?`,
                    es: `Comprueba poniendo ${o.value} en ${teq}. ¿Usaste la operación inversa de ${ts.eqOp} ${t.k}?`,
                  }
                : {
                    en: `Substitute ${o.value} for ${t.varName} in ${teq}. Does it equal ${t.rhs}?`,
                    es: `Sustituye ${t.varName} por ${o.value} en ${teq}. ¿Da ${t.rhs}?`,
                  },
          }));
          ctx.panel.append(
            ctx.choices({
              question: { en: `What is ${t.varName}?`, es: `¿Cuánto vale ${t.varName}?` },
              options,
              restore: st.solved ? options.findIndex((o) => o.correct) : null,
              onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
              onCorrect: async () => {
                st.solved = true;
                ctx.save();
                await ctx.tween(scaleState(t, { solved: true, fade: true, showSym: true }), 450);
                ctx.expr(`${escHtml(teq)} → ${hi(`${t.varName} = ${ts.solution}`)}`);
                ctx.feedback({
                  en: `Yes: ${ts.invOp} ${t.k} on both sides gives ${t.varName} = ${ts.solution} (${ts.solution} ${ts.eqOp} ${t.k} = ${t.rhs}).`,
                  es: `Sí: ${ts.invOp} ${t.k} en ambos lados da ${t.varName} = ${ts.solution} (${ts.solution} ${ts.eqOp} ${t.k} = ${t.rhs}).`,
                });
              },
            }),
            ctx.newNumbersButton({ onNext: () => renderVariant() }),
            ctx.frame({ label: copy.transferExplain, frame: copy.transferFrame }),
          );
        };
        await renderVariant();
      },
    },
  ];

  return {
    kicker: { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" },
    title: copy.title,
    viewBox: `0 0 ${W} ${H}`,
    ariaLabel: copy.ariaLabel,
    printSummary: copy.printSummary,
    askChild: copy.askChild,
    setup,
    scenes,
  };
}
