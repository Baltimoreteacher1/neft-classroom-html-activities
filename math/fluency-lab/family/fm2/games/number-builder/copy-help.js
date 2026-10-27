// Feedback that names the likely mistake, plus the plain-text recipe of a build. Each message is {en, es}.
// @fm2 FM-007 FM-020 FM-033
import { recipe } from "./copy-recipe.js";
import { pieceName, ruleText } from "./copy-text.js";
import { fmtNum } from "./words.js";

export { hint } from "./copy-hints.js";
export { answerKey, recipe } from "./copy-recipe.js";

export function success(round, builds, results) {
  const make = (lang) => {
    const line = (b, r) => {
      if (round.mode === "chart")
        return lang === "en"
          ? `You made ${recipe(round, b, lang)}.`
          : `Formaste ${recipe(round, b, lang)}.`;
      if (round.mode === "sci") return `${lang === "en" ? "That works" : "Funciona"}: ${recipe(round, b, lang)} = ${fmtNum(r.value)}.`;
      return lang === "en"
        ? `You built ${fmtNum(r.value)} with ${recipe(round, b, lang)}.`
        : `Construiste ${fmtNum(r.value)} con ${recipe(round, b, lang)}.`;
    };
    return builds
      .map(
        (b, i) =>
          (builds.length > 1 ? `${lang === "en" ? "Build" : "Construcción"} ${i + 1}: ` : "") +
          line(b, results[i]),
      )
      .join(" ");
  };
  return { en: make("en"), es: make("es") };
}

