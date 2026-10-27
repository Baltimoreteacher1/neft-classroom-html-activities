// Feedback that names the likely mistake. A wrong rule is answered with the first clue it contradicts, never with
// the rule itself; a right rule with a wrong prediction is answered with the slip that matches the learner's number.
// @fm2 FM-063 FM-060
import { fmt, L } from "../../lang.js";
import { UI } from "./copy.js";
import { quantity } from "./copy-prompts.js";

const both = (en, es, vars = {}) => ({
  en: fmt(en, typeof vars === "function" ? vars("en") : vars),
  es: fmt(es, typeof vars === "function" ? vars("es") : vars),
});
const named =
  (round, extra = {}) =>
  (lang) => ({
    in: quantity(round, "in", lang),
    out: quantity(round, "out", lang),
    v: round.vars,
    ...extra,
  });
const symbol = (id, lang) => L(UI.symbols[id], lang);
const result = (mistake, feedback) => ({ correct: false, mistake, feedback });

const UNREADABLE = {
  empty: [
    "Write your rule first. Use the letter {v} for the “{in}”.",
    "Escribe primero tu regla. Usa la letra {v} para «{in}».",
  ],
  paren: [
    "I could not read your rule: check that every ( has a matching ).",
    "No pude leer tu regla: revisa que cada ( tenga su ) pareja.",
  ],
  shape: [
    "I could not read your rule: look for two numbers in a row, a missing number, or a sign in the wrong place.",
    "No pude leer tu regla: busca dos números seguidos, un número que falta o un signo fuera de lugar.",
  ],
  symbol: [
    "I could not read your rule: use only numbers, the letter {v}, + − × ÷ and parentheses.",
    "No pude leer tu regla: usa solo números, la letra {v}, + − × ÷ y paréntesis.",
  ],
  other: [
    "That rule is too long or too tangled to read. Try a shorter one.",
    "Esa regla es muy larga o muy enredada para leerla. Prueba con una más corta.",
  ],
};

export function unreadable(round, code) {
  if (code === "constant") {
    return result(
      "constant-rule",
      both(
        "Your rule never uses the letter {v}, so every “{in}” would give the same “{out}”. The machine's “{out}” changes when the “{in}” changes.",
        "Tu regla nunca usa la letra {v}, así que cada «{in}» daría el mismo valor de «{out}». La «{out}» de la máquina cambia cuando cambia la «{in}».",
        named(round),
      ),
    );
  }
  const [en, es] = UNREADABLE[code] || UNREADABLE.other;
  return result("unreadable", both(en, es, named(round)));
}

export function emptyCore() {
  return result(
    "empty-core",
    both(
      "Build your core first: tap the shapes that repeat.",
      "Primero arma tu núcleo: toca las figuras que se repiten.",
    ),
  );
}

export function clue(round, row, got) {
  const vars = named(round, { x: row.x, y: row.yText, got: got ? got : "" });
  return result(
    "clue-contradiction",
    got
      ? both(
          "Check your clue table. When the “{in}” was {x}, the machine gave {y}, but your rule gives {got}.",
          "Revisa tu tabla de pistas. Cuando «{in}» fue {x}, la máquina dio {y}, pero tu regla da {got}.",
          (lang) => ({ ...vars(lang), got }),
        )
      : both(
          "Check your clue table. When the “{in}” was {x}, the machine gave {y}, but your rule gives no answer for {x}.",
          "Revisa tu tabla de pistas. Cuando «{in}» fue {x}, la máquina dio {y}, pero tu regla no da respuesta para {x}.",
          (lang) => ({ ...vars(lang), y: row.yText }),
        ),
  );
}

export function cycleClue(round, position, shown, got) {
  return result(
    "clue-contradiction",
    both(
      "Check your clues. Cell {n} showed {a}, but your core makes it {b}.",
      "Revisa tus pistas. La casilla {n} mostró {a}, pero tu núcleo pone {b}.",
      (lang) => ({ n: position, a: withArticle(shown, lang), b: withArticle(got, lang) }),
    ),
  );
}

