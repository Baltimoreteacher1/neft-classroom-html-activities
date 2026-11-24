// BCPSS Writing Lab (TWR) — g6-ela-u1 · Resilience in the Great Depression. Contract: ../writing-schema.mjs

export default {
  title: "Drought, Hardship and Resilience",
  genre: "explain",
  tip: "Have students draw a cause-and-effect chain from the drought to a family's choice, then add one comeback detail.",
  lessons: [
    { id: "A", title: "The Dust Bowl: drought and dust storms" },
    { id: "B", title: "Dorothea Lange's photographs of the Great Depression" },
    { id: "C", title: "Out of the Dust: a family's hardship" },
    { id: "D", title: "Bud, Not Buddy: resilience on the road" },
  ],
  source: {
    title: "When the Rain Stopped",
    lesson: "A",
    text: "In the 1930s, a long drought hit the Great Plains. Without rain, the wheat withered, so farmers had nothing to sell. Many farmers had also plowed up the prairie grass that held the soil in place. As a result, strong winds lifted the dry dirt into huge dust storms. Families hung wet sheets over their windows, but dust still crept inside. Because the crops failed, many families migrated west to look for work. In the story Out of the Dust, a girl named Billie Jo lives through these storms. The photographer Dorothea Lange took pictures of families on the road. Her photographs show hardship, but they also show dignity. Neighbors who shared food showed the community's resilience.",
  },
  notes: [
    { sentence: "Without rain, the wheat withered, so farmers had nothing to sell.", note: "no rain → wheat died → no income" },
    { sentence: "As a result, strong winds lifted the dry dirt into huge dust storms.", note: "dry soil + wind → dust storms" },
    { sentence: "Because the crops failed, many families migrated west to look for work.", note: "crops failed → migrate west = jobs" },
    { sentence: "Neighbors who shared food showed the community's resilience.", note: "neighbors share food = resilience" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The drought hurt Great Plains farmers",
      because: "the wheat withered without rain and they had nothing to sell.",
      but: "some neighbors still shared food with each other.",
      so: "many families migrated west to look for work.",
    },
    {
      lesson: "B",
      kernel: "Dorothea Lange photographed families on the road",
      because: "she wanted people to see the hardship of the Great Depression.",
      but: "her pictures also show the dignity of the families.",
      so: "viewers today can feel what life was like in the 1930s.",
    },
    {
      lesson: "D",
      kernel: "Bud sets out on a long journey",
      because: "he believes a famous bandleader is his father.",
      but: "he is only ten years old and has little money.",
      so: "he must rely on kind strangers along the way.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "The dust storm rolled in.",
      parts: { when: "On a windy afternoon", where: "across the Great Plains", how: "like a wall of black smoke" },
      model: "On a windy afternoon, the dust storm rolled in across the Great Plains like a wall of black smoke.",
    },
    {
      lesson: "C",
      kernel: "Billie Jo's family struggled.",
      parts: { when: "During the 1930s", where: "on their Oklahoma farm", why: "because the drought killed the crops" },
      model: "During the 1930s, Billie Jo's family struggled on their Oklahoma farm because the drought killed the crops.",
    },
  ],
  fragments: [
    { text: "A drought is a long time with little rain.", is_sentence: true },
    { text: "Because the crops failed.", is_sentence: false, fix: "Many families left because the crops failed." },
    { text: "Migrated west to find work.", is_sentence: false, fix: "Many families migrated west to find work." },
    { text: "Dorothea Lange took photographs of families in the 1930s.", is_sentence: true },
    { text: "When the dust covered the fields.", is_sentence: false, fix: "When the dust covered the fields, farmers could not grow crops." },
    { text: "Neighbors shared their food.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The Dust Bowl, ___, was hit by huge dust storms in the 1930s.",
      noun: "Dust Bowl",
      options: ["the dry part of the Great Plains", "a collection of photographs", "a person who tells a story"],
      answer: 0,
      model: "The Dust Bowl, the dry part of the Great Plains, was hit by huge dust storms in the 1930s.",
    },
    {
      lesson: "B",
      sentence: "Dorothea Lange, ___, took pictures of families on the road.",
      noun: "Dorothea Lange",
      options: ["a photographer of the Great Depression", "a farmer in Oklahoma", "a long time without rain"],
      answer: 0,
      model: "Dorothea Lange, a photographer of the Great Depression, took pictures of families on the road.",
    },
    {
      lesson: "D",
      sentence: "Resilience, ___, helped Bud keep going.",
      noun: "Resilience",
      options: ["the strength to keep going after something hard", "a time of serious trouble", "a group of people who help each other"],
      answer: 0,
      model: "Resilience, the strength to keep going after something hard, helped Bud keep going.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "the wind lifted the dry soil into huge dust storms", model: "Because the drought dried the soil, the wind lifted it into huge dust storms." },
    { lesson: "B", conjunction: "although", stem: "the photographs also show dignity", model: "Although the photographs show hardship, they also show dignity." },
    { lesson: "C", conjunction: "when", stem: "the whole community grows stronger", model: "When neighbors share food, the whole community grows stronger." },
  ],
  spo: {
    topic: {
      l1_2: "The [drought] caused [hardship] for farm families.",
      l3_4: "The long [drought] caused [dust storms and lost crops], so families [migrated west or shared food].",
      l5_6: "Although the Great Plains looked hopeless in the 1930s, [the drought] led to [hardship], and [communities showed resilience by sharing and moving on].",
    },
    starters: [
      { type: "question", text: "What happens to a farm family when the rain stops for years?" },
      { type: "appositive", text: "The Dust Bowl, a dry stretch of the Great Plains, turned good farmland into blowing dirt." },
      { type: "subordinate", text: "When the rain stopped, the wheat withered and the soil began to blow." },
    ],
    details: [
      { note: "drought = no rain for years", lesson: "A" },
      { note: "wheat withered → no income", lesson: "A" },
      { note: "dry soil + wind → dust storms", lesson: "A" },
      { note: "families migrate west for work", lesson: "C" },
      { note: "Lange photos show hardship + dignity", lesson: "B" },
      { note: "neighbors share food = resilience", lesson: "D" },
    ],
    distractors: ["wheat is used to make bread", "Dorothea Lange used a large camera"],
    conclusion: {
      l1_2: "The people showed [resilience].",
      l3_4: "As a result, the drought brought [hardship], but people showed [resilience] when they [shared and kept going].",
      l5_6: "In the end, [hardship] caused by the drought was real, yet [resilience and dignity] helped families [keep going].",
    },
  },
  prompt: {
    l1_2: "Draw a dusty farm. Write 3-4 sentences about what the drought caused. Use the words drought, crops, and families.",
    l3_4: "Write a paragraph that explains how the drought caused hardship for families and how people showed resilience. Use your outline, because, and so.",
    l5_6: "Write a paragraph that explains the chain of causes and effects from the drought to the hardship families faced, and the resilience they showed. Include an appositive and a sentence that starts with because or although.",
  },
  transitions: ["First,", "Because", "So", "As a result,", "This led to", "Since", "Although", "In the end,"],
  model: {
    l1_2: "A long drought hit the Great Plains. The crops died, so families had no money. Many families moved west. Neighbors shared food.",
    l3_4: "The long drought caused hardship for families on the Great Plains. Without rain, the wheat withered, so farmers had nothing to sell. Dry soil blew away in huge dust storms because the wind was strong. As a result, many families migrated west to look for work. Neighbors who shared food showed resilience.",
    l5_6: "Although the Great Plains once looked like rich farmland, a long drought turned the 1930s into a time of hardship. Without rain, the wheat withered, so farmers lost their only income. Because plowed fields no longer held the soil, strong winds lifted it into huge dust storms. As a result, many families, including the girl in Out of the Dust, struggled to stay on their land. Others migrated west to look for work, and Dorothea Lange's photographs show both their hardship and their dignity. When neighbors shared their food, they showed the community's resilience.",
  },
  mpo: {
    thesis: "The drought of the 1930s caused hardship that pushed families to migrate, but people showed resilience by sharing and holding on to their dignity.",
    paragraphs: [
      { topic: "The drought caused crop failure and dust storms.", notes: ["no rain → wheat died", "dry soil + wind → dust storms", "no crops = no income"] },
      { topic: "Hardship led families to leave or struggle.", notes: ["migrate west for work", "Lange photos of families on the road", "wet sheets on windows"] },
      { topic: "Resilience helped communities keep going.", notes: ["neighbors share food", "dignity in hard times", "Bud travels on to find family"] },
    ],
    conclusion: "Because the drought caused so much loss, the way people shared and kept their dignity shows how communities find the strength to keep going.",
  },
  revise: [
    "Did I show a cause and its effect with so, because or as a result?",
    "Did I name both the hardship and one way people showed resilience?",
    "Did I use words such as drought, migrate, dignity and community correctly?",
    "Did I use a detail from a text or photograph, not only my own ideas?",
  ],
};
