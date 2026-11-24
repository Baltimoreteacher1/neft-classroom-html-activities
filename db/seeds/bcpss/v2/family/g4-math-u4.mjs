// BCPSS Family Guide (EN/ES) — g4-math-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on adding, subtracting and multiplying fractions. Vocabulary order matches ../units/g4-math-u4.mjs.

export default {
  summary: {
    en: "Your child is learning to add and subtract fractions and mixed numbers, and to multiply a fraction by a whole number. It matters when someone doubles a recipe, shares leftovers, or measures with cups and spoons. Your child will explain each step in order, in any language.",
    es: "Su hijo o hija está aprendiendo a sumar y restar fracciones y números mixtos, y a multiplicar una fracción por un número entero. Sirve cuando alguien dobla una receta, reparte las sobras o mide con tazas y cucharas. Su hijo o hija explicará cada paso en orden, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can add and subtract fractions and mixed numbers with the same denominator.",
      "I can compose and decompose fractions, like 7/4 and 1 3/4.",
      "I can multiply a whole number by a fraction and explain my steps with first, next, then, and finally.",
    ],
    es: [
      "Puedo sumar y restar fracciones y números mixtos con el mismo denominador.",
      "Puedo componer y descomponer fracciones, como 7/4 y 1 3/4.",
      "Puedo multiplicar un número entero por una fracción y explicar mis pasos con primero, después, luego y por último.",
    ],
  },
  vocab: [
    { term: "unit fraction", def_es: "una fracción que tiene 1 como número de arriba", example_es: "1/4 es una fracción unitaria." },
    { term: "mixed number", def_es: "un número formado por un número entero y una fracción juntos", example_es: "1 3/4 es un número mixto: un entero y tres cuartos." },
    { term: "improper fraction", def_es: "una fracción cuyo número de arriba es mayor o igual que el de abajo", example_es: "7/4 es una fracción impropia porque 7 es mayor que 4." },
    { term: "compose", def_es: "juntar partes más pequeñas para formar un número más grande", example_es: "Compongo 4/4 y 3/4 para formar 1 3/4." },
    { term: "decompose", def_es: "separar un número en partes más pequeñas", example_es: "Descompongo 7/4 en 4/4 y 3/4." },
    { term: "like denominators", def_es: "el mismo número de abajo en dos o más fracciones", example_es: "3/4 y 3/4 tienen denominadores iguales." },
    { term: "sum", def_es: "la respuesta de una suma", example_es: "La suma de 3/4 y 3/4 es 6/4." },
    { term: "difference", def_es: "la respuesta de una resta", example_es: "La diferencia entre 7/8 y 3/8 es 4/8." },
    { term: "whole number", def_es: "un número como 0, 3 o 12 que no tiene parte de fracción", example_es: "En 3 × 3/4, el 3 es un número entero." },
  ],
  talk: [
    { en: "What did you add, subtract, or multiply today? Walk me through the steps in order.", es: "¿Qué sumaste, restaste o multiplicaste hoy? Cuéntame los pasos en orden." },
    { en: "Why do we add only the top numbers when the bottom numbers are the same?", es: "¿Por qué sumamos solo los números de arriba cuando los de abajo son iguales?" },
    { en: "Can you show me 7/4 as a mixed number?", es: "¿Puedes mostrarme 7/4 como número mixto?" },
    { en: "How is 3 × 3/4 like adding 3/4 three times?", es: "¿En qué se parece 3 × 3/4 a sumar 3/4 tres veces?" },
    { en: "Where do fractions show up in the kitchen?", es: "¿Dónde aparecen las fracciones en la cocina?" },
  ],
  try_at_home: [
    {
      title: { en: "Two Scoops of Three Fourths", es: "Dos veces tres cuartos" },
      minutes: 15,
      materials: { en: "A 1/4 measuring cup, rice or water, a bowl, a 1-cup measure if you have one", es: "Una taza medidora de 1/4, arroz o agua, un tazón y una taza de 1 si tienen" },
      steps: {
        en: [
          "Say: a recipe needs 3/4 cup of rice, and we want to make it twice. How much rice?",
          "Scoop the 1/4 cup into the bowl 6 times (3 for the first batch, 3 for the second).",
          "Write it: 3/4 + 3/4 = 6/4. The denominators are the same, so we add only the numerators.",
          "Pour the rice into a 1-cup measure. How many whole cups? (1 cup and 2/4 more, so 1 2/4.)",
        ],
        es: [
          "Digan: una receta necesita 3/4 de taza de arroz y queremos hacerla dos veces. ¿Cuánto arroz hace falta?",
          "Echen la taza de 1/4 en el tazón 6 veces (3 para la primera tanda y 3 para la segunda).",
          "Escríbanlo: 3/4 + 3/4 = 6/4. Los denominadores son iguales, así que sumamos solo los numeradores.",
          "Vacíen el arroz en una taza de 1. ¿Cuántas tazas enteras hay? (1 taza y 2/4 más, o sea 1 2/4.)",
        ],
      },
    },
    {
      title: { en: "Strip Compose", es: "Componer con tiras" },
      minutes: 15,
      materials: { en: "2 paper strips of the same length, a marker", es: "2 tiras de papel del mismo largo y un marcador" },
      steps: {
        en: [
          "Fold each strip into 4 equal parts. Each part is 1/4. Write 1/4 on every part.",
          "Count 7 of the fourths: all 4 on the first strip and 3 on the second. That is 7/4.",
          "Ask: how many whole strips is that? (1 whole strip and 3 more fourths.)",
          "Write 7/4 = 4/4 + 3/4 = 1 3/4. Say what you did first, next, and finally.",
        ],
        es: [
          "Doblen cada tira en 4 partes iguales. Cada parte es 1/4. Escriban 1/4 en cada parte.",
          "Cuenten 7 cuartos: los 4 de la primera tira y 3 de la segunda. Eso es 7/4.",
          "Pregunten: ¿cuántas tiras enteras hay? (1 tira entera y 3 cuartos más.)",
          "Escriban 7/4 = 4/4 + 3/4 = 1 3/4. Digan qué hicieron primero, después y por último.",
        ],
      },
    },
    {
      title: { en: "Leftover Pizza", es: "Pizza sobrante" },
      minutes: 10,
      materials: { en: "A paper circle or paper plate, scissors, a marker", es: "Un círculo de papel o un plato de papel, tijeras y un marcador" },
      steps: {
        en: [
          "Cut the circle into 8 equal slices. This is a whole pizza, or 8/8.",
          "Say: we ate 3/8 of the pizza. How much is left? Take 3 slices away and count the rest.",
          "Write it: 8/8 − 3/8 = 5/8. The bottom numbers are the same, so we subtract only the tops.",
          "Say: now we eat 2/8 more. How much is left? (5/8 − 2/8 = 3/8.)",
        ],
        es: [
          "Corten el círculo en 8 rebanadas iguales. Esta es una pizza entera, u 8/8.",
          "Digan: nos comimos 3/8 de la pizza. ¿Cuánto queda? Quiten 3 rebanadas y cuenten las demás.",
          "Escríbanlo: 8/8 − 3/8 = 5/8. Los números de abajo son iguales, así que restamos solo los de arriba.",
          "Digan: ahora nos comemos 2/8 más. ¿Cuánto queda? (5/8 − 2/8 = 3/8.)",
        ],
      },
    },
    {
      title: { en: "Triple Batch", es: "Triple tanda" },
      minutes: 15,
      materials: { en: "Paper and a pencil; a measuring cup if you want to try it", es: "Papel y lápiz; una taza medidora si quieren probarlo" },
      steps: {
        en: [
          "Say: one batch of pancakes uses 3/4 cup of flour. We want 3 batches. How much flour?",
          "Draw 3 groups of 3/4. Ask: how many fourths in all? (3 groups of 3 fourths is 9 fourths.)",
          "Write it: 3 × 3/4 = 9/4. Ask your child to decompose it: 9/4 = 4/4 + 4/4 + 1/4.",
          "Write the mixed number: 2 1/4 cups. Check: 3/4 is a little less than 1, so is 2 1/4 a little less than 3?",
        ],
        es: [
          "Digan: una tanda de panqueques usa 3/4 de taza de harina. Queremos 3 tandas. ¿Cuánta harina hace falta?",
          "Dibujen 3 grupos de 3/4. Pregunten: ¿cuántos cuartos hay en total? (3 grupos de 3 cuartos son 9 cuartos.)",
          "Escríbanlo: 3 × 3/4 = 9/4. Pidan a su hijo o hija que lo descomponga: 9/4 = 4/4 + 4/4 + 1/4.",
          "Escriban el número mixto: 2 1/4 tazas. Comprueben: 3/4 es un poco menos que 1, ¿2 1/4 es un poco menos que 3?",
        ],
      },
    },
  ],
  say_it: [
    { en: "First, I decomposed [fraction] into [unit fractions]; next, I composed ___.", es: "Primero, descompuse [fracción] en [fracciones unitarias]; después, compuse ___." },
    { en: "The denominators are the same, so I add only the [numerators].", es: "Los denominadores son iguales, entonces sumo solo los [numeradores]." },
    { en: "I multiplied [whole number] × [fraction] by thinking of [number] groups of [fraction].", es: "Multipliqué [número entero] × [fracción] pensando en [número] grupos de [fracción]." },
    { en: "Finally, I wrote the answer as a [mixed number].", es: "Por último, escribí la respuesta como un [número mixto]." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child can teach you.",
      "Ask for the steps in order: \"What did you do first? What next?\" Order helps your child check the work.",
      "Use measuring cups, spoons, and folded paper. Real parts make fractions clear.",
      "Let a mistake be a clue. Ask, \"What does your picture show?\"",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija puede enseñarles.",
      "Pidan los pasos en orden: \"¿Qué hiciste primero? ¿Y después?\". El orden ayuda a revisar el trabajo.",
      "Usen tazas medidoras, cucharas y papel doblado. Las partes reales hacen claras las fracciones.",
      "Dejen que un error sea una pista. Pregunten: \"¿qué muestra tu dibujo?\".",
    ],
  },
  home_language: {
    en: "Say recipe measures in Spanish first: \"tres cuartos de taza, una taza y media.\" Then say them in English. Fracción, componer, descomponer, and número mixto have close English partners (fraction, compose, decompose, mixed number), so your child already knows them.",
    es: "Digan primero las medidas de una receta en español: \"tres cuartos de taza, una taza y media\". Luego díganlas en inglés. Fracción, componer, descomponer y número mixto tienen compañeras muy parecidas en inglés (fraction, compose, decompose, mixed number), así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child doubles or triples a recipe with fractions and explains, in any language, each step in order.",
    es: "Sabrán que está funcionando cuando su hijo o hija duplique o triplique una receta con fracciones y explique, en el idioma que quiera, cada paso en orden.",
  },
};