// "a star" / "una estrella": enough grammar for the four shapes.
const FEMININE = new Set(["star"]);
function withArticle(id, lang) {
  const word = symbol(id, lang);
  if (lang === "en") return `a ${word}`;
  return `${FEMININE.has(id) ? "una" : "un"} ${word}`;
}

export function fewClues(round, count, kind) {
  if (kind === "cycle") {
    return result(
      "too-few-clues",
      both(
        "Your core fits what you have seen, but you have only {n} cells showing. Reveal the next cells, in order, to be sure the pattern really repeats this way.",
        "Tu núcleo coincide con lo que viste, pero solo hay {n} casillas visibles. Descubre las siguientes casillas, en orden, para estar seguro de que el patrón se repite así.",
        { n: count },
      ),
    );
  }
  const note = round.say?.op === "both" || round.cls?.id === "linear";
  return result(
    "too-few-clues",
    note
      ? both(
          "Your rule fits your clues, but {n} different “{in}” clues are not enough to tell an adding pattern from a multiplying one, or a straight one from a curved one. Probe one more “{in}”.",
          "Tu regla coincide con tus pistas, pero {n} pistas de «{in}» distintas no bastan para distinguir un patrón que suma de uno que multiplica, ni uno recto de uno curvo. Prueba otra «{in}».",
          named(round, { n: count }),
        )
      : both(
          "Your rule fits your clues, but you have only {n} different “{in}” clue. One clue fits many rules: 2 + 2 and 2 × 2 both make 4. Probe a different “{in}” and test your rule again.",
          "Tu regla coincide con tus pistas, pero solo tienes {n} pista de «{in}» distinta. Una pista coincide con muchas reglas: 2 + 2 y 2 × 2 dan 4. Prueba otra «{in}» y vuelve a probar tu regla.",
          named(round, { n: count }),
        ),
  );
}

export function unseen(round, kind) {
  if (kind === "cycle") {
    return result(
      "unseen-cell",
      both(
        "Your core fits every cell you revealed, but the pattern disagrees with it somewhere you have not looked. Reveal more cells and compare, or press Reset this puzzle for fresh probes.",
        "Tu núcleo coincide con todas las casillas que descubriste, pero el patrón no coincide en algún lugar que no has mirado. Descubre más casillas y compara, o pulsa Reiniciar este reto para tener pruebas nuevas.",
      ),
    );
  }
  return result(
    "unseen-input",
    both(
      "Your rule fits every clue so far, but the machine disagrees with it somewhere you have not looked. Probe a new “{in}”, a bigger one, and compare. If you are out of probes, press Reset this puzzle for a fresh set.",
      "Tu regla coincide con todas las pistas hasta ahora, pero la máquina no coincide en algún lugar que no has mirado. Prueba una «{in}» nueva, más grande, y compara. Si no te quedan pruebas, pulsa Reiniciar este reto.",
      named(round),
    ),
  );
}

const CLASS_HELP = {
  parity: [
    "Check again. Write out the first terms and look at the ones digit of each: do they stay the same kind, or do they switch?",
    "Revisa otra vez. Escribe los primeros términos y mira el dígito de las unidades de cada uno: ¿siguen siendo del mismo tipo o cambian?",
  ],
  prop: [
    "Check again. In a proportional relationship the output is always the same number of times the input, so an input of 0 gives an output of 0. What does your table show?",
    "Revisa otra vez. En una relación proporcional la salida es siempre las mismas veces la entrada, así que una entrada de 0 da una salida de 0. ¿Qué muestra tu tabla?",
  ],
  linear: [
    "Check again. A linear function changes by the same amount every time the input goes up by 1. Do the changes in your table stay equal?",
    "Revisa otra vez. Una función lineal cambia la misma cantidad cada vez que la entrada sube 1. ¿Los cambios de tu tabla siguen iguales?",
  ],
  dep: [
    "Check again. The dependent variable is the quantity that is worked out from the other one.",
    "Revisa otra vez. La variable dependiente es la cantidad que se calcula a partir de la otra.",
  ],
  times: [
    "Check again. Pick a step, then divide machine B's term by machine A's term at that same step.",
    "Revisa otra vez. Elige un paso y divide el término de la máquina B entre el de la máquina A en ese mismo paso.",
  ],
};

