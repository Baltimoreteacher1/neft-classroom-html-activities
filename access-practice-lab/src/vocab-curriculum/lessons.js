// Original vocabulary investigations. The same seven-part lesson engine serves each grade point.
// These are instructional grade examples, not a placement scale or proprietary assessment items.
export const LESSONS = Object.freeze([
  {
    id: "k-look-closely", grade: "K", title: "Look closely", domain: "Reading", use: "Inform",
    goal: "I can notice details and tell someone what I see.",
    question: "How can careful looking help us learn about a living thing?",
    words: [
      { id: "observe", term: "observe", meaning: "look closely to learn", example: "We observe the seed each day.", relation: "notice" },
      { id: "detail", term: "detail", meaning: "one small part you can notice", example: "A tiny root is one detail.", relation: "part" },
    ],
    relationship: { prompt: "A root grows from a seed. What is the root in your observation?", choices: ["A detail I noticed", "The whole garden", "A question I asked"], answer: 0, feedback: "A root is one small part you can notice." },
    context: { prompt: "We look at the seed every morning to learn what changes. We ____ it.", choices: ["observe", "forget", "hide"], answer: 0, clue: "look at the seed every morning" },
    passage: "On Monday, the seed was smooth and brown. On Friday, a small white root came out. Mira looked at the seed each day.",
    evidence: { prompt: "Which sentence shows a change Mira observed?", choices: ["On Friday, a small white root came out.", "Mira has a green backpack.", "Seeds can be found in stores."], answer: 0 },
    produce: "Tell or write two things Mira could say about the seed. Use the words observe and detail if they help.",
    frame: "I observed ___. One detail is ___.", revision: "Add one exact detail from the passage to make your description clearer.",
    transfer: "You see a butterfly on a flower. Describe two details you could observe to help someone picture it.",
  },
  {
    id: "g2-compare-habitats", grade: "2", title: "Compare two habitats", domain: "Reading", use: "Inform",
    goal: "I can compare places using a shared feature and a difference.",
    question: "How are a pond and a desert alike or different for animals?",
    words: [
      { id: "compare", term: "compare", meaning: "look for what is alike and different", example: "Compare the pond and the desert.", relation: "alike and different" },
      { id: "habitat", term: "habitat", meaning: "the place where a living thing gets what it needs", example: "A pond is a frog's habitat.", relation: "place" },
    ],
    relationship: { prompt: "How are pond and desert related to habitat?", choices: ["Both are places where living things may live", "Both are kinds of animals", "Both always have the same amount of water"], answer: 0, feedback: "A habitat is a place; different habitats provide different conditions." },
    context: { prompt: "The class looks for ways the two places are alike and different. They ____ them.", choices: ["compare", "plant", "erase"], answer: 0, clue: "alike and different" },
    passage: "A frog finds water in a pond and lays eggs there. A desert lizard lives where water is scarce. Both animals need shelter, but they find it in different places.",
    evidence: { prompt: "Which detail supports a difference between the habitats?", choices: ["A frog finds water in a pond; desert water is scarce.", "Both animals need shelter.", "Some animals move at night."], answer: 0 },
    produce: "Compare the frog's and lizard's habitats. Name one thing they share and one difference, using facts from the passage.",
    frame: "Both habitats ___. However, the pond ___ while the desert ___.", revision: "Add a fact from the passage after your comparison.",
    transfer: "Compare a shady park and a sunny field as habitats. What might be similar and different for a small bird? Explain.",
  },
  {
    id: "g4-use-evidence", grade: "4", title: "Use evidence", domain: "Reading", use: "Explain",
    goal: "I can distinguish an inference from the evidence that supports it.",
    question: "How can clues help us explain an event we did not see?",
    words: [
      { id: "evidence", term: "evidence", meaning: "a fact or observation that supports an idea", example: "Wet footprints are evidence that someone came inside.", relation: "supports a claim" },
      { id: "infer", term: "infer", meaning: "use clues and what you know to form a likely explanation", example: "I infer that it rained because the ground is wet.", relation: "reason from evidence" },
    ],
    relationship: { prompt: "The floor is wet. You think a window was left open during rain. Which part is evidence?", choices: ["The floor is wet", "A window was left open", "It will rain tomorrow"], answer: 0, feedback: "The wet floor is observed; the open window is an inference to investigate." },
    context: { prompt: "We did not see who moved the books, but the dusty handprint lets us ____ who may have touched them.", choices: ["infer", "measure", "forget"], answer: 0, clue: "did not see ... dusty handprint" },
    passage: "At noon, the classroom plant stood upright. After the windows were opened, its leaves leaned toward the light. The soil was still damp. No one had watered it again.",
    evidence: { prompt: "Which detail best supports the idea that light affected the plant?", choices: ["Its leaves leaned toward the light after the windows opened.", "The soil was still damp.", "No one watered it again."], answer: 0 },
    produce: "Explain what may have changed the plant's position. State an inference and cite one piece of evidence.",
    frame: "I infer ___ because the text says ___.", revision: "Name the exact observed detail and explain how it supports your inference.",
    transfer: "A hallway is quiet, but several wet umbrellas stand by the door. Infer what happened earlier and identify the evidence. What else could explain it?",
  },
  {
    id: "g6-evaluate-sources", grade: "6", title: "Evaluate a source", domain: "Reading", use: "Argue",
    goal: "I can evaluate whether a source gives relevant evidence for a claim.",
    question: "Which source would help a class decide whether to add shade near a playground?",
    words: [
      { id: "relevant", term: "relevant", meaning: "directly connected to the question being considered", example: "A temperature record is relevant to a question about playground heat.", relation: "fits the question" },
      { id: "source", term: "source", meaning: "where information comes from", example: "The school weather station is one source of temperature data.", relation: "origin of information" },
    ],
    relationship: { prompt: "A class asks whether the playground needs shade. Which source is most relevant?", choices: ["Temperature readings taken on the playground", "A lunch menu from last month", "A map of distant rivers"], answer: 0, feedback: "The readings directly address heat on the playground; a useful source must fit the question." },
    context: { prompt: "The article discusses playground heat, so a record of noon temperatures is ____ to the claim.", choices: ["relevant", "unrelated", "fictional"], answer: 0, clue: "playground heat ... noon temperatures" },
    passage: "A student group recorded playground temperatures at noon for five school days. The unshaded blacktop ranged from 31°C to 36°C; under a nearby tree, readings ranged from 26°C to 29°C. The group proposed a shaded seating area. Their notes did not measure how many students would use it.",
    evidence: { prompt: "Which evidence most directly supports the group's heat claim?", choices: ["The blacktop was 31–36°C while the tree area was 26–29°C.", "The group proposed seating.", "The notes did not count students."], answer: 0 },
    produce: "Evaluate the proposal. Use the temperature evidence and name one unanswered question before deciding.",
    frame: "The temperature source supports ___ because ___. Before deciding, I would ask ___.", revision: "Connect the numerical evidence to your claim, then identify a limit of the source.",
    transfer: "A school wants quieter hallways. One source counts hallway noise during lunch; another surveys students about favorite classes. Which is more relevant, and what further evidence would help?",
  },
  {
    id: "g8-synthesize-claims", grade: "8", title: "Synthesize two accounts", domain: "Reading", use: "Argue",
    goal: "I can combine evidence from sources while acknowledging a limitation.",
    question: "How should a council decide whether to extend library hours?",
    words: [
      { id: "synthesize", term: "synthesize", meaning: "combine ideas from more than one source into a new understanding", example: "Synthesize survey and attendance data before recommending hours.", relation: "combine and interpret" },
      { id: "limitation", term: "limitation", meaning: "a boundary on what evidence can show", example: "A survey of one class has a limitation: it may not represent the whole school.", relation: "boundary of evidence" },
    ],
    relationship: { prompt: "Why is a survey of one class a limitation for a school-wide decision?", choices: ["It may not represent students in other grades", "It contains more than one answer", "It was written on paper"], answer: 0, feedback: "A source's reach is limited when it samples only a small part of the group being considered." },
    context: { prompt: "The committee will ____ attendance records and survey comments to form one recommendation.", choices: ["synthesize", "discard", "repeat"], answer: 0, clue: "attendance records and survey comments ... one recommendation" },
    passage: "The library counted 92 visits during its usual final hour across four Tuesdays. A survey of 28 students found that 21 wanted a later closing time, mostly for homework help. The survey included only students already using the library. Staff schedules and transportation needs were not studied.",
    evidence: { prompt: "Which statement combines a finding and a limitation accurately?", choices: ["Many surveyed users wanted later hours, but nonusers and transportation needs were not studied.", "All students want later hours because 21 said so.", "The visit count proves a later closing time will work."], answer: 0 },
    produce: "Recommend a next step for the council. Synthesize the visit count and survey, and explain one limitation.",
    frame: "The records show ___, while the survey suggests ___. Because ___ remains unknown, I recommend ___.", revision: "Revise so that each source has a distinct role and the limitation changes your recommendation.",
    transfer: "A club polls its own members about opening a new after-school program and reports high interest. What can this evidence support, what can it not show, and what source would you add?",
  },
]);

export const lessonFor = (id) => LESSONS.find((lesson) => lesson.id === id) || null;
export const lessonForGrade = (grade) => LESSONS.find((lesson) => lesson.grade.toLowerCase() === String(grade).toLowerCase()) || null;
