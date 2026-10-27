// Hint ladder for Number Builder. Tier 0 nudges, tier 1 names a strategy, tier 2 works a PARALLEL example (never this
// round's numbers), tier 3 states the full solution. Tiers 0-2 never contain the answer. @fm2 FM-007 FM-020 FM-032
import { add, div, frac, fromDecimal, mul, toDecimalString } from "../../rational.js";
import { answerKey, byValueDesc, recipe } from "./copy-recipe.js";
import { pieceName } from "./copy-text.js";
import { fmtNum } from "./words.js";

const family = (round) =>
  round.mode === "chart"
    ? "chart"
    : round.mode === "sci"
      ? round.expr
        ? "scieq"
        : "sci"
      : round.kit;
const ruled = (round) => round.constraints.length > 0 || round.ways === 2;

const NUDGE = {
  counters: [
    "Count the counters on the frame. Is your count too big or too small? Add one or take one away.",
    "Cuenta las fichas del cuadro. ¿Tu cantidad es muy grande o muy pequeña? Agrega una o quita una.",
  ],
  pieces: [
    "Read the total under the mat. Is it more or less than the goal? Add or take away a piece and watch the total change.",
    "Lee el total debajo de la mesa. ¿Es mayor o menor que la meta? Agrega o quita una pieza y mira cómo cambia el total.",
  ],
  chips: [
    "Read the total. A positive chip and a negative chip of the same size cancel each other. Which kind of chip moves you toward the goal?",
    "Lee el total. Una ficha positiva y una negativa del mismo tamaño se cancelan. ¿Qué tipo de ficha te acerca a la meta?",
  ],
  chart: [
    "Try a tile in each place and read the number it makes. Which places change the number the most?",
    "Prueba una ficha en cada lugar y lee el número que forma. ¿Qué lugares cambian más el número?",
  ],
  sci: [
    "Say your number out loud, then compare it with the goal. Are they worth the same?",
    "Di tu número en voz alta y compáralo con la meta. ¿Valen lo mismo?",
  ],
};
const RULES_NUDGE = [" Keep an eye on the rules list too.", " Mira también la lista de reglas."];

