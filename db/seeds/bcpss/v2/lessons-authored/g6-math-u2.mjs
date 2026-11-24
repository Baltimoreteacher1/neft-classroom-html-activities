// BCPSS Language Studio v2 lesson companions: Grade 6 Math, unit g6-math-u2 (8 authored lessons).

const exit1 = {
        kind: "exit_check",
        domain: "Reading",
        title: "Ratio Order Check",
        mission: "Answer three questions about buses, fruit and classrooms, then rate how well you can describe a ratio in order.",
        grouping: "Solo",
        minutes: 3,
        tip: "Collect the can-do ratings and plan to meet the students who choose “with help” at the next small-group time.",
        support: {
          l1_2: "Listen to each question with the audio button, then tap an answer.",
          l3_4: "Read each question, tap an answer, and read the reason.",
          l5_6: "Answer, read the reason, and fix any mistake before you rate yourself.",
        },
        payload: {
          can_do: "I can describe a ratio in order using “for every” and “to”.",
          items: [
            {
              q: "A bus has 9 students and 3 teachers. Which sentence is correct?",
              options: ["The ratio of students to teachers is 9 to 3.", "The ratio of students to teachers is 3 to 9.", "The ratio of students to teachers is 9 to 12."],
              answer: 0,
              why: "Students come first in the question, so 9 goes first. 3 to 9 flips the order, and 9 to 12 compares students to everyone on the bus.",
            },
            {
              q: "A fruit stand has 2 oranges for every 5 apples. What is the ratio of apples to oranges?",
              options: ["2 to 5", "5 to 2", "5 to 7"],
              answer: 1,
              why: "Apples are named first, so 5 comes first: 5 to 2. 2 to 5 is oranges to apples, and 5 to 7 compares apples to all the fruit.",
            },
            {
              q: "In a class, 6 students walk to school and 10 students ride the bus. What is the ratio of walkers to all students?",
              options: ["6 to 10", "10 to 16", "6 to 16"],
              answer: 2,
              why: "All students means 6 + 10 = 16, and walkers are named first, so the ratio is 6 to 16. 6 to 10 compares walkers to bus riders only, not to all students.",
            },
          ],
        },
      };

