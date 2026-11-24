// BCPSS Writing Lab (TWR) — g8-ss-u1 · Constitutional Foundations & Early Republic. Contract: ../writing-schema.mjs

export default {
  title: "Answering the Critics of 1787",
  genre: "argue",
  tip: "Have students write the critic's fear on one line, then a concede-pivot-rebut sentence frame under it before drafting the paragraph.",
  lessons: [
    { id: "A", title: "Weaknesses of the Articles of Confederation" },
    { id: "B", title: "The Great Compromise and the Constitution" },
    { id: "C", title: "Federalists, Anti-Federalists, and the Bill of Rights" },
    { id: "D", title: "Judicial review and Marbury v. Madison" },
  ],
  source: {
    title: "A Plan Under Debate",
    lesson: "A",
    text: "In 1787, delegates in Philadelphia wrote a new Constitution because the Articles of Confederation were too weak. Federalists, such as James Madison, said a stronger national government was needed. Anti-Federalists, such as Luther Martin of Maryland, feared that the new government would grow too strong. The Constitution answered some of these fears by splitting power among three branches and between the nation and the states. Anti-Federalists still wanted written protections for freedoms, so the states approved the Bill of Rights in 1791. In 1803, Marbury v. Madison gave courts the power of judicial review. This power lets courts decide if a law follows the Constitution.",
  },
  notes: [
    { sentence: "Federalists, such as James Madison, said a stronger national government was needed.", note: "Federalists (Madison): need strong national gov." },
    { sentence: "Anti-Federalists, such as Luther Martin of Maryland, feared that the new government would grow too strong.", note: "Anti-Fed. (Luther Martin): fear gov. too strong" },
    { sentence: "Anti-Federalists still wanted written protections for freedoms, so the states approved the Bill of Rights in 1791.", note: "Anti-Fed. want rights written → Bill of Rights 1791" },
    { sentence: "This power lets courts decide if a law follows the Constitution.", note: "judicial review = courts check laws" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Delegates wrote a new Constitution in 1787",
      because: "the Articles of Confederation could not collect taxes.",
      but: "many people feared a stronger national government.",
      so: "the new plan divided power to limit it.",
    },
    {
      lesson: "C",
      kernel: "Anti-Federalists criticized the Constitution",
      because: "it did not list freedoms such as speech and religion.",
      but: "many of them agreed that the Articles were too weak.",
      so: "the states added the Bill of Rights in 1791.",
    },
    {
      lesson: "D",
      kernel: "Marbury v. Madison gave courts judicial review",
      because: "the Chief Justice said the Constitution is the highest law.",
      but: "the Constitution never uses the words judicial review.",
      so: "courts can strike down laws that break the Constitution.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Delegates reached a compromise.",
      parts: { when: "after weeks of argument", where: "in Philadelphia", why: "so large and small states could agree" },
      model: "After weeks of argument, delegates reached a compromise in Philadelphia so large and small states could agree.",
    },
    {
      lesson: "C",
      kernel: "Luther Martin objected loudly.",
      parts: { when: "in 1787", where: "at the Philadelphia convention", why: "because he feared a strong national government" },
      model: "In 1787, Luther Martin objected loudly at the Philadelphia convention because he feared a strong national government.",
    },
  ],
  fragments: [
    { text: "The Constitution divides power among three branches.", is_sentence: true },
    { text: "Because the Articles could not collect taxes.", is_sentence: false, fix: "Delegates wrote a new plan because the Articles could not collect taxes." },
    { text: "Judicial review lets courts check laws.", is_sentence: true },
    { text: "Although some people feared a strong national government.", is_sentence: false, fix: "Although some people feared a strong national government, many states ratified the Constitution." },
    { text: "Approved the Bill of Rights in 1791.", is_sentence: false, fix: "The states approved the Bill of Rights in 1791." },
  ],
  appositives: [
    {
      lesson: "C",
      sentence: "Luther Martin, ___, feared that the new government would be too strong.",
      noun: "Luther Martin",
      options: ["the Chief Justice of the Supreme Court", "a delegate from Maryland", "a Virginia leader who helped write the Constitution"],
      answer: 1,
      model: "Luther Martin, a delegate from Maryland, feared that the new government would be too strong.",
    },
    {
      lesson: "D",
      sentence: "Marbury v. Madison, ___, gave courts the power of judicial review.",
      noun: "Marbury v. Madison",
      options: ["a plan that gave every state equal votes", "a list of the first ten amendments", "a Supreme Court case from 1803"],
      answer: 2,
      model: "Marbury v. Madison, a Supreme Court case from 1803, gave courts the power of judicial review.",
    },
    {
      lesson: "B",
      sentence: "The Great Compromise, ___, shaped how Congress works today.",
      noun: "Great Compromise",
      options: ["a deal that created a House based on population and a Senate with equal votes", "a list of freedoms the government cannot take away", "a court's power to review laws"],
      answer: 0,
      model: "The Great Compromise, a deal that created a House based on population and a Senate with equal votes, shaped how Congress works today.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "although", stem: "the Constitution divides power among three branches", model: "Although Anti-Federalists feared a strong government, the Constitution divides power among three branches." },
    { lesson: "A", conjunction: "because", stem: "the national government was weak", model: "Because the Articles could not collect taxes, the national government was weak." },
    { lesson: "D", conjunction: "after", stem: "courts could review laws", model: "After the Supreme Court decided Marbury v. Madison, courts could review laws." },
  ],
  spo: {
    topic: {
      l1_2: "The Constitution has [checks] that answer [fears] about power.",
      l3_4: "Although [Anti-Federalists] feared [a strong national government], the Constitution [divides power] and [the Bill of Rights] protects freedoms.",
      l5_6: "Although [critics such as Luther Martin] argued that the national government would grow too strong, [the separation of powers, the Bill of Rights, and judicial review] answered that fear.",
    },
    starters: [
      { type: "question", text: "How do you defend a government when thoughtful critics fear its power?" },
      { type: "appositive", text: "Luther Martin, a delegate from Maryland, feared a government that was too strong." },
      { type: "subordinate", text: "Although the critics had a point, the Constitution answered their fear." },
    ],
    details: [
      { note: "Articles: no taxes, weak", lesson: "A" },
      { note: "Great Compromise: House + Senate", lesson: "B" },
      { note: "Anti-Fed. fear strong national government", lesson: "C" },
      { note: "3 branches split power", lesson: "C" },
      { note: "Bill of Rights 1791 protects freedoms", lesson: "C" },
      { note: "Marbury 1803: judicial review", lesson: "D" },
    ],
    distractors: ["the Liberty Bell is in Philadelphia", "Congress meets in Washington"],
    conclusion: {
      l1_2: "The critics had a [point], but the Constitution has [checks].",
      l3_4: "Therefore, the critics' fear was [serious], yet the Constitution gave [real protection].",
      l5_6: "These checks do not erase [the critics' worry], yet they show that [the plan answered it with evidence].",
    },
  },
  prompt: {
    l1_2: "Anti-Federalists said the national government was too strong. Write 3-4 sentences. Agree a little, then answer with one fact.",
    l3_4: "Write a paragraph that answers an Anti-Federalist who says the Constitution gives the national government too much power. Concede one point, pivot with however, and rebut with evidence.",
    l5_6: "Write a paragraph that answers the Anti-Federalist fear, concedes one point, and rebuts it with evidence from at least two lessons. Include an appositive and a sentence that starts with although or even though.",
  },
  transitions: ["Although", "It is true that", "However,", "Yet", "Even so,", "For example,", "Therefore,", "In conclusion,"],
  model: {
    l1_2: "Anti-Federalists feared a strong government. That fear made sense. However, the Constitution has three branches. The Bill of Rights protects freedoms.",
    l3_4: "Although Anti-Federalists argued that the national government would be too strong, the Constitution answered their fear. They had a point, because the new government had more power than the old one. However, the Constitution divides power among three branches, so no one group can rule alone. The Bill of Rights also protects freedoms such as speech and religion. Therefore, the critics' fear was serious, yet the Constitution gave real protection.",
    l5_6: "Although Anti-Federalists argued that the national government would grow too strong, the Constitution contains strong answers to that fear. Luther Martin, a delegate from Maryland, was right that the new plan gave the nation more power than the Articles of Confederation had. However, power was divided between the nation and the states and split among three branches. Even though the original document did not list freedoms, the states approved the Bill of Rights in 1791 to protect speech, religion, and fair trials. In 1803, Marbury v. Madison added judicial review, which lets courts strike down laws that break the Constitution. These checks do not erase the critics' worry, yet they show that the plan answered it with evidence.",
  },
  mpo: {
    thesis: "Although Anti-Federalists feared a government that was too strong, the Constitution answered their fear through divided power, the Bill of Rights, and judicial review.",
    paragraphs: [
      { topic: "Concede that the new government really did have more power than the Articles gave.", notes: ["Articles: weak, no taxes", "new plan = stronger nation", "Luther Martin's fear"] },
      { topic: "Rebut the fear with the way the Constitution divides power.", notes: ["3 branches", "nation + states share power", "Great Compromise: House + Senate"] },
      { topic: "The Bill of Rights and judicial review add lasting protection.", notes: ["Bill of Rights 1791", "speech, religion, fair trials", "Marbury 1803: courts check laws"] },
    ],
    conclusion: "The critics were right to worry about power, and the answers built into the Constitution show how a government can be strong and still limited.",
  },
  revise: [
    "Did I name the Anti-Federalist fear fairly before I answered it?",
    "Did I concede one real point and then pivot with however or yet?",
    "Did I use evidence, such as three branches, the Bill of Rights, or Marbury v. Madison?",
    "Did I use ratify, compromise, or judicial review correctly?",
  ],
};
