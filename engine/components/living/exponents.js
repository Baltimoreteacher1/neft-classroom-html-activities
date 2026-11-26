// living/exponents.js — repeated factors → power notation vs repeated addition.
// One persistent SVG stage; uses only var(--lsx-*) tokens; <600 lines.

import { escHtml, seededStep } from "../../core/living-scene.js";
import {
  addChain,
  exponentChoices,
  exponentSteps,
  exponentsCopy,
  factorChain,
  H,
  maxExpFor,
  placeCorrect,
  powerValue,
  validateExponents,
  W,
} from "./exponents-model.js";

export { validateExponents };

const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;
const supHtml = (b, e) => `${hi(String(b))}<sup>${lo(String(e))}</sup>`;

export function buildExponentsPlay(cfg) {
  const v = validateExponents(cfg);
  if (!v) return null;
  const { base, exponent, transfer } = v;
  const copy = exponentsCopy(v);
  const maxE = maxExpFor(base);
  const maxVal = powerValue(base, maxE);
  let cast = null;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs) => svgEl(tag, { opacity: 0, ...attrs }, g);
    const txt = (attrs) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 15,
        "font-weight": 700,
        fill: "var(--lsx-ink)",
        ...attrs,
      });

    const baseY = 278;
    const maxH = 210;
    const barW = Math.floor(460 / maxE) - 18;
    const bars = Array.from({ length: maxE }, (_, i) => {
      const x = 60 + i * (barW + 18);
      return {
        rect: el("rect", {
          x,
          y: baseY,
          width: barW,
          height: 0,
          rx: 6,
          fill: "var(--lsx-x)",
          stroke: "var(--lsx-x-edge)",
          "stroke-width": 2,
        }),
        val: txt({ x: x + barW / 2, y: baseY - 10, fill: "var(--lsx-hi)", "font-size": 16 }),
        lbl: txt({ x: x + barW / 2, y: baseY + 24, "font-size": 15 }),
        x,
      };
    });
    const axis = el("line", {
      x1: 40,
      y1: baseY,
      x2: W - 40,
      y2: baseY,
      stroke: "var(--lsx-ink)",
      "stroke-width": 2,
    });
    const addBar = el("rect", {
      x: 540,
      y: baseY,
      width: 96,
      height: 0,
      rx: 6,
      fill: "var(--lsx-u)",
      stroke: "var(--lsx-u-edge)",
      "stroke-width": 2,
      "stroke-dasharray": "6 4",
    });
    const addVal = txt({ x: 588, y: baseY - 10, fill: "var(--lsx-lo)", "font-size": 16 });
    const addLbl = txt({ x: 588, y: baseY + 24, fill: "var(--lsx-lo)", "font-size": 14 });
    const banner = txt({ x: W / 2, y: 34, "font-size": 17, "font-weight": 800 });

    cast = { bars, axis, addBar, addVal, addLbl, banner, baseY, maxH };
  }

  function barMoves(b, e, showAdd, scaleMax = maxVal) {
    const steps = exponentSteps(b, e);
    const m = [[cast.axis, { opacity: 1 }]];
    cast.bars.forEach((bar, i) => {
      const st = steps[i];
      if (!st) {
        m.push([bar.rect, { opacity: 0, height: 0, y: cast.baseY }]);
        m.push([bar.val, { opacity: 0 }]);
        m.push([bar.lbl, { opacity: 0 }]);
        return;
      }
      const h = Math.max(18, Math.round((st.value / scaleMax) * cast.maxH));
      const y = cast.baseY - h;
      m.push([bar.rect, { opacity: 1, y, height: h }]);
      m.push([bar.val, { opacity: 1, y: y - 8, text: String(st.value) }]);
      m.push([bar.lbl, { opacity: 1, text: `${b}^${st.step}` }]);
    });
    if (showAdd) {
      const prod = b * e;
      const ah = Math.max(18, Math.round((prod / scaleMax) * cast.maxH));
      const ay = cast.baseY - ah;
      m.push([cast.addBar, { opacity: 1, y: ay, height: ah }]);
      m.push([cast.addVal, { opacity: 1, y: ay - 8, text: String(prod) }]);
      m.push([cast.addLbl, { opacity: 1, text: `${b} × ${e}` }]);
    } else {
      m.push([cast.addBar, { opacity: 0, height: 0, y: cast.baseY }]);
      m.push([cast.addVal, { opacity: 0 }]);
      m.push([cast.addLbl, { opacity: 0 }]);
    }
    return m;
  }

  const scenes = [
    {
      id: "situate",
      label: { en: "Repeated factors", es: "Factores repetidos" },
      askChild: copy.askChild.situate,
      async enter(ctx) {
        await ctx.tween(
          [
            ...barMoves(base, exponent, false, powerValue(base, exponent)),
            [cast.banner, { opacity: 1, text: `${factorChain(base, exponent)} = ${copy.val}` }],
          ],
          500,
        );
        ctx.expr(`${supHtml(base, exponent)} = ${escHtml(copy.chain)} = ${hi(String(copy.val))}`);
        ctx.say(copy.situate);
      },
    },
    {
      id: "trap",
      label: { en: "Power vs multiply", es: "Potencia vs multiplicar" },
      askChild: copy.askChild.trap,
      gate: true,
      async enter(ctx, saved) {
        const scale = powerValue(base, exponent);
        await ctx.tween(
          [
            ...barMoves(base, saved.solved ? exponent : 1, true, scale),
            [
              cast.banner,
              {
                opacity: 1,
                text: `${base}^${exponent}  vs  ${base} × ${exponent} (${addChain(base, exponent)})`,
              },
            ],
          ],
          400,
        );
        ctx.expr(`${supHtml(base, exponent)} = ?`);
        ctx.say(copy.trap.say);
        const options = placeCorrect(exponentChoices(base, exponent), base + exponent).map((o) => ({
          ...o,
          label: String(o.value),
          cue: copy.trap.cues[o.kind],
        }));
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.trap.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(barMoves(base, exponent, true, scale), 600);
              ctx.expr(`${supHtml(base, exponent)} = ${hi(String(copy.val))}`);
              ctx.feedback(copy.trap.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "build",
      label: { en: "Grow the power", es: "Haz crecer la potencia" },
      askChild: copy.askChild.build,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        st.seen = Array.isArray(st.seen) ? st.seen : [];
        let cur = Number.isInteger(st.cur) && st.cur >= 1 && st.cur <= maxE ? st.cur : exponent;
        const paint = async (e, ms) => {
          cur = e;
          st.cur = e;
          if (!st.seen.includes(e)) st.seen.push(e);
          const val = powerValue(base, e);
          await ctx.tween(
            [
              ...barMoves(base, e, false, maxVal),
              [cast.banner, { opacity: 1, text: `${factorChain(base, e)} = ${val}` }],
            ],
            ms,
          );
          ctx.expr(`${supHtml(base, e)} = ${escHtml(factorChain(base, e))} = ${hi(String(val))}`);
          ctx.say({ en: copy.build.sayEn, es: copy.build.say.es });
          if (st.seen.length < 3) ctx.feedback(copy.build.progress(st.seen.length), "cue");
          else {
            ctx.feedback(copy.build.done);
            ctx.unlock();
          }
          ctx.save();
        };
        ctx.panel.appendChild(
          ctx.range({
            label: { en: "Exponent", es: "Exponente" },
            min: 1,
            max: maxE,
            value: cur,
            onInput: (e) => paint(e, 350),
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
          const idx = seededStep(
            `exp:${base}:${exponent}`,
            Number(st.variant) || 0,
            transfer.length,
          );
          const t = transfer[idx];
          const val = powerValue(t.base, t.exponent);
          const scale = Math.max(val, t.base * t.exponent);
          ctx.panel.innerHTML = "";
          ctx.feedback("");
          await ctx.tween(
            [
              ...barMoves(t.base, st.solved ? t.exponent : 1, true, scale),
              [cast.banner, { opacity: 1, text: `${t.base}^${t.exponent} = ?` }],
            ],
            350,
          );
          ctx.expr(`${supHtml(t.base, t.exponent)} = ?`);
          ctx.say({
            en: `Evaluate ${t.base}^${t.exponent}. Remember: the exponent counts how many factors of ${t.base} to multiply.`,
            es: `Evalúa ${t.base}^${t.exponent}. Recuerda: el exponente cuenta cuántos factores de ${t.base} se multiplican.`,
          });
          const options = placeCorrect(
            exponentChoices(t.base, t.exponent),
            t.base * 3 + t.exponent,
          ).map((o) => ({
            ...o,
            label: String(o.value),
            cue:
              o.kind === "times"
                ? {
                    en: `${t.base * t.exponent} is ${t.base} × ${t.exponent}, not ${t.exponent} factors of ${t.base}.`,
                    es: `${t.base * t.exponent} es ${t.base} × ${t.exponent}, no ${t.exponent} factores de ${t.base}.`,
                  }
                : {
                    en: `Write out ${t.exponent} factors of ${t.base} and multiply them step by step.`,
                    es: `Escribe ${t.exponent} factores de ${t.base} y multiplícalos paso a paso.`,
                  },
          }));
          ctx.panel.append(
            ctx.choices({
              question: { en: `${t.base}^${t.exponent} =`, es: `${t.base}^${t.exponent} =` },
              options,
              restore: st.solved ? options.findIndex((o) => o.correct) : null,
              onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
              onCorrect: async () => {
                st.solved = true;
                ctx.save();
                await ctx.tween(
                  [
                    ...barMoves(t.base, t.exponent, true, scale),
                    [
                      cast.banner,
                      { opacity: 1, text: `${factorChain(t.base, t.exponent)} = ${val}` },
                    ],
                  ],
                  500,
                );
                ctx.expr(`${supHtml(t.base, t.exponent)} = ${hi(String(val))}`);
                ctx.feedback({
                  en: `Yes: ${factorChain(t.base, t.exponent)} = ${val}.`,
                  es: `Sí: ${factorChain(t.base, t.exponent)} = ${val}.`,
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
