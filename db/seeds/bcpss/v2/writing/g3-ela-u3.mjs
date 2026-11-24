// BCPSS Writing Lab (TWR) — g3-ela-u3 · A New Home. Contract: ../writing-schema.mjs

export default {
  title: "Lucía Finds a Friend",
  genre: "narrate",
  tip: "Let students say the character's feeling and reason aloud first, then write one line of dialogue before they draft the paragraph.",
  lessons: [
    { id: "A", title: "Why families move to a new place" },
    { id: "B", title: "Two feelings about one move" },
    { id: "C", title: "Traditions that travel with a family" },
    { id: "D", title: "Telling a story from one character's point of view" },
  ],
  source: {
    title: "The Gate at Patterson Park",
    lesson: "A",
    text: "Lucía and her brother Mateo moved to Baltimore in the winter. One Saturday, a neighbor took them to Patterson Park. Mateo ran up the hill toward the old pagoda. Lucía stood by the gate. 'Everything sounds different here,' she whispered. She missed her grandmother's kitchen. Then a girl named Priya waved from a bench. 'Hola!' Priya said, with a big smile. Lucía smiled back for the first time that week.",
  },
  notes: [
    { sentence: "One Saturday, a neighbor took them to Patterson Park.", note: "Sat: neighbor → Patterson Park" },
    { sentence: "Mateo ran up the hill toward the old pagoda.", note: "Mateo runs → pagoda (excited)" },
    { sentence: "She missed her grandmother's kitchen.", note: "misses Abuela's kitchen" },
    { sentence: "'Hola!' Priya said, with a big smile.", note: "Priya: Hola! + smile" },
  ],
  bbs: [
    {
      lesson: "B",
      kernel: "Lucía felt sad at the park",
      because: "she missed her grandmother's kitchen.",
      but: "her brother Mateo felt excited.",
      so: "she stood by the gate and did not run to play.",
    },
    {
      lesson: "B",
      kernel: "Mateo ran up the hill",
      because: "he was excited to see the new park.",
      but: "his sister stayed behind at the gate.",
      so: "he reached the old pagoda first.",
    },
    {
      lesson: "D",
      kernel: "Priya said hello in Spanish",
      because: "she wanted Lucía to feel welcome.",
      but: "Lucía was too shy to answer right away.",
      so: "Lucía smiled back for the first time that week.",
    },
  ],
  expand: [
    {
      lesson: "D",
      kernel: "Lucía whispered.",
      parts: { where: "by the park gate", how: "in a small voice", why: "because everything sounded different" },
      model: "By the park gate, Lucía whispered in a small voice because everything sounded different.",
    },
    {
      lesson: "B",
      kernel: "Mateo ran.",
      parts: { when: "on Saturday", where: "up the hill", how: "with a huge grin", why: "to see the old pagoda" },
      model: "On Saturday, Mateo ran up the hill with a huge grin to see the old pagoda.",
    },
  ],
  fragments: [
    { text: "Lucía missed her grandmother.", is_sentence: true },
    { text: "Waved from the bench.", is_sentence: false, fix: "Priya waved from the bench." },
    { text: "Because everything sounded different.", is_sentence: false, fix: "Lucía whispered because everything sounded different." },
    { text: "Mateo felt excited about the park.", is_sentence: true },
    { text: "When Lucía smiled back.", is_sentence: false, fix: "Priya felt happy when Lucía smiled back." },
    { text: "The neighbor took them to the park.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "Lucía, ___, stood by the gate.",
      noun: "Lucía",
      options: ["a bench near the old pagoda", "a girl who missed her grandmother", "a big park in Baltimore"],
      answer: 1,
      model: "Lucía, a girl who missed her grandmother, stood by the gate.",
    },
    {
      lesson: "D",
      sentence: "Priya, ___, waved from a bench.",
      noun: "Priya",
      options: ["a friendly girl who lived nearby", "the boy who raced up the hill", "the grandmother in Lucía's letters"],
      answer: 0,
      model: "Priya, a friendly girl who lived nearby, waved from a bench.",
    },
    {
      lesson: "C",
      sentence: "Patterson Park, ___, is where Lucía first smiled.",
      noun: "Patterson Park",
      options: ["a kitchen full of family food", "a letter to Abuela", "a large park in East Baltimore"],
      answer: 2,
      model: "Patterson Park, a large park in East Baltimore, is where Lucía first smiled.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "Lucía felt homesick", model: "When she thought about her grandmother, Lucía felt homesick." },
    { lesson: "D", conjunction: "although", stem: "Lucía smiled back at Priya", model: "Although she was shy, Lucía smiled back at Priya." },
    { lesson: "B", conjunction: "before", stem: "Mateo ran up the hill", model: "Before his sister could say a word, Mateo ran up the hill." },
  ],
  spo: {
    topic: {
      l1_2: "[Lucía] felt [sad] in the new park.",
      l3_4: "From [Lucía]'s perspective, the new park felt [strange] because [she missed her grandmother].",
      l5_6: "Although [her brother Mateo] felt excited, [Lucía, a girl who missed her grandmother's kitchen,] felt homesick in a park that sounded unfamiliar.",
    },
    starters: [
      { type: "question", text: "How does it feel when everything around you sounds different?" },
      { type: "appositive", text: "Lucía, a girl who missed her grandmother, stood quietly by the gate." },
      { type: "subordinate", text: "Although the park was beautiful, Lucía felt homesick." },
    ],
    details: [
      { note: "moved to Baltimore in winter", lesson: "A" },
      { note: "Lucía by gate, whispers", lesson: "D" },
      { note: "misses Abuela's kitchen", lesson: "C" },
      { note: "Mateo runs up hill, excited", lesson: "B" },
      { note: "Priya waves, says Hola", lesson: "D" },
      { note: "Lucía smiles first time", lesson: "B" },
    ],
    distractors: ["the Baltimore harbor has tall ships", "the pagoda is very old"],
    conclusion: {
      l1_2: "Lucía felt [better].",
      l3_4: "In the end, Lucía felt [hopeful] because [a new friend said hello].",
      l5_6: "By the end of the day, Lucía [still missed home], but [one friendly 'Hola' made the new city feel less strange].",
    },
  },
  prompt: {
    l1_2: "Draw Lucía at the park gate. Write 2-3 sentences. Tell how she feels and why.",
    l3_4: "Write a paragraph from Lucía's perspective about her first day at Patterson Park. Tell how she feels and why. Add one line of dialogue.",
    l5_6: "Write a paragraph from Lucía's perspective that shows how she feels and what she wants. Include dialogue, an appositive, and a sentence that starts with although or when.",
  },
  transitions: ["At first,", "Then", "Suddenly,", "However,", "Meanwhile,", "Because", "Finally,", "In the end,"],
  model: {
    l1_2: "From Lucía's perspective, the park felt strange. She missed her grandmother. Then Priya said hello, and Lucía smiled.",
    l3_4: "From Lucía's perspective, the new park felt strange because everything sounded different. She stood by the gate and missed her grandmother's kitchen. However, her brother Mateo felt excited, so he ran up the hill. Then a girl named Priya waved and said, 'Hola!' In the end, Lucía felt hopeful because a new friend said hello.",
    l5_6: "From Lucía's perspective, Patterson Park was beautiful but strange. Lucía, a girl who missed her grandmother's kitchen, stood by the gate and whispered, 'Everything sounds different here.' Although her brother Mateo felt excited, he ran up the hill without her. Lucía wished she could go home. She felt very far from her grandmother. Then a girl named Priya waved from a bench and called, 'Hola!' By the end of the day, Lucía still missed home, but one friendly hello made the new city feel less strange.",
  },
  revise: [
    "Did I tell how the character feels from her own point of view?",
    "Did I explain why she feels that way?",
    "Did I add a line of dialogue with quotation marks?",
    "Did I use but or however to show a different view?",
  ],
};
