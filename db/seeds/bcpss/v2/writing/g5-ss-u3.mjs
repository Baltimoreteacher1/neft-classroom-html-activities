// BCPSS Writing Lab (TWR) — g5-ss-u3 · The U.S. Constitution, Rights & Checks and Balances. Contract: ../writing-schema.mjs

export default {
  title: "Checks That Protect Citizens",
  genre: "argue",
  tip: "Ask students to point to the exact power in the source that proves their claim before they write the according to sentence.",
  lessons: [
    { id: "A", title: "The three branches of government" },
    { id: "B", title: "Checks and balances" },
    { id: "C", title: "The Bill of Rights and amendments" },
    { id: "D", title: "Liberty and slavery in the founding era" },
  ],
  source: {
    title: "Checks on Power",
    lesson: "B",
    text: "The Constitution divides power among three branches. Congress makes laws, the President carries them out, and the courts explain them. Each branch can check the others. For example, the President can veto a bill that Congress passes. However, Congress can override the veto with a two-thirds vote. The courts can also decide that a law goes against the Constitution. Because of these checks, no single branch can rule alone.",
  },
  notes: [
    { sentence: "Congress makes laws, the President carries them out, and the courts explain them.", note: "Congress: laws; President: carries out; courts: explain" },
    { sentence: "For example, the President can veto a bill that Congress passes.", note: "President can veto Congress's bill" },
    { sentence: "However, Congress can override the veto with a two-thirds vote.", note: "Congress overrides veto: 2/3 vote" },
    { sentence: "Because of these checks, no single branch can rule alone.", note: "checks → no branch rules alone" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The Constitution created three branches",
      because: "the delegates did not want one person to hold all the power.",
      but: "each branch has its own job.",
      so: "laws are made, carried out, and explained by different groups.",
    },
    {
      lesson: "B",
      kernel: "The President can veto a bill",
      because: "the Constitution gives the President that check.",
      but: "Congress can override the veto with a two-thirds vote.",
      so: "no branch can rule alone.",
    },
    {
      lesson: "C",
      kernel: "Some Marylanders wanted a list of rights",
      because: "they worried the government might take away freedoms.",
      but: "the Constitution did not list them at first.",
      so: "Congress added the Bill of Rights in 1791.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Delegates signed the Constitution.",
      parts: { when: "on September 17, 1787", where: "in Philadelphia", how: "after a long summer of debate" },
      model: "On September 17, 1787, delegates signed the Constitution in Philadelphia after a long summer of debate.",
    },
    {
      lesson: "D",
      kernel: "Benjamin Banneker wrote.",
      parts: { when: "in August 1791", who: "to Thomas Jefferson", where: "from his farm near Baltimore", why: "to argue that Black Americans deserved liberty" },
      model: "In August 1791, Benjamin Banneker wrote to Thomas Jefferson from his farm near Baltimore to argue that Black Americans deserved liberty.",
    },
  ],
  fragments: [
    { text: "Congress makes the laws.", is_sentence: true },
    { text: "Because each branch can check the others.", is_sentence: false, fix: "No branch can rule alone because each branch can check the others." },
    { text: "The President can veto a bill.", is_sentence: true },
    { text: "Overrides the veto with a two-thirds vote.", is_sentence: false, fix: "Congress overrides the veto with a two-thirds vote." },
    { text: "According to the First Amendment.", is_sentence: false, fix: "According to the First Amendment, people may speak freely." },
    { text: "When Maryland voted in April 1788.", is_sentence: false, fix: "Maryland approved the Constitution when it voted in April 1788." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Congress, ___, is one branch of government.",
      noun: "Congress",
      options: ["the part of government that makes laws", "the part of government that carries out laws", "the group of courts that explain laws"],
      answer: 0,
      model: "Congress, the part of government that makes laws, is one branch of government.",
    },
    {
      lesson: "B",
      sentence: "A veto, ___, is one check on Congress.",
      noun: "veto",
      options: ["a formal change to the Constitution", "a way to say no to a bill so it cannot become a law right away", "a belief in the freedom of speech"],
      answer: 1,
      model: "A veto, a way to say no to a bill so it cannot become a law right away, is one check on Congress.",
    },
    {
      lesson: "C",
      sentence: "An amendment, ___, can change the Constitution.",
      noun: "amendment",
      options: ["a person who legally belongs to a country", "the most important written plan for how a government works", "a formal change or addition to the Constitution"],
      answer: 2,
      model: "An amendment, a formal change or addition to the Constitution, can change the Constitution.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "no one person can hold all the power", model: "Because the Constitution created three branches, no one person can hold all the power." },
    { lesson: "B", conjunction: "although", stem: "Congress can override the veto", model: "Although the President can veto a bill, Congress can override the veto." },
    { lesson: "C", conjunction: "since", stem: "citizens have had protected freedoms", model: "Since the Bill of Rights was added in 1791, citizens have had protected freedoms." },
  ],
  spo: {
    topic: {
      l1_2: "[Checks and balances] protect citizens.",
      l3_4: "Checks and balances protect citizens because [no single branch can rule alone].",
      l5_6: "Although [the President can veto a bill], checks and balances protect citizens because, according to the Constitution, [Congress can override the veto], so [power stays shared].",
    },
    starters: [
      { type: "statement", text: "Checks and balances protect citizens from one person holding all the power." },
      { type: "question", text: "How does the Constitution keep any one branch from ruling alone?" },
      { type: "subordinate", text: "Because each branch can check the others, no one branch controls the government." },
    ],
    details: [
      { note: "3 branches: Congress, President, courts", lesson: "A" },
      { note: "President can veto Congress's bill", lesson: "B" },
      { note: "Congress overrides veto: 2/3 vote", lesson: "B" },
      { note: "courts can strike down unconstitutional laws", lesson: "B" },
      { note: "Bill of Rights 1791 protects freedoms", lesson: "C" },
      { note: "Banneker 1791: equal should include Black Americans", lesson: "D" },
    ],
    distractors: ["the Constitution is kept in Washington, D.C.", "Philadelphia was a busy port city"],
    conclusion: {
      l1_2: "So checks and balances [protect] citizens.",
      l3_4: "This shows that [checks and balances] protect citizens because [power is shared].",
      l5_6: "Therefore, [the system of checks] protects citizens, as shown by [the veto and the override], even though [the founders left many people out].",
    },
  },
  prompt: {
    l1_2: "Draw the three branches. Write 2-4 sentences. Make a claim about how the Constitution protects citizens.",
    l3_4: "Write a paragraph with a claim about how checks and balances protect citizens. Use your outline, because, and according to.",
    l5_6: "Write a paragraph that claims how the Constitution protects citizens and proves it with evidence, and then notes who was left out. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["According to", "For example,", "Because", "This shows", "As shown by", "However,", "Also,", "Therefore,"],
  model: {
    l1_2: "The Constitution has three branches. Each branch can check the others. This protects citizens.",
    l3_4: "Checks and balances protect citizens because no single branch can rule alone. According to the Constitution, the President can veto a bill that Congress passes. However, Congress can override the veto with a two-thirds vote. The courts can also decide that a law goes against the Constitution. This shows that power is shared, so citizens are protected.",
    l5_6: "Although the Constitution gave the President the power to veto a bill, checks and balances still protect citizens. The Constitution created three branches, and each one can limit the others. According to the Constitution, Congress can override a veto with a two-thirds vote. This shows that no single branch can rule alone, because every power has a check. The Bill of Rights, ten amendments added in 1791, protects freedoms like speech and religion. However, Benjamin Banneker reminded Thomas Jefferson that liberty should include Black Americans too. Therefore, the Constitution protects citizens, but it also left many people out.",
  },
  mpo: {
    thesis: "The Constitution protects citizens through three branches, checks and balances, and the Bill of Rights, but in 1787 it left many people out.",
    paragraphs: [
      { topic: "Three branches divide the power of government.", notes: ["Congress = laws", "President = carries out laws", "courts = explain laws"] },
      { topic: "Checks and balances keep any branch from ruling alone.", notes: ["President can veto", "Congress overrides: 2/3 vote", "courts check laws"] },
      { topic: "The Bill of Rights protects freedoms, but liberty was not equal for all.", notes: ["1791: ten amendments", "speech + religion protected", "Banneker 1791: equal means all"] },
    ],
    conclusion: "Because the Constitution divides power and protects rights, it protects citizens, but Banneker's letter shows the nation still had to live up to its ideals.",
  },
  revise: [
    "Did I state a clear claim about how the Constitution protects citizens?",
    "Did I cite the Constitution or the Bill of Rights with according to?",
    "Did I explain why my evidence proves the claim with because or this shows?",
    "Did I use exact powers, like the veto and the two-thirds vote, instead of general words?",
  ],
};
