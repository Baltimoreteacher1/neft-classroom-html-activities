// BCPSS Writing Lab (TWR) — g4-sci-u2 · Waves & Information Transfer. Contract: ../writing-schema.mjs

export default {
  title: "Signals Across the Bay",
  genre: "explain",
  tip: "Model one Because-But-So aloud before students write; keep the outline in key words so the paragraph stays in their own words.",
  lessons: [
    { id: "A", title: "Parts of a wave: crest, trough, amplitude, wavelength" },
    { id: "B", title: "Bigger waves carry more energy" },
    { id: "C", title: "Patterns in waves send codes" },
    { id: "D", title: "Engineering a signal that travels far" },
  ],
  source: {
    title: "How a Lighthouse Talks",
    lesson: "C",
    text: "Thomas Point Light stands in the Chesapeake Bay near Annapolis. Every night, its lamp flashes in a pattern that sailors know. The light travels as waves across the dark water. When fog rolls in, sailors cannot see the flashes, so a horn blasts sound waves instead. A loud blast has a large amplitude, and it carries more energy, so boats far away can still hear it. The pattern of flashes and blasts is a code. Each pattern tells sailors where they are and warns them about shallow water.",
  },
  notes: [
    { sentence: "Every night, its lamp flashes in a pattern that sailors know.", note: "lamp flashes pattern @ night" },
    { sentence: "When fog rolls in, sailors cannot see the flashes, so a horn blasts sound waves instead.", note: "fog → horn = sound waves" },
    { sentence: "A loud blast has a large amplitude, and it carries more energy.", note: "loud = big amplitude = + energy" },
    { sentence: "Each pattern tells sailors where they are and warns them about shallow water.", note: "pattern → location + warning" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "The lighthouse flashes its light in a pattern",
      because: "the pattern is a code that tells sailors where they are.",
      but: "sailors cannot see the flashes when thick fog rolls in.",
      so: "boats can steer away from shallow water at night.",
    },
    {
      lesson: "B",
      kernel: "A wave with a large amplitude carries more energy",
      because: "its crests rise higher above the middle line.",
      but: "it does not travel faster than a wave with a small amplitude.",
      so: "a loud foghorn can be heard by boats far away.",
    },
    {
      lesson: "A",
      kernel: "Two waves can have the same amplitude",
      because: "amplitude only measures how tall a wave is.",
      but: "their wavelengths can still be different.",
      so: "we must measure the wavelength too before we compare them.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "The horn sends a signal.",
      parts: { when: "during thick fog", where: "across the Chesapeake Bay", how: "with loud blasts of sound", why: "to warn boats about shallow water" },
      model: "During thick fog, the horn sends a signal across the Chesapeake Bay with loud blasts of sound to warn boats about shallow water.",
    },
    {
      lesson: "C",
      kernel: "Nia flashed a code.",
      parts: { what: "two short flashes", when: "after dark", where: "from her side of the cove", why: "so her cousin Omar would read the word no" },
      model: "After dark, Nia flashed a code of two short flashes from her side of the cove so her cousin Omar would read the word no.",
    },
  ],
  fragments: [
    { text: "The crest is the highest point of a wave.", is_sentence: true },
    { text: "Across the dark water every night.", is_sentence: false, fix: "The light travels across the dark water every night." },
    { text: "Because the fog was too thick.", is_sentence: false, fix: "The sailors used the horn because the fog was too thick." },
    { text: "Sound waves carry the message to the boat.", is_sentence: true },
    { text: "The distance from one crest to the next crest.", is_sentence: false, fix: "The wavelength is the distance from one crest to the next crest." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The trough, ___, comes between two crests.",
      noun: "trough",
      options: ["the lowest point of a wave", "a loud horn on a boat", "the energy in the light"],
      answer: 0,
      model: "The trough, the lowest point of a wave, comes between two crests.",
    },
    {
      lesson: "C",
      sentence: "Thomas Point Light, ___, warns boats with flashing light.",
      noun: "Thomas Point Light",
      options: ["a wave with no energy", "a lighthouse in the Chesapeake Bay", "the top of a sound wave"],
      answer: 1,
      model: "Thomas Point Light, a lighthouse in the Chesapeake Bay, warns boats with flashing light.",
    },
    {
      lesson: "B",
      sentence: "Amplitude, ___, tells us how much energy a wave carries.",
      noun: "Amplitude",
      options: ["the space between two crests", "a code made of flashes", "the height of a wave from its middle line"],
      answer: 2,
      model: "Amplitude, the height of a wave from its middle line, tells us how much energy a wave carries.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "when", stem: "the lighthouse switches from light to sound", model: "When fog hides the flashes, the lighthouse switches from light to sound." },
    { lesson: "B", conjunction: "although", stem: "the small ripple still carries some energy", model: "Although its amplitude is tiny, the small ripple still carries some energy." },
    { lesson: "C", conjunction: "before", stem: "Nia and Omar agree on what each pattern means", model: "Before they send a single flash, Nia and Omar agree on what each pattern means." },
  ],
  spo: {
    topic: {
      l1_2: "A lighthouse sends a message with [light / sound] waves.",
      l3_4: "A lighthouse sends messages to sailors by using patterns of [light] and [sound] waves.",
      l5_6: "Although sailors cannot always see the shore, [a lighthouse] keeps them safe by [sending coded patterns of waves].",
    },
    starters: [
      { type: "question", text: "How can a tower of light talk to a boat it cannot see?" },
      { type: "appositive", text: "Thomas Point Light, a lighthouse near Annapolis, talks to sailors with waves." },
      { type: "subordinate", text: "Even though a lighthouse cannot speak, it sends clear messages every night." },
    ],
    details: [
      { note: "lamp flashes pattern = code", lesson: "C" },
      { note: "light waves travel across water", lesson: "A" },
      { note: "fog → horn blasts sound waves", lesson: "D" },
      { note: "loud blast = big amplitude, + energy", lesson: "B" },
      { note: "sailors read pattern → steer away from shallow water", lesson: "C" },
      { note: "each pattern = location", lesson: "C" },
    ],
    distractors: ["crabs live in the bay", "Annapolis has many old houses"],
    conclusion: {
      l1_2: "The [pattern] keeps boats [safe].",
      l3_4: "Because the patterns carry a [code], sailors can [stay safe] even in the dark.",
      l5_6: "Patterns in light and sound waves turn a simple tower into [a messenger that protects every boat on the bay].",
    },
  },
  prompt: {
    l1_2: "Draw Thomas Point Light. Write 2-3 sentences about how it sends a message. Use the words light, sound, and pattern.",
    l3_4: "Write a paragraph that explains how a lighthouse sends messages to sailors. Use your outline, one because sentence, and order words.",
    l5_6: "Write a paragraph that explains how a lighthouse uses wave patterns to send messages in clear weather and in fog. Include an appositive and a sentence that starts with when or although.",
  },
  transitions: ["First,", "Next,", "Then,", "After that,", "When", "As a result,", "For example,", "Finally,"],
  model: {
    l1_2: "A lighthouse sends a message with light waves. The light flashes in a pattern. In fog, a horn sends sound waves.",
    l3_4: "A lighthouse sends messages to sailors by using patterns of light and sound waves. First, the lamp flashes in a pattern that sailors know. The light waves travel across the dark water to the boats. When fog rolls in, a horn blasts sound waves because sailors cannot see the light. Each pattern is a code that tells sailors where they are. Because the patterns carry a code, sailors can stay safe even in the dark.",
    l5_6: "Although sailors cannot always see the shore, Thomas Point Light, a lighthouse near Annapolis, keeps them safe by sending coded patterns of waves. Every night, its lamp flashes a pattern that travels across the water as light waves. Sailors read the pattern like a code, so they know where they are. When fog hides the flashes, a horn blasts sound waves instead. A loud blast has a large amplitude, so it carries enough energy to reach boats far away. As a result, captains can steer away from shallow water even when they see nothing. Patterns in light and sound waves turn a simple tower into a messenger that protects every boat on the bay.",
  },
  revise: [
    "Did I explain what the pattern means, not just that the light flashes?",
    "Did I tell what happens in fog and why the horn works?",
    "Did I use amplitude or wavelength correctly at least once?",
    "Did I use order words so the steps are easy to follow?",
  ],
};
