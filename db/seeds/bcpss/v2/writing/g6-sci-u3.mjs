// BCPSS Writing Lab (TWR) — g6-sci-u3 · Where Have All the Creatures Gone? Contract: ../writing-schema.mjs

export default {
  title: "What Happened to the Lake Trout?",
  genre: "argue",
  tip: "Have students put one number from the graph in every claim sentence before they explain the reasoning.",
  lessons: [
    { id: "A", title: "Food webs: who eats whom in an ecosystem" },
    { id: "B", title: "Native and invasive species" },
    { id: "C", title: "Reading population graphs" },
    { id: "D", title: "Predators, competition and the sea lamprey" },
  ],
  source: {
    title: "The Mirror Lake Mystery",
    lesson: "C",
    text: "Imagine a lake called Mirror Lake. In 1940, scientists counted 800 lake trout, a native species. Then sea lampreys, an invasive species, arrived through a canal. Sea lampreys are predators that attach to larger fish and feed on their blood. By 1955, scientists counted only 90 lake trout. During the same years, the number of sea lampreys rose from 0 to 1,200. The food web shows that lampreys eat trout, and trout eat smaller fish. Overfishing also hurt the trout, so scientists need more evidence. Still, the graph shows that the trout fell as the lampreys grew.",
  },
  notes: [
    { sentence: "By 1955, scientists counted only 90 lake trout.", note: "1955 = 90 trout (was 800)" },
    { sentence: "During the same years, the number of sea lampreys rose from 0 to 1,200.", note: "lampreys 0 → 1,200" },
    { sentence: "Sea lampreys are predators that attach to larger fish and feed on their blood.", note: "lamprey = predator, feeds on trout blood" },
    { sentence: "Overfishing also hurt the trout, so scientists need more evidence.", note: "overfishing too → need more evidence" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "The lake trout population fell from 800 to 90",
      because: "sea lampreys fed on the trout.",
      but: "the graph alone cannot show how much overfishing mattered.",
      so: "scientists compared the lamprey numbers with the trout numbers.",
    },
    {
      lesson: "B",
      kernel: "The sea lamprey is an invasive species",
      because: "it came from somewhere else and harms the lake where it now lives.",
      but: "lake trout are a native species that belongs in the lake.",
      so: "scientists track lamprey numbers to protect native fish.",
    },
    {
      lesson: "A",
      kernel: "Lake trout eat smaller fish in the food web",
      because: "they are predators that hunt for food.",
      but: "sea lampreys feed on the trout.",
      so: "the number of smaller fish can grow when the trout decline.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "The graph shows a decline.",
      parts: { when: "Between 1940 and 1955", what: "in the lake trout population", how: "from 800 to 90 fish" },
      model: "Between 1940 and 1955, the graph shows a decline in the lake trout population from 800 to 90 fish.",
    },
    {
      lesson: "D",
      kernel: "Sea lampreys attacked trout.",
      parts: { when: "After entering through the canal", where: "in Mirror Lake", why: "to feed on their blood" },
      model: "After entering through the canal, sea lampreys attacked trout in Mirror Lake to feed on their blood.",
    },
  ],
  fragments: [
    { text: "The lake trout population fell from 800 to 90.", is_sentence: true },
    { text: "Because sea lampreys are predators.", is_sentence: false, fix: "Trout decline because sea lampreys are predators." },
    { text: "An invasive species harms the place where it lives.", is_sentence: true },
    { text: "The graph that shows the number of trout.", is_sentence: false, fix: "The graph shows the number of trout in each year." },
    { text: "Overfishing also hurting the trout.", is_sentence: false, fix: "Overfishing also hurt the trout." },
    { text: "Sea lampreys rose from 0 to 1,200.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "The sea lamprey, ___, entered the lake through a canal.",
      noun: "sea lamprey",
      options: ["an invasive species with a round, toothy mouth", "a native fish that belongs in the lake", "a diagram of many food chains"],
      answer: 0,
      model: "The sea lamprey, an invasive species with a round, toothy mouth, entered the lake through a canal.",
    },
    {
      lesson: "A",
      sentence: "A food web, ___, shows who eats whom in a lake.",
      noun: "food web",
      options: ["a diagram of many food chains", "a graph of changing numbers over time", "a struggle for the same food"],
      answer: 0,
      model: "A food web, a diagram of many food chains, shows who eats whom in a lake.",
    },
    {
      lesson: "C",
      sentence: "Population, ___, can rise or fall over the years.",
      noun: "Population",
      options: ["all the living things of one kind in one place", "all the living things plus the air and water", "a kind of living thing that came from somewhere else"],
      answer: 0,
      model: "Population, all the living things of one kind in one place, can rise or fall over the years.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "as", stem: "the number of lake trout fell", model: "As the number of sea lampreys rose, the number of lake trout fell." },
    { lesson: "D", conjunction: "although", stem: "sea lampreys fed directly on the trout", model: "Although overfishing also hurt the trout, sea lampreys fed directly on them." },
    { lesson: "B", conjunction: "when", stem: "it can harm native fish", model: "When an invasive species enters a lake, it can harm native fish." },
  ],
  spo: {
    topic: {
      l1_2: "I think [sea lampreys] caused the trout to [decline].",
      l3_4: "I claim that [sea lampreys] caused the lake trout to decline because [they are predators and their numbers rose as the trout fell].",
      l5_6: "Although overfishing also hurt the trout, [the data show] that [sea lampreys] were a major cause of the decline, as shown by [the graph and the food web].",
    },
    starters: [
      { type: "question", text: "Did a small fish with a round, toothy mouth wipe out most of a lake's trout?" },
      { type: "appositive", text: "The sea lamprey, an invasive predator, rose from 0 to 1,200 while the trout fell." },
      { type: "subordinate", text: "Even though overfishing hurt the trout, the data point strongly to lampreys." },
    ],
    details: [
      { note: "trout 800 (1940) → 90 (1955)", lesson: "C" },
      { note: "lampreys 0 → 1,200 same years", lesson: "C" },
      { note: "lamprey = invasive predator", lesson: "B" },
      { note: "attaches to trout, feeds on blood", lesson: "D" },
      { note: "food web: lampreys eat trout", lesson: "A" },
      { note: "overfishing also hurt trout", lesson: "D" },
    ],
    distractors: ["Mirror Lake freezes in winter", "fishing boats are painted bright colors"],
    conclusion: {
      l1_2: "The [data] support my [claim].",
      l3_4: "Because the lamprey numbers rose as the trout fell, the data [support my claim] that [sea lampreys] harmed the trout.",
      l5_6: "Therefore, the claim that [lampreys harmed the trout] is [reasonable], although scientists should [keep measuring both populations].",
    },
  },
  prompt: {
    l1_2: "Draw the trout and the lamprey. Write 3-4 sentences about what happened to the trout. Use the words trout, lamprey, and graph.",
    l3_4: "Write a paragraph that argues whether sea lampreys caused the trout decline. Use your outline, a claim, and two numbers from the graph.",
    l5_6: "Write a paragraph that argues sea lampreys were a major cause of the decline, using evidence and reasoning, and that admits what overfishing adds. Include an appositive and a sentence that starts with although or as.",
  },
  transitions: ["I claim", "According to the data,", "As shown by", "For example,", "Because", "This proves that", "However,", "Therefore,"],
  model: {
    l1_2: "Mirror Lake had 800 trout in 1940. By 1955, it had only 90 trout. Sea lampreys went up. I think lampreys caused the decline.",
    l3_4: "I claim that sea lampreys caused the lake trout to decline. According to the graph, the trout fell from 800 in 1940 to 90 in 1955. During those years, the lampreys rose from 0 to 1,200. Sea lampreys are predators that feed on the blood of trout. Because their numbers rose as the trout fell, the data support my claim. Overfishing also hurt the trout, so scientists need more evidence.",
    l5_6: "Although overfishing also hurt the trout, sea lampreys were a major cause of the decline in Mirror Lake. According to the graph, the lake trout fell from 800 in 1940 to 90 in 1955. During the same years, the sea lamprey, an invasive predator, rose from 0 to 1,200. As shown by the food web, lampreys attach to trout and feed on their blood. Because the two lines move in opposite directions, the data show a strong link between the two populations. This evidence does not rule out overfishing, so scientists should keep measuring both. Therefore, the claim that lampreys harmed the trout is reasonable.",
  },
  mpo: {
    thesis: "Sea lampreys were a major cause of the lake trout decline in Mirror Lake, as shown by the graph and the food web, although overfishing also mattered.",
    paragraphs: [
      { topic: "The population graph shows two opposite trends.", notes: ["trout 800 → 90", "lampreys 0 → 1,200", "1940 to 1955"] },
      { topic: "The food web explains how lampreys hurt the trout.", notes: ["lamprey = predator", "attaches to trout", "feeds on blood"] },
      { topic: "Other causes need more evidence.", notes: ["overfishing hurt trout", "need more data", "compare years and catch numbers"] },
    ],
    conclusion: "Because the graph and the food web point to the same cause, sea lampreys are the strongest explanation, and more data can show how much overfishing added.",
  },
  revise: [
    "Did I state a claim that answers the question about what caused the decline?",
    "Did I include real numbers, such as 800 to 90 and 0 to 1,200, as evidence?",
    "Did I explain how the evidence proves the claim, not just list it?",
    "Did I use ecosystem words, such as predator, invasive species and food web, correctly?",
  ],
};
