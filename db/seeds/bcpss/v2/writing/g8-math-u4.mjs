// BCPSS Writing Lab (TWR) — g8-math-u4 · Transformations, Congruence & Similarity. Contract: ../writing-schema.mjs

export default {
  title: "Slide, Flip, Stretch",
  genre: "explain",
  tip: "Have students move a paper triangle through each step on a grid and say first, next, then before they write.",
  lessons: [
    { id: "A", title: "Translations, reflections, and rotations" },
    { id: "B", title: "Congruence from rigid motions" },
    { id: "C", title: "Dilations and scale factor" },
    { id: "D", title: "Similarity from a sequence of moves" },
  ],
  source: {
    title: "Kai's Kayak Club Logo",
    lesson: "A",
    text: "Kai designs a logo for the Inner Harbor kayak club on a coordinate grid. The first shape is triangle JKL with J(1, 1), K(3, 1), and L(1, 4). First, he translates the triangle 4 units to the right, so J moves to (5, 1). Next, he reflects the new triangle across the x-axis, so J becomes (5, −1). These two moves keep every length and angle the same, so the image is congruent to triangle JKL. Then he dilates the triangle from the origin with a scale factor of 2, so J lands at (10, −2). As a result, every side is twice as long, and the new triangle is similar to triangle JKL.",
  },
  notes: [
    { sentence: "First, he translates the triangle 4 units to the right, so J moves to (5, 1).", note: "1st: translate 4 right → J(5, 1)" },
    { sentence: "Next, he reflects the new triangle across the x-axis, so J becomes (5, −1).", note: "2nd: reflect x-axis → J(5, −1)" },
    { sentence: "These two moves keep every length and angle the same, so the image is congruent to triangle JKL.", note: "slide + flip = same size → congruent" },
    { sentence: "As a result, every side is twice as long, and the new triangle is similar to triangle JKL.", note: "dilation × 2 → sides 2× → similar" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Kai translates the triangle 4 units to the right",
      because: "he wants a copy of the shape in a new place.",
      but: "the slide does not change its size or shape.",
      so: "the new triangle is congruent to the old one.",
    },
    {
      lesson: "C",
      kernel: "A dilation with a scale factor of 2 changes the triangle",
      because: "every side length is multiplied by 2.",
      but: "the angles stay exactly the same.",
      so: "the new triangle is similar, not congruent.",
    },
    {
      lesson: "B",
      kernel: "Reflections and rotations keep figures congruent",
      because: "they do not change any lengths or angles.",
      but: "they do change which way the figure faces.",
      so: "we can use them to match one figure onto another.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Kai reflects the triangle.",
      parts: { when: "after the slide", where: "across the x-axis", why: "so the logo faces downward" },
      model: "After the slide, Kai reflects the triangle across the x-axis so the logo faces downward.",
    },
    {
      lesson: "C",
      kernel: "Kai dilates the triangle.",
      parts: { when: "for the final step", how: "from the origin with a scale factor of 2", why: "to make a bigger logo" },
      model: "For the final step, Kai dilates the triangle from the origin with a scale factor of 2 to make a bigger logo.",
    },
  ],
  fragments: [
    { text: "A translation slides every point the same distance.", is_sentence: true },
    { text: "Then reflects the shape across the y-axis.", is_sentence: false, fix: "Then Kai reflects the shape across the y-axis." },
    { text: "A dilation changes the size of a figure.", is_sentence: true },
    { text: "Because the scale factor is 2.", is_sentence: false, fix: "Every side doubles because the scale factor is 2." },
    { text: "Congruent figures with the same size and shape.", is_sentence: false, fix: "Congruent figures have the same size and shape." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A translation, ___, does not change the size of a figure.",
      noun: "translation",
      options: ["a slide that moves every point the same distance in the same direction", "a flip across a line", "a turn around a fixed point"],
      answer: 0,
      model: "A translation, a slide that moves every point the same distance in the same direction, does not change the size of a figure.",
    },
    {
      lesson: "C",
      sentence: "A dilation, ___, multiplies every length by the scale factor.",
      noun: "dilation",
      options: ["a figure with exactly the same size and shape", "a transformation that makes a figure bigger or smaller", "a move that flips a figure across a line"],
      answer: 1,
      model: "A dilation, a transformation that makes a figure bigger or smaller, multiplies every length by the scale factor.",
    },
    {
      lesson: "B",
      sentence: "Congruent figures, ___, can be matched by slides, flips, and turns.",
      noun: "Congruent figures",
      options: ["figures with the same shape but different sizes", "the new figure after a transformation", "figures with exactly the same shape and size"],
      answer: 2,
      model: "Congruent figures, figures with exactly the same shape and size, can be matched by slides, flips, and turns.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "after", stem: "the new triangle is similar to the original", model: "After Kai dilates the triangle, the new triangle is similar to the original." },
    { lesson: "B", conjunction: "because", stem: "the slid triangle is congruent to the first", model: "Because translations keep every length the same, the slid triangle is congruent to the first." },
    { lesson: "C", conjunction: "if", stem: "a 4-inch side becomes 12 inches", model: "If the scale factor is 3, a 4-inch side becomes 12 inches." },
  ],
  spo: {
    topic: {
      l1_2: "Kai uses [slides], [flips], and a [resize] to match shapes.",
      l3_4: "To show that the final triangle is [similar], Kai moves the triangle in steps: first [translate], next [reflect], then [dilate].",
      l5_6: "Although [a translation and a reflection] keep the size the same, [a dilation] changes the size, so a sequence of moves can prove [congruence or similarity].",
    },
    starters: [
      { type: "question", text: "How can a few simple moves prove that two shapes match?" },
      { type: "command", text: "Picture a triangle sliding, flipping, and then growing on a grid." },
      { type: "subordinate", text: "When a figure only slides or flips, it stays the same size." },
    ],
    details: [
      { note: "translate 4 right: J(1, 1) → (5, 1)", lesson: "A" },
      { note: "reflect x-axis: (5, 1) → (5, −1)", lesson: "A" },
      { note: "slide + flip = same size, congruent", lesson: "B" },
      { note: "dilate × 2: (5, −1) → (10, −2)", lesson: "C" },
      { note: "sides 2× longer, angles same", lesson: "C" },
      { note: "same shape, different size = similar", lesson: "D" },
    ],
    distractors: ["the kayak club meets on Saturdays", "logos can be printed on T-shirts"],
    conclusion: {
      l1_2: "The new triangle is [similar] to the first.",
      l3_4: "As a result, the final triangle is [similar] because [the dilation made every side twice as long].",
      l5_6: "Because [the first two moves keep size and the last move changes it], the final triangle is [similar but not congruent] to the first.",
    },
  },
  prompt: {
    l1_2: "Look at triangle JKL and its new triangle. Write 3-4 sentences about the moves. Use first, next, and then.",
    l3_4: "Explain, step by step, how Kai moves triangle JKL until it is similar to the first triangle. Use first, next, then, and as a result.",
    l5_6: "Write a paragraph that explains the sequence of moves and proves the final triangle is similar but not congruent to triangle JKL. Include an appositive and a sentence that starts with after or because.",
  },
  transitions: ["First,", "Next,", "Then,", "After that,", "As a result,", "Because", "Finally,", "Therefore,"],
  model: {
    l1_2: "First, Kai slides the triangle 4 units to the right. Next, he flips it across the x-axis. Then he makes it 2 times bigger. The new triangle is similar.",
    l3_4: "Kai moves triangle JKL in three steps. First, he translates it 4 units to the right, so J moves from (1, 1) to (5, 1). Next, he reflects it across the x-axis, so J becomes (5, −1). These two moves keep the size the same, so the triangle is still congruent to JKL. Then he dilates it by a scale factor of 2, so J lands at (10, −2). As a result, the final triangle is similar to JKL.",
    l5_6: "To show that the final triangle is similar to triangle JKL, Kai uses a sequence of three moves. First, a translation, a slide of 4 units to the right, sends J(1, 1) to (5, 1). Next, a reflection across the x-axis flips the figure so that J becomes (5, −1). Because both moves keep every length and angle the same, the image is congruent to JKL. Then a dilation from the origin with a scale factor of 2 multiplies every coordinate by 2, so J lands at (10, −2). After the dilation, every side is twice as long, but the angles do not change. As a result, the final triangle has the same shape as JKL but a different size, so it is similar, not congruent.",
  },
  mpo: {
    thesis: "A sequence of slides, flips, turns, and resizes can prove that two figures are congruent or similar, because each move changes the figure in a predictable way.",
    paragraphs: [
      { topic: "Translations, reflections, and rotations keep the size the same, so they prove congruence.", notes: ["slide: J(1, 1) → (5, 1)", "flip across x-axis", "lengths + angles same"] },
      { topic: "A dilation changes the size by the scale factor, so it proves similarity.", notes: ["scale factor 2", "J(5, −1) → (10, −2)", "sides 2× longer"] },
      { topic: "Together, the moves show how the logo is similar to the first triangle.", notes: ["translate, reflect, dilate", "same shape, new size", "similar, not congruent"] },
    ],
    conclusion: "Slides, flips, and turns match figures exactly, and a dilation resizes them, so a chain of moves is a clear proof of how two figures are related.",
  },
  revise: [
    "Did I name each move in order with first, next, and then?",
    "Did I say what each move did to the coordinates, such as J moving to (5, 1)?",
    "Did I explain why the figures are congruent or similar, not just say it?",
    "Did I use the words scale factor and image correctly?",
  ],
};
