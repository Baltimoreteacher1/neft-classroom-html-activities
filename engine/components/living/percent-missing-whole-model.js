// living/percent-missing-whole-model.js — the mathematics and every sentence of
// the percent-missing-whole play (4-5 "Determine the Whole Given the Part and
// Percent"). Pure functions only: every number the play shows a student is
// computed here and checked in node by percent-missing-whole.test.mjs.
//
// The idea: a known part and its percent. One friendly chunk (10%) is the part
// divided by the number of chunks it covers; build the tape back up to 100% to
// find the whole; check by finding the percent of the whole. Amounts are held
// in hundredths so no float reaches the stage.

import { amtPair } from "./percent-estimate-model.js";
import { fmt, okInt, placeNotFirst } from "./unit-convert-model.js";

export { amtPair, fmt, okInt, placeNotFirst };

/** Chunk sizes (a percent that divides 100): the tape has 100 / chunk blocks. */
export const CHUNKS = [10, 20, 25];

const pair = (v, max = 400) => {
  const en = typeof v === "string" ? v.trim() : typeof v?.en === "string" ? v.en.trim() : "";
  const es = typeof v?.es === "string" && v.es.trim() ? v.es.trim() : en;
  return en && en.length <= max && es.length <= max ? { en, es } : null;
};
const P = (en, es) => ({ en, es });

function problem(c) {
  const chunk = c?.chunk == null ? 10 : Number(c.chunk);
  const percent = Number(c?.percent);
  const part = Number(c?.part);
  if (!CHUNKS.includes(chunk) || !okInt(percent, chunk, 100 - chunk) || percent % chunk)
    return null;
  const tens = percent / chunk;
  const n = 100 / chunk;
  if (tens < 2 || !okInt(part, 2, 10_000_000) || (part * 100) % tens) return null;
  const unit = pair(c.unit, 30);
  const prefix = typeof c.prefix === "string" && c.prefix.length <= 2 ? c.prefix : "";
  if (!prefix && !unit) return null;
  const chunkH = (part * 100) / tens;
  return {
    part,
    percent,
    chunk,
    tens,
    n,
    chunkH,
    wholeH: chunkH * n,
    unit,
    prefix,
    story: pair(c.story),
  };
}

export function validatePercentMissingWhole(cfg) {
  const main = problem(cfg);
  const transfer = problem(cfg?.transfer);
  if (!main || !transfer || (main.part === transfer.part && main.percent === transfer.percent))
    return null;
  if (!choicesFor(main) || !choicesFor(transfer)) return null;
  return { ...main, transfer };
}

/** "What is the whole?" choices, hundredths: exact, plus the real slips. */
export function choicesFor(s) {
  /** @type {{ kind: string, h: number, correct?: boolean }[]} */
  const out = [{ kind: "correct", h: s.wholeH, correct: true }];
  for (const c of [
    { kind: "times", h: s.part * s.percent },
    { kind: "addMissing", h: s.part * (200 - s.percent) },
    { kind: "same", h: s.part * 100 },
  ])
    if (!out.some((o) => o.h === c.h) && out.length < 4) out.push(c);
  return out.length >= 3 ? out : null;
}

