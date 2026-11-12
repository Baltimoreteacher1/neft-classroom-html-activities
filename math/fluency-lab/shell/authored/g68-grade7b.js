// Grade 7, part 2: equations, inequalities, geometry and chance. Schema: ../SCHEMA.md.
import { L, clean, key, linear, near, num, nums, same } from "./kit-68.js";
import { likeTermsModel } from "./living-68-algebra.js";
import { angleModel, circumferenceModel } from "./living-68-geometry.js";
import { samplingModel } from "./living-68-number.js";

// "ax ± b = c" → { a, b (signed), c }.
export function twoStep(question) {
  const m = clean(question).match(/^(-?\d*)x ([+-]) (\d+) = (-?\d+)/);
  if (!m) return null;
  const a = m[1] === "" ? 1 : m[1] === "-" ? -1 : Number(m[1]);
  return { a, b: (m[2] === "+" ? 1 : -1) * Number(m[3]), c: Number(m[4]) };
}
export const EQUATION_MISCONCEPTIONS = [
  {
    id: "one-side",
    detect(item, raw) {
      const e = twoStep(item.question);
      if (!e) return false;
      const v = num(raw);
      return same(v, e.c / e.a) && !same(v, key(item));
    },
    feedback: L(
      "You divided the right side but never removed the constant from the left side. Whatever you do to one side of an equation you must do to the other: first undo the + or − on BOTH sides, then divide BOTH sides.",
      "Dividiste el lado derecho pero nunca quitaste la constante del lado izquierdo. Lo que haces en un lado de la ecuación debes hacerlo en el otro: primero deshaz el + o el − en LOS DOS lados y luego divide LOS DOS lados.",
    ),
  },
  {
    id: "wrong-inverse",
    detect(item, raw) {
      const e = twoStep(item.question);
      if (!e) return false;
      const v = num(raw);
      return same(v, (e.c + e.b) / e.a) && !same(v, key(item));
    },
    feedback: L(
      "Check the inverse operation for the constant. To undo + b, subtract b from both sides; to undo − b, add b to both sides. Substitute your answer to see the equation is not balanced.",
      "Revisa la operación inversa para la constante. Para deshacer + b, resta b en los dos lados; para deshacer − b, suma b en los dos lados. Sustituye tu respuesta para ver que la ecuación no queda en equilibrio.",
    ),
  },
  {
    id: "sign",
    detect(item, raw) {
      const v = num(raw);
      const k = key(item);
      return k !== 0 && same(v, -k);
    },
    feedback: L(
      "The size is right; check the sign. Dividing a negative number by a positive one gives a negative result. Substitute to check.",
      "El tamaño es correcto; revisa el signo. Dividir un número negativo entre uno positivo da un resultado negativo. Sustituye para comprobar.",
    ),
  },
];
const r2 = (n) => Math.round(n * 100) / 100;

