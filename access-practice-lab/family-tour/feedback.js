// Practice tips for a typed answer. This is a plain check of the words the child typed: it looks for words from the
// activity's own word list, a sentence starter, a joining word and the length of the answer. It is not a score, it
// does not judge grammar, and the tour labels it that way. Spoken answers are never analysed: the family listens back.
const JOIN = /\b(and|because|but|so|then|first|next|last|also|while|when|after|before|since|however)\b/i;

const words = (text) => (text.toLowerCase().match(/[a-záéíóúüñ']+/g) || []);
const stem = (w) => w.replace(/(ing|ed|es|s)$/, "");

export function analyze(text, pick, previous = null) {
  const clean = String(text || "").trim();
  const ws = words(clean);
  const sentences = clean.split(/[.!?]+/).filter((s) => s.trim()).length;
  const wordList = [...new Set([...(pick.words || []), ...(pick.vocab || []).map((v) => v.word)].map((w) => w.toLowerCase()))];
  const used = wordList.filter((w) => {
    const parts = w.split(/\s+/).filter(Boolean);
    return parts.length > 1 ? clean.toLowerCase().includes(w) : ws.some((x) => stem(x) === stem(w));
  });
  const starters = (pick.frames || []).map((f) => f.split("___")[0].trim().toLowerCase()).filter((s) => s.length > 2);
  const starter = starters.find((s) => clean.toLowerCase().startsWith(s) || clean.toLowerCase().includes(s)) || "";
  return {
    empty: ws.length === 0,
    wordCount: ws.length,
    sentences,
    used: used.slice(0, 3),
    starter,
    joined: JOIN.test(clean),
    grewFrom: previous && previous.wordCount ? previous.wordCount : 0,
  };
}

/** Which message keys (and their values) to show: what went well, then one thing to try. */
export function tips(result, pick) {
  const good = [];
  if (result.used.length) good.push({ key: "practice.fb.used", vars: { words: result.used.map((w) => `“${w}”`).join(", ") } });
  if (result.starter) good.push({ key: "practice.fb.starter", vars: { starter: `“${result.starter.replace(/^\w/, (c) => c.toUpperCase())}…”` } });
  if (result.sentences >= 2) good.push({ key: "practice.fb.sentences", vars: { n: result.sentences } });
  if (result.grewFrom && result.wordCount > result.grewFrom) good.push({ key: "practice.fb.grew", vars: { from: result.grewFrom, to: result.wordCount } });
  if (result.empty) return { good: [], next: { key: "practice.fb.empty" } };
  if (!good.length) good.push({ key: "practice.fb.tried" });
  let next;
  if (result.wordCount < 6) next = { key: "practice.fb.addDetail" };
  else if (!result.joined) next = { key: "practice.fb.join" };
  else if (pick.extension) next = { key: "practice.fb.stretch", vars: { idea: pick.extension } };
  else next = { key: "practice.fb.again" };
  return { good, next };
}
