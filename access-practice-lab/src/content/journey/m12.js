// Mission 12 — The Community Challenge (Unit 4, Argue). Community environment. Culminating four-domain project.
// One shared body of evidence runs through every domain in a band: the same facts appear in the community meeting the learner
// listens to, the report the learner reads, the notes in the discussion scene and the evidence bank for the recommendation.
// Title, goal, WIDA and spiral data live in MISSIONS (curriculum.js); family guidance lives in family.js.
// Task content is English (it is the language practiced); bilingual [en, es] pairs appear only in titles, roles and audiences.
// Hints ask or point; they never state an answer or quote a valid sentence.

const g35 = {
  environment: "community",
  context: {
    title: ["The Playground Clean-Up Challenge", "El reto de limpiar el patio"],
    premise:
      "The Green Team at Maple Street Elementary found litter all over the playground. Principal Lopez asks the team to listen, read, talk, and then write a recommendation.",
    cast: [
      {
        id: "zoe",
        name: "Zoe",
        role: ["Green Team captain", "Capitana del Equipo Verde"],
        glyph: "🧒🏼",
      },
      {
        id: "dean",
        name: "Mr. Dean",
        role: ["School helper", "Ayudante de la escuela"],
        glyph: "🧑🏽‍🔧",
      },
      {
        id: "lopez",
        name: "Principal Lopez",
        role: ["School principal", "Directora de la escuela"],
        glyph: "👩🏽‍💼",
      },
    ],
  },
  vocab: [
    [
      "recommend",
      "to say what you think should be done",
      "recomendar: decir lo que crees que se debe hacer",
    ],
    ["problem", "something that needs to be fixed", "problema: algo que hay que resolver"],
    ["solution", "a way to fix a problem", "solución: una manera de resolver un problema"],
    [
      "evidence",
      "facts that show an idea is true",
      "evidencia: datos que muestran que una idea es cierta",
    ],
    [
      "litter",
      "trash that is left on the ground",
      "basura tirada: desechos que se dejan en el suelo",
    ],
    [
      "survey",
      "a set of questions asked to many people",
      "encuesta: preguntas que se hacen a muchas personas",
    ],
    ["option", "one of the choices you can pick", "opción: una de las elecciones posibles"],
    ["cost", "how much money something needs", "costo: cuánto dinero se necesita"],
  ],
  frames: {
    A: [
      "I recommend ___.",
      "I think this will help because ___.",
      "One fact is ___.",
      "Some people may say ___, but ___.",
    ],
    B: ["I recommend ___ because ___.", "One fact is ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "The Green Team found litter on the playground. What should the school do about it, and what notes on the playground tell you so?",
    objects: [
      {
        id: "count",
        label: "Litter count",
        glyph: "🗑️",
        x: 20,
        y: 26,
        relevant: true,
        note: "On Monday, the Green Team picked up 46 pieces of litter on the playground. 31 of them were snack wrappers.",
      },
      {
        id: "cans",
        label: "Trash cans",
        glyph: "🚮",
        x: 12,
        y: 66,
        relevant: true,
        note: "There are two trash cans, and both are at the gate. Both were full by lunch recess.",
      },
      {
        id: "tables",
        label: "Picnic tables",
        glyph: "🪑",
        x: 78,
        y: 30,
        relevant: true,
        note: "The picnic tables are at the other end of the playground, far from the cans. Most of the litter was lying near the tables.",
      },
      {
        id: "survey",
        label: "Student survey",
        glyph: "📋",
        x: 50,
        y: 14,
        relevant: true,
        note: "Survey: 20 of 24 students said the trash cans are too far away.",
      },
      {
        id: "dean",
        label: "Mr. Dean's note",
        glyph: "📝",
        x: 56,
        y: 72,
        relevant: true,
        note: "Mr. Dean, the school helper, can empty new cans every afternoon. Each new trash can costs $30.",
      },
      {
        id: "paint",
        label: "Green paint",
        glyph: "🎨",
        x: 90,
        y: 86,
        relevant: false,
        note: "The picnic tables were painted green last spring.",
      },
    ],
    controls: [
      {
        id: "cans",
        label: "Cans near the tables",
        initial: "none",
        options: [
          { id: "none", label: "No new cans" },
          { id: "two", label: "Two new cans" },
        ],
      },
      {
        id: "crew",
        label: "Clean-up crew",
        initial: "none",
        options: [
          { id: "none", label: "No crew" },
          { id: "weekly", label: "A weekly crew" },
        ],
      },
    ],
    outcomes: [
      {
        when: { cans: "none", crew: "none" },
        mood: "bad",
        key: "same",
        state: "Next Monday the Green Team finds 46 pieces of litter again.",
      },
      {
        when: { cans: "two", crew: "none" },
        mood: "good",
        key: "cans",
        state:
          "Next Monday the Green Team finds 15 pieces of litter, mostly small bits blown by the wind.",
      },
      {
        when: { cans: "none", crew: "weekly" },
        mood: "warn",
        key: "crew",
        state:
          "A crew picks up litter every Friday, but by Wednesday the playground is messy again.",
      },
      {
        when: { cans: "two", crew: "weekly" },
        mood: "good",
        key: "both",
        state:
          "Next Monday the Green Team finds only 5 pieces of litter, and the playground stays neat all week.",
      },
    ],
    collect: 3,
    variables: [
      {
        id: "cans",
        label: "add cans near the tables",
        terms: ["can", "cans", "trash can", "bin", "bins", "garbage"],
        evidenceTerms: ["46", "31", "20 of 24", "tables", "far", "gate"],
        probe:
          "You think the school needs more cans. Which notes show where the litter is and where the cans are?",
        good: "Two notes that compare where the litter is with where the cans are",
      },
      {
        id: "crew",
        label: "start a clean-up crew",
        terms: ["crew", "clean up", "cleanup", "team", "pick up", "volunteers"],
        evidenceTerms: ["46", "Monday", "Mr. Dean", "Green Team"],
        probe:
          "You think a crew should help. What do the litter count and Mr. Dean's note say about who can do the work?",
        good: "A number and a note about who helps",
      },
      {
        id: "posters",
        label: "make reminder posters",
        terms: ["poster", "posters", "sign", "signs", "remind", "reminder", "tell kids"],
        evidenceTerms: ["31", "wrappers", "survey", "20 of 24"],
        probe:
          "You think reminders will help. What do the survey and the litter count say about why kids might drop litter?",
        good: "A note that explains why litter ends up on the ground",
      },
    ],
    partner: {
      name: "Zoe",
      glyph: "🧒🏼",
      opening:
        "I am the Green Team captain. We found so much litter! What should we ask the school to do?",
      noCause: "That is an idea. Tell me why you think it will help.",
      noEvidence: "What did you read or see on the playground that shows it?",
      thanks: "Thank you! We will use your idea at the meeting.",
    },
    respond: {
      prompt: "Tell Zoe what the school should do about the litter. Give a reason and one fact.",
      minWords: 12,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "place",
      title: "Zoe shows the playground map",
      grid: { cols: 3, rows: 2 },
      script: [
        {
          id: "u1",
          text: "Welcome to the Green Team meeting. I will show you where we found litter on the playground map.",
          signal: "where",
        },
        {
          id: "u2",
          text: "The two trash cans are at the gate, in the bottom left of the map.",
          signal: "bottom left",
        },
        {
          id: "u3",
          text: "The picnic tables are in the top right, at the other end of the playground.",
          signal: "top right",
        },
        {
          id: "u4",
          text: "We found most of the litter near the tables. On Monday, we picked up forty-six pieces.",
          signal: "forty-six",
        },
        {
          id: "u5",
          text: "The soccer field is in the top middle. We found almost no litter there.",
          signal: "top middle",
        },
        {
          id: "u6",
          text: "The tall slide is in the top left, and the swings are in the bottom right.",
          signal: "top left",
        },
      ],
      items: [
        { id: "cans", label: "Trash cans", glyph: "🚮" },
        { id: "tables", label: "Picnic tables", glyph: "🪑" },
        { id: "field", label: "Soccer field", glyph: "⚽" },
        { id: "slide", label: "Tall slide", glyph: "🛝" },
        { id: "swings", label: "Swings", glyph: "🎠" },
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
        { item: "cans", target: "bl", utterance: "u2" },
        { item: "tables", target: "tr", utterance: "u3" },
        { item: "field", target: "tm", utterance: "u5" },
        { item: "slide", target: "tl", utterance: "u6" },
        { item: "swings", target: "br", utterance: "u6" },
      ],
      visuals: {
        u2: "A gate with two bins beside it",
        u3: "Picnic tables with wrappers on the ground",
        u5: "A wide green field",
        u6: "A tall slide next to a swing set",
      },
      xray: {
        keywords: ["bottom left", "top right", "top middle", "top left", "bottom right"],
        sequence: [],
        cause: [],
        referents: [
          { phrase: "there", means: "the soccer field" },
          { phrase: "the tables", means: "the picnic tables" },
        ],
      },
      final: {
        mode: "follow",
        title: "How the weekly crew works",
        script: [
          { id: "f1", text: "Mr. Dean explains how the weekly clean-up crew works." },
          { id: "f2", text: "First, put on gloves and take a bag.", signal: "First" },
          { id: "f3", text: "Next, walk through your zone and pick up litter.", signal: "Next" },
          { id: "f4", text: "Then put the full bag in the big can.", signal: "Then" },
          { id: "f5", text: "Finally, wash your hands with soap.", signal: "Finally" },
        ],
        items: [
          { id: "gloves", label: "Put on gloves and take a bag", glyph: "🧤" },
          { id: "pickup", label: "Pick up litter in your zone", glyph: "🚶" },
          { id: "bag", label: "Put the full bag in the big can", glyph: "🛍️" },
          { id: "wash", label: "Wash your hands", glyph: "🧼" },
        ],
        targets: [
          { id: "p1", label: "Step 1" },
          { id: "p2", label: "Step 2" },
          { id: "p3", label: "Step 3" },
          { id: "p4", label: "Step 4" },
        ],
        expect: [
          { item: "gloves", target: "p1", utterance: "f2" },
          { item: "pickup", target: "p2", utterance: "f3" },
          { item: "bag", target: "p3", utterance: "f4" },
          { item: "wash", target: "p4", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Green Team Report: Trash Cans",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "The school should put two more trash cans near the picnic tables.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "On Monday, the Green Team picked up 46 pieces of litter, and 31 of them were snack wrappers.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "The two trash cans are at the gate, but most of the litter was near the picnic tables.",
        },
        {
          id: "s4",
          role: "evidence",
          supports: ["s1"],
          text: "In a survey, 20 of 24 students said the trash cans are too far away.",
        },
        {
          id: "s5",
          role: "reason",
          supports: ["s1"],
          text: "When a can is close, it is easy to throw trash away.",
        },
        {
          id: "s6",
          role: "detail",
          text: "The picnic tables were painted green last spring, and they look new.",
        },
        {
          id: "s7",
          role: "background",
          text: "The Green Team meets every Monday at lunch.",
        },
        {
          id: "s8",
          role: "claim",
          text: "Snack wrappers are the worst kind of litter.",
        },
      ],
      claimOptions: ["s1", "s8"],
      challenge: {
        type: "evidence",
        claim: "s1",
        valid: ["s2", "s3", "s4", "s5"],
        minValid: 3,
        weak: ["s6", "s7"],
        explainFrame: "This evidence shows the claim is true because ___.",
        explainTerms: ["because", "shows", "so"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "claim",
              text: "The school should add a bike rack near the front door.",
            },
            {
              id: "t2",
              role: "evidence",
              text: "Twelve students rode bikes on Friday, but the rack has only six spots.",
            },
            {
              id: "t3",
              role: "evidence",
              text: "Six bikes were locked to the fence, where they block the walkway.",
            },
            { id: "t4", role: "detail", text: "The fence is painted brown." },
            { id: "t5", role: "background", text: "The old bike rack was bought in 2015." },
            { id: "t6", role: "background", text: "The front door is blue." },
          ],
          claim: "t1",
          valid: ["t2", "t3"],
          minValid: 1,
          weak: ["t4", "t5", "t6"],
        },
      },
      refs: [
        { sentence: "s2", phrase: "them", means: "the pieces of litter" },
        { sentence: "s6", phrase: "they", means: "the picnic tables" },
      ],
      layers: {
        meaning: [
          {
            s: "s1",
            phrase: "put two more trash cans near the picnic tables",
            label: "the claim: what the writer wants",
          },
          { s: "s2", phrase: "46 pieces", label: "evidence: a count" },
        ],
        discourse: [
          { s: "s3", phrase: "but", label: "shows a difference between two places" },
          { s: "s5", phrase: "When", label: "links an action to its result" },
        ],
        sentence: [
          {
            s: "s2",
            phrase: "and 31 of them were snack wrappers",
            label: "a second fact joined with and",
          },
        ],
        word: [
          { s: "s2", phrase: "litter", label: "key word", def: "trash that is left on the ground" },
          {
            s: "s4",
            phrase: "survey",
            label: "academic word",
            def: "a set of questions asked to many people",
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
      pair: ["The trash cans are at the gate.", "Most of the litter is near the picnic tables."],
      relation: "contrast",
      keep: ["cans", "gate", "litter", "tables"],
      transfer: {
        pair: ["The line is long.", "Kids miss part of recess."],
        relation: "cause",
        keep: ["line", "recess"],
      },
    },
    {
      kind: "build",
      module: "discourse",
      title: "Order a recommendation",
      units: [
        {
          id: "u1",
          role: "claim",
          text: "I recommend two new trash cans near the picnic tables.",
        },
        {
          id: "u2",
          role: "reason",
          text: "Kids can throw trash away quickly when a can is close.",
        },
        {
          id: "u3",
          role: "evidence",
          text: "20 of 24 students said the cans are too far away.",
        },
        { id: "u4", role: "conclusion", text: "The school should add two cans." },
      ],
      order: ["u1", "u2", "u3", "u4"],
      alt: [],
      connectors: [
        { before: "u3", word: "For example" },
        { before: "u4", word: "That is why" },
      ],
      transfer: {
        units: [
          { id: "t1", role: "claim", text: "I recommend a weekly clean-up crew." },
          { id: "t2", role: "reason", text: "Many hands can pick up litter quickly." },
          {
            id: "t3",
            role: "evidence",
            text: "Five students picked up 20 pieces in ten minutes.",
          },
          { id: "t4", role: "conclusion", text: "The school should start a weekly crew." },
        ],
        order: ["t1", "t2", "t3", "t4"],
        alt: [],
        connectors: [
          { before: "t3", word: "For example" },
          { before: "t4", word: "That is why" },
        ],
      },
    },
  ],
  communicate: {
    kind: "compose",
    mode: "write",
    prompt:
      "The Green Team needs your help. Write a recommendation to Principal Lopez about the litter on the playground. Say what the school should do, give reasons, and use facts from the evidence bank that really help. Leave out facts that do not help.",
    audience: ["Principal Lopez", "La directora López"],
    genre: "argument",
    topicTerms: ["litter", "trash", "cans", "playground", "tables", "wrappers", "school", "clean"],
    sourceTerms: ["46 pieces", "31", "20 of 24", "gate", "tables"],
    evidenceBank: [
      {
        id: "e1",
        kind: "number",
        text: "On Monday, the Green Team picked up 46 pieces of litter. 31 of them were snack wrappers.",
      },
      {
        id: "e2",
        kind: "fact",
        text: "The two trash cans are at the gate. Both were full by lunch recess.",
      },
      {
        id: "e3",
        kind: "fact",
        text: "The picnic tables are at the other end of the playground, and most of the litter was near them.",
      },
      {
        id: "e4",
        kind: "number",
        text: "20 of 24 students said the trash cans are too far away.",
      },
      {
        id: "e5",
        kind: "quote",
        text: "“I can empty new cans every afternoon,” said Mr. Dean, the school helper.",
      },
      { id: "e6", kind: "number", text: "Each new trash can costs $30." },
      { id: "e7", kind: "fact", text: "The picnic tables were painted green last spring." },
      { id: "e8", kind: "fact", text: "The Green Team meets every Monday at lunch." },
    ],
    organizer: ["claim", "reasons", "evidence", "counter"],
    readerQuestions: {
      claim: "What do you recommend the school do?",
      reason: "Why do you think that will help?",
      evidence: "What fact from the Green Team's work shows it?",
      counter: "What would someone who disagrees say, and how would you answer?",
      restate: "How can you end by asking the principal to act?",
    },
    minWords: 40,
  },
  improve: {
    models: {
      claim: "I recommend that the school put two new trash cans near the picnic tables.",
      reason: "I think this will help because kids can throw trash away when a can is close.",
      evidence:
        "The Green Team found 46 pieces of litter, and 20 of 24 students said the cans are too far away.",
      counter:
        "Some people say new cans cost money, but two cans cost only $60 and Mr. Dean can empty them.",
      restate: "That is why I recommend two new trash cans near the picnic tables.",
    },
    whys: [
      {
        id: "why-claim",
        text: "It says exactly what the school should do, so the principal knows my idea.",
        moves: ["claim"],
      },
      {
        id: "why-reason",
        text: "It says why my idea will help, so the principal can follow my thinking.",
        moves: ["reason"],
      },
      {
        id: "why-fact",
        text: "It uses facts from the Green Team, so the principal can trust my idea.",
        moves: ["evidence"],
      },
      {
        id: "why-other",
        text: "It answers a worry, so the principal sees that I thought about both sides.",
        moves: ["counter"],
      },
      {
        id: "why-end",
        text: "It ends with my recommendation again, so the principal remembers it.",
        moves: ["restate"],
      },
    ],
  },
  show: {
    kind: "compose",
    mode: "write",
    prompt:
      "New problem: At Oak Park Elementary, kids wait a long time for water after recess. Facts: only 1 of the 3 water fountains works. After recess, 15 kids stood in line, and the line took 8 minutes. A new part for each broken fountain costs $40. A repair worker can come on Friday. Write a recommendation to the principal. Say what the school should do, give a reason, and use a fact from this prompt.",
    audience: ["The principal", "La directora o el director"],
    genre: "argument",
    topicTerms: ["fountain", "water", "line", "recess", "repair", "kids", "school", "wait"],
    sourceTerms: ["1 of the 3", "15 kids", "8 minutes", "$40"],
    organizer: ["claim", "reasons", "evidence", "counter"],
    readerQuestions: {
      claim: "What do you recommend the school do?",
      reason: "Why do you think that will help?",
      evidence: "What fact from the prompt shows it?",
      counter: "What would someone who disagrees say, and how would you answer?",
      restate: "How can you end by asking the principal to act?",
    },
    minWords: 35,
  },
};

const g68 = {
  environment: "community",
  context: {
    title: ["The Cafeteria Challenge", "El reto de la cafetería"],
    premise:
      "At Riverside Middle School, 420 students share two 30-minute lunch periods in a cafeteria that seats 160. The Student Voice committee must recommend a solution to the principal and the school board. The committee will listen to a meeting, read a report, discuss options, and write.",
    cast: [
      {
        id: "hart",
        name: "Ms. Hart",
        role: ["Cafeteria manager", "Gerente de la cafetería"],
        glyph: "👩🏻‍🍳",
      },
      {
        id: "ortiz",
        name: "Mr. Ortiz",
        role: ["Assistant principal", "Subdirector"],
        glyph: "🧑🏽‍💼",
      },
      {
        id: "nadia",
        name: "Nadia",
        role: ["Committee chair", "Presidenta del comité"],
        glyph: "🧑🏾‍🎓",
      },
    ],
  },
  vocab: [
    [
      "recommendation",
      "advice about what action should be taken",
      "recomendación: consejo sobre qué acción se debe tomar",
    ],
    ["option", "one of several possible choices", "opción: una de varias elecciones posibles"],
    ["feasible", "possible to do in practice", "factible: que se puede hacer en la práctica"],
    [
      "trade-off",
      "something you give up in order to gain something else",
      "contrapartida: algo a lo que renuncias para ganar otra cosa",
    ],
    ["impact", "the effect that something has", "impacto: el efecto que tiene algo"],
    ["implement", "to put a plan into practice", "implementar: poner un plan en práctica"],
    ["capacity", "the most that a place can hold", "capacidad: lo máximo que cabe en un lugar"],
    [
      "evidence",
      "information that supports a conclusion",
      "evidencia: información que apoya una conclusión",
    ],
  ],
  frames: {
    A: [
      "I recommend that ___ because ___.",
      "The data show ___, so ___.",
      "Although ___, ___.",
      "For these reasons, ___ should ___.",
    ],
    B: ["I recommend that ___.", "The evidence shows ___.", "Although ___, ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "The cafeteria is overcrowded at lunch. Which option do you think the school should choose, and what records from the cafeteria study support it?",
    objects: [
      {
        id: "seats",
        label: "Seat count",
        glyph: "🪑",
        x: 20,
        y: 28,
        relevant: true,
        note: "The cafeteria has 160 seats. About 210 students arrive in each of the two lunch periods, so about 50 students per period have no seat.",
      },
      {
        id: "timing",
        label: "Line timing log",
        glyph: "⏱️",
        x: 52,
        y: 14,
        relevant: true,
        note: "Staff timed the lines for a week. Students wait an average of 14 minutes of each 30-minute period, which leaves 16 minutes to eat.",
      },
      {
        id: "survey",
        label: "Student survey",
        glyph: "📊",
        x: 82,
        y: 28,
        relevant: true,
        note: "Survey of 120 students: 78 say they often do not finish their lunch, and 91 say the cafeteria is too crowded.",
      },
      {
        id: "line",
        label: "Serving line",
        glyph: "🍽️",
        x: 30,
        y: 68,
        relevant: true,
        note: "The cafeteria has one serving line. The manager estimates that a second line would cost about $4,500 and cut the average wait to about 8 minutes.",
      },
      {
        id: "bell",
        label: "Bell schedule",
        glyph: "🔔",
        x: 62,
        y: 72,
        relevant: true,
        note: "A third lunch period would leave about 140 students per period, which fits within the 160 seats, but it would end the school day 20 minutes later.",
      },
      {
        id: "yard",
        label: "Courtyard tables",
        glyph: "🌳",
        x: 86,
        y: 62,
        relevant: true,
        note: "Six picnic tables in the courtyard could seat 48 students, but only in good weather.",
      },
      {
        id: "walls",
        label: "Wall color",
        glyph: "🎨",
        x: 8,
        y: 88,
        relevant: false,
        note: "The cafeteria walls were painted blue in 2019.",
      },
    ],
    controls: [
      {
        id: "periods",
        label: "Lunch periods",
        initial: "two",
        options: [
          { id: "two", label: "Two periods" },
          { id: "three", label: "Three periods" },
        ],
      },
      {
        id: "serving",
        label: "Serving lines",
        initial: "one",
        options: [
          { id: "one", label: "One line" },
          { id: "two", label: "Two lines" },
        ],
      },
    ],
    outcomes: [
      {
        when: { periods: "two", serving: "one" },
        mood: "bad",
        key: "now",
        state:
          "Model result: about 50 students per period have no seat, and the line takes 14 of the 30 minutes.",
      },
      {
        when: { periods: "three", serving: "one" },
        mood: "warn",
        key: "three",
        state:
          "Model result: every student has a seat, but the line still takes 14 minutes and school ends 20 minutes later.",
      },
      {
        when: { periods: "two", serving: "two" },
        mood: "warn",
        key: "line",
        state:
          "Model result: the wait drops to about 8 minutes, but about 50 students per period still have no seat.",
      },
      {
        when: { periods: "three", serving: "two" },
        mood: "good",
        key: "both",
        state:
          "Model result: every student has a seat and the wait is about 8 minutes, but the plan costs about $4,500 and school ends 20 minutes later.",
      },
    ],
    collect: 4,
    variables: [
      {
        id: "period",
        label: "add a third lunch period",
        terms: ["third", "three periods", "lunch period", "schedule", "split", "periods"],
        evidenceTerms: ["160", "210", "50", "140", "20 minutes"],
        probe:
          "You are thinking about the lunch schedule. What do the seat count and the bell schedule say, and what would the change cost in time?",
        good: "A seat number compared with the number of students per period",
      },
      {
        id: "line",
        label: "add a second serving line",
        terms: ["line", "serving", "second line", "faster", "wait"],
        evidenceTerms: ["14 minutes", "16 minutes", "4,500", "8 minutes"],
        probe:
          "You are thinking about the serving line. What does the timing log record, and what does a second line cost?",
        good: "A wait time and a cost",
      },
      {
        id: "seating",
        label: "add outdoor seating",
        terms: ["outside", "courtyard", "tables", "picnic", "seating", "seats"],
        evidenceTerms: ["48", "160", "weather", "six"],
        probe:
          "You are thinking about more seating. How many seats would it add, and under what conditions?",
        good: "A seat number and a condition",
      },
    ],
    partner: {
      name: "Nadia",
      glyph: "🧑🏾‍🎓",
      opening:
        "I chair the Student Voice committee. The cafeteria is overcrowded and the board wants a recommendation. Which option do you favor, and why?",
      noCause:
        "You have named an option. The board will ask for your reasoning. Why do you favor it?",
      noEvidence: "Which record from the cafeteria study supports that?",
      thanks: "Thank you. We will bring your reasoning to the next committee meeting.",
    },
    respond: {
      prompt:
        "Tell Nadia which option you favor. Give a reason and cite one record from the study.",
      minWords: 18,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "place",
      title: "Ms. Hart walks the committee through the cafeteria map",
      grid: { cols: 3, rows: 3 },
      script: [
        {
          id: "u1",
          text: "Let me walk the committee through the cafeteria map and report what I measured.",
          signal: "report",
        },
        {
          id: "u2",
          text: "The serving line runs along the north wall, at the top of the map. Students wait there an average of fourteen minutes.",
          signal: "north wall",
        },
        {
          id: "u3",
          text: "The seating area is in the center. It holds one hundred sixty students, but about two hundred ten arrive in each lunch period.",
          signal: "center",
        },
        {
          id: "u4",
          text: "The courtyard door is on the east side, to the right. Six picnic tables outside could seat forty-eight students in good weather.",
          signal: "east side",
        },
        {
          id: "u5",
          text: "The tray return is in the southwest corner, and it backs up because students wait with full trays.",
          signal: "southwest corner",
        },
        {
          id: "u6",
          text: "The main entrance is in the south, at the bottom of the map.",
          signal: "south",
        },
      ],
      items: [
        { id: "line", label: "Serving line", glyph: "🍽️" },
        { id: "seating", label: "Seating area", glyph: "🪑" },
        { id: "door", label: "Courtyard door", glyph: "🚪" },
        { id: "trays", label: "Tray return", glyph: "🍱" },
        { id: "entrance", label: "Main entrance", glyph: "🏫" },
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
        { item: "line", target: "n", utterance: "u2" },
        { item: "seating", target: "c", utterance: "u3" },
        { item: "door", target: "e", utterance: "u4" },
        { item: "trays", target: "sw", utterance: "u5" },
        { item: "entrance", target: "s", utterance: "u6" },
      ],
      visuals: {
        u2: "A compass pointing up, with a long line of students along the top wall",
        u3: "The center square highlighted",
        u4: "The right-hand middle square highlighted",
        u5: "The bottom left corner highlighted",
        u6: "A compass pointing down with a door icon",
      },
      xray: {
        keywords: ["north wall", "center", "east side", "southwest corner", "south"],
        sequence: [],
        cause: ["because"],
        referents: [
          { phrase: "there", means: "along the serving line" },
          { phrase: "it", means: "the tray return" },
        ],
      },
      final: {
        mode: "follow",
        title: "How the committee will time the serving line",
        script: [
          {
            id: "f1",
            text: "Ms. Hart explains how the committee will measure the wait in the serving line next week.",
          },
          {
            id: "f2",
            text: "First, stand at the end of the line where you can see the wall clock.",
            signal: "First",
          },
          {
            id: "f3",
            text: "Next, write down the time when a student joins the line.",
            signal: "Next",
          },
          {
            id: "f4",
            text: "Then write down the time when that student receives a tray.",
            signal: "Then",
          },
          {
            id: "f5",
            text: "Finally, subtract the two times to find how many minutes the student waited.",
            signal: "Finally",
          },
        ],
        items: [
          { id: "stand", label: "Stand at the end of the line", glyph: "🧍" },
          { id: "join", label: "Write the time a student joins", glyph: "📝" },
          { id: "tray", label: "Write the time the student gets a tray", glyph: "🍱" },
          { id: "subtract", label: "Subtract to find the minutes waited", glyph: "➖" },
        ],
        targets: [
          { id: "p1", label: "Step 1" },
          { id: "p2", label: "Step 2" },
          { id: "p3", label: "Step 3" },
          { id: "p4", label: "Step 4" },
        ],
        expect: [
          { item: "stand", target: "p1", utterance: "f2" },
          { item: "join", target: "p2", utterance: "f3" },
          { item: "tray", target: "p3", utterance: "f4" },
          { item: "subtract", target: "p4", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Cafeteria Study Summary",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "Riverside should add a third lunch period to relieve crowding in the cafeteria.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "The cafeteria has 160 seats, but about 210 students arrive in each of the two lunch periods.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "A third period would reduce each group to about 140 students, which fits within the 160 seats.",
        },
        {
          id: "s4",
          role: "evidence",
          supports: ["s1"],
          text: "In a survey of 120 students, 91 said the cafeteria is too crowded.",
        },
        {
          id: "s5",
          role: "reason",
          supports: ["s1"],
          text: "When every student has a seat, students can eat without rushing, so they are more likely to finish their meal.",
        },
        {
          id: "s6",
          role: "detail",
          text: "A second serving line would cut the average wait to about 8 minutes.",
        },
        {
          id: "s7",
          role: "background",
          text: "The cafeteria walls were painted blue in 2019.",
        },
        {
          id: "s8",
          role: "claim",
          text: "Lunch is the most important part of the school day.",
        },
        {
          id: "s9",
          role: "detail",
          text: "Some teachers worry that a third period would end the school day 20 minutes later.",
        },
      ],
      claimOptions: ["s1", "s8"],
      challenge: {
        type: "evidence",
        claim: "s1",
        valid: ["s2", "s3", "s4", "s5"],
        minValid: 3,
        weak: ["s6", "s7", "s9"],
        explainFrame: "This evidence supports the recommendation because ___, which shows ___.",
        explainTerms: ["because", "shows", "so", "which"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "claim",
              text: "The school should add a recycling station in the gym.",
            },
            {
              id: "t2",
              role: "evidence",
              text: "After games, volunteers collected 120 plastic bottles from the gym trash cans.",
            },
            {
              id: "t3",
              role: "reason",
              text: "Bottles in the trash cannot be recycled, so a station would keep them out of the landfill.",
            },
            {
              id: "t4",
              role: "evidence",
              text: "The gym has no recycling bin, and the nearest one is in the cafeteria, 200 feet away.",
            },
            {
              id: "t5",
              role: "detail",
              text: "The gym floor was refinished last summer.",
            },
            {
              id: "t6",
              role: "background",
              text: "The basketball team has twelve players.",
            },
          ],
          claim: "t1",
          valid: ["t2", "t3", "t4"],
          minValid: 2,
          weak: ["t5", "t6"],
        },
      },
      refs: [
        { sentence: "s3", phrase: "which", means: "the smaller group of 140 students" },
        { sentence: "s5", phrase: "they", means: "the students" },
      ],
      layers: {
        meaning: [
          {
            s: "s1",
            phrase: "add a third lunch period",
            label: "the recommendation (the claim)",
          },
          {
            s: "s2",
            phrase: "about 210 students",
            label: "evidence: a count to compare with the seats",
          },
        ],
        discourse: [
          { s: "s2", phrase: "but", label: "contrasts the seats with the number of students" },
          { s: "s5", phrase: "so", label: "links a condition to its result" },
        ],
        sentence: [
          {
            s: "s3",
            phrase: "which fits within the 160 seats",
            label: "a clause that comments on the whole idea",
          },
        ],
        word: [
          {
            s: "s1",
            phrase: "relieve",
            label: "academic word",
            def: "make a problem smaller or easier to bear",
          },
          {
            s: "s3",
            phrase: "reduce",
            label: "academic word",
            def: "make smaller in size or amount",
          },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "connector",
      title: "Recommendation connectors",
      gaps: [
        {
          before: "I recommend a third lunch period",
          after: "it gives every student a seat.",
          relation: "cause",
          options: ["because", "although", "unless", "after"],
          ok: ["because"],
        },
        {
          before: "A second serving line would cut the wait;",
          after: "it would not solve the shortage of seats.",
          relation: "contrast",
          options: ["however,", "because", "for example,", "therefore,"],
          ok: ["however,"],
        },
        {
          before: "About 50 students in each period have no seat.",
          after: "the line takes 14 of the 30 minutes.",
          relation: "addition",
          options: ["In addition,", "However,", "Therefore,", "Instead,"],
          ok: ["In addition,"],
        },
        {
          before: "The survey shows that many students rush through lunch.",
          after: "the board should act now.",
          relation: "cause",
          options: ["Therefore,", "However,", "For example,", "Meanwhile,"],
          ok: ["Therefore,"],
        },
      ],
      notes: {
        because: "Because introduces the reason for a recommendation.",
        "however,": "However turns to a limit or a different side of the issue.",
        "In addition,": "In addition adds another fact to the same side.",
        "Therefore,": "Therefore introduces what follows from the evidence.",
      },
      transfer: {
        gaps: [
          {
            before: "The library should add more computers",
            after: "students wait too long for one.",
            relation: "cause",
            options: ["because", "although", "unless", "after"],
            ok: ["because"],
          },
          {
            before: "Extra staff would help;",
            after: "the budget has no room for new hires.",
            relation: "contrast",
            options: ["however,", "because", "for example,", "therefore,"],
            ok: ["however,"],
          },
          {
            before: "Forty students waited for nine computers.",
            after: "the library should add more.",
            relation: "cause",
            options: ["Therefore,", "However,", "For example,", "Meanwhile,"],
            ok: ["Therefore,"],
          },
        ],
      },
    },
    {
      kind: "build",
      module: "combine",
      title: "Sentence combining",
      pair: [
        "A third lunch period would end the school day later.",
        "A third lunch period would give every student a seat.",
      ],
      relation: "contrast",
      keep: ["third", "period", "later", "seat"],
      transfer: {
        pair: [
          "A second serving line costs $4,500.",
          "A second serving line would shorten the wait.",
        ],
        relation: "contrast",
        keep: ["line", "cost", "wait"],
      },
    },
  ],
  communicate: {
    kind: "compose",
    mode: "write",
    prompt:
      "Write a recommendation about the crowded cafeteria. Choose one option (a third lunch period, a second serving line, outdoor seating, or a combination) and state it clearly. Support it with relevant evidence from the evidence bank (some items do not help), and respond to one concern about your choice. Write two short paragraphs.",
    audience: ["The principal and the school board", "El director y la junta escolar"],
    genre: "argument",
    topicTerms: [
      "cafeteria",
      "lunch",
      "crowded",
      "seats",
      "line",
      "period",
      "students",
      "recommend",
    ],
    sourceTerms: ["160 seats", "210", "14 minutes", "78", "$4,500", "20 minutes"],
    evidenceBank: [
      {
        id: "e1",
        kind: "number",
        text: "The cafeteria has 160 seats, but about 210 students arrive in each of the two 30-minute lunch periods.",
      },
      {
        id: "e2",
        kind: "number",
        text: "Staff timed the lines for a week: students wait an average of 14 minutes, which leaves 16 minutes to eat.",
      },
      {
        id: "e3",
        kind: "number",
        text: "In a survey of 120 students, 78 said they often do not finish their lunch, and 91 said the cafeteria is too crowded.",
      },
      {
        id: "e4",
        kind: "number",
        text: "A third lunch period would leave about 140 students per period, which fits in the seats, but it would end the school day 20 minutes later.",
      },
      {
        id: "e5",
        kind: "number",
        text: "A second serving line would cost about $4,500 and cut the average wait to about 8 minutes, according to the cafeteria manager's estimate.",
      },
      {
        id: "e6",
        kind: "fact",
        text: "Six picnic tables in the courtyard could seat 48 students, but only in good weather.",
      },
      {
        id: "e7",
        kind: "quote",
        text: "“Students who rush through lunch have trouble focusing in fourth period,” said Ms. Hart, the cafeteria manager.",
      },
      { id: "e8", kind: "fact", text: "The cafeteria walls were painted blue in 2019." },
      { id: "e9", kind: "fact", text: "The school mascot is an otter named Rio." },
    ],
    organizer: ["claim", "reasons", "evidence", "counter"],
    readerQuestions: {
      claim: "Which option exactly do you recommend, and what should the board do?",
      reason: "Why is that the best option?",
      evidence: "Which specific record or measurement supports that reason?",
      counter: "What concern might someone raise about your choice, and how would you respond?",
      restate: "How can your last sentence return to your recommendation?",
    },
    minWords: 85,
  },
  improve: {
    models: {
      claim:
        "I recommend that Riverside add a third lunch period so that every student has a seat.",
      reason:
        "This is the best option because it solves the crowding directly instead of only speeding up the line.",
      evidence:
        "The cafeteria has 160 seats, but about 210 students arrive in each period, and a third period would reduce each group to about 140.",
      counter:
        "Although a third period would end school 20 minutes later, students who finish their meals are better prepared to focus in class.",
      restate: "For these reasons, the board should approve a third lunch period.",
    },
    whys: [
      {
        id: "why-claim",
        text: "It names one option and the action the board should take, so the recommendation is clear.",
        moves: ["claim"],
      },
      {
        id: "why-reason",
        text: "It explains why the option is best, so the recommendation is more than a preference.",
        moves: ["reason"],
      },
      {
        id: "why-evidence",
        text: "It cites records from the study, so the board can check the facts behind my choice.",
        moves: ["evidence"],
      },
      {
        id: "why-counter",
        text: "It responds to a likely concern, so the audience sees that the trade-off was weighed.",
        moves: ["counter"],
      },
      {
        id: "why-restate",
        text: "It returns to the recommendation, so the audience remembers what I want them to do.",
        moves: ["restate"],
      },
    ],
  },
  show: {
    kind: "compose",
    mode: "write",
    prompt:
      "New problem: At Riverside, about 60 students want to use the library computers at lunch, but only 9 work. Facts: last week, 34 students waited at least ten minutes for a computer. Adding four computers would cost about $2,800. A ten-minute limit for each student would cost nothing and would let about 27 students use the computers during one lunch period. Some students say ten minutes is too short for a long assignment. Write two short paragraphs to the principal. Recommend one option (more computers or a time limit), support it with relevant facts from this prompt, and respond to one concern.",
    audience: ["The principal", "La directora o el director"],
    genre: "argument",
    topicTerms: ["library", "computers", "lunch", "limit", "wait", "students", "cost", "recommend"],
    sourceTerms: ["9", "34 students", "$2,800", "ten-minute limit", "27 students"],
    organizer: ["claim", "reasons", "evidence", "counter"],
    readerQuestions: {
      claim: "Which option exactly do you recommend?",
      reason: "Why is that the best option?",
      evidence: "Which specific fact from the prompt supports that reason?",
      counter: "What concern might someone raise about your choice, and how would you respond?",
      restate: "How can your last sentence return to your recommendation?",
    },
    minWords: 65,
  },
};

export default {
  id: "m12",
  bands: { "3-5": g35, "6-8": g68 },
};
