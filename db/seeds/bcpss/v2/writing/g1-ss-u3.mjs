// BCPSS Writing Lab (TWR) — g1-ss-u3 · American Symbols & Historical Timelines. Contract: ../writing-schema.mjs

export default {
  title: "A Flag Becomes a Song",
  genre: "narrate",
  tip: "Lay out three picture cards of the flag story and have students slide them into order before they write first, next, and later.",
  lessons: [
    { id: "A", title: "The Fourth of July and our flag" },
    { id: "B", title: "Fort McHenry in 1814" },
    { id: "C", title: "A poem becomes a song" },
    { id: "D", title: "Put history in order on a timeline" },
  ],
  source: {
    title: "The Flag at Fort McHenry",
    lesson: "B",
    text: "In 1814, Francis Scott Key watched Fort McHenry from a ship. First, ships fired at the fort all night. Then morning came. Key saw the big flag still flying. Next, he wrote a poem. Later, people sang it as a song. In 1931, it became our national anthem.",
  },
  notes: [
    { sentence: "First, ships fired at the fort all night.", note: "ships fire all night" },
    { sentence: "Key saw the big flag still flying.", note: "Key sees flag flying" },
    { sentence: "Next, he wrote a poem.", note: "next: wrote poem" },
    { sentence: "In 1931, it became our national anthem.", note: "1931 → anthem" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Francis Scott Key wrote a poem",
      because: "he saw the flag still flying.",
      but: "he could not see the flag in the dark.",
      so: "people later sang it as a song.",
    },
    {
      lesson: "B",
      kernel: "The flag flew over Fort McHenry",
      because: "the fort protected Baltimore.",
      but: "ships fired at the fort all night.",
      so: "Key was happy to see it at dawn.",
    },
    {
      lesson: "D",
      kernel: "The song became our national anthem",
      because: "a law named it our anthem in 1931.",
      but: "it began as a poem.",
      so: "we sing it at games today.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Key wrote.",
      parts: { when: "after the battle", what: "a poem about the flag", where: "on the ship", why: "to tell what he saw" },
      model: "After the battle, Key wrote a poem about the flag on the ship to tell what he saw.",
    },
    {
      lesson: "A",
      kernel: "Ben waves a flag.",
      parts: { when: "on the Fourth of July", where: "at the harbor", why: "to celebrate our country's birthday" },
      model: "On the Fourth of July, Ben waves a flag at the harbor to celebrate our country's birthday.",
    },
  ],
  fragments: [
    { text: "Key saw the flag.", is_sentence: true },
    { text: "Wrote a poem about the flag.", is_sentence: false, fix: "Key wrote a poem about the flag." },
    { text: "In 1931, the song became our anthem.", is_sentence: true },
    { text: "After the ships stopped firing.", is_sentence: false, fix: "After the ships stopped firing, morning came." },
    { text: "A timeline of the story.", is_sentence: false, fix: "A timeline puts the story in order." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Francis Scott Key, ___, wrote a poem.",
      noun: "Francis Scott Key",
      options: ["a man on a ship near Baltimore", "a big bird with a white head", "a line of events"],
      answer: 0,
      model: "Francis Scott Key, a man on a ship near Baltimore, wrote a poem.",
    },
    {
      lesson: "B",
      sentence: "Fort McHenry, ___, still stands in Baltimore.",
      noun: "Fort McHenry",
      options: ["a song for a country", "a fort that protected the city", "a cloth with stars"],
      answer: 1,
      model: "Fort McHenry, a fort that protected the city, still stands in Baltimore.",
    },
    {
      lesson: "D",
      sentence: "A timeline, ___, helps us put events in order.",
      noun: "A timeline",
      options: ["a special song for a country", "a big bird that stands for the United States", "a line that shows events in order"],
      answer: 2,
      model: "A timeline, a line that shows events in order, helps us put events in order.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "after", stem: "Key wrote a poem", model: "After he saw the flag, Key wrote a poem." },
    { lesson: "B", conjunction: "when", stem: "the flag was still flying", model: "When morning came, the flag was still flying." },
    { lesson: "D", conjunction: "because", stem: "it became our anthem", model: "Because people loved the song, it became our anthem." },
  ],
  spo: {
    topic: {
      l1_2: "First, [Key saw the flag]. Next, he [wrote a poem].",
      l3_4: "First, [Key saw the flag]. Next, he [wrote a poem]. Later, [people sang it].",
      l5_6: "Although [the ships fired all night], [Key saw the flag still flying] and [wrote a poem that became our anthem].",
    },
    starters: [
      { type: "question", text: "How did a flag turn into a song?" },
      { type: "statement", text: "A flag at Fort McHenry inspired our national anthem." },
      { type: "appositive", text: "Francis Scott Key, a man on a ship, saw the flag at dawn." },
    ],
    details: [
      { note: "1814: ships fire at fort all night", lesson: "B" },
      { note: "morning: flag still flying", lesson: "B" },
      { note: "Key sees flag", lesson: "B" },
      { note: "next: Key writes poem", lesson: "C" },
      { note: "later: people sing poem", lesson: "C" },
      { note: "1931: national anthem", lesson: "D" },
    ],
    distractors: ["Baltimore has a big harbor", "fireworks are loud"],
    conclusion: {
      l1_2: "At last, it became our [anthem].",
      l3_4: "Finally, the [poem] became our [national anthem] in [1931].",
      l5_6: "Because [people loved the song], what began as [a poem on a ship] now [belongs to our whole country].",
    },
  },
  prompt: {
    l1_2: "Draw the flag at Fort McHenry. Write 1-3 sentences. Use first and next.",
    l3_4: "Tell the story of the flag and the song in order. Use first, then, next, and finally.",
    l5_6: "Tell how the flag at Fort McHenry became our national anthem, in order. Include an appositive and a sentence that starts with although, when, or after.",
  },
  transitions: ["First,", "Then,", "Next,", "Later,", "After that,", "In 1814,", "In 1931,", "Finally,"],
  model: {
    l1_2: "First, Key saw the flag. Next, he wrote a poem. Later, people sang it.",
    l3_4: "First, ships fired at Fort McHenry all night. Then Key saw the flag still flying. Next, he wrote a poem. Finally, the poem became our national anthem in 1931.",
    l5_6: "Although the ships fired all night, Francis Scott Key, a man on a ship near Baltimore, saw the flag still flying. Next, he wrote a poem about it. Later, people sang the poem as a song. In 1931, the song became our national anthem because people loved it.",
  },
  revise: [
    "Did I tell the events in the right order?",
    "Did I use first, next, later, or finally?",
    "Did I include a year or a place from the story?",
    "Did I end with how the story turned out?",
  ],
};
