// Language Intelligence Engine: one grounded piece of feedback for one response. Pure; runs in Node with no DOM.
//
// It is built ON the lab's existing analysis (src/lang/analyze.js analyzeResponse, purpose.js moves, errors.js
// detectors). There is no second analyzer here: this module only chooses which facts to show and attaches authored
// wording (wording.js) to a quote from the learner's own text.
//
// Rules this module keeps:
//  * Every quote is a verbatim substring of the response. An observation whose quote is not in the text is dropped
//    (dropUngrounded), and isGrounded() lets any caller check a stored result again.
//  * One strength and at most ONE next step. Differences are not "corrected": a pattern is named only when the
//    detectors are confident, and never for dialect-sensitive patterns in speech.
//  * Accent, dialect and speed are never judged. Whether an idea is true (the science, the mathematics) is never
//    inferred from grammar: wording describes language on the page.
//  * A transcript may contain recognition errors: spelling, capital letters and punctuation are never observed for
//    it and the uncertainty note says so. A short response gets no sentence-variety claims.
//  * The text is data. Nothing in it can change the shape of the result; all wording is authored.
//  * No score, level or proficiency label.
import { analyzeResponse } from "../lang/analyze.js";
import { VAGUE } from "../lang/lexicon.js";
import { findPhrase, tokenize } from "../lang/text.js";
import { transferFor } from "./bank.js";
import {
  MOVE_TEXT,
  OBS_TEXT,
  PATTERN_TEXT,
  REVISION_TEXT,
  STEP_TEXT,
  STRENGTH_TEXT,
  UNCERTAINTY_TEXT,
} from "./wording.js";

export { TRANSFER_BANK, transferFor } from "./bank.js";
export { compareWork } from "./compare.js";

export const FEEDBACK_VERSION = 1;
export const MAX_TEXT = 6000;
/** Under this many words a response is "short": only what is there is described. */
export const SHORT_WORDS = 12;
const MAX_QUOTE = 160;
const KEY_USES = ["Narrate", "Inform", "Explain", "Argue"];

/** Never observed for speech: they describe writing conventions or words that only sound alike. */
export const WRITING_ONLY_PATTERNS = Object.freeze([
  "capital-punct",
  "common-misspelling",
  "confused-word",
  "comma-splice",
  "fragment-subordinate",
]);
/** Features of many dialects of English. Never named for speech; a spoken variety is not an error. */
export const DIALECT_PATTERNS = Object.freeze([
  "double-negative",
  "missing-be",
  "sv-agree-3sg",
  "be-agree",
]);
/** Next steps and observations that make a claim about sentence variety. Never given for a short response. */
export const SENTENCE_VARIETY_IDS = Object.freeze([
  "combine",
  "vary-openers",
  "link-ideas",
  "expand",
  "construction",
  "connectives",
  "clause-relationship",
]);

/** Broad words worth a question. Everyday verbs (make, get, said) are left alone: they are usually the right word. */
const BROAD_WORDS = new Set(["thing", "things", "stuff", "good", "bad", "nice", "big", "small", "a lot of", "lots", "very", "really"]);
const pair = (p) => [String(p?.[0] ?? ""), String(p?.[1] ?? p?.[0] ?? "")];
const within = (text, quote) => typeof quote === "string" && quote !== "" && text.includes(quote);

/** A quote taken from a span of the text, trimmed to a readable length on a word boundary. Always a substring. */
export function quoteOf(text, span) {
  if (!span || !(span.end > span.start)) return "";
  let q = text.slice(span.start, span.end);
  if (q.length > MAX_QUOTE) q = q.slice(0, MAX_QUOTE).replace(/\s+\S*$/, "");
  return q.trim() && text.includes(q) ? q : "";
}

/** Keep only observations whose quote is a verbatim, non-empty part of the text. */
export function dropUngrounded(list, text) {
  const src = String(text ?? "");
  return (Array.isArray(list) ? list : []).filter((o) => o && within(src, o.quote));
}

/** Every non-empty quote in a feedback result occurs in the text, and the result has the full shape. */
export function isGrounded(feedback, text) {
  const src = String(text ?? "");
  const f = feedback;
  if (!f || typeof f !== "object" || !f.strength || !f.nextStep || !f.dimensions) return false;
  const quotes = [
    f.strength.quote,
    f.nextStep.quote,
    ...["discourse", "sentence", "word"].flatMap((d) =>
      (f.dimensions[d] || []).map((o) => o.quote),
    ),
  ];
  return quotes.every((q) => typeof q === "string" && (q === "" || src.includes(q)));
}

