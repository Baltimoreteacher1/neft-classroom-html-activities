// BCPSS Writing Lab (TWR) — g8-ss-u3 · Sectionalism & The American Civil War. Contract: ../writing-schema.mjs

export default {
  title: "Chain of Events to War",
  genre: "explain",
  tip: "Have students lay out the events on index cards, order them, and write one because or as a result sentence for each pair of neighbors.",
  lessons: [
    { id: "A", title: "Economic differences between North and South" },
    { id: "B", title: "The Dred Scott decision of 1857" },
    { id: "C", title: "Lincoln's election, secession, and Fort Sumter" },
    { id: "D", title: "Maryland, the Union, and emancipation" },
  ],
  source: {
    title: "From Argument to War",
    lesson: "A",
    text: "By 1860, the North and the South had grown far apart. Northern states built factories and cities, whereas Southern states relied on enslaved labor to grow cotton. In 1857, the Dred Scott decision said that Congress could not ban slavery in the territories, so many Northerners lost trust in the courts. When Abraham Lincoln won the election of 1860, several Southern states decided to secede. As a result, eleven states formed the Confederacy, and war began at Fort Sumter in April 1861. Maryland stayed in the Union, but riots in Baltimore showed how divided its people were. On January 1, 1863, the Emancipation Proclamation declared people free in Confederate territory, which made ending slavery a goal of the war.",
  },
  notes: [
    { sentence: "Northern states built factories and cities, whereas Southern states relied on enslaved labor to grow cotton.", note: "North: factories; South: enslaved labor + cotton" },
    { sentence: "In 1857, the Dred Scott decision said that Congress could not ban slavery in the territories, so many Northerners lost trust in the courts.", note: "Dred Scott 1857 → North loses trust in courts" },
    { sentence: "When Abraham Lincoln won the election of 1860, several Southern states decided to secede.", note: "Lincoln wins 1860 → South secedes" },
    { sentence: "On January 1, 1863, the Emancipation Proclamation declared people free in Confederate territory, which made ending slavery a goal of the war.", note: "1/1/1863 Emancipation → war goal = end slavery" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The North and the South grew apart",
      because: "Northern states built factories while Southern states depended on enslaved labor.",
      but: "both regions still shared one government.",
      so: "arguments over slavery grew sharper.",
    },
    {
      lesson: "B",
      kernel: "The Dred Scott decision angered many Northerners",
      because: "it said Congress could not ban slavery in the territories.",
      but: "it did not end the debate over slavery.",
      so: "many Northerners lost trust in the courts.",
    },
    {
      lesson: "C",
      kernel: "Southern states seceded after the election of 1860",
      because: "they feared Lincoln would limit the growth of slavery.",
      but: "Lincoln had said he would not end slavery where it already existed.",
      so: "eleven states formed the Confederacy.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Lincoln called for volunteers.",
      parts: { when: "after Fort Sumter fell", how: "in a public announcement", why: "to put down the rebellion" },
      model: "After Fort Sumter fell, Lincoln called for volunteers in a public announcement to put down the rebellion.",
    },
    {
      lesson: "D",
      kernel: "A crowd attacked soldiers.",
      parts: { when: "on April 19, 1861", where: "on Pratt Street", why: "because many in the crowd supported the South" },
      model: "On April 19, 1861, a crowd attacked soldiers on Pratt Street because many in the crowd supported the South.",
    },
  ],
  fragments: [
    { text: "The Confederacy was made up of eleven Southern states.", is_sentence: true },
    { text: "Because Lincoln won the election of 1860.", is_sentence: false, fix: "Several Southern states seceded because Lincoln won the election of 1860." },
    { text: "The Dred Scott decision made many Northerners angry.", is_sentence: true },
    { text: "As a result of the riot on Pratt Street.", is_sentence: false, fix: "As a result of the riot on Pratt Street, Lincoln sent troops to control Baltimore." },
    { text: "Led to the start of the war at Fort Sumter.", is_sentence: false, fix: "The election of 1860 and secession led to the start of the war at Fort Sumter." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Dred Scott, ___, sued for his freedom in court.",
      noun: "Dred Scott",
      options: ["an enslaved man who had lived in free territory", "a general who defended Fort Sumter", "the president elected in 1860"],
      answer: 0,
      model: "Dred Scott, an enslaved man who had lived in free territory, sued for his freedom in court.",
    },
    {
      lesson: "C",
      sentence: "The Confederacy, ___, formed after several states seceded.",
      noun: "Confederacy",
      options: ["the Northern side in the Civil War", "a group of eleven Southern states with its own government", "a state that allowed slavery but stayed in the Union"],
      answer: 1,
      model: "The Confederacy, a group of eleven Southern states with its own government, formed after several states seceded.",
    },
    {
      lesson: "D",
      sentence: "Maryland, ___, stayed in the Union.",
      noun: "Maryland",
      options: ["a state that seceded in 1860", "the first state to leave the Union", "a border state that allowed slavery"],
      answer: 2,
      model: "Maryland, a border state that allowed slavery, stayed in the Union.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "when", stem: "several Southern states seceded", model: "When Abraham Lincoln won the election of 1860, several Southern states seceded." },
    { lesson: "A", conjunction: "since", stem: "Southern leaders fought to protect slavery", model: "Since the Southern economy depended on enslaved labor, Southern leaders fought to protect slavery." },
    { lesson: "D", conjunction: "after", stem: "ending slavery became a goal of the war", model: "After Lincoln issued the Emancipation Proclamation, ending slavery became a goal of the war." },
  ],
  spo: {
    topic: {
      l1_2: "[Events] led to [the Civil War].",
      l3_4: "A chain of events led to the Civil War because [economic differences], [the Dred Scott decision], and [secession] pushed the country apart.",
      l5_6: "As a result of [economic differences, the Dred Scott decision, and Lincoln's election], [Southern states seceded], and [war began at Fort Sumter].",
    },
    starters: [
      { type: "question", text: "How did angry arguments turn into a war?" },
      { type: "appositive", text: "The Dred Scott decision, a Supreme Court ruling from 1857, deepened the anger." },
      { type: "subordinate", text: "When Lincoln won in 1860, several Southern states left the Union." },
    ],
    details: [
      { note: "North: factories; South: enslaved labor", lesson: "A" },
      { note: "Dred Scott 1857 → courts lose trust", lesson: "B" },
      { note: "Lincoln wins 1860 → secession", lesson: "C" },
      { note: "Fort Sumter, April 1861 = war begins", lesson: "C" },
      { note: "Pratt Street riot, 4/19/1861", lesson: "D" },
      { note: "Emancipation 1863 → war to end slavery", lesson: "D" },
    ],
    distractors: ["Fort McHenry guards Baltimore's harbor", "Lincoln grew up in a log cabin"],
    conclusion: {
      l1_2: "So the [war] began.",
      l3_4: "As a result, [the country] went to war because [the arguments could not be settled].",
      l5_6: "Each event led to [the next], until [war] became [the final effect].",
    },
  },
  prompt: {
    l1_2: "Look at the timeline. Write 3 sentences. Tell one cause and one effect.",
    l3_4: "Explain how the Dred Scott decision and the election of 1860 helped lead to the war. Use because, as a result, and led to.",
    l5_6: "Write a paragraph that explains the chain of events from 1857 to 1861 and shows how Maryland was caught in the middle. Include an appositive and a sentence that starts with when or since.",
  },
  transitions: ["First,", "Because", "As a result,", "This led to", "Therefore,", "Consequently,", "Then,", "Finally,"],
  model: {
    l1_2: "Lincoln won the election of 1860. Southern states seceded. Then war began.",
    l3_4: "A chain of events led to the Civil War. Because the Dred Scott decision said Congress could not ban slavery in the territories, many Northerners lost trust in the courts. As a result, the anger between the North and the South grew sharper. Lincoln's election in 1860 led several Southern states to secede. The attack on Fort Sumter then began the war.",
    l5_6: "As a result of economic differences, the Dred Scott decision, and Lincoln's election, Southern states seceded and war began at Fort Sumter. By 1860, the North had factories and cities, whereas the South depended on enslaved labor to grow cotton. The Dred Scott decision, a Supreme Court ruling from 1857, said Congress could not ban slavery in the territories, so many Northerners lost trust in the courts. When Lincoln won the election of 1860, several Southern states left the Union, and eventually eleven states formed the Confederacy. Their attack on Fort Sumter in April 1861 led Lincoln to call for volunteers. Maryland, a border state, stayed in the Union, but the riot on Pratt Street showed how divided it was. Later, the Emancipation Proclamation made ending slavery a goal of the war.",
  },
  mpo: {
    thesis: "A chain of causes, from economic differences to the Dred Scott decision to secession, pushed the United States from heated arguments into war.",
    paragraphs: [
      { topic: "Economic differences caused the North and the South to grow apart.", notes: ["North: factories + cities", "South: enslaved labor + cotton", "arguments over slavery grow"] },
      { topic: "The Dred Scott decision and Lincoln's election caused secession.", notes: ["Dred Scott 1857", "courts lose trust", "Lincoln 1860 → secession"] },
      { topic: "Fort Sumter and Maryland's divisions show the effects of the war's start.", notes: ["Fort Sumter 4/1861", "Pratt Street riot", "Emancipation 1863"] },
    ],
    conclusion: "No single event caused the Civil War, but each cause led to the next effect, until the country could no longer settle its arguments without fighting.",
  },
  revise: [
    "Did I name a cause and its effect for each event I mention?",
    "Did I use because, as a result, or led to in at least three sentences?",
    "Did I put the events in the order they happened, with dates where I could?",
    "Did I use secession, Confederacy, or border state correctly?",
  ],
};
