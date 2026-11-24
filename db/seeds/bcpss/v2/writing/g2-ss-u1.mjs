// BCPSS Writing Lab (TWR) — g2-ss-u1 · Local Government & Democratic Rights. Contract: ../writing-schema.mjs

export default {
  title: "Neighbors Make a Street Safer",
  genre: "explain",
  tip: "Have students order three pictures (problem, letters, new stop sign) and say each cause and effect aloud before writing.",
  lessons: [
    { id: "A", title: "Baltimore's mayor and City Council" },
    { id: "B", title: "How a good idea becomes a law" },
    { id: "C", title: "Rights of citizens" },
    { id: "D", title: "Responsibilities in our community" },
  ],
  source: {
    title: "A New Stop Sign",
    lesson: "B",
    text: "A busy street runs by a school in Baltimore. Cars drive too fast. Neighbors write letters to the mayor. The City Council listens and votes. Now there is a new stop sign. Because neighbors spoke up, children cross the street safely.",
  },
  notes: [
    { sentence: "Cars drive too fast.", note: "cars too fast" },
    { sentence: "Neighbors write letters to the mayor.", note: "neighbors → letters → mayor" },
    { sentence: "The City Council listens and votes.", note: "council listens + votes" },
    { sentence: "Now there is a new stop sign.", note: "new stop sign" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Neighbors wrote letters to the mayor",
      because: "cars drove too fast near the school.",
      but: "one letter alone could not make a law.",
      so: "the City Council voted on a new rule.",
    },
    {
      lesson: "A",
      kernel: "The City Council votes on new laws",
      because: "the council members speak for the neighbors.",
      but: "the mayor is the leader of the city.",
      so: "a good idea can become a law for everyone.",
    },
    {
      lesson: "C",
      kernel: "Citizens have the right to vote",
      because: "every person should have a voice.",
      but: "voting is also a responsibility.",
      so: "leaders can hear what the community wants.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The children wrote letters.",
      parts: { when: "after school", who: "with their neighbors", why: "to ask for a safer street" },
      model: "After school, the children wrote letters with their neighbors to ask for a safer street.",
    },
    {
      lesson: "D",
      kernel: "Neighbors cleaned Patterson Park.",
      parts: { when: "on Saturday morning", how: "with gloves and trash bags", why: "to keep the park safe for everyone" },
      model: "On Saturday morning, neighbors cleaned Patterson Park with gloves and trash bags to keep the park safe for everyone.",
    },
  ],
  fragments: [
    { text: "The mayor is the leader of the city.", is_sentence: true },
    { text: "Because neighbors spoke up.", is_sentence: false, fix: "The street is safer because neighbors spoke up." },
    { text: "Votes on new laws.", is_sentence: false, fix: "The City Council votes on new laws." },
    { text: "A law is a rule for everyone.", is_sentence: true },
    { text: "The children in the crosswalk.", is_sentence: false, fix: "The children walk in the crosswalk." },
    { text: "Citizens have rights and responsibilities.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The mayor, ___, leads Baltimore.",
      noun: "mayor",
      options: ["the leader of a city", "a group that votes on rules", "a rule everyone must follow"],
      answer: 0,
      model: "The mayor, the leader of a city, leads Baltimore.",
    },
    {
      lesson: "B",
      sentence: "The City Council, ___, votes on new laws.",
      noun: "City Council",
      options: ["the leader of a city", "a group of people who meet to vote", "a freedom every person has"],
      answer: 1,
      model: "The City Council, a group of people who meet to vote, votes on new laws.",
    },
    {
      lesson: "C",
      sentence: "Rights, ___, belong to every citizen.",
      noun: "Rights",
      options: ["jobs you should do for others", "rules made by the mayor", "freedoms that others must respect"],
      answer: 2,
      model: "Rights, freedoms that others must respect, belong to every citizen.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "because", stem: "the street is safer", model: "Because neighbors spoke up, the street is safer." },
    { lesson: "A", conjunction: "when", stem: "the idea becomes a law", model: "When the council members agree, the idea becomes a law." },
    { lesson: "D", conjunction: "if", stem: "the whole community benefits", model: "If every citizen does a job, the whole community benefits." },
  ],
  spo: {
    topic: {
      l1_2: "[Neighbors] spoke up, so the street is [safer].",
      l3_4: "Because [neighbors] spoke up, [the city] made the street [safer].",
      l5_6: "Although [one letter] cannot make a law, [neighbors who speak up] can cause [leaders to make the street safer].",
    },
    starters: [
      { type: "question", text: "How can neighbors help make a street safer?" },
      { type: "appositive", text: "The City Council, a group of leaders, listens to neighbors before it votes." },
      { type: "subordinate", text: "When neighbors write to the mayor, leaders hear new ideas." },
    ],
    details: [
      { note: "cars drive too fast near school", lesson: "B" },
      { note: "neighbors write letters to mayor", lesson: "B" },
      { note: "council listens + votes", lesson: "A" },
      { note: "new stop sign", lesson: "B" },
      { note: "citizens have right to speak up", lesson: "C" },
      { note: "speaking up = responsibility", lesson: "D" },
    ],
    distractors: ["City Hall is a big building", "the school bell rings at nine"],
    conclusion: {
      l1_2: "As a result, children [cross safely].",
      l3_4: "As a result, [children] can [cross the street safely].",
      l5_6: "As a result, [the new stop sign] helps [children cross safely], and [neighbors see] that [their voices matter].",
    },
  },
  prompt: {
    l1_2: "Draw the street and the stop sign. Write 1-3 sentences that tell what neighbors did and what happened.",
    l3_4: "Write a paragraph that explains how neighbors can change a street. Use because, so, and as a result.",
    l5_6: "Write a paragraph that explains how neighbors and leaders work together to make a street safer. Include an appositive and a sentence that starts with when or although.",
  },
  transitions: ["First,", "Next,", "Then,", "Because", "So", "As a result,", "That is why", "Finally,"],
  model: {
    l1_2: "Cars drove too fast. Neighbors wrote to the mayor. Now the street is safer.",
    l3_4: "Cars drove too fast near the school, so neighbors wrote letters to the mayor. Then the City Council listened and voted. Because neighbors spoke up, there is a new stop sign. As a result, children cross the street safely.",
    l5_6: "When cars drove too fast, neighbors wrote letters to the mayor. The City Council, a group of leaders, listened and voted. Although one letter cannot make a law, many voices can. Because neighbors spoke up, there is a new stop sign. As a result, children cross the street safely.",
  },
  revise: [
    "Did I tell what the neighbors did, which is the cause?",
    "Did I tell what changed, which is the effect?",
    "Did I use because, so, or as a result?",
    "Did I name the mayor or the City Council correctly?",
  ],
};
