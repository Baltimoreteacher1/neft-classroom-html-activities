// living/order-of-operations.js — structure-first cascade that keeps the whole
// expression visible on one persistent SVG stage. Uses only var(--lsx-*) tokens.

import { escHtml, seededStep } from "../../core/living-scene.js";
import {
  evalOrderOps,
  H,
  orderOpsChoices,
  orderOpsCopy,
  placeCorrect,
  validateOrderOps,
  W,
} from "./order-of-operations-model.js";

export { validateOrderOps };

const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;

export function buildOrderOpsPlay(cfg) {
  const v = validateOrderOps(cfg);
  if (!v) return null;
  const copy = orderOpsCopy(v);
  let cast = null;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs) => svgEl(tag, { opacity: 0, ...attrs }, g);
    const txt = (attrs) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 20,
        "font-weight": 800,
        fill: "var(--lsx-ink)",
        ...attrs,
      });

    const rowY = [64, 128, 192, 256, 312];
    const rows = rowY.map((y) => ({
      box: el("rect", {
        x: 110,
        y: y - 28,
        width: 460,
        height: 40,
        rx: 8,
        fill: "var(--lsx-paper)",
        stroke: "var(--lsx-rule-strong)",
        "stroke-width": 1.5,
      }),
      text: txt({ x: W / 2, y }),
      note: txt({
        x: W - 46,
        y: y - 4,
        "text-anchor": "end",
        "font-size": 13,
        fill: "var(--lsx-hi)",
      }),
    }));
    const arrows = rowY.slice(0, -1).map((y) =>
      el("line", {
        x1: W / 2,
        y1: y + 14,
        x2: W / 2,
        y2: y + 34,
        stroke: "var(--lsx-hi)",
        "stroke-width": 2.5,
      }),
    );
    const badge = txt({ x: W / 2, y: 24, "font-size": 14, fill: "var(--lsx-lo)" });
    cast = { rows, arrows, badge };
  }

  function cascadeMoves(rowStrings, visibleCount, notes = [], highlightIdx = -1, badgeText = "") {
    const m = [[cast.badge, { opacity: badgeText ? 1 : 0, text: badgeText }]];
    cast.rows.forEach((row, i) => {
      const show = i < visibleCount && i < rowStrings.length;
      const isHi = i === highlightIdx;
      m.push([
        row.box,
        {
          opacity: show ? 1 : 0,
          stroke: isHi ? "var(--lsx-hi)" : "var(--lsx-rule-strong)",
          "stroke-width": isHi ? 3 : 1.5,
        },
      ]);
      m.push([row.text, { opacity: show ? 1 : 0, text: rowStrings[i] || "" }]);
      m.push([row.note, { opacity: show && notes[i] ? 1 : 0, text: notes[i] || "" }]);
    });
    cast.arrows.forEach((ar, i) => {
      m.push([ar, { opacity: i + 1 < visibleCount && i + 1 < rowStrings.length ? 1 : 0 }]);
    });
    return m;
  }

  const stepNotes = (lang) =>
    lang === "es"
      ? ["expresión", "potencia", "multiplicar", "sumar", "el total"]
      : ["expression", "power", "multiply", "add", "total"];

  const scenes = [
    {
      id: "situate",
      label: { en: "Whole expression", es: "Expresión completa" },
      askChild: copy.askChild.situate,
      async enter(ctx) {
        const notes = stepNotes(ctx.lang);
        await ctx.tween(cascadeMoves(copy.r.rows, 1, notes, 0), 400);
        ctx.expr(escHtml(copy.expr));
        ctx.say(copy.situate);
      },
    },
    {
      id: "trap",
      label: { en: "What goes first?", es: "¿Qué va primero?" },
      askChild: copy.askChild.trap,
      gate: true,
      async enter(ctx, saved) {
        const notes = stepNotes(ctx.lang);
        await ctx.tween(
          cascadeMoves(copy.r.rows, saved.solved ? 2 : 1, notes, saved.solved ? 1 : 0),
          350,
        );
        ctx.expr(escHtml(copy.expr));
        ctx.say(copy.trap.say);
        const options = placeCorrect(
          [
            {
              label: `${v.base}^${v.exp} = ${copy.r.pow}`,
              correct: true,
            },
            {
              label: `${v.a} + ${v.b} = ${v.a + v.b}`,
              correct: false,
              cue: {
                en: `Adding ${v.a} + ${v.b} first breaks the multiplication ${v.b} × ${v.base}^${v.exp}. What binds tighter than +?`,
                es: `Sumar ${v.a} + ${v.b} primero rompe la multiplicación ${v.b} × ${v.base}^${v.exp}. ¿Qué se evalúa antes que +?`,
              },
            },
            {
              label: `${v.b} × ${v.base} = ${v.b * v.base}`,
              correct: false,
              cue: {
                en: `The exponent ${v.exp} belongs only to ${v.base}, not to ${v.b} × ${v.base}. Evaluate the power first.`,
                es: `El exponente ${v.exp} pertenece solo a ${v.base}, no a ${v.b} × ${v.base}. Evalúa primero la potencia.`,
              },
            },
          ],
          v.a + v.b,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.trap.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(cascadeMoves(copy.r.rows, 2, notes, 1), 500);
              ctx.expr(`${escHtml(copy.expr)} = ${hi(copy.r.rows[1])}`);
              ctx.feedback(copy.trap.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "structure",
      label: { en: "Collapse step by step", es: "Reduce paso a paso" },
      askChild: copy.askChild.structure,
      gate: true,
      async enter(ctx) {
        const notes = stepNotes(ctx.lang);
        const st = ctx.state;
        const maxSteps = copy.r.rows.length;
        let shown = Number.isInteger(st.shown) && st.shown >= 2 ? Math.min(st.shown, maxSteps) : 2;
        const paint = async (n, ms) => {
          shown = n;
          st.shown = n;
          await ctx.tween(cascadeMoves(copy.r.rows, n, notes, n - 1), ms);
          ctx.expr(`${escHtml(copy.expr)} = ${hi(copy.r.rows[n - 1])}`);
          ctx.say(copy.structure.say);
          if (n >= maxSteps) {
            ctx.feedback(copy.structure.done);
            ctx.unlock();
          } else {
            ctx.feedback(
              {
                en: `Step ${n} of ${maxSteps}: reveal the next row to watch the untouched terms drop down.`,
                es: `Paso ${n} de ${maxSteps}: muestra la siguiente fila para ver cómo bajan los demás términos.`,
              },
              "cue",
            );
          }
          ctx.save();
        };
        const btn = ctx.button({
          label: { en: "Next operation", es: "Siguiente operación" },
          primary: true,
          onClick: () => {
            if (shown < maxSteps) paint(shown + 1, 450);
          },
        });
        ctx.panel.appendChild(btn);
        await paint(shown, 400);
      },
    },
    {
      id: "transfer",
      label: { en: "On your own", es: "Por tu cuenta" },
      askChild: copy.askChild.transfer,
      async enter(ctx) {
        const notes = stepNotes(ctx.lang);
        const renderVariant = async () => {
          const st = ctx.state;
          const idx = seededStep(
            `ooo:${v.a}:${v.b}:${v.base}`,
            Number(st.variant) || 0,
            v.transfer.length,
          );
          const t = v.transfer[idx];
          const tr = evalOrderOps(t);
          ctx.panel.innerHTML = "";
          ctx.feedback("");
          await ctx.tween(cascadeMoves(tr.rows, st.solved ? tr.rows.length : 1, notes, 0), 350);
          ctx.expr(`${escHtml(tr.rows[0])} = ?`);
          ctx.say({
            en: `Evaluate ${tr.rows[0]} using powers first, then multiplication, then add/subtract.`,
            es: `Evalúa ${tr.rows[0]} haciendo primero las potencias, luego la multiplicación y al final sumas o restas.`,
          });
          const options = placeCorrect(orderOpsChoices(t), t.a + t.b + t.base).map((o) => ({
            ...o,
            label: String(o.value),
            cue:
              o.kind === "ltr"
                ? {
                    en: `That added ${t.a} + ${t.b} before multiplying. Evaluate ${t.base}^${t.exp} and multiply first.`,
                    es: `Eso sumó ${t.a} + ${t.b} antes de multiplicar. Evalúa ${t.base}^${t.exp} y multiplica primero.`,
                  }
                : {
                    en: `Check each row in order: power (${t.base}^${t.exp}), then multiply by ${t.b}, then add/subtract.`,
                    es: `Revisa cada fila en orden: potencia (${t.base}^${t.exp}), luego multiplica por ${t.b}, luego suma o resta.`,
                  },
          }));
          ctx.panel.append(
            ctx.choices({
              question: { en: `${tr.rows[0]} =`, es: `${tr.rows[0]} =` },
              options,
              restore: st.solved ? options.findIndex((o) => o.correct) : null,
              onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
              onCorrect: async () => {
                st.solved = true;
                ctx.save();
                await ctx.tween(
                  cascadeMoves(tr.rows, tr.rows.length, notes, tr.rows.length - 1),
                  550,
                );
                ctx.expr(`${escHtml(tr.rows[0])} = ${hi(String(tr.total))}`);
                ctx.feedback({
                  en: `Yes: ${tr.rows.join(" → ")}.`,
                  es: `Sí: ${tr.rows.join(" → ")}.`,
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
