// Rule-based writing observations. Counts features that are really in the learner's text (words, sentences, linking words,
// numbers taken from the task's own data, phrases copied from the source, claim signals) and ties each to the task's language
// function. It does NOT judge meaning, accuracy or quality, it assigns no score, and it never says it "analysed" anything
// it did not count. Teacher review is the only judgement of meaning.
export const FEEDBACK_KIND = "rule-based";
export const FEEDBACK_NOTICE = "Rule-based feedback: this counts features in your text. It does not judge meaning and it is not a score. Your teacher reviews your writing.";

const LISTS = {
  cause: ["because", "so", "since", "as a result", "therefore", "due to", "that is why"],
  contrast: ["however", "but", "although", "while", "whereas", "on the other hand", "both", "same", "different", "alike"],
  sequence: ["first", "second", "third", "next", "then", "after that", "finally", "last", "before", "after"],
  addition: ["also", "in addition", "another", "moreover", "as well"],
  example: ["for example", "for instance", "such as"],
  evidence: ["according to", "the table shows", "the passage says", "the text says", "the data show", "the data shows", "the graph shows", "the source says"],
  claim: ["i think", "i believe", "i agree", "i disagree", "in my opinion", "my claim", "should"],
};
const words = (t) => String(t || "").toLowerCase().match(/[\p{L}\p{N}'’-]+/gu) || [];
const found = (text, list) => list.filter((p) => new RegExp(`(^|[^\\p{L}])${p.replace(/ /g, "\\s+")}([^\\p{L}]|$)`, "iu").test(text));

const numbersIn = (t) => new Set(String(t || "").match(/\d+(?:[.,]\d+)?/g) || []);
const sixGrams = (t) => {
  const w = words(t);
  const out = new Set();
  for (let i = 0; i + 6 <= w.length; i++) out.add(w.slice(i, i + 6).join(" "));
  return out;
};

/** @returns {{ kind: "rule-based", notice: string, observations: string[], nextMoves: string[], counts: object }} */
export function observeWriting(text, item, stimulusText = "") {
  const t = String(text || "");
  const n = words(t).length;
  const sentences = t.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim()).length;
  const min = item.constructed?.minWords || 0;
  const has = Object.fromEntries(Object.entries(LISTS).map(([k, l]) => [k, found(t, l)]));
  const stimNums = numbersIn(stimulusText);
  const usedNums = [...numbersIn(t)].filter((x) => stimNums.has(x));
  const stimGrams = sixGrams(stimulusText);
  const copied = [...sixGrams(t)].filter((g) => stimGrams.has(g)).length;
  const observations = [`Your response has ${n} ${n === 1 ? "word" : "words"} in ${sentences} ${sentences === 1 ? "sentence" : "sentences"}${min ? `. The task asks for at least ${min} words` : ""}.`];
  const linkers = [...new Set([...has.cause, ...has.contrast, ...has.sequence, ...has.addition])];
  observations.push(linkers.length ? `Linking words you used: ${linkers.join(", ")}.` : "You did not use linking words such as because, then or however.");
  if (stimNums.size) observations.push(usedNums.length ? `You used ${usedNums.length} ${usedNums.length === 1 ? "number" : "numbers"} from the data: ${usedNums.join(", ")}.` : "You did not use a number from the data.");
  if (copied) observations.push(`${copied} ${copied === 1 ? "run" : "runs"} of six or more words match the source word for word. Put your ideas in your own words.`);
  const moves = [];
  const fns = item.meta?.functions || [];
  const need = (fn) => fns.includes(fn);
  if ((need("Explain cause and effect") || need("Justify a conclusion")) && !has.cause.length) moves.push("Add a word that links a cause to its effect or a reason to your conclusion (because, so, as a result).");
  if (need("Compare or contrast") && !has.contrast.length) moves.push("Say how the things are alike or different (both, but, however).");
  if (need("Make and support a claim")) {
    if (!has.claim.length) moves.push("State your claim clearly (for example, I think ... because ...).");
    if (!has.evidence.length && !usedNums.length && !has.example.length) moves.push("Add evidence from the text or the data, or an example.");
  }
  if ((need("Sequence events or retell") || need("Explain a process or relationship")) && !has.sequence.length) moves.push("Use words that show order (first, next, then, finally).");
  if (need("Interpret data") && stimNums.size && !usedNums.length) moves.push("Use at least one number from the data.");
  if (min && n < min) moves.push(`Add more detail. You have ${n} of at least ${min} words.`);
  return { kind: FEEDBACK_KIND, notice: FEEDBACK_NOTICE, observations, nextMoves: moves, counts: { words: n, sentences, linkers: linkers.length, numbersUsed: usedNums.length, copiedRuns: copied } };
}
