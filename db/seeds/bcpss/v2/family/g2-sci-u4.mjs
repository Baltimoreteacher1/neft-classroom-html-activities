// BCPSS Family Guide (EN/ES) — g2-sci-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 2 Science unit on stopping erosion with a model hill. Vocabulary order matches ../units/g2-sci-u4.mjs.

export default {
  summary: {
    en: "Your child is learning to build and test a barrier that keeps a hillside from washing away. Engineers test a model, count what washed away, and use that data to say which design works best. It matters on every Baltimore slope where rain can carry soil toward a storm drain.",
    es: "Su hijo o hija está aprendiendo a construir y probar una barrera que evita que una ladera se la lleve el agua. Los ingenieros prueban un modelo, cuentan lo que se llevó el agua y usan esos datos para decir qué diseño funciona mejor. Sirve en cada pendiente de Baltimore donde la lluvia puede arrastrar tierra hacia un desagüe.",
  },
  goals: {
    en: [
      "I can test barriers on a model hill.",
      "I can use data to compare designs.",
      "I can make a claim and prove it with evidence.",
    ],
    es: [
      "Puedo probar barreras en una colina de modelo.",
      "Puedo usar datos para comparar diseños.",
      "Puedo hacer una afirmación y probarla con evidencia.",
    ],
  },
  vocab: [
    { term: "erosion", def_es: "cuando el viento o el agua se llevan tierra y rocas a otro lugar; es casi igual en inglés", example_es: "La erosión se llevó la tierra de la colina." },
    { term: "barrier", def_es: "algo que se construye para frenar el viento o el agua; en español se dice 'barrera'", example_es: "Las piedras fueron la barrera de nuestra colina." },
    { term: "design", def_es: "un plan para construir algo; en español se dice 'diseño'", example_es: "Nuestro diseño usa pasto y piedritas." },
    { term: "model", def_es: "una copia pequeña que muestra cómo funciona algo; en español se dice 'modelo'", example_es: "Hicimos un modelo de colina en una bandeja." },
    { term: "test", def_es: "probar algo para saber qué tan bien funciona", example_es: "Vamos a probar la barrera con agua." },
    { term: "data", def_es: "los números y datos que reúnes durante una prueba", example_es: "Nuestros datos dicen que se cayeron dos cucharadas de tierra." },
    { term: "compare", def_es: "mirar en qué se parecen y en qué son diferentes dos cosas; en español se dice 'comparar'", example_es: "Voy a comparar el pasto con las piedras." },
    { term: "evidence", def_es: "datos o números que muestran que una afirmación es verdadera; en español se dice 'evidencia'", example_es: "Mi evidencia es el número de cucharadas." },
    { term: "claim", def_es: "una oración sobre lo que piensas que es verdad", example_es: "Mi afirmación es que el pasto funcionó mejor." },
    { term: "solution", def_es: "una respuesta a un problema; en español se dice 'solución'", example_es: "Las plantas son una buena solución para la erosión." },
  ],
  talk: [
    { en: "What did you build to keep the soil in place?", es: "¿Qué construiste para que la tierra se quedara en su lugar?" },
    { en: "How much soil washed away? How do you know?", es: "¿Cuánta tierra se llevó el agua? ¿Cómo lo sabes?" },
    { en: "Which design worked best, and what is your proof?", es: "¿Cuál diseño funcionó mejor y cuál es tu prueba?" },
    { en: "What would you change for the next test?", es: "¿Qué cambiarías para la próxima prueba?" },
    { en: "Where do you see something that stops soil from washing away near us?", es: "¿Dónde ves cerca de nosotros algo que evita que se lave la tierra?" },
  ],
  try_at_home: [
    {
      title: { en: "Model Hill Test", es: "Prueba de la colina de modelo" },
      minutes: 15,
      materials: { en: "A baking pan, soil, a cup of water, a small bowl, a spoon, a book to tilt the pan", es: "Un molde para hornear, tierra, una taza de agua, un tazón pequeño, una cuchara y un libro para inclinar el molde" },
      steps: {
        en: [
          "Pile soil at the high end of the pan. Put the bowl at the low end to catch what washes down.",
          "Pour one cup of water over the hill slowly, like rain.",
          "Spoon the soil from the bowl and count how many spoons washed away. Write the number. That is data.",
          "Say: with no barrier, [number] spoons washed away.",
        ],
        es: [
          "Amontonen tierra en el extremo alto del molde. Pongan el tazón en el extremo bajo para recoger lo que baje.",
          "Echen una taza de agua sobre la colina, despacio, como lluvia.",
          "Saquen con la cuchara la tierra del tazón y cuenten cuántas cucharadas se cayeron. Escriban el número. Eso son datos.",
          "Digan: sin barrera, [número] cucharadas se cayeron.",
        ],
      },
    },
    {
      title: { en: "Barrier Builder", es: "Constructor de barreras" },
      minutes: 20,
      materials: { en: "Pebbles, grass clippings or leaves, craft sticks or twigs, the same pan and cup of water", es: "Piedritas, pasto cortado u hojas, palitos de madera o ramitas, el mismo molde y la misma taza de agua" },
      steps: {
        en: [
          "Rebuild the same hill. Add a barrier, such as pebbles or grass, across the slope.",
          "Pour the same amount of water in the same way. Keep the test fair.",
          "Spoon and count what washed away. Write the number next to the barrier.",
          "Try a different barrier and compare the numbers.",
        ],
        es: [
          "Rehagan la misma colina. Pongan una barrera, como piedritas o pasto, atravesada en la pendiente.",
          "Echen la misma cantidad de agua de la misma manera. Que la prueba sea justa.",
          "Saquen con la cuchara y cuenten lo que se cayó. Escriban el número junto a la barrera.",
          "Prueben otra barrera y comparen los números.",
        ],
      },
    },
    {
      title: { en: "Claim, Proof, Reason", es: "Afirmación, prueba y razón" },
      minutes: 10,
      materials: { en: "Your list of numbers, paper and a pencil", es: "Su lista de números, papel y lápiz" },
      steps: {
        en: [
          "Look at your list. Which barrier had the smallest number?",
          "Say the claim: the [design] worked best.",
          "Give the proof: because only [number] spoons washed away.",
          "Add the reason: the [roots or pebbles] hold the soil in place. Ask: what would you try next?",
        ],
        es: [
          "Miren su lista. ¿Cuál barrera tuvo el número más pequeño?",
          "Digan la afirmación: el [diseño] funcionó mejor.",
          "Den la prueba: porque solo [número] cucharadas se cayeron.",
          "Agreguen la razón: las [raíces o piedritas] sujetan la tierra. Pregunten: ¿qué probarías después?",
        ],
      },
    },
    {
      title: { en: "Hillside Walk", es: "Paseo por las laderas" },
      minutes: 15,
      materials: { en: "A walk around the neighborhood or a park", es: "Un paseo por el vecindario o un parque" },
      steps: {
        en: [
          "Look for hills or slopes. Is there grass, a wall, rocks, or bare dirt?",
          "Find signs of washed soil, like mud near a storm drain or a gully.",
          "Look for barriers: a wall, steps, a fence, plants, a rain garden.",
          "Ask: which would work best on a hill, and what evidence do you see?",
        ],
        es: [
          "Busquen colinas o pendientes. ¿Hay pasto, un muro, rocas o tierra sin cubrir?",
          "Busquen señales de tierra arrastrada, como lodo cerca de un desagüe o un surco.",
          "Busquen barreras: un muro, escalones, una cerca, plantas, un jardín de lluvia.",
          "Pregunten: ¿cuál funcionaría mejor en una colina y qué evidencia ven?",
        ],
      },
    },
  ],
  say_it: [
    { en: "The [grass] worked best because [data].", es: "El [pasto] funcionó mejor porque [datos]." },
    { en: "With [no barrier], [number] spoons washed away.", es: "Con [ninguna barrera], se cayeron [número] cucharadas." },
    { en: "The [design] works because it [reason].", es: "El [diseño] funciona porque [razón]." },
    { en: "I compared the [pebbles] and the [grass] and found [result].", es: "Comparé las [piedritas] y el [pasto] y encontré [resultado]." },
  ],
  help: {
    en: [
      "Ask \"how do you know?\" and \"what is your proof?\" in any language.",
      "Let your child design the barrier. You can hold the cup.",
      "If the test does not work, ask \"what could we change?\"",
      "Do the test in a pan or outside for easy cleanup.",
    ],
    es: [
      "Pregunten \"¿cómo lo sabes?\" y \"¿cuál es tu prueba?\" en cualquier idioma.",
      "Dejen que su hijo o hija diseñe la barrera. Ustedes pueden sostener la taza.",
      "Si la prueba no funciona, pregunten \"¿qué podríamos cambiar?\"",
      "Hagan la prueba en un molde o afuera para limpiar fácil.",
    ],
  },
  home_language: {
    en: "Say the engineer words in Spanish first, then English. Many are cousins: barrier (barrera), design (diseño), model (modelo), evidence (evidencia), solution (solución), compare (comparar).",
    es: "Digan primero las palabras de ingeniería en español y luego en inglés. Muchas son primas: barrier (barrera), design (diseño), model (modelo), evidence (evidencia), solution (solución), compare (comparar).",
  },
  celebrate: {
    en: "You will know it is working when your child tells you which design worked best and gives a number as proof, in any language.",
    es: "Sabrán que está funcionando cuando su hijo o hija les diga qué diseño funcionó mejor y dé un número como prueba, en el idioma que quiera.",
  },
};
