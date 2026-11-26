// living/parallelogram-area.js — cut right triangle & slide to form a rectangle.
// One persistent SVG stage; uses only var(--lsx-*) tokens; <600 lines.

import { escHtml, seededStep } from "../../core/living-scene.js";
import {
  H,
  paraArea,
  paraChoices,
  paraCopy,
  placeCorrect,
  validateParallelogram,
  W,
} from "./parallelogram-area-model.js";

export { validateParallelogram };

const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;

export function buildParallelogramPlay(cfg) {
  const v = validateParallelogram(cfg);
  if (!v) return null;
  const copy = paraCopy(v);
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
          "font-size": 16,
          "font-weight": 800,
          fill: "var(--lsx-ink)",
          ...attrs,
        },
        parent,
      );

    // Base width = 320, height = 160, horizontal shear = 76
    const x0 = 140;
    const y0 = 250;
    const bw = 320;
    const bh = 160;
    const dx = 76;

    // Stationary body (trapezoid: (x0+dx, y0) → (x0+bw, y0) → (x0+bw+dx, y0-bh) → (x0+dx, y0-bh))
    const body = el("polygon", {
      points: `${x0 + dx},${y0} ${x0 + bw},${y0} ${x0 + bw + dx},${y0 - bh} ${x0 + dx},${y0 - bh}`,
      fill: "var(--lsx-x)",
      "fill-opacity": 0.25,
      stroke: "var(--lsx-x-edge)",
      "stroke-width": 2.5,
      opacity: 1,
    });
    // Sliding right triangle group: (x0, y0) → (x0+dx, y0) → (x0+dx, y0-bh)
    const triG = el("g", { opacity: 1 });
    const tri = el(
      "polygon",
      {
        points: `${x0},${y0} ${x0 + dx},${y0} ${x0 + dx},${y0 - bh}`,
        fill: "var(--lsx-u)",
        "fill-opacity": 0.45,
        stroke: "var(--lsx-u-edge)",
        "stroke-width": 2.5,
        opacity: 1,
      },
      triG,
    );
    const cutLine = el("line", {
      x1: x0 + dx,
      y1: y0,
      x2: x0 + dx,
      y2: y0 - bh,
      stroke: "var(--lsx-hi)",
      "stroke-width": 3,
      "stroke-dasharray": "6 4",
      opacity: 1,
    });
    const rightAngle = el("rect", {
      x: x0 + dx,
      y: y0 - 16,
      width: 16,
      height: 16,
      fill: "none",
      stroke: "var(--lsx-hi)",
      "stroke-width": 2,
      opacity: 1,
    });
    const baseLbl = txt({ x: x0 + bw / 2 + dx / 2, y: y0 + 30, opacity: 1 });
    const heightLbl = txt({
      x: x0 + dx + 38,
      y: y0 - bh / 2 + 6,
      fill: "var(--lsx-hi)",
      opacity: 1,
    });
    const slantLbl = txt({
      x: x0 + dx / 2 - 26,
      y: y0 - bh / 2,
      fill: "var(--lsx-lo)",
      opacity: 1,
    });
    const areaLbl = txt({
      x: x0 + dx + bw / 2 - 20,
      y: y0 - bh / 2 + 6,
      "font-size": 20,
      fill: "var(--lsx-ink)",
    });
    const rectOutline = el("rect", {
      x: x0 + dx,
      y: y0 - bh,
      width: bw,
      height: bh,
      fill: "none",
      stroke: "var(--lsx-ok-edge)",
      "stroke-width": 3,
      "stroke-dasharray": "8 4",
    });

    cast = {
      body,
      triG,
      tri,
      cutLine,
      rightAngle,
      baseLbl,
      heightLbl,
      slantLbl,
      areaLbl,
      rectOutline,
      bw,
    };
  }

  function slideTri(frac, p, showArea = false) {
    const shift = Math.round(frac * cast.bw);
    cast.triG.setAttribute("transform", `translate(${shift} 0)`);
    return [
      [cast.baseLbl, { opacity: 1, text: `b = ${p.base} ${p.unit.en}` }],
      [cast.heightLbl, { opacity: 1, text: `h = ${p.height}` }],
      [cast.slantLbl, { opacity: frac > 0.5 ? 0.25 : 1, text: `${p.slant}` }],
      [cast.rectOutline, { opacity: frac >= 0.98 ? 1 : 0 }],
      [
        cast.areaLbl,
        {
          opacity: showArea || frac >= 0.98 ? 1 : 0,
          text: `A = ${p.base} × ${p.height} = ${paraArea(p)}`,
        },
      ],
    ];
  }

  const scenes = [
    {
      id: "situate",
      label: { en: "Base & height", es: "Base y altura" },
      askChild: copy.askChild.situate,
      async enter(ctx) {
        await ctx.tween(slideTri(0, v, false), 400);
        ctx.expr(
          `b = ${hi(String(v.base))} · h = ${hi(String(v.height))} · ${escHtml(ctx.L({ en: "slant", es: "lado inclinado" }))} = ${lo(String(v.slant))}`,
        );
        ctx.say(copy.situate);
      },
    },
    {
      id: "slant",
      label: { en: "Height vs slant", es: "Altura vs inclinado" },
      askChild: copy.askChild.slant,
      gate: true,
      async enter(ctx, saved) {
        await ctx.tween(slideTri(saved.solved ? 1 : 0, v, Boolean(saved.solved)), 400);
        ctx.expr(`A = ?`);
        ctx.say(copy.slant.say);
        const options = placeCorrect(paraChoices(v), v.base + v.height).map((o) => ({
          ...o,
          label: `${o.value} sq ${v.unit.en}`,
          cue:
            o.kind === "slant"
              ? {
                  en: `${v.base * v.slant} uses the slanted side (${v.slant}). Height must meet the base at a 90° angle.`,
                  es: `${v.base * v.slant} usa el lado inclinado (${v.slant}). La altura debe formar un ángulo de 90° con la base.`,
                }
              : o.kind === "half"
                ? {
                    en: "Half of base × height is for a triangle. A parallelogram rearranges into a FULL rectangle.",
                    es: "La mitad de base × altura es para un triángulo. Un paralelogramo forma un rectángulo COMPLETO.",
                  }
                : {
                    en: "Check the formula for a rectangle with the same base and perpendicular height.",
                    es: "Revisa la fórmula de un rectángulo con la misma base y altura perpendicular.",
                  },
        }));
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.slant.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(slideTri(1, v, true), 500);
              ctx.expr(
                `A = ${hi(String(v.base))} × ${hi(String(v.height))} = ${hi(String(copy.area))}`,
              );
              ctx.feedback(copy.slant.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "morph",
      label: { en: "Slide into rectangle", es: "Desliza a rectángulo" },
      askChild: copy.askChild.morph,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        let pct = Number.isInteger(st.pct) ? st.pct : 0;
        const paint = async (val) => {
          pct = val;
          st.pct = val;
          await ctx.tween(slideTri(val / 100, v, val >= 95), 0);
          ctx.expr(
            val >= 95
              ? `A = ${hi(String(v.base))} × ${hi(String(v.height))} = ${hi(String(copy.area))}`
              : `${escHtml(ctx.L({ en: "Slide", es: "Desliza" }))}: ${val}%`,
          );
          ctx.say({ en: copy.morph.sayEn, es: copy.morph.say.es });
          if (val >= 95) {
            ctx.feedback(copy.morph.done);
            ctx.unlock();
          } else {
            ctx.feedback(
              {
                en: "Slide all the way to 100% to lock the triangle onto the right side.",
                es: "Desliza hasta el 100% para encajar el triángulo en el lado derecho.",
              },
              "cue",
            );
          }
          ctx.save();
        };
        ctx.panel.appendChild(
          ctx.range({
            label: { en: "Slide triangle (%)", es: "Deslizar triángulo (%)" },
            min: 0,
            max: 100,
            value: pct,
            onInput: (val) => paint(val),
          }),
        );
        await paint(pct);
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
            `para:${v.base}:${v.height}`,
            Number(st.variant) || 0,
            v.transfer.length,
          );
          const t = v.transfer[idx];
          const ta = paraArea(t);
          ctx.panel.innerHTML = "";
          ctx.feedback("");
          await ctx.tween(slideTri(st.solved ? 1 : 0, t, Boolean(st.solved)), 350);
          ctx.expr(
            `b = ${hi(String(t.base))}, h = ${hi(String(t.height))}, ${escHtml(ctx.L({ en: "slant", es: "inclinado" }))} = ${lo(String(t.slant))}`,
          );
          ctx.say({
            en: `Find the area of a parallelogram with base ${t.base} ${t.unit.en}, perpendicular height ${t.height} ${t.unit.en}, and slanted side ${t.slant} ${t.unit.en}.`,
            es: `Encuentra el área de un paralelogramo de base ${t.base} ${t.unit.es}, altura perpendicular ${t.height} ${t.unit.es} y lado inclinado ${t.slant} ${t.unit.es}.`,
          });
          const options = placeCorrect(paraChoices(t), t.base * 2 + t.height).map((o) => ({
            ...o,
            label: `${o.value} sq ${t.unit.en}`,
            cue:
              o.kind === "slant"
                ? {
                    en: `That multiplied by the slanted side (${t.slant}). Use the perpendicular height (${t.height}).`,
                    es: `Eso multiplicó por el lado inclinado (${t.slant}). Usa la altura perpendicular (${t.height}).`,
                  }
                : {
                    en: `Picture sliding the triangle to make a ${t.base} × ${t.height} rectangle.`,
                    es: `Imagina deslizar el triángulo para formar un rectángulo de ${t.base} × ${t.height}.`,
                  },
          }));
          ctx.panel.append(
            ctx.choices({
              question: { en: `Area (sq ${t.unit.en}) =`, es: `Área (${t.unit.es}²) =` },
              options,
              restore: st.solved ? options.findIndex((o) => o.correct) : null,
              onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
              onCorrect: async () => {
                st.solved = true;
                ctx.save();
                await ctx.tween(slideTri(1, t, true), 450);
                ctx.expr(`A = ${hi(String(t.base))} × ${hi(String(t.height))} = ${hi(String(ta))}`);
                ctx.feedback({
                  en: `Yes: ${t.base} × ${t.height} = ${ta} sq ${t.unit.en}.`,
                  es: `Sí: ${t.base} × ${t.height} = ${ta} ${t.unit.es}².`,
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
