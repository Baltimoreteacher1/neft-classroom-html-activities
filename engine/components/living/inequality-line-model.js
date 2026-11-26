// living/inequality-line-model.js — mathematics and words of the inequality-line
// play (lessons 8-4 "write" and 8-5 "graph"), with no DOM.
//
// An inequality has MANY solutions. The play tests values on a number line,
// finds which ones work, and turns that into a symbol (8-4) or into a circle and
// a shaded ray (8-5). Every cue is a question that makes the student test a
// value; no wrong pick prints the answer.
//
//   write: "at least 18" → a ≥ 18 (which symbol? does 18 itself count?)
//   graph: t ≥ 2 → closed circle at 2, shade right (open or closed? which way?)

import { okInt, placeCorrect } from "./mean-balance-model.js";

export { okInt, placeCorrect };

export const SYMS = ["<", ">", "≤", "≥"];
export const pair = (en, es) => ({ en, es });
export const clean = (p, max = 300) =>
  p && typeof p.en === "string" && p.en.trim()
    ? {
        en: p.en.trim().slice(0, max),
        es: String(p.es || p.en)
          .trim()
          .slice(0, max),
      }
    : null;

/** Does x make "x sym limit" true? */
export const holds = (sym, x, limit) =>
  ({ "<": x < limit, ">": x > limit, "≤": x <= limit, "≥": x >= limit })[sym];
export const isClosed = (sym) => sym === "≤" || sym === "≥";
export const dirOf = (sym) => (sym === "<" || sym === "≤" ? "left" : "right");
/** The symbol with the same direction and the other inclusiveness. */
export const flipIncl = (sym) => ({ "<": "≤", "≤": "<", ">": "≥", "≥": ">" })[sym];
/** The symbol with the other direction and the same inclusiveness. */
export const flipDir = (sym) => ({ "<": ">", ">": "<", "≤": "≥", "≥": "≤" })[sym];
/** A value that makes it true, close to the limit (never the limit itself). */
export const insideValue = (sym, limit) => (dirOf(sym) === "right" ? limit + 1 : limit - 1);
/** A value that makes it false, two away from the limit on the other side. */
export const outsideValue = (sym, limit) => (dirOf(sym) === "right" ? limit - 2 : limit + 2);

/** The number line for a boundary: eleven whole numbers around it, never below 0. */
export function rangeFor(limit) {
  const lo = Math.max(0, limit - 5);
  return { lo, hi: lo + 10, step: 1 };
}

export function validCase(c) {
  const limit = Number(c?.limit);
  const letter = typeof c?.letter === "string" && /^[a-z]$/i.test(c.letter) ? c.letter : "x";
  const story = clean(c?.story);
  if (!SYMS.includes(c?.sym) || !okInt(limit, 2, 99) || !story) return null;
  return { sym: c.sym, limit, letter, story, phrase: clean(c?.phrase, 60) };
}

export function validateInequalityLine(cfg) {
  if (!cfg || typeof cfg !== "object" || cfg.mode !== "write") return null;
  const main = validCase(cfg);
  const transfer = validCase(cfg.transfer);
  if (!main || !transfer || transfer.sym === main.sym) return null;
  if (!main.phrase || !transfer.phrase) return null;
  // The transfer must not be answerable by copying the main case's picture.
  if (dirOf(transfer.sym) === dirOf(main.sym) && isClosed(transfer.sym) === isClosed(main.sym))
    return null;
  return { mode: "write", main, transfer };
}

// ---- choices ---------------------------------------------------------------

