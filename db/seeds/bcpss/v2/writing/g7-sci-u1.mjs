// BCPSS Writing Lab (TWR) — g7-sci-u1 · How Can I Make New Stuff from Old Stuff? Contract: ../writing-schema.mjs

export default {
  title: "Proof of a New Substance",
  genre: "argue",
  tip: "Ask students to point to one changed property and one measurement before they write the word reaction, so the claim rests on evidence.",
  lessons: [
    { id: "A", title: "Properties that identify a substance" },
    { id: "B", title: "Evidence that a new substance formed" },
    { id: "C", title: "Making soap from fat and lye" },
    { id: "D", title: "Conservation of mass in a closed container" },
  ],
  source: {
    title: "Tariq's Sealed Jar",
    lesson: "C",
    text: "Tariq mixes fat and lye solution in a sealed jar. Before mixing, the jar and its contents have a mass of 240 grams. The mixture warms up and slowly thickens. After a week, the jar still has a mass of 240 grams. The fat did not dissolve in water, but the new material does, and it lifts away grease. These changes show that a new substance formed. Because the jar was sealed, no matter could escape. According to the scale, the mass stayed the same, so the atoms only rearranged.",
  },
  notes: [
    { sentence: "Before mixing, the jar and its contents have a mass of 240 grams.", note: "jar + contents = 240 g before" },
    { sentence: "The mixture warms up and slowly thickens.", note: "mixture warms + thickens" },
    { sentence: "The fat did not dissolve in water, but the new material does, and it lifts away grease.", note: "fat ≠ dissolve; new material dissolves + cleans" },
    { sentence: "According to the scale, the mass stayed the same, so the atoms only rearranged.", note: "scale: same mass → atoms rearranged" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Tariq knows a new substance formed",
      because: "the new material dissolves in water and the fat did not.",
      but: "the mass of the jar did not change.",
      so: "he can claim that a chemical reaction happened.",
    },
    {
      lesson: "D",
      kernel: "The mass stayed at 240 grams",
      because: "the jar was sealed, so no matter escaped.",
      but: "the fat and lye turned into different materials.",
      so: "the atoms must have only rearranged.",
    },
    {
      lesson: "B",
      kernel: "The mixture warmed up and thickened",
      because: "the fat and lye were reacting.",
      but: "warming alone does not prove that a new substance formed.",
      so: "he looked for another property that changed.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "The scale showed 240 grams.",
      parts: { when: "after a week", where: "in the science lab", why: "because the jar stayed sealed" },
      model: "After a week, the scale showed 240 grams in the science lab because the jar stayed sealed.",
    },
    {
      lesson: "A",
      kernel: "Tariq measured density.",
      parts: { when: "before the reaction", how: "with a scale and a cylinder", why: "to learn a property of the fat" },
      model: "Before the reaction, Tariq measured density with a scale and a cylinder to learn a property of the fat.",
    },
  ],
  fragments: [
    { text: "A reactant is a starting material in a reaction.", is_sentence: true },
    { text: "Because the new material dissolves in water.", is_sentence: false, fix: "A new substance formed because the new material dissolves in water." },
    { text: "Mixed the fat and lye in a sealed jar.", is_sentence: false, fix: "Tariq mixed the fat and lye in a sealed jar." },
    { text: "The total mass stays the same in a closed container.", is_sentence: true },
    { text: "Although the mixture looked different.", is_sentence: false, fix: "Although the mixture looked different, the mass was the same." },
    { text: "Soap and glycerol are the products of the reaction.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "C",
      sentence: "Lye, ___, reacts with fat to make soap.",
      noun: "Lye",
      options: ["a strong chemical called sodium hydroxide", "a gas that floats into the air", "a tiny particle that all matter is built from"],
      answer: 0,
      model: "Lye, a strong chemical called sodium hydroxide, reacts with fat to make soap.",
    },
    {
      lesson: "B",
      sentence: "Fat, ___, is one reactant in soap making.",
      noun: "Fat",
      options: ["a new material that forms at the end", "a starting material that is changed in the reaction", "the rule that mass stays the same"],
      answer: 1,
      model: "Fat, a starting material that is changed in the reaction, is one reactant in soap making.",
    },
    {
      lesson: "D",
      sentence: "Conservation of mass, ___, explains why the jar weighed 240 grams at the end.",
      noun: "Conservation of mass",
      options: ["how much mass is packed into a space", "a new material that forms in a reaction", "the rule that total mass stays the same in a closed container"],
      answer: 2,
      model: "Conservation of mass, the rule that total mass stays the same in a closed container, explains why the jar weighed 240 grams at the end.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "because", stem: "no matter could escape", model: "Because the jar was sealed, no matter could escape." },
    { lesson: "B", conjunction: "although", stem: "that change alone does not prove a reaction", model: "Although the mixture warmed up, that change alone does not prove a reaction." },
    { lesson: "C", conjunction: "when", stem: "a new substance forms", model: "When fat and lye react, a new substance forms." },
  ],
  spo: {
    topic: {
      l1_2: "A [new substance] formed because the [properties] changed.",
      l3_4: "According to [the evidence], a new substance formed because [the new material dissolves in water], and the mass stayed the same since [the jar was sealed].",
      l5_6: "According to [Tariq's data], a chemical reaction made [soap], because [the properties changed] while [the mass stayed at 240 grams], as shown by [the scale readings].",
    },
    starters: [
      { type: "question", text: "How can you prove a new substance exists when the scale says nothing changed?" },
      { type: "statement", text: "A chemical reaction changes the properties of materials, but not their total mass." },
      { type: "appositive", text: "Tariq, a student who made soap in a sealed jar, uses a scale and his observations as evidence." },
    ],
    details: [
      { note: "fat + lye react in sealed jar", lesson: "C" },
      { note: "mixture warms + thickens", lesson: "B" },
      { note: "fat ≠ dissolve; new material dissolves", lesson: "A" },
      { note: "new material lifts away grease", lesson: "A" },
      { note: "mass = 240 g before and after", lesson: "D" },
      { note: "atoms rearrange; mass conserved", lesson: "D" },
    ],
    distractors: ["the jar is made of glass", "soap makers worked for thousands of years"],
    conclusion: {
      l1_2: "So a [reaction] made a [new substance].",
      l3_4: "Therefore, the evidence shows that a [chemical reaction] happened and the [atoms] only rearranged.",
      l5_6: "Because [the properties changed] and [the mass stayed the same], the evidence supports [a reaction in which atoms rearranged] without any matter lost.",
    },
  },
  prompt: {
    l1_2: "Look at the jar. Write 3 sentences. Tell if a new substance formed. Use the word because.",
    l3_4: "Write a paragraph that claims a chemical reaction made soap in the sealed jar. Use evidence from the properties and the mass, and use because and according to.",
    l5_6: "Write a paragraph that claims a new substance formed even though the mass did not change. Support it with evidence and reasoning. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["According to", "As shown by", "For example,", "Because", "Since", "However,", "This evidence shows that", "Therefore,"],
  model: {
    l1_2: "The new material dissolves in water, but the fat did not. So a new substance formed. The mass stayed the same.",
    l3_4: "According to the evidence, a new substance formed because the new material dissolves in water and the fat did not. First, Tariq mixed fat and lye in a sealed jar. The mixture warmed up and thickened. The new material also lifts away grease, which is another new property. The mass stayed at 240 grams since the jar was sealed, so no matter escaped. Therefore, a chemical reaction happened and the atoms only rearranged.",
    l5_6: "According to Tariq's data, a chemical reaction made soap, because the properties changed while the total mass stayed the same. Tariq, a student who mixed fat and lye in a sealed jar, saw the mixture warm up and thicken. Although warming alone does not prove a reaction, the new material also dissolves in water and lifts away grease, but the fat did not. These new properties show that a new substance formed. As shown by the scale, the jar had a mass of 240 grams before and after. Because the jar was sealed, no matter could escape, so the atoms only rearranged. Therefore, the evidence supports a reaction with conservation of mass.",
  },
  mpo: {
    thesis: "A chemical reaction made a new substance in Tariq's sealed jar, because its properties changed while its total mass stayed the same.",
    paragraphs: [
      { topic: "The changed properties are evidence that a new substance formed.", notes: ["fat does not dissolve", "new material dissolves", "lifts away grease", "mixture warms + thickens"] },
      { topic: "The unchanged mass is evidence that no matter was lost in the sealed jar.", notes: ["240 g before and after", "sealed → no matter escapes", "conservation of mass"] },
      { topic: "Atoms only rearranged, which explains both the new substance and the same mass.", notes: ["reactants: fat + lye", "products: soap + glycerol", "atoms rearrange"] },
    ],
    conclusion: "The evidence shows that making a new substance and keeping the same mass can both be true in a closed system.",
  },
  revise: [
    "Did I make a clear claim about whether a new substance formed?",
    "Did I support it with at least one property that changed and one mass measurement?",
    "Did I explain why the mass stayed the same, using the sealed jar and the atoms?",
    "Did I use according to, as shown by, or because to connect my evidence to my claim?",
  ],
};
