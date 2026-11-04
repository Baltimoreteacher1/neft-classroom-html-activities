// Mission 5 — Compare and Classify (Unit 2, Inform). Map environment.
// Grades 3-5: Two Cities on the Map (Seattle and Phoenix on a map of the United States).
// Grades 6-8: The Africa Exhibit (the Sahara and the Congo Basin, with grid-map data).
// Title, goal, WIDA and spiral data live in MISSIONS (curriculum.js); family guidance lives in family.js.
// Task content is English; titles, roles and audiences are bilingual [en, es]. Hints ask or point and never state an answer.

const g35 = {
  environment: "map",
  context: {
    title: ["Two Cities on the Map", "Dos ciudades en el mapa"],
    premise:
      "Mr. Reyes's class has pen pals in two cities: Seattle, Washington and Phoenix, Arizona. The class uses a map of the United States to find out how the two places are alike and different.",
    cast: [
      {
        id: "reyes",
        name: "Mr. Reyes",
        role: ["Classroom teacher", "Maestro de la clase"],
        glyph: "👨🏽‍🏫",
      },
      { id: "lila", name: "Lila", role: ["Class reporter", "Reportera de la clase"], glyph: "👧🏻" },
    ],
  },
  vocab: [
    [
      "compare",
      "to tell how things are alike and different",
      "comparar: decir en qué se parecen y en qué se diferencian las cosas",
    ],
    ["alike", "the same in some way", "parecido: que se parece en algún aspecto"],
    ["different", "not the same", "diferente: que no es igual"],
    [
      "climate",
      "the usual weather of a place over many years",
      "clima: el tiempo habitual de un lugar durante muchos años",
    ],
    ["rainfall", "the amount of rain that falls", "lluvia: la cantidad de lluvia que cae"],
    [
      "temperature",
      "how hot or cold something is",
      "temperatura: qué tan caliente o frío está algo",
    ],
    ["desert", "a very dry place with little rain", "desierto: lugar muy seco con poca lluvia"],
    [
      "evergreen",
      "a tree that keeps green leaves all year",
      "árbol de hoja perenne: árbol que mantiene sus hojas verdes todo el año",
    ],
  ],
  frames: {
    A: [
      "___ and ___ are alike because both ___.",
      "___ gets ___ inches of rain, but ___ gets ___.",
      "One difference is ___. Another difference is ___.",
      "In conclusion, ___.",
    ],
    B: ["Both ___.", "___, but ___.", "In conclusion, ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "Mr. Reyes wants the class to compare Seattle and Phoenix. What do the map and charts show about how the two places are alike and different?",
    objects: [
      {
        id: "seattle",
        label: "Seattle pin",
        glyph: "📍",
        x: 12,
        y: 18,
        relevant: true,
        note: "Seattle, Washington is in the northwest corner of the United States map. It is a big city next to the water, in the corner nearest the Pacific Ocean.",
      },
      {
        id: "phoenix",
        label: "Phoenix pin",
        glyph: "📍",
        x: 20,
        y: 70,
        relevant: true,
        note: "Phoenix, Arizona is in the southwest part of the map. It is a big city in a desert.",
      },
      {
        id: "rain",
        label: "Rain chart",
        glyph: "🌧️",
        x: 46,
        y: 26,
        relevant: true,
        note: "Rain chart: Seattle gets about 39 inches of rain each year. Phoenix gets about 7 inches of rain each year.",
      },
      {
        id: "heat",
        label: "Temperature chart",
        glyph: "🌡️",
        x: 72,
        y: 44,
        relevant: true,
        note: "Temperature chart: on a July day, Seattle is usually about 76 degrees. Phoenix is usually about 106 degrees.",
      },
      {
        id: "plants",
        label: "Plant card",
        glyph: "🌵",
        x: 55,
        y: 80,
        relevant: true,
        note: "Plant card: tall evergreen trees grow in Seattle. Saguaro cactus plants grow in Phoenix.",
      },
      {
        id: "stamp",
        label: "Map stamp",
        glyph: "🏷️",
        x: 90,
        y: 90,
        relevant: false,
        note: "A small stamp in the corner of the map says it was printed on recycled paper.",
      },
    ],
    controls: [
      {
        id: "layer",
        label: "Map layer",
        initial: "rain",
        options: [
          { id: "rain", label: "Rainfall" },
          { id: "heat", label: "July temperature" },
        ],
      },
      {
        id: "city",
        label: "Zoom to",
        initial: "seattle",
        options: [
          { id: "seattle", label: "Seattle" },
          { id: "phoenix", label: "Phoenix" },
        ],
      },
    ],
    outcomes: [
      {
        when: { layer: "rain", city: "seattle" },
        mood: "good",
        key: "sea-rain",
        state: "The rainfall layer turns dark blue over Seattle: about 39 inches a year.",
      },
      {
        when: { layer: "rain", city: "phoenix" },
        mood: "good",
        key: "phx-rain",
        state: "The rainfall layer stays pale yellow over Phoenix: about 7 inches a year.",
      },
      {
        when: { layer: "heat", city: "seattle" },
        mood: "good",
        key: "sea-heat",
        state:
          "The temperature layer turns light orange over Seattle: about 76 degrees on a July day.",
      },
      {
        when: { layer: "heat", city: "phoenix" },
        mood: "good",
        key: "phx-heat",
        state:
          "The temperature layer turns deep red over Phoenix: about 106 degrees on a July day.",
      },
    ],
    collect: 3,
    variables: [
      {
        id: "rain",
        label: "rainfall",
        terms: ["rain", "rainfall", "inches", "wet", "wetter", "dry", "drier"],
        evidenceTerms: ["39", "7", "inches"],
        probe: "You are comparing the rain. What number does the rain chart show for each city?",
        good: "A number for each city",
      },
      {
        id: "heat",
        label: "temperature",
        terms: ["hot", "hotter", "temperature", "degrees", "warm", "cooler", "july"],
        evidenceTerms: ["76", "106", "degrees"],
        probe:
          "You are comparing how hot it is. What does the temperature chart say for each city?",
        good: "A number for each city",
      },
      {
        id: "plants",
        label: "plants",
        terms: ["plants", "trees", "cactus", "evergreen", "saguaro", "grow"],
        evidenceTerms: ["evergreen", "saguaro", "cactus"],
        probe:
          "You are comparing the plants. What kind of plant does the plant card show for each place?",
        good: "A kind of plant for each place",
      },
      {
        id: "place",
        label: "location",
        terms: ["northwest", "southwest", "west", "western", "map", "ocean", "corner", "near"],
        evidenceTerms: ["northwest", "southwest", "corner", "ocean"],
        probe: "You are comparing where the cities are. Where is each one on the map?",
        good: "A place on the map for each city",
      },
    ],
    partner: {
      name: "Mr. Reyes",
      glyph: "👨🏽‍🏫",
      opening:
        "Our pen pals live in Seattle and in Phoenix. Look at the map. How are these two places alike and different?",
      noCause:
        "I can tell you looked closely. Now tell me one way the places are alike or one way they are different.",
      noEvidence: "What fact from the map shows that?",
      thanks: "Thank you. Now the class can tell our pen pals what to expect.",
    },
    respond: {
      prompt:
        "Tell Mr. Reyes one way Seattle and Phoenix are alike or different. Use a fact from the map.",
      minWords: 12,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "place",
      title: "Mr. Reyes points to places on the map",
      grid: { cols: 3, rows: 3 },
      script: [
        {
          id: "u1",
          text: "Look at the map of the United States. It is cut into nine squares.",
          signal: "nine squares",
        },
        {
          id: "u2",
          text: "Seattle is in the northwest, in the top left corner.",
          signal: "northwest",
        },
        {
          id: "u3",
          text: "Phoenix is in the southwest, in the bottom left corner.",
          signal: "southwest",
        },
        {
          id: "u4",
          text: "New York City is in the northeast, in the top right corner.",
          signal: "northeast",
        },
        {
          id: "u5",
          text: "Miami is in the southeast, in the bottom right corner.",
          signal: "southeast",
        },
        { id: "u6", text: "Kansas is in the center of the map.", signal: "center" },
      ],
      items: [
        { id: "seattle", label: "Seattle", glyph: "🌲" },
        { id: "phoenix", label: "Phoenix", glyph: "🌵" },
        { id: "nyc", label: "New York City", glyph: "🏙️" },
        { id: "miami", label: "Miami", glyph: "🌴" },
        { id: "kansas", label: "Kansas", glyph: "🌾" },
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
        { item: "seattle", target: "nw", utterance: "u2" },
        { item: "phoenix", target: "sw", utterance: "u3" },
        { item: "nyc", target: "ne", utterance: "u4" },
        { item: "miami", target: "se", utterance: "u5" },
        { item: "kansas", target: "c", utterance: "u6" },
      ],
      visuals: {
        u2: "The top left square highlighted, with a compass pointing northwest",
        u3: "The bottom left square highlighted",
        u4: "The top right square highlighted",
        u5: "The bottom right square highlighted",
        u6: "The middle square highlighted",
      },
      xray: {
        keywords: ["northwest", "southwest", "northeast", "southeast", "center"],
        sequence: [],
        cause: [],
        referents: [{ phrase: "It", means: "the map of the United States" }],
      },
      final: {
        mode: "sort",
        title: "Which city? Sort the facts",
        script: [
          { id: "f1", text: "Now sort the facts about the two cities." },
          {
            id: "f2",
            text: "Seattle gets a lot of rain, about 39 inches each year.",
            signal: "a lot of rain",
          },
          {
            id: "f3",
            text: "Phoenix gets only a little rain, about 7 inches each year.",
            signal: "only a little",
          },
          {
            id: "f4",
            text: "Seattle has tall evergreen trees, but Phoenix has cactus plants that store water.",
            signal: "but",
          },
          {
            id: "f5",
            text: "On a July day, Phoenix is hotter than Seattle.",
            signal: "hotter than",
          },
        ],
        items: [
          { id: "rain39", label: "About 39 inches of rain", glyph: "🌧️" },
          { id: "rain8", label: "About 7 inches of rain", glyph: "☀️" },
          { id: "evergreen", label: "Tall evergreen trees", glyph: "🌲" },
          { id: "cactus", label: "Cactus plants", glyph: "🌵" },
          { id: "hotter", label: "Hotter on a July day", glyph: "🌡️" },
        ],
        targets: [
          { id: "seattle", label: "Seattle" },
          { id: "phoenix", label: "Phoenix" },
        ],
        expect: [
          { item: "rain39", target: "seattle", utterance: "f2" },
          { item: "rain8", target: "phoenix", utterance: "f3" },
          { item: "evergreen", target: "seattle", utterance: "f4" },
          { item: "cactus", target: "phoenix", utterance: "f4" },
          { item: "hotter", target: "phoenix", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Seattle and Phoenix: A Weather Report",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "Seattle and Phoenix have very different weather.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "Seattle gets about 39 inches of rain each year, but Phoenix gets only about 7 inches.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "On a July day, Seattle is usually about 76 degrees, while Phoenix is about 106 degrees.",
        },
        {
          id: "s4",
          role: "evidence",
          supports: ["s1"],
          text: "Seattle has rain on more than 150 days a year, but Phoenix has rain on only about 30 days.",
        },
        { id: "s5", role: "detail", text: "Seattle has about 750,000 people." },
        {
          id: "s6",
          role: "detail",
          text: "Phoenix is a city in Arizona, and it is the state capital.",
        },
        { id: "s7", role: "background", text: "Our class has pen pals in both cities." },
        {
          id: "s8",
          role: "claim",
          text: "Phoenix is a better place to live than Seattle.",
        },
      ],
      claimOptions: ["s1", "s8"],
      challenge: {
        type: "evidence",
        claim: "s1",
        valid: ["s2", "s3", "s4"],
        minValid: 2,
        weak: ["s5", "s6", "s7"],
        explainFrame: "This evidence shows the claim is true because ___.",
        explainTerms: ["because", "shows", "but", "while"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "claim",
              text: "Frogs and lizards are different kinds of animals.",
            },
            {
              id: "t2",
              role: "evidence",
              text: "A frog has smooth, wet skin, but a lizard has dry, scaly skin.",
            },
            {
              id: "t3",
              role: "evidence",
              text: "Frogs lay soft eggs in water, but most lizards lay eggs on land.",
            },
            { id: "t4", role: "detail", text: "Both animals eat insects." },
            { id: "t5", role: "background", text: "The class saw a frog and a lizard at the zoo." },
            { id: "t6", role: "detail", text: "The zoo opens at nine o'clock." },
          ],
          claim: "t1",
          valid: ["t2", "t3"],
          minValid: 2,
          weak: ["t4", "t5", "t6"],
        },
      },
      refs: [{ sentence: "s6", phrase: "it", means: "Phoenix" }],
      layers: {
        meaning: [
          { s: "s1", phrase: "very different weather", label: "the claim to prove" },
          { s: "s2", phrase: "39 inches", label: "evidence: a number" },
        ],
        discourse: [
          { s: "s2", phrase: "but", label: "shows a difference" },
          { s: "s3", phrase: "while", label: "shows a difference" },
        ],
        sentence: [
          {
            s: "s3",
            phrase: "while Phoenix is about 106 degrees",
            label: "clause that contrasts with the first half",
          },
        ],
        word: [
          {
            s: "s2",
            phrase: "inches",
            label: "unit word",
            def: "a way to measure how much rain falls",
          },
          {
            s: "s1",
            phrase: "weather",
            label: "science word",
            def: "what the air outside is like: rain, wind, hot or cold",
          },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "connector",
      title: "Connector laboratory",
      gaps: [
        {
          before: "Seattle gets a lot of rain,",
          after: "Phoenix gets only a little.",
          relation: "contrast",
          options: ["but", "because", "so", "then"],
          ok: ["but"],
        },
        {
          before: "Seattle is in the west,",
          after: "Phoenix is in the west.",
          relation: "addition",
          options: ["and", "because", "but", "then"],
          ok: ["and"],
        },
        {
          before: "Seattle has tall evergreen trees,",
          after: "Phoenix has cactus plants.",
          relation: "contrast",
          options: ["while", "but", "because", "then"],
          ok: ["while", "but"],
        },
      ],
      notes: {
        but: "But shows a difference.",
        and: "And shows something that is the same.",
        while: "While compares two things side by side.",
      },
      transfer: {
        gaps: [
          {
            before: "A frog has smooth skin,",
            after: "a lizard has scaly skin.",
            relation: "contrast",
            options: ["but", "because", "so", "then"],
            ok: ["but"],
          },
          {
            before: "Frogs eat insects,",
            after: "lizards eat insects.",
            relation: "addition",
            options: ["and", "because", "but", "then"],
            ok: ["and"],
          },
        ],
      },
    },
    {
      kind: "build",
      module: "combine",
      title: "Sentence combining",
      pair: ["Seattle gets 39 inches of rain.", "Phoenix gets 7 inches of rain."],
      relation: "contrast",
      keep: ["seattle", "phoenix", "inches"],
      transfer: {
        pair: ["A frog has smooth skin.", "A lizard has dry, scaly skin."],
        relation: "contrast",
        keep: ["frog", "lizard", "skin"],
      },
    },
  ],
  communicate: {
    kind: "converse",
    mode: "discuss",
    prompt:
      "Tell Mr. Reyes how Seattle and Phoenix are alike and how they are different. Use facts from the map, and finish with the most important idea.",
    partner: {
      name: "Mr. Reyes",
      glyph: "👨🏽‍🏫",
      role: ["Classroom teacher", "Maestro de la clase"],
      opening:
        "Our pen pals want to know about each other's cities. How are Seattle and Phoenix alike and different?",
    },
    topicTerms: ["Seattle", "Phoenix", "rain", "temperature", "plants", "map", "city", "weather"],
    sourceTerms: ["39 inches", "7 inches", "76 degrees", "106 degrees", "evergreen", "cactus"],
    evidenceBank: [
      "Seattle gets about 39 inches of rain a year; Phoenix gets about 7 inches.",
      "On a July day, Seattle is about 76 degrees and Phoenix is about 106 degrees.",
      "Seattle has tall evergreen trees; Phoenix has saguaro cactus plants.",
      "Seattle is in the northwest and Phoenix is in the southwest, so both are in the western United States.",
    ],
    lines: [
      {
        id: "rain",
        terms: ["rain", "rainfall", "inches", "wet", "dry"],
        evidenceTerms: ["39", "7", "inches"],
        ack: "So you are comparing how much rain each city gets.",
        probe: "What numbers does the rain chart give for each city?",
        close: "A number for each city",
      },
      {
        id: "heat",
        terms: ["hot", "hotter", "temperature", "degrees", "warm", "cooler", "july"],
        evidenceTerms: ["76", "106", "degrees"],
        ack: "So you are comparing how hot the two cities are.",
        probe: "What does the temperature chart say about a July day in each city?",
        close: "A number for each city",
      },
      {
        id: "plants",
        terms: ["plants", "trees", "cactus", "evergreen", "grow"],
        evidenceTerms: ["evergreen", "saguaro", "cactus"],
        ack: "So you are comparing the plants in the two places.",
        probe: "What kind of plant does the plant card show for each city?",
        close: "A kind of plant for each city",
      },
      {
        id: "place",
        terms: ["northwest", "southwest", "west", "map", "ocean", "corner", "both"],
        evidenceTerms: ["northwest", "southwest", "corner", "ocean"],
        ack: "So you are telling me where the cities are on the map.",
        probe: "Where is each city on the map, and what do you notice about the two places?",
        close: "A place on the map for each city",
      },
    ],
    followUps: {
      topic: "Which two places are you comparing, and what kind of places are they?",
      details: "Which exact number or fact would help me compare them?",
      organize:
        "Which word shows how the places are alike, and which word shows how they are different?",
      close: "What is the main thing you want me to remember about the two places?",
    },
    maxTurns: 3,
    minWords: 25,
  },
  improve: {
    models: {
      topic: "Seattle and Phoenix are two big cities in the western United States.",
      details: "Seattle gets about 39 inches of rain a year, and Phoenix gets about 7 inches.",
      organize:
        "Both cities are in the western United States, but Seattle is rainy while Phoenix is dry.",
      close:
        "In conclusion, Seattle and Phoenix are alike in where they are, but different in their weather.",
    },
    whys: [
      {
        id: "why-topic",
        text: "It says which two things I am comparing, so my listener knows what to expect.",
        moves: ["topic"],
      },
      {
        id: "why-number",
        text: "It uses a number for each place, so my listener can really compare them.",
        moves: ["details"],
      },
      {
        id: "why-signal",
        text: "It uses words like both, but and while, so my listener hears what is alike and what is different.",
        moves: ["organize"],
      },
      {
        id: "why-close",
        text: "It ends with the main idea, so my listener remembers it.",
        moves: ["close"],
      },
    ],
  },
  show: {
    kind: "compose",
    mode: "write",
    prompt:
      "New situation: A science fair poster compares two bears. A polar bear lives in the Arctic on sea ice. Its fur looks white, and it eats mostly seals. A big male can weigh about 1,000 pounds. A grizzly bear lives in forests and mountains. Its fur is brown, and it eats berries, fish and other animals. A big male can weigh about 600 pounds. Both bears are large, have thick fur and can swim. Write about how the two bears are alike and different for visitors to the science fair.",
    audience: ["Visitors to the science fair", "Visitantes de la feria de ciencias"],
    genre: "description",
    topicTerms: ["bear", "polar", "grizzly", "fur", "weigh", "pounds", "eat", "alike", "different"],
    sourceTerms: ["1,000 pounds", "600 pounds", "seals", "berries", "white", "brown"],
    organizer: ["topic", "details", "organize", "close"],
    readerQuestions: {
      topic: "Which two animals are you comparing, and what kind of animals are they?",
      details: "Which exact facts or numbers show how they are alike or different?",
      organize: "Which words show what is alike and what is different?",
      close: "What is the main thing you want visitors to remember?",
    },
    minWords: 35,
  },
};

const g68 = {
  environment: "map",
  context: {
    title: ["The Africa Exhibit", "La exhibición sobre África"],
    premise:
      "The city science museum is planning an exhibit about two regions of Africa: the Sahara and the Congo Basin. Dr. Okoye, the exhibit's geographer, asks the class to compare the regions using map data and to write labels backed by evidence.",
    cast: [
      { id: "okoye", name: "Dr. Okoye", role: ["Geographer", "Geógrafa"], glyph: "👩🏿‍🏫" },
      {
        id: "marcus",
        name: "Marcus",
        role: ["Exhibit assistant", "Asistente de la exhibición"],
        glyph: "🧑🏾",
      },
    ],
  },
  vocab: [
    ["region", "a large area with shared features", "región: un área grande con rasgos en común"],
    [
      "climate",
      "the typical weather of a place over many years",
      "clima: el tiempo típico de un lugar durante muchos años",
    ],
    [
      "precipitation",
      "water that falls from the sky as rain, snow or hail",
      "precipitación: agua que cae del cielo como lluvia, nieve o granizo",
    ],
    [
      "equator",
      "the imaginary line around the middle of Earth",
      "ecuador: la línea imaginaria alrededor del centro de la Tierra",
    ],
    ["species", "one kind of living thing", "especie: un tipo de ser vivo"],
    [
      "similarity",
      "a way that two things are alike",
      "semejanza: una manera en que dos cosas se parecen",
    ],
    [
      "contrast",
      "a difference you notice when you compare things",
      "contraste: una diferencia que notas al comparar cosas",
    ],
    [
      "evidence",
      "information that supports a conclusion",
      "evidencia: información que apoya una conclusión",
    ],
  ],
  frames: {
    A: [
      "The Sahara and the Congo Basin are similar because ___.",
      "___ whereas ___.",
      "In contrast, ___.",
      "Overall, the evidence shows ___.",
    ],
    B: ["Both ___; however, ___.", "Overall, ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "Dr. Okoye needs a label that compares the Sahara and the Congo Basin. Which similarities and differences does the exhibit data support?",
    objects: [
      {
        id: "map",
        label: "Africa map",
        glyph: "🗺️",
        x: 45,
        y: 14,
        relevant: true,
        note: "Map: the Sahara stretches across the northern part of Africa. The Congo Basin lies in the center of the continent, on the equator. Each region covers more than a million square miles.",
      },
      {
        id: "rain",
        label: "Rainfall table",
        glyph: "📊",
        x: 18,
        y: 44,
        relevant: true,
        note: "Rainfall table: most of the Sahara receives less than 3 inches of precipitation a year. The Congo Basin receives 60 to 80 inches.",
      },
      {
        id: "temp",
        label: "Temperature graph",
        glyph: "🌡️",
        x: 70,
        y: 40,
        relevant: true,
        note: "Temperature graph: summer daytime highs in the Sahara often pass 100 degrees Fahrenheit, and winter nights can fall below 50. In the Congo Basin the temperature stays between about 77 and 86 degrees all year.",
      },
      {
        id: "plants",
        label: "Plant survey",
        glyph: "🌿",
        x: 30,
        y: 78,
        relevant: true,
        note: "Plant survey: scientists have recorded about 2,800 plant species in the Sahara and more than 10,000 in the Congo Basin.",
      },
      {
        id: "photo",
        label: "Satellite photo",
        glyph: "🛰️",
        x: 80,
        y: 72,
        relevant: true,
        note: "Satellite photo caption: from space, the Sahara looks tan and orange, and the Congo Basin looks dark green.",
      },
      {
        id: "poster",
        label: "Tourism poster",
        glyph: "🧳",
        x: 92,
        y: 90,
        relevant: false,
        note: "A tourism poster on the wall says “Visit Africa this summer!” It lists no data about either region.",
      },
    ],
    controls: [
      {
        id: "region",
        label: "Region",
        initial: "sahara",
        options: [
          { id: "sahara", label: "Sahara" },
          { id: "congo", label: "Congo Basin" },
        ],
      },
      {
        id: "layer",
        label: "Map layer",
        initial: "rain",
        options: [
          { id: "rain", label: "Precipitation" },
          { id: "temp", label: "Temperature" },
        ],
      },
    ],
    outcomes: [
      {
        when: { region: "sahara", layer: "rain" },
        mood: "good",
        key: "sahara-rain",
        state:
          "The precipitation layer is pale yellow across the Sahara: less than 3 inches a year in most places.",
      },
      {
        when: { region: "congo", layer: "rain" },
        mood: "good",
        key: "congo-rain",
        state: "The precipitation layer is deep blue over the Congo Basin: 60 to 80 inches a year.",
      },
      {
        when: { region: "sahara", layer: "temp" },
        mood: "good",
        key: "sahara-temp",
        state:
          "The temperature layer shows large swings in the Sahara: above 100 degrees on summer days and below 50 on winter nights.",
      },
      {
        when: { region: "congo", layer: "temp" },
        mood: "good",
        key: "congo-temp",
        state:
          "The temperature layer shows a narrow range over the Congo Basin: between about 77 and 86 degrees all year.",
      },
    ],
    collect: 4,
    variables: [
      {
        id: "rainfall",
        label: "precipitation",
        terms: ["rain", "rainfall", "precipitation", "inches", "dry", "wet", "arid"],
        evidenceTerms: ["3 inches", "60", "80", "inches"],
        probe:
          "You are comparing precipitation. What does the table give for each region, and how large is the gap?",
        good: "A number for each region and the size of the difference",
      },
      {
        id: "temperature",
        label: "temperature",
        terms: [
          "temperature",
          "hot",
          "heat",
          "cold",
          "night",
          "nights",
          "degrees",
          "range",
          "swing",
        ],
        evidenceTerms: ["100", "50", "77", "86"],
        probe:
          "You are comparing temperature. What does the graph show about how steady each region's temperature is?",
        good: "Data for each region and what the pattern means",
      },
      {
        id: "plants",
        label: "plant life",
        terms: ["plant", "plants", "species", "vegetation", "trees", "forest", "green"],
        evidenceTerms: ["2,800", "10,000", "species", "dark green"],
        probe:
          "You are comparing plant life. Which source gave the numbers, and what do they reveal?",
        good: "A number for each region and its source",
      },
      {
        id: "position",
        label: "size and position",
        terms: ["equator", "north", "center", "middle", "map", "size", "square", "million", "both"],
        evidenceTerms: ["equator", "million", "northern", "center"],
        probe:
          "You are comparing where the regions are. What does the map note say about each one?",
        good: "A position or a measurement for each region",
      },
    ],
    partner: {
      name: "Dr. Okoye",
      glyph: "👩🏿‍🏫",
      opening:
        "The exhibit will place the Sahara beside the Congo Basin. What should the label say about how they compare?",
      noCause:
        "That is a start, but a label needs a clear comparison. In what way are the two regions alike or different?",
      noEvidence: "Which table, graph or caption supports that comparison?",
      thanks: "Thank you. A comparison backed by data will make a strong label.",
    },
    respond: {
      prompt:
        "Tell Dr. Okoye how the Sahara and the Congo Basin compare. Name one similarity or difference and support it with evidence from the exhibit data.",
      minWords: 18,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "place",
      title: "Dr. Okoye shows the exhibit map",
      grid: { cols: 4, rows: 3 },
      script: [
        {
          id: "u1",
          text: "Use the map grid: the columns are lettered A to D from west to east, and the rows are numbered 1 to 3 from north to south.",
          signal: "from west to east",
        },
        {
          id: "u2",
          text: "Put the Sahara desert in square B1, in the north.",
          signal: "north",
        },
        {
          id: "u3",
          text: "The Nile delta, where the river meets the Mediterranean Sea, is at the northeast edge of the Sahara, in square C1.",
          signal: "east",
        },
        {
          id: "u4",
          text: "The Congo Basin rainforest is on the equator, in the middle of the continent, in square C2.",
          signal: "middle",
        },
        {
          id: "u5",
          text: "Mount Kilimanjaro rises in the east, in square D2.",
          signal: "east",
        },
        {
          id: "u6",
          text: "Cape Town sits near the southern tip of the continent, in square C3.",
          signal: "southern tip",
        },
      ],
      items: [
        { id: "sahara", label: "Sahara desert", glyph: "🏜️" },
        { id: "nile", label: "Nile delta", glyph: "🌊" },
        { id: "congo", label: "Congo Basin", glyph: "🌳" },
        { id: "kili", label: "Mount Kilimanjaro", glyph: "🏔️" },
        { id: "cape", label: "Cape Town", glyph: "🏙️" },
      ],
      targets: [
        { id: "a1", label: "A1" },
        { id: "b1", label: "B1" },
        { id: "c1", label: "C1" },
        { id: "d1", label: "D1" },
        { id: "a2", label: "A2" },
        { id: "b2", label: "B2" },
        { id: "c2", label: "C2" },
        { id: "d2", label: "D2" },
        { id: "a3", label: "A3" },
        { id: "b3", label: "B3" },
        { id: "c3", label: "C3" },
        { id: "d3", label: "D3" },
      ],
      expect: [
        { item: "sahara", target: "b1", utterance: "u2" },
        { item: "nile", target: "c1", utterance: "u3" },
        { item: "congo", target: "c2", utterance: "u4" },
        { item: "kili", target: "d2", utterance: "u5" },
        { item: "cape", target: "c3", utterance: "u6" },
      ],
      visuals: {
        u2: "Square B1 highlighted in the top row",
        u3: "Square C1 highlighted, one square east of B1",
        u4: "Square C2 highlighted, on the middle row",
        u5: "Square D2 highlighted at the east edge",
        u6: "Square C3 highlighted in the bottom row",
      },
      xray: {
        keywords: ["north", "east", "middle", "southern tip", "square"],
        sequence: [],
        cause: [],
        referents: [{ phrase: "the river", means: "the Nile River" }],
      },
      final: {
        mode: "sort",
        title: "Desert or rainforest?",
        script: [
          { id: "f1", text: "Now classify features of the two regions as desert or rainforest." },
          {
            id: "f2",
            text: "In the desert, temperatures swing from hot days to cold nights.",
            signal: "swing",
          },
          {
            id: "f3",
            text: "In the rainforest, the temperature stays near 80 degrees all year.",
            signal: "all year",
          },
          {
            id: "f4",
            text: "In the desert, acacia trees survive with deep roots that search for water.",
            signal: "deep roots",
          },
          {
            id: "f5",
            text: "In the rainforest, tall trees form a thick canopy that shades the ground.",
            signal: "canopy",
          },
        ],
        items: [
          { id: "swing", label: "Hot days and cold nights", glyph: "🌡️" },
          { id: "steady", label: "Near 80 degrees all year", glyph: "☁️" },
          { id: "roots", label: "Deep roots that search for water", glyph: "🌱" },
          { id: "canopy", label: "A thick canopy of tall trees", glyph: "🌳" },
        ],
        targets: [
          { id: "desert", label: "Desert" },
          { id: "rainforest", label: "Rainforest" },
        ],
        expect: [
          { item: "swing", target: "desert", utterance: "f2" },
          { item: "steady", target: "rainforest", utterance: "f3" },
          { item: "roots", target: "desert", utterance: "f4" },
          { item: "canopy", target: "rainforest", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Two African Regions, Two Climates",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "The Sahara and the Congo Basin lie on the same continent, yet their climates are almost opposite.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "Most of the Sahara receives less than 3 inches of precipitation a year, whereas the Congo Basin receives between 60 and 80 inches.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "Daytime summer temperatures in the Sahara often exceed 100°F, and winter nights can fall below 50°F; in contrast, the Congo Basin stays between about 77°F and 86°F all year.",
        },
        {
          id: "s4",
          role: "reason",
          supports: ["s1"],
          text: "Because the Congo Basin sits on the equator, it receives strong sunlight and moist air every day, which fuels frequent rainstorms.",
        },
        {
          id: "s5",
          role: "evidence",
          supports: ["s1"],
          text: "Scientists have recorded about 2,800 plant species in the Sahara but more than 10,000 in the Congo Basin.",
        },
        {
          id: "s6",
          role: "detail",
          text: "Both regions are enormous, and each covers more than a million square miles.",
        },
        {
          id: "s7",
          role: "background",
          text: "People have lived in both regions for thousands of years.",
        },
        {
          id: "s8",
          role: "claim",
          text: "Travelers should visit the Congo Basin instead of the Sahara.",
        },
        {
          id: "s9",
          role: "conclusion",
          text: "Therefore, a comparison of rainfall, temperature and plant life shows two very different regions.",
        },
      ],
      claimOptions: ["s1", "s8"],
      challenge: {
        type: "evidence",
        claim: "s1",
        valid: ["s2", "s3", "s4", "s5"],
        minValid: 3,
        weak: ["s6", "s7", "s9"],
        explainFrame: "This evidence supports the claim because it shows ___, whereas ___.",
        explainTerms: ["because", "whereas", "in contrast", "shows"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "claim",
              text: "The Mississippi River and the Colorado River differ in length and in how far their water travels.",
            },
            {
              id: "t2",
              role: "evidence",
              text: "The Mississippi is about 2,340 miles long, while the Colorado is about 1,450 miles long.",
            },
            {
              id: "t3",
              role: "evidence",
              text: "The Mississippi flows all the way to the Gulf of Mexico, but so much Colorado River water is used by cities and farms that the river rarely reaches the sea.",
            },
            {
              id: "t4",
              role: "detail",
              text: "Both rivers are popular places for boating and fishing.",
            },
            {
              id: "t5",
              role: "background",
              text: "The Mississippi flows past the city of New Orleans.",
            },
            { id: "t6", role: "detail", text: "Many songs and stories are about the Mississippi." },
          ],
          claim: "t1",
          valid: ["t2", "t3"],
          minValid: 2,
          weak: ["t4", "t5", "t6"],
        },
      },
      refs: [
        { sentence: "s4", phrase: "it", means: "the Congo Basin" },
        { sentence: "s4", phrase: "which", means: "strong sunlight and moist air every day" },
      ],
      layers: {
        meaning: [
          { s: "s1", phrase: "almost opposite", label: "the comparison the claim makes" },
          {
            s: "s2",
            phrase: "less than 3 inches of precipitation",
            label: "evidence: a measurement for the Sahara",
          },
        ],
        discourse: [
          { s: "s2", phrase: "whereas", label: "contrasts two regions" },
          { s: "s3", phrase: "in contrast", label: "contrasts two temperature patterns" },
          { s: "s9", phrase: "Therefore", label: "signals the conclusion" },
        ],
        sentence: [
          {
            s: "s4",
            phrase: "Because the Congo Basin sits on the equator",
            label: "reason clause that opens the sentence",
          },
        ],
        word: [
          {
            s: "s1",
            phrase: "climates",
            label: "science word",
            def: "the typical weather of a place over many years",
          },
          { s: "s5", phrase: "species", label: "academic word", def: "one kind of living thing" },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "combine",
      title: "Sentence combining",
      pair: [
        "The Sahara receives less than 3 inches of rain a year.",
        "The Congo Basin receives 60 to 80 inches.",
      ],
      relation: "contrast",
      keep: ["sahara", "congo", "inches"],
      transfer: {
        pair: [
          "The Mississippi River is about 2,340 miles long.",
          "The Colorado River is about 1,450 miles long.",
        ],
        relation: "contrast",
        keep: ["mississippi", "colorado", "miles"],
      },
    },
    {
      kind: "build",
      module: "connector",
      title: "Connector laboratory",
      gaps: [
        {
          before: "The Sahara is hot and dry by day;",
          after: "the Congo Basin is warm and wet all year.",
          relation: "contrast",
          options: ["whereas", "because", "therefore", "afterward"],
          ok: ["whereas"],
        },
        {
          before: "The Sahara covers more than a million square miles.",
          after: "the Congo Basin covers more than a million square miles.",
          relation: "addition",
          options: ["similarly", "in contrast", "however", "therefore"],
          ok: ["similarly"],
        },
        {
          before: "The Congo Basin sits on the equator,",
          after: "it receives strong sunlight all year.",
          relation: "cause",
          options: ["so", "whereas", "however", "similarly"],
          ok: ["so"],
        },
        {
          before: "The Sahara has about 2,800 plant species;",
          after: "the Congo Basin has more than 10,000.",
          relation: "contrast",
          options: ["in contrast", "similarly", "for example", "therefore"],
          ok: ["in contrast"],
        },
      ],
      notes: {
        whereas: "Whereas sets two different facts side by side in one sentence.",
        similarly: "Similarly signals that the next idea is alike, not different.",
        so: "So shows the result of the cause that comes first.",
        "in contrast":
          "In contrast signals a difference between the sentence before and the one after.",
      },
      transfer: {
        gaps: [
          {
            before: "The Mississippi reaches the Gulf of Mexico,",
            after: "the Colorado rarely reaches the sea.",
            relation: "contrast",
            options: ["whereas", "because", "therefore", "afterward"],
            ok: ["whereas"],
          },
          {
            before: "The Mississippi is popular for boating.",
            after: "the Colorado is popular for boating.",
            relation: "addition",
            options: ["similarly", "in contrast", "however", "therefore"],
            ok: ["similarly"],
          },
        ],
      },
    },
  ],
  communicate: {
    kind: "converse",
    mode: "speak",
    prompt:
      "Present an organized comparison of the Sahara and the Congo Basin to Dr. Okoye. Name the two regions, compare them on at least two features with evidence from the exhibit data, and end with a concluding statement.",
    partner: {
      name: "Dr. Okoye",
      glyph: "👩🏿‍🏫",
      role: ["Geographer", "Geógrafa"],
      opening:
        "The museum director is visiting the exhibit tomorrow. Present your comparison of the two regions as you would to a visitor.",
    },
    topicTerms: [
      "Sahara",
      "Congo",
      "region",
      "climate",
      "precipitation",
      "temperature",
      "species",
      "equator",
    ],
    sourceTerms: ["3 inches", "60 to 80 inches", "100 degrees", "77 and 86", "2,800", "10,000"],
    evidenceBank: [
      "Rainfall table: Sahara under 3 inches a year; Congo Basin 60 to 80 inches.",
      "Temperature graph: Sahara above 100 degrees by day and below 50 at night; Congo Basin 77 to 86 degrees all year.",
      "Plant survey: about 2,800 species in the Sahara; more than 10,000 in the Congo Basin.",
      "Map: each region covers more than a million square miles.",
    ],
    lines: [
      {
        id: "rain",
        terms: ["rain", "rainfall", "precipitation", "inches", "dry", "wet"],
        evidenceTerms: ["3 inches", "60", "80"],
        ack: "So you are comparing precipitation in the two regions.",
        probe: "What does the rainfall table give for each region, and how big is the gap?",
        close: "A number for each region and the size of the difference",
      },
      {
        id: "temp",
        terms: ["temperature", "hot", "cold", "night", "degrees", "range", "steady"],
        evidenceTerms: ["100", "50", "77", "86"],
        ack: "So you are comparing the temperatures.",
        probe: "What does the temperature graph show about how steady each region is?",
        close: "Data for each region and what the pattern means",
      },
      {
        id: "plants",
        terms: ["plant", "plants", "species", "vegetation", "trees", "forest"],
        evidenceTerms: ["2,800", "10,000", "species"],
        ack: "So you are comparing plant life.",
        probe:
          "Which numbers did the plant survey record, and what do they show about each region?",
        close: "A number for each region and what it shows",
      },
      {
        id: "size",
        terms: ["size", "equator", "million", "square", "both", "similar", "alike", "large"],
        evidenceTerms: ["million", "equator"],
        ack: "So you are comparing the size and position of the regions.",
        probe:
          "What does the map note say about each region? Is that a similarity or a difference?",
        close: "A fact from the map and whether it shows a similarity or a difference",
      },
    ],
    followUps: {
      topic: "Begin by naming the two regions and saying what kind of places they are.",
      details: "Which measurement from the exhibit data would make your comparison more precise?",
      organize:
        "How are your points grouped? Add a word that shows which ideas are alike and which are different.",
      close: "How could you end with one statement that sums up the comparison?",
    },
    maxTurns: 3,
    minWords: 40,
  },
  improve: {
    models: {
      topic:
        "The Sahara and the Congo Basin are two regions of Africa with almost opposite climates.",
      details:
        "The Sahara receives less than 3 inches of rain a year, whereas the Congo Basin receives 60 to 80 inches.",
      organize:
        "Both regions are enormous; however, the Sahara is hot and dry by day, while the Congo Basin is warm and wet all year.",
      close:
        "In conclusion, rainfall, temperature and plant life show that these two regions are very different places.",
    },
    whys: [
      {
        id: "why-topic",
        text: "It names both regions and the kind of comparison, so the audience knows what to expect.",
        moves: ["topic"],
      },
      {
        id: "why-data",
        text: "It gives a measurement for each region, so the comparison rests on evidence.",
        moves: ["details"],
      },
      {
        id: "why-signal",
        text: "It uses contrast and similarity words, so the audience can tell what is alike and what is different.",
        moves: ["organize"],
      },
      {
        id: "why-close",
        text: "It ends by pulling the comparison together, so the main idea is easy to remember.",
        moves: ["close"],
      },
    ],
  },
  show: {
    kind: "compose",
    mode: "write",
    prompt:
      "New situation: The school newsletter is running a feature on the polar regions. Facts: The Arctic is a frozen ocean surrounded by land, and polar bears live there. Antarctica is a continent surrounded by ocean, and penguins live there; polar bears do not. Antarctica's ice sheet is more than a mile thick on average, and the lowest temperature ever recorded on Earth, minus 128 degrees Fahrenheit, was measured there. Arctic sea ice floats on the ocean and shrinks each summer. Both regions are cold, and both have months of continuous daylight in summer and months of darkness in winter. Write an organized comparison of the two regions for the newsletter, using the facts as evidence.",
    audience: ["Students reading the school newsletter", "Estudiantes que leen el boletín escolar"],
    genre: "report",
    topicTerms: [
      "Arctic",
      "Antarctica",
      "ice",
      "ocean",
      "continent",
      "polar",
      "penguins",
      "temperature",
    ],
    sourceTerms: ["frozen ocean", "continent", "penguins", "mile thick", "minus 128", "sea ice"],
    organizer: ["topic", "details", "organize", "close"],
    readerQuestions: {
      topic: "Which two regions are you comparing, and what kind of places are they?",
      details: "Which facts or measurements support your comparison?",
      organize: "How are your points grouped, and which words show similarity and difference?",
      close: "What is the main idea a reader should take away?",
    },
    minWords: 70,
  },
};

export default {
  id: "m05",
  bands: { "3-5": g35, "6-8": g68 },
};
