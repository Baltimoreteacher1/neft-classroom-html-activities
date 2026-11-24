// BCPSS Writing Lab (TWR) — g4-ss-u4 · Maryland Government, Abolition & Modern Baltimore. Contract: ../writing-schema.mjs

export default {
  title: "Harriet's Path to Freedom",
  genre: "narrate",
  tip: "Have students number the events on a timeline strip first so the order words match the order of the story.",
  lessons: [
    { id: "A", title: "Harriet Tubman's escape and return" },
    { id: "B", title: "Frederick Douglass learns to read in Baltimore" },
    { id: "C", title: "The Underground Railroad and the end of slavery in Maryland" },
    { id: "D", title: "How laws are made in Maryland and Baltimore" },
  ],
  source: {
    title: "A Brave Choice",
    lesson: "A",
    text: "Harriet Tubman was born into slavery in Dorchester County, Maryland. Initially, she worked for people who claimed to own her. In 1849, she escaped north to Pennsylvania and became free. At the turning point, she chose to go back instead of staying safe. After that, she returned to Maryland many times and guided about seventy people to freedom on the Underground Railroad. Later, in 1864, Maryland ended slavery. Today, Maryland's legislature in Annapolis writes laws, and the governor signs them.",
  },
  notes: [
    { sentence: "Initially, she worked for people who claimed to own her.", note: "initially: forced to work" },
    { sentence: "In 1849, she escaped north to Pennsylvania and became free.", note: "1849: escaped north → free" },
    { sentence: "At the turning point, she chose to go back instead of staying safe.", note: "turning point: chose to go back" },
    { sentence: "After that, she returned to Maryland many times and guided about seventy people to freedom on the Underground Railroad.", note: "after: returned many times, guided ~70" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Harriet Tubman escaped to Pennsylvania in 1849",
      because: "she wanted to be free.",
      but: "her family was still enslaved in Maryland.",
      so: "she decided to go back for other people.",
    },
    {
      lesson: "B",
      kernel: "Frederick Douglass taught himself to read",
      because: "his lessons were stopped.",
      but: "he had already learned the alphabet.",
      so: "he traded bread for lessons from boys on the street.",
    },
    {
      lesson: "D",
      kernel: "Maryland's legislature votes on bills",
      because: "it is the group that writes laws for the state.",
      but: "a bill is not a law until the governor signs it.",
      so: "the governor has an important job in making laws.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Harriet guided people.",
      parts: { when: "at night", where: "along secret paths", why: "to reach freedom" },
      model: "At night, Harriet guided people along secret paths to reach freedom.",
    },
    {
      lesson: "B",
      kernel: "Frederick traded bread.",
      parts: { when: "after his lessons stopped", where: "on Baltimore's streets", why: "for reading lessons" },
      model: "After his lessons stopped, Frederick traded bread on Baltimore's streets for reading lessons.",
    },
  ],
  fragments: [
    { text: "Harriet Tubman escaped in 1849.", is_sentence: true },
    { text: "Returned to Maryland many times.", is_sentence: false, fix: "Harriet Tubman returned to Maryland many times." },
    { text: "After Hugh Auld stopped the lessons.", is_sentence: false, fix: "After Hugh Auld stopped the lessons, Frederick taught himself." },
    { text: "The governor signs bills into law.", is_sentence: true },
    { text: "At the turning point in her life.", is_sentence: false, fix: "At the turning point in her life, Harriet chose to go back." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Harriet Tubman, ___, guided about seventy people to freedom.",
      noun: "Harriet Tubman",
      options: ["a brave woman who escaped slavery in Maryland", "a Baltimore boy who taught himself to read", "the elected leader of a city"],
      answer: 0,
      model: "Harriet Tubman, a brave woman who escaped slavery in Maryland, guided about seventy people to freedom.",
    },
    {
      lesson: "B",
      sentence: "Frederick Douglass, ___, taught himself to read in Baltimore.",
      noun: "Frederick Douglass",
      options: ["a woman who guided people on the Underground Railroad", "a boy who later became a famous abolitionist", "the group that makes laws for a state"],
      answer: 1,
      model: "Frederick Douglass, a boy who later became a famous abolitionist, taught himself to read in Baltimore.",
    },
    {
      lesson: "C",
      sentence: "The Underground Railroad, ___, helped people escape to freedom.",
      noun: "Underground Railroad",
      options: ["a group of people who write laws for a state", "an idea for a new law that lawmakers vote on", "a secret network of people and safe places"],
      answer: 2,
      model: "The Underground Railroad, a secret network of people and safe places, helped people escape to freedom.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "after", stem: "Harriet returned to Maryland many times", model: "After she escaped to Pennsylvania, Harriet returned to Maryland many times." },
    { lesson: "B", conjunction: "when", stem: "Frederick decided to learn by himself", model: "When Hugh Auld stopped the lessons, Frederick decided to learn by himself." },
    { lesson: "D", conjunction: "before", stem: "the governor signs the bill", model: "Before the bill becomes a law, the governor signs it." },
  ],
  spo: {
    topic: {
      l1_2: "[Harriet] [escaped] and then [helped others].",
      l3_4: "Initially, Harriet Tubman [escaped slavery]; at the turning point, she [chose to go back], so [many people reached freedom].",
      l5_6: "Although [she was free in Pennsylvania], Harriet Tubman reached a turning point when she [chose to return to Maryland], and later [guided about seventy people to freedom].",
    },
    starters: [
      { type: "question", text: "What would you do if you were free but your family was not?" },
      { type: "appositive", text: "Harriet Tubman, a brave woman from Dorchester County, found a path to freedom." },
      { type: "subordinate", text: "When Harriet reached Pennsylvania, she was free, but she did not stop there." },
    ],
    details: [
      { note: "born into slavery, Dorchester County", lesson: "A" },
      { note: "1849: escaped north → Pennsylvania", lesson: "A" },
      { note: "turning point: chose to go back", lesson: "A" },
      { note: "after: returned many times", lesson: "A" },
      { note: "guided ~70 people, Underground Railroad", lesson: "C" },
      { note: "1864: Maryland ended slavery", lesson: "C" },
    ],
    distractors: ["the Eastern Shore has many marshes", "Philadelphia is a big city in Pennsylvania"],
    conclusion: {
      l1_2: "Harriet [helped] many people.",
      l3_4: "Finally, Harriet [guided about seventy people] to freedom, and Maryland [ended slavery in 1864].",
      l5_6: "In the end, [one brave choice at a turning point] led to [many journeys to freedom].",
    },
  },
  prompt: {
    l1_2: "Draw Harriet Tubman on a path at night. Write 2-3 sentences that tell what she did first, next, and last. Use the words escaped and freedom.",
    l3_4: "Write a paragraph that tells Harriet Tubman's story in order and names the turning point. Use your outline and the time words initially, after, and later.",
    l5_6: "Write a paragraph that narrates Harriet Tubman's path from escape to the end of slavery in Maryland. Include an appositive, a sentence that starts with when or although, and the words at the turning point.",
  },
  transitions: ["Initially,", "After that,", "Then,", "At the turning point,", "Later,", "Finally,", "Soon,", "In the end,"],
  model: {
    l1_2: "Harriet escaped to Pennsylvania in 1849. Then she went back to Maryland. She guided many people to freedom.",
    l3_4: "Initially, Harriet Tubman escaped slavery in Maryland and reached Pennsylvania in 1849. At the turning point, she chose to go back instead of staying safe. After that, she returned to Maryland many times. She guided about seventy people to freedom on the Underground Railroad. Later, in 1864, Maryland ended slavery.",
    l5_6: "Harriet Tubman, a brave woman from Dorchester County, was born into slavery in Maryland. Initially, she escaped north to Pennsylvania in 1849. Although she was free there, she reached a turning point when she chose to return to Maryland. After that, she went back many times and guided about seventy people to freedom on the Underground Railroad. Later, in 1864, Maryland ended slavery. In the end, one brave choice led to many journeys to freedom.",
  },
  revise: [
    "Did I tell the events in order with initially, after, and later?",
    "Did I name the turning point and tell what changed?",
    "Did I include real facts, such as 1849 and the Underground Railroad?",
    "Did I use past-tense verbs, such as escaped, returned, and guided?",
  ],
};
