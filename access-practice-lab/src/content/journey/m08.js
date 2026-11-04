// Mission 8 — Causes and Consequences (Unit 3, Explain). Flagship four-domain mission: Save the School Garden.
// Reference pack for access-practice-lab/JOURNEY.md. Title, goal, WIDA and spiral data live in MISSIONS (curriculum.js);
// family guidance lives in family.js. Task content is English (it is the language practiced); titles,
// goals and all family guidance are bilingual [en, es]. Hints ask questions and never state an answer.

const followUps = {
  phenomenon: "Start by telling me exactly what is happening to the plants.",
  cause: "What do you think caused that? Try using “because” or “so”.",
  chain: "And what happens next because of that? Add the next link.",
  support: "What fact, number or note from the garden shows that is true?",
};

const g35 = {
  environment: "garden",
  context: {
    title: ["Save the School Garden", "Salvemos el huerto escolar"],
    premise:
      "The garden club grows bean plants in two beds. Bed 1 is tall and green. Bed 2 is small and yellow. Ms. Ruiz needs the club to find out why.",
    cast: [
      {
        id: "ruiz",
        name: "Ms. Ruiz",
        role: ["Garden club teacher", "Maestra del club de huerto"],
        glyph: "👩🏽‍🌾",
      },
      { id: "sam", name: "Sam", role: ["Garden club member", "Miembro del club"], glyph: "🧒🏻" },
    ],
  },
  vocab: [
    [
      "sunlight",
      "light from the sun that plants need",
      "luz del sol: la luz que las plantas necesitan",
    ],
    ["shade", "a place where something blocks the sun", "sombra: lugar donde algo bloquea el sol"],
    ["cause", "the reason something happens", "causa: la razón por la que algo sucede"],
    ["effect", "what happens because of a cause", "efecto: lo que pasa por una causa"],
    [
      "evidence",
      "facts that show an idea is true",
      "evidencia: datos que muestran que una idea es cierta",
    ],
    ["measure", "to find out how much or how many", "medir: averiguar cuánto o cuántos"],
    ["grow", "to get bigger or taller", "crecer: hacerse más grande o más alto"],
    ["result", "what happens at the end", "resultado: lo que pasa al final"],
  ],
  frames: {
    A: [
      "The plants are ___ because ___.",
      "Bed 2 gets ___ hours of sun. This caused ___.",
      "As a result, the plants ___.",
    ],
    B: ["Because ___, the plants ___.", "The notes show ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "Why are the bean plants in Bed 2 small and yellow, while the plants in Bed 1 are tall and green?",
    objects: [
      {
        id: "bed1",
        label: "Bed 1 plants",
        glyph: "🌱",
        x: 18,
        y: 58,
        relevant: true,
        note: "The bean plants in Bed 1 are tall and dark green. Their leaves face the sky.",
      },
      {
        id: "bed2",
        label: "Bed 2 plants",
        glyph: "🥀",
        x: 72,
        y: 60,
        relevant: true,
        note: "The bean plants in Bed 2 are small. Many leaves are yellow. Bed 2 sits behind the big oak tree.",
      },
      {
        id: "chart",
        label: "Sun chart",
        glyph: "📋",
        x: 45,
        y: 22,
        relevant: true,
        note: "Sun chart: Bed 1 gets 7 hours of sun each day. Bed 2 gets 2 hours of sun each day.",
      },
      {
        id: "can",
        label: "Watering log",
        glyph: "🚿",
        x: 40,
        y: 72,
        relevant: true,
        note: "Watering log: both beds get 2 cups of water every morning.",
      },
      {
        id: "soil",
        label: "Soil sample",
        glyph: "🪴",
        x: 55,
        y: 82,
        relevant: true,
        note: "Soil check: the soil in both beds is dark and crumbly. A squeezed handful holds together in both.",
      },
      {
        id: "wagon",
        label: "Red wagon",
        glyph: "🛒",
        x: 90,
        y: 84,
        relevant: false,
        note: "A red wagon is parked beside Bed 2. It holds some empty pots.",
      },
    ],
    controls: [
      {
        id: "sun",
        label: "Sunlight",
        initial: "shade",
        options: [
          { id: "full", label: "Sun all day" },
          { id: "shade", label: "Mostly shade" },
        ],
      },
      {
        id: "water",
        label: "Water",
        initial: "daily",
        options: [
          { id: "daily", label: "2 cups a day" },
          { id: "none", label: "No water" },
        ],
      },
    ],
    outcomes: [
      {
        when: { sun: "full", water: "daily" },
        mood: "good",
        key: "thrive",
        state: "After two weeks the bean plants are tall and dark green, with new flowers.",
      },
      {
        when: { sun: "shade", water: "daily" },
        mood: "warn",
        key: "slow",
        state: "After two weeks the bean plants are still small. The leaves are pale yellow.",
      },
      {
        when: { sun: "full", water: "none" },
        mood: "warn",
        key: "dry",
        state: "After two weeks the leaves droop and the soil is dry and cracked.",
      },
      {
        when: { sun: "shade", water: "none" },
        mood: "bad",
        key: "poor",
        state: "After two weeks the plants are tiny and the leaves are brown.",
      },
    ],
    collect: 3,
    variables: [
      {
        id: "sun",
        label: "sunlight",
        terms: ["sun", "sunlight", "light", "shade", "shady", "oak", "tree"],
        evidenceTerms: ["7 hours", "seven hours", "2 hours", "two hours", "chart", "oak"],
        probe: "You say the sun matters. What numbers or notes show how much sun each bed gets?",
        good: "A measurement for each bed",
      },
      {
        id: "water",
        label: "water",
        terms: ["water", "watered", "dry", "rain", "thirsty"],
        evidenceTerms: ["2 cups", "two cups", "log", "same"],
        probe: "You think water might matter. What does the watering log say about each bed?",
        good: "A comparison of the two beds",
      },
      {
        id: "soil",
        label: "soil",
        terms: ["soil", "dirt", "ground"],
        evidenceTerms: ["crumbly", "squeeze", "dark", "both"],
        probe: "You are thinking about soil. What did the soil check show for each bed?",
        good: "A comparison of the two beds",
      },
    ],
    partner: {
      name: "Ms. Ruiz",
      glyph: "👩🏽‍🌾",
      opening:
        "Thank you for helping. Bed 2 looks sick and Bed 1 looks great. What do you think is going on?",
      noCause:
        "I hear what you see, but I need a reason. What do you think caused the plants to look this way?",
      noEvidence: "What did you see or read in the garden that makes you think so?",
      thanks: "Thank you. That helps the club decide what to test next.",
    },
    respond: {
      prompt:
        "Tell Ms. Ruiz what you think is causing the problem in Bed 2. Use something you found.",
      minWords: 12,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "sort",
      title: "The garden scientist's report",
      script: [
        { id: "u1", text: "Today I measured both garden beds.", signal: "today" },
        {
          id: "u2",
          text: "In Bed 1, the bean plants are tall and the leaves are green.",
          signal: "In Bed 1",
        },
        { id: "u3", text: "Bed 1 gets seven hours of sun every day.", signal: "seven hours" },
        {
          id: "u4",
          text: "In Bed 2, the bean plants are small and the leaves are yellow.",
          signal: "In Bed 2",
        },
        {
          id: "u5",
          text: "Bed 2 gets only two hours of sun, because the oak tree blocks the light.",
          signal: "because",
        },
      ],
      items: [
        { id: "tall", label: "Tall plants", glyph: "🌿" },
        { id: "green", label: "Green leaves", glyph: "🍃" },
        { id: "seven", label: "7 hours of sun", glyph: "☀️" },
        { id: "small", label: "Small plants", glyph: "🌱" },
        { id: "yellow", label: "Yellow leaves", glyph: "🍂" },
        { id: "two", label: "2 hours of sun", glyph: "⛅" },
      ],
      targets: [
        { id: "bed1", label: "Bed 1" },
        { id: "bed2", label: "Bed 2" },
      ],
      expect: [
        { item: "tall", target: "bed1", utterance: "u2" },
        { item: "green", target: "bed1", utterance: "u2" },
        { item: "seven", target: "bed1", utterance: "u3" },
        { item: "small", target: "bed2", utterance: "u4" },
        { item: "yellow", target: "bed2", utterance: "u4" },
        { item: "two", target: "bed2", utterance: "u5" },
      ],
      visuals: {
        u2: "A tall green plant in a bed marked 1",
        u3: "A sun icon with the number 7 over Bed 1",
        u4: "A small yellow plant in a bed marked 2",
        u5: "A tree shadow falling over Bed 2",
      },
      xray: {
        keywords: ["Bed 1", "Bed 2", "seven hours", "two hours"],
        sequence: [],
        cause: ["because"],
        referents: [{ phrase: "the light", means: "the sunlight" }],
      },
      final: {
        title: "A new garden report",
        script: [
          { id: "f1", text: "Now I am looking at two flower pots." },
          {
            id: "f2",
            text: "The red pot sits by the window, and its flowers are bright and open.",
            signal: "red pot",
          },
          {
            id: "f3",
            text: "The blue pot sits in a dark closet, and its flowers are closed and pale.",
            signal: "blue pot",
          },
          {
            id: "f4",
            text: "The blue pot gets no light, and the plant in it looks weak.",
            signal: "so",
          },
        ],
        items: [
          { id: "bright", label: "Bright, open flowers", glyph: "🌼" },
          { id: "pale", label: "Closed, pale flowers", glyph: "🥀" },
          { id: "window", label: "By the window", glyph: "🪟" },
          { id: "closet", label: "In a dark closet", glyph: "🚪" },
        ],
        targets: [
          { id: "red", label: "Red pot" },
          { id: "blue", label: "Blue pot" },
        ],
        expect: [
          { item: "bright", target: "red", utterance: "f2" },
          { item: "window", target: "red", utterance: "f2" },
          { item: "pale", target: "blue", utterance: "f3" },
          { item: "closet", target: "blue", utterance: "f3" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Garden Club Report: Bed 2",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "The bean plants in Bed 2 are small because they do not get enough sunlight.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "Bed 1 gets seven hours of sun each day, and Bed 2 gets only two hours.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "The big oak tree blocks the light from Bed 2, so it stays shady all morning.",
        },
        { id: "s4", role: "detail", text: "Both beds get two cups of water every morning." },
        {
          id: "s5",
          role: "background",
          text: "The garden club planted the bean seeds on April 8.",
        },
        {
          id: "s6",
          role: "reason",
          supports: ["s1"],
          text: "Plants use sunlight to make food, so plants with less sun grow slowly.",
        },
        { id: "s7", role: "claim", text: "Bed 1 is the best bed in the whole school garden." },
        {
          id: "s8",
          role: "background",
          text: "Last week the club painted a new sign for the gate.",
        },
      ],
      claimOptions: ["s1", "s7"],
      challenge: {
        type: "evidence",
        claim: "s1",
        valid: ["s2", "s3", "s6"],
        minValid: 2,
        weak: ["s4", "s5", "s8"],
        explainFrame: "This evidence shows the claim is true because ___.",
        explainTerms: ["because", "shows", "so"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "claim",
              text: "The tomato plants in the pots wilt because they do not get enough water.",
            },
            {
              id: "t2",
              role: "evidence",
              text: "The soil in the pots is dry and cracked every afternoon.",
            },
            {
              id: "t3",
              role: "evidence",
              text: "After the students watered the pots, the leaves stood up again within an hour.",
            },
            { id: "t4", role: "detail", text: "The pots are painted blue and green." },
            { id: "t5", role: "background", text: "The students planted the tomatoes in May." },
            { id: "t6", role: "background", text: "A new fence was built near the playground." },
          ],
          claim: "t1",
          valid: ["t2", "t3"],
          minValid: 1,
          weak: ["t4", "t5", "t6"],
        },
      },
      refs: [
        { sentence: "s3", phrase: "it", means: "Bed 2" },
        { sentence: "s2", phrase: "Bed 2", means: "the second garden bed" },
      ],
      layers: {
        meaning: [
          { s: "s1", phrase: "do not get enough sunlight", label: "the cause the claim names" },
          { s: "s2", phrase: "seven hours", label: "evidence: a measurement" },
        ],
        discourse: [
          { s: "s3", phrase: "so", label: "links a cause to its result" },
          { s: "s6", phrase: "so", label: "links a reason to a result" },
        ],
        sentence: [
          { s: "s1", phrase: "because they do not get enough sunlight", label: "reason clause" },
        ],
        word: [
          { s: "s1", phrase: "sunlight", label: "academic word", def: "light from the sun" },
          {
            s: "s6",
            phrase: "grow slowly",
            label: "collocation",
            def: "get bigger a little at a time",
          },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "expand",
      title: "Transform a sentence",
      base: "The plant grew.",
      needs: [
        {
          id: "how",
          label: "Tell how it grew",
          test: {
            terms: [
              "quickly",
              "slowly",
              "tall",
              "taller",
              "big",
              "bigger",
              "small",
              "fast",
              "well",
              "healthy",
              "strong",
            ],
          },
        },
        { id: "why", label: "Tell why, with a cause word", test: { connectorJob: "cause" } },
        {
          id: "detail",
          label: "Add one garden detail",
          test: { terms: ["sun", "sunlight", "water", "soil", "light", "rain"] },
        },
      ],
      altConnectors: [
        {
          word: "because",
          note: "Because puts the reason after the result: The plant grew because it got sun.",
        },
        {
          word: "so",
          note: "So puts the reason first and the result second: The plant got sun, so it grew.",
        },
        {
          word: "as a result",
          note: "As a result starts a new sentence with the effect: The plant got sun. As a result, it grew.",
        },
      ],
      transfer: {
        base: "The beans turned yellow.",
        needs: [
          { id: "why", label: "Tell why, with a cause word", test: { connectorJob: "cause" } },
          {
            id: "detail",
            label: "Add one garden detail",
            test: { terms: ["sun", "sunlight", "shade", "water", "soil", "light", "dry"] },
          },
        ],
      },
    },
    {
      kind: "build",
      module: "connector",
      title: "Connector laboratory",
      gaps: [
        {
          before: "The leaves drooped",
          after: "the soil was dry.",
          relation: "cause",
          options: ["because", "so", "but", "then"],
          ok: ["because"],
        },
        {
          before: "The oak tree blocks the light,",
          after: "Bed 2 stays shady.",
          relation: "cause",
          options: ["so", "because", "but", "after"],
          ok: ["so"],
        },
        {
          before: "Bed 1 is tall and green,",
          after: "Bed 2 is small and yellow.",
          relation: "contrast",
          options: ["but", "because", "so", "and then"],
          ok: ["but"],
        },
      ],
      notes: {
        because: "Because shows the reason.",
        so: "So shows the result.",
        but: "But shows a difference.",
      },
      transfer: {
        gaps: [
          {
            before: "The flowers closed",
            after: "there was no light.",
            relation: "cause",
            options: ["because", "so", "but", "then"],
            ok: ["because"],
          },
          {
            before: "The pot got water,",
            after: "the plant stood up again.",
            relation: "cause",
            options: ["so", "because", "but", "after"],
            ok: ["so"],
          },
        ],
      },
    },
  ],
  communicate: {
    kind: "converse",
    mode: "discuss",
    prompt:
      "Tell Ms. Ruiz what is causing the problem in Bed 2 and what the garden club should do.",
    partner: {
      name: "Ms. Ruiz",
      glyph: "👩🏽‍🌾",
      role: ["Garden club teacher", "Maestra del club de huerto"],
      opening: "I have to tell the principal what is wrong with Bed 2. What is your explanation?",
    },
    topicTerms: [
      "sunlight",
      "shade",
      "oak",
      "tree",
      "water",
      "soil",
      "plants",
      "beans",
      "grow",
      "yellow",
    ],
    sourceTerms: ["seven hours", "two hours", "oak tree", "sunlight", "two cups"],
    evidenceBank: [
      "Bed 1 gets 7 hours of sun; Bed 2 gets 2 hours.",
      "The oak tree blocks the light from Bed 2.",
      "Both beds get 2 cups of water.",
      "The soil in both beds is dark and crumbly.",
    ],
    lines: [
      {
        id: "sun",
        terms: ["sun", "sunlight", "light", "shade", "shady", "oak"],
        evidenceTerms: ["seven", "two hours", "7", "oak"],
        ack: "So you think the sunlight is the cause.",
        probe: "What numbers or notes show how much sun each bed gets?",
        close: "A fact about hours of sun for each bed",
      },
      {
        id: "water",
        terms: ["water", "dry", "thirsty", "watered"],
        evidenceTerms: ["2 cups", "two cups", "both beds", "same"],
        ack: "So you think the water might be the cause.",
        probe:
          "Look at the watering log again. How much water does each bed get, and does that match your idea?",
        close: "A comparison of the two beds' watering",
      },
      {
        id: "soil",
        terms: ["soil", "dirt"],
        evidenceTerms: ["crumbly", "dark", "both"],
        ack: "So you think the soil might be the cause.",
        probe: "What did the soil check show for each bed?",
        close: "A comparison of the two beds' soil",
      },
    ],
    followUps,
    maxTurns: 3,
    minWords: 15,
  },
  improve: {
    models: {
      phenomenon: "The bean plants in Bed 2 are small and yellow.",
      cause: "The beans are small because they get only two hours of sun.",
      chain: "Because the beans get little sun, they cannot make enough food, so they grow slowly.",
      support: "The sun chart shows Bed 1 gets seven hours of sun and Bed 2 gets two hours.",
    },
    whys: [
      {
        id: "why-cause",
        text: "It tells my listener why it happened, so they can follow my reasoning.",
        moves: ["cause", "chain"],
      },
      {
        id: "why-fact",
        text: "It uses a fact from the garden, so my listener can trust my idea.",
        moves: ["support"],
      },
      {
        id: "why-topic",
        text: "It says exactly what I am explaining, so my listener is not confused.",
        moves: ["phenomenon"],
      },
    ],
  },
  show: {
    kind: "compose",
    mode: "write",
    prompt:
      "New situation: A class keeps tomato plants in pots on the patio. Observations: the pots sit in full sun, the soil is dry and cracked, the plants droop in the afternoon, and they stand up again after watering. Write to the class teacher and explain what is causing the plants to droop.",
    audience: ["Your class teacher", "Tu maestro o maestra"],
    genre: "explanation",
    topicTerms: ["tomato", "plants", "water", "soil", "dry", "droop", "sun", "pots"],
    sourceTerms: ["dry", "cracked", "afternoon", "watering"],
    organizer: ["phenomenon", "cause", "evidence", "result"],
    readerQuestions: {
      phenomenon: "What exactly is happening to the plants?",
      cause: "What do you think is causing it?",
      chain: "What happens next because of that?",
      support: "What fact from the pots shows that?",
    },
    minWords: 25,
  },
};

const g68 = {
  environment: "garden",
  context: {
    title: ["Save the School Garden", "Salvemos el huerto escolar"],
    premise:
      "The Harbor Middle School garden grew 120 pounds of vegetables last year and only 72 pounds this year. The garden club must explain the decline before the school board meets.",
    cast: [
      {
        id: "chen",
        name: "Dr. Chen",
        role: ["Soil scientist", "Científica de suelos"],
        glyph: "👩🏻‍🔬",
      },
      { id: "dev", name: "Dev", role: ["Garden club treasurer", "Tesorero del club"], glyph: "🧑🏽" },
    ],
  },
  vocab: [
    [
      "yield",
      "the amount of food a garden produces",
      "rendimiento: la cantidad de alimento que produce un huerto",
    ],
    ["decline", "a drop in amount or quality", "descenso: una baja en cantidad o calidad"],
    [
      "compacted",
      "pressed down so tightly that water cannot move through",
      "compactado: apretado de modo que el agua no pasa",
    ],
    [
      "drainage",
      "how quickly water moves out of soil",
      "drenaje: qué tan rápido sale el agua del suelo",
    ],
    [
      "factor",
      "one of the things that affects a result",
      "factor: algo que influye en un resultado",
    ],
    [
      "consequence",
      "a result of an action or event",
      "consecuencia: resultado de una acción o suceso",
    ],
    [
      "evidence",
      "information that supports a conclusion",
      "evidencia: información que apoya una conclusión",
    ],
    ["contribute", "to help cause something", "contribuir: ayudar a causar algo"],
  ],
  frames: {
    A: [
      "The yield declined because ___.",
      "The data show ___, which led to ___.",
      "As a result of ___, ___.",
    ],
    B: ["One factor is ___; the evidence is ___.", "This contributed to ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt: "Why did the garden's yield fall from 120 pounds to 72 pounds in one year?",
    objects: [
      {
        id: "chart",
        label: "Yield chart",
        glyph: "📊",
        x: 20,
        y: 24,
        relevant: true,
        note: "Yield chart: 120 pounds last year, 72 pounds this year, a drop of 40 percent. The drop is the same in every bed.",
      },
      {
        id: "shadow",
        label: "Shadow map",
        glyph: "🗺️",
        x: 70,
        y: 22,
        relevant: true,
        note: "Shadow map: since the new gym wing was built, the beds lose 4 of their 8 hours of afternoon sun.",
      },
      {
        id: "probe",
        label: "Soil probe",
        glyph: "🧪",
        x: 28,
        y: 70,
        relevant: true,
        note: "Soil probe: after rain, water pools on the beds for 45 minutes. In a healthy bed it drains in 5 minutes. Construction trucks drove across the beds last spring.",
      },
      {
        id: "log",
        label: "Irrigation log",
        glyph: "🚿",
        x: 52,
        y: 78,
        relevant: true,
        note: "Irrigation log: the beds were watered three times a week in both years, with the same timer settings.",
      },
      {
        id: "thermo",
        label: "Weather station",
        glyph: "🌡️",
        x: 80,
        y: 66,
        relevant: true,
        note: "Weather station: the average summer temperature was 78°F this year and 77°F last year. Rainfall was about the same.",
      },
      {
        id: "packet",
        label: "Seed packets",
        glyph: "🌾",
        x: 90,
        y: 88,
        relevant: false,
        note: "Seed packets: the club bought the same brand of seeds as last year. The packets are stored in the shed.",
      },
    ],
    controls: [
      {
        id: "sun",
        label: "Afternoon sun",
        initial: "four",
        options: [
          { id: "eight", label: "8 hours" },
          { id: "four", label: "4 hours" },
        ],
      },
      {
        id: "soil",
        label: "Soil condition",
        initial: "compacted",
        options: [
          { id: "loose", label: "Loosened, drains in 5 min" },
          { id: "compacted", label: "Compacted, drains in 45 min" },
        ],
      },
    ],
    outcomes: [
      {
        when: { sun: "eight", soil: "loose" },
        mood: "good",
        key: "full",
        state:
          "Model result: the beds produce about 120 pounds. Roots are deep and leaves are full.",
      },
      {
        when: { sun: "four", soil: "loose" },
        mood: "warn",
        key: "shade",
        state:
          "Model result: the beds produce about 95 pounds. Plants are healthy but fruit ripens slowly.",
      },
      {
        when: { sun: "eight", soil: "compacted" },
        mood: "warn",
        key: "wet",
        state: "Model result: the beds produce about 90 pounds. Roots sit in water and some rot.",
      },
      {
        when: { sun: "four", soil: "compacted" },
        mood: "bad",
        key: "both",
        state: "Model result: the beds produce about 72 pounds, matching this year's harvest.",
      },
    ],
    collect: 4,
    variables: [
      {
        id: "sun",
        label: "sunlight",
        terms: ["sun", "sunlight", "shade", "shadow", "gym", "light", "afternoon"],
        evidenceTerms: ["4 of", "four", "8 hours", "shadow map", "gym wing"],
        probe:
          "You point to sunlight. What does the shadow map say, and does it explain a drop in every bed?",
        good: "A number from the shadow map",
      },
      {
        id: "soil",
        label: "soil compaction and drainage",
        terms: [
          "soil",
          "compact",
          "compacted",
          "drain",
          "drainage",
          "water pool",
          "trucks",
          "roots",
        ],
        evidenceTerms: ["45 minutes", "5 minutes", "trucks", "probe"],
        probe:
          "You point to the soil. What did the soil probe measure, and what happened to the beds last spring?",
        good: "The drainage times and the construction trucks",
      },
      {
        id: "water",
        label: "watering",
        terms: ["water", "watering", "irrigation", "rain", "dry"],
        evidenceTerms: ["three times", "same", "log", "rainfall"],
        probe: "You think watering matters. What does the irrigation log show for both years?",
        good: "A comparison of the two years",
      },
      {
        id: "temp",
        label: "temperature",
        terms: ["temperature", "hot", "heat", "weather", "warm"],
        evidenceTerms: ["78", "77", "station"],
        probe: "You suggest the weather. What did the weather station record for each year?",
        good: "A comparison of the two years",
      },
    ],
    partner: {
      name: "Dr. Chen",
      glyph: "👩🏻‍🔬",
      opening:
        "I am the soil scientist advising the club. The yield dropped 40 percent. What do you think explains it?",
      noCause:
        "You described the problem, but I need a proposed cause. What do you think produced the decline?",
      noEvidence: "What data or observation from the garden supports that explanation?",
      thanks: "Thank you. I will note your reasoning for the board presentation.",
    },
    respond: {
      prompt:
        "Write or say to Dr. Chen what you think caused the decline. Include at least one piece of evidence you found.",
      minWords: 18,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "place",
      title: "Dr. Chen describes the garden site",
      grid: { cols: 3, rows: 3 },
      script: [
        {
          id: "u1",
          text: "Let me describe the garden site on the map in front of you.",
          signal: "describe",
        },
        {
          id: "u2",
          text: "The new gym wing is in the south, along the bottom edge of the map.",
          signal: "south",
        },
        {
          id: "u3",
          text: "The raised vegetable beds are just north of the gym, in the center of the map.",
          signal: "north",
        },
        {
          id: "u4",
          text: "The rain barrel stands in the northeast corner, next to the fence.",
          signal: "northeast",
        },
        {
          id: "u5",
          text: "The tool shed is in the northwest corner, and the compost bin is directly west of the beds.",
          signal: "west",
        },
      ],
      items: [
        { id: "gym", label: "New gym wing", glyph: "🏫" },
        { id: "beds", label: "Raised beds", glyph: "🥬" },
        { id: "barrel", label: "Rain barrel", glyph: "🛢️" },
        { id: "shed", label: "Tool shed", glyph: "🏚️" },
        { id: "compost", label: "Compost bin", glyph: "♻️" },
      ],
      targets: [
        { id: "nw", label: "Northwest" },
        { id: "n", label: "North" },
        { id: "ne", label: "Northeast" },
        { id: "w", label: "West" },
        { id: "c", label: "Center" },
        { id: "e", label: "East" },
        { id: "sw", label: "Southwest" },
        { id: "s", label: "South" },
        { id: "se", label: "Southeast" },
      ],
      expect: [
        { item: "gym", target: "s", utterance: "u2" },
        { item: "beds", target: "c", utterance: "u3" },
        { item: "barrel", target: "ne", utterance: "u4" },
        { item: "shed", target: "nw", utterance: "u5" },
        { item: "compost", target: "w", utterance: "u5" },
      ],
      visuals: {
        u2: "A compass pointing south with a building icon",
        u3: "The center square highlighted",
        u4: "The top right corner highlighted",
        u5: "The top left and middle left squares highlighted",
      },
      xray: {
        keywords: ["south", "north", "northeast", "northwest", "west"],
        sequence: [],
        cause: [],
        referents: [{ phrase: "the beds", means: "the raised vegetable beds" }],
      },
      final: {
        mode: "arrange",
        title: "How to test the soil",
        script: [
          { id: "f1", text: "Here is how the club will test the soil." },
          {
            id: "f2",
            text: "First, push the probe into the bed up to the handle.",
            signal: "First",
          },
          {
            id: "f3",
            text: "Next, pour one liter of water on the soil and start the timer.",
            signal: "Next",
          },
          {
            id: "f4",
            text: "Then record how many minutes the water takes to disappear.",
            signal: "Then",
          },
          {
            id: "f5",
            text: "Finally, compare your time with the five-minute healthy range.",
            signal: "Finally",
          },
        ],
        items: [
          { id: "probe", label: "Push in the probe", glyph: "🧪" },
          { id: "pour", label: "Pour one liter and start the timer", glyph: "💧" },
          { id: "record", label: "Record the minutes", glyph: "📝" },
          { id: "compare", label: "Compare with five minutes", glyph: "⚖️" },
        ],
        targets: [
          { id: "p1", label: "Step 1" },
          { id: "p2", label: "Step 2" },
          { id: "p3", label: "Step 3" },
          { id: "p4", label: "Step 4" },
        ],
        expect: [
          { item: "probe", target: "p1", utterance: "f2" },
          { item: "pour", target: "p2", utterance: "f3" },
          { item: "record", target: "p3", utterance: "f4" },
          { item: "compare", target: "p4", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Why Did the Harbor Garden's Yield Fall?",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "The decline in the garden's yield is mainly the result of compacted soil and lost afternoon sun, not of watering or weather.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "After the construction trucks crossed the beds, water began pooling for 45 minutes instead of draining in 5.",
        },
        {
          id: "s3",
          role: "reason",
          supports: ["s1"],
          text: "Roots that sit in standing water cannot take in oxygen, so they weaken and the plants produce less fruit.",
        },
        {
          id: "s4",
          role: "evidence",
          supports: ["s1"],
          text: "The new gym wing now shades the beds for 4 of their 8 afternoon hours.",
        },
        {
          id: "s5",
          role: "evidence",
          supports: ["s1"],
          text: "However, the irrigation log shows the beds received identical watering in both years.",
        },
        {
          id: "s6",
          role: "evidence",
          supports: ["s1"],
          text: "Average summer temperatures were 77°F last year and 78°F this year, so the weather did not change much.",
        },
        {
          id: "s7",
          role: "background",
          text: "The garden club was founded eleven years ago by a science teacher.",
        },
        {
          id: "s8",
          role: "claim",
          text: "The club should replace all of its tomato seeds with a new brand.",
        },
        {
          id: "s9",
          role: "conclusion",
          text: "Therefore, loosening the soil and moving the beds toward the open lawn should raise next year's yield.",
        },
      ],
      claimOptions: ["s1", "s8"],
      challenge: {
        type: "evidence",
        claim: "s1",
        valid: ["s2", "s3", "s4", "s5", "s6"],
        minValid: 3,
        weak: ["s7", "s9"],
        explainFrame: "This evidence supports the claim because ___, which led to ___.",
        explainTerms: ["because", "led to", "so", "result"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "claim",
              text: "The pond's fish died mainly because oxygen in the water dropped after the algae bloom.",
            },
            {
              id: "t2",
              role: "evidence",
              text: "Oxygen readings fell from 8 to 2 milligrams per liter in the week the algae spread.",
            },
            {
              id: "t3",
              role: "reason",
              text: "When algae die, bacteria use up oxygen as they break the algae down, so less oxygen is left for fish.",
            },
            { id: "t4", role: "detail", text: "Fish counts are taken by volunteers every spring." },
            {
              id: "t5",
              role: "background",
              text: "The pond is located behind the community library.",
            },
            { id: "t6", role: "detail", text: "Water temperature was normal for the season." },
          ],
          claim: "t1",
          valid: ["t2", "t3"],
          minValid: 2,
          weak: ["t4", "t5", "t6"],
        },
      },
      refs: [
        { sentence: "s3", phrase: "they", means: "the roots" },
        { sentence: "s4", phrase: "their", means: "the beds" },
      ],
      layers: {
        meaning: [
          {
            s: "s1",
            phrase: "compacted soil and lost afternoon sun",
            label: "the two causes the claim names",
          },
          {
            s: "s2",
            phrase: "45 minutes instead of draining in 5",
            label: "evidence: measured data",
          },
        ],
        discourse: [
          { s: "s5", phrase: "However", label: "turns to rule out another cause" },
          { s: "s9", phrase: "Therefore", label: "signals the conclusion" },
        ],
        sentence: [
          {
            s: "s3",
            phrase: "so they weaken and the plants produce less fruit",
            label: "result clause chaining two effects",
          },
        ],
        word: [
          { s: "s1", phrase: "compacted", label: "science word", def: "pressed down tightly" },
          { s: "s1", phrase: "yield", label: "academic word", def: "the amount produced" },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "expand",
      title: "Transform a sentence",
      base: "The yield dropped.",
      needs: [
        {
          id: "how",
          label: "Say how much or how fast",
          test: {
            terms: [
              "percent",
              "%",
              "pounds",
              "sharply",
              "quickly",
              "steadily",
              "dramatically",
              "40",
            ],
          },
        },
        { id: "why", label: "Give a cause with a cause word", test: { connectorJob: "cause" } },
        {
          id: "detail",
          label: "Name a specific garden factor",
          test: {
            terms: [
              "soil",
              "sun",
              "sunlight",
              "shade",
              "drainage",
              "compacted",
              "gym",
              "water",
              "roots",
            ],
          },
        },
      ],
      altConnectors: [
        {
          word: "because",
          note: "Because gives the reason after the result: The yield dropped because roots sat in water.",
        },
        {
          word: "as a result",
          note: "As a result begins a sentence with the effect: Roots sat in water. As a result, the yield dropped.",
        },
        {
          word: "which led to",
          note: "Which led to chains a cause onto its effect inside one sentence.",
        },
      ],
      transfer: {
        base: "The fish disappeared.",
        needs: [
          { id: "why", label: "Give a cause with a cause word", test: { connectorJob: "cause" } },
          {
            id: "detail",
            label: "Name a specific factor",
            test: { terms: ["oxygen", "algae", "bacteria", "water", "temperature", "bloom"] },
          },
        ],
      },
    },
    {
      kind: "build",
      module: "combine",
      title: "Sentence combining",
      pair: ["The new gym wing blocks the afternoon sun.", "The tomato plants produce less fruit."],
      relation: "cause",
      keep: ["gym", "sun", "tomato", "fruit"],
      transfer: {
        pair: ["Construction trucks compacted the soil.", "Water pools on the beds after rain."],
        relation: "cause",
        keep: ["trucks", "soil", "water", "pools"],
      },
    },
  ],
  communicate: {
    kind: "converse",
    mode: "speak",
    prompt:
      "Explain to Dr. Chen what caused the decline in yield and which evidence supports your explanation.",
    partner: {
      name: "Dr. Chen",
      glyph: "👩🏻‍🔬",
      role: ["Soil scientist", "Científica de suelos"],
      opening:
        "The board meets Friday. Give me your explanation of the decline in yield, in your own words.",
    },
    topicTerms: [
      "yield",
      "decline",
      "soil",
      "compacted",
      "drainage",
      "sunlight",
      "shade",
      "gym",
      "roots",
      "water",
    ],
    sourceTerms: ["45 minutes", "5 minutes", "4 of 8", "gym wing", "trucks", "identical watering"],
    evidenceBank: [
      "Water pools for 45 minutes; healthy soil drains in 5.",
      "The gym wing shades the beds for 4 of 8 afternoon hours.",
      "The irrigation log shows identical watering both years.",
      "Temperatures were 77°F and 78°F.",
    ],
    lines: [
      {
        id: "soil",
        terms: ["soil", "compact", "compacted", "drain", "drainage", "trucks", "roots", "pool"],
        evidenceTerms: ["45", "5 minutes", "trucks", "probe"],
        ack: "So you are pointing to the soil and its drainage.",
        probe: "What did the soil probe measure, and what would that do to the plant roots?",
        close: "The drainage time and its effect on roots",
      },
      {
        id: "sun",
        terms: ["sun", "sunlight", "shade", "shadow", "gym", "afternoon"],
        evidenceTerms: ["4 of", "four", "gym wing", "8 hours"],
        ack: "So you think the loss of afternoon sun is the main cause.",
        probe: "How many hours of sun were lost, and would that explain a drop in every bed?",
        close: "The hours lost and why it affects every bed",
      },
      {
        id: "water",
        terms: ["water", "watering", "irrigation", "rain", "dry"],
        evidenceTerms: ["identical", "same", "three times", "log"],
        ack: "So you are considering the watering.",
        probe:
          "What does the irrigation log show about both years, and does that support your idea?",
        close: "A comparison that supports or rules out watering",
      },
      {
        id: "temp",
        terms: ["temperature", "hot", "heat", "weather", "warm"],
        evidenceTerms: ["77", "78"],
        ack: "So you are considering the weather.",
        probe: "What did the weather station record, and what does that tell you about your idea?",
        close: "A comparison that supports or rules out weather",
      },
    ],
    followUps: {
      ...followUps,
      phenomenon: "Begin by stating precisely what changed in the garden and by how much.",
      cause: "What do you propose caused that? Link the cause to its effect with a connector.",
      chain: "What happens next because of that? Add the next link in the chain.",
      support: "Which measurement or record from the garden supports that claim?",
    },
    maxTurns: 3,
    minWords: 25,
  },
  improve: {
    models: {
      phenomenon: "The garden's yield dropped from 120 to 72 pounds, a decline of 40 percent.",
      cause:
        "The yield declined because compacted soil and a new shadow reduced what the plants could take in.",
      chain:
        "Because the trucks compacted the soil, water pooled around the roots, which led to root damage and less fruit.",
      support:
        "The soil probe shows water pooling for 45 minutes instead of 5, and the shadow map shows 4 of 8 sun hours lost.",
    },
    whys: [
      {
        id: "why-chain",
        text: "It links each cause to its effect, so the listener can follow the chain of reasoning.",
        moves: ["cause", "chain"],
      },
      {
        id: "why-data",
        text: "It cites a measurement, so the explanation rests on evidence and not opinion.",
        moves: ["support"],
      },
      {
        id: "why-claim",
        text: "It states exactly what changed, so the audience knows what is being explained.",
        moves: ["phenomenon"],
      },
    ],
  },
  show: {
    kind: "compose",
    mode: "write",
    prompt:
      "New situation: A neighborhood pond lost most of its fish. Observations: oxygen readings fell from 8 to 2 milligrams per liter during a week of heavy algae growth; the water temperature was normal; and volunteers found many dead algae on the bottom. Write to the town environmental committee and explain what caused the fish to die, using the observations as evidence.",
    audience: ["The town environmental committee", "El comité ambiental del pueblo"],
    genre: "explanation",
    topicTerms: ["fish", "oxygen", "algae", "pond", "water", "bacteria", "temperature", "bloom"],
    sourceTerms: ["8 to 2", "milligrams", "algae", "normal"],
    organizer: ["phenomenon", "cause", "evidence", "result"],
    readerQuestions: {
      phenomenon: "What exactly happened at the pond?",
      cause: "What do you think caused it?",
      chain: "What happened next because of that?",
      support: "Which observation supports your explanation?",
    },
    minWords: 45,
  },
};

export default {
  id: "m08",
  bands: { "3-5": g35, "6-8": g68 },
};
