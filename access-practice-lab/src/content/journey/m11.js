// Mission 11 — Evidence and Perspectives (Unit 4, Argue). Debate environment.
// Title, goal, WIDA and spiral data live in MISSIONS (curriculum.js); family guidance lives in family.js.
// Task content is English (it is the language practiced); bilingual [en, es] pairs appear only in titles, roles and audiences.
// The partner always takes the OPPOSING position and asks for clarification. Hints ask or point; they never state an answer.

const followUps35 = {
  claim: "Which side do you choose? You can start with “I think the class should …”.",
  reason: "Why do you think so? Try using “because”.",
  evidence: "What fact from the table shows that? Name a number or a note.",
  counter: "I disagree with you. What would you say to answer my idea?",
  restate: "Can you say your idea one more time to finish?",
};

const g35 = {
  environment: "debate",
  context: {
    title: ["The Class Pet Debate", "El debate de la mascota del salón"],
    premise:
      "Room 14 is deciding whether to get a class hamster. Debate Club hears from two teams. Coach Rivera teaches everyone to listen, ask questions, and say why they agree or disagree.",
    cast: [
      {
        id: "rivera",
        name: "Coach Rivera",
        role: ["Debate Club coach", "Entrenador del club de debate"],
        glyph: "🧑🏽‍🏫",
      },
      { id: "ava", name: "Ava", role: ["Team Yes", "Equipo Sí"], glyph: "👧🏻" },
      { id: "leo", name: "Leo", role: ["Team No", "Equipo No"], glyph: "🧒🏾" },
    ],
  },
  vocab: [
    [
      "position",
      "the side of an argument that you choose",
      "postura: el lado de un debate que eliges",
    ],
    [
      "agree",
      "to think the same as someone else",
      "estar de acuerdo: pensar lo mismo que otra persona",
    ],
    [
      "disagree",
      "to think differently from someone else",
      "no estar de acuerdo: pensar diferente de otra persona",
    ],
    [
      "perspective",
      "the way a person sees something",
      "perspectiva: la manera en que una persona ve algo",
    ],
    [
      "allergy",
      "when a body reacts badly to something, like animal fur",
      "alergia: cuando el cuerpo reacciona mal a algo, como el pelo de un animal",
    ],
    [
      "responsible",
      "able to do a job that others depend on",
      "responsable: capaz de hacer un trabajo del que otros dependen",
    ],
    [
      "respect",
      "to treat other people's ideas with care",
      "respeto: tratar con cuidado las ideas de otras personas",
    ],
    [
      "clarify",
      "to make an idea easier to understand",
      "aclarar: hacer que una idea se entienda mejor",
    ],
  ],
  frames: {
    A: [
      "I agree with ___ because ___.",
      "I disagree because ___.",
      "Can you tell me more about ___?",
      "I understand your idea, but I think ___.",
    ],
    B: ["I agree / I disagree because ___.", "What do you mean by ___?"],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "Room 14 might get a class hamster. What do the notes on the table tell you, and what do you think the class should decide?",
    objects: [
      {
        id: "yes",
        label: "Team Yes notes",
        glyph: "📝",
        x: 20,
        y: 26,
        relevant: true,
        note: "Team Yes says a hamster teaches kids to take care of animals. In Room 11, students fed the class pet every day.",
      },
      {
        id: "no",
        label: "Team No notes",
        glyph: "🗒️",
        x: 70,
        y: 24,
        relevant: true,
        note: "Team No says a hamster needs food and water on weekends and holidays, and there is no plan for who will do it.",
      },
      {
        id: "allergy",
        label: "Allergy forms",
        glyph: "🤧",
        x: 82,
        y: 58,
        relevant: true,
        note: "Allergy forms: 3 of the 24 students in Room 14 have an allergy to animal fur.",
      },
      {
        id: "vote",
        label: "Class vote chart",
        glyph: "🗳️",
        x: 44,
        y: 14,
        relevant: true,
        note: "Class vote chart: 15 students want a hamster, 6 do not, and 3 are not sure.",
      },
      {
        id: "cage",
        label: "Cage and supplies",
        glyph: "🐹",
        x: 28,
        y: 64,
        relevant: true,
        note: "A cage and a water bottle are ready. A hamster needs a small scoop of food and fresh water every day.",
      },
      {
        id: "trophy",
        label: "Gold trophy",
        glyph: "🏆",
        x: 90,
        y: 86,
        relevant: false,
        note: "A gold trophy from last year's spelling bee sits on the shelf.",
      },
    ],
    controls: [
      {
        id: "pet",
        label: "Class pet",
        initial: "none",
        options: [
          { id: "none", label: "No pet" },
          { id: "hamster", label: "Hamster" },
        ],
      },
      {
        id: "weekend",
        label: "Weekend plan",
        initial: "noplan",
        options: [
          { id: "noplan", label: "No plan" },
          { id: "turns", label: "Families take turns" },
        ],
      },
    ],
    outcomes: [
      {
        when: { pet: "hamster", weekend: "turns" },
        mood: "good",
        key: "plan",
        state:
          "The hamster has food and water every day, and a family takes it home each weekend. The 3 students with allergies work at a table far from the cage.",
      },
      {
        when: { pet: "hamster", weekend: "noplan" },
        mood: "bad",
        key: "hungry",
        state: "On Monday morning the food bowl is empty and the water bottle is dry.",
      },
      {
        when: { pet: "none", weekend: "turns" },
        mood: "warn",
        key: "unused",
        state:
          "There is no pet, so the weekend plan is not needed. Many students who voted yes are disappointed.",
      },
      {
        when: { pet: "none", weekend: "noplan" },
        mood: "warn",
        key: "quiet",
        state:
          "No one has to plan for weekends, and the students with allergies stay comfortable. Many students who voted yes are disappointed.",
      },
    ],
    collect: 3,
    variables: [
      {
        id: "yes",
        label: "get a class pet",
        terms: ["yes", "hamster", "pet", "learn", "responsible", "care", "feed"],
        evidenceTerms: ["15", "Room 11", "every day", "fed", "vote"],
        probe:
          "You think the class should get a pet. Which note or chart shows how many students want one, or what students could learn?",
        good: "A number from the vote or a note about students caring for a pet",
      },
      {
        id: "no",
        label: "do not get a pet",
        terms: ["no", "allergy", "allergies", "weekend", "holiday", "not get", "should not"],
        evidenceTerms: ["3 of", "allergy forms", "weekend", "no plan"],
        probe:
          "You think the class should not get a pet. What do the allergy forms or the Team No notes say?",
        good: "A number from the allergy forms or a note about weekends",
      },
      {
        id: "middle",
        label: "make a plan for both sides",
        terms: ["plan", "turns", "take turns", "families", "compromise", "both", "fish", "plant"],
        evidenceTerms: ["turns", "weekend", "allergy", "3 of", "15"],
        probe: "You have an idea in the middle. Which two notes does your idea try to solve?",
        good: "Two notes, one from each team",
      },
    ],
    partner: {
      name: "Coach Rivera",
      glyph: "🧑🏽‍🏫",
      opening:
        "Welcome to Debate Club! Room 14 wants to decide about a class pet. Look at the notes on the table. What do you think the class should do?",
      noCause: "That is your position. Now tell me why you think so.",
      noEvidence: "Which note or number from the table makes you think so?",
      thanks: "Thank you. A good debater uses facts and listens to both teams.",
    },
    respond: {
      prompt:
        "Tell Coach Rivera what the class should do. Give a reason and one fact from the table.",
      minWords: 12,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "sort",
      title: "Ava and Leo talk about the class hamster",
      script: [
        {
          id: "u1",
          text: "Ava and Leo are talking about a class hamster.",
          signal: "talking about",
        },
        {
          id: "u2",
          text: "Ava says, “We should get a hamster, because it teaches us to take care of animals.”",
          signal: "Ava says",
        },
        {
          id: "u3",
          text: "Ava also says, “It is fun to watch a hamster run on its wheel.”",
          signal: "Ava also says",
        },
        {
          id: "u4",
          text: "Leo says, “I disagree, because a hamster needs food and water on weekends, and school is closed.”",
          signal: "Leo says",
        },
        {
          id: "u5",
          text: "Leo also says, “Three students in our room have allergies, so a hamster could make them sneeze.”",
          signal: "Leo also says",
        },
        {
          id: "u6",
          text: "Ava answers, “I agree about the allergies, so the cage could stay far from those students.”",
          signal: "Ava answers",
        },
        {
          id: "u7",
          text: "Leo answers, “I understand, but who will take the hamster home on holidays?”",
          signal: "Leo answers",
        },
      ],
      items: [
        { id: "teaches", label: "Teaches us to care for animals", glyph: "🐾" },
        { id: "fun", label: "Fun to watch it run", glyph: "🎡" },
        { id: "weekends", label: "Needs food and water on weekends", glyph: "📆" },
        { id: "allergies", label: "Some students have allergies", glyph: "🤧" },
        { id: "faraway", label: "Keep the cage far from them", glyph: "↔️" },
        { id: "holidays", label: "Who cares for it on holidays?", glyph: "🎄" },
      ],
      targets: [
        { id: "ava", label: "Ava (Team Yes)" },
        { id: "leo", label: "Leo (Team No)" },
      ],
      expect: [
        { item: "teaches", target: "ava", utterance: "u2" },
        { item: "fun", target: "ava", utterance: "u3" },
        { item: "weekends", target: "leo", utterance: "u4" },
        { item: "allergies", target: "leo", utterance: "u5" },
        { item: "faraway", target: "ava", utterance: "u6" },
        { item: "holidays", target: "leo", utterance: "u7" },
      ],
      visuals: {
        u2: "A girl feeding a small animal",
        u3: "A hamster on a running wheel",
        u4: "A calendar with a weekend circled",
        u5: "A child sneezing near a cage",
        u6: "A cage placed at the far end of a room",
        u7: "A holiday calendar with a question mark",
      },
      xray: {
        keywords: ["Ava says", "Leo says", "answers", "disagree", "agree"],
        sequence: [],
        cause: ["because", "so"],
        referents: [
          { phrase: "it", means: "the hamster" },
          { phrase: "them", means: "the students with allergies" },
        ],
      },
      final: {
        mode: "arrange",
        title: "How a friendly debate goes",
        script: [
          { id: "f1", text: "Coach Rivera explains how a friendly debate goes." },
          {
            id: "f2",
            text: "First, the Yes team tells its idea and gives one reason.",
            signal: "First",
          },
          {
            id: "f3",
            text: "Next, the No team asks a question to understand that idea.",
            signal: "Next",
          },
          { id: "f4", text: "Then the Yes team answers the question.", signal: "Then" },
          {
            id: "f5",
            text: "Finally, both teams say one thing they agree on.",
            signal: "Finally",
          },
        ],
        items: [
          { id: "idea", label: "Yes team shares an idea", glyph: "💡" },
          { id: "ask", label: "No team asks a question", glyph: "❓" },
          { id: "answer", label: "Yes team answers", glyph: "🗣️" },
          { id: "agree", label: "Both teams find something to agree on", glyph: "🤝" },
        ],
        targets: [
          { id: "p1", label: "Step 1" },
          { id: "p2", label: "Step 2" },
          { id: "p3", label: "Step 3" },
          { id: "p4", label: "Step 4" },
        ],
        expect: [
          { item: "idea", target: "p1", utterance: "f2" },
          { item: "ask", target: "p2", utterance: "f3" },
          { item: "answer", target: "p3", utterance: "f4" },
          { item: "agree", target: "p4", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Pizza Party or Park Trip?",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "Our class should have a pizza party at the end of the year.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "A party in our room costs only $3 for each student.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "Everyone can stay at school, so nobody has to ride a bus.",
        },
        {
          id: "s4",
          role: "reason",
          supports: ["s1"],
          text: "A party is easy to plan, so we can start it right after lunch.",
        },
        {
          id: "s5",
          role: "claim",
          text: "Our class should take a trip to the park instead.",
        },
        {
          id: "s6",
          role: "evidence",
          text: "The park has a big field where we can run and play games.",
        },
        { id: "s7", role: "detail", text: "Pizza comes with cheese or pepperoni." },
        { id: "s8", role: "background", text: "The school year ends on June 14." },
        { id: "s9", role: "claim", text: "Pizza is the best food in the world." },
      ],
      claimOptions: ["s1", "s9"],
      challenge: {
        type: "perspective",
        claim: "s1",
        valid: ["s2", "s3", "s4"],
        minValid: 2,
        weak: ["s5", "s6", "s7", "s8"],
        explainFrame: "This fact supports the pizza party idea because ___.",
        explainTerms: ["because", "shows", "so"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "claim",
              text: "Our class should read outside on sunny days.",
            },
            {
              id: "t2",
              role: "evidence",
              text: "The reading corner is dark, and outside there is more light.",
            },
            {
              id: "t3",
              role: "evidence",
              text: "Fresh air helps students feel awake, so they can read longer.",
            },
            {
              id: "t4",
              role: "claim",
              text: "Our class should always read inside.",
            },
            {
              id: "t5",
              role: "evidence",
              text: "Wind can blow the pages of our books.",
            },
            { id: "t6", role: "detail", text: "Our reading books have blue covers." },
          ],
          claim: "t1",
          valid: ["t2", "t3"],
          minValid: 1,
          weak: ["t4", "t5", "t6"],
        },
      },
      refs: [
        { sentence: "s4", phrase: "it", means: "the party" },
        { sentence: "s6", phrase: "where", means: "the big field" },
      ],
      layers: {
        meaning: [
          { s: "s1", phrase: "should have a pizza party", label: "one position (a claim)" },
          { s: "s5", phrase: "take a trip to the park instead", label: "a different position" },
        ],
        discourse: [
          { s: "s4", phrase: "so", label: "links a reason to its result" },
          { s: "s5", phrase: "instead", label: "shows a different choice" },
        ],
        sentence: [
          {
            s: "s6",
            phrase: "where we can run and play games",
            label: "tells more about the field",
          },
        ],
        word: [
          { s: "s2", phrase: "costs", label: "money word", def: "how much money something needs" },
          {
            s: "s4",
            phrase: "plan",
            label: "action word",
            def: "decide how to do something before you do it",
          },
        ],
      },
    },
  },
  build: [
    {
      kind: "build",
      module: "connector",
      title: "Agree, disagree and ask",
      gaps: [
        {
          before: "I agree with Ava",
          after: "a hamster teaches us to care for animals.",
          relation: "cause",
          options: ["because", "but", "so", "then"],
          ok: ["because"],
        },
        {
          before: "Ava has a good idea,",
          after: "I think the cage must be far from the students with allergies.",
          relation: "contrast",
          options: ["but", "because", "so", "for example"],
          ok: ["but"],
        },
        {
          before: "A hamster needs daily care.",
          after: "it needs fresh water every morning.",
          relation: "example",
          options: ["For example,", "Because", "But", "Then,"],
          ok: ["For example,"],
        },
        {
          before: "Three students in our room have allergies,",
          after: "I disagree with getting a hamster.",
          relation: "cause",
          options: ["so", "because", "but", "for example"],
          ok: ["so"],
        },
      ],
      notes: {
        because: "Because gives the reason for your idea.",
        but: "But shows that you see it a different way.",
        so: "So gives the result.",
        "For example,": "For example introduces a case that proves your point.",
      },
      transfer: {
        gaps: [
          {
            before: "I disagree",
            after: "the park is far away.",
            relation: "cause",
            options: ["because", "but", "so", "then"],
            ok: ["because"],
          },
          {
            before: "I like the party idea,",
            after: "I also want to play games outside.",
            relation: "contrast",
            options: ["but", "because", "so", "for example"],
            ok: ["but"],
          },
          {
            before: "A party needs supplies.",
            after: "we need cups and plates.",
            relation: "example",
            options: ["For example,", "Because", "But", "Then,"],
            ok: ["For example,"],
          },
        ],
      },
    },
    {
      kind: "build",
      module: "expand",
      title: "Respond to another idea",
      base: "I disagree with Ava.",
      needs: [
        { id: "why", label: "Say why, with a cause word", test: { connectorJob: "cause" } },
        {
          id: "detail",
          label: "Add a fact about the class pet",
          test: {
            terms: [
              "hamster",
              "pet",
              "allergy",
              "allergies",
              "weekend",
              "weekends",
              "food",
              "water",
              "cage",
              "vote",
            ],
          },
        },
        {
          id: "kind",
          label: "Show you listened: add an idea you understand, with a contrast word",
          test: { connectorJob: "contrast" },
        },
      ],
      altConnectors: [
        {
          word: "because",
          note: "Because gives your reason: I disagree with Ava because a hamster needs care on weekends.",
        },
        {
          word: "but",
          note: "But lets you say what you understand first: I understand your idea, but I disagree.",
        },
        {
          word: "so",
          note: "So gives a result: Three students have allergies, so I disagree.",
        },
      ],
      transfer: {
        base: "I agree with the party idea.",
        needs: [
          { id: "why", label: "Say why, with a cause word", test: { connectorJob: "cause" } },
          {
            id: "detail",
            label: "Add a fact about the party",
            test: { terms: ["party", "pizza", "cost", "$3", "bus", "school", "room", "plan"] },
          },
        ],
      },
    },
  ],
  communicate: {
    kind: "converse",
    mode: "discuss",
    prompt:
      "Choose a side about the class hamster. Tell your partner what you think and why, use a fact from the table, and answer your partner's idea.",
    partner: {
      name: "Sam",
      glyph: "🧒🏽",
      role: ["Debate partner on the other side", "Compañero de debate del otro lado"],
      opening:
        "I am on the other team. You pick Yes or No for the class hamster, and I will take the other side. Which side do you choose, and why?",
    },
    topicTerms: [
      "hamster",
      "pet",
      "class",
      "allergy",
      "weekend",
      "care",
      "feed",
      "agree",
      "disagree",
    ],
    sourceTerms: ["3 of 24", "15", "weekends", "Room 11"],
    evidenceBank: [
      "15 of 24 students voted for a hamster, 6 voted no, and 3 were not sure.",
      "3 of the 24 students in Room 14 have an allergy to animal fur.",
      "In Room 11, students fed the class pet every day.",
      "A hamster needs food and water on weekends and holidays, when school is closed.",
      "A gold trophy from the spelling bee sits on the shelf.",
    ],
    lines: [
      {
        id: "yes",
        terms: [
          "yes",
          "should get",
          "get a hamster",
          "get a pet",
          "learn",
          "teach",
          "responsible",
          "fun",
          "want a pet",
        ],
        evidenceTerms: ["15", "voted", "Room 11", "fed"],
        ack: "So you want a hamster. I take the other side: I worry about who will care for it on weekends.",
        probe: "Can you tell me more? What fact shows that your idea can work?",
        close: "A fact about the students, and an answer to my worry",
      },
      {
        id: "no",
        terms: [
          "no",
          "should not",
          "not get",
          "allergy",
          "allergies",
          "weekend",
          "holiday",
          "too much work",
        ],
        evidenceTerms: ["3 of", "24", "allergy forms", "weekend", "holiday"],
        ack: "So you do not want a hamster. I take the other side: I think kids would learn to care for it.",
        probe: "Can you tell me more? Which fact shows why a hamster would be a problem?",
        close: "A fact from the table, and an answer to my idea",
      },
      {
        id: "plan",
        terms: ["plan", "turns", "take turns", "families", "compromise", "both", "fish", "plant"],
        evidenceTerms: ["turns", "3 of", "15", "weekend", "allergy"],
        ack: "So you have an idea in the middle. I disagree a little, because plans can be forgotten.",
        probe: "Can you tell me more? How does your plan help students on both teams?",
        close: "A fact from each team, and how your plan uses them",
      },
    ],
    followUps: followUps35,
    maxTurns: 4,
    minWords: 20,
  },
  improve: {
    models: {
      claim: "I think the class should get a hamster.",
      reason: "I think this because a class pet teaches us to be responsible.",
      evidence: "The class vote chart shows that 15 of the 24 students want a hamster.",
      counter: "I understand your worry about weekends, but families could take turns.",
      restate: "That is why I still think the class should get a hamster.",
    },
    whys: [
      {
        id: "why-claim",
        text: "It says my side clearly, so my partner knows what we are talking about.",
        moves: ["claim"],
      },
      {
        id: "why-reason",
        text: "It tells why I think so, so my partner can understand my idea.",
        moves: ["reason"],
      },
      {
        id: "why-fact",
        text: "It uses a fact, so my partner can see that my idea is not only a feeling.",
        moves: ["evidence"],
      },
      {
        id: "why-listen",
        text: "It answers my partner's idea, so my partner knows I listened.",
        moves: ["counter"],
      },
      {
        id: "why-end",
        text: "It ends with my side again, so my partner remembers it.",
        moves: ["restate"],
      },
    ],
  },
  show: {
    kind: "converse",
    mode: "discuss",
    prompt:
      "New topic: Should our class have a quiet reading corner or a game corner? Facts: the room has space for only one. In a vote, 11 students chose reading, 9 chose games, and 4 were not sure. A reading corner needs 4 beanbags. A game corner needs a table and 3 games. Choose a side, talk with your partner, and say why you agree or disagree.",
    partner: {
      name: "Nina",
      glyph: "👧🏾",
      role: ["Debate partner on the other side", "Compañera de debate del otro lado"],
      opening:
        "I will take the side you do not choose. Which corner should our room have, and why?",
    },
    topicTerms: ["reading", "game", "corner", "vote", "beanbags", "quiet", "play", "students"],
    sourceTerms: ["11", "9", "4 beanbags", "3 games"],
    lines: [
      {
        id: "reading",
        terms: ["reading", "read", "quiet", "books", "beanbags"],
        evidenceTerms: ["11", "vote", "4 beanbags"],
        ack: "So you want the reading corner. I will argue for the game corner.",
        probe: "Can you tell me more? What fact from the vote or the supplies supports your side?",
        close: "A fact from the prompt, and an answer to my idea",
      },
      {
        id: "games",
        terms: ["game", "games", "play", "fun", "table"],
        evidenceTerms: ["9", "vote", "3 games", "table"],
        ack: "So you want the game corner. I will argue for the reading corner.",
        probe: "Can you tell me more? What fact from the vote or the supplies supports your side?",
        close: "A fact from the prompt, and an answer to my idea",
      },
      {
        id: "both",
        terms: ["both", "share", "turns", "switch", "days", "week"],
        evidenceTerms: ["11", "9", "4", "vote"],
        ack: "So you want to share the space. I think only one can fit.",
        probe: "Can you tell me more? How would your plan work with the facts about the room?",
        close: "A fact from the prompt, and how the plan fits it",
      },
    ],
    followUps: {
      claim: "Which corner do you choose?",
      reason: "Why do you think so? Try using “because”.",
      evidence: "What fact from the prompt shows that?",
      counter: "I disagree with you. What would you say to answer my idea?",
      restate: "Can you say your idea one more time to finish?",
    },
    maxTurns: 4,
    minWords: 20,
  },
};

