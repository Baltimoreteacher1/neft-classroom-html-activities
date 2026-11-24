// BCPSS Writing Lab (TWR) — g8-sci-u3 · How Is the Earth Changing? Contract: ../writing-schema.mjs

export default {
  title: "How the Atlantic Grows",
  genre: "explain",
  tip: "Have students sketch the ridge in three panels, one per step, and label each panel with first, next, or then.",
  lessons: [
    { id: "A", title: "Earth's layers and mantle convection" },
    { id: "B", title: "Plate boundaries: divergent, convergent, and transform" },
    { id: "C", title: "Seafloor spreading and the evidence" },
    { id: "D", title: "Earthquakes and volcanoes along boundaries" },
  ],
  source: {
    title: "A Moving Crust",
    lesson: "A",
    text: "Heat from deep inside Earth makes the mantle flow slowly in loops called convection currents. These currents move the tectonic plates on top. At the Mid-Atlantic Ridge, two plates move apart, which is a divergent boundary. First, magma rises through the gap and cools into new rock. Next, the new rock becomes part of the ocean floor and moves away from the ridge. Over millions of years, the Atlantic Ocean grows wider by a few centimeters each year. Where an ocean plate meets a continent, the denser ocean plate sinks, and that is called subduction. As a result, rock above it melts, and volcanoes form. Along the San Andreas Fault in California, two plates slide past each other, and the sudden slips cause earthquakes.",
  },
  notes: [
    { sentence: "Heat from deep inside Earth makes the mantle flow slowly in loops called convection currents.", note: "heat → mantle flows in loops = convection" },
    { sentence: "First, magma rises through the gap and cools into new rock.", note: "1st: magma rises, cools = new rock" },
    { sentence: "Where an ocean plate meets a continent, the denser ocean plate sinks, and that is called subduction.", note: "ocean plate sinks = subduction" },
    { sentence: "Along the San Andreas Fault in California, two plates slide past each other, and the sudden slips cause earthquakes.", note: "transform: plates slide → earthquakes" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Magma rises at the Mid-Atlantic Ridge",
      because: "two plates are moving apart there.",
      but: "the new rock does not stay at the ridge.",
      so: "the ocean floor spreads wider over time.",
    },
    {
      lesson: "A",
      kernel: "The mantle moves in loops",
      because: "hot rock rises and cool rock sinks.",
      but: "it flows only a few centimeters a year.",
      so: "the plates above it move slowly too.",
    },
    {
      lesson: "D",
      kernel: "Earthquakes strike along the San Andreas Fault",
      because: "two plates slide past each other and get stuck.",
      but: "no new ocean crust forms along that boundary.",
      so: "the stored stress is released as a sudden earthquake.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The ocean plate sinks.",
      parts: { when: "at a convergent boundary", where: "beneath the continent", why: "because it is denser" },
      model: "At a convergent boundary, the ocean plate sinks beneath the continent because it is denser.",
    },
    {
      lesson: "C",
      kernel: "Hot magma rises.",
      parts: { when: "as the plates pull apart", how: "slowly", where: "through the gap at the ridge" },
      model: "As the plates pull apart, hot magma rises slowly through the gap at the ridge.",
    },
  ],
  fragments: [
    { text: "Plates move apart at a divergent boundary.", is_sentence: true },
    { text: "Because the mantle flows in loops.", is_sentence: false, fix: "The plates move because the mantle flows in loops." },
    { text: "The denser plate sinks in subduction.", is_sentence: true },
    { text: "Melts the rock above the sinking plate.", is_sentence: false, fix: "The sinking plate causes the rock above it to melt." },
    { text: "When two plates slide past each other.", is_sentence: false, fix: "Earthquakes happen when two plates slide past each other." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "Convection, ___, moves heat through the mantle.",
      noun: "Convection",
      options: ["a loop in which hot material rises, cools, and sinks", "a crack where blocks of rock can move", "a huge slab of solid rock"],
      answer: 0,
      model: "Convection, a loop in which hot material rises, cools, and sinks, moves heat through the mantle.",
    },
    {
      lesson: "B",
      sentence: "A divergent boundary, ___, forms where the Atlantic Ocean grows.",
      noun: "divergent boundary",
      options: ["a place where two plates move toward each other", "a place where two plates move apart", "a place where two plates slide past each other"],
      answer: 1,
      model: "A divergent boundary, a place where two plates move apart, forms where the Atlantic Ocean grows.",
    },
    {
      lesson: "D",
      sentence: "The San Andreas Fault, ___, runs through California.",
      noun: "San Andreas Fault",
      options: ["a chain of volcanoes around the Pacific", "a ridge where new ocean crust forms", "a crack in Earth's crust where blocks of rock can move"],
      answer: 2,
      model: "The San Andreas Fault, a crack in Earth's crust where blocks of rock can move, runs through California.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "when", stem: "magma rises to fill the gap", model: "When two plates move apart, magma rises to fill the gap." },
    { lesson: "B", conjunction: "because", stem: "it sinks beneath the continent", model: "Because the ocean plate is denser, it sinks beneath the continent." },
    { lesson: "D", conjunction: "after", stem: "the rock above it melts", model: "After the plate sinks into the mantle, the rock above it melts." },
  ],
  spo: {
    topic: {
      l1_2: "Heat inside Earth moves the [plates] and [changes] the crust.",
      l3_4: "Plates change Earth's crust at three kinds of [boundaries]: [divergent], [convergent], and [transform].",
      l5_6: "As a result of [convection in the mantle], plates [move apart, collide, or slide], which [builds oceans, mountains, and volcanoes and shakes the ground].",
    },
    starters: [
      { type: "question", text: "What could move a slab of rock as big as an ocean floor?" },
      { type: "appositive", text: "The Mid-Atlantic Ridge, a boundary where plates move apart, grows new ocean floor." },
      { type: "subordinate", text: "Although plates move only a few centimeters a year, they reshape the planet." },
    ],
    details: [
      { note: "heat → mantle convection loops", lesson: "A" },
      { note: "divergent: plates apart, magma rises", lesson: "B" },
      { note: "new rock = seafloor spreads", lesson: "C" },
      { note: "convergent: ocean plate sinks = subduction", lesson: "B" },
      { note: "melting rock → volcanoes", lesson: "D" },
      { note: "transform: plates slide → earthquakes", lesson: "D" },
    ],
    distractors: ["sharks swim in the Atlantic Ocean", "Earth's core is made of iron and nickel"],
    conclusion: {
      l1_2: "So the [crust] keeps [changing].",
      l3_4: "As a result, [the plates] slowly build [oceans], [mountains], and [volcanoes].",
      l5_6: "Over millions of years, [convection and plate motion] turn [a hot mantle] into [a changing surface].",
    },
  },
  prompt: {
    l1_2: "Look at the diagram of the Mid-Atlantic Ridge. Write 3 sentences. Tell what happens first, next, and last.",
    l3_4: "Explain, step by step, how plates moving apart at a ridge make new ocean floor. Use first, next, then, and as a result.",
    l5_6: "Write a paragraph that explains the whole system: mantle convection, plate motion at a ridge, and what happens at a convergent boundary. Include an appositive and a sentence that starts with when or because.",
  },
  transitions: ["First,", "Next,", "Then,", "After that,", "As a result,", "Over time,", "Finally,", "Because"],
  model: {
    l1_2: "First, magma rises at the ridge. Next, it cools into new rock. Then the ocean floor grows wider.",
    l3_4: "Plates moving apart at a ridge make new ocean floor. First, heat in the mantle moves the plates away from each other. Next, magma rises through the gap. Then the magma cools and hardens into new rock. As a result, the old rock moves away, and the ocean floor spreads wider. Over millions of years, the Atlantic Ocean grows larger.",
    l5_6: "Heat inside Earth drives a system that builds oceans, mountains, and volcanoes. First, hot rock in the mantle rises, cools, and sinks in loops called convection currents. Next, these currents move the tectonic plates above them. At the Mid-Atlantic Ridge, a divergent boundary, magma rises and cools into new ocean floor. As a result, the Atlantic grows wider by a few centimeters each year. Because an ocean plate is denser than a continent, it sinks beneath the continent at a convergent boundary. Then the rock above the sinking plate melts, and the magma rises to form volcanoes. When two plates slide past each other along the San Andreas Fault, stress builds until the rock slips and the ground shakes.",
  },
  mpo: {
    thesis: "Heat in the mantle moves tectonic plates, and the way plates meet at their boundaries builds oceans, mountains, and volcanoes and shakes the ground.",
    paragraphs: [
      { topic: "Convection in the mantle is the engine that moves the plates.", notes: ["hot rock rises, cools, sinks", "convection currents", "plates move cm per year"] },
      { topic: "At divergent boundaries, plates move apart and new ocean floor forms.", notes: ["Mid-Atlantic Ridge", "magma rises, cools", "seafloor spreads"] },
      { topic: "At convergent and transform boundaries, plates collide or slide.", notes: ["ocean plate sinks = subduction", "melting → volcanoes", "San Andreas: slip → earthquakes"] },
    ],
    conclusion: "Slow motion deep inside Earth has fast and dramatic results at the surface, and the same process explains why oceans, mountains, and earthquakes occur where they do.",
  },
  revise: [
    "Did I put the steps in order with first, next, then, and as a result?",
    "Did I name the kind of boundary and say what the plates do there?",
    "Did I explain why something happens, such as why the ocean plate sinks?",
    "Did I use mantle, convection, subduction, or divergent correctly?",
  ],
};
