// Authored lesson companions for g8-sci-u1 (Grade 8 Science). Original text; physics checked by hand.

const exit01 = {
  kind: "exit_check",
  domain: "Vocabulary",
  title: "Show What You Know: Forces",
  mission: "Answer three questions about pushes, pulls, and touching, then rate how well you can describe a force.",
  grouping: "Solo",
  minutes: 3,
  tip: "Collect the can-do ratings; students who choose 'with help' meet you for a quick small group with the real objects.",
  support: {
    l1_2: "Use the audio button for each question, then tap an answer.",
    l3_4: "Read each question, tap an answer, and read the reason.",
    l5_6: "Answer, fix any mistake, then explain one answer to a partner.",
  },
  payload: {
    can_do: "I can describe a push or a pull and tell if it is a contact force or a noncontact force.",
    items: [
      {
        q: "Which sentence describes a noncontact force?",
        options: [
          "The rough floor slows a sliding box.",
          "Marcus pulls the wagon with a rope.",
          "Gravity pulls a dropped ball toward the ground.",
        ],
        answer: 2,
        why: "You can tell it is noncontact because gravity pulls the ball without anything touching it. The floor and the rope both touch the objects they act on.",
      },
      {
        q: "Imani pushes a heavy box, but it does not move. Which statement is true?",
        options: [
          "No force is acting, because the box did not move.",
          "Imani's push is a force even though the box stays still.",
          "Only gravity is a force, so a push is not a force.",
        ],
        answer: 1,
        why: "You are right to keep her push as a force. A push is still a push when the box stays still, because friction pushes back on the box.",
      },
      {
        q: "Which unit do scientists use to measure force?",
        options: ["newton", "kilogram", "meter per second"],
        answer: 0,
        why: "Force is measured in newtons. You use kilograms for mass and meters per second for speed.",
      },
    ],
  },
};

