// Grades 6-8 publisher pass, Listening batch 3b: data and voices, field notes, proposals, and a rate comparison
// where the listener does the computing. Original EduWonderLab scripts; every survey and speaker is fictional.
export default [
  {
    id: "l-b-lunch-line-voices",
    level: "B",
    gw: "g67-task",
    strand: "Science and data talks",
    type: "sort",
    title: "Lunch Line: Numbers, Opinions, and Questions",
    skill: "Sorting what a speaker reports into data, opinion, and questions to investigate",
    dir: "Listen to a made-up student report about a lunch-line survey. Then sort each statement into the right group.",
    q: "Sort each statement: is it a number from the survey, a student's opinion or request, or a question to investigate?",
    script:
      "Jonas: We surveyed sixty students about how long they waited in the lunch line. Thirty-six students waited under five minutes. Twenty students waited five to ten minutes. Four students waited more than ten minutes. Now here are three student voices. Lena: I think the line is fine. I always get my food fast. Omar: I wait the longest on pizza days. We should check whether pizza days really are slower. Priya: I want the cafeteria to open a second line. Remember, the survey tells us how long students said they waited. It does not tell us why some waits were longer.",
    cats: [
      "A number from the survey",
      "A student's opinion or request",
      "A question to investigate",
    ],
    sortItems: [
      ["Thirty-six students waited under five minutes.", 0],
      ["Four students waited more than ten minutes.", 0],
      ["Twenty students waited five to ten minutes.", 0],
      ["The cafeteria should open a second line.", 1],
      ["The line is fine.", 1],
      ["Are pizza days really slower?", 2],
      ["Why were some waits longer than others?", 2],
    ],
    itemFeedback: {
      s1: "This is a count from the survey: thirty-six of the sixty students gave this answer.",
      s2: "This is also a count from the survey, even though it is the smallest group.",
      s3: "This is a count from the survey. Counts tell how many students gave an answer.",
      s4: "Priya wants something done. A request is not a number the survey collected.",
      s5: "Lena is giving her own view, which comes from her experience rather than from the survey counts.",
      s6: "Listen for whether the speaker reports collected information or suggests what to do next.",
      s7: "The speaker says the survey does not tell why, so this is still an open question.",
    },
    vocab: [
      [
        "survey",
        "a set of questions asked to many people",
        "encuesta: un conjunto de preguntas hechas a muchas personas",
      ],
      ["opinion", "what a person thinks or feels", "opinión: lo que una persona piensa o siente"],
      [
        "investigate",
        "to look into something carefully to find out more",
        "investigar: examinar algo con cuidado para saber más",
      ],
    ],
    frames: ["A number from the survey is ___.", "___ is an opinion, not data, because ___."],
    focus: [
      "the three survey counts",
      "the three student voices",
      "what the survey cannot tell us",
    ],
    correct:
      "Yes. The three counts came from the survey, the student comments were opinions or requests, and the two open questions still need an investigation.",
    hint: "Listen for numbers of students first. Then listen for words like I think and I want. Finally, listen for what the survey cannot tell us.",
    wida: ["Inform: separate data from opinion", "Notice words that mark opinions and requests"],
    es: [
      "Clasificar lo que dice un hablante en datos, opiniones y preguntas por investigar",
      "Escucha un informe estudiantil inventado sobre una encuesta de la fila del almuerzo. Luego clasifica cada afirmación en el grupo correcto.",
    ],
    teacher: {
      use: "Data-literacy or advisory lesson; pair with the Reading Room lesson Counting the Wait. The survey is made up for practice.",
      prompt:
        "Which statements could you check with a count, and which need a different kind of evidence?",
    },
  },
  {
    id: "l-b-tide-pool-notes",
    level: "B",
    gw: "g67-load",
    strand: "Science and data talks",
    type: "cloze",
    title: "Field Notes: Life in a Tide Pool",
    skill: "Completing field notes from a short science talk",
    dir: "Listen to a park ranger describe tide pool animals. Then complete the field notes by choosing the best word for each blank.",
    q: "Complete the field notes with the words that match what the ranger said.",
    script:
      "Ranger: A tide pool is a small pool of sea water left on the rocks when the tide goes out. Animals here live through big changes, because the sun can warm the pool and waves can crash over it. A limpet clamps tight to the rock at low tide, which helps keep it from drying out. A sea star holds on with hundreds of tiny tube feet. A hermit crab does not grow its own shell, so it borrows an empty shell for protection. When you visit, look carefully, walk slowly on the wet rocks, and leave the animals where you found them.",
    cloze: [
      "A tide pool is a small pool left on the rocks when the ",
      ["tide", "wind", "season"],
      " goes out. A limpet clamps to the rock to keep from ",
      ["drying out", "getting too cold", "finding food"],
      ". A sea star holds on with tiny tube ",
      ["feet", "claws", "shells"],
      ". A hermit crab borrows an empty ",
      ["shell", "rock", "pool"],
      " for protection. Visitors should leave the animals ",
      ["where they found them", "in a bucket", "in a dry spot"],
      ".",
    ],
    itemFeedback: {
      b1: "Listen for what changes the water level in the first sentence.",
      b2: "The ranger says the limpet clamps tight so that it does not dry out at low tide.",
      b3: "Listen for the body part the sea star uses to hold on.",
      b4: "Listen for what the hermit crab borrows for protection.",
      b5: "The last thing the ranger says is to leave the animals where you found them.",
    },
    vocab: [
      [
        "tide",
        "the regular rise and fall of the sea",
        "marea: el ascenso y descenso regular del mar",
      ],
      ["clamp", "to hold on tightly", "aferrarse: sujetarse con fuerza"],
      [
        "protection",
        "something that keeps a living thing safe",
        "protección: algo que mantiene a un ser vivo a salvo",
      ],
    ],
    frames: [
      "A limpet clamps to the rock so that ___.",
      "A hermit crab borrows an empty shell because ___.",
    ],
    focus: [
      "how each animal stays safe or holds on",
      "the word because for a reason",
      "the ranger's advice to visitors",
    ],
    correct:
      "Yes. Each blank matches a detail the ranger gave: the tide goes out, limpets avoid drying out, sea stars use tube feet, hermit crabs borrow shells, and visitors leave animals alone.",
    hint: "Listen for one animal at a time, and for what each animal does to stay safe in a changing pool.",
    wida: ["Inform: complete notes from a science talk", "Notice words that give reasons"],
    es: [
      "Completar apuntes de campo a partir de una charla breve de ciencias",
      "Escucha a un guardabosques describir animales de las pozas de marea. Luego completa los apuntes de campo eligiendo la mejor palabra para cada espacio.",
    ],
    teacher: {
      use: "Life-science lesson on adaptations; pair with the Reading Room lesson Life Between the Tides.",
      prompt: "Which animal's way of staying safe is easiest to explain with because?",
    },
  },
  {
    id: "l-c-repair-cafe-proposal",
    level: "C",
    gw: "g78-load",
    strand: "Hearings and debates",
    type: "order",
    title: "Proposal Structure: The Repair Cafe",
    skill: "Following the structure of a spoken proposal",
    dir: "Listen to a made-up student proposal to a school committee. Then put the parts of the proposal in the order the speaker gives them.",
    q: "Put the parts of the proposal in the order the speaker presents them.",
    script:
      "Good afternoon. Every year, families at our school throw away broken lamps, backpacks, and bicycle parts that could be fixed. That is the problem we want to address. We propose a Repair Cafe, held one Saturday a month, where volunteers fix small items for free while the owners watch and learn. To start, we would need three tables, two basic tool kits, and eight volunteers. We estimate the supplies at eighty dollars. We ask the committee to approve a trial on the first Saturday in March. After the trial, we will report how many items we fixed and how many people came.",
    items: [
      "The speaker names a problem: broken items are thrown away.",
      "The speaker proposes a solution: a monthly Repair Cafe.",
      "The speaker lists what the program needs: tables, tools, and volunteers.",
      "The speaker asks the committee to approve a trial.",
      "The speaker promises to report the results.",
    ],
    itemFeedback: {
      s1: "A proposal starts by naming the problem, so the audience knows why a new plan is needed.",
      s2: "The solution comes right after the problem and before the details of what it requires.",
      s3: "The needs come after the solution, because the audience first needs to know what the plan is.",
      s4: "The request for approval comes after the plan and its needs have been explained.",
      s5: "The promise to report comes last, after the trial has been requested.",
    },
    vocab: [
      [
        "propose",
        "to suggest a plan for others to consider",
        "proponer: sugerir un plan para que otros lo consideren",
      ],
      ["approve", "to officially agree to something", "aprobar: aceptar algo de manera oficial"],
      ["trial", "a short test of a new plan", "prueba piloto: una prueba corta de un plan nuevo"],
    ],
    frames: [
      "First the speaker names ___. Next the speaker proposes ___.",
      "Finally the speaker asks the committee to ___.",
    ],
    focus: [
      "the problem the speaker names",
      "the list of what the program needs",
      "the request and the promise at the end",
    ],
    correct:
      "Yes. The proposal moves from the problem to the solution, then the needs, then the request, and ends with a promise to report results.",
    hint: "Listen for the words we propose, we would need, we ask the committee, and after the trial. Each one starts a new part.",
    wida: ["Argue: follow the structure of a proposal", "Notice words that signal each part"],
    es: [
      "Seguir la estructura de una propuesta oral",
      "Escucha una propuesta estudiantil inventada para un comité escolar. Luego pon las partes de la propuesta en el orden en que las presenta el hablante.",
    ],
    teacher: {
      use: "ELA or advisory lesson on proposals; pair with the Reading Room lesson The Repair Cafe Proposal.",
      prompt: "Which part of a proposal would change if the committee asked for a smaller budget?",
    },
  },
  {
    id: "l-b-mathtalk-rates-v2",
    level: "B",
    gw: "g6-topic",
    strand: "Math talk: ratios and rates",
    type: "constructed",
    title: "Math Talk: Comparing Rates (You Compute)",
    skill: "Finding and comparing unit rates from spoken prices and pack sizes",
    dir: "Listen to two students compare juice packs. Then work out the price of one bottle in each pack and write who found the better deal.",
    q: "Work out what a single bottle costs in each pack. Then explain which pack is the better deal and how you know.",
    script:
      "Maria: I found a pack of six juice bottles for three dollars. Daniel: I found a pack of ten juice bottles for four dollars. Maria: Which one is the better deal? Daniel: We cannot compare three dollars and four dollars directly, because the packs have different numbers of bottles. We need to find the price of one bottle in each pack. Maria: For my pack, I share three dollars across six bottles. Daniel: For mine, I share four dollars across ten bottles. Maria: Let us each work it out, then compare the two prices for one bottle.",
    label: "Your work and explanation",
    frames: [
      "One bottle in the six-pack costs ___, and one bottle in the ten-pack costs ___.",
      "The better deal is the ___ pack because ___.",
    ],
    focus: [
      "the price and the number of bottles in each pack",
      "why the pack prices cannot be compared directly",
      "the price for one bottle",
    ],
    models: {
      A: "Six-pack: 3 dollars for 6 bottles is 50 cents each. Ten-pack: 4 dollars for 10 bottles is 40 cents each. The ten-pack is cheaper for each bottle.",
      B: "The six-pack costs 3 dollars for 6 bottles, so one bottle is 3 divided by 6, which is 50 cents. The ten-pack costs 4 dollars for 10 bottles, so one bottle is 4 divided by 10, which is 40 cents. The ten-pack is the better deal because each bottle costs less.",
      C: "Pack prices cannot be compared directly because the packs hold different numbers of bottles, so I found a unit rate for each. Six-pack: 3 divided by 6 is 0.50 dollars, or 50 cents per bottle. Ten-pack: 4 divided by 10 is 0.40 dollars, or 40 cents per bottle. Because 40 cents is less than 50 cents, the ten-pack is the better deal per bottle.",
    },
    criteria: [
      "I found the price of one bottle for both packs by dividing the price by the number of bottles.",
      "I wrote each unit rate with its unit, such as cents per bottle.",
      "I compared the two unit rates and used because to explain which pack is the better deal.",
    ],
    modelNotes: {
      A: "The computing is complete in three short sentences: two divisions and one comparison.",
      B: '"3 divided by 6" shows how the rate was found, not only what it is.',
      C: "This response begins by explaining why the unit rate is needed. Notice the unit on every number.",
    },
    vocab: [
      [
        "unit rate",
        "the amount for exactly one of something",
        "tasa unitaria: la cantidad por exactamente una unidad de algo",
      ],
      ["per", "for each one", "por: por cada uno"],
      [
        "compare",
        "to look at two things to see how they are alike or different",
        "comparar: mirar dos cosas para ver en qué se parecen o se diferencian",
      ],
    ],
    correct:
      "Strong reasoning. Dividing each price by the number of bottles gives 50 cents and 40 cents per bottle, so the ten-pack is the better deal.",
    hint: "Divide the price of each pack by the number of bottles in it. Then compare the two prices for one bottle.",
    support:
      "Make a table with these columns: Pack, Price, Bottles, Price for one bottle. Fill in what you hear, then do the division for the last column.",
    extension:
      "Find the price for one bottle if a twelve-pack cost five dollars, then say whether it beats both packs.",
    wida: [
      "Explain: compute and compare rates from spoken numbers",
      "Interpret quantitative language such as per and each",
    ],
    es: [
      "Hallar y comparar tasas unitarias a partir de precios y cantidades dichos en voz alta",
      "Escucha a dos estudiantes comparar paquetes de jugo. Luego calcula el precio de una botella en cada paquete y escribe quién encontró la mejor oferta.",
    ],
    teacher: {
      use: "Ratios and rates unit. This is a versioned companion to v7-list-b-mathtalk: here the speakers give only prices and pack sizes, so the listener must compute each unit rate.",
      lower:
        "Give the four-column table with the headings written, and let students fill in the last column.",
      challenge:
        "Ask students to find how many bottles each pack would give for two dollars, and to explain what that shows.",
      prompt: "Why is comparing the price for one bottle fairer than comparing the pack prices?",
    },
  },
];
