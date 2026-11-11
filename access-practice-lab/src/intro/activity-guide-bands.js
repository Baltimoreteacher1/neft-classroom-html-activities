// The Activity Guide for every grade's four activities (BAND_TOUR in tour-bands.js) that are not curated activities in
// data.js. Same fields as activity-guide-data.js, plus the help that is built in, the teaching moves a person adds and
// the limits to say out loud. Every button name was read in the running page on 2026-11-11 (Chromium, ?grades=<pick>):
// early-learner pages (Kindergarten to Grades 2–3) and lab pages (Grades 4–5 and 6–8) word their buttons differently.
// Pure data: no DOM.

const EARLY_LIMITS =
  "Practice only: the page says it is not a test score or level. Finished activities are remembered on this device.";
const LAB_LIMITS =
  "Help and retries are saved as supported practice. The page says it is practice evidence, not a proficiency score.";
const EARLY_OPEN = (domain) =>
  `Share the link; it opens at the right grade. Students can also start at the early learners home and choose ${domain} under “Practice by skill.”`;
const LAB_OPEN = (domain) =>
  `Share the link; it opens at the right grade. Students can also choose ${domain} under “Start by skill” on the lab home.`;
const NO_SOUND = [
  "No sound",
  "Check the device volume. Read the direction and the choices aloud yourself; the pictures still work.",
];

/** Early-learner listening: a spoken prompt, picture choices with their own “Hear:” buttons, Check. */
const earlyListen = (id, o) => ({
  id,
  why: "Directions are spoken and every answer is a picture, so a child shows what they understood without needing to read. Replay is the only help, and it never removes a choice.",
  open: EARLY_OPEN("Listening"),
  steps: [
    `Pepita, the guide, gives the direction: “${o.direction}” Press “Hear it again” to hear it once more.`,
    "Press “Hear the story again” to replay the prompt.",
    `Tap the picture that answers. “${o.hear}” beside a choice reads that choice aloud.`,
    "Press “Check,” then “Next.”",
  ],
  feedback:
    "“Not yet. Listen again, then try once more. All the choices are still here.” or “Yes! You did it.” No score.",
  builtIn: [
    "Spoken directions and “Hear it again.”",
    "Picture choices, each with its own “Hear:” button.",
    "Audio-first mode is on: directions are spoken, answers are pictures.",
  ],
  moves: ["Point to each picture as you name it before the child chooses.", o.move],
  limits: EARLY_LIMITS,
  teach: o.teach,
  stuck: [
    NO_SOUND,
    [
      "The child taps before listening",
      "Press “Hear it again” together, then ask the child to point before tapping.",
    ],
  ],
});

/** Early-learner speaking: hear a child the same age, say it aloud, recording optional. */
const earlySpeak = (id, o) => ({
  id,
  why: "A child the learner’s own age models the answer first, and the sentence starter waits behind a button, so speaking feels safe and short. Saying it to a partner counts as much as recording.",
  open: EARLY_OPEN("Speaking"),
  steps: [
    `Look at the garden picture. Press “Hear it again” to hear the question: “${o.question}”`,
    `Press “Hear ${o.model} answer first” to hear a model.`,
    "Say your own answer aloud. The speaker button “Hear the sentence starter” says “I see ___.”",
    "Optional: press “Record my answer,” then listen to yourself. Or say it to a partner.",
    "Press “I said my answer,” then “Next.”",
  ],
  feedback:
    "No score. The model answer to compare with, and the page’s tip: “Listen to your answer. Choose one detail to add, then record again if you want.”",
  builtIn: [
    `A model student: ${o.model}.`,
    "The sentence starter, read aloud by “Hear the sentence starter.”",
    "Optional recording: the microphone is asked for only when you press “Record my answer.”",
  ],
  moves: ["Partners say “I see ___” to each other instead of recording.", o.move],
  limits:
    "Not scored. Recordings stay in the open tab and are never uploaded.",
  teach: o.teach,
  stuck: [
    [
      "No microphone, or the child does not want to record",
      "Skip “Record my answer.” Say it to a partner, then press “I said my answer.”",
    ],
    NO_SOUND,
  ],
});

