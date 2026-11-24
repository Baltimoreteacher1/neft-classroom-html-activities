// BCPSS Family Guide (EN/ES) — gk-math-u3. Schema: ../schema.mjs (validateFamily)
// Home version of the Kindergarten unit on adding within 10. Vocabulary order matches ../units/gk-math-u3.mjs.

export default {
  summary: {
    en: "Your child is learning to put two groups together and tell how many in all, within 10. It matters when we add one more apple to the bag or two more kids to the table. Your child will tell an add story: first, next, and how many in all.",
    es: "Su hijo o hija está aprendiendo a juntar dos grupos y a decir cuántos hay en total, hasta 10. Sirve cuando ponemos una manzana más en la bolsa o dos niños más en la mesa. Su hijo o hija contará una historia de suma: primero, después y cuántos hay en total.",
  },
  goals: {
    en: [
      "I can add two groups within 10 and tell how many in all.",
      "I can tell my add story: first, next, and how many in all.",
    ],
    es: [
      "Puedo sumar dos grupos hasta 10 y decir cuántos hay en total.",
      "Puedo contar mi historia de suma: primero, después y cuántos hay en total.",
    ],
  },
  vocab: [
    { term: "add", def_es: "juntar grupos para saber cuántos hay en total", example_es: "Si sumo 2 uvas y 3 uvas, tengo 5." },
    { term: "join", def_es: "juntar dos grupos para hacer un solo grupo", example_es: "Voy a unir mis bloques con tus bloques." },
    { term: "plus", def_es: "la palabra del signo +, que se usa para sumar", example_es: "Dos más tres son cinco." },
    { term: "equals", def_es: "es la misma cantidad que; el signo =", example_es: "Dos más dos es igual a cuatro." },
    { term: "total", def_es: "cuántos hay cuando juntamos todos los grupos", example_es: "El total de galletas es seis." },
    { term: "equation", def_es: "una oración de matemáticas con un signo de igual", example_es: "2 + 3 = 5 es una ecuación." },
    { term: "part", def_es: "un pedazo de un número o de un grupo", example_es: "El 2 y el 3 son las partes del 5." },
    { term: "whole", def_es: "todas las partes juntas", example_es: "El todo es 5: tengo 2 rojas y 3 azules." },
    { term: "ten frame", def_es: "una caja con 2 filas de 5 espacios donde ponemos fichas", example_es: "Puse 4 fichas rojas y 3 azules en el marco de diez." },
  ],
  talk: [
    { en: "Tell me your story: what did you have first, and what came next?", es: "Cuéntame tu historia: ¿qué tenías primero y qué vino después?" },
    { en: "How many are there in all? How do you know?", es: "¿Cuántos hay en total? ¿Cómo lo sabes?" },
    { en: "Can you show me the story with your fingers or with objects?", es: "¿Puedes mostrarme la historia con los dedos o con objetos?" },
    { en: "What are the two parts? What is the whole?", es: "¿Cuáles son las dos partes? ¿Cuál es el todo?" },
    { en: "When do we add things together at home?", es: "¿Cuándo juntamos cosas en la casa?" },
  ],
  try_at_home: [
    {
      title: { en: "Add Story with Snacks", es: "Historia de suma con meriendas" },
      minutes: 10,
      materials: { en: "Grapes, crackers, or cereal pieces, and a plate", es: "Uvas, galletas o cereal, y un plato" },
      steps: {
        en: [
          "Put 3 snacks on the plate. Say: first I have 3.",
          "Add 2 more snacks. Say: next I add 2 more.",
          "Ask your child: how many in all? Count them together.",
          "Switch the numbers. Make a new story. Your child tells it out loud.",
        ],
        es: [
          "Pongan 3 meriendas en el plato. Digan: primero tengo 3.",
          "Agreguen 2 más. Digan: después sumo 2 más.",
          "Pregunten a su hijo o hija: ¿cuántas hay en total? Cuéntenlas juntos.",
          "Cambien los números. Inventen una historia nueva. Su hijo o hija la cuenta en voz alta.",
        ],
      },
    },
    {
      title: { en: "Two-Color Ten Frame", es: "Marco de diez de dos colores" },
      minutes: 10,
      materials: { en: "An egg carton cut to 10 spaces (or paper with 2 rows of 5), and two kinds of beans or coins", es: "Un cartón de huevos cortado en 10 espacios (o un papel con 2 filas de 5), y dos tipos de frijoles o monedas" },
      steps: {
        en: [
          "Say a number up to 10, like 7. Your child fills the frame with that many beans.",
          "Use one color for the first part and another color for the second part.",
          "Ask: how many of each color? How many in all?",
          "Try another way to make the same number. Same total, new parts!",
        ],
        es: [
          "Digan un número hasta 10, como 7. Su hijo o hija llena el marco con esa cantidad de frijoles.",
          "Usen un color para la primera parte y otro color para la segunda parte.",
          "Pregunten: ¿cuántos hay de cada color? ¿Cuántos hay en total?",
          "Prueben otra forma de hacer el mismo número. ¡El mismo total con partes nuevas!",
        ],
      },
    },
    {
      title: { en: "Hop and Add", es: "Salta y suma" },
      minutes: 10,
      materials: { en: "A hallway or floor space, and chalk or tape for a start line", es: "Un pasillo o un espacio en el piso, y tiza o cinta para marcar la salida" },
      steps: {
        en: [
          "Your child hops forward 3 times. Count out loud.",
          "Hop forward 2 more times. Ask: how many hops in all?",
          "Say the story: 3 plus 2 equals 5.",
          "Take turns. Choose any numbers that add up to 10 or less.",
        ],
        es: [
          "Su hijo o hija da 3 saltos hacia adelante. Cuenten en voz alta.",
          "Den 2 saltos más. Pregunten: ¿cuántos saltos en total?",
          "Digan la historia: 3 más 2 es igual a 5.",
          "Túrnense. Elijan números que sumen 10 o menos.",
        ],
      },
    },
    {
      title: { en: "Shopping Bag Add", es: "Sumar en la bolsa del mandado" },
      minutes: 10,
      materials: { en: "A bag and small things from the kitchen, like fruit, cans, or spoons", es: "Una bolsa y cosas pequeñas de la cocina, como fruta, latas o cucharas" },
      steps: {
        en: [
          "Put some things in the bag. Say how many.",
          "Add some more things. Say how many you added.",
          "Ask: how many things are in the bag now? Dump them out and count.",
          "Write or say the sentence: [number] plus [number] equals [number].",
        ],
        es: [
          "Pongan algunas cosas en la bolsa. Digan cuántas son.",
          "Agreguen algunas más. Digan cuántas agregaron.",
          "Pregunten: ¿cuántas cosas hay ahora en la bolsa? Vacíenlas y cuéntenlas.",
          "Escriban o digan la oración: [número] más [número] es igual a [número].",
        ],
      },
    },
  ],
  say_it: [
    { en: "I have [number]. I add [number]. I have [number] in all.", es: "Tengo [número]. Sumo [número]. Tengo [número] en total." },
    { en: "First I have [number] [things]. Next I add [number] more.", es: "Primero tengo [número] [cosas]. Después sumo [número] más." },
    { en: "[Number] plus [number] equals [number].", es: "[Número] más [número] es igual a [número]." },
    { en: "The total is [number] because I put the groups together.", es: "El total es [número] porque junté los grupos." },
  ],
  help: {
    en: [
      "Turn everyday moments into add stories: \"You have 2 shoes, I give you 2 more.\"",
      "Let your child use fingers, beans, or toys. Touching and moving things is how little ones learn.",
      "Say \"tell me your story\" and listen. The story is the math.",
      "You do not need the English words. Use Spanish, English, or both.",
    ],
    es: [
      "Conviertan los momentos del día en historias de suma: \"Tienes 2 zapatos, te doy 2 más\".",
      "Dejen que su hijo o hija use los dedos, frijoles o juguetes. Tocar y mover cosas es cómo aprenden los pequeños.",
      "Digan \"cuéntame tu historia\" y escuchen. La historia es la matemática.",
      "No necesitan las palabras en inglés. Usen español, inglés o los dos.",
    ],
  },
  home_language: {
    en: "Tell the add story in Spanish first: \"Tengo tres, sumo dos, tengo cinco en total.\" Then say it in English. Look for twins: \"total\" is the same word in both languages, and \"plus\" is \"más.\"",
    es: "Cuenten primero la historia de suma en español: \"Tengo tres, sumo dos, tengo cinco en total\". Luego díganla en inglés. Busquen gemelas: \"total\" es la misma palabra en los dos idiomas, y \"plus\" es \"más\".",
  },
  celebrate: {
    en: "You will know it is working when your child tells a small add story with objects and says how many there are in all, in any language.",
    es: "Sabrán que está funcionando cuando su hijo o hija cuente una historia de suma con objetos y diga cuántos hay en total, en el idioma que quiera.",
  },
};
