// BCPSS Writing Lab (TWR) — g3-ss-u1 · Civic Participation & The Common Good. Contract: ../writing-schema.mjs

export default {
  title: "One Petition, One Bright Block",
  genre: "argue",
  tip: "Have students name who benefits from the fix before they write, so every claim ties back to the common good.",
  lessons: [
    { id: "A", title: "What the common good means" },
    { id: "B", title: "Public services the community shares" },
    { id: "C", title: "Citizens who vote and volunteer" },
    { id: "D", title: "Petitions and speaking up" },
  ],
  source: {
    title: "The Dark Sidewalk",
    lesson: "B",
    text: "The streetlight on Jamal's block in Baltimore stopped working. At night, the sidewalk was dark. Neighbors worried that someone could trip. Jamal's class wrote a petition and asked neighbors to sign it. Eighty people signed. The class gave the petition to a city leader. Soon, a worker fixed the light. Now the whole block is safer. A petition helps the common good, because everyone who walks there benefits, not just the people who signed.",
  },
  notes: [
    { sentence: "At night, the sidewalk was dark.", note: "dark at night → unsafe" },
    { sentence: "Jamal's class wrote a petition and asked neighbors to sign it.", note: "class writes petition + signatures" },
    { sentence: "The class gave the petition to a city leader.", note: "petition → city leader" },
    { sentence: "Now the whole block is safer.", note: "light fixed → block safer" },
  ],
  bbs: [
    {
      lesson: "D",
      kernel: "A petition can help the common good",
      because: "many people sign it to ask leaders for a change.",
      but: "a petition does not fix a problem by itself.",
      so: "the class gave it to a city leader.",
    },
    {
      lesson: "B",
      kernel: "A streetlight is a public service",
      because: "the community pays for it together.",
      but: "a broken light is easy to ignore.",
      so: "neighbors must speak up when it stops working.",
    },
    {
      lesson: "C",
      kernel: "Citizens vote to choose leaders",
      because: "every vote counts when a community makes decisions.",
      but: "a person must be old enough to vote.",
      so: "children can still help by writing letters and volunteering.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "The neighbors signed the petition.",
      parts: { when: "after school", where: "on the sidewalk", how: "one by one", why: "to ask for a new light" },
      model: "After school, the neighbors signed the petition on the sidewalk one by one to ask for a new light.",
    },
    {
      lesson: "C",
      kernel: "Maya volunteered.",
      parts: { when: "on Saturday morning", where: "at Patterson Park", how: "with her class", why: "to keep the park clean for everyone" },
      model: "On Saturday morning, Maya volunteered at Patterson Park with her class to keep the park clean for everyone.",
    },
  ],
  fragments: [
    { text: "The streetlight stopped working.", is_sentence: true },
    { text: "Because the sidewalk was dark.", is_sentence: false, fix: "The neighbors worried because the sidewalk was dark." },
    { text: "Eighty neighbors signed the petition.", is_sentence: true },
    { text: "Gave the petition to a city leader.", is_sentence: false, fix: "The class gave the petition to a city leader." },
    { text: "When the worker fixed the light.", is_sentence: false, fix: "The block felt safer when the worker fixed the light." },
    { text: "A law is a rule that everyone must follow.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "D",
      sentence: "A petition, ___, can ask leaders for a change.",
      noun: "petition",
      options: ["a person who helps without getting paid", "a paper that many people sign", "a rule made by the government"],
      answer: 1,
      model: "A petition, a paper that many people sign, can ask leaders for a change.",
    },
    {
      lesson: "C",
      sentence: "A citizen, ___, has rights and duties in a community.",
      noun: "citizen",
      options: ["a person who belongs to a country or city", "a job that the community pays for together", "a choice that counts, like picking a leader"],
      answer: 0,
      model: "A citizen, a person who belongs to a country or city, has rights and duties in a community.",
    },
    {
      lesson: "B",
      sentence: "A streetlight, ___, helps keep the whole block safe.",
      noun: "streetlight",
      options: ["a paper that many people sign", "a rule that everyone must follow", "a public service that the community pays for together"],
      answer: 2,
      model: "A streetlight, a public service that the community pays for together, helps keep the whole block safe.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "because", stem: "the whole block is safer", model: "Because the city fixed the light, the whole block is safer." },
    { lesson: "D", conjunction: "after", stem: "a worker fixed the light", model: "After eighty neighbors signed the petition, a worker fixed the light." },
    { lesson: "A", conjunction: "when", stem: "they help the common good", model: "When people volunteer to clean the park, they help the common good." },
  ],
  spo: {
    topic: {
      l1_2: "A [petition] helps the [common good].",
      l3_4: "A petition helps the common good because [it asks leaders to fix a problem for everyone].",
      l5_6: "Although [only some neighbors signed the petition], [a petition, a paper that many people sign,] helps the common good because [the fix helps everyone on the block].",
    },
    starters: [
      { type: "question", text: "How can one piece of paper help a whole neighborhood?" },
      { type: "appositive", text: "A petition, a paper that many people sign, can ask leaders for a change." },
      { type: "subordinate", text: "When neighbors work together, they can fix a problem for everyone." },
    ],
    details: [
      { note: "streetlight broken → dark sidewalk", lesson: "B" },
      { note: "class writes petition", lesson: "D" },
      { note: "80 neighbors sign", lesson: "D" },
      { note: "gives petition to city leader", lesson: "D" },
      { note: "worker fixes light", lesson: "B" },
      { note: "everyone on block benefits = common good", lesson: "A" },
    ],
    distractors: ["Baltimore is on the Chesapeake Bay", "streetlights turn on at dusk"],
    conclusion: {
      l1_2: "The [block] is [safer].",
      l3_4: "This shows that [a petition] can help [everyone] on the block.",
      l5_6: "In conclusion, [a petition] helps the common good, as shown by [a block that is safer for every person who walks there].",
    },
  },
  prompt: {
    l1_2: "Draw the lit street. Write 2-3 sentences. Tell what you think about the petition and one reason.",
    l3_4: "Do petitions help the common good? Write a paragraph with your claim, evidence from the story, and a reason.",
    l5_6: "Argue that a petition helps the common good. Include an appositive, a sentence that starts with although or because, and evidence from the story.",
  },
  transitions: ["I think", "Because", "According to", "For example,", "This shows that", "As shown by", "Also,", "In conclusion,"],
  model: {
    l1_2: "I think a petition helps the common good. Neighbors signed a paper. The light got fixed.",
    l3_4: "I think a petition helps the common good because it asks leaders to fix a problem for everyone. According to the story, the streetlight on Jamal's block stopped working. Eighty neighbors signed a petition, and a worker fixed the light. This shows that a petition can work. Now the whole block is safer.",
    l5_6: "Although only eighty neighbors signed, a petition, a paper that many people sign, helps the common good. When the streetlight stopped working, the sidewalk was dark and unsafe. Jamal's class wrote a petition and gave it to a city leader. After the leader read it, a worker fixed the light. As shown by the safer block, everyone who walks there now benefits. In conclusion, speaking up as a group can protect the whole community.",
  },
  revise: [
    "Did I state my claim in my first sentence?",
    "Did I use evidence from the story, like the number of signatures?",
    "Did I explain who benefits, so my reason connects to the common good?",
    "Did I use because or according to correctly?",
  ],
};
