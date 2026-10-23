// Language Intelligence Engine — explainable analysis of a learner's own words.
//
// Contract:
//  * Every observation carries the span(s) of the learner's text that produced it.
//  * No composite score, no proficiency label. The output is "what is on the page" plus the next
//    teachable moves, chosen by stated rules (see nextMoves). Meaning and truth are NOT judged here.
//  * Scaffold exposure is a function of the stage: independent attempts get questions only —
//    no frames, no word suggestions — so feedback can never leak help into an independent result.
import { DETECTOR_IDS, detect } from "./errors.js";

const DETECTOR_COUNT = DETECTOR_IDS.length;
import { ACADEMIC, COMMON_VERBS, CONNECTORS, CONNECTOR_JOBS, DOMAIN_HINTS, FRAMES, MORPHEMES, SUBORDINATORS, VAGUE } from "./lexicon.js";
import { purposeMoves } from "./purpose.js";
import { findPhrase, isStop, numbersIn, sentences, stem, tokenize } from "./text.js";

const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const sd = (a) => {
  const m = mean(a);
  return a.length ? Math.sqrt(mean(a.map((x) => (x - m) ** 2))) : 0;
};
const ACADEMIC_STEMS = new Set([...ACADEMIC].map(stem));
const DOMAIN_STEMS = new Set(DOMAIN_HINTS.map(stem));
const SUFFIXES = ["tion", "sion", "ment", "ity", "ive", "able", "ible", "ness", "ous", "ful", "ally", "ly"];
const WEIGHT = { "sv-agree-3sg": 5, "be-agree": 5, "past-marker": 5, "irregular-ed": 4, "question-order": 4, "double-negative": 4, "modal-form": 4, "do-support": 4, "missing-be": 4, "missing-expletive": 4, "plural-after-number": 3, "article-a-an": 2, "capital-punct": 2, "common-misspelling": 2 };

function sentenceShape(sText) {
  const toks = tokenize(sText);
  const lower = ` ${toks.map((t) => t.lower).join(" ")} `;
  const sub = SUBORDINATORS.filter((w) => !["that", "which", "who", "whom", "whose"].includes(w)).filter((w) => lower.includes(` ${w} `));
  const rel = /\b(?:which|who|whom|whose)\b/i.test(sText) || /\b\w+ that (?:is|are|was|were|has|have|can|will|\w+s)\b/i.test(sText);
  const compound = /,\s*(?:and|but|or|so|yet)\s/i.test(sText) || /;/.test(sText);
  const complex = sub.length > 0 || rel;
  return { complex, compound, subordinators: sub, type: complex && compound ? "compound-complex" : complex ? "complex" : compound ? "compound" : "simple", words: toks.length };
}

const NOT_NP = new Set([...COMMON_VERBS, "is", "are", "was", "were", "am", "be", "been", "has", "have", "had", "do", "does", "did", "can", "could", "will", "would", "should", "must", "and", "or", "but", "because", "so", "if", "that", "which"]);
function nounPhrases(text) {
  const re = /\b(?:the|a|an|this|these|those|their|its|our)\s+(?:[a-z-]+\s+){0,3}[a-z-]+\s+(?:of|in|with|from|for|near|between)\s+(?:the\s+|a\s+)?[a-z-]+/gi;
  return [...text.matchAll(re)]
    .filter((m) => m[0].split(/\s+/).every((w, i) => i === 0 || !NOT_NP.has(w.toLowerCase()) || ["in", "of", "with", "from", "for"].includes(w.toLowerCase())))
    .map((m) => ({ start: m.index, end: m.index + m[0].length, text: m[0] }));
}
const KLU_VERB = { Narrate: "tell a story", Inform: "inform", Explain: "explain", Argue: "argue a position" };

