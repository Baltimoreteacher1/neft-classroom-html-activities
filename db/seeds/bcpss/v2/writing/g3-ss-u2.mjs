// BCPSS Writing Lab (TWR) — g3-ss-u2 · World Geography, Regions & Climate. Contract: ../writing-schema.mjs

export default {
  title: "Two Harbor Cities",
  genre: "inform",
  tip: "Put both cities side by side on a two-column chart first, then ask students to write one alike sentence and one different sentence.",
  lessons: [
    { id: "A", title: "Hemispheres and the equator" },
    { id: "B", title: "Latitude and longitude" },
    { id: "C", title: "Landforms and regions, like harbors and coasts" },
    { id: "D", title: "Climate and how people adapt" },
  ],
  source: {
    title: "Baltimore and Singapore",
    lesson: "B",
    text: "Baltimore and Singapore are both port cities. Ships carry goods in and out of both harbors. Both cities are north of the equator, in the Northern Hemisphere. They are far apart, though. Baltimore is about 39 degrees north of the equator, whereas Singapore is only about 1 degree north. Baltimore is in the Western Hemisphere. In contrast, Singapore is in the Eastern Hemisphere. Baltimore has four seasons, but Singapore is hot and rainy all year. People in Singapore adapt by wearing light clothes and carrying umbrellas.",
  },
  notes: [
    { sentence: "Baltimore is about 39 degrees north of the equator, whereas Singapore is only about 1 degree north.", note: "Balt. 39°N, Singapore 1°N" },
    { sentence: "Baltimore is in the Western Hemisphere.", note: "Baltimore → Western Hem." },
    { sentence: "Baltimore has four seasons, but Singapore is hot and rainy all year.", note: "Balt. 4 seasons; Singapore hot + rainy all yr" },
    { sentence: "People in Singapore adapt by wearing light clothes and carrying umbrellas.", note: "adapt: light clothes + umbrellas" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Baltimore and Singapore are both port cities",
      because: "ships load and unload goods in both harbors.",
      but: "the two cities are very far apart.",
      so: "each one connects to trading partners across the oceans.",
    },
    {
      lesson: "D",
      kernel: "Singapore has a hot, rainy climate all year",
      because: "it sits very close to the equator.",
      but: "Baltimore is much farther from the equator.",
      so: "Singapore never has a snowy winter.",
    },
    {
      lesson: "A",
      kernel: "Both cities are in the Northern Hemisphere",
      because: "both are north of the equator.",
      but: "they are in different east-west hemispheres.",
      so: "we need longitude to tell their locations apart.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Ships arrive.",
      parts: { when: "every day", where: "at both harbors", how: "with heavy cargo", why: "to trade goods" },
      model: "Every day, ships arrive at both harbors with heavy cargo to trade goods.",
    },
    {
      lesson: "D",
      kernel: "People carry umbrellas.",
      parts: { when: "during daily rain", where: "in Singapore", why: "to stay dry" },
      model: "During daily rain, people carry umbrellas in Singapore to stay dry.",
    },
  ],
  fragments: [
    { text: "Both cities are port cities.", is_sentence: true },
    { text: "Because it is close to the equator.", is_sentence: false, fix: "Singapore is hot all year because it is close to the equator." },
    { text: "Baltimore is in the Western Hemisphere.", is_sentence: true },
    { text: "Whereas Singapore is hot and rainy all year.", is_sentence: false, fix: "Baltimore has four seasons, whereas Singapore is hot and rainy all year." },
    { text: "Lines that go east and west.", is_sentence: false, fix: "Lines of latitude go east and west." },
    { text: "The equator is an imaginary line around Earth.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The equator, ___, divides Earth into northern and southern halves.",
      noun: "equator",
      options: ["lines on a map that tell how far east or west a place is", "an imaginary line around the middle of Earth", "one half of Earth"],
      answer: 1,
      model: "The equator, an imaginary line around the middle of Earth, divides Earth into northern and southern halves.",
    },
    {
      lesson: "B",
      sentence: "Latitude, ___, tells how far north or south a place is.",
      noun: "Latitude",
      options: ["lines on a map that go east and west", "lines on a map that go north and south", "a map that shows one topic"],
      answer: 0,
      model: "Latitude, lines on a map that go east and west, tells how far north or south a place is.",
    },
    {
      lesson: "D",
      sentence: "Singapore, ___, is hot and rainy all year.",
      noun: "Singapore",
      options: ["a city with four seasons and cold winters", "a place on the Chesapeake Bay", "a port city close to the equator"],
      answer: 2,
      model: "Singapore, a port city close to the equator, is hot and rainy all year.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "although", stem: "Baltimore and Singapore are very different", model: "Although both cities are port cities, Baltimore and Singapore are very different." },
    { lesson: "D", conjunction: "because", stem: "Singapore is hot all year", model: "Because Singapore is very close to the equator, Singapore is hot all year." },
    { lesson: "A", conjunction: "while", stem: "Singapore is in the Eastern Hemisphere", model: "While Baltimore is in the Western Hemisphere, Singapore is in the Eastern Hemisphere." },
  ],
  spo: {
    topic: {
      l1_2: "Baltimore and Singapore are [alike] and [different].",
      l3_4: "Both [Baltimore] and [Singapore] are [port cities], but their [climates] are different.",
      l5_6: "Although [Baltimore and Singapore] are both port cities north of the equator, [their climates] are very different because [Singapore is much closer to the equator].",
    },
    starters: [
      { type: "question", text: "How can two harbor cities be so different?" },
      { type: "appositive", text: "Singapore, a port city near the equator, is hot and rainy all year." },
      { type: "subordinate", text: "Although both cities are port cities, their weather is not the same." },
    ],
    details: [
      { note: "both = port cities", lesson: "C" },
      { note: "both north of equator", lesson: "A" },
      { note: "Baltimore 39°N, Singapore 1°N", lesson: "B" },
      { note: "Baltimore West, Singapore East", lesson: "A" },
      { note: "Baltimore: 4 seasons", lesson: "D" },
      { note: "Singapore: hot + rainy all year", lesson: "D" },
    ],
    distractors: ["Baltimore has blue crabs", "Singapore is an island"],
    conclusion: {
      l1_2: "The [weather] is [different].",
      l3_4: "In contrast, [Singapore] is [hot and rainy] all year, whereas Baltimore has [four seasons].",
      l5_6: "In contrast, [Singapore's place near the equator] gives it [a hot, rainy climate], while [Baltimore's place farther north] gives it [four seasons].",
    },
  },
  prompt: {
    l1_2: "Draw Baltimore and Singapore. Write 2-3 sentences. Tell one way they are alike and one way they are different.",
    l3_4: "Compare Baltimore and Singapore. Write a paragraph that tells how the two cities are alike and different. Use both, whereas, and in contrast.",
    l5_6: "Write a paragraph that compares Baltimore and Singapore by location and climate. Include an appositive, a sentence that starts with although or because, and the numbers for latitude.",
  },
  transitions: ["Both", "Also,", "Whereas", "While", "However,", "In contrast,", "For example,", "In summary,"],
  model: {
    l1_2: "Both cities are port cities. Baltimore has four seasons. Singapore is hot all year.",
    l3_4: "Both Baltimore and Singapore are port cities north of the equator. Baltimore is about 39 degrees north, whereas Singapore is only about 1 degree north. Baltimore is in the Western Hemisphere, but Singapore is in the Eastern Hemisphere. In contrast, Baltimore has four seasons, while Singapore is hot and rainy all year. People in Singapore adapt by carrying umbrellas.",
    l5_6: "Although Baltimore and Singapore are both port cities north of the equator, their climates are very different. Baltimore, a city about 39 degrees north, has four seasons. Singapore, a port city only about 1 degree north, is hot and rainy all year. Baltimore is in the Western Hemisphere, whereas Singapore is in the Eastern Hemisphere. Because Singapore is so close to the equator, it never has a cold winter. In contrast, people in Singapore adapt by wearing light clothes and carrying umbrellas.",
  },
  revise: [
    "Did I tell what is the same AND what is different?",
    "Did I use both, whereas, or in contrast correctly?",
    "Did I use a geography word, like equator or hemisphere, correctly?",
    "Did I connect each city's location to its climate?",
  ],
};