const STRATEGY = {
  counters: [
    "Fill the frame one row at a time and count each counter as you place it. Make the rules true first, then count what is left to add.",
    "Llena el cuadro fila por fila y cuenta cada ficha al ponerla. Cumple primero las reglas y luego cuenta lo que falta.",
  ],
  base10: [
    "Start with the biggest piece that is not worth more than the goal, then use smaller pieces for what is left.",
    "Empieza con la pieza más grande que no valga más que la meta y usa piezas menores para lo que falte.",
  ],
  base10Rules: [
    "Set up the piece the rule talks about first. Work out how much is still needed, then fill it with the other pieces. Ten of one piece can be traded for one of the next size up.",
    "Pon primero la pieza de la que habla la regla. Calcula cuánto falta y complétalo con las otras piezas. Diez de una pieza se cambian por una de la siguiente más grande.",
  ],
  decimal: [
    "Remember the sizes: a flat is 1, a rod is one tenth, a unit is one hundredth. Start with the biggest piece that fits, then the next size down.",
    "Recuerda los tamaños: la plancha es 1, la barra es una décima y el cubo es una centésima. Empieza con la pieza más grande que quepa y sigue con la siguiente.",
  ],
  decimalRules: [
    "Set up the piece the rule talks about first, then work out how much is still needed. Ten of one piece trade for one of the next size up, so you can swap one bigger piece for ten smaller ones.",
    "Pon primero la pieza de la regla y calcula cuánto falta. Diez de una pieza se cambian por una de la siguiente más grande, así que una pieza grande se puede cambiar por diez menores.",
  ],
  chips: [
    "Each positive chip cancels one negative chip of the same size. Decide how many of each sign the rules need, then check the total.",
    "Cada ficha positiva cancela una negativa del mismo tamaño. Decide cuántas de cada signo piden las reglas y revisa el total.",
  ],
  scieq: [
    "The value must stay the same. When the exponent gets smaller, the coefficient has to get bigger by the same power of 10, and the other way round.",
    "El valor debe quedar igual. Si el exponente baja, el coeficiente debe subir en la misma potencia de 10, y al revés.",
  ],
  sci: [
    "Count how many places the decimal point must move to make a number from 1 up to 10. That count is the exponent: positive for big numbers, negative for numbers smaller than 1.",
    "Cuenta cuántos lugares debe moverse el punto decimal para obtener un número de 1 hasta 10. Esa cantidad es el exponente: positivo para números grandes y negativo para números menores que 1.",
  ],
};
const CHART = {
  largest: [
    "Put the biggest tile in the highest place, the next biggest next, and keep going.",
    "Pon la ficha mayor en el lugar más alto, la siguiente mayor después, y sigue así.",
  ],
  smallest: [
    "Put the smallest tile that is not 0 in the highest place. A 0 can go in the next place.",
    "Pon en el lugar más alto la ficha menor que no sea 0. El 0 puede ir en el lugar siguiente.",
  ],
  largestEven: [
    "Choose an even tile for the ones place first. Then put the biggest of the other tiles in the highest places.",
    "Elige primero una ficha par para las unidades. Luego pon las fichas mayores restantes en los lugares más altos.",
  ],
  nearest: [
    "First make any number close to the goal. Then swap two tiles and see whether you get closer or farther.",
    "Primero forma un número cercano a la meta. Luego intercambia dos fichas y mira si te acercas o te alejas.",
  ],
};
const CHART_EXAMPLE = {
  largest: [
    "With the tiles 2, 7 and 4, the biggest tile 7 goes first, then 4, then 2: the largest number is 742.",
    "Con las fichas 2, 7 y 4, la mayor (7) va primero, luego 4 y luego 2: el número más grande es 742.",
  ],
  smallest: [
    "With the tiles 0, 6 and 3, a number cannot start with 0, so 3 goes first, then 0, then 6: the smallest number is 306.",
    "Con las fichas 0, 6 y 3, el número no puede empezar con 0; va primero 3, luego 0 y luego 6: el número más pequeño es 306.",
  ],
  largestEven: [
    "With the tiles 5, 2 and 9, the ones place must be even, so 2 goes there; then 9 and 5 fill the highest places: the largest even number is 952.",
    "Con las fichas 5, 2 y 9, las unidades deben ser pares, así que va el 2; luego 9 y 5 ocupan los lugares más altos: el número par más grande es 952.",
  ],
  nearest: [
    "With the tiles 1, 8 and 5 and a goal of 600: 518 is 82 away, 581 is 19 away and 815 is 215 away. Checking each arrangement shows 581 is the closest.",
    "Con las fichas 1, 8 y 5 y la meta 600: 518 está a 82, 581 está a 19 y 815 está a 215. Al revisar cada disposición, 581 es la más cercana.",
  ],
};
const SCI_EXAMPLES = [
  {
    target: "7100",
    text: [
      "For 7,100, the decimal point moves 3 places left to make 7.1, so 7,100 = 7.1 × 10³.",
      "Para 7,100, el punto decimal se mueve 3 lugares a la izquierda y da 7.1, así que 7,100 = 7.1 × 10³.",
    ],
  },
  {
    target: "0.0056",
    text: [
      "For 0.0056, the decimal point moves 3 places right to make 5.6, so 0.0056 = 5.6 × 10⁻³.",
      "Para 0.0056, el punto decimal se mueve 3 lugares a la derecha y da 5.6, así que 0.0056 = 5.6 × 10⁻³.",
    ],
  },
  {
    target: "830000",
    text: [
      "For 830,000, the decimal point moves 5 places left to make 8.3, so 830,000 = 8.3 × 10⁵.",
      "Para 830,000, el punto decimal se mueve 5 lugares a la izquierda y da 8.3, así que 830,000 = 8.3 × 10⁵.",
    ],
  },
];
const EQ_EXAMPLES = [
  {
    target: "2500000",
    text: [
      "2.5 × 10⁶ is the same value as 25 × 10⁵: the exponent went down by 1, so the coefficient went up by a factor of 10.",
      "2.5 × 10⁶ vale lo mismo que 25 × 10⁵: el exponente bajó 1, así que el coeficiente se multiplicó por 10.",
    ],
  },
  {
    target: "7000",
    text: [
      "7 × 10³ is the same value as 0.7 × 10⁴: the exponent went up by 1, so the coefficient is 10 times smaller.",
      "7 × 10³ vale lo mismo que 0.7 × 10⁴: el exponente subió 1, así que el coeficiente es 10 veces menor.",
    ],
  },
];
const CHIP_EXAMPLES = [
  {
    target: "-3",
    text: [
      "With chips worth +1 and −1, three negative chips make −3. Adding one positive and one negative chip adds a zero pair, so the total is still −3.",
      "Con fichas de +1 y −1, tres fichas negativas forman −3. Agregar una positiva y una negativa añade un par cero, así que el total sigue siendo −3.",
    ],
  },
  {
    target: "4",
    text: [
      "With chips worth +1 and −1, four positive chips make 4. Six positive chips and two negative chips also make 4, because two pairs cancel.",
      "Con fichas de +1 y −1, cuatro fichas positivas forman 4. Seis positivas y dos negativas también forman 4, porque dos pares se cancelan.",
    ],
  },
  {
    target: "-5",
    text: [
      "With chips worth +1 and −1, two positive and seven negative chips make −5: the two pairs cancel and five negative chips are left.",
      "Con fichas de +1 y −1, dos positivas y siete negativas forman −5: los dos pares se cancelan y quedan cinco negativas.",
    ],
  },
];
const COUNTER_EXAMPLES = [
  [4, 1],
  [6, 2],
  [9, 4],
  [8, 5],
];

