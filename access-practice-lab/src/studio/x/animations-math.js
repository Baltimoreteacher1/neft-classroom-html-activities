// The two number presets: ratio-change and geometry-dims. Every quantity is exact rational arithmetic (core/math.js),
// so a frame is recomputed from the teacher's numbers and can never drift from them. Input that is not a positive
// number is refused in plain words; nothing is rounded to make a figure fit.

import { parseNumber, rat, ratCmp, ratMul, ratToNumber } from "../core/math.js";
import { COLOR, f1, line, patternDefs, patternFill, text } from "./diagram-kit.js";
import {
  AN_TINT,
  anBoth,
  anDiagram,
  anFail,
  anLines,
  anNum,
  anPick,
  anPlain,
  anRect,
  anSafe,
  anScene,
  anStep,
  anWrap,
} from "./animations-kit.js";

const AN_ZERO = rat(0n);
const AN_BIG = 1e9;

/** A positive number typed as 2, 0.5, 3/4 or 2 1/2, as an exact rational. `en`/`es` name it in the message. */
function anPositive(v, en, es) {
  const r = v === null || v === undefined ? null : parseNumber(String(v));
  if (!r || ratCmp(r, AN_ZERO) <= 0)
    anFail(
      "not-positive",
      `${en} must be a number greater than 0.`,
      `${es} debe ser un número mayor que 0.`,
    );
  return r;
}

// ── ratio-change: a ratio table and two bars that scale together ─────────────

const AN_TOP = 150;
const AN_HEAD = 46;
const AN_ROW = 28;
const AN_COLS = [16, 116, 290, 464];

function anRatioSvg(steps, k, names, scale, { lang, id, alt, desc }) {
  const p = anSafe(id);
  const now = steps[k];
  const bar = (r) => Math.max(3, (ratToNumber(r) / scale) * 300);
  const body = [];
  [
    [now.a, names[0], 38, 0],
    [now.b, names[1], 102, 1],
  ].forEach(([value, name, y, i]) => {
    const len = bar(value);
    body.push(
      text(20, y - 8, name, { size: 17, weight: "700" }),
      `<rect x="20" y="${y}" width="${f1(len)}" height="26" fill="${patternFill(p, i === 0 ? 0 : 1)}" stroke="${COLOR.ink}" stroke-width="2"/>`,
      text(20 + len + 8, y + 19, anNum(value, lang), { size: 17, weight: "700" }),
    );
  });
  const head = [anPick(lang, "Multiplier", "Multiplicador"), names[0], names[1]];
  body.push(
    anRect(AN_COLS[0], AN_TOP, AN_COLS[3] - AN_COLS[0], AN_HEAD, { fill: "#e5e7eb", rx: 0 }),
  );
  head.forEach((t, c) =>
    body.push(
      anLines(AN_COLS[c] + 8, AN_TOP + 5, anWrap(t, c ? 18 : 12), {
        size: 15,
        lh: 18,
        weight: "700",
      }).svg,
    ),
  );
  steps.slice(0, k + 1).forEach((s, i) => {
    const y = AN_TOP + AN_HEAD + i * AN_ROW;
    const on = i === k;
    body.push(
      anRect(AN_COLS[0], y, AN_COLS[3] - AN_COLS[0], AN_ROW, {
        fill: on ? AN_TINT : COLOR.white,
        stroke: on ? COLOR.blue : COLOR.ink,
        sw: on ? 3 : 1.5,
        rx: 0,
      }),
    );
    [
      anPick(
        lang,
        i === 0 ? "Start" : `× ${anNum(s.k, lang)}`,
        i === 0 ? "Inicio" : `× ${anNum(s.k, lang)}`,
      ),
      anNum(s.a, lang),
      anNum(s.b, lang),
    ].forEach((t, c) =>
      body.push(text(AN_COLS[c] + 8, y + 20, t, { size: 16, weight: on ? "700" : "400" })),
    );
  });
  for (const x of AN_COLS.slice(1, 3))
    body.push(line(x, AN_TOP, x, AN_TOP + AN_HEAD + (k + 1) * AN_ROW, { width: 1.5 }));
  return anScene({
    id,
    h: AN_TOP + AN_HEAD + steps.length * AN_ROW + 14,
    alt,
    desc,
    lang,
    body: body.join(""),
    defs: patternDefs(p),
  });
}

