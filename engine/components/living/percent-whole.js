// living/percent-whole.js — "the same percent is a different amount when the
// whole changes."
//
// One cast for the whole play: 100 cells. They ARE the hundred-grid in scenes
// 1-3 (the whole = 100 cells, p of them shaded), they RE-FLOW into a 100-unit
// percent bar with a double number line beneath it (0..100% over 0..whole),
// and in scene 4 the bar never moves while the quantity line under it is
// relabelled for other wholes — the student sees p% stay p% while the part
// changes. Scene 5 turns the shaded cells back into p/100 = decimal = p%.
//
// Config: { percent, whole, unit:{en,es}, item:{en,es}, partName:{en,es},
//           story:{en,es}, transfer:{percent, whole, item:{en,es}} }
// — the lesson's own numbers (4-4 authors 25% of 60 tickets and 40% of 80).
// Validated up front; anything out of range makes the play refuse to draw.
// p·W/100 always terminates (100 = 2²·5²), and every part is computed in
// exact hundredths so no float ever reaches the stage.

import { escHtml } from "../../core/living-scene.js";

const SW = 720;
const SH = 270;
const CELL = 22;
const GX = 40;
const GY = 40;
const BX = 60; // percent bar: 100 units of BU, BX..BX+600
const BU = 6;
const BY = 74;
const BH = 36;
const QY = 176; // quantity line

const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/** {en, es} from a string or pair; null when missing or too long. */
function textPair(v, max = 60) {
  const en = typeof v === "string" ? v.trim() : typeof v?.en === "string" ? v.en.trim() : "";
  const es = typeof v?.es === "string" && v.es.trim() ? v.es.trim() : en;
  if (!en || en.length > max || es.length > max) return null;
  return { en, es };
}

/** k hundredths as an exact decimal string: 1500 → "15", 450 → "4.5", 25 → "0.25". */
export function fmtHundredths(k) {
  if (!Number.isInteger(k) || k < 0) return "";
  const int = Math.floor(k / 100);
  const frac = k % 100;
  if (!frac) return String(int);
  return `${int}.${String(frac).padStart(2, "0").replace(/0$/, "")}`;
}

/** p% of w, exact: p·w hundredths. */
export const partOf = (p, w) => fmtHundredths(p * w);

/** p/100, its simplest form (null if already simplest), decimal, percent. */
export function fdp(p) {
  const g = gcd(p, 100);
  return {
    fraction: `${p}/100`,
    simplified: g > 1 ? `${p / g}/${100 / g}` : null,
    decimal: fmtHundredths(p),
    percent: `${p}%`,
  };
}

/**
 * The prediction choices for p% of w: the correct part plus distractors from
 * real misconceptions — the percent itself, whole − percent, percent ÷ whole
 * (rounded to hundredths), percent × whole (forgot ÷ 100). Duplicates of the
 * correct value or of each other are dropped; at most 4 options.
 */
export function predictOptions(p, w) {
  const correct = partOf(p, w);
  const cands = [
    { kind: "percent", value: String(p) },
    { kind: "subtract", value: w > p ? String(w - p) : null },
    { kind: "divide", value: fmtHundredths(Math.round((p * 100) / w)) },
    { kind: "times", value: String(p * w) },
  ];
  const out = [{ kind: "correct", value: correct, correct: true }];
  const seen = new Set([correct]);
  for (const c of cands) {
    if (c.value == null || seen.has(c.value) || out.length >= 4) continue;
    seen.add(c.value);
    out.push({ ...c, correct: false });
  }
  return out;
}

/**
 * Wholes the "change the whole" slider visits: multiples of `step`, chosen so
 * p% of each is a whole number when that still leaves 6+ stops (else tenths).
 */
export function wholeRange(p, w) {
  const maxW = Math.min(1000, Math.max(200, 2 * w));
  let step = 100 / gcd(p, 100);
  if (maxW / step < 6) step = 10;
  const maxK = Math.floor(maxW / step);
  const startK = Math.min(maxK, Math.max(1, Math.round(w / step)));
  return { step, maxK, startK };
}

/** Stable position for the correct choice — never always first. */
export function placeCorrect(options, seed) {
  const k = seed % options.length;
  const correct = options.find((o) => o.correct);
  const rest = options.filter((o) => !o.correct);
  rest.splice(k, 0, correct);
  return rest;
}

