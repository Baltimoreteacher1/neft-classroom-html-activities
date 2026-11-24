// BCPSS Family Guide (EN/ES) — g8-math-u3. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on functions. Vocabulary order matches ../units/g8-math-u3.mjs.

export default {
  summary: {
    en: "Your child is learning about functions: rules where each input gives exactly one output. They learn to read a function from a table, a graph, a rule or a story, and to compare two functions. It matters when you compare taxi or ride prices, savings plans, or how fast something grows: you can see how things change and where they start.",
    es: "Su hijo o hija está aprendiendo sobre las funciones: reglas en las que cada entrada da exactamente una salida. Aprende a leer una función en una tabla, una gráfica, una regla o una historia, y a comparar dos funciones. Sirve para comparar precios de taxi o de viajes, planes de ahorro o qué tan rápido crece algo: se puede ver cómo cambian las cosas y dónde empiezan.",
  },
  goals: {
    en: [
      "I can tell if a rule is a function and find the rate of change and the initial value.",
      "I can tell a linear function from a nonlinear function.",
      "I can compare two functions with both, whereas and in contrast.",
    ],
    es: [
      "Puedo decir si una regla es una función y hallar la tasa de cambio y el valor inicial.",
      "Puedo distinguir una función lineal de una función no lineal.",
      "Puedo comparar dos funciones con tanto como, mientras que y en cambio.",
    ],
  },
  vocab: [
    { term: "function", def_es: "una regla que da exactamente una salida por cada entrada, como una máquina", example_es: "La regla y = 3x es una función porque cada entrada tiene una sola salida." },
    { term: "input", def_es: "el número que se pone en una función", example_es: "En y = 3x, si la entrada es 4, la salida es 12." },
    { term: "output", def_es: "el número que sale de una función", example_es: "Cuando la entrada es 4, la salida de y = 3x es 12." },
    { term: "rate of change", def_es: "cuánto cambia la salida por cada unidad que aumenta la entrada", example_es: "La tasa de cambio de y = 3x + 4 es 3." },
    { term: "initial value", def_es: "la salida cuando la entrada es 0, o sea donde empieza la función", example_es: "El valor inicial de y = 3x + 4 es 4." },
    { term: "linear function", def_es: "una función cuya gráfica es una línea recta", example_es: "La regla y = 5x es una función lineal." },
    { term: "nonlinear function", def_es: "una función cuya gráfica no es una línea recta", example_es: "La regla y = x² es una función no lineal." },
    { term: "constant", def_es: "que se queda igual y no cambia", example_es: "Una tasa de cambio constante quiere decir que y crece lo mismo en cada paso." },
    { term: "compare", def_es: "decir en qué se parecen y en qué se diferencian dos cosas", example_es: "Puedo comparar la función A con la función B usando una tabla y una gráfica." },
  ],
  talk: [
    { en: "What goes in, and what comes out? What is the rule that connects them?", es: "¿Qué entra y qué sale? ¿Cuál es la regla que los conecta?" },
    { en: "Where does it start, and how much does it change each time?", es: "¿Dónde empieza y cuánto cambia cada vez?" },
    { en: "Is the change always the same? How can you tell from the table?", es: "¿El cambio es siempre el mismo? ¿Cómo lo sabes con la tabla?" },
    { en: "Would the graph be a straight line? Why or why not?", es: "¿La gráfica sería una línea recta? ¿Por qué sí o por qué no?" },
    { en: "What is the same and what is different about these two functions?", es: "¿Qué es igual y qué es diferente en estas dos funciones?" },
  ],
  try_at_home: [
    {
      title: { en: "Ride Fare Machine", es: "La máquina de tarifas" },
      minutes: 15,
      materials: { en: "Paper and pencil, a fare list for a taxi, a ride app, or a bus pass", es: "Papel y lápiz, una lista de tarifas de taxi, de una aplicación de viajes o de un pase de autobús" },
      steps: {
        en: [
          "Say a ride costs $3 to start plus $2 per mile. The input is the miles. The output is the cost.",
          "Make a table for 0, 1, 2, 3 and 5 miles.",
          "Find the rate of change (how much more for each mile: $2) and the initial value (cost at 0 miles: $3).",
          "Write the rule: y = 2x + 3. Check it with 5 miles.",
        ],
        es: [
          "Digan que un viaje cuesta $3 de inicio más $2 por milla. La entrada son las millas. La salida es el costo.",
          "Hagan una tabla para 0, 1, 2, 3 y 5 millas.",
          "Hallen la tasa de cambio (cuánto más por cada milla: $2) y el valor inicial (el costo a 0 millas: $3).",
          "Escriban la regla: y = 2x + 3. Compruébenla con 5 millas.",
        ],
      },
    },
    {
      title: { en: "Compare Two Plans", es: "Comparar dos planes" },
      minutes: 15,
      materials: { en: "Paper and pencil, a ruler, two savings plans or two prices", es: "Papel y lápiz, una regla, dos planes de ahorro o dos precios" },
      steps: {
        en: [
          "Function A: Ana starts with $10 and saves $4 per week. Function B: Ben starts with $0 and saves $6 per week.",
          "Show A as a rule (y = 4x + 10) and B as a table (0, 6, 12, 18).",
          "Ask: which has a greater initial value? Which has a greater rate of change?",
          "Say: \"Both save money, whereas Ana starts with more and Ben saves faster.\"",
        ],
        es: [
          "Función A: Ana empieza con $10 y ahorra $4 por semana. Función B: Ben empieza con $0 y ahorra $6 por semana.",
          "Muestren A como regla (y = 4x + 10) y B como tabla (0, 6, 12, 18).",
          "Pregunten: ¿cuál tiene mayor valor inicial? ¿Cuál tiene mayor tasa de cambio?",
          "Digan: \"Los dos ahorran dinero, mientras que Ana empieza con más y Ben ahorra más rápido\".",
        ],
      },
    },
    {
      title: { en: "Straight or Curved?", es: "¿Recta o curva?" },
      minutes: 15,
      materials: { en: "Graph paper or a grid, a pencil, a ruler", es: "Papel cuadriculado o una cuadrícula, un lápiz, una regla" },
      steps: {
        en: [
          "Make two tables: y = 2x for x = 0, 1, 2, 3 and y = x × x for x = 0, 1, 2, 3.",
          "Look at how the outputs change. In the first, y goes up by 2 each time. In the second, it goes up by 1, 3, 5.",
          "Plot both on a graph. Which one is a straight line?",
          "Say: the first is a linear function, and the second is a nonlinear function.",
        ],
        es: [
          "Hagan dos tablas: y = 2x para x = 0, 1, 2, 3 y y = x × x para x = 0, 1, 2, 3.",
          "Miren cómo cambian las salidas. En la primera, y sube 2 cada vez. En la segunda, sube 1, 3, 5.",
          "Ubiquen las dos en una gráfica. ¿Cuál es una línea recta?",
          "Digan: la primera es una función lineal y la segunda es una función no lineal.",
        ],
      },
    },
    {
      title: { en: "Function Machine Game", es: "Juego de la máquina de funciones" },
      minutes: 10,
      materials: { en: "Paper and pencil, a partner", es: "Papel y lápiz, un compañero" },
      steps: {
        en: [
          "One person is the machine and secretly picks a rule, like \"multiply by 3, then add 1\".",
          "The other gives an input, like 2. The machine says the output, 7.",
          "Try 4 more inputs and write a table. Can the guesser figure out the rule?",
          "Ask: what is the rate of change in the table? What is the output when the input is 0?",
        ],
        es: [
          "Una persona es la máquina y elige en secreto una regla, como \"multiplicar por 3 y sumar 1\".",
          "La otra da una entrada, como 2. La máquina dice la salida, 7.",
          "Prueben 4 entradas más y anoten una tabla. ¿Puede adivinar la regla?",
          "Pregunten: ¿cuál es la tasa de cambio en la tabla? ¿Cuál es la salida cuando la entrada es 0?",
        ],
      },
    },
  ],
  say_it: [
    { en: "Both Function [A] and Function [B] are [linear] because [the graph is a straight line].", es: "Tanto la función [A] como la función [B] son [lineales] porque [la gráfica es una línea recta]." },
    { en: "Function [A] has a greater [initial value], whereas Function [B] has [a greater rate of change].", es: "La función [A] tiene mayor [valor inicial], mientras que la función [B] tiene [mayor tasa de cambio]." },
    { en: "The rate of change is [2], which means the output [increases] by [2] for each 1 input.", es: "La tasa de cambio es [2], lo que quiere decir que la salida [aumenta] [2] por cada 1 de entrada." },
    { en: "The initial value is [3], so the function starts at [3].", es: "El valor inicial es [3], entonces la función empieza en [3]." },
  ],
  help: {
    en: [
      "You do not need to know the formulas. Ask your child to tell you what goes in, what comes out, and where it starts.",
      "Use real stories: fares, savings, phone minutes. Ask \"what changes, and by how much?\"",
      "Ask your child to show the same function in a table and in words.",
      "Ask \"what is the same and what is different?\" when comparing two functions.",
    ],
    es: [
      "No necesitan saber las fórmulas. Pídanle a su hijo o hija que les cuente qué entra, qué sale y dónde empieza.",
      "Usen historias reales: tarifas, ahorros, minutos de teléfono. Pregunten \"¿qué cambia y cuánto?\".",
      "Pídanle a su hijo o hija que muestre la misma función en una tabla y con palabras.",
      "Pregunten \"¿qué es igual y qué es diferente?\" cuando comparen dos funciones.",
    ],
  },
  home_language: {
    en: "Many words are close in both languages: function (función), linear (lineal), constant (constante), compare (comparar). Ask your child to tell the fare or savings story in Spanish, then name the input (entrada) and the output (salida) in both languages.",
    es: "Muchas palabras son parecidas en los dos idiomas: función (function), lineal (linear), constante (constant), comparar (compare). Pídanle a su hijo o hija que cuente la historia de la tarifa o del ahorro en español y luego nombre la entrada (input) y la salida (output) en los dos idiomas.",
  },
  celebrate: {
    en: "You will know it is working when your child can describe a rule in a table, a graph and words, and tell you, in any language, where it starts and how fast it changes.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda describir una regla en una tabla, una gráfica y con palabras, y decirles, en el idioma que quiera, dónde empieza y qué tan rápido cambia.",
  },
};
