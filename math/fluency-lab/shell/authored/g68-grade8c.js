// Grade 8, part 3: scientific notation, round solids, transformations and comparing functions. Schema: ../SCHEMA.md.
import { L, clean, key, near, num, nums, point, same, samePoint } from "./kit-68.js";
import { compareFunctionsModel } from "./living-68-algebra.js";
import { roundVolumeModel, transformModel } from "./living-68-geometry.js";
import { scientificModel } from "./living-68-number.js";

const SUP = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  "⁻": "-",
};
const unsup = (s) => String(s).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, (c) => SUP[c]);
// "4.2 × 10¹⁰", "4.2 x 10^10", "4.2*10^10" → { c, e }.
export function sci(raw) {
  const s = unsup(clean(raw)).replace(/\s+/g, "");
  const m = s.match(/^(-?\d+(?:\.\d+)?)[×x*]10\^?(-?\d+)$/i);
  return m ? { c: Number(m[1]), e: Number(m[2]) } : null;
}
const sciPair = (question) => {
  const m = unsup(clean(question)).match(
    /\((\d+(?:\.\d+)?) × 10(-?\d+)\) ([×+]) \((\d+(?:\.\d+)?) × 10(-?\d+)\)/,
  );
  return m
    ? {
        c1: Number(m[1]),
        e1: Number(m[2]),
        op: m[3],
        c2: Number(m[4]),
        e2: Number(m[5]),
      }
    : null;
};
const r2 = (n) => Math.round(n * 100) / 100;


