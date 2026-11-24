// BCPSS Writing Lab (TWR) — g4-sci-u3 · Organism Structures & Senses. Contract: ../writing-schema.mjs

export default {
  title: "How a Heron Hunts",
  genre: "inform",
  tip: "Have students label the heron's eye, brain, and beak on a sketch first so each definition has a picture behind it.",
  lessons: [
    { id: "A", title: "External and internal structures" },
    { id: "B", title: "Senses, stimuli, and receptors" },
    { id: "C", title: "The brain processes signals" },
    { id: "D", title: "Responses that help animals survive" },
  ],
  source: {
    title: "A Heron in the Shallows",
    lesson: "A",
    text: "A great blue heron stands still in shallow water near Annapolis. Its long legs keep its body above the water, and its long neck can stretch out fast. Its eyes are external structures that detect light, so the heron can spot a small fish. A fish is a stimulus, which is something that makes a living thing react. Receptors in the eyes send a signal to the brain, an internal organ that processes the signal. Then the heron strikes with its sharp beak. This response helps the heron survive because it catches food.",
  },
  notes: [
    { sentence: "Its eyes are external structures that detect light, so the heron can spot a small fish.", note: "eyes = external, detect light" },
    { sentence: "A fish is a stimulus, which is something that makes a living thing react.", note: "stimulus = makes animal react" },
    { sentence: "Receptors in the eyes send a signal to the brain, an internal organ that processes the signal.", note: "receptors → signal → brain (internal)" },
    { sentence: "This response helps the heron survive because it catches food.", note: "strike → catch food → survive" },
  ],
  bbs: [
    {
      lesson: "A",
      kernel: "The heron's eyes are external structures",
      because: "they sit on the outside of its head.",
      but: "its brain is an internal organ inside its body.",
      so: "the heron can look for a fish without touching it.",
    },
    {
      lesson: "B",
      kernel: "A fish is a stimulus for the heron",
      because: "it makes the heron react.",
      but: "the heron cannot sense the fish without receptors.",
      so: "its receptors send a signal to the brain.",
    },
    {
      lesson: "D",
      kernel: "The heron's strike is a response that helps it survive",
      because: "it catches a fish to eat.",
      but: "the heron stays still until the fish swims close.",
      so: "the heron gets the energy it needs to keep hunting.",
    },
  ],
  expand: [
    {
      lesson: "A",
      kernel: "The heron stands still.",
      parts: { when: "every morning", where: "in shallow water near Annapolis", why: "to watch for fish" },
      model: "Every morning, the heron stands still in shallow water near Annapolis to watch for fish.",
    },
    {
      lesson: "C",
      kernel: "The brain processes signals.",
      parts: { where: "inside the heron's head", how: "very quickly", why: "to decide what to do" },
      model: "Inside the heron's head, the brain processes signals very quickly to decide what to do.",
    },
  ],
  fragments: [
    { text: "The heron's eyes detect light.", is_sentence: true },
    { text: "Sends a signal to the brain.", is_sentence: false, fix: "A receptor sends a signal to the brain." },
    { text: "Which processes the signal.", is_sentence: false, fix: "The brain is an organ which processes the signal." },
    { text: "The heron strikes with its sharp beak.", is_sentence: true },
    { text: "Because the beak catches food.", is_sentence: false, fix: "The beak helps the heron survive because it catches food." },
  ],
  appositives: [
    {
      lesson: "A",
      sentence: "An eye, ___, helps the heron find a fish.",
      noun: "eye",
      options: ["an external structure that detects light", "an internal organ that processes signals", "something that makes a living thing react"],
      answer: 0,
      model: "An eye, an external structure that detects light, helps the heron find a fish.",
    },
    {
      lesson: "B",
      sentence: "A receptor, ___, sends a signal to the brain.",
      noun: "receptor",
      options: ["something in the environment that makes a living thing react", "a special part of the body that detects a stimulus", "the job a part of the body does"],
      answer: 1,
      model: "A receptor, a special part of the body that detects a stimulus, sends a signal to the brain.",
    },
    {
      lesson: "C",
      sentence: "The brain, ___, tells the heron's body what to do.",
      noun: "brain",
      options: ["an external structure that detects light", "a special part of the body that detects a stimulus", "the organ inside the head that processes signals"],
      answer: 2,
      model: "The brain, the organ inside the head that processes signals, tells the heron's body what to do.",
    },
  ],
  subordinate: [
    { lesson: "B", conjunction: "when", stem: "the heron strikes with its sharp beak", model: "When the receptors detect a fish, the heron strikes with its sharp beak." },
    { lesson: "D", conjunction: "because", stem: "the heron can catch food", model: "Because the beak is sharp, the heron can catch food." },
    { lesson: "A", conjunction: "although", stem: "its eyes keep watching for fish", model: "Although the heron stands still, its eyes keep watching for fish." },
  ],
  spo: {
    topic: {
      l1_2: "The heron has [body parts] that help it [survive].",
      l3_4: "A heron's [eyes] are a type of [external structure] that [detect a fish], which helps the heron [survive].",
      l5_6: "Although [a heron stands still], its [external structures] and [internal organs] work together to [sense, process, and respond], which helps it survive.",
    },
    starters: [
      { type: "question", text: "How do a heron's body parts help it find food?" },
      { type: "appositive", text: "The great blue heron, a tall bird of the Chesapeake Bay, hunts in shallow water." },
      { type: "subordinate", text: "Although the heron stands still, its senses are always working." },
    ],
    details: [
      { note: "eyes = external; detect light", lesson: "A" },
      { note: "fish = stimulus", lesson: "B" },
      { note: "receptors in eyes → signal", lesson: "B" },
      { note: "brain = internal; processes signal", lesson: "C" },
      { note: "response: strike w/ sharp beak", lesson: "D" },
      { note: "catch food → survive", lesson: "D" },
    ],
    distractors: ["herons build nests in tall trees", "Annapolis is the capital of Maryland"],
    conclusion: {
      l1_2: "The heron [catches] a [fish].",
      l3_4: "Because its body parts work together, the heron can [catch food] and [survive].",
      l5_6: "In short, a heron's [eyes, brain, and beak] form a team that [turns a small splash into a meal].",
    },
  },
  prompt: {
    l1_2: "Draw a heron and its fish. Label the eye and the beak. Write 2-3 sentences about how the heron's body parts help it. Use the words eye and survive.",
    l3_4: "Write a paragraph that defines the heron's eyes, brain, and beak and tells how each one helps it survive. Use your outline, is a type of, and that.",
    l5_6: "Write a paragraph that classifies and describes the structures a heron uses to sense, process, and respond. Include an appositive and a sentence that starts with although or because.",
  },
  transitions: ["First,", "Next,", "For example,", "Unlike", "Such as", "In addition,", "Because", "In short,"],
  model: {
    l1_2: "The heron has eyes. The eyes see a fish. The beak catches the fish.",
    l3_4: "A heron's eyes are a type of external structure that detect a fish. A fish is a stimulus, which is something that makes the heron react. Receptors in the eyes send a signal to the brain, an internal organ that processes the signal. Then the heron strikes with its sharp beak. This response helps the heron survive because it catches food.",
    l5_6: "Although the great blue heron stands still, its senses are always working. The heron, a tall bird of the Chesapeake Bay, has eyes that are external structures. Receptors in the eyes detect a fish, which is a stimulus. A signal travels to the brain, an internal organ that processes it. Unlike the eyes, the brain cannot see anything, but it tells the body what to do. Then the heron strikes with its sharp beak. Because this response catches food, it helps the heron survive.",
  },
  revise: [
    "Did I define each body part with is a type of and that?",
    "Did I name which parts are external and which are internal?",
    "Did I use stimulus, receptor, and response correctly?",
    "Did I tell how each part helps the animal survive?",
  ],
};
