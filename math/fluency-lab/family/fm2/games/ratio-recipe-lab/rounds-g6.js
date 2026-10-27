// Grade 6: equivalent ratios and ratio notation, unit rates, percent as a rate per 100, constant speed, comparing mixes.
// @fm2 FM-014 FM-056 FM-057 FM-060
import { int, pick, sample } from "../../rng.js";
import { cmp, div, frac, gcd, sub } from "../../rational.js";
import { RATE_CONTEXTS, TRAVEL } from "./contexts.js";
import { attempt, both, makeBench, qty, R } from "./kit.js";
import { measured, MIXES, PAIRS } from "./recipes.js";

const SETS = [...PAIRS, ...MIXES];
const these = (set) => (set.esArt === "Un" ? "este" : "esta");
const BATCH_WORD = { one: { en: "batch", es: "tanda" }, many: { en: "batches", es: "tandas" } };
const BATCH_LABEL = { en: "Number of batches", es: "Número de tandas" };

// 12. Equivalent ratios: a ratio table with three columns, ratio notation a:b in simplest form from level 2.
export function equivRatios(level, rng, grade) {
  return attempt(() => {
    const set = pick(rng, SETS);
    const g = level === 1 ? 1 : level === 2 ? pick(rng, [2, 3]) : pick(rng, [2, 3, 4]);
    const top = level === 3 ? 7 : level === 1 ? 6 : 5;
    const a0 = int(rng, 2, top);
    const b0 = int(rng, 1, top);
    if (a0 === b0 || gcd(a0, b0) !== 1) return null;
    const a = a0 * g;
    const b = b0 * g;
    const kMax = level === 1 ? 6 : level === 2 ? 8 : 10;
    const ks = sample(rng, Array.from({ length: kMax - 1 }, (_, i) => i + 2), 3).sort((x, y) => x - y);
    const A = set.a.key;
    const B = set.b.key;
    return makeBench({
      skillId: "equiv-ratios",
      level,
      grade,
      hintKind: "scale",
      view: "tape",
      line: true,
      hide: level === 3,
      recipe: { id: set.id, family: set.family, name: set.name },
      rows: [set.a, set.b],
      cols: ks.map((k, i) => {
        const onA = i % 2 === 0;
        return {
          label: { en: `Column ${i + 1}`, es: `Columna ${i + 1}` },
          per: { [A]: R(a), [B]: R(b) },
          pin: onA ? { key: A, value: R(a * k) } : { key: B, value: R(b * k) },
          ask: [onA ? B : A],
          showBase: i === 0,
        };
      }),
      extra: g > 1 ? [{ key: "ratio", kind: "ratio", answer: [a0, b0], label: { en: "Simplest form of the ratio (a:b)", es: "La razón en su forma más simple (a:b)" } }] : [],
      batchWord: { one: { en: "group", es: "grupo" }, many: { en: "groups", es: "grupos" } },
      batchLabel: { en: "Number of groups", es: "Número de grupos" },
      prompt: both((lang) => {
        const part = (row) => (row.noun ? row.noun[lang][1] : row.name[lang]);
        return lang === "en"
          ? `In this ${set.name.en}, the ratio of ${part(set.a)} to ${part(set.b)} is ${a}:${b}. Complete the table of equivalent ratios${g > 1 ? ", then write the ratio in simplest form" : ""}.`
          : `En ${these(set) === "este" ? "este" : "esta"} ${set.name.es}, la razón de ${part(set.a)} a ${part(set.b)} es ${a}:${b}. Completa la tabla de razones equivalentes${g > 1 ? " y escribe la razón en su forma más simple" : ""}.`;
      }),
    });
  });
}

