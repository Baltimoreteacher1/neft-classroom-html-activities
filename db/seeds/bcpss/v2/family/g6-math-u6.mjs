// BCPSS Family Guide (EN/ES) — g6-math-u6. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on statistics and data. Vocabulary order matches ../units/g6-math-u6.mjs.

export default {
  summary: {
    en: "Your child is learning to ask questions that need data, show the data on graphs, and describe the middle and the spread of the numbers. Then they use the data to make a claim and prove it. It matters when you compare prices, read sports stats, check the news, or decide if a claim like \"most students walk to school\" is true.",
    es: "Su hijo o hija está aprendiendo a hacer preguntas que necesitan datos, a mostrar los datos en gráficas y a describir el centro y la dispersión de los números. Luego usa los datos para hacer una afirmación y probarla. Sirve para comparar precios, leer estadísticas de deportes, entender las noticias o decidir si una afirmación como \"la mayoría de los estudiantes caminan a la escuela\" es cierta.",
  },
  goals: {
    en: [
      "I can ask a question that has many different answers and collect data for it.",
      "I can show data on a dot plot, a histogram or a box plot.",
      "I can compare the center and the spread of two sets of data and back up my claim.",
    ],
    es: [
      "Puedo hacer una pregunta con muchas respuestas distintas y reunir datos para responderla.",
      "Puedo mostrar datos en un diagrama de puntos, un histograma o un diagrama de caja.",
      "Puedo comparar el centro y la dispersión de dos conjuntos de datos y respaldar mi afirmación.",
    ],
  },
  vocab: [
    { term: "statistical question", def_es: "una pregunta que espera muchas respuestas distintas porque los datos varían", example_es: "¿Cuántos minutos caminan los estudiantes a la escuela? es una pregunta estadística." },
    { term: "distribution", def_es: "la forma en que los datos están repartidos o agrupados en una gráfica", example_es: "La distribución muestra que la mayoría camina entre 5 y 10 minutos." },
    { term: "dot plot", def_es: "una gráfica que muestra cada dato como un punto sobre una recta numérica", example_es: "En el diagrama de puntos, cada punto es un estudiante." },
    { term: "histogram", def_es: "una gráfica de barras sin espacios que muestra cuántos datos caen en grupos del mismo tamaño", example_es: "La barra más alta del histograma es el grupo de 10 a 14 minutos." },
    { term: "median", def_es: "el dato del medio cuando se ordenan todos los datos de menor a mayor", example_es: "La mediana de 3, 4, 4, 5 y 9 es 4." },
    { term: "mean", def_es: "la suma de todos los datos dividida entre cuántos datos hay; es el promedio", example_es: "La media de 4, 6 y 8 es 6." },
    { term: "outlier", def_es: "un dato que está muy lejos de los demás", example_es: "Una caminata de 30 minutos es un valor atípico si las demás son de 5 a 10 minutos." },
    { term: "variability", def_es: "qué tan separados o dispersos están los datos", example_es: "Si los datos están muy separados, hay mucha variabilidad." },
    { term: "interquartile range", def_es: "qué tan separada está la mitad del medio de los datos", example_es: "El rango intercuartílico de los datos es 4." },
    { term: "box plot", def_es: "una gráfica que muestra el dato menor, los cuartiles, el dato del medio y el dato mayor", example_es: "El diagrama de caja muestra la mediana como una línea dentro de la caja." },
  ],
  talk: [
    { en: "What question could we ask our family that has many different answers?", es: "¿Qué pregunta podríamos hacerle a nuestra familia que tenga muchas respuestas distintas?" },
    { en: "What does the graph tell us? What claim can you make from it?", es: "¿Qué nos dice la gráfica? ¿Qué afirmación puedes hacer con ella?" },
    { en: "Is there a number far from the others? What could explain it?", es: "¿Hay un número lejos de los demás? ¿Qué podría explicarlo?" },
    { en: "Which is a better way to describe the center here, the mean or the median? Why?", es: "¿Cuál describe mejor el centro aquí, la media o la mediana? ¿Por qué?" },
    { en: "How do you know the data really support your claim?", es: "¿Cómo sabes que los datos de verdad respaldan tu afirmación?" },
  ],
  try_at_home: [
    {
      title: { en: "Family Survey", es: "Encuesta familiar" },
      minutes: 15,
      materials: { en: "Paper and pencil, family or neighbors to ask", es: "Papel y lápiz, familiares o vecinos a quienes preguntar" },
      steps: {
        en: [
          "Pick a question with many possible answers, like \"How many minutes does it take you to get to work or school?\"",
          "Ask at least 8 people and write each answer on paper.",
          "Draw a number line and put one dot above the number for each person. That is a dot plot.",
          "Ask: where do most dots sit? Is any dot far away? That one is an outlier.",
        ],
        es: [
          "Elijan una pregunta con muchas respuestas posibles, como \"¿Cuántos minutos tardas en llegar al trabajo o a la escuela?\".",
          "Pregunten al menos a 8 personas y anoten cada respuesta en papel.",
          "Dibujen una recta numérica y pongan un punto sobre el número de cada persona. Eso es un diagrama de puntos.",
          "Pregunten: ¿dónde están la mayoría de los puntos? ¿Hay algún punto lejos de los demás? Ese es un valor atípico.",
        ],
      },
    },
    {
      title: { en: "Middle and Average", es: "El medio y el promedio" },
      minutes: 15,
      materials: { en: "Sports stats, or any list of 5 to 9 numbers like points per game; paper and pencil", es: "Estadísticas de deportes o cualquier lista de 5 a 9 números, como puntos por partido; papel y lápiz" },
      steps: {
        en: [
          "Write down the points a player scored in 7 games.",
          "Put the numbers in order from smallest to largest. The middle number is the median.",
          "Add all the numbers and divide by 7. That is the mean.",
          "Ask: which is closer to what the player usually scores? What happens if one game was very high?",
        ],
        es: [
          "Anoten los puntos que un jugador anotó en 7 partidos.",
          "Pongan los números en orden de menor a mayor. El número del medio es la mediana.",
          "Sumen todos los números y dividan entre 7. Esa es la media.",
          "Pregunten: ¿cuál se acerca más a lo que el jugador suele anotar? ¿Qué pasa si un partido fue muy alto?",
        ],
      },
    },
    {
      title: { en: "Spread of Prices", es: "La dispersión de los precios" },
      minutes: 15,
      materials: { en: "A store flyer or receipt, paper and pencil", es: "Un volante de ofertas o un recibo, papel y lápiz" },
      steps: {
        en: [
          "Choose 8 prices for the same kind of item, like cereal or sneakers, from two stores.",
          "For each store, find the lowest price, the highest price, and the median.",
          "Ask: which store has prices that are closer together? That store has less variability.",
          "Make a claim: \"Store A is more steady because the prices range from ___ to ___.\"",
        ],
        es: [
          "Elijan 8 precios del mismo tipo de producto, como cereal o tenis, en dos tiendas.",
          "En cada tienda, hallen el precio más bajo, el más alto y la mediana.",
          "Pregunten: ¿qué tienda tiene precios más cercanos entre sí? Esa tienda tiene menos variabilidad.",
          "Hagan una afirmación: \"La tienda A es más estable porque los precios van de ___ a ___\".",
        ],
      },
    },
    {
      title: { en: "Weather Claim", es: "Afirmación sobre el clima" },
      minutes: 10,
      materials: { en: "A weather app or newspaper, paper and pencil", es: "Una aplicación del clima o un periódico, papel y lápiz" },
      steps: {
        en: [
          "Write down the high temperature for 10 days in a row.",
          "Group the days: 60 to 64, 65 to 69, 70 to 74, and so on. Count how many days fall in each group.",
          "Draw a bar for each group with no gaps. That is a histogram.",
          "Ask: what claim can you make? Say it with \"according to the data\".",
        ],
        es: [
          "Anoten la temperatura máxima de 10 días seguidos.",
          "Agrupen los días: de 60 a 64, de 65 a 69, de 70 a 74, y así. Cuenten cuántos días caen en cada grupo.",
          "Dibujen una barra para cada grupo, sin espacios. Eso es un histograma.",
          "Pregunten: ¿qué afirmación puedes hacer? Díganla con \"según los datos\".",
        ],
      },
    },
  ],
  say_it: [
    { en: "I claim the [median] is the better center because [reason].", es: "Afirmo que [la mediana] es mejor centro porque [razón]." },
    { en: "According to the data, [most students walk for 5 to 10 minutes].", es: "Según los datos, [la mayoría de los estudiantes camina de 5 a 10 minutos]." },
    { en: "The variability is [small] because the values are [close together].", es: "La variabilidad es [pequeña] porque los valores están [cercanos entre sí]." },
    { en: "The number [30] is an outlier as shown by [the dot far from the rest].", es: "El número [30] es un valor atípico, como lo muestra [el punto lejos de los demás]." },
  ],
  help: {
    en: [
      "You do not need to know statistics. Ask your child what the graph shows and what it is about.",
      "Use data you already have: sports stats, prices, weather, travel times.",
      "Ask \"how do you know?\" and \"what does the data say?\" before \"what is the answer?\".",
      "Treat a surprising number as interesting, not wrong. Ask what might explain it.",
    ],
    es: [
      "No necesitan saber estadística. Pregunten a su hijo o hija qué muestra la gráfica y de qué trata.",
      "Usen datos que ya tienen: estadísticas de deportes, precios, clima, tiempos de viaje.",
      "Pregunten \"¿cómo lo sabes?\" y \"¿qué dicen los datos?\" antes de \"¿cuál es la respuesta?\".",
      "Vean un número sorprendente como algo interesante, no como un error. Pregunten qué podría explicarlo.",
    ],
  },
  home_language: {
    en: "Many words are close in Spanish: distribution (distribución), median (mediana), histogram (histograma), variability (variabilidad). Do the family survey in both languages, and write the results in Spanish first. Then find the English words together.",
    es: "Muchas palabras son parecidas en inglés: distribución (distribution), mediana (median), histograma (histogram), variabilidad (variability). Hagan la encuesta familiar en los dos idiomas y escriban primero los resultados en español. Después busquen juntos las palabras en inglés.",
  },
  celebrate: {
    en: "You will know it is working when your child can look at a graph or a list of numbers and tell you, in any language, a claim about it and the data that proves it.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda mirar una gráfica o una lista de números y contarles, en el idioma que quiera, una afirmación sobre ella y los datos que la prueban.",
  },
};
