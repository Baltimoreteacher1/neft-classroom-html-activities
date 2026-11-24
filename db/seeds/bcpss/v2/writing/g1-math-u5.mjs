// BCPSS Writing Lab (TWR) — g1-math-u5 · Represent & Interpret Data. Contract: ../writing-schema.mjs

export default {
  title: "Win the Vote With Proof",
  genre: "argue",
  tip: "Point to the tallest bar and count its votes aloud before students write a claim and a because sentence.",
  lessons: [
    { id: "A", title: "Ask a question and make tally marks" },
    { id: "B", title: "Make a bar graph" },
    { id: "C", title: "Read the graph for most and least" },
    { id: "D", title: "How many more or fewer" },
  ],
  source: {
    title: "Room 8 Picks a Trip",
    lesson: "A",
    text: "Room 8 votes for a field trip. Kai counts the tally marks. The National Aquarium gets 9 votes. The Maryland Zoo gets 6 votes. Patterson Park gets 4 votes. The aquarium has the most votes. It has 3 more votes than the zoo. The aquarium wins.",
  },
  notes: [
    { sentence: "Kai counts the tally marks.", note: "tally marks → count" },
    { sentence: "The Maryland Zoo gets 6 votes.", note: "zoo = 6 votes" },
    { sentence: "The aquarium has the most votes.", note: "aquarium = most votes" },
    { sentence: "It has 3 more votes than the zoo.", note: "9 − 6 = 3 more" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "The aquarium won the vote",
      because: "it got 9 votes, the most.",
      but: "the zoo got a lot of votes too.",
      so: "the class will visit the aquarium.",
    },
    {
      lesson: "D",
      kernel: "The park got the fewest votes",
      because: "only 4 children picked it.",
      but: "it is a fun place to play.",
      so: "the class will not go there.",
    },
    {
      lesson: "A",
      kernel: "Kai used tally marks",
      because: "they make counting easy.",
      but: "the fifth mark goes across the other four.",
      so: "he could count by fives.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Room 8 voted.",
      parts: { when: "on Monday", what: "for a field trip", where: "in their classroom" },
      model: "On Monday, Room 8 voted for a field trip in their classroom.",
    },
    {
      lesson: "B",
      kernel: "Kai counted.",
      parts: { how: "with tally marks", when: "after the vote", why: "to find the winner" },
      model: "After the vote, Kai counted with tally marks to find the winner.",
    },
  ],
  fragments: [
    { text: "The zoo got 6 votes.", is_sentence: true },
    { text: "Has the most votes.", is_sentence: false, fix: "The aquarium has the most votes." },
    { text: "Because 9 is more than 6.", is_sentence: false, fix: "The aquarium wins because 9 is more than 6." },
    { text: "Kai drew a bar graph.", is_sentence: true },
    { text: "The tallest bar on the graph.", is_sentence: false, fix: "The tallest bar on the graph is the aquarium." },
  ],
  appositives: [
    {
      lesson: "C",
      sentence: "The aquarium, ___, got 9 votes.",
      noun: "The aquarium",
      options: ["a place with fish and sharks", "a mark that counts one", "a picture that uses bars"],
      answer: 0,
      model: "The aquarium, a place with fish and sharks, got 9 votes.",
    },
    {
      lesson: "A",
      sentence: "A tally mark, ___, counts one vote.",
      noun: "A tally mark",
      options: ["a picture with bars", "a little line that counts one", "a question for many people"],
      answer: 1,
      model: "A tally mark, a little line that counts one, counts one vote.",
    },
    {
      lesson: "B",
      sentence: "A survey, ___, helped Room 8 pick a trip.",
      noun: "A survey",
      options: ["a graph with tall bars", "the least amount", "asking many people the same question"],
      answer: 2,
      model: "A survey, asking many people the same question, helped Room 8 pick a trip.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "because", stem: "the aquarium wins", model: "Because it has 9 votes, the aquarium wins." },
    { lesson: "D", conjunction: "although", stem: "the aquarium got more votes", model: "Although the zoo got 6 votes, the aquarium got more votes." },
    { lesson: "B", conjunction: "when", stem: "we know it has the most votes", model: "When the tallest bar is the aquarium, we know it has the most votes." },
  ],
  spo: {
    topic: {
      l1_2: "The [aquarium] has the [most] votes.",
      l3_4: "The [aquarium] is the winner because it has [9] votes and the [zoo] has [6].",
      l5_6: "Although [the zoo] got many votes, [the aquarium] is the winner because it has [3 more votes than the zoo].",
    },
    starters: [
      { type: "question", text: "Which trip should Room 8 take, and how do we know?" },
      { type: "statement", text: "The aquarium is the winner of the vote." },
      { type: "subordinate", text: "Although three places got votes, one place got the most." },
    ],
    details: [
      { note: "aquarium = 9 votes", lesson: "C" },
      { note: "zoo = 6 votes", lesson: "C" },
      { note: "park = 4 votes", lesson: "C" },
      { note: "tally marks → bar graph", lesson: "B" },
      { note: "9 − 6 = 3 more", lesson: "D" },
      { note: "survey: one question for all", lesson: "A" },
    ],
    distractors: ["the bus is yellow", "Kai likes sharks"],
    conclusion: {
      l1_2: "So the [aquarium] [wins].",
      l3_4: "So Room 8 should pick the [aquarium] because it has the [most] votes.",
      l5_6: "Because [the aquarium has 9 votes, 3 more than the zoo], Room 8 should [visit the aquarium].",
    },
  },
  prompt: {
    l1_2: "Look at the vote graph. Write 1-3 sentences. Tell which trip wins.",
    l3_4: "Which trip wins? Write your claim and prove it with numbers from the graph. Use the words because and so.",
    l5_6: "Which trip should Room 8 take? Write a claim, prove it with numbers, and tell how many more votes it has. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["I think", "Because", "For example,", "Also,", "So", "But", "That shows", "In the end,"],
  model: {
    l1_2: "The aquarium wins. It has 9 votes. The zoo has 6 votes.",
    l3_4: "The aquarium is the winner because it has 9 votes and the zoo has only 6. The park has the fewest votes with 4. So the aquarium has the most votes. It has 3 more votes than the zoo.",
    l5_6: "Although the zoo got many votes, the aquarium is the winner. The aquarium, a place with fish and sharks, got 9 votes. That is 3 more votes than the zoo, which got 6. Because the park got only 4 votes, it has the least. Room 8 should visit the aquarium.",
  },
  revise: [
    "Did I say which trip wins in my first sentence?",
    "Did I prove it with a number from the graph?",
    "Did I use because to connect my claim and my proof?",
    "Did I tell how many more votes the winner has?",
  ],
};
