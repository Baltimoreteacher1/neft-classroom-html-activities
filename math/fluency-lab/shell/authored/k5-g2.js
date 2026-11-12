// Grade 2 — authored explanations. Short sentences; base-ten blocks, number lines, arrays and clocks.
import {
  L,
  addNoCarry,
  binop,
  compareEqual,
  compareReversed,
  compareWholes,
  isNum,
  mis,
  nums,
  q,
  right,
  subFlip,
} from "./k5-kit.js";
import { G1, addDetectors, placeDetectors, subDetectors } from "./k5-g1.js";
import { clockModel, doublesModel, tensModel } from "./lm-k2.js";

export const noRegroupAdd = mis(
  "no-regroup",
  (item, raw) => {
    const p = binop(item);
    return (
      p &&
      p[1] === "+" &&
      addNoCarry(p[0], p[2]) !== p[0] + p[2] &&
      isNum(raw, addNoCarry(p[0], p[2]))
    );
  },
  "A column added up to 10 or more, and the extra ten was lost. When a column makes 10 or more, trade 10 of them for 1 of the next place and write it above that place.",
  "Una columna sumó 10 o más y se perdió la decena extra. Cuando una columna llega a 10 o más, cambia 10 de ellas por 1 del lugar siguiente y escríbelo sobre ese lugar.",
);
export const flipSub = mis(
  "smaller-from-larger",
  (item, raw) => {
    const p = binop(item);
    return (
      p &&
      p[1] === "-" &&
      subFlip(p[0], p[2]) !== p[0] - p[2] &&
      isNum(raw, subFlip(p[0], p[2]))
    );
  },
  "In one column you took the top digit from the bottom digit. You cannot flip a subtraction. If the top digit is smaller, trade: take 1 from the next place for 10 more here.",
  "En una columna restaste el dígito de arriba del de abajo. No puedes voltear una resta. Si el dígito de arriba es menor, cambia: toma 1 del lugar siguiente por 10 más aquí.",
);

const coinValue = (q, d, n, p) => 25 * q + 10 * d + 5 * n + p;

