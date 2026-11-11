// The Featured Lesson for each grade choice: a 10-minute speak-then-write lesson anchored on that grade's Speaking
// activity picture. Grades 6–8 is "Safer Hallways" (FEATURED_LESSON in data.js, unchanged). Kindergarten and Grade 1
// share "Our Garden" and Grades 2–3 "Garden Helpers", all on the early-learner garden scene that their Speaking
// activities show (src/early/scenes.js, scene "garden"); Grades 4–5 is "Our Class Garden" on
// pictures/35-speaking-class-garden.svg, the picture of its Voice Lab ladder. Every button named below was read in the
// running page on 2026-11-11, and every sample sentence describes something the picture really shows.
// Pure: no DOM, so the document generator imports it in Node.
import { sceneAlt, sceneSVG } from "../early/scenes.js";
import { ACTIVITY_BY_ID, FEATURED_LESSON, USE_LESSON } from "./data.js";
import { gradeName, printFiles } from "./quick-guide-files.js";
import { tourActivity, tourRoute } from "./tour-bands.js";

const REASON = { id: "reason", label: "Reason word (because)", re: /\b(because|since|so that)\b/i };
const EXAMPLE = {
  id: "example",
  label: "Example phrase (For example)",
  re: /\b(for example|for instance|such as)\b/i,
};
const COLOR = {
  id: "color",
  label: "Color word (red, yellow, green, blue…)",
  re: /\b(red|yellow|green|blue|orange|brown|pink|purple|white|black|gray|grey)\b/i,
};

const NOTES = [
  "Students may plan in their home language before they say or write in English.",
  "Supports fade; the task stays the same. These are practical supports, not WIDA levels or alignments.",
  "If students will not record, use live partner talk. The activity needs no microphone.",
];

