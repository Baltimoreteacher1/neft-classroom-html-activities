// Mission 3 — Different Perspectives (Unit 1, Narrate). Environment: community. Reviews m02 and m01.
// Grades 3-5: "Two Stories About One Parade" (compare two accounts of one event, tell it from another point of view).
// Grades 6-8: "The Night Market Move" (compare vendor, planner and resident accounts, narrate from a chosen perspective).
// Title, goal, WIDA and spiral data live in MISSIONS (curriculum.js); family text lives in family.js.
// Task content is English (the language practiced). Hints ask or point; they never state an answer.

// ───────────────────────────── Grades 3-5 ─────────────────────────────
const g35 = {
  environment: "community",
  context: {
    title: ["Two Stories About One Parade", "Dos relatos de un mismo desfile"],
    premise:
      "On Saturday, a parade marched down Main Street. Nina played the drum in it, and Mrs. Ortiz sells flowers on Main Street. Mr. Benitez writes the neighborhood newsletter, and he heard two very different stories about the same day.",
    cast: [
      {
        id: "benitez",
        name: "Mr. Benitez",
        role: ["Newsletter writer", "Escritor del boletín del barrio"],
        glyph: "👨🏽‍💼",
      },
      {
        id: "nina",
        name: "Nina",
        role: ["Drummer in the parade", "Tamborilera del desfile"],
        glyph: "🧒🏾",
      },
      {
        id: "ortiz",
        name: "Mrs. Ortiz",
        role: ["Flower seller", "Vendedora de flores"],
        glyph: "👩🏽",
      },
    ],
  },
  vocab: [
    [
      "point of view",
      "the way one person sees or feels about something",
      "punto de vista: la manera en que una persona ve o siente algo",
    ],
    ["account", "a telling of what happened", "relato: lo que alguien cuenta sobre lo que pasó"],
    ["event", "something that happens", "suceso: algo que pasa"],
    [
      "parade",
      "a line of people who march through the streets to celebrate",
      "desfile: una fila de personas que marcha por las calles para celebrar",
    ],
    [
      "customer",
      "a person who buys something at a shop",
      "cliente: una persona que compra algo en una tienda",
    ],
    [
      "compare",
      "to tell how things are alike and different",
      "comparar: decir en qué se parecen y en qué se diferencian las cosas",
    ],
    [
      "however",
      "a word that shows a different idea is coming",
      "sin embargo: una palabra que anuncia una idea distinta",
    ],
    [
      "detour",
      "a different road you take when the usual road is closed",
      "desvío: otro camino que tomas cuando el de siempre está cerrado",
    ],
  ],
  frames: {
    A: [
      "Nina says ___, but Mrs. Ortiz says ___.",
      "From ___'s point of view, ___. However, from ___'s point of view, ___.",
      "They tell different stories because ___.",
      "I am ___. For me, the day was ___ because ___.",
    ],
    B: ["From ___'s point of view, ___.", "However, ___ saw ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "Why do Nina and Mrs. Ortiz tell the story of Saturday's parade so differently? Look at Main Street, then tell what happened from more than one point of view.",
    objects: [
      {
        id: "drum",
        label: "Nina's drum",
        glyph: "🥁",
        x: 16,
        y: 62,
        relevant: true,
        note: "Nina's snare drum is covered in confetti. A ribbon on it says Marching Band, Front of the Parade.",
      },
      {
        id: "stand",
        label: "Flower stand",
        glyph: "💐",
        x: 78,
        y: 30,
        relevant: true,
        note: "Mrs. Ortiz's flower stand is on Main Street. Most of the buckets are still full. A sign says, Fresh flowers, 3 dollars.",
      },
      {
        id: "sign",
        label: "Street closed sign",
        glyph: "🚧",
        x: 48,
        y: 20,
        relevant: true,
        note: "A sign says: Main Street closed to cars, Saturday, 9 to 1. Cars must use Oak Street.",
      },
      {
        id: "bus",
        label: "Bus 12 sign",
        glyph: "🚌",
        x: 30,
        y: 82,
        relevant: true,
        note: "A bus sign says: Bus 12 is on Oak Street today. Walk two blocks to Main Street.",
      },
      {
        id: "crowd",
        label: "Crowd photo",
        glyph: "📸",
        x: 60,
        y: 70,
        relevant: true,
        note: "In the photo, the sidewalk is full of people. They are clapping for the band. Most of them walk past the flower stand without stopping.",
      },
      {
        id: "pigeon",
        label: "Pigeon on a lamp post",
        glyph: "🐦",
        x: 90,
        y: 84,
        relevant: false,
        note: "A pigeon sits on a lamp post. It watches the crowd and does not seem to care about the parade.",
      },
    ],
    controls: [
      {
        id: "street",
        label: "Main Street",
        initial: "closed",
        options: [
          { id: "closed", label: "Closed for the parade" },
          { id: "open", label: "Open to cars" },
        ],
      },
      {
        id: "view",
        label: "Where you stand",
        initial: "parade",
        options: [
          { id: "parade", label: "In the parade" },
          { id: "stand", label: "At the flower stand" },
        ],
      },
    ],
    outcomes: [
      {
        when: { street: "closed", view: "parade" },
        mood: "good",
        key: "party",
        state:
          "You hear the drums and the cheers. The crowd claps for the band. It feels like a big party.",
      },
      {
        when: { street: "closed", view: "stand" },
        mood: "warn",
        key: "slow",
        state:
          "Few customers come. Cars cannot drive up, and people watch the parade instead of buying flowers.",
      },
      {
        when: { street: "open", view: "parade" },
        mood: "warn",
        key: "stopped",
        state: "Cars honk and the band has to stop marching. The parade feels crowded and short.",
      },
      {
        when: { street: "open", view: "stand" },
        mood: "good",
        key: "busy",
        state: "Cars drive by, and customers stop to buy flowers. It is a normal, busy Saturday.",
      },
    ],
    collect: 3,
    variables: [
      {
        id: "nina",
        label: "Nina's view: the fun of the parade",
        terms: [
          "nina",
          "band",
          "drum",
          "drums",
          "music",
          "cheered",
          "cheering",
          "loud",
          "fun",
          "party",
          "marched",
        ],
        evidenceTerms: ["confetti", "ribbon", "clapping", "crowd", "front"],
        probe:
          "You are telling it the way Nina sees it. What did you notice that shows how she felt?",
        good: "A clue about the drum or the crowd",
      },
      {
        id: "ortiz",
        label: "Mrs. Ortiz's view: the slow day",
        terms: ["ortiz", "flowers", "stand", "shop", "customers", "sell", "sold", "slow", "closed"],
        evidenceTerms: ["buckets", "full", "closed", "cars", "sign", "stopping"],
        probe:
          "You are telling it the way Mrs. Ortiz sees it. What clue shows what her day was like?",
        good: "A clue from the stand, the sign, or the sidewalk",
      },
      {
        id: "rider",
        label: "A bus rider's view: the detour",
        terms: ["bus", "rider", "detour", "walk", "walked", "oak", "blocks", "late"],
        evidenceTerms: ["bus 12", "oak street", "two blocks", "sign"],
        probe:
          "You think of someone who rides the bus. What does the bus sign tell that person to do?",
        good: "What the bus sign asks a rider to do",
      },
    ],
    partner: {
      name: "Mr. Benitez",
      glyph: "👨🏽‍💼",
      opening:
        "Two neighbors told me very different stories about Saturday's parade. Why do you think their stories are so different?",
      noCause:
        "You told me what you noticed. Now tell me why two stories about one day could be different.",
      noEvidence: "What did you see on Main Street that makes you say that?",
      thanks: "Thank you. Now I can write about both neighbors in the newsletter.",
    },
    respond: {
      prompt:
        "Tell Mr. Benitez why the two stories are different, and tell what Saturday was like for at least one person. Use something you saw.",
      minWords: 15,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "sort",
      title: "Nina and Mrs. Ortiz tell their stories",
      script: [
        {
          id: "u1",
          text: "Hi, I'm Nina, and I played the drum in Saturday's parade.",
          signal: "I'm Nina",
        },
        { id: "u2", text: "For me, it was the best part of the whole week.", signal: "For me" },
        {
          id: "u3",
          text: "The crowd cheered, and our drums were loud and fast.",
          signal: "cheered",
        },
        {
          id: "u4",
          text: "I'm Mrs. Ortiz, and I sell flowers on Main Street.",
          signal: "I'm Mrs. Ortiz",
        },
        { id: "u5", text: "For my shop, Saturday was a very slow day.", signal: "For my shop" },
        {
          id: "u6",
          text: "The street was closed, so my customers could not park near my stand.",
          signal: "so",
        },
      ],
      items: [
        { id: "best", label: "The best part of the week", glyph: "⭐" },
        { id: "drums", label: "Loud, fast drums", glyph: "🥁" },
        { id: "cheer", label: "The crowd cheered", glyph: "👏" },
        { id: "slow", label: "A very slow day", glyph: "🐌" },
        { id: "park", label: "Customers could not park", glyph: "🚗" },
      ],
      targets: [
        { id: "nina", label: "Nina" },
        { id: "ortiz", label: "Mrs. Ortiz" },
      ],
      expect: [
        { item: "best", target: "nina", utterance: "u2" },
        { item: "drums", target: "nina", utterance: "u3" },
        { item: "cheer", target: "nina", utterance: "u3" },
        { item: "slow", target: "ortiz", utterance: "u5" },
        { item: "park", target: "ortiz", utterance: "u6" },
      ],
      visuals: {
        u2: "A drummer with a big smile in a marching band",
        u3: "A crowd with raised hands beside a band",
        u5: "A flower stand with full buckets and no customers",
        u6: "A road with a closed-street sign and no cars",
      },
      xray: {
        keywords: ["I'm Nina", "For me", "I'm Mrs. Ortiz", "For my shop"],
        sequence: [],
        cause: ["so"],
        referents: [{ phrase: "my stand", means: "Mrs. Ortiz's flower stand" }],
      },
      final: {
        mode: "place",
        title: "A map of Main Street from above",
        grid: { cols: 3, rows: 2 },
        script: [
          { id: "f1", text: "Here is a map of Main Street from above." },
          {
            id: "f2",
            text: "The flower stand is on the left sidewalk, at the top of the map.",
            signal: "left sidewalk",
          },
          {
            id: "f3",
            text: "The police car blocks the street at the top, in the middle.",
            signal: "in the middle",
          },
          {
            id: "f4",
            text: "The drum band marches down the middle of the street, near the bottom.",
            signal: "near the bottom",
          },
          {
            id: "f5",
            text: "The crowd stands on the right sidewalk, near the bottom.",
            signal: "right sidewalk",
          },
        ],
        items: [
          { id: "stand", label: "Flower stand", glyph: "💐" },
          { id: "police", label: "Police car", glyph: "🚓" },
          { id: "band", label: "Drum band", glyph: "🥁" },
          { id: "crowd", label: "The crowd", glyph: "👥" },
        ],
        targets: [
          { id: "tl", label: "Top left" },
          { id: "tm", label: "Top middle" },
          { id: "tr", label: "Top right" },
          { id: "bl", label: "Bottom left" },
          { id: "bm", label: "Bottom middle" },
          { id: "br", label: "Bottom right" },
        ],
        expect: [
          { item: "stand", target: "tl", utterance: "f2" },
          { item: "police", target: "tm", utterance: "f3" },
          { item: "band", target: "bm", utterance: "f4" },
          { item: "crowd", target: "br", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "One Bike Path, Two Stories",
      passage: [
        {
          id: "s1",
          role: "background",
          text: "The city painted a new bike path on Pine Street last month.",
        },
        {
          id: "s2",
          role: "detail",
          text: "Leo rides to school every day, and he feels safe on the new path.",
        },
        {
          id: "s3",
          role: "claim",
          text: "Mr. Park thinks the new bike path is a problem for his bakery.",
        },
        {
          id: "s4",
          role: "evidence",
          supports: ["s3"],
          text: "The path took away the parking spots in front of his shop.",
        },
        {
          id: "s5",
          role: "evidence",
          supports: ["s3"],
          text: "Now his morning customers must park two blocks away, so fewer people come in.",
        },
        {
          id: "s6",
          role: "evidence",
          supports: ["s3"],
          text: "He says, “My customers are my neighbors, and I miss seeing them at the door.”",
        },
        {
          id: "s7",
          role: "detail",
          text: "The path is painted bright green and is two miles long.",
        },
        { id: "s8", role: "claim", text: "The Pine Street path is the longest in the city." },
        {
          id: "s9",
          role: "conclusion",
          text: "Leo and Mr. Park both want a happy street, but they see different parts of it.",
        },
      ],
      claimOptions: ["s3", "s8"],
      challenge: {
        type: "perspective",
        claim: "s3",
        valid: ["s4", "s5", "s6"],
        minValid: 2,
        weak: ["s1", "s2", "s7", "s9"],
        explainFrame: "This shows Mr. Park's point of view because ___.",
        explainTerms: ["because", "his", "customers", "shop", "feels"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "background",
              text: "At Maple School, the principal made a new rule for recess.",
            },
            { id: "t2", role: "detail", text: "Tomás loves soccer, and he plays every day." },
            {
              id: "t3",
              role: "claim",
              text: "Ms. Lee, the teacher on duty, thinks the new rule keeps students safe.",
            },
            {
              id: "t4",
              role: "evidence",
              supports: ["t3"],
              text: "Before the rule, three students bumped into each other near the swings.",
            },
            {
              id: "t5",
              role: "evidence",
              supports: ["t3"],
              text: "Now the soccer field has its own space, so the swings are quiet.",
            },
            {
              id: "t6",
              role: "evidence",
              supports: ["t3"],
              text: "She says, “I can finally watch every child at once.”",
            },
            {
              id: "t7",
              role: "detail",
              text: "The playground has a red slide and a tall climbing wall.",
            },
          ],
          claim: "t3",
          valid: ["t4", "t5", "t6"],
          minValid: 2,
          weak: ["t1", "t2", "t7"],
        },
      },
      refs: [
        { sentence: "s2", phrase: "he", means: "Leo" },
        { sentence: "s5", phrase: "his", means: "Mr. Park's" },
      ],
      layers: {
        meaning: [
          {
            s: "s3",
            phrase: "a problem for his bakery",
            label: "the point of view Mr. Park holds",
          },
          {
            s: "s6",
            phrase: "I miss seeing them at the door",
            label: "his feeling, in his own words",
          },
        ],
        discourse: [
          { s: "s5", phrase: "so", label: "links a cause to its result" },
          { s: "s9", phrase: "but", label: "shows that the two views are different" },
        ],
        sentence: [{ s: "s6", phrase: "He says,", label: "tells you whose words come next" }],
        word: [
          {
            s: "s3",
            phrase: "bakery",
            label: "community word",
            def: "a shop that makes and sells bread and cakes",
          },
          {
            s: "s4",
            phrase: "parking spots",
            label: "community word",
            def: "places where a car can stop and wait",
          },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "connector",
      title: "Show how two views fit together",
      gaps: [
        {
          before: "Nina loved the loud parade,",
          after: "Mrs. Ortiz wanted a quiet street.",
          relation: "contrast",
          options: ["but", "because", "so", "then"],
          ok: ["but"],
        },
        {
          before: "The street was closed,",
          after: "Mrs. Ortiz sold few flowers.",
          relation: "cause",
          options: ["so", "but", "or", "then"],
          ok: ["so"],
        },
        {
          before: "Nina smiled during the parade.",
          after: "Mrs. Ortiz frowned at her full buckets.",
          relation: "contrast",
          options: ["however", "because", "first", "so"],
          ok: ["however"],
        },
      ],
      notes: {
        but: "But shows a difference between two ideas.",
        so: "So shows a result.",
        however: "However starts a new sentence and shows a different idea.",
      },
      transfer: {
        gaps: [
          {
            before: "Leo likes the new bike path,",
            after: "Mr. Park does not.",
            relation: "contrast",
            options: ["but", "because", "so", "then"],
            ok: ["but"],
          },
          {
            before: "Mr. Park lost his parking spots,",
            after: "fewer customers came in.",
            relation: "cause",
            options: ["so", "but", "or", "then"],
            ok: ["so"],
          },
        ],
      },
    },
    {
      kind: "build",
      module: "combine",
      title: "Join two points of view",
      pair: ["Nina played in the parade.", "Mrs. Ortiz stayed at her stand."],
      relation: "contrast",
      keep: ["Nina", "parade", "Ortiz", "stand"],
      transfer: {
        pair: ["Leo rides on the new path.", "Mr. Park parks far from his shop."],
        relation: "contrast",
        keep: ["Leo", "path", "Park", "shop"],
      },
    },
  ],
  communicate: {
    kind: "converse",
    mode: "speak",
    prompt:
      "Tell Mr. Benitez the story of Saturday's parade from one person's point of view. Start with “I am ...” and tell it in order. Then say how the same day looked to someone else.",
    partner: {
      name: "Mr. Benitez",
      glyph: "👨🏽‍💼",
      role: ["Newsletter writer", "Escritor del boletín del barrio"],
      opening:
        "I am writing about Saturday's parade. Pick one neighbor and tell me the story as if you were that person. Start with “I.”",
    },
    topicTerms: ["parade", "drum", "flowers", "stand", "street", "Nina", "Mrs. Ortiz", "bus"],
    sourceTerms: ["Nina", "drum", "Mrs. Ortiz", "flower stand", "street closed", "Bus 12"],
    evidenceBank: [
      "Nina's snare drum was covered in confetti, and the crowd clapped for the band.",
      "Mrs. Ortiz's flower buckets were still full, and most people walked past her stand.",
      "Main Street was closed to cars from 9 to 1.",
      "Bus 12 used Oak Street, and riders had to walk two blocks to Main Street.",
    ],
    lines: [
      {
        id: "nina",
        terms: ["nina", "band", "drum", "drums", "music", "cheered", "marched", "parade"],
        evidenceTerms: ["confetti", "clapped", "crowd", "front"],
        ack: "So you are telling it as Nina.",
        probe: "What did Nina hear, see, and do, and how did she feel?",
        close: "What that person heard, saw, or felt",
      },
      {
        id: "ortiz",
        terms: ["ortiz", "flowers", "stand", "shop", "customers", "sold", "slow", "closed"],
        evidenceTerms: ["buckets", "full", "closed", "cars", "walked past"],
        ack: "So you are telling it as Mrs. Ortiz.",
        probe: "What did Mrs. Ortiz see from her stand, and what did she do?",
        close: "What that person saw, did, or felt",
      },
      {
        id: "rider",
        terms: ["bus", "rider", "detour", "walked", "oak", "blocks", "late"],
        evidenceTerms: ["bus 12", "oak street", "two blocks"],
        ack: "So you are telling it as a bus rider.",
        probe: "Where did the rider get off, and what did the rider do next?",
        close: "What the rider did, step by step",
      },
    ],
    followUps: {
      orient: "Who is telling the story, and where are they standing?",
      sequence: "What happened first from that point of view, and what happened next?",
      events: "What did that person do? Use action words about the past.",
      response: "How did that person feel at the end, and why?",
    },
    maxTurns: 3,
    minWords: 20,
  },
  improve: {
    models: {
      orient: "I am Nina, and on Saturday morning I stood at the front of the parade with my drum.",
      sequence:
        "First I heard the crowd cheer, then I started to march, and finally I waved to Mrs. Ortiz.",
      events: "I marched down Main Street, beat my drum, and tossed confetti into the air.",
      response: "In the end, I felt proud because the whole street clapped for our band.",
    },
    whys: [
      {
        id: "why-who",
        text: "It says who is speaking, so my listener knows whose point of view this is.",
        moves: ["orient"],
      },
      {
        id: "why-order",
        text: "It tells what happened first, next, and last, so my listener can follow that person's story.",
        moves: ["sequence", "events"],
      },
      {
        id: "why-feel",
        text: "It tells how that person felt, so my listener understands why two stories can be different.",
        moves: ["response"],
      },
    ],
  },
  show: {
    kind: "compose",
    mode: "write",
    prompt:
      "New situation: On Friday, the school had a fire drill. Luis was in the middle of a math test. Principal Ms. Grant was checking that every class got out safely. The bell rang very loudly. Luis left his test on his desk and walked outside with his class. Ms. Grant stood by the gate and counted every class. After the drill, everyone went back inside, and Luis finished his test. Write a short story about the fire drill. Tell it first as Luis, then as Ms. Grant. Start each part with “I.”",
    audience: ["Readers of the school newsletter", "Lectores del boletín escolar"],
    genre: "narrative",
    topicTerms: ["fire drill", "Luis", "Ms. Grant", "bell", "test", "gate", "class"],
    sourceTerms: ["bell", "test", "walked outside", "counted", "gate", "finished"],
    organizer: ["setting", "events", "ending"],
    readerQuestions: {
      orient: "Who is telling each part, and where are they?",
      sequence: "What happened first, next, and last for each person?",
      events: "What did Luis do? What did Ms. Grant do?",
      response: "How did each person feel at the end?",
    },
    minWords: 30,
  },
};

// ───────────────────────────── Grades 6-8 ─────────────────────────────
const g68 = {
  environment: "community",
  context: {
    title: ["The Night Market Move", "El traslado del mercado nocturno"],
    premise:
      "For one week, the city moved the Harbor Square night market into a parking garage because of construction. Vendors, residents and city officials all remember that week differently. The community newsletter wants to compare their accounts and publish one story told from a chosen point of view.",
    cast: [
      {
        id: "alves",
        name: "Ms. Alves",
        role: ["Newsletter editor", "Editora del boletín"],
        glyph: "👩🏻‍💼",
      },
      { id: "imani", name: "Imani", role: ["Jewelry vendor", "Vendedora de joyería"], glyph: "🧑🏾‍🎨" },
      {
        id: "okoye",
        name: "Mr. Okoye",
        role: ["City planner", "Urbanista municipal"],
        glyph: "👨🏿‍💼",
      },
      { id: "petrov", name: "Mrs. Petrov", role: ["Resident", "Vecina del barrio"], glyph: "👵🏼" },
    ],
  },
  vocab: [
    [
      "perspective",
      "the particular way a person sees an event, shaped by their role and experience",
      "perspectiva: la manera particular en que una persona ve un suceso, según su papel y su experiencia",
    ],
    [
      "account",
      "a spoken or written telling of what happened",
      "relato: una narración oral o escrita de lo que pasó",
    ],
    [
      "vendor",
      "a person who sells goods, often from a stall",
      "vendedor: una persona que vende productos, a menudo en un puesto",
    ],
    [
      "priority",
      "something you treat as more important than other things",
      "prioridad: algo que se considera más importante que otras cosas",
    ],
    [
      "compromise",
      "an agreement in which each side gives up something",
      "compromiso: un acuerdo en el que cada parte cede algo",
    ],
    [
      "bias",
      "a leaning toward one side that can shape how a story is told",
      "sesgo: una inclinación hacia un lado que puede influir en cómo se cuenta una historia",
    ],
    ["narrator", "the voice that tells a story", "narrador: la voz que cuenta una historia"],
    [
      "contrast",
      "to show how things are different",
      "contrastar: mostrar en qué se diferencian las cosas",
    ],
  ],
  frames: {
    A: [
      "From ___'s perspective, ___; however, ___ saw it differently because ___.",
      "While ___, ___ was thinking about ___.",
      "I remember ___. For me, the most important part was ___.",
      "Looking back, I understand why ___.",
    ],
    B: ["From ___'s perspective, ___.", "However, ___ saw it differently."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "Why do the vendor, the planner and the resident remember the week of the market move so differently? Examine what each of them left behind, then tell how the week looked from more than one point of view.",
    objects: [
      {
        id: "sales",
        label: "Vendor sales log",
        glyph: "📒",
        x: 14,
        y: 30,
        relevant: true,
        note: "Sales log: on Harbor Square nights, Imani's stall averaged 410 dollars. In the garage, it averaged 205 dollars.",
      },
      {
        id: "notice",
        label: "Construction notice",
        glyph: "🏗️",
        x: 44,
        y: 18,
        relevant: true,
        note: "Notice: crane work above Harbor Square runs for seven days. Barriers close three sides of the square. The notice was posted six days before the work began.",
      },
      {
        id: "plan",
        label: "Garage floor plan",
        glyph: "🅿️",
        x: 76,
        y: 28,
        relevant: true,
        note: "Garage floor plan: 40 stalls fit on the second floor. There are two entrances, and every walking path is six feet wide. The plan was approved to keep crowds away from the crane.",
      },
      {
        id: "petition",
        label: "Residents' petition",
        glyph: "✍️",
        x: 84,
        y: 62,
        relevant: true,
        note: "Petition: sixty-two neighbors on Fulton Street asked for quieter evenings. Before the move, music and crowds lasted until 11 p.m.",
      },
      {
        id: "counter",
        label: "Foot-traffic counter",
        glyph: "👣",
        x: 50,
        y: 76,
        relevant: true,
        note: "Foot-traffic counter: about 900 visitors an evening came to the square. In the garage, the counter recorded about 450.",
      },
      {
        id: "weather",
        label: "Weather report",
        glyph: "🌤️",
        x: 22,
        y: 82,
        relevant: false,
        note: "Weather report: sunny and mild all week, with a high of 72 degrees.",
      },
    ],
    controls: [
      {
        id: "place",
        label: "Market location",
        initial: "garage",
        options: [
          { id: "square", label: "Harbor Square" },
          { id: "garage", label: "Parking garage" },
        ],
      },
      {
        id: "notice",
        label: "Notice given before the move",
        initial: "days",
        options: [
          { id: "days", label: "Six days" },
          { id: "weeks", label: "Six weeks" },
        ],
      },
    ],
    outcomes: [
      {
        when: { place: "garage", notice: "weeks" },
        mood: "good",
        key: "prepared",
        state:
          "Vendors tell their regulars well ahead of time. Sales dip only a little, planners are satisfied, and neighbors enjoy the quieter evenings.",
      },
      {
        when: { place: "garage", notice: "days" },
        mood: "warn",
        key: "scramble",
        state:
          "Vendors scramble and many regulars never learn the new location. Sales drop by half, but visitors stay safe and the neighbors sleep well.",
      },
      {
        when: { place: "square", notice: "weeks" },
        mood: "bad",
        key: "refused",
        state:
          "Everyone knows the date, but crowds would still have to squeeze past the barriers beside the crane. Inspectors refuse the plan.",
      },
      {
        when: { place: "square", notice: "days" },
        mood: "bad",
        key: "closed",
        state:
          "Visitors squeeze through a narrow gap beside the crane zone. Inspectors close the market on the first night.",
      },
    ],
    collect: 4,
    variables: [
      {
        id: "vendor",
        label: "the vendor's view: lost customers",
        terms: [
          "vendor",
          "imani",
          "sales",
          "stall",
          "customers",
          "income",
          "money",
          "dropped",
          "lost",
          "regulars",
        ],
        evidenceTerms: ["410", "205", "sales log", "six days", "900", "450"],
        probe:
          "You are telling it as the vendor. Which numbers in her log or the counter show what changed for her?",
        good: "Two numbers that can be compared",
      },
      {
        id: "planner",
        label: "the planner's view: crowd safety",
        terms: [
          "planner",
          "safety",
          "safe",
          "crane",
          "construction",
          "barriers",
          "crowd",
          "city",
          "danger",
          "approved",
        ],
        evidenceTerms: ["crane", "three sides", "barriers", "six feet", "approved", "floor plan"],
        probe:
          "You are telling it as the planner. What do the notice and the floor plan show about what he had to protect?",
        good: "A fact from the notice and a fact from the plan",
      },
      {
        id: "resident",
        label: "the resident's view: quieter evenings",
        terms: [
          "resident",
          "neighbor",
          "neighbors",
          "noise",
          "quiet",
          "quieter",
          "petition",
          "evening",
          "music",
          "sleep",
        ],
        evidenceTerms: ["sixty-two", "62", "petition", "11 p.m.", "fulton"],
        probe:
          "You are telling it as a resident. What does the petition say, and how did the move answer it?",
        good: "What the petition asked for and what changed",
      },
    ],
    partner: {
      name: "Ms. Alves",
      glyph: "👩🏻‍💼",
      opening:
        "Welcome to the newsletter team. Three people told me about the week the market moved, and their stories hardly match. What do you think explains the differences?",
      noCause:
        "You have listed what you saw. Now explain why these accounts differ: what is each person looking at?",
      noEvidence: "Which record, notice or log supports the way you describe that person's view?",
      thanks: "Thank you. This helps me decide whose voice should tell the story.",
    },
    respond: {
      prompt:
        "Tell Ms. Alves how the week looked from at least two points of view, and why the accounts differ. Use evidence from what each person left behind.",
      minWords: 28,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "place",
      title: "Mrs. Petrov describes the square from her window",
      grid: { cols: 3, rows: 3 },
      script: [
        {
          id: "u1",
          text: "Come to my window, and I'll describe Harbor Square the way I see it every night.",
        },
        {
          id: "u2",
          text: "Directly across from me, in the center of the square, is the old stone fountain.",
          signal: "center",
        },
        {
          id: "u3",
          text: "The crane stands in the top right corner, behind the blue barriers.",
          signal: "top right",
        },
        {
          id: "u4",
          text: "Imani's jewelry stall used to be on the left side, in the middle, next to the bakery.",
          signal: "left side",
        },
        {
          id: "u5",
          text: "The temporary bus stop sits at the bottom, in the middle, right below my window.",
          signal: "bottom",
        },
        {
          id: "u6",
          text: "In the top left corner, the new garage entrance opens onto Dock Street.",
          signal: "top left",
        },
      ],
      items: [
        { id: "fountain", label: "Stone fountain", glyph: "⛲" },
        { id: "crane", label: "Construction crane", glyph: "🏗️" },
        { id: "stall", label: "Imani's old stall", glyph: "💍" },
        { id: "bus", label: "Temporary bus stop", glyph: "🚏" },
        { id: "garage", label: "Garage entrance", glyph: "🅿️" },
      ],
      targets: [
        { id: "tl", label: "Top left" },
        { id: "tm", label: "Top middle" },
        { id: "tr", label: "Top right" },
        { id: "ml", label: "Middle left" },
        { id: "c", label: "Center" },
        { id: "mr", label: "Middle right" },
        { id: "bl", label: "Bottom left" },
        { id: "bm", label: "Bottom middle" },
        { id: "br", label: "Bottom right" },
      ],
      expect: [
        { item: "fountain", target: "c", utterance: "u2" },
        { item: "crane", target: "tr", utterance: "u3" },
        { item: "stall", target: "ml", utterance: "u4" },
        { item: "bus", target: "bm", utterance: "u5" },
        { item: "garage", target: "tl", utterance: "u6" },
      ],
      visuals: {
        u2: "The center square of the map is highlighted",
        u3: "The top-right corner shows a crane behind blue barriers",
        u4: "The middle-left square sits beside a bakery icon",
        u5: "The bottom-middle square sits below a window icon",
        u6: "The top-left corner opens onto a street named Fulton",
      },
      xray: {
        keywords: ["center", "top right", "left side", "bottom", "top left"],
        sequence: [],
        cause: [],
        referents: [
          { phrase: "the new garage entrance", means: "the entrance to the temporary market" },
        ],
      },
      final: {
        mode: "sort",
        title: "Two voices at the community meeting",
        script: [
          {
            id: "f1",
            text: "At the meeting, two people described the same week in very different ways.",
          },
          {
            id: "f2",
            text: "I'm Imani, and I sell handmade jewelry. For me, the move cut my sales in half.",
            signal: "For me",
          },
          {
            id: "f3",
            text: "Most of my regular customers never found the garage, because the notice came too late.",
            signal: "because",
          },
          {
            id: "f4",
            text: "I'm Mr. Okoye, the city planner. For us, nothing mattered more than keeping crowds away from the crane.",
            signal: "nothing mattered more",
          },
          {
            id: "f5",
            text: "We chose the garage because it kept every visitor on a protected path, six feet wide.",
            signal: "protected",
          },
        ],
        items: [
          { id: "half", label: "Sales were cut in half", glyph: "📉" },
          { id: "lost", label: "Regular customers never found the garage", glyph: "🔍" },
          { id: "late", label: "The notice came too late", glyph: "📬" },
          { id: "away", label: "Crowds had to stay away from the crane", glyph: "🏗️" },
          { id: "safe", label: "Safety mattered most", glyph: "⚠️" },
          { id: "path", label: "Wide, protected paths for visitors", glyph: "🛤️" },
        ],
        targets: [
          { id: "imani", label: "Imani's view" },
          { id: "okoye", label: "Mr. Okoye's view" },
        ],
        expect: [
          { item: "half", target: "imani", utterance: "f2" },
          { item: "lost", target: "imani", utterance: "f3" },
          { item: "late", target: "imani", utterance: "f3" },
          { item: "away", target: "okoye", utterance: "f4" },
          { item: "safe", target: "okoye", utterance: "f4" },
          { item: "path", target: "okoye", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Same Week, Different Stories",
      passage: [
        {
          id: "s1",
          role: "background",
          text: "When crane work began above Harbor Square in September, the city moved the weekly night market into a parking garage for seven nights.",
        },
        {
          id: "s2",
          role: "claim",
          text: "Mr. Okoye, the city planner, believes that moving the market was the responsible choice.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s2"],
          text: "Barriers closed three sides of the square, so the only way in was a narrow gap beside the crane's swing zone.",
        },
        {
          id: "s4",
          role: "evidence",
          supports: ["s2"],
          text: "Because a falling load could injure hundreds of visitors, he argues that no crowd should stand beneath it.",
        },
        {
          id: "s5",
          role: "detail",
          text: "However, Imani, a jewelry vendor, watched her nightly sales fall from about 410 dollars to about 205 dollars.",
        },
        {
          id: "s6",
          role: "evidence",
          supports: ["s2"],
          text: "The garage plan, in contrast, gave every visitor a protected path six feet wide, which he says the square could not offer.",
        },
        {
          id: "s7",
          role: "detail",
          text: "Meanwhile, residents on Fulton Street, who had asked for quieter evenings, mostly welcomed the change.",
        },
        {
          id: "s8",
          role: "conclusion",
          text: "Each account is accurate, but each reflects what that person was responsible for protecting.",
        },
        { id: "s9", role: "claim", text: "Night markets are the most popular events in the city." },
      ],
      claimOptions: ["s2", "s9"],
      challenge: {
        type: "perspective",
        claim: "s2",
        valid: ["s3", "s4", "s6"],
        minValid: 2,
        weak: ["s1", "s5", "s7", "s8"],
        explainFrame:
          "This shows the planner's perspective because ___, which is what his job requires him to protect.",
        explainTerms: ["because", "perspective", "responsible", "job", "view"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "background",
              text: "Last spring, the city closed the Riverside skate park two hours earlier every evening.",
            },
            {
              id: "t2",
              role: "claim",
              text: "Ms. Torres, a nearby homeowner, believes the earlier closing time is fair.",
            },
            {
              id: "t3",
              role: "evidence",
              supports: ["t2"],
              text: "Because the floodlights shone into bedroom windows until ten o'clock, she says families on Willow Lane could not sleep.",
            },
            {
              id: "t4",
              role: "evidence",
              supports: ["t2"],
              text: "She points out that the city measured noise above the legal limit on three weekends.",
            },
            {
              id: "t5",
              role: "detail",
              text: "However, Dario, a high school skater, says he now has almost no time to practice after school.",
            },
            {
              id: "t6",
              role: "detail",
              text: "Meanwhile, the park manager reports that attendance fell by a third.",
            },
            {
              id: "t7",
              role: "conclusion",
              text: "Each person describes the same rule, but each describes what it means for their own evenings.",
            },
          ],
          claim: "t2",
          valid: ["t3", "t4"],
          minValid: 2,
          weak: ["t1", "t5", "t6", "t7"],
        },
      },
      refs: [
        { sentence: "s4", phrase: "he", means: "Mr. Okoye" },
        { sentence: "s5", phrase: "her", means: "Imani's" },
        { sentence: "s6", phrase: "which", means: "a protected path six feet wide" },
      ],
      layers: {
        meaning: [
          {
            s: "s2",
            phrase: "the responsible choice",
            label: "the planner's viewpoint, in his own terms",
          },
          {
            s: "s8",
            phrase: "what that person was responsible for protecting",
            label: "why the accounts differ",
          },
        ],
        discourse: [
          { s: "s5", phrase: "However", label: "turns to a different perspective" },
          { s: "s6", phrase: "in contrast", label: "sets the garage plan against the square" },
          { s: "s7", phrase: "Meanwhile", label: "adds a third view happening at the same time" },
        ],
        sentence: [
          {
            s: "s4",
            phrase: "Because a falling load could injure hundreds of visitors",
            label: "reason clause that opens the argument",
          },
        ],
        word: [
          {
            s: "s2",
            phrase: "responsible",
            label: "academic word",
            def: "the person who must make sure something is safe or done well",
          },
          {
            s: "s8",
            phrase: "accurate",
            label: "academic word",
            def: "correct and true in the details",
          },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "combine",
      title: "Join two perspectives in one sentence",
      pair: [
        "Imani's sales dropped by half in the garage.",
        "The city's priority was keeping crowds safe from the crane.",
      ],
      relation: "contrast",
      keep: ["sales", "dropped", "priority", "crane"],
      transfer: {
        pair: [
          "The neighbors welcomed the quieter evenings.",
          "The vendors lost most of their regular customers.",
        ],
        relation: "contrast",
        keep: ["neighbors", "quieter", "vendors", "customers"],
      },
    },
    {
      kind: "build",
      module: "morphology",
      title: "Look inside perspective words",
      words: [
        {
          word: "perspective",
          parts: [
            { t: "per", type: "prefix", meaning: "through" },
            { t: "spect", type: "root", meaning: "look" },
            { t: "ive", type: "suffix", meaning: "tending to (makes an adjective or noun)" },
          ],
          ask: "Which part carries the meaning of looking?",
        },
        {
          word: "spectator",
          parts: [
            { t: "spect", type: "root", meaning: "look" },
            { t: "ator", type: "suffix", meaning: "a person who does it" },
          ],
          ask: "What does the ending add about the person?",
        },
        {
          word: "disagreement",
          parts: [
            { t: "dis", type: "prefix", meaning: "not, apart" },
            { t: "agree", type: "root", meaning: "have the same view" },
            { t: "ment", type: "suffix", meaning: "the result of (makes a noun)" },
          ],
          ask: "How does dis- change the meaning of agree?",
        },
        {
          word: "responsible",
          parts: [
            { t: "respons", type: "root", meaning: "answer" },
            { t: "ible", type: "suffix", meaning: "able to be" },
          ],
          ask: "What does it mean to be able to answer for something?",
        },
      ],
      transfer: {
        words: [
          {
            word: "inspect",
            parts: [
              { t: "in", type: "prefix", meaning: "into" },
              { t: "spect", type: "root", meaning: "look" },
            ],
            ask: "What does in- add to the meaning of look?",
          },
          {
            word: "misunderstanding",
            parts: [
              { t: "mis", type: "prefix", meaning: "wrongly" },
              { t: "understand", type: "root", meaning: "get the meaning of" },
              { t: "ing", type: "suffix", meaning: "the act of (makes a noun)" },
            ],
            ask: "Which part tells you the meaning was taken the wrong way?",
          },
        ],
      },
    },
  ],
  communicate: {
    kind: "compose",
    mode: "write",
    prompt:
      "Choose Imani, Mr. Okoye or Mrs. Petrov. Narrate the week of the market move from that person's point of view for the Harbor Square newsletter. Write in the first person, include details that only that person would notice, use at least two transitions that show time or contrast, and make every pronoun clear.",
    audience: [
      "Readers of the Harbor Square community newsletter",
      "Lectores del boletín comunitario de Harbor Square",
    ],
    genre: "narrative",
    topicTerms: ["market", "garage", "square", "crane", "customers", "notice", "sales", "evenings"],
    sourceTerms: ["410", "205", "crane", "six feet", "sixty-two", "quieter evenings"],
    evidenceBank: [
      {
        id: "f1",
        text: "Imani's stall averaged 410 dollars a night in the square and 205 dollars in the garage.",
        kind: "number",
      },
      {
        id: "f2",
        text: "The notice was posted six days before the crane work began.",
        kind: "fact",
      },
      {
        id: "f3",
        text: "Barriers closed three sides of the square, and the garage plan gave every visitor a protected path six feet wide.",
        kind: "fact",
      },
      {
        id: "f4",
        text: "Sixty-two neighbors on Fulton Street had signed a petition for quieter evenings.",
        kind: "fact",
      },
      {
        id: "f5",
        text: "About 900 visitors came to the square each night; about 450 came to the garage.",
        kind: "number",
      },
    ],
    organizer: ["setting", "events", "ending"],
    readerQuestions: {
      orient: "Who is telling this story, and where are they when it begins?",
      sequence: "Which words show how the week moved from one moment to the next?",
      events: "What exactly did this narrator do, notice or say?",
      response: "How did the week end for this narrator, and what did they feel or understand?",
    },
    minWords: 65,
  },
  improve: {
    models: {
      orient:
        "I am Imani, and on the first night of the move, I carried my jewelry cases into a concrete garage that smelled like gasoline.",
      sequence:
        "At first I hoped my regulars would find me; meanwhile, the aisles stayed thin, and by closing time my cash box was half empty.",
      events:
        "I rearranged my display twice, handed a card to every passerby, and counted the night's sales again and again.",
      response:
        "Looking back, I understand why the planners worried about the crane, but I still wish someone had warned us sooner.",
    },
    whys: [
      {
        id: "why-voice",
        text: "A clear narrator and details only that person would notice make the point of view believable.",
        moves: ["orient", "events"],
      },
      {
        id: "why-links",
        text: "Time and contrast words show how the week changed and how the views differ.",
        moves: ["sequence"],
      },
      {
        id: "why-reflect",
        text: "A closing reflection shows what the experience meant to that person.",
        moves: ["response"],
      },
    ],
  },
  show: {
    kind: "converse",
    mode: "discuss",
    prompt:
      "New situation: A school moved its spring concert from the gym to the football field because the gym floor was being repaired. The repair crew needed the gym for three weeks. A parent, Mr. Reyes, worried about cold wind and a weak sound system. The band director, Ms. Lindqvist, was pleased that the field fit all two hundred families. The custodian, Mr. Boyd, had to carry sixty chairs across wet grass. The concert began at dusk and ended with applause under the lights. Pick one of these three people and tell a student reporter what the evening was like from that person's point of view.",
    partner: {
      name: "Elena",
      glyph: "👩🏽‍🎓",
      role: ["Student reporter", "Reportera estudiantil"],
      opening:
        "I am writing about the concert for the school paper, and everyone remembers it differently. Pick one person and tell me their evening, from the start.",
    },
    topicTerms: ["concert", "field", "gym", "parent", "director", "custodian", "chairs", "wind"],
    sourceTerms: [
      "Mr. Reyes",
      "Ms. Lindqvist",
      "Mr. Boyd",
      "sixty chairs",
      "two hundred families",
      "dusk",
    ],
    lines: [
      {
        id: "parent",
        terms: ["parent", "reyes", "cold", "wind", "sound", "system", "worried", "family"],
        evidenceTerms: ["cold wind", "sound system", "dusk", "applause"],
        ack: "So you are telling the evening as Mr. Reyes, the parent.",
        probe: "What did Mr. Reyes worry about, and what did he notice by the end?",
        close: "What the parent worried about, and what changed his mind or did not",
      },
      {
        id: "director",
        terms: ["director", "lindqvist", "band", "field", "pleased", "families", "music"],
        evidenceTerms: ["two hundred", "families", "fit", "applause", "lights"],
        ack: "So you are telling the evening as Ms. Lindqvist, the band director.",
        probe: "What was Ms. Lindqvist pleased about, and what did she see from the stage?",
        close: "What the director noticed and how she felt at the end",
      },
      {
        id: "custodian",
        terms: ["custodian", "boyd", "chairs", "carry", "carried", "grass", "wet", "rain"],
        evidenceTerms: ["sixty", "chairs", "wet grass", "dusk"],
        ack: "So you are telling the evening as Mr. Boyd, the custodian.",
        probe: "What did Mr. Boyd do before the concert, and how did it feel?",
        close: "The custodian's work, step by step, and his reaction",
      },
    ],
    followUps: {
      orient: "Who is telling the story, and where are they when it begins?",
      sequence: "Which words show how the evening moved from one moment to the next?",
      events: "What exactly did this person do, notice or say?",
      response: "How did the evening end for this person, and what did they feel or understand?",
    },
    maxTurns: 3,
    minWords: 40,
  },
};

export default {
  id: "m03",
  bands: { "3-5": g35, "6-8": g68 },
};
