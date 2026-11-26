// living/partial-quotients-model.js — the mathematics of the partial-quotients play
// (2-6 Divide Multi-Digit Numbers, 2-7 Divide Decimals).
//
// Pure functions only (no DOM). Division is exact and done on whole numbers:
// for decimals both numbers are first scaled by the same power of ten so the
// divisor is whole (18.9 ÷ 6.3 -> 189 ÷ 63). A "chunk" is a place-value piece of
// the quotient (100 groups of 12 = 1,200); the long-division digits ARE those
// chunks, one place at a time. Helpers shared with the other decimals plays come
// from place-value-blocks-model.js.

import { dpOf, fmt, near, okInt, placeCorrect } from "./place-value-blocks-model.js";

export { placeCorrect };

const POWERS = [
  { en: "ones", es: "unidades" },
  { en: "tens", es: "decenas" },
  { en: "hundreds", es: "centenas" },
  { en: "thousands", es: "millares" },
  { en: "ten thousands", es: "decenas de millar" },
];

/** The quotient's non-zero digits as chunks: 112 -> 100, 10, 2 groups. */
export function chunksOf(D, d) {
  const q = D / d;
  const s = String(q);
  const out = [];
  let left = D;
  s.split("").forEach((ch, i) => {
    const digit = Number(ch);
    if (!digit) return;
    const place = s.length - 1 - i;
    const groups = digit * 10 ** place;
    const take = groups * d;
    left -= take;
    out.push({ digit, place, groups, take, left });
  });
  return out;
}

/** Standard long division of whole numbers: every round's numbers. */
export function longDivision(D, d) {
  const s = String(D);
  let e = 0;
  let work = Number(s[0]);
  while (work < d && e < s.length - 1) {
    e++;
    work = work * 10 + Number(s[e]);
  }
  const start = e;
  const rounds = [];
  for (;;) {
    const q = Math.floor(work / d);
    const prod = q * d;
    const rem = work - prod;
    const bring = s[e + 1] == null ? null : Number(s[e + 1]);
    rounds.push({ end: e, work, q, prod, rem, bring, place: s.length - 1 - e });
    if (bring == null) break;
    work = rem * 10 + bring;
    e++;
  }
  return {
    digits: s,
    start,
    rounds,
    quotient: rounds.map((r) => r.q).join(""),
    remainder: rounds[rounds.length - 1].rem,
  };
}

/** The tape: where each chunk (or each group, for a small quotient) sits, as fractions of D. */
export function tapeParts(D, d, chunks) {
  const q = D / d;
  if (q <= 12) {
    // Every group is its own piece: q equal pieces of one divisor each.
    let at = 0;
    return chunks.flatMap((c) =>
      Array.from({ length: c.groups }, () => {
        const part = { from: at / D, size: d / D, chunk: c };
        at += d;
        return part;
      }),
    );
  }
  let at = 0;
  return chunks.map((c) => {
    const part = { from: at / D, size: c.take / D, chunk: c };
    at += c.take;
    return part;
  });
}

/** The chunk sizes a student may take for a quotient q: 100, 10, 1 for q = 112. */
export const chunkSizes = (q) =>
  Array.from({ length: String(q).length }, (_, i) => 10 ** (String(q).length - 1 - i));

/** Restore saved takes: only known sizes, only while they fit, at most `max`. */
export function replayTaken(saved, sizes, D, d, max) {
  const out = [];
  if (!Array.isArray(saved) || saved.length > max) return out;
  let left = D;
  for (const g of saved) {
    if (sizes.includes(g) && g * d <= left) {
      out.push(g);
      left -= g * d;
    }
  }
  return out;
}

/** Marker x positions for chunk spans [from, to] (fractions of the bar): a dot apart, inside the bar. */
export function markerXs(spans, x0, bw, gap = 27, edge = 11) {
  const xs = spans.map(([a, b]) => x0 + ((a + b) / 2) * bw);
  for (let k = 1; k < xs.length; k++) xs[k] = Math.max(xs[k], xs[k - 1] + gap);
  if (xs.length) xs[xs.length - 1] = Math.min(xs[xs.length - 1], x0 + bw - edge);
  for (let k = xs.length - 2; k >= 0; k--) xs[k] = Math.min(xs[k], xs[k + 1] - gap);
  return xs;
}

