// Mission 7 — How Things Work (Unit 3, Explain; lab). Grades 3-5: how a closed jar makes rain (the water cycle).
// Grades 6-8: how a layered water filter cleans cloudy water. Title, goal, WIDA and spiral data live in MISSIONS
// (curriculum.js); family guidance lives in family.js. Task content is English (it is the language practiced);
// titles and roles are bilingual [en, es]. Hints ask questions and never state an answer.
// Feeds m08 (cause and effect with evidence): the same Explain moves, here applied to the steps of a process.

const g35 = {
  environment: "lab",
  context: {
    title: ["Rain in a Jar", "Lluvia en un frasco"],
    premise:
      "Ms. Patel's class built a jar lab. Warm water sits in a closed jar, and drops of water appear on the lid and fall like rain. The class must explain how the jar makes rain.",
    cast: [
      {
        id: "patel",
        name: "Ms. Patel",
        role: ["Science teacher", "Maestra de ciencias"],
        glyph: "👩🏾‍🏫",
      },
      { id: "omar", name: "Omar", role: ["Lab partner", "Compañero de laboratorio"], glyph: "🧒🏽" },
    ],
  },
  vocab: [
    [
      "process",
      "a series of steps that happen in order",
      "proceso: una serie de pasos que suceden en orden",
    ],
    ["step", "one part of a process", "paso: una parte de un proceso"],
    [
      "vapor",
      "water that has turned into a gas you cannot see",
      "vapor: agua convertida en un gas que no se ve",
    ],
    ["evaporate", "to change from a liquid into a gas", "evaporar: pasar de líquido a gas"],
    [
      "condense",
      "to change from a gas into tiny drops of liquid",
      "condensarse: pasar de gas a gotitas de líquido",
    ],
    ["cycle", "steps that repeat again and again", "ciclo: pasos que se repiten una y otra vez"],
    ["sequence", "the order that steps follow", "secuencia: el orden en que van los pasos"],
    ["lid", "the cover on top of a jar", "tapa: la cubierta de arriba de un frasco"],
  ],
  frames: {
    A: [
      "First, ___. Next, ___. Then, ___. Finally, ___.",
      "The water turns into ___ because ___.",
      "The jar shows this: ___.",
    ],
    B: ["First ___; then ___ because ___.", "This happens because ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt: "How does a closed jar of warm water make rain?",
    objects: [
      {
        id: "jar",
        label: "Rain jar",
        glyph: "🫙",
        x: 46,
        y: 50,
        relevant: true,
        note: "A closed glass jar holds warm water. Tiny drops of water cover the inside of the lid. Some drops slide down the glass and fall back into the water.",
      },
      {
        id: "kettle",
        label: "Kettle and tap",
        glyph: "🫖",
        x: 14,
        y: 62,
        relevant: true,
        note: "The water from the kettle feels warm. The water from the tap feels cool.",
      },
      {
        id: "ice",
        label: "Ice bag",
        glyph: "🧊",
        x: 52,
        y: 16,
        relevant: true,
        note: "A bag of ice sits on top of the lid. The lid feels very cold under the bag.",
      },
      {
        id: "notes",
        label: "Omar's notebook",
        glyph: "📓",
        x: 84,
        y: 38,
        relevant: true,
        note: "Omar's notes: At the start the lid was dry. After a while the lid was covered with tiny drops. The pool of water in the jar is a little lower than at the start.",
      },
      {
        id: "thermo",
        label: "Thermometer",
        glyph: "🌡️",
        x: 78,
        y: 70,
        relevant: true,
        note: "The warm water reads 45 degrees Celsius. The top of the lid, under the ice, reads 10 degrees Celsius.",
      },
      {
        id: "markers",
        label: "Pencil box",
        glyph: "✏️",
        x: 14,
        y: 88,
        relevant: false,
        note: "A pencil box with blue and green markers sits on the lab table.",
      },
    ],
    controls: [
      {
        id: "water",
        label: "Water in the jar",
        initial: "cool",
        options: [
          { id: "warm", label: "Warm water" },
          { id: "cool", label: "Cool water" },
        ],
      },
      {
        id: "lid",
        label: "Top of the lid",
        initial: "plain",
        options: [
          { id: "ice", label: "Ice bag on the lid" },
          { id: "plain", label: "No ice" },
        ],
      },
    ],
    outcomes: [
      {
        when: { water: "warm", lid: "ice" },
        mood: "good",
        key: "rain",
        state:
          "After a while the lid is covered with tiny drops. The drops join together, slide down the glass and fall into the water like rain.",
      },
      {
        when: { water: "warm", lid: "plain" },
        mood: "warn",
        key: "few",
        state: "After a while only a few small drops sit on the lid. No drops fall.",
      },
      {
        when: { water: "cool", lid: "ice" },
        mood: "warn",
        key: "dry",
        state: "After a while the lid is almost dry. Only one or two tiny drops show up.",
      },
      {
        when: { water: "cool", lid: "plain" },
        mood: "bad",
        key: "none",
        state: "After a while nothing has changed. The lid is dry and no drops fall.",
      },
    ],
    collect: 3,
    variables: [
      {
        id: "heat",
        label: "the warm water",
        terms: ["warm", "heat", "hot", "evaporate", "evaporates", "vapor", "steam", "rises", "gas"],
        evidenceTerms: ["warm", "cool", "45", "kettle", "tap"],
        probe:
          "You say the warm water matters. What did you see happen with warm water and with cool water?",
        good: "A comparison of warm water and cool water",
      },
      {
        id: "cold",
        label: "the cold lid",
        terms: ["cold", "cool", "ice", "lid", "condense", "condenses", "freezing", "chill"],
        evidenceTerms: ["ice", "10", "lid", "drops"],
        probe:
          "You say the cold lid matters. What happened on the lid with the ice bag and without it?",
        good: "A comparison of the lid with ice and without ice",
      },
      {
        id: "fall",
        label: "the drops falling",
        terms: ["drops", "heavy", "fall", "falls", "drip", "drips", "slide", "rain", "gravity"],
        evidenceTerms: ["join", "heavy", "slide", "glass", "fall"],
        probe: "You are thinking about the drops. What did you see the drops do before they fell?",
        good: "What the drops did first",
      },
    ],
    partner: {
      name: "Ms. Patel",
      glyph: "👩🏾‍🏫",
      opening:
        "Welcome to the jar lab! Rain is falling inside a closed jar. How do you think that happens?",
      noCause: "I hear what you see. Now I need the how. What makes the drops show up on the lid?",
      noEvidence: "What did you see or read in the lab that makes you think so?",
      thanks: "Thank you. Your thinking will help us build our class poster.",
    },
    respond: {
      prompt:
        "Tell Ms. Patel how the jar makes rain. Say what happens first and what happens next.",
      minWords: 12,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "follow",
      title: "Follow the scientist: set up the jar",
      script: [
        { id: "u1", text: "Listen to the scientist and set up the jar lab." },
        {
          id: "u2",
          text: "First, pour warm water into the jar until it is two fingers deep.",
          signal: "First",
        },
        {
          id: "u3",
          text: "Next, put the lid on upside down, so the ice bag can sit in the dip.",
          signal: "Next",
        },
        { id: "u4", text: "Then, set the bag of ice on top of the lid.", signal: "Then" },
        {
          id: "u5",
          text: "Finally, watch the lid and write down what you see.",
          signal: "Finally",
        },
      ],
      items: [
        { id: "pour", label: "Pour in warm water", glyph: "💧" },
        { id: "lid", label: "Put the lid on upside down", glyph: "🫙" },
        { id: "ice", label: "Set the ice bag on the lid", glyph: "🧊" },
        { id: "watch", label: "Watch the lid and write", glyph: "📝" },
      ],
      targets: [
        { id: "p1", label: "Step 1" },
        { id: "p2", label: "Step 2" },
        { id: "p3", label: "Step 3" },
        { id: "p4", label: "Step 4" },
      ],
      expect: [
        { item: "pour", target: "p1", utterance: "u2" },
        { item: "lid", target: "p2", utterance: "u3" },
        { item: "ice", target: "p3", utterance: "u4" },
        { item: "watch", target: "p4", utterance: "u5" },
      ],
      visuals: {
        u2: "A jar with warm water two fingers deep",
        u3: "A lid turned upside down with a dip in the middle",
        u4: "A bag of ice sitting in the dip",
        u5: "An eye looking at the lid and a pencil writing",
      },
      xray: {
        keywords: ["warm water", "lid", "ice bag", "two fingers"],
        sequence: ["First", "Next", "Then", "Finally"],
        cause: ["so"],
        referents: [{ phrase: "the dip", means: "the dent in the middle of the upside-down lid" }],
      },
      final: {
        title: "Start a bean in a bag",
        script: [
          { id: "f1", text: "Now follow the scientist and start a bean in a bag." },
          {
            id: "f2",
            text: "First, wet a paper towel and squeeze out the extra water.",
            signal: "First",
          },
          {
            id: "f3",
            text: "Next, lay the bean seed on the towel and fold the towel over it.",
            signal: "Next",
          },
          {
            id: "f4",
            text: "Then, slide the towel into a clear bag and tape the bag to a sunny window.",
            signal: "Then",
          },
          {
            id: "f5",
            text: "Finally, look at the bean every day and write what changes.",
            signal: "Finally",
          },
        ],
        items: [
          { id: "wet", label: "Wet the paper towel", glyph: "🧻" },
          { id: "fold", label: "Fold the towel over the bean", glyph: "🫘" },
          { id: "tape", label: "Tape the bag to the window", glyph: "🪟" },
          { id: "look", label: "Look every day and write", glyph: "📓" },
        ],
        targets: [
          { id: "p1", label: "Step 1" },
          { id: "p2", label: "Step 2" },
          { id: "p3", label: "Step 3" },
          { id: "p4", label: "Step 4" },
        ],
        expect: [
          { item: "wet", target: "p1", utterance: "f2" },
          { item: "fold", target: "p2", utterance: "f3" },
          { item: "tape", target: "p3", utterance: "f4" },
          { item: "look", target: "p4", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "The Water Cycle: Our Jar and the Sky",
      passage: [
        { id: "s1", role: "claim", text: "Water goes around and around in a cycle." },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "First, the sun warms water in oceans and lakes, and some of the water turns into invisible vapor.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "Next, the vapor rises high into the sky, where it is cold.",
        },
        {
          id: "s4",
          role: "evidence",
          supports: ["s1"],
          text: "Then, the cold air changes the vapor back into tiny drops, and they join to make clouds.",
        },
        {
          id: "s5",
          role: "evidence",
          supports: ["s1"],
          text: "Finally, the drops in a cloud grow heavy and fall as rain or snow.",
        },
        { id: "s6", role: "detail", text: "Oceans hold most of the water on Earth." },
        {
          id: "s7",
          role: "detail",
          text: "Some clouds look like fluffy cotton, and others look like gray blankets.",
        },
        {
          id: "s8",
          role: "conclusion",
          supports: ["s1"],
          text: "After the rain falls, the water flows into rivers and oceans, and the cycle starts again.",
        },
        {
          id: "s9",
          role: "claim",
          text: "The water cycle is the most interesting thing in science.",
        },
      ],
      claimOptions: ["s1", "s9"],
      challenge: {
        type: "sequence",
        claim: "s1",
        valid: ["s2", "s3", "s4", "s5", "s8"],
        minValid: 4,
        weak: ["s6", "s7"],
        explainFrame: "This sentence is a step in the cycle because the time word ___ tells ___.",
        explainTerms: ["because", "first", "next", "then", "finally", "after", "step"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "claim",
              text: "A bean seed grows into a plant in order, one stage at a time.",
            },
            { id: "t2", role: "evidence", text: "First, the seed soaks up water and swells." },
            {
              id: "t3",
              role: "evidence",
              text: "Next, a tiny root pushes down out of the seed.",
            },
            { id: "t4", role: "evidence", text: "Then, a stem pushes up toward the light." },
            {
              id: "t5",
              role: "evidence",
              text: "Finally, the first green leaves open on the stem.",
            },
            {
              id: "t6",
              role: "detail",
              text: "Some bean seeds are white, and others are dark red.",
            },
            {
              id: "t7",
              role: "background",
              text: "A farmer in Ohio sells bean seeds at the market.",
            },
          ],
          claim: "t1",
          valid: ["t2", "t3", "t4", "t5"],
          minValid: 3,
          weak: ["t6", "t7"],
        },
      },
      refs: [
        { sentence: "s3", phrase: "it", means: "the sky" },
        { sentence: "s4", phrase: "they", means: "the tiny drops" },
      ],
      layers: {
        meaning: [
          { s: "s1", phrase: "cycle", label: "the big idea: a process that repeats" },
          { s: "s2", phrase: "invisible vapor", label: "detail: what the water turns into" },
        ],
        discourse: [
          { s: "s2", phrase: "First", label: "starts the sequence" },
          { s: "s5", phrase: "Finally", label: "marks the last step" },
        ],
        sentence: [{ s: "s3", phrase: "where it is cold", label: "a clause that tells where" }],
        word: [
          {
            s: "s2",
            phrase: "vapor",
            label: "science word",
            def: "water that has turned into a gas you cannot see",
          },
          { s: "s5", phrase: "heavy", label: "describing word", def: "weighing a lot" },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "discourse",
      title: "Put the steps in order",
      units: [
        { id: "u1", text: "Warm water gives off invisible vapor.", role: "start" },
        { id: "u2", text: "The vapor rises and touches the cold lid.", role: "step" },
        { id: "u3", text: "The vapor cools and turns into tiny drops.", role: "step" },
        { id: "u4", text: "The drops get heavy and fall back into the jar.", role: "end" },
      ],
      order: ["u1", "u2", "u3", "u4"],
      alt: [],
      connectors: [
        { before: "u1", word: "First" },
        { before: "u2", word: "Next" },
        { before: "u3", word: "Then" },
        { before: "u4", word: "Finally" },
      ],
      transfer: {
        units: [
          { id: "v1", text: "The sun warms the puddle.", role: "start" },
          { id: "v2", text: "Some of the water turns into vapor.", role: "step" },
          { id: "v3", text: "The vapor floats up into the air.", role: "step" },
          { id: "v4", text: "The puddle gets smaller until it is gone.", role: "end" },
        ],
        order: ["v1", "v2", "v3", "v4"],
        alt: [],
        connectors: [
          { before: "v1", word: "First" },
          { before: "v2", word: "Next" },
          { before: "v3", word: "Then" },
          { before: "v4", word: "Finally" },
        ],
      },
    },
    {
      kind: "build",
      module: "connector",
      title: "Connector laboratory",
      gaps: [
        {
          before: "The water is warm,",
          after: "it gives off vapor.",
          relation: "cause",
          options: ["so", "but", "before", "or"],
          ok: ["so"],
        },
        {
          before: "The drops fall",
          after: "they are heavy.",
          relation: "cause",
          options: ["because", "so", "but", "then"],
          ok: ["because"],
        },
        {
          before: "The vapor rises high.",
          after: "the vapor cools and turns into drops.",
          relation: "sequence",
          options: ["Then", "Because", "But", "Or"],
          ok: ["Then"],
        },
      ],
      notes: {
        so: "So shows the result.",
        because: "Because shows the reason.",
        Then: "Then shows what happens next.",
      },
      transfer: {
        gaps: [
          {
            before: "The puddle disappears",
            after: "the water turns into vapor.",
            relation: "cause",
            options: ["because", "so", "but", "then"],
            ok: ["because"],
          },
          {
            before: "The vapor rises into the air.",
            after: "the wind carries it away.",
            relation: "sequence",
            options: ["Then", "Because", "But", "Or"],
            ok: ["Then"],
          },
        ],
      },
    },
  ],
  communicate: {
    kind: "compose",
    mode: "write",
    prompt:
      "Ms. Patel will put your explanation on the class poster. Explain how the closed jar makes rain. Tell the steps in order and say why each step happens.",
    audience: ["Ms. Patel and the class", "La maestra Patel y la clase"],
    genre: "explanation",
    topicTerms: [
      "jar",
      "water",
      "warm",
      "vapor",
      "lid",
      "cold",
      "ice",
      "drops",
      "rain",
      "evaporate",
      "condense",
    ],
    sourceTerms: ["warm water", "vapor", "cold lid", "drops", "fall"],
    evidenceBank: [
      { id: "e1", text: "The water in the jar is warm: 45 degrees Celsius.", kind: "number" },
      { id: "e2", text: "The ice bag makes the lid cold: 10 degrees Celsius.", kind: "number" },
      { id: "e3", text: "Tiny drops of water cover the inside of the lid.", kind: "fact" },
      {
        id: "e4",
        text: "Some drops slide down the glass and fall back into the water.",
        kind: "fact",
      },
      {
        id: "e5",
        text: "Vapor is water that has turned into a gas you cannot see.",
        kind: "fact",
      },
    ],
    organizer: ["phenomenon", "steps", "cause", "result"],
    readerQuestions: {
      phenomenon: "What exactly are you explaining?",
      cause: "What makes that step happen?",
      chain: "What happens next? Which time word shows the order?",
      support: "What did you see in the jar that shows this is true?",
    },
    minWords: 30,
  },
  improve: {
    models: {
      phenomenon: "I will explain how rain forms inside a closed jar of warm water.",
      cause: "The warm water turns into vapor, so the vapor rises toward the lid.",
      chain:
        "First the vapor rises. Then it touches the cold lid, so it turns into tiny drops. Finally the drops get heavy and fall.",
      support:
        "According to Omar's notes, the lid was dry at the start and covered with drops later.",
    },
    whys: [
      {
        id: "why-order",
        text: "It puts the steps in order, so my listener can follow the process.",
        moves: ["chain"],
      },
      {
        id: "why-because",
        text: "It tells why each step happens, so my listener understands how it works.",
        moves: ["cause"],
      },
      {
        id: "why-fact",
        text: "It uses something I saw in the lab, so my listener can trust it.",
        moves: ["support"],
      },
      {
        id: "why-topic",
        text: "It says what I am explaining, so my listener knows the topic.",
        moves: ["phenomenon"],
      },
    ],
  },
  show: {
    kind: "compose",
    mode: "write",
    prompt:
      "New situation: Ms. Patel's class studies how a bean plant makes its food. Facts: The roots soak up water from the soil, and the stem carries the water up to the leaves. The leaves catch sunlight and take in a gas from the air called carbon dioxide. Inside the leaves, the plant uses the sunlight to turn the water and the gas into sugar, which is the plant's food. The plant also gives off oxygen. Write an explanation for a younger student about how the plant makes its food, step by step.",
    audience: ["A younger student", "Un estudiante más pequeño"],
    genre: "explanation",
    topicTerms: ["plant", "roots", "water", "leaves", "sunlight", "sugar", "food", "oxygen", "gas"],
    sourceTerms: ["roots", "stem", "sunlight", "carbon dioxide", "sugar", "oxygen"],
    organizer: ["phenomenon", "steps", "cause", "result"],
    readerQuestions: {
      phenomenon: "What exactly are you explaining?",
      cause: "What makes that step happen?",
      chain: "What happens next? Which time word shows the order?",
      support: "Which fact from the lesson shows this?",
    },
    minWords: 28,
  },
};

const g68 = {
  environment: "lab",
  context: {
    title: ["Clean Water Lab", "Laboratorio de agua limpia"],
    premise:
      "The science club is building a layered filter from a plastic bottle to clean cloudy pond water. Dr. Alvarez, a water engineer, asks the club to explain how the filter works before the science fair.",
    cast: [
      {
        id: "alvarez",
        name: "Dr. Alvarez",
        role: ["Water engineer", "Ingeniera del agua"],
        glyph: "👩🏽‍🔬",
      },
      {
        id: "priya",
        name: "Priya",
        role: ["Science club member", "Miembro del club de ciencias"],
        glyph: "🧑🏾",
      },
    ],
  },
  vocab: [
    [
      "process",
      "a series of actions that lead to a result",
      "proceso: una serie de acciones que llevan a un resultado",
    ],
    [
      "filter",
      "to pass a liquid through a material that traps solid bits",
      "filtrar: pasar un líquido por un material que atrapa partículas sólidas",
    ],
    ["particle", "a very small piece of a solid", "partícula: un trozo muy pequeño de un sólido"],
    [
      "silt",
      "very fine bits of soil carried in water",
      "limo: partículas finas de tierra que arrastra el agua",
    ],
    [
      "adsorb",
      "to hold chemicals on the surface of a material",
      "adsorber: retener sustancias químicas en la superficie de un material",
    ],
    ["pore", "a tiny opening in a material", "poro: una abertura diminuta en un material"],
    ["sequence", "the order in which steps happen", "secuencia: el orden en que ocurren los pasos"],
    [
      "clarity",
      "how clear and see-through something is",
      "claridad: qué tan transparente se ve algo",
    ],
  ],
  frames: {
    A: [
      "First, ___. Next, ___. After that, ___. Finally, ___.",
      "The ___ layer removes ___ because ___.",
      "As a result, the water ___.",
    ],
    B: ["Once ___, ___, which ___.", "The readings show ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "How does a stack of gravel, sand and charcoal turn cloudy pond water into clear water?",
    objects: [
      {
        id: "sample",
        label: "Pond sample",
        glyph: "🧪",
        x: 16,
        y: 26,
        relevant: true,
        note: "The pond sample is brown and cloudy. It holds leaves, mud and a tea-colored tint, and it smells earthy. Through the clarity tube, you can see the black mark only 8 centimeters down.",
      },
      {
        id: "gravel",
        label: "Gravel layer",
        glyph: "🪨",
        x: 46,
        y: 20,
        relevant: true,
        note: "Coarse gravel: the stones are wide, so the gaps between them are wide too. Leaves and twigs get stuck on top, but muddy water runs straight through.",
      },
      {
        id: "sand",
        label: "Fine sand layer",
        glyph: "⏳",
        x: 70,
        y: 34,
        relevant: true,
        note: "Fine sand: the grains are smaller than a grain of salt, so the gaps between them are tiny. Under a magnifier, bits of silt sit stuck between the grains.",
      },
      {
        id: "charcoal",
        label: "Activated charcoal",
        glyph: "⚫",
        x: 80,
        y: 62,
        relevant: true,
        note: "Activated charcoal is black and full of microscopic pores. The label says it holds chemicals that cause color and smell on its surface.",
      },
      {
        id: "tube",
        label: "Clarity tube",
        glyph: "📏",
        x: 36,
        y: 74,
        relevant: true,
        note: "Clarity tube: a black mark sits at the bottom. The deeper you can still see the mark through the water, the clearer the water is.",
      },
      {
        id: "goggles",
        label: "Safety goggles",
        glyph: "🥽",
        x: 10,
        y: 88,
        relevant: false,
        note: "Safety goggles hang on a hook by the lab door. Everyone wears them when pouring.",
      },
    ],
    controls: [
      {
        id: "sand",
        label: "Fine sand layer",
        initial: "none",
        options: [
          { id: "sand", label: "Add fine sand" },
          { id: "none", label: "No sand" },
        ],
      },
      {
        id: "charcoal",
        label: "Activated charcoal layer",
        initial: "none",
        options: [
          { id: "charcoal", label: "Add charcoal" },
          { id: "none", label: "No charcoal" },
        ],
      },
    ],
    outcomes: [
      {
        when: { sand: "sand", charcoal: "charcoal" },
        mood: "good",
        key: "full",
        state:
          "After gravel, sand and charcoal, the water drips out nearly clear, with no earthy smell and almost no tint. The clarity tube reads 30 centimeters.",
      },
      {
        when: { sand: "sand", charcoal: "none" },
        mood: "warn",
        key: "sandonly",
        state:
          "The water drips out much clearer, but it still has a faint tea tint and an earthy smell. The clarity tube reads 25 centimeters.",
      },
      {
        when: { sand: "none", charcoal: "charcoal" },
        mood: "warn",
        key: "coalonly",
        state:
          "The water still looks cloudy, and mud coats the charcoal. The smell is weaker. The clarity tube reads 12 centimeters.",
      },
      {
        when: { sand: "none", charcoal: "none" },
        mood: "bad",
        key: "gravelonly",
        state:
          "Only leaves and twigs are caught. The water is still brown and cloudy. The clarity tube reads 9 centimeters.",
      },
    ],
    collect: 4,
    variables: [
      {
        id: "trap",
        label: "trapping particles",
        terms: [
          "sand",
          "gravel",
          "trap",
          "traps",
          "trapped",
          "particles",
          "silt",
          "mud",
          "strain",
          "gaps",
          "grains",
          "size",
        ],
        evidenceTerms: ["25", "30", "12", "8 centimeters", "gaps", "silt", "clarity"],
        probe:
          "You say the layers catch something. What did the clarity tube read with the sand and without it?",
        good: "Two clarity readings to compare",
      },
      {
        id: "chem",
        label: "the charcoal holding chemicals",
        terms: [
          "charcoal",
          "carbon",
          "adsorb",
          "absorb",
          "pores",
          "chemicals",
          "smell",
          "odor",
          "color",
          "tint",
        ],
        evidenceTerms: ["smell", "earthy", "tint", "tea", "pores", "label"],
        probe:
          "You point to the charcoal. What changed in the water's smell and tint when the charcoal was in the filter and when it was out?",
        good: "A comparison of the water with and without charcoal",
      },
      {
        id: "order",
        label: "the order of the layers",
        terms: [
          "order",
          "first",
          "coarse",
          "fine",
          "largest",
          "smallest",
          "clog",
          "clogged",
          "coated",
          "top",
        ],
        evidenceTerms: ["coated", "12", "mud", "clog", "stones", "gaps"],
        probe:
          "You mention the order of the layers. What happened to the charcoal when the sand was missing?",
        good: "What happened when a layer was skipped",
      },
    ],
    partner: {
      name: "Dr. Alvarez",
      glyph: "👩🏽‍🔬",
      opening:
        "Welcome to the water lab. Our pond sample is brown and cloudy, and a layered filter can clear it. How do you think a stack of gravel, sand and charcoal cleans water?",
      noCause:
        "You described what you see, but I need the how. What do you think each layer does to the water?",
      noEvidence: "What did you measure or observe in the lab that supports that explanation?",
      thanks: "Thank you. I will note your reasoning for the science fair report.",
    },
    respond: {
      prompt:
        "Tell Dr. Alvarez how the filter cleans the water. Describe what a layer does to the water and use one measurement or observation.",
      minWords: 18,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "arrange",
      title: "Dr. Alvarez explains how to build the filter",
      script: [
        {
          id: "u1",
          text: "Listen closely, because the order of the layers matters.",
          signal: "order",
        },
        {
          id: "u2",
          text: "First, plug the neck of the bottle with a cotton ball so that the layers cannot wash out.",
          signal: "First",
        },
        {
          id: "u3",
          text: "Next, spread a thin layer of activated charcoal over the cotton.",
          signal: "Next",
        },
        {
          id: "u4",
          text: "Then, pack a layer of fine sand on top of the charcoal.",
          signal: "Then",
        },
        {
          id: "u5",
          text: "After that, add a layer of coarse gravel to cover the sand.",
          signal: "After that",
        },
        {
          id: "u6",
          text: "Finally, pour the cloudy water slowly onto the gravel.",
          signal: "Finally",
        },
      ],
      items: [
        { id: "cotton", label: "Plug the neck with cotton", glyph: "☁️" },
        { id: "charcoal", label: "Spread the charcoal", glyph: "⚫" },
        { id: "sand", label: "Pack the fine sand", glyph: "⏳" },
        { id: "gravel", label: "Add the coarse gravel", glyph: "🪨" },
        { id: "pour", label: "Pour the cloudy water", glyph: "💧" },
      ],
      targets: [
        { id: "s1", label: "Step 1" },
        { id: "s2", label: "Step 2" },
        { id: "s3", label: "Step 3" },
        { id: "s4", label: "Step 4" },
        { id: "s5", label: "Step 5" },
      ],
      expect: [
        { item: "cotton", target: "s1", utterance: "u2" },
        { item: "charcoal", target: "s2", utterance: "u3" },
        { item: "sand", target: "s3", utterance: "u4" },
        { item: "gravel", target: "s4", utterance: "u5" },
        { item: "pour", target: "s5", utterance: "u6" },
      ],
      visuals: {
        u2: "A bottle held neck-down with a cotton ball in the neck",
        u3: "A thin black layer sitting on the cotton",
        u4: "A pale layer of fine grains over the black layer",
        u5: "Large stones covering the pale layer",
        u6: "Cloudy water pouring from a cup onto the stones",
      },
      xray: {
        keywords: ["cotton ball", "charcoal", "fine sand", "coarse gravel"],
        sequence: ["First", "Next", "Then", "After that", "Finally"],
        cause: ["so that"],
        referents: [{ phrase: "the layers", means: "the charcoal, the sand and the gravel" }],
      },
      final: {
        title: "Dr. Alvarez explains how to test the filter",
        script: [
          { id: "f1", text: "Now I will describe how the club will test the filter." },
          {
            id: "f2",
            text: "First, rinse the filter with clean water until the rinse water runs clear.",
            signal: "First",
          },
          {
            id: "f3",
            text: "Second, pour in the cloudy sample slowly so that you do not disturb the layers.",
            signal: "Second",
          },
          {
            id: "f4",
            text: "After the water drips through, collect it in a clean cup.",
            signal: "After",
          },
          {
            id: "f5",
            text: "Then read the clarity tube to measure how clear the water became.",
            signal: "Then",
          },
          {
            id: "f6",
            text: "Finally, an adult must boil the water for one minute, because a filter alone does not remove most germs.",
            signal: "Finally",
          },
        ],
        items: [
          { id: "rinse", label: "Rinse the filter", glyph: "🚿" },
          { id: "pour", label: "Pour in the sample slowly", glyph: "💧" },
          { id: "collect", label: "Collect the water in a clean cup", glyph: "🥛" },
          { id: "read", label: "Read the clarity tube", glyph: "📏" },
          { id: "boil", label: "Boil the water", glyph: "🔥" },
        ],
        targets: [
          { id: "s1", label: "Step 1" },
          { id: "s2", label: "Step 2" },
          { id: "s3", label: "Step 3" },
          { id: "s4", label: "Step 4" },
          { id: "s5", label: "Step 5" },
        ],
        expect: [
          { item: "rinse", target: "s1", utterance: "f2" },
          { item: "pour", target: "s2", utterance: "f3" },
          { item: "collect", target: "s3", utterance: "f4" },
          { item: "read", target: "s4", utterance: "f5" },
          { item: "boil", target: "s5", utterance: "f6" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "How a Layered Filter Cleans Water",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "A layered filter makes cloudy water clear because each layer removes a different kind of material.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "Coarse gravel at the top catches leaves and large clumps of mud, which keeps them from clogging the finer layers below.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "Fine sand then traps tiny particles of silt, because the gaps between its grains are narrower than the particles.",
        },
        {
          id: "s4",
          role: "evidence",
          supports: ["s1"],
          text: "Next, activated charcoal, which is full of microscopic pores, holds on to dissolved chemicals that cause color and odor in a process called adsorption.",
        },
        {
          id: "s5",
          role: "conclusion",
          supports: ["s1"],
          text: "As a result, the water that leaves the filter is clearer and smells better than it did when it entered.",
        },
        {
          id: "s6",
          role: "detail",
          text: "However, a filter like this cannot remove most germs, so the water must still be boiled before anyone drinks it.",
        },
        {
          id: "s7",
          role: "detail",
          text: "Charcoal for filters is made by heating wood or coconut shells with very little air.",
        },
        {
          id: "s8",
          role: "background",
          text: "Many hikers carry small portable filters on camping trips.",
        },
        {
          id: "s9",
          role: "claim",
          text: "The best way to get clean water is always to buy it in bottles.",
        },
      ],
      claimOptions: ["s1", "s9"],
      challenge: {
        type: "cause-effect",
        claim: "s1",
        valid: ["s2", "s3", "s4", "s5"],
        minValid: 3,
        weak: ["s6", "s7", "s8"],
        explainFrame:
          "This sentence is part of the chain because the cause ___ leads to the effect ___.",
        explainTerms: ["because", "leads to", "so", "result", "cause", "effect"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "claim",
              text: "A hot-air balloon rises because the heated air inside it is less dense than the cooler air outside.",
            },
            {
              id: "t2",
              role: "evidence",
              text: "A burner heats the air inside the balloon, and the heated air expands, so fewer air particles fill the same space.",
            },
            {
              id: "t3",
              role: "evidence",
              text: "Because the air inside weighs less than the same amount of air outside, the surrounding air pushes the balloon upward.",
            },
            {
              id: "t4",
              role: "detail",
              text: "The basket under the balloon is usually made of woven wicker.",
            },
            {
              id: "t5",
              role: "background",
              text: "The first passenger flight in a hot-air balloon took place in France in 1783.",
            },
            {
              id: "t6",
              role: "evidence",
              text: "When the pilot lets the air inside cool, the balloon becomes denser and slowly sinks.",
            },
          ],
          claim: "t1",
          valid: ["t2", "t3", "t6"],
          minValid: 2,
          weak: ["t4", "t5"],
        },
      },
      refs: [
        { sentence: "s2", phrase: "them", means: "the leaves and the large clumps of mud" },
        { sentence: "s5", phrase: "it", means: "the water" },
      ],
      layers: {
        meaning: [
          {
            s: "s1",
            phrase: "each layer removes a different kind of material",
            label: "the cause the claim names",
          },
          {
            s: "s3",
            phrase: "narrower than the particles",
            label: "evidence: why sand traps silt",
          },
        ],
        discourse: [
          { s: "s4", phrase: "Next", label: "orders this layer after the sand" },
          { s: "s5", phrase: "As a result", label: "links the layers' actions to the effect" },
          { s: "s6", phrase: "However", label: "turns to a limit of the filter" },
        ],
        sentence: [
          {
            s: "s4",
            phrase: "which is full of microscopic pores",
            label: "relative clause adding a detail about charcoal",
          },
        ],
        word: [
          {
            s: "s4",
            phrase: "adsorption",
            label: "science word",
            def: "when chemicals stick to the surface of a material",
          },
          {
            s: "s2",
            phrase: "clogging",
            label: "process verb",
            def: "blocking a space so that things cannot pass through",
          },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "discourse",
      title: "Put the process in order",
      units: [
        { id: "u1", text: "Cloudy water is poured onto the gravel layer.", role: "start" },
        { id: "u2", text: "The gravel catches the leaves and twigs.", role: "step" },
        {
          id: "u3",
          text: "The water seeps into the fine sand, which traps the silt.",
          role: "step",
        },
        {
          id: "u4",
          text: "The water reaches the charcoal, which adsorbs the chemicals that cause color and odor.",
          role: "step",
        },
        { id: "u5", text: "Clearer water drips out of the bottle neck.", role: "end" },
      ],
      order: ["u1", "u2", "u3", "u4", "u5"],
      alt: [],
      connectors: [
        { before: "u1", word: "First" },
        { before: "u2", word: "Next" },
        { before: "u3", word: "After that" },
        { before: "u4", word: "Then" },
        { before: "u5", word: "Finally" },
      ],
      transfer: {
        units: [
          { id: "v1", text: "A person presses the switch, which closes the circuit.", role: "start" },
          { id: "v2", text: "Electric current flows from the battery through the wires.", role: "step" },
          { id: "v3", text: "The current reaches the bulb.", role: "step" },
          { id: "v4", text: "The thin wire inside the bulb gets hot and glows.", role: "step" },
          { id: "v5", text: "Light shines out of the flashlight.", role: "end" },
        ],
        order: ["v1", "v2", "v3", "v4", "v5"],
        alt: [],
        connectors: [
          { before: "v1", word: "First" },
          { before: "v2", word: "Next" },
          { before: "v3", word: "After that" },
          { before: "v4", word: "Then" },
          { before: "v5", word: "Finally" },
        ],
      },
    },
    {
      kind: "build",
      module: "expand",
      title: "Transform a sentence",
      base: "The water cleared.",
      needs: [
        {
          id: "how",
          label: "Say how it changed with a precise word",
          test: {
            terms: [
              "gradually",
              "slowly",
              "steadily",
              "completely",
              "partly",
              "noticeably",
              "almost",
              "nearly",
            ],
          },
        },
        {
          id: "time",
          label: "Show when it happened with a time word",
          test: { connectorJob: "sequence" },
        },
        { id: "why", label: "Give a cause with a cause word", test: { connectorJob: "cause" } },
        {
          id: "detail",
          label: "Name a layer or material",
          test: {
            terms: [
              "sand",
              "gravel",
              "charcoal",
              "silt",
              "particles",
              "pores",
              "layer",
              "layers",
              "filter",
            ],
          },
        },
      ],
      altConnectors: [
        {
          word: "once",
          note: "Once starts a time clause: Once the water reaches the sand, the silt gets trapped.",
        },
        {
          word: "after that",
          note: "After that begins a new sentence about the next step: The gravel catches the leaves. After that, the sand traps the silt.",
        },
        {
          word: "because",
          note: "Because gives the reason after the result: The water cleared because the sand trapped the silt.",
        },
      ],
      transfer: {
        base: "The ice melted.",
        needs: [
          {
            id: "time",
            label: "Show when it happened with a time word",
            test: { connectorJob: "sequence" },
          },
          { id: "why", label: "Give a cause with a cause word", test: { connectorJob: "cause" } },
          {
            id: "detail",
            label: "Name a specific factor",
            test: { terms: ["heat", "warm", "sun", "energy", "temperature", "air", "sunlight"] },
          },
        ],
      },
    },
  ],
  communicate: {
    kind: "compose",
    mode: "write",
    prompt:
      "Dr. Alvarez will include your explanation in the science fair report. Explain how the layered filter cleans cloudy water. Say what each layer does, in what order the water meets the layers, and what evidence shows the filter works.",
    audience: [
      "Dr. Alvarez and the science fair judges",
      "La doctora Alvarez y los jueces de la feria de ciencias",
    ],
    genre: "explanation",
    topicTerms: [
      "filter",
      "water",
      "gravel",
      "sand",
      "charcoal",
      "silt",
      "particles",
      "pores",
      "adsorb",
      "clarity",
      "layers",
    ],
    sourceTerms: ["8 centimeters", "30 centimeters", "gaps", "silt", "pores", "12 centimeters"],
    evidenceBank: [
      {
        id: "e1",
        text: "The cloudy sample read 8 centimeters on the clarity tube; the filtered water read 30.",
        kind: "number",
      },
      {
        id: "e2",
        text: "With charcoal but no sand layer, the water still looked cloudy and read only 12 centimeters.",
        kind: "number",
      },
      {
        id: "e3",
        text: "With no charcoal layer, the water still had a tea tint and an earthy smell.",
        kind: "fact",
      },
      {
        id: "e4",
        text: "Gravel catches leaves and twigs, but muddy water runs straight through it.",
        kind: "fact",
      },
      {
        id: "e5",
        text: "A filter like this does not remove most germs. The lab water is never for drinking, and water from a pond must be boiled for one minute first.",
        kind: "fact",
      },
    ],
    organizer: ["phenomenon", "steps", "cause", "result"],
    readerQuestions: {
      phenomenon: "What exactly is the filter doing to the water, and why does it matter?",
      cause: "How does that layer change the water? What happens to the particles or chemicals?",
      chain:
        "What happens next, once the water leaves that layer? Which time word shows the order?",
      support: "Which reading or observation from the lab supports your explanation?",
    },
    minWords: 70,
  },
  improve: {
    models: {
      phenomenon:
        "A layered bottle filter turns cloudy pond water into clearer water, and each layer plays a different part.",
      cause:
        "The sand removes silt because the gaps between its grains are narrower than the particles.",
      chain:
        "First the gravel catches the leaves, which keeps the sand from clogging; then the sand traps the silt, and finally the charcoal adsorbs the chemicals that cause odor.",
      support:
        "According to the clarity tube, the sample improved from 8 centimeters to 30 centimeters after filtering.",
    },
    whys: [
      {
        id: "why-sequence",
        text: "It shows the order of the steps and how long each effect lasts, so the reader can follow the process.",
        moves: ["chain"],
      },
      {
        id: "why-mechanism",
        text: "It names how each layer acts on the water, so the explanation goes beyond describing the result.",
        moves: ["cause"],
      },
      {
        id: "why-data",
        text: "It cites a measurement, so the explanation rests on evidence and not opinion.",
        moves: ["support"],
      },
      {
        id: "why-topic",
        text: "It says exactly what process is being explained, so the audience knows what to look for.",
        moves: ["phenomenon"],
      },
    ],
  },
  show: {
    kind: "compose",
    mode: "write",
    prompt:
      "New situation: The science club newsletter asks how a vacuum flask keeps a hot drink hot. Observations: the flask has two thin walls with almost no air between them; the surfaces that face each other are shiny like a mirror; the stopper fits tightly; a hot drink in the flask is still hot after many hours, while the same drink in a plain mug cools to lukewarm in under an hour. Write an explanation for newsletter readers that shows how the flask works, step by step, using the observations as evidence.",
    audience: [
      "Readers of the science club newsletter",
      "Lectores del boletín del club de ciencias",
    ],
    genre: "explanation",
    topicTerms: [
      "flask",
      "heat",
      "drink",
      "vacuum",
      "walls",
      "air",
      "shiny",
      "stopper",
      "mug",
      "hot",
    ],
    sourceTerms: ["two thin walls", "almost no air", "shiny", "stopper", "many hours", "lukewarm"],
    organizer: ["phenomenon", "steps", "cause", "result"],
    readerQuestions: {
      phenomenon: "What exactly is the flask doing, and what is it compared with?",
      cause: "How does that part of the flask change what happens to the heat?",
      chain:
        "What happens next, once the heat meets the next part? Which time word shows the order?",
      support: "Which observation supports your explanation?",
    },
    minWords: 55,
  },
};

export default {
  id: "m07",
  bands: { "3-5": g35, "6-8": g68 },
};
