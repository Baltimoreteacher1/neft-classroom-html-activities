// Grade 6, part 1: number system and ratio reasoning. Schema: ../SCHEMA.md. Detectors read the student's raw
// answer against the numbers in the question and the item's own key, and fire only on a wrong answer.
import { L, gcd, key, num, nums, same } from "./kit-68.js";
import { percentModel, unitRateModel } from "./living-68-ratio.js";

const lcm = (a, b) => (a * b) / gcd(a, b);

export const G6A = {
  "6:gcf": {
    concept: L(
      "The greatest common factor (GCF) of two whole numbers is the largest number that divides both of them with no remainder. It tells you the largest equal groups both amounts can be split into.",
      "El máximo común divisor (MCD) de dos números enteros es el número más grande que divide a los dos sin residuo. Indica los grupos iguales más grandes en que se pueden repartir ambas cantidades.",
    ),
    reasons: [
      L(
        "A factor of a number divides it exactly, so a common factor divides both numbers exactly.",
        "Un factor de un número lo divide exactamente, así que un factor común divide exactamente a los dos números.",
      ),
      L(
        "Listing factors in pairs (1 × 12, 2 × 6, 3 × 4) finds every factor without missing one.",
        "Escribir los factores en parejas (1 × 12, 2 × 6, 3 × 4) encuentra todos los factores sin olvidar ninguno.",
      ),
      L(
        "The prime factors both numbers share, multiplied together, make the greatest common factor.",
        "Los factores primos que comparten los dos números, multiplicados entre sí, forman el máximo común divisor.",
      ),
    ],
    misconception: L(
      "The GCF can never be larger than the smaller number, and it is not the least common multiple. Check that your answer divides BOTH numbers exactly.",
      "El MCD nunca puede ser mayor que el número más pequeño, y no es el mínimo común múltiplo. Comprueba que tu respuesta divide exactamente a LOS DOS números.",
    ),
    misconceptions: [
      {
        id: "gave-lcm",
        detect(item, raw) {
          const [a, b] = nums(item.question);
          const v = num(raw);
          return same(v, lcm(a, b)) && !same(v, key(item));
        },
        feedback: L(
          "That number is a common MULTIPLE: both numbers divide into it. The GCF works the other way: it must divide into both numbers, so it is never larger than the smaller one.",
          "Ese número es un MÚLTIPLO común: los dos números caben en él. El MCD funciona al revés: debe caber en los dos números, así que nunca es mayor que el más pequeño.",
        ),
      },
      {
        id: "smaller-number",
        detect(item, raw) {
          const [a, b] = nums(item.question);
          const v = num(raw);
          return (
            same(v, Math.min(a, b)) && Math.max(a, b) % Math.min(a, b) !== 0
          );
        },
        feedback: L(
          "The smaller number divides itself, but check the larger number: it does not divide it exactly. List the factors of the smaller number and test each one in the larger number.",
          "El número más pequeño se divide a sí mismo, pero revisa el número más grande: no lo divide exactamente. Escribe los factores del número más pequeño y prueba cada uno en el número más grande.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A coach has 84 red cones and 126 blue cones. She wants identical stacks, each with the same number of red cones and the same number of blue cones, using every cone. What is the greatest number of stacks she can make?",
        "Una entrenadora tiene 84 conos rojos y 126 conos azules. Quiere pilas idénticas, cada una con el mismo número de conos rojos y el mismo número de conos azules, usando todos los conos. ¿Cuál es el mayor número de pilas que puede hacer?",
      ),
      answers: ["42"],
      kind: "number",
      hint: L(
        "The number of stacks must divide 84 and 126 exactly.",
        "El número de pilas debe dividir exactamente a 84 y a 126.",
      ),
      explanation: L(
        "84 = 2 × 2 × 3 × 7 and 126 = 2 × 3 × 3 × 7. They share 2 × 3 × 7 = 42, so 42 stacks of 2 red and 3 blue.",
        "84 = 2 × 2 × 3 × 7 y 126 = 2 × 3 × 3 × 7. Comparten 2 × 3 × 7 = 42, así que 42 pilas de 2 rojos y 3 azules.",
      ),
    },
  },

  "6:lcm": {
    concept: L(
      "The least common multiple (LCM) of two whole numbers is the smallest positive number that both of them divide into exactly. It is the first place where two skip-counts land together.",
      "El mínimo común múltiplo (mcm) de dos números enteros es el número positivo más pequeño en el que ambos caben exactamente. Es el primer lugar donde coinciden dos conteos salteados.",
    ),
    reasons: [
      L(
        "Multiples of a number are its skip-count: 4, 8, 12, 16, … A common multiple appears in both lists.",
        "Los múltiplos de un número son su conteo salteado: 4, 8, 12, 16, … Un múltiplo común aparece en las dos listas.",
      ),
      L(
        "The product of the two numbers is always a common multiple, but it is the least one only when they share no factor except 1.",
        "El producto de los dos números siempre es un múltiplo común, pero es el mínimo solo cuando no comparten ningún factor excepto 1.",
      ),
      L(
        "Dividing the product by the GCF removes the shared factor counted twice: LCM = a × b ÷ GCF.",
        "Dividir el producto entre el MCD quita el factor compartido que se contó dos veces: mcm = a × b ÷ MCD.",
      ),
    ],
    misconception: L(
      "Multiplying the two numbers gives A common multiple, not always the LEAST one. Skip-count by the larger number until you reach a multiple of the smaller one.",
      "Multiplicar los dos números da UN múltiplo común, no siempre el MÍNIMO. Cuenta de en salto con el número más grande hasta llegar a un múltiplo del más pequeño.",
    ),
    misconceptions: [
      {
        id: "product",
        detect(item, raw) {
          const [a, b] = nums(item.question);
          const v = num(raw);
          return same(v, a * b) && !same(v, key(item));
        },
        feedback: L(
          "Both numbers divide into your answer, so it is a common multiple, but there is a smaller one. These numbers share a factor, so skip-count by the larger number and stop at the first multiple of the smaller.",
          "Los dos números caben en tu respuesta, así que es un múltiplo común, pero hay uno más pequeño. Estos números comparten un factor: cuenta de en salto con el número más grande y detente en el primer múltiplo del más pequeño.",
        ),
      },
      {
        id: "gave-gcf",
        detect(item, raw) {
          const [a, b] = nums(item.question);
          const v = num(raw);
          return same(v, gcd(a, b)) && !same(v, key(item));
        },
        feedback: L(
          "That number divides both numbers: it is a common FACTOR. A common multiple is at least as large as the larger number, because both numbers must fit into it.",
          "Ese número divide a los dos números: es un FACTOR común. Un múltiplo común es por lo menos tan grande como el número más grande, porque los dos números deben caber en él.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "Hot dogs come in packs of 6 and buns come in packs of 8. What is the smallest number of hot dogs you can buy so that you have exactly the same number of buns, with nothing left over?",
        "Las salchichas vienen en paquetes de 6 y los panes en paquetes de 8. ¿Cuál es el menor número de salchichas que puedes comprar para tener exactamente el mismo número de panes, sin que sobre nada?",
      ),
      answers: ["24"],
      kind: "number",
      hint: L(
        "Skip-count by 8 and stop at a multiple of 6.",
        "Cuenta de 8 en 8 y detente en un múltiplo de 6.",
      ),
      explanation: L(
        "Multiples of 8: 8, 16, 24. 24 is also a multiple of 6 (6 × 4), so 4 packs of hot dogs and 3 packs of buns.",
        "Múltiplos de 8: 8, 16, 24. 24 también es múltiplo de 6 (6 × 4), así que 4 paquetes de salchichas y 3 de panes.",
      ),
    },
  },

  "6:divide-fractions": {
    title: L(
      "Divide fractions by fractions",
      "Dividir fracciones entre fracciones",
    ),
    concept: L(
      "Dividing by a fraction asks how many of that fraction fit into the first amount. 3/4 ÷ 1/8 asks “how many eighths are in three-fourths?”",
      "Dividir entre una fracción pregunta cuántas veces cabe esa fracción en la primera cantidad. 3/4 ÷ 1/8 pregunta «¿cuántos octavos hay en tres cuartos?».",
    ),
    reasons: [
      L(
        "Dividing by 1/8 is the same as multiplying by 8, because 8 eighths make one whole.",
        "Dividir entre 1/8 es lo mismo que multiplicar por 8, porque 8 octavos forman un entero.",
      ),
      L(
        "In general, dividing by c/d means multiplying by its reciprocal d/c: a/b ÷ c/d = a/b × d/c.",
        "En general, dividir entre c/d es multiplicar por su recíproco d/c: a/b ÷ c/d = a/b × d/c.",
      ),
      L(
        "Check with multiplication: the quotient times the divisor must give back the dividend.",
        "Comprueba con la multiplicación: el cociente por el divisor debe dar el dividendo.",
      ),
    ],
    misconception: L(
      "Only the DIVISOR (the second fraction) is flipped. Flipping the first fraction, or multiplying without flipping, answers a different question.",
      "Solo se invierte el DIVISOR (la segunda fracción). Invertir la primera fracción, o multiplicar sin invertir, responde otra pregunta.",
    ),
    misconceptions: [
      {
        id: "no-flip",
        detect(item, raw) {
          const [a, b, c, d] = nums(item.question);
          const v = num(raw);
          return same(v, (a * c) / (b * d)) && !same(v, key(item));
        },
        feedback: L(
          "You multiplied the fractions as written. Division asks how many of the second fraction fit into the first, which is the same as multiplying by the second fraction flipped (its reciprocal).",
          "Multiplicaste las fracciones tal como están. La división pregunta cuántas veces cabe la segunda fracción en la primera, y eso es igual a multiplicar por la segunda fracción invertida (su recíproco).",
        ),
      },
      {
        id: "flip-first",
        detect(item, raw) {
          const [a, b, c, d] = nums(item.question);
          const v = num(raw);
          return same(v, (b * c) / (a * d)) && !same(v, key(item));
        },
        feedback: L(
          "You flipped the first fraction. Keep the dividend as it is and flip only the divisor, the fraction you are dividing BY.",
          "Invertiste la primera fracción. Deja el dividendo como está e invierte solo el divisor, la fracción ENTRE la que divides.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A ribbon is 3/4 of a yard long. Each bow needs 1/8 of a yard. How many bows can you make?",
        "Una cinta mide 3/4 de yarda. Cada moño necesita 1/8 de yarda. ¿Cuántos moños puedes hacer?",
      ),
      answers: ["6"],
      kind: "number",
      hint: L(
        "How many eighths are in one fourth?",
        "¿Cuántos octavos hay en un cuarto?",
      ),
      explanation: L(
        "3/4 ÷ 1/8 = 3/4 × 8/1 = 24/4 = 6. Check: 6 × 1/8 = 6/8 = 3/4.",
        "3/4 ÷ 1/8 = 3/4 × 8/1 = 24/4 = 6. Comprueba: 6 × 1/8 = 6/8 = 3/4.",
      ),
    },
  },

  "6:decimal-ops": {
    concept: L(
      "Multiplying and dividing decimals uses the same steps as whole numbers; the place value of the digits decides where the decimal point goes. An estimate tells you the size the answer must have.",
      "Multiplicar y dividir decimales usa los mismos pasos que con números enteros; el valor posicional de las cifras decide dónde va el punto decimal. Una estimación te dice qué tamaño debe tener la respuesta.",
    ),
    reasons: [
      L(
        "0.3 × 0.2 means 3 tenths of 2 tenths. 3 × 2 gives the digits, and tenths of tenths are hundredths, so the product is 0.06.",
        "0,3 × 0,2 significa 3 décimos de 2 décimos. 3 × 2 da las cifras, y décimos de décimos son centésimos, así que el producto es 0,06.",
      ),
      L(
        "The number of decimal places in a product equals the decimal places in the factors added together.",
        "El número de lugares decimales del producto es la suma de los lugares decimales de los factores.",
      ),
      L(
        "Dividing a decimal by a whole number shares tenths and hundredths the same way you share ones: the decimal point lines up.",
        "Dividir un decimal entre un número entero reparte décimos y centésimos igual que las unidades: el punto decimal queda alineado.",
      ),
    ],
    misconception: L(
      "A decimal point in the wrong place makes the answer 10 or 100 times too big or too small. Round each number and estimate first; your answer should be close to the estimate.",
      "Un punto decimal mal colocado hace la respuesta 10 o 100 veces demasiado grande o pequeña. Redondea cada número y estima primero; tu respuesta debe estar cerca de la estimación.",
    ),
    misconceptions: [
      {
        id: "decimal-place",
        detect(item, raw) {
          const v = num(raw);
          const k = key(item);
          if (!Number.isFinite(v) || same(v, k) || v === 0) return false;
          return [10, 100, 1000, 0.1, 0.01, 0.001].some((f) => same(v, k * f));
        },
        feedback: L(
          "Your digits are right, but the decimal point is in the wrong place. Round each number to estimate: your answer is 10 or more times away from that estimate. Count the decimal places again.",
          "Tus cifras están bien, pero el punto decimal está en el lugar equivocado. Redondea cada número para estimar: tu respuesta está 10 o más veces lejos de esa estimación. Cuenta otra vez los lugares decimales.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "Fabric costs $4.75 per yard. What do 2.4 yards cost, in dollars?",
        "La tela cuesta $4.75 por yarda. ¿Cuánto cuestan 2.4 yardas, en dólares?",
      ),
      answers: ["11.4", "11.40"],
      kind: "number",
      hint: L(
        "Estimate: about 5 dollars a yard for between 2 and 3 yards.",
        "Estima: unos 5 dólares por yarda, entre 2 y 3 yardas.",
      ),
      explanation: L(
        "475 × 24 = 11,400. The factors have 2 + 1 = 3 decimal places, so 11.400 = $11.40, close to the estimate 5 × 2.4 = 12.",
        "475 × 24 = 11 400. Los factores tienen 2 + 1 = 3 lugares decimales, así que 11,400 = $11.40, cerca de la estimación 5 × 2,4 = 12.",
      ),
    },
  },

  "6:unit-rates": {
    title: L(
      "Unit rates and unit conversions",
      "Tasas unitarias y conversión de unidades",
    ),
    concept: L(
      "A unit rate tells how much of one quantity goes with exactly 1 of another: dollars for 1 item, feet in 1 yard. Find it by dividing; use it by multiplying.",
      "Una tasa unitaria dice cuánto de una cantidad corresponde a exactamente 1 de otra: dólares por 1 artículo, pies en 1 yarda. Se halla dividiendo y se usa multiplicando.",
    ),
    reasons: [
      L(
        "If 3 notebooks cost $6, splitting $6 into 3 equal shares gives the cost of 1 notebook.",
        "Si 3 cuadernos cuestan $6, repartir $6 en 3 partes iguales da el precio de 1 cuaderno.",
      ),
      L(
        "On a double number line, the unit rate is the number that sits above 1; every other pair is a multiple of it.",
        "En una recta numérica doble, la tasa unitaria es el número que queda sobre el 1; cada otra pareja es un múltiplo de ella.",
      ),
      L(
        "Converting to a smaller unit gives MORE units, so multiply by how many small units fit in one large unit.",
        "Convertir a una unidad más pequeña da MÁS unidades, así que multiplica por cuántas unidades pequeñas caben en una grande.",
      ),
    ],
    misconception: L(
      "Divide to find the amount for 1; multiplying the total by the count gives a much bigger number, not a unit rate. For conversions, a smaller unit means a larger count.",
      "Divide para hallar la cantidad de 1; multiplicar el total por la cantidad da un número mucho mayor, no una tasa unitaria. En conversiones, una unidad más pequeña significa un número mayor.",
    ),
    living: unitRateModel,
    misconceptions: [
      {
        id: "multiplied",
        detect(item, raw) {
          if (!/How much for 1/.test(item.question)) return false;
          const [total, count] = nums(item.question);
          const v = num(raw);
          return same(v, total * count) && !same(v, key(item));
        },
        feedback: L(
          "You multiplied the total by the number of items. The total is shared by all the items, so divide it into that many equal parts to find the amount for 1.",
          "Multiplicaste el total por el número de artículos. El total se reparte entre todos los artículos, así que divídelo en esa cantidad de partes iguales para hallar lo de 1.",
        ),
      },
      {
        id: "conversion-direction",
        detect(item, raw) {
          if (!/how many/.test(item.question) || /How much/.test(item.question))
            return false;
          const [given] = nums(item.question);
          const k = key(item);
          const factor = k / given;
          const v = num(raw);
          return !same(v, k) && (same(v, given / factor) || same(v, given));
        },
        feedback: L(
          "The new unit is smaller, so it takes MORE of them to measure the same length, time, or mass. Multiply by how many of the small unit fit in one of the large unit.",
          "La nueva unidad es más pequeña, así que se necesitan MÁS de ellas para medir la misma longitud, tiempo o masa. Multiplica por cuántas unidades pequeñas caben en una grande.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A runner covers 18 kilometers in 90 minutes at a steady pace. How many minutes does she take for 1 kilometer?",
        "Una corredora recorre 18 kilómetros en 90 minutos a ritmo constante. ¿Cuántos minutos tarda en 1 kilómetro?",
      ),
      answers: ["5"],
      kind: "number",
      unit: L("minutes", "minutos"),
      hint: L(
        "Share the minutes equally among the kilometers.",
        "Reparte los minutos por igual entre los kilómetros.",
      ),
      explanation: L(
        "90 minutes ÷ 18 kilometers = 5 minutes per kilometer. Check: 18 × 5 = 90.",
        "90 minutos ÷ 18 kilómetros = 5 minutos por kilómetro. Comprueba: 18 × 5 = 90.",
      ),
    },
  },

  "6:percent": {
    concept: L(
      "A percent is a rate per 100: 25% means 25 out of every 100. To find a percent of a number, find that part of the whole: 25% is one-fourth, 10% is one-tenth.",
      "Un porcentaje es una tasa por cada 100: 25 % significa 25 de cada 100. Para hallar el porcentaje de un número, toma esa parte del total: 25 % es un cuarto y 10 % es un décimo.",
    ),
    reasons: [
      L(
        "The whole is always 100%. A tape split into 4 equal parts shows 25% in each part.",
        "El total siempre es el 100 %. Una cinta dividida en 4 partes iguales muestra 25 % en cada parte.",
      ),
      L(
        "A double number line matches 0%–100% with 0 and the whole, so every percent lines up with its part.",
        "Una recta numérica doble empareja 0 %–100 % con 0 y el total, así cada porcentaje queda alineado con su parte.",
      ),
      L(
        "As an equation, part = (percent ÷ 100) × whole.",
        "Como ecuación, parte = (porcentaje ÷ 100) × total.",
      ),
    ],
    misconception: L(
      "A percent is not a count of things. 25% of 40 does not mean 25 things; it means one-fourth of 40, the size of one group when 40 is split into four equal groups.",
      "Un porcentaje no es una cantidad de cosas. El 25 % de 40 no significa 25 cosas; significa un cuarto de 40, el tamaño de un grupo cuando 40 se reparte en cuatro grupos iguales.",
    ),
    living: percentModel("part"),
    misconceptions: [
      {
        id: "percent-as-quantity",
        detect(item, raw) {
          const [p] = nums(item.question);
          const v = num(raw);
          return same(v, p) && !same(v, key(item));
        },
        feedback: L(
          "You answered with the percent itself. A percent is “out of 100,” not a number of things. For example, 25% is one-fourth: 25% of 40 means split 40 into four equal groups and take one group. Find what fraction of the whole your percent names, then take that part.",
          "Respondiste con el mismo porcentaje. Un porcentaje es «de cada 100», no un número de cosas. Por ejemplo, 25 % es un cuarto: el 25 % de 40 significa repartir 40 en cuatro grupos iguales y tomar un grupo. Halla qué fracción del total nombra tu porcentaje y toma esa parte.",
        ),
      },
      {
        id: "place",
        detect(item, raw) {
          const v = num(raw);
          const k = key(item);
          return !same(v, k) && k !== 0 && (same(v, k * 10) || same(v, k / 10));
        },
        feedback: L(
          "Your answer is ten times too large or too small. One-tenth of the whole is an easy check: is your answer the right size compared with it?",
          "Tu respuesta es diez veces demasiado grande o pequeña. Un décimo del total es una comprobación fácil: ¿tu respuesta tiene el tamaño correcto comparada con él?",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A class of 40 students voted, and 25% chose the museum trip. How many students chose the museum?",
        "Votó una clase de 40 estudiantes y el 25 % eligió el viaje al museo. ¿Cuántos estudiantes eligieron el museo?",
      ),
      answers: ["10"],
      kind: "number",
      hint: L(
        "25% is one-fourth of the class.",
        "El 25 % es un cuarto de la clase.",
      ),
      explanation: L(
        "25% = 1/4, and 40 split into 4 equal groups is 10 per group. So 10 students. Check: 10/40 = 25/100.",
        "25 % = 1/4, y 40 repartido en 4 grupos iguales da 10 por grupo. Así que 10 estudiantes. Comprueba: 10/40 = 25/100.",
      ),
    },
  },

  "6:percent-whole": {
    concept: L(
      "When you know a part and the percent it is, you can find the whole. If 12 is 20% of a number, then 12 is one-fifth of it, so the whole is 5 groups of 12.",
      "Cuando conoces una parte y el porcentaje que representa, puedes hallar el total. Si 12 es el 20 % de un número, entonces 12 es un quinto de él, así que el total son 5 grupos de 12.",
    ),
    reasons: [
      L(
        "The part matches the percent and the whole matches 100%, on the same double number line.",
        "La parte corresponde al porcentaje y el total al 100 %, en la misma recta numérica doble.",
      ),
      L(
        "Scale the known pair up to 100%: multiply both by the same factor, as with equivalent ratios.",
        "Escala la pareja conocida hasta el 100 %: multiplica las dos por el mismo factor, como en las razones equivalentes.",
      ),
      L(
        "As an equation, whole = part ÷ (percent ÷ 100). The whole is larger than the part whenever the percent is under 100%.",
        "Como ecuación, total = parte ÷ (porcentaje ÷ 100). El total es mayor que la parte cuando el porcentaje es menor que 100 %.",
      ),
    ],
    misconception: L(
      "The number you are given is the PART, not the whole. Taking a percent of it makes it smaller; the whole must be bigger than the part.",
      "El número que te dan es la PARTE, no el total. Tomar un porcentaje de él lo hace más pequeño; el total debe ser mayor que la parte.",
    ),
    living: percentModel("whole"),
    misconceptions: [
      {
        id: "percent-of-part",
        detect(item, raw) {
          const [part, p] = nums(item.question);
          const v = num(raw);
          return same(v, (part * p) / 100) && !same(v, key(item));
        },
        feedback: L(
          "You found the percent OF the given number, which treats it as the whole. Here it is the part. Ask: the part is what fraction of the whole? Then build the whole from equal parts.",
          "Hallaste el porcentaje DEL número dado, como si fuera el total. Aquí es la parte. Pregúntate: ¿qué fracción del total es la parte? Luego forma el total con partes iguales.",
        ),
      },
      {
        id: "percent-as-quantity",
        detect(item, raw) {
          const [part, p] = nums(item.question);
          const v = num(raw);
          return (
            !same(v, key(item)) &&
            (same(v, p) || same(v, part + p) || same(v, part * p))
          );
        },
        feedback: L(
          "A percent means “out of a hundred,” not a number to add or multiply: it names a fraction of the whole, such as one-fifth or one-fourth. Line up the part with its percent and the whole with the full amount, then scale.",
          "Un porcentaje significa «de cada cien», no un número para sumar o multiplicar: nombra una fracción del total, como un quinto o un cuarto. Alinea la parte con su porcentaje y el total con la cantidad completa, y luego escala.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A store has sold 18 tickets, which is 30% of all its tickets. How many tickets did the store have in all?",
        "Una tienda vendió 18 boletos, que son el 30 % de todos sus boletos. ¿Cuántos boletos tenía la tienda en total?",
      ),
      answers: ["60"],
      kind: "number",
      hint: L(
        "If 30% is 18 tickets, how many tickets is 10%?",
        "Si el 30 % son 18 boletos, ¿cuántos boletos son el 10 %?",
      ),
      explanation: L(
        "30% → 18, so 10% → 18 ÷ 3 = 6, and 100% → 6 × 10 = 60. Check: 30% of 60 = 18.",
        "30 % → 18, así que 10 % → 18 ÷ 3 = 6, y 100 % → 6 × 10 = 60. Comprueba: el 30 % de 60 es 18.",
      ),
    },
  },
};
