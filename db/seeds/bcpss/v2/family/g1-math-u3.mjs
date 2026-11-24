// BCPSS Family Guide (EN/ES) — g1-math-u3. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 1 unit on adding and subtracting with tens and ones. Vocabulary order matches ../units/g1-math-u3.mjs.

export default {
  summary: {
    en: "Your child is learning to add to a two-digit number and to take tens away from tens. We use groups of ten, a number line, and trading 10 ones for 1 ten. It matters when we count savings, stickers, or steps. Your child will explain the steps with first, next, and then.",
    es: "Su hijo o hija está aprendiendo a sumar a un número de dos dígitos y a quitar decenas de decenas. Usamos grupos de diez, una recta numérica y el cambio de 10 unidades por 1 decena. Sirve cuando contamos ahorros, calcomanías o pasos. Su hijo o hija explicará los pasos con primero, después y luego.",
  },
  goals: {
    en: [
      "I can add to a two-digit number and take tens away from tens.",
      "I can explain my steps with First, Next, and Then.",
    ],
    es: [
      "Puedo sumar a un número de dos dígitos y quitar decenas de decenas.",
      "Puedo explicar mis pasos con primero, después y luego.",
    ],
  },
  vocab: [
    { term: "tens", def_es: "grupos que tienen 10 cosas cada uno; decenas", example_es: "El 36 tiene 3 decenas." },
    { term: "ones", def_es: "cosas sueltas que sobran y no están en un grupo de 10; unidades", example_es: "El 36 tiene 6 unidades." },
    { term: "add", def_es: "juntar grupos para saber cuántos hay en total", example_es: "Si sumo 5 a 27, tengo 32." },
    { term: "subtract", def_es: "quitar algunas para saber cuántas quedan", example_es: "Si resto 20 de 50, quedan 30." },
    { term: "total", def_es: "cuántos hay en total", example_es: "El total de calcomanías es 45." },
    { term: "regroup", def_es: "cambiar 10 unidades por 1 decena", example_es: "Cambio 10 unidades por 1 decena y ahora tengo una decena más." },
    { term: "multiple of 10", def_es: "un número que dices cuando cuentas de diez en diez, como 30 o 60", example_es: "El 40 es un múltiplo de 10." },
    { term: "number line", def_es: "una línea con números en orden por la que puedes dar saltos", example_es: "Empiezo en 20 en la recta numérica y salto de diez en diez." },
    { term: "jump", def_es: "moverte de un número a otro en la recta numérica", example_es: "Doy un salto de 10 y llego a 30." },
  ],
  talk: [
    { en: "What did you do first? What did you do next? What did you do then?", es: "¿Qué hiciste primero? ¿Qué hiciste después? ¿Y luego?" },
    { en: "How many tens and ones are in the total?", es: "¿Cuántas decenas y unidades hay en el total?" },
    { en: "When did you need to trade ones for a ten?", es: "¿Cuándo tuviste que cambiar unidades por una decena?" },
    { en: "Can you show me the jumps on a number line?", es: "¿Puedes mostrarme los saltos en una recta numérica?" },
    { en: "Where do we add tens at home, like with money?", es: "¿Dónde sumamos decenas en la casa, por ejemplo con dinero?" },
  ],
  try_at_home: [
    {
      title: { en: "Trade Ten Ones", es: "Cambiar diez unidades" },
      minutes: 15,
      materials: { en: "30 beans or pennies, and 3 cups", es: "30 frijoles o monedas de un centavo, y 3 tazas" },
      steps: {
        en: [
          "Put 2 cups of 10 beans and 6 loose beans on the table. That is 26.",
          "Add 7 loose beans. Count the loose beans. There are 13 now.",
          "Trade 10 loose beans for 1 cup of ten. Ask: how many tens now? How many ones?",
          "Say the total together: 3 tens and 3 ones is 33.",
        ],
        es: [
          "Pongan en la mesa 2 tazas con 10 frijoles y 6 frijoles sueltos. Eso es 26.",
          "Agreguen 7 frijoles sueltos. Cuenten los sueltos. Ahora son 13.",
          "Cambien 10 frijoles sueltos por 1 taza de diez. Pregunten: ¿cuántas decenas hay ahora? ¿Cuántas unidades?",
          "Digan el total juntos: 3 decenas y 3 unidades es 33.",
        ],
      },
    },
    {
      title: { en: "Hop on the Number Line", es: "Saltos en la recta numérica" },
      minutes: 10,
      materials: { en: "Chalk, tape, or paper strips to make a number line on the floor", es: "Tiza, cinta o tiras de papel para hacer una recta numérica en el piso" },
      steps: {
        en: [
          "Make a path with the numbers 10, 20, 30, up to 100.",
          "Your child stands on 30. Say: add 20. Hop two jumps of ten.",
          "Ask: where did you land? What is 30 plus 20?",
          "Go back with jumps of ten to subtract. Start at 70 and take away 30.",
        ],
        es: [
          "Hagan un camino con los números 10, 20, 30, hasta 100.",
          "Su hijo o hija se para en el 30. Digan: suma 20. Da dos saltos de diez.",
          "Pregunten: ¿dónde llegaste? ¿Cuánto es 30 más 20?",
          "Regresen con saltos de diez para restar. Empiecen en 70 y quiten 30.",
        ],
      },
    },
    {
      title: { en: "Dime Store", es: "La tienda de monedas de diez" },
      minutes: 10,
      materials: { en: "Dimes (or paper circles marked 10), and a few small toys with price tags", es: "Monedas de 10 centavos (o círculos de papel marcados con 10) y algunos juguetes con precio" },
      steps: {
        en: [
          "Give a toy a price like 30 cents. Your child pays with dimes.",
          "Buy a second toy for 20 cents. How many dimes in all? How many cents?",
          "Say: 30 plus 20 is 50.",
          "Try to give back change. Start with 50 and take away 20.",
        ],
        es: [
          "Pongan a un juguete un precio como 30 centavos. Su hijo o hija paga con monedas de diez.",
          "Compren un segundo juguete de 20 centavos. ¿Cuántas monedas en total? ¿Cuántos centavos?",
          "Digan: 30 más 20 es 50.",
          "Prueben dar el cambio. Empiecen con 50 y quiten 20.",
        ],
      },
    },
    {
      title: { en: "First, Next, Then", es: "Primero, después, luego" },
      minutes: 10,
      materials: { en: "Paper, a pencil, and a few beans or coins", es: "Papel, un lápiz y unos frijoles o monedas" },
      steps: {
        en: [
          "Pick a problem, like 24 plus 5.",
          "Your child says: first I add the ones. Do it with beans.",
          "Next I check if I can make a ten. Then I say the total.",
          "Draw the steps on paper in order, with 1, 2, 3.",
        ],
        es: [
          "Elijan un problema, como 24 más 5.",
          "Su hijo o hija dice: primero sumo las unidades. Háganlo con frijoles.",
          "Después reviso si puedo formar una decena. Luego digo el total.",
          "Dibujen los pasos en el papel en orden, con 1, 2, 3.",
        ],
      },
    },
  ],
  say_it: [
    { en: "First, I add the ones: [number] and [number] make [number].", es: "Primero sumo las unidades: [número] y [número] son [número]." },
    { en: "Next, I trade 10 ones, so I have [number] tens and [number] ones.", es: "Después cambio 10 unidades, y tengo [número] decenas y [número] unidades." },
    { en: "Then I say the total: [number].", es: "Luego digo el total: [número]." },
    { en: "I jump [number] tens on the number line to get to [number].", es: "Salto [número] decenas en la recta numérica para llegar a [número]." },
  ],
  help: {
    en: [
      "Use beans, coins, or craft sticks to show tens and ones. Hands help the idea stick.",
      "Ask \"what did you do first?\" and wait. Listening to the steps is the best help.",
      "Do not rush to teach a rule. Let your child trade ones for a ten on their own.",
      "Use Spanish, English, or both to tell the steps. The math is the same.",
    ],
    es: [
      "Usen frijoles, monedas o palitos para mostrar decenas y unidades. Con las manos la idea se queda.",
      "Pregunten \"¿qué hiciste primero?\" y esperen. Escuchar los pasos es la mejor ayuda.",
      "No se apuren a enseñar una regla. Dejen que su hijo o hija cambie unidades por una decena por su cuenta.",
      "Usen español, inglés o los dos para decir los pasos. La matemática es la misma.",
    ],
  },
  home_language: {
    en: "Tell the steps in Spanish first: \"primero, después, luego.\" Then say them in English: \"first, next, then.\" \"Total\" is the same word in both languages, and \"decena\" and \"unidad\" can help your child understand \"tens\" and \"ones.\"",
    es: "Cuenten primero los pasos en español: \"primero, después, luego\". Luego díganlos en inglés: \"first, next, then\". \"Total\" es la misma palabra en los dos idiomas, y \"decena\" y \"unidad\" ayudan a entender \"tens\" y \"ones\".",
  },
  celebrate: {
    en: "You will know it is working when your child adds a few ones to a two-digit number, trades ten ones for a ten, and tells the steps in order.",
    es: "Sabrán que está funcionando cuando su hijo o hija sume unas unidades a un número de dos dígitos, cambie diez unidades por una decena y cuente los pasos en orden.",
  },
};
