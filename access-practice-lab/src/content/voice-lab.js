// Voice Lab content: picture speaking ladders, listen/read-then-retell tasks, minimal-pair sound sets, shadowing
// lines, oral reading passages and keyboarding frames. All original EduWonderLab text. Pictures are the lab's own
// (pictures/*.svg). Practice steps are practice, never an ACCESS tier or a WIDA level.

/** Picture speaking ladders: step 1 words → step 2 sentences → step 3 extended talk, per picture scene. */
export const LADDERS = [
  {
    id: "school-hallway",
    band: "6-8",
    title: "The Busy Hallway",
    titleEs: "El pasillo lleno de gente",
    picture: "pictures/68-school-hallway.svg",
    alt: "A busy school hallway with a row of lockers, students carrying backpacks, a clock, and a water fountain.",
    steps: [
      {
        prompt: "Name four things you see in the hallway.",
        frame: "I see ___, ___, ___ and ___.",
        model: { name: "Amara", line: "I see lockers, backpacks, a clock and a water fountain." },
      },
      {
        prompt: "Tell what the students are doing and why.",
        frame: "The students are ___ because ___.",
        model: {
          name: "Mateo",
          line: "The students are walking to class because the bell rang. One student is getting a drink from the fountain before the next lesson.",
        },
      },
      {
        prompt:
          "The hallway gets crowded between classes. Explain one change the school could make so students get to class safely, and give a reason.",
        frame:
          "One change the school could make is ___. This would help because ___. For example, ___.",
        model: {
          name: "Lina",
          line: "One change the school could make is to have students walk on the right side of the hallway. This would help because people going in different directions would not bump into each other. For example, a student with a heavy backpack could get to the water fountain without stopping traffic. A simple rule like this keeps everyone safe and on time.",
        },
      },
    ],
  },
  {
    id: "science-lab",
    band: "6-8",
    title: "In the Science Lab",
    titleEs: "En el laboratorio de ciencias",
    picture: "pictures/68-science-lab.svg",
    alt: "A student wearing goggles pours liquid into a beaker. A microscope and a ruler are on the table.",
    steps: [
      {
        prompt: "Name the science tools you see.",
        frame: "I see a ___, a ___ and ___.",
        model: { name: "Kwame", line: "I see goggles, a beaker, a microscope and a ruler." },
      },
      {
        prompt: "Describe what the student is doing, step by step.",
        frame: "First, the student ___. Then, ___.",
        model: {
          name: "Sofía",
          line: "First, the student puts on goggles. Then, she carefully pours a liquid into a beaker.",
        },
      },
      {
        prompt:
          "Explain why the student wears goggles and how each tool on the table helps a scientist.",
        frame: "The student wears goggles so that ___. A microscope helps ___, and a ruler ___.",
        model: {
          name: "Daniel",
          line: "The student wears goggles so that no liquid can splash into her eyes. Safety comes first in a lab. A microscope helps a scientist see things that are too small for our eyes, like cells. A ruler helps her measure, so she can record exact numbers and compare her results with other groups.",
        },
      },
    ],
  },
  {
    id: "city-park",
    band: "6-8",
    title: "A Day at the Park",
    titleEs: "Un día en el parque",
    picture: "pictures/68-park.svg",
    alt: "A park with tall trees, a pond with ducks, a fountain, and a path.",
    steps: [
      {
        prompt: "Name four things in the park.",
        frame: "There are ___, ___, ___ and ___.",
        model: { name: "Ines", line: "There are tall trees, a pond, ducks and a fountain." },
      },
      {
        prompt: "Compare the pond and the fountain.",
        frame: "The pond ___, but the fountain ___.",
        model: {
          name: "Omar",
          line: "The pond is calm and has ducks in it, but the fountain sprays water into the air.",
        },
      },
      {
        prompt:
          "The city wants to add one thing to this park. Argue for what it should add, and support your idea with two reasons.",
        frame: "The city should add ___. First, ___. Second, ___. That is why ___.",
        model: {
          name: "Grace",
          line: "The city should add benches along the path. First, older people and families with small children need a place to rest. Second, people could sit and watch the ducks instead of standing near the water. That is why benches would help more people enjoy the park for a longer time.",
        },
      },
    ],
  },
  {
    id: "class-garden",
    band: "3-5",
    title: "Our Class Garden",
    titleEs: "Nuestro huerto escolar",
    picture: "pictures/35-speaking-class-garden.svg",
    alt: "A school garden with two wooden garden beds. Tomato plants grow in one bed, and tall sunflowers grow in the other bed. A girl waters the tomatoes with a watering can, and a boy digs with a small shovel.",
    steps: [
      {
        prompt: "Name three things in the garden.",
        frame: "I see ___, ___ and ___.",
        model: { name: "Pablo", line: "I see tomatoes, sunflowers and a watering can." },
      },
      {
        prompt: "Tell what the girl and the boy are doing.",
        frame: "The girl is ___. The boy is ___.",
        model: {
          name: "Mei",
          line: "The girl is watering the tomatoes. The boy is digging with a small shovel.",
        },
      },
      {
        prompt: "Explain how the children help the plants grow.",
        frame: "The children help the plants by ___. Plants need ___ so ___.",
        model: {
          name: "Tariq",
          line: "The children help the plants by giving them water and digging the soil. Plants need water so their roots can drink. Soft soil helps the roots grow deep, so the sunflowers can get tall.",
        },
      },
    ],
  },
  {
    id: "market",
    band: "3-5",
    title: "The Community Market",
    titleEs: "El mercado comunitario",
    picture: "pictures/35-speaking-market.svg",
    alt: "An outdoor community market with three stands: fruit, vegetables and bread. A mother and her son buy apples, and a man carries a shopping bag.",
    steps: [
      {
        prompt: "Name the three stands.",
        frame: "There is a ___ stand, a ___ stand and a ___ stand.",
        model: {
          name: "Rosa",
          line: "There is a fruit stand, a vegetable stand and a bread stand.",
        },
      },
      {
        prompt: "Tell what the mother and her son are buying.",
        frame: "The mother and her son are buying ___ at the ___ stand.",
        model: {
          name: "Ali",
          line: "The mother and her son are buying apples at the fruit stand.",
        },
      },
      {
        prompt: "You have two dollars. Tell what you would buy at the market and explain why.",
        frame: "I would buy ___ because ___. I would also ___.",
        model: {
          name: "Hana",
          line: "I would buy a loaf of bread because my family eats bread every morning. It costs two dollars, so I would use all my money. If I had more money, I would also buy apples for a snack.",
        },
      },
    ],
  },
  {
    id: "recycling",
    band: "3-5",
    title: "Sorting the Recycling",
    titleEs: "Separar el reciclaje",
    picture: "pictures/35-speaking-recycling.svg",
    alt: "Two students sort recycling at school. There are three bins labeled Paper, Plastic, and Cans. A table has a cardboard box, a can, and another bottle waiting to be sorted.",
    steps: [
      {
        prompt: "Name the three bins.",
        frame: "The bins are ___, ___ and ___.",
        model: { name: "Diego", line: "The bins are paper, plastic and cans." },
      },
      {
        prompt: "Tell where each thing on the table should go.",
        frame: "The ___ goes in the ___ bin.",
        model: {
          name: "Ngozi",
          line: "The box goes in the paper bin. The can goes in the cans bin, and the bottle goes in the plastic bin.",
        },
      },
      {
        prompt: "Explain why sorting recycling is important for your school.",
        frame: "Sorting recycling is important because ___. When we ___, ___.",
        model: {
          name: "Lucía",
          line: "Sorting recycling is important because it keeps trash out of the ground. When we put paper, plastic and cans in the right bins, they can be made into new things. Our school makes less trash, and that helps our community.",
        },
      },
    ],
  },
];

