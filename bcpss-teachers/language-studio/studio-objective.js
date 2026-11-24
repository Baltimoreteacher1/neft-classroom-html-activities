// Language Studio Player — the language goal for each activity kind.
// One authored goal per kind, written once so no unit repeats another unit's sentence. The "I can"
// line hardens with the WIDA band: Starter names the move, Core adds the reason, Stretch adds a
// second step (explain, compare or make it their own). Plain student language, no jargon.

export const KIND_GOALS = {
  match: {
    fn: "Match words and meanings",
    l1_2: "I can match each word to a picture or a short meaning.",
    l3_4: "I can match each word to its meaning and say why the two go together.",
    l5_6: "I can match every word to its meaning, then use two of them in one sentence.",
  },
  word_sort: {
    fn: "Sort words into groups",
    l1_2: "I can put each word in the group where it belongs.",
    l3_4: "I can sort the words and tell a partner why I put each one there.",
    l5_6: "I can sort every word, explain my reasons, and add a group of my own.",
  },
  cloze: {
    fn: "Use words in a text",
    l1_2: "I can choose the word that fits each gap.",
    l3_4: "I can choose the word that fits each gap and check that the sentence still makes sense.",
    l5_6: "I can fill every gap and explain why each word fits the meaning of the story.",
  },
  unscramble: {
    fn: "Build clear sentences",
    l1_2: "I can put the chunks in order to build a sentence.",
    l3_4: "I can build a sentence and say what each part does.",
    l5_6: "I can build every sentence, then make one of them my own.",
  },
  sequence: {
    fn: "Order steps and ideas",
    l1_2: "I can put the steps in the right order.",
    l3_4: "I can order the steps and add signal words like first and next.",
    l5_6: "I can order the steps, add signal words, and explain why the order works.",
  },
  quiz: {
    fn: "Choose the best answer",
    l1_2: "I can pick the answer that fits and say why.",
    l3_4: "I can pick the best answer and explain it with because.",
    l5_6: "I can choose the strongest answer and compare it with one that is almost right.",
  },
  dictogloss: {
    fn: "Listen and rebuild a text",
    l1_2: "I can catch key words I hear and use them to rebuild the story.",
    l3_4: "I can listen for key words and rebuild the story in my own words.",
    l5_6: "I can rebuild the whole story and add a sentence that explains it.",
  },
  info_gap: {
    fn: "Ask and answer questions",
    l1_2: "I can ask a question and answer with the facts I have.",
    l3_4: "I can ask for facts, repeat them back, and check them.",
    l5_6: "I can ask, answer, and explain how the facts fit together.",
  },
  error_analysis: {
    fn: "Find and fix a mistake",
    l1_2: "I can find the mistake and pick the sentence that fixes it.",
    l3_4: "I can find the mistake, fix it, and name what went wrong.",
    l5_6: "I can fix the mistake and explain the rule behind the fix.",
  },
  talk_cards: {
    fn: "Talk with a partner",
    l1_2: "I can take a turn and answer with a sentence starter.",
    l3_4: "I can take turns, give a reason, and ask a follow-up question.",
    l5_6: "I can build on my partner's idea and challenge it politely.",
  },
  write_scaffold: {
    fn: "Write to explain",
    l1_2: "I can write one sentence for each part of the frame.",
    l3_4: "I can write a short paragraph with a claim, a reason, and evidence.",
    l5_6: "I can write a full explanation and check it against the checklist.",
  },
  read_annotate: {
    fn: "Read closely and mark the text",
    l1_2: "I can find and mark the words I need in the text.",
    l3_4: "I can mark the reasons and key words, then answer with evidence.",
    l5_6: "I can mark the text and answer with evidence from two places.",
  },
  sentence_combine: {
    fn: "Join ideas with linking words",
    l1_2: "I can join two short sentences with one linking word.",
    l3_4: "I can join the sentences and read the long sentence out loud.",
    l5_6: "I can join them, then start the sentence with the linking word.",
  },
  clue_game: {
    fn: "Use clues to name a word",
    l1_2: "I can use the clues and the word bank to name each word.",
    l3_4: "I can solve each card before the last clue.",
    l5_6: "I can solve each card and write a new clue of my own.",
  },
  flash_retrieval: {
    fn: "Recall words quickly",
    l1_2: "I can name the word that fits.",
    l3_4: "I can recall the word and use it in a sentence.",
    l5_6: "I can recall the word and connect it to another word I know.",
  },
  listen_and_show: {
    fn: "Listen and show meaning",
    l1_2: "I can listen and choose the picture that matches.",
    l3_4: "I can listen, choose, and say what the words mean.",
    l5_6: "I can listen and explain why the choice fits.",
  },
  sentence_xray: {
    fn: "Look inside a sentence",
    l1_2: "I can name the parts of the sentence.",
    l3_4: "I can name the parts and say what each one does.",
    l5_6: "I can name the parts and explain how they work together.",
  },
  speak_and_record: {
    fn: "Speak clearly about the unit",
    l1_2: "I can say a sentence about the topic.",
    l3_4: "I can say two sentences with a reason.",
    l5_6: "I can speak for a minute and use the words from the unit.",
  },
  exit_check: {
    fn: "Show what you can do",
    l1_2: "I can answer with the words I learned.",
    l3_4: "I can answer and give a reason.",
    l5_6: "I can answer, give a reason, and connect it to the unit.",
  },
  point_and_say: {
    fn: "Point and name",
    l1_2: "I can point to the picture and say the word.",
    l3_4: "I can say the word and a sentence about it.",
    l5_6: "I can say the word, a sentence, and one more detail.",
  },
  tpr_cards: {
    fn: "Move and say",
    l1_2: "I can do the action and say the word.",
    l3_4: "I can do the action and say a sentence.",
    l5_6: "I can do the action and explain when it happens.",
  },
  home_language_bridge: {
    fn: "Use both languages to think",
    l1_2: "I can say the idea in my home language, then in English.",
    l3_4: "I can compare a word in both languages and say what is the same.",
    l5_6: "I can explain an idea in both languages and note a cognate.",
  },
};

/** { fn, can } for an activity kind at a WIDA band. Unknown kinds fall back to a neutral goal. */
export function objectiveFor(kind, level) {
  const goal = KIND_GOALS[kind];
  const band = level === "l1_2" || level === "l5_6" ? level : "l3_4";
  if (!goal) return { fn: "Practice language", can: "I can use the words from this unit." };
  return { fn: goal.fn, can: goal[band] };
}

/** The same goal phrased as an end-of-activity recap: "You can …". */
export function recapFor(kind, level) {
  return objectiveFor(kind, level).can.replace(/^I can /, "You can ");
}