const MSG = {
  invalid: [
    "That build could not be read. Use “Reset this puzzle” and build again.",
    "No pude leer esa construcción. Usa “Reiniciar este reto” y construye otra vez.",
  ],
  empty: [
    "There is nothing built yet. Add pieces until your total is the goal.",
    "Todavía no hay nada construido. Agrega piezas hasta llegar a la meta.",
  ],
  signFlip: [
    "Your build is worth {value}, the opposite of the goal. Check which sign you need: a negative chip counts against the total.",
    "Tu construcción vale {value}, lo opuesto de la meta. Revisa qué signo necesitas: una ficha negativa resta del total.",
  ],
  tenTimes: [
    "Your build is worth {value}, ten times the goal. Check the value printed on each piece you used: a piece may be one place too big.",
    "Tu construcción vale {value}, diez veces la meta. Mira el valor de cada pieza que usaste: alguna puede ser un lugar más grande.",
  ],
  tenth: [
    "Your build is worth {value}, only one tenth of the goal. Check the value printed on each piece: you may need pieces one place bigger.",
    "Tu construcción vale {value}, solo una décima parte de la meta. Mira el valor de cada pieza: quizás necesites piezas un lugar más grandes.",
  ],
  swapped: [
    "Two places are the wrong way round: the number of {a} and the number of {b} should trade places. Your total is {value}.",
    "Dos lugares están al revés: la cantidad de {a} y la de {b} deben cambiar de lugar. Tu total es {value}.",
  ],
  countedPieces: [
    "You used {total} pieces and your total is {value}. A piece counts for its printed value, not for 1, so add up the values, not the pieces.",
    "Usaste {total} piezas y tu total es {value}. Cada pieza cuenta por su valor, no por 1: suma los valores, no las piezas.",
  ],
  notZero: [
    "Your pieces are worth {value}, not 0. Pair every piece with an opposite of the same size; anything left without a partner keeps the total away from 0.",
    "Tus piezas valen {value}, no 0. Empareja cada pieza con su opuesta del mismo tamaño; lo que quede sin pareja aleja el total de 0.",
  ],
  tooMuch: [
    "Your build is worth {value}, which is {diff} more than the goal. Take some pieces away.",
    "Tu construcción vale {value}, que es {diff} más que la meta. Quita algunas piezas.",
  ],
  tooLittle: [
    "Your build is worth {value}, which is {diff} less than the goal. Add more pieces.",
    "Tu construcción vale {value}, que es {diff} menos que la meta. Agrega más piezas.",
  ],
  rule: [
    "The total is right, but one rule is not met: {rule} (you have {have}). Change the pieces and keep the total.",
    "El total es correcto, pero no se cumple una regla: {rule} (tienes {have}). Cambia las piezas y conserva el total.",
  ],
  sameBuild: [
    "Both builds use exactly the same pieces. Make the second one with a different number of at least one kind of piece.",
    "Las dos construcciones usan exactamente las mismas piezas. Haz la segunda con una cantidad distinta de al menos un tipo de pieza.",
  ],
  needTwo: [
    "This puzzle needs two different builds. Keep one build, then make another.",
    "Este reto necesita dos construcciones diferentes. Guarda una y haz otra.",
  ],
  notAllTiles: [
    "{left} place(s) are still empty. Use every tile.",
    "Todavía hay {left} lugar(es) vacío(s). Usa todas las fichas.",
  ],
  leadingZero: [
    "A number cannot start with 0 here. Put a different tile in the first place.",
    "Aquí un número no puede empezar con 0. Pon otra ficha en el primer lugar.",
  ],
  reversed: [
    "{value} is the opposite extreme: the puzzle asks for the other one. Think about which tiles belong in the highest places.",
    "{value} es el extremo contrario: el reto pide el otro. Piensa qué fichas van en los lugares más altos.",
  ],
  notLargest: [
    "{value} can be beaten: these tiles can make a larger number. Look at each place from the left. Is there a bigger tile that could go there?",
    "Se puede superar {value}: con estas fichas se forma un número mayor. Mira cada lugar desde la izquierda: ¿hay una ficha mayor que pueda ir ahí?",
  ],
  notSmallest: [
    "{value} can be beaten: these tiles can make a smaller number. Look at each place from the left. Is there a smaller tile that could go there?",
    "Se puede superar {value}: con estas fichas se forma un número menor. Mira cada lugar desde la izquierda: ¿hay una ficha menor que pueda ir ahí?",
  ],
  odd: [
    "{value} is odd. An even number must end in an even digit, so choose the tile for the ones place first.",
    "{value} es impar. Un número par debe terminar en una cifra par, así que elige primero la ficha de las unidades.",
  ],
  farther: [
    "{value} is {dist} away from the goal, and a different arrangement gets closer. Try changing the leftmost places first.",
    "{value} está a {dist} de la meta y otra disposición se acerca más. Prueba cambiando primero los lugares de la izquierda.",
  ],
  notNormalized: [
    "The value is right, but the coefficient {coef} is not at least 1 and less than 10. Scientific notation has exactly one nonzero digit before the decimal point.",
    "El valor es correcto, pero el coeficiente {coef} no es mayor o igual que 1 y menor que 10. La notación científica tiene exactamente una cifra distinta de cero antes del punto decimal.",
  ],
  expRule: [
    "The value is right, but this rule is not met: {rule}. Change the exponent and adjust the coefficient to keep the value.",
    "El valor es correcto, pero no se cumple esta regla: {rule}. Cambia el exponente y ajusta el coeficiente para conservar el valor.",
  ],
  keptCoef: [
    "You kept the coefficient and changed the exponent, so the value changed. When the exponent changes, the coefficient has to change too, to keep the same value.",
    "Conservaste el coeficiente y cambiaste el exponente, así que cambió el valor. Si cambia el exponente, el coeficiente también debe cambiar para conservar el valor.",
  ],
  expSign: [
    "The digits are right but the exponent has the wrong sign. Numbers 10 or larger use a positive exponent; numbers between 0 and 1 use a negative one.",
    "Las cifras están bien, pero el exponente tiene el signo equivocado. Los números de 10 o más usan exponente positivo; los números entre 0 y 1 usan exponente negativo.",
  ],
  expOff: [
    "The digits are right but the exponent is off: your number is {scale} the goal. Count the places the decimal point moves again.",
    "Las cifras están bien, pero el exponente no: tu número es {scale} la meta. Cuenta otra vez cuántos lugares se mueve el punto decimal.",
  ],
  sciMore: [
    "Your number is {value}, which is more than the goal. Check the digits and the exponent.",
    "Tu número es {value}, que es mayor que la meta. Revisa las cifras y el exponente.",
  ],
  sciLess: [
    "Your number is {value}, which is less than the goal. Check the digits and the exponent.",
    "Tu número es {value}, que es menor que la meta. Revisa las cifras y el exponente.",
  ],
  sciEmpty: [
    "The coefficient is 0, so the number is 0. Set the digits first, then the exponent.",
    "El coeficiente es 0, así que el número es 0. Pon primero las cifras y luego el exponente.",
  ],
};

const fill = (text, vars) =>
  text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));

export function feedback(round, e, which = 0) {
  const make = (lang) => {
    const li = lang === "en" ? 0 : 1;
    const vars = { ...e.vars };
    for (const k of ["value", "diff", "coef", "dist"])
      if (vars[k] !== undefined) vars[k] = fmtNum(String(vars[k]));
    if (vars.rule) vars.rule = ruleText(round, vars.rule, lang);
    for (const k of ["a", "b"])
      if (vars[k])
        vars[k] = pieceName(
          round.pieces.find((p) => p.id === vars[k]),
          lang,
          2,
        );
    if (vars.k !== undefined)
      vars.scale =
        vars.k > 0
          ? `${fmtNum(String(10 ** vars.k))} ${lang === "en" ? "times" : "veces"}`
          : `1/${fmtNum(String(10 ** -vars.k))} ${lang === "en" ? "of" : "de"}`;
    const text = fill(MSG[e.key][li], vars);
    const prefix = which ? `${lang === "en" ? "Build" : "Construcción"} ${which}: ` : "";
    return prefix + text;
  };
  return { en: make("en"), es: make("es") };
}
