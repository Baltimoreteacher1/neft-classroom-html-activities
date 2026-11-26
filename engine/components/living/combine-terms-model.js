// living/combine-terms-model.js — the mathematics of the combine-terms play (6-15).
//
// An expression such as 6x + 4 + 2x + 7 is a bag of tiles: 6 x-tiles, 4 plain
// number tiles, 2 x-tiles, 7 plain number tiles. Like terms are the same KIND
// of tile, so they stack and are counted: 8x + 11. Pure functions only (no
// DOM): every number the play shows is computed here, so
// combine-terms.test.mjs can check each one in node.

import { okInt, placeCorrect } from "./mean-balance-model.js";

export { placeCorrect };

export const MIN_X = 2; // x = 1 would make the wrong "19x" accidentally agree with 8x + 11
export const MAX_VAR_TILES = 10;
export const MAX_CONST_TILES = 14;

/** "6x" -> {coef:6, v:"x"}; "4" -> {coef:4, v:null}. */
export function parseTerm(s) {
  const m = /^(\d{1,2})([a-z])?$/.exec(String(s).trim());
  if (!m) return null;
  const coef = Number(m[1]);
  return coef >= 1 ? { coef, v: m[2] ?? null } : null;
}

export const termText = (t) => `${t.coef}${t.v ?? ""}`;
export const expressionText = (terms) => terms.map(termText).join(" + ");

/** The simplified kinds: letters in the order they first appear, then plain numbers. */
export function combine(terms) {
  const kinds = [];
  for (const t of terms) {
    const key = t.v ?? "#";
    const kind = kinds.find((k) => k.key === key);
    if (kind) {
      kind.sum += t.coef;
      kind.count += 1;
    } else kinds.push({ key, v: t.v, sum: t.coef, count: 1 });
  }
  kinds.sort((a, b) => Number(a.key === "#") - Number(b.key === "#"));
  return kinds;
}

export const simplifiedText = (terms) =>
  combine(terms)
    .map((k) => `${k.sum}${k.v ?? ""}`)
    .join(" + ");

/** The value of terms when each letter has a value: {x: 3}. */
export const valueAt = (terms, vals) =>
  terms.reduce((s, t) => s + t.coef * (t.v ? vals[t.v] : 1), 0);

/** The slip "add every coefficient together": 19x, or the first letter's. */
export function mergedAll(terms) {
  const kinds = combine(terms);
  const v = kinds.find((k) => k.v)?.v ?? "x";
  return { v, sum: kinds.reduce((s, k) => s + k.sum, 0) };
}

/** Main predict choices, one letter: the right answer and three real slips. */
export function mainChoices(terms) {
  const [first, second] = combine(terms);
  const v = first.v;
  const all = mergedAll(terms);
  return [
    { kind: "right", text: `${first.sum}${v} + ${second.sum}`, correct: true },
    { kind: "all", text: `${all.sum}${v}`, correct: false },
    { kind: "square", text: `${first.sum}${v}² + ${second.sum}`, correct: false },
    { kind: "swap", text: `${second.sum}${v} + ${first.sum}`, correct: false },
  ];
}

/** Transfer choices, two letters m and s: the right answer and three real slips. */
export function transferChoices(terms) {
  const [a, b] = combine(terms);
  return [
    { kind: "right", text: `${a.sum}${a.v} + ${b.sum}${b.v}`, correct: true },
    { kind: "all", text: `${a.sum + b.sum}${a.v}`, correct: false },
    { kind: "drop", text: `${a.sum}${a.v} + ${b.sum}`, correct: false },
    { kind: "swap", text: `${a.sum}${b.v} + ${b.sum}${a.v}`, correct: false },
  ];
}

const cleanName = (p, max) =>
  p && typeof p.en === "string" && p.en.trim()
    ? { en: p.en.slice(0, max), es: String(p.es || p.en).slice(0, max) }
    : null;

function parseList(list, { letters, varMax, constMax }) {
  if (!Array.isArray(list) || list.length < 4 || list.length > 6) return null;
  const terms = list.map(parseTerm);
  if (terms.some((t) => !t)) return null;
  const kinds = combine(terms);
  const vars = kinds.filter((k) => k.v);
  const hasConst = kinds.some((k) => !k.v);
  if (vars.length !== letters || (letters === 1 && !hasConst)) return null;
  if (kinds.some((k) => k.count < 2)) return null;
  if (vars.some((k) => k.sum > varMax)) return null;
  if (kinds.find((k) => !k.v)?.sum > constMax) return null;
  return terms;
}

