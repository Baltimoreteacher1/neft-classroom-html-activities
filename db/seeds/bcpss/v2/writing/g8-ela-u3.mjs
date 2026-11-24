// BCPSS Writing Lab (TWR) — g8-ela-u3 · What Is Love? Contract: ../writing-schema.mjs

export default {
  title: "Choice or Magic in the Forest",
  genre: "argue",
  tip: "Have students write the counterclaim on one sticky note and the rebuttal on another so the concede-and-pivot move stays visible.",
  lessons: [
    { id: "A", title: "Hermia chooses Lysander before any spell" },
    { id: "B", title: "Puck's mistake and the flower juice" },
    { id: "C", title: "Helena, Demetrius, and who really chooses" },
    { id: "D", title: "Infatuation, chemistry, and commitment today" },
  ],
  source: {
    title: "Choice or Magic?",
    lesson: "B",
    text: "In A Midsummer Night's Dream, love seems to change in a flash. Puck puts flower juice on the wrong man's eyes, and Lysander suddenly loves Helena instead of Hermia. Some readers say this proves that love is only magic. However, the story shows choices too. Before any spell, Hermia defies her father and decides to run away with Lysander. Helena also chooses to follow Demetrius into the dark woods, even though he has rejected her. Modern psychologists agree that a sudden crush, called infatuation, can feel powerful but may not last. A lasting love grows when people keep making a commitment. So love in the play may begin with outside forces, but choices decide what happens next.",
  },
  notes: [
    { sentence: "Puck puts flower juice on the wrong man's eyes, and Lysander suddenly loves Helena instead of Hermia.", note: "Puck's mistake: juice → Lysander loves Helena" },
    { sentence: "Before any spell, Hermia defies her father and decides to run away with Lysander.", note: "pre-spell: Hermia defies dad, picks Lysander" },
    { sentence: "Helena also chooses to follow Demetrius into the dark woods, even though he has rejected her.", note: "Helena follows Demetrius = her choice" },
    { sentence: "A lasting love grows when people keep making a commitment.", note: "lasting love = commitment (choice)" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Lysander suddenly loves Helena",
      because: "the fairy Puck put flower juice on his eyes by mistake.",
      but: "he had chosen Hermia before any spell touched him.",
      so: "some readers believe magic controls love in the play.",
    },
    {
      lesson: "A",
      kernel: "Hermia refuses to marry Demetrius",
      because: "she loves Lysander and wants to choose for herself.",
      but: "her father demands that she obey him.",
      so: "she runs away into the forest at night.",
    },
    {
      lesson: "D",
      kernel: "A sudden crush can feel powerful",
      because: "the body reacts quickly with excitement.",
      but: "infatuation often fades after a short time.",
      so: "lasting love needs commitment.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Puck made a mistake.",
      parts: { where: "in the dark forest", how: "with the flower juice", why: "because he chose the wrong sleeping man" },
      model: "In the dark forest, Puck made a mistake with the flower juice because he chose the wrong sleeping man.",
    },
    {
      lesson: "C",
      kernel: "Helena followed Demetrius.",
      parts: { when: "that night", where: "into the woods", why: "because she still loved him" },
      model: "That night, Helena followed Demetrius into the woods because she still loved him.",
    },
  ],
  fragments: [
    { text: "Hermia defied her father's order.", is_sentence: true },
    { text: "Although the flower juice was magic.", is_sentence: false, fix: "Although the flower juice was magic, Hermia had already chosen Lysander." },
    { text: "Helena followed Demetrius into the woods.", is_sentence: true },
    { text: "Chooses to run away with Lysander.", is_sentence: false, fix: "Hermia chooses to run away with Lysander." },
    { text: "Because infatuation can fade quickly.", is_sentence: false, fix: "Love needs commitment because infatuation can fade quickly." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Hermia, ___, defies her father's order.",
      noun: "Hermia",
      options: ["a young Athenian in love with Lysander", "a mischievous fairy servant", "the king of the fairies"],
      answer: 0,
      model: "Hermia, a young Athenian in love with Lysander, defies her father's order.",
    },
    {
      lesson: "B",
      sentence: "Puck, ___, puts the flower juice on the wrong man's eyes.",
      noun: "Puck",
      options: ["a young woman who follows Demetrius", "Oberon's mischievous fairy helper", "a father who demands obedience"],
      answer: 1,
      model: "Puck, Oberon's mischievous fairy helper, puts the flower juice on the wrong man's eyes.",
    },
    {
      lesson: "D",
      sentence: "Infatuation, ___, can feel like love at first.",
      noun: "Infatuation",
      options: ["a promise to stay loyal", "a magic spell from a flower", "a sudden, strong crush that may not last"],
      answer: 2,
      model: "Infatuation, a sudden, strong crush that may not last, can feel like love at first.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "although", stem: "Hermia had already chosen Lysander before any spell", model: "Although some readers blame magic, Hermia had already chosen Lysander before any spell." },
    { lesson: "C", conjunction: "while", stem: "Helena keeps following him through the woods", model: "While Demetrius rejects her, Helena keeps following him through the woods." },
    { lesson: "D", conjunction: "before", stem: "the couple must make a commitment", model: "Before a crush can become lasting love, the couple must make a commitment." },
  ],
  spo: {
    topic: {
      l1_2: "Love in the play comes from [choice] and [magic].",
      l3_4: "Although some readers say love in the play is only magic, [the characters] show that [love also comes from choice].",
      l5_6: "Although [the flower juice] can change a feeling in an instant, [Hermia and Helena] prove that [real love in the play begins with agency].",
    },
    starters: [
      { type: "question", text: "Can a spell really make someone love you?" },
      { type: "appositive", text: "Hermia, a young woman who defies her father, chooses love before any magic." },
      { type: "exclamation", text: "What a mix-up the flower juice causes in the forest!" },
    ],
    details: [
      { note: "Hermia defies father before spell", lesson: "A" },
      { note: "Puck's mistake → Lysander loves Helena", lesson: "B" },
      { note: "Helena follows Demetrius by choice", lesson: "C" },
      { note: "magic = outside force", lesson: "B" },
      { note: "infatuation fades, commitment lasts", lesson: "D" },
      { note: "Hermia + Lysander run away together", lesson: "A" },
    ],
    distractors: ["Bottom's head turns into a donkey's head", "Shakespeare wrote many plays"],
    conclusion: {
      l1_2: "Love is not only [magic]. It is also a [choice].",
      l3_4: "Therefore, love in the play is not controlled only by magic, because [the characters] make real [decisions].",
      l5_6: "Love may begin with [a push from outside], but [choice and commitment] keep it alive.",
    },
  },
  prompt: {
    l1_2: "Look at the forest picture. Write 3-4 sentences. Say if love in the play is only magic. Give one reason.",
    l3_4: "Write a paragraph that argues love in the play is not only magic. Admit one point with although, then answer it with evidence from Hermia or Helena.",
    l5_6: "Write a paragraph that concedes one counterclaim about the flower juice, pivots with however or yet, and rebuts it with evidence from the play and from modern psychology. Include an appositive and a sentence that starts with although.",
  },
  transitions: ["Although", "However,", "Yet", "Even so,", "On the other hand,", "For example,", "Therefore,", "In conclusion,"],
  model: {
    l1_2: "Love in the play is not only magic. Hermia chooses Lysander before the spell. She is brave. I think love can be a choice.",
    l3_4: "Although some readers say love in the play is only magic, I believe love also comes from choice. First, Puck puts flower juice on Lysander's eyes by mistake, so he suddenly loves Helena. However, Hermia chose Lysander before any spell touched him. Helena also chooses to follow Demetrius, even though he rejects her. These actions prove that the characters make real decisions. Therefore, love in the play is not controlled only by magic.",
    l5_6: "Although some readers contend that love in the play is only magic, Hermia and Helena prove that real love begins with agency. Puck, Oberon's fairy helper, puts flower juice on the wrong man's eyes, and Lysander suddenly loves Helena. This seems like strong evidence for outside forces. However, Hermia defies her father and runs away with Lysander before any spell exists. Helena follows Demetrius into the dark woods even though he has rejected her, so her loyalty is her own decision. Modern psychologists add that a crush, or infatuation, can fade, while lasting love needs commitment. Because the characters keep choosing one another, magic cannot be the whole explanation. Love may begin with a push from outside, but choice keeps it alive.",
  },
  mpo: {
    thesis: "Although magic changes some feelings in the play, love is not controlled only by outside forces, because the characters make real choices.",
    paragraphs: [
      { topic: "Concede that the flower juice really does change Lysander's feelings.", notes: ["Puck's mistake", "juice → Lysander loves Helena", "counterclaim: love = magic"] },
      { topic: "Rebut the counterclaim with choices made before and after the spell.", notes: ["Hermia defies dad, picks Lysander", "Helena follows Demetrius", "choices = agency"] },
      { topic: "Modern psychology shows that a lasting love needs commitment.", notes: ["infatuation fades", "commitment = choice", "agency > chemistry"] },
    ],
    conclusion: "Love in the play may begin with magic or chemistry, yet the characters' decisions and commitments show that people still have the power to choose.",
  },
  revise: [
    "Did I name the counterclaim fairly before I answered it?",
    "Did I use however, yet, or even so to turn toward my rebuttal?",
    "Did I give one piece of evidence from before the spell?",
    "Did I use agency, infatuation, or commitment correctly?",
  ],
};