/** "Which numbers does it allow?" — the solution set, with three real slips. */
export function setChoices(c) {
  const { sym, limit: L } = c;
  const word = (dir) => ({
    en: dir === "right" ? "greater" : "less",
    es: dir === "right" ? "mayores" : "menores",
  });
  const incl = (dir) =>
    pair(
      `${L} and every number ${word(dir).en} than ${L}`,
      `El ${L} y todos los números ${word(dir).es} que ${L}`,
    );
  const excl = (dir) =>
    pair(
      `Every number ${word(dir).en} than ${L}, but not ${L}`,
      `Todos los números ${word(dir).es} que ${L}, pero no el ${L}`,
    );
  const d = dirOf(sym);
  const other = d === "right" ? "left" : "right";
  const ph = c.phrase;
  const ask = (v) => pair(`Test ${v}: is ${v} ${ph.en}? `, `Prueba el ${v}: ¿es ${v} ${ph.es}? `);
  const cat = (a, tail) => pair(a.en + tail.en, a.es + tail.es);
  const options = [
    {
      id: "ok",
      label: isClosed(sym) ? incl(d) : excl(d),
      correct: true,
    },
    {
      id: "only",
      v: insideValue(sym, L),
      label: pair(`Only ${L}`, `Solo el ${L}`),
      cue: cat(
        ask(insideValue(sym, L)),
        pair(
          `Could ${L} be the only number that works?`,
          `¿Podría el ${L} ser el único número que sirve?`,
        ),
      ),
    },
    {
      id: "opp",
      v: outsideValue(sym, L),
      label: isClosed(sym) ? incl(other) : excl(other),
      cue: cat(
        ask(outsideValue(sym, L)),
        pair("Does that match the numbers you picked?", "¿Coincide con los números que elegiste?"),
      ),
    },
    {
      id: "flip",
      v: L,
      label: isClosed(sym) ? excl(d) : incl(d),
      cue: cat(
        ask(L),
        pair(
          `Does ${L} itself count? Compare with your answer.`,
          `¿El ${L} mismo cuenta? Compáralo con tu respuesta.`,
        ),
      ),
    },
  ];
  return placeCorrect(options, L + sym.charCodeAt(0));
}

/** The verdict a tested value gets in "write" mode: no symbol, only the words. */
export function verdictWords(c, v) {
  const ok = holds(c.sym, v, c.limit);
  return pair(
    `${v}: is it ${c.phrase.en}? ${ok ? "Yes ✓" : "No ✗"}`,
    `${v}: ¿es ${c.phrase.es}? ${ok ? "Sí ✓" : "No ✗"}`,
  );
}
/** Which tests a student must make before the symbol: the boundary and both sides. */
export function testsDone(c, seen) {
  return {
    boundary: seen.includes(c.limit),
    inside: seen.some((v) => v !== c.limit && holds(c.sym, v, c.limit)),
    outside: seen.some((v) => !holds(c.sym, v, c.limit)),
  };
}

/** "Which symbol?" — a wrong symbol's cue makes the student test a value. */
export function symbolChoices(c) {
  const { sym, limit: L } = c;
  const inside = insideValue(sym, L);
  const options = SYMS.map((s) => {
    const html = `<span style="font-size:1.5em;line-height:1">${s}</span>`;
    if (s === sym) return { id: s, label: pair(s, s), html, correct: true };
    const sameDir = dirOf(s) === dirOf(sym);
    return {
      id: s,
      label: pair(s, s),
      html,
      v: sameDir ? L : inside,
      cue: sameDir
        ? pair(
            `Is ${L} ${c.phrase.en}? Does ${L} ${s} ${L} hold? Compare the two answers.`,
            `¿Es ${L} ${c.phrase.es}? ¿Se cumple ${L} ${s} ${L}? Compara las dos respuestas.`,
          )
        : pair(
            `Is ${inside} ${c.phrase.en}? Is ${inside} ${s} ${L} true? Compare the two answers.`,
            `¿Es ${inside} ${c.phrase.es}? ¿Es verdadero ${inside} ${s} ${L}? Compara las dos respuestas.`,
          ),
    };
  });
  return placeCorrect(options, L + sym.charCodeAt(0) + 1);
}

// ---- words -----------------------------------------------------------------

const lowerFirst = (t) => t.charAt(0).toLowerCase() + t.slice(1);

/**
 * Every sentence the play says, as {en, es} pairs, from a validated config.
 * @returns {any}
 */
