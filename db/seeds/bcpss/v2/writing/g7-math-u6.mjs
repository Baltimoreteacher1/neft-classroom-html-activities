// BCPSS Writing Lab (TWR) — g7-math-u6 · Sampling, Inferences & Probability. Contract: ../writing-schema.mjs

export default {
  title: "Back Up Your Claim",
  genre: "argue",
  tip: "Have students write the claim first, then point to the exact numbers in the sample that prove it before they add any extra sentences.",
  lessons: [
    { id: "A", title: "Populations and samples" },
    { id: "B", title: "Random and biased samples" },
    { id: "C", title: "Comparing two populations with mean and spread" },
    { id: "D", title: "Probability of compound events" },
  ],
  source: {
    title: "Dance or Movie Night?",
    lesson: "B",
    text: "Zion plans a Friday event at his school, which has 600 students. He wants to know if students prefer a dance or a movie night. Zion asks 30 students chosen by a random number generator. In his sample, 21 students choose the dance. That is 70 percent. According to the random sample, about 420 of the 600 students prefer the dance. Zion also asks the 30 members of the dance club. All 30 choose the dance, but this sample is biased, because the club members already love dancing. Zion trusts the random sample, since every student had an equal chance of being chosen.",
  },
  notes: [
    { sentence: "Zion asks 30 students chosen by a random number generator.", note: "30 students, random generator" },
    { sentence: "In his sample, 21 students choose the dance.", note: "21 of 30 = dance" },
    { sentence: "According to the random sample, about 420 of the 600 students prefer the dance.", note: "random sample: 70% × 600 = 420" },
    { sentence: "All 30 choose the dance, but this sample is biased, because the club members already love dancing.", note: "dance club = biased (already love dancing)" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Zion trusts the random sample",
      because: "every student had an equal chance of being chosen.",
      but: "the sample of 30 is much smaller than the whole school.",
      so: "he infers that about 420 students prefer the dance.",
    },
    {
      lesson: "A",
      kernel: "The 600 students are the population",
      because: "they are the whole group Zion wants to learn about.",
      but: "he can only ask 30 of them.",
      so: "the 30 students are a sample.",
    },
    {
      lesson: "D",
      kernel: "The probability of heads and a 3 is 1/12",
      because: "there are 12 equal outcomes and only one matches.",
      but: "the probability of heads alone is 1/2.",
      so: "adding the number cube makes the event less likely.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Zion chose students.",
      parts: { when: "before the survey", how: "with a random number generator", why: "so every student had an equal chance" },
      model: "Before the survey, Zion chose students with a random number generator so every student had an equal chance.",
    },
    {
      lesson: "C",
      kernel: "Maya compared two classes.",
      parts: { when: "after collecting the scores", how: "by finding each mean", why: "to see which group scored higher" },
      model: "After collecting the scores, Maya compared two classes by finding each mean to see which group scored higher.",
    },
  ],
  fragments: [
    { text: "A sample is a smaller part of the whole group.", is_sentence: true },
    { text: "Because every student had an equal chance.", is_sentence: false, fix: "Zion's sample is fair because every student had an equal chance." },
    { text: "Asked only the members of the dance club.", is_sentence: false, fix: "Zion asked only the members of the dance club." },
    { text: "A biased sample leaves out part of the group.", is_sentence: true },
    { text: "According to the random sample.", is_sentence: false, fix: "According to the random sample, about 420 students prefer the dance." },
    { text: "The probability of an event is a number from 0 to 1.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The population, ___, is all 600 students in Zion's school.",
      noun: "population",
      options: ["the whole group you want to learn about", "a smaller part of the group you ask", "an average of all the values"],
      answer: 0,
      model: "The population, the whole group you want to learn about, is all 600 students in Zion's school.",
    },
    {
      lesson: "B",
      sentence: "A biased sample, ___, gives an unfair picture of the group.",
      noun: "biased sample",
      options: ["a sample where everyone has an equal chance", "a sample that leaves out part of the group", "one possible result of a chance experiment"],
      answer: 1,
      model: "A biased sample, a sample that leaves out part of the group, gives an unfair picture of the group.",
    },
    {
      lesson: "D",
      sentence: "A compound event, ___, is flipping a coin and then rolling a number cube.",
      noun: "compound event",
      options: ["one possible result of a chance experiment", "a number from 0 to 1", "an event with two or more steps"],
      answer: 2,
      model: "A compound event, an event with two or more steps, is flipping a coin and then rolling a number cube.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "he asks a sample of 30", model: "Because Zion cannot ask all 600 students, he asks a sample of 30." },
    { lesson: "B", conjunction: "since", stem: "Zion trusts the random sample", model: "Since every student had an equal chance, Zion trusts the random sample." },
    { lesson: "C", conjunction: "although", stem: "the second class's scores are more spread out", model: "Although the first class has the higher mean, the second class's scores are more spread out." },
  ],
  spo: {
    topic: {
      l1_2: "My claim is that [about 420 students] prefer the [dance] because [the sample is random].",
      l3_4: "My claim is that about [420 of the 600 students] prefer the dance because [21 of 30 students in a random sample] chose it.",
      l5_6: "According to [a random sample of 30 students], [70 percent] prefer the dance, so I infer that [about 420 of the 600 students] do, because [every student had an equal chance of being chosen].",
    },
    starters: [
      { type: "question", text: "Can 30 students really tell us what 600 students think?" },
      { type: "statement", text: "A random sample can speak for a whole school, but only if it is fair." },
      { type: "appositive", text: "Zion, a student planning a Friday event, uses a random sample to learn what his school wants." },
    ],
    details: [
      { note: "population = 600 students", lesson: "A" },
      { note: "random sample of 30 students", lesson: "B" },
      { note: "21 of 30 chose the dance = 70%", lesson: "B" },
      { note: "70% × 600 = 420 students", lesson: "B" },
      { note: "dance club sample = biased", lesson: "B" },
      { note: "compare two classes: mean and spread", lesson: "C" },
    ],
    distractors: ["the school has a big gym", "movie night costs less to plan"],
    conclusion: {
      l1_2: "So I [trust] the [random] sample.",
      l3_4: "Therefore, I trust the random sample because [every student had an equal chance], and its data support my claim.",
      l5_6: "Because [the sample is random] and [the numbers match my estimate], I can say with confidence that [about 420 students] prefer the dance.",
    },
  },
  prompt: {
    l1_2: "Look at Zion's data: 21 of 30 students chose the dance. Write 3 sentences. Make a claim and use the word because.",
    l3_4: "Write a paragraph that makes a claim about how many of the 600 students prefer the dance. Use numbers from the sample, and use because and according to.",
    l5_6: "Write a paragraph that claims how many of the 600 students prefer the dance and supports it with evidence. Explain why the random sample is better than the dance club sample. Include an appositive and a sentence that starts with since or although.",
  },
  transitions: ["My claim is that", "According to", "As shown by", "For example,", "Since", "Because", "Therefore,", "However,"],
  model: {
    l1_2: "A random sample of 30 students chose the dance. That is 70 percent. So about 420 of the 600 students prefer the dance.",
    l3_4: "My claim is that about 420 of the 600 students prefer the dance because 21 of 30 students in a random sample chose it. First, Zion picked the 30 students with a random number generator. Every student had an equal chance, so the sample is fair. The 21 students are 70 percent of the sample. Since 70 percent of 600 is 420, I infer that about 420 students prefer the dance. In contrast, the dance club sample is biased.",
    l5_6: "According to a random sample of 30 students, 70 percent prefer the dance, so I infer that about 420 of the 600 students do. Zion, a student planning a Friday event, chose the sample with a random number generator. Because every student had an equal chance of being chosen, the sample is fair. As shown by his data, 21 of the 30 students picked the dance. Since 21 out of 30 equals 70 percent, and 70 percent of 600 is 420, the estimate is supported. Although the dance club also voted for the dance, that sample is biased, because its members already love dancing. Therefore, I trust the random sample, not the club, to speak for the whole school.",
  },
  mpo: {
    thesis: "A fair random sample supports the claim that about 420 of the 600 students prefer the dance, whereas a biased sample would not.",
    paragraphs: [
      { topic: "The population is all 600 students, and a sample of 30 can describe it if the sample is chosen fairly.", notes: ["population = 600", "sample = 30", "random generator = equal chance"] },
      { topic: "The data from the random sample support an inference about the whole school.", notes: ["21 of 30 = 70%", "70% × 600 = 420", "according to the data"] },
      { topic: "The dance club sample is biased, so it cannot support the same claim.", notes: ["30 of 30 = dance", "members already love dancing", "leaves out other students"] },
    ],
    conclusion: "A claim is only as strong as its sample, so I trust the random sample and its numbers instead of the biased club.",
  },
  revise: [
    "Did I state a clear claim about the whole population, such as about 420 of 600 students?",
    "Did I back it up with numbers from the sample, such as 21 of 30 students?",
    "Did I use according to, because, or as shown by to connect my evidence to my claim?",
    "Did I explain why the sample is fair, using equal chance?",
  ],
};
