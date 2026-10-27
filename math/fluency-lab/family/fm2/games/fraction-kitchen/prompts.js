// The kitchen order (prompt) for each skill, in English and Spanish, built from the round's own numbers.
// Hidden-target rounds never print the target. @fm2 FM-020 FM-021 FM-053
import { toString } from "../../rational.js";
import { ING, cap, foodText, partName } from "./copy.js";
import { sci } from "./model.js";
import { cupsText, decimalOf, ms, tolText } from "./words.js";

const ing = (r, lang, i = null) => ING[i === null ? r.ingredient : r.ingredients[i]][lang];
const more = (r, lang) =>
  lang === "es"
    ? r.relation === "more"
      ? "más"
      : "menos"
    : r.relation === "more"
      ? "more"
      : "less";

const BUILD = {
  "fair-shares"(r, lang) {
    const food = foodText(r.food, lang);
    const { friends: f, serveCount: m } = r;
    if (lang === "es") {
      return m === 1
        ? `${f} amigos quieren compartir ${food.a} de forma justa. Corta ${food.the} en partes iguales y sirve la parte de un amigo.`
        : `Corta ${food.the} para que ${f} amigos reciban partes iguales. Luego sirve las partes de ${m} amigos.`;
    }
    return m === 1
      ? `${f} friends want to share ${food.a} fairly. Cut ${food.the} into equal parts, then serve one friend's share.`
      : `Cut ${food.the} so ${f} friends each get an equal share. Then serve ${m} friends' shares.`;
  },
  "fix-the-cuts"(r, lang) {
    const food = foodText(r.food, lang);
    return lang === "es"
      ? `¡Ay! ${cap(food.the)} tiene partes desiguales. Arregla los cortes para que ${r.friends} amigos reciban partes iguales.`
      : `Oops! ${cap(food.the)} has unequal parts. Fix the cuts so ${r.friends} friends each get an equal share.`;
  },
  "serve-parts"(r, lang) {
    const food = foodText(r.food, lang);
    const [a, b] = r.ask;
    if (r.den) {
      return lang === "es"
        ? `Corta ${food.the} en ${partName(b, "es")} y sirve ${a}/${b}.`
        : `Cut ${food.the} into ${partName(b, "en")} and serve ${a}/${b}.`;
    }
    return lang === "es" ? `Sirve ${a}/${b} ${food.ofthe}.` : `Serve ${a}/${b} of ${food.the}.`;
  },
  "pizza-equiv"(r, lang) {
    const food = foodText(r.food, lang);
    const ref = ms(r.ref);
    const extra = r.den
      ? lang === "es"
        ? ` Usa ${partName(r.den, "es")}.`
        : ` Use ${partName(r.den, "en")}.`
      : lang === "es"
        ? " Usa un número distinto de partes iguales."
        : " Use a different number of equal parts.";
    if (r.wholes > 1) {
      return (
        (lang === "es"
          ? `Haz un nuevo grupo de ${food.pl} que muestre la misma cantidad que ${ref} ${food.pl}.`
          : `Make a new set of ${food.pl} that shows the same amount as ${ref} ${food.pl}.`) + extra
      );
    }
    return (
      (lang === "es"
        ? `Haz ${food.a} diferente que muestre la misma cantidad que ${ref} de ${food.a}.`
        : `Make a different ${food.one} that shows the same amount as ${ref} of ${food.a}.`) + extra
    );
  },
  "compare-pieces"(r, lang) {
    const food = foodText(r.food, lang);
    const [a, b] = r.refAsk;
    const word = more(r, lang);
    if (r.mode === "sameDen") {
      return lang === "es"
        ? `Sirve ${word} de ${a}/${b} ${food.ofthe}, usando ${b} partes iguales.`
        : `Serve ${word} than ${a}/${b} of ${food.the}, using ${b} equal parts.`;
    }
    if (r.mode === "sameNum") {
      return lang === "es"
        ? `Sirve exactamente ${a} ${a > 1 ? "piezas" : "pieza"}, de modo que ${a > 1 ? "sean" : "sea"} ${word} de ${a}/${b} ${food.ofthe}. Tú eliges en cuántas partes iguales cortar.`
        : `Serve exactly ${a} piece${a > 1 ? "s" : ""} so that you serve ${word} than ${a}/${b} of ${food.the}. You choose how many equal parts to cut.`;
    }
    return lang === "es"
      ? `Con ${r.den} partes iguales, sirve ${word} de ${a}/${b} ${food.ofthe}.`
      : `Using ${r.den} equal parts, serve ${word} than ${a}/${b} of ${food.the}.`;
  },
  "line-marker"(r, lang) {
    return lang === "es"
      ? `Mueve el marcador a ${ms(r.target)} en la recta numérica.`
      : `Move the marker to ${ms(r.target)} on the number line.`;
  },
  "pour-cup"(r, lang) {
    return lang === "es"
      ? `Echa exactamente ${cupsText(r.target, "es")} de ${ing(r, "es")}.`
      : `Pour exactly ${cupsText(r.target, "en")} of ${ing(r, "en")}.`;
  },
  "tenths-cup"(r, lang) {
    const amount = r.show === "frac" ? cupsText(r.target, lang) : `${decimalCups(r, lang)}`;
    return lang === "es"
      ? `Llena la jarra con exactamente ${amount} de ${ing(r, "es")}. Cada cucharón de valor posicional echa su propia cantidad.`
      : `Fill the pitcher with exactly ${amount} of ${ing(r, "en")}. Each place-value scoop pours its own amount.`;
  },
  "mixed-scoops"(r, lang) {
    const sizes = r.scoops.map((s) => toString(s));
    const only = sizes.length === 1;
    const list = lang === "es" ? sizes.map((s) => `${s}`).join(", ") : sizes.join(", ");
    const kinds =
      r.minKinds > 1
        ? lang === "es"
          ? " Usa al menos dos tipos de cucharón."
          : " Use at least two kinds of scoop."
        : "";
    const use =
      lang === "es"
        ? only
          ? ` Usa solo cucharones de ${cupsText(r.scoops[0], "es")}.`
          : ` Puedes usar cucharones de ${list} de taza.`
        : only
          ? ` Use only ${cupsText(r.scoops[0], "en")} scoops.`
          : ` You may use scoops of ${list} cup.`;
    return lang === "es"
      ? `Llena la jarra hasta ${cupsText(r.target, "es")} de ${ing(r, "es")}.${use}${kinds}`
      : `Fill the pitcher to ${cupsText(r.target, "en")} of ${ing(r, "en")}.${use}${kinds}`;
  },
  "batch-recipe"(r, lang) {
    const only =
      r.scoops.length === 1
        ? lang === "es"
          ? ` Usa cucharones de ${cupsText(r.scoops[0], "es")}.`
          : ` Use ${cupsText(r.scoops[0], "en")} scoops.`
        : "";
    return lang === "es"
      ? `Una tanda necesita ${cupsText(r.amount, "es")} de ${ing(r, "es")}. Llena la jarra con lo necesario para ${r.batches} tandas.${only}`
      : `One batch needs ${cupsText(r.amount, "en")} of ${ing(r, "en")}. Fill the pitcher with enough for ${r.batches} batches.${only}`;
  },
  "unlike-bars"(r, lang) {
    const names = r.terms.map(
      (t, i) => `${cupsText(t, lang)} ${lang === "es" ? "de" : "of"} ${ing(r, lang, i)}`,
    );
    if (r.op === "diff") {
      return lang === "es"
        ? `La jarra tiene ${names[0]}. Sacas ${cupsText(r.terms[1], "es")}. Muestra lo que queda en la jarra, usando un solo tamaño de cucharón.`
        : `The pitcher has ${names[0]}. You pour out ${cupsText(r.terms[1], "en")}. Show what is left in the pitcher, using only one size of scoop.`;
    }
    const joined =
      names.length === 2
        ? names.join(lang === "es" ? " y " : " and ")
        : `${names.slice(0, -1).join(", ")}${lang === "es" ? " y " : " and "}${names.at(-1)}`;
    return lang === "es"
      ? `Una receta usa ${joined}. Llena la jarra con el total, usando un solo tamaño de cucharón.`
      : `A recipe uses ${joined}. Fill the pitcher with the total, using only one size of scoop.`;
  },
  "part-of-part"(r, lang) {
    const food = foodText(r.food, lang);
    return lang === "es"
      ? `Sobra ${toString(r.base)} ${food.ofthe}, marcado con la línea de rayas. Sirve ${toString(r.factor)} de lo que sobra.`
      : `${cap(food.the)} has ${toString(r.base)} left, shown by the dashed line. Serve ${toString(r.factor)} of the leftover.`;
  },
  "divide-unit"(r, lang) {
    if (r.kind === "serving") {
      return lang === "es"
        ? `La jarra tiene ${cupsText(r.amount, "es")} de ${ing(r, "es")}. Sirve porciones de ${cupsText(r.size, "es")} hasta vaciarla. ¿Cuántas porciones son?`
        : `The pitcher holds ${cupsText(r.amount, "en")} of ${ing(r, "en")}. Pour servings of ${cupsText(r.size, "en")} until it is empty. How many servings is that?`;
    }
    const food = foodText(r.food, lang);
    return lang === "es"
      ? `Sobra ${toString(r.base)} ${food.ofthe}, marcado con la línea de rayas. ${r.friends} amigos reparten lo que sobra en partes iguales. Sirve la parte de un amigo.`
      : `${cap(food.the)} has ${toString(r.base)} left, shown by the dashed line. ${r.friends} friends share the leftover equally. Serve one friend's share.`;
  },
  "divide-fractions"(r, lang) {
    return lang === "es"
      ? `La jarra tiene ${cupsText(r.amount, "es")} de ${ing(r, "es")}. Sirve porciones de ${cupsText(r.size, "es")} hasta vaciarla. ¿Cuántas porciones son?`
      : `The pitcher holds ${cupsText(r.amount, "en")} of ${ing(r, "en")}. Pour servings of ${cupsText(r.size, "en")} until it is empty. How many servings is that?`;
  },
  "percent-amount"(r, lang) {
    const whole = r.of.n === 1 && r.of.d === 1;
    if (lang === "es") {
      return whole
        ? `Echa el ${r.percent}% de una taza de ${ing(r, "es")}.`
        : `Echa el ${r.percent}% de ${cupsText(r.of, "es")} de ${ing(r, "es")}.`;
    }
    return whole
      ? `Pour ${r.percent}% of a cup of ${ing(r, "en")}.`
      : `Pour ${r.percent}% of ${cupsText(r.of, "en")} of ${ing(r, "en")}.`;
  },
  "pour-spill"(r, lang) {
    const es = lang === "es";
    const start =
      r.start.n === 0
        ? es
          ? "en la línea de llenado (0)"
          : "at the fill line (0)"
        : es
          ? `en ${ms(r.start)} (la línea de llenado es 0)`
          : `at ${ms(r.start)} (the fill line is 0)`;
    const steps = r.moves.map((m) => {
      const amount = cupsText({ n: Math.abs(m.n), d: m.d }, lang);
      return m.n > 0
        ? es
          ? `se echan ${amount}`
          : `you pour ${amount}`
        : es
          ? `se derraman ${amount}`
          : `you spill ${amount}`;
    });
    const list = steps.join(es ? ", luego " : ", then ");
    return es
      ? `El nivel empieza ${start}. Después ${list}. ¿Dónde termina el nivel? Mueve el marcador ahí.`
      : `The level starts ${start}. Then ${list}. Where does the level end? Move the marker there.`;
  },
  "repeating-decimals"(r, lang) {
    return lang === "es"
      ? `Intenta llenar la jarra con exactamente ${cupsText(r.target, "es")} de ${ing(r, "es")} usando cucharones de décimos, centésimos y milésimos. Si se puede, hazlo. Si no se puede, dilo y elige los dígitos que se repiten.`
      : `Try to fill the pitcher with exactly ${cupsText(r.target, "en")} of ${ing(r, "en")} using tenths, hundredths and thousandths scoops. If you can, do it. If you cannot, say so and pick the digits that repeat.`;
  },
  "rational-approx"(r, lang) {
    const { symbol } = r.irr;
    const tol = tolText(r.irr.tol);
    return lang === "es"
      ? `Encuentra una fracción cercana a ${symbol}. Usa como máximo ${r.irr.maxDen} marcas iguales entre los números enteros y mueve el marcador a una fracción a menos de ${tol} de ${symbol}. Luego decide si es exactamente ${symbol}.`
      : `Find a fraction close to ${symbol}. Use at most ${r.irr.maxDen} equal marks between whole numbers and move the marker to a fraction within ${tol} of ${symbol}. Then decide if it is exactly ${symbol}.`;
  },
  "sci-measures"(r, lang) {
    const amount = r.terms.map(sci).join(" + ");
    return lang === "es"
      ? `Una receta necesita ${amount} de taza de ${ing(r, "es")}. Llena la jarra con exactamente esa cantidad usando cucharones de valor posicional.`
      : `A recipe needs ${amount} cup of ${ing(r, "en")}. Fill the pitcher with exactly that amount using place-value scoops.`;
  },
};

function decimalCups(r, lang) {
  const text = decimalOf(r.target);
  const plural = r.target.n > r.target.d;
  return lang === "es"
    ? `${text} ${plural ? "tazas" : "de taza"}`
    : `${text} ${plural ? "cups" : "cup"}`;
}

export function promptFor(round) {
  const make = BUILD[round.skillId];
  return { en: make(round, "en"), es: make(round, "es") };
}
