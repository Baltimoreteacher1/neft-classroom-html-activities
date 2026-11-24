// BCPSS Writing Lab (TWR) — g1-ss-u2 · Cardinal Directions & Neighborhood Maps. Contract: ../writing-schema.mjs

export default {
  title: "What the Map Shows",
  genre: "inform",
  tip: "Tape a simple Maryland map to the board and have students point to a direction before they say a detail aloud.",
  lessons: [
    { id: "A", title: "The compass rose and directions" },
    { id: "B", title: "The map key and symbols" },
    { id: "C", title: "Maryland's land and water" },
    { id: "D", title: "Where places are in Maryland" },
  ],
  source: {
    title: "Look at the Map",
    lesson: "A",
    text: "Look at this map of Maryland. The compass rose shows four directions. Pennsylvania is north of Maryland. Virginia is south of Maryland. The Atlantic Ocean is in the east. The Chesapeake Bay cuts into the land. Baltimore is north of Annapolis.",
  },
  notes: [
    { sentence: "Pennsylvania is north of Maryland.", note: "PA = north" },
    { sentence: "Virginia is south of Maryland.", note: "VA = south" },
    { sentence: "The Atlantic Ocean is in the east.", note: "Atlantic Ocean = east" },
    { sentence: "Baltimore is north of Annapolis.", note: "Balt. N of Annapolis" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The compass rose shows four directions",
      because: "a map needs to tell us which way to go.",
      but: "it does not show the names of places.",
      so: "we can find north, south, east, and west.",
    },
    {
      lesson: "D",
      kernel: "Pennsylvania is north of Maryland",
      because: "it sits at the top of the map.",
      but: "the state to the south is Virginia.",
      so: "we go north to reach Pennsylvania.",
    },
    {
      lesson: "C",
      kernel: "The Atlantic Ocean is east of Maryland",
      because: "the east side of the map is on the right.",
      but: "the mountains are in the west.",
      so: "beach towns are on the east side.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "A map shows.",
      parts: { what: "where places are", where: "in Maryland", how: "from above", why: "to help us find them" },
      model: "A map shows where places are in Maryland from above to help us find them.",
    },
    {
      lesson: "D",
      kernel: "Leo walks south.",
      parts: { when: "after school", where: "to the harbor", how: "with a map" },
      model: "After school, Leo walks south to the harbor with a map.",
    },
  ],
  fragments: [
    { text: "The map has a compass rose.", is_sentence: true },
    { text: "North of Maryland.", is_sentence: false, fix: "Pennsylvania is north of Maryland." },
    { text: "The key tells what each picture means.", is_sentence: true },
    { text: "Shows mountains in the west.", is_sentence: false, fix: "The map shows mountains in the west." },
    { text: "Because the bay cuts into the land.", is_sentence: false, fix: "The bay is special because it cuts into the land." },
  ],
  appositives: [
    {
      lesson: "D",
      sentence: "Annapolis, ___, is south of Baltimore.",
      noun: "Annapolis",
      options: ["the capital of Maryland", "a big ocean in the east", "a box that explains pictures"],
      answer: 0,
      model: "Annapolis, the capital of Maryland, is south of Baltimore.",
    },
    {
      lesson: "A",
      sentence: "A compass rose, ___, shows the four directions.",
      noun: "A compass rose",
      options: ["a part of the sea that curves", "a drawing on a map that shows directions", "a mountain in the west"],
      answer: 1,
      model: "A compass rose, a drawing on a map that shows directions, shows the four directions.",
    },
    {
      lesson: "C",
      sentence: "The Chesapeake Bay, ___, cuts into the land.",
      noun: "The Chesapeake Bay",
      options: ["a mountain in the west", "a box on a map", "a part of the sea that curves into the land"],
      answer: 2,
      model: "The Chesapeake Bay, a part of the sea that curves into the land, cuts into the land.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "Pennsylvania is at the top of the map", model: "Because north is toward the top, Pennsylvania is at the top of the map." },
    { lesson: "B", conjunction: "when", stem: "we know where north is", model: "When we look at the compass rose, we know where north is." },
    { lesson: "C", conjunction: "although", stem: "its map shows many features", model: "Although Maryland is a small state, its map shows many features." },
  ],
  spo: {
    topic: {
      l1_2: "This map shows [Maryland].",
      l3_4: "This map shows [Maryland]. It shows [a feature] in the [direction] and [a feature] in the [direction].",
      l5_6: "Although [Maryland is small], this map shows [many places], including [features] in the [direction].",
    },
    starters: [
      { type: "statement", text: "This map shows where places are in Maryland." },
      { type: "question", text: "What can a map of Maryland tell us?" },
      { type: "command", text: "Look at the compass rose to find north." },
    ],
    details: [
      { note: "compass rose = 4 directions", lesson: "A" },
      { note: "PA = north", lesson: "D" },
      { note: "VA = south", lesson: "D" },
      { note: "Atlantic Ocean = east", lesson: "C" },
      { note: "Chesapeake Bay cuts into land", lesson: "C" },
      { note: "map key: star = Annapolis", lesson: "B" },
    ],
    distractors: ["Old Bay tastes spicy", "the Orioles play baseball"],
    conclusion: {
      l1_2: "A map helps us [find places].",
      l3_4: "So a map helps us [find places] because it shows [directions].",
      l5_6: "Because [a map shows features and directions], it helps us [find any place in Maryland].",
    },
  },
  prompt: {
    l1_2: "Draw a map of Maryland. Write 1-3 sentences. Tell what the map shows.",
    l3_4: "Look at a map of Maryland. Write what the map shows and two details with directions.",
    l5_6: "Write a paragraph that tells the central idea of a Maryland map and gives key details. Include an appositive and a sentence that starts with because, when, or although.",
  },
  transitions: ["First,", "Also,", "In the north,", "In the south,", "In the east,", "In the west,", "For example,", "Finally,"],
  model: {
    l1_2: "This map shows Maryland. It shows Pennsylvania in the north. It shows the ocean in the east.",
    l3_4: "This map shows Maryland. It shows Pennsylvania in the north and Virginia in the south. The Atlantic Ocean is in the east. The compass rose helps us find each direction.",
    l5_6: "This map shows where places are in Maryland. Pennsylvania, a state at the top of the map, is north of Maryland. Although the state is small, the map shows an ocean in the east and a bay in the middle. Because the compass rose shows four directions, we can find Baltimore north of Annapolis.",
  },
  revise: [
    "Did I say what the map shows in my first sentence?",
    "Did I give two details with directions?",
    "Did I use north, south, east, or west correctly?",
    "Did I use the map key or compass rose in my details?",
  ],
};
