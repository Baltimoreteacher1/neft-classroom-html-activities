// BCPSS Writing Lab (TWR) — g5-sci-u3 · Earth's Systems & Human Impact. Contract: ../writing-schema.mjs

export default {
  title: "Rain, Mud, and the Harbor",
  genre: "explain",
  tip: "Have students draw the chain from rain to harbor as linked boxes and label each box with the Earth system it belongs to.",
  lessons: [
    { id: "A", title: "Four Earth systems: geosphere, hydrosphere, atmosphere, biosphere" },
    { id: "B", title: "How Earth's systems interact" },
    { id: "C", title: "Erosion and runoff" },
    { id: "D", title: "Protecting our water and our watershed" },
  ],
  source: {
    title: "After the Storm",
    lesson: "C",
    text: "A strong storm drops heavy rain on Baltimore. The rain falls on bare dirt beside a stream and washes soil downhill. This runoff carries mud and trash into storm drains. The drains empty into the Jones Falls, a stream that flows to the Inner Harbor. The muddy water blocks sunlight, so underwater grasses cannot grow well. As a result, fewer crabs and fish have places to hide. Planting grass and trees on bare ground can slow the runoff, so people can protect the water.",
  },
  notes: [
    { sentence: "The rain falls on bare dirt beside a stream and washes soil downhill.", note: "rain + bare dirt → soil washes away" },
    { sentence: "This runoff carries mud and trash into storm drains.", note: "runoff → mud + trash in drains" },
    { sentence: "The muddy water blocks sunlight, so underwater grasses cannot grow well.", note: "mud blocks sunlight → grasses struggle" },
    { sentence: "Planting grass and trees on bare ground can slow the runoff, so people can protect the water.", note: "plant grass + trees → slow runoff" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Rain is part of the hydrosphere",
      because: "the hydrosphere includes all the water on Earth.",
      but: "rain also falls through the atmosphere.",
      so: "one raindrop touches more than one Earth system.",
    },
    {
      lesson: "C",
      kernel: "Heavy rain washes soil off bare ground",
      because: "no plants hold the soil in place.",
      but: "grass roots hold soil on a covered hill.",
      so: "bare ground erodes faster than covered ground.",
    },
    {
      lesson: "D",
      kernel: "A trash wheel keeps litter out of the harbor",
      because: "moving water turns the wheel and lifts trash onto a belt.",
      but: "it cannot stop all of the pollution.",
      so: "people also need to keep litter off the streets.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Rain washed soil.",
      parts: { when: "during the storm", how: "down the bare hill", where: "into the stream", why: "because no plants held it" },
      model: "During the storm, rain washed soil down the bare hill into the stream because no plants held it.",
    },
    {
      lesson: "D",
      kernel: "Students planted grass.",
      parts: { when: "last spring", where: "behind the playground", why: "to slow the runoff" },
      model: "Last spring, students planted grass behind the playground to slow the runoff.",
    },
  ],
  fragments: [
    { text: "Runoff is rainwater that flows over the ground.", is_sentence: true },
    { text: "Because the ground was bare.", is_sentence: false, fix: "The soil washed away because the ground was bare." },
    { text: "The Jones Falls flows to the Inner Harbor.", is_sentence: true },
    { text: "Carries trash into the storm drain.", is_sentence: false, fix: "The runoff carries trash into the storm drain." },
    { text: "When heavy rain falls on bare dirt.", is_sentence: false, fix: "Soil washes away when heavy rain falls on bare dirt." },
    { text: "A watershed, all the land that drains to the same river.", is_sentence: false, fix: "A watershed is all the land that drains to the same river." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The hydrosphere, ___, includes the Chesapeake Bay.",
      noun: "hydrosphere",
      options: ["all the water on Earth", "all of Earth's solid parts", "the layer of air around Earth"],
      answer: 0,
      model: "The hydrosphere, all the water on Earth, includes the Chesapeake Bay.",
    },
    {
      lesson: "C",
      sentence: "Erosion, ___, can carry soil into a stream.",
      noun: "Erosion",
      options: ["harmful materials that make water dirty", "the slow wearing away and moving of rock and soil", "all the land where rain drains to the same bay"],
      answer: 1,
      model: "Erosion, the slow wearing away and moving of rock and soil, can carry soil into a stream.",
    },
    {
      lesson: "D",
      sentence: "The Jones Falls watershed, ___, sends rain to the Inner Harbor.",
      noun: "watershed",
      options: ["rainwater that flows over the ground", "a living thing that breaks down dead plants", "all the land where rain and streams drain to the same place"],
      answer: 2,
      model: "The Jones Falls watershed, all the land where rain and streams drain to the same place, sends rain to the Inner Harbor.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "the hydrosphere affects the geosphere", model: "When heavy rain falls on a hill, the hydrosphere affects the geosphere." },
    { lesson: "C", conjunction: "because", stem: "bare ground erodes faster", model: "Because no roots hold the soil, bare ground erodes faster." },
    { lesson: "D", conjunction: "if", stem: "less trash reaches the Bay", model: "If a trash wheel catches litter, less trash reaches the Bay." },
  ],
  spo: {
    topic: {
      l1_2: "Heavy rain [causes] muddy water in the [stream].",
      l3_4: "Heavy rain causes [erosion and runoff] because [bare soil has no plants to hold it].",
      l5_6: "Although [rain is part of the hydrosphere], it [changes the geosphere] and [harms the biosphere] when [it washes bare soil into a stream].",
    },
    starters: [
      { type: "question", text: "What happens to a stream when heavy rain hits bare dirt?" },
      { type: "subordinate", text: "When heavy rain falls on bare soil, a chain of effects begins." },
      { type: "statement", text: "Rain, soil, plants, and air affect each other every day." },
    ],
    details: [
      { note: "heavy rain + bare dirt → erosion", lesson: "C" },
      { note: "runoff carries mud + trash to drains", lesson: "C" },
      { note: "drains → Jones Falls → Inner Harbor", lesson: "B" },
      { note: "mud blocks sunlight → grasses struggle", lesson: "B" },
      { note: "fewer hiding places for crabs + fish", lesson: "A" },
      { note: "plant grass + trees → slow runoff", lesson: "D" },
    ],
    distractors: ["the Inner Harbor has paddle boats", "Baltimore gets snow in winter"],
    conclusion: {
      l1_2: "People can [protect] the [water].",
      l3_4: "As a result, [people] can protect the Bay by [planting grass], so [less mud reaches the stream].",
      l5_6: "Therefore, [protecting water means helping all four Earth systems], because [a change in one system leads to changes in the others].",
    },
  },
  prompt: {
    l1_2: "Draw the storm, the hill, and the stream. Write 2-4 sentences. Tell what the rain causes and one way to help.",
    l3_4: "Write a paragraph that explains what happens when heavy rain falls on bare soil beside a stream. Use your outline, causes, leads to, and as a result.",
    l5_6: "Write a paragraph that explains how heavy rain on bare soil affects the Earth's systems and what people can do to protect the water. Include an appositive and a sentence that starts with when or although.",
  },
  transitions: ["First,", "This causes", "This leads to", "As a result,", "Because", "So", "Therefore,", "Finally,"],
  model: {
    l1_2: "Heavy rain washes soil into a stream. The water turns muddy. Planting grass can help.",
    l3_4: "Heavy rain causes erosion and runoff because bare soil has no plants to hold it. The runoff carries mud and trash into storm drains, and the drains flow into the Jones Falls. This leads to muddy water that blocks sunlight, so underwater grasses cannot grow well. As a result, fewer crabs and fish have places to hide. People can protect the water by planting grass, so less mud reaches the stream.",
    l5_6: "Although rain is part of the hydrosphere, it can change the geosphere and harm the biosphere. When heavy rain falls on bare dirt, it causes erosion, the slow wearing away and moving of soil. The runoff carries mud and trash into storm drains, which empty into the Jones Falls and then the Inner Harbor. This leads to muddy water that blocks sunlight, so underwater grasses cannot grow well. As a result, fewer crabs and fish have places to hide. Therefore, people can protect the water by planting grass and trees, because plants slow the runoff.",
  },
  mpo: {
    thesis: "Rain, soil, living things, and air affect each other, and people can protect our water by understanding those effects.",
    paragraphs: [
      { topic: "Heavy rain on bare soil causes erosion and runoff.", notes: ["rain + bare dirt → erosion", "runoff carries mud + trash"] },
      { topic: "Runoff changes the water and the living things in it.", notes: ["mud blocks sunlight", "grasses struggle", "fewer hiding places for crabs"] },
      { topic: "People can protect the water by acting on the causes.", notes: ["plant grass + trees", "trash wheel catches litter", "keep litter off streets"] },
    ],
    conclusion: "Because every Earth system affects the others, small actions on land, like planting grass, lead to cleaner water in the Bay.",
  },
  revise: [
    "Did I name a cause and show the effect it leads to?",
    "Did I name at least two Earth systems that interact, such as the hydrosphere and the geosphere?",
    "Did I use causes, leads to, or as a result to link each cause to its effect?",
    "Did I tell one way people can protect the water?",
  ],
};
