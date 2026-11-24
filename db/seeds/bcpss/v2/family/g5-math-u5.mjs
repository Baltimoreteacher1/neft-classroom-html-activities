// BCPSS Family Guide (EN/ES) — g5-math-u5. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on multiplying fractions, scaling, and dividing with unit fractions. Vocabulary order matches ../units/g5-math-u5.mjs.

export default {
  summary: {
    en: "Your child is learning what happens when you multiply by a fraction: the amount can get smaller, just like taking half of a recipe, or larger when the factor is more than 1. Your child also multiplies fractions with area models and divides with unit fractions. It matters in cooking, sewing, and sharing. Your child will compare how multiplying by a fraction is like and unlike multiplying by a whole number, in any language.",
    es: "Su hijo o hija está aprendiendo qué pasa cuando se multiplica por una fracción: la cantidad puede hacerse más pequeña, como al tomar la mitad de una receta, o más grande cuando el factor es mayor que 1. También multiplica fracciones con modelos de área y divide con fracciones unitarias. Sirve al cocinar, coser y repartir. Su hijo o hija comparará en qué se parece y en qué se diferencia multiplicar por una fracción de multiplicar por un número entero, en el idioma que quiera.",
  },
  goals: {
    en: [
      "I can multiply fractions by scaling and with an area model.",
      "I can divide a whole number by a unit fraction and a unit fraction by a whole number.",
      "I can compare ideas with both, but, whereas, and in contrast.",
    ],
    es: [
      "Puedo multiplicar fracciones con cambio de escala y con un modelo de área.",
      "Puedo dividir un número entero entre una fracción unitaria y una fracción unitaria entre un número entero.",
      "Puedo comparar ideas con ambos, pero, mientras que y en contraste.",
    ],
  },
  vocab: [
    { term: "unit fraction", def_es: "una fracción con un 1 arriba, que muestra una parte igual de un entero", example_es: "1/4 es una fracción unitaria." },
    { term: "scaling", def_es: "hacer un número o una cantidad más grande o más pequeña multiplicándola por un factor", example_es: "Tomar la mitad de una receta es un cambio de escala." },
    { term: "factor", def_es: "un número que se multiplica por otro número", example_es: "En 1/2 × 6, los factores son 1/2 y 6." },
    { term: "product", def_es: "la respuesta de una multiplicación", example_es: "El producto de 1/2 × 6 es 3." },
    { term: "area model", def_es: "un rectángulo dibujado para mostrar una multiplicación, donde el área es la respuesta", example_es: "En el modelo de área de 1/2 × 1/3, el área es 1/6." },
    { term: "partition", def_es: "dividir un entero en partes iguales", example_es: "Voy a partir la tira en tres partes iguales." },
    { term: "quotient", def_es: "la respuesta de una división", example_es: "El cociente de 3 ÷ 1/4 es 12." },
    { term: "compare", def_es: "decir en qué se parecen dos cosas", example_es: "Comparo 1/2 × 6 y 2 × 6." },
    { term: "contrast", def_es: "decir en qué se diferencian dos cosas", example_es: "En contraste, 1/2 × 6 da menos que 6, y 2 × 6 da más que 6." },
  ],
  talk: [
    { en: "What happens to a number when you multiply it by a fraction less than 1?", es: "¿Qué le pasa a un número cuando lo multiplicas por una fracción menor que 1?" },
    { en: "How is multiplying by 1/2 like multiplying by 2? How is it different?", es: "¿En qué se parece multiplicar por 1/2 a multiplicar por 2? ¿En qué se diferencia?" },
    { en: "Show me an area model for a fraction times a fraction.", es: "Muéstrame un modelo de área de una fracción por una fracción." },
    { en: "How many pieces fit in the whole when each piece is a unit fraction?", es: "¿Cuántas partes caben en el entero cuando cada parte es una fracción unitaria?" },
    { en: "When do we take part of a part at home?", es: "¿Cuándo tomamos una parte de una parte en casa?" },
  ],
  try_at_home: [
    {
      title: { en: "Half the Recipe, Double the Recipe", es: "Media receta, receta doble" },
      minutes: 10,
      materials: { en: "Paper and a pencil; a recipe card if you have one", es: "Papel y lápiz; una tarjeta de receta si tienen" },
      steps: {
        en: [
          "Say: a recipe uses 6 cups of flour. What if we make half the recipe? Find 1/2 × 6 = 3 cups.",
          "Now double it: 2 × 6 = 12 cups.",
          "Ask: both multiply 6, but what is different? One makes it smaller and one makes it larger.",
          "Try another amount from your recipe. Which factors make the amount smaller? Which make it larger?",
        ],
        es: [
          "Digan: una receta usa 6 tazas de harina. ¿Y si hacemos la mitad de la receta? Hallen 1/2 × 6 = 3 tazas.",
          "Ahora dóblenla: 2 × 6 = 12 tazas.",
          "Pregunten: las dos multiplican 6, pero ¿qué es distinto? Una lo hace más pequeño y la otra más grande.",
          "Prueben con otra cantidad de su receta. ¿Qué factores hacen la cantidad más pequeña? ¿Y cuáles la hacen más grande?",
        ],
      },
    },
    {
      title: { en: "Fold a Part of a Part", es: "Doblar una parte de una parte" },
      minutes: 15,
      materials: { en: "A sheet of paper, a marker or crayon", es: "Una hoja de papel y un marcador o crayón" },
      steps: {
        en: [
          "Fold the paper into 2 equal parts the long way. Shade one half.",
          "Fold the paper into 3 equal parts the other way. Shade 1/3 of the shaded half.",
          "Count: the paper is now cut into 6 equal parts, and 1 part is shaded twice. That is 1/2 × 1/3 = 1/6.",
          "Ask: why is the product smaller than both 1/2 and 1/3?",
        ],
        es: [
          "Doblen el papel en 2 partes iguales a lo largo. Sombreen una mitad.",
          "Doblen el papel en 3 partes iguales en el otro sentido. Sombreen 1/3 de la mitad sombreada.",
          "Cuenten: el papel ahora está cortado en 6 partes iguales y 1 parte está sombreada dos veces. Eso es 1/2 × 1/3 = 1/6.",
          "Pregunten: ¿por qué el producto es menor que 1/2 y que 1/3?",
        ],
      },
    },
    {
      title: { en: "How Many Scoops?", es: "¿Cuántas cucharadas?" },
      minutes: 10,
      materials: { en: "A 1/4 measuring cup, rice or water, a 1-cup measure", es: "Una taza medidora de 1/4, arroz o agua, y una taza de 1" },
      steps: {
        en: [
          "Say: how many 1/4-cup scoops fill 1 cup? (4.) So 1 ÷ 1/4 = 4.",
          "Now fill 3 cups using the 1/4 scoop. Count the scoops. (12.) So 3 ÷ 1/4 = 12.",
          "Ask: why is the quotient bigger than 3? (Each scoop is small, so you need many.)",
          "Share 1/3 cup of rice equally between 2 bowls. Each gets 1/6 cup, because 1/3 split in 2 makes sixths.",
        ],
        es: [
          "Digan: ¿cuántas cucharadas de 1/4 de taza llenan 1 taza? (4.) Entonces 1 ÷ 1/4 = 4.",
          "Ahora llenen 3 tazas usando la medida de 1/4. Cuenten las cucharadas. (12.) Entonces 3 ÷ 1/4 = 12.",
          "Pregunten: ¿por qué el cociente es mayor que 3? (Cada cucharada es pequeña, así que hacen falta muchas.)",
          "Repartan 1/3 de taza de arroz por igual en 2 tazones. Cada uno recibe 1/6 de taza, porque 1/3 dividido en 2 forma sextos.",
        ],
      },
    },
    {
      title: { en: "Stretch and Shrink", es: "Estirar y encoger" },
      minutes: 15,
      materials: { en: "A piece of string or paper strip 8 inches long, a ruler, scissors", es: "Un hilo o una tira de papel de 8 pulgadas de largo, una regla y tijeras" },
      steps: {
        en: [
          "Start with an 8-inch strip. Predict: will 3/4 of it be longer or shorter? Then cut 3/4 × 8 = 6 inches.",
          "Now predict 3/2 of it (which is more than 1). It should be longer: 3/2 × 8 = 12 inches.",
          "Ask: both are scaling the strip, but what makes one shorter and one longer?",
          "Say it: \"Both 3/4 × 8 and 3/2 × 8 scale 8, but 3/4 × 8 makes it smaller whereas 3/2 × 8 makes it larger.\"",
        ],
        es: [
          "Empiecen con una tira de 8 pulgadas. Predigan: ¿3/4 de ella será más larga o más corta? Luego corten 3/4 × 8 = 6 pulgadas.",
          "Ahora predigan 3/2 de ella (que es más que 1). Debe ser más larga: 3/2 × 8 = 12 pulgadas.",
          "Pregunten: las dos cambian la escala de la tira, pero ¿qué hace que una sea más corta y otra más larga?",
          "Díganlo: \"Tanto 3/4 × 8 como 3/2 × 8 cambian la escala de 8, pero 3/4 × 8 la hace más pequeña, mientras que 3/2 × 8 la hace más grande\".",
        ],
      },
    },
  ],
  say_it: [
    { en: "Both [problem] and [problem] are [scaling], but [problem] makes the number [smaller / larger].", es: "Tanto [problema] como [problema] son [cambio de escala], pero [problema] hace el número [más pequeño / más grande]." },
    { en: "The product of [problem] is [number], whereas the product of [problem] is [number].", es: "El producto de [problema] es [número], mientras que el producto de [problema] es [número]." },
    { en: "A unit fraction has a numerator of [number], like [fraction].", es: "Una fracción unitaria tiene un numerador de [número], como [fracción]." },
    { en: "In contrast, ___.", es: "En contraste, ___." },
  ],
  help: {
    en: [
      "Ask questions and listen. You do not need to know the answer. Your child can teach you.",
      "Ask \"Will the answer be bigger or smaller than the starting number? Why?\" before any calculating.",
      "Use real recipes, string, and folded paper. Taking a part of a part is something you can fold.",
      "Let your child compare two problems side by side. Comparing is the heart of this unit.",
    ],
    es: [
      "Hagan preguntas y escuchen. No necesitan saber la respuesta. Su hijo o hija puede enseñarles.",
      "Pregunten \"¿la respuesta será más grande o más pequeña que el número inicial? ¿Por qué?\" antes de calcular.",
      "Usen recetas reales, hilo y papel doblado. Tomar una parte de una parte es algo que se puede doblar.",
      "Dejen que compare dos problemas lado a lado. Comparar es el corazón de esta unidad.",
    ],
  },
  home_language: {
    en: "Talk about cooking in Spanish first: \"la mitad de la receta, el doble.\" Then say it in English. Fracción, factor, producto, cociente, comparar, and contrastar sound a lot like fraction, factor, product, quotient, compare, and contrast, so your child already knows them.",
    es: "Hablen primero de cocinar en español: \"la mitad de la receta, el doble\". Luego díganlo en inglés. Fracción, factor, producto, cociente, comparar y contrastar suenan muy parecido a fraction, factor, product, quotient, compare y contrast, así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child predicts whether a product will be bigger or smaller and explains, in any language, why.",
    es: "Sabrán que está funcionando cuando su hijo o hija prediga si un producto será más grande o más pequeño y explique, en el idioma que quiera, por qué.",
  },
};
