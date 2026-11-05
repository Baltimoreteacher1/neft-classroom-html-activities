// Science Investigation Lab, grades 3-5 case: "Which soil helps bean seeds sprout fastest?" (fair test).
// Raw authoring shape; src/content/science-lab.js normalizes `help` tuples and assembles CASES.
//
// The dataset is CLASSROOM SAMPLE DATA written for practice, labelled that way on screen, and never presented as
// a real measurement. Spanish is machine-assisted and has not been reviewed by a person.
// `match` lists are engine data (words a learner might use); they are never shown.

export const SOIL_CASE = {
  id: "soil-sprout",
  band: "3-5",
  title: {
    en: "Which soil helps bean seeds sprout fastest?",
    es: "¿Qué tierra ayuda a que las semillas de frijol broten más rápido?",
  },
  question: {
    en: "Which soil helps bean seeds sprout fastest?",
    es: "¿Qué tierra ayuda a que las semillas de frijol broten más rápido?",
  },
  phenomenon: {
    en: "Our class planted bean seeds in clear cups on the window shelf. Some cups have one kind of soil and some have another. A few cups got a little water each day, and a few got more. Some seeds poked out a green shoot early. Others took a long time. We want to know why.",
    es: "Nuestra clase sembró semillas de frijol en vasos transparentes en el estante de la ventana. Algunos vasos tienen un tipo de tierra y otros tienen otro. A unos vasos les echamos poca agua cada día y a otros les echamos más. Algunas semillas sacaron un brote verde temprano. Otras tardaron mucho. Queremos saber por qué.",
  },
  vocab: [
    {
      term: { en: "sprout", es: "brotar" },
      meaning: {
        en: "When a seed grows its first green shoot.",
        es: "Cuando una semilla saca su primer brote verde.",
      },
    },
    {
      term: { en: "variable", es: "variable" },
      meaning: {
        en: "Something in a test that can change.",
        es: "Algo en una prueba que puede cambiar.",
      },
    },
    {
      term: { en: "fair test", es: "prueba justa" },
      meaning: {
        en: "Change one thing. Keep the rest the same.",
        es: "Cambia una cosa. Mantén todo lo demás igual.",
      },
    },
    {
      term: { en: "data", es: "datos" },
      meaning: { en: "Numbers and notes we collect.", es: "Números y notas que juntamos." },
    },
    {
      term: { en: "evidence", es: "evidencia" },
      meaning: {
        en: "Facts from our data that show something.",
        es: "Hechos de nuestros datos que muestran algo.",
      },
    },
  ],
  variables: [
    {
      id: "soil",
      label: { en: "Kind of soil", es: "Tipo de tierra" },
      values: [
        {
          id: "sand",
          label: { en: "Sand", es: "Arena" },
          match: { en: ["sand", "sandy"], es: ["arena", "arenosa"] },
        },
        {
          id: "garden",
          label: { en: "Garden soil", es: "Tierra de jardín" },
          match: {
            en: ["garden soil", "garden", "dark soil"],
            es: ["tierra de jardin", "tierra de jardín", "jardin", "tierra oscura"],
          },
        },
        {
          id: "clay",
          label: { en: "Clay soil", es: "Tierra de arcilla" },
          match: { en: ["clay", "clay soil"], es: ["arcilla", "tierra de arcilla"] },
        },
      ],
      match: {
        en: ["soil", "soils", "dirt", "kind of soil", "type of soil"],
        es: ["tierra", "tierras", "suelo", "tipo de tierra"],
      },
    },
    {
      id: "water",
      label: { en: "Water each day", es: "Agua cada día" },
      values: [
        {
          id: "2",
          label: { en: "2 spoons", es: "2 cucharadas" },
          match: {
            en: ["2 spoons", "two spoons", "a little water", "little water", "less water"],
            es: ["2 cucharadas", "dos cucharadas", "poca agua", "menos agua"],
          },
        },
        {
          id: "4",
          label: { en: "4 spoons", es: "4 cucharadas" },
          match: {
            en: ["4 spoons", "four spoons", "a lot of water", "lots of water", "more water"],
            es: ["4 cucharadas", "cuatro cucharadas", "mucha agua", "mas agua", "más agua"],
          },
        },
      ],
      match: {
        en: ["water", "watered", "spoons", "spoon", "amount of water"],
        es: ["agua", "regar", "regado", "cucharadas", "cucharada", "cantidad de agua"],
      },
    },
  ],
  focus: "soil",
  measure: {
    id: "days",
    short: { en: "number of days to sprout", es: "el número de días para brotar" },
    label: { en: "Days until the first green shoot", es: "Días hasta el primer brote verde" },
    unit: { en: "days", es: "días" },
    match: {
      en: [
        "day",
        "days",
        "sprout",
        "sprouts",
        "sprouted",
        "sprouting",
        "shoot",
        "how long",
        "how many days",
        "grow",
        "grows",
        "grew",
      ],
      es: [
        "dia",
        "dias",
        "día",
        "días",
        "brota",
        "brotan",
        "brotar",
        "broto",
        "brotó",
        "brote",
        "cuantos dias",
        "cuántos días",
        "crece",
        "crecen",
      ],
    },
  },
  better: "lower",
  bestWords: {
    en: ["fastest", "faster", "quickest", "quicker", "sooner", "earliest", "best", "fewest"],
    es: ["mas rapido", "mas rapida", "mas pronto", "primero", "mejor", "menos dias"],
  },
  worstWords: {
    en: ["slowest", "slower", "longest", "longer", "latest", "worst"],
    es: ["mas lento", "mas lenta", "mas tarde", "mas dias", "peor", "tarda mas"],
  },
  dataset: {
    unit: { en: "days", es: "días" },
    setup: {
      en: "Every cup held 3 bean seeds of the same kind, sat on the same shelf, and got the same light. We looked at the cups every morning.",
      es: "Cada vaso tenía 3 semillas de frijol del mismo tipo, estaba en el mismo estante y recibía la misma luz. Mirábamos los vasos cada mañana.",
    },
    note: {
      en: "Classroom sample data written for practice. These numbers are not from a real experiment, and real results can be different.",
      es: "Datos de muestra del salón de clases escritos para practicar. Estos números no son de un experimento real, y los resultados reales pueden ser diferentes.",
    },
    rows: [
      { id: "r1", conditions: { soil: "sand", water: "2" }, measures: { days: 9 } },
      { id: "r2", conditions: { soil: "sand", water: "4" }, measures: { days: 8 } },
      { id: "r3", conditions: { soil: "garden", water: "2" }, measures: { days: 6 } },
      { id: "r4", conditions: { soil: "garden", water: "4" }, measures: { days: 5 } },
      { id: "r5", conditions: { soil: "clay", water: "2" }, measures: { days: 8 } },
      { id: "r6", conditions: { soil: "clay", water: "4" }, measures: { days: 11 } },
      { id: "r7", conditions: { soil: "garden", water: "4" }, measures: { days: 6 } },
      { id: "r8", conditions: { soil: "sand", water: "2" }, measures: { days: 10 } },
    ],
  },
  // [stage, kind, en, es]: three per stage. Help gives structure and questions, never an answer or the winning condition.
  help: [
    [
      "notice",
      "prompt",
      "What do you see in the cups? Tell three things before you say why.",
      "¿Qué ves en los vasos? Di tres cosas antes de decir por qué.",
    ],
    ["notice", "frame", "I see ___. I wonder ___.", "Veo ___. Me pregunto ___."],
    [
      "notice",
      "word",
      "Observe: look closely and tell what you see, hear, or feel.",
      "Observar: mirar con atención y decir lo que ves, oyes o sientes.",
    ],
    [
      "question",
      "frame",
      "What happens to ___ when I change ___?",
      "¿Qué le pasa a ___ cuando cambio ___?",
    ],
    [
      "question",
      "word",
      "Testable question: you can answer it by doing a test and counting or measuring.",
      "Pregunta comprobable: se puede responder haciendo una prueba y contando o midiendo.",
    ],
    [
      "question",
      "prompt",
      "Can you answer your question with a number, not just yes or no?",
      "¿Puedes responder tu pregunta con un número, y no solo con sí o no?",
    ],
    [
      "hypothesis",
      "frame",
      "If I change ___, then ___ will ___ because ___.",
      "Si cambio ___, entonces ___ va a ___ porque ___.",
    ],
    [
      "hypothesis",
      "word",
      "Hypothesis: a smart guess you can test, with a reason.",
      "Hipótesis: una suposición inteligente que puedes probar, con una razón.",
    ],
    [
      "hypothesis",
      "prompt",
      "What do you think will happen? Why do you think that?",
      "¿Qué crees que va a pasar? ¿Por qué lo crees?",
    ],
    [
      "plan",
      "frame",
      "I will change ___. I will keep ___ the same. I will count ___. I will do it ___ times.",
      "Voy a cambiar ___. Voy a mantener ___ igual. Voy a contar ___. Lo voy a hacer ___ veces.",
    ],
    [
      "plan",
      "word",
      "Keep the same: do not change it, so the test stays fair.",
      "Mantener igual: no lo cambies, para que la prueba sea justa.",
    ],
    [
      "plan",
      "prompt",
      "If two things are different in your cups, how will you know which one caused the change?",
      "Si dos cosas son diferentes en tus vasos, ¿cómo vas a saber cuál causó el cambio?",
    ],
    [
      "collect",
      "prompt",
      "Write each result next to its cup. What did that cup have?",
      "Escribe cada resultado junto a su vaso. ¿Qué tenía ese vaso?",
    ],
    [
      "collect",
      "word",
      "Trial: one time we do the test. More trials help us trust the data.",
      "Ensayo: una vez que hacemos la prueba. Más ensayos nos ayudan a confiar en los datos.",
    ],
    [
      "collect",
      "prompt",
      "Two cups were the same, but the numbers are a little different. What small things could cause that?",
      "Dos vasos eran iguales, pero los números son un poco diferentes. ¿Qué cosas pequeñas podrían causarlo?",
    ],
    [
      "represent",
      "prompt",
      "How can you show your numbers so a friend can see the differences quickly?",
      "¿Cómo puedes mostrar tus números para que un amigo vea las diferencias rápido?",
    ],
    [
      "represent",
      "word",
      "Table: rows and columns that keep data in order. Give every column a name.",
      "Tabla: filas y columnas que ordenan los datos. Ponle nombre a cada columna.",
    ],
    [
      "represent",
      "prompt",
      "Did you write the unit (like days) on your table or graph?",
      "¿Escribiste la unidad (como días) en tu tabla o gráfica?",
    ],
    [
      "claim",
      "frame",
      "In our test, ___ had ___ days than ___.",
      "En nuestra prueba, ___ tuvo ___ días que ___.",
    ],
    [
      "claim",
      "word",
      "Claim: one sentence that answers our question.",
      "Afirmación: una oración que responde nuestra pregunta.",
    ],
    [
      "claim",
      "prompt",
      "Does your sentence answer our question? Does it tell what you compared?",
      "¿Tu oración responde nuestra pregunta? ¿Dice qué comparaste?",
    ],
    [
      "evidence",
      "prompt",
      "Which rows of the table show your claim? Pick the best ones.",
      "¿Qué filas de la tabla muestran tu afirmación? Elige las mejores.",
    ],
    [
      "evidence",
      "word",
      "Evidence: facts from our data that you can point to.",
      "Evidencia: hechos de nuestros datos que puedes señalar.",
    ],
    [
      "evidence",
      "prompt",
      "Is there a row that does not match? What can you say about it?",
      "¿Hay una fila que no coincide? ¿Qué puedes decir de ella?",
    ],
    [
      "reasoning",
      "frame",
      "This shows my claim is true because ___.",
      "Esto muestra que mi afirmación es cierta porque ___.",
    ],
    [
      "reasoning",
      "word",
      "Reasoning: telling how the evidence and the claim fit together.",
      "Razonamiento: decir cómo encajan la evidencia y la afirmación.",
    ],
    [
      "reasoning",
      "prompt",
      "Which number will you use? Is it in our table?",
      "¿Qué número vas a usar? ¿Está en nuestra tabla?",
    ],
    [
      "revise",
      "prompt",
      "Read the checker's questions. Pick one and make your writing answer it.",
      "Lee las preguntas del revisor. Elige una y haz que tu texto la responda.",
    ],
    [
      "revise",
      "frame",
      "First I wrote ___. Now I wrote ___.",
      "Primero escribí ___. Ahora escribí ___.",
    ],
    [
      "revise",
      "word",
      "Revise: make your writing clearer by changing ideas, not only spelling.",
      "Revisar: hacer tu texto más claro cambiando ideas, no solo la ortografía.",
    ],
    [
      "present",
      "frame",
      "We asked ___. We tested ___. Our data show ___. So we say ___.",
      "Preguntamos ___. Probamos ___. Nuestros datos muestran ___. Entonces decimos ___.",
    ],
    [
      "present",
      "prompt",
      "Say your question, test, data, and claim in order. Which part is hard to say?",
      "Di tu pregunta, prueba, datos y afirmación en orden. ¿Qué parte es difícil de decir?",
    ],
    [
      "present",
      "word",
      "Present: tell your science work out loud so others understand.",
      "Presentar: contar tu trabajo de ciencias en voz alta para que otros entiendan.",
    ],
    [
      "reflect",
      "prompt",
      "What did you change when you wrote the second time? What helped?",
      "¿Qué cambiaste cuando escribiste la segunda vez? ¿Qué te ayudó?",
    ],
    ["reflect", "frame", "Next time I will ___.", "La próxima vez voy a ___."],
    [
      "reflect",
      "word",
      "Reflect: think about what you did and what you want to do next.",
      "Reflexionar: pensar en lo que hiciste y en lo que quieres hacer después.",
    ],
  ],
  transfer: {
    id: "soil-sprout-transfer",
    band: "3-5",
    title: {
      en: "Which spot helps lettuce plants grow tallest?",
      es: "¿Qué lugar ayuda a que las plantas de lechuga crezcan más altas?",
    },
    question: {
      en: "Which spot helps lettuce plants grow tallest?",
      es: "¿Qué lugar ayuda a que las plantas de lechuga crezcan más altas?",
    },
    phenomenon: {
      en: "A class grows small lettuce plants in two places: a window shelf and a shelf in the corner of the room. They also use two sizes of pot. After 10 days they measure how tall each plant is.",
      es: "Una clase cultiva pequeñas plantas de lechuga en dos lugares: un estante junto a la ventana y un estante en la esquina del salón. También usan dos tamaños de maceta. Después de 10 días miden qué tan alta está cada planta.",
    },
    prompt: {
      en: "With all help closed, write a question you can test, then a claim about this data with the rows that show it and your reasoning.",
      es: "Con toda la ayuda cerrada, escribe una pregunta que puedas probar, y luego una afirmación sobre estos datos con las filas que la muestran y tu razonamiento.",
    },
    variables: [
      {
        id: "spot",
        label: { en: "Where the plant sits", es: "Dónde está la planta" },
        values: [
          {
            id: "window",
            label: { en: "Window shelf", es: "Estante de la ventana" },
            match: {
              en: ["window", "window shelf", "sunny"],
              es: ["ventana", "estante de la ventana", "soleado"],
            },
          },
          {
            id: "corner",
            label: { en: "Corner shelf", es: "Estante de la esquina" },
            match: {
              en: ["corner", "corner shelf", "shady"],
              es: ["esquina", "estante de la esquina", "sombra"],
            },
          },
        ],
        match: {
          en: ["spot", "place", "shelf", "where", "light"],
          es: ["lugar", "estante", "donde", "luz"],
        },
      },
      {
        id: "pot",
        label: { en: "Pot size", es: "Tamaño de la maceta" },
        values: [
          {
            id: "small",
            label: { en: "Small pot", es: "Maceta pequeña" },
            match: {
              en: ["small pot", "small"],
              es: ["maceta pequena", "maceta pequeña", "pequena", "pequeña"],
            },
          },
          {
            id: "large",
            label: { en: "Large pot", es: "Maceta grande" },
            match: {
              en: ["large pot", "big pot", "large", "big"],
              es: ["maceta grande", "grande"],
            },
          },
        ],
        match: { en: ["pot", "pots", "size"], es: ["maceta", "macetas", "tamano", "tamaño"] },
      },
    ],
    focus: "spot",
    measure: {
      id: "cm",
      short: { en: "height", es: "la altura" },
      label: {
        en: "Height after 10 days (centimeters)",
        es: "Altura después de 10 días (centímetros)",
      },
      unit: { en: "centimeters", es: "centímetros" },
      match: {
        en: [
          "cm",
          "centimeter",
          "centimeters",
          "tall",
          "taller",
          "tallest",
          "height",
          "grow",
          "grew",
        ],
        es: ["cm", "centimetro", "centimetros", "alta", "mas alta", "altura", "crece", "crecio"],
      },
    },
    better: "higher",
    bestWords: {
      en: ["tallest", "taller", "most", "best", "highest"],
      es: ["mas alta", "mayor altura", "mejor"],
    },
    worstWords: {
      en: ["shortest", "shorter", "least", "worst", "lowest"],
      es: ["mas baja", "menor altura", "peor"],
    },
    dataset: {
      unit: { en: "centimeters", es: "centímetros" },
      setup: {
        en: "Every plant got the same soil and the same water.",
        es: "Cada planta recibió la misma tierra y la misma agua.",
      },
      note: {
        en: "Classroom sample data written for practice. These numbers are not from a real experiment, and real results can be different.",
        es: "Datos de muestra del salón de clases escritos para practicar. Estos números no son de un experimento real, y los resultados reales pueden ser diferentes.",
      },
      rows: [
        { id: "t1", conditions: { spot: "window", pot: "small" }, measures: { cm: 7 } },
        { id: "t2", conditions: { spot: "window", pot: "large" }, measures: { cm: 9 } },
        { id: "t3", conditions: { spot: "corner", pot: "small" }, measures: { cm: 3 } },
        { id: "t4", conditions: { spot: "corner", pot: "large" }, measures: { cm: 4 } },
      ],
    },
  },
};
