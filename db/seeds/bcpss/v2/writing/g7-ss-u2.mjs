// BCPSS Writing Lab (TWR) — g7-ss-u2 · Population, Migration & Cultural Regions. Contract: ../writing-schema.mjs

export default {
  title: "Two Journeys to Baltimore",
  genre: "inform",
  tip: "Have students sort details into Both, Irish only, and Great Migration only before they write, then turn each group into a comparing sentence.",
  lessons: [
    { id: "A", title: "Demographics and population change" },
    { id: "B", title: "Push and pull factors" },
    { id: "C", title: "Irish families and the Great Migration" },
    { id: "D", title: "Cultural regions and cultural diffusion" },
  ],
  source: {
    title: "Why They Came to Baltimore",
    lesson: "C",
    text: "Between 1845 and 1852, a potato disease destroyed Ireland's main food crop, and about one million people died of famine. Many Irish families sailed to American ports, including Baltimore. They found jobs on the docks and the railroads. Starting around 1916, millions of Black families left the rural South in the Great Migration. Segregation and few good jobs pushed many of them out. Many moved to cities such as Baltimore, where they found work in shipyards and steel mills. Both groups moved because of hardship at home and hope for work in Baltimore. In contrast, famine pushed the Irish out, whereas segregation pushed Black southerners out.",
  },
  notes: [
    { sentence: "Between 1845 and 1852, a potato disease destroyed Ireland's main food crop, and about one million people died of famine.", note: "1845–1852: potato disease → famine" },
    { sentence: "They found jobs on the docks and the railroads.", note: "Irish = docks + railroad jobs" },
    { sentence: "Segregation and few good jobs pushed many of them out.", note: "segregation + few jobs = push" },
    { sentence: "Many moved to cities such as Baltimore, where they found work in shipyards and steel mills.", note: "Baltimore → shipyards + steel mills" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Irish families left Ireland",
      because: "a potato disease caused a terrible famine.",
      but: "many of them could barely afford the trip.",
      so: "they sailed to American ports like Baltimore.",
    },
    {
      lesson: "C",
      kernel: "Black families left the rural South",
      because: "segregation and few good jobs pushed them away.",
      but: "they had to leave their homes and relatives behind.",
      so: "many boarded trains to cities like Baltimore.",
    },
    {
      lesson: "D",
      kernel: "Baltimore neighborhoods kept their own traditions",
      because: "each group opened its own churches, bakeries, and shops.",
      but: "the groups also shared foods and music with their neighbors.",
      so: "the city's culture became a mix of many cultures.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Families left home.",
      parts: { when: "during the famine", how: "by ship", why: "to escape hunger" },
      model: "During the famine, families left home by ship to escape hunger.",
    },
    {
      lesson: "C",
      kernel: "Families moved.",
      parts: { when: "after 1916", where: "from the South to Baltimore", how: "by train", why: "to find steady work" },
      model: "After 1916, families moved from the South to Baltimore by train to find steady work.",
    },
  ],
  fragments: [
    { text: "A push factor is a problem at home that makes people leave.", is_sentence: true },
    { text: "Because jobs were waiting in the shipyards.", is_sentence: false, fix: "Many families moved because jobs were waiting in the shipyards." },
    { text: "Sailed across the Atlantic Ocean.", is_sentence: false, fix: "Irish families sailed across the Atlantic Ocean." },
    { text: "Cultural diffusion is the spread of customs, foods, and ideas.", is_sentence: true },
    { text: "Whereas famine pushed the Irish out.", is_sentence: false, fix: "Famine pushed the Irish out, whereas segregation pushed Black southerners out." },
    { text: "Both groups hoped to find work in Baltimore.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Famine, ___, pushed many Irish families out of Ireland.",
      noun: "Famine",
      options: ["a severe shortage of food that causes people to starve", "the spread of customs from place to place", "unfair treatment of people because of their group"],
      answer: 0,
      model: "Famine, a severe shortage of food that causes people to starve, pushed many Irish families out of Ireland.",
    },
    {
      lesson: "C",
      sentence: "Segregation, ___, pushed many Black families out of the South.",
      noun: "Segregation",
      options: ["a shortage of food", "the forced separation of people by race", "the number of people in a square mile"],
      answer: 1,
      model: "Segregation, the forced separation of people by race, pushed many Black families out of the South.",
    },
    {
      lesson: "D",
      sentence: "Cultural diffusion, ___, brought new foods to Baltimore.",
      noun: "Cultural diffusion",
      options: ["the movement of people to a new place", "a problem at home that makes people leave", "the spread of customs, foods, and ideas"],
      answer: 2,
      model: "Cultural diffusion, the spread of customs, foods, and ideas, brought new foods to Baltimore.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "because", stem: "many Irish families left Ireland", model: "Because a potato disease caused a famine, many Irish families left Ireland." },
    { lesson: "C", conjunction: "while", stem: "segregation pushed Black southerners out", model: "While famine pushed the Irish out, segregation pushed Black southerners out." },
    { lesson: "A", conjunction: "since", stem: "Baltimore's population grew quickly", model: "Since both groups arrived looking for work, Baltimore's population grew quickly." },
  ],
  spo: {
    topic: {
      l1_2: "Both [Irish families] and [Black families] moved to [Baltimore] for [work].",
      l3_4: "Both Irish families in the 1840s and Black families in the Great Migration moved to Baltimore for [work], whereas [famine] pushed the Irish out and [segregation] pushed Black southerners out.",
      l5_6: "Although [Irish families] and [Black families] both moved to Baltimore hoping for [work], [their push factors] were different, whereas [their pull factors] were [alike].",
    },
    starters: [
      { type: "question", text: "Why would people leave their homes for a city far away?" },
      { type: "statement", text: "Two very different journeys led to the same city." },
      { type: "appositive", text: "Baltimore, a port city with docks and steel mills, pulled in both groups." },
    ],
    details: [
      { note: "Irish: famine 1845–1852 pushed out", lesson: "B" },
      { note: "Irish: crossed ocean, docks + railroads", lesson: "C" },
      { note: "Black families: segregation pushed from South", lesson: "C" },
      { note: "Great Migration began about 1916", lesson: "C" },
      { note: "both: jobs in Baltimore = pull", lesson: "B" },
      { note: "neighborhoods keep traditions; foods spread", lesson: "D" },
    ],
    distractors: ["potatoes grow best in cool weather", "Baltimore has many rowhouses"],
    conclusion: {
      l1_2: "Both groups [wanted] [work], but their [reasons for leaving] were [different].",
      l3_4: "In contrast to their push factors, both groups were pulled by [jobs] and added their [traditions] to Baltimore.",
      l5_6: "Therefore, although [different problems] pushed the two groups out, [the same hope for work] pulled both to Baltimore, and each group shaped [the city's culture].",
    },
  },
  prompt: {
    l1_2: "Draw a ship and a train. Write 3 sentences. Tell one way the two groups are the same and one way they are different.",
    l3_4: "Write a paragraph that compares Irish families in the 1840s and Black families in the Great Migration. Tell what was the same and what was different. Use both, whereas, and in contrast.",
    l5_6: "Write a paragraph that compares the push and pull factors of Irish families and Black families who moved to Baltimore. Include an appositive and a sentence that starts with although, while, or since.",
  },
  transitions: ["Both", "Similarly,", "Whereas", "In contrast,", "While", "On the other hand,", "However,", "In the end,"],
  model: {
    l1_2: "Irish families and Black families both moved to Baltimore for work. Famine pushed the Irish out. Segregation pushed Black families out.",
    l3_4: "Both Irish families in the 1840s and Black families in the Great Migration moved to Baltimore for work, whereas famine pushed the Irish out and segregation pushed Black southerners out. The Irish sailed across the ocean. In contrast, Black families traveled by train within their own country. Both groups found jobs in places like the docks, the railroads, and the shipyards. In the end, each group added its own traditions to Baltimore.",
    l5_6: "Although Irish families and Black families both moved to Baltimore hoping for work, their push factors were very different. Famine, a severe shortage of food, pushed the Irish out of Ireland in the 1840s. In contrast, segregation, the forced separation of people by race, pushed Black families out of the South during the Great Migration. While the Irish sailed across the ocean, Black families traveled by train within their own country. Both groups were pulled by jobs on the docks, on the railroads, and in the shipyards. Since both groups arrived looking for work, Baltimore's population grew quickly. Each group also opened churches and shops, so cultural diffusion made the city's culture richer.",
  },
  mpo: {
    thesis: "Irish families and Black families both moved to Baltimore for work, but different push factors drove them from home, and each group shaped the city's culture.",
    paragraphs: [
      { topic: "Irish families were pushed out of Ireland by famine and pulled to Baltimore by jobs.", notes: ["1845–1852 potato disease", "famine pushed out", "docks + railroad jobs"] },
      { topic: "Black families were pushed out of the South by segregation and pulled to Baltimore by jobs.", notes: ["Great Migration, about 1916", "segregation + few jobs", "shipyards + steel mills"] },
      { topic: "Both groups were pulled by work and spread their traditions in Baltimore.", notes: ["jobs = shared pull", "churches, bakeries, shops", "cultural diffusion"] },
    ],
    conclusion: "Comparing the two journeys shows that people can leave home for different reasons yet end up building one city together.",
  },
  revise: [
    "Did I name at least one thing both groups share and one real difference?",
    "Did I use both, whereas, while, or in contrast to make the comparison clear?",
    "Did I name the correct push factor for each group, famine or segregation?",
    "Did I use at least one fact about Baltimore, such as the docks or the steel mills?",
  ],
};