const lesson1 = {
  id: "g6-math-u2-l01",
  unit_id: "g6-math-u2",
  version: 1,
  sequence: 1,
  source: "authored",
  title: "Describe a ratio with “for every” and “to”",
  core_lesson_ref: { label: "Language session 1: ratio language", source: "language_pathway" },
  content_objective:
    "Students describe a ratio relationship between two quantities in order, using “for every” and “to,” and tell a part-to-part ratio from a part-to-whole ratio.",
  language_objective: {
    klu: "Inform",
    function: "describe a ratio by saying both amounts in the same order as the words",
    forms: ["For every [number] [thing A], there are [number] [thing B].", "The ratio of [thing A] to [thing B] is [number] to [number]."],
    by_level: {
      l1_2: "I can point to a picture and say “For every 4 tomato plants, there are 7 pepper plants” with a frame.",
      l3_4: "I can say the same ratio with “for every” and with “to” and keep the amounts in order.",
      l5_6: "I can explain how swapping the names changes the ratio and tell a part-to-part ratio from a part-to-whole ratio.",
    },
  },
  standards: ["6.RP.A.1"],
  wida: { framework: "2020", language_expectation: "Math.6-8.Inform.Expressive", pld_targets: ["sentence", "word"] },
  vocab: [
    { term: "ratio", tier: 3, new_or_review: "new" },
    { term: "for every", tier: 2, new_or_review: "new" },
    { term: "order", tier: 2, new_or_review: "new" },
    { term: "compare", tier: 2, new_or_review: "review" },
  ],
  mentor_sentence: {
    text: "For every 4 tomato plants in the garden, there are 7 pepper plants, so the ratio of tomato plants to pepper plants is 4 to 7.",
    chunks: [
      { text: "For every 4 tomato plants in the garden,", role: "The first amount", tone: "concept", ask: "Which amount is named first, and how many are there?" },
      { text: "there are 7 pepper plants,", role: "The second amount", tone: "precision", ask: "How many pepper plants go with those 4 tomato plants?" },
      { text: "so", role: "The summary signal", tone: "connector", ask: "Which word tells you the name of the ratio is coming?" },
      { text: "the ratio of tomato plants to pepper plants is 4 to 7.", role: "The ratio in order", tone: "evidence", ask: "Why does 4 come before 7 in this ratio?" },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Garden Flip Cards",
        mission: "Flip each card to check what you remember about comparing amounts before you meet the garden ratios.",
        grouping: "Partners",
        minutes: 4,
        tip: "Partners quiz each other, and a missed card simply goes back into the pile for another try.",
        support: {
          l1_2: "Point to the icon on the card, say the answer, then flip to check.",
          l3_4: "Answer in a full sentence before you flip the card.",
          l5_6: "Answer, flip, and then make up a new example with different numbers.",
        },
        payload: {
          cards: [
            { prompt: "What does it mean to compare two amounts?", answer: "You look at how the two amounts are alike or different, such as 4 tomato plants and 7 pepper plants.", icon: "⚖️" },
            { prompt: "A garden has 4 tomato plants and 7 pepper plants. How many plants are there in all?", answer: "There are 11 plants in all, because 4 + 7 = 11.", icon: "🍅" },
            { prompt: "What does “each” mean in “Each bed has 3 plants”?", answer: "Every single bed has 3 plants.", icon: "🪴" },
            { prompt: "Why does order matter when you say “first the tomatoes, then the peppers”?", answer: "The first name goes with the first number, and the second name goes with the second number.", icon: "🔢" },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "Garden Listen and Tap",
        mission: "Listen to each sentence about the Druid Hill Park garden and tap the ratio it describes, in the right order.",
        grouping: "Solo",
        minutes: 5,
        tip: "Play each sentence twice and let students see the words only after the first listen.",
        support: {
          l1_2: "Listen once, tap, then listen again with the words showing.",
          l3_4: "Tap, then say the sentence back to a partner.",
          l5_6: "Tap, then tell your partner which word in the sentence helped you choose.",
        },
        payload: {
          items: [
            {
              say: "In the garden there are 4 tomato plants and 7 pepper plants. What is the ratio of tomato plants to pepper plants?",
              options: [{ label: "4 to 7", icon: "🍅" }, { label: "7 to 4" }, { label: "4 to 11" }],
              answer: 0,
              why: "Tomato plants are named first, so the ratio starts with 4. The ratio of tomato plants to pepper plants is 4 to 7.",
            },
            {
              say: "Now say the ratio of pepper plants to tomato plants for the same garden.",
              options: [{ label: "4 to 7" }, { label: "7 to 4", icon: "🌶️" }, { label: "7 to 11" }],
              answer: 1,
              why: "Pepper plants come first now, so 7 comes first. Changing the order of the names changes the order of the numbers.",
            },
            {
              say: "There are 11 plants in all. What is the ratio of tomato plants to all of the plants?",
              options: [{ label: "4 to 7" }, { label: "7 to 11" }, { label: "4 to 11" }],
              answer: 2,
              why: "All of the plants means the whole garden, 4 + 7 = 11. Tomato plants to all plants is 4 to 11.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 4,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Ratio Sentence X-Ray",
        mission: "Look inside the garden sentence that starts “For every 4 tomato plants” and rebuild its chunks in order.",
        grouping: "Whole Class",
        minutes: 4,
        tip: "Have students point to each name and its number before they drag the chunks back together.",
        support: {
          l1_2: "Tap each colored chunk and listen to it.",
          l3_4: "Rebuild the sentence, then say the job of each chunk.",
          l5_6: "Rebuild it, then write a new sentence about 3 bean plants and 5 squash plants with the same chunks.",
        },
        payload: {
          text: "For every 4 tomato plants in the garden, there are 7 pepper plants, so the ratio of tomato plants to pepper plants is 4 to 7.",
          chunks: [
            { text: "For every 4 tomato plants in the garden,", role: "The first amount", tone: "concept" },
            { text: "there are 7 pepper plants,", role: "The second amount", tone: "precision" },
            { text: "so", role: "The summary signal", tone: "connector" },
            { text: "the ratio of tomato plants to pepper plants is 4 to 7.", role: "The ratio in order", tone: "evidence" },
          ],
          ask: "Which chunk tells you the first amount, and how many of it there are?",
        },
      },
    },
    {
      step: "interact",
      minutes: 7,
      activity: {
        kind: "info_gap",
        domain: "Speaking",
        title: "Garden Bed Secrets",
        mission: "Each of you knows the plant counts for one garden bed and the ratio for the other, so ask questions until both beds are complete and every ratio matches its counts.",
        grouping: "Partners",
        minutes: 7,
        tip: "Partners keep their cards hidden and check that each ratio names the amounts in the same order as the counts.",
        materials: ["Garden bed cards A and B"],
        support: {
          l1_2: "Use the ask frames word for word and point to the numbers on your card.",
          l3_4: "Ask in your own words, then repeat the numbers back to your partner.",
          l5_6: "After you finish, flip each ratio and explain why it is a different ratio.",
        },
        payload: {
          goal: "Find every missing fact about Bed 1 and Bed 2 in the Druid Hill Park garden, then check that each ratio matches its plant counts, in order.",
          a: {
            title: "Partner A",
            has: [
              { k: "Bed 1 plant counts", v: "4 tomato plants and 7 pepper plants" },
              { k: "Bed 2 ratio of bean plants to squash plants", v: "5 to 8" },
            ],
            needs: ["Bed 2 plant counts", "Bed 1 ratio of tomato plants to pepper plants"],
          },
          b: {
            title: "Partner B",
            has: [
              { k: "Bed 2 plant counts", v: "5 bean plants and 8 squash plants" },
              { k: "Bed 1 ratio of tomato plants to pepper plants", v: "4 to 7" },
            ],
            needs: ["Bed 1 plant counts", "Bed 2 ratio of bean plants to squash plants"],
          },
          ask_frames: ["What are the plant counts in ___?", "What is the ratio of ___ to ___ in ___?", "Can you say that again, in order, please?"],
          tell_frames: ["In ___, there are ___ ___ and ___ ___.", "The ratio of ___ to ___ in ___ is ___ to ___.", "I am not sure. Let me look at my card again."],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Say the Ratio Both Ways",
        mission: "Record yourself saying the ratio of bean plants to squash plants in Bed 2, then flip the order and listen back.",
        grouping: "Solo",
        minutes: 5,
        klu: "Inform",
        tip: "Recordings stay on the student's device, so ask a partner to listen for the order of the numbers.",
        support: {
          l1_2: "Say one sentence with the frame and point to each number as you say it.",
          l3_4: "Say the ratio with “for every” and again with “to”.",
          l5_6: "Say both orders, then explain why 5 to 8 and 8 to 5 are not the same ratio.",
        },
        payload: {
          prompt: "Bed 2 has 5 bean plants and 8 squash plants. Say the ratio of bean plants to squash plants, then say the ratio of squash plants to bean plants.",
          frame: "For every ___ bean plants, there are ___ squash plants, so the ratio of bean plants to squash plants is ___ to ___.",
          model:
            "For every 5 bean plants, there are 8 squash plants, so the ratio of bean plants to squash plants is 5 to 8. The ratio of squash plants to bean plants is 8 to 5, because the order of the names changed.",
          checklist: ["I said the numbers in the same order as the names.", "I used “for every” and “to”.", "I said the flipped ratio as a different ratio."],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit1,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Vocabulary",
      title: "Point and Say the Garden",
      mission: "Point to the tomato plants and pepper plants in each picture, say the word, then say its sentence about the garden.",
      grouping: "Partners",
      minutes: 5,
      tip: "No reading is needed, so show each picture cue, say the word, and let the student repeat it.",
      support: {
        l1_2: "Point and say one word at a time with your partner.",
        l3_4: "Point, say the word, and say the whole sentence.",
        l5_6: "Say the sentence, then change the numbers to make your own.",
      },
      payload: {
        items: [
          { term: "ratio", icon: "⚖️", cue: "Two groups side by side: 4 tomato plants on the left and 7 pepper plants on the right.", say: "A ratio compares two groups.", es: "razón" },
          { term: "for every", icon: "🔗", cue: "A finger touches 1 tomato plant, then moves to the pepper plants that go with it.", say: "For every 4 tomato plants, there are 7 pepper plants.", es: "por cada" },
          { term: "order", icon: "🔢", cue: "Two cards, tomato first and pepper second, and then the cards swap places.", say: "The first name goes with the first number.", es: "orden" },
          { term: "in all", icon: "🧺", cue: "A circle is drawn around all 11 plants together.", say: "There are 11 plants in all.", es: "en total" },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Cubes in Order",
      mission: "Listen to each command and show it with your red and blue cubes.",
      grouping: "Whole Class",
      minutes: 4,
      tip: "Model each action with the cubes first, then give the command again without modeling.",
      support: {
        l1_2: "Copy the action with a partner.",
        l3_4: "Do the action on your own.",
        l5_6: "Give the command to a partner and check the cubes.",
      },
      payload: {
        items: [
          { command: "Put 4 red cubes on the left side of your desk.", icon: "🔴" },
          { command: "Put 7 blue cubes on the right side of your desk.", icon: "🔵" },
          { command: "Point to the red cubes first. Then point to the blue cubes.", icon: "👉" },
          { command: "Now switch the order. Point to the blue cubes first.", icon: "🔄" },
          { command: "Push all of the cubes together and count them.", icon: "🤲" },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Ratio",
      mission: "Say ratio, for every and order in English and in your home language, then tell a partner how the garden words match.",
      grouping: "Partners",
      minutes: 4,
      tip: "Invite students to add the word in any language they know, since the Spanish glosses are teacher-reviewed drafts.",
      support: {
        l1_2: "Say both words with your partner.",
        l3_4: "Say both words and tell one way they are alike or different.",
        l5_6: "Use both words in a sentence in each language.",
      },
      payload: {
        items: [
          { term: "ratio", es: "razón", note: "Same word as “reason” in Spanish. In math, razón names the comparison of two amounts, and “because” gives the reason." },
          { term: "for every", es: "por cada", note: "Say it the same way in both languages: por cada 4 plantas de tomate, 7 plantas de pimiento." },
          { term: "order", es: "orden", note: "A cognate. The order of the words matches the order of the numbers." },
        ],
      },
    },
  ],
  extension: {
    kind: "write_scaffold",
    domain: "Writing",
    title: "Marigold Bed Report",
    mission: "Write about a new bed with sunflowers and marigolds: say the ratio, flip it, and compare the sunflowers to all of the plants.",
    grouping: "Solo",
    minutes: 8,
    klu: "Inform",
    tip: "Score with the checklist, because the model is a target and not a script.",
    support: {
      l1_2: "Use the frame for each part and write the numbers first.",
      l3_4: "Write all three parts and use “because” once.",
      l5_6: "Write all three parts, add a sentence that explains the difference between 6 to 9 and 6 to 15.",
    },
    payload: {
      prompt: "A new bed has 6 sunflower plants and 9 marigold plants. Write about the ratio of sunflower plants to marigold plants, flip the order, and then compare the sunflower plants to all of the plants.",
      structure: [
        { part: "Ratio", frame: "For every ___ sunflower plants, there are ___ marigold plants." },
        { part: "Flip", frame: "The ratio of marigold plants to sunflower plants is ___ to ___ because ___." },
        { part: "Whole", frame: "There are ___ plants in all, so the ratio of sunflower plants to all plants is ___ to ___." },
      ],
      word_bank: ["ratio", "for every", "to", "in all", "order", "sunflower", "marigold", "because"],
      checklist: ["I used “for every” to pair the two amounts.", "I flipped the ratio and changed the order of the numbers.", "I found the total and used it in a part-to-whole ratio.", "I wrote the numbers in the same order as the names."],
      model:
        "For every 6 sunflower plants, there are 9 marigold plants. The ratio of marigold plants to sunflower plants is 9 to 6 because the marigold plants are named first now. There are 15 plants in all, so the ratio of sunflower plants to all plants is 6 to 15.",
    },
  },
  exit_check: exit1,
  teacher_card: {
    minutes: 25,
    materials: ["Red and blue cubes or counters, 7 of each for every pair", "Two index cards per pair labeled tomato and pepper", "Whiteboards or sticky notes", "Device with sound for each pair"],
    listen_for: [
      "Students say both amounts in the order the question names them.",
      "Students use “for every” to pair one amount with the other.",
      "Students change 4 to 7 into 7 to 4 when the order of the names changes.",
    ],
    watchouts: [
      "Flipped order: students write 7 to 4 for tomato plants to pepper plants because 7 is the bigger number, so have them touch each name as they say its number.",
      "Part-to-part and part-to-whole both start with 4, so students mix up 4 to 7 and 4 to 11. Ask whether the second amount is one group or everything.",
      "Spanish speakers may hear “razón” as both ratio and reason, and Haitian Creole or French speakers may say “pou chak” or “pour chaque” and leave out “there are”. Accept the meaning, then model the full frame.",
    ],
    differentiation: {
      l1_2: "Use cubes, the garden picture, and the frame “For every ___ ___, there are ___ ___.”",
      l3_4: "Say each ratio with “for every” and with “to,” then flip it and say the new ratio.",
      l5_6: "Explain what changes and what stays the same when the names swap, and name the part-to-whole ratio.",
      newcomer: "Use Point and Say, Cubes in Order and the Home Language Bridge, and accept pointing, cube models and home-language answers.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

const exit2 = {
  kind: "exit_check",
  domain: "Writing",
  title: "Because Check",
  mission:
    "Answer three questions about equivalent ratios, then rate how well you can explain why two ratios match.",
  grouping: "Solo",
  minutes: 3,
  tip: "Collect the can-do ratings and note which students still pick the adding answers for the next small-group time.",
  support: {
    l1_2: "Listen to each question with the audio button, then tap an answer.",
    l3_4: "Read each question, tap an answer, and read the reason.",
    l5_6: "Answer, read the reason, and rewrite one wrong choice so it becomes true.",
  },
  payload: {
    can_do: "I can explain why two ratios are equivalent using “because”.",
    items: [
      {
        q: "Which ratio is equivalent to 3 to 5?",
        options: ["6 to 8", "6 to 10", "5 to 3"],
        answer: 1,
        why: "3 × 2 = 6 and 5 × 2 = 10, so both numbers were doubled. 6 to 8 adds 3 to each number, and 5 to 3 flips the order.",
      },
      {
        q: "Which sentence explains why 9 to 15 is equivalent to 3 to 5?",
        options: [
          "Both numbers got bigger, so the ratios match.",
          "The first number was multiplied by 3 and the second number was multiplied by 5.",
          "Both numbers were multiplied by 3 because 3 × 3 = 9 and 5 × 3 = 15.",
        ],
        answer: 2,
        why: "Equivalent ratios need the same multiplier for both numbers: 3 × 3 = 9 and 5 × 3 = 15. “Bigger” is not a reason, and using 3 and 5 as different multipliers would make 9 to 25.",
      },
      {
        q: "Zoe says 4 to 5 is equivalent to 2 to 3 because both numbers went up by 2. What is the best response?",
        options: [
          "Adding 2 to each number does not keep the relationship. Multiply both numbers by 2 to get 4 to 6.",
          "Zoe is right, because both numbers changed by the same amount.",
          "Zoe is wrong because 4 to 5 is smaller than 2 to 3.",
        ],
        answer: 0,
        why: "Equivalent ratios come from multiplying or dividing both numbers by the same amount, not from adding. 2 × 2 = 4 and 3 × 2 = 6.",
      },
    ],
  },
};

const lesson2 = {
  id: "g6-math-u2-l02",
  unit_id: "g6-math-u2",
  version: 1,
  sequence: 2,
  source: "authored",
  title: "Explain why two ratios are equivalent",
  core_lesson_ref: {
    label: "Language session 2: equivalent ratios",
    source: "language_pathway",
  },
  content_objective:
    "Students build equivalent ratios by multiplying or dividing both numbers by the same amount, and explain why 2 to 3 and 4 to 6 match while adding the same number to both parts does not.",
  language_objective: {
    klu: "Explain",
    function: "explain why two ratios are equivalent with a because sentence",
    forms: [
      "[Ratio A] and [Ratio B] are equivalent because both numbers were multiplied by [number].",
      "Since [reason], [conclusion].",
    ],
    by_level: {
      l1_2: "I can say “4 to 6 and 2 to 3 are equivalent” and finish “because both numbers were multiplied by ___” with a word bank.",
      l3_4: "I can name the number I multiplied by and show the multiplication for both parts in a because sentence.",
      l5_6: "I can explain why adding the same number to both parts does not make an equivalent ratio and prove it with a correct example.",
    },
  },
  standards: ["6.RP.A.3", "6.RP.A.3a"],
  wida: {
    framework: "2020",
    language_expectation: "Math.6-8.Explain.Expressive",
    pld_targets: ["discourse", "sentence"],
  },
  vocab: [
    { term: "equivalent ratio", tier: 3, new_or_review: "new" },
    { term: "multiply", tier: 2, new_or_review: "new" },
    { term: "both", tier: 2, new_or_review: "new" },
    { term: "because", tier: 2, new_or_review: "new" },
    { term: "ratio", tier: 3, new_or_review: "review" },
  ],
  mentor_sentence: {
    text: "Since 2 liters of juice go with 3 liters of water, 6 liters of juice go with 9 liters of water because both numbers were multiplied by 3.",
    chunks: [
      {
        text: "Since 2 liters of juice go with 3 liters of water,",
        role: "The starting ratio",
        tone: "concept",
        ask: "Which two amounts go together in the first recipe?",
      },
      {
        text: "6 liters of juice go with 9 liters of water",
        role: "The equivalent ratio",
        tone: "precision",
        ask: "What are the two new numbers?",
      },
      {
        text: "because",
        role: "The reason signal",
        tone: "connector",
        ask: "Which word tells you the proof is coming?",
      },
      {
        text: "both numbers were multiplied by 3.",
        role: "The proof",
        tone: "evidence",
        ask: "What happened to 2 and to 3?",
      },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Cube Ratio Flip Cards",
        mission:
          "Flip each card to check how you say a ratio in order and how you multiply, before you build equivalent ratios.",
        grouping: "Partners",
        minutes: 4,
        tip: "Partners quiz each other, and any missed card goes back into the pile for another round.",
        support: {
          l1_2: "Point to the icon, say the answer, then flip to check.",
          l3_4: "Answer in a full sentence before you flip the card.",
          l5_6: "Answer, flip, and then change the numbers to make a new question for your partner.",
        },
        payload: {
          cards: [
            {
              prompt: "Say the ratio of 4 red cubes to 7 blue cubes.",
              answer:
                "4 to 7. The red cubes are named first, so 4 comes first.",
              icon: "🔴",
            },
            {
              prompt: "What is the ratio of 7 blue cubes to 4 red cubes?",
              answer:
                "7 to 4. The order of the numbers follows the order of the names.",
              icon: "🔵",
            },
            {
              prompt: "What is 3 × 4, and what is 2 × 4?",
              answer: "3 × 4 = 12 and 2 × 4 = 8.",
              icon: "✖️",
            },
            {
              prompt:
                "What does “for every” tell you about 2 liters of juice and 3 liters of water?",
              answer:
                "For every 2 liters of juice, you use 3 liters of water, so the two amounts always go together.",
              icon: "🧃",
            },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "Punch Batch Listen and Tap",
        mission:
          "Listen to Marcus plan his block party punch and tap the batch or the reason that matches what you hear.",
        grouping: "Solo",
        minutes: 5,
        tip: "Play each sentence twice and let students see the words only after the first listen.",
        support: {
          l1_2: "Listen once, tap, then listen again with the words showing.",
          l3_4: "Tap, then say the whole sentence back to a partner.",
          l5_6: "Tap, then explain to a partner why one wrong choice does not work.",
        },
        payload: {
          items: [
            {
              say: "A punch recipe uses 2 liters of juice for every 3 liters of water. Marcus makes 2 batches. How much juice and water does he need?",
              options: [
                {
                  label: "4 liters of juice and 6 liters of water",
                  icon: "🧃",
                },
                { label: "4 liters of juice and 5 liters of water" },
                { label: "2 liters of juice and 6 liters of water" },
              ],
              answer: 0,
              why: "Two batches means both amounts are doubled: 2 × 2 = 4 and 3 × 2 = 6. Adding 2 to each amount gives 4 and 5, and that is not two batches.",
            },
            {
              say: "Marcus wants a bigger batch, so he multiplies both numbers by 5. Which ratio of juice to water matches 2 to 3?",
              options: [
                { label: "7 to 8" },
                { label: "10 to 15", icon: "✖️" },
                { label: "15 to 10" },
              ],
              answer: 1,
              why: "2 × 5 = 10 and 3 × 5 = 15, so 10 to 15 keeps the same relationship. 7 to 8 comes from adding 5, and 15 to 10 flips the order.",
            },
            {
              say: "Which sentence explains why 4 to 6 is equivalent to 2 to 3?",
              options: [
                { label: "Both numbers went up by 2." },
                { label: "Only the first number was doubled." },
                { label: "Both numbers were multiplied by 2." },
              ],
              answer: 2,
              why: "2 × 2 = 4 and 3 × 2 = 6, so both numbers changed by the same multiplication. Going up by 2 would make 4 to 5.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 4,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Because Sentence X-Ray",
        mission:
          "Look inside the sentence that starts “Since 2 liters of juice go with 3 liters of water” and rebuild its chunks in order.",
        grouping: "Whole Class",
        minutes: 4,
        tip: "Ask students to circle the word because and say what kind of chunk follows it.",
        support: {
          l1_2: "Tap each colored chunk and listen to it.",
          l3_4: "Rebuild the sentence, then say the job of each chunk.",
          l5_6: "Rebuild it, then write a new sentence about 3 cups of rice and 4 cups of water using the same chunks.",
        },
        payload: {
          text: "Since 2 liters of juice go with 3 liters of water, 6 liters of juice go with 9 liters of water because both numbers were multiplied by 3.",
          chunks: [
            {
              text: "Since 2 liters of juice go with 3 liters of water,",
              role: "The starting ratio",
              tone: "concept",
            },
            {
              text: "6 liters of juice go with 9 liters of water",
              role: "The equivalent ratio",
              tone: "precision",
            },
            { text: "because", role: "The reason signal", tone: "connector" },
            {
              text: "both numbers were multiplied by 3.",
              role: "The proof",
              tone: "evidence",
            },
          ],
          ask: "Which chunk is the proof, and what did the speaker do to both numbers?",
        },
      },
    },
    {
      step: "interact",
      minutes: 7,
      activity: {
        kind: "word_sort",
        domain: "Vocabulary",
        title: "Equivalent or Not?",
        mission:
          "Sort each ratio by whether it is equivalent to 2 to 3, and if it is not, by the slip that made it, then defend one choice to your partner.",
        grouping: "Partners",
        minutes: 7,
        tip: "Listen for “because both numbers were multiplied by” when partners defend a ratio that belongs in the first group.",
        support: {
          l1_2: "Sort the ratios you can multiply in your head first, then say “I put ___ here.”",
          l3_4: "Sort all of them and say “I put ___ here because ___.”",
          l5_6: "Sort all of them, then write one new ratio for each group.",
        },
        payload: {
          categories: [
            { name: "Equivalent to 2 to 3" },
            { name: "Not equivalent: the same number was added" },
            { name: "Not equivalent: the order was flipped" },
          ],
          items: [
            { text: "4 to 6", cat: 0 },
            { text: "6 to 9", cat: 0 },
            { text: "8 to 12", cat: 0 },
            { text: "10 to 15", cat: 0 },
            { text: "4 to 5", cat: 1 },
            { text: "5 to 6", cat: 1 },
            { text: "3 to 4", cat: 1 },
            { text: "12 to 13", cat: 1 },
            { text: "3 to 2", cat: 2 },
            { text: "6 to 4", cat: 2 },
            { text: "9 to 6", cat: 2 },
            { text: "15 to 10", cat: 2 },
          ],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Prove It Out Loud",
        mission:
          "Record yourself telling your partner why 4 to 6 and 2 to 3 are equivalent, using the word because.",
        grouping: "Solo",
        minutes: 5,
        klu: "Explain",
        tip: "Recordings stay on the student's device, so ask a partner to listen for the multiplier in the because sentence.",
        support: {
          l1_2: "Say one sentence with the frame and the word bank.",
          l3_4: "Say the frame, then add the multiplication for both numbers.",
          l5_6: "Say the proof, then explain why adding 2 to each number would not work.",
        },
        payload: {
          prompt:
            "Your partner says 4 to 6 and 2 to 3 are different because the numbers are not the same. Explain why they are equivalent.",
          frame:
            "___ to ___ and ___ to ___ are equivalent because both numbers were multiplied by ___.",
          model:
            "4 to 6 and 2 to 3 are equivalent because both numbers were multiplied by 2. 2 × 2 = 4 and 3 × 2 = 6, so the relationship stays the same.",
          checklist: [
            "I said “equivalent” and “because”.",
            "I named the number that both parts were multiplied by.",
            "I showed the multiplication for both numbers.",
          ],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit2,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Vocabulary",
      title: "Point and Say Bracelets",
      mission:
        "Point to the matching bracelets in each picture, say the word, then say its sentence.",
      grouping: "Partners",
      minutes: 5,
      tip: "No reading is needed, so show each picture cue, say the word, and let the student repeat it.",
      support: {
        l1_2: "Point and say one word at a time with your partner.",
        l3_4: "Point, say the word, and say the whole sentence.",
        l5_6: "Say the sentence, then change the numbers to make your own.",
      },
      payload: {
        items: [
          {
            term: "equivalent ratio",
            icon: "🟰",
            cue: "A small bracelet with 2 red beads and 3 blue beads next to a big bracelet with 4 red beads and 6 blue beads in the same pattern.",
            say: "These two ratios are equivalent.",
            es: "razón equivalente",
          },
          {
            term: "multiply",
            icon: "✖️",
            cue: "Two piles of 3 cubes are pushed together to make 6 cubes.",
            say: "I multiply 3 by 2 to get 6.",
            es: "multiplicar",
          },
          {
            term: "double",
            icon: "2️⃣",
            cue: "A group of 2 cubes next to a group of 4 cubes.",
            say: "4 cubes is double 2 cubes.",
            es: "el doble",
          },
          {
            term: "same",
            icon: "🔁",
            cue: "Two bracelets with the same pattern of red beads and blue beads.",
            say: "The pattern is the same.",
            es: "igual",
          },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Build Matching Rows",
      mission:
        "Listen to each command and build the matching rows with your red and blue cubes.",
      grouping: "Whole Class",
      minutes: 4,
      tip: "Model the first row yourself, then let students build the next rows from the command alone.",
      support: {
        l1_2: "Copy the action with a partner.",
        l3_4: "Do the action on your own.",
        l5_6: "Give the command to a partner and check the cubes.",
      },
      payload: {
        items: [
          {
            command: "Make a row of 2 red cubes and 3 blue cubes.",
            icon: "🧱",
          },
          {
            command:
              "Make a second row with double the cubes: 4 red cubes and 6 blue cubes.",
            icon: "2️⃣",
          },
          {
            command: "Make a third row with 6 red cubes and 9 blue cubes.",
            icon: "🧱",
          },
          {
            command:
              "Add 1 red cube and 1 blue cube to the first row. Is the pattern still the same? Shake your head no.",
            icon: "🙅",
          },
          {
            command:
              "Take the extra cubes away and point to two rows that match.",
            icon: "👉",
          },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Equivalent",
      mission:
        "Say equivalent, multiply and because in English and in your home language, then use one of them to talk about the two bracelets.",
      grouping: "Partners",
      minutes: 4,
      tip: "Invite students to add the word in any language they know, since the Spanish glosses are teacher-reviewed drafts.",
      support: {
        l1_2: "Say both words with your partner.",
        l3_4: "Say both words and tell one way they are alike or different.",
        l5_6: "Use both words in a sentence in each language.",
      },
      payload: {
        items: [
          {
            term: "equivalent",
            es: "equivalente",
            note: "A cognate. Both words mean “the same value” and sound almost the same.",
          },
          {
            term: "multiply",
            es: "multiplicar",
            note: "A cognate. In English the word “times” also means multiply: 2 times 3.",
          },
          {
            term: "because",
            es: "porque",
            note: "Write “porque” as one word for because. Two words, “por qué,” means why.",
          },
        ],
      },
    },
  ],
  extension: {
    kind: "write_scaffold",
    domain: "Writing",
    title: "Bigger Batch Report",
    mission:
      "Write whether Marcus's bigger batch of 8 liters of juice and 12 liters of water tastes the same, and prove it.",
    grouping: "Solo",
    minutes: 8,
    klu: "Explain",
    tip: "Score with the checklist, because the model is a target and not a script.",
    support: {
      l1_2: "Use the frame for each part and write the multiplier first.",
      l3_4: "Write all three parts and use “because” once.",
      l5_6: "Write all three parts and add a sentence that shows why 8 to 11 would not match.",
    },
    payload: {
      prompt:
        "Marcus makes a bigger batch of punch with 8 liters of juice and 12 liters of water. Tell whether it tastes the same as 2 liters of juice for every 3 liters of water, and explain how you know.",
      structure: [
        {
          part: "Claim",
          frame:
            "The batch with 8 liters of juice and 12 liters of water ___ like the first recipe.",
        },
        {
          part: "Reason",
          frame:
            "8 to 12 and 2 to 3 are equivalent because both numbers were multiplied by ___.",
        },
        { part: "Proof", frame: "2 × ___ = 8 and 3 × ___ = 12, so ___." },
      ],
      word_bank: [
        "equivalent",
        "because",
        "multiplied",
        "both numbers",
        "juice",
        "water",
        "the same",
        "relationship",
      ],
      checklist: [
        "I said whether the batch tastes the same.",
        "I used “equivalent” and “because”.",
        "I named the multiplier.",
        "I showed the multiplication for both numbers.",
      ],
      model:
        "The batch with 8 liters of juice and 12 liters of water tastes like the first recipe. 8 to 12 and 2 to 3 are equivalent because both numbers were multiplied by 4. 2 × 4 = 8 and 3 × 4 = 12, so the relationship stays the same.",
    },
  },
  exit_check: exit2,
  teacher_card: {
    minutes: 27,
    materials: [
      "Red and blue cubes, 9 of each for every pair",
      "Sticky notes for ratio cards",
      "Whiteboards",
      "Device with sound for each pair",
    ],
    listen_for: [
      "Students say “both numbers” and name the same multiplier for the two parts.",
      "Students use “because” followed by a full clause, not a single noun.",
      "Students reject 4 to 5 by saying that adding does not keep the relationship.",
    ],
    watchouts: [
      "Additive reasoning: students turn 2 to 3 into 4 to 5 because both numbers went up by 2. Build 2 red and 3 blue cubes twice and ask whether the pattern still matches.",
      "Flipped order: 6 to 4 looks like a scaled ratio, but it is equivalent to 3 to 2, not to 2 to 3. Have students say the names first.",
      "Spanish speakers may blend “porque” and “por” and write “because of both numbers multiplied.” Model “because” plus a full clause, such as “because both numbers were multiplied by 3.”",
    ],
    differentiation: {
      l1_2: "Use cubes and the frame “___ to ___ and ___ to ___ are equivalent because both numbers were multiplied by ___.”",
      l3_4: "Name the multiplier and show the multiplication for both numbers in one because sentence.",
      l5_6: "Prove that adding the same number does not work, and write a new equivalent ratio from 3 to 5.",
      newcomer:
        "Use Point and Say Bracelets, Build Matching Rows and the Home Language Bridge, and accept cube models and pointing as answers.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

const exit3 = {
  kind: "exit_check",
  domain: "Reading",
  title: "Read the Model Check",
  mission:
    "Answer three questions about a flower tape diagram, a crabmeat double number line and a red-and-blue diagram, then rate how well you can read a model.",
  grouping: "Solo",
  minutes: 3,
  tip: "Collect the can-do ratings and watch for students who read the top and bottom rows in the wrong order.",
  support: {
    l1_2: "Listen to each question with the audio button, then tap an answer.",
    l3_4: "Read each question, tap an answer, and read the reason.",
    l5_6: "Answer, read the reason, and say what one block or one step is worth before you rate yourself.",
  },
  payload: {
    can_do: "I can read a tape diagram and a double number line out loud.",
    items: [
      {
        q: "A tape diagram has 2 green blocks above 5 yellow blocks. Each block is worth 4 flowers. How many yellow flowers are there?",
        options: ["8 flowers", "20 flowers", "9 flowers"],
        answer: 1,
        why: "5 yellow blocks × 4 flowers in each block = 20 flowers. 8 flowers is the green row, and 9 comes from adding 5 + 4.",
      },
      {
        q: "On a double number line, 2 pounds of crabmeat lines up with 30 dollars. What does 4 pounds line up with?",
        options: ["32 dollars", "15 dollars", "60 dollars"],
        answer: 2,
        why: "From 2 pounds to 4 pounds you doubled, so double 30 dollars to get 60 dollars. 32 dollars comes from adding, and 15 dollars comes from halving.",
      },
      {
        q: "A tape diagram has 3 red blocks in the top row and 5 blue blocks in the bottom row. Which sentence reads it correctly?",
        options: [
          "The ratio of red blocks to blue blocks is 3 to 5.",
          "The ratio of blue blocks to red blocks is 3 to 5.",
          "The ratio of red blocks to blue blocks is 3 to 8.",
        ],
        answer: 0,
        why: "The top row has 3 red blocks and the bottom row has 5 blue blocks, so red to blue is 3 to 5. Naming blue first flips the order, and 8 is the total number of blocks.",
      },
    ],
  },
};

const lesson3 = {
  id: "g6-math-u2-l03",
  unit_id: "g6-math-u2",
  version: 1,
  sequence: 3,
  source: "authored",
  title: "Read and build tape diagrams and double number lines",
  core_lesson_ref: {
    label: "Language session 3: ratio models",
    source: "language_pathway",
  },
  content_objective:
    "Students draw and read a tape diagram and a double number line for a ratio, find the value of one block or one step, and use the model to find a missing amount.",
  language_objective: {
    klu: "Inform",
    function:
      "read a ratio model aloud and build one from a spoken description",
    forms: [
      "The top row has [number] blocks and the bottom row has [number] blocks.",
      "On the double number line, [number] [unit] lines up with [number] [unit].",
    ],
    by_level: {
      l1_2: "I can point to a tape diagram and say how many blocks are in each row with a frame.",
      l3_4: "I can read a tape diagram and a double number line aloud and say what one block or one step is worth.",
      l5_6: "I can explain how a model gives a missing amount and why every block must be the same size.",
    },
  },
  standards: ["6.RP.A.3", "6.RP.A.3a"],
  wida: {
    framework: "2020",
    language_expectation: "Math.6-8.Inform.Interpretive",
    pld_targets: ["sentence", "word"],
  },
  vocab: [
    { term: "tape diagram", tier: 3, new_or_review: "new" },
    { term: "double number line", tier: 3, new_or_review: "new" },
    { term: "block", tier: 2, new_or_review: "new" },
    { term: "row", tier: 2, new_or_review: "new" },
    { term: "ratio", tier: 3, new_or_review: "review" },
  ],
  mentor_sentence: {
    text: "My tape diagram shows 3 blue blocks above 4 white blocks, and each block is worth 3 tiles, so 9 blue tiles go with 12 white tiles.",
    chunks: [
      {
        text: "My tape diagram shows 3 blue blocks above 4 white blocks,",
        role: "The model",
        tone: "concept",
        ask: "How many blocks are in the top row, and how many are in the bottom row?",
      },
      {
        text: "and each block is worth 3 tiles,",
        role: "The value of one block",
        tone: "precision",
        ask: "What number does every block stand for?",
      },
      {
        text: "so",
        role: "The result signal",
        tone: "connector",
        ask: "Which word tells you the answer is coming?",
      },
      {
        text: "9 blue tiles go with 12 white tiles.",
        role: "The answer",
        tone: "evidence",
        ask: "How do 3 blocks of 3 and 4 blocks of 3 make 9 and 12?",
      },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Tile Border Flip Cards",
        mission:
          "Flip each card to check what you remember about tiles, ratios and equal groups before you draw your first model.",
        grouping: "Partners",
        minutes: 4,
        tip: "Partners quiz each other, and any missed card goes back into the pile for another round.",
        support: {
          l1_2: "Point to the icon, say the answer, then flip to check.",
          l3_4: "Answer in a full sentence before you flip the card.",
          l5_6: "Answer, flip, and then write a new question about tiles for your partner.",
        },
        payload: {
          cards: [
            {
              prompt: "What is the ratio of 3 blue tiles to 4 white tiles?",
              answer: "3 to 4. Blue is named first, so 3 comes first.",
              icon: "🟦",
            },
            {
              prompt:
                "A border has 3 blue tiles and 4 white tiles. How many tiles are in the border in all?",
              answer: "There are 7 tiles in all, because 3 + 4 = 7.",
              icon: "🧱",
            },
            {
              prompt: "What is 12 ÷ 4?",
              answer: "3, because 4 equal groups of 3 make 12.",
              icon: "➗",
            },
            {
              prompt: "What does “equal” mean in “equal blocks”?",
              answer:
                "The same size, so every block stands for the same number.",
              icon: "🟰",
            },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "Read the Model Listen and Tap",
        mission:
          "Listen to a teacher read a tape diagram and a double number line, and tap what each sentence means.",
        grouping: "Solo",
        minutes: 5,
        tip: "Draw each model on the board as you read it, then play the sentence again without the drawing.",
        support: {
          l1_2: "Listen once, tap, then listen again with the words showing.",
          l3_4: "Tap, then say the sentence back to a partner.",
          l5_6: "Tap, then draw the model from the sentence on a whiteboard.",
        },
        payload: {
          items: [
            {
              say: "In a tape diagram, every block is the same size. The top row has 3 blocks and the bottom row has 4 blocks. Which ratio does the diagram show?",
              options: [
                { label: "3 to 4", icon: "🟦" },
                { label: "4 to 3" },
                { label: "3 to 7" },
              ],
              answer: 0,
              why: "The top row has 3 blocks and the bottom row has 4 blocks, so the ratio is 3 to 4, in that order.",
            },
            {
              say: "On a double number line, the top line shows miles and the bottom line shows minutes. The mark 4 on top lines up with 8 on the bottom. What does that mean?",
              options: [
                { label: "8 miles take 4 minutes" },
                { label: "4 miles take 8 minutes", icon: "🚆" },
                { label: "4 miles take 4 minutes" },
              ],
              answer: 1,
              why: "The top line is miles and the bottom line is minutes, so 4 miles line up with 8 minutes. Reading the lines the other way gives 8 miles and 4 minutes.",
            },
            {
              say: "Each block in the tape diagram is worth 3 tiles. The top row has 3 blocks. How many tiles are in the top row?",
              options: [
                { label: "3 tiles" },
                { label: "6 tiles" },
                { label: "9 tiles" },
              ],
              answer: 2,
              why: "3 blocks × 3 tiles in each block = 9 tiles. 3 tiles is only one block, and 6 tiles is only two blocks.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 4,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Tape Diagram Sentence X-Ray",
        mission:
          "Look inside the sentence that starts “My tape diagram shows 3 blue blocks” and rebuild its chunks in order.",
        grouping: "Whole Class",
        minutes: 4,
        tip: "Ask students to point to the top row and the bottom row of a drawn diagram while they read each chunk.",
        support: {
          l1_2: "Tap each colored chunk and listen to it.",
          l3_4: "Rebuild the sentence, then say the job of each chunk.",
          l5_6: "Rebuild it, then write a new sentence about 2 green blocks and 5 yellow blocks with the same chunks.",
        },
        payload: {
          text: "My tape diagram shows 3 blue blocks above 4 white blocks, and each block is worth 3 tiles, so 9 blue tiles go with 12 white tiles.",
          chunks: [
            {
              text: "My tape diagram shows 3 blue blocks above 4 white blocks,",
              role: "The model",
              tone: "concept",
            },
            {
              text: "and each block is worth 3 tiles,",
              role: "The value of one block",
              tone: "precision",
            },
            { text: "so", role: "The result signal", tone: "connector" },
            {
              text: "9 blue tiles go with 12 white tiles.",
              role: "The answer",
              tone: "evidence",
            },
          ],
          ask: "Which chunk tells you what one block is worth?",
        },
      },
    },
    {
      step: "interact",
      minutes: 7,
      activity: {
        kind: "sequence",
        domain: "Reading",
        title: "Build the Tile Border Model",
        mission:
          "Put the six steps for drawing the tile border tape diagram in order, then tell your partner each step with a signal word.",
        grouping: "Partners",
        minutes: 7,
        tip: "Ask partners to draw each step on paper as they order it so the diagram grows one row at a time.",
        materials: ["Grid paper", "Two colored pencils"],
        support: {
          l1_2: "Match each step to a picture of the diagram, then put the steps in order.",
          l3_4: "Order the steps and say each one with “first,” “next,” “then,” or “finally.”",
          l5_6: "Order the steps, then write a seventh step that checks the answer with the ratio 3 to 4.",
        },
        payload: {
          title:
            "A border has 12 white tiles. How many blue tiles go with them if the ratio is 3 blue tiles to 4 white tiles?",
          steps: [
            "Read the ratio: 3 blue tiles for every 4 white tiles, and 12 white tiles in all.",
            "Draw 3 equal blocks in the top row and label the row blue.",
            "Draw 4 blocks of the same size in the bottom row and label the row white.",
            "Find the value of one block: 12 white tiles ÷ 4 blocks = 3 tiles in each block.",
            "Find the blue tiles: 3 blocks × 3 tiles in each block = 9 blue tiles.",
            "Say the answer in a sentence: 9 blue tiles go with 12 white tiles.",
          ],
          signals: ["first", "next", "then", "after that", "finally"],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Read the Light Rail Line",
        mission:
          "Record yourself reading the Light Rail double number line out loud, then tell how long 4 miles takes.",
        grouping: "Solo",
        minutes: 5,
        klu: "Inform",
        tip: "Recordings stay on the student's device, so ask a partner to listen for matching pairs such as 3 miles and 6 minutes.",
        support: {
          l1_2: "Say one sentence with the frame and point to the two marks that line up.",
          l3_4: "Say the frame, then say what one mile is worth in minutes.",
          l5_6: "Say the frame, then explain how the line would change for 6 miles.",
        },
        payload: {
          prompt:
            "A double number line for a Light Rail ride has miles on the top line: 0, 1, 2, 3, 4, 5, 6. The bottom line shows minutes: 0, 2, 4, 6, 8, 10, 12. Read the line out loud and tell how long 4 miles takes.",
          frame:
            "On the double number line, ___ miles line up with ___ minutes, so 4 miles take ___ minutes.",
          model:
            "On the double number line, 3 miles line up with 6 minutes, and each mile adds 2 minutes, so 4 miles take 8 minutes.",
          checklist: [
            "I said the two numbers that line up as a pair.",
            "I named the units, miles and minutes, in the right order.",
            "I told what one step on the line is worth.",
          ],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit3,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Vocabulary",
      title: "Point and Say the Models",
      mission:
        "Point to the rows, blocks and lines in each picture, say the word, then say its sentence.",
      grouping: "Partners",
      minutes: 5,
      tip: "No reading is needed, so show each picture cue, say the word, and let the student repeat it.",
      support: {
        l1_2: "Point and say one word at a time with your partner.",
        l3_4: "Point, say the word, and say the whole sentence.",
        l5_6: "Say the sentence, then change the numbers to make your own.",
      },
      payload: {
        items: [
          {
            term: "tape diagram",
            icon: "🟦",
            cue: "Two stacked rows of equal rectangles: 3 blue ones on top and 4 white ones below.",
            say: "The top row has 3 blocks and the bottom row has 4 blocks.",
            es: "diagrama de cinta",
          },
          {
            term: "double number line",
            icon: "📏",
            cue: "Two lines, one above the other, with tick marks that match from top to bottom.",
            say: "The marks on the two lines match.",
            es: "recta numérica doble",
          },
          {
            term: "block",
            icon: "🟦",
            cue: "One small square that is the same size as all the other squares in the rows.",
            say: "Every block is the same size.",
            es: "bloque",
          },
          {
            term: "row",
            icon: "➡️",
            cue: "A line of squares going across the page, with the top row and bottom row shown.",
            say: "This is the top row.",
            es: "fila",
          },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Build a Cube Tape Diagram",
      mission: "Listen to each command and build the cube model on your desk.",
      grouping: "Whole Class",
      minutes: 4,
      tip: "Model the top row first, then let students build the bottom row from the command alone.",
      support: {
        l1_2: "Copy the action with a partner.",
        l3_4: "Do the action on your own.",
        l5_6: "Give the command to a partner and check the cubes.",
      },
      payload: {
        items: [
          {
            command: "Put 3 red cubes in a row at the top of your desk.",
            icon: "🔴",
          },
          {
            command: "Put 4 blue cubes in a row under the red cubes.",
            icon: "🔵",
          },
          {
            command: "Push the cubes so each row touches like a strip of tape.",
            icon: "🤏",
          },
          {
            command: "Point to the top row. Then point to the bottom row.",
            icon: "👉",
          },
          {
            command:
              "Draw two long lines, one above the other, and write 0 at the left end of each line.",
            icon: "✏️",
          },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Models",
      mission:
        "Say tape diagram, double number line and block in English and in your home language, then tell what each one shows.",
      grouping: "Partners",
      minutes: 4,
      tip: "Invite students to add the word in any language they know, since the Spanish glosses are teacher-reviewed drafts.",
      support: {
        l1_2: "Say both words with your partner.",
        l3_4: "Say both words and tell one way they are alike or different.",
        l5_6: "Use both words in a sentence in each language.",
      },
      payload: {
        items: [
          {
            term: "tape diagram",
            es: "diagrama de cinta",
            note: "“Cinta” means tape or ribbon. Some books say “diagrama de barras,” which can also mean a bar graph, so use cinta for this model of equal blocks.",
          },
          {
            term: "double number line",
            es: "recta numérica doble",
            note: "“Recta numérica” is the school Spanish for number line, and “doble” tells you there are two lines.",
          },
          {
            term: "block",
            es: "bloque",
            note: "A cognate. In a tape diagram each bloque has the same size and the same value.",
          },
        ],
      },
    },
  ],
  extension: {
    kind: "write_scaffold",
    domain: "Writing",
    title: "Longer Wall Border Report",
    mission:
      "Write how a tape diagram shows how many blue tiles go with 28 white tiles on a longer wall.",
    grouping: "Solo",
    minutes: 8,
    klu: "Inform",
    tip: "Score with the checklist, because the model is a target and not a script.",
    support: {
      l1_2: "Use the frame for each part and draw the blocks first.",
      l3_4: "Write all three parts and name what one block is worth.",
      l5_6: "Write all three parts and add a sentence that checks the answer with the ratio 3 to 4.",
    },
    payload: {
      prompt:
        "The border on a longer wall has 28 white tiles, with 3 blue tiles for every 4 white tiles. Use a tape diagram to explain how many blue tiles go with the white tiles.",
      structure: [
        {
          part: "Model",
          frame:
            "My tape diagram has ___ blocks of blue and ___ blocks of white.",
        },
        {
          part: "One block",
          frame: "Each block is worth ___ tiles because ___ ÷ ___ = ___.",
        },
        {
          part: "Answer",
          frame:
            "So ___ blue tiles go with 28 white tiles because ___ × ___ = ___.",
        },
      ],
      word_bank: [
        "tape diagram",
        "block",
        "row",
        "each",
        "worth",
        "divided by",
        "times",
        "blue tiles",
      ],
      checklist: [
        "I told how many blocks are in each row.",
        "I said what one block is worth and showed the division.",
        "I multiplied to find the blue tiles.",
        "I wrote the answer in a full sentence.",
      ],
      model:
        "My tape diagram has 3 blocks of blue and 4 blocks of white. Each block is worth 7 tiles because 28 ÷ 4 = 7. So 21 blue tiles go with 28 white tiles because 3 × 7 = 21.",
    },
  },
  exit_check: exit3,
  teacher_card: {
    minutes: 28,
    materials: [
      "Cubes or square tiles in two colors",
      "Grid paper and colored pencils",
      "A long strip of paper or string for a double number line",
      "Whiteboards",
    ],
    listen_for: [
      "Students say the number of blocks in each row in the same order as the names.",
      "Students tell what one block or one step is worth before they give an answer.",
      "Students read the marks that line up on a double number line as a pair, such as 4 miles and 8 minutes.",
    ],
    watchouts: [
      "Unequal blocks: students draw 3 blocks and 4 blocks of different sizes, so the model stops showing the ratio. Ask whether every block has the same value.",
      "Reading a double number line as one list of numbers: students say 4 and 8 without units, or flip miles and minutes. Insist on the units in the order of the lines.",
      "Position words such as above, under, top row and bottom row decide which amount comes first and are new for some learners. Touch each row as you say its name.",
    ],
    differentiation: {
      l1_2: "Build the model with cubes and use the frame “The top row has ___ blocks and the bottom row has ___ blocks.”",
      l3_4: "Read each model aloud and say what one block or one step is worth before you answer.",
      l5_6: "Explain why every block must be the same size and check an answer with the ratio from the model.",
      newcomer:
        "Use Point and Say the Models, Build a Cube Tape Diagram and the Home Language Bridge, and accept cube models and drawings as answers.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

const exit4 = {
  kind: "exit_check",
  domain: "Reading",
  title: "Ratio Table Check",
  mission:
    "Answer three questions about ratio table rows, then rate how well you can complete a ratio table and explain it.",
  grouping: "Solo",
  minutes: 3,
  tip: "Collect the can-do ratings and note which students fill the table by adding the same number to every column.",
  support: {
    l1_2: "Listen to each question with the audio button, then tap an answer.",
    l3_4: "Read each question, tap an answer, and read the reason.",
    l5_6: "Answer, read the reason, and say a second way to find the missing number before you rate yourself.",
  },
  payload: {
    can_do: "I can complete a ratio table and explain how I did it.",
    items: [
      {
        q: "A ratio table starts with the row 4 to 5. Which row could also be in the table?",
        options: ["8 to 9", "8 to 10", "5 to 4"],
        answer: 1,
        why: "4 × 2 = 8 and 5 × 2 = 10, so 8 to 10 keeps the same relationship. 8 to 9 adds 4 to each number, and 5 to 4 flips the order.",
      },
      {
        q: "A ratio table has the rows 2 to 7 and 6 to 21. What is the missing number in the row 4 to ___?",
        options: ["9", "11", "14"],
        answer: 2,
        why: "You multiplied 2 by 2 to get 4, so multiply 7 by 2 too: 14. Adding 2 gives 9, and adding 4 + 7 gives 11, and neither keeps the relationship.",
      },
      {
        q: "Row 1 is 3 to 2 and Row 2 is 6 to 4. Which sentence explains how a student made Row 3, which is 9 to 6?",
        options: [
          "I added the oats numbers and the raisins numbers of the two rows: 3 + 6 = 9 and 2 + 4 = 6.",
          "I added 3 to each number in Row 2: 6 + 3 = 9 and 4 + 3 = 7.",
          "I subtracted Row 1 from Row 2: 6 − 3 = 3 and 4 − 2 = 2.",
        ],
        answer: 0,
        why: "Adding two rows of the same ratio makes another row of that ratio: 3 + 6 = 9 and 2 + 4 = 6. Adding 3 to both numbers of Row 2 gives 9 to 7, which does not match.",
      },
    ],
  },
};

const lesson4 = {
  id: "g6-math-u2-l04",
  unit_id: "g6-math-u2",
  version: 1,
  sequence: 4,
  source: "authored",
  title: "Complete a ratio table and explain how you did it",
  core_lesson_ref: {
    label: "Language session 4: ratio tables",
    source: "language_pathway",
  },
  content_objective:
    "Students complete a ratio table by multiplying, dividing or adding rows that keep the same ratio, and explain which move they used to find a missing value.",
  language_objective: {
    klu: "Explain",
    function: "explain how each row of a ratio table was made",
    forms: [
      "I multiplied both numbers in Row [number] by [number], so [new ratio].",
      "I added Row [number] and Row [number] because every row keeps the same relationship.",
    ],
    by_level: {
      l1_2: "I can fill in a row of a ratio table and say its two numbers with a frame and a word bank.",
      l3_4: "I can tell whether I multiplied or added rows to make a new row and say why the ratio stays the same.",
      l5_6: "I can explain two different ways to find the same missing value in a ratio table.",
    },
  },
  standards: ["6.RP.A.3", "6.RP.A.3a"],
  wida: {
    framework: "2020",
    language_expectation: "Math.6-8.Explain.Expressive",
    pld_targets: ["discourse", "sentence"],
  },
  vocab: [
    { term: "ratio table", tier: 3, new_or_review: "new" },
    { term: "column", tier: 2, new_or_review: "new" },
    { term: "relationship", tier: 2, new_or_review: "new" },
    { term: "row", tier: 2, new_or_review: "review" },
    { term: "equivalent ratio", tier: 3, new_or_review: "review" },
  ],
  mentor_sentence: {
    text: "I filled in the ratio table by adding the rows 6 to 4 and 9 to 6, so 15 cups of oats go with 10 cups of raisins because every row keeps the same relationship.",
    chunks: [
      {
        text: "I filled in the ratio table by adding the rows 6 to 4 and 9 to 6,",
        role: "The move",
        tone: "concept",
        ask: "Which two rows did the speaker add?",
      },
      {
        text: "so",
        role: "The result signal",
        tone: "connector",
        ask: "Which word tells you the new row is coming?",
      },
      {
        text: "15 cups of oats go with 10 cups of raisins",
        role: "The new row",
        tone: "precision",
        ask: "What are the two numbers in the new row?",
      },
      {
        text: "because every row keeps the same relationship.",
        role: "The reason",
        tone: "evidence",
        ask: "Why does the new row still belong in the table?",
      },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Fruit Bar Flip Cards",
        mission:
          "Flip each card to check how you multiply to make equivalent ratios and how you name the lines of a table.",
        grouping: "Partners",
        minutes: 4,
        tip: "Partners quiz each other, and any missed card goes back into the pile for another round.",
        support: {
          l1_2: "Point to the icon, say the answer, then flip to check.",
          l3_4: "Answer in a full sentence before you flip the card.",
          l5_6: "Answer, flip, and then write a new question about a table for your partner.",
        },
        payload: {
          cards: [
            {
              prompt: "What is 3 × 5, and what is 2 × 5?",
              answer: "3 × 5 = 15 and 2 × 5 = 10.",
              icon: "✖️",
            },
            {
              prompt:
                "Say an equivalent ratio for 3 to 2 by multiplying both numbers by 2.",
              answer: "6 to 4, because 3 × 2 = 6 and 2 × 2 = 4.",
              icon: "🟰",
            },
            {
              prompt: "In a table, does a row go across or down?",
              answer:
                "A row goes across, from left to right. A column goes down, from top to bottom.",
              icon: "📋",
            },
            {
              prompt: "Why is 4 to 3 not equivalent to 3 to 2?",
              answer:
                "4 to 3 comes from adding 1 to both numbers. Equivalent ratios come from multiplying or dividing both numbers.",
              icon: "🚫",
            },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "Ratio Table Listen and Tap",
        mission:
          "Listen to Ms. Patel talk about her fruit bar table and tap the number or move she describes.",
        grouping: "Solo",
        minutes: 5,
        tip: "Write the table on the board as you read it and cover the new row until students have tapped their answer.",
        support: {
          l1_2: "Listen once, tap, then listen again with the words showing.",
          l3_4: "Tap, then say the whole sentence back to a partner.",
          l5_6: "Tap, then explain to a partner how you know.",
        },
        payload: {
          items: [
            {
              say: "In the ratio table, 3 cups of oats go with 2 cups of raisins. In the next row, the oats are 6. How many cups of raisins go in that row?",
              options: [
                { label: "5" },
                { label: "4", icon: "🍇" },
                { label: "6" },
              ],
              answer: 1,
              why: "Oats went from 3 to 6, which is times 2, so raisins go from 2 to 4. Adding 3 would give 5, and copying the oats would give 6.",
            },
            {
              say: "One row says 9 cups of oats and 6 cups of raisins. Another row says 12 cups of oats and 8 cups of raisins. If I add these two rows together, what is the new row?",
              options: [
                { label: "3 cups of oats and 2 cups of raisins" },
                { label: "108 cups of oats and 48 cups of raisins" },
                { label: "21 cups of oats and 14 cups of raisins", icon: "➕" },
              ],
              answer: 2,
              why: "Add the oats, 9 + 12 = 21, and add the raisins, 6 + 8 = 14. Subtracting gives 3 and 2, and multiplying gives much bigger numbers.",
            },
            {
              say: "The ratio table has the rows 3 to 2, 6 to 4, and 9 to 6. What is the pattern in the raisins?",
              options: [
                { label: "Each row adds 2 raisins", icon: "📈" },
                { label: "Each row adds 3 raisins" },
                { label: "Each row doubles the raisins" },
              ],
              answer: 0,
              why: "The raisins go 2, 4, 6, so each row adds 2 raisins. The oats add 3 each time. Doubling would give 2, 4, 8.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 4,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Ratio Table Sentence X-Ray",
        mission:
          "Look inside the sentence that starts “I filled in the ratio table” and rebuild its chunks in order.",
        grouping: "Whole Class",
        minutes: 4,
        tip: "Ask students to point to the two rows in the table that match the numbers in the first chunk.",
        support: {
          l1_2: "Tap each colored chunk and listen to it.",
          l3_4: "Rebuild the sentence, then say the job of each chunk.",
          l5_6: "Rebuild it, then write a new sentence about adding the rows 3 to 2 and 6 to 4 with the same chunks.",
        },
        payload: {
          text: "I filled in the ratio table by adding the rows 6 to 4 and 9 to 6, so 15 cups of oats go with 10 cups of raisins because every row keeps the same relationship.",
          chunks: [
            {
              text: "I filled in the ratio table by adding the rows 6 to 4 and 9 to 6,",
              role: "The move",
              tone: "concept",
            },
            { text: "so", role: "The result signal", tone: "connector" },
            {
              text: "15 cups of oats go with 10 cups of raisins",
              role: "The new row",
              tone: "precision",
            },
            {
              text: "because every row keeps the same relationship.",
              role: "The reason",
              tone: "evidence",
            },
          ],
          ask: "Which chunk tells you why the new row belongs in the table?",
        },
      },
    },
    {
      step: "interact",
      minutes: 7,
      activity: {
        kind: "read_annotate",
        domain: "Reading",
        title: "Read the Fruit Bar Table",
        mission:
          "Read Ms. Patel's fruit bar plan like a detective, mark each row and each move she made, and then answer the questions with your partner.",
        grouping: "Partners",
        minutes: 7,
        tip: "Students highlight in two colors and then use the questions to check that they can name the move behind each row.",
        support: {
          l1_2: "Mark only the numbers in each row.",
          l3_4: "Mark both the rows and the moves, then say each move aloud.",
          l5_6: "Mark everything, then write one more row for the table and name the move you used.",
        },
        payload: {
          text: "Ms. Patel is making fruit bars for a bake sale in Waverly. Her recipe uses 3 cups of oats for every 2 cups of raisins. She builds a ratio table. Row 1 is 3 cups of oats and 2 cups of raisins. For Row 2, she multiplies both numbers by 2, so she writes 6 cups of oats and 4 cups of raisins. For Row 3, she adds Row 1 and Row 2, so she writes 9 cups of oats and 6 cups of raisins. Every row keeps the same relationship. To find the raisins for 15 cups of oats, she multiplies both numbers in Row 1 by 5, so she needs 10 cups of raisins.",
          marks: [
            {
              label: "Rows",
              instruction: "Highlight the three rows of the table.",
              targets: [
                "Row 1 is 3 cups of oats and 2 cups of raisins",
                "she writes 6 cups of oats and 4 cups of raisins",
                "she writes 9 cups of oats and 6 cups of raisins",
              ],
            },
            {
              label: "Moves",
              instruction: "Highlight the words that tell what Ms. Patel did.",
              targets: [
                "she multiplies both numbers by 2",
                "she adds Row 1 and Row 2",
                "she multiplies both numbers in Row 1 by 5",
              ],
            },
          ],
          questions: [
            {
              q: "How did Ms. Patel make Row 3?",
              options: [
                "She added Row 1 and Row 2.",
                "She subtracted Row 1 from Row 2.",
                "She added 3 to both numbers in Row 2.",
              ],
              answer: 0,
              why: "She added the oats, 3 + 6 = 9, and added the raisins, 2 + 4 = 6. Subtracting or adding 3 to both numbers would not give 9 to 6.",
            },
            {
              q: "How many cups of raisins go with 15 cups of oats?",
              options: ["17", "10", "5"],
              answer: 1,
              why: "15 is 3 × 5, so multiply the raisins by 5 too: 2 × 5 = 10. 17 comes from adding 2 to 15, and 5 is the multiplier, not the raisins.",
            },
            {
              q: "Why do all of the rows belong in the same table?",
              options: [
                "Every row has the same number of cups of oats.",
                "Every row adds up to 15 cups.",
                "Every row keeps the same relationship of 3 cups of oats to 2 cups of raisins.",
              ],
              answer: 2,
              why: "A ratio table only holds rows that match one relationship. 3 to 2, 6 to 4 and 9 to 6 are all equivalent ratios.",
            },
          ],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Fill the Empty Box",
        mission:
          "Record yourself telling your partner how to fill the empty raisins box in the row with 15 cups of oats.",
        grouping: "Solo",
        minutes: 5,
        klu: "Explain",
        tip: "Recordings stay on the student's device, so ask a partner to listen for the same multiplier on both numbers.",
        support: {
          l1_2: "Say one sentence with the frame and point to the two rows.",
          l3_4: "Say the frame, then say the whole new row.",
          l5_6: "Say the frame, then show a second way to find the box by adding rows.",
        },
        payload: {
          prompt:
            "A ratio table has the rows 3 to 2 and 6 to 4. The next row has 15 cups of oats and an empty box for the raisins. Tell your partner how to fill the box.",
          frame:
            "I multiplied ___ by ___ to get ___, so I multiplied ___ by ___ to get ___.",
          model:
            "I multiplied 3 by 5 to get 15, so I multiplied 2 by 5 to get 10. The row 15 to 10 keeps the same relationship, so 10 cups of raisins go in the box.",
          checklist: [
            "I said what I multiplied for the oats.",
            "I did the same multiplication for the raisins.",
            "I said the answer in a full sentence.",
          ],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit4,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Vocabulary",
      title: "Point and Say the Table",
      mission:
        "Point to the rows and columns of the ratio table in each picture, say the word, then say its sentence.",
      grouping: "Partners",
      minutes: 5,
      tip: "No reading is needed, so show each picture cue, say the word, and let the student repeat it.",
      support: {
        l1_2: "Point and say one word at a time with your partner.",
        l3_4: "Point, say the word, and say the whole sentence.",
        l5_6: "Say the sentence, then change the numbers to make your own.",
      },
      payload: {
        items: [
          {
            term: "ratio table",
            icon: "📋",
            cue: "A table with two columns and three rows of cubes: 3 and 2, then 6 and 4, then 9 and 6.",
            say: "This is a ratio table.",
            es: "tabla de razones",
          },
          {
            term: "row",
            icon: "➡️",
            cue: "A finger moves across one line of boxes in the table, from left to right.",
            say: "A row goes across.",
            es: "fila",
          },
          {
            term: "column",
            icon: "⬇️",
            cue: "A finger moves down one line of boxes in the table, from top to bottom.",
            say: "A column goes down.",
            es: "columna",
          },
          {
            term: "add",
            icon: "➕",
            cue: "Two small piles of cubes are pushed together to make one big pile.",
            say: "I add the two rows to make a new row.",
            es: "sumar",
          },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Build the Table with Cubes",
      mission:
        "Listen to each command and build the ratio table rows with your red and blue cubes.",
      grouping: "Whole Class",
      minutes: 4,
      tip: "Model the first box yourself, then let students build the next boxes from the command alone.",
      support: {
        l1_2: "Copy the action with a partner.",
        l3_4: "Do the action on your own.",
        l5_6: "Give the command to a partner and check the cubes.",
      },
      payload: {
        items: [
          {
            command:
              "Draw a box on your paper. Put 3 red cubes and 2 blue cubes in the box.",
            icon: "📦",
          },
          {
            command:
              "Draw a second box. Put 6 red cubes and 4 blue cubes in it.",
            icon: "📦",
          },
          {
            command: "Push the two boxes together. Count the red cubes.",
            icon: "🔴",
          },
          { command: "Now count the blue cubes.", icon: "🔵" },
          {
            command: "Point to one row of the table. Then point to one column.",
            icon: "👉",
          },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Table",
      mission:
        "Say ratio table, row and column in English and in your home language, then point to each one on the fruit bar table.",
      grouping: "Partners",
      minutes: 4,
      tip: "Invite students to add the word in any language they know, since the Spanish glosses are teacher-reviewed drafts.",
      support: {
        l1_2: "Say both words with your partner.",
        l3_4: "Say both words and tell one way they are alike or different.",
        l5_6: "Use both words in a sentence in each language.",
      },
      payload: {
        items: [
          {
            term: "ratio table",
            es: "tabla de razones",
            note: "“Tabla” is a cognate for table, and “razones” is the plural of razón. In math, razón names a ratio, not a reason.",
          },
          {
            term: "row",
            es: "fila",
            note: "Not a cognate. A fila goes across, like a line of students.",
          },
          {
            term: "column",
            es: "columna",
            note: "A cognate. A columna goes down, like the column of a building.",
          },
        ],
      },
    },
  ],
  extension: {
    kind: "write_scaffold",
    domain: "Writing",
    title: "Big Order Fruit Bars",
    mission:
      "Write how a ratio table shows how many cups of raisins go with 21 cups of oats for a big order.",
    grouping: "Solo",
    minutes: 8,
    klu: "Explain",
    tip: "Score with the checklist, because the model is a target and not a script.",
    support: {
      l1_2: "Use the frame for each part and write Row 1 first.",
      l3_4: "Write all three parts and name the multiplier.",
      l5_6: "Write all three parts and add a second way to reach 21 cups of oats by adding rows.",
    },
    payload: {
      prompt:
        "Ms. Patel needs 21 cups of oats for a big order, with 3 cups of oats for every 2 cups of raisins. Use a ratio table to find the raisins and explain your steps.",
      structure: [
        {
          part: "Start",
          frame: "Row 1 is ___ cups of oats and ___ cups of raisins.",
        },
        {
          part: "Move",
          frame: "I multiplied both numbers by ___ to get ___ cups of oats.",
        },
        {
          part: "Answer",
          frame: "So ___ cups of raisins go with 21 cups of oats because ___.",
        },
      ],
      word_bank: [
        "ratio table",
        "row",
        "multiplied",
        "both numbers",
        "cups of oats",
        "cups of raisins",
        "relationship",
        "because",
      ],
      checklist: [
        "I wrote the first row of the table.",
        "I named the number I multiplied by.",
        "I used the same move on both numbers.",
        "I wrote the answer in a full sentence with because.",
      ],
      model:
        "Row 1 is 3 cups of oats and 2 cups of raisins. I multiplied both numbers by 7 to get 21 cups of oats. So 14 cups of raisins go with 21 cups of oats because 2 × 7 = 14.",
    },
  },
  exit_check: exit4,
  teacher_card: {
    minutes: 28,
    materials: [
      "Red and blue cubes",
      "Blank ratio table templates with labeled columns",
      "Whiteboards",
      "Two highlighter colors for each pair",
    ],
    listen_for: [
      "Students name the move, multiply or add rows, before they say the new numbers.",
      "Students use the same multiplier on both columns of the table.",
      "Students say why a row belongs: it keeps the same relationship.",
    ],
    watchouts: [
      "Adding the same amount down a column: students see oats go up by 3 and raisins go up by 2, then apply one of those jumps to a new row. Ask whether the new row still matches 3 to 2.",
      "Swapping columns: students copy the raisins number into the oats column. Have them label both columns before they write numbers.",
      "Spanish speakers hear “razón” in “tabla de razones” and may read it as a table of reasons. Say that razón names the ratio and “because” gives the reason.",
    ],
    differentiation: {
      l1_2: "Use cubes, a labeled table and the frame “I multiplied ___ by ___ to get ___.”",
      l3_4: "Say which move made each row, multiplying or adding rows, and why the row still belongs.",
      l5_6: "Find the same missing value two ways and explain which way was faster.",
      newcomer:
        "Use Point and Say the Table, Build the Table with Cubes and the Home Language Bridge, and accept cube tables and pointing as answers.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

const exit5 = {
  kind: "exit_check",
  domain: "Vocabulary",
  title: "Unit Rate and Per Check",
  mission:
    "Answer three questions about running, apples and tickets, then rate how well you can find a unit rate and say it with “per”.",
  grouping: "Solo",
  minutes: 3,
  tip: "Collect the can-do ratings and note which students divide in the wrong order and get tickets per dollar.",
  support: {
    l1_2: "Listen to each question with the audio button, then tap an answer.",
    l3_4: "Read each question, tap an answer, and read the reason.",
    l5_6: "Answer, read the reason, and write the division for each choice before you rate yourself.",
  },
  payload: {
    can_do: "I can find a unit rate and say it with “per”.",
    items: [
      {
        q: "A runner goes 15 miles in 3 hours. Which is the unit rate?",
        options: ["45 miles per hour", "5 miles per hour", "5 hours per mile"],
        answer: 1,
        why: "15 ÷ 3 = 5, so the runner goes 5 miles for each hour. 45 comes from multiplying, and 5 hours per mile flips the units.",
      },
      {
        q: "At a farmers market, 4 pounds of apples cost 6 dollars. How much does 1 pound cost?",
        options: ["24 dollars", "about 0.67 dollars", "1.50 dollars"],
        answer: 2,
        why: "6 ÷ 4 = 1.50, so 1 pound costs 1.50 dollars. 24 comes from multiplying, and 0.67 comes from dividing 4 by 6, which flips the order.",
      },
      {
        q: "A store sells 4 tickets for 20 dollars. Which sentence uses “per” correctly?",
        options: [
          "The unit rate is 5 dollars per ticket.",
          "The unit rate is 5 tickets per dollar.",
          "The unit rate is 80 dollars per ticket.",
        ],
        answer: 0,
        why: "20 ÷ 4 = 5 dollars for each ticket, so the unit rate is 5 dollars per ticket. The word after “per” names the one thing, and 80 comes from multiplying.",
      },
    ],
  },
};

const lesson5 = {
  id: "g6-math-u2-l05",
  unit_id: "g6-math-u2",
  version: 1,
  sequence: 5,
  source: "authored",
  title: "Find a unit rate and say it with “per” and “each”",
  core_lesson_ref: {
    label: "Language session 5: unit rates",
    source: "language_pathway",
  },
  content_objective:
    "Students find a unit rate by dividing one quantity by the other, say it with “per” and “each,” and tell a rate from a unit rate.",
  language_objective: {
    klu: "Inform",
    function:
      "state a unit rate using per and each and show the division that finds it",
    forms: [
      "Each [thing] costs [number] dollars.",
      "The unit rate is [number] [unit] per [one thing] because [number] ÷ [number] = [number].",
    ],
    by_level: {
      l1_2: "I can say “Each pound costs 4 dollars” and “4 dollars per pound” with a picture and a frame.",
      l3_4: "I can find a unit rate by dividing and say it with both “each” and “per”.",
      l5_6: "I can explain why the order of the division matters and why the word after “per” names the one thing.",
    },
  },
  standards: ["6.RP.A.2", "6.RP.A.3b"],
  wida: {
    framework: "2020",
    language_expectation: "Math.6-8.Inform.Expressive",
    pld_targets: ["sentence", "word"],
  },
  vocab: [
    { term: "unit rate", tier: 3, new_or_review: "new" },
    { term: "per", tier: 2, new_or_review: "new" },
    { term: "each", tier: 2, new_or_review: "new" },
    { term: "rate", tier: 3, new_or_review: "review" },
    { term: "divide", tier: 2, new_or_review: "review" },
  ],
  mentor_sentence: {
    text: "Since 3 pounds of peaches cost 12 dollars, each pound costs 4 dollars, so the unit rate is 4 dollars per pound.",
    chunks: [
      {
        text: "Since 3 pounds of peaches cost 12 dollars,",
        role: "The rate",
        tone: "concept",
        ask: "Which two amounts are in the rate, and what are their units?",
      },
      {
        text: "each pound costs 4 dollars,",
        role: "The cost of one",
        tone: "precision",
        ask: "How much does exactly one pound cost?",
      },
      {
        text: "so",
        role: "The result signal",
        tone: "connector",
        ask: "Which word tells you the name of the unit rate is coming?",
      },
      {
        text: "the unit rate is 4 dollars per pound.",
        role: "The unit rate with per",
        tone: "evidence",
        ask: "Which word shows that 4 dollars goes with exactly 1 pound?",
      },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Per and Each Flip Cards",
        mission:
          "Flip each card to check what you remember about division, rates and the little words per and each.",
        grouping: "Partners",
        minutes: 4,
        tip: "Partners quiz each other, and any missed card goes back into the pile for another round.",
        support: {
          l1_2: "Point to the icon, say the answer, then flip to check.",
          l3_4: "Answer in a full sentence before you flip the card.",
          l5_6: "Answer, flip, and then make up a new rate with different units.",
        },
        payload: {
          cards: [
            {
              prompt: "What does “per” mean in “miles per hour”?",
              answer:
                "“Per” means for each one, so miles per hour means miles for each 1 hour.",
              icon: "⏱️",
            },
            {
              prompt: "What is 12 ÷ 3?",
              answer: "4, because 3 equal groups of 4 make 12.",
              icon: "➗",
            },
            {
              prompt:
                "Which is a rate: 5 red cubes to 7 blue cubes, or 60 miles in 2 hours?",
              answer:
                "60 miles in 2 hours is a rate, because miles and hours are different units.",
              icon: "🚌",
            },
            {
              prompt: "What does “each” mean in “each pound”?",
              answer: "Every single pound, one pound at a time.",
              icon: "⚖️",
            },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "Unit Rate Listen and Tap",
        mission:
          "Listen to each price or speed and tap the unit rate, the cost of each one, or the stand that charges more.",
        grouping: "Solo",
        minutes: 5,
        tip: "Play each sentence twice and say the number and the unit slowly so students hear what comes after per.",
        support: {
          l1_2: "Listen once, tap, then listen again with the words showing.",
          l3_4: "Tap, then say the whole sentence back to a partner.",
          l5_6: "Tap, then write the division that gives your answer.",
        },
        payload: {
          items: [
            {
              say: "A bag of 5 oranges costs 10 dollars. What is the cost of each orange?",
              options: [
                { label: "5 dollars" },
                { label: "2 dollars", icon: "🍊" },
                { label: "15 dollars" },
              ],
              answer: 1,
              why: "Divide the cost by the number of oranges: 10 ÷ 5 = 2, so each orange costs 2 dollars. 5 is the number of oranges, and 15 comes from adding 10 + 5.",
            },
            {
              say: "Jamal walked 6 miles in 2 hours. Which sentence says his unit rate?",
              options: [
                { label: "Jamal walks 12 miles per hour." },
                { label: "Jamal walks 3 hours per mile." },
                { label: "Jamal walks 3 miles per hour.", icon: "🚶" },
              ],
              answer: 2,
              why: "6 ÷ 2 = 3 miles for 1 hour, and “per hour” means for each 1 hour. 3 hours per mile flips the units, and 12 comes from multiplying.",
            },
            {
              say: "Stand A sells 4 tickets for 8 dollars. Stand B sells 3 tickets for 9 dollars. Which stand charges more for each ticket?",
              options: [
                { label: "Stand B, 3 dollars per ticket", icon: "🎟️" },
                { label: "Stand A, 2 dollars per ticket" },
                { label: "Both stands charge the same for each ticket" },
              ],
              answer: 0,
              why: "8 ÷ 4 = 2 dollars per ticket at Stand A, and 9 ÷ 3 = 3 dollars per ticket at Stand B. Stand B charges more for each ticket.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 4,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Per and Each Sentence X-Ray",
        mission:
          "Look inside the sentence that starts “Since 3 pounds of peaches cost 12 dollars” and rebuild its chunks in order.",
        grouping: "Whole Class",
        minutes: 4,
        tip: "Ask students to underline each and per and say which chunk tells the cost of exactly one pound.",
        support: {
          l1_2: "Tap each colored chunk and listen to it.",
          l3_4: "Rebuild the sentence, then say the job of each chunk.",
          l5_6: "Rebuild it, then write a new sentence about 5 pounds of grapes costing 10 dollars with the same chunks.",
        },
        payload: {
          text: "Since 3 pounds of peaches cost 12 dollars, each pound costs 4 dollars, so the unit rate is 4 dollars per pound.",
          chunks: [
            {
              text: "Since 3 pounds of peaches cost 12 dollars,",
              role: "The rate",
              tone: "concept",
            },
            {
              text: "each pound costs 4 dollars,",
              role: "The cost of one",
              tone: "precision",
            },
            { text: "so", role: "The result signal", tone: "connector" },
            {
              text: "the unit rate is 4 dollars per pound.",
              role: "The unit rate with per",
              tone: "evidence",
            },
          ],
          ask: "Which chunk tells the cost of exactly one pound?",
        },
      },
    },
    {
      step: "interact",
      minutes: 7,
      activity: {
        kind: "match",
        domain: "Vocabulary",
        title: "Rate to Unit Rate Match",
        mission:
          "Match each rate to its unit rate, and say every unit rate with “per” to your partner as you go.",
        grouping: "Partners",
        minutes: 7,
        tip: "Listen for the word after per, because it names the one thing the unit rate is for.",
        support: {
          l1_2: "Match the easy pairs first and say “___ per ___” out loud.",
          l3_4: "Match every pair, then write the division for two of them.",
          l5_6: "Match every pair, then write a new rate that has the unit rate 8 dollars per ticket.",
        },
        payload: {
          left_label: "Rate",
          right_label: "Unit rate",
          pairs: [
            { l: "12 dollars for 3 pounds", r: "4 dollars per pound" },
            { l: "150 words in 5 minutes", r: "30 words per minute" },
            { l: "240 miles in 4 hours", r: "60 miles per hour" },
            { l: "18 cookies for 6 students", r: "3 cookies per student" },
            { l: "45 dollars for 5 tickets", r: "9 dollars per ticket" },
            { l: "64 ounces in 8 cups", r: "8 ounces per cup" },
          ],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Say the Tomato Price",
        mission:
          "Record yourself telling how much 1 pound of tomatoes costs at a Lexington Market stand, using each and per.",
        grouping: "Solo",
        minutes: 5,
        klu: "Inform",
        tip: "Recordings stay on the student's device, so ask a partner to listen for the word after per.",
        support: {
          l1_2: "Say one sentence with the frame and the word bank.",
          l3_4: "Say the frame and show the division with your fingers or a drawing.",
          l5_6: "Say the frame, then explain why 4 ÷ 10 would answer a different question.",
        },
        payload: {
          prompt:
            "A stand at Lexington Market sells 4 pounds of tomatoes for 10 dollars. Tell how much 1 pound costs.",
          frame:
            "I divided ___ by ___, so each pound costs ___ dollars. The unit rate is ___ dollars per pound.",
          model:
            "I divided 10 by 4, so each pound costs 2.50 dollars. The unit rate is 2.50 dollars per pound.",
          checklist: [
            "I divided the dollars by the pounds.",
            "I used “each” and “per”.",
            "I said the price as two dollars and fifty cents.",
          ],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit5,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Vocabulary",
      title: "Point and Say the Price",
      mission:
        "Point to the orange, the price tag and the shared coins in each picture, say the word, then say its sentence.",
      grouping: "Partners",
      minutes: 5,
      tip: "No reading is needed, so show each picture cue, say the word, and let the student repeat it.",
      support: {
        l1_2: "Point and say one word at a time with your partner.",
        l3_4: "Point, say the word, and say the whole sentence.",
        l5_6: "Say the sentence, then change the price to make your own.",
      },
      payload: {
        items: [
          {
            term: "unit rate",
            icon: "🍊",
            cue: "One orange with a price tag that says 2 dollars.",
            say: "The unit rate is 2 dollars per orange.",
            es: "tasa unitaria",
          },
          {
            term: "per",
            icon: "🏷️",
            cue: "One bag of oranges next to one price tag, with an arrow between them.",
            say: "2 dollars per orange means 2 dollars for each orange.",
            es: "por",
          },
          {
            term: "each",
            icon: "☝️",
            cue: "A finger touches one orange at a time in a row of five oranges.",
            say: "Each orange costs 2 dollars.",
            es: "cada",
          },
          {
            term: "divide",
            icon: "➗",
            cue: "10 coins are shared into 5 equal piles of 2 coins.",
            say: "I divide 10 dollars by 5 oranges.",
            es: "dividir",
          },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Share the Counters",
      mission:
        "Listen to each command and share the counters into equal groups on your desk.",
      grouping: "Whole Class",
      minutes: 4,
      tip: "Model the sharing once, then let students follow the commands without help.",
      support: {
        l1_2: "Copy the action with a partner.",
        l3_4: "Do the action on your own.",
        l5_6: "Give the command to a partner and check the groups.",
      },
      payload: {
        items: [
          { command: "Put 10 counters on your desk.", icon: "🔟" },
          { command: "Make 5 equal groups with the counters.", icon: "🟰" },
          {
            command:
              "Point to one group. Hold up the number of counters in it.",
            icon: "☝️",
          },
          { command: "Put one small paper next to each group.", icon: "📄" },
          {
            command: "Take away 1 group. Now count the counters that are left.",
            icon: "🤲",
          },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Per",
      mission:
        "Say per, each and unit rate in English and in your home language, then say the price of one orange both ways.",
      grouping: "Partners",
      minutes: 4,
      tip: "Invite students to add the word in any language they know, since the Spanish glosses are teacher-reviewed drafts.",
      support: {
        l1_2: "Say both words with your partner.",
        l3_4: "Say both words and tell one way they are alike or different.",
        l5_6: "Use both words in a sentence in each language.",
      },
      payload: {
        items: [
          {
            term: "per",
            es: "por",
            note: "In rate words, “por” means per, as in millas por hora. In Spanish, “4 por 5” also means 4 × 5, so listen for the unit that comes after it.",
          },
          {
            term: "each",
            es: "cada",
            note: "“Cada” means each or every. “Cada naranja” is each orange.",
          },
          {
            term: "unit rate",
            es: "tasa unitaria",
            note: "“Tasa” is rate and “unitaria” is a cognate of unit. Spanish writes 2,50 with a comma, and English writes 2.50 with a point.",
          },
        ],
      },
    },
  ],
  extension: {
    kind: "write_scaffold",
    domain: "Writing",
    title: "Who Paid Less per Pound?",
    mission:
      "Write who paid less for each pound of potatoes, Marcus or Tia, and prove it with two unit rates.",
    grouping: "Solo",
    minutes: 8,
    klu: "Explain",
    tip: "Score with the checklist, because the model is a target and not a script.",
    support: {
      l1_2: "Use the frame for each part and write the two prices first.",
      l3_4: "Write all three parts and use “because” once.",
      l5_6: "Write all three parts, add “since,” and cite both unit rates.",
    },
    payload: {
      prompt:
        "Marcus buys 8 pounds of potatoes for 12 dollars. Tia buys 5 pounds of potatoes for 9 dollars. Who paid less for each pound? Use unit rates.",
      structure: [
        { part: "Claim", frame: "___ paid less for each pound." },
        {
          part: "Reason",
          frame: "I found the unit rate for each person because ___.",
        },
        {
          part: "Evidence",
          frame:
            "Marcus paid ___ dollars per pound and Tia paid ___ dollars per pound, so ___.",
        },
      ],
      word_bank: [
        "unit rate",
        "per",
        "each",
        "divided by",
        "paid less",
        "because",
        "so",
        "pound",
      ],
      checklist: [
        "I named the person who paid less.",
        "I gave a reason with because or since.",
        "I used the words unit rate, each and per.",
        "I showed the division for both people.",
      ],
      model:
        "Marcus paid less for each pound. I found the unit rate for each person because the unit rate tells the price of one pound. Marcus paid 1.50 dollars per pound since 12 ÷ 8 = 1.50, and Tia paid 1.80 dollars per pound since 9 ÷ 5 = 1.80, so Marcus paid less.",
    },
  },
  exit_check: exit5,
  teacher_card: {
    minutes: 27,
    materials: [
      "Counters or cubes, 10 for every pair",
      "Price tags on index cards",
      "Whiteboards",
      "Device with sound for each pair",
    ],
    listen_for: [
      "Students say the word “per” followed by exactly one thing, such as per pound.",
      "Students say which number divides which, and tell why.",
      "Students use “each” and “per” to say the same unit rate in two ways.",
    ],
    watchouts: [
      "Dividing in the wrong order: students find 3 ÷ 12 = 0.25 and say 0.25 dollars per pound. Ask what the sentence is about, one pound or one dollar.",
      "Per misuse: students say “4 dollars per 1 pound each” or “per of pound”. Model the clean frame “___ dollars per pound” and “each pound costs ___ dollars.”",
      "Spanish uses a comma for the decimal (2,50), and “por” also means times, so students may write 2,50 or hear “por” as multiply. Accept the spoken meaning, then model the decimal point in writing.",
    ],
    differentiation: {
      l1_2: "Use counters, a price card and the frame “Each ___ costs ___ dollars.”",
      l3_4: "Divide and say the unit rate with “each” and with “per” and show the division in a number sentence.",
      l5_6: "Explain why the order of the division matters and compare two unit rates with a conclusion.",
      newcomer:
        "Use Point and Say the Price, Share the Counters and the Home Language Bridge, and accept counter groups and pointing as answers.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

const exit6 = {
  kind: "exit_check",
  domain: "Reading",
  title: "Rate Problem Check",
  mission:
    "Answer three questions about a bus, muffins and a justification, then rate how well you can solve a rate problem and explain each step.",
  grouping: "Solo",
  minutes: 3,
  tip: "Collect the can-do ratings and note which students still add or multiply the totals instead of finding the unit rate first.",
  support: {
    l1_2: "Listen to each question with the audio button, then tap an answer.",
    l3_4: "Read each question, tap an answer, and read the reason.",
    l5_6: "Answer, read the reason, and write the unit rate for each question before you rate yourself.",
  },
  payload: {
    can_do: "I can solve a rate problem and justify each step.",
    items: [
      {
        q: "A bus travels 150 miles in 3 hours. How far does it go in 5 hours at the same speed?",
        options: ["152 miles", "250 miles", "30 miles"],
        answer: 1,
        why: "150 ÷ 3 = 50 miles for each hour, and 50 × 5 = 250 miles. 152 adds the 2 extra hours as if they were miles, and 30 divides 150 by 5.",
      },
      {
        q: "8 muffins cost 12 dollars. How much do 20 muffins cost at the same price for each muffin?",
        options: ["240 dollars", "24 dollars", "30 dollars"],
        answer: 2,
        why: "12 ÷ 8 = 1.50 dollars for 1 muffin, and 1.50 × 20 = 30 dollars. 240 multiplies 12 by 20, and 24 adds 12 more dollars for 12 more muffins, as if each extra muffin cost 1 dollar.",
      },
      {
        q: "Which sentence best justifies that 20 muffins cost 30 dollars?",
        options: [
          "Each muffin costs 1.50 dollars because 12 ÷ 8 = 1.50, so 20 muffins cost 30 dollars because 1.50 × 20 = 30.",
          "20 muffins cost 30 dollars because 30 is a good number.",
          "20 muffins cost 30 dollars because 20 + 10 = 30.",
        ],
        answer: 0,
        why: "A good justification names the unit rate and the operation. “A good number” is not a reason, and 20 + 10 = 30 uses a number that does not come from the problem.",
      },
    ],
  },
};

const lesson6 = {
  id: "g6-math-u2-l06",
  unit_id: "g6-math-u2",
  version: 1,
  sequence: 6,
  source: "authored",
  title: "Solve a rate problem and justify each step",
  core_lesson_ref: {
    label: "Language session 6: rate problems",
    source: "language_pathway",
  },
  content_objective:
    "Students solve speed and price problems by finding the unit rate first and then multiplying, and they critique and correct a classmate's mistaken solution.",
  language_objective: {
    klu: "Argue",
    function:
      "justify a rate solution and correct a classmate's mistake with a reason",
    forms: [
      "I disagree because [reason]. The correct answer is [number] because [number] ÷ [number] = [number].",
      "Since [unit rate], [answer] because [number] × [number] = [number].",
    ],
    by_level: {
      l1_2: "I can point to the wrong step in a rate solution and say the right step with a frame and a word bank.",
      l3_4: "I can critique a mistake, correct it, and clarify my correction with a because sentence.",
      l5_6: "I can justify every step of a rate solution and explain why a tempting wrong method fails.",
    },
  },
  standards: ["6.RP.A.2", "6.RP.A.3", "6.RP.A.3b"],
  wida: {
    framework: "2020",
    language_expectation: "Math.6-8.Argue.Expressive",
    pld_targets: ["discourse", "sentence", "word"],
  },
  vocab: [
    { term: "justify", tier: 2, new_or_review: "new" },
    { term: "speed", tier: 2, new_or_review: "new" },
    { term: "disagree", tier: 2, new_or_review: "new" },
    { term: "unit rate", tier: 3, new_or_review: "review" },
    { term: "rate", tier: 3, new_or_review: "review" },
  ],
  mentor_sentence: {
    text: "Since the cyclist rides 18 miles in 3 hours, her speed is 6 miles per hour, so she rides 30 miles in 5 hours because 6 times 5 equals 30.",
    chunks: [
      {
        text: "Since the cyclist rides 18 miles in 3 hours,",
        role: "The given rate",
        tone: "concept",
        ask: "Which two amounts does the rate compare?",
      },
      {
        text: "her speed is 6 miles per hour,",
        role: "The unit rate",
        tone: "precision",
        ask: "What did the speaker divide to get 6?",
      },
      {
        text: "so",
        role: "The result signal",
        tone: "connector",
        ask: "Which word tells you the answer is coming?",
      },
      {
        text: "she rides 30 miles in 5 hours",
        role: "The answer",
        tone: "concept",
        ask: "How far does the cyclist ride in 5 hours?",
      },
      {
        text: "because 6 times 5 equals 30.",
        role: "The justification",
        tone: "evidence",
        ask: "Which multiplication proves the answer?",
      },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Unit Rate Flip Cards",
        mission:
          "Flip each card to check how you find a unit rate and what the word justify asks you to do.",
        grouping: "Partners",
        minutes: 4,
        tip: "Partners quiz each other, and any missed card goes back into the pile for another round.",
        support: {
          l1_2: "Point to the icon, say the answer, then flip to check.",
          l3_4: "Answer in a full sentence before you flip the card.",
          l5_6: "Answer, flip, and then make up a new unit rate question for your partner.",
        },
        payload: {
          cards: [
            {
              prompt: "What is the unit rate for 12 dollars for 3 pounds?",
              answer: "4 dollars per pound, because 12 ÷ 3 = 4.",
              icon: "🏷️",
            },
            {
              prompt: "Which operation finds a unit rate?",
              answer: "Division. You divide the total by the number of units.",
              icon: "➗",
            },
            {
              prompt: "What is 18 ÷ 3?",
              answer: "6, because 3 equal groups of 6 make 18.",
              icon: "🔢",
            },
            {
              prompt: "What does “justify” mean?",
              answer: "To give a reason that shows your answer is right.",
              icon: "💬",
            },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "Rate Problem Listen and Tap",
        mission:
          "Listen to a classmate's rate plan about Dee's bike and a notebook sale, and tap the step that fixes or finishes it.",
        grouping: "Solo",
        minutes: 5,
        tip: "Play each sentence twice and ask students to hold up fingers for the number of steps they hear before they tap.",
        support: {
          l1_2: "Listen once, tap, then listen again with the words showing.",
          l3_4: "Tap, then say the whole sentence back to a partner.",
          l5_6: "Tap, then explain to a partner why the other two steps do not work.",
        },
        payload: {
          items: [
            {
              say: "Dee's bike goes 20 miles in 4 hours. She says the speed is 80 miles per hour because she multiplied 20 by 4. What should she do instead?",
              options: [
                { label: "Multiply 20 by 4 to get 80 miles per hour" },
                { label: "Divide 20 by 4 to get 5 miles per hour", icon: "🚴" },
                { label: "Add 20 and 4 to get 24 miles per hour" },
              ],
              answer: 1,
              why: "A speed is the miles for 1 hour, so divide the miles by the hours: 20 ÷ 4 = 5 miles per hour. Multiplying gives 80 and adding gives 24, and neither is the miles for 1 hour.",
            },
            {
              say: "A store sells 6 notebooks for 9 dollars. What should you do first to find the cost of 10 notebooks?",
              options: [
                {
                  label: "Find the cost of 1 notebook: 9 ÷ 6 = 1.50 dollars",
                  icon: "📓",
                },
                { label: "Add 10 and 9 to get 19 dollars" },
                { label: "Multiply 6 by 9 to get 54 dollars" },
              ],
              answer: 0,
              why: "The unit rate comes first: 9 ÷ 6 = 1.50 dollars for 1 notebook. Then you multiply by 10. Adding 10 and 9 or multiplying 6 by 9 mixes up the units.",
            },
            {
              say: "The cyclist rides 6 miles each hour. How far does she ride in 5 hours?",
              options: [
                { label: "11 miles" },
                { label: "1.2 miles" },
                { label: "30 miles", icon: "🛣️" },
              ],
              answer: 2,
              why: "6 miles each hour for 5 hours is 6 × 5 = 30 miles. Adding gives 11 and dividing gives 1.2, but “each hour” calls for equal groups, so you multiply.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 4,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Justification Sentence X-Ray",
        mission:
          "Look inside the sentence that starts “Since the cyclist rides 18 miles in 3 hours” and rebuild its chunks in order.",
        grouping: "Whole Class",
        minutes: 4,
        tip: "Ask students which chunk would change if the cyclist rode for 7 hours instead of 5.",
        support: {
          l1_2: "Tap each colored chunk and listen to it.",
          l3_4: "Rebuild the sentence, then say the job of each chunk.",
          l5_6: "Rebuild it, then write a new sentence about a bus that goes 150 miles in 3 hours with the same chunks.",
        },
        payload: {
          text: "Since the cyclist rides 18 miles in 3 hours, her speed is 6 miles per hour, so she rides 30 miles in 5 hours because 6 times 5 equals 30.",
          chunks: [
            {
              text: "Since the cyclist rides 18 miles in 3 hours,",
              role: "The given rate",
              tone: "concept",
            },
            {
              text: "her speed is 6 miles per hour,",
              role: "The unit rate",
              tone: "precision",
            },
            { text: "so", role: "The result signal", tone: "connector" },
            {
              text: "she rides 30 miles in 5 hours",
              role: "The answer",
              tone: "concept",
            },
            {
              text: "because 6 times 5 equals 30.",
              role: "The justification",
              tone: "evidence",
            },
          ],
          ask: "Which chunk is the justification, and what does it prove?",
        },
      },
    },
    {
      step: "interact",
      minutes: 7,
      activity: {
        kind: "error_analysis",
        domain: "Writing",
        title: "Critique, Correct, Clarify",
        mission:
          "Find the mistake in each of four classmates' rate solutions, pick the best correction, and tell your partner why the wrong method fails.",
        grouping: "Partners",
        minutes: 7,
        tip: "Press partners to say what the classmate did and why it feels right before they say why it is wrong.",
        support: {
          l1_2: "Read the wrong sentence aloud and point to the number that looks wrong.",
          l3_4: "Say “I disagree because ___” before you pick a correction.",
          l5_6: "Pick the correction, then write your own sentence that makes the same mistake and fix it.",
        },
        payload: {
          items: [
            {
              wrong:
                "Dee rides 20 miles in 4 hours, so her speed is 80 miles per hour.",
              options: [
                "Her speed is 5 miles per hour because 20 ÷ 4 = 5.",
                "Her speed is 24 miles per hour because 20 + 4 = 24.",
                "Her speed is 0.2 miles per hour because 4 ÷ 20 = 0.2.",
              ],
              answer: 0,
              why: "A speed is the miles for 1 hour, so you divide the miles by the hours: 20 ÷ 4 = 5. Dividing 4 by 20 flips the units.",
              type: "wrong operation",
            },
            {
              wrong:
                "6 notebooks cost 9 dollars, so 10 notebooks cost 13 dollars because 9 + 4 = 13.",
              options: [
                "10 notebooks cost 90 dollars because 9 × 10 = 90.",
                "10 notebooks cost 1.50 dollars because one notebook costs 1.50 dollars.",
                "10 notebooks cost 15 dollars because each notebook costs 1.50 dollars and 1.50 × 10 = 15.",
              ],
              answer: 2,
              why: "Adding does not work for rates. Each notebook costs 9 ÷ 6 = 1.50 dollars, and 10 notebooks cost 1.50 × 10 = 15 dollars.",
              type: "adding instead of using the unit rate",
            },
            {
              wrong:
                "Rice costs 12 dollars for 8 pounds and beans cost 9 dollars for 5 pounds, so rice costs more per pound because 12 is more than 9.",
              options: [
                "Rice costs more per pound because 8 is more than 5.",
                "Beans cost more per pound, because rice is 1.50 dollars per pound and beans are 1.80 dollars per pound.",
                "Rice and beans cost the same per pound because 12 − 8 = 4 and 9 − 5 = 4.",
              ],
              answer: 1,
              why: "Compare unit rates, not totals: 12 ÷ 8 = 1.50 and 9 ÷ 5 = 1.80, so beans cost more for each pound.",
              type: "comparing totals",
            },
            {
              wrong: "15 dollars for 6 tickets is 25 dollars per ticket.",
              options: [
                "The unit rate is 0.4 dollars per ticket because 6 ÷ 15 = 0.4.",
                "The unit rate is 90 dollars per ticket because 15 × 6 = 90.",
                "The unit rate is 2.50 dollars per ticket because 15 ÷ 6 = 2.5.",
              ],
              answer: 2,
              why: "15 ÷ 6 = 2.5, so each ticket costs 2.50 dollars. The decimal point belongs after the 2, not after the 25.",
              type: "decimal point",
            },
          ],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Critique and Correct Out Loud",
        mission:
          "Record yourself telling a classmate what went wrong in the bike speed solution, correcting it, and clarifying with a reason.",
        grouping: "Solo",
        minutes: 5,
        klu: "Argue",
        tip: "Recordings stay on the student's device, so ask a partner to listen for a kind disagreement and a reason.",
        support: {
          l1_2: "Say one sentence with the frame and the word bank.",
          l3_4: "Say the frame and show the division with a quick drawing.",
          l5_6: "Say the frame, then explain why 24 + 4 would also give the wrong answer.",
        },
        payload: {
          prompt:
            "A classmate says: “A bike goes 24 miles in 4 hours, so the speed is 96 miles per hour.” Tell your classmate what went wrong, correct it, and clarify with a reason.",
          frame:
            "I disagree because ___. The correct speed is ___ miles per hour because ___ ÷ ___ = ___.",
          model:
            "I disagree because a speed tells the miles for 1 hour, so you divide instead of multiply. The correct speed is 6 miles per hour because 24 ÷ 4 = 6.",
          checklist: [
            "I said what went wrong in a kind way.",
            "I gave the correct answer with its unit.",
            "I used “because” and showed the division.",
          ],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit6,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Vocabulary",
      title: "Point and Say Speed and Price",
      mission:
        "Point to the bike, the notebook and the bus in each picture, say the word, then say its sentence.",
      grouping: "Partners",
      minutes: 5,
      tip: "No reading is needed, so show each picture cue, say the word, and let the student repeat it.",
      support: {
        l1_2: "Point and say one word at a time with your partner.",
        l3_4: "Point, say the word, and say the whole sentence.",
        l5_6: "Say the sentence, then change the numbers to make your own.",
      },
      payload: {
        items: [
          {
            term: "speed",
            icon: "🚴",
            cue: "A bicycle with an arrow and a sign that says 5 miles in 1 hour.",
            say: "The speed of the bike is 5 miles per hour.",
            es: "velocidad",
          },
          {
            term: "price",
            icon: "🏷️",
            cue: "One notebook with a tag that says 1.50 dollars.",
            say: "The price of one notebook is 1.50 dollars.",
            es: "precio",
          },
          {
            term: "miles per hour",
            icon: "🛣️",
            cue: "A bus beside a road sign and a clock that shows 1 hour.",
            say: "The bus goes 50 miles per hour.",
            es: "millas por hora",
          },
          {
            term: "explain",
            icon: "🗣️",
            cue: "A student points at numbers on paper while talking to a partner.",
            say: "I explain my steps to my partner.",
            es: "explicar",
          },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Groups of Counters",
      mission:
        "Listen to each command and build equal groups of counters to show a rate.",
      grouping: "Whole Class",
      minutes: 4,
      tip: "Model one group of 3 counters first, then let students build the other groups from the commands.",
      support: {
        l1_2: "Copy the action with a partner.",
        l3_4: "Do the action on your own.",
        l5_6: "Give the command to a partner and check the groups.",
      },
      payload: {
        items: [
          {
            command: "Make 4 groups with 3 counters in each group.",
            icon: "🟰",
          },
          { command: "Point to one group and hold up 3 fingers.", icon: "☝️" },
          { command: "Add 2 more groups of 3 counters.", icon: "➕" },
          {
            command:
              "Count all of the counters and write the number on a card.",
            icon: "✏️",
          },
          {
            command: "Give a thumbs up if each group still has 3 counters.",
            icon: "👍",
          },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Speed",
      mission:
        "Say speed, justify and per hour in English and in your home language, then use one of them to talk about a bike ride.",
      grouping: "Partners",
      minutes: 4,
      tip: "Invite students to add the word in any language they know, since the Spanish glosses are teacher-reviewed drafts.",
      support: {
        l1_2: "Say both words with your partner.",
        l3_4: "Say both words and tell one way they are alike or different.",
        l5_6: "Use both words in a sentence in each language.",
      },
      payload: {
        items: [
          {
            term: "speed",
            es: "velocidad",
            note: "Spanish also says “rapidez” for how fast something goes. In rate problems, use speed for miles per hour.",
          },
          {
            term: "justify",
            es: "justificar",
            note: "A cognate. To justify an answer means to give the reason it is right.",
          },
          {
            term: "per hour",
            es: "por hora",
            note: "“Por hora” means per hour, so “50 millas por hora” is 50 miles per hour.",
          },
        ],
      },
    },
  ],
  extension: {
    kind: "write_scaffold",
    domain: "Writing",
    title: "Which Bike Is Faster?",
    mission:
      "Write which bike is faster, Bike A or Bike B, and justify your claim with two speeds.",
    grouping: "Solo",
    minutes: 8,
    klu: "Argue",
    tip: "Score with the checklist, because the model is a target and not a script.",
    support: {
      l1_2: "Use the frame for each part and write the miles and hours first.",
      l3_4: "Write all three parts and use “because” once.",
      l5_6: "Write all three parts, add “since,” and explain why comparing the miles alone does not work.",
    },
    payload: {
      prompt:
        "Bike A rides 24 miles in 3 hours. Bike B rides 35 miles in 5 hours. Which bike is faster? Justify your answer with unit rates.",
      structure: [
        { part: "Claim", frame: "Bike ___ is faster." },
        { part: "Reason", frame: "I found each speed by ___." },
        {
          part: "Evidence",
          frame:
            "Bike A rides ___ miles per hour and Bike B rides ___ miles per hour, so ___.",
        },
      ],
      word_bank: [
        "speed",
        "unit rate",
        "miles per hour",
        "divided by",
        "faster",
        "because",
        "so",
        "each hour",
      ],
      checklist: [
        "I named the faster bike.",
        "I explained that I divided the miles by the hours.",
        "I gave both speeds with their units.",
        "I used because or since.",
      ],
      model:
        "Bike A is faster. I found each speed by dividing the miles by the hours. Bike A rides 8 miles per hour since 24 ÷ 3 = 8, and Bike B rides 7 miles per hour since 35 ÷ 5 = 7, so Bike A goes farther in each hour.",
    },
  },
  exit_check: exit6,
  teacher_card: {
    minutes: 28,
    materials: [
      "Counters or cubes",
      "Rate problem strips on index cards",
      "Whiteboards",
      "Device with sound for each pair",
    ],
    listen_for: [
      "Students find the unit rate first and then multiply or divide to reach the answer.",
      "Students start a correction with “I disagree because” and give a reason about the mathematics.",
      "Students use the units in every answer, such as 5 miles per hour or 15 dollars.",
    ],
    watchouts: [
      "Adding instead of using the unit rate: students go from 6 to 10 notebooks, add 4 to 9 dollars and get 13. Ask what one notebook costs first.",
      "Comparing totals: students say 12 dollars is more than 9 dollars, so rice costs more. Ask whether the two stands sell the same number of pounds.",
      "Disagreeing in English: Spanish speakers may say “I no agree,” and French or Haitian Creole speakers may say “I am not agree.” Model “I disagree because ___,” and watch for a dropped decimal point such as 25 for 2.5.",
    ],
    differentiation: {
      l1_2: "Use counters and the frame “I disagree because ___. The correct answer is ___.”",
      l3_4: "Critique, correct and clarify in three short sentences, with the division shown.",
      l5_6: "Justify every step and explain why a tempting wrong method fails, then write a new problem with the same trap.",
      newcomer:
        "Use Point and Say Speed and Price, Groups of Counters and the Home Language Bridge, and accept counters and pointing as answers.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

const exit7 = {
  kind: "exit_check",
  domain: "Reading",
  title: "Percent Meaning Check",
  mission:
    "Answer three questions about what percent means and how to write a rate per 100, then rate how well you can explain a percent.",
  grouping: "Solo",
  minutes: 3,
  tip: "Collect the can-do ratings and note which students still copy the count as the percent.",
  support: {
    l1_2: "Listen to each question with the audio button, then tap an answer.",
    l3_4: "Read each question, tap an answer, and read the reason.",
    l5_6: "Answer, read the reason, and write the multiplication for each choice before you rate yourself.",
  },
  payload: {
    can_do: "I can say what a percent means and write a rate per 100.",
    items: [
      {
        q: "What does 70 percent mean?",
        options: [
          "70 out of every 100",
          "70 out of every 70",
          "7 out of every 100",
        ],
        answer: 0,
        why: "Percent means per 100, so 70 percent is 70 out of every 100. 70 out of 70 is everything, and 7 out of 100 is only 7 percent.",
      },
      {
        q: "12 out of 25 students have a pet. What percent is that?",
        options: ["37 percent", "48 percent", "12 percent"],
        answer: 1,
        why: "25 × 4 = 100 and 12 × 4 = 48, so 12 out of 25 is 48 out of 100, or 48 percent. 12 percent copies the count, and 37 adds 12 + 25.",
      },
      {
        q: "Which sentence is correct about 8 out of 20 students?",
        options: [
          "8 out of 20 is 28 percent because 8 + 20 = 28.",
          "8 out of 20 is 8 percent because 8 is the first number.",
          "8 out of 20 is 40 percent because both numbers were multiplied by 5.",
        ],
        answer: 2,
        why: "20 × 5 = 100 and 8 × 5 = 40, so 8 out of 20 is 40 out of 100. Adding the numbers or copying the first number does not give a rate per 100.",
      },
    ],
  },
};

const lesson7 = {
  id: "g6-math-u2-l07",
  unit_id: "g6-math-u2",
  version: 1,
  sequence: 7,
  source: "authored",
  title: "Say what percent means as a rate per 100",
  core_lesson_ref: {
    label: "Language session 7: percent",
    source: "language_pathway",
  },
  content_objective:
    "Students explain that a percent is a rate per 100, write a ratio as an equivalent ratio out of 100, and use it to describe survey data.",
  language_objective: {
    klu: "Explain",
    function:
      "explain what a percent means and show how a ratio becomes a rate per 100",
    forms: [
      "[Number] percent means [number] out of every 100.",
      "[Number] out of [number] is equivalent to [number] out of 100 because both numbers were multiplied by [number].",
    ],
    by_level: {
      l1_2: "I can say “25 percent means 25 out of every 100” and point to the shaded squares on a 10 by 10 grid.",
      l3_4: "I can write a ratio as a rate per 100 and say the percent with a because sentence.",
      l5_6: "I can compare two surveys with different totals and explain why the same count does not give the same percent.",
    },
  },
  standards: ["6.RP.A.3", "6.RP.A.3c"],
  wida: {
    framework: "2020",
    language_expectation: "Math.6-8.Explain.Expressive",
    pld_targets: ["sentence", "word"],
  },
  vocab: [
    { term: "percent", tier: 2, new_or_review: "new" },
    { term: "out of", tier: 2, new_or_review: "new" },
    { term: "survey", tier: 2, new_or_review: "new" },
    { term: "rate", tier: 3, new_or_review: "review" },
    { term: "equivalent ratio", tier: 3, new_or_review: "review" },
  ],
  mentor_sentence: {
    text: "Percent means per 100, so 40 percent means 40 out of every 100, which equals 20 out of 50 because both numbers were divided by 2.",
    chunks: [
      {
        text: "Percent means per 100,",
        role: "The big idea",
        tone: "concept",
        ask: "What number is every percent compared to?",
      },
      {
        text: "so",
        role: "The result signal",
        tone: "connector",
        ask: "Which word tells you an example is coming?",
      },
      {
        text: "40 percent means 40 out of every 100,",
        role: "The percent as a rate",
        tone: "precision",
        ask: "How many out of every 100 is 40 percent?",
      },
      {
        text: "which equals 20 out of 50 because both numbers were divided by 2.",
        role: "The equivalent rate and its proof",
        tone: "evidence",
        ask: "What was done to 40 and to 100 to get 20 and 50?",
      },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Per 100 Flip Cards",
        mission:
          "Flip each card to check what per means and how equivalent ratios work before you meet percent.",
        grouping: "Partners",
        minutes: 4,
        tip: "Partners quiz each other, and any missed card goes back into the pile for another round.",
        support: {
          l1_2: "Point to the icon, say the answer, then flip to check.",
          l3_4: "Answer in a full sentence before you flip the card.",
          l5_6: "Answer, flip, and then make up a new equivalent ratio question for your partner.",
        },
        payload: {
          cards: [
            {
              prompt: "What does “per” mean in math?",
              answer: "“Per” means for each one or for every one.",
              icon: "☝️",
            },
            {
              prompt: "Is 20 out of 50 equivalent to 40 out of 100? Why?",
              answer:
                "Yes. Both numbers were multiplied by 2: 20 × 2 = 40 and 50 × 2 = 100.",
              icon: "🟰",
            },
            {
              prompt: "What is 100 ÷ 4?",
              answer: "25, because 4 equal groups of 25 make 100.",
              icon: "➗",
            },
            {
              prompt: "What is the unit rate for 12 dollars for 3 pounds?",
              answer: "4 dollars per pound, because 12 ÷ 3 = 4.",
              icon: "🏷️",
            },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "Percent Listen and Tap",
        mission:
          "Listen to each sentence about a school survey or a grid of 100 squares and tap what the percent means.",
        grouping: "Solo",
        minutes: 5,
        tip: "Draw a 10 by 10 grid on the board and shade it as you read each sentence, then play the sentence again without the picture.",
        support: {
          l1_2: "Listen once, tap, then listen again with the words showing.",
          l3_4: "Tap, then say the whole sentence back to a partner.",
          l5_6: "Tap, then explain to a partner how you know.",
        },
        payload: {
          items: [
            {
              say: "Twenty-five percent of the students walk to school. What does twenty-five percent mean?",
              options: [
                { label: "25 students walk" },
                { label: "25 out of every 100 students walk", icon: "🚶" },
                { label: "25 out of every 25 students walk" },
              ],
              answer: 1,
              why: "Percent means per 100, so 25 percent means 25 out of every 100. It does not tell the exact number of students, and 25 out of 25 would be everyone.",
            },
            {
              say: "A grid has 100 squares, and 60 squares are shaded blue. What percent is blue?",
              options: [
                { label: "60 percent", icon: "🟦" },
                { label: "40 percent" },
                { label: "100 percent" },
              ],
              answer: 0,
              why: "The grid has 100 squares, so the number shaded is the percent: 60 out of 100 is 60 percent. 40 percent is the part that is not shaded.",
            },
            {
              say: "In a survey of 50 students, 20 students chose pizza. Which percent chose pizza?",
              options: [
                { label: "70 percent" },
                { label: "20 percent" },
                { label: "40 percent", icon: "🍕" },
              ],
              answer: 2,
              why: "50 × 2 = 100 and 20 × 2 = 40, so 20 out of 50 is 40 out of 100, or 40 percent. 20 percent copies the count, and 70 adds 20 + 50.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 4,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Percent Sentence X-Ray",
        mission:
          "Look inside the sentence that starts “Percent means per 100” and rebuild its chunks in order.",
        grouping: "Whole Class",
        minutes: 4,
        tip: "Ask students which chunk would change if the example were 60 percent, and which chunk would stay the same.",
        support: {
          l1_2: "Tap each colored chunk and listen to it.",
          l3_4: "Rebuild the sentence, then say the job of each chunk.",
          l5_6: "Rebuild it, then write a new sentence about 60 percent and 30 out of 50 with the same chunks.",
        },
        payload: {
          text: "Percent means per 100, so 40 percent means 40 out of every 100, which equals 20 out of 50 because both numbers were divided by 2.",
          chunks: [
            {
              text: "Percent means per 100,",
              role: "The big idea",
              tone: "concept",
            },
            { text: "so", role: "The result signal", tone: "connector" },
            {
              text: "40 percent means 40 out of every 100,",
              role: "The percent as a rate",
              tone: "precision",
            },
            {
              text: "which equals 20 out of 50 because both numbers were divided by 2.",
              role: "The equivalent rate and its proof",
              tone: "evidence",
            },
          ],
          ask: "Which chunk gives the proof, and what was done to both numbers?",
        },
      },
    },
    {
      step: "interact",
      minutes: 7,
      activity: {
        kind: "sentence_combine",
        domain: "Writing",
        title: "Link the Percent Ideas",
        mission:
          "Join each group of short sentences about percents with so, because, while or since to build four clear sentences with your partner.",
        grouping: "Partners",
        minutes: 7,
        tip: "Compare combinations and ask partners which connector shows a reason and which one shows a contrast.",
        support: {
          l1_2: "Copy the model, then change the numbers.",
          l3_4: "Combine using the connector and read it aloud.",
          l5_6: "Combine, then move the connector to the front of the sentence.",
        },
        payload: {
          items: [
            {
              sentences: [
                "Percent means per 100.",
                "30 percent means 30 out of every 100.",
              ],
              connector: "so",
              model:
                "Percent means per 100, so 30 percent means 30 out of every 100.",
            },
            {
              sentences: [
                "9 out of 25 is equivalent to 36 out of 100.",
                "Both numbers were multiplied by 4.",
              ],
              connector: "because",
              model:
                "9 out of 25 is equivalent to 36 out of 100 because both numbers were multiplied by 4.",
            },
            {
              sentences: [
                "A ratio can compare any two amounts.",
                "A percent always compares a number to 100.",
              ],
              connector: "while",
              model:
                "A ratio can compare any two amounts, while a percent always compares a number to 100.",
            },
            {
              sentences: [
                "17 out of 50 students walk.",
                "34 out of every 100 students walk.",
                "That is 34 percent.",
              ],
              connector: "since",
              model:
                "Since 17 out of 50 students walk, 34 out of every 100 students walk, and that is 34 percent.",
            },
          ],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Say the Percent Out Loud",
        mission:
          "Record yourself telling what percent of 20 students chose art and how you know it is a rate per 100.",
        grouping: "Solo",
        minutes: 5,
        klu: "Explain",
        tip: "Recordings stay on the student's device, so ask a partner to listen for both numbers being multiplied by 5.",
        support: {
          l1_2: "Say one sentence with the frame and point to the grid.",
          l3_4: "Say the frame, then say what the percent means in words.",
          l5_6: "Say the frame, then explain why the same 9 students out of 30 would give a different percent.",
        },
        payload: {
          prompt:
            "A survey of 20 students found that 9 students chose art as their favorite class. Tell what percent chose art and how you know.",
          frame:
            "___ out of ___ is equivalent to ___ out of 100 because I multiplied both numbers by ___, so ___ percent chose art.",
          model:
            "9 out of 20 is equivalent to 45 out of 100 because I multiplied both numbers by 5, so 45 percent chose art.",
          checklist: [
            "I said the equivalent ratio out of 100.",
            "I named the number I multiplied both parts by.",
            "I said what the percent means in a full sentence.",
          ],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit7,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Vocabulary",
      title: "Point and Say the Grid",
      mission:
        "Point to the shaded squares and the whole grid in each picture, say the word, then say its sentence.",
      grouping: "Partners",
      minutes: 5,
      tip: "No reading is needed, so show each picture cue, say the word, and let the student repeat it.",
      support: {
        l1_2: "Point and say one word at a time with your partner.",
        l3_4: "Point, say the word, and say the whole sentence.",
        l5_6: "Say the sentence, then change the number of squares to make your own.",
      },
      payload: {
        items: [
          {
            term: "percent",
            icon: "💯",
            cue: "A 10 by 10 grid of 100 squares with 25 squares colored in.",
            say: "25 percent means 25 out of every 100.",
            es: "porcentaje",
          },
          {
            term: "out of",
            icon: "🔵",
            cue: "A small circle around 25 colored squares inside a big circle around all 100 squares.",
            say: "25 out of 100 squares are colored.",
            es: "de cada",
          },
          {
            term: "hundred",
            icon: "🟨",
            cue: "Ten rows with ten squares in each row make one full grid.",
            say: "There are 100 squares in the grid.",
            es: "cien",
          },
          {
            term: "shade",
            icon: "🖍️",
            cue: "A marker colors in one square of the grid.",
            say: "I shade one square.",
            es: "sombrear",
          },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Color the Grid",
      mission:
        "Listen to each command and show it on your grid of 100 squares.",
      grouping: "Whole Class",
      minutes: 4,
      tip: "Model coloring one row first, then let students follow the commands without help.",
      support: {
        l1_2: "Copy the action with a partner.",
        l3_4: "Do the action on your own.",
        l5_6: "Give the command to a partner and check the grid.",
      },
      payload: {
        items: [
          {
            command:
              "Look at the grid of 100 squares. Point to the whole grid.",
            icon: "🟦",
          },
          { command: "Point to one row of 10 squares.", icon: "👉" },
          { command: "Color all 10 squares in one row.", icon: "🖍️" },
          {
            command:
              "Color all 10 squares in a second row. Now 20 squares are colored.",
            icon: "🖍️",
          },
          {
            command:
              "Count the colored squares and show the number with your fingers, 10 fingers two times.",
            icon: "🙌",
          },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Percent",
      mission:
        "Say percent, out of and hundred in English and in your home language, then tell what the shaded grid shows.",
      grouping: "Partners",
      minutes: 4,
      tip: "Invite students to add the word in any language they know, since the Spanish glosses are teacher-reviewed drafts.",
      support: {
        l1_2: "Say both words with your partner.",
        l3_4: "Say both words and tell one way they are alike or different.",
        l5_6: "Use both words in a sentence in each language.",
      },
      payload: {
        items: [
          {
            term: "percent",
            es: "porcentaje",
            note: "Spanish also says “por ciento,” and “ciento” means hundred, so “por ciento” means per hundred. Write the symbol next to the number: 25%.",
          },
          {
            term: "out of",
            es: "de cada",
            note: "“De cada 100” means out of every 100, with the same order of words as the English.",
          },
          {
            term: "hundred",
            es: "cien",
            note: "“Cien” is the number 100 by itself. The word “ciento” appears in “por ciento.”",
          },
        ],
      },
    },
  ],
  extension: {
    kind: "write_scaffold",
    domain: "Writing",
    title: "Basketball Poll Report",
    mission:
      "Write what percent of 25 students chose basketball, and prove it with an equivalent rate out of 100.",
    grouping: "Solo",
    minutes: 8,
    klu: "Explain",
    tip: "Score with the checklist, because the model is a target and not a script.",
    support: {
      l1_2: "Use the frame for each part and write the multiplier first.",
      l3_4: "Write all three parts and use “because” once.",
      l5_6: "Write all three parts and add a sentence that compares this poll to 15 out of 50.",
    },
    payload: {
      prompt:
        "In a poll of 25 students at a Baltimore middle school, 15 students chose basketball as their favorite sport. Tell what percent chose basketball and explain how you know.",
      structure: [
        { part: "Claim", frame: "___ percent chose basketball." },
        {
          part: "Reason",
          frame: "15 out of 25 is equivalent to ___ out of 100 because ___.",
        },
        { part: "Proof", frame: "15 × ___ = ___ and 25 × ___ = 100, so ___." },
      ],
      word_bank: [
        "percent",
        "out of",
        "per 100",
        "equivalent",
        "multiplied",
        "both numbers",
        "because",
        "poll",
      ],
      checklist: [
        "I wrote the percent in a full sentence.",
        "I wrote the equivalent ratio out of 100.",
        "I named the number I multiplied by.",
        "I used “because” and showed both multiplications.",
      ],
      model:
        "60 percent chose basketball. 15 out of 25 is equivalent to 60 out of 100 because both numbers were multiplied by 4. 15 × 4 = 60 and 25 × 4 = 100, so 60 out of every 100 students would choose basketball.",
    },
  },
  exit_check: exit7,
  teacher_card: {
    minutes: 27,
    materials: [
      "10 by 10 grids on paper",
      "Colored pencils or markers",
      "Whiteboards",
      "Device with sound for each pair",
    ],
    listen_for: [
      "Students say “out of every 100” when they explain what a percent means.",
      "Students name the number they multiplied both parts by to reach 100.",
      "Students say that 25 percent is a rate, not a count of 25 people.",
    ],
    watchouts: [
      "Percent as a count: students say 25 percent of 80 students is 25 students. Ask whether the survey had 100 students.",
      "Equal counts, different totals: 12 out of 25 and 12 out of 50 are not the same percent. Have students write both as a rate out of 100.",
      "Spanish and French writers often put a space before the symbol (25 %), and Spanish speakers say “por ciento.” Accept the spoken meaning and model 25%.",
    ],
    differentiation: {
      l1_2: "Use a 10 by 10 grid and the frame “___ percent means ___ out of every 100.”",
      l3_4: "Write the ratio as a rate per 100 and say the percent with a because sentence.",
      l5_6: "Compare two surveys with different totals and explain why equal counts do not give equal percents.",
      newcomer:
        "Use Point and Say the Grid, Color the Grid and the Home Language Bridge, and accept grid coloring and pointing as answers.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

const exit8 = {
  kind: "exit_check",
  domain: "Reading",
  title: "Better Buy Check",
  mission:
    "Answer three questions about a bus plan, a pretzel stand and a juice sale, then rate how well you can argue for a fair choice.",
  grouping: "Solo",
  minutes: 3,
  tip: "Collect the can-do ratings and note which students still argue from the total price instead of the unit rate.",
  support: {
    l1_2: "Listen to each question with the audio button, then tap an answer.",
    l3_4: "Read each question, tap an answer, and read the reason.",
    l5_6: "Answer, read the reason, and write the unit rate for each choice before you rate yourself.",
  },
  payload: {
    can_do: "I can argue for a fair choice using unit rates and a reason.",
    items: [
      {
        q: "A bus plan sells 8 rides for 12 dollars. A single ride costs 2 dollars. Which is the better deal for each ride?",
        options: [
          "A single ride, because 2 dollars is less than 12 dollars.",
          "The plan, because 1.50 dollars per ride is less than 2 dollars per ride.",
          "They cost the same for each ride.",
        ],
        answer: 1,
        why: "12 ÷ 8 = 1.50 dollars per ride, which is less than 2 dollars. The total 12 dollars looks bigger, but it buys 8 rides.",
      },
      {
        q: "Stand C sells 5 pretzels for 10 dollars. Stand D sells 8 pretzels for 20 dollars. Which argument for Stand C is strongest?",
        options: [
          "Stand C is better because 10 dollars is less than 20 dollars.",
          "Stand C is better because it has fewer pretzels.",
          "Stand C is the better buy since it costs 2 dollars per pretzel, while Stand D costs 2.50 dollars per pretzel.",
        ],
        answer: 2,
        why: "The strongest argument compares unit rates: 10 ÷ 5 = 2 and 20 ÷ 8 = 2.50. Comparing the totals or the counts ignores that the stands sell different amounts.",
      },
      {
        q: "A store sells 6 bottles of juice for 9 dollars and a 12-pack for 18 dollars. How does the price for each bottle compare?",
        options: [
          "The price for each bottle is the same, 1.50 dollars, because both numbers were multiplied by 2.",
          "The 12-pack costs less for each bottle because there are more bottles.",
          "The 12-pack costs more for each bottle because 18 dollars is more than 9 dollars.",
        ],
        answer: 0,
        why: "6 × 2 = 12 and 9 × 2 = 18, so the 12-pack is an equivalent ratio. 9 ÷ 6 = 1.50 and 18 ÷ 12 = 1.50, so each bottle costs the same.",
      },
    ],
  },
};

const lesson8 = {
  id: "g6-math-u2-l08",
  unit_id: "g6-math-u2",
  version: 1,
  sequence: 8,
  source: "authored",
  title: "Argue for a fair choice at Lexington Market",
  core_lesson_ref: {
    label: "Language session 8: a fair choice",
    source: "language_pathway",
  },
  content_objective:
    "Students use unit rates, equivalent ratios and percent to compare two real prices, decide which is the better buy, and defend the decision with a claim, a reason and evidence.",
  language_objective: {
    klu: "Argue",
    function:
      "argue for a better buy with unit rates as evidence and answer a different view with although",
    forms: [
      "I recommend [choice] because [reason].",
      "Although [other view], the unit rates show that [conclusion].",
    ],
    by_level: {
      l1_2: "I can say which stand is the better buy and give one number as proof with a frame and a word bank.",
      l3_4: "I can state a claim, a reason with “because,” and evidence with two unit rates.",
      l5_6: "I can argue for a choice, answer a different view with “although,” and check it a second way with equivalent ratios.",
    },
  },
  standards: ["6.RP.A.2", "6.RP.A.3", "6.RP.A.3b", "6.RP.A.3c"],
  wida: {
    framework: "2020",
    language_expectation: "Math.6-8.Argue.Expressive",
    pld_targets: ["discourse", "sentence", "word"],
  },
  vocab: [
    { term: "better buy", tier: 2, new_or_review: "new" },
    { term: "although", tier: 2, new_or_review: "new" },
    { term: "unit rate", tier: 3, new_or_review: "review" },
    { term: "equivalent ratio", tier: 3, new_or_review: "review" },
    { term: "percent", tier: 2, new_or_review: "review" },
  ],
  mentor_sentence: {
    text: "Although Stand A looks cheaper because 34 dollars is less than 48 dollars, the unit rates show that Stand B is the better buy since it costs 8 dollars per crab cake while Stand A costs 8.50 dollars per crab cake.",
    chunks: [
      {
        text: "Although Stand A looks cheaper because 34 dollars is less than 48 dollars,",
        role: "The other view",
        tone: "concept",
        ask: "Why might someone think Stand A is cheaper?",
      },
      {
        text: "the unit rates show that Stand B is the better buy",
        role: "The claim",
        tone: "precision",
        ask: "Which stand does the speaker recommend?",
      },
      {
        text: "since",
        role: "The reason signal",
        tone: "connector",
        ask: "Which word tells you the evidence is coming?",
      },
      {
        text: "it costs 8 dollars per crab cake while Stand A costs 8.50 dollars per crab cake.",
        role: "The evidence",
        tone: "evidence",
        ask: "Which two unit rates does the speaker compare?",
      },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Better Buy Flip Cards",
        mission:
          "Flip each card to check how you find a unit rate, what although shows, and what a percent means before you judge two prices.",
        grouping: "Partners",
        minutes: 4,
        tip: "Partners quiz each other, and any missed card goes back into the pile for another round.",
        support: {
          l1_2: "Point to the icon, say the answer, then flip to check.",
          l3_4: "Answer in a full sentence before you flip the card.",
          l5_6: "Answer, flip, and then write a new question about a price for your partner.",
        },
        payload: {
          cards: [
            {
              prompt: "How do you find a unit rate?",
              answer: "Divide the total cost by the number of items.",
              icon: "➗",
            },
            {
              prompt: "What is 48 ÷ 6?",
              answer: "8, because 6 equal groups of 8 make 48.",
              icon: "🔢",
            },
            {
              prompt: "What does “although” show in a sentence?",
              answer:
                "It shows another idea that seems true, before you say what you really think.",
              icon: "🤔",
            },
            {
              prompt: "What does 20 percent mean?",
              answer: "20 out of every 100.",
              icon: "💯",
            },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "Crab Cake Listen and Tap",
        mission:
          "Listen to Mrs. Johnson compare two crab cake stands and tap the price or the reason that fits what you hear.",
        grouping: "Solo",
        minutes: 5,
        tip: "Write the two stand prices on the board and play each sentence twice before students tap.",
        support: {
          l1_2: "Listen once, tap, then listen again with the words showing.",
          l3_4: "Tap, then say the whole sentence back to a partner.",
          l5_6: "Tap, then explain to a partner why the other two choices do not work.",
        },
        payload: {
          items: [
            {
              say: "Stand A sells 4 crab cakes for 34 dollars. What is the price of 1 crab cake at Stand A?",
              options: [
                { label: "30 dollars" },
                { label: "8.50 dollars", icon: "🦀" },
                { label: "136 dollars" },
              ],
              answer: 1,
              why: "34 ÷ 4 = 8.50 dollars for 1 crab cake. Subtracting gives 30 and multiplying gives 136, and neither is the price of one.",
            },
            {
              say: "Stand B sells 6 crab cakes for 48 dollars. Mrs. Johnson says Stand A is the better buy because 34 dollars is less than 48 dollars. What is wrong with her reason?",
              options: [
                {
                  label:
                    "She compared the totals, but the stands sell different numbers of crab cakes.",
                  icon: "⚖️",
                },
                { label: "She forgot to add the two prices together." },
                { label: "She should only compare the number of crab cakes." },
              ],
              answer: 0,
              why: "She compared the total prices, but the stands sell different numbers of crab cakes. The price for one crab cake is the fair comparison.",
            },
            {
              say: "For 12 crab cakes, Stand A charges 102 dollars and Stand B charges 96 dollars. How much does Mrs. Johnson save at Stand B?",
              options: [
                { label: "198 dollars" },
                { label: "12 dollars" },
                { label: "6 dollars", icon: "💵" },
              ],
              answer: 2,
              why: "102 − 96 = 6 dollars. Adding the two prices gives 198, and 12 is the number of crab cakes, not the savings.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 4,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Argument Sentence X-Ray",
        mission:
          "Look inside the sentence that starts “Although Stand A looks cheaper” and rebuild its chunks in order.",
        grouping: "Whole Class",
        minutes: 4,
        tip: "Ask students to find the chunk that gives the other view and the chunk that gives the proof.",
        support: {
          l1_2: "Tap each colored chunk and listen to it.",
          l3_4: "Rebuild the sentence, then say the job of each chunk.",
          l5_6: "Rebuild it, then write a new sentence about Stand C and Stand D with the same chunks.",
        },
        payload: {
          text: "Although Stand A looks cheaper because 34 dollars is less than 48 dollars, the unit rates show that Stand B is the better buy since it costs 8 dollars per crab cake while Stand A costs 8.50 dollars per crab cake.",
          chunks: [
            {
              text: "Although Stand A looks cheaper because 34 dollars is less than 48 dollars,",
              role: "The other view",
              tone: "concept",
            },
            {
              text: "the unit rates show that Stand B is the better buy",
              role: "The claim",
              tone: "precision",
            },
            { text: "since", role: "The reason signal", tone: "connector" },
            {
              text: "it costs 8 dollars per crab cake while Stand A costs 8.50 dollars per crab cake.",
              role: "The evidence",
              tone: "evidence",
            },
          ],
          ask: "Which chunk gives the claim, and which chunk gives the proof?",
        },
      },
    },
    {
      step: "interact",
      minutes: 7,
      activity: {
        kind: "talk_cards",
        domain: "Speaking",
        title: "Better Buy Debate",
        mission:
          "Take turns drawing a card, starting with “Stand A sells 4 crab cakes for 34 dollars,” and defend your choice while your partner challenges it.",
        grouping: "Partners",
        minutes: 7,
        tip: "Listen for a claim, a reason and a number in every turn, and for “although” when a partner answers a different view.",
        materials: ["Debate cards", "Partner role cards"],
        support: {
          l1_2: "Point to the numbers and use the first frame word for word.",
          l3_4: "Give a reason with “because” on every turn.",
          l5_6: "Add “although” or “since” and a second way to check your answer.",
        },
        payload: {
          roles: { a: "Decider", b: "Challenger" },
          cards: [
            {
              prompt:
                "Stand A sells 4 crab cakes for 34 dollars. Stand B sells 6 crab cakes for 48 dollars. Which stand is the better buy?",
              starter: "Stand ___ is the better buy because ___.",
              follow_up: "How do you know your unit rates are correct?",
            },
            {
              prompt:
                "A friend says Stand A is cheaper because 34 dollars is less than 48 dollars. What do you say?",
              starter: "Although 34 dollars is less than 48 dollars, ___.",
              follow_up: "What did your friend forget to compare?",
            },
            {
              prompt:
                "Mrs. Johnson needs 12 crab cakes. What do 12 crab cakes cost at each stand?",
              starter:
                "At Stand A, 12 crab cakes cost ___ dollars because ___.",
              follow_up: "How could a ratio table help you check that?",
            },
            {
              prompt:
                "A fare plan sells 10 rides for 18 dollars. A single ride costs 2 dollars. Which is the better deal for each ride?",
              starter: "The plan costs ___ dollars per ride, so ___.",
              follow_up: "How much would you save on 10 rides?",
            },
            {
              prompt:
                "A shirt costs 50 dollars. The sign says 20 percent off. What does 20 percent mean here?",
              starter: "20 percent means ___ out of every ___, so ___.",
              follow_up:
                "How many dollars come off 50 dollars, and how do you know?",
            },
          ],
          moves: [
            {
              label: "Say more",
              stem: "Can you tell me more about your unit rate for ___?",
            },
            {
              label: "Show me",
              stem: "Can you show me that on a ratio table or a drawing?",
            },
            {
              label: "Challenge",
              stem: "I see it a different way. I think ___ because ___.",
            },
          ],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Recommend a Stand",
        mission:
          "Record your argument for which crab cake stand Mrs. Johnson should choose, with a claim, evidence and an answer to the lower total price.",
        grouping: "Solo",
        minutes: 5,
        klu: "Argue",
        tip: "Recordings stay on the student's device, so ask a partner to listen for a claim, two unit rates and the word although.",
        support: {
          l1_2: "Say the first part of the frame and name the stand and one price.",
          l3_4: "Say the whole frame and give both unit rates.",
          l5_6: "Say the frame, then check your claim a second way with the price of 12 crab cakes.",
        },
        payload: {
          prompt:
            "Mrs. Johnson needs to buy 12 crab cakes. Make your argument for the better stand: a claim, evidence, and what you say to someone who prefers the lower total price.",
          frame:
            "I recommend Stand ___ because ___. Although ___, the unit rates show that ___.",
          model:
            "I recommend Stand B because it costs less for each crab cake. Although Stand A has the lower total price, the unit rates show that Stand B costs 8 dollars per crab cake and Stand A costs 8.50 dollars per crab cake. For 12 crab cakes, Stand B saves 6 dollars.",
          checklist: [
            "I made a clear claim.",
            "I gave both unit rates as evidence.",
            "I answered a different view with “although”.",
          ],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit8,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Vocabulary",
      title: "Point and Say the Choice",
      mission:
        "Point to the two stands, their price tags and the check mark in each picture, say the word, then say its sentence.",
      grouping: "Partners",
      minutes: 5,
      tip: "No reading is needed, so show each picture cue, say the word, and let the student repeat it.",
      support: {
        l1_2: "Point and say one word at a time with your partner.",
        l3_4: "Point, say the word, and say the whole sentence.",
        l5_6: "Say the sentence, then change the prices to make your own.",
      },
      payload: {
        items: [
          {
            term: "better buy",
            icon: "✅",
            cue: "Two bags of crab cakes with price tags and a check mark on the bag with the lower price for one crab cake.",
            say: "Stand B is the better buy.",
            es: "mejor compra",
          },
          {
            term: "cheaper",
            icon: "⬇️",
            cue: "Two price tags, 8 dollars and 8.50 dollars, with an arrow pointing down at the 8 dollars tag.",
            say: "8 dollars is cheaper than 8.50 dollars.",
            es: "más barato",
          },
          {
            term: "compare",
            icon: "🔍",
            cue: "Two fingers point at two price tags, one tag for each finger.",
            say: "I compare the two prices.",
            es: "comparar",
          },
          {
            term: "choose",
            icon: "👆",
            cue: "A hand picks one of two bags of crab cakes.",
            say: "I choose the stand with the lower price for each crab cake.",
            es: "elegir",
          },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Choose the Better Buy",
      mission:
        "Listen to each command and use the crab cake and price cards to show your choice.",
      grouping: "Whole Class",
      minutes: 4,
      tip: "Model the first two commands with the cards, then let students follow the rest without help.",
      support: {
        l1_2: "Copy the action with a partner.",
        l3_4: "Do the action on your own.",
        l5_6: "Give the command to a partner and check the cards.",
      },
      payload: {
        items: [
          {
            command:
              "Put 4 crab cake cards in one pile and 6 crab cake cards in another pile.",
            icon: "🦀",
          },
          { command: "Point to the bigger pile.", icon: "👉" },
          {
            command:
              "Put a price card on each pile: 34 on the small pile and 48 on the big pile.",
            icon: "💵",
          },
          { command: "Point to the smaller price card.", icon: "👇" },
          {
            command:
              "Look at the price for one crab cake, 8.50 and 8. Point to the lower price.",
            icon: "🔍",
          },
          {
            command: "Choose a stand. Put your finger on the better buy.",
            icon: "✅",
          },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Choice",
      mission:
        "Say although, better buy and compare in English and in your home language, then tell a partner which stand you would choose.",
      grouping: "Partners",
      minutes: 4,
      tip: "Invite students to add the word in any language they know, since the Spanish glosses are teacher-reviewed drafts.",
      support: {
        l1_2: "Say both words with your partner.",
        l3_4: "Say both words and tell one way they are alike or different.",
        l5_6: "Use both words in a sentence in each language.",
      },
      payload: {
        items: [
          {
            term: "although",
            es: "aunque",
            note: "“Aunque” means although. Use it before the idea that seems true, and then say what you really think. English uses “although” or “but,” not both.",
          },
          {
            term: "better buy",
            es: "mejor compra",
            note: "“Mejor compra” means better buy. “Más barato” means cheaper, but the better buy compares the price of one.",
          },
          {
            term: "compare",
            es: "comparar",
            note: "A cognate. To compare prices, look at the same unit for both, such as one crab cake.",
          },
        ],
      },
    },
  ],
  extension: {
    kind: "write_scaffold",
    domain: "Writing",
    title: "Bus Plan Argument",
    mission:
      "Write an argument for a student who rides the bus 30 times about whether a 30-ride plan or single rides is the better choice.",
    grouping: "Solo",
    minutes: 8,
    klu: "Argue",
    tip: "Score with the checklist, because the model is a target and not a script.",
    support: {
      l1_2: "Use the frame for each part and write both prices per ride first.",
      l3_4: "Write all four parts and use “because” once.",
      l5_6: "Write all four parts and check the savings a second way with equivalent ratios.",
    },
    payload: {
      prompt:
        "A plan sells 30 rides for 48 dollars. A single ride costs 2 dollars. Write a short argument about which choice is better for a student who rides 30 times.",
      structure: [
        { part: "Claim", frame: "I recommend the ___ because ___." },
        {
          part: "Evidence",
          frame:
            "The plan costs ___ dollars per ride since ___ ÷ ___ = ___, and a single ride costs ___ dollars.",
        },
        { part: "Other view", frame: "Although ___, ___." },
        { part: "Savings", frame: "For 30 rides, the plan saves ___ dollars." },
      ],
      word_bank: [
        "better deal",
        "unit rate",
        "per ride",
        "although",
        "because",
        "since",
        "saves",
        "plan",
      ],
      checklist: [
        "I made a clear claim.",
        "I gave the unit rate of the plan and of a single ride.",
        "I answered a different view with “although”.",
        "I told how many dollars the plan saves.",
      ],
      model:
        "I recommend the plan because it costs less for each ride. The plan costs 1.60 dollars per ride since 48 ÷ 30 = 1.60, and a single ride costs 2 dollars. Although 48 dollars looks like a lot to pay at once, the plan saves 12 dollars on 30 rides.",
    },
  },
  exit_check: exit8,
  teacher_card: {
    minutes: 30,
    materials: [
      "Crab cake and price cards for each pair",
      "Debate cards and partner role cards",
      "Whiteboards",
      "Device with sound for each pair",
    ],
    listen_for: [
      "Students give a claim, a reason and a number as evidence in every argument.",
      "Students compare unit rates, not total prices, and say why the totals are not fair.",
      "Students answer a different view with “although” and then give their own conclusion.",
    ],
    watchouts: [
      "Comparing totals: students say Stand A is cheaper because 34 is less than 48. Ask how many crab cakes each stand sells.",
      "Claims without evidence: “I think B because it is better.” Ask for the two unit rates and the division that gives them.",
      "“Although … but …”: learners from several language backgrounds use both words together, as in their home language. Model one connector per idea, and watch for the decimal comma in 8,50.",
    ],
    differentiation: {
      l1_2: "Use the price cards and the frame “Stand ___ is the better buy because it costs ___ dollars per crab cake.”",
      l3_4: "State a claim, a reason with “because,” and two unit rates as evidence.",
      l5_6: "Argue with “although,” and check the choice a second way by comparing the cost of 12 crab cakes.",
      newcomer:
        "Use Point and Say the Choice, Choose the Better Buy and the Home Language Bridge, and accept pointing to the lower price card as a claim.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

export default {
  version: 1,
  unit_id: "g6-math-u2",
  source: "authored",
  lessons: [lesson1, lesson2, lesson3, lesson4, lesson5, lesson6, lesson7, lesson8],
};
