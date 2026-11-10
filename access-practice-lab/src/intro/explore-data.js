// Sample responses for the planning card, so a teacher can begin without writing from scratch. They are written for the
// four curated activities in data.js and never claim more than those activities do.
export const PLAN_SAMPLES = {
  hallway: {
    practice: "explaining a change and giving a reason, aloud.",
    produce: "one change the school could make, one reason, and one example.",
    support: "the sentence frame and a partner to rehearse with.",
    look: "the word “because” and whether the reason fits the change.",
    retry: "adding one example that starts with “For example.”",
  },
  board: {
    practice: "taking a position and backing it with evidence from a table.",
    produce: "a two-minute speech with two numbers from the table.",
    support: "the word bank, and a rehearsal before speaking.",
    look: "two numbers from the table and one answer to a concern.",
    retry: "saying it again with a stronger first sentence.",
  },
  upgrade: {
    practice: "making a plain sentence clearer with an exact word and a connector.",
    produce: "one improved sentence.",
    support: "the frame and word bank (“Start with this help”).",
    look: "an exact word instead of “bad,” and a connector such as “because.”",
    retry: "pressing “Check my work” and fixing the one thing it names.",
  },
  paragraph: {
    practice: "writing a paragraph that takes a position and uses evidence.",
    produce: "one paragraph with two reasons and an answer to the other side.",
    support: "sentence frames and the model response.",
    look: "a clear position and a number from the survey table.",
    retry: "revising one sentence after “Get feedback.”",
  },
};

export const REHEARSE_MODES = [
  {
    id: "partner",
    label: "Explain the activity to a partner",
    steps: [
      "Partner A explains the activity in your own words: what students do, and the one support you will offer.",
      "Partner B says back what they heard and asks one question.",
      "Switch roles.",
    ],
  },
  {
    id: "alone",
    label: "Rehearse the directions independently",
    steps: [
      "Say your directions aloud once, as if students were in front of you.",
      "Write the first sentence you will say to the class.",
      "Say the directions again, shorter.",
    ],
  },
];
