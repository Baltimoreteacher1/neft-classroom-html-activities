// Concept Builder (scale-sort): order summaries from too little to too much, then order sentences by how much they copy the text. Original content.
const fr = (ee, dev, exp, br) => ({ ee, dev, exp, br });

export default {
  id: "g6-sped-summary-sort",
  engine: "concept-builder",
  kind: "scale-sort",
  title: "Sort summaries and paraphrases",
  grade: "6",
  band: "6-8",
  subject: "sped",
  lessonId: "g6-sped-note-taking-and-summarizing",
  standards: ["RI.6.2", "RST.6-8.2", "UDL.3.2"],
  vocabIds: ["summary", "paraphrase", "key-detail", "main-idea"],
  minutes: 15,
  intro:
    "A good summary is not too short and not too long. A good paraphrase uses your own words. Move the cards to put them in order, then say what makes a good one. You can use the arrow buttons or drag.",
  model: {
    axis: { label: "Amount of information", low: "too little", high: "too much" },
    items: [
      { id: "c", text: "Bees carry pollen from flower to flower, which helps plants make fruit and seeds." },
      { id: "e", text: "Bees drink nectar and have fuzzy bodies. Bees live in hives and make honey. Bees carry pollen from flower to flower. Apples, blueberries and almonds depend on pollination. Gardens can plant flowers." },
      { id: "a", text: "Bees." },
      { id: "d", text: "Bees carry pollen from flower to flower, which helps plants make fruit and seeds. Many foods, such as apples and almonds, depend on this." },
      { id: "b", text: "Bees are important to plants." },
    ],
  },
  tasks: [
    {
      id: "t1",
      prompt:
        "These five sentences all try to summarize an article about bees and pollination. Put them in order from the one with the least information to the one with the most.",
      goal: "Least information at the top, most at the bottom",
      target: { order: ["a", "b", "c", "d", "e"] },
      check: { type: "order", of: "order", expected: ["a", "b", "c", "d", "e"] },
      hints: [
        "Look at how many facts each one gives, not only how long it is.",
        "Find the one with a single word. Which one has the most separate facts?",
        "Ask for each one: how many different ideas does it tell?",
      ],
      misconceptions: [
        { match: "reversed", when: { type: "equals", of: "first", value: "e" }, hint: "Check the top of the list. The top should be the one with the least information." },
      ],
      model: "'Bees.' says almost nothing. 'Bees are important to plants' names a topic but no detail. The next one gives the main idea and how pollen moves. The next adds one more detail about foods. The last one lists many details, some that are not needed to explain the main idea.",
      right: "Yes. That is the order from least to most information.",
      supports: {
        ee: { frames: ["This one has ___ facts.", "This one tells more than ___."], wordBank: ["main idea", "detail", "more", "less"], directions: "Read each card aloud. Then count the facts with your fingers." },
        dev: { frames: ["I put ___ first because it ___."], wordBank: ["detail", "fact", "idea"] },
        exp: { frames: ["The order goes from ___ to ___ because the first has ___ and the last has ___."] },
        br: {},
      },
      justify: {
        prompt: "A good summary keeps the main idea and the key details and leaves out extras. Which statements show why a summary is good? Pick all that apply.",
        options: [
          { id: "j1", text: "'Bees carry pollen from flower to flower, which helps plants make fruit and seeds' names the main idea and one key detail.", ok: true },
          { id: "j2", text: "The sentence that adds apples and almonds adds one more key detail and stays on the main idea.", ok: true },
          { id: "j3", text: "'Bees.' is the best because it is the shortest.", ok: false, hint: "Short is not enough. A summary needs the main idea and at least one key detail." },
          { id: "j4", text: "The longest one is the best because it has the most facts.", ok: false, hint: "A summary keeps only the key details. Some of those facts are not needed to explain the main idea." },
          { id: "j5", text: "'Bees are important to plants' is the best because it names a topic.", ok: false, hint: "It names the topic but gives no key detail that explains why." },
        ],
        min: 2,
        model: "A good summary has the main idea and the key details, and it leaves out extras. The second and third sentences do that.",
      },
      explain: {
        prompt: "What do you keep and what do you leave out when you write a summary?",
        frames: fr(["I keep ___.", "I leave out ___."], ["I keep the main idea and ___. I leave out ___."], ["A summary keeps the main idea and key details and leaves out ___ because ___."], ["A strong summary keeps ___ and omits ___ because it must ___."]),
        mustMention: [{ id: "keep", label: "main idea and key details", any: ["main idea", "key detail", "important"] }],
      },
    },
    {
      id: "t2",
      prompt:
        "The original sentence is: 'Tiny grains of pollen stick to the bee's fuzzy body.' Put the four sentences in order from the one that shares the fewest words with it to the one that shares the most.",
      goal: "Fewest shared words at the top, most at the bottom",
      setup: {
        axis: { label: "Words shared with the original sentence", low: "few of the same words", high: "many of the same words" },
        items: [
          { id: "p3", text: "Small grains of pollen stick to the bee's soft fur." },
          { id: "p1", text: "Little bits from the flower cling to the bee's soft coat." },
          { id: "p4", text: "Tiny grains of pollen stick to the bee's fuzzy body." },
          { id: "p2", text: "Pollen sticks to a bee's body." },
        ],
      },
      target: { order: ["p1", "p2", "p3", "p4"] },
      check: { type: "order", of: "order", expected: ["p1", "p2", "p3", "p4"] },
      hints: [
        "Circle the words in the original. Then look for the same words in each sentence.",
        "One sentence is exactly the same as the original. That one shares the most.",
        "Count how many words of the original appear in each sentence.",
      ],
      misconceptions: [
        { match: "reversed", when: { type: "equals", of: "first", value: "p4" }, hint: "The top of the list should share the fewest words with the original. Check the top." },
      ],
      model: "Underline the original's words. The sentence about 'little bits from the flower' shares only 'to', 'the' and 'bee's'. 'Pollen sticks to a bee's body' shares pollen, to, bee's and body. 'Small grains of pollen stick to the bee's soft fur' shares seven words. The last one copies the original.",
      right: "Yes. The more words you share, the closer you are to copying.",
      supports: {
        ee: { frames: ["This sentence has ___ of the same words.", "This one is a copy."], wordBank: ["same", "different", "copy", "own words"], directions: "Underline each word of the original. Then check each card." },
        dev: { frames: ["I put ___ first because it shares few words."], wordBank: ["share", "copy", "paraphrase"] },
        exp: { frames: ["The order is ___ because ___ shares ___ words with the original."] },
        br: {},
      },
      justify: {
        prompt: "A good paraphrase keeps the meaning and uses your own words. Which statements are true? Pick all that apply.",
        options: [
          { id: "k1", text: "A paraphrase keeps the same meaning as the original.", ok: true },
          { id: "k2", text: "A paraphrase uses mostly my own words.", ok: true },
          { id: "k3", text: "A paraphrase is the original with one word changed.", ok: false, hint: "Changing one word is still copying. Most of the words should be your own." },
          { id: "k4", text: "A paraphrase can add what I think about bees.", ok: false, hint: "A paraphrase says what the text says. It leaves out my opinion." },
          { id: "k5", text: "A paraphrase has to be longer than the original.", ok: false, hint: "Length does not matter. Meaning and my own words matter." },
        ],
        min: 2,
        model: "A paraphrase keeps the meaning and uses mostly your own words. It is not a copy and it does not add an opinion.",
      },
      explain: {
        prompt: "How can you tell that a sentence is a copy and not a paraphrase?",
        frames: fr(["A copy has ___ words.", "A paraphrase has ___ words."], ["A copy shares ___ words with the original. A paraphrase uses ___ words."], ["A copy shares many words with the original, but a paraphrase ___ while keeping ___."], ["A sentence is a copy when it ___; a paraphrase instead ___ while preserving ___."]),
        mustMention: [{ id: "own", label: "own words, same meaning", any: ["own words", "same meaning", "different words", "my words"] }],
      },
    },
  ],
  reflection: {
    prompt: "Which was easier to sort, the summaries or the paraphrases? What helped you decide?",
    frames: {
      ee: ["The easier one was ___.", "It helped to ___."],
      dev: ["The easier one was ___ because ___.", "I counted ___."],
      exp: ["I found ___ easier because ___; what helped was ___."],
      br: ["I found ___ more straightforward because ___, and I confirmed it by ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