function cohesion(text, sents) {
  const devices = [];
  for (const job of CONNECTOR_JOBS)
    for (const p of CONNECTORS[job]) for (const h of findPhrase(text, p)) devices.push({ job, ...h });
  const dedup = devices.sort((a, b) => a.start - b.start || b.end - a.end).filter((d, i, a) => i === 0 || d.start >= a[i - 1].end);
  const jobs = [...new Set(dedup.map((d) => d.job))];
  const openers = sents.map((s) => tokenize(s.text)[0]?.lower).filter(Boolean);
  const counts = openers.reduce((m, w) => ((m[w] = (m[w] || 0) + 1), m), {});
  const repeated = Object.entries(counts).filter(([w, n]) => n >= 3 && sents.length >= 4).map(([w, n]) => ({ word: w, count: n }));
  // sentences that follow another without any link word or shared content word → "side by side"
  const unlinked = [];
  for (let i = 1; i < sents.length; i++) {
    const here = new Set(tokenize(sents[i].text).filter((t) => !isStop(t.lower)).map((t) => stem(t.lower)));
    const prev = tokenize(sents[i - 1].text).filter((t) => !isStop(t.lower)).map((t) => stem(t.lower));
    const shared = prev.some((w) => here.has(w));
    const linked = dedup.some((d) => d.start >= sents[i].start && d.start < sents[i].start + 40);
    if (!shared && !linked) unlinked.push(i);
  }
  return { devices: dedup, jobs, variety: jobs.length, repeatedOpeners: repeated, unlinked };
}

function countDistinctSpans(spans) {
  const sorted = spans.map((x) => ({ start: x.start, end: x.end })).sort((a, b) => a.start - b.start || b.end - a.end);
  let n = 0;
  let end = -1;
  for (const sp of sorted) {
    if (sp.start >= end) n++;
    end = Math.max(end, sp.end);
  }
  return n;
}

function evidence(text, { sourceText = "", sourceTerms = [] }) {
  const src = Array.isArray(sourceText) ? sourceText.join(" ") : String(sourceText || "");
  const termHits = sourceTerms.map((t) => ({ term: t, hits: findPhrase(text, t) })).filter((x) => x.hits.length);
  const srcNums = new Set(numbersIn(src).map((n) => n.value));
  const nums = numbersIn(text);
  const fromSource = nums.filter((n) => srcNums.has(n.value));
  const outside = nums.filter((n) => !srcNums.has(n.value) && src);
  const attributions = CONNECTORS.evidence.flatMap((p) => findPhrase(text, p));
  return {
    termsUsed: termHits.map((x) => x.term),
    termHits: termHits.flatMap((x) => x.hits),
    sourceCoverage: sourceTerms.length ? termHits.length / sourceTerms.length : null,
    numbersFromSource: fromSource,
    numbersOutsideSource: outside,
    attributions,
    // each place in the text counts once: a number that sits inside a source term is one citation, not two
    cites: countDistinctSpans([...fromSource, ...termHits.flatMap((x) => x.hits), ...attributions]),
    hasSource: Boolean(src),
  };
}

function wordLevel(text, toks, { wordBank = [] }) {
  const academic = toks.filter((t) => t.lower.length > 4 && (ACADEMIC_STEMS.has(stem(t.lower)) || ACADEMIC.has(t.lower)));
  const domain = toks.filter((t) => DOMAIN_STEMS.has(stem(t.lower)));
  const bank = wordBank.map(String).filter(Boolean);
  const used = bank.filter((w) => findPhrase(text, w.split("/")[0].trim()).length);
  const vague = [];
  for (const w of Object.keys(VAGUE)) for (const h of findPhrase(text, w)) if (!(w === "very" && /^\s+much\b/i.test(text.slice(h.end)))) vague.push({ ...h, word: w });
  const content = toks.filter((t) => !isStop(t.lower));
  const counts = content.reduce((m, t) => ((m[stem(t.lower)] = (m[stem(t.lower)] || 0) + 1), m), {});
  const repeated = Object.entries(counts).filter(([, n]) => n >= 4).map(([w, n]) => ({ word: w, count: n }));
  const derived = toks.filter((t) => t.lower.length >= 8 && SUFFIXES.some((s) => t.lower.endsWith(s)));
  const morph = MORPHEMES.filter((m) => m.kind !== "suffix" && toks.some((t) => t.lower.startsWith(m.m) || (m.kind === "root" && t.lower.includes(m.m)))).slice(0, 4);
  return {
    academic: academic.map((t) => ({ start: t.start, end: t.end, text: t.text })),
    domain: domain.map((t) => ({ start: t.start, end: t.end, text: t.text })),
    bankUsed: used,
    bankUnused: bank.filter((w) => !used.includes(w)),
    vague: vague.slice(0, 6),
    repeated,
    derived: derived.map((t) => t.text),
    morphemesAvailable: morph,
    lexicalDensity: toks.length ? content.length / toks.length : 0,
  };
}

