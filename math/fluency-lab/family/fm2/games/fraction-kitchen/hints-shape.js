// Hint ladders for the shape tasks. Each skill returns four {en, es} texts: tier 0 nudge, tier 1 strategy, tier 2 a
// worked parallel example (never this round's numbers), tier 3 the full solution. @fm2 FM-062
import { toString } from "../../rational.js";
import { foodText, partName } from "./copy.js";
import { shapePlan } from "./solution.js";
import { ms, wordIn } from "./words.js";

export const T = (en, es) => ({ en, es });
const leaks = (pair, bad) => bad.some((token) => wordIn(pair.en, token) || wordIn(pair.es, token));
// The first worked example that does not print this round's own answer.
export const safe = (pairs, bad) => pairs.find((pair) => !leaks(pair, bad)) ?? pairs.at(-1);

export function fairShares(r) {
  const food = foodText(r.food, "en");
  const foodEs = foodText(r.food, "es");
  const { friends: f, serveCount: m } = r;
  const e = f === 3 ? 2 : 3;
  const example =
    m === 1
      ? T(
          `Example: with ${e} friends you cut ${e} equal parts, and one friend's share is 1 of those ${e} parts.`,
          `Ejemplo: con ${e} amigos cortas ${e} partes iguales, y la parte de un amigo es 1 de esas ${e} partes.`,
        )
      : T(
          `Example: with ${e === 2 ? 4 : e} friends you cut ${e === 2 ? 4 : e} equal parts. If 2 of the friends have eaten, you serve 2 of those parts.`,
          `Ejemplo: con ${e === 2 ? 4 : e} amigos cortas ${e === 2 ? 4 : e} partes iguales. Si 2 de los amigos ya comieron, sirves 2 de esas partes.`,
        );
  return [
    T(
      "Fair shares are equal shares. Look at the equal-parts check under the picture: are all the parts the same size?",
      "Las partes justas son partes iguales. Mira la revisión de partes iguales debajo del dibujo: ¿todas las partes tienen el mismo tamaño?",
    ),
    T(
      "Cut into as many equal parts as there are friends, so every friend gets exactly one part. Then tap the parts to serve them.",
      "Corta en tantas partes iguales como amigos haya, para que cada amigo reciba exactamente una parte. Luego toca las partes para servirlas.",
    ),
    example,
    T(
      `Cut ${food.the} into ${f} equal parts, one for each friend, and serve ${m === 1 ? "1 part" : `${m} parts`}: ${m}/${f}.`,
      `Corta ${foodEs.the} en ${f} partes iguales, una para cada amigo, y sirve ${m === 1 ? "1 parte" : `${m} partes`}: ${m}/${f}.`,
    ),
  ];
}

export function fixCuts(r) {
  const f = r.friends;
  const e = f === 3 ? 2 : 3;
  const cutsEn = e === 2 ? "one cut in the middle, at 1/2" : "two cuts, at 1/3 and 2/3";
  const cutsEs = e === 2 ? "un corte justo en el medio, en 1/2" : "dos cortes, en 1/3 y 2/3";
  return [
    T(
      "Look at the equal-parts check. Which parts are bigger or smaller than the others?",
      "Mira la revisión de partes iguales. ¿Qué partes son más grandes o más pequeñas que las demás?",
    ),
    T(
      "Slide a cut to make a part bigger or smaller, or join two parts. You need as many equal parts as friends. The Even out button also cuts equal parts for you.",
      "Desliza un corte para agrandar o achicar una parte, o une dos partes. Necesitas tantas partes iguales como amigos. El botón Igualar también corta partes iguales por ti.",
    ),
    T(
      `Example: for ${e} friends you need ${e} parts of the same size, so make ${cutsEn}.`,
      `Ejemplo: para ${e} amigos necesitas ${e} partes del mismo tamaño, así que haz ${cutsEs}.`,
    ),
    T(
      `${f} friends need ${f} equal parts. Slide or join the cuts, or use Even out, until the check says all ${f} parts are equal. Each friend's share is 1/${f}.`,
      `${f} amigos necesitan ${f} partes iguales. Desliza o une los cortes, o usa Igualar, hasta que la revisión diga que las ${f} partes son iguales. La parte de cada amigo es 1/${f}.`,
    ),
  ];
}

const SERVE_EXAMPLES = [
  [2, 5],
  [3, 8],
  [1, 6],
  [5, 6],
  [2, 3],
  [3, 4],
  [1, 5],
];