// 13. Unit rates: scale until ONE of something; at level 3 find both unit rates.
export function unitRate(level, rng, grade) {
  return attempt(() => {
    const ctx = pick(rng, RATE_CONTEXTS);
    let a;
    let b;
    if (level === 1) {
      b = pick(rng, [2, 3, 4, 5, 6, 8]);
      a = b * int(rng, 2, 9);
    } else if (level === 2) {
      b = pick(rng, [2, 4, 5, 8]);
      a = int(rng, b + 1, 40);
      if (a % b === 0) return null;
    } else [a, b] = pick(rng, [[2, 3], [3, 4], [3, 5], [5, 4], [6, 4], [5, 2], [7, 4], [9, 6]]);
    const A = ctx.a;
    const B = ctx.b;
    const per = { [A.key]: R(a), [B.key]: R(b) };
    const style = level === 3 ? "mixed" : "dec";
    const cols = [{ label: { en: "Per 1", es: "Por 1" }, per, pin: { key: B.key, value: R(1) }, ask: [A.key], step: R(1, b), mult: [R(1, b)] }];
    if (level === 3) cols.push({ label: { en: "Per 1 (other way)", es: "Por 1 (al revés)" }, per, pin: { key: A.key, value: R(1) }, ask: [B.key], step: R(1, a), mult: [R(1, a)], showBase: false });
    return makeBench({
      skillId: "unit-rate",
      level,
      grade,
      hintKind: "unit",
      view: "tape",
      line: true,
      hide: level === 3,
      style,
      recipe: { id: ctx.id, family: "rate", name: { en: "rate", es: "tasa" } },
      rows: [A, B],
      cols,
      batchWord: BATCH_WORD,
      batchLabel: BATCH_LABEL,
      prompt: both((lang) => `${ctx.say[lang](qty(A, R(a), lang, style), qty(B, R(b), lang, style))} ${ctx.perB[lang]}${level === 3 ? ` ${ctx.perA[lang]}` : ""}`),
    });
  });
}

const PERCENT_CONTEXTS = [
  { part: measured("part", "juice", "jugo", "ml"), whole: measured("total", "drink", "bebida", "ml"), the: { en: "this drink", es: "esta bebida" }, defEs: "la", of: { en: "the drink", es: "la bebida" } },
  { part: measured("part", "soap", "jabón", "ml"), whole: measured("total", "cleaning spray", "limpiador", "ml"), the: { en: "this cleaning spray", es: "este limpiador" }, defEs: "el", of: { en: "the spray", es: "el limpiador" } },
  {
    part: measured("part", "vinegar", "vinagre", "ml"),
    whole: measured("total", "salad dressing", "aderezo", "ml"),
    the: { en: "this salad dressing", es: "este aderezo" },
    defEs: "el",
    of: { en: "the dressing", es: "el aderezo" },
  },
  {
    part: measured("part", "syrup", "jarabe", "ml"),
    whole: measured("total", "fruit punch", "ponche", "ml"),
    the: { en: "this fruit punch", es: "este ponche" },
    defEs: "el",
    of: { en: "the punch", es: "el ponche" },
  },
];