const obs = (id, textPair, quote) => ({ id, text: pair(textPair), quote });
export const firstSpan = (spans) => (spans || []).find((s) => s && s.end > s.start);

function phraseSpans(text, list) {
  return list.flatMap((p) => findPhrase(text, p)).sort((a, b) => a.start - b.start);
}

function dimensionsOf(text, a, { short, keyUse }) {
  const q = (span) => quoteOf(text, span);
  const discourse = [];
  for (const m of a.purpose.moves.filter((x) => x.present && x.required).slice(0, 2)) {
    const t = MOVE_TEXT[`${a.purpose.keyUse}:${m.id}`];
    if (t) discourse.push(obs(`move-${m.id}`, t.did, q(firstSpan(m.evidence))));
  }
  const byJob = (job) => a.cohesion.devices.filter((d) => d.job === job);
  const link = firstSpan([...byJob("cause"), ...byJob("contrast"), ...byJob("addition")]);
  discourse.push(obs("coherence", OBS_TEXT.coherence, q(link)));
  discourse.push(obs("sequencing", OBS_TEXT.sequencing, q(firstSpan(byJob("sequence")))));
  discourse.push(obs("elaboration", OBS_TEXT.elaboration, q(firstSpan(byJob("example")))));
  discourse.push(
    obs(
      "evidence-integration",
      OBS_TEXT["evidence-integration"],
      q(firstSpan([...a.evidence.attributions, ...a.evidence.numbersFromSource])),
    ),
  );
  if (keyUse === "Argue")
    discourse.push(
      obs("audience-purpose", OBS_TEXT["audience-purpose"], q(firstSpan(byJob("stance")))),
    );

  const sentence = [];
  if (!short) {
    const shapes = a.sentenceStats.shapes;
    const complex = shapes.find((s) => s.complex);
    sentence.push(obs("construction", OBS_TEXT.construction, q(complex)));
    const sub = a.sentenceStats.subordinators[0];
    if (sub)
      sentence.push(
        obs("clause-relationship", OBS_TEXT["clause-relationship"], q(findPhrase(text, sub)[0])),
      );
    const compound = shapes.find((s) => s.compound && !s.complex);
    sentence.push(obs("connectives", OBS_TEXT.connectives, q(compound)));
    sentence.push(obs("expansion", OBS_TEXT.expansion, q(firstSpan(a.nounPhrases))));
  }

  const word = [];
  word.push(
    obs("academic-expression", OBS_TEXT["academic-expression"], q(firstSpan(a.word.academic))),
  );
  word.push(obs("content-term", OBS_TEXT["content-term"], q(firstSpan(a.word.domain))));
  word.push(obs("precision", OBS_TEXT.precision, q(firstSpan(a.evidence.termHits))));
  word.push(obs("word-choice", OBS_TEXT["word-choice"], q(firstSpan(a.word.vague.filter((v) => BROAD_WORDS.has(v.word))))));
  const built = a.word.derived.map((w) => findPhrase(text, w)[0]).find(Boolean);
  word.push(obs("morphology", OBS_TEXT.morphology, q(built)));

  const uniq = (list) => {
    const seen = new Set();
    return dropUngrounded(list, text).filter(
      (o) => !seen.has(o.quote + o.id) && seen.add(o.quote + o.id),
    );
  };
  return { discourse: uniq(discourse), sentence: uniq(sentence), word: uniq(word) };
}

function strengthOf(text, a, { short }) {
  const q = (span) => quoteOf(text, span);
  const out = [];
  // A move made with a cue the learner can point at comes first; whole-sentence moves after.
  const made = a.purpose.moves.filter((m) => m.present && m.required);
  for (const m of [...made].sort(
    (x, y) => (x.evidence[0]?.text?.length || 999) - (y.evidence[0]?.text?.length || 999),
  )) {
    const t = MOVE_TEXT[`${a.purpose.keyUse}:${m.id}`];
    if (t) out.push(obs(`move-${m.id}`, t.did, q(firstSpan(m.evidence))));
  }
  if (a.cohesion.variety >= 2)
    out.push(obs("links", STRENGTH_TEXT.links, q(firstSpan(a.cohesion.devices))));
  if (a.evidence.hasSource && a.evidence.cites >= 1)
    out.push(
      obs(
        "source",
        STRENGTH_TEXT.source,
        q(firstSpan([...a.evidence.termHits, ...a.evidence.numbersFromSource])),
      ),
    );
  if (!short) {
    out.push(
      obs("complex", STRENGTH_TEXT.complex, q(a.sentenceStats.shapes.find((s) => s.complex))),
    );
    out.push(obs("noun-phrase", STRENGTH_TEXT["noun-phrase"], q(firstSpan(a.nounPhrases))));
  }
  out.push(
    obs(
      "subject-words",
      STRENGTH_TEXT["subject-words"],
      q(firstSpan([...a.word.domain, ...a.word.academic])),
    ),
  );
  out.push(obs("own-words", STRENGTH_TEXT["own-words"], q(a.sentenceList[0])));
  return dropUngrounded(out, text)[0] || obs("none", STRENGTH_TEXT.none, "");
}

