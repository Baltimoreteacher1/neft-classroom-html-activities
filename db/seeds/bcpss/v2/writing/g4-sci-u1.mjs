// BCPSS Writing Lab (TWR) — g4-sci-u1 · Energy Transfer & Collisions. Contract: ../writing-schema.mjs

export default {
  title: "Where Does the Energy Go?",
  genre: "explain",
  tip: "Have students trace the energy with arrows on a quick sketch before writing so every cause links to an effect.",
  lessons: [
    { id: "A", title: "Speed and energy" },
    { id: "B", title: "Energy transfer in collisions" },
    { id: "C", title: "Energy changes into sound, light, and heat" },
    { id: "D", title: "Electric circuits convert energy" },
  ],
  source: {
    title: "A Ramp at the Skate Park",
    lesson: "B",
    text: "Jaylen rolls down a ramp at a Baltimore skate park. The steeper the ramp, the faster his board goes, so it has more energy. At the bottom, the board bumps a foam block in a collision. Energy transfers from the board to the block, so the block slides away. Some energy also becomes sound, and Jaylen hears a thump. A little energy becomes heat, so the wheels feel warm. His helmet light works because it is a complete circuit. The battery sends electricity around the path, and the bulb converts that energy into light.",
  },
  notes: [
    { sentence: "The steeper the ramp, the faster his board goes, so it has more energy.", note: "steeper ramp → faster → + energy" },
    { sentence: "Energy transfers from the board to the block, so the block slides away.", note: "board → block: energy transfers" },
    { sentence: "Some energy also becomes sound, and Jaylen hears a thump.", note: "energy → sound = thump" },
    { sentence: "The battery sends electricity around the path, and the bulb converts that energy into light.", note: "battery → circuit → bulb = light" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Jaylen's board has more energy on the steep ramp",
      because: "it moves faster at the bottom.",
      but: "it is the same board he rode on the low ramp.",
      so: "the collision at the bottom will be stronger.",
    },
    {
      lesson: "B",
      kernel: "The foam block slides away after the collision",
      because: "the board transfers energy to it.",
      but: "it was sitting still before the board arrived.",
      so: "he can see that energy moved from the board to the block.",
    },
    {
      lesson: "D",
      kernel: "The helmet light glows",
      because: "the battery pushes electricity around a complete circuit.",
      but: "the light stays dark when the path has a gap.",
      so: "the circuit must be complete before the bulb can work.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The board bumped the block.",
      parts: { when: "at the bottom of the ramp", where: "on the smooth floor", how: "with a loud thump" },
      model: "At the bottom of the ramp, the board bumped the block on the smooth floor with a loud thump.",
    },
    {
      lesson: "D",
      kernel: "The light glows.",
      parts: { when: "after the wire connects", where: "on Jaylen's helmet", why: "because the circuit is complete" },
      model: "After the wire connects, the light glows on Jaylen's helmet because the circuit is complete.",
    },
  ],
  fragments: [
    { text: "The board has more energy on a steep ramp.", is_sentence: true },
    { text: "Slides across the floor.", is_sentence: false, fix: "The block slides across the floor." },
    { text: "Because the circuit is complete.", is_sentence: false, fix: "The light glows because the circuit is complete." },
    { text: "Some energy becomes sound.", is_sentence: true },
    { text: "When the board hits the block.", is_sentence: false, fix: "When the board hits the block, energy transfers to the block." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Speed, ___, helps decide how much energy the board has.",
      noun: "Speed",
      options: ["a measure of how fast something moves", "a complete path that electricity can flow around", "a time when two objects hit each other"],
      answer: 0,
      model: "Speed, a measure of how fast something moves, helps decide how much energy the board has.",
    },
    {
      lesson: "B",
      sentence: "A collision, ___, moved energy from the board to the block.",
      noun: "collision",
      options: ["a complete path that electricity can flow around", "a time when two objects hit each other", "the ability to make things move or change"],
      answer: 1,
      model: "A collision, a time when two objects hit each other, moved energy from the board to the block.",
    },
    {
      lesson: "D",
      sentence: "A circuit, ___, lets electricity light the bulb.",
      noun: "circuit",
      options: ["a time when two objects hit each other", "energy that moves from a warmer object to a cooler one", "a complete path that electricity can flow around"],
      answer: 2,
      model: "A circuit, a complete path that electricity can flow around, lets electricity light the bulb.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "because", stem: "the block slides away", model: "Because the board transfers energy to it, the block slides away." },
    { lesson: "C", conjunction: "when", stem: "Jaylen hears a thump", model: "When the board bumps the block, Jaylen hears a thump." },
    { lesson: "D", conjunction: "if", stem: "the helmet light stays dark", model: "If the path has a gap, the helmet light stays dark." },
  ],
  spo: {
    topic: {
      l1_2: "Energy [moves] when a [board] hits a [block].",
      l3_4: "Because Jaylen's board moved fast, the collision [transferred energy] to the block and [changed energy into sound and heat].",
      l5_6: "Although [a skateboard] cannot talk, its collision shows that [energy transfers and changes form], which caused [the block to slide and Jaylen to hear a thump].",
    },
    starters: [
      { type: "question", text: "What happens to the energy when a fast board hits a block?" },
      { type: "appositive", text: "Jaylen, a skater at a Baltimore park, rolled down a steep ramp." },
      { type: "subordinate", text: "When the board bumped the block, energy moved from one object to the other." },
    ],
    details: [
      { note: "steeper ramp → faster → + energy", lesson: "A" },
      { note: "board hits block = collision", lesson: "B" },
      { note: "energy: board → block", lesson: "B" },
      { note: "block slides away", lesson: "B" },
      { note: "some energy → sound (thump)", lesson: "C" },
      { note: "a little energy → heat", lesson: "C" },
    ],
    distractors: ["skate parks have concrete bowls", "helmets come in many colors"],
    conclusion: {
      l1_2: "So energy [moved] to the [block].",
      l3_4: "As a result, the [energy] moved from the board to the block and some became [sound].",
      l5_6: "Therefore, [the collision] shows that energy is not lost; it [moves to other objects and changes into other forms].",
    },
  },
  prompt: {
    l1_2: "Draw Jaylen's board hitting the block. Write 2-3 sentences that tell what happens to the energy. Use the words fast and energy.",
    l3_4: "Write a paragraph that explains what happens to the energy when Jaylen's fast board hits the block. Use your outline, because, so, and as a result.",
    l5_6: "Write a paragraph that explains how energy transfers and changes form when Jaylen's board hits the block. Include an appositive and a sentence that starts with when or because.",
  },
  transitions: ["Because", "So", "As a result,", "Therefore,", "This caused", "Then,", "For example,", "Finally,"],
  model: {
    l1_2: "Jaylen's board moves fast. It hits the block. The energy moves to the block.",
    l3_4: "Because Jaylen's board moved fast, the collision transferred energy to the block. As a result, the block slid across the floor. Some of the energy also changed into sound, so Jaylen heard a loud thump. A little energy became heat, so the wheels felt warm. Energy can move from one object to another and change form.",
    l5_6: "Jaylen, a skater at a Baltimore park, rolled down a steep ramp. The steeper the ramp, the faster his board went, so it had more energy. When the board bumped the foam block, energy transferred from the board to the block. As a result, the block slid away. Some energy also changed into sound, which caused the thump Jaylen heard. A little energy became heat, so the wheels felt warm. Therefore, the collision shows that energy moves from one object to another and changes form.",
  },
  revise: [
    "Did I name the cause and the effect with because, so, or as a result?",
    "Did I tell where the energy moved from and to?",
    "Did I name at least one new form of energy, such as sound or heat?",
    "Did I use science words like collision, transfer, and speed correctly?",
  ],
};
