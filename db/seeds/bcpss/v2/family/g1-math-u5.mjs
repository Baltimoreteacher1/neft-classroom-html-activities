// BCPSS Family Guide (EN/ES) — g1-math-u5. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 1 unit on data and graphs. Vocabulary order matches ../units/g1-math-u5.mjs.

export default {
  summary: {
    en: "Your child is learning to ask a question, collect answers, sort them into groups, make a graph, and tell which has the most and how many more. It matters when the family votes on dinner or a movie. Your child will make a claim and prove it with numbers from the graph.",
    es: "Su hijo o hija está aprendiendo a hacer una pregunta, juntar respuestas, clasificarlas en grupos, hacer una gráfica y decir cuál tiene más y cuántos más. Sirve cuando la familia vota por la cena o por una película. Su hijo o hija hará una afirmación y la comprobará con números de la gráfica.",
  },
  goals: {
    en: [
      "I can sort answers into groups and make a graph.",
      "I can tell how many more one group has than another.",
      "I can make a claim and prove it with numbers from the graph.",
    ],
    es: [
      "Puedo clasificar respuestas en grupos y hacer una gráfica.",
      "Puedo decir cuántos más tiene un grupo que otro.",
      "Puedo hacer una afirmación y comprobarla con números de la gráfica.",
    ],
  },
  vocab: [
    { term: "data", def_es: "datos: hechos o números que juntamos al preguntar o al contar", example_es: "Los datos dicen cuántos niños prefieren pizza." },
    { term: "survey", def_es: "una encuesta: preguntarles lo mismo a muchas personas para juntar sus respuestas", example_es: "Hicimos una encuesta sobre la fruta favorita." },
    { term: "category", def_es: "una categoría: el nombre de un grupo en una tabla donde se clasifican las respuestas", example_es: "Una categoría de la tabla es \"manzana\"." },
    { term: "tally mark", def_es: "una rayita que dibujamos para contar uno; la quinta cruza las cuatro anteriores", example_es: "Hice cinco rayitas, y la quinta cruza las otras." },
    { term: "bar graph", def_es: "una gráfica de barras: un dibujo con barras que muestra cuántos hay en cada grupo", example_es: "La barra más alta de la gráfica es la de las fresas." },
    { term: "vote", def_es: "el voto: la elección de una persona, que contamos", example_es: "Cada persona de la familia dio un voto." },
    { term: "most", def_es: "la mayor cantidad; más que todos los demás", example_es: "La pizza tiene más votos que todo lo demás." },
    { term: "least", def_es: "la menor cantidad; menos que todos los demás", example_es: "El brócoli tiene la menor cantidad de votos." },
    { term: "how many more", def_es: "una pregunta para saber cuánto más grande es una cantidad que otra", example_es: "¿Cuántos más votos tiene la pizza que el brócoli?" },
  ],
  talk: [
    { en: "What question did you ask? Who did you ask?", es: "¿Qué pregunta hiciste? ¿A quién le preguntaste?" },
    { en: "Which category has the most? How do you know?", es: "¿Cuál categoría tiene más? ¿Cómo lo sabes?" },
    { en: "Which has the least? How many more does the most have?", es: "¿Cuál tiene menos? ¿Cuántos más tiene la que tiene más?" },
    { en: "What does the graph tell us?", es: "¿Qué nos dice la gráfica?" },
    { en: "What question would you like to ask our family next?", es: "¿Qué pregunta te gustaría hacerle a nuestra familia ahora?" },
  ],
  try_at_home: [
    {
      title: { en: "Family Vote", es: "Votación familiar" },
      minutes: 10,
      materials: { en: "Paper, a pencil, and family members or friends to ask", es: "Papel, un lápiz y familiares o amigos a quienes preguntar" },
      steps: {
        en: [
          "Pick a question with 3 choices, like: which fruit do you like best? Apple, banana, or grape?",
          "Ask each person. Your child draws a tally mark for each vote.",
          "Count the marks in each category. Make groups of five if you can.",
          "Ask: which has the most? Which has the least?",
        ],
        es: [
          "Elijan una pregunta con 3 opciones, como: ¿qué fruta te gusta más? ¿Manzana, plátano o uva?",
          "Pregúntenle a cada persona. Su hijo o hija dibuja una rayita por cada voto.",
          "Cuenten las rayitas de cada categoría. Hagan grupos de cinco si pueden.",
          "Pregunten: ¿cuál tiene más? ¿Cuál tiene menos?",
        ],
      },
    },
    {
      title: { en: "Block Graph", es: "Gráfica de bloques" },
      minutes: 15,
      materials: { en: "Paper, crayons, and small blocks or sticky notes", es: "Papel, crayones y bloques pequeños o notas adhesivas" },
      steps: {
        en: [
          "Use the votes from the family survey. Draw 3 columns on the paper and write each category on top.",
          "Put one block or sticky note in the column for each vote, going up.",
          "Look at the columns. Which one is tallest? Which is shortest?",
          "Ask: how many more votes does the tallest have than the shortest?",
        ],
        es: [
          "Usen los votos de la encuesta familiar. Dibujen 3 columnas en el papel y escriban cada categoría arriba.",
          "Pongan un bloque o una nota en la columna de cada voto, hacia arriba.",
          "Miren las columnas. ¿Cuál es la más alta? ¿Cuál es la más baja?",
          "Pregunten: ¿cuántos votos más tiene la más alta que la más baja?",
        ],
      },
    },
    {
      title: { en: "Sort the Laundry", es: "Clasificar la ropa" },
      minutes: 10,
      materials: { en: "A pile of clean socks, shirts, or toys", es: "Un montón de calcetines, camisas o juguetes limpios" },
      steps: {
        en: [
          "Choose a way to sort, like by color or by type.",
          "Make a pile for each category. Name each category.",
          "Count each pile. Write the numbers on paper.",
          "Say: the [color] pile has the most, and it has [number] more than the [color] pile.",
        ],
        es: [
          "Elijan una forma de clasificar, como por color o por tipo.",
          "Hagan un montón para cada categoría. Pongan nombre a cada categoría.",
          "Cuenten cada montón. Escriban los números en un papel.",
          "Digan: el montón de [color] tiene más, y tiene [número] más que el montón de [color].",
        ],
      },
    },
    {
      title: { en: "Window Count", es: "Contar desde la ventana" },
      minutes: 10,
      materials: { en: "A window or a bus stop, paper, and a pencil", es: "Una ventana o una parada de autobús, papel y un lápiz" },
      steps: {
        en: [
          "Pick 3 things to count outside, like cars, bikes, and people.",
          "Make a tally mark each time you see one of them.",
          "After 5 minutes, count the marks in each category.",
          "Tell what the data show: more cars than bikes because...",
        ],
        es: [
          "Elijan 3 cosas para contar afuera, como carros, bicicletas y personas.",
          "Hagan una rayita cada vez que vean una de ellas.",
          "Después de 5 minutos, cuenten las rayitas de cada categoría.",
          "Digan lo que muestran los datos: hay más carros que bicicletas porque...",
        ],
      },
    },
  ],
  say_it: [
    { en: "[Category] is the most popular.", es: "[Categoría] es la más popular." },
    { en: "It has [number] votes.", es: "Tiene [número] votos." },
    { en: "[Category] has [number] more votes than [category].", es: "[Categoría] tiene [número] votos más que [categoría]." },
    { en: "I know because the graph shows [number] for [category].", es: "Lo sé porque la gráfica muestra [número] para [categoría]." },
  ],
  help: {
    en: [
      "Be the one who answers the survey. Let your child ask the questions and keep the marks.",
      "Ask \"how do you know?\" and look at the graph together.",
      "Keep the questions simple, with 2 or 3 choices, so counting is easy.",
      "Ask your survey in Spanish or English. Any language works for collecting data.",
    ],
    es: [
      "Sean ustedes quienes respondan la encuesta. Dejen que su hijo o hija haga las preguntas y lleve la cuenta.",
      "Pregunten \"¿cómo lo sabes?\" y miren la gráfica juntos.",
      "Mantengan las preguntas sencillas, con 2 o 3 opciones, para que contar sea fácil.",
      "Hagan su encuesta en español o en inglés. Cualquier idioma sirve para juntar datos.",
    ],
  },
  home_language: {
    en: "Ask the survey question in Spanish first, then in English. Look for twins: \"datos\" and \"data,\" \"categoría\" and \"category,\" \"gráfica\" and \"graph.\" Your child can teach you the English word for each Spanish one.",
    es: "Hagan primero la pregunta de la encuesta en español y luego en inglés. Busquen gemelas: \"datos\" y \"data\", \"categoría\" y \"category\", \"gráfica\" y \"graph\". Su hijo o hija puede enseñarles la palabra en inglés de cada palabra en español.",
  },
  celebrate: {
    en: "You will know it is working when your child collects answers, makes a simple graph, and tells which has the most and how many more, using numbers to prove it.",
    es: "Sabrán que está funcionando cuando su hijo o hija junte respuestas, haga una gráfica sencilla y diga cuál tiene más y cuántos más, usando números para comprobarlo.",
  },
};