/** Rank the few things most worth doing next. Each carries the evidence that produced it. */
function nextMoves(a, { stage = "supported", keyUse = "Explain", expected }) {
  const moves = [];
  const showHelp = stage !== "independent";
  const frames = FRAMES[keyUse]?.guided || [];
  const high = a.errors.filter((e) => e.confidence === "high");
  const byId = high.reduce((m, e) => ((m[e.id] = (m[e.id] || [])).push(e), m), {});
  const top = Object.entries(byId).sort((x, y) => (WEIGHT[y[0]] || 1) * y[1].length - (WEIGHT[x[0]] || 1) * x[1].length)[0];
  const missing = a.purpose.moves.filter((m) => m.required && !m.present);

  if (a.words === 0) return [];
  if (expected?.minWords && a.words < expected.minWords * 0.6)
    moves.push({ id: "develop", dimension: "Discourse", priority: 90, title: "Develop one idea further", why: `Your response is ${a.words} words; this task usually needs about ${expected.minWords}–${expected.maxWords}.`, ask: "Pick your best idea. What detail, example, or reason would make a reader understand it fully?", frame: showHelp ? frames[0] : null, spans: [] });
  if (missing.length) {
    const m = missing[0];
    moves.push({ id: `move-${m.id}`, dimension: "Discourse", priority: 80, title: m.act.charAt(0).toUpperCase() + m.act.slice(1), why: `Responses that ${KLU_VERB[keyUse] || "explain"} usually ${m.act}. We could not find that in your response.`, ask: m.ask, frame: showHelp ? frames[0] || null : null, spans: [] });
  }
  if (a.evidence.hasSource && a.evidence.sourceCoverage !== null && a.evidence.sourceCoverage < 0.34 && a.words >= 20)
    moves.push({ id: "use-source", dimension: "Discourse", priority: 85, title: "Use the source as evidence", why: `You used ${a.evidence.termsUsed.length} key idea${a.evidence.termsUsed.length === 1 ? "" : "s"} from the source. A stronger response points to exact facts from it.`, ask: "Which exact fact, number, or phrase from the source proves your point? Quote or paraphrase it.", frame: showHelp ? "According to ___, ___. This shows that ___." : null, spans: a.evidence.termHits });
  if (a.evidence.numbersOutsideSource.length)
    moves.push({ id: "check-number", dimension: "Discourse", priority: 70, title: "Check a number against the source", why: `The number ${a.evidence.numbersOutsideSource[0].text} is not in the source.`, ask: "Where does this number come from? Did you calculate it, or should it match the source?", frame: null, spans: a.evidence.numbersOutsideSource });
  if (top)
    moves.push({ id: `fix-${top[0]}`, dimension: "Sentence", priority: 75 + Math.min(10, top[1].length), title: top[1][0].name, why: `This pattern appears ${top[1].length} time${top[1].length === 1 ? "" : "s"} in your writing: “${top[1][0].text}”.`, ask: "Read that part aloud. Which word needs to change so the sentence matches English patterns?", frame: null, patternId: top[0], spans: top[1] });
  if (a.sentenceStats.n >= 4 && a.cohesion.variety <= 1)
    moves.push({ id: "link-ideas", dimension: "Discourse", priority: 60, title: "Link your ideas", why: `Your ${a.sentenceStats.n} sentences use ${a.cohesion.variety === 0 ? "no linking words" : "one kind of linking word"}.`, ask: "Choose two neighboring sentences. How are they related: cause, contrast, addition, or example?", frame: showHelp ? "Sentence 2 happened because ___. / However, ___." : null, spans: a.cohesion.unlinked.map((i) => a.sentenceList[i]).filter(Boolean) });
  if (a.sentenceStats.n >= 4 && a.sentenceStats.complex + a.sentenceStats.compound === 0)
    moves.push({ id: "combine", dimension: "Sentence", priority: 55, title: "Combine two ideas in one sentence", why: "All of your sentences are short and simple.", ask: "Which two sentences share a reason or a contrast? Join them with a word like because, although, or but.", frame: showHelp ? "Although ___, ___. / ___ because ___." : null, spans: [] });
  if (a.cohesion.repeatedOpeners.length)
    moves.push({ id: "vary-openers", dimension: "Sentence", priority: 40, title: "Vary how sentences begin", why: `${a.cohesion.repeatedOpeners[0].count} sentences begin with “${a.cohesion.repeatedOpeners[0].word}”.`, ask: "Rewrite one of them so it starts with a time, place, or reason instead.", frame: null, spans: [] });
  if (a.word.vague.length >= 2)
    moves.push({ id: "precise-words", dimension: "Word/Phrase", priority: 45, title: "Choose a more exact word", why: `Words like “${a.word.vague[0].text}” are broad.`, ask: `In this context, what is a more exact word than “${a.word.vague[0].text}”?`, frame: null, suggestions: showHelp ? VAGUE[a.word.vague[0].word] || [] : [], spans: a.word.vague });
  if (a.word.bankUnused.length && a.word.bankUsed.length === 0 && showHelp && a.words >= 20)
    moves.push({ id: "try-bank", dimension: "Word/Phrase", priority: 30, title: "Try a word from the bank", why: "None of the bank words appear in your response.", ask: "Is there one bank word that says your idea more exactly?", frame: null, spans: [] });
  return moves.sort((x, y) => y.priority - x.priority).slice(0, 3);
}

