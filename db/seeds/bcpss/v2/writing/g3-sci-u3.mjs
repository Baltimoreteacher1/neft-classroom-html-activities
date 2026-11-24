// BCPSS Writing Lab (TWR) — g3-sci-u3 · Ecosystems, Fossils & Survival. Contract: ../writing-schema.mjs

export default {
  title: "Trouble at the Beaver Pond",
  genre: "argue",
  tip: "Make students point to a line in the field notes for every piece of evidence before they write the reasoning sentence.",
  lessons: [
    { id: "A", title: "Fossils as evidence of long ago" },
    { id: "B", title: "Habitats and what living things need" },
    { id: "C", title: "Adaptations that help animals survive" },
    { id: "D", title: "When a habitat changes" },
  ],
  source: {
    title: "A Pond in the Maryland Woods",
    lesson: "B",
    text: "A family of beavers lives in a pond in a Maryland forest. Beavers have strong front teeth that cut down trees. Their wide, flat tails help them swim. They build a lodge with an entrance under the water. The deep water keeps predators like coyotes away from the entrance. One summer, a dry spell shrinks the pond. Scientists measure the water every week. According to their notes, the water drops by half.",
  },
  notes: [
    { sentence: "Beavers have strong front teeth that cut down trees.", note: "strong teeth cut trees" },
    { sentence: "They build a lodge with an entrance under the water.", note: "lodge entrance under water" },
    { sentence: "The deep water keeps predators like coyotes away from the entrance.", note: "deep water keeps predators away" },
    { sentence: "According to their notes, the water drops by half.", note: "notes: pond water drops 1/2" },
  ],
  bbs: [
    {
      lesson: "D",
      kernel: "Beavers need a deep pond",
      because: "their lodge entrance is under the water.",
      but: "a dry summer can shrink the pond.",
      so: "predators can reach the lodge more easily.",
    },
    {
      lesson: "C",
      kernel: "Strong front teeth help beavers survive",
      because: "they can cut down trees for food and for dams.",
      but: "teeth cannot protect a beaver from a dried-up pond.",
      so: "beavers need good adaptations and a good habitat.",
    },
    {
      lesson: "A",
      kernel: "Fossils are evidence of long ago",
      because: "they are the hardened remains of living things.",
      but: "no person was alive to see those places.",
      so: "scientists use fossils to explain how habitats changed.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The beavers built a dam.",
      parts: { when: "last spring", where: "across the stream", how: "with sticks and mud", why: "to make a deep pond" },
      model: "Last spring, the beavers built a dam across the stream with sticks and mud to make a deep pond.",
    },
    {
      lesson: "D",
      kernel: "Scientists measured the pond.",
      parts: { when: "every week", where: "in the Maryland forest", how: "with a long stick", why: "to track the water level" },
      model: "Every week, scientists measured the pond in the Maryland forest with a long stick to track the water level.",
    },
  ],
  fragments: [
    { text: "Beavers have wide, flat tails.", is_sentence: true },
    { text: "Because the pond is shrinking.", is_sentence: false, fix: "The beavers are in trouble because the pond is shrinking." },
    { text: "The lodge entrance is under the water.", is_sentence: true },
    { text: "Keeps predators away from the lodge.", is_sentence: false, fix: "Deep water keeps predators away from the lodge." },
    { text: "According to the scientists' notes.", is_sentence: false, fix: "According to the scientists' notes, the water dropped by half." },
    { text: "A fossil is the hardened remains of a living thing.", is_sentence: true },
  ],
  appositives: [
    {
      lesson: "C",
      sentence: "A beaver, ___, uses strong front teeth to cut trees.",
      noun: "beaver",
      options: ["an animal that hunts other animals for food", "an animal that builds dams and lodges", "the hardened remains of a living thing"],
      answer: 1,
      model: "A beaver, an animal that builds dams and lodges, uses strong front teeth to cut trees.",
    },
    {
      lesson: "B",
      sentence: "A habitat, ___, gives beavers food, water, and shelter.",
      noun: "habitat",
      options: ["the place where a plant or animal lives", "a body part that helps a living thing survive", "no longer alive anywhere on Earth"],
      answer: 0,
      model: "A habitat, the place where a plant or animal lives, gives beavers food, water, and shelter.",
    },
    {
      lesson: "A",
      sentence: "A fossil, ___, can show that a habitat has changed.",
      noun: "fossil",
      options: ["a statement that tells what you think is true", "all the living and nonliving things in one place", "the hardened remains or print of a living thing from long ago"],
      answer: 2,
      model: "A fossil, the hardened remains or print of a living thing from long ago, can show that a habitat has changed.",
    },
  ],
  subordinate: [
    { lesson: "D", conjunction: "because", stem: "the beavers will struggle in a dry pond", model: "Because their lodge entrance needs deep water, the beavers will struggle in a dry pond." },
    { lesson: "D", conjunction: "when", stem: "predators can reach the lodge", model: "When the water gets shallow, predators can reach the lodge." },
    { lesson: "C", conjunction: "if", stem: "the beavers will survive", model: "If the rain returns soon, the beavers will survive." },
  ],
  spo: {
    topic: {
      l1_2: "I think the beavers will [struggle] in a dry pond.",
      l3_4: "I claim that the beavers will [struggle] because [their lodge needs deep water].",
      l5_6: "I claim that [the beavers, animals that build dams and lodges,] will struggle when their pond shrinks because [their lodge entrance needs deep water to stay safe].",
    },
    starters: [
      { type: "question", text: "What happens to a beaver family when its pond dries up?" },
      { type: "statement", text: "I claim that a shrinking pond is bad news for beavers." },
      { type: "subordinate", text: "Although beavers have strong teeth, they still need deep water." },
    ],
    details: [
      { note: "lodge entrance under water", lesson: "B" },
      { note: "deep water keeps predators away", lesson: "B" },
      { note: "pond shrinks, water drops by half", lesson: "D" },
      { note: "strong teeth cut trees", lesson: "C" },
      { note: "wide flat tail helps swimming", lesson: "C" },
      { note: "fossils show habitats change", lesson: "A" },
    ],
    distractors: ["blue crabs live in the bay", "green frogs sit by the pond"],
    conclusion: {
      l1_2: "The beavers need [deep water].",
      l3_4: "This shows that [beavers need deep water], so [the dry pond is a problem].",
      l5_6: "This evidence shows that [a habitat that changes too much], like [a shrinking pond], can make survival harder even for [well-adapted animals].",
    },
  },
  prompt: {
    l1_2: "Draw the beaver pond. Write 2-3 sentences. Tell what you think will happen and one reason.",
    l3_4: "A dry spell shrinks the beavers' pond. Make a claim about whether the beavers will do well. Back it up with evidence from the notes.",
    l5_6: "Argue whether the beaver family will survive a dry summer. Include an appositive, a sentence that starts with because or when, and evidence from the scientists' notes.",
  },
  transitions: ["I claim that", "Because", "According to", "This shows that", "For example,", "Also,", "However,", "In conclusion,"],
  model: {
    l1_2: "I think the beavers will struggle. Their lodge needs deep water. The pond is shrinking.",
    l3_4: "I claim that the beavers will struggle in the dry pond because their lodge needs deep water. According to the notes, the water dropped by half. The lodge entrance is under the water, and the deep water keeps predators away. This shows that a shallow pond is not safe. For these reasons, the beavers will have a hard time.",
    l5_6: "I claim that the beavers, animals that build dams and lodges, will struggle when their pond shrinks. Beavers have strong front teeth and wide, flat tails, but those adaptations cannot replace deep water. According to the scientists' notes, the water dropped by half. The lodge entrance sits under the water, and the deep water keeps coyotes away. Because the pond is shallow now, predators can reach the lodge more easily. This evidence shows that even well-adapted animals can struggle when a habitat changes.",
  },
  revise: [
    "Did I state my claim before I gave evidence?",
    "Did I use evidence from the notes, like the lodge entrance or the water dropping?",
    "Did I explain how the evidence proves my claim with this shows that?",
    "Did I use habitat or adaptation correctly?",
  ],
};
