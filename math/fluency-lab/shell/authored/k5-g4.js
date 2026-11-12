// Grade 4 — authored explanations. Place value to a million, multi-digit operations as area and partial products,
// fractions as amounts, and measurement as a change of unit size.
import {
  L,
  binop,
  isFrac,
  isNum,
  mis,
  nums,
  q,
  subNoDecrement,
} from "./k5-kit.js";
import { placeDetectors } from "./k5-g1.js";
import { flipSub, noRegroupAdd } from "./k5-g2.js";
import {
  equivDetectors,
  fractionCompareDetectors,
  roundDetectors,
} from "./k5-g3.js";
import { angleModel, mixedModel } from "./lm-35.js";

const digitsOf = (n) => String(n).split("").reverse().map(Number);
export const mulNoCarry = (a, d) =>
  digitsOf(a).reduce((s, x, i) => s + ((x * d) % 10) * 10 ** i, 0);
const UNITS = { meters: 100, kilograms: 1000, liters: 1000, hours: 60 };
const conversion = (item) => {
  const m = q(item).match(/^(\d+) (meters|kilograms|liters|hours) = how many/);
  return m ? { n: Number(m[1]), f: UNITS[m[2]] } : null;
};
const lineplot = (item) => {
  const m = q(item).match(
    /1\/4 inch: (\d+) dots\. 1\/2 inch: (\d+) dots\. 3\/4 inch: (\d+) dots/,
  );
  return m ? m.slice(1).map(Number) : null;
};
const mixedQ = (item) => {
  let m = q(item).match(/Write (\d+) (\d+)\/(\d+) as an improper fraction/);
  if (m)
    return {
      to: "improper",
      w: Number(m[1]),
      n: Number(m[2]),
      d: Number(m[3]),
    };
  m = q(item).match(/Write (\d+)\/(\d+) as a mixed number/);
  return m ? { to: "mixed", N: Number(m[1]), d: Number(m[2]) } : null;
};
const typed = (raw) => String(raw).trim().replace(/\s+/g, " ");
const remainderQ = (item) => {
  const m = q(item).match(/^(\d+) ÷ (\d+) has a remainder/);
  return m
    ? {
        a: Number(m[1]),
        b: Number(m[2]),
        qt: Math.floor(Number(m[1]) / Number(m[2])),
        r: Number(m[1]) % Number(m[2]),
      }
    : null;
};
export const remainderDetectors = [
  mis(
    "gave-remainder",
    (item, raw) => {
      const r = remainderQ(item);
      return Boolean(r) && r.r !== r.qt && isNum(raw, r.r);
    },
    "That is the remainder, the amount left over. The question asks for the quotient: how many whole groups.",
    "Ese es el residuo, lo que sobra. La pregunta pide el cociente: cuántos grupos completos hay.",
  ),
  mis(
    "rounded-up",
    (item, raw) => {
      const r = remainderQ(item);
      return Boolean(r) && isNum(raw, r.qt + 1);
    },
    "One group too many. That many full groups would need more than the total. Check: quotient × divisor must not be more than the total.",
    "Un grupo de más. Esa cantidad de grupos completos necesitaría más que el total. Comprueba: cociente × divisor no puede pasar del total.",
  ),
];
export const subKeptTen = mis(
  "kept-the-ten",
  (item, raw) => {
    const p = binop(item);
    return (
      p &&
      p[1] === "-" &&
      subNoDecrement(p[0], p[2]) !== p[0] - p[2] &&
      isNum(raw, subNoDecrement(p[0], p[2]))
    );
  },
  "You regrouped but did not take the 1 away from the place you borrowed from. Cross it out and write one less there.",
  "Reagrupaste pero no quitaste el 1 del lugar de donde lo tomaste. Táchalo y escribe uno menos ahí.",
);