function placedExample(round, lang) {
  const placed = byValueDesc(round);
  let rest = fromDecimal(round.target);
  const digits = placed.map((p) => {
    const q = div(rest, fromDecimal(p.value));
    const whole = Math.floor(q.n / q.d);
    rest = add(rest, mul(frac(-whole), fromDecimal(p.value)));
    return whole;
  });
  const other = digits.map((d, i) => (i === 0 ? ((d + 3) % 9) + 1 : (d + 3) % 10));
  let total = frac(0);
  const parts = [];
  placed.forEach((p, i) => {
    if (!other[i]) return;
    const worth = mul(frac(other[i]), fromDecimal(p.value));
    total = add(total, worth);
    parts.push(`${other[i]} ${pieceName(p, lang, other[i])} = ${fmtNum(toDecimalString(worth))}`);
  });
  const sum = fmtNum(toDecimalString(total));
  return lang === "en"
    ? `For example, to build ${sum}: ${parts.join(", ")}. Together that makes ${sum}.`
    : `Por ejemplo, para construir ${sum}: ${parts.join(", ")}. Juntas forman ${sum}.`;
}

function example(round) {
  const fam = family(round);
  const pick = (pool) => pool.find((e) => e.target !== round.target) || pool[0];
  if (fam === "chart")
    return { en: CHART_EXAMPLE[round.goal][0], es: CHART_EXAMPLE[round.goal][1] };
  if (fam === "sci") {
    const e = pick(SCI_EXAMPLES);
    return { en: e.text[0], es: e.text[1] };
  }
  if (fam === "scieq") {
    const e = pick(EQ_EXAMPLES);
    return { en: e.text[0], es: e.text[1] };
  }
  if (fam === "chips") {
    const e = pick(CHIP_EXAMPLES);
    return { en: e.text[0], es: e.text[1] };
  }
  if (fam === "counters") {
    const target = Number(round.target);
    const [q, a] = COUNTER_EXAMPLES.find(([n]) => n !== target);
    if (round.pieces.length === 1)
      return {
        en: `For example, to show ${q}, put one counter in each box and count: 1, 2, 3 ... up to ${q}.`,
        es: `Por ejemplo, para mostrar ${q}, pon una ficha en cada casilla y cuenta: 1, 2, 3 ... hasta ${q}.`,
      };
    return {
      en: `For example, to show ${q} you could use ${a} red and ${q - a} yellow counters, because ${a} + ${q - a} = ${q}.`,
      es: `Por ejemplo, para mostrar ${q} podrías usar ${a} fichas rojas y ${q - a} amarillas, porque ${a} + ${q - a} = ${q}.`,
    };
  }
  return { en: placedExample(round, "en"), es: placedExample(round, "es") };
}

export function hint(round, tier, sols) {
  const fam = family(round);
  const li = (lang) => (lang === "en" ? 0 : 1);
  if (tier >= 3) {
    const key = answerKey(round, sols);
    const both = (lang) =>
      sols.map((b) => recipe(round, b, lang)).join(lang === "en" ? " and " : " y ");
    if (fam === "chart")
      return {
        en: `One arrangement that works: ${key}.`,
        es: `Una disposición que funciona: ${key}.`,
      };
    if (fam === "sci" || fam === "scieq")
      return { en: `One build that works: ${key}.`, es: `Una construcción que funciona: ${key}.` };
    return {
      en: `One build that works: ${both("en")} (${key}).`,
      es: `Una construcción que funciona: ${both("es")} (${key}).`,
    };
  }
  const make = (lang) => {
    const i = li(lang);
    if (tier === 0) {
      const key = fam === "scieq" ? "sci" : ["counters", "chips", "chart", "sci"].includes(fam) ? fam : "pieces";
      return NUDGE[key][i] + (ruled(round) && ["pieces", "counters", "chips"].includes(key) ? RULES_NUDGE[i] : "");
    }
    if (tier === 1) {
      if (fam === "chart") return CHART[round.goal][i];
      const key =
        fam === "base10" || fam === "discs" || fam === "expdiscs"
          ? ruled(round)
            ? "base10Rules"
            : "base10"
          : fam === "decimal"
            ? ruled(round)
              ? "decimalRules"
              : "decimal"
            : fam;
      return STRATEGY[key][i];
    }
    return example(round)[lang];
  };
  return { en: make("en"), es: make("es") };
}
