// BCPSS Writing Lab (TWR) — g2-ss-u4 · Scarcity, Resources & Community Trade. Contract: ../writing-schema.mjs

export default {
  title: "A Smart Choice for the Bay",
  genre: "argue",
  tip: "Ask students to find the proof sentence in the source and underline it before they write their claim.",
  lessons: [
    { id: "A", title: "Scarcity: not enough for everyone" },
    { id: "B", title: "Natural, human, and capital resources" },
    { id: "C", title: "Needs, wants, and trade" },
    { id: "D", title: "Smart choices and proof" },
  ],
  source: {
    title: "Blue Crabs Become Scarce",
    lesson: "A",
    text: "Blue crabs live in the Chesapeake Bay. Watermen catch them in crab pots. If watermen catch too many, fewer crabs are left. Then crabs become scarce. So Maryland has rules about how many crabs a waterman can catch. According to scientists, these rules help young crabs grow.",
  },
  notes: [
    { sentence: "If watermen catch too many, fewer crabs are left.", note: "too many caught → fewer crabs" },
    { sentence: "Then crabs become scarce.", note: "crabs = scarce" },
    { sentence: "So Maryland has rules about how many crabs a waterman can catch.", note: "Maryland rules = limit crabs" },
    { sentence: "According to scientists, these rules help young crabs grow.", note: "scientists: rules help crabs grow" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Crabs became scarce in the bay",
      because: "watermen caught too many.",
      but: "people still wanted to eat them.",
      so: "Maryland made rules to protect them.",
    },
    {
      lesson: "B",
      kernel: "Watermen are human resources",
      because: "their skills and work bring crabs to market.",
      but: "their boats are capital resources.",
      so: "a crab business needs both workers and tools.",
    },
    {
      lesson: "D",
      kernel: "Maryland should keep its crab rules",
      because: "the rules help young crabs grow.",
      but: "some watermen want to catch more.",
      so: "there will still be crabs next year.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Mia traded corn.",
      parts: { where: "at the market", what: "for two muffins", why: "to get a snack" },
      model: "At the market, Mia traded corn for two muffins to get a snack.",
    },
    {
      lesson: "D",
      kernel: "Maryland made rules.",
      parts: { when: "last spring", where: "for the Chesapeake Bay", why: "to protect the crabs" },
      model: "Last spring, Maryland made rules for the Chesapeake Bay to protect the crabs.",
    },
  ],
  fragments: [
    { text: "Crabs became scarce.", is_sentence: true },
    { text: "Because there are not enough crabs.", is_sentence: false, fix: "Maryland has rules because there are not enough crabs." },
    { text: "Watermen who catch too many crabs.", is_sentence: false, fix: "Watermen who catch too many crabs leave fewer for next year." },
    { text: "A need is something you must have.", is_sentence: true },
    { text: "The rules for the crab season.", is_sentence: false, fix: "The rules for the crab season help crabs grow." },
    { text: "According to scientists, the rules help.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Scarcity, ___, means we must make a choice.",
      noun: "Scarcity",
      options: ["not having enough for everyone", "something you would like but can live without", "a worker whose skills make goods"],
      answer: 0,
      model: "Scarcity, not having enough for everyone, means we must make a choice.",
    },
    {
      lesson: "B",
      sentence: "A waterman, ___, is a human resource.",
      noun: "waterman",
      options: ["a tool that people use to make goods", "a worker who catches crabs and oysters", "a thing that comes from nature"],
      answer: 1,
      model: "A waterman, a worker who catches crabs and oysters, is a human resource.",
    },
    {
      lesson: "C",
      sentence: "A want, ___, is something we can live without.",
      noun: "want",
      options: ["something you must have to live", "a worker's skills and effort", "something you would like to have"],
      answer: 2,
      model: "A want, something you would like to have, is something we can live without.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "we should make a smart choice", model: "When a resource is scarce, we should make a smart choice." },
    { lesson: "D", conjunction: "because", stem: "Maryland has rules about crabs", model: "Because crabs became scarce, Maryland has rules about crabs." },
    { lesson: "D", conjunction: "unless", stem: "crabs may become scarce again", model: "Unless people follow the rules, crabs may become scarce again." },
  ],
  spo: {
    topic: {
      l1_2: "[Maryland] should [protect] crabs.",
      l3_4: "I think [Maryland] should [keep its crab rules] because [crabs are scarce].",
      l5_6: "Although [many people] want to catch crabs, [Maryland] should keep its rules because [the rules help young crabs grow back].",
    },
    starters: [
      { type: "question", text: "What should Maryland do when crabs are scarce?" },
      { type: "appositive", text: "Blue crabs, a favorite food in Maryland, need our protection." },
      { type: "subordinate", text: "When a resource is scarce, we should make a smart choice." },
    ],
    details: [
      { note: "crabs = natural resource", lesson: "B" },
      { note: "watermen = human resource", lesson: "B" },
      { note: "too many caught → fewer crabs", lesson: "A" },
      { note: "scarce = not enough for everyone", lesson: "A" },
      { note: "Maryland rules limit crabs", lesson: "D" },
      { note: "scientists: rules help young crabs", lesson: "D" },
    ],
    distractors: ["crab cakes taste good with lemon", "the bay has many sailboats"],
    conclusion: {
      l1_2: "So [Maryland] should keep the [rules].",
      l3_4: "That is why [Maryland] should keep its rules, according to [scientists].",
      l5_6: "In conclusion, [the rules protect crabs], so [there will be crabs for families next year].",
    },
  },
  prompt: {
    l1_2: "Draw a crab and a rule sign. Write 1-3 sentences that tell what Maryland should do and why.",
    l3_4: "Write a paragraph that tells what Maryland should do when crabs are scarce. Give a reason with because and proof with according to.",
    l5_6: "Write a paragraph that argues what Maryland should do when crabs are scarce. Include an appositive and a sentence that starts with when or although.",
  },
  transitions: ["I think", "First,", "For example,", "According to", "Because", "So", "That is why", "In the end,"],
  model: {
    l1_2: "Maryland should keep its crab rules. Crabs are scarce.",
    l3_4: "I think Maryland should keep its crab rules because crabs are scarce. According to scientists, the rules help young crabs grow. That is why there will still be crabs next year.",
    l5_6: "When crabs are scarce, Maryland should keep its rules. Blue crabs, a favorite food in Maryland, need our protection. Although many people want to catch crabs, too many caught leaves fewer for next year. According to scientists, the rules help young crabs grow. That is why a smart choice protects the bay.",
  },
  revise: [
    "Did I state my claim, what Maryland should do?",
    "Did I give a reason with because?",
    "Did I give proof with according to?",
    "Did I use scarce, resource, or choice correctly?",
  ],
};
