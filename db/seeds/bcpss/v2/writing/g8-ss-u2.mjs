// BCPSS Writing Lab (TWR) — g8-ss-u2 · Expansion, Reform Movements & Abolition. Contract: ../writing-schema.mjs

export default {
  title: "Same Year, Different Views",
  genre: "narrate",
  tip: "Have students choose one person, list what that person wants and fears, then write from that person's voice only.",
  lessons: [
    { id: "A", title: "Jacksonian democracy and who could vote" },
    { id: "B", title: "Indian removal and the Trail of Tears" },
    { id: "C", title: "Seneca Falls and the women's rights movement" },
    { id: "D", title: "Baltimore abolitionists and the road to freedom" },
  ],
  source: {
    title: "Three Stories, One Era",
    lesson: "D",
    text: "In 1838, the United States looked different to different people. In Baltimore, Frederick Douglass, a young man who was enslaved, planned to escape north. Anna Murray, a free Black woman, gave him money and a sailor's outfit. On September 3, he boarded a train, and fear pounded in his chest at every station. Far to the south, the Cherokee were forced from their homes on the Trail of Tears. Supporters of Andrew Jackson's removal policy said it opened land for settlers, whereas the Cherokee saw it as a terrible injustice. Ten years later, at Seneca Falls, women gathered to demand the right to vote. Each person acted for a reason, and each person told a different story.",
  },
  notes: [
    { sentence: "Anna Murray, a free Black woman, gave him money and a sailor's outfit.", note: "Murray (free) → money + sailor outfit" },
    { sentence: "On September 3, he boarded a train, and fear pounded in his chest at every station.", note: "9/3/1838 train north, fear @ every station" },
    { sentence: "Supporters of Andrew Jackson's removal policy said it opened land for settlers, whereas the Cherokee saw it as a terrible injustice.", note: "settlers: land opened; Cherokee: injustice" },
    { sentence: "Ten years later, at Seneca Falls, women gathered to demand the right to vote.", note: "1848 Seneca Falls: women demand vote" },
  ],
  bbs: [
    {
      lesson: "D",
      kernel: "Frederick Douglass boarded a train in Baltimore",
      because: "he wanted a life where no one could own him.",
      but: "fear pounded in his chest at every station.",
      so: "he reached New York and freedom the next day.",
    },
    {
      lesson: "B",
      kernel: "The Cherokee were forced to leave their homes",
      because: "the government wanted their land for settlers.",
      but: "they had built farms, schools, and a government of their own.",
      so: "thousands died on the Trail of Tears.",
    },
    {
      lesson: "C",
      kernel: "Women gathered at Seneca Falls in 1848",
      because: "they wanted the same rights as men.",
      but: "many people mocked their demand for the vote.",
      so: "the movement kept organizing for decades.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "Anna Murray helped him.",
      parts: { when: "before the trip", how: "with money and a sailor's outfit", why: "because she believed freedom was worth any risk" },
      model: "Before the trip, Anna Murray helped him with money and a sailor's outfit because she believed freedom was worth any risk.",
    },
    {
      lesson: "A",
      kernel: "More white men could vote.",
      parts: { when: "in the 1830s", where: "in many states", why: "because voters no longer had to own property" },
      model: "In the 1830s, more white men in many states could vote because voters no longer had to own property.",
    },
  ],
  fragments: [
    { text: "Anna Murray lived in Baltimore as a free Black woman.", is_sentence: true },
    { text: "Because the Cherokee were forced from their homes.", is_sentence: false, fix: "People remember it as a tragedy because the Cherokee were forced from their homes." },
    { text: "Women at Seneca Falls demanded the right to vote.", is_sentence: true },
    { text: "Hid his fear on the crowded train.", is_sentence: false, fix: "Frederick Douglass hid his fear on the crowded train." },
    { text: "Whereas supporters of removal saw new farmland.", is_sentence: false, fix: "The Cherokee saw an injustice, whereas supporters of removal saw new farmland." },
  ],
  appositives: [
    {
      lesson: "D",
      sentence: "Anna Murray, ___, gave Frederick Douglass money for his escape.",
      noun: "Anna Murray",
      options: ["a free Black woman in Baltimore", "a leader of the Cherokee nation", "the organizer of the Seneca Falls meeting"],
      answer: 0,
      model: "Anna Murray, a free Black woman in Baltimore, gave Frederick Douglass money for his escape.",
    },
    {
      lesson: "C",
      sentence: "Elizabeth Cady Stanton, ___, helped plan the Seneca Falls meeting.",
      noun: "Elizabeth Cady Stanton",
      options: ["a conductor on the Underground Railroad", "a leader of the women's rights movement", "the president who signed the Indian Removal Act"],
      answer: 1,
      model: "Elizabeth Cady Stanton, a leader of the women's rights movement, helped plan the Seneca Falls meeting.",
    },
    {
      lesson: "B",
      sentence: "John Ross, ___, spoke out against removal.",
      noun: "John Ross",
      options: ["a young man who escaped from slavery in Baltimore", "an author of the Declaration of Sentiments", "the principal chief of the Cherokee Nation"],
      answer: 2,
      model: "John Ross, the principal chief of the Cherokee Nation, spoke out against removal.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "because", stem: "Douglass risked everything on the train", model: "Because he wanted a life without slavery, Douglass risked everything on the train." },
    { lesson: "A", conjunction: "although", stem: "many other people were left out", model: "Although the vote reached more white men, many other people were left out." },
    { lesson: "B", conjunction: "while", stem: "the Cherokee saw the loss of their homes", model: "While supporters of removal saw new farmland, the Cherokee saw the loss of their homes." },
  ],
  spo: {
    topic: {
      l1_2: "[Frederick Douglass] wanted [freedom], but he felt [afraid].",
      l3_4: "From [Frederick Douglass's] perspective, the train north was [a risky step toward freedom] because [he wanted a life where no one could own him].",
      l5_6: "Although [Frederick Douglass] felt [fear] at every station, [his motivation] was [freedom], while [Anna Murray, who waited behind,] felt [hope and worry] about the same night.",
    },
    starters: [
      { type: "question", text: "What would it feel like to ride a train toward freedom while hiding who you are?" },
      { type: "appositive", text: "Frederick Douglass, a young man in Baltimore, boarded a train north." },
      { type: "subordinate", text: "As the train rolled past each station, his fear grew." },
    ],
    details: [
      { note: "train north from Baltimore, 1838", lesson: "D" },
      { note: "sailor's clothes + free sailor's papers", lesson: "D" },
      { note: "fear @ every station", lesson: "D" },
      { note: "Murray gives money, helps plan", lesson: "D" },
      { note: "Cherokee view: removal = injustice", lesson: "B" },
      { note: "1830s: more white men could vote", lesson: "A" },
    ],
    distractors: ["Baltimore has a busy harbor", "trains run on steel rails"],
    conclusion: {
      l1_2: "At last I felt [free].",
      l3_4: "In the end, [he] reached [New York], and his fear turned into [hope].",
      l5_6: "The same night looked [different] to each person, because [each one's motivation and fears were different].",
    },
  },
  prompt: {
    l1_2: "Be Frederick Douglass on the train. Write 3-4 sentences. Tell what you want and what you feel.",
    l3_4: "Narrate the train ride from Frederick Douglass's perspective. Show what he wants, why he acts, and how Anna Murray might see the same night.",
    l5_6: "Narrate the same night from Frederick Douglass's perspective, then contrast it with Anna Murray's view. Include an appositive and a sentence that starts with although or while.",
  },
  transitions: ["At first,", "Then,", "Meanwhile,", "Yet", "Whereas", "Because", "In contrast,", "In the end,"],
  model: {
    l1_2: "I am on a train in Baltimore. I want freedom. My heart pounds at every station.",
    l3_4: "From my perspective, the train north is a risky step toward freedom. I wear a sailor's clothes and carry papers that belong to a free Black sailor. I want a life where no one can own me, so I keep my head down. At every station, fear pounds in my chest. Meanwhile, Anna Murray waits in Baltimore and hopes that I am safe. In the morning, I reach New York and finally feel free.",
    l5_6: "Although fear pounds in my chest at every station, I keep my eyes on the window and my mind on freedom. I am Frederick Douglass, a young man who has been enslaved in Baltimore, and tonight I wear a sailor's clothes and carry papers that belong to a free Black sailor. I want a life where no one can own me, so I accept the risk. Anna Murray, a free Black woman, gave me money and helped me prepare. While I ride north, she waits in Baltimore and worries that every footstep is a threat. From my seat, the train is a path to freedom, whereas she sees it as a promise that may cost us everything. The conductor glances at my papers, and my heart nearly stops. By the next day, I step onto the streets of New York, free at last.",
  },
  mpo: {
    thesis: "The same moment in the early 1800s looked different to different people, and each person's perspective and motivation shaped what they did.",
    paragraphs: [
      { topic: "Frederick Douglass and Anna Murray saw the night train as a hopeful but dangerous step.", notes: ["9/3/1838 train north", "Douglass: freedom + fear", "Murray: helps, waits, worries"] },
      { topic: "The Cherokee and supporters of removal told opposite stories about the same policy.", notes: ["settlers: new land", "Cherokee: homes lost", "Trail of Tears, 1838"] },
      { topic: "At Seneca Falls, women and their critics disagreed about who should vote.", notes: ["1848 meeting", "women demand vote", "newspapers mock the idea"] },
    ],
    conclusion: "When we read history from several voices, we understand not only what happened but why each person acted, and why freedom and power meant different things to each of them.",
  },
  revise: [
    "Did I write from one person's perspective and show what that person wants?",
    "Did I show why the person acted, not only what the person did?",
    "Did I contrast the view with another person's view of the same events?",
    "Did I use a sensory detail or a feeling that fits the real history?",
  ],
};
