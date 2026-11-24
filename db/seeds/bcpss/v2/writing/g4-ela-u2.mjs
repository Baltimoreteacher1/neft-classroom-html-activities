// BCPSS Writing Lab (TWR) — g4-ela-u2 · Extreme Settings. Contract: ../writing-schema.mjs

export default {
  title: "Night in the Storm",
  genre: "narrate",
  tip: "Ask students to name the problem, the attempt, and the result aloud before drafting so the story arc is set.",
  lessons: [
    { id: "A", title: "How living things adapt to extreme places" },
    { id: "B", title: "A boy alone in the wilderness in Hatchet" },
    { id: "C", title: "Problem, attempt, and outcome" },
    { id: "D", title: "Telling it with faced with, but, so, and as a result" },
  ],
  source: {
    title: "Storm on the Trail",
    lesson: "C",
    text: "Mateo and his dad were hiking in western Maryland when a snowstorm hit. Wind blew snow across the trail, and they could not see the path. Faced with the cold, Mateo gathered pine branches and built a lean-to against a fallen log. He tried to start a fire, but the wood was wet. Then he peeled dry bark from under a log, and a small flame caught. As a result, they stayed warm all night. In the morning, a ranger followed their smoke and found them.",
  },
  notes: [
    { sentence: "Wind blew snow across the trail, and they could not see the path.", note: "wind + snow → can't see path" },
    { sentence: "Mateo gathered pine branches and built a lean-to against a fallen log.", note: "branches + log → lean-to" },
    { sentence: "He tried to start a fire, but the wood was wet.", note: "fire try, but wet wood" },
    { sentence: "In the morning, a ranger followed their smoke and found them.", note: "smoke → ranger found them" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Mateo tried to start a fire",
      because: "he needed heat to stay warm in the storm.",
      but: "the wood was too wet to burn.",
      so: "smoke rose above the trees for the ranger to see.",
    },
    {
      lesson: "A",
      kernel: "A kangaroo rat can live in the desert",
      because: "it gets water from the seeds it eats.",
      but: "most animals need to drink water often.",
      so: "it can survive where rain almost never falls.",
    },
    {
      lesson: "B",
      kernel: "Brian stayed alive in the wilderness",
      because: "he kept trying new ideas when old ones failed.",
      but: "he had never lived in the wilderness before.",
      so: "readers see how problems can make a person more resourceful.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "Mateo built a shelter.",
      parts: { when: "as the storm grew worse", where: "against a fallen log", how: "with pine branches", why: "to block the wind" },
      model: "As the storm grew worse, Mateo built a shelter against a fallen log with pine branches to block the wind.",
    },
    {
      lesson: "C",
      kernel: "The ranger found them.",
      parts: { when: "in the morning", where: "on the snowy trail", how: "by following their smoke" },
      model: "In the morning, the ranger found them on the snowy trail by following their smoke.",
    },
  ],
  fragments: [
    { text: "The wind blew snow across the trail.", is_sentence: true },
    { text: "Built a shelter from branches.", is_sentence: false, fix: "Mateo built a shelter from branches." },
    { text: "Because the wood was wet.", is_sentence: false, fix: "The fire would not start because the wood was wet." },
    { text: "A ranger found them in the morning.", is_sentence: true },
    { text: "When the storm finally ended.", is_sentence: false, fix: "When the storm finally ended, they walked home." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The kangaroo rat, ___, gets water from the seeds it eats.",
      noun: "kangaroo rat",
      options: ["a safe place under a rock ledge", "a small animal of the desert", "a strong wind that blows snow"],
      answer: 1,
      model: "The kangaroo rat, a small animal of the desert, gets water from the seeds it eats.",
    },
    {
      lesson: "C",
      sentence: "A lean-to, ___, kept the wind off Mateo and his dad.",
      noun: "lean-to",
      options: ["a simple shelter made from branches", "a hot and dry place with little rain", "the main problem in a story"],
      answer: 0,
      model: "A lean-to, a simple shelter made from branches, kept the wind off Mateo and his dad.",
    },
    {
      lesson: "B",
      sentence: "Brian, ___, had to find food and shelter alone.",
      noun: "Brian",
      options: ["a ranger on a snowy trail", "a camel that crosses the sand", "a boy stranded in the wilderness"],
      answer: 2,
      model: "Brian, a boy stranded in the wilderness, had to find food and shelter alone.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "when", stem: "Mateo and his dad could not see the path", model: "When the wind blew snow across the trail, Mateo and his dad could not see the path." },
    { lesson: "A", conjunction: "although", stem: "a kangaroo rat finds water in the seeds it eats", model: "Although a desert gets very little rain, a kangaroo rat finds water in the seeds it eats." },
    { lesson: "B", conjunction: "because", stem: "Brian stayed alive in the wilderness", model: "Because he kept trying new ideas, Brian stayed alive in the wilderness." },
  ],
  spo: {
    topic: {
      l1_2: "[Mateo] faced a [storm].",
      l3_4: "Faced with a [snowstorm], [Mateo] [built a shelter and made a fire] to survive.",
      l5_6: "Although [a storm trapped him on the trail], [Mateo] solved each problem [with clever thinking], and as a result he survived.",
    },
    starters: [
      { type: "question", text: "What would you do if a snowstorm hid the trail?" },
      { type: "appositive", text: "Mateo, a brave hiker in western Maryland, faced a dangerous storm." },
      { type: "subordinate", text: "When the wind blew snow across the trail, Mateo knew he had to act." },
    ],
    details: [
      { note: "storm → can't see path", lesson: "C" },
      { note: "built lean-to w/ branches + log", lesson: "C" },
      { note: "fire try, but wet wood", lesson: "C" },
      { note: "peeled dry bark → small flame", lesson: "D" },
      { note: "stayed warm all night", lesson: "D" },
      { note: "smoke → ranger found them", lesson: "D" },
    ],
    distractors: ["camels can go days without water", "ski lodges sell hot cocoa"],
    conclusion: {
      l1_2: "Mateo was [safe].",
      l3_4: "As a result, Mateo [stayed warm] and a ranger [found him].",
      l5_6: "Finally, Mateo's [quick thinking] turned a [dangerous night] into [a story of survival].",
    },
  },
  prompt: {
    l1_2: "Draw Mateo in the storm. Write 2-3 sentences about his problem and what he did. Use the words storm, shelter, and fire.",
    l3_4: "Write a story paragraph that tells Mateo's problem, what he tried, and how it ended. Use your outline, faced with, but, and as a result.",
    l5_6: "Write a story paragraph that traces the problem, the attempts, and the ending of Mateo's night in the storm. Include an appositive and a sentence that starts with when or although.",
  },
  transitions: ["Faced with", "At first,", "But", "So", "Then", "As a result,", "Finally,", "In the morning,"],
  model: {
    l1_2: "A storm hit the trail. Mateo built a shelter. As a result, he stayed warm.",
    l3_4: "Faced with a snowstorm, Mateo built a shelter from branches. He tried to start a fire, but the wood was wet. So he peeled dry bark from under a log, and a small flame caught. As a result, Mateo stayed warm all night. In the morning, a ranger followed the smoke and found him.",
    l5_6: "Although a snowstorm trapped him on the trail, Mateo solved each problem with clever thinking. When the wind blew snow across the trail, he and his dad could not see the path. Faced with the cold, Mateo, a brave hiker in western Maryland, built a lean-to from pine branches against a fallen log. His first fire failed, but he peeled dry bark from under a log, and a small flame caught. As a result, they stayed warm until morning. Finally, a ranger spotted the smoke and led them safely home.",
  },
  revise: [
    "Did I tell the problem first and name what made it hard?",
    "Did I show what the character tried and what went wrong?",
    "Did I use but or so to connect the attempt to the result?",
    "Did I end with how the problem was solved, using as a result or finally?",
  ],
};
