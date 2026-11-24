// BCPSS Writing Lab (TWR) — g7-sci-u4 · Why Do Some Things Stop While Others Keep Going? Contract: ../writing-schema.mjs

export default {
  title: "Same Energy, New Form",
  genre: "inform",
  tip: "Have students fill a two-column chart for the top and the bottom of the ramp before they write a single comparing sentence.",
  lessons: [
    { id: "A", title: "Kinetic and potential energy" },
    { id: "B", title: "Elastic potential energy" },
    { id: "C", title: "Friction and thermal energy" },
    { id: "D", title: "Conservation of energy in a system" },
  ],
  source: {
    title: "Jamal at the Skate Park",
    lesson: "A",
    text: "Jamal rides a skateboard down a ramp at a Baltimore skate park. At the top, he stands still, so he has potential energy because of his height. As he rolls down, that potential energy changes into kinetic energy, and he speeds up. At the bottom, he has the most kinetic energy and the least potential energy. Friction in the wheels and the air turns some energy into thermal energy. In contrast, a rubber band in his backpack stores elastic potential energy when it is stretched. Jamal slows and stops, but the total energy has not disappeared. It has only changed form.",
  },
  notes: [
    { sentence: "At the top, he stands still, so he has potential energy because of his height.", note: "top: still, high → potential" },
    { sentence: "As he rolls down, that potential energy changes into kinetic energy, and he speeds up.", note: "potential → kinetic; speeds up" },
    { sentence: "At the bottom, he has the most kinetic energy and the least potential energy.", note: "bottom: most kinetic, least potential" },
    { sentence: "Friction in the wheels and the air turns some energy into thermal energy.", note: "friction → some thermal energy" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Jamal has potential energy at the top of the ramp",
      because: "he is high above the ground.",
      but: "he has almost no kinetic energy while he stands still.",
      so: "his energy begins to change form once he rolls.",
    },
    {
      lesson: "C",
      kernel: "Jamal slows down and stops",
      because: "friction turns some of his energy into thermal energy.",
      but: "the total amount of energy has not disappeared.",
      so: "the wheels and the ramp feel a little warmer.",
    },
    {
      lesson: "D",
      kernel: "The total energy in the system stays the same",
      because: "energy is never created or destroyed.",
      but: "the energy changes from one form to another.",
      so: "scientists can track every change in the system.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Jamal rolled.",
      parts: { when: "after pushing off", where: "down the ramp at the skate park", how: "faster and faster", why: "as potential energy became kinetic energy" },
      model: "After pushing off, Jamal rolled down the ramp at the skate park faster and faster as potential energy became kinetic energy.",
    },
    {
      lesson: "B",
      kernel: "The rubber band stretched.",
      parts: { when: "while Jamal pulled it", where: "in his hands", why: "to store elastic potential energy" },
      model: "While Jamal pulled it, the rubber band stretched in his hands to store elastic potential energy.",
    },
  ],
  fragments: [
    { text: "Kinetic energy is the energy of motion.", is_sentence: true },
    { text: "Because the wheels rub against the ramp.", is_sentence: false, fix: "Some energy becomes thermal energy because the wheels rub against the ramp." },
    { text: "Speeds up as he rolls down.", is_sentence: false, fix: "Jamal speeds up as he rolls down." },
    { text: "Energy changes form but is never lost.", is_sentence: true },
    { text: "Whereas the rubber band stores elastic energy.", is_sentence: false, fix: "A moving skateboard has kinetic energy, whereas a stretched rubber band stores elastic energy." },
    { text: "Potential energy depends on height.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Potential energy, ___, depends on how high Jamal stands.",
      noun: "Potential energy",
      options: ["stored energy because of position", "the energy of motion", "a force that resists sliding"],
      answer: 0,
      model: "Potential energy, stored energy because of position, depends on how high Jamal stands.",
    },
    {
      lesson: "C",
      sentence: "Friction, ___, turns some of Jamal's energy into thermal energy.",
      noun: "Friction",
      options: ["the energy of a moving object", "a force that resists sliding between touching surfaces", "a rule that energy is never lost"],
      answer: 1,
      model: "Friction, a force that resists sliding between touching surfaces, turns some of Jamal's energy into thermal energy.",
    },
    {
      lesson: "D",
      sentence: "Conservation of energy, ___, explains why the total never changes.",
      noun: "Conservation of energy",
      options: ["a change from one form into another", "how fast something moves", "the rule that energy is never created or destroyed"],
      answer: 2,
      model: "Conservation of energy, the rule that energy is never created or destroyed, explains why the total never changes.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "as", stem: "Jamal speeds up", model: "As he rolls down the ramp, Jamal speeds up." },
    { lesson: "C", conjunction: "because", stem: "some energy becomes thermal energy", model: "Because the wheels rub against the ramp, some energy becomes thermal energy." },
    { lesson: "D", conjunction: "although", stem: "the total energy is not lost", model: "Although Jamal slows to a stop, the total energy is not lost." },
  ],
  spo: {
    topic: {
      l1_2: "At the [top], Jamal has [potential] energy, but at the [bottom], he has [kinetic] energy.",
      l3_4: "Both [the top] and [the bottom] of the ramp have energy, whereas [the top] stores [potential] energy and [the bottom] has [kinetic] energy.",
      l5_6: "Although [Jamal's total energy] stays the same, [at the top] it is mostly [potential energy], whereas [at the bottom] it is mostly [kinetic energy] with some [thermal energy].",
    },
    starters: [
      { type: "question", text: "Where did Jamal's energy go when he finally stopped?" },
      { type: "statement", text: "Energy at the top of a ramp and energy at the bottom are the same in total but different in form." },
      { type: "appositive", text: "Jamal, a skateboarder at a Baltimore skate park, changes energy from one form to another on every ride." },
    ],
    details: [
      { note: "top: still, high → potential energy", lesson: "A" },
      { note: "bottom: fast, low → kinetic energy", lesson: "A" },
      { note: "potential → kinetic as he rolls", lesson: "A" },
      { note: "friction → some thermal energy", lesson: "C" },
      { note: "stretched rubber band = elastic energy", lesson: "B" },
      { note: "total energy same; form changes", lesson: "D" },
    ],
    distractors: ["skateboards have four wheels", "the ramp is made of wood"],
    conclusion: {
      l1_2: "The [energy] changes [form], but it is not [lost].",
      l3_4: "In contrast to the top, the bottom has [kinetic] energy, but the [total] energy is the [same].",
      l5_6: "Therefore, although Jamal [slows and stops], [no energy is lost], because it only [changes form] into [thermal energy] and other forms.",
    },
  },
  prompt: {
    l1_2: "Draw Jamal at the top and at the bottom of the ramp. Write 3 sentences. Tell what is the same and what is different.",
    l3_4: "Write a paragraph that compares Jamal at the top of the ramp with Jamal at the bottom. Tell what is the same and what is different. Use both, whereas, and in contrast.",
    l5_6: "Write a paragraph that compares the forms of energy at the top and at the bottom of the ramp and explains where the energy goes when Jamal stops. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["Both", "Similarly,", "Whereas", "In contrast,", "However,", "While", "Unlike", "Therefore,"],
  model: {
    l1_2: "At the top, Jamal has potential energy. At the bottom, he has kinetic energy. Both have energy, but the forms are different.",
    l3_4: "Both the top and the bottom of the ramp have energy, whereas the top stores potential energy and the bottom has kinetic energy. At the top, Jamal stands still, so his energy is stored because of his height. As he rolls down, potential energy changes into kinetic energy. In contrast, friction turns a little energy into thermal energy. However, the total amount of energy stays the same.",
    l5_6: "Although Jamal's total energy stays the same, it changes form as he rides. At the top of the ramp, Jamal, a skateboarder at a Baltimore skate park, has mostly potential energy because of his height. As he rolls down, that potential energy becomes kinetic energy, and he speeds up. At the bottom, he has the most kinetic energy and the least potential energy. In contrast, friction in the wheels and the air turns some energy into thermal energy. Both a moving skateboard and a stretched rubber band have energy, but one has kinetic energy and the other has elastic potential energy. Therefore, Jamal slows and stops, but no energy is lost.",
  },
  mpo: {
    thesis: "Jamal has the same total energy at the top and the bottom of the ramp, but the energy is in different forms, and some of it becomes thermal energy.",
    paragraphs: [
      { topic: "At the top of the ramp, Jamal's energy is mostly potential, whereas at the bottom it is mostly kinetic.", notes: ["top: still, high → potential", "bottom: fast, low → kinetic", "potential → kinetic as he rolls"] },
      { topic: "Friction makes the two ends differ, because some energy becomes thermal energy.", notes: ["wheels rub ramp", "friction → thermal energy", "Jamal slows and stops"] },
      { topic: "Conservation of energy explains why the total stays the same even though the forms change.", notes: ["energy never created or destroyed", "elastic energy also stores energy", "total energy same"] },
    ],
    conclusion: "Comparing the top and the bottom shows that energy changes form, but none of it disappears.",
  },
  revise: [
    "Did I tell what is the same and what is different about the energy at the top and the bottom?",
    "Did I use both, whereas, in contrast, or while to make the comparison clear?",
    "Did I name the right forms, such as potential, kinetic, thermal, or elastic energy?",
    "Did I explain that the total energy stays the same, even when Jamal stops?",
  ],
};
