// BCPSS Writing Lab (TWR) — g7-sci-u3 · What Makes the Weather Change? Contract: ../writing-schema.mjs

export default {
  title: "From Sunshine to Storm",
  genre: "explain",
  tip: "Have students draw the chain with arrows from the Sun to the storm, then turn each arrow into a because, causes, or as a result sentence.",
  lessons: [
    { id: "A", title: "Air pressure and why air has weight" },
    { id: "B", title: "Convection and sea breezes" },
    { id: "C", title: "Humidity, condensation, and clouds" },
    { id: "D", title: "Air masses and fronts" },
  ],
  source: {
    title: "A Storm Over the Bay",
    lesson: "C",
    text: "On a hot July afternoon, the Sun heats the land around the Chesapeake Bay faster than the water. The air over the land warms and rises. Rising air leaves lower air pressure at the ground. Cooler air from over the bay moves in, which makes a sea breeze. As the warm, humid air climbs, it cools, and its water vapor condenses into clouds. When a cold front arrives, cold dense air pushes under the warm air, so the warm air rises quickly. As a result, thunderstorms can form and rain falls on Baltimore.",
  },
  notes: [
    { sentence: "On a hot July afternoon, the Sun heats the land around the Chesapeake Bay faster than the water.", note: "Sun heats land faster than water" },
    { sentence: "Rising air leaves lower air pressure at the ground.", note: "air rises → low pressure @ ground" },
    { sentence: "As the warm, humid air climbs, it cools, and its water vapor condenses into clouds.", note: "warm humid air rises → cools → clouds" },
    { sentence: "When a cold front arrives, cold dense air pushes under the warm air, so the warm air rises quickly.", note: "cold front → warm air rises fast → storms" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "A sea breeze blows toward the land",
      because: "warm air over the land rises and cooler air moves in.",
      but: "the breeze usually fades after the Sun goes down.",
      so: "people at Sandy Point feel a cool wind.",
    },
    {
      lesson: "C",
      kernel: "Water vapor turns into clouds",
      because: "rising air cools and the vapor condenses.",
      but: "water vapor by itself is invisible.",
      so: "we only see clouds once tiny droplets form.",
    },
    {
      lesson: "D",
      kernel: "A cold front brings thunderstorms",
      because: "cold, dense air pushes warm, humid air upward quickly.",
      but: "the weather clears once the front passes.",
      so: "the temperature drops after the storm.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The land heats up.",
      parts: { when: "on a hot afternoon", where: "near the Chesapeake Bay", how: "faster than the water" },
      model: "On a hot afternoon, the land heats up near the Chesapeake Bay faster than the water.",
    },
    {
      lesson: "A",
      kernel: "Air pressure dropped.",
      parts: { when: "before the storm", where: "over Maryland", why: "because warm air was rising" },
      model: "Before the storm, air pressure dropped over Maryland because warm air was rising.",
    },
  ],
  fragments: [
    { text: "Warm air is less dense than cool air.", is_sentence: true },
    { text: "Because the water vapor cooled.", is_sentence: false, fix: "Clouds formed because the water vapor cooled." },
    { text: "Rises quickly over the cold air.", is_sentence: false, fix: "The warm air rises quickly over the cold air." },
    { text: "A front is the boundary where two air masses meet.", is_sentence: true },
    { text: "When the air pressure drops.", is_sentence: false, fix: "When the air pressure drops, storms may follow." },
    { text: "Condensation turns water vapor into liquid droplets.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "A sea breeze, ___, blows from the bay toward the land.",
      noun: "sea breeze",
      options: ["a wind caused by warm air rising over land", "a boundary where two air masses meet", "water falling from clouds"],
      answer: 0,
      model: "A sea breeze, a wind caused by warm air rising over land, blows from the bay toward the land.",
    },
    {
      lesson: "C",
      sentence: "Humidity, ___, is high on a muggy August afternoon.",
      noun: "Humidity",
      options: ["the force of air pushing on a surface", "the amount of water vapor in the air", "the change from a gas to a liquid"],
      answer: 1,
      model: "Humidity, the amount of water vapor in the air, is high on a muggy August afternoon.",
    },
    {
      lesson: "D",
      sentence: "A cold front, ___, can bring thunderstorms to Baltimore.",
      noun: "cold front",
      options: ["a huge body of air with the same temperature", "water falling as rain or hail", "the boundary where cold air pushes under warm air"],
      answer: 2,
      model: "A cold front, the boundary where cold air pushes under warm air, can bring thunderstorms to Baltimore.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "a sea breeze forms", model: "When the land heats up faster than the water, a sea breeze forms." },
    { lesson: "C", conjunction: "as", stem: "water vapor condenses into clouds", model: "As warm, humid air rises and cools, water vapor condenses into clouds." },
    { lesson: "D", conjunction: "after", stem: "the temperature drops", model: "After the cold front passes, the temperature drops." },
  ],
  spo: {
    topic: {
      l1_2: "Rising [warm air] causes [clouds] and [rain].",
      l3_4: "On a hot afternoon, [rising warm air] causes [low air pressure], and as a result [clouds] and [storms] can form.",
      l5_6: "Because [the Sun heats the land faster than the bay], [warm, humid air rises, cools, and condenses], and as a result [a cold front] can turn a sunny morning into [a stormy afternoon].",
    },
    starters: [
      { type: "question", text: "Why can a sunny morning on the Chesapeake Bay turn into a stormy afternoon?" },
      { type: "exclamation", text: "Rising warm air can build a towering storm cloud in just a few hours!" },
      { type: "subordinate", text: "When warm, humid air rises and cools, the water vapor inside it turns into clouds." },
    ],
    details: [
      { note: "Sun heats land faster than water", lesson: "B" },
      { note: "warm air rises → low pressure", lesson: "A" },
      { note: "cooler bay air moves in = sea breeze", lesson: "B" },
      { note: "rising air cools → vapor condenses", lesson: "C" },
      { note: "clouds form → rain falls", lesson: "C" },
      { note: "cold front pushes warm air up fast", lesson: "D" },
    ],
    distractors: ["thermometers measure temperature", "Sandy Point is a state park"],
    conclusion: {
      l1_2: "So the [Sun] causes the [storm].",
      l3_4: "As a result of [rising warm air], the weather [changes] from [sunny] to [stormy].",
      l5_6: "Therefore, a chain of causes, from [the Sun's heat] to [rising air] to [condensation], leads to [the sudden storm] over Baltimore.",
    },
  },
  prompt: {
    l1_2: "Draw the Sun, a cloud, and rain. Write 3 sentences. Tell what causes the clouds. Use the word because.",
    l3_4: "Write a paragraph that explains why a sunny morning on the Chesapeake Bay can turn into a stormy afternoon. Use because, causes, and as a result.",
    l5_6: "Write a paragraph that explains the chain of causes and effects that turns a hot, sunny day over the bay into a thunderstorm. Use air pressure, humidity, and a front. Include an appositive and a sentence that starts with when, as, or after.",
  },
  transitions: ["First,", "Because", "This causes", "As a result,", "When", "Then,", "This leads to", "Finally,"],
  model: {
    l1_2: "The Sun heats the land. Warm air rises and cools. As a result, clouds form and rain falls.",
    l3_4: "On a hot afternoon, rising warm air causes low air pressure, and as a result clouds and storms can form. First, the Sun heats the land faster than the water. The warm air over the land rises, so cooler air moves in from the bay. When the rising air cools, its water vapor condenses into clouds. A cold front can then push the warm air up even faster. This leads to thunderstorms over Baltimore.",
    l5_6: "Because the Sun heats the land faster than the Chesapeake Bay, a sunny morning can turn into a stormy afternoon. The warm air over the land rises, which lowers the air pressure at the ground. As warm, humid air rises and cools, its water vapor condenses into clouds. Meanwhile, cooler air from over the bay moves in as a sea breeze. A cold front, the boundary where cold air pushes under warm air, forces the warm air upward even faster. As a result, tall clouds build, and thunderstorms drench Baltimore. After the front passes, the temperature drops and the sky clears.",
  },
  mpo: {
    thesis: "A chain of causes, from the Sun's heat to rising air to a cold front, turns a sunny morning on the Chesapeake Bay into a stormy afternoon.",
    paragraphs: [
      { topic: "Uneven heating causes rising air, low pressure, and a sea breeze.", notes: ["Sun heats land faster", "warm air rises → low pressure", "cooler bay air moves in"] },
      { topic: "Rising air cools, so water vapor turns into clouds and rain.", notes: ["rising air cools", "water vapor condenses", "clouds → precipitation"] },
      { topic: "A cold front speeds up the lifting and brings thunderstorms.", notes: ["cold dense air under warm air", "warm air rises fast", "storms, then cooler air"] },
    ],
    conclusion: "Each cause in the chain leads to the next effect, so one sunny afternoon can end in a storm.",
  },
  revise: [
    "Did I name a cause and then the effect it produces, in the right order?",
    "Did I use because, causes, leads to, or as a result to link them?",
    "Did I use air pressure, humidity, or condensation correctly at least once?",
    "Did I use a Maryland detail, such as the Chesapeake Bay or Baltimore?",
  ],
};