export function serveParts(r, bad) {
  const [a, b] = r.ask;
  const food = foodText(r.food, "en");
  const foodEs = foodText(r.food, "es");
  const examples = SERVE_EXAMPLES.filter(([x, y]) => x * r.target.d !== r.target.n * y).map(([x, y]) =>
    T(`Example: to serve ${x}/${y} you cut ${y} equal parts and serve ${x} of them.`, `Ejemplo: para servir ${x}/${y} cortas ${y} partes iguales y sirves ${x} de ellas.`),
  );
  return [
    T(
      "The bottom number tells how many equal parts the whole is cut into. The top number tells how many of those parts to serve.",
      "El número de abajo dice en cuántas partes iguales se corta el entero. El número de arriba dice cuántas de esas partes se sirven.",
    ),
    T(
      "First cut into equal parts and check that they are equal. Then tap pieces to serve them until the equation under the picture matches the order.",
      "Primero corta en partes iguales y revisa que lo sean. Luego toca las piezas para servirlas hasta que la ecuación debajo del dibujo coincida con el pedido.",
    ),
    safe(examples, bad),
    T(
      `Cut ${food.the} into ${b} equal parts and serve ${a} of them: ${a}/${b}.`,
      `Corta ${foodEs.the} en ${b} partes iguales y sirve ${a} de ellas: ${a}/${b}.`,
    ),
  ];
}

const EQUIV_EXAMPLES = [
  ["1/2", "2/4", 2],
  ["1/3", "3/9", 3],
  ["3/4", "6/8", 2],
  ["1/4", "2/8", 2],
  ["2/3", "4/6", 2],
  ["1/5", "3/15", 3],
];

export function pizzaEquiv(r, bad) {
  const { parts: n, count: k } = shapePlan(r);
  const examples = EQUIV_EXAMPLES.filter(
    ([x, y]) => !bad.includes(y) && !bad.includes(x) && x !== toString(r.ref),
  ).map(([x, y, m]) =>
    T(
      `Example: ${x} is the same amount as ${y}: the parts were multiplied by ${m} and so were the served pieces.`,
      `Ejemplo: ${x} es la misma cantidad que ${y}: las partes se multiplicaron por ${m} y las piezas servidas también.`,
    ),
  );
  const food = foodText(r.food, "en");
  const foodEs = foodText(r.food, "es");
  return [
    T(
      "Cutting each piece into smaller pieces changes how many parts there are, but not how much is served.",
      "Cortar cada pieza en piezas más pequeñas cambia cuántas partes hay, pero no cuánto se sirve.",
    ),
    r.den
      ? T(
          "Use the number of parts the order asks for. Think: how many new pieces fit inside each old piece? Serve that many times as many pieces.",
          "Usa el número de partes que pide el pedido. Piensa: ¿cuántas piezas nuevas caben en cada pieza vieja? Sirve esa cantidad de veces más piezas.",
        )
      : T(
          "Pick a new number of equal parts that the old number goes into evenly. Whatever you multiply the parts by, multiply the served pieces by the same number.",
          "Elige un nuevo número de partes iguales en el que quepa el número viejo. Por el número que multipliques las partes, multiplica también las piezas servidas.",
        ),
    safe(examples, bad),
    T(
      `Cut ${r.wholes > 1 ? `each ${food.one}` : food.the} into ${n} equal parts and serve ${k} ${r.wholes > 1 ? "pieces in all" : "of them"}: ${k}/${n} is the same amount as ${ms(r.ref)}.`,
      `Corta ${r.wholes > 1 ? `cada ${foodEs.one}` : foodEs.the} en ${n} partes iguales y sirve ${k} ${r.wholes > 1 ? "piezas en total" : "de ellas"}: ${k}/${n} es la misma cantidad que ${ms(r.ref)}.`,
    ),
  ];
}