/**
 * Analyse one response.
 * @param {string} text the learner's writing or their own transcript of what they said
 * @param {{keyUse?:string, modality?:"writing"|"speaking", sourceText?:string|string[], sourceTerms?:string[], wordBank?:string[], expected?:{minWords:number,maxWords:number}, stage?:"guided"|"supported"|"independent"}} opts
 */
export function analyzeResponse(text, opts = {}) {
  const { keyUse = "Explain", modality = "writing", stage = "supported", wordBank = [], expected } = opts;
  const src = String(text || "");
  const toks = tokenize(src);
  const sents = sentences(src);
  const shapes = sents.map((s) => ({ ...sentenceShape(s.text), start: s.start, end: s.end, text: s.text }));
  const lengths = shapes.map((s) => s.words);
  const errors = detect(src).filter((e) => !(modality === "speaking" && ["capital-punct", "common-misspelling", "comma-splice", "fragment-subordinate"].includes(e.id)));
  const ev = evidence(src, opts);
  const coh = cohesion(src, sents);
  const wl = wordLevel(src, toks, { wordBank });
  const purpose = purposeMoves(src, keyUse, { words: toks.length, expectCounter: keyUse === "Argue" && (expected?.minWords || 0) >= 100, topicTerms: [...(opts.sourceTerms || []), ...wordBank] });
  const base = {
    words: toks.length,
    sentenceCount: sents.length,
    sentenceList: sents,
    sentenceStats: {
      n: sents.length,
      meanLength: mean(lengths),
      lengthSpread: sd(lengths),
      simple: shapes.filter((s) => s.type === "simple").length,
      compound: shapes.filter((s) => s.type === "compound" || s.type === "compound-complex").length,
      complex: shapes.filter((s) => s.type === "complex" || s.type === "compound-complex").length,
      subordinators: [...new Set(shapes.flatMap((s) => s.subordinators))],
      shapes,
    },
    nounPhrases: nounPhrases(src),
    cohesion: coh,
    evidence: ev,
    word: wl,
    errors,
    purpose,
  };
  base.nextMoves = nextMoves(base, { stage, keyUse, expected });
  base.strengths = strengths(base);
  base.dimensions = describeDimensions(base);
  base.ledger = ledgerFeatures(base);
  base.stage = stage;
  return base;
}

function strengths(a) {
  const out = [];
  const made = a.purpose.moves.filter((m) => m.present && m.required);
  if (made.length) out.push({ dimension: "Discourse", text: `Does ${made.length} of ${a.purpose.moves.filter((m) => m.required).length} moves of a ${a.purpose.keyUse.toLowerCase()} response: ${made.map((m) => m.label.toLowerCase()).slice(0, 2).join("; ")}.`, spans: made.flatMap((m) => m.evidence).slice(0, 3) });
  if (a.cohesion.variety >= 2) out.push({ dimension: "Discourse", text: `Links ideas in ${a.cohesion.variety} different ways (${a.cohesion.jobs.join(", ")}).`, spans: a.cohesion.devices.slice(0, 3) });
  if (a.evidence.cites >= 2) out.push({ dimension: "Discourse", text: `Points to the source ${a.evidence.cites} time${a.evidence.cites === 1 ? "" : "s"}.`, spans: [...a.evidence.termHits, ...a.evidence.numbersFromSource].slice(0, 3) });
  if (a.sentenceStats.complex >= 1) out.push({ dimension: "Sentence", text: `Builds ${a.sentenceStats.complex} sentence${a.sentenceStats.complex === 1 ? "" : "s"} with more than one idea (${a.sentenceStats.subordinators.slice(0, 3).join(", ") || "relative clause"}).`, spans: a.sentenceStats.shapes.filter((s) => s.complex).slice(0, 2).map((s) => ({ start: s.start, end: s.end, text: s.text })) });
  if (a.nounPhrases.length) out.push({ dimension: "Sentence", text: "Packs detail into noun phrases.", spans: a.nounPhrases.slice(0, 2) });
  if (a.word.academic.length + a.word.domain.length >= 2) out.push({ dimension: "Word/Phrase", text: `Uses precise subject words (${[...new Set([...a.word.academic, ...a.word.domain].map((w) => w.text.toLowerCase()))].slice(0, 4).join(", ")}).`, spans: [...a.word.academic, ...a.word.domain].slice(0, 4) });
  if (a.word.bankUsed.length) out.push({ dimension: "Word/Phrase", text: `Uses bank words: ${a.word.bankUsed.slice(0, 4).join(", ")}.`, spans: [] });
  if (a.words >= 20 && a.errors.filter((e) => e.confidence === "high").length === 0) out.push({ dimension: "Sentence", text: `None of the ${DETECTOR_COUNT} patterns this checker looks for showed up. It does not catch every kind of error, so reread aloud too.`, spans: [] });
  return out;
}

