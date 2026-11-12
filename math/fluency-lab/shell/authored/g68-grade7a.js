// Grade 7, part 1: rational number operations and proportional relationships. Schema: ../SCHEMA.md.
import { L, clean, key, num, nums, same } from "./kit-68.js";
import { integerModel, signedFractionModel } from "./living-68-number.js";

// "a op b" with signed integers, written "26 + (-16)", "-12 − 18", "40 ÷ (-4)".
function signedOp(question) {
  const m = clean(question).match(/^\(?(-?\d+)\)? ([+\-×÷]) \(?(-?\d+)\)? =/);
  return m ? { a: Number(m[1]), op: m[2], b: Number(m[3]) } : null;
}
const apply = (a, op, b) =>
  ({ "+": a + b, "-": a - b, "×": a * b, "÷": a / b })[op];
// Signed fractions "-3/4 ÷ 8/9", "3/10 + (-3/8)".
function fracOp(question) {
  const m = clean(question).match(
    /^\(?(-?\d+)\/(\d+)\)? ([+\-×÷]) \(?(-?\d+)\/(\d+)\)? =/,
  );
  return m
    ? {
        p: Number(m[1]) / Number(m[2]),
        op: m[3],
        q: Number(m[4]) / Number(m[5]),
        n: [Number(m[1]), Number(m[2]), Number(m[4]), Number(m[5])],
      }
    : null;
}

const SIGN_FEEDBACK = L(
  "The size of your answer is right, but the sign is not. Decide the sign separately: picture the chips or the arrows on the number line and ask which side of 0 you end on.",
  "El tamaño de tu respuesta es correcto, pero el signo no. Decide el signo por separado: imagina las fichas o las flechas en la recta numérica y pregúntate de qué lado del 0 terminas.",
);

