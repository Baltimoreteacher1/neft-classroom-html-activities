// Science Investigation Lab, grades 3-5 case two: "Which floor lets a toy car roll the farthest?" (fair test of
// forces and motion). Raw authoring shape; src/content/science-lab.js normalizes `help` tuples and assembles CASES.
//
// The dataset is CLASSROOM SAMPLE DATA written for practice, labelled that way on screen, and never presented as
// a real measurement. Spanish is machine-assisted and has not been reviewed by a person.
// `match` lists are engine data (words a learner might use); they are never shown.

export const RAMP_CASE = {
  id: "ramp-roll",
  band: "3-5",
  title: {
    en: "Which floor lets a toy car roll the farthest?",
    es: "¿Qué piso deja que un carrito de juguete ruede más lejos?",
  },
  question: {
    en: "Which floor lets a toy car roll the farthest?",
    es: "¿Qué piso deja que un carrito de juguete ruede más lejos?",
  },
  phenomenon: {
    en: "Our class built a ramp from a board and a stack of books. We let a toy car roll down the ramp and then across the floor. Some cars stopped quickly and some rolled a long way. We laid different floors at the bottom of the ramp, and we also tried the ramp with more books. We want to know why the car stops sooner on some floors.",
    es: "Nuestra clase construyó una rampa con una tabla y una pila de libros. Dejamos rodar un carrito de juguete por la rampa y luego por el piso. Algunos carritos se detuvieron pronto y otros rodaron mucho. Pusimos diferentes pisos al final de la rampa y también probamos la rampa con más libros. Queremos saber por qué el carrito se detiene antes en algunos pisos.",
  },
  vocab: [
    {
      term: { en: "friction", es: "fricción" },
      meaning: {
        en: "A force that slows things down when they rub together.",
        es: "Una fuerza que frena las cosas cuando se rozan.",
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
      id: "surface",
      label: { en: "Kind of floor", es: "Tipo de piso" },
      values: [
        {
          id: "tile",
          label: { en: "Smooth tile", es: "Baldosa lisa" },
          match: {
            en: ["tile", "smooth tile", "smooth", "tiles"],
            es: ["baldosa", "baldosa lisa", "lisa", "lisa baldosa"],
          },
        },
        {
          id: "carpet",
          label: { en: "Carpet", es: "Alfombra" },
          match: { en: ["carpet", "rug"], es: ["alfombra", "tapete"] },
        },
        {
          id: "sandpaper",
          label: { en: "Sandpaper", es: "Papel de lija" },
          match: {
            en: ["sandpaper", "rough paper", "sand paper"],
            es: ["papel de lija", "lija", "papel rugoso"],
          },
        },
      ],
      match: {
        en: ["floor", "floors", "surface", "surfaces", "kind of floor", "type of floor"],
        es: ["piso", "pisos", "superficie", "superficies", "tipo de piso"],
      },
    },
    {
      id: "height",
      label: { en: "Ramp height", es: "Altura de la rampa" },
      values: [
        {
          id: "1",
          label: { en: "1 book", es: "1 libro" },
          match: {
            en: ["1 book", "one book", "low ramp", "lower ramp", "shorter ramp"],
            es: ["1 libro", "un libro", "rampa baja", "rampa mas baja", "rampa más baja"],
          },
        },
        {
          id: "2",
          label: { en: "2 books", es: "2 libros" },
          match: {
            en: ["2 books", "two books", "high ramp", "higher ramp", "taller ramp", "steeper"],
            es: ["2 libros", "dos libros", "rampa alta", "rampa mas alta", "rampa más alta"],
          },
        },
      ],
      match: {
        en: ["ramp", "height", "books", "book", "stack", "how high"],
        es: ["rampa", "altura", "libros", "libro", "pila", "que tan alta", "qué tan alta"],
      },
    },
  ],
  focus: "surface",
  measure: {
    id: "cm",
    short: { en: "distance", es: "la distancia" },
    label: {
      en: "Distance the car rolled after the ramp (centimeters)",
      es: "Distancia que rodó el carrito después de la rampa (centímetros)",
    },
    unit: { en: "centimeters", es: "centímetros" },
    match: {
      en: [
        "cm",
        "centimeter",
        "centimeters",
        "distance",
        "far",
        "farther",
        "farthest",
        "roll",
        "rolled",
        "rolls",
        "how far",
        "stop",
        "stops",
      ],
      es: [
        "cm",
        "centimetro",
        "centimetros",
        "centímetro",
        "centímetros",
        "distancia",
        "lejos",
        "rueda",
        "roda",
        "rodó",
        "rodo",
        "que tan lejos",
        "qué tan lejos",
        "detiene",
        "para",
      ],
    },
  },
  better: "higher",
  bestWords: {
    en: ["farthest", "farther", "furthest", "longest", "most", "best", "longer"],
    es: ["mas lejos", "más lejos", "mayor distancia", "mejor", "mas distancia", "más distancia"],
  },
  worstWords: {
    en: ["shortest", "shorter", "least", "worst", "stopped first", "closest"],
    es: ["mas cerca", "más cerca", "menor distancia", "peor", "menos distancia"],
  },
  dataset: {
    unit: { en: "centimeters", es: "centímetros" },
    setup: {
      en: "Every run used the same toy car, the same board, and the same starting spot at the top of the ramp. We let go of the car without pushing it, and we measured from the bottom of the ramp to the front of the car.",
      es: "En cada prueba usamos el mismo carrito, la misma tabla y el mismo lugar de salida arriba de la rampa. Soltamos el carrito sin empujarlo y medimos desde el final de la rampa hasta el frente del carrito.",
    },
    note: {
      en: "Classroom sample data written for practice. These numbers are not from a real experiment, and real results can be different.",
      es: "Datos de muestra del salón de clases escritos para practicar. Estos números no son de un experimento real, y los resultados reales pueden ser diferentes.",
    },
    rows: [
      { id: "r1", conditions: { surface: "tile", height: "1" }, measures: { cm: 112 } },
      { id: "r2", conditions: { surface: "tile", height: "2" }, measures: { cm: 160 } },
      { id: "r3", conditions: { surface: "carpet", height: "1" }, measures: { cm: 40 } },
      { id: "r4", conditions: { surface: "carpet", height: "2" }, measures: { cm: 64 } },
      { id: "r5", conditions: { surface: "sandpaper", height: "1" }, measures: { cm: 55 } },
      { id: "r6", conditions: { surface: "sandpaper", height: "2" }, measures: { cm: 82 } },
      { id: "r7", conditions: { surface: "tile", height: "2" }, measures: { cm: 164 } },
      { id: "r8", conditions: { surface: "carpet", height: "1" }, measures: { cm: 43 } },
    ],
  },
  // [stage, kind, en, es]: three per stage. Help gives structure and questions, never an answer or the winning condition.
  help: [
    [
      "notice",
      "prompt",
      "What do you see on the ramp and on the floor? Tell three things before you say why.",
      "¿Qué ves en la rampa y en el piso? Di tres cosas antes de decir por qué.",
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
      "Testable question: you can answer it by doing a test and measuring.",
      "Pregunta comprobable: se puede responder haciendo una prueba y midiendo.",
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
      "If I change ___, then the car will ___ because ___.",
      "Si cambio ___, entonces el carrito va a ___ porque ___.",
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
      "What do you think will happen? Think of something that slows a rolling thing. Why do you think that?",
      "¿Qué crees que va a pasar? Piensa en algo que frena a una cosa que rueda. ¿Por qué lo crees?",
    ],
    [
      "plan",
      "frame",
      "I will change ___. I will keep ___ the same. I will measure ___. I will do it ___ times.",
      "Voy a cambiar ___. Voy a mantener ___ igual. Voy a medir ___. Lo voy a hacer ___ veces.",
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
      "If two things are different in your runs, how will you know which one caused the change?",
      "Si dos cosas son diferentes en tus pruebas, ¿cómo vas a saber cuál causó el cambio?",
    ],
    [
      "collect",
      "prompt",
      "Write each result next to its run. What floor and ramp did that run have?",
      "Escribe cada resultado junto a su prueba. ¿Qué piso y qué rampa tenía esa prueba?",
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
      "Two runs were the same, but the numbers are a little different. What small things could cause that?",
      "Dos pruebas eran iguales, pero los números son un poco diferentes. ¿Qué cosas pequeñas podrían causarlo?",
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
      "Did you write the unit (like centimeters) on your table or graph?",
      "¿Escribiste la unidad (como centímetros) en tu tabla o gráfica?",
    ],
    [
      "claim",
      "frame",
      "In our test, the car rolled ___ on ___ than on ___.",
      "En nuestra prueba, el carrito rodó ___ en ___ que en ___.",
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
      "Which number will you use? Is it in our table? How does friction help you explain it?",
      "¿Qué número vas a usar? ¿Está en nuestra tabla? ¿Cómo te ayuda la fricción a explicarlo?",
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
    id: "ramp-roll-transfer",
    band: "3-5",
    title: {
      en: "Which ball rolls farthest down the hall?",
      es: "¿Qué pelota rueda más lejos por el pasillo?",
    },
    question: {
      en: "Which ball rolls farthest down the hall?",
      es: "¿Qué pelota rueda más lejos por el pasillo?",
    },
    phenomenon: {
      en: "A class rolls two kinds of balls down the same ramp: a small marble and a bouncy rubber ball. They roll each ball onto a wood floor and onto a carpet in the hall. Then they measure how far each ball rolls.",
      es: "Una clase hace rodar dos tipos de pelotas por la misma rampa: una canica pequeña y una pelota de goma. Hacen rodar cada pelota sobre un piso de madera y sobre una alfombra del pasillo. Luego miden qué tan lejos rueda cada pelota.",
    },
    prompt: {
      en: "With all help closed, write a question you can test, then a claim about this data with the rows that show it and your reasoning.",
      es: "Con toda la ayuda cerrada, escribe una pregunta que puedas probar, y luego una afirmación sobre estos datos con las filas que la muestran y tu razonamiento.",
    },
    variables: [
      {
        id: "ball",
        label: { en: "Kind of ball", es: "Tipo de pelota" },
        values: [
          {
            id: "marble",
            label: { en: "Marble", es: "Canica" },
            match: {
              en: ["marble", "small ball"],
              es: ["canica", "pelota pequena", "pelota pequeña"],
            },
          },
          {
            id: "rubber",
            label: { en: "Rubber ball", es: "Pelota de goma" },
            match: {
              en: ["rubber", "rubber ball", "bouncy ball"],
              es: ["goma", "pelota de goma", "pelota que rebota"],
            },
          },
        ],
        match: {
          en: ["ball", "balls", "kind of ball"],
          es: ["pelota", "pelotas", "bola", "tipo de pelota"],
        },
      },
      {
        id: "floor",
        label: { en: "Floor", es: "Piso" },
        values: [
          {
            id: "wood",
            label: { en: "Wood floor", es: "Piso de madera" },
            match: { en: ["wood", "wood floor", "wooden"], es: ["madera", "piso de madera"] },
          },
          {
            id: "carpet",
            label: { en: "Carpet", es: "Alfombra" },
            match: { en: ["carpet", "rug"], es: ["alfombra", "tapete"] },
          },
        ],
        match: { en: ["floor", "floors", "surface"], es: ["piso", "pisos", "superficie"] },
      },
    ],
    focus: "floor",
    measure: {
      id: "cm",
      short: { en: "distance", es: "la distancia" },
      label: {
        en: "Distance the ball rolled (centimeters)",
        es: "Distancia que rodó la pelota (centímetros)",
      },
      unit: { en: "centimeters", es: "centímetros" },
      match: {
        en: ["cm", "centimeter", "centimeters", "distance", "far", "farther", "roll", "rolled"],
        es: ["cm", "centimetro", "centimetros", "distancia", "lejos", "rueda", "rodó", "rodo"],
      },
    },
    better: "higher",
    bestWords: {
      en: ["farthest", "farther", "longest", "most", "best"],
      es: ["mas lejos", "más lejos", "mayor distancia", "mejor"],
    },
    worstWords: {
      en: ["shortest", "shorter", "least", "worst"],
      es: ["mas cerca", "más cerca", "menor distancia", "peor"],
    },
    dataset: {
      unit: { en: "centimeters", es: "centímetros" },
      setup: {
        en: "Every ball started at the same spot on the same ramp, and the ball was not pushed.",
        es: "Cada pelota salió del mismo lugar de la misma rampa, y a la pelota no se le dio empujón.",
      },
      note: {
        en: "Classroom sample data written for practice. These numbers are not from a real experiment, and real results can be different.",
        es: "Datos de muestra del salón de clases escritos para practicar. Estos números no son de un experimento real, y los resultados reales pueden ser diferentes.",
      },
      rows: [
        { id: "t1", conditions: { ball: "marble", floor: "wood" }, measures: { cm: 150 } },
        { id: "t2", conditions: { ball: "marble", floor: "carpet" }, measures: { cm: 60 } },
        { id: "t3", conditions: { ball: "rubber", floor: "wood" }, measures: { cm: 130 } },
        { id: "t4", conditions: { ball: "rubber", floor: "carpet" }, measures: { cm: 50 } },
      ],
    },
  },
};
