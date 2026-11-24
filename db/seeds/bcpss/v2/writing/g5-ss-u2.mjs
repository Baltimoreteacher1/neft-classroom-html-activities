// BCPSS Writing Lab (TWR) — g5-ss-u2 · Road to Revolution & Declaration of Independence. Contract: ../writing-schema.mjs

export default {
  title: "A Tax Sets Off a Chain",
  genre: "explain",
  tip: "Build a chain of cause-and-effect cards on the board and have students move each card into order before they write.",
  lessons: [
    { id: "A", title: "The Stamp Act and the boycott" },
    { id: "B", title: "The Tea Act and the Boston Tea Party" },
    { id: "C", title: "Maryland and the Peggy Stewart" },
    { id: "D", title: "Liberty and the Declaration of Independence" },
  ],
  source: {
    title: "The Stamp Act Chain",
    lesson: "A",
    text: "In 1765, Parliament passed the Stamp Act. It put a tax on printed paper, such as newspapers and legal papers. The law was meant to raise money after the French and Indian War. Colonists were angry because they had no representatives in Parliament. As a result, many colonists boycotted British goods. British merchants lost money, so they asked Parliament to cancel the tax. In 1766, Parliament repealed the Stamp Act. The colonists had learned that a boycott could work.",
  },
  notes: [
    { sentence: "It put a tax on printed paper, such as newspapers and legal papers.", note: "Stamp Act = tax on printed paper" },
    { sentence: "Colonists were angry because they had no representatives in Parliament.", note: "angry: no representation in Parliament" },
    { sentence: "As a result, many colonists boycotted British goods.", note: "result: boycott British goods" },
    { sentence: "British merchants lost money, so they asked Parliament to cancel the tax.", note: "merchants lose $ → ask repeal" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Colonists boycotted British goods",
      because: "they were angry about the Stamp Act.",
      but: "they still lived under British rule.",
      so: "British merchants lost money.",
    },
    {
      lesson: "B",
      kernel: "Colonists dumped tea into Boston Harbor",
      because: "they believed the Tea Act was unfair.",
      but: "the Tea Act had made the tea cheaper.",
      so: "Britain closed Boston Harbor in 1774.",
    },
    {
      lesson: "D",
      kernel: "The colonies declared independence in 1776",
      because: "they believed Britain had treated them unfairly for years.",
      but: "the colonists had once hoped to stay under British rule.",
      so: "the Declaration of Independence listed their complaints.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Colonists dumped tea.",
      parts: { when: "on December 16, 1773", where: "into Boston Harbor", why: "to protest the Tea Act" },
      model: "On December 16, 1773, colonists dumped tea into Boston Harbor to protest the Tea Act.",
    },
    {
      lesson: "C",
      kernel: "Anthony Stewart burned his ship.",
      parts: { when: "in October 1774", where: "in Annapolis", why: "after angry colonists demanded it" },
      model: "In October 1774, Anthony Stewart burned his ship in Annapolis after angry colonists demanded it.",
    },
  ],
  fragments: [
    { text: "Parliament passed the Stamp Act in 1765.", is_sentence: true },
    { text: "Because colonists had no representatives.", is_sentence: false, fix: "Colonists were angry because they had no representatives in Parliament." },
    { text: "A boycott is a protest in which people refuse to buy goods.", is_sentence: true },
    { text: "Repealed the Stamp Act in 1766.", is_sentence: false, fix: "Parliament repealed the Stamp Act in 1766." },
    { text: "After colonists dumped 342 chests of tea into the harbor.", is_sentence: false, fix: "Britain closed Boston Harbor after colonists dumped 342 chests of tea into the harbor." },
    { text: "Which led to the Declaration of Independence.", is_sentence: false, fix: "The anger grew for years, which led to the Declaration of Independence." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The Stamp Act, ___, taxed newspapers and legal papers.",
      noun: "Stamp Act",
      options: ["a law that put a tax on printed paper", "a protest in which people refuse to buy goods", "a formal complaint about unfair treatment"],
      answer: 0,
      model: "The Stamp Act, a law that put a tax on printed paper, taxed newspapers and legal papers.",
    },
    {
      lesson: "B",
      sentence: "Parliament, ___, passed the Tea Act in 1773.",
      noun: "Parliament",
      options: ["the freedom to make your own choices", "the group in Britain that makes the country's laws", "money that people must pay to their government"],
      answer: 1,
      model: "Parliament, the group in Britain that makes the country's laws, passed the Tea Act in 1773.",
    },
    {
      lesson: "D",
      sentence: "Liberty, ___, was a key idea in the Declaration of Independence.",
      noun: "Liberty",
      options: ["a formal complaint about unfair treatment", "money that people must pay to their government", "the freedom to make your own choices and live without unfair control"],
      answer: 2,
      model: "Liberty, the freedom to make your own choices and live without unfair control, was a key idea in the Declaration of Independence.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "colonists boycotted British goods", model: "Because they had no vote in Parliament, colonists boycotted British goods." },
    { lesson: "C", conjunction: "after", stem: "Anthony Stewart burned his ship", model: "After angry colonists demanded action, Anthony Stewart burned his ship." },
    { lesson: "D", conjunction: "since", stem: "the colonies declared independence", model: "Since petitions and protests had not worked, the colonies declared independence." },
  ],
  spo: {
    topic: {
      l1_2: "The Stamp Act [caused] colonists to [boycott].",
      l3_4: "Because Parliament [passed the Stamp Act], colonists [boycotted British goods], and as a result [Parliament repealed it].",
      l5_6: "Although [Parliament repealed the Stamp Act in 1766], the anger it caused [kept growing] and set off [a chain of events] that led to [independence].",
    },
    starters: [
      { type: "question", text: "How can one tax set off a chain of events?" },
      { type: "appositive", text: "The Stamp Act, a tax on printed paper, made colonists angry in 1765." },
      { type: "subordinate", text: "Because colonists had no vote in Parliament, they saw the Stamp Act as unfair." },
    ],
    details: [
      { note: "1765 Stamp Act taxes printed paper", lesson: "A" },
      { note: "no vote in Parliament → anger", lesson: "A" },
      { note: "boycott → merchants lose money", lesson: "A" },
      { note: "1766 Parliament repeals Stamp Act", lesson: "A" },
      { note: "1773 Tea Act → Boston Tea Party", lesson: "B" },
      { note: "1774 Annapolis: Peggy Stewart burned", lesson: "C" },
    ],
    distractors: ["tea grows on bushes in Asia", "Boston Harbor has many islands"],
    conclusion: {
      l1_2: "In the end, the colonies wanted [independence].",
      l3_4: "As a result, [anger over taxes] grew until [the colonies declared independence in 1776].",
      l5_6: "Therefore, [one unfair tax] set off [a chain of protests and laws] that ended with [a new country in 1776].",
    },
  },
  prompt: {
    l1_2: "Draw the Stamp Act and the boycott. Write 2-4 sentences. Tell one cause and one effect.",
    l3_4: "Write a paragraph that explains how the Stamp Act led to a boycott and a repeal. Use your outline, because, so, and as a result.",
    l5_6: "Write a paragraph that explains how a chain of taxes and protests led colonists toward independence. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["Because", "So", "As a result,", "Therefore,", "Which led to", "Since", "First,", "Finally,"],
  model: {
    l1_2: "Parliament passed the Stamp Act in 1765. Colonists boycotted British goods. As a result, Parliament repealed the act.",
    l3_4: "Because Parliament passed the Stamp Act in 1765, colonists were angry. They had no representatives in Parliament, so they boycotted British goods. British merchants lost money, and as a result Parliament repealed the act in 1766. Later taxes, like the Tea Act, caused more protests. As a result, anger over taxes grew until the colonies declared independence in 1776.",
    l5_6: "Although Parliament repealed the Stamp Act in 1766, the anger it caused kept growing. The Stamp Act, a tax on printed paper, upset colonists because they had no vote in Parliament. As a result, they boycotted British goods, and British merchants lost money. In 1773, the Tea Act led colonists to dump 342 chests of tea into Boston Harbor. Britain closed the harbor in 1774, and angry colonists in Annapolis made Anthony Stewart burn his ship that October. Therefore, one unfair tax set off a chain of protests that ended with a new country in 1776.",
  },
  mpo: {
    thesis: "One unfair tax set off a chain of causes and effects that carried the colonies from protest to independence.",
    paragraphs: [
      { topic: "The Stamp Act caused anger and a boycott.", notes: ["1765 tax on printed paper", "no vote in Parliament", "boycott → merchants lose money"] },
      { topic: "Repeal did not end the conflict.", notes: ["1766 repeal", "1773 Tea Act", "Boston Tea Party, 342 chests", "1774 harbor closed"] },
      { topic: "Protests spread and ended in independence.", notes: ["October 1774 Peggy Stewart burned", "colonists list complaints", "1776 Declaration"] },
    ],
    conclusion: "Each unfair law caused a new protest, and together those effects led the colonists to declare independence in 1776.",
  },
  revise: [
    "Did I name a cause and the effect it led to, in order?",
    "Did I use because, so, as a result, or which led to to link each step?",
    "Did I include real dates, like 1765, 1766, and 1773?",
    "Did I show how one event led to the next, not just list events?",
  ],
};
