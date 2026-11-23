// Language Detective: read a short story, find proof for what two characters do, and build a claim. Original passage.
const s = (id, text, para) => ({ id, text, para });
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

export default {
  id: "g3-ela-compare-characters-detective",
  engine: "language-detective",
  title: "Story Detective: The Spilled Seeds",
  grade: "3",
  band: "3-5",
  subject: "ela",
  lessonId: "g3-ela-compare-characters-actions",
  standards: ["RL.3.3", "RL.3.1"],
  vocabIds: ["character", "trait", "action", "evidence", "infer", "effect"],
  minutes: 18,
  intro:
    "Two classmates face the same trouble in the class garden. Read the story, find the sentences that show what each one does, and build a claim you can prove.",
  scene: {
    kind: "passage",
    title: "The Spilled Seeds",
    source: "Original - The Language Page",
    caption: "A short story about two classmates and one big spill.",
    sentences: [
      s("s1", "Nia and Theo were in charge of the class garden.", 0),
      s("s2", "On Monday morning, a strong wind tipped over the tray of bean seeds.", 0),
      s("s3", "Seeds rolled under every desk in the room.", 0),
      s("s4", "Nia threw her hands up and stomped to the door.", 1),
      s("s5", '"It is all ruined!" she said. "We will never finish by Friday."', 1),
      s("s6", "She sat down in the hall and would not look inside.", 1),
      s("s7", "Theo took a deep breath and knelt on the floor.", 2),
      s("s8", "He picked up one seed at a time and dropped each one into a cup.", 2),
      s("s9", "When he had twelve seeds, he counted them again to be sure.", 2),
      s("s10", "After a while, Nia peeked in and saw the cup filling up.", 3),
      s("s11", '"Do you want help?" she asked in a small voice.', 3),
      s("s12", 'Theo held out a second cup. "Yes, please. Start under the big desk."', 3),
      s("s13", "By lunch, the two of them had planted every seed in the soil.", 4),
      s("s14", 'Nia smiled and whispered, "Thanks for staying calm."', 4),
    ],
  },
  supports: {
    ee: {
      frames: ["The text says ___.", "I think ___ because ___."],
      wordBank: ["clue", "proof", "feeling", "action", "story"],
      directions: "Read one paragraph at a time. Say the sentence out loud before you tap it.",
    },
    dev: {
      frames: ["One clue is ___.", "This shows that ___."],
      wordBank: ["evidence", "infer", "trait"],
    },
    exp: { frames: ["The sentence ___ shows that ___."] },
    br: {},
  },
  questions: [
    {
      id: "q1",
      type: "detail",
      prompt: "What did Theo do first after the seeds spilled?",
      options: [
        { id: "a", text: "He knelt on the floor to pick up seeds." },
        { id: "b", text: "He stomped to the door." },
        { id: "c", text: "He sat down in the hall." },
      ],
      answer: "a",
      evidence: [
        { id: "s7", why: "This sentence is about Theo and tells what he did right away." },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "mixed-up-characters",
          hint: "That is something Nia did. Check which name or word, he or she, each sentence uses.",
        },
        {
          pick: "c",
          tag: "mixed-up-characters",
          hint: "That sentence is about Nia. Find the sentences that use the word he.",
        },
      ],
      hints: [
        "Look for the paragraph that starts with Theo's name.",
        "Find the first sentence after the spill that tells what Theo does with his body.",
        "Think about where Theo is when the seeds are on the ground.",
      ],
      model:
        "The paragraph about Theo begins with him taking a breath and kneeling down, so that is the first thing he does.",
      explain: "Right. Theo knelt on the floor first, and then he picked up the seeds.",
    },
    {
      id: "q2",
      type: "inference",
      prompt: "How did Nia feel when the seeds spilled?",
      options: [
        { id: "a", text: "Discouraged and upset." },
        { id: "b", text: "Calm and ready to work." },
        { id: "c", text: "Glad to have a break." },
      ],
      answer: "a",
      evidence: [
        { id: "s4", why: "She threw her hands up and stomped away." },
        { id: "s5", why: "She says everything is ruined and they will not finish." },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "opposite-feeling",
          hint: "Look at how Nia moves and what she says. Would someone who feels ready to work do that?",
        },
        {
          pick: "c",
          tag: "unsupported-feeling",
          hint: "The text never says Nia was glad. Look at what she says about Friday.",
        },
        {
          pick: "s6",
          tag: "true-but-unrelated",
          hint: "That sentence is true and shows what Nia did, but find the ones that show how she felt.",
        },
      ],
      hints: [
        "Think about what Nia does with her hands and her feet.",
        "Look for her own words in quotation marks.",
        "Put her actions and her words together. What feeling do they show?",
      ],
      model:
        "Nia threw up her hands, stomped to the door and said it was all ruined. People who act and talk that way feel upset and hopeless.",
      explain: "Right. Her actions and her words are clues that she felt upset and discouraged.",
      transfer: {
        prompt: "Mia slammed her book shut and pushed her chair back hard. How might Mia feel?",
        options: [
          { id: "a", text: "Frustrated." },
          { id: "b", text: "Peaceful." },
          { id: "c", text: "Sleepy." },
        ],
        answer: "a",
        explain: "Slamming a book and pushing a chair hard are clues that Mia is frustrated.",
      },
      supports: {
        ee: {
          frames: ["Nia ___ her hands.", "Nia felt ___."],
          wordBank: ["upset", "calm", "glad"],
        },
        dev: { frames: ["Nia ___, so she felt ___."] },
        exp: { frames: ["Nia's actions suggest she felt ___ because ___."] },
        br: {},
      },
    },
    {
      id: "q3",
      type: "evidence",
      prompt: "Tap the sentences that show Theo stayed patient.",
      answer: ["s7", "s8"],
      evidence: [
        { id: "s7", why: "He breathed deeply before he began." },
        { id: "s8", why: "He worked one seed at a time." },
        { id: "s9", why: "He took the time to check his count.", optional: true },
      ],
      misconceptions: [
        {
          pick: "s6",
          tag: "wrong-character",
          hint: "That sentence is about Nia, not Theo.",
        },
        {
          pick: "s13",
          tag: "true-but-unrelated",
          hint: "That sentence is true, but it tells how the story ends. It does not show how Theo acted.",
        },
        {
          pick: "s2",
          tag: "setting-not-action",
          hint: "That sentence tells what the wind did. Look for what Theo did.",
        },
      ],
      hints: [
        "Only sentences about Theo will count.",
        "Look for the sentences that show him slowing down and working carefully.",
        "One sentence shows what he did before he started, and one shows how he worked.",
      ],
      model:
        "Taking a breath and picking up one seed at a time are both slow, careful actions. They show Theo stayed patient.",
      explain: "Right. Both sentences show Theo working calmly and carefully.",
    },
    {
      id: "q4",
      type: "inference",
      prompt: "Why did Nia come back and offer help?",
      options: [
        { id: "a", text: "She saw that Theo's work was making progress." },
        { id: "b", text: "Theo called her name over and over." },
        { id: "c", text: "A teacher told her to go inside." },
      ],
      answer: "a",
      evidence: [
        { id: "s10", why: "She looked in and saw the cup filling up." },
        { id: "s11", why: "Then she asked if Theo wanted help." },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "invented-detail",
          hint: "Theo never calls to Nia in the text. Find what Nia noticed on her own.",
        },
        {
          pick: "c",
          tag: "invented-detail",
          hint: "No teacher appears in this story. Look for what Nia sees through the door.",
        },
      ],
      hints: [
        "Look at what Nia does right before she speaks.",
        "Read the paragraph about Nia peeking in.",
        "What did she see that was different from before?",
      ],
      model:
        "Nia peeked in, saw the cup filling up and then asked to help. Seeing the work get done is what changed her mind.",
      explain: "Right. Theo's steady work had a good effect: it made Nia want to join him.",
      supports: {
        ee: { frames: ["Nia saw ___.", "Then Nia ___."], wordBank: ["cup", "filling", "help"] },
        dev: { frames: ["Nia came back because she saw ___."] },
        exp: { frames: ["Theo's work led Nia to ___ because she noticed ___."] },
        br: {},
      },
    },
    {
      id: "q5",
      type: "inference",
      prompt: "How are Nia's first action and Theo's first action different?",
      options: [
        { id: "a", text: "Nia left the room, and Theo stayed and started working." },
        { id: "b", text: "Nia and Theo both started picking up seeds." },
        { id: "c", text: "Theo left the room, and Nia stayed to plant." },
      ],
      answer: "a",
      evidence: [
        { id: "s4", why: "Nia stomped to the door." },
        { id: "s7", why: "Theo knelt on the floor to start." },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "same-as-other",
          hint: "The story shows them acting in different ways at the start. Read the first action for each character.",
        },
        {
          pick: "c",
          tag: "mixed-up-characters",
          hint: "Check the names again. One of them walks away, but not the one in this choice.",
        },
      ],
      hints: [
        "Find the first action for Nia and the first action for Theo.",
        "Read the two paragraphs that come right after the spill.",
        "Say each action in your own words. Are they the same or opposite?",
      ],
      model:
        "Nia stomps to the door and leaves, but Theo kneels down and starts to work. Their first actions go in opposite directions.",
      explain: "Right. They face the same trouble, but one leaves and one stays.",
    },
    {
      id: "q6",
      type: "inference",
      prompt: "Which trait best fits Theo?",
      options: [
        { id: "a", text: "Patient." },
        { id: "b", text: "Careless." },
        { id: "c", text: "Bossy." },
      ],
      answer: "a",
      evidence: [
        { id: "s8", why: "He picked up the seeds one at a time." },
        { id: "s9", why: "He counted the seeds again to be sure." },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "opposite-trait",
          hint: "Think about counting the seeds a second time. Is that something a careless person does?",
        },
        {
          pick: "c",
          tag: "unsupported-trait",
          hint: "Look at how Theo answers Nia. Does he give orders or does he welcome her help?",
        },
      ],
      hints: [
        "A trait is shown by what a person does again and again.",
        "Look at how Theo works with the seeds, step by step.",
        "Which word describes someone who works slowly, carefully and calmly?",
      ],
      model:
        "Theo works one seed at a time and checks his count. Slow, steady and careful actions show a patient person.",
      explain: "Right. His actions repeat the same slow, careful pattern.",
      transfer: {
        prompt:
          "Kai waited his turn, listened to everyone and spoke quietly. Which trait best fits Kai?",
        options: [
          { id: "a", text: "Respectful." },
          { id: "b", text: "Rude." },
          { id: "c", text: "Greedy." },
        ],
        answer: "a",
        explain: "Waiting, listening and speaking quietly are actions that show respect.",
      },
      supports: {
        ee: {
          frames: ["Theo works ___.", "Theo is ___."],
          wordBank: ["slowly", "carefully", "calm"],
        },
        dev: { frames: ["Theo ___, so he is ___."] },
        exp: { frames: ["Theo's repeated actions show that he is ___."] },
        br: {},
      },
    },
  ],
  claimPrompt: "What can you say about Nia and Theo? Choose the claim your case notes support.",
  claim: {
    options: [
      {
        id: "c1",
        text: "Nia and Theo faced the same trouble but acted differently, and Theo's calm actions helped solve it.",
        strong: true,
      },
      {
        id: "c2",
        text: "Nia did not care about the garden at all.",
        strong: false,
        tag: "unsupported-claim",
        hint: "Your notes show Nia was upset and later offered help. Does that show she did not care?",
      },
      {
        id: "c3",
        text: "Theo is a better person than Nia.",
        strong: false,
        tag: "opinion-not-evidence",
        hint: "That is an opinion about the people. Your notes describe what each one did.",
      },
    ],
    evidenceIds: ["s4", "s7", "s8", "s11"],
    evidenceMin: 2,
    why: "Your notes show Nia left while Theo stayed and worked one seed at a time, and then Nia came back to help.",
    hints: [
      "A strong claim covers both characters and uses what they did.",
      "Check each claim against your case notes. Which one can you prove?",
      "Look for the claim that is about actions, not about who is better.",
    ],
    explainPrompt: "Explain how your evidence proves your claim. Use the words because or so.",
    revisionChecks: [
      {
        id: "because",
        label: "I used because or so to connect my evidence to my claim.",
        test: { type: "contains-any", words: ["because", "so", "this shows", "which shows"] },
      },
      {
        id: "evidence",
        label: "I used words from my evidence.",
        test: { type: "contains-evidence" },
      },
      {
        id: "length",
        label: "My explanation has at least 14 words.",
        test: { type: "min-words", n: 14 },
      },
      { id: "reread", label: "I read my explanation aloud once.", self: true },
    ],
  },
  explainFrames: fr(
    ["Nia ___ . Theo ___ .", "This shows ___ because ___."],
    ["Nia ___, but Theo ___. This shows ___ because ___.", "One difference is ___."],
    ["Although both faced the same problem, Nia ___ while Theo ___, so ___."],
    ["The evidence shows a contrast between ___ and ___, and Theo's ___ led to ___."],
  ),
  reflection: {
    prompt: "Which clue from the story helped you most to understand a character?",
    frames: fr(
      ["The clue was ___.", "It showed ___."],
      ["The sentence ___ helped me because ___."],
      ["I understood the character better when I noticed that ___."],
      ["The detail that shifted my thinking was ___, which showed ___."],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
