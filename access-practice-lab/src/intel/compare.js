// Comparing two pieces of a learner's work (a response and its revision, or an earlier and a later piece in the
// Language Time Machine). Built on compareDrafts (src/lang/analyze.js): this module turns its facts into a few
// changes a learner can point at, each with a quote from the earlier or the later text.
//
// Rules: length is never a change ("longer" is not "better"); every quote is a verbatim substring of the text it
// names; patterns that belong to speech or dialect are not counted for a transcript; nothing is scored.
import { compareDrafts } from "../lang/analyze.js";
import { CONNECTORS } from "../lang/lexicon.js";
import { findPhrase, sentences } from "../lang/text.js";
import { DIALECT_PATTERNS, MAX_TEXT, WRITING_ONLY_PATTERNS, firstSpan, quoteOf } from "./engine.js";
import { CAUTION_TEXT, CHANGE_TEXT } from "./wording.js";

const KEY_USES = ["Narrate", "Inform", "Explain", "Argue"];
const pair = (p) => [String(p?.[0] ?? ""), String(p?.[1] ?? p?.[0] ?? "")];
function phraseSpans(text, list) {
  return list.flatMap((p) => findPhrase(text, p)).sort((a, b) => a.start - b.start);
}
const LINK_WORDS = [
  ...CONNECTORS.cause,
  ...CONNECTORS.contrast,
  ...CONNECTORS.sequence,
  ...CONNECTORS.addition,
  ...CONNECTORS.example,
];
const lowerSet = (spans) => new Set(spans.map((s) => s.text.toLowerCase()));

/**
 * Meaningful changes between an earlier and a later piece of work, each with quotes. Length is never a change.
 * @param {string} before
 * @param {string} after
 * @param {{keyUse?:string, source?:"typed"|"transcript", sameTask?:boolean, sourceText?:string, sourceTerms?:string[]}} [opts]
 * @returns {{changes:{id:string,kind:string,text:[string,string],beforeQuote:string,afterQuote:string}[],
 *            kept:{id:string,text:[string,string],quote:string}[], caution:[string,string]|null}}
 */
export function compareWork(before, after, opts = {}) {
  const x = String(before ?? "").slice(0, MAX_TEXT);
  const y = String(after ?? "").slice(0, MAX_TEXT);
  const keyUse = KEY_USES.includes(opts.keyUse) ? opts.keyUse : "Explain";
  const spoken = opts.source === "transcript";
  if (!x.trim() || !y.trim()) return { changes: [], kept: [], caution: pair(CAUTION_TEXT.empty) };
  if (x.trim() === y.trim()) return { changes: [], kept: [], caution: pair(CAUTION_TEXT.same) };
  const d = compareDrafts(x, y, {
    keyUse,
    modality: spoken ? "speaking" : "writing",
    sourceText: opts.sourceText,
    sourceTerms: opts.sourceTerms,
  });
  const qa = (span) => quoteOf(y, span);
  const qb = (span) => quoteOf(x, span);
  const changes = [];
  const push = (id, kind, beforeQuote, afterQuote) => {
    if (!beforeQuote && !afterQuote) return;
    if (changes.some((c) => c.afterQuote === afterQuote && c.beforeQuote === beforeQuote)) return;
    changes.push({ id, kind, text: pair(CHANGE_TEXT[id.split(":")[0]]), beforeQuote, afterQuote });
  };

  for (const m of d.after.purpose.moves) {
    const was = d.before.purpose.moves.find((n) => n.id === m.id);
    if (m.present && was && !was.present)
      push(`move:${m.id}`, "organization", "", qa(firstSpan(m.evidence)));
  }
  const oldLinks = lowerSet(phraseSpans(x, LINK_WORDS));
  const newLink = phraseSpans(y, LINK_WORDS).find((s) => !oldLinks.has(s.text.toLowerCase()));
  if (newLink) push("links", "clarity", "", qa(newLink));
  const vagueAfter = lowerSet(d.after.word.vague);
  const goneVague = d.before.word.vague.find((v) => !vagueAfter.has(v.text.toLowerCase()));
  const oldWords = lowerSet([...d.before.word.academic, ...d.before.word.domain]);
  const newWord = [...d.after.word.domain, ...d.after.word.academic].find(
    (w) => !oldWords.has(w.text.toLowerCase()),
  );
  if (goneVague && newWord) push("specific", "specificity", qb(goneVague), qa(newWord));
  else if (newWord) push("subject-words", "specificity", "", qa(newWord));
  if (d.after.evidence.hasSource && d.after.evidence.cites > d.before.evidence.cites)
    push(
      "source",
      "specificity",
      "",
      qa(
        firstSpan([
          ...d.after.evidence.attributions,
          ...d.after.evidence.termHits,
          ...d.after.evidence.numbersFromSource,
        ]),
      ),
    );
  if (d.after.sentenceStats.complex > d.before.sentenceStats.complex) {
    const oldSents = new Set(d.before.sentenceList.map((s) => s.text));
    push(
      "combined",
      "clarity",
      "",
      qa(d.after.sentenceStats.shapes.find((s) => s.complex && !oldSents.has(s.text))),
    );
  }
  const blocked = new Set(spoken ? [...WRITING_ONLY_PATTERNS, ...DIALECT_PATTERNS] : []);
  for (const id of d.errorsFixed.filter((e) => !blocked.has(e)).slice(0, 1))
    push(
      `control:${id}`,
      "control",
      qb(d.before.errors.find((e) => e.id === id && e.confidence === "high")),
      "",
    );

  const kept = [];
  for (const m of d.after.purpose.moves) {
    const was = d.before.purpose.moves.find((n) => n.id === m.id);
    if (m.present && was?.present && kept.length < 2)
      kept.push({
        id: `kept-move:${m.id}`,
        text: pair(CHANGE_TEXT["kept-move"]),
        quote: qa(firstSpan(m.evidence)),
      });
  }
  const afterSents = new Set(sentences(y).map((s) => s.text));
  const same = sentences(x).find((s) => afterSents.has(s.text));
  if (same)
    kept.push({
      id: "kept-sentence",
      text: pair(CHANGE_TEXT["kept-sentence"]),
      quote: quoteOf(y, {
        start: y.indexOf(same.text),
        end: y.indexOf(same.text) + same.text.length,
      }),
    });

  let caution = null;
  if (opts.sameTask === false) caution = CAUTION_TEXT.context;
  else if (d.lostMoves.length) caution = CAUTION_TEXT.lost;
  else if (d.errorsNew.some((e) => !blocked.has(e))) caution = CAUTION_TEXT["new-pattern"];
  else if (!changes.length && d.after.words !== d.before.words) caution = CAUTION_TEXT.length;
  return {
    changes: changes.slice(0, 5),
    kept: kept.filter((k) => k.quote),
    caution: caution ? pair(caution) : null,
  };
}
