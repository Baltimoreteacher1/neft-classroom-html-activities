// living/integers-opposites.js — Unit 7 integers, zero as reference, and
// mirror opposites on one persistent number line. Uses only var(--lsx-*) tokens.

import { escHtml, seededStep } from "../../core/living-scene.js";
import {
  fmtSigned,
  H,
  integersCopy,
  oppositeChoices,
  oppositeOf,
  placeCorrect,
  validateIntegers,
  W,
} from "./integers-opposites-model.js";

export { validateIntegers };

const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;

export function buildIntegersPlay(cfg) {
  const v = validateIntegers(cfg);
  if (!v) return null;
  const copy = integersCopy(v);
  let cast = null;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs) => svgEl(tag, { opacity: 0, ...attrs }, g);
    const txt = (attrs) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 16,
        "font-weight": 800,
        fill: "var(--lsx-ink)",
        ...attrs,
      });

    const cy = 178;
    const midX = W / 2;
    const line = el("line", {
      x1: 50,
      y1: cy,
      x2: W - 50,
      y2: cy,
      stroke: "var(--lsx-ink)",
      "stroke-width": 3,
      opacity: 1,
    });
    const zeroTick = el("line", {
      x1: midX,
      y1: cy - 36,
      x2: midX,
      y2: cy + 36,
      stroke: "var(--lsx-ink)",
      "stroke-width": 2.5,
      "stroke-dasharray": "5 4",
      opacity: 1,
    });
    const zeroNum = txt({ x: midX, y: cy + 56, opacity: 1, text: "0" });
    const zeroSub = txt({
      x: midX,
      y: cy - 48,
      "font-size": 14,
      fill: "var(--lsx-muted)",
      opacity: 1,
    });
    const arcLeft = el("line", {
      x1: midX,
      y1: cy - 18,
      x2: midX,
      y2: cy - 18,
      stroke: "var(--lsx-lo)",
      "stroke-width": 3,
    });
    const arcRight = el("line", {
      x1: midX,
      y1: cy - 18,
      x2: midX,
      y2: cy - 18,
      stroke: "var(--lsx-hi)",
      "stroke-width": 3,
    });
    const distLeft = txt({ x: midX, y: cy - 26, "font-size": 14, fill: "var(--lsx-lo)" });
    const distRight = txt({ x: midX, y: cy - 26, "font-size": 14, fill: "var(--lsx-hi)" });
    const dotA = el("circle", {
      cx: midX,
      cy,
      r: 11,
      fill: "var(--lsx-u)",
      stroke: "var(--lsx-u-edge)",
      "stroke-width": 2.5,
    });
    const lblA = txt({ x: midX, y: cy + 34, fill: "var(--lsx-lo)" });
    const dotB = el("circle", {
      cx: midX,
      cy,
      r: 11,
      fill: "var(--lsx-x)",
      stroke: "var(--lsx-x-edge)",
      "stroke-width": 2.5,
    });
    const lblB = txt({ x: midX, y: cy + 34, fill: "var(--lsx-hi)" });
    const banner = txt({ x: midX, y: 42, "font-size": 18 });

    cast = {
      cy,
      midX,
      line,
      zeroTick,
      zeroNum,
      zeroSub,
      arcLeft,
      arcRight,
      distLeft,
      distRight,
      dotA,
      lblA,
      dotB,
      lblB,
      banner,
    };
  }

  function posX(val, scaleMax) {
    return cast.midX + (val / Math.max(1, scaleMax)) * 250;
  }

  function lineMoves(val, scaleMax, showOpp, zeroText, bannerText = "") {
    const xA = posX(val, scaleMax);
    const opp = oppositeOf(val);
    const xB = posX(opp, scaleMax);
    const dist = Math.abs(val);
    const m = [
      [cast.zeroSub, { opacity: 1, text: zeroText }],
      [cast.banner, { opacity: bannerText ? 1 : 0, text: bannerText }],
      [cast.dotA, { cx: xA, opacity: 1 }],
      [cast.lblA, { x: xA, opacity: 1, text: fmtSigned(val) }],
      [cast.arcLeft, { x1: cast.midX, x2: xA, opacity: 1 }],
      [cast.distLeft, { x: (cast.midX + xA) / 2, opacity: 1, text: String(dist) }],
      [cast.dotB, { cx: xB, opacity: showOpp ? 1 : 0 }],
      [cast.lblB, { x: xB, opacity: showOpp ? 1 : 0, text: fmtSigned(opp) }],
      [cast.arcRight, { x1: cast.midX, x2: xB, opacity: showOpp ? 1 : 0 }],
      [cast.distRight, { x: (cast.midX + xB) / 2, opacity: showOpp ? 1 : 0, text: String(dist) }],
    ];
    return m;
  }

  const scenes = [
    {
      id: "situate",
      label: { en: "Below & above 0", es: "Bajo y sobre 0" },
      askChild: copy.askChild.situate,
      async enter(ctx) {
        const mag = Math.abs(v.value);
        await ctx.tween(
          lineMoves(
            v.value,
            mag,
            false,
            `0 = ${ctx.L(v.zeroLabel)}`,
            `${ctx.L(v.place)}: ${fmtSigned(v.value)} ${ctx.L(v.unit)}`,
          ),
          500,
        );
        ctx.expr(
          `${lo(fmtSigned(v.value))} &nbsp;(${copy.dist} ${escHtml(ctx.L(v.unit))} ${v.value < 0 ? "< 0" : "> 0"})`,
        );
        ctx.say(copy.situate);
      },
    },
    {
      id: "zero",
      label: { en: "Name 0 first", es: "Nombra el 0 primero" },
      askChild: copy.askChild.zero,
      gate: true,
      async enter(ctx, saved) {
        const mag = Math.abs(v.value);
        await ctx.tween(
          lineMoves(saved.solved ? v.value : 0, mag, false, `0 = ${ctx.L(v.zeroLabel)}`),
          350,
        );
        ctx.expr(`0 = ${escHtml(ctx.L(v.zeroLabel))}`);
        ctx.say(copy.zero.say);
        const options = placeCorrect(
          [
            { label: fmtSigned(v.value), correct: true },
            {
              label: fmtSigned(copy.opp),
              correct: false,
              cue: {
                en: `Check the direction from 0 (${ctx.L(v.zeroLabel)}). That sign puts it on the other side of 0.`,
                es: `Revisa la dirección desde 0 (${ctx.L(v.zeroLabel)}). Ese signo lo pone al otro lado del 0.`,
              },
            },
            {
              label: "0",
              correct: false,
              cue: {
                en: `0 is ${ctx.L(v.zeroLabel)} itself, not ${copy.dist} ${ctx.L(v.unit)} away from it.`,
                es: `0 es ${ctx.L(v.zeroLabel)} mismo, no a ${copy.dist} ${ctx.L(v.unit)} de distancia.`,
              },
            },
          ],
          mag,
        );
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.zero.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(lineMoves(v.value, mag, false, `0 = ${ctx.L(v.zeroLabel)}`), 500);
              ctx.expr(`${lo(fmtSigned(v.value))}`);
              ctx.feedback(copy.zero.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "mirror",
      label: { en: "Mirror across 0", es: "Espejo respecto a 0" },
      askChild: copy.askChild.mirror,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        st.seen = Array.isArray(st.seen) ? st.seen : [];
        let cur =
          Number.isInteger(st.cur) && st.cur >= -10 && st.cur <= 10 && st.cur !== 0 ? st.cur : -6;
        const paint = async (n, ms) => {
          cur = n === 0 ? 1 : n;
          st.cur = cur;
          if (!st.seen.includes(cur)) st.seen.push(cur);
          const opp = oppositeOf(cur);
          await ctx.tween(
            lineMoves(cur, 10, true, "0", `${fmtSigned(cur)} + ${fmtSigned(opp)} = 0`),
            ms,
          );
          ctx.expr(
            `${lo(fmtSigned(cur))} &nbsp;↔&nbsp; ${hi(fmtSigned(opp))} &nbsp;(${Math.abs(cur)} ${escHtml(ctx.L({ en: "from 0", es: "del 0" }))})`,
          );
          ctx.say(copy.mirror.say);
          if (st.seen.length < 3) {
            ctx.feedback(
              {
                en: `Move the slider to test at least 3 integers (${st.seen.length}/3 tried).`,
                es: `Mueve el control para probar al menos 3 enteros (${st.seen.length}/3 probados).`,
              },
              "cue",
            );
          } else {
            ctx.feedback(copy.mirror.done);
            ctx.unlock();
          }
          ctx.save();
        };
        ctx.panel.appendChild(
          ctx.range({
            label: { en: "Integer", es: "Entero" },
            min: -10,
            max: 10,
            value: cur,
            onInput: (n) => paint(n, 250),
          }),
        );
        await paint(cur, 400);
      },
    },
    {
      id: "transfer",
      label: { en: "On your own", es: "Por tu cuenta" },
      askChild: copy.askChild.transfer,
      async enter(ctx) {
        const renderVariant = async () => {
          const st = ctx.state;
          const idx = seededStep(`int:${v.value}`, Number(st.variant) || 0, v.transfer.length);
          const t = v.transfer[idx];
          const mag = Math.abs(t.value);
          const opp = oppositeOf(t.value);
          ctx.panel.innerHTML = "";
          ctx.feedback("");
          await ctx.tween(
            lineMoves(t.value, mag, Boolean(st.solved), `0 = ${ctx.L(t.zeroLabel)}`),
            350,
          );
          ctx.expr(
            `${escHtml(ctx.L({ en: "Opposite of", es: "Opuesto de" }))} ${lo(fmtSigned(t.value))} = ?`,
          );
          ctx.say({
            en: `Find the opposite of ${fmtSigned(t.value)} on the number line where 0 is ${t.zeroLabel.en}.`,
            es: `Encuentra el opuesto de ${fmtSigned(t.value)} en la recta numérica donde 0 es ${t.zeroLabel.es}.`,
          });
          const options = placeCorrect(oppositeChoices(t.value), mag + 3).map((o) => ({
            ...o,
            cue:
              o.kind === "same"
                ? {
                    en: "That is the same number. Its opposite is on the OTHER side of 0.",
                    es: "Ese es el mismo número. Su opuesto está al OTRO lado del 0.",
                  }
                : {
                    en: `Keep the exact distance (${mag}) from 0, and flip to the other side of 0.`,
                    es: `Mantén la misma distancia (${mag}) desde el 0 y cambia al otro lado del 0.`,
                  },
          }));
          ctx.panel.append(
            ctx.choices({
              question: {
                en: `Opposite of ${fmtSigned(t.value)}:`,
                es: `Opuesto de ${fmtSigned(t.value)}:`,
              },
              options,
              restore: st.solved ? options.findIndex((o) => o.correct) : null,
              onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
              onCorrect: async () => {
                st.solved = true;
                ctx.save();
                await ctx.tween(
                  lineMoves(
                    t.value,
                    mag,
                    true,
                    `0 = ${ctx.L(t.zeroLabel)}`,
                    `${fmtSigned(t.value)} + ${fmtSigned(opp)} = 0`,
                  ),
                  450,
                );
                ctx.expr(`${lo(fmtSigned(t.value))} ↔ ${hi(fmtSigned(opp))}`);
                ctx.feedback({
                  en: `Yes: ${fmtSigned(opp)} is ${mag} units on the opposite side of 0.`,
                  es: `Sí: ${fmtSigned(opp)} está a ${mag} unidades al otro lado del 0.`,
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