// 14. Percent as a rate per 100: p% means p out of every 100.
export function percentPer100(level, rng, grade) {
  return attempt(() => {
    const ctx = pick(rng, PERCENT_CONTEXTS);
    const p = pick(rng, level === 1 ? [10, 20, 25, 50] : [10, 20, 25, 30, 40, 50, 60, 75]);
    const X = level === 1 ? pick(rng, [200, 300, 400]) : level === 2 ? pick(rng, [50, 25, 150, 250, 500, 40, 80, 120, 200, 350]) : pick(rng, [30, 45, 60, 70, 90, 125, 180, 225, 260]);
    const part = (p * X) / 100;
    const reverse = level === 3 && rng() < 0.5;
    const per = { total: R(100), part: R(p) };
    const col = reverse ? { per, pin: { key: "part", value: frac(p * X, 100) }, ask: ["total"] } : { per, pin: { key: "total", value: R(X) }, ask: ["part"] };
    const batch = div(col.pin.value, per[col.pin.key]);
    return makeBench({
      skillId: "percent-per-100",
      level,
      grade,
      hintKind: "scale",
      view: "tape",
      line: true,
      hide: level === 3,
      style: "dec",
      recipe: { id: "percent", family: "rate", name: { en: "percent", es: "porcentaje" } },
      rows: [ctx.whole, ctx.part],
      cols: [{ ...col, step: R(1, batch.d) }],
      batchWord: { one: { en: "group of 100 mL", es: "grupo de 100 mL" }, many: { en: "groups of 100 mL", es: "grupos de 100 mL" } },
      batchLabel: { en: "Groups of 100 mL", es: "Grupos de 100 mL" },
      prompt: both((lang) =>
        lang === "en"
          ? reverse
            ? `A sample of ${ctx.whole.name.en} has ${part} mL of ${ctx.part.name.en}. ${p}% of it is ${ctx.part.name.en}, which means ${p} mL for every 100 mL. How many mL is the sample?`
            : `In ${ctx.the.en}, ${p}% is ${ctx.part.name.en}. That means ${p} mL of ${ctx.part.name.en} in every 100 mL. How much ${ctx.part.name.en} is in ${X} mL of ${ctx.whole.name.en}?`
          : reverse
            ? `Una muestra de ${ctx.whole.name.es} tiene ${part} mL de ${ctx.part.name.es}. El ${p} % es ${ctx.part.name.es}, es decir, ${p} mL por cada 100 mL. ¿Cuántos mL tiene la muestra?`
            : `En ${ctx.the.es}, el ${p} % es ${ctx.part.name.es}. Eso significa ${p} mL de ${ctx.part.name.es} por cada 100 mL. ¿Cuánto ${ctx.part.name.es} hay en ${X} mL de ${ctx.whole.name.es}?`,
      ),
    });
  });
}

// 15. Constant speed: the same speed means the same rate, so hours and miles scale together.
export function constantSpeed(level, rng, grade) {
  return attempt(() => {
    const trip = pick(rng, TRAVEL);
    const speed = pick(rng, trip.speeds);
    const h0 = int(rng, 2, level === 1 ? 4 : 5);
    const d0 = speed * h0;
    const hours = measured("time", "time", "tiempo", "hour");
    const miles = measured("dist", "distance", "distancia", "mile");
    const per = { time: R(h0), dist: R(d0) };
    const hrs = level === 1 ? R(int(rng, 5, 8)) : pick(rng, [R(3, 2), R(5, 2), R(7, 2), R(9, 2), R(11, 2)]);
    const fwd = { per, pin: { key: "time", value: hrs }, ask: ["dist"], step: R(1, 2) };
    const backH = int(rng, 6, 9);
    const back = { per, pin: { key: "dist", value: R(speed * backH) }, ask: ["time"], step: R(1, h0) };
    const cols = level === 1 ? [fwd] : level === 2 ? [rng() < 0.5 ? fwd : back] : [{ ...back, label: { en: "How long?", es: "¿Cuánto tiempo?" } }, { ...fwd, label: { en: "How far?", es: "¿Qué distancia?" }, showBase: false }];
    const text = (col, lang) => (col.pin.key === "time" ? (lang === "en" ? `At that speed, how many miles in ${qty(hours, col.pin.value, lang, "dec")}?` : `A esa velocidad, ¿cuántas millas en ${qty(hours, col.pin.value, lang, "dec")}?`) : lang === "en" ? `At that speed, how many hours for ${d(col.pin.value)} miles?` : `A esa velocidad, ¿cuántas horas para recorrer ${d(col.pin.value)} millas?`);
    const d = (v) => String(v.n / v.d);
    return makeBench({
      skillId: "constant-speed",
      level,
      grade,
      hintKind: "scale",
      view: "tape",
      line: true,
      hide: level === 3,
      style: "dec",
      recipe: { id: "trip", family: "rate", name: { en: "trip", es: "viaje" } },
      rows: [hours, miles],
      cols: cols.map((c) => ({ ...c, mult: [] })),
      extra: level > 1 ? [{ key: "speed", kind: "num", answer: R(speed), label: { en: "Speed (miles per hour)", es: "Velocidad (millas por hora)" } }] : [],
      batchWord: { one: { en: "trip of this length", es: "viaje de esta duración" }, many: { en: "trips of this length", es: "viajes de esta duración" } },
      batchLabel: { en: "Number of trips like the first", es: "Número de viajes como el primero" },
      prompt: both((lang) =>
        lang === "en"
          ? `${trip.who.en} travels ${d0} miles in ${h0} hours at a constant speed. ${cols.map((c) => text(c, "en")).join(" ")}`
          : `${trip.who.es} recorre ${d0} millas en ${h0} horas a velocidad constante. ${cols.map((c) => text(c, "es")).join(" ")}`,
      ),
    });
  });
}