/** Early-learner reading: tap a sentence to hear it, tap the matching picture. */
const earlyRead = (id, o) => ({
  id,
  why: "Every sentence reads aloud on a tap, so decoding does not hide what a child understands, and the answer is a picture.",
  open: EARLY_OPEN("Reading"),
  steps: [
    `Read the direction: “${o.direction}”`,
    `Tap ${o.text} to hear it read aloud.`,
    `Tap the picture that answers “${o.question}” “${o.hear}” beside a choice reads it aloud.`,
    "Press “Check,” then “Next.”",
  ],
  feedback: "“Not yet” with every choice still on the page, or “Yes! You did it.” No score.",
  builtIn: [
    "Tap any sentence to hear it.",
    "Picture choices with their own “Hear:” buttons.",
    "“Hear it again” for the direction.",
  ],
  moves: ["Read the sentence together first, pointing to each word.", o.move],
  limits: EARLY_LIMITS,
  teach: o.teach,
  stuck: [
    NO_SOUND,
    ["The child guesses", "Tap the sentence again together and find the word that answers."],
  ],
});

/** Early-learner writing: print the page, write with a pencil, show a grown-up. */
const earlyWrite = (id, o) => ({
  id,
  why: "Young writers write with a pencil on paper, where letters and drawings belong. The page prints exactly what to write, so the child can work without typing.",
  open: EARLY_OPEN("Writing"),
  steps: [
    `Press “Hear it again” to hear the direction: “${o.direction}”`,
    ...(o.starter
      ? [`Press the speaker button “Hear the sentence starter” to hear “${o.starter}”`]
      : []),
    `Press “Print my writing page.” The page shows ${o.shows}.`,
    "Write and draw with a pencil, then show a grown-up.",
    "Press “I wrote it on paper.”",
  ],
  feedback:
    "The page collects no typed writing. A grown-up reads the paper with the child; nothing is scored.",
  builtIn: [
    "Spoken directions and “Hear it again.”",
    "“Print my writing page” prints the page to write on.",
    ...(o.starter ? ["“Hear the sentence starter” says the starter aloud."] : []),
  ],
  moves: ["Say the sentence aloud together before writing.", o.move],
  limits: "No writing is typed or collected; the child shows the paper to a grown-up.",
  teach: o.teach,
  stuck: [
    ["No printer", "Copy the starter or the word on the board; children write on any paper."],
    ["The child is unsure what to write", "Say it together first, then write one word at a time."],
  ],
});

/** Lab skill pages (Grades 4–5 and 6–8 Listening and Reading): skill lesson, answer, how sure, check. */
const LAB_STEPS_END = [
  "Choose an answer, then how sure you are: “Guessing,” “I think so” or “Sure.”",
  "Press “Check my answer.” If it says “Not yet — try again,” read “One next step,” then press “Try again” or “Show me the model.”",
];
const labActivity = (id, o) => ({
  id,
  why: o.why,
  open: LAB_OPEN(o.domain),
  steps: [
    "Read the direction under Warm up. “Hear directions” reads it aloud, and “Key words” lists the words to know.",
    "If the short skill lesson opens, read the three moves, then press “Got it, let me try.”",
    o.step,
    ...LAB_STEPS_END,
  ],
  feedback:
    "“Not yet — try again” with “What went well” and “One next step,” or a confirmation. “Show me the model” is there when a student wants it. No score.",
  builtIn: o.builtIn,
  moves: o.moves,
  limits: LAB_LIMITS,
  teach: o.teach,
  stuck: o.stuck,
});

