// BCPSS Writing Lab (TWR) — g5-ela-u3 · A War Between Us. Contract: ../writing-schema.mjs

export default {
  title: "Letters From the War",
  genre: "argue",
  tip: "Have students underline the claim in the mentor sentence and then find the source that proves it.",
  lessons: [
    { id: "A", title: "Maryland as a border state" },
    { id: "B", title: "Letters and diaries as primary sources" },
    { id: "C", title: "Life at home for soldiers' families" },
    { id: "D", title: "Slavery, emancipation, and Maryland in 1864" },
  ],
  source: {
    title: "Maryland in the Middle",
    lesson: "A",
    text: "Maryland was a border state. It allowed slavery, but it stayed in the Union. In April 1861, a crowd attacked Union soldiers marching through Baltimore. Soon after, Union troops took control of the city, and Fort McHenry held prisoners. In September 1862, the Battle of Antietam took place in western Maryland. It was the bloodiest single day of the war. Families were torn apart, because some Marylanders fought for the Union and others for the Confederacy. In 1864, Maryland ended slavery in its own new state constitution.",
  },
  notes: [
    { sentence: "It allowed slavery, but it stayed in the Union.", note: "border state: slavery + Union" },
    { sentence: "In April 1861, a crowd attacked Union soldiers marching through Baltimore.", note: "Apr. 1861 Baltimore crowd v. Union troops" },
    { sentence: "Families were torn apart, because some Marylanders fought for the Union and others for the Confederacy.", note: "families split: Union vs. Confederacy" },
    { sentence: "In 1864, Maryland ended slavery in its own new state constitution.", note: "1864 MD ends slavery" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Maryland stayed in the Union",
      because: "the federal government sent troops to hold Baltimore.",
      but: "the state still allowed slavery.",
      so: "neighbors in the state disagreed with each other about the war.",
    },
    {
      lesson: "B",
      kernel: "A soldier's letter is strong evidence",
      because: "it was written by someone who was there at the time.",
      but: "it shows only one person's view of the war.",
      so: "historians check it against a second source.",
    },
    {
      lesson: "D",
      kernel: "Maryland ended slavery in 1864",
      because: "voters approved a new state constitution.",
      but: "the Emancipation Proclamation had not freed enslaved people in Maryland.",
      so: "enslaved Marylanders gained their freedom under state law.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The soldier wrote a letter.",
      parts: { when: "in 1862", who: "to his mother", where: "from a cold camp", why: "to tell her he missed the farm" },
      model: "In 1862, the soldier wrote a letter to his mother from a cold camp to tell her he missed the farm.",
    },
    {
      lesson: "C",
      kernel: "Families waited.",
      parts: { when: "each day", where: "at home", how: "with worry", why: "for news from the battlefield" },
      model: "Each day, families waited at home with worry for news from the battlefield.",
    },
  ],
  fragments: [
    { text: "Maryland was a border state.", is_sentence: true },
    { text: "Because Union troops took control of Baltimore.", is_sentence: false, fix: "The city grew quiet because Union troops took control of Baltimore." },
    { text: "Fort McHenry held prisoners during the war.", is_sentence: true },
    { text: "Wrote to his mother about the cold camp.", is_sentence: false, fix: "The soldier wrote to his mother about the cold camp." },
    { text: "According to a soldier's letter.", is_sentence: false, fix: "According to a soldier's letter, the camp was cold and the food was poor." },
    { text: "The Battle of Antietam took place in western Maryland.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Maryland, ___, allowed slavery but stayed in the Union.",
      noun: "Maryland",
      options: ["a border state between North and South", "a letter written by a soldier", "a battle in September 1862"],
      answer: 0,
      model: "Maryland, a border state between North and South, allowed slavery but stayed in the Union.",
    },
    {
      lesson: "B",
      sentence: "A primary source, ___, helps historians prove a claim.",
      noun: "primary source",
      options: ["a statement that you believe is true", "a record made by someone who was there", "a split into groups that disagree"],
      answer: 1,
      model: "A primary source, a record made by someone who was there, helps historians prove a claim.",
    },
    {
      lesson: "D",
      sentence: "Emancipation, ___, changed life for enslaved people.",
      noun: "Emancipation",
      options: ["a written plan for a government", "a crowd marching through a city", "the act of being set free from slavery"],
      answer: 2,
      model: "Emancipation, the act of being set free from slavery, changed life for enslaved people.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "although", stem: "it stayed in the Union", model: "Although Maryland allowed slavery, it stayed in the Union." },
    { lesson: "B", conjunction: "because", stem: "the soldier's letter is strong evidence", model: "Because the soldier was there, the soldier's letter is strong evidence." },
    { lesson: "C", conjunction: "when", stem: "many families worried", model: "When their sons left for the army, many families worried." },
  ],
  spo: {
    topic: {
      l1_2: "The Civil War [changed] life for [families].",
      l3_4: "The Civil War changed life for [families] because [many men left home].",
      l5_6: "Although [the war was fought on distant battlefields], the Civil War changed life for [families at home] because [reason backed by a soldier's letter].",
    },
    starters: [
      { type: "statement", text: "Letters from soldiers prove that the Civil War changed life for families." },
      { type: "question", text: "How can one soldier's letter prove that a war changed a family?" },
      { type: "subordinate", text: "Although the war was fought on battlefields, its effects reached every farm and kitchen." },
    ],
    details: [
      { note: "men leave farms for army", lesson: "C" },
      { note: "letter 1862: cold camp, poor food", lesson: "B" },
      { note: "mother runs farm alone", lesson: "C" },
      { note: "families wait + worry for news", lesson: "C" },
      { note: "soldier misses home, wants letters", lesson: "B" },
      { note: "letter = primary source = evidence", lesson: "B" },
    ],
    distractors: ["Fort McHenry defended Baltimore in 1814", "Maryland crabs are caught in the Bay"],
    conclusion: {
      l1_2: "The war [changed] life for [families].",
      l3_4: "This shows that the war [changed family life] because [reason].",
      l5_6: "Therefore, [the soldier's letter] proves that [the Civil War changed life for families], even [far from the battlefield].",
    },
  },
  prompt: {
    l1_2: "Draw a soldier writing a letter. Write 2-4 sentences. Tell how the war changed life for one family.",
    l3_4: "Write a paragraph with a claim about how the Civil War changed life for families. Use your outline, because, and according to.",
    l5_6: "Write a paragraph that claims how the Civil War changed life for families and proves it with evidence from a primary source. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["First,", "According to", "For example,", "Because", "This shows", "Also,", "However,", "Therefore,"],
  model: {
    l1_2: "The war changed life for families. A soldier left his farm. His mother worried every day.",
    l3_4: "The Civil War changed life for families because many men left home. According to a soldier's letter from 1862, the camp was cold and the food was poor. He missed the farm, and he asked his mother to write back. This shows that families were separated, so she waited and worried at home. Therefore, the war changed family life even far from the battlefield.",
    l5_6: "Although the Civil War was fought on distant battlefields, it changed life for families at home. A soldier's letter, a primary source written in 1862, shows how much was lost. According to the letter, the camp was cold, the food was poor, and the soldier missed his farm. Because he asked his mother to write back soon, we can see that her words mattered more to him than comfort. His mother, meanwhile, had to run the farm and wait for news. As shown by this one family, the war separated sons from mothers and filled daily life with worry.",
  },
  mpo: {
    thesis: "The Civil War changed life for soldiers, families, and enslaved people, and letters, diaries, and laws prove it.",
    paragraphs: [
      { topic: "The war changed life for soldiers in camp.", notes: ["letter: cold camp, poor food", "misses farm", "wants mother's letters"] },
      { topic: "The war changed life for families at home.", notes: ["men leave farms", "mothers run farms alone", "worry + waiting for news"] },
      { topic: "The war changed life for enslaved people.", notes: ["MD allowed slavery", "1864 MD ends slavery", "emancipation = freedom"] },
    ],
    conclusion: "Soldiers' letters, family stories, and Maryland's 1864 decision all prove that the Civil War changed ordinary people's lives in lasting ways.",
  },
  revise: [
    "Did I state a clear claim about one group before I gave any evidence?",
    "Did I cite a source with according to and name what it says?",
    "Did I use because or this shows to explain how the evidence proves my claim?",
    "Did I use a fact from a primary source instead of only my opinion?",
  ],
};
