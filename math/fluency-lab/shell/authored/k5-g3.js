// Grade 3 — authored explanations. Every model is tied to an equation: arrays to ×, area to l × w, number lines to
// fractions, bar graphs to scale × squares.
import {
  L,
  binop,
  compareFractions,
  equivQuestion,
  isFrac,
  isNum,
  mis,
  nums,
  q,
  right,
  roundQuestion,
  subNoDecrement,
  sym,
} from "./k5-kit.js";
import { timeDetectors } from "./k5-g1.js";
import { flipSub, noRegroupAdd } from "./k5-g2.js";
import { arrayModel, scaledGraphModel, tensGroupsModel } from "./lm-35.js";

const mul = (item) => {
  const p = binop(item);
  return p && p[1] === "×" ? [p[0], p[2]] : null;
};
export const mulAdded = mis(
  "added",
  (item, raw) => {
    const p = mul(item);
    return p && p[0] > 1 && p[1] > 1 && isNum(raw, p[0] + p[1]);
  },
  "You added the two numbers. × means equal groups: one number is how many groups, the other is how many in each group.",
  "Sumaste los dos números. × significa grupos iguales: un número es cuántos grupos hay y el otro es cuántos hay en cada grupo.",
);
export const mulOneGroupOff = mis(
  "one-group-off",
  (item, raw) => {
    const p = mul(item);
    if (!p) return false;
    const [a, b] = p;
    return (
      a > 0 &&
      b > 0 &&
      [a * b + a, a * b - a, a * b + b, a * b - b].some((w) => isNum(raw, w))
    );
  },
  "You are one group away. Skip-counting can lose or add a group. Count the groups as you go, or start from a fact you know (like 5 groups) and add or take away one group.",
  "Estás a un grupo de distancia. Al contar saltando se puede perder o agregar un grupo. Cuenta los grupos mientras avanzas, o empieza con un dato que sepas (como 5 grupos) y suma o quita un grupo.",
);

export const roundDetectors = [
  mis(
    "wrong-direction",
    (item, raw) => {
      const r = roundQuestion(item);
      if (!r) return false;
      const down = Math.floor(r.n / r.to) * r.to;
      return down !== r.n && [down, down + r.to].some((w) => isNum(raw, w));
    },
    "You went to the other neighbor. Look at the digit just to the right of the rounding place: 5 or more rounds up, 4 or less rounds down.",
    "Fuiste al otro vecino. Mira el dígito justo a la derecha del lugar que redondeas: 5 o más redondea hacia arriba, 4 o menos hacia abajo.",
  ),
  mis(
    "wrong-place",
    (item, raw) => {
      const r = roundQuestion(item);
      if (!r) return false;
      return [r.to * 10, r.to / 10].some(
        (to) => to >= 10 && isNum(raw, Math.round(r.n / to) * to),
      );
    },
    "You rounded to a different place. Check which place the question names: nearest ten, hundred or thousand.",
    "Redondeaste a otro lugar. Revisa qué lugar pide la pregunta: decena, centena o millar más cercano.",
  ),
];

export const equivDetectors = [
  mis(
    "additive",
    (item, raw) => {
      const e = equivQuestion(item);
      if (!e) return false;
      return e.missing === "top"
        ? isNum(raw, e.a + (e.known - e.b))
        : isNum(raw, e.b + (e.known - e.a));
    },
    "You added the same amount to the top and bottom. That changes the size of the fraction. Equal fractions come from MULTIPLYING the top and the bottom by the same number.",
    "Sumaste la misma cantidad arriba y abajo. Eso cambia el tamaño de la fracción. Las fracciones equivalentes salen de MULTIPLICAR el numerador y el denominador por el mismo número.",
  ),
  mis(
    "factor",
    (item, raw) => {
      const e = equivQuestion(item);
      if (!e) return false;
      const f = e.missing === "top" ? e.known / e.b : e.known / e.a;
      return Number.isInteger(f) && f > 1 && isNum(raw, f);
    },
    "That is the number you multiply by, the scale factor. Now use it: multiply the other part of the fraction by it.",
    "Ese es el número por el que multiplicas, el factor. Ahora úsalo: multiplica la otra parte de la fracción por él.",
  ),
];
export const fractionCompareDetectors = [
  mis(
    "bigger-denominator",
    (item, raw) => {
      const f = compareFractions(item);
      return Boolean(f) && f[1] !== f[3] && raw === sym(f[1], f[3]);
    },
    "A bigger denominator means MORE pieces, so each piece is SMALLER. 1/8 is less than 1/4. Compare the size of the pieces, not the denominator as a number.",
    "Un denominador mayor significa MÁS piezas, así que cada pieza es MÁS PEQUEÑA. 1/8 es menor que 1/4. Compara el tamaño de las piezas, no el denominador como número.",
  ),
  mis(
    "numerators-only",
    (item, raw) => {
      const f = compareFractions(item);
      return Boolean(f) && f[1] !== f[3] && raw === sym(f[0], f[2]);
    },
    "You compared only the tops. The pieces are different sizes, so the tops alone do not decide. Use a benchmark like 1/2 or 1, or make the denominators the same.",
    "Comparaste solo los numeradores. Las piezas son de tamaños diferentes, así que los numeradores solos no deciden. Usa una referencia como 1/2 o 1, o haz iguales los denominadores.",
  ),
];

