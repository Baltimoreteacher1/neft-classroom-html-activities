// BCPSS Writing Lab (TWR) — g8-ela-u1 · The Poetics and Power of Storytelling. Contract: ../writing-schema.mjs

export default {
  title: "Voice on the Court",
  genre: "narrate",
  tip: "Have students read the speaker's lines aloud first so they can hear the rhythm change before they write about it.",
  lessons: [
    { id: "A", title: "Rhythm and line length in a novel in verse" },
    { id: "B", title: "Imagery and metaphor that show feeling" },
    { id: "C", title: "The speaker's perspective and motivation" },
    { id: "D", title: "Loss and coming of age in the last stanza" },
  ],
  source: {
    title: "Fast Lines, Slow Lines",
    lesson: "A",
    text: "In a novel in verse, the poet tells a long story through short poems. Josh Bell, the narrator of The Crossover, plays basketball with his twin brother. When Josh describes a game, the lines are short and quick. The rhythm bounces like a dribbled ball, so readers feel the speed of the court. Later, when the family faces a painful loss, the poet slows the lines down. Longer phrases and pauses make readers stop and feel the weight of the moment. A metaphor can also show a feeling. If a speaker calls the court a kingdom, readers understand that it is a place where he feels proud and in control. The poet's choices tell us what the speaker feels without saying it directly.",
  },
  notes: [
    { sentence: "When Josh describes a game, the lines are short and quick.", note: "game = short, quick lines" },
    { sentence: "The rhythm bounces like a dribbled ball, so readers feel the speed of the court.", note: "bouncing rhythm → speed of court" },
    { sentence: "Later, when the family faces a painful loss, the poet slows the lines down.", note: "loss → slower lines" },
    { sentence: "If a speaker calls the court a kingdom, readers understand that it is a place where he feels proud and in control.", note: "court = kingdom → proud, in control" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The poet uses short, quick lines for the game",
      because: "the fast rhythm helps readers feel the speed of the court.",
      but: "the lines slow down when the speaker thinks about his father.",
      so: "readers can hear the mood change from joy to sadness.",
    },
    {
      lesson: "B",
      kernel: "A metaphor can show how a speaker feels",
      because: "it says one thing is another thing and helps readers picture it.",
      but: "it never names the feeling out loud.",
      so: "readers have to think about what the comparison means.",
    },
    {
      lesson: "D",
      kernel: "The boy in the poem stares at the empty court",
      because: "his father is gone.",
      but: "the court looks exactly the same as it did last summer.",
      so: "he calls the streetlight a lonely moon.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "The poet slows the lines.",
      parts: { when: "in the last stanza", how: "with longer phrases and pauses", why: "to show that the speaker is grieving" },
      model: "In the last stanza, the poet slows the lines with longer phrases and pauses to show that the speaker is grieving.",
    },
    {
      lesson: "C",
      kernel: "The boy stares.",
      parts: { when: "at dusk", where: "at the empty court", why: "because his father is gone" },
      model: "At dusk, the boy stares at the empty court because his father is gone.",
    },
  ],
  fragments: [
    { text: "Free verse does not follow a fixed rhyme pattern.", is_sentence: true },
    { text: "Short lines with a fast, bouncing rhythm.", is_sentence: false, fix: "The poet uses short lines with a fast, bouncing rhythm." },
    { text: "Because the stanza slows down at the end.", is_sentence: false, fix: "Readers pause because the stanza slows down at the end." },
    { text: "The speaker compares the court to a kingdom.", is_sentence: true },
    { text: "Calls the streetlight a lonely moon.", is_sentence: false, fix: "The boy calls the streetlight a lonely moon." },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "A metaphor, ___, can show a feeling without naming it.",
      noun: "metaphor",
      options: ["a comparison that says one thing is another thing", "a group of lines in a poem", "a pattern of strong and soft beats"],
      answer: 0,
      model: "A metaphor, a comparison that says one thing is another thing, can show a feeling without naming it.",
    },
    {
      lesson: "A",
      sentence: "A stanza, ___, can hold one big idea.",
      noun: "stanza",
      options: ["the voice that tells a poem", "a group of lines in a poem", "the spot where a line ends"],
      answer: 1,
      model: "A stanza, a group of lines in a poem, can hold one big idea.",
    },
    {
      lesson: "C",
      sentence: "The speaker, ___, may feel differently than the poet does.",
      noun: "speaker",
      options: ["a pattern of strong and soft beats", "the attitude shown toward a subject", "the voice that tells a poem"],
      answer: 2,
      model: "The speaker, the voice that tells a poem, may feel differently than the poet does.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "when", stem: "the lines race across the page", model: "When the speaker describes the game, the lines race across the page." },
    { lesson: "D", conjunction: "although", stem: "the final stanza still feels tender", model: "Although the speaker is grieving, the final stanza still feels tender." },
    { lesson: "C", conjunction: "while", stem: "his sister sees the same night as sad", model: "While the boy remembers the court as a place of pride, his sister sees the same night as sad." },
  ],
  spo: {
    topic: {
      l1_2: "The poet uses [short lines] to show how the speaker feels.",
      l3_4: "In a poem about a game, the poet uses [short lines] and [a metaphor] to show how the speaker feels about [family].",
      l5_6: "Although the speaker never says he is grieving, [the poet's choice of rhythm and metaphor] reveals [how loss changes the way he sees the game].",
    },
    starters: [
      { type: "question", text: "How can short lines make readers feel the speed of a game?" },
      { type: "appositive", text: "Last Shot, an original poem about free throws with a father, uses rhythm to show feeling." },
      { type: "subordinate", text: "When the lines suddenly slow down, readers know something has changed." },
    ],
    details: [
      { note: "short lines = fast rhythm, game action", lesson: "A" },
      { note: "dribble, dribble, snap = sound of ball", lesson: "B" },
      { note: "last stanza slows + longer phrases", lesson: "A" },
      { note: "speaker = proud of dad, then grieving", lesson: "C" },
      { note: "line break after 'gone' = pause", lesson: "D" },
      { note: "metaphor: the ball is a spinning planet", lesson: "B" },
    ],
    distractors: ["each basketball team has five players on the court", "a free throw is worth one point"],
    conclusion: {
      l1_2: "The [rhythm] shows how he [feels].",
      l3_4: "Because the poet changes the [rhythm], readers can feel [the loss] without being told.",
      l5_6: "By letting [the rhythm slow and the images soften], the poet turns [a basketball game into a portrait of grief and love].",
    },
  },
  prompt: {
    l1_2: "Draw the cracked court. Write 3-4 sentences from the speaker's point of view. Tell what you see and what you feel.",
    l3_4: "Narrate the last free throw from the speaker's perspective. Show what he wants, why he wants it, and how his feelings change. Use your outline and two order words.",
    l5_6: "Narrate the last free throw from the speaker's perspective, then contrast it with his sister's view of the same moment. Include an appositive and a sentence that starts with although or while.",
  },
  transitions: ["At first,", "Then,", "Suddenly,", "Meanwhile,", "Yet", "Whereas", "As a result,", "In the end,"],
  model: {
    l1_2: "I stand on the cracked court in Baltimore. The ball bounces fast, and my heart bounces too. Dad is not here now. I miss him.",
    l3_4: "From my perspective, the cracked court was the happiest place in the world. At first, I dribbled fast, and the beat of the ball matched my heartbeat. I wanted to make one last free throw because my dad always counted them out loud. Then I looked at the empty bench, and my chest felt heavy and slow. Because he was gone, every bounce echoed. In the end, I missed the shot, yet I felt close to him.",
    l5_6: "Although the court was empty at dusk, Marcus, a boy who had learned every shot from his father, dribbled as if the bleachers were full. From his perspective, each quick bounce was a promise to keep playing. He wanted to sink one last free throw because his dad had always counted them out loud. Yet when the ball left his hands, the rhythm in his head slowed, and the hoop looked far away. His sister Dani, watching from the fence, saw something different. Whereas Marcus saw a game to win, she saw a boy saying goodbye. The ball dropped through the net, and neither of them spoke. In that silence, the loss felt louder than any cheer.",
  },
  mpo: {
    thesis: "In poems about family and loss, a poet's choices of rhythm, metaphor, and perspective reveal what the speaker feels but never says.",
    paragraphs: [
      { topic: "Fast, short lines show the speaker's joy in the game.", notes: ["short lines = quick rhythm", "dribble, snap = ball beat", "joy w/ dad on court"] },
      { topic: "Slow lines and a line break show the speaker's grief.", notes: ["last stanza slows", "line break after 'gone' = pause", "loss too heavy to hurry"] },
      { topic: "Metaphor and perspective show how loss changes the way he sees the court.", notes: ["court = kingdom → pride", "sister's view = goodbye", "same moment, two feelings"] },
    ],
    conclusion: "Because the poet changes rhythm and uses metaphor, readers feel the speaker's love and loss without being told, and they see how growing up can change the same place.",
  },
  revise: [
    "Did I write from one speaker's point of view and show what he wants?",
    "Did I let the rhythm or length of my sentences change when the feeling changes?",
    "Did I use one image or metaphor instead of naming the feeling?",
    "Did I show how another person might see the same moment differently?",
  ],
};
