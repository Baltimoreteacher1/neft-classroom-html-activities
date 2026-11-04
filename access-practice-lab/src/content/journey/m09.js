// Mission 9 — Solve the Mystery (Unit 3, Explain; museum). Grades 3-5: why the red stripes on an old flag faded.
// Grades 6-8: why a 150-year-old portrait has new cracks. Learners observe, infer, test a hypothesis with the
// controls, weigh competing explanations, and REVISE when a new clue arrives (encoded in each converse line's `ack`
// and in followUps.chain). Title, goal, WIDA and spiral data live in MISSIONS (curriculum.js); family guidance lives
// in family.js. Task content is English; titles and roles are bilingual [en, es]. Hints ask and never state an answer.
// Builds on m08 (explain a cause with evidence): here the explanation must also survive a new clue.

const g35 = {
  environment: "museum",
  context: {
    title: ["The Case of the Faded Flag", "El caso de la bandera descolorida"],
    premise:
      "The city museum has a mystery. An old flag in a glass case used to have bright red stripes, and now the stripes are pale pink. Ms. Lee, the curator, needs your help to find out why.",
    cast: [
      {
        id: "lee",
        name: "Ms. Lee",
        role: ["Museum curator", "Curadora del museo"],
        glyph: "👩🏻‍🎨",
      },
      {
        id: "mia",
        name: "Mia",
        role: ["Junior detective", "Detective novata"],
        glyph: "🧒🏾",
      },
    ],
  },
  vocab: [
    [
      "clue",
      "a fact that helps you solve a mystery",
      "pista: un dato que ayuda a resolver un misterio",
    ],
    ["observe", "to look closely and notice details", "observar: mirar de cerca y notar detalles"],
    [
      "infer",
      "to use clues to figure out what you cannot see",
      "inferir: usar pistas para deducir lo que no se ve",
    ],
    [
      "evidence",
      "facts that show an idea is true",
      "evidencia: datos que muestran que una idea es cierta",
    ],
    [
      "explanation",
      "an idea that tells why something happened",
      "explicación: una idea que dice por qué pasó algo",
    ],
    ["fade", "to slowly lose color", "descolorarse: perder el color poco a poco"],
    [
      "revise",
      "to change your idea when you learn something new",
      "revisar: cambiar tu idea cuando aprendes algo nuevo",
    ],
    [
      "curator",
      "a person who takes care of a museum collection",
      "curador o curadora: persona que cuida la colección de un museo",
    ],
  ],
  frames: {
    A: [
      "I see ___. I think ___ because ___.",
      "At first I thought ___, but the new clue shows ___.",
      "This clue helps because ___.",
    ],
    B: ["I think ___ because ___.", "The new clue ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt: "Why did the red stripes on the old flag turn pale pink?",
    objects: [
      {
        id: "flag",
        label: "The old flag",
        glyph: "🚩",
        x: 46,
        y: 40,
        relevant: true,
        note: "The old flag has pale pink stripes where the red should be. The blue stars are still dark blue.",
      },
      {
        id: "window",
        label: "Tall window",
        glyph: "🪟",
        x: 80,
        y: 22,
        relevant: true,
        note: "A tall window faces the flag case. Sun shines across the case for five hours every day.",
      },
      {
        id: "twin",
        label: "Storage drawer",
        glyph: "🗄️",
        x: 14,
        y: 62,
        relevant: true,
        note: "A twin flag, sewn at the same time, was kept in a dark drawer for the same number of years. Its stripes are still bright red.",
      },
      {
        id: "sign",
        label: "Case sign",
        glyph: "🔒",
        x: 52,
        y: 78,
        relevant: true,
        note: "The sign says, “Please do not touch.” The glass case has been locked since the day it opened.",
      },
      {
        id: "card",
        label: "Room card",
        glyph: "📋",
        x: 82,
        y: 66,
        relevant: true,
        note: "The room card says the air in this room is dry and cool, the same as in every other museum room.",
      },
      {
        id: "bag",
        label: "Gift shop bag",
        glyph: "🛍️",
        x: 12,
        y: 88,
        relevant: false,
        note: "A bag from the museum gift shop sits on a bench. It holds postcards.",
      },
    ],
    controls: [
      {
        id: "light",
        label: "Light on the flag",
        initial: "bright",
        options: [
          { id: "bright", label: "Bright window sun" },
          { id: "dim", label: "Dim light" },
        ],
      },
      {
        id: "hands",
        label: "Hands on the flag",
        initial: "touched",
        options: [
          { id: "touched", label: "Visitors touch it" },
          { id: "clean", label: "Hands off" },
        ],
      },
    ],
    outcomes: [
      {
        when: { light: "bright", hands: "touched" },
        mood: "bad",
        key: "both",
        state:
          "After a model year, the red stripes are pale pink. The cloth is also gray and rubbed at the edges.",
      },
      {
        when: { light: "bright", hands: "clean" },
        mood: "warn",
        key: "sunonly",
        state: "After a model year, the red stripes are pale pink. The cloth is clean and smooth.",
      },
      {
        when: { light: "dim", hands: "touched" },
        mood: "warn",
        key: "handsonly",
        state:
          "After a model year, the red stripes are still bright red. The edges of the cloth are gray and rubbed.",
      },
      {
        when: { light: "dim", hands: "clean" },
        mood: "good",
        key: "safe",
        state: "After a model year, the red stripes are bright red and the cloth is clean.",
      },
    ],
    collect: 3,
    variables: [
      {
        id: "light",
        label: "sunlight",
        terms: ["sun", "sunlight", "light", "window", "bright", "shine", "shines"],
        evidenceTerms: ["drawer", "dark", "five hours", "twin", "window"],
        probe:
          "You think the light matters. Which clue shows what happens to a flag in the sun and a flag in the dark?",
        good: "A clue that compares two flags",
      },
      {
        id: "hands",
        label: "people touching the flag",
        terms: ["touch", "touched", "touching", "hands", "fingers", "visitors", "rub", "rubbed"],
        evidenceTerms: ["locked", "case", "glass", "sign", "gray", "test"],
        probe:
          "You think touching matters. What does the sign say about the case, and what happened to the red stripes in the test?",
        good: "A comparison from the test and the sign",
      },
      {
        id: "damp",
        label: "damp air",
        terms: ["damp", "wet", "water", "humid", "moisture", "rain", "air"],
        evidenceTerms: ["dry", "cool", "card", "room"],
        probe: "You are thinking about the air. What does the room card say about it?",
        good: "What the room card says",
      },
    ],
    partner: {
      name: "Ms. Lee",
      glyph: "👩🏻‍🎨",
      opening:
        "Welcome to the museum! Our old flag has lost its red color, and nobody knows why. What do you think happened?",
      noCause:
        "You told me what you see. Now I need your idea. What do you think made the stripes change?",
      noEvidence: "Which clue did you find that makes you think so?",
      thanks: "Thank you, detective. Your idea will help me decide what to check next.",
    },
    respond: {
      prompt: "Tell Ms. Lee what you think faded the flag. Use a clue you found.",
      minWords: 12,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "sort",
      title: "Ms. Lee reads her clue notes",
      script: [
        { id: "u1", text: "I am writing my clue notes for the flag case." },
        {
          id: "u2",
          text: "I see that the red stripes are pale pink.",
          signal: "I see",
        },
        {
          id: "u3",
          text: "I notice that the blue stars are still dark blue.",
          signal: "I notice",
        },
        {
          id: "u4",
          text: "I also see that the glass case is locked.",
          signal: "I also see",
        },
        {
          id: "u5",
          text: "I think the sunlight faded the red color, because the window faces the case.",
          signal: "I think",
        },
        {
          id: "u6",
          text: "I predict that the twin flag in the dark drawer is still red, because it gets no sun.",
          signal: "I predict",
        },
      ],
      items: [
        { id: "pink", label: "The stripes are pale pink", glyph: "🩷" },
        { id: "blue", label: "The stars are dark blue", glyph: "⭐" },
        { id: "locked", label: "The case is locked", glyph: "🔒" },
        { id: "sun", label: "Sunlight faded the red", glyph: "☀️" },
        { id: "drawer", label: "The flag in the drawer is still red", glyph: "🗄️" },
      ],
      targets: [
        { id: "see", label: "What I see" },
        { id: "think", label: "What I think" },
      ],
      expect: [
        { item: "pink", target: "see", utterance: "u2" },
        { item: "blue", target: "see", utterance: "u3" },
        { item: "locked", target: "see", utterance: "u4" },
        { item: "sun", target: "think", utterance: "u5" },
        { item: "drawer", target: "think", utterance: "u6" },
      ],
      visuals: {
        u2: "An eye looking at a pink stripe",
        u3: "An eye looking at a dark blue star",
        u4: "An eye looking at a lock on a glass case",
        u5: "A thought bubble above a window and a flag",
        u6: "A thought bubble above a dark drawer",
      },
      xray: {
        keywords: ["I see", "I notice", "I think", "I predict"],
        sequence: [],
        cause: ["because"],
        referents: [{ phrase: "it", means: "the twin flag in the dark drawer" }],
      },
      final: {
        title: "Ms. Lee reads new clue notes",
        script: [
          { id: "f1", text: "Now I am looking at a clay pot from the museum shelf." },
          { id: "f2", text: "I see that the pot has a long crack down one side.", signal: "I see" },
          {
            id: "f3",
            text: "I notice that the pot sits right next to a heater.",
            signal: "I notice",
          },
          {
            id: "f4",
            text: "I think the heat made the pot crack, because old clay can crack when it dries out too fast.",
            signal: "I think",
          },
          {
            id: "f5",
            text: "I predict that a pot far from the heater has no crack.",
            signal: "I predict",
          },
        ],
        items: [
          { id: "crack", label: "The pot has a long crack", glyph: "🏺" },
          { id: "heater", label: "The pot sits next to a heater", glyph: "🔥" },
          { id: "heat", label: "The heat made the pot crack", glyph: "💭" },
          { id: "far", label: "A pot far from the heater has no crack", glyph: "❄️" },
        ],
        targets: [
          { id: "see", label: "What I see" },
          { id: "think", label: "What I think" },
        ],
        expect: [
          { item: "crack", target: "see", utterance: "f2" },
          { item: "heater", target: "see", utterance: "f3" },
          { item: "heat", target: "think", utterance: "f4" },
          { item: "far", target: "think", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Clue Report: The Faded Flag",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "Sunlight is the reason the flag's red stripes faded.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "A twin flag kept in a dark drawer for the same number of years still has bright red stripes.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "The flag in the case sits across from a window, and sun shines on it for five hours every day.",
        },
        {
          id: "s4",
          role: "reason",
          supports: ["s1"],
          text: "Sunlight can break down the color in cloth dye, so the color slowly fades.",
        },
        {
          id: "s5",
          role: "detail",
          text: "The flag was sewn by hand a very long time ago.",
        },
        {
          id: "s6",
          role: "background",
          text: "The museum opens at nine o'clock every morning.",
        },
        {
          id: "s7",
          role: "detail",
          text: "The flag has a pattern of twelve blue stars.",
        },
        {
          id: "s8",
          role: "conclusion",
          text: "So the curator will cover the window with a special film.",
        },
        {
          id: "s9",
          role: "claim",
          text: "The flag is the most beautiful thing in the museum.",
        },
      ],
      claimOptions: ["s1", "s9"],
      challenge: {
        type: "evidence",
        claim: "s1",
        valid: ["s2", "s3", "s4"],
        minValid: 2,
        weak: ["s5", "s6", "s7", "s8"],
        explainFrame: "This clue supports the claim because ___.",
        explainTerms: ["because", "shows", "so", "clue"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "claim",
              text: "The leaky roof is the reason there is a puddle by the fossil case.",
            },
            {
              id: "t2",
              role: "evidence",
              text: "Drops of water fall from a brown stain on the ceiling, right above the puddle.",
            },
            {
              id: "t3",
              role: "evidence",
              text: "The puddle gets bigger every time it rains outside.",
            },
            {
              id: "t4",
              role: "detail",
              text: "The fossil case holds bones from a huge sea animal.",
            },
            { id: "t5", role: "background", text: "The museum cafe sells hot chocolate." },
            { id: "t6", role: "detail", text: "The floor is made of gray stone tiles." },
          ],
          claim: "t1",
          valid: ["t2", "t3"],
          minValid: 2,
          weak: ["t4", "t5", "t6"],
        },
      },
      refs: [
        { sentence: "s3", phrase: "it", means: "the flag in the case" },
        {
          sentence: "s2",
          phrase: "twin flag",
          means: "a second flag made just like the flag in the case",
        },
      ],
      layers: {
        meaning: [
          { s: "s1", phrase: "Sunlight", label: "the explanation the claim gives" },
          {
            s: "s2",
            phrase: "still has bright red stripes",
            label: "evidence: a clue from the twin flag",
          },
        ],
        discourse: [
          { s: "s4", phrase: "so", label: "links a reason to what happens" },
          { s: "s8", phrase: "So", label: "shows what the curator will do because of the clues" },
        ],
        sentence: [{ s: "s3", phrase: "for five hours every day", label: "tells how long" }],
        word: [
          { s: "s1", phrase: "reason", label: "academic word", def: "why something happens" },
          {
            s: "s4",
            phrase: "fades",
            label: "science word",
            def: "slowly gets lighter in color",
          },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "combine",
      title: "Sentence combining",
      pair: ["The flag sat in the sun for years.", "The red stripes turned pale pink."],
      relation: "cause",
      keep: ["flag", "sun", "red", "pink"],
      transfer: {
        pair: ["The clay pot sat near the heater.", "The pot cracked."],
        relation: "cause",
        keep: ["pot", "heater", "cracked"],
      },
    },
    {
      kind: "build",
      module: "connector",
      title: "Connector laboratory",
      gaps: [
        {
          before: "The flag in the drawer is still red",
          after: "it gets no sunlight.",
          relation: "cause",
          options: ["because", "so", "but", "then"],
          ok: ["because"],
        },
        {
          before: "At first I thought touching faded the flag,",
          after: "the guard's log shows the case was never opened.",
          relation: "contrast",
          options: ["but", "because", "so", "and"],
          ok: ["but"],
        },
        {
          before: "The new clue changes my idea,",
          after: "I need to revise my explanation.",
          relation: "cause",
          options: ["so", "but", "because", "before"],
          ok: ["so"],
        },
      ],
      notes: {
        because: "Because shows the reason.",
        but: "But shows a difference, or a change of mind.",
        so: "So shows the result.",
      },
      transfer: {
        gaps: [
          {
            before: "The puddle grows after rain",
            after: "the roof is leaking.",
            relation: "cause",
            options: ["because", "so", "but", "then"],
            ok: ["because"],
          },
          {
            before: "I first thought the cafe spilled it,",
            after: "the water is coming from the ceiling.",
            relation: "contrast",
            options: ["but", "because", "so", "and"],
            ok: ["but"],
          },
        ],
      },
    },
  ],
  communicate: {
    kind: "converse",
    mode: "discuss",
    prompt:
      "Explain to Ms. Lee what faded the flag. Use clues to show why you think so, and be ready to change your idea if a new clue appears.",
    partner: {
      name: "Ms. Lee",
      glyph: "👩🏻‍🎨",
      role: ["Museum curator", "Curadora del museo"],
      opening:
        "I have to write the museum label for this flag. What do you think happened to its red stripes, and what clues do you have?",
    },
    topicTerms: [
      "flag",
      "red",
      "stripes",
      "faded",
      "fade",
      "sun",
      "sunlight",
      "window",
      "light",
      "touch",
      "clue",
      "drawer",
    ],
    sourceTerms: ["twin flag", "dark drawer", "five hours", "locked", "dry"],
    evidenceBank: [
      "The twin flag in the dark drawer still has bright red stripes.",
      "Sun shines on the flag case for five hours every day.",
      "The glass case is locked, so visitors cannot touch the flag.",
      "The room air is dry and cool, like every other room.",
      "The blue stars are still dark blue.",
    ],
    lines: [
      {
        id: "sun",
        terms: ["sun", "sunlight", "light", "window", "bright", "shine"],
        evidenceTerms: ["drawer", "dark", "five", "twin", "window"],
        ack: "So you think sunlight faded the flag. Here is a new clue from my file: the stripes closest to the window are the palest, and the stripes in the shadow of the case frame are darker. Does this clue change or add to your explanation?",
        probe: "Which clue shows that sunlight matters, and how does the new clue fit?",
        close: "A clue that compares two flags, and what the new clue adds",
      },
      {
        id: "hands",
        terms: ["touch", "touched", "touching", "hands", "fingers", "visitors", "rub"],
        evidenceTerms: ["locked", "case", "glass", "sign"],
        ack: "So you think touching faded the flag. Here is a new clue from the guard's log: nobody has opened the glass case in ten years. Does this clue change your explanation?",
        probe: "What did the case sign or the test show about hands and the flag's color?",
        close: "What the test or the sign says about touching",
      },
      {
        id: "damp",
        terms: ["damp", "wet", "water", "humid", "moisture", "rain", "air"],
        evidenceTerms: ["dry", "cool", "card", "room"],
        ack: "So you think damp air faded the flag. Here is a new clue from the weather log: this room has stayed dry every month this year. Does this clue change your explanation?",
        probe: "What does the room card say about the air, and does it match your idea?",
        close: "A comparison with what the room card says",
      },
    ],
    followUps: {
      phenomenon: "Start by telling me exactly what happened to the flag.",
      cause: "What do you think caused that? Try using “because” or “so”.",
      chain:
        "Think about the new clue. Does it change your idea? Tell me what you thought at first and what you think now.",
      support: "Which clue shows that is true?",
    },
    maxTurns: 4,
    minWords: 22,
  },
  improve: {
    models: {
      phenomenon: "The red stripes on the old flag turned pale pink.",
      cause: "The red faded because the sun shines on the flag for five hours every day.",
      chain:
        "At first I thought touching faded the flag, but the case is locked, so now I think sunlight caused it.",
      support:
        "The twin flag in the dark drawer is still bright red, and this shows that light matters.",
    },
    whys: [
      {
        id: "why-revise",
        text: "It shows how a new clue changed my thinking, so my listener can see I weigh the evidence.",
        moves: ["chain"],
      },
      {
        id: "why-cause",
        text: "It tells why the flag changed, so my listener can follow my idea.",
        moves: ["cause"],
      },
      {
        id: "why-clue",
        text: "It uses a clue from the museum, so my listener can trust my idea.",
        moves: ["support"],
      },
      {
        id: "why-topic",
        text: "It says exactly what mystery I am solving, so my listener is not confused.",
        moves: ["phenomenon"],
      },
    ],
  },
  show: {
    kind: "converse",
    mode: "discuss",
    prompt:
      "New mystery: In the museum lobby, a tall plant has drooping leaves with brown edges. Clues: the soil in its pot is dry and pulls away from the edge of the pot; the watering chart shows nobody watered it for three weeks; a smaller plant next to it, in the same light, is watered every week and has firm green leaves. Explain to Mr. Cruz, the museum gardener, what you think happened to the plant and which clues show it. If he gives you a new clue, tell him whether your idea changes.",
    partner: {
      name: "Mr. Cruz",
      glyph: "🧑🏽‍🌾",
      role: ["Museum gardener", "Jardinero del museo"],
      opening:
        "This plant looked healthy last month. What do you think happened, and which clues make you think so?",
    },
    topicTerms: [
      "plant",
      "leaves",
      "water",
      "soil",
      "dry",
      "drooping",
      "light",
      "pot",
      "roots",
      "clue",
    ],
    sourceTerms: ["dry", "three weeks", "watering chart", "smaller plant", "firm"],
    lines: [
      {
        id: "water",
        terms: ["water", "watered", "watering", "dry", "thirsty", "soil"],
        evidenceTerms: ["three weeks", "chart", "dry", "pulls away", "smaller plant"],
        ack: "So you think the plant did not get enough water. Here is a new clue: after a guard watered it yesterday, the leaves stood up again by this morning. Does this clue change or add to your idea?",
        probe: "Which clues show how much water each plant got?",
        close: "A comparison of the two plants' watering",
      },
      {
        id: "light",
        terms: ["light", "sun", "sunlight", "window", "dark", "shade"],
        evidenceTerms: ["same light", "smaller plant", "next to"],
        ack: "So you think the light is the problem. Here is a new clue: the smaller plant beside it gets exactly the same light and looks fine. Does this clue change your idea?",
        probe: "What do the clues say about the light each plant gets?",
        close: "A comparison of the two plants' light",
      },
      {
        id: "pot",
        terms: ["pot", "roots", "crowded", "small", "space", "size"],
        evidenceTerms: ["roots", "room", "tipped"],
        ack: "So you think the pot is the problem. Here is a new clue: I tipped the plant out of its pot, and the roots have plenty of room. Does this clue change your idea?",
        probe: "Which clue shows something about the pot or the roots?",
        close: "A clue about the pot and the roots",
      },
    ],
    followUps: {
      phenomenon: "Start by telling me exactly what is happening to the plant.",
      cause: "What do you think caused that? Try using “because” or “so”.",
      chain:
        "Think about the new clue. Does it change your idea? Tell me what you thought at first and what you think now.",
      support: "Which clue shows that is true?",
    },
    maxTurns: 4,
    minWords: 20,
  },
};

const g68 = {
  environment: "museum",
  context: {
    title: ["The Cracked Portrait", "El retrato agrietado"],
    premise:
      "In Gallery 3 of the Harborview Museum, a 150-year-old portrait of a sailor has developed new cracks. Dr. Okafor, the museum's conservator, must explain the damage to the director before the gallery reopens.",
    cast: [
      {
        id: "okafor",
        name: "Dr. Okafor",
        role: ["Museum conservator", "Conservadora del museo"],
        glyph: "👩🏿‍🔬",
      },
      {
        id: "tomas",
        name: "Tomás",
        role: ["Conservation intern", "Pasante de conservación"],
        glyph: "🧑🏽",
      },
    ],
  },
  vocab: [
    [
      "conservator",
      "a specialist who protects and repairs museum objects",
      "conservador o conservadora: especialista que protege y repara objetos de museo",
    ],
    [
      "humidity",
      "the amount of water vapor in the air",
      "humedad: la cantidad de vapor de agua en el aire",
    ],
    ["fluctuate", "to rise and fall again and again", "fluctuar: subir y bajar una y otra vez"],
    [
      "observation",
      "something you notice directly with your senses or instruments",
      "observación: algo que notas directamente con los sentidos o con instrumentos",
    ],
    [
      "inference",
      "a conclusion you reach by reasoning from clues",
      "inferencia: una conclusión a la que llegas razonando con pistas",
    ],
    [
      "evidence",
      "information that supports a conclusion",
      "evidencia: información que apoya una conclusión",
    ],
    [
      "rule out",
      "to decide that something is not the cause",
      "descartar: decidir que algo no es la causa",
    ],
    [
      "revise",
      "to change an explanation because of new evidence",
      "revisar: cambiar una explicación por nueva evidencia",
    ],
  ],
  frames: {
    A: [
      "I observed ___, so I infer ___.",
      "At first I thought ___, but the new evidence shows ___.",
      "The evidence supports my explanation because ___.",
    ],
    B: ["The evidence suggests ___.", "I revised my explanation because ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt: "Why has the 150-year-old portrait developed new cracks?",
    objects: [
      {
        id: "portrait",
        label: "The portrait",
        glyph: "🖼️",
        x: 46,
        y: 30,
        relevant: true,
        note: "A web of fine cracks has appeared across the lower half of the portrait, mostly in the thickest paint. The colors still look rich and bright.",
      },
      {
        id: "hygro",
        label: "Humidity log",
        glyph: "💧",
        x: 14,
        y: 54,
        relevant: true,
        note: "Humidity log: since the heating system was upgraded in October, the relative humidity in Gallery 3 swings between 30 and 70 percent within a single week. In the storage vault it stays near 50 percent.",
      },
      {
        id: "lux",
        label: "Light meter",
        glyph: "💡",
        x: 78,
        y: 20,
        relevant: true,
        note: "Light meter: the light on the painting reads 50 lux, within the museum's safe range. The window has a filter that blocks ultraviolet light.",
      },
      {
        id: "report",
        label: "Conservator's file",
        glyph: "🗂️",
        x: 74,
        y: 62,
        relevant: true,
        note: "File: a matching portrait by the same painter, stored in the vault since 1990, has almost no cracks. Both paintings are oil on canvas stretched over wooden frames.",
      },
      {
        id: "floor",
        label: "Floor sensor",
        glyph: "📈",
        x: 40,
        y: 82,
        relevant: true,
        note: "Floor sensor: no unusual vibration has been recorded in Gallery 3. The construction next door ended in August.",
      },
      {
        id: "guest",
        label: "Guest book",
        glyph: "📖",
        x: 90,
        y: 86,
        relevant: false,
        note: "The guest book by the entrance holds visitors' comments. Many people praise the gift shop.",
      },
    ],
    controls: [
      {
        id: "air",
        label: "Gallery humidity",
        initial: "swings",
        options: [
          { id: "steady", label: "Steady at 50 percent" },
          { id: "swings", label: "Swings from 30 to 70 percent" },
        ],
      },
      {
        id: "light",
        label: "Light on the painting",
        initial: "safe",
        options: [
          { id: "safe", label: "Gallery light, 50 lux" },
          { id: "bright", label: "Strong light, 500 lux" },
        ],
      },
    ],
    outcomes: [
      {
        when: { air: "steady", light: "safe" },
        mood: "good",
        key: "calm",
        state:
          "Model result after one simulated year: the paint surface is unchanged. No new cracks appear and the colors are the same.",
      },
      {
        when: { air: "swings", light: "safe" },
        mood: "warn",
        key: "cracks",
        state:
          "Model result after one simulated year: fine cracks lengthen and branch across the thickest paint. The colors look unchanged.",
      },
      {
        when: { air: "steady", light: "bright" },
        mood: "warn",
        key: "fade",
        state:
          "Model result after one simulated year: the thin, bright glazes look paler. No new cracks appear.",
      },
      {
        when: { air: "swings", light: "bright" },
        mood: "bad",
        key: "both",
        state:
          "Model result after one simulated year: fine cracks branch across the thick paint, and the thin glazes look paler.",
      },
    ],
    collect: 4,
    variables: [
      {
        id: "humidity",
        label: "swings in humidity",
        terms: [
          "humidity",
          "humid",
          "damp",
          "moisture",
          "air",
          "swing",
          "swings",
          "fluctuate",
          "fluctuates",
          "expand",
          "shrink",
          "heating",
          "dry",
        ],
        evidenceTerms: ["30", "70", "50", "vault", "heating", "october", "log"],
        probe:
          "You point to the air in the gallery. What does the humidity log show for the gallery and for the vault?",
        good: "Numbers from two rooms to compare",
      },
      {
        id: "light",
        label: "light",
        terms: ["light", "lux", "sun", "window", "fade", "fading", "bright", "ultraviolet", "uv"],
        evidenceTerms: ["50 lux", "filter", "safe", "meter"],
        probe:
          "You think light might be responsible. What does the light meter say, and what did the model show light does to the paint?",
        good: "The reading and what the model showed",
      },
      {
        id: "vibration",
        label: "vibration",
        terms: ["vibration", "vibrate", "shake", "shaking", "floor", "noise", "construction"],
        evidenceTerms: ["sensor", "august", "unusual", "ended"],
        probe:
          "You suspect vibration. What did the floor sensor record, and when did the construction end?",
        good: "A reading and a date to compare with the cracks",
      },
      {
        id: "age",
        label: "age and materials",
        terms: ["age", "old", "years", "canvas", "materials", "paint", "oil", "painter"],
        evidenceTerms: ["vault", "1990", "matching", "same painter", "almost no cracks"],
        probe:
          "You think the painting's age or materials matter. How does the matching portrait in the vault compare?",
        good: "A comparison between the two paintings",
      },
    ],
    partner: {
      name: "Dr. Okafor",
      glyph: "👩🏿‍🔬",
      opening:
        "Welcome to the conservation lab. Our 150-year-old portrait has developed new cracks, and I must report to the director. What do you think is causing them?",
      noCause:
        "You described the damage, but I need a proposed cause. What do you think produced the cracks?",
      noEvidence: "Which clue or measurement in the gallery supports that explanation?",
      thanks: "Thank you. I will add your reasoning to my notes for the director.",
    },
    respond: {
      prompt:
        "Tell Dr. Okafor what you think is cracking the painting. Name at least one clue that supports your idea.",
      minWords: 18,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "sort",
      title: "Dr. Okafor dictates her field notes",
      script: [
        { id: "u1", text: "Here are my field notes from Gallery 3." },
        {
          id: "u2",
          text: "I observed that fine cracks run across the thickest areas of paint.",
          signal: "I observed",
        },
        {
          id: "u3",
          text: "I measured the light on the painting, and the meter reads fifty lux.",
          signal: "I measured",
        },
        {
          id: "u4",
          text: "This suggests that light is not damaging the paint, because fifty lux is within the safe range.",
          signal: "This suggests",
        },
        {
          id: "u5",
          text: "I also recorded that the humidity in this gallery rises and falls sharply each week.",
          signal: "I also recorded",
        },
        {
          id: "u6",
          text: "I infer that the canvas swells and shrinks with the humidity, which stresses the stiff paint layer.",
          signal: "I infer",
        },
        {
          id: "u7",
          text: "Because the matching portrait in the vault has very few cracks, I predict that steady air protects paintings.",
          signal: "I predict",
        },
      ],
      items: [
        { id: "cracks", label: "Cracks run across the thick paint", glyph: "🖼️" },
        { id: "meter", label: "The meter reads fifty lux", glyph: "💡" },
        { id: "swing", label: "Humidity rises and falls each week", glyph: "💧" },
        { id: "notlight", label: "Light is not damaging the paint", glyph: "💭" },
        { id: "swell", label: "The canvas swells and shrinks", glyph: "🧵" },
        { id: "steady", label: "Steady air protects paintings", glyph: "🛡️" },
      ],
      targets: [
        { id: "obs", label: "Observation" },
        { id: "inf", label: "Inference" },
      ],
      expect: [
        { item: "cracks", target: "obs", utterance: "u2" },
        { item: "meter", target: "obs", utterance: "u3" },
        { item: "notlight", target: "inf", utterance: "u4" },
        { item: "swing", target: "obs", utterance: "u5" },
        { item: "swell", target: "inf", utterance: "u6" },
        { item: "steady", target: "inf", utterance: "u7" },
      ],
      visuals: {
        u2: "A magnifier over a web of fine cracks",
        u3: "A light meter dial with a needle",
        u4: "A thought bubble that links a lamp to the paint",
        u5: "A line graph that goes up and down",
        u6: "A canvas drawn bigger and then smaller, with a thought bubble",
        u7: "A thought bubble above a vault with a flat graph line",
      },
      xray: {
        keywords: ["observed", "measured", "recorded", "suggests", "infer", "predict"],
        sequence: [],
        cause: ["because", "which"],
        referents: [{ phrase: "the stiff paint layer", means: "the old oil paint on the canvas" }],
      },
      final: {
        title: "Dr. Okafor dictates notes on a different object",
        script: [
          { id: "f1", text: "Now I am examining a silver teapot from the dining room display." },
          {
            id: "f2",
            text: "I observed dark spots across the surface of the teapot.",
            signal: "I observed",
          },
          {
            id: "f3",
            text: "I measured the air in the case, and a small sensor detects traces of sulfur.",
            signal: "I measured",
          },
          {
            id: "f4",
            text: "This suggests that sulfur is reacting with the silver, because silver forms a dark layer when it meets sulfur.",
            signal: "This suggests",
          },
          {
            id: "f5",
            text: "I predict that a sealed case without sulfur would keep the teapot bright.",
            signal: "I predict",
          },
        ],
        items: [
          { id: "spots", label: "Dark spots cover the teapot", glyph: "🫖" },
          { id: "sensor", label: "The sensor detects sulfur", glyph: "📟" },
          { id: "react", label: "Sulfur is reacting with the silver", glyph: "💭" },
          { id: "sealed", label: "A sealed case would keep it bright", glyph: "🔮" },
        ],
        targets: [
          { id: "obs", label: "Observation" },
          { id: "inf", label: "Inference" },
        ],
        expect: [
          { item: "spots", target: "obs", utterance: "f2" },
          { item: "sensor", target: "obs", utterance: "f3" },
          { item: "react", target: "inf", utterance: "f4" },
          { item: "sealed", target: "inf", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Conservator's Report: Cracks in the Sailor Portrait",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "Repeated swings in humidity, not light or vibration, are the most likely cause of the new cracks in the portrait.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "Since the heating system was upgraded, the gallery's relative humidity has risen and fallen between 30 and 70 percent every week.",
        },
        {
          id: "s3",
          role: "reason",
          supports: ["s1"],
          text: "Canvas swells when it absorbs moisture and shrinks when it dries, but old oil paint is stiff and cannot stretch to follow it, so the paint layer splits.",
        },
        {
          id: "s4",
          role: "evidence",
          supports: ["s1"],
          text: "A matching portrait stored in the vault, where humidity stays near 50 percent, has almost no cracks.",
        },
        {
          id: "s5",
          role: "evidence",
          supports: ["s1"],
          text: "However, the light meter reads within the safe range, and the floor sensor recorded no unusual vibration.",
        },
        {
          id: "s6",
          role: "detail",
          text: "The painting shows a sailor in a blue coat who is holding a brass telescope.",
        },
        {
          id: "s7",
          role: "background",
          text: "The museum acquired the portrait in 1962.",
        },
        {
          id: "s8",
          role: "claim",
          text: "Visitors should not be allowed to enter Gallery 3.",
        },
        {
          id: "s9",
          role: "conclusion",
          text: "Therefore, a humidifier that keeps the air steady should slow the cracking.",
        },
      ],
      claimOptions: ["s1", "s8"],
      challenge: {
        type: "evidence",
        claim: "s1",
        valid: ["s2", "s3", "s4", "s5"],
        minValid: 3,
        weak: ["s6", "s7", "s9"],
        explainFrame:
          "This evidence supports the claim because ___, which rules in or rules out ___.",
        explainTerms: ["because", "rules out", "rules in", "so", "shows"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "claim",
              text: "Clothes moth larvae, not dust or light, are the main cause of the small holes in the tapestry.",
            },
            {
              id: "t2",
              role: "evidence",
              text: "Conservators found tiny silk cases and droppings on the back of the tapestry, both signs of moth larvae.",
            },
            {
              id: "t3",
              role: "evidence",
              text: "The holes appear only in the wool sections, and moth larvae feed on wool far more than on cotton.",
            },
            {
              id: "t4",
              role: "evidence",
              text: "A sticky trap behind the tapestry caught nine adult moths in one month.",
            },
            {
              id: "t5",
              role: "detail",
              text: "The tapestry shows a hunting scene with several hounds.",
            },
            {
              id: "t6",
              role: "background",
              text: "It hung in a castle hall for two centuries.",
            },
          ],
          claim: "t1",
          valid: ["t2", "t3", "t4"],
          minValid: 2,
          weak: ["t5", "t6"],
        },
      },
      refs: [
        { sentence: "s3", phrase: "it", means: "the canvas" },
        {
          sentence: "s4",
          phrase: "matching portrait",
          means: "the second portrait by the same painter",
        },
      ],
      layers: {
        meaning: [
          {
            s: "s1",
            phrase: "Repeated swings in humidity",
            label: "the explanation the report proposes",
          },
          {
            s: "s2",
            phrase: "between 30 and 70 percent every week",
            label: "evidence: measured data",
          },
        ],
        discourse: [
          { s: "s5", phrase: "However", label: "turns to rule out other causes" },
          {
            s: "s9",
            phrase: "Therefore",
            label: "signals the recommendation that follows from the evidence",
          },
        ],
        sentence: [
          {
            s: "s3",
            phrase: "but old oil paint is stiff and cannot stretch to follow it",
            label: "contrast clause: two materials behave differently",
          },
        ],
        word: [
          {
            s: "s1",
            phrase: "vibration",
            label: "science word",
            def: "fast back-and-forth shaking",
          },
          {
            s: "s2",
            phrase: "relative humidity",
            label: "science term",
            def: "how much water vapor the air holds compared with the most it could hold",
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
      base: "The paint cracked.",
      needs: [
        {
          id: "how",
          label: "Say where or how it cracked",
          test: {
            terms: [
              "fine",
              "web",
              "thick",
              "thickest",
              "lengthen",
              "branch",
              "branched",
              "across",
              "surface",
              "lower",
            ],
          },
        },
        { id: "why", label: "Give a cause with a cause word", test: { connectorJob: "cause" } },
        {
          id: "factor",
          label: "Name a specific factor",
          test: {
            terms: [
              "humidity",
              "moisture",
              "canvas",
              "swells",
              "shrinks",
              "air",
              "heating",
              "stiff",
              "light",
              "vibration",
            ],
          },
        },
        {
          id: "support",
          label: "Back it up with evidence",
          test: {
            terms: [
              "log",
              "reading",
              "readings",
              "measured",
              "shows",
              "show",
              "percent",
              "vault",
              "according",
              "data",
              "evidence",
            ],
          },
        },
      ],
      altConnectors: [
        {
          word: "because",
          note: "Because gives the reason after the result: The paint cracked because the canvas kept swelling and shrinking.",
        },
        {
          word: "as a result",
          note: "As a result begins a sentence with the effect: The humidity kept swinging. As a result, the paint cracked.",
        },
        {
          word: "which suggests",
          note: "Which suggests adds an inference to evidence: The log shows weekly swings, which suggests the humidity is the cause.",
        },
      ],
      transfer: {
        base: "The poster faded.",
        needs: [
          { id: "why", label: "Give a cause with a cause word", test: { connectorJob: "cause" } },
          {
            id: "factor",
            label: "Name a specific factor",
            test: {
              terms: ["sun", "sunlight", "light", "window", "ultraviolet", "dye", "ink", "bright"],
            },
          },
          {
            id: "support",
            label: "Back it up with evidence",
            test: {
              terms: [
                "shows",
                "show",
                "measured",
                "reading",
                "compared",
                "according",
                "data",
                "evidence",
                "shaded",
                "window side",
              ],
            },
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
          before: "The light meter reads within the safe range,",
          after: "light is unlikely to be the cause.",
          relation: "cause",
          options: ["so", "but", "although", "before"],
          ok: ["so"],
        },
        {
          before: "At first I suspected vibration,",
          after: "the floor sensor recorded nothing unusual.",
          relation: "contrast",
          options: ["but", "so", "because", "then"],
          ok: ["but"],
        },
        {
          before: "The gallery humidity swings every week,",
          after: "the vault stays steady.",
          relation: "contrast",
          options: ["whereas", "because", "so", "until"],
          ok: ["whereas"],
        },
        {
          before: "I revised my explanation",
          after: "the new clue did not fit my first idea.",
          relation: "cause",
          options: ["because", "so", "but", "although"],
          ok: ["because"],
        },
      ],
      notes: {
        so: "So shows the result of the evidence.",
        but: "But marks the point where the evidence turns against an idea.",
        whereas: "Whereas compares two things side by side.",
        because: "Because gives the reason for the change of mind.",
      },
      transfer: {
        gaps: [
          {
            before: "The poster faded most near the window,",
            after: "light is probably the cause.",
            relation: "cause",
            options: ["so", "but", "although", "before"],
            ok: ["so"],
          },
          {
            before: "The ink on the shaded side is still dark,",
            after: "the ink on the window side is pale.",
            relation: "contrast",
            options: ["whereas", "but", "because", "so"],
            ok: ["whereas", "but"],
          },
        ],
      },
    },
  ],
  communicate: {
    kind: "converse",
    mode: "speak",
    prompt:
      "Explain to Dr. Okafor what is cracking the portrait and which evidence supports your explanation. If she gives you a new clue, say whether it changes your thinking and why.",
    partner: {
      name: "Dr. Okafor",
      glyph: "👩🏿‍🔬",
      role: ["Museum conservator", "Conservadora del museo"],
      opening:
        "The director meets with me on Friday. Give me your explanation for the new cracks, in your own words, and tell me what supports it.",
    },
    topicTerms: [
      "portrait",
      "cracks",
      "humidity",
      "canvas",
      "paint",
      "light",
      "vibration",
      "vault",
      "swings",
      "evidence",
    ],
    sourceTerms: ["30", "70", "vault", "50 lux", "floor sensor", "matching portrait"],
    evidenceBank: [
      "Gallery 3 humidity swings between 30 and 70 percent each week; the vault stays near 50 percent.",
      "The light meter reads 50 lux, within the museum's safe range.",
      "The floor sensor shows no unusual vibration, and the construction ended in August.",
      "A matching portrait in the vault has almost no cracks.",
      "The cracks are in the thickest paint.",
    ],
    lines: [
      {
        id: "humidity",
        terms: [
          "humidity",
          "humid",
          "moisture",
          "damp",
          "air",
          "swing",
          "swings",
          "fluctuate",
          "canvas",
          "heating",
        ],
        evidenceTerms: ["30", "70", "vault", "50", "october", "log"],
        ack: "So you think swings in humidity are the cause. A new clue just arrived: the frame's backing board was replaced in October, the same month the heating changed, and the vault portrait's backing was replaced then too. Does this clue change or strengthen your explanation, and why?",
        probe: "Which numbers support the humidity idea, and how does the new clue fit?",
        close: "Numbers from two rooms and how the new clue is weighed",
      },
      {
        id: "light",
        terms: ["light", "lux", "sun", "window", "fade", "fading", "bright", "ultraviolet"],
        evidenceTerms: ["50", "lux", "filter", "safe", "meter"],
        ack: "So you think light is the cause. A new clue just arrived: a conservator checked under the frame's lip, where light never reaches, and the cracks are just as dense there. Does this clue change your explanation, and why?",
        probe: "What does the light meter say, and how does that compare with your idea?",
        close: "The reading and how the new clue is weighed",
      },
      {
        id: "vibration",
        terms: ["vibration", "vibrate", "shake", "shaking", "floor", "noise", "construction"],
        evidenceTerms: ["sensor", "august", "unusual", "ended"],
        ack: "So you think vibration is the cause. A new clue just arrived: the cracks were first photographed in November, the month after the heating upgrade, and not during the construction. Does this clue change your explanation, and why?",
        probe:
          "What did the floor sensor record, and what does the timeline of the cracks suggest?",
        close: "The reading and a date compared with the cracks",
      },
      {
        id: "age",
        terms: ["age", "old", "years", "materials", "paint", "oil", "painter", "wood", "frame"],
        evidenceTerms: ["vault", "1990", "matching", "same painter", "almost no cracks"],
        ack: "So you think the painting's age or materials are the cause. A new clue just arrived: a scan shows both portraits have the same canvas, the same paint recipe and the same age. Does this clue change your explanation, and why?",
        probe: "How does the matching portrait compare with this one, and what does that tell you?",
        close: "A comparison between the two portraits",
      },
    ],
    followUps: {
      phenomenon: "Begin by stating precisely what has changed in the painting.",
      cause: "What do you propose is causing it? Link the cause to its effect with a connector.",
      chain:
        "Think about the new clue. Does it change your explanation? Say what you thought at first, what the clue shows, and what you think now.",
      support: "Which measurement or record supports your explanation, and what does it rule out?",
    },
    maxTurns: 4,
    minWords: 40,
  },
  improve: {
    models: {
      phenomenon:
        "New cracks have spread across the thickest paint of the sailor portrait since October.",
      cause:
        "The cracks formed because the canvas swells and shrinks with the humidity while the old paint stays stiff.",
      chain:
        "At first I suspected the light, but because the cracks are just as dense under the frame, where no light reaches, I revised my explanation and now think the humidity swings caused the cracking.",
      support:
        "The humidity log shows swings from 30 to 70 percent each week, while the vault portrait, kept near 50 percent, has almost no cracks.",
    },
    whys: [
      {
        id: "why-revise",
        text: "It shows how the new evidence changed my thinking, so the listener can see the explanation is tested and not just defended.",
        moves: ["chain"],
      },
      {
        id: "why-mechanism",
        text: "It links the cause to its effect, so the explanation shows how the damage happens.",
        moves: ["cause"],
      },
      {
        id: "why-data",
        text: "It cites measurements and a comparison, so the explanation rests on evidence and not opinion.",
        moves: ["support"],
      },
      {
        id: "why-topic",
        text: "It states exactly what changed, so the audience knows what is being explained.",
        moves: ["phenomenon"],
      },
    ],
  },
  show: {
    kind: "converse",
    mode: "speak",
    prompt:
      "New mystery: A bronze statue in the museum garden is covered with a green crust. Clues: the crust is thickest on the head and shoulders, where rain collects; a bronze statue of the same age kept indoors is dark brown with no green crust; where a visitor scratched the crust, shiny orange-brown metal showed underneath; the crust is hard and does not rub off like paint. Explain to Curator Reyes what you think caused the green crust and which clues support your explanation. If she gives you a new clue, say whether it changes your thinking and why.",
    partner: {
      name: "Curator Reyes",
      glyph: "🧑🏽‍🏫",
      role: ["Garden curator", "Curadora del jardín"],
      opening:
        "The garden committee wants an answer. Explain to me what you think turned the statue green, and tell me what supports your explanation.",
    },
    topicTerms: [
      "statue",
      "bronze",
      "green",
      "crust",
      "rain",
      "air",
      "indoors",
      "metal",
      "paint",
      "clue",
    ],
    sourceTerms: [
      "head and shoulders",
      "indoors",
      "dark brown",
      "orange-brown",
      "does not rub off",
    ],
    lines: [
      {
        id: "weather",
        terms: [
          "rain",
          "weather",
          "air",
          "oxygen",
          "moisture",
          "water",
          "outdoors",
          "reaction",
          "reacts",
          "corrode",
          "corrosion",
          "metal",
        ],
        evidenceTerms: [
          "indoors",
          "brown",
          "head and shoulders",
          "orange",
          "scratched",
          "rain collects",
        ],
        ack: "So you think the weather is reacting with the bronze. A new clue just arrived: a copper coin left outdoors for a year also turned green. Does this clue change or strengthen your explanation, and why?",
        probe: "Which clues compare the outdoor statue with the indoor one, and what do they show?",
        close: "A comparison of the outdoor and indoor statues",
      },
      {
        id: "paint",
        terms: ["paint", "painted", "coating", "coat", "dye"],
        evidenceTerms: ["rub", "hard", "scratched", "orange"],
        ack: "So you think someone painted the statue. A new clue just arrived: a chemical test found copper compounds in the crust and no paint pigments. Does this clue change your explanation, and why?",
        probe: "What do the scratch and the rub test show about whether the crust is paint?",
        close: "What the scratch and rub test show about paint",
      },
      {
        id: "dirt",
        terms: ["dirt", "moss", "algae", "growth", "dust", "bird", "birds", "plants"],
        evidenceTerms: ["rub", "hard", "indoors", "scratched"],
        ack: "So you think dirt or growth covers the statue. A new clue just arrived: the crust stays green even after a crew scrubbed the statue with a stiff brush. Does this clue change your explanation, and why?",
        probe: "Which clues tell you whether the green layer sits on the metal or comes from it?",
        close: "Clues about what the green layer is made of",
      },
    ],
    followUps: {
      phenomenon: "Begin by stating precisely what you are trying to explain about the statue.",
      cause:
        "What do you propose caused the green crust? Link the cause to its effect with a connector.",
      chain:
        "Think about the new clue. Does it change your explanation? Say what you thought at first, what the clue shows, and what you think now.",
      support: "Which clue supports your explanation, and what does it rule out?",
    },
    maxTurns: 4,
    minWords: 35,
  },
};

export default {
  id: "m09",
  bands: { "3-5": g35, "6-8": g68 },
};