export function anRatio(p) {
  const names = [anPlain(p.a?.label), anPlain(p.b?.label)];
  if (!names[0] || !names[1])
    anFail(
      "empty-text",
      "Name both quantities (for example cups of flour).",
      "Nombre las dos cantidades (por ejemplo, tazas de harina).",
    );
  const a0 = anPositive(
    p.a?.value,
    `The first number (${names[0]})`,
    `El primer número (${names[0]})`,
  );
  const b0 = anPositive(
    p.b?.value,
    `The second number (${names[1]})`,
    `El segundo número (${names[1]})`,
  );
  if (!Array.isArray(p.scales) || p.scales.length < 1)
    anFail("too-few", "Add at least one multiplier.", "Agregue al menos un multiplicador.");
  const steps = [{ k: rat(1n), a: a0, b: b0 }];
  p.scales.forEach((v, i) => {
    const k = anPositive(v, `Multiplier ${i + 1}`, `El multiplicador ${i + 1}`);
    steps.push({ k, a: ratMul(a0, k), b: ratMul(b0, k) });
  });
  const values = steps.flatMap((s) => [ratToNumber(s.a), ratToNumber(s.b)]);
  if (Math.max(...values) > AN_BIG)
    anFail(
      "too-big",
      "A number gets too large. Use smaller multipliers.",
      "Un número se hace demasiado grande. Use multiplicadores menores.",
    );
  if (Math.max(...values) / Math.min(...values) > 1000)
    anFail(
      "too-uneven",
      "The numbers are too far apart to draw as bars. Use closer numbers.",
      "Los números están demasiado separados para dibujarlos como barras. Use números más cercanos.",
    );
  const scale = Math.max(...values);
  const n = steps.length;
  return {
    frames: steps.map((s, k) => {
      const caption = anBoth((l) => {
        const pair = `${names[0]} = ${anNum(s.a, l)} ${anPick(l, "and", "y")} ${names[1]} = ${anNum(s.b, l)}`;
        return k === 0
          ? `${anPick(l, "Start with", "Empieza con")} ${pair}.`
          : `${anPick(l, "Multiply both quantities by", "Multiplica las dos cantidades por")} ${anNum(s.k, l)}: ${pair}.`;
      });
      return {
        caption,
        draw: (lang, id) => ({
          svg: anRatioSvg(steps, k, names, scale, {
            lang,
            id,
            alt: caption[lang],
            desc: anStep(lang, k + 1, n),
          }),
          alt: caption[lang],
        }),
      };
    }),
    table: (lang) => ({
      headers: [anPick(lang, "Multiplier", "Multiplicador"), names[0], names[1]],
      rows: steps.map((s, i) => [
        i === 0 ? "× 1" : `× ${anNum(s.k, lang)}`,
        anNum(s.a, lang),
        anNum(s.b, lang),
      ]),
    }),
  };
}

// ── geometry-dims: a prism or a fraction model through chosen values ─────────

const AN_DIM = [
  ["l", "length", "largo"],
  ["w", "width", "ancho"],
  ["h", "height", "alto"],
];

