// Visual Match: Spanish feeling words and greetings matched to faces and scenes (grade 2 world languages).
// Spanish sentences carry an English gloss in parentheses so a novice can still decide from meaning.
import { face, greeting } from "../kits/c8-spanish-greetings.js";

const COL = "g2-world-languages-greetings-and-feelings-spanish";

const activity = {
  id: "g2-spanish-feelings-match",
  engine: "visual-match",
  title: "Match Spanish feelings and greetings",
  grade: "2",
  band: "k-2",
  subject: "world-languages",
  lessonId: "g2-world-languages-greetings-and-feelings-spanish",
  standards: ["ACTFL.1.2"],
  vocabIds: [
    "feliz",
    "triste",
    "cansado",
    "enojado",
    "nervioso",
    "buenos-dias",
    "buenas-tardes",
    "adios",
  ].map((id) => `${COL}:${id}`),
  minutes: 12,
  intro:
    "Say each Spanish word out loud. Then match it to the face or the picture it describes. Look closely at the eyes, the mouth and the sky.",
  modes: ["term-visual", "term-definition", "term-example"],
  pairs: [
    {
      id: "feliz",
      term: "feliz",
      visual: face("feliz"),
      definition: "The feeling you have when you are glad and smiling.",
      example: "Estoy feliz porque es sábado. (I am happy because it is Saturday.)",
      why: "The curved eyes and the wide smile show a happy face.",
      hints: [
        "Look at the whole face first, then the mouth.",
        "Check which way the mouth curves.",
        "The eyes and the mouth both curve up.",
      ],
      confusions: [
        {
          pick: "triste",
          tag: "mouth-direction",
          hint: "Look at the mouth. In a sad face it curves down. Does this mouth curve down?",
          model: "The curved eyes and the wide smile show a happy face.",
        },
      ],
      transfer: {
        prompt: "Maya has a big smile because she won a prize. Which sentence tells how she feels?",
        options: [
          { id: "a", text: "Estoy feliz." },
          { id: "b", text: "Estoy triste." },
          { id: "c", text: "Estoy cansada." },
        ],
        answer: "a",
        explain: "A big smile and a prize mean she feels glad, so she says estoy feliz.",
      },
    },
    {
      id: "triste",
      term: "triste",
      visual: face("triste"),
      definition: "The feeling you have when you are sad and your mouth turns down.",
      example: "Hoy estoy triste porque llueve. (Today I am sad because it is raining.)",
      why: "The tear, the tilted eyebrows and the mouth curving down show a sad face.",
      hints: [
        "Look for a part of the face that is crying.",
        "Check which way the mouth curves.",
        "A tear falls near one eye and the mouth curves down.",
      ],
      confusions: [
        {
          pick: "feliz",
          tag: "mouth-direction",
          hint: "Look at the mouth. A smile curves up. Does this mouth curve up?",
          model: "The tear, the tilted eyebrows and the mouth curving down show a sad face.",
        },
      ],
    },
    {
      id: "cansado",
      term: "cansado",
      forms: ["cansada"],
      visual: face("cansado"),
      definition: "The feeling you have when your eyes are heavy and you want to rest.",
      example: "Después de correr, estoy cansado. (After running, I am tired.)",
      why: "The heavy eyes, the big yawn and the letters Z z z show a sleepy face.",
      hints: [
        "Look at the letters floating next to the face.",
        "Check the eyes. Are they wide open?",
        "The eyes are heavy and the mouth is open in a yawn.",
      ],
      confusions: [
        {
          pick: "nervioso",
          tag: "eyes-open-or-heavy",
          hint: "Check the eyes. A jumpy face has wide round eyes. Are these eyes wide?",
          model: "The heavy eyes, the big yawn and the letters Z z z show a sleepy face.",
        },
      ],
      transfer: {
        prompt: "Leo yawns and rubs his eyes after a long day. Which sentence tells how he feels?",
        options: [
          { id: "a", text: "Estoy enojado." },
          { id: "b", text: "Estoy cansado." },
          { id: "c", text: "Estoy feliz." },
        ],
        answer: "b",
        explain: "Yawning and rubbing your eyes mean you want to rest, so he says estoy cansado.",
      },
    },
    {
      id: "enojado",
      term: "enojado",
      forms: ["enojada"],
      visual: face("enojado"),
      definition: "The feeling you have when you are angry and your eyebrows point down.",
      example: "Estoy enojado porque perdí mi lápiz. (I am angry because I lost my pencil.)",
      why: "Eyebrows pointing down toward the nose and a flat, tight mouth show an angry face.",
      hints: [
        "Start with the eyebrows.",
        "Check whether the eyebrows tilt up or point down.",
        "The eyebrows point down toward the nose and the mouth is a flat line.",
      ],
      confusions: [
        {
          pick: "triste",
          tag: "eyebrow-direction",
          hint: "Compare the eyebrows. In a sad face they tilt up in the middle. Here they point down.",
          model: "Eyebrows pointing down toward the nose and a flat, tight mouth show an angry face.",
        },
      ],
    },
    {
      id: "nervioso",
      term: "nervioso",
      forms: ["nerviosa"],
      visual: face("nervioso"),
      definition: "The feeling you have when you are worried and jumpy about something coming up.",
      example: "Estoy nervioso antes de leer. (I am nervous before reading aloud.)",
      why: "Wide round eyes, a wavy mouth and a sweat drop show a nervous face.",
      hints: [
        "Look at the mouth line. Is it straight or smooth?",
        "Check the eyes. Are they wide or heavy?",
        "The mouth is wavy, the eyes are wide and there is a sweat drop.",
      ],
      confusions: [
        {
          pick: "cansado",
          tag: "eyes-open-or-heavy",
          hint: "A sleepy face has heavy eyes and a yawn. Do you see heavy eyes here?",
          model: "Wide round eyes, a wavy mouth and a sweat drop show a nervous face.",
        },
      ],
    },
    {
      id: "buenos-dias",
      term: "buenos días",
      visual: greeting("morning"),
      definition: "A greeting you say in the morning, when the day is just starting.",
      example: "¡Buenos días, maestra! (Good morning, teacher!)",
      why: "The low sun and the school bus show the start of the day, and the greeting for the morning is the one to use.",
      hints: [
        "Read the time word in the corner of the picture.",
        "Think about when the sun is low and school is starting.",
        "The word in the corner says it is the first part of the day.",
      ],
      confusions: [
        {
          pick: "buenas-tardes",
          tag: "time-of-day",
          hint: "Check the sun and the word in the corner. Is it the first part of the day or after lunch?",
          model: "The low sun and the school bus show the start of the day, and the greeting for the morning is the one to use.",
        },
      ],
      transfer: {
        prompt: "It is 8 in the morning and you walk into class. Which greeting fits?",
        options: [
          { id: "a", text: "Buenos días" },
          { id: "b", text: "Buenas tardes" },
          { id: "c", text: "Adiós" },
        ],
        answer: "a",
        explain: "Eight in the morning is the start of the day, so you say buenos días.",
      },
    },
    {
      id: "buenas-tardes",
      term: "buenas tardes",
      visual: greeting("afternoon"),
      definition: "A greeting you say after lunch, in the afternoon.",
      example: "Buenas tardes, abuela. (Good afternoon, grandmother.)",
      why: "The high sun and the backpack show the afternoon, and the greeting for after lunch is the one to use.",
      hints: [
        "Read the time word in the corner of the picture.",
        "Think about where the sun is and what the student carries.",
        "The word in the corner names the part of the day after lunch.",
      ],
      confusions: [
        {
          pick: "buenos-dias",
          tag: "time-of-day",
          hint: "Check the word in the corner. Does it name the start of the day or the time after lunch?",
          model: "The high sun and the backpack show the afternoon, and the greeting for after lunch is the one to use.",
        },
      ],
    },
    {
      id: "adios",
      term: "adiós",
      visual: greeting("leaving"),
      definition: "A word you say when you are leaving and the talk is over.",
      example: "Me voy a casa. ¡Adiós, amigo! (I am going home. Goodbye, friend!)",
      why: "The students wave while one gets on the bus, so the word for leaving is the one to use.",
      hints: [
        "Ask yourself if the friends are meeting or leaving.",
        "Look at what the bus and the corner word tell you.",
        "One student is getting on the bus and the corner word says the day is ending.",
      ],
      confusions: [
        {
          pick: "buenos-dias",
          tag: "meeting-or-leaving",
          hint: "Ask yourself if the students are starting a talk or finishing one. Which greeting starts a day?",
          model: "The students wave while one gets on the bus, so the word for leaving is the one to use.",
        },
      ],
    },
  ],
  distractors: [
    {
      id: "d-bien",
      term: "bien",
      tag: "fine-not-happy",
      hint: "That word means fine or okay. Does this face show just okay, or something stronger?",
      pairIds: ["feliz", "triste"],
    },
    {
      id: "d-buenas-noches",
      term: "buenas noches",
      tag: "night-greeting",
      hint: "That greeting is for after dark. Look at the sky and the time word in the picture.",
      pairIds: ["buenos-dias", "buenas-tardes"],
    },
    {
      id: "d-hasta-luego",
      term: "hasta luego",
      tag: "see-you-later",
      hint: "That phrase is a goodbye for people you will see again soon. Check what the picture shows.",
      pairIds: ["adios"],
    },
  ],
  supports: {
    ee: {
      directions:
        "Say the Spanish word. Look at the picture. Put the word on the card that matches.",
      frames: ["This face is ___.", "This picture is the ___."],
      wordBank: ["happy", "sad", "tired", "angry", "nervous", "morning", "afternoon", "goodbye"],
      oral: "Say the word and show the feeling with your face.",
    },
    dev: {
      frames: ["I think this is ___ because the ___ looks ___."],
      wordBank: ["eyes", "mouth", "sun", "bus"],
    },
    exp: { frames: ["This matches because the ___ shows ___."] },
    br: {},
  },
  reflection: {
    prompt:
      "Which clue in the face or the picture helped you most? Say it in English or in Spanish.",
    frames: {
      ee: ["I looked at the ___.", "The ___ helped me."],
      dev: ["The ___ helped me know it was ___.", "I mixed up ___ and ___ at first."],
      exp: ["The clue that helped most was the ___ because ___."],
      br: ["I distinguished ___ from ___ by comparing ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

// Parallel transfer questions for the pairs that do not carry their own.
const TRANSFER = {
  "triste": { prompt: "Ana's puppy is lost and she is crying. Which sentence tells how she feels?", options: [{ id: "a", text: "Estoy triste." }, { id: "b", text: "Estoy feliz." }, { id: "c", text: "Estoy nerviosa." }], answer: "a", explain: "Crying about a lost puppy shows she feels sad, so she says estoy triste." },
  "enojado": { prompt: "Tomás frowns and crosses his arms because his brother broke his toy. Which sentence tells how he feels?", options: [{ id: "a", text: "Estoy enojado." }, { id: "b", text: "Estoy cansado." }, { id: "c", text: "Estoy feliz." }], answer: "a", explain: "A frown, crossed arms and a broken toy show he feels angry, so he says estoy enojado." },
  "nervioso": { prompt: "Lucía will read in front of the whole school and her hands are shaking. Which sentence tells how she feels?", options: [{ id: "a", text: "Estoy nerviosa." }, { id: "b", text: "Estoy triste." }, { id: "c", text: "Estoy bien." }], answer: "a", explain: "Shaking hands before a big moment show she feels nervous, so she says estoy nerviosa." },
  "buenas-tardes": { prompt: "You see your cousin at 3 in the afternoon. Which greeting fits?", options: [{ id: "a", text: "Buenas tardes" }, { id: "b", text: "Buenos días" }, { id: "c", text: "Adiós" }], answer: "a", explain: "Three in the afternoon is after lunch, so you say buenas tardes." },
  "adios": { prompt: "You get on the bus to go home and wave to your friend. What do you say?", options: [{ id: "a", text: "Adiós" }, { id: "b", text: "Hola" }, { id: "c", text: "Buenos días" }], answer: "a", explain: "You are leaving, so you say adiós." },
};
activity.pairs = activity.pairs.map((p) => ({ ...p, transfer: p.transfer ?? TRANSFER[p.id] }));

export default activity;
