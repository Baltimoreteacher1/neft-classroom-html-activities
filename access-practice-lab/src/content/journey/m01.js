// Mission 1 — My World, My Story (Unit 1, Narrate). Environment: classroom.
// Grades 3-5: "The Messy Morning in Room 12" (describe a room, tell what happened in order).
// Grades 6-8: "Dara's First Week" (a new student's first morning, told with time words and clear references).
// Title, goal, WIDA and spiral data live in MISSIONS (curriculum.js); family text lives in family.js.
// Task content is English (the language practiced). Hints ask or point; they never state an answer.

// ───────────────────────────── Grades 3-5 ─────────────────────────────
const g35 = {
  environment: "classroom",
  context: {
    title: ["The Messy Morning in Room 12", "La mañana desordenada del salón 12"],
    premise:
      "Ms. Okafor stepped into the hall for a moment. When she came back, the reading corner of Room 12 was a mess. Her class has to describe the room and tell what happened, in order.",
    cast: [
      {
        id: "okafor",
        name: "Ms. Okafor",
        role: ["Classroom teacher", "Maestra del salón"],
        glyph: "👩🏾‍🏫",
      },
      { id: "amara", name: "Amara", role: ["Classmate", "Compañera de clase"], glyph: "🧒🏿" },
      { id: "mateo", name: "Mateo", role: ["New student", "Estudiante nuevo"], glyph: "🧒🏽" },
    ],
  },
  vocab: [
    [
      "describe",
      "to tell what someone or something is like",
      "describir: decir cómo es algo o alguien",
    ],
    [
      "detail",
      "a small fact that helps you picture something",
      "detalle: un dato pequeño que ayuda a imaginar algo",
    ],
    ["setting", "where and when a story happens", "escenario: dónde y cuándo ocurre un cuento"],
    [
      "character",
      "a person or animal in a story",
      "personaje: una persona o un animal de un cuento",
    ],
    [
      "order",
      "the way things come one after another",
      "orden: la manera en que las cosas van una tras otra",
    ],
    [
      "scatter",
      "to spread things in many directions",
      "esparcir: dispersar cosas en muchas direcciones",
    ],
    ["finally", "at the end, after everything else", "por fin: al final, después de todo lo demás"],
    [
      "mess",
      "a place where things are not neat",
      "desorden: un lugar donde las cosas no están ordenadas",
    ],
  ],
  frames: {
    A: [
      "One morning, ___ happened in ___.",
      "First, ___. Next, ___. Then, ___. Finally, ___.",
      "I saw ___. It looked ___.",
      "At the end, ___ felt ___.",
    ],
    B: ["First, ___. Then, ___.", "In the end, ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "What happened in the reading corner while Ms. Okafor was in the hall? Look around the room, then tell the story in order.",
    objects: [
      {
        id: "window",
        label: "Open window",
        glyph: "🪟",
        x: 16,
        y: 22,
        relevant: true,
        note: "The big window above the reading corner is open. The curtain is waving, and a cool wind comes in.",
      },
      {
        id: "papers",
        label: "Papers on the floor",
        glyph: "📄",
        x: 36,
        y: 70,
        relevant: true,
        note: "Colored papers lie in a long line from the window to the rug. A few have bent corners.",
      },
      {
        id: "cage",
        label: "Biscuit's cage",
        glyph: "🐹",
        x: 82,
        y: 38,
        relevant: true,
        note: "Biscuit the class hamster is not in his cage. The little door is open, and sunflower seeds lie on the rug below it.",
      },
      {
        id: "prints",
        label: "Muddy shoe prints",
        glyph: "👣",
        x: 58,
        y: 84,
        relevant: true,
        note: "Small muddy shoe prints go from the door to the book bin. It rained at recess today.",
      },
      {
        id: "bin",
        label: "Tipped book bin",
        glyph: "📚",
        x: 66,
        y: 60,
        relevant: true,
        note: "The book bin lies on its side. Books are spread over the rug, and one is open to a page about hamsters.",
      },
      {
        id: "calendar",
        label: "Class calendar",
        glyph: "📅",
        x: 46,
        y: 18,
        relevant: false,
        note: "The calendar says it is Tuesday. Picture day is next week.",
      },
    ],
    controls: [
      {
        id: "window",
        label: "Window",
        initial: "open",
        options: [
          { id: "open", label: "Open" },
          { id: "shut", label: "Shut" },
        ],
      },
      {
        id: "cage",
        label: "Biscuit's cage door",
        initial: "open",
        options: [
          { id: "open", label: "Open" },
          { id: "latched", label: "Latched" },
        ],
      },
    ],
    outcomes: [
      {
        when: { window: "shut", cage: "latched" },
        mood: "good",
        key: "calm",
        state: "The room is calm. The papers stay on the shelf, and Biscuit sleeps in his cage.",
      },
      {
        when: { window: "open", cage: "latched" },
        mood: "warn",
        key: "breezy",
        state:
          "Wind blows through the window and the papers fly across the rug. Biscuit stays asleep.",
      },
      {
        when: { window: "shut", cage: "open" },
        mood: "warn",
        key: "escape",
        state: "The room is quiet, but Biscuit runs out of his cage and bumps into the book bin.",
      },
      {
        when: { window: "open", cage: "open" },
        mood: "bad",
        key: "chaos",
        state:
          "The papers fly, and a little hamster runs between the books. The reading corner is a big mess.",
      },
    ],
    collect: 3,
    variables: [
      {
        id: "wind",
        label: "the wind from the window",
        terms: ["wind", "window", "breeze", "curtain", "blew", "blowing", "papers"],
        evidenceTerms: ["open", "papers", "curtain", "bent", "line"],
        probe:
          "You think the wind did something. What did you notice near the window or on the floor that fits your idea?",
        good: "A detail from the window or the papers",
      },
      {
        id: "hamster",
        label: "Biscuit the hamster",
        terms: ["hamster", "biscuit", "cage", "seeds", "ran", "escaped"],
        evidenceTerms: ["seeds", "door", "open", "rug", "hamsters"],
        probe:
          "You are thinking about Biscuit. What did you see around his cage that makes you tell it that way?",
        good: "A detail from the cage or the rug",
      },
      {
        id: "student",
        label: "a classmate with muddy shoes",
        terms: [
          "student",
          "kid",
          "classmate",
          "someone",
          "footprints",
          "prints",
          "muddy",
          "mud",
          "shoes",
          "recess",
        ],
        evidenceTerms: ["muddy", "prints", "rain", "door", "bin"],
        probe: "You think a person was here. What marks did you see, and where did they lead?",
        good: "Something about the marks on the floor",
      },
    ],
    partner: {
      name: "Ms. Okafor",
      glyph: "👩🏾‍🏫",
      opening: "Oh my! My reading corner is a mess. Can you tell me what you think happened here?",
      noCause: "I can hear what you see. Now tell me what happened, one thing after another.",
      noEvidence: "What did you see in the room that makes you think so?",
      thanks: "Thank you. Now I can picture what happened this morning.",
    },
    respond: {
      prompt:
        "Tell Ms. Okafor what you think happened in the reading corner. Tell it in order and use something you saw.",
      minWords: 14,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "place",
      title: "Amara shows you around Room 12",
      grid: { cols: 3, rows: 2 },
      script: [
        { id: "u1", text: "Welcome to Room 12! Let me show you around." },
        {
          id: "u2",
          text: "The reading rug is at the back of the room, on the left.",
          signal: "back",
        },
        {
          id: "u3",
          text: "Biscuit, our class hamster, lives in the middle at the back.",
          signal: "middle",
        },
        {
          id: "u4",
          text: "The window garden is at the back, on the right, under a big window.",
          signal: "right",
        },
        {
          id: "u5",
          text: "Ms. Okafor's desk is at the front, on the left, near the door.",
          signal: "front",
        },
        {
          id: "u6",
          text: "The art shelf is at the front, on the right side.",
          signal: "right side",
        },
      ],
      items: [
        { id: "rug", label: "Reading rug", glyph: "📖" },
        { id: "cage", label: "Biscuit's cage", glyph: "🐹" },
        { id: "garden", label: "Window garden", glyph: "🪴" },
        { id: "desk", label: "Ms. Okafor's desk", glyph: "📋" },
        { id: "art", label: "Art shelf", glyph: "🎨" },
      ],
      targets: [
        { id: "bl", label: "Back left" },
        { id: "bm", label: "Back middle" },
        { id: "br", label: "Back right" },
        { id: "fl", label: "Front left" },
        { id: "fm", label: "Front middle" },
        { id: "fr", label: "Front right" },
      ],
      expect: [
        { item: "rug", target: "bl", utterance: "u2" },
        { item: "cage", target: "bm", utterance: "u3" },
        { item: "garden", target: "br", utterance: "u4" },
        { item: "desk", target: "fl", utterance: "u5" },
        { item: "art", target: "fr", utterance: "u6" },
      ],
      visuals: {
        u2: "The back-left square of the room map glows",
        u3: "The back-middle square glows, with a small cage icon",
        u4: "The back-right square glows, under a window picture",
        u5: "The front-left square glows, close to a door icon",
        u6: "The front-right square glows",
      },
      xray: {
        keywords: ["back", "front", "left", "right", "middle"],
        sequence: [],
        cause: [],
        referents: [{ phrase: "our class hamster", means: "Biscuit" }],
      },
      final: {
        mode: "arrange",
        title: "Mateo tells about his first day",
        script: [
          { id: "f1", text: "Now I will tell you about my first day at this school." },
          { id: "f2", text: "First, I got lost on the way to Room 12.", signal: "First" },
          { id: "f3", text: "Next, a girl named Amara showed me the right door.", signal: "Next" },
          { id: "f4", text: "Then she sat with me at lunch and shared her mango.", signal: "Then" },
          {
            id: "f5",
            text: "Finally, I felt happy because I had a new friend.",
            signal: "Finally",
          },
        ],
        items: [
          { id: "lost", label: "Got lost in the hall", glyph: "🧭" },
          { id: "door", label: "Amara showed the door", glyph: "🚪" },
          { id: "lunch", label: "Sat together at lunch", glyph: "🥭" },
          { id: "happy", label: "Felt happy", glyph: "😊" },
        ],
        targets: [
          { id: "e1", label: "Event 1" },
          { id: "e2", label: "Event 2" },
          { id: "e3", label: "Event 3" },
          { id: "e4", label: "Event 4" },
        ],
        expect: [
          { item: "lost", target: "e1", utterance: "f2" },
          { item: "door", target: "e2", utterance: "f3" },
          { item: "lunch", target: "e3", utterance: "f4" },
          { item: "happy", target: "e4", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Amara's Missing Lunch Bag",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "Amara's Monday began with a problem and ended with a surprise.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "First, she looked for her lunch bag in her backpack, but it was not there.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "Next, she checked the coat hooks and the cubbies by the door.",
        },
        {
          id: "s4",
          role: "detail",
          text: "The cubbies were full of hats, mittens, and one soccer ball.",
        },
        {
          id: "s5",
          role: "evidence",
          supports: ["s1"],
          text: "Then a voice on the loudspeaker said that someone had found a blue lunch bag.",
        },
        { id: "s6", role: "detail", text: "Her lunch was rice, beans, and a sliced mango." },
        {
          id: "s7",
          role: "conclusion",
          supports: ["s1"],
          text: "Finally, she ran to the office, got her bag back, and smiled all through lunch.",
        },
        { id: "s8", role: "claim", text: "Cubbies are the best place to keep a lunch bag." },
      ],
      claimOptions: ["s1", "s8"],
      challenge: {
        type: "sequence",
        claim: "s1",
        valid: ["s2", "s3", "s5", "s7"],
        minValid: 3,
        weak: ["s4", "s6"],
        explainFrame: "The word ___ shows that ___ happened before ___.",
        explainTerms: ["before", "after", "next", "then", "first"],
        transfer: {
          passage: [
            { id: "t1", role: "claim", text: "Priya's walk to school had three surprises." },
            {
              id: "t2",
              role: "evidence",
              supports: ["t1"],
              text: "First, she saw a brown dog sitting at the corner.",
            },
            {
              id: "t3",
              role: "evidence",
              supports: ["t1"],
              text: "Next, the dog followed her past the bakery.",
            },
            { id: "t4", role: "detail", text: "The bakery smells like warm bread and cinnamon." },
            {
              id: "t5",
              role: "evidence",
              supports: ["t1"],
              text: "Finally, a man ran up and said, “That's my dog, Pepper!”",
            },
            { id: "t6", role: "background", text: "Priya wears a yellow raincoat on rainy days." },
          ],
          claim: "t1",
          valid: ["t2", "t3", "t5"],
          minValid: 2,
          weak: ["t4", "t6"],
        },
      },
      refs: [
        { sentence: "s2", phrase: "it", means: "her lunch bag" },
        { sentence: "s7", phrase: "she", means: "Amara" },
      ],
      layers: {
        meaning: [
          {
            s: "s1",
            phrase: "began with a problem and ended with a surprise",
            label: "the beginning and the ending of the story",
          },
        ],
        discourse: [
          { s: "s2", phrase: "First", label: "the first event" },
          { s: "s3", phrase: "Next", label: "what comes after" },
          { s: "s5", phrase: "Then", label: "the following event" },
          { s: "s7", phrase: "Finally", label: "the last event" },
        ],
        sentence: [
          {
            s: "s2",
            phrase: "but it was not there",
            label: "what she hoped, set against what she found",
          },
        ],
        word: [
          {
            s: "s3",
            phrase: "cubbies",
            label: "school word",
            def: "small open spaces for a student's things",
          },
          {
            s: "s5",
            phrase: "loudspeaker",
            label: "school word",
            def: "a machine that makes a voice loud enough for the whole school",
          },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "expand",
      title: "Stretch a sentence",
      base: "The class cleaned the room.",
      needs: [
        { id: "time", label: "Tell when, with a time word", test: { connectorJob: "sequence" } },
        {
          id: "how",
          label: "Tell how they worked",
          test: {
            terms: [
              "quickly",
              "slowly",
              "carefully",
              "together",
              "happily",
              "quietly",
              "neatly",
              "fast",
              "hard",
            ],
          },
        },
        {
          id: "where",
          label: "Tell where the mess was",
          test: { terms: ["rug", "corner", "floor", "shelf", "desk", "window", "table", "carpet"] },
        },
      ],
      altConnectors: [
        { word: "first", note: "First starts a story: First, the class picked up the papers." },
        { word: "then", note: "Then tells what comes next: Then they put the books in the bin." },
        { word: "finally", note: "Finally tells the last thing: Finally, the room looked neat." },
      ],
      transfer: {
        base: "Amara found her bag.",
        needs: [
          { id: "time", label: "Tell when, with a time word", test: { connectorJob: "sequence" } },
          {
            id: "detail",
            label: "Add a describing word",
            test: {
              terms: [
                "blue",
                "stars",
                "happy",
                "happily",
                "quickly",
                "finally",
                "lost",
                "relieved",
                "heavy",
              ],
            },
          },
        ],
      },
    },
    {
      kind: "build",
      module: "pronoun",
      title: "Who is it? Trace the small words",
      text: [
        { id: "p1", text: "Amara opened her backpack." },
        { id: "p2", text: "She looked for her lunch bag." },
        { id: "p3", text: "It was not inside." },
        { id: "p4", text: "Mateo saw Amara, and he asked if he could help." },
        { id: "p5", text: "They checked the cubbies together." },
      ],
      pronouns: [
        { sentence: "p2", phrase: "She", options: ["Amara", "Mateo", "the backpack"], ok: "Amara" },
        {
          sentence: "p3",
          phrase: "It",
          options: ["the backpack", "the lunch bag", "the cubby"],
          ok: "the lunch bag",
        },
        { sentence: "p4", phrase: "he", options: ["Mateo", "Amara", "the teacher"], ok: "Mateo" },
        {
          sentence: "p5",
          phrase: "They",
          options: ["Amara and Mateo", "the cubbies", "Amara"],
          ok: "Amara and Mateo",
        },
      ],
      transfer: {
        text: [
          { id: "t1", text: "Kenji kicked the ball over the fence." },
          { id: "t2", text: "It rolled into Mrs. Lopez's garden." },
          { id: "t3", text: "She waved and called him over." },
          { id: "t4", text: "Kenji and his sister ran to get the ball, and they said thank you." },
        ],
        pronouns: [
          {
            sentence: "t2",
            phrase: "It",
            options: ["the ball", "the fence", "the garden"],
            ok: "the ball",
          },
          {
            sentence: "t3",
            phrase: "She",
            options: ["Mrs. Lopez", "Kenji's sister", "Kenji"],
            ok: "Mrs. Lopez",
          },
          {
            sentence: "t3",
            phrase: "him",
            options: ["Kenji", "Mrs. Lopez", "the ball"],
            ok: "Kenji",
          },
          {
            sentence: "t4",
            phrase: "they",
            options: ["Kenji and his sister", "Mrs. Lopez and Kenji", "the neighbors"],
            ok: "Kenji and his sister",
          },
        ],
      },
    },
  ],
  communicate: {
    kind: "converse",
    mode: "discuss",
    prompt:
      "Tell Mateo the story of the messy morning in the reading corner, from the beginning to the end. Say where and when it happened, and what happened first, next, and last.",
    partner: {
      name: "Mateo",
      glyph: "🧒🏽",
      role: ["New student", "Estudiante nuevo"],
      opening:
        "I am new, and I came in after it all happened. Everybody says the reading corner was a mess. Can you tell me the story from the start?",
    },
    topicTerms: [
      "reading corner",
      "window",
      "wind",
      "hamster",
      "Biscuit",
      "papers",
      "footprints",
      "mud",
      "books",
      "Ms. Okafor",
    ],
    sourceTerms: ["open window", "papers", "seeds", "cage", "muddy", "book bin"],
    evidenceBank: [
      "The window above the reading corner was open, and the papers were scattered in a line toward the rug.",
      "Biscuit's cage door was open, and sunflower seeds lay on the rug.",
      "Small muddy shoe prints went from the door to the book bin.",
      "The book bin was tipped over, and one book was open to a page about hamsters.",
    ],
    lines: [
      {
        id: "wind",
        terms: ["wind", "window", "breeze", "curtain", "blew", "papers"],
        evidenceTerms: ["open", "papers", "curtain", "floor"],
        ack: "So your story starts with the wind.",
        probe: "What did you see near the window that fits your story?",
        close: "A detail about the window or the papers",
      },
      {
        id: "hamster",
        terms: ["hamster", "biscuit", "cage", "seeds", "ran", "escaped"],
        evidenceTerms: ["seeds", "door", "open", "rug"],
        ack: "So your story is about Biscuit.",
        probe: "What did you see by the cage that makes you tell it that way?",
        close: "A detail from the cage or the rug",
      },
      {
        id: "student",
        terms: [
          "student",
          "someone",
          "kid",
          "classmate",
          "footprints",
          "prints",
          "muddy",
          "mud",
          "shoes",
          "recess",
        ],
        evidenceTerms: ["muddy", "prints", "rain", "door", "bin"],
        ack: "So your story has a person in it.",
        probe: "What marks did you see, and where did they lead?",
        close: "Something about the marks on the floor",
      },
    ],
    followUps: {
      orient: "Where and when does your story happen? Who is there?",
      sequence: "Which time word shows what happened first? What happened after that?",
      events: "What did your characters actually do? Use action words about the past.",
      response: "How did your story end? How did Ms. Okafor feel?",
    },
    maxTurns: 3,
    minWords: 18,
  },
  improve: {
    models: {
      orient: "One rainy Tuesday morning in Room 12, the reading corner was a big mess.",
      sequence:
        "First the wind blew the papers across the rug, and then Biscuit ran out of his cage.",
      events:
        "The wind scattered the papers, and Biscuit raced between the books and tipped over the bin.",
      response:
        "In the end, Ms. Okafor smiled, picked up the books, and felt glad that Biscuit was safe.",
    },
    whys: [
      {
        id: "why-order",
        text: "It tells what happened first, next, and last, so my listener can follow my story.",
        moves: ["sequence"],
      },
      {
        id: "why-picture",
        text: "It says where, when, and what the characters did, so my listener can picture the place.",
        moves: ["orient", "events"],
      },
      {
        id: "why-end",
        text: "It shows how the story ended, so my listener knows why it matters.",
        moves: ["response"],
      },
    ],
  },
  show: {
    kind: "compose",
    mode: "write",
    prompt:
      "New situation: On Friday morning at Linden School, the garden gate was open and a watering can lay on its side in the bean patch. The soil was wet, small wet footprints led to the gate, and a note on the fence said, “Back soon.” Write a story about what you think happened in the garden before school. Say where and when it happened, tell the events in order, and show how it ended.",
    audience: ["Readers of your class newsletter", "Lectores del boletín de tu clase"],
    genre: "narrative",
    topicTerms: ["garden", "gate", "watering can", "beans", "footprints", "note", "morning"],
    sourceTerms: ["open gate", "watering can", "wet", "footprints", "note"],
    organizer: ["setting", "events", "ending"],
    readerQuestions: {
      orient: "Where and when does your story happen, and who is in it?",
      sequence: "What happened first, next, and last?",
      events: "What did the characters do? Tell me the actions.",
      response: "How did your story end?",
    },
    minWords: 30,
  },
};

// ───────────────────────────── Grades 6-8 ─────────────────────────────
const g68 = {
  environment: "classroom",
  context: {
    title: ["Dara's First Week", "La primera semana de Dara"],
    premise:
      "Dara moved to Lakeview Middle School in October. The school newspaper is collecting first-week stories from new students, and its advisor needs to know exactly how Dara's first morning went wrong before it went right.",
    cast: [
      {
        id: "haddad",
        name: "Ms. Haddad",
        role: ["Newspaper advisor", "Asesora del periódico"],
        glyph: "👩🏽‍💼",
      },
      { id: "dara", name: "Dara", role: ["New student", "Estudiante nueva"], glyph: "🧑🏾" },
      { id: "cho", name: "Mr. Cho", role: ["Hall monitor", "Monitor de pasillos"], glyph: "👨🏻" },
    ],
  },
  vocab: [
    [
      "narrative",
      "a story, true or made up, told in order",
      "narrativa: una historia, real o inventada, contada en orden",
    ],
    [
      "sequence",
      "the order in which events happen",
      "secuencia: el orden en que suceden los hechos",
    ],
    [
      "transition",
      "a word or phrase that moves a reader from one event to the next",
      "transición: una palabra o frase que lleva al lector de un suceso al siguiente",
    ],
    [
      "reference",
      "a word, like she or it, that points back to someone or something already named",
      "referencia: palabra, como ella o eso, que señala algo que ya se nombró",
    ],
    [
      "vivid",
      "so clear and detailed that you can picture it",
      "vívido: tan claro y detallado que se puede imaginar",
    ],
    [
      "setting",
      "the time and the place of a story",
      "escenario: el tiempo y el lugar de un relato",
    ],
    [
      "chronological",
      "arranged in the order the events happened",
      "cronológico: organizado en el orden en que ocurrieron los hechos",
    ],
    [
      "reaction",
      "how a person feels or acts after something happens",
      "reacción: cómo se siente o actúa alguien después de algo",
    ],
  ],
  frames: {
    A: [
      "On the morning of ___, ___ arrived at ___.",
      "At first, ___. Meanwhile, ___. As a result, ___.",
      "By the time ___, ___ had already ___.",
      "Looking back, ___ realized that ___.",
    ],
    B: ["At first, ___; after that, ___.", "In the end, ___ realized ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "Why was Dara seventeen minutes late to her very first class at Lakeview, and how did she finally get there? Look closely, then tell the morning in order.",
    objects: [
      {
        id: "bus",
        label: "Bus delay notice",
        glyph: "🚌",
        x: 14,
        y: 26,
        relevant: true,
        note: "Delay notice: Route 14 is due at Lakeview at 7:35. On Monday it arrived at 7:58 because road work closed a lane on Mill Street.",
      },
      {
        id: "locker",
        label: "Locker slip",
        glyph: "🔐",
        x: 34,
        y: 70,
        relevant: true,
        note: "Locker slip: the paper lists the combination as 12-30-8. The locker only opened with 12-8-30, which Mr. Cho later showed Dara.",
      },
      {
        id: "map",
        label: "Hallway map",
        glyph: "🗺️",
        x: 62,
        y: 24,
        relevant: true,
        note: "Hallway map: Room 214 is in the east wing, up the stairs beside the gym. The arrow printed on Dara's schedule points toward the west wing.",
      },
      {
        id: "bell",
        label: "Bell schedule",
        glyph: "⏰",
        x: 80,
        y: 60,
        relevant: true,
        note: "Bell schedule: first period starts at 8:05. Students who arrive later sign in at the office or walk straight to class.",
      },
      {
        id: "log",
        label: "Hall monitor log",
        glyph: "📒",
        x: 52,
        y: 80,
        relevant: true,
        note: "Mr. Cho's log: 8:12, new student wandering in the west wing, looking for Room 214. Walked her to the east stairs.",
      },
      {
        id: "poster",
        label: "Book fair poster",
        glyph: "📌",
        x: 90,
        y: 86,
        relevant: false,
        note: "Poster: the fall book fair opens Thursday in the library and runs for one week.",
      },
    ],
    controls: [
      {
        id: "bus",
        label: "The bus",
        initial: "late",
        options: [
          { id: "ontime", label: "Arrives at 7:35" },
          { id: "late", label: "Arrives at 7:58" },
        ],
      },
      {
        id: "route",
        label: "Finding Room 214",
        initial: "arrow",
        options: [
          { id: "arrow", label: "Follow the arrow on the schedule" },
          { id: "ask", label: "Ask a hall monitor first" },
        ],
      },
    ],
    outcomes: [
      {
        when: { bus: "ontime", route: "ask" },
        mood: "good",
        key: "early",
        state: "Dara reaches Room 214 before the bell, calm and a little early.",
      },
      {
        when: { bus: "ontime", route: "arrow" },
        mood: "warn",
        key: "detour",
        state:
          "Dara follows the arrow into the west wing, backtracks, and slips into class just as the bell rings.",
      },
      {
        when: { bus: "late", route: "ask" },
        mood: "warn",
        key: "latebus",
        state:
          "The bus is late, but a hall monitor points the way. Dara arrives a few minutes after the bell.",
      },
      {
        when: { bus: "late", route: "arrow" },
        mood: "bad",
        key: "lost",
        state:
          "The bus is late and the arrow sends Dara the wrong way. She reaches Room 214 out of breath, long after the bell.",
      },
    ],
    collect: 4,
    variables: [
      {
        id: "transit",
        label: "the late bus",
        terms: ["bus", "late", "delay", "delayed", "road", "route", "lane", "traffic"],
        evidenceTerms: ["7:58", "7:35", "road work", "mill street", "notice"],
        probe:
          "You point to the bus. What does the delay notice record, and how did that change the start of Dara's morning?",
        good: "A time from the notice and what it set in motion",
      },
      {
        id: "navigation",
        label: "the misleading arrow",
        terms: ["map", "wing", "lost", "wrong", "west", "east", "arrow", "schedule", "directions"],
        evidenceTerms: ["east wing", "west wing", "arrow", "214", "stairs"],
        probe:
          "You point to finding the room. What do the map and the schedule show about the two wings?",
        good: "A comparison of the map and the arrow",
      },
      {
        id: "locker",
        label: "the locker problem",
        terms: ["locker", "combination", "slip", "lock", "stuck", "numbers", "open"],
        evidenceTerms: ["12-30-8", "12-8-30", "slip", "mr. cho", "combination"],
        probe:
          "You are thinking about the locker. What did the slip say, and who solved the problem?",
        good: "What the slip listed and what finally worked",
      },
    ],
    partner: {
      name: "Ms. Haddad",
      glyph: "👩🏽‍💼",
      opening:
        "I am collecting first-week stories for the newspaper. Dara says her first morning was a mess. What do you think happened, and in what order?",
      noCause:
        "You described what you saw. Now tell me the morning as a story: what happened, step by step?",
      noEvidence: "Which detail from the notice, the map or the log makes you tell it that way?",
      thanks: "Thank you. That gives me a clear outline for Dara's story.",
    },
    respond: {
      prompt:
        "Tell Ms. Haddad how Dara's first morning unfolded, from the bus ride to Room 214. Use details you found and time words that link one event to the next.",
      minWords: 25,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "arrange",
      title: "Dara tells her first morning",
      script: [
        { id: "u1", text: "Let me tell you how my first morning at Lakeview really went." },
        {
          id: "u2",
          text: "At first, I stood at the bus stop, and the bus was more than twenty minutes late.",
          signal: "At first",
        },
        {
          id: "u3",
          text: "After I finally got to school, I spent a few minutes fighting with my locker.",
          signal: "After",
        },
        {
          id: "u4",
          text: "Meanwhile, the bell rang, and the hallway emptied around me.",
          signal: "Meanwhile",
        },
        {
          id: "u5",
          text: "Then I followed the arrow on my schedule, and it led me to the wrong wing.",
          signal: "Then",
        },
        {
          id: "u6",
          text: "Eventually, a hall monitor named Mr. Cho walked me to Room 214.",
          signal: "Eventually",
        },
        {
          id: "u7",
          text: "By the time I sat down, I was seventeen minutes late, but my teacher just smiled.",
          signal: "By the time",
        },
      ],
      items: [
        { id: "bus", label: "Waited for a late bus", glyph: "🚌" },
        { id: "locker", label: "Struggled with the locker", glyph: "🔐" },
        { id: "bell", label: "Heard the bell in an empty hall", glyph: "🔔" },
        { id: "arrow", label: "Followed the arrow to the wrong wing", glyph: "➡️" },
        { id: "cho", label: "Mr. Cho walked her to class", glyph: "🧑" },
        { id: "sat", label: "Sat down late, to a smile", glyph: "💺" },
      ],
      targets: [
        { id: "p1", label: "1st" },
        { id: "p2", label: "2nd" },
        { id: "p3", label: "3rd" },
        { id: "p4", label: "4th" },
        { id: "p5", label: "5th" },
        { id: "p6", label: "6th" },
      ],
      expect: [
        { item: "bus", target: "p1", utterance: "u2" },
        { item: "locker", target: "p2", utterance: "u3" },
        { item: "bell", target: "p3", utterance: "u4" },
        { item: "arrow", target: "p4", utterance: "u5" },
        { item: "cho", target: "p5", utterance: "u6" },
        { item: "sat", target: "p6", utterance: "u7" },
      ],
      visuals: {
        u2: "A bus stop with an empty road and a clock",
        u3: "A locker with a combination dial and a worried face",
        u4: "A hallway with no students and a ringing bell",
        u5: "A schedule with an arrow pointing the wrong way",
        u6: "Two figures walking up a staircase",
        u7: "A student sitting down while a teacher smiles",
      },
      xray: {
        keywords: ["At first", "After", "Meanwhile", "Then", "Eventually", "By the time"],
        sequence: ["At first", "After", "Meanwhile", "Then", "Eventually", "By the time"],
        cause: [],
        referents: [{ phrase: "it", means: "the arrow on my schedule" }],
      },
      final: {
        mode: "sort",
        title: "Dara compares her two schools",
        script: [
          {
            id: "f1",
            text: "Let me describe both of my schools so you can picture the difference.",
          },
          {
            id: "f2",
            text: "My old school was small, with one hallway and about two hundred students.",
            signal: "old school",
          },
          {
            id: "f3",
            text: "Everyone there knew my name, and I walked to class in two minutes.",
            signal: "knew my name",
          },
          {
            id: "f4",
            text: "Lakeview is huge, with three wings and more than nine hundred students.",
            signal: "Lakeview",
          },
          {
            id: "f5",
            text: "Here, I need a map just to find the gym, and the hallways are loud and crowded.",
            signal: "Here",
          },
        ],
        items: [
          { id: "hall", label: "One hallway", glyph: "🏫" },
          { id: "two", label: "About 200 students", glyph: "👥" },
          { id: "name", label: "Everyone knew her name", glyph: "👋" },
          { id: "wings", label: "Three wings", glyph: "🧭" },
          { id: "nine", label: "More than 900 students", glyph: "🧑‍🤝‍🧑" },
          { id: "map", label: "Needs a map to find the gym", glyph: "🗺️" },
        ],
        targets: [
          { id: "old", label: "Her old school" },
          { id: "lake", label: "Lakeview" },
        ],
        expect: [
          { item: "hall", target: "old", utterance: "f2" },
          { item: "two", target: "old", utterance: "f2" },
          { item: "name", target: "old", utterance: "f3" },
          { item: "wings", target: "lake", utterance: "f4" },
          { item: "nine", target: "lake", utterance: "f4" },
          { item: "map", target: "lake", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "A Morning of Wrong Turns",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "Dara's first morning at Lakeview unfolded as a chain of small mishaps that ended on a hopeful note.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "At first, her bus ran more than twenty minutes late because of road work on Mill Street.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "By the time she reached the building, the hallways were filling, and her locker refused to open.",
        },
        {
          id: "s4",
          role: "detail",
          text: "The hallways at Lakeview are painted pale yellow, and the floors are always freshly waxed.",
        },
        {
          id: "s5",
          role: "evidence",
          supports: ["s1"],
          text: "After the bell rang, she followed the arrow on her schedule, which sent her to the wrong wing.",
        },
        {
          id: "s6",
          role: "background",
          text: "Lakeview serves about nine hundred students in three separate wings.",
        },
        {
          id: "s7",
          role: "evidence",
          supports: ["s1"],
          text: "Eventually, Mr. Cho, a hall monitor, noticed her and walked her to Room 214.",
        },
        {
          id: "s8",
          role: "conclusion",
          supports: ["s1"],
          text: "Although she arrived seventeen minutes late, her teacher greeted her warmly, and Dara finally exhaled.",
        },
        {
          id: "s9",
          role: "claim",
          text: "Middle school students should never ride the bus to school.",
        },
      ],
      claimOptions: ["s1", "s9"],
      challenge: {
        type: "sequence",
        claim: "s1",
        valid: ["s2", "s3", "s5", "s7", "s8"],
        minValid: 4,
        weak: ["s4", "s6"],
        explainFrame: "The transition ___ shows that ___ happened before ___, which led to ___.",
        explainTerms: ["before", "after", "then", "led to", "by the time", "eventually"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "claim",
              text: "Marcus's science fair morning turned from disaster to success in a series of quick repairs.",
            },
            {
              id: "t2",
              role: "evidence",
              supports: ["t1"],
              text: "At first, the volcano model collapsed when he carried it through the gym doorway.",
            },
            {
              id: "t3",
              role: "evidence",
              supports: ["t1"],
              text: "After that, he spent an hour rebuilding the base with tape and cardboard from the art room.",
            },
            {
              id: "t4",
              role: "detail",
              text: "The gymnasium was decorated with blue and silver banners that day.",
            },
            {
              id: "t5",
              role: "evidence",
              supports: ["t1"],
              text: "By the time the judges arrived, the model stood firm again.",
            },
            {
              id: "t6",
              role: "evidence",
              supports: ["t1"],
              text: "Finally, it erupted perfectly, and the judges applauded.",
            },
            {
              id: "t7",
              role: "background",
              text: "The science fair has been a Lakeview tradition for twelve years.",
            },
          ],
          claim: "t1",
          valid: ["t2", "t3", "t5", "t6"],
          minValid: 3,
          weak: ["t4", "t7"],
        },
      },
      refs: [
        { sentence: "s5", phrase: "which", means: "the arrow on her schedule" },
        { sentence: "s7", phrase: "her", means: "Dara" },
      ],
      layers: {
        meaning: [
          { s: "s1", phrase: "a chain of small mishaps", label: "the main idea the events build" },
          { s: "s8", phrase: "greeted her warmly", label: "how the story resolves" },
        ],
        discourse: [
          { s: "s2", phrase: "At first", label: "opens the sequence" },
          { s: "s3", phrase: "By the time", label: "links an event to a point in time" },
          { s: "s5", phrase: "After", label: "shows what follows an earlier event" },
          { s: "s7", phrase: "Eventually", label: "signals that a long wait is over" },
        ],
        sentence: [
          {
            s: "s8",
            phrase: "Although she arrived seventeen minutes late",
            label: "concession clause: the problem set against the result",
          },
        ],
        word: [
          { s: "s1", phrase: "mishaps", label: "academic word", def: "small unlucky events" },
          {
            s: "s2",
            phrase: "ran more than twenty minutes late",
            label: "collocation",
            def: "was more than twenty minutes behind schedule",
          },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "discourse",
      title: "Order a paragraph and link it",
      units: [
        {
          id: "d1",
          role: "orient",
          text: "On the first Monday of October, Dara stood at a bus stop on Mill Street with a brand-new backpack.",
        },
        { id: "d2", role: "event", text: "The bus arrived more than twenty minutes late." },
        {
          id: "d3",
          role: "event",
          text: "She raced to her locker, but the combination on her slip was wrong.",
        },
        {
          id: "d4",
          role: "event",
          text: "A hall monitor named Mr. Cho showed her the correct order of the numbers.",
        },
        {
          id: "d5",
          role: "ending",
          text: "She walked into Room 214 relieved, and she knew she could handle the next day.",
        },
      ],
      order: ["d1", "d2", "d3", "d4", "d5"],
      connectors: [
        { before: "d2", word: "At first" },
        { before: "d3", word: "After that" },
        { before: "d4", word: "Eventually" },
        { before: "d5", word: "In the end" },
      ],
      transfer: {
        units: [
          {
            id: "m1",
            role: "orient",
            text: "On the morning of the science fair, Marcus carried his volcano model through the gym doors.",
          },
          {
            id: "m2",
            role: "event",
            text: "The base cracked, and the whole model collapsed on the floor.",
          },
          { id: "m3", role: "event", text: "He asked the art teacher for cardboard and tape." },
          {
            id: "m4",
            role: "event",
            text: "By lunchtime, the volcano stood stronger than before.",
          },
          {
            id: "m5",
            role: "ending",
            text: "When the judges walked by, it erupted perfectly, and Marcus laughed out loud.",
          },
        ],
        order: ["m1", "m2", "m3", "m4", "m5"],
        connectors: [
          { before: "m2", word: "Suddenly" },
          { before: "m3", word: "After that" },
          { before: "m4", word: "By the time" },
          { before: "m5", word: "Finally" },
        ],
      },
    },
    {
      kind: "build",
      module: "pronoun",
      title: "Keep every reference clear",
      text: [
        {
          id: "p1",
          text: "Dara handed Ms. Haddad her schedule, and the advisor studied it carefully.",
        },
        { id: "p2", text: "The arrow on it pointed west, but Room 214 was in the east wing." },
        {
          id: "p3",
          text: "Mr. Cho and Dara walked together, and they took the stairs beside the gym.",
        },
        { id: "p4", text: "When the stairs ended, he opened the door for her." },
        { id: "p5", text: "That small kindness changed how she felt about the school." },
      ],
      pronouns: [
        {
          sentence: "p1",
          phrase: "her",
          options: ["Dara", "Ms. Haddad", "the advisor"],
          ok: "Dara",
        },
        {
          sentence: "p1",
          phrase: "it",
          options: ["the schedule", "the advisor", "Dara"],
          ok: "the schedule",
        },
        {
          sentence: "p2",
          phrase: "it",
          options: ["the schedule", "the arrow", "the east wing"],
          ok: "the schedule",
        },
        {
          sentence: "p3",
          phrase: "they",
          options: ["Mr. Cho and Dara", "the stairs", "Dara"],
          ok: "Mr. Cho and Dara",
        },
        {
          sentence: "p4",
          phrase: "he",
          options: ["Mr. Cho", "Ms. Haddad", "the door"],
          ok: "Mr. Cho",
        },
        { sentence: "p5", phrase: "she", options: ["Dara", "Mr. Cho", "Ms. Haddad"], ok: "Dara" },
      ],
      transfer: {
        text: [
          {
            id: "t1",
            text: "Marcus showed Ms. Reyes his volcano, and she lifted it gently to check the base.",
          },
          { id: "t2", text: "It wobbled, so the two of them taped the cardboard again." },
          {
            id: "t3",
            text: "The judges arrived while Marcus was still cleaning, and they stopped at his table.",
          },
          {
            id: "t4",
            text: "He smiled because that table was suddenly the busiest one in the room.",
          },
        ],
        pronouns: [
          {
            sentence: "t1",
            phrase: "she",
            options: ["Ms. Reyes", "Marcus", "the volcano"],
            ok: "Ms. Reyes",
          },
          {
            sentence: "t2",
            phrase: "It",
            options: ["the volcano", "the base", "the cardboard"],
            ok: "the volcano",
          },
          {
            sentence: "t3",
            phrase: "they",
            options: ["the judges", "Marcus and Ms. Reyes", "the tables"],
            ok: "the judges",
          },
          {
            sentence: "t4",
            phrase: "He",
            options: ["Marcus", "Ms. Reyes", "a judge"],
            ok: "Marcus",
          },
        ],
      },
    },
  ],
  communicate: {
    kind: "compose",
    mode: "write",
    prompt:
      "Write the opening paragraph of Dara's story for the Lakeview newspaper. Tell the events of her first morning in order, use time words that link one event to the next, make every pronoun clear, and include one vivid detail about the setting and one about how she reacted.",
    audience: ["Readers of the Lakeview newspaper", "Lectores del periódico de Lakeview"],
    genre: "narrative",
    topicTerms: ["Dara", "bus", "locker", "wing", "hallway", "Room 214", "Mr. Cho", "bell"],
    sourceTerms: ["bus", "late", "locker", "west wing", "Mr. Cho", "Room 214"],
    evidenceBank: [
      {
        id: "f1",
        text: "The bus ran more than twenty minutes late because of road work on Mill Street.",
        kind: "fact",
      },
      {
        id: "f2",
        text: "Her locker would not open with the combination printed on her slip.",
        kind: "fact",
      },
      {
        id: "f3",
        text: "The arrow on her schedule pointed toward the west wing, but Room 214 is in the east wing.",
        kind: "fact",
      },
      { id: "f4", text: "Mr. Cho, a hall monitor, walked her to Room 214.", kind: "fact" },
      { id: "f5", text: "“Welcome, Dara. We saved you a seat,” said her teacher.", kind: "quote" },
    ],
    organizer: ["setting", "events", "ending"],
    readerQuestions: {
      orient: "When and where does this story begin, and who is the main character?",
      sequence: "Which words show the order of the events, and what led from one to the next?",
      events: "What exactly did Dara do at each step? Which actions can I picture?",
      response: "How did the morning end, and how did Dara feel about it?",
    },
    minWords: 60,
  },
  improve: {
    models: {
      orient:
        "On the first Monday of October, Dara stood at the Mill Street bus stop, clutching a brand-new backpack.",
      sequence:
        "At first the bus was late; after that, her locker jammed, and eventually a hall monitor rescued her.",
      events:
        "She sprinted to her locker, spun the dial twice, and then trudged down the wrong hallway.",
      response:
        "Looking back, Dara realized that one kind hall monitor had turned a disastrous morning into a hopeful one.",
    },
    whys: [
      {
        id: "why-links",
        text: "Time words and transitions show how each event led to the next, so the reader follows the chain.",
        moves: ["sequence"],
      },
      {
        id: "why-detail",
        text: "Exact actions and a clear setting let the reader picture the scene instead of guessing.",
        moves: ["orient", "events"],
      },
      {
        id: "why-meaning",
        text: "Ending with a reaction tells the reader why the story mattered to the character.",
        moves: ["response"],
      },
    ],
  },
  show: {
    kind: "converse",
    mode: "speak",
    prompt:
      "New situation: Last spring, Jonas ran for the school bus with his science fair poster in his arms. A gust of wind tore the poster at the corner. He chased the bus but missed it. His neighbor, Mrs. Lin, drove him to school. He taped the poster back together and hung it on the gym wall just before judging began. The judges praised its “survivor” look. Tell a classmate this story in order, with time words and clear references, and say how it ended.",
    partner: {
      name: "Tomás",
      glyph: "🧑🏽",
      role: ["Classmate", "Compañero de clase"],
      opening:
        "I heard something wild happened to Jonas before the science fair. Can you tell me the whole story from the beginning?",
    },
    topicTerms: ["Jonas", "poster", "bus", "wind", "Mrs. Lin", "judges", "gym", "science fair"],
    sourceTerms: ["poster", "wind", "missed the bus", "Mrs. Lin", "taped", "judges"],
    lines: [
      {
        id: "poster",
        terms: ["poster", "tore", "torn", "wind", "gust", "taped", "tape"],
        evidenceTerms: ["corner", "gust", "taped", "gym wall"],
        ack: "So your story follows the poster.",
        probe: "What happened to the poster, and which time word shows when?",
        close: "When and how the poster was damaged and repaired",
      },
      {
        id: "ride",
        terms: ["bus", "missed", "chased", "ran", "neighbor", "mrs. lin", "drove", "ride"],
        evidenceTerms: ["missed", "chased", "mrs. lin", "drove"],
        ack: "So your story follows Jonas and the bus.",
        probe: "What did Jonas do when the bus left, and who helped him?",
        close: "The order of the chase, the missed bus and the ride",
      },
      {
        id: "judges",
        terms: ["judges", "judging", "praised", "survivor", "gym", "hung", "wall"],
        evidenceTerms: ["survivor", "praised", "before judging", "gym wall"],
        ack: "So your story builds toward the judges.",
        probe: "How did the judges react, and how did Jonas probably feel?",
        close: "The judges' reaction and Jonas's own reaction",
      },
    ],
    followUps: {
      orient: "When and where does your story begin, and who is in it?",
      sequence:
        "Which transitions show what happened first, what happened next, and what happened by the end?",
      events: "What did each person do? Name the actions, not just the people.",
      response: "How did the story end, and what did Jonas feel or learn?",
    },
    maxTurns: 3,
    minWords: 30,
  },
};

export default {
  id: "m01",
  bands: { "3-5": g35, "6-8": g68 },
};
