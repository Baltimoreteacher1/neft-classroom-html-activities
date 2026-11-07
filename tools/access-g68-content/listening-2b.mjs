// Grades 6-8 publisher pass, Listening batch 2b: science, social studies and school life. Original scripts.
export default [
  {
    id: "l-a-lab-goggles",
    level: "A",
    strand: "Directions and procedures",
    type: "order",
    title: "Lab Safety Steps",
    skill: "Putting lab directions in order",
    dir: "Listen to the science teacher. Put the steps in the order you hear them.",
    q: "Put the lab safety steps in order.",
    script:
      "Before we start the experiment, follow these steps. First, put on your safety goggles. Next, tie back long hair. Then collect your materials from the tray. After that, pour the water slowly into the beaker. Finally, wash your hands when you are done. Remember, do not touch the materials until I say go. If you spill anything, tell me right away.",
    items: [
      "Put on safety goggles.",
      "Tie back long hair.",
      "Collect the materials.",
      "Pour the water slowly.",
      "Wash your hands.",
    ],
    vocab: [
      [
        "goggles",
        "glasses that protect your eyes",
        "gafas de seguridad: lentes que protegen los ojos",
      ],
      [
        "beaker",
        "a glass container used in science",
        "vaso de precipitados: un recipiente de vidrio que se usa en ciencias",
      ],
    ],
    frames: ["First, I ___.", "Finally, I ___."],
    focus: ["first, next, then, after that, finally", "the safety goggles", "washing hands"],
    correct: "Yes. The order words first, next, then, after that, and finally give the sequence.",
    hint: "Listen for the order words. Each one starts a new step.",
    wida: ["Explain: sequence lab directions", "Notice order words"],
    es: [
      "Poner en orden las instrucciones de un laboratorio",
      "Escucha al maestro de ciencias. Pon los pasos en el orden en que los oyes.",
    ],
  },
  {
    id: "l-a-trip-bus-times",
    level: "A",
    strand: "School day talk",
    title: "Museum Trip Announcement",
    skill: "Catching times and places in a school announcement",
    dir: "Listen to the announcement. Then choose the best answer.",
    q: "When and where do students meet for the museum trip?",
    script:
      "Good morning, sixth graders. Tomorrow is our trip to the science museum. Please meet at the front entrance at eight fifteen. Do not go to the cafeteria first. The bus leaves at eight thirty. Bring a bag lunch, a water bottle, and your permission form. We will come back to school at two o'clock. If you forget your form, please see me before the bell rings.",
    opts: [
      "At the front entrance at eight fifteen",
      "In the cafeteria at eight thirty",
      "At the front entrance at two o'clock",
    ],
    why: [
      "The speaker says not to go to the cafeteria; eight thirty is the time the bus leaves.",
      "Two o'clock is when the class returns to school, not when students meet for the trip.",
    ],
    vocab: [
      ["entrance", "the door where people go in", "entrada: la puerta por donde se entra"],
      [
        "permission form",
        "a paper a parent signs to say yes",
        "autorización: un papel que firma un familiar para decir que sí",
      ],
    ],
    frames: ["We meet at the ___.", "The bus leaves at ___."],
    focus: ["the place to meet", "the time to meet", "the word not"],
    correct:
      "Yes. Students meet at the front entrance at eight fifteen, and the bus leaves later at eight thirty.",
    hint: "Listen for the word meet. What time and place come right after it?",
    wida: ["Inform: identify times and places", "Notice number words"],
    es: [
      "Captar horas y lugares en un anuncio escolar",
      "Escucha el anuncio. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-a-evaporation-short",
    level: "A",
    strand: "Science explanations",
    title: "Where Did the Puddle Go?",
    skill: "Understanding a short science explanation",
    dir: "Listen to the science teacher. Then choose the best answer.",
    q: "What happens to the water in a puddle on a sunny day?",
    script:
      "After a rainstorm, a puddle sits on the playground. By afternoon, the puddle is gone. Where did the water go? The Sun heats the water, and some of the water changes from a liquid into a gas called water vapor. This change is called evaporation. The water vapor rises into the air, where we cannot see it. Later, it can cool and form clouds.",
    opts: [
      "It changes into water vapor and goes into the air.",
      "It sinks into the Sun and disappears forever.",
      "It turns into ice and stays on the ground.",
    ],
    why: [
      "The Sun heats the water, but the water does not go into the Sun; it goes into the air as a gas.",
      "Ice forms when water gets very cold, but the teacher describes the Sun heating the puddle.",
    ],
    vocab: [
      [
        "evaporation",
        "when a liquid changes into a gas",
        "evaporación: cuando un líquido se convierte en gas",
      ],
      [
        "water vapor",
        "water as a gas in the air",
        "vapor de agua: agua en forma de gas en el aire",
      ],
    ],
    frames: ["The Sun ___ the water.", "The water becomes ___ and rises."],
    focus: ["the word evaporation", "liquid and gas", "where the water goes"],
    correct:
      "Right. The Sun heats the puddle, and the water evaporates into water vapor that rises into the air.",
    hint: "Listen for what the Sun does and what the water changes into.",
    wida: ["Explain: understand a process in science", "Notice cause and effect"],
    es: [
      "Entender una explicación corta de ciencias",
      "Escucha al maestro de ciencias. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-b-council-interview",
    level: "B",
    gw: "g78-load",
    strand: "Interviews and discussions",
    title: "Student Council Interview",
    skill: "Finding a speaker's main promise and reason in an interview",
    dir: "Listen to a school radio interview. Then choose the best answer.",
    q: "What does Nadia want to change, and why?",
    script:
      "Host: Nadia, you are running for student council president. What is your main idea? Nadia: I want the library to stay open for one hour after school. Host: Why is that important? Nadia: Many students do not have a quiet place to study at home, and some have to wait for a ride. An open library gives them a safe place to read and finish homework. Host: What about the cost? Nadia: A librarian already works until five, so we only need a teacher volunteer. I surveyed one hundred students, and seventy-two said they would use the library after school.",
    opts: [
      "She wants the library open longer so students have a quiet place to study.",
      "She wants more homework so students use the library after class.",
      "She wants to hire a new librarian so the library can stay open all night.",
    ],
    why: [
      "Nadia never asks for more homework; she talks about giving students a place to finish the homework they already have.",
      "Nadia says a librarian already works until five, so she does not ask to hire anyone new.",
    ],
    vocab: [
      [
        "survey",
        "a set of questions asked to many people",
        "encuesta: un conjunto de preguntas hechas a muchas personas",
      ],
      [
        "volunteer",
        "a person who helps without being paid",
        "voluntario: una persona que ayuda sin recibir pago",
      ],
      [
        "candidate",
        "a person who is trying to win an election",
        "candidato: una persona que quiere ganar una elección",
      ],
    ],
    frames: ["Nadia wants ___.", "She says it is important because ___."],
    focus: ["her main idea", "her reasons", "the survey numbers"],
    correct:
      "Yes. Nadia wants the library open one extra hour so students who lack a quiet place at home can study.",
    hint: "Listen to the host's two questions. Nadia answers What is your main idea and Why is that important.",
    wida: ["Argue: identify a claim and reasons", "Follow an interview"],
    es: [
      "Hallar la promesa principal y la razón de una persona en una entrevista",
      "Escucha una entrevista de la radio escolar. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-b-silk-road-talk",
    level: "B",
    gw: "g6-topic",
    strand: "Social studies lectures",
    type: "multiSelect",
    title: "The Silk Road",
    skill: "Finding all the main ideas in a short history lecture",
    dir: "Listen to the history teacher. Choose ALL the things that traveled along the Silk Road. There is more than one answer.",
    q: "Which things traveled along the Silk Road?",
    script:
      "The Silk Road was not one road. It was a network of trade routes that connected China with lands to the west, including Central Asia, Persia, and the Mediterranean. Merchants carried silk, spices, and paper along these routes. But goods were not the only things that moved. Ideas moved too. Religions such as Buddhism spread from India into China, and new technologies, like papermaking, traveled west. Most merchants did not travel the whole distance. Instead, goods passed from trader to trader, so a bolt of silk might change hands many times.",
    opts: [
      "Silk and spices",
      "Religious ideas such as Buddhism",
      "Papermaking technology",
      "Steam engines",
      "Plastic goods",
    ],
    ans: 3,
    why: [
      "Steam engines were invented much later; the teacher lists silk, spices, paper, religions and technologies like papermaking.",
      "Plastic goods are never mentioned, and the lecture is about long-ago trade routes.",
    ],
    vocab: [
      [
        "merchant",
        "a person who buys and sells goods",
        "comerciante: una persona que compra y vende productos",
      ],
      ["network", "a group of connected parts", "red: un grupo de partes conectadas"],
      [
        "trade route",
        "a path used to carry goods to be sold",
        "ruta comercial: un camino para llevar productos a la venta",
      ],
    ],
    frames: ["Merchants carried ___ and ___.", "Ideas such as ___ also traveled."],
    focus: [
      "the goods the merchants carried",
      "the ideas that moved",
      "the phrase more than one road",
    ],
    correct: "Yes. Silk, spices, Buddhism and papermaking all traveled along the Silk Road routes.",
    hint: "Listen for two kinds of things: goods and ideas. Which choices were never mentioned?",
    wida: ["Inform: identify key details in a lecture", "Classify goods and ideas"],
    es: [
      "Hallar todas las ideas principales en una charla corta de historia",
      "Escucha al maestro de historia. Elige TODAS las cosas que viajaron por la Ruta de la Seda. Hay más de una respuesta.",
    ],
  },
  {
    id: "l-b-food-chain-roles",
    level: "B",
    gw: "g67-load",
    strand: "Science explanations",
    type: "sort",
    title: "Roles in an Ecosystem",
    skill: "Sorting details from a science talk into groups",
    dir: "Listen to the science talk about a pond. Then sort each living thing by its role.",
    q: "Sort each living thing into the role the speaker gives it.",
    script:
      "Every living thing in a pond ecosystem has a role. Producers make their own food using sunlight. Algae and water lilies are producers. Consumers get energy by eating other living things. Tadpoles eat algae, small fish eat tadpoles, and herons eat the fish, so all of these are consumers. Decomposers break down dead plants and animals and return nutrients to the water. Bacteria and fungi on the pond bottom are decomposers. Without all three roles, the pond ecosystem would not stay balanced.",
    cats: ["Producer", "Consumer", "Decomposer"],
    sortItems: [
      ["Algae", 0],
      ["Water lily", 0],
      ["Tadpole", 1],
      ["Heron", 1],
      ["Bacteria", 2],
      ["Fungi on the pond bottom", 2],
    ],
    vocab: [
      [
        "producer",
        "a living thing that makes its own food",
        "productor: un ser vivo que produce su propio alimento",
      ],
      [
        "consumer",
        "a living thing that eats other living things",
        "consumidor: un ser vivo que se alimenta de otros seres vivos",
      ],
      [
        "decomposer",
        "a living thing that breaks down dead matter",
        "descomponedor: un ser vivo que descompone materia muerta",
      ],
    ],
    frames: [
      "A producer makes its own food using ___.",
      "A ___ breaks down dead plants and animals.",
    ],
    focus: ["three roles", "an example for each role", "what each role does with energy"],
    correct:
      "Right. Algae and lilies are producers, tadpoles and herons are consumers, and bacteria and fungi are decomposers.",
    hint: "Listen to what each living thing does: makes food, eats, or breaks things down.",
    wida: ["Inform: classify details from a science talk", "Use ecosystem vocabulary"],
    es: [
      "Clasificar detalles de una charla de ciencias en grupos",
      "Escucha la charla de ciencias sobre un estanque. Luego clasifica cada ser vivo según su función.",
    ],
  },
  {
    id: "l-c-two-speakers-curfew",
    level: "C",
    gw: "g78-task",
    strand: "Compare speakers and sources",
    title: "Two Views on Later School Start Times",
    skill: "Comparing two speakers' positions and finding what they agree on",
    dir: "Listen to two speakers talk about school start times. Then choose the best answer.",
    q: "Which statement would BOTH speakers agree with?",
    script:
      "Speaker one: Our school should start later. Teenagers need about nine hours of sleep, and many of us wake before six. Studies show that students with more sleep pay better attention in class. Speaker two: I understand the sleep problem, but a later start would push practice and clubs into the evening. Many students have jobs or take care of younger siblings after school, so a later day would make life harder for them. Speaker one: That is a fair concern. We could keep the same ending time by shortening lunch. Speaker two: Maybe, but students would lose time to eat. Whatever we decide, students' health and schedules both matter.",
    opts: [
      "Students' health and their after-school responsibilities should both be considered.",
      "A later start time would solve every problem students have with sleep.",
      "Students should not have clubs, jobs or other activities after school.",
    ],
    why: [
      "Speaker one admits there are concerns, and speaker two says a later start would not fix every schedule problem.",
      "Neither speaker says students should give up activities; speaker two actually worries about protecting them.",
    ],
    vocab: [
      ["sibling", "a brother or a sister", "hermano o hermana: un hermano o una hermana"],
      ["concern", "a worry about something", "preocupación: una inquietud sobre algo"],
      ["schedule", "a plan of when things happen", "horario: un plan de cuándo ocurren las cosas"],
    ],
    frames: ["Speaker one believes ___.", "Both speakers agree that ___."],
    focus: ["each speaker's position", "the reasons each gives", "the last sentence"],
    correct:
      "Yes. In the last line speaker two says health and schedules both matter, and speaker one calls the schedule concern fair.",
    hint: "Listen for the places where each speaker says something kind about the other speaker's point.",
    wida: ["Argue: compare two speakers' claims", "Identify common ground"],
    es: [
      "Comparar las posturas de dos hablantes y hallar en qué coinciden",
      "Escucha a dos personas hablar sobre el horario de inicio de la escuela. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-c-podcast-attitude",
    level: "C",
    gw: "g78-load",
    strand: "Speaker purpose and attitude",
    title: "A Podcast About Screen Time",
    skill: "Identifying a speaker's purpose and attitude",
    dir: "Listen to the start of a student podcast. Then choose the best answer.",
    q: "What is the speaker's main purpose in this part of the podcast?",
    script:
      "Welcome back to Study Break. Today's topic is screen time. Some people say screens are ruining our brains. Others say screens are just tools. I think the truth is more complicated. A video call with my cousin overseas is wonderful, but when I scroll for an hour before bed, I notice I sleep worse. So in this episode, I will not tell you to throw away your phone. Instead, I will share three questions you can ask yourself to decide whether a screen is helping or hurting you.",
    opts: [
      "To invite listeners to think carefully about how they use screens",
      "To convince listeners to stop using phones completely",
      "To prove that screens are always helpful for students",
    ],
    why: [
      "The speaker says she will not tell listeners to throw away their phones, so the purpose is not to ban them.",
      "The speaker says scrolling before bed hurts her sleep, so she does not claim screens are always helpful.",
    ],
    vocab: [
      [
        "purpose",
        "the reason a speaker is talking",
        "propósito: la razón por la que alguien habla",
      ],
      ["complicated", "not simple; having many parts", "complicado: no simple; con muchas partes"],
      [
        "overseas",
        "across the ocean in another country",
        "en el extranjero: al otro lado del océano en otro país",
      ],
    ],
    frames: ["The speaker's purpose is to ___.", "I know because she says ___."],
    focus: [
      "the speaker's opinion",
      "the examples from her own life",
      "the three questions she promises",
    ],
    correct:
      "Yes. She gives good and bad examples and promises questions that help listeners decide for themselves.",
    hint: "Listen to what she says she will NOT do and what she will do instead.",
    wida: ["Argue: identify a speaker's purpose", "Infer an attitude from word choice"],
    es: [
      "Identificar el propósito y la actitud de un hablante",
      "Escucha el comienzo de un pódcast estudiantil. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-c-museum-guide-inference",
    level: "C",
    gw: "g78-load",
    strand: "Inference from speech",
    title: "The Museum Guide's Clue",
    skill: "Making an inference from what a speaker says and how",
    dir: "Listen to a museum guide. Then choose the best answer.",
    q: "What can you infer about the clay bowl from what the guide says?",
    script:
      "Please gather around this display. This clay bowl is about two thousand years old. Notice the thin walls and the even decoration. A potter made this with great skill, and look here: the bottom has been worn smooth, and there is a small repaired crack near the rim. People did not repair things they did not value. Archaeologists believe this bowl was used for years, mended carefully, and kept rather than thrown away. Please do not touch the glass, but take your time to look closely.",
    opts: [
      "Its owners valued it enough to use it for a long time and repair it.",
      "It was made recently to look like an old bowl for the museum.",
      "It was rarely used because the owners kept it for decoration only.",
    ],
    why: [
      "The guide says it is about two thousand years old, so the museum is not presenting a modern copy.",
      "The smooth, worn bottom and the repaired crack show that people used it often.",
    ],
    vocab: [
      [
        "archaeologist",
        "a scientist who studies objects from the past",
        "arqueólogo: un científico que estudia objetos del pasado",
      ],
      ["infer", "to figure out something from clues", "inferir: deducir algo a partir de pistas"],
      ["mend", "to fix something that is broken", "remendar: arreglar algo que está roto"],
    ],
    frames: ["The worn bottom shows that ___.", "I can infer that the owners ___."],
    focus: [
      "the clues the guide points out",
      "the sentence about not repairing things",
      "what archaeologists believe",
    ],
    correct:
      "Yes. The worn bottom and the careful repair are clues that people used the bowl for years and valued it.",
    hint: "Listen for the clues about the bottom of the bowl and the crack. What do they tell you about how it was used?",
    wida: ["Inform: draw an inference from spoken clues", "Connect details to a conclusion"],
    es: [
      "Hacer una inferencia a partir de lo que dice un hablante",
      "Escucha a una guía de museo. Luego elige la mejor respuesta.",
    ],
  },
  {
    id: "l-c-erie-canal-notes",
    level: "C",
    gw: "g78-topic",
    strand: "Note-taking from a talk",
    type: "constructed",
    title: "Take Notes: The Erie Canal",
    skill: "Taking notes on a history talk and writing a summary",
    dir: "Listen to the history talk. Write notes under the headings Why, How, and Result. Then write a two-sentence summary.",
    q: "Take notes under the headings Why, How, and Result. Then summarize the talk in one or two sentences.",
    script:
      "In the early eighteen hundreds, farmers in the American interior had a problem. They could grow plenty of food, but moving it to eastern cities by wagon was slow and expensive. New York leaders proposed a canal that would link the Hudson River with Lake Erie. Workers dug it mostly by hand, with shovels, horses, and simple machines, and the Erie Canal opened in eighteen twenty-five. It was about three hundred sixty-three miles long. Shipping goods by canal cost far less than shipping them by wagon. As a result, cities such as Buffalo and Rochester grew quickly, and New York City became the nation's busiest port.",
    focus: ["why the canal was built", "how it was built", "what happened because of it"],
    models: {
      A: "Why: wagons slow and costly. How: dug by hand, horses. Result: cheaper shipping, cities grew. The canal helped trade.",
      B: "Why: moving food by wagon was slow and expensive. How: workers dug with shovels and horses; opened 1825. Result: shipping cost less and Buffalo and Rochester grew. Summary: The Erie Canal made trade cheaper and helped cities grow.",
      C: "Why: farmers in the interior could not move food to eastern cities cheaply by wagon. How: proposed by New York leaders; dug mostly by hand with shovels, horses and simple machines; opened 1825; about 363 miles linking the Hudson River and Lake Erie. Result: shipping cost far less, Buffalo and Rochester grew quickly, New York City became the busiest port. Summary: Because wagons were too slow and costly, New York built the Erie Canal, which lowered shipping costs and caused cities and trade to grow.",
    },
    criteria: [
      "I wrote key words under all three headings.",
      "I included at least one number or date from the talk.",
      "My summary explains the cause and the result.",
    ],
    label: "Your notes and summary",
    vocab: [
      ["canal", "a waterway built by people", "canal: una vía de agua construida por personas"],
      [
        "interior",
        "the inside part of a country, away from the coast",
        "interior: la parte de dentro de un país, lejos de la costa",
      ],
      [
        "port",
        "a city where ships load and unload",
        "puerto: una ciudad donde los barcos cargan y descargan",
      ],
    ],
    frames: ["The canal was built because ___.", "As a result, ___.", "In summary, ___."],
    wida: ["Narrate: take notes on a cause-and-effect history talk", "Summarize a spoken text"],
    es: [
      "Tomar apuntes de una charla de historia y escribir un resumen",
      "Escucha la charla de historia. Escribe apuntes bajo los títulos Por qué, Cómo y Resultado. Luego escribe un resumen de dos oraciones.",
    ],
    correct:
      "Good note-taking. Strong notes include a cause, key facts about how it happened, and the results.",
    hint: "Listen for the words because and as a result. They tell you about the cause and the effect.",
  },
];
