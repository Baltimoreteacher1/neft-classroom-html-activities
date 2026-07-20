// Shared grade-6 math glossary. These common terms get the same tap-to-open
// definition+image popup as a lesson's own vocabulary, so a math word is defined
// wherever it appears — not only in lessons that happen to list it. Kept to
// clearly-mathematical terms (and safe multi-word phrases) to avoid underlining
// ordinary English words. Each entry: { term, termEs, definition, definitionEs }.
// Images resolve automatically via resolveVocabImage (a dedicated SVG when one
// exists, otherwise a category illustration). Lesson-authored vocabulary always
// wins over a glossary entry with the same term.

export const MATH_GLOSSARY = [
  // — operations & number —
  {
    term: "sum",
    termEs: "suma",
    definition: "The answer when you add numbers.",
    definitionEs: "El resultado de sumar números.",
  },
  {
    term: "difference",
    termEs: "diferencia",
    definition: "The answer when you subtract.",
    definitionEs: "El resultado de restar.",
  },
  {
    term: "product",
    termEs: "producto",
    definition: "The answer when you multiply.",
    definitionEs: "El resultado de multiplicar.",
  },
  {
    term: "quotient",
    termEs: "cociente",
    definition: "The answer when you divide.",
    definitionEs: "El resultado de dividir.",
  },
  {
    term: "factor",
    termEs: "factor",
    definition: "A number you multiply to make a product.",
    definitionEs: "Un número que multiplicas para formar un producto.",
  },
  {
    term: "multiple",
    termEs: "múltiplo",
    definition:
      "The result of multiplying a number by a whole number (6, 12, 18… are multiples of 6).",
    definitionEs:
      "El resultado de multiplicar un número por un entero (6, 12, 18… son múltiplos de 6).",
  },
  {
    term: "remainder",
    termEs: "residuo",
    definition: "What is left over after dividing.",
    definitionEs: "Lo que sobra después de dividir.",
  },
  {
    term: "digit",
    termEs: "dígito",
    definition: "Any of the symbols 0–9 used to write numbers.",
    definitionEs: "Cualquiera de los símbolos 0–9 que se usan para escribir números.",
  },
  {
    term: "whole number",
    termEs: "número entero",
    definition: "A counting number with no fraction or decimal (0, 1, 2, 3…).",
    definitionEs: "Un número de contar sin fracción ni decimal (0, 1, 2, 3…).",
  },
  {
    term: "prime factorization",
    termEs: "factorización prima",
    definition: "Writing a number as a product of only prime numbers.",
    definitionEs: "Escribir un número como un producto de solo números primos.",
  },
  {
    term: "greatest common factor",
    termEs: "máximo común divisor",
    definition: "The largest factor that two numbers share.",
    definitionEs: "El factor más grande que comparten dos números.",
  },
  {
    term: "least common multiple",
    termEs: "mínimo común múltiplo",
    definition: "The smallest multiple that two numbers share.",
    definitionEs: "El múltiplo más pequeño que comparten dos números.",
  },
  {
    term: "exponent",
    termEs: "exponente",
    definition: "A small number that tells how many times to multiply the base by itself.",
    definitionEs: "Un número pequeño que indica cuántas veces multiplicar la base por sí misma.",
  },
  // — decimals & fractions —
  {
    term: "decimal point",
    termEs: "punto decimal",
    definition: "The dot that separates whole numbers from parts of a whole.",
    definitionEs: "El punto que separa los enteros de las partes de un entero.",
  },
  {
    term: "numerator",
    termEs: "numerador",
    definition: "The top number of a fraction — how many parts you have.",
    definitionEs: "El número de arriba de una fracción — cuántas partes tienes.",
  },
  {
    term: "denominator",
    termEs: "denominador",
    definition: "The bottom number of a fraction — how many equal parts in the whole.",
    definitionEs:
      "El número de abajo de una fracción — en cuántas partes iguales se divide el entero.",
  },
  {
    term: "equivalent",
    termEs: "equivalente",
    definition: "Equal in value, even if written differently (1/2 and 2/4).",
    definitionEs: "Igual en valor, aunque se escriba diferente (1/2 y 2/4).",
  },
  {
    term: "reciprocal",
    termEs: "recíproco",
    definition: "A fraction flipped upside down; two reciprocals multiply to 1.",
    definitionEs: "Una fracción volteada; dos recíprocos multiplicados dan 1.",
  },
  {
    term: "mixed number",
    termEs: "número mixto",
    definition: "A whole number and a fraction together, like 2 1/3.",
    definitionEs: "Un número entero y una fracción juntos, como 2 1/3.",
  },
  // — ratios & percent —
  {
    term: "ratio",
    termEs: "razón",
    definition: "A comparison of two quantities, like 2 to 3.",
    definitionEs: "Una comparación de dos cantidades, como 2 a 3.",
  },
  {
    term: "unit rate",
    termEs: "tasa unitaria",
    definition: "A rate for exactly one of something (miles per 1 hour).",
    definitionEs: "Una tasa por exactamente uno de algo (millas por 1 hora).",
  },
  {
    term: "percent",
    termEs: "por ciento",
    definition: "A part out of 100.",
    definitionEs: "Una parte de 100.",
  },
  {
    term: "proportion",
    termEs: "proporción",
    definition: "An equation that says two ratios are equal.",
    definitionEs: "Una ecuación que dice que dos razones son iguales.",
  },
  // — algebra —
  {
    term: "variable",
    termEs: "variable",
    definition: "A letter that stands for an unknown number.",
    definitionEs: "Una letra que representa un número desconocido.",
  },
  {
    term: "expression",
    termEs: "expresión",
    definition: "Numbers, variables, and operations with no equals sign.",
    definitionEs: "Números, variables y operaciones sin signo de igual.",
  },
  {
    term: "equation",
    termEs: "ecuación",
    definition: "A math sentence with an equals sign showing two equal amounts.",
    definitionEs:
      "Una oración matemática con un signo de igual que muestra dos cantidades iguales.",
  },
  {
    term: "coefficient",
    termEs: "coeficiente",
    definition: "The number multiplied by a variable (the 3 in 3x).",
    definitionEs: "El número multiplicado por una variable (el 3 en 3x).",
  },
  {
    term: "substitute",
    termEs: "sustituir",
    definition: "Replace a variable with a number, then simplify.",
    definitionEs: "Reemplazar una variable por un número y luego simplificar.",
  },
  // — integers & coordinate plane —
  {
    term: "integer",
    termEs: "entero",
    definition: "A whole number that can be positive, negative, or zero.",
    definitionEs: "Un número entero que puede ser positivo, negativo o cero.",
  },
  {
    term: "absolute value",
    termEs: "valor absoluto",
    definition: "A number's distance from zero — always positive.",
    definitionEs: "La distancia de un número desde cero — siempre positiva.",
  },
  {
    term: "opposite",
    termEs: "opuesto",
    definition: "A number the same distance from zero but on the other side (3 and −3).",
    definitionEs: "Un número a la misma distancia de cero pero del otro lado (3 y −3).",
  },
  {
    term: "coordinate plane",
    termEs: "plano de coordenadas",
    definition: "A grid made by a horizontal and a vertical number line.",
    definitionEs: "Una cuadrícula formada por una recta numérica horizontal y una vertical.",
  },
  {
    term: "ordered pair",
    termEs: "par ordenado",
    definition: "Two numbers (x, y) that name a point on the grid.",
    definitionEs: "Dos números (x, y) que nombran un punto en la cuadrícula.",
  },
  {
    term: "origin",
    termEs: "origen",
    definition: "The point (0, 0) where the axes cross.",
    definitionEs: "El punto (0, 0) donde se cruzan los ejes.",
  },
  // — geometry —
  {
    term: "perimeter",
    termEs: "perímetro",
    definition: "The total distance around the outside of a shape.",
    definitionEs: "La distancia total alrededor de una figura.",
  },
  {
    term: "volume",
    termEs: "volumen",
    definition: "The amount of space inside a 3-D solid.",
    definitionEs: "La cantidad de espacio dentro de un sólido en 3-D.",
  },
  {
    term: "surface area",
    termEs: "área de superficie",
    definition: "The total area of all the faces of a solid.",
    definitionEs: "El área total de todas las caras de un sólido.",
  },
  // — statistics —
  {
    term: "median",
    termEs: "mediana",
    definition: "The middle number when the data is in order.",
    definitionEs: "El número del medio cuando los datos están en orden.",
  },
  {
    term: "outlier",
    termEs: "valor atípico",
    definition: "A data value much larger or smaller than the rest.",
    definitionEs: "Un dato mucho mayor o menor que los demás.",
  },
  {
    term: "interquartile range",
    termEs: "rango intercuartílico",
    definition: "The spread of the middle half of the data.",
    definitionEs: "La dispersión de la mitad central de los datos.",
  },
  // — two-word math terms —
  // Registered so the WHOLE phrase underlines as one definition+image popup.
  // Without these, a sub-word that is itself a glossary term ("factor", "ratio",
  // "equivalent", "expression") would underline alone and split the phrase into
  // one or two partial popups. Longest-match-first in the underliner guarantees
  // these win over their single-word parts.
  {
    term: "scale factor",
    termEs: "factor de escala",
    definition:
      "The number you multiply every part of a ratio (or figure) by to make an equivalent one.",
    definitionEs:
      "El número por el que multiplicas cada parte de una razón (o figura) para formar una equivalente.",
  },
  {
    term: "equivalent ratio",
    termEs: "razón equivalente",
    definition:
      "A ratio that shows the same comparison, made by multiplying or dividing both parts by the same number.",
    definitionEs:
      "Una razón que muestra la misma comparación, formada al multiplicar o dividir ambas partes por el mismo número.",
  },
  {
    term: "equivalent expression",
    termEs: "expresión equivalente",
    definition:
      "An expression that always has the same value as another, just written a different way.",
    definitionEs:
      "Una expresión que siempre tiene el mismo valor que otra, solo escrita de otra manera.",
    image: "/assets/vocab-images/expression.svg",
  },
  {
    term: "equivalent fraction",
    termEs: "fracción equivalente",
    definition: "A fraction that names the same amount as another (1/2 and 2/4).",
    definitionEs: "Una fracción que nombra la misma cantidad que otra (1/2 y 2/4).",
    image: "/assets/vocab-images/fraction.svg",
  },
  {
    term: "common factor",
    termEs: "factor común",
    definition: "A number that divides evenly into two or more numbers.",
    definitionEs: "Un número que divide exactamente a dos o más números.",
    image: "/assets/vocab-images/factor.svg",
  },
  {
    term: "common multiple",
    termEs: "múltiplo común",
    definition: "A number that is a multiple of two or more numbers.",
    definitionEs: "Un número que es múltiplo de dos o más números.",
  },
  {
    term: "prime factor",
    termEs: "factor primo",
    definition: "A factor that is itself a prime number.",
    definitionEs: "Un factor que es un número primo.",
    image: "/assets/vocab-images/factor.svg",
  },
  {
    term: "conversion factor",
    termEs: "factor de conversión",
    definition: "A rate you multiply by to change one unit into another.",
    definitionEs: "Una tasa por la que multiplicas para cambiar una unidad por otra.",
  },
  {
    term: "algebraic expression",
    termEs: "expresión algebraica",
    definition: "An expression that uses at least one variable.",
    definitionEs: "Una expresión que usa al menos una variable.",
    image: "/assets/vocab-images/expression.svg",
  },
];

// Merge a lesson's own vocabulary with the shared glossary. Lesson entries win on
// any duplicate term (so a lesson can define a word its own way). Returns a new
// array safe to pass to the vocab underliner / popup wiring.
export function augmentVocabWithGlossary(vocab) {
  const list = Array.isArray(vocab) ? vocab.filter(Boolean) : [];
  const seen = new Set(
    list.map((v) =>
      String((v && v.term) || "")
        .toLowerCase()
        .replace(/s$/, "")
        .trim(),
    ),
  );
  const extras = MATH_GLOSSARY.filter((g) => {
    const key = g.term.toLowerCase().replace(/s$/, "").trim();
    return !seen.has(key);
  });
  return list.concat(extras);
}

export default MATH_GLOSSARY;
