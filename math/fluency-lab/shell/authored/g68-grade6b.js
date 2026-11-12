// Grade 6, part 2: expressions, equations, the number line and area. Schema: ../SCHEMA.md.
import { L, clean, key, num, nums, point, same, samePoint } from "./kit-68.js";
import { balanceModel } from "./living-68-algebra.js";
import { triangleAreaModel } from "./living-68-geometry.js";
import { orderModel } from "./living-68-number.js";

export const G6B = {
  "6:evaluate": {
    concept: L(
      "To evaluate an expression, replace each variable with its value and compute, following the order of operations: parentheses first, then multiplication and division, then addition and subtraction, left to right.",
      "Para evaluar una expresión, reemplaza cada variable por su valor y calcula siguiendo el orden de las operaciones: primero los paréntesis, luego multiplicación y división, y por último suma y resta, de izquierda a derecha.",
    ),
    reasons: [
      L(
        "The order of operations is an agreement, so everyone gets the same value from the same expression.",
        "El orden de las operaciones es un acuerdo, para que todos obtengan el mismo valor de la misma expresión.",
      ),
      L(
        "3x means 3 × x. When x = 4, 3x is 3 × 4, not the digits 3 and 4 written side by side.",
        "3x significa 3 × x. Cuando x = 4, 3x es 3 × 4, no las cifras 3 y 4 escritas juntas.",
      ),
      L(
        "Parentheses group a sum so it is computed first and then used as one number.",
        "Los paréntesis agrupan una suma para calcularla primero y usarla como un solo número.",
      ),
    ],
    misconception: L(
      "Working strictly left to right gives the wrong value when a multiplication comes after an addition. Multiply before you add unless parentheses say otherwise.",
      "Trabajar solo de izquierda a derecha da un valor equivocado cuando una multiplicación va después de una suma. Multiplica antes de sumar, salvo que los paréntesis indiquen otra cosa.",
    ),
    misconceptions: [
      {
        id: "left-to-right",
        detect(item, raw) {
          const m = clean(item.question).match(/^(\d+) \+ (\d+) × (\d+) =/);
          if (!m) return false;
          const [a, b, c] = m.slice(1).map(Number);
          const v = num(raw);
          return same(v, (a + b) * c) && !same(v, key(item));
        },
        feedback: L(
          "You added first, then multiplied. Multiplication comes before addition: find the product first, then add.",
          "Sumaste primero y luego multiplicaste. La multiplicación va antes que la suma: halla primero el producto y luego suma.",
        ),
      },
      {
        id: "ignored-parentheses",
        detect(item, raw) {
          const m = clean(item.question).match(/^\((\d+) \+ (\d+)\) × (\d+) =/);
          if (!m) return false;
          const [a, b, c] = m.slice(1).map(Number);
          const v = num(raw);
          return same(v, a + b * c) && !same(v, key(item));
        },
        feedback: L(
          "The parentheses make the sum one number. Add inside the parentheses first, then multiply that sum.",
          "Los paréntesis convierten la suma en un solo número. Suma primero dentro de los paréntesis y luego multiplica esa suma.",
        ),
      },
      {
        id: "juxtaposed",
        detect(item, raw) {
          const m = clean(item.question).match(
            /Evaluate (\d+)x ([+-]) (\d+) when x = (\d+)/,
          );
          if (!m) return false;
          const [a, op, k, x] = [
            Number(m[1]),
            m[2],
            Number(m[3]),
            Number(m[4]),
          ];
          const glued = Number(`${a}${x}`);
          const v = num(raw);
          const r = (t) => (op === "+" ? t + k : t - k);
          return (
            !same(v, key(item)) && (same(v, r(glued)) || same(v, r(a + x)))
          );
        },
        feedback: L(
          "A number next to a variable means multiply: 6x means 6 × x. Replace x with its value, multiply, then add or subtract.",
          "Un número junto a una variable significa multiplicar: 6x significa 6 × x. Reemplaza x por su valor, multiplica y luego suma o resta.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A taxi charges $3 to start plus $2 for each mile, so a trip of m miles costs 3 + 2m dollars. How much does a 7-mile trip cost, in dollars?",
        "Un taxi cobra $3 al empezar más $2 por cada milla, así que un viaje de m millas cuesta 3 + 2m dólares. ¿Cuánto cuesta un viaje de 7 millas, en dólares?",
      ),
      answers: ["17"],
      kind: "number",
      hint: L(
        "2m means 2 × m. Multiply before you add.",
        "2m significa 2 × m. Multiplica antes de sumar.",
      ),
      explanation: L(
        "3 + 2 × 7 = 3 + 14 = 17 dollars.",
        "3 + 2 × 7 = 3 + 14 = 17 dólares.",
      ),
    },
  },

  "6:one-step": {
    concept: L(
      "An equation says two expressions are equal, like a balanced scale. To solve it, undo the operation on x by doing the inverse operation to BOTH sides, so the scale stays balanced.",
      "Una ecuación dice que dos expresiones son iguales, como una balanza en equilibrio. Para resolverla, deshaz la operación sobre x haciendo la operación inversa en LOS DOS lados, para que la balanza siga en equilibrio.",
    ),
    reasons: [
      L(
        "Addition and subtraction undo each other; multiplication and division undo each other.",
        "La suma y la resta se deshacen mutuamente; la multiplicación y la división también.",
      ),
      L(
        "Changing both sides by the same amount keeps them equal, so the new equation has the same solution.",
        "Cambiar los dos lados en la misma cantidad los mantiene iguales, así que la nueva ecuación tiene la misma solución.",
      ),
      L(
        "Check by substituting: the value must make the original equation true.",
        "Comprueba sustituyendo: el valor debe hacer verdadera la ecuación original.",
      ),
    ],
    misconception: L(
      "Doing the SAME operation that is in the equation (adding when it says + 4) moves x further away. Use the inverse operation, and do it to both sides.",
      "Hacer la MISMA operación que aparece en la ecuación (sumar cuando dice + 4) aleja más a x. Usa la operación inversa y hazla en los dos lados.",
    ),
    living: balanceModel,
    misconceptions: [
      {
        id: "same-operation",
        detect(item, raw) {
          const q = clean(item.question);
          const v = num(raw);
          if (same(v, key(item))) return false;
          let m = q.match(/^x \+ (\d+) = (\d+)/);
          if (m) return same(v, Number(m[1]) + Number(m[2]));
          m = q.match(/^x - (\d+) = (\d+)/);
          if (m) return same(v, Number(m[2]) - Number(m[1]));
          m = q.match(/^(\d+)x = (\d+)/);
          if (m) return same(v, Number(m[1]) * Number(m[2]));
          m = q.match(/^x ÷ (\d+) = (\d+)/);
          if (m) return same(v, Number(m[2]) / Number(m[1]));
          return false;
        },
        feedback: L(
          "You used the same operation that is already on x. To get x alone, UNDO it: subtraction undoes addition, division undoes multiplication. Then substitute your answer to check.",
          "Usaste la misma operación que ya tiene x. Para dejar x sola, DESHAZLA: la resta deshace la suma y la división deshace la multiplicación. Luego sustituye tu respuesta para comprobar.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "After spending $14, Leo has $23 left. Write an equation for x, the dollars Leo started with, and solve it. How many dollars did Leo start with?",
        "Después de gastar $14, a Leo le quedan $23. Escribe una ecuación para x, los dólares que tenía Leo al principio, y resuélvela. ¿Con cuántos dólares empezó Leo?",
      ),
      answers: ["37"],
      kind: "number",
      hint: L(
        "Spending took money away, so the start amount minus 14 is 23.",
        "Gastar quitó dinero, así que la cantidad inicial menos 14 es 23.",
      ),
      explanation: L(
        "x − 14 = 23, so add 14 to both sides: x = 37. Check: 37 − 14 = 23.",
        "x − 14 = 23; suma 14 en los dos lados: x = 37. Comprueba: 37 − 14 = 23.",
      ),
    },
  },

  "6:integers": {
    title: L(
      "Absolute value and the coordinate plane",
      "Valor absoluto y el plano de coordenadas",
    ),
    concept: L(
      "The absolute value of a number is its distance from 0, so it is never negative. On the coordinate plane, the signs of (x, y) tell which side of each axis a point is on, and distance to an axis is an absolute value.",
      "El valor absoluto de un número es su distancia al 0, así que nunca es negativo. En el plano de coordenadas, los signos de (x, y) indican de qué lado de cada eje está un punto, y la distancia a un eje es un valor absoluto.",
    ),
    reasons: [
      L(
        "−7 and 7 are the same distance from 0, so they have the same absolute value: |−7| and |7| are both seven.",
        "−7 y 7 están a la misma distancia del 0, así que tienen el mismo valor absoluto: |−7| y |7| valen siete.",
      ),
      L(
        "Reflecting across the x-axis keeps x and changes the sign of y; across the y-axis keeps y and changes the sign of x.",
        "Reflejar sobre el eje x mantiene x y cambia el signo de y; sobre el eje y mantiene y y cambia el signo de x.",
      ),
      L(
        "Two points on the same vertical line on opposite sides of the x-axis are |y₁| + |y₂| apart.",
        "Dos puntos en la misma recta vertical a lados opuestos del eje x están a |y₁| + |y₂| de distancia.",
      ),
    ],
    misconception: L(
      "The axis you reflect across is the one that stays the same. Reflecting across the x-axis flips the point up or down, so only y changes sign.",
      "El eje sobre el que reflejas es el que se queda igual. Reflejar sobre el eje x voltea el punto hacia arriba o hacia abajo, así que solo cambia el signo de y.",
    ),
    misconceptions: [
      {
        id: "wrong-axis",
        detect(item, raw) {
          const m = clean(item.question).match(
            /Reflect \((-?\d+), (-?\d+)\) across the ([xy])-axis/,
          );
          if (!m) return false;
          const [x, y] = [Number(m[1]), Number(m[2])];
          const p = point(raw);
          const right = m[3] === "x" ? [x, -y] : [-x, y];
          const wrong = m[3] === "x" ? [-x, y] : [x, -y];
          return samePoint(p, ...wrong) && !samePoint(p, ...right);
        },
        feedback: L(
          "You changed the other coordinate. A reflection across the x-axis flips the point over that horizontal line: x stays, y changes sign. Across the y-axis: y stays, x changes sign.",
          "Cambiaste la otra coordenada. Una reflexión sobre el eje x voltea el punto sobre esa recta horizontal: x se queda y y cambia de signo. Sobre el eje y: y se queda y x cambia de signo.",
        ),
      },
      {
        id: "subtracted-across-axis",
        detect(item, raw) {
          const m = clean(item.question).match(
            /distance between \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)/,
          );
          if (!m) return false;
          const [x1, y1, x2, y2] = m.slice(1).map(Number);
          const [a, b] = x1 === x2 ? [y1, y2] : [x1, x2];
          const v = num(raw);
          return (
            a * b < 0 &&
            same(v, Math.abs(Math.abs(a) - Math.abs(b))) &&
            !same(v, key(item))
          );
        },
        feedback: L(
          "The points are on opposite sides of the axis, so the distances to the axis ADD: count from one point to the axis, then from the axis to the other point.",
          "Los puntos están a lados opuestos del eje, así que las distancias al eje se SUMAN: cuenta de un punto al eje y luego del eje al otro punto.",
        ),
      },
      {
        id: "negative-absolute",
        detect(item, raw) {
          if (!/^\|/.test(item.question)) return false;
          const v = num(raw);
          return v < 0 && same(v, -key(item));
        },
        feedback: L(
          "Absolute value is a distance, and a distance is never negative.",
          "El valor absoluto es una distancia, y una distancia nunca es negativa.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "On a map grid, the library is at (−4, 6) and the school is at (−4, −3). Each unit is one block. How many blocks apart are they?",
        "En la cuadrícula de un mapa, la biblioteca está en (−4, 6) y la escuela en (−4, −3). Cada unidad es una cuadra. ¿A cuántas cuadras de distancia están?",
      ),
      answers: ["9"],
      kind: "number",
      hint: L(
        "How far is each place from the x-axis?",
        "¿A qué distancia está cada lugar del eje x?",
      ),
      explanation: L(
        "Same x, so measure vertically: |6| + |−3| = 6 + 3 = 9 blocks, because they are on opposite sides of the x-axis.",
        "La misma x, así que se mide en vertical: |6| + |−3| = 6 + 3 = 9 cuadras, porque están a lados opuestos del eje x.",
      ),
    },
  },

  "6:triangle-area": {
    title: L("Area of triangles", "Área de triángulos"),
    concept: L(
      "A triangle is exactly half of a parallelogram with the same base and height, so its area is A = ½ × base × height. The height is measured at a right angle to the base.",
      "Un triángulo es exactamente la mitad de un paralelogramo con la misma base y altura, así que su área es A = ½ × base × altura. La altura se mide en ángulo recto con la base.",
    ),
    reasons: [
      L(
        "Two copies of the same triangle fit together into a parallelogram whose area is base × height.",
        "Dos copias del mismo triángulo forman un paralelogramo cuya área es base × altura.",
      ),
      L(
        "Sliding the top vertex sideways changes the shape but not the base or height, so the area stays the same.",
        "Mover el vértice superior hacia un lado cambia la forma pero no la base ni la altura, así que el área no cambia.",
      ),
      L(
        "Area is measured in square units.",
        "El área se mide en unidades cuadradas.",
      ),
    ],
    misconception: L(
      "base × height is the area of the whole parallelogram (or rectangle). The triangle is half of it.",
      "base × altura es el área del paralelogramo (o rectángulo) completo. El triángulo es la mitad.",
    ),
    living: triangleAreaModel,
    misconceptions: [
      {
        id: "forgot-half",
        detect(item, raw) {
          const [b, h] = nums(item.question);
          const v = num(raw);
          return same(v, b * h) && !same(v, key(item));
        },
        feedback: L(
          "You found base × height: the area of the rectangle around the triangle. The triangle fills exactly half of that rectangle.",
          "Hallaste base × altura: el área del rectángulo que rodea al triángulo. El triángulo ocupa exactamente la mitad de ese rectángulo.",
        ),
      },
      {
        id: "added",
        detect(item, raw) {
          const [b, h] = nums(item.question);
          const v = num(raw);
          return (
            !same(v, key(item)) && (same(v, b + h) || same(v, (b + h) / 2))
          );
        },
        feedback: L(
          "Area counts square units, so the base and height are multiplied, not added. Then take half.",
          "El área cuenta unidades cuadradas, así que la base y la altura se multiplican, no se suman. Luego toma la mitad.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A triangular sail has a base of 6 meters and a height of 9 meters. How many square meters of cloth does it use?",
        "Una vela triangular tiene una base de 6 metros y una altura de 9 metros. ¿Cuántos metros cuadrados de tela usa?",
      ),
      answers: ["27"],
      kind: "number",
      unit: L("square meters", "metros cuadrados"),
      hint: L(
        "Picture the rectangle around the sail.",
        "Imagina el rectángulo alrededor de la vela.",
      ),
      explanation: L(
        "½ × 6 × 9 = ½ × 54 = 27 square meters.",
        "½ × 6 × 9 = ½ × 54 = 27 metros cuadrados.",
      ),
    },
  },

  "6:multi-digit-division": {
    concept: L(
      "Long division shares a large number into equal groups one place value at a time: divide, multiply, subtract, bring down the next digit. Each digit of the quotient tells how many groups at that place.",
      "La división larga reparte un número grande en grupos iguales, un valor posicional a la vez: divide, multiplica, resta y baja la siguiente cifra. Cada cifra del cociente dice cuántos grupos hay en ese lugar.",
    ),
    reasons: [
      L(
        "Estimating first (24,000 ÷ 40 is about 600) tells you how many digits the quotient has.",
        "Estimar primero (24 000 ÷ 40 es unos 600) te dice cuántas cifras tiene el cociente.",
      ),
      L(
        "When the divisor does not fit into the current part, the quotient gets a 0 in that place: it holds the place value.",
        "Cuando el divisor no cabe en la parte actual, el cociente lleva un 0 en ese lugar: mantiene el valor posicional.",
      ),
      L(
        "Check: quotient × divisor + remainder = dividend.",
        "Comprueba: cociente × divisor + residuo = dividendo.",
      ),
    ],
    misconception: L(
      "Skipping a 0 in the quotient makes it 10 times too small. Compare with your estimate: the number of digits should match.",
      "Saltarse un 0 en el cociente lo hace 10 veces demasiado pequeño. Compara con tu estimación: el número de cifras debe coincidir.",
    ),
    misconceptions: [
      {
        id: "lost-zero",
        detect(item, raw) {
          const v = num(raw);
          const k = key(item);
          if (same(v, k) || !Number.isInteger(v) || v <= 0) return false;
          const ks = String(k);
          return (
            ks.includes("0") &&
            [...ks].some(
              (_, i) =>
                ks[i] === "0" && Number(ks.slice(0, i) + ks.slice(i + 1)) === v,
            )
          );
        },
        feedback: L(
          "A 0 is missing from your quotient. When the divisor does not fit into a place, write 0 there before bringing down the next digit. Your estimate shows how many digits the answer needs.",
          "Falta un 0 en tu cociente. Cuando el divisor no cabe en un lugar, escribe 0 ahí antes de bajar la siguiente cifra. Tu estimación muestra cuántas cifras necesita la respuesta.",
        ),
      },
      {
        id: "gave-remainder",
        detect(item, raw) {
          if (!/remainder/.test(item.question)) return false;
          const [n, d] = nums(item.question);
          const v = num(raw);
          return same(v, n % d) && !same(v, key(item));
        },
        feedback: L(
          "That is the remainder, what is left over. The question asks for the whole-number quotient: how many full groups.",
          "Ese es el residuo, lo que sobra. La pregunta pide el cociente entero: cuántos grupos completos.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A stadium has 9,672 seats in 24 equal sections. How many seats are in each section?",
        "Un estadio tiene 9672 asientos en 24 secciones iguales. ¿Cuántos asientos hay en cada sección?",
      ),
      answers: ["403"],
      kind: "number",
      hint: L("Estimate: about 10,000 ÷ 25.", "Estima: unos 10 000 ÷ 25."),
      explanation: L(
        "96 ÷ 24 = 4, then 7 ÷ 24 = 0 (write 0), then 72 ÷ 24 = 3: 403. Check: 403 × 24 = 9,672.",
        "96 ÷ 24 = 4, luego 7 ÷ 24 = 0 (escribe 0) y 72 ÷ 24 = 3: 403. Comprueba: 403 × 24 = 9672.",
      ),
    },
  },

  "6:order-rational": {
    title: L("Order rational numbers", "Ordenar números racionales"),
    concept: L(
      "On a number line, numbers increase from left to right. A negative number with a larger absolute value is farther left, so it is LESS: −1 < −3/4.",
      "En la recta numérica, los números aumentan de izquierda a derecha. Un número negativo con mayor valor absoluto está más a la izquierda, así que es MENOR: −1 < −3/4.",
    ),
    reasons: [
      L(
        "Every negative number is less than every positive number.",
        "Todo número negativo es menor que todo número positivo.",
      ),
      L(
        "Writing fractions and decimals in one form (all decimals) lets you compare them digit by digit.",
        "Escribir fracciones y decimales en una sola forma (todo en decimales) permite compararlos cifra por cifra.",
      ),
      L(
        "Among negatives, the order is the reverse of the order of their absolute values.",
        "Entre los negativos, el orden es el contrario del orden de sus valores absolutos.",
      ),
    ],
    misconception: L(
      "Ordering negatives by their size without the sign puts them backwards. −3/4 is closer to 0 than −1, so −3/4 is the greater number.",
      "Ordenar los negativos por su tamaño sin el signo los deja al revés. −3/4 está más cerca de 0 que −1, así que −3/4 es el número mayor.",
    ),
    living: orderModel,
    misconceptions: [
      {
        id: "negatives-reversed",
        detect(item, raw) {
          const got = String(raw)
            .split(/[,;]/)
            .map((t) => num(t))
            .filter(Number.isFinite);
          const want = String(item.answers[0])
            .split(",")
            .map((t) => num(t));
          if (
            got.length !== want.length ||
            got.every((g, i) => same(g, want[i]))
          )
            return false;
          const neg = want.filter((v) => v < 0).reverse();
          const flipped = [...neg, ...want.filter((v) => v >= 0)];
          const byAbs = [...want].sort((a, b) => Math.abs(a) - Math.abs(b));
          return [flipped, byAbs].some((w) =>
            w.every((v, i) => same(v, got[i])),
          );
        },
        feedback: L(
          "You ordered the negative numbers by their size without the sign. On the number line, the negative number farther from 0 is farther LEFT, so it is the smaller one.",
          "Ordenaste los números negativos por su tamaño sin el signo. En la recta numérica, el negativo más lejos del 0 está más a la IZQUIERDA, así que es el menor.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "Four divers are at −2.5 m, −3/4 m, −1 1/2 m and 0.5 m relative to the surface. List the depths from least to greatest.",
        "Cuatro buzos están a −2.5 m, −3/4 m, −1 1/2 m y 0.5 m respecto a la superficie. Ordena las alturas de menor a mayor.",
      ),
      answers: ["−2.5, −1 1/2, −3/4, 0.5"],
      kind: "order",
      hint: L(
        "Place each number on a number line.",
        "Coloca cada número en una recta numérica.",
      ),
      explanation: L(
        "−2.5 < −1.5 < −0.75 < 0.5: the deepest diver has the least value.",
        "−2,5 < −1,5 < −0,75 < 0,5: el buzo más profundo tiene el menor valor.",
      ),
    },
  },
};
