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

/** Listen-then-speak and read-then-speak retell tasks. `turns` are spoken by read-aloud; `text` is read on screen. */
export const RETELLS = [
  {
    id: "water-filter",
    band: "6-8",
    mode: "listen",
    title: "How a Water Filter Works",
    titleEs: "Cómo funciona un filtro de agua",
    prompt:
      "Retell how the class's water filter works. Say what each layer does, in order, and what the class found.",
    turns: [
      "Today we built a water filter in a plastic bottle. We put three layers inside: gravel on top, sand in the middle, and charcoal at the bottom.",
      "When we poured muddy water in, the gravel caught the leaves and small sticks first. Then the sand trapped the tiny bits of dirt. Last, the charcoal took away the bad smell.",
      "The water that came out was much clearer. But remember: clear water is not always safe water. Germs are too small to see, so we would still need to boil it before drinking.",
    ],
    plan: ["The layers", "What each layer did", "What the class found"],
    model: {
      name: "Rafael",
      line: "The class built a water filter with three layers. First, the gravel caught leaves and sticks. Next, the sand trapped tiny bits of dirt. Last, the charcoal took away the smell. The water came out clearer, but it was not safe yet, because germs are too small to see, so you would still have to boil it.",
    },
  },
  {
    id: "bridge-triangles",
    band: "6-8",
    mode: "read",
    title: "Why Bridges Use Triangles",
    titleEs: "Por qué los puentes usan triángulos",
    prompt: "Retell the main idea of the article and the two reasons it gives.",
    text: [
      "Look closely at an old railroad bridge and you will see triangles everywhere. Engineers use triangles because they are the strongest simple shape.",
      "A square can be pushed into a diamond shape when a heavy load presses on one corner. A triangle cannot change its shape unless one of its sides breaks or bends. That is why builders call it a rigid shape.",
      "Triangles also spread the weight. When a train rolls across, each triangle passes the push along its sides to the next triangle, so no single beam carries the whole load.",
    ],
    plan: ["Main idea", "Reason 1", "Reason 2"],
    model: {
      name: "Yasmin",
      line: "The article explains that bridges use triangles because they are the strongest simple shape. The first reason is that a triangle cannot change its shape unless a side breaks, but a square can be pushed into a diamond. The second reason is that triangles spread the weight from one triangle to the next, so no single beam carries the whole train.",
    },
  },
  {
    id: "bees-flowers",
    band: "3-5",
    mode: "listen",
    title: "How Bees Help Flowers",
    titleEs: "Cómo ayudan las abejas a las flores",
    prompt: "Retell how bees help flowers. Tell what happens first, next and last.",
    turns: [
      "A bee lands on a flower to drink a sweet juice called nectar.",
      "While the bee drinks, yellow dust called pollen sticks to its fuzzy legs. Then the bee flies to another flower, and some pollen falls off there.",
      "That pollen helps the second flower make seeds. So bees get food, and flowers get help making new plants.",
    ],
    plan: ["First", "Next", "Last"],
    model: {
      name: "Amina",
      line: "First, a bee lands on a flower to drink nectar. Next, pollen sticks to its legs, and it carries the pollen to another flower. Last, the pollen helps that flower make seeds, so new plants can grow.",
    },
  },
  {
    id: "compost-bin",
    band: "3-5",
    mode: "read",
    title: "The Lunchroom Compost Bin",
    titleEs: "El contenedor de compost del comedor",
    prompt: "Retell what the students did with their food scraps and why.",
    text: [
      "Room 12 noticed that the lunchroom threw away many apple cores and banana peels every day.",
      "The students set up a compost bin next to the trash cans. Every day after lunch, they put the fruit scraps in the bin and mixed in dry leaves.",
      "After two months, the scraps turned into dark, soft soil. The class used it in the school garden, and their tomato plants grew big and strong.",
    ],
    plan: ["The problem", "What they did", "What happened"],
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
