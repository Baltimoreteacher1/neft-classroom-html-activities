// BCPSS Family Guide (EN/ES) — g8-math-u6. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on scatter plots, lines of best fit and two-way tables. Vocabulary order matches ../units/g8-math-u6.mjs.

export default {
  summary: {
    en: "Your child is learning to look at two kinds of numbers at the same time, like hours of sleep and a quiz score, and to see whether they are linked. They use scatter plots and tables to find patterns and back up a claim with evidence. It matters when you read sports stats, compare used-car prices to miles, or decide if a news story's claim is supported.",
    es: "Su hijo o hija está aprendiendo a mirar dos tipos de números al mismo tiempo, como las horas de sueño y la nota de un examen, y a ver si están relacionados. Usa diagramas de dispersión y tablas para hallar patrones y respaldar una afirmación con evidencia. Sirve para leer estadísticas de deportes, comparar precios de autos usados con el kilometraje o decidir si lo que dice una noticia tiene respaldo.",
  },
  goals: {
    en: [
      "I can make a scatter plot and describe the association.",
      "I can draw a line of best fit and use it to make a prediction.",
      "I can read relative frequencies in a two-way table and support a claim with according to and as shown by.",
    ],
    es: [
      "Puedo hacer un diagrama de dispersión y describir la asociación.",
      "Puedo trazar una línea de mejor ajuste y usarla para hacer una predicción.",
      "Puedo leer frecuencias relativas en una tabla de doble entrada y respaldar una afirmación con según y como lo muestra.",
    ],
  },
  vocab: [
    { term: "bivariate data", def_es: "datos que ponen en pareja dos medidas de cada persona o cosa", example_es: "Los datos bivariados ponen en pareja las horas de sueño de cada estudiante con su nota en un examen." },
    { term: "scatter plot", def_es: "una gráfica que muestra datos en pareja como puntos en una cuadrícula de coordenadas", example_es: "Cada punto del diagrama de dispersión muestra el tiempo de estudio y la nota de un estudiante." },
    { term: "association", def_es: "un patrón que une dos conjuntos de datos", example_es: "El diagrama de dispersión muestra una asociación entre las horas de práctica y los tiros libres encestados." },
    { term: "positive association", def_es: "un patrón en el que un valor sube cuando el otro valor sube", example_es: "Hay una asociación positiva cuando los estudiantes que estudian más tienden a sacar notas más altas." },
    { term: "negative association", def_es: "un patrón en el que un valor baja cuando el otro valor sube", example_es: "Hay una asociación negativa cuando los autos con más millas tienden a venderse por menos." },
    { term: "outlier", def_es: "un punto que está muy lejos del resto de los datos", example_es: "Un estudiante que estudió 10 horas pero sacó 40 es un valor atípico." },
    { term: "line of best fit", def_es: "una recta dibujada cerca de los puntos que muestra la tendencia de un diagrama de dispersión", example_es: "La línea de mejor ajuste pasa cerca de la mayoría de los puntos y nos permite predecir una nota." },
    { term: "cluster", def_es: "un grupo de puntos que están juntos", example_es: "La mayoría de los puntos forma un agrupamiento cerca de la línea de mejor ajuste." },
    { term: "two-way table", def_es: "una tabla que muestra conteos de dos categorías al mismo tiempo", example_es: "Una tabla de doble entrada muestra cuántos estudiantes de cada grado caminan o van en autobús." },
    { term: "relative frequency", def_es: "la fracción o el porcentaje de un grupo que cumple una categoría, que se halla dividiendo un conteo entre el total", example_es: "La frecuencia relativa de los que van en autobús es de 12 de 30, o sea 40 por ciento." },
  ],
  talk: [
    { en: "What two things are we comparing? What do you expect to see?", es: "¿Qué dos cosas estamos comparando? ¿Qué esperas ver?" },
    { en: "As one number goes up, what does the other do? What kind of association is that?", es: "Cuando un número sube, ¿qué hace el otro? ¿Qué tipo de asociación es?" },
    { en: "Is there a point far from the others? What could explain it?", es: "¿Hay un punto lejos de los demás? ¿Qué podría explicarlo?" },
    { en: "Where would you draw a line through the points, and what would you predict?", es: "¿Dónde trazarías una recta que pase por los puntos y qué predecirías?" },
    { en: "Does the data really prove your claim, or only suggest it?", es: "¿Los datos de verdad prueban tu afirmación o solo la sugieren?" },
  ],
  try_at_home: [
    {
      title: { en: "Two-Number Scatter Plot", es: "Diagrama de dispersión con dos números" },
      minutes: 20,
      materials: { en: "Paper and pencil, a ruler, 8 to 10 pairs of numbers like hours of practice and points scored", es: "Papel y lápiz, una regla, de 8 a 10 pares de números como horas de práctica y puntos anotados" },
      steps: {
        en: [
          "Collect pairs of numbers from the family: for example, minutes of sleep and how rested people feel from 1 to 10, or hours of practice and points scored.",
          "Draw two number lines, one across and one up. Plot each pair as one dot.",
          "Look at the shape. Do the dots go up from left to right, down, or neither?",
          "Say it: \"There is a positive association because as practice goes up, points go up.\"",
        ],
        es: [
          "Reúnan pares de números de la familia: por ejemplo, los minutos de sueño y qué tan descansada se siente cada persona del 1 al 10, o las horas de práctica y los puntos anotados.",
          "Dibujen dos rectas numéricas, una hacia el lado y otra hacia arriba. Ubiquen cada par como un punto.",
          "Miren la forma. ¿Los puntos suben de izquierda a derecha, bajan o ninguna de las dos?",
          "Díganlo: \"Hay una asociación positiva porque cuando la práctica sube, los puntos suben\".",
        ],
      },
    },
    {
      title: { en: "Used Car Prices", es: "Precios de autos usados" },
      minutes: 20,
      materials: { en: "A phone or a newspaper with used-car listings, paper and pencil, a ruler", es: "Un teléfono o un periódico con anuncios de autos usados, papel y lápiz, una regla" },
      steps: {
        en: [
          "Find 8 listings for the same kind of car. Write the miles and the price for each.",
          "Plot them: miles across, price up.",
          "Use a ruler to draw a line that passes close to most of the points. That is the line of best fit.",
          "Use the line to predict the price of a car with 60,000 miles. Ask: is this a positive or a negative association?",
        ],
        es: [
          "Busquen 8 anuncios del mismo tipo de auto. Anoten las millas y el precio de cada uno.",
          "Ubíquenlos: las millas hacia el lado y el precio hacia arriba.",
          "Con una regla, tracen una recta que pase cerca de la mayoría de los puntos. Esa es la línea de mejor ajuste.",
          "Usen la recta para predecir el precio de un auto con 60,000 millas. Pregunten: ¿es una asociación positiva o negativa?",
        ],
      },
    },
    {
      title: { en: "Two-Way Table Survey", es: "Encuesta con tabla de doble entrada" },
      minutes: 15,
      materials: { en: "Paper and pencil, 10 to 20 people to ask", es: "Papel y lápiz, de 10 a 20 personas a quienes preguntar" },
      steps: {
        en: [
          "Ask each person two yes or no questions, like \"Do you like soccer?\" and \"Do you like basketball?\"",
          "Make a table with rows for soccer (yes, no) and columns for basketball (yes, no). Tally the answers in the boxes.",
          "Find the total for each row. Find the relative frequency: the count divided by the total.",
          "Ask: of the people who like soccer, what fraction like basketball too?",
        ],
        es: [
          "Pregunten a cada persona dos preguntas de sí o no, como \"¿Te gusta el fútbol?\" y \"¿Te gusta el baloncesto?\".",
          "Hagan una tabla con filas para el fútbol (sí, no) y columnas para el baloncesto (sí, no). Anoten las respuestas en las casillas.",
          "Hallen el total de cada fila. Hallen la frecuencia relativa: el conteo dividido entre el total.",
          "Pregunten: de las personas a quienes les gusta el fútbol, ¿qué fracción también disfruta el baloncesto?",
        ],
      },
    },
    {
      title: { en: "Claim and Evidence", es: "Afirmación y evidencia" },
      minutes: 10,
      materials: { en: "A scatter plot or table from the other activities, paper and pencil", es: "Un diagrama de dispersión o una tabla de las otras actividades, papel y lápiz" },
      steps: {
        en: [
          "Look at one of your graphs or tables together.",
          "Ask your child to write one claim, like \"Cars with more miles cost less.\"",
          "Ask for evidence: \"According to the graph, ___.\" \"As shown by the point at ___, ___.\"",
          "Ask: is there an outlier? Does it change your claim?",
        ],
        es: [
          "Miren juntos una de sus gráficas o tablas.",
          "Pídanle a su hijo o hija que escriba una afirmación, como \"Los autos con más millas cuestan menos\".",
          "Pidan evidencia: \"Según la gráfica, ___\". \"Como lo muestra el punto en ___, ___\".",
          "Pregunten: ¿hay un valor atípico? ¿Cambia tu afirmación?",
        ],
      },
    },
  ],
  say_it: [
    { en: "According to the scatter plot, there is a [positive] association because [reason].", es: "Según el diagrama de dispersión, hay una asociación [positiva] porque [razón]." },
    { en: "The relative frequency is [12] out of [30], or [40] percent.", es: "La frecuencia relativa es [12] de [30], o sea [40] por ciento." },
    { en: "One point is far away, so it is an [outlier].", es: "Un punto está muy lejos, entonces es un [valor atípico]." },
    { en: "As shown by [the line of best fit], I predict [a price of $X].", es: "Como lo muestra [la línea de mejor ajuste], predigo [un precio de $X]." },
  ],
  help: {
    en: [
      "You do not need to know statistics. Ask your child what the two numbers are and what the dots show.",
      "Use real data: sports stats, prices, weather. Ask \"what do you notice?\"",
      "Ask \"does it always work that way?\" A pattern is a tendency, not a promise.",
      "Let your child explain the outlier. A far-away point is something to be curious about.",
    ],
    es: [
      "No necesitan saber estadística. Pregunten a su hijo o hija cuáles son los dos números y qué muestran los puntos.",
      "Usen datos reales: estadísticas de deportes, precios, clima. Pregunten \"¿qué notas?\".",
      "Pregunten \"¿siempre es así?\". Un patrón es una tendencia, no una promesa.",
      "Dejen que explique el valor atípico. Un punto lejano es algo que da curiosidad.",
    ],
  },
  home_language: {
    en: "Many words are close in Spanish: association (asociación), positive (positivo), negative (negativo), relative frequency (frecuencia relativa), cluster (grupo or agrupamiento). Ask your child to describe the pattern in Spanish first: \"cuando sube uno, sube el otro\". Then use the English words for the claim.",
    es: "Muchas palabras son parecidas en inglés: asociación (association), positivo (positive), negativo (negative), frecuencia relativa (relative frequency), agrupamiento (cluster). Pídanle a su hijo o hija que describa primero el patrón en español: \"cuando sube uno, sube el otro\". Después usen las palabras en inglés para la afirmación.",
  },
  celebrate: {
    en: "You will know it is working when your child can look at a graph or table and tell you, in any language, what pattern it shows and how the data supports their claim.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda mirar una gráfica o una tabla y decirles, en el idioma que quiera, qué patrón muestra y cómo los datos respaldan su afirmación.",
  },
};