/** D and d with both decimal points slid s places right, as display text (18.9, 6.3 -> 189, 63). */
export function scaledPair(p, s) {
  const f = (x) => fmt(String(Math.round(x * 10 ** s * 100) / 100));
  return { D: f(p.D), d: f(p.d) };
}

/** Powers-of-ten windows for "about how many d fit in D": the right one and two slips. */
export function windowChoices(D, d) {
  const q = D / d;
  const m0 = String(q).length - 1;
  const ms = [m0, m0 + 1, m0 - 1, m0 + 2].filter((m) => m >= 0).slice(0, 3);
  const out = ms.map((m) => ({ m, lo: 10 ** m, hi: 10 ** (m + 1), correct: m === m0 }));
  return out.length === 3 ? out : null;
}

/** Slide-both-points choices for the decimal predict: the quotient is unchanged. */
export function slideChoices(q) {
  return [
    { kind: "same", value: q, correct: true },
    { kind: "big", value: q * 10 },
    { kind: "small", value: Math.round(q * 100) / 1000 },
  ];
}

/** Wrong whole-number quotients a student actually writes, each named. */
export function quotientChoices(D, d) {
  const q = D / d;
  const s = String(q);
  const cands = [];
  if (s.includes("0")) cands.push({ kind: "dropZero", value: Number(s.replace(/0/g, "")) });
  if (s.length >= 2 && s.at(-1) !== s.at(-2))
    cands.push({ kind: "swap", value: Number(s.slice(0, -2) + s.at(-1) + s.at(-2)) });
  if (!s.includes("0") && s.length >= 2)
    cands.push({ kind: "insertZero", value: Number(`${s[0]}0${s.slice(1)}`) });
  cands.push({ kind: "tenTimes", value: q * 10 }, { kind: "first", value: Number(s[0]) });
  const out = [{ kind: "quotient", value: q, correct: true }];
  for (const c of cands)
    if (out.length < 4 && c.value >= 1 && !out.some((o) => o.value === c.value)) out.push(c);
  return out.length === 4 ? out : null;
}

/** Equivalent-division choices: slide both by k places, or one of three slips. */
export function equivalentChoices(p) {
  const f = (x) => fmt(String(Math.round(x * 100000) / 100000));
  const label = (a, b) => `${f(a)} ÷ ${f(b)}`;
  const right = { kind: "both", D: p.Ds, d: p.ds, correct: true };
  const slips = [
    { kind: "divisor", D: p.D, d: p.ds },
    { kind: "dividend", D: p.Ds, d: p.d },
    { kind: "extra", D: p.Ds * 10, d: p.ds },
  ];
  const out = [right];
  for (const s of slips) if (!out.some((o) => label(o.D, o.d) === label(s.D, s.d))) out.push(s);
  return out.map((o) => ({ ...o, text: label(o.D, o.d) }));
}

function problem(p, mode) {
  if (!p) return null;
  const D = Number(p.dividend);
  const d = Number(p.divisor);
  if (!Number.isFinite(D) || !Number.isFinite(d)) return null;
  let k = 0;
  if (mode === "decimal") {
    k = dpOf(d);
    if (!okInt(k, 1, 2) || dpOf(D) > k) return null;
  } else if (!Number.isInteger(D) || !Number.isInteger(d)) return null;
  const Ds = Math.round(D * 10 ** k);
  const ds = Math.round(d * 10 ** k);
  if (!okInt(Ds, 10, 99999) || !okInt(ds, 2, 999) || Ds % ds !== 0) return null;
  if (mode === "decimal" && (D <= 0 || d <= 0)) return null;
  const q = Ds / ds;
  if (!okInt(q, 2, 9999) || !near(q * d, D)) return null;
  const ld = longDivision(Ds, ds);
  if (ld.remainder !== 0 || ld.quotient !== String(q) || ld.rounds.length > 4) return null;
  const chunks = chunksOf(Ds, ds);
  return { D, d, k, Ds, ds, q, ld, chunks, units: q <= 12 };
}

const textOf = (s) =>
  s && typeof s.en === "string" && s.en.trim()
    ? { en: s.en.slice(0, 300), es: String(s.es || s.en).slice(0, 300) }
    : null;

/**
 * { mode: "whole"|"decimal", dividend, divisor, story?, transfer:{dividend, divisor} }
 * Everything must divide exactly (remainder 0). Whole mode: integers, quotient 10+
 * so chunks are worth cutting. Decimal mode: divisor with 1-2 decimals, dividend
 * with no more, scaled quotient a whole number of groups (at most 12 to draw).
 */
