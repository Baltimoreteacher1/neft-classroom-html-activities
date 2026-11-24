// BCPSS Writing Lab (TWR) — g7-sci-u2 · What Is Going On Inside Me? Contract: ../writing-schema.mjs

export default {
  title: "Oatmeal to Energy",
  genre: "explain",
  tip: "Have students trace the path with a finger on a body diagram and say First, Next, Then, Finally at each stop before they write.",
  lessons: [
    { id: "A", title: "Digestion breaks food into nutrients" },
    { id: "B", title: "Absorbing glucose into the blood" },
    { id: "C", title: "Circulatory and respiratory systems deliver materials" },
    { id: "D", title: "Cellular respiration releases energy" },
  ],
  source: {
    title: "Nia's Energy Trip",
    lesson: "C",
    text: "Nia eats a bowl of oatmeal before basketball practice. First, her teeth chew the oatmeal, and saliva begins to break down the starch. Next, her stomach churns the food, and the small intestine breaks it into glucose. The glucose passes into her blood. Then her heart pumps the blood to every part of her body. At the same time, her lungs bring in oxygen, which also enters the blood. In her leg muscles, cells use the glucose and oxygen in cellular respiration. This releases energy, so Nia can run. Finally, her blood carries carbon dioxide back to the lungs, and she breathes it out.",
  },
  notes: [
    { sentence: "First, her teeth chew the oatmeal, and saliva begins to break down the starch.", note: "teeth chew; saliva breaks starch" },
    { sentence: "Next, her stomach churns the food, and the small intestine breaks it into glucose.", note: "stomach churns; small intestine → glucose" },
    { sentence: "Then her heart pumps the blood to every part of her body.", note: "heart pumps blood → all body parts" },
    { sentence: "In her leg muscles, cells use the glucose and oxygen in cellular respiration.", note: "muscle cells: glucose + O₂ → energy" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "The small intestine absorbs glucose into the blood",
      because: "its thin walls are packed with tiny blood vessels.",
      but: "the stomach only churns the food.",
      so: "the glucose can travel to every cell.",
    },
    {
      lesson: "C",
      kernel: "Nia's heart beats faster during practice",
      because: "her muscle cells need more glucose and oxygen.",
      but: "her heart rate slows down when she rests.",
      so: "the blood delivers materials to her muscles faster.",
    },
    {
      lesson: "D",
      kernel: "Muscle cells use oxygen together with glucose",
      because: "cellular respiration needs both to release energy.",
      but: "cells cannot release energy from oxygen alone.",
      so: "she breathes harder as she runs.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Saliva breaks down starch.",
      parts: { when: "as Nia chews her oatmeal", where: "in her mouth", why: "so the food can be digested further" },
      model: "As Nia chews her oatmeal, saliva breaks down starch in her mouth so the food can be digested further.",
    },
    {
      lesson: "C",
      kernel: "The heart pumps blood.",
      parts: { when: "during basketball practice", where: "to every muscle", how: "faster than at rest", why: "to deliver glucose and oxygen" },
      model: "During basketball practice, the heart pumps blood to every muscle faster than at rest to deliver glucose and oxygen.",
    },
  ],
  fragments: [
    { text: "The small intestine absorbs glucose into the blood.", is_sentence: true },
    { text: "Which carries oxygen to every cell.", is_sentence: false, fix: "The circulatory system, which carries oxygen to every cell, also carries glucose." },
    { text: "Because the cells need energy.", is_sentence: false, fix: "Nia breathes faster because her cells need energy." },
    { text: "Cellular respiration releases energy from glucose.", is_sentence: true },
    { text: "Breathes out carbon dioxide.", is_sentence: false, fix: "Nia breathes out carbon dioxide." },
    { text: "The lungs bring oxygen into the body.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "The small intestine, ___, absorbs glucose into the blood.",
      noun: "small intestine",
      options: ["a long tube where nutrients enter the blood", "the muscle that pumps blood to the body", "the gas that cells need to release energy"],
      answer: 0,
      model: "The small intestine, a long tube where nutrients enter the blood, absorbs glucose into the blood.",
    },
    {
      lesson: "C",
      sentence: "The heart, ___, pumps blood to every part of the body.",
      noun: "heart",
      options: ["a tube where nutrients are absorbed", "a muscle at the center of the circulatory system", "the airways that carry air to the lungs"],
      answer: 1,
      model: "The heart, a muscle at the center of the circulatory system, pumps blood to every part of the body.",
    },
    {
      lesson: "D",
      sentence: "Glucose, ___, is the fuel that cells use.",
      noun: "Glucose",
      options: ["a gas made when cells release energy", "the process that breaks food into tiny pieces", "a simple sugar molecule"],
      answer: 2,
      model: "Glucose, a simple sugar molecule, is the fuel that cells use.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "saliva begins to break down the starch", model: "When Nia chews her oatmeal, saliva begins to break down the starch." },
    { lesson: "B", conjunction: "after", stem: "the glucose passes into her blood", model: "After the small intestine breaks the food into glucose, the glucose passes into her blood." },
    { lesson: "C", conjunction: "because", stem: "her lungs take in more air", model: "Because her muscle cells need more oxygen, her lungs take in more air." },
  ],
  spo: {
    topic: {
      l1_2: "A bite of [oatmeal] gives [energy] to Nia's [muscles].",
      l3_4: "Oatmeal gives Nia energy through a process that starts with [digestion], then [circulation], and ends with [cellular respiration].",
      l5_6: "Before [Nia] can run, [the digestive, circulatory, and respiratory systems] must work together so that [her cells] receive [glucose and oxygen] for [cellular respiration].",
    },
    starters: [
      { type: "question", text: "How does one bowl of oatmeal turn into the energy to sprint down a basketball court?" },
      { type: "statement", text: "Three body systems work as a team to turn food into energy." },
      { type: "subordinate", text: "Before Nia can run, her body has to move glucose and oxygen to her muscle cells." },
    ],
    details: [
      { note: "teeth chew; saliva breaks starch", lesson: "A" },
      { note: "small intestine → glucose into blood", lesson: "B" },
      { note: "heart pumps blood to every cell", lesson: "C" },
      { note: "lungs bring in O₂ → blood", lesson: "C" },
      { note: "muscle cells: glucose + O₂ → energy", lesson: "D" },
      { note: "blood carries CO₂ back; exhale", lesson: "D" },
    ],
    distractors: ["oatmeal is made from oats", "basketball teams have five players"],
    conclusion: {
      l1_2: "So the [oatmeal] became [energy] for Nia.",
      l3_4: "As a result, Nia's cells [release energy] from [glucose and oxygen], and she can [run down the court].",
      l5_6: "As a result, [three body systems] turned [one bowl of oatmeal] into [the energy] that moves Nia's muscles.",
    },
  },
  prompt: {
    l1_2: "Draw Nia and her oatmeal. Write 3 sentences about how the food gives her energy. Use First, Next, and Finally.",
    l3_4: "Write a paragraph that explains how a bowl of oatmeal gives Nia the energy to run. Name the body systems, and use First, Next, Then, and Finally.",
    l5_6: "Write a paragraph that explains how the digestive, circulatory, and respiratory systems work together so Nia's muscle cells can release energy. Name the molecules. Include an appositive and a sentence that starts with when, after, or because.",
  },
  transitions: ["First,", "Next,", "Then,", "At the same time,", "After that,", "As a result,", "Finally,", "So that"],
  model: {
    l1_2: "First, Nia chews oatmeal. Next, her blood carries glucose to her muscles. Finally, her cells release energy.",
    l3_4: "Oatmeal gives Nia energy through a process that starts with digestion, then circulation, and ends with cellular respiration. First, her teeth chew the oatmeal, and saliva begins to break down the starch. Next, the small intestine absorbs glucose into her blood. Then her heart pumps the blood to every part of her body, and her lungs bring in oxygen. Finally, her muscle cells use glucose and oxygen to release energy. As a result, Nia can run down the court.",
    l5_6: "Before Nia can run, the digestive, circulatory, and respiratory systems must work together so her cells receive glucose and oxygen. First, her teeth chew the oatmeal, and saliva begins to break down the starch. Next, the small intestine, a long tube where nutrients enter the blood, absorbs glucose. Then her heart pumps that blood to every muscle. At the same time, her lungs bring in oxygen, which also enters the blood. After the glucose and oxygen reach a muscle cell, the cell uses them in cellular respiration to release energy. Finally, the blood carries carbon dioxide back to the lungs, and Nia breathes it out. As a result, one bowl of oatmeal becomes the energy for a sprint.",
  },
  mpo: {
    thesis: "Three body systems work together in order so that the food Nia eats becomes the energy her muscle cells use to move.",
    paragraphs: [
      { topic: "The digestive system breaks food down and absorbs glucose into the blood.", notes: ["teeth chew; saliva breaks starch", "stomach churns", "small intestine → glucose into blood"] },
      { topic: "The circulatory and respiratory systems deliver glucose and oxygen to every cell.", notes: ["heart pumps blood", "lungs bring in O₂", "blood reaches muscle cells"] },
      { topic: "Cellular respiration releases the energy and makes carbon dioxide as a waste.", notes: ["glucose + O₂ → energy", "CO₂ made", "blood carries CO₂ to lungs; exhale"] },
    ],
    conclusion: "Each system does one job in order, and if any one stopped, Nia's cells would not get what they need to release energy.",
  },
  revise: [
    "Did I put the steps in the order food and oxygen really travel?",
    "Did I use action verbs like absorbs, pumps, and carries, and name the right organ for each?",
    "Did I name both glucose and oxygen and tell where each one goes?",
    "Did I use First, Next, Then, and Finally to make the order clear?",
  ],
};
