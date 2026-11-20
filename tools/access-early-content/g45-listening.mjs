// Grades 4-5 depth pass, Listening. Original EduWonderLab scripts about school, science, math and community life.
// Built into access-practice-lab/content/g3-5/Listening.json by tools/build-access-g45-content.mjs.
// Spec fields: id (the builder adds "g35-"), level (A|B|C), strand, title, skill, type, dir, q, script, opts (the right
// answer FIRST; "text|emoji"), ans (multiSelect: how many leading options are right), why (one wrong-choice note per
// wrong option, in opts order; becomes distractorFeedback), items (order: correct order), cloze (strings and
// [answer, ...wrong] blanks), vocab, frames, focus, correct, hint, wida.

export default [
  // ── Level A ──────────────────────────────────────────────────────────────
  {
    id: "l-a-lunch-time",
    level: "A",
    strand: "School day talk",
    title: "When Is Lunch?",
    skill: "Catching a time in a school announcement",
    dir: "Listen to the announcement. Choose the time you hear.",
    q: "What time does the class eat lunch today?",
    script:
      "Good morning, fourth graders. Please line up by the door at eleven thirty. Today we are having pizza and carrots for lunch.",
    opts: ["11:30|🕦", "10:30|🕥", "12:30|🕧", "1:30|🕜"],
    why: [
      'That time is an hour too early. Listen to the number after the word "at".',
      "That time is an hour too late. Listen again to the hour the speaker says.",
      "That time is after noon. The speaker says a time before twelve.",
    ],
    vocab: [
      [
        "announcement",
        "a short message for everyone to hear",
        "anuncio: un mensaje corto para que todos lo oigan",
      ],
      ["line up", "to stand one behind another", "hacer fila: ponerse uno detrás de otro"],
    ],
    frames: ["The class eats lunch at ___.", "We line up by the ___."],
    focus: ["a time like eleven thirty", "the words line up", "the food names"],
    correct: 'Yes! You heard "eleven thirty." Numbers and times are important clues.',
    hint: "Listen for a number after the word at. Say the number in your head.",
    wida: ["Inform: identify a time in an announcement", "Notice number words"],
  },
  {
    id: "l-a-library-rules",
    level: "A",
    strand: "School day talk",
    type: "multiSelect",
    title: "Library Rules",
    skill: "Finding all the rules in a short talk",
    dir: "Listen to the librarian. Choose ALL the rules you hear. There is more than one answer.",
    q: "Which rules does the librarian say?",
    script:
      "Welcome to the library. Use a quiet voice. Walk, do not run. Put each book back on the shelf when you finish. You may not eat snacks here.",
    opts: [
      "Use a quiet voice|🤫",
      "Walk in the library|🚶",
      "Put books back on the shelf|📚",
      "Eat snacks at the table|🍪",
      "Run to a seat|🏃",
    ],
    why: [
      "The librarian says you may NOT eat snacks in the library.",
      "The librarian says do not run. That is the opposite of this choice.",
    ],
    ans: 3,
    vocab: [
      [
        "librarian",
        "a person who works in a library",
        "bibliotecario: persona que trabaja en una biblioteca",
      ],
      ["rule", "something we must or must not do", "regla: algo que debemos o no debemos hacer"],
    ],
    frames: ["In the library, we ___.", "We do not ___ in the library."],
    focus: [
      "rules you must follow",
      "the words do not and may not",
      "action words like walk and use",
    ],
    support:
      "Make two columns on paper: Do and Do not. Listen once and write each rule in a column. Words like do not and may not send a rule to the Do not column. Then choose every rule from the Do column.",
    extension:
      "Write three rules for a place you know, such as the gym or the bus. Use one rule that starts with a verb, one with do not, and one with may not. Read them to a partner, who tells which rule is hardest to follow.",
    teacher: {
      use: "Whole group, partners, or a listening center before students write rules for a real place.",
      function:
        "Finding every rule in a talk and telling rules to follow from things that are not allowed.",
      lower:
        "Read one sentence at a time. After each, students point to Do or Do not on the two-column chart before the next sentence.",
      onLevel:
        "Read once at a natural pace. Students choose all the rules, then say which words told them what is not allowed.",
      challenge:
        "Ask students to turn each Do rule into a Do not rule with the same meaning, then check that the meaning stays true.",
      noTech: "Read the script aloud; students sort the rules into a Do and Do not chart on paper.",
      prompt: "Which words told you a rule was not allowed?",
    },
    correct: "Great listening! You caught three rules and you also heard what is not allowed.",
    hint: "Listen for the words do not and may not. Those tell you what to leave out.",
    wida: ["Inform: identify details in directions", "Notice the words not and do not"],
  },
  {
    id: "l-a-recess-order",
    level: "A",
    strand: "Stories and sequence",
    type: "order",
    title: "Getting Ready for Recess",
    skill: "Putting steps in order with first, next, last",
    dir: "Listen to the teacher. Put the steps in the order you hear them.",
    q: "What do students do first, next, and last?",
    script:
      "It is cold today, so listen carefully. Before you line up, put on your jacket and zip it. Then line up at the door. Wait while I count everyone in the line. After I count, walk outside with your partner.",
    items: [
      "They put on and zip their jackets.",
      "They line up at the door.",
      "The teacher counts the line.",
      "They walk outside with a partner.",
    ],
    itemFeedback: {
      s1: "Listen for before you line up. This job comes before the line.",
      s2: "The teacher can only count the line after students are in it.",
      s3: "Listen for after I count. Counting happens before anyone walks outside.",
      s4: "Walking outside comes after the counting. Listen for the word after.",
    },
    vocab: [
      ["jacket", "a short coat", "chaqueta: abrigo corto"],
      [
        "partner",
        "a person you work or walk with",
        "compañero: persona con quien trabajas o caminas",
      ],
    ],
    frames: ["Before they line up, they ___.", "After the teacher counts, they ___."],
    focus: [
      "the words before, then, and after",
      "action words",
      "what happens while the class waits",
    ],
    correct: "Right! Before, then, and after told you the order, even when a step was named early.",
    hint: "Before you line up means the jacket comes first, even though you hear line up in that sentence.",
    wida: ["Narrate: sequence events", "Notice transition words"],
  },
  {
    id: "l-a-bus-note",
    level: "A",
    strand: "School day talk",
    type: "cloze",
    title: "The Bus Note",
    skill: "Listening for numbers in a message",
    dir: "Listen to the message about the field trip bus. Choose the numbers you hear.",
    q: "Fill in the details from the message.",
    script:
      "Families, the field trip bus is number fourteen. It leaves at nine o'clock from door two. Please bring a lunch and a water bottle.",
    cloze: [
      "Bus number ",
      ["14", "40", "4"],
      " leaves at ",
      ["9", "2", "11"],
      " o'clock from door ",
      ["2", "9", "14"],
      ".",
    ],
    itemFeedback: {
      b1: "Fourteen and four sound alike. Listen to the whole number word.",
      b2: "Listen for leaves at. The time comes right after it.",
      b3: "Listen for from door. The door number is small.",
    },
    vocab: [
      [
        "field trip",
        "a school visit to a place outside school",
        "excursión: visita escolar a un lugar fuera de la escuela",
      ],
      ["leave", "to go away from a place", "salir: irse de un lugar"],
    ],
    frames: ["The bus number is ___.", "It leaves at ___ o'clock."],
    focus: ["number names", "the word o'clock", "door and bus numbers"],
    correct:
      "Nice work! You matched each number to the right thing: the bus, the time, and the door.",
    hint: "Fourteen has four in it, but it is not the same as four. Listen to the whole number.",
    wida: ["Inform: identify numbers in a message", "Notice teen numbers"],
  },
  {
    id: "l-a-measure-plant",
    level: "A",
    strand: "Science words",
    title: "Measuring the Plant",
    skill: "Listening for a science tool and a unit",
    dir: "Listen to the science teacher. Then choose the tool and unit.",
    q: "What will the class use to measure the plant?",
    script:
      "Today we will measure our bean plant. Take a ruler. Put the zero at the bottom of the stem. We measure in centimeters.",
    opts: [
      "A ruler and centimeters|📏",
      "A scale and kilograms|⚖️",
      "A cup and liters|🥤",
      "A clock and minutes|⏰",
    ],
    why: [
      "A scale measures weight. The class measures how tall the plant is.",
      "A cup measures liquid. Listen for the tool the class puts at the stem.",
      "A clock measures time, not height. Listen for the tool and the unit named.",
    ],
    vocab: [
      [
        "measure",
        "to find out how long, heavy, or full something is",
        "medir: averiguar qué tan largo, pesado o lleno está algo",
      ],
      [
        "stem",
        "the part of a plant that holds up the leaves",
        "tallo: parte de la planta que sostiene las hojas",
      ],
      ["centimeter", "a small unit for length", "centímetro: una unidad pequeña de longitud"],
    ],
    frames: ["We measure the plant with a ___.", "We measure in ___."],
    focus: ["the name of the tool", "the word measure", "the unit at the end"],
    correct: "Yes! You heard ruler and centimeters. Tools and units go together.",
    hint: "Listen for the tool the teacher says to take. Then listen for the unit.",
    wida: ["Inform: identify a tool and a unit", "Language for Science"],
  },
  // ── Level B ──────────────────────────────────────────────────────────────
  {
    id: "l-b-recycle-day",
    level: "B",
    strand: "Community and school",
    title: "Recycling Day Plan",
    skill: "Finding the main idea of a short talk",
    dir: "Listen to the student council president. Then choose the main idea.",
    q: "What is the main idea of the talk?",
    script:
      "Our school throws away a lot of paper. Last month, each classroom filled three trash cans with paper that could be recycled. Starting Monday, every room will get a blue bin just for paper. If we all use the bins, we can help trees and keep our school clean.",
    opts: [
      "Blue bins will help the school recycle paper.|♻️",
      "The school needs more trash cans.|🗑️",
      "Trees grow better near schools.|🌳",
      "Classrooms should use less paper.|📄",
    ],
    why: [
      "The speaker wants less paper in the trash, not more trash cans.",
      "Trees are mentioned as one benefit. They are a detail, not the main idea.",
      "Using less paper is a good idea, but the speaker's plan is about the new bins.",
    ],
    vocab: [
      [
        "recycle",
        "to use something again in a new way",
        "reciclar: usar algo otra vez de una manera nueva",
      ],
      [
        "bin",
        "a big container for collecting things",
        "contenedor: recipiente grande para juntar cosas",
      ],
      ["main idea", "the most important point", "idea principal: el punto más importante"],
    ],
    frames: ["The main idea is that ___.", "The speaker wants us to ___."],
    focus: ["the problem the speaker names", "the plan the speaker shares", "why it matters"],
    correct: "Right! The speaker names a problem and a plan. The plan is the main idea.",
    hint: "Ask: what is the problem, and what is the plan to fix it? The plan is the heart of the talk.",
    wida: ["Explain: identify the main idea", "Notice problem and solution language"],
  },
  {
    id: "l-b-water-steps",
    level: "B",
    strand: "Science words",
    type: "order",
    title: "How Rain Happens",
    skill: "Sequencing steps in a science explanation",
    dir: "Listen to the science explanation. Put the steps of the water cycle in order.",
    q: "What happens first, second, third, and last?",
    script:
      "The sun warms water in a lake, and the water rises into the air as vapor. High in the sky, the vapor cools and turns into tiny drops that make a cloud. When the drops get heavy, they fall as rain. Finally, the rain flows into the lake again.",
    items: [
      "The sun warms water, and it rises as vapor.",
      "The vapor cools and forms a cloud.",
      "Heavy drops fall as rain.",
      "The rain flows back into the lake.",
    ],
    itemFeedback: {
      s1: "The sun warms the water first. Nothing rises until it is warm.",
      s2: "Vapor has to rise into the sky before it can cool.",
      s3: "Drops fall only when the cloud's drops get heavy.",
      s4: "Listen for finally. Rain flows to the lake after it falls.",
    },
    vocab: [
      ["vapor", "water that has turned into a gas", "vapor: agua convertida en gas"],
      [
        "cloud",
        "tiny drops of water floating in the sky",
        "nube: gotitas de agua que flotan en el cielo",
      ],
      ["cycle", "steps that happen again and again", "ciclo: pasos que suceden una y otra vez"],
    ],
    frames: ["First, the sun ___.", "Then the vapor ___.", "Finally, the rain ___."],
    focus: ["what the sun does", "what happens when vapor cools", "the word finally"],
    correct: "Great! You followed the whole cycle. It ends where it began, so it is a cycle.",
    hint: "Listen for changing words: rises, cools, falls, flows. Each one is a new step.",
    wida: ["Explain: sequence a process", "Language for Science"],
  },
  {
    id: "l-b-team-vote",
    level: "B",
    strand: "Community and school",
    title: "Which Game Won?",
    skill: "Using numbers from a talk to compare",
    dir: "Listen to the vote results. Then choose the true statement.",
    q: "Which statement matches the vote results?",
    script:
      "Our class voted for a game to play on Friday. Kickball got twelve votes. Tag got nine votes. Four square got seven votes. Kickball won, but tag was close.",
    opts: [
      "Kickball got more votes than tag.|⚽",
      "Tag got more votes than kickball.|🏃",
      "Four square got the most votes.|🎾",
      "Tag and four square tied.|🤝",
    ],
    why: [
      "Compare the numbers: tag was close, but did it get more than kickball?",
      "Four square got the fewest votes. Listen for which game won.",
      "Tag and four square got different numbers of votes. Listen to each number again.",
    ],
    vocab: [
      [
        "vote",
        "to choose by raising your hand or marking a paper",
        "votar: elegir levantando la mano o marcando un papel",
      ],
      [
        "tie",
        "when two groups get the same number",
        "empatar: cuando dos grupos tienen el mismo número",
      ],
      [
        "compare",
        "to tell how things are alike or different",
        "comparar: decir en qué se parecen o se diferencian las cosas",
      ],
    ],
    frames: ["___ got more votes than ___.", "___ got fewer votes than ___."],
    focus: ["each game and its number", "the word won", "more than and fewer than"],
    correct: "Yes! Twelve is greater than nine, so kickball got more votes than tag.",
    hint: "Write each game and its number in your head: kickball, tag, four square. Then compare.",
    wida: ["Argue: compare quantities using data", "Notice comparing words"],
  },
  {
    id: "l-b-pet-needs",
    level: "B",
    strand: "Science words",
    type: "multiSelect",
    title: "Caring for a Class Pet",
    skill: "Finding several details in a care talk",
    dir: "Listen to the teacher explain how to care for the class hamster. Choose ALL the things the hamster needs each day.",
    q: "What does the hamster need every day?",
    script:
      "Our hamster needs three things every day. Fresh water goes in the bottle, and a small scoop of food goes in the dish. The hamster also needs a turn on the wheel to exercise. We clean the cage only on Fridays, so you do not need to do that today.",
    opts: [
      "Fresh water|💧",
      "A scoop of food|🥣",
      "Time on the wheel|🎡",
      "A clean cage|🧽",
      "A bath|🛁",
    ],
    why: [
      "The cage is cleaned only on Fridays, so it is not an everyday job.",
      "A bath is never mentioned. Listen for the three daily needs.",
    ],
    ans: 3,
    vocab: [
      ["fresh", "new and clean", "fresco: nuevo y limpio"],
      [
        "exercise",
        "to move your body to stay healthy",
        "hacer ejercicio: mover el cuerpo para mantenerse sano",
      ],
      [
        "cage",
        "a closed box with bars for an animal",
        "jaula: caja cerrada con barras para un animal",
      ],
    ],
    frames: ["Every day, the hamster needs ___.", "We clean the cage on ___."],
    focus: [
      "the number of things the hamster needs",
      "what happens only on Fridays",
      "each need and its place",
    ],
    correct:
      "Excellent! You caught all three daily needs and you noticed that the cage is cleaned only on Fridays.",
    hint: "The teacher says there are three things. Count them as you listen, and notice what happens only on Fridays.",
    wida: ["Inform: identify details in an explanation", "Language for Science"],
  },
  {
    id: "l-b-museum-trip",
    level: "B",
    strand: "Community and school",
    type: "cloze",
    title: "Museum Trip Plan",
    skill: "Listening for details about people, places, and times",
    dir: "Listen to the teacher's plan for the museum trip. Choose the details you hear.",
    q: "Complete the trip plan.",
    script:
      "On Thursday, our class will visit the history museum. We will take the bus at nine thirty, and we will arrive at ten fifteen. A guide named Ms. Ruiz will show us the old tools. We will eat lunch in the park before we come back.",
    cloze: [
      "Day: ",
      ["Thursday", "Tuesday", "Friday"],
      ". Arrival time: ",
      ["10:15", "9:30", "10:50"],
      ". Guide: ",
      ["Ms. Ruiz", "Ms. Rios", "Mr. Ruiz"],
      ". Lunch place: the ",
      ["park", "bus", "museum"],
      ".",
    ],
    itemFeedback: {
      b1: "Listen to the first words of the plan. Two school days start with T and sound alike.",
      b2: "Nine thirty is when the bus leaves. Listen for arrive.",
      b3: "Listen for a guide named. Check both the title and the last name.",
      b4: "Listen for eat lunch in. The place comes right after.",
    },
    vocab: [
      [
        "museum",
        "a place that shows important or old things",
        "museo: lugar que muestra cosas importantes o antiguas",
      ],
      ["arrive", "to get to a place", "llegar: alcanzar un lugar"],
      [
        "guide",
        "a person who shows and explains a place",
        "guía: persona que muestra y explica un lugar",
      ],
    ],
    frames: ["The class will visit the museum on ___.", "The guide will show us ___."],
    focus: ["the day and times", "the guide's name", "where lunch happens"],
    correct: "Great! You kept day, time, name, and place straight in one plan.",
    hint: "The bus leaves at nine thirty, but the class arrives later. Listen for the word arrive.",
    wida: ["Inform: identify details in a plan", "Notice time and place phrases"],
  },
  // ── Level C ──────────────────────────────────────────────────────────────
  {
    id: "l-c-cause-puddle",
    level: "C",
    strand: "Science talks",
    title: "Why the Puddle Disappeared",
    skill: "Understanding cause and effect in a science talk",
    dir: "Listen to the science teacher. Then choose the best answer.",
    q: "Why did the puddle on the playground get smaller by lunch?",
    script:
      "This morning there was a big puddle near the swings. By lunch, it was almost gone. Some students think the ground drank it, but that is only part of the story. The sun warmed the water, and the warm water slowly changed into vapor and rose into the air. That is called evaporation, and it happens faster when the weather is warm and windy.",
    opts: [
      "The sun warmed the water so it evaporated.|☀️",
      "The wind pushed the puddle to the grass.|🍃",
      "The ground drank all of the water.|🌱",
      "Students stepped in the puddle.|👟",
    ],
    why: [
      "The speaker never says the wind pushed the water. Listen for what the sun did.",
      "The speaker says this is only part of the story. Listen for the main cause.",
      "Stepping in puddles is not in the talk. Listen for the science word.",
    ],
    vocab: [
      [
        "evaporation",
        "when liquid water changes into vapor",
        "evaporación: cuando el agua líquida se convierte en vapor",
      ],
      ["cause", "the reason something happens", "causa: la razón por la que algo sucede"],
      ["effect", "what happens because of a cause", "efecto: lo que sucede por una causa"],
    ],
    frames: ["The puddle got smaller because ___.", "This happened because the sun ___."],
    focus: [
      "the cause and the effect",
      "the word evaporation",
      "the opinion the teacher says is only part of the story",
    ],
    correct:
      "Right! The sun warmed the water, and that cause led to evaporation. The teacher said the ground idea was only part of the story.",
    hint: "Listen for the word because or a change word. What caused the water to change into vapor?",
    wida: ["Explain: explain a cause and effect", "Language for Science"],
  },
  {
    id: "l-c-fair-test",
    level: "C",
    strand: "Science talks",
    title: "Is This a Fair Test?",
    skill: "Judging a plan by listening for what changes",
    dir: "Listen to two students plan a test. Then choose the best answer.",
    q: "Why is Mai's test not fair?",
    script:
      "Mai says, I want to find out which paper towel holds the most water. I will test two brands. Brand X gets one big cup of water, and brand Y gets a small spoon of water. Then I will see which towel is wetter. Her partner Luis stops her. He says, wait, you changed two things: the brand and the amount of water.",
    opts: [
      "She changed the brand and the amount of water.|🧪",
      "She tested only two kinds of paper towels.|🧻",
      "She used a cup instead of a ruler.|🥛",
      "She tested outside the classroom.|🏫",
    ],
    why: [
      "Testing two brands is fine. Luis points out a different problem.",
      "Rulers are never mentioned. Listen to what Luis says Mai changed.",
      "Where she tested is not in the talk. Listen for the two things that changed.",
    ],
    vocab: [
      [
        "fair test",
        "a test where you change only one thing",
        "prueba justa: prueba en la que cambias una sola cosa",
      ],
      [
        "brand",
        "the name of a company's product",
        "marca: el nombre de un producto de una empresa",
      ],
      [
        "variable",
        "something in a test that can change",
        "variable: algo en una prueba que puede cambiar",
      ],
    ],
    frames: ["The test is not fair because ___.", "To make it fair, Mai should keep ___ the same."],
    focus: ["what Mai changed", "what Luis noticed", "the words fair test"],
    correct:
      "Yes! Mai changed the brand and the amount of water. A fair test changes only one thing.",
    hint: "A fair test changes one thing. Listen for everything that is different between brand X and brand Y.",
    wida: ["Argue: evaluate a plan with a reason", "Language for Science"],
  },
  {
    id: "l-c-speaker-purpose",
    level: "C",
    strand: "Community and school",
    title: "A Letter to the Mayor",
    skill: "Identifying a speaker's purpose and reasons",
    dir: "Listen to a student read part of a letter. Then choose the best answer.",
    q: "What does the writer want the mayor to do, and what reason does the writer give?",
    script:
      "Dear Mayor Patel, I am a fifth grader at Hillside School. Every day, about forty students walk across Pine Street to get to school, but there is no crossing guard. Last week, a car did not stop for my friend. I am writing to ask you to put a crossing guard on Pine Street so every student can arrive safely.",
    opts: [
      "Add a crossing guard because students are not safe now.|🚸",
      "Build a new school because Pine Street is busy.|🏫",
      "Close Pine Street because cars are loud.|🚗",
      "Give students bikes because walking takes time.|🚲",
    ],
    why: [
      "The writer asks for one person at the crossing, not a new building.",
      "The writer never says cars are loud or asks to close the street.",
      "Bikes are not in the letter. Listen for the exact request and the safety reason.",
    ],
    vocab: [
      [
        "crossing guard",
        "a person who helps people cross the street safely",
        "guardia de cruce: persona que ayuda a cruzar la calle con seguridad",
      ],
      [
        "purpose",
        "the reason a person speaks or writes",
        "propósito: la razón por la que alguien habla o escribe",
      ],
      ["safely", "without getting hurt", "con seguridad: sin lastimarse"],
    ],
    frames: ["The writer wants the mayor to ___.", "The reason is that ___."],
    focus: [
      "the request after I am writing to ask",
      "the example about a friend",
      "the words so every student",
    ],
    correct: "Right! The writer asks for a crossing guard and gives a real example as the reason.",
    hint: "Listen for the sentence that starts I am writing to ask. Then ask: what reason comes before it?",
    wida: ["Argue: identify a claim and a reason", "Notice request language"],
  },
  {
    id: "l-c-sort-habitat",
    level: "C",
    strand: "Science talks",
    type: "sort",
    title: "Where Do They Live?",
    skill: "Matching animal needs to habitats from a nature talk",
    dir: "Listen to the park ranger. Sort each animal by the place where it lives.",
    q: "Where does each animal make its home? Use what each animal needs.",
    script:
      "Welcome to our wetland park. Down by the pond, the ground is soft and wet, and there is water all year. Animals that swim, catch fish, or lay their eggs in water stay close to the pond. Up on the dry hill, the soil is firm and the grass grows tall. Animals that dig dens, eat grass, or hide from hawks in the tall grass make their homes up there.",
    cats: ["Near the water", "On the dry hill"],
    sortItems: [
      ["🐸 frog: its eggs must stay in water", 0],
      ["🦌 deer: it eats grass all day", 1],
      ["🐢 turtle: it swims to find food", 0],
      ["🦊 fox: it digs a den for its babies", 1],
      ["🐦 heron: it catches fish with its beak", 0],
      ["🐇 rabbit: it hides from hawks", 1],
    ],
    itemFeedback: {
      s1: "The ranger named a place for animals that lay eggs in water.",
      s2: "Where did the ranger say the tall grass grows?",
      s3: "Swimming needs water all year. Which place has that?",
      s4: "A den needs firm soil, not soft, wet ground.",
      s5: "Fish live in water. Where can a heron find them?",
      s6: "Listen again: where can an animal hide in tall grass?",
    },
    vocab: [
      [
        "wetland",
        "land that is covered with water much of the year",
        "humedal: tierra cubierta de agua gran parte del año",
      ],
      [
        "habitat",
        "the place that gives an animal what it needs to live",
        "hábitat: el lugar que le da a un animal lo que necesita para vivir",
      ],
      [
        "den",
        "a wild animal's home in the ground",
        "guarida: hogar de un animal salvaje en la tierra",
      ],
    ],
    frames: [
      "The ___ lives near the water because it needs ___.",
      "The ___ lives on the dry hill because it ___.",
    ],
    focus: [
      "what each place has: water all year or firm soil and tall grass",
      "the needs the ranger names for each place",
      "the word or, which lists more than one need",
    ],
    correct:
      "Excellent! You matched each animal's need to the place that meets it, the way scientists talk about habitats.",
    hint: "The ranger does not name the animals. Match each animal's need to what each place has.",
    wida: ["Inform: classify details by category", "Language for Science"],
  },
];
