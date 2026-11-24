// BCPSS Writing Lab (TWR) — g7-ela-u4 · Fever. Contract: ../writing-schema.mjs

export default {
  title: "From Mosquito to Health Board",
  genre: "explain",
  tip: "Have students draw a cause-and-effect chain with arrows first, then turn each arrow into a because, so, or as a result sentence.",
  lessons: [
    { id: "A", title: "Philadelphia in the hot summer of 1793" },
    { id: "B", title: "Symptoms and the search for a cause" },
    { id: "C", title: "Fleeing the city and caring for the sick" },
    { id: "D", title: "How the epidemic changed health and civic duty" },
  ],
  source: {
    title: "Why the Fever Spread",
    lesson: "A",
    text: "In August 1793, a hot summer helped mosquitoes breed in puddles near the Philadelphia docks. Nobody knew that mosquitoes carried yellow fever. Sick people had high temperatures, headaches, and yellow skin. Because the disease spread fast, thousands of families fled the city, and shops closed. The mayor formed a committee, so volunteers could carry the sick to Bush Hill hospital. Members of the Free African Society nursed many patients. More than 5,000 people died by November. As a result, port cities such as Baltimore made ships wait in quarantine. Years later, Philadelphia built a public water system and set up a health board.",
  },
  notes: [
    { sentence: "In August 1793, a hot summer helped mosquitoes breed in puddles near the Philadelphia docks.", note: "hot summer → mosquitoes breed @ docks" },
    { sentence: "Because the disease spread fast, thousands of families fled the city, and shops closed.", note: "fast spread → thousands flee, shops close" },
    { sentence: "The mayor formed a committee, so volunteers could carry the sick to Bush Hill hospital.", note: "mayor's committee → volunteers → Bush Hill" },
    { sentence: "As a result, port cities such as Baltimore made ships wait in quarantine.", note: "result: ports use quarantine" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Mosquitoes bred near the Philadelphia docks",
      because: "the hot summer left puddles of standing water.",
      but: "nobody knew that mosquitoes carried the disease.",
      so: "yellow fever moved quickly through the crowded city.",
    },
    {
      lesson: "C",
      kernel: "Thousands of families fled Philadelphia",
      because: "they were afraid of catching yellow fever.",
      but: "many poor families could not afford to leave.",
      so: "shops closed and food became harder to buy.",
    },
    {
      lesson: "D",
      kernel: "Port cities like Baltimore began using quarantine",
      because: "leaders wanted to keep sick travelers off the docks.",
      but: "doctors still did not understand the real cause.",
      so: "ships had to wait before anyone came ashore.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Mosquitoes bred.",
      parts: { when: "during the hot August of 1793", where: "in puddles near the docks", why: "because the standing water stayed warm" },
      model: "During the hot August of 1793, mosquitoes bred in puddles near the docks because the standing water stayed warm.",
    },
    {
      lesson: "C",
      kernel: "Volunteers carried the sick.",
      parts: { when: "after the mayor formed a committee", where: "to Bush Hill hospital", how: "by cart", why: "so patients could get care" },
      model: "After the mayor formed a committee, volunteers carried the sick by cart to Bush Hill hospital so patients could get care.",
    },
  ],
  fragments: [
    { text: "Yellow fever caused a high temperature and yellow skin.", is_sentence: true },
    { text: "Because the summer was very hot.", is_sentence: false, fix: "Mosquitoes bred quickly because the summer was very hot." },
    { text: "Fled the city in the fall of 1793.", is_sentence: false, fix: "Thousands of families fled the city in the fall of 1793." },
    { text: "The mayor formed a committee to help the sick.", is_sentence: true },
    { text: "As a result of the quarantine.", is_sentence: false, fix: "As a result of the quarantine, ships waited before anyone came ashore." },
    { text: "Cities learned that clean water protects people.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Yellow fever, ___, spread through Philadelphia in 1793.",
      noun: "Yellow fever",
      options: ["a disease carried by mosquitoes", "a hospital outside the city", "a rule that kept ships waiting"],
      answer: 0,
      model: "Yellow fever, a disease carried by mosquitoes, spread through Philadelphia in 1793.",
    },
    {
      lesson: "C",
      sentence: "Bush Hill, ___, cared for the sick during the epidemic.",
      noun: "Bush Hill",
      options: ["a ship waiting at the dock", "a hospital outside the city", "a sign of a high temperature"],
      answer: 1,
      model: "Bush Hill, a hospital outside the city, cared for the sick during the epidemic.",
    },
    {
      lesson: "D",
      sentence: "Quarantine, ___, kept sick travelers away from the docks.",
      noun: "Quarantine",
      options: ["a sign that a person is sick", "a dirty street near the docks", "a time of keeping people apart"],
      answer: 2,
      model: "Quarantine, a time of keeping people apart, kept sick travelers away from the docks.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "the disease moved fast through the city", model: "Because mosquitoes bred near the docks, the disease moved fast through the city." },
    { lesson: "C", conjunction: "after", stem: "thousands of families packed their bags and fled", model: "After the first deaths, thousands of families packed their bags and fled." },
    { lesson: "D", conjunction: "since", stem: "leaders created a health board", model: "Since leaders believed dirty water and streets had helped spread the fever, they created a health board." },
  ],
  spo: {
    topic: {
      l1_2: "The [hot summer] caused [yellow fever] to spread in [Philadelphia].",
      l3_4: "The hot summer of 1793 led to [the spread of yellow fever], and as a result [thousands of people fled] and [the city changed].",
      l5_6: "Because [mosquitoes bred in standing water], yellow fever spread through Philadelphia, and its effects [reshaped] how a city [cares for its people].",
    },
    starters: [
      { type: "question", text: "How could a few mosquitoes empty an entire capital city?" },
      { type: "exclamation", text: "A hot summer, standing water, and one hidden mosquito changed Philadelphia forever!" },
      { type: "subordinate", text: "Although nobody knew the cause, the effects of the fever were clear to everyone." },
    ],
    details: [
      { note: "hot summer → mosquitoes breed near docks", lesson: "A" },
      { note: "nobody knew mosquitoes spread fever", lesson: "A" },
      { note: "symptoms: high temperature, yellow skin", lesson: "B" },
      { note: "thousands flee, shops close", lesson: "C" },
      { note: "mayor's committee → Bush Hill care", lesson: "C" },
      { note: "quarantine, health board, clean water", lesson: "D" },
    ],
    distractors: ["ships carried sugar and coffee", "the city had many printing shops"],
    conclusion: {
      l1_2: "The fever [changed] how the city [kept people safe].",
      l3_4: "As a result of the epidemic, leaders [built] a [health board] and cities cared more about [clean water].",
      l5_6: "Therefore, the 1793 epidemic was a catalyst that taught [cities] that [sanitation and civic duty] protect [everyone in the community].",
    },
  },
  prompt: {
    l1_2: "Draw an arrow chain: hot summer, mosquitoes, sick people. Write 3 sentences. Use because or so.",
    l3_4: "Write a paragraph that explains how a hot summer helped cause the 1793 epidemic and what effects followed. Use because, so, and as a result.",
    l5_6: "Write a paragraph that explains the chain of causes and effects of the 1793 yellow fever epidemic, from the summer heat to the changes in how cities protect health. Include an appositive and a sentence that starts with because or since.",
  },
  transitions: ["First,", "Because", "As a result,", "This led to", "Then,", "Therefore,", "Since", "In the end,"],
  model: {
    l1_2: "A hot summer helped mosquitoes breed near the docks. Yellow fever spread fast. As a result, many families left the city.",
    l3_4: "The hot summer of 1793 led to the spread of yellow fever in Philadelphia. First, mosquitoes bred in puddles near the docks. Nobody knew that mosquitoes carried the disease, so it spread fast. As a result, thousands of families fled and shops closed. The mayor's committee sent volunteers to carry the sick to Bush Hill hospital. Therefore, the city learned that it needed leaders who could act quickly.",
    l5_6: "Because mosquitoes bred in standing water near the docks, yellow fever spread through Philadelphia in the summer of 1793. Nobody knew that mosquitoes carried the disease, so the sickness moved quickly through the crowded city. As a result, thousands of families fled, and shops closed. The mayor's committee, a group of citizens who chose to help, sent volunteers to carry the sick to Bush Hill hospital. More than 5,000 people died by November. After the epidemic, port cities such as Baltimore used quarantine to keep sick travelers off the docks. Since leaders believed dirty water and streets had helped spread the fever, Philadelphia later built a public water system and a health board. The epidemic was a catalyst that taught cities that sanitation and civic duty protect everyone.",
  },
  mpo: {
    thesis: "A hot summer, standing water, and a hidden mosquito caused the 1793 yellow fever epidemic, and its effects changed how cities protect the health of their people.",
    paragraphs: [
      { topic: "The causes of the epidemic began with the summer heat and standing water near the docks.", notes: ["hot summer", "puddles → mosquitoes breed", "nobody knew the cause"] },
      { topic: "The first effects were fear, flight, and a city that nearly stopped.", notes: ["thousands fled", "shops closed", "5,000+ died", "committee + volunteers + Bush Hill"] },
      { topic: "The long-term effects were new ideas about quarantine, clean water, and civic duty.", notes: ["ports use quarantine", "health boards", "public water system"] },
    ],
    conclusion: "The 1793 epidemic shows that one small cause can lead to a chain of effects that changes a whole city for years.",
  },
  revise: [
    "Did I name a cause and then the effect it produced, in the right order?",
    "Did I use because, so, as a result, or led to to link each cause to its effect?",
    "Did I use real facts about 1793, such as the docks, Bush Hill, or the 5,000 deaths?",
    "Did I show a long-term effect, such as quarantine, clean water, or health boards?",
  ],
};
