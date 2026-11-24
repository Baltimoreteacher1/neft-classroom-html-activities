// BCPSS Family Guide (EN/ES) — gk-math-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the Kindergarten unit on counting to 10. Vocabulary order matches ../units/gk-math-u1.mjs.

export default {
  summary: {
    en: "Your child is learning to count up to 10 things and tell how many there are. Touch each thing one time and say one number. It matters every time we count snacks, stairs, or the stops on the bus. Your child will practice saying the last number to tell how many.",
    es: "Su hijo o hija está aprendiendo a contar hasta 10 cosas y a decir cuántas hay. Se toca cada cosa una sola vez y se dice un número. Sirve cada vez que contamos galletas, escalones o las paradas del autobús. Su hijo o hija practicará decir el último número para contar cuántas hay.",
  },
  goals: {
    en: [
      "I can count up to 10 things and tell how many.",
      "I can say how I know, with the last number I said.",
    ],
    es: [
      "Puedo contar hasta 10 cosas y decir cuántas hay.",
      "Puedo decir cómo lo sé, con el último número que dije.",
    ],
  },
  vocab: [
    { term: "count", def_es: "decir los números en orden mientras tocas cada cosa, una por una", example_es: "Voy a contar mis galletas: uno, dos, tres." },
    { term: "number", def_es: "una palabra o un signo que dice cuántas cosas hay, como 5", example_es: "El número 4 me dice que hay cuatro uvas." },
    { term: "group", def_es: "cosas que están juntas en un mismo lugar, como los zapatos de la familia", example_es: "Hay un grupo de cinco calcetines en la cama." },
    { term: "how many", def_es: "las palabras que usamos para preguntar la cantidad de cosas", example_es: "¿Cuántos botones hay en la camisa?" },
    { term: "zero", def_es: "el número para cuando no hay ninguna cosa; el plato está vacío", example_es: "Me comí todas las uvas, ahora tengo cero." },
    { term: "ten frame", def_es: "una caja con 2 filas de 5 espacios donde ponemos fichas o frijoles", example_es: "Puse siete frijoles en el marco de diez." },
    { term: "row", def_es: "cosas puestas una al lado de otra en una línea", example_es: "Hice una fila con cinco botones." },
    { term: "dot", def_es: "un puntito redondo, como los de un dado", example_es: "Este lado del dado tiene seis puntos." },
    { term: "last", def_es: "el que está al final de todos", example_es: "El último número que dije es el siete." },
  ],
  talk: [
    { en: "How many are there? Show me how you counted.", es: "¿Cuántos hay? Muéstrame cómo los contaste." },
    { en: "How do you know there are that many?", es: "¿Cómo sabes que hay tantos?" },
    { en: "What was the last number you said?", es: "¿Cuál fue el último número que dijiste?" },
    { en: "Can you count them again in a different order? Is it the same?", es: "¿Puedes contarlos otra vez en otro orden? ¿Sale igual?" },
    { en: "Where do we count things at home or on the way to school?", es: "¿Dónde contamos cosas en la casa o camino a la escuela?" },
  ],
  try_at_home: [
    {
      title: { en: "Snack Counting", es: "Contar la merienda" },
      minutes: 5,
      materials: { en: "A handful of crackers, grapes, or cereal pieces, and a plate", es: "Un puñado de galletas, uvas o cereal, y un plato" },
      steps: {
        en: [
          "Put up to 10 snacks on the plate. Ask your child: how many are there?",
          "Your child touches each snack one time and says one number for each. Count together, in any language.",
          "Ask: what is the last number you said? That number tells how many.",
          "Eat one snack, then count again. How many now? Keep going until there are zero.",
        ],
        es: [
          "Pongan hasta 10 meriendas en el plato. Pregúntenle a su hijo o hija: ¿cuántas hay?",
          "Su hijo o hija toca cada merienda una vez y dice un número por cada una. Cuenten juntos, en el idioma que quieran.",
          "Pregunten: ¿cuál fue el último número que dijiste? Ese número dice cuántas hay.",
          "Cómanse una merienda y cuenten otra vez. ¿Cuántas hay ahora? Sigan hasta que haya cero.",
        ],
      },
    },
    {
      title: { en: "Sock Line", es: "La fila de calcetines" },
      minutes: 10,
      materials: { en: "Clean socks or small toys, a table or the floor", es: "Calcetines limpios o juguetes pequeños, una mesa o el piso" },
      steps: {
        en: [
          "Make a row of socks, one next to the other. Start with 3 or 4.",
          "Ask your child to touch each sock and count. Then ask: how many in the group?",
          "Add one more sock. Count again. Is the last number different?",
          "Take turns. One person makes a group, the other counts it and says how they know.",
        ],
        es: [
          "Hagan una fila de calcetines, uno al lado del otro. Empiecen con 3 o 4.",
          "Pidan a su hijo o hija que toque cada calcetín y cuente. Luego pregunten: ¿cuántos hay en el grupo?",
          "Pongan un calcetín más. Cuenten otra vez. ¿Cambió el último número?",
          "Túrnense. Una persona hace un grupo y la otra lo cuenta y dice cómo lo sabe.",
        ],
      },
    },
    {
      title: { en: "Bean Ten Frame", es: "El marco de diez con frijoles" },
      minutes: 10,
      materials: { en: "An egg carton cut to 10 cups (or a paper with 2 rows of 5 boxes), dry beans or coins", es: "Un cartón de huevos cortado en 10 espacios (o un papel con 2 filas de 5 cuadros), frijoles secos o monedas" },
      steps: {
        en: [
          "Say a number from 0 to 10. Your child puts that many beans in the ten frame, one in each space.",
          "Ask: how many beans? Count them together by touching each one.",
          "Try zero. Show an empty frame and ask: how many beans are there?",
          "Let your child say a number for you. Check their count together.",
        ],
        es: [
          "Digan un número del 0 al 10. Su hijo o hija pone esa cantidad de frijoles en el marco de diez, uno en cada espacio.",
          "Pregunten: ¿cuántos frijoles hay? Cuéntenlos juntos tocando cada uno.",
          "Prueben el cero. Muestren el marco vacío y pregunten: ¿cuántos frijoles hay?",
          "Dejen que su hijo o hija les diga un número a ustedes. Revisen juntos la cuenta.",
        ],
      },
    },
    {
      title: { en: "Counting Walk", es: "Paseo para contar" },
      minutes: 10,
      materials: { en: "A walk to school, to the store, or around the block", es: "Una caminata a la escuela, a la tienda o por la cuadra" },
      steps: {
        en: [
          "Pick something to count: steps, cars, trees, or dogs.",
          "Ask: how many can you see? Your child points at each one while counting.",
          "Ask: what is the last number? Say it together.",
          "Pick a new thing to count. Which group has more?",
        ],
        es: [
          "Elijan algo para contar: escalones, carros, árboles o perros.",
          "Pregunten: ¿cuántos puedes ver? Su hijo o hija señala cada uno mientras cuenta.",
          "Pregunten: ¿cuál es el último número? Díganlo juntos.",
          "Elijan otra cosa para contar. ¿Cuál grupo tiene más?",
        ],
      },
    },
  ],
  say_it: [
    { en: "I see [number] [things].", es: "Veo [número] [cosas]." },
    { en: "I count [number]. The last number is [number].", es: "Cuento [número]. El último número es [número]." },
    { en: "There are [number] in the group because I counted each one once.", es: "Hay [número] en el grupo porque conté cada uno una vez." },
    { en: "The plate has zero [things], so I write [number].", es: "El plato tiene cero [cosas], entonces escribo [número]." },
  ],
  help: {
    en: [
      "Count real things together: snacks, stairs, buttons. Keep it short and playful.",
      "Say \"show me\" and \"how do you know?\" in any language. You do not need to know the English words.",
      "If your child loses count, smile and start again. Touching each thing one time is the big idea.",
      "Count in Spanish, in English, or both. Numbers in any language build the same skill.",
    ],
    es: [
      "Cuenten cosas de verdad juntos: meriendas, escalones, botones. Que sea breve y divertido.",
      "Digan \"muéstrame\" y \"¿cómo lo sabes?\" en cualquier idioma. No necesitan saber las palabras en inglés.",
      "Si su hijo o hija pierde la cuenta, sonrían y empiecen otra vez. Tocar cada cosa una sola vez es la idea más importante.",
      "Cuenten en español, en inglés o en los dos. Los números en cualquier idioma desarrollan la misma habilidad.",
    ],
  },
  home_language: {
    en: "Count in Spanish first: \"uno, dos, tres.\" Then count the same things in English: \"one, two, three.\" Ask your child which number words sound alike. \"Cero\" and \"zero\" are almost twins, and so are \"número\" and \"number.\"",
    es: "Cuenten primero en español: \"uno, dos, tres\". Después cuenten las mismas cosas en inglés: \"one, two, three\". Pregúntenle a su hijo o hija qué palabras de números suenan parecidas. \"Cero\" y \"zero\" son casi gemelas, y también \"número\" y \"number\".",
  },
  celebrate: {
    en: "You will know it is working when your child counts a small group by touching each thing once and tells you how many there are, in any language.",
    es: "Sabrán que está funcionando cuando su hijo o hija cuente un grupo pequeño tocando cada cosa una vez y les diga cuántas hay, en el idioma que quiera.",
  },
};