export function validatePercentWhole(cfg) {
  const p = Number(cfg?.percent);
  const w = Number(cfg?.whole);
  if (!okInt(p, 1, 99) || !okInt(w, 2, 1000)) return null;
  const unit = textPair(cfg.unit, 30) || { en: "items", es: "objetos" };
  const item = textPair(cfg.item) || { en: "The whole", es: "El total" };
  const partName = textPair(cfg.partName, 30) || { en: "the part", es: "la parte" };
  // A story is only trusted if it states the same numbers the stage draws.
  let story = textPair(cfg.story, 400);
  if (story && ![story.en, story.es].every((s) => s.includes(`${p}%`) && s.includes(String(w))))
    story = null;
  const t = cfg.transfer || {};
  let tp = Number(t.percent);
  let tw = Number(t.whole);
  if (!okInt(tp, 1, 99) || !okInt(tw, 2, 1000) || (tp === p && tw === w)) {
    tp = p === 40 ? 30 : 40;
    tw = w === 80 ? 50 : 80;
  }
  const tItem = textPair(t.item) || item;
  const opts = predictOptions(p, w);
  if (opts.length < 3 || predictOptions(tp, tw).length < 3) return null;
  return {
    p,
    w,
    unit,
    item,
    partName,
    story,
    transfer: { p: tp, w: tw, item: tItem },
    range: wholeRange(p, w),
  };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const clampX = (x, text, size = 20) => {
  const hw = String(text).length * size * 0.29;
  return Math.min(SW - 8 - hw, Math.max(8 + hw, x));
};

export function buildPercentWholePlay(cfg) {
  const v = validatePercentWhole(cfg);
  if (!v) return null;
  const { p, w, unit, item, partName } = v;
  const part = partOf(p, w);
  const f = fdp(p);
  let cast = null;
  let onCell = null;

  const gridPos = (i) => ({
    x: GX + (i % 10) * CELL + 1,
    y: GY + Math.floor(i / 10) * CELL + 1,
    width: CELL - 2,
    height: CELL - 2,
  });
  const barPos = (i) => ({ x: BX + i * BU, y: BY, width: BU, height: BH });

  function setup(ctx) {
    const { svg, svgEl } = ctx;
    svg.innerHTML = "";
    const g = svgEl("g", {}, svg);
    const T = (a) =>
      svgEl(
        "text",
        { "font-size": 15, "font-weight": 700, fill: "var(--lsx-ink)", opacity: 0, ...a },
        g,
      );
    const line = (a) =>
      svgEl("line", { stroke: "var(--lsx-ink)", "stroke-width": 2, opacity: 0, ...a }, g);
    const gridFrame = svgEl(
      "rect",
      { x: GX - 3, y: GY - 3, width: CELL * 10 + 4, height: CELL * 10 + 4, rx: 5 },
      g,
    );
    for (const [k, val] of Object.entries({
      fill: "none",
      stroke: "var(--lsx-ink)",
      "stroke-width": 2,
      opacity: 0,
    }))
      gridFrame.setAttribute(k, String(val));
    const cells = Array.from({ length: 100 }, (_, i) => {
      const c = svgEl("rect", { ...gridPos(i), rx: 2, "stroke-width": 1, opacity: 0 }, g);
      c.addEventListener("click", () => onCell?.(i));
      return c;
    });
    const barFrame = svgEl(
      "rect",
      { x: BX, y: BY, width: 100 * BU, height: BH, fill: "none", stroke: "var(--lsx-ink)" },
      g,
    );
    barFrame.setAttribute("stroke-width", "2");
    barFrame.setAttribute("opacity", "0");
    cast = {
      gridFrame,
      cells,
      barFrame,
      header: T({ x: 20, y: 22, "font-size": 22, "font-weight": 800 }),
      side: [
        T({ x: 300, y: 92, "font-size": 22 }),
        T({ x: 300, y: 124, "font-size": 26, "font-weight": 800, fill: "var(--lsx-hi)" }),
        T({ x: 300, y: 176, "font-size": 22 }),
        T({ x: 300, y: 208, "font-size": 26, "font-weight": 800, fill: "var(--lsx-hi)" }),
      ],
      pctLbl: Array.from({ length: 11 }, (_, k) =>
        T({
          x: BX + k * 60,
          y: BY - 8,
          "text-anchor": "middle",
          "font-size": 16,
          fill: "var(--lsx-muted)",
          text: `${k * 10}%`,
        }),
      ),
      pctCallout: T({
        x: BX,
        y: 46,
        "text-anchor": "middle",
        "font-size": 20,
        "font-weight": 800,
        fill: "var(--lsx-hi)",
      }),
      pctLeader: line({ x1: BX, y1: 52, x2: BX, y2: BY, stroke: "var(--lsx-hi)" }),
      align: line({
        x1: BX,
        y1: BY + BH,
        x2: BX,
        y2: QY,
        "stroke-dasharray": "5 4",
        stroke: "var(--lsx-hi)",
      }),
      qLine: line({ x1: BX, y1: QY, x2: BX + 600, y2: QY }),
      qSeg: line({ x1: BX, y1: QY, x2: BX, y2: QY, stroke: "var(--lsx-x)", "stroke-width": 7 }),
      qTicks: Array.from({ length: 11 }, (_, k) =>
        line({ x1: BX + k * 60, y1: QY - 7, x2: BX + k * 60, y2: QY + 7 }),
      ),
      qLbl: Array.from({ length: 11 }, (_, k) =>
        T({
          x: BX + k * 60,
          y: QY + 24,
          "text-anchor": "middle",
          "font-size": 16,
          fill: "var(--lsx-muted)",
        }),
      ),
      partLeader: line({ x1: BX, y1: QY, x2: BX, y2: QY + 34, stroke: "var(--lsx-hi)" }),
      partCallout: T({
        x: BX,
        y: QY + 54,
        "text-anchor": "middle",
        "font-size": 20,
        "font-weight": 800,
        fill: "var(--lsx-hi)",
      }),
    };
  }

  const shade = (n) =>
    cast.cells.forEach((c, i) => {
      c.setAttribute("fill", i < n ? "var(--lsx-x)" : "var(--lsx-card)");
      c.setAttribute("stroke", i < n ? "var(--lsx-x-edge)" : "var(--lsx-rule-strong)");
    });
  const barOnly = () => [
    cast.barFrame,
    ...cast.pctLbl,
    cast.pctCallout,
    cast.pctLeader,
    cast.align,
    cast.qLine,
    cast.qSeg,
    ...cast.qTicks,
    ...cast.qLbl,
    cast.partLeader,
    cast.partCallout,
  ];
  const setHeader = (it, pp, ww) => {
    cast.header.textContent = `${it} · ${pp}% ${ctxLang === "es" ? "de" : "of"} ${ww} ${cur(unit)}`;
  };
  let ctxLang = "en";
  let cur = (pair) => pair.en;

  function gridMoves() {
    const m = cast.cells.map((c, i) => [c, { ...gridPos(i), opacity: 1, "stroke-width": 1 }]);
    m.push([cast.gridFrame, { opacity: 1 }], [cast.header, { opacity: 1 }]);
    for (const s of cast.side) m.push([s, { opacity: 1 }]);
    for (const el of barOnly()) m.push([el, { opacity: 0 }]);
    return m;
  }
  /** Bar + double number line labelled for pp% of ww; partText overrides the part. */
  function barMoves(pp, ww, partText) {
    const xp = BX + pp * BU;
    const m = cast.cells.map((c, i) => [c, { ...barPos(i), opacity: 1, "stroke-width": 0.6 }]);
    for (const c of cast.cells) c.setAttribute("stroke", "var(--lsx-card)");
    m.push(
      [cast.gridFrame, { opacity: 0 }],
      [cast.header, { opacity: 1 }],
      [cast.barFrame, { opacity: 1 }],
    );
    for (const s of cast.side) m.push([s, { opacity: 0 }]);
    const pctText = `${pp}%`;
    cast.pctCallout.textContent = pctText;
    m.push([cast.pctCallout, { opacity: 1, x: clampX(xp, pctText) }]);
    m.push(
      [cast.pctLeader, { opacity: 1, x1: xp, x2: xp }],
      [cast.align, { opacity: 1, x1: xp, x2: xp }],
    );
    m.push([cast.qLine, { opacity: 1 }], [cast.qSeg, { opacity: 1, x2: xp }]);
    const near = (k) => Math.abs(pp - k * 10) <= 3;
    cast.pctLbl.forEach((t, k) => m.push([t, { opacity: near(k) ? 0 : 1 }]));
    cast.qTicks.forEach((t) => m.push([t, { opacity: 1 }]));
    cast.qLbl.forEach((t, k) => {
      t.textContent = fmtHundredths(ww * k * 10);
      m.push([t, { opacity: near(k) ? 0 : 1 }]);
    });
    const pt = partText ?? `${partOf(pp, ww)} ${cur(unit)}`;
    cast.partCallout.textContent = pt;
    m.push([cast.partLeader, { opacity: 1, x1: xp, x2: xp }]);
    m.push([cast.partCallout, { opacity: 1, x: clampX(xp, pt) }]);
    return m;
  }
  const setSide = (a, b, c, d) =>
    [a, b, c, d].forEach((s, i) => {
      cast.side[i].textContent = s;
    });
  const markWhole = (on) => {
    cast.gridFrame.setAttribute("stroke", on ? "var(--lsx-lo)" : "var(--lsx-ink)");
    cast.gridFrame.setAttribute("stroke-dasharray", on ? "7 4" : "");
    cast.gridFrame.setAttribute("stroke-width", on ? "4" : "2");
  };

  const hi = (s) => `<span class="lsx-hi">${escHtml(s)}</span>`;
  const lo = (s) => `<span class="lsx-lo">${escHtml(s)}</span>`;
  const ofWord = () => (ctxLang === "es" ? "de" : "of");

  /**
   * Cue (never the answer) for a misconception choice about pp% of ww. `bar`
   * words it for the percent bar (transfer) instead of the outlined grid.
   */
  function cueFor(kind, pp, ww, bar = false) {
    const u = unit;
    const wh = bar
      ? { en: "the whole bar", es: "toda la barra", cell: "part", celda: "parte", div: "dividida" }
      : {
          en: "the outlined whole",
          es: "el total marcado",
          cell: "cell",
          celda: "celda",
          div: "dividido",
        };
    const pic = bar ? { en: "bar", es: "la barra" } : { en: "grid", es: "la cuadrícula" };
    return {
      percent: {
        en: `${pp} would only work if the whole were 100 ${u.en}. ${cap(wh.en)} is ${ww} ${u.en}, split into 100 equal ${wh.cell}s. How much is one ${wh.cell} worth?`,
        es: `${pp} solo funcionaría si el total fuera 100 ${u.es}. ${cap(wh.es)} es ${ww} ${u.es}, ${wh.div} en 100 ${wh.celda}s iguales. ¿Cuánto vale una ${wh.celda}?`,
      },
      subtract: {
        en: `${ww} − ${pp} takes away ${pp} ${u.en}. But ${pp}% is not ${pp} ${u.en}: it is ${pp} out of every 100 equal parts of the whole. Look at ${wh.en}.`,
        es: `${ww} − ${pp} quita ${pp} ${u.es}. Pero el ${pp}% no es ${pp} ${u.es}: es ${pp} de cada 100 partes iguales del total. Mira ${wh.es}.`,
      },
      divide: {
        en: `That divides ${pp} by ${ww}. "Of" means multiply. ${cap(partName.en)} is a piece of the whole ${ww} ${u.en}: look at how much of the ${pic.en} that piece covers.`,
        es: `Eso divide ${pp} entre ${ww}. «De» significa multiplicar. ${cap(partName.es)} es una parte del total de ${ww} ${u.es}: mira cuánto de ${pic.es} cubre esa parte.`,
      },
      times: {
        en: `${pp} × ${ww} = ${pp * ww}, more than the whole ${ww} ${u.en}. Can a piece of ${wh.en} be bigger than the whole? Remember: percent means "per 100."`,
        es: `${pp} × ${ww} = ${pp * ww}, más que el total de ${ww} ${u.es}. ¿Puede una parte de ${wh.es} ser mayor que el total? Recuerda: porcentaje quiere decir «de cada 100».`,
      },
    }[kind];
  }

  function choiceList(ctx, pp, ww, seed, bar = false) {
    return placeCorrect(
      predictOptions(pp, ww).map((o) => ({
        ...o,
        label: `${o.value} ${ctx.L(unit)}`,
        cue: o.correct ? null : cueFor(o.kind, pp, ww, bar),
      })),
      seed,
    );
  }

  const scenes = [
    {
      id: "situate",
      label: { en: "The situation", es: "La situación" },
      async enter(ctx) {
        markWhole(false);
        shade(0);
        setHeader(ctx.L(item), p, w);
        setSide(
          ctx.L({ en: "The whole grid = 100%", es: "Toda la cuadrícula = 100%" }),
          `= ${w} ${ctx.L(unit)}`,
          ctx.L({ en: "Each cell = 1%", es: "Cada celda = 1%" }),
          ctx.L({ en: `${p}% = ?`, es: `${p}% = ?` }),
        );
        ctx.expr(`${p}% ${ofWord()} ${hi(String(w))} = ?`);
        ctx.say(
          v.story || {
            en: `${item.en} has a whole of ${w} ${unit.en}. We want ${partName.en}: ${p}% of ${w} ${unit.en}. The grid stands for the whole ${w} ${unit.en}, cut into 100 equal cells.`,
            es: `${item.es} tiene un total de ${w} ${unit.es}. Buscamos ${partName.es}: el ${p}% de ${w} ${unit.es}. La cuadrícula representa el total de ${w} ${unit.es}, cortado en 100 celdas iguales.`,
          },
        );
        const m = gridMoves();
        await ctx.tween(
          m.map(([el, a]) => [el, cast.cells.includes(el) ? { ...a, opacity: 0 } : a]),
          0,
        );
        for (let r = 0; r < 10; r++)
          await ctx.tween(
            cast.cells.slice(r * 10, r * 10 + 10).map((c) => [c, { opacity: 1 }]),
            90,
          );
      },
    },
    {
      id: "predict",
      label: { en: "Predict", es: "Predice" },
      gate: true,
      async enter(ctx, saved) {
        markWhole(false);
        shade(0);
        setHeader(ctx.L(item), p, w);
        await ctx.tween(gridMoves(), 300);
        ctx.expr(`${p}% ${ofWord()} ${hi(String(w))} = ?`);
        ctx.say({
          en: `Before you shade anything: how many ${unit.en} is ${p}% of ${w} ${unit.en}?`,
          es: `Antes de sombrear: ¿cuántos ${unit.es} son el ${p}% de ${w} ${unit.es}?`,
        });
        const options = choiceList(ctx, p, w, p + w);
        ctx.panel.appendChild(
          ctx.choices({
            question: { en: `${p}% of ${w} ${unit.en} is…`, es: `El ${p}% de ${w} ${unit.es} es…` },
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => {
              markWhole(opt.kind !== "divide");
              ctx.feedback(opt.cue, "cue");
            },
            onCorrect: () => {
              markWhole(false);
              ctx.state.solved = true;
              ctx.feedback({
                en: `Good prediction. Now prove it: shade ${p}% of the grid and watch where it lands.`,
                es: `Buena predicción. Ahora demuéstralo: sombrea el ${p}% de la cuadrícula y mira dónde queda.`,
              });
              ctx.unlock();
            },
          }),
        );
      },
    },
    {
      id: "shade",
      label: { en: "Shade and stretch", es: "Sombrea y estira" },
      gate: true,
      async enter(ctx, saved) {
        markWhole(false);
        setHeader(ctx.L(item), p, w);
        const st = ctx.state;
        const sideFor = (n) =>
          setSide(
            ctx.L({ en: "The whole grid = 100%", es: "Toda la cuadrícula = 100%" }),
            `= ${w} ${ctx.L(unit)}`,
            ctx.L({ en: `Shaded: ${n} of 100 cells`, es: `Sombreadas: ${n} de 100 celdas` }),
            `= ${n}%`,
          );
        const showBar = async (ms) => {
          shade(p);
          await ctx.tween(barMoves(p, w), ms);
          ctx.expr(`${p}% ${ofWord()} ${w} = ${hi(part)}`);
          const uE = escHtml(unit.en);
          const uS = escHtml(unit.es);
          ctx.feedback(
            ctx.L({
              en: `The 100 cells lined up into one bar: still 100 cells, still ${p} shaded. Under it the same bar is measured in ${uE}, 0 to ${w}. The shaded ${p}% lines up with <b>${part} ${uE}</b>.`,
              es: `Las 100 celdas se alinearon en una barra: siguen siendo 100 celdas y ${p} sombreadas. Debajo, la misma barra se mide en ${uS}, de 0 a ${w}. El ${p}% sombreado coincide con <b>${part} ${uS}</b>.`,
            }),
          );
          ctx.unlock();
        };
        ctx.say({
          en: `Shade ${p}% of the grid: click a cell or use the slider. Then turn the grid into a bar.`,
          es: `Sombrea el ${p}% de la cuadrícula: haz clic en una celda o usa el control deslizante. Luego convierte la cuadrícula en una barra.`,
        });
        if (saved.solved) {
          await showBar(0);
          return;
        }
        let n = okInt(st.count, 0, 100) ? st.count : 0;
        shade(n);
        sideFor(n);
        ctx.expr(`${p}% ${ofWord()} ${w} = ?`);
        await ctx.tween(gridMoves(), 300);
        const rng = ctx.range({
          label: { en: "Cells shaded", es: "Celdas sombreadas" },
          min: 0,
          max: 100,
          value: n,
          onInput: (val) => set(val),
        });
        const input = /** @type {HTMLInputElement} */ (rng.querySelector("input"));
        const out = /** @type {HTMLOutputElement} */ (rng.querySelector("output"));
        const set = (val) => {
          n = val;
          st.count = n;
          ctx.save();
          shade(n);
          sideFor(n);
          input.value = String(n);
          out.textContent = String(n);
          ctx.feedback("");
        };
        onCell = (i) => set(n === i + 1 ? i : i + 1);
        for (const c of cast.cells) c.style.cursor = "pointer";
        const go = ctx.button({
          label: { en: "Turn the grid into a bar", es: "Convierte la cuadrícula en barra" },
          primary: true,
          onClick: async () => {
            if (n !== p) {
              const cue =
                n === 0
                  ? { en: "Shade some cells first.", es: "Primero sombrea algunas celdas." }
                  : n === w
                    ? {
                        en: `You shaded ${w} cells, one for each of the ${w} ${unit.en}. But the grid is always 100 cells, whatever the whole is. Percent means "per 100."`,
                        es: `Sombreaste ${w} celdas, tantas como ${unit.es} tiene el total. Pero la cuadrícula siempre tiene 100 celdas, sea cual sea el total. Porcentaje quiere decir «de cada 100».`,
                      }
                    : {
                        en: `You shaded ${n} of 100 cells, which is ${n}%. Read the question again: which percent are we finding?`,
                        es: `Sombreaste ${n} de 100 celdas, o sea el ${n}%. Vuelve a leer la pregunta: ¿qué porcentaje buscamos?`,
                      };
              ctx.feedback(cue, "cue");
              return;
            }
            onCell = null;
            for (const c of cast.cells) c.style.cursor = "";
            st.solved = true;
            ctx.save();
            ctx.panel.innerHTML = "";
            await showBar(900);
          },
        });
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.appendChild(go);
        ctx.panel.append(rng, row);
      },
    },
    {
      id: "rescale",
      label: { en: "Change the whole", es: "Cambia el total" },
      gate: true,
      async enter(ctx) {
        onCell = null;
        shade(p);
        const st = ctx.state;
        const { step, maxK, startK } = v.range;
        st.seen = Array.isArray(st.seen) ? st.seen.filter((k) => okInt(k, 1, maxK)) : [];
        const k0 = st.seen.length ? st.seen[st.seen.length - 1] : startK;
        const log = document.createElement("p");
        log.className = "lsx-fb";
        log.setAttribute("aria-live", "polite");
        const apply = async (k, ms) => {
          const ww = k * step;
          setHeader(ctx.L(item), p, ww);
          await ctx.tween(barMoves(p, ww), ms);
          ctx.expr(`${p}% ${ofWord()} ${lo(String(ww))} = ${hi(partOf(p, ww))}`);
          // The last six wholes tried: enough to compare, short enough to read.
          const rows = st.seen
            .slice(-6)
            .map((s) => `${s * step} → <b>${partOf(p, s * step)}</b>`)
            .join(" · ");
          log.innerHTML = ctx.L({
            en: `Same ${p}%, different wholes: ${rows || `${ww} → <b>${partOf(p, ww)}</b>`}`,
            es: `El mismo ${p}%, distintos totales: ${rows || `${ww} → <b>${partOf(p, ww)}</b>`}`,
          });
        };
        ctx.say({
          en: `What if the whole were a different number of ${unit.en}? Slide the whole. Watch the bar: does the shaded ${p}% move? Now watch the numbers under it.`,
          es: `¿Y si el total fuera otra cantidad de ${unit.es}? Mueve el total. Mira la barra: ¿se mueve el ${p}% sombreado? Ahora mira los números de abajo.`,
        });
        const rng = ctx.range({
          label: { en: `The whole (${unit.en})`, es: `El total (${unit.es})` },
          min: 1,
          max: maxK,
          value: k0,
          onInput: async (k) => {
            out.textContent = String(k * step);
            if (!st.seen.includes(k)) st.seen.push(k);
            ctx.save();
            await apply(k, 250);
            if (st.seen.length >= 3) {
              ctx.feedback({
                en: `The shaded part of the bar never moved — it is always ${p} of 100. Only the whole changed, so the part changed with it.`,
                es: `La parte sombreada de la barra nunca se movió: siempre es ${p} de 100. Solo cambió el total, y por eso cambió la parte.`,
              });
              ctx.unlock();
            }
          },
        });
        const out = /** @type {HTMLOutputElement} */ (rng.querySelector("output"));
        out.textContent = String(k0 * step);
        ctx.panel.append(rng, log);
        await apply(k0, 500);
        if (st.seen.length < 3)
          ctx.feedback(
            {
              en: "Try at least three different wholes.",
              es: "Prueba al menos tres totales diferentes.",
            },
            "cue",
          );
        else ctx.unlock();
      },
    },
    {
      id: "fdp",
      label: { en: "Fraction, decimal, percent", es: "Fracción, decimal, porcentaje" },
      async enter(ctx) {
        onCell = null;
        shade(p);
        setHeader(ctx.L(item), p, w);
        const chain = [f.fraction, f.simplified, f.decimal, f.percent].filter(Boolean).join(" = ");
        const sum = `${f.decimal} × ${w} = ${part} ${ctx.L(unit)}`;
        let asGrid = false;
        const paint = async (ms) => {
          if (asGrid) {
            setSide(
              ctx.L({ en: `${p} of 100 cells`, es: `${p} de 100 celdas` }),
              `= ${[f.fraction, f.simplified].filter(Boolean).join(" = ")}`,
              `= ${f.decimal}`,
              `= ${f.percent}`,
            );
            await ctx.tween(gridMoves(), ms);
            for (const c of cast.cells) c.setAttribute("stroke-width", "1");
            shade(p);
          } else {
            await ctx.tween(barMoves(p, w, sum), ms);
            cast.pctCallout.textContent = chain;
            cast.pctCallout.setAttribute("x", String(clampX(BX + p * BU, chain)));
          }
          toggle.textContent = ctx.L(
            asGrid
              ? { en: "See it as the bar", es: "Mírala como barra" }
              : { en: "See it as the grid", es: "Mírala como cuadrícula" },
          );
        };
        const toggle = ctx.button({
          label: { en: "See it as the grid", es: "Mírala como cuadrícula" },
          onClick: () => {
            asGrid = !asGrid;
            paint(700);
          },
        });
        const row = document.createElement("div");
        row.className = "lsx-choices";
        row.appendChild(toggle);
        ctx.panel.appendChild(row);
        ctx.expr(`${hi(chain)} &nbsp;→&nbsp; ${escHtml(sum)}`);
        ctx.say({
          en: `The shaded cells are ${p} out of 100. Written as a fraction that is ${f.fraction}${f.simplified ? ` (or ${f.simplified})` : ""}; as a decimal, ${f.decimal}; as a percent, ${p}%. Three names, one amount. Multiply that amount by the whole: ${f.decimal} × ${w} = ${part}.`,
          es: `Las celdas sombreadas son ${p} de 100. Como fracción es ${f.fraction}${f.simplified ? ` (o ${f.simplified})` : ""}; como decimal, ${f.decimal}; como porcentaje, ${p}%. Tres nombres, una misma cantidad. Multiplica esa cantidad por el total: ${f.decimal} × ${w} = ${part}.`,
        });
        await paint(500);
      },
    },
    {
      id: "transfer",
      label: { en: "On your own", es: "Por tu cuenta" },
      async enter(ctx, saved) {
        onCell = null;
        const { p: tp, w: tw, item: tItem } = v.transfer;
        const tPart = partOf(tp, tw);
        shade(tp);
        setHeader(ctx.L(tItem), tp, tw);
        await ctx.tween(barMoves(tp, tw, saved.solved ? undefined : "?"), 600);
        ctx.expr(`${tp}% ${ofWord()} ${tw} = ${saved.solved ? hi(tPart) : "?"}`);
        ctx.say({
          en: `A new problem: ${tItem.en}, ${tp}% of ${tw} ${unit.en}. Use the bar and the line to find the part.`,
          es: `Un problema nuevo: ${tItem.es}, el ${tp}% de ${tw} ${unit.es}. Usa la barra y la recta para hallar la parte.`,
        });
        const options = choiceList(ctx, tp, tw, tp * 3 + tw, true);
        ctx.panel.appendChild(
          ctx.choices({
            question: {
              en: `${tp}% of ${tw} ${unit.en} is…`,
              es: `El ${tp}% de ${tw} ${unit.es} es…`,
            },
            options,
            restore: saved.solved ? options.findIndex((o) => o.correct) : null,
            onMiss: (_i, opt) => ctx.feedback(opt.cue, "cue"),
            onCorrect: async () => {
              ctx.state.solved = true;
              ctx.save();
              await ctx.tween(barMoves(tp, tw), 400);
              ctx.expr(`${tp}% ${ofWord()} ${tw} = ${hi(tPart)}`);
              ctx.feedback({
                en: `Right: ${fdp(tp).decimal} × ${tw} = ${tPart} ${unit.en}.`,
                es: `Correcto: ${fdp(tp).decimal} × ${tw} = ${tPart} ${unit.es}.`,
              });
            },
          }),
        );
        ctx.panel.appendChild(
          ctx.frame({
            label: {
              en: `Explain: ${p}% of ${w} and ${p}% of ${w * 2} are different amounts. Why, if the percent is the same?`,
              es: `Explica: el ${p}% de ${w} y el ${p}% de ${w * 2} son cantidades distintas. ¿Por qué, si el porcentaje es el mismo?`,
            },
            frame: {
              en: "The percent stays the same, but ___ changes, so ___.",
              es: "El porcentaje es el mismo, pero ___ cambia, así que ___.",
            },
          }),
        );
      },
    },
  ];

  return {
    kicker: { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" },
    title: { en: `${p}% of ${w}`, es: `El ${p}% de ${w}` },
    viewBox: `0 0 ${SW} ${SH}`,
    ariaLabel: {
      en: `A 10 by 10 grid standing for ${w} ${unit.en}. ${p} cells are shaded, then the cells line up into a percent bar over a number line from 0 to ${w}, where ${p}% lines up with ${part}.`,
      es: `Una cuadrícula de 10 por 10 que representa ${w} ${unit.es}. Se sombrean ${p} celdas y luego las celdas forman una barra de porcentaje sobre una recta numérica de 0 a ${w}, donde el ${p}% coincide con ${part}.`,
    },
    printSummary: {
      en: `${p}% means ${p} out of 100. On a 100-cell grid that stands for ${w} ${unit.en}, ${p} cells are shaded. ${p}% = ${f.fraction} = ${f.decimal}, so ${p}% of ${w} = ${f.decimal} × ${w} = ${part} ${unit.en}. With a different whole, the same ${p}% is a different part.`,
      es: `${p}% significa ${p} de cada 100. En una cuadrícula de 100 celdas que representa ${w} ${unit.es}, se sombrean ${p} celdas. ${p}% = ${f.fraction} = ${f.decimal}, así que el ${p}% de ${w} = ${f.decimal} × ${w} = ${part} ${unit.es}. Con otro total, el mismo ${p}% es otra parte.`,
    },
    setup(ctx) {
      ctxLang = ctx.lang;
      cur = (pair) => ctx.L(pair);
      setup(ctx);
    },
    scenes,
  };
}
