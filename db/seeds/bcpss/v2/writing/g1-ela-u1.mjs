// BCPSS Writing Lab (TWR) — g1-ela-u1 · A World of Books. Contract: ../writing-schema.mjs

export default {
  title: "The Book Helper Story",
  genre: "narrate",
  tip: "Say each problem-and-fix pair aloud with a book in hand before students draw, then let them write only after they can tell it.",
  lessons: [
    { id: "A", title: "Books travel to children" },
    { id: "B", title: "Borrow books from a library" },
    { id: "C", title: "Find the problem and the fix" },
    { id: "D", title: "One book can change a life" },
  ],
  source: {
    title: "The Donkey with Books",
    lesson: "A",
    text: "Tomás lives in a small village. The village has no library. Books are far away. A donkey walks over the hills. It carries a bag of books. Tomás borrows one book. Now Tomás reads every day.",
  },
  notes: [
    { sentence: "The village has no library.", note: "village = no library" },
    { sentence: "A donkey walks over the hills.", note: "donkey → hills" },
    { sentence: "It carries a bag of books.", note: "bag of books" },
    { sentence: "Now Tomás reads every day.", note: "now reads daily" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The book truck came to the village",
      because: "the village had no library.",
      but: "it could not bring every book.",
      so: "the children could borrow books.",
    },
    {
      lesson: "C",
      kernel: "Leo wanted a new book",
      because: "he loved stories.",
      but: "the library was too far away.",
      so: "he waited for the book truck.",
    },
    {
      lesson: "B",
      kernel: "Nia borrowed a book",
      because: "she wanted to read at the beach.",
      but: "she had to give it back.",
      so: "she read it every night.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "The truck comes.",
      parts: { when: "on Fridays", where: "to the village", why: "to bring books" },
      model: "On Fridays, the truck comes to the village to bring books.",
    },
    {
      lesson: "B",
      kernel: "Ana borrows books.",
      parts: { when: "after school", where: "at the library", how: "with a smile" },
      model: "After school, Ana borrows books at the library with a smile.",
    },
  ],
  fragments: [
    { text: "The truck brings books.", is_sentence: true },
    { text: "A truck full of books.", is_sentence: false, fix: "A truck full of books comes to the village." },
    { text: "Brings books to the island.", is_sentence: false, fix: "A boat brings books to the island." },
    { text: "Nia borrows a book.", is_sentence: true },
    { text: "Because the village had no library.", is_sentence: false, fix: "The children were sad because the village had no library." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Nia, ___, borrows a book.",
      noun: "Nia",
      options: ["a girl on a tiny island", "a truck full of books", "a book about frogs"],
      answer: 0,
      model: "Nia, a girl on a tiny island, borrows a book.",
    },
    {
      lesson: "A",
      sentence: "The book boat, ___, brings books to the island.",
      noun: "The book boat",
      options: ["a girl who likes crabs", "a small boat with many books", "a village far away"],
      answer: 1,
      model: "The book boat, a small boat with many books, brings books to the island.",
    },
    {
      lesson: "A",
      sentence: "Tomás lives in a small village, ___.",
      noun: "village",
      options: ["a bag of books", "a boat on the sea", "a tiny town far from the city"],
      answer: 2,
      model: "Tomás lives in a small village, a tiny town far from the city.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "the children run to the truck", model: "When the book truck comes, the children run to the truck." },
    { lesson: "C", conjunction: "because", stem: "Nia is glad", model: "Because a book boat came, Nia is glad." },
    { lesson: "D", conjunction: "after", stem: "Tomás reads every night", model: "After he borrows a book, Tomás reads every night." },
  ],
  spo: {
    topic: {
      l1_2: "A [helper] brings books to a [place].",
      l3_4: "The problem was that [character] had no [books]. So a [helper] brought books to [place].",
      l5_6: "Although [the village] had no library, [a donkey with a bag of books] solved the problem by [bringing stories to the children].",
    },
    starters: [
      { type: "question", text: "How can a village get books with no library?" },
      { type: "appositive", text: "Tomás, a boy in a small village, got a book." },
      { type: "subordinate", text: "When a donkey brought books, the village was happy." },
    ],
    details: [
      { note: "village = no library", lesson: "C" },
      { note: "donkey carries bag of books", lesson: "A" },
      { note: "walks over the hills", lesson: "A" },
      { note: "Tomás borrows 1 book", lesson: "B" },
      { note: "problem → fix", lesson: "C" },
      { note: "now reads every day", lesson: "D" },
    ],
    distractors: ["donkeys like to eat carrots", "Tomás has a red hat"],
    conclusion: {
      l1_2: "Now [Tomás] can [read].",
      l3_4: "Now [Tomás] can [read every day] because the [donkey] brought books.",
      l5_6: "One book changed [Tomás] because it gave him [a way to read, learn, and dream].",
    },
  },
  prompt: {
    l1_2: "Draw a book helper. Write 1-3 sentences. Tell the problem. Tell how it was solved.",
    l3_4: "Write a story about a book helper. Tell the problem and the fix. Use the words so and now.",
    l5_6: "Write a story about a book helper. Tell the problem and how it was solved. Use one appositive and a sentence that starts with when or because.",
  },
  transitions: ["First,", "One day,", "Then,", "So", "But", "After that,", "Now", "At last,"],
  model: {
    l1_2: "The problem was that Tomás had no books. So a donkey brought books.",
    l3_4: "The problem was that Tomás had no books. He was sad because the village had no library. So a donkey brought books to the village. Now Tomás reads every day.",
    l5_6: "The problem was that Tomás, a boy in a small village, had no books. When a donkey with a bag of books came, Tomás borrowed one. Because the donkey walked over the hills, the whole village could read. Now Tomás reads every day.",
  },
  revise: [
    "Did I tell the problem first?",
    "Did I use so to tell how the problem was fixed?",
    "Did I start each sentence with a capital letter and end it with a period?",
    "Did I name a helper that brings books?",
  ],
};
