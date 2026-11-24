// BCPSS Writing Lab (TWR) — g8-ss-u4 · Reconstruction & The Unfinished Promise of Equality. Contract: ../writing-schema.mjs

export default {
  title: "Did Reconstruction Keep Its Promise?",
  genre: "argue",
  tip: "Have students sort their evidence into promise kept and promise broken columns, then choose a claim that the most evidence supports.",
  lessons: [
    { id: "A", title: "The 13th, 14th, and 15th Amendments" },
    { id: "B", title: "Freedpeople, the Freedmen's Bureau, and Black leaders" },
    { id: "C", title: "Black Codes and the end of Reconstruction" },
    { id: "D", title: "Isaac Myers and Baltimore's Black-owned shipyard" },
  ],
  source: {
    title: "A Promise and Its Limits",
    lesson: "A",
    text: "After the Civil War, the nation entered Reconstruction, a time of rebuilding from 1865 to 1877. The 13th Amendment ended slavery, the 14th Amendment made citizens of everyone born or naturalized in the United States, and the 15th Amendment said no one could be denied the vote because of race. Black leaders gained real power. For example, Hiram Revels became the first Black member of the Senate in 1870. In Baltimore, Isaac Myers organized Black workers to buy their own shipyard in 1866. However, Southern states passed Black Codes that limited the rights of freedpeople. Later, Jim Crow laws separated people by race, so the promise of equality remained unfinished.",
  },
  notes: [
    { sentence: "The 13th Amendment ended slavery, the 14th Amendment made citizens of everyone born or naturalized in the United States, and the 15th Amendment said no one could be denied the vote because of race.", note: "13th ends slavery; 14th = citizenship; 15th = vote" },
    { sentence: "For example, Hiram Revels became the first Black member of the Senate in 1870.", note: "Revels = 1st Black senator, 1870" },
    { sentence: "In Baltimore, Isaac Myers organized Black workers to buy their own shipyard in 1866.", note: "Myers: Black workers buy shipyard 1866" },
    { sentence: "However, Southern states passed Black Codes that limited the rights of freedpeople.", note: "Black Codes limit freedpeople's rights" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The 14th Amendment changed American democracy",
      because: "it made everyone born or naturalized in the United States a citizen.",
      but: "many Southern states ignored its promise.",
      so: "Black leaders could demand equal protection under the law.",
    },
    {
      lesson: "B",
      kernel: "Black leaders held real political power",
      because: "the 15th Amendment protected the right to vote.",
      but: "white leaders in the South fought to take that power back.",
      so: "Black men voted and won office across the South.",
    },
    {
      lesson: "D",
      kernel: "Isaac Myers started a Black-owned shipyard",
      because: "white workers forced Black caulkers out of shipyard jobs.",
      but: "he did not accept defeat.",
      so: "hundreds of Black workers found jobs in 1866.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Southern states passed laws.",
      parts: { when: "in 1865 and 1866", how: "called Black Codes", why: "to limit the rights of freedpeople" },
      model: "In 1865 and 1866, Southern states passed laws called Black Codes to limit the rights of freedpeople.",
    },
    {
      lesson: "A",
      kernel: "Congress passed amendments.",
      parts: { when: "after the Civil War", how: "that changed the Constitution", why: "to protect the rights of freedpeople" },
      model: "After the Civil War, Congress passed amendments that changed the Constitution to protect the rights of freedpeople.",
    },
  ],
  fragments: [
    { text: "The 15th Amendment protected the right to vote.", is_sentence: true },
    { text: "Because Black Codes limited their freedom.", is_sentence: false, fix: "Many freedpeople were not equal because Black Codes limited their freedom." },
    { text: "Isaac Myers organized Black workers in Baltimore.", is_sentence: true },
    { text: "Showed that Black citizens held real political power.", is_sentence: false, fix: "Hiram Revels's election showed that Black citizens held real political power." },
    { text: "Although the amendments promised equality.", is_sentence: false, fix: "Although the amendments promised equality, Southern states resisted." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The 14th Amendment, ___, gave everyone equal protection under the law.",
      noun: "14th Amendment",
      options: ["a change to the Constitution that defined citizenship", "a law that limited the rights of freedpeople", "a federal agency that helped formerly enslaved people"],
      answer: 0,
      model: "The 14th Amendment, a change to the Constitution that defined citizenship, gave everyone equal protection under the law.",
    },
    {
      lesson: "B",
      sentence: "The Freedmen's Bureau, ___, opened schools across the South.",
      noun: "Freedmen's Bureau",
      options: ["state laws that separated people by race", "a federal agency created in 1865", "laws passed in 1865 and 1866 that limited rights"],
      answer: 1,
      model: "The Freedmen's Bureau, a federal agency created in 1865, opened schools across the South.",
    },
    {
      lesson: "D",
      sentence: "Isaac Myers, ___, organized Black workers in Baltimore.",
      noun: "Isaac Myers",
      options: ["the first Black member of the Senate", "a leader of a federal agency", "a Black caulker born in the city"],
      answer: 2,
      model: "Isaac Myers, a Black caulker born in the city, organized Black workers in Baltimore.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "although", stem: "Southern states found ways to block Black voters", model: "Although the 15th Amendment protected the vote, Southern states found ways to block Black voters." },
    { lesson: "D", conjunction: "because", stem: "Black caulkers in Baltimore started their own company", model: "Because white workers forced them out of shipyard jobs, Black caulkers in Baltimore started their own company." },
    { lesson: "C", conjunction: "after", stem: "Jim Crow laws spread across the South", model: "After Reconstruction ended in 1877, Jim Crow laws spread across the South." },
  ],
  spo: {
    topic: {
      l1_2: "Reconstruction [kept] and [broke] its promise of [equality].",
      l3_4: "I claim that Reconstruction [partly kept] its promise of equality because [the amendments] changed the law, but [Black Codes and Jim Crow] limited it.",
      l5_6: "According to [the 14th and 15th Amendments] and [Black leaders such as Hiram Revels and Isaac Myers], Reconstruction [expanded equality in law], although [Black Codes and Jim Crow] left the promise unfinished.",
    },
    starters: [
      { type: "question", text: "Did Reconstruction keep its promise of equality?" },
      { type: "appositive", text: "Isaac Myers, a Black caulker from Baltimore, built a company that hired hundreds." },
      { type: "subordinate", text: "Although the amendments promised equality, Southern states resisted." },
    ],
    details: [
      { note: "13th: slavery ends", lesson: "A" },
      { note: "14th: citizenship + equal protection", lesson: "A" },
      { note: "15th: race cannot deny vote", lesson: "A" },
      { note: "Revels: 1st Black senator, 1870", lesson: "B" },
      { note: "Myers: Black-owned shipyard, 1866", lesson: "D" },
      { note: "Black Codes + Jim Crow limit rights", lesson: "C" },
    ],
    distractors: ["the Civil War began at Fort Sumter", "Baltimore has many rowhouses"],
    conclusion: {
      l1_2: "So the promise was [not] fully [kept].",
      l3_4: "This shows that [the law] expanded equality, but [the promise] was not fully kept.",
      l5_6: "This evidence shows that Reconstruction [changed the law and inspired leaders], but it did not [make equality real for everyone].",
    },
  },
  prompt: {
    l1_2: "Did Reconstruction keep its promise? Write 3 sentences. Say yes or no and give one fact.",
    l3_4: "Write a paragraph that states a claim about Reconstruction's promise of equality. Support it with two pieces of evidence. Use according to and because.",
    l5_6: "Write a paragraph that states a claim about Reconstruction's promise of equality and supports it with cited evidence from at least three lessons. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["According to", "As shown by", "For example,", "Because", "However,", "This shows that", "Therefore,", "In conclusion,"],
  model: {
    l1_2: "Reconstruction kept some of its promise. The 14th Amendment made people citizens. Black Codes limited their rights.",
    l3_4: "I claim that Reconstruction partly kept its promise of equality. According to the 14th Amendment, everyone born or naturalized in the United States is a citizen with equal protection of the laws. The 15th Amendment also said that race could not be used to deny the vote. However, Southern states passed Black Codes that limited freedpeople's rights. This shows that the law expanded equality, but the promise was not fully kept.",
    l5_6: "According to the 14th and 15th Amendments and Black leaders such as Hiram Revels and Isaac Myers, Reconstruction expanded equality in law, although Black Codes and Jim Crow left the promise unfinished. The 14th Amendment, a change to the Constitution that defined citizenship, gave everyone born or naturalized in the United States equal protection. As shown by Revels's election to the Senate in 1870, Black citizens held real political power. In Baltimore, Isaac Myers, a Black caulker, organized workers to buy a shipyard in 1866 because white workers had forced Black caulkers out of their jobs. However, Southern states passed Black Codes in 1865 and 1866 to limit the rights of freedpeople. After Reconstruction ended in 1877, Jim Crow laws spread across the South. This evidence shows that Reconstruction changed the law and inspired leaders, but it did not make equality real for everyone.",
  },
  mpo: {
    thesis: "Reconstruction expanded equality in the law and in Black political and economic life, but Black Codes and Jim Crow left its promise unfinished.",
    paragraphs: [
      { topic: "The 13th, 14th, and 15th Amendments changed the law to promise equality.", notes: ["13th: slavery ends", "14th: citizenship + equal protection", "15th: race cannot deny vote"] },
      { topic: "Black leaders in Washington and Baltimore used their new rights to build power.", notes: ["Revels: 1st Black senator 1870", "Myers: shipyard 1866", "hundreds of jobs"] },
      { topic: "Black Codes and Jim Crow show how the promise was limited.", notes: ["Black Codes 1865-1866", "Reconstruction ends 1877", "Jim Crow separates people by race"] },
    ],
    conclusion: "The evidence shows both real progress and real resistance, so the best answer is that Reconstruction began a promise that the nation was still working to keep.",
  },
  revise: [
    "Did I state a clear claim about the promise of equality before my evidence?",
    "Did I cite a source with according to or as shown by?",
    "Did I use a date, a name, or an amendment number as evidence?",
    "Did I explain what each piece of evidence shows, instead of just listing it?",
  ],
};