export function lineCopy(v) {
  const { mode, main: c, transfer: t } = v;
  const L = c.limit;
  const kicker = pair("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo");
  const sc = (...xs) => xs.map(([en, es]) => pair(en, es));
  const closedTxt = (s) =>
    isClosed(s)
      ? pair("closed circle ● (included)", "círculo cerrado ● (incluido)")
      : pair("open circle ○ (not included)", "círculo abierto ○ (no incluido)");
  const solved = (q) => `${q.letter} ${q.sym} ${q.limit}`;
  const common = {
    kicker,
    marker: (q) =>
      isClosed(q.sym) ? pair("● included", "● incluido") : pair("○ not included", "○ no incluido"),
    tryFirst: pair(
      "Slide to a value to test it. Try the boundary number itself, one value that works, and one that does not.",
      "Desliza a un valor para probarlo. Prueba el número límite, un valor que sirve y uno que no.",
    ),
    needBoundary: (q) =>
      pair(
        `Now test the boundary number, ${q.limit}.`,
        `Ahora prueba el número límite, ${q.limit}.`,
      ),
    needInside: pair("Now find a value that works.", "Ahora encuentra un valor que sirva."),
    needOutside: pair(
      "Now find a value that does not work.",
      "Ahora encuentra un valor que no sirva.",
    ),
  };
  if (mode === "write") {
    const ph = c.phrase;
    return {
      ...common,
      title: pair("Many values, one rule", "Muchos valores, una regla"),
      ariaLabel: pair(
        `A number line from ${rangeFor(L).lo} to ${rangeFor(L).hi}. Test values to find which ones fit “${ph.en}”.`,
        `Una recta numérica de ${rangeFor(L).lo} a ${rangeFor(L).hi}. Prueba valores para ver cuáles cumplen «${ph.es}».`,
      ),
      printSummary: pair(
        `${c.story.en} “${ph.en}” allows ${setChoices(c)
          .find((o) => o.correct)
          .label.en.replace(
            /^E/,
            "e",
          )}, so the inequality is ${solved(c)}. “${t.phrase.en}” gives ${solved(t)}.`,
        `${c.story.es} «${ph.es}» permite ${lowerFirst(setChoices(c).find((o) => o.correct).label.es)}, así que la desigualdad es ${solved(c)}. «${t.phrase.es}» da ${solved(t)}.`,
      ),
      labels: sc(
        ["The rule", "La regla"],
        ["Predict", "Predice"],
        ["Test values", "Prueba valores"],
        ["The symbol", "El símbolo"],
        ["On your own", "Por tu cuenta"],
      ),
      situateSay: pair(
        `${c.story.en} Many numbers could fit “${ph.en}”, not just one. A number line can show them.`,
        `${c.story.es} Muchos números podrían cumplir «${ph.es}», no solo uno. Una recta numérica puede mostrarlos.`,
      ),
      topWords: ph,
      predictSay: pair(
        `Before testing anything: which numbers fit “${ph.en}”?`,
        `Antes de probar nada: ¿qué números cumplen «${ph.es}»?`,
      ),
      predictQ: pair(`“${ph.en}” allows…`, `«${ph.es}» permite…`),
      predictOk: pair(
        "Good prediction. Now test values on the number line to check it.",
        "Buena predicción. Ahora prueba valores en la recta numérica para comprobarla.",
      ),
      testSay: common.tryFirst,
      testDone: pair(
        `You tested the boundary, a value that works and one that does not. Next, write what you found with a symbol.`,
        `Probaste el límite, un valor que sirve y uno que no. Ahora escribe lo que encontraste con un símbolo.`,
      ),
      verdict: (x) => verdictWords(c, x),
      symbolSay: pair(
        `Which symbol says “${ph.en}”? Think about your test of ${L}.`,
        `¿Qué símbolo dice «${ph.es}»? Piensa en tu prueba del ${L}.`,
      ),
      symbolQ: pair(`${c.letter} ___ ${L}`, `${c.letter} ___ ${L}`),
      symbolOk: pair(
        `${solved(c)}: ${closedTxt(c.sym).en} at ${L}, and the ray shows every number that works.`,
        `${solved(c)}: ${closedTxt(c.sym).es} en ${L}, y el rayo muestra todos los números que sirven.`,
      ),
      transferSay: pair(
        `${t.story.en} Which symbol says “${t.phrase.en}”?`,
        `${t.story.es} ¿Qué símbolo dice «${t.phrase.es}»?`,
      ),
      transferQ: pair(`${t.letter} ___ ${t.limit}`, `${t.letter} ___ ${t.limit}`),
      transferOk: pair(
        `${solved(t)}: “${t.phrase.en}” ${isClosed(t.sym) ? "includes" : "leaves out"} ${t.limit}, so the circle is ${isClosed(t.sym) ? "closed" : "open"}.`,
        `${solved(t)}: «${t.phrase.es}» ${isClosed(t.sym) ? "incluye" : "deja fuera"} el ${t.limit}, así que el círculo es ${isClosed(t.sym) ? "cerrado" : "abierto"}.`,
      ),
      explainLabel: pair(
        "Explain: how do the words tell you which symbol to use?",
        "Explica: ¿cómo te dicen las palabras qué símbolo usar?",
      ),
      explainFrame: pair(
        "“At least” and “at most” ___ the number, so I use ___. “More than” and “less than” ___ it.",
        "«Al menos» y «como máximo» ___ el número, así que uso ___. «Más de» y «menos de» lo ___.",
      ),
    };
  }
}
