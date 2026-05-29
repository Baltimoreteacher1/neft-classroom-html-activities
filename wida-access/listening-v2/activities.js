/* ============================================================
   WIDA ACCESS Listening Practice Studio — Activity Bank
   Neft Teacher · Grade 6 academic English (math / science / general)
   Audience: English learners. Levels: 1 (support) and 2 (enrichment).
   No audio files — all passages are synthesized at runtime via
   window.speechSynthesis. Every item carries the spoken `script`
   text so it can ALSO be shown for accessibility / no-speech fallback.

   Each item shape (by type):
   - listen-choose : {script, question, choices[], answer}
   - follow-directions: {script, steps[], items[], expectedOrder[]}
   - sequence : {script, events[]}  (events given in CORRECT order)
   - main-detail : {script, mainQ, mainChoices[], mainAnswer,
                    detailQ, detailChoices[], detailAnswer}
   - vocab : {word, script, question, choices[], answer}
   - label : {script, scene, parts[]}  (parts: {id,label,correctSlot})
   ============================================================ */

const LISTENING_TYPES = [
  {
    id: "listen-choose",
    icon: "🎧",
    title: "Listen & Choose",
    blurb:
      "Hear a short academic passage, then answer comprehension questions.",
  },
  {
    id: "follow-directions",
    icon: "🧭",
    title: "Follow Directions",
    blurb: "Hear step-by-step instructions, then carry them out in order.",
  },
  {
    id: "sequence",
    icon: "🔢",
    title: "Sequence the Steps",
    blurb: "Hear a process or story, then put the events in the right order.",
  },
  {
    id: "main-detail",
    icon: "💡",
    title: "Main Idea vs. Detail",
    blurb: "Hear a passage, then pick the main idea and a supporting detail.",
  },
  {
    id: "vocab",
    icon: "📖",
    title: "Academic Vocabulary",
    blurb: "Hear a sentence using a target word, then choose its meaning.",
  },
  {
    id: "label",
    icon: "🏷️",
    title: "Listen & Label",
    blurb: "Hear descriptions, then drag labels onto a diagram.",
  },
];