/** Every next step the rules can support for this response, best first. Each is one thing to try. */
function stepCandidates(text, a, { short, spoken }) {
  const q = (span) => quoteOf(text, span);
  const list = [];
  const add = (priority, id, dimension, t, quote, scaffold) =>
    list.push({
      priority,
      id,
      dimension,
      text: pair(t.text || t.todo),
      quote: quote || "",
      why: pair(t.why),
      scaffold,
    });
  const frame = (f) =>
    f
      ? { kind: "frame", text: [`Sentence frame: ${f}`, `Marco de oración (en inglés): ${f}`] }
      : null;
  const fromStep = (s, extra) => {
    if (!s) return null;
    if (s.kind === "frame") return frame(s.frame);
    if (s.kind === "connector")
      return {
        kind: "connector",
        text: [`Linking words to try: ${s.words}`, `Palabras de enlace para probar: ${s.words}`],
      };
    if (s.kind === "word" && extra)
      return {
        kind: "word",
        text: [
          `More exact words to consider: ${extra}`,
          `Palabras más exactas para considerar: ${extra}`,
        ],
      };
    return null;
  };
  if (a.words === 0) {
    add(100, "start", "discourse", STEP_TEXT.start, "", null);
    return list;
  }
  if (short)
    add(
      95,
      "develop",
      "discourse",
      STEP_TEXT.develop,
      q(a.sentenceList[0]),
      fromStep(STEP_TEXT.develop.scaffold),
    );

  a.purpose.moves
    .filter((m) => m.required && !m.present)
    .forEach((m, i) => {
      const t = MOVE_TEXT[`${a.purpose.keyUse}:${m.id}`];
      if (t)
        add(80 - i, `move-${m.id}`, "discourse", t, "", {
          kind: i === 0 ? "frame" : "model-move",
          text: frame(t.frame).text,
        });
    });

  for (const mv of a.nextMoves) {
    const t = STEP_TEXT[mv.id];
    if (!t || mv.id === "develop") continue;
    if (short && SENTENCE_VARIETY_IDS.includes(mv.id)) continue;
    const vague = mv.id === "precise-words" ? a.word.vague[0] : null;
    add(
      mv.priority,
      mv.id,
      t.dim,
      t,
      q(firstSpan(mv.spans)),
      fromStep(t.scaffold, vague ? (VAGUE[vague.word] || []).slice(0, 4).join(", ") : ""),
    );
  }
  if (a.nextMoves.some((m) => m.id === "develop") && !short)
    add(
      90,
      "develop",
      "discourse",
      STEP_TEXT.develop,
      q(a.sentenceList[0]),
      fromStep(STEP_TEXT.develop.scaffold),
    );

  // One pattern at most, and only where the detectors are confident. Speech keeps its conventions and its dialect.
  const blocked = new Set(spoken ? [...WRITING_ONLY_PATTERNS, ...DIALECT_PATTERNS] : []);
  const groups = new Map();
  for (const e of a.errors) {
    if (e.confidence !== "high" || blocked.has(e.id) || !PATTERN_TEXT[e.id]) continue;
    groups.set(e.id, [...(groups.get(e.id) || []), e]);
  }
  const top = a.nextMoves.find((m) => m.patternId)?.patternId;
  [...groups.entries()]
    .sort((x, y) => (y[0] === top) - (x[0] === top) || y[1].length - x[1].length)
    .forEach(([id, hits], i) => {
      const name = PATTERN_TEXT[id];
      const t = {
        text: [
          STEP_TEXT.fix.text[0].replace("{name}", name[0]),
          STEP_TEXT.fix.text[1].replace("{name}", name[1]),
        ],
        why: STEP_TEXT.fix.why,
      };
      add(
        (short ? 60 : 75 + Math.min(4, hits.length)) - i * 5,
        `fix-${id}`,
        id === "confused-word" || id === "l1-collocation" ? "word" : "sentence",
        t,
        q(hits[0]),
        null,
      );
    });

  if (!short && a.sentenceList.length)
    add(
      20,
      "expand",
      "sentence",
      STEP_TEXT.expand,
      q(a.sentenceList.find((s) => tokenize(s.text).length <= 10) || a.sentenceList[0]),
      fromStep(STEP_TEXT.expand.scaffold),
    );
  if (short && !list.length)
    add(10, "develop", "discourse", STEP_TEXT.develop, "", fromStep(STEP_TEXT.develop.scaffold));
  return list.sort((x, y) => y.priority - x.priority);
}

