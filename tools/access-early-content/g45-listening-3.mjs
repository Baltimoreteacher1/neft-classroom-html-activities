// Grades 4-5 Listening, part 3 (language-activities expansion). Original EduWonderLab scripts: corrections and updates,
// a community decision, a meeting, a fair-test plan, paired notices and a cause chain. Every talk is made up for practice
// (the school, speakers, wetland and numbers are illustrative); none states a science fact beyond what the script says.
// Built into access-practice-lab/content/g3-5/Listening.json by tools/build-access-g45-content.mjs (loaded after
// g45-listening-2.mjs). Spec fields are documented in g45-listening.mjs. This part also uses `type: "constructed"`
// (models A/B/C, label) and `type: "sort"` (cats, sortItems [text, categoryIndex], itemFeedback keyed s1..sN in
// sortItems order) and `support`, `extension`, `teacher` overrides so supports and transfer are task-specific.

export default [
  // ── Level A ──────────────────────────────────────────────────────────────
  {
    id: "l3-a-jacket-correction",
    level: "A",
    strand: "Updates and corrections",
    title: "Found: One Blue Jacket",
    skill: "Listening for a correction",
    dir: "Listen to the announcement. The speaker fixes a mistake. Choose the room that is correct now.",
    q: "Which room has the blue jacket now?",
    script:
      "Attention, students. A blue jacket was found on the playground. I first said that it is in room twelve. That was a mistake. The jacket is in room twenty-one, at the end of the hall. If it is yours, please come to room twenty-one after lunch.",
    opts: ["Room 21|🚪", "Room 12|🚪", "Room 22|🚪", "Room 11|🚪"],
    why: [
      "Room 12 is the room the speaker said first. Listen for the words that was a mistake.",
      "The first room number was corrected. Listen for the new number the speaker gives at the end.",
      "This room number is not in the announcement. Listen for the room after the mistake.",
    ],
    vocab: [
      [
        "announcement",
        "a short message for everyone to hear",
        "anuncio: mensaje corto para que todos lo oigan",
      ],
      ["mistake", "something that is not right", "error: algo que no está bien"],
      ["correct", "right, with no mistakes", "correcto: sin errores"],
    ],
    frames: ["First the speaker said room ___.", "The correct room is ___."],
    focus: [
      "the words that was a mistake",
      "the first room number and the new room number",
      "the number that comes after the mistake",
    ],
    support:
      "Write two boxes on paper: First said and Now. Listen once and write the first room number in the first box. Listen again for the words that was a mistake, then write the new number in the second box.",
    extension:
      "Write a two-sentence correction of your own, such as for a lunch time or a bus number. Start with First I said and then use That was a mistake.",
    teacher: {
      use: "Warm-up before any listening task where a speaker changes information.",
      function: "Hearing which detail is the correction and which detail is no longer true.",
      lower:
        "Read it twice. After the words that was a mistake, stop and ask: which number is old and which is new?",
      onLevel: "Read once at a natural pace. Students choose, then say the two numbers they heard.",
      challenge:
        "Read a new version where the speaker corrects a time, not a room. Students write the old and new time.",
      noTech: "Read the script aloud and have students show the room number with their fingers.",
      prompt: "Which words told you the first number was wrong?",
    },
    correct:
      "Yes! The speaker first said room twelve, then corrected it to room twenty-one. The words that was a mistake showed which number to ignore.",
    hint: "Find the words that was a mistake. The number after those words is the one to choose.",
    wida: ["Inform: tell old information from corrected information", "Notice correction words"],
  },
  // ── Level B ──────────────────────────────────────────────────────────────
  {
    id: "l3-b-rooftop-update",
    level: "B",
    strand: "Updates and corrections",
    title: "Rooftop Garden: Planting Day Update",
    skill: "Telling what changed and what stayed the same in an update",
    dir: "Listen to the garden update. Think about last week's plan and the new plan. Then choose the best answer.",
    q: "What is different from last week's plan?",
    script:
      "Good afternoon, families. Here is an update about the rooftop garden. Last week we said that planting day would be Saturday at nine o'clock. Because rain is expected on Saturday, we are moving planting day to Sunday. The start time stays the same. Students should still bring gloves, but you do not need to bring tools. The garden club will have shovels and watering cans for everyone. The tomato seedlings arrive on Friday, so they will be ready to plant.",
    opts: [
      "The day moved to Sunday, and the start time stayed at nine.",
      "The start time moved later, and the day stayed on Saturday.",
      "The day moved to Sunday, and families must bring their tools.",
      "The day stayed on Saturday, and the seedlings arrive on Sunday.",
    ],
    why: [
      "The speaker says the start time stays the same. Listen for the one thing that moved.",
      "The speaker says families do not need to bring tools. The garden club will have them.",
      "The speaker says the day moved. The seedlings arrive on Friday.",
    ],
    vocab: [
      ["update", "new information about a plan", "actualización: información nueva sobre un plan"],
      [
        "seedling",
        "a very young plant that grew from a seed",
        "plántula: planta muy joven que creció de una semilla",
      ],
      ["expected", "thought likely to happen", "se espera: se piensa que probablemente ocurrirá"],
    ],
    frames: [
      "Last week we said ___. Now ___.",
      "The ___ stays the same.",
      "The plan changed because ___.",
    ],
    focus: [
      "the old plan and the new plan",
      "the words stays the same",
      "the reason for the change",
    ],
    support:
      "Make two columns: Last week and Now. Add a row for the day, the start time, and the tools. Listen once to fill the Last week column, then again to fill Now. A row that is the same in both columns is the thing that stayed the same.",
    extension:
      "Write a short update for a different event that was moved, such as a field trip. Name the old plan, the new plan, one thing that stays the same, and the reason.",
    teacher: {
      use: "Partners or a listening center; connects to reading a written update.",
      function:
        "Comparing an old plan with a new plan and naming what changed, what stayed the same, and why.",
      lower:
        "Provide the two-column chart with the row labels filled in. Pause after Last week we said and after The start time stays the same.",
      onLevel:
        "Read once. Students choose, then use the chart to say one thing that changed and one that stayed the same.",
      challenge:
        "Ask what the speaker might say if rain were expected on Sunday too. Students write a second update.",
      noTech: "Read the script aloud; students fill the Last week and Now chart on paper.",
      prompt: "Which words told you the start time was not part of the change?",
    },
    correct:
      "Yes! Only the day changed, from Saturday to Sunday. The start time stays at nine, and the garden club brings the tools.",
    hint: "Listen for the day first, then for the words stays the same. Check each choice against both parts.",
    wida: [
      "Inform: compare an old plan with an updated plan",
      "Explain: give a reason for a change",
    ],
  },
  {
    id: "l3-b-bus-route-correction",
    level: "B",
    strand: "Updates and corrections",
    type: "order",
    title: "Bus Route Correction",
    skill: "Putting stops in order after a correction",
    dir: "Listen to the correction from the transportation office. Put the bus stops in the new order.",
    q: "In what order will the bus make its stops?",
    script:
      "This is the transportation office with a correction for riders on Bus fourteen. This morning's message said the bus would stop at Pine Street first. That was wrong. Bus fourteen will stop at Oak Avenue first. Next, it will stop at Pine Street. After Pine Street, it will pick up students at the library corner. The last stop before school is the Maple Street crossing. We are sorry for the mix-up.",
    items: ["Oak Avenue", "Pine Street", "The library corner", "The Maple Street crossing"],
    itemFeedback: {
      s1: "This stop is first now. Listen for the words will stop at ___ first after the word wrong.",
      s2: "The morning message put this stop first, but the correction says it is second. Listen for the word next.",
      s3: "Listen for after Pine Street. This stop comes before the last stop.",
      s4: "Listen for the last stop before school. It comes after the library corner.",
    },
    vocab: [
      ["correction", "a change that fixes a mistake", "corrección: cambio que arregla un error"],
      [
        "stop",
        "a place where the bus picks up students",
        "parada: lugar donde el autobús recoge estudiantes",
      ],
      ["mix-up", "a mistake from mixing things up", "confusión: error por mezclar cosas"],
    ],
    frames: [
      "The bus stops at ___ first.",
      "Next, it stops at ___.",
      "The last stop before school is ___.",
    ],
    focus: [
      "the old order and the corrected order",
      "the words first, next, after, and last",
      "the stop names",
    ],
    support:
      "Before you listen, write the four stop names on sticky notes. Listen once for the old message and the words that was wrong. Listen again and move the notes into the new order, using first, next, after, and last.",
    extension:
      "Draw a simple route line from your home to school with three stops. Then give a partner a correction that swaps two stops, and ask the partner to say the new order.",
    teacher: {
      use: "Listening center or small group; pairs with the written bus-route table.",
      function: "Updating a sequence after a spoken correction.",
      lower:
        "Give the stop names on cards. Read one sentence at a time and place a card after each sentence that names a stop.",
      onLevel:
        "Read once. Students order the stops, then say the new route with first, next, after, and last.",
      challenge:
        "Add a second correction: the library corner moves before Pine Street. Students re-order and say what changed.",
      noTech: "Read the script aloud; students order four cut-up stop names on their desks.",
      prompt: "Which stop did the old message say was first, and how do you know it changed?",
    },
    correct:
      "Yes! The correction puts Oak Avenue first, then Pine Street, the library corner, and the Maple Street crossing.",
    hint: "The old message is not the order to use. Listen for first, next, after, and last in the correction.",
    wida: [
      "Narrate: sequence stops in a corrected route",
      "Notice sequence words and correction words",
    ],
  },
  {
    id: "l3-b-seed-library-choice",
    level: "B",
    strand: "Choices and decisions",
    title: "At the Seed Library",
    skill: "Finding the reason behind a choice in a conversation",
    dir: "Listen to a talk between a librarian and a student. Then choose the answer that tells what he picks and why.",
    q: "Which seeds does Dev choose, and why?",
    script:
      "Librarian: Welcome to the seed library. You may borrow up to three packets. Dev: I want to grow something on my balcony. It is small, but it is sunny all afternoon. Librarian: Sunflowers love sun, but they grow very tall and need a lot of room. Pole beans might fit better. They climb up a string, so they do not need much floor space. Dev: That sounds right for a small balcony. I will take the beans. Librarian: Wonderful. In the fall, please bring back a few seeds from your plants so other families can borrow them.",
    opts: [
      "Pole beans, because they climb a string and fit a small balcony.",
      "Sunflowers, because they love sun and his balcony is sunny.",
      "Pole beans, because the librarian said sunflowers are not allowed.",
      "Sunflowers, because they need very little room to grow.",
    ],
    why: [
      "The librarian does say sunflowers love sun, but she also says they need a lot of room. Dev's balcony is small.",
      "The librarian never says sunflowers are not allowed. She says they need a lot of room.",
      "The librarian says sunflowers grow very tall and need a lot of room, not a little.",
    ],
    vocab: [
      [
        "borrow",
        "to take something and bring it back later",
        "pedir prestado: tomar algo y devolverlo después",
      ],
      [
        "packet",
        "a small paper envelope that holds seeds",
        "sobre: pequeño sobre de papel que guarda semillas",
      ],
      [
        "fit",
        "to be the right size or kind for a place",
        "quedar bien: ser del tamaño o tipo adecuado para un lugar",
      ],
    ],
    frames: [
      "Dev chooses ___ because ___.",
      "Sunflowers need ___, but his balcony is ___.",
      "The librarian asks him to ___ in the fall.",
    ],
    focus: [
      "what Dev says about his balcony",
      "what the librarian says about each plant",
      "the reason that matches the choice",
    ],
    support:
      "Make a small chart with three rows: balcony, sunflowers, pole beans. As you listen, write one fact in each row. Then check which plant's fact matches the balcony's fact.",
    extension:
      "Imagine a different place, such as a shady porch or a classroom window. Say which kind of plant you would borrow and give one reason that matches the place.",
    teacher: {
      use: "Small group or center; connects to the written seed-library guide.",
      function: "Linking a choice to the reason that supports it.",
      lower:
        "Fill in the balcony row together first (small, sunny). Read the librarian's two plant sentences separately.",
      onLevel:
        "Read once. Students choose, then say which two facts, one about the balcony and one about the plant, support the choice.",
      challenge:
        "Ask students to explain why a choice that mentions only sun is not enough, using the second plant fact.",
      noTech:
        "Two students read the librarian and Dev; the listener fills the three-row chart on paper.",
      prompt: "Which two facts have to match for the choice to make sense?",
    },
    correct:
      "Yes! The balcony is small, and pole beans climb a string, so they do not need much floor space.",
    hint: "A good reason matches the plant to the place. What does Dev say about his balcony, and what does the librarian say beans need?",
    wida: ["Explain: connect a choice to a reason", "Notice reasons in a conversation"],
  },
  // ── Level C ──────────────────────────────────────────────────────────────
  {
    id: "l3-c-shade-meeting",
    level: "C",
    strand: "Meetings and discussion",
    type: "constructed",
    title: "Listen and Respond: Shade for the Playground",
    skill: "Taking a position after hearing two speakers",
    dir: "Listen to a made-up student council meeting about shade. Then write two or three sentences that tell which plan you would recommend and why.",
    q: "Which plan would you recommend for the playground, and what reason from the meeting supports it? Tell one thing you would still like to find out.",
    script:
      "This is a meeting of the student council. Ines: Our playground has almost no shade, so I propose a shade sail over the benches. A crew could put it up this spring, and students could use it right away. Marco: A sail would help, but I would plant trees. Trees give shade, and they also give birds a place to rest. Ines: True, but small trees take many years to make much shade. Marco: That is right. Still, the sail costs more money, and the council would have to raise it. Ms. Bell, the advisor: Both plans have good points. Which one would help students soonest, and what would we still need to find out?",
    label: "Your recommendation",
    focus: [
      "the plan you recommend",
      "a reason one of the speakers gave",
      "why that reason matters or what you still want to find out",
    ],
    bank: ["propose", "shade sail", "soonest", "cost", "according to", "although", "find out"],
    models: {
      A: "I recommend the shade sail. Ines said students could use it right away. I want to find out how much it costs.",
      B: "I recommend the shade sail because Ines said a crew could put it up this spring. That matters because students need shade soon. I would still like to find out how the council can raise the money.",
      C: "I recommend the shade sail first because, according to Ines, it could be up this spring, while small trees take many years to make much shade. Although Marco is right that trees help birds and the sail costs more, students need shade now. I would still like to find out how much the sail costs and whether we could plant trees later.",
    },
    vocab: [
      ["propose", "to suggest a plan", "proponer: sugerir un plan"],
      [
        "advisor",
        "an adult who gives advice to a group",
        "asesora: adulta que da consejos a un grupo",
      ],
      [
        "recommend",
        "to say that a choice is a good one and tell why",
        "recomendar: decir que una opción es buena y explicar por qué",
      ],
    ],
    frames: [
      "I recommend ___ because ___.",
      "According to ___, ___.",
      "I would still like to find out ___.",
    ],
    support:
      "Fill in a two-column note chart as you listen: Ines and Marco. Write each speaker's plan and one reason. Then circle the reason that helps students soonest. Start your answer with I recommend and use According to to show where your reason came from.",
    extension:
      "Write one question you would ask Ms. Bell, the advisor, that would help the council decide. Then say whether the answer could change your recommendation.",
    teacher: {
      use: "Social studies or advisory lesson on community decisions and respectful disagreement.",
      function:
        "Taking and supporting a position from spoken evidence, and naming what is still unknown.",
      lower:
        "Give a Plan / Reason chart with each speaker's plan filled in. Students add one reason per speaker and then choose.",
      onLevel:
        "Read once with three voices. Students take notes, then write or say two or three sentences.",
      challenge:
        "Ask students to write a compromise that uses both plans, and to say which speaker's concern it answers.",
      noTech:
        "Three students read Ines, Marco, and Ms. Bell; the class writes on paper and shares aloud.",
      prompt: "Which reason would convince someone who first disagreed with you?",
    },
    correct:
      "Response saved. A strong answer names a plan, uses a reason a speaker really gave, and says why it matters or what is still unknown. Both plans can be supported.",
    hint: "Either plan can work. Choose one, then point to a reason from the meeting, such as when students could use it.",
    wida: [
      "Argue: recommend a plan with a reason from a talk",
      "Respond to another speaker's viewpoint",
    ],
  },
  {
    id: "l3-c-bottle-fair-test",
    level: "C",
    strand: "Science plans and tests",
    type: "multiSelect",
    title: "Plan a Fair Bottle Test",
    skill: "Hearing what a team changes and what it keeps the same",
    dir: "Listen to two students plan an investigation. Then choose ALL the things they must keep the same. There is more than one answer.",
    q: "Which things must Rosa and Kai keep the same?",
    script:
      "Rosa and Kai are planning an investigation, and this is a made-up plan. Rosa: We want to find out whether a white wrap or a black wrap keeps a bottle of room-temperature water cooler in the sun. Kai: So the color of the wrap is the one thing we change. Rosa: Right. Everything else stays the same. Both bottles will be the same size. Each will hold the same amount of water. Kai: And we will set them side by side on the same windowsill. Rosa: Yes. After thirty minutes, we will read the thermometer in each bottle. Then we will compare the two readings.",
    opts: [
      "The size of the bottles",
      "The amount of water in each bottle",
      "The spot where the bottles sit",
      "The color of the wrap",
      "The temperature each thermometer shows",
    ],
    ans: 3,
    why: [
      "The color of the wrap is the one thing they change on purpose. Listen for the words the one thing we change.",
      "The temperature is what they measure at the end. They want to compare the two readings, so the readings may be different.",
    ],
    vocab: [
      [
        "investigation",
        "a careful search to find an answer",
        "investigación: búsqueda cuidadosa para encontrar una respuesta",
      ],
      [
        "thermometer",
        "a tool that measures temperature",
        "termómetro: herramienta que mide la temperatura",
      ],
      [
        "keep the same",
        "to not change something in a test",
        "mantener igual: no cambiar algo en una prueba",
      ],
    ],
    frames: [
      "The one thing they change is ___.",
      "They keep ___ the same.",
      "They measure ___ to compare.",
    ],
    focus: [
      "the one thing the team changes",
      "the words same size, same amount, and same windowsill",
      "what the team measures at the end",
    ],
    support:
      "Make three lists as you listen: We change, We keep the same, We measure. Write a few words in each list. The choices that belong only in the second list are your answers.",
    extension:
      "Plan a fair test of your own, such as which paper airplane flies farthest. Name the one thing you change, three things you keep the same, and what you measure.",
    teacher: {
      use: "Science lesson on fair tests; students then plan their own fair test.",
      function: "Separating what is changed, what is kept the same, and what is measured.",
      lower:
        "Provide the three-list organizer with the heads filled in. Read the script one speaker at a time and sort one phrase after each turn.",
      onLevel:
        "Read once. Students choose all the answers, then name the one thing the team changes.",
      challenge:
        "Add a mistake: Kai wants to use a bigger bottle for the black wrap. Ask students to explain why that breaks the test.",
      noTech: "Read the script aloud; students sort the five choices into three lists on paper.",
      prompt: "How would the results be hard to trust if they changed two things?",
    },
    correct:
      "Yes! They keep the bottle size, the amount of water, and the spot the same. They change only the wrap color and measure the temperature.",
    hint: "Find the one thing they change. Then pick the things that Rosa says stay the same. The thermometer readings are what they measure, not what they keep the same.",
    wida: [
      "Explain: tell what is changed and what is kept the same in a test",
      "Language for Science",
    ],
  },
  {
    id: "l3-c-mural-notices",
    level: "C",
    strand: "Comparing two sources",
    type: "sort",
    title: "Two Notices About the Mural",
    skill: "Comparing two spoken notices to find what changed",
    dir: "Listen to two notices about a school mural. The second notice updates the first. Sort each detail by whether it stays the same or changes.",
    q: "For each detail, did it stay the same or change in the second notice?",
    script:
      "Notice one, from the art club: Our school mural will be painted on the gym wall on Tuesday after school. Students in fourth and fifth grade may help. Please wear old clothes, because paint can stain. Sign up with Mr. Reed by Friday. Notice two, from the principal's office: Here is an update about the mural. Painting will still happen on the gym wall, but it is now planned for Wednesday, not Tuesday, because the wall is being cleaned on Tuesday. Students in third grade may help too. Old clothes are still a good idea. You still sign up with Mr. Reed, but the deadline is now Monday.",
    cats: ["Stays the same", "Changed in notice two"],
    sortItems: [
      ["The mural goes on the gym wall.", 0],
      ["Students should wear old clothes.", 0],
      ["Students sign up with Mr. Reed.", 0],
      ["Painting day is Wednesday.", 1],
      ["Third graders may help too.", 1],
      ["Sign-up ends on Monday.", 1],
    ],
    itemFeedback: {
      s1: "Both notices name the gym wall. Listen for will still happen on the gym wall.",
      s2: "Notice two says old clothes are still a good idea, so this did not change.",
      s3: "Notice two says you still sign up with Mr. Reed. Only the deadline moved.",
      s4: "Notice one said Tuesday. Notice two says Wednesday, not Tuesday.",
      s5: "Notice one said fourth and fifth grade. Notice two adds third grade.",
      s6: "Notice one said Friday. Notice two says the deadline is now Monday.",
    },
    vocab: [
      ["mural", "a large painting made on a wall", "mural: pintura grande hecha en una pared"],
      ["deadline", "the last day you can do something", "fecha límite: último día para hacer algo"],
      [
        "update",
        "new information that changes a plan",
        "actualización: información nueva que cambia un plan",
      ],
    ],
    frames: [
      "In notice one, ___. In notice two, ___.",
      "___ stays the same.",
      "The deadline changed from ___ to ___.",
    ],
    focus: [
      "the words still and now",
      "the day, the helpers, and the deadline in each notice",
      "the reason the day changed",
    ],
    support:
      "Make a three-row chart: day, helpers, deadline. Listen once to notice one and fill the first column. Listen again to notice two and fill the second column. Words like still tell you a detail stayed the same, and words like now or not tell you it changed.",
    extension:
      "Find a real notice that was changed, such as a class schedule or a lunch menu. Write what stayed the same and what changed. Use still and now in your sentences.",
    teacher: {
      use: "Pairs with the written paired-notice reading task; compares a spoken original with its update.",
      function: "Comparing two spoken sources and sorting details into same and changed.",
      lower: "Play notice one and stop. Fill the first column together before playing notice two.",
      onLevel:
        "Read both notices once. Students sort the six details, then say the one reason for the day change.",
      challenge:
        "Ask students to write a third notice that changes one more detail and keeps the rest.",
      noTech: "Two readers voice the notices; students sort six strips into two columns.",
      prompt: "Which word in notice two told you a detail had not changed?",
    },
    correct:
      "Yes! The gym wall, old clothes, and Mr. Reed stay the same. The painting day, the helpers, and the deadline changed.",
    hint: "Listen for the words still and now in notice two. Still means the same, and now or not means changed.",
    wida: ["Inform: compare details in two sources", "Notice words that show change"],
  },
  {
    id: "l3-c-heron-marsh-chain",
    level: "C",
    strand: "Cause and effect",
    type: "order",
    title: "A Chain at Heron Marsh",
    skill: "Following a cause-and-effect chain in a talk",
    dir: "Listen to a made-up ranger talk about one chain of events in a wetland. Put the events in the order the ranger describes.",
    q: "In what order do the events happen?",
    script:
      "Welcome to Heron Marsh. Today I will explain one chain of events that rangers here watch. It starts with the cattails along the edge. Their stems slow down the rain water that runs into the marsh. When the water moves more slowly, mud and dirt settle to the bottom instead of floating. As a result, the shallow water becomes clearer. Clearer water lets more sunlight reach the plants growing underwater. Those plants give snails and small fish places to hide and feed. This is only one chain. A wetland has many connections, and scientists keep studying them.",
    items: [
      "Cattail stems slow down the rain water.",
      "Mud and dirt settle to the bottom.",
      "The shallow water becomes clearer.",
      "More sunlight reaches the underwater plants.",
      "Snails and small fish find places to hide and feed.",
    ],
    itemFeedback: {
      s1: "The ranger says the chain starts with the cattails along the edge.",
      s2: "Listen for when the water moves more slowly. This happens before the water is clearer.",
      s3: "Listen for the words as a result. They come right after the mud settles.",
      s4: "Clearer water lets sunlight reach the plants. Listen for lets more sunlight reach.",
      s5: "The last link is what the underwater plants give to snails and small fish.",
    },
    vocab: [
      [
        "wetland",
        "land that is covered with shallow water for much of the year",
        "humedal: terreno cubierto de agua poco profunda gran parte del año",
      ],
      [
        "cattail",
        "a tall plant that grows at the edge of water",
        "espadaña: planta alta que crece al borde del agua",
      ],
      ["settle", "to sink slowly to the bottom", "asentarse: hundirse lentamente hasta el fondo"],
    ],
    frames: ["First, ___. Then ___.", "When ___, ___.", "As a result, ___."],
    focus: [
      "the words when, as a result, and lets",
      "what each event causes next",
      "the plants and animals at the end of the chain",
    ],
    support:
      "Draw five boxes with arrows between them. After each sentence you hear, write a few words in the next box. Listen for signal words: when, as a result, and lets. They show that one event causes the next.",
    extension:
      "Make a short cause chain of your own about a place you know, such as a school garden or a puddle. Use when, as a result, or so. Say that your chain is only one example, as the ranger does.",
    teacher: {
      use: "Science lesson on cause and effect in ecosystems; the ranger's last sentence models careful claims.",
      function:
        "Sequencing events in a cause chain and using signal words to link a cause to its effect.",
      lower:
        "Give the five boxes with arrows. Pause after each sentence and say: what happened, and what does it cause?",
      onLevel:
        "Read once. Students order the events, then retell the chain aloud with when and as a result.",
      challenge:
        "Ask what the ranger meant by this is only one chain. Students tell why one chain is not the whole story of a wetland.",
      noTech: "Read the script aloud; students number five event strips and tape them in a chain.",
      prompt: "Which signal word helped you decide what came next?",
    },
    correct:
      "Yes! Cattails slow the water, mud settles, the water gets clearer, sunlight reaches underwater plants, and snails and small fish find places to live.",
    hint: "Each event causes the next. Listen for when, as a result, and lets to find the links.",
    wida: [
      "Explain: order events in a cause-and-effect chain",
      "Notice signal words for cause and effect",
    ],
  },
];
