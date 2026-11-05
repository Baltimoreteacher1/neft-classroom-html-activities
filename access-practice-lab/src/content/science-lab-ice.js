// Science Investigation Lab, grades 6-8 case: "Which cover keeps ice frozen longest?" (insulation fair test).
// Raw authoring shape; src/content/science-lab.js normalizes `help` tuples and assembles CASES.
//
// The dataset is CLASSROOM SAMPLE DATA written for practice. It is labelled that way on screen and is never
// presented as a real measurement. Spanish is machine-assisted and has not been reviewed by a person.
// `match` lists are engine data (words a learner might use); they are never shown.

export const ICE_CASE = {
  id: "ice-cover",
  band: "6-8",
  title: {
    en: "Which cover keeps ice frozen longest?",
    es: "¿Qué cubierta mantiene congelado el hielo por más tiempo?",
  },
  question: {
    en: "Which cover keeps ice frozen longest?",
    es: "¿Qué cubierta mantiene congelado el hielo por más tiempo?",
  },
  phenomenon: {
    en: "On a warm afternoon, two ice cubes of the same size sit on trays in a classroom. One cube is left bare. The other is wrapped in a cover. After a while the bare cube is a puddle, but the wrapped cube still has ice inside. Your class wants to find out which cover works best, and whether a thicker cover makes a difference.",
    es: "En una tarde cálida, dos cubos de hielo del mismo tamaño están sobre bandejas en un salón de clases. Un cubo está sin cubrir. El otro está envuelto con una cubierta. Después de un rato, el cubo sin cubrir es un charco, pero el cubo envuelto todavía tiene hielo adentro. Tu clase quiere descubrir qué cubierta funciona mejor y si una cubierta más gruesa hace diferencia.",
  },
  vocab: [
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
        en: "A test where only one thing is changed on purpose and everything else stays the same.",
        es: "Una prueba donde solo se cambia una cosa a propósito y todo lo demás se mantiene igual.",
      },
    },
    {
      term: { en: "trial", es: "ensayo" },
      meaning: { en: "One run of a test.", es: "Una vez que se hace la prueba." },
    },
    {
      term: { en: "insulate", es: "aislar" },
      meaning: {
        en: "To slow down how fast heat moves in or out.",
        es: "Hacer más lento el paso del calor hacia adentro o hacia afuera.",
      },
    },
    {
      term: { en: "evidence", es: "evidencia" },
      meaning: {
        en: "Data or observations you can point to when you make a claim.",
        es: "Datos u observaciones que puedes señalar cuando haces una afirmación.",
      },
    },
    {
      term: { en: "reasoning", es: "razonamiento" },
      meaning: {
        en: "The explanation that connects the evidence to the claim.",
        es: "La explicación que conecta la evidencia con la afirmación.",
      },
    },
  ],
  variables: [
    {
      id: "cover",
      label: { en: "Cover material", es: "Material de la cubierta" },
      values: [
        {
          id: "foil",
          label: { en: "Aluminum foil", es: "Papel de aluminio" },
          match: {
            en: ["foil", "aluminum foil", "aluminium"],
            es: ["aluminio", "papel de aluminio", "papel aluminio"],
          },
        },
        {
          id: "paper",
          label: { en: "Paper towel", es: "Toalla de papel" },
          match: {
            en: ["paper towel", "paper towels", "paper"],
            es: ["toalla de papel", "toallas de papel", "toalla"],
          },
        },
        {
          id: "wool",
          label: { en: "Wool cloth", es: "Tela de lana" },
          match: { en: ["wool", "wool cloth"], es: ["lana", "tela de lana"] },
        },
      ],
      match: {
        en: ["cover", "covers", "covered", "covering", "material", "materials", "wrap", "wrapped"],
        es: [
          "cubierta",
          "cubiertas",
          "cubierto",
          "cubrir",
          "material",
          "materiales",
          "envoltura",
          "envuelto",
          "tapar",
        ],
      },
    },
    {
      id: "layers",
      label: { en: "Thickness (layers)", es: "Grosor (capas)" },
      values: [
        {
          id: "1",
          label: { en: "1 layer", es: "1 capa" },
          match: {
            en: ["1 layer", "one layer", "single layer", "thin", "thinner", "thin layer"],
            es: ["1 capa", "una capa", "delgada", "delgado", "capa delgada"],
          },
        },
        {
          id: "3",
          label: { en: "3 layers", es: "3 capas" },
          match: {
            en: ["3 layers", "three layers", "thick", "thicker", "thick layer"],
            es: ["3 capas", "tres capas", "gruesa", "grueso", "capa gruesa"],
          },
        },
      ],
      match: {
        en: ["layer", "layers", "thickness", "thick", "thicker", "thin", "thinner"],
        es: ["capa", "capas", "grosor", "grueso", "gruesa", "delgado", "delgada"],
      },
    },
  ],
  focus: "cover",
  measure: {
    id: "minutes",
    short: { en: "melting time", es: "el tiempo de derretido" },
    label: {
      en: "Minutes until the ice cube is fully melted",
      es: "Minutos hasta que el cubo de hielo se derrite por completo",
    },
    unit: { en: "minutes", es: "minutos" },
    match: {
      en: [
        "minute",
        "minutes",
        "time",
        "how long",
        "melt",
        "melted",
        "melts",
        "melting",
        "frozen",
        "freeze",
        "last",
        "lasts",
      ],
      es: [
        "minuto",
        "minutos",
        "tiempo",
        "cuanto tarda",
        "derrite",
        "derritio",
        "derretir",
        "derretido",
        "congelado",
        "congelar",
        "dura",
        "duran",
      ],
    },
  },
  better: "higher",
  bestWords: {
    en: ["longest", "longer", "most", "slowest", "slower", "best"],
    es: ["mas tiempo", "mayor tiempo", "mejor", "mas lento", "mas lentamente"],
  },
  worstWords: {
    en: ["shortest", "shorter", "least", "fastest", "faster", "quickest", "worst"],
    es: ["menos tiempo", "menor tiempo", "peor", "mas rapido", "mas rapida"],
  },
  dataset: {
    unit: { en: "minutes", es: "minutos" },
    setup: {
      en: "Every test used one 20 g ice cube, the same kind of tray, and the same shelf away from the window. Each cube was checked every 5 minutes.",
      es: "Cada prueba usó un cubo de hielo de 20 g, el mismo tipo de bandeja y el mismo estante lejos de la ventana. Cada cubo se revisó cada 5 minutos.",
    },
    note: {
      en: "Classroom sample data written for practice. These numbers are not from a real experiment, and real results can be different.",
      es: "Datos de muestra del salón de clases escritos para practicar. Estos números no son de un experimento real, y los resultados reales pueden ser diferentes.",
    },
    rows: [
      { id: "r1", conditions: { cover: "foil", layers: "1" }, measures: { minutes: 34 } },
      { id: "r2", conditions: { cover: "foil", layers: "3" }, measures: { minutes: 41 } },
      { id: "r3", conditions: { cover: "paper", layers: "1" }, measures: { minutes: 43 } },
      { id: "r4", conditions: { cover: "paper", layers: "3" }, measures: { minutes: 62 } },
      { id: "r5", conditions: { cover: "wool", layers: "1" }, measures: { minutes: 71 } },
      { id: "r6", conditions: { cover: "wool", layers: "3" }, measures: { minutes: 118 } },
      { id: "r7", conditions: { cover: "paper", layers: "1" }, measures: { minutes: 47 } },
      { id: "r8", conditions: { cover: "wool", layers: "3" }, measures: { minutes: 126 } },
    ],
  },
  // [stage, kind, en, es]: three per stage. Help gives structure and questions, never an answer or the winning condition.
  help: [
    [
      "notice",
      "prompt",
      "What can you see, feel, or measure in the story? List three things before you guess why.",
      "¿Qué puedes ver, sentir o medir en la historia? Escribe tres cosas antes de adivinar por qué.",
    ],
    ["notice", "frame", "I notice that ___. I wonder ___.", "Noto que ___. Me pregunto ___."],
    [
      "notice",
      "word",
      "Observation: something you notice with your senses or a tool. It is not a guess about why.",
      "Observación: algo que notas con tus sentidos o con una herramienta. No es una suposición sobre por qué.",
    ],
    ["question", "frame", "How does ___ change ___?", "¿Cómo cambia ___ cuando cambia ___?"],
    [
      "question",
      "word",
      "Testable: you can answer it by running a test and recording a result.",
      "Comprobable: se puede responder haciendo una prueba y anotando un resultado.",
    ],
    [
      "question",
      "prompt",
      "Could a test answer your question with a number or a comparison, not just yes or no?",
      "¿Podría una prueba responder tu pregunta con un número o una comparación, y no solo con sí o no?",
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
      "Hypothesis: a prediction you can test, with a reason behind it.",
      "Hipótesis: una predicción que puedes comprobar, con una razón detrás.",
    ],
    [
      "hypothesis",
      "prompt",
      "Which way do you think the result will move? What makes you think so?",
      "¿En qué dirección crees que se moverá el resultado? ¿Por qué lo piensas?",
    ],
    [
      "plan",
      "frame",
      "I will change ___. I will keep ___ the same. I will measure ___ and repeat each test ___ times.",
      "Voy a cambiar ___. Voy a mantener ___ igual. Voy a medir ___ y repetir cada prueba ___ veces.",
    ],
    [
      "plan",
      "word",
      "Controlled variable: something you keep the same in every test so the comparison is fair.",
      "Variable controlada: algo que mantienes igual en todas las pruebas para que la comparación sea justa.",
    ],
    [
      "plan",
      "prompt",
      "Look at each part of your plan. If two things changed at once, could you tell which one made a difference?",
      "Mira cada parte de tu plan. Si dos cosas cambiaran a la vez, ¿podrías saber cuál hizo la diferencia?",
    ],
    [
      "collect",
      "prompt",
      "Write each result beside the conditions it came from so nothing gets mixed up.",
      "Escribe cada resultado junto a las condiciones de donde vino para que nada se mezcle.",
    ],
    [
      "collect",
      "word",
      "Trial: one run of a test. Repeated trials show how much results can vary.",
      "Ensayo: una vez que se hace la prueba. Los ensayos repetidos muestran cuánto pueden variar los resultados.",
    ],
    [
      "collect",
      "prompt",
      "If two runs of the same test give different numbers, what small things could explain it?",
      "Si dos ensayos de la misma prueba dan números diferentes, ¿qué cosas pequeñas lo podrían explicar?",
    ],
    [
      "represent",
      "prompt",
      "What goes along the bottom and what goes up the side? Why did you place them that way?",
      "¿Qué va en la parte de abajo y qué va en el lado? ¿Por qué lo pusiste así?",
    ],
    [
      "represent",
      "word",
      "Table or graph: a way to show data so differences are easy to see. Label every row and unit.",
      "Tabla o gráfica: una forma de mostrar datos para que las diferencias se vean fácilmente. Rotula cada fila y cada unidad.",
    ],
    [
      "represent",
      "prompt",
      "Could a classmate read your table or graph without you there? Which label might be missing?",
      "¿Podría un compañero leer tu tabla o gráfica sin que tú estés? ¿Qué rótulo podría faltar?",
    ],
    [
      "claim",
      "frame",
      "In this test, ___ had a ___ result than ___.",
      "En esta prueba, ___ tuvo un resultado ___ que ___.",
    ],
    [
      "claim",
      "word",
      "Claim: a statement that answers the question you asked.",
      "Afirmación: una oración que responde la pregunta que hiciste.",
    ],
    [
      "claim",
      "prompt",
      "Does your claim answer the exact question you asked? Does it say what you compared?",
      "¿Tu afirmación responde la pregunta exacta que hiciste? ¿Dice qué comparaste?",
    ],
    [
      "evidence",
      "prompt",
      "Which rows of the table back up your claim? Choose the ones that show it most clearly.",
      "¿Qué filas de la tabla apoyan tu afirmación? Elige las que lo muestran con más claridad.",
    ],
    [
      "evidence",
      "word",
      "Evidence: data from the test that you can point to.",
      "Evidencia: datos de la prueba que puedes señalar.",
    ],
    [
      "evidence",
      "prompt",
      "Does any row seem to disagree with the others? What could you say about it?",
      "¿Alguna fila parece no coincidir con las demás? ¿Qué podrías decir sobre ella?",
    ],
    [
      "reasoning",
      "frame",
      "This evidence supports my claim because ___.",
      "Esta evidencia apoya mi afirmación porque ___.",
    ],
    [
      "reasoning",
      "word",
      "Reasoning: the sentence that links the evidence to the claim and explains why it counts.",
      "Razonamiento: la oración que une la evidencia con la afirmación y explica por qué cuenta.",
    ],
    [
      "reasoning",
      "prompt",
      "Which number from your rows will you quote? Is it really in your table?",
      "¿Qué número de tus filas vas a citar? ¿De verdad está en tu tabla?",
    ],
    [
      "revise",
      "prompt",
      "Reread the questions from the checker. Pick one and change your writing so it answers that question.",
      "Vuelve a leer las preguntas del revisor. Elige una y cambia tu texto para que la responda.",
    ],
    [
      "revise",
      "frame",
      "Before, I wrote ___. Now I wrote ___ because ___.",
      "Antes escribí ___. Ahora escribí ___ porque ___.",
    ],
    [
      "revise",
      "word",
      "Revise: change your writing so the idea is clearer, not only fix spelling.",
      "Revisar: cambiar tu texto para que la idea sea más clara, no solo corregir la ortografía.",
    ],
    [
      "present",
      "frame",
      "First I asked ___. Next I tested ___. The data show ___. So I claim ___.",
      "Primero pregunté ___. Después probé ___. Los datos muestran ___. Entonces afirmo ___.",
    ],
    [
      "present",
      "prompt",
      "Say the question, the test, the evidence, and the claim in order. Which part is hardest to say?",
      "Di la pregunta, la prueba, la evidencia y la afirmación en orden. ¿Qué parte es más difícil de decir?",
    ],
    [
      "present",
      "word",
      "Present: explain your investigation out loud so someone else can follow it.",
      "Presentar: explicar tu investigación en voz alta para que otra persona la pueda seguir.",
    ],
    [
      "reflect",
      "prompt",
      "What did you do differently the second time you wrote? What helped you?",
      "¿Qué hiciste de forma diferente la segunda vez que escribiste? ¿Qué te ayudó?",
    ],
    [
      "reflect",
      "frame",
      "Next time I will ___ because ___.",
      "La próxima vez voy a ___ porque ___.",
    ],
    [
      "reflect",
      "word",
      "Reflect: look back at your work and decide what to keep and what to change.",
      "Reflexionar: mirar tu trabajo y decidir qué mantener y qué cambiar.",
    ],
  ],
  transfer: {
    id: "ice-cover-transfer",
    band: "6-8",
    title: {
      en: "Which cup keeps cocoa warm longest?",
      es: "¿Qué taza mantiene caliente el chocolate por más tiempo?",
    },
    question: {
      en: "Which cup keeps hot cocoa warm longest?",
      es: "¿Qué taza mantiene caliente el chocolate por más tiempo?",
    },
    phenomenon: {
      en: "A class pours the same amount of hot cocoa into two kinds of cups. Some cups get a lid and some do not. They record how long each cup stays warm enough to drink.",
      es: "Una clase sirve la misma cantidad de chocolate caliente en dos tipos de tazas. Algunas tazas llevan tapa y otras no. Anotan cuánto tiempo cada taza se mantiene lo bastante caliente para beber.",
    },
    prompt: {
      en: "With all help closed, write a testable question, then a claim about this data with the rows that support it and your reasoning.",
      es: "Con toda la ayuda cerrada, escribe una pregunta que se pueda comprobar, y luego una afirmación sobre estos datos con las filas que la apoyan y tu razonamiento.",
    },
    variables: [
      {
        id: "cup",
        label: { en: "Cup type", es: "Tipo de taza" },
        values: [
          {
            id: "foam",
            label: { en: "Foam cup", es: "Taza de espuma" },
            match: { en: ["foam", "foam cup"], es: ["espuma", "taza de espuma"] },
          },
          {
            id: "paper",
            label: { en: "Paper cup", es: "Taza de papel" },
            match: { en: ["paper", "paper cup"], es: ["papel", "taza de papel"] },
          },
        ],
        match: {
          en: ["cup", "cups", "type", "material"],
          es: ["taza", "tazas", "tipo", "material"],
        },
      },
      {
        id: "lid",
        label: { en: "Lid", es: "Tapa" },
        values: [
          {
            id: "yes",
            label: { en: "With a lid", es: "Con tapa" },
            match: {
              en: ["with a lid", "lid", "lids", "covered"],
              es: ["con tapa", "tapa", "tapas", "tapado"],
            },
          },
          {
            id: "no",
            label: { en: "No lid", es: "Sin tapa" },
            match: {
              en: ["no lid", "without a lid", "without lid", "open"],
              es: ["sin tapa", "abierta", "abierto"],
            },
          },
        ],
        match: { en: ["lid", "lids", "top"], es: ["tapa", "tapas"] },
      },
    ],
    focus: "cup",
    measure: {
      id: "minutes",
      short: { en: "time the cocoa stays warm", es: "el tiempo que el chocolate se mantiene caliente" },
      label: {
        en: "Minutes until the cocoa was too cool to enjoy",
        es: "Minutos hasta que el chocolate estuvo demasiado frío",
      },
      unit: { en: "minutes", es: "minutos" },
      match: {
        en: [
          "minute",
          "minutes",
          "time",
          "how long",
          "warm",
          "warmer",
          "stay",
          "stays",
          "cool",
          "cooled",
        ],
        es: [
          "minuto",
          "minutos",
          "tiempo",
          "cuanto tarda",
          "caliente",
          "tibio",
          "enfria",
          "enfrio",
          "dura",
        ],
      },
    },
    better: "higher",
    bestWords: {
      en: ["longest", "longer", "most", "best", "warmest"],
      es: ["mas tiempo", "mayor tiempo", "mejor", "mas caliente"],
    },
    worstWords: {
      en: ["shortest", "shorter", "least", "fastest", "faster", "worst", "coolest"],
      es: ["menos tiempo", "menor tiempo", "peor", "mas rapido", "mas rapida", "mas frio"],
    },
    dataset: {
      unit: { en: "minutes", es: "minutos" },
      setup: {
        en: "Each cup held 200 mL of cocoa that started at the same warmth.",
        es: "Cada taza tenía 200 mL de chocolate que empezó con el mismo calor.",
      },
      note: {
        en: "Classroom sample data written for practice. These numbers are not from a real experiment, and real results can be different.",
        es: "Datos de muestra del salón de clases escritos para practicar. Estos números no son de un experimento real, y los resultados reales pueden ser diferentes.",
      },
      rows: [
        { id: "t1", conditions: { cup: "foam", lid: "yes" }, measures: { minutes: 38 } },
        { id: "t2", conditions: { cup: "foam", lid: "no" }, measures: { minutes: 29 } },
        { id: "t3", conditions: { cup: "paper", lid: "yes" }, measures: { minutes: 24 } },
        { id: "t4", conditions: { cup: "paper", lid: "no" }, measures: { minutes: 17 } },
      ],
    },
  },
};