export function validateCombineTerms(cfg) {
  const terms = parseList(cfg?.terms, {
    letters: 1,
    varMax: MAX_VAR_TILES,
    constMax: MAX_CONST_TILES,
  });
  if (!terms) return null;
  const xMax = cfg.xMax == null ? 5 : Number(cfg.xMax);
  const start = cfg.start == null ? 3 : Number(cfg.start);
  if (!okInt(xMax, MIN_X + 1, 5) || !okInt(start, MIN_X, xMax)) return null;
  const v = combine(terms).find((k) => k.v).v;
  // The plausible wrong answer must disagree with the right one at every value on the slider.
  const all = mergedAll(terms);
  const right = (x) => valueAt(terms, { [v]: x });
  for (let x = MIN_X; x <= xMax; x++) if (all.sum * x === right(x)) return null;
  const tt = parseList(cfg.transfer?.terms, { letters: 2, varMax: 12, constMax: 0 });
  const names = cfg.transfer?.names;
  if (!tt) return null;
  const [a, b] = combine(tt);
  const nameA = cleanName(names?.[a.v], 24);
  const nameB = cleanName(names?.[b.v], 24);
  if (!nameA || !nameB || combine(tt).length !== 2) return null;
  return {
    terms,
    v,
    xMax,
    start,
    story: cleanName(cfg.story, 400),
    transfer: {
      terms: tt,
      names: { [a.v]: nameA, [b.v]: nameB },
      story: cleanName(cfg.transfer?.story, 400),
    },
  };
}

const pair = (en, es) => ({ en, es });