const COMPARE_EXAMPLES = {
  sameDen: [
    T("Example: 5/8 is more than 3/8, because 5 eighths are more than 3 eighths.", "Ejemplo: 5/8 es mayor que 3/8, porque 5 octavos son más que 3 octavos."),
    T("Example: 2/6 is less than 5/6, because 2 sixths are fewer than 5 sixths.", "Ejemplo: 2/6 es menor que 5/6, porque 2 sextos son menos que 5 sextos."),
    T("Example: 7/10 is more than 4/10, because 7 tenths are more than 4 tenths.", "Ejemplo: 7/10 es mayor que 4/10, porque 7 décimos son más que 4 décimos."),
  ],
  sameNum: [
    T("Example: 3/4 is more than 3/8, because fourths are bigger pieces than eighths.", "Ejemplo: 3/4 es mayor que 3/8, porque los cuartos son piezas más grandes que los octavos."),
    T("Example: 2/9 is less than 2/5, because ninths are smaller pieces than fifths.", "Ejemplo: 2/9 es menor que 2/5, porque los novenos son piezas más pequeñas que los quintos."),
    T("Example: 1/3 is more than 1/10, because thirds are bigger pieces than tenths.", "Ejemplo: 1/3 es mayor que 1/10, porque los tercios son piezas más grandes que los décimos."),
  ],
  den: [
    T("Example: to beat 1/2 using sixths, 4/6 works, because 1/2 = 3/6 and 4 sixths are more than 3 sixths.", "Ejemplo: para superar 1/2 usando sextos, 4/6 sirve, porque 1/2 = 3/6 y 4 sextos son más que 3 sextos."),
    T("Example: to be less than 3/4 using eighths, 5/8 works, because 3/4 = 6/8 and 5 eighths are fewer than 6 eighths.", "Ejemplo: para ser menor que 3/4 usando octavos, 5/8 sirve, porque 3/4 = 6/8 y 5 octavos son menos que 6 octavos."),
    T("Example: to beat 1/3 using ninths, 5/9 works, because 1/3 = 3/9 and 5 ninths are more than 3 ninths.", "Ejemplo: para superar 1/3 usando novenos, 5/9 sirve, porque 1/3 = 3/9 y 5 novenos son más que 3 novenos."),
  ],
};

export function comparePieces(r, bad) {
  const { parts: n, count: k } = shapePlan(r);
  const strategy = {
    sameDen: T(
      "The parts are the same size, so the amount with more pieces served is more.",
      "Las partes tienen el mismo tamaño, así que la cantidad con más piezas servidas es mayor.",
    ),
    sameNum: T(
      "You serve the same number of pieces either way. The more equal parts the whole is cut into, the smaller each piece is.",
      "Sirves el mismo número de piezas de cualquier modo. Mientras más partes iguales tenga el entero, más pequeña es cada pieza.",
    ),
    den: T(
      "Use the number of equal parts the order gives, then choose how many pieces to serve so the comparison line says what the order wants.",
      "Usa el número de partes iguales que da el pedido y elige cuántas piezas servir para que la línea de comparación diga lo que pide el pedido.",
    ),
  }[r.mode];
  return [
    T(
      "Look at the comparison line under the picture. It says if your amount is more than, less than or equal to the reference.",
      "Mira la línea de comparación debajo del dibujo. Dice si tu cantidad es mayor, menor o igual que la de comparación.",
    ),
    strategy,
    safe(COMPARE_EXAMPLES[r.mode], bad),
    T(
      `For example, cut ${n} equal parts and serve ${k}: ${k}/${n} is ${r.relation} than ${toString(r.ref)}.`,
      `Por ejemplo, corta ${n} partes iguales y sirve ${k}: ${k}/${n} es ${r.relation === "more" ? "mayor" : "menor"} que ${toString(r.ref)}.`,
    ),
  ];
}

