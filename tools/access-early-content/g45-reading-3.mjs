// Grades 4-5 Reading, part 3 (language-activities expansion). Original EduWonderLab texts: a garden notice, a corrected
// bus schedule, a seed-library guide, a cause-and-effect passage, a museum label to revise, a fair-test data table, paired
// notices and a council decision. Every school, museum, notice and number is made up for practice and says so; no text
// makes a safety claim or a science claim beyond what its own sentences state. Built into
// access-practice-lab/content/g3-5/Reading.json by tools/build-access-g45-content.mjs (loaded after g45-reading-2.mjs).
// Spec fields are documented in g45-listening.mjs and g45-reading.mjs. This part adds Reading's first constructed
// responses: `type: "constructed"` with `models` A/B/C, `label` and `bank`; the three models grow in detail, and a
// short, clear answer can meet the goal. `support`, `extension` and `teacher` are task-specific.

export default [
  // ── Level A ──────────────────────────────────────────────────────────────
  {
    id: "r3-a-garden-update",
    level: "A",
    strand: "Notices and updates",
    title: "Rooftop Garden: Watering Update",
    skill: "Finding what is new in an update",
    dir: "Read the garden notice. Pay attention to the word UPDATE. Then choose the best answer.",
    q: "On which days will students water the plants now?",
    passageTitle: "Rooftop Garden Update",
    passage: [
      "Dear families, our rooftop garden is growing! Last week, students planted lettuce and radishes.",
      "UPDATE: Watering days have changed. Students will now water the plants on Tuesday and Friday. Before, we watered on Monday and Thursday.",
      "Please remind your child to wear a hat on watering days. This notice is made up for practice.",
    ],
    opts: [
      "Tuesday and Friday|🌱",
      "Monday and Thursday|🌿",
      "Tuesday and Thursday|🍃",
      "Monday and Friday|🪴",
    ],
    why: [
      "These are the old days. The update says watering days have changed.",
      "This mixes one new day with one old day. Read the sentence that starts with Students will now.",
      "This mixes one old day with one new day. Read both days after the word now.",
    ],
    vocab: [
      [
        "update",
        "new information that changes a plan",
        "actualización: información nueva que cambia un plan",
      ],
      ["notice", "a short written message", "aviso: mensaje escrito corto"],
      [
        "planted",
        "put seeds or young plants in the ground",
        "sembraron: pusieron semillas o plantas jóvenes en la tierra",
      ],
    ],
    frames: [
      "The update says students will now water on ___ and ___.",
      "Before, we watered on ___.",
    ],
    focus: ["the word UPDATE", "the words now and before", "the two new days"],
    support:
      "Put your finger on the word UPDATE and read only that paragraph. Write the new days on one line and the old days on another line. Choose the answer that matches the line marked now.",
    extension:
      "Write a two-sentence update for your own classroom job, such as feeding the fish. Use now and before.",
    teacher: {
      use: "Short notice-reading warm-up before the rooftop-garden listening and bus-route tasks.",
      function: "Separating old information from new information in a written update.",
      lower:
        "Read the update paragraph aloud together. Underline now in one color and before in another.",
      onLevel:
        "Students read independently, choose, then say which two days are old and which two are new.",
      challenge:
        "Ask students to explain why mixed answers such as Tuesday and Thursday are tempting but wrong.",
      noTech: "Print the notice; students underline now and before and circle the new days.",
      prompt: "Which word in the notice told you the plan had changed?",
    },
    correct:
      "Yes! The update says students will now water on Tuesday and Friday. Monday and Thursday were the old days.",
    hint: "Find the paragraph that starts with UPDATE. Read the days after the word now.",
    wida: ["Inform: identify new information in a notice", "Notice words that show change"],
  },
  // ── Level B ──────────────────────────────────────────────────────────────
  {
    id: "r3-b-bus-schedule",
    level: "B",
    strand: "Notices and updates",
    title: "Bus 14: The Corrected Schedule",
    skill: "Using a corrected table instead of an old one",
    dir: "Read the notice and look at the table. Use the Corrected column. Then choose the best answer.",
    q: "Rani gets on at Pine Street. When should she be at her stop?",
    passageTitle: "A Correction for Bus 14 Riders",
    passage: [
      "The schedule printed last week had mistakes. Please use only the Corrected column in the table. The order of the first two stops has changed, so Bus 14 now reaches Oak Avenue before Pine Street.",
      "The times for the library corner, the Maple Street crossing, and the school did not change. This notice is made up for practice.",
    ],
    table: {
      caption: "Bus 14 Morning Stops",
      headers: ["Stop", "Printed last week", "Corrected"],
      rows: [
        ["Oak Avenue", "7:40", "7:35"],
        ["Pine Street", "7:35", "7:42"],
        ["Library corner", "7:50", "7:50"],
        ["Maple Street crossing", "7:56", "7:56"],
        ["School", "8:05", "8:05"],
      ],
    },
    opts: ["7:42|🚌", "7:35|🚌", "7:40|🚌", "7:50|🚌"],
    why: [
      "This is the time that was printed last week for Pine Street. The notice says to use the Corrected column.",
      "This is the old time for Oak Avenue. Find the row that says Pine Street.",
      "This is the time for the library corner. Find the row that says Pine Street.",
    ],
    vocab: [
      ["correction", "a change that fixes a mistake", "corrección: cambio que arregla un error"],
      [
        "schedule",
        "a list of times when things happen",
        "horario: lista de horas en que pasan las cosas",
      ],
      [
        "column",
        "a line of boxes that goes up and down in a table",
        "columna: línea vertical de casillas en una tabla",
      ],
    ],
    frames: [
      "The Corrected time for ___ is ___.",
      "Last week's schedule said ___, but now it says ___.",
    ],
    focus: ["the Corrected column", "the row for Pine Street", "the times that did not change"],
    support:
      "Use two fingers. Put one finger on the row name Pine Street and the other on the Corrected column. Slide them until they meet. Then check your answer against the notice, which says to use only the Corrected column.",
    extension:
      "Rani's friend gets on at the library corner. Say or write whether that time changed and how you know from the notice and the table.",
    teacher: {
      use: "Pairs with the bus-route listening correction; students read the written version.",
      function: "Choosing the corrected data in a table and ignoring the outdated column.",
      lower:
        "Highlight the Corrected column and the Pine Street row in two colors; students find where they cross.",
      onLevel:
        "Students read the notice, then use the row and column to find the time, and say why they ignored the old column.",
      challenge:
        "Ask: which two stops changed time? Which three did not? Students point to the proof in the table.",
      noTech: "Print the table; students highlight the row and column and write the time.",
      prompt: "Why did you ignore the Printed last week column?",
    },
    correct:
      "Yes! The Pine Street row in the Corrected column says 7:42. The notice says to use that column.",
    hint: "Find the row for Pine Street, then read the Corrected column, not the Printed last week column.",
    wida: ["Inform: locate corrected information in a table", "Language for Mathematics"],
  },
  {
    id: "r3-b-seed-library-recommend",
    level: "B",
    strand: "Using evidence to decide",
    type: "constructed",
    title: "Seed Library: Choose a Packet",
    skill: "Recommending a choice with two facts from the text",
    dir: "Read the seed cards and the two family notes. Choose ONE family. Write two or three sentences that recommend one seed packet for that family.",
    q: "Which packet would you recommend for the family you chose, and which two facts from the cards support it?",
    passageTitle: "Maple Street Seed Library: Guide Cards",
    passage: [
      "These cards are made up for practice. Each family may borrow one packet today.",
      "Leaf lettuce: grows in sun or part shade. Small pots work well. You can pick leaves about six weeks after planting.",
      "Zinnias: need full sun and room between plants. Flowers open about eight weeks after planting, and bees and butterflies visit them.",
      "The Costa family has a porch that is shady most of the day. They have pots but no garden bed, and they want something to eat before summer ends.",
      "The Lee family has a sunny yard with lots of space. They want flowers that bees will visit.",
    ],
    label: "Your recommendation",
    focus: [
      "the family you chose and the packet you recommend",
      "one fact from the guide card",
      "one fact from the family note",
    ],
    bank: ["recommend", "because", "according to", "shade", "full sun", "space", "bees", "pick"],
    models: {
      A: "I recommend leaf lettuce for the Costa family. It grows in part shade. They have pots.",
      B: "I recommend leaf lettuce for the Costa family because the card says it grows in part shade and small pots work well. The family has a shady porch with pots.",
      C: "I recommend leaf lettuce for the Costa family. According to the card, it grows in part shade and small pots work well, and the Costa family has a shady porch with only pots. Zinnias are a good packet too, but they need full sun and room between plants, so they would not fit this porch.",
    },
    vocab: [
      [
        "recommend",
        "to say that a choice is a good one and tell why",
        "recomendar: decir que una opción es buena y explicar por qué",
      ],
      [
        "packet",
        "a small paper envelope that holds seeds",
        "sobre: pequeño sobre de papel que guarda semillas",
      ],
      [
        "evidence",
        "facts that show a choice is a good one",
        "evidencia: datos que muestran que una opción es buena",
      ],
    ],
    frames: [
      "I recommend ___ for the ___ family.",
      "I recommend it because the card says ___.",
      "This fits because the family has ___.",
    ],
    support:
      "Pick a family first. Underline what the family has or wants, then underline the card whose facts match. Write one fact from the card and one fact from the family note, joined by because. You can compare two cards, but you only need to recommend one.",
    extension:
      "Say what each family should check before planting, such as how much sun their space gets. Then write one question you would ask the librarian that could change your recommendation.",
    teacher: {
      use: "Reading and writing lesson on using evidence to make a choice; pairs with the seed-library listening task.",
      function:
        "Recommending a choice by matching two facts from one text to two facts from another.",
      lower:
        "Give a match-up organizer with the two families and two cards. Students draw a line from each need to a fact, then write one sentence.",
      onLevel:
        "Students choose a family, underline matching facts, and write two or three sentences using because or according to.",
      challenge:
        "Ask students to explain why the other packet does not fit that family, using one fact from its card.",
      noTech: "Print the cards; students underline in two colors and write on lined paper.",
      prompt: "Which fact from the card matches which fact about the family?",
    },
    correct:
      "Response saved. A strong response names a packet, uses a fact from the card, and connects it to a fact about the family. Either family can be answered well.",
    hint: "Find what your family has and wants. Then find the card whose facts match. Say both facts with because.",
    wida: [
      "Argue: recommend a choice with evidence from two parts of a text",
      "Use because and according to",
    ],
  },
  {
    id: "r3-b-marsh-grass-signals",
    level: "B",
    strand: "Cause and effect",
    type: "cloze",
    title: "Marsh Grass and the Shoreline",
    skill: "Choosing signal words that link causes and effects",
    dir: "Read the passage about marsh grass. Choose the word that makes each sentence make sense.",
    q: "Fill each blank with the signal word that fits the cause and effect.",
    cloze: [
      "Scientists who study bays have found that marsh grass roots hold soil together, ",
      ["so", "because", "but", "or"],
      " waves wash away less of the shore. The shoreline stays in place longer ",
      ["because", "so", "however", "but"],
      " the roots keep holding the soil. Marsh grass also gives crabs places to hide. ",
      ["However", "As a result", "For example", "Because"],
      ", a very strong storm can still wash some grass away.",
    ],
    vocab: [
      ["shoreline", "the edge of land beside water", "costa: borde de tierra junto al agua"],
      [
        "roots",
        "the parts of a plant that grow into the soil",
        "raíces: partes de una planta que crecen en la tierra",
      ],
      [
        "signal word",
        "a word that shows how ideas connect",
        "palabra clave: palabra que muestra cómo se conectan las ideas",
      ],
    ],
    frames: ["The roots hold soil, which means ___.", "The shoreline lasts longer because ___."],
    focus: [
      "the cause in each sentence",
      "the effect in each sentence",
      "the words so, because, and however",
    ],
    support:
      "Before you choose, say each sentence as cause then effect: The roots hold soil. The waves wash away less. Then choose the connector that makes each sentence clear. Use the sentence order to decide whether the reason or result comes first.",
    extension:
      "Write two sentences about a different cause and effect, one with so and one with because, about the same facts. Then write one sentence that begins with However to show a limit.",
    teacher: {
      use: "Cause-and-effect mini-lesson; pairs with the Heron Marsh listening chain.",
      function:
        "Choosing signal words that match the direction of a cause-and-effect relationship.",
      lower:
        "Read each sentence aloud with the blank. Ask what happened first and what happened because of it.",
      onLevel:
        "Students complete the blanks, then reread to check that each sentence says the cause the way the passage means.",
      challenge: "Ask students to swap so and because and say why the sentence becomes untrue.",
      noTech:
        "Print the cloze; students write the missing words and say each sentence aloud to a partner.",
      prompt: "Does the word you chose tell the reason or the result?",
    },
    correct:
      "Yes! So shows the result, because shows the reason, and However shows a limit to the idea.",
    hint: "Ask which part is the cause and which part is the effect. So points to the effect, and because points to the cause.",
    wida: [
      "Explain: use signal words for cause, effect, and limits",
      "Notice conjunctions and transitions",
    ],
  },
  // ── Level C ──────────────────────────────────────────────────────────────
  {
    id: "r3-c-museum-label-revision",
    level: "C",
    strand: "Revise with evidence",
    type: "constructed",
    title: "Revise the Museum Label",
    skill: "Revising a short text using facts from a source",
    dir: "Read the draft label, the visitor comments, and the fact card. Then write a better label of two or three sentences. Use only facts from the fact card.",
    q: "Write a revised label for the bell that answers at least two of the visitor questions.",
    passageTitle: "The Ferry Bell: Draft Label",
    passage: [
      "Everything here is made up for practice. Draft label: This is a bell. It is old. People rang it. It is cracked.",
      "Visitor comments: One visitor wrote, I did not know what the bell was used for. Another wrote, Why is the bell cracked? A third wrote, Who gave it to the museum?",
      "Fact card: The bell is bronze and weighs about forty pounds. It was rung when the ferry left the dock from 1904 to 1962. A storm cracked the rim in 1938, and the bell was still rung for many years. The family of a retired ferry captain gave it to the museum.",
    ],
    label: "Your revised label",
    focus: [
      "what the bell was used for",
      "an answer to at least one other visitor question",
      "only facts that are on the fact card",
    ],
    bank: ["was rung", "ferry", "dock", "cracked", "donated", "bronze", "from ___ to ___"],
    models: {
      A: "This bronze bell was rung when the ferry left the dock. A storm cracked it in 1938.",
      B: "This bronze bell was rung when the ferry left the dock from 1904 to 1962. A storm cracked the rim in 1938, but people kept ringing it. A ferry captain's family gave it to the museum.",
      C: "The Ferry Bell was rung when the ferry left the dock from 1904 to 1962. A storm cracked its bronze rim in 1938, but the bell was still rung for many years. The family of a retired ferry captain gave it to the museum.",
    },
    vocab: [
      [
        "revise",
        "to change a text to make it clearer and more complete",
        "revisar: cambiar un texto para que sea más claro y completo",
      ],
      [
        "label",
        "a short text that tells about an object in a museum",
        "etiqueta: texto corto que explica un objeto en un museo",
      ],
      ["donate", "to give something to a group or place", "donar: dar algo a un grupo o lugar"],
    ],
    frames: ["This bell was used to ___.", "It was rung from ___ to ___.", "A storm ___ in ___."],
    support:
      "List the three visitor questions. Next to each one, write the fact-card words that answer it. Pick at least two. Then write your label with one sentence for each answer. Check that every number and name is spelled the way the fact card spells it.",
    extension:
      "Cut your label to one sentence of fifteen words or fewer that a visitor can read in a few seconds. Then say what you chose to leave out and why.",
    teacher: {
      use: "Reading and writing lesson on revising informational text for an audience.",
      function:
        "Revising with source facts to answer readers' questions without adding unsupported claims.",
      lower:
        "Provide the question-to-fact organizer pre-filled for the first question. Students complete the second and write one sentence per answer.",
      onLevel:
        "Students match visitor questions to facts, then write two or three sentences. They check every fact against the card.",
      challenge:
        "Ask students to write a one-sentence label and defend what they left out, or to add a heading that fits.",
      noTech:
        "Print the three parts; students match questions to facts with colored pencils and write the label.",
      prompt: "Which visitor question does each of your sentences answer?",
    },
    correct:
      "Response saved. A strong label uses facts from the card, answers real visitor questions, and does not add anything the card does not say.",
    hint: "Start with the question about what the bell was used for. Then add the fact that answers a second question, such as why it is cracked.",
    wida: [
      "Explain: revise a text so it answers readers' questions",
      "Use facts from a source without copying all of it",
    ],
  },
  {
    id: "r3-c-bottle-data",
    level: "C",
    strand: "Data and conclusions",
    title: "What Do the Bottle Data Show?",
    skill: "Choosing a conclusion the data really support",
    dir: "Read the investigation report and study the table. Then choose the conclusion that the table supports best.",
    q: "Which conclusion do these data support best?",
    passageTitle: "Wrap Color and Water Temperature",
    passage: [
      "This report and its numbers are made up for practice. Two students tested whether a white wrap or a black wrap changes how much a bottle of water warms in the sun. Both bottles were the same size and held the same amount of water. They sat side by side on the same windowsill.",
      "The water in both bottles started at 70 degrees Fahrenheit. The students read each thermometer after thirty minutes. They repeated the test three times.",
    ],
    table: {
      caption: "Water Temperature After Thirty Minutes (degrees Fahrenheit)",
      headers: ["Trial", "White wrap", "Black wrap"],
      rows: [
        ["Trial 1", "74", "79"],
        ["Trial 2", "75", "80"],
        ["Trial 3", "74", "78"],
      ],
    },
    opts: [
      "In these three trials, the water in the black-wrap bottle ended up warmer each time.",
      "A black wrap makes every kind of bottle warmer than a white wrap in any place.",
      "The white-wrap bottle ended up warmer than the black-wrap bottle in each trial.",
      "The wrap color did not matter because both bottles started at 70 degrees.",
    ],
    why: [
      "The table only shows one kind of bottle in one place, so it cannot show what happens to every bottle everywhere. Look for a conclusion that stays inside these trials.",
      "Read across each row. The white-wrap number is smaller than the black-wrap number every time.",
      "Starting at the same temperature is part of a fair test. The readings after thirty minutes are different, so the wrap may matter in this test.",
    ],
    vocab: [
      [
        "conclusion",
        "a decision based on the facts you have",
        "conclusión: decisión basada en los datos que tienes",
      ],
      ["trial", "one time a test is done", "ensayo: cada vez que se hace una prueba"],
      ["supported", "backed up by facts or data", "respaldado: apoyado por datos o hechos"],
    ],
    frames: ["In these ___ trials, the ___ bottle was warmer.", "The data do not show ___."],
    focus: [
      "the numbers in each row",
      "what the students kept the same",
      "a conclusion that stays inside what was tested",
    ],
    support:
      "Read across each row and write which wrap is warmer, white or black. Then test each choice against your three notes. A choice that says every, always, or in any place is bigger than the three trials, so check whether the table covers it.",
    extension:
      "Rewrite the too-big choice so the table does support it, such as by naming the wraps, the bottle, and the place tested. Then say one more test you would run before you said it for other bottles.",
    teacher: {
      use: "Science or reading lesson on data and careful claims; follows the listening task on planning a fair test.",
      function:
        "Judging which conclusion a small data set supports and noticing claims that go beyond the data.",
      lower:
        "Fill in a three-row comparison chart (white, black, warmer) together. Then read the four choices one at a time.",
      onLevel:
        "Students read across each row, choose a conclusion, and explain why one choice goes too far.",
      challenge:
        "Ask students to name two conditions that were kept the same and tell what would be unclear if they were not.",
      noTech:
        "Print the report; students write the warmer wrap beside each row and test the four choices.",
      prompt: "What words in a conclusion tell you it might say more than the data show?",
    },
    correct:
      "Yes! In all three trials the black-wrap bottle was warmer. This conclusion stays inside what was tested and does not claim anything about other bottles.",
    hint: "Read each row. Choose the conclusion that matches all three rows and does not say more than the table can show.",
    wida: ["Argue: choose a conclusion that data support", "Language for Science"],
  },
  {
    id: "r3-c-mural-paired-notices",
    level: "C",
    strand: "Comparing two sources",
    type: "hotText",
    title: "Two Notices About Mural Day",
    skill: "Combining evidence from two notices",
    dir: "Read the sentences from two notices. Click the TWO sentences, one from each notice, that together tell what to wear and why.",
    q: "Click the two sentences that together tell what to wear and why.",
    passageTitle: "Two Notices About Mural Day",
    sentences: [
      "Notice A (Art Club): Mural painting is on Wednesday after school.",
      "Notice A: Please wear old clothes.",
      "Notice A: Students sign up with Mr. Reed.",
      "Notice B (Principal's Office): Paint can stain fabric, even after washing.",
      "Notice B: Brushes will be washed in the sink by the gym.",
      "Notice B: Sign-up ends on Monday.",
    ],
    answerIdx: [1, 3],
    distractorFeedback: {
      s1: "This tells when painting happens, not what to wear.",
      s3: "This tells how to sign up. It does not tell what to wear or why.",
      s5: "This is about brushes. It does not tell what students should wear.",
      s6: "This is about the sign-up deadline, not about clothes.",
    },
    vocab: [
      ["notice", "a short written message", "aviso: mensaje escrito corto"],
      [
        "stain",
        "to leave a mark that is hard to remove",
        "manchar: dejar una marca difícil de quitar",
      ],
      ["fabric", "cloth, like the material in a shirt", "tela: material como el de una camisa"],
    ],
    frames: [
      "Notice A tells students to ___.",
      "Notice B tells us why: ___.",
      "Together, the notices say ___ because ___.",
    ],
    focus: [
      "one sentence about what to wear",
      "one sentence about why",
      "the notice each sentence comes from",
    ],
    support:
      "Sort the six sentences with two labels: What to do and Why. The first label has the instruction about clothes. The second has the reason about paint. Then pick one sentence from each label and check that they come from different notices.",
    extension:
      "Write one sentence that joins the two choices with because. Then write a similar pair of notices about another event, one that gives an instruction and one that gives the reason.",
    teacher: {
      use: "Paired-text reading lesson that follows or precedes the spoken mural-notice task.",
      function: "Combining an instruction from one text with a reason from another.",
      lower:
        "Underline instructions in one color and reasons in another. Students pick one underlined sentence from each color.",
      onLevel:
        "Students read both notices, click the two sentences, and say them joined with because.",
      challenge:
        "Ask students to explain why a sentence about brushes seems related to paint but does not answer the question.",
      noTech: "Print the six sentences on strips; students pair an instruction with its reason.",
      prompt: "Which sentence gives the instruction, and which gives the reason?",
    },
    correct:
      "Yes! Notice A says to wear old clothes, and notice B says why: paint can stain fabric, even after washing. Together they tell what to wear and why.",
    hint: "One sentence says what to wear. A second sentence from the other notice says why. Neither one is about the day, the sign-up, or the brushes.",
    wida: [
      "Explain: combine an instruction and a reason from two texts",
      "Notice which source each sentence comes from",
    ],
  },
  {
    id: "r3-c-shade-plans",
    level: "C",
    strand: "Using evidence to decide",
    type: "constructed",
    title: "Shade Plans: Write to the Principal",
    skill: "Recommending a plan with facts from a table",
    dir: "Read the meeting notes and study the table. Then write three or four sentences to the principal that recommend one plan. Use at least two facts from the table.",
    q: "Which plan do you recommend, which two facts from the table support it, and what could change your mind?",
    passageTitle: "Student Council Minutes: Shade for the Playground",
    passage: [
      "These minutes and numbers are made up for practice. Ines proposed a shade sail over the benches. Marco proposed planting small trees. The advisor asked members to compare both plans using the table before the vote.",
      "Several members said that the council has only a small budget. Others said students need shade as soon as possible. The council agreed to ask the principal for a decision.",
    ],
    table: {
      caption: "Two Shade Plans",
      headers: ["Plan", "When students get shade", "Cost to the council", "Care needed"],
      rows: [
        ["Shade sail", "This spring", "$1,200", "Check the ropes and wash it once a year"],
        [
          "Small trees",
          "After several years",
          "$300",
          "Water every week for the first two summers",
        ],
      ],
    },
    label: "Your note to the principal",
    focus: [
      "the plan you recommend",
      "two facts from the table that support it",
      "one thing that could change your mind",
    ],
    bank: [
      "recommend",
      "cost",
      "budget",
      "care",
      "soon",
      "however",
      "according to the table",
      "could change my mind",
    ],
    models: {
      A: "I recommend the shade sail. The table says students get shade this spring. It costs $1,200.",
      B: "I recommend the shade sail because the table says students get shade this spring. It costs more, $1,200 instead of $300, but trees take several years. I might change my mind if the council cannot raise the money.",
      C: "I recommend the shade sail. According to the table, students would have shade this spring, while small trees would take several years. The sail costs $1,200, which is more than the $300 for trees, and the council has a small budget. However, I would change my mind if the council could not raise the money, and I would suggest planting trees later so students get shade in the future too.",
    },
    vocab: [
      [
        "budget",
        "the amount of money a group has to spend",
        "presupuesto: cantidad de dinero que un grupo puede gastar",
      ],
      [
        "recommend",
        "to say that a choice is a good one and tell why",
        "recomendar: decir que una opción es buena y explicar por qué",
      ],
      [
        "minutes",
        "a written record of what was said at a meeting",
        "acta: registro escrito de lo que se dijo en una reunión",
      ],
    ],
    frames: [
      "I recommend ___ because the table says ___.",
      "The ___ costs ___, but ___.",
      "I could change my mind if ___.",
    ],
    support:
      "Read down one column at a time: when, cost, care. Write the shade sail's fact and the trees' fact for each column. Choose your plan, then pick the two columns that matter most to you. Use however to name the cost of your choice and say what could change your mind.",
    extension:
      "Write a two-sentence compromise that uses part of both plans. Then say which row of the table supports each part.",
    teacher: {
      use: "Reading, writing, and civics lesson on recommending with evidence; pairs with the shade-meeting listening task.",
      function:
        "Recommending a plan with facts from a table and naming a limit or condition on the decision.",
      lower:
        "Give a column-by-column comparison chart pre-filled for the first column. Students complete two more and write two sentences.",
      onLevel:
        "Students compare the plans column by column and write three or four sentences with two table facts and one condition.",
      challenge:
        "Ask students to write a compromise and to say which part of the table supports each half.",
      noTech:
        "Print the minutes and table; students highlight facts for each plan and write on paper.",
      prompt: "Which two columns of the table matter most for your choice, and why?",
    },
    correct:
      "Response saved. A strong note names a plan, uses at least two facts from the table, and says what could change the decision. Either plan can be supported.",
    hint: "Either plan can work. Pick one, then use two facts from the table, such as when students get shade and what it costs.",
    wida: [
      "Argue: recommend a plan with evidence from a table",
      "Use however to show a limit or a condition",
    ],
  },
];
