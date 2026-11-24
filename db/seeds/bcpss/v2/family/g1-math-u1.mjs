// BCPSS Family Guide (EN/ES) — g1-math-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 1 unit on addition and subtraction within 20. Vocabulary order matches ../units/g1-math-u1.mjs.

export default {
  summary: {
    en: "Your child is learning to add and subtract within 20 with smart strategies, like doubles, counting on, and making a ten. It matters when we count coins, share snacks, or see how many are left on the plate. Your child will say the strategy and tell why it works.",
    es: "Su hijo o hija está aprendiendo a sumar y restar hasta 20 con estrategias inteligentes, como dobles, contar hacia adelante y formar una decena. Sirve cuando contamos monedas, compartimos meriendas o vemos cuántas quedan en el plato. Su hijo o hija dirá la estrategia y explicará por qué funciona.",
  },
  goals: {
    en: [
      "I can add and subtract within 20 with a smart strategy.",
      "I can say my strategy and tell why it works.",
    ],
    es: [
      "Puedo sumar y restar hasta 20 con una estrategia inteligente.",
      "Puedo decir mi estrategia y explicar por qué funciona.",
    ],
  },
  vocab: [
    { term: "strategy", def_es: "un plan inteligente para solucionar un problema", example_es: "Mi estrategia es contar hacia adelante desde el número más grande." },
    { term: "sum", def_es: "la respuesta cuando juntas números; el resultado de una suma", example_es: "La suma de 8 y 5 es 13." },
    { term: "difference", def_es: "lo que queda cuando le quitas un número a otro; el resultado de una resta", example_es: "La diferencia entre 12 y 4 es 8." },
    { term: "doubles", def_es: "sumar un número consigo mismo", example_es: "Cuatro más cuatro es un doble: son ocho." },
    { term: "count on", def_es: "empezar en un número y decir los números que siguen", example_es: "Empiezo en 7 y cuento hacia adelante: 8, 9, 10." },
    { term: "make a ten", def_es: "mover fichas para llenar un marco de diez y luego sumar el resto", example_es: "Para sumar 9 y 4, formo una decena con 9 y 1, y me quedan 3: son 13." },
    { term: "related facts", def_es: "operaciones que usan los mismos tres números", example_es: "El 3, el 5 y el 8 forman operaciones relacionadas: 3 + 5 = 8 y 8 − 5 = 3." },
    { term: "equal", def_es: "que tiene la misma cantidad", example_es: "Cinco más tres es igual a ocho." },
    { term: "add", def_es: "juntar grupos para saber cuántos hay en total", example_es: "Si sumo 6 y 4 galletas, tengo 10." },
    { term: "subtract", def_es: "quitar algunas para saber cuántas quedan", example_es: "Si resto 3 de 10 uvas, quedan 7." },
  ],
  talk: [
    { en: "What strategy did you use? Tell me how it works.", es: "¿Qué estrategia usaste? Cuéntame cómo funciona." },
    { en: "How do you know your answer is right?", es: "¿Cómo sabes que tu respuesta es correcta?" },
    { en: "Is there another way to get the same answer?", es: "¿Hay otra manera de llegar a la misma respuesta?" },
    { en: "If you know 6 + 6, what else do you know?", es: "Si sabes 6 + 6, ¿qué más sabes?" },
    { en: "Where do we add or take away in our day?", es: "¿Dónde sumamos o quitamos en nuestro día?" },
  ],
  try_at_home: [
    {
      title: { en: "Double Trouble Snacks", es: "Meriendas dobles" },
      minutes: 10,
      materials: { en: "Crackers, grapes, or coins", es: "Galletas, uvas o monedas" },
      steps: {
        en: [
          "Put 4 snacks in one row and 4 in another. Ask: how many in all?",
          "Say: 4 plus 4 is a double. Your child says the sum.",
          "Try other doubles: 3 and 3, 5 and 5, 6 and 6.",
          "Ask: if 5 + 5 is 10, what is 5 + 6? How do you know?",
        ],
        es: [
          "Pongan 4 meriendas en una fila y 4 en otra. Pregunten: ¿cuántas hay en total?",
          "Digan: 4 más 4 es un doble. Su hijo o hija dice la suma.",
          "Prueben otros dobles: 3 y 3, 5 y 5, 6 y 6.",
          "Pregunten: si 5 + 5 es 10, ¿cuánto es 5 + 6? ¿Cómo lo sabes?",
        ],
      },
    },
    {
      title: { en: "Make a Ten with an Egg Carton", es: "Formar una decena con el cartón de huevos" },
      minutes: 10,
      materials: { en: "An egg carton cut to 10 spaces, 20 beans or coins", es: "Un cartón de huevos cortado en 10 espacios, 20 frijoles o monedas" },
      steps: {
        en: [
          "Put 8 beans in the carton. Ask: how many more to make a ten?",
          "Choose a second number, like 5. Move 2 of those beans into the carton to fill it.",
          "Ask: how many are left outside? 10 and 3 more is how many?",
          "Try 9 + 4 or 7 + 6. Your child tells how they made a ten.",
        ],
        es: [
          "Pongan 8 frijoles en el cartón. Pregunten: ¿cuántos más faltan para formar una decena?",
          "Elijan un segundo número, como 5. Pasen 2 de esos frijoles al cartón para llenarlo.",
          "Pregunten: ¿cuántos quedan afuera? ¿10 y 3 más son cuántos?",
          "Prueben 9 + 4 o 7 + 6. Su hijo o hija cuenta cómo formó la decena.",
        ],
      },
    },
    {
      title: { en: "Stair Count On", es: "Contar hacia adelante en la escalera" },
      minutes: 10,
      materials: { en: "Stairs, or a number path drawn with chalk or on paper", es: "Una escalera, o un camino de números dibujado con tiza o en papel" },
      steps: {
        en: [
          "Stand on step 8. Say: I start at 8 and add 3.",
          "Climb up 3 steps, counting on: 9, 10, 11.",
          "Ask: where did you land? What is 8 + 3?",
          "Go down to subtract: start at 11 and go back 3. Where do you land?",
        ],
        es: [
          "Párense en el escalón 8. Digan: empiezo en 8 y sumo 3.",
          "Suban 3 escalones contando hacia adelante: 9, 10, 11.",
          "Pregunten: ¿dónde llegaste? ¿Cuánto es 8 + 3?",
          "Bajen para restar: empiecen en 11 y regresen 3. ¿Dónde llegan?",
        ],
      },
    },
    {
      title: { en: "Fact Family Cards", es: "Tarjetas de la familia de operaciones" },
      minutes: 15,
      materials: { en: "Paper cut into small cards, a pencil", es: "Papel cortado en tarjetas pequeñas y un lápiz" },
      steps: {
        en: [
          "Pick three numbers that go together, like 4, 6, and 10.",
          "Write the number sentences: 4 + 6 = 10, 6 + 4 = 10, 10 − 4 = 6, 10 − 6 = 4.",
          "Ask: how are these alike? They all use the same three numbers.",
          "Make a new family with a new set of three numbers.",
        ],
        es: [
          "Elijan tres números que van juntos, como 4, 6 y 10.",
          "Escriban las operaciones: 4 + 6 = 10, 6 + 4 = 10, 10 − 4 = 6, 10 − 6 = 4.",
          "Pregunten: ¿en qué se parecen? Todas usan los mismos tres números.",
          "Formen una familia nueva con otros tres números.",
        ],
      },
    },
  ],
  say_it: [
    { en: "I used [strategy] because [reason].", es: "Usé [estrategia] porque [razón]." },
    { en: "I know [fact], so [new fact].", es: "Sé que [operación], entonces [operación nueva]." },
    { en: "The [sum / difference] is [number].", es: "La [suma / diferencia] es [número]." },
    { en: "I made a ten with [number] and [number], so I have [number].", es: "Formé una decena con [número] y [número], entonces tengo [número]." },
  ],
  help: {
    en: [
      "Ask questions and listen. Your child is the expert and can teach you the strategy.",
      "Say \"show me\" and \"why does that work?\" in any language.",
      "Use real things, like snacks, coins, and beans. Let fingers and objects help.",
      "If an answer is not right, ask \"what could you try next?\" before saying it is wrong.",
    ],
    es: [
      "Hagan preguntas y escuchen. Su hijo o hija es el experto y puede enseñarles la estrategia.",
      "Digan \"muéstrame\" y \"¿por qué funciona eso?\" en cualquier idioma.",
      "Usen cosas de verdad, como meriendas, monedas y frijoles. Dejen que los dedos y los objetos ayuden.",
      "Si una respuesta no es correcta, pregunten \"¿qué podrías probar ahora?\" antes de decir que está mal.",
    ],
  },
  home_language: {
    en: "Explain a strategy in Spanish first, in your own words, then find the English word together. \"Suma,\" \"diferencia,\" and \"estrategia\" sound a lot like \"sum,\" \"difference,\" and \"strategy,\" so your child already knows them.",
    es: "Expliquen primero una estrategia en español, con sus propias palabras, y luego busquen juntos la palabra en inglés. \"Suma\", \"diferencia\" y \"estrategia\" suenan muy parecido a \"sum\", \"difference\" y \"strategy\", así que su hijo o hija ya las conoce.",
  },
  celebrate: {
    en: "You will know it is working when your child solves a small add or take-away problem and tells you which strategy they used and why it works.",
    es: "Sabrán que está funcionando cuando su hijo o hija resuelva un problema pequeño de sumar o quitar y les diga qué estrategia usó y por qué funciona.",
  },
};
