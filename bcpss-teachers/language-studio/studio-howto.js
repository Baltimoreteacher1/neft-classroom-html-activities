// "How to play": three plain steps for each activity kind, the same wording at every level so a student who has
// played one activity of a kind knows them all. Authored here once; nothing is generated per unit.
export const HOWTO = {
  dictogloss: ["Press Listen. Hear the story twice.", "Tap the key words you hear.", "Write the story again in your own words."],
  match: ["Tap a word.", "Tap the meaning that fits it.", "A wrong pair bounces back. Keep going until every pair matches."],
  word_sort: ["Tap a word, or drag it.", "Tap the group where it belongs.", "Finish when every word has a home."],
  clue_game: ["Read the first clue.", "Tap your guess in the word bank.", "Stuck? Open another clue. More clues means fewer points."],
  talk_cards: ["Draw a card and read it together.", "Partner 1 finishes the sentence starter.", "Partner 2 asks the follow-up. Then swap."],
  info_gap: ["Open only your own card.", "Ask your partner for each fact you need.", "Type what you hear, then check together."],
  read_annotate: ["Pick a mark color.", "Tap the words that match it.", "Check your marks, then answer the questions."],
  unscramble: ["Read all the chunks.", "Tap them in order to build the sentence.", "Check it, then read it aloud."],
  cloze: ["Read the passage.", "Tap a word, then tap its blank.", "Check when every blank is full."],
  sequence: ["Read all the steps.", "Move each step to where it belongs.", "Check the order, then say it aloud."],
  quiz: ["Read the question.", "Tap the best answer.", "Read why it is right, then go on."],
  sentence_combine: ["Read the short sentences.", "Join them with the connector.", "Check your sentence, then compare."],
  error_analysis: ["Read the sentence with the mistake.", "Pick the best fix.", "Read why it works."],
  write_scaffold: ["Read the task.", "Fill each box with the frames and word bank.", "Use the checklist, then press I'm done."],
};

export const howToFor = (kind) => HOWTO[kind] || null;
