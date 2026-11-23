// Grade 2 Spanish, novice level: greetings, goodbyes and feeling words. Entries are the Spanish target language; definitions are in English.
// Pronunciation uses speak() with lang "es-US" (speechLang). Original text.
import { ESTOY_VISUAL, face, greeting } from "../kits/c8-spanish-greetings.js";

const common = { domains: ["Speaking", "Listening"], klu: "Inform" };

export default {
  id: "g2-world-languages-greetings-and-feelings-spanish",
  title: "Greetings and Feelings in Spanish: Words and Phrases",
  grade: "2",
  band: "k-2",
  subject: "world-languages",
  speechLang: "es-US",
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to the ACTFL World-Readiness communication standards at the novice level; not mapped to a district unit sequence.",
  },
  standards: ["ACTFL.1.1", "ACTFL.1.2"],
  entries: [
    {
      id: "hola",
      word: "hola",
      pos: "greeting",
      pron: "OH-lah",
      def: "A friendly word for saying hello at any time of day. The h is silent.",
      visual: greeting("any", "¡Hola!"),
      context: "¡Hola, Ana! (Hello, Ana!)",
      nonExample: "Adiós is not hola. Hola starts a talk; adiós ends it.",
      academicSentence: "We say hola when we see a friend.",
      everyday: "Like a wave and a smile in the hallway.",
      misconception: "The letter h is silent in Spanish, so hola sounds like OH-lah, not HOH-lah.",
      related: ["buenos-dias", "adios"],
      practice: {
        visualPrompt: "Which picture shows someone saying hola?",
        speakWrite:
          "Wave and say hola to a partner in a quiet voice and then a happy voice. Write the word.",
        retrieval: "Yesterday we learned a word to start a talk. Which Spanish word is it?",
      },
      ...common,
    },
    {
      id: "buenos-dias",
      word: "buenos días",
      pos: "greeting",
      pron: "BWEH-nohs DEE-ahs",
      def: "A greeting for the morning. It means good day, and we use it before lunch.",
      visual: greeting("morning", "¡Buenos días!"),
      context: "¡Buenos días, maestra! (Good morning, teacher!)",
      nonExample: "Buenos días is not for the afternoon. After lunch we say buenas tardes.",
      academicSentence: "We say buenos días when the day is just beginning.",
      everyday: "Like saying good morning when you get off the bus.",
      misconception:
        "Días has an accent mark over the i. It shows that the i is said strongly: DEE-ahs.",
      morphology: {
        parts: [
          { part: "buenos", meaning: "good" },
          { part: "días", meaning: "days" },
        ],
      },
      related: ["buenas-tardes", "hola"],
      practice: {
        visualPrompt: "Which picture shows the start of the school day?",
        speakWrite:
          "Walk in like it is morning, wave and say buenos días. Write the phrase with its accent mark.",
        retrieval: "Which greeting do we use in the morning?",
      },
      ...common,
    },
    {
      id: "buenas-tardes",
      word: "buenas tardes",
      pos: "greeting",
      pron: "BWEH-nahs TAR-dehs",
      def: "A greeting for the afternoon. It means good afternoon.",
      visual: greeting("afternoon", "¡Buenas tardes!"),
      context: "Buenas tardes, abuela. (Good afternoon, grandmother.)",
      nonExample: "Buenas tardes is not for the morning. Before lunch we say buenos días.",
      academicSentence: "We say buenas tardes after lunch.",
      everyday: "Like greeting the bus driver on the ride home.",
      misconception: "The first word ends in -as here, not -os: buenas tardes, but buenos días.",
      morphology: {
        parts: [
          { part: "buenas", meaning: "good" },
          { part: "tardes", meaning: "afternoons" },
        ],
      },
      related: ["buenos-dias", "adios"],
      practice: {
        visualPrompt: "Which picture shows the afternoon, with the sun high and a backpack?",
        speakWrite:
          "Pretend you are picking up a backpack after lunch. Say buenas tardes and write the phrase.",
        retrieval: "Which greeting do we use after lunch?",
      },
      ...common,
    },
    {
      id: "adios",
      word: "adiós",
      pos: "greeting",
      pron: "ah-DYOHS",
      def: "A word for saying goodbye. The strong part is the second part: ah-DYOHS.",
      visual: greeting("leaving", "¡Adiós!"),
      context: "¡Adiós, Luis! (Goodbye, Luis!)",
      nonExample: "Hola is not adiós. Hola opens a talk; adiós closes it.",
      academicSentence: "We say adiós when we leave.",
      everyday: "Like waving from the bus window.",
      misconception:
        "Students often leave out the accent mark. It shows where the strong sound is: adiós.",
      related: ["hasta-luego", "hola"],
      practice: {
        visualPrompt: "Which picture shows someone leaving?",
        speakWrite: "Wave goodbye and say adiós. Write the word with the accent mark.",
        retrieval: "Which Spanish word ends a talk? Which word starts it?",
      },
      ...common,
    },
    {
      id: "hasta-luego",
      word: "hasta luego",
      pos: "phrase",
      pron: "AH-stah LWEH-goh",
      def: "A phrase for saying goodbye when you will see the person again soon. It means see you later.",
      visual: greeting("later", "¡Hasta luego!"),
      context: "¡Hasta luego, amigo! (See you later, friend!)",
      nonExample: "Hasta luego is not hello. It is a goodbye for people you will see again.",
      academicSentence: "We say hasta luego when we will meet again soon.",
      everyday: "Like telling a classmate you will see them at recess.",
      morphology: {
        parts: [
          { part: "hasta", meaning: "until" },
          { part: "luego", meaning: "later" },
        ],
      },
      related: ["adios", "buenas-tardes"],
      practice: {
        visualPrompt:
          "Which picture shows friends who will meet again soon, with a calendar and a clock?",
        speakWrite:
          "Say hasta luego to a partner and name when you will see each other, in English. Write the phrase.",
        retrieval: "Which phrase means see you later?",
      },
      ...common,
    },
    {
      id: "como-estas",
      word: "¿Cómo estás?",
      pos: "question",
      pron: "KOH-moh eh-STAHS",
      def: "A question that asks how a friend feels. It means how are you?",
      visual: {
        kind: "scene",
        bg: "room",
        w: 480,
        h: 320,
        alt: "Two students stand face to face. One has a speech bubble that says Cómo estás with an upside-down question mark first.",
        items: [
          { icon: "student", x: 80, y: 150, s: 110 },
          { icon: "student", x: 290, y: 150, s: 110 },
          { t: "rect", x: 40, y: 60, w: 200, h: 44, rx: 18, fill: "paper", stroke: "ink", sw: 3 },
          { t: "text", x: 140, y: 89, text: "¿Cómo estás?", size: 20, weight: 700 },
        ],
      },
      context: "Hola, Sam. ¿Cómo estás? (Hello, Sam. How are you?)",
      nonExample: "Estoy bien is not a question. It is an answer to ¿Cómo estás?",
      academicSentence: "We ask ¿Cómo estás? to find out how a friend feels.",
      everyday: "Like asking a friend how their day is going.",
      misconception:
        "The accent marks matter. Cómo and estás each have one, and a question starts with an upside-down mark.",
      morphology: {
        parts: [
          { part: "cómo", meaning: "how" },
          { part: "estás", meaning: "you are" },
        ],
      },
      related: ["estoy", "bien"],
      practice: {
        visualPrompt: "Which picture shows a person asking a question?",
        speakWrite:
          "Ask a partner ¿Cómo estás? with your voice going up at the end. Write the question with both question marks.",
        retrieval: "Which Spanish question asks how someone feels?",
      },
      ...common,
    },
    {
      id: "estoy",
      word: "estoy",
      pos: "verb",
      pron: "eh-STOY",
      def: "A word that means I am. We use it to tell how we feel.",
      visual: ESTOY_VISUAL,
      context: "Estoy contento hoy. (I am happy today.)",
      nonExample: "Estás is not estoy. Estás means you are, so it talks about the other person.",
      academicSentence: "We say estoy and then a feeling word to tell how we feel.",
      everyday: "Like starting a sentence with I am and then adding the feeling.",
      misconception:
        "Estoy (I am) and estás (you are) sound alike. Estoy ends with the sound oy and is about me.",
      related: ["como-estas", "feliz"],
      practice: {
        visualPrompt: "Which picture shows a student ready to say how they feel?",
        speakWrite: "Point to yourself and say estoy, then add a feeling word. Write the sentence.",
        retrieval: "Which word means I am in a feeling sentence?",
      },
      ...common,
    },
    {
      id: "feliz",
      word: "feliz",
      pos: "adjective",
      pron: "feh-LEES",
      def: "A feeling word for being happy, with a big smile.",
      visual: face("feliz"),
      context: "Estoy feliz porque hoy es viernes. (I am happy because today is Friday.)",
      nonExample: "Triste is not feliz. A sad face has a mouth that curves down.",
      academicSentence: "We say estoy feliz when we feel happy.",
      everyday: "Like the feeling when you get to play your favorite game.",
      misconception:
        "Feliz does not change its ending for boys or girls. Everyone says estoy feliz.",
      related: ["triste", "bien"],
      practice: {
        visualPrompt: "Which face shows feliz?",
        speakWrite: "Make a happy face and say estoy feliz. Write the sentence.",
        retrieval: "Which feeling word goes with a big smile?",
      },
      ...common,
    },
    {
      id: "triste",
      word: "triste",
      pos: "adjective",
      pron: "TREES-teh",
      def: "A feeling word for being sad, with a mouth that curves down.",
      visual: face("triste"),
      context: "Estoy triste porque mi amigo se fue. (I am sad because my friend left.)",
      nonExample: "Feliz is not triste. A happy face has a mouth that curves up.",
      academicSentence: "We say estoy triste when we feel sad.",
      everyday: "Like the feeling when a rainy day cancels recess.",
      misconception: "Triste ends with -e and does not change. Everyone says estoy triste.",
      related: ["feliz", "enojado"],
      practice: {
        visualPrompt: "Which face shows triste?",
        speakWrite: "Make a sad face and say estoy triste in a quiet voice. Write the sentence.",
        retrieval: "Which feeling word goes with a tear and a downturned mouth?",
      },
      ...common,
    },
    {
      id: "cansado",
      word: "cansado",
      pos: "adjective",
      pron: "kahn-SAH-doh",
      def: "A feeling word for being tired. A girl or woman can say cansada.",
      visual: face("cansado"),
      context: "Estoy cansado después del recreo. (I am tired after recess.)",
      nonExample:
        "Nervioso is not cansado. A nervous face has wide eyes; a tired face has heavy eyes.",
      academicSentence: "We say estoy cansado when we need to rest.",
      everyday: "Like yawning at the end of a long day.",
      misconception:
        "This word has two endings: cansado and cansada. Both are right; the ending matches the speaker.",
      morphology: {
        parts: [
          { part: "cansad-", meaning: "tired" },
          { part: "-o / -a", meaning: "the ending that matches the speaker" },
        ],
      },
      related: ["nervioso", "bien"],
      practice: {
        visualPrompt: "Which face shows cansado, with heavy eyes and a yawn?",
        speakWrite: "Yawn, stretch and say estoy cansado or estoy cansada. Write the sentence.",
        retrieval: "Which feeling word goes with a yawn?",
      },
      ...common,
    },
    {
      id: "enojado",
      word: "enojado",
      pos: "adjective",
      pron: "eh-noh-HAH-doh",
      def: "A feeling word for being angry. A girl or woman can say enojada.",
      visual: face("enojado"),
      context: "Estoy enojado porque perdí mi lápiz. (I am angry because I lost my pencil.)",
      nonExample:
        "Triste is not enojado. An angry face has eyebrows pointing down and a flat mouth.",
      academicSentence: "We say estoy enojado when we feel angry.",
      everyday: "Like the feeling when someone breaks your drawing.",
      misconception:
        "The j sounds like an English h: eh-noh-HAH-doh. This word also has two endings: enojado and enojada.",
      morphology: {
        parts: [
          { part: "enojad-", meaning: "angry" },
          { part: "-o / -a", meaning: "the ending that matches the speaker" },
        ],
      },
      related: ["triste", "nervioso"],
      practice: {
        visualPrompt: "Which face shows enojado, with eyebrows pointing down?",
        speakWrite:
          "Cross your arms and say estoy enojado or estoy enojada. Then take a deep breath and say estoy bien. Write one sentence.",
        retrieval: "Which feeling word goes with eyebrows pointing down?",
      },
      ...common,
    },
    {
      id: "nervioso",
      word: "nervioso",
      pos: "adjective",
      pron: "nehr-vee-OH-soh",
      def: "A feeling word for being nervous, like before a test or a show. A girl or woman can say nerviosa.",
      visual: face("nervioso"),
      context: "Estoy nervioso antes del concierto. (I am nervous before the concert.)",
      nonExample:
        "Cansado is not nervioso. A tired person feels sleepy; a nervous person feels jumpy.",
      academicSentence: "We say estoy nervioso when we feel worried about something coming up.",
      everyday: "Like the butterflies before you read aloud.",
      misconception: "This word also has two endings: nervioso and nerviosa. Both are right.",
      morphology: {
        parts: [
          { part: "nervios-", meaning: "nerves" },
          { part: "-o / -a", meaning: "the ending that matches the speaker" },
        ],
      },
      related: ["cansado", "enojado"],
      practice: {
        visualPrompt: "Which face shows nervioso, with wide eyes and a wavy mouth?",
        speakWrite:
          "Shake your hands a little and say estoy nervioso or estoy nerviosa. Write the sentence.",
        retrieval: "Which feeling word goes with a wavy mouth and a sweat drop?",
      },
      ...common,
    },
    {
      id: "bien",
      word: "bien",
      pos: "adverb",
      pron: "BYEHN",
      def: "A word that means well or fine. It is a common answer to how are you?",
      visual: face("bien"),
      context: "Estoy bien, gracias. (I am fine, thank you.)",
      nonExample: "Mal is not bien. Mal means bad, and bien means fine.",
      academicSentence: "We say estoy bien when we feel okay.",
      everyday: "Like giving a thumbs up when a friend asks about your day.",
      misconception: "Bien never changes its ending. Everyone says estoy bien.",
      related: ["como-estas", "feliz"],
      practice: {
        visualPrompt: "Which face shows someone who is fine, with a gentle smile?",
        speakWrite: "Give a thumbs up and say estoy bien. Write the sentence.",
        retrieval: "Which word answers ¿Cómo estás? when you feel okay?",
      },
      ...common,
    },
  ],
  review: { status: "authored", checks: {} },
};
