// conversation-studio: a short morning hello in Spanish (grade 2 world languages). Interpersonal mode, novice level.
import { CONVERSATION_VISUAL } from "../kits/c8-spanish-greetings.js";

const turn = (id, prompt, moveId, options) => ({ id, speaker: "you", prompt, moveId, options });

export default {
  id: "g2-spanish-greeting-conversation",
  engine: "conversation-studio",
  title: "Talk It Through: A Morning Hello in Spanish",
  grade: "2",
  band: "k-2",
  subject: "world-languages",
  lessonId: "g2-world-languages-greetings-and-feelings-spanish",
  standards: ["ACTFL.1.1"],
  vocabIds: ["hola", "buenos-dias", "como-estas", "estoy", "adios", "feliz", "cansado"].map(
    (id) => `g2-world-languages-greetings-and-feelings-spanish:${id}`,
  ),
  minutes: 12,
  intro:
    "Get ready to talk with a friend in Spanish. Pick the words you need, put them in the order of a real talk, and practice what you would say out loud.",
  topic: {
    title: "A hello in the hallway",
    context:
      "It is the start of the school day. A classmate who speaks Spanish waves at you in the hallway. You will say hello, answer a question about how you feel and say goodbye, all in Spanish.",
    visual: CONVERSATION_VISUAL,
  },
  roles: [
    {
      id: "speaker",
      label: "Partner A",
      job: "Greets, answers how they feel, and says goodbye in Spanish.",
    },
    {
      id: "friend",
      label: "Partner B",
      job: "Starts the hello, asks how Partner A feels, and listens.",
    },
  ],
  moves: [
    {
      id: "greet",
      label: "Return the greeting",
      function: "Say hello back in a way that fits the time of day.",
      frames: {
        ee: ["Buenos días."],
        dev: ["Buenos días, ___."],
        exp: ["¡Hola! ¡Buenos días, ___!"],
        br: ["¡Buenos días, ___! ¡Hola!"],
      },
      wordBank: { ee: ["buenos días", "hola"], dev: ["amigo", "amiga"], exp: [], br: [] },
      example: "¡Buenos días!",
      listenFor: "A greeting that matches the morning.",
    },
    {
      id: "tell-feeling",
      label: "Tell how you feel",
      function: "Answer the question with Estoy and a feeling word.",
      frames: {
        ee: ["Estoy ___."],
        dev: ["Estoy ___, gracias."],
        exp: ["Estoy ___, gracias. ¿Y tú?"],
        br: ["Hoy estoy ___. ¿Y tú?"],
      },
      wordBank: {
        ee: ["feliz", "triste", "cansado", "enojado", "nervioso", "bien"],
        dev: ["gracias"],
        exp: ["¿Y tú?"],
        br: [],
      },
      example: "Estoy feliz, gracias. ¿Y tú?",
      listenFor: "Estoy followed by a real feeling word.",
    },
    {
      id: "say-goodbye",
      label: "Say goodbye",
      function: "End the talk with a goodbye.",
      frames: {
        ee: ["Adiós."],
        dev: ["Adiós, ___."],
        exp: ["Hasta luego, ___."],
        br: ["Adiós. ¡Hasta luego!"],
      },
      wordBank: { ee: ["adiós", "hasta luego"], dev: [], exp: [], br: [] },
      example: "¡Hasta luego!",
      listenFor: "A goodbye word that closes the talk.",
    },
    {
      id: "ask-feeling",
      label: "Ask how a friend feels",
      function: "Ask a friend how they feel.",
      frames: {
        ee: ["¿Cómo estás?"],
        dev: ["Hola, ___. ¿Cómo estás?"],
        exp: ["Buenos días, ___. ¿Cómo estás?"],
        br: ["¡Hola, ___! ¿Cómo estás hoy?"],
      },
      wordBank: { ee: ["cómo", "estás"], dev: [], exp: [], br: [] },
      example: "¿Cómo estás?",
      listenFor: "A question that starts with an upside-down question mark.",
      notFit: "Your partner already asked you how you feel. Answer the question first.",
    },
    {
      id: "say-night",
      label: "Say good night",
      function: "Say goodbye at the end of the day, after dark.",
      frames: {
        ee: ["Buenas noches."],
        dev: ["Buenas noches, ___."],
        exp: ["Buenas noches, ___. ¡Hasta mañana!"],
        br: ["¡Buenas noches! ¡Hasta mañana!"],
      },
      wordBank: { ee: ["buenas noches"], dev: [], exp: [], br: [] },
      example: "Buenas noches.",
      notFit: "Buenas noches is for after dark. This talk happens in the morning at school.",
    },
    {
      id: "say-name",
      label: "Say your name",
      function: "Tell a new person what you are called.",
      frames: {
        ee: ["Me llamo ___."],
        dev: ["Hola, me llamo ___."],
        exp: ["Hola, me llamo ___. Mucho gusto."],
        br: ["Hola, me llamo ___. ¡Mucho gusto!"],
      },
      wordBank: { ee: ["me llamo"], dev: [], exp: ["mucho gusto"], br: [] },
      example: "Me llamo Ana.",
      notFit: "You already know this classmate. Telling your name is for meeting someone new.",
    },
  ],
  purposes: [
    {
      id: "morning-talk",
      label: "Have a morning hello",
      description: "Greet a friend, tell how you feel, and say goodbye in Spanish.",
      moveIds: ["greet", "tell-feeling", "say-goodbye", "ask-feeling", "say-night", "say-name"],
      plan: {
        prompt:
          "Choose the moves that fit this hallway talk, then put them in the order you would use them.",
        expected: ["greet", "tell-feeling", "say-goodbye"],
        hints: [
          "Think about how a real talk begins, what happens in the middle and how it ends.",
          "Your partner asks you something. What do you owe them in return?",
          "One move belongs to the wrong time of day, one is for meeting someone new, and one asks a question your partner already asked.",
        ],
        model:
          "Say hello back first, answer your partner's question about how you feel, and finish by saying goodbye.",
        why: [
          "A talk starts with a greeting that fits the time of day.",
          "Your partner asked how you feel, so the answer comes next.",
          "A goodbye closes the talk.",
        ],
      },
      rehearsal: {
        intro: "Your partner is a classmate in the hallway at the start of the school day.",
        turns: [
          {
            id: "p1",
            speaker: "partner",
            say: "¡Buenos días!",
            note: "Partner B waves and says the morning greeting.",
          },
          turn("y1", "Say hello back so it fits the morning.", "greet", [
            {
              id: "a",
              text: "¡Buenos días!",
              fit: "strong",
              note: "This greeting fits the morning, the same time of day as your partner's hello.",
            },
            {
              id: "b",
              text: "¡Hola!",
              fit: "partial",
              note: "Hola is a good greeting at any time. Next, try the morning greeting your partner used.",
            },
            {
              id: "c",
              text: "¡Buenas noches!",
              fit: "off",
              note: "Buenas noches is for after dark. This talk is in the morning.",
            },
          ]),
          {
            id: "p2",
            speaker: "partner",
            say: "¿Cómo estás?",
            note: "Partner B asks how you feel. You can pass if you prefer not to share.",
          },
          turn(
            "y2",
            "Tell your partner how you feel. Pick the feeling that is true for you today, or any feeling for practice.",
            "tell-feeling",
            [
              {
                id: "a",
                text: "Estoy cansado, gracias. ¿Y tú?",
                fit: "strong",
                note: "Estoy and a feeling word answer the question, and ¿Y tú? asks your partner back.",
              },
              {
                id: "b",
                text: "Estoy.",
                fit: "partial",
                note: "Estoy means I am, but it needs a feeling word after it, such as feliz or cansado.",
              },
              {
                id: "c",
                text: "Hasta luego.",
                fit: "off",
                note: "That is a goodbye. Your partner asked how you feel, so answer with a feeling.",
              },
            ],
          ),
          {
            id: "p3",
            speaker: "partner",
            say: "Tengo que ir a clase. ¡Hasta luego!",
            note: "Partner B says they have to go to class and says see you later.",
          },
          turn("y3", "Say goodbye to your partner.", "say-goodbye", [
            {
              id: "a",
              text: "¡Adiós! ¡Hasta luego!",
              fit: "strong",
              note: "Both words close the talk, and hasta luego matches what your partner said.",
            },
            {
              id: "b",
              text: "¡Hola!",
              fit: "off",
              note: "Hola starts a talk. Your partner is leaving, so use a goodbye.",
            },
            {
              id: "c",
              text: "Adiós.",
              fit: "partial",
              note: "That is a correct goodbye. You can also answer your partner's hasta luego with the same phrase.",
            },
          ]),
        ],
      },
    },
  ],
  successCriteria: [
    { id: "s1", label: "I said a greeting that fits the time of day." },
    { id: "s2", label: "I said Estoy and a feeling word." },
    { id: "s3", label: "I said a goodbye word at the end of the talk." },
    { id: "s4", label: "I listened to my partner and answered the question I heard." },
  ],
  rubric: {
    criteria: [
      {
        id: "greeting-goodbye",
        label: "Greeting and goodbye",
        levels: [
          { score: 1, descriptor: "Uses English or points; needs a model for every word." },
          { score: 2, descriptor: "Says a greeting or a goodbye in Spanish with a model." },
          { score: 3, descriptor: "Says a greeting and a goodbye in Spanish without help." },
          {
            score: 4,
            descriptor:
              "Chooses a greeting that fits the time of day and ends with a goodbye that matches the partner's.",
          },
        ],
      },
      {
        id: "feeling-sentence",
        label: "Feeling sentence",
        levels: [
          { score: 1, descriptor: "Shows a feeling by pointing or acting but does not say it." },
          { score: 2, descriptor: "Says a feeling word without Estoy." },
          { score: 3, descriptor: "Says Estoy and a feeling word." },
          {
            score: 4,
            descriptor: "Says Estoy and a feeling word, then asks ¿Y tú? to keep the talk going.",
          },
        ],
      },
      {
        id: "listening",
        label: "Listening and responding",
        levels: [
          { score: 1, descriptor: "Needs the question repeated several times." },
          { score: 2, descriptor: "Understands the question after one repeat." },
          {
            score: 3,
            descriptor: "Understands the greeting and the question and answers each one.",
          },
          {
            score: 4,
            descriptor:
              "Answers each turn and adds a gesture or word that shows listening, such as a nod or gracias.",
          },
        ],
      },
    ],
  },
  reflection: {
    prompt: "Which Spanish words were easy to say, and which would you like to practice again?",
    frames: {
      ee: ["I can say ___.", "I want to practice ___."],
      dev: ["It was easy to say ___.", "I want to practice ___ because ___."],
      exp: ["The easiest word was ___ because ___; next time I will practice ___."],
      br: ["I felt confident saying ___; to improve I will practice ___ by ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
