// BCPSS Writing Lab (TWR) — g6-math-u2 · Ratios & Rates. Contract: ../writing-schema.mjs

export default {
  title: "Mixing Mural Paint with Ratios",
  genre: "explain",
  tip: "Ask students to point to the 'for every' words in their notes before they build the ratio table.",
  lessons: [
    { id: "A", title: "Writing ratios and using ratio language" },
    { id: "B", title: "Equivalent ratios in tables" },
    { id: "C", title: "Unit rates and best buys" },
    { id: "D", title: "Percent as a rate per 100" },
  ],
  source: {
    title: "Green Paint on North Avenue",
    lesson: "B",
    text: "Zoe and Marcus are painting a mural on a wall near North Avenue. Their green paint uses 2 cans of blue for every 3 cans of yellow. The ratio of blue to yellow is 2 to 3. They build a ratio table to make more paint. When they use 4 cans of blue, they need 6 cans of yellow because they doubled both numbers. When they use 6 cans of blue, they need 9 cans of yellow because they tripled both numbers. Every row in the table is an equivalent ratio, so the green stays the same shade. The yellow paint costs 30 dollars for 5 cans, so the unit rate is 6 dollars per can.",
  },
  notes: [
    { sentence: "Their green paint uses 2 cans of blue for every 3 cans of yellow.", note: "green = 2 blue : 3 yellow" },
    { sentence: "When they use 4 cans of blue, they need 6 cans of yellow because they doubled both numbers.", note: "4 blue : 6 yellow b/c × 2 both" },
    { sentence: "Every row in the table is an equivalent ratio, so the green stays the same shade.", note: "all rows equivalent → same shade" },
    { sentence: "The yellow paint costs 30 dollars for 5 cans, so the unit rate is 6 dollars per can.", note: "30 ÷ 5 = $6 per can" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Zoe and Marcus mix 4 cans of blue paint",
      because: "they doubled both numbers in the ratio 2 to 3.",
      but: "using 4 cans of yellow instead would change the shade of green.",
      so: "they need 6 cans of yellow for the same green.",
    },
    {
      lesson: "C",
      kernel: "Store B has the better price for water bottles",
      because: "each bottle costs 1.50 dollars, which is less than 2 dollars.",
      but: "its total price of 9 dollars is higher than Store A's total of 8 dollars.",
      so: "we should compare unit rates, not total prices.",
    },
    {
      lesson: "A",
      kernel: "The ratio of blue cans to yellow cans is 2 to 3",
      because: "there are 2 cans of blue for every 3 cans of yellow.",
      but: "the ratio of yellow cans to blue cans is 3 to 2.",
      so: "the order of the numbers must match the order of the words.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Marcus doubled the ratio.",
      parts: { when: "On Saturday", how: "by multiplying both numbers by 2", why: "to make enough green paint" },
      model: "On Saturday, Marcus doubled the ratio by multiplying both numbers by 2 to make enough green paint.",
    },
    {
      lesson: "D",
      kernel: "The team won.",
      parts: { when: "This season", what: "8 of its 10 games", where: "at Patterson Park" },
      model: "This season, the team won 8 of its 10 games at Patterson Park, which is 80 percent.",
    },
  ],
  fragments: [
    { text: "The ratio of blue to yellow is 2 to 3.", is_sentence: true },
    { text: "For every 3 cans of yellow paint.", is_sentence: false, fix: "The mural uses 2 cans of blue paint for every 3 cans of yellow paint." },
    { text: "A unit rate tells the amount for exactly 1 of something.", is_sentence: true },
    { text: "Doubled both numbers in the ratio.", is_sentence: false, fix: "Marcus doubled both numbers in the ratio." },
    { text: "Because the unit rate is lower at Store B.", is_sentence: false, fix: "Store B is the better buy because its unit rate is lower." },
    { text: "A percent compares a number to 100.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A ratio, ___, can be written as 2 to 3 or 2:3.",
      noun: "ratio",
      options: ["a comparison of two amounts", "a table of equal prices", "the cost of exactly one item"],
      answer: 0,
      model: "A ratio, a comparison of two amounts, can be written as 2 to 3 or 2:3.",
    },
    {
      lesson: "C",
      sentence: "A unit rate, ___, makes it easy to compare prices.",
      noun: "unit rate",
      options: ["the amount for exactly 1 of something", "a pair of numbers you multiply by 2", "a part out of 100"],
      answer: 0,
      model: "A unit rate, the amount for exactly 1 of something, makes it easy to compare prices.",
    },
    {
      lesson: "B",
      sentence: "Marcus built a ratio table, ___, to plan the green paint.",
      noun: "ratio table",
      options: ["a chart of equivalent ratios", "a ruler marked in cans", "a list of store prices"],
      answer: 0,
      model: "Marcus built a ratio table, a chart of equivalent ratios, to plan the green paint.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "the ratio of blue to yellow is written 2 to 3", model: "When the recipe lists blue first, the ratio of blue to yellow is written 2 to 3." },
    { lesson: "C", conjunction: "because", stem: "Store B is the better buy", model: "Because its unit rate is 1.50 dollars per bottle, Store B is the better buy." },
    { lesson: "B", conjunction: "if", stem: "she needs 12 cans of yellow paint", model: "If Zoe uses 8 cans of blue paint, she needs 12 cans of yellow paint." },
  ],
  spo: {
    topic: {
      l1_2: "Zoe and Marcus use a ratio table to make more [green paint].",
      l3_4: "Zoe and Marcus use a [ratio table] to make more green paint with the same [ratio of 2 to 3].",
      l5_6: "Although the wall needs far more paint, Zoe and Marcus [keep the green the same] by [multiplying both numbers in the ratio by the same factor].",
    },
    starters: [
      { type: "question", text: "How can two painters make a bigger batch of green without changing the shade?" },
      { type: "appositive", text: "Zoe and Marcus, two painters on North Avenue, use a ratio table to keep their green the same." },
      { type: "command", text: "Picture a ratio table where every row mixes the same shade of green." },
    ],
    details: [
      { note: "green = 2 blue : 3 yellow", lesson: "A" },
      { note: "4 blue : 6 yellow, × 2", lesson: "B" },
      { note: "6 blue : 9 yellow, × 3", lesson: "B" },
      { note: "all rows equivalent ratios", lesson: "B" },
      { note: "same shade of green", lesson: "B" },
      { note: "30 dollars ÷ 5 cans = 6 per can", lesson: "C" },
    ],
    distractors: ["the mural wall is near North Avenue", "Marcus likes red paint best"],
    conclusion: {
      l1_2: "The [ratio] stays the [same].",
      l3_4: "Because both numbers are multiplied by the same [factor], every row is an [equivalent ratio] and the green stays the same.",
      l5_6: "A ratio table lets painters [scale a recipe] without [guessing or changing the shade].",
    },
  },
  prompt: {
    l1_2: "Draw the green paint cans. Write 3-4 sentences about how Zoe and Marcus make more paint. Use the words ratio, blue, and yellow.",
    l3_4: "Write a paragraph that explains how Zoe and Marcus use a ratio table to make more green paint. Use your outline, because, and so.",
    l5_6: "Write a paragraph that explains how a ratio table keeps the green the same as the batch grows, and how a unit rate helps compare paint prices. Include an appositive and a sentence that starts with when or although.",
  },
  transitions: ["First,", "Next,", "Then,", "Because", "So", "As a result,", "For example,", "Finally,"],
  model: {
    l1_2: "Zoe and Marcus use 2 cans of blue for every 3 cans of yellow. They make a ratio table. They double both numbers. Now they use 4 cans of blue and 6 cans of yellow.",
    l3_4: "Zoe and Marcus use a ratio table to make more green paint with the same ratio of 2 to 3. First, they write 2 cans of blue for every 3 cans of yellow. Next, they multiply both numbers by 2, so 4 cans of blue go with 6 cans of yellow. Then they multiply both numbers by 3, so 6 cans of blue go with 9 cans of yellow. Every row is an equivalent ratio because both numbers are multiplied by the same factor. Because the ratio stays the same, the green keeps the same shade.",
    l5_6: "Although the mural wall needs far more paint, Zoe and Marcus keep the green the same by multiplying both numbers in the ratio by the same factor. Their recipe, 2 cans of blue for every 3 cans of yellow, is the first row of a ratio table. When they multiply by 2, the next row shows 4 cans of blue and 6 cans of yellow. When they multiply by 3, the row shows 6 cans of blue and 9 cans of yellow. Every row is an equivalent ratio because both numbers change by the same factor. As a result, the shade of green never changes. The yellow paint, which costs 30 dollars for 5 cans, has a unit rate of 6 dollars per can. A ratio table lets painters scale a recipe without guessing.",
  },
  mpo: {
    thesis: "Ratio tables let painters scale a recipe up and keep the green the same, and unit rates tell them which paint is the better buy.",
    paragraphs: [
      { topic: "Equivalent ratios keep the shade the same when the batch gets bigger.", notes: ["2 blue : 3 yellow", "× 2 → 4 blue : 6 yellow", "× 3 → 6 blue : 9 yellow"] },
      { topic: "Unit rates compare prices fairly when the totals are different.", notes: ["yellow: 30 ÷ 5 = 6 per can", "Store A: 8 ÷ 4 = 2 per bottle", "Store B: 9 ÷ 6 = 1.50 per bottle"] },
    ],
    conclusion: "Ratio tables and unit rates help us make fair choices because they compare amounts that grow or that cost different totals.",
  },
  revise: [
    "Did I write the ratio in the same order as the words, blue to yellow?",
    "Did I show what number I multiplied both parts of the ratio by?",
    "Did I explain why the new row is an equivalent ratio, not just give the numbers?",
    "Did I include units, such as cans or dollars per can?",
  ],
};
