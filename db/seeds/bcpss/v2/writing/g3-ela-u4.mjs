// BCPSS Writing Lab (TWR) — g3-ela-u4 · Artists Make Art. Contract: ../writing-schema.mjs

export default {
  title: "The Wall That Changed a Street",
  genre: "explain",
  tip: "Build the cause-and-effect chain on the board first (wall, inspiration, mural, feeling) so students write the links in order.",
  lessons: [
    { id: "A", title: "What inspires an artist" },
    { id: "B", title: "Alvin Ailey and the dance Revelations" },
    { id: "C", title: "Georgia O'Keeffe paints the desert" },
    { id: "D", title: "Murals and what art does for a community" },
  ],
  source: {
    title: "A Wall in Baltimore",
    lesson: "D",
    text: "A gray, cracked wall stood at the end of a Baltimore street. Artist Tanya Reyes walked past it every day on her way to work. The wall inspired her to paint a mural of the harbor and blue crabs. She asked her neighbors to help. As a result, children learned new painting techniques. Now people stop to smile at the bright colors. The mural makes the whole street feel proud and safe.",
  },
  notes: [
    { sentence: "Artist Tanya Reyes walked past it every day on her way to work.", note: "Tanya walks past daily" },
    { sentence: "The wall inspired her to paint a mural of the harbor and blue crabs.", note: "wall → inspires mural: harbor + crabs" },
    { sentence: "As a result, children learned new painting techniques.", note: "neighbors help → kids learn technique" },
    { sentence: "The mural makes the whole street feel proud and safe.", note: "mural → street proud + safe" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The gray wall inspired Tanya to paint",
      because: "she saw it every day on her walk to work.",
      but: "the wall was too big for one painter.",
      so: "she asked her neighbors to help.",
    },
    {
      lesson: "B",
      kernel: "Alvin Ailey made a dance called Revelations",
      because: "he remembered the songs and prayers from his church.",
      but: "dancers tell the story without any words.",
      so: "people around the world can feel its joy and hope.",
    },
    {
      lesson: "C",
      kernel: "Georgia O'Keeffe painted the desert again and again",
      because: "the desert was new and exciting to her.",
      but: "some people see a dry place as empty.",
      so: "her large paintings help people see the desert in a new way.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "The painter mixed colors.",
      parts: { when: "every morning", where: "in her small studio", how: "with a special technique", why: "so the harbor would look real" },
      model: "Every morning, the painter mixed colors in her small studio with a special technique so the harbor would look real.",
    },
    {
      lesson: "B",
      kernel: "The dancers moved.",
      parts: { when: "during the show", where: "across the stage", how: "with a strong rhythm", why: "to express joy and hope" },
      model: "During the show, the dancers moved across the stage with a strong rhythm to express joy and hope.",
    },
  ],
  fragments: [
    { text: "The mural inspired the neighbors.", is_sentence: true },
    { text: "Because she saw the harbor every day.", is_sentence: false, fix: "She paints boats because she sees the harbor every day." },
    { text: "Express joy and hope.", is_sentence: false, fix: "The dance expresses joy and hope." },
    { text: "The rhythm repeats like a heartbeat.", is_sentence: true },
    { text: "As a result of the bright colors.", is_sentence: false, fix: "As a result of the bright colors, people smile at the wall." },
    { text: "Neighbors feel proud of their street.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "D",
      sentence: "Tanya Reyes, ___, painted the harbor mural.",
      noun: "Tanya Reyes",
      options: ["a large painting on a wall", "an artist who lives in Baltimore", "a beat that repeats in a dance"],
      answer: 1,
      model: "Tanya Reyes, an artist who lives in Baltimore, painted the harbor mural.",
    },
    {
      lesson: "D",
      sentence: "A mural, ___, can change how a street feels.",
      noun: "mural",
      options: ["a large painting made right on a wall", "a special way of making art", "a group of people who live in one place"],
      answer: 0,
      model: "A mural, a large painting made right on a wall, can change how a street feels.",
    },
    {
      lesson: "B",
      sentence: "Rhythm, ___, helps dancers move together.",
      noun: "Rhythm",
      options: ["art made by gluing paper onto a page", "a strong effect on a group", "a beat that repeats in music or dance"],
      answer: 2,
      model: "Rhythm, a beat that repeats in music or dance, helps dancers move together.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "since", stem: "the neighbors feel proud of their street", model: "Since the mural shows their harbor, the neighbors feel proud of their street." },
    { lesson: "A", conjunction: "because", stem: "Tanya painted a mural", model: "Because the gray wall inspired her every day, Tanya painted a mural." },
    { lesson: "C", conjunction: "after", stem: "people see the desert in a new way", model: "After they look at her large paintings, people see the desert in a new way." },
  ],
  spo: {
    topic: {
      l1_2: "The [mural] changed the [street].",
      l3_4: "Because [Tanya] saw [a gray wall] every day, she painted a [mural], and the art causes neighbors to [feel proud].",
      l5_6: "Because [a gray, cracked wall] inspired [Tanya Reyes, a Baltimore artist,] to paint [a harbor mural], the whole street now [feels proud and safe].",
    },
    starters: [
      { type: "question", text: "How can one painted wall change the way a street feels?" },
      { type: "appositive", text: "Tanya Reyes, a Baltimore artist, turned a gray wall into a harbor mural." },
      { type: "subordinate", text: "Since the wall was gray and cracked, nobody wanted to look at it." },
    ],
    details: [
      { note: "gray cracked wall at end of street", lesson: "D" },
      { note: "Tanya sees it daily → inspired", lesson: "A" },
      { note: "paints harbor + blue crabs", lesson: "D" },
      { note: "neighbors help paint", lesson: "D" },
      { note: "kids learn new techniques", lesson: "D" },
      { note: "bright colors → street proud + safe", lesson: "D" },
    ],
    distractors: ["O'Keeffe painted wide desert skies", "Revelations is a famous dance"],
    conclusion: {
      l1_2: "The mural makes people [proud].",
      l3_4: "As a result, the mural leads to [pride] in [the neighborhood].",
      l5_6: "As a result, one painted wall [turned a gray corner into a place where neighbors feel proud and safe].",
    },
  },
  prompt: {
    l1_2: "Draw the mural on the wall. Write 2-3 sentences. Tell what inspired it and how people feel.",
    l3_4: "Write a paragraph that explains what inspired Tanya Reyes to paint the mural and what effect it has on her neighbors. Use because and as a result.",
    l5_6: "Write a paragraph that explains the chain of causes and effects from the gray wall to the proud street. Include an appositive and a sentence that starts with because or since.",
  },
  transitions: ["First,", "Because", "Since", "So", "As a result,", "This causes", "For example,", "Finally,"],
  model: {
    l1_2: "A gray wall inspired Tanya. She painted a harbor mural. Now the neighbors feel proud.",
    l3_4: "Because Tanya Reyes saw a gray wall every day, she painted a mural of the harbor. She asked her neighbors to help, so children learned painting techniques. The bright colors cause people to stop and smile. As a result, the neighbors feel proud of their street. One wall changed how the whole street feels.",
    l5_6: "Because a gray, cracked wall inspired her every day, Tanya Reyes, a Baltimore artist, painted a harbor mural. She asked her neighbors to help, so children learned new painting techniques. Since the mural shows boats and blue crabs, it reminds people of home. The bright colors cause people to stop and smile. As a result, the street feels proud and safe. One painted wall turned a gray corner into a place where neighbors feel proud.",
  },
  revise: [
    "Did I tell what inspired the artist?",
    "Did I use because, so, or as a result to link each cause to its effect?",
    "Did I explain the effect on people, not just describe the art?",
    "Did I use at least one art word, like mural or technique?",
  ],
};
