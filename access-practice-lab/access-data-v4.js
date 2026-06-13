/* =============================================================================
 * access-data-v4.js — ACCESS Practice Lab v4.0 content module.
 *
 * Adds, on top of the base + v3 data:
 *   • window.ACCESS_LAB_V4.tests          → 4 domain-specific WIDA-style practice
 *       tests rebuilt to mirror the Gr. 6-8 WIDA ACCESS practice forms
 *       (Listening: "Leon the Chef"; Reading: "Math in the Garden"; Speaking:
 *       "Life in the New World"; Writing: "Favorite Classes"). They reuse the
 *       existing Test Mode engine (sections → items → scored WIDA report).
 *   • window.ACCESS_LAB_V4.appendActivities → one printable worksheet per domain
 *       (type "worksheet") plus form-style practice.
 *
 * Provenance: items adapt the user's own copies of Gr. 6-8 WIDA ACCESS practice
 * forms. Illustrations are represented with simple emoji rather than copying the
 * originals' images. Listening narration is authored to match the questions
 * (the original audio is not part of the form export).
 * ========================================================================== */
window.ACCESS_LAB_V4 = (function () {
  // Authored biography narration for the Listening test (read aloud / TTS).
  const LEON_STORY = [
    "Leon grew up watching his mother cook in their small kitchen. He learned to cook by helping her every single day.",
    "When Leon got older, he took a job washing dishes at a busy restaurant. But Leon did not want to wash dishes forever — he wanted to become a cook.",
    "To show the head chef how hard he could work, Leon began cooking the food that was going to waste in the restaurant.",
    "The head chef noticed Leon's hard work. Leon also paid close attention to how the other chefs treated him.",
    "Leon worked so hard that he earned a scholarship to go to cooking school. After school, Leon opened his very own Mexican restaurant.",
    "Soon, people from all over the world came to try his cooking. Even though Leon loved being a chef, he loved his family even more.",
  ];
  const leonPassage = ["Biography: The Story of Leon the Chef", ...LEON_STORY];

  function leonItem(n, prompt, options, answer, correct, hint) {
    return {
      id: `wl-${n}`,
      title: `Question ${n}`,
      skill: "Listening for key details in a biography",
      type: "multipleChoice",
      passageTitle: "Biography: The Story of Leon the Chef",
      passage: LEON_STORY,
      adminScript: `${LEON_STORY.join(" ")} ... ${prompt}`,
      prompt,
      options,
      answer,
      correct,
      hint,
      support:
        "Listen for the part of the story that matches the question, then choose the best answer.",
    };
  }

  const listeningTest = {
    id: "wida-listening-leon",
    domain: "Listening",
    title: "WIDA Practice Test — Listening: The Story of Leon the Chef",
    gradeCluster: "Grades 6-8",
    tier: "WIDA-style model practice",
    overview:
      "Listen to a short biography about Leon, a boy who became a chef. Look at the pictures, then choose the best answer. You can press play to hear each question more than once.",
    sections: [
      {
        domain: "Listening",
        title: "Biography: The Story of Leon the Chef",
        directions:
          "You will listen to a biography in English. First, read and listen to the directions. Then listen and look at the pictures to help you. Choose one answer for each question. You may listen more than once.",
        estMinutes: 12,
        items: [
          leonItem(
            1,
            "How did Leon first learn to cook?",
            [
              { id: "a", text: "He learned from his mother.", visual: "👩‍🍳" },
              {
                id: "b",
                text: "He learned from watching television.",
                visual: "📺",
              },
              { id: "c", text: "He learned from reading books.", visual: "📖" },
            ],
            "a",
            "Correct — Leon learned to cook by helping his mother every day.",
            "Listen to the very beginning of the story.",
          ),
          leonItem(
            2,
            "Why did Leon take the job at the restaurant?",
            [
              {
                id: "a",
                text: "so that he could make more money",
                visual: "💵",
              },
              {
                id: "b",
                text: "so that he could become a cook at the restaurant",
                visual: "👨‍🍳",
              },
              {
                id: "c",
                text: "so that he could make his mother proud",
                visual: "🙂",
              },
            ],
            "b",
            "Correct — Leon wanted to become a cook, not wash dishes forever.",
            "What did Leon really want to become?",
          ),
          leonItem(
            3,
            "Why did Leon start cooking the food that was going to waste?",
            [
              {
                id: "a",
                text: "to use all the food that was going to waste in the restaurant",
                visual: "🥕",
              },
              {
                id: "b",
                text: "to show his mother that he was a hard worker",
                visual: "👩",
              },
              {
                id: "c",
                text: "to prove to the chef how much he wanted to be a cook",
                visual: "🍳",
              },
            ],
            "c",
            "Correct — he wanted to prove to the head chef how much he wanted to cook.",
            "Who was Leon trying to impress?",
          ),
          leonItem(
            4,
            "What did Leon pay attention to at the restaurant?",
            [
              {
                id: "a",
                text: "how the other chefs acted toward him",
                visual: "👀",
              },
              { id: "b", text: "the head chef did not like him", visual: "🙁" },
              { id: "c", text: "he was not a very good cook", visual: "❌" },
            ],
            "a",
            "Correct — Leon noticed how the other chefs treated him.",
            "Listen for what Leon watched closely.",
          ),
          leonItem(
            5,
            "How was Leon able to go to cooking school?",
            [
              {
                id: "a",
                text: "the head chef at his restaurant paid for him",
                visual: "🧑‍🍳",
              },
              { id: "b", text: "he received a scholarship", visual: "🎓" },
              {
                id: "c",
                text: "he used the money he made washing dishes",
                visual: "🧽",
              },
            ],
            "b",
            "Correct — Leon earned a scholarship to cooking school.",
            "Listen for how Leon paid for school.",
          ),
          leonItem(
            6,
            "What kind of restaurant did Leon open?",
            [
              { id: "a", text: "the Portuguese restaurant", visual: "🇵🇹" },
              { id: "b", text: "the Mexican restaurant", visual: "🌮" },
              { id: "c", text: "the French restaurant", visual: "🥐" },
            ],
            "b",
            "Correct — Leon opened his own Mexican restaurant.",
            "Listen for the kind of food Leon's restaurant served.",
          ),
          leonItem(
            7,
            "How did Leon know his restaurant was successful?",
            [
              {
                id: "a",
                text: "people from all over the world came to try his cooking",
                visual: "🌎",
              },
              { id: "b", text: "his dreams were coming true", visual: "✨" },
              {
                id: "c",
                text: "Leon was excited to come to work each day",
                visual: "😄",
              },
            ],
            "a",
            "Correct — people came from all over the world to taste his food.",
            "Listen for who came to the restaurant.",
          ),
          leonItem(
            8,
            "What does the end of the story tell us about Leon?",
            [
              {
                id: "a",
                text: "he does not care about his family",
                visual: "🚫",
              },
              {
                id: "b",
                text: "he loved his family more than he loved his job",
                visual: "❤️",
              },
              { id: "c", text: "he misses being a head chef", visual: "😢" },
            ],
            "b",
            "Correct — Leon loved his family even more than being a chef.",
            "Listen to the last sentence of the story.",
          ),
        ],
      },
    ],
  };

  // ── Reading: Math in the Garden (Jayda) — verbatim passages + questions ──
  const readingTest = {
    id: "wida-reading-garden",
    domain: "Reading",
    title: "WIDA Practice Test — Reading: Math in the Garden",
    gradeCluster: "Grades 6-8",
    tier: "WIDA-style model practice",
    overview:
      "Read about Jayda as she uses math to plan a garden in her grandma's backyard. Read each part, then choose the best answer.",
    sections: [
      {
        domain: "Reading",
        title: "Math in the Garden",
        directions:
          "You will take a reading test in English. First, read each part of the story. Then answer the question by choosing the best answer. Read carefully — you can read each part more than once.",
        estMinutes: 18,
        items: [
          {
            id: "wr-1",
            title: "A garden in the backyard",
            type: "multipleChoice",
            passageTitle: "Math in the Garden",
            passage: [
              "This is Jayda. She is going to make a garden in her grandma's backyard.",
            ],
            prompt: "Which picture shows a garden?",
            options: [
              { id: "a", text: "a swimming pool", visual: "🏊" },
              {
                id: "b",
                text: "rows of plants someone is watering",
                visual: "🌱",
              },
              { id: "c", text: "a candy shop", visual: "🍬" },
            ],
            answer: "b",
            correct: "Correct — a garden has plants growing in the ground.",
            hint: "Where do fruits and vegetables grow?",
          },
          {
            id: "wr-2",
            title: "The shape of the garden",
            type: "multipleChoice",
            passage: [
              "Jayda is going to plant flowers, fruits, and vegetables. First she must decide how big to make her garden. She uses string to plan how long and wide it will be. She decides to make it in the shape of a rectangle so she can plant the most flowers, fruits, and vegetables.",
            ],
            prompt:
              "Which picture shows the shape that Jayda plans to make the garden?",
            options: [
              { id: "a", text: "a rectangle", visual: "▭" },
              { id: "b", text: "a circle", visual: "⭕" },
              { id: "c", text: "a triangle", visual: "🔺" },
            ],
            answer: "a",
            correct: "Correct — Jayda plans a rectangle.",
            hint: "Reread the last sentence of the part above.",
          },
          {
            id: "wr-3",
            title: "Inside the shape",
            type: "multipleChoice",
            passage: [
              "Next, Jayda needs to figure out how big the inside of the garden will be.",
            ],
            prompt:
              "If she is trying to figure out how big the inside of the shape is, what is this called?",
            options: [
              { id: "a", text: "circumference" },
              { id: "b", text: "perimeter" },
              { id: "c", text: "area" },
            ],
            answer: "c",
            correct: "Correct — the space inside a shape is the area.",
            hint: "Which word means the space inside a flat shape?",
          },
          {
            id: "wr-4",
            title: "Size of the garden",
            type: "multipleChoice",
            passage: [
              "Jayda has picked the shape for her garden and now she is figuring out the size. She decides to make it 7 feet long and 5 feet wide.",
            ],
            prompt:
              "Which equation shows how to solve for the size of the inside of the garden?",
            options: [
              { id: "a", text: "area: 5 × 7 = 35 feet squared" },
              { id: "b", text: "perimeter: 5 × 7 = 35 feet" },
              { id: "c", text: "volume: 5 × 7 = 35 feet cubed" },
            ],
            answer: "a",
            correct:
              "Correct — area = length × width, measured in square feet.",
            hint: "The inside of a flat shape is measured in square units.",
          },
          {
            id: "wr-5",
            title: "Buying seeds",
            type: "multipleChoice",
            passage: [
              "Jayda goes to the store to buy seeds. She has $30.00 to spend, and each bag of seeds costs $6.00. She needs to figure out how to split up her money equally on the seeds so that she does not have any money left over.",
            ],
            prompt: "Which key words tell you that this is a division problem?",
            options: [
              { id: "a", text: "figure out" },
              { id: "b", text: "each bag of seeds" },
              { id: "c", text: "split up equally" },
              { id: "d", text: "how much space" },
            ],
            answer: "c",
            correct: 'Correct — "split up equally" signals division.',
            hint: "Which words mean sharing into equal groups?",
          },
          {
            id: "wr-6",
            title: "Buying fertilizer",
            type: "multipleChoice",
            passage: [
              "Next, Jayda must figure out how much fertilizer she needs. She has to buy enough for her whole garden. Each bag of fertilizer covers 2 square feet of land.",
            ],
            prompt:
              "Which steps explain what Jayda has to figure out before buying fertilizer?",
            options: [
              {
                id: "a",
                text: "1. Find the area of her garden in square feet. 2. Divide the area by 2 square feet.",
              },
              {
                id: "b",
                text: "1. Count her money. 2. Divide the area of her garden by 2 square feet.",
              },
              {
                id: "c",
                text: "1. Find the perimeter of her garden. 2. Divide the area by 2 square feet.",
              },
            ],
            answer: "a",
            correct: "Correct — find the area, then divide by 2 sq ft per bag.",
            hint: "Fertilizer covers the inside (area) of the garden.",
          },
          {
            id: "wr-7",
            title: "Earning money for a fence",
            type: "multipleChoice",
            passage: [
              "Jayda wants to know if she can afford a $100 fence after one week of work. She works 5 days a week from 8:00 AM to 12:00 PM. She makes $8.50 per hour.",
            ],
            prompt:
              "Which equation could Jayda use to figure out if she makes enough money in one week to buy the fence?",
            options: [
              { id: "a", text: "5 × 3 × $8.50 =" },
              { id: "b", text: "5 × 4 × $8.50 =" },
              { id: "c", text: "5 × 8 × $8.50 =" },
              { id: "d", text: "5 × 12 × $8.50 =" },
            ],
            answer: "b",
            correct: "Correct — 8 AM to 12 PM is 4 hours, 5 days a week.",
            hint: "How many hours is 8:00 AM to 12:00 PM?",
          },
          {
            id: "wr-8",
            title: "Boxes of fence",
            type: "multipleChoice",
            passage: [
              "Jayda must figure out how many boxes of fence material she needs to surround her whole garden so animals can't get in. Her garden is a rectangle that is 7 ft × 5 ft. Each box contains 6 feet of fence material.",
            ],
            prompt:
              "Which answer choice shows the steps Jayda will follow to figure out how many boxes she needs?",
            options: [
              {
                id: "a",
                text: "1. (7 × 2) + (5 × 2) = perimeter  2. perimeter ÷ 6 feet per box",
              },
              {
                id: "b",
                text: "1. 7 × 5 = perimeter  2. perimeter ÷ 6 feet per box",
              },
              { id: "c", text: "1. 7 × 5 = area  2. area ÷ 6 feet per box" },
              {
                id: "d",
                text: "1. (7 × 2) + (5 × 2) = perimeter  2. perimeter ÷ 4 feet per box",
              },
            ],
            answer: "a",
            correct:
              "Correct — a fence goes around the garden (perimeter), then divide by 6 ft per box.",
            hint: "A fence goes around the outside. Each box is 6 feet.",
          },
          {
            id: "wr-9",
            title: "Two shovels on sale",
            type: "multipleChoice",
            passage: [
              "Jayda needs a shovel. Shovels are $8.50 each, but there is a sale: 2 shovels for $16. Jayda puts one shovel in her cart, but before she buys it she multiplies $8.50 × 2.",
            ],
            prompt: "Why do you think Jayda multiplies $8.50 × 2?",
            options: [
              {
                id: "a",
                text: "to figure out if she will have enough money to buy the shovels",
              },
              {
                id: "b",
                text: "to figure out if both shovels will fit in her cart",
              },
              {
                id: "c",
                text: "to figure out how much money she would save if she buys two shovels on sale",
              },
            ],
            answer: "c",
            correct: "Correct — $8.50 × 2 = $17, so the $16 sale saves money.",
            hint: "Compare two shovels at full price to the sale price.",
          },
          {
            id: "wr-10",
            title: "Planting the rows",
            type: "multipleChoice",
            passage: [
              "Jayda has 4 rows, and each row holds 5 packages of seeds. She wants 10 pumpkin packages and 2 watermelon packages. With the rest, she wants an equal amount of tomato and corn packages. Step 1: 4 × 5 = 20 total spaces. Step 2: 10 + 2 = 12 packages. Step 3: 20 − 12 = 8. Step 4: 8 ÷ 2.",
            ],
            prompt: "Why did Jayda complete the fourth step?",
            options: [
              {
                id: "a",
                text: "to figure out how far apart to plant the seeds",
              },
              {
                id: "b",
                text: "to figure out an equal amount of spaces for tomato and corn seeds",
              },
              {
                id: "c",
                text: "to find out how many total packages she could plant",
              },
            ],
            answer: "b",
            correct:
              "Correct — dividing the 8 leftover spaces by 2 gives equal tomato and corn packages.",
            hint: "She wants the SAME number of tomato and corn packages.",
          },
        ],
      },
    ],
  };

  // ── Speaking: Life in the New World (Jamestown) — 4 spoken tasks ──
  function speakTask(n, prompt, passage, wordBank, model) {
    return {
      id: `ws-${n}`,
      title: `Speaking Task ${n}`,
      skill: "Describing and comparing using academic language",
      type: "constructed",
      passageTitle: "Life in the New World",
      passage,
      adminScript: prompt,
      prompt,
      responseLabel: "Planning notes (then say your answer aloud)",
      responsePlaceholder: "Plan: I see ___. Long ago ___. Now ___.",
      wordBank: wordBank || [],
      correct: `Strong answer (model): ${model}`,
      support:
        "Use the word bank and full sentences. Say your answer out loud, then your teacher can listen.",
    };
  }

  const speakingTest = {
    id: "wida-speaking-newworld",
    domain: "Speaking",
    title: "WIDA Practice Test — Speaking: Life in the New World",
    gradeCluster: "Grades 6-8",
    tier: "WIDA-style model practice",
    overview:
      "Look at the pictures of colonists in the 1600s and life today. For each task, plan your answer, then say it aloud in full sentences. Your teacher will listen.",
    sections: [
      {
        domain: "Speaking",
        title: "Life in the New World",
        directions:
          "We will talk about how gathering, cooking, and eating food has changed over time. Look at the pictures, plan your answer, and say it aloud. Use the word banks to help you.",
        estMinutes: 12,
        items: [
          speakTask(
            1,
            "Look at the pictures of colonists in the 1600s. What things do you see in these pictures?",
            [
              'Colonists settled in the New World in the 1600s. A model student, Rob, said: "I see a woman cooking over a fire and a garden."',
              "Now it is your turn. What other things do you see in these pictures? Say your answer aloud.",
            ],
            [
              "I see",
              "a woman cooking",
              "a garden",
              "a fort",
              "oxen",
              "a fire",
            ],
            "I see a man with oxen, a wooden fort, and a person cooking over a fire.",
          ),
          speakTask(
            2,
            "Describe how gathering food has changed from the 1600s to now.",
            [
              "In the 1600s, colonists grew fruits and vegetables in gardens and got meat by hunting, fishing, or raising livestock. Now, most people buy food at a grocery store, deli, or butcher.",
            ],
            [
              "In the 1600s",
              "Now",
              "garden",
              "plant",
              "harvest",
              "hunt",
              "fish",
              "raise livestock",
              "grocery store",
              "purchase",
              "butcher",
              "deli",
            ],
            "In the 1600s, people grew food in gardens and hunted or fished for meat. Now, people purchase food at the grocery store, deli, or butcher.",
          ),
          speakTask(
            3,
            "Look at the artifacts archaeologists found at the Jamestown colony (a fishhook and a toy horse). What do these pictures tell us about the colonists?",
            [
              "Archaeologists study artifacts — objects found by digging where people used to live. At Jamestown they found cymbals (music), dice (games), a fishhook, and a toy horse.",
            ],
            [
              "artifact",
              "archaeologist",
              "the fishhook tells us",
              "the toy horse tells us",
              "fished for food",
              "children played",
            ],
            "The fishhook tells us the colonists fished for their food. The toy horse tells us their children liked to play with toys.",
          ),
          speakTask(
            4,
            "Even though these artifacts are from the 1600s, how do they show us that we are still similar to the colonists now?",
            [
              "The artifacts include a music cymbal, game dice, a fishhook, and a toy horse.",
            ],
            [
              "we are similar because",
              "we still",
              "play music",
              "play games",
              "fish",
              "play with toys",
              "even though",
            ],
            "Even though the artifacts are from the 1600s, we are similar because we still play music, play games, fish, and play with toys.",
          ),
        ],
      },
    ],
  };

  // ── Writing: Favorite Classes — 2 writing tasks ──
  const writingTest = {
    id: "wida-writing-classes",
    domain: "Writing",
    title: "WIDA Practice Test — Writing: Favorite Classes",
    gradeCluster: "Grades 6-8",
    tier: "WIDA-style model practice",
    overview:
      "You will write about your favorite class at school. First make a list, then write a letter to your principal. Plan, write, and re-read your best work.",
    sections: [
      {
        domain: "Writing",
        title: "Favorite Classes",
        directions:
          "You will take a writing test in English. The classes you can write about are Science, Math, Gym, Reading, History, and Art. Plan your writing, then write your best work.",
        estMinutes: 22,
        items: [
          {
            id: "ww-1",
            title: "Part I — Make a list",
            skill: "Listing reasons with support",
            type: "constructed",
            passageTitle: "Favorite Classes",
            passage: [
              "Classes at York Middle School: Science, Math, Gym, Reading, History, Art.",
              'Model — Hamad\'s list: "My favorite class is Music" because: learning to play new instruments; listening to music; singing songs; performing at concerts.',
              "Now make YOUR list: Which is your favorite class? List what you like about it.",
            ],
            adminScript:
              "Look at the classes: Science, Math, Gym, Reading, History, and Art. Which is your favorite class? Make a list explaining what you like about your favorite class.",
            prompt:
              "Which is your favorite class? Make a list explaining what you like about it.",
            responseLabel: "My favorite class and my list",
            responsePlaceholder:
              "My favorite class is ___.\n- I like ___\n- I like ___\n- I like ___",
            wordBank: [
              "My favorite class is",
              "I like",
              "because",
              "Science",
              "Math",
              "Gym",
              "Reading",
              "History",
              "Art",
            ],
            frames: [
              "My favorite class is ___.",
              "I like it because ___.",
              "One thing I like is ___.",
            ],
            correct:
              "Strong list: names one favorite class and gives at least three clear reasons.",
            support:
              "Pick ONE class. Write at least three things you like about it.",
          },
          {
            id: "ww-2",
            title: "Part II — Letter to Principal Vasquez",
            skill: "Writing a persuasive letter (8+ sentences)",
            type: "constructed",
            passage: [
              "Write a letter of at least 8 sentences to Principal Vasquez explaining what your favorite class is and why you should — or should not — be able to take this class twice in one day.",
              "Plan: Are there positives of taking it twice a day? Are there negatives? Why should the principal agree with you?",
              "Check: Does your letter have a beginning, middle, and end? Are your ideas clear? Did you support them with details? Did you add strong words?",
            ],
            adminScript:
              "Write a letter of at least 8 sentences to Principal Vasquez explaining why you should or should not be able to take your favorite class twice in one day.",
            prompt:
              "Write a letter (at least 8 sentences) to Principal Vasquez about taking your favorite class twice a day.",
            responseLabel: "Your letter to Principal Vasquez",
            responsePlaceholder:
              "Dear Principal Vasquez,\n\nMy favorite class is ___. I think I should ___ because ___.\n\nSincerely,\n___",
            wordBank: [
              "Dear Principal Vasquez",
              "I think",
              "because",
              "First",
              "Also",
              "In addition",
              "For these reasons",
              "Sincerely",
            ],
            frames: [
              "I think I should ___ because ___.",
              "First, ___.",
              "Also, ___.",
              "For these reasons, ___.",
            ],
            correct:
              "Strong letter: greeting, a clear opinion, at least two supporting reasons, and a closing — 8+ sentences.",
            support:
              "Open with 'Dear Principal Vasquez,' state your opinion, give reasons with 'because,' and close with 'Sincerely.'",
          },
        ],
      },
    ],
  };

  // ── Printable worksheets (one per domain) — new "worksheet" activity type ──
  function worksheet(domain, id, title, intro, sectionsList) {
    return {
      id,
      title,
      skill: "Printable practice",
      time: "Print & do",
      type: "worksheet",
      directions: intro,
      wida: ["print-based practice", "matches the WIDA practice test"],
      sheet: sectionsList,
    };
  }

  const worksheets = {
    Listening: worksheet(
      "Listening",
      "ws-listening-leon",
      "Worksheet — Leon the Chef (Listening)",
      "Your teacher will read 'The Story of Leon the Chef' aloud. Listen, then circle the best answer.",
      [
        {
          heading: "Listen and circle",
          items: [
            "1. How did Leon learn to cook?   a) from his mother   b) from TV   c) from books",
            "2. Why did Leon take the job?   a) more money   b) to become a cook   c) make mom proud",
            "3. Why did he cook the wasted food?   a) use waste   b) show his mom   c) prove he wanted to cook",
            "4. What did Leon pay attention to?   a) how chefs treated him   b) chef disliked him   c) he was not good",
            "5. How did Leon go to cooking school?   a) chef paid   b) scholarship   c) dishwashing money",
            "6. What restaurant did he open?   a) Portuguese   b) Mexican   c) French",
            "7. How did he know he succeeded?   a) people came worldwide   b) dreams came true   c) excited to work",
            "8. What does the ending tell us?   a) no family   b) family over job   c) misses being chef",
          ],
        },
        {
          heading: "Write",
          items: ["Write one sentence: Leon learned to cook by ___."],
        },
      ],
    ),
    Reading: worksheet(
      "Reading",
      "ws-reading-garden",
      "Worksheet — Math in the Garden (Reading)",
      "Read each part about Jayda's garden, then answer. Underline the key words that helped you.",
      [
        {
          heading: "Vocabulary",
          items: [
            "area = the space inside a shape",
            "perimeter = the distance around a shape",
            "equally = the same amount for each",
          ],
        },
        {
          heading: "Answer",
          items: [
            "1. The space INSIDE the garden is the ___ (area / perimeter).",
            "2. A fence goes AROUND the garden — that is the ___ (area / perimeter).",
            "3. Garden is 7 ft × 5 ft. Area = ___ square feet.",
            "4. Perimeter = (7 × 2) + (5 × 2) = ___ feet.",
            "5. Which words mean division? ___",
          ],
        },
      ],
    ),
    Speaking: worksheet(
      "Speaking",
      "ws-speaking-newworld",
      "Worksheet — Life in the New World (Speaking)",
      "Plan your spoken answers. Write notes, then practice saying each answer aloud in full sentences.",
      [
        {
          heading: "Word bank",
          items: [
            "In the 1600s …",
            "Now …",
            "garden, plant, harvest",
            "hunt, fish, raise livestock",
            "grocery store, butcher, deli",
          ],
        },
        {
          heading: "Plan & say",
          items: [
            "1. What do you see in the pictures? I see ___.",
            "2. How has gathering food changed? In the 1600s ___. Now ___.",
            "3. What do the artifacts tell us? The fishhook tells us ___.",
            "4. How are we similar to the colonists? We are similar because we still ___.",
          ],
        },
      ],
    ),
    Writing: worksheet(
      "Writing",
      "ws-writing-classes",
      "Worksheet — Favorite Classes (Writing)",
      "Plan your writing on this sheet, then write your letter on your best paper.",
      [
        {
          heading: "Part I — My favorite class",
          items: [
            "My favorite class is: ______________",
            "I like it because: 1) __________  2) __________  3) __________",
          ],
        },
        {
          heading: "Part II — Letter plan (to Principal Vasquez)",
          items: [
            "Opinion: I should / should not take it twice a day (circle one).",
            "Reason 1 (because): ______________",
            "Reason 2 (also): ______________",
            "Closing sentence: ______________",
            "Remember: 8+ sentences, beginning–middle–end, strong words.",
          ],
        },
      ],
    ),
  };

  return {
    tests: [listeningTest, readingTest, speakingTest, writingTest],
    appendActivities: {
      Listening: { A: [worksheets.Listening] },
      Reading: { A: [worksheets.Reading] },
      Speaking: { A: [worksheets.Speaking] },
      Writing: { A: [worksheets.Writing] },
    },
  };
})();