/**
 * Listen-then-speak and read-then-speak retell tasks. Heard sources are `turns` (one narrator) or `parts` (speakers);
 * the on-screen transcript and the read-aloud come from the same words. Fields the Voice Lab teaches with:
 *  - `genre` what is being heard/read; `listenFor` the purpose shown before the audio;
 *  - `check` listening comprehension (kind: main-idea | detail | sequence | inference; `part` = where to listen again);
 *  - `vocab` [word, meaning, Spanish]; `frames` { full, light }: the sentence frames fade from full to light after take 1;
 *  - `criteria` what a strong retell does (a self-review list: the lab does not score speech).
 */
export const RETELLS = [
  {
    id: "water-filter",
    band: "6-8",
    mode: "listen",
    genre: "Class report",
    genreEs: "Informe de clase",
    title: "How a Water Filter Works",
    titleEs: "Cómo funciona un filtro de agua",
    prompt:
      "Retell how the class's water filter works. Say what each layer does, in order, and what the class found.",
    listenFor: ["the three layers, in order", "what each layer caught", "why clear water may not be safe"],
    turns: [
      "Today we built a water filter in a plastic bottle. We put three layers inside: gravel on top, sand in the middle, and charcoal at the bottom.",
      "When we poured muddy water in, the gravel caught the leaves and small sticks first. Then the sand trapped the tiny bits of dirt. Last, the charcoal took away the bad smell.",
      "The water that came out was much clearer. But remember: clear water is not always safe water. Germs are too small to see, so we would still need to boil it before drinking.",
    ],
    check: [
      {
        kind: "main-idea",
        part: 0,
        q: "What is the recording mostly about?",
        options: [
          "Why muddy water is safe to drink once it looks clear.",
          "Where to find gravel, sand and charcoal outdoors.",
          "How a class built a bottle filter and what it did to muddy water.",
        ],
        answer: 2,
        hint: "Think about the whole recording, from the bottle at the start to the water at the end.",
        why: "The speaker describes building the filter, what each layer did, and how the water changed.",
      },
      {
        kind: "detail",
        part: 1,
        q: "Which layer took away the bad smell?",
        options: ["The gravel", "The sand", "The charcoal"],
        answer: 2,
        hint: "Each layer has its own job in the second part. Listen for the word \"smell\".",
        why: "The charcoal took away the smell. The gravel caught leaves and sticks, and the sand trapped tiny bits of dirt.",
      },
      {
        kind: "inference",
        part: 2,
        q: "Why would the class still boil the water before drinking it?",
        options: [
          "Boiling makes muddy water look clearer.",
          "Clear water can still have germs that are too small to see.",
          "The charcoal leaves a bad taste in the water.",
        ],
        answer: 1,
        hint: "Listen to the last part. What can the filter not remove?",
        why: "The speaker says germs are too small to see, so clear water is not always safe water.",
      },
    ],
    vocab: [
      ["filter", "to take dirt out of water or air", "filtrar: quitar la suciedad del agua o del aire"],
      ["trap", "to catch something and hold it", "atrapar: sujetar algo para que no pase"],
      ["charcoal", "a black material that takes away smells", "carbón: material negro que quita los malos olores"],
      ["germs", "tiny living things that can make people sick", "gérmenes: seres muy pequeños que pueden enfermar"],
    ],
    plan: ["The layers", "What each layer did", "What the class found"],
    frames: {
      full: [
        "The class built a filter with ___ layers: ___, ___ and ___.",
        "First, the ___ caught ___. Next, the ___ trapped ___. Last, the ___ took away ___.",
        "The water was ___, but it was not safe because ___.",
      ],
      light: ["The class built ___.", "First, ___. Next, ___. Last, ___.", "The water was ___, but ___."],
    },
    criteria: [
      "I name all three layers in order.",
      "I say what each layer did.",
      "I say the water was clearer but not safe, and I say why.",
      "I use order words such as first, next and last.",
    ],
    model: {
      name: "Rafael",
      line: "The class built a water filter with three layers. First, the gravel caught leaves and sticks. Next, the sand trapped tiny bits of dirt. Last, the charcoal took away the smell. The water came out clearer, but it was not safe yet, because germs are too small to see and the class would still have to boil it.",
    },
  },
  {
    id: "assembly-change",
    band: "6-8",
    mode: "listen",
    genre: "School announcement",
    genreEs: "Anuncio escolar",
    title: "The Assembly Moves",
    titleEs: "La asamblea cambia de lugar",
    prompt:
      "Your friend was absent and missed the announcement. Tell your friend what changed, why it changed, and what students must do.",
    listenFor: ["what changed and why", "the new time", "what students must bring"],
    parts: [
      {
        speaker: "Ms. Alvarez",
        text: "Good afternoon, students. This is Ms. Alvarez with a schedule change for Thursday. Because the gym floor is being repaired, our spring assembly will move from the gym to the auditorium.",
      },
      {
        speaker: "Ms. Alvarez",
        text: "Classes will walk to the auditorium at ten forty instead of ten fifteen, so first period will be twenty-five minutes longer. Sixth graders will sit on the left side, and seventh and eighth graders will sit on the right.",
      },
      {
        speaker: "Ms. Alvarez",
        text: "Please bring your student ID, because teachers will use it to take attendance at the door. Anyone who forgets it should stop at the front office before the assembly. Thank you, and have a great afternoon.",
      },
    ],
    check: [
      {
        kind: "main-idea",
        part: 0,
        q: "What is the announcement mostly about?",
        options: [
          "A new rule about student ID cards.",
          "A plan to repair the auditorium.",
          "A change to where and when Thursday's assembly happens.",
        ],
        answer: 2,
        hint: "Listen to the first part. What is moving, and where is it moving to?",
        why: "Ms. Alvarez says the assembly moves from the gym to the auditorium and that the time changes too.",
      },
      {
        kind: "detail",
        part: 1,
        q: "When will classes walk to the auditorium?",
        options: ["At ten fifteen.", "At ten twenty-five.", "At ten forty."],
        answer: 2,
        hint: "Two times are in this part. One is the old time and one is the new time. Listen for \"instead of\".",
        why: "She says ten forty instead of ten fifteen. Ten fifteen was the old time.",
      },
      {
        kind: "inference",
        part: 2,
        q: "Why do students need to bring their ID?",
        options: [
          "Students use it to choose a seat.",
          "Teachers will use it to take attendance at the door.",
          "The front office needs it for the repairs.",
        ],
        answer: 1,
        hint: "Listen for the word \"because\" in the last part.",
        why: "She says teachers will use the ID to take attendance at the door.",
      },
    ],
    vocab: [
      ["schedule", "a plan that shows when things happen", "horario: plan que muestra cuándo ocurre cada cosa"],
      ["assembly", "a meeting for the whole school", "asamblea: reunión de toda la escuela"],
      ["attendance", "a list of who is present", "asistencia: lista de quién está presente"],
      ["repair", "to fix something that is broken", "reparar: arreglar algo que está roto"],
    ],
    plan: ["What changed", "Why it changed", "What students must do"],
    frames: {
      full: [
        "Ms. Alvarez said that the ___ is moving from ___ to ___.",
        "It is changing because ___.",
        "Students should ___ because ___.",
      ],
      light: ["The ___ moved ___.", "The reason is ___.", "Students should ___."],
    },
    criteria: [
      "I say what changed and give the new place and time.",
      "I give the reason for the change.",
      "I tell my friend what to bring or do.",
      "I talk to my friend in my own words, not Ms. Alvarez's exact words.",
    ],
    model: {
      name: "Camila",
      line: "Ms. Alvarez announced a schedule change for Thursday. The spring assembly is moving from the gym to the auditorium because the gym floor is being repaired. Classes will walk over at ten forty, not ten fifteen, so first period will be longer. You need to bring your student ID because teachers will take attendance at the door, and if you forget it, you should go to the front office first.",
    },
  },
  {
    id: "interview-crosswalk",
    band: "6-8",
    mode: "listen",
    genre: "Interview",
    genreEs: "Entrevista",
    title: "Where Does a Crosswalk Go?",
    titleEs: "¿Dónde va un paso de peatones?",
    prompt:
      "A classmate wants a crosswalk near your school. Explain what the city checks before it builds one, then recommend what your classmate should do.",
    listenFor: ["what the city counts, measures and checks", "the example about the hill", "Ms. Patel's advice"],
    parts: [
      { speaker: "Jo", text: "Ms. Patel, how does the city decide where to put a new crosswalk?" },
      {
        speaker: "Ms. Patel",
        text: "We start with data. First, we count how many people cross the street and how many cars pass in one hour. Next, we measure how fast the cars are going, because a fast car needs much more distance to stop.",
      },
      { speaker: "Jo", text: "What else do you look at?" },
      {
        speaker: "Ms. Patel",
        text: "We visit the place. Near a school or a bus stop, many people cross at the same spot, so a crosswalk there helps the most. Last, we ask the neighbors. Once, a resident told us that children crossed behind a hill where drivers could not see them. We moved the crosswalk twenty meters, and the problem was solved.",
      },
      { speaker: "Jo", text: "What would you tell students who want a crosswalk near our school?" },
      {
        speaker: "Ms. Patel",
        text: "Bring evidence. Count the people who cross, take photos, and write down what you see. A clear count is stronger than saying, \"It feels dangerous.\"",
      },
    ],
    check: [
      {
        kind: "detail",
        part: 1,
        q: "Why does the city measure how fast the cars are going?",
        options: [
          "Slow cars do not need a crosswalk.",
          "The city counts cars by their speed.",
          "A fast car needs more distance to stop.",
        ],
        answer: 2,
        hint: "Listen for the word \"because\" in Ms. Patel's first long answer.",
        why: "She says a fast car needs much more distance to stop, so speed matters for safety.",
      },
      {
        kind: "sequence",
        part: 3,
        q: "Which list shows the order Ms. Patel gives for what the city does?",
        options: [
          "Ask the neighbors, count people and cars, visit the place.",
          "Count people and cars, measure speed, visit the place, ask the neighbors.",
          "Visit the place, ask the neighbors, count people and cars.",
        ],
        answer: 1,
        hint: "She uses the order words first, next and last. Listen to both of her answers.",
        why: "She starts with counts and speed, then visits the place, and last asks the neighbors.",
      },
      {
        kind: "inference",
        part: 5,
        q: "Why does Ms. Patel say a clear count is stronger than \"It feels dangerous\"?",
        options: [
          "Students should not tell the city how they feel.",
          "Numbers give the city evidence it can check.",
          "Counting takes less time than visiting the place.",
        ],
        answer: 1,
        hint: "Listen to the last part. She says to \"bring evidence\".",
        why: "A count is evidence the city can check. A feeling, by itself, is hard to check.",
      },
    ],
    vocab: [
      ["crosswalk", "a marked place where people cross a street", "paso de peatones: lugar marcado para cruzar la calle"],
      ["data", "facts and numbers you collect to answer a question", "datos: hechos y números que reúnes para responder una pregunta"],
      ["resident", "a person who lives in a place", "residente: persona que vive en un lugar"],
      ["evidence", "facts that show an idea is true", "evidencia: hechos que muestran que una idea es verdadera"],
    ],
    plan: ["What the city checks", "A real example", "My recommendation"],
    frames: {
      full: [
        "Before it builds a crosswalk, the city counts ___, measures ___ and asks ___.",
        "For example, ___, so the city ___.",
        "I recommend that you ___ because ___.",
      ],
      light: ["The city checks ___.", "For example, ___.", "I recommend ___ because ___."],
    },
    criteria: [
      "I name what the city counts, measures and asks.",
      "I use the hill example from the interview.",
      "I recommend something to my classmate and give a reason.",
      "I use a transition such as first, next, for example or because.",
    ],
    model: {
      name: "Noor",
      line: "Before it builds a crosswalk, the city counts how many people and cars use the street and measures how fast the cars go. Next, it visits the place, especially near schools and bus stops, and last, it asks the neighbors. For example, one crosswalk was moved twenty meters because children crossed behind a hill where drivers could not see them. I recommend that you count the people who cross and take photos, because evidence is stronger than a feeling.",
    },
  },
  {
    id: "bridge-triangles",
    band: "6-8",
    mode: "read",
    genre: "Informational article",
    genreEs: "Artículo informativo",
    title: "Why Bridges Use Triangles",
    titleEs: "Por qué los puentes usan triángulos",
    prompt: "Retell the main idea of the article and the two reasons it gives.",
    text: [
      "Look closely at an old railroad bridge and you will see triangles everywhere. Engineers use triangles because they are the strongest simple shape.",
      "A square can be pushed into a diamond shape when a heavy load presses on one corner. A triangle cannot change its shape unless one of its sides breaks or bends. That is why builders call it a rigid shape.",
      "Triangles also spread the weight. When a train rolls across, each triangle passes the push along its sides to the next triangle, so no single beam carries the whole load.",
    ],
    vocab: [
      ["rigid", "does not change shape when it is pushed", "rígido: no cambia de forma cuando lo empujan"],
      ["load", "the weight that a structure holds", "carga: el peso que sostiene una estructura"],
      ["beam", "a long, strong bar that holds weight", "viga: barra larga y fuerte que sostiene peso"],
      ["spread", "to share across a larger area", "repartir: compartir en un área más grande"],
    ],
    plan: ["Main idea", "Reason 1", "Reason 2"],
    frames: {
      full: [
        "The article explains that engineers use ___ in bridges because ___.",
        "The first reason is that ___. A square can ___, but a triangle ___.",
        "The second reason is that ___ so no single ___ carries ___.",
      ],
      light: ["Engineers use ___ because ___.", "The first reason is ___.", "The second reason is ___."],
    },
    criteria: [
      "I state the main idea in one sentence.",
      "I give both reasons from the article.",
      "I use my own words instead of reading the article's sentences.",
      "I connect my ideas with words such as because, also or so.",
    ],
    model: {
      name: "Yasmin",
      line: "The article explains that bridges use triangles because they are the strongest simple shape. The first reason is that a triangle cannot change its shape unless a side breaks, but a square can be pushed into a diamond. The second reason is that triangles spread the weight, so when a train crosses, the push passes from triangle to triangle and no single beam carries the whole load.",
    },
  },
  {
    id: "bees-flowers",
    band: "3-5",
    mode: "listen",
    genre: "Science explanation",
    genreEs: "Explicación de ciencias",
    title: "How Bees Help Flowers",
    titleEs: "Cómo ayudan las abejas a las flores",
    prompt: "Retell how bees help flowers. Tell what happens first, next and last.",
    picture: "pictures/35t-bee-flower.svg",
    alt: "A close-up picture of a fuzzy striped bee standing on a big pink flower. Clumps of yellow dust from the flower are stuck to the bee's back legs and body.",
    listenFor: ["what the bee drinks", "what sticks to its legs", "how the flower gets help"],
    turns: [
      "A bee lands on a flower to drink a sweet juice called nectar.",
      "While the bee drinks, yellow dust called pollen sticks to its fuzzy legs. Then the bee flies to another flower, and some pollen falls off there.",
      "That pollen helps the second flower make seeds. So bees get food, and flowers get help making new plants.",
    ],
    check: [
      {
        kind: "sequence",
        part: 0,
        q: "What does the bee do first?",
        options: [
          "It carries pollen to a second flower.",
          "It helps a flower make seeds.",
          "It lands on a flower to drink nectar.",
        ],
        answer: 2,
        hint: "The first sentence tells you the very first step.",
        why: "First the bee lands and drinks nectar. Moving the pollen and making seeds come later.",
      },
      {
        kind: "detail",
        part: 1,
        q: "What sticks to the bee's legs?",
        options: ["Nectar", "Pollen", "Seeds"],
        answer: 1,
        hint: "Listen for the yellow dust in the second part.",
        why: "Pollen is the yellow dust that sticks to the bee's fuzzy legs. Nectar is the sweet juice the bee drinks.",
      },
      {
        kind: "main-idea",
        part: 2,
        q: "How do bees help flowers?",
        options: [
          "They drink all the nectar so the flowers can rest.",
          "They carry pollen from one flower to another so seeds can grow.",
          "They plant seeds in the ground.",
        ],
        answer: 1,
        hint: "The last part says what the pollen does for the second flower.",
        why: "Pollen from the first flower helps the second flower make seeds. Bees get food, and flowers get help.",
      },
    ],
    vocab: [
      ["nectar", "a sweet juice inside a flower", "néctar: jugo dulce dentro de una flor"],
      ["pollen", "yellow dust from a flower", "polen: polvo amarillo de una flor"],
      ["seeds", "small parts that can grow into new plants", "semillas: partes pequeñas que pueden crecer y ser plantas nuevas"],
    ],
    plan: ["First", "Next", "Last"],
    frames: {
      full: [
        "First, a bee lands on a flower to drink ___.",
        "Next, ___ sticks to its ___, and the bee flies to ___.",
        "Last, the pollen helps the flower ___.",
      ],
      light: ["First, ___.", "Next, ___.", "Last, ___."],
    },
    criteria: [
      "I tell what happens first, next and last.",
      "I use the words nectar and pollen.",
      "I say how both the bee and the flower get something.",
      "I speak in complete sentences.",
    ],
    model: {
      name: "Amina",
      line: "First, a bee lands on a flower to drink nectar. Next, pollen sticks to its legs, and it carries the pollen to another flower. Last, the pollen helps that flower make seeds, so new plants can grow.",
    },
  },
  {
    id: "directions-library",
    band: "3-5",
    mode: "listen",
    genre: "Directions",
    genreEs: "Indicaciones",
    title: "How Do I Get to the Library?",
    titleEs: "¿Cómo llego a la biblioteca?",
    prompt:
      "A new student asks you where the library is. Give the directions from the office, in order, and say where the library is at the end.",
    listenFor: ["each turn, in order", "places you pass", "how Tomás checks he understood"],
    parts: [
      { speaker: "Tomás", text: "Excuse me, Ms. Chen. How do I get to the library from the office?" },
      {
        speaker: "Ms. Chen",
        text: "Walk out of the office and turn left. Go straight past the gym and the water fountain.",
      },
      {
        speaker: "Ms. Chen",
        text: "Then turn right at the art room. The library is the second door on your left, across from the music room.",
      },
      {
        speaker: "Tomás",
        text: "So I go left, straight past the gym, right at the art room, and the second door on the left. Is that right?",
      },
      { speaker: "Ms. Chen", text: "Yes, that is right. Look for the big blue sign on the door." },
    ],
    check: [
      {
        kind: "sequence",
        part: 1,
        q: "What does Tomás do first after he leaves the office?",
        options: [
          "He turns right.",
          "He walks past the art room.",
          "He turns left.",
        ],
        answer: 2,
        hint: "Ms. Chen gives the first turn in her first answer.",
        why: "She says to walk out of the office and turn left. The right turn comes later, at the art room.",
      },
      {
        kind: "detail",
        part: 2,
        q: "Which room is across from the library?",
        options: ["The gym", "The music room", "The art room"],
        answer: 1,
        hint: "Listen for \"across from\" in Ms. Chen's second answer.",
        why: "The library is across from the music room. Tomás turns right at the art room, but the art room is not across from the library.",
      },
      {
        kind: "inference",
        part: 3,
        q: "Why does Tomás say the directions again?",
        options: [
          "Because Ms. Chen forgot them.",
          "To check that he understood them.",
          "Because he wants to go to the gym.",
        ],
        answer: 1,
        hint: "He ends with a question: \"Is that right?\"",
        why: "Saying the directions back is a way to check you understood, and Ms. Chen says yes.",
      },
    ],
    vocab: [
      ["straight", "going forward without turning", "recto: hacia adelante sin doblar"],
      ["landmark", "a place you can see that helps you find your way", "punto de referencia: lugar que ves y te ayuda a orientarte"],
      ["across from", "on the other side, facing it", "frente a: al otro lado, mirándolo"],
    ],
    plan: ["Where you start", "Turns and places you pass", "Where the library is"],
    frames: {
      full: [
        "Start at the ___. Turn ___.",
        "Go straight past the ___ and the ___. Then turn ___ at the ___.",
        "The library is the ___ door on the ___, across from the ___.",
      ],
      light: ["First, ___.", "Next, ___.", "The library is ___."],
    },
    criteria: [
      "I give the turns in the correct order.",
      "I name at least two places to pass.",
      "I say left and right correctly.",
      "I say where the library is at the end.",
    ],
    model: {
      name: "Lucía",
      line: "Start at the office and turn left. Go straight past the gym and the water fountain. Then turn right at the art room. The library is the second door on the left, across from the music room.",
    },
  },
  {
    id: "compost-bin",
    band: "3-5",
    mode: "read",
    genre: "Short story",
    genreEs: "Relato corto",
    title: "The Lunchroom Compost Bin",
    titleEs: "El contenedor de compost del comedor",
    prompt: "Retell what the students did with their food scraps and why.",
    text: [
      "Room 12 noticed that the lunchroom threw away many apple cores and banana peels every day.",
      "The students set up a compost bin next to the trash cans. Every day after lunch, they put the fruit scraps in the bin and mixed in dry leaves.",
      "After two months, the scraps turned into dark, soft soil. The class used it in the school garden, and their tomato plants grew big and strong.",
    ],
    vocab: [
      ["compost", "to let food scraps turn into soil", "compostar: dejar que los restos de comida se conviertan en tierra"],
      ["scraps", "small pieces of food that are left over", "restos: pedacitos de comida que sobran"],
      ["soil", "the dirt that plants grow in", "tierra: lo que usan las plantas para crecer"],
    ],
    plan: ["The problem", "What they did", "What happened"],
    frames: {
      full: [
        "Room 12 noticed that ___.",
        "They ___ and every day they ___.",
        "After two months, ___, and the class used it ___.",
      ],
      light: ["The problem was ___.", "They ___.", "At the end, ___."],
    },
    criteria: [
      "I tell the problem, what the students did, and what happened.",
      "I use the words compost, scraps and soil.",
      "I tell the events in the same order as the story.",
      "I speak in complete sentences.",
    ],
    model: {
      name: "Kofi",
      line: "Room 12 saw that the lunchroom threw away a lot of fruit scraps. They made a compost bin and put the scraps and dry leaves in it every day. After two months, the scraps turned into soil, and they used it to help the tomatoes in the garden grow.",
    },
  },
];