/** Every sentence the play says. `cfg` is the validated config. */
export function combineCopy(cfg) {
  const { terms, v, start, transfer: tr } = cfg;
  const [vk, ck] = combine(terms);
  const text = expressionText(terms);
  const simple = simplifiedText(terms);
  const all = mergedAll(terms);
  const varTerms = terms.filter((t) => t.v);
  const conTerms = terms.filter((t) => !t.v);
  const varSumText = varTerms.map(termText).join(" + ");
  const conSumText = conTerms.map(termText).join(" + ");
  const tText = expressionText(tr.terms);
  const tSimple = simplifiedText(tr.terms);
  const [ta, tb] = combine(tr.terms);
  const nA = tr.names[ta.v];
  const nB = tr.names[tb.v];
  const valRow = (x) => {
    const orig = valueAt(terms, { [v]: x });
    return {
      orig,
      simple: vk.sum * x + ck.sum,
      wrong: all.sum * x,
    };
  };
  return {
    kicker: pair("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: pair("Which tiles can join?", "¿Qué fichas se pueden juntar?"),
    ariaLabel: pair(
      `${text} drawn as bags of tiles: ${vk.sum} ${v}-tiles in ${vk.count} bags and ${ck.sum} plain number tiles in ${ck.count} bags. The ${v}-tiles stack together and the number tiles stack together, giving ${simple}.`,
      `${text} dibujado como bolsas de fichas: ${vk.sum} fichas ${v} en ${vk.count} bolsas y ${ck.sum} fichas de número en ${ck.count} bolsas. Las fichas ${v} se juntan entre sí y las fichas de número se juntan entre sí, y resulta ${simple}.`,
    ),
    printSummary: pair(
      `${text} = ${simple}. Like terms are the same kind of tile: ${varSumText} = ${vk.sum}${v}, and ${conSumText} = ${ck.sum}. An ${v}-tile and a plain number tile are different kinds, so they do not combine. Check with ${v} = ${start}: ${valueAt(terms, { [v]: start })} both ways.`,
      `${text} = ${simple}. Los términos semejantes son la misma clase de ficha: ${varSumText} = ${vk.sum}${v} y ${conSumText} = ${ck.sum}. Una ficha ${v} y una ficha de número son clases distintas, así que no se combinan. Comprueba con ${v} = ${start}: ${valueAt(terms, { [v]: start })} de las dos maneras.`,
    ),
    scene: {
      situate: pair("Bags of tiles", "Bolsas de fichas"),
      predict: pair("Predict", "Predice"),
      sort: pair("Sort the tiles", "Ordena las fichas"),
      connect: pair("Count each kind", "Cuenta cada clase"),
      test: pair(`Test with a value of ${v}`, `Prueba con un valor de ${v}`),
      transfer: pair("On your own", "Por tu cuenta"),
    },
    situateSay: pair(
      `${cfg.story ? `${cfg.story.en} ` : ""}${text}: each term is a bag. ${varTerms.map((t) => `${termText(t)} is ${t.coef} ${v}-tiles`).join(", ")}; ${conTerms.map((t) => `${t.coef} is ${t.coef} plain number tiles`).join(", ")}.`,
      `${cfg.story ? `${cfg.story.es} ` : ""}${text}: cada término es una bolsa. ${varTerms.map((t) => `${termText(t)} son ${t.coef} fichas ${v}`).join(", ")}; ${conTerms.map((t) => `${t.coef} son ${t.coef} fichas de número`).join(", ")}.`,
    ),
    predictSay: pair(
      `Which shorter expression has the same value as ${text}? Look at what is in the bags.`,
      `¿Qué expresión más corta vale lo mismo que ${text}? Mira lo que hay en las bolsas.`,
    ),
    predictQ: pair(`${text} is the same as…`, `${text} es igual a…`),
    predictOk: pair(
      `Yes: ${simple}. ${vk.sum} ${v}-tiles and ${ck.sum} plain number tiles. Now sort the tiles yourself.`,
      `Sí: ${simple}. ${vk.sum} fichas ${v} y ${ck.sum} fichas de número. Ahora ordena tú las fichas.`,
    ),
    /** A wrong expression: names the slip and asks about the tiles. */
    cue(opt) {
      return {
        all: pair(
          `${opt.text} puts the plain number tiles in with the ${v}-tiles. Does a plain number tile have the letter ${v} on it? Which tiles can stack with the ${v}-tiles?`,
          `${opt.text} mete las fichas de número con las fichas ${v}. ¿Tiene una ficha de número una ${v}? ¿Qué fichas se pueden juntar con las fichas ${v}?`,
        ),
        square: pair(
          `${opt.text} has ${v}² in it: ${v} times ${v}. Joining ${varTerms.map(termText).join(" and ")} counts ${v}-tiles. Is any tile being multiplied by itself?`,
          `${opt.text} tiene ${v}²: ${v} por ${v}. Juntar ${varTerms.map(termText).join(" y ")} cuenta fichas ${v}. ¿Alguna ficha se multiplica por sí misma?`,
        ),
        swap: pair(
          `${opt.text} puts ${ck.sum} on the ${v}. Count the ${v}-tiles in all the bags: is it ${ck.sum}, or is that the number of plain tiles?`,
          `${opt.text} pone ${ck.sum} en la ${v}. Cuenta las fichas ${v} de todas las bolsas: ¿son ${ck.sum} o ese es el número de fichas de número?`,
        ),
      }[opt.kind];
    },
    sortSay: pair(
      `Sort each bag: the ${v}-tiles go to the ${v} pile, the plain number tiles go to the number pile. Tiles of the same kind stack.`,
      `Ordena cada bolsa: las fichas ${v} van al montón de ${v} y las fichas de número van al montón de números. Las fichas de la misma clase se juntan.`,
    ),
    toX: (t) => pair(`${termText(t)} → ${v} pile`, `${termText(t)} → montón ${v}`),
    toNum: (t) => pair(`${termText(t)} → number pile`, `${termText(t)} → números`),
    sortCue: (t) => {
      const isVar = !!t.v;
      return isVar
        ? pair(
            `${termText(t)} is ${t.coef} ${v}-tiles. Does the number pile hold ${v}-tiles, or plain number tiles?`,
            `${termText(t)} son ${t.coef} fichas ${v}. ¿El montón de números tiene fichas ${v} o fichas de número?`,
          )
        : pair(
            `${t.coef} has no ${v}: it is plain number tiles. Is a plain tile the same kind as the ${v}-tiles, so that they stack?`,
            `${t.coef} no tiene ${v}: son fichas de número. ¿Una ficha de número es de la misma clase que una ficha ${v} para que se junten?`,
          );
    },
    pileX: (n) => `${n}${v}`,
    sortProgress: (done) =>
      pair(
        `${done} of ${terms.length} bags sorted.`,
        `${done} de ${terms.length} bolsas ordenadas.`,
      ),
    sortDone: pair(
      `Sorted: ${varSumText} = ${vk.sum}${v}, and ${conSumText} = ${ck.sum}. The ${v}-tiles and the number tiles never joined each other.`,
      `Ordenado: ${varSumText} = ${vk.sum}${v} y ${conSumText} = ${ck.sum}. Las fichas ${v} y las fichas de número nunca se juntaron.`,
    ),
    startOver: pair("Start over", "Empezar de nuevo"),
    connectSay: pair(
      `Count each kind. Like terms are the same kind of tile, so they combine: add the numbers in front. The ${v} stays. Unlike terms do not combine.`,
      `Cuenta cada clase. Los términos semejantes son la misma clase de ficha, así que se combinan: suma los números de adelante. La ${v} se queda. Los términos que no son semejantes no se combinan.`,
    ),
    connectDone: pair(
      `${varSumText} = ${vk.sum}${v} and ${conSumText} = ${ck.sum}, so ${text} = ${simple}.`,
      `${varSumText} = ${vk.sum}${v} y ${conSumText} = ${ck.sum}, así que ${text} = ${simple}.`,
    ),
    testSay: pair(
      `Does ${simple} really equal ${text}? Choose a value for ${v}: every ${v}-tile gets that length. Both expressions must give the same number. Compare them with ${all.sum}${v}, the answer that joins everything.`,
      `¿De verdad ${simple} es igual a ${text}? Elige un valor para ${v}: cada ficha ${v} tiene esa longitud. Las dos expresiones deben dar el mismo número. Compáralas con ${all.sum}${v}, la respuesta que junta todo.`,
    ),
    valueLabel: pair(`Value of ${v}`, `Valor de ${v}`),
    tryMore: (left) =>
      pair(
        left === 1 ? "Try one more value." : "Try two more values.",
        left === 1 ? "Prueba un valor más." : "Prueba dos valores más.",
      ),
    tryThree: pair(
      "Try at least three different values.",
      "Prueba al menos tres valores diferentes.",
    ),
    testRow: (x) => {
      const r = valRow(x);
      return pair(
        `${v} = ${x}: ${text} = ${r.orig}; ${simple} = ${r.simple}; ${all.sum}${v} = ${r.wrong}.`,
        `${v} = ${x}: ${text} = ${r.orig}; ${simple} = ${r.simple}; ${all.sum}${v} = ${r.wrong}.`,
      );
    },
    testDone: pair(
      `${simple} matches ${text} at every value of ${v} you tried, and ${all.sum}${v} does not. Only like terms can combine.`,
      `${simple} coincide con ${text} en cada valor de ${v} que probaste, y ${all.sum}${v} no. Solo los términos semejantes se pueden combinar.`,
    ),
    stripOrig: pair("as written", "como está escrita"),
    stripSimple: pair("combined", "combinada"),
    transferSay: pair(
      `${tr.story ? `${tr.story.en} ` : ""}${tText}. Which letter goes with which tiles? Simplify it.`,
      `${tr.story ? `${tr.story.es} ` : ""}${tText}. ¿Qué letra va con qué fichas? Simplifícala.`,
    ),
    transferQ: pair(`${tText} is the same as…`, `${tText} es igual a…`),
    transferCue(opt) {
      return {
        all: pair(
          `${opt.text} joins the ${nB.en} with the ${nA.en}. Is ${tb.v} the same kind of thing as ${ta.v}?`,
          `${opt.text} junta ${nB.es} con ${nA.es}. ¿La ${tb.v} es la misma clase de cosa que la ${ta.v}?`,
        ),
        drop: pair(
          `${opt.text} lost the letter on the second group. Are the ${tb.sum} left over plain numbers, or ${nB.en}?`,
          `${opt.text} perdió la letra del segundo grupo. ¿Los ${tb.sum} que quedan son números solos o ${nB.es}?`,
        ),
        swap: pair(
          `${opt.text} has the letters switched. Which letter belongs with ${tr.terms
            .filter((t) => t.v === ta.v)
            .map(termText)
            .join(" + ")}?`,
          `${opt.text} tiene las letras cambiadas. ¿Qué letra va con ${tr.terms
            .filter((t) => t.v === ta.v)
            .map(termText)
            .join(" + ")}?`,
        ),
      }[opt.kind];
    },
    transferOk: pair(
      `Yes: ${tr.terms
        .filter((t) => t.v === ta.v)
        .map(termText)
        .join(" + ")} = ${ta.sum}${ta.v} and ${tr.terms
        .filter((t) => t.v === tb.v)
        .map(termText)
        .join(
          " + ",
        )} = ${tb.sum}${tb.v}. ${nA.en} and ${nB.en} are different kinds, so ${tSimple} stays as two terms.`,
      `Sí: ${tr.terms
        .filter((t) => t.v === ta.v)
        .map(termText)
        .join(" + ")} = ${ta.sum}${ta.v} y ${tr.terms
        .filter((t) => t.v === tb.v)
        .map(termText)
        .join(
          " + ",
        )} = ${tb.sum}${tb.v}. ${nA.es} y ${nB.es} son clases distintas, así que ${tSimple} queda en dos términos.`,
    ),
    explainLabel: pair(
      `Explain: why can ${ta.sum}${ta.v} and ${tb.sum}${tb.v} not be combined?`,
      `Explica: ¿por qué ${ta.sum}${ta.v} y ${tb.sum}${tb.v} no se pueden combinar?`,
    ),
    explainFrame: pair(
      "Like terms have ___, so I add ___ and keep ___; unlike terms ___.",
      "Los términos semejantes tienen ___, así que sumo ___ y dejo ___; los que no son semejantes ___.",
    ),
    text,
    simple,
    tText,
    tSimple,
    tileNames: { a: nA, b: nB },
  };
}