/** The early-learner garden scene as an image source (it is drawn in code, so it has no picture file). */
const gardenScene = {
  src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sceneSVG("garden"))}`,
  alt: sceneAlt("garden")[0],
  name: "Garden picture",
};

const step = (id, name, minutes, teacher, students) => ({ id, name, minutes, teacher, students });

/** Kindergarten and Grade 1: name one thing, draw it, add a color word. `g` holds what differs between them. */
function gardenK1(g) {
  return {
    title: "Our Garden: Look, Say, Draw",
    label: "Featured Lesson",
    minutes: 10,
    objective: `Children will name one thing in a garden picture aloud, then draw it and ${g.write}.`,
    prompt: "Look at the garden. What do you see? Say one thing.",
    frame: "I see a ___.",
    picture: gardenScene,
    steps: [
      step(
        "notice",
        "Notice",
        1,
        "Show the garden picture. Point and ask: “What do you see?” Children point to one thing.",
        "Look at the picture and point to one thing.",
      ),
      step(
        "speak",
        "Speak",
        2,
        `Say the starter “I see a ___.” Children tell a partner one thing. For a model first, open the activity and press “Hear ${g.model} answer first.”`,
        "Say one thing you see to a partner: “I see a ___.”",
      ),
      step(
        "write",
        "Write",
        3,
        `On paper, children draw the thing they named, then ${g.write}. Write it on the board to copy.`,
        `Draw it, then ${g.writeStudent}.`,
      ),
      step(
        "improve",
        "Improve",
        2,
        "Give one cue only: “Add a color word.” Children color the drawing and say the sentence again with the color.",
        "Add a color and say the new sentence.",
      ),
      step(
        "share",
        "Share",
        2,
        "Two or three children hold up their drawing and say their sentence.",
        "Show the drawing and say the sentence with the color word.",
      ),
    ],
    sample: {
      first: "I see a flower.",
      improved: "I see a yellow flower.",
      explanation: "The improved sentence adds a color word. The flowers in the picture are yellow.",
    },
    cue: "Add a color word.",
    check:
      "Quick check: listen as each child says the sentence. Count how many named a thing and added a color word.",
    followUp: `Next day: children name a different thing in the garden with a color word, then try “${g.next}.”`,
    supports: {
      more: {
        name: "More support",
        items: [
          "Vocabulary with pointing: flower, plant, sun, fence, watering can, shovel.",
          "Point to the picture while you say each word.",
          "Say the starter together first: “I see a ___.”",
          "Draw only, and say the word aloud.",
        ],
      },
      some: {
        name: "Some support",
        items: ["Color word cards: red, yellow, green, blue.", "Copy the word from the board."],
      },
      independent: {
        name: "Greater independence",
        items: ["Say two things: “I see a ___ and a ___.”", "Write the sentence starter on your own."],
      },
    },
    notes: [
      "Children may name things in their home language first, then in English.",
      NOTES[1],
      "Young writers use crayons and a pencil on paper. If children will not record, use partner talk. The activity needs no microphone.",
    ],
    checks: [COLOR],
    boxes: ["The sentence you or a child said", "The sentence with a color word"],
    use: {
      materials: [
        "The garden picture on a screen, or the printed backup page",
        "Paper with crayons or a pencil",
        "A partner or a grown-up (a microphone is not needed)",
      ],
      time: "About 10 minutes",
      studentDirections: [
        "Look at the garden picture.",
        "Say one thing you see: “I see a ___.”",
        "Draw it on your paper.",
        `${g.writeStudent.charAt(0).toUpperCase()}${g.writeStudent.slice(1)}.`,
        "Add a color. Say your sentence again.",
        "Show a partner or a grown-up.",
      ],
      writing: [
        { id: "first", label: "My drawing", draw: true },
        { id: "revised", label: g.lineLabel, lines: 2 },
      ],
    },
  };
}

const BAND_LESSONS = {
  K: gardenK1({
    model: "Lina, age 5",
    write: "copy one word under the drawing",
    writeStudent: "copy the word",
    lineLabel: "My word",
    next: "Draw a Garden",
  }),
  1: gardenK1({
    model: "Mateo, age 6",
    write: "write the starter “I see a ___.” with the word",
    writeStudent: "write “I see a ___.” with your word",
    lineLabel: "My sentence",
    next: "I See Sentence",
  }),
  "2-3": {
    title: "Garden Helpers: Look, Say, Write",
    label: "Featured Lesson",
    minutes: 10,
    objective:
      "Students will tell what a person in the garden picture is doing and give a reason with “because,” first aloud and then in writing.",
    prompt: "Look at the garden. Tell what the child is doing and why.",
    frame: "I see ___. The child is ___ because ___.",
    picture: gardenScene,
    steps: [
      step(
        "notice",
        "Notice",
        1,
        "Show the garden picture. Ask: “Who do you see? What are they doing?” Take two quick answers.",
        "Name one person and one thing they are doing.",
      ),
      step(
        "speak",
        "Speak",
        2,
        "Read the prompt. Partners take turns with the frame. For a model first, open the activity and press “Hear Leo, age 8 answer first.”",
        "Say what the child is doing and why to a partner.",
      ),
      step(
        "write",
        "Write",
        3,
        "Students write one or two sentences on paper with the frame. Allow a quick drawing or home-language notes first.",
        "Write what you said in one or two sentences.",
      ),
      step(
        "improve",
        "Improve",
        2,
        "Give one cue only: “Add a reason that starts with because.” Students add it and read the new sentence once.",
        "Add a reason with “because.”",
      ),
      step(
        "share",
        "Share",
        2,
        "Two or three students read their sentences and say what they added.",
        "Read the new sentence and point to “because.”",
      ),
    ],
    sample: {
      first: "I see a girl. She has a watering can.",
      improved:
        "I see a girl with a watering can. The girl is watering the plants because plants need water to grow.",
      explanation: "The improved response says what the girl is doing and gives a reason with “because.”",
    },
    cue: "Add a reason that starts with “because.”",
    check:
      "Quick check: ask students to point to the action and to “because” in their sentences. Count how many have both.",
    followUp:
      "Next day: students tell what the grown-up with the shovel is doing and why, then try “My Favorite Fruit,” which uses the frame “I like ___ because ___.”",
    supports: {
      more: {
        name: "More support",
        items: [
          "Vocabulary: garden, plants, water, watering can, shovel, dig, grow.",
          "Visual reference: the garden picture stays on screen.",
          "Oral rehearsal: say it twice with a partner before writing.",
          "Sentence frame: The child is ___ because ___.",
        ],
      },
      some: {
        name: "Some support",
        items: ["Optional words: because, so, and.", "Reason prompt: “Why is she doing that?”"],
      },
      independent: {
        name: "Greater independence",
        items: ["Write about both people in the picture.", "Add a second reason with “so.”"],
      },
    },
    notes: NOTES,
    checks: [REASON],
    boxes: ["Your written response", "Your revised response"],
    use: {
      materials: [
        "A device with the student link, or the printed backup page",
        "Paper and a pencil",
        "A partner (a microphone is not needed)",
      ],
      time: "About 10 minutes",
      studentDirections: [
        "Open the link, or look at the garden picture.",
        "Name one person and what they are doing.",
        "Tell a partner: I see ___. The child is ___ because ___.",
        "Write what you said in one or two sentences.",
        "Add a reason. Start it with “because.”",
        "Read your sentences to your partner.",
      ],
      writing: [
        { id: "first", label: "My first sentence", lines: 3 },
        { id: "revised", label: "My sentence with “because”", lines: 4 },
      ],
    },
  },
  "4-5": {
    title: "Our Class Garden: Speak, Write, Improve",
    label: "Featured Lesson",
    minutes: 10,
    objective:
      "Students will explain how the children help the plants grow and support it with a reason and an example, first aloud and then in writing.",
    prompt:
      "Look at the class garden. Explain how the children help the plants grow, and give a reason.",
    frame: "The children help the plants by ___. This helps because ___. For example, ___.",
    picture: {
      src: "/access-practice-lab/pictures/35-speaking-class-garden.svg",
      alt: "A school garden with two wooden garden beds. Tomato plants grow in one bed, and tall sunflowers grow in the other bed. A girl waters the tomatoes with a watering can, and a boy digs with a small shovel.",
      name: "Class garden picture",
    },
    steps: [
      step(
        "notice",
        "Notice",
        1,
        "Show the picture. Ask: “What do you see? What are the children doing?” Take two quick answers.",
        "Look at the picture and name two things and one action.",
      ),
      step(
        "speak",
        "Speak",
        2,
        "Read the prompt. Partners take turns with the frame. For a model, the activity’s Step 3 · Tell more asks the same question and “Hear Tariq first” plays an answer.",
        "Say how the children help and give one reason to a partner (or to yourself, aloud).",
      ),
      step(
        "write",
        "Write",
        3,
        "Students turn what they said into two or three written sentences. Allow home-language notes first.",
        "Write the spoken idea as a short response.",
      ),
      step(
        "improve",
        "Improve",
        2,
        "Give one cue only: “Add an example that starts with For example.” Students add it and read the new version once.",
        "Add one example to make the response clearer.",
      ),
      step(
        "share",
        "Share",
        2,
        "Two or three students read the revised response and say what they added.",
        "Read or say the revised response and explain the improvement.",
      ),
    ],
    sample: {
      first: "The children help the plants. They give them water.",
      improved:
        "The children help the plants by watering them and digging the soil. This helps because plants need water and soft soil to grow. For example, the girl waters the tomatoes with a watering can.",
      explanation: "The improved response adds a clear action, a reason and an example.",
    },
    cue: "Add an example that starts with “For example.”",
    check:
      "Quick check: ask students to point to their action, their “because,” and their “For example.” Count how many have all three.",
    followUp:
      "Next day: students explain how the children could care for the sunflowers with the same three parts, then try the Language Upgrade Lab: Plants.",
    supports: {
      more: {
        name: "More support",
        items: [
          "Vocabulary: garden bed, tomatoes, sunflowers, watering can, shovel, soil, roots.",
          "Visual reference: the garden picture stays on screen.",
          "Oral rehearsal: say it twice with a partner before writing.",
          "Sentence frame: The children help the plants by ___. This helps because ___.",
        ],
      },
      some: {
        name: "Some support",
        items: [
          "Optional connectors: because, so, also, for example.",
          "Reason prompt: “Why does that help the plants?”",
        ],
      },
      independent: {
        name: "Greater independence",
        items: [
          "Write a fuller explanation with two ways the children help.",
          "Choose a more exact word for “help” or “give.”",
          "Add what would happen without that care: “If ___, then ___.”",
        ],
      },
    },
    notes: NOTES,
    checks: [REASON, EXAMPLE],
    boxes: ["Your written response", "Your revised response"],
    use: {
      materials: [
        "A device with the student link, or the printed backup page",
        "Paper or a document to write in",
        "A partner (a microphone is not needed)",
      ],
      time: "About 10 minutes",
      studentDirections: [
        "Open the link. Look at the class garden picture.",
        "Name two things you see and what the children are doing.",
        "Say your answer to a partner: The children help the plants by ___. This helps because ___. For example, ___.",
        "Write what you said in two or three sentences.",
        "Add one example that starts with “For example.”",
        "Read your new response to your partner.",
      ],
      writing: [
        { id: "first", label: "My first response", lines: 4 },
        { id: "revised", label: "My improved response", lines: 6 },
      ],
    },
  },
};

function grades68() {
  const a = ACTIVITY_BY_ID[FEATURED_LESSON.anchor];
  return {
    ...FEATURED_LESSON,
    picture: { ...FEATURED_LESSON.picture, name: "Hallway picture" },
    checks: [REASON, EXAMPLE],
    boxes: ["Your written response", "Your revised response"],
    anchor: { name: a.name, route: a.route, minutes: a.minutes },
    use: {
      ...USE_LESSON,
      writing: [
        { id: "first", label: "My first response", lines: 4 },
        { id: "revised", label: "My improved response", lines: 6 },
      ],
    },
  };
}

/** The Featured Lesson for a grade choice, with its anchor activity, student link and print files. */
export function lessonFor(pick) {
  const id = BAND_LESSONS[pick] ? pick : "6-8";
  const base = id === "6-8" ? grades68() : { ...BAND_LESSONS[id] };
  if (id !== "6-8") {
    const a = tourActivity(id, "speaking");
    base.anchor = { name: a.title, route: tourRoute(a), minutes: a.minutes };
    base.use = { ...base.use, studentRoute: base.anchor.route };
  }
  return {
    ...base,
    pick: id,
    grade: gradeName(id),
    topic: base.title.split(":")[0],
    files: printFiles(id).lessonBackup,
  };
}

/** Word check only: which of the lesson's cue words appear. Never a judgment of meaning. */
export function cueChecks(lesson, text) {
  const t = String(text || "");
  return lesson.checks.map((c) => ({ ...c, found: c.re.test(t) }));
}