/**
 * Minimal pairs for sounds Spanish speakers often find close. Each word has a short meaning so the choice is about
 * meaning, not spelling alone. `es` is a Spanish hint for the sound (how to make it), never the answer.
 */
export const SOUND_SETS = [
  {
    id: "sh-ch",
    title: "sh or ch?",
    titleEs: "¿sh o ch?",
    tip: [
      "For sh, keep your tongue still and let air flow like “shhh”. For ch, start with your tongue touching, then let go fast.",
      "Para sh, deja la lengua quieta y deja salir el aire como “shhh”. Para ch, empieza con la lengua tocando el paladar y suéltala rápido.",
    ],
    pairs: [
      ["ship", "a big boat", "chip", "a small thin piece"],
      ["shoes", "you wear them on your feet", "choose", "to pick one"],
      ["wash", "to clean with water", "watch", "to look at something"],
      ["share", "to give part to others", "chair", "a seat"],
      ["cash", "money in bills and coins", "catch", "to take something in the air"],
    ],
  },
  {
    id: "ee-i",
    title: "long ee or short i?",
    titleEs: "¿ee larga o i corta?",
    tip: [
      "For ee, smile and hold the sound longer. For i, relax your mouth and make it short.",
      "Para ee, sonríe y alarga el sonido. Para i, relaja la boca y hazlo corto.",
    ],
    pairs: [
      ["sheep", "a farm animal with wool", "ship", "a big boat"],
      ["leave", "to go away", "live", "to have your home somewhere"],
      ["seat", "a place to sit", "sit", "to rest on a chair"],
      ["feel", "to touch or sense", "fill", "to make full"],
      ["heat", "warmth", "hit", "to strike"],
    ],
  },
  {
    id: "b-v",
    title: "b or v?",
    titleEs: "¿b o v?",
    tip: [
      "For b, close both lips, then open them. For v, touch your top teeth to your bottom lip and buzz.",
      "Para b, cierra los dos labios y ábrelos. Para v, toca el labio de abajo con los dientes de arriba y haz vibrar el sonido.",
    ],
    pairs: [
      ["berry", "a small fruit", "very", "a lot"],
      ["boat", "it floats on water", "vote", "to choose in an election"],
      ["best", "better than all others", "vest", "a jacket with no sleeves"],
      ["bowl", "a dish for soup", "vole", "a small animal like a mouse"],
    ],
  },
  {
    id: "final-sounds",
    title: "Endings: -ed and -s",
    titleEs: "Terminaciones: -ed y -s",
    tip: [
      "Say the last sound clearly. In walked you hear a small t at the end; in cats you hear an s.",
      "Di claramente el último sonido. En walked se oye una t pequeña al final; en cats se oye una s.",
    ],
    pairs: [
      ["walk", "to move on foot now", "walked", "moved on foot before"],
      ["ask", "to say a question now", "asked", "said a question before"],
      ["cat", "one small pet that meows", "cats", "two or more small pets that meow"],
      ["test", "one quiz", "tests", "two or more quizzes"],
      ["play", "to have fun now", "played", "had fun before"],
    ],
  },
  {
    id: "y-j",
    title: "y or j?",
    titleEs: "¿y o j?",
    tip: [
      "For y, your tongue does not touch the roof of your mouth. For j, it touches first, like in “jump”.",
      "Para y, la lengua no toca el paladar. Para j, primero toca, como en “jump”.",
    ],
    pairs: [
      ["yes", "the opposite of no", "Jess", "a name"],
      ["yet", "until now", "jet", "a fast airplane"],
      ["year", "twelve months", "jeer", "to laugh at someone in a mean way"],
      ["yolk", "the yellow part of an egg", "joke", "something funny"],
    ],
  },
];

