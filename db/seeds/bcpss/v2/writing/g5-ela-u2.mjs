// BCPSS Writing Lab (TWR) — g5-ela-u2 · Word Play. Contract: ../writing-schema.mjs

export default {
  title: "Jumping to Conclusions",
  genre: "narrate",
  tip: "Ask students to name the problem, one attempt, the resolution, and the theme aloud before they write a single sentence.",
  lessons: [
    { id: "A", title: "Milo drives through the tollbooth" },
    { id: "B", title: "Puns: one word with two meanings" },
    { id: "C", title: "Idioms: literal and figurative language" },
    { id: "D", title: "Problem, resolution, and theme" },
  ],
  source: {
    title: "The Island of Conclusions",
    lesson: "C",
    text: "In The Phantom Tollbooth, a bored boy named Milo drives through a magic tollbooth into the Kingdom of Wisdom. There, words are alive, and sayings can become real places. One day, Milo and his watchdog Tock jump to Conclusions. The phrase is an idiom, but here it is literal, and they land on the Island of Conclusions. The island is easy to reach, but it is hard to leave. At first, Milo feels trapped by his own quick guess. Finally, he decides to think carefully before he leaps again. The author turns a saying into a funny problem with a serious lesson.",
  },
  notes: [
    { sentence: "There, words are alive, and sayings can become real places.", note: "words alive; sayings = real places" },
    { sentence: "One day, Milo and his watchdog Tock jump to Conclusions.", note: "Milo + Tock jump to Conclusions" },
    { sentence: "The island is easy to reach, but it is hard to leave.", note: "island: easy in, hard out" },
    { sentence: "Finally, he decides to think carefully before he leaps again.", note: "finally: think b4 leap" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Milo drives through the tollbooth",
      because: "he is bored with everything at home.",
      but: "the road leads somewhere he never expected.",
      so: "he arrives in the Kingdom of Wisdom.",
    },
    {
      lesson: "B",
      kernel: "A pun can confuse a reader",
      because: "one word in the joke has two meanings.",
      but: "the confusion turns into laughter once the reader sees both meanings.",
      so: "a good reader reads the sentence a second time.",
    },
    {
      lesson: "C",
      kernel: "Milo and Tock land on the Island of Conclusions",
      because: "they jumped to a conclusion without thinking.",
      but: "they cannot leave as easily as they arrived.",
      so: "the boy decides to think before he leaps again.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Milo drove.",
      parts: { when: "one boring afternoon", where: "through the magic tollbooth", how: "in his little car", why: "to escape his boredom" },
      model: "One boring afternoon, Milo drove through the magic tollbooth in his little car to escape his boredom.",
    },
    {
      lesson: "C",
      kernel: "Milo and Tock jumped.",
      parts: { when: "one day", where: "to the Island of Conclusions", how: "without thinking first" },
      model: "One day, Milo and Tock jumped to the Island of Conclusions without thinking first.",
    },
  ],
  fragments: [
    { text: "A pun is a joke with a word that has two meanings.", is_sentence: true },
    { text: "Because the saying was meant literally.", is_sentence: false, fix: "Milo was surprised because the saying was meant literally." },
    { text: "Tock, the watchdog with a clock for a body.", is_sentence: false, fix: "Tock, the watchdog with a clock for a body, joins Milo." },
    { text: "Milo decided to think carefully.", is_sentence: true },
    { text: "Laughed at the joke after he thought twice.", is_sentence: false, fix: "Milo laughed at the joke after he thought twice." },
    { text: "When the idiom becomes a real place.", is_sentence: false, fix: "Milo is confused when the idiom becomes a real place." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Milo, ___, drives through the tollbooth.",
      noun: "Milo",
      options: ["a watchdog with a clock for a body", "a joke that plays with two meanings", "a boy who finds everything boring"],
      answer: 2,
      model: "Milo, a boy who finds everything boring, drives through the tollbooth.",
    },
    {
      lesson: "B",
      sentence: "A pun, ___, can turn one word into a joke.",
      noun: "pun",
      options: ["a joke that plays with a word that has two meanings", "a saying whose meaning is not its words", "the lesson a story teaches"],
      answer: 0,
      model: "A pun, a joke that plays with a word that has two meanings, can turn one word into a joke.",
    },
    {
      lesson: "C",
      sentence: "An idiom, ___, may confuse a new reader.",
      noun: "idiom",
      options: ["the problem at the start of a story", "a saying whose meaning is not the same as its words", "a joke about the sound of a word"],
      answer: 1,
      model: "An idiom, a saying whose meaning is not the same as its words, may confuse a new reader.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "Milo drives into the Kingdom of Wisdom", model: "When the tollbooth appears in his room, Milo drives into the Kingdom of Wisdom." },
    { lesson: "B", conjunction: "although", stem: "Milo notices the two meanings", model: "Although the joke is hard to catch at first, Milo notices the two meanings." },
    { lesson: "D", conjunction: "after", stem: "Milo decides to think carefully", model: "After he lands on the Island of Conclusions, Milo decides to think carefully." },
  ],
  spo: {
    topic: {
      l1_2: "Milo faces a [problem] and learns a [lesson].",
      l3_4: "At first, Milo [felt trapped], but he [learned to think before he leaped].",
      l5_6: "Although [Milo jumped to a conclusion without thinking], he [solved his problem] by [thinking carefully].",
    },
    starters: [
      { type: "question", text: "What happens when a saying turns out to be a real place?" },
      { type: "appositive", text: "Milo, a bored boy in a little car, finds trouble when he takes an idiom literally." },
      { type: "subordinate", text: "When Milo and Tock jump to Conclusions, they land in a very strange problem." },
    ],
    details: [
      { note: "Milo bored; tollbooth = new world", lesson: "A" },
      { note: "idiom = literal in Kingdom of Wisdom", lesson: "C" },
      { note: "Milo + Tock jump to Conclusions", lesson: "C" },
      { note: "wordplay makes the problem funny", lesson: "B" },
      { note: "island: easy in, hard out", lesson: "C" },
      { note: "Milo decides to think b4 leap", lesson: "D" },
    ],
    distractors: ["the tollbooth arrived in a package", "Tock has a clock for a body"],
    conclusion: {
      l1_2: "Milo learns to [think twice].",
      l3_4: "This shows that [thinking twice] can keep you out of [trouble].",
      l5_6: "Because Milo [learned from his quick guess], the story shows that [thinking twice] turns [a silly problem into a serious lesson].",
    },
  },
  prompt: {
    l1_2: "Draw Milo on the Island of Conclusions. Write 2-4 sentences. Tell the problem and what Milo learns.",
    l3_4: "Write a paragraph that traces Milo's problem on the Island of Conclusions. Use your outline and the words at first, but, and finally.",
    l5_6: "Write a paragraph that traces how wordplay creates a problem for Milo and what the problem teaches. Include an appositive and a sentence that starts with when or although.",
  },
  transitions: ["At first,", "Then,", "But", "Suddenly,", "After that,", "Finally,", "As a result,", "In the end,"],
  model: {
    l1_2: "Milo jumped to Conclusions. He landed on an island. Now Milo thinks before he jumps.",
    l3_4: "At first, Milo felt trapped on the Island of Conclusions, because he had jumped without thinking. The saying jump to conclusions is an idiom, but in the Kingdom of Wisdom it is literal. Milo and Tock landed on the island, but they could not leave as easily as they arrived. Finally, Milo decided to think carefully before he leaped again. This shows that thinking twice can keep you out of trouble.",
    l5_6: "Although the Kingdom of Wisdom is full of wonders, Milo, a bored boy in a little car, finds trouble when he jumps to Conclusions. The phrase is an idiom, but in this kingdom it is literal, so he and Tock land on the Island of Conclusions. At first, Milo feels trapped because the island is easy to reach but hard to leave. Faced with this problem, he realizes that his quick guess caused it. Finally, Milo decides to think carefully before he leaps again. As a result, the author turns a silly saying into a lesson that thinking twice can keep you out of trouble.",
  },
  mpo: {
    thesis: "In The Phantom Tollbooth, the author turns a saying into a real problem, and Milo's trouble teaches that thinking twice matters.",
    paragraphs: [
      { topic: "The problem begins when Milo and Tock take an idiom literally.", notes: ["Milo + Tock jump to Conclusions", "idiom = literal in the Kingdom", "land on the island"] },
      { topic: "Milo struggles with the problem he created.", notes: ["island: easy in, hard out", "trapped by quick guess"] },
      { topic: "Milo resolves the problem and learns the theme.", notes: ["decides to think b4 leap", "theme = think twice"] },
    ],
    conclusion: "Wordplay makes the story funny, but it also teaches readers to read sayings carefully and to think twice before they decide.",
  },
  revise: [
    "Did I name the problem, one attempt, the resolution, and the theme?",
    "Did I explain that the idiom is literal in the Kingdom of Wisdom?",
    "Did I use signal words like at first, but, and finally in order?",
    "Did I end with the lesson the story teaches?",
  ],
};
