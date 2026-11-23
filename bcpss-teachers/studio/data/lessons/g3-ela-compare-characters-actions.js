// Lesson pack: Compare Characters by What They Do (grade 3 ELA). Original story text, items and examples.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const spill = {
  kind: "scene",
  alt: "A classroom. Wind blows toward a tipped tray with seeds all over the floor. One child is at the door. Another child kneels on the floor near the seeds.",
  longDesc:
    "A room scene with a wind symbol at the top left, three seeds scattered on the floor, one child standing near the door on the right and one child close to the seeds in the middle.",
  bg: "room",
  items: [
    { icon: "wind", x: 20, y: 20, s: 80 },
    { icon: "student", x: 330, y: 60, s: 130, label: "At the door" },
    { icon: "student", x: 150, y: 110, s: 130, label: "On the floor" },
    { icon: "seed", x: 60, y: 240, s: 36 },
    { icon: "seed", x: 250, y: 255, s: 36 },
    { icon: "seed", x: 390, y: 235, s: 36 },
  ],
};

const actionFeeling = {
  kind: "table",
  alt: "A table with two columns. Action, what she does: stomps to the door, says it is all ruined. Feeling, what she feels inside: upset, discouraged.",
  head: ["Action: what she does", "Feeling: what she feels inside"],
  rows: [
    ["Stomps to the door", "upset"],
    ["Says it is all ruined", "discouraged"],
  ],
};

const actionTrait = {
  kind: "flow",
  alt: "Three steps: the action of counting the seeds again, the trait careful, and the proof, he counted them twice.",
  steps: [
    { label: "Action: counts again", icon: "check" },
    { label: "Trait: careful", icon: "brain" },
    { label: "Proof: counted twice", icon: "book" },
  ],
};

const venn = {
  kind: "venn",
  w: 560,
  h: 380,
  alt: "Two overlapping circles. Nia only: walks out, gives up. Theo only: stays, keeps going. Both: same job, same goal.",
  longDesc:
    "A Venn diagram of two story characters facing the same spill. Nia's circle: walks out and gives up at first. Theo's circle: stays and keeps going. The overlap: they have the same job and the same goal, to get the seeds planted.",
  sets: [
    { label: "Nia", items: ["walks out", "gives up"] },
    { label: "Theo", items: ["stays", "keeps going"] },
  ],
  overlap: ["same job", "same goal"],
};

const cause = {
  kind: "flow",
  alt: "Theo keeps working, then Nia sees the cup filling up, then Nia comes back to help.",
  steps: [
    { label: "Theo keeps working", icon: "hand" },
    { label: "Nia sees the cup filling", icon: "eye" },
    { label: "Nia comes back to help", icon: "heart" },
  ],
};

