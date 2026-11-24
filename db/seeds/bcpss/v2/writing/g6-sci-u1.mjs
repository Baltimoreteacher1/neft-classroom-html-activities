// BCPSS Writing Lab (TWR) — g6-sci-u1 · Can I Believe My Eyes? Contract: ../writing-schema.mjs

export default {
  title: "How Maya Sees the Bus",
  genre: "explain",
  tip: "Have students trace the light path with a finger on a drawing and say one order word at each stop before they write.",
  lessons: [
    { id: "A", title: "Light sources and how light travels" },
    { id: "B", title: "Reflection and scattering of light" },
    { id: "C", title: "Absorption, transparent and opaque materials" },
    { id: "D", title: "How the eye and brain build a picture" },
  ],
  source: {
    title: "A Yellow Bus on North Avenue",
    lesson: "D",
    text: "Maya waits for a yellow school bus on North Avenue. The sun is a light source, so it sends light in straight lines. The light hits the bus, and the yellow paint scatters yellow light in every direction. The paint absorbs most of the other colors. Some of the scattered light travels to Maya's eye and enters through the pupil. Next, the lens focuses the light onto the retina, a layer of cells at the back of the eye. The cells send signals along a nerve to the brain. Finally, the brain builds a picture of a yellow bus. If a cloud blocks the sun, the bus looks darker because less light reaches it.",
  },
  notes: [
    { sentence: "The light hits the bus, and the yellow paint scatters yellow light in every direction.", note: "yellow paint scatters yellow light" },
    { sentence: "Some of the scattered light travels to Maya's eye and enters through the pupil.", note: "scattered light → eye through pupil" },
    { sentence: "Next, the lens focuses the light onto the retina, a layer of cells at the back of the eye.", note: "lens → light on retina" },
    { sentence: "The cells send signals along a nerve to the brain.", note: "retina cells → nerve → brain" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "The yellow bus looks yellow to Maya",
      because: "its paint scatters yellow light toward her eye.",
      but: "the paint absorbs most of the other colors.",
      so: "the bus can be seen from every side of the street.",
    },
    {
      lesson: "C",
      kernel: "A clear window lets light through",
      because: "it is transparent and does not block the light.",
      but: "a wooden door is opaque and blocks all of the light.",
      so: "we can see a clear picture of the street through the glass.",
    },
    {
      lesson: "D",
      kernel: "Maya sees the bus",
      because: "light from the bus enters her eye.",
      but: "the eye alone cannot make the picture.",
      so: "she can tell that her bus has arrived.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "The sun sends light.",
      parts: { when: "Every morning", how: "in straight lines", where: "toward the school bus" },
      model: "Every morning, the sun sends light in straight lines toward the school bus.",
    },
    {
      lesson: "D",
      kernel: "Light enters the eye.",
      parts: { when: "After scattering off the bus", where: "through the pupil", why: "so the lens can focus it" },
      model: "After scattering off the bus, light enters the eye through the pupil so the lens can focus it.",
    },
  ],
  fragments: [
    { text: "The pupil is the dark opening in the eye.", is_sentence: true },
    { text: "Scatters light in every direction.", is_sentence: false, fix: "A rough surface scatters light in every direction." },
    { text: "Because the glass is transparent.", is_sentence: false, fix: "We can see through the glass because it is transparent." },
    { text: "The retina has cells that sense light.", is_sentence: true },
    { text: "When light hits a mirror.", is_sentence: false, fix: "When light hits a mirror, it reflects in one direction." },
    { text: "Opaque materials block all light.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "D",
      sentence: "The retina, ___, sends signals to the brain.",
      noun: "retina",
      options: ["a layer of light-sensing cells at the back of the eye", "the dark opening in the middle of the eye", "a surface that bounces light in many directions"],
      answer: 0,
      model: "The retina, a layer of light-sensing cells at the back of the eye, sends signals to the brain.",
    },
    {
      lesson: "A",
      sentence: "The sun, ___, sends light across space.",
      noun: "sun",
      options: ["an object that makes its own light", "a surface that bounces light", "a material that blocks light"],
      answer: 0,
      model: "The sun, an object that makes its own light, sends light across space.",
    },
    {
      lesson: "C",
      sentence: "Glass, ___, lets light pass straight through.",
      noun: "Glass",
      options: ["a transparent material", "an opaque material", "a rough surface"],
      answer: 0,
      model: "Glass, a transparent material, lets light pass straight through.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "the paint scatters yellow light in every direction", model: "When sunlight hits the bus, the paint scatters yellow light in every direction." },
    { lesson: "C", conjunction: "if", stem: "no light passes through it", model: "If the window is opaque, no light passes through it." },
    { lesson: "D", conjunction: "before", stem: "light must land on the retina", model: "Before the brain builds a picture, light must land on the retina." },
  ],
  spo: {
    topic: {
      l1_2: "Maya sees the bus when [light] enters her [eye].",
      l3_4: "Maya sees a yellow bus because light travels from the [sun] to the [bus] to her [eye] to her [brain].",
      l5_6: "Although it seems instant, [seeing a yellow bus] is a process in which [light travels from the sun, scatters off the bus, and is turned into a picture by the brain].",
    },
    starters: [
      { type: "question", text: "How does a yellow bus on North Avenue become a picture inside your head?" },
      { type: "appositive", text: "Light, a form of energy from the sun, makes seeing possible." },
      { type: "command", text: "Follow one ray of sunlight from the sky to the back of Maya's eye." },
    ],
    details: [
      { note: "sun = light source", lesson: "A" },
      { note: "paint scatters yellow light", lesson: "B" },
      { note: "paint absorbs other colors", lesson: "C" },
      { note: "light → eye through pupil", lesson: "D" },
      { note: "lens focuses light on retina", lesson: "D" },
      { note: "retina cells → nerve → brain", lesson: "D" },
    ],
    distractors: ["the bus stops at every corner", "Maya packs her lunch each morning"],
    conclusion: {
      l1_2: "Her [brain] makes a [picture].",
      l3_4: "Finally, the [retina] sends signals to the brain, so Maya [sees the bus].",
      l5_6: "As a result, [a path of light from the sun to the brain] turns [a yellow bus] into [a picture Maya can see].",
    },
  },
  prompt: {
    l1_2: "Draw the sun, the bus, and Maya's eye. Write 3-4 sentences about how Maya sees the bus. Use the words light, eye, and brain.",
    l3_4: "Write a paragraph that explains how Maya sees a yellow bus. Use your outline, order words, and because.",
    l5_6: "Write a paragraph that explains each step of how light lets Maya see the bus, from the sun to her brain. Include an appositive and a sentence that starts with when or if.",
  },
  transitions: ["First,", "Next,", "Then,", "After that,", "Because", "As a result,", "Finally,", "So"],
  model: {
    l1_2: "Light from the sun hits the bus. The light bounces to Maya's eye. Her brain makes a picture of the bus.",
    l3_4: "Maya sees a yellow bus because light travels from the sun to the bus to her eye to her brain. First, the sun sends light in straight lines. Next, the yellow paint scatters yellow light in every direction. Then some of that light enters Maya's eye through the pupil. Finally, the retina sends signals to the brain, so she sees the bus.",
    l5_6: "Although seeing seems instant, Maya's view of a yellow bus is a process with many steps. First, the sun, a light source, sends light in straight lines toward North Avenue. When that light hits the bus, the yellow paint scatters yellow light in every direction and absorbs most other colors. Next, some of the scattered light enters Maya's eye through the pupil. The lens focuses the light onto the retina, a layer of cells at the back of the eye. Then the cells send signals along a nerve to the brain. As a result, her brain builds a picture of a yellow bus. If a cloud covers the sun, less light reaches the paint, so the bus looks darker.",
  },
  mpo: {
    thesis: "We see a yellow bus because light moves in a path from a source to an object, then to the eye, and finally to the brain.",
    paragraphs: [
      { topic: "Light leaves a source and hits an object.", notes: ["sun = light source", "light travels in straight lines", "paint scatters yellow light", "paint absorbs other colors"] },
      { topic: "The eye collects the scattered light.", notes: ["pupil = opening", "lens focuses light", "retina = light-sensing cells"] },
      { topic: "The brain builds the picture.", notes: ["retina → nerve → brain", "brain makes picture of bus", "illusion = brain tricked"] },
    ],
    conclusion: "Because light, the eye and the brain work together in order, Maya can see the yellow bus even from across the street.",
  },
  revise: [
    "Did I follow the light in order from the source to the brain?",
    "Did I use order words like first, next, then and finally?",
    "Did I say what the paint does to the light, such as scatter or absorb?",
    "Did I name at least two parts of the eye, such as the pupil and the retina?",
  ],
};
