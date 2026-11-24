// BCPSS Writing Lab (TWR) — g1-ela-u2 · Creature Features. Contract: ../writing-schema.mjs

export default {
  title: "How Body Parts Help",
  genre: "explain",
  tip: "Point to the matching body part on a picture while students say the part, the job, and the because-reason aloud.",
  lessons: [
    { id: "A", title: "Animal body parts" },
    { id: "B", title: "Parts that help animals catch food" },
    { id: "C", title: "Parts that protect animals" },
    { id: "D", title: "Use because to tell why" },
  ],
  source: {
    title: "The Night Hunter",
    lesson: "B",
    text: "A great horned owl lives in a Maryland forest. It has big, round eyes. The eyes help it see at night. It also has sharp claws. The claws help it catch a mouse. The owl has soft feathers. The feathers make it quiet. A mouse cannot hear the owl. So the owl stays alive.",
  },
  notes: [
    { sentence: "The eyes help it see at night.", note: "eyes → see @ night" },
    { sentence: "The claws help it catch a mouse.", note: "claws → catch mouse" },
    { sentence: "The feathers make it quiet.", note: "feathers → quiet" },
    { sentence: "A mouse cannot hear the owl.", note: "mouse can't hear owl" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The owl has big, round eyes",
      because: "it hunts in the dark.",
      but: "it still needs some light to see.",
      so: "it can spot a mouse at night.",
    },
    {
      lesson: "B",
      kernel: "The owl has sharp claws",
      because: "it needs to grab a mouse.",
      but: "its claws are not made for walking.",
      so: "the mouse cannot get away.",
    },
    {
      lesson: "C",
      kernel: "The owl has soft feathers",
      because: "soft feathers make no sound.",
      but: "the owl can still hoot loudly.",
      so: "a mouse cannot hear it coming.",
    },
  ],
  expand: [
    {
      lesson: "B",
      kernel: "The owl hunts.",
      parts: { when: "at night", where: "in the forest", how: "with quiet wings", why: "to catch a mouse" },
      model: "At night, the owl hunts in the forest with quiet wings to catch a mouse.",
    },
    {
      lesson: "C",
      kernel: "The turtle hides.",
      parts: { when: "after it sees a fox", where: "inside its hard shell", why: "to stay safe" },
      model: "After it sees a fox, the turtle hides inside its hard shell to stay safe.",
    },
  ],
  fragments: [
    { text: "The owl has sharp claws.", is_sentence: true },
    { text: "Big, round eyes.", is_sentence: false, fix: "The owl has big, round eyes." },
    { text: "Helps the owl catch a mouse.", is_sentence: false, fix: "The claw helps the owl catch a mouse." },
    { text: "The feathers make the owl quiet.", is_sentence: true },
    { text: "Because it hunts at night.", is_sentence: false, fix: "The owl has big eyes because it hunts at night." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "The owl, ___, lives in a Maryland forest.",
      noun: "The owl",
      options: ["a bird that hunts at night", "a hard cover on a turtle", "a sharp nail on a foot"],
      answer: 0,
      model: "The owl, a bird that hunts at night, lives in a Maryland forest.",
    },
    {
      lesson: "B",
      sentence: "A claw, ___, helps the owl catch food.",
      noun: "A claw",
      options: ["the hard mouth of a bird", "a sharp, curved nail", "a soft cover for the body"],
      answer: 1,
      model: "A claw, a sharp, curved nail, helps the owl catch food.",
    },
    {
      lesson: "C",
      sentence: "A feather, ___, helps the owl fly quietly.",
      noun: "A feather",
      options: ["a hard cover on a crab", "a sharp spine on a porcupine", "a soft, light part of a bird"],
      answer: 2,
      model: "A feather, a soft, light part of a bird, helps the owl fly quietly.",
    },
  ],
  subordinate: [
    { lesson: "A", conjunction: "because", stem: "the owl can see at night", model: "Because it has big eyes, the owl can see at night." },
    { lesson: "C", conjunction: "when", stem: "the mouse cannot hear it", model: "When the owl flies, the mouse cannot hear it." },
    { lesson: "D", conjunction: "if", stem: "the owl could not catch a mouse", model: "If it had no sharp claws, the owl could not catch a mouse." },
  ],
  spo: {
    topic: {
      l1_2: "The [owl] has [a body part].",
      l3_4: "A [great horned owl] has [body parts] to [hunt at night].",
      l5_6: "Although [a mouse is hard to catch], the owl has [special body parts], which help it [hunt well].",
    },
    starters: [
      { type: "question", text: "How does an owl catch a mouse in the dark?" },
      { type: "appositive", text: "The great horned owl, a bird of Maryland forests, has special body parts." },
      { type: "exclamation", text: "What amazing body parts an owl has!" },
    ],
    details: [
      { note: "big eyes → see @ night", lesson: "A" },
      { note: "sharp claws → catch mouse", lesson: "B" },
      { note: "soft feathers → quiet", lesson: "C" },
      { note: "mouse can't hear owl", lesson: "C" },
      { note: "lives in Maryland forest", lesson: "A" },
      { note: "body parts → stay alive", lesson: "D" },
    ],
    distractors: ["the forest has tall oak trees", "mice like cheese"],
    conclusion: {
      l1_2: "The [owl] stays [alive].",
      l3_4: "So the [owl] stays alive because its [body parts] [help it].",
      l5_6: "This helps the owl [survive], because [every body part has a job].",
    },
  },
  prompt: {
    l1_2: "Draw an owl. Write 1-3 sentences. Tell one body part and how it helps.",
    l3_4: "Write about an owl's body parts. Tell how each part helps the owl. Use the word because.",
    l5_6: "Explain how an owl's body parts help it survive. Include an appositive and a sentence that starts with because, when, or if.",
  },
  transitions: ["First,", "Also,", "Because", "So", "For example,", "That is why", "As a result,", "This helps"],
  model: {
    l1_2: "The owl has big eyes. The eyes help it see at night.",
    l3_4: "A great horned owl has body parts to hunt at night. Its big eyes help it see because it is dark. Its sharp claws help it catch a mouse. So the owl stays alive.",
    l5_6: "Although a mouse is hard to catch, the great horned owl, a bird of Maryland forests, has special body parts. Its big eyes help it see at night because it hunts in the dark. Its soft feathers make no sound, so a mouse cannot hear it. If it had no sharp claws, it could not catch a mouse. This helps the owl survive.",
  },
  revise: [
    "Did I name the body part and tell what it does?",
    "Did I use because to give the reason?",
    "Did I tell what good thing happens to the animal?",
    "Did I start every sentence with a capital letter?",
  ],
};