/** Plain-language read-out by WIDA dimension (Discourse / Sentence / Word-Phrase). Counts and examples only. */
function describeDimensions(a) {
  return {
    Discourse: { moves: a.purpose.moves.map((m) => ({ id: m.id, label: m.label, present: m.present, required: m.required })), linkJobs: a.cohesion.jobs, cites: a.evidence.cites, sourceCoverage: a.evidence.sourceCoverage },
    Sentence: { simple: a.sentenceStats.simple, compound: a.sentenceStats.compound, complex: a.sentenceStats.complex, meanLength: Math.round(a.sentenceStats.meanLength * 10) / 10, nounPhrases: a.nounPhrases.length },
    "Word/Phrase": { academic: a.word.academic.length, domain: a.word.domain.length, bankUsed: a.word.bankUsed.length, vague: a.word.vague.length, derived: a.word.derived.length },
  };
}

/** The compact numbers the learner profile keeps (no text). */
function ledgerFeatures(a) {
  const errs = {};
  for (const e of a.errors) if (e.confidence === "high") errs[e.id] = (errs[e.id] || 0) + 1;
  const moves = {};
  for (const m of a.purpose.moves) if (m.required) moves[m.id] = m.present ? 1 : 0;
  return {
    words: a.words,
    sents: a.sentenceCount,
    link: a.cohesion.variety,
    cites: a.evidence.cites,
    cover: a.evidence.sourceCoverage === null ? null : Math.round(a.evidence.sourceCoverage * 100) / 100,
    academic: a.word.academic.length + a.word.domain.length,
    bank: a.word.bankUsed.length,
    complex: a.sentenceStats.complex,
    compound: a.sentenceStats.compound,
    np: a.nounPhrases.length,
    errs,
    moves,
  };
}

/** What changed between two drafts, as evidence the learner can see (not a grade). */
export function compareDrafts(before, after, opts = {}) {
  const x = analyzeResponse(before, opts);
  const y = analyzeResponse(after, opts);
  const delta = (k, label, unit) => (y.ledger[k] !== x.ledger[k] ? { key: k, label, from: x.ledger[k], to: y.ledger[k], unit, better: y.ledger[k] > x.ledger[k] } : null);
  const gainedMoves = y.purpose.moves.filter((m) => m.present && x.purpose.moves.find((n) => n.id === m.id && !n.present)).map((m) => m.label);
  const lostMoves = y.purpose.moves.filter((m) => !m.present && x.purpose.moves.find((n) => n.id === m.id && n.present)).map((m) => m.label);
  const errsBefore = Object.keys(x.ledger.errs);
  const errsAfter = Object.keys(y.ledger.errs);
  return {
    changes: [delta("words", "Words", "words"), delta("link", "Ways of linking ideas", "kinds"), delta("cites", "Points to the source", "times"), delta("complex", "Sentences with more than one idea", "sentences"), delta("academic", "Precise subject words", "words")].filter(Boolean),
    gainedMoves,
    lostMoves,
    errorsFixed: errsBefore.filter((e) => !errsAfter.includes(e)),
    errorsNew: errsAfter.filter((e) => !errsBefore.includes(e)),
    before: x,
    after: y,
  };
}
