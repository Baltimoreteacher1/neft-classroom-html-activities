// BCPSS Family Guide (EN/ES) — g5-math-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on adding and subtracting fractions with unlike denominators. Vocabulary order matches ../units/g5-math-u4.mjs.

export default {
  summary: {
    en: "Your child is learning to add and subtract fractions and mixed numbers when the bottom numbers are different, by renaming them so the parts are the same size. It matters when someone combines recipe amounts, cuts ribbon, or shares a pizza. Your child will prove that a method works and that an answer is reasonable, in any language.",
    es: "Su hijo o hija está aprendiendo a sumar y restar fracciones y números mixtos cuando los números de abajo son distintos, cambiando el nombre de las fracciones para que las partes sean del mismo tamaño. Sirve cuando alguien junta cantidades de una receta, corta una cinta o reparte una pizza. Su hijo o hija comprobará que un método funciona y que una respuesta es razonable, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can add and subtract fractions and mixed numbers with unlike denominators.",
      "I can use benchmark fractions like 1/2 and 1 to check that my answer is reasonable.",
      "I can justify my method with because, since, and that works because.",
    ],
    es: [
      "Puedo sumar y restar fracciones y números mixtos con denominadores distintos.",
      "Puedo usar fracciones de referencia como 1/2 y 1 para comprobar que mi respuesta es razonable.",
      "Puedo justificar mi método con porque, ya que y eso funciona porque.",
    ],
  },
  vocab: [
    { term: "numerator", def_es: "el número de arriba en una fracción; dice cuántas partes tienes", example_es: "En 5/6, el numerador es 5." },
    { term: "denominator", def_es: "el número de abajo en una fracción; dice cuántas partes iguales forman un entero", example_es: "En 5/6, el denominador es 6." },
    { term: "common denominator", def_es: "un múltiplo compartido de los números de abajo de dos fracciones, para que las partes sean del mismo tamaño", example_es: "Un denominador común de 1/2 y 1/3 es 6." },
    { term: "equivalent fraction", def_es: "una fracción que nombra la misma cantidad que otra, como 1/2 y 3/6", example_es: "3/6 es una fracción equivalente a 1/2." },
    { term: "mixed number", def_es: "un número formado por un número entero y una fracción, como 2 1/4", example_es: "2 1/2 es un número mixto." },
    { term: "benchmark fraction", def_es: "una fracción fácil como 0, 1/2 o 1 que te ayuda a juzgar otras fracciones", example_es: "3/8 es un poco menos que la fracción de referencia 1/2." },
    { term: "sum", def_es: "la respuesta de una suma", example_es: "La suma de 1/2 y 1/3 es 5/6." },
    { term: "difference", def_es: "la respuesta de una resta", example_es: "La diferencia entre 2 1/2 y 3/4 es 1 3/4." },
    { term: "justify", def_es: "mostrar con razones que tu respuesta o tu método es correcto", example_es: "Justifico mi método porque solo se pueden sumar partes del mismo tamaño." },
    { term: "reasonable", def_es: "que tiene sentido y está cerca de lo que esperabas", example_es: "Mi respuesta es razonable porque está cerca de 1." },
  ],
  talk: [
    { en: "Why can we only add fractions when the parts are the same size?", es: "¿Por qué solo podemos sumar fracciones cuando las partes son del mismo tamaño?" },
    { en: "How did you find a common denominator?", es: "¿Cómo hallaste un denominador común?" },
    { en: "Is your answer close to 0, 1/2, or 1? Does that make sense?", es: "¿Tu respuesta está cerca de 0, 1/2 o 1? ¿Tiene sentido?" },
    { en: "Can you prove your method works? Show me a picture.", es: "¿Puedes demostrar que tu método funciona? Muéstrame un dibujo." },
    { en: "Where do we add or subtract fractions at home?", es: "¿Dónde sumamos o restamos fracciones en casa?" },
  ],
  try_at_home: [
    {
      title: { en: "Half Plus a Third", es: "Un medio más un tercio" },
      minutes: 15,
      materials: { en: "2 paper strips of the same length, a marker", es: "2 tiras de papel del mismo largo y un marcador" },
      steps: {
        en: [
          "Fold one strip in half. Shade 1/2. Fold the other strip into thirds. Shade 1/3.",
          "Ask: can we add these now? The parts are not the same size.",
          "Fold both strips into sixths. 1/2 becomes 3/6, and 1/3 becomes 2/6.",
          "Add: 3/6 + 2/6 = 5/6. Ask: why did we need the same size parts?",
        ],
        es: [
          "Doblen una tira por la mitad. Sombreen 1/2. Doblen la otra tira en tercios. Sombreen 1/3.",
          "Pregunten: ¿podemos sumarlos ahora? Las partes no son del mismo tamaño.",
          "Doblen las dos tiras en sextos. 1/2 se convierte en 3/6 y 1/3 en 2/6.",
          "Sumen: 3/6 + 2/6 = 5/6. Pregunten: ¿por qué necesitábamos partes del mismo tamaño?",
        ],
      },
    },
    {
      title: { en: "Ribbon Cut", es: "Corte de cinta" },
      minutes: 15,
      materials: { en: "A string or strip of paper about 2 1/2 feet long, a ruler or measuring tape, scissors", es: "Un hilo o una tira de papel de unos 2 1/2 pies de largo, una regla o cinta métrica y tijeras" },
      steps: {
        en: [
          "Say: we have 2 1/2 feet of ribbon and we cut off 3/4 foot. How much is left?",
          "Rename with a common denominator: 2 1/2 = 2 2/4, which is 10/4.",
          "Subtract: 10/4 − 3/4 = 7/4. As a mixed number, that is 1 3/4 feet.",
          "Cut the string and measure the leftover. Does it match? Is it reasonable?",
        ],
        es: [
          "Digan: tenemos 2 1/2 pies de cinta y cortamos 3/4 de pie. ¿Cuánto queda?",
          "Cambien el nombre con un denominador común: 2 1/2 = 2 2/4, que es 10/4.",
          "Resten: 10/4 − 3/4 = 7/4. Como número mixto, son 1 3/4 pies.",
          "Corten el hilo y midan lo que sobra. ¿Coincide? ¿Es razonable?",
        ],
      },
    },
    {
      title: { en: "Benchmark Check", es: "Revisar con una referencia" },
      minutes: 10,
      materials: { en: "Paper and a pencil", es: "Papel y lápiz" },
      steps: {
        en: [
          "Say: a recipe uses 3/8 cup of oil and 1/2 cup of milk. About how much liquid in all?",
          "Estimate first: 3/8 is a little less than 1/2, so the total is a little less than 1.",
          "Rename 1/2 as 4/8. Add: 3/8 + 4/8 = 7/8.",
          "Ask: is 7/8 reasonable? Is it a little less than 1? Say why.",
        ],
        es: [
          "Digan: una receta usa 3/8 de taza de aceite y 1/2 taza de leche. ¿Cuánto líquido hay más o menos en total?",
          "Estimen primero: 3/8 es un poco menos que 1/2, así que el total es un poco menos que 1.",
          "Cambien 1/2 por 4/8. Sumen: 3/8 + 4/8 = 7/8.",
          "Pregunten: ¿es razonable 7/8? ¿Es un poco menos que 1? Digan por qué.",
        ],
      },
    },
    {
      title: { en: "Pizza Night", es: "Noche de pizza" },
      minutes: 15,
      materials: { en: "2 paper circles or plates the same size, scissors, a marker", es: "2 círculos de papel o platos del mismo tamaño, tijeras y un marcador" },
      steps: {
        en: [
          "Say: one person ate 1/4 of a pizza and another ate 2/3 of the same pizza. How much was eaten?",
          "Cut a paper circle into twelfths. A common denominator of 4 and 3 is 12.",
          "Rename: 1/4 = 3/12 and 2/3 = 8/12. Add: 3/12 + 8/12 = 11/12.",
          "Ask: how much is left? (1/12.) Check: 11/12 + 1/12 = 12/12, a whole pizza.",
        ],
        es: [
          "Digan: una persona se comió 1/4 de una pizza y otra se comió 2/3 de la misma pizza. ¿Cuánto se comieron?",
          "Corten un círculo de papel en doceavos. Un denominador común de 4 y 3 es 12.",
          "Cambien los nombres: 1/4 = 3/12 y 2/3 = 8/12. Sumen: 3/12 + 8/12 = 11/12.",
          "Pregunten: ¿cuánto queda? (1/12.) Comprueben: 11/12 + 1/12 = 12/12, una pizza entera.",
        ],
      },
    },
  ],
  say_it: [
    { en: "I renamed [fraction] and [fraction] with a common denominator of [number] because [reason].", es: "Cambié el nombre de [fracción] y [fracción] con un denominador común de [número] porque [razón]." },
    { en: "The sum is [fraction], and it is reasonable because it is close to [benchmark fraction].", es: "La suma es [fracción], y es razonable porque está cerca de [fracción de referencia]." },
    { en: "To subtract, I changed [fraction] to [fraction], so the difference is [fraction].", es: "Para restar, cambié [fracción] a [fracción], entonces la diferencia es [fracción]." },
    { en: "That works because ___.", es: "Eso funciona porque ___." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child can teach you.",
      "Use folded paper, measuring cups, or a pizza. Same-size parts are easier to see than to explain.",
      "Ask \"Is your answer close to 1/2 or 1?\" This builds a habit of checking.",
      "Let your child explain why the method works, even if it is slow. Reasons matter more than speed.",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija puede enseñarles.",
      "Usen papel doblado, tazas medidoras o una pizza. Las partes del mismo tamaño se ven más fácil de lo que se explican.",
      "Pregunten \"¿tu respuesta está cerca de 1/2 o de 1?\". Esto crea el hábito de comprobar.",
      "Dejen que explique por qué funciona el método, aunque sea despacio. Las razones importan más que la rapidez.",
    ],
  },
  home_language: {
    en: "Tell the recipe in Spanish first: \"un medio de taza más un tercio.\" Then find the English words together. Fracción, numerador, denominador, equivalente, justificar, and razonable sound a lot like fraction, numerator, denominator, equivalent, justify, and reasonable, so your child already knows them.",
    es: "Cuenten primero la receta en español: \"un medio de taza más un tercio\". Luego busquen juntos las palabras en inglés. Fracción, numerador, denominador, equivalente, justificar y razonable suenan muy parecido a fraction, numerator, denominator, equivalent, justify y reasonable, así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child adds two fractions with different bottom numbers and tells you, in any language, why the answer is reasonable.",
    es: "Sabrán que está funcionando cuando su hijo o hija sume dos fracciones con números de abajo distintos y les cuente, en el idioma que quiera, por qué la respuesta es razonable.",
  },
};
