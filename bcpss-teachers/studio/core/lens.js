// The Language Lens: a deterministic, explainable read of the language in a text or lesson.
// Pure functions (no DOM, no network, no randomness): the same input always gives the same report.
// It finds the language a text asks of students. It does NOT measure how hard the idea is; see CONCEPT_NOTE.
import { bandOf } from "../data/taxonomy.js";
import {
  ACADEMIC_WORDS,
  AGENTLESS_PARTICIPLES,
  CONCRETE,
  CONNECTORS,
  FUNCTIONS,
  FUNCTION_WORDS,
  IDIOMS,
  MATH_PHRASES,
  NOMINALIZATION_SKIP,
  PHRASAL_VERBS,
  POLYSEMY,
  PRONOUNS,
  SUBJECT_LIST_KEYS,
  SUBJECT_TERMS,
  SUBORDINATORS,
  VERB_BREAKS,
  VISUAL_CUES,
} from "./lens-wordlists.js";
import { studentSections } from "./lensdata.js";

export const CONCEPT_NOTE =
  "Language load describes the words and sentences students must read, hear, say or write. It is not a measure of how hard the idea is. A short, plain-sounding text can hold a demanding concept, and a long formal text can hold an easy one. Rate concept difficulty separately, from what you know about your students.";

const LONG_SENTENCE = { "k-2": 12, "3-5": 18, "6-8": 25 };
const DEFAULT_LONG = 22;
const ABBREVIATIONS =
  /^(mr|mrs|ms|dr|st|vs|etc|fig|no|approx|jr|sr|inc|min|max|ft|lb|oz|mi|e\.g|i\.e)$/i;
const ACADEMIC = new Set(ACADEMIC_WORDS);
const AMBIGUOUS_ANYWHERE = new Set(
  "table base product volume degree power plot figure cell matter energy branch bill court scale range root property".split(
    " ",
  ),
);
const PARTICIPLES = new Set(
  "given taken written drawn chosen grown broken begun shown seen known eaten fallen hidden spoken stolen worn torn frozen forgotten proven driven risen".split(
    " ",
  ),
);
const NOT_SUPERLATIVE = new Set(
  "forest interest west east rest test nest request harvest honest guest quest contest suggest invest protest".split(
    " ",
  ),
);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const reCache = new Map();
const cached = (src, flags = "gi") => {
  const k = `${flags}:${src}`;
  if (!reCache.has(k)) reCache.set(k, new RegExp(src, flags));
  const re = reCache.get(k);
  re.lastIndex = 0;
  return re;
};
const phraseRe = (term) =>
  cached(`\\b${escapeRe(term).replace(/(\\?[-\s])+/g, "[-\\s]+")}(?:s|es)?\\b`);

/** Candidate base forms of an inflected word, so "ratios", "solved", "comparing" find their headwords. */
export function baseForms(w) {
  const out = [w];
  if (w.endsWith("ies")) out.push(`${w.slice(0, -3)}y`);
  if (w.endsWith("es")) out.push(w.slice(0, -2));
  if (w.endsWith("s")) out.push(w.slice(0, -1));
  if (w.endsWith("ied")) out.push(`${w.slice(0, -3)}y`);
  if (w.endsWith("ed")) {
    const b = w.slice(0, -2);
    out.push(b, w.slice(0, -1));
    if (/(.)\1$/.test(b)) out.push(b.slice(0, -1));
  }
  if (w.endsWith("ing")) {
    const b = w.slice(0, -3);
    out.push(b, `${b}e`);
    if (/(.)\1$/.test(b)) out.push(b.slice(0, -1));
  }
  if (w.endsWith("ly")) out.push(w.slice(0, -2));
  return out;
}
const lookup = (set, w) => (w.length < 3 ? null : baseForms(w).find((f) => set.has(f)) || null);

