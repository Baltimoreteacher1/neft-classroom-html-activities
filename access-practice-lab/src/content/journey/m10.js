// Mission 10 — Make a Claim (Unit 4, Argue). Community environment. Flagship writing task: "Our school needs more trees."
// Title, goal, WIDA and spiral data live in MISSIONS (curriculum.js); family guidance lives in family.js.
// Task content is English (it is the language practiced); bilingual [en, es] pairs appear only in titles, roles and audiences.
// Hints ask questions or point at a source; they never state an answer or quote a valid sentence.

const g35 = {
  environment: "community",
  context: {
    title: ["A Claim for Our School", "Una afirmación para nuestra escuela"],
    premise:
      "Lakeview Elementary has a sunny, hot playground. The Student Council wants kids to share ideas and give good reasons. Principal Lopez will listen.",
    cast: [
      {
        id: "lopez",
        name: "Principal Lopez",
        role: ["School principal", "Directora de la escuela"],
        glyph: "👩🏽‍💼",
      },
      {
        id: "maya",
        name: "Maya",
        role: ["Student Council member", "Miembro del consejo estudiantil"],
        glyph: "🧒🏽",
      },
    ],
  },
  vocab: [
    [
      "claim",
      "an idea you want other people to believe",
      "afirmación: una idea que quieres que otros crean",
    ],
    ["reason", "why you think something", "razón: por qué piensas algo"],
    [
      "evidence",
      "facts that show an idea is true",
      "evidencia: datos que muestran que una idea es cierta",
    ],
    ["fact", "something that can be checked", "dato: algo que se puede comprobar"],
    ["opinion", "what a person thinks or feels", "opinión: lo que una persona piensa o siente"],
    [
      "convince",
      "to help someone agree with you",
      "convencer: lograr que alguien esté de acuerdo contigo",
    ],
    ["shade", "a place where the sun is blocked", "sombra: lugar donde se bloquea el sol"],
    [
      "survey",
      "a set of questions asked to many people",
      "encuesta: preguntas que se hacen a muchas personas",
    ],
  ],
  frames: {
    A: [
      "I think ___ because ___.",
      "One reason is ___. For example, ___.",
      "Some people say ___, but I think ___.",
    ],
    B: ["I think ___ because ___.", "A fact that shows this is ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "The playground gets very hot at recess. What should Lakeview Elementary do about it, and what on the playground tells you so?",
    objects: [
      {
        id: "thermo",
        label: "Thermometer log",
        glyph: "🌡️",
        x: 22,
        y: 28,
        relevant: true,
        note: "Thermometer log, 1:00 on a sunny day: the blacktop is 104 degrees. The grass under the old oak tree is 86 degrees.",
      },
      {
        id: "oak",
        label: "Old oak tree",
        glyph: "🌳",
        x: 78,
        y: 30,
        relevant: true,
        note: "The playground has just one tree. Kids sit in its shade, and two birds have a nest in it.",
      },
      {
        id: "bench",
        label: "Benches",
        glyph: "🪑",
        x: 62,
        y: 60,
        relevant: true,
        note: "There are three benches. Two are in the sun and are too hot to sit on. The shady bench is always full.",
      },
      {
        id: "survey",
        label: "Class survey",
        glyph: "📋",
        x: 30,
        y: 62,
        relevant: true,
        note: "Room 12 survey: 18 of 24 students say the playground is too hot at recess.",
      },
      {
        id: "clock",
        label: "Recess schedule",
        glyph: "🕐",
        x: 46,
        y: 14,
        relevant: true,
        note: "Recess is at 12:30, right after lunch, when the sun is high in the sky.",
      },
      {
        id: "ball",
        label: "Red kickball",
        glyph: "⚽",
        x: 90,
        y: 84,
        relevant: false,
        note: "A red kickball sits by the fence. It needs more air.",
      },
    ],
    controls: [
      {
        id: "trees",
        label: "Trees",
        initial: "none",
        options: [
          { id: "none", label: "No new trees" },
          { id: "six", label: "Six new trees" },
        ],
      },
      {
        id: "recess",
        label: "Recess time",
        initial: "noon",
        options: [
          { id: "noon", label: "12:30, after lunch" },
          { id: "morning", label: "9:30, in the morning" },
        ],
      },
    ],
    outcomes: [
      {
        when: { trees: "six", recess: "morning" },
        mood: "good",
        key: "both",
        state:
          "When the trees are big, the blacktop reads about 80 degrees at 9:30, and there is shade for everyone.",
      },
      {
        when: { trees: "six", recess: "noon" },
        mood: "good",
        key: "trees",
        state:
          "When the trees are big, the playground has much more shade. At 12:30 the blacktop reads about 95 degrees.",
      },
      {
        when: { trees: "none", recess: "morning" },
        mood: "warn",
        key: "morning",
        state:
          "At 9:30 the blacktop reads about 82 degrees. It is cooler, but many kids still crowd onto the one shady bench.",
      },
      {
        when: { trees: "none", recess: "noon" },
        mood: "bad",
        key: "hot",
        state:
          "At 12:30 the blacktop reads 104 degrees. Kids crowd onto the one shady bench, and many go inside.",
      },
    ],
    collect: 3,
    variables: [
      {
        id: "trees",
        label: "plant trees",
        terms: ["tree", "trees", "shade", "shady", "oak", "plant"],
        evidenceTerms: ["104", "86", "degrees", "thermometer", "one tree", "bench"],
        probe:
          "You have an idea about trees. What did the thermometer log or the benches show that connects to your idea?",
        good: "Numbers or notes from two places on the playground",
      },
      {
        id: "recess",
        label: "change the recess time",
        terms: ["recess", "morning", "earlier", "schedule", "time"],
        evidenceTerms: ["12:30", "noon", "9:30", "sun is high", "schedule"],
        probe:
          "You are thinking about the time of recess. What does the schedule say, and what does the thermometer log add?",
        good: "A time from the schedule and a temperature to compare",
      },
      {
        id: "cover",
        label: "build a shade cover",
        terms: ["cover", "umbrella", "tent", "roof", "awning", "sail"],
        evidenceTerms: ["bench", "benches", "survey", "18 of 24", "sun"],
        probe:
          "You think kids need a cover. Which notes show where kids need shade and how many students feel too hot?",
        good: "A note about the benches or the survey",
      },
    ],
    partner: {
      name: "Principal Lopez",
      glyph: "👩🏽‍💼",
      opening:
        "Hello! Many students tell me the playground is too hot. I am listening for good ideas. What do you think the school should do?",
      noCause: "I hear your idea, but I need a reason. Why do you think the school should do that?",
      noEvidence: "What did you see or read on the playground that shows it?",
      thanks: "Thank you. A clear idea with a reason helps me decide.",
    },
    respond: {
      prompt:
        "Tell Principal Lopez what the school should do. Give a reason and one fact you found.",
      minWords: 12,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "sort",
      title: "The Student Council talks about Walking Day",
      script: [
        {
          id: "u1",
          text: "The Student Council is thinking about a Walking Day, when everyone walks to school.",
          signal: "thinking about",
        },
        {
          id: "u2",
          text: "One good thing is that walking gives children exercise, and it helps them wake up.",
          signal: "One good thing",
        },
        {
          id: "u3",
          text: "Another good thing is that fewer cars come to school, so the street is quiet.",
          signal: "Another good thing",
        },
        {
          id: "u4",
          text: "But some families live very far away, and that is hard.",
          signal: "But",
        },
        {
          id: "u5",
          text: "A second hard part is rain, because the walk would be wet and cold.",
          signal: "hard part",
        },
        {
          id: "u6",
          text: "Heavy backpacks are also hard to carry on a long walk.",
          signal: "hard",
        },
      ],
      items: [
        { id: "exercise", label: "Exercise before class", glyph: "🏃" },
        { id: "wake", label: "Helps kids wake up", glyph: "🌞" },
        { id: "quiet", label: "A quiet street", glyph: "🚸" },
        { id: "far", label: "Families who live far away", glyph: "🏠" },
        { id: "rain", label: "A wet, cold walk", glyph: "🌧️" },
        { id: "packs", label: "Heavy backpacks", glyph: "🎒" },
      ],
      targets: [
        { id: "good", label: "Good things about Walking Day" },
        { id: "hard", label: "Hard things about Walking Day" },
      ],
      expect: [
        { item: "exercise", target: "good", utterance: "u2" },
        { item: "wake", target: "good", utterance: "u2" },
        { item: "quiet", target: "good", utterance: "u3" },
        { item: "far", target: "hard", utterance: "u4" },
        { item: "rain", target: "hard", utterance: "u5" },
        { item: "packs", target: "hard", utterance: "u6" },
      ],
      visuals: {
        u2: "A child stretching in the morning sun",
        u3: "A street with only a few cars",
        u4: "A long road with a small house far away on a hill",
        u5: "A child under a rain cloud",
        u6: "A child bending under a big backpack",
      },
      xray: {
        keywords: ["good thing", "But", "hard part", "hard"],
        sequence: [],
        cause: ["because", "so"],
        referents: [{ phrase: "that", means: "living far away from school" }],
      },
      final: {
        mode: "arrange",
        title: "Ben builds his speech",
        script: [
          {
            id: "f1",
            text: "Ben wants the school library to stay open at lunch. Listen to how he builds his speech.",
          },
          {
            id: "f2",
            text: "First, Ben says his claim: the library should be open at lunch.",
            signal: "First",
          },
          {
            id: "f3",
            text: "Next, he gives a reason: students need a quiet place to read.",
            signal: "Next",
          },
          {
            id: "f4",
            text: "Then he adds proof: last week, fifteen students asked to read at lunch.",
            signal: "Then",
          },
          {
            id: "f5",
            text: "Finally, he asks the council to say yes.",
            signal: "Finally",
          },
        ],
        items: [
          { id: "claim", label: "Ben's idea (his claim)", glyph: "💬" },
          { id: "reason", label: "Ben's reason", glyph: "🤔" },
          { id: "proof", label: "Ben's proof (a fact)", glyph: "🔢" },
          { id: "ask", label: "Ben's request", glyph: "🙋" },
        ],
        targets: [
          { id: "p1", label: "Step 1" },
          { id: "p2", label: "Step 2" },
          { id: "p3", label: "Step 3" },
          { id: "p4", label: "Step 4" },
        ],
        expect: [
          { item: "claim", target: "p1", utterance: "f2" },
          { item: "reason", target: "p2", utterance: "f3" },
          { item: "proof", target: "p3", utterance: "f4" },
          { item: "ask", target: "p4", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Should Our Library Stay Open After School?",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "Our school library should stay open for one hour after school.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "Last month, 27 students waited outside the library door at 3:00, but it was closed.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "Ms. Cruz, the librarian, counted 12 students who asked her for homework help after the bell last week.",
        },
        {
          id: "s4",
          role: "reason",
          supports: ["s1"],
          text: "More time in the library means more time to read, and reading helps students learn.",
        },
        {
          id: "s5",
          role: "detail",
          text: "The library has a green rug and ten round tables.",
        },
        { id: "s6", role: "background", text: "The library was painted last summer." },
        { id: "s7", role: "claim", text: "The library is the best room in the whole school." },
        { id: "s8", role: "detail", text: "Ms. Cruz also keeps a jar of pencils on her desk." },
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
              text: "Our class should plant a bean garden by the window.",
            },
            {
              id: "t2",
              role: "evidence",
              text: "Bean seeds grow fast. Last year, a class saw sprouts in only five days.",
            },
            {
              id: "t3",
              role: "evidence",
              text: "The window gets sun all morning, and plants need sun to grow.",
            },
            { id: "t4", role: "detail", text: "The window curtains are blue." },
            { id: "t5", role: "background", text: "Room 9 has twenty-two desks." },
            { id: "t6", role: "background", text: "The school bell rings at 8:15." },
          ],
          claim: "t1",
          valid: ["t2", "t3"],
          minValid: 1,
          weak: ["t4", "t5", "t6"],
        },
      },
      refs: [
        { sentence: "s2", phrase: "it", means: "the library" },
        { sentence: "s3", phrase: "her", means: "Ms. Cruz, the librarian" },
      ],
      layers: {
        meaning: [
          { s: "s1", phrase: "should stay open", label: "the claim: what the writer wants" },
          { s: "s2", phrase: "27 students", label: "evidence: a number" },
        ],
        discourse: [
          { s: "s2", phrase: "but", label: "shows a problem or a surprise" },
          { s: "s4", phrase: "means", label: "links an action to its result" },
        ],
        sentence: [
          {
            s: "s4",
            phrase: "and reading helps students learn",
            label: "a second idea joined with and",
          },
        ],
        word: [
          {
            s: "s3",
            phrase: "counted",
            label: "precise verb",
            def: "found out how many by saying the numbers",
          },
          {
            s: "s3",
            phrase: "librarian",
            label: "job word",
            def: "the person who takes care of a library",
          },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "connector",
      title: "Reason and example connectors",
      gaps: [
        {
          before: "I think we need more shade",
          after: "the blacktop is too hot.",
          relation: "cause",
          options: ["because", "but", "then", "after"],
          ok: ["because"],
        },
        {
          before: "Our playground has many fun things,",
          after: "the only shady bench is always full.",
          relation: "contrast",
          options: ["but", "because", "so", "for example"],
          ok: ["but"],
        },
        {
          before: "Trees help in many ways.",
          after: "they give shade and a home for birds.",
          relation: "example",
          options: ["For example,", "Because", "But", "Then,"],
          ok: ["For example,"],
        },
        {
          before: "Two of the benches are in the sun,",
          after: "kids cannot sit on them.",
          relation: "cause",
          options: ["so", "because", "but", "for example"],
          ok: ["so"],
        },
      ],
      notes: {
        because: "Because gives the reason.",
        so: "So gives the result.",
        but: "But shows a difference.",
        "For example,": "For example introduces a case that proves your point.",
      },
      transfer: {
        gaps: [
          {
            before: "We should have a Walking Day",
            after: "it is good exercise.",
            relation: "cause",
            options: ["because", "but", "then", "after"],
            ok: ["because"],
          },
          {
            before: "Some families live very far away,",
            after: "they might need a ride.",
            relation: "cause",
            options: ["so", "because", "but", "for example"],
            ok: ["so"],
          },
          {
            before: "A pet can teach kids to be kind.",
            after: "children learn to feed it every day.",
            relation: "example",
            options: ["For example,", "Because", "But", "Then,"],
            ok: ["For example,"],
          },
        ],
      },
    },
    {
      kind: "build",
      module: "discourse",
      title: "Build a short argument",
      units: [
        { id: "u1", role: "claim", text: "Our class should have a reading corner." },
        { id: "u2", role: "reason", text: "A quiet corner helps students focus." },
        {
          id: "u3",
          role: "evidence",
          text: "15 of 22 students said they read better when it is quiet.",
        },
        { id: "u4", role: "conclusion", text: "We need a reading corner." },
      ],
      order: ["u1", "u2", "u3", "u4"],
      alt: [],
      connectors: [
        { before: "u3", word: "For example" },
        { before: "u4", word: "That is why" },
      ],
      transfer: {
        units: [
          { id: "t1", role: "claim", text: "The school should add a second water fountain." },
          { id: "t2", role: "reason", text: "One fountain makes the line too long after recess." },
          {
            id: "t3",
            role: "evidence",
            text: "14 students waited in line, and recess was almost over.",
          },
          { id: "t4", role: "conclusion", text: "We need a second fountain." },
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
    idea: "Our school needs more trees.",
    prompt:
      "Start with this idea: “Our school needs more trees.” Write to Principal Lopez. Tell what you think, give reasons, and use facts from the evidence bank that really help. Leave out facts that do not help your idea.",
    audience: ["Principal Lopez", "La directora López"],
    genre: "argument",
    topicTerms: ["tree", "trees", "shade", "playground", "hot", "birds", "school", "cooler"],
    sourceTerms: ["104 degrees", "86 degrees", "18 of 24", "nest", "shady bench"],
    evidenceBank: [
      {
        id: "e1",
        kind: "fact",
        text: "On a sunny day, the blacktop was 104 degrees. The grass under the old oak tree was 86 degrees.",
      },
      {
        id: "e2",
        kind: "number",
        text: "In Room 12, 18 of 24 students said the playground is too hot at recess.",
      },
      {
        id: "e3",
        kind: "fact",
        text: "Two birds built a nest in the one tree on our playground. No nests were found anywhere else.",
      },
      {
        id: "e4",
        kind: "quote",
        text: "“Every day the kids rush to the only shady bench,” said Mr. Dean, the school helper.",
      },
      { id: "e5", kind: "fact", text: "The playground has a red slide and a blue climbing wall." },
      { id: "e6", kind: "fact", text: "Lakeview Elementary was built in 1998." },
      { id: "e7", kind: "number", text: "Our school has 312 students." },
    ],
    organizer: ["claim", "reasons", "evidence"],
    readerQuestions: {
      claim: "What exactly do you want the school to do?",
      reason: "Why do you think so?",
      evidence: "What fact shows that your reason is true?",
      counter: "What would someone who disagrees say, and how would you answer?",
      restate: "How can you end by reminding me of your idea?",
    },
    minWords: 35,
  },
  improve: {
    models: {
      claim: "I think our school should plant more trees on the playground.",
      reason: "I think this because trees make shade, and shade makes the playground cooler.",
      evidence:
        "A thermometer showed the blacktop was 104 degrees, but the grass under the oak tree was 86 degrees.",
      counter: "Some people say trees cost money, but trees give shade for many years.",
      restate: "That is why I believe our school should plant more trees.",
    },
    whys: [
      {
        id: "why-claim",
        text: "It tells my reader exactly what I want, so they know my idea.",
        moves: ["claim"],
      },
      {
        id: "why-reason",
        text: "It says why I think so, so my reader can follow my thinking.",
        moves: ["reason"],
      },
      {
        id: "why-fact",
        text: "It uses a fact, so my reader can trust my reason.",
        moves: ["evidence"],
      },
      {
        id: "why-other",
        text: "It answers a different idea, so my reader sees I thought about both sides.",
        moves: ["counter"],
      },
      {
        id: "why-end",
        text: "It ends with my idea again, so my reader remembers it.",
        moves: ["restate"],
      },
    ],
  },
  show: {
    kind: "compose",
    mode: "write",
    prompt:
      "New decision: The student council has money for ONE thing, a second bike rack or ten more minutes of lunch. Facts: 12 students ride bikes to school, but the rack has only 6 spots, so 6 bikes are locked to the fence. Lunch is 25 minutes, and in a class survey 20 of 30 students said they do not have time to finish eating and play. Choose one. Write to the student council and try to convince them. Give a reason and use a fact.",
    audience: ["The Student Council", "El consejo estudiantil"],
    genre: "argument",
    topicTerms: ["bike", "rack", "lunch", "minutes", "students", "council", "eat", "play"],
    sourceTerms: ["12 students", "6 spots", "25 minutes", "20 of 30"],
    organizer: ["claim", "reasons", "evidence"],
    readerQuestions: {
      claim: "Which one do you choose?",
      reason: "Why do you think so?",
      evidence: "What fact from the prompt shows it?",
      counter: "What would someone who chose the other idea say?",
      restate: "How can you end by asking the council to act?",
    },
    minWords: 30,
  },
};

const g68 = {
  environment: "community",
  context: {
    title: ["A Claim Worth Supporting", "Una afirmación que vale la pena apoyar"],
    premise:
      "Lakeview Middle School has a large paved courtyard with almost no shade, and students avoid it at lunch in September. The Student Voice committee must give Principal Lopez recommendations backed by relevant evidence.",
    cast: [
      {
        id: "lopez",
        name: "Principal Lopez",
        role: ["School principal", "Directora de la escuela"],
        glyph: "👩🏽‍💼",
      },
      {
        id: "okafor",
        name: "Ms. Okafor",
        role: ["Science teacher", "Maestra de ciencias"],
        glyph: "👩🏿‍🔬",
      },
      {
        id: "priya",
        name: "Priya",
        role: ["Committee chair", "Presidenta del comité"],
        glyph: "🧑🏽‍🎓",
      },
    ],
  },
  vocab: [
    [
      "claim",
      "a statement of your position that others can agree or disagree with",
      "afirmación: postura que otros pueden aceptar o rechazar",
    ],
    [
      "evidence",
      "information that supports a claim",
      "evidencia: información que apoya una afirmación",
    ],
    [
      "relevant",
      "directly connected to the topic or claim",
      "relevante: que tiene relación directa con el tema",
    ],
    [
      "reasoning",
      "the explanation of why the evidence supports the claim",
      "razonamiento: la explicación de por qué la evidencia apoya la afirmación",
    ],
    [
      "counterclaim",
      "an opposing position to your claim",
      "contraargumento: una postura opuesta a tu afirmación",
    ],
    [
      "persuade",
      "to lead someone to accept an idea by using reasons",
      "persuadir: lograr que alguien acepte una idea con razones",
    ],
    [
      "heat island",
      "an area that stays hotter than its surroundings because of pavement and buildings",
      "isla de calor: zona más caliente que sus alrededores por el pavimento y los edificios",
    ],
    [
      "budget",
      "the money available for a project",
      "presupuesto: el dinero disponible para un proyecto",
    ],
  ],
  frames: {
    A: [
      "I claim that ___ because ___.",
      "According to ___, ___. This shows that ___.",
      "Although some people argue ___, ___.",
      "For these reasons, ___.",
    ],
    B: ["I claim that ___ because ___.", "The evidence shows ___.", "Although ___, ___."],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "Lakeview's courtyard is nearly empty at lunch in September. What should the school do about it, and what evidence from the courtyard supports your position?",
    objects: [
      {
        id: "thermo",
        label: "Surface thermometer",
        glyph: "🌡️",
        x: 20,
        y: 26,
        relevant: true,
        note: "Readings at 1:00 p.m. on a 91-degree day: asphalt 128°F, concrete bench 119°F, shaded grass lawn beside the courtyard 84°F.",
      },
      {
        id: "survey",
        label: "Student survey",
        glyph: "📊",
        x: 52,
        y: 16,
        relevant: true,
        note: "Survey of 150 students: 96 say they avoid the courtyard in September because it is too hot. Only 31 say they use it.",
      },
      {
        id: "map",
        label: "Site map",
        glyph: "🗺️",
        x: 82,
        y: 28,
        relevant: true,
        note: "Four-fifths of the courtyard is covered by asphalt and concrete. The only tree is a small maple near the east wall.",
      },
      {
        id: "nurse",
        label: "Nurse's log",
        glyph: "🩺",
        x: 30,
        y: 66,
        relevant: true,
        note: "During September the nurse recorded 14 visits from students who felt too hot after lunch. Most of those students had been outside.",
      },
      {
        id: "budget",
        label: "Budget sheet",
        glyph: "💵",
        x: 60,
        y: 70,
        relevant: true,
        note: "Six shade trees would cost about $1,800. Shade sails would cost about $2,400. The student council fund has $1,200 left.",
      },
      {
        id: "gym",
        label: "Gym floor plan",
        glyph: "🏀",
        x: 84,
        y: 64,
        relevant: true,
        note: "The gym can seat 160 students at lunch. Lakeview has 410 students in two lunch periods.",
      },
      {
        id: "statue",
        label: "Heron statue",
        glyph: "🦢",
        x: 8,
        y: 88,
        relevant: false,
        note: "A metal statue of the school mascot, a heron, stands by the front doors.",
      },
    ],
    controls: [
      {
        id: "shade",
        label: "Shade plan",
        initial: "none",
        options: [
          { id: "none", label: "No change" },
          { id: "trees", label: "Plant six trees" },
          { id: "sail", label: "Install shade sails" },
        ],
      },
      {
        id: "lunch",
        label: "Lunch location",
        initial: "outside",
        options: [
          { id: "outside", label: "Courtyard as usual" },
          { id: "inside", label: "Indoor gym" },
        ],
      },
    ],
    outcomes: [
      {
        when: { shade: "none", lunch: "outside" },
        mood: "bad",
        key: "hot",
        state:
          "Model result: the courtyard reads 128°F at 1:00 and about 31 students use it. Nurse visits stay high.",
      },
      {
        when: { shade: "none", lunch: "inside" },
        mood: "warn",
        key: "gym",
        state:
          "Model result: students are out of the heat, but the gym seats only 160, but about 205 students eat in each lunch period, and the courtyard stays empty.",
      },
      {
        when: { shade: "trees", lunch: "outside" },
        mood: "good",
        key: "trees",
        state:
          "Model result: after several growing seasons, shaded surfaces read about 100°F and many more students use the courtyard.",
      },
      {
        when: { shade: "trees", lunch: "inside" },
        mood: "warn",
        key: "treesgym",
        state: "Model result: the gym is crowded now, and the trees help only after they grow.",
      },
      {
        when: { shade: "sail", lunch: "outside" },
        mood: "good",
        key: "sail",
        state:
          "Model result: shaded surfaces read about 105°F right away, but the sails cost $2,400, more than the fund holds.",
      },
      {
        when: { shade: "sail", lunch: "inside" },
        mood: "warn",
        key: "sailgym",
        state:
          "Model result: the sails are paid for but unused, because lunch has moved to a gym that is too small.",
      },
    ],
    collect: 4,
    variables: [
      {
        id: "trees",
        label: "plant shade trees",
        terms: ["tree", "trees", "maple", "plant", "canopy", "grow"],
        evidenceTerms: ["128", "84", "four-fifths", "maple", "1,800", "grass"],
        probe:
          "You favor trees. Which measurements or site notes compare a shaded place with an unshaded one?",
        good: "A comparison of two surface temperatures",
      },
      {
        id: "sail",
        label: "install shade sails",
        terms: ["sail", "sails", "cover", "canopy", "awning", "structure"],
        evidenceTerms: ["105", "2,400", "budget", "1,200"],
        probe:
          "You favor shade sails. What does the budget sheet say about their cost, and how does that compare with the fund?",
        good: "A cost compared with the money available",
      },
      {
        id: "inside",
        label: "move lunch indoors",
        terms: ["inside", "indoor", "indoors", "gym", "move lunch"],
        evidenceTerms: ["160", "410", "survey", "96"],
        probe:
          "You suggest moving lunch indoors. What do the gym floor plan and the survey say about whether that would work for students?",
        good: "The gym capacity compared with the number of students",
      },
    ],
    partner: {
      name: "Principal Lopez",
      glyph: "👩🏽‍💼",
      opening:
        "Thank you for helping the committee. The courtyard is empty at lunch, and I need a clear recommendation. What position do you take?",
      noCause:
        "A position is a start. I need the reasoning behind it. Why do you take that position?",
      noEvidence: "What data or observation from the courtyard supports your position?",
      thanks: "Thank you. Specific evidence is exactly what the committee needs.",
    },
    respond: {
      prompt:
        "Write or say your position to Principal Lopez. Give at least one reason and one piece of evidence from the courtyard.",
      minWords: 18,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "sort",
      title: "Priya summarizes the school store proposal",
      script: [
        {
          id: "u1",
          text: "Our committee is reviewing a proposal for a student-run school store, so I will summarize the arguments we heard.",
          signal: "summarize",
        },
        {
          id: "u2",
          text: "On the plus side, running the store would teach students to manage real money.",
          signal: "On the plus side",
        },
        {
          id: "u3",
          text: "Another advantage is that the profits could pay for club supplies and field trips.",
          signal: "Another advantage",
        },
        {
          id: "u4",
          text: "Supporters also point out that the store could sell healthy snacks for less than the vending machine.",
          signal: "Supporters also point out",
        },
        {
          id: "u5",
          text: "However, the store would need an adult to supervise it during every lunch period.",
          signal: "However",
        },
        {
          id: "u6",
          text: "A second concern is that unsold items could be lost or damaged.",
          signal: "A second concern",
        },
        {
          id: "u7",
          text: "Finally, critics worry that some students could not afford anything and would feel left out.",
          signal: "critics worry",
        },
      ],
      items: [
        { id: "money", label: "Teaches students to manage money", glyph: "🪙" },
        { id: "profits", label: "Profits pay for clubs and trips", glyph: "🎟️" },
        { id: "cheaper", label: "Healthy snacks cost less", glyph: "🍎" },
        { id: "adult", label: "Needs an adult every lunch", glyph: "🧑‍🏫" },
        { id: "lost", label: "Unsold items could be lost", glyph: "📦" },
        { id: "afford", label: "Some students could not afford it", glyph: "👛" },
      ],
      targets: [
        { id: "supports", label: "Supports the proposal" },
        { id: "concern", label: "Raises a concern" },
      ],
      expect: [
        { item: "money", target: "supports", utterance: "u2" },
        { item: "profits", target: "supports", utterance: "u3" },
        { item: "cheaper", target: "supports", utterance: "u4" },
        { item: "adult", target: "concern", utterance: "u5" },
        { item: "lost", target: "concern", utterance: "u6" },
        { item: "afford", target: "concern", utterance: "u7" },
      ],
      visuals: {
        u2: "A student counting coins at a counter",
        u3: "A jar of money beside a club banner",
        u4: "Two price tags side by side on a snack",
        u5: "An adult standing behind a counter",
        u6: "A shelf with an empty gap and a broken box",
        u7: "A student looking at a price list with an empty pocket",
      },
      xray: {
        keywords: ["On the plus side", "However", "concern", "critics worry"],
        sequence: [],
        cause: ["so"],
        referents: [{ phrase: "the store", means: "the student-run school store" }],
      },
      final: {
        mode: "arrange",
        title: "Priya outlines her speech",
        script: [
          {
            id: "f1",
            text: "Priya will speak to the school board about a quiet study room. Listen to how she organizes her argument.",
          },
          {
            id: "f2",
            text: "She opens with her claim: the library should reserve one quiet study room at lunch.",
            signal: "claim",
          },
          {
            id: "f3",
            text: "Next, she gives her main reason, which is that the cafeteria is too loud for studying.",
            signal: "main reason",
          },
          {
            id: "f4",
            text: "Then she presents evidence from a survey, in which 82 of 120 students said they cannot concentrate at lunch.",
            signal: "evidence",
          },
          {
            id: "f5",
            text: "After that, she answers a critic who worries that the room will be crowded.",
            signal: "answers a critic",
          },
          {
            id: "f6",
            text: "Finally, she asks the board to approve a one-month trial.",
            signal: "Finally",
          },
        ],
        items: [
          { id: "claim", label: "Her claim", glyph: "💬" },
          { id: "reason", label: "Her main reason", glyph: "🧠" },
          { id: "evidence", label: "Survey evidence", glyph: "📊" },
          { id: "critic", label: "Her answer to a critic", glyph: "↩️" },
          { id: "request", label: "Her request to the board", glyph: "🙋" },
        ],
        targets: [
          { id: "p1", label: "Step 1" },
          { id: "p2", label: "Step 2" },
          { id: "p3", label: "Step 3" },
          { id: "p4", label: "Step 4" },
          { id: "p5", label: "Step 5" },
        ],
        expect: [
          { item: "claim", target: "p1", utterance: "f2" },
          { item: "reason", target: "p2", utterance: "f3" },
          { item: "evidence", target: "p3", utterance: "f4" },
          { item: "critic", target: "p4", utterance: "f5" },
          { item: "request", target: "p5", utterance: "f6" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Should Lakeview Start a Composting Program?",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "Lakeview Middle School should start a cafeteria composting program.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "A two-week audit found that the cafeteria throws away about 85 pounds of food scraps every week.",
        },
        {
          id: "s3",
          role: "reason",
          supports: ["s1"],
          text: "Food scraps that rot in a landfill release methane, a gas that traps heat, so composting them instead reduces that effect.",
        },
        {
          id: "s4",
          role: "evidence",
          supports: ["s1"],
          text: "Riverside Middle School cut its weekly trash by about one third after it started composting.",
        },
        {
          id: "s5",
          role: "evidence",
          supports: ["s1"],
          text: "Moreover, the finished compost could feed the school garden, which now spends $300 a year on fertilizer.",
        },
        {
          id: "s6",
          role: "detail",
          text: "The cafeteria serves breakfast at 7:30 and lunch at 11:15.",
        },
        {
          id: "s7",
          role: "background",
          text: "The school's recycling program began in 2015.",
        },
        {
          id: "s8",
          role: "claim",
          text: "Composting is the most important thing a school can do.",
        },
        {
          id: "s9",
          role: "detail",
          text: "Some students said the compost bins might smell bad.",
        },
      ],
      claimOptions: ["s1", "s8"],
      challenge: {
        type: "evidence",
        claim: "s1",
        valid: ["s2", "s3", "s4", "s5"],
        minValid: 3,
        weak: ["s6", "s7", "s9"],
        explainFrame: "This evidence supports the claim because ___, which shows ___.",
        explainTerms: ["because", "shows", "so", "which"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "claim",
              text: "The community center should open its computer room on Saturdays.",
            },
            {
              id: "t2",
              role: "evidence",
              text: "Last month, 42 students asked to use the computers on a weekend, but the room was closed.",
            },
            {
              id: "t3",
              role: "reason",
              text: "Many families do not have internet at home, so students cannot finish online assignments.",
            },
            {
              id: "t4",
              role: "evidence",
              text: "The public library, the only other place with free computers, closes at noon on Saturdays.",
            },
            {
              id: "t5",
              role: "detail",
              text: "The computer room has a blue carpet and twelve desks.",
            },
            {
              id: "t6",
              role: "background",
              text: "The community center was built in 1987.",
            },
          ],
          claim: "t1",
          valid: ["t2", "t3", "t4"],
          minValid: 2,
          weak: ["t5", "t6"],
        },
      },
      refs: [
        { sentence: "s3", phrase: "them", means: "the food scraps" },
        { sentence: "s4", phrase: "it", means: "Riverside Middle School" },
      ],
      layers: {
        meaning: [
          {
            s: "s1",
            phrase: "should start a cafeteria composting program",
            label: "the claim: what the writer wants done",
          },
          { s: "s2", phrase: "85 pounds", label: "evidence: a measured amount" },
        ],
        discourse: [
          { s: "s3", phrase: "so", label: "links a cause to its result" },
          { s: "s5", phrase: "Moreover", label: "adds a further piece of evidence" },
        ],
        sentence: [
          { s: "s3", phrase: "a gas that traps heat", label: "a clause that defines methane" },
        ],
        word: [
          { s: "s2", phrase: "audit", label: "academic word", def: "a careful count or check" },
          { s: "s3", phrase: "release", label: "science word", def: "let out or give off" },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "expand",
      title: "Transform a sentence",
      base: "The school should plant trees.",
      needs: [
        { id: "why", label: "Give a reason with a cause word", test: { connectorJob: "cause" } },
        {
          id: "source",
          label: "Introduce your evidence with a source phrase",
          test: { connectorJob: "evidence" },
        },
        {
          id: "other",
          label: "Acknowledge another view with a contrast word",
          test: { connectorJob: "contrast" },
        },
      ],
      altConnectors: [
        {
          word: "because",
          note: "Because states the reason after the claim: The school should plant trees because shade lowers temperatures.",
        },
        {
          word: "According to",
          note: "According to tells the reader where your evidence comes from: According to the survey, ...",
        },
        {
          word: "Although",
          note: "Although opens an opposing idea and then returns to your claim: Although trees cost money, ...",
        },
      ],
      transfer: {
        base: "The library should stay open later.",
        needs: [
          { id: "why", label: "Give a reason with a cause word", test: { connectorJob: "cause" } },
          {
            id: "source",
            label: "Introduce your evidence with a source phrase",
            test: { connectorJob: "evidence" },
          },
        ],
      },
    },
    {
      kind: "build",
      module: "discourse",
      title: "Order an argument",
      units: [
        { id: "u1", role: "claim", text: "The school should plant shade trees in the courtyard." },
        { id: "u2", role: "reason", text: "Shade lowers the temperature of paved surfaces." },
        {
          id: "u3",
          role: "evidence",
          text: "On a 91-degree day, the asphalt measured 128 degrees, while the shaded grass measured 84 degrees.",
        },
        {
          id: "u4",
          role: "counterclaim",
          text: "Some people argue that trees are too expensive for the budget.",
        },
        {
          id: "u5",
          role: "rebuttal",
          text: "The trees cost less than shade sails, and they keep cooling the courtyard for decades.",
        },
        {
          id: "u6",
          role: "conclusion",
          text: "The committee should recommend planting shade trees.",
        },
      ],
      order: ["u1", "u2", "u3", "u4", "u5", "u6"],
      alt: [["u1", "u4", "u5", "u2", "u3", "u6"]],
      connectors: [
        { before: "u3", word: "For example" },
        { before: "u5", word: "However" },
        { before: "u6", word: "For these reasons" },
      ],
      transfer: {
        units: [
          {
            id: "t1",
            role: "claim",
            text: "The library should extend its hours on school nights.",
          },
          {
            id: "t2",
            role: "reason",
            text: "Students need a quiet place with computers after practice ends.",
          },
          {
            id: "t3",
            role: "evidence",
            text: "Last month, 38 students were turned away at closing time.",
          },
          {
            id: "t4",
            role: "counterclaim",
            text: "Some people argue that the library cannot afford extra staff.",
          },
          {
            id: "t5",
            role: "rebuttal",
            text: "Volunteers from the honor society could supervise for free.",
          },
          { id: "t6", role: "conclusion", text: "The library should extend its hours." },
        ],
        order: ["t1", "t2", "t3", "t4", "t5", "t6"],
        alt: [["t1", "t4", "t5", "t2", "t3", "t6"]],
        connectors: [
          { before: "t3", word: "For example" },
          { before: "t5", word: "However" },
          { before: "t6", word: "For these reasons" },
        ],
      },
    },
  ],
  communicate: {
    kind: "compose",
    mode: "write",
    idea: "Our school needs more trees.",
    prompt:
      "Start with this idea: “Our school needs more trees.” Write two short paragraphs to Principal Lopez and the Student Voice committee. State your claim, support it with reasons, and choose evidence that is relevant (some items in the evidence bank do not help). Answer one thing a person who disagrees might say.",
    audience: [
      "Principal Lopez and the Student Voice committee",
      "La directora López y el comité Voz Estudiantil",
    ],
    genre: "argument",
    topicTerms: ["trees", "shade", "courtyard", "heat", "temperature", "asphalt", "school", "cost"],
    sourceTerms: ["128", "84", "96 of 150", "14 visits", "$1,800", "four-fifths"],
    evidenceBank: [
      {
        id: "e1",
        kind: "number",
        text: "On a 91-degree afternoon, asphalt in the courtyard measured 128°F and the shaded lawn beside it measured 84°F.",
      },
      {
        id: "e2",
        kind: "number",
        text: "In a survey of 150 students, 96 said they avoid the courtyard in September because it is too hot.",
      },
      {
        id: "e3",
        kind: "fact",
        text: "Four-fifths of the courtyard is covered by asphalt and concrete, and it has only one small maple tree.",
      },
      {
        id: "e4",
        kind: "number",
        text: "The nurse recorded 14 visits from students who felt too hot after lunch in September. Most of those students had been outside.",
      },
      {
        id: "e5",
        kind: "quote",
        text: "“Pavement soaks up the sun and gives off heat, while shaded ground stays much cooler,” said Ms. Okafor, the science teacher.",
      },
      {
        id: "e6",
        kind: "number",
        text: "Six shade trees would cost about $1,800, but the student council fund has only $1,200 left.",
      },
      {
        id: "e7",
        kind: "fact",
        text: "The school mascot is a heron, and a metal statue of it stands by the front doors.",
      },
      { id: "e8", kind: "number", text: "The art room has 24 desks and four sinks." },
      { id: "e9", kind: "fact", text: "The gym floor was replaced in 2021." },
    ],
    organizer: ["claim", "reasons", "evidence", "counter"],
    readerQuestions: {
      claim: "What exactly do you want the school to do?",
      reason: "Why do you believe that is the right choice?",
      evidence: "Which specific fact or measurement supports that reason?",
      counter: "What would someone who disagrees say, and how would you respond?",
      restate: "How can your last sentence return to your claim and say what should happen next?",
    },
    minWords: 80,
  },
  improve: {
    models: {
      claim: "Lakeview should plant shade trees in the courtyard so students can use it at lunch.",
      reason:
        "Trees are the best solution because their shade keeps paved surfaces from absorbing so much heat.",
      evidence:
        "On a 91-degree afternoon, the asphalt measured 128°F while the shaded lawn measured only 84°F.",
      counter:
        "Although the trees cost $1,800, which is more than the $1,200 fund, a spring fundraiser could cover the difference.",
      restate: "For these reasons, the committee should recommend planting shade trees.",
    },
    whys: [
      {
        id: "why-claim",
        text: "It states one clear position, so my audience knows what I am asking them to accept.",
        moves: ["claim"],
      },
      {
        id: "why-reason",
        text: "It explains why the claim is the right choice, so the argument is not just an opinion.",
        moves: ["reason"],
      },
      {
        id: "why-evidence",
        text: "It cites a relevant measurement, so the argument rests on facts instead of feelings.",
        moves: ["evidence"],
      },
      {
        id: "why-counter",
        text: "It answers a different view, so the audience sees that I considered other positions.",
        moves: ["counter"],
      },
      {
        id: "why-restate",
        text: "It returns to the claim, so the audience remembers my position and what to do.",
        moves: ["restate"],
      },
    ],
  },
  show: {
    kind: "compose",
    mode: "write",
    prompt:
      "New decision: The student council can fund ONE project this year, covered bike racks or a longer lunch. Facts: covered racks cost $1,500; extending lunch from 25 to 35 minutes costs nothing but ends school 10 minutes later. Of 410 students, 46 bike to school, but the old rack holds only 20 bikes, so 26 bikes are locked to the fence and get wet in the rain. In a survey of 120 students, 74 said lunch is too short to eat and relax. Choose ONE project and write two short paragraphs to the council. State your claim, give reasons, use relevant facts from this prompt, and answer one view you disagree with.",
    audience: ["The Student Council", "El consejo estudiantil"],
    genre: "argument",
    topicTerms: ["bike", "racks", "lunch", "minutes", "council", "students", "survey", "cost"],
    sourceTerms: ["$1,500", "46 bike", "26 bikes", "74", "10 minutes later"],
    organizer: ["claim", "reasons", "evidence", "counter"],
    readerQuestions: {
      claim: "Which project do you choose?",
      reason: "Why is it the right choice?",
      evidence: "Which fact from the prompt supports your reason?",
      counter: "What would someone who chose the other project say, and how would you respond?",
      restate: "How can your last sentence return to your claim?",
    },
    minWords: 60,
  },
};

export default {
  id: "m10",
  bands: { "3-5": g35, "6-8": g68 },
};
