// BCPSS Writing Lab (TWR) — g6-sci-u2 · How Can I Smell Things from a Distance? Contract: ../writing-schema.mjs

export default {
  title: "Why Ana Smells the Crabs",
  genre: "explain",
  tip: "Ask students to draw the particles moving first, then say each cause and its effect with so or as a result.",
  lessons: [
    { id: "A", title: "A particle model of solids, liquids and gases" },
    { id: "B", title: "Diffusion: why smells spread" },
    { id: "C", title: "Thermal energy and particle motion" },
    { id: "D", title: "Melting, evaporating and condensing" },
  ],
  source: {
    title: "Crab Feast Smells",
    lesson: "B",
    text: "On Saturday, Dad steams blue crabs with spice in the kitchen. The heat gives the water particles more thermal energy, so they move faster. Some liquid water changes to a gas, which is called evaporation. Tiny particles of spice escape into the air and move in every direction. They spread from the crowded kitchen counter to the empty living room, and this spreading is diffusion. Soon Ana smells the crabs from the couch. If the kitchen were cold, the particles would move slowly, so the smell would take longer to arrive. When steam reaches a cool window, it condenses back into drops of liquid water.",
  },
  notes: [
    { sentence: "The heat gives the water particles more thermal energy, so they move faster.", note: "heat → + thermal energy → faster particles" },
    { sentence: "Tiny particles of spice escape into the air and move in every direction.", note: "spice particles → air, all directions" },
    { sentence: "They spread from the crowded kitchen counter to the empty living room, and this spreading is diffusion.", note: "crowded → less crowded = diffusion" },
    { sentence: "When steam reaches a cool window, it condenses back into drops of liquid water.", note: "steam + cool window → condenses → liquid" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Ana smells the crabs from the couch",
      because: "spice particles spread through the air from the kitchen to her nose.",
      but: "she cannot see the particles because they are too small.",
      so: "she knows the crabs are ready before she sees them.",
    },
    {
      lesson: "C",
      kernel: "Heat makes a smell travel faster",
      because: "it gives the particles more thermal energy, so they move faster.",
      but: "the particles do not get bigger or change into something new.",
      so: "a warm kitchen smells stronger sooner than a cold one.",
    },
    {
      lesson: "D",
      kernel: "Steam turns back into liquid water at the window",
      because: "the gas particles lose thermal energy near the cool glass.",
      but: "the water particles themselves stay the same kind of particle.",
      so: "drops of water form on the window.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The smell spread.",
      parts: { when: "After Dad opened the pot", where: "from the kitchen to the living room", how: "as spice particles moved through the air" },
      model: "After Dad opened the pot, the smell spread from the kitchen to the living room as spice particles moved through the air.",
    },
    {
      lesson: "C",
      kernel: "The water boiled.",
      parts: { when: "On Saturday afternoon", where: "in the big steamer pot", how: "as the particles gained thermal energy" },
      model: "On Saturday afternoon, the water boiled in the big steamer pot as the particles gained thermal energy.",
    },
  ],
  fragments: [
    { text: "Particles in a gas are far apart.", is_sentence: true },
    { text: "Spreads from crowded places to less crowded places.", is_sentence: false, fix: "A smell spreads from crowded places to less crowded places." },
    { text: "Because the particles gained thermal energy.", is_sentence: false, fix: "The ice melted because the particles gained thermal energy." },
    { text: "Condensation changes a gas to a liquid.", is_sentence: true },
    { text: "When the soup is hot.", is_sentence: false, fix: "When the soup is hot, its particles move faster." },
    { text: "The particles in a solid are packed tightly.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Diffusion, ___, carries the smell of crabs across the room.",
      noun: "Diffusion",
      options: ["the spreading of particles from crowded to less crowded places", "the change from a gas to a liquid", "the energy particles have because they move"],
      answer: 0,
      model: "Diffusion, the spreading of particles from crowded to less crowded places, carries the smell of crabs across the room.",
    },
    {
      lesson: "C",
      sentence: "Thermal energy, ___, increases when the water is heated.",
      noun: "Thermal energy",
      options: ["the energy particles have because they are moving", "a tiny piece of matter too small to see", "the change from a solid to a liquid"],
      answer: 0,
      model: "Thermal energy, the energy particles have because they are moving, increases when the water is heated.",
    },
    {
      lesson: "A",
      sentence: "A gas, ___, spreads out to fill the whole kitchen.",
      noun: "gas",
      options: ["matter with particles that are far apart", "matter that keeps its own shape", "matter with particles that are packed close but slide past each other"],
      answer: 0,
      model: "A gas, matter with particles that are far apart, spreads out to fill the whole kitchen.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "when", stem: "it condenses into liquid water", model: "When steam touches the cool window, it condenses into liquid water." },
    { lesson: "C", conjunction: "because", stem: "the particles move faster", model: "Because heat adds thermal energy, the particles move faster." },
    { lesson: "B", conjunction: "if", stem: "the smell would reach Ana more slowly", model: "If the kitchen were cold, the smell would reach Ana more slowly." },
  ],
  spo: {
    topic: {
      l1_2: "Ana smells the crabs because [particles] move through the [air].",
      l3_4: "Ana smells the crabs from the couch because [spice particles] spread from the kitchen through the air by [diffusion].",
      l5_6: "Although Ana cannot see anything travel, [she smells the crabs] because [heat gives particles thermal energy, and diffusion carries them to her nose].",
    },
    starters: [
      { type: "question", text: "How can you smell crabs cooking in a room you cannot see?" },
      { type: "appositive", text: "Diffusion, the spreading of particles, carries the smell to Ana's nose." },
      { type: "subordinate", text: "Even though particles are too small to see, they travel across a whole house." },
    ],
    details: [
      { note: "heat → + thermal energy", lesson: "C" },
      { note: "particles move faster", lesson: "C" },
      { note: "spice particles escape into air", lesson: "B" },
      { note: "crowded kitchen → less crowded room", lesson: "B" },
      { note: "this spreading = diffusion", lesson: "B" },
      { note: "particles reach Ana's nose", lesson: "B" },
    ],
    distractors: ["Dad bought the crabs on Friday", "Ana does homework on the couch"],
    conclusion: {
      l1_2: "Ana [smells] the [crabs].",
      l3_4: "When the particles reach Ana's nose, she [smells the crabs], so the smell traveled by [diffusion].",
      l5_6: "In this way, [thermal energy and diffusion] turn [a pot of crabs] into [a smell that fills the whole house].",
    },
  },
  prompt: {
    l1_2: "Draw the kitchen and the living room with particles in the air. Write 3-4 sentences about why Ana smells the crabs. Use the words heat, particles, and smell.",
    l3_4: "Write a paragraph that explains why Ana smells the crabs from the couch. Use your outline, because, and so.",
    l5_6: "Write a paragraph that explains the causes and effects that carry the smell from the kitchen to Ana, using the particle model. Include an appositive and a sentence that starts with because or if.",
  },
  transitions: ["First,", "Next,", "Then,", "Because", "So", "As a result,", "This causes", "Finally,"],
  model: {
    l1_2: "Dad cooks crabs in the kitchen. The heat makes particles move fast. The particles go into the air. Ana smells the crabs.",
    l3_4: "Ana smells the crabs from the couch because spice particles spread through the air. First, the heat gives the particles more thermal energy. As a result, they move faster and escape into the air. Next, the particles move from the crowded kitchen to the empty living room. This spreading is called diffusion. When the particles reach Ana's nose, she smells the crabs.",
    l5_6: "Although Ana cannot see anything travel, she smells the crabs because heat and diffusion carry particles to her nose. First, the steamer gives the water and spice particles more thermal energy. This energy causes the particles to move faster, so some escape into the air. Diffusion, the spreading of particles from crowded places to less crowded places, moves them across the kitchen. Because the living room has fewer spice particles, they keep spreading toward it. Soon the particles reach Ana's nose, so she smells the crabs. If the kitchen were cold, the particles would move more slowly, and the smell would arrive later.",
  },
  mpo: {
    thesis: "Ana can smell crabs from the couch because heat makes particles move faster and diffusion spreads them across the house.",
    paragraphs: [
      { topic: "Heat gives the particles more thermal energy.", notes: ["heat → + thermal energy", "particles move faster", "some liquid → gas"] },
      { topic: "Diffusion spreads the smell through the air.", notes: ["spice particles → air, all directions", "crowded → less crowded", "reach Ana's nose"] },
      { topic: "Cooling changes how the particles move.", notes: ["cool window → steam condenses", "gas → liquid", "particles lose thermal energy"] },
    ],
    conclusion: "Because heat speeds up the particles and diffusion spreads them out, a smell can travel from one room to another without anyone seeing it move.",
  },
  revise: [
    "Did I explain each cause with its effect, using so, because or as a result?",
    "Did I use particle words, such as particles, thermal energy and diffusion, correctly?",
    "Did I say that particles move from crowded places to less crowded places?",
    "Did I show what changes when the room is hot and when it is cold?",
  ],
};