export const G2 = {
  "2:facts-20": {
    title: L("Addition facts to 20", "Sumas hasta 20"),
    concept: G1["1:add-20"].concept,
    reasons: [
      L(
        "Make a ten: 9 + 6 is 9 + 1 + 5, which is 10 + 5.",
        "Forma una decena: 9 + 6 es 9 + 1 + 5, que es 10 + 5.",
      ),
      L(
        "Use a double you know: 6 + 7 is 6 + 6 and 1 more.",
        "Usa un doble que sepas: 6 + 7 es 6 + 6 y 1 más.",
      ),
      L(
        "Switch the order if it helps: 3 + 9 = 9 + 3.",
        "Cambia el orden si te ayuda: 3 + 9 = 9 + 3.",
      ),
    ],
    misconception: G1["1:add-20"].misconception,
    misconceptions: addDetectors,
    transfer: {
      prompt: L(
        "A frog jumps 9 times, rests, then jumps 6 more times. How many jumps in all?",
        "Una rana salta 9 veces, descansa y luego salta 6 veces más. ¿Cuántos saltos da en total?",
      ),
      answers: ["15"],
      kind: "number",
      hint: L("9 needs 1 more to make 10.", "Al 9 le falta 1 para hacer 10."),
      explanation: L(
        "9 + 1 = 10, and 5 are left: 10 + 5 = 15. So 9 + 6 = 15.",
        "9 + 1 = 10 y quedan 5: 10 + 5 = 15. Así que 9 + 6 = 15.",
      ),
    },
  },
  "2:sub-facts-20": {
    title: L("Subtraction facts to 20", "Restas hasta 20"),
    concept: G1["1:subtract-20"].concept,
    reasons: [
      L(
        "Back to ten: take away ones until you reach 10, then take away the rest.",
        "Regresa a diez: quita unidades hasta llegar a 10 y luego quita el resto.",
      ),
      L(
        "Think addition: 35 − 7 asks “7 and what make 35?”",
        "Piensa en una suma: 35 − 7 pregunta «¿7 y cuánto hacen 35?»",
      ),
      L(
        "Both ways give the same answer, so one can check the other.",
        "Los dos caminos dan la misma respuesta, así que uno comprueba al otro.",
      ),
    ],
    misconception: G1["1:subtract-20"].misconception,
    misconceptions: subDetectors,
    transfer: {
      prompt: L(
        "There are 16 balloons at a party. 9 balloons pop. How many balloons are left?",
        "Hay 16 globos en una fiesta. Se revientan 9 globos. ¿Cuántos globos quedan?",
      ),
      answers: ["7"],
      kind: "number",
      hint: L(
        "9 and what make 16? Go from 9 to 10 first.",
        "¿9 y cuánto hacen 16? Primero ve del 9 al 10.",
      ),
      explanation: L(
        "9 + 1 = 10 and 10 + 6 = 16, so 1 + 6 = 7 balloons are left. 16 − 9 = 7.",
        "9 + 1 = 10 y 10 + 6 = 16, así que quedan 1 + 6 = 7 globos. 16 − 9 = 7.",
      ),
    },
  },
  "2:place-1000": {
    title: L("Hundreds, tens and ones", "Centenas, decenas y unidades"),
    concept: L(
      "A three-digit number is hundreds, tens and ones. Each place is worth 10 times the place to its right.",
      "Un número de tres dígitos son centenas, decenas y unidades. Cada lugar vale 10 veces el lugar de su derecha.",
    ),
    reasons: [
      L(
        "10 ones make 1 ten, and 10 tens make 1 hundred.",
        "10 unidades forman 1 decena y 10 decenas forman 1 centena.",
      ),
      L(
        "In 362, the 3 is 3 hundreds: 300. The 6 is 6 tens: 60. The 2 is 2 ones.",
        "En 362, el 3 son 3 centenas: 300. El 6 son 6 decenas: 60. El 2 son 2 unidades.",
      ),
      L("So 362 = 300 + 60 + 2.", "Así que 362 = 300 + 60 + 2."),
    ],
    misconception: L(
      "The digit is not its value. In 362 the hundreds digit is 3, but it is worth 300.",
      "El dígito no es su valor. En 362 el dígito de las centenas es 3, pero vale 300.",
    ),
    misconceptions: placeDetectors,
    transfer: {
      prompt: L(
        "Markers come in boxes of 100, packs of 10, and single markers. A school gets 3 boxes, 4 packs and 6 single markers. How many markers is that?",
        "Los marcadores vienen en cajas de 100, paquetes de 10 y sueltos. Una escuela recibe 3 cajas, 4 paquetes y 6 marcadores sueltos. ¿Cuántos marcadores son?",
      ),
      answers: ["346"],
      kind: "number",
      hint: L(
        "3 boxes is 3 hundreds. 4 packs is 4 tens.",
        "3 cajas son 3 centenas. 4 paquetes son 4 decenas.",
      ),
      explanation: L(
        "3 hundreds, 4 tens and 6 ones: 300 + 40 + 6 = 346.",
        "3 centenas, 4 decenas y 6 unidades: 300 + 40 + 6 = 346.",
      ),
    },
  },
  "2:compare-1000": {
    concept: L(
      "Compare three-digit numbers place by place, starting with the hundreds. The first place that is different decides.",
      "Compara números de tres dígitos lugar por lugar, empezando por las centenas. El primer lugar que es diferente decide.",
    ),
    reasons: [
      L(
        "1 hundred is more than any number of tens and ones up to 99.",
        "1 centena es más que cualquier cantidad de decenas y unidades hasta 99.",
      ),
      L(
        "If the hundreds match, the tens decide. If those match too, the ones decide.",
        "Si las centenas son iguales, deciden las decenas. Si también son iguales, deciden las unidades.",
      ),
      L(
        "The open side of < or > faces the bigger number.",
        "El lado abierto de < o > mira al número mayor.",
      ),
    ],
    misconception: L(
      "Do not decide by the last digits. 409 has a bigger ones digit than 391, and it is still bigger because 4 hundreds > 3 hundreds.",
      "No decidas por los últimos dígitos. 409 tiene más unidades que 391 y es mayor porque 4 centenas > 3 centenas.",
    ),
    misconceptions: [
      compareReversed(compareWholes),
      compareEqual(compareWholes),
    ],
    transfer: {
      prompt: L(
        "Hill A is 426 meters tall. Hill B is 462 meters tall. Which hill is taller, A or B?",
        "La colina A mide 426 metros de alto. La colina B mide 462 metros de alto. ¿Qué colina es más alta, la A o la B?",
      ),
      answers: ["B", "b", "hill B", "la B"],
      kind: "text",
      hint: L(
        "The hundreds are the same. Compare the tens.",
        "Las centenas son iguales. Compara las decenas.",
      ),
      explanation: L(
        "Both have 4 hundreds. 6 tens > 2 tens, so 462 > 426. Hill B is taller.",
        "Las dos tienen 4 centenas. 6 decenas > 2 decenas, así que 462 > 426. La colina B es más alta.",
      ),
    },
  },
  "2:skip-count": {
    title: L(
      "Skip-count by 5s, 10s and 100s",
      "Cuenta saltando de 5, de 10 y de 100",
    ),
    concept: L(
      "A skip-counting pattern adds the same amount every time. Find that amount, then add it once more.",
      "Un patrón de conteo salteado suma la misma cantidad cada vez. Busca esa cantidad y súmala una vez más.",
    ),
    reasons: [
      L(
        "Subtract two neighbors to find the jump.",
        "Resta dos vecinos para encontrar el salto.",
      ),
      L(
        "Jumps of 10 change the tens digit; jumps of 100 change the hundreds digit.",
        "Los saltos de 10 cambian el dígito de las decenas; los saltos de 100 cambian el de las centenas.",
      ),
      L(
        "When the tens pass 9, they make a new hundred.",
        "Cuando las decenas pasan de 9, forman una centena nueva.",
      ),
    ],
    misconception: L(
      "Use the pattern's jump, not 1. And change the right digit: a jump of 10 changes the tens.",
      "Usa el salto del patrón, no 1. Y cambia el dígito correcto: un salto de 10 cambia las decenas.",
    ),
    misconceptions: [
      mis(
        "by-ones",
        (item, raw) => {
          const n = nums(q(item));
          return (
            n.length >= 2 &&
            n.at(-1) - n.at(-2) !== 1 &&
            isNum(raw, n.at(-1) + 1)
          );
        },
        "You added 1. Subtract two numbers next to each other to find the real jump, then add that.",
        "Sumaste 1. Resta dos números que están juntos para encontrar el salto de verdad y súmalo.",
      ),
      mis(
        "wrong-place",
        (item, raw) => {
          const n = nums(q(item));
          const step = n.at(-1) - n.at(-2);
          const other = { 10: 100, 100: 10 }[step];
          return Boolean(other) && isNum(raw, n.at(-1) + other);
        },
        "You changed the wrong digit. Check the jump: from one number to the next, did the tens change or the hundreds?",
        "Cambiaste el dígito equivocado. Revisa el salto: de un número al siguiente, ¿cambiaron las decenas o las centenas?",
      ),
    ],
    transfer: {
      prompt: L(
        "A counter clicks up by 10s: 130, 140, 150, 160. What does it show after the next click?",
        "Un contador sube de 10 en 10: 130, 140, 150, 160. ¿Qué muestra después del siguiente clic?",
      ),
      answers: ["170"],
      kind: "number",
      hint: L("One more jump of 10.", "Un salto más de 10."),
      explanation: L(
        "160 + 10 = 170: the tens digit goes from 6 to 7.",
        "160 + 10 = 170: el dígito de las decenas pasa de 6 a 7.",
      ),
    },
  },
  "2:add-100": {
    title: L("Add two-digit numbers", "Suma números de dos dígitos"),
    concept: L(
      "Add tens with tens and ones with ones. If the ones make 10 or more, bundle 10 ones into 1 more ten.",
      "Suma decenas con decenas y unidades con unidades. Si las unidades hacen 10 o más, junta 10 unidades en 1 decena más.",
    ),
    reasons: [
      L(
        "Tens and ones are different sizes, so add each kind on its own.",
        "Las decenas y las unidades son de tamaños distintos, así que suma cada tipo por separado.",
      ),
      L(
        "37 + 48: 30 + 40 = 70 and 7 + 8 = 15.",
        "37 + 48: 30 + 40 = 70 y 7 + 8 = 15.",
      ),
      L(
        "15 is 1 ten and 5 ones, so 70 + 15 = 85.",
        "15 es 1 decena y 5 unidades, así que 70 + 15 = 85.",
      ),
    ],
    misconception: L(
      "When the ones make 10 or more, the extra ten must go into the tens. Do not drop it, and do not write both digits in one column.",
      "Cuando las unidades hacen 10 o más, la decena extra va con las decenas. No la pierdas ni escribas los dos dígitos en una columna.",
    ),
    misconceptions: [
      noRegroupAdd,
      mis(
        "wrote-both",
        (item, raw) => {
          const p = binop(item);
          if (!p || p[1] !== "+") return false;
          const ones = (p[0] % 10) + (p[2] % 10);
          const tens = Math.floor(p[0] / 10) + Math.floor(p[2] / 10);
          return ones >= 10 && isNum(raw, Number(`${tens}${ones}`));
        },
        "You wrote the ones total as two digits in the answer. That total is 1 ten and some ones: add the 1 ten to the tens.",
        "Escribiste el total de las unidades con dos dígitos en la respuesta. Ese total es 1 decena y algunas unidades: suma la decena a las decenas.",
      ),
    ],
    transfer: {
      prompt: L(
        "A class collects 38 cans on Monday and 45 cans on Tuesday. How many cans in all?",
        "Una clase junta 38 latas el lunes y 45 latas el martes. ¿Cuántas latas hay en total?",
      ),
      answers: ["83"],
      kind: "number",
      hint: L(
        "Add the tens, then the ones. Do the ones make a new ten?",
        "Suma las decenas y luego las unidades. ¿Las unidades forman una decena nueva?",
      ),
      explanation: L(
        "30 + 40 = 70 and 8 + 5 = 13. 70 + 13 = 83.",
        "30 + 40 = 70 y 8 + 5 = 13. 70 + 13 = 83.",
      ),
    },
  },
  "2:subtract-100": {
    title: L("Subtract two-digit numbers", "Resta números de dos dígitos"),
    concept: L(
      "Subtract ones from ones and tens from tens. If there are not enough ones, open a ten to make 10 more ones.",
      "Resta unidades de unidades y decenas de decenas. Si no hay suficientes unidades, abre una decena para tener 10 unidades más.",
    ),
    reasons: [
      L(
        "Opening a ten does not change the number: 5 tens 2 ones = 4 tens 12 ones.",
        "Abrir una decena no cambia el número: 5 decenas 2 unidades = 4 decenas 12 unidades.",
      ),
      L(
        "Now there are enough ones to take away.",
        "Ahora hay suficientes unidades para quitar.",
      ),
      L(
        "Or count up: from the smaller number to the bigger number is the difference.",
        "O cuenta hacia arriba: del número menor al mayor es la diferencia.",
      ),
    ],
    misconception: L(
      "Do not take the top digit from the bottom digit. If the top ones are too small, open a ten.",
      "No restes el dígito de arriba del de abajo. Si las unidades de arriba son muy pocas, abre una decena.",
    ),
    misconceptions: [
      flipSub,
      mis(
        "added",
        (item, raw) => {
          const p = binop(item);
          return p && p[1] === "-" && isNum(raw, p[0] + p[2]);
        },
        "You added. The sign is −, so the answer must be smaller than the first number.",
        "Sumaste. El signo es −, así que la respuesta debe ser menor que el primer número.",
      ),
    ],
    transfer: {
      prompt: L(
        "A book has 72 pages. Ana has read 35 pages. How many pages are left to read?",
        "Un libro tiene 72 páginas. Ana ha leído 35 páginas. ¿Cuántas páginas le faltan por leer?",
      ),
      answers: ["37"],
      kind: "number",
      hint: L(
        "Count up from 35 to 72: first to 40.",
        "Cuenta desde 35 hasta 72: primero hasta 40.",
      ),
      explanation: L(
        "35 + 5 = 40, 40 + 32 = 72. 5 + 32 = 37 pages. 72 − 35 = 37.",
        "35 + 5 = 40, 40 + 32 = 72. 5 + 32 = 37 páginas. 72 − 35 = 37.",
      ),
    },
  },
  "2:add-1000": {
    title: L("Add three-digit numbers", "Suma números de tres dígitos"),
    concept: L(
      "Add hundreds, tens and ones, each with its own kind. Any place that reaches 10 makes 1 of the next place.",
      "Suma centenas, decenas y unidades, cada una con su tipo. Cualquier lugar que llegue a 10 forma 1 del lugar siguiente.",
    ),
    reasons: [
      L(
        "10 ones make a ten; 10 tens make a hundred.",
        "10 unidades forman una decena; 10 decenas forman una centena.",
      ),
      L(
        "Adding place by place keeps each kind together.",
        "Sumar lugar por lugar mantiene juntos a los de cada tipo.",
      ),
      L(
        "Estimate first: the answer should be near the sum of the hundreds.",
        "Primero estima: la respuesta debe estar cerca de la suma de las centenas.",
      ),
    ],
    misconception: L(
      "Trade 10 for 1 of the next place and write the new ten or hundred there. A column of 10 or more is never written as one digit with nothing traded.",
      "Cambia 10 por 1 del lugar siguiente y escribe allí la decena o centena nueva. Una columna de 10 o más nunca se escribe como un dígito sin cambiar nada.",
    ),
    misconceptions: [
      noRegroupAdd,
      mis(
        "lost-one-carry",
        (item, raw) => {
          const p = binop(item);
          if (!p || p[1] !== "+") return false;
          const s = p[0] + p[2];
          const nc = addNoCarry(p[0], p[2]);
          return [s - 10, s - 100].some(
            (w) => w !== nc && w > 0 && isNum(raw, w),
          );
        },
        "Off by exactly 10 or 100: one traded ten or hundred was not added. Check each column for a trade.",
        "Te falta exactamente 10 o 100: no sumaste una decena o centena que cambiaste. Revisa cada columna.",
      ),
    ],
    transfer: {
      prompt: L(
        "A farm sells 256 apples on Saturday and 378 apples on Sunday. How many apples does it sell?",
        "Una granja vende 256 manzanas el sábado y 378 manzanas el domingo. ¿Cuántas manzanas vende?",
      ),
      answers: ["634"],
      kind: "number",
      hint: L(
        "Ones: 6 + 8. Does that make a new ten?",
        "Unidades: 6 + 8. ¿Forman una decena nueva?",
      ),
      explanation: L(
        "200 + 300 = 500, 50 + 70 = 120, 6 + 8 = 14. 500 + 120 + 14 = 634.",
        "200 + 300 = 500, 50 + 70 = 120, 6 + 8 = 14. 500 + 120 + 14 = 634.",
      ),
    },
  },
  "2:even-odd": {
    concept: L(
      "A number is even if that many things can be put in pairs with none left over. If one is left over, the number is odd.",
      "Un número es par si esa cantidad de cosas se puede poner en parejas sin que sobre ninguna. Si sobra una, el número es impar.",
    ),
    reasons: [
      L(
        "Tens always pair up: 10 is 5 pairs.",
        "Las decenas siempre forman parejas: 10 son 5 parejas.",
      ),
      L(
        "So only the ones digit decides.",
        "Por eso solo decide el dígito de las unidades.",
      ),
      L(
        "Ones digit 0, 2, 4, 6 or 8: even. 1, 3, 5, 7 or 9: odd.",
        "Dígito de las unidades 0, 2, 4, 6 u 8: par. 1, 3, 5, 7 o 9: impar.",
      ),
    ],
    misconception: L(
      "The first digit does not decide. Look only at the ones digit, because all the tens and hundreds already pair up.",
      "El primer dígito no decide. Mira solo el dígito de las unidades, porque todas las decenas y centenas ya forman parejas.",
    ),
    misconceptions: [
      mis(
        "first-digit",
        (item, raw) => {
          const m = q(item).match(/Is (\d+) even or odd/);
          if (!m || m[1].length < 2) return false;
          return raw.toLowerCase() === (Number(m[1][0]) % 2 ? "odd" : "even");
        },
        "You looked at the first digit. Tens and hundreds always make pairs, so only the ONES digit tells even or odd.",
        "Miraste el primer dígito. Las decenas y centenas siempre forman parejas, así que solo el dígito de las UNIDADES dice si es par o impar.",
      ),
      mis(
        "any-odd-digit",
        (item, raw) => {
          const m = q(item).match(/Is (\d+) even or odd/);
          return (
            Boolean(m) &&
            raw.toLowerCase() === "odd" &&
            /[13579]/.test(m[1].slice(0, -1))
          );
        },
        "An odd digit in the tens or hundreds does not make the number odd. Only the ones digit can leave one without a partner.",
        "Un dígito impar en las decenas o centenas no hace impar al número. Solo el dígito de las unidades puede dejar uno sin pareja.",
      ),
    ],
    transfer: {
      prompt: L(
        "13 students need partners for a game. Can every student have a partner? Answer yes or no.",
        "13 estudiantes necesitan pareja para un juego. ¿Puede cada estudiante tener pareja? Contesta sí o no.",
      ),
      answers: ["no"],
      kind: "text",
      hint: L("Is 13 even or odd?", "¿13 es par o impar?"),
      explanation: L(
        "No. 13 is odd: 6 pairs make 12, and 1 student is left over. 6 + 6 + 1 = 13.",
        "No. 13 es impar: 6 parejas son 12 y sobra 1 estudiante. 6 + 6 + 1 = 13.",
      ),
    },
  },
  "2:coins": {
    title: L("Count coins", "Cuenta monedas"),
    concept: L(
      "Each coin has a value in cents: a quarter is 25, a dime is 10, a nickel is 5 and a penny is 1. Count the biggest coins first, then count on.",
      "Cada moneda tiene un valor en centavos: un cuarto de dólar vale 25, una de diez vale 10, una de cinco vale 5 y un centavo vale 1. Cuenta primero las monedas más grandes y luego sigue contando.",
    ),
    reasons: [
      L(
        "Count by 25s for quarters, by 10s for dimes, by 5s for nickels, by 1s for pennies.",
        "Cuenta de 25 en 25 los cuartos, de 10 en 10 las de diez, de 5 en 5 las de cinco y de 1 en 1 los centavos.",
      ),
      L(
        "Counting on from the bigger total means fewer steps.",
        "Seguir contando desde el total mayor significa menos pasos.",
      ),
      L(
        "The number of coins is not the amount of money.",
        "El número de monedas no es la cantidad de dinero.",
      ),
    ],
    misconception: L(
      "A dime is smaller than a nickel but worth MORE: 10 cents, not 5. Count the value, not the coins.",
      "Una moneda de diez es más pequeña que una de cinco, pero vale MÁS: 10 centavos, no 5. Cuenta el valor, no las monedas.",
    ),
    misconceptions: [
      mis(
        "counted-coins",
        (item, raw) => {
          const n = nums(q(item));
          return (
            /quarters/.test(q(item)) &&
            n.length === 4 &&
            isNum(raw, n[0] + n[1] + n[2] + n[3])
          );
        },
        "That is how many COINS there are. Each coin is worth some cents: count by 25 for each quarter, 10 for each dime, 5 for each nickel and 1 for each penny.",
        "Esas son cuántas MONEDAS hay. Cada moneda vale algunos centavos: cuenta 25 por cada cuarto, 10 por cada moneda de diez, 5 por cada moneda de cinco y 1 por cada centavo.",
      ),
      mis(
        "dime-nickel",
        (item, raw) => {
          const n = nums(q(item));
          return (
            /quarters/.test(q(item)) &&
            n.length === 4 &&
            n[1] !== n[2] &&
            isNum(raw, coinValue(n[0], n[2], n[1], n[3]))
          );
        },
        "You swapped dimes and nickels. A dime is the small coin and is worth 10 cents; a nickel is worth 5 cents.",
        "Cambiaste las monedas de diez y de cinco. La de diez es la moneda pequeña y vale 10 centavos; la de cinco vale 5 centavos.",
      ),
    ],
    transfer: {
      prompt: L(
        "Ben has 2 quarters, 1 dime and 3 pennies. How many cents does Ben have?",
        "Ben tiene 2 cuartos de dólar, 1 moneda de diez y 3 centavos. ¿Cuántos centavos tiene Ben?",
      ),
      answers: ["63"],
      kind: "number",
      unit: L("cents", "centavos"),
      hint: L(
        "Start with the quarters: 25, 50.",
        "Empieza con los cuartos: 25, 50.",
      ),
      explanation: L(
        "25, 50, then the dime: 60, then 61, 62, 63. 50 + 10 + 3 = 63 cents.",
        "25, 50, luego la de diez: 60, luego 61, 62, 63. 50 + 10 + 3 = 63 centavos.",
      ),
    },
  },
  "2:interpret-data": {
    title: L("Read a graph or chart", "Lee una gráfica o tabla"),
    concept: L(
      "A data display shows how many are in each group. To find the most, compare all the numbers and pick the biggest.",
      "Una gráfica muestra cuántos hay en cada grupo. Para saber cuál tiene más, compara todos los números y elige el mayor.",
    ),
    reasons: [
      L(
        "Each label goes with its own number.",
        "Cada nombre va con su propio número.",
      ),
      L(
        "The longest bar (or the biggest number) is the most.",
        "La barra más larga (o el número más grande) es el que tiene más.",
      ),
      L(
        "“How many more” means subtract the two numbers.",
        "«Cuántos más» significa restar los dos números.",
      ),
    ],
    misconception: L(
      "Check every group before you choose. The most votes is the BIGGEST number, not the first one or the smallest one.",
      "Revisa todos los grupos antes de elegir. Más votos es el número MAYOR, no el primero ni el menor.",
    ),
    misconceptions: [
      mis(
        "fewest",
        (item, raw) => {
          const pairs = [...q(item).matchAll(/([a-z]+): (\d+)/g)].map((m) => [
            m[1],
            Number(m[2]),
          ]);
          if (!/most/.test(q(item)) || pairs.length < 2) return false;
          const low = pairs.reduce((a, b) => (b[1] < a[1] ? b : a));
          return raw.toLowerCase() === low[0];
        },
        "That fruit got the FEWEST votes. The question asks for the most: find the biggest number.",
        "Esa fruta tuvo MENOS votos. La pregunta pide la que tuvo más: busca el número mayor.",
      ),
      mis(
        "second-most",
        (item, raw) => {
          const pairs = [...q(item).matchAll(/([a-z]+): (\d+)/g)].map((m) => [
            m[1],
            Number(m[2]),
          ]);
          if (!/most/.test(q(item)) || pairs.length < 3) return false;
          const sorted = pairs.slice().sort((a, b) => b[1] - a[1]);
          return (
            sorted[1][1] < sorted[0][1] && raw.toLowerCase() === sorted[1][0]
          );
        },
        "Close, but another fruit has even more votes. Compare all the numbers, one at a time.",
        "Cerca, pero otra fruta tiene todavía más votos. Compara todos los números, uno por uno.",
      ),
    ],
    transfer: {
      prompt: L(
        "A tally chart shows class pets: dogs 7, cats 9, fish 4. How many more votes did cats get than fish?",
        "Una tabla de conteo muestra las mascotas de la clase: perros 7, gatos 9, peces 4. ¿Cuántos votos más tuvieron los gatos que los peces?",
      ),
      answers: ["5"],
      kind: "number",
      hint: L(
        "Find the two numbers. How far is it from 4 to 9?",
        "Busca los dos números. ¿Cuánto hay del 4 al 9?",
      ),
      explanation: L(
        "Cats 9, fish 4. 9 − 4 = 5 more votes.",
        "Gatos 9, peces 4. 9 − 4 = 5 votos más.",
      ),
    },
  },
  "2:doubles-near": {
    concept: L(
      "A double adds a number to itself. A near double is a double plus one more. If you know 6 + 6, you can find 6 + 7.",
      "Un doble suma un número consigo mismo. Un casi doble es un doble más uno. Si sabes 6 + 6, puedes encontrar 6 + 7.",
    ),
    reasons: [
      L("6 + 7 is 6 + 6 + 1.", "6 + 7 es 6 + 6 + 1."),
      L(
        "So it is one more than the double.",
        "Así que es uno más que el doble.",
      ),
      L(
        "The picture shows it: two equal rows and one extra.",
        "El dibujo lo muestra: dos filas iguales y uno extra.",
      ),
    ],
    misconception: L(
      "After you use the double, do not forget the extra one. A near double is the double plus 1.",
      "Después de usar el doble, no olvides el uno extra. Un casi doble es el doble más 1.",
    ),
    misconceptions: [
      mis(
        "forgot-one",
        (item, raw) => {
          const m = q(item).match(/What is (\d+) \+ (\d+)\?/);
          if (!m) return false;
          const [a, b] = [Number(m[1]), Number(m[2])];
          return Math.abs(a - b) === 1 && isNum(raw, 2 * Math.min(a, b));
        },
        "That is just the double. The second number is 1 more, so the sum is 1 more than the double.",
        "Ese es solo el doble. El segundo número es 1 más, así que la suma es 1 más que el doble.",
      ),
      mis(
        "doubled-bigger",
        (item, raw) => {
          const m = q(item).match(/What is (\d+) \+ (\d+)\?/);
          if (!m) return false;
          const [a, b] = [Number(m[1]), Number(m[2])];
          return Math.abs(a - b) === 1 && isNum(raw, 2 * Math.max(a, b));
        },
        "You doubled the bigger number, which adds 1 too many. Double the smaller number, then add 1.",
        "Duplicaste el número mayor, y eso suma 1 de más. Duplica el número menor y luego suma 1.",
      ),
    ],
    living: doublesModel,
    transfer: {
      prompt: L(
        "Mia reads 8 pages on Monday and 9 pages on Tuesday. How many pages does she read?",
        "Mia lee 8 páginas el lunes y 9 páginas el martes. ¿Cuántas páginas lee?",
      ),
      answers: ["17"],
      kind: "number",
      hint: L("Use the double 8 + 8.", "Usa el doble 8 + 8."),
      explanation: L(
        "8 + 8 = 16, and 9 is 1 more than 8, so 16 + 1 = 17.",
        "8 + 8 = 16 y 9 es 1 más que 8, así que 16 + 1 = 17.",
      ),
    },
  },
  "2:arrays": {
    concept: L(
      "An array puts things in equal rows. Every row has the same number, so you can add the same number again and again.",
      "Un arreglo pone las cosas en filas iguales. Cada fila tiene la misma cantidad, así que puedes sumar el mismo número una y otra vez.",
    ),
    reasons: [
      L("3 rows of 4 is 4 + 4 + 4.", "3 filas de 4 es 4 + 4 + 4."),
      L(
        "Count by the row size: 4, 8, 12.",
        "Cuenta de lo que hay en cada fila: 4, 8, 12.",
      ),
      L(
        "Sharing works backward: put the total into equal rows to find one row.",
        "Repartir funciona al revés: pon el total en filas iguales para saber cuánto hay en una fila.",
      ),
    ],
    misconception: L(
      "Rows and the number in each row are not added once. Add the row size once for EVERY row.",
      "Las filas y la cantidad en cada fila no se suman una vez. Suma lo que hay en una fila una vez por CADA fila.",
    ),
    misconceptions: [
      mis(
        "added",
        (item, raw) => {
          const m = q(item).match(/(\d+) rows with (\d+) dots/);
          return Boolean(m) && isNum(raw, Number(m[1]) + Number(m[2]));
        },
        "You added the rows and the dots in one row. Each row has those dots, so add the row again for every row.",
        "Sumaste las filas y los puntos de una fila. Cada fila tiene esos puntos, así que suma la fila otra vez por cada fila.",
      ),
      mis(
        "took-away",
        (item, raw) => {
          const m = q(item).match(/(\d+) dots are in (\d+) equal rows/);
          return Boolean(m) && isNum(raw, Number(m[1]) - Number(m[2]));
        },
        "You subtracted. Share the dots into the equal rows instead: how many go in each row so every row is the same?",
        "Restaste. Mejor reparte los puntos en las filas iguales: ¿cuántos van en cada fila para que todas sean iguales?",
      ),
    ],
    transfer: {
      prompt: L(
        "A garden has 3 rows of carrots. Each row has 5 carrots. How many carrots are in the garden?",
        "Un huerto tiene 3 filas de zanahorias. Cada fila tiene 5 zanahorias. ¿Cuántas zanahorias hay en el huerto?",
      ),
      answers: ["15"],
      kind: "number",
      hint: L(
        "Count by 5s, one count for each row.",
        "Cuenta de 5 en 5, un conteo por cada fila.",
      ),
      explanation: L(
        "5, 10, 15. 5 + 5 + 5 = 15 carrots.",
        "5, 10, 15. 5 + 5 + 5 = 15 zanahorias.",
      ),
    },
  },
  "2:time-five": {
    concept: L(
      "The long hand moves 5 minutes from one number on the clock to the next. Count by 5s to read the minutes.",
      "La aguja larga avanza 5 minutos de un número del reloj al siguiente. Cuenta de 5 en 5 para leer los minutos.",
    ),
    reasons: [
      L(
        "The long hand goes around once in an hour, past 12 numbers. Each jump from one number to the next is 5 minutes.",
        "La aguja larga da una vuelta en una hora y pasa por 12 números. Cada salto de un número al siguiente son 5 minutos.",
      ),
      L(
        "The long hand on the 4 means 4 jumps of 5 minutes.",
        "La aguja larga en el 4 significa 4 saltos de 5 minutos.",
      ),
      L(
        "To find time passed, count the jumps of 5 between the two times.",
        "Para saber cuánto tiempo pasó, cuenta los saltos de 5 entre las dos horas.",
      ),
    ],
    misconception: L(
      "The number the long hand points to is not the minutes. Count by 5s up to it.",
      "El número al que apunta la aguja larga no son los minutos. Cuenta de 5 en 5 hasta llegar a él.",
    ),
    misconceptions: [
      mis(
        "hand-number",
        (item, raw) => {
          const m = q(item).match(/minute hand points to the (\d+)/);
          return Boolean(m) && isNum(raw, Number(m[1]));
        },
        "That is the number on the clock, not the minutes. Each number is 5 minutes, so count by 5s up to it.",
        "Ese es el número del reloj, no los minutos. Cada número son 5 minutos, así que cuenta de 5 en 5 hasta él.",
      ),
      mis(
        "counted-jumps",
        (item, raw) => {
          const m = q(item).match(/from (\d+):(\d+) to (\d+):(\d+)/);
          if (!m) return false;
          const d =
            Number(m[3]) * 60 + Number(m[4]) - Number(m[1]) * 60 - Number(m[2]);
          return d % 5 === 0 && isNum(raw, d / 5);
        },
        "You counted how many numbers the long hand moved. Each of those jumps is 5 minutes, so count by 5s.",
        "Contaste cuántos números se movió la aguja larga. Cada salto son 5 minutos, así que cuenta de 5 en 5.",
      ),
    ],
    living: clockModel,
    transfer: {
      prompt: L(
        "The bus leaves at 3:15. It gets to school at 3:40. How many minutes long is the ride?",
        "El autobús sale a las 3:15. Llega a la escuela a las 3:40. ¿Cuántos minutos dura el viaje?",
      ),
      answers: ["25"],
      kind: "number",
      unit: L("minutes", "minutos"),
      hint: L(
        "Count by 5s from :15 to :40.",
        "Cuenta de 5 en 5 desde :15 hasta :40.",
      ),
      explanation: L(
        "20, 25, 30, 35, 40 is 5 jumps of 5. 40 − 15 = 25 minutes.",
        "20, 25, 30, 35, 40 son 5 saltos de 5. 40 − 15 = 25 minutos.",
      ),
    },
  },
  "2:mental-tens": {
    title: L(
      "10 more, 10 less, 100 more, 100 less",
      "10 más, 10 menos, 100 más, 100 menos",
    ),
    concept: L(
      "Adding or taking away 10 changes only the tens digit. Adding or taking away 100 changes only the hundreds digit.",
      "Sumar o quitar 10 cambia solo el dígito de las decenas. Sumar o quitar 100 cambia solo el dígito de las centenas.",
    ),
    reasons: [
      L(
        "10 more is one more ten; the ones stay the same.",
        "10 más es una decena más; las unidades no cambian.",
      ),
      L(
        "100 more is one more hundred; the tens and ones stay the same.",
        "100 más es una centena más; las decenas y unidades no cambian.",
      ),
      L(
        "If the tens are 9 and you add 10, 10 tens make a new hundred.",
        "Si las decenas son 9 y sumas 10, 10 decenas forman una centena nueva.",
      ),
    ],
    misconception: L(
      "Change the right digit. 10 is a ten, so it changes the tens digit, not the ones or the hundreds.",
      "Cambia el dígito correcto. 10 es una decena, así que cambia el dígito de las decenas, no el de las unidades ni el de las centenas.",
    ),
    misconceptions: [
      mis(
        "wrong-place",
        (item, raw) => {
          const m = q(item).match(/What is (10|100) (more|less) than (\d+)\?/);
          if (!m) return false;
          const n = Number(m[3]);
          const sign = m[2] === "more" ? 1 : -1;
          const others = m[1] === "10" ? [1, 100] : [10, 1];
          return others.some((o) => isNum(raw, n + sign * o));
        },
        "You changed the wrong place. 10 is one ten and 100 is one hundred: change only that digit.",
        "Cambiaste el lugar equivocado. 10 es una decena y 100 es una centena: cambia solo ese dígito.",
      ),
      mis(
        "wrong-way",
        (item, raw) => {
          const m = q(item).match(/What is (10|100) (more|less) than (\d+)\?/);
          if (!m) return false;
          const n = Number(m[3]);
          const k = Number(m[1]);
          return isNum(raw, m[2] === "more" ? n - k : n + k);
        },
        "Check the direction. “More” makes the number bigger; “less” makes it smaller.",
        "Revisa la dirección. «Más» hace el número mayor; «menos» lo hace menor.",
      ),
    ],
    living: tensModel,
    transfer: {
      prompt: L(
        "A game score is 467. You earn 100 more points. What is the score now?",
        "El puntaje de un juego es 467. Ganas 100 puntos más. ¿Cuál es el puntaje ahora?",
      ),
      answers: ["567"],
      kind: "number",
      hint: L(
        "100 more changes only the hundreds digit.",
        "100 más cambia solo el dígito de las centenas.",
      ),
      explanation: L(
        "4 hundreds become 5 hundreds; the tens and ones stay. 467 + 100 = 567.",
        "4 centenas se vuelven 5 centenas; las decenas y unidades se quedan. 467 + 100 = 567.",
      ),
    },
  },
};
