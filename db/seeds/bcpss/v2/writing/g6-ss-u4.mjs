// BCPSS Writing Lab (TWR) — g6-ss-u4 · Classical Mediterranean: Ancient Greece & Rome. Contract: ../writing-schema.mjs

export default {
  title: "Whose Voice Counted Most?",
  genre: "argue",
  tip: "Have students underline the source detail that proves each reason, then say 'for example' before reading it aloud.",
  lessons: [
    { id: "A", title: "Athenian democracy and the assembly" },
    { id: "B", title: "Who was left out of Athenian citizenship" },
    { id: "C", title: "The Roman Republic: consuls, Senate and tribunes" },
    { id: "D", title: "Using primary sources to build a claim" },
  ],
  source: {
    title: "A Voice in Athens and Rome",
    lesson: "A",
    text: "In Athens, citizens met on a hill called the Pnyx to make decisions. Any citizen could speak, and the crowd voted by raising hands. Citizens also served on large juries. However, women, enslaved people, and people born elsewhere could not vote. In Rome, two consuls led the government each year, and each could veto the other. The Senate advised the consuls, and tribunes protected ordinary Romans. For example, according to Roman tradition, the plebeians went on strike in 494 BCE and won the right to choose tribunes. Even so, Rome also left out women and enslaved people. Both governments gave some people a voice, but many were left out.",
  },
  notes: [
    { sentence: "Any citizen could speak, and the crowd voted by raising hands.", note: "any citizen speaks, votes by hands" },
    { sentence: "However, women, enslaved people, and people born elsewhere could not vote.", note: "NOT voting: women, enslaved, foreign-born" },
    { sentence: "In Rome, two consuls led the government each year, and each could veto the other.", note: "Rome: 2 consuls, each can veto" },
    { sentence: "For example, according to Roman tradition, the plebeians went on strike in 494 BCE and won the right to choose tribunes.", note: "494 BCE strike → tribunes" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "Athens was a democracy",
      because: "citizens voted on laws in the assembly.",
      but: "women, enslaved people, and people born elsewhere could not vote.",
      so: "most people who lived in Athens had no voice.",
    },
    {
      lesson: "C",
      kernel: "Rome limited the power of any one leader",
      because: "two consuls shared leadership and could veto each other.",
      but: "not every Roman had an equal voice.",
      so: "tribunes were created to protect ordinary Romans.",
    },
    {
      lesson: "D",
      kernel: "A strong historical argument uses primary sources",
      because: "they come from people who lived through the events.",
      but: "a single source may show only one point of view.",
      so: "a writer should compare more than one source.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "Citizens voted.",
      parts: { when: "On assembly days", where: "on the Pnyx", how: "by raising their hands" },
      model: "On assembly days, citizens voted on the Pnyx by raising their hands.",
    },
    {
      lesson: "C",
      kernel: "The plebeians went on strike.",
      parts: { when: "In 494 BCE", where: "in Rome", why: "to win protection from unfair decisions" },
      model: "In 494 BCE, the plebeians went on strike in Rome to win protection from unfair decisions.",
    },
  ],
  fragments: [
    { text: "A republic is a government in which citizens elect leaders.", is_sentence: true },
    { text: "Because each consul could veto the other.", is_sentence: false, fix: "Power was shared because each consul could veto the other." },
    { text: "Could not vote in the assembly.", is_sentence: false, fix: "Women and enslaved people could not vote in the assembly." },
    { text: "The Senate advised the consuls.", is_sentence: true },
    { text: "Although Athens was a democracy.", is_sentence: false, fix: "Although Athens was a democracy, most people had no vote." },
    { text: "A primary source is a record made by someone who lived through the events.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The Pnyx, ___, was where Athenian citizens held their assembly.",
      noun: "Pnyx",
      options: ["a hill in Athens", "a council of leading Roman citizens", "a government where leaders are elected"],
      answer: 0,
      model: "The Pnyx, a hill in Athens, was where Athenian citizens held their assembly.",
    },
    {
      lesson: "C",
      sentence: "A consul, ___, led the Roman Republic for one year.",
      noun: "consul",
      options: ["one of two leaders elected each year", "an official who protected ordinary Romans", "a person born in another city"],
      answer: 0,
      model: "A consul, one of two leaders elected each year, led the Roman Republic for one year.",
    },
    {
      lesson: "D",
      sentence: "A primary source, ___, helps a writer prove a claim.",
      noun: "primary source",
      options: ["a record made by someone who lived through the events", "a statement that needs proof", "a change that fixes a law"],
      answer: 0,
      model: "A primary source, a record made by someone who lived through the events, helps a writer prove a claim.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "because", stem: "no single person could rule alone", model: "Because two consuls shared leadership, no single person could rule alone." },
    { lesson: "B", conjunction: "although", stem: "women and enslaved people could not vote", model: "Although Athens was a democracy, women and enslaved people could not vote." },
    { lesson: "D", conjunction: "since", stem: "it makes strong evidence", model: "Since a primary source comes from someone who lived the event, it makes strong evidence." },
  ],
  spo: {
    topic: {
      l1_2: "I think [Athens] gave citizens more [voice].",
      l3_4: "I argue that [Athens] gave citizens a more direct voice because [any citizen could speak and vote in the assembly].",
      l5_6: "Although [Rome shared power through consuls and tribunes], I argue that [Athens] gave citizens a more direct voice, since [any citizen could speak and vote], even though [many people were left out].",
    },
    starters: [
      { type: "question", text: "Whose voice counted more, a citizen in Athens or a citizen in Rome?" },
      { type: "appositive", text: "The Pnyx, a hill in Athens, was where citizens spoke and voted on important decisions." },
      { type: "subordinate", text: "Although Rome had consuls and a Senate, Athens let citizens vote directly." },
    ],
    details: [
      { note: "Athens: any citizen can speak", lesson: "A" },
      { note: "citizens vote by raising hands", lesson: "A" },
      { note: "citizens serve on large juries", lesson: "A" },
      { note: "left out: women, enslaved, foreign-born", lesson: "B" },
      { note: "Rome: elected consuls + Senate", lesson: "C" },
      { note: "tribunes protect ordinary Romans", lesson: "C" },
    ],
    distractors: ["Athens was famous for its marble temples", "Rome is the capital of Italy today"],
    conclusion: {
      l1_2: "Athens gave [more] voice to [citizens].",
      l3_4: "Because citizens in Athens decided for themselves, I believe their voice was [stronger], although [many people] were left out.",
      l5_6: "Therefore, Athens gave citizens more direct power, but it was a voice [only a few people] could use.",
    },
  },
  prompt: {
    l1_2: "Draw people voting on the Pnyx. Write 3-4 sentences about who had a voice in Athens. Use the words citizen, vote, and voice.",
    l3_4: "Write a paragraph that argues whether Athens or Rome gave citizens more voice. Use your outline, because, and for example.",
    l5_6: "Write a paragraph that argues which government gave citizens a more direct voice, uses evidence from the sources, and admits who was left out. Include an appositive and a sentence that starts with although or since.",
  },
  transitions: ["I argue that", "Because", "Since", "For example,", "According to", "However,", "This shows", "Therefore,"],
  model: {
    l1_2: "In Athens, citizens met on the Pnyx. Any citizen could speak and vote. Women and enslaved people could not vote. I think Athens gave citizens more voice.",
    l3_4: "I argue that Athens gave citizens a more direct voice than Rome. For example, any citizen could speak in the assembly, and the crowd voted by raising hands. In Rome, citizens mostly elected leaders, such as two consuls, to decide for them. However, both governments left out women and enslaved people. Since citizens in Athens decided for themselves, I believe their voice was stronger.",
    l5_6: "Although the Roman Republic shared power through consuls and tribunes, I argue that Athens gave its citizens a more direct voice. For example, on the Pnyx, any citizen could speak, and the crowd voted by raising hands. Citizens also served on large juries. In Rome, the people mostly elected leaders, such as two consuls, to decide for them. Tribunes did protect ordinary Romans, which shows that Rome also listened to some voices. However, both governments left out women, enslaved people, and people born elsewhere. Therefore, Athens gave citizens more direct power, but it was a voice only a few people could use.",
  },
  mpo: {
    thesis: "Athens gave its citizens a more direct voice than Rome, although both governments left many people out.",
    paragraphs: [
      { topic: "In Athens, citizens spoke and voted for themselves.", notes: ["any citizen speaks + votes", "hands raised on Pnyx", "large juries"] },
      { topic: "In Rome, power was shared among leaders and groups.", notes: ["two consuls, veto", "Senate advises", "tribunes protect plebeians (494 BCE)"] },
      { topic: "Both governments left many people out.", notes: ["women", "enslaved people", "people born elsewhere"] },
    ],
    conclusion: "Because Athenian citizens could vote directly, their voice was stronger, but the many people who were left out show that no ancient government gave everyone a voice.",
  },
  revise: [
    "Did I state a clear claim about which government gave citizens more voice?",
    "Did I support my claim with a fact from the sources, such as the assembly or the consuls?",
    "Did I explain how my evidence proves the claim, not just list it?",
    "Did I tell who was left out so that my argument is fair?",
  ],
};