export function wholeCopy(v) {
  const { part, percent, chunk, tens, n, chunkH, wholeH, transfer: t } = v;
  const W = (s, h) => amtPair(s, h);
  const dec = (p) => fmt(p);
  const eq = `${dec(percent)} × v = ${fmt(part * 100)}`;
  const solve = `v = ${fmt(part * 100)} ÷ ${dec(percent)} = ${fmt(wholeH)}`;
  const cueOf = (s) => (kind, h) => {
    const x = W(s, h);
    const partTxt = W(s, s.part * 100);
    return {
      times: P(
        `${x.en} is ${s.percent}% OF the part, but ${partTxt.en} is already the ${s.percent}% piece. Is the whole bigger or smaller than that piece? Look at the tape.`,
        `${x.es} es el ${s.percent}% DE la parte, pero ${partTxt.es} ya es el ${s.percent}% del total. ¿El total es mayor o menor que esa parte? Mira la cinta.`,
      ),
      addMissing: P(
        `${x.en} adds ${100 - s.percent}% of the PART. The missing ${100 - s.percent}% is a share of the WHOLE, and the part is not the whole. How big is each ${s.chunk}% block on the tape?`,
        `${x.es} suma el ${100 - s.percent}% de la PARTE. El ${100 - s.percent}% que falta es una parte del TOTAL, y la parte no es el total. ¿Cuánto vale cada bloque de ${s.chunk}% en la cinta?`,
      ),
      same: P(
        `${x.en} is only ${s.percent}% of the tape. How much of the tape is still unshaded? Could the shaded part be all of it?`,
        `${x.es} es solo el ${s.percent}% de la cinta. ¿Cuánto de la cinta sigue sin sombrear? ¿Podría la parte sombreada ser toda la cinta?`,
      ),
    }[kind];
  };
  return {
    kicker: P("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: P("Find the whole", "Halla el total"),
    ariaLabel: P(
      `A tape diagram of ${n} equal blocks, each ${chunk}% of the whole. The first ${tens} blocks, ${percent}%, hold ${W(v, part * 100).en}. Sharing that equally gives ${W(v, chunkH).en} per block, and all ${n} blocks, 100%, make ${W(v, wholeH).en}.`,
      `Un diagrama de cinta de ${n} bloques iguales, cada uno el ${chunk}% del total. Los primeros ${tens} bloques, el ${percent}%, tienen ${W(v, part * 100).es}. Al repartir eso por igual, cada bloque vale ${W(v, chunkH).es}, y los ${n} bloques, el 100%, suman ${W(v, wholeH).es}.`,
    ),
    printSummary: P(
      `${percent}% of the whole is ${W(v, part * 100).en}. ${tens} blocks of ${chunk}% hold ${W(v, part * 100).en}, so one ${chunk}% block is ${W(v, part * 100).en} ÷ ${tens} = ${W(v, chunkH).en}. ${n} blocks make 100%: ${W(v, chunkH).en} × ${n} = ${W(v, wholeH).en}. Check: ${percent}% of ${W(v, wholeH).en} = ${dec(percent)} × ${fmt(wholeH)} = ${fmt(part * 100)}. As an equation: ${eq}, ${solve}.`,
      `El ${percent}% del total es ${W(v, part * 100).es}. ${tens} bloques de ${chunk}% tienen ${W(v, part * 100).es}, así que un bloque de ${chunk}% es ${W(v, part * 100).es} ÷ ${tens} = ${W(v, chunkH).es}. ${n} bloques forman el 100%: ${W(v, chunkH).es} × ${n} = ${W(v, wholeH).es}. Comprobación: el ${percent}% de ${W(v, wholeH).es} = ${dec(percent)} × ${fmt(wholeH)} = ${fmt(part * 100)}. Como ecuación: ${eq}, ${solve}.`,
    ),
    scene: {
      situate: P("The tape", "La cinta"),
      predict: P("Predict", "Predice"),
      chunk: P(`Find ${chunk}%`, `Halla ${chunk}%`),
      table: P("Table and equation", "Tabla y ecuación"),
      check: P("Check it", "Compruébalo"),
      transfer: P("On your own", "Por tu cuenta"),
    },
    hdr: { pct: P("Percent", "Porcentaje"), amt: P("Amount", "Cantidad") },
    wholeQ: P("100% = ?", "100% = ?"),
    partLbl: (s) =>
      P(`${s.percent}% = ${W(s, s.part * 100).en}`, `${s.percent}% = ${W(s, s.part * 100).es}`),
    wholeLbl: (s) => P(`100% = ${W(s, s.wholeH).en}`, `100% = ${W(s, s.wholeH).es}`),
    eachLbl: (s) =>
      P(
        `each block = ${s.chunk}% = ${W(s, s.chunkH).en}`,
        `cada bloque = ${s.chunk}% = ${W(s, s.chunkH).es}`,
      ),
    situate: {
      say:
        v.story ||
        P(
          `${W(v, part * 100).en} is ${percent}% of the whole. The tape is the whole, 100%, cut into ${n} equal blocks of ${chunk}%. The shaded blocks are the part we know.`,
          `${W(v, part * 100).es} es el ${percent}% del total. La cinta es el total, el 100%, cortado en ${n} bloques iguales de ${chunk}%. Los bloques sombreados son la parte que conocemos.`,
        ),
      note: P(
        `The part is ${W(v, part * 100).en} and the percent is ${percent}%. The whole, 100%, is missing. Is the whole more or less than the part?`,
        `La parte es ${W(v, part * 100).es} y el porcentaje es ${percent}%. Falta el total, el 100%. ¿El total es mayor o menor que la parte?`,
      ),
    },
    predict: {
      say: P(
        `Before any work: what is the whole, the full 100% amount?`,
        `Antes de calcular: ¿cuál es el total, la cantidad completa del 100%?`,
      ),
      question: P(`The whole is…`, `El total es…`),
      ok: P(
        `Yes: the whole is ${W(v, wholeH).en}. Next, find it yourself, block by block.`,
        `Sí: el total es ${W(v, wholeH).es}. Ahora hállalo tú, bloque por bloque.`,
      ),
      cue: cueOf(v),
    },
    chunk: {
      say: P(
        `The ${tens} shaded blocks hold ${W(v, part * 100).en} in all, and every block is the same size. Share the part equally to find what one ${chunk}% block is worth.`,
        `Los ${tens} bloques sombreados tienen ${W(v, part * 100).es} en total, y todos los bloques son del mismo tamaño. Reparte la parte por igual para hallar cuánto vale un bloque de ${chunk}%.`,
      ),
      shareBtn: P(
        `Share ${W(v, part * 100).en} among ${tens} blocks`,
        `Reparte ${W(v, part * 100).es} entre ${tens} bloques`,
      ),
      shared: P(
        `${W(v, part * 100).en} ÷ ${tens} = ${W(v, chunkH).en}. One ${chunk}% block is ${W(v, chunkH).en}. Now build the tape up to 100%.`,
        `${W(v, part * 100).es} ÷ ${tens} = ${W(v, chunkH).es}. Un bloque de ${chunk}% vale ${W(v, chunkH).es}. Ahora completa la cinta hasta el 100%.`,
      ),
      label: P("Blocks filled in", "Bloques completados"),
      more: P(
        `Keep filling blocks, each worth ${W(v, chunkH).en}, until the tape reaches 100%.`,
        `Sigue llenando bloques, cada uno de ${W(v, chunkH).es}, hasta que la cinta llegue al 100%.`,
      ),
      done: P(
        `${n} blocks of ${W(v, chunkH).en} make ${W(v, chunkH).en} × ${n} = ${W(v, wholeH).en}. That is 100%, the whole. It is bigger than the part, as it should be.`,
        `${n} bloques de ${W(v, chunkH).es} suman ${W(v, chunkH).es} × ${n} = ${W(v, wholeH).es}. Eso es el 100%, el total. Es mayor que la parte, como debe ser.`,
      ),
      expr: (k) => `${fmt(chunkH)} × ${k} = ${fmt(chunkH * k)}`,
    },
    table: {
      say: P(
        `The tape becomes a ratio table: ${percent}% pairs with ${W(v, part * 100).en}. Divide both by ${tens} to get ${chunk}% and ${W(v, chunkH).en}, then multiply both by ${n} to reach 100%. An equation says the same thing: ${dec(percent)} × the whole = ${fmt(part * 100)}, so the whole is ${fmt(part * 100)} ÷ ${dec(percent)}.`,
        `La cinta se vuelve una tabla de razones: el ${percent}% va con ${W(v, part * 100).es}. Divide ambos entre ${tens} para obtener ${chunk}% y ${W(v, chunkH).es}, y luego multiplica ambos por ${n} para llegar al 100%. Una ecuación dice lo mismo: ${dec(percent)} × el total = ${fmt(part * 100)}, así que el total es ${fmt(part * 100)} ÷ ${dec(percent)}.`,
      ),
      divide: `÷ ${tens}`,
      times: `× ${n}`,
      eq: `${eq}  →  ${solve}`,
    },
    check: {
      say: P(
        `Always check. Which check shows ${W(v, wholeH).en} is right?`,
        `Comprueba siempre. ¿Cuál comprobación muestra que ${W(v, wholeH).es} es correcto?`,
      ),
      question: P("A good check is…", "Una buena comprobación es…"),
      labels: {
        correct: P(
          `${percent}% of ${W(v, wholeH).en} = ${dec(percent)} × ${fmt(wholeH)} = ${fmt(part * 100)}`,
          `el ${percent}% de ${W(v, wholeH).es} = ${dec(percent)} × ${fmt(wholeH)} = ${fmt(part * 100)}`,
        ),
        bigger: P(
          `${fmt(wholeH)} is bigger than ${fmt(part * 100)}, so it is right`,
          `${fmt(wholeH)} es mayor que ${fmt(part * 100)}, así que es correcto`,
        ),
        ofPart: P(
          `${percent}% of ${fmt(part * 100)} = ${fmt(part * percent)}`,
          `el ${percent}% de ${fmt(part * 100)} = ${fmt(part * percent)}`,
        ),
      },
      cue: {
        bigger: P(
          `Being bigger than the part is only a start. Would a much larger number also be bigger than ${fmt(part * 100)}? Does that prove it is the whole?`,
          `Ser mayor que la parte es solo un comienzo. ¿Un número mucho más grande también sería mayor que ${fmt(part * 100)}? ¿Eso prueba que es el total?`,
        ),
        ofPart: P(
          `That finds ${percent}% of the PART. The check goes the other way: ${percent}% of the WHOLE should give back the part. Which number is the whole?`,
          `Eso halla el ${percent}% de la PARTE. La comprobación va al revés: el ${percent}% del TOTAL debe devolver la parte. ¿Cuál número es el total?`,
        ),
      },
      ok: P(
        `Yes: ${percent}% of ${W(v, wholeH).en} is ${W(v, part * 100).en}, exactly the part we were given.`,
        `Sí: el ${percent}% de ${W(v, wholeH).es} es ${W(v, part * 100).es}, justo la parte que nos dieron.`,
      ),
    },
    transfer: {
      say:
        t.story ||
        P(
          `A new problem: ${W(t, t.part * 100).en} is ${t.percent}% of the whole. Find the whole.`,
          `Un problema nuevo: ${W(t, t.part * 100).es} es el ${t.percent}% del total. Halla el total.`,
        ),
      question: P(`The whole is…`, `El total es…`),
      ok: P(
        `Right: ${W(t, t.part * 100).en} ÷ ${t.tens} = ${W(t, t.chunkH).en} for ${t.chunk}%, and ${W(t, t.chunkH).en} × ${t.n} = ${W(t, t.wholeH).en}.`,
        `Correcto: ${W(t, t.part * 100).es} ÷ ${t.tens} = ${W(t, t.chunkH).es} para ${t.chunk}%, y ${W(t, t.chunkH).es} × ${t.n} = ${W(t, t.wholeH).es}.`,
      ),
      cue: cueOf(t),
      explain: P(
        "Explain: why do you divide to find the whole instead of multiplying by the percent?",
        "Explica: ¿por qué divides para hallar el total en vez de multiplicar por el porcentaje?",
      ),
      frame: P(
        "The part is only ___% of the whole, so the whole is ___ than the part. I divide by ___ to find one block, then ___.",
        "La parte es solo el ___% del total, así que el total es ___ que la parte. Divido entre ___ para hallar un bloque y luego ___.",
      ),
    },
  };
}