/* Activity bank: keyed by type, each holds level 1 and level 2 arrays. */
const ACTIVITIES = {
  /* ───────────────────────── 1. LISTEN & CHOOSE ───────────────────────── */
  "listen-choose": {
    1: [
      {
        title: "The Class Garden",
        topic: "Science",
        script:
          "Our class has a small garden. We planted three kinds of seeds. The bean seeds grew the fastest. They needed water and sunlight every day.",
        question: "Which seeds grew the fastest?",
        choices: ["The bean seeds", "The corn seeds", "The flower seeds"],
        answer: 0,
        hint: 'Listen for the word "fastest."',
      },
      {
        title: "Counting Coins",
        topic: "Math",
        script:
          "Maria has four dimes and one nickel. A dime is worth ten cents. A nickel is worth five cents. She wants to buy a pencil that costs forty cents.",
        question: "How much money does Maria have in dimes?",
        choices: ["Twenty cents", "Forty cents", "Fifty cents"],
        answer: 1,
        hint: "Four dimes, and each dime is ten cents.",
      },
    ],
    2: [
      {
        title: "How Water Changes State",
        topic: "Science",
        script:
          "Water can exist in three states: solid, liquid, and gas. When ice absorbs heat energy, it melts into liquid water. If that water keeps absorbing heat, it eventually evaporates and becomes water vapor, a gas. The amount of water stays the same; only its state changes.",
        question:
          "According to the passage, what happens to the amount of water when ice melts and then evaporates?",
        choices: [
          "The amount of water increases",
          "The amount of water stays the same",
          "The amount of water disappears completely",
        ],
        answer: 1,
        hint: "The last sentence tells you what stays the same.",
      },
      {
        title: "Comparing Data Sets",
        topic: "Math",
        script:
          "A scientist measured the daily high temperature for two cities over one week. City A had a higher mean temperature, but its values were spread far apart. City B had a lower mean, yet its temperatures were clustered close together. We say City B's data has less variability.",
        question: "What does the passage say about City B's data?",
        choices: [
          "It has a higher mean than City A",
          "Its values are spread far apart",
          "Its values are clustered together with less variability",
        ],
        answer: 2,
        hint: '"Variability" describes how spread out the data is.',
      },
    ],
  },

  /* ───────────────────────── 2. FOLLOW DIRECTIONS ───────────────────────── */
  "follow-directions": {
    1: [
      {
        title: "Arrange the Shapes",
        topic: "Math",
        script:
          "Listen and put the shapes in order. First, click the circle. Next, click the square. Then, click the triangle.",
        prompt: "Click the shapes in the order you heard them.",
        items: [
          { id: "circle", label: "● Circle" },
          { id: "square", label: "■ Square" },
          { id: "triangle", label: "▲ Triangle" },
        ],
        expectedOrder: ["circle", "square", "triangle"],
      },
      {
        title: "Pack the Backpack",
        topic: "General",
        script:
          "Get ready for school. First, click the book. Next, click the pencil. Then, click the water bottle.",
        prompt: "Click the items in the order you heard them.",
        items: [
          { id: "book", label: "📕 Book" },
          { id: "pencil", label: "✏️ Pencil" },
          { id: "water", label: "🚰 Water bottle" },
        ],
        expectedOrder: ["book", "pencil", "water"],
      },
    ],
    2: [
      {
        title: "Set Up the Experiment",
        topic: "Science",
        script:
          "Follow the lab procedure in order. First, select the beaker so you have a container. Next, select the thermometer to measure temperature. After that, select the stopwatch to record time. Finally, select the notebook to write your observations.",
        prompt:
          "Select the lab tools in the exact order the directions describe.",
        items: [
          { id: "notebook", label: "📓 Notebook" },
          { id: "thermometer", label: "🌡️ Thermometer" },
          { id: "beaker", label: "🧪 Beaker" },
          { id: "stopwatch", label: "⏱️ Stopwatch" },
        ],
        expectedOrder: ["beaker", "thermometer", "stopwatch", "notebook"],
      },
      {
        title: "Plot the Point",
        topic: "Math",
        script:
          "Carry out these graphing steps in order. Begin by selecting the x-axis, the horizontal line. Then select the y-axis, the vertical line. Next, select the origin where they meet. Last, select the point labeled A in the first quadrant.",
        prompt: "Select each part of the coordinate plane in order.",
        items: [
          { id: "origin", label: "⊙ Origin (0,0)" },
          { id: "xaxis", label: "↔ X-axis" },
          { id: "pointA", label: "📍 Point A" },
          { id: "yaxis", label: "↕ Y-axis" },
        ],
        expectedOrder: ["xaxis", "yaxis", "origin", "pointA"],
      },
    ],
  },

  /* ───────────────────────── 3. SEQUENCE THE STEPS ───────────────────────── */
  sequence: {
    1: [
      {
        title: "A Plant Grows",
        topic: "Science",
        script:
          "Listen to how a plant grows. First, you put a seed in the soil. Next, you give it water. Then, a small sprout comes up. Last, the plant grows leaves.",
        events: [
          "Put a seed in the soil",
          "Give the seed water",
          "A small sprout comes up",
          "The plant grows leaves",
        ],
      },
      {
        title: "Solve a Simple Problem",
        topic: "Math",
        script:
          "Listen to how to add two numbers. First, read the problem. Next, line up the numbers. Then, add them together. Last, write the answer.",
        events: [
          "Read the problem",
          "Line up the numbers",
          "Add them together",
          "Write the answer",
        ],
      },
    ],
    2: [
      {
        title: "The Water Cycle",
        topic: "Science",
        script:
          "Listen to the stages of the water cycle. First, the sun heats water in oceans and lakes, and it evaporates into vapor. Next, the vapor rises and cools, condensing into tiny droplets that form clouds. Then, the droplets combine until they are heavy and fall as precipitation. Finally, the water collects in rivers and flows back to the ocean, where the cycle begins again.",
        events: [
          "The sun heats water and it evaporates",
          "Vapor cools and condenses into clouds",
          "Droplets fall as precipitation",
          "Water collects and flows back to the ocean",
        ],
      },
      {
        title: "Conducting a Survey",
        topic: "Math",
        script:
          "Listen to the steps for running a statistical survey. First, you write a clear question that you want to investigate. Next, you collect responses from a representative sample of people. After that, you organize the data into a table or chart. Then you calculate measures such as the mean and the range. Finally, you interpret the results and draw a conclusion.",
        events: [
          "Write a clear investigation question",
          "Collect responses from a sample",
          "Organize the data into a table or chart",
          "Calculate the mean and the range",
          "Interpret the results and draw a conclusion",
        ],
      },
    ],
  },

  /* ───────────────────────── 4. MAIN IDEA vs DETAIL ───────────────────────── */
  "main-detail": {
    1: [
      {
        title: "Bees Help Plants",
        topic: "Science",
        script:
          "Bees are very important helpers. They fly from flower to flower. When they do this, they move pollen. This pollen helps new plants grow.",
        mainQ: "What is the main idea?",
        mainChoices: [
          "Bees are important helpers for plants",
          "Bees can fly very fast",
          "Flowers are many colors",
        ],
        mainAnswer: 0,
        detailQ: "Which detail supports the main idea?",
        detailChoices: [
          "Bees move pollen from flower to flower",
          "Bees live in many countries",
          "Bees are small insects",
        ],
        detailAnswer: 0,
      },
      {
        title: "Shapes Are Everywhere",
        topic: "Math",
        script:
          "Shapes are all around us. A clock is a circle. A window can be a square. A slice of pizza looks like a triangle. We can find shapes everywhere we look.",
        mainQ: "What is the main idea?",
        mainChoices: [
          "We can find shapes everywhere",
          "Pizza tastes very good",
          "Clocks tell us the time",
        ],
        mainAnswer: 0,
        detailQ: "Which detail supports the main idea?",
        detailChoices: [
          "A window can be a square",
          "Clocks are usually round",
          "People eat pizza for lunch",
        ],
        detailAnswer: 0,
      },
    ],
    2: [
      {
        title: "Why Recycling Matters",
        topic: "Science",
        script:
          "Recycling reduces the strain humans place on the environment. When we recycle paper, metal, and plastic, factories need fewer raw materials, so fewer forests are cut and less mining is required. Recycling also saves energy, because making a product from recycled material usually uses less power than making it from scratch.",
        mainQ: "What is the main idea of the passage?",
        mainChoices: [
          "Recycling reduces the strain humans place on the environment",
          "Factories make many products",
          "Paper comes from trees",
        ],
        mainAnswer: 0,
        detailQ: "Which detail best supports the main idea?",
        detailChoices: [
          "Making a product from recycled material usually uses less energy",
          "Plastic can be many colors",
          "People throw away trash every day",
        ],
        detailAnswer: 0,
      },
      {
        title: "Understanding Ratios",
        topic: "Math",
        script:
          "A ratio is a powerful tool for comparing two quantities. For example, if a recipe uses two cups of flour for every one cup of sugar, the ratio of flour to sugar is two to one. Ratios let us scale recipes up or down while keeping the same taste, because the relationship between the ingredients stays constant.",
        mainQ: "What is the main idea of the passage?",
        mainChoices: [
          "A ratio is a tool for comparing two quantities",
          "Recipes need flour and sugar",
          "Cooking is a fun activity",
        ],
        mainAnswer: 0,
        detailQ: "Which detail best supports the main idea?",
        detailChoices: [
          "The ratio of flour to sugar can be two to one",
          "Sugar tastes sweet",
          "Bakers work in the morning",
        ],
        detailAnswer: 0,
      },
    ],
  },

  /* ───────────────────────── 5. ACADEMIC VOCABULARY ───────────────────────── */
  vocab: {
    1: [
      {
        word: "estimate",
        topic: "Math",
        script:
          "The word is estimate. Listen to the sentence. We did not count every jelly bean, so we made an estimate of about one hundred.",
        question: 'In this sentence, what does "estimate" mean?',
        choices: [
          "A close guess about an amount",
          "The exact correct number",
          "A type of candy",
        ],
        answer: 0,
        hint: "They did NOT count every one.",
      },
      {
        word: "observe",
        topic: "Science",
        script:
          "The word is observe. Listen to the sentence. The students used a magnifying glass to observe the tiny ant up close.",
        question: 'In this sentence, what does "observe" mean?',
        choices: [
          "To watch or look at carefully",
          "To run away from",
          "To draw a picture",
        ],
        answer: 0,
        hint: "They used a magnifying glass to look closely.",
      },
    ],
    2: [
      {
        word: "analyze",
        topic: "Math",
        script:
          "The word is analyze. Listen to the sentence. After collecting the test scores, the team had to analyze the data by breaking it into parts to find patterns and trends.",
        question: 'In this sentence, what does "analyze" mean?',
        choices: [
          "To examine something carefully by breaking it into parts",
          "To quickly throw away",
          "To memorize a list",
        ],
        answer: 0,
        hint: 'Notice the phrase "breaking it into parts to find patterns."',
      },
      {
        word: "adapt",
        topic: "Science",
        script:
          "The word is adapt. Listen to the sentence. Animals in the desert have learned to adapt by changing their behavior so they can survive the extreme heat.",
        question: 'In this sentence, what does "adapt" mean?',
        choices: [
          "To change in order to survive in an environment",
          "To sleep all day",
          "To eat more food",
        ],
        answer: 0,
        hint: 'Notice "changing their behavior so they can survive."',
      },
    ],
  },

  /* ───────────────────────── 6. LISTEN & LABEL ───────────────────────── */
  label: {
    1: [
      {
        title: "Label the Plant",
        topic: "Science",
        scene: "plant",
        script:
          "Listen and label the plant. The roots are at the bottom, under the ground. The stem is in the middle. The leaf is the green part near the top. The flower is at the very top.",
        parts: [
          { id: "flower", label: "Flower", slot: "top" },
          { id: "leaf", label: "Leaf", slot: "upper" },
          { id: "stem", label: "Stem", slot: "middle" },
          { id: "roots", label: "Roots", slot: "bottom" },
        ],
      },
      {
        title: "Label the Shape",
        topic: "Math",
        scene: "triangle",
        script:
          "Listen and label the triangle. The top point is called the apex. The flat line at the bottom is called the base. The slanted line on the side is called a side.",
        parts: [
          { id: "apex", label: "Apex", slot: "top" },
          { id: "side", label: "Side", slot: "left" },
          { id: "base", label: "Base", slot: "bottom" },
        ],
      },
    ],
    2: [
      {
        title: "Label the Water Cycle",
        topic: "Science",
        scene: "watercycle",
        script:
          "Listen and label the water cycle diagram. Evaporation happens at the bottom left, where the sun heats the ocean and water rises. Condensation happens at the top, where the cloud forms. Precipitation is on the right side, where rain falls from the cloud. Collection is at the bottom right, where water gathers in the lake.",
        parts: [
          { id: "condensation", label: "Condensation", slot: "top" },
          { id: "evaporation", label: "Evaporation", slot: "left" },
          { id: "precipitation", label: "Precipitation", slot: "right" },
          { id: "collection", label: "Collection", slot: "bottom" },
        ],
      },
      {
        title: "Label the Coordinate Plane",
        topic: "Math",
        scene: "coordinate",
        script:
          "Listen and label the coordinate plane. The origin is in the center, where the lines cross at zero. The x-axis is the horizontal line going left and right. The y-axis is the vertical line going up and down. Quadrant one is the upper right region, where both numbers are positive.",
        parts: [
          { id: "yaxis", label: "Y-axis", slot: "top" },
          { id: "xaxis", label: "X-axis", slot: "right" },
          { id: "origin", label: "Origin", slot: "center" },
          { id: "quadrant1", label: "Quadrant I", slot: "upperright" },
        ],
      },
    ],
  },
};