const AREA_EXAMPLES = [
  {
    base: [1, 4],
    factor: [1, 2],
    value: [1, 8],
    en: "Example: 1/2 of 1/4. Cut 8 equal parts. The leftover is 2 parts, half of that is 1 part, so 1 of the 8 parts is served.",
    es: "Ejemplo: 1/2 de 1/4. Corta 8 partes iguales. Lo que sobra son 2 partes, la mitad de eso es 1 parte, así que se sirve 1 de las 8 partes.",
  },
  {
    base: [2, 3],
    factor: [1, 2],
    value: [1, 3],
    en: "Example: 1/2 of 2/3. Cut 6 equal parts. The leftover is 4 parts, half of that is 2 parts, so 2 of the 6 parts are served.",
    es: "Ejemplo: 1/2 de 2/3. Corta 6 partes iguales. Lo que sobra son 4 partes, la mitad de eso es 2 partes, así que se sirven 2 de las 6 partes.",
  },
  {
    base: [3, 4],
    factor: [1, 3],
    value: [1, 4],
    en: "Example: 1/3 of 3/4. Cut 12 equal parts. The leftover is 9 parts, a third of that is 3 parts, so 3 of the 12 parts are served.",
    es: "Ejemplo: 1/3 de 3/4. Corta 12 partes iguales. Lo que sobra son 9 partes, un tercio de eso es 3 partes, así que se sirven 3 de las 12 partes.",
  },
  {
    base: [1, 2],
    factor: [1, 3],
    value: [1, 6],
    en: "Example: 1/3 of 1/2. Cut 6 equal parts. The leftover is 3 parts, a third of that is 1 part, so 1 of the 6 parts is served.",
    es: "Ejemplo: 1/3 de 1/2. Corta 6 partes iguales. Lo que sobra son 3 partes, un tercio de eso es 1 parte, así que se sirve 1 de las 6 partes.",
  },
];
const SHARE_EXAMPLES = [
  {
    value: [1, 6],
    en: "Example: 1/2 is left and 3 friends share it. Cut 6 equal parts. The leftover is 3 parts, one for each friend, so each friend gets 1 of the 6 parts.",
    es: "Ejemplo: sobra 1/2 y 3 amigos lo reparten. Corta 6 partes iguales. Lo que sobra son 3 partes, una para cada amigo, así que cada amigo recibe 1 de las 6 partes.",
  },
  {
    value: [1, 8],
    en: "Example: 1/4 is left and 2 friends share it. Cut 8 equal parts. The leftover is 2 parts, one for each friend, so each friend gets 1 of the 8 parts.",
    es: "Ejemplo: sobra 1/4 y 2 amigos lo reparten. Corta 8 partes iguales. Lo que sobra son 2 partes, una para cada amigo, así que cada amigo recibe 1 de las 8 partes.",
  },
  {
    value: [1, 4],
    en: "Example: 1/2 is left and 2 friends share it. Cut 4 equal parts. The leftover is 2 parts, one for each friend, so each friend gets 1 of the 4 parts.",
    es: "Ejemplo: sobra 1/2 y 2 amigos lo reparten. Corta 4 partes iguales. Lo que sobra son 2 partes, una para cada amigo, así que cada amigo recibe 1 de las 4 partes.",
  },
  {
    value: [1, 9],
    en: "Example: 1/3 is left and 3 friends share it. Cut 9 equal parts. The leftover is 3 parts, one for each friend, so each friend gets 1 of the 9 parts.",
    es: "Ejemplo: sobra 1/3 y 3 amigos lo reparten. Corta 9 partes iguales. Lo que sobra son 3 partes, una para cada amigo, así que cada amigo recibe 1 de las 9 partes.",
  },
];

export function area(r, bad) {
  const { parts: n, count: k } = shapePlan(r);
  const same = (value) => value[0] * r.target.d === r.target.n * value[1];
  const pool = (r.op === "share" ? SHARE_EXAMPLES : AREA_EXAMPLES).filter((x) => !same(x.value)).map((x) => T(x.en, x.es));
  const food = foodText(r.food, "en");
  const foodEs = foodText(r.food, "es");
  if (r.op === "share") {
    return [
      T(
        `The friends share only the leftover, not the whole ${food.one}.`,
        `Los amigos reparten solo lo que sobra, no ${foodEs.the}.`,
      ),
      T(
        "Cut the whole into more equal parts so the leftover splits evenly among the friends. One friend's share is one of those small parts.",
        "Corta el entero en más partes iguales para que lo que sobra se reparta parejo entre los amigos. La parte de un amigo es una de esas partes pequeñas.",
      ),
      safe(pool, bad),
      T(
        `Each friend gets ${toString(r.base)} ÷ ${r.friends} = ${toString(r.target)} of the whole. Cut ${n} equal parts: the leftover is ${r.friends} parts, one for each friend. Serve ${k} of them: ${toString(r.target)}.`,
        `Cada amigo recibe ${toString(r.base)} ÷ ${r.friends} = ${toString(r.target)} del entero. Corta ${n} partes iguales: lo que sobra son ${r.friends} partes, una para cada amigo. Sirve ${k} de ellas: ${toString(r.target)}.`,
      ),
    ];
  }
  return [
    T(
      `Look at the dashed region. You take a part of that leftover, not a part of the whole ${food.one}.`,
      `Mira la región de rayas. Tomas una parte de lo que sobra, no una parte de ${foodEs.the}.`,
    ),
    T(
      "Cut the whole into equal parts so the dashed line lands on a cut. Then think how to split just the leftover pieces, and serve only pieces inside the dashed line.",
      "Corta el entero en partes iguales para que la línea de rayas caiga sobre un corte. Luego piensa cómo repartir solo las piezas que sobran y sirve solo piezas dentro de la línea de rayas.",
    ),
    safe(pool, bad),
    T(
      `${toString(r.factor)} of ${toString(r.base)} = ${toString(r.factor)} × ${toString(r.base)} = ${toString(r.target)}. Cut ${n} equal parts, and serve ${k} of the pieces inside the dashed line: ${toString(r.target)} of the whole.`,
      `${toString(r.factor)} de ${toString(r.base)} = ${toString(r.factor)} × ${toString(r.base)} = ${toString(r.target)}. Corta ${n} partes iguales y sirve ${k} de las piezas dentro de la línea de rayas: ${toString(r.target)} del entero.`,
    ),
  ];
}

export { partName };
