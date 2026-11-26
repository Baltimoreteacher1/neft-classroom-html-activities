// living/median-iqr.js — fold sorted data strip at median → Q1/Q3 → box plot
// & outlier resistance on one persistent SVG stage. Uses only var(--lsx-*) tokens.

import { escHtml, seededStep } from "../../core/living-scene.js";
import {
  fiveNum,
  H,
  iqrChoices,
  medianIqrCopy,
  placeCorrect,
  validateMedianIqr,
  W,
} from "./median-iqr-model.js";

export { validateMedianIqr };

const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;

export function buildMedianIqrPlay(cfg) {
  const v = validateMedianIqr(cfg);
  if (!v) return null;
  const copy = medianIqrCopy(v);
  let cast = null;

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const el = (tag, attrs) => svgEl(tag, { opacity: 0, ...attrs }, g);
    const txt = (attrs) =>
      el("text", {
        "text-anchor": "middle",
        "font-size": 14,
        "font-weight": 800,
        fill: "var(--lsx-ink)",
        ...attrs,
      });

    const maxTiles = 14;
    const tiles = Array.from({ length: maxTiles }, () => ({
      box: el("rect", {
        x: 0,
        y: 66,
        width: 40,
        height: 36,
        rx: 6,
        fill: "var(--lsx-paper)",
        stroke: "var(--lsx-rule-strong)",
        "stroke-width": 2,
      }),
      num: txt({ x: 0, y: 90 }),
    }));
    const foldMed = el("line", {
      x1: W / 2,
      y1: 48,
      x2: W / 2,
      y2: 118,
      stroke: "var(--lsx-lo)",
      "stroke-width": 3,
      "stroke-dasharray": "6 4",
    });
    const foldQ1 = el("line", {
      x1: W / 4,
      y1: 54,
      x2: W / 4,
      y2: 112,
      stroke: "var(--lsx-hi)",
      "stroke-width": 2.5,
      "stroke-dasharray": "5 4",
    });
    const foldQ3 = el("line", {
      x1: (3 * W) / 4,
      y1: 54,
      x2: (3 * W) / 4,
      y2: 112,
      stroke: "var(--lsx-hi)",
      "stroke-width": 2.5,
      "stroke-dasharray": "5 4",
    });

    // Box plot track below the strip
    const by = 225;
    const axis = el("line", {
      x1: 56,
      y1: by + 56,
      x2: W - 56,
      y2: by + 56,
      stroke: "var(--lsx-ink)",
      "stroke-width": 2,
    });
    const whisker = el("line", {
      x1: 56,
      y1: by,
      x2: W - 56,
      y2: by,
      stroke: "var(--lsx-ink)",
      "stroke-width": 3,
    });
    const minTick = el("line", {
      x1: 56,
      y1: by - 16,
      x2: 56,
      y2: by + 16,
      stroke: "var(--lsx-ink)",
      "stroke-width": 3,
    });
    const maxTick = el("line", {
      x1: W - 56,
      y1: by - 16,
      x2: W - 56,
      y2: by + 16,
      stroke: "var(--lsx-ink)",
      "stroke-width": 3,
    });
    const box = el("rect", {
      x: 200,
      y: by - 26,
      width: 200,
      height: 52,
      rx: 6,
      fill: "var(--lsx-x)",
      "fill-opacity": 0.3,
      stroke: "var(--lsx-x-edge)",
      "stroke-width": 3,
    });
    const medLine = el("line", {
      x1: 300,
      y1: by - 26,
      x2: 300,
      y2: by + 26,
      stroke: "var(--lsx-lo)",
      "stroke-width": 4,
    });
    const lblMin = txt({ x: 56, y: by + 40, "font-size": 13 });
    const lblQ1 = txt({ x: 200, y: by - 36, fill: "var(--lsx-hi)", "font-size": 14 });
    const lblMed = txt({ x: 300, y: by + 40, fill: "var(--lsx-lo)", "font-size": 14 });
    const lblQ3 = txt({ x: 400, y: by - 36, fill: "var(--lsx-hi)", "font-size": 14 });
    const lblMax = txt({ x: W - 56, y: by + 40, "font-size": 13 });
    const statLine = txt({ x: W / 2, y: 316, "font-size": 15, fill: "var(--lsx-hi)" });

    cast = {
      tiles,
      foldMed,
      foldQ1,
      foldQ3,
      axis,
      whisker,
      minTick,
      maxTick,
      box,
      medLine,
      lblMin,
      lblQ1,
      lblMed,
      lblQ3,
      lblMax,
      statLine,
    };
  }

  function layoutData(values, { foldLevel = 0, showBox = false, scaleMax = null } = {}) {
    const s = fiveNum(values);
    const n = s.n;
    const tw = Math.min(46, Math.floor((W - 80) / n) - 4);
    const totalW = n * (tw + 4) - 4;
    const startX = (W - totalW) / 2;
    const m = [];
    cast.tiles.forEach((t, i) => {
      if (i >= n) {
        m.push([t.box, { opacity: 0 }]);
        m.push([t.num, { opacity: 0 }]);
        return;
      }
      const x = startX + i * (tw + 4);
      const inMid = foldLevel >= 2 && s.sorted[i] >= s.q1 && s.sorted[i] <= s.q3;
      m.push([
        t.box,
        {
          x,
          width: tw,
          opacity: 1,
          fill: inMid ? "var(--lsx-ok-bg)" : "var(--lsx-paper)",
          stroke: inMid ? "var(--lsx-x-edge)" : "var(--lsx-rule-strong)",
        },
      ]);
      m.push([t.num, { x: x + tw / 2, opacity: 1, text: String(s.sorted[i]) }]);
    });
    const midX = startX + totalW / 2;
    const q1X = startX + totalW * 0.25;
    const q3X = startX + totalW * 0.75;
    m.push([cast.foldMed, { x1: midX, x2: midX, opacity: foldLevel >= 1 ? 1 : 0 }]);
    m.push([cast.foldQ1, { x1: q1X, x2: q1X, opacity: foldLevel >= 2 ? 1 : 0 }]);
    m.push([cast.foldQ3, { x1: q3X, x2: q3X, opacity: foldLevel >= 2 ? 1 : 0 }]);

    const loVal = s.min;
    const hiVal = Math.max(scaleMax ?? s.max, s.max);
    const span = Math.max(1, hiVal - loVal);
    const px = (val) => 66 + ((val - loVal) / span) * (W - 132);
    const xMin = px(s.min);
    const xQ1 = px(s.q1);
    const xMed = px(s.med);
    const xQ3 = px(s.q3);
    const xMax = px(s.max);
    const bo = showBox ? 1 : 0;
    m.push([cast.axis, { opacity: bo }]);
    m.push([cast.whisker, { x1: xMin, x2: xMax, opacity: bo }]);
    m.push([cast.minTick, { x1: xMin, x2: xMin, opacity: bo }]);
    m.push([cast.maxTick, { x1: xMax, x2: xMax, opacity: bo }]);
    m.push([cast.box, { x: xQ1, width: Math.max(8, xQ3 - xQ1), opacity: bo }]);
    m.push([cast.medLine, { x1: xMed, x2: xMed, opacity: bo }]);
    m.push([cast.lblMin, { x: xMin, opacity: bo, text: String(s.min) }]);
    m.push([cast.lblQ1, { x: xQ1, opacity: bo, text: `Q1=${s.q1}` }]);
    m.push([cast.lblMed, { x: xMed, opacity: bo, text: `Med=${s.med}` }]);
    m.push([cast.lblQ3, { x: xQ3, opacity: bo, text: `Q3=${s.q3}` }]);
    m.push([cast.lblMax, { x: xMax, opacity: bo, text: String(s.max) }]);
    m.push([cast.statLine, { opacity: bo, text: `IQR = ${s.iqr}   ·   Range = ${s.range}` }]);
    return m;
  }

  const scenes = [
    {
      id: "situate",
      label: { en: "Sort the data", es: "Ordena los datos" },
      askChild: copy.askChild.situate,
      async enter(ctx) {
        await ctx.tween(layoutData(v.values, { foldLevel: 0, showBox: false }), 400);
        ctx.expr(`${copy.s.n} ${escHtml(ctx.L(v.unit))}: ${copy.s.min} … ${copy.s.max}`);
        ctx.say(copy.situate);
      },
    },
    {
      id: "fold",
      label: { en: "Fold halves", es: "Dobla en mitades" },
      askChild: copy.askChild.fold,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        let level = Number.isInteger(st.level) ? st.level : 0;
        const paint = async (lv, ms) => {
          level = lv;
          st.level = lv;
          await ctx.tween(layoutData(v.values, { foldLevel: lv, showBox: lv >= 2 }), ms);
          ctx.expr(
            lv === 0
              ? `${copy.s.min} … ${copy.s.max}`
              : lv === 1
                ? `${escHtml(ctx.L({ en: "Median", es: "Mediana" }))} = ${lo(String(copy.s.med))}`
                : `Q1 = ${hi(String(copy.s.q1))} · Med = ${lo(String(copy.s.med))} · Q3 = ${hi(String(copy.s.q3))}`,
          );
          ctx.say(copy.fold.say);
          if (lv >= 2) {
            ctx.feedback(copy.fold.done);
            ctx.unlock();
          } else {
            ctx.feedback(
              {
                en:
                  lv === 0
                    ? "Click Fold to find the median first."
                    : "Click Fold again to find Q1 and Q3.",
                es:
                  lv === 0
                    ? "Pulsa Doblar para encontrar primero la mediana."
                    : "Pulsa Doblar otra vez para encontrar Q1 y Q3.",
              },
              "cue",
            );
          }
          ctx.save();
        };
        ctx.panel.appendChild(
          ctx.button({
            label: { en: "Fold in half", es: "Doblar a la mitad" },
            primary: true,
            onClick: () => {
              if (level < 2) paint(level + 1, 500);
            },
          }),
        );
        await paint(level, 350);
      },
    },
    {
      id: "iqr",
      label: { en: "IQR vs Range", es: "RIC vs Rango" },
      askChild: copy.askChild.iqr,
      gate: true,
      async enter(ctx, saved) {
        await ctx.tween(layoutData(v.values, { foldLevel: 2, showBox: true }), 400);
        ctx.expr(`Q1 = ${hi(String(copy.s.q1))} · Q3 = ${hi(String(copy.s.q3))} · IQR = ?`);
        ctx.say(copy.iqr.say);
        const options = placeCorrect(iqrChoices(v.values), copy.s.iqr + copy.s.range).map((o) => ({
          ...o,
          label: String(o.value),
          cue:
            o.kind === "range"
              ? {
                  en: `${copy.s.range} is the full Range (${copy.s.max} − ${copy.s.min}). IQR uses the box edges: Q3 − Q1.`,
                  es: `${copy.s.range} es el Rango completo (${copy.s.max} − ${copy.s.min}). El RIC usa los bordes de la caja: Q3 − Q1.`,
                }
              : {
                  en: `Subtract Q1 (${copy.s.q1}) from Q3 (${copy.s.q3}) to find the width of the middle-half box.`,
                  es: `Resta Q1 (${copy.s.q1}) de Q3 (${copy.s.q3}) para encontrar el ancho de la caja central.`,
                },
        }));
        ctx.panel.appendChild(
          ctx.choices({
            question: copy.iqr.question,
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: () => {
              ctx.state.solved = true;
              ctx.save();
              ctx.expr(
                `IQR = ${hi(String(copy.s.q3))} − ${hi(String(copy.s.q1))} = ${hi(String(copy.s.iqr))}`,
              );
              ctx.feedback(copy.iqr.ok);
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "outlier",
      label: { en: "Stretch an outlier", es: "Estira un valor atípico" },
      askChild: copy.askChild.outlier,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        const baseMax = copy.s.max;
        const limit = baseMax + 40;
        let curMax = Number.isInteger(st.curMax) ? st.curMax : baseMax;
        const paint = async (mVal, ms) => {
          curMax = mVal;
          st.curMax = mVal;
          const mod = [...v.values.slice(0, -1), mVal];
          const s2 = fiveNum(mod);
          await ctx.tween(layoutData(mod, { foldLevel: 2, showBox: true, scaleMax: limit }), ms);
          ctx.expr(
            `IQR = ${hi(String(s2.iqr))} &nbsp;·&nbsp; ${escHtml(ctx.L({ en: "Range", es: "Rango" }))} = ${lo(String(s2.range))}`,
          );
          ctx.say({ en: copy.outlier.sayEn, es: copy.outlier.say.es });
          if (mVal >= baseMax + 15) {
            ctx.feedback(copy.outlier.done);
            ctx.unlock();
          } else {
            ctx.feedback(
              {
                en: `Drag the max value up at least +15 to watch Range grow while IQR stays ${copy.s.iqr}.`,
                es: `Arrastra el valor máximo al menos +15 para ver cómo crece el Rango mientras el RIC sigue en ${copy.s.iqr}.`,
              },
              "cue",
            );
          }
          ctx.save();
        };
        ctx.panel.appendChild(
          ctx.range({
            label: { en: "Highest value", es: "Valor más alto" },
            min: baseMax,
            max: limit,
            value: curMax,
            onInput: (val) => paint(val, 200),
          }),
        );
        await paint(curMax, 350);
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
            `iqr:${copy.s.med}:${copy.s.iqr}`,
            Number(st.variant) || 0,
            v.transfer.length,
          );
          const t = v.transfer[idx];
          const ts = fiveNum(t.values);
          ctx.panel.innerHTML = "";
          ctx.feedback("");
          await ctx.tween(layoutData(t.values, { foldLevel: 2, showBox: Boolean(st.solved) }), 350);
          ctx.expr(`Q1 = ${hi(String(ts.q1))} · Q3 = ${hi(String(ts.q3))} · IQR = ?`);
          ctx.say({
            en: `Find the IQR for this sorted data set (Q1 = ${ts.q1}, Q3 = ${ts.q3}).`,
            es: `Encuentra el RIC de este conjunto ordenado (Q1 = ${ts.q1}, Q3 = ${ts.q3}).`,
          });
          const options = placeCorrect(iqrChoices(t.values), ts.q1 + ts.q3).map((o) => ({
            ...o,
            label: String(o.value),
            cue:
              o.kind === "range"
                ? {
                    en: `That is the full Range (${ts.max} − ${ts.min}). For IQR, compute Q3 − Q1.`,
                    es: `Ese es el Rango completo (${ts.max} − ${ts.min}). Para el RIC, calcula Q3 − Q1.`,
                  }
                : {
                    en: `Compute Q3 − Q1 = ${ts.q3} − ${ts.q1}.`,
                    es: `Calcula Q3 − Q1 = ${ts.q3} − ${ts.q1}.`,
                  },
          }));
          ctx.panel.append(
            ctx.choices({
              question: { en: "IQR =", es: "RIC =" },
              options,
              restore: st.solved ? options.findIndex((o) => o.correct) : null,
              onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
              onCorrect: async () => {
                st.solved = true;
                ctx.save();
                await ctx.tween(layoutData(t.values, { foldLevel: 2, showBox: true }), 450);
                ctx.expr(
                  `IQR = ${hi(String(ts.q3))} − ${hi(String(ts.q1))} = ${hi(String(ts.iqr))}`,
                );
                ctx.feedback({
                  en: `Yes: ${ts.q3} − ${ts.q1} = ${ts.iqr}.`,
                  es: `Sí: ${ts.q3} − ${ts.q1} = ${ts.iqr}.`,
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