export default {
  id: "g3-ela-compare-characters-actions",
  kind: "lesson",
  title: "Compare Characters by What They Do",
  subtitle:
    "Use actions as evidence for traits, feelings and reasons, then compare two characters in one story",
  grade: "3",
  band: "3-5",
  subject: "ela",
  duration: 45,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to CCSS RL.3.3 and RL.3.1; not mapped to a district unit sequence. The story, items and examples are original.",
  },
  standards: ["RL.3.3", "RL.3.1", "SL.3.1"],
  wida: {
    eld: ["ELD-LA"],
    klus: ["Narrate", "Explain"],
    domains: ["Reading", "Speaking", "Writing"],
    cluster: "2-3",
  },
  contentObjective:
    "I can use what characters do and say as evidence to describe their traits and feelings, and I can compare two characters in one story.",
  languageObjective:
    "I can explain how two characters are different by saying 'Nia ___, but Theo ___' and prove it with 'The story says ___.'",
  languageDemands: {
    functions: [
      "describe a character using evidence",
      "compare and contrast two characters",
      "explain how one action causes another event",
    ],
    structures: [
      "___ is ___ because the story says ___.",
      "___ ___, but ___ ___.",
      "Both ___ and ___ ___.",
      "Because ___ , ___ .",
    ],
    discourse:
      "Two-turn partner talk (claim, then proof), then a written sentence that joins a trait to its evidence with 'because'.",
    barriers: [
      "'character' also means a letter or symbol, and 'trait' is not a word students use at home",
      "'action' (something a person does) is easy to confuse with 'feeling' and 'trait', which are not things you can see",
      "'compare' means tell how alike in this lesson, but students hear it as 'compare and contrast'",
      "the verbs 'stomped', 'knelt' and 'peeked' carry meaning that students need for inference",
      "pronouns 'he' and 'she' are the only signal of which character a sentence is about",
    ],
    oralRehearse: [
      "Nia stomped to the door, but Theo knelt on the floor.",
      "I think Theo is patient because the story says he picked up one seed at a time.",
    ],
    writeScaffold: "___ is ___ because the story says ___. In the story, ___ ___, but ___ ___.",
  },
  vocab: {
    collection: "g3-ela-compare-characters-actions",
    ids: [
      "character",
      "trait",
      "action",
      "motivation",
      "problem",
      "solution",
      "event",
      "compare",
      "contrast",
      "evidence",
      "infer",
      "effect",
    ],
  },
  launch: {
    title: "Notice and Wonder: after the spill",
    visual: spill,
    prompts: [
      "What do you notice about the two children?",
      "What do you wonder about what happened before this picture?",
      "How might each child feel? What in the picture makes you think so?",
    ],
    teacherNote:
      "Show only the picture. Take two noticings and one wondering before naming anything. Students will say 'the girl is mad' or 'the boy is cleaning'. Ask 'What do you see that makes you say that?' so every guess points to something in the picture. Put 'what they do' on one chart and 'what we think about them' on another. Do not read the story yet; the chart is the first hint that actions are evidence.",
  },
  teach: {
    text: {
      title: "The Spilled Seeds",
      note: "Original story. Read aloud twice: first for the story, second for the details students will use as evidence. The same text is the scene in the Story Detective activity.",
      paragraphs: [
        "Nia and Theo were in charge of the class garden. On Monday morning, a strong wind tipped over the tray of bean seeds. Seeds rolled under every desk in the room.",
        'Nia threw her hands up and stomped to the door. "It is all ruined!" she said. "We will never finish by Friday." She sat down in the hall and would not look inside.',
        "Theo took a deep breath and knelt on the floor. He picked up one seed at a time and dropped each one into a cup. When he had twelve seeds, he counted them again to be sure.",
        'After a while, Nia peeked in and saw the cup filling up. "Do you want help?" she asked in a small voice. Theo held out a second cup. "Yes, please. Start under the big desk."',
        'By lunch, the two of them had planted every seed in the soil. Nia smiled and whispered, "Thanks for staying calm."',
      ],
    },
    model: [
      "A character shows us who they are by what they do and say. We cannot see a feeling or a trait, but we can see an action. When Nia throws up her hands and stomps to the door, those actions are evidence. From the evidence we can infer a feeling: she is upset and discouraged.",
      "A trait is a word for what a person is like across the story, such as patient, careless or determined. We do not guess a trait from one sentence. We look for actions that point the same way. Theo picks up one seed at a time and counts them again to be sure. Two careful actions in a row are enough to say that Theo is patient and careful.",
      "A motivation is the reason for an action. Theo works on the floor because he wants the garden to grow. The story never states his reason in one sentence, so we infer it from what is happening and what he says.",
      "To compare two characters, we put their actions side by side. Nia and Theo have the same job and the same trouble. That is how they are alike. They do not do the same thing, though. Nia leaves, but Theo stays. That is how they are different. We use words such as both, but and while to make the likeness or difference clear.",
      "Actions also change what happens next. Theo's steady work has an effect on Nia: she looks in, sees the cup filling up and comes back to help. When one character's action leads to another character's action, we can show it with because or so.",
    ],
    moves: [
      "Read the story aloud once without stopping, then again, pausing after each paragraph for students to say one thing the character did. Write only actions on the board, starting with a verb.",
      "Build a three-column chart with the headings Action, Trait or feeling, and Proof. Fill in one row for Nia and one for Theo together, saying the frame out loud: 'Nia is upset because the story says she stomped to the door.'",
      "Cover the word 'because' on the chart in the second row and ask students to say it again without looking. This shows the joining word is what turns a guess into proof.",
      "Draw a two-circle Venn diagram. Ask 'What is true for both?' before 'What is true for only one?' Students are quick to list differences and need practice starting with a likeness.",
      "Point out the three words that are easy to mix up on the chart: an action you can see, a feeling inside, and a trait across the whole story. Add a gesture to each: act it out, hand on heart, and show a long line with your finger.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt: "Which of these is an action, not a feeling or a trait?",
      choices: ["Nia felt upset.", "Nia stomped to the door.", "Theo is patient."],
      answer: 1,
      hint: "An action is something you could see in a video of the story.",
      supports: {
        ee: {
          frames: ["An action is something a person ___ .", "I can see ___ ."],
          wordBank: ["does", "feels", "is like"],
          visual: actionFeeling,
          oral: "Act out stomping, then act out feeling upset. Which one can your partner see?",
        },
        dev: {
          frames: ["The action is ___ because I can see ___ ."],
          wordBank: ["action", "feeling", "trait"],
        },
        exp: {
          frames: [
            "The sentence that shows an action is ___ because it tells what the character ___ .",
          ],
        },
        br: {},
      },
    },
    {
      id: "g2",
      type: "short",
      prompt:
        'Nia threw her hands up, stomped to the door and said, "It is all ruined!" How did Nia feel? Write one sentence with because.',
      answer: "Nia felt upset because she stomped to the door and said it was all ruined.",
      hint: "Name two things she did or said, then name the feeling they show.",
      supports: {
        ee: {
          frames: ["Nia felt ___ .", "She ___ and she said ___ ."],
          wordBank: ["upset", "stomped", "ruined", "because"],
          visual: actionFeeling,
        },
        dev: { frames: ["Nia felt ___ because she ___ ."], wordBank: ["because", "infer"] },
        exp: { frames: ["I infer that Nia felt ___ because the story says she ___ ."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "choice",
      prompt:
        "Theo picked up one seed at a time and counted them again to be sure. Which trait does this show?",
      choices: ["Patient and careful", "Bossy", "Careless"],
      answer: 0,
      hint: "Think about whether his actions are fast and rough or slow and steady.",
      supports: {
        ee: {
          frames: ["Theo works ___ .", "Theo is ___ ."],
          wordBank: ["slowly", "careful", "steady"],
          visual: actionTrait,
        },
        dev: { frames: ["Theo is ___ because he ___ ."], wordBank: ["trait", "evidence"] },
        exp: { frames: ["His actions are evidence that he is ___ because ___ ."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "short",
      prompt:
        "Write one way Nia and Theo are different. Use the word but or the word while, and tell an action for each character.",
      answer: "Nia left the room, but Theo stayed and picked up the seeds.",
      hint: "Start with what Nia did. Then join what Theo did with a contrast word.",
      supports: {
        ee: {
          frames: ["Nia ___ , but Theo ___ ."],
          wordBank: ["left", "stayed", "but", "while"],
          visual: venn,
          oral: "Point to the Nia circle and say what she does. Point to the Theo circle and say what he does.",
        },
        dev: { frames: ["Nia ___ , but Theo ___ ."], wordBank: ["contrast", "action"] },
        exp: { frames: ["While Nia ___, Theo ___ ."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Two characters, one evidence chart",
    task: "Partners get a second short story or an excerpt from a class read-aloud with two characters who face the same trouble. Partner A lists only what Character 1 does. Partner B lists only what Character 2 does, with each action starting with a verb. Together they fill in a chart with the columns Action, Trait or feeling, and Proof, finishing at least one row for each character. Then they write one sentence that tells how the characters are alike and one that tells how they are different.",
    roles: ["Character 1 detective", "Character 2 detective"],
    discussionCards: [
      {
        prompt: "What did your character do? Is it something you could see in a video?",
        frame: "My character ___ , so I can see ___ .",
      },
      {
        prompt: "What trait or feeling does that action show? How do you know?",
        frame: "I think ___ is ___ because the story says ___ .",
      },
      {
        prompt: "How are your two characters alike? How are they different?",
        frame: "Both ___ and ___ ___ , but ___ ___ while ___ ___ .",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: the same trouble, two actions",
      visualOrModel: venn,
      teacherNote:
        "Place the Venn diagram beside the Action, Trait or feeling, Proof chart. Ask students to find the same fact in both: for example, 'one seed at a time' appears in the Theo circle and in the Proof column. Cover the labels and let a partner name which circle each detail belongs to.",
    },
    discuss: {
      title: "Say it: claim and proof",
      structure:
        "Turn and talk. Partner 1 says a trait for a character and the action that proves it. Partner 2 asks 'How do you know?' and repeats the proof. Partners switch characters and do it again.",
      frames: [
        "I think ___ is ___ .",
        "How do you know?",
        "Because the story says ___ .",
        "So you are saying that ___ .",
      ],
    },
    apply: {
      title: "Use it: compare two characters you know",
      task: "Choose two characters from a book your class has read. Fill in an Action, Trait or feeling, and Proof chart with at least two rows for each character. Write two sentences: one that begins 'Both' and tells how they are alike, and one with 'but' or 'while' that tells how they are different. Include a real action in each sentence.",
      successCriteria: [
        "I write actions that start with a verb.",
        "I name a trait or feeling and the proof for it.",
        "I use both for a likeness and but or while for a difference.",
        "I explain at least one effect of an action with because or so.",
      ],
    },
  },
  activities: [
    { engine: "language-detective", id: "g3-ela-compare-characters-detective" },
    { engine: "conversation-studio", id: "g3-ela-compare-characters-conversation" },
    { engine: "vocab-quest", id: "g3-ela-compare-characters-quest" },
  ],
  independent: {
    passage: {
      title: "The Lost Mitten",
      note: "Original story used for independent practice. Each item also quotes the lines it needs.",
      paragraphs: [
        "Lena and Omar each lost a mitten on the walk to school. Lena looked in her backpack, then in her coat pockets, and then she walked back to the corner.",
        'Omar shrugged. "It is only a mitten," he said, and he put his bare hand in his pocket.',
        "At recess, Lena spotted her mitten by the fence and pulled it on. Omar's hand stayed cold all day.",
      ],
    },
    items: [
      {
        id: "i1",
        type: "choice",
        prompt:
          "Lena looked in her backpack, then in her coat pockets, and then she walked back to the corner. Which trait best fits Lena?",
        choices: ["Persistent", "Careless", "Shy"],
        answer: 0,
        explain:
          "Searching three places and going back shows she keeps trying, which is being persistent.",
      },
      {
        id: "i2",
        type: "choice",
        prompt:
          'Omar shrugged and said, "It is only a mitten." What can you infer about how he felt?',
        choices: [
          "He did not think it was worth the effort to look.",
          "He was frightened of the cold.",
          "He was excited to lose his mitten.",
        ],
        answer: 0,
        explain:
          "A shrug and the word 'only' are clues that he did not think it mattered enough to search.",
      },
      {
        id: "i3",
        type: "choice",
        prompt: "What was the effect of Omar not looking for his mitten?",
        choices: [
          "His hand stayed cold all day.",
          "He found it by the fence.",
          "Lena lost hers again.",
        ],
        answer: 0,
        explain:
          "Because he did not look or find it, his bare hand stayed cold. That is the result of his choice.",
      },
      {
        id: "i4",
        type: "short",
        prompt: "Write one way Lena and Omar are alike and one way they are different.",
        answer: "Both lost a mitten. Lena searched for hers, but Omar shrugged and did not look.",
        explain:
          "Alike: both lost a mitten on the way to school. Different: one searched and one did not.",
      },
      {
        id: "i5",
        type: "choice",
        prompt: "Which sentence is the best evidence that Lena did not give up?",
        choices: [
          "Lena and Omar each lost a mitten on the walk to school.",
          "She walked back to the corner.",
          "At recess, Lena pulled her mitten on.",
        ],
        answer: 1,
        explain:
          "Walking back to look again shows she kept trying. The other sentences only tell what happened.",
      },
      {
        id: "i6",
        type: "short",
        prompt: "Use the word because to explain why Lena got her mitten back and Omar did not.",
        answer: "Lena got hers back because she kept looking, but Omar did not look.",
        explain: "The cause is Lena's searching, and the effect is finding her mitten.",
      },
      {
        id: "i7",
        type: "choice",
        prompt: "Which sentence contrasts Lena and Omar?",
        choices: [
          "Both of them lost a mitten.",
          "Lena searched, but Omar shrugged.",
          "Lena found her mitten at recess.",
        ],
        answer: 1,
        explain:
          "The word but joins two different actions. The first sentence shows a likeness, and the last tells only about Lena.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "choice",
        prompt:
          "Pia gripped the edge of her desk and bit her lip. Which word tells what Pia probably felt?",
        choices: ["Nervous", "Bored", "Silly"],
        answer: 0,
        explain: "Gripping a desk and biting a lip are clues that she is nervous.",
      },
      {
        id: "f2",
        type: "short",
        prompt:
          "Tom gave his last cracker to a classmate who forgot lunch. Name a trait and the action that is the proof.",
        answer: "Tom is generous (or kind) because he gave away his last cracker.",
        explain:
          "The trait is generous or kind, and the proof is the action of giving the cracker.",
      },
      {
        id: "f3",
        type: "choice",
        prompt: "Which sentence compares two characters by something they both do?",
        choices: [
          "Both Mara and Kyle waved at the bus driver.",
          "Mara waved, but Kyle did not.",
          "Kyle was shy and Mara was loud.",
        ],
        answer: 0,
        explain: "Both signals the likeness. The other two sentences show differences.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show how you use actions as evidence.",
    items: [
      {
        id: "e1",
        type: "choice",
        prompt: "Which one is an action?",
        choices: [
          "Sam is brave.",
          "Sam walked up to the big dog and held out his hand.",
          "Sam felt proud.",
        ],
        answer: 1,
        explain:
          "Walking up and holding out a hand is something you could see. A trait and a feeling are not actions.",
      },
      {
        id: "e2",
        type: "short",
        prompt:
          "Pick two characters from a story you know. Write one sentence with but or while that tells how their actions are different.",
        answer:
          "Any accurate sentence that names a real action for each character and joins them with but or while.",
        explain: "Look for an action for each character and a contrast word.",
      },
      {
        id: "e3",
        type: "short",
        prompt: "Write one trait for a character and the evidence that proves it. Use because.",
        answer: "Any trait supported by a specific action, joined with because.",
        explain: "The trait must be backed by something the character does or says.",
      },
    ],
    successCriteria: [
      "I tell the difference between an action, a feeling and a trait.",
      "I use because to join a trait to the evidence.",
      "I use but, while or both to compare two characters.",
    ],
  },
  answerKey: {
    notes:
      "For guided and independent short items, accept any answer that names a real action from the text and connects it to the idea with because, but or both. Do not require the exact words in the model answers. For trait words accept close synonyms, such as determined or persistent for Lena. Common errors: naming a feeling when asked for an action, and naming a trait with no proof.",
    items: {
      g1: "Nia stomped to the door. It is the only one that is something she does.",
      g2: "Nia felt upset (or discouraged) because she stomped to the door and said it was all ruined.",
      g3: "Patient and careful. He worked one seed at a time and counted again to be sure.",
      g4: "Nia left the room, but Theo stayed and picked up the seeds.",
      i1: "Persistent. She looked in three places and walked back to look again.",
      i2: "He did not think it was worth the effort to look. The shrug and the word only are the clues.",
      i3: "His hand stayed cold all day.",
      i4: "Both lost a mitten. Lena searched, but Omar shrugged and did not look.",
      i5: "She walked back to the corner.",
      i6: "Lena got her mitten back because she kept looking. Omar did not look, so he did not find his.",
      i7: "Lena searched, but Omar shrugged.",
      f1: "Nervous.",
      f2: "Tom is generous because he gave his last cracker to a classmate who forgot lunch.",
      f3: "Both Mara and Kyle waved at the bus driver.",
      e1: "Sam walked up to the big dog and held out his hand.",
      e2: "Any accurate sentence with a real action for each character joined with but or while.",
      e3: "A trait supported by a real action, joined with because.",
    },
  },
  extension: {
    title: "Which character changed the story most?",
    task: "Choose two characters from a book you are reading. Make a chart with three of the actions of each character. Decide which character's actions changed what happened next the most. Write a paragraph that names the character, gives two actions as evidence, and uses because or so to show the effect on the story. Finish with one sentence that tells how the other character is different.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo usar lo que hacen y dicen los personajes como evidencia para describir cómo son y compararlos.",
      vocab: [
        { en: "character", es: "personaje", verified: false },
        { en: "trait", es: "rasgo de carácter", verified: false },
        { en: "action", es: "acción", verified: false },
        { en: "compare", es: "comparar", verified: false },
        { en: "evidence", es: "evidencia", verified: false },
      ],
      familyPrompt:
        "Cuenten un cuento corto en familia. Digan una cosa que hizo un personaje y una palabra que diga cómo es. Pregunten: ¿qué hizo que nos hace pensar eso?",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Read aloud and teach 12. Guided practice 8. Partner chart 8. Activities or independent practice 8. Exit ticket 4. If time is short, run the Story Detective activity first and move the conversation and word quest to the next day. The conversation works well as a rehearsal before the partner chart.",
    misconceptions: [
      "Feelings and traits treated as actions: students say 'Nia was mad' when asked for an action. Ask 'Could we see that in a video?' and have them act it out.",
      "Trait from one sentence: students call a character 'mean' after one action. Require two actions that point the same way before naming a trait.",
      "Mixed-up characters: students attach an action to the wrong character because the pronouns he and she look alike. Have them underline the name or pronoun first.",
      "Compare means only differences: students list only what is not the same. Always ask for what is true of both first.",
      "Opinion as evidence: students write 'I think she is rude' with no line from the story. Ask 'Where does the story show that?'",
    ],
    differentiation:
      "Entering and Emerging learners act out each action, use the frames and word banks, and point to the sentence before saying it. Developing and Expanding learners say the frame in their own words and add a second piece of evidence. Bridging learners compare two traits with evidence from three actions. Every tier answers the same questions about the same text; only the language support changes.",
    languageNotes:
      "Teach 'stomped', 'knelt' and 'peeked' with movement before you read. Use two colors on the board: one for actions (what we see) and one for traits and feelings (what we infer). Point out that 'character' also names a letter on a keyboard, but in this lesson it means a person or animal in a story.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