function anPrism(p) {
  if (!Array.isArray(p.dims) || p.dims.length < 2)
    anFail(
      "too-few",
      "Add at least two sets of measurements.",
      "Agregue al menos dos juegos de medidas.",
    );
  const unit = anPlain(p.unit);
  const sets = p.dims.map((d, i) => {
    const r = {};
    for (const [key, en, es] of AN_DIM)
      r[key] = anPositive(d?.[key], `Set ${i + 1}: the ${en}`, `Juego ${i + 1}: el ${es}`);
    const volume = ratMul(ratMul(r.l, r.w), r.h);
    if (ratToNumber(volume) > 1e12)
      anFail(
        "too-big",
        "A volume gets too large. Use smaller measurements.",
        "Un volumen se hace demasiado grande. Use medidas menores.",
      );
    return { ...r, volume, raw: d };
  });
  const cubic = (l) => (unit ? `${unit}³` : anPick(l, "cubic units", "unidades cúbicas"));
  return {
    frames: sets.map((s, i) => {
      const caption = anBoth((l) => {
        const u = unit ? ` ${unit}` : "";
        const was = i
          ? AN_DIM.filter(([k]) => ratCmp(s[k], sets[i - 1][k]) !== 0).map(
              ([k, en, es]) =>
                `${anPick(l, en, es)} ${anNum(sets[i - 1][k], l)} → ${anNum(s[k], l)}`,
            )
          : [];
        const said = AN_DIM.map(([k, en, es]) => `${anPick(l, en, es)} ${anNum(s[k], l)}${u}`).join(", ");
        const dims = said.charAt(0).toUpperCase() + said.slice(1);
        const sum = `${anNum(s.l, l)} × ${anNum(s.w, l)} × ${anNum(s.h, l)} = ${anNum(s.volume, l)} ${cubic(l)}`;
        return `${was.length ? `${anPick(l, "Changed", "Cambió")}: ${was.join(", ")}. ` : ""}${dims}. ${anPick(l, "Volume", "Volumen")} = ${sum}.`;
      });
      return {
        caption,
        draw: (lang, id) => {
          const d = anDiagram(
            { kind: "prism", l: s.raw.l, w: s.raw.w, h: s.raw.h, unit },
            lang,
            id,
          );
          return { svg: d.svg, alt: caption[lang] };
        },
      };
    }),
    table: (lang) => ({
      headers: [
        anPick(lang, "Step", "Paso"),
        ...AN_DIM.map(([, en, es]) =>
          anPick(lang, en[0].toUpperCase() + en.slice(1), es[0].toUpperCase() + es.slice(1)),
        ),
        anPick(lang, "Volume", "Volumen"),
      ],
      rows: sets.map((s, i) => [
        String(i + 1),
        ...AN_DIM.map(([k]) => `${anNum(s[k], lang)}${unit ? ` ${unit}` : ""}`),
        `${anNum(s.volume, lang)} ${cubic(lang)}`,
      ]),
    }),
  };
}

function anFractions(p) {
  const d = p.denominator;
  if (!Number.isInteger(d) || d < 1 || d > 16)
    anFail(
      "bad-denominator",
      "The denominator must be a whole number from 1 to 16.",
      "El denominador debe ser un número entero del 1 al 16.",
    );
  if (!Array.isArray(p.numerators) || p.numerators.length < 2)
    anFail("too-few", "Add at least two numerators.", "Agregue al menos dos numeradores.");
  p.numerators.forEach((x, i) => {
    if (!Number.isInteger(x) || x < 0 || x > d * 4)
      anFail(
        "bad-numerator",
        `Numerator ${i + 1} must be a whole number from 0 to ${d * 4}.`,
        `El numerador ${i + 1} debe ser un número entero del 0 al ${d * 4}.`,
      );
  });
  const whole = (x, l) => {
    if (x <= d) return "";
    const w = Math.floor(x / d);
    const rest = x % d;
    return ` ${anPick(l, "That is", "Eso es")} ${rest ? `${w} ${rest}/${d}` : w} ${anPick(l, "wholes", "enteros")}.`;
  };
  return {
    frames: p.numerators.map((x) => {
      const caption = anBoth(
        (l) =>
          `${x}/${d} ${anPick(l, "of a whole", "de un entero")}: ${x} ${anPick(l, "of", "de")} ${d} ${anPick(l, "equal parts are shaded", "partes iguales están sombreadas")}.${whole(x, l)}`,
      );
      return {
        caption,
        draw: (lang, id) => {
          const g = anDiagram(
            { kind: "fraction", numerator: x, denominator: d, style: "bar" },
            lang,
            id,
          );
          return { svg: g.svg, alt: caption[lang] };
        },
      };
    }),
    table: (lang) => ({
      headers: anPick(
        lang,
        ["Step", "Shaded parts", "Equal parts", "Fraction of a whole"],
        ["Paso", "Partes sombreadas", "Partes iguales", "Fracción de un entero"],
      ),
      rows: p.numerators.map((x, i) => [String(i + 1), String(x), String(d), `${x}/${d}`]),
    }),
  };
}

export function anGeometry(p) {
  return p.shape === "fraction" ? anFractions(p) : anPrism(p);
}
