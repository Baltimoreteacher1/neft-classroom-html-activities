// BCPSS Writing Lab (TWR) — g2-sci-u1 · Properties & Changes of Matter. Contract: ../writing-schema.mjs

export default {
  title: "Solid, Liquid, or Both?",
  genre: "inform",
  tip: "Let students handle an ice cube and a cup of juice, then say what they notice before they write.",
  lessons: [
    { id: "A", title: "Observe properties like texture and flexibility" },
    { id: "B", title: "Sort solids and liquids" },
    { id: "C", title: "Melting and freezing" },
    { id: "D", title: "Reversible and not reversible changes" },
  ],
  source: {
    title: "A Block, a Cup, and an Ice Cube",
    lesson: "B",
    text: "A wooden block is a solid. It keeps its own shape. Orange juice is a liquid. It pours and takes the shape of its cup. An ice cube is a solid too. When it gets warm, it melts into water. Then you can freeze the water again. That change is reversible.",
  },
  notes: [
    { sentence: "A wooden block is a solid.", note: "block = solid, keeps shape" },
    { sentence: "It pours and takes the shape of its cup.", note: "juice = liquid, pours" },
    { sentence: "When it gets warm, it melts into water.", note: "warm → melts → water" },
    { sentence: "Then you can freeze the water again.", note: "freeze again = reversible" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "A rubber band is flexible",
      because: "it can bend without breaking.",
      but: "a brick is not flexible.",
      so: "we can stretch it around a stack of papers.",
    },
    {
      lesson: "B",
      kernel: "Orange juice is a liquid",
      because: "it pours and takes the shape of its cup.",
      but: "it can turn into a solid if it freezes.",
      so: "we can pour it from a jug into a cup.",
    },
    {
      lesson: "D",
      kernel: "Baking a cookie is not a reversible change",
      because: "the dough turns into something new.",
      but: "melting butter in a pan is reversible.",
      so: "we cannot turn the cookie back into dough.",
    },
  ],
  expand: [
    {
      lesson: "C",
      kernel: "The ice cube melted.",
      parts: { when: "in the warm sun", where: "on the sidewalk", how: "into a small puddle" },
      model: "In the warm sun, the ice cube melted on the sidewalk into a small puddle.",
    },
    {
      lesson: "A",
      kernel: "Dee observed the rock.",
      parts: { where: "in the schoolyard", how: "with a magnifying glass", why: "to notice its texture" },
      model: "In the schoolyard, Dee observed the rock with a magnifying glass to notice its texture.",
    },
  ],
  fragments: [
    { text: "A solid keeps its own shape.", is_sentence: true },
    { text: "Because it pours.", is_sentence: false, fix: "Juice is a liquid because it pours." },
    { text: "Melts into water.", is_sentence: false, fix: "The ice cube melts into water." },
    { text: "The change is reversible.", is_sentence: true },
    { text: "A rubber band that can bend.", is_sentence: false, fix: "A rubber band can bend without breaking." },
    { text: "Water freezes when it gets very cold.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "B",
      sentence: "A solid, ___, does not pour.",
      noun: "solid",
      options: ["matter that keeps its own shape", "matter that flows in a cup", "a change that cannot go back"],
      answer: 0,
      model: "A solid, matter that keeps its own shape, does not pour.",
    },
    {
      lesson: "B",
      sentence: "A liquid, ___, takes the shape of its container.",
      noun: "liquid",
      options: ["matter that keeps its own shape", "matter that can flow", "a way to sort by color"],
      answer: 1,
      model: "A liquid, matter that can flow, takes the shape of its container.",
    },
    {
      lesson: "C",
      sentence: "Melting, ___, is a reversible change.",
      noun: "Melting",
      options: ["when a liquid turns into a solid", "when an egg turns firm", "when a solid turns into a liquid"],
      answer: 2,
      model: "Melting, when a solid turns into a liquid, is a reversible change.",
    },
  ],
  subordinate: [
    { lesson: "C", conjunction: "when", stem: "it melts into water", model: "When an ice cube gets warm, it melts into water." },
    { lesson: "B", conjunction: "because", stem: "it takes the shape of the cup", model: "Because juice is a liquid, it takes the shape of the cup." },
    { lesson: "D", conjunction: "unless", stem: "it will not freeze", model: "Unless the water gets very cold, it will not freeze." },
  ],
  spo: {
    topic: {
      l1_2: "An ice cube is a [solid].",
      l3_4: "An ice cube is a [solid] because it [keeps its own shape], but it can [melt] into a liquid.",
      l5_6: "An ice cube, [a solid], keeps its own shape, although it [melts into a liquid] when [it gets warm].",
    },
    starters: [
      { type: "question", text: "Is an ice cube a solid or a liquid?" },
      { type: "appositive", text: "An ice cube, a frozen piece of water, is a solid." },
      { type: "subordinate", text: "When an ice cube gets warm, it melts into water." },
    ],
    details: [
      { note: "ice cube = solid", lesson: "B" },
      { note: "keeps its own shape", lesson: "B" },
      { note: "does not pour like juice", lesson: "B" },
      { note: "warm → melts → water", lesson: "C" },
      { note: "freeze again → ice", lesson: "C" },
      { note: "melt + freeze = reversible", lesson: "D" },
    ],
    distractors: ["lemonade tastes sweet", "my freezer is in the kitchen"],
    conclusion: {
      l1_2: "An ice cube is a [solid], not a [liquid].",
      l3_4: "So an ice cube is a [solid], and its change is [reversible].",
      l5_6: "In conclusion, [an ice cube] is [a solid] that can [melt and freeze again], so its change is [reversible].",
    },
  },
  prompt: {
    l1_2: "Draw an ice cube. Write 1-3 sentences that tell what it is and what it is not.",
    l3_4: "Write a paragraph that tells what an ice cube is, what it is not, and what happens when it melts. Use because and but.",
    l5_6: "Write a paragraph that classifies an ice cube and describes how it changes. Include an appositive and a sentence that starts with when or although.",
  },
  transitions: ["First,", "Next,", "It is", "It is not", "But", "Because", "When", "So"],
  model: {
    l1_2: "An ice cube is a solid. It keeps its own shape. It is not a liquid.",
    l3_4: "An ice cube is a solid because it keeps its own shape. It does not pour like juice. When it gets warm, it melts into water. We can freeze the water again, so the change is reversible.",
    l5_6: "An ice cube, a frozen piece of water, is a solid. It keeps its own shape, but juice does not. Although the cube is hard, it melts into a liquid when it gets warm. Then the water can freeze again. So the change is reversible.",
  },
  revise: [
    "Did I say if it is a solid or a liquid?",
    "Did I give a reason with because?",
    "Did I tell what it is not?",
    "Did I tell if the change is reversible?",
  ],
};