export function validatePartialQuotients(cfg) {
  const mode = cfg?.mode === "whole" || cfg?.mode === "decimal" ? cfg.mode : null;
  if (!mode) return null;
  const main = problem(cfg, mode);
  const tr = problem(cfg.transfer, mode);
  if (!main || !tr) return null;
  if (mode === "whole" && (main.q < 10 || tr.q < 10)) return null;
  if (mode === "decimal" && (main.q > 12 || tr.q > 12)) return null;
  if (main.D === tr.D && main.d === tr.d) return null;
  if (mode === "whole" && (!windowChoices(main.Ds, main.ds) || !quotientChoices(tr.Ds, tr.ds)))
    return null;
  return { mode, main, tr, story: textOf(cfg.story) };
}

const fx = (x) => fmt(String(x));
const ph = (p) => POWERS[p] || POWERS[0];

/** Every sentence the play says, as {en, es} pairs, from the validated config. */
export function partialQuotientsCopy(v) {
  const { main: m, tr, mode } = v;
  const whole = mode === "whole";
  const Dt = fx(m.D);
  const dt = fx(m.d);
  const Dst = fx(m.Ds);
  const dst = fx(m.ds);
  const eq = (D, d, q) => `${fx(D)} ÷ ${fx(d)} = ${fx(q)}`;
  const chunkSum = (p) => p.chunks.map((c) => c.groups).join(" + ");
  const chunkLine = (p, c) => `${fx(c.groups)} × ${fx(p.ds)} = ${fx(c.take)}`;
  const skipped = (p) => {
    const s = p.ld.digits;
    const pre = Array.from({ length: p.ld.start }, (_, i) => s.slice(0, i + 1));
    return pre.length ? pre.map(fx).join(" or ") : null;
  };
  const roundSay = (p, r) => {
    const ld = p.ld;
    const ri = ld.rounds[r];
    const first = r === 0;
    const sk = skipped(p);
    const chunk = p.chunks.find((c) => c.place === ri.place);
    const digit = ld.digits[ri.end];
    const nxt = ri.bring == null ? null : ri.rem * 10 + ri.bring;
    const en = [
      first && sk
        ? `${fx(p.ds)} does not fit into ${sk}, so work with ${fx(ri.work)}.`
        : `Work with ${fx(ri.work)}.`,
      ri.q
        ? `Divide: ${fx(ri.work)} ÷ ${fx(p.ds)} → ${ri.q}, written above the ${digit}.`
        : `Divide: ${fx(p.ds)} does not fit into ${fx(ri.work)}, so write 0 above the ${digit}.`,
      `Multiply: ${ri.q} × ${fx(p.ds)} = ${fx(ri.prod)}.`,
      `Subtract: ${fx(ri.work)} − ${fx(ri.prod)} = ${fx(ri.rem)}.`,
      nxt == null ? "Nothing is left to bring down." : `Bring down ${ri.bring}: ${fx(nxt)}.`,
      chunk
        ? `That ${ri.q} sits in the ${ph(ri.place).en} place: ${chunkLine(p, chunk)}, one chunk of the tape.`
        : `No chunk this time: no ${ph(ri.place).en}-sized group of ${fx(p.ds)} fits.`,
    ];
    const es = [
      first && sk
        ? `${fx(p.ds)} no cabe en ${sk}, así que trabaja con ${fx(ri.work)}.`
        : `Trabaja con ${fx(ri.work)}.`,
      ri.q
        ? `Divide: ${fx(ri.work)} ÷ ${fx(p.ds)} → ${ri.q}, escrito arriba del ${digit}.`
        : `Divide: ${fx(p.ds)} no cabe en ${fx(ri.work)}, así que escribe 0 arriba del ${digit}.`,
      `Multiplica: ${ri.q} × ${fx(p.ds)} = ${fx(ri.prod)}.`,
      `Resta: ${fx(ri.work)} − ${fx(ri.prod)} = ${fx(ri.rem)}.`,
      nxt == null ? "No queda nada por bajar." : `Baja el ${ri.bring}: ${fx(nxt)}.`,
      chunk
        ? `Ese ${ri.q} está en las ${ph(ri.place).es}: ${chunkLine(p, chunk)}, un trozo de la cinta.`
        : `Esta vez no hay trozo: no cabe ningún grupo de ${fx(p.ds)} de ese tamaño.`,
    ];
    return { en: en.join(" "), es: es.join(" ") };
  };
  const checkLine = (p) =>
    whole ? `${fx(p.ds)} × ${fx(p.q)} = ${fx(p.Ds)}` : `${fx(p.d)} × ${fx(p.q)} = ${fx(p.D)}`;
  const winLabel = (w) => `${fx(w.lo)} – ${fx(w.hi)}`;
  const quotCue = (p, opt) => {
    const check = `${fx(p.ds)} × ${fx(opt.value)} = ${fx(p.ds * opt.value)}`;
    const lead = {
      dropZero: {
        en: `A 0 is missing: when ${fx(p.ds)} does not fit into a digit, a 0 holds that place in the quotient.`,
        es: `Falta un 0: cuando ${fx(p.ds)} no cabe en un dígito, un 0 guarda ese lugar en el cociente.`,
      },
      swap: {
        en: "Check the place of each digit in the quotient: each one sits above a digit of the dividend.",
        es: "Revisa el lugar de cada dígito del cociente: cada uno va arriba de un dígito del dividendo.",
      },
      insertZero: {
        en: `A 0 only goes in the quotient when ${fx(p.ds)} does not fit into a working number.`,
        es: `Un 0 solo va en el cociente cuando ${fx(p.ds)} no cabe en un número de trabajo.`,
      },
      tenTimes: {
        en: "This quotient has one digit too many.",
        es: "Este cociente tiene un dígito de más.",
      },
      first: {
        en: "Long division keeps going after the first digit: bring down and repeat.",
        es: "La división larga sigue después del primer dígito: baja y repite.",
      },
    }[opt.kind];
    return {
      en: `${lead.en} Multiply to check: ${check}. Does that match ${fx(p.Ds)}?`,
      es: `${lead.es} Multiplica para comprobar: ${check}. ¿Coincide con ${fx(p.Ds)}?`,
    };
  };
  const slideCue = (opt) =>
    ({
      big: {
        en: `Both ${Dt} and ${dt} get 10 times as long. Picture the tape: the bar AND each chunk grow. Does the bar now hold 10 times as many chunks?`,
        es: `Tanto ${Dt} como ${dt} se hacen 10 veces más largos. Imagina la cinta: la barra Y cada trozo crecen. ¿La barra ahora tiene 10 veces más trozos?`,
      },
      small: {
        en: `The chunk gets 10 times as long, but so does the whole bar. Did the chunk grow more than the bar did?`,
        es: `El trozo se hace 10 veces más largo, pero la barra completa también. ¿El trozo creció más que la barra?`,
      },
    })[opt.kind];
  const equivCue = (p, opt) =>
    ({
      divisor: {
        en: `${opt.text}: only the divisor slid. The bar stayed ${fx(p.D)} long while each chunk grew. Do both numbers need to slide the same number of places?`,
        es: `${opt.text}: solo se deslizó el divisor. La barra se quedó en ${fx(p.D)} mientras cada trozo creció. ¿Los dos números deben deslizarse la misma cantidad de lugares?`,
      },
      dividend: {
        en: `${opt.text}: only the dividend slid. The bar grew but each chunk stayed ${fx(p.d)}. Do both numbers need to slide the same number of places?`,
        es: `${opt.text}: solo se deslizó el dividendo. La barra creció pero cada trozo se quedó en ${fx(p.d)}. ¿Los dos números deben deslizarse la misma cantidad de lugares?`,
      },
      extra: {
        en: `${opt.text}: the dividend slid ${p.k + 1} places but the divisor only ${p.k}. Count the places each number slid.`,
        es: `${opt.text}: el dividendo se deslizó ${p.k + 1} lugares pero el divisor solo ${p.k}. Cuenta los lugares que se deslizó cada número.`,
      },
    })[opt.kind];
  const windowCue = (opt) =>
    opt.m < String(m.q).length - 1
      ? {
          en: `${fx(opt.hi)} groups of ${fx(m.ds)} make ${fx(opt.hi * m.ds)}, and ${Dst} holds at least that much. Can the answer be that small?`,
          es: `${fx(opt.hi)} grupos de ${fx(m.ds)} son ${fx(opt.hi * m.ds)}, y ${Dst} tiene al menos eso. ¿Puede la respuesta ser tan pequeña?`,
        }
      : {
          en: `${fx(opt.lo)} groups of ${fx(m.ds)} would make ${fx(opt.lo * m.ds)}, more than ${Dst}. Can that many fit?`,
          es: `${fx(opt.lo)} grupos de ${fx(m.ds)} serían ${fx(opt.lo * m.ds)}, más que ${Dst}. ¿Caben tantos?`,
        };
  const m0 = String(m.q).length - 1;
  const scaledTxt = (s) =>
    `${fx(Math.round(m.D * 10 ** s * 100) / 100)} ÷ ${fx(Math.round(m.d * 10 ** s * 100) / 100)}`;
  return {
    mode,
    kicker: { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" },
    title: whole
      ? { en: "Chunks and long division", es: "Trozos y división larga" }
      : { en: "Slide both points", es: "Desliza los dos puntos" },
    ariaLabel: whole
      ? {
          en: `A tape of ${Dt} cut into chunks of groups of ${dt}: ${chunkSum(m)} groups. The long-division digits above the bar are the same chunks, one place at a time.`,
          es: `Una cinta de ${Dt} cortada en trozos de grupos de ${dt}: ${chunkSum(m)} grupos. Los dígitos de la división larga sobre la barra son los mismos trozos, un lugar a la vez.`,
        }
      : {
          en: `A tape ${Dt} long cut into ${m.q} chunks each ${dt} long. Sliding both decimal points the same number of places changes the labels, ${scaledTxt(0)} and ${scaledTxt(m.k)}, but not the picture or the quotient ${m.q}.`,
          es: `Una cinta de ${Dt} de largo cortada en ${m.q} trozos de ${dt} cada uno. Deslizar los dos puntos decimales la misma cantidad de lugares cambia los rótulos, ${scaledTxt(0)} y ${scaledTxt(m.k)}, pero no el dibujo ni el cociente ${m.q}.`,
        },
    printSummary: whole
      ? {
          en: `${eq(m.D, m.d, m.q)}: take chunks of groups of ${dt} off ${Dt}: ${m.chunks.map((c) => chunkLine(m, c)).join("; ")}. The groups add up: ${chunkSum(m)} = ${fx(m.q)}. Long division writes the same chunks one place at a time. Check: ${checkLine(m)}.`,
          es: `${eq(m.D, m.d, m.q)}: quita trozos de grupos de ${dt} de ${Dt}: ${m.chunks.map((c) => chunkLine(m, c)).join("; ")}. Los grupos suman: ${chunkSum(m)} = ${fx(m.q)}. La división larga escribe los mismos trozos un lugar a la vez. Comprueba: ${checkLine(m)}.`,
        }
      : {
          en: `${eq(m.D, m.d, m.q)}: slide the point ${m.k} place right in both numbers, so the problem is ${eq(m.Ds, m.ds, m.q)}. The quotient does not change: the bar and each chunk grew by the same factor. Divide as whole numbers, then check: ${m.d} × ${m.q} = ${m.D}.`,
          es: `${eq(m.D, m.d, m.q)}: desliza el punto ${m.k} lugar a la derecha en los dos números, y el problema es ${eq(m.Ds, m.ds, m.q)}. El cociente no cambia: la barra y cada trozo crecieron por el mismo factor. Divide como enteros y comprueba: ${m.d} × ${m.q} = ${m.D}.`,
        },
    scene: {
      situate: { en: "The tape", es: "La cinta" },
      predict: { en: "Predict", es: "Predice" },
      chunk: whole
        ? { en: "Take chunks", es: "Quita trozos" }
        : { en: "Slide the points", es: "Desliza los puntos" },
      connect: { en: "Write it down", es: "Escríbelo" },
      transfer: { en: "On your own", es: "Por tu cuenta" },
    },
    story: v.story,
    labels: {
      left: (n) => ({ en: `Left: ${fx(n)}`, es: `Queda: ${fx(n)}` }),
      groups: (n) => ({ en: `Groups: ${fx(n)}`, es: `Grupos: ${fx(n)}` }),
      fits: (n) => ({ en: `${n} chunks fit`, es: `Caben ${n} trozos` }),
    },
    situateSay: whole
      ? {
          en: `${v.story ? `${v.story.en} ` : ""}The bar is ${Dt} long. A group is ${dt}. How many groups of ${dt} fit in ${Dt}? That number is also each share when ${Dt} is split equally ${dt} ways.`,
          es: `${v.story ? `${v.story.es} ` : ""}La barra mide ${Dt}. Un grupo es ${dt}. ¿Cuántos grupos de ${dt} caben en ${Dt}? Ese número también es cada parte cuando ${Dt} se reparte en partes iguales entre ${dt}.`,
        }
      : {
          en: `${v.story ? `${v.story.en} ` : ""}The bar is ${Dt} long and each chunk is ${dt} long. How many chunks of ${dt} fit in ${Dt}?`,
          es: `${v.story ? `${v.story.es} ` : ""}La barra mide ${Dt} y cada trozo mide ${dt}. ¿Cuántos trozos de ${dt} caben en ${Dt}?`,
        },
    situateExpr: `${Dt} ÷ ${dt}`,
    predictSay: whole
      ? {
          en: `Before dividing, estimate. About how many groups of ${dt} fit in ${Dt}?`,
          es: `Antes de dividir, estima. ¿Más o menos cuántos grupos de ${dt} caben en ${Dt}?`,
        }
      : {
          en: `Long division needs a whole-number divisor. Slide the point in ${dt} ${m.k} place${m.k > 1 ? "s" : ""} right to make ${dst}, and slide the point in ${Dt} the same ${m.k} place${m.k > 1 ? "s" : ""} to make ${Dst}.`,
          es: `La división larga necesita un divisor entero. Desliza el punto de ${dt} ${m.k} lugar${m.k > 1 ? "es" : ""} a la derecha para obtener ${dst}, y desliza el punto de ${Dt} los mismos ${m.k} lugar${m.k > 1 ? "es" : ""} para obtener ${Dst}.`,
        },
    predictQ: whole
      ? {
          en: `The number of groups of ${dt} in ${Dt} is between…`,
          es: `El número de grupos de ${dt} en ${Dt} está entre…`,
        }
      : {
          en: `${Dst} ÷ ${dst} compared with ${Dt} ÷ ${dt}, the quotient is…`,
          es: `Comparado con ${Dt} ÷ ${dt}, el cociente de ${Dst} ÷ ${dst} es…`,
        },
    winLabel: (w) => ({ en: winLabel(w), es: winLabel(w) }),
    windowCue,
    slideLabel: (o) => ({
      en: {
        same: `the same: ${o.value}`,
        big: `10 times as big: ${fx(o.value)}`,
        small: `10 times as small: ${o.value}`,
      }[o.kind],
      es: {
        same: `el mismo: ${o.value}`,
        big: `10 veces mayor: ${fx(o.value)}`,
        small: `10 veces menor: ${o.value}`,
      }[o.kind],
    }),
    slideCue,
    predictOk: whole
      ? {
          en: `Yes: ${fx(10 ** m0)} groups of ${dt} make ${fx(10 ** m0 * m.ds)}, which fits in ${Dt}, but ${fx(10 ** (m0 + 1))} groups would make ${fx(10 ** (m0 + 1) * m.ds)}, which does not. So the answer is between ${fx(10 ** m0)} and ${fx(10 ** (m0 + 1))}.`,
          es: `Sí: ${fx(10 ** m0)} grupos de ${dt} son ${fx(10 ** m0 * m.ds)}, que caben en ${Dt}, pero ${fx(10 ** (m0 + 1))} grupos serían ${fx(10 ** (m0 + 1) * m.ds)}, que no caben. Entonces la respuesta está entre ${fx(10 ** m0)} y ${fx(10 ** (m0 + 1))}.`,
        }
      : {
          en: `Yes: the bar and each chunk both grew by the same factor, so the same number of chunks still fit. Slide the points yourself to see it.`,
          es: `Sí: la barra y cada trozo crecieron por el mismo factor, así que siguen cabiendo los mismos trozos. Desliza los puntos tú mismo para verlo.`,
        },
    chunkSay: {
      en: `Take chunks off the bar. A chunk is some groups of ${dt} at once: 1 group = ${dt}, 10 groups = ${fx(10 * m.ds)}, 100 groups = ${fx(100 * m.ds)}. Take a chunk only if it fits. Stop when nothing is left.`,
      es: `Quita trozos de la barra. Un trozo son varios grupos de ${dt} a la vez: 1 grupo = ${dt}, 10 grupos = ${fx(10 * m.ds)}, 100 grupos = ${fx(100 * m.ds)}. Quita un trozo solo si cabe. Para cuando no quede nada.`,
    },
    takeLabel: (g) => ({
      en: `Take ${fx(g)} × ${dst} = ${fx(g * m.ds)}`,
      es: `Quitar ${fx(g)} × ${dst} = ${fx(g * m.ds)}`,
    }),
    undo: { en: "Start over", es: "Empezar de nuevo" },
    tooMany: {
      en: "That is a lot of small steps. Start over and try bigger chunks first.",
      es: "Son muchos pasos pequeños. Empieza de nuevo y prueba primero trozos más grandes.",
    },
    took: (g, left, total) => ({
      en: `Took ${fx(g)} group${g === 1 ? "" : "s"} of ${dst} = ${fx(g * m.ds)}. ${fx(left)} left; ${fx(total)} groups so far.`,
      es: `Quitaste ${fx(g)} grupo${g === 1 ? "" : "s"} de ${dst} = ${fx(g * m.ds)}. Quedan ${fx(left)}; ${fx(total)} grupos hasta ahora.`,
    }),
    chunkDone: (list) => ({
      en: `Nothing is left. The chunks ${list.map(fx).join(" + ")} add to ${fx(m.q)} groups of ${dst}, so ${eq(m.Ds, m.ds, m.q)}. Any chunks that empty the bar give the same total.`,
      es: `No queda nada. Los trozos ${list.map(fx).join(" + ")} suman ${fx(m.q)} grupos de ${dst}, así que ${eq(m.Ds, m.ds, m.q)}. Cualquier trozo que vacíe la barra da el mismo total.`,
    }),
    slideSay: {
      en: `Slide both decimal points together. The tape does not change; only its labels do. Slide until the divisor is a whole number.`,
      es: `Desliza los dos puntos decimales juntos. La cinta no cambia; solo cambian sus rótulos. Desliza hasta que el divisor sea un número entero.`,
    },
    slideLabelRange: { en: "Places both points slide", es: "Lugares que se deslizan los puntos" },
    slideNow: (s) => {
      const Ds = fx(Math.round(m.D * 10 ** s * 100) / 100);
      const ds = fx(Math.round(m.d * 10 ** s * 100) / 100);
      const whole1 = s >= m.k;
      return {
        en: `${Ds} ÷ ${ds} = ${m.q}. ${whole1 ? `${ds} is a whole number.` : `${ds} is not a whole number yet.`} Still ${m.q} chunks fit: the picture did not change.`,
        es: `${Ds} ÷ ${ds} = ${m.q}. ${whole1 ? `${ds} es un número entero.` : `${ds} todavía no es un número entero.`} Siguen cabiendo ${m.q} trozos: el dibujo no cambió.`,
      };
    },
    slideDone: {
      en: `With the divisor whole, ${eq(m.D, m.d, m.q)} is the same as ${eq(m.Ds, m.ds, m.q)}. Check: ${m.d} × ${m.q} = ${m.D}.`,
      es: `Con el divisor entero, ${eq(m.D, m.d, m.q)} es lo mismo que ${eq(m.Ds, m.ds, m.q)}. Comprueba: ${m.d} × ${m.q} = ${m.D}.`,
    },
    connectIntro: whole
      ? {
          en: `The written steps are the same chunks, one place at a time. Press the button to run one round: Divide, Multiply, Subtract, Bring down.`,
          es: `Los pasos escritos son los mismos trozos, un lugar a la vez. Pulsa el botón para hacer una ronda: dividir, multiplicar, restar, bajar.`,
        }
      : {
          en: `Now ${Dst} ÷ ${dst} as long division, the same chunks. Press the button to run a round: Divide, Multiply, Subtract, Bring down.`,
          es: `Ahora ${Dst} ÷ ${dst} como división larga, los mismos trozos. Pulsa el botón para hacer una ronda: dividir, multiplicar, restar, bajar.`,
        },
    nextStep: { en: "Show the next step", es: "Mostrar el siguiente paso" },
    roundSay: (r) => roundSay(m, r),
    ldDone: whole
      ? {
          en: `The digits above the bar, ${m.ld.quotient.split("").join(" ")}, are the chunks ${chunkSum(m)} = ${fx(m.q)}. The remainder is 0. Check: ${checkLine(m)}.`,
          es: `Los dígitos sobre la barra, ${m.ld.quotient.split("").join(" ")}, son los trozos ${chunkSum(m)} = ${fx(m.q)}. El residuo es 0. Comprueba: ${checkLine(m)}.`,
        }
      : {
          en: `${eq(m.D, m.d, m.q)}, the same as ${eq(m.Ds, m.ds, m.q)}. The remainder is 0. Check with the original numbers: ${m.d} × ${m.q} = ${m.D}.`,
          es: `${eq(m.D, m.d, m.q)}, igual que ${eq(m.Ds, m.ds, m.q)}. El residuo es 0. Comprueba con los números originales: ${m.d} × ${m.q} = ${m.D}.`,
        },
    legend: (p, c) => chunkLine(p, c),
    transferExpr: `${fx(tr.D)} ÷ ${fx(tr.d)}`,
    transferSay: whole
      ? {
          en: `Same idea, new numbers: ${fx(tr.D)} ÷ ${fx(tr.d)}.`,
          es: `La misma idea, números nuevos: ${fx(tr.D)} ÷ ${fx(tr.d)}.`,
        }
      : {
          en: `Same idea, new numbers: ${fx(tr.D)} ÷ ${fx(tr.d)}. Make the divisor a whole number first.`,
          es: `La misma idea, números nuevos: ${fx(tr.D)} ÷ ${fx(tr.d)}. Primero haz que el divisor sea un número entero.`,
        },
    transferQ: whole
      ? { en: `What is ${fx(tr.D)} ÷ ${fx(tr.d)}?`, es: `¿Cuánto es ${fx(tr.D)} ÷ ${fx(tr.d)}?` }
      : {
          en: `Which problem has the same quotient as ${fx(tr.D)} ÷ ${fx(tr.d)}?`,
          es: `¿Cuál problema tiene el mismo cociente que ${fx(tr.D)} ÷ ${fx(tr.d)}?`,
        },
    quotCue: (opt) => quotCue(tr, opt),
    equivCue: (opt) => equivCue(tr, opt),
    transferOk: whole
      ? {
          en: `Right: ${eq(tr.D, tr.d, tr.q)}. The chunks are ${tr.chunks.map((c) => chunkLine(tr, c)).join(" and ")}${tr.ld.quotient.includes("0") ? `; no chunk of ${ph(1).en} fits, and that is the 0` : ""}. Check: ${checkLine(tr)}.`,
          es: `Correcto: ${eq(tr.D, tr.d, tr.q)}. Los trozos son ${tr.chunks.map((c) => chunkLine(tr, c)).join(" y ")}${tr.ld.quotient.includes("0") ? `; no cabe ningún trozo de ${ph(1).es}, y ese es el 0` : ""}. Comprueba: ${checkLine(tr)}.`,
        }
      : {
          en: `Right: slide both points ${tr.k} place${tr.k > 1 ? "s" : ""} to make ${eq(tr.Ds, tr.ds, tr.q)}. The same ${tr.q} chunks fit. Check: ${tr.d} × ${tr.q} = ${tr.D}.`,
          es: `Correcto: desliza los dos puntos ${tr.k} lugar${tr.k > 1 ? "es" : ""} para obtener ${eq(tr.Ds, tr.ds, tr.q)}. Caben los mismos ${tr.q} trozos. Comprueba: ${tr.d} × ${tr.q} = ${tr.D}.`,
        },
    explainLabel: whole
      ? {
          en: "Explain: how are the long-division digits the same as chunks?",
          es: "Explica: ¿cómo son los dígitos de la división larga lo mismo que los trozos?",
        }
      : {
          en: "Explain: why does the quotient stay the same when both points slide?",
          es: "Explica: ¿por qué el cociente se queda igual cuando los dos puntos se deslizan?",
        },
    explainFrame: whole
      ? {
          en: "Each digit above the bar is ___ groups of ___, because ___.",
          es: "Cada dígito sobre la barra es ___ grupos de ___, porque ___.",
        }
      : {
          en: "When both numbers slide the same places, ___ and ___ grow by the same factor, so ___.",
          es: "Cuando los dos números se deslizan los mismos lugares, ___ y ___ crecen por el mismo factor, así que ___.",
        },
  };
}
