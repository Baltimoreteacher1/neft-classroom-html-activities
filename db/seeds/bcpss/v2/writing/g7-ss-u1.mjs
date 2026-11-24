// BCPSS Writing Lab (TWR) — g7-ss-u1 · Geographic Tools & Human-Environment Interaction. Contract: ../writing-schema.mjs

export default {
  title: "Why a City Grows Here",
  genre: "explain",
  tip: "Have students layer one map feature at a time, such as hills, then river, then harbor, and write one cause-and-effect sentence after each layer.",
  lessons: [
    { id: "A", title: "Reading maps and GIS layers" },
    { id: "B", title: "Rivers, harbors, and where cities grow" },
    { id: "C", title: "Water power and how people adapt to land" },
    { id: "D", title: "Urbanization, infrastructure, and runoff" },
  ],
  source: {
    title: "Why Baltimore Is Here",
    lesson: "B",
    text: "Baltimore sits where the hills of the Piedmont meet the flat coastal plain. Streams such as the Jones Falls drop quickly there, so mills used the moving water for power in the 1700s. The Patapsco River also forms a deep, protected harbor. Because ships could dock safely, Baltimore grew into a busy port. A GIS map with layers for elevation, rivers, and roads shows this pattern clearly. As the city grew, roads and buildings covered the soil. Rain could not soak in, so runoff carried pollution into the harbor. As a result, the city built rain gardens and storm drains.",
  },
  notes: [
    { sentence: "Streams such as the Jones Falls drop quickly there, so mills used the moving water for power in the 1700s.", note: "Jones Falls drops fast → mills = water power" },
    { sentence: "Because ships could dock safely, Baltimore grew into a busy port.", note: "deep harbor → safe docks → port grows" },
    { sentence: "A GIS map with layers for elevation, rivers, and roads shows this pattern clearly.", note: "GIS layers: elevation + rivers + roads" },
    { sentence: "Rain could not soak in, so runoff carried pollution into the harbor.", note: "pavement → runoff → pollution in harbor" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Ships docked safely in Baltimore",
      because: "the Patapsco River forms a deep, protected harbor.",
      but: "the land around the harbor is low and flat.",
      so: "the city grew into a busy port.",
    },
    {
      lesson: "C",
      kernel: "Mills were built along the Jones Falls",
      because: "the stream drops quickly and turns mill wheels.",
      but: "the water could also flood nearby streets.",
      so: "the area became a center for flour milling.",
    },
    {
      lesson: "D",
      kernel: "Rain runs off the city's paved streets",
      because: "pavement and roofs block water from soaking into the soil.",
      but: "rain gardens can soak up part of the water.",
      so: "polluted runoff can reach the harbor.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "Ships docked.",
      parts: { when: "in the 1700s", how: "safely", where: "in Baltimore's deep harbor" },
      model: "In the 1700s, ships docked safely in Baltimore's deep harbor.",
    },
    {
      lesson: "A",
      kernel: "Students studied the map.",
      parts: { when: "during class", how: "by turning layers on and off", why: "to see how rivers shape settlement" },
      model: "During class, students studied the map by turning layers on and off to see how rivers shape settlement.",
    },
  ],
  fragments: [
    { text: "Elevation is how high a place is above sea level.", is_sentence: true },
    { text: "Because the harbor is deep and protected.", is_sentence: false, fix: "Ships dock safely because the harbor is deep and protected." },
    { text: "Runs quickly over paved streets.", is_sentence: false, fix: "Rain runs quickly over paved streets." },
    { text: "A GIS map stacks layers of information.", is_sentence: true },
    { text: "As the city grew.", is_sentence: false, fix: "As the city grew, roads covered more soil." },
    { text: "Infrastructure includes roads, bridges, and water pipes.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "GIS, ___, stacks layers such as roads and rivers on one map.",
      noun: "GIS",
      options: ["a computer mapping tool", "the height of a place above sea level", "the growth of cities"],
      answer: 0,
      model: "GIS, a computer mapping tool, stacks layers such as roads and rivers on one map.",
    },
    {
      lesson: "C",
      sentence: "The Jones Falls, ___, powered mills in the 1700s.",
      noun: "Jones Falls",
      options: ["a deep and protected harbor", "a stream that drops quickly near Baltimore", "flat land beside a river"],
      answer: 1,
      model: "The Jones Falls, a stream that drops quickly near Baltimore, powered mills in the 1700s.",
    },
    {
      lesson: "D",
      sentence: "Urbanization, ___, spreads roads and buildings over soil.",
      noun: "Urbanization",
      options: ["a change people make to live well in a place", "the usual pattern of weather over many years", "the growth of cities as more people move in"],
      answer: 2,
      model: "Urbanization, the growth of cities as more people move in, spreads roads and buildings over soil.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "because", stem: "Baltimore grew into a busy port", model: "Because ships could dock safely, Baltimore grew into a busy port." },
    { lesson: "D", conjunction: "as", stem: "roads and buildings covered the soil", model: "As the city grew, roads and buildings covered the soil." },
    { lesson: "C", conjunction: "when", stem: "mills used the moving water for power", model: "When the stream dropped quickly, mills used the moving water for power." },
  ],
  spo: {
    topic: {
      l1_2: "The [harbor] caused [Baltimore] to grow as a [port].",
      l3_4: "Because the [Patapsco River forms a deep harbor], ships could dock safely, and as a result [Baltimore] grew into a [busy port].",
      l5_6: "Because [Baltimore's land and rivers] provide [water power and a protected harbor], the city grew as a port, and as a result [urbanization] created new problems such as [runoff].",
    },
    starters: [
      { type: "question", text: "How can a river and a hill decide where a whole city grows?" },
      { type: "statement", text: "Baltimore exists in its exact spot because of land, water, and ships." },
      { type: "appositive", text: "Baltimore, a city where hills meet the coastal plain, grew because of its harbor." },
    ],
    details: [
      { note: "hills meet coastal plain", lesson: "A" },
      { note: "Jones Falls drops fast → mills", lesson: "C" },
      { note: "Patapsco = deep, protected harbor", lesson: "B" },
      { note: "safe docks → busy port", lesson: "B" },
      { note: "GIS layers: elevation, rivers, roads", lesson: "A" },
      { note: "pavement → runoff → rain gardens", lesson: "D" },
    ],
    distractors: ["Baltimore has many rowhouses", "blue crabs live in the bay"],
    conclusion: {
      l1_2: "So the [land] and [water] shaped the [city].",
      l3_4: "As a result, people [adapted] to the land by building [mills] and [docks] near the water.",
      l5_6: "Therefore, [physical geography] leads people to settle and build in certain places, and later [growth] forces them to adapt with [new infrastructure].",
    },
  },
  prompt: {
    l1_2: "Draw a map of the harbor and a ship. Write 3 sentences. Tell why Baltimore grew here. Use the word because.",
    l3_4: "Write a paragraph that explains how the land and water near Baltimore led people to settle there. Use because, leads to, and as a result.",
    l5_6: "Write a paragraph that explains how Baltimore's hills, streams, and harbor led to the city's growth and how growth created new problems. Include an appositive and a sentence that starts with because, as, or when.",
  },
  transitions: ["First,", "Because", "As a result,", "This leads to", "Therefore,", "When", "As", "Later,"],
  model: {
    l1_2: "Baltimore has a deep harbor. Ships can dock safely. As a result, the city grew.",
    l3_4: "Because the Patapsco River forms a deep harbor, ships could dock safely, and as a result Baltimore grew into a busy port. First, hills meet the flat coastal plain near the city. The Jones Falls drops quickly, so mills used its water for power. Then more people moved in, and roads covered the soil. This leads to runoff, so the city built rain gardens.",
    l5_6: "Because Baltimore's land and rivers provide water power and a protected harbor, the city grew as a port. The Jones Falls, a stream that drops quickly, turned mill wheels in the 1700s. As a result, workers and businesses settled nearby. When ships docked safely in the Patapsco River's deep harbor, trade grew even faster. A GIS map with layers for elevation, rivers, and roads shows this pattern clearly. As the city grew, roads and buildings covered the soil, so rain ran off instead of soaking in. Therefore, urbanization led to runoff, and Baltimore built rain gardens and storm drains.",
  },
  mpo: {
    thesis: "Baltimore's hills, streams, and harbor caused people to settle and build a port here, and the city's growth then forced people to adapt to new problems.",
    paragraphs: [
      { topic: "Streams that drop quickly led people to build mills along the Jones Falls.", notes: ["hills meet coastal plain", "Jones Falls drops fast", "mills use water power"] },
      { topic: "A deep, protected harbor led ships to dock safely and the city to grow as a port.", notes: ["Patapsco = deep harbor", "safe docks", "busy port, more people"] },
      { topic: "Urbanization caused runoff, so Baltimore adapted with new infrastructure.", notes: ["roads cover soil", "runoff → pollution in harbor", "rain gardens + storm drains"] },
    ],
    conclusion: "Geography decides where people build, and people then change the land and adapt to what they have changed.",
  },
  revise: [
    "Did I name a physical feature, such as the harbor or the Jones Falls, as the cause?",
    "Did I tell the human response, such as docks, mills, or rain gardens, as the effect?",
    "Did I use because, leads to, or as a result to connect them?",
    "Did I use a geography word, such as elevation, GIS, or urbanization, correctly?",
  ],
};