const lesson01 = {
  id: "g8-sci-u1-l01",
  unit_id: "g8-sci-u1",
  version: 1,
  sequence: 1,
  source: "authored",
  title: "Describe a Push or a Pull",
  core_lesson_ref: { label: "Language session 1: forces as pushes and pulls", source: "language_pathway" },
  content_objective:
    "Students identify a force as a push or a pull on an object and sort forces into contact forces and noncontact forces.",
  language_objective: {
    klu: "Inform",
    function: "describe a push or a pull with precise force words",
    forms: ["The ___ pushes / pulls the ___.", "without touching", "contact force / noncontact force"],
    by_level: {
      l1_2: "I can say what pushes or pulls an object, using a picture and the words push, pull, and force.",
      l3_4: "I can describe a push or a pull in a full sentence and say if it is a contact force or a noncontact force.",
      l5_6: "I can describe a force precisely by naming what acts on what, which way it acts, and why it is a contact or noncontact force.",
    },
  },
  standards: ["MS-PS2-2"],
  wida: { framework: "2020", language_expectation: "Science.6-8.Inform.Expressive", pld_targets: ["sentence", "word"] },
  vocab: [
    { term: "force", tier: 2, new_or_review: "new" },
    { term: "contact force", tier: 3, new_or_review: "new" },
    { term: "noncontact force", tier: 3, new_or_review: "new" },
    { term: "gravity", tier: 3, new_or_review: "new" },
    { term: "newton", tier: 3, new_or_review: "new" },
  ],
  mentor_sentence: {
    text: "A magnet pulls a paper clip without touching it, so that is a noncontact force.",
    chunks: [
      {
        text: "A magnet pulls a paper clip",
        role: "What acts on what",
        tone: "concept",
        ask: "Which noun does the pulling, and which noun gets pulled?",
      },
      {
        text: "without touching it,",
        role: "How the force travels",
        tone: "precision",
        ask: "Which two words tell you the objects are apart?",
      },
      {
        text: "so",
        role: "Signals a conclusion",
        tone: "connector",
        ask: "What does the word so tell you is coming next?",
      },
      {
        text: "that is a noncontact force.",
        role: "The science name",
        tone: "evidence",
        ask: "Which two words name the kind of force?",
      },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Force Facts Flip",
        mission: "Flip each card to check what you remember about pushes, pulls, newtons, and force arrows.",
        grouping: "Partners",
        minutes: 4,
        tip: "Let partners say the answer aloud before they flip, and put missed cards back in the pile with a friendly 'not yet'.",
        support: {
          l1_2: "Point to the icon, say the answer you know, then flip to check.",
          l3_4: "Answer in a full sentence before you flip the card.",
          l5_6: "Answer, flip, then add one example from your own day.",
        },
        payload: {
          cards: [
            { prompt: "What is a force?", answer: "A push or a pull on an object.", icon: "👉" },
            {
              prompt: "Which unit do scientists use to measure force?",
              answer: "The newton (N). One newton is about the pull of gravity on a small apple.",
              icon: "⚖️",
            },
            {
              prompt: "What do scientists draw to show a force?",
              answer: "An arrow. It points in the direction of the force, and a longer arrow shows a stronger force.",
              icon: "➡️",
            },
            {
              prompt: "What can a force do to a ball that is rolling?",
              answer: "It can speed the ball up, slow it down, or change its direction.",
              icon: "⚽",
            },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "Push, Pull, or Touch?",
        mission: "Listen to four short scenes, then tap the word or picture that names the force you hear.",
        grouping: "Solo",
        minutes: 5,
        tip: "Play each scene twice, and say the verb a little louder on the second listen so students catch pushes versus pulls.",
        support: {
          l1_2: "Listen once with no text, tap, then listen again with the words showing.",
          l3_4: "Tap, then say the whole sentence back to a partner.",
          l5_6: "Tap, then explain which word in the sentence gave you the answer.",
        },
        payload: {
          items: [
            {
              say: "Marcus pulls the wagon across the sidewalk with a rope.",
              options: [
                { label: "a push", icon: "👉" },
                { label: "a pull", icon: "🪢" },
                { label: "no force", icon: "🚫" },
              ],
              answer: 1,
              why: "You can tell it is a pull because the rope drags the wagon toward Marcus.",
            },
            {
              say: "Without touching the nail, the magnet pulls it across the table.",
              options: [
                { label: "contact force", icon: "🤝" },
                { label: "noncontact force", icon: "🧲" },
                { label: "friction", icon: "🛹" },
              ],
              answer: 1,
              why: "Listen for 'without touching': the magnet and the nail stay apart, so this is a noncontact force.",
            },
            {
              say: "A skateboarder at Patterson Park pushes the ground with her foot.",
              options: [
                { label: "a pull", icon: "🪢" },
                { label: "no force", icon: "🚫" },
                { label: "a push", icon: "👉" },
              ],
              answer: 2,
              why: "Her foot presses against the ground, and pressing away is a push.",
            },
            {
              say: "The rough floor slows the sliding box because it rubs against the box.",
              options: [
                { label: "friction", icon: "🟫" },
                { label: "gravity", icon: "⬇️" },
                { label: "a magnet", icon: "🧲" },
              ],
              answer: 0,
              why: "Rubbing between two touching surfaces is friction, a contact force that slows sliding.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 5,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Sentence X-Ray: The Magnet",
        mission: "Take apart the sentence about the magnet and the paper clip, then drag the chunks back into order.",
        grouping: "Whole Class",
        minutes: 5,
        tip: "Have students point at the chunk that names the force before they rebuild, then read the finished sentence in chorus.",
        support: {
          l1_2: "Tap each color and listen, then say the first chunk.",
          l3_4: "Rebuild the sentence and tell what job each chunk does.",
          l5_6: "Rebuild it, then write a new sentence about gravity with the same four chunks.",
        },
        payload: {
          text: "A magnet pulls a paper clip without touching it, so that is a noncontact force.",
          chunks: [
            { text: "A magnet pulls a paper clip", role: "What acts on what", tone: "concept" },
            { text: "without touching it,", role: "How the force travels", tone: "precision" },
            { text: "so", role: "Signals a conclusion", tone: "connector" },
            { text: "that is a noncontact force.", role: "The science name", tone: "evidence" },
          ],
          ask: "Which chunk tells you the objects are apart?",
        },
      },
    },
    {
      step: "interact",
      minutes: 8,
      activity: {
        kind: "word_sort",
        domain: "Vocabulary",
        title: "Contact, Noncontact, or Not a Force?",
        mission:
          "Sort eleven situations into contact forces, noncontact forces, and things that are not forces, then defend one choice with the word because.",
        grouping: "Partners",
        minutes: 8,
        tip: "Listen for 'this is a ___ force because ___' when partners defend a card, and press on the three cards that are not forces at all.",
        support: {
          l1_2: "Sort the cards you can picture first, then ask your partner about the rest.",
          l3_4: "Say 'I put this here because...' for every card.",
          l5_6: "Sort every card, then write one sentence that explains the hardest card.",
        },
        payload: {
          categories: [{ name: "Contact force" }, { name: "Noncontact force" }, { name: "Not a force" }],
          items: [
            { text: "A skateboarder at Patterson Park pushes the ground with her foot.", cat: 0 },
            { text: "Marcus pulls a wagon with a rope.", cat: 0 },
            { text: "The rough sidewalk slows a sliding shoe.", cat: 0 },
            { text: "A foot kicks a soccer ball.", cat: 0 },
            { text: "The floor pushes up on a chair.", cat: 0 },
            { text: "A magnet pulls a paper clip across a small gap.", cat: 1 },
            { text: "Gravity pulls a dropped phone toward the floor.", cat: 1 },
            { text: "A rubbed balloon lifts a few strands of hair without touching them.", cat: 1 },
            { text: "The speed of a bike is 5 meters per second.", cat: 2 },
            { text: "The mass of a backpack is 4 kilograms.", cat: 2 },
            { text: "The shadow of a tree falls on the wall.", cat: 2 },
          ],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Say What Pushes or Pulls",
        mission:
          "Choose one object in your classroom and tell your partner what pushes or pulls it, saying contact or noncontact.",
        grouping: "Partners",
        minutes: 5,
        tip: "Recordings stay on the student's device; ask the listening partner to check one box on the checklist.",
        support: {
          l1_2: "Say one sentence with the frame and point to the object.",
          l3_4: "Say two sentences: one for the force and one for contact or noncontact.",
          l5_6: "Name two forces on the same object and explain why each is contact or noncontact.",
        },
        payload: {
          prompt:
            "Look at an object in the classroom. Tell what force acts on it, which way the force acts, and whether it is a contact or a noncontact force.",
          frame:
            "The [thing] [pushes / pulls] the [object] [direction]. This is a [contact / noncontact] force because ___.",
          model: "The floor pushes up on my chair. This is a contact force because the floor and the chair touch.",
          checklist: [
            "I named what pushes or pulls and what it acts on.",
            "I said contact or noncontact and gave a reason with because.",
            "I spoke clearly so my partner could repeat my sentence.",
          ],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit01,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Speaking",
      title: "Point and Say: Push, Pull, Gravity",
      mission:
        "Point to the picture of a push, a pull, a magnet, gravity, or a force arrow, say the word, then say the sentence with the audio.",
      grouping: "Partners",
      minutes: 5,
      tip: "Show the real object first (book, toy car, magnet), then the picture, so the word attaches to a motion the student has felt.",
      support: {
        l1_2: "Point and say one word at a time with your partner.",
        l3_4: "Point, say the word, and say the whole sentence.",
        l5_6: "Say the sentence, then change the object to one of your own.",
      },
      payload: {
        items: [
          {
            term: "push",
            icon: "👉",
            cue: "A hand presses a book away across a desk.",
            say: "I push the book.",
            es: "empujar",
          },
          {
            term: "pull",
            icon: "🪢",
            cue: "A hand pulls a toy car toward a child on a string.",
            say: "I pull the toy car.",
            es: "jalar (o halar)",
          },
          {
            term: "magnet",
            icon: "🧲",
            cue: "A magnet on a desk and a paper clip sliding toward it with no hand touching.",
            say: "The magnet pulls the paper clip.",
            es: "imán",
          },
          {
            term: "gravity",
            icon: "⬇️",
            cue: "A pencil falls from a hand with a big arrow pointing down.",
            say: "Gravity pulls the pencil down.",
            es: "gravedad",
          },
          {
            term: "force",
            icon: "💪",
            cue: "A big arrow pointing at a box.",
            say: "A force is a push or a pull.",
            es: "fuerza",
          },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Move It: Push and Pull",
      mission: "Listen to each command and do the action with the real object.",
      grouping: "Whole Class",
      minutes: 4,
      tip: "Model each action once, then say the command without modeling, and pair students for the last command.",
      support: {
        l1_2: "Copy your partner's action and say the verb.",
        l3_4: "Do the action by yourself and say what you did.",
        l5_6: "Give the command to a partner and describe the force you used.",
      },
      payload: {
        items: [
          { command: "Push the book across the desk.", icon: "📘" },
          { command: "Pull the toy car toward you with the string.", icon: "🚗" },
          { command: "Hold the magnet near the paper clip and watch.", icon: "🧲" },
          { command: "Drop the pencil and say the word gravity.", icon: "✏️" },
          { command: "Push the wall gently with both hands.", icon: "🧱" },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Forces",
      mission:
        "Say each science word in English and in your home language, then tell your partner one thing that sounds the same or different.",
      grouping: "Partners",
      minutes: 4,
      tip: "Invite students to add the word in any language they speak, and treat the Spanish glosses as teacher-reviewed drafts.",
      support: {
        l1_2: "Say both words with a partner.",
        l3_4: "Say both words and one way they are alike or different.",
        l5_6: "Explain how the word is used in a sentence in each language.",
      },
      payload: {
        items: [
          {
            term: "force",
            es: "fuerza",
            note: "Cognate: fuerza = force. In daily Spanish 'fuerza' can also mean strength; in science it is a push or a pull on an object. French: force. Haitian Creole: fòs.",
          },
          {
            term: "push / pull",
            es: "empujar / jalar (halar)",
            note: "Two verbs, two directions. In some countries people say 'tirar de' for pull.",
          },
          {
            term: "gravity",
            es: "gravedad",
            note: "Cognate. 'Gravedad' also means seriousness in Spanish; in science it is the pull of Earth on objects.",
          },
          { term: "magnet", es: "imán", note: "Not 'magneto'. The adjective 'magnético' is a cognate for magnetic." },
        ],
      },
    },
  ],
  extension: null,
  exit_check: exit01,
  teacher_card: {
    minutes: 25,
    materials: [
      "A book, a toy car with string, a magnet and a paper clip",
      "Whiteboards for the sort",
      "Device with sound for each pair",
    ],
    listen_for: [
      "Students say 'pushes' or 'pulls' with an object after it, as in 'the floor pushes the chair'.",
      "Students justify contact or noncontact with 'because' and the words 'touch' or 'without touching'.",
      "Students separate a force from a property such as speed, mass, or a shadow.",
    ],
    watchouts: [
      "Misconception: a force is something an object has or stores ('the ball has force'). Reteach it as an interaction: one object pushes or pulls another.",
      "Misconception: a book at rest has no forces on it. Gravity pulls it down and the table pushes it up.",
      "Transfer: Spanish speakers may say 'The wall push the hand' (dropped -s) or 'have force'; Arabic speakers may drop 'is' ('This contact force').",
    ],
    differentiation: {
      l1_2: "Use the picture cards, accept one-sentence answers from the frame, and let students sort with a partner by pointing.",
      l3_4: "Require the full frame 'The ___ pushes / pulls the ___' and a because-reason for every sort.",
      l5_6: "Ask for two forces on one object, with directions, and for a sentence that corrects a 'the ball has force' idea.",
      newcomer:
        "Do Point and Say, Move It, and the Home Language Bridge with real objects; accept pointing, drawing, and home-language answers.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

const exit02 = {
  kind: "exit_check",
  domain: "Vocabulary",
  title: "Show What You Know: Balance",
  mission:
    "Find the net force on a rope, correct one idea about balanced forces, and pick the correct comparison sentence, then rate yourself.",
  grouping: "Solo",
  minutes: 3,
  tip: "Collect the can-do ratings and look at item 3 for dropped verbs before the next lesson.",
  support: {
    l1_2: "Use the audio button for each question, then tap an answer.",
    l3_4: "Read each question, tap an answer, and read the reason.",
    l5_6: "Answer, fix any mistake, then write your own comparison sentence.",
  },
  payload: {
    can_do: "I can compare balanced and unbalanced forces and name the net force.",
    items: [
      {
        q: "Two teams pull a rope with 250 N each in opposite directions. What is the net force on the rope?",
        options: ["500 N", "0 N", "250 N"],
        answer: 1,
        why: "You subtract because the directions are opposite: 250 N minus 250 N is 0 N. Adding gives 500 N, which would ignore direction.",
      },
      {
        q: "A student says, 'The forces on a cyclist are balanced, so she must be stopped.' What is the best correction?",
        options: [
          "Balanced forces mean she is speeding up.",
          "Balanced forces mean no forces act on her at all.",
          "Balanced forces mean she is at rest or keeps a steady speed in a straight line.",
        ],
        answer: 2,
        why: "Balanced forces cancel, so her motion does not change. She can be at rest or move at a steady speed. Forces still act on her; they just cancel.",
      },
      {
        q: "Which sentence compares the two situations correctly?",
        options: [
          "The forces on the sled unbalanced, whereas the forces on the book are balanced.",
          "The forces on the sled are unbalanced, whereas the forces on the book is balanced.",
          "The forces on the sled are unbalanced, whereas the forces on the book are balanced.",
        ],
        answer: 2,
        why: "You need a verb in both halves, and plural forces take 'are'. The other choices drop the verb or use 'is'.",
      },
    ],
  },
};

const lesson02 = {
  id: "g8-sci-u1-l02",
  unit_id: "g8-sci-u1",
  version: 1,
  sequence: 2,
  source: "authored",
  title: "Compare Balanced and Unbalanced Forces",
  core_lesson_ref: { label: "Language session 2: balanced and unbalanced forces", source: "language_pathway" },
  content_objective:
    "Students use force arrows and numbers to decide whether the forces on an object are balanced or unbalanced and to find the net force.",
  language_objective: {
    klu: "Inform",
    function: "compare two situations with whereas and name the net force",
    forms: [
      "The forces on the ___ are balanced, whereas the forces on the ___ are unbalanced.",
      "The net force is ___ N.",
    ],
    by_level: {
      l1_2: "I can point to a picture and say 'The forces are balanced' or 'The forces are unbalanced'.",
      l3_4: "I can compare two pictures in one sentence using whereas or but.",
      l5_6: "I can compare balanced and unbalanced forces with whereas, give the net force with a direction, and say what each does to the object's motion.",
    },
  },
  standards: ["MS-PS2-2"],
  wida: {
    framework: "2020",
    language_expectation: "Science.6-8.Inform.Expressive",
    pld_targets: ["discourse", "sentence", "word"],
  },
  vocab: [
    { term: "net force", tier: 3, new_or_review: "new" },
    { term: "balanced forces", tier: 3, new_or_review: "new" },
    { term: "unbalanced forces", tier: 3, new_or_review: "new" },
    { term: "force", tier: 2, new_or_review: "review" },
    { term: "friction", tier: 3, new_or_review: "review" },
  ],
  mentor_sentence: {
    text: "The forces on the resting book are balanced, whereas the forces on the speeding-up crate are unbalanced.",
    chunks: [
      {
        text: "The forces on the resting book are balanced,",
        role: "The first situation",
        tone: "concept",
        ask: "Which object is at rest, and what word describes its forces?",
      },
      {
        text: "whereas",
        role: "Marks a contrast",
        tone: "connector",
        ask: "What does whereas tell you about the two situations?",
      },
      {
        text: "the forces on the speeding-up crate",
        role: "The second situation",
        tone: "precision",
        ask: "How can you tell the crate is not at rest?",
      },
      {
        text: "are unbalanced.",
        role: "The result for the crate",
        tone: "evidence",
        ask: "Which small word before 'unbalanced' do many learners forget?",
      },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Force Review Flip",
        mission:
          "Flip each card to check what you know about contact forces, noncontact forces, and force arrows from yesterday.",
        grouping: "Partners",
        minutes: 4,
        tip: "Have partners answer aloud first, and keep the last card for a quick whole-class prediction before moving on.",
        support: {
          l1_2: "Use the icon to help you, then say the answer with a partner.",
          l3_4: "Answer in a full sentence before you flip.",
          l5_6: "Answer, flip, then add a second example of your own.",
        },
        payload: {
          cards: [
            {
              prompt: "Name one contact force and one noncontact force.",
              answer: "Contact: a kick or friction. Noncontact: gravity or a magnet pulling.",
              icon: "🧲",
            },
            {
              prompt: "Which two forces act on a book resting on a desk?",
              answer: "Gravity pulls it down, and the desk pushes it up.",
              icon: "📘",
            },
            { prompt: "Which unit measures force?", answer: "The newton (N).", icon: "⚖️" },
            {
              prompt: "Two teams pull a rope in opposite directions with 100 N each. Predict: does the rope move?",
              answer: "No. The two pulls are equal and opposite, so they cancel.",
              icon: "🪢",
            },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "Which Forces Do You Hear?",
        mission: "Listen to four scenes and tap the picture that matches the forces on the object.",
        grouping: "Solo",
        minutes: 5,
        tip: "Read each scene at a natural pace, then slowly; the cyclist scene targets the idea that balanced forces can still mean motion.",
        support: {
          l1_2: "Listen, tap a picture, then listen again with the words showing.",
          l3_4: "Tap, then repeat the sentence to a partner using the key word.",
          l5_6: "Tap, then explain how you know in one sentence with because.",
        },
        payload: {
          items: [
            {
              say: "Two teams pull a rope with the same strength, and the rope does not move.",
              options: [
                { label: "balanced forces", icon: "⚖️" },
                { label: "unbalanced forces", icon: "↗️" },
                { label: "no forces", icon: "🚫" },
              ],
              answer: 0,
              why: "You can tell the forces are balanced because equal pulls in opposite directions cancel each other.",
            },
            {
              say: "The sled speeds up because the push forward is bigger than friction.",
              options: [
                { label: "balanced forces", icon: "⚖️" },
                { label: "unbalanced forces", icon: "↗️" },
                { label: "no forces", icon: "🚫" },
              ],
              answer: 1,
              why: "A bigger push than friction leaves a leftover force forward, so the forces are unbalanced and the sled speeds up.",
            },
            {
              say: "The forces on the cyclist are balanced, and she is already moving.",
              options: [
                { label: "speeding up", icon: "⏩" },
                { label: "slowing down", icon: "⏬" },
                { label: "steady speed", icon: "➡️" },
              ],
              answer: 2,
              why: "Balanced forces do not change motion. A moving cyclist keeps the same speed in a straight line.",
            },
            {
              say: "The road pushes backward on the tires, and nothing pushes the bus forward, so the bus slows down.",
              options: [
                { label: "balanced forces", icon: "⚖️" },
                { label: "unbalanced forces", icon: "↗️" },
                { label: "steady speed", icon: "➡️" },
              ],
              answer: 1,
              why: "Only a backward force acts, so nothing cancels it. That makes the forces unbalanced, and the speed drops.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 5,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Sentence X-Ray: Book and Crate",
        mission: "Take apart the sentence that compares the resting book with the speeding-up crate, then rebuild it.",
        grouping: "Whole Class",
        minutes: 5,
        tip: "Ask students to find the two verbs 'are' and cover them with a sticky note to see how the sentence breaks.",
        support: {
          l1_2: "Tap each color and listen, then say the connector word.",
          l3_4: "Rebuild the sentence and explain what whereas does.",
          l5_6: "Rebuild it, then write a new comparison about a tug-of-war rope and a braking bus.",
        },
        payload: {
          text: "The forces on the resting book are balanced, whereas the forces on the speeding-up crate are unbalanced.",
          chunks: [
            { text: "The forces on the resting book are balanced,", role: "The first situation", tone: "concept" },
            { text: "whereas", role: "Marks a contrast", tone: "connector" },
            { text: "the forces on the speeding-up crate", role: "The second situation", tone: "precision" },
            { text: "are unbalanced.", role: "The result for the crate", tone: "evidence" },
          ],
          ask: "Which chunk is the contrast word, and what two things does it connect?",
        },
      },
    },
    {
      step: "interact",
      minutes: 8,
      activity: {
        kind: "info_gap",
        domain: "Speaking",
        title: "Four Force Situations",
        mission:
          "Ask your partner about the two situations you do not have, then fill in the net force and the motion for all four.",
        grouping: "Partners",
        minutes: 8,
        tip: "Partners may not show their cards; check that every net force is stated with a number and a direction, and that both partners say balanced or unbalanced.",
        support: {
          l1_2: "Use the ask frames word for word and point to the situation number.",
          l3_4: "Ask in your own words, then repeat each number back to check it.",
          l5_6: "After the table is full, compare one balanced situation with one unbalanced situation using whereas.",
        },
        payload: {
          goal: "Complete a table for four situations: the net force, balanced or unbalanced, and what the object does.",
          a: {
            title: "Lab Partner A",
            has: [
              {
                k: "Situation 1",
                v: "Backpack on a desk. Gravity pulls down with 20 N, and the desk pushes up with 20 N. Net force: 0 N. The forces are balanced, and the backpack stays at rest.",
              },
              {
                k: "Situation 2",
                v: "Sled on snow. Friends push forward with 40 N, and friction pushes backward with 15 N. Net force: 25 N forward. The forces are unbalanced, and the sled speeds up.",
              },
            ],
            needs: ["Situation 3", "Situation 4"],
          },
          b: {
            title: "Lab Partner B",
            has: [
              {
                k: "Situation 3",
                v: "Tug-of-war at a school picnic. Team Red pulls left with 300 N, and Team Blue pulls right with 300 N. Net force: 0 N. The forces are balanced, and the rope stays at rest.",
              },
              {
                k: "Situation 4",
                v: "MTA bus braking. The road pushes backward on the tires with 6,000 N, and the engine pushes forward with 0 N. Net force: 6,000 N backward. The forces are unbalanced, and the bus slows down.",
              },
            ],
            needs: ["Situation 1", "Situation 2"],
          },
          ask_frames: [
            "What are the forces in ___?",
            "What is the net force in ___?",
            "Are the forces balanced or unbalanced in ___?",
          ],
          tell_frames: [
            "In ___, ___ pushes or pulls ___ with ___ N.",
            "The net force is ___ N, so the forces are ___.",
            "I am not sure. Let me look at my card again.",
          ],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Compare Two Situations Aloud",
        mission:
          "Pick one balanced and one unbalanced situation from your table and compare them out loud with the word whereas.",
        grouping: "Solo",
        minutes: 5,
        tip: "Recordings stay on the student's device; listen for a verb in each half of the sentence.",
        support: {
          l1_2: "Say the frame once for each situation, and use the word bank.",
          l3_4: "Say one full comparison sentence with whereas.",
          l5_6: "Say the comparison, then add what each object does and the net force with its direction.",
        },
        payload: {
          prompt:
            "Compare two situations from the table. Say which forces are balanced, which are unbalanced, and what happens to each object.",
          frame:
            "The forces on the [object 1] are [balanced / unbalanced], whereas the forces on the [object 2] are ___.",
          model:
            "The forces on the tug-of-war rope are balanced, whereas the forces on the braking bus are unbalanced. The rope stays at rest, but the bus slows down.",
          checklist: [
            "I said balanced for one situation and unbalanced for the other.",
            "I used whereas and put a verb on both sides of it.",
            "I told what each object does.",
          ],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit02,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Speaking",
      title: "Point and Say: Balanced or Not",
      mission:
        "Point to the balanced seesaw or the tilted seesaw, say balanced or unbalanced, then say the sentence about the net force.",
      grouping: "Partners",
      minutes: 5,
      tip: "Use two real pencils or rulers balanced on a finger to show balanced and unbalanced before students see the pictures.",
      support: {
        l1_2: "Point and say one word at a time with your partner.",
        l3_4: "Point, say the word, and say the whole sentence.",
        l5_6: "Say the sentence, then change the object to one of your own.",
      },
      payload: {
        items: [
          {
            term: "balanced",
            icon: "⚖️",
            cue: "A seesaw that is level, with two equal arrows pointing opposite ways.",
            say: "The forces are balanced.",
            es: "equilibradas",
          },
          {
            term: "unbalanced",
            icon: "↗️",
            cue: "A seesaw that is tilted, with one big arrow and one small arrow.",
            say: "The forces are unbalanced.",
            es: "desequilibradas (o no equilibradas)",
          },
          {
            term: "net force",
            icon: "➕",
            cue: "A long arrow pointing right, a short arrow pointing left, and a medium arrow showing the total.",
            say: "The net force is the total.",
            es: "fuerza neta",
          },
          {
            term: "zero",
            icon: "0️⃣",
            cue: "Two equal arrows pushing opposite ways on a box that stays still.",
            say: "The net force is zero.",
            es: "cero",
          },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Feel the Forces",
      mission: "Listen to each command and feel the forces with your partner and a rope.",
      grouping: "Partners",
      minutes: 4,
      tip: "Pre-pair students and keep the rope short so the last command shows an unbalanced result clearly.",
      support: {
        l1_2: "Copy your partner and say 'balanced' or 'unbalanced'.",
        l3_4: "Do each action and say what you feel.",
        l5_6: "Give the commands to your partner and describe the forces.",
      },
      payload: {
        items: [
          { command: "Hold the book still on your open hand.", icon: "📘" },
          { command: "Press down on the book with your other hand and feel your first hand push back.", icon: "🖐️" },
          { command: "Hold one end of the rope. Your partner holds the other end.", icon: "🪢" },
          { command: "Pull the rope with the same strength as your partner and stand still.", icon: "🤝" },
          { command: "Now let go. Your partner keeps pulling. Watch what happens.", icon: "👀" },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Balance",
      mission:
        "Say each science word in English and in your home language, then tell your partner what is the same or different.",
      grouping: "Partners",
      minutes: 4,
      tip: "Invite students to add the word in any language they speak, and treat the Spanish glosses as teacher-reviewed drafts.",
      support: {
        l1_2: "Say both words with a partner.",
        l3_4: "Say both words and one way they are alike or different.",
        l5_6: "Explain how the prefixes un- and des- work in each language.",
      },
      payload: {
        items: [
          {
            term: "balanced forces",
            es: "fuerzas equilibradas",
            note: "'Equilibradas' shares a root with equilibrium, the idea of a level scale.",
          },
          {
            term: "unbalanced forces",
            es: "fuerzas desequilibradas",
            note: "The prefixes un- in English and des- in Spanish both undo the word. Some books also say 'no equilibradas'.",
          },
          {
            term: "net force",
            es: "fuerza neta",
            note: "'Neta' matches net. You may know 'peso neto' on food labels, which also means what is left after you subtract.",
          },
        ],
      },
    },
  ],
  extension: null,
  exit_check: exit02,
  teacher_card: {
    minutes: 28,
    materials: ["A short rope or yarn for each pair", "A book", "Sticky notes for covering the verb 'are'"],
    listen_for: [
      "Students put a verb on both sides of whereas, as in 'are balanced, whereas ... are unbalanced'.",
      "Students give a net force with a number and a direction, such as 25 N forward.",
      "Students say that balanced forces can describe a moving object, not only a resting one.",
    ],
    watchouts: [
      "Misconception: balanced forces mean the object is at rest. A cyclist at a steady speed also has balanced forces.",
      "Misconception: add equal opposite forces to get a bigger net force (300 N plus 300 N equals 600 N). Direction matters, so they cancel.",
      "Transfer: Arabic speakers may omit the present-tense verb ('The forces balanced'); Spanish speakers may treat forces as singular ('The force is balanced').",
    ],
    differentiation: {
      l1_2: "Give students the frame 'The forces are ___' and let them sort the four situations by pointing before they speak.",
      l3_4: "Ask for a whereas sentence that compares one balanced and one unbalanced situation.",
      l5_6: "Ask students to compare three situations and name the net force with units and direction for each.",
      newcomer:
        "Use the rope and the book, point to balanced or unbalanced cards, and accept pointing or one-word answers.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

const exit03 = {
  kind: "exit_check",
  domain: "Reading",
  title: "Show What You Know: Net Force",
  mission: "Answer three questions about net force and motion, then rate how well you can explain motion with because.",
  grouping: "Solo",
  minutes: 3,
  tip: "Collect the can-do ratings and note students who miss item 1, since it targets the idea that motion needs a net force.",
  support: {
    l1_2: "Use the audio button for each question, then tap an answer.",
    l3_4: "Read each question, tap an answer, and read the reason.",
    l5_6: "Answer, fix any mistake, then say a because sentence about one item.",
  },
  payload: {
    can_do: "I can explain how an object moves by using because and the net force.",
    items: [
      {
        q: "A student says, 'The cart keeps moving, so there must be a net force pushing it forward.' Which reply is correct?",
        options: [
          "A moving cart always has a net force in the direction it moves.",
          "A cart at a steady speed in a straight line has a net force of zero.",
          "A cart can only keep moving if friction is zero.",
        ],
        answer: 1,
        why: "You do not need a net force to keep moving at a steady speed. A net force is needed only to change the speed or direction.",
      },
      {
        q: "Which sentence explains the motion correctly?",
        options: [
          "Because the net force on the sled points forward, the sled speeds up.",
          "Because the sled speeds up, the net force on it is zero.",
          "Because the net force on the sled is zero, the sled speeds up.",
        ],
        answer: 0,
        why: "The net force is the cause, and the change in speed is the effect. In the other two choices the cause and effect are reversed or do not match.",
      },
      {
        q: "A bus is slowing down as it approaches a stop. Which statement about the net force on the bus is true?",
        options: ["The net force points forward.", "The net force is zero.", "The net force points backward."],
        answer: 2,
        why: "A bus that slows down has a net force that points opposite to its motion, which is backward.",
      },
    ],
  },
};

const lesson03 = {
  id: "g8-sci-u1-l03",
  unit_id: "g8-sci-u1",
  version: 1,
  sequence: 3,
  source: "authored",
  title: "Explain Motion with Net Force",
  core_lesson_ref: { label: "Language session 3: net force and changes in motion", source: "language_pathway" },
  content_objective:
    "Students explain that a net force of zero leaves an object's motion unchanged, while a net force that is not zero changes its speed or direction.",
  language_objective: {
    klu: "Explain",
    function: "explain why an object moves the way it does, starting with because and the net force",
    forms: ["Because the net force on ___ is ___, ___.", "___ speeds up / slows down / keeps a steady speed"],
    by_level: {
      l1_2: "I can finish 'The net force is zero, so the object ___' with a word bank and a picture.",
      l3_4: "I can explain an object's motion in one sentence that starts with Because the net force.",
      l5_6: "I can explain motion with because, name the direction of the net force, and say why the motion changes or stays the same.",
    },
  },
  standards: ["MS-PS2-2"],
  wida: {
    framework: "2020",
    language_expectation: "Science.6-8.Explain.Expressive",
    pld_targets: ["discourse", "sentence"],
  },
  vocab: [
    { term: "net force", tier: 3, new_or_review: "review" },
    { term: "balanced forces", tier: 3, new_or_review: "review" },
    { term: "acceleration", tier: 3, new_or_review: "new" },
    { term: "constant", tier: 2, new_or_review: "new" },
    { term: "direction", tier: 2, new_or_review: "new" },
  ],
  mentor_sentence: {
    text: "Because the net force on the cyclist is zero, she keeps rolling at a steady speed in a straight line.",
    chunks: [
      {
        text: "Because",
        role: "Starts the cause",
        tone: "connector",
        ask: "What does because promise you will read next?",
      },
      {
        text: "the net force on the cyclist is zero,",
        role: "The cause",
        tone: "concept",
        ask: "What is the net force, and who is it acting on?",
      },
      {
        text: "she keeps rolling",
        role: "The effect",
        tone: "precision",
        ask: "Does her motion change? Which verb tells you?",
      },
      {
        text: "at a steady speed in a straight line.",
        role: "How she moves",
        tone: "evidence",
        ask: "Which two phrases describe speed and direction?",
      },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Net Force Flip",
        mission:
          "Flip each card to check how you add forces that point in opposite directions and what balanced forces do.",
        grouping: "Partners",
        minutes: 4,
        tip: "Have partners draw the arrows on mini whiteboards before they flip, so the 10 N and 4 N card is visual.",
        support: {
          l1_2: "Look at the icon, say the answer, then flip.",
          l3_4: "Answer in a full sentence, then flip to check.",
          l5_6: "Answer, flip, then make up a new net force problem for your partner.",
        },
        payload: {
          cards: [
            {
              prompt: "What does net force mean?",
              answer: "The total of all the forces on an object, with direction counted.",
              icon: "➕",
            },
            {
              prompt: "A cart is pushed right with 10 N and left with 4 N. What is the net force?",
              answer: "6 N to the right.",
              icon: "↔️",
            },
            {
              prompt: "What is the net force when forces are balanced?",
              answer: "Zero. The forces cancel each other.",
              icon: "⚖️",
            },
            {
              prompt: "What word means a change in speed or a change in direction?",
              answer: "Acceleration.",
              icon: "🏃",
            },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "Net Force and Motion",
        mission: "Listen to four sentences about net force and tap how each object moves.",
        grouping: "Solo",
        minutes: 5,
        tip: "Stress the word 'so' in each sentence; it is the signal that the motion follows from the net force.",
        support: {
          l1_2: "Tap the picture that matches the motion, then listen again.",
          l3_4: "Tap, then say the sentence with the word so.",
          l5_6: "Tap, then say the same idea with because at the start.",
        },
        payload: {
          items: [
            {
              say: "The net force on the light-rail train is zero, so it keeps moving at a steady speed on the straight track.",
              options: [
                { label: "steady speed", icon: "➡️" },
                { label: "speeds up", icon: "⏩" },
                { label: "stops", icon: "🛑" },
              ],
              answer: 0,
              why: "You heard 'zero', and a net force of zero does not change motion, so the train keeps its steady speed.",
            },
            {
              say: "A net force pushes the skateboard forward, so the skateboard speeds up.",
              options: [
                { label: "slows down", icon: "⏬" },
                { label: "speeds up", icon: "⏩" },
                { label: "steady speed", icon: "➡️" },
              ],
              answer: 1,
              why: "A net force that points forward adds speed, so the skateboard speeds up.",
            },
            {
              say: "The net force on the rolling ball points backward, so the ball slows down.",
              options: [
                { label: "speeds up", icon: "⏩" },
                { label: "steady speed", icon: "➡️" },
                { label: "slows down", icon: "⏬" },
              ],
              answer: 2,
              why: "A backward net force works against the ball's forward motion, so the ball slows down.",
            },
            {
              say: "Almost no force acts on the puck on very smooth ice, so it keeps sliding in a straight line.",
              options: [
                { label: "keeps sliding straight", icon: "➡️" },
                { label: "turns left", icon: "↰" },
                { label: "stops quickly", icon: "🛑" },
              ],
              answer: 0,
              why: "With almost no net force, the puck's motion hardly changes, so it keeps going in a straight line.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 5,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Sentence X-Ray: The Cyclist",
        mission:
          "Take apart the sentence about the cyclist, find the cause and the effect, and drag the chunks back into order.",
        grouping: "Whole Class",
        minutes: 5,
        tip: "Ask why 'Because the net force on the cyclist is zero.' is not a complete sentence by itself, and let students find the missing effect chunk.",
        support: {
          l1_2: "Tap each color and listen, then say the cause chunk.",
          l3_4: "Rebuild the sentence and name the cause and the effect.",
          l5_6: "Rebuild it, then write a new sentence with a net force that points forward.",
        },
        payload: {
          text: "Because the net force on the cyclist is zero, she keeps rolling at a steady speed in a straight line.",
          chunks: [
            { text: "Because", role: "Starts the cause", tone: "connector" },
            { text: "the net force on the cyclist is zero,", role: "The cause", tone: "concept" },
            { text: "she keeps rolling", role: "The effect", tone: "precision" },
            { text: "at a steady speed in a straight line.", role: "How she moves", tone: "evidence" },
          ],
          ask: "Which chunk is the cause, and which chunk is the effect?",
        },
      },
    },
    {
      step: "interact",
      minutes: 8,
      activity: {
        kind: "sentence_combine",
        domain: "Writing",
        title: "Join the Net Force to the Motion",
        mission:
          "Join each pair of short sentences with the connector so your new sentence links a net force to the motion it causes.",
        grouping: "Partners",
        minutes: 8,
        tip: "More than one correct order is possible; ask which part is the cause in each combination and why the connector fits.",
        support: {
          l1_2: "Copy the model, then change one word.",
          l3_4: "Combine with the connector and read the sentence aloud.",
          l5_6: "Combine, then move the connector to a new place and reread.",
        },
        payload: {
          items: [
            {
              sentences: [
                "The net force on the light-rail train is zero.",
                "The train keeps moving at a steady speed on straight track.",
              ],
              connector: "so",
              model:
                "The net force on the light-rail train is zero, so the train keeps moving at a steady speed on straight track.",
            },
            {
              sentences: ["The skateboard speeds up.", "The net force on it points forward."],
              connector: "because",
              model: "The skateboard speeds up because the net force on it points forward.",
            },
            {
              sentences: ["The net force on the rolling ball points backward.", "The ball slows down."],
              connector: "as a result",
              model: "The net force on the rolling ball points backward; as a result, the ball slows down.",
            },
            {
              sentences: [
                "The first cart has zero net force and stays at a steady speed.",
                "The second cart has a net force forward and keeps speeding up.",
              ],
              connector: "whereas",
              model:
                "The first cart has zero net force and stays at a steady speed, whereas the second cart has a net force forward and keeps speeding up.",
            },
          ],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Explain the Paddle Boat",
        mission:
          "Explain to your partner why a paddle boat on the Inner Harbor keeps a steady speed, starting your sentence with because.",
        grouping: "Partners",
        minutes: 5,
        tip: "Recordings stay on the student's device; listen for a complete because sentence with both a cause and an effect.",
        support: {
          l1_2: "Say 'The net force is zero, so the boat keeps a steady speed.'",
          l3_4: "Say one sentence that starts with Because and has a cause and an effect.",
          l5_6: "Name the two forces, say they are equal, and explain the motion in two connected sentences.",
        },
        payload: {
          prompt:
            "A paddle boat on the Inner Harbor keeps a steady speed in a straight line. Explain why, using the words net force.",
          frame: "Because the net force on the ___ is ___, the ___ ___.",
          model:
            "Because the push forward from the pedals equals the drag from the water, the net force on the paddle boat is zero, so it keeps a steady speed.",
          checklist: [
            "I started with Because and gave a cause.",
            "I said what the net force is and what the boat does.",
            "I named the forces or said they are equal.",
          ],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit03,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Speaking",
      title: "Point and Say: How It Moves",
      mission: "Point to each picture clue, say the motion word, then say the short sentence with the audio.",
      grouping: "Partners",
      minutes: 5,
      tip: "Roll a real toy car for each picture so students connect the words to the motion they just watched.",
      support: {
        l1_2: "Point and say one phrase at a time with your partner.",
        l3_4: "Point, say the phrase, and say the whole sentence.",
        l5_6: "Say the sentence, then change the object to one of your own.",
      },
      payload: {
        items: [
          {
            term: "steady speed",
            icon: "➡️",
            cue: "A toy car with three equal-length motion lines behind it.",
            say: "The car moves at a steady speed.",
            es: "rapidez constante",
          },
          {
            term: "speeds up",
            icon: "⏩",
            cue: "A toy car with motion lines that get longer and longer.",
            say: "The car speeds up.",
            es: "acelera (aumenta la rapidez)",
          },
          {
            term: "slows down",
            icon: "⏬",
            cue: "A toy car with motion lines that get shorter and shorter.",
            say: "The car slows down.",
            es: "frena (disminuye la rapidez)",
          },
          {
            term: "at rest",
            icon: "🛑",
            cue: "A toy car sitting still on a desk.",
            say: "The car is at rest.",
            es: "en reposo",
          },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Roll It, Speed It, Stop It",
      mission: "Listen to each command and make the toy car move that way.",
      grouping: "Partners",
      minutes: 4,
      tip: "Use a flat table or floor so the toy car's changes in speed are easy to see.",
      support: {
        l1_2: "Copy your partner and say the motion word.",
        l3_4: "Do each action and say what the car does.",
        l5_6: "Give the commands to your partner and say the cause of each change.",
      },
      payload: {
        items: [
          { command: "Hold the toy car still. It is at rest.", icon: "🚗" },
          { command: "Give the car one small push and watch it roll.", icon: "👉" },
          { command: "Push the car again to make it speed up.", icon: "⏩" },
          { command: "Put your hand in front of the car to slow it down.", icon: "✋" },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Motion Words",
      mission: "Say each word in English and in your home language, then tell your partner which one is a cognate.",
      grouping: "Partners",
      minutes: 4,
      tip: "Ask students to add the word in other languages they know, and treat the Spanish glosses as teacher-reviewed drafts.",
      support: {
        l1_2: "Say both words with a partner.",
        l3_4: "Say both words and one way they are alike or different.",
        l5_6: "Explain how each word is used in a sentence in each language.",
      },
      payload: {
        items: [
          {
            term: "acceleration",
            es: "aceleración",
            note: "Cognate: same sound, same meaning. In English it also includes slowing down and turning, not only speeding up.",
          },
          { term: "constant", es: "constante", note: "Cognate. A constant speed does not change." },
          {
            term: "direction",
            es: "dirección",
            note: "Cognate. In Spanish 'dirección' can also mean an address, but in science it is the way something moves.",
          },
          {
            term: "because",
            es: "porque",
            note: "'Porque' joins two ideas in Spanish, and 'because' does the same in English. Do not use it alone: 'Because the net force is zero.' needs a second part.",
          },
        ],
      },
    },
  ],
  extension: {
    kind: "write_scaffold",
    domain: "Writing",
    title: "Before and After Dragging a Foot",
    mission:
      "Write two connected explanations of how a skateboarder's motion and net force change when she drags a foot on the ground.",
    grouping: "Solo",
    minutes: 12,
    tip: "Score with the checklist and look for a cause-before-effect order in every because sentence.",
    materials: [],
    support: {
      l1_2: "Use one frame for each part and say each sentence aloud first.",
      l3_4: "Write all three parts and use because once and so once.",
      l5_6: "Write all three parts and name the direction of the net force each time.",
    },
    payload: {
      prompt:
        "A skateboarder at Patterson Park rides at a steady speed on a flat path. Then she drags one foot on the ground. Explain her motion before and after she drags her foot.",
      structure: [
        { part: "Before", frame: "Before she drags her foot, the net force on her is ___, so she ___." },
        { part: "Change", frame: "When she drags her foot, the ground pushes ___ on her foot." },
        { part: "After", frame: "Because the net force now points ___, she ___." },
      ],
      word_bank: ["because", "so", "net force", "steady speed", "backward", "slows down", "friction", "zero"],
      checklist: [
        "I said what the net force is before and after.",
        "I used because with a cause first and an effect second.",
        "I named the direction of the new force.",
      ],
      model:
        "Before she drags her foot, the net force on her is zero, so she keeps a steady speed. When she drags her foot, friction from the ground pushes backward on her foot. Because the net force now points backward, she slows down.",
    },
  },
  exit_check: exit03,
  teacher_card: {
    minutes: 27,
    materials: ["A toy car", "Mini whiteboards for force arrows", "Device with sound for each pair"],
    listen_for: [
      "Students start with 'Because' and then finish the sentence with a second clause, not a fragment.",
      "Students put the cause (the net force) before the effect (the motion).",
      "Students say 'steady speed' for zero net force instead of 'stopped'.",
    ],
    watchouts: [
      "Misconception: a moving object needs a net force to keep moving. At a steady speed in a straight line, the net force is zero.",
      "Reversed cause and effect: 'Because the sled speeds up, the net force is forward.' The net force is the cause of the change.",
      "Transfer: 'Because the net force is zero.' as a full answer (a fragment, common when 'porque' answers stand alone in Spanish and Arabic 'li-anna' answers do).",
    ],
    differentiation: {
      l1_2: "Give the starter 'The net force is zero, so ___' and let students tap a motion picture to finish it.",
      l3_4: "Ask for Because plus a comma plus a full second clause, and have partners check for the second clause.",
      l5_6: "Ask for the direction of the net force in every sentence, and for a sentence that reverses the cause and effect on purpose to find the error.",
      newcomer:
        "Use the toy car with Point and Say and the commands, and accept pointing, motion words, or home-language explanations.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

const exit04 = {
  kind: "exit_check",
  domain: "Reading",
  title: "Show What You Know: Claim and Evidence",
  mission:
    "Pick the best evidence, spot the reasoning, and fix a broken because sentence, then rate how well you can support a claim with data.",
  grouping: "Solo",
  minutes: 3,
  tip: "Collect the can-do ratings and check item 3 for because fragments before the next lesson.",
  support: {
    l1_2: "Use the audio button for each question, then tap an answer.",
    l3_4: "Read each question, tap an answer, and read the reason.",
    l5_6: "Answer, fix any mistake, then write your own claim with evidence.",
  },
  payload: {
    can_do: "I can make a claim and support it with data, evidence, and reasoning.",
    items: [
      {
        q: "Which sentence is the best evidence for the claim that sandpaper creates more friction than tile?",
        options: [
          "Sandpaper feels rough, so it must create more friction.",
          "The car rolled 0.5 meters on sandpaper and 2.4 meters on tile.",
          "I think sandpaper is the worst surface for toy cars.",
        ],
        answer: 1,
        why: "You need measurements from the investigation. A feeling or an opinion is not evidence, but two distances you can compare are.",
      },
      {
        q: "Which sentence is reasoning, not evidence?",
        options: [
          "On carpet the car rolled 0.8 meters.",
          "On cardboard the car rolled 1.5 meters.",
          "Friction pushes against the motion, so more friction stops the car sooner.",
        ],
        answer: 2,
        why: "Reasoning gives the science idea that explains the data. The other two sentences only report measurements.",
      },
      {
        q: "A student writes, 'Carpet has more friction. Because the car rolled 0.8 meters.' What is the best fix?",
        options: [
          "Carpet has more friction because the car rolled only 0.8 meters, while it rolled 2.4 meters on tile.",
          "Carpet has more friction, because.",
          "Because carpet has more friction. The car rolled.",
        ],
        answer: 0,
        why: "You can join the cause to the claim in one sentence and add the number for comparison. The other choices leave because without a full clause.",
      },
    ],
  },
};

const lesson04 = {
  id: "g8-sci-u1-l04",
  unit_id: "g8-sci-u1",
  version: 1,
  sequence: 4,
  source: "authored",
  title: "Use Data to Make a Claim",
  core_lesson_ref: {
    label: "Language session 4: friction data and the claim-evidence-reasoning frame",
    source: "language_pathway",
  },
  content_objective:
    "Students use distance data from a toy-car investigation to make a claim about friction, support it with measurements, and connect the data to the idea that friction pushes against motion.",
  language_objective: {
    klu: "Argue",
    function: "make a claim and support it with evidence and reasoning from data",
    forms: [
      "My claim is that ___.",
      "The evidence is that ___, but ___.",
      "This shows ___ because ___ / which suggests that ___",
    ],
    by_level: {
      l1_2: "I can say a claim and read one number from the data table with 'My claim is' and 'The data show'.",
      l3_4: "I can make a claim and support it with two numbers from the data table in connected sentences.",
      l5_6: "I can write a claim, evidence, and reasoning that links the data to friction, using because and which suggests.",
    },
  },
  standards: ["MS-PS2-2"],
  wida: {
    framework: "2020",
    language_expectation: "Science.6-8.Argue.Expressive",
    pld_targets: ["discourse", "sentence", "word"],
  },
  vocab: [
    { term: "friction", tier: 3, new_or_review: "new" },
    { term: "claim", tier: 2, new_or_review: "new" },
    { term: "evidence", tier: 2, new_or_review: "new" },
    { term: "reasoning", tier: 2, new_or_review: "new" },
    { term: "data", tier: 2, new_or_review: "new" },
  ],
  mentor_sentence: {
    text: "On carpet the car traveled 0.8 meters before stopping, but on tile it traveled 2.4 meters, which suggests that carpet creates more friction than tile.",
    chunks: [
      {
        text: "On carpet the car traveled 0.8 meters before stopping,",
        role: "First piece of evidence",
        tone: "evidence",
        ask: "Which surface and which number does this chunk give you?",
      },
      { text: "but", role: "Marks a contrast", tone: "connector", ask: "What changes after the word but?" },
      {
        text: "on tile it traveled 2.4 meters,",
        role: "Second piece of evidence",
        tone: "evidence",
        ask: "How does this number compare with the first one?",
      },
      {
        text: "which suggests that",
        role: "Links data to a conclusion",
        tone: "connector",
        ask: "Why does the writer say suggests instead of proves?",
      },
      {
        text: "carpet creates more friction than tile.",
        role: "The claim",
        tone: "concept",
        ask: "Which two surfaces does the claim compare?",
      },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Friction and Evidence Flip",
        mission:
          "Flip each card to check what friction is, which way it pushes, and what counts as a claim or as evidence.",
        grouping: "Partners",
        minutes: 4,
        tip: "Ask partners to give an example of friction from sneakers or a bike brake before they flip the first card.",
        support: {
          l1_2: "Use the icon to help you, say the answer, then flip.",
          l3_4: "Answer in a full sentence before you flip.",
          l5_6: "Answer, flip, then add an example from home or school.",
        },
        payload: {
          cards: [
            {
              prompt: "What is friction?",
              answer: "A force between touching surfaces that resists sliding.",
              icon: "🟫",
            },
            {
              prompt: "Which way does friction push compared with the motion of a sliding object?",
              answer: "In the opposite direction, against the motion.",
              icon: "↩️",
            },
            { prompt: "What is a claim?", answer: "A statement that answers the science question.", icon: "🚩" },
            { prompt: "What is evidence?", answer: "Measurements or observations that support the claim.", icon: "📊" },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "Claim, Evidence, or Reasoning?",
        mission:
          "Listen to four sentences from a lab discussion and tap whether each one is a claim, evidence, or reasoning.",
        grouping: "Solo",
        minutes: 5,
        tip: "Read each sentence twice; the numbers in the second sentence are the clue that it is evidence.",
        support: {
          l1_2: "Listen for numbers: numbers usually mean evidence.",
          l3_4: "Tap, then say the sentence beginning with the right starter.",
          l5_6: "Tap, then rewrite the sentence so it becomes the other two parts.",
        },
        payload: {
          items: [
            {
              say: "My claim is that the car slows down faster on carpet than on tile.",
              options: [
                { label: "claim", icon: "🚩" },
                { label: "evidence", icon: "📊" },
                { label: "reasoning", icon: "💡" },
              ],
              answer: 0,
              why: "You can tell it is a claim because it starts with 'My claim is' and answers the question.",
            },
            {
              say: "On tile the car rolled 2.4 meters, but on carpet it rolled only 0.8 meters.",
              options: [
                { label: "claim", icon: "🚩" },
                { label: "evidence", icon: "📊" },
                { label: "reasoning", icon: "💡" },
              ],
              answer: 1,
              why: "Measurements, such as 2.4 meters and 0.8 meters, are evidence.",
            },
            {
              say: "This is because friction pushes against the car's motion, so more friction stops it sooner.",
              options: [
                { label: "claim", icon: "🚩" },
                { label: "evidence", icon: "📊" },
                { label: "reasoning", icon: "💡" },
              ],
              answer: 2,
              why: "Reasoning explains why the evidence supports the claim, and this sentence uses the science idea of friction to do that.",
            },
            {
              say: "The numbers show that the car rolled farthest on tile.",
              options: [
                { label: "claim", icon: "🚩" },
                { label: "reasoning", icon: "💡" },
                { label: "evidence", icon: "📊" },
              ],
              answer: 2,
              why: "This sentence reports what the data show, so it is evidence.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 5,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Sentence X-Ray: Carpet and Tile",
        mission:
          "Take apart the sentence that compares carpet and tile, find the two pieces of evidence, and rebuild it.",
        grouping: "Whole Class",
        minutes: 5,
        tip: "Have students underline the numbers first, then circle 'which suggests that' and talk about why it is gentler than 'which proves'.",
        support: {
          l1_2: "Tap each color and listen, then say the two numbers.",
          l3_4: "Rebuild the sentence and tell which chunk is evidence and which is the claim.",
          l5_6: "Rebuild it, then write a new sentence with cardboard and sandpaper.",
        },
        payload: {
          text: "On carpet the car traveled 0.8 meters before stopping, but on tile it traveled 2.4 meters, which suggests that carpet creates more friction than tile.",
          chunks: [
            {
              text: "On carpet the car traveled 0.8 meters before stopping,",
              role: "First piece of evidence",
              tone: "evidence",
            },
            { text: "but", role: "Marks a contrast", tone: "connector" },
            { text: "on tile it traveled 2.4 meters,", role: "Second piece of evidence", tone: "evidence" },
            { text: "which suggests that", role: "Links data to a conclusion", tone: "connector" },
            { text: "carpet creates more friction than tile.", role: "The claim", tone: "concept" },
          ],
          ask: "Which chunk is the claim, and which chunks are the evidence?",
        },
      },
    },
    {
      step: "interact",
      minutes: 8,
      activity: {
        kind: "read_annotate",
        domain: "Reading",
        title: "Lab Report Detective: Surfaces",
        mission:
          "Read the short lab report like a detective and mark the claim, the evidence, the reasoning, and what stayed the same.",
        grouping: "Solo",
        minutes: 8,
        tip: "Students highlight in four colors, and the questions check that they can tell evidence (numbers) from reasoning (the science idea).",
        support: {
          l1_2: "Mark only the numbers in the evidence.",
          l3_4: "Mark the claim, the numbers, and the reasoning sentence.",
          l5_6: "Mark all four, then rewrite the last sentence with which suggests.",
        },
        payload: {
          text: "This sample report uses imagined data. Dev and Ana asked how the floor surface changes how far a toy car rolls. They let the same car go from the same spot on a ramp, then measured how far it rolled across four flat surfaces. On tile it rolled 2.4 meters. On cardboard it rolled 1.5 meters. On carpet it rolled 0.8 meters, and on sandpaper it rolled only 0.5 meters. Their claim is that rougher surfaces cause more friction. The car stopped sooner on every rougher surface, which supports the claim. Friction pushes against the car's motion, so more friction makes the car slow down more quickly.",
          marks: [
            {
              label: "Claim",
              instruction: "Highlight the words that tell you what the students are claiming.",
              targets: ["Their claim is that", "rougher surfaces cause more friction"],
            },
            {
              label: "Evidence",
              instruction: "Highlight the three measurements for tile, carpet, and sandpaper.",
              targets: [
                "On tile it rolled 2.4 meters",
                "On carpet it rolled 0.8 meters",
                "on sandpaper it rolled only 0.5 meters",
              ],
            },
            {
              label: "Reasoning",
              instruction: "Highlight the science idea that explains why the data support the claim.",
              targets: [
                "Friction pushes against the car's motion",
                "more friction makes the car slow down more quickly",
              ],
            },
            {
              label: "What stayed the same",
              instruction: "Highlight what the students kept the same in every trial.",
              targets: ["the same car", "the same spot on a ramp"],
            },
          ],
          questions: [
            {
              q: "What did Dev and Ana keep the same in every trial?",
              options: [
                "The floor surface",
                "The car and the starting spot on the ramp",
                "The distance the car rolled",
              ],
              answer: 1,
              why: "You can find it in the text: they used the same car from the same spot. The surface and the distance are the things that changed.",
            },
            {
              q: "Which sentence is evidence?",
              options: [
                "On carpet it rolled 0.8 meters.",
                "Their claim is that rougher surfaces cause more friction.",
                "Friction pushes against the car's motion.",
              ],
              answer: 0,
              why: "A measurement is evidence. The second sentence is the claim, and the third is a science idea used as reasoning.",
            },
            {
              q: "Which sentence is the reasoning that connects the data to the claim?",
              options: [
                "The car stopped sooner on every rougher surface.",
                "On tile it rolled 2.4 meters.",
                "Friction pushes against the car's motion, so more friction makes the car slow down more quickly.",
              ],
              answer: 2,
              why: "Reasoning explains why. This sentence uses the idea that friction pushes against motion to link the data to the claim.",
            },
            {
              q: "Based on the data, which surface has the most friction?",
              options: ["Tile", "Carpet", "Sandpaper"],
              answer: 2,
              why: "The car rolled the shortest distance, 0.5 meters, on sandpaper, so the most friction acted there.",
            },
          ],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Say Your Claim with Evidence",
        mission:
          "Make a claim about friction from the data table and support it out loud with two numbers and a reason.",
        grouping: "Solo",
        minutes: 5,
        tip: "Recordings stay on the student's device; ask a partner to listen for two numbers and the word because.",
        support: {
          l1_2: "Say 'My claim is...' and read one number from the table.",
          l3_4: "Say your claim, then give two numbers as evidence with but.",
          l5_6: "Say claim, evidence, and reasoning, and use because or which suggests.",
        },
        payload: {
          prompt:
            "Use the table (tile 2.4 m, cardboard 1.5 m, carpet 0.8 m, sandpaper 0.5 m). Make a claim about friction and support it with two numbers and a reason.",
          frame:
            "My claim is that ___. The evidence is that on ___ the car rolled ___ meters, but on ___ it rolled ___ meters. This shows ___ because ___.",
          model:
            "My claim is that carpet creates more friction than cardboard. The evidence is that on cardboard the car rolled 1.5 meters, but on carpet it rolled only 0.8 meters. This shows carpet has more friction because friction pushes against the car's motion and stops it sooner.",
          checklist: [
            "I started with my claim.",
            "I gave two numbers from the table and compared them.",
            "I gave a reason that uses the word friction.",
          ],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit04,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Speaking",
      title: "Point and Say: Evidence Words",
      mission:
        "Point to the picture for claim, evidence, data, or friction, say the word, then say its sentence with the audio.",
      grouping: "Partners",
      minutes: 5,
      tip: "Show the real towel and book with the pictures so students connect friction to something they can feel.",
      support: {
        l1_2: "Point and say one word at a time with your partner.",
        l3_4: "Point, say the word, and say the whole sentence.",
        l5_6: "Say the sentence, then change the surface to one of your own.",
      },
      payload: {
        items: [
          {
            term: "claim",
            icon: "🚩",
            cue: "A student points to one sentence on the board with a small flag.",
            say: "My claim is on the board.",
            es: "afirmación",
          },
          {
            term: "evidence",
            icon: "📊",
            cue: "A table with numbers and a finger pointing to one number.",
            say: "The numbers are my evidence.",
            es: "evidencia (pruebas)",
          },
          {
            term: "data",
            icon: "🔢",
            cue: "A ruler next to a toy car and a list of measurements.",
            say: "We write the data in a table.",
            es: "datos",
          },
          {
            term: "friction",
            icon: "🟫",
            cue: "A shoe sliding on a rough floor with a small arrow pointing backward.",
            say: "Friction slows the shoe.",
            es: "fricción (o rozamiento)",
          },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Slide, Rub, and Measure",
      mission: "Listen to each command and test friction with a book, a towel, and a ruler.",
      grouping: "Partners",
      minutes: 4,
      tip: "Give each pair one book and one towel; use the same push each time so the difference comes from the surface.",
      support: {
        l1_2: "Copy your partner and say 'slides' or 'stops'.",
        l3_4: "Do each action and say what you feel.",
        l5_6: "Give the commands to your partner and say which surface has more friction.",
      },
      payload: {
        items: [
          { command: "Slide the book across the smooth desk.", icon: "📘" },
          { command: "Slide the book across the towel.", icon: "🧺" },
          { command: "Rub your hands together and feel them get warm.", icon: "🙌" },
          { command: "Hold the ruler and point to how far the book slid.", icon: "📏" },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Claim and Evidence",
      mission: "Say each word in English and in your home language, then tell your partner which word needs a warning.",
      grouping: "Partners",
      minutes: 4,
      tip: "The word 'claim' is a false friend with 'reclamo', so say it out loud together before moving on.",
      support: {
        l1_2: "Say both words with a partner.",
        l3_4: "Say both words and tell one way they are alike or different.",
        l5_6: "Explain how each word is used in a science sentence in each language.",
      },
      payload: {
        items: [
          {
            term: "claim",
            es: "afirmación",
            note: "False friend: Spanish 'reclamo' means a complaint, not a science claim. Use 'afirmación' for the idea.",
          },
          {
            term: "evidence",
            es: "evidencia",
            note: "Cognate. In science the evidence is measurements or observations; in daily Spanish 'evidencia' can also mean something obvious.",
          },
          {
            term: "friction",
            es: "fricción",
            note: "Cognate. Some Spanish science books say 'rozamiento' for the same idea.",
          },
          {
            term: "data",
            es: "datos",
            note: "English uses 'data' with a plural verb in science writing: 'The data show'.",
          },
        ],
      },
    },
  ],
  extension: {
    kind: "write_scaffold",
    domain: "Writing",
    title: "Write a Claim About Shoe Soles",
    mission:
      "Write a claim, evidence, and reasoning paragraph that uses the shoe-sole data to say which sole creates the most friction.",
    grouping: "Solo",
    minutes: 12,
    tip: "Score with the checklist and look for numbers in the evidence and the word friction in the reasoning.",
    materials: [],
    support: {
      l1_2: "Use one frame for each part and read the numbers from the table.",
      l3_4: "Write all three parts and use but or whereas to compare two soles.",
      l5_6: "Write all three parts and add one more piece of evidence and which suggests.",
    },
    payload: {
      prompt:
        "Ana pushed each shoe across the gym floor with the same push. The rubber sole slid 0.9 meters, the leather sole slid 1.6 meters, and the plastic sole slid 2.3 meters. Which sole creates the most friction? Use claim, evidence, and reasoning.",
      structure: [
        { part: "Claim", frame: "The ___ sole creates the most friction." },
        { part: "Evidence", frame: "The ___ sole slid ___ meters, whereas the ___ sole slid ___ meters." },
        { part: "Reasoning", frame: "This shows more friction because friction ___ the motion, so the shoe ___." },
      ],
      word_bank: ["claim", "evidence", "friction", "whereas", "because", "slid", "rubber", "meters"],
      checklist: [
        "I made a claim that answers the question.",
        "I used numbers from the problem as evidence.",
        "I explained why with the word friction and because.",
      ],
      model:
        "The rubber sole creates the most friction. The rubber sole slid only 0.9 meters, whereas the plastic sole slid 2.3 meters. This shows more friction because friction pushes against the motion, so the shoe with the most friction stops after the shortest distance.",
    },
  },
  exit_check: exit04,
  teacher_card: {
    minutes: 28,
    materials: ["A book and a towel for each pair", "A ruler", "Highlighters in four colors"],
    listen_for: [
      "Students support a claim with numbers, not feelings ('it feels rough').",
      "Students say 'The data show' with a plural verb, or at least keep the numbers in the evidence sentence.",
      "Students use because or which suggests to link the evidence to the claim.",
    ],
    watchouts: [
      "Evidence slip: 'Sandpaper feels rough, so it has more friction.' Redirect to measured distances from the investigation.",
      "Fragment: 'Carpet has more friction. Because the car rolled 0.8 meters.' Show how to join the clauses with a comma or attach because to the first sentence.",
      "False friend: Spanish 'reclamo' means a complaint, so students may think a claim is a complaint; say 'afirmación' next to 'claim' when you introduce it.",
    ],
    differentiation: {
      l1_2: "Provide the claim starter and the table; students read one number and say 'The data show...'.",
      l3_4: "Require a claim and two numbers joined with but, and have partners check that both numbers appear.",
      l5_6: "Require claim, evidence, and reasoning, plus one sentence about what was kept the same in the investigation.",
      newcomer:
        "Use the book and towel with the pictures, and accept pointing to a surface and saying 'more friction'.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

const exit05 = {
  kind: "exit_check",
  domain: "Reading",
  title: "Show What You Know: Inertia",
  mission:
    "Choose the correct idea about inertia, explain why a passenger keeps moving forward, and pick the correct sentence, then rate yourself.",
  grouping: "Solo",
  minutes: 3,
  tip: "Collect the can-do ratings and check item 1 first, since it targets the idea that inertia is a force.",
  support: {
    l1_2: "Use the audio button for each question, then tap an answer.",
    l3_4: "Read each question, tap an answer, and read the reason.",
    l5_6: "Answer, fix any mistake, then explain inertia to a partner in your own words.",
  },
  payload: {
    can_do: "I can explain what happens in a sudden stop using inertia and a force.",
    items: [
      {
        q: "Which statement about inertia is correct?",
        options: [
          "Inertia is the tendency of an object to keep its motion until a force changes it.",
          "Inertia is a force that pushes riders forward.",
          "Inertia is the friction between the tires and the road.",
        ],
        answer: 0,
        why: "You can think of inertia as a property of every object with mass. It is not a push or a pull, so it is not a force.",
      },
      {
        q: "A car stops suddenly. Why does the passenger keep moving forward?",
        options: [
          "A force pushes the passenger forward after the car stops.",
          "The seat belt pulls the passenger forward.",
          "The passenger's body keeps moving at the old speed until a force slows it.",
        ],
        answer: 2,
        why: "No force pushes the passenger forward. The body keeps its motion because of inertia, and the seat belt then pushes back to slow it.",
      },
      {
        q: "Which sentence is written correctly?",
        options: [
          "When the bus brakes hard, riders keep moving forward because of inertia.",
          "When the bus brake hard, riders keeps moving forward because of inertia.",
          "When the bus brakes hard, riders keep moving forward because inertia of.",
        ],
        answer: 0,
        why: "You need the -s on 'brakes' because 'the bus' is one thing, and plain 'keep' for plural 'riders'. The third choice also leaves 'because of' without an ending.",
      },
    ],
  },
};

const lesson05 = {
  id: "g8-sci-u1-l05",
  unit_id: "g8-sci-u1",
  version: 1,
  sequence: 5,
  source: "authored",
  title: "Inertia and the Seat Belt",
  core_lesson_ref: { label: "Language session 5: inertia in sudden stops", source: "language_pathway" },
  content_objective:
    "Students explain that an object keeps its motion because of inertia until a force changes it, and that a seat belt or handrail supplies the force that stops a rider.",
  language_objective: {
    klu: "Explain",
    function: "explain what happens in a sudden stop and why, in order, using when, because, and so",
    forms: [
      "When ___, the ___ keep moving because of inertia.",
      "so a ___ must push back on them",
      "first / then / finally",
    ],
    by_level: {
      l1_2: "I can say what happens to a rider in a sudden stop, using a picture and the words keep moving and inertia.",
      l3_4: "I can explain a sudden stop in two or three sentences with when, because, and so.",
      l5_6: "I can explain a sudden stop in order with first, then, and finally, name the force that stops the rider, and say why inertia is not a force.",
    },
  },
  standards: ["MS-PS2-2"],
  wida: {
    framework: "2020",
    language_expectation: "Science.6-8.Explain.Expressive",
    pld_targets: ["discourse", "sentence", "word"],
  },
  vocab: [
    { term: "inertia", tier: 3, new_or_review: "new" },
    { term: "seat belt", tier: 2, new_or_review: "new" },
    { term: "brake", tier: 2, new_or_review: "new" },
    { term: "sudden", tier: 2, new_or_review: "new" },
    { term: "force", tier: 2, new_or_review: "review" },
  ],
  mentor_sentence: {
    text: "When a car on I-83 brakes hard, the passengers keep moving forward because of their inertia, so a seat belt must push back on them.",
    chunks: [
      {
        text: "When a car on I-83 brakes hard,",
        role: "The event",
        tone: "evidence",
        ask: "What does the driver do, and what is the road?",
      },
      {
        text: "the passengers keep moving forward",
        role: "What happens to the riders",
        tone: "precision",
        ask: "Do the passengers stop with the car? Which phrase tells you?",
      },
      {
        text: "because of their inertia,",
        role: "The science reason",
        tone: "concept",
        ask: "Which noun is the reason, and does the sentence call it a force?",
      },
      {
        text: "so",
        role: "Signals what is needed next",
        tone: "connector",
        ask: "What kind of result does so introduce?",
      },
      {
        text: "a seat belt must push back on them.",
        role: "The force that stops them",
        tone: "precision",
        ask: "Which object gives the force, and which way does it push?",
      },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Motion Review Flip",
        mission:
          "Flip each card to check what you know about steady speed, net force, and friction before we study sudden stops.",
        grouping: "Partners",
        minutes: 4,
        tip: "Ask partners to picture a bus on North Avenue as they answer, so the examples lead into the sudden-stop phenomenon.",
        support: {
          l1_2: "Use the icon, say the answer, then flip.",
          l3_4: "Answer in a full sentence before you flip.",
          l5_6: "Answer, flip, then add one more example from a bus or a car.",
        },
        payload: {
          cards: [
            {
              prompt: "What is the net force on an object moving at a steady speed in a straight line?",
              answer: "Zero. The forces are balanced.",
              icon: "⚖️",
            },
            {
              prompt: "What does a net force do to a moving object?",
              answer: "It changes the object's speed or direction.",
              icon: "↗️",
            },
            {
              prompt: "Which way does friction push a sliding object?",
              answer: "Against the motion, in the opposite direction.",
              icon: "↩️",
            },
            {
              prompt: "Name one force that can stop a rolling ball.",
              answer: "Friction from the ground, or a hand pushing against the ball.",
              icon: "⚽",
            },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "What Happens to the Riders?",
        mission:
          "Listen to four scenes about buses and cars that start, stop, or turn, and tap what happens to the riders.",
        grouping: "Solo",
        minutes: 5,
        tip: "Pause after each scene and ask where the riders end up compared with the vehicle.",
        support: {
          l1_2: "Listen, tap a picture, then listen again with the words showing.",
          l3_4: "Tap, then say the sentence back with the word when.",
          l5_6: "Tap, then say why it happens using inertia.",
        },
        payload: {
          items: [
            {
              say: "When the driver brakes hard, the bus slows down, but the riders keep moving forward.",
              options: [
                { label: "riders keep moving forward", icon: "➡️" },
                { label: "riders stop at once", icon: "🛑" },
                { label: "riders move backward", icon: "⬅️" },
              ],
              answer: 0,
              why: "You heard 'but': the bus slows down, while the riders' bodies keep moving forward at the old speed.",
            },
            {
              say: "When the bus suddenly speeds up, a standing rider seems to lean backward.",
              options: [
                { label: "seems to lean forward", icon: "➡️" },
                { label: "seems to lean backward", icon: "⬅️" },
                { label: "seems to jump up", icon: "⬆️" },
              ],
              answer: 1,
              why: "The bus speeds up, but the rider's body tends to keep its old motion, so she seems to lean backward compared with the bus.",
            },
            {
              say: "The seat belt pushes back on the passenger, so the passenger slows down with the car.",
              options: [
                { label: "a force called inertia", icon: "❓" },
                { label: "a force from the belt", icon: "🔗" },
                { label: "no force at all", icon: "🚫" },
              ],
              answer: 1,
              why: "The belt gives a real push that changes the passenger's motion. Inertia is not a force; it is a property of every object that has mass.",
            },
            {
              say: "When the bus turns left suddenly, a standing rider seems to lean to the right.",
              options: [
                { label: "lean left", icon: "⬅️" },
                { label: "lean up", icon: "⬆️" },
                { label: "lean right", icon: "➡️" },
              ],
              answer: 2,
              why: "The rider's body tends to keep moving straight while the bus turns left, so she seems to lean right compared with the bus.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 5,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Sentence X-Ray: The Seat Belt",
        mission: "Take apart the sentence about passengers on I-83, find the science reason, and rebuild it in order.",
        grouping: "Whole Class",
        minutes: 5,
        tip: "Ask whether inertia is a force in this sentence; the belt is the thing that pushes, and inertia is only the reason the passengers keep moving.",
        support: {
          l1_2: "Tap each color and listen, then say the event chunk.",
          l3_4: "Rebuild the sentence and tell which chunk is the reason.",
          l5_6: "Rebuild it, then write a new sentence about a bus and a handrail.",
        },
        payload: {
          text: "When a car on I-83 brakes hard, the passengers keep moving forward because of their inertia, so a seat belt must push back on them.",
          chunks: [
            { text: "When a car on I-83 brakes hard,", role: "The event", tone: "evidence" },
            { text: "the passengers keep moving forward", role: "What happens to the riders", tone: "precision" },
            { text: "because of their inertia,", role: "The science reason", tone: "concept" },
            { text: "so", role: "Signals what is needed next", tone: "connector" },
            { text: "a seat belt must push back on them.", role: "The force that stops them", tone: "precision" },
          ],
          ask: "Which chunk gives the reason, and which chunk gives the force?",
        },
      },
    },
    {
      step: "interact",
      minutes: 8,
      activity: {
        kind: "sequence",
        domain: "Speaking",
        title: "A Sudden Stop, Step by Step",
        mission: "Put the six steps of a sudden stop in order, then retell them to your partner with the signal words.",
        grouping: "Partners",
        minutes: 8,
        tip: "Listen for 'because' at step four and for the seat belt as the force at step five; many students put inertia in the place of the force.",
        support: {
          l1_2: "Put the steps in order with the pictures, then say first and finally.",
          l3_4: "Retell the steps using first, then, and finally.",
          l5_6: "Retell the steps and add because and as a result in the right places.",
        },
        payload: {
          title: "What happens in a sudden stop",
          steps: [
            "A car on I-83 moves at a steady speed, and the passengers move with it.",
            "The driver brakes hard, and the road pushes backward on the tires.",
            "The car's speed drops quickly.",
            "The passengers' bodies keep moving forward at the old speed because of inertia.",
            "The seat belts push back on the passengers' chests and hips.",
            "The passengers slow down and stop together with the car.",
          ],
          signals: ["first", "then", "next", "because", "as a result", "finally"],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Explain the Sudden Stop",
        mission:
          "Explain to your partner what happens to a passenger when a car brakes hard and why a seat belt helps.",
        grouping: "Partners",
        minutes: 5,
        tip: "Recordings stay on the student's device; listen for the force that stops the rider and for inertia used as a reason.",
        support: {
          l1_2: "Say the first frame sentence and point to the seat belt picture.",
          l3_4: "Say two sentences with when and because.",
          l5_6: "Say three sentences in order and name the force that stops the passenger.",
        },
        payload: {
          prompt:
            "Explain what happens to a passenger when a car brakes hard, and why a seat belt helps. Use the word inertia.",
          frame: "When ___, the ___ keep moving ___ because of ___. So the ___ must ___.",
          model:
            "When the car brakes hard, the passengers keep moving forward because of their inertia. The seat belt pushes back on them, so they slow down with the car.",
          checklist: [
            "I said what the car does and what the passengers do.",
            "I used because of and the word inertia.",
            "I said the seat belt is the force that stops the passengers.",
          ],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit05,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Speaking",
      title: "Point and Say: Brake and Belt",
      mission:
        "Point to the brake, the seat belt, the passenger, or the sliding block, say the word, then say its sentence.",
      grouping: "Partners",
      minutes: 5,
      tip: "Use the toy car and a small block as a passenger to show the picture before students say the word.",
      support: {
        l1_2: "Point and say one word at a time with your partner.",
        l3_4: "Point, say the word, and say the whole sentence.",
        l5_6: "Say the sentence, then change the vehicle to one of your own.",
      },
      payload: {
        items: [
          {
            term: "brake",
            icon: "🛑",
            cue: "A driver's foot pressing the brake pedal and a car slowing down.",
            say: "The driver brakes.",
            es: "frenar (el freno)",
          },
          {
            term: "seat belt",
            icon: "🔗",
            cue: "A passenger in a car seat with a belt across the chest.",
            say: "The seat belt holds me.",
            es: "cinturón de seguridad",
          },
          {
            term: "passenger",
            icon: "🧍",
            cue: "A person sitting in the back seat of a car.",
            say: "The passenger moves forward.",
            es: "pasajero",
          },
          {
            term: "inertia",
            icon: "➡️",
            cue: "A small block sliding forward on top of a toy car that has just stopped.",
            say: "Inertia keeps the block moving.",
            es: "inercia",
          },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Stop the Toy Car",
      mission: "Listen to each command and test a sudden stop with a toy car, a small block, and a book.",
      grouping: "Partners",
      minutes: 4,
      tip: "Keep the block loose on the car for the first stop, then hold it with a finger like a seat belt for the second stop.",
      support: {
        l1_2: "Copy your partner and say 'forward' when the block moves.",
        l3_4: "Do each action and say what the block does.",
        l5_6: "Give the commands to your partner and explain what the finger did.",
      },
      payload: {
        items: [
          { command: "Put the small block on top of the toy car.", icon: "🧱" },
          { command: "Roll the car toward the book and watch it stop.", icon: "📘" },
          { command: "Look at the block. Point to where it moves.", icon: "👉" },
          { command: "Roll again, but hold the block with one finger like a seat belt.", icon: "☝️" },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Stops and Belts",
      mission: "Say each word in English and in your home language, then tell your partner which words sound alike.",
      grouping: "Partners",
      minutes: 4,
      tip: "Invite students to add the word in other languages they speak, and treat the Spanish glosses as teacher-reviewed drafts.",
      support: {
        l1_2: "Say both words with a partner.",
        l3_4: "Say both words and one way they are alike or different.",
        l5_6: "Explain how each word is used in a sentence in each language.",
      },
      payload: {
        items: [
          {
            term: "inertia",
            es: "inercia",
            note: "Cognate: same word, same meaning. It is a property of objects, not a force.",
          },
          {
            term: "seat belt",
            es: "cinturón de seguridad",
            note: "'Cinturón' is the belt and 'seguridad' means safety. In English the three parts are seat, belt, and the idea of being safe.",
          },
          {
            term: "brake",
            es: "frenar (el freno)",
            note: "The English word is both a verb (to brake) and a noun (the brake). Spanish uses 'frenar' for the verb and 'freno' for the noun.",
          },
          {
            term: "sudden",
            es: "repentino (o súbito)",
            note: "'Súbito' shares a Latin root with sudden. A sudden stop is one that happens quickly and without warning.",
          },
        ],
      },
    },
  ],
  extension: {
    kind: "write_scaffold",
    domain: "Writing",
    title: "Why Riders Lurch Forward",
    mission:
      "Write a short explanation of why a standing rider on an MTA bus lurches forward when the bus brakes and how a handrail helps.",
    grouping: "Solo",
    minutes: 12,
    tip: "Score with the checklist and check that inertia is used as the reason and the handrail as the force.",
    materials: [],
    support: {
      l1_2: "Use one frame for each part and say each sentence aloud first.",
      l3_4: "Write all four parts and use because and so once each.",
      l5_6: "Write all four parts and add a sentence about what would happen on very smooth ice.",
    },
    payload: {
      prompt:
        "A rider stands in an MTA bus without holding on. The driver brakes hard, and the rider lurches forward. Explain why, and explain how holding the handrail helps.",
      structure: [
        { part: "Event", frame: "When the driver brakes hard, the bus ___." },
        { part: "Inertia", frame: "The rider keeps moving forward because ___." },
        { part: "Force", frame: "The handrail ___, so the rider ___." },
        { part: "Result", frame: "As a result, riders who ___ stop with the bus." },
      ],
      word_bank: ["inertia", "because", "so", "handrail", "forward", "slows down", "force", "as a result"],
      checklist: [
        "I told what the bus does and what the rider does.",
        "I used inertia as the reason.",
        "I named the handrail as the force that changes the rider's motion.",
      ],
      model:
        "When the driver brakes hard, the bus slows down quickly. The rider keeps moving forward because of inertia. The handrail pulls back on the rider's hand, so the rider slows down with the bus. As a result, riders who hold on stop with the bus.",
    },
  },
  exit_check: exit05,
  teacher_card: {
    minutes: 28,
    materials: [
      "A toy car, a small block, and a book for each pair",
      "Strips of paper numbered 1 to 6 for the sequence",
      "Device with sound for each pair",
    ],
    listen_for: [
      "Students say that the passengers 'keep moving' and not that a force 'throws' them forward.",
      "Students name the seat belt or handrail as the force, and inertia as the reason.",
      "Students use when, because, and so in a complete order from first to finally.",
    ],
    watchouts: [
      "Misconception: inertia is a force that pushes or keeps pushing things forward. Say it every time: inertia is a property, and a real force from the belt changes the motion.",
      "Misconception: a forward force acts on riders in a sudden stop. There is no forward force; their bodies just keep moving until a belt or seat pushes back.",
      "Transfer: dropped third-person -s in 'When the bus brake hard' (Spanish and Arabic speakers), and 'When' clauses with no comma or no main clause.",
    ],
    differentiation: {
      l1_2: "Give the sequence as picture strips with sentences, and ask for 'first' and 'finally' with the word bank.",
      l3_4: "Ask for when, because, and so in at least two sentences, in the right order.",
      l5_6: "Ask for first, then, and finally, plus a sentence that says why inertia is not a force.",
      newcomer:
        "Use the toy car, block, and book; accept pointing to where the block goes and saying 'forward' or 'inercia' in the home language.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

const exit06 = {
  kind: "exit_check",
  domain: "Reading",
  title: "Show What You Know: Mass and Acceleration",
  mission:
    "Calculate one acceleration, compare two carts, and pick the sentence with the correct connector, then rate yourself.",
  grouping: "Solo",
  minutes: 3,
  tip: "Collect the can-do ratings and check item 1 for multiplying instead of dividing before the next lesson.",
  support: {
    l1_2: "Use the audio button for each question, then tap an answer.",
    l3_4: "Read each question, tap an answer, and read the reason.",
    l5_6: "Answer, fix any mistake, then write the calculation in words.",
  },
  payload: {
    can_do: "I can explain how mass and net force change acceleration and calculate a simple acceleration.",
    items: [
      {
        q: "A 3 kg cart gets a net force of 12 N. What is its acceleration?",
        options: ["36 m/s²", "9 m/s²", "4 m/s²"],
        answer: 2,
        why: "You divide: 12 newtons divided by 3 kilograms is 4 meters per second squared. Multiplying gives 36, and subtracting gives 9, but neither matches the formula.",
      },
      {
        q: "Two carts get the same net force. Cart X has a mass of 1 kg, and Cart Y has a mass of 5 kg. Which statement is correct?",
        options: [
          "Cart Y accelerates more because it has more mass.",
          "Cart X accelerates more because it has less mass.",
          "They accelerate the same because the force is the same.",
        ],
        answer: 1,
        why: "With the same net force, the cart with less mass has the larger acceleration. The force is the same, but the masses are not, so the accelerations differ.",
      },
      {
        q: "Which sentence explains the result correctly?",
        options: [
          "Because the cart has more mass, so it accelerates less.",
          "Because the cart has more mass, it accelerates less when the net force stays the same.",
          "The cart has more mass because it accelerates less.",
        ],
        answer: 1,
        why: "You need one connector in each sentence, and the cause comes first. The first choice uses both because and so, and the third choice reverses the cause and the effect.",
      },
    ],
  },
};

const lesson06 = {
  id: "g8-sci-u1-l06",
  unit_id: "g8-sci-u1",
  version: 1,
  sequence: 6,
  source: "authored",
  title: "Same Push, Different Mass",
  core_lesson_ref: { label: "Language session 6: net force, mass, and acceleration", source: "language_pathway" },
  content_objective:
    "Students use acceleration = net force ÷ mass to explain why the same net force gives a smaller acceleration to an object with more mass, and to calculate simple accelerations.",
  language_objective: {
    klu: "Explain",
    function: "explain cause and effect among net force, mass, and acceleration, with numbers as evidence",
    forms: [
      "When the same net force acts on ___, the ___ with less mass ___.",
      "so it speeds up more quickly",
      "acceleration = net force ÷ mass",
    ],
    by_level: {
      l1_2: "I can say which cart speeds up more, using the words more mass, less mass, and speeds up.",
      l3_4: "I can explain which cart accelerates more and why, using when and so in one or two sentences.",
      l5_6: "I can explain how mass and net force change acceleration and use numbers from acceleration = net force ÷ mass as evidence.",
    },
  },
  standards: ["MS-PS2-2"],
  wida: {
    framework: "2020",
    language_expectation: "Science.6-8.Explain.Expressive",
    pld_targets: ["discourse", "sentence", "word"],
  },
  vocab: [
    { term: "mass", tier: 3, new_or_review: "review" },
    { term: "net force", tier: 3, new_or_review: "review" },
    { term: "acceleration", tier: 3, new_or_review: "review" },
    { term: "newton", tier: 3, new_or_review: "review" },
    { term: "formula", tier: 2, new_or_review: "new" },
  ],
  mentor_sentence: {
    text: "When the same net force acts on two carts, the cart with less mass has a greater acceleration, so it speeds up more quickly.",
    chunks: [
      {
        text: "When the same net force acts on two carts,",
        role: "The condition that stays the same",
        tone: "concept",
        ask: "What is the same for both carts, and what is different?",
      },
      {
        text: "the cart with less mass has a greater acceleration,",
        role: "The effect on one cart",
        tone: "precision",
        ask: "Which cart is it, and which noun tells you how its motion changes?",
      },
      {
        text: "so",
        role: "Signals the result",
        tone: "connector",
        ask: "What does so connect to what came before it?",
      },
      {
        text: "it speeds up more quickly.",
        role: "What you would see",
        tone: "evidence",
        ask: "What would you notice if you watched both carts?",
      },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Mass and Newton Flip",
        mission:
          "Flip each card to check what mass, acceleration, and a newton mean and to make one quick prediction about two carts.",
        grouping: "Partners",
        minutes: 4,
        tip: "Have partners agree on the prediction card before they flip it, and revisit their prediction at the end of the lesson.",
        support: {
          l1_2: "Use the icon, say the answer, then flip.",
          l3_4: "Answer in a full sentence before you flip.",
          l5_6: "Answer, flip, then say why in one sentence with because.",
        },
        payload: {
          cards: [
            { prompt: "What is mass?", answer: "The amount of matter in an object, measured in kilograms.", icon: "⚖️" },
            { prompt: "What is acceleration?", answer: "A change in speed or direction over time.", icon: "🏃" },
            {
              prompt: "What is one newton in simple words?",
              answer: "The net force that gives a 1 kilogram object an acceleration of 1 meter per second squared.",
              icon: "🍎",
            },
            {
              prompt:
                "Predict: you push an empty shopping cart and a full one with the same push. Which speeds up more?",
              answer: "The empty cart, because it has less mass.",
              icon: "🛒",
            },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "Carts, Pushes, and Numbers",
        mission: "Listen to four statements about carts, pushes, and mass, then tap the result you hear.",
        grouping: "Solo",
        minutes: 5,
        tip: "Read the number statement slowly; students who tap 16 multiplied the force by the mass instead of dividing.",
        support: {
          l1_2: "Listen, tap a picture, then listen again with the words showing.",
          l3_4: "Tap, then say the sentence back with the numbers.",
          l5_6: "Tap, then explain how you got the answer in a sentence.",
        },
        payload: {
          items: [
            {
              say: "The empty cart has less mass, so the same push makes it speed up more.",
              options: [
                { label: "both the same", icon: "🟰" },
                { label: "empty cart", icon: "🛒" },
                { label: "full cart", icon: "🧺" },
              ],
              answer: 1,
              why: "You heard 'less mass': with the same push, the cart with less mass accelerates more.",
            },
            {
              say: "A net force of 8 newtons pushes a 2-kilogram cart, so its acceleration is 4 meters per second squared.",
              options: [
                { label: "4 m/s²", icon: "4️⃣" },
                { label: "16 m/s²", icon: "🔢" },
                { label: "10 m/s²", icon: "🔟" },
              ],
              answer: 0,
              why: "You divide the net force by the mass: 8 newtons divided by 2 kilograms is 4 meters per second squared.",
            },
            {
              say: "If you double the net force on the same cart, the acceleration doubles too.",
              options: [
                { label: "acceleration stays the same", icon: "🟰" },
                { label: "acceleration is cut in half", icon: "➗" },
                { label: "acceleration doubles", icon: "✖️" },
              ],
              answer: 2,
              why: "With the same mass, twice the net force gives twice the acceleration.",
            },
            {
              say: "If you add more mass but keep the same push, the cart speeds up less.",
              options: [
                { label: "speeds up more", icon: "⏩" },
                { label: "speeds up less", icon: "🐢" },
                { label: "speeds up the same", icon: "🟰" },
              ],
              answer: 1,
              why: "More mass with the same net force means a smaller acceleration, so the cart speeds up less.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 5,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Sentence X-Ray: Two Carts",
        mission:
          "Take apart the sentence about two carts and the same net force, find what stays the same, and rebuild it.",
        grouping: "Whole Class",
        minutes: 5,
        tip: "Ask students which chunk names what is controlled (the same net force) and which names what changes, then have them swap the word less for more and revise the rest.",
        support: {
          l1_2: "Tap each color and listen, then say the first chunk.",
          l3_4: "Rebuild the sentence and tell what stays the same.",
          l5_6: "Rebuild it, then rewrite it for a cart with more mass.",
        },
        payload: {
          text: "When the same net force acts on two carts, the cart with less mass has a greater acceleration, so it speeds up more quickly.",
          chunks: [
            {
              text: "When the same net force acts on two carts,",
              role: "The condition that stays the same",
              tone: "concept",
            },
            {
              text: "the cart with less mass has a greater acceleration,",
              role: "The effect on one cart",
              tone: "precision",
            },
            { text: "so", role: "Signals the result", tone: "connector" },
            { text: "it speeds up more quickly.", role: "What you would see", tone: "evidence" },
          ],
          ask: "Which chunk tells you what is the same for both carts?",
        },
      },
    },
    {
      step: "interact",
      minutes: 8,
      activity: {
        kind: "talk_cards",
        domain: "Speaking",
        title: "Cart Talk: Predict and Check",
        mission:
          "Take turns drawing a cart card, predict what happens to the acceleration, and let your partner check your numbers with a move card.",
        grouping: "Partners",
        minutes: 8,
        tip: "Listen for the formula in words ('net force divided by mass') and for a cause clause with because or when in every turn.",
        materials: ["Partner role cards", "Calculator for checking"],
        support: {
          l1_2: "Point to the card and say the first half of the starter.",
          l3_4: "Say a cause and an effect with numbers every turn.",
          l5_6: "Say the cause, the effect, and the calculation, then answer your partner's follow-up.",
        },
        payload: {
          roles: { a: "Predictor", b: "Checker" },
          cards: [
            {
              prompt:
                "Two carts get the same 8 N net force. Cart A has a mass of 2 kg, and Cart B has a mass of 4 kg. Which cart accelerates more, and what are both accelerations?",
              starter:
                "Because the net force is the same, the cart with ___ mass ___; Cart A accelerates at ___ and Cart B at ___.",
              follow_up: "How do you get each number from the formula?",
            },
            {
              prompt:
                "Cart B (4 kg) now gets a 16 N net force. How does its acceleration compare with Cart A's acceleration from the first card?",
              starter: "When the net force doubles and the mass stays the same, the acceleration ___.",
              follow_up: "So how do the two accelerations compare, and why?",
            },
            {
              prompt:
                "At Druid Hill Park, you push an empty wagon and then a wagon full of picnic gear with the same net force. What changes, and why?",
              starter: "Because the mass ___, the acceleration ___, so the wagon ___.",
              follow_up: "What would you change to make the full wagon speed up as much as the empty one?",
            },
            {
              prompt: "You want a 2 kg cart to reach an acceleration of 3 m/s². What net force do you need?",
              starter: "I need a net force of ___ because acceleration times mass equals ___.",
              follow_up: "What would the acceleration be if you cut the net force to 3 N?",
            },
            {
              prompt: "A 10 N net force gives a cart an acceleration of 5 m/s². What is the mass of the cart?",
              starter: "The mass is ___ because the net force divided by the acceleration is ___.",
              follow_up: "What would the acceleration be if you added 2 kg to the cart and kept the same net force?",
            },
            {
              prompt: "A student says, 'A heavier cart always accelerates less.' Is that always true?",
              starter: "That is only true when ___ is the same, because acceleration depends on both ___ and ___.",
              follow_up: "Give an example where a heavier cart accelerates more than a lighter cart.",
            },
          ],
          moves: [
            { label: "Ask for numbers", stem: "What were the net force and the mass?" },
            { label: "Check the cause", stem: "Was the net force the same for both carts?" },
            { label: "Push the effect", stem: "So the acceleration is ___, as a result." },
          ],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Explain the Two Carts Aloud",
        mission:
          "Explain out loud which of two carts speeds up more under the same 8 N net force, and give both accelerations.",
        grouping: "Solo",
        minutes: 5,
        tip: "Recordings stay on the student's device; ask a partner to listen for the same net force, the mass comparison, and two numbers.",
        support: {
          l1_2: "Say 'Cart A has less mass, so it speeds up more.'",
          l3_4: "Say a sentence with when and so, then say one number.",
          l5_6: "Say the explanation and give both accelerations with units.",
        },
        payload: {
          prompt:
            "Cart A has a mass of 2 kg and Cart B has a mass of 4 kg. Both get an 8 N net force. Explain which cart accelerates more and give both accelerations.",
          frame:
            "When the same net force acts on two carts, the cart with ___ mass has ___ acceleration, so ___. Cart A: ___ m/s²; Cart B: ___ m/s².",
          model:
            "When the same 8 newton net force acts on both carts, the cart with less mass has the greater acceleration, so Cart A speeds up more quickly. Cart A accelerates at 4 meters per second squared, and Cart B accelerates at 2 meters per second squared.",
          checklist: [
            "I said the net force is the same for both carts.",
            "I compared the masses and said which cart accelerates more.",
            "I gave both accelerations with units.",
          ],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit06,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Speaking",
      title: "Point and Say: Heavy and Light Carts",
      mission:
        "Point to the heavy car, the light car, or the balance scale, say the word, then say which car speeds up more.",
      grouping: "Partners",
      minutes: 5,
      tip: "Use two identical toy cars, one loaded with coins or blocks, so students can lift both and feel the difference.",
      support: {
        l1_2: "Point and say one word at a time with your partner.",
        l3_4: "Point, say the word, and say the whole sentence.",
        l5_6: "Say the sentence, then change the objects to ones of your own.",
      },
      payload: {
        items: [
          {
            term: "mass",
            icon: "⚖️",
            cue: "A balance scale with a bowling ball on one side and a tennis ball on the other.",
            say: "The bowling ball has more mass.",
            es: "masa",
          },
          {
            term: "heavy",
            icon: "🏋️",
            cue: "A toy car loaded with many blocks.",
            say: "The loaded car is heavy.",
            es: "pesado",
          },
          {
            term: "light",
            icon: "🪶",
            cue: "A toy car with nothing on it.",
            say: "The empty car is light.",
            es: "liviano (o ligero)",
          },
          {
            term: "speeds up",
            icon: "⏩",
            cue: "A toy car with motion lines that grow longer.",
            say: "The light car speeds up more.",
            es: "acelera",
          },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Load the Car and Push",
      mission: "Listen to each command and test an empty toy car and a loaded toy car with the same push.",
      grouping: "Partners",
      minutes: 4,
      tip: "Have one partner push both cars with a ruler held at the same angle so the pushes are as similar as possible.",
      support: {
        l1_2: "Copy your partner and point to the car that speeds up more.",
        l3_4: "Do each action and say which car speeds up more.",
        l5_6: "Give the commands to your partner and explain why using mass.",
      },
      payload: {
        items: [
          { command: "Put four blocks on one toy car.", icon: "🧱" },
          { command: "Leave the other toy car empty.", icon: "🚗" },
          { command: "Push both cars with one finger. Use the same push.", icon: "👉" },
          { command: "Point to the car that speeds up more.", icon: "☝️" },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Mass and Formula",
      mission: "Say each word in English and in your home language, then tell your partner one warning about a word.",
      grouping: "Partners",
      minutes: 4,
      tip: "Invite students to add the word in other languages they know, and treat the Spanish glosses as teacher-reviewed drafts.",
      support: {
        l1_2: "Say both words with a partner.",
        l3_4: "Say both words and one way they are alike or different.",
        l5_6: "Explain how each word is used in a science sentence in each language.",
      },
      payload: {
        items: [
          {
            term: "mass",
            es: "masa",
            note: "Cognate, but 'masa' also means dough or a crowd of people. In science it is the amount of matter in an object.",
          },
          {
            term: "acceleration",
            es: "aceleración",
            note: "Cognate: same sound, same meaning. It includes slowing down and turning, not only speeding up.",
          },
          {
            term: "formula",
            es: "fórmula",
            note: "Cognate. In science, a formula such as a = F ÷ m shows how quantities connect.",
          },
          {
            term: "kilogram",
            es: "kilogramo",
            note: "Cognate. Students often say 'kilo' for mass, and that is correct for kilogram.",
          },
        ],
      },
    },
  ],
  extension: {
    kind: "write_scaffold",
    domain: "Writing",
    title: "Explain Two Carts with Numbers",
    mission:
      "Write a cause-and-effect explanation of how a light cart and a heavy cart speed up under the same 3 N net force.",
    grouping: "Solo",
    minutes: 12,
    tip: "Score with the checklist and check that both accelerations are calculated by dividing, with units.",
    materials: [],
    support: {
      l1_2: "Use one frame for each part and say each sentence aloud first.",
      l3_4: "Write all four parts and use because and so once each.",
      l5_6: "Write all four parts and add what would happen if the net force doubled.",
    },
    payload: {
      prompt:
        "A cart with a mass of 0.5 kg and a cart with a mass of 1.5 kg each get a steady net force of 3 N. Explain which cart accelerates more and give both accelerations.",
      structure: [
        { part: "Cause", frame: "Because the same net force of ___ acts on both carts," },
        { part: "Effect", frame: "the cart with ___ mass has the ___ acceleration." },
        { part: "Evidence", frame: "The 0.5 kg cart has an acceleration of ___, whereas the 1.5 kg cart has ___." },
        {
          part: "Reasoning",
          frame: "This happens because acceleration equals ___ divided by ___, so more mass leads to ___.",
        },
      ],
      word_bank: ["because", "so", "whereas", "net force", "mass", "acceleration", "divided by", "newtons"],
      checklist: [
        "I said the net force is the same for both carts.",
        "I calculated both accelerations by dividing net force by mass.",
        "I used units in my numbers.",
        "I used because or so to link the cause and the effect.",
      ],
      model:
        "Because the same net force of 3 newtons acts on both carts, the cart with less mass has the greater acceleration. The 0.5 kilogram cart has an acceleration of 6 meters per second squared, whereas the 1.5 kilogram cart has 2 meters per second squared. This happens because acceleration equals net force divided by mass, so more mass leads to a smaller acceleration.",
    },
  },
  exit_check: exit06,
  teacher_card: {
    minutes: 29,
    materials: ["Two identical toy cars and small blocks", "Calculators", "Partner role cards for the talk cards"],
    listen_for: [
      "Students say that the net force is the same before they compare the masses.",
      "Students divide the net force by the mass (not multiply) and include units.",
      "Students use only one connector per clause, such as because or so, not both together.",
    ],
    watchouts: [
      "Misconception: more mass means more acceleration, or the heavier object always speeds up less no matter the force. Acceleration depends on both net force and mass.",
      "Misconception: the push you apply is the net force. Friction or drag may subtract from your push.",
      "Transfer: double connectors such as 'Because the cart has more mass, so it accelerates less' (Spanish 'porque... entonces' pattern); use one connector per sentence.",
    ],
    differentiation: {
      l1_2: "Give the sentence 'Cart A has less mass, so it speeds up more' and let students point to the two toy cars as they say it.",
      l3_4: "Ask for when and so with one number from the calculation each turn.",
      l5_6: "Ask students to reverse the problem (find the mass or the net force) and explain the steps in words.",
      newcomer:
        "Use the two toy cars with Point and Say; accept pointing to the car that speeds up more and saying 'light' or 'heavy'.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

const exit07 = {
  kind: "exit_check",
  domain: "Vocabulary",
  title: "Show What You Know: Mass and Weight",
  mission:
    "Decide what changes on the Moon, choose the sentence with the right unit, and calculate a Moon weight, then rate yourself.",
  grouping: "Solo",
  minutes: 3,
  tip: "Collect the can-do ratings and check item 2 for 'weight in kilograms', the most common mix-up.",
  support: {
    l1_2: "Use the audio button for each question, then tap an answer.",
    l3_4: "Read each question, tap an answer, and read the reason.",
    l5_6: "Answer, fix any mistake, then explain the Moon weight calculation to a partner.",
  },
  payload: {
    can_do: "I can contrast mass and weight and tell how each changes on the Moon.",
    items: [
      {
        q: "A student has a mass of 50 kg on Earth. What is true on the Moon?",
        options: [
          "Her mass is smaller, and her weight is the same.",
          "Her mass is 50 kg, and her weight is smaller.",
          "Her mass and her weight are both the same.",
        ],
        answer: 1,
        why: "You keep the same amount of matter on the Moon, so mass stays 50 kg. The Moon's gravity is weaker, so the weight is smaller.",
      },
      {
        q: "Which sentence uses the correct science words?",
        options: [
          "The backpack's mass is 5 kilograms.",
          "The backpack's mass is 49 newtons.",
          "The backpack's weight is 5 kilograms.",
        ],
        answer: 0,
        why: "Mass goes with kilograms and weight goes with newtons. The other two sentences swap the units, which is easy to do when 'peso' means both.",
      },
      {
        q: "A 5 kg backpack weighs 49 N on Earth. On the Moon, gravity pulls about 1.6 N on each kilogram. What does the backpack weigh on the Moon?",
        options: ["About 49 N", "About 5 N", "About 8 N"],
        answer: 2,
        why: "You multiply the mass by the Moon's pull: 5 kilograms times 1.6 newtons per kilogram is about 8 newtons. A weight of 49 N is the Earth value, and 5 N mixes up kilograms and newtons.",
      },
    ],
  },
};

const lesson07 = {
  id: "g8-sci-u1-l07",
  unit_id: "g8-sci-u1",
  version: 1,
  sequence: 7,
  source: "authored",
  title: "Mass Is Not Weight",
  core_lesson_ref: { label: "Language session 7: mass, weight, and gravity", source: "language_pathway" },
  content_objective:
    "Students distinguish mass (amount of matter, kilograms, the same everywhere) from weight (the pull of gravity, newtons, different on the Moon) and calculate weight as mass times the gravitational pull per kilogram.",
  language_objective: {
    klu: "Inform",
    function: "contrast mass and weight with but and whereas, using units and numbers",
    forms: [
      "The ___ is the same, but the ___ is ___ because ___.",
      "Mass is measured in ___, whereas weight is measured in ___.",
    ],
    by_level: {
      l1_2: "I can say 'Mass is in kilograms' and 'Weight is in newtons' with a picture and a word bank.",
      l3_4: "I can contrast mass and weight in one sentence with but or whereas.",
      l5_6: "I can contrast mass and weight on Earth and the Moon with numbers, and explain why weight changes but mass does not.",
    },
  },
  standards: ["MS-PS2-2"],
  wida: { framework: "2020", language_expectation: "Science.6-8.Inform.Expressive", pld_targets: ["sentence", "word"] },
  vocab: [
    { term: "mass", tier: 3, new_or_review: "review" },
    { term: "weight", tier: 3, new_or_review: "new" },
    { term: "gravity", tier: 3, new_or_review: "review" },
    { term: "newton", tier: 3, new_or_review: "review" },
    { term: "kilogram", tier: 3, new_or_review: "new" },
  ],
  mentor_sentence: {
    text: "The astronaut's mass is the same on the Moon, but her weight is smaller because the Moon's gravity is weaker.",
    chunks: [
      {
        text: "The astronaut's mass is the same on the Moon,",
        role: "What stays the same",
        tone: "concept",
        ask: "Which quantity does not change, and where is the astronaut?",
      },
      { text: "but", role: "Marks a contrast", tone: "connector", ask: "What changes after the word but?" },
      {
        text: "her weight is smaller",
        role: "What changes",
        tone: "precision",
        ask: "Is her weight larger or smaller on the Moon?",
      },
      {
        text: "because the Moon's gravity is weaker.",
        role: "The reason",
        tone: "evidence",
        ask: "Which noun is the reason, and how does it compare with Earth's?",
      },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Mass and Gravity Flip",
        mission: "Flip each card to check what mass, gravity, and newtons are, and make a prediction about the Moon.",
        grouping: "Partners",
        minutes: 4,
        tip: "Have partners agree on the Moon prediction before flipping, and come back to it in the exit check.",
        support: {
          l1_2: "Use the icon, say the answer, then flip.",
          l3_4: "Answer in a full sentence before you flip.",
          l5_6: "Answer, flip, then say why in one sentence with because.",
        },
        payload: {
          cards: [
            { prompt: "What is mass?", answer: "The amount of matter in an object, measured in kilograms.", icon: "⚖️" },
            {
              prompt: "What is gravity?",
              answer: "A noncontact pull between objects. Earth's gravity pulls things toward the ground.",
              icon: "⬇️",
            },
            { prompt: "Which unit measures force?", answer: "The newton (N).", icon: "🍎" },
            {
              prompt: "Predict: which pulls harder on you, Earth or the Moon?",
              answer: "Earth. Earth has much more mass than the Moon, so its pull is stronger.",
              icon: "🌍",
            },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "Mass or Weight?",
        mission:
          "Listen to four sentences about a backpack on Earth and on the Moon, and tap what each sentence tells you.",
        grouping: "Solo",
        minutes: 5,
        tip: "Say the units clearly (kilograms, newtons); the unit is the strongest clue for mass or weight.",
        support: {
          l1_2: "Listen for the unit: kilograms or newtons.",
          l3_4: "Tap, then say the sentence back with the unit.",
          l5_6: "Tap, then rewrite the sentence so it tells about the other quantity.",
        },
        payload: {
          items: [
            {
              say: "The backpack has a mass of 5 kilograms.",
              options: [
                { label: "mass", icon: "⚖️" },
                { label: "weight", icon: "⬇️" },
                { label: "speed", icon: "🏃" },
              ],
              answer: 0,
              why: "You can tell it is mass because the unit is kilograms and the sentence says 'mass'.",
            },
            {
              say: "Gravity pulls on the backpack with a force of 49 newtons, and that pull is its weight.",
              options: [
                { label: "weight", icon: "⬇️" },
                { label: "mass", icon: "⚖️" },
                { label: "friction", icon: "🟫" },
              ],
              answer: 0,
              why: "Weight is the pull of gravity, and it is measured in newtons, so 49 newtons is a weight.",
            },
            {
              say: "On the Moon, the backpack still has a mass of 5 kilograms.",
              options: [
                { label: "its mass gets smaller", icon: "➖" },
                { label: "its mass is zero", icon: "0️⃣" },
                { label: "its mass stays the same", icon: "🟰" },
              ],
              answer: 2,
              why: "The backpack has the same amount of matter on the Moon, so its mass stays the same.",
            },
            {
              say: "On the Moon, the same backpack weighs less because the Moon's gravity is weaker.",
              options: [
                { label: "weight is the same", icon: "🟰" },
                { label: "weight is smaller", icon: "⬇️" },
                { label: "weight is larger", icon: "⬆️" },
              ],
              answer: 1,
              why: "A weaker pull means a smaller weight, even though the mass does not change.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 5,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Sentence X-Ray: The Astronaut",
        mission:
          "Take apart the sentence about the astronaut on the Moon, find what stays the same and what changes, and rebuild it.",
        grouping: "Whole Class",
        minutes: 5,
        tip: "Ask students to color the two nouns that are contrasted (mass and weight) and to explain what 'but' separates.",
        support: {
          l1_2: "Tap each color and listen, then say the word but.",
          l3_4: "Rebuild the sentence and tell what stays the same.",
          l5_6: "Rebuild it, then write a new sentence about Jupiter, where gravity is stronger.",
        },
        payload: {
          text: "The astronaut's mass is the same on the Moon, but her weight is smaller because the Moon's gravity is weaker.",
          chunks: [
            { text: "The astronaut's mass is the same on the Moon,", role: "What stays the same", tone: "concept" },
            { text: "but", role: "Marks a contrast", tone: "connector" },
            { text: "her weight is smaller", role: "What changes", tone: "precision" },
            { text: "because the Moon's gravity is weaker.", role: "The reason", tone: "evidence" },
          ],
          ask: "Which chunk tells what changes, and which chunk tells why?",
        },
      },
    },
    {
      step: "interact",
      minutes: 8,
      activity: {
        kind: "word_sort",
        domain: "Vocabulary",
        title: "Sort the Clues: Mass or Weight",
        mission: "Sort ten clues into mass or weight, then explain one clue to your partner with the word because.",
        grouping: "Partners",
        minutes: 8,
        tip: "Listen for the unit as a reason ('it is in newtons, so it is weight') and for 'peso' creeping into English sentences.",
        support: {
          l1_2: "Sort the clues with a unit first (kilograms or newtons).",
          l3_4: "Say 'I put this clue under ___ because...' for every clue.",
          l5_6: "Sort every clue, then write one clue of your own for each category.",
        },
        payload: {
          categories: [{ name: "Mass" }, { name: "Weight" }],
          items: [
            { text: "It is measured in kilograms.", cat: 0 },
            { text: "It stays the same on the Moon.", cat: 0 },
            { text: "It tells how much matter is in the backpack.", cat: 0 },
            { text: "Moving to another planet does not change it.", cat: 0 },
            { text: "A student's 50 kilograms is the same everywhere.", cat: 0 },
            { text: "It is measured in newtons.", cat: 1 },
            { text: "It is the pull of gravity on an object.", cat: 1 },
            { text: "A 5 kilogram backpack has about 49 newtons of it on Earth.", cat: 1 },
            { text: "It is smaller on the Moon.", cat: 1 },
            { text: "A spring scale shows it.", cat: 1 },
          ],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Contrast Mass and Weight Aloud",
        mission:
          "Tell your partner what happens to a backpack's mass and weight when it travels from Earth to the Moon.",
        grouping: "Partners",
        minutes: 5,
        tip: "Recordings stay on the student's device; listen for kilograms with mass and newtons with weight.",
        support: {
          l1_2: "Say 'The mass is the same. The weight is smaller.'",
          l3_4: "Say one sentence with but and one with because.",
          l5_6: "Say the contrast with numbers and give the reason in one connected explanation.",
        },
        payload: {
          prompt:
            "A backpack with a mass of 5 kg travels from Earth to the Moon. Tell what happens to its mass and what happens to its weight, and give a reason.",
          frame: "On the Moon, the backpack's mass is ___, but its weight is ___ because ___.",
          model:
            "On the Moon, the backpack's mass is still 5 kilograms, but its weight is only about 8 newtons because the Moon's gravity is weaker than Earth's.",
          checklist: [
            "I said the mass is the same and used kilograms.",
            "I said the weight is smaller and used newtons or the word newtons.",
            "I gave a reason with because and the word gravity.",
          ],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit07,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Speaking",
      title: "Point and Say: Mass and Weight",
      mission:
        "Point to the balance scale, the hanging backpack, the rice bag, or the apple on the spring scale, then say the matching sentence.",
      grouping: "Partners",
      minutes: 5,
      tip: "Let students lift the backpack first, then show the spring scale so they feel weight before they name it.",
      support: {
        l1_2: "Point and say one word at a time with your partner.",
        l3_4: "Point, say the word, and say the whole sentence.",
        l5_6: "Say the sentence, then change the object to one of your own.",
      },
      payload: {
        items: [
          {
            term: "mass",
            icon: "⚖️",
            cue: "A balance scale with a backpack on one side and a stack of kilogram weights on the other.",
            say: "The backpack has a mass of five kilograms.",
            es: "masa",
          },
          {
            term: "weight",
            icon: "⬇️",
            cue: "A backpack hanging from a spring scale with an arrow pointing down.",
            say: "Weight is the pull of gravity.",
            es: "peso (la fuerza de gravedad)",
          },
          {
            term: "kilogram",
            icon: "🔢",
            cue: "A one-kilogram bag of rice on a table.",
            say: "We measure mass in kilograms.",
            es: "kilogramo",
          },
          {
            term: "newton",
            icon: "🍎",
            cue: "A small apple hanging from a spring scale that reads 1.",
            say: "We measure weight in newtons.",
            es: "newton",
          },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Lift, Hang, and Stretch",
      mission: "Listen to each command and feel weight with a backpack and a rubber band.",
      grouping: "Partners",
      minutes: 4,
      tip: "Use a wide rubber band or a spring scale so the stretch is easy to see when books are added.",
      support: {
        l1_2: "Copy your partner and say 'heavy' or 'light'.",
        l3_4: "Do each action and say what you feel.",
        l5_6: "Give the commands to your partner and say what changed.",
      },
      payload: {
        items: [
          { command: "Pick up the backpack and feel it pull down.", icon: "🎒" },
          { command: "Hang the empty backpack on the rubber band and watch it stretch.", icon: "🪢" },
          { command: "Put two books in the backpack and watch the rubber band stretch more.", icon: "📚" },
          { command: "Point to the picture of the Moon, where the pull is weaker.", icon: "🌙" },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Mass and Weight",
      mission:
        "Say mass, weight, kilogram, and gravity in English and in your home language, then tell your partner which word is the false friend.",
      grouping: "Partners",
      minutes: 4,
      tip: "Spend the most time on 'peso', since many Spanish speakers use it for both mass and weight; treat the glosses as teacher-reviewed drafts.",
      support: {
        l1_2: "Say both words with a partner.",
        l3_4: "Say both words and tell one way they are alike or different.",
        l5_6: "Explain how each word is used in a science sentence in each language.",
      },
      payload: {
        items: [
          {
            term: "mass",
            es: "masa",
            note: "Cognate, but 'masa' also means dough or a crowd. In science it is the amount of matter in an object, measured in kilograms.",
          },
          {
            term: "weight",
            es: "peso",
            note: "In daily Spanish, 'peso' is used for both mass and weight ('peso 50 kilos'). In science English, weight is a force in newtons, and mass is in kilograms. French: poids. Arabic: wazn.",
          },
          {
            term: "kilogram",
            es: "kilogramo",
            note: "Cognate. In English science, kilograms measure mass, not weight.",
          },
          {
            term: "gravity",
            es: "gravedad",
            note: "Cognate. 'Gravedad' also means seriousness in Spanish, but in science it is the pull between objects with mass.",
          },
        ],
      },
    },
  ],
  extension: {
    kind: "write_scaffold",
    domain: "Writing",
    title: "Compare an Astronaut on Two Worlds",
    mission: "Write a short comparison of an astronaut's mass and weight on Earth and on the Moon, with numbers.",
    grouping: "Solo",
    minutes: 12,
    tip: "Score with the checklist and check that kilograms go with mass and newtons go with weight.",
    materials: [],
    support: {
      l1_2: "Use one frame for each part and read the numbers from the problem.",
      l3_4: "Write all three parts and use but once and because once.",
      l5_6: "Write all three parts and add a sentence about Jupiter, where gravity is stronger.",
    },
    payload: {
      prompt:
        "An astronaut with her gear has a mass of 80 kg. On Earth her weight is about 784 N. On the Moon, gravity pulls about 1.6 N on every kilogram. Compare her mass and her weight on the two worlds, with numbers.",
      structure: [
        { part: "Mass", frame: "On Earth and on the Moon, her mass is ___ because ___." },
        { part: "Weight on Earth", frame: "On Earth, her weight is ___, but" },
        {
          part: "Weight on the Moon",
          frame: "on the Moon, her weight is about ___ because the Moon's gravity is ___.",
        },
      ],
      word_bank: ["mass", "weight", "gravity", "newtons", "kilograms", "weaker", "but", "because"],
      checklist: [
        "I said her mass stays the same and used kilograms.",
        "I gave both weights in newtons.",
        "I used the word gravity to explain why her weight changes.",
      ],
      model:
        "On Earth and on the Moon, her mass is 80 kilograms because she has the same amount of matter. On Earth, her weight is 784 newtons, but on the Moon, her weight is about 128 newtons because the Moon's gravity is weaker.",
    },
  },
  exit_check: exit07,
  teacher_card: {
    minutes: 27,
    materials: ["A backpack and two books", "A spring scale or wide rubber band", "A one-kilogram bag of rice"],
    listen_for: [
      "Students use kilograms with mass and newtons with weight.",
      "Students say the mass stays the same on the Moon and give gravity as the reason the weight changes.",
      "Students use but or whereas to contrast mass and weight in one sentence.",
    ],
    watchouts: [
      "Misconception: mass and weight are the same thing, or weight is measured in kilograms. Daily English and Spanish ('peso') both blur them, so insist on the unit pairs.",
      "Misconception: there is no gravity on the Moon, or the astronaut's mass gets smaller there. The Moon's gravity is weaker (about one sixth of Earth's), and her mass is unchanged.",
      "Transfer: Spanish 'peso' for both words ('The peso of the backpack is 5 kilos'); also 'masa' can mean dough, so check that students mean amount of matter.",
    ],
    differentiation: {
      l1_2: "Give the frame 'The mass is the same. The weight is smaller.' and let students match each word to a unit card.",
      l3_4: "Ask for one sentence with but and one with because, using both units.",
      l5_6: "Ask students to calculate weight as mass times 9.8 N per kilogram on Earth and explain each step.",
      newcomer:
        "Use the backpack, rubber band, and pictures; accept pointing to the unit card (kilograms or newtons) and saying 'mass' or 'weight'.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

const exit08 = {
  kind: "exit_check",
  domain: "Reading",
  title: "Show What You Know: Force Pairs",
  mission:
    "Find the force on a skater, choose a true action-reaction pair, and explain why a pair does not cancel, then rate yourself.",
  grouping: "Solo",
  minutes: 3,
  tip: "Collect the can-do ratings and check item 2 for students who pair gravity with the table's push.",
  support: {
    l1_2: "Use the audio button for each question, then tap an answer.",
    l3_4: "Read each question, tap an answer, and read the reason.",
    l5_6: "Answer, fix any mistake, then explain item 3 to a partner.",
  },
  payload: {
    can_do: "I can describe an action-reaction pair and say why the two forces do not cancel.",
    items: [
      {
        q: "A skater pushes on a wall with a force of 30 N. How hard does the wall push on the skater?",
        options: ["0 N", "60 N", "30 N"],
        answer: 2,
        why: "You can use the equal part of the pair: the wall pushes back with 30 N in the opposite direction. Adding the forces to get 60 N would treat them as one force.",
      },
      {
        q: "Which is an action-reaction pair?",
        options: [
          "Gravity pulls the book down, and the table pushes the book up.",
          "The hand pushes the box to the right, and the box pushes the hand to the left.",
          "The box moves to the right, and friction pushes the box to the left.",
        ],
        answer: 1,
        why: "A pair has two objects pushing on each other. In the first choice both forces act on the book, and in the third choice friction and motion are not a push and a push back.",
      },
      {
        q: "Which statement explains why a pair of equal and opposite forces does not cancel?",
        options: [
          "The two forces act on different objects, so they do not cancel.",
          "The reaction force is always a little smaller, so it does not cancel.",
          "The bigger object pushes with a bigger force.",
        ],
        answer: 0,
        why: "Forces cancel only when they act on the same object. A pair acts on two objects. The forces in a pair are always equal in size.",
      },
    ],
  },
};

const lesson08 = {
  id: "g8-sci-u1-l08",
  unit_id: "g8-sci-u1",
  version: 1,
  sequence: 8,
  source: "authored",
  title: "Equal and Opposite Pairs",
  core_lesson_ref: { label: "Language session 8: action-reaction pairs", source: "language_pathway" },
  content_objective:
    "Students describe an action-reaction pair as two forces of equal size and opposite direction that act on two different objects, and explain why the pair does not cancel.",
  language_objective: {
    klu: "Inform",
    function: "describe an action-reaction pair by naming both objects, both forces, and how the forces compare",
    forms: [
      "When the ___ pushes on the ___, the ___ pushes back on the ___.",
      "with an equal force",
      "but the two forces act on different objects",
    ],
    by_level: {
      l1_2: "I can name the two objects and say 'A pushes B, and B pushes A' using a picture.",
      l3_4: "I can describe an action-reaction pair in two sentences, naming both objects and both forces.",
      l5_6: "I can describe a pair with equal size and opposite direction, say why the two forces do not cancel, and explain why the two objects move differently.",
    },
  },
  standards: ["MS-PS2-1"],
  wida: {
    framework: "2020",
    language_expectation: "Science.6-8.Inform.Expressive",
    pld_targets: ["discourse", "sentence", "word"],
  },
  vocab: [
    { term: "action-reaction pair", tier: 3, new_or_review: "new" },
    { term: "Newton's third law", tier: 3, new_or_review: "new" },
    { term: "opposite", tier: 2, new_or_review: "new" },
    { term: "force", tier: 2, new_or_review: "review" },
    { term: "collision", tier: 2, new_or_review: "review" },
  ],
  mentor_sentence: {
    text: "When the skater pushes on the wall, the wall pushes back on the skater with an equal force, but the two forces act on different objects.",
    chunks: [
      {
        text: "When the skater pushes on the wall,",
        role: "The first force",
        tone: "evidence",
        ask: "Who pushes, and what does the skater push on?",
      },
      {
        text: "the wall pushes back on the skater",
        role: "The second force",
        tone: "concept",
        ask: "How is this force different from the first one in who does what to whom?",
      },
      {
        text: "with an equal force,",
        role: "How the forces compare",
        tone: "precision",
        ask: "Which word tells you the two forces have the same size?",
      },
      {
        text: "but",
        role: "Adds a surprising limit",
        tone: "connector",
        ask: "What does but warn you about before you read the last chunk?",
      },
      {
        text: "the two forces act on different objects.",
        role: "Why they do not cancel",
        tone: "evidence",
        ask: "Which two objects feel the two forces?",
      },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Forces and Collisions Flip",
        mission:
          "Flip each card to check what force arrows show, what a collision is, and what you feel when you push a wall.",
        grouping: "Partners",
        minutes: 4,
        tip: "Ask partners to try the wall push quietly at their seats before they flip card three, so the answer comes from a real feeling.",
        support: {
          l1_2: "Use the icon, say the answer, then flip.",
          l3_4: "Answer in a full sentence before you flip.",
          l5_6: "Answer, flip, then say one more example of a collision.",
        },
        payload: {
          cards: [
            {
              prompt: "What two things does a force arrow show?",
              answer: "Its direction (where it points) and its strength (how long it is).",
              icon: "➡️",
            },
            {
              prompt: "What is a collision?",
              answer: "An event in which two moving objects hit each other.",
              icon: "💥",
            },
            {
              prompt: "What do you feel in your hand when you push hard on a wall?",
              answer: "The wall pushes back on your hand.",
              icon: "🧱",
            },
            {
              prompt: "Which has more mass, a baseball or a baseball bat?",
              answer: "The bat has more mass.",
              icon: "⚾",
            },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "Hear the Pair of Forces",
        mission: "Listen to four sentences about swimmers, cannons, and bats, and tap the idea that matches each one.",
        grouping: "Solo",
        minutes: 5,
        tip: "Say 'pushes back' with a little stress each time; it is the signal that a second force on a second object has started.",
        support: {
          l1_2: "Listen for two objects in each sentence.",
          l3_4: "Tap, then say the sentence with both objects.",
          l5_6: "Tap, then explain why the two forces do not cancel.",
        },
        payload: {
          items: [
            {
              say: "When the swimmer pushes the water backward, the water pushes her forward.",
              options: [
                { label: "an action-reaction pair", icon: "🔁" },
                { label: "one force on one object", icon: "1️⃣" },
                { label: "gravity only", icon: "⬇️" },
              ],
              answer: 0,
              why: "You hear two objects, the swimmer and the water, and each pushes the other. That is an action-reaction pair.",
            },
            {
              say: "At Fort McHenry, the cannon pushes the cannonball forward, and the cannonball pushes the cannon backward.",
              options: [
                { label: "two forces on one object", icon: "2️⃣" },
                { label: "two forces on two objects", icon: "🔁" },
                { label: "one force only", icon: "1️⃣" },
              ],
              answer: 1,
              why: "One force acts on the ball and the other acts on the cannon, so there are two forces on two different objects.",
            },
            {
              say: "The two forces in a pair are equal in size and opposite in direction.",
              options: [
                { label: "equal and opposite", icon: "↔️" },
                { label: "equal and the same direction", icon: "➡️" },
                { label: "unequal and opposite", icon: "⚖️" },
              ],
              answer: 0,
              why: "Both forces have the same size, but they point in opposite directions.",
            },
            {
              say: "In the collision, the bat pushes the ball with the same size force that the ball pushes the bat.",
              options: [
                { label: "the bat pushes harder", icon: "🏏" },
                { label: "the ball pushes harder", icon: "⚾" },
                { label: "the forces are equal", icon: "🟰" },
              ],
              answer: 2,
              why: "You heard 'the same size force': the bat and the ball push on each other equally.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 5,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Sentence X-Ray: The Skater and the Wall",
        mission: "Take apart the sentence about the skater and the wall, find the two forces, and rebuild it.",
        grouping: "Whole Class",
        minutes: 5,
        tip: "Ask students to draw an arrow for each force on a quick sketch, labeling which object feels it, before they rebuild the sentence.",
        support: {
          l1_2: "Tap each color and listen, then say the two objects.",
          l3_4: "Rebuild the sentence and tell which chunk gives each force.",
          l5_6: "Rebuild it, then write a new sentence about a swimmer and the water.",
        },
        payload: {
          text: "When the skater pushes on the wall, the wall pushes back on the skater with an equal force, but the two forces act on different objects.",
          chunks: [
            { text: "When the skater pushes on the wall,", role: "The first force", tone: "evidence" },
            { text: "the wall pushes back on the skater", role: "The second force", tone: "concept" },
            { text: "with an equal force,", role: "How the forces compare", tone: "precision" },
            { text: "but", role: "Adds a surprising limit", tone: "connector" },
            { text: "the two forces act on different objects.", role: "Why they do not cancel", tone: "evidence" },
          ],
          ask: "Which chunk tells you why the two forces do not cancel?",
        },
      },
    },
    {
      step: "interact",
      minutes: 8,
      activity: {
        kind: "error_analysis",
        domain: "Writing",
        title: "Fix the Statement About Pairs",
        mission: "Find the best fix for each flawed statement about pairs of forces and explain why it works.",
        grouping: "Partners",
        minutes: 8,
        tip: "Press for the reason a fix works, and watch for students who choose the option with the biggest vocabulary instead of the true idea.",
        support: {
          l1_2: "Read each choice aloud and look for the one with two objects and equal forces.",
          l3_4: "Say why each wrong choice does not work.",
          l5_6: "Write your own wrong statement about a collision, then fix it.",
        },
        payload: {
          items: [
            {
              wrong: "The bat hit the ball harder than the ball hit the bat.",
              options: [
                "The ball hit the bat harder because the ball changed speed more.",
                "The bat and the ball pushed on each other with equal forces.",
                "Only the bat made a force, so there was no force on the bat.",
              ],
              answer: 1,
              why: "The two forces in a pair are always equal. The ball's speed changes much more because the ball has much less mass than the bat.",
              type: "wrong idea",
            },
            {
              wrong: "The forces in a pair are equal and opposite, so they cancel, and nothing can ever move.",
              options: [
                "The two forces act on different objects, so they cannot cancel each other.",
                "The reaction force is a little weaker, so the pair does not cancel completely.",
                "The forces cancel, but the lighter object still moves because it has less friction.",
              ],
              answer: 0,
              why: "Forces cancel only when they act on the same object. A pair acts on two objects, so each object can still accelerate.",
              type: "wrong idea",
            },
            {
              wrong: "Gravity on the book and the table pushing up on the book are an action-reaction pair.",
              options: [
                "Yes, because they are equal and opposite.",
                "Yes, because the table touches the book.",
                "No. Both forces act on the book. The reaction to gravity pulling the book down is the book pulling Earth up.",
              ],
              answer: 2,
              why: "A pair needs two different objects. Both of these forces act on the book, so they are not a pair.",
              type: "wrong idea",
            },
            {
              wrong: "First the swimmer pushes the water, and then, a moment later, the water pushes back.",
              options: [
                "The water pushes back only after the swimmer has moved.",
                "The two forces start and end at the same time.",
                "The water starts pushing first, and the swimmer pushes back.",
              ],
              answer: 1,
              why: "The pair of forces happens at the same time. The word 'reaction' does not mean a delayed answer.",
              type: "wrong idea",
            },
            {
              wrong: "The wall push the skater back with equal force.",
              options: [
                "The wall pushes the skater back with an equal force.",
                "The wall pushing the skater back with equal force.",
                "The wall is push the skater back with an equal force.",
              ],
              answer: 0,
              why: "In the present tense, a singular subject like 'the wall' needs a verb ending in -s. The other choices use the wrong verb form or add an extra 'is'.",
              type: "grammar",
            },
          ],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Describe the Cannon and the Cannonball",
        mission:
          "Describe the cannon at Fort McHenry out loud by naming both objects, both forces, and which object accelerates more.",
        grouping: "Partners",
        minutes: 5,
        tip: "Recordings stay on the student's device; listen for both objects as the doer and the receiver of a push.",
        support: {
          l1_2: "Say 'The cannon pushes the ball. The ball pushes the cannon.'",
          l3_4: "Say the pair of forces in two sentences and say they are equal.",
          l5_6: "Say the pair, say why they do not cancel, and explain why the ball accelerates more.",
        },
        payload: {
          prompt:
            "A cannon at Fort McHenry fires a cannonball. Describe both forces, how they compare, and which object accelerates more.",
          frame:
            "When the ___ pushes on the ___, the ___ pushes back on the ___ with ___. The two forces act on different objects.",
          model:
            "When the cannon pushes the cannonball forward, the cannonball pushes the cannon backward with an equal force. The two forces act on different objects. The cannonball accelerates much more because it has much less mass.",
          checklist: [
            "I named both objects and both forces.",
            "I said the forces are equal and opposite.",
            "I said the two forces act on different objects.",
          ],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit08,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Speaking",
      title: "Point and Say: Pushing Back",
      mission:
        "Point to the pair of hands, the equal arrows, the opposite arrows, or the cannon, say the word, then say its sentence.",
      grouping: "Partners",
      minutes: 5,
      tip: "Let students press their palms together first so the words attach to the feeling of pushing back.",
      support: {
        l1_2: "Point and say one word at a time with your partner.",
        l3_4: "Point, say the word, and say the whole sentence.",
        l5_6: "Say the sentence, then change the objects to ones of your own.",
      },
      payload: {
        items: [
          {
            term: "action-reaction pair",
            icon: "🔁",
            cue: "Two hands pressing together with one arrow on each hand pointing opposite ways.",
            say: "Two forces make a pair.",
            es: "par de acción y reacción",
          },
          {
            term: "equal",
            icon: "🟰",
            cue: "Two arrows of the same length.",
            say: "The two forces are equal.",
            es: "igual",
          },
          {
            term: "opposite",
            icon: "↔️",
            cue: "One arrow pointing left and one arrow pointing right.",
            say: "The forces point in opposite directions.",
            es: "opuesto",
          },
          {
            term: "cannon",
            icon: "💣",
            cue: "A cannon at Fort McHenry with a ball flying forward and the cannon sliding back.",
            say: "The ball goes forward, and the cannon goes back.",
            es: "cañón",
          },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Feel the Push Back",
      mission: "Listen to each command and feel a push and a push back with a partner and a balloon.",
      grouping: "Partners",
      minutes: 4,
      tip: "Check for latex allergies before using balloons, and keep the pushes gentle during the palm commands.",
      support: {
        l1_2: "Copy your partner and say 'push' and 'push back'.",
        l3_4: "Do each action and say what you feel.",
        l5_6: "Give the commands to your partner and describe both forces.",
      },
      payload: {
        items: [
          { command: "Press your palm against your partner's palm and push gently.", icon: "🤝" },
          { command: "Feel your partner's palm push back on your hand.", icon: "🖐️" },
          { command: "Blow up a balloon and hold the end closed.", icon: "🎈" },
          { command: "Let go of the balloon and watch it fly forward while the air goes backward.", icon: "🚀" },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Pairs of Forces",
      mission:
        "Say each force-pair word in English and in your home language, then tell your partner why reaction does not mean a late answer.",
      grouping: "Partners",
      minutes: 4,
      tip: "Linger on 'reaction', since students may hear it as a delayed answer or as a chemical reaction; treat the Spanish glosses as teacher-reviewed drafts.",
      support: {
        l1_2: "Say both words with a partner.",
        l3_4: "Say both words and tell one way they are alike or different.",
        l5_6: "Explain how each word is used in a science sentence in each language.",
      },
      payload: {
        items: [
          {
            term: "action-reaction pair",
            es: "par de acción y reacción",
            note: "In Spanish, 'reacción' can suggest a chemical reaction or a late response. In physics, both forces happen at the same time.",
          },
          {
            term: "Newton's third law",
            es: "tercera ley de Newton",
            note: "Spanish books also say 'ley de acción y reacción'. Each force in the pair acts on a different object.",
          },
          {
            term: "opposite",
            es: "opuesto",
            note: "Cognate. 'In the opposite direction' is 'en dirección contraria' or 'en sentido opuesto'.",
          },
        ],
      },
    },
  ],
  extension: {
    kind: "write_scaffold",
    domain: "Writing",
    title: "Two Skaters Push Apart",
    mission:
      "Write a description of the pair of forces when two skaters push each other on ice and explain who accelerates more.",
    grouping: "Solo",
    minutes: 12,
    tip: "Score with the checklist and check that the forces are called equal while the accelerations are different.",
    materials: [],
    support: {
      l1_2: "Use one frame for each part and say each sentence aloud first.",
      l3_4: "Write all four parts and use because once.",
      l5_6: "Write all four parts and add a calculation for each acceleration.",
    },
    payload: {
      prompt:
        "Imani (40 kg) and Tomás (60 kg) stand still on smooth ice. Imani pushes Tomás with a force of 30 N. Describe the pair of forces and explain who accelerates more. Ignore friction.",
      structure: [
        { part: "First force", frame: "Imani pushes Tomás with a force of ___ in the direction ___." },
        { part: "Second force", frame: "Tomás pushes back on ___ with a force of ___ in the ___ direction." },
        { part: "Accelerations", frame: "Imani's acceleration is ___, and Tomás's acceleration is ___ because ___." },
      ],
      word_bank: [
        "pushes back",
        "equal",
        "opposite",
        "different objects",
        "mass",
        "acceleration",
        "because",
        "divided by",
      ],
      checklist: [
        "I named both forces and said they are equal and opposite.",
        "I said the two forces act on different objects.",
        "I explained why Imani accelerates more, using mass.",
      ],
      model:
        "Imani pushes Tomás with a force of 30 newtons, and Tomás pushes back on Imani with a force of 30 newtons in the opposite direction. These forces act on different objects. Imani's acceleration is 0.75 meters per second squared, and Tomás's acceleration is 0.5 meters per second squared because Imani has less mass.",
    },
  },
  exit_check: exit08,
  teacher_card: {
    minutes: 28,
    materials: [
      "Balloons (check for latex allergies)",
      "Sticky notes for labeling force arrows",
      "Device with sound for each pair",
    ],
    listen_for: [
      "Students name both objects as the doer and the receiver of a push.",
      "Students say the two forces are equal and opposite and act on different objects.",
      "Students explain different motion with mass, not with different forces.",
    ],
    watchouts: [
      "Misconception: the bigger or faster object pushes with a bigger force in a collision. The two forces in a pair are always equal; the accelerations differ because the masses differ.",
      "Misconception: equal and opposite forces always cancel. They cancel only when they act on the same object.",
      "Transfer: Spanish 'reacción' suggests a delayed response; dropped -s in 'The wall push the skater'; Arabic speakers may omit the verb 'is' in 'The two forces equal'.",
    ],
    differentiation: {
      l1_2: "Give the sentence 'A pushes B, and B pushes A' with the word bank, and let students point to both arrows on a picture.",
      l3_4: "Ask for a two-sentence description with both objects and the words equal and opposite.",
      l5_6: "Ask for the calculation of both accelerations and a sentence about why the lighter skater accelerates more.",
      newcomer:
        "Use the palm push and balloon with the pictures; accept pointing to both arrows and saying 'push' and 'push back'.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

const exit09 = {
  kind: "exit_check",
  domain: "Reading",
  title: "Show What You Know: Reading Graphs",
  mission:
    "Use the table to predict an acceleration, pick the sentence that describes the trend, and choose the sentence that uses evidence, then rate yourself.",
  grouping: "Solo",
  minutes: 3,
  tip: "Collect the can-do ratings and check item 3 for students who describe the data without numbers.",
  support: {
    l1_2: "Use the audio button for each question, then tap an answer.",
    l3_4: "Read each question, tap an answer, and read the reason.",
    l5_6: "Answer, fix any mistake, then write your own trend sentence for a 4 kg cart.",
  },
  payload: {
    can_do: "I can describe a table or graph in words and use numbers as evidence.",
    items: [
      {
        q: "A 2 kg cart gets net forces of 2, 4, 6, and 8 N and accelerates at 1, 2, 3, and 4 m/s². What acceleration would a 10 N net force give?",
        options: ["20 m/s²", "5 m/s²", "12 m/s²"],
        answer: 1,
        why: "You can continue the pattern: each 2 N adds 1 m/s², so 10 N gives 5 m/s². Dividing 10 by 2 gives the same answer. Multiplying gives 20, and adding gives 12.",
      },
      {
        q: "Which sentence describes the trend in the table correctly?",
        options: [
          "As the net force increases, the acceleration decreases.",
          "The acceleration stays the same as the net force increases.",
          "As the net force increases, the acceleration increases in a steady pattern.",
        ],
        answer: 2,
        why: "The numbers 1, 2, 3, and 4 rise as the force rises, and they rise by the same amount each time. The other choices describe a different pattern.",
      },
      {
        q: "Which sentence uses evidence from the table?",
        options: [
          "At 4 newtons the acceleration is 2 m/s², and at 8 newtons it is 4 m/s², so doubling the force doubles the acceleration.",
          "The data show a trend because the numbers are interesting.",
          "The graph is a line, and lines are good.",
        ],
        answer: 0,
        why: "Good evidence quotes numbers from the table and says what they show. The other two sentences give opinions without numbers.",
      },
    ],
  },
};

const lesson09 = {
  id: "g8-sci-u1-l09",
  unit_id: "g8-sci-u1",
  version: 1,
  sequence: 9,
  source: "authored",
  title: "Read the Graph in Words",
  core_lesson_ref: {
    label: "Language session 9: describing a net force and acceleration graph",
    source: "language_pathway",
  },
  content_objective:
    "Students read a table and graph of net force and acceleration for a cart of constant mass, describe the trend with numbers, and compare it with a cart that has more mass.",
  language_objective: {
    klu: "Inform",
    function: "describe a trend in a table or graph with from-to numbers and then say what the pattern shows",
    forms: ["As the ___ increases from ___ to ___, the ___ increases from ___ to ___.", "This shows that ___."],
    by_level: {
      l1_2: "I can read one point on the graph aloud: 'At 6 newtons, the acceleration is 3 meters per second squared.'",
      l3_4: "I can describe the trend in one sentence that starts with As and uses increases and numbers.",
      l5_6: "I can describe the trend with numbers, say what the pattern shows, and tell how the graph would look for a cart with more mass.",
    },
  },
  standards: ["MS-PS2-2"],
  wida: {
    framework: "2020",
    language_expectation: "Science.6-8.Inform.Interpretive",
    pld_targets: ["discourse", "sentence", "word"],
  },
  vocab: [
    { term: "trend", tier: 2, new_or_review: "new" },
    { term: "data", tier: 2, new_or_review: "review" },
    { term: "acceleration", tier: 3, new_or_review: "review" },
    { term: "net force", tier: 3, new_or_review: "review" },
    { term: "mass", tier: 3, new_or_review: "review" },
  ],
  mentor_sentence: {
    text: "As the net force increases from 2 to 8 newtons, the cart's acceleration increases from 1 to 4 meters per second squared, so the two quantities rise together in a steady pattern.",
    chunks: [
      {
        text: "As the net force increases from 2 to 8 newtons,",
        role: "The cause that changes",
        tone: "concept",
        ask: "Which quantity does the writer change, and what are the start and end numbers?",
      },
      {
        text: "the cart's acceleration increases from 1 to 4 meters per second squared,",
        role: "The effect that is measured",
        tone: "evidence",
        ask: "Which quantity is measured, and what are its start and end numbers?",
      },
      {
        text: "so",
        role: "Signals the conclusion",
        tone: "connector",
        ask: "What does the writer do with the two sets of numbers after so?",
      },
      {
        text: "the two quantities rise together in a steady pattern.",
        role: "What the trend shows",
        tone: "precision",
        ask: "Which words describe the pattern in the whole graph?",
      },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Graph and Formula Flip",
        mission:
          "Flip each card to check what a trend is, which axis shows the cause, and how to calculate an acceleration.",
        grouping: "Partners",
        minutes: 4,
        tip: "Ask partners to sketch the axes on a mini whiteboard when they answer the second card.",
        support: {
          l1_2: "Use the icon, say the answer, then flip.",
          l3_4: "Answer in a full sentence before you flip.",
          l5_6: "Answer, flip, then make up a new calculation for your partner.",
        },
        payload: {
          cards: [
            { prompt: "What is a trend in data?", answer: "A pattern in how the numbers change.", icon: "📈" },
            {
              prompt: "In a graph of cause and effect, which quantity goes on the horizontal axis?",
              answer: "The cause that you change, which is the net force in this lesson.",
              icon: "↔️",
            },
            {
              prompt: "Which formula connects acceleration, net force, and mass?",
              answer: "Acceleration equals net force divided by mass.",
              icon: "➗",
            },
            {
              prompt: "A 2 kg cart gets a 6 N net force. What is its acceleration?",
              answer: "3 meters per second squared, because 6 divided by 2 is 3.",
              icon: "🧮",
            },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "Which Graph Do You Hear?",
        mission: "Listen to four descriptions and tap the line or the numbers that match what you hear.",
        grouping: "Solo",
        minutes: 5,
        tip: "Read the last item slowly and let students sketch it first; the answer is the point on the graph where the net force is 6.",
        support: {
          l1_2: "Listen for the key words: up, down, or the same.",
          l3_4: "Tap, then say the sentence back with the numbers.",
          l5_6: "Tap, then say what the graph would show if the mass were larger.",
        },
        payload: {
          items: [
            {
              say: "As the net force goes up, the cart's acceleration goes up too.",
              options: [
                { label: "a rising line", icon: "📈" },
                { label: "a flat line", icon: "➖" },
                { label: "a falling line", icon: "📉" },
              ],
              answer: 0,
              why: "Both quantities go up together, so the line rises from left to right.",
            },
            {
              say: "While the cart rolls at a steady speed, its acceleration stays at zero the whole time.",
              options: [
                { label: "a falling line", icon: "📉" },
                { label: "a rising line", icon: "📈" },
                { label: "a flat line", icon: "➖" },
              ],
              answer: 2,
              why: "The acceleration does not change from zero, so the line on an acceleration graph stays flat.",
            },
            {
              say: "As the mass goes up and the net force stays the same, the acceleration goes down.",
              options: [
                { label: "a falling line", icon: "📉" },
                { label: "a rising line", icon: "📈" },
                { label: "a flat line", icon: "➖" },
              ],
              answer: 0,
              why: "More mass with the same net force gives less acceleration, so the line goes down.",
            },
            {
              say: "At 6 newtons, the 2-kilogram cart reaches 3 meters per second squared.",
              options: [
                { label: "3 N gives 6 m/s²", icon: "🔢" },
                { label: "6 N gives 3 m/s²", icon: "🔢" },
                { label: "6 N gives 12 m/s²", icon: "🔢" },
              ],
              answer: 1,
              why: "You listen for the order: the net force is 6 newtons and the acceleration is 3 meters per second squared, because 6 divided by 2 is 3.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 5,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Sentence X-Ray: The Graph Sentence",
        mission:
          "Take apart the sentence that describes the cart graph with numbers, find the start and end numbers, and rebuild it.",
        grouping: "Whole Class",
        minutes: 5,
        tip: "Have students circle every 'from' and 'to' and say what each number pair describes.",
        support: {
          l1_2: "Tap each color and listen, then say the numbers.",
          l3_4: "Rebuild the sentence and tell which quantity changes first.",
          l5_6: "Rebuild it, then write a new sentence for a cart with a mass of 4 kilograms.",
        },
        payload: {
          text: "As the net force increases from 2 to 8 newtons, the cart's acceleration increases from 1 to 4 meters per second squared, so the two quantities rise together in a steady pattern.",
          chunks: [
            {
              text: "As the net force increases from 2 to 8 newtons,",
              role: "The cause that changes",
              tone: "concept",
            },
            {
              text: "the cart's acceleration increases from 1 to 4 meters per second squared,",
              role: "The effect that is measured",
              tone: "evidence",
            },
            { text: "so", role: "Signals the conclusion", tone: "connector" },
            {
              text: "the two quantities rise together in a steady pattern.",
              role: "What the trend shows",
              tone: "precision",
            },
          ],
          ask: "Which chunk gives the numbers for the effect, and which chunk says what the pattern shows?",
        },
      },
    },
    {
      step: "interact",
      minutes: 8,
      activity: {
        kind: "match",
        domain: "Reading",
        title: "Match the Graph to the Words",
        mission: "Match what you see on the cart graph with the sentence that describes it in words.",
        grouping: "Partners",
        minutes: 8,
        tip: "Have partners read each matched pair aloud and decide whether the sentence describes the line, the axes, or a point.",
        support: {
          l1_2: "Match the pairs with numbers first, then read each pair aloud.",
          l3_4: "Match every pair and say each sentence with 'As ... increases'.",
          l5_6: "Match every pair, then write one more pair for a cart with a mass of 4 kilograms.",
        },
        payload: {
          left_label: "What you see on the graph",
          right_label: "What you say",
          pairs: [
            {
              l: "The line starts at the point (0, 0).",
              r: "When the net force is 0 newtons, the acceleration is 0 meters per second squared.",
            },
            {
              l: "The line slants upward from left to right.",
              r: "As the net force increases, the acceleration increases.",
            },
            { l: "The line is straight.", r: "The acceleration rises by the same amount for every 2 newtons added." },
            {
              l: "The point (6, 3) is on the line.",
              r: "A net force of 6 newtons gives an acceleration of 3 meters per second squared.",
            },
            { l: "The horizontal axis shows net force in newtons.", r: "The cause we changed is the net force." },
            {
              l: "The vertical axis shows acceleration in meters per second squared.",
              r: "The effect we measured is the acceleration.",
            },
            {
              l: "A second line for a 4 kg cart is lower and flatter.",
              r: "For the same net force, the heavier cart has a smaller acceleration.",
            },
          ],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Describe the Trend Aloud",
        mission:
          "Use the cart table to describe the trend out loud with two numbers from each column and say what the pattern shows.",
        grouping: "Solo",
        minutes: 5,
        tip: "Recordings stay on the student's device; ask a partner to listen for from-to numbers in both halves of the sentence.",
        support: {
          l1_2: "Read one row of the table aloud with the frame.",
          l3_4: "Say the trend sentence with from and to for both columns.",
          l5_6: "Say the trend, then say what the pattern shows and what changes for a heavier cart.",
        },
        payload: {
          prompt:
            "The table for a 2 kg cart shows 2 N gives 1 m/s², 4 N gives 2 m/s², 6 N gives 3 m/s², and 8 N gives 4 m/s². Describe the trend with numbers and say what it shows.",
          frame:
            "As the net force increases from ___ to ___, the acceleration increases from ___ to ___. This shows that ___.",
          model:
            "As the net force increases from 2 to 8 newtons, the acceleration increases from 1 to 4 meters per second squared. This shows that the net force and the acceleration rise together in a steady pattern when the mass stays the same.",
          checklist: [
            "I used from and to with numbers for the net force.",
            "I used from and to with numbers for the acceleration.",
            "I said what the pattern shows.",
          ],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit09,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Speaking",
      title: "Point and Say: Graph Words",
      mission:
        "Point to the line graph, the table, the rising bar, or the falling bar, say the word, then say its sentence.",
      grouping: "Partners",
      minutes: 5,
      tip: "Show a real piece of graph paper and a ruler so the pictures connect to materials students will use.",
      support: {
        l1_2: "Point and say one word at a time with your partner.",
        l3_4: "Point, say the word, and say the whole sentence.",
        l5_6: "Say the sentence, then change the numbers to your own.",
      },
      payload: {
        items: [
          {
            term: "graph",
            icon: "📈",
            cue: "A line graph on graph paper with a line going up from left to right.",
            say: "The line on the graph goes up.",
            es: "gráfica (o gráfico)",
          },
          {
            term: "table",
            icon: "🗒️",
            cue: "Two columns of numbers with a heading on each column.",
            say: "The table has two columns.",
            es: "tabla",
          },
          {
            term: "increases",
            icon: "⬆️",
            cue: "A bar that gets taller step by step.",
            say: "The acceleration increases.",
            es: "aumenta",
          },
          {
            term: "decreases",
            icon: "⬇️",
            cue: "A bar that gets shorter step by step.",
            say: "The acceleration decreases.",
            es: "disminuye",
          },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Plot It with Your Hands",
      mission: "Listen to each command and plot the first points of the cart graph on graph paper.",
      grouping: "Partners",
      minutes: 4,
      tip: "Pre-draw the axes on the graph paper and label them, so newcomers practice only the actions.",
      support: {
        l1_2: "Copy your partner and point to each dot.",
        l3_4: "Do each action and say the numbers you plot.",
        l5_6: "Give the commands to your partner and describe the line.",
      },
      payload: {
        items: [
          { command: "Put your finger on the number 2 on the bottom line of the graph.", icon: "☝️" },
          { command: "Draw a dot above the 2 at the height of 1.", icon: "✏️" },
          { command: "Draw a dot above the 4 at the height of 2.", icon: "⚫" },
          { command: "Hold the ruler on the dots and draw a straight line.", icon: "📏" },
          { command: "Point to the end of the line that is higher.", icon: "👉" },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Graph Words",
      mission: "Say each word in English and in your home language, then tell your partner which words sound the same.",
      grouping: "Partners",
      minutes: 4,
      tip: "Invite students to add the word in other languages they speak, and treat the Spanish glosses as teacher-reviewed drafts.",
      support: {
        l1_2: "Say both words with a partner.",
        l3_4: "Say both words and tell one way they are alike or different.",
        l5_6: "Explain how each word is used in a science sentence in each language.",
      },
      payload: {
        items: [
          {
            term: "graph",
            es: "gráfica (o gráfico)",
            note: "Cognate. Spanish speakers may say 'gráfica' or 'gráfico', and both are understood.",
          },
          {
            term: "trend",
            es: "tendencia",
            note: "Cognate in meaning. A trend is the pattern the numbers follow as one quantity changes.",
          },
          {
            term: "increase",
            es: "aumentar (o incrementar)",
            note: "'Aumentar' is the everyday verb, and 'incrementar' is a cognate. English has 'increase' as a verb and a noun.",
          },
          {
            term: "axis",
            es: "eje",
            note: "One axis, two axes (pronounced 'AK-seez'). 'Eje' becomes 'ejes' in the plural in Spanish.",
          },
        ],
      },
    },
  ],
  extension: {
    kind: "write_scaffold",
    domain: "Writing",
    title: "Claim, Evidence, and Reasoning from Two Tables",
    mission:
      "Write a claim, evidence, and reasoning paragraph that compares the net force needed by a light cart and a heavy cart to reach the same acceleration.",
    grouping: "Solo",
    minutes: 12,
    tip: "Score with the checklist and check that the evidence quotes numbers from both tables and the reasoning uses the formula.",
    materials: [],
    support: {
      l1_2: "Use one frame for each part and read the numbers from the tables.",
      l3_4: "Write all three parts and use from-to numbers in the evidence.",
      l5_6: "Write all three parts and add what the 4 kg cart's graph looks like compared with the 2 kg cart's graph.",
    },
    payload: {
      prompt:
        "A 2 kg cart has net forces of 2, 4, 6, and 8 N and accelerations of 1, 2, 3, and 4 m/s². A 4 kg cart has net forces of 4, 8, 12, and 16 N and accelerations of 1, 2, 3, and 4 m/s². Which cart needs the bigger net force to reach 4 m/s²? Write a claim, evidence, and reasoning.",
      structure: [
        { part: "Claim", frame: "The ___ kg cart needs the bigger net force to reach 4 meters per second squared." },
        {
          part: "Evidence",
          frame:
            "To reach 4 meters per second squared, the 2 kg cart needs ___ newtons, whereas the 4 kg cart needs ___ newtons.",
        },
        {
          part: "Reasoning",
          frame:
            "This shows that more mass needs ___ net force for the same acceleration because acceleration equals ___ divided by ___.",
        },
      ],
      word_bank: ["claim", "evidence", "net force", "mass", "acceleration", "whereas", "because", "divided by"],
      checklist: [
        "I made a claim that answers the question.",
        "I used numbers from both tables as evidence.",
        "I explained the pattern with the formula and because.",
      ],
      model:
        "The 4 kg cart needs the bigger net force to reach 4 meters per second squared. To reach 4 meters per second squared, the 2 kg cart needs 8 newtons, whereas the 4 kg cart needs 16 newtons. This shows that more mass needs a bigger net force for the same acceleration because acceleration equals net force divided by mass.",
    },
  },
  exit_check: exit09,
  teacher_card: {
    minutes: 28,
    materials: ["Graph paper and rulers", "Mini whiteboards for sketching axes", "Printed copies of the cart table"],
    listen_for: [
      "Students use from and to with numbers for both quantities in one sentence.",
      "Students say which quantity is the cause that changes and which is the effect that is measured.",
      "Students finish with what the pattern shows, not only the numbers.",
    ],
    watchouts: [
      "Misconception: the graph is a picture of the cart's path, so a rising line means the cart goes uphill. The line shows how acceleration changes with net force.",
      "Misconception: a straight rising line means the cart has a constant speed. Here the line shows that acceleration rises by the same amount for each added newton.",
      "Transfer: prepositions in 'increases from 2 to 8' (students write 'increases of 2 until 8' or 'in function of'), and the plural 'data' with 'show'.",
    ],
    differentiation: {
      l1_2: "Give the table with one row highlighted and the frame 'At ___ newtons, the acceleration is ___'.",
      l3_4: "Ask for the trend sentence with from and to for both columns.",
      l5_6: "Ask for the trend, the reasoning with the formula, and a prediction for a cart with more mass.",
      newcomer:
        "Use graph paper and the ruler with the pictures; accept plotting two points, pointing to the line, and saying 'increases'.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

const exit10 = {
  kind: "exit_check",
  domain: "Reading",
  title: "Show What You Know: Safer Design",
  mission:
    "Compare two stopping times, spot a counterclaim, and pick the sentence in science words, then rate how well you can argue for a design.",
  grouping: "Solo",
  minutes: 3,
  tip: "Collect the can-do ratings and check item 1 for students who say a longer time means a larger force.",
  support: {
    l1_2: "Use the audio button for each question, then tap an answer.",
    l3_4: "Read each question, tap an answer, and read the reason.",
    l5_6: "Answer, fix any mistake, then write your own sentence in science words.",
  },
  payload: {
    can_do: "I can argue for a design with a claim, evidence, a counterclaim, and science words.",
    items: [
      {
        q: "A foam liner stops a rider's head in 0.020 s instead of 0.005 s, and the impact speed is the same. How does the average force on the head change?",
        options: ["It is about 4 times smaller.", "It is about 4 times larger.", "It stays the same."],
        answer: 0,
        why: "You can compare the times: 0.020 s is 4 times longer than 0.005 s. The same speed change over 4 times more time gives an acceleration about 4 times smaller, so the force is about 4 times smaller.",
      },
      {
        q: "Which sentence is a counterclaim that a strong argument answers?",
        options: [
          "A foam liner increases the stopping time.",
          "Helmets are too hot and heavy, so some riders skip them.",
          "A helmet lowers the force on the head.",
        ],
        answer: 1,
        why: "A counterclaim is a reason someone might disagree with you. The other two sentences support the helmet, so they are part of your own argument.",
      },
      {
        q: "Which sentence is written in science words?",
        options: [
          "The soft part gives your head more time, so it hurts less.",
          "The helmet is really good because it is soft.",
          "The liner increases the stopping time, so the average force on the head decreases.",
        ],
        answer: 2,
        why: "Science words name the quantities exactly: stopping time, average force, increases, and decreases. The other two sentences are everyday language.",
      },
    ],
  },
};

const lesson10 = {
  id: "g8-sci-u1-l10",
  unit_id: "g8-sci-u1",
  version: 1,
  sequence: 10,
  source: "authored",
  title: "Design a Safer Ride",
  core_lesson_ref: {
    label: "Language session 10: design argument for a helmet or crash barrier",
    source: "language_pathway",
  },
  content_objective:
    "Students use net force, acceleration, and stopping time to argue that a design that lengthens the time of a collision lowers the average force on a rider or a car, and they answer a counterclaim.",
  language_objective: {
    klu: "Argue",
    function:
      "argue for a design with a claim, evidence, reasoning, and a counterclaim, and move from everyday to science words",
    forms: ["Although ___, ___ is the better design because ___.", "In everyday words, ___. In science words, ___."],
    by_level: {
      l1_2: "I can say which helmet is better and give one reason with because, using a picture and a word bank.",
      l3_4: "I can argue for a design with a claim and a reason, and admit one cost with although.",
      l5_6: "I can argue for a design with claim, evidence, reasoning, and a counterclaim, and say the same idea in everyday words and in science words.",
    },
  },
  standards: ["MS-PS2-1", "MS-PS2-2"],
  wida: {
    framework: "2020",
    language_expectation: "Science.6-8.Argue.Expressive",
    pld_targets: ["discourse", "sentence", "word"],
  },
  vocab: [
    { term: "collision", tier: 2, new_or_review: "review" },
    { term: "acceleration", tier: 3, new_or_review: "review" },
    { term: "inertia", tier: 3, new_or_review: "review" },
    { term: "counterclaim", tier: 2, new_or_review: "new" },
    { term: "design", tier: 2, new_or_review: "new" },
  ],
  mentor_sentence: {
    text: "Although a thicker liner adds weight, it is the better design because a longer stopping time means a smaller force on the head.",
    chunks: [
      {
        text: "Although a thicker liner adds weight,",
        role: "The cost you admit (counterclaim)",
        tone: "precision",
        ask: "What is the downside the writer admits, and which word introduces it?",
      },
      { text: "it is the better design", role: "The claim", tone: "concept", ask: "What is the writer's decision?" },
      {
        text: "because",
        role: "Introduces the reason",
        tone: "connector",
        ask: "What kind of information follows because?",
      },
      {
        text: "a longer stopping time means a smaller force on the head.",
        role: "The science reason",
        tone: "evidence",
        ask: "Which two quantities does the writer connect to the force?",
      },
    ],
  },
  arc: [
    {
      step: "warm_up",
      minutes: 4,
      activity: {
        kind: "flash_retrieval",
        domain: "Vocabulary",
        title: "Collision Ideas Flip",
        mission:
          "Flip each card to check what inertia, stopping time, acceleration, and force have to do with a collision.",
        grouping: "Partners",
        minutes: 4,
        tip: "Let partners sketch a quick head and helmet on a mini whiteboard when they answer card two.",
        support: {
          l1_2: "Use the icon, say the answer, then flip.",
          l3_4: "Answer in a full sentence before you flip.",
          l5_6: "Answer, flip, then say how the card connects to the one before it.",
        },
        payload: {
          cards: [
            {
              prompt: "What does inertia mean in a collision?",
              answer: "Objects keep moving at the old speed until a force changes their motion.",
              icon: "➡️",
            },
            {
              prompt: "The same speed change happens over a longer time. What happens to the acceleration?",
              answer: "The acceleration gets smaller.",
              icon: "⏱️",
            },
            {
              prompt: "If the acceleration of the same object gets smaller, what happens to the net force on it?",
              answer: "The net force gets smaller, because net force equals mass times acceleration.",
              icon: "➗",
            },
            {
              prompt: "Why does a seat belt help in a collision?",
              answer: "It pushes back on the passenger so the passenger slows down with the car.",
              icon: "🔗",
            },
          ],
        },
      },
    },
    {
      step: "input",
      minutes: 5,
      activity: {
        kind: "listen_and_show",
        domain: "Listening",
        title: "Hear the Helmet Idea",
        mission:
          "Listen to four sentences about helmets, stopping time, and words, and tap the idea that matches each one.",
        grouping: "Solo",
        minutes: 5,
        tip: "Read the last two items one after the other so students hear the same idea in everyday words and then in science words.",
        support: {
          l1_2: "Listen, tap a picture, then listen again with the words showing.",
          l3_4: "Tap, then say the sentence back in your own words.",
          l5_6: "Tap, then say the sentence in a different register.",
        },
        payload: {
          items: [
            {
              say: "Because the foam liner crushes slowly, the rider's head stops over a longer time.",
              options: [
                { label: "a shorter stopping time", icon: "⏱️" },
                { label: "a longer stopping time", icon: "⏳" },
                { label: "the same stopping time", icon: "🟰" },
              ],
              answer: 1,
              why: "A liner that crushes slowly gives the head more time to stop, so the stopping time is longer.",
            },
            {
              say: "A longer stopping time means a smaller acceleration, so the force on the head is smaller.",
              options: [
                { label: "a smaller force on the head", icon: "⬇️" },
                { label: "a larger force on the head", icon: "⬆️" },
                { label: "no force on the head", icon: "🚫" },
              ],
              answer: 0,
              why: "The sentence says smaller acceleration, and the net force is mass times acceleration, so the force is smaller.",
            },
            {
              say: "In everyday words: the soft part gives your head more time to stop.",
              options: [
                { label: "academic words", icon: "🎓" },
                { label: "everyday words", icon: "💬" },
                { label: "a question", icon: "❓" },
              ],
              answer: 1,
              why: "Phrases like 'the soft part' and 'your head' are everyday words that anyone can follow.",
            },
            {
              say: "In academic words: the liner increases the stopping time, which decreases the average force on the skull.",
              options: [
                { label: "everyday words", icon: "💬" },
                { label: "a question", icon: "❓" },
                { label: "academic words", icon: "🎓" },
              ],
              answer: 2,
              why: "Words like increases, decreases, and average force are academic words that name the science exactly.",
            },
          ],
        },
      },
    },
    {
      step: "notice",
      minutes: 5,
      activity: {
        kind: "sentence_xray",
        domain: "Reading",
        title: "Sentence X-Ray: The Thicker Liner",
        mission:
          "Take apart the sentence about the thicker liner, find the cost, the claim, and the reason, and rebuild it.",
        grouping: "Whole Class",
        minutes: 5,
        tip: "Ask students why the sentence needs no 'but' after the although clause, and have them cover the first chunk to see the claim stand alone.",
        support: {
          l1_2: "Tap each color and listen, then say the claim chunk.",
          l3_4: "Rebuild the sentence and tell which chunk is the cost.",
          l5_6: "Rebuild it, then write a new sentence for a concrete wall that is hard and cheap.",
        },
        payload: {
          text: "Although a thicker liner adds weight, it is the better design because a longer stopping time means a smaller force on the head.",
          chunks: [
            {
              text: "Although a thicker liner adds weight,",
              role: "The cost you admit (counterclaim)",
              tone: "precision",
            },
            { text: "it is the better design", role: "The claim", tone: "concept" },
            { text: "because", role: "Introduces the reason", tone: "connector" },
            {
              text: "a longer stopping time means a smaller force on the head.",
              role: "The science reason",
              tone: "evidence",
            },
          ],
          ask: "Which chunk is the claim, and which chunk is the counterclaim?",
        },
      },
    },
    {
      step: "interact",
      minutes: 8,
      activity: {
        kind: "dictogloss",
        domain: "Listening",
        title: "Rebuild the Helmet Argument",
        mission:
          "Listen twice to a short argument about helmets at Patterson Park, jot key words, and rebuild the argument with your partner.",
        grouping: "Partners",
        minutes: 8,
        tip: "Read at a natural pace twice; students jot key words only, rebuild in pairs, then compare the counterclaim and the reasoning.",
        support: {
          l1_2: "Listen for the cost and the reason, then use the frame.",
          l3_4: "Write the key words you hear, then rebuild four or five sentences.",
          l5_6: "Rebuild the whole argument and add one more piece of evidence of your own.",
        },
        payload: {
          text: "Some riders at Patterson Park skip helmets because they feel hot and heavy. That is a real cost, but a helmet is still the better choice. In a fall, a foam liner crushes slowly, so the head stops over a longer time. A longer stopping time means a smaller acceleration, and a smaller acceleration means a smaller force on the skull. Therefore, riders should wear a helmet, even when it feels hot.",
          key_words: ["helmet", "foam liner", "stopping time", "acceleration", "force", "therefore"],
          frame: "Some riders say ___, but a helmet is the better choice because ___, so ___.",
          checks: [
            "riders skip helmets because they feel hot and heavy (the counterclaim)",
            "a foam liner crushes slowly, so the head stops over a longer time",
            "a longer stopping time means a smaller acceleration and a smaller force",
            "riders should wear a helmet even when it feels hot (the conclusion)",
          ],
        },
      },
    },
    {
      step: "produce",
      minutes: 5,
      activity: {
        kind: "speak_and_record",
        domain: "Speaking",
        title: "Answer a Friend in Two Registers",
        mission:
          "Answer a friend who says helmets are too hot, first in everyday words and then again in science words.",
        grouping: "Partners",
        minutes: 5,
        tip: "Recordings stay on the student's device; listen for although (without but) in the first answer and for stopping time in the second.",
        support: {
          l1_2: "Say 'A helmet is safer because the soft part gives my head more time.'",
          l3_4: "Say the answer with although and because, then say it again with stopping time.",
          l5_6: "Say claim, counterclaim, and reasoning in everyday words, then repeat it with science words and a number.",
        },
        payload: {
          prompt:
            "A friend says helmets are too hot and heavy. Answer your friend in everyday words. Then say the same idea again in science words, using stopping time, acceleration, and force.",
          frame: "Although ___, a helmet is the better choice because ___. In science words, ___.",
          model:
            "Although a helmet can feel hot, it is the better choice because the soft part gives your head more time to stop. In science words, the foam liner increases the stopping time, so the acceleration of the head is smaller and the average force on the head is smaller.",
          checklist: [
            "I admitted the cost with although and did not add but.",
            "I gave a reason with because.",
            "I said the idea twice, once in everyday words and once in science words.",
          ],
        },
      },
    },
    {
      step: "check",
      minutes: 3,
      activity: exit10,
    },
  ],
  newcomer_path: [
    {
      kind: "point_and_say",
      domain: "Speaking",
      title: "Point and Say: Safer Design Words",
      mission:
        "Point to the helmet, the foam, the crash picture, or the safe rider, say the word, then say its sentence.",
      grouping: "Partners",
      minutes: 5,
      tip: "Bring a real bike helmet or a picture of one, so students see the foam inside before they say the word.",
      support: {
        l1_2: "Point and say one word at a time with your partner.",
        l3_4: "Point, say the word, and say the whole sentence.",
        l5_6: "Say the sentence, then change the object to one of your own.",
      },
      payload: {
        items: [
          {
            term: "helmet",
            icon: "⛑️",
            cue: "A bike helmet with its soft foam inside, worn by a rider.",
            say: "The helmet protects my head.",
            es: "casco",
          },
          {
            term: "foam",
            icon: "🧽",
            cue: "A soft gray foam pad being pressed by a thumb.",
            say: "The foam is soft.",
            es: "espuma",
          },
          {
            term: "collision",
            icon: "💥",
            cue: "Two cars meeting at a crossing with a small burst between them.",
            say: "A collision is a crash.",
            es: "colisión (o choque)",
          },
          {
            term: "safe",
            icon: "✅",
            cue: "A rider wearing a helmet, smiling, with a green check mark.",
            say: "The rider is safer with a helmet.",
            es: "seguro",
          },
        ],
      },
    },
    {
      kind: "tpr_cards",
      domain: "Listening",
      title: "Soft Stop, Hard Stop",
      mission:
        "Listen to each command and compare a soft stop and a hard stop with a sponge, a book, and a small ball.",
      grouping: "Partners",
      minutes: 4,
      tip: "Use a low drop height of about one hand span so the ball stays on the table and the comparison is safe.",
      support: {
        l1_2: "Copy your partner and say 'soft' or 'hard'.",
        l3_4: "Do each action and say what you notice.",
        l5_6: "Give the commands to your partner and explain which stop is safer for a head.",
      },
      payload: {
        items: [
          { command: "Press your hand slowly onto the sponge.", icon: "🧽" },
          { command: "Press your hand onto the hard book.", icon: "📘" },
          { command: "Drop the small ball from a low height onto the book and watch it bounce.", icon: "⚽" },
          { command: "Drop the ball from the same height onto the sponge and watch it stop.", icon: "🧽" },
          { command: "Point to the one that is softer for a head.", icon: "👉" },
        ],
      },
    },
    {
      kind: "home_language_bridge",
      domain: "Vocabulary",
      title: "Home Language Bridge: Design Words",
      mission:
        "Say each word in English and in your home language, then tell your partner which word has a different meaning in science.",
      grouping: "Partners",
      minutes: 4,
      tip: "Linger on 'argument', since many students hear it as a fight; treat the Spanish glosses as teacher-reviewed drafts.",
      support: {
        l1_2: "Say both words with a partner.",
        l3_4: "Say both words and tell one way they are alike or different.",
        l5_6: "Explain how each word is used in a science sentence in each language.",
      },
      payload: {
        items: [
          {
            term: "helmet",
            es: "casco",
            note: "'Casco' is the usual word for a helmet. It can also mean a bottle or the hoof of a horse, so use the picture of the head.",
          },
          { term: "collision", es: "colisión", note: "Cognate. 'Choque' is also common and means crash." },
          {
            term: "design",
            es: "diseño",
            note: "Close cognate: the English verb and noun are both 'design', and in Spanish the verb is 'diseñar'.",
          },
          {
            term: "argument",
            es: "argumento",
            note: "In science an argument is a claim with reasons, not a fight. 'Argumento' has the same idea in Spanish.",
          },
        ],
      },
    },
  ],
  extension: {
    kind: "write_scaffold",
    domain: "Writing",
    title: "Argue for a Crash Barrier",
    mission:
      "Write an argument for the better crash barrier at the end of an exit ramp, including a counterclaim and numbers.",
    grouping: "Solo",
    minutes: 15,
    tip: "Score with the checklist and check that the counterclaim is answered, not just listed.",
    materials: [],
    support: {
      l1_2: "Use one frame for each part and read the numbers from the problem.",
      l3_4: "Write all four parts and use although and because once each.",
      l5_6: "Write all four parts and add one more reason from the formula net force equals mass times acceleration.",
    },
    payload: {
      prompt:
        "A city engineer must choose between a rigid concrete wall and a barrier filled with crushable material at the end of an exit ramp. A car hits either one at the same speed and stops completely. The crushable barrier stops the car in 0.40 seconds, and the wall stops it in 0.10 seconds. The crushable barrier costs more and must be replaced after a crash. Write an argument for the better design.",
      structure: [
        { part: "Claim", frame: "The ___ is the better design." },
        {
          part: "Evidence",
          frame: "The crushable barrier stops the car in ___ seconds, whereas the wall stops it in ___ seconds.",
        },
        {
          part: "Reasoning",
          frame:
            "A longer stopping time means a ___ acceleration, so the average force on the car and the passengers is ___.",
        },
        { part: "Counterclaim", frame: "Although the crushable barrier ___, it is worth it because ___." },
      ],
      word_bank: [
        "claim",
        "evidence",
        "stopping time",
        "acceleration",
        "average force",
        "although",
        "because",
        "whereas",
      ],
      checklist: [
        "I made a clear claim.",
        "I used both stopping times as evidence.",
        "I explained why a longer stopping time lowers the force.",
        "I answered the counterclaim with although.",
      ],
      model:
        "The crushable barrier is the better design. It stops the car in 0.40 seconds, whereas the wall stops it in 0.10 seconds. A longer stopping time means a smaller acceleration, so the average force on the car and the passengers is about four times smaller. Although the crushable barrier costs more and must be replaced after a crash, it is worth it because it lowers the force on the people inside.",
    },
  },
  exit_check: exit10,
  teacher_card: {
    minutes: 30,
    materials: [
      "A bike helmet or a picture of one",
      "A sponge, a hard book, and a small ball",
      "Highlighters for the dictogloss",
    ],
    listen_for: [
      "Students answer a counterclaim with although and a claim, without adding 'but' in the same sentence.",
      "Students connect a longer stopping time to a smaller acceleration and a smaller force.",
      "Students can say the same idea in everyday words and then in science words.",
    ],
    watchouts: [
      "Misconception: a harder helmet or wall is always safer, or a helmet removes the force. A soft liner lowers the average force by lengthening the stopping time, and a force still acts.",
      "Misconception: the force on the head depends only on the impact speed. The time the head takes to stop matters too, because a longer time means a smaller acceleration.",
      "Transfer: 'Although X, but Y' (Spanish 'aunque... pero'); also everyday-only answers or copied science phrases with no meaning.",
    ],
    differentiation: {
      l1_2: "Give the sentence 'A helmet is safer because the soft part gives my head more time' with a picture of the liner.",
      l3_4: "Ask for although and because in one sentence and a second sentence with stopping time.",
      l5_6: "Ask for a claim, evidence with numbers, reasoning with net force equals mass times acceleration, and a counterclaim.",
      newcomer:
        "Use the sponge, book, and ball with the pictures; accept pointing to the softer stop and saying 'safe' or 'soft'.",
    },
  },
  media: { images: [], audio: [] },
  review: { pedagogy: "pending", language_qa: "pending", translation: {} },
};

export default {
  version: 1,
  unit_id: "g8-sci-u1",
  source: "authored",
  lessons: [lesson01, lesson02, lesson03, lesson04, lesson05, lesson06, lesson07, lesson08, lesson09, lesson10],
};