export const G8C = {
  "8:scientific-ops": {
    concept: L(
      "To multiply numbers in scientific notation, multiply the coefficients and ADD the exponents, because 10ᵃ × 10ᵇ = 10ᵃ⁺ᵇ. Then make sure the coefficient is at least 1 and less than 10.",
      "Para multiplicar números en notación científica, multiplica los coeficientes y SUMA los exponentes, porque 10ᵃ × 10ᵇ = 10ᵃ⁺ᵇ. Luego asegúrate de que el coeficiente sea al menos 1 y menor que 10.",
    ),
    reasons: [
      L(
        "10² × 10³ = (10 × 10) × (10 × 10 × 10) = 10⁵: the factors of 10 are counted, so the exponents add.",
        "10² × 10³ = (10 × 10) × (10 × 10 × 10) = 10⁵: se cuentan los factores de 10, así que los exponentes se suman.",
      ),
      L(
        "If the coefficient reaches 10 or more, move one factor of 10 into the power: 20 × 10⁴ = 2 × 10⁵.",
        "Si el coeficiente llega a 10 o más, pasa un factor de 10 a la potencia: 20 × 10⁴ = 2 × 10⁵.",
      ),
      L(
        "To ADD, the powers of 10 must match first; then add the coefficients and keep the power.",
        "Para SUMAR, primero las potencias de 10 deben coincidir; luego suma los coeficientes y conserva la potencia.",
      ),
    ],
    misconception: L(
      "Exponents are added when powers of ten are MULTIPLIED, not multiplied. And when you ADD numbers with the same power, the power stays the same.",
      "Los exponentes se suman cuando se MULTIPLICAN potencias de diez; no se multiplican. Y cuando SUMAS números con la misma potencia, la potencia se queda igual.",
    ),
    living: scientificModel,
    misconceptions: [
      {
        id: "multiplied-exponents",
        detect(item, raw) {
          const e = sciPair(item.question);
          const got = sci(raw);
          const want = sci(item.answers[0]);
          if (!e || !got || !want || e.op !== "×" || e1e2(e) === e.e1 + e.e2) return false;
          return got.e === e1e2(e) && !same(got.c * 10 ** got.e, want.c * 10 ** want.e);
        },
        feedback: L(
          "You multiplied the exponents. 10ᵃ × 10ᵇ has a + b factors of ten, so ADD the exponents.",
          "Multiplicaste los exponentes. 10ᵃ × 10ᵇ tiene a + b factores de diez, así que SUMA los exponentes.",
        ),
      },
      {
        id: "not-normalized",
        detect(item, raw) {
          const e = sciPair(item.question);
          const got = sci(raw);
          const want = sci(item.answers[0]);
          if (!e || !got || !want || e.op !== "×") return false;
          const c = e.c1 * e.c2;
          return (
            c >= 10 &&
            got.e === e.e1 + e.e2 &&
            near(got.c, want.c, 1e-9) &&
            got.e !== want.e
          );
        },
        feedback: L(
          "The product of the coefficients is 10 or more, so one factor of 10 moves into the power: the exponent goes up by 1.",
          "El producto de los coeficientes es 10 o más, así que un factor de 10 pasa a la potencia: el exponente aumenta en 1.",
        ),
      },
      {
        id: "added-exponents-in-sum",
        detect(item, raw) {
          const e = sciPair(item.question);
          const got = sci(raw);
          return (
            Boolean(e && got) &&
            e.op === "+" &&
            got.e === e.e1 + e.e2 &&
            e.e1 !== 0
          );
        },
        feedback: L(
          "When you ADD, the power of ten does not change: 2 × 10⁷ + 2 × 10⁷ is 4 groups of 10⁷. Add the coefficients and keep the power.",
          "Al SUMAR, la potencia de diez no cambia: 2 × 10⁷ + 2 × 10⁷ son 4 grupos de 10⁷. Suma los coeficientes y conserva la potencia.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "Light travels about 3 × 10⁵ km each second. A day has about 9 × 10⁴ seconds. About how many kilometers does light travel in a day? Write the answer in scientific notation (type 10¹⁰ as 10^10).",
        "La luz recorre unos 3 × 10⁵ km cada segundo. Un día tiene unos 9 × 10⁴ segundos. ¿Aproximadamente cuántos kilómetros recorre la luz en un día? Escribe la respuesta en notación científica (escribe 10¹⁰ como 10^10).",
      ),
      answers: ["2.7 × 10¹⁰", "2.7×10^10", "2.7x10^10", "2.7*10^10"],
      kind: "text",
      hint: L("Multiply 3 × 9 and add the exponents.", "Multiplica 3 × 9 y suma los exponentes."),
      explanation: L(
        "3 × 9 = 27 and 10⁵ × 10⁴ = 10⁹: 27 × 10⁹ = 2.7 × 10¹⁰ km in scientific notation.",
        "3 × 9 = 27 y 10⁵ × 10⁴ = 10⁹: 27 × 10⁹ = 2,7 × 10¹⁰ km en notación científica.",
      ),
    },
  },

  "8:volume-round": {
    title: L(
      "Volume of cylinders, cones and spheres",
      "Volumen de cilindros, conos y esferas",
    ),
    concept: L(
      "A cylinder's volume is the base area times the height: V = πr²h. A cone with the same base and height holds exactly one-third as much, V = ⅓πr²h. A sphere's volume is V = (4/3)πr³.",
      "El volumen de un cilindro es el área de la base por la altura: V = πr²h. Un cono con la misma base y altura contiene exactamente un tercio, V = ⅓πr²h. El volumen de una esfera es V = (4/3)πr³.",
    ),
    reasons: [
      L(
        "A cylinder is a stack of identical circles, each with area πr², h layers high.",
        "Un cilindro es una pila de círculos idénticos, cada uno de área πr², de h capas de alto.",
      ),
      L(
        "Three cones of sand fill the matching cylinder, so a cone is ⅓ of it.",
        "Tres conos de arena llenan el cilindro correspondiente, así que un cono es ⅓ de él.",
      ),
      L(
        "A sphere fits in a cylinder with height 2r and fills ⅔ of it: ⅔ × πr² × 2r = (4/3)πr³.",
        "Una esfera cabe en un cilindro de altura 2r y ocupa ⅔ de él: ⅔ × πr² × 2r = (4/3)πr³.",
      ),
    ],
    misconception: L(
      "The radius is SQUARED in the base area (r × r), not doubled; and the cone needs the ⅓.",
      "El radio se eleva al CUADRADO en el área de la base (r × r), no se duplica; y el cono necesita el ⅓.",
    ),
    living: roundVolumeModel,
    misconceptions: [
      {
        id: "doubled-radius",
        detect(item, raw) {
          const [r, h] = nums(clean(item.question).replace("3.14", ""));
          const v = num(raw);
          if (near(v, key(item), 0.006)) return false;
          if (/cylinder/.test(item.question))
            return near(v, r2(3.14 * 2 * r * h), 0.006);
          if (/cone/.test(item.question))
            return near(v, r2((3.14 * 2 * r * h) / 3), 0.006);
          return false;
        },
        feedback: L(
          "You doubled the radius instead of squaring it. The base is a circle with area πr² = π × r × r.",
          "Duplicaste el radio en lugar de elevarlo al cuadrado. La base es un círculo de área πr² = π × r × r.",
        ),
      },
      {
        id: "cone-third",
        detect(item, raw) {
          if (!/cone/.test(item.question)) return false;
          const [r, h] = nums(clean(item.question).replace("3.14", ""));
          const v = num(raw);
          return (
            near(v, r2(3.14 * r * r * h), 0.006) && !near(v, key(item), 0.006)
          );
        },
        feedback: L(
          "That is the volume of the cylinder with the same base and height. A cone holds one-third of it: multiply by ⅓.",
          "Ese es el volumen del cilindro con la misma base y altura. Un cono contiene un tercio: multiplica por ⅓.",
        ),
      },
      {
        id: "sphere-formula",
        detect(item, raw) {
          if (!/sphere/.test(item.question)) return false;
          const [r] = nums(clean(item.question).replace("3.14", ""));
          const v = num(raw);
          return (
            !near(v, key(item), 0.006) &&
            (near(v, r2(4 * 3.14 * r * r), 0.006) ||
              near(v, r2(3.14 * r ** 3), 0.006))
          );
        },
        feedback: L(
          "A sphere's volume uses r CUBED and the factor 4/3: V = (4/3) × π × r × r × r. (4πr² is its surface area.)",
          "El volumen de la esfera usa r al CUBO y el factor 4/3: V = (4/3) × π × r × r × r. (4πr² es su área de superficie.)",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A paper cup is a cone 9 cm tall with a top radius of 3 cm. How many cubic centimeters of water does it hold? Use 3.14 for π.",
        "Un vaso de papel es un cono de 9 cm de alto con un radio superior de 3 cm. ¿Cuántos centímetros cúbicos de agua contiene? Usa 3.14 para π.",
      ),
      answers: ["84.78"],
      kind: "number",
      hint: L(
        "Find the cylinder's volume, then take one-third.",
        "Halla el volumen del cilindro y luego toma un tercio.",
      ),
      explanation: L(
        "⅓ × 3.14 × 3² × 9 = ⅓ × 254.34 = 84.78 cm³.",
        "⅓ × 3,14 × 3² × 9 = ⅓ × 254,34 = 84,78 cm³.",
      ),
    },
  },

  "8:transformations-move": {
    concept: L(
      "A translation slides every point the same distance and direction: (x, y) → (x + a, y + b). A rotation turns points about the origin: 90° counterclockwise gives (−y, x) and 180° gives (−x, −y). A dilation by k from the origin gives (kx, ky).",
      "Una traslación desliza cada punto la misma distancia y dirección: (x, y) → (x + a, y + b). Una rotación gira los puntos alrededor del origen: 90° en sentido antihorario da (−y, x) y 180° da (−x, −y). Una dilatación de factor k desde el origen da (kx, ky).",
    ),
    reasons: [
      L(
        "Translations and rotations keep lengths and angles, so the image is congruent; a dilation keeps angles and scales lengths by k.",
        "Las traslaciones y rotaciones conservan longitudes y ángulos, así que la imagen es congruente; una dilatación conserva los ángulos y multiplica las longitudes por k.",
      ),
      L(
        "Left and right change x; up and down change y.",
        "Izquierda y derecha cambian x; arriba y abajo cambian y.",
      ),
      L(
        "A quarter turn counterclockwise takes (1, 0) to (0, 1): x becomes the new y.",
        "Un cuarto de vuelta en sentido antihorario lleva (1, 0) a (0, 1): x se convierte en la nueva y.",
      ),
    ],
    misconception: L(
      "A 180° rotation changes BOTH signs; changing one sign is a reflection. Sketch the point and its image to check.",
      "Una rotación de 180° cambia LOS DOS signos; cambiar un signo es una reflexión. Dibuja el punto y su imagen para comprobar.",
    ),
    living: transformModel,
    misconceptions: [
      {
        id: "reflection-for-rotation",
        detect(item, raw) {
          const m = clean(item.question).match(
            /Rotate \((-?\d+), (-?\d+)\) 180°/,
          );
          if (!m) return false;
          const [x, y] = [Number(m[1]), Number(m[2])];
          const p = point(raw);
          return (
            !samePoint(p, -x, -y) &&
            (samePoint(p, -x, y) || samePoint(p, x, -y))
          );
        },
        feedback: L(
          "Changing one sign reflects the point. A 180° rotation is a half turn through the origin: BOTH coordinates change sign.",
          "Cambiar un signo refleja el punto. Una rotación de 180° es media vuelta por el origen: LAS DOS coordenadas cambian de signo.",
        ),
      },
      {
        id: "clockwise",
        detect(item, raw) {
          const m = clean(item.question).match(
            /Rotate \((-?\d+), (-?\d+)\) 90° counterclockwise/,
          );
          if (!m) return false;
          const [x, y] = [Number(m[1]), Number(m[2])];
          const p = point(raw);
          return !samePoint(p, -y, x) && samePoint(p, y, -x);
        },
        feedback: L(
          "You turned clockwise. Counterclockwise is the opposite of a clock's hands: (x, y) → (−y, x).",
          "Giraste en sentido horario. El sentido antihorario es contrario a las manecillas del reloj: (x, y) → (−y, x).",
        ),
      },
      {
        id: "swapped-axes",
        detect(item, raw) {
          const m = clean(item.question).match(
            /Translate \((-?\d+), (-?\d+)\) (\d+) (left|right) and (\d+) (up|down)/,
          );
          if (!m) return false;
          const [x, y, h, v] = [
            Number(m[1]),
            Number(m[2]),
            Number(m[3]) * (m[4] === "left" ? -1 : 1),
            Number(m[5]) * (m[6] === "down" ? -1 : 1),
          ];
          const p = point(raw);
          return (
            !samePoint(p, x + h, y + v) &&
            (samePoint(p, x + v, y + h) ||
              samePoint(p, x - h, y - v) ||
              samePoint(p, x - h, y + v) ||
              samePoint(p, x + h, y - v))
          );
        },
        feedback: L(
          "Check each move: left/right changes x (left subtracts, right adds), and up/down changes y (down subtracts, up adds).",
          "Revisa cada movimiento: izquierda/derecha cambia x (izquierda resta, derecha suma), y arriba/abajo cambia y (abajo resta, arriba suma).",
        ),
      },
      {
        id: "added-scale",
        detect(item, raw) {
          const m = clean(item.question).match(
            /Dilate \((-?\d+), (-?\d+)\) by a scale factor of (\d+(?:\.\d+)?)/,
          );
          if (!m) return false;
          const [x, y, k] = m.slice(1).map(Number);
          const p = point(raw);
          return !samePoint(p, k * x, k * y) && samePoint(p, x + k, y + k);
        },
        feedback: L(
          "A dilation MULTIPLIES each coordinate by the scale factor; it does not add to them.",
          "Una dilatación MULTIPLICA cada coordenada por el factor de escala; no les suma.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "In a game, a robot at (2, 5) turns a quarter turn counterclockwise about the origin. Where does it end? Write (x, y).",
        "En un juego, un robot en (2, 5) gira un cuarto de vuelta en sentido antihorario alrededor del origen. ¿Dónde termina? Escribe (x, y).",
      ),
      answers: ["(-5,2)"],
      kind: "text",
      hint: L(
        "90° counterclockwise: (x, y) → (−y, x).",
        "90° antihorario: (x, y) → (−y, x).",
      ),
      explanation: L("(2, 5) → (−5, 2).", "(2, 5) → (−5, 2)."),
    },
  },

  "8:compare-functions": {
    title: L("Compare two functions", "Comparar dos funciones"),
    concept: L(
      "The rate of change of a linear function is its slope: how much y changes for each 1 that x increases. Functions can be given as equations, tables, graphs or words; find the rate in each form before comparing.",
      "La tasa de cambio de una función lineal es su pendiente: cuánto cambia y por cada 1 que aumenta x. Las funciones pueden darse como ecuaciones, tablas, gráficas o palabras; halla la tasa en cada forma antes de comparar.",
    ),
    reasons: [
      L(
        "In y = mx + b, the rate is m and the starting value is b.",
        "En y = mx + b, la tasa es m y el valor inicial es b.",
      ),
      L(
        "From two points, the rate is (change in y) ÷ (change in x).",
        "A partir de dos puntos, la tasa es (cambio en y) ÷ (cambio en x).",
      ),
      L(
        "A greater rate means a steeper line, whatever the starting value is.",
        "Una tasa mayor significa una recta más inclinada, sea cual sea el valor inicial.",
      ),
    ],
    misconception: L(
      "The y-intercept is where a line starts, not how fast it changes. Compare the rates (slopes), not the starting values.",
      "La intersección con el eje y es donde empieza la recta, no qué tan rápido cambia. Compara las tasas (pendientes), no los valores iniciales.",
    ),
    living: compareFunctionsModel,
    misconceptions: [
      {
        id: "compared-intercepts",
        detect(item, raw) {
          const fn = parseFunctions(item.question);
          const ans = clean(raw).toUpperCase();
          if (!fn || ans === item.answers[0]) return false;
          const byStart = fn.A.b > fn.B.b ? "A" : fn.B.b > fn.A.b ? "B" : null;
          return ans === byStart;
        },
        feedback: L(
          "You compared the starting values (y-intercepts). The rate of change is the number multiplying x, or (change in y) ÷ (change in x) between two points.",
          "Comparaste los valores iniciales (intersecciones con el eje y). La tasa de cambio es el número que multiplica a x, o (cambio en y) ÷ (cambio en x) entre dos puntos.",
        ),
      },
      {
        id: "read-a-point",
        detect(item, raw) {
          const m = clean(item.question).match(
            /through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)/,
          );
          const fn = parseFunctions(item.question);
          const ans = clean(raw).toUpperCase();
          if (!m || !fn || ans === item.answers[0]) return false;
          const yEnd = Number(m[4]);
          return ans === "B" ? yEnd > fn.A.m : fn.A.m > yEnd;
        },
        feedback: L(
          "A point's y-value is not the rate. Find the rate from the two points: (change in y) ÷ (change in x).",
          "El valor de y de un punto no es la tasa. Halla la tasa con los dos puntos: (cambio en y) ÷ (cambio en x).",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "Plan A charges y = 12x + 30 dollars for x months. Plan B charges $20 to start and $15 each month. Which plan's cost grows faster each month: A or B?",
        "El plan A cobra y = 12x + 30 dólares por x meses. El plan B cobra $20 al empezar y $15 cada mes. ¿El costo de qué plan crece más rápido cada mes: A o B?",
      ),
      answers: ["b"],
      kind: "text",
      hint: L(
        "Compare the monthly amounts, not the start fees.",
        "Compara las cantidades mensuales, no las cuotas iniciales.",
      ),
      explanation: L(
        "A grows $12 a month; B grows $15 a month. B grows faster, even though it starts lower.",
        "A crece $12 al mes; B crece $15 al mes. B crece más rápido, aunque empieza más bajo.",
      ),
    },
  },
};

function e1e2(e) {
  return e.e1 * e.e2;
}
// "Function A is y = 5x + 4. Function B is a line through (0, 4) and (2, 8)." → { A: {m, b}, B: {m, b} }.
export function parseFunctions(question) {
  const q = clean(question);
  const eq = (s) => {
    const m = s.match(/y = (-?\d*)x \+ (-?\d+)/);
    return m ? { m: m[1] === "" ? 1 : Number(m[1]), b: Number(m[2]) } : null;
  };
  const [, a, b] = q.split(/Function [AB] /);
  if (!a || !b) return null;
  const A = eq(a);
  let B = eq(b);
  if (!B) {
    const r = b.match(/rate of change of (-?\d+) and a y-intercept of (-?\d+)/);
    const p = b.match(/through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)/);
    if (r) B = { m: Number(r[1]), b: Number(r[2]) };
    else if (p) {
      const [x1, y1, x2, y2] = p.slice(1).map(Number);
      const m = (y2 - y1) / (x2 - x1);
      B = { m, b: y1 - m * x1 };
    }
  }
  return A && B ? { A, B } : null;
}
