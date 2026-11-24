// BCPSS Family Guide (EN/ES) — g8-math-u2. Schema: ../schema.mjs (validateFamily)
// Home version of the unit on linear equations and systems of equations. Vocabulary order matches ../units/g8-math-u2.mjs.

export default {
  summary: {
    en: "Your child is learning to solve equations with letters on both sides, and to solve two equations together. Two equations together are called a system, and the answer is the one point where two lines cross. It matters when you compare two phone plans, two rental prices, or two jobs, and want to know when they cost the same.",
    es: "Su hijo o hija está aprendiendo a resolver ecuaciones con letras en los dos lados y a resolver dos ecuaciones juntas. Dos ecuaciones juntas se llaman sistema y la respuesta es el punto donde se cruzan dos rectas. Sirve para comparar dos planes de teléfono, dos precios de renta o dos trabajos y saber cuándo cuestan lo mismo.",
  },
  goals: {
    en: [
      "I can solve equations with a variable on both sides.",
      "I can solve a system of equations by graphing, substitution and elimination.",
      "I can justify my answer by checking it in both equations.",
    ],
    es: [
      "Puedo resolver ecuaciones con una variable en los dos lados.",
      "Puedo resolver un sistema de ecuaciones con una gráfica, con sustitución y con eliminación.",
      "Puedo justificar mi respuesta comprobándola en las dos ecuaciones.",
    ],
  },
  vocab: [
    { term: "solution", def_es: "el valor de la variable que hace verdadera una ecuación", example_es: "La solución de 2x + 3 = 11 es x = 4." },
    { term: "system of equations", def_es: "dos o más ecuaciones con las mismas variables que se resuelven juntas", example_es: "Los precios de las dos bicicletas forman un sistema de ecuaciones." },
    { term: "substitution", def_es: "cambiar una variable por una expresión que es igual a ella", example_es: "Con la sustitución puedo cambiar y por 2x + 1 en la otra ecuación." },
    { term: "elimination", def_es: "sumar o restar dos ecuaciones para que una de las variables se cancele", example_es: "La eliminación funciona bien cuando una ecuación tiene +y y la otra tiene −y." },
    { term: "slope", def_es: "qué tan inclinada está una recta: el cambio en y por cada cambio de 1 en x", example_es: "La pendiente de y = 4x + 8 es 4." },
    { term: "y-intercept", def_es: "el punto donde una recta cruza el eje vertical", example_es: "La intersección con el eje y de y = 4x + 8 es 8." },
    { term: "intersect", def_es: "cruzarse en un punto", example_es: "Las dos rectas se intersecan en el punto (2, 5)." },
    { term: "parallel", def_es: "que se mantiene siempre a la misma distancia y nunca se cruza, como los rieles de un tren", example_es: "Las rectas y = 3x + 1 y y = 3x − 2 son paralelas." },
    { term: "justify", def_es: "explicar por qué una respuesta o un método es correcto", example_es: "Puedo justificar mi respuesta comprobándola en las dos ecuaciones." },
  ],
  talk: [
    { en: "Which plan or price is better at the start, and which is better later? How do you know?", es: "¿Qué plan o precio es mejor al principio y cuál es mejor después? ¿Cómo lo sabes?" },
    { en: "When do the two cost the same? What does that point mean?", es: "¿Cuándo cuestan lo mismo los dos? ¿Qué significa ese punto?" },
    { en: "Why did you choose substitution, or elimination, for this problem?", es: "¿Por qué elegiste la sustitución o la eliminación para este problema?" },
    { en: "How can you check your answer in both equations?", es: "¿Cómo puedes comprobar tu respuesta en las dos ecuaciones?" },
    { en: "Could two lines never cross? What would that look like?", es: "¿Podrían dos rectas no cruzarse nunca? ¿Cómo se vería eso?" },
  ],
  try_at_home: [
    {
      title: { en: "Phone Plan Showdown", es: "El duelo de planes de teléfono" },
      minutes: 20,
      materials: { en: "Paper and pencil, a ruler, two plan prices (real or pretend)", es: "Papel y lápiz, una regla, los precios de dos planes (reales o inventados)" },
      steps: {
        en: [
          "Plan A costs $20 plus $5 per gigabyte. Plan B costs $5 plus $10 per gigabyte. Let y be the cost and x be the gigabytes.",
          "Make a table for 0, 1, 2, 3 and 4 gigabytes for both plans.",
          "Find the number of gigabytes where the costs are the same. Plan A: y = 5x + 20. Plan B: y = 10x + 5. At x = 3, both cost $35.",
          "Ask: which plan is cheaper if you use 1 gigabyte? If you use 5? How do you know?",
        ],
        es: [
          "El plan A cuesta $20 más $5 por gigabyte. El plan B cuesta $5 más $10 por gigabyte. Sea y el costo y x los gigabytes.",
          "Hagan una tabla para 0, 1, 2, 3 y 4 gigabytes en los dos planes.",
          "Hallen el número de gigabytes donde los costos son iguales. Plan A: y = 5x + 20. Plan B: y = 10x + 5. Con x = 3, los dos cuestan $35.",
          "Pregunten: ¿qué plan es más barato si usas 1 gigabyte? ¿Y si usas 5? ¿Cómo lo sabes?",
        ],
      },
    },
    {
      title: { en: "Draw Where They Meet", es: "Dibujar dónde se encuentran" },
      minutes: 15,
      materials: { en: "Graph paper or paper with a grid, a ruler, two colored pencils", es: "Papel cuadriculado o papel con cuadrícula, una regla, dos lápices de colores" },
      steps: {
        en: [
          "Use the phone plan table. Plot each plan as points on a graph, with gigabytes across and cost up.",
          "Draw a line through each set of points in a different color.",
          "Find where the lines cross. Read the point (3, 35).",
          "Ask: what does the crossing point tell us? Which line is steeper, and what does steeper mean for the cost?",
        ],
        es: [
          "Usen la tabla de los planes. Ubiquen cada plan como puntos en una gráfica, con los gigabytes hacia el lado y el costo hacia arriba.",
          "Tracen una recta por cada grupo de puntos, cada una de un color.",
          "Hallen dónde se cruzan las rectas. Lean el punto (3, 35).",
          "Pregunten: ¿qué nos dice el punto de cruce? ¿Qué recta es más inclinada y qué significa eso para el costo?",
        ],
      },
    },
    {
      title: { en: "Two Number Clues", es: "Dos pistas de números" },
      minutes: 10,
      materials: { en: "Paper and pencil, a partner", es: "Papel y lápiz, un compañero" },
      steps: {
        en: [
          "Think of two numbers. Say: \"Their sum is 10 and their difference is 4.\" Write x + y = 10 and x − y = 4.",
          "Add the two equations. The y terms cancel. That is elimination: 2x = 14, so x = 7.",
          "Put x = 7 into x + y = 10. What is y? (y = 3.)",
          "Check in both equations. Switch roles with new clues.",
        ],
        es: [
          "Piensen en dos números. Digan: \"Su suma es 10 y su diferencia es 4\". Escriban x + y = 10 y x − y = 4.",
          "Sumen las dos ecuaciones. Los términos y se cancelan. Eso es eliminación: 2x = 14, entonces x = 7.",
          "Pongan x = 7 en x + y = 10. ¿Cuánto es y? (y = 3.)",
          "Comprueben en las dos ecuaciones. Cambien de papel con pistas nuevas.",
        ],
      },
    },
    {
      title: { en: "Equal on Both Sides", es: "Igual en los dos lados" },
      minutes: 10,
      materials: { en: "Paper and pencil, a few coins or counters", es: "Papel y lápiz, unas monedas o fichas" },
      steps: {
        en: [
          "Two friends are saving. Maya has $4 and saves $3 per week. Leo has $10 and saves $1 per week.",
          "Write an equation that says they have the same: 4 + 3w = 10 + w.",
          "Solve by moving the w terms to one side: subtract w from both sides, then solve. What is w? (w = 3.)",
          "Check: how much does each person have after 3 weeks? ($13.)",
        ],
        es: [
          "Dos amigos ahorran. Maya tiene $4 y ahorra $3 por semana. Leo tiene $10 y ahorra $1 por semana.",
          "Escriban una ecuación que diga que tienen lo mismo: 4 + 3w = 10 + w.",
          "Resuelvan pasando los términos con w a un lado: resten w de los dos lados y luego resuelvan. ¿Cuánto es w? (w = 3.)",
          "Comprueben: ¿cuánto tiene cada uno después de 3 semanas? ($13.)",
        ],
      },
    },
  ],
  say_it: [
    { en: "I chose [substitution] because [one equation already says y equals something].", es: "Elegí [la sustitución] porque [una ecuación ya dice que y es igual a algo]." },
    { en: "The lines intersect at ([3], [35]), so the solution is ([3], [35]).", es: "Las rectas se intersecan en ([3], [35]), entonces la solución es ([3], [35])." },
    { en: "I checked: [35] = [35], so my answer is correct.", es: "Revisé: [35] = [35], entonces mi respuesta es correcta." },
    { en: "The lines are parallel because [they have the same slope and different y-intercepts].", es: "Las rectas son paralelas porque [tienen la misma pendiente y distinta intersección con el eje y]." },
  ],
  help: {
    en: [
      "You do not need to solve systems. Ask your child to tell the story of the two plans and what the crossing point means.",
      "Use real prices: phone plans, streaming, gym fees, rental cars.",
      "Ask your child to check the answer in both equations. This is the proof.",
      "If your child is stuck, ask \"what is the same in both plans?\"",
    ],
    es: [
      "No necesitan saber resolver sistemas. Pídanle a su hijo o hija que cuente la historia de los dos planes y qué significa el punto de cruce.",
      "Usen precios reales: planes de teléfono, servicios de streaming, cuotas de gimnasio, autos de renta.",
      "Pídanle a su hijo o hija que compruebe la respuesta en las dos ecuaciones. Esa es la prueba.",
      "Si se atora, pregunten \"¿qué es igual en los dos planes?\".",
    ],
  },
  home_language: {
    en: "Many words are close in both languages: solution (solución), system (sistema), substitution (sustitución), elimination (eliminación), parallel (paralelo), justify (justificar). Ask your child to describe the two plans in Spanish, then use the English words for the math steps.",
    es: "Muchas palabras son parecidas en inglés: solución (solution), sistema (system), sustitución (substitution), eliminación (elimination), paralelo (parallel), justificar (justify). Pídanle a su hijo o hija que describa los dos planes en español y luego use las palabras en inglés para los pasos matemáticos.",
  },
  celebrate: {
    en: "You will know it is working when your child can compare two prices, tell you where they are equal, and show in any language that the answer works in both.",
    es: "Sabrán que está funcionando cuando su hijo o hija pueda comparar dos precios, decirles dónde son iguales y mostrar, en el idioma que quiera, que la respuesta funciona en los dos.",
  },
};
