// BCPSS Writing Lab (TWR) — g8-sci-u2 · Why Do Organisms Look the Way They Do? Contract: ../writing-schema.mjs

export default {
  title: "Hidden Traits in the Garden",
  genre: "argue",
  tip: "Have students draw the Punnett square first, then write the claim and cite one box or one count as evidence.",
  lessons: [
    { id: "A", title: "DNA, genes, and alleles" },
    { id: "B", title: "Dominant and recessive traits" },
    { id: "C", title: "Punnett squares and probability" },
    { id: "D", title: "Mutations and variation" },
  ],
  source: {
    title: "Tall Plants, Short Plants",
    lesson: "A",
    text: "In a school garden in Baltimore, students plant pea seeds from two tall plants. A gene is a section of DNA that holds instructions for a trait such as height, and an allele is one version of that gene. Tall is dominant, so the allele T shows up even with one copy. Short is recessive, so a plant needs two copies of the allele t to be short. Each tall parent carries one T and one t, so each parent's genotype is Tt. The Punnett square predicts that three out of four offspring will be tall. When the seeds grow, 12 plants are tall and 4 are short. Sometimes a mutation, or a change in DNA, adds a brand-new version of a gene.",
  },
  notes: [
    { sentence: "Tall is dominant, so the allele T shows up even with one copy.", note: "T = dominant, shows w/ 1 copy" },
    { sentence: "Short is recessive, so a plant needs two copies of the allele t to be short.", note: "t = recessive, needs 2 copies" },
    { sentence: "Each tall parent carries one T and one t, so each parent's genotype is Tt.", note: "parents = Tt × Tt" },
    { sentence: "The Punnett square predicts that three out of four offspring will be tall.", note: "Punnett: 3/4 tall, 1/4 short" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "A short pea plant needs two copies of the t allele",
      because: "the short trait is recessive.",
      but: "a tall plant can have just one copy of the T allele.",
      so: "short plants appear less often than tall plants.",
    },
    {
      lesson: "C",
      kernel: "Two tall parents can have a short offspring",
      because: "each parent can carry a hidden t allele.",
      but: "most of their offspring will still be tall.",
      so: "the short trait seems to skip a generation.",
    },
    {
      lesson: "D",
      kernel: "A mutation changes a gene",
      because: "a letter in the DNA sequence changes.",
      but: "not every mutation changes how the organism looks.",
      so: "a mutation can add new variation to a population.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "The students crossed two plants.",
      parts: { when: "in the spring", where: "in the school garden", why: "to see which traits appear" },
      model: "In the spring, the students crossed two plants in the school garden to see which traits appear.",
    },
    {
      lesson: "A",
      kernel: "a gene holds instructions",
      parts: { where: "inside every cell", what: "for a trait such as height", why: "because DNA carries the plant's code" },
      model: "Inside every cell, a gene holds instructions for a trait such as height because DNA carries the plant's code.",
    },
  ],
  fragments: [
    { text: "An allele is one version of a gene.", is_sentence: true },
    { text: "Although the parents are both tall.", is_sentence: false, fix: "Although the parents are both tall, one offspring is short." },
    { text: "The recessive trait shows only with two copies.", is_sentence: true },
    { text: "Because each parent carries a hidden t allele.", is_sentence: false, fix: "A short plant appears because each parent carries a hidden t allele." },
    { text: "Predicts three tall plants for every short plant.", is_sentence: false, fix: "The Punnett square predicts three tall plants for every short plant." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A gene, ___, holds the instructions for one trait.",
      noun: "gene",
      options: ["a section of DNA", "a change in the DNA sequence", "a grid that predicts offspring"],
      answer: 0,
      model: "A gene, a section of DNA, holds the instructions for one trait.",
    },
    {
      lesson: "B",
      sentence: "A recessive allele, ___, can hide in a tall parent.",
      noun: "recessive allele",
      options: ["an allele whose trait shows even with one copy", "an allele whose trait shows only when two copies are present", "the pair of alleles an organism carries"],
      answer: 1,
      model: "A recessive allele, an allele whose trait shows only when two copies are present, can hide in a tall parent.",
    },
    {
      lesson: "C",
      sentence: "A Punnett square, ___, predicts the chances for offspring.",
      noun: "Punnett square",
      options: ["a change in the DNA sequence", "the traits you can observe in an organism", "a grid that shows the possible pairs of alleles"],
      answer: 2,
      model: "A Punnett square, a grid that shows the possible pairs of alleles, predicts the chances for offspring.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "because", stem: "about three out of four offspring are likely to be tall", model: "Because each parent is Tt, about three out of four offspring are likely to be tall." },
    { lesson: "B", conjunction: "although", stem: "one offspring can be short", model: "Although both parents are tall, one offspring can be short." },
    { lesson: "D", conjunction: "when", stem: "the organism may gain a new trait", model: "When a mutation changes a gene, the organism may gain a new trait." },
  ],
  spo: {
    topic: {
      l1_2: "Two tall parents can have a [short] plant if both carry a hidden [allele].",
      l3_4: "I claim that [both tall parents are Tt] because [a short plant appeared in their offspring].",
      l5_6: "As shown by [the 12 tall and 4 short offspring], I claim that [both tall parents carry one hidden recessive allele], because [a short plant needs two copies of t].",
    },
    starters: [
      { type: "question", text: "How can two tall plants make a short one?" },
      { type: "appositive", text: "Tall, the dominant trait, can hide the short trait for a generation." },
      { type: "subordinate", text: "Although the parents look the same, their offspring show hidden traits." },
    ],
    details: [
      { note: "gene = DNA instructions for trait", lesson: "A" },
      { note: "T dominant, t recessive", lesson: "B" },
      { note: "short plant needs tt", lesson: "B" },
      { note: "parents Tt × Tt", lesson: "C" },
      { note: "12 tall, 4 short offspring", lesson: "C" },
      { note: "mutation = new version of gene", lesson: "D" },
    ],
    distractors: ["pea seeds grow inside pods", "the garden fence gets sun all day"],
    conclusion: {
      l1_2: "So each parent has a [hidden] [t allele].",
      l3_4: "Therefore, the evidence supports my claim that [both parents are Tt].",
      l5_6: "Because [the data match the prediction], the claim that [both parents carry a hidden allele] is well supported.",
    },
  },
  prompt: {
    l1_2: "Look at the 12 tall plants and 4 short plants. Write 3 sentences. Tell what the parents carry.",
    l3_4: "Write an argument about the genotype of the two tall parents. Use I claim, because, and evidence from the numbers.",
    l5_6: "Write a paragraph that argues what the parents' genotypes must be and uses the Punnett square and the counts as evidence. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["I claim that", "According to", "As shown by", "Because", "This means", "Although", "Therefore,", "In conclusion,"],
  model: {
    l1_2: "The parents are tall. A short plant grew. So each parent has a hidden t allele.",
    l3_4: "I claim that both tall parents are Tt because a short plant grew in their offspring. A short plant needs two copies of the recessive allele t. One copy had to come from each parent. According to the Punnett square, three out of four offspring should be tall. This matches the garden data of 12 tall plants and 4 short plants. Therefore, the evidence supports my claim.",
    l5_6: "As shown by the 12 tall and 4 short offspring, both tall parents must carry one hidden recessive allele. Tall, the dominant trait, shows up when a plant has at least one T allele. Although both parents look tall, a short plant appeared, and a short plant needs two copies of t. That means each parent passed on a t allele, so each parent's genotype is Tt. According to the Punnett square, three out of four offspring should be tall, and 12 out of 16 is exactly three fourths. Because the data match the prediction, the claim is well supported. A mutation could also create a new trait, but it cannot explain a pattern this regular.",
  },
  mpo: {
    thesis: "Two tall pea plants can have short offspring because tall is dominant, short is recessive, and both parents carry a hidden t allele.",
    paragraphs: [
      { topic: "Genes and alleles explain how a trait can be hidden.", notes: ["gene = DNA instructions", "alleles = versions of gene", "T dominant, t recessive"] },
      { topic: "The Punnett square predicts the pattern in the offspring.", notes: ["Tt × Tt", "3/4 tall, 1/4 short", "12 of 16 = 3/4"] },
      { topic: "Mutations are not a good explanation for this regular pattern.", notes: ["mutation = DNA change", "adds new variation", "pattern too regular"] },
    ],
    conclusion: "The counts, the Punnett square, and the rules of dominant and recessive alleles all point to the same conclusion about the parents.",
  },
  revise: [
    "Did I state a claim about the parents' alleles at the start?",
    "Did I use evidence, such as 12 tall and 4 short or the Punnett square?",
    "Did I use dominant, recessive, allele, and genotype correctly?",
    "Did I explain how the evidence proves the claim and not just repeat it?",
  ],
};