export const BAND_GUIDE = [
  earlyListen("gk-l-a-find-seed", {
    direction: "Listen. Point to the seed.",
    hear: "Hear: seed",
    move: "Hold up a real seed, flower or picture of the sun first.",
    teach: {
      before: "Name the three pictures together: flower, sun, seed.",
      during: "The child points first, then taps.",
      after: "Ask: “Where do seeds go?” and act out planting one.",
    },
  }),
  earlySpeak("gk-s-a-garden-see", {
    question: "What do you see?",
    model: "Lina, age 5",
    move: "Point to the picture while the child talks.",
    teach: {
      before: "Point to two things in the garden and name them.",
      during: "Partners take turns: “I see ___.”",
      after: "Ask three children to say their sentence to the group.",
    },
  }),
  earlyRead("gk-r-b-i-see-fish", {
    direction: "Read the sentence with a grown-up. Tap the picture.",
    text: "the sentence “I see a fish.”",
    question: "What do I see?",
    hear: "Hear: a fish",
    move: "Let the child read the sentence back to you.",
    teach: {
      before: "Read “I see a fish.” together, pointing to each word.",
      during: "The child taps the picture on their own.",
      after: "Change one word aloud (“I see a frog.”) and ask which picture fits.",
    },
  }),
  earlyWrite("gk-w-a-draw-garden", {
    direction: "Print your page. Draw a plant. Copy the word plant.",
    shows: "the word “plant” to copy",
    move: "Write “plant” large on the board to copy as well.",
    teach: {
      before: "Draw a plant together on the board and say “plant.”",
      during: "Children draw, then copy the word under the drawing.",
      after: "Children show a partner and say “This is my plant.”",
    },
  }),
  earlyListen("g1-l-a-hear-cat", {
    direction: "Listen. Tap the cat.",
    hear: "Hear: cat",
    move: "Make the animal sounds together after the answer.",
    teach: {
      before: "Name the three animals together: cat, dog, fish.",
      during: "Children tap on their own device or point on the board.",
      after: "Ask: “Which animal says meow?”",
    },
  }),
  earlySpeak("g1-s-a-garden-name", {
    question: "What do you see?",
    model: "Mateo, age 6",
    move: "Ask for one more word: a color or a size.",
    teach: {
      before: "Point to two things in the garden and name them.",
      during: "Turn and talk: say one thing you see, then listen to your partner.",
      after: "Collect three answers on the board as “I see ___.” sentences.",
    },
  }),
  earlyRead("g1-r-b-cat-mat", {
    direction: "Read the sentence. Tap where the cat is.",
    text: "the sentence “The cat naps on the mat.”",
    question: "Where is the cat?",
    hear: "Hear: on the mat",
    move: "Act out in, on and up with a small object.",
    teach: {
      before: "Read the sentence chorally, then underline “on.”",
      during: "Children answer on their own.",
      after: "Say a new sentence with “in” or “under” and act it out.",
    },
  }),
  earlyWrite("g1-w-b-i-see", {
    direction: "Print your page. Look at the garden. Write: I see, and one thing.",
    starter: "I see ___.",
    shows: "the starter “I see ___.”",
    move: "Children read their sentence to a partner.",
    teach: {
      before: "Say three “I see” sentences about the garden together.",
      during: "Children write one sentence on the printed page.",
      after: "Partners read their sentences to each other.",
    },
  }),
  earlyListen("g23-l-a-garden-helper", {
    direction: "Listen to the story. Then tap the picture that answers the question.",
    hear: "Hear: Ana",
    move: "Ask students to tell a partner how they knew.",
    teach: {
      before: "Ask: “Who helps in a garden? What do they do?”",
      during: "Students listen with headphones and answer.",
      after: "Partners say who waters the plants and how they knew.",
    },
  }),
  earlySpeak("g23-s-a-garden-see", {
    question: "What do you see in the garden?",
    model: "Leo, age 8",
    move: "Ask for one more detail after the first answer.",
    teach: {
      before: "Model one sentence about the picture with one detail.",
      during: "Partners take turns naming and describing.",
      after: "Each pair shares the sentence with the best detail.",
    },
  }),
  earlyRead("g23-r-b-library-card", {
    direction: "Read the story. Then tap the answer.",
    text: "any of the four sentences",
    question: "What can Leo do with his card?",
    hear: "Hear: borrow books",
    move: "Ask students to point to the sentence that proves the answer.",
    teach: {
      before: "Ask: “What can you do at a library?”",
      during: "Students read, tap sentences to hear them, then answer.",
      after: "Partners find the sentence that proves it: “Now he can borrow books.”",
    },
  }),
  earlyWrite("g23-w-a-favorite-fruit", {
    direction: "Print your page. Draw your favorite fruit. Write one sentence about it.",
    starter: "I like ___ because ___.",
    shows: "the frame “I like ___ because ___.”",
    move: "Partners trade papers and underline “because.”",
    teach: {
      before: "Say your own sentence: “I like apples because they are crunchy.”",
      during: "Students draw, then write the sentence.",
      after: "Partners read and underline the word “because.”",
    },
  }),
  labActivity("g35-l-a-classroom-place", {
    domain: "Listening",
    why: "Students listen for one place word at a time and can slow the audio, hear the question again and open word help, so the listening is the skill, not the speed.",
    step: "Press “Listen.” Try “Slower,” then press “Hear question.” “Word help” explains two words.",
    builtIn: [
      "“Listen,” “Slower” and “Hear question.”",
      "Word help (“Ayuda con palabras”).",
      "A two-minute skill lesson and a worked model.",
    ],
    moves: ["Play one direction for the class, then follow it in the room."],
    teach: {
      before: "Point to places in the room: under the window, by the door, on the desk.",
      during: "Students choose, then say the place words they heard.",
      after: "Give one spoken direction and have a student follow it.",
    },
    stuck: [
      NO_SOUND,
      [
        "Students guess",
        "Ask them to choose “Guessing,” then use “One next step” and listen again.",
      ],
    ],
  }),
  {
    id: "class-garden",
    why: "Students say one idea at three lengths, so they rehearse words before sentences and sentences before an explanation. Hearing a model student first shows what a complete answer sounds like.",
    open: "Share the link; it opens at the right grade. The garden is one of the picture speaking ladders in Voice Lab.",
    steps: [
      "Look at the garden picture.",
      "Step 1 · Words: press “Hear the question,” then “Hear Pablo first” to hear a model answer.",
      "Say three things you see. Open “Show a sentence frame” if you want help.",
      "Optional: press “Record my answer,” then listen to yourself. Or say it to a partner.",
      "Press “I said it out loud.” Then do Step 2 · Sentences (“Hear Mei first”) and Step 3 · Tell more (“Hear Tariq first”) the same way.",
    ],
    feedback:
      "No score; the page says these are practice steps, not ACCESS tiers or WIDA levels. A model student to compare with. Steps marked “said” are remembered on this device.",
    builtIn: [
      "A model student for each step (device voice).",
      "A sentence frame under “Show a sentence frame.”",
      "Optional recording: the microphone is asked for only when you press “Record my answer.”",
    ],
    moves: ["Partners listen instead of recording.", "Students plan in their home language first."],
    limits:
      "Not scored. Recordings stay in the open tab and are never uploaded. “I said it out loud” is remembered on this device.",
    teach: {
      before: "Show the picture and model Step 1 yourself.",
      during: "Partners take turns; the listener holds up a finger for each detail they hear.",
      after: "Ask two students to say their Step 3 answer to the class.",
    },
    stuck: [
      [
        "No sound from “Hear …”",
        "Check the volume. The voice is the device’s own; read the model aloud instead.",
      ],
      [
        "No microphone, or students do not want to record",
        "Skip Record. Say it to a partner, then press “I said it out loud.”",
      ],
    ],
  },
  labActivity("g35-r-a-garden", {
    domain: "Reading",
    why: "A short passage with a picture lets students practice one move, matching a question word to the detail that answers it, and mark the evidence they used.",
    step: "Press “Read Passage Aloud,” or click one sentence to hear just that sentence. Mark the text with “Highlight,” “Underline” or “Pin evidence.”",
    builtIn: [
      "“Read Passage Aloud,” with a choice of speed.",
      "Highlight, Underline and Pin evidence.",
      "Word help and Spanish cognates.",
    ],
    moves: ["Read the passage together first.", "Partners compare the evidence they pinned."],
    teach: {
      before: "Model one question word: who, what, where or when.",
      during: "Students pin one sentence as evidence before they check.",
      after: "Partners read their pinned sentence aloud.",
    },
    stuck: [
      [
        "The passage is hard to read",
        "Press “Read Passage Aloud,” or click one sentence at a time.",
      ],
      [
        "Students choose a true fact that answers a different question",
        "Find the question word first, then look for it.",
      ],
    ],
  }),
  {
    id: "lu35-explain-plants",
    why: "One sentence is small enough to revise several times in five minutes. The checks turn “make it better” into three concrete moves: a detail, an exact word, a connector.",
    open: "Share the link; it opens at the right grade. The Language Upgrade Lab is one of the Language builders.",
    steps: [
      "Read the everyday sentence: “Plants need stuff.”",
      "Choose “Start with this help” (a frame and a word bank) or “On my own.”",
      "Write a better version under “My revision.”",
      "Press “Check my work.” If it says “Not yet. Here is what to fix:” it names a detail, a precise word or a connector.",
      "Fix what it names and check again. “Ask for more help” adds more support.",
    ],
    feedback:
      "“Not yet. Here is what to fix:” with each missing move named. It looks for words and connectors; it does not judge meaning.",
    builtIn: [
      "The frame “Plants need ___ and ___ because ___.” and a word bank (“Start with this help”), or nothing (“On my own”).",
      "“Ask for more help” adds support and marks the try as supported.",
      "“Check my work” names what to fix; students can revise as many times as they like.",
    ],
    moves: [
      "Read the frame aloud together before writing.",
      "Partners swap sentences and underline the exact word.",
    ],
    limits:
      "The check looks for a detail, an exact word and a connector. It does not judge meaning.",
    teach: {
      before: "Read the frame aloud and model one exact word for “stuff.”",
      during: "Students check, then compare their exact word with a partner.",
      after: "Collect three revised sentences and read them aloud.",
    },
    stuck: [
      [
        "“Not yet” on every check",
        "Use the frame “Plants need ___ and ___ because ___.” and two words from the bank.",
      ],
      [
        "A student wants no help",
        "Choose “On my own.” Opening help later marks the try as supported, which is fine.",
      ],
    ],
  },
  labActivity("main-idea-match-b", {
    domain: "Listening",
    why: "A short spoken statement and three choices let students practice one move, telling the big idea from a single detail, with the audio as slow and as often as they need.",
    step: "Press “Listen.” Try “Slower,” then press “Hear question.” “Word help” explains four words.",
    builtIn: [
      "“Listen,” “Slower” and “Hear question.”",
      "Word help (“Ayuda con palabras”).",
      "A two-minute skill lesson on the main idea, with a worked model.",
    ],
    moves: ["After checking, students say the detail that proves the main idea."],
    teach: {
      before: "Model the question: “What is this mostly about?”",
      during: "Students choose, then name one detail they heard.",
      after: "Ask why “Cans are made of metal.” is a detail, not the main idea.",
    },
    stuck: [
      NO_SOUND,
      [
        "Students pick a single fact",
        "Reread the skill lesson’s “Watch out”: one small fact is not the main idea.",
      ],
    ],
  }),
  labActivity("read-main-idea", {
    domain: "Reading",
    why: "A short informational text and three choices let students practice one move, telling the main idea from a small fact, and check it against the other sentences.",
    step: "Read the short text. Open “Word help” for any of its five words.",
    builtIn: [
      "Word help (“Ayuda con palabras”).",
      "A two-minute skill lesson on the main idea, with a worked model.",
      "“Learn with help” or “Try independently.”",
    ],
    moves: ["Students underline the sentence that proves the main idea."],
    teach: {
      before: "Model the three moves on a short paragraph of your own.",
      during: "Students choose, then underline the proof.",
      after: "Ask why the backpack choice is a detail, not the main idea.",
    },
    stuck: [
      ["A word blocks the meaning", "Open “Word help” for that word."],
      ["Students pick a single fact", "Ask: do the other sentences explain that idea?"],
    ],
  }),
];

export const BAND_GUIDE_BY_ID = Object.fromEntries(BAND_GUIDE.map((g) => [g.id, g]));
