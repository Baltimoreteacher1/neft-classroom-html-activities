// BCPSS Family Guide (EN/ES) — g7-math-u3. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on operations with positive and negative rational numbers. Vocabulary order matches ../units/g7-math-u3.mjs.

export default {
  summary: {
    en: "Your child is learning to add, subtract, multiply and divide positive and negative numbers, including fractions and decimals. The main idea is to know why the sign of the answer is positive, negative or zero. It matters with temperatures, money you owe and money you earn, scores in a game, and elevations above and below sea level.",
    es: "Su hijo o hija está aprendiendo a sumar, restar, multiplicar y dividir números positivos y negativos, incluso fracciones y decimales. La idea principal es saber por qué el signo de la respuesta es positivo, negativo o cero. Sirve con las temperaturas, el dinero que se debe y el que se gana, los puntos de un juego y las alturas sobre y bajo el nivel del mar.",
  },
  goals: {
    en: [
      "I can add and subtract positive and negative numbers and explain the sign of my answer.",
      "I can multiply and divide positive and negative numbers.",
      "I can use the words because, so and leads to to explain why.",
    ],
    es: [
      "Puedo sumar y restar números positivos y negativos y explicar el signo de mi respuesta.",
      "Puedo multiplicar y dividir números positivos y negativos.",
      "Puedo usar las palabras porque, entonces y lleva a para explicar por qué.",
    ],
  },
  vocab: [
    { term: "additive inverse", def_es: "el número que se suma a otro para obtener 0", example_es: "El inverso aditivo de −7 es 7 porque −7 + 7 = 0." },
    { term: "rational number", def_es: "un número que se puede escribir como una fracción con números enteros arriba y abajo", example_es: "−0.75 es un número racional porque es igual a −3/4." },
    { term: "terminating decimal", def_es: "un decimal que se acaba después de unos cuantos dígitos", example_es: "0.125 es un decimal finito porque termina después de tres dígitos." },
    { term: "repeating decimal", def_es: "un decimal cuyos dígitos se repiten para siempre en un patrón", example_es: "La fracción 1/3 es un decimal periódico: 0.333…" },
    { term: "zero pair", def_es: "un positivo y un negativo del mismo tamaño que se cancelan y dan 0", example_es: "Una ficha positiva y una negativa forman un par cero." },
    { term: "integer", def_es: "un número entero, el opuesto de un número entero o el cero", example_es: "Los números −4, 0 y 12 son enteros." },
    { term: "product", def_es: "la respuesta de una multiplicación", example_es: "El producto de −3 y 4 es −12." },
    { term: "quotient", def_es: "la respuesta de una división", example_es: "El cociente de −12 y −4 es 3." },
    { term: "sign", def_es: "la marca de más o de menos que dice si un número es positivo o negativo", example_es: "El signo de −8 es negativo." },
  ],
  talk: [
    { en: "Is the answer positive or negative? How can you tell before you calculate?", es: "¿La respuesta es positiva o negativa? ¿Cómo puedes saberlo antes de calcular?" },
    { en: "What number would cancel this one out and make zero?", es: "¿Qué número cancelaría a este y daría cero?" },
    { en: "What happens to the sign when two negatives are multiplied? Can you show me with an example?", es: "¿Qué pasa con el signo cuando se multiplican dos negativos? ¿Me lo puedes mostrar con un ejemplo?" },
    { en: "Where on the number line does the answer land? Show me.", es: "¿Dónde cae la respuesta en la recta numérica? Muéstramelo." },
    { en: "Can you tell the math as a story about money or temperature?", es: "¿Puedes contar la matemática como una historia de dinero o de temperatura?" },
  ],
  try_at_home: [
    {
      title: { en: "Money Story Cards", es: "Tarjetas de historias de dinero" },
      minutes: 15,
      materials: { en: "Index cards or paper scraps, pencil, play money (optional)", es: "Tarjetas o pedazos de papel, lápiz, dinero de juguete (opcional)" },
      steps: {
        en: [
          "On each card, write a money event: +$8 for allowance, −$5 for a snack, −$3 for a bus fare, +$2 found.",
          "Draw 3 cards and add them up. Ask your child to say whether you end with money or owe money.",
          "Try subtracting a negative: if a $5 debt is taken away, you gain $5. Ask: why is that so?",
          "Make a story where the answer is exactly zero.",
        ],
        es: [
          "En cada tarjeta, escriban un movimiento de dinero: +$8 de mesada, −$5 de un bocadillo, −$3 del pasaje, +$2 encontrados.",
          "Saquen 3 tarjetas y súmenlas. Pídanle a su hijo o hija que diga si al final tienen dinero o deben dinero.",
          "Prueben restar un negativo: si te quitan una deuda de $5, ganas $5. Pregunten: ¿por qué es así?",
          "Inventen una historia en la que el resultado sea exactamente cero.",
        ],
      },
    },
    {
      title: { en: "Thermometer Changes", es: "Cambios del termómetro" },
      minutes: 10,
      materials: { en: "A weather app or paper thermometer drawn on a vertical line, pencil", es: "Una aplicación del clima o un termómetro dibujado en una línea vertical, lápiz" },
      steps: {
        en: [
          "Start at 5 degrees. Say it dropped 8 degrees. Where are you now? (5 − 8 = −3.)",
          "Move a finger or marker on the vertical number line to show each change.",
          "Try: the temperature is −4 and rises 6 degrees. Where does it land?",
          "Ask: when you add a negative number, which way do you move?",
        ],
        es: [
          "Empiecen en 5 grados. Digan que bajó 8 grados. ¿Dónde están ahora? (5 − 8 = −3.)",
          "Muevan un dedo o una ficha en la recta numérica vertical para mostrar cada cambio.",
          "Prueben: la temperatura es −4 y sube 6 grados. ¿Dónde queda?",
          "Pregunten: cuando sumas un número negativo, ¿hacia dónde te mueves?",
        ],
      },
    },
    {
      title: { en: "Sign Detective", es: "Detectives de signos" },
      minutes: 10,
      materials: { en: "Paper and pencil, two coins or a die", es: "Papel y lápiz, dos monedas o un dado" },
      steps: {
        en: [
          "Flip two coins. Heads is a positive number, tails is a negative number. Pick a number from 1 to 6 for each.",
          "Multiply the two numbers. Before you calculate, ask: will the product be positive or negative?",
          "Tally the results: same signs and different signs. What pattern do you see?",
          "Say the rule in your own words, in any language, then test it with a division problem.",
        ],
        es: [
          "Lancen dos monedas. Cara es un número positivo y cruz es un número negativo. Elijan un número del 1 al 6 para cada una.",
          "Multipliquen los dos números. Antes de calcular, pregunten: ¿el producto será positivo o negativo?",
          "Anoten los resultados: signos iguales y signos distintos. ¿Qué patrón ven?",
          "Digan la regla con sus propias palabras, en el idioma que quieran, y pruébenla con una división.",
        ],
      },
    },
    {
      title: { en: "Decimals and Fractions on a Receipt", es: "Decimales y fracciones en un recibo" },
      minutes: 15,
      materials: { en: "A store receipt with returns or coupons, paper and pencil", es: "Un recibo de tienda con devoluciones o cupones, papel y lápiz" },
      steps: {
        en: [
          "Find charges (positive) and coupons or returns (negative) on a receipt, like $4.50 and −$1.25.",
          "Ask your child to add them: $4.50 + (−$1.25). Say whether the answer is more or less than $4.50.",
          "Write 0.5 as 1/2 and −0.25 as −1/4. Add them in either form.",
          "Ask: are 0.5 and 1/2 the same number? How do you know?",
        ],
        es: [
          "Busquen en un recibo los cobros (positivos) y los cupones o devoluciones (negativos), como $4.50 y −$1.25.",
          "Pídanle a su hijo o hija que los sume: $4.50 + (−$1.25). Que diga si la respuesta es mayor o menor que $4.50.",
          "Escriban 0.5 como 1/2 y −0.25 como −1/4. Súmenlos en cualquiera de las dos formas.",
          "Pregunten: ¿0.5 y 1/2 son el mismo número? ¿Cómo lo sabes?",
        ],
      },
    },
  ],
  say_it: [
    { en: "Subtracting [−3] is the same as adding [3], so the answer is [8].", es: "Restar [−3] es lo mismo que sumar [3], entonces la respuesta es [8]." },
    { en: "The product is [negative] because the signs are [different].", es: "El producto es [negativo] porque los signos son [diferentes]." },
    { en: "[5] + [−5] = 0, so they are additive inverses.", es: "[5] + [−5] = 0, entonces son inversos aditivos." },
    { en: "The quotient is [positive] because [both numbers are negative].", es: "El cociente es [positivo] porque [los dos números son negativos]." },
  ],
  help: {
    en: [
      "You do not need to remember the sign rules. Ask your child to show you with a number line or a money story.",
      "Use real situations: owing money, temperatures below zero, game scores.",
      "Ask \"will the answer be positive or negative?\" before any calculating.",
      "Let your child explain in any language. Then ask \"what is the same and what is different?\"",
    ],
    es: [
      "No necesitan recordar las reglas de los signos. Pídanle a su hijo o hija que les muestre con una recta numérica o una historia de dinero.",
      "Usen situaciones reales: deber dinero, temperaturas bajo cero, puntos de un juego.",
      "Pregunten \"¿la respuesta será positiva o negativa?\" antes de calcular.",
      "Dejen que explique en el idioma que quiera. Luego pregunten \"¿qué es igual y qué es diferente?\".",
    ],
  },
  home_language: {
    en: "Say \"más\", \"menos\", \"positivo\" and \"negativo\" in Spanish as you work. Several words are close in both languages: integer (entero), rational (racional), product (producto), quotient (cociente), sign (signo). Ask your child to tell a money story in Spanish first, then write the math.",
    es: "Digan \"más\", \"menos\", \"positivo\" y \"negativo\" en español mientras trabajan. Varias palabras son parecidas en inglés: entero (integer), racional (rational), producto (product), cociente (quotient), signo (sign). Pídanle a su hijo o hija que cuente primero una historia de dinero en español y después escriba la matemática.",
  },
  celebrate: {
    en: "You will know it is working when your child can tell you, in any language, whether an answer will be positive or negative and explain why before calculating it.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda decirles, en el idioma que quiera, si una respuesta será positiva o negativa y explicar por qué antes de calcularla.",
  },
};