function clean(input) {
  const i = input && typeof input === "object" ? input : {};
  const task = i.task && typeof i.task === "object" ? i.task : {};
  return {
    text: String(i.text ?? "").slice(0, MAX_TEXT),
    keyUse: KEY_USES.includes(i.keyUse) ? i.keyUse : "Explain",
    domain: i.domain === "Speaking" ? "Speaking" : "Writing",
    source: i.source === "transcript" ? "transcript" : "typed",
    band: i.band === "3-5" ? "3-5" : "6-8",
    task: {
      id: String(task.id ?? ""),
      prompt: String(task.prompt ?? ""),
      sourceText: typeof task.sourceText === "string" ? task.sourceText : "",
      sourceTerms: Array.isArray(task.sourceTerms) ? task.sourceTerms.map(String).slice(0, 40) : [],
    },
  };
}

/**
 * Feedback for one response. See docs/part2-integration-map.md for the shape.
 * @param {{text:string, keyUse?:string, domain?:string, source?:"typed"|"transcript", task?:object, supports?:object, band?:string}} input
 * @param {{prefer?:string[]}} [opts] `prefer` is a list of next-step ids (an optional second look): the first one
 *   that the rules ALSO support for this text is shown instead of the rules' first choice. It can never add a step.
 */
export function buildFeedback(input, opts = {}) {
  const c = clean(input);
  const { text, keyUse } = c;
  const transcript = c.source === "transcript";
  const spoken = transcript || c.domain === "Speaking";
  const a = analyzeResponse(text, {
    keyUse,
    modality: spoken ? "speaking" : "writing",
    sourceText: c.task.sourceText,
    sourceTerms: c.task.sourceTerms,
    stage: "supported",
  });
  const short = a.words < SHORT_WORDS;
  const ctx = { short, spoken, keyUse };

  const candidates = stepCandidates(text, a, ctx);
  const prefer = Array.isArray(opts.prefer) ? opts.prefer.map(String) : [];
  const chosen =
    prefer.map((id) => candidates.find((s) => s.id === id)).find(Boolean) || candidates[0];
  const nextStep = {
    id: chosen.id,
    dimension: chosen.dimension,
    text: chosen.text,
    quote: within(text, chosen.quote) ? chosen.quote : "",
  };
  const level = transcript ? "transcript" : short ? "short" : "none";
  const note = transcript && short ? UNCERTAINTY_TEXT["transcript-short"] : UNCERTAINTY_TEXT[level];
  const tr = transferFor({ keyUse, taskId: c.task.id, band: c.band, prompt: c.task.prompt });
  const revise = a.words === 0 ? REVISION_TEXT.start : REVISION_TEXT.lead;

  return {
    version: FEEDBACK_VERSION,
    grounded: true,
    strength: strengthOf(text, a, ctx),
    nextStep,
    explanation: chosen.why,
    scaffold: chosen.scaffold || null,
    revisionPrompt:
      a.words === 0
        ? pair(revise)
        : [`${revise[0]} ${nextStep.text[0]}`, `${revise[1]} ${nextStep.text[1]}`],
    transfer: { prompt: tr.prompt, keyUse: tr.keyUse, route: tr.route },
    dimensions: dimensionsOf(text, a, ctx),
    uncertainty: { level, note: pair(note) },
  };
}

/** The ids of every next step the rules support for this input, best first (what a second look may choose from). */
export function nextStepOptions(input) {
  const c = clean(input);
  const spoken = c.source === "transcript" || c.domain === "Speaking";
  const a = analyzeResponse(c.text, {
    keyUse: c.keyUse,
    modality: spoken ? "speaking" : "writing",
    sourceText: c.task.sourceText,
    sourceTerms: c.task.sourceTerms,
    stage: "supported",
  });
  return stepCandidates(c.text, a, { short: a.words < SHORT_WORDS, spoken, keyUse: c.keyUse }).map(
    (s) => s.id,
  );
}

/** Next-step ids for an AI second look reply (src/class/ai-feedback.js askSecondLook): authored ids only. */
export const preferFromSecondLook = (look) =>
  look?.ok
    ? [
        look.move?.id && `move-${look.move.id}`,
        ...(look.patterns || []).map((p) => p?.id && `fix-${p.id}`),
      ].filter(Boolean)
    : [];
