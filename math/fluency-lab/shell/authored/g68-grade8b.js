// Grade 8, part 2: angle relationships, the Pythagorean theorem, association and reflections. Schema: ../SCHEMA.md.
import { L, clean, key, num, nums, point, same, samePoint } from "./kit-68.js";

export const G8B = {
  "8:angle-relations": {
    title: L("Angle relationships", "Relaciones entre ángulos"),
    concept: L(
      "Complementary angles add to 90°, supplementary angles add to 180°, and vertical angles, across from each other where two lines cross, are equal.",
      "Los ángulos complementarios suman 90°, los suplementarios suman 180° y los ángulos opuestos por el vértice, uno frente al otro donde se cruzan dos rectas, son iguales.",
    ),
    reasons: [
      L(
        "Two complementary angles together make a right angle (a quarter turn).",
        "Dos ángulos complementarios juntos forman un ángulo recto (un cuarto de vuelta).",
      ),
      L(
        "Two supplementary angles together make a straight angle (a half turn).",
        "Dos ángulos suplementarios juntos forman un ángulo llano (media vuelta).",
      ),
      L(
        "Vertical angles share the same supplementary neighbor, so they are equal.",
        "Los ángulos opuestos por el vértice comparten el mismo vecino suplementario, así que son iguales.",
      ),
    ],
    misconception: L(
      "Complementary → 90°, supplementary → 180°. Memory aid: “C” comes before “S”, and 90 comes before 180.",
      "Complementario → 90°, suplementario → 180°. Truco: la «C» va antes que la «S», y 90 va antes que 180.",
    ),
    misconceptions: [
      {
        id: "swapped-totals",
        detect(item, raw) {
          const [a] = nums(item.question);
          const v = num(raw);
          if (same(v, key(item))) return false;
          if (/complementary/.test(item.question)) return same(v, 180 - a);
          if (/supplementary/.test(item.question)) return same(v, 90 - a);
          return false;
        },
        feedback: L(
          "You used the other total. Complementary angles add to 90°; supplementary angles add to 180°.",
          "Usaste el otro total. Los ángulos complementarios suman 90°; los suplementarios suman 180°.",
        ),
      },
      {
        id: "vertical-supplement",
        detect(item, raw) {
          if (!/vertical/.test(item.question)) return false;
          const [a] = nums(item.question);
          const v = num(raw);
          return same(v, 180 - a) && !same(v, key(item));
        },
        feedback: L(
          "Vertical angles are across from each other, and they are EQUAL. Supplementary angles are the ones side by side on a line.",
          "Los ángulos opuestos por el vértice están uno frente al otro y son IGUALES. Los suplementarios son los que están lado a lado sobre una recta.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A ladder leans against a wall and makes a 68° angle with the ground. The wall meets the ground at a right angle. What angle, in degrees, does the ladder make with the wall?",
        "Una escalera se apoya en una pared y forma un ángulo de 68° con el suelo. La pared toca el suelo en ángulo recto. ¿Qué ángulo, en grados, forma la escalera con la pared?",
      ),
      answers: ["22"],
      kind: "number",
      hint: L(
        "The two acute angles of a right triangle are complementary.",
        "Los dos ángulos agudos de un triángulo rectángulo son complementarios.",
      ),
      explanation: L("90° − 68° = 22°.", "90° − 68° = 22°."),
    },
  },

  "8:pythagorean": {
    title: L("The Pythagorean theorem", "El teorema de Pitágoras"),
    concept: L(
      "In a right triangle, the squares on the two legs together have the same area as the square on the hypotenuse: a² + b² = c². The hypotenuse is the side across from the right angle, and it is the longest side.",
      "En un triángulo rectángulo, los cuadrados sobre los dos catetos juntos tienen la misma área que el cuadrado sobre la hipotenusa: a² + b² = c². La hipotenusa es el lado opuesto al ángulo recto y es el lado más largo.",
    ),
    reasons: [
      L(
        "With legs 3 and 4, the squares have areas 9 and 16; together 25, the area of a 5-by-5 square.",
        "Con catetos 3 y 4, los cuadrados tienen áreas 9 y 16; juntos 25, el área de un cuadrado de 5 por 5.",
      ),
      L(
        "After adding the squares, take the square root to get back to a LENGTH.",
        "Después de sumar los cuadrados, saca la raíz cuadrada para volver a una LONGITUD.",
      ),
      L(
        "The hypotenuse is longer than either leg but shorter than the two legs added.",
        "La hipotenusa es más larga que cada cateto pero más corta que los dos catetos sumados.",
      ),
    ],
    misconception: L(
      "c ≠ a + b. Square each leg, add the squares, and then take the square root.",
      "c ≠ a + b. Eleva al cuadrado cada cateto, suma los cuadrados y luego saca la raíz cuadrada.",
    ),
    misconceptions: [
      {
        id: "added-legs",
        detect(item, raw) {
          const [a, b] = nums(item.question);
          const v = num(raw);
          return same(v, a + b) && !same(v, key(item));
        },
        feedback: L(
          "Adding the legs gives a path that bends at the corner, which is longer than the straight hypotenuse. Add the SQUARES of the legs, then take the square root.",
          "Sumar los catetos da un camino que dobla en la esquina, más largo que la hipotenusa recta. Suma los CUADRADOS de los catetos y luego saca la raíz cuadrada.",
        ),
      },
      {
        id: "no-root",
        detect(item, raw) {
          const [a, b] = nums(item.question);
          const v = num(raw);
          return same(v, a * a + b * b) && !same(v, key(item));
        },
        feedback: L(
          "That is c², an AREA. The hypotenuse is a length: take the square root of your sum.",
          "Eso es c², un ÁREA. La hipotenusa es una longitud: saca la raíz cuadrada de tu suma.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A TV screen is 24 inches tall and 32 inches wide. How long is its diagonal, in inches?",
        "La pantalla de un televisor mide 24 pulgadas de alto y 32 de ancho. ¿Cuánto mide su diagonal, en pulgadas?",
      ),
      answers: ["40"],
      kind: "number",
      hint: L(
        "The height and width are the legs of a right triangle.",
        "El alto y el ancho son los catetos de un triángulo rectángulo.",
      ),
      explanation: L(
        "24² + 32² = 576 + 1,024 = 1,600, and √1,600 = 40 inches.",
        "24² + 32² = 576 + 1024 = 1600, y √1600 = 40 pulgadas.",
      ),
    },
  },

  "8:association": {
    title: L(
      "Identify association in data",
      "Identificar asociación en los datos",
    ),
    concept: L(
      "Two quantities have a positive association when y tends to increase as x increases, a negative association when y tends to decrease, and no association when there is no overall trend.",
      "Dos cantidades tienen asociación positiva cuando y tiende a aumentar al aumentar x, asociación negativa cuando y tiende a disminuir, y ninguna asociación cuando no hay una tendencia general.",
    ),
    reasons: [
      L(
        "Read the data from left to right, in order of increasing x.",
        "Lee los datos de izquierda a derecha, en orden de x creciente.",
      ),
      L(
        "A trend is overall: one value that breaks the pattern does not erase a clear trend.",
        "Una tendencia es general: un valor que rompe el patrón no borra una tendencia clara.",
      ),
      L(
        "If y goes up and down with no direction, there is no association.",
        "Si y sube y baja sin dirección, no hay asociación.",
      ),
    ],
    misconception: L(
      "“Negative” describes the direction (y falls as x rises), not negative numbers. All the values can be positive in a negative association.",
      "«Negativa» describe la dirección (y baja al subir x), no números negativos. Todos los valores pueden ser positivos en una asociación negativa.",
    ),
    misconceptions: [
      {
        id: "direction",
        detect(item, raw) {
          const ans = clean(raw).toLowerCase();
          const want = item.answers[0];
          return (
            (want === "positive" && ans === "negative") ||
            (want === "negative" && ans === "positive")
          );
        },
        feedback: L(
          "Read the y-values in the order of increasing x. If they climb, the association is positive; if they fall, it is negative.",
          "Lee los valores de y en el orden de x creciente. Si suben, la asociación es positiva; si bajan, es negativa.",
        ),
      },
      {
        id: "trend-in-noise",
        detect(item, raw) {
          return (
            item.answers[0] === "none" &&
            /^(positive|negative)$/.test(clean(raw).toLowerCase())
          );
        },
        feedback: L(
          "Compare the first and last values AND the ones in between. These y-values go up and down with no overall direction, so there is no association.",
          "Compara el primer y el último valor Y también los de en medio. Estos valores de y suben y bajan sin una dirección general, así que no hay asociación.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "As the outside temperature rises from 50 °F to 90 °F, a café sells fewer hot drinks each day: 120, 104, 85, 70, 52. Which association describes temperature and hot-drink sales: positive, negative, or none?",
        "Al subir la temperatura exterior de 50 °F a 90 °F, un café vende menos bebidas calientes cada día: 120, 104, 85, 70, 52. ¿Qué asociación describe la temperatura y las ventas de bebidas calientes: positiva (positive), negativa (negative) o ninguna (none)?",
      ),
      answers: ["negative"],
      kind: "text",
      hint: L("As x goes up, what does y do?", "Cuando x sube, ¿qué hace y?"),
      explanation: L(
        "Sales fall as temperature rises: a negative association.",
        "Las ventas bajan al subir la temperatura: una asociación negativa.",
      ),
    },
  },

  "8:transformations": {
    title: L(
      "Reflections on the coordinate plane",
      "Reflexiones en el plano de coordenadas",
    ),
    concept: L(
      "A reflection flips a figure over a line like a mirror. Across the x-axis, (x, y) → (x, −y); across the y-axis, (x, y) → (−x, y); through the origin, both signs change: (x, y) → (−x, −y).",
      "Una reflexión voltea una figura sobre una recta como un espejo. Sobre el eje x, (x, y) → (x, −y); sobre el eje y, (x, y) → (−x, y); por el origen, cambian los dos signos: (x, y) → (−x, −y).",
    ),
    reasons: [
      L(
        "The mirror line does not move, so the coordinate measured along it stays the same.",
        "La recta espejo no se mueve, así que la coordenada medida a lo largo de ella queda igual.",
      ),
      L(
        "The image is the same distance from the mirror line, on the other side.",
        "La imagen queda a la misma distancia de la recta espejo, del otro lado.",
      ),
      L(
        "A reflection through the origin is the same as a 180° rotation.",
        "Una reflexión por el origen es lo mismo que una rotación de 180°.",
      ),
    ],
    misconception: L(
      "Reflecting across the x-axis changes y, not x: the point flips up or down over the horizontal axis.",
      "Reflejar sobre el eje x cambia y, no x: el punto se voltea hacia arriba o abajo sobre el eje horizontal.",
    ),
    misconceptions: [
      {
        id: "wrong-axis",
        detect(item, raw) {
          const m = clean(item.question).match(
            /Reflect \((-?\d+), (-?\d+)\) across the (x-axis|y-axis|origin)/,
          );
          if (!m) return false;
          const [x, y] = [Number(m[1]), Number(m[2])];
          const p = point(raw);
          const right = {
            "x-axis": [x, -y],
            "y-axis": [-x, y],
            origin: [-x, -y],
          }[m[3]];
          if (!p || samePoint(p, ...right)) return false;
          const others = {
            "x-axis": [[-x, y]],
            "y-axis": [[x, -y]],
            origin: [
              [-x, y],
              [x, -y],
            ],
          }[m[3]];
          return others.some((o) => samePoint(p, ...o));
        },
        feedback: L(
          "The coordinate along the mirror line stays; the other one changes sign. Across the x-axis only y changes; across the y-axis only x changes; through the origin BOTH change.",
          "La coordenada a lo largo de la recta espejo se queda; la otra cambia de signo. Sobre el eje x solo cambia y; sobre el eje y solo cambia x; por el origen cambian LAS DOS.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A logo has a corner at (3, −5). The designer reflects it across the y-axis. Where is that corner now? Write (x, y).",
        "Un logotipo tiene una esquina en (3, −5). La diseñadora lo refleja sobre el eje y. ¿Dónde queda esa esquina? Escribe (x, y).",
      ),
      answers: ["(-3,-5)"],
      kind: "text",
      hint: L(
        "Which coordinate measures distance from the y-axis?",
        "¿Qué coordenada mide la distancia al eje y?",
      ),
      explanation: L(
        "Across the y-axis, x changes sign: (−3, −5).",
        "Sobre el eje y, x cambia de signo: (−3, −5).",
      ),
    },
  },
};