/** Shadowing lines: short academic sentences, in sets by band. */
export const SHADOW_SETS = [
  {
    id: "sh-68",
    band: "6-8",
    title: "Explaining in science",
    titleEs: "Explicar en ciencias",
    lines: [
      "The plant grew taller because it had more light.",
      "First, we measured the water. Then, we recorded the temperature.",
      "I agree with your idea, and I would like to add one more reason.",
      "The data show that the warmer cup melted the ice faster.",
      "In my opinion, the city should build the park near the school.",
    ],
  },
  {
    id: "sh-35",
    band: "3-5",
    title: "Talking about my day",
    titleEs: "Hablar de mi día",
    lines: [
      "In the morning, I eat breakfast with my family.",
      "My favorite subject is science because we do experiments.",
      "Can you please say that again?",
      "The frog lays eggs in the water.",
      "First, I read the question. Then, I look for clues.",
    ],
  },
];

/** Oral reading passages (original). Read aloud; the learner sees only the words they read. */
export const READ_ALOUD = [
  {
    id: "ra-tides",
    band: "6-8",
    title: "The Moon and the Tides",
    titleEs: "La Luna y las mareas",
    text: "Twice a day, the ocean creeps up the beach and then slides back. These changes are called tides. The Moon causes them. Its gravity pulls on the ocean and makes the water bulge toward it. As Earth spins, different beaches pass under the bulge, so the water rises and falls. People who fish and sail check the tide tables before they leave the harbor.",
  },
  {
    id: "ra-maps",
    band: "6-8",
    title: "Reading an Old Map",
    titleEs: "Leer un mapa antiguo",
    text: "Old maps tell us what people knew and what they guessed. Some maps from long ago show sea monsters in places sailors had never visited. Others leave large spaces empty. Mapmakers today use satellites, so their maps are much more exact. Still, an old map can show us how explorers saw the world.",
  },
  {
    id: "ra-seeds",
    band: "3-5",
    title: "Seeds on the Move",
    titleEs: "Semillas en movimiento",
    text: "Plants cannot walk, but their seeds can travel. Some seeds have wings and spin in the wind. Some seeds float on water. Other seeds stick to the fur of animals and ride to a new place. When a seed lands in good soil, it can grow into a new plant.",
  },
  {
    id: "ra-library",
    band: "3-5",
    title: "Our School Library",
    titleEs: "La biblioteca de la escuela",
    text: "Our school library is a quiet place to read. There are books about animals, space and sports. Ms. Rivera helps us find books that are just right for us. We can take two books home each week. I like to read on the soft rug by the window.",
  },
];