export const G7B = {
  "7:equations": {
    title: L("Solve two-step equations", "Resolver ecuaciones de dos pasos"),
    concept: L(
      "A two-step equation like 6x + 3 = 87 has two operations on x. Undo them in reverse order, doing the same thing to both sides each time: first remove the constant, then divide by the coefficient.",
      "Una ecuación de dos pasos como 6x + 3 = 87 tiene dos operaciones sobre x. Deshazlas en orden inverso, haciendo lo mismo en los dos lados cada vez: primero quita la constante y luego divide entre el coeficiente.",
    ),
    reasons: [
      L(
        "6x + 3 means “multiply by 6, then add 3”. Undoing goes backwards: subtract 3, then divide by 6.",
        "6x + 3 significa «multiplica por 6 y luego suma 3». Deshacer va al revés: resta 3 y luego divide entre 6.",
      ),
      L(
        "Each step keeps both sides equal, so every new equation has the same solution as the first.",
        "Cada paso mantiene iguales los dos lados, así que cada nueva ecuación tiene la misma solución que la primera.",
      ),
      L(
        "Substitute to check: the left side must equal the right side.",
        "Sustituye para comprobar: el lado izquierdo debe ser igual al derecho.",
      ),
    ],
    misconception: L(
      "An equation is a balance. Changing only one side breaks it: every step must be applied to BOTH sides.",
      "Una ecuación es una balanza. Cambiar solo un lado la desequilibra: cada paso se aplica a LOS DOS lados.",
    ),
    misconceptions: EQUATION_MISCONCEPTIONS,
    transfer: {
      prompt: L(
        "A phone plan costs $15 a month plus $4 for each gigabyte of data. Last month's bill was $47. Write and solve an equation to find how many gigabytes were used.",
        "Un plan de teléfono cuesta $15 al mes más $4 por cada gigabyte de datos. La factura del mes pasado fue de $47. Escribe y resuelve una ecuación para hallar cuántos gigabytes se usaron.",
      ),
      answers: ["8"],
      kind: "number",
      unit: L("gigabytes", "gigabytes"),
      hint: L("4g + 15 = 47.", "4g + 15 = 47."),
      explanation: L(
        "4g + 15 = 47 → 4g = 32 → g = 8. Check: 4 × 8 + 15 = 47.",
        "4g + 15 = 47 → 4g = 32 → g = 8. Comprueba: 4 × 8 + 15 = 47.",
      ),
    },
  },

  "7:inequalities": {
    title: L(
      "Test solutions to inequalities",
      "Comprobar soluciones de desigualdades",
    ),
    concept: L(
      "A number is a solution of an inequality when it makes the statement true. Substitute the number, then compare using the number line: farther right is greater, even for negatives.",
      "Un número es solución de una desigualdad cuando hace verdadera la afirmación. Sustituye el número y compara con la recta numérica: más a la derecha es mayor, incluso con negativos.",
    ),
    reasons: [
      L(
        "−1 is to the right of −4, so −1 > −4.",
        "−1 está a la derecha de −4, así que −1 > −4.",
      ),
      L(
        "≥ and ≤ include the boundary number itself; > and < do not.",
        "≥ y ≤ incluyen el número límite; > y < no.",
      ),
      L(
        "Every inequality has infinitely many solutions: all the numbers on one side of the boundary.",
        "Toda desigualdad tiene infinitas soluciones: todos los números a un lado del límite.",
      ),
    ],
    misconception: L(
      "Comparing negatives by their size without the sign reverses the answer. On the number line, the number farther right is greater.",
      "Comparar negativos por su tamaño sin el signo invierte la respuesta. En la recta numérica, el número más a la derecha es mayor.",
    ),
    misconceptions: [
      {
        id: "absolute",
        detect(item, raw) {
          const m = clean(item.question).match(
            /Is (-?\d+) a solution to x ([<>≤≥]) (-?\d+)/,
          );
          if (!m) return false;
          const [v, op, b] = [
            Math.abs(Number(m[1])),
            m[2],
            Math.abs(Number(m[3])),
          ];
          const byAbs = { "<": v < b, ">": v > b, "≤": v <= b, "≥": v >= b }[op]
            ? "yes"
            : "no";
          const ans = clean(raw).toLowerCase();
          return (
            ans !== item.answers[0] &&
            ans === byAbs &&
            (Number(m[1]) < 0 || Number(m[3]) < 0)
          );
        },
        feedback: L(
          "You compared the numbers without their signs. Place both on a number line: the one farther RIGHT is greater, so −1 > −4.",
          "Comparaste los números sin sus signos. Coloca los dos en una recta numérica: el que está más a la DERECHA es mayor, así que −1 > −4.",
        ),
      },
      {
        id: "boundary",
        detect(item, raw) {
          const m = clean(item.question).match(
            /Is (-?\d+) a solution to x ([<>≤≥]) (-?\d+)/,
          );
          return (
            Boolean(m) &&
            m[1] === m[3] &&
            clean(raw).toLowerCase() !== item.answers[0]
          );
        },
        feedback: L(
          "The number is the boundary itself. ≥ and ≤ mean “or equal to”, so the boundary is a solution; > and < leave it out.",
          "El número es el propio límite. ≥ y ≤ significan «o igual a», así que el límite es solución; > y < lo dejan fuera.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A freezer must stay at or below −18 °C. A thermometer reads −15 °C. Is the freezer cold enough? Answer yes or no.",
        "Un congelador debe estar a −18 °C o menos. Un termómetro marca −15 °C. ¿Está lo bastante frío el congelador? Responde sí o no.",
      ),
      answers: ["no"],
      kind: "text",
      hint: L("Is −15 ≤ −18?", "¿Es −15 ≤ −18?"),
      explanation: L(
        "−15 is to the right of −18, so −15 > −18: the freezer is 3 degrees too warm.",
        "−15 está a la derecha de −18, así que −15 > −18: el congelador está 3 grados demasiado caliente.",
      ),
    },
  },

  "7:circle-area": {
    title: L("Area of a circle", "Área del círculo"),
    concept: L(
      "The area of a circle is A = πr²: the radius squared, times π. Cut a circle into thin slices and rearrange them; they form a shape close to a rectangle r tall and half the circumference (πr) long.",
      "El área de un círculo es A = πr²: el radio al cuadrado por π. Corta un círculo en rebanadas delgadas y reacomódalas; forman una figura casi rectangular de altura r y largo igual a la mitad de la circunferencia (πr).",
    ),
    reasons: [
      L(
        "r × πr = πr², so the rearranged slices explain the formula.",
        "r × πr = πr², así que las rebanadas reacomodadas explican la fórmula.",
      ),
      L(
        "r² is the area of a square on the radius; the circle covers a little more than 3 of those squares.",
        "r² es el área de un cuadrado sobre el radio; el círculo cubre un poco más de 3 de esos cuadrados.",
      ),
      L(
        "Area grows with the SQUARE of the radius: double r and the area becomes 4 times as large.",
        "El área crece con el CUADRADO del radio: si duplicas r, el área se hace 4 veces mayor.",
      ),
    ],
    misconception: L(
      "2r (the diameter) belongs to circumference, C = 2πr. Area squares the radius: r × r.",
      "2r (el diámetro) pertenece a la circunferencia, C = 2πr. El área eleva el radio al cuadrado: r × r.",
    ),
    misconceptions: [
      {
        id: "doubled",
        detect(item, raw) {
          const [r] = nums(item.question);
          const v = num(raw);
          return same(v, 2 * r) && !same(v, key(item));
        },
        feedback: L(
          "2r is the diameter, used for circumference. Area multiplies the radius by ITSELF: r × r.",
          "2r es el diámetro, que se usa para la circunferencia. El área multiplica el radio por SÍ MISMO: r × r.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A round rug has a diameter of 6 feet. Its area is k × π square feet. What is k?",
        "Una alfombra redonda tiene un diámetro de 6 pies. Su área es k × π pies cuadrados. ¿Cuánto vale k?",
      ),
      answers: ["9"],
      kind: "number",
      hint: L(
        "The formula uses the radius, not the diameter.",
        "La fórmula usa el radio, no el diámetro.",
      ),
      explanation: L(
        "r = 6 ÷ 2 = 3, so A = π × 3² = 9π square feet.",
        "r = 6 ÷ 2 = 3, así que A = π × 3² = 9π pies cuadrados.",
      ),
    },
  },

  "7:probability": {
    title: L(
      "Probability and measures of center",
      "Probabilidad y medidas de centro",
    ),
    concept: L(
      "The probability of an event is (favorable outcomes) ÷ (all equally likely outcomes), a number from 0 to 1. The mean, median and range describe a data set's center and spread.",
      "La probabilidad de un evento es (resultados favorables) ÷ (todos los resultados igualmente probables), un número de 0 a 1. La media, la mediana y el rango describen el centro y la dispersión de los datos.",
    ),
    reasons: [
      L(
        "The denominator counts EVERY outcome, winning and losing.",
        "El denominador cuenta TODOS los resultados, los que ganan y los que pierden.",
      ),
      L(
        "The median is the middle of the data in order.",
        "La mediana es el centro de los datos ordenados.",
      ),
      L(
        "The range is greatest − least: how wide the data spread.",
        "El rango es el mayor − el menor: qué tan dispersos están los datos.",
      ),
    ],
    misconception: L(
      "P(win) compares the winning sections with ALL sections, not with the losing ones.",
      "P(ganar) compara las secciones ganadoras con TODAS las secciones, no con las perdedoras.",
    ),
    misconceptions: [
      {
        id: "part-to-part",
        detect(item, raw) {
          if (!/P\(win\)/.test(item.question)) return false;
          const [w, t] = nums(item.question);
          const v = num(raw);
          return (
            !same(v, key(item)) &&
            (same(v, w / (t - w)) || same(v, (t - w) / t))
          );
        },
        feedback: L(
          "Probability is favorable outcomes out of ALL outcomes. Put the winning sections over the total number of sections.",
          "La probabilidad son los resultados favorables de TODOS los resultados. Pon las secciones ganadoras sobre el total de secciones.",
        ),
      },
      {
        id: "unsorted-median",
        detect(item, raw) {
          if (!/median/.test(item.question)) return false;
          const d = nums(item.question.split(":")[1]);
          const m = Math.floor(d.length / 2);
          const mid = d.length % 2 ? d[m] : (d[m - 1] + d[m]) / 2;
          const v = num(raw);
          return same(v, mid) && !same(v, key(item));
        },
        feedback: L(
          "Order the data from least to greatest before you find the middle value.",
          "Ordena los datos de menor a mayor antes de hallar el valor central.",
        ),
      },
      {
        id: "range-extreme",
        detect(item, raw) {
          if (!/range/.test(item.question)) return false;
          const d = nums(item.question.split(":")[1]);
          const v = num(raw);
          return same(v, Math.max(...d)) && !same(v, key(item));
        },
        feedback: L(
          "The range is the DIFFERENCE between the greatest and least values: subtract the least from the greatest.",
          "El rango es la DIFERENCIA entre el mayor y el menor valor: resta el menor del mayor.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A bag has 4 red, 6 blue and 10 green marbles. You pick one without looking. What is P(blue)? Write a fraction in simplest form.",
        "Una bolsa tiene 4 canicas rojas, 6 azules y 10 verdes. Sacas una sin mirar. ¿Cuál es P(azul)? Escribe una fracción simplificada.",
      ),
      answers: ["3/10"],
      kind: "fraction",
      hint: L(
        "How many marbles are there in all?",
        "¿Cuántas canicas hay en total?",
      ),
      explanation: L(
        "6 blue out of 4 + 6 + 10 = 20 marbles: 6/20 = 3/10.",
        "6 azules de 4 + 6 + 10 = 20 canicas: 6/20 = 3/10.",
      ),
    },
  },

  "7:like-terms": {
    concept: L(
      "Like terms have exactly the same variable part, such as 8x and −5x, or 6 and −4. Combining like terms adds their coefficients; each term keeps the sign in front of it.",
      "Los términos semejantes tienen exactamente la misma parte variable, como 8x y −5x, o 6 y −4. Combinar términos semejantes suma sus coeficientes; cada término conserva el signo que tiene delante.",
    ),
    reasons: [
      L(
        "8x − 5x is 8 x-tiles with 5 negative x-tiles: 5 zero pairs leave 3x.",
        "8x − 5x son 8 fichas x con 5 fichas x negativas: 5 pares cero dejan 3x.",
      ),
      L(
        "Subtraction is adding the opposite, so 8x + 6 − 5x − 4 = 8x + 6 + (−5x) + (−4) and terms can be rearranged.",
        "Restar es sumar el opuesto, así que 8x + 6 − 5x − 4 = 8x + 6 + (−5x) + (−4) y los términos se pueden reordenar.",
      ),
      L(
        "An x-term and a constant cannot join: x stands for an unknown amount.",
        "Un término con x y una constante no se juntan: x representa una cantidad desconocida.",
      ),
    ],
    misconception: L(
      "A minus sign belongs to the term right after it. In 8x + 6 − 5x − 4, the x-terms are 8x and −5x, and the constants are 6 and −4.",
      "Un signo menos pertenece al término que le sigue. En 8x + 6 − 5x − 4, los términos con x son 8x y −5x, y las constantes son 6 y −4.",
    ),
    living: likeTermsModel,
    misconceptions: [
      {
        id: "dropped-sign",
        detect(item, raw) {
          const m = clean(item.question).match(
            /: (\d*)x \+ (\d+) ([+-]) (\d*)x ([+-]) (\d+)/,
          );
          if (!m) return false;
          const [a, b, s1, c, s2, d] = [
            Number(m[1] || 1),
            Number(m[2]),
            m[3],
            Number(m[4] || 1),
            m[5],
            Number(m[6]),
          ];
          const got = linear(raw);
          const want = linear(item.answers[0]);
          if (!got || !want || (same(got.x, want.x) && same(got.c, want.c)))
            return false;
          const xs = s1 === "-" ? a + c : a - c;
          const cs = s2 === "-" ? b + d : b - d;
          return (
            (same(got.x, xs) && same(got.c, want.c)) ||
            (same(got.x, want.x) && same(got.c, cs))
          );
        },
        feedback: L(
          "One term lost its minus sign. Each sign belongs to the term after it: circle each term with its sign, then add the x-terms and add the constants.",
          "Un término perdió su signo menos. Cada signo pertenece al término que le sigue: encierra cada término con su signo y luego suma los términos con x y suma las constantes.",
        ),
      },
      {
        id: "unlike",
        detect(item, raw) {
          const got = linear(raw);
          const want = linear(item.answers[0]);
          return (
            Boolean(got && want) &&
            ((got.c === 0 && same(got.x, want.x + want.c)) ||
              (got.x === 0 && same(got.c, want.x + want.c))) &&
            want.c !== 0
          );
        },
        feedback: L(
          "An x-term and a constant are not like terms, so they cannot be added into one term. Your answer needs an x-term AND a constant.",
          "Un término con x y una constante no son semejantes, así que no se suman en un solo término. Tu respuesta necesita un término con x Y una constante.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A rectangle has sides of length 3x + 2 and x − 1. Its perimeter is 2(3x + 2) + 2(x − 1). Write the perimeter with like terms combined.",
        "Un rectángulo tiene lados de longitud 3x + 2 y x − 1. Su perímetro es 2(3x + 2) + 2(x − 1). Escribe el perímetro con los términos semejantes combinados.",
      ),
      answers: ["8x + 2", "2 + 8x"],
      kind: "text",
      hint: L(
        "Distribute, then combine x-terms and constants.",
        "Distribuye y luego combina los términos con x y las constantes.",
      ),
      explanation: L("6x + 4 + 2x − 2 = 8x + 2.", "6x + 4 + 2x − 2 = 8x + 2."),
    },
  },

  "7:circumference": {
    concept: L(
      "Every circle's circumference is a little more than 3 times its diameter; that ratio is π ≈ 3.14. So C = πd, and because d = 2r, also C = 2πr.",
      "La circunferencia de todo círculo es un poco más de 3 veces su diámetro; esa razón es π ≈ 3.14. Así que C = πd y, como d = 2r, también C = 2πr.",
    ),
    reasons: [
      L(
        "Roll a circle one full turn along a line: the distance is just over 3 diameters, for every circle.",
        "Haz rodar un círculo una vuelta completa sobre una recta: la distancia es poco más de 3 diámetros, para cualquier círculo.",
      ),
      L(
        "Because C ÷ d = π, dividing a circumference by π gives the diameter back.",
        "Como C ÷ d = π, dividir una circunferencia entre π devuelve el diámetro.",
      ),
      L(
        "The radius is half the diameter.",
        "El radio es la mitad del diámetro.",
      ),
    ],
    misconception: L(
      "Check which length you are given: C = π × d uses the diameter. With a radius, double it first (C = 2πr).",
      "Revisa qué longitud te dan: C = π × d usa el diámetro. Con un radio, duplícalo primero (C = 2πr).",
    ),
    living: circumferenceModel,
    misconceptions: [
      {
        id: "radius-diameter",
        detect(item, raw) {
          const q = clean(item.question);
          const [n] = nums(q.replace("3.14", ""));
          const v = num(raw);
          if (near(v, key(item), 0.006)) return false;
          if (/radius of/.test(q)) return near(v, r2(3.14 * n), 0.006);
          if (/diameter of/.test(q)) return near(v, r2(2 * 3.14 * n), 0.006);
          if (/its diameter/.test(q)) return near(v, r2(n / (2 * 3.14)), 0.006);
          if (/its radius/.test(q)) return near(v, r2(n / 3.14), 0.006);
          return false;
        },
        feedback: L(
          "You mixed up the radius and the diameter. The diameter goes all the way across (d = 2r); C = π × d.",
          "Confundiste el radio con el diámetro. El diámetro atraviesa todo el círculo (d = 2r); C = π × d.",
        ),
      },
      {
        id: "area",
        detect(item, raw) {
          const q = clean(item.question);
          if (!/What is its circumference/.test(q)) return false;
          const [n] = nums(q.replace("3.14", ""));
          const r = /radius of/.test(q) ? n : n / 2;
          const v = num(raw);
          return near(v, r2(3.14 * r * r), 0.006) && !near(v, key(item), 0.006);
        },
        feedback: L(
          "You used the area formula πr². Circumference is a LENGTH around the circle: C = π × d.",
          "Usaste la fórmula del área πr². La circunferencia es una LONGITUD alrededor del círculo: C = π × d.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A bicycle wheel has a diameter of 50 cm. How far does the bicycle move forward in one full turn of the wheel? Use 3.14 for π.",
        "Una rueda de bicicleta tiene un diámetro de 50 cm. ¿Cuánto avanza la bicicleta en una vuelta completa de la rueda? Usa 3.14 para π.",
      ),
      answers: ["157"],
      kind: "number",
      unit: L("cm", "cm"),
      hint: L(
        "One turn rolls out the whole circumference.",
        "Una vuelta desenrolla toda la circunferencia.",
      ),
      explanation: L("C = 3.14 × 50 = 157 cm.", "C = 3,14 × 50 = 157 cm."),
    },
  },

  "7:angle-facts": {
    title: L(
      "Angle facts: lines and triangles",
      "Datos de ángulos: rectas y triángulos",
    ),
    concept: L(
      "Angles that form a straight line add to 180°. When two lines cross, the angles directly across from each other (vertical angles) are equal. The three angles of any triangle add to 180°.",
      "Los ángulos que forman una recta suman 180°. Cuando dos rectas se cruzan, los ángulos opuestos (ángulos opuestos por el vértice) son iguales. Los tres ángulos de cualquier triángulo suman 180°.",
    ),
    reasons: [
      L(
        "A straight line is a half turn, and a full turn is 360°.",
        "Una recta es media vuelta, y una vuelta completa son 360°.",
      ),
      L(
        "Vertical angles are both supplementary to the same neighbor, so they must be equal.",
        "Los ángulos opuestos por el vértice son suplementarios del mismo vecino, así que deben ser iguales.",
      ),
      L(
        "Tear off a triangle's three corners and place them side by side: they form a straight line.",
        "Arranca las tres esquinas de un triángulo y ponlas lado a lado: forman una recta.",
      ),
    ],
    misconception: L(
      "A straight angle is 180°, not 90°. Use 90° only when the angles form a right angle.",
      "Un ángulo llano mide 180°, no 90°. Usa 90° solo cuando los ángulos forman un ángulo recto.",
    ),
    living: angleModel,
    misconceptions: [
      {
        id: "used-90",
        detect(item, raw) {
          if (!/straight line|next to it/.test(item.question)) return false;
          const [a] = nums(item.question);
          const v = num(raw);
          return same(v, 90 - a) && !same(v, key(item));
        },
        feedback: L(
          "Angles along a straight line add to 180°, not 90°. Subtract from 180°.",
          "Los ángulos sobre una recta suman 180°, no 90°. Resta de 180°.",
        ),
      },
      {
        id: "vertical-adjacent",
        detect(item, raw) {
          if (!/Two lines cross/.test(item.question)) return false;
          const [a] = nums(item.question);
          const v = num(raw);
          return !same(v, key(item)) && (same(v, a) || same(v, 180 - a));
        },
        feedback: L(
          "Look at where the angle sits. The angle directly ACROSS is equal to the given angle; an angle NEXT to it shares a straight line with it, so the two add to 180°.",
          "Fíjate dónde está el ángulo. El ángulo directamente OPUESTO es igual al dado; un ángulo VECINO comparte una recta con él, así que los dos suman 180°.",
        ),
      },
      {
        id: "used-360",
        detect(item, raw) {
          if (!/triangle/.test(item.question)) return false;
          const n = nums(item.question);
          const v = num(raw);
          if (/x°/.test(item.question)) {
            const parts = [...clean(item.question).matchAll(/(\d*)x°/g)].map(
              (m) => Number(m[1] || 1),
            );
            return (
              same(v, 360 / parts.reduce((s, p) => s + p, 0)) &&
              !same(v, key(item))
            );
          }
          return same(v, 360 - n[0] - n[1]) && !same(v, key(item));
        },
        feedback: L(
          "The angles of a triangle add to 180°, not 360° (360° is a full turn, the total for a quadrilateral).",
          "Los ángulos de un triángulo suman 180°, no 360° (360° es una vuelta completa, el total de un cuadrilátero).",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A ramp meets the flat ground at 28°. The ramp's support post is vertical, so it meets the ground at 90°. What is the angle, in degrees, at the top where the ramp meets the post?",
        "Una rampa toca el suelo plano a 28°. El poste de la rampa es vertical, así que toca el suelo a 90°. ¿Cuál es el ángulo, en grados, arriba donde la rampa toca el poste?",
      ),
      answers: ["62"],
      kind: "number",
      hint: L(
        "The ramp, post and ground make a triangle.",
        "La rampa, el poste y el suelo forman un triángulo.",
      ),
      explanation: L("180° − 90° − 28° = 62°.", "180° − 90° − 28° = 62°."),
    },
  },

  "7:sampling": {
    title: L(
      "Predict from a random sample",
      "Predecir a partir de una muestra aleatoria",
    ),
    concept: L(
      "A random sample is a smaller group chosen so every member of the population has the same chance of being picked. Its rate (like 24 out of 40) predicts the same rate in the whole population.",
      "Una muestra aleatoria es un grupo más pequeño elegido de modo que cada miembro de la población tenga la misma probabilidad de salir. Su tasa (como 24 de 40) predice la misma tasa en toda la población.",
    ),
    reasons: [
      L(
        "Random choice makes the sample likely to look like the population, so the fractions should match.",
        "La elección al azar hace que la muestra probablemente se parezca a la población, así que las fracciones deben coincidir.",
      ),
      L(
        "Write the sample rate as a fraction and scale it to the population: part/sample = ?/population.",
        "Escribe la tasa de la muestra como fracción y escálala a la población: parte/muestra = ?/población.",
      ),
      L(
        "A prediction is an estimate: a different random sample would give a slightly different answer.",
        "Una predicción es una estimación: otra muestra aleatoria daría una respuesta un poco distinta.",
      ),
    ],
    misconception: L(
      "Do not add the extra people to the count. The population has the same FRACTION as the sample, so multiply the population by the sample fraction.",
      "No sumes las personas extra al conteo. La población tiene la misma FRACCIÓN que la muestra, así que multiplica la población por la fracción de la muestra.",
    ),
    living: samplingModel,
    misconceptions: [
      {
        id: "additive",
        detect(item, raw) {
          const [n, k, N] = nums(item.question);
          const v = num(raw);
          return same(v, k + (N - n)) && !same(v, key(item));
        },
        feedback: L(
          "You added the extra people to the count, as if all of them answered yes. Only the same FRACTION of them would: multiply the population by the sample's fraction.",
          "Sumaste las personas extra al conteo, como si todas respondieran que sí. Solo lo haría la misma FRACCIÓN: multiplica la población por la fracción de la muestra.",
        ),
      },
      {
        id: "count-as-percent",
        detect(item, raw) {
          const [, k, N] = nums(item.question);
          const v = num(raw);
          return same(v, (k * N) / 100) && !same(v, key(item));
        },
        feedback: L(
          "You treated the count as a percent. The sample fraction is the count out of the SAMPLE size, not out of 100.",
          "Trataste el conteo como un porcentaje. La fracción de la muestra es el conteo sobre el tamaño de la MUESTRA, no sobre 100.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A park ranger tags fish. In a random net of 30 fish, 6 are trout. The lake has about 900 fish. About how many trout are in the lake?",
        "Un guardabosques marca peces. En una red aleatoria de 30 peces, 6 son truchas. El lago tiene unos 900 peces. ¿Aproximadamente cuántas truchas hay en el lago?",
      ),
      answers: ["180"],
      kind: "number",
      hint: L(
        "What fraction of the net were trout?",
        "¿Qué fracción de la red eran truchas?",
      ),
      explanation: L(
        "6/30 = 1/5, and 1/5 of 900 = 180 trout.",
        "6/30 = 1/5, y 1/5 de 900 = 180 truchas.",
      ),
    },
  },
};
