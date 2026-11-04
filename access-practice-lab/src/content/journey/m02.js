// Mission 2 — Stories in Motion (Unit 1, Narrate). Environment: library. Reviews m01 (sequence, description, cohesion).
// Grades 3-5: "The Case of the Wavy Book" (follow one library book through its week and retell it in order).
// Grades 6-8: "The Night at Harbor Library" (reconstruct a night of connected events, with transitions and dialogue).
// Title, goal, WIDA and spiral data live in MISSIONS (curriculum.js); family text lives in family.js.
// Task content is English (the language practiced). Hints ask or point; they never state an answer.

// ───────────────────────────── Grades 3-5 ─────────────────────────────
const g35 = {
  environment: "library",
  context: {
    title: ["The Case of the Wavy Book", "El caso del libro ondulado"],
    premise:
      "Sofia returned her library book, The Moon Fox, with wavy pages and a damp cover. Mr. Alvarez, the school librarian, wants the story of the book's week, told in order.",
    cast: [
      {
        id: "alvarez",
        name: "Mr. Alvarez",
        role: ["School librarian", "Bibliotecario escolar"],
        glyph: "👨🏽‍🏫",
      },
      { id: "sofia", name: "Sofia", role: ["Student", "Estudiante"], glyph: "👧🏻" },
      { id: "tariq", name: "Tariq", role: ["Classmate", "Compañero de clase"], glyph: "🧒🏾" },
    ],
  },
  vocab: [
    [
      "retell",
      "to tell a story again in your own words",
      "volver a contar: contar una historia otra vez con tus propias palabras",
    ],
    ["sequence", "the order that events happen in", "secuencia: el orden en que pasan los sucesos"],
    [
      "borrow",
      "to take something and bring it back later",
      "pedir prestado: tomar algo y devolverlo después",
    ],
    ["return", "to bring something back", "devolver: traer algo de regreso"],
    ["damp", "a little bit wet", "húmedo: un poco mojado"],
    ["soak", "to make something very wet", "empapar: mojar algo por completo"],
    ["chapter", "one part of a book", "capítulo: una parte de un libro"],
    ["meanwhile", "at the same time", "mientras tanto: al mismo tiempo"],
  ],
  frames: {
    A: [
      "On Monday, ___. After that, ___.",
      "First, ___. Then, ___. After that, ___. At last, ___.",
      "Before ___, ___. After ___, ___.",
      "Meanwhile, ___.",
    ],
    B: ["First, ___. Then, ___.", "At last, ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "Why are the pages of The Moon Fox wavy, and what happened to the book this week? Look at the clues, then tell Mr. Alvarez what happened in order.",
    objects: [
      {
        id: "book",
        label: "The Moon Fox",
        glyph: "📕",
        x: 20,
        y: 30,
        relevant: true,
        note: "The cover of The Moon Fox is damp, and the pages are wavy. A bookmark is stuck in the middle of chapter three.",
      },
      {
        id: "slip",
        label: "Checkout slip",
        glyph: "🧾",
        x: 46,
        y: 18,
        relevant: true,
        note: "Checkout slip: borrowed on Monday, due on Friday. Sofia's name is at the top.",
      },
      {
        id: "bag",
        label: "Sofia's backpack",
        glyph: "🎒",
        x: 78,
        y: 36,
        relevant: true,
        note: "Sofia's backpack hangs by the door. The zipper is open, and the bottom is wet.",
      },
      {
        id: "puddle",
        label: "Puddle by the door",
        glyph: "💧",
        x: 62,
        y: 78,
        relevant: true,
        note: "A puddle sits by the front door. The weather chart says it rained on Wednesday.",
      },
      {
        id: "radiator",
        label: "Warm radiator",
        glyph: "🔥",
        x: 30,
        y: 74,
        relevant: true,
        note: "A pile of paper towels sits on the radiator. Some towels are still warm and a little bit wrinkled.",
      },
      {
        id: "chart",
        label: "Star chart",
        glyph: "⭐",
        x: 90,
        y: 84,
        relevant: false,
        note: "The reading star chart shows which class read the most books this month.",
      },
    ],
    controls: [
      {
        id: "zipper",
        label: "Backpack zipper",
        initial: "open",
        options: [
          { id: "open", label: "Open" },
          { id: "closed", label: "Zipped" },
        ],
      },
      {
        id: "weather",
        label: "Wednesday weather",
        initial: "rain",
        options: [
          { id: "rain", label: "Rain" },
          { id: "sun", label: "Sun" },
        ],
      },
    ],
    outcomes: [
      {
        when: { zipper: "closed", weather: "sun" },
        mood: "good",
        key: "flat",
        state: "The book stays dry and flat. Every page is easy to read.",
      },
      {
        when: { zipper: "open", weather: "sun" },
        mood: "warn",
        key: "crumpled",
        state: "The book stays dry, but a few pages get bent in the open bag.",
      },
      {
        when: { zipper: "closed", weather: "rain" },
        mood: "warn",
        key: "outside",
        state: "The outside of the backpack gets damp, but the book inside stays dry.",
      },
      {
        when: { zipper: "open", weather: "rain" },
        mood: "bad",
        key: "wavy",
        state: "Rain soaks the book. After it dries, the pages are wavy.",
      },
    ],
    collect: 3,
    variables: [
      {
        id: "rain",
        label: "the rain",
        terms: ["rain", "rained", "raining", "wet", "puddle", "soaked", "water", "storm"],
        evidenceTerms: ["wednesday", "puddle", "wet", "damp", "chart"],
        probe:
          "You think the rain is part of the story. What clue near the door or on the chart fits your idea?",
        good: "A clue from the door, the chart, or the bag",
      },
      {
        id: "bag",
        label: "the open backpack",
        terms: ["backpack", "bag", "zipper", "zipped", "open"],
        evidenceTerms: ["zipper", "open", "bottom", "wet"],
        probe:
          "You are thinking about the backpack. What did you notice about it, and what did that let happen?",
        good: "A detail about the zipper or the bottom of the bag",
      },
      {
        id: "drying",
        label: "drying the pages",
        terms: ["radiator", "dried", "drying", "dry", "warm", "towels", "heat"],
        evidenceTerms: ["towels", "radiator", "warm", "wavy", "wrinkled"],
        probe:
          "You think the book was dried somehow. What clue shows how, and when did that happen?",
        good: "A clue from the radiator or the pages",
      },
    ],
    partner: {
      name: "Mr. Alvarez",
      glyph: "👨🏽‍🏫",
      opening:
        "Sofia's book came back wavy and damp. I need to know the story of its week. What do you think happened?",
      noCause:
        "I can see the clues you named. Now tell me what happened first and what came after.",
      noEvidence: "Which clue from the library or the backpack makes you think so?",
      thanks: "Thank you. Now I can write the story on the book's return card.",
    },
    respond: {
      prompt:
        "Tell Mr. Alvarez what happened to The Moon Fox this week. Tell it in order, and use time words and a clue.",
      minWords: 16,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "arrange",
      title: "Sofia tells about her week with the book",
      script: [
        { id: "u1", text: "Let me tell you what happened to my library book." },
        { id: "u2", text: "On Monday, I borrowed a book about a moon fox.", signal: "On Monday" },
        {
          id: "u3",
          text: "On Tuesday, I read three chapters in bed after dinner.",
          signal: "On Tuesday",
        },
        {
          id: "u4",
          text: "On Wednesday, the rain soaked my backpack because the zipper was open.",
          signal: "On Wednesday",
        },
        {
          id: "u5",
          text: "On Thursday, I dried the pages on a warm radiator.",
          signal: "On Thursday",
        },
        {
          id: "u6",
          text: "Finally, on Friday, I said sorry and gave the book back.",
          signal: "Finally",
        },
      ],
      items: [
        { id: "borrow", label: "Borrowed the book", glyph: "📕" },
        { id: "read", label: "Read three chapters", glyph: "🌙" },
        { id: "rain", label: "Rain soaked the backpack", glyph: "🌧️" },
        { id: "dry", label: "Dried the pages on the radiator", glyph: "🔥" },
        { id: "back", label: "Said sorry and gave it back", glyph: "🙂" },
      ],
      targets: [
        { id: "e1", label: "Event 1" },
        { id: "e2", label: "Event 2" },
        { id: "e3", label: "Event 3" },
        { id: "e4", label: "Event 4" },
        { id: "e5", label: "Event 5" },
      ],
      expect: [
        { item: "borrow", target: "e1", utterance: "u2" },
        { item: "read", target: "e2", utterance: "u3" },
        { item: "rain", target: "e3", utterance: "u4" },
        { item: "dry", target: "e4", utterance: "u5" },
        { item: "back", target: "e5", utterance: "u6" },
      ],
      visuals: {
        u2: "A calendar with Monday circled beside a library book",
        u3: "A bed, a lamp, and a book open to chapter three",
        u4: "Rain falling on an open backpack",
        u5: "A book lying open on a warm radiator",
        u6: "A smiling student handing a book across a desk",
      },
      xray: {
        keywords: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        sequence: ["On Monday", "On Tuesday", "On Wednesday", "On Thursday", "Finally"],
        cause: ["because"],
        referents: [{ phrase: "my library book", means: "The Moon Fox" }],
      },
      final: {
        mode: "follow",
        title: "Mr. Alvarez tells how to find a book",
        script: [
          { id: "f1", text: "Here is how to find The Moon Fox on your own." },
          {
            id: "f2",
            text: "First, walk to the red rug in the middle of the library.",
            signal: "First",
          },
          { id: "f3", text: "Then turn left at the big globe.", signal: "Then" },
          { id: "f4", text: "Next, walk past the fish tank.", signal: "Next" },
          { id: "f5", text: "Last, look on the second shelf under the window.", signal: "Last" },
        ],
        items: [
          { id: "rug", label: "Red rug", glyph: "🟥" },
          { id: "globe", label: "Big globe", glyph: "🌍" },
          { id: "tank", label: "Fish tank", glyph: "🐟" },
          { id: "shelf", label: "Second shelf", glyph: "📚" },
        ],
        targets: [
          { id: "s1", label: "Stop 1" },
          { id: "s2", label: "Stop 2" },
          { id: "s3", label: "Stop 3" },
          { id: "s4", label: "Stop 4" },
        ],
        expect: [
          { item: "rug", target: "s1", utterance: "f2" },
          { item: "globe", target: "s2", utterance: "f3" },
          { item: "tank", target: "s3", utterance: "f4" },
          { item: "shelf", target: "s4", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Story Hour in the Dark",
      passage: [
        { id: "s1", role: "claim", text: "A storm caused a chain of events at story hour." },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "A storm knocked out the power, so the whole library went dark.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "Because Mr. Alvarez keeps flashlights in his desk, he could give one to every child.",
        },
        {
          id: "s4",
          role: "detail",
          text: "The library has a big red rug and a tank full of goldfish.",
        },
        {
          id: "s5",
          role: "evidence",
          supports: ["s1"],
          text: "With the flashlights on, the children could still see the pictures in the book.",
        },
        {
          id: "s6",
          role: "detail",
          text: "Tariq's favorite book is about a whale that learns to sing.",
        },
        {
          id: "s7",
          role: "conclusion",
          supports: ["s1"],
          text: "As a result, story hour went on, and the children said it was the best one ever.",
        },
        { id: "s8", role: "claim", text: "Flashlights are the best tool for reading." },
      ],
      claimOptions: ["s1", "s8"],
      challenge: {
        type: "cause-effect",
        claim: "s1",
        valid: ["s2", "s3", "s5", "s7"],
        minValid: 3,
        weak: ["s4", "s6"],
        explainFrame: "___ caused ___, and as a result ___.",
        explainTerms: ["because", "so", "as a result", "caused"],
        transfer: {
          passage: [
            { id: "t1", role: "claim", text: "The rain changed Friday's recess in three ways." },
            {
              id: "t2",
              role: "evidence",
              supports: ["t1"],
              text: "Heavy rain started at lunch, so the teachers moved recess inside.",
            },
            {
              id: "t3",
              role: "evidence",
              supports: ["t1"],
              text: "Because the gym was busy, Tariq's class played in the library.",
            },
            { id: "t4", role: "detail", text: "The art room has a wall of colorful paintings." },
            {
              id: "t5",
              role: "conclusion",
              supports: ["t1"],
              text: "As a result, the children read comics and built card towers.",
            },
            { id: "t6", role: "background", text: "Friday is also pizza day." },
          ],
          claim: "t1",
          valid: ["t2", "t3", "t5"],
          minValid: 2,
          weak: ["t4", "t6"],
        },
      },
      refs: [
        { sentence: "s3", phrase: "he", means: "Mr. Alvarez" },
        { sentence: "s3", phrase: "one", means: "a flashlight" },
        { sentence: "s7", phrase: "one", means: "story hour" },
      ],
      layers: {
        meaning: [
          { s: "s1", phrase: "a chain of events", label: "the cause-and-effect story to follow" },
        ],
        discourse: [
          { s: "s2", phrase: "so", label: "links a cause to its result" },
          { s: "s3", phrase: "Because", label: "gives the reason first" },
          { s: "s7", phrase: "As a result", label: "shows what the chain led to" },
        ],
        sentence: [
          {
            s: "s3",
            phrase: "Because Mr. Alvarez keeps flashlights in his desk",
            label: "reason clause at the start of the sentence",
          },
        ],
        word: [
          { s: "s2", phrase: "knocked out", label: "phrasal verb", def: "stopped working" },
          {
            s: "s2",
            phrase: "power",
            label: "science word",
            def: "the electricity that makes lights work",
          },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "morphology",
      title: "Take words apart",
      words: [
        {
          word: "retell",
          parts: [
            { t: "re", type: "prefix", meaning: "again" },
            { t: "tell", type: "root", meaning: "say or share a story" },
          ],
          ask: "What does re- add to tell?",
        },
        {
          word: "unlocked",
          parts: [
            { t: "un", type: "prefix", meaning: "the opposite of" },
            { t: "lock", type: "root", meaning: "close with a key" },
            { t: "ed", type: "suffix", meaning: "it already happened" },
          ],
          ask: "Which part tells you the action is finished?",
        },
        {
          word: "slowly",
          parts: [
            { t: "slow", type: "root", meaning: "not fast" },
            { t: "ly", type: "suffix", meaning: "in this way" },
          ],
          ask: "How does -ly change the word slow?",
        },
        {
          word: "reader",
          parts: [
            { t: "read", type: "root", meaning: "look at words and understand them" },
            { t: "er", type: "suffix", meaning: "a person who does it" },
          ],
          ask: "What does -er tell you about the person?",
        },
      ],
      transfer: {
        words: [
          {
            word: "replay",
            parts: [
              { t: "re", type: "prefix", meaning: "again" },
              { t: "play", type: "root", meaning: "take part in a game or music" },
            ],
            ask: "What does re- tell you about how many times?",
          },
          {
            word: "quickly",
            parts: [
              { t: "quick", type: "root", meaning: "fast" },
              { t: "ly", type: "suffix", meaning: "in this way" },
            ],
            ask: "What kind of word does -ly help make?",
          },
          {
            word: "unfolded",
            parts: [
              { t: "un", type: "prefix", meaning: "the opposite of" },
              { t: "fold", type: "root", meaning: "bend over on itself" },
              { t: "ed", type: "suffix", meaning: "it already happened" },
            ],
            ask: "Which part shows the opposite action?",
          },
        ],
      },
    },
    {
      kind: "build",
      module: "discourse",
      title: "Put the story in order",
      units: [
        { id: "d1", role: "orient", text: "Tariq packed his backpack for the library trip." },
        { id: "d2", role: "event", text: "He walked to the library with his class." },
        { id: "d3", role: "event", text: "He chose a book about whales and checked it out." },
        { id: "d4", role: "ending", text: "He sat in a cozy corner and read the first page." },
      ],
      order: ["d1", "d2", "d3", "d4"],
      connectors: [
        { before: "d2", word: "Then" },
        { before: "d3", word: "Next" },
        { before: "d4", word: "Finally" },
      ],
      transfer: {
        units: [
          { id: "t1", role: "orient", text: "Sofia woke up and put on her rain boots." },
          { id: "t2", role: "event", text: "She ate breakfast and packed her lunch." },
          { id: "t3", role: "event", text: "She walked to school under a big yellow umbrella." },
          { id: "t4", role: "ending", text: "She hung her wet coat on the hook and sat down." },
        ],
        order: ["t1", "t2", "t3", "t4"],
        connectors: [
          { before: "t2", word: "Then" },
          { before: "t3", word: "After that" },
          { before: "t4", word: "At last" },
        ],
      },
    },
  ],
  communicate: {
    kind: "compose",
    mode: "write",
    prompt:
      "Write the story of The Moon Fox's week for the library bulletin board. Tell what happened from Monday to Friday, in order. Use time words to link each event to the next, and tell how the story ended.",
    audience: [
      "Mr. Alvarez and the readers of the library bulletin board",
      "El Sr. Alvarez y los lectores del tablero de anuncios de la biblioteca",
    ],
    genre: "narrative",
    topicTerms: ["Moon Fox", "book", "Monday", "backpack", "rain", "radiator", "Friday"],
    sourceTerms: ["Monday", "backpack", "rain", "radiator", "Friday", "sorry"],
    evidenceBank: [
      { id: "f1", text: "Sofia borrowed The Moon Fox on Monday.", kind: "fact" },
      { id: "f2", text: "She read three chapters on Tuesday after dinner.", kind: "fact" },
      {
        id: "f3",
        text: "On Wednesday, rain soaked her backpack because the zipper was open.",
        kind: "fact",
      },
      { id: "f4", text: "On Thursday, she dried the pages on a warm radiator.", kind: "fact" },
      { id: "f5", text: "On Friday, she said sorry and gave the book back.", kind: "fact" },
    ],
    organizer: ["setting", "events", "ending"],
    readerQuestions: {
      orient: "Whose book is this, and when does the story start?",
      sequence: "Which time words show the order of the days?",
      events: "What did Sofia do each day? Tell me the actions.",
      response: "How did the week end, and how did people feel?",
    },
    minWords: 35,
  },
  improve: {
    models: {
      orient: "On Monday, Sofia borrowed The Moon Fox from the school library.",
      sequence:
        "First Sofia read three chapters, then the rain soaked her backpack, and after that she dried the pages.",
      events:
        "Sofia borrowed the book, read three chapters, and dried the wet pages on a warm radiator.",
      response:
        "At last, on Friday, Sofia said sorry and gave the book back, and Mr. Alvarez smiled.",
    },
    whys: [
      {
        id: "why-days",
        text: "Time words show the order of the days, so my reader can follow the week.",
        moves: ["sequence"],
      },
      {
        id: "why-actions",
        text: "Action words tell what happened, so my reader can picture each moment.",
        moves: ["events", "orient"],
      },
      {
        id: "why-ending",
        text: "An ending tells how the story finished, so my reader knows it is complete.",
        moves: ["response"],
      },
    ],
  },
  show: {
    kind: "converse",
    mode: "speak",
    prompt:
      "New situation: On Tuesday, Kenji's class took a bus to the zoo. The class saw the penguins first. Then it started to rain, so they ate lunch under a big tent. Last, they watched the sea lions and rode the bus home, tired and happy. Tell your partner what happened on the trip, in order.",
    partner: {
      name: "Luis",
      glyph: "🧒🏽",
      role: ["Classmate", "Compañero de clase"],
      opening:
        "I was absent on Tuesday. Can you tell me about the class trip to the zoo? Start from the beginning.",
    },
    topicTerms: ["zoo", "bus", "penguins", "rain", "tent", "lunch", "sea lions"],
    sourceTerms: ["penguins", "rain", "tent", "sea lions", "bus"],
    lines: [
      {
        id: "penguins",
        terms: ["penguins", "penguin", "first", "zoo", "bus"],
        evidenceTerms: ["first", "penguins"],
        ack: "So your story starts with the penguins.",
        probe: "What happened right before the penguins, and what did the class do there?",
        close: "How the trip began",
      },
      {
        id: "rain",
        terms: ["rain", "rained", "tent", "lunch", "wet"],
        evidenceTerms: ["tent", "lunch", "rain"],
        ack: "So your story has a rainy part.",
        probe: "What changed when the rain started, and what did the class do about it?",
        close: "What changed because of the rain",
      },
      {
        id: "ending",
        terms: ["sea lions", "sea lion", "home", "tired", "happy", "last"],
        evidenceTerms: ["sea lions", "home", "tired", "happy"],
        ack: "So your story builds toward the end of the day.",
        probe: "What did the class do last, and how did everyone feel?",
        close: "The last event and how people felt",
      },
    ],
    followUps: {
      orient: "Where did the class go, and when did the trip happen?",
      sequence: "Which time word shows what happened first? What happened after that?",
      events: "What did the class actually do? Use action words about the past.",
      response: "How did the trip end? How did everyone feel?",
    },
    maxTurns: 3,
    minWords: 20,
  },
};

// ───────────────────────────── Grades 6-8 ─────────────────────────────
const g68 = {
  environment: "library",
  context: {
    title: ["The Night at Harbor Library", "La noche en la biblioteca Harbor"],
    premise:
      "Harbor Library opened on Monday to find water on the floor of the reference room and a handwritten note taped to the desk. Head librarian Ms. Reyes asks the student archive team to reconstruct the night, step by step, for the library newsletter.",
    cast: [
      {
        id: "reyes",
        name: "Ms. Reyes",
        role: ["Head librarian", "Bibliotecaria jefa"],
        glyph: "👩🏼‍💼",
      },
      {
        id: "omar",
        name: "Omar",
        role: ["Archive team member", "Miembro del equipo de archivo"],
        glyph: "🧑🏽‍💻",
      },
      { id: "dube", name: "Mr. Dube", role: ["Night custodian", "Conserje nocturno"], glyph: "👨🏿‍🔧" },
    ],
  },
  vocab: [
    [
      "reconstruct",
      "to rebuild an account of events from the clues left behind",
      "reconstruir: volver a armar el relato de unos hechos a partir de las pistas",
    ],
    [
      "timeline",
      "a list of events in the order they happened",
      "línea de tiempo: una lista de sucesos en el orden en que ocurrieron",
    ],
    [
      "transition",
      "a word or phrase that links one event or idea to the next",
      "transición: una palabra o frase que une un suceso o una idea con el siguiente",
    ],
    [
      "consequence",
      "something that happens because of an earlier event",
      "consecuencia: algo que ocurre a causa de un suceso anterior",
    ],
    [
      "dialogue",
      "the words that characters say to each other",
      "diálogo: las palabras que se dicen los personajes",
    ],
    [
      "clogged",
      "blocked so that nothing can flow through",
      "obstruido: bloqueado de modo que nada pasa",
    ],
    [
      "restore",
      "to bring something back to its good condition",
      "restaurar: devolver algo a su buen estado",
    ],
    [
      "archive",
      "a place that keeps important records and documents",
      "archivo: un lugar que guarda registros y documentos importantes",
    ],
  ],
  frames: {
    A: [
      "First, ___. As a result, ___.",
      "At ___, ___. Meanwhile, ___.",
      "“___,” said ___. After that, ___.",
      "By the end of the night, ___.",
    ],
    B: ["First, ___. As a result, ___.", "“___,” said ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "How did water end up on the floor of the reference room, and how did the night unfold after that? Examine the evidence, then reconstruct the night in order.",
    objects: [
      {
        id: "log",
        label: "Alarm log",
        glyph: "📟",
        x: 16,
        y: 24,
        relevant: true,
        note: "Alarm log: 11:40 p.m., rain begins. 12:15 a.m., water sensor alarm in the reference room. 12:40 a.m., night custodian arrives. 1:20 a.m., drain cleared.",
      },
      {
        id: "drain",
        label: "Roof drain photo",
        glyph: "📷",
        x: 52,
        y: 20,
        relevant: true,
        note: "Photo of the roof drain: it is packed with wet leaves and a plastic bag. Rainwater several inches deep covers that corner of the roof.",
      },
      {
        id: "ceiling",
        label: "Ceiling tile",
        glyph: "💧",
        x: 80,
        y: 40,
        relevant: true,
        note: "The ceiling tile above the reference room is stained brown and sagging. A steady drip falls onto shelf 3.",
      },
      {
        id: "note",
        label: "Handwritten note",
        glyph: "📝",
        x: 36,
        y: 62,
        relevant: true,
        note: "Note taped to the desk: “Alarm went off at quarter past midnight. Cleared the drain on the roof, then moved the oldest maps upstairs and the atlases to dry shelves. — R. Dube”",
      },
      {
        id: "shelf",
        label: "Shelf 3",
        glyph: "📚",
        x: 66,
        y: 78,
        relevant: true,
        note: "Shelf 3: six atlases are soaked. The cabinet above is empty because the rare maps were moved upstairs, where they stayed dry.",
      },
      {
        id: "flyer",
        label: "Poetry night flyer",
        glyph: "🎟️",
        x: 90,
        y: 88,
        relevant: false,
        note: "Flyer: Harbor Library's poetry night is next Friday at 7 p.m. in the reading room.",
      },
    ],
    controls: [
      {
        id: "drain",
        label: "Roof drain",
        initial: "clogged",
        options: [
          { id: "clear", label: "Clear" },
          { id: "clogged", label: "Clogged with leaves" },
        ],
      },
      {
        id: "custodian",
        label: "Night custodian",
        initial: "quick",
        options: [
          { id: "quick", label: "Arrives within 30 minutes" },
          { id: "slow", label: "Arrives after two hours" },
        ],
      },
    ],
    outcomes: [
      {
        when: { drain: "clear", custodian: "quick" },
        mood: "good",
        key: "dry",
        state:
          "The rain runs off the roof. The reference room stays dry, and nobody needs to hurry.",
      },
      {
        when: { drain: "clear", custodian: "slow" },
        mood: "good",
        key: "dryslow",
        state:
          "The rain runs off the roof, so the late arrival makes no difference. The room is dry.",
      },
      {
        when: { drain: "clogged", custodian: "quick" },
        mood: "warn",
        key: "contained",
        state:
          "Water leaks through the ceiling, but the custodian moves the rare maps in time. Six atlases are soaked.",
      },
      {
        when: { drain: "clogged", custodian: "slow" },
        mood: "bad",
        key: "flooded",
        state:
          "Water drips onto the shelves for two hours. The rare maps and dozens of books are ruined.",
      },
    ],
    collect: 4,
    variables: [
      {
        id: "drain",
        label: "the clogged roof drain",
        terms: ["drain", "clogged", "blocked", "roof", "leaves", "bag", "rain", "leak", "ceiling"],
        evidenceTerms: ["leaves", "plastic bag", "sagging", "stained", "several inches"],
        probe:
          "You begin on the roof. What was blocking the drain, and what did that make the rainwater do?",
        good: "What blocked the drain and what the water did next",
      },
      {
        id: "response",
        label: "the custodian's response",
        terms: [
          "custodian",
          "dube",
          "moved",
          "roof",
          "drain",
          "acted",
          "response",
          "quickly",
          "atlases",
          "maps",
        ],
        evidenceTerms: ["12:40", "1:20", "atlases", "rare maps", "drain cleared", "note"],
        probe:
          "You are following Mr. Dube. What times in the log and what lines in his note show his steps?",
        good: "A time from the log and a step from the note",
      },
      {
        id: "alarm",
        label: "the water sensor alarm",
        terms: ["alarm", "sensor", "night", "timeline", "log", "midnight"],
        evidenceTerms: ["12:15", "11:40", "sensor", "log"],
        probe:
          "You start with the alarm. What does the log say came before it, and what came after?",
        good: "An earlier time and a later time from the log",
      },
    ],
    partner: {
      name: "Ms. Reyes",
      glyph: "👩🏼‍💼",
      opening:
        "Thank you for helping. Before the newsletter goes out, I want the night told clearly. What do you think happened, and what led to what?",
      noCause:
        "You have named clues. Now connect them: what happened first, and how did that lead to the next event?",
      noEvidence: "Which entry in the log, the note or the photo supports the order you describe?",
      thanks: "Thank you. That timeline will help us write the story accurately.",
    },
    respond: {
      prompt:
        "Tell Ms. Reyes how the night unfolded at Harbor Library, from the first rain to the morning. Use evidence from the log, the note or the photo, and transitions that show how events led to each other.",
      minWords: 28,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "follow",
      title: "Mr. Dube walks you through his route",
      script: [
        { id: "u1", text: "I'll walk you through where I went that night, in the order I went." },
        {
          id: "u2",
          text: "First, I came through the back door and checked the alarm panel in the hallway.",
          signal: "First",
        },
        {
          id: "u3",
          text: "Before I reached the reference room, I climbed to the roof hatch to look for the source of the leak.",
          signal: "Before",
        },
        {
          id: "u4",
          text: "Once the drain was clear, I went down to the reference room and started moving books.",
          signal: "Once",
        },
        {
          id: "u5",
          text: "While I carried the rare maps, I climbed to the second-floor archive and locked them in the safe.",
          signal: "While",
        },
        {
          id: "u6",
          text: "After that, I came back down and wrote a note at the front desk.",
          signal: "After that",
        },
      ],
      items: [
        { id: "panel", label: "Alarm panel in the hallway", glyph: "🚨" },
        { id: "hatch", label: "Roof hatch", glyph: "🔧" },
        { id: "ref", label: "Reference room", glyph: "📚" },
        { id: "archive", label: "Second-floor archive", glyph: "🗄️" },
        { id: "desk", label: "Front desk", glyph: "📝" },
      ],
      targets: [
        { id: "p1", label: "Stop 1" },
        { id: "p2", label: "Stop 2" },
        { id: "p3", label: "Stop 3" },
        { id: "p4", label: "Stop 4" },
        { id: "p5", label: "Stop 5" },
      ],
      expect: [
        { item: "panel", target: "p1", utterance: "u2" },
        { item: "hatch", target: "p2", utterance: "u3" },
        { item: "ref", target: "p3", utterance: "u4" },
        { item: "archive", target: "p4", utterance: "u5" },
        { item: "desk", target: "p5", utterance: "u6" },
      ],
      visuals: {
        u2: "A hallway with a blinking alarm panel by the back door",
        u3: "A ladder leading up to a hatch in the roof",
        u4: "Shelves of books in a room with a wet floor",
        u5: "A staircase going up to a locked cabinet",
        u6: "A desk with a pen and a sheet of paper",
      },
      xray: {
        keywords: ["First", "Before", "Once", "While", "After that"],
        sequence: ["First", "Before", "Once", "While", "After that"],
        cause: [],
        referents: [{ phrase: "the rare maps", means: "the oldest maps in the cabinet" }],
      },
      final: {
        mode: "arrange",
        title: "Ms. Reyes describes the morning after",
        script: [
          { id: "f1", text: "Here is what happened after the night ended." },
          {
            id: "f2",
            text: "By seven-thirty, I had arrived and called the roof repair crew.",
            signal: "By seven-thirty",
          },
          {
            id: "f3",
            text: "At nine, the crew found the old drain cover cracked and replaced it with a new one.",
            signal: "At nine",
          },
          {
            id: "f4",
            text: "Afterward, volunteers spread the wet atlases on towels to dry.",
            signal: "Afterward",
          },
          {
            id: "f5",
            text: "Within a week, the reference room reopened, and covers now protect every roof drain.",
            signal: "Within a week",
          },
        ],
        items: [
          { id: "call", label: "Called the repair crew", glyph: "📞" },
          { id: "clear", label: "Replaced the drain cover", glyph: "🧹" },
          { id: "dry", label: "Dried the atlases on towels", glyph: "🧺" },
          { id: "open", label: "Reopened the reference room", glyph: "🔓" },
        ],
        targets: [
          { id: "m1", label: "1st" },
          { id: "m2", label: "2nd" },
          { id: "m3", label: "3rd" },
          { id: "m4", label: "4th" },
        ],
        expect: [
          { item: "call", target: "m1", utterance: "f2" },
          { item: "clear", target: "m2", utterance: "f3" },
          { item: "dry", target: "m3", utterance: "f4" },
          { item: "open", target: "m4", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "How a Plastic Bag Flooded the Reference Room",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "A single clogged drain set off a chain of events that put Harbor Library's collection at risk.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "Because wet leaves and a plastic bag blocked the roof drain, rainwater pooled several inches deep above the reference room.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "Soon, that water seeped through the roof and soaked the ceiling tiles, and a steady drip began to fall on the lowest shelves.",
        },
        {
          id: "s4",
          role: "detail",
          text: "The reference room holds about four thousand books, many of them donated by local families.",
        },
        {
          id: "s5",
          role: "evidence",
          supports: ["s1"],
          text: "As a result, the water sensor triggered an alarm at 12:15 a.m., and the night custodian was called in.",
        },
        {
          id: "s6",
          role: "evidence",
          supports: ["s1"],
          text: "Consequently, Mr. Dube cleared the drain, moved the rare maps upstairs, and limited the damage to six atlases.",
        },
        {
          id: "s7",
          role: "background",
          text: "Harbor Library was built in 1962 and expanded in 1994.",
        },
        {
          id: "s8",
          role: "conclusion",
          supports: ["s1"],
          text: "Therefore, the library now inspects its roof drains before every storm season.",
        },
        {
          id: "s9",
          role: "claim",
          text: "Libraries should move every rare book to the second floor.",
        },
      ],
      claimOptions: ["s1", "s9"],
      challenge: {
        type: "cause-effect",
        claim: "s1",
        valid: ["s2", "s3", "s5", "s6", "s8"],
        minValid: 4,
        weak: ["s4", "s7"],
        explainFrame: "___ led to ___, which in turn caused ___.",
        explainTerms: ["because", "as a result", "consequently", "led to", "caused", "therefore"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "claim",
              text: "A blown fuse set off a chain of changes at Friday's school dance.",
            },
            {
              id: "t2",
              role: "evidence",
              supports: ["t1"],
              text: "Because too many speakers were plugged into one outlet, a fuse blew and the gym went silent.",
            },
            {
              id: "t3",
              role: "evidence",
              supports: ["t1"],
              text: "As a result, the student council moved the dance to the courtyard, where a small speaker could run on batteries.",
            },
            {
              id: "t4",
              role: "detail",
              text: "The gym floor was repainted last summer in the school colors.",
            },
            {
              id: "t5",
              role: "evidence",
              supports: ["t1"],
              text: "Consequently, more students stayed outside, and the dance felt more relaxed than in earlier years.",
            },
            {
              id: "t6",
              role: "background",
              text: "The student council meets every Tuesday at lunch.",
            },
          ],
          claim: "t1",
          valid: ["t2", "t3", "t5"],
          minValid: 2,
          weak: ["t4", "t6"],
        },
      },
      refs: [
        { sentence: "s3", phrase: "that water", means: "the rainwater that pooled on the roof" },
        { sentence: "s8", phrase: "its", means: "Harbor Library's" },
      ],
      layers: {
        meaning: [
          { s: "s1", phrase: "a single clogged drain", label: "the starting cause" },
          {
            s: "s6",
            phrase: "limited the damage to six atlases",
            label: "the effect of the quick response",
          },
        ],
        discourse: [
          { s: "s2", phrase: "Because", label: "gives the cause first" },
          { s: "s5", phrase: "As a result", label: "signals an effect" },
          {
            s: "s6",
            phrase: "Consequently",
            label: "signals a result that follows from the action",
          },
          { s: "s8", phrase: "Therefore", label: "signals a conclusion drawn from the chain" },
        ],
        sentence: [
          {
            s: "s2",
            phrase: "Because wet leaves and a plastic bag blocked the roof drain",
            label: "reason clause that opens the sentence",
          },
        ],
        word: [
          {
            s: "s1",
            phrase: "collection",
            label: "academic word",
            def: "all the books and materials a library owns",
          },
          {
            s: "s6",
            phrase: "limited",
            label: "precise verb",
            def: "kept something small or under control",
          },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "expand",
      title: "Stretch a sentence with transitions",
      base: "Mr. Dube arrived.",
      needs: [
        {
          id: "time",
          label: "Place the event in time with a transition",
          test: { connectorJob: "sequence" },
        },
        {
          id: "cause",
          label: "Say why it happened or what it led to",
          test: { connectorJob: "cause" },
        },
        {
          id: "said",
          label: "Add something a person said, with a speech verb",
          test: {
            terms: [
              "said",
              "asked",
              "shouted",
              "whispered",
              "replied",
              "called",
              "exclaimed",
              "explained",
              "muttered",
            ],
          },
        },
      ],
      altConnectors: [
        { word: "meanwhile", note: "Meanwhile shows that two events happen at the same time." },
        {
          word: "as a result",
          note: "As a result begins a sentence with the effect of an earlier event.",
        },
        {
          word: "before",
          note: "Before places one event ahead of another inside a single sentence.",
        },
      ],
      transfer: {
        base: "The repair crew arrived.",
        needs: [
          {
            id: "time",
            label: "Place the event in time with a transition",
            test: { connectorJob: "sequence" },
          },
          {
            id: "said",
            label: "Add something a person said, with a speech verb",
            test: {
              terms: [
                "said",
                "asked",
                "shouted",
                "whispered",
                "replied",
                "called",
                "exclaimed",
                "explained",
                "muttered",
              ],
            },
          },
        ],
      },
    },
    {
      kind: "build",
      module: "connector",
      title: "Choose the transition that fits",
      gaps: [
        {
          before: "The drain was blocked with leaves,",
          after: "rainwater pooled on the roof.",
          relation: "cause",
          options: ["so", "because", "but", "meanwhile"],
          ok: ["so"],
        },
        {
          before: "Mr. Dube moved the rare maps upstairs.",
          after: "a little water still dripped onto the lower shelves.",
          relation: "sequence",
          options: ["meanwhile", "therefore", "for example", "despite"],
          ok: ["meanwhile"],
        },
        {
          before: "The custodian acted quickly.",
          after: "only six atlases were ruined.",
          relation: "cause",
          options: ["as a result", "however", "before", "unless"],
          ok: ["as a result"],
        },
      ],
      notes: {
        so: "So shows a result.",
        meanwhile: "Meanwhile shows two things happening at the same time.",
        "as a result": "As a result shows the effect of an earlier event.",
        however: "However shows a difference or a surprise.",
      },
      transfer: {
        gaps: [
          {
            before: "The fuse blew,",
            after: "the gym went silent.",
            relation: "cause",
            options: ["so", "because", "but", "meanwhile"],
            ok: ["so"],
          },
          {
            before: "The students set up chairs in the courtyard.",
            after: "the teachers tested the battery speaker.",
            relation: "sequence",
            options: ["meanwhile", "therefore", "for example", "despite"],
            ok: ["meanwhile"],
          },
        ],
      },
    },
  ],
  communicate: {
    kind: "converse",
    mode: "discuss",
    prompt:
      "Tell Ms. Reyes the story of the night at Harbor Library in order. Use transitions that show how each event led to the next, and include something a person said.",
    partner: {
      name: "Ms. Reyes",
      glyph: "👩🏼‍💼",
      role: ["Head librarian", "Bibliotecaria jefa"],
      opening:
        "I want the newsletter story to read like a story, not a report. Tell me the night at Harbor Library as if you were there. Start at the beginning.",
    },
    topicTerms: [
      "rain",
      "drain",
      "roof",
      "alarm",
      "custodian",
      "atlases",
      "reference room",
      "leaves",
    ],
    sourceTerms: ["12:15", "clogged drain", "Mr. Dube", "rare maps", "atlases", "roof"],
    evidenceBank: [
      "The alarm log: rain began at 11:40 p.m.; the sensor alarm went off at 12:15 a.m.; the custodian arrived at 12:40 a.m.; the drain was cleared at 1:20 a.m.",
      "The roof drain was packed with wet leaves and a plastic bag.",
      "Mr. Dube cleared the drain, then moved the oldest maps upstairs.",
      "Six atlases were soaked, but the rare maps stayed dry.",
    ],
    lines: [
      {
        id: "drain",
        terms: ["drain", "clogged", "blocked", "roof", "leaves", "bag", "rain", "leak"],
        evidenceTerms: ["leaves", "plastic bag", "sagging", "puddle", "inches"],
        ack: "So your story begins on the roof.",
        probe: "What was blocking the drain, and what did that make the rain do?",
        close: "The blockage and what it set in motion",
      },
      {
        id: "custodian",
        terms: ["custodian", "dube", "moved", "roof", "hatch", "drain", "carried", "acted"],
        evidenceTerms: ["12:40", "1:20", "roof", "rare maps", "atlases"],
        ack: "So your story follows Mr. Dube.",
        probe: "Where did Mr. Dube go first, and what did each stop change?",
        close: "The order of his stops and what each one accomplished",
      },
      {
        id: "alarm",
        terms: ["alarm", "sensor", "midnight", "log", "night"],
        evidenceTerms: ["12:15", "11:40", "sensor", "log"],
        ack: "So your story begins with the alarm.",
        probe: "What time did the alarm go off, and what happened in the minutes after that?",
        close: "The time of the alarm and what followed",
      },
    ],
    followUps: {
      orient: "When and where does your story open, and who is there?",
      sequence: "Which transitions show how one event led to the next?",
      events: "What did people actually do? Choose precise verbs in the past.",
      response: "How did the night end, and what did someone say or feel?",
    },
    maxTurns: 3,
    minWords: 30,
  },
  improve: {
    models: {
      orient: "On a stormy Sunday night, rain began to pound the roof of Harbor Library.",
      sequence:
        "At first the rain only pooled on the roof; as a result, water soon seeped through the ceiling, and meanwhile the alarm began to sound.",
      events:
        "Mr. Dube sprinted up to the roof, tore the wet leaves from the drain, and carried the rare maps up the stairs.",
      response:
        "By dawn, the reference room was quiet again, and Mr. Dube whispered, “That was too close.”",
    },
    whys: [
      {
        id: "why-links",
        text: "Transitions show how one event led to the next, so the reader follows the chain instead of a list.",
        moves: ["sequence"],
      },
      {
        id: "why-precise",
        text: "A clear setting and precise verbs let the reader picture exactly what happened.",
        moves: ["orient", "events"],
      },
      {
        id: "why-voice",
        text: "A closing reaction or a line of dialogue shows why the night mattered to the people in it.",
        moves: ["response"],
      },
    ],
  },
  show: {
    kind: "compose",
    mode: "write",
    prompt:
      "New situation: A school bus broke down on the way to the science museum. The bus stopped on Route 9 at 8:40 a.m. The driver, Ms. Okoro, called the bus garage. The students waited on the grass for forty-five minutes. A second bus arrived at 9:25, and the class reached the museum just as the first planetarium show began. One student, Eli, said, “I'll never complain about a long ride again.” Write a short story that shows how these events connected, using transitions and at least one line of dialogue.",
    audience: ["Readers of the school newsletter", "Lectores del boletín escolar"],
    genre: "narrative",
    topicTerms: ["bus", "museum", "driver", "Route 9", "planetarium", "students", "garage"],
    sourceTerms: ["Route 9", "8:40", "Ms. Okoro", "second bus", "planetarium", "Eli"],
    organizer: ["setting", "events", "ending"],
    readerQuestions: {
      orient: "When and where does the story begin, and who is in it?",
      sequence: "Which transitions show how each event led to the next?",
      events: "What exactly did each person do?",
      response: "How did it end, and what did someone say or feel?",
    },
    minWords: 55,
  },
};

export default {
  id: "m02",
  bands: { "3-5": g35, "6-8": g68 },
};