export const wrongClass = (id) => result("wrong-class", both(CLASS_HELP[id][0], CLASS_HELP[id][1]));
export const missingClass = () =>
  result("missing-class", both(UI.incompleteClass.en, UI.incompleteClass.es));

export function missingFar(round) {
  return result(
    "missing-prediction",
    round.form === "cycle"
      ? both(
          "Choose the shape you predict for cell {far}.",
          "Elige la figura que predices para la casilla {far}.",
          { far: round.far },
        )
      : both(
          "Add your prediction. Use your rule on the “{in}” {far}.",
          "Agrega tu predicción. Usa tu regla con la «{in}» {far}.",
          named(round, { far: round.far }),
        ),
  );
}

const FAR = {
  "far-off-by-one": [
    "Your rule is right! But your prediction matches the “{in}” {other}, not {far}. Check which one the question asks about.",
    "¡Tu regla es correcta! Pero tu predicción corresponde a «{in}» {other}, no a {far}. Revisa cuál pide la pregunta.",
  ],
  "far-dropped-constant": [
    "Your rule is right, but your prediction leaves out the adding or subtracting part. Use every step of your rule.",
    "Tu regla es correcta, pero tu predicción se salta la parte de sumar o restar. Usa todos los pasos de tu regla.",
  ],
  "far-dropped-multiplier": [
    "Your rule is right, but your prediction leaves out the multiplying part. Use every step of your rule.",
    "Tu regla es correcta, pero tu predicción se salta la parte de multiplicar. Usa todos los pasos de tu regla.",
  ],
  "far-one-step": [
    "Your rule is right, but your prediction goes only one step past your last clue. The “{in}” {far} is much farther away, so use the rule.",
    "Tu regla es correcta, pero tu predicción avanza solo un paso desde tu última pista. La «{in}» {far} está mucho más lejos; usa la regla.",
  ],
  "far-repeated-multiplying": [
    "Your rule is right, but you multiplied by the ratio only once. Multiply again and again, as many times as the rule says.",
    "Tu regla es correcta, pero multiplicaste por la razón una sola vez. Multiplica una y otra vez, tantas veces como dice la regla.",
  ],
  "far-doubled-not-squared": [
    "Your rule is right, but you doubled the input where the rule squares it. Squaring means the input times itself.",
    "Tu regla es correcta, pero duplicaste la entrada donde la regla la eleva al cuadrado. Elevar al cuadrado es multiplicar la entrada por sí misma.",
  ],
  "far-arithmetic": [
    "Your rule is right, but the calculation slipped. Put {far} into your rule and work each step slowly.",
    "Tu regla es correcta, pero se escapó un error de cálculo. Pon {far} en tu regla y haz cada paso despacio.",
  ],
  "far-last-seen": [
    "Your core is right, but you chose the last shape you saw. The pattern keeps repeating, so work out where cell {far} falls inside the core.",
    "Tu núcleo es correcto, pero elegiste la última figura que viste. El patrón sigue repitiéndose; busca dónde cae la casilla {far} dentro del núcleo.",
  ],
  "far-cycle-off-by-one": [
    "Your core is right! But that shape belongs to cell {other}, not cell {far}. Count which cell the question asks about.",
    "¡Tu núcleo es correcto! Pero esa figura es de la casilla {other}, no de la {far}. Cuenta qué casilla pide la pregunta.",
  ],
  "far-cycle-count": [
    "Your core is right. Count how many whole cores fit before cell {far}, then see how many cells are left over.",
    "Tu núcleo es correcto. Cuenta cuántos núcleos completos caben antes de la casilla {far} y mira cuántas casillas sobran.",
  ],
};

export function farSlip(round, key, extra = {}) {
  const [en, es] = FAR[key];
  return result(key, both(en, es, named(round, { far: round.far, ...extra })));
}

export const GOOD = {
  rule: {
    en: "You found the rule and your prediction matches it.",
    es: "Encontraste la regla y tu predicción coincide con ella.",
  },
  core: {
    en: "You found the core and your prediction matches it.",
    es: "Encontraste el núcleo y tu predicción coincide con él.",
  },
};
