// Mission 4 — Observe and Describe (Unit 2, Inform). Lab environment.
// Grades 3-5: Leaf Lab (describe one maple leaf). Grades 6-8: The Mineral Mystery Lab (describe and classify a mineral sample).
// Title, goal, WIDA and spiral data live in MISSIONS (curriculum.js); family guidance lives in family.js.
// Task content is English; titles, roles and audiences are bilingual [en, es]. Hints ask or point and never state an answer.

const g35 = {
  environment: "lab",
  context: {
    title: ["Leaf Lab", "Laboratorio de hojas"],
    premise:
      "Ms. Okafor's class is studying leaves in the school lab. She is drawing one maple leaf for the science notebook, but she can only use the words her students give her.",
    cast: [
      {
        id: "okafor",
        name: "Ms. Okafor",
        role: ["Science teacher", "Maestra de ciencias"],
        glyph: "👩🏾‍🏫",
      },
      { id: "mia", name: "Mia", role: ["Lab partner", "Compañera de laboratorio"], glyph: "👧🏽" },
    ],
  },
  vocab: [
    [
      "observe",
      "to look at something carefully to learn about it",
      "observar: mirar algo con cuidado para aprender sobre eso",
    ],
    [
      "detail",
      "one small, exact fact about something",
      "detalle: un dato pequeño y exacto sobre algo",
    ],
    ["texture", "how something feels when you touch it", "textura: cómo se siente algo al tocarlo"],
    [
      "vein",
      "a thin line that carries water in a leaf",
      "vena (nervadura): línea delgada que lleva agua en una hoja",
    ],
    [
      "lobe",
      "a rounded or pointed part that sticks out from a leaf",
      "lóbulo: parte redondeada o puntiaguda que sobresale de una hoja",
    ],
    [
      "measure",
      "to find out how long, wide or heavy something is",
      "medir: averiguar cuánto mide o cuánto pesa algo",
    ],
    ["describe", "to tell what something is like", "describir: decir cómo es algo"],
    ["kind", "a group of things that are alike", "tipo: un grupo de cosas parecidas"],
  ],
  frames: {
    A: [
      "A maple leaf is a kind of ___ that ___.",
      "It is ___ centimeters long, and it has ___.",
      "First, ___. Also, ___.",
      "In conclusion, ___.",
    ],
    B: ["___ is a kind of ___.", "One detail is ___. Another detail is ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "Ms. Okafor cannot see the leaf from her desk. What would she need to know to draw it exactly?",
    objects: [
      {
        id: "leaf",
        label: "Maple leaf",
        glyph: "🍁",
        x: 30,
        y: 46,
        relevant: true,
        note: "The maple leaf lies on a white tray. It is shaped like a hand with five pointed parts called lobes. The edge has small, sharp points.",
      },
      {
        id: "ruler",
        label: "Ruler",
        glyph: "📏",
        x: 50,
        y: 82,
        relevant: true,
        note: "On the ruler, the leaf measures 12 centimeters from the stem to the tip and 10 centimeters from side to side.",
      },
      {
        id: "lens",
        label: "Hand lens",
        glyph: "🔍",
        x: 72,
        y: 38,
        relevant: true,
        note: "Through the hand lens you can see thin lines called veins. They start at the stem and spread out across the leaf like fingers.",
      },
      {
        id: "colorcard",
        label: "Color card",
        glyph: "🎨",
        x: 14,
        y: 20,
        relevant: true,
        note: "Color card: the top of the leaf is dark green and shiny. The bottom is a paler green and dull.",
      },
      {
        id: "touch",
        label: "Touch notes",
        glyph: "✋",
        x: 84,
        y: 70,
        relevant: true,
        note: "Touch notes: the leaf feels smooth and a little stiff. The veins feel like thin ridges.",
      },
      {
        id: "pencilcase",
        label: "Pencil case",
        glyph: "✏️",
        x: 90,
        y: 20,
        relevant: false,
        note: "A blue pencil case sits on the table next to the tray. It is not part of the leaf.",
      },
    ],
    controls: [
      {
        id: "tool",
        label: "Tool",
        initial: "eyes",
        options: [
          { id: "eyes", label: "Just my eyes" },
          { id: "lens", label: "Hand lens" },
        ],
      },
      {
        id: "view",
        label: "View",
        initial: "tray",
        options: [
          { id: "tray", label: "Leaf on the tray" },
          { id: "window", label: "Leaf held up to the window" },
        ],
      },
    ],
    outcomes: [
      {
        when: { tool: "eyes", view: "tray" },
        mood: "warn",
        key: "plain",
        state: "You see a green shape with pointed edges. You cannot see the small parts.",
      },
      {
        when: { tool: "eyes", view: "window" },
        mood: "warn",
        key: "light",
        state: "Light shines through the leaf. You see pale lines inside it.",
      },
      {
        when: { tool: "lens", view: "tray" },
        mood: "warn",
        key: "close",
        state: "Close up, you see the sharp points on the edge and the shiny top.",
      },
      {
        when: { tool: "lens", view: "window" },
        mood: "good",
        key: "both",
        state:
          "With the lens and the light, you see thin lines branching from the stem to every part of the leaf.",
      },
    ],
    collect: 3,
    variables: [
      {
        id: "shape",
        label: "shape",
        terms: ["shape", "shaped", "pointed", "points", "lobes", "lobe", "edge", "edges", "hand"],
        evidenceTerms: ["five", "5", "lobes", "points"],
        probe:
          "You are describing the shape. How many parts can you count, and what could you compare them to?",
        good: "A count or a comparison a reader could picture",
      },
      {
        id: "size",
        label: "size",
        terms: [
          "size",
          "long",
          "wide",
          "length",
          "width",
          "big",
          "small",
          "centimeters",
          "cm",
          "ruler",
          "measure",
        ],
        evidenceTerms: ["12", "10", "centimeters", "cm"],
        probe: "You are describing the size. What does the ruler tell you in each direction?",
        good: "A number with a unit",
      },
      {
        id: "veins",
        label: "veins",
        terms: ["veins", "vein", "lines", "branch", "branches", "branching", "lens", "stem"],
        evidenceTerms: ["branch", "stem", "lens", "thin"],
        probe:
          "You noticed lines inside the leaf. What does the hand lens show about where they start and where they go?",
        good: "Where the lines start and where they spread",
      },
      {
        id: "color",
        label: "color",
        terms: ["color", "green", "shiny", "dull", "pale", "dark", "bottom", "top", "underneath"],
        evidenceTerms: ["dark green", "pale", "shiny", "dull"],
        probe:
          "You are describing color. Is the whole leaf the same? Check the color card for each side.",
        good: "A difference between the two sides",
      },
    ],
    partner: {
      name: "Ms. Okafor",
      glyph: "👩🏾‍🏫",
      opening:
        "I am drawing this leaf for our science notebook, but I cannot see it from my desk. What does it look like?",
      noCause: "I cannot picture it yet. Tell me one thing you can see, feel or measure.",
      noEvidence: "Give me something exact that I can draw, like a number or a clear word.",
      thanks: "Thank you. Now I can start my drawing, and your details will help the whole class.",
    },
    respond: {
      prompt:
        "Tell Ms. Okafor what the leaf looks like. Give at least two exact details, because she cannot see it.",
      minWords: 12,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "sort",
      title: "Ms. Okafor describes the leaf",
      script: [
        {
          id: "u1",
          text: "I will describe our leaf in three parts: its color, its shape, and how it feels.",
          signal: "three parts",
        },
        { id: "u2", text: "First, the top of the leaf is dark green and shiny.", signal: "First" },
        {
          id: "u3",
          text: "Next, the leaf has five pointed lobes, and the edge has sharp points.",
          signal: "Next",
        },
        {
          id: "u4",
          text: "Last, the leaf is smooth, and the veins feel like thin ridges.",
          signal: "Last",
        },
      ],
      items: [
        { id: "dark", label: "Dark green", glyph: "🟩" },
        { id: "shiny", label: "Shiny top", glyph: "✨" },
        { id: "lobes", label: "Five pointed lobes", glyph: "🍁" },
        { id: "points", label: "Sharp points on the edge", glyph: "🔺" },
        { id: "smooth", label: "Smooth", glyph: "✋" },
        { id: "ridges", label: "Thin ridges", glyph: "〰️" },
      ],
      targets: [
        { id: "color", label: "Color" },
        { id: "shape", label: "Shape" },
        { id: "feel", label: "How it feels" },
      ],
      expect: [
        { item: "dark", target: "color", utterance: "u2" },
        { item: "shiny", target: "color", utterance: "u2" },
        { item: "lobes", target: "shape", utterance: "u3" },
        { item: "points", target: "shape", utterance: "u3" },
        { item: "smooth", target: "feel", utterance: "u4" },
        { item: "ridges", target: "feel", utterance: "u4" },
      ],
      visuals: {
        u2: "A leaf with its top side painted green and glossy",
        u3: "A hand-shaped leaf with five points circled",
        u4: "A fingertip touching a leaf and a thin raised line",
      },
      xray: {
        keywords: ["color", "shape", "feels", "five pointed lobes"],
        sequence: ["First", "Next", "Last"],
        cause: [],
        referents: [{ phrase: "the leaf", means: "the maple leaf on the tray" }],
      },
      final: {
        mode: "arrange",
        title: "How to observe a leaf",
        script: [
          { id: "f1", text: "Here is how to observe a leaf well." },
          {
            id: "f2",
            text: "First, look at the leaf with just your eyes and say its color.",
            signal: "First",
          },
          {
            id: "f3",
            text: "Next, use a ruler to measure how long and wide it is.",
            signal: "Next",
          },
          { id: "f4", text: "Then, use a hand lens to look at the veins.", signal: "Then" },
          { id: "f5", text: "Finally, write down everything you saw.", signal: "Finally" },
        ],
        items: [
          { id: "eyes", label: "Look and name the color", glyph: "👀" },
          { id: "ruler", label: "Measure with a ruler", glyph: "📏" },
          { id: "lens", label: "Look at the veins with a lens", glyph: "🔍" },
          { id: "write", label: "Write down what you saw", glyph: "📝" },
        ],
        targets: [
          { id: "p1", label: "Step 1" },
          { id: "p2", label: "Step 2" },
          { id: "p3", label: "Step 3" },
          { id: "p4", label: "Step 4" },
        ],
        expect: [
          { item: "eyes", target: "p1", utterance: "f2" },
          { item: "ruler", target: "p2", utterance: "f3" },
          { item: "lens", target: "p3", utterance: "f4" },
          { item: "write", target: "p4", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "A Closer Look at a Maple Leaf",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "A maple leaf is built to make food for the tree.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "It is wide and flat, so a lot of light can land on it.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "The top is dark green because it holds a green material that uses light to make food.",
        },
        {
          id: "s4",
          role: "evidence",
          supports: ["s1"],
          text: "Thin veins carry water into the leaf and carry food out.",
        },
        { id: "s5", role: "detail", text: "The leaf in our lab is 12 centimeters long." },
        {
          id: "s6",
          role: "background",
          text: "Ms. Okafor found the leaf on the school playground.",
        },
        { id: "s7", role: "claim", text: "Maple trees are the prettiest trees in town." },
        { id: "s8", role: "detail", text: "In the fall, maple leaves turn red and orange." },
      ],
      claimOptions: ["s1", "s7"],
      challenge: {
        type: "evidence",
        claim: "s1",
        valid: ["s2", "s3", "s4"],
        minValid: 2,
        weak: ["s5", "s6", "s8"],
        explainFrame: "This evidence shows the claim is true because ___.",
        explainTerms: ["because", "shows", "so"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "claim",
              text: "A cactus is built to live in the desert.",
            },
            {
              id: "t2",
              role: "evidence",
              text: "Its thick stem stores water for dry days.",
            },
            {
              id: "t3",
              role: "evidence",
              text: "Its wide roots stay near the top of the soil, so they can soak up rain fast.",
            },
            { id: "t4", role: "detail", text: "The cactus in our room sits in a red pot." },
            { id: "t5", role: "background", text: "A student brought it from home in September." },
            { id: "t6", role: "detail", text: "Some cactus flowers are yellow." },
          ],
          claim: "t1",
          valid: ["t2", "t3"],
          minValid: 2,
          weak: ["t4", "t5", "t6"],
        },
      },
      refs: [{ sentence: "s2", phrase: "It", means: "the maple leaf" }],
      layers: {
        meaning: [
          { s: "s2", phrase: "wide and flat", label: "a precise detail about the shape" },
          { s: "s4", phrase: "carry water into the leaf", label: "evidence: what the veins do" },
        ],
        discourse: [
          { s: "s2", phrase: "so", label: "links a detail to its result" },
          { s: "s3", phrase: "because", label: "gives the reason" },
        ],
        sentence: [
          { s: "s3", phrase: "because it holds a green material", label: "reason clause" },
        ],
        word: [
          {
            s: "s4",
            phrase: "veins",
            label: "science word",
            def: "thin tubes that carry water and food in a leaf",
          },
          { s: "s3", phrase: "material", label: "academic word", def: "what a thing is made of" },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "morphology",
      title: "Word parts for the lab",
      words: [
        {
          word: "microscope",
          parts: [
            { t: "micro", type: "prefix", meaning: "very small" },
            { t: "scope", type: "root", meaning: "a tool for looking" },
          ],
          ask: "What do the two parts tell you about this tool?",
        },
        {
          word: "thermometer",
          parts: [
            { t: "thermo", type: "root", meaning: "heat" },
            { t: "meter", type: "root", meaning: "a tool for measuring" },
          ],
          ask: "What do the two parts tell you this tool measures?",
        },
        {
          word: "unfolded",
          parts: [
            { t: "un", type: "prefix", meaning: "the opposite of" },
            { t: "fold", type: "root", meaning: "bend over on itself" },
            { t: "ed", type: "suffix", meaning: "already happened" },
          ],
          ask: "What happened to the leaf if it was unfolded?",
        },
        {
          word: "observation",
          parts: [
            { t: "observ", type: "root", meaning: "watch closely" },
            { t: "ation", type: "suffix", meaning: "the act or result of" },
          ],
          ask: "What do the two parts tell you an observation is?",
        },
      ],
      transfer: {
        words: [
          {
            word: "telescope",
            parts: [
              { t: "tele", type: "prefix", meaning: "far away" },
              { t: "scope", type: "root", meaning: "a tool for looking" },
            ],
            ask: "What do the two parts tell you about this tool?",
          },
          {
            word: "centimeter",
            parts: [
              { t: "centi", type: "prefix", meaning: "one hundredth" },
              { t: "meter", type: "root", meaning: "a unit for measuring" },
            ],
            ask: "What do the two parts tell you about this unit?",
          },
        ],
      },
    },
    {
      kind: "build",
      module: "expand",
      title: "Transform a sentence",
      base: "The leaf is green.",
      needs: [
        {
          id: "number",
          label: "Add an exact number or measurement",
          test: {
            terms: [
              "one",
              "two",
              "three",
              "four",
              "five",
              "six",
              "ten",
              "12",
              "10",
              "5",
              "centimeters",
              "centimeter",
              "cm",
              "inches",
            ],
          },
        },
        {
          id: "feel",
          label: "Add a word for how it looks or feels",
          test: {
            terms: [
              "smooth",
              "shiny",
              "dull",
              "stiff",
              "soft",
              "rough",
              "thin",
              "pointed",
              "wide",
              "flat",
              "bumpy",
            ],
          },
        },
        {
          id: "like",
          label: "Add a comparison or an example",
          test: { connectorJob: "example" },
        },
      ],
      altConnectors: [
        {
          word: "like",
          note: "Like compares one thing to another: The lobes look like fingers on a hand.",
        },
        {
          word: "for example",
          note: "For example introduces one exact detail: The leaf has sharp parts, for example, the points on its edge.",
        },
        {
          word: "such as",
          note: "Such as lists examples inside one sentence: The leaf has details, such as veins and lobes.",
        },
      ],
      transfer: {
        base: "The rock is gray.",
        needs: [
          {
            id: "number",
            label: "Add an exact number or measurement",
            test: {
              terms: [
                "one",
                "two",
                "three",
                "four",
                "five",
                "ten",
                "grams",
                "gram",
                "centimeters",
                "centimeter",
                "cm",
                "inches",
              ],
            },
          },
          {
            id: "feel",
            label: "Add a word for how it looks or feels",
            test: {
              terms: [
                "rough",
                "smooth",
                "bumpy",
                "hard",
                "shiny",
                "dull",
                "heavy",
                "speckled",
                "sharp",
              ],
            },
          },
        ],
      },
    },
  ],
  communicate: {
    kind: "compose",
    mode: "write",
    prompt:
      "Write a description of the maple leaf for Ms. Okafor so she can draw it. Tell what kind of thing it is, give exact details, group your details, and end with the most important idea.",
    audience: [
      "Ms. Okafor, who cannot see the leaf",
      "La maestra Okafor, que no puede ver la hoja",
    ],
    genre: "description",
    topicTerms: [
      "leaf",
      "maple",
      "green",
      "lobes",
      "veins",
      "measure",
      "centimeters",
      "smooth",
      "tree",
    ],
    sourceTerms: ["12 centimeters", "five lobes", "veins", "dark green", "smooth"],
    evidenceBank: [
      {
        id: "size",
        text: "The leaf is 12 centimeters long and 10 centimeters wide.",
        kind: "number",
      },
      { id: "shape", text: "The leaf has five pointed lobes, like a hand.", kind: "fact" },
      {
        id: "veins",
        text: "Thin veins start at the stem and spread out across the leaf.",
        kind: "fact",
      },
      {
        id: "color",
        text: "The top is dark green and shiny. The bottom is paler and dull.",
        kind: "fact",
      },
      {
        id: "feel",
        text: "The leaf feels smooth, and the veins feel like thin ridges.",
        kind: "fact",
      },
    ],
    organizer: ["topic", "details", "organize", "close"],
    readerQuestions: {
      topic: "What kind of thing is this? Tell me in one sentence.",
      details: "What exact facts or numbers can I draw?",
      organize: "How are your details grouped? Which word shows how they connect?",
      close: "What is the one idea you want me to remember?",
    },
    minWords: 30,
  },
  improve: {
    models: {
      topic: "A maple leaf is a flat, green part of a tree that makes food from sunlight.",
      details: "The leaf is 12 centimeters long, and it has five pointed lobes.",
      organize:
        "The top is shiny and dark green, while the bottom is dull and pale. Also, the veins feel like thin ridges.",
      close:
        "In conclusion, a maple leaf is a wide, flat, green part of the tree that catches sunlight.",
    },
    whys: [
      {
        id: "why-topic",
        text: "It tells my reader what kind of thing I am describing, so they know what to picture.",
        moves: ["topic"],
      },
      {
        id: "why-details",
        text: "It gives exact facts and numbers, so my reader can picture the leaf clearly.",
        moves: ["details"],
      },
      {
        id: "why-organize",
        text: "It groups my details with signal words, so my reader can follow my description.",
        moves: ["organize"],
      },
      {
        id: "why-close",
        text: "It ends with my main point, so my reader remembers what matters most.",
        moves: ["close"],
      },
    ],
  },
  show: {
    kind: "converse",
    mode: "speak",
    prompt:
      "New situation: Your class found a scallop shell on the beach, and your classmate Jamal was absent. The shell is shaped like a fan and is about 8 centimeters wide. Ridges spread out from a small point at the bottom, like the ribs of a fan. The outside is pale orange, and the inside is smooth and white. Tell Jamal what kind of thing it is, give exact details, and end with the most important thing to remember.",
    partner: {
      name: "Jamal",
      glyph: "🧒🏿",
      role: ["Classmate who was absent", "Compañero que faltó a clase"],
      opening: "I missed the beach trip. What did you find? Tell me so I can picture it.",
    },
    topicTerms: ["shell", "scallop", "ridges", "fan", "orange", "white", "smooth", "centimeters"],
    sourceTerms: ["8 centimeters", "ridges", "pale orange", "smooth", "white"],
    lines: [
      {
        id: "shape",
        terms: ["shape", "shaped", "fan", "ridges", "point", "spread"],
        evidenceTerms: ["fan", "ridges", "point", "spread"],
        ack: "So the shape is what stands out to you.",
        probe: "How are the ridges arranged? I want to draw them in the right places.",
        close: "How the parts of the shell are arranged",
      },
      {
        id: "size",
        terms: ["size", "wide", "width", "centimeters", "big", "small", "long"],
        evidenceTerms: ["8", "centimeters"],
        ack: "So you are telling me about the size.",
        probe: "How could you say the size exactly, so I know how big to draw it?",
        close: "A number with a unit",
      },
      {
        id: "color",
        terms: ["color", "orange", "white", "outside", "inside", "pale", "smooth"],
        evidenceTerms: ["pale orange", "white", "smooth", "inside", "outside"],
        ack: "So you are describing the colors and how it feels.",
        probe: "Is the outside the same as the inside? Tell me what is different.",
        close: "A difference between the outside and the inside",
      },
    ],
    followUps: {
      topic: "What kind of thing is it? Start with one sentence that tells me.",
      details: "Which exact number or word would help me picture it better?",
      organize: "How are your details grouped? Add a word that shows how they connect.",
      close: "What is the one thing you want me to remember about the shell?",
    },
    maxTurns: 3,
    minWords: 20,
  },
};

const g68 = {
  environment: "lab",
  context: {
    title: ["The Mineral Mystery Lab", "El laboratorio del misterio mineral"],
    premise:
      "A crate from the city museum arrived at Lakeview Middle School labeled “Sample 4: quartz?” Dr. Alvarez, a geologist, asks the class to test the sample and write an accurate entry for the museum's mineral guide.",
    cast: [
      { id: "alvarez", name: "Dr. Alvarez", role: ["Geologist", "Geóloga"], glyph: "👩🏽‍🔬" },
      {
        id: "priya",
        name: "Priya",
        role: ["Lab partner", "Compañera de laboratorio"],
        glyph: "👧🏽",
      },
    ],
  },
  vocab: [
    [
      "property",
      "a feature that can be observed or measured",
      "propiedad: una característica que se puede observar o medir",
    ],
    [
      "mineral",
      "a natural, solid substance with a crystal structure",
      "mineral: sustancia natural y sólida con estructura cristalina",
    ],
    [
      "hardness",
      "how well a material resists being scratched",
      "dureza: qué tanto resiste un material los rayones",
    ],
    [
      "luster",
      "the way light reflects from a surface",
      "brillo: la manera en que la luz se refleja en una superficie",
    ],
    [
      "density",
      "how much mass fits in a given volume",
      "densidad: cuánta masa cabe en un volumen dado",
    ],
    [
      "crystal",
      "a solid whose atoms are arranged in a repeating pattern",
      "cristal: sólido cuyos átomos están ordenados en un patrón que se repite",
    ],
    [
      "classify",
      "to sort things into groups by their properties",
      "clasificar: ordenar cosas en grupos según sus propiedades",
    ],
    ["precise", "exact and accurate", "preciso: exacto y correcto"],
  ],
  frames: {
    A: [
      "___ is a ___ that ___.",
      "The test shows ___, which means ___.",
      "First, ___; also, ___; however, ___.",
      "In conclusion, ___.",
    ],
    B: ["One property of ___ is ___.", "In conclusion, ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "Dr. Alvarez needs a precise entry for Sample 4. Which properties can the class observe and measure, and what does each one tell a reader?",
    objects: [
      {
        id: "sample",
        label: "Sample 4",
        glyph: "💎",
        x: 22,
        y: 42,
        relevant: true,
        note: "Sample 4 is a cloudy white crystal about 6 centimeters long. It has six flat sides that narrow to a point at one end. Broken edges shine like glass.",
      },
      {
        id: "glass",
        label: "Scratch test",
        glyph: "🪟",
        x: 48,
        y: 24,
        relevant: true,
        note: "Scratch test: Sample 4 scratches a glass plate. A steel nail dragged across Sample 4 leaves no mark on it.",
      },
      {
        id: "vinegar",
        label: "Acid test",
        glyph: "🧴",
        x: 56,
        y: 78,
        relevant: true,
        note: "Acid test: a drop of vinegar on Sample 4 does nothing. On a piece of limestone from the same crate, the vinegar makes small bubbles.",
      },
      {
        id: "balance",
        label: "Balance and cylinder",
        glyph: "⚖️",
        x: 78,
        y: 34,
        relevant: true,
        note: "Sample 4 has a mass of 53 grams and a volume of 20 cubic centimeters. Mass divided by volume gives a density of about 2.65 grams per cubic centimeter.",
      },
      {
        id: "card",
        label: "Reference card",
        glyph: "🗂️",
        x: 82,
        y: 70,
        relevant: true,
        note: "Reference card: quartz scratches glass, does not react with vinegar, and has a density of 2.65 grams per cubic centimeter. Calcite, a similar-looking mineral, can be scratched by a steel nail and bubbles in acid.",
      },
      {
        id: "goggles",
        label: "Safety goggles",
        glyph: "🥽",
        x: 92,
        y: 90,
        relevant: false,
        note: "Safety goggles hang by the sink. Everyone wears them during every test.",
      },
    ],
    controls: [
      {
        id: "lamp",
        label: "Lamp position",
        initial: "above",
        options: [
          { id: "above", label: "Lamp above" },
          { id: "side", label: "Lamp at the side" },
        ],
      },
      {
        id: "test",
        label: "Test",
        initial: "scratch",
        options: [
          { id: "scratch", label: "Scratch glass" },
          { id: "acid", label: "Drop of vinegar" },
        ],
      },
    ],
    outcomes: [
      {
        when: { lamp: "above", test: "scratch" },
        mood: "warn",
        key: "above-scratch",
        state: "With the lamp above, Sample 4 looks cloudy white. It scratches the glass plate.",
      },
      {
        when: { lamp: "side", test: "scratch" },
        mood: "good",
        key: "side-scratch",
        state:
          "With the lamp at the side, the flat faces flash like glass. The sample scratches the glass plate, and the nail leaves no mark on the sample.",
      },
      {
        when: { lamp: "above", test: "acid" },
        mood: "warn",
        key: "above-acid",
        state:
          "With the lamp above, Sample 4 looks cloudy white. A drop of vinegar leaves no bubbles.",
      },
      {
        when: { lamp: "side", test: "acid" },
        mood: "good",
        key: "side-acid",
        state:
          "With the lamp at the side, the flat faces flash like glass. Vinegar leaves no bubbles on Sample 4, but it bubbles on the limestone.",
      },
    ],
    collect: 4,
    variables: [
      {
        id: "hardness",
        label: "hardness",
        terms: ["hard", "hardness", "scratch", "scratches", "scratched", "glass", "nail", "steel"],
        evidenceTerms: ["glass plate", "nail", "no mark", "scratches glass"],
        probe:
          "You are pointing to a hardness test. Which materials were compared, and what happened to each one?",
        good: "A comparison of what scratched what",
      },
      {
        id: "shape",
        label: "crystal shape",
        terms: [
          "crystal",
          "crystals",
          "six",
          "sides",
          "faces",
          "prism",
          "point",
          "pointed",
          "shape",
        ],
        evidenceTerms: ["six", "6 centimeters", "flat sides", "point"],
        probe:
          "You noticed the form of the crystal. Which exact features could another scientist check?",
        good: "A count or a measurement of the shape",
      },
      {
        id: "reaction",
        label: "reaction to vinegar",
        terms: ["vinegar", "acid", "bubble", "bubbles", "fizz", "react", "reaction", "limestone"],
        evidenceTerms: ["no bubbles", "limestone", "nothing happened", "does nothing"],
        probe:
          "You are describing the acid test. How did Sample 4 respond compared with the limestone?",
        good: "A comparison of two reactions",
      },
      {
        id: "density",
        label: "density",
        terms: ["density", "mass", "volume", "grams", "heavy", "heavier", "dense"],
        evidenceTerms: ["53", "20", "2.65"],
        probe: "You are using mass and volume. How are they combined, and what number results?",
        good: "The measurements and the result",
      },
      {
        id: "luster",
        label: "luster",
        terms: ["luster", "shine", "shiny", "glassy", "light", "lamp", "flash"],
        evidenceTerms: ["glass", "side", "flat faces", "broken edges"],
        probe:
          "You are describing how light behaves on the sample. What changed when the lamp moved?",
        good: "What the light showed",
      },
    ],
    partner: {
      name: "Dr. Alvarez",
      glyph: "👩🏽‍🔬",
      opening:
        "The museum wants an accurate entry for Sample 4 before the crate goes on display. What can you tell me about it so far?",
      noCause:
        "I need a more precise description. What kind of material do you think it is, and which property did you observe?",
      noEvidence: "Which test or measurement produced that detail?",
      thanks:
        "Thank you. Precise observations like these are what a field-guide entry is built from.",
    },
    respond: {
      prompt:
        "Tell Dr. Alvarez what kind of material Sample 4 seems to be, and describe two properties you observed. Give a test result or measurement for each one.",
      minWords: 20,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "follow",
      title: "Dr. Alvarez explains the hardness test",
      script: [
        {
          id: "u1",
          text: "Follow these directions to complete the hardness test on a mineral sample.",
          signal: "directions",
        },
        {
          id: "u2",
          text: "First, hold the sample steady and press one corner firmly against a clean glass plate.",
          signal: "First",
        },
        {
          id: "u3",
          text: "Next, drag the corner across the glass and look closely for a scratch.",
          signal: "Next",
        },
        {
          id: "u4",
          text: "Then, reverse the test by dragging a steel nail across a flat face of the sample.",
          signal: "Then",
        },
        {
          id: "u5",
          text: "Finally, record in a table which material left a mark on which.",
          signal: "Finally",
        },
      ],
      items: [
        { id: "press", label: "Press a corner against the glass", glyph: "🪟" },
        { id: "drag", label: "Drag the corner and look for a scratch", glyph: "👀" },
        { id: "nail", label: "Drag a steel nail across the sample", glyph: "🔩" },
        { id: "record", label: "Record which material left a mark", glyph: "📝" },
      ],
      targets: [
        { id: "p1", label: "Step 1" },
        { id: "p2", label: "Step 2" },
        { id: "p3", label: "Step 3" },
        { id: "p4", label: "Step 4" },
      ],
      expect: [
        { item: "press", target: "p1", utterance: "u2" },
        { item: "drag", target: "p2", utterance: "u3" },
        { item: "nail", target: "p3", utterance: "u4" },
        { item: "record", target: "p4", utterance: "u5" },
      ],
      visuals: {
        u2: "A hand pressing a crystal corner against a glass plate",
        u3: "A crystal corner sliding across glass, with a thin line behind it",
        u4: "A steel nail sliding across a flat face of a crystal",
        u5: "A two-column table with a pencil above it",
      },
      xray: {
        keywords: ["hardness test", "glass plate", "steel nail", "record"],
        sequence: ["First", "Next", "Then", "Finally"],
        cause: [],
        referents: [{ phrase: "a flat face", means: "one of the flat sides of the crystal" }],
      },
      final: {
        mode: "sort",
        title: "Mineral or rock?",
        script: [
          { id: "f1", text: "Now classify four samples from the crate as minerals or rocks." },
          {
            id: "f2",
            text: "Quartz is a mineral, because it is one pure substance with a crystal structure.",
            signal: "because",
          },
          {
            id: "f3",
            text: "Granite is a rock, because it is a mixture of several different minerals.",
            signal: "because",
          },
          {
            id: "f4",
            text: "Calcite is a mineral, but limestone is a rock that is made mostly of calcite.",
            signal: "but",
          },
        ],
        items: [
          { id: "quartz", label: "Quartz", glyph: "💎" },
          { id: "granite", label: "Granite", glyph: "🪨" },
          { id: "calcite", label: "Calcite", glyph: "🔷" },
          { id: "limestone", label: "Limestone", glyph: "🧱" },
        ],
        targets: [
          { id: "mineral", label: "Mineral" },
          { id: "rock", label: "Rock" },
        ],
        expect: [
          { item: "quartz", target: "mineral", utterance: "f2" },
          { item: "granite", target: "rock", utterance: "f3" },
          { item: "calcite", target: "mineral", utterance: "f4" },
          { item: "limestone", target: "rock", utterance: "f4" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Is Sample 4 Quartz?",
      passage: [
        { id: "s1", role: "claim", text: "Sample 4 is most likely quartz." },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "Sample 4 scratches a glass plate, which shows it is harder than glass, whereas calcite, a similar-looking mineral, is too soft to scratch glass.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "When a drop of vinegar landed on it, nothing happened; calcite, in contrast, makes small bubbles when it touches acid.",
        },
        {
          id: "s4",
          role: "evidence",
          supports: ["s1"],
          text: "Its mass of 53 grams and volume of 20 cubic centimeters give a density of about 2.65 grams per cubic centimeter, which matches the reference value for quartz.",
        },
        {
          id: "s5",
          role: "detail",
          text: "The sample is cloudy white and about 6 centimeters long.",
        },
        {
          id: "s6",
          role: "background",
          text: "The museum shipped the sample in a crate packed with straw.",
        },
        {
          id: "s7",
          role: "background",
          text: "Quartz is one of the most common minerals in Earth's crust.",
        },
        {
          id: "s8",
          role: "claim",
          text: "The museum should display Sample 4 beside its gemstones.",
        },
        {
          id: "s9",
          role: "conclusion",
          text: "Therefore, three separate tests support labeling Sample 4 as quartz.",
        },
      ],
      claimOptions: ["s1", "s8"],
      challenge: {
        type: "evidence",
        claim: "s1",
        valid: ["s2", "s3", "s4"],
        minValid: 2,
        weak: ["s5", "s6", "s7", "s9"],
        explainFrame: "This evidence supports the claim because ___, which means ___.",
        explainTerms: ["because", "which means", "shows", "so"],
        transfer: {
          passage: [
            { id: "t1", role: "claim", text: "Rock sample B is most likely sedimentary." },
            {
              id: "t2",
              role: "evidence",
              text: "It is made of thin layers that split apart along flat surfaces.",
            },
            {
              id: "t3",
              role: "evidence",
              text: "A hand lens shows small rounded grains cemented together, and one layer contains fragments of shells.",
            },
            { id: "t4", role: "detail", text: "The sample is gray and has a mass of 410 grams." },
            {
              id: "t5",
              role: "background",
              text: "A student found it beside a creek after a storm.",
            },
            {
              id: "t6",
              role: "detail",
              text: "Geologists sort rocks into three main types.",
            },
          ],
          claim: "t1",
          valid: ["t2", "t3"],
          minValid: 2,
          weak: ["t4", "t5", "t6"],
        },
      },
      refs: [
        { sentence: "s2", phrase: "it", means: "Sample 4" },
        { sentence: "s3", phrase: "it", means: "Sample 4" },
      ],
      layers: {
        meaning: [
          { s: "s1", phrase: "most likely", label: "a careful claim, not a certain one" },
          {
            s: "s4",
            phrase: "about 2.65 grams per cubic centimeter",
            label: "evidence: a calculated measurement",
          },
        ],
        discourse: [
          { s: "s2", phrase: "whereas", label: "contrasts two minerals" },
          { s: "s3", phrase: "in contrast", label: "contrasts two reactions" },
          { s: "s9", phrase: "Therefore", label: "signals the conclusion" },
        ],
        sentence: [
          {
            s: "s4",
            phrase: "which matches the reference value for quartz",
            label: "clause that comments on the whole measurement",
          },
        ],
        word: [
          { s: "s2", phrase: "harder", label: "science word", def: "more resistant to scratching" },
          {
            s: "s4",
            phrase: "density",
            label: "science word",
            def: "how much mass fits in a given volume",
          },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "morphology",
      title: "Word parts in the mineral guide",
      words: [
        {
          word: "translucent",
          parts: [
            { t: "trans", type: "prefix", meaning: "across, through" },
            { t: "luc", type: "root", meaning: "light" },
            { t: "ent", type: "suffix", meaning: "having the quality of" },
          ],
          ask: "Putting the parts together, what does a translucent mineral do with light?",
        },
        {
          word: "geology",
          parts: [
            { t: "geo", type: "root", meaning: "earth" },
            { t: "logy", type: "suffix", meaning: "the study of" },
          ],
          ask: "What does a geologist study, based on the parts?",
        },
        {
          word: "classification",
          parts: [
            { t: "class", type: "root", meaning: "a group of similar things" },
            { t: "ific", type: "suffix", meaning: "to make or cause" },
            { t: "ation", type: "suffix", meaning: "the act or result of" },
          ],
          ask: "How do the three parts build the meaning of this noun?",
        },
        {
          word: "microscopic",
          parts: [
            { t: "micro", type: "prefix", meaning: "very small" },
            { t: "scop", type: "root", meaning: "look at" },
            { t: "ic", type: "suffix", meaning: "relating to" },
          ],
          ask: "What kind of object is too small to see without a tool?",
        },
      ],
      transfer: {
        words: [
          {
            word: "transparent",
            parts: [
              { t: "trans", type: "prefix", meaning: "across, through" },
              { t: "parent", type: "root", meaning: "appear, show itself" },
            ],
            ask: "What do the parts suggest about light passing through a transparent mineral?",
          },
          {
            word: "hydrology",
            parts: [
              { t: "hydro", type: "root", meaning: "water" },
              { t: "logy", type: "suffix", meaning: "the study of" },
            ],
            ask: "What does a hydrologist study, based on the parts?",
          },
        ],
      },
    },
    {
      kind: "build",
      module: "combine",
      title: "Sentence combining",
      pair: ["Sample 4 has six flat sides.", "Sample 4 narrows to a point at one end."],
      relation: "addition",
      keep: ["sample", "six", "sides", "point"],
      transfer: {
        pair: ["The crystal is cloudy white.", "The crystal flashes like glass in side light."],
        relation: "addition",
        keep: ["crystal", "white", "glass"],
      },
    },
  ],
  communicate: {
    kind: "compose",
    mode: "write",
    prompt:
      "Write an entry for the museum's mineral guide about Sample 4. Define what kind of material it is, describe its properties with precise facts and measurements, group your ideas with signal words, and end with a concluding sentence.",
    audience: [
      "Visitors reading the museum's mineral guide",
      "Visitantes que leen la guía de minerales del museo",
    ],
    genre: "description",
    topicTerms: [
      "quartz",
      "mineral",
      "hardness",
      "crystal",
      "density",
      "luster",
      "glass",
      "vinegar",
      "property",
    ],
    sourceTerms: [
      "scratches glass",
      "six flat sides",
      "2.65",
      "vinegar",
      "53 grams",
      "20 cubic centimeters",
    ],
    evidenceBank: [
      {
        id: "hard",
        text: "Sample 4 scratches a glass plate; a steel nail leaves no mark on it.",
        kind: "fact",
      },
      {
        id: "shape",
        text: "Sample 4 is about 6 centimeters long, with six flat sides that narrow to a point.",
        kind: "number",
      },
      {
        id: "acid",
        text: "A drop of vinegar made no bubbles on Sample 4; limestone from the same crate bubbled.",
        kind: "fact",
      },
      {
        id: "dens",
        text: "Mass 53 grams and volume 20 cubic centimeters give a density of about 2.65 grams per cubic centimeter.",
        kind: "number",
      },
      { id: "lust", text: "With side lighting, the flat faces flash like glass.", kind: "fact" },
      {
        id: "ref",
        text: "Reference card: quartz has a density of 2.65 grams per cubic centimeter.",
        kind: "quote",
      },
    ],
    organizer: ["topic", "details", "organize", "close"],
    readerQuestions: {
      topic: "What is Sample 4, and what category of material does it belong to?",
      details: "Which measurement or test result makes this description precise?",
      organize: "How are your properties grouped, and which words connect them?",
      close: "What should a visitor remember about this sample?",
    },
    minWords: 70,
  },
  improve: {
    models: {
      topic: "Quartz is a hard, glassy mineral that forms crystals with six flat sides.",
      details:
        "Sample 4 scratches glass, resists a steel nail, and has a density of about 2.65 grams per cubic centimeter.",
      organize:
        "First, quartz is identified by its hardness; second, by its six-sided crystals; also, by its lack of reaction to vinegar.",
      close:
        "In conclusion, hardness, crystal shape and a lack of reaction to vinegar together identify Sample 4 as quartz.",
    },
    whys: [
      {
        id: "why-topic",
        text: "It names the category the sample belongs to, so the reader knows what kind of thing is described.",
        moves: ["topic"],
      },
      {
        id: "why-data",
        text: "It reports measurements and test results, so the description is precise and checkable.",
        moves: ["details"],
      },
      {
        id: "why-signal",
        text: "It groups the properties with signal words, so the reader can follow how they connect.",
        moves: ["organize"],
      },
      {
        id: "why-close",
        text: "It ends by pulling the properties together, so the reader leaves with one clear idea.",
        moves: ["close"],
      },
    ],
  },
  show: {
    kind: "converse",
    mode: "speak",
    prompt:
      "New situation: A planetarium wants a short spoken description of Mars for visitors. Facts you may use: Mars is the fourth planet from the Sun, and it is a rocky planet. Its diameter is about 4,200 miles, roughly half the diameter of Earth. Its surface looks red because the soil contains iron oxide, which is rust. Its atmosphere is thin and is mostly carbon dioxide. Average temperatures are about minus 80 degrees Fahrenheit. Mars has two small moons, named Phobos and Deimos. Give the visitors a clear, organized description of Mars.",
    partner: {
      name: "Ms. Tran",
      glyph: "👩🏻‍🏫",
      role: ["Planetarium educator", "Educadora del planetario"],
      opening:
        "Our visitors arrive in ten minutes and want to learn about Mars. Please begin your description when you are ready.",
    },
    topicTerms: [
      "Mars",
      "planet",
      "surface",
      "atmosphere",
      "diameter",
      "moons",
      "temperature",
      "iron",
    ],
    sourceTerms: ["4,200 miles", "iron oxide", "carbon dioxide", "minus 80", "Phobos", "Deimos"],
    lines: [
      {
        id: "surface",
        terms: ["surface", "red", "rust", "iron", "soil", "dust", "rocky", "color"],
        evidenceTerms: ["iron oxide", "rust", "iron"],
        ack: "So you are describing the surface of the planet.",
        probe: "What does the surface look like, and what gives it that appearance?",
        close: "The look of the surface and what causes it",
      },
      {
        id: "size",
        terms: ["size", "diameter", "miles", "half", "earth", "moons", "small"],
        evidenceTerms: ["4,200", "half", "phobos", "deimos"],
        ack: "So you are describing how big Mars is.",
        probe: "How could you measure the size, and how does it compare with another planet?",
        close: "A measurement and a comparison",
      },
      {
        id: "air",
        terms: ["atmosphere", "air", "thin", "carbon", "dioxide", "temperature", "cold", "degrees"],
        evidenceTerms: ["carbon dioxide", "minus 80", "thin"],
        ack: "So you are describing the air and the temperature.",
        probe: "What is the atmosphere made of, and what would it feel like to stand there?",
        close: "What the atmosphere is made of and its effect on temperature",
      },
    ],
    followUps: {
      topic: "Begin by saying what Mars is and what kind of planet it is.",
      details: "Which measurement or exact fact would make that description more precise?",
      organize:
        "How are your details grouped? Add a word that shows how one idea leads to the next.",
      close: "What is the one idea you want the visitors to remember?",
    },
    maxTurns: 3,
    minWords: 40,
  },
};

export default {
  id: "m04",
  bands: { "3-5": g35, "6-8": g68 },
};