export const G7A = {
  "7:integer-add": {
    concept: L(
      "Adding a negative number moves you left on the number line; subtracting a negative moves you right. A positive chip and a negative chip make a zero pair, which is worth 0.",
      "Sumar un número negativo te mueve a la izquierda en la recta numérica; restar un negativo te mueve a la derecha. Una ficha positiva y una negativa forman un par cero, que vale 0.",
    ),
    reasons: [
      L(
        "Opposites add to zero: 5 and −5 together make nothing. That is why zero pairs can be added or removed without changing a value.",
        "Los opuestos suman cero: 5 y −5 juntos no dan nada. Por eso los pares cero se pueden agregar o quitar sin cambiar un valor.",
      ),
      L(
        "Subtracting a number is the same as adding its opposite: a − b = a + (−b).",
        "Restar un número es lo mismo que sumar su opuesto: a − b = a + (−b).",
      ),
      L(
        "So a − (−b) = a + b: taking away a debt leaves you better off.",
        "Así, a − (−b) = a + b: quitar una deuda te deja mejor.",
      ),
    ],
    misconception: L(
      "Subtracting a negative is not the same as subtracting. a − (−b) means add the opposite: a + b.",
      "Restar un negativo no es lo mismo que restar. a − (−b) significa sumar el opuesto: a + b.",
    ),
    living: integerModel,
    misconceptions: [
      {
        id: "subtract-negative",
        detect(item, raw) {
          const e = signedOp(item.question);
          if (!e || e.op !== "-" || e.b >= 0) return false;
          const v = num(raw);
          return same(v, e.a + e.b) && !same(v, key(item));
        },
        feedback: L(
          "You subtracted as if the second number were positive. Subtracting a negative means adding its opposite: a − (−b) = a + b. On the number line, taking away a negative moves you RIGHT.",
          "Restaste como si el segundo número fuera positivo. Restar un negativo es sumar su opuesto: a − (−b) = a + b. En la recta numérica, quitar un negativo te mueve a la DERECHA.",
        ),
      },
      {
        id: "sign",
        detect(item, raw) {
          const v = num(raw);
          const k = key(item);
          return k !== 0 && same(v, -k);
        },
        feedback: SIGN_FEEDBACK,
      },
      {
        id: "ignored-sign",
        detect(item, raw) {
          const e = signedOp(item.question);
          if (!e) return false;
          const v = num(raw);
          return (
            !same(v, key(item)) &&
            same(v, apply(Math.abs(e.a), e.op, Math.abs(e.b)))
          );
        },
        feedback: L(
          "You worked with the numbers as if they were all positive. Keep each sign: a negative chip cancels a positive chip.",
          "Trabajaste con los números como si todos fueran positivos. Conserva cada signo: una ficha negativa cancela una positiva.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "At dawn the temperature was −8 °F. By noon it rose 15 degrees, then by midnight it fell 11 degrees. What was the temperature at midnight, in °F?",
        "Al amanecer la temperatura era de −8 °F. Al mediodía subió 15 grados y a la medianoche bajó 11 grados. ¿Cuál era la temperatura a la medianoche, en °F?",
      ),
      answers: ["-4"],
      kind: "number",
      hint: L(
        "Start at −8 on a thermometer and move up, then down.",
        "Empieza en −8 en un termómetro y muévete hacia arriba y luego hacia abajo.",
      ),
      explanation: L(
        "−8 + 15 = 7, then 7 − 11 = −4 °F.",
        "−8 + 15 = 7, luego 7 − 11 = −4 °F.",
      ),
    },
  },

  "7:integer-mul": {
    concept: L(
      "When you multiply or divide two integers, find the size from the absolute values and the sign from a rule: same signs give a positive result, different signs give a negative result.",
      "Al multiplicar o dividir dos enteros, el tamaño sale de los valores absolutos y el signo de una regla: signos iguales dan un resultado positivo y signos distintos dan uno negativo.",
    ),
    reasons: [
      L(
        "3 × (−4) is three groups of −4, which is −12.",
        "3 × (−4) son tres grupos de −4, que es −12.",
      ),
      L(
        "The products 3 × (−4), 2 × (−4), 1 × (−4), 0 × (−4) are −12, −8, −4, 0: each is 4 more than the one before, so (−1) × (−4) must be 4 more than 0, a positive number.",
        "Los productos 3 × (−4), 2 × (−4), 1 × (−4), 0 × (−4) son −12, −8, −4, 0: cada uno es 4 más que el anterior, así que (−1) × (−4) debe ser 4 más que 0, un número positivo.",
      ),
      L(
        "Division undoes multiplication, so it follows the same sign rule: −12 ÷ 3 is negative because 3 times a negative number gives −12.",
        "La división deshace la multiplicación, así que sigue la misma regla de signos: −12 ÷ 3 es negativo porque 3 por un número negativo da −12.",
      ),
    ],
    misconception: L(
      "Two negatives make a positive in multiplication and division, not in addition. Decide the sign from the rule after you find the size.",
      "Dos negativos dan positivo en la multiplicación y la división, no en la suma. Decide el signo con la regla después de hallar el tamaño.",
    ),
    misconceptions: [
      {
        id: "sign",
        detect(item, raw) {
          const v = num(raw);
          const k = key(item);
          return k !== 0 && same(v, -k);
        },
        feedback: L(
          "The size is right; check the sign. Same signs give a positive product or quotient; different signs give a negative one.",
          "El tamaño es correcto; revisa el signo. Signos iguales dan un producto o cociente positivo; signos distintos dan uno negativo.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A diver descends at a steady 3 meters per minute, so her change in depth is −3 meters each minute. What is her total change in depth after 9 minutes, in meters?",
        "Una buceadora desciende a 3 metros por minuto, así que su cambio de profundidad es −3 metros cada minuto. ¿Cuál es su cambio total de profundidad después de 9 minutos, en metros?",
      ),
      answers: ["-27"],
      kind: "number",
      hint: L("Nine groups of −3.", "Nueve grupos de −3."),
      explanation: L(
        "9 × (−3) = −27 meters: 27 meters deeper.",
        "9 × (−3) = −27 metros: 27 metros más abajo.",
      ),
    },
  },

  "7:fraction-ops": {
    title: L(
      "Operations with signed fractions",
      "Operaciones con fracciones con signo",
    ),
    concept: L(
      "Signed fractions follow the same rules as integers, and fractions follow the same rules as always: add and subtract with a common denominator; multiply across; divide by multiplying by the reciprocal.",
      "Las fracciones con signo siguen las mismas reglas que los enteros, y las fracciones siguen sus reglas de siempre: suma y resta con denominador común, multiplica en línea y divide multiplicando por el recíproco.",
    ),
    reasons: [
      L(
        "A common denominator makes the pieces the same size, so the numerators can be added or subtracted.",
        "Un denominador común hace que las partes tengan el mismo tamaño, así que los numeradores se pueden sumar o restar.",
      ),
      L(
        "The sign rules for products and quotients do not depend on whether the numbers are whole or fractions.",
        "Las reglas de signos para productos y cocientes no dependen de si los números son enteros o fracciones.",
      ),
      L(
        "Estimate the sign and size first: −3/4 + 1/8 lies between −1 and 0, so the answer must be negative.",
        "Estima primero el signo y el tamaño: −3/4 + 1/8 está entre −1 y 0, así que la respuesta debe ser negativa.",
      ),
    ],
    misconception: L(
      "Adding the numerators and adding the denominators does not add fractions: the pieces must be the same size first. Find a common denominator.",
      "Sumar los numeradores y sumar los denominadores no suma fracciones: primero las partes deben tener el mismo tamaño. Busca un denominador común.",
    ),
    living: signedFractionModel,
    misconceptions: [
      {
        id: "sign",
        detect(item, raw) {
          const v = num(raw);
          const k = key(item);
          return k !== 0 && same(v, -k);
        },
        feedback: SIGN_FEEDBACK,
      },
      {
        id: "across",
        detect(item, raw) {
          const e = fracOp(item.question);
          if (!e || (e.op !== "+" && e.op !== "-")) return false;
          const [a, b, c, d] = e.n;
          const v = num(raw);
          const across = (e.op === "+" ? a + c : a - c) / (b + d);
          return same(v, across) && !same(v, key(item));
        },
        feedback: L(
          "You combined the numerators and the denominators separately. Fractions can only be added or subtracted when the pieces are the same size: rewrite both with a common denominator, then combine the numerators.",
          "Combinaste los numeradores y los denominadores por separado. Las fracciones solo se pueden sumar o restar cuando las partes son del mismo tamaño: reescribe las dos con un denominador común y luego combina los numeradores.",
        ),
      },
      {
        id: "no-flip",
        detect(item, raw) {
          const e = fracOp(item.question);
          if (!e || e.op !== "÷") return false;
          const v = num(raw);
          return same(v, e.p * e.q) && !same(v, key(item));
        },
        feedback: L(
          "To divide, multiply by the RECIPROCAL of the divisor: flip the second fraction, then multiply.",
          "Para dividir, multiplica por el RECÍPROCO del divisor: invierte la segunda fracción y luego multiplica.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A stock's price changed by −3/4 of a dollar on Monday and by +1/8 of a dollar on Tuesday. What was the total change, in dollars? Write a fraction.",
        "El precio de una acción cambió −3/4 de dólar el lunes y +1/8 de dólar el martes. ¿Cuál fue el cambio total, en dólares? Escribe una fracción.",
      ),
      answers: ["-5/8"],
      kind: "fraction",
      hint: L("Write −3/4 in eighths.", "Escribe −3/4 en octavos."),
      explanation: L(
        "−3/4 + 1/8 = −6/8 + 1/8 = −5/8 of a dollar.",
        "−3/4 + 1/8 = −6/8 + 1/8 = −5/8 de dólar.",
      ),
    },
  },

  "7:unit-rate": {
    title: L("Unit rates with decimals", "Tasas unitarias con decimales"),
    concept: L(
      "A unit rate is the amount for exactly 1 unit. With decimals the reasoning is the same as with whole numbers: divide the total by the number of units.",
      "Una tasa unitaria es la cantidad para exactamente 1 unidad. Con decimales el razonamiento es el mismo que con enteros: divide el total entre el número de unidades.",
    ),
    reasons: [
      L(
        "Dividing shares the total equally, so each unit gets the same amount.",
        "Dividir reparte el total por igual, así que cada unidad recibe la misma cantidad.",
      ),
      L(
        "Estimate before dividing: $18.80 for 2 is a little more than $9 each.",
        "Estima antes de dividir: $18.80 entre 2 es un poco más de $9 cada uno.",
      ),
      L(
        "Check: the unit rate times the number of units gives back the total.",
        "Comprueba: la tasa unitaria por el número de unidades da el total.",
      ),
    ],
    misconception: L(
      "The amount for 1 item must be LESS than the total for several items. If your answer is bigger, you multiplied instead of dividing.",
      "La cantidad de 1 artículo debe ser MENOR que el total de varios. Si tu respuesta es mayor, multiplicaste en lugar de dividir.",
    ),
    misconceptions: [
      {
        id: "multiplied",
        detect(item, raw) {
          const [total, count] = nums(item.question);
          const v = num(raw);
          return same(v, total * count) && !same(v, key(item));
        },
        feedback: L(
          "You multiplied. The total is shared among the items, so divide the total by the number of items.",
          "Multiplicaste. El total se reparte entre los artículos, así que divide el total entre el número de artículos.",
        ),
      },
      {
        id: "decimal-place",
        detect(item, raw) {
          const v = num(raw);
          const k = key(item);
          return (
            !same(v, k) &&
            k !== 0 &&
            [10, 100, 0.1, 0.01].some((f) => same(v, k * f))
          );
        },
        feedback: L(
          "Check the decimal point: estimate the total ÷ the count with rounded numbers, and compare.",
          "Revisa el punto decimal: estima el total ÷ la cantidad con números redondeados y compara.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A 12-pack of water costs $5.40. A 6-pack costs $3.00. Which is the better buy per bottle? Type the price per bottle of the better buy, in dollars.",
        "Un paquete de 12 botellas de agua cuesta $5.40. Uno de 6 cuesta $3.00. ¿Cuál conviene más por botella? Escribe el precio por botella de la mejor compra, en dólares.",
      ),
      answers: ["0.45"],
      kind: "number",
      hint: L(
        "Find the price of 1 bottle in each pack.",
        "Halla el precio de 1 botella en cada paquete.",
      ),
      explanation: L(
        "5.40 ÷ 12 = 0.45 and 3.00 ÷ 6 = 0.50. The 12-pack is cheaper: $0.45 per bottle.",
        "5,40 ÷ 12 = 0,45 y 3,00 ÷ 6 = 0,50. El paquete de 12 es más barato: $0.45 por botella.",
      ),
    },
  },

  "7:proportions": {
    concept: L(
      "A proportion says two ratios are equivalent: a/b = x/c. Find the factor that turns one denominator into the other, and apply the SAME factor to the numerator.",
      "Una proporción dice que dos razones son equivalentes: a/b = x/c. Halla el factor que convierte un denominador en el otro y aplica el MISMO factor al numerador.",
    ),
    reasons: [
      L(
        "Equivalent ratios scale both terms by the same number, so the relationship is unchanged.",
        "Las razones equivalentes multiplican los dos términos por el mismo número, así que la relación no cambia.",
      ),
      L(
        "When the factor is not a whole number, find the unit rate first: a/b of one unit, then multiply.",
        "Cuando el factor no es entero, halla primero la tasa unitaria: a/b de una unidad, y luego multiplica.",
      ),
      L(
        "Check: a × c should equal b × x when the ratios are equivalent.",
        "Comprueba: a × c debe ser igual a b × x cuando las razones son equivalentes.",
      ),
    ],
    misconception: L(
      "Ratios grow by multiplying, not by adding the same amount. Find what the denominator was multiplied by.",
      "Las razones crecen multiplicando, no sumando la misma cantidad. Halla por cuánto se multiplicó el denominador.",
    ),
    misconceptions: [
      {
        id: "additive",
        detect(item, raw) {
          const [a, b, c] = nums(item.question);
          const v = num(raw);
          return same(v, a + (c - b)) && !same(v, key(item));
        },
        feedback: L(
          "You added the same amount to the numerator that the denominator gained. Ratios scale by multiplying: find how many times larger the new denominator is, then multiply the numerator by that.",
          "Sumaste al numerador lo mismo que ganó el denominador. Las razones se escalan multiplicando: halla cuántas veces mayor es el nuevo denominador y multiplica el numerador por eso.",
        ),
      },
      {
        id: "inverted",
        detect(item, raw) {
          const [a, b, c] = nums(item.question);
          const v = num(raw);
          return same(v, (b * c) / a) && !same(v, key(item));
        },
        feedback: L(
          "You matched the numbers the wrong way around. The numerator goes with the numerator: multiply a by the same factor that takes b to c.",
          "Emparejaste los números al revés. El numerador va con el numerador: multiplica a por el mismo factor que lleva b a c.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A recipe uses 3 cups of flour for 4 loaves. How many cups of flour are needed for 10 loaves?",
        "Una receta usa 3 tazas de harina para 4 panes. ¿Cuántas tazas de harina se necesitan para 10 panes?",
      ),
      answers: ["7.5", "7 1/2", "15/2"],
      kind: "fraction",
      hint: L(
        "How much flour is used for 1 loaf?",
        "¿Cuánta harina se usa para 1 pan?",
      ),
      explanation: L(
        "3/4 cup per loaf × 10 loaves = 30/4 = 7.5 cups.",
        "3/4 de taza por pan × 10 panes = 30/4 = 7,5 tazas.",
      ),
    },
  },

  "7:percent-change": {
    title: L(
      "Percent increase and decrease",
      "Aumento y disminución porcentual",
    ),
    concept: L(
      "A percent change is a percent OF the original amount. Find that amount and add it for an increase or subtract it for a decrease, or multiply once: an increase of 25% gives 125% of the original.",
      "Un cambio porcentual es un porcentaje DE la cantidad original. Halla esa cantidad y súmala en un aumento o réstala en una disminución, o multiplica una vez: un aumento del 25 % da el 125 % del original.",
    ),
    reasons: [
      L(
        "The original amount is 100%. A 10% decrease leaves 100% − 10%, which is 90% of it.",
        "La cantidad original es el 100 %. Una disminución del 10 % deja el 100 % − 10 %, es decir, el 90 % de ella.",
      ),
      L(
        "The change is measured in the same units as the original, so a percent must be turned into an amount first.",
        "El cambio se mide en las mismas unidades que el original, así que primero hay que convertir el porcentaje en una cantidad.",
      ),
      L(
        "Check the direction: an increase must give more than the original, a decrease less.",
        "Revisa la dirección: un aumento debe dar más que el original y una disminución, menos.",
      ),
    ],
    misconception: L(
      "A percent is not a number of units. A 10% increase on 190 is not 190 + 10; find 10% of 190 first.",
      "Un porcentaje no es un número de unidades. Un aumento del 10 % sobre 190 no es 190 + 10; halla primero el 10 % de 190.",
    ),
    misconceptions: [
      {
        id: "percent-as-amount",
        detect(item, raw) {
          const [n, p] = nums(item.question);
          const v = num(raw);
          const t = /increase/.test(item.question) ? n + p : n - p;
          return same(v, t) && !same(v, key(item));
        },
        feedback: L(
          "You added or subtracted the percent as if it were a number of units. First find the percent OF the original amount, then add or subtract that amount.",
          "Sumaste o restaste el porcentaje como si fuera un número de unidades. Primero halla el porcentaje DE la cantidad original y luego suma o resta esa cantidad.",
        ),
      },
      {
        id: "change-only",
        detect(item, raw) {
          const [n, p] = nums(item.question);
          const v = num(raw);
          return same(v, (n * p) / 100) && !same(v, key(item));
        },
        feedback: L(
          "That is the amount of the change. The question asks for the new total: add it to the original for an increase, or subtract it for a decrease.",
          "Esa es la cantidad del cambio. La pregunta pide el nuevo total: súmala al original en un aumento o réstala en una disminución.",
        ),
      },
      {
        id: "wrong-direction",
        detect(item, raw) {
          const [n, p] = nums(item.question);
          const v = num(raw);
          const flip = /increase/.test(item.question)
            ? n - (n * p) / 100
            : n + (n * p) / 100;
          return same(v, flip) && !same(v, key(item));
        },
        feedback: L(
          "Check the direction: an increase adds the change to the original; a decrease subtracts it.",
          "Revisa la dirección: un aumento suma el cambio al original; una disminución lo resta.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A jacket costs $80. It is on sale for 15% off. What is the sale price, in dollars?",
        "Una chaqueta cuesta $80. Está en oferta con un 15 % de descuento. ¿Cuál es el precio de oferta, en dólares?",
      ),
      answers: ["68"],
      kind: "number",
      hint: L("Find 10% and 5% of $80.", "Halla el 10 % y el 5 % de $80."),
      explanation: L(
        "15% of 80 = 8 + 4 = 12, and 80 − 12 = $68. Or 85% of 80 = 0.85 × 80 = 68.",
        "El 15 % de 80 = 8 + 4 = 12, y 80 − 12 = $68. O el 85 % de 80 = 0,85 × 80 = 68.",
      ),
    },
  },

  "7:scale-drawing": {
    concept: L(
      "A scale such as 1 cm : 5 m is a ratio between drawing lengths and real lengths. Every length in the drawing is multiplied by the same factor to give the real length.",
      "Una escala como 1 cm : 5 m es una razón entre longitudes del dibujo y longitudes reales. Cada longitud del dibujo se multiplica por el mismo factor para dar la longitud real.",
    ),
    reasons: [
      L(
        "Each centimeter on the drawing stands for the same real distance, so k centimeters stand for k times that distance.",
        "Cada centímetro del dibujo representa la misma distancia real, así que k centímetros representan k veces esa distancia.",
      ),
      L(
        "A scale is a unit rate: real meters per drawing centimeter.",
        "Una escala es una tasa unitaria: metros reales por centímetro del dibujo.",
      ),
      L(
        "Going from real to drawing, divide by the same factor.",
        "Para pasar de real a dibujo, divide entre el mismo factor.",
      ),
    ],
    misconception: L(
      "Adding the scale to the drawing length does not scale it. Multiply the drawing length by the real distance one unit stands for.",
      "Sumar la escala a la longitud del dibujo no la escala. Multiplica la longitud del dibujo por la distancia real que representa una unidad.",
    ),
    misconceptions: [
      {
        id: "added",
        detect(item, raw) {
          const [, s, d] = nums(item.question);
          const v = num(raw);
          return same(v, s + d) && !same(v, key(item));
        },
        feedback: L(
          "You added the scale to the length. Each centimeter stands for the same number of meters, so multiply.",
          "Sumaste la escala a la longitud. Cada centímetro representa el mismo número de metros, así que multiplica.",
        ),
      },
      {
        id: "divided",
        detect(item, raw) {
          const [, s, d] = nums(item.question);
          const v = num(raw);
          return !same(v, key(item)) && (same(v, d / s) || same(v, s / d));
        },
        feedback: L(
          "The real wall is much longer than the drawing, so the answer should be larger than the drawing length. Multiply by the meters each centimeter represents.",
          "La pared real es mucho más larga que el dibujo, así que la respuesta debe ser mayor que la longitud del dibujo. Multiplica por los metros que representa cada centímetro.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "On a map, 2 inches represent 15 miles. Two towns are 7 inches apart on the map. How many miles apart are they?",
        "En un mapa, 2 pulgadas representan 15 millas. Dos pueblos están a 7 pulgadas en el mapa. ¿A cuántas millas están?",
      ),
      answers: ["52.5", "52 1/2", "105/2"],
      kind: "fraction",
      hint: L(
        "How many miles does 1 inch represent?",
        "¿Cuántas millas representa 1 pulgada?",
      ),
      explanation: L(
        "15 ÷ 2 = 7.5 miles per inch, and 7 × 7.5 = 52.5 miles.",
        "15 ÷ 2 = 7,5 millas por pulgada, y 7 × 7,5 = 52,5 millas.",
      ),
    },
  },
};
