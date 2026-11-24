// BCPSS Writing Lab (TWR) — g4-ss-u3 · Maryland in the Revolution & War of 1812. Contract: ../writing-schema.mjs

export default {
  title: "The Fort That Held",
  genre: "argue",
  tip: "Have students star the two best pieces of evidence in the source before they draft their claim.",
  lessons: [
    { id: "A", title: "Maryland Patriots and Loyalists in the Revolution" },
    { id: "B", title: "Mary Pickersgill and the Fort McHenry flag" },
    { id: "C", title: "The Defense of Baltimore in 1814" },
    { id: "D", title: "Making a claim with evidence" },
  ],
  source: {
    title: "The Night Baltimore Held",
    lesson: "C",
    text: "In September 1814, British ships sailed up the Patapsco River toward Baltimore. Maryland soldiers fought at North Point and slowed the British army on land. Then the ships bombarded Fort McHenry for about twenty-five hours. The fort did not surrender. According to Francis Scott Key, who watched from a ship, the flag was still flying at dawn. Mary Pickersgill had sewn that giant flag, and Commander George Armistead had asked for it. As shown by these events, Baltimore stayed free because Marylanders defended it.",
  },
  notes: [
    { sentence: "Maryland soldiers fought at North Point and slowed the British army on land.", note: "MD soldiers @ North Point → slowed British" },
    { sentence: "Then the ships bombarded Fort McHenry for about twenty-five hours.", note: "ships bombarded fort ~25 hrs" },
    { sentence: "According to Francis Scott Key, who watched from a ship, the flag was still flying at dawn.", note: "Key: flag still flying @ dawn" },
    { sentence: "Mary Pickersgill had sewn that giant flag, and Commander George Armistead had asked for it.", note: "Pickersgill sewed flag; Armistead asked" },
  ],
  bbs: [
    {
      lesson: "C",
      kernel: "Fort McHenry protected Baltimore",
      because: "the fort did not surrender during the bombardment.",
      but: "the ships bombed it for about twenty-five hours.",
      so: "the British could not capture the port.",
    },
    {
      lesson: "B",
      kernel: "Mary Pickersgill's flag mattered",
      because: "the commander wanted a flag the British could see from far away.",
      but: "some people think a flag cannot win a battle.",
      so: "people far away could still see it at dawn.",
    },
    {
      lesson: "A",
      kernel: "Patriots in Maryland fought for liberty",
      because: "they wanted to be free from British rule.",
      but: "some colonists stayed faithful to the king.",
      so: "colonists did not all agree about the war.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "Maryland soldiers fought.",
      parts: { when: "in September 1814", where: "at North Point", why: "to slow the British army" },
      model: "In September 1814, Maryland soldiers fought at North Point to slow the British army.",
    },
    {
      lesson: "B",
      kernel: "Key saw the flag.",
      parts: { when: "at dawn", where: "from a ship in the harbor", how: "through the smoke" },
      model: "At dawn, Key saw the flag from a ship in the harbor through the smoke.",
    },
  ],
  fragments: [
    { text: "The fort did not surrender.", is_sentence: true },
    { text: "Bombed Fort McHenry for twenty-five hours.", is_sentence: false, fix: "The British ships bombed Fort McHenry for about twenty-five hours." },
    { text: "According to Francis Scott Key.", is_sentence: false, fix: "According to Francis Scott Key, the flag was still flying." },
    { text: "Mary Pickersgill sewed a giant flag.", is_sentence: true },
    { text: "Because the fort held.", is_sentence: false, fix: "Baltimore stayed free because the fort held." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "A Patriot, ___, supported the Revolution in Maryland.",
      noun: "Patriot",
      options: ["a colonist who stayed faithful to Britain and the king", "a colonist who wanted the colonies to be free from British rule", "an army that surrounds a fort to make it give up"],
      answer: 1,
      model: "A Patriot, a colonist who wanted the colonies to be free from British rule, supported the Revolution in Maryland.",
    },
    {
      lesson: "B",
      sentence: "Mary Pickersgill, ___, sewed the giant flag for Fort McHenry.",
      noun: "Mary Pickersgill",
      options: ["the commander of Fort McHenry", "a Marylander who wrote a poem about the flag", "a Baltimore flag maker"],
      answer: 2,
      model: "Mary Pickersgill, a Baltimore flag maker, sewed the giant flag for Fort McHenry.",
    },
    {
      lesson: "C",
      sentence: "Fort McHenry, ___, held out against the British ships.",
      noun: "Fort McHenry",
      options: ["a strong fort with thick walls near Baltimore", "an army that surrounds a fort to make it give up", "a statement you think is true and can prove"],
      answer: 0,
      model: "Fort McHenry, a strong fort with thick walls near Baltimore, held out against the British ships.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "because", stem: "Baltimore stayed free", model: "Because the fort did not surrender, Baltimore stayed free." },
    { lesson: "A", conjunction: "although", stem: "Marylanders mattered in the Revolution", model: "Although Maryland was far from Boston, Marylanders mattered in the Revolution." },
    { lesson: "D", conjunction: "since", stem: "Americans knew the fort had held", model: "Since the flag was still flying at dawn, Americans knew the fort had held." },
  ],
  spo: {
    topic: {
      l1_2: "I think [Fort McHenry] was [important].",
      l3_4: "I claim that Fort McHenry protected Baltimore because [it did not surrender] during [a long bombardment].",
      l5_6: "Although [British ships bombed the fort for twenty-five hours], I claim [Fort McHenry] protected Baltimore because, according to [Francis Scott Key], [the flag was still flying at dawn].",
    },
    starters: [
      { type: "question", text: "How can a flag at dawn prove that a fort held?" },
      { type: "appositive", text: "Fort McHenry, a star-shaped fort near the Baltimore harbor, defended the city in 1814." },
      { type: "subordinate", text: "Although the British ships bombed the fort all night, the fort did not surrender." },
    ],
    details: [
      { note: "Sept 1814: British ships → Baltimore", lesson: "C" },
      { note: "MD soldiers @ North Point slowed army", lesson: "C" },
      { note: "bombarded ~25 hours; fort held", lesson: "C" },
      { note: "Pickersgill flag 30 ft × 42 ft", lesson: "B" },
      { note: "Key: flag still flying @ dawn", lesson: "B" },
      { note: "Patriots fought for liberty", lesson: "A" },
    ],
    distractors: ["Baltimore has a famous harbor aquarium", "the fort has a gift shop today"],
    conclusion: {
      l1_2: "Fort McHenry [protected] Baltimore.",
      l3_4: "This shows that Fort McHenry mattered because [the fort held] and [Baltimore stayed free].",
      l5_6: "As shown by [the flag at dawn], [Marylanders] defended Baltimore, so their courage mattered in the fight for [American freedom].",
    },
  },
  prompt: {
    l1_2: "Draw Fort McHenry and the flag. Write 2-3 sentences that tell why the fort mattered. Use the words fort and flag.",
    l3_4: "Write a paragraph that makes a claim about why Fort McHenry mattered and proves it with evidence. Use your outline, because, and according to.",
    l5_6: "Write a paragraph that argues Marylanders mattered in the fight for American freedom, using evidence from 1814. Include an appositive and a sentence that starts with although or since.",
  },
  transitions: ["I claim that", "because", "According to", "For example,", "As shown by", "This shows that", "Since", "In conclusion,"],
  model: {
    l1_2: "Fort McHenry was important. The fort did not surrender. The flag was still flying.",
    l3_4: "I claim that Fort McHenry protected Baltimore because it did not surrender. British ships bombed the fort for about twenty-five hours. According to Francis Scott Key, the flag was still flying at dawn. Mary Pickersgill had sewn that giant flag, and Commander Armistead had asked for it. This shows that Fort McHenry mattered because the fort held and Baltimore stayed free.",
    l5_6: "Although British ships bombed Fort McHenry for about twenty-five hours, I claim that the fort protected Baltimore. Fort McHenry, a star-shaped fort near the harbor, did not surrender. Maryland soldiers also fought at North Point and slowed the British army on land. According to Francis Scott Key, the flag was still flying at dawn. Mary Pickersgill, a Baltimore flag maker, had sewn that flag, and Commander Armistead had asked for it. As shown by these events, Marylanders defended Baltimore with courage. Since the city stayed free, their courage mattered in the fight for American freedom.",
  },
  revise: [
    "Did I state my claim in my first sentence?",
    "Did I prove it with real evidence, such as the long bombing or the flag?",
    "Did I use because, according to, or as shown by to link evidence to my claim?",
    "Did I use correct names and dates, like Fort McHenry and 1814?",
  ],
};