export const G4 = {
  "4:place-million": {
    title: L("Place value to a million", "Valor posicional hasta un millón"),
    concept: L(
      "Each place is worth 10 times the place to its right. Big numbers are read in groups of three: thousands, then hundreds, tens and ones.",
      "Cada lugar vale 10 veces el lugar de su derecha. Los números grandes se leen en grupos de tres: los millares y luego centenas, decenas y unidades.",
    ),
    reasons: [
      L(
        "10 hundreds make a thousand; 10 thousands make a ten-thousand.",
        "10 centenas forman un millar; 10 millares forman una decena de millar.",
      ),
      L(
        "A digit's value is the digit × its place: a 7 in the ten-thousands place is 7 × 10,000 = 70,000.",
        "El valor de un dígito es el dígito × su lugar: un 7 en las decenas de millar es 7 × 10,000 = 70,000.",
      ),
      L(
        "The comma separates the thousands group from the ones group.",
        "La coma separa el grupo de los millares del grupo de las unidades.",
      ),
    ],
    misconception: L(
      "Count places from the RIGHT, starting with ones. A digit and its value are different: a 7 in the ten-thousands place is worth 70,000.",
      "Cuenta los lugares desde la DERECHA, empezando por las unidades. Un dígito y su valor son diferentes: un 7 en las decenas de millar vale 70,000.",
    ),
    misconceptions: placeDetectors,
    transfer: {
      prompt: L(
        "A stadium sold 4 groups of 10,000 tickets, 6 groups of 1,000, and 25 single tickets. How many tickets is that?",
        "Un estadio vendió 4 grupos de 10,000 boletos, 6 grupos de 1,000 y 25 boletos sueltos. ¿Cuántos boletos son?",
      ),
      answers: ["46025"],
      kind: "number",
      hint: L(
        "Write each part as a place value, then add.",
        "Escribe cada parte como valor posicional y luego suma.",
      ),
      explanation: L(
        "40,000 + 6,000 + 25 = 46,025. The hundreds place has no hundreds, so it holds a 0.",
        "40,000 + 6,000 + 25 = 46,025. El lugar de las centenas no tiene centenas, así que lleva un 0.",
      ),
    },
  },
  "4:round-large": {
    title: L("Round large numbers", "Redondea números grandes"),
    concept: L(
      "To round, find the two nearest numbers at the place you are rounding to, and choose the closer one. Every digit after that place becomes 0.",
      "Para redondear, busca los dos números más cercanos en el lugar al que redondeas y elige el más cercano. Todos los dígitos después de ese lugar se vuelven 0.",
    ),
    reasons: [
      L(
        "63,480 to the nearest thousand sits between 63,000 and 64,000.",
        "63,480 al millar más cercano está entre 63,000 y 64,000.",
      ),
      L(
        "The halfway point is 63,500; 63,480 is below it, so it rounds to 63,000.",
        "El punto medio es 63,500; 63,480 está antes, así que se redondea a 63,000.",
      ),
      L(
        "Only the digit right after the rounding place decides: 5 or more rounds up.",
        "Solo decide el dígito justo después del lugar que redondeas: 5 o más sube.",
      ),
    ],
    misconception: L(
      "Look at the digit just to the right of the rounding place, not the last digit. And round to the place the question names.",
      "Mira el dígito justo a la derecha del lugar que redondeas, no el último dígito. Y redondea al lugar que pide la pregunta.",
    ),
    misconceptions: roundDetectors,
    transfer: {
      prompt: L(
        "A city has 286,540 people. A news report rounds this to the nearest ten thousand. What number does it report?",
        "Una ciudad tiene 286,540 habitantes. Un noticiero lo redondea a la decena de millar más cercana. ¿Qué número informa?",
      ),
      answers: ["290000"],
      kind: "number",
      hint: L(
        "Which two ten-thousands is it between? Which one is closer?",
        "¿Entre qué dos decenas de millar está? ¿Cuál está más cerca?",
      ),
      explanation: L(
        "The halfway point is 285,000 and 286,540 is past it, so it rounds up to 290,000.",
        "El punto medio es 285,000 y 286,540 lo pasa, así que se redondea hacia arriba a 290,000.",
      ),
    },
  },
  "4:add-large": {
    title: L("Add large numbers", "Suma números grandes"),
    concept: L(
      "Line up the places and add from the right. Whenever a place reaches 10 or more, carry 1 to the next place to the left.",
      "Alinea los lugares y suma desde la derecha. Cada vez que un lugar llega a 10 o más, lleva 1 al lugar siguiente de la izquierda.",
    ),
    reasons: [
      L(
        "Lining up places keeps ones with ones and thousands with thousands.",
        "Alinear los lugares mantiene unidades con unidades y millares con millares.",
      ),
      L(
        "A column total of 13 is 1 of the next place and 3 of this place.",
        "Un total de 13 en una columna es 1 del lugar siguiente y 3 de este lugar.",
      ),
      L(
        "Estimate first: round each number to the nearest ten-thousand and add.",
        "Primero estima: redondea cada número a la decena de millar más cercana y suma.",
      ),
    ],
    misconception: L(
      "Do not drop a carried 1. If a column adds to 10 or more, the 1 must be added to the next column.",
      "No pierdas el 1 que llevas. Si una columna suma 10 o más, el 1 se suma en la columna siguiente.",
    ),
    misconceptions: [
      noRegroupAdd,
      mis(
        "lost-one-carry",
        (item, raw) => {
          const p = binop(item);
          if (!p || p[1] !== "+") return false;
          const s = p[0] + p[2];
          return [10, 100, 1000, 10000, 100000].some((k) => isNum(raw, s - k));
        },
        "Off by exactly one place value: one carried 1 was not added. Check each column for a carry.",
        "Te falta exactamente un valor posicional: no sumaste un 1 que llevabas. Revisa cada columna.",
      ),
    ],
    transfer: {
      prompt: L(
        "A library had 38,475 visitors last year and 46,860 this year. How many visitors in the two years?",
        "Una biblioteca tuvo 38,475 visitantes el año pasado y 46,860 este año. ¿Cuántos visitantes hubo en los dos años?",
      ),
      answers: ["85335"],
      kind: "number",
      hint: L(
        "Line up the places. Estimate: about 40,000 + 50,000.",
        "Alinea los lugares. Estima: más o menos 40,000 + 50,000.",
      ),
      explanation: L(
        "38,475 + 46,860 = 85,335. Check with the estimate: close to 90,000.",
        "38,475 + 46,860 = 85,335. Compara con la estimación: cerca de 90,000.",
      ),
    },
  },
  "4:subtract-large": {
    title: L("Subtract large numbers", "Resta números grandes"),
    concept: L(
      "Line up the places and subtract from the right. If a top digit is too small, regroup: take 1 from the next place to the left, which gives 10 more here.",
      "Alinea los lugares y resta desde la derecha. Si un dígito de arriba es muy pequeño, reagrupa: toma 1 del lugar siguiente a la izquierda, que da 10 más aquí.",
    ),
    reasons: [
      L(
        "Regrouping renames the number without changing it: 4 thousands = 3 thousands and 10 hundreds.",
        "Reagrupar cambia el nombre del número sin cambiarlo: 4 millares = 3 millares y 10 centenas.",
      ),
      L(
        "Across a zero, regroup from the next nonzero place and pass the 10 down.",
        "Cuando hay un cero, reagrupa desde el siguiente lugar que no sea cero y pasa el 10 hacia abajo.",
      ),
      L(
        "Check by adding: difference + the number subtracted = the starting number.",
        "Comprueba sumando: diferencia + el número que restaste = el número inicial.",
      ),
    ],
    misconception: L(
      "Never subtract the top digit from the bottom digit. Regroup instead, and remember to write one less in the place you took from.",
      "Nunca restes el dígito de arriba del de abajo. Mejor reagrupa, y recuerda escribir uno menos en el lugar de donde tomaste.",
    ),
    misconceptions: [flipSub, subKeptTen],
    transfer: {
      prompt: L(
        "A school raised 52,300 dollars. It spent 27,845 dollars on a new playground. How many dollars are left?",
        "Una escuela recaudó 52,300 dólares. Gastó 27,845 dólares en un patio de juegos nuevo. ¿Cuántos dólares quedan?",
      ),
      answers: ["24455"],
      kind: "number",
      hint: L(
        "Regroup across the zeros, then check by adding.",
        "Reagrupa a través de los ceros y luego comprueba sumando.",
      ),
      explanation: L(
        "52,300 − 27,845 = 24,455. Check: 24,455 + 27,845 = 52,300.",
        "52,300 − 27,845 = 24,455. Comprueba: 24,455 + 27,845 = 52,300.",
      ),
    },
  },
  "4:multiply-1digit": {
    title: L(
      "Multiply by a one-digit number",
      "Multiplica por un número de un dígito",
    ),
    concept: L(
      "Break the big number into hundreds, tens and ones. Multiply each part by the one-digit number, then add the partial products.",
      "Separa el número grande en centenas, decenas y unidades. Multiplica cada parte por el número de un dígito y luego suma los productos parciales.",
    ),
    reasons: [
      L(
        "314 × 6 = 300 × 6 + 10 × 6 + 4 × 6.",
        "314 × 6 = 300 × 6 + 10 × 6 + 4 × 6.",
      ),
      L(
        "That is an area model: one rectangle split into three parts.",
        "Eso es un modelo de área: un rectángulo separado en tres partes.",
      ),
      L(
        "1,800 + 60 + 24 = 1,884. The short algorithm does the same steps and carries.",
        "1,800 + 60 + 24 = 1,884. El algoritmo corto hace los mismos pasos y lleva.",
      ),
    ],
    misconception: L(
      "Each part keeps its place value: 3 × 6 in the hundreds is 1,800, not 18. And add any carried number after you multiply.",
      "Cada parte conserva su valor posicional: 3 × 6 en las centenas es 1,800, no 18. Y suma lo que llevas después de multiplicar.",
    ),
    misconceptions: [
      mis(
        "no-carry",
        (item, raw) => {
          const p = binop(item);
          return (
            p &&
            p[1] === "×" &&
            p[2] < 10 &&
            mulNoCarry(p[0], p[2]) !== p[0] * p[2] &&
            isNum(raw, mulNoCarry(p[0], p[2]))
          );
        },
        "Each place kept only its ones digit, and the carried amount was lost. When a place makes 10 or more, carry the tens to the next place.",
        "Cada lugar se quedó solo con sus unidades y se perdió lo que llevabas. Cuando un lugar da 10 o más, lleva las decenas al lugar siguiente.",
      ),
      mis(
        "lost-place-value",
        (item, raw) => {
          const p = binop(item);
          if (!p || p[1] !== "×" || p[2] >= 10) return false;
          return isNum(
            raw,
            digitsOf(p[0]).reduce((s, x) => s + x * p[2], 0),
          );
        },
        "You multiplied each digit but added them all as ones. The hundreds digit stands for hundreds: 3 × 6 there means 300 × 6.",
        "Multiplicaste cada dígito pero los sumaste todos como unidades. El dígito de las centenas vale centenas: 3 × 6 ahí significa 300 × 6.",
      ),
    ],
    transfer: {
      prompt: L(
        "A theater has 6 sections with 245 seats in each section. How many seats are there?",
        "Un teatro tiene 6 secciones con 245 asientos en cada sección. ¿Cuántos asientos hay?",
      ),
      answers: ["1470"],
      kind: "number",
      hint: L(
        "245 = 200 + 40 + 5. Multiply each part by 6.",
        "245 = 200 + 40 + 5. Multiplica cada parte por 6.",
      ),
      explanation: L(
        "200 × 6 = 1,200; 40 × 6 = 240; 5 × 6 = 30. 1,200 + 240 + 30 = 1,470.",
        "200 × 6 = 1,200; 40 × 6 = 240; 5 × 6 = 30. 1,200 + 240 + 30 = 1,470.",
      ),
    },
  },
  "4:multiply-2digit": {
    title: L("Multiply two-digit numbers", "Multiplica números de dos dígitos"),
    concept: L(
      "Split both numbers into tens and ones. An area model has four parts: tens × tens, tens × ones, ones × tens, ones × ones. Add all four.",
      "Separa los dos números en decenas y unidades. Un modelo de área tiene cuatro partes: decenas × decenas, decenas × unidades, unidades × decenas y unidades × unidades. Suma las cuatro.",
    ),
    reasons: [
      L("23 × 14 = (20 + 3) × (10 + 4).", "23 × 14 = (20 + 3) × (10 + 4)."),
      L(
        "200 + 80 + 30 + 12 = 322: every part of one number meets every part of the other.",
        "200 + 80 + 30 + 12 = 322: cada parte de un número se encuentra con cada parte del otro.",
      ),
      L(
        "In the algorithm, the second row starts with a 0 because it multiplies by tens.",
        "En el algoritmo, la segunda fila empieza con un 0 porque multiplica por decenas.",
      ),
    ],
    misconception: L(
      "Do not multiply only tens × tens and ones × ones. That skips two of the four parts. And the tens row needs its placeholder 0.",
      "No multipliques solo decenas × decenas y unidades × unidades. Eso se salta dos de las cuatro partes. Y la fila de las decenas necesita su 0.",
    ),
    misconceptions: [
      mis(
        "no-zero",
        (item, raw) => {
          const p = binop(item);
          if (!p || p[1] !== "×" || p[2] < 10 || p[2] > 99) return false;
          return isNum(raw, p[0] * (p[2] % 10) + p[0] * Math.floor(p[2] / 10));
        },
        "The second partial product is missing its zero. Multiplying by the tens digit means multiplying by tens, so that row is 10 times bigger.",
        "Al segundo producto parcial le falta su cero. Multiplicar por el dígito de las decenas es multiplicar por decenas, así que esa fila es 10 veces mayor.",
      ),
      mis(
        "two-parts-only",
        (item, raw) => {
          const p = binop(item);
          if (!p || p[1] !== "×" || p[0] < 10 || p[2] < 10) return false;
          const [a, b] = [p[0], p[2]];
          return isNum(
            raw,
            Math.floor(a / 10) * Math.floor(b / 10) * 100 + (a % 10) * (b % 10),
          );
        },
        "You multiplied tens by tens and ones by ones only. Each part of the first number must multiply each part of the second: there are four parts.",
        "Multiplicaste solo decenas por decenas y unidades por unidades. Cada parte del primer número debe multiplicar cada parte del segundo: son cuatro partes.",
      ),
    ],
    transfer: {
      prompt: L(
        "A garden has 34 rows with 26 plants in each row. How many plants are in the garden?",
        "Un jardín tiene 34 filas con 26 plantas en cada fila. ¿Cuántas plantas hay en el jardín?",
      ),
      answers: ["884"],
      kind: "number",
      hint: L(
        "(30 + 4) × (20 + 6): find all four parts.",
        "(30 + 4) × (20 + 6): encuentra las cuatro partes.",
      ),
      explanation: L(
        "30 × 20 = 600, 30 × 6 = 180, 4 × 20 = 80, 4 × 6 = 24. 600 + 180 + 80 + 24 = 884.",
        "30 × 20 = 600, 30 × 6 = 180, 4 × 20 = 80, 4 × 6 = 24. 600 + 180 + 80 + 24 = 884.",
      ),
    },
  },
  "4:division": {
    title: L(
      "Divide by a one-digit number",
      "Divide entre un número de un dígito",
    ),
    concept: L(
      "Division splits a total into equal groups. Take out big, easy groups first (like 10 groups or 50 groups), then smaller ones, and add up how many groups you took.",
      "La división reparte un total en grupos iguales. Saca primero grupos grandes y fáciles (como 10 grupos o 50 grupos), luego los más pequeños, y suma cuántos grupos sacaste.",
    ),
    reasons: [
      L(
        "Each step is a multiplication you know: 50 × 6 = 300.",
        "Cada paso es una multiplicación que sabes: 50 × 6 = 300.",
      ),
      L(
        "Subtract what you used and keep going with what is left.",
        "Resta lo que usaste y sigue con lo que queda.",
      ),
      L(
        "If something is left that is smaller than the divisor, it is the remainder.",
        "Si sobra algo menor que el divisor, ese es el residuo.",
      ),
    ],
    misconception: L(
      "The quotient is the number of groups, not what is left over. Check: quotient × divisor + remainder = the total.",
      "El cociente es el número de grupos, no lo que sobra. Comprueba: cociente × divisor + residuo = el total.",
    ),
    misconceptions: [
      ...remainderDetectors,
      mis(
        "one-group-off",
        (item, raw) => {
          const p = binop(item);
          return (
            p &&
            p[1] === "÷" &&
            Number.isInteger(p[0] / p[2]) &&
            [p[0] / p[2] + 1, p[0] / p[2] - 1].some((w) => isNum(raw, w))
          );
        },
        "One group off. Check by multiplying: your answer × the divisor should give exactly the total.",
        "Te falta o te sobra un grupo. Comprueba multiplicando: tu respuesta × el divisor debe dar exactamente el total.",
      ),
    ],
    transfer: {
      prompt: L(
        "A baker packs 196 rolls into bags of 4. How many bags can she fill?",
        "Una panadera empaca 196 panecillos en bolsas de 4. ¿Cuántas bolsas puede llenar?",
      ),
      answers: ["49"],
      kind: "number",
      hint: L(
        "Start with 40 bags: 40 × 4 = 160.",
        "Empieza con 40 bolsas: 40 × 4 = 160.",
      ),
      explanation: L(
        "40 × 4 = 160, leaving 36. 9 × 4 = 36. 40 + 9 = 49 bags. 196 ÷ 4 = 49.",
        "40 × 4 = 160 y quedan 36. 9 × 4 = 36. 40 + 9 = 49 bolsas. 196 ÷ 4 = 49.",
      ),
    },
  },
  "4:factors": {
    concept: L(
      "A factor of a number divides it with nothing left over. A multiple of a number is that number times 1, 2, 3, and so on. Factors come in pairs that multiply to the number.",
      "Un factor de un número lo divide sin que sobre nada. Un múltiplo de un número es ese número por 1, 2, 3, y así sucesivamente. Los factores vienen en parejas que multiplicadas dan el número.",
    ),
    reasons: [
      L(
        "If 4 × 13 = 52, then 4 and 13 are a factor pair of 52, and 52 is a multiple of both.",
        "Si 4 × 13 = 52, entonces 4 y 13 son una pareja de factores de 52, y 52 es múltiplo de los dos.",
      ),
      L(
        "Every number has 1 and itself as factors.",
        "Todo número tiene como factores al 1 y a sí mismo.",
      ),
      L(
        "A prime number has exactly two factors; a composite number has more.",
        "Un número primo tiene exactamente dos factores; un número compuesto tiene más.",
      ),
    ],
    misconception: L(
      "Factors are small (they divide in); multiples are big (you get them by multiplying). And odd does not mean prime: 91 = 7 × 13.",
      "Los factores son pequeños (dividen al número); los múltiplos son grandes (salen al multiplicar). Y impar no significa primo: 91 = 7 × 13.",
    ),
    misconceptions: [
      mis(
        "missed-ends",
        (item, raw) => {
          const m = q(item).match(/How many factors does (\d+) have/);
          if (!m) return false;
          const n = Number(m[1]);
          let t = 0;
          for (let i = 1; i <= n; i += 1) if (n % i === 0) t += 1;
          return isNum(raw, t - 2);
        },
        "You left out 1 and the number itself. Every number has those two factors: 1 × n = n.",
        "Te faltaron el 1 y el propio número. Todo número tiene esos dos factores: 1 × n = n.",
      ),
      mis(
        "factor-multiple-swap",
        (item, raw) => {
          const f = q(item).match(/Is (\d+) a factor of (\d+)\?/);
          const m = q(item).match(/Is (\d+) a multiple of (\d+)\?/);
          const ans = (x) => (x ? "yes" : "no");
          if (f)
            return raw.toLowerCase() === ans(Number(f[1]) % Number(f[2]) === 0);
          if (m)
            return raw.toLowerCase() === ans(Number(m[2]) % Number(m[1]) === 0);
          return false;
        },
        "You answered the opposite question. “A is a factor of B” means A divides B. “A is a multiple of B” means B divides A.",
        "Contestaste la pregunta contraria. «A es factor de B» significa que A divide a B. «A es múltiplo de B» significa que B divide a A.",
      ),
      mis(
        "odd-means-prime",
        (item, raw) => {
          const m = q(item).match(/Is (\d+) prime or composite/);
          return (
            Boolean(m) &&
            Number(m[1]) % 2 === 1 &&
            raw.toLowerCase() === "prime"
          );
        },
        "Odd is not the same as prime. Try dividing by 3, 5 and 7: if one of them divides it, the number has more than two factors, so it is composite.",
        "Impar no es lo mismo que primo. Prueba dividir entre 3, 5 y 7: si alguno lo divide, el número tiene más de dos factores, así que es compuesto.",
      ),
    ],
    transfer: {
      prompt: L(
        "Ms. Ruiz has 24 desks. She wants equal rows with more than 1 desk in each row and more than 1 row. How many different row sizes can she use?",
        "La maestra Ruiz tiene 24 pupitres. Quiere filas iguales con más de 1 pupitre en cada fila y más de 1 fila. ¿Cuántos tamaños de fila diferentes puede usar?",
      ),
      answers: ["6"],
      kind: "number",
      hint: L(
        "List the factor pairs of 24.",
        "Haz la lista de parejas de factores de 24.",
      ),
      explanation: L(
        "24 = 1 × 24 = 2 × 12 = 3 × 8 = 4 × 6. Leave out 1 and 24: rows of 2, 3, 4, 6, 8 or 12, so 6 sizes.",
        "24 = 1 × 24 = 2 × 12 = 3 × 8 = 4 × 6. Sin el 1 ni el 24: filas de 2, 3, 4, 6, 8 o 12, así que 6 tamaños.",
      ),
    },
  },
  "4:fraction-equiv": {
    title: L("Make equivalent fractions", "Forma fracciones equivalentes"),
    concept: L(
      "Multiplying the numerator and the denominator by the same number cuts each piece into that many smaller pieces. The amount stays the same, so the fractions are equivalent.",
      "Multiplicar el numerador y el denominador por el mismo número corta cada pieza en esa cantidad de piezas más pequeñas. La cantidad no cambia, así que las fracciones son equivalentes.",
    ),
    reasons: [
      L(
        "Multiplying by 3/3 is multiplying by 1, so the value does not change.",
        "Multiplicar por 3/3 es multiplicar por 1, así que el valor no cambia.",
      ),
      L(
        "Find the factor from the parts you know: 9 to 27 is × 3.",
        "Encuentra el factor con las partes que sabes: de 9 a 27 es × 3.",
      ),
      L(
        "Use the same factor on the other part.",
        "Usa el mismo factor en la otra parte.",
      ),
    ],
    misconception: L(
      "Adding the same number to the top and bottom changes the amount (1/2 is not 2/3). Multiply both by the same number.",
      "Sumar el mismo número arriba y abajo cambia la cantidad (1/2 no es 2/3). Multiplica los dos por el mismo número.",
    ),
    misconceptions: equivDetectors,
    transfer: {
      prompt: L(
        "A recipe uses 3/4 cup of milk. Your measuring cup shows only eighths. How many eighths of a cup do you need?",
        "Una receta usa 3/4 de taza de leche. Tu taza de medir solo marca octavos. ¿Cuántos octavos de taza necesitas?",
      ),
      answers: ["6"],
      kind: "number",
      hint: L(
        "4 × 2 = 8. Do the same to the 3.",
        "4 × 2 = 8. Haz lo mismo con el 3.",
      ),
      explanation: L(
        "Each fourth is 2 eighths: 3 × 2 = 6. 3/4 = 6/8, so 6 eighths.",
        "Cada cuarto son 2 octavos: 3 × 2 = 6. 3/4 = 6/8, así que 6 octavos.",
      ),
    },
  },
  "4:fraction-compare": {
    title: L("Compare fractions", "Compara fracciones"),
    concept: L(
      "To compare fractions with different denominators, make the denominators the same, or compare each fraction to a benchmark like 1/2 or 1.",
      "Para comparar fracciones con denominadores distintos, haz iguales los denominadores o compara cada fracción con una referencia como 1/2 o 1.",
    ),
    reasons: [
      L(
        "With a common denominator the pieces are the same size, so compare the numerators.",
        "Con un denominador común las piezas son del mismo tamaño, así que compara los numeradores.",
      ),
      L(
        "5/8 is more than 1/2 (4/8) and 2/5 is less than 1/2, so 5/8 > 2/5.",
        "5/8 es más que 1/2 (4/8) y 2/5 es menos que 1/2, así que 5/8 > 2/5.",
      ),
      L(
        "A fraction equal to 1 has the same numerator and denominator.",
        "Una fracción igual a 1 tiene el mismo numerador y denominador.",
      ),
    ],
    misconception: L(
      "Do not compare only the numerators or only the denominators. Think about the amount each fraction names.",
      "No compares solo los numeradores o solo los denominadores. Piensa en la cantidad.",
    ),
    misconceptions: fractionCompareDetectors,
    transfer: {
      prompt: L(
        "Team A finished 5/6 of a project. Team B finished 7/9 of the same project. Which team finished more, A or B?",
        "El equipo A terminó 5/6 de un proyecto. El equipo B terminó 7/9 del mismo proyecto. ¿Qué equipo terminó más, el A o el B?",
      ),
      answers: ["A", "a", "team A", "el A"],
      kind: "text",
      hint: L(
        "Use 18 as a common denominator.",
        "Usa 18 como denominador común.",
      ),
      explanation: L(
        "5/6 = 15/18 and 7/9 = 14/18. 15/18 > 14/18, so team A finished more.",
        "5/6 = 15/18 y 7/9 = 14/18. 15/18 > 14/18, así que el equipo A terminó más.",
      ),
    },
  },
  "4:unit-conversion": {
    title: L("Change units of measure", "Cambia unidades de medida"),
    concept: L(
      "A smaller unit fits more times into the same amount. To change to a smaller unit, multiply by how many small units are in one big unit.",
      "Una unidad más pequeña cabe más veces en la misma cantidad. Para cambiar a una unidad más pequeña, multiplica por cuántas unidades pequeñas hay en una grande.",
    ),
    reasons: [
      L(
        "1 meter = 100 centimeters, so 3 meters = 3 × 100 centimeters.",
        "1 metro = 100 centímetros, así que 3 metros = 3 × 100 centímetros.",
      ),
      L(
        "1 hour = 60 minutes, not 100: time uses its own number.",
        "1 hora = 60 minutos, no 100: el tiempo usa su propio número.",
      ),
      L(
        "Check: the number of small units must be bigger than the number of big units.",
        "Comprueba: el número de unidades pequeñas debe ser mayor que el de unidades grandes.",
      ),
    ],
    misconception: L(
      "Use the right relationship for each unit pair: 100 cm in a meter, 1,000 g in a kilogram, 1,000 mL in a liter, 60 minutes in an hour.",
      "Usa la relación correcta para cada par de unidades: 100 cm en un metro, 1,000 g en un kilogramo, 1,000 mL en un litro, 60 minutos en una hora.",
    ),
    misconceptions: [
      mis(
        "wrong-factor",
        (item, raw) => {
          const c = conversion(item);
          return (
            Boolean(c) &&
            [10, 60, 100, 1000].some((f) => f !== c.f && isNum(raw, c.n * f))
          );
        },
        "You used the wrong number of small units in one big unit. Meters → centimeters is 100; kilograms → grams and liters → milliliters are 1,000; hours → minutes is 60.",
        "Usaste un número equivocado de unidades pequeñas en una grande. Metros → centímetros es 100; kilogramos → gramos y litros → mililitros es 1,000; horas → minutos es 60.",
      ),
      mis(
        "divided",
        (item, raw) => {
          const c = conversion(item);
          return Boolean(c) && isNum(raw, c.n / c.f);
        },
        "You divided, so you got fewer units. Smaller units need a BIGGER number for the same amount: multiply.",
        "Dividiste, así que te dieron menos unidades. Las unidades más pequeñas necesitan un número MAYOR para la misma cantidad: multiplica.",
      ),
    ],
    transfer: {
      prompt: L(
        "A field trip lasts 5 hours. How many minutes is the trip?",
        "Una excursión dura 5 horas. ¿Cuántos minutos dura la excursión?",
      ),
      answers: ["300"],
      kind: "number",
      unit: L("minutes", "minutos"),
      hint: L("Each hour is 60 minutes.", "Cada hora son 60 minutos."),
      explanation: L("5 × 60 = 300 minutes.", "5 × 60 = 300 minutos."),
    },
  },
  "4:mul-11-12": {
    title: L("Multiply by 11 and 12", "Multiplica por 11 y por 12"),
    concept: L(
      "Split 11 or 12 into 10 and a little more. Multiply by 10, multiply by the little part, then add.",
      "Separa el 11 o el 12 en 10 y un poquito más. Multiplica por 10, multiplica por la parte pequeña y luego suma.",
    ),
    reasons: [
      L(
        "12 = 10 + 2, so 13 × 12 = 13 × 10 + 13 × 2.",
        "12 = 10 + 2, así que 13 × 12 = 13 × 10 + 13 × 2.",
      ),
      L("130 + 26 = 156.", "130 + 26 = 156."),
      L(
        "An array of 12 rows is 10 rows and 2 more rows.",
        "Un arreglo de 12 filas son 10 filas y 2 filas más.",
      ),
    ],
    misconception: L(
      "When you split 12 into 10 + 2, multiply the 2 as well. 13 × 12 is 130 + 26, not 130 + 2.",
      "Cuando separas el 12 en 10 + 2, multiplica también el 2. 13 × 12 es 130 + 26, no 130 + 2.",
    ),
    misconceptions: [
      mis(
        "added-the-two",
        (item, raw) => {
          const p = binop(item);
          if (!p || p[1] !== "×") return false;
          const [a, b] =
            p[2] === 11 || p[2] === 12 ? [p[0], p[2]] : [p[2], p[0]];
          return (b === 11 || b === 12) && isNum(raw, a * 10 + (b - 10));
        },
        "You multiplied by 10 and then only added the 1 or 2. That small part is a number of GROUPS too: multiply it as well.",
        "Multiplicaste por 10 y luego solo sumaste el 1 o el 2. Esa parte pequeña también es un número de GRUPOS: multiplícala también.",
      ),
      mis(
        "wrote-side-by-side",
        (item, raw) => {
          const p = binop(item);
          if (!p || p[1] !== "×") return false;
          const [a, b] =
            p[2] === 11 || p[2] === 12 ? [p[0], p[2]] : [p[2], p[0]];
          return (
            (b === 11 || b === 12) &&
            raw.replace(/,/g, "") === `${a}${a * (b - 10)}`
          );
        },
        "You wrote the two parts side by side. They must be ADDED: the 10-part and the small part each stand for a value.",
        "Escribiste las dos partes una al lado de la otra. Hay que SUMARLAS: la parte de 10 y la parte pequeña tienen cada una un valor.",
      ),
    ],
    transfer: {
      prompt: L(
        "Eggs come in cartons of 12. A store has 15 cartons. How many eggs is that?",
        "Los huevos vienen en cartones de 12. Una tienda tiene 15 cartones. ¿Cuántos huevos son?",
      ),
      answers: ["180"],
      kind: "number",
      hint: L("15 × 10, then 15 × 2.", "15 × 10 y luego 15 × 2."),
      explanation: L(
        "15 × 10 = 150 and 15 × 2 = 30. 150 + 30 = 180 eggs.",
        "15 × 10 = 150 y 15 × 2 = 30. 150 + 30 = 180 huevos.",
      ),
    },
  },
  "4:line-plots": {
    title: L("Line plots with fractions", "Diagramas de puntos con fracciones"),
    concept: L(
      "A line plot puts one dot above a number line for each thing measured. The number of dots is HOW MANY; the place on the line is HOW LONG.",
      "Un diagrama de puntos pone un punto sobre la recta numérica por cada cosa medida. El número de puntos dice CUÁNTOS; el lugar en la recta dice CUÁNTO MIDE.",
    ),
    reasons: [
      L(
        "Count all the dots to find how many things were measured.",
        "Cuenta todos los puntos para saber cuántas cosas se midieron.",
      ),
      L(
        "“Longer than 1/4” means only the dots to the right of 1/4.",
        "«Más largo que 1/4» significa solo los puntos a la derecha de 1/4.",
      ),
      L(
        "To compare lengths, subtract the numbers on the line, not the dots.",
        "Para comparar longitudes, resta los números de la recta, no los puntos.",
      ),
    ],
    misconception: L(
      "Do not mix up dots and lengths. Dots count things; the fractions on the line are lengths.",
      "No confundas los puntos con las longitudes. Los puntos cuentan cosas; las fracciones de la recta son longitudes.",
    ),
    misconceptions: [
      mis(
        "included-the-quarter",
        (item, raw) => {
          const d = lineplot(item);
          return (
            Boolean(d) &&
            /longer than 1\/4/.test(q(item)) &&
            isNum(raw, d[0] + d[1] + d[2])
          );
        },
        "You counted every leaf. Leaves that are exactly 1/4 inch are not longer than 1/4 inch: count only the dots to the right of 1/4.",
        "Contaste todas las hojas. Las hojas que miden exactamente 1/4 de pulgada no son más largas que 1/4: cuenta solo los puntos a la derecha de 1/4.",
      ),
      mis(
        "counted-lengths",
        (item, raw) =>
          Boolean(lineplot(item)) &&
          /How many leaves were measured/.test(q(item)) &&
          isNum(raw, 3),
        "That is how many different LENGTHS there are. Each dot is one leaf: count all the dots.",
        "Esa es la cantidad de LONGITUDES diferentes. Cada punto es una hoja: cuenta todos los puntos.",
      ),
      mis(
        "longest-only",
        (item, raw) =>
          Boolean(lineplot(item)) &&
          /How many inches longer/.test(q(item)) &&
          isFrac(raw, 3 / 4),
        "That is the longest length. “How much longer” compares two lengths: subtract the shortest from the longest.",
        "Esa es la longitud más larga. «Cuánto más larga» compara dos longitudes: resta la más corta de la más larga.",
      ),
    ],
    transfer: {
      prompt: L(
        "A line plot shows pencil lengths: 5 inches has 2 dots, 5 1/2 inches has 3 dots, 6 inches has 1 dot. How many pencils are longer than 5 inches?",
        "Un diagrama de puntos muestra longitudes de lápices: 5 pulgadas tiene 2 puntos, 5 1/2 pulgadas tiene 3 puntos, 6 pulgadas tiene 1 punto. ¿Cuántos lápices miden más de 5 pulgadas?",
      ),
      answers: ["4"],
      kind: "number",
      hint: L(
        "Count only the dots to the right of 5.",
        "Cuenta solo los puntos a la derecha del 5.",
      ),
      explanation: L(
        "5 1/2 inches has 3 dots and 6 inches has 1 dot: 3 + 1 = 4 pencils.",
        "5 1/2 pulgadas tiene 3 puntos y 6 pulgadas tiene 1 punto: 3 + 1 = 4 lápices.",
      ),
    },
  },
  "4:mixed-numbers": {
    concept: L(
      "A mixed number like 2 3/10 is wholes and a part. Each whole is 10 tenths, so 2 3/10 = 10/10 + 10/10 + 3/10 = 23/10. Both name the same amount.",
      "Un número mixto como 2 3/10 son enteros y una parte. Cada entero son 10 décimos, así que 2 3/10 = 10/10 + 10/10 + 3/10 = 23/10. Los dos nombran la misma cantidad.",
    ),
    reasons: [
      L(
        "Wholes × parts in each whole counts the parts in the wholes: 2 × 10 = 20.",
        "Enteros × partes en cada entero cuenta las partes de los enteros: 2 × 10 = 20.",
      ),
      L(
        "Add the extra parts: 20 + 3 = 23 tenths.",
        "Suma las partes extra: 20 + 3 = 23 décimos.",
      ),
      L(
        "Going back, divide: 23 ÷ 10 = 2 R 3, so 2 wholes and 3 tenths.",
        "Al revés, divide: 23 ÷ 10 = 2 R 3, así que 2 enteros y 3 décimos.",
      ),
    ],
    misconception: L(
      "Do not just add the whole to the numerator. Each whole holds a full denominator's worth of parts: multiply first.",
      "No sumes solo el entero al numerador. Cada entero tiene tantas partes como dice el denominador: primero multiplica.",
    ),
    misconceptions: [
      mis(
        "added-whole",
        (item, raw) => {
          const m = mixedQ(item);
          return m?.to === "improper" && typed(raw) === `${m.w + m.n}/${m.d}`;
        },
        "You added the whole number to the numerator. Each whole is a full set of parts, so multiply the whole by the denominator first, then add the numerator.",
        "Sumaste el número entero al numerador. Cada entero es un grupo completo de partes, así que primero multiplica el entero por el denominador y luego suma el numerador.",
      ),
      mis(
        "forgot-parts",
        (item, raw) => {
          const m = mixedQ(item);
          return m?.to === "improper" && typed(raw) === `${m.w * m.d}/${m.d}`;
        },
        "You counted the parts in the wholes but left out the extra parts. Add the numerator too.",
        "Contaste las partes de los enteros pero te faltaron las partes extra. Suma también el numerador.",
      ),
      mis(
        "swapped",
        (item, raw) => {
          const m = mixedQ(item);
          if (m?.to !== "mixed") return false;
          const w = Math.floor(m.N / m.d);
          const r = m.N % m.d;
          return r > 0 && r !== w && typed(raw) === `${r} ${w}/${m.d}`;
        },
        "You swapped the quotient and the remainder. The quotient is the number of WHOLES; the remainder is the parts left over, written over the denominator.",
        "Cambiaste el cociente por el residuo. El cociente es el número de ENTEROS; el residuo son las partes que sobran, escritas sobre el denominador.",
      ),
    ],
    living: mixedModel,
    transfer: {
      prompt: L(
        "A baker uses 1/3 cup of oil for each batch. She has used 3 1/3 cups. How many batches has she made?",
        "Una panadera usa 1/3 de taza de aceite en cada tanda. Ha usado 3 1/3 tazas. ¿Cuántas tandas ha hecho?",
      ),
      answers: ["10"],
      kind: "number",
      hint: L(
        "How many thirds are in 3 1/3?",
        "¿Cuántos tercios hay en 3 1/3?",
      ),
      explanation: L(
        "3 wholes are 3 × 3 = 9 thirds, plus 1 more third: 9 + 1 = 10 thirds. 3 1/3 = 10/3, so 10 batches.",
        "3 enteros son 3 × 3 = 9 tercios, más 1 tercio: 9 + 1 = 10 tercios. 3 1/3 = 10/3, así que 10 tandas.",
      ),
    },
  },
  "4:angle-measure": {
    title: L("Measure and add angles", "Mide y suma ángulos"),
    concept: L(
      "An angle measures a turn, in degrees. A full turn is 360°, a straight angle is 180° and a right angle is 90°. Angles that sit side by side add.",
      "Un ángulo mide un giro, en grados. Un giro completo es 360°, un ángulo llano es 180° y un ángulo recto es 90°. Los ángulos que están lado a lado se suman.",
    ),
    reasons: [
      L(
        "Two angles that share a ray and do not overlap make a bigger angle: their measures add.",
        "Dos ángulos que comparten un rayo y no se superponen forman un ángulo mayor: sus medidas se suman.",
      ),
      L(
        "If the big angle is known, the missing part is big − known.",
        "Si conoces el ángulo grande, la parte que falta es grande − conocido.",
      ),
      L(
        "A fraction of a turn is that fraction of 360°: a quarter turn is a right angle.",
        "Una fracción de giro es esa fracción de 360°: un cuarto de giro es un ángulo recto.",
      ),
    ],
    misconception: L(
      "Use the right whole: a right angle is 90°, a straight angle is 180°. Do not use 180 when the angle is a right angle.",
      "Usa el total correcto: un ángulo recto es 90° y un ángulo llano es 180°. No uses 180 cuando el ángulo es recto.",
    ),
    misconceptions: [
      mis(
        "wrong-whole",
        (item, raw) => {
          const m = q(item).match(
            /A (right|straight) angle \((\d+)°\) is split into two angles\. One angle measures (\d+)°/,
          );
          if (!m) return false;
          const x = Number(m[3]);
          return m[1] === "right"
            ? isNum(raw, 180 - x)
            : [90 - x, 360 - x].some((w) => w > 0 && isNum(raw, w));
        },
        "You used the wrong whole angle. A right angle is 90° and a straight angle is 180°: subtract the known part from the angle named in the problem.",
        "Usaste el ángulo total equivocado. Un ángulo recto mide 90° y un ángulo llano mide 180°: resta la parte conocida del ángulo que dice el problema.",
      ),
      mis(
        "subtracted",
        (item, raw) => {
          const m = q(item).match(/They measure (\d+)° and (\d+)°/);
          return (
            Boolean(m) && isNum(raw, Math.abs(Number(m[1]) - Number(m[2])))
          );
        },
        "The angles are side by side with no gap, so together they make a BIGGER angle. Add the measures.",
        "Los ángulos están lado a lado sin espacio, así que juntos forman un ángulo MAYOR. Suma las medidas.",
      ),
    ],
    living: angleModel,
    transfer: {
      prompt: L(
        "A pizza is cut through the center into 8 equal slices. What angle, in degrees, is at the tip of each slice?",
        "Una pizza se corta por el centro en 8 rebanadas iguales. ¿Cuántos grados mide el ángulo en la punta de cada rebanada?",
      ),
      answers: ["45"],
      kind: "number",
      unit: L("degrees", "grados"),
      hint: L(
        "All the slices together make one full turn: 360°.",
        "Todas las rebanadas juntas forman un giro completo: 360°.",
      ),
      explanation: L(
        "8 equal angles fill 360°: 360 ÷ 8 = 45°.",
        "8 ángulos iguales llenan 360°: 360 ÷ 8 = 45°.",
      ),
    },
  },
};