// 16. Which mix is stronger? Scale each to 1 of the water, compare what is left, and choose.
export function strongerMix(level, rng, grade) {
  return attempt(() => {
    const mix = pick(rng, MIXES.filter((m) => m.b.key === "water"));
    const mk = () => {
      if (level === 1) {
        const w = int(rng, 2, 5);
        return [int(rng, 2, 5) * w, w];
      }
      if (level === 2) {
        const w = pick(rng, [2, 4, 5]);
        return [int(rng, w + 1, w * 4), w];
      }
      const w = pick(rng, [3, 4, 5, 6]);
      return [int(rng, w + 1, w * 2), w];
    };
    const [aA, wA] = mk();
    const [aB, wB] = mk();
    const order = cmp(frac(aA, wA), frac(aB, wB));
    if (order === 0 || (level === 3 && Math.abs(aA / wA - aB / wB) > 0.3)) return null;
    const stronger = order > 0 ? 0 : 1;
    const absRate = order > 0 ? sub(frac(aA, wA), frac(aB, wB)) : sub(frac(aB, wB), frac(aA, wA));
    const amounts = [aA, aB];
    const trap = amounts[1 - stronger] > amounts[stronger];
    if (level < 3 && !trap) return null;
    const style = level === 3 ? "mixed" : "dec";
    const col = (tray, a, w) => ({ label: { en: `Mix ${tray}`, es: `Mezcla ${tray}` }, per: { a: R(a), b: R(w) }, pin: { key: "b", value: R(1) }, ask: ["a"], step: R(1, w), mult: [R(1, w)] });
    const label = (tray) => ({ en: `Mix ${tray}`, es: `Mezcla ${tray}` });
    return makeBench({
      skillId: "stronger-mix",
      level,
      grade,
      hintKind: "compare",
      view: "tape",
      line: true,
      hide: level === 3,
      style,
      recipe: { id: mix.id, family: "rate", name: mix.name },
      rows: [{ ...mix.a, key: "a" }, { ...mix.b, key: "b" }],
      cols: [col("A", aA, wA), col("B", aB, wB)],
      extra: level > 1 ? [{ key: "gap", kind: "num", answer: absRate, label: { en: "How much more per 1 does the stronger mix have?", es: "¿Cuánto más por 1 tiene la mezcla más fuerte?" } }] : [],
      pick: { question: { en: "Which mix is stronger?", es: "¿Qué mezcla es más fuerte?" }, options: [label("A"), label("B")], answer: stronger, wrong: trap ? "pick-total" : "pick-weaker" },
      batchWord: BATCH_WORD,
      batchLabel: BATCH_LABEL,
      prompt: both((lang) => {
        const part = (n, w) => `${qty({ ...mix.a, key: "a" }, R(n), lang)} ${lang === "en" ? "with" : "con"} ${qty({ ...mix.b, key: "b" }, R(w), lang)}`;
        return lang === "en"
          ? `Mix A: ${part(aA, wA)}. Mix B: ${part(aB, wB)}. A mix is stronger when it has more ${mix.a.name.en} for each 1 of ${mix.b.name.en}. Which mix is stronger?`
          : `Mezcla A: ${part(aA, wA)}. Mezcla B: ${part(aB, wB)}. Una mezcla es más fuerte cuando tiene más ${mix.a.name.es} por cada 1 de ${mix.b.name.es}. ¿Qué mezcla es más fuerte?`;
      }),
    });
  });
}

