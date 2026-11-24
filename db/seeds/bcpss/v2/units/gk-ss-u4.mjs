// BCPSS Language Studio v2 — gk-ss-u4 (Kindergarten Social Studies, Studies Weekly). Schema: ../schema.mjs

export default {
  essential_question: "How do neighborhood workers help people get what they need?",
  can_do: {
    content: "I can tell needs from wants and tell how workers give goods and services.",
    language: "I can explain a cause and an effect using the word so.",
  },
  mentor: {
    text: "People need food, so the grocer sells apples.",
    gist: "The speaker names a need first, then uses 'so' to tell how a worker helps.",
    chunks: [
      { text: "People need food,", role: "The need", tone: "concept", ask: "What do people need?" },
      { text: "so", role: "The joining word", tone: "connector", ask: "Which little word joins the need to the helper?" },
      { text: "the grocer sells apples.", role: "How the worker helps", tone: "evidence", ask: "What does the grocer do?" },
    ],
  },
  frames: {
    l1_2: [
      "I need [food].",
      "I want a [toy].",
      "The [worker] helps us.",
    ],
    l3_4: [
      "People need [food], so the [grocer] sells [apples].",
      "A [bus driver] gives a [service].",
      "I want a [toy], but I need [shoes].",
    ],
    l5_6: [
      "Because people need [need], the [worker] helps by [providing a good / service].",
      "A [baker] makes [goods], and a [nurse] gives a [service].",
      "A [need] is something we must have, but a [want] is something we would like.",
    ],
  },
  connectors: ["so", "because", "and", "but", "then", "also"],
  vocab: [
    { term: "need", tier: 2, pos: "noun", icon: "🍞", def: "something people must have to live", example: "Food is a need for every person.", nonexample: "A video game is not a need.", es: "necesidad", es_note: "Need = necesidad. The verb 'to need' = necesitar.", family: ["needs"], cue: "A loaf of bread, a glass of water, and a coat." },
    { term: "want", tier: 2, pos: "noun", icon: "🧸", def: "something nice to have that you can live without", example: "A new toy is a want.", nonexample: "Water is not a want; it is a need.", es: "deseo", es_note: "Want = deseo, or use 'querer' for the verb.", family: ["wants"], cue: "A toy robot, a balloon, and a video game." },
    { term: "shelter", tier: 2, pos: "noun", icon: "🏠", def: "a safe place to live, out of the weather", example: "A home gives us shelter.", nonexample: "An open field is not shelter.", es: "refugio", es_note: "Shelter = refugio or vivienda.", family: ["home"], cue: "A rowhouse with a door, a roof, and a light in the window." },
    { term: "clothing", tier: 2, pos: "noun", icon: "👕", def: "what we wear to stay covered and warm", example: "A coat is clothing for winter.", nonexample: "A table is not clothing.", es: "ropa", es_note: "Clothing = ropa.", family: ["clothes"], cue: "A coat, boots, and a shirt on a hook." },
    { term: "goods", tier: 3, pos: "noun", icon: "📦", def: "things people make or grow and sell", example: "A baker makes goods like bread.", nonexample: "A bus ride is a service, not goods.", es: "bienes", es_note: "Goods = bienes or productos. Not 'buenos', which means good.", family: ["good", "product"], cue: "A basket of bread and apples at a market stand." },
    { term: "service", tier: 3, pos: "noun", icon: "🚌", def: "work someone does to help other people", example: "A bus driver gives a service.", nonexample: "A loaf of bread is goods, not a service.", es: "servicio", es_note: "Cognate: servicio.", family: ["services"], cue: "A bus driver helping riders get to work." },
    { term: "worker", tier: 2, pos: "noun", icon: "👷", def: "a person who has a job", example: "A worker fixes the road.", nonexample: "A toy truck is not a worker.", es: "trabajador", es_note: "Worker = trabajador or trabajadora.", family: ["workers", "work"], cue: "A person in a hard hat with a road cone." },
    { term: "job", tier: 2, pos: "noun", icon: "💼", def: "the work a person does to earn money", example: "A nurse has a helpful job.", nonexample: "Playing a game for fun is not a job.", es: "trabajo", es_note: "Job = trabajo or empleo.", family: ["jobs"], cue: "A nurse, a baker, and a driver in uniform." },
    { term: "money", tier: 2, pos: "noun", icon: "💵", def: "coins and bills that people use to buy things", example: "People use money to buy food.", nonexample: "A leaf is not money.", es: "dinero", es_note: "Money = dinero.", family: ["coins", "dollars"], cue: "A hand holding coins and a dollar bill." },
  ],
  activities: [
    {
      kind: "dictogloss", domain: "Listening", title: "Bus Driver Day", minutes: 10, grouping: "Partners",
      mission: "Listen twice. Tell Dana's story back!",
      tip: "Read slowly twice; children point to the picture clues, then retell with a partner using so.",
      materials: ["Picture cards: bus, riders, money, food"],
      support: { l1_2: "Point to the picture cards as you hear each word.", l3_4: "Say one sentence about Dana and one about the riders.", l5_6: "Retell all the ideas and use the word so." },
      payload: {
        text: "Dana drives a city bus in Baltimore. People need a ride to work. So Dana gives them a ride. That is a service. Riders earn money at work. Then they buy food.",
        key_words: ["bus", "need", "ride", "service", "money", "food"],
        frame: "Dana drives a ___. People need a ___. So Dana gives a ___. That is a ___.",
        checks: ["Dana drives a city bus in Baltimore", "people need a ride to work", "Dana gives them a ride, which is a service", "riders earn money and buy food"],
      },
    },
    {
      kind: "match", domain: "Vocabulary", title: "Needs and Jobs Match", minutes: 8, grouping: "Solo",
      mission: "Match each word to its picture clue.",
      tip: "Have children say each word and show it with a gesture before they tap the match.",
      materials: [],
      support: { l1_2: "Match the picture words first.", l3_4: "Match all nine, then say a sentence for two.", l5_6: "Match all nine and add a new example to each." },
      payload: {
        left_label: "Word", right_label: "Picture clue",
        pairs: [
          { l: "need", r: "🍞 must have to live" },
          { l: "want", r: "🧸 nice to have" },
          { l: "shelter", r: "🏠 a safe place to live" },
          { l: "clothing", r: "👕 what we wear" },
          { l: "goods", r: "📦 things people make and sell" },
          { l: "service", r: "🚌 work that helps people" },
          { l: "worker", r: "👷 a person with a job" },
          { l: "job", r: "💼 work to earn money" },
          { l: "money", r: "💵 coins and bills" },
        ],
      },
    },
    {
      kind: "word_sort", domain: "Vocabulary", title: "Need or Want?", minutes: 8, grouping: "Partners",
      mission: "Sort each thing. Is it a need or a want?",
      tip: "Ask 'Can you live without it?' and listen for because when partners explain a sort.",
      materials: [],
      support: { l1_2: "Sort the pictures you know first.", l3_4: "Sort all words and say 'It is a ___ because ___.'", l5_6: "Sort all words, then add one new thing to each group." },
      payload: {
        categories: [{ name: "🍞 Need" }, { name: "🧸 Want" }],
        items: [
          { text: "water", cat: 0 }, { text: "bread", cat: 0 }, { text: "winter coat", cat: 0 }, { text: "a safe home", cat: 0 }, { text: "fruit", cat: 0 }, { text: "warm blanket", cat: 0 },
          { text: "video game", cat: 1 }, { text: "candy", cat: 1 }, { text: "toy robot", cat: 1 }, { text: "balloon", cat: 1 }, { text: "stickers", cat: 1 }, { text: "ice cream", cat: 1 },
        ],
      },
    },
    {
      kind: "clue_game", domain: "Game", title: "Who Helps Us?", minutes: 10, grouping: "Small Group",
      mission: "Open one clue at a time. Guess the neighborhood worker!",
      tip: "Fewer clues used means more points; there is no clock, so let children think.",
      materials: [],
      support: { l1_2: "Use the picture cards to help you guess.", l3_4: "Guess before you open the third clue.", l5_6: "Make up a fourth clue for one card." },
      payload: {
        cards: [
          { term: "baker", clues: ["I get up very early.", "I use an oven.", "I make bread and cakes."] },
          { term: "bus driver", clues: ["I drive many people.", "I stop at bus stops.", "I help people get to work."] },
          { term: "nurse", clues: ["I wear scrubs.", "I work with doctors.", "I help sick people feel better."] },
          { term: "firefighter", clues: ["I wear a helmet.", "I ride a big red truck.", "I put out fires."] },
          { term: "mail carrier", clues: ["I bring letters to your house.", "I walk or drive a route.", "I put mail in your box."] },
          { term: "grocer", clues: ["I work in a food store.", "I sell apples and milk.", "People pay me at the register."] },
        ],
      },
    },
    {
      kind: "talk_cards", domain: "Speaking", title: "Needs and Wants Talk", minutes: 10, grouping: "Partners",
      mission: "Pick a card. Tell your partner what you think.",
      tip: "Model one turn first; listen for need, want, and so.",
      materials: ["Picture talk cards"],
      support: { l1_2: "Point to a picture and say the first frame.", l3_4: "Say the frame and add a reason.", l5_6: "Say the need, the worker, and how they help with so." },
      payload: {
        roles: { a: "Speaker", b: "Listener" },
        cards: [
          { prompt: "Name something you need to live.", starter: "I need ___.", follow_up: "Who helps you get it?" },
          { prompt: "Name something you want but do not need.", starter: "I want ___.", follow_up: "Can you live without it?" },
          { prompt: "What does a baker do?", starter: "The baker ___.", follow_up: "Is bread a good or a service?" },
          { prompt: "What does a bus driver do?", starter: "A bus driver ___.", follow_up: "Is that a good or a service?" },
          { prompt: "People need food. Who helps?", starter: "People need food, so ___.", follow_up: "How does that worker help?" },
          { prompt: "What job would you like to do?", starter: "I want to be a ___ because ___.", follow_up: "Who would you help?" },
        ],
        moves: [
          { label: "Say more", stem: "Tell me more about ___." },
          { label: "Show me", stem: "Can you act out the job?" },
          { label: "Me too", stem: "I also ___." },
        ],
      },
    },
    {
      kind: "info_gap", domain: "Speaking", title: "Job Swap Cards", minutes: 10, grouping: "Partners",
      mission: "Ask your partner questions to learn about two jobs.",
      tip: "Partners keep cards hidden and ask and answer aloud.",
      materials: ["Job cards A and B"],
      support: { l1_2: "Use the ask frame word for word and point to pictures.", l3_4: "Ask in your own words, then say the answer back.", l5_6: "Ask a follow-up question, like 'Who needs that?'" },
      payload: {
        goal: "Find out what the baker and the nurse do and what they give.",
        a: { title: "Worker A", has: [{ k: "Baker's work", v: "makes bread" }, { k: "Baker gives", v: "a good" }], needs: ["Nurse's work", "Nurse gives"] },
        b: { title: "Worker B", has: [{ k: "Nurse's work", v: "helps sick people" }, { k: "Nurse gives", v: "a service" }], needs: ["Baker's work", "Baker gives"] },
        ask_frames: ["What is the ___'s work?", "What does the ___ give?"],
        tell_frames: ["The work is ___.", "I am not sure. Let me look again."],
      },
    },
    {
      kind: "read_annotate", domain: "Reading", title: "Market Day Jobs", minutes: 10, grouping: "Whole Class",
      mission: "Listen to Rosa's story. Find the needs, wants, and jobs!",
      tip: "Read aloud twice; children circle needs and wants and underline goods and services on a big chart.",
      materials: ["Big chart paper"],
      support: { l1_2: "Find only the need and want words.", l3_4: "Find needs and wants and a good and a service.", l5_6: "Find all, then write one new sentence about Rosa." },
      payload: {
        text: "Rosa goes to the market. She needs milk. The grocer sells milk. That is a good. Rosa also wants a toy. The toy is a want, not a need. A guard helps kids cross the street. That is a service.",
        marks: [
          { label: "Needs and wants", instruction: "Circle the need and the want.", targets: ["needs milk", "wants a toy"] },
          { label: "Goods and services", instruction: "Underline the good and the service.", targets: ["That is a good", "That is a service"] },
        ],
        questions: [
          { q: "What does Rosa need?", options: ["A toy", "Milk", "A guard"], answer: 1, why: "The story says Rosa needs milk." },
          { q: "Why is the toy a want?", options: ["She cannot live without it", "She can live without it", "It costs too much"], answer: 1, why: "A want is something nice to have, but you can live without it." },
          { q: "What does the guard give?", options: ["A good", "A toy", "A service"], answer: 2, why: "A guard helps kids cross the street. That is a service." },
        ],
      },
    },
    {
      kind: "unscramble", domain: "Game", title: "Build a Cause Sentence", minutes: 8, grouping: "Partners",
      mission: "Put the pieces in order to build a sentence.",
      tip: "Ask which piece starts with a capital letter and how children know.",
      materials: [],
      support: { l1_2: "Look for the capital letter first.", l3_4: "Find the piece that ends the sentence.", l5_6: "After building, add so and a worker who helps." },
      payload: {
        items: [
          { parts: ["We need", "water", "to live."] },
          { parts: ["The nurse", "helps", "sick people."] },
          { parts: ["The baker", "makes", "bread."] },
          { parts: ["I want", "a toy,", "but I need shoes."] },
          { parts: ["A bus driver", "gives", "rides."] },
        ],
      },
    },
    {
      kind: "cloze", domain: "Reading", title: "City Worker Gaps", minutes: 8, grouping: "Solo",
      mission: "Pick the right word for each gap.",
      tip: "Two bank words are extras; children must decide which ones do not fit.",
      materials: [],
      support: { l1_2: "Look at the picture clue in each sentence.", l3_4: "Fill the gaps, then read the story aloud.", l5_6: "Fill the gaps, then write one more sentence." },
      payload: {
        text: "People {1} food to live. The grocer sells food. That is a {2}. The bus driver gives rides. That is a {3}. A toy is a {4}.",
        answers: ["need", "good", "service", "want"],
        bank: ["need", "good", "service", "want", "worker", "shelter"],
      },
    },
    {
      kind: "error_analysis", domain: "Reading", title: "Fix the Sentence", minutes: 8, grouping: "Partners",
      mission: "Find the mistake. Pick the best fix!",
      tip: "Read each wrong sentence aloud and ask which word is not true about needs, wants, goods, or services.",
      materials: [],
      support: { l1_2: "Look at the picture and pick the fix that matches.", l3_4: "Pick the fix and say why the wrong one does not work.", l5_6: "Pick the fix, then write your own correct sentence." },
      payload: {
        items: [
          { wrong: "A toy is a need because we cannot live without it.", options: ["A toy is a want because we can live without it.", "A toy is a need because it is fun.", "A toy is a service because it is made."], answer: 0, why: "We can live without a toy, so it is a want." },
          { wrong: "A baker gives a service by making bread.", options: ["A baker gives a service by driving a bus.", "A baker gives goods by making bread.", "A baker gives money by making bread."], answer: 1, why: "Bread is something made and sold, so it is goods." },
          { wrong: "People need food, but the grocer sells apples.", options: ["People need food, but the grocer sells toys.", "People need food, so the grocer sells apples.", "People want food, so the grocer sells apples."], answer: 1, why: "The grocer sells apples because people need food. So shows that cause and effect." },
          { wrong: "A nurse gives goods to sick people.", options: ["A nurse gives a service to sick people.", "A nurse gives bread to sick people.", "A nurse gives money to sick people."], answer: 0, why: "A nurse helps people with work, so it is a service." },
        ],
      },
    },
    {
      kind: "sentence_combine", domain: "Writing", title: "Cause and So", minutes: 10, grouping: "Partners",
      mission: "Join two short sentences with the joining word.",
      tip: "Say both sentences, then the joined one. More than one answer can work.",
      materials: [],
      support: { l1_2: "Copy the model and change one word.", l3_4: "Join the sentences and read them aloud.", l5_6: "Join them, then write a new sentence with the same joining word." },
      payload: {
        items: [
          { sentences: ["People need food.", "The grocer sells apples."], connector: "so", model: "People need food, so the grocer sells apples." },
          { sentences: ["People need a ride.", "The bus driver gives rides."], connector: "so", model: "People need a ride, so the bus driver gives rides." },
          { sentences: ["The nurse helps people.", "The nurse has a job."], connector: "and", model: "The nurse helps people and the nurse has a job." },
          { sentences: ["I need shoes.", "My feet get cold."], connector: "because", model: "I need shoes because my feet get cold." },
        ],
      },
    },
    {
      kind: "write_scaffold", domain: "Writing", title: "My Helper Job Page", minutes: 15, grouping: "Solo",
      mission: "Draw a neighborhood worker. Write how they help.",
      tip: "Children draw first, then dictate or write; accept labeled drawings for emerging writers.",
      materials: ["Crayons", "Job page template"],
      support: { l1_2: "Draw it. Copy the first frame and label your picture.", l3_4: "Write the need and how the worker helps.", l5_6: "Write the need, the worker, and a good or service with so." },
      payload: {
        prompt: "Pick a worker in your neighborhood. Draw the worker. Write what people need and how the worker helps.",
        structure: [
          { part: "The need", frame: "People need [food / a ride / care]." },
          { part: "The worker", frame: "The [worker] helps by [action]." },
          { part: "Good or service", frame: "That is a [good / service]." },
        ],
        word_bank: ["need", "want", "worker", "job", "goods", "service", "money", "baker", "bus driver", "nurse", "so", "because"],
        checklist: ["I drew my worker.", "I wrote what people need.", "I wrote how the worker helps.", "I used the word so."],
        model: "People need food, so the baker makes bread. The baker sells it to families. That is a good.",
      },
    },
  ],
  exit_ticket: {
    prompt: "Pick one worker. Tell what people need and how the worker helps. Use so.",
    frame: "People need [need], so the [worker] [action].",
    model: "People need a ride, so the bus driver gives rides.",
    rubric: {
      emerging: "Points to a worker picture and says the job word.",
      developing: "Uses the frame to name a need and what the worker does.",
      proficient: "Says the need, uses so, and tells whether the worker gives a good or a service.",
    },
  },
  watchouts: [
    { group: "Spanish speakers", issue: "'Goods' and 'good' sound the same, but goods are things and good means nice, so children may confuse them.", fix: "Pair goods with a picture of a basket of bread and teach 'a good' as one item that people buy." },
    { group: "All multilingual learners", issue: "Children list a need but skip the worker, so the cause and effect is missing.", fix: "Use the frame 'People need ___, so the ___' and have children point to the need and then the worker." },
  ],
  misconception: {
    pattern: "Children say that wants are bad, or that a toy is a need because they love it.",
    redirect: "Ask 'Can you live without it?' and explain that wants are okay to have, but needs come first.",
  },
};