const rect = (item) => {
  const m = q(item).match(/length (\d+) and width (\d+)/);
  return m ? [Number(m[1]), Number(m[2])] : null;
};
const scaled = (item) => {
  const s = q(item);
  const k = s.match(/stands for (\d+)/);
  const one = s.match(/bar for Class A has (\d+) squares/);
  const two = s.match(
    /Class A's bar has (\d+) squares and Class B's bar has (\d+) squares/,
  );
  if (!k) return null;
  return {
    k: Number(k[1]),
    a: Number((one || two)?.[1]),
    b: two ? Number(two[2]) : null,
  };
};

export const G3 = {
  "3:mul-0-5": {
    title: L(
      "Multiplication facts with 0 to 5",
      "Tablas de multiplicar del 0 al 5",
    ),
    concept: L(
      "Multiplication counts equal groups. 4 × 6 means 4 groups of 6. An array shows it as 4 rows with 6 in each row.",
      "La multiplicación cuenta grupos iguales. 4 × 6 significa 4 grupos de 6. Un arreglo lo muestra como 4 filas con 6 en cada fila.",
    ),
    reasons: [
      L(
        "Each row is one group, so add the row once for each row.",
        "Cada fila es un grupo, así que suma la fila una vez por cada fila.",
      ),
      L(
        "Turning the array does not change the count, so 4 × 6 = 6 × 4.",
        "Girar el arreglo no cambia el total, así que 4 × 6 = 6 × 4.",
      ),
      L(
        "0 groups, or groups of 0, have nothing in them: anything × 0 = 0.",
        "0 grupos, o grupos de 0, no tienen nada: cualquier número × 0 = 0.",
      ),
    ],
    misconception: L(
      "× is not +. 4 × 6 is four 6s, not 4 and 6 put together. And × 0 gives 0, not the other number.",
      "× no es +. 4 × 6 son cuatro veces 6, no 4 y 6 juntos. Y × 0 da 0, no el otro número.",
    ),
    misconceptions: [
      mulAdded,
      mulOneGroupOff,
      mis(
        "times-zero",
        (item, raw) => {
          const p = mul(item);
          return p && (p[0] === 0 || p[1] === 0) && isNum(raw, p[0] + p[1]);
        },
        "Times 0 means zero groups, or groups with nothing in them. There is nothing to count, so the product is 0.",
        "Por 0 significa cero grupos, o grupos sin nada. No hay nada que contar, así que el producto es 0.",
      ),
    ],
    living: arrayModel({ rows: [0, 5, 4], cols: [1, 10, 6], split: false }),
    transfer: {
      prompt: L(
        "A pack has 4 juice boxes. How many juice boxes are in 5 packs?",
        "Un paquete tiene 4 jugos. ¿Cuántos jugos hay en 5 paquetes?",
      ),
      answers: ["20"],
      kind: "number",
      hint: L(
        "5 groups of 4: count by 4s five times.",
        "5 grupos de 4: cuenta de 4 en 4 cinco veces.",
      ),
      explanation: L(
        "5 × 4 = 4 + 4 + 4 + 4 + 4 = 20 juice boxes.",
        "5 × 4 = 4 + 4 + 4 + 4 + 4 = 20 jugos.",
      ),
    },
  },
  "3:mul-6-9": {
    title: L(
      "Multiplication facts with 6 to 9",
      "Tablas de multiplicar del 6 al 9",
    ),
    concept: L(
      "Bigger facts can be built from facts you know. Split one factor into 5 and the rest, multiply each part, then add.",
      "Las tablas más grandes se pueden armar con las que ya sabes. Separa un factor en 5 y el resto, multiplica cada parte y luego suma.",
    ),
    reasons: [
      L(
        "7 rows of 8 is 5 rows of 8 and 2 more rows of 8.",
        "7 filas de 8 son 5 filas de 8 y 2 filas más de 8.",
      ),
      L(
        "Find the two smaller products, then add them: 7 × 8 = 5 × 8 + 2 × 8.",
        "Encuentra los dos productos más pequeños y súmalos: 7 × 8 = 5 × 8 + 2 × 8.",
      ),
      L(
        "Splitting the rows does not change how many dots there are.",
        "Separar las filas no cambia cuántos puntos hay.",
      ),
    ],
    misconception: L(
      "When you split a fact, multiply BOTH parts. 7 × 8 is 5 × 8 plus 2 × 8, not 5 × 8 plus 2.",
      "Cuando separas una tabla, multiplica LAS DOS partes. 7 × 8 es 5 × 8 más 2 × 8, no 5 × 8 más 2.",
    ),
    misconceptions: [mulAdded, mulOneGroupOff],
    living: arrayModel({ rows: [6, 9, 7], cols: [2, 10, 8], split: true }),
    transfer: {
      prompt: L(
        "A spider has 8 legs. How many legs do 6 spiders have?",
        "Una araña tiene 8 patas. ¿Cuántas patas tienen 6 arañas?",
      ),
      answers: ["48"],
      kind: "number",
      hint: L(
        "Start with 5 spiders, then add one more spider.",
        "Empieza con 5 arañas y luego suma una araña más.",
      ),
      explanation: L(
        "5 × 8 = 40, plus 1 × 8 = 8: 40 + 8 = 48 legs. 6 × 8 = 48.",
        "5 × 8 = 40, más 1 × 8 = 8: 40 + 8 = 48 patas. 6 × 8 = 48.",
      ),
    },
  },
  "3:mul-10-12": {
    title: L("Multiply by multiples of 10", "Multiplica por múltiplos de 10"),
    concept: L(
      "A multiple of 10 is a number of tens. 13 × 20 is 13 × 2 tens, which is 26 tens, or 260.",
      "Un múltiplo de 10 es un número de decenas. 13 × 20 es 13 × 2 decenas, que son 26 decenas, o sea 260.",
    ),
    reasons: [
      L("20 is 2 tens.", "20 son 2 decenas."),
      L(
        "Multiply the tens like ones: 13 × 2 = 26, so 26 tens.",
        "Multiplica las decenas como si fueran unidades: 13 × 2 = 26, o sea 26 decenas.",
      ),
      L(
        "26 tens is 260, so the answer ends in one zero.",
        "26 decenas son 260, así que la respuesta termina en un cero.",
      ),
    ],
    misconception: L(
      "Keep track of the ten. 13 × 20 is 26 TENS: write 260, not 26 (lost the ten) and not 2,600 (an extra ten).",
      "No pierdas la decena. 13 × 20 son 26 DECENAS: escribe 260, no 26 (se perdió la decena) ni 2,600 (una decena de más).",
    ),
    misconceptions: [
      mis(
        "dropped-zero",
        (item, raw) => {
          const p = mul(item);
          return p && p[1] % 10 === 0 && isNum(raw, (p[0] * p[1]) / 10);
        },
        "You multiplied the digits but lost the ten. The second number is a number of TENS, so the product is that many tens.",
        "Multiplicaste los dígitos pero perdiste la decena. El segundo número es una cantidad de DECENAS, así que el producto es esa cantidad de decenas.",
      ),
      mis(
        "extra-zero",
        (item, raw) => {
          const p = mul(item);
          return p && p[1] % 10 === 0 && isNum(raw, p[0] * p[1] * 10);
        },
        "One zero too many. Only one factor is a number of tens, so the product has one ten-factor, not two.",
        "Un cero de más. Solo un factor es una cantidad de decenas, así que el producto tiene un factor de diez, no dos.",
      ),
    ],
    living: tensGroupsModel,
    transfer: {
      prompt: L(
        "A box holds 30 crayons. How many crayons are in 6 boxes?",
        "Una caja tiene 30 crayones. ¿Cuántos crayones hay en 6 cajas?",
      ),
      answers: ["180"],
      kind: "number",
      hint: L(
        "30 is 3 tens. What is 6 × 3 tens?",
        "30 son 3 decenas. ¿Cuánto es 6 × 3 decenas?",
      ),
      explanation: L(
        "6 × 3 = 18, so 6 × 30 is 18 tens = 180 crayons.",
        "6 × 3 = 18, así que 6 × 30 son 18 decenas = 180 crayones.",
      ),
    },
  },
  "3:division-facts": {
    concept: L(
      "Division shares a total into equal groups. 56 ÷ 7 asks: 7 groups of what make 56? Every division fact has a multiplication fact behind it.",
      "La división reparte un total en grupos iguales. 56 ÷ 7 pregunta: ¿7 grupos de cuánto hacen 56? Cada división tiene una multiplicación detrás.",
    ),
    reasons: [
      L(
        "Division undoes multiplication: if 13 × 4 = 52, then 52 ÷ 13 = 4.",
        "La división deshace la multiplicación: si 13 × 4 = 52, entonces 52 ÷ 13 = 4.",
      ),
      L(
        "Think of the array: the total is the dots, the divisor is the rows.",
        "Piensa en el arreglo: el total son los puntos y el divisor son las filas.",
      ),
      L(
        "The answer is how many are in each row.",
        "La respuesta es cuántos hay en cada fila.",
      ),
    ],
    misconception: L(
      "Dividing is not subtracting once. Ask the multiplication question: what times the divisor makes the total?",
      "Dividir no es restar una vez. Hazte la pregunta de multiplicar: ¿qué número por el divisor da el total?",
    ),
    misconceptions: [
      mis(
        "subtracted",
        (item, raw) => {
          const p = binop(item);
          return p && p[1] === "÷" && isNum(raw, p[0] - p[2]);
        },
        "You subtracted. Division asks how many equal groups (or how many in each group). Think: what number times the divisor makes the total?",
        "Restaste. La división pregunta cuántos grupos iguales hay (o cuántos hay en cada grupo). Piensa: ¿qué número por el divisor da el total?",
      ),
      mis(
        "multiplied",
        (item, raw) => {
          const p = binop(item);
          return p && p[1] === "÷" && isNum(raw, p[0] * p[2]);
        },
        "You multiplied. Division goes the other way: the answer times the divisor must give the total, so it is smaller than the total.",
        "Multiplicaste. La división va al revés: la respuesta por el divisor debe dar el total, así que es menor que el total.",
      ),
      mis(
        "one-group-off",
        (item, raw) => {
          const p = binop(item);
          return (
            p &&
            p[1] === "÷" &&
            [p[0] / p[2] + 1, p[0] / p[2] - 1].some(
              (w) => w > 0 && isNum(raw, w),
            )
          );
        },
        "Close: check with multiplication. Your answer times the divisor does not make the total.",
        "Cerca: comprueba con una multiplicación. Tu respuesta por el divisor no da el total.",
      ),
    ],
    transfer: {
      prompt: L(
        "42 chairs are set up in 6 equal rows. How many chairs are in each row?",
        "Se colocan 42 sillas en 6 filas iguales. ¿Cuántas sillas hay en cada fila?",
      ),
      answers: ["7"],
      kind: "number",
      hint: L("6 times what makes 42?", "¿6 por cuánto da 42?"),
      explanation: L(
        "6 × 7 = 42, so 42 ÷ 6 = 7 chairs in each row.",
        "6 × 7 = 42, así que 42 ÷ 6 = 7 sillas en cada fila.",
      ),
    },
  },
  "3:add-sub-1000": {
    title: L("Add and subtract to 1,000", "Suma y resta hasta 1,000"),
    concept: L(
      "Add or subtract place by place. In addition, 10 of a place become 1 of the next place. In subtraction, 1 of a place can be opened into 10 of the place to its right.",
      "Suma o resta lugar por lugar. En la suma, 10 de un lugar se vuelven 1 del lugar siguiente. En la resta, 1 de un lugar se puede abrir en 10 del lugar de su derecha.",
    ),
    reasons: [
      L(
        "Regrouping changes how a number is written, never how much it is.",
        "Reagrupar cambia cómo se escribe un número, nunca cuánto vale.",
      ),
      L(
        "Subtraction and addition check each other: difference + the number you took away = the start.",
        "La resta y la suma se comprueban: diferencia + el número que quitaste = el inicio.",
      ),
      L(
        "Estimate with hundreds first to know about how big the answer is.",
        "Primero estima con centenas para saber más o menos qué tan grande es la respuesta.",
      ),
    ],
    misconception: L(
      "In subtraction, when you open a ten, take it away from the tens. And never take the top digit from the bottom one.",
      "En la resta, cuando abres una decena, quítala de las decenas. Y nunca restes el dígito de arriba del de abajo.",
    ),
    misconceptions: [
      noRegroupAdd,
      flipSub,
      mis(
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
        "You made 10 more ones (or tens), but the place you took them from still has its old digit. Opening a ten takes 1 away from the tens.",
        "Formaste 10 unidades (o decenas) más, pero el lugar de donde las tomaste sigue con su dígito de antes. Abrir una decena quita 1 de las decenas.",
      ),
    ],
    transfer: {
      prompt: L(
        "A theater has 650 seats. 278 seats are filled. How many seats are empty?",
        "Un teatro tiene 650 asientos. 278 asientos están ocupados. ¿Cuántos asientos están vacíos?",
      ),
      answers: ["372"],
      kind: "number",
      hint: L(
        "Count up from 278: to 300, then to 650.",
        "Cuenta desde 278: hasta 300 y luego hasta 650.",
      ),
      explanation: L(
        "278 + 22 = 300 and 300 + 350 = 650. 22 + 350 = 372 empty seats. Check: 278 + 372 = 650.",
        "278 + 22 = 300 y 300 + 350 = 650. 22 + 350 = 372 asientos vacíos. Comprueba: 278 + 372 = 650.",
      ),
    },
  },
  "3:round": {
    title: L(
      "Round to the nearest ten or hundred",
      "Redondea a la decena o centena más cercana",
    ),
    concept: L(
      "Rounding finds the nearest friendly number. A number sits between two tens (or two hundreds); it rounds to the one it is closer to.",
      "Redondear encuentra el número cómodo más cercano. Un número está entre dos decenas (o dos centenas); se redondea a la que está más cerca.",
    ),
    reasons: [
      L(
        "On a number line, 463 sits between 400 and 500.",
        "En la recta numérica, 463 está entre 400 y 500.",
      ),
      L(
        "The halfway point is 450; 463 is past it, so it is closer to 500.",
        "El punto medio es 450; 463 lo pasa, así que está más cerca de 500.",
      ),
      L(
        "The digit right of the rounding place tells which side: 5 or more goes up.",
        "El dígito a la derecha del lugar que redondeas dice de qué lado: 5 o más sube.",
      ),
    ],
    misconception: L(
      "Rounding is not cutting off digits. 463 is closer to 500 than to 400, so it rounds up, not down.",
      "Redondear no es borrar dígitos. 463 está más cerca de 500 que de 400, así que se redondea hacia arriba, no hacia abajo.",
    ),
    misconceptions: roundDetectors,
    transfer: {
      prompt: L(
        "A school has 347 students. About how many students is that, to the nearest hundred?",
        "Una escuela tiene 347 estudiantes. ¿Más o menos cuántos estudiantes son, a la centena más cercana?",
      ),
      answers: ["300"],
      kind: "number",
      hint: L(
        "Which two hundreds is 347 between? Which one is closer?",
        "¿Entre qué dos centenas está 347? ¿Cuál está más cerca?",
      ),
      explanation: L(
        "The halfway point is 350, and 347 is below it, so 347 rounds to 300.",
        "El punto medio es 350 y 347 está antes, así que 347 se redondea a 300.",
      ),
    },
  },
  "3:fraction-equivalence": {
    title: L(
      "Fractions that name the same amount",
      "Fracciones que nombran la misma cantidad",
    ),
    concept: L(
      "Equivalent fractions name the same amount with different-sized pieces. Cut every piece into the same number of smaller pieces: the top and the bottom are multiplied by that number.",
      "Las fracciones equivalentes nombran la misma cantidad con piezas de distinto tamaño. Corta cada pieza en el mismo número de piezas más pequeñas: el numerador y el denominador se multiplican por ese número.",
    ),
    reasons: [
      L(
        "Cut each third into 2 pieces: 3 pieces become 6.",
        "Corta cada tercio en 2: 3 piezas se vuelven 6.",
      ),
      L(
        "The shaded part does not change size, but it now has twice as many pieces.",
        "La parte sombreada no cambia de tamaño, pero ahora tiene el doble de piezas.",
      ),
      L(
        "So the top and the bottom are multiplied by the SAME number.",
        "Así que el numerador y el denominador se multiplican por el MISMO número.",
      ),
    ],
    misconception: L(
      "Adding the same number to the top and bottom changes the amount. Multiply both by the same number instead.",
      "Sumar el mismo número arriba y abajo cambia la cantidad. Mejor multiplica los dos por el mismo número.",
    ),
    misconceptions: equivDetectors,
    transfer: {
      prompt: L(
        "Jo eats 2/3 of a pizza cut into 3 slices. Kim's pizza is the same size but cut into 6 slices. How many slices must Kim eat to eat the same amount as Jo?",
        "Jo come 2/3 de una pizza cortada en 3 rebanadas. La pizza de Kim es del mismo tamaño pero está cortada en 6 rebanadas. ¿Cuántas rebanadas debe comer Kim para comer lo mismo que Jo?",
      ),
      answers: ["4"],
      kind: "number",
      hint: L(
        "Each of Jo's slices is 2 of Kim's slices.",
        "Cada rebanada de Jo son 2 rebanadas de Kim.",
      ),
      explanation: L(
        "6 is 3 × 2, so each slice is cut in 2: 2 × 2 = 4. 2/3 = 4/6, so Kim eats 4 slices.",
        "6 es 3 × 2, así que cada rebanada se corta en 2: 2 × 2 = 4. 2/3 = 4/6, así que Kim come 4 rebanadas.",
      ),
    },
  },
  "3:fraction-compare": {
    concept: L(
      "To compare fractions, compare the amounts. With the same number of pieces, compare the piece sizes; with same-size pieces, compare how many.",
      "Para comparar fracciones, compara las cantidades. Con el mismo número de piezas, compara el tamaño; con piezas del mismo tamaño, compara cuántas hay.",
    ),
    reasons: [
      L(
        "Same denominator: the pieces are the same size, so more pieces is more.",
        "Mismo denominador: las piezas son del mismo tamaño, así que más piezas es más.",
      ),
      L(
        "Same numerator: the bigger denominator makes smaller pieces, so it is less.",
        "Mismo numerador: el denominador mayor hace piezas más pequeñas, así que es menos.",
      ),
      L(
        "Otherwise, compare each one to 1/2 or to 1.",
        "Si no, compara cada una con 1/2 o con 1.",
      ),
    ],
    misconception: L(
      "A bigger denominator is NOT a bigger fraction. 1/8 < 1/4, because eighths are smaller pieces than fourths.",
      "Un denominador mayor NO es una fracción mayor. 1/8 < 1/4, porque los octavos son piezas más pequeñas que los cuartos.",
    ),
    misconceptions: fractionCompareDetectors,
    transfer: {
      prompt: L(
        "Ana runs 3/4 of a mile. Ben runs 3/8 of a mile. Who runs farther, Ana or Ben?",
        "Ana corre 3/4 de milla. Ben corre 3/8 de milla. ¿Quién corre más lejos, Ana o Ben?",
      ),
      answers: ["Ana", "ana"],
      kind: "text",
      hint: L(
        "Both ran 3 pieces. Which pieces are bigger, fourths or eighths?",
        "Los dos corrieron 3 piezas. ¿Cuáles son más grandes, los cuartos o los octavos?",
      ),
      explanation: L(
        "Fourths are bigger than eighths, so 3 fourths is more: 3/4 > 3/8. Ana runs farther.",
        "Los cuartos son más grandes que los octavos, así que 3 cuartos es más: 3/4 > 3/8. Ana corre más lejos.",
      ),
    },
  },
  "3:area": {
    title: L("Area of a rectangle", "Área de un rectángulo"),
    concept: L(
      "Area is how many unit squares cover a shape. A rectangle is rows of squares, so its area is length × width.",
      "El área es cuántos cuadrados unitarios cubren una figura. Un rectángulo son filas de cuadrados, así que su área es largo × ancho.",
    ),
    reasons: [
      L(
        "The length tells how many squares fit in one row.",
        "El largo dice cuántos cuadrados caben en una fila.",
      ),
      L(
        "The width tells how many rows there are.",
        "El ancho dice cuántas filas hay.",
      ),
      L(
        "Rows × squares in each row = all the squares: an array.",
        "Filas × cuadrados en cada fila = todos los cuadrados: un arreglo.",
      ),
    ],
    misconception: L(
      "Area is not the distance around. That is perimeter. Area counts the squares INSIDE: multiply length × width.",
      "El área no es la distancia alrededor. Eso es el perímetro. El área cuenta los cuadrados de ADENTRO: multiplica largo × ancho.",
    ),
    misconceptions: [
      mis(
        "perimeter",
        (item, raw) => {
          const r = rect(item);
          return /^Area/.test(q(item)) && r && isNum(raw, 2 * (r[0] + r[1]));
        },
        "That is the PERIMETER, the distance around. Area counts the squares that cover the inside: length × width.",
        "Ese es el PERÍMETRO, la distancia alrededor. El área cuenta los cuadrados que cubren el interior: largo × ancho.",
      ),
      mis(
        "added",
        (item, raw) => {
          const r = rect(item);
          return /^Area/.test(q(item)) && r && isNum(raw, r[0] + r[1]);
        },
        "You added the length and the width. Area is rows of squares: width rows, with length squares in each, so multiply.",
        "Sumaste el largo y el ancho. El área son filas de cuadrados: tantas filas como el ancho, con tantos cuadrados como el largo en cada una, así que multiplica.",
      ),
    ],
    transfer: {
      prompt: L(
        "A rug is 6 feet long and 4 feet wide. How many square feet of floor does it cover?",
        "Una alfombra mide 6 pies de largo y 4 pies de ancho. ¿Cuántos pies cuadrados de piso cubre?",
      ),
      answers: ["24"],
      kind: "number",
      unit: L("square feet", "pies cuadrados"),
      hint: L("4 rows of 6 squares.", "4 filas de 6 cuadrados."),
      explanation: L(
        "4 rows of 6 square feet: 6 × 4 = 24 square feet.",
        "4 filas de 6 pies cuadrados: 6 × 4 = 24 pies cuadrados.",
      ),
    },
  },
  "3:perimeter": {
    title: L("Perimeter of a rectangle", "Perímetro de un rectángulo"),
    concept: L(
      "Perimeter is the distance all the way around a shape. A rectangle has two lengths and two widths, so add all four sides.",
      "El perímetro es la distancia alrededor de una figura. Un rectángulo tiene dos largos y dos anchos, así que suma los cuatro lados.",
    ),
    reasons: [
      L(
        "Walk around the rectangle: length, width, length, width.",
        "Camina alrededor del rectángulo: largo, ancho, largo, ancho.",
      ),
      L(
        "Opposite sides are equal, so perimeter = 2 × (length + width).",
        "Los lados opuestos son iguales, así que perímetro = 2 × (largo + ancho).",
      ),
      L(
        "Perimeter is measured in units of length, not square units.",
        "El perímetro se mide en unidades de longitud, no en unidades cuadradas.",
      ),
    ],
    misconception: L(
      "Perimeter is not area. Do not multiply length × width. Add all four sides.",
      "El perímetro no es el área. No multipliques largo × ancho. Suma los cuatro lados.",
    ),
    misconceptions: [
      mis(
        "area",
        (item, raw) => {
          const r = rect(item);
          return /^Perimeter/.test(q(item)) && r && isNum(raw, r[0] * r[1]);
        },
        "That is the AREA, the squares inside. Perimeter is the distance around the outside: add all four sides.",
        "Esa es el ÁREA, los cuadrados de adentro. El perímetro es la distancia por fuera: suma los cuatro lados.",
      ),
      mis(
        "two-sides",
        (item, raw) => {
          const r = rect(item);
          return /^Perimeter/.test(q(item)) && r && isNum(raw, r[0] + r[1]);
        },
        "That is only half the way around: one length and one width. A rectangle has two of each.",
        "Esa es solo la mitad del camino: un largo y un ancho. Un rectángulo tiene dos de cada uno.",
      ),
    ],
    transfer: {
      prompt: L(
        "A garden is 9 meters long and 5 meters wide. How many meters of fence go all the way around it?",
        "Un huerto mide 9 metros de largo y 5 metros de ancho. ¿Cuántos metros de cerca le dan toda la vuelta?",
      ),
      answers: ["28"],
      kind: "number",
      unit: L("meters", "metros"),
      hint: L("Walk around: 9, 5, 9, 5.", "Da la vuelta: 9, 5, 9, 5."),
      explanation: L(
        "9 + 5 + 9 + 5 = 28 meters. Or 2 × (9 + 5) = 2 × 14 = 28.",
        "9 + 5 + 9 + 5 = 28 metros. O 2 × (9 + 5) = 2 × 14 = 28.",
      ),
    },
  },
  "3:elapsed-time": {
    title: L("How much time passes?", "¿Cuánto tiempo pasa?"),
    concept: L(
      "To find a later time, add the minutes. When the minutes reach 60, that is one more hour, and the minutes start again from :00.",
      "Para encontrar una hora más tarde, suma los minutos. Cuando los minutos llegan a 60, es una hora más y los minutos empiezan otra vez desde :00.",
    ),
    reasons: [
      L(
        "Jump to the next hour first: from :45, 15 minutes reaches the hour.",
        "Primero salta a la hora siguiente: desde :45, con 15 minutos llegas a la hora.",
      ),
      L(
        "Then add the minutes that are left.",
        "Luego suma los minutos que faltan.",
      ),
      L(
        "A number line of minutes shows each jump.",
        "Una recta numérica de minutos muestra cada salto.",
      ),
    ],
    misconception: L(
      "Time is not like other numbers: an hour has 60 minutes, not 100. 10 to 3 plus 20 minutes is 10 past 3, not 2:70.",
      "La hora no es como otros números: una hora tiene 60 minutos, no 100. Las 3 menos 10 más 20 minutos son las 3 y 10, no las 2:70.",
    ),
    misconceptions: timeDetectors,
    transfer: {
      prompt: L(
        "A movie starts at 4:45. It lasts 50 minutes. What time does it end?",
        "Una película empieza a las 4:45. Dura 50 minutos. ¿A qué hora termina?",
      ),
      answers: ["5:35"],
      kind: "text",
      hint: L(
        "15 minutes gets you from 4:45 to 5:00.",
        "Con 15 minutos llegas de las 4:45 a las 5:00.",
      ),
      explanation: L(
        "4:45 + 15 minutes = 5:00. 50 − 15 = 35 minutes more: 5:35.",
        "4:45 + 15 minutos = 5:00. Faltan 50 − 15 = 35 minutos: las 5:35.",
      ),
    },
  },
  "3:fraction-line": {
    title: L("Fractions on a number line", "Fracciones en la recta numérica"),
    concept: L(
      "On a number line from 0 to 1, a fraction is a distance from 0. The denominator tells how many equal spaces 0 to 1 is cut into; the numerator tells how many spaces from 0.",
      "En una recta numérica de 0 a 1, una fracción es una distancia desde 0. El denominador dice en cuántos espacios iguales se corta de 0 a 1; el numerador dice cuántos espacios desde 0.",
    ),
    reasons: [
      L(
        "Cut 0 to 1 into 4 equal spaces: each space is 1/4.",
        "Corta de 0 a 1 en 4 espacios iguales: cada espacio es 1/4.",
      ),
      L("3 spaces from 0 is 3/4.", "3 espacios desde 0 es 3/4."),
      L(
        "Count spaces, not marks: 4 spaces have 5 marks.",
        "Cuenta espacios, no marcas: 4 espacios tienen 5 marcas.",
      ),
    ],
    misconception: L(
      "Count the SPACES, not the tick marks. 0 to 1 cut into 4 parts has 5 marks but only 4 spaces, so each space is 1/4.",
      "Cuenta los ESPACIOS, no las marcas. De 0 a 1 cortado en 4 partes hay 5 marcas pero solo 4 espacios, así que cada espacio es 1/4.",
    ),
    misconceptions: [
      mis(
        "counted-marks",
        (item, raw) => {
          const m = q(item).match(
            /cut into (\d+) equal parts\. Point P is at mark (\d+)/,
          );
          return Boolean(m) && isFrac(raw, Number(m[2]) / (Number(m[1]) + 1));
        },
        "You used the number of marks as the denominator. The denominator is the number of equal SPACES from 0 to 1.",
        "Usaste el número de marcas como denominador. El denominador es el número de ESPACIOS iguales de 0 a 1.",
      ),
      mis(
        "zero-as-one",
        (item, raw) => {
          const m = q(item).match(
            /At which mark is the point (\d+)\/(\d+)\? Count from 0/,
          );
          return Boolean(m) && isNum(raw, Number(m[1]) + 1);
        },
        "One too many: you counted the 0 mark as mark 1. The 0 mark is the start; count the jumps after it.",
        "Una de más: contaste la marca del 0 como la marca 1. La marca del 0 es el inicio; cuenta los saltos después de ella.",
      ),
    ],
    transfer: {
      prompt: L(
        "A trail is 1 mile long. Signs split it into 4 equal parts. Sam walks from the start to the 3rd sign. What fraction of a mile has Sam walked?",
        "Un sendero mide 1 milla. Unos letreros lo dividen en 4 partes iguales. Sam camina desde el inicio hasta el 3.er letrero. ¿Qué fracción de milla ha caminado Sam?",
      ),
      answers: ["3/4"],
      kind: "fraction",
      hint: L(
        "Each part is 1/4 of a mile. How many parts did Sam walk?",
        "Cada parte es 1/4 de milla. ¿Cuántas partes caminó Sam?",
      ),
      explanation: L(
        "Each sign marks one more fourth. 3 parts of 1/4 is 3/4 of a mile.",
        "Cada letrero marca un cuarto más. 3 partes de 1/4 son 3/4 de milla.",
      ),
    },
  },
  "3:scaled-graphs": {
    concept: L(
      "In a scaled bar graph, each square stands for more than 1. Multiply the number of squares by what each square stands for.",
      "En una gráfica de barras con escala, cada cuadro vale más de 1. Multiplica el número de cuadros por lo que vale cada cuadro.",
    ),
    reasons: [
      L(
        "The key tells the scale: each square = 3.",
        "La clave dice la escala: cada cuadro = 3.",
      ),
      L("4 squares of 3 is 4 × 3 = 12.", "4 cuadros de 3 son 4 × 3 = 12."),
      L(
        "To compare bars, find the difference in squares, then multiply by the scale.",
        "Para comparar barras, busca la diferencia de cuadros y luego multiplica por la escala.",
      ),
    ],
    misconception: L(
      "Do not just count squares. Each square stands for the number in the key, so multiply.",
      "No cuentes solo los cuadros. Cada cuadro vale el número de la clave, así que multiplica.",
    ),
    misconceptions: [
      mis(
        "unscaled",
        (item, raw) => {
          const s = scaled(item);
          if (!s || s.k === 1) return false;
          return s.b === null ? isNum(raw, s.a) : isNum(raw, s.a - s.b);
        },
        "That is a number of SQUARES. Each square stands for more than 1, so multiply by the scale in the key.",
        "Esa es una cantidad de CUADROS. Cada cuadro vale más de 1, así que multiplica por la escala de la clave.",
      ),
      mis(
        "whole-bar",
        (item, raw) => {
          const s = scaled(item);
          return Boolean(s) && s.b !== null && isNum(raw, s.a * s.k);
        },
        "That is all of Class A. The question asks how many MORE, so compare the two bars: find the difference.",
        "Ese es el total de la clase A. La pregunta pide cuántos MÁS, así que compara las dos barras: busca la diferencia.",
      ),
    ],
    living: scaledGraphModel,
    transfer: {
      prompt: L(
        "In a picture graph, each book picture stands for 4 books. Maya's row has 6 pictures. How many books did Maya read?",
        "En una pictografía, cada dibujo de libro vale 4 libros. La fila de Maya tiene 6 dibujos. ¿Cuántos libros leyó Maya?",
      ),
      answers: ["24"],
      kind: "number",
      hint: L("Each picture is 4 books.", "Cada dibujo son 4 libros."),
      explanation: L(
        "6 pictures of 4 books: 6 × 4 = 24 books.",
        "6 dibujos de 4 libros: 6 × 4 = 24 libros.",
      ),
    },
  },
};
