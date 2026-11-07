// Grades 6-8 publisher pass, Reading Room lessons, batch 5a: narrative, poetry, argument, procedural text. Original EduWonderLab texts.
const family = (en, es, questions) => ({ en, es, questions });
export default [
  {
    id: "saturday-market-two-voices",
    level: "A",
    title: "Saturday at the Market: Two Voices",
    summary:
      "Two siblings tell the same market trip, and a ten-dollar budget forces them to make a plan together.",
    genre: "Realistic fiction",
    subject: "English language arts and math",
    topics: ["two narrators", "point of view", "budgeting"],
    keyUse: "Narrate",
    eldStandard: "ELD-LA",
    languageFunction: "Explain how two narrators show different feelings about the same events.",
    languageFeatures: ["first-person voice", "sequence words", "feeling words"],
    minutes: 15,
    content: "Explain how two narrators give different views of the same events in a story.",
    language:
      "Use first, then and finally to retell events, and use feeling words for each narrator.",
    essential: "How does the person telling a story change what we notice?",
    background: "Think about a time you planned how to spend a small amount of money.",
    hook: "Ana sees a total that is too big. Leo sees strawberries that smell like candy. Who is right?",
    purpose:
      "Read to find out how Ana and Leo see the same trip and how they solve the money problem.",
    vocab: [
      ["pound", "a unit of weight", "The peaches cost two dollars a pound.", "libra"],
      [
        "total",
        "the amount you get when you add everything together",
        "The total was eleven dollars.",
        "total",
      ],
      [
        "kneel",
        "to bend down and rest on your knees",
        "Ana knelt beside her brother.",
        "arrodillarse",
      ],
      ["narrator", "the person who tells a story", "Ana and Leo are both narrators.", "narrador"],
    ],
    paras: [
      {
        text: "Ana: Mom gave us ten dollars for the market. I held the money tightly in my pocket. I wanted peaches, which cost two dollars a pound, because I planned to bake a pie with three pounds. Leo kept tugging my sleeve. He is eight, and he treats every stand like a parade.",
        q: "What does Ana want to buy, and why?",
      },
      {
        text: "Leo: Ana was so serious! I found a basket of strawberries that smelled like candy. The sign said five dollars. “Can we buy them?” I asked. Ana stared at her fingers as if they were hiding a secret.",
        q: "What does Leo notice?",
      },
      {
        text: "Ana: I did the math in my head. Three pounds of peaches cost six dollars. One basket of strawberries costs five. The total was eleven dollars, and we only had ten. My cheeks felt warm. I did not want to tell Leo no.",
        q: "What problem does Ana find?",
      },
      {
        text: "Leo: I did not understand the numbers. I only knew Ana had gone quiet. Then she knelt down beside me. “What if we buy two pounds of peaches instead?” she asked. That would cost four dollars, and four plus five is nine. We would even have one dollar left!",
        q: "How does Ana change the plan?",
      },
      {
        text: "Ana: The pie would be a little smaller, but nobody would mind. Leo carried the strawberries home like treasure. At the door, I gave Mom the extra dollar, and she hugged us both.",
        q: "How does the trip end?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "How much money did Mom give Ana and Leo?",
        opts: ["Ten dollars", "Eleven dollars", "Nine dollars"],
        why: [
          "Eleven dollars is what the peaches and the strawberries would have cost together, not what Mom gave them.",
          "Nine dollars is what they spent in the end, after Ana changed the peach order.",
        ],
        rat: "Paragraph 1 says Mom gave them ten dollars for the market.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 4, Leo says Ana “knelt down beside me.” What does knelt mean?",
        opts: [
          "bent down with her knees on the ground",
          "jumped up and moved away from him",
          "stepped back and looked at the sign",
        ],
        why: [
          "Jumping up and moving away would put Ana farther from Leo, but the sentence says she was beside him.",
          "Stepping back would also leave space between them, and the text says she came down next to him.",
        ],
        rat: "Ana comes down to Leo's level to talk to him, so knelt means she bent down with her knees on the ground.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Point of view",
        type: "choice",
        prompt: "Why does the story switch between Ana and Leo as narrators?",
        opts: [
          "It lets readers see one trip through two different sets of feelings.",
          "It teaches readers how to bake a peach pie for a family dinner.",
          "It proves that the two narrators always agree about everything.",
        ],
        why: [
          "The pie is only part of Ana's plan; the story is about the trip and the money, not a recipe.",
          "Ana and Leo see the market differently, so the story does not show that they always agree.",
        ],
        rat: "Ana thinks about prices and the total, while Leo notices the smell of strawberries and Ana's quiet face, so each voice shows a different feeling about the same moment.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use numbers from the text",
        type: "choice",
        prompt:
          "Ana buys two pounds of peaches and Leo gets one basket of strawberries. What is the total cost?",
        opts: ["Nine dollars", "Eleven dollars", "Four dollars"],
        why: [
          "Eleven dollars is the cost of three pounds of peaches plus the basket, which Ana decided not to buy.",
          "Four dollars is only the cost of the two pounds of peaches, and the strawberries cost extra.",
        ],
        rat: "Two pounds of peaches cost 2 × 2 = 4 dollars, and 4 + 5 = 9 dollars, as paragraph 4 says.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Sequence of events",
        type: "order",
        prompt: "Put these events in the order they happen in the story.",
        items: [
          "Leo finds strawberries that cost five dollars.",
          "Ana finds that the total is eleven dollars.",
          "Ana suggests buying only two pounds of peaches.",
          "Ana gives Mom the extra dollar.",
        ],
        rat: "Paragraph 2 shows Leo finding the strawberries, paragraph 3 shows Ana finding the total, paragraph 4 shows her suggestion, and paragraph 5 ends with the extra dollar.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt:
          "What does Ana's question “What if we buy two pounds of peaches instead?” show about her?",
        opts: [
          "She is willing to give up part of her plan to include Leo.",
          "She has decided that Leo should not be allowed to choose.",
          "She wants to spend all of the money on the strawberries.",
        ],
        why: [
          "Ana's change keeps Leo's strawberries in the plan, so she is not refusing his choice.",
          "Ana still buys two pounds of peaches, so the money is not all spent on strawberries.",
        ],
        rat: "Ana gives up one pound of peaches so that the strawberries fit in the budget, which shows she cares about Leo's wish.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain point of view",
        type: "short",
        prompt:
          "Why does the author use two narrators in this story? Use one detail from Ana's voice and one detail from Leo's voice.",
        lookFor: [
          "Says that two narrators show two points of view",
          "Uses a detail from Ana's paragraphs, such as counting the total",
          "Uses a detail from Leo's paragraphs, such as the strawberries or Ana going quiet",
        ],
        rubric: [
          "Explains why two voices help the reader",
          "Uses one detail for each narrator",
          "Writes in complete sentences",
        ],
        frame: "The author uses two narrators so that ___. Ana ___, while Leo ___.",
        model:
          "The author uses two narrators so that readers can see how one trip feels different to each person. Ana counts the total and worries about the money, while Leo notices the strawberries and Ana's quiet face.",
      },
    ],
    transfer: {
      prompt:
        "Write two short sentences about the same event, one from a person who is worried and one from a person who is excited. Use feeling words in each sentence.",
      lookFor: [
        "Describes the same event in both sentences",
        "Uses a feeling word for the worried person and for the excited person",
        "Shows a different thing that each person notices",
      ],
      frame: "The worried person thinks ___. The excited person notices ___.",
    },
    guide: {
      mini: "Read paragraph 1 aloud as Ana and paragraph 2 as Leo. Ask students to name one thing each narrator notices, then compare the two lists on the board.",
      discussion: [
        "What does Ana notice that Leo does not?",
        "How would the story change if only Leo told it?",
        "How does Ana solve the money problem without saying no to Leo?",
      ],
      misconception:
        "Students may think both narrators know the same things; point out that Leo says he did not understand the numbers.",
      answerNotes: [
        "Question 4: two pounds of peaches cost 4 dollars, and 4 + 5 = 9.",
        "Question 3: each narrator notices different details, which shows a different point of view.",
      ],
      model:
        "The author uses two narrators so that readers can see how one trip feels different to each person. Ana counts the total, while Leo notices the strawberries.",
    },
    family: family(
      "Read one paragraph at a time and ask your student to say who is talking. Then ask how the same market trip feels different to Ana and to Leo. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez y pida a su estudiante que diga quién está hablando. Luego pregunte cómo se siente el mismo viaje al mercado para Ana y para Leo. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What does Ana worry about?", "What does Leo notice that Ana does not?"],
    ),
    connections: {
      write: "Retell a shared experience from two different points of view.",
      speak: "Tell the market trip aloud first as Ana and then as Leo.",
      listen: "Listen to two people describe one event and compare what each notices.",
    },
  },
  {
    id: "night-bus-poem",
    level: "A",
    title: "Night Bus Home (a poem)",
    summary:
      "A short original poem that uses similes, metaphors and a living bus to show how it feels to ride home at night.",
    genre: "Poetry",
    subject: "English language arts",
    topics: ["simile and metaphor", "personification", "theme"],
    keyUse: "Narrate",
    eldStandard: "ELD-LA",
    languageFunction: "Explain how comparisons help a poem show a feeling.",
    languageFeatures: ["figurative language", "stanzas", "descriptive words"],
    minutes: 12,
    content: "Identify similes and metaphors and explain how they build a mood and a theme.",
    language: "Use the words like, is and shows to explain a comparison.",
    essential: "How can comparisons make an ordinary ride feel special?",
    background: "Think about riding home in a car or on a bus when it is dark outside.",
    hook: "The poet says the bus sighs. How can a bus do that?",
    purpose:
      "Read to find out what the speaker sees on the bus and how the poet makes it feel calm.",
    vocab: [
      ["sigh", "to let out a long, soft breath", "The old bus seemed to sigh.", "suspirar"],
      ["rumble", "to move with a deep, low sound", "Trucks rumble down the street.", "retumbar"],
      ["stranger", "a person you do not know", "A stranger smiled at me.", "desconocido"],
      ["cord", "a thin rope or string", "She pulled the cord to stop the bus.", "cuerda"],
    ],
    paras: [
      {
        text: "The night bus sighs at the corner stop, a tired animal with glowing eyes. Its doors fold open like two big hands, and I step in from the cold. The seats are warm. The windows hum.",
        q: "What is the bus like?",
      },
      {
        text: "We rumble past the closed shops like a drum rolling down the street. Every window is a small gold screen: a stranger's kitchen, a cat on a sill, a blue television glowing in the dark.",
        q: "What does the speaker see outside?",
      },
      {
        text: "A woman holds a sleeping baby. A man reads, his lips moving with each word. Nobody talks, yet we all drift together down one slow river of light, carried toward our own front doors.",
        q: "Who is on the bus?",
      },
      {
        text: "My stop is next. I pull the cord. Ding! The bus sighs again, and I step out into the night. Home is a lamp in the window, and the whole dark city is a road that leads to it.",
        q: "How does the poem end?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "Who is sleeping on the bus in stanza 3?",
        opts: ["a baby held by a woman", "a man holding a book", "a cat sitting on a sill"],
        why: [
          "The man is reading, so he is awake, and his lips move with each word.",
          "The cat is one of the pictures seen through a window outside the bus, not a rider.",
        ],
        rat: "Stanza 3 says a woman holds a sleeping baby.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In stanza 2, the bus and its riders “rumble past the closed shops.” What does rumble mean?",
        opts: [
          "move with a deep, low sound",
          "move without making any noise",
          "move with a sharp, high ringing",
        ],
        why: [
          "The poet compares the bus to a drum, so the bus makes a sound and is not silent.",
          "A drum gives a deep sound, so a sharp, high ringing does not match the comparison.",
        ],
        rat: "The poet says the bus is like a drum rolling down the street, which suggests a deep, low sound.",
      },
      {
        kind: "craft",
        phase: "first",
        skill: "Personification",
        type: "choice",
        prompt: "In stanza 1, the poet says the night bus “sighs.” What does this show?",
        opts: [
          "The bus seems tired, like a living thing.",
          "The bus is broken and cannot start again.",
          "The driver is speaking to the riders aloud.",
        ],
        why: [
          "The poem says the bus rolls on and stops at corners, so it is not broken down.",
          "A sigh belongs to the bus in the poem; no driver speaks to the riders at all.",
        ],
        rat: "Giving the bus a sigh and calling it a tired animal makes it seem alive, which is personification.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Simile and metaphor",
        type: "sort",
        prompt: "Sort each line from the poem by the kind of comparison it uses.",
        cats: ["Simile (uses like or as)", "Metaphor (says one thing is another)"],
        sortItems: [
          ["Its doors fold open like two big hands.", 0],
          ["We rumble past the closed shops like a drum rolling down the street.", 0],
          ["Every window is a small gold screen.", 1],
          ["Home is a lamp in the window.", 1],
          ["The whole dark city is a road that leads to home.", 1],
        ],
        rat: "A simile uses the word like, as in the doors and the drum. A metaphor says one thing is another, as in the windows, the lamp and the road.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Structure of a poem",
        type: "choice",
        prompt: "How does the poem move from stanza 1 to stanza 4?",
        opts: [
          "From getting on the bus to getting ready to get off",
          "From a bright morning to a dark afternoon at school",
          "From the speaker's home to a far-away city by train",
        ],
        why: [
          "The poem happens at night from beginning to end, so it never shows a bright morning.",
          "The speaker rides a bus and ends near home; no train or far-away city appears.",
        ],
        rat: "Stanza 1 shows the speaker stepping in from the cold, and stanza 4 shows the speaker pulling the cord for the stop.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Find the theme",
        type: "choice",
        prompt: "What does the poet suggest about home?",
        opts: [
          "Home feels like a warm light that waits at the end of a trip.",
          "Home is a faraway place that nobody can ever really find.",
          "Home is a place we should leave behind when the night comes.",
        ],
        why: [
          "The speaker is traveling toward home and calls it a lamp, so it is not hard to find.",
          "The speaker is carried toward front doors and feels warm, so home is not something to leave behind.",
        ],
        rat: "Stanza 4 says home is a lamp in the window and that the whole city is a road leading to it.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain a comparison",
        type: "short",
        prompt:
          "How does the poet make the bus ride feel calm and warm? Use two details from the poem.",
        lookFor: [
          "Says the ride feels calm, warm or peaceful",
          "Uses a detail such as the warm seats, the gold windows or the river of light",
          "Explains how each detail creates the feeling",
        ],
        rubric: [
          "Names the feeling clearly",
          "Uses two accurate details",
          "Connects each detail to the feeling",
        ],
        frame: "The ride feels ___ because the poet says ___ and ___.",
        model:
          "The ride feels calm and warm because the poet says the seats are warm and the riders drift down one slow river of light. These details make the bus feel like a safe place.",
      },
    ],
    transfer: {
      prompt:
        "Write one simile and one metaphor about a place you know at night, such as your street or your kitchen. Then circle the word that makes the simile.",
      lookFor: [
        "Writes a simile with like or as",
        "Writes a metaphor that says one thing is another",
        "Uses a sense detail such as light, sound or warmth",
      ],
      frame: "The ___ is like ___. The ___ is a ___.",
    },
    guide: {
      mini: "Read the poem aloud once with the lights lowered. Ask students to draw the picture from stanza 2, then discuss why the poet calls each window a screen.",
      discussion: [
        "Which comparison made the best picture in your mind?",
        "What feeling do the words warm, hum and drift share?",
        "What is the difference between a simile and a metaphor?",
      ],
      misconception:
        "Students may think a metaphor must use like or as; remind them that only a simile does, and a metaphor says one thing is another.",
      answerNotes: [
        "Question 4: the two lines with like are similes; the three lines that say something is something else are metaphors.",
        "Question 6: the poem ends with home as a lamp in the window.",
      ],
      model:
        "The ride feels calm and warm because the seats are warm and the riders drift down one slow river of light.",
    },
    family: family(
      "Read the poem aloud together, one stanza at a time. Ask your student what picture each stanza paints. You can talk in any language, then ask for one sentence in English.",
      "Lean el poema en voz alta juntos, una estrofa a la vez. Pregunte a su estudiante qué imagen pinta cada estrofa. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["Which comparison do you like best?", "What does the poet say home is?"],
    ),
    connections: {
      write: "Write a short poem with a simile and a metaphor about a place at night.",
      speak: "Read a stanza aloud and describe the picture it makes.",
      listen: "Listen to a poem and name one comparison.",
    },
  },
  {
    id: "science-room-safety-notice",
    level: "A",
    title: "Safety Notice: Before, During and After a Science Lab",
    summary:
      "Read a school safety notice, follow its steps in order and explain the reason behind its rules.",
    genre: "Procedural text (safety notice)",
    subject: "English language arts and science",
    topics: ["following instructions", "safety rules", "sequence"],
    keyUse: "Inform",
    eldStandard: "ELD-SC",
    languageFunction: "Explain the order of steps and the reasons for safety rules.",
    languageFeatures: ["commands", "sequence words", "time words"],
    minutes: 12,
    content: "Follow a set of safety instructions and explain how the notice is organized.",
    language: "Use before, during and after to describe the order of steps.",
    essential: "Why do instructions need to be clear and in the right order?",
    background: "Think about a rule at school that keeps people safe.",
    hook: "Some lab rules sound small, but each one protects somebody. Can you tell who?",
    purpose: "Read to find out what students must do before, during and after a science lab.",
    vocab: [
      ["protect", "to keep someone safe from harm", "Goggles protect your eyes.", "proteger"],
      [
        "goggles",
        "tight glasses that cover your eyes",
        "Put on your goggles before the lab.",
        "gafas de seguridad",
      ],
      [
        "spill",
        "liquid that falls out of a container by accident",
        "Tell your teacher about a spill.",
        "derrame",
      ],
      ["handle", "to hold or use something", "Handle each tool with care.", "manejar"],
    ],
    paras: [
      {
        text: "Notice to all students: Please read this before your first science lab. Safety rules protect you, your classmates, and your teacher. Follow every rule, every time.",
        q: "Why do the rules exist?",
      },
      {
        text: "Before the lab begins, put on your goggles. Tie back long hair. Tuck in loose sleeves, and keep your bag under the table so nobody trips over it.",
        q: "What do you do before the lab?",
      },
      {
        text: "During the lab, handle each tool with care. Never taste anything. If you want to smell a chemical, do not put your nose near the cup. Instead, wave the smell toward you with your hand.",
        q: "What do you do during the lab?",
      },
      {
        text: "If something spills, stop and tell your teacher right away. Do not wipe it up yourself. If glass breaks, do not touch the pieces. Your teacher will clean them up with the right tools.",
        q: "What do you do if there is an accident?",
      },
      {
        text: "When the lab is over, wait until your teacher says you may clean up. Put the materials back on the tray. Wash your hands with soap and water, and scrub the backs of your hands and between your fingers. If you are ever unsure what to do, ask.",
        q: "What do you do after the lab?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "What should you do before the lab begins?",
        opts: ["Put on your goggles.", "Taste the materials.", "Clean up the tray."],
        why: [
          "The notice says to never taste anything, so this is a rule against tasting.",
          "Cleaning up comes at the end, after the teacher says that you may.",
        ],
        rat: "Paragraph 2 begins with the first rule: before the lab begins, put on your goggles.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "Paragraph 3 says to “handle each tool with care.” What does handle mean?",
        opts: ["hold and use", "throw away in the bin", "count out loud"],
        why: [
          "The notice says to put materials back on the tray, so tools are kept and not thrown away.",
          "The sentence is about how to treat tools, and nothing in it is about counting.",
        ],
        rat: "The notice tells students to treat each tool with care while they use it, so handle means to hold and use.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Sequence of steps",
        type: "order",
        prompt: "Put these safety steps in the order the notice gives them.",
        items: [
          "Put on your goggles.",
          "Handle each tool with care.",
          "Wait for your teacher to say you may clean up.",
          "Wash your hands with soap and water.",
        ],
        rat: "Paragraph 2 gives the goggles step, paragraph 3 gives the tools step, and paragraph 5 gives the cleanup and hand-washing steps in that order.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "How a text is organized",
        type: "choice",
        prompt: "How is the notice organized?",
        opts: [
          "By time: before, during and after the lab",
          "By tool: goggles, cups, trays and soap",
          "By person: students first, then the teacher",
        ],
        why: [
          "The notice does not go tool by tool; it groups rules by when each rule happens.",
          "The notice speaks to students the whole time, and the teacher appears only as someone to tell.",
        ],
        rat: "Paragraphs 2, 3 and 5 begin with Before the lab begins, During the lab, and When the lab is over.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that tells what to do if glass breaks.",
        evidence: ["p4"],
        rat: "Paragraph 4 says that if glass breaks, students should not touch the pieces because the teacher will clean them up.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why does the notice tell students not to wipe up a spill themselves?",
        opts: [
          "The spill may be unsafe to touch, so the teacher should check it.",
          "Wiping up a spill is the teacher's favorite part of every lab.",
          "Spills are always harmless, so nobody needs to fix them at all.",
        ],
        why: [
          "The notice treats a spill as a safety matter, not as a job that one person enjoys.",
          "The notice says to tell the teacher right away, so it does not treat spills as harmless.",
        ],
        rat: "The spill rule sits among the safety rules and asks students to tell the teacher, which suggests the liquid might not be safe to touch.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Apply the instructions",
        type: "short",
        prompt:
          "A student's cup tips over and water spreads across the table. Explain what the student should do and why. Use one detail from the notice.",
        lookFor: [
          "Says to stop and tell the teacher",
          "Says not to wipe it up alone",
          "Gives a reason such as keeping people safe",
        ],
        rubric: [
          "Names the correct action",
          "Uses a detail from paragraph 4",
          "Gives a reason in a complete sentence",
        ],
        frame: "The student should ___ because ___. The notice says ___.",
        model:
          "The student should stop and tell the teacher right away because a spill could be unsafe. The notice says not to wipe it up yourself, so the teacher decides how to clean it.",
      },
    ],
    transfer: {
      prompt:
        "Write three safety steps for a place you know, such as a kitchen or a bike path. Put them in order and use the words before, during or after.",
      lookFor: [
        "Writes three steps that start with a command verb",
        "Puts the steps in a logical order",
        "Uses at least one time word",
      ],
      frame: "Before ___, ___. During ___, ___. After ___, ___.",
    },
    guide: {
      mini: "Read the notice aloud and ask students to underline the first word of each rule. Point out that most rules begin with a command verb and a time word.",
      discussion: [
        "Which rule protects the person doing the lab, and which protects others?",
        "Why is the order of the steps important?",
        "What rule would you add to this notice?",
      ],
      misconception:
        "Students may think rules in a notice can be done in any order; ask what would go wrong if cleanup began before the lab ended.",
      answerNotes: [
        "Question 3: goggles, tools, wait for the teacher, and then wash hands.",
        "Question 4: the notice is organized by time: before, during and after.",
      ],
      model:
        "The student should stop and tell the teacher right away because a spill could be unsafe. The notice says not to wipe it up yourself.",
    },
    family: family(
      "Read the notice together, one paragraph at a time. Ask your student to say each step in order using the words before, during and after. You can talk in any language, then ask for one sentence in English.",
      "Lean el aviso juntos, un párrafo a la vez. Pida a su estudiante que diga cada paso en orden con las palabras antes, durante y después. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What do students do before the lab?", "What should a student do after a spill?"],
    ),
    connections: {
      write: "Write a safety notice for a place you know.",
      speak: "Explain the steps of the notice aloud in order.",
      listen: "Listen to instructions and put the steps in order.",
    },
  },
  {
    id: "playground-shade-opinion",
    level: "A",
    title: "Shade for the Playground Benches",
    summary: "A student gives two reasons for adding shade and answers a worry about cost.",
    genre: "Argument (opinion piece)",
    subject: "English language arts",
    topics: ["claim and reasons", "counterclaim", "word choice"],
    keyUse: "Argue",
    eldStandard: "ELD-LA",
    languageFunction: "Identify a claim, two reasons and an answer to a worry.",
    languageFeatures: ["claim and reasons", "however", "persuasive language"],
    minutes: 12,
    content: "Identify the claim, reasons and response to a worry in a short opinion piece.",
    language: "Use my first reason is and however to organize an opinion.",
    essential: "What makes a reason strong?",
    background: "Think about where students sit or rest during recess at your school.",
    hook: "Four benches stand in the sun. Who wants to sit on a hot bench?",
    purpose: "Read to find the writer's claim, the two reasons and the answer to a worry.",
    vocab: [
      [
        "shade",
        "a cool place where the sun's light is blocked",
        "Trees make shade on a hot day.",
        "sombra",
      ],
      ["reason", "a fact or idea that explains why", "My first reason is comfort.", "razón"],
      [
        "dizzy",
        "feeling as if the room is spinning",
        "Heat can make a person feel dizzy.",
        "mareado",
      ],
      ["expensive", "costing a lot of money", "A young tree is not expensive.", "caro"],
    ],
    paras: [
      {
        text: "Our playground has four benches but no shade. I think our school should plant two shade trees or build a cloth roof over the benches. This is a small change that would help many students.",
        q: "What does the writer want?",
      },
      {
        text: "My first reason is comfort. On sunny days, the metal benches get so hot that nobody can sit on them. Students who want to rest or read must stand in the sun instead.",
        q: "What is the first reason?",
      },
      {
        text: "My second reason is health. Shade helps students stay cool and protects their skin. A student who is too hot can feel tired and dizzy, and then it is hard to learn.",
        q: "What is the second reason?",
      },
      {
        text: "Some people say trees and roofs cost too much. However, a young tree is not expensive, and parent volunteers might help plant it. A little shade today will help our school for many years.",
        q: "How does the writer answer the worry?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find the claim",
        type: "choice",
        prompt: "What does the writer want the school to add?",
        opts: [
          "Shade over the playground benches",
          "A new set of metal benches",
          "A longer lunch period outdoors",
        ],
        why: [
          "The benches already exist, and the writer says the problem is that they are too hot.",
          "The writer never asks for more time outside; the request is about shade.",
        ],
        rat: "Paragraph 1 says the school should plant shade trees or build a cloth roof over the benches.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 3, a student who is too hot can feel “dizzy.” What does dizzy mean?",
        opts: [
          "feeling as if the room is spinning",
          "feeling very hungry and thirsty",
          "feeling excited and ready to play",
        ],
        why: [
          "The paragraph connects dizziness to being too hot and tired, not to being hungry.",
          "The paragraph says the student is tired, so feeling excited does not fit.",
        ],
        rat: "The writer says heat can make a student feel tired and dizzy, which describes feeling unsteady.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Parts of an argument",
        type: "sort",
        prompt: "Sort each detail by the job it does in the opinion piece.",
        cats: ["Reason for the claim", "Worry from others", "Writer's answer to the worry"],
        sortItems: [
          ["The metal benches get too hot to sit on.", 0],
          ["Shade protects students' skin.", 0],
          ["Trees and roofs cost too much.", 1],
          ["A young tree is not expensive.", 2],
          ["Parent volunteers might help plant it.", 2],
        ],
        rat: "Paragraphs 2 and 3 give the reasons, and paragraph 4 states the worry about cost and then answers it with two details.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "How does the writer connect shade to learning?",
        opts: [
          "Too much heat can make students tired, and tired students find learning hard.",
          "Shade makes the playground look nicer, so students enjoy math more.",
          "Trees can teach students how plants grow during a science class.",
        ],
        why: [
          "The writer talks about heat and tiredness, not about how the playground looks.",
          "The writer never mentions science lessons about plants; the link is about feeling hot.",
        ],
        rat: "Paragraph 3 says a student who is too hot can feel tired and dizzy, and then it is hard to learn.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author's craft",
        type: "choice",
        prompt: "Why does the writer call the plan “a small change”?",
        opts: [
          "To make the plan sound easy and reasonable",
          "To show that the writer is not sure about it",
          "To warn readers that it will not help much",
        ],
        why: [
          "The writer gives two strong reasons and sounds sure, so the phrase is not about doubt.",
          "The next sentence says the change would help many students, so it is not described as useless.",
        ],
        rat: "Calling the plan small makes it seem simple to accept, and the same sentence says it would help many students.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Respond with a reason",
        type: "short",
        prompt:
          "Do you think the writer gives good reasons for adding shade? Use one reason from the text.",
        lookFor: [
          "States a clear opinion",
          "Uses one accurate reason such as hot benches or skin protection",
          "Explains why the reason matters",
        ],
        rubric: [
          "Takes a position",
          "Uses evidence from the text",
          "Connects the evidence to the position",
        ],
        frame: "I think the reasons are ___ because ___. The writer says ___.",
        model:
          "I think the reasons are good because they are about real problems. The writer says the metal benches get so hot that nobody can sit on them, so students cannot rest during recess.",
      },
    ],
    transfer: {
      prompt:
        "Choose one small change you would like at your school. Write your claim, give two reasons, and answer one worry with however.",
      lookFor: ["States a claim", "Gives two different reasons", "Answers one worry with however"],
      frame:
        "I think our school should ___. My first reason is ___. My second reason is ___. However, ___.",
    },
    guide: {
      mini: "Color-code the piece: claim in blue, reasons in green, worry in orange, answer in purple. Ask students which paragraph is easiest to find and why.",
      discussion: [
        "Which of the two reasons is stronger?",
        "Why does the writer name the worry instead of leaving it out?",
        "What other evidence would make the argument stronger?",
      ],
      misconception:
        "Students may think any detail in the text is a reason; ask whether the detail explains why the change is a good idea.",
      answerNotes: [
        "Question 3: reasons are in paragraphs 2 and 3, and the worry and answer are in paragraph 4.",
        "Question 4: the link is that heat makes students tired and learning harder.",
      ],
      model:
        "I think the reasons are good because they are about real problems. The metal benches get so hot that nobody can sit on them.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student what the writer wants and which reason is the strongest. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez. Pregunte a su estudiante qué quiere el autor y cuál es la razón más fuerte. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What does the writer want to add?", "How does the writer answer the worry?"],
    ),
    connections: {
      write: "Write an opinion piece about a small change at your school.",
      speak: "Tell a partner your claim and two reasons aloud.",
      listen: "Listen to an opinion and name the reason.",
    },
  },
  {
    id: "drum-that-would-not-sound",
    level: "B",
    title: "The Drum That Would Not Sound (a folktale)",
    summary:
      "In this original tale, a village drum teaches a strong young drummer that listening comes before playing.",
    genre: "Folktale (original)",
    subject: "English language arts",
    topics: ["theme", "turning point", "figurative language"],
    keyUse: "Narrate",
    eldStandard: "ELD-LA",
    languageFunction: "Explain the theme of a tale using details from the story.",
    languageFeatures: ["narrative sequence", "dialogue", "comparisons"],
    minutes: 15,
    content: "Identify the theme and turning point of a folktale and support them with details.",
    language: "Use the words because and shows that to connect a detail to a theme.",
    essential: "What can listening teach that strength cannot?",
    background: "Think about a time you learned more by listening than by talking.",
    hook: "The strongest drummer in the village strikes the great drum, and nothing happens. Why?",
    purpose: "Read to find out why the drum is silent for Joro and what changes when Nuru tries.",
    vocab: [
      [
        "keeper",
        "a person who takes care of something",
        "Tavi was the keeper of the drum.",
        "guardián",
      ],
      ["might", "great strength", "He struck the drum with all his might.", "fuerza"],
      [
        "rhythm",
        "a pattern of sounds that repeats",
        "Nuru tapped the rhythm of the river.",
        "ritmo",
      ],
      [
        "council",
        "a group that makes decisions for a community",
        "The council chose a new drummer.",
        "consejo",
      ],
      [
        "warn",
        "to tell someone about danger before it comes",
        "The drum warned the village of storms.",
        "advertir",
      ],
    ],
    paras: [
      {
        text: "Long ago, a great drum hung in the middle of a valley village. When it sounded, everyone came from the fields, because the drum called people to the harvest and warned them of storms. For many years the old keeper, Tavi, played it. When his hands grew stiff, the council chose Joro, the strongest young man in the village, to take his place.",
        q: "What does the drum do for the village?",
      },
      {
        text: "Joro lifted the heavy sticks and struck the drum with all his might. The drum answered with a dull thud, like a stone dropped in mud. He struck harder, and then harder still. His arms shook and his face turned red, but the drum would not sing. The villagers whispered and shook their heads.",
        q: "What goes wrong for Joro?",
      },
      {
        text: "Nuru, a girl who swept the square each morning, watched from the well. “Perhaps the drum has not been asked,” she said softly. She pressed her ear to its cool skin and listened. She heard wind moving through the valley, the slow river, and the far-off cry of geese. Then she tapped the drum gently, in the rhythm of the river.",
        q: "What does Nuru do differently?",
      },
      {
        text: "The drum woke. Its deep voice rolled over the roofs and fields, round and warm as a loaf of bread. Joro stood with his sticks hanging in his hands. “I thought the drum wanted strength,” he said. Old Tavi smiled. “The drum wants a listener,” he said. “Strength is only what we have. Listening is what we give.”",
        q: "What does Tavi say the drum wants?",
      },
      {
        text: "That autumn, Joro learned to listen first, and Nuru became his helper. One evening the geese flew low and the wind turned cold. Nuru heard the change, and together they beat the warning rhythm. The villagers brought in the grain and tied down the boats before the storm arrived. The drum has never been silent since.",
        q: "How does listening help the village?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "Why did the council choose Joro to play the drum?",
        opts: [
          "He was the strongest young man in the village.",
          "He had played the drum with Tavi for many years.",
          "He knew the rhythm of the river better than anyone.",
        ],
        why: [
          "The text says Tavi played the drum for many years, and it never says Joro had played before.",
          "Nuru, not Joro, is the one who listens for the rhythm of the river.",
        ],
        rat: "Paragraph 1 says the council chose Joro because he was the strongest young man in the village.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 2, Joro strikes the drum “with all his might.” What does might mean?",
        opts: ["great strength", "careful patience", "good luck"],
        why: [
          "The sentence says he struck harder and harder, which is about force, not about being careful.",
          "Nothing in the sentence says luck helped him; it shows how hard he hit the drum.",
        ],
        rat: "Joro uses all of his strength on the drum, and his arms shake, so might means great strength.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Figurative language",
        type: "choice",
        prompt:
          "The narrator says the drum's sound was “like a stone dropped in mud.” What does this comparison show?",
        opts: [
          "The sound was heavy and dead, with no ring to it.",
          "The sound was bright and clear, like falling rain.",
          "The sound was so loud that it hurt the villagers' ears.",
        ],
        why: [
          "A stone in mud lands with a dull, soft thud, so the comparison is not about a bright sound.",
          "The villagers whisper and shake their heads; the text never says that the noise hurt them.",
        ],
        rat: "Paragraph 2 calls the sound a dull thud, and a stone dropped in mud makes a sound that is heavy and dead.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "What does Nuru understand that Joro does not understand at first?",
        opts: [
          "The drum must be listened to before it is played.",
          "The drum is too heavy for one person to move.",
          "The drum only works when many people play together.",
        ],
        why: [
          "The text says Joro lifted the sticks and struck the drum; weight is never the problem.",
          "Nuru plays the drum alone and it answers, so it does not need many players.",
        ],
        rat: "Nuru listens to the wind, the river and the geese before she taps the drum, and then the drum answers.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Turning point",
        type: "choice",
        prompt: "Which event is the turning point of the story?",
        opts: [
          "Nuru listens to the drum and taps a gentle rhythm.",
          "Joro strikes the drum harder and harder.",
          "The villagers tie down the boats before the storm.",
        ],
        why: [
          "Joro's harder strikes show the problem getting worse, so they do not change the story's direction.",
          "Tying down the boats comes after the change and shows its good results.",
        ],
        rat: "In paragraph 3 Nuru listens and taps softly, and in paragraph 4 the drum finally sounds, so this is where the story turns.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select supporting details",
        type: "multi",
        prompt: "Which two details show that listening helps the village?",
        opts: [
          "Nuru hears the geese flying low and the wind turning cold.",
          "The villagers bring in the grain before the storm arrives.",
          "Joro lifts the heavy sticks and strikes the drum.",
          "Tavi's hands grow stiff with age.",
        ],
        ans: 2,
        why: [
          "Joro's striking shows force, not listening, and the drum stays silent when he does it.",
          "Tavi's stiff hands explain why a new drummer is needed, not why listening helps.",
        ],
        rat: "Paragraph 5 shows Nuru hearing the change in the geese and wind, and the villagers saving the grain and boats because of the warning.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain a theme",
        type: "short",
        prompt: "What lesson does the story teach? Use one detail from the story to explain it.",
        lookFor: [
          "States a lesson such as listening matters more than strength",
          "Uses a detail such as Joro's silent drum or Nuru's gentle tapping",
          "Connects the detail to the lesson",
        ],
        rubric: [
          "Names a clear theme",
          "Uses an accurate story detail",
          "Explains how the detail shows the theme",
        ],
        frame: "The story teaches that ___. For example, ___. This shows ___.",
        model:
          "The story teaches that listening can matter more than strength. For example, Joro hits the drum with all his might and it stays silent, but Nuru listens first and it answers her. This shows that careful attention can work better than force.",
      },
    ],
    transfer: {
      prompt:
        "Think of a time when listening first helped you solve a problem. Write what happened and what you learned.",
      lookFor: [
        "Describes the problem",
        "Describes how listening first changed what happened",
        "States what was learned",
      ],
      frame: "At first ___. Then I listened to ___. I learned that ___.",
    },
    guide: {
      mini: "Draw a plot mountain and place the story on it: the drum is silent, Joro tries harder, Nuru listens, the drum sounds, the storm warning. Ask where the story turns.",
      discussion: [
        "Why does the author give Nuru a small job like sweeping the square?",
        "What does Tavi mean by 'Listening is what we give'?",
        "How is the drum like a person who must be asked before it answers?",
      ],
      misconception:
        "Students may say the theme is only that Nuru is smart; point them to Tavi's words about strength and listening.",
      answerNotes: [
        "Question 5: the turning point is when Nuru listens and taps softly in paragraph 3.",
        "Question 6: the two details are Nuru hearing the geese and wind and the villagers saving the grain.",
      ],
      model:
        "The story teaches that listening can matter more than strength. Joro's hardest strikes could not wake the drum, but Nuru's gentle listening made it sing.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student why the drum is silent for Joro and what Nuru does differently. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez. Pregunte a su estudiante por qué el tambor no suena para Joro y qué hace Nuru de otra manera. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What does Nuru do before she taps the drum?", "What does Tavi say the drum wants?"],
    ),
    connections: {
      write: "Write your own short tale that teaches a lesson.",
      speak: "Retell the tale aloud with first, then and finally.",
      listen: "Listen to a folktale and name its lesson.",
    },
  },
  {
    id: "fence-problem-story",
    level: "B",
    title: "The Fence Problem",
    summary:
      "A garden story in which Priya tests rectangles with the same fence length to find which shape holds the most.",
    genre: "Realistic fiction with math",
    subject: "English language arts and math",
    topics: ["perimeter and area", "character change", "testing a hunch"],
    keyUse: "Narrate",
    eldStandard: "ELD-MA",
    languageFunction: "Explain how a character uses evidence to change a belief.",
    languageFeatures: ["narrative sequence", "dialogue", "math vocabulary"],
    minutes: 18,
    content:
      "Explain how a character tests an idea with numbers and how the story shows the result.",
    language:
      "Use first, next and then to retell a series of tests, and use because to give a reason.",
    essential: "Why is it better to test a hunch than to trust it?",
    background: "Think about a time you were sure of something and then tested it.",
    hook: "Twenty-four meters of fence can make many gardens. Which one holds the most tomatoes?",
    purpose: "Read to find out what Priya tests and what she learns about the shape of the bed.",
    vocab: [
      [
        "perimeter",
        "the distance around a shape",
        "The fence covers the perimeter of the bed.",
        "perímetro",
      ],
      [
        "area",
        "the amount of flat space inside a shape",
        "The area of the bed is 36 square meters.",
        "área",
      ],
      [
        "hunch",
        "a guess based on a feeling",
        "Marcus had a hunch that long beds hold more.",
        "corazonada",
      ],
      [
        "proof",
        "evidence that shows an idea is true",
        "Priya wanted proof before she agreed.",
        "prueba",
      ],
    ],
    paras: [
      {
        text: "On Saturday morning, Priya and her neighbor Mr. Okoye stood in an empty corner of the community garden with a roll of fencing. The roll was exactly 24 meters long, so the perimeter of the bed would be 24 meters. “We must use all of it,” said Mr. Okoye, “and the bed has to be a rectangle.” Priya's job was to choose its shape, because she loved puzzles.",
        q: "What is the problem?",
      },
      {
        text: "Marcus, who had come to carry buckets, had a confident idea. “Make it long and skinny,” he said. “Then it stretches farther, so it must hold more tomatoes.” It sounded sensible, but Priya wanted proof. She took out her graph paper and a pencil. “Let's test it,” she said.",
        q: "What does Marcus think, and what does Priya do?",
      },
      {
        text: "Priya started with Marcus's shape. A bed 10 meters long and 2 meters wide uses 10 + 2 + 10 + 2 = 24 meters of fence. Its area is 10 × 2 = 20 square meters. Next she tried 8 meters by 4 meters. That also uses 24 meters of fence, and its area is 32 square meters. “It grew!” said Marcus. “Keep going.”",
        q: "What do the first two tests show?",
      },
      {
        text: "A bed 7 meters by 5 meters gave 35 square meters. Then Priya drew a square, 6 meters on each side. The fence was still 24 meters, but the area was 36 square meters, the biggest yet. She studied her list. As the two sides came closer in length, the area kept growing. “So with this much fence, a square holds the most,” she said.",
        q: "What does Priya notice?",
      },
      {
        text: "Marcus scratched his head, then laughed. “I was sure long and skinny would win,” he said. “I guess you can't trust a hunch without testing it.” Mr. Okoye unrolled the fence around the square, and the three of them tied it to the posts. By noon, the first tomato seedlings were in the ground.",
        q: "How does Marcus change?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "How long is the roll of fencing?",
        opts: ["24 meters", "36 meters", "12 meters"],
        why: [
          "Thirty-six is the area of the biggest bed, measured in square meters, not the length of the fence.",
          "Twelve is half of the fence length; it is the sum of one length and one width.",
        ],
        rat: "Paragraph 1 says the roll was exactly 24 meters long.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 5, Marcus says you cannot trust a “hunch” without testing it. What is a hunch?",
        opts: [
          "a guess based on a feeling",
          "a plan written on paper",
          "a measurement from a tape",
        ],
        why: [
          "Marcus has not written anything down; his hunch is an idea he feels is true.",
          "A measurement would come from using a tape, but Marcus only says what he feels will happen.",
        ],
        rat: "Marcus was sure long and skinny would win before any test, so a hunch is a guess based on a feeling.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Apply the calculation",
        type: "choice",
        prompt:
          "Another bed is 9 meters long and 3 meters wide. It uses all 24 meters of fence. What is its area?",
        opts: ["27 square meters", "12 square meters", "24 square meters"],
        why: [
          "Twelve is 9 + 3, the sum of one length and one width, and not the area.",
          "Twenty-four is the amount of fence around the bed, not the space inside it.",
        ],
        rat: "Area is length times width, so 9 × 3 = 27 square meters, as in the way Priya found 10 × 2 = 20.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Sequence of events",
        type: "order",
        prompt: "Put the shapes in the order that Priya tested them.",
        items: [
          "A bed 10 meters by 2 meters",
          "A bed 8 meters by 4 meters",
          "A bed 7 meters by 5 meters",
          "A square 6 meters by 6 meters",
        ],
        rat: "Paragraph 3 gives 10 by 2 and then 8 by 4, and paragraph 4 gives 7 by 5 and then the 6 by 6 square.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt:
          "What do Priya's results suggest about rectangles that use the same amount of fence?",
        opts: [
          "The closer the sides are in length, the larger the area.",
          "The longer one side is, the larger the area becomes.",
          "The area stays the same no matter what shape is used.",
        ],
        why: [
          "The areas grew from 20 to 36 as the sides came closer, so a longer side did not bring a bigger area.",
          "The areas were 20, 32, 35 and 36 square meters, so they did not stay the same.",
        ],
        rat: "Paragraph 4 says that as the two sides came closer in length, the area kept growing.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author's craft",
        type: "choice",
        prompt:
          "Why does the author let Marcus laugh and say “you can't trust a hunch without testing it”?",
        opts: [
          "To show that his thinking changed after he saw the proof",
          "To show that he did not care about the garden",
          "To show that Priya was wrong about the shapes",
        ],
        why: [
          "Marcus stays to help tie the fence, so he clearly cares about the garden.",
          "The tests showed that Priya's idea was right; Marcus is the one who changed his mind.",
        ],
        rat: "Marcus says he was sure about long and skinny and then admits a hunch needs testing, which shows his thinking changed.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt:
          "Explain how Priya shows that a long, skinny bed does not hold the most. Use two numbers from the story.",
        lookFor: [
          "Says that the long, skinny bed has a smaller area",
          "Uses two numbers such as 20 and 36 square meters",
          "Explains that the same fence can make beds with different areas",
        ],
        rubric: [
          "Makes a clear claim",
          "Uses two accurate numbers",
          "Connects the numbers to the claim",
        ],
        frame:
          "Priya shows that ___. The long bed has an area of ___, but the square has an area of ___.",
        model:
          "Priya shows that long and skinny does not hold the most. The 10 by 2 bed has an area of 20 square meters, but the 6 by 6 square has an area of 36 square meters, even though both use 24 meters of fence.",
      },
    ],
    transfer: {
      prompt:
        "A friend has 20 meters of fence and a hunch that a 9 by 1 rectangle holds the most. Explain how to test the hunch and name one other shape to try.",
      lookFor: [
        "Says to find the area of each shape by multiplying length and width",
        "Names another shape that uses 20 meters, such as 5 by 5 or 6 by 4",
        "Compares the areas to decide",
      ],
      frame:
        "I would find the area of ___ by multiplying ___ by ___. Then I would compare it with ___.",
    },
    guide: {
      mini: "Make a table with columns for length, width, perimeter and area. Fill in the four shapes from the story and ask students what happens to the area as the sides get closer in length.",
      discussion: [
        "Why can different rectangles use the same amount of fence?",
        "What would Priya need to do to be sure that a square is the best choice?",
        "How does Marcus change from the beginning of the story to the end?",
      ],
      misconception:
        "Students may think the shape with the longest side has the biggest area; the table shows 10 by 2 has less area than 6 by 6.",
      answerNotes: [
        "Question 3: 9 × 3 = 27; adding 9 + 3 gives 12, a common error.",
        "Question 5: the areas 20, 32, 35 and 36 show that closer sides give a bigger area.",
      ],
      model:
        "Priya shows that long and skinny does not hold the most. The 10 by 2 bed has an area of 20 square meters, and the 6 by 6 square has 36.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student to explain why the square holds more tomatoes than the long, thin bed. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez. Pida a su estudiante que explique por qué en el cuadrado caben más tomates que en la cama larga y delgada. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What did Priya test first?", "What is the area of the square bed?"],
    ),
    connections: {
      write: "Write a story about a character who tests a hunch with numbers.",
      speak: "Explain aloud how Priya compared the shapes.",
      listen: "Listen to a talk about perimeter and area.",
    },
  },
  {
    id: "words-in-my-pocket-poem",
    level: "B",
    title: "Words in My Pocket (a poem)",
    summary:
      "An original poem about carrying words from home, planting new ones, and letting both languages grow.",
    genre: "Poetry",
    subject: "English language arts",
    topics: ["metaphor", "theme", "imagery"],
    keyUse: "Narrate",
    eldStandard: "ELD-LA",
    languageFunction: "Explain how images and metaphors build the theme of a poem.",
    languageFeatures: ["metaphor", "imagery", "stanzas"],
    minutes: 15,
    content: "Explain how a poet uses images and metaphors to show a change over time and a theme.",
    language: "Use the words stands for and shows that to explain an image.",
    essential: "How can images show what it feels like to learn a new language?",
    background: "Think about a word from your home language that you would like to share.",
    hook: "The speaker says new words are seeds. What would it mean to plant a word?",
    purpose: "Read to find out how the speaker's words change from stones in a pocket to a garden.",
    vocab: [
      ["stanza", "a group of lines in a poem", "This poem has five stanzas.", "estrofa"],
      ["bloom", "to open into flowers", "The flowers bloom in spring.", "florecer"],
      ["tangled", "twisted together in a mix", "The vines grew tangled and bright.", "enredado"],
      ["whisper", "to speak in a very soft voice", "She whispered one word in class.", "susurrar"],
    ],
    paras: [
      {
        text: "When I came here, I carried my words like stones in my pocket, smooth and heavy, each one warm from my hand. They were the only things I had brought from home, and I held them tight.",
        q: "What does the speaker carry?",
      },
      {
        text: "At school the new words flew past me like birds I could not name. I opened my mouth, and a small, shaky sound came out. Someone smiled. The sound was not a failure; it was a seed.",
        q: "What are the new words like?",
      },
      {
        text: "I planted it each day: one word at breakfast, one word on the bus, one word whispered at the back of the class. The seeds were small. I watered them with questions and I waited.",
        q: "How does the speaker plant the seeds?",
      },
      {
        text: "Now my garden has two kinds of flowers. Some bloom in the language of my grandmother's kitchen, and some bloom in the language of the hallway. They grow side by side, tangled and bright.",
        q: "What does the garden hold now?",
      },
      {
        text: "My pocket is no longer heavy. It is full of seeds and stones, and I know that the more I carry, the more I can say. Nothing was lost on the way. Everything was planted.",
        q: "How does the speaker feel at the end?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "According to stanza 1, where did the speaker's first words come from?",
        opts: [
          "From the speaker's old home",
          "From the noisy school hallway",
          "From the friendly bus driver",
        ],
        why: [
          "The hallway is where the speaker later hears new words, not where the first ones came from.",
          "The bus is where the speaker whispers new words later, in stanza 3.",
        ],
        rat: "Stanza 1 says the words were the only things the speaker had brought from home.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In stanza 4, the two kinds of flowers grow “tangled and bright.” What does tangled mean?",
        opts: [
          "twisted together in a mix",
          "spread far apart from each other",
          "cut into small separate pieces",
        ],
        why: [
          "The flowers grow side by side, so they are close together and not spread far apart.",
          "The two languages are described as growing together, not as being cut apart.",
        ],
        rat: "The poem says the flowers grow side by side, so tangled means twisted together in a mix.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Figurative language",
        type: "choice",
        prompt:
          "In stanza 2, the new words are like “birds I could not name.” What does this comparison show?",
        opts: [
          "The words seemed to move past the speaker and were hard to catch.",
          "The words were soft and pretty like feathers and sang to the speaker.",
          "The words were dangerous and made the speaker want to run away.",
        ],
        why: [
          "The speaker could not name the birds, so they are strange and hard to catch, not just pretty.",
          "The speaker feels shaky but then plants a seed, so the poem does not call the words dangerous.",
        ],
        rat: "Birds that fly past and cannot be named show words that are moving too fast to hold, which is how the new language first feels.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Structure of a poem",
        type: "choice",
        prompt: "How do the main images change from stanza 1 to stanza 4?",
        opts: [
          "From heavy stones to a growing garden",
          "From a busy hallway to a quiet bus",
          "From a bright garden to a dark pocket",
        ],
        why: [
          "The hallway and the bus are places in the poem; the images that change are stones and plants.",
          "The poem moves toward a bright garden and not away from it.",
        ],
        rat: "Stanza 1 begins with stones in a pocket, and stanza 4 ends with a garden of flowers.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "What does “Nothing was lost on the way. Everything was planted.” suggest?",
        opts: [
          "The words from home still matter and grow beside the new ones.",
          "The speaker has forgotten the language of home completely.",
          "The speaker plans to stop learning words in the hallway.",
        ],
        why: [
          "Stanza 4 says flowers still bloom in the language of the grandmother's kitchen, so home words were not forgotten.",
          "Stanza 5 says the more the speaker carries, the more can be said, so learning goes on.",
        ],
        rat: "The stones from home and the new seeds are both in the pocket and in the garden, so nothing was lost.",
      },
      {
        kind: "summary",
        phase: "second",
        skill: "Summarize the images",
        type: "cloze",
        prompt: "Complete the sentences to show how the images change in the poem.",
        cloze: [
          "At first the speaker holds words tightly like ",
          ["stones", "feathers", "bubbles"],
          " in a pocket. Later the new words are planted like ",
          ["seeds", "coins", "paper"],
          " and grow into a ",
          ["garden", "desert", "fence"],
          ".",
        ],
        rat: "Stanza 1 compares the words to stones, stanzas 2 and 3 call the new words seeds, and stanza 4 shows a garden.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain a theme",
        type: "short",
        prompt: "What is the theme of the poem? Use two images from the poem to explain it.",
        lookFor: [
          "States a theme such as both languages can live and grow together",
          "Uses two images such as stones, seeds or the garden",
          "Explains how the images show the theme",
        ],
        rubric: [
          "Names a clear theme",
          "Uses two accurate images",
          "Connects each image to the theme",
        ],
        frame: "The theme is that ___. The poet shows this with ___ and ___.",
        model:
          "The theme is that a person can keep the words from home and learn new ones too. The poet shows this with stones that stand for home words and seeds that grow into a garden with two kinds of flowers.",
      },
    ],
    transfer: {
      prompt:
        "Write a metaphor that compares learning something new to growing something. Explain what the two things have in common.",
      lookFor: [
        "Writes a metaphor that says one thing is another",
        "Names what the two things have in common",
        "Uses a sense detail or an image",
      ],
      frame: "Learning ___ is a ___ because ___.",
    },
    guide: {
      mini: "Draw a stone and a seed on the board. Ask students what each stands for in the poem, then ask where each image appears again at the end.",
      discussion: [
        "Why might the poet choose stones for the first words and seeds for the new words?",
        "What does the garden with two kinds of flowers say about two languages?",
        "How does the speaker feel in stanza 2 compared with stanza 5?",
      ],
      misconception:
        "Students may think the poem says home words are replaced by new words; point to stanzas 4 and 5, where both grow together.",
      answerNotes: [
        "Question 4: the images move from stones to a garden.",
        "Question 5: both the stones and the seeds are in the pocket at the end.",
      ],
      model:
        "The theme is that a person can keep the words from home and learn new ones too. The stones stand for home words, and the seeds grow into a garden.",
    },
    family: family(
      "Read the poem aloud together, one stanza at a time. Ask your student what the stones and the seeds stand for. You can talk in any language, then ask for one sentence in English.",
      "Lean el poema en voz alta juntos, una estrofa a la vez. Pregunte a su estudiante qué representan las piedras y las semillas. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What are the words like in stanza 1?", "What grows in the garden at the end?"],
    ),
    connections: {
      write: "Write a short poem about learning something new using images from nature.",
      speak: "Read a stanza aloud and explain one image.",
      listen: "Listen to a poem and name its theme.",
    },
  },
  {
    id: "bike-racks-letter",
    level: "B",
    title: "A Letter to the Editor: More Bike Racks",
    summary:
      "A student counts bikes, compares costs and answers a worry about money in a letter to the editor.",
    genre: "Argument (letter to the editor)",
    subject: "English language arts and math",
    topics: ["claim and evidence", "counterclaim", "using numbers as evidence"],
    keyUse: "Argue",
    eldStandard: "ELD-LA",
    languageFunction: "Explain how numbers can be evidence for a claim.",
    languageFeatures: ["claim and evidence", "however", "persuasive language"],
    minutes: 15,
    content:
      "Identify the claim, number evidence and response to a worry in a letter to the editor.",
    language: "Use that means and however to explain evidence and answer a worry.",
    essential: "How do numbers make an argument stronger?",
    background:
      "Think about how students get to school and where they leave their bikes or scooters.",
    hook: "Forty bikes arrive and only twelve fit in the racks. What happens to the other bikes?",
    purpose:
      "Read to find the writer's claim, her number evidence and her answer to the cost worry.",
    vocab: [
      [
        "rack",
        "a frame that holds things in place",
        "The bike rack holds ten bikes.",
        "bicicletero",
      ],
      [
        "argue",
        "to give reasons for an opinion",
        "Some people argue that racks cost too much.",
        "argumentar",
      ],
      ["damaged", "harmed or broken", "Bikes locked to a drainpipe can be damaged.", "dañado"],
      [
        "board",
        "a group of people who make decisions for schools",
        "The school board will read the letter.",
        "junta",
      ],
    ],
    paras: [
      {
        text: "To the Editor: My name is Camila Reyes, and I am a seventh grader at Ridgeview Middle School. Every morning I ride my bike to school, and every morning I search for a place to lock it. I am writing to ask the school board to add more bike racks.",
        q: "What does Camila ask for?",
      },
      {
        text: "The problem is easy to count. Last Tuesday, I counted 40 bikes at school. Our racks hold only 12. That means 28 bikes were locked to the fence, a signpost, and even a drainpipe. Bikes locked in the wrong places block the walkway and can be damaged.",
        q: "What evidence does Camila give?",
      },
      {
        text: "Some people argue that new racks cost too much. However, a rack that holds ten bikes costs about $150, so three racks would cost $450. Those three racks would hold 30 bikes, enough for the 28 I counted. Spread across our 600 students, $450 is less than one dollar per student.",
        q: "How does Camila answer the worry?",
      },
      {
        text: "More racks would help in other ways. Students who bike get exercise before class, and each student who bikes is one fewer car in the line outside the school. Please give students who ride a safe place to leave their bikes. Sincerely, Camila Reyes",
        q: "How does Camila close?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "How many bikes were locked somewhere other than a rack?",
        opts: ["28 bikes", "40 bikes", "12 bikes"],
        why: [
          "Forty is the total number of bikes Camila counted, including the bikes that were in racks.",
          "Twelve is the number of bikes the racks can hold, not the number locked elsewhere.",
        ],
        rat: "Paragraph 2 says 28 bikes were locked to the fence, a signpost and a drainpipe.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 3, “Some people argue that new racks cost too much.” What does argue mean?",
        opts: [
          "give reasons for an opinion",
          "fight with someone loudly",
          "say yes without thinking",
        ],
        why: [
          "The passage is a calm letter, so argue does not mean a loud fight.",
          "The people have a worry about cost, so they are thinking, not agreeing without thought.",
        ],
        rat: "Some people give a reason, cost, for their opinion about racks, so argue means to give reasons for an opinion.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use numbers from the text",
        type: "choice",
        prompt:
          "Each new rack holds 10 bikes and costs about $150. How much would four racks cost?",
        opts: ["$600", "$450", "$160"],
        why: [
          "Four hundred fifty dollars is the cost of three racks, which is what the letter proposes.",
          "One hundred sixty adds 10 to 150, but each rack costs $150, so the cost must be multiplied.",
        ],
        rat: "Four racks cost 4 × $150 = $600.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that answers the worry about cost.",
        evidence: ["p3"],
        rat: "Paragraph 3 begins with the cost worry and then gives the price of three racks and the cost per student.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author's craft",
        type: "choice",
        prompt: "Why does Camila give exact numbers such as 40 bikes and 12 spaces?",
        opts: [
          "Numbers are evidence that readers can check.",
          "Numbers make the letter sound longer and more serious.",
          "Numbers show that Camila likes math more than biking.",
        ],
        why: [
          "A letter is persuasive because of what its numbers prove, not because of how long it sounds.",
          "Camila uses the numbers to support her request, not to show her favorite subject.",
        ],
        rat: "Counting 40 bikes and 12 spaces turns the problem into facts that readers can check for themselves.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Which statement does the letter best support?",
        opts: [
          "Three new racks would give enough room for the extra bikes.",
          "Students should lock bikes to the fence instead of racks.",
          "The school should spend $600 on four new bike racks.",
        ],
        why: [
          "Camila says bikes locked to the fence block the walkway and can be damaged, so she does not recommend it.",
          "Camila's cost figures are for three racks at about $450, not for four racks.",
        ],
        rat: "Paragraph 3 says three racks would hold 30 bikes, which is enough for the 28 extra bikes.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Respond with evidence",
        type: "short",
        prompt:
          "Is Camila's letter convincing? Use one number or fact from the letter to support your answer.",
        lookFor: [
          "States a clear opinion about the letter",
          "Uses one accurate number such as 28 bikes or $450",
          "Explains why the number helps the argument",
        ],
        rubric: [
          "Takes a position",
          "Uses one accurate number or fact",
          "Connects the evidence to the position",
        ],
        frame: "I think the letter is ___ because ___. The letter says ___, which shows ___.",
        model:
          "I think the letter is convincing because it uses numbers. The letter says only 12 of 40 bikes fit in the racks, which shows that 28 bikes have no safe place to go.",
      },
    ],
    transfer: {
      prompt:
        "Choose a problem in your school or neighborhood that you can count. Write a claim, two numbers as evidence, and one sentence that answers a worry about cost.",
      lookFor: ["States a claim", "Uses two numbers as evidence", "Answers a worry with however"],
      frame: "I think ___. I counted ___ and ___. Some people worry ___; however, ___.",
    },
    guide: {
      mini: "Write 40, 12 and 28 on the board and ask students how the writer found 28. Then discuss how counting helps the writer persuade.",
      discussion: [
        "Which number in the letter is the strongest evidence?",
        "Why does Camila add the cost per student?",
        "What other evidence could Camila gather?",
      ],
      misconception:
        "Students may think any number counts as evidence; ask whether the number helps show that more racks are needed.",
      answerNotes: [
        "Question 3: 4 × 150 = 600; 450 is the cost of three racks.",
        "Question 5: the numbers are checkable facts, which is why they are strong evidence.",
      ],
      model:
        "I think the letter is convincing because it uses numbers. Only 12 of 40 bikes fit in the racks, so 28 bikes have no safe place to go.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student which number is the strongest evidence and why. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez. Pregunte a su estudiante cuál es el número que mejor sirve como evidencia y por qué. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["How many bikes had no rack?", "How does Camila answer the cost worry?"],
    ),
    connections: {
      write: "Write a letter to the editor that uses numbers as evidence.",
      speak: "Tell a partner your claim and the number that supports it.",
      listen: "Listen to an argument and name the evidence.",
    },
  },
];
