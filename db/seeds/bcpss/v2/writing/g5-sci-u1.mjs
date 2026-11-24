// BCPSS Writing Lab (TWR) — g5-sci-u1 · Structure, Properties & Conservation of Matter. Contract: ../writing-schema.mjs

export default {
  title: "Does Matter Disappear?",
  genre: "argue",
  tip: "Have students write the claim first, then point to the exact mass numbers on the data table before they write the evidence.",
  lessons: [
    { id: "A", title: "Matter is made of tiny particles" },
    { id: "B", title: "Measuring mass and properties of materials" },
    { id: "C", title: "Mixing and dissolving" },
    { id: "D", title: "Conservation of mass in melting and mixing" },
  ],
  source: {
    title: "Sugar in the Cup",
    lesson: "C",
    text: "Tyrell wants to know if sugar disappears when it dissolves. He measures 50 grams of water and 10 grams of sugar. Together, they have a mass of 60 grams. Then he stirs the sugar into the water until it dissolves. After stirring, the mass is still 60 grams. The sugar looks gone, but its particles are still in the water. According to his data, nothing was lost. Tyrell claims that matter is conserved, because the mass is the same before and after.",
  },
  notes: [
    { sentence: "Together, they have a mass of 60 grams.", note: "water + sugar = 60 g" },
    { sentence: "After stirring, the mass is still 60 grams.", note: "after stirring: still 60 g" },
    { sentence: "The sugar looks gone, but its particles are still in the water.", note: "sugar looks gone; particles still there" },
    { sentence: "Tyrell claims that matter is conserved, because the mass is the same before and after.", note: "claim: conserved b/c same mass" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The sugar seems to disappear in the water",
      because: "its particles are too small to see.",
      but: "the particles are still in the cup.",
      so: "the mass stays the same after stirring.",
    },
    {
      lesson: "C",
      kernel: "Salt dissolves in water",
      because: "its particles spread out between the water particles.",
      but: "the salt is not gone.",
      so: "we can get the salt back when the water evaporates.",
    },
    {
      lesson: "D",
      kernel: "The mass stays the same when ice melts",
      because: "no particles leave the cup.",
      but: "the ice changes from a solid to a liquid.",
      so: "we can claim that matter is conserved.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Tyrell measured the mass.",
      parts: { when: "before stirring", how: "with a digital scale", why: "to collect evidence" },
      model: "Before stirring, Tyrell measured the mass with a digital scale to collect evidence.",
    },
    {
      lesson: "D",
      kernel: "The mass stayed the same.",
      parts: { when: "after the ice melted", where: "in the cup", why: "because no particles left" },
      model: "After the ice melted, the mass stayed the same in the cup because no particles left.",
    },
  ],
  fragments: [
    { text: "Matter is anything that takes up space and has mass.", is_sentence: true },
    { text: "Because the mass was the same.", is_sentence: false, fix: "Tyrell claims matter is conserved because the mass was the same." },
    { text: "The sugar dissolved in the water.", is_sentence: true },
    { text: "According to his data.", is_sentence: false, fix: "According to his data, nothing was lost." },
    { text: "Evaporates from the dish and leaves the salt.", is_sentence: false, fix: "The water evaporates from the dish and leaves the salt." },
    { text: "When ice melts into water.", is_sentence: false, fix: "The mass stays the same when ice melts into water." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A particle, ___, makes up every kind of matter.",
      noun: "particle",
      options: ["a tiny piece of matter", "the amount of matter in an object", "two substances put together without making a new one"],
      answer: 0,
      model: "A particle, a tiny piece of matter, makes up every kind of matter.",
    },
    {
      lesson: "C",
      sentence: "A mixture, ___, can be separated again.",
      noun: "mixture",
      options: ["to change from a liquid into a gas", "two or more substances put together without making a new substance", "one kind of material with its own properties"],
      answer: 1,
      model: "A mixture, two or more substances put together without making a new substance, can be separated again.",
    },
    {
      lesson: "D",
      sentence: "Mass, ___, is measured in grams.",
      noun: "Mass",
      options: ["a tiny piece of matter too small to see", "anything that takes up space", "the amount of matter in an object"],
      answer: 2,
      model: "Mass, the amount of matter in an object, is measured in grams.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "although", stem: "its particles are still in the water", model: "Although the sugar looks gone, its particles are still in the water." },
    { lesson: "C", conjunction: "when", stem: "the sugar dissolves", model: "When Tyrell stirs the sugar into the water, the sugar dissolves." },
    { lesson: "D", conjunction: "because", stem: "matter is conserved", model: "Because the mass is the same before and after, matter is conserved." },
  ],
  spo: {
    topic: {
      l1_2: "My claim is that [matter was conserved].",
      l3_4: "My claim is that [matter was conserved] because the mass was [60] grams before and [60] grams after.",
      l5_6: "Although [the sugar looks gone after it dissolves], my claim is that [matter was conserved], as shown by [the mass of 60 grams before and after].",
    },
    starters: [
      { type: "statement", text: "Matter does not disappear when sugar dissolves in water." },
      { type: "question", text: "How can a scale prove that matter is not lost?" },
      { type: "subordinate", text: "Although the sugar cannot be seen, it is still in the cup." },
    ],
    details: [
      { note: "test: does sugar disappear? use a scale", lesson: "B" },
      { note: "before: 50 g water + 10 g sugar", lesson: "B" },
      { note: "stir until sugar dissolves", lesson: "C" },
      { note: "after: mass still 60 g", lesson: "D" },
      { note: "sugar looks gone; particles still there", lesson: "A" },
      { note: "same mass → matter conserved", lesson: "D" },
    ],
    distractors: ["sugar is made from sugarcane", "tea tastes sweeter with more sugar"],
    conclusion: {
      l1_2: "The mass stayed [60] grams, so matter is [conserved].",
      l3_4: "This proves matter was conserved because the [particles] never left the [cup].",
      l5_6: "Therefore, [matter was conserved], because [the particles stayed in the cup] and the mass did not change.",
    },
  },
  prompt: {
    l1_2: "Draw the cup before and after stirring. Write 2-4 sentences. Make a claim and give one number from the scale.",
    l3_4: "Write a paragraph that makes a claim about whether sugar disappears when it dissolves. Use your outline, because, and according to.",
    l5_6: "Write a paragraph that claims whether matter is conserved when sugar dissolves and proves it with mass data. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["My claim is", "According to", "As shown by", "Because", "For example,", "This proves", "However,", "Therefore,"],
  model: {
    l1_2: "Tyrell stirred sugar into water. The mass was 60 grams before and 60 grams after. Matter was conserved.",
    l3_4: "My claim is that matter was conserved when Tyrell dissolved sugar in water. I know this because the mass was 60 grams before stirring and 60 grams after. According to his data, the sugar dissolved, but its particles are still in the cup. The sugar only looks gone because the particles are too small to see. This proves that matter did not disappear.",
    l5_6: "Although the sugar looks gone after it dissolves, my claim is that matter was conserved. Tyrell measured 50 grams of water and 10 grams of sugar, which together have a mass of 60 grams. After he stirred, the mass was still 60 grams, as shown by the scale. According to his data, nothing was lost. The sugar, a substance made of tiny particles, spread out in the water, but its particles stayed in the cup. Therefore, the mass stayed the same because the matter was only mixed, not destroyed.",
  },
  mpo: {
    thesis: "Matter is conserved when substances dissolve, melt, or mix, because the particles stay and the mass stays the same.",
    paragraphs: [
      { topic: "Dissolving does not make matter disappear.", notes: ["sugar looks gone", "particles still there", "50 g water + 10 g sugar = 60 g"] },
      { topic: "Melting also keeps the mass the same.", notes: ["ice → water, same particles", "mass stays the same", "no particles leave the cup"] },
      { topic: "Evaporation shows the matter is still there.", notes: ["salt water evaporates", "salt crust left behind"] },
    ],
    conclusion: "Dissolving, melting, and mixing change how matter looks, but mass measurements prove that no matter is lost.",
  },
  revise: [
    "Did I state a clear claim before I gave any evidence?",
    "Did I use mass numbers from the data, with the unit grams?",
    "Did I explain how the evidence proves the claim with because or according to?",
    "Did I mention that the particles are still there even when the sugar looks gone?",
  ],
};
