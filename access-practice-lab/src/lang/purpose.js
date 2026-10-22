// Key Language Use moves (WIDA ELD Standards Framework 2020: Narrate, Inform, Explain, Argue).
// A "move" is a job a strong response does for its reader. Each detector returns the spans that
// show the move — evidence the student can point at — or nothing. Moves are cue-based and honest
// about it: they notice what is on the page, never whether it is true or well reasoned.
import { CONNECTORS, IRREGULAR } from "./lexicon.js";
import { findPhrase, numbersIn, sentences, tokenize } from "./text.js";

const PAST_FORMS = new Set(Object.values(IRREGULAR).map(([p]) => p));
const phraseHits = (text, list) => list.flatMap((p) => findPhrase(text, p).map((h) => ({ ...h, cue: p })));

function pastVerbs(text) {
  return tokenize(text).filter((t) => (/ed$/.test(t.lower) && t.lower.length > 3 && !["need", "indeed", "speed", "feed", "seed"].includes(t.lower)) || PAST_FORMS.has(t.lower))
    .map((t) => ({ start: t.start, end: t.end, text: t.text }));
}

export const MOVES = {
  Narrate: [
    { id: "orient", label: "Sets the scene (when / where / who)", act: "set the scene (when, where, who)", ask: "Where and when does this happen, and who is there?",
      find: (t, s) => (s[0] ? phraseHits(s[0].text, ["one day", "once", "last", "yesterday", "in the morning", "at the", "when i was", "it was", "there was", "years ago", "that day", "on a"]).map((h) => ({ ...h, start: h.start + s[0].start, end: h.end + s[0].start })) : []) },
    { id: "sequence", label: "Orders events with time words", act: "order events with time words", ask: "Which time word shows what happened first, next, and last?",
      find: (t) => phraseHits(t, CONNECTORS.sequence).concat(phraseHits(t, ["when", "after", "while", "suddenly", "at first", "in the end"])).filter((h, i, a) => a.findIndex((x) => x.start === h.start) === i), min: 2 },
    { id: "events", label: "Tells what happened with past-tense action verbs", act: "tell what happened with past-tense action verbs", ask: "What did the characters actually do? Use action verbs in the past.",
      find: (t) => pastVerbs(t), min: 3 },
    { id: "response", label: "Shows how it ended or what it meant", act: "show how it ended or what it meant", ask: "How did it end, or what did the character learn or feel?",
      find: (t) => phraseHits(t, ["finally", "in the end", "at last", "learned", "realized", "felt", "decided", "from that day", "since then", "lesson"]) },
  ],
  Inform: [
    { id: "topic", label: "Names and defines the topic", act: "name and define the topic", ask: "In one sentence, what is your topic and what kind of thing is it?",
      find: (t, s) => (s[0] && /\b(?:is|are|means?|refers? to|is called|is known as|can be defined)\b/i.test(s[0].text) ? [{ start: s[0].start, end: s[0].end, text: s[0].text }] : phraseHits(t, ["is a", "are a", "is called", "means", "refers to", "is known as", "is the"]).slice(0, 1)) },
    { id: "details", label: "Gives specific details (facts, numbers, names)", act: "give specific details (facts, numbers, names)", ask: "Which exact fact, number, or example would help a reader picture this?",
      find: (t) => [...numbersIn(t), ...phraseHits(t, CONNECTORS.example)], min: 2 },
    { id: "organize", label: "Groups ideas with signal words", act: "group ideas with signal words", ask: "How are your details grouped? Add a word that tells the reader how they connect.",
      find: (t) => phraseHits(t, [...CONNECTORS.addition, ...CONNECTORS.sequence, "one", "another", "also", "both", "different", "similar", "while", "whereas"]), min: 2 },
    { id: "close", label: "Wraps up the main point", act: "wrap up the main point", ask: "What is the one thing you want the reader to remember?",
      find: (t, s) => phraseHits(s.at(-1)?.text || "", CONNECTORS.conclusion).map((h) => ({ ...h, start: h.start + s.at(-1).start, end: h.end + s.at(-1).start })) },
  ],
  Explain: [
    { id: "phenomenon", label: "Says what is being explained", act: "say what is being explained", ask: "What exactly are you explaining — what happened or how does it work?",
      find: (t, s) => (s[0] ? [{ start: s[0].start, end: s[0].end, text: s[0].text }] : []) },
    { id: "cause", label: "Links cause and effect", act: "link cause and effect", ask: "What caused it, and what happened because of that?",
      find: (t) => phraseHits(t, CONNECTORS.cause) },
    { id: "chain", label: "Connects more than one step in the process", act: "connect more than one step in the process", ask: "What happens next after that effect? Add the next link in the chain.",
      find: (t) => [...phraseHits(t, [...CONNECTORS.cause, ...CONNECTORS.sequence])], min: 2 },
    { id: "support", label: "Backs the explanation with data or a source", act: "back the explanation with data or a source", ask: "What fact, number, or source shows this is true?",
      find: (t) => [...numbersIn(t), ...phraseHits(t, CONNECTORS.evidence)] },
  ],
  Argue: [
    { id: "claim", label: "States a clear claim", act: "state a clear claim", ask: "What is your position, in one sentence a reader could agree or disagree with?",
      find: (t) => phraseHits(t, [...CONNECTORS.stance, "needs to", "need to", "ought to", "better", "best", "the main reason", "my claim"]) },
    { id: "reason", label: "Gives a reason", act: "give a reason", ask: "Why do you believe that? Finish: 'I think this because …'",
      find: (t) => phraseHits(t, ["because", "since", "the reason", "one reason", "this is why", "so that", "due to", "as a result"]) },
    { id: "evidence", label: "Uses evidence from the source", act: "use evidence from the source", ask: "Which exact fact, number, or sentence from the source supports your reason?",
      find: (t) => [...numbersIn(t), ...phraseHits(t, CONNECTORS.evidence)] },
    { id: "counter", label: "Considers another point of view", act: "consider another point of view", ask: "What would someone who disagrees say, and how would you answer them?",
      find: (t) => phraseHits(t, [...CONNECTORS.concession, "however", "on the other hand", "although", "even though", "some people", "others", "critics", "but"]), minTokens: 60 },
    { id: "restate", label: "Ends by returning to the claim", act: "end by returning to the claim", ask: "How can you end by reminding the reader of your position?",
      find: (t, s) => phraseHits(s.at(-1)?.text || "", [...CONNECTORS.conclusion, "should", "must", "need to", "i recommend", "i believe"]).map((h) => ({ ...h, start: h.start + s.at(-1).start, end: h.end + s.at(-1).start })), minSentences: 3 },
  ],
};

/** Which moves does this response make? `expectCounter` decides whether the counter-claim move is required. */
export function purposeMoves(text, keyUse, { words = 0, expectCounter = false } = {}) {
  const defs = MOVES[keyUse] || MOVES.Explain;
  const s = sentences(text);
  const out = defs.map((d) => {
    const hits = d.find(text, s) || [];
    const need = d.min || 1;
    const required = d.id === "counter" ? expectCounter || words >= (d.minTokens || 0) : d.id === "restate" ? s.length >= (d.minSentences || 3) : true;
    return { id: d.id, label: d.label, act: d.act, ask: d.ask, present: hits.length >= need, required, evidence: hits.slice(0, 4), count: hits.length };
  });
  return { keyUse: MOVES[keyUse] ? keyUse : "Explain", moves: out, missing: out.filter((m) => m.required && !m.present).map((m) => m.id) };
}
