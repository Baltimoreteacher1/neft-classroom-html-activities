// BCPSS Family Guide (EN/ES) — g7-math-u6. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on sampling, inference and probability. Vocabulary order matches ../units/g7-math-u6.mjs.

export default {
  summary: {
    en: "Your child is learning how a small group can tell us about a whole group, and how to tell when a sample is fair. They also learn probability, which measures how likely something is. It matters when you read a poll, decide if a news claim is trustworthy, or play a game of chance.",
    es: "Su hijo o hija está aprendiendo cómo un grupo pequeño puede decirnos algo sobre un grupo completo y cómo saber si una muestra es justa. También aprende la probabilidad, que mide qué tan probable es que algo ocurra. Sirve para leer una encuesta, decidir si una noticia es confiable o jugar un juego de azar.",
  },
  goals: {
    en: [
      "I can tell if a sample is fair or biased.",
      "I can use a sample to make a claim about a whole group.",
      "I can find the probability of a simple or compound event and explain it with because.",
    ],
    es: [
      "Puedo decir si una muestra es justa o sesgada.",
      "Puedo usar una muestra para hacer una afirmación sobre un grupo completo.",
      "Puedo hallar la probabilidad de un evento simple o compuesto y explicarla con porque.",
    ],
  },
  vocab: [
    { term: "population", def_es: "todo el grupo sobre el que quieres aprender", example_es: "La población son los 600 estudiantes de la escuela." },
    { term: "sample", def_es: "una parte más pequeña del grupo completo, a la que de verdad preguntas o mides", example_es: "La muestra fue de 30 estudiantes de 600." },
    { term: "random sample", def_es: "una muestra en la que cada miembro del grupo tiene la misma oportunidad de ser elegido", example_es: "Sacar 30 nombres de un sombrero es una muestra aleatoria." },
    { term: "biased sample", def_es: "una muestra que deja fuera a una parte del grupo y por eso da una imagen injusta", example_es: "Preguntar solo a los jugadores de baloncesto por su deporte favorito da una muestra sesgada." },
    { term: "inference", def_es: "una conclusión sobre un grupo completo basada en los datos de una muestra", example_es: "Con la muestra, hago la inferencia de que a unos 360 estudiantes les gusta la pizza." },
    { term: "probability", def_es: "un número de 0 a 1 que dice qué tan probable es un evento", example_es: "La probabilidad de que salga cara al lanzar una moneda es 1/2." },
    { term: "outcome", def_es: "uno de los resultados posibles de un experimento de azar", example_es: "Sacar un 4 es un resultado posible al tirar un dado." },
    { term: "compound event", def_es: "un evento con dos o más pasos, como lanzar una moneda y luego tirar un dado", example_es: "Lanzar una moneda y girar una ruleta es un evento compuesto." },
    { term: "mean", def_es: "el promedio: se suman todos los datos y se divide entre cuántos datos hay", example_es: "La media de 4, 6 y 8 es 6." },
    { term: "variability", def_es: "qué tan separados o dispersos están los datos", example_es: "Las notas tuvieron poca variabilidad porque estaban todas cerca." },
  ],
  talk: [
    { en: "Who would we ask, and who would we leave out? Is that fair?", es: "¿A quién le preguntaríamos y a quién dejaríamos fuera? ¿Es justo?" },
    { en: "What can this small group tell us about the whole group?", es: "¿Qué nos puede decir este grupo pequeño sobre el grupo completo?" },
    { en: "How likely is it? Is it certain, likely, unlikely or impossible?", es: "¿Qué tan probable es? ¿Es seguro, probable, poco probable o imposible?" },
    { en: "How many outcomes are there, and how many do we want?", es: "¿Cuántos resultados posibles hay y cuántos queremos?" },
    { en: "What is your claim, and what evidence supports it?", es: "¿Cuál es tu afirmación y qué evidencia la respalda?" },
  ],
  try_at_home: [
    {
      title: { en: "Fair or Biased Poll", es: "Encuesta justa o sesgada" },
      minutes: 15,
      materials: { en: "Paper and pencil, family members or neighbors", es: "Papel y lápiz, familiares o vecinos" },
      steps: {
        en: [
          "Pick a question for your whole building or block, like \"What is your favorite food?\"",
          "Ask only the people in one room. Ask: is this sample fair? Who is left out?",
          "Now ask people from different ages and places. Write each answer down.",
          "Compare the two results. Which sample gives a better picture of the whole group? Why?",
        ],
        es: [
          "Elijan una pregunta para todo su edificio o cuadra, como \"¿Cuál es tu comida favorita?\".",
          "Pregunten solo a las personas de un cuarto. Pregunten: ¿es justa esta muestra? ¿A quién se dejó fuera?",
          "Ahora pregunten a personas de distintas edades y lugares. Anoten cada respuesta.",
          "Comparen los dos resultados. ¿Qué muestra da una mejor imagen del grupo completo? ¿Por qué?",
        ],
      },
    },
    {
      title: { en: "Candy or Bean Jar", es: "El frasco de dulces o frijoles" },
      minutes: 15,
      materials: { en: "A jar or bag of beans or colored candies, a cup, paper and pencil", es: "Un frasco o bolsa de frijoles o dulces de colores, un vaso, papel y lápiz" },
      steps: {
        en: [
          "Without looking, scoop 10 items from the jar. Count how many are each color.",
          "Use your sample to guess: out of the whole jar, what fraction is each color?",
          "Do it again 3 times. Do the samples all match? Ask: why is there a difference?",
          "Count the whole jar. How close was your inference?",
        ],
        es: [
          "Sin mirar, saquen 10 artículos del frasco. Cuenten cuántos hay de cada color.",
          "Usen su muestra para adivinar: de todo el frasco, ¿qué fracción es de cada color?",
          "Háganlo otra vez 3 veces. ¿Todas las muestras coinciden? Pregunten: ¿por qué hay diferencias?",
          "Cuenten todo el frasco. ¿Qué tan cerca estuvo su inferencia?",
        ],
      },
    },
    {
      title: { en: "Coin and Die Chance", es: "El azar con moneda y dado" },
      minutes: 15,
      materials: { en: "A coin, a die, paper and pencil", es: "Una moneda, un dado, papel y lápiz" },
      steps: {
        en: [
          "Ask: what is the probability of rolling a 5 on a die? There is 1 outcome we want out of 6 equal outcomes, so 1/6.",
          "Now do two steps: flip a coin, then roll the die. List all the outcomes, like heads-1, heads-2, and so on. There are 12.",
          "Ask: what is the probability of heads and an even number? (3 out of 12, or 1/4.)",
          "Test it: do the two steps 24 times and tally. Is it close to what you predicted?",
        ],
        es: [
          "Pregunten: ¿cuál es la probabilidad de sacar un 5 en un dado? Hay 1 resultado que queremos entre 6 resultados iguales, o sea 1/6.",
          "Ahora hagan dos pasos: lancen una moneda y luego tiren el dado. Hagan una lista de todos los resultados, como cara-1, cara-2, y así. Son 12.",
          "Pregunten: ¿cuál es la probabilidad de cara y un número par? (3 de 12, o sea 1/4.)",
          "Compruébenlo: hagan los dos pasos 24 veces y anoten. ¿Se parece a lo que predijeron?",
        ],
      },
    },
    {
      title: { en: "Compare Two Groups", es: "Comparar dos grupos" },
      minutes: 15,
      materials: { en: "Sports stats or two lists of numbers, paper and pencil", es: "Estadísticas de deportes o dos listas de números, papel y lápiz" },
      steps: {
        en: [
          "Pick two players or two teams and write down 6 scores for each.",
          "Find the mean for each group: add the scores and divide by 6.",
          "Look at how spread out each list is. Ask: which group has less variability?",
          "Make a claim: \"Group A is more steady because the scores are closer together.\"",
        ],
        es: [
          "Elijan dos jugadores o dos equipos y anoten 6 puntajes de cada uno.",
          "Hallen la media de cada grupo: sumen los puntajes y dividan entre 6.",
          "Miren qué tan dispersa está cada lista. Pregunten: ¿qué grupo tiene menos variabilidad?",
          "Hagan una afirmación: \"El grupo A es más estable porque los puntajes están más cerca entre sí\".",
        ],
      },
    },
  ],
  say_it: [
    { en: "My claim is that [the sample is biased] because [it leaves out some people].", es: "Mi afirmación es que [la muestra es sesgada] porque [deja fuera a algunas personas]." },
    { en: "According to the sample, [12] out of [30] chose [pizza].", es: "Según la muestra, [12] de [30] eligieron [pizza]." },
    { en: "The probability of [rolling a 5] is [1/6] because there are [6] equal outcomes.", es: "La probabilidad de [sacar un 5] es [1/6] porque hay [6] resultados iguales." },
    { en: "I infer that about [360] students like pizza, as shown by [the sample].", es: "Infiero que a unos [360] estudiantes les gusta la pizza, como lo muestra [la muestra]." },
  ],
  help: {
    en: [
      "You do not need to know probability. Ask your child to explain who was asked and who was left out.",
      "Play games of chance together and talk about what could happen.",
      "Ask \"is that fair?\" when you see a poll or a news claim.",
      "Let your child use words like likely, unlikely, certain and impossible before using numbers.",
    ],
    es: [
      "No necesitan saber probabilidad. Pídanle a su hijo o hija que explique a quién le preguntaron y a quién dejaron fuera.",
      "Jueguen juntos juegos de azar y hablen de lo que podría pasar.",
      "Pregunten \"¿es justo?\" cuando vean una encuesta o una afirmación en las noticias.",
      "Dejen que use palabras como probable, poco probable, seguro e imposible antes de usar números.",
    ],
  },
  home_language: {
    en: "Many words are almost the same in Spanish: population (población), probability (probabilidad), variability (variabilidad), inference (inferencia). Use the home language to talk about who is in the sample. In Spanish, \"muestra\" means sample, and \"media\" is the mean, or average.",
    es: "Muchas palabras son casi iguales en inglés: población (population), probabilidad (probability), variabilidad (variability), inferencia (inference). Usen el idioma del hogar para hablar de quién está en la muestra. En inglés, \"sample\" es muestra y \"mean\" es la media, o promedio.",
  },
  celebrate: {
    en: "You will know it is working when your child can read a poll or play a game of chance and tell you, in any language, whether the sample is fair or how likely something is, and why.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda leer una encuesta o jugar un juego de azar y contarles, en el idioma que quiera, si la muestra es justa o qué tan probable es algo, y por qué.",
  },
};
