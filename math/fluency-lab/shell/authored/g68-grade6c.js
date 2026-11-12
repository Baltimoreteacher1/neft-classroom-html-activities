// Grade 6, part 3: expressions, inequalities, statistics and solid geometry. Schema: ../SCHEMA.md.
import { L, clean, key, linear, num, nums, same } from "./kit-68.js";
import { expressionModel, inequalityModel } from "./living-68-algebra.js";
import { fractionalVolumeModel } from "./living-68-geometry.js";

const sorted = (v) => [...v].sort((a, b) => a - b);
export const median = (v) => {
  const s = sorted(v);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
// Quartiles as the medians of the lower and upper halves, leaving out the median when the count is odd.
export const quartiles = (v) => {
  const s = sorted(v);
  const h = Math.floor(s.length / 2);
  return [median(s.slice(0, h)), median(s.slice(s.length - h))];
};
const dataOf = (q) => nums(String(q).split(":").slice(1).join(":"));
// "ax + b" with the inequality sign parsed out: "h ≥ 58", "58 <= h" → { v, op, n } with the variable first.
const FLIP = { "<": ">", ">": "<", "≤": "≥", "≥": "≤" };
export function inequality(raw) {
  const s = clean(raw)
    .replaceAll(">=", "≥")
    .replaceAll("<=", "≤")
    .replaceAll("=>", "≥")
    .replaceAll("=<", "≤");
  let m = s.match(/^([a-z])\s*([<>≤≥])\s*(-?\d+(?:\.\d+)?)$/i);
  if (m) return { v: m[1].toLowerCase(), op: m[2], n: Number(m[3]) };
  m = s.match(/^(-?\d+(?:\.\d+)?)\s*([<>≤≥])\s*([a-z])$/i);
  if (m) return { v: m[3].toLowerCase(), op: FLIP[m[2]], n: Number(m[1]) };
  return null;
}
const strict = (op) => op === "<" || op === ">";
const up = (op) => op === ">" || op === "≥";

export const G6C = {
  "6:equivalent-expressions": {
    title: L(
      "Write equivalent expressions",
      "Escribir expresiones equivalentes",
    ),
    concept: L(
      "Equivalent expressions have the same value for EVERY value of the variable. The distributive property, a(x + b) = ax + ab, multiplies every term inside the parentheses; factoring runs it backwards.",
      "Las expresiones equivalentes tienen el mismo valor para CUALQUIER valor de la variable. La propiedad distributiva, a(x + b) = ax + ab, multiplica cada término dentro del paréntesis; factorizar la aplica al revés.",
    ),
    reasons: [
      L(
        "A rectangle a wide and (x + b) long splits into two rectangles, a × x and a × b; the area is the same either way.",
        "Un rectángulo de ancho a y largo (x + b) se divide en dos rectángulos, a × x y a × b; el área es la misma de las dos maneras.",
      ),
      L(
        "Like terms have the same variable part, so 5x + 3x = 8x, just as 5 apples + 3 apples = 8 apples.",
        "Los términos semejantes tienen la misma parte variable, así que 5x + 3x = 8x, igual que 5 manzanas + 3 manzanas = 8 manzanas.",
      ),
      L(
        "Test equivalence by substituting the same value of x into both expressions.",
        "Comprueba la equivalencia sustituyendo el mismo valor de x en las dos expresiones.",
      ),
    ],
    misconception: L(
      "The number outside the parentheses multiplies EVERY term inside, not only the first. Substitute a value for x to check that both expressions agree.",
      "El número fuera del paréntesis multiplica CADA término de adentro, no solo el primero. Sustituye un valor de x para comprobar que las dos expresiones coinciden.",
    ),
    living: expressionModel,
    misconceptions: [
      {
        id: "first-term-only",
        detect(item, raw) {
          const m = clean(item.question).match(
            /(\d+)\(x \+ (\d+)\)( \+ (\d+)x)?/,
          );
          if (!m || /^Factor/.test(item.question)) return false;
          const [a, b, c] = [Number(m[1]), Number(m[2]), Number(m[4] || 0)];
          const got = linear(raw);
          return (
            Boolean(got) && same(got.x, a + c) && same(got.c, b) && b * a !== b
          );
        },
        feedback: L(
          "The number outside the parentheses multiplies BOTH terms inside: a(x + b) = ax + a × b. You multiplied only the x term. Picture the rectangle: both pieces have width a.",
          "El número fuera del paréntesis multiplica LOS DOS términos de adentro: a(x + b) = ax + a × b. Solo multiplicaste el término con x. Imagina el rectángulo: las dos partes tienen ancho a.",
        ),
      },
      {
        id: "unlike-terms",
        detect(item, raw) {
          const m = clean(item.question).match(
            /Combine like terms: (\d+)x \+ (\d+) \+ (\d+)x/,
          );
          if (!m) return false;
          const [a, b, c] = m.slice(1).map(Number);
          const got = linear(raw);
          return Boolean(got) && got.c === 0 && same(got.x, a + b + c);
        },
        feedback: L(
          "A constant is not an x term, so it cannot join the x terms. Combine only the x terms; the constant stays separate.",
          "Una constante no es un término con x, así que no se puede juntar con los términos con x. Combina solo los términos con x; la constante queda aparte.",
        ),
      },
      {
        id: "not-greatest",
        detect(item, raw) {
          const m = clean(item.question).match(/Factor (\d+)x \+ (\d+)/);
          if (!m) return false;
          const [p, q] = m.slice(1).map(Number);
          const f = clean(raw)
            .replace(/\s+/g, "")
            .match(/^(\d+)\((\d*)x\+(\d+)\)$/);
          if (!f) return false;
          const [k, a, b] = [Number(f[1]), Number(f[2] || 1), Number(f[3])];
          return (
            k * a === p &&
            k * b === q &&
            !clean(item.answers[0]).replace(/\s+/g, "").startsWith(`${k}(`)
          );
        },
        feedback: L(
          "Your factored form is equivalent, but the factor outside is not the GREATEST common factor: the terms inside still share a factor. Find the GCF of the two numbers first.",
          "Tu forma factorizada es equivalente, pero el factor de afuera no es el MÁXIMO común divisor: los términos de adentro todavía comparten un factor. Halla primero el MCD de los dos números.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "Five friends each buy a sandwich that costs s dollars and a drink that costs $3. The total is 5(s + 3) dollars. Write the total without parentheses.",
        "Cinco amigos compran cada uno un sándwich de s dólares y una bebida de $3. El total es 5(s + 3) dólares. Escribe el total sin paréntesis.",
      ),
      answers: ["5s + 15", "15 + 5s"],
      kind: "text",
      hint: L("The 5 multiplies the sandwich AND the drink.", "El 5 multiplica el sándwich Y la bebida."),
      explanation: L(
        "5(s + 3) = 5 × s + 5 × 3 = 5s + 15: five sandwiches and five drinks. Check with s = 4: 5 × 7 = 35 and 20 + 15 = 35.",
        "5(s + 3) = 5 × s + 5 × 3 = 5s + 15: cinco sándwiches y cinco bebidas. Comprueba con s = 4: 5 × 7 = 35 y 20 + 15 = 35.",
      ),
    },
  },

  "6:write-inequalities": {
    title: L(
      "Write and graph inequalities",
      "Escribir y graficar desigualdades",
    ),
    concept: L(
      "An inequality describes ALL the values that make a condition true, not one value. “At least 58” includes 58 (≥, a closed dot); “more than 58” does not (>, an open dot).",
      "Una desigualdad describe TODOS los valores que cumplen una condición, no solo uno. «Por lo menos 58» incluye el 58 (≥, punto cerrado); «más de 58» no lo incluye (>, punto abierto).",
    ),
    reasons: [
      L(
        "“At least” and “no less than” mean ≥; “at most” and “no more than” mean ≤.",
        "«Por lo menos» y «no menos de» significan ≥; «como máximo» y «no más de» significan ≤.",
      ),
      L(
        "“More than” and “above” mean >; “fewer than”, “less than” and “below” mean <.",
        "«Más de» y «por encima de» significan >; «menos de» y «por debajo de» significan <.",
      ),
      L(
        "Test one value on each side of the boundary to check the direction of your inequality.",
        "Prueba un valor a cada lado del límite para comprobar la dirección de tu desigualdad.",
      ),
    ],
    misconception: L(
      "Check two things: the direction (greater or less) and whether the boundary itself is allowed (≥ ≤ include it, > < do not). Test a number to be sure.",
      "Revisa dos cosas: la dirección (mayor o menor) y si el límite está permitido (≥ ≤ lo incluyen; > < no). Prueba un número para asegurarte.",
    ),
    living: inequalityModel,
    misconceptions: [
      {
        id: "direction",
        detect(item, raw) {
          const want = inequality(item.answers[0]);
          const got = inequality(raw);
          return (
            Boolean(got && want) &&
            got.n === want.n &&
            up(got.op) !== up(want.op)
          );
        },
        feedback: L(
          "Your inequality points the wrong way. Test a value: does a number bigger than the boundary fit the situation? If yes, the variable is greater (> or ≥).",
          "Tu desigualdad apunta al lado contrario. Prueba un valor: ¿un número mayor que el límite cumple la situación? Si sí, la variable es mayor (> o ≥).",
        ),
      },
      {
        id: "boundary",
        detect(item, raw) {
          const want = inequality(item.answers[0]);
          const got = inequality(raw);
          return (
            Boolean(got && want) &&
            got.n === want.n &&
            up(got.op) === up(want.op) &&
            strict(got.op) !== strict(want.op)
          );
        },
        feedback: L(
          "The direction is right; check the boundary number itself. Words like “at least” and “at most” include it (≥, ≤); “more than” and “fewer than” do not (>, <).",
          "La dirección es correcta; revisa el número límite. Palabras como «por lo menos» y «como máximo» lo incluyen (≥, ≤); «más de» y «menos de» no (>, <).",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "An elevator can carry no more than 12 people. Write an inequality for the number of people p the elevator can carry. (Type ≤ as <=.)",
        "Un ascensor puede llevar no más de 12 personas. Escribe una desigualdad para el número de personas p que puede llevar. (Escribe ≤ como <=.)",
      ),
      answers: ["p ≤ 12", "p <= 12", "12 ≥ p", "12 >= p"],
      kind: "text",
      hint: L(
        "Is 12 people allowed? Are 13?",
        "¿Se permiten 12 personas? ¿Y 13?",
      ),
      explanation: L(
        "12 is allowed and anything above 12 is not, so p ≤ 12 (closed dot at 12, shading to the left).",
        "Se permiten 12 y nada por encima de 12, así que p ≤ 12 (punto cerrado en 12, sombreado hacia la izquierda).",
      ),
    },
  },

  "6:data-displays": {
    concept: L(
      "A data display organizes values so you can read them at a glance. A frequency table counts how many values fall in each category; a histogram counts how many fall in each equal interval.",
      "Una representación de datos organiza los valores para leerlos de un vistazo. Una tabla de frecuencias cuenta cuántos valores hay en cada categoría; un histograma cuenta cuántos caen en cada intervalo igual.",
    ),
    reasons: [
      L(
        "Each person or object is counted once, so the total of the frequencies is the number of data values.",
        "Cada persona u objeto se cuenta una vez, así que la suma de las frecuencias es el número de datos.",
      ),
      L(
        "Histogram intervals do not overlap: 20–29 ends before 30, so 30 belongs to the next interval.",
        "Los intervalos del histograma no se superponen: 20–29 termina antes de 30, así que 30 pertenece al siguiente intervalo.",
      ),
      L(
        "A frequency is a count of values, not the values themselves.",
        "Una frecuencia es un conteo de valores, no los valores mismos.",
      ),
    ],
    misconception: L(
      "In a frequency table, the category (like “3 books”) is a label and the frequency is how many people. Add the frequencies to count the people.",
      "En una tabla de frecuencias, la categoría (como «3 libros») es una etiqueta y la frecuencia es cuántas personas hay. Suma las frecuencias para contar a las personas.",
    ),
    misconceptions: [
      {
        id: "counted-things",
        detect(item, raw) {
          const pairs = [
            ...clean(item.question).matchAll(/(\d+) [a-z]+: (\d+)/g),
          ].map((m) => [Number(m[1]), Number(m[2])]);
          if (!pairs.length) return false;
          const v = num(raw);
          const things = pairs.reduce((t, [k, f]) => t + k * f, 0);
          return (
            !same(v, key(item)) && (same(v, things) || same(v, pairs.length))
          );
        },
        feedback: L(
          "The question asks how many PEOPLE were asked. Each frequency is a number of people, so add only the frequencies, not the category labels and not the items they own.",
          "La pregunta es cuántas PERSONAS respondieron. Cada frecuencia es un número de personas, así que suma solo las frecuencias, no las etiquetas de categoría ni los objetos que tienen.",
        ),
      },
      {
        id: "interval-edge",
        detect(item, raw) {
          const m = clean(item.question).match(
            /data (.*) in intervals of \d+\. How many values are in the interval (\d+)-(\d+)/,
          );
          if (!m) return false;
          const data = nums(m[1]);
          const [lo, hi] = [Number(m[2]), Number(m[3])];
          const v = num(raw);
          const wide = data.filter((d) => d >= lo && d <= hi + 1).length;
          return !same(v, key(item)) && same(v, wide);
        },
        feedback: L(
          "Check the edge of the interval. It ends at its last number, so the first number of the next interval is not counted here.",
          "Revisa el borde del intervalo. Termina en su último número, así que el primer número del siguiente intervalo no se cuenta aquí.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A survey asked students how many hours they read last week. 0 hours: 3; 1 hour: 7; 2 hours: 6; 3 hours: 4. How many students answered the survey?",
        "Una encuesta preguntó a estudiantes cuántas horas leyeron la semana pasada. 0 horas: 3; 1 hora: 7; 2 horas: 6; 3 horas: 4. ¿Cuántos estudiantes respondieron la encuesta?",
      ),
      answers: ["20"],
      kind: "number",
      hint: L(
        "Each frequency counts students.",
        "Cada frecuencia cuenta estudiantes.",
      ),
      explanation: L(
        "3 + 7 + 6 + 4 = 20 students.",
        "3 + 7 + 6 + 4 = 20 estudiantes.",
      ),
    },
  },

  "6:center-spread": {
    concept: L(
      "A measure of center (mean or median) gives one number to represent the data; a measure of spread (MAD or IQR) tells how far the values typically are from that center.",
      "Una medida de centro (media o mediana) da un número que representa los datos; una medida de dispersión (DMA o rango intercuartílico) dice qué tan lejos suelen estar los valores de ese centro.",
    ),
    reasons: [
      L(
        "The mean is the fair share: add the values and divide by how many there are.",
        "La media es el reparto justo: suma los valores y divide entre cuántos hay.",
      ),
      L(
        "The median is the middle value once the data are IN ORDER; the quartiles are the middles of the lower and upper halves.",
        "La mediana es el valor central una vez que los datos están EN ORDEN; los cuartiles son los centros de la mitad inferior y de la mitad superior.",
      ),
      L(
        "MAD averages distances from the mean, and distances are never negative; IQR = Q3 − Q1 measures the middle half.",
        "La DMA promedia distancias a la media, y las distancias nunca son negativas; el rango intercuartílico = Q3 − Q1 mide la mitad central.",
      ),
    ],
    misconception: L(
      "The range uses the two extreme values; the IQR uses only the middle half. Order the data, find Q1 and Q3, then subtract.",
      "El rango usa los dos valores extremos; el rango intercuartílico usa solo la mitad central. Ordena los datos, halla Q1 y Q3 y luego resta.",
    ),
    misconceptions: [
      {
        id: "range-for-iqr",
        detect(item, raw) {
          if (!/IQR/.test(item.question)) return false;
          const d = dataOf(item.question);
          const v = num(raw);
          return (
            same(v, Math.max(...d) - Math.min(...d)) && !same(v, key(item))
          );
        },
        feedback: L(
          "You found the range: greatest minus least. The IQR leaves out the lowest and highest quarters: subtract Q1 from Q3, the middles of the two halves.",
          "Hallaste el rango: el mayor menos el menor. El rango intercuartílico deja fuera el cuarto más bajo y el más alto: resta Q1 de Q3, los centros de las dos mitades.",
        ),
      },
      {
        id: "unsorted-median",
        detect(item, raw) {
          if (!/median/.test(item.question)) return false;
          const d = dataOf(item.question);
          const m = Math.floor(d.length / 2);
          const mid = d.length % 2 ? d[m] : (d[m - 1] + d[m]) / 2;
          const v = num(raw);
          return same(v, mid) && !same(v, key(item));
        },
        feedback: L(
          "You took the middle of the list as written. Put the values in order from least to greatest first; the median is the middle of the ORDERED list.",
          "Tomaste el centro de la lista tal como está. Primero ordena los valores de menor a mayor; la mediana es el centro de la lista ORDENADA.",
        ),
      },
      {
        id: "signed-deviation",
        detect(item, raw) {
          return (
            /MAD/.test(item.question) &&
            same(num(raw), 0) &&
            !same(key(item), 0)
          );
        },
        feedback: L(
          "The signed differences from the mean always cancel to 0. MAD uses DISTANCES, which are all positive: take the absolute value of each difference before you average.",
          "Las diferencias con signo respecto a la media siempre se cancelan en 0. La DMA usa DISTANCIAS, que son todas positivas: toma el valor absoluto de cada diferencia antes de promediar.",
        ),
      },
      {
        id: "median-for-mean",
        detect(item, raw) {
          if (!/mean of/.test(item.question)) return false;
          const v = num(raw);
          return same(v, median(dataOf(item.question))) && !same(v, key(item));
        },
        feedback: L(
          "That is the median, the middle value. The mean is the fair share: add all the values and divide by how many there are.",
          "Esa es la mediana, el valor central. La media es el reparto justo: suma todos los valores y divide entre cuántos hay.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A team scored these points in 7 games: 4, 9, 6, 12, 8, 5, 11. Find the interquartile range of the scores.",
        "Un equipo anotó estos puntos en 7 partidos: 4, 9, 6, 12, 8, 5, 11. Halla el rango intercuartílico de los puntos.",
      ),
      answers: ["6"],
      kind: "number",
      hint: L(
        "Order the scores. The median is the 4th value.",
        "Ordena los puntos. La mediana es el 4.º valor.",
      ),
      explanation: L(
        "In order: 4, 5, 6, 8, 9, 11, 12. Lower half 4, 5, 6 → Q1 = 5; upper half 9, 11, 12 → Q3 = 11. IQR = 11 − 5 = 6.",
        "En orden: 4, 5, 6, 8, 9, 11, 12. Mitad inferior 4, 5, 6 → Q1 = 5; mitad superior 9, 11, 12 → Q3 = 11. Rango intercuartílico = 11 − 5 = 6.",
      ),
    },
  },

  "6:surface-area-nets": {
    concept: L(
      "Surface area is the total area of all the faces of a solid. A net unfolds the solid flat, so you can find the area of each face and add them.",
      "El área de superficie es el área total de todas las caras de un cuerpo. Una red despliega el cuerpo en el plano, así que puedes hallar el área de cada cara y sumarlas.",
    ),
    reasons: [
      L(
        "A rectangular prism has 6 faces in 3 matching pairs: top and bottom, front and back, left and right.",
        "Un prisma rectangular tiene 6 caras en 3 pares iguales: arriba y abajo, frente y atrás, izquierda y derecha.",
      ),
      L(
        "A square pyramid has one square base and 4 identical triangles, each ½ × base × height.",
        "Una pirámide cuadrada tiene una base cuadrada y 4 triángulos idénticos, cada uno ½ × base × altura.",
      ),
      L(
        "Surface area is in square units; volume, the space inside, is in cubic units.",
        "El área de superficie se mide en unidades cuadradas; el volumen, el espacio de adentro, en unidades cúbicas.",
      ),
    ],
    misconception: L(
      "length × width × height is the VOLUME, the space inside. Surface area covers the outside: add the areas of every face in the net.",
      "largo × ancho × alto es el VOLUMEN, el espacio de adentro. El área de superficie cubre el exterior: suma las áreas de todas las caras de la red.",
    ),
    misconceptions: [
      {
        id: "volume",
        detect(item, raw) {
          if (!/rectangular prism/.test(item.question)) return false;
          const [l, w, h] = nums(item.question);
          const v = num(raw);
          return same(v, l * w * h) && !same(v, key(item));
        },
        feedback: L(
          "You multiplied the three edges, which gives the volume. For surface area, find the area of each of the 6 faces in the net and add them.",
          "Multiplicaste las tres aristas, y eso da el volumen. Para el área de superficie, halla el área de cada una de las 6 caras de la red y súmalas.",
        ),
      },
      {
        id: "three-faces",
        detect(item, raw) {
          if (!/rectangular prism/.test(item.question)) return false;
          const [l, w, h] = nums(item.question);
          const v = num(raw);
          return same(v, l * w + l * h + w * h) && !same(v, key(item));
        },
        feedback: L(
          "You found three different faces. Each face has a matching face on the opposite side, so the net has 6 faces: double your sum.",
          "Hallaste tres caras distintas. Cada cara tiene una igual del lado opuesto, así que la red tiene 6 caras: duplica tu suma.",
        ),
      },
      {
        id: "triangle-half",
        detect(item, raw) {
          if (!/pyramid/.test(item.question)) return false;
          const [s, , h] = nums(item.question);
          const v = num(raw);
          return same(v, s * s + 4 * s * h) && !same(v, key(item));
        },
        feedback: L(
          "Each triangle's area is HALF of base × height. Find one triangle's area, multiply by 4, and add the square base.",
          "El área de cada triángulo es la MITAD de base × altura. Halla el área de un triángulo, multiplica por 4 y suma la base cuadrada.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "You wrap a gift box 8 in long, 5 in wide and 3 in tall in paper with no overlap. How many square inches of paper cover it?",
        "Envuelves una caja de regalo de 8 in de largo, 5 in de ancho y 3 in de alto con papel, sin que se encime. ¿Cuántas pulgadas cuadradas de papel la cubren?",
      ),
      answers: ["158"],
      kind: "number",
      hint: L(
        "Find the three different faces, then use each twice.",
        "Halla las tres caras distintas y usa cada una dos veces.",
      ),
      explanation: L(
        "8 × 5 = 40, 8 × 3 = 24, 5 × 3 = 15. 2 × (40 + 24 + 15) = 2 × 79 = 158 square inches.",
        "8 × 5 = 40, 8 × 3 = 24, 5 × 3 = 15. 2 × (40 + 24 + 15) = 2 × 79 = 158 pulgadas cuadradas.",
      ),
    },
  },

  "6:volume-fractional": {
    concept: L(
      "The volume of a rectangular prism is V = length × width × height, even when the edges are fractions. With ½-unit edges, the prism fills with small cubes that are each 1/8 of a unit cube.",
      "El volumen de un prisma rectangular es V = largo × ancho × alto, aunque las aristas sean fracciones. Con aristas de ½ unidad, el prisma se llena de cubitos que son cada uno 1/8 de un cubo unidad.",
    ),
    reasons: [
      L(
        "A cube with edges of ½ has volume ½ × ½ × ½ = 1/8, so 8 of them make one unit cube.",
        "Un cubo con aristas de ½ tiene volumen ½ × ½ × ½ = 1/8, así que 8 de ellos forman un cubo unidad.",
      ),
      L(
        "Counting the small cubes and dividing by 8 gives the same volume as multiplying the edge lengths.",
        "Contar los cubitos y dividir entre 8 da el mismo volumen que multiplicar las longitudes de las aristas.",
      ),
      L(
        "Write mixed numbers as fractions (2 1/2 = 5/2) before multiplying.",
        "Escribe los números mixtos como fracciones (2 1/2 = 5/2) antes de multiplicar.",
      ),
    ],
    misconception: L(
      "Multiplying only the whole numbers drops part of every edge. Change each mixed number to a fraction first, then multiply all three.",
      "Multiplicar solo los números enteros deja fuera una parte de cada arista. Cambia primero cada número mixto a fracción y luego multiplica las tres.",
    ),
    living: fractionalVolumeModel,
    misconceptions: [
      {
        id: "whole-parts",
        detect(item, raw) {
          const edges = [
            ...clean(item.question).matchAll(/(\d+ \d\/\d|\d\/\d|\d+) ft/g),
          ].map((m) => m[1]);
          if (edges.length !== 3) return false;
          const wholes = edges.map((e) =>
            e.includes(" ")
              ? Number(e.split(" ")[0])
              : e.includes("/")
                ? 0
                : Number(e),
          );
          const v = num(raw);
          return (
            same(v, wholes[0] * wholes[1] * wholes[2]) && !same(v, key(item))
          );
        },
        feedback: L(
          "You multiplied only the whole-number parts, so the half-unit parts of the edges are missing. Write each length as a fraction (2 1/2 = 5/2) and multiply all three.",
          "Multiplicaste solo las partes enteras, así que faltan las mitades de las aristas. Escribe cada longitud como fracción (2 1/2 = 5/2) y multiplica las tres.",
        ),
      },
      {
        id: "added",
        detect(item, raw) {
          const edges = [
            ...clean(item.question).matchAll(/(\d+ \d\/\d|\d\/\d|\d+) ft/g),
          ].map((m) => num(m[1]));
          const v = num(raw);
          return (
            edges.length === 3 &&
            same(v, edges[0] + edges[1] + edges[2]) &&
            !same(v, key(item))
          );
        },
        feedback: L(
          "Volume counts cubes, so the three edges are multiplied, not added.",
          "El volumen cuenta cubos, así que las tres aristas se multiplican, no se suman.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A sandbox is 3 1/2 ft long, 2 ft wide and 1/2 ft deep. How many cubic feet of sand fill it?",
        "Un arenero mide 3 1/2 ft de largo, 2 ft de ancho y 1/2 ft de profundidad. ¿Cuántos pies cúbicos de arena lo llenan?",
      ),
      answers: ["3 1/2", "7/2", "3.5"],
      kind: "fraction",
      hint: L(
        "Write 3 1/2 as a fraction first.",
        "Escribe primero 3 1/2 como fracción.",
      ),
      explanation: L(
        "7/2 × 2 × 1/2 = 14/4 = 7/2 = 3 1/2 cubic feet.",
        "7/2 × 2 × 1/2 = 14/4 = 7/2 = 3 1/2 pies cúbicos.",
      ),
    },
  },
};
