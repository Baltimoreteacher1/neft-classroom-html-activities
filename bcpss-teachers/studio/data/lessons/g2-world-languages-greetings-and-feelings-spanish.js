// Lesson pack: Greetings and Feelings in Spanish (grade 2 world languages, novice level). Original text and pictures.
import {
  CONVERSATION_VISUAL,
  ESTOY_VISUAL,
  face,
  faceRow,
  greeting,
} from "../kits/c8-spanish-greetings.js";

export default {
  id: "g2-world-languages-greetings-and-feelings-spanish",
  kind: "lesson",
  title: "Greetings and Feelings in Spanish",
  subtitle: "Greet a friend, ask how they feel and answer with Estoy ___",
  grade: "2",
  band: "k-2",
  subject: "world-languages",
  duration: 35,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to the ACTFL World-Readiness communication standards (interpersonal and interpretive) at the novice level; not mapped to a district unit sequence. All words, pictures and dialogues are original.",
  },
  standards: ["ACTFL.1.1", "ACTFL.1.2"],
  wida: { eld: ["ELD-SI"], klus: ["Inform"], domains: ["Speaking", "Listening"], cluster: "2-3" },
  contentObjective:
    "I can greet a classmate in Spanish and tell how I feel using Estoy and a feeling word.",
  languageObjective:
    "I can ask '¿Cómo estás?' and answer 'Estoy ___' with a partner, using a feeling word such as feliz or cansado.",
  languageDemands: {
    functions: ["greet someone", "ask how someone feels", "tell how I feel", "say goodbye"],
    structures: [
      "Hola. / Buenos días. / Buenas tardes.",
      "¿Cómo estás?",
      "Estoy ___. (feliz, triste, cansado, enojado, nervioso, bien)",
      "Adiós. / Hasta luego.",
    ],
    discourse:
      "A short three-turn exchange: greet, ask and answer, say goodbye. Learners rehearse it chorally, then with a partner, then with a new feeling word.",
    barriers: [
      "the letter h is silent, so hola sounds like OH-lah",
      "estoy (I am) and estás (you are) sound alike and flip who the sentence is about",
      "accent marks (días, estás, adiós) show where the strong sound falls and can change the word",
      "feeling words such as cansado have two endings (-o and -a)",
      "a question begins with an upside-down question mark and an exclamation begins with an upside-down exclamation mark",
    ],
    oralRehearse: ["Buenos días. ¿Cómo estás?", "Estoy feliz. ¿Y tú?", "Adiós. Hasta luego."],
    writeScaffold: "Hola. ¿Cómo estás? Estoy ___. Adiós.",
  },
  vocab: {
    collection: "g2-world-languages-greetings-and-feelings-spanish",
    ids: [
      "hola",
      "buenos-dias",
      "buenas-tardes",
      "adios",
      "hasta-luego",
      "como-estas",
      "estoy",
      "feliz",
      "triste",
      "cansado",
      "enojado",
      "nervioso",
      "bien",
    ],
  },
  launch: {
    title: "Notice and Wonder: a hello in the hallway",
    visual: CONVERSATION_VISUAL,
    prompts: [
      "What do you notice about the two students?",
      "What do you think the words in the speech bubbles mean? How do you know?",
      "What do you wonder about this hello?",
    ],
    teacherNote:
      "Show the picture with the bubbles covered first and ask what the students might be doing. Then reveal the bubbles. Accept guesses from gestures and context ('they are saying hi'). Point out that the second bubble starts with an upside-down question mark and ask what that might mean. Do not translate yet; let students tell you what they think the words mean, then confirm.",
  },
  teach: {
    model: [
      "People who speak Spanish greet each other with different words at different times of day. Hola works any time. Buenos días is for the morning, before lunch. Buenas tardes is for the afternoon, after lunch. Teach each one with a picture of the sky: a low sun for the morning and a high sun with a backpack for the afternoon.",
      "To say goodbye, say adiós. If you will see the person again soon, say hasta luego, which means see you later. Wave when you say them. Have students stand and wave as they say each one.",
      "To ask a friend how they feel, say ¿Cómo estás? Notice the upside-down question mark at the start. It tells the reader that a question is coming. The accent marks over the o in cómo and the a in estás show where the strong sound falls.",
      "To answer, say Estoy and then a feeling word. Estoy means I am. Teach six feeling words with faces: feliz (happy), triste (sad), cansado (tired), enojado (angry), nervioso (nervous) and bien (fine). Hold up a face, say the word, and have students copy the face and the word together.",
      "Some feeling words have two endings. A person may say cansado or cansada, enojado or enojada, and nervioso or nerviosa. Feliz, triste and bien do not change. At this level, show both endings and let students choose the ending they want to use.",
      "Compare cultures lightly. In many Spanish-speaking families, friends and relatives greet with a hug or a kiss on the cheek, and at school a wave or a handshake is common. Ask students how they greet people at home and what is the same and what is different.",
    ],
    moves: [
      "Say each word, then have students echo it three ways: whisper, normal and excited. Use a gesture for each word so meaning does not depend on English.",
      "Keep the six faces on the board all lesson. Point to a face and have students say Estoy plus the feeling word chorally before any partner work.",
      "Teach the sentence Estoy ___ as a frame with a blank card and slide a feeling word card in.",
      "Never require a student to share a real feeling. Give a pass card, and let students pick a feeling for practice ('pick any face'). Feelings talk is language practice, not a check-in.",
      "Model the full exchange yourself with a puppet or a student volunteer before partners try it: greeting, question, answer, goodbye.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt:
        "It is eight o'clock in the morning and you walk into class. Which greeting fits best?",
      choices: ["Buenas tardes", "Buenos días", "Adiós", "Estoy triste"],
      answer: 1,
      hint: "Think about the sun and the part of the day when school is just starting.",
      supports: {
        ee: {
          frames: ["In the morning I say ___."],
          wordBank: ["buenos días", "buenas tardes", "adiós"],
          visual: greeting("morning"),
          oral: "Point to the low sun and say the morning greeting.",
        },
        dev: { frames: ["I say buenos días when ___."], wordBank: ["morning", "afternoon"] },
        exp: { frames: ["The greeting fits because it is ___."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt:
        "A friend asks you ¿Cómo estás? You yawn and your eyes feel heavy. Which answer tells your friend how you feel?",
      choices: ["Estoy enojado.", "Estoy nervioso.", "Estoy cansado.", "Estoy feliz."],
      answer: 2,
      hint: "Which feeling goes with a yawn and heavy eyes?",
      supports: {
        ee: {
          frames: ["Estoy ___."],
          wordBank: ["cansado", "feliz", "triste", "enojado"],
          visual: face("cansado"),
          oral: "Yawn and say the word that matches the face.",
        },
        dev: { frames: ["I yawn, so I say estoy ___."], wordBank: ["tired", "sleepy"] },
        exp: { frames: ["I chose ___ because yawning means ___."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "choice",
      prompt:
        "Look at the face with a tear and a mouth that curves down. Which sentence goes with it?",
      choices: ["Estoy feliz.", "Estoy triste.", "Estoy nervioso.", "Estoy bien."],
      answer: 1,
      hint: "Check which way the mouth curves and look for the tear.",
      supports: {
        ee: {
          frames: ["The face is ___."],
          wordBank: ["triste", "feliz"],
          visual: face("triste"),
          oral: "Make the same face and say the word.",
        },
        dev: { frames: ["The mouth curves ___, so the face is ___."], wordBank: ["down", "up"] },
        exp: { frames: ["The mouth and the tear show ___."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "short",
      prompt:
        "Put these in order to make a short talk: Adiós. / ¿Cómo estás? / Estoy bien. / Hola. Write the four lines in the order you would say them.",
      answer: "Hola. ¿Cómo estás? Estoy bien. Adiós.",
      hint: "A talk starts with a hello, has a question and an answer in the middle, and ends with a goodbye.",
      supports: {
        ee: {
          frames: ["First I say ___.", "Last I say ___."],
          wordBank: ["hola", "adiós", "¿Cómo estás?", "Estoy bien"],
          visual: CONVERSATION_VISUAL,
          oral: "Act out the talk with a partner, then write it.",
        },
        dev: {
          frames: ["First ___, then ___, then ___, last ___."],
          wordBank: ["hello", "goodbye", "question", "answer"],
        },
        exp: { frames: ["I put ___ first because ___."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Hello stations: three ways to greet",
    task: "Set up three stations with a picture each: the morning (low sun), the afternoon (high sun and a backpack) and the end of the day (bus and clock). Partners visit each station and act out a short hello for that picture: greeting, ¿Cómo estás?, Estoy ___ with a feeling word they choose, and goodbye. At each station they pick a different feeling word. After the third station the partners agree on the one feeling word they found hardest to say and teach it to another pair.",
    roles: ["Greeter", "Answerer"],
    discussionCards: [
      {
        prompt: "Which greeting did you use at the morning station? How did you know?",
        frame: "I said ___ because the picture shows ___.",
      },
      {
        prompt: "Which feeling word did you choose? Show it with your face.",
        frame: "Estoy ___. My face shows ___.",
      },
      {
        prompt: "How is this hello the same as a hello in our class? How is it different?",
        frame: "It is the same because ___. It is different because ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: three feelings, three faces",
      visualOrModel: faceRow(["feliz", "triste", "cansado"]),
      teacherNote:
        "Point to each face. Ask what changes from face to face: eyes, eyebrows, mouth. Say the Spanish word and have students copy the face. Then say a word without showing the picture and have students make the face.",
    },
    discuss: {
      title: "Say it: ask and answer",
      structure:
        "Partners face each other. Partner A asks ¿Cómo estás? Partner B answers Estoy ___ and asks ¿Y tú? Partner A answers. Then they swap. Use a new feeling word each round.",
      frames: ["¿Cómo estás?", "Estoy ___.", "¿Y tú?", "Estoy ___, gracias."],
    },
    apply: {
      title: "Use it: a morning hello for a visitor",
      task: "A visitor who speaks Spanish comes to class at the start of the day. Act out a hello with a partner. One partner is the visitor and one is the student. Greet, ask how the visitor feels, answer, and say goodbye at the end.",
      successCriteria: [
        "I use a greeting that fits the morning.",
        "I ask ¿Cómo estás? and I answer with Estoy and a feeling word.",
        "I say adiós or hasta luego at the end.",
        "I look at my partner and listen to what they say.",
      ],
    },
  },
  activities: [
    { engine: "visual-match", id: "g2-spanish-feelings-match" },
    { engine: "conversation-studio", id: "g2-spanish-greeting-conversation" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "choice",
        prompt: "Which greeting do you say in the morning, when the day is starting?",
        choices: ["Buenas tardes", "Buenos días", "Adiós", "Hasta luego"],
        answer: 1,
        explain: "Buenos días is the morning greeting. Buenas tardes is for the afternoon.",
      },
      {
        id: "i2",
        type: "choice",
        prompt: "A friend asks ¿Cómo estás? You feel very sleepy. Which answer tells how you feel?",
        choices: ["Estoy enojado.", "Estoy nervioso.", "Estoy cansado.", "Estoy feliz."],
        answer: 2,
        explain: "Cansado means tired, so Estoy cansado tells that you feel sleepy.",
      },
      {
        id: "i3",
        type: "choice",
        prompt: "Which word means goodbye?",
        choices: ["hola", "adiós", "bien", "feliz"],
        answer: 1,
        explain: "Adiós is a goodbye. Hola is hello, bien is fine and feliz is happy.",
      },
      {
        id: "i4",
        type: "choice",
        prompt: "What does ¿Cómo estás? ask?",
        choices: [
          "What is your name?",
          "How do you feel?",
          "Where are you going?",
          "What time is it?",
        ],
        answer: 1,
        explain: "¿Cómo estás? asks how you feel. Your name is asked with a different question.",
      },
      {
        id: "i5",
        type: "choice",
        prompt: "What does estoy mean in the sentence Estoy triste?",
        choices: ["I am", "you are", "goodbye", "sad"],
        answer: 0,
        explain: "Estoy means I am. Triste is the feeling word that means sad.",
      },
      {
        id: "i6",
        type: "short",
        prompt:
          "Write a four-line talk in Spanish: a greeting, a question about feelings, an answer and a goodbye.",
        answer: "Hola. ¿Cómo estás? Estoy bien. Adiós.",
        explain:
          "Any greeting, the question ¿Cómo estás?, Estoy and a feeling word, and a goodbye is a correct talk.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "choice",
        prompt: "It is after lunch and you see your bus driver. Which greeting fits?",
        choices: ["Buenos días", "Buenas tardes", "Estoy bien", "¿Cómo estás?"],
        answer: 1,
        explain: "After lunch is the afternoon, so we say buenas tardes.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "Which face goes with Estoy triste?",
        choices: [
          "A face with a big smile",
          "A face with a tear and a mouth that curves down",
          "A face with a yawn",
        ],
        answer: 1,
        explain: "Triste means sad, so the face with a tear and a downturned mouth goes with it.",
      },
      {
        id: "f3",
        type: "short",
        prompt:
          "Write one sentence in Spanish that tells how you feel. Use Estoy and a feeling word.",
        answer: "Estoy feliz.",
        explain: "Any sentence that starts with Estoy and uses a real feeling word is correct.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what you can say in Spanish.",
    items: [
      {
        id: "e1",
        type: "choice",
        prompt: "You see your teacher at the start of the day. What do you say?",
        choices: ["Adiós", "Buenos días", "Hasta luego", "Estoy cansado"],
        answer: 1,
        explain: "Buenos días is the greeting for the start of the day.",
      },
      {
        id: "e2",
        type: "short",
        prompt: "Write or say how you feel. Start with Estoy.",
        answer: "Estoy feliz.",
        explain: "Estoy and any feeling word answers the question.",
      },
      {
        id: "e3",
        type: "short",
        prompt: "How do you ask a friend how they feel in Spanish?",
        answer: "¿Cómo estás?",
        explain: "¿Cómo estás? is the question that asks how a friend feels.",
      },
    ],
    successCriteria: [
      "I chose a greeting that fits the time of day.",
      "I said or wrote Estoy and a feeling word.",
      "I know the question that asks how someone feels.",
    ],
  },
  answerKey: {
    notes:
      "Accept spoken or written answers. For the short items, look for the pattern (greeting, question, Estoy plus a feeling word, goodbye) rather than one fixed sentence. Do not mark down missing accent marks in grade 2 writing, but show students the marks and say them. Accept cansada, enojada and nerviosa in place of the -o forms.",
    items: {
      g1: "Buenos días. It is the morning greeting.",
      g2: "Estoy cansado (or cansada). Yawning and heavy eyes mean tired.",
      g3: "Estoy triste. The tear and the downturned mouth show a sad face.",
      g4: "Hola. ¿Cómo estás? Estoy bien. Adiós.",
      i1: "Buenos días.",
      i2: "Estoy cansado.",
      i3: "adiós.",
      i4: "How do you feel?",
      i5: "I am.",
      i6: "Hola. ¿Cómo estás? Estoy bien. Adiós. (Any correct pattern is fine.)",
      f1: "Buenas tardes.",
      f2: "A face with a tear and a mouth that curves down.",
      f3: "Estoy feliz. (Any feeling word is fine.)",
      e1: "Buenos días.",
      e2: "Estoy feliz. (Any feeling word is fine.)",
      e3: "¿Cómo estás?",
    },
  },
  extension: {
    title: "Greetings around our school",
    task: "Ask two people at home or at school how they greet friends and family and write down what you hear: a wave, a handshake, a hug or words in another language. Make a small poster with a picture of each way and write hola and one feeling word on it. Share your poster and say one thing that is the same and one thing that is different from how you greet people.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo saludar a un amigo en español y decir cómo me siento con la frase Estoy y una palabra de sentimiento.",
      vocab: [
        { en: "hello", es: "hola", verified: false },
        { en: "good morning", es: "buenos días", verified: false },
        { en: "good afternoon", es: "buenas tardes", verified: false },
        { en: "goodbye", es: "adiós", verified: false },
        { en: "how are you?", es: "¿cómo estás?", verified: false },
        { en: "happy", es: "feliz", verified: false },
        { en: "sad", es: "triste", verified: false },
        { en: "tired", es: "cansado", verified: false },
      ],
      familyPrompt:
        "Pregunten en casa: ¿Cómo estás? Respondan con Estoy y una palabra de sentimiento. Cuenten cómo se saludan en su familia: con una palabra, un abrazo o un beso.",
    },
  },
  printables: ["vocab-mat", "sort-match", "task-cards", "exit-ticket"],
  teacherNotes: {
    pacing:
      "Launch 4 minutes. Teach words with gestures 9. Guided practice 6. Visual match activity 8 or hello stations 8. Conversation activity 6. Exit ticket 3. If time is short, run the visual match as a whole-class game and move the conversation rehearsal to the next day.",
    misconceptions: [
      "Time-of-day mix-up: students say buenos días at any time. Tie each greeting to a picture of the sky and ask 'what part of the day is it?' before they speak.",
      "Estoy and estás: students say Estás feliz when they mean I am happy. Point to yourself for estoy and to a partner for estás, and chant both with the gesture.",
      "Silent h: students say HOH-lah. Write h in light grey and have them say 'the h is sleeping'.",
      "Missing -o/-a: students think cansado and cansada are two words. Show both endings together and tell students either one is right at this level.",
      "Statements read as questions: students leave off the opening question mark. Show the upside-down marks in a different color.",
    ],
    differentiation:
      "Entering and Emerging learners point to a face, say the word and use the frame Estoy ___ with the word bank. Developing learners add gracias and ¿Y tú? Expanding and Bridging learners add a reason in English after the Spanish sentence ('Estoy cansado. I stayed up late.') and ask a follow-up question. The tasks and the target words never change.",
    languageNotes:
      "Most students are learning Spanish as a new language; some may speak Spanish at home and can act as language models, but never require it. Keep feelings talk optional and playful: students may choose any face for practice. Regional notes: enojado is common in Latin America and some families say enfadado; accept both from home speakers.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
