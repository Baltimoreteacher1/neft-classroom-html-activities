// BCPSS Writing Lab (TWR) — g3-sci-u4 · Weather Hazards & Climate Regions. Contract: ../writing-schema.mjs

export default {
  title: "A Garden Stops a Flood",
  genre: "explain",
  tip: "Have students draw the water's path as arrows with numbers first, then turn each arrow into a sentence with an action verb.",
  lessons: [
    { id: "A", title: "Collecting and graphing weather data" },
    { id: "B", title: "Comparing climate regions" },
    { id: "C", title: "Floods and storms as weather hazards" },
    { id: "D", title: "Designs that reduce flood damage" },
  ],
  source: {
    title: "A Garden for the Rain",
    lesson: "D",
    text: "After a heavy rain, water runs off a rowhouse roof. First, it flows down the gutter. Next, it pours into a rain garden, a low spot filled with soil and plants. Then the water soaks down into the soil, and the plant roots take in some of it. Because less water rushes into the street, the storm drain does not fill up so fast. As a result, the street floods less. Rain gardens are one design that helps Baltimore handle big storms.",
  },
  notes: [
    { sentence: "First, it flows down the gutter.", note: "roof → gutter" },
    { sentence: "Next, it pours into a rain garden, a low spot filled with soil and plants.", note: "→ rain garden (low spot, soil + plants)" },
    { sentence: "Then the water soaks down into the soil, and the plant roots take in some of it.", note: "soaks into soil + roots drink some" },
    { sentence: "Because less water rushes into the street, the storm drain does not fill up so fast.", note: "less water in street → drain not full" },
  ],
  bbs: [
    {
      lesson: "D",
      kernel: "A rain garden keeps water out of the street",
      because: "the soil soaks up the rain.",
      but: "it cannot stop a huge flood by itself.",
      so: "cities build many rain gardens and bigger drains.",
    },
    {
      lesson: "C",
      kernel: "Heavy rain can flood a street",
      because: "water cannot soak into hard pavement.",
      but: "a street with trees and gardens floods less.",
      so: "storm drains must carry the water away.",
    },
    {
      lesson: "A",
      kernel: "Scientists graph weather data",
      because: "a graph shows patterns over many months.",
      but: "one day of weather does not show the climate.",
      so: "they collect data for many years to describe a climate.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "The water soaked down.",
      parts: { when: "after the storm", how: "slowly and steadily", where: "into the garden soil", why: "so the street would not flood" },
      model: "After the storm, the water soaked down slowly and steadily into the garden soil so the street would not flood.",
    },
    {
      lesson: "C",
      kernel: "The rain fell.",
      parts: { when: "in July", where: "on the steep hills above town", how: "in heavy sheets" },
      model: "In July, the rain fell in heavy sheets on the steep hills above town.",
    },
  ],
  fragments: [
    { text: "Rain runs off the roof into the gutter.", is_sentence: true },
    { text: "Because the soil soaks up the water.", is_sentence: false, fix: "The street floods less because the soil soaks up the water." },
    { text: "Climate is the usual weather over many years.", is_sentence: true },
    { text: "Fills up with water during the storm.", is_sentence: false, fix: "The storm drain fills up with water during the storm." },
    { text: "A flood covers land that is usually dry.", is_sentence: true },
    { text: "When the heavy rain stops.", is_sentence: false, fix: "The water drains away when the heavy rain stops." },
  ],
  appositives: [
    {
      lesson: "D",
      sentence: "A rain garden, ___, helps soak up storm water.",
      noun: "rain garden",
      options: ["a large area that shares the same weather", "water that falls from clouds", "a low spot filled with soil and plants"],
      answer: 2,
      model: "A rain garden, a low spot filled with soil and plants, helps soak up storm water.",
    },
    {
      lesson: "A",
      sentence: "Precipitation, ___, fills the rain garden after a storm.",
      noun: "Precipitation",
      options: ["water that falls from clouds as rain, snow, sleet, or hail", "the usual weather in a place over many years", "a plan for building something to solve a problem"],
      answer: 0,
      model: "Precipitation, water that falls from clouds as rain, snow, sleet, or hail, fills the rain garden after a storm.",
    },
    {
      lesson: "B",
      sentence: "Climate, ___, is different in a desert than in Maryland.",
      noun: "Climate",
      options: ["what the air outside is like at one time and place", "the usual weather in a place over many years", "a large area of land that shares features"],
      answer: 1,
      model: "Climate, the usual weather in a place over many years, is different in a desert than in Maryland.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "because", stem: "the street floods less", model: "Because the garden soaks up the water, the street floods less." },
    { lesson: "C", conjunction: "when", stem: "water flows down the gutter", model: "When heavy rain falls on a rowhouse roof, water flows down the gutter." },
    { lesson: "D", conjunction: "after", stem: "the storm drain does not fill up so fast", model: "After the soil soaks up the rain, the storm drain does not fill up so fast." },
  ],
  spo: {
    topic: {
      l1_2: "A rain garden [soaks up] [water].",
      l3_4: "A rain garden protects a street by [soaking up] [storm water] in [steps].",
      l5_6: "Because [a rain garden, a low spot filled with soil and plants,] soaks up water before it reaches the street, [the street floods less] after a big storm.",
    },
    starters: [
      { type: "question", text: "How can a small garden help stop a flood?" },
      { type: "appositive", text: "A rain garden, a low spot with soil and plants, soaks up storm water." },
      { type: "subordinate", text: "When heavy rain falls, a rain garden slows the water down." },
    ],
    details: [
      { note: "rain runs off roof → gutter", lesson: "C" },
      { note: "gutter → pours into rain garden", lesson: "D" },
      { note: "water soaks into soil", lesson: "D" },
      { note: "roots take in some water", lesson: "D" },
      { note: "less water in street → drain not full", lesson: "D" },
      { note: "street floods less after storm", lesson: "C" },
    ],
    distractors: ["Baltimore has hot, humid summers", "weather data can be graphed"],
    conclusion: {
      l1_2: "The street [floods less].",
      l3_4: "As a result, [less water] reaches the [street], so [it floods less].",
      l5_6: "As a result, [the rain garden holds the water back], which means [the storm drain and the street can handle the storm].",
    },
  },
  prompt: {
    l1_2: "Draw the rain garden. Write 2-3 sentences. Tell where the water goes.",
    l3_4: "Explain how a rain garden keeps a street from flooding. Tell the steps in order. Use first, next, then, and as a result.",
    l5_6: "Explain the process that lets a rain garden protect a street during a heavy storm. Include an appositive, a sentence that starts with when or because, and the final result.",
  },
  transitions: ["First,", "Next,", "Then", "After that,", "Because", "So", "As a result,", "Finally,"],
  model: {
    l1_2: "Rain falls on the roof. The water goes into the garden. The street floods less.",
    l3_4: "First, heavy rain runs off a rowhouse roof and down the gutter. Next, the water pours into a rain garden. Then the water soaks into the soil, and the roots drink some of it. Because less water rushes into the street, the storm drain does not fill up so fast. As a result, the street floods less.",
    l5_6: "When heavy rain falls on a rowhouse, the water runs off the roof and down the gutter. Next, it pours into a rain garden, a low spot filled with soil and plants. Then the water soaks down into the soil, and the roots take in some of it. Because less water rushes into the street, the storm drain does not fill up so fast. As a result, the street floods less after a big storm. Rain gardens are one design that helps Baltimore handle heavy rain.",
  },
  revise: [
    "Did I tell the steps in the order they happen?",
    "Did I use action verbs, like flows, soaks, and fills?",
    "Did I explain the result with as a result or so?",
    "Did I use a weather word, like flood or precipitation, correctly?",
  ],
};