/** Split text into sentences, keeping exact offsets. Text is never altered: slice(start,end) === text. */
export function splitSentences(text) {
  const src = String(text ?? "");
  const out = [];
  const push = (a, b) => {
    let s = a;
    let e = b;
    while (s < e && /\s/.test(src[s])) s++;
    while (e > s && /\s/.test(src[e - 1])) e--;
    if (e > s) out.push({ text: src.slice(s, e), start: s, end: e });
  };
  const lines = /[^\n]*\n?/g;
  let m;
  while ((m = lines.exec(src)) && m[0] !== "") {
    const base = m.index;
    const line = m[0];
    const stop = /[.!?]+["'”’)\]]*(?=\s|$)/g;
    let from = 0;
    let t;
    while ((t = stop.exec(line))) {
      const endIdx = t.index + t[0].length;
      if (t[0][0] === "." && t[0].length === 1) {
        const word = (/([A-Za-z.]+|\d+)$/.exec(line.slice(0, t.index)) || [])[1] || "";
        const startsLine = !line.slice(0, t.index - word.length).trim();
        const next = (/^\s*(\S)/.exec(line.slice(endIdx)) || [])[1] || "";
        if (ABBREVIATIONS.test(word) || (/^[A-Z]$/.test(word) && next && /[A-Z]/.test(next)))
          continue;
        if (startsLine && /^\d+$/.test(word)) continue;
        if (next && /[a-z]/.test(next)) continue;
      }
      push(base + from, base + endIdx);
      from = endIdx;
    }
    push(base + from, base + line.length);
  }
  return out;
}

const tokenize = (s) =>
  [...s.matchAll(/[A-Za-z][A-Za-z'’-]*/g)].map((m) => ({
    w: m[0].replace(/['’-]+$/, "").toLowerCase(),
    i: m.index,
    raw: m[0],
  }));
const wordCount = (s) => tokenize(s).length;
const first = (list, n = 3) => list.slice(0, n);
const bandFor = (grade) => (grade ? bandOf(String(grade)) : null);

function technicalLists(subject, extra = []) {
  const keys = SUBJECT_LIST_KEYS[subject] || [];
  const singles = new Set();
  const phrases = new Set();
  for (const k of keys)
    for (const t of SUBJECT_TERMS[k] || [])
      (/[\s-]/.test(t) ? phrases : singles).add(t.toLowerCase());
  const seeded = new Set();
  for (const t of extra || []) {
    const word = String(typeof t === "string" ? t : t?.word || "")
      .trim()
      .toLowerCase();
    if (!word) continue;
    seeded.add(word);
    (/[\s-]/.test(word) ? phrases : singles).add(word);
  }
  return { singles, phrases, seeded };
}

function findVocabulary(sentences, subject, extra) {
  const { singles, phrases, seeded } = technicalLists(subject, extra);
  const found = new Map();
  const note = (word, kind, tier, surface, sentence) => {
    const key = `${kind}:${word}`;
    const rec = found.get(key) || { word, kind, tier, count: 0, forms: [], example: sentence.text };
    rec.count += 1;
    if (!rec.forms.includes(surface)) rec.forms.push(surface);
    found.set(key, rec);
  };
  const candidates = new Map();
  for (const s of sentences) {
    const masked = [];
    for (const p of phrases) {
      for (const m of s.text.matchAll(phraseRe(p))) {
        masked.push([m.index, m.index + m[0].length]);
        note(p, seeded.has(p) ? "collection" : "technical", 3, m[0].toLowerCase(), s);
      }
    }
    for (const t of tokenize(s.text)) {
      if (masked.some(([a, b]) => t.i >= a && t.i < b)) continue;
      const tech = lookup(singles, t.w);
      if (tech) note(tech, seeded.has(tech) ? "collection" : "technical", 3, t.w, s);
      else {
        const acad = lookup(ACADEMIC, t.w);
        if (acad) note(acad, "academic", 2, t.w, s);
        else if (
          t.w.length >= 9 &&
          !FUNCTION_WORDS.has(t.w) &&
          !(t.i > 0 && /^[A-Z]/.test(t.raw))
        ) {
          const c = candidates.get(t.w) || { word: t.w, count: 0, example: s.text };
          c.count += 1;
          candidates.set(t.w, c);
        }
      }
    }
  }
  const byCount = (a, b) => b.count - a.count || a.word.localeCompare(b.word);
  const all = [...found.values()];
  return {
    technical: all.filter((r) => r.kind !== "academic").sort(byCount),
    academic: all.filter((r) => r.kind === "academic").sort(byCount),
    candidates: [...candidates.values()].sort(byCount).slice(0, 12),
  };
}

function findFunctions(sentences) {
  const out = [];
  for (const f of FUNCTIONS) {
    const evidence = [];
    const cues = new Set();
    let weight = 0;
    for (const s of sentences) {
      let hit = false;
      for (const c of f.cues) {
        const m = cached(c).exec(s.text);
        if (m) {
          hit = true;
          cues.add(m[0].toLowerCase());
          weight += 1;
        }
      }
      const firstWord = (tokenize(s.text)[0] || {}).w;
      if (firstWord && f.taskVerbs.includes(firstWord)) {
        hit = true;
        cues.add(firstWord);
        weight += 2;
      }
      if (hit && evidence.length < 3) evidence.push(s.text);
    }
    if (weight)
      out.push({
        id: f.id,
        label: f.label,
        verb: f.verb,
        klu: f.klu,
        weight,
        cues: [...cues].slice(0, 6),
        evidence,
      });
  }
  return out.sort((a, b) => b.weight - a.weight || a.label.localeCompare(b.label));
}

const SUB_ALWAYS = SUBORDINATORS.filter((s) => !/^(before|after|since|until|once)$/.test(s));
const subRe = cached(`\\b(?:${SUB_ALWAYS.map(escapeRe).join("|")})\\b`);
const subLateRe = cached(
  "\\b(?:before|after|since|until|once)\\s+(?:you|we|they|he|she|it|i|this|there|students|[a-z]+ing)\\b",
);
const passiveRe = cached(
  "\\b(?:is|are|was|were|be|been|being)\\s+(?:\\w+ly\\s+)?(\\w{3,}ed|\\w+)\\b",
);
const condRe = cached("\\b(?:if|unless|whenever|provided that)\\b");
const compRe = cached(
  "\\b\\w+er than\\b|\\b(?:more|less) \\w+ than\\b|\\bas \\w+ as\\b|\\b(?:most|least) \\w+",
);

const countSubordination = (t) => (t.match(subRe) || []).length + (t.match(subLateRe) || []).length;
function isPassive(t) {
  for (const m of t.matchAll(passiveRe)) {
    const w = m[1].toLowerCase();
    if (
      PARTICIPLES.has(w) ||
      AGENTLESS_PARTICIPLES.has(w) ||
      (/ed$/.test(w) && w.length >= 5 && !/^(tired|excited|interested|red|need|speed)$/.test(w))
    )
      return true;
  }
  return false;
}
function longNounPhrases(sentence) {
  const toks = tokenize(sentence.text);
  const spans = [];
  let start = -1;
  const close = (end) => {
    if (start >= 0 && end - start >= 7)
      spans.push(sentence.text.slice(toks[start].i, toks[end - 1].i + toks[end - 1].raw.length));
    start = -1;
  };
  toks.forEach((t, k) => {
    if (start < 0 && /^(the|a|an|each|every|this|these|those|their|its)$/.test(t.w)) start = k;
    else if (start >= 0 && (VERB_BREAKS.has(t.w) || (/ed$/.test(t.w) && !/^(red)$/.test(t.w))))
      close(k);
  });
  close(toks.length);
  return spans;
}

function findStructures(sentences) {
  const rec = () => ({ count: 0, sentences: 0, examples: [] });
  const S = {
    subordination: rec(),
    conditionals: rec(),
    passive: rec(),
    nominalization: rec(),
    comparatives: rec(),
    longNounPhrases: rec(),
    multiClause: { count: 0, max: 1, examples: [] },
  };
  const nomWords = new Set();
  const add = (r, s, n = 1) => {
    r.count += n;
    r.sentences += 1;
    if (r.examples.length < 3) r.examples.push(s.text);
  };
  for (const s of sentences) {
    const t = s.text;
    const sub = countSubordination(t);
    if (sub) add(S.subordination, s, sub);
    if (condRe.test(t)) add(S.conditionals, s);
    condRe.lastIndex = 0;
    if (isPassive(t)) add(S.passive, s);
    const comp =
      (t.match(compRe) || []).length +
      tokenize(t).filter(
        (x) => /^[a-z]{3,}est$/.test(x.w) && !NOT_SUPERLATIVE.has(x.w) && x.w !== "best",
      ).length;
    if (comp) add(S.comparatives, s, comp);
    for (const x of tokenize(t)) {
      if (
        /(tion|sion|ment|ness|ity|ance|ence|ism)s?$/.test(x.w) &&
        x.w.length >= 7 &&
        !NOMINALIZATION_SKIP.has(x.w) &&
        !NOMINALIZATION_SKIP.has(x.w.replace(/s$/, ""))
      )
        nomWords.add(x.w);
    }
    const nps = longNounPhrases(s);
    if (nps.length) {
      S.longNounPhrases.count += nps.length;
      S.longNounPhrases.sentences += 1;
      if (S.longNounPhrases.examples.length < 3) S.longNounPhrases.examples.push(nps[0]);
    }
    const clauses = 1 + sub + (t.match(/,\s*(?:and|but|or|so|yet)\b|;/gi) || []).length;
    if (clauses >= 3) {
      S.multiClause.count += 1;
      if (S.multiClause.examples.length < 3) S.multiClause.examples.push(t);
    }
    S.multiClause.max = Math.max(S.multiClause.max, clauses);
  }
  S.nominalization.count = nomWords.size;
  S.nominalization.examples = first([...nomWords].sort(), 8);
  S.nominalization.sentences = nomWords.size ? 1 : 0;
  return S;
}

function findBarriers(sentences, subject, threshold) {
  const out = [];
  const poly = new Map();
  const lead = [];
  for (const s of sentences) {
    const toks = tokenize(s.text);
    for (const t of toks) {
      const e = POLYSEMY.find(
        (p) => p.w === t.w || (p.w !== "mean" && (t.w === `${p.w}s` || t.w === `${p.w}es`)),
      );
      if (e && (e.s.includes(subject) || (!e.s.includes(subject) && AMBIGUOUS_ANYWHERE.has(e.w)))) {
        const r = poly.get(e.w) || {
          type: "polysemy",
          text: e.w,
          count: 0,
          sentence: s.text,
          detail: `Academic sense: ${e.a}. Everyday sense: ${e.e}.`,
          likely: e.s.includes(subject) ? "academic" : "check",
        };
        r.count += 1;
        poly.set(e.w, r);
      }
    }
    for (const [p, gloss] of IDIOMS) {
      const m = phraseRe(p).exec(s.text);
      if (m) out.push({ type: "idiom", text: m[0], detail: `Means: ${gloss}.`, sentence: s.text });
    }
    for (const [p, gloss] of PHRASAL_VERBS) {
      const m = cached(`\\b(?:${p})\\b`).exec(s.text);
      if (m)
        out.push({
          type: "phrasal-verb",
          text: m[0],
          detail: `Phrasal verb. Means: ${gloss}.`,
          sentence: s.text,
        });
    }
    if (subject === "math") {
      for (const mp of MATH_PHRASES) {
        const m = cached(mp.re).exec(s.text);
        if (m) out.push({ type: "math-phrase", text: m[0], detail: mp.note, sentence: s.text });
      }
    }
    if (toks.length > threshold)
      out.push({
        type: "long-sentence",
        text: s.text,
        detail: `${toks.length} words in one sentence.`,
        sentence: s.text,
      });
    const pron = toks.filter((t) => PRONOUNS.has(t.w)).length;
    if (pron >= 3)
      out.push({
        type: "pronoun-chain",
        text: s.text,
        detail: `${pron} pronouns in one sentence. Students must track what each one points back to.`,
        sentence: s.text,
      });
    if (toks[0] && /^(this|it|that|they|these|those)$/.test(toks[0].w)) lead.push(s.text);
    if (
      /\b(?:not|no|never|cannot|n't)\b[^.?!]*\b(?:not|no|never|neither|nor|without|unless|n't)\b/i.test(
        s.text,
      )
    )
      out.push({
        type: "negation",
        text: s.text,
        detail: "Two negatives in one sentence.",
        sentence: s.text,
      });
  }
  out.push(...[...poly.values()].sort((a, b) => a.text.localeCompare(b.text)));
  if (lead.length >= 2)
    out.push({
      type: "pronoun-chain",
      text: `${lead.length} sentences start with a pronoun such as This or It`,
      detail: "Check that students know what each one points back to.",
      sentence: lead[0],
    });
  return out;
}

function findVisuals(sentences) {
  const text = sentences.map((s) => s.text).join(" ");
  const toks = new Set(tokenize(text).map((t) => t.w));
  const out = [];
  const seen = new Set();
  for (const [word, cat] of CONCRETE) {
    if (seen.has(word) || !(toks.has(word) || toks.has(`${word}s`))) continue;
    seen.add(word);
    if (out.length < 10)
      out.push({
        term: word,
        kind: cat === "representation" ? "visual" : "picture",
        advice: `a clear picture of "${word}" (${cat.replace("-", " ")})`,
      });
  }
  for (const v of VISUAL_CUES) {
    const m = [...text.matchAll(cached(v.re))].map((x) => x[0].toLowerCase());
    if (m.length)
      out.push({ term: [...new Set(m)].slice(0, 3).join(", "), kind: v.kind, advice: v.advice });
  }
  return out;
}

function detectGenre(text, functions, subject) {
  if (
    /(^|\n)\s*(\d+[.)]|step \d)/i.test(text) ||
    (functions[0]?.id === "sequence" && /\b(first|then|next)\b/i.test(text))
  )
    return "procedure";
  if (
    /\bonce upon\b|\bhe said\b|\bshe said\b|\bchapter\b/i.test(text) ||
    functions[0]?.id === "narrate"
  )
    return "story";
  if (["justify", "evaluate", "cite"].includes(functions[0]?.id)) return "argument";
  if (
    subject === "math" &&
    /\d/.test(text) &&
    /\bhow (many|much)\b|\bwhat is\b|\bfind\b/i.test(text)
  )
    return "problem";
  return "explanation";
}
const GENRE_DISCOURSE = {
  procedure: "follow and give steps in order, using sequence words",
  story: "retell events in order with who, where and what happened",
  argument: "state a claim, give a reason and evidence, and respond to a question",
  problem: "restate the problem in your own words before solving, then explain the answer",
  explanation: "say the big idea in one sentence, then add details and an example",
};

function connectorUse(text) {
  const used = [];
  for (const [purpose, list] of Object.entries(CONNECTORS)) {
    const hits = list.filter((c) => cached(`\\b${escapeRe(c)}\\b`).test(text));
    if (hits.length) used.push({ purpose, words: hits.slice(0, 4) });
  }
  return used;
}

function languageLoad(stats, S, vocabPer100, barrierPer100, threshold) {
  const perSentence = stats.sentences
    ? (S.subordination.count +
        S.passive.sentences +
        S.conditionals.sentences +
        S.comparatives.count +
        S.longNounPhrases.count +
        S.nominalization.count / 3) /
      stats.sentences
    : 0;
  const parts = {
    sentenceLength: Math.min(2, stats.avgSentenceWords / threshold),
    structures: Math.min(2, perSentence / 1),
    vocabulary: Math.min(2, vocabPer100 / 15),
    barriers: Math.min(2, barrierPer100 / 4),
  };
  const score =
    0.35 * parts.sentenceLength +
    0.25 * parts.structures +
    0.25 * parts.vocabulary +
    0.15 * parts.barriers;
  const level = score < 0.7 ? "lighter" : score < 1.2 ? "moderate" : "heavier";
  const drivers = [
    `Sentences average ${stats.avgSentenceWords} words; the longest has ${stats.longestSentenceWords}.`,
    `${vocabPer100} academic or technical words per 100 words.`,
    `${Math.round(perSentence * 100) / 100} complex structures per sentence.`,
    `${barrierPer100} possible barriers per 100 words.`,
  ];
  return { level, score: Math.round(score * 100) / 100, parts, drivers };
}

/** analyzeLanguage(text, { grade, subject, terms }) -> report. terms: extra technical words (for example from a studio vocabulary collection). */
export function analyzeLanguage(text, { grade = "", subject = "", terms = [] } = {}) {
  const sentences = splitSentences(text);
  const counts = sentences.map((s) => wordCount(s.text));
  const words = counts.reduce((a, b) => a + b, 0);
  const band = bandFor(grade);
  const threshold = LONG_SENTENCE[band] || DEFAULT_LONG;
  const stats = {
    words,
    sentences: sentences.length,
    avgSentenceWords: sentences.length ? Math.round((words / sentences.length) * 10) / 10 : 0,
    longestSentenceWords: Math.max(0, ...counts),
    longSentenceLimit: threshold,
    longSentences: counts.filter((c) => c > threshold).length,
  };
  const vocabulary = findVocabulary(sentences, subject, terms);
  const functions = findFunctions(sentences);
  const structures = findStructures(sentences);
  const barriers = findBarriers(sentences, subject, threshold);
  const joined = sentences.map((s) => s.text).join("\n");
  const genre = detectGenre(joined, functions, subject);
  const vocabHits = [...vocabulary.academic, ...vocabulary.technical].reduce(
    (n, v) => n + v.count,
    0,
  );
  const vocabPer100 = words ? Math.round((vocabHits / words) * 1000) / 10 : 0;
  const barrierPer100 = words
    ? Math.round((barriers.filter((b) => b.type !== "long-sentence").length / words) * 1000) / 10
    : 0;
  const discourse = [
    ...first(functions, 3).map((f) => ({
      text: FUNCTIONS.find((x) => x.id === f.id).discourse,
      because: `The text uses "${f.cues[0]}" (${f.label.toLowerCase()}).`,
    })),
    {
      text: GENRE_DISCOURSE[genre],
      because: `The text reads like ${genre === "problem" ? "a word problem" : `an ${genre === "explanation" ? "explanation" : genre}`}.`,
    },
  ].filter((d, i, a) => a.findIndex((x) => x.text === d.text) === i);
  const oral = [
    ...first(functions, 3).map((f) => {
      const def = FUNCTIONS.find((x) => x.id === f.id);
      return {
        function: f.id,
        text: `Partners rehearse out loud before writing: "${def.frames.dev[0]}"`,
        why: `Prepares students to ${def.verb}.`,
      };
    }),
    ...[...sentences]
      .sort((a, b) => wordCount(b.text) - wordCount(a.text))
      .slice(0, stats.longSentences ? 1 : 0)
      .map((s) => ({
        function: "chunk",
        text: `Read this sentence aloud in chunks, then say it in your own words: "${s.text}"`,
        why: "It is one of the longest sentences in the text.",
      })),
    ...first(vocabulary.technical.concat(vocabulary.academic), 2).map((v) => ({
      function: "vocabulary",
      text: `Say "${v.word}", say what it means, then use it in a sentence with a partner.`,
      why: "Key word for the task.",
    })),
  ];
  const writing = first(functions, 3).map((f) => ({
    function: f.id,
    label: f.label,
    frames: FUNCTIONS.find((x) => x.id === f.id).frames,
  }));
  return {
    version: 1,
    grade: String(grade || ""),
    subject: subject || "",
    band,
    stats,
    vocabulary,
    functions,
    structures,
    discourse,
    genre,
    connectors: connectorUse(joined),
    barriers,
    visuals: findVisuals(sentences),
    oral,
    writing,
    languageLoad: languageLoad(stats, structures, vocabPer100, barrierPer100, threshold),
    conceptNote: CONCEPT_NOTE,
  };
}

/** analyzeLesson(pack, { terms }) -> report for the whole student-facing lesson, plus where the load sits. */
export function analyzeLesson(pack, { terms = [] } = {}) {
  const sections = studentSections(pack);
  const opts = { grade: pack?.grade, subject: pack?.subject, terms };
  const report = analyzeLanguage(sections.map((s) => s.text).join("\n"), opts);
  const bySection = sections
    .map((s) => {
      const r = analyzeLanguage(s.text, opts);
      return {
        section: s.label,
        words: r.stats.words,
        load: r.languageLoad.level,
        score: r.languageLoad.score,
        longSentences: r.stats.longSentences,
        barriers: r.barriers.length,
      };
    })
    .sort((a, b) => b.score - a.score || a.section.localeCompare(b.section));
  const declared = pack?.languageDemands?.functions || [];
  const declaredText = declared.join(" ").toLowerCase();
  const notDeclared = report.functions
    .filter(
      (f) =>
        !declaredText.includes(f.verb.split(" ")[0]) &&
        !declaredText.includes(f.label.split(" ")[0].toLowerCase()),
    )
    .map((f) => f.label);
  return { ...report, bySection, declaredFunctions: declared, detectedNotDeclared: notDeclared };
}