/** Keyboarding warm-up frames (grades 4-8). Accuracy only: no clock, no speed. */
export const KEY_FRAMES = [
  {
    id: "kb-opinion",
    title: "Opinion frames",
    titleEs: "Marcos de opinión",
    frames: [
      "In my opinion, the school day should start later.",
      "I think this is true because the data show a change.",
      "One reason is that students need more sleep.",
      "For example, the chart shows that the results improved.",
      "In conclusion, the evidence supports my claim.",
    ],
  },
  {
    id: "kb-compare",
    title: "Compare and explain",
    titleEs: "Comparar y explicar",
    frames: [
      "Both plants grew, but the first one grew faster.",
      "The first cup was warmer than the second cup.",
      "Unlike the square, the triangle did not change shape.",
      "As a result, the ice melted in ten minutes.",
      "This happened because the sun heated the water.",
    ],
  },
  {
    id: "kb-narrate",
    title: "Tell what happened",
    titleEs: "Contar lo que pasó",
    frames: [
      "First, the class planted four bean seeds.",
      "Next, we put two cups near the window.",
      "After a week, we measured each stem with a ruler.",
      "Finally, we wrote what we found in our notebooks.",
      "The next day, we shared our results with the class.",
    ],
  },
  // Grades 4-5 warm-ups, one set per support level of the Writing room (A, B, C). Frames grow from notes about
  // what happened to opinion paragraphs to science claims, so typing practice matches the writing task.
  {
    id: "kb-g45-a",
    band: "3-5",
    level: "A",
    title: "Grades 4-5: Plant notes",
    titleEs: "Grados 4 y 5: Notas sobre una planta",
    frames: [
      "First, I put a seed in the soil.",
      "Then I gave the plant some water.",
      "The plant grew taller each week.",
      "I think the plant needs sunlight.",
      "Finally, we wrote what we saw.",
    ],
  },
  {
    id: "kb-g45-b",
    band: "3-5",
    level: "B",
    title: "Grades 4-5: Opinion paragraph",
    titleEs: "Grados 4 y 5: Párrafo de opinión",
    frames: [
      "In my opinion, our class should have a garden.",
      "One reason is that plants help us learn science.",
      "For example, we can measure how tall they grow.",
      "However, some people think it takes too much time.",
      "For these reasons, I believe a garden is a good idea.",
    ],
  },
  {
    id: "kb-g45-c",
    band: "3-5",
    level: "C",
    title: "Grades 4-5: Science claims",
    titleEs: "Grados 4 y 5: Afirmaciones de ciencias",
    frames: [
      "The data show that the bean grew fastest in the sunny window.",
      "This evidence supports my claim because the numbers are different.",
      "Although both plants had water, only one had enough light.",
      "As a result, the plant in the shade grew four centimeters less.",
      "Therefore, we should repeat the test to be sure of the result.",
    ],
  },
];

/** The keyboarding warm-up that matches a band's Writing support level (null when the band has none). */
export const keyWarmupFor = (band, level) =>
  KEY_FRAMES.find((s) => s.band === band && s.level === level) || null;

export const forBand = (list, band) => list.filter((x) => !x.band || x.band === band);
