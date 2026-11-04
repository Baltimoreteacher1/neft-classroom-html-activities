// Mission 6 — Research and Report (Unit 2, Inform). Library environment.
// Grades 3-5: Monarch Research Desk (a library book and a class poster about monarch butterflies).
// Grades 6-8: The Erie Canal Report (textbook, cost table, population chart and a student blog).
// Title, goal, WIDA and spiral data live in MISSIONS (curriculum.js); family guidance lives in family.js.
// Task content is English; titles, roles and audiences are bilingual [en, es]. Hints ask or point and never state an answer.

const g35 = {
  environment: "library",
  context: {
    title: ["Monarch Research Desk", "Escritorio de investigación: mariposas monarca"],
    premise:
      "The school library has a book and a class poster about monarch butterflies. Ms. Lopez, the librarian, asks the class to write a short report for the class newsletter.",
    cast: [
      { id: "lopez", name: "Ms. Lopez", role: ["Librarian", "Bibliotecaria"], glyph: "👩🏻‍🏫" },
      {
        id: "ben",
        name: "Ben",
        role: ["Newsletter reporter", "Reportero del boletín"],
        glyph: "🧒🏻",
      },
    ],
  },
  vocab: [
    [
      "source",
      "a book, poster or website that gives facts",
      "fuente: libro, cartel o sitio web que da datos",
    ],
    [
      "main idea",
      "the most important idea in a text",
      "idea principal: la idea más importante de un texto",
    ],
    [
      "detail",
      "a small fact that tells more about the main idea",
      "detalle: dato pequeño que explica más la idea principal",
    ],
    ["fact", "something true that you can check", "dato: algo verdadero que se puede comprobar"],
    [
      "report",
      "a short text that tells what you learned",
      "informe: texto corto que cuenta lo que aprendiste",
    ],
    [
      "notes",
      "short words you write to remember facts",
      "apuntes: palabras cortas que escribes para recordar datos",
    ],
    [
      "migrate",
      "to travel a long way to live somewhere for part of the year",
      "migrar: viajar lejos para vivir en otro lugar parte del año",
    ],
    [
      "chrysalis",
      "the hard case where a caterpillar changes into a butterfly",
      "crisálida: cubierta dura donde la oruga se convierte en mariposa",
    ],
  ],
  frames: {
    A: [
      "The main idea is ___.",
      "The book says ___. The poster says ___.",
      "According to ___, ___.",
      "In conclusion, ___.",
    ],
    B: ["___ is the main idea.", "The ___ says ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "The class needs facts about monarch butterflies. Which source answers which question, and what does each source tell you?",
    objects: [
      {
        id: "book",
        label: "Library book",
        glyph: "📖",
        x: 20,
        y: 30,
        relevant: true,
        note: "Source A, a library book: a monarch goes through four stages: egg, caterpillar, chrysalis and butterfly. The caterpillar eats only milkweed leaves. In the fall, monarchs fly south.",
      },
      {
        id: "poster",
        label: "Class poster",
        glyph: "🖼️",
        x: 68,
        y: 26,
        relevant: true,
        note: "Source B, a class poster: monarchs from the eastern United States and Canada fly up to 3,000 miles to the mountains of Mexico each fall. An adult monarch weighs less than one gram.",
      },
      {
        id: "caption",
        label: "Photo caption",
        glyph: "📷",
        x: 80,
        y: 58,
        relevant: true,
        note: "Photo caption on the poster: a monarch's wings measure about 4 inches from tip to tip.",
      },
      {
        id: "card",
        label: "Librarian's card",
        glyph: "🗂️",
        x: 38,
        y: 72,
        relevant: true,
        note: "Ms. Lopez's card: a good report uses at least two sources and names where each fact came from.",
      },
      {
        id: "cart",
        label: "Book cart",
        glyph: "📚",
        x: 90,
        y: 88,
        relevant: false,
        note: "A cart of returned dinosaur books stands by the door.",
      },
    ],
    controls: [
      {
        id: "question",
        label: "Question",
        initial: "life",
        options: [
          { id: "life", label: "How do monarchs change?" },
          { id: "trip", label: "Where do monarchs go?" },
        ],
      },
      {
        id: "source",
        label: "Source",
        initial: "book",
        options: [
          { id: "book", label: "Library book" },
          { id: "poster", label: "Class poster" },
        ],
      },
    ],
    outcomes: [
      {
        when: { question: "life", source: "book" },
        mood: "good",
        key: "life-book",
        state:
          "The book answers it: monarchs go through four stages, and the caterpillar eats only milkweed.",
      },
      {
        when: { question: "life", source: "poster" },
        mood: "warn",
        key: "life-poster",
        state: "The poster shows an adult monarch, but it says nothing about the stages.",
      },
      {
        when: { question: "trip", source: "book" },
        mood: "warn",
        key: "trip-book",
        state:
          "The book says monarchs fly south in the fall, but it gives no distance and no place.",
      },
      {
        when: { question: "trip", source: "poster" },
        mood: "good",
        key: "trip-poster",
        state:
          "The poster answers it: some monarchs fly up to 3,000 miles to the mountains of Mexico.",
      },
    ],
    collect: 3,
    variables: [
      {
        id: "stages",
        label: "how monarchs change",
        terms: [
          "stages",
          "stage",
          "egg",
          "caterpillar",
          "chrysalis",
          "butterfly",
          "change",
          "grow",
        ],
        evidenceTerms: ["four", "4", "egg", "chrysalis"],
        probe:
          "You are telling how monarchs change. Which source told you, and how many steps does it list?",
        good: "The source and a count",
      },
      {
        id: "trip",
        label: "the trip",
        terms: ["fly", "trip", "travel", "south", "migrate", "mexico", "miles", "fall"],
        evidenceTerms: ["3,000", "mexico", "miles", "south"],
        probe:
          "You are telling about the trip. Which source said it, and what exact facts did it give?",
        good: "The source and an exact fact",
      },
      {
        id: "food",
        label: "food",
        terms: ["milkweed", "eat", "eats", "food", "leaves"],
        evidenceTerms: ["only", "milkweed", "leaves"],
        probe: "You found something about food. Which source told you?",
        good: "The name of the source",
      },
      {
        id: "size",
        label: "size",
        terms: ["small", "weigh", "weighs", "gram", "wings", "inches", "light"],
        evidenceTerms: ["gram", "4 inches", "less than"],
        probe:
          "You are telling about the size. Which source gave that, and what number did it use?",
        good: "The source and a number",
      },
    ],
    partner: {
      name: "Ms. Lopez",
      glyph: "👩🏻‍🏫",
      opening:
        "Our class newsletter needs a short report about monarch butterflies. You found two sources. What did you learn?",
      noCause: "That is a good fact. What is the main idea you learned about monarchs?",
      noEvidence: "Which source told you that?",
      thanks: "Thank you. Now you can write your report using both sources.",
    },
    respond: {
      prompt: "Tell Ms. Lopez one main idea about monarchs and name the source it came from.",
      minWords: 14,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "follow",
      title: "Ms. Lopez explains how to research",
      script: [
        { id: "u1", text: "Here is how to research a topic with two sources.", signal: "research" },
        { id: "u2", text: "First, write the question you want to answer.", signal: "First" },
        {
          id: "u3",
          text: "Next, find two sources, such as a book and a poster.",
          signal: "Next",
        },
        {
          id: "u4",
          text: "Then, write notes in your own words and name each source.",
          signal: "Then",
        },
        {
          id: "u5",
          text: "Finally, put your facts together and tell what you learned.",
          signal: "Finally",
        },
      ],
      items: [
        { id: "question", label: "Write your question", glyph: "❓" },
        { id: "find", label: "Find two sources", glyph: "📚" },
        { id: "notes", label: "Write notes and name each source", glyph: "📝" },
        { id: "tell", label: "Put the facts together", glyph: "🧩" },
      ],
      targets: [
        { id: "p1", label: "Step 1" },
        { id: "p2", label: "Step 2" },
        { id: "p3", label: "Step 3" },
        { id: "p4", label: "Step 4" },
      ],
      expect: [
        { item: "question", target: "p1", utterance: "u2" },
        { item: "find", target: "p2", utterance: "u3" },
        { item: "notes", target: "p3", utterance: "u4" },
        { item: "tell", target: "p4", utterance: "u5" },
      ],
      visuals: {
        u2: "A question mark above a blank page",
        u3: "A book and a poster side by side",
        u4: "A note card with a book icon in the corner",
        u5: "Two note cards joined into one paragraph",
      },
      xray: {
        keywords: ["research", "two sources", "notes", "your own words"],
        sequence: ["First", "Next", "Then", "Finally"],
        cause: [],
        referents: [{ phrase: "each source", means: "the book and the poster" }],
      },
      final: {
        mode: "sort",
        title: "Main idea or detail?",
        script: [
          { id: "f1", text: "Let's sort what a student wrote into main ideas and details." },
          {
            id: "f2",
            text: "The main idea of the first paragraph is that monarchs change a lot as they grow.",
            signal: "main idea",
          },
          {
            id: "f3",
            text: "One detail is that a monarch egg is about the size of a pinhead.",
            signal: "One detail",
          },
          {
            id: "f4",
            text: "The main idea of the second paragraph is that monarchs travel far in the fall.",
            signal: "main idea",
          },
          {
            id: "f5",
            text: "One detail is that some monarchs fly up to 3,000 miles to Mexico.",
            signal: "One detail",
          },
        ],
        items: [
          { id: "grow", label: "Monarchs change a lot as they grow", glyph: "🐛" },
          { id: "egg", label: "An egg is the size of a pinhead", glyph: "🥚" },
          { id: "travel", label: "Monarchs travel far in the fall", glyph: "🦋" },
          { id: "miles", label: "Some fly up to 3,000 miles", glyph: "🗺️" },
        ],
        targets: [
          { id: "main", label: "Main idea" },
          { id: "detail", label: "Detail" },
        ],
        expect: [
          { item: "grow", target: "main", utterance: "f2" },
          { item: "egg", target: "detail", utterance: "f3" },
          { item: "travel", target: "main", utterance: "f4" },
          { item: "miles", target: "detail", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Monarch Butterflies: Notes From Two Sources",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "Monarch butterflies are small insects that travel very far.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "The library book says monarchs in the eastern United States fly south every fall.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "The class poster says some monarchs fly up to 3,000 miles to the mountains of Mexico.",
        },
        {
          id: "s4",
          role: "evidence",
          supports: ["s1"],
          text: "The poster also says an adult monarch weighs less than one gram, so it is lighter than a paper clip.",
        },
        {
          id: "s5",
          role: "detail",
          text: "The library book has a picture of a caterpillar on a leaf.",
        },
        {
          id: "s6",
          role: "detail",
          text: "The book also says caterpillars eat only milkweed leaves.",
        },
        { id: "s7", role: "detail", text: "The class poster is orange and black." },
        { id: "s8", role: "background", text: "Ms. Lopez helped the class find both sources." },
        {
          id: "s9",
          role: "claim",
          text: "Monarchs are more beautiful than any other butterfly.",
        },
      ],
      claimOptions: ["s1", "s9"],
      challenge: {
        type: "evidence",
        claim: "s1",
        valid: ["s2", "s3", "s4"],
        minValid: 2,
        weak: ["s5", "s6", "s7", "s8"],
        explainFrame: "This fact from the ___ shows the claim is true because ___.",
        explainTerms: ["because", "shows", "so", "says"],
        transfer: {
          passage: [
            { id: "t1", role: "claim", text: "Honey bees are hard workers." },
            {
              id: "t2",
              role: "evidence",
              text: "The library book says a worker bee visits up to 100 flowers on one trip.",
            },
            {
              id: "t3",
              role: "evidence",
              text: "The website says one bee makes only about one-twelfth of a teaspoon of honey in its whole life, so it takes hundreds of bees to fill a jar.",
            },
            { id: "t4", role: "detail", text: "The library book has a yellow cover." },
            {
              id: "t5",
              role: "detail",
              text: "The website was made by a beekeeping club.",
            },
            {
              id: "t6",
              role: "background",
              text: "Ms. Lopez found the website on the library computer.",
            },
          ],
          claim: "t1",
          valid: ["t2", "t3"],
          minValid: 2,
          weak: ["t4", "t5", "t6"],
        },
      },
      refs: [{ sentence: "s4", phrase: "it", means: "an adult monarch" }],
      layers: {
        meaning: [
          { s: "s1", phrase: "travel very far", label: "the main idea the claim names" },
          { s: "s3", phrase: "up to 3,000 miles", label: "evidence: a number from a source" },
        ],
        discourse: [
          { s: "s4", phrase: "also", label: "adds another fact from the same source" },
          { s: "s4", phrase: "so", label: "links a fact to its result" },
        ],
        sentence: [{ s: "s2", phrase: "The library book says", label: "names the source" }],
        word: [
          {
            s: "s2",
            phrase: "fall",
            label: "word with two meanings",
            def: "the season after summer",
          },
          { s: "s4", phrase: "weighs", label: "science word", def: "has a certain heaviness" },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "discourse",
      title: "Build a report paragraph",
      units: [
        {
          id: "u1",
          text: "Monarch butterflies are small insects that make a very long trip.",
          role: "topic",
        },
        { id: "u2", text: "The library book says they fly south every fall.", role: "detail" },
        {
          id: "u3",
          text: "The poster says some of them fly up to 3,000 miles to Mexico.",
          role: "detail",
        },
        {
          id: "u4",
          text: "In conclusion, monarchs are tiny travelers with a big journey.",
          role: "close",
        },
      ],
      order: ["u1", "u2", "u3", "u4"],
      alt: [["u1", "u3", "u2", "u4"]],
      transfer: {
        units: [
          {
            id: "t1",
            text: "Honey bees are busy insects that work together in a hive.",
            role: "topic",
          },
          {
            id: "t2",
            text: "The book says a worker bee visits up to 100 flowers on one trip.",
            role: "detail",
          },
          {
            id: "t3",
            text: "The website says one bee makes only a tiny bit of honey in its whole life.",
            role: "detail",
          },
          {
            id: "t4",
            text: "In conclusion, it takes many bees working together to make honey.",
            role: "close",
          },
        ],
        order: ["t1", "t2", "t3", "t4"],
        alt: [["t1", "t3", "t2", "t4"]],
      },
    },
    {
      kind: "build",
      module: "expand",
      title: "Transform a sentence",
      base: "Monarchs fly.",
      needs: [
        {
          id: "where",
          label: "Tell where or when",
          test: {
            terms: ["south", "north", "mexico", "fall", "winter", "canada", "mountains", "summer"],
          },
        },
        {
          id: "number",
          label: "Add an exact number or amount",
          test: {
            terms: ["miles", "3,000", "thousand", "four", "gram", "inches", "4", "one"],
          },
        },
        { id: "source", label: "Name your source", test: { connectorJob: "evidence" } },
      ],
      altConnectors: [
        {
          word: "according to",
          note: "According to starts a sentence with the source: According to the poster, monarchs fly far.",
        },
        {
          word: "the text says",
          note: "The text says names a source first and then gives its fact.",
        },
      ],
      transfer: {
        base: "Honey bees work.",
        needs: [
          {
            id: "detail",
            label: "Add an exact detail",
            test: {
              terms: [
                "flowers",
                "honey",
                "hive",
                "hundred",
                "100",
                "teaspoon",
                "thousands",
                "wings",
              ],
            },
          },
          { id: "source", label: "Name your source", test: { connectorJob: "evidence" } },
        ],
      },
    },
  ],
  communicate: {
    kind: "compose",
    mode: "write",
    prompt:
      "Write a short report about monarch butterflies for the class newsletter. Tell the main idea, add facts from both sources, name which source each fact came from, and finish with a closing sentence.",
    audience: ["Readers of the class newsletter", "Lectores del boletín de la clase"],
    genre: "report",
    topicTerms: [
      "monarch",
      "butterfly",
      "caterpillar",
      "milkweed",
      "Mexico",
      "miles",
      "fall",
      "stages",
      "gram",
    ],
    sourceTerms: [
      "library book",
      "class poster",
      "3,000 miles",
      "four stages",
      "milkweed",
      "one gram",
    ],
    evidenceBank: [
      {
        id: "a1",
        text: "Source A (book): a monarch goes through four stages: egg, caterpillar, chrysalis and butterfly.",
        kind: "fact",
      },
      {
        id: "a2",
        text: "Source A (book): the caterpillar eats only milkweed leaves.",
        kind: "fact",
      },
      { id: "a3", text: "Source A (book): in the fall, monarchs fly south.", kind: "fact" },
      {
        id: "b1",
        text: "Source B (poster): some monarchs fly up to 3,000 miles to the mountains of Mexico.",
        kind: "number",
      },
      {
        id: "b2",
        text: "Source B (poster): an adult monarch weighs less than one gram.",
        kind: "number",
      },
      {
        id: "b3",
        text: "Source B (poster): a monarch's wings measure about 4 inches from tip to tip.",
        kind: "number",
      },
    ],
    organizer: ["topic", "details", "organize", "close"],
    readerQuestions: {
      topic: "What is your report about? Tell me the main idea in one sentence.",
      details: "Which exact facts or numbers did you find?",
      organize: "Which source did each fact come from, and which word connects your facts?",
      close: "What is the one idea you want readers to remember?",
    },
    minWords: 35,
  },
  improve: {
    models: {
      topic: "Monarch butterflies are small insects that travel very far.",
      details: "The poster says some monarchs fly up to 3,000 miles to Mexico.",
      organize:
        "The book says monarchs fly south in the fall, and the poster also says they weigh less than a gram.",
      close: "In conclusion, monarchs are tiny insects with a very long journey.",
    },
    whys: [
      {
        id: "why-topic",
        text: "It tells my reader the main idea first, so they know what the report is about.",
        moves: ["topic"],
      },
      {
        id: "why-source",
        text: "It gives an exact fact and says where it came from, so my reader can trust it.",
        moves: ["details"],
      },
      {
        id: "why-organize",
        text: "It puts facts from two sources together with signal words, so my reader sees how they connect.",
        moves: ["organize"],
      },
      {
        id: "why-close",
        text: "It ends with my main point, so my reader remembers it.",
        moves: ["close"],
      },
    ],
  },
  show: {
    kind: "converse",
    mode: "discuss",
    prompt:
      "New situation: You are reporting on sea turtles. Source A, a library book, says a mother sea turtle digs a nest on the beach and lays about 100 eggs. The eggs hatch after about two months. Source B, an aquarium website, says the babies crawl to the ocean at night, and scientists think only about 1 in 1,000 grows up. Tell your teacher the main idea and the details from both sources, and say which source each detail came from.",
    partner: {
      name: "Mr. Grant",
      glyph: "👨🏼‍🏫",
      role: ["Your science teacher", "Tu maestro de ciencias"],
      opening: "You read two sources about sea turtles. What did you learn? Tell me your report.",
    },
    topicTerms: ["sea turtle", "nest", "eggs", "beach", "ocean", "babies", "hatch", "source"],
    sourceTerms: [
      "100 eggs",
      "two months",
      "at night",
      "1 in 1,000",
      "library book",
      "aquarium website",
    ],
    lines: [
      {
        id: "nest",
        terms: ["nest", "eggs", "beach", "dig", "digs", "lay", "lays", "hatch", "hatches"],
        evidenceTerms: ["100", "two months", "beach"],
        ack: "So you are telling me about the nest and the eggs.",
        probe: "Which source told you that, and what exact numbers did it give?",
        close: "The source and an exact number",
      },
      {
        id: "crawl",
        terms: ["crawl", "crawls", "night", "ocean", "sea", "babies", "hatchlings"],
        evidenceTerms: ["night", "ocean"],
        ack: "So you are telling me about the babies and their trip to the ocean.",
        probe: "Which source said it, and when does the trip happen?",
        close: "The source and a time",
      },
      {
        id: "survive",
        terms: ["survive", "survives", "grow", "grows", "adult", "adults", "1,000", "thousand"],
        evidenceTerms: ["1 in 1,000", "one in a thousand", "1,000", "thousand"],
        ack: "So you are telling me how many babies grow up.",
        probe: "What number did the source give, and which source was it?",
        close: "The source and the number",
      },
    ],
    followUps: {
      topic: "Begin with one sentence that tells me the main idea of your report.",
      details: "Which exact number or fact from a source would make that clearer?",
      organize:
        "Which source did each fact come from? Add a word that shows how your facts connect.",
      close: "What is the one idea you want me to remember about sea turtles?",
    },
    maxTurns: 3,
    minWords: 25,
  },
};

const g68 = {
  environment: "library",
  context: {
    title: ["The Erie Canal Report", "El informe del Canal Erie"],
    premise:
      "The Whitman Middle School history page needs a short report on the Erie Canal. Mr. Adeyemi, the school librarian, has pulled a textbook page, a shipping-cost table, a population chart and a student blog for the class to combine.",
    cast: [
      {
        id: "adeyemi",
        name: "Mr. Adeyemi",
        role: ["School librarian", "Bibliotecario escolar"],
        glyph: "👨🏿‍🏫",
      },
      {
        id: "lena",
        name: "Lena",
        role: ["Student researcher", "Investigadora estudiantil"],
        glyph: "👩🏼",
      },
    ],
  },
  vocab: [
    [
      "source",
      "a person, text or data set that provides information",
      "fuente: persona, texto o conjunto de datos que da información",
    ],
    [
      "synthesize",
      "to combine information from several sources into one idea",
      "sintetizar: combinar información de varias fuentes en una sola idea",
    ],
    [
      "reliable",
      "trustworthy because it gives evidence that can be checked",
      "confiable: digno de confianza porque da evidencia que se puede comprobar",
    ],
    ["cite", "to name the source of a fact", "citar: nombrar la fuente de un dato"],
    [
      "main idea",
      "the central point a text or report makes",
      "idea principal: el punto central de un texto o informe",
    ],
    [
      "supporting detail",
      "a fact that backs up the main idea",
      "detalle de apoyo: dato que respalda la idea principal",
    ],
    [
      "evidence",
      "information that supports a conclusion",
      "evidencia: información que apoya una conclusión",
    ],
    [
      "freight",
      "goods that are shipped from one place to another",
      "carga: mercancías que se transportan de un lugar a otro",
    ],
  ],
  frames: {
    A: [
      "According to ___, ___.",
      "___ shows that ___; furthermore, ___.",
      "The sources agree that ___, but only ___ gives numbers.",
      "Overall, the evidence shows ___.",
    ],
    B: ["According to ___, ___.", "Overall, ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "The history page needs a report on the Erie Canal. Which source answers each question, and which sources can a reader trust?",
    objects: [
      {
        id: "textbook",
        label: "History textbook",
        glyph: "📘",
        x: 18,
        y: 28,
        relevant: true,
        note: "Source A, a history textbook: the Erie Canal opened in 1825. It is 363 miles long and links the Hudson River to Lake Erie. The first canal was 40 feet wide and 4 feet deep.",
      },
      {
        id: "table",
        label: "Freight-cost table",
        glyph: "📊",
        x: 62,
        y: 24,
        relevant: true,
        note: "Source B, a freight-cost table: moving one ton of freight from Buffalo to New York City cost about $100 before the canal and about $10 after it opened.",
      },
      {
        id: "chart",
        label: "Population chart",
        glyph: "📈",
        x: 24,
        y: 70,
        relevant: true,
        note: "Source C, a population chart: Buffalo had about 2,000 people in 1820 and about 18,000 in 1840.",
      },
      {
        id: "blog",
        label: "Student blog",
        glyph: "💬",
        x: 70,
        y: 70,
        relevant: true,
        note: "Source D, a student blog: “The Erie Canal was the coolest thing ever built!” The post gives no numbers and names no source.",
      },
      {
        id: "cart",
        label: "Book cart",
        glyph: "📚",
        x: 90,
        y: 90,
        relevant: false,
        note: "A cart of returned science-fiction novels waits by the door.",
      },
    ],
    controls: [
      {
        id: "question",
        label: "Question",
        initial: "ship",
        options: [
          { id: "ship", label: "How did shipping change?" },
          { id: "city", label: "How did cities change?" },
        ],
      },
      {
        id: "source",
        label: "Source",
        initial: "textbook",
        options: [
          { id: "textbook", label: "History textbook" },
          { id: "table", label: "Freight-cost table" },
          { id: "chart", label: "Population chart" },
        ],
      },
    ],
    outcomes: [
      {
        when: { question: "ship", source: "textbook" },
        mood: "warn",
        key: "ship-textbook",
        state:
          "The textbook says the canal opened in 1825 and joined the Hudson River to Lake Erie, but it gives no shipping prices.",
      },
      {
        when: { question: "ship", source: "table" },
        mood: "good",
        key: "ship-table",
        state:
          "The table answers it: the cost of moving a ton of freight from Buffalo to New York City fell from about $100 to about $10.",
      },
      {
        when: { question: "ship", source: "chart" },
        mood: "bad",
        key: "ship-chart",
        state: "The chart shows only populations. It does not mention shipping prices.",
      },
      {
        when: { question: "city", source: "textbook" },
        mood: "warn",
        key: "city-textbook",
        state: "The textbook says towns grew along the canal, but it gives no population numbers.",
      },
      {
        when: { question: "city", source: "table" },
        mood: "bad",
        key: "city-table",
        state: "The table lists only shipping prices. It says nothing about the size of cities.",
      },
      {
        when: { question: "city", source: "chart" },
        mood: "good",
        key: "city-chart",
        state:
          "The chart answers it: Buffalo grew from about 2,000 people in 1820 to about 18,000 in 1840.",
      },
    ],
    collect: 4,
    variables: [
      {
        id: "route",
        label: "the canal itself",
        terms: [
          "canal",
          "built",
          "opened",
          "1825",
          "miles",
          "hudson",
          "erie",
          "route",
          "connect",
          "linked",
        ],
        evidenceTerms: ["363", "1825", "hudson river", "lake erie"],
        probe:
          "You are describing the canal itself. Which source gave these facts, and which exact details could a reader check?",
        good: "The source and exact details",
      },
      {
        id: "cost",
        label: "shipping costs",
        terms: ["cost", "price", "cheaper", "shipping", "freight", "ton", "money", "trade"],
        evidenceTerms: ["$100", "$10", "100 dollars", "10 dollars", "table"],
        probe:
          "You are describing shipping costs. Which source gave them, and what did the numbers look like before and after?",
        good: "The source and a before-and-after comparison",
      },
      {
        id: "growth",
        label: "city growth",
        terms: ["city", "cities", "population", "grew", "growth", "buffalo", "people", "towns"],
        evidenceTerms: ["2,000", "18,000", "1820", "1840", "chart"],
        probe:
          "You are describing how cities changed. Which source gave you that, and over what years?",
        good: "The source and a time span",
      },
      {
        id: "sources",
        label: "the quality of the sources",
        terms: [
          "source",
          "sources",
          "blog",
          "opinion",
          "textbook",
          "table",
          "chart",
          "reliable",
          "trust",
        ],
        evidenceTerms: ["no numbers", "no source", "table", "chart", "textbook"],
        probe:
          "You are judging the sources. What does each one offer a reader, and which would you trust most? Why?",
        good: "A reason for trusting a source",
      },
    ],
    partner: {
      name: "Mr. Adeyemi",
      glyph: "👨🏿‍🏫",
      opening:
        "The school history page needs a short report on the Erie Canal. You have a textbook page, a cost table, a population chart and a student blog. What can you tell me?",
      noCause:
        "That is a useful fact. What is the main idea you would put at the top of the report?",
      noEvidence: "Which source supports that, and what exact detail does it give?",
      thanks: "Thank you. A report that names its sources is one that readers can check.",
    },
    respond: {
      prompt:
        "Tell Mr. Adeyemi one main idea about the canal and the source that supports it. Include a number from that source.",
      minWords: 18,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "sort",
      title: "Mr. Adeyemi reads from two sources",
      script: [
        {
          id: "u1",
          text: "I will read from two sources: first the textbook, then the cost table.",
          signal: "two sources",
        },
        {
          id: "u2",
          text: "According to the textbook, the Erie Canal opened in 1825.",
          signal: "According to",
        },
        {
          id: "u3",
          text: "The textbook also says that the canal is 363 miles long and links the Hudson River to Lake Erie.",
          signal: "also",
        },
        {
          id: "u4",
          text: "The cost table lists the price of shipping one ton of freight from Buffalo to New York City.",
          signal: "The cost table",
        },
        {
          id: "u5",
          text: "Before the canal, the price was about 100 dollars, but after the canal, it was about 10 dollars.",
          signal: "but",
        },
      ],
      items: [
        { id: "opened", label: "Opened in 1825", glyph: "📅" },
        { id: "miles", label: "363 miles long", glyph: "📏" },
        { id: "links", label: "Links the Hudson River to Lake Erie", glyph: "🗺️" },
        { id: "before", label: "About $100 a ton before the canal", glyph: "💵" },
        { id: "after", label: "About $10 a ton after the canal", glyph: "🪙" },
      ],
      targets: [
        { id: "textbook", label: "Textbook" },
        { id: "table", label: "Cost table" },
      ],
      expect: [
        { item: "opened", target: "textbook", utterance: "u2" },
        { item: "miles", target: "textbook", utterance: "u3" },
        { item: "links", target: "textbook", utterance: "u3" },
        { item: "before", target: "table", utterance: "u5" },
        { item: "after", target: "table", utterance: "u5" },
      ],
      visuals: {
        u2: "A textbook page with the year 1825 circled",
        u3: "A map line between a river and a lake",
        u4: "A table with two price columns",
        u5: "Two price tags, one large and one small",
      },
      xray: {
        keywords: ["According to", "textbook", "cost table", "before", "after"],
        sequence: ["first", "then", "before", "after"],
        cause: [],
        referents: [{ phrase: "it", means: "the price of shipping one ton of freight" }],
      },
      final: {
        mode: "arrange",
        title: "The canal timeline",
        script: [
          { id: "f1", text: "Here is the timeline from the textbook." },
          {
            id: "f2",
            text: "First, construction began in 1817 near Rome, New York.",
            signal: "First",
          },
          { id: "f3", text: "Next, the first section opened in 1819.", signal: "Next" },
          {
            id: "f4",
            text: "Then, in 1825, the whole canal opened from the Hudson River to Lake Erie.",
            signal: "Then",
          },
          {
            id: "f5",
            text: "Finally, by 1840, Buffalo had grown to about 18,000 people.",
            signal: "Finally",
          },
        ],
        items: [
          { id: "begin", label: "Construction begins in 1817", glyph: "⛏️" },
          { id: "section", label: "First section opens in 1819", glyph: "🚧" },
          { id: "whole", label: "Whole canal opens in 1825", glyph: "🚤" },
          { id: "grown", label: "Buffalo reaches about 18,000 people in 1840", glyph: "🏙️" },
        ],
        targets: [
          { id: "p1", label: "Step 1" },
          { id: "p2", label: "Step 2" },
          { id: "p3", label: "Step 3" },
          { id: "p4", label: "Step 4" },
        ],
        expect: [
          { item: "begin", target: "p1", utterance: "f2" },
          { item: "section", target: "p2", utterance: "f3" },
          { item: "whole", target: "p3", utterance: "f4" },
          { item: "grown", target: "p4", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Notes From Four Sources on the Erie Canal",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "The Erie Canal transformed New York's economy by making trade cheaper and cities larger.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "According to the textbook, the canal opened in 1825, which gave farmers around the Great Lakes a water route to the Atlantic Ocean.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "The cost table shows that shipping one ton of freight from Buffalo to New York City fell from about $100 to about $10.",
        },
        {
          id: "s4",
          role: "evidence",
          supports: ["s1"],
          text: "The population chart shows Buffalo growing from about 2,000 people in 1820 to about 18,000 in 1840.",
        },
        {
          id: "s5",
          role: "detail",
          text: "The first canal was 40 feet wide and 4 feet deep.",
        },
        {
          id: "s6",
          role: "background",
          text: "Workers dug much of the canal by hand, using shovels and animal-powered equipment.",
        },
        {
          id: "s7",
          role: "detail",
          text: "A student blog calls the canal “the coolest thing ever built,” but it gives no numbers or sources.",
        },
        {
          id: "s8",
          role: "claim",
          text: "The Erie Canal was the most important project in American history.",
        },
        {
          id: "s9",
          role: "conclusion",
          text: "Therefore, the textbook, the cost table and the population chart together show that the canal reshaped the region's economy.",
        },
      ],
      claimOptions: ["s1", "s8"],
      challenge: {
        type: "evidence",
        claim: "s1",
        valid: ["s2", "s3", "s4"],
        minValid: 2,
        weak: ["s5", "s6", "s7", "s9"],
        explainFrame: "This source supports the claim because it provides ___, which shows ___.",
        explainTerms: ["because", "shows", "which shows", "evidence"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "claim",
              text: "Millbrook's recycling program reduced the amount of trash the town sends to the landfill.",
            },
            {
              id: "t2",
              role: "evidence",
              text: "According to the city report, landfill trash fell from 9,000 tons in 2019 to 6,000 tons in 2023.",
            },
            {
              id: "t3",
              role: "evidence",
              text: "A survey by the school green club found that 8 of every 10 households now sort their recycling.",
            },
            { id: "t4", role: "detail", text: "The recycling trucks are painted green." },
            {
              id: "t5",
              role: "detail",
              text: "A local blogger says recycling is boring but offers no data.",
            },
            {
              id: "t6",
              role: "background",
              text: "The program began under the previous mayor.",
            },
          ],
          claim: "t1",
          valid: ["t2", "t3"],
          minValid: 2,
          weak: ["t4", "t5", "t6"],
        },
      },
      refs: [
        { sentence: "s2", phrase: "which", means: "the opening of the canal" },
        { sentence: "s7", phrase: "it", means: "the student blog" },
      ],
      layers: {
        meaning: [
          {
            s: "s1",
            phrase: "making trade cheaper and cities larger",
            label: "the two changes the claim names",
          },
          {
            s: "s3",
            phrase: "fell from about $100 to about $10",
            label: "evidence: a before-and-after measurement",
          },
        ],
        discourse: [
          { s: "s2", phrase: "According to", label: "names the source" },
          { s: "s7", phrase: "but", label: "turns to a weakness of this source" },
          { s: "s9", phrase: "Therefore", label: "signals the conclusion" },
        ],
        sentence: [
          {
            s: "s3",
            phrase: "fell from about $100 to about $10",
            label: "verb phrase that shows change over time",
          },
        ],
        word: [
          { s: "s1", phrase: "transformed", label: "precise verb", def: "changed completely" },
          { s: "s3", phrase: "freight", label: "trade word", def: "goods that are shipped" },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "discourse",
      title: "Organize a report paragraph",
      units: [
        {
          id: "u1",
          text: "The Erie Canal changed New York by making trade cheaper and helping cities grow.",
          role: "topic",
        },
        {
          id: "u2",
          text: "According to the textbook, the canal opened in 1825 and linked the Hudson River to Lake Erie.",
          role: "detail",
        },
        {
          id: "u3",
          text: "Furthermore, the cost table shows that shipping a ton of freight fell from about $100 to about $10.",
          role: "detail",
        },
        {
          id: "u4",
          text: "In addition, the population chart shows Buffalo growing from about 2,000 people in 1820 to about 18,000 in 1840.",
          role: "detail",
        },
        {
          id: "u5",
          text: "Overall, lower prices and growing cities show how one project can reshape a region.",
          role: "close",
        },
      ],
      order: ["u1", "u2", "u3", "u4", "u5"],
      alt: [["u1", "u2", "u4", "u3", "u5"]],
      transfer: {
        units: [
          {
            id: "t1",
            text: "Millbrook's recycling program reduced trash and changed household habits.",
            role: "topic",
          },
          {
            id: "t2",
            text: "According to the city report, landfill trash fell from 9,000 tons in 2019 to 6,000 tons in 2023.",
            role: "detail",
          },
          {
            id: "t3",
            text: "Furthermore, a green club survey found that 8 of every 10 households now sort their recycling.",
            role: "detail",
          },
          {
            id: "t4",
            text: "Overall, the data from both sources show that the program worked.",
            role: "close",
          },
        ],
        order: ["t1", "t2", "t3", "t4"],
        alt: [["t1", "t3", "t2", "t4"]],
      },
    },
    {
      kind: "build",
      module: "combine",
      title: "Combining information from two sources",
      pair: [
        "The textbook says the canal opened in 1825.",
        "The cost table says shipping fell to about $10 a ton.",
      ],
      relation: "addition",
      keep: ["textbook", "1825", "table", "shipping"],
      transfer: {
        pair: [
          "The city report says landfill trash fell to 6,000 tons.",
          "The green club survey says 8 of 10 households sort recycling.",
        ],
        relation: "addition",
        keep: ["report", "6,000", "survey", "households"],
      },
    },
  ],
  communicate: {
    kind: "compose",
    mode: "write",
    prompt:
      "Write a short report for the school history page about the Erie Canal. Combine information from at least two of the sources, name each source, organize your ideas with signal words, and end with a conclusion.",
    audience: [
      "Students and families reading the school history page",
      "Estudiantes y familias que leen la página de historia de la escuela",
    ],
    genre: "report",
    topicTerms: [
      "canal",
      "Erie",
      "Hudson",
      "Buffalo",
      "freight",
      "cost",
      "population",
      "trade",
      "1825",
    ],
    sourceTerms: ["363 miles", "1825", "$100", "$10", "2,000", "18,000"],
    evidenceBank: [
      {
        id: "a1",
        text: "Source A (textbook): the Erie Canal opened in 1825 and is 363 miles long, linking the Hudson River to Lake Erie.",
        kind: "fact",
      },
      {
        id: "a2",
        text: "Source A (textbook): the first canal was 40 feet wide and 4 feet deep.",
        kind: "number",
      },
      {
        id: "b1",
        text: "Source B (cost table): shipping one ton of freight from Buffalo to New York City cost about $100 before the canal and about $10 after.",
        kind: "number",
      },
      {
        id: "c1",
        text: "Source C (population chart): Buffalo grew from about 2,000 people in 1820 to about 18,000 in 1840.",
        kind: "number",
      },
      {
        id: "d1",
        text: "Source D (student blog): “The Erie Canal was the coolest thing ever built!” It gives no numbers and names no source.",
        kind: "quote",
      },
    ],
    organizer: ["topic", "details", "organize", "close"],
    readerQuestions: {
      topic: "What is the main idea of your report? Can you state it in one sentence?",
      details: "Which exact facts or numbers from the sources support that idea?",
      organize: "How do you connect information from different sources, and which words show it?",
      close: "What conclusion should a reader draw from all the sources together?",
    },
    minWords: 80,
  },
  improve: {
    models: {
      topic: "The Erie Canal changed New York by making trade cheaper and helping cities grow.",
      details:
        "The cost table shows that shipping a ton of freight fell from about $100 to about $10.",
      organize:
        "According to the textbook, the canal opened in 1825; furthermore, the cost table and the population chart show its effects on trade and cities.",
      close:
        "Overall, the evidence from three sources shows that the canal reshaped the economy of the region.",
    },
    whys: [
      {
        id: "why-topic",
        text: "It states the main idea up front, so the reader knows what the sources will show.",
        moves: ["topic"],
      },
      {
        id: "why-cite",
        text: "It cites a number and names its source, so the reader can check the evidence.",
        moves: ["details"],
      },
      {
        id: "why-synthesis",
        text: "It links different sources with signal words, so the reader sees one organized picture.",
        moves: ["organize"],
      },
      {
        id: "why-close",
        text: "It ends with a conclusion that draws the sources together, so the main point stays with the reader.",
        moves: ["close"],
      },
    ],
  },
  show: {
    kind: "converse",
    mode: "discuss",
    prompt:
      "New situation: You are reporting to the science club on coral reefs. Source A, a science textbook, says coral reefs cover less than 1 percent of the ocean floor but are home to about 25 percent of ocean species. Source B, an ocean research report, says the world lost about 14 percent of its coral reefs between 2009 and 2019. Present a main idea, combine details from both sources, and say which source each detail comes from.",
    partner: {
      name: "Ms. Ito",
      glyph: "👩🏻‍🔬",
      role: ["Science club advisor", "Asesora del club de ciencias"],
      opening:
        "The club is planning a presentation on coral reefs. You read two sources. Tell me what the report should say.",
    },
    topicTerms: ["coral", "reefs", "ocean", "species", "percent", "source", "textbook", "report"],
    sourceTerms: [
      "less than 1 percent",
      "25 percent",
      "14 percent",
      "2009",
      "2019",
      "textbook",
      "research report",
    ],
    lines: [
      {
        id: "importance",
        terms: ["species", "home", "25", "ocean", "life", "biodiversity", "habitat"],
        evidenceTerms: ["25 percent", "about 25", "species"],
        ack: "So you are describing why coral reefs matter.",
        probe: "Which source gave that, and what exact number did it use?",
        close: "The source and the exact number",
      },
      {
        id: "size",
        terms: ["cover", "covers", "floor", "less", "small", "1 percent", "size"],
        evidenceTerms: ["less than 1", "1 percent", "floor"],
        ack: "So you are describing how much of the ocean the reefs cover.",
        probe:
          "What does the source say, and how does that compare with the number you gave for the species?",
        close: "A comparison between two numbers from the same source",
      },
      {
        id: "loss",
        terms: ["lost", "loss", "decline", "14", "damaged", "disappeared", "2009", "2019"],
        evidenceTerms: ["14 percent", "2009", "2019"],
        ack: "So you are describing how much coral the world has lost.",
        probe: "Which source reported that, and over what years?",
        close: "The source and a time span",
      },
    ],
    followUps: {
      topic: "Begin with one sentence that states the main idea of your report.",
      details: "Which exact number from a source would support that idea?",
      organize:
        "How do the two sources fit together? Add a word that shows how one source adds to the other.",
      close: "What conclusion should the club draw from both sources together?",
    },
    maxTurns: 3,
    minWords: 40,
  },
};

export default {
  id: "m06",
  bands: { "3-5": g35, "6-8": g68 },
};
