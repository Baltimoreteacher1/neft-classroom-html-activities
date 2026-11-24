// BCPSS Writing Lab (TWR) — g5-sci-u4 · Earth's Place in the Universe. Contract: ../writing-schema.mjs

export default {
  title: "Why the Sun Outshines Sirius",
  genre: "inform",
  tip: "Hold up two flashlights, one near and one far, so students see the contrast before they write both and whereas sentences.",
  lessons: [
    { id: "A", title: "Gravity pulls objects toward Earth" },
    { id: "B", title: "Earth's rotation, day and night, and shadows" },
    { id: "C", title: "Earth's orbit and the stars of each season" },
    { id: "D", title: "Why the Sun looks brighter than other stars" },
  ],
  source: {
    title: "Two Streetlights, Two Stars",
    lesson: "D",
    text: "Imagine two streetlights on a Baltimore street. One stands outside your window, and the other stands ten blocks away. Both streetlights give off light, but the close one looks much brighter. Stars work in the same way. The Sun is the closest star to Earth, so it looks very bright. Sirius is the brightest star in the night sky, yet it looks like a tiny dot. In fact, Sirius gives off more light than the Sun does. However, Sirius is much farther away, so its light looks faint.",
  },
  notes: [
    { sentence: "Both streetlights give off light, but the close one looks much brighter.", note: "both give light; close = brighter" },
    { sentence: "The Sun is the closest star to Earth, so it looks very bright.", note: "Sun = closest star → very bright" },
    { sentence: "Sirius is the brightest star in the night sky, yet it looks like a tiny dot.", note: "Sirius: brightest night star, tiny dot" },
    { sentence: "In fact, Sirius gives off more light than the Sun does.", note: "Sirius gives off more light" },
  ],
  bbs: [
    {
      lesson: "D",
      kernel: "The Sun looks brighter than Sirius",
      because: "the Sun is much closer to Earth.",
      but: "Sirius gives off more light than the Sun.",
      so: "a star's apparent brightness depends on its distance.",
    },
    {
      lesson: "B",
      kernel: "A shadow gets shorter near noon",
      because: "the Sun is higher in the sky.",
      but: "the shadow grows long again in the afternoon.",
      so: "the shadow seems to move as Earth rotates.",
    },
    {
      lesson: "A",
      kernel: "Gravity pulls a ball toward the ground",
      because: "gravity pulls objects toward the center of Earth.",
      but: "the ball moves up first when it is thrown.",
      so: "the ball always comes back down.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Kiara measured the shadow.",
      parts: { when: "at noon", where: "on the schoolyard", how: "with a ruler", why: "to see how it changed" },
      model: "At noon, Kiara measured the shadow on the schoolyard with a ruler to see how it changed.",
    },
    {
      lesson: "C",
      kernel: "Omar saw Orion.",
      parts: { when: "on a winter evening", where: "above the rowhouses", how: "without a telescope" },
      model: "On a winter evening, Omar saw Orion above the rowhouses without a telescope.",
    },
  ],
  fragments: [
    { text: "Sirius is the brightest star in the night sky.", is_sentence: true },
    { text: "Because the Sun is closer.", is_sentence: false, fix: "The Sun looks brighter because the Sun is closer." },
    { text: "Gravity pulls objects toward Earth.", is_sentence: true },
    { text: "Which gives off more light than the Sun.", is_sentence: false, fix: "Sirius is a star that gives off more light than the Sun." },
    { text: "Spins on its axis once each day.", is_sentence: false, fix: "Earth spins on its axis once each day." },
    { text: "While the shadow is long in the morning.", is_sentence: false, fix: "While the shadow is long in the morning, it is short at noon." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Gravity, ___, pulls a dropped ball toward the ground.",
      noun: "Gravity",
      options: ["a force that pulls objects toward the center of Earth", "one full turn of Earth on its axis", "a dark area made when an object blocks light"],
      answer: 0,
      model: "Gravity, a force that pulls objects toward the center of Earth, pulls a dropped ball toward the ground.",
    },
    {
      lesson: "C",
      sentence: "A constellation, ___, can change with the seasons.",
      noun: "constellation",
      options: ["the path an object takes around another object", "a group of stars that forms a pattern in the sky", "a huge ball of hot, glowing gas"],
      answer: 1,
      model: "A constellation, a group of stars that forms a pattern in the sky, can change with the seasons.",
    },
    {
      lesson: "D",
      sentence: "Apparent brightness, ___, depends on distance.",
      noun: "Apparent brightness",
      options: ["how far one place or object is from another", "a huge ball of hot, glowing gas that makes its own light", "how bright a star looks to us from Earth"],
      answer: 2,
      model: "Apparent brightness, how bright a star looks to us from Earth, depends on distance.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "the shadow is short", model: "When the Sun is high at noon, the shadow is short." },
    { lesson: "C", conjunction: "because", stem: "the night sky changes with the seasons", model: "Because Earth orbits the Sun, the night sky changes with the seasons." },
    { lesson: "D", conjunction: "although", stem: "Sirius looks like a tiny dot", model: "Although Sirius gives off more light than the Sun, Sirius looks like a tiny dot." },
  ],
  spo: {
    topic: {
      l1_2: "Both the [Sun] and [Sirius] are [stars], but the Sun looks [brighter].",
      l3_4: "Both the [Sun] and [Sirius] give off light, but the [Sun] looks brighter because [it is much closer].",
      l5_6: "Although [Sirius gives off more light than the Sun], the Sun looks brighter because [distance changes how bright a star appears].",
    },
    starters: [
      { type: "question", text: "Why does a star that gives off more light look dimmer than the Sun?" },
      { type: "appositive", text: "The Sun, the closest star to Earth, looks far brighter than any star in the night sky." },
      { type: "subordinate", text: "Although Sirius is the brightest star at night, it looks tiny next to the Sun." },
    ],
    details: [
      { note: "both Sun + Sirius = stars", lesson: "D" },
      { note: "Sun = closest star to Earth", lesson: "D" },
      { note: "Sirius gives off more light", lesson: "D" },
      { note: "Sirius much farther → looks faint", lesson: "D" },
      { note: "Sun shines by day: Earth rotates", lesson: "B" },
      { note: "Sirius shines on winter evenings", lesson: "C" },
    ],
    distractors: ["gravity pulls a dropped ball down", "shadows are longest in the morning"],
    conclusion: {
      l1_2: "Distance makes the [Sun] look [brighter].",
      l3_4: "In contrast, [Sirius] looks [faint] because [it is much farther away].",
      l5_6: "Therefore, [apparent brightness] depends on distance as well as on how much light a star gives off, so [the closest star] wins in our sky.",
    },
  },
  prompt: {
    l1_2: "Draw the Sun and Sirius. Write 2-4 sentences. Tell one way they are alike and one way they are different.",
    l3_4: "Write a paragraph that compares the Sun and Sirius and tells why the Sun looks brighter. Use your outline, both, but, and whereas.",
    l5_6: "Write a paragraph that compares the Sun and Sirius and explains how distance changes how bright a star looks. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["Both", "Similarly,", "However,", "In contrast,", "Whereas", "Although", "Because", "Therefore,"],
  model: {
    l1_2: "The Sun and Sirius are both stars. The Sun looks brighter. It is much closer to Earth.",
    l3_4: "Both the Sun and Sirius give off light, but the Sun looks much brighter because it is much closer to Earth. The Sun is the closest star, so it shines like a giant lamp. In contrast, Sirius is the brightest star in the night sky, yet it looks like a tiny dot. Sirius is much farther away, so its light looks faint. Distance changes how bright a star looks.",
    l5_6: "Although Sirius gives off more light than the Sun, the Sun looks far brighter in our sky. The Sun, the closest star to Earth, is like a streetlight outside your window. In contrast, Sirius is like a streetlight ten blocks away. Both stars give off light, whereas their distances from Earth are very different. Because Sirius is so far away, its light looks faint when it reaches us. Therefore, apparent brightness depends on distance as well as on how much light a star gives off.",
  },
  mpo: {
    thesis: "The Sun and Sirius are both stars, but the Sun looks much brighter than Sirius because it is much closer to Earth.",
    paragraphs: [
      { topic: "The Sun and Sirius are alike in important ways.", notes: ["both = stars", "both give off light", "Sirius gives off more light"] },
      { topic: "The two stars are very different in distance.", notes: ["Sun = closest star", "Sirius much farther away", "Sun by day; Sirius at night"] },
      { topic: "Distance explains the difference in brightness.", notes: ["close streetlight looks brighter", "far light looks faint", "apparent brightness depends on distance"] },
    ],
    conclusion: "Comparing the Sun and Sirius shows that how bright a star looks depends on its distance, not only on how much light it gives off.",
  },
  revise: [
    "Did I name one way the Sun and Sirius are alike and one way they are different?",
    "Did I use both, but, whereas, or in contrast to show the comparison?",
    "Did I explain why the Sun looks brighter, using the word distance?",
    "Did I use science words like star, apparent brightness, and gives off light correctly?",
  ],
};