const g68 = {
  environment: "debate",
  context: {
    title: ["Should School Start Later?", "¿Debería empezar más tarde la escuela?"],
    premise:
      "Cedar Hill Middle School starts at 7:45 a.m. The school board will vote on moving the first bell to 8:30, and the Debate Society is preparing to present both positions. The moderator asks every speaker to support claims with evidence and to respond to opposing views.",
    cast: [
      {
        id: "alvarez",
        name: "Ms. Alvarez",
        role: ["Debate moderator", "Moderadora del debate"],
        glyph: "👩🏽‍🏫",
      },
      {
        id: "nguyen",
        name: "Dr. Nguyen",
        role: ["Education researcher", "Investigadora educativa"],
        glyph: "🧑🏻‍⚕️",
      },
      {
        id: "brooks",
        name: "Mr. Brooks",
        role: ["Transportation coordinator", "Coordinador de transporte"],
        glyph: "🧔🏾",
      },
    ],
  },
  vocab: [
    [
      "perspective",
      "the way a person sees an issue, based on their situation",
      "perspectiva: la manera en que una persona ve un tema según su situación",
    ],
    ["position", "the opinion a speaker defends", "postura: la opinión que defiende una persona"],
    [
      "rebuttal",
      "a response that shows why another position is weak",
      "refutación: respuesta que muestra por qué otra postura es débil",
    ],
    [
      "clarify",
      "to explain something so it is easier to understand",
      "aclarar: explicar algo para que se entienda mejor",
    ],
    [
      "concede",
      "to admit that another person is right about a point",
      "conceder: reconocer que otra persona tiene razón en un punto",
    ],
    [
      "trade-off",
      "something you give up in order to gain something else",
      "contrapartida: algo a lo que renuncias para ganar otra cosa",
    ],
    ["feasible", "possible to do in practice", "factible: que se puede hacer en la práctica"],
    [
      "evidence",
      "information that supports a claim",
      "evidencia: información que apoya una afirmación",
    ],
  ],
  frames: {
    A: [
      "I see your point about ___, but ___.",
      "Could you clarify what you mean by ___?",
      "The evidence shows ___, which supports ___.",
      "I concede that ___; however, ___.",
    ],
    B: [
      "I understand that ___; however, ___.",
      "Could you clarify ___?",
      "The evidence shows ___.",
    ],
    C: [],
  },
  discover: {
    kind: "scene",
    prompt:
      "The board will vote on moving the first bell from 7:45 to 8:30. What do the records show, and what position will you defend?",
    objects: [
      {
        id: "sleep",
        label: "Sleep survey",
        glyph: "😴",
        x: 18,
        y: 24,
        relevant: true,
        note: "Survey of 200 eighth graders: 124 sleep fewer than eight hours on school nights, and 138 say they feel tired in first period.",
      },
      {
        id: "tardy",
        label: "Attendance log",
        glyph: "📒",
        x: 50,
        y: 14,
        relevant: true,
        note: "Last year the office recorded 312 tardies, and most happened in the first 15 minutes of the school day.",
      },
      {
        id: "bus",
        label: "Bus schedule",
        glyph: "🚌",
        x: 80,
        y: 26,
        relevant: true,
        note: "The district shares morning buses among three schools. A later bell would add about 20 minutes to the ride for 60 Cedar Hill students. Adding two buses would cost about $48,000 a year.",
      },
      {
        id: "sports",
        label: "Practice calendar",
        glyph: "🏅",
        x: 28,
        y: 66,
        relevant: true,
        note: "Sports practice now ends at 5:00 p.m. With a later bell, practice would end about 45 minutes later, at 5:45 p.m.",
      },
      {
        id: "family",
        label: "Family survey",
        glyph: "👨‍👩‍👧",
        x: 62,
        y: 70,
        relevant: true,
        note: "Survey of 100 families: 41 say a later start would help, 34 say it would make morning childcare harder, and 25 see no difference.",
      },
      {
        id: "case",
        label: "Trophy case",
        glyph: "🏆",
        x: 90,
        y: 88,
        relevant: false,
        note: "The trophy case holds a 2019 robotics trophy and a framed team photo.",
      },
    ],
    controls: [
      {
        id: "start",
        label: "First bell",
        initial: "early",
        options: [
          { id: "early", label: "7:45 a.m." },
          { id: "late", label: "8:30 a.m." },
        ],
      },
      {
        id: "buses",
        label: "Bus plan",
        initial: "same",
        options: [
          { id: "same", label: "Current routes" },
          { id: "added", label: "Add two buses" },
        ],
      },
    ],
    outcomes: [
      {
        when: { start: "early", buses: "same" },
        mood: "warn",
        key: "now",
        state:
          "Model result: nothing changes. 138 of 200 eighth graders still report feeling tired in first period.",
      },
      {
        when: { start: "early", buses: "added" },
        mood: "warn",
        key: "waste",
        state:
          "Model result: the buses cost about $48,000 a year, but the school day does not change.",
      },
      {
        when: { start: "late", buses: "same" },
        mood: "warn",
        key: "late",
        state:
          "Model result: tardies are likely to fall, but 60 students ride about 20 minutes longer and practice ends at 5:45.",
      },
      {
        when: { start: "late", buses: "added" },
        mood: "good",
        key: "lateplus",
        state:
          "Model result: tardies are likely to fall and bus rides stay the same, but the plan costs about $48,000 a year and practice still ends at 5:45.",
      },
    ],
    collect: 4,
    variables: [
      {
        id: "sleep",
        label: "a later start for sleep and alertness",
        terms: [
          "sleep",
          "tired",
          "rest",
          "health",
          "alert",
          "tardy",
          "tardies",
          "later start",
          "8:30",
        ],
        evidenceTerms: ["124", "138", "200", "312", "survey", "attendance"],
        probe:
          "You are arguing from sleep and alertness. Which records give numbers, and what does each one measure?",
        good: "A number from the sleep survey or the attendance log",
      },
      {
        id: "transport",
        label: "keep the start time because of buses",
        terms: [
          "bus",
          "buses",
          "transportation",
          "ride",
          "routes",
          "cost",
          "schedule",
          "keep",
          "7:45",
        ],
        evidenceTerms: ["60", "20 minutes", "two buses", "48,000", "bus schedule"],
        probe:
          "You are arguing about buses and schedules. What does the bus schedule record, and for how many students?",
        good: "A number from the bus schedule",
      },
      {
        id: "balance",
        label: "balance after-school and family needs",
        terms: [
          "practice",
          "sports",
          "after school",
          "childcare",
          "family",
          "families",
          "compromise",
          "8:15",
        ],
        evidenceTerms: ["5:45", "34", "41", "100", "practice calendar", "family survey"],
        probe:
          "You are weighing after-school and family needs. What do the practice calendar and the family survey show, and are the families all on one side?",
        good: "A time from the calendar or a count from the family survey",
      },
    ],
    partner: {
      name: "Ms. Alvarez",
      glyph: "👩🏽‍🏫",
      opening:
        "I moderate the Debate Society. The board votes soon on moving the first bell to 8:30. Which position do you take, and what supports it?",
      noCause:
        "You have named a position. A debater must explain the reasoning behind it. Why do you hold that position?",
      noEvidence: "Which record from the prep room supports that reasoning?",
      thanks: "Thank you. Your reasoning will help us prepare both sides of the debate.",
    },
    respond: {
      prompt:
        "State your position to Ms. Alvarez. Give one reason and cite one record from the prep room.",
      minWords: 18,
    },
  },
  understand: {
    listen: {
      kind: "listen",
      mode: "sort",
      title: "Two speakers at the board forum",
      script: [
        {
          id: "u1",
          text: "At the board forum, two speakers presented opposing views on a later start time.",
          signal: "opposing views",
        },
        {
          id: "u2",
          text: "Dr. Nguyen argued that teenagers need more sleep, because their body clocks shift later during the teenage years.",
          signal: "argued",
        },
        {
          id: "u3",
          text: "She added that tired students make more mistakes and arrive late more often.",
          signal: "added",
        },
        {
          id: "u4",
          text: "Mr. Brooks replied that a later bell would delay the buses, since the district shares routes among three schools.",
          signal: "replied",
        },
        {
          id: "u5",
          text: "He warned that sixty students would ride about twenty minutes longer.",
          signal: "warned",
        },
        {
          id: "u6",
          text: "Dr. Nguyen conceded that buses are a real problem, but she insisted that the board could add routes.",
          signal: "conceded",
        },
        {
          id: "u7",
          text: "Mr. Brooks agreed that extra routes would help, although they would cost about forty-eight thousand dollars a year.",
          signal: "although",
        },
      ],
      items: [
        { id: "clocks", label: "Teen body clocks shift later", glyph: "⏰" },
        { id: "tired", label: "Tired students are late more often", glyph: "😴" },
        { id: "shared", label: "Buses are shared by three schools", glyph: "🚌" },
        { id: "longer", label: "Sixty students would ride longer", glyph: "⌛" },
        { id: "routes", label: "The board could add routes", glyph: "🗺️" },
        { id: "cost", label: "Extra routes cost about $48,000", glyph: "💵" },
      ],
      targets: [
        { id: "nguyen", label: "Dr. Nguyen" },
        { id: "brooks", label: "Mr. Brooks" },
      ],
      expect: [
        { item: "clocks", target: "nguyen", utterance: "u2" },
        { item: "tired", target: "nguyen", utterance: "u3" },
        { item: "shared", target: "brooks", utterance: "u4" },
        { item: "longer", target: "brooks", utterance: "u5" },
        { item: "routes", target: "nguyen", utterance: "u6" },
        { item: "cost", target: "brooks", utterance: "u7" },
      ],
      visuals: {
        u2: "A clock face with the hands moved later",
        u3: "A student yawning at a desk",
        u4: "Three school buildings joined by one bus line",
        u5: "A bus with a long arrow pointing ahead",
        u6: "A map with a new route drawn in",
        u7: "A price tag beside a bus",
      },
      xray: {
        keywords: ["argued", "added", "replied", "warned", "conceded", "although"],
        sequence: [],
        cause: ["because", "since"],
        referents: [
          { phrase: "She", means: "Dr. Nguyen" },
          { phrase: "He", means: "Mr. Brooks" },
          { phrase: "they", means: "the extra routes" },
        ],
      },
      final: {
        mode: "arrange",
        title: "How a speaker answers an opposing view",
        script: [
          {
            id: "f1",
            text: "Ms. Alvarez models how a speaker responds to an opposing view.",
          },
          {
            id: "f2",
            text: "First, the speaker restates the other person's point to show she was listening.",
            signal: "First",
          },
          {
            id: "f3",
            text: "Next, she concedes what is true in that point.",
            signal: "Next",
          },
          {
            id: "f4",
            text: "Then she answers with her own evidence.",
            signal: "Then",
          },
          {
            id: "f5",
            text: "Finally, she asks a clarifying question to keep the discussion going.",
            signal: "Finally",
          },
        ],
        items: [
          { id: "restate", label: "Restate the other speaker's point", glyph: "🔁" },
          { id: "concede", label: "Concede what is true", glyph: "🤲" },
          { id: "evidence", label: "Answer with evidence", glyph: "📊" },
          { id: "clarify", label: "Ask a clarifying question", glyph: "❓" },
        ],
        targets: [
          { id: "p1", label: "Step 1" },
          { id: "p2", label: "Step 2" },
          { id: "p3", label: "Step 3" },
          { id: "p4", label: "Step 4" },
        ],
        expect: [
          { item: "restate", target: "p1", utterance: "f2" },
          { item: "concede", target: "p2", utterance: "f3" },
          { item: "evidence", target: "p3", utterance: "f4" },
          { item: "clarify", target: "p4", utterance: "f5" },
        ],
      },
    },
    read: {
      kind: "read",
      title: "Tablets or Textbooks?",
      passage: [
        {
          id: "s1",
          role: "claim",
          text: "Cedar Hill should replace its printed textbooks with tablets.",
        },
        {
          id: "s2",
          role: "evidence",
          supports: ["s1"],
          text: "A tablet holds every textbook, so students would carry it instead of five heavy books.",
        },
        {
          id: "s3",
          role: "evidence",
          supports: ["s1"],
          text: "Digital textbooks can be updated each year, but a printed book stays the same for ten years.",
        },
        {
          id: "s4",
          role: "reason",
          supports: ["s1"],
          text: "Free updates keep the information current, so students learn from the latest facts.",
        },
        {
          id: "s5",
          role: "claim",
          text: "Cedar Hill should keep its printed textbooks.",
        },
        {
          id: "s6",
          role: "evidence",
          text: "In a trial, 52 of 80 students said they stay focused longer with paper than with a screen.",
        },
        {
          id: "s7",
          role: "evidence",
          text: "Tablets cost about $300 each, while a printed book lasts for years.",
        },
        {
          id: "s8",
          role: "background",
          text: "The textbook storage room is behind the gym.",
        },
        {
          id: "s9",
          role: "claim",
          text: "Technology is always better than paper.",
        },
      ],
      claimOptions: ["s1", "s9"],
      challenge: {
        type: "perspective",
        claim: "s1",
        valid: ["s2", "s3", "s4"],
        minValid: 3,
        weak: ["s5", "s6", "s7", "s8"],
        explainFrame: "This evidence supports the tablet position because ___, which means ___.",
        explainTerms: ["because", "which means", "so", "shows"],
        transfer: {
          passage: [
            {
              id: "t1",
              role: "claim",
              text: "Lunch periods should be moved outdoors on warm days.",
            },
            {
              id: "t2",
              role: "evidence",
              text: "In a two-week pilot, 61 of 90 students who ate outside said they felt more awake in class.",
            },
            {
              id: "t3",
              role: "reason",
              text: "Fresh air and sunlight help people feel alert, so afternoon classes could go better.",
            },
            {
              id: "t4",
              role: "claim",
              text: "Lunch should stay inside the cafeteria.",
            },
            {
              id: "t5",
              role: "evidence",
              text: "Staff say that supervising students outdoors takes ten extra minutes, which shortens lunch.",
            },
            {
              id: "t6",
              role: "background",
              text: "The Cedar Hill cafeteria opened in 1994.",
            },
          ],
          claim: "t1",
          valid: ["t2", "t3"],
          minValid: 2,
          weak: ["t4", "t5", "t6"],
        },
      },
      refs: [
        { sentence: "s2", phrase: "it", means: "one tablet" },
        { sentence: "s6", phrase: "they", means: "the students in the trial" },
      ],
      layers: {
        meaning: [
          {
            s: "s1",
            phrase: "should replace its printed textbooks with tablets",
            label: "position A: the first claim",
          },
          {
            s: "s5",
            phrase: "should keep its printed textbooks",
            label: "position B: the opposing claim",
          },
        ],
        discourse: [
          { s: "s3", phrase: "but", label: "contrasts two kinds of textbook" },
          { s: "s7", phrase: "while", label: "compares tablets with books" },
        ],
        sentence: [
          { s: "s4", phrase: "so students learn from the latest facts", label: "a result clause" },
        ],
        word: [
          {
            s: "s3",
            phrase: "updated",
            label: "academic word",
            def: "changed to include new information",
          },
          {
            s: "s7",
            phrase: "lasts for years",
            label: "collocation",
            def: "stays in use for a long time",
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
      pair: [
        "A later start could give students more sleep.",
        "A later start would delay the buses.",
      ],
      relation: "contrast",
      keep: ["start", "sleep", "delay", "buses"],
      transfer: {
        pair: ["Tablets are lighter than five textbooks.", "Tablets cost about $300 each."],
        relation: "contrast",
        keep: ["tablets", "lighter", "cost"],
      },
    },
    {
      kind: "build",
      module: "connector",
      title: "Concede, contrast and clarify",
      gaps: [
        {
          before: "I concede that buses are a real problem;",
          after: "the board could add routes.",
          relation: "contrast",
          options: ["however,", "because", "for example,", "therefore,"],
          ok: ["however,"],
        },
        {
          before: "Many students sleep fewer than eight hours,",
          after: "they arrive tired.",
          relation: "cause",
          options: ["so", "but", "while", "before"],
          ok: ["so"],
        },
        {
          before: "Dr. Nguyen argues for more sleep,",
          after: "Mr. Brooks argues for shorter bus rides.",
          relation: "contrast",
          options: ["while", "because", "so that", "after"],
          ok: ["while"],
        },
        {
          before: "The sleep data are strong.",
          after: "the costs of new buses are also real.",
          relation: "contrast",
          options: ["On the other hand,", "For example,", "Because", "Then,"],
          ok: ["On the other hand,"],
        },
      ],
      notes: {
        "however,": "However turns to a point that limits what you just said.",
        so: "So shows a result.",
        while: "While sets two positions side by side.",
        "On the other hand,": "On the other hand introduces the opposite side of a trade-off.",
      },
      transfer: {
        gaps: [
          {
            before: "I understand that tablets are light;",
            after: "paper helped more students focus.",
            relation: "contrast",
            options: ["however,", "because", "for example,", "therefore,"],
            ok: ["however,"],
          },
          {
            before: "Tablets cost about $300 each,",
            after: "a printed book lasts for years.",
            relation: "contrast",
            options: ["while", "because", "so that", "after"],
            ok: ["while"],
          },
          {
            before: "Fresh air helps students stay alert,",
            after: "afternoon classes could improve.",
            relation: "cause",
            options: ["so", "but", "while", "before"],
            ok: ["so"],
          },
        ],
      },
    },
  ],
  communicate: {
    kind: "converse",
    mode: "speak",
    prompt:
      "Take a position on moving the first bell to 8:30. Support it with evidence from the records, and respond to your opponent's view.",
    partner: {
      name: "Jordan",
      glyph: "🧑🏾‍🎓",
      role: ["Debate partner on the opposing side", "Compañero de debate del lado opuesto"],
      opening:
        "I will argue the side you do not choose. State your position on moving the first bell to 8:30, and give me your strongest evidence.",
    },
    topicTerms: [
      "start",
      "later",
      "bell",
      "sleep",
      "tired",
      "buses",
      "practice",
      "tardy",
      "8:30",
      "position",
    ],
    sourceTerms: ["124 of 200", "138", "312", "60 students", "20 minutes", "5:45", "$48,000"],
    evidenceBank: [
      "A survey of 200 eighth graders found that 124 sleep fewer than eight hours on school nights.",
      "In the same survey, 138 of 200 students said they feel tired in first period.",
      "Last year there were 312 tardies, and most happened in the first 15 minutes of the day.",
      "A later bell would add about 20 minutes to the bus ride for 60 students.",
      "Adding two buses would cost about $48,000 a year.",
      "With an 8:30 start, sports practice would end around 5:45 p.m.",
      "In a survey of 100 families, 41 said a later start would help, 34 said childcare would be harder, and 25 saw no difference.",
      "The trophy case holds a 2019 robotics trophy.",
    ],
    lines: [
      {
        id: "later",
        terms: [
          "later start",
          "start later",
          "8:30",
          "move the bell",
          "push back",
          "sleep",
          "tired",
          "alert",
          "tardy",
          "tardies",
        ],
        evidenceTerms: ["124", "138", "200", "312", "survey", "attendance"],
        ack: "So you support a later start. I will argue the other side, and I am not convinced yet.",
        probe:
          "Which record shows how many students are affected, and what exactly did it measure?",
        close: "A number from the sleep survey or the attendance log, and what it measures",
      },
      {
        id: "keep",
        terms: [
          "keep",
          "7:45",
          "current",
          "early",
          "not change",
          "stay",
          "buses",
          "routes",
          "transportation",
          "practice",
        ],
        evidenceTerms: ["60", "20 minutes", "48,000", "5:45", "bus schedule", "practice calendar"],
        ack: "So you want to keep the current start. I will argue for the later start.",
        probe:
          "Which record supports that position, and does it show a problem that cannot be solved?",
        close:
          "A number from the bus schedule or practice calendar, and why the problem has no fix",
      },
      {
        id: "balance",
        terms: ["compromise", "8:15", "middle", "phase", "trial", "pilot", "both", "balance"],
        evidenceTerms: ["41", "34", "100", "124", "60", "5:45"],
        ack: "So you suggest a middle path. I am not sure a compromise helps either side.",
        probe: "Which two records does your compromise try to balance, and how?",
        close: "Two records, and how the plan balances them",
      },
    ],
    followUps: {
      claim: "Start by stating your position in one sentence.",
      reason: "Why do you hold that position? Link your reason with a connector.",
      evidence: "Which record or number supports that reasoning? Say what it measures.",
      counter: "I disagree with part of that. How would you respond to my concern?",
      restate: "To close, return to your position and say what the board should do.",
    },
    maxTurns: 4,
    minWords: 40,
  },
  improve: {
    models: {
      claim:
        "I support moving the first bell to 8:30 because students need more sleep to learn well.",
      reason:
        "I hold this position because tired students arrive late more often and miss the start of class.",
      evidence:
        "A survey of 200 students found that 124 sleep fewer than eight hours, and 138 feel tired in first period.",
      counter:
        "I concede that a later bell would add about 20 minutes to the ride for 60 students; however, the district could add routes.",
      restate: "For these reasons, I urge the board to approve the 8:30 start.",
    },
    whys: [
      {
        id: "why-claim",
        text: "It states my position in one sentence, so my opponent knows exactly what I am defending.",
        moves: ["claim"],
      },
      {
        id: "why-reason",
        text: "It explains the reasoning behind my position, so it is more than an opinion.",
        moves: ["reason"],
      },
      {
        id: "why-evidence",
        text: "It cites a record and says what it measures, so my opponent can check my evidence.",
        moves: ["evidence"],
      },
      {
        id: "why-counter",
        text: "It concedes a fair point and then responds, so the discussion stays respectful and moves forward.",
        moves: ["counter"],
      },
      {
        id: "why-restate",
        text: "It returns to my position, so the listeners remember what I am asking for.",
        moves: ["restate"],
      },
    ],
  },
  show: {
    kind: "converse",
    mode: "discuss",
    prompt:
      "New topic: Should students be allowed to use phones during lunch? Facts: in a survey of 120 students, 81 said phones help them relax at lunch. Teachers recorded 24 lunch conflicts last year, and 9 began with a phone. Without phones, students might talk more with classmates, but some students use phones to call family. Choose a position and discuss it with a partner who takes the opposing side. Support your position with the facts and respond to your partner's view.",
    partner: {
      name: "Riley",
      glyph: "🧑🏻‍🎓",
      role: ["Debate partner on the opposing side", "Compañero de debate del lado opuesto"],
      opening:
        "I will take the opposite side from you. Should students use phones at lunch? State your position and your best reason.",
    },
    topicTerms: [
      "phones",
      "lunch",
      "relax",
      "conflicts",
      "survey",
      "classmates",
      "family",
      "position",
    ],
    sourceTerms: ["81", "120", "24 lunch conflicts", "9 began"],
    lines: [
      {
        id: "allow",
        terms: ["allow", "allowed", "should use", "relax", "phones help", "yes", "call family"],
        evidenceTerms: ["81", "120", "survey", "call family"],
        ack: "So you think phones should be allowed at lunch. I will argue against that.",
        probe:
          "Which fact from the prompt supports your position, and what does it actually measure?",
        close: "A number from the prompt, and what it measures",
      },
      {
        id: "restrict",
        terms: [
          "not allowed",
          "ban",
          "should not",
          "no phones",
          "restrict",
          "conflicts",
          "talk more",
        ],
        evidenceTerms: ["24", "9", "conflicts", "talk"],
        ack: "So you think phones should not be allowed at lunch. I will argue for allowing them.",
        probe:
          "Which fact from the prompt supports your position, and does it prove phones caused the problem?",
        close: "A number from the prompt, and how far it supports the claim",
      },
      {
        id: "limit",
        terms: ["limit", "zone", "some days", "only", "compromise", "rules", "emergency"],
        evidenceTerms: ["81", "24", "9", "family"],
        ack: "So you want limits instead of a yes or no. I am not sure a rule like that can work.",
        probe: "Which two facts from the prompt does your rule try to balance, and how?",
        close: "Two facts, and how the rule balances them",
      },
    ],
    followUps: {
      claim: "Start by stating your position in one sentence.",
      reason: "Why do you hold that position? Link your reason with a connector.",
      evidence: "Which fact from the prompt supports that reasoning? Say what it measures.",
      counter: "I disagree with part of that. How would you respond to my concern?",
      restate: "To close, return to your position and say what the school should do.",
    },
    maxTurns: 4,
    minWords: 40,
  },
};

export default {
  id: "m11",
  bands: { "3-5": g35, "6-8": g68 },
};
