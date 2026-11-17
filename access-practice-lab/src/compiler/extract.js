// Experience compiler, step 1 — EXTRACT. Pure and deterministic (no model, no DOM): a teacher's source text becomes
// sentences, key concepts, content vocabulary, factual statements (each with its source sentence index), cause/effect
// and claim/evidence relations found by connective patterns, entities, numbers and candidate objectives.
// Rules it keeps: the source is DATA (markup is stripped, nothing is executed); every fact points at the sentence it
// came from, so later steps can prove that nothing a student reads was invented.
import { ACADEMIC, COMMON_VERBS, DOMAIN_HINTS } from "../lang/lexicon.js";
import { isStop, numbersIn, sentences as splitSentences, stem, tokenize } from "../lang/text.js";

export const MAX_UPLOAD_BYTES = 200 * 1024;
export const MAX_SOURCE_CHARS = 12_000;
export const MIN_SOURCE_WORDS = 40;
export const UPLOAD_KINDS = Object.freeze({
  txt: "text",
  md: "md",
  markdown: "md",
  html: "html",
  htm: "html",
});

const ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
};
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

/** Is this upload acceptable? Type by extension (never by sniffing or running it) and size <= 200 KB. */
export function checkUpload({ name = "", size = 0 } = {}) {
  const ext = String(name).toLowerCase().split(".").pop();
  if (ext === "docx" || ext === "doc" || ext === "pdf")
    return { ok: false, error: "unsupported-document" };
  const kind = UPLOAD_KINDS[ext];
  if (!kind) return { ok: false, error: "unsupported-type" };
  if (!(size > 0)) return { ok: false, error: "empty-file" };
  if (size > MAX_UPLOAD_BYTES) return { ok: false, error: "too-large" };
  return { ok: true, kind };
}

function stripHtml(raw) {
  return String(raw)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(
      /<(script|style|noscript|template|svg|iframe|object|embed|head)\b[\s\S]*?<\/\1\s*>/gi,
      " ",
    )
    .replace(/<(script|style|iframe|object|embed)\b[\s\S]*$/gi, " ") // an unclosed block: drop the rest
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article|blockquote)\s*>|<br\s*\/?>/gi, "\n\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Math.min(0x10ffff, Number(n)) || 32))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? " ")
    .replace(/[<>]/g, " ");
}

function stripMarkdown(raw) {
  return String(raw)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s*(.*)$/gm, "$1.")
    .replace(/^\s{0,3}(?:[-*+]|\d+[.)])\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/[*_`~]{1,3}/g, "")
    .replace(/\.\.$/gm, ".");
}

/** Source text as plain prose: markup stripped, control characters removed, whitespace normalised, length capped. */
export function cleanSource(raw, kind = "text") {
  let s = String(raw ?? "");
  if (kind === "html") s = stripHtml(s);
  else if (kind === "md") s = stripMarkdown(stripHtml(s));
  else s = s.replace(/<[^>]{0,200}>/g, " ");
  return s
    .replace(CONTROL, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_SOURCE_CHARS);
}

const HINTS = new Set(DOMAIN_HINTS.map((w) => stem(w)));
const contentTokens = (text) =>
  tokenize(text).filter((t) => !isStop(t.lower) && t.lower.length > 2 && !/^\d/.test(t.lower));
export const stemsOf = (text) => contentTokens(text).map((t) => stem(t.lower));

// ── vocabulary: terms the source itself defines ──────────────────────────────
const TERM = "([\\p{L}][\\p{L}-]*(?: [\\p{L}][\\p{L}-]*){0,2})";
const DEFINERS = [
  new RegExp(`\\b(?:is|are|was|were) (?:also )?called (?:an? |the )?${TERM}(?=[.,;!?]|$)`, "iu"),
  new RegExp(`\\b(?:known as|named) (?:an? |the )?${TERM}(?=[.,;!?]|$)`, "iu"),
  new RegExp(`\\bcalled (?:an? |the )?([\\p{L}][\\p{L}-]*)\\b`, "iu"),
  new RegExp(`\\b${TERM}, which means\\b`, "iu"),
  new RegExp(`^(?:An?|The) ${TERM} (?:is|are) (?:an?|the) `, "u"),
];
const tidyTerm = (t) => {
  const words = String(t)
    .trim()
    .split(/\s+/)
    .filter((w) => !isStop(w.toLowerCase()));
  return words.slice(-2).join(" ").toLowerCase();
};

function vocabularyOf(sents) {
  const out = [];
  const seen = new Set();
  sents.forEach((s, i) => {
    for (const re of DEFINERS) {
      const m = re.exec(s.text);
      let term = m && tidyTerm(m[1]);
      if (term && /, which means/.test(m[0])) term = term.split(" ").pop();
      if (!term || term.length < 3 || seen.has(term)) continue;
      // one term per defining sentence: "called a food web" must not also yield "food"
      if (out.some((v) => v.from[0] === i)) continue;
      seen.add(term);
      out.push({ term, meaning: s.text, from: [i] });
    }
  });
  return out;
}

// ── relations by connective pattern ──────────────────────────────────────────
const MONTHS = /^(?:January|February|March|April|May|June|July|August|September|October|November|December|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/;
const clause = (t) =>
  String(t || "")
    .replace(/,?["“”]? (?:said|explained|reported|stated) [^"“”]*$/, "") // drop a quote's attribution
    .trim()
    .replace(/^[,;:\s"“”]+|[,;:\s."“”]+$/g, "");
const CAUSE_PATTERNS = [
  { marker: "because", re: /^Because (.+?), (.+)$/i, cause: 1, effect: 2 },
  { marker: "since", re: /^Since (.+?), (.+)$/i, cause: 1, effect: 2 },
  { marker: "when", re: /^(?:When|Whenever|After|Once) (.+?), (.+)$/i, cause: 1, effect: 2 },
  { marker: "if", re: /^If (.+?), (?:then )?(.+)$/i, cause: 1, effect: 2 },
  { marker: "because", re: /^(.+?),? because (?:of )?(.+)$/i, cause: 2, effect: 1 },
  { marker: "so", re: /^(.+?), so (?:that )?(.+)$/i, cause: 1, effect: 2 },
  {
    marker: "leads to",
    re: /^(.+?) (?:leads? to|led to|causes?|caused|results? in|resulted in|produces?|produced) (.+)$/i,
    cause: 1,
    effect: 2,
  },
  {
    marker: "due to",
    re: /^(.+?) (?:due to|thanks to|as a result of) (.+)$/i,
    cause: 2,
    effect: 1,
  },
];
const PREV_CAUSE =
  /^(As a result|Therefore|Consequently|For this reason|Because of this|This means|That is why|This is why|So),? (.+)$/i;
const RIVAL =
  /\b(?:at first|some|many|most) (?:\w+ ){0,3}(?:thought|believed|blamed|assumed|guessed|suspected|said|argued|claimed)\b|\bit (?:seemed|looked|appeared) (?:like|as if|that)\b|\b(?:a common|one) (?:idea|belief|guess|explanation) (?:is|was)\b/i;
const REBUT = /^(?:However|But|Yet|In fact|Still|Actually|Instead)\b/i;
const EVIDENCE =
  /\b(?:measured|counted|recorded|observed|found|showed|shows|reported|according to|the data|survey|experiment|tested|compared|percent|%)\b/i;
const SAID = /["“”][^"“”]{8,}["“”]|\b(?:said|explained|told|wrote|reported|stated)\b/i;

function relationsOf(sents) {
  const out = [];
  sents.forEach((s, i) => {
    const prev = PREV_CAUSE.exec(s.text);
    if (prev && i > 0)
      out.push({
        type: "cause",
        marker: prev[1].toLowerCase(),
        i,
        causeFrom: i - 1,
        cause: clause(sents[i - 1].text),
        effect: clause(prev[2]),
      });
    else
      for (const p of CAUSE_PATTERNS) {
        const m = p.re.exec(s.text);
        if (!m) continue;
        const cause = clause(m[p.cause]);
        const effect = clause(m[p.effect]);
        if (tokenize(cause).length < 2 || tokenize(effect).length < 2) continue;
        out.push({ type: "cause", marker: p.marker, i, causeFrom: i, cause, effect });
        break;
      }
    if (RIVAL.test(s.text)) {
      const rebuttal = sents[i + 1] && REBUT.test(sents[i + 1].text) ? i + 1 : -1;
      out.push({ type: "rival", marker: "belief", i, claim: clause(s.text), rebuttal });
    } else if (REBUT.test(s.text))
      out.push({ type: "contrast", marker: "however", i, claim: clause(s.text) });
    if (EVIDENCE.test(s.text) || numbersIn(s.text).length)
      out.push({ type: "evidence", marker: "data", i, claim: clause(s.text) });
  });
  return out;
}

// ── concepts, entities, numbers ──────────────────────────────────────────────
function conceptsOf(sents, vocabulary) {
  const byStem = new Map();
  sents.forEach((s, i) => {
    for (const t of contentTokens(s.text)) {
      const key = stem(t.lower);
      const c = byStem.get(key) || { stem: key, count: 0, forms: new Map(), sentences: new Set() };
      c.count += 1;
      c.forms.set(t.lower, (c.forms.get(t.lower) || 0) + 1);
      c.sentences.add(i);
      byStem.set(key, c);
    }
  });
  const defined = new Set(vocabulary.flatMap((v) => v.term.split(" ").map((w) => stem(w))));
  return [...byStem.values()]
    .map((c) => {
      const term = [...c.forms.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].length - b[0].length,
      )[0][0];
      const weight =
        c.count +
        (defined.has(c.stem) ? 2 : 0) +
        (HINTS.has(c.stem) ? 2 : 0) +
        (ACADEMIC.has(term) ? 1 : 0);
      return {
        term,
        stem: c.stem,
        count: c.count,
        weight,
        defined: defined.has(c.stem),
        sentences: [...c.sentences],
      };
    })
    .filter((c) => (c.count >= 2 || c.defined) && !COMMON_VERBS.has(c.term) && !COMMON_VERBS.has(c.stem))
    .sort((a, b) => b.weight - a.weight || b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, 12);
}

function entitiesOf(sents) {
  const found = new Map();
  const re = /(?:(?:Mr|Mrs|Ms|Dr|Prof)\. )?\p{Lu}[\p{L}'’-]+(?: \p{Lu}[\p{L}'’-]+)*/gu;
  sents.forEach((s, i) => {
    for (const m of s.text.matchAll(re)) {
      const name = m[0];
      const titled = /^(?:Mr|Mrs|Ms|Dr|Prof)\. /.test(name);
      const opener = m.index === 0 || /["“]\s*$/.test(s.text.slice(0, m.index));
      if (!titled && !name.includes(" ") && opener) continue; // an ordinary sentence-opening capital
      if (!titled && name.split(" ").every((w) => isStop(w.toLowerCase()))) continue;
      const clean =
        !titled && opener && name.includes(" ") && isStop(name.split(" ")[0].toLowerCase())
          ? name.split(" ").slice(1).join(" ")
          : name;
      if (clean.length < 3 || (!clean.includes(" ") && opener) || MONTHS.test(clean)) continue;
      const e = found.get(clean) || {
        name: clean,
        kind: titled ? "person" : "name",
        sentences: [],
      };
      if (!e.sentences.includes(i)) e.sentences.push(i);
      found.set(clean, e);
    }
  });
  return [...found.values()];
}

/** A person the source quotes or reports ("said Ms. Okafor, the science teacher") → { name, role, sentences }. */
function speakersOf(sents) {
  const out = [];
  const re =
    /\b(?:said|explained|reported|stated|wrote|told \w+)\s+((?:(?:Mr|Mrs|Ms|Dr|Prof)\. )?\p{Lu}[\p{L}'’-]+(?: \p{Lu}[\p{L}'’-]+)?)(?:, (?:an? |the )?([\p{Ll} -]{3,40}?))?(?=[.,;]|$)|((?:(?:Mr|Mrs|Ms|Dr|Prof)\. )?\p{Lu}[\p{L}'’-]+(?: \p{Lu}[\p{L}'’-]+)?)(?:, (?:an? |the )?([\p{Ll} -]{3,40}?),)? (?:said|explained|reported|stated)\b/u;
  sents.forEach((s, i) => {
    const m = re.exec(s.text);
    const name = m && (m[1] || m[3]);
    if (!name || isStop(name.toLowerCase())) return;
    const quoted = [i];
    if (sents[i + 1] && /^["“]/.test(sents[i + 1].text)) quoted.push(i + 1);
    const known = out.find((x) => x.name === name);
    if (known) known.sentences.push(...quoted.filter((q) => !known.sentences.includes(q)));
    else out.push({ name, role: (m[2] || m[4] || "").trim(), sentences: quoted });
  });
  return out;
}

function objectivesOf(relations, concepts) {
  const causes = relations.filter((r) => r.type === "cause").length;
  const rivals = relations.filter((r) => r.type === "rival" || r.type === "contrast").length;
  const [a, b] = [concepts[0]?.term || "the topic", concepts[1]?.term || "the other parts"];
  const out = [];
  if (causes >= 2)
    out.push({
      keyUse: "Explain",
      text: [
        `Explain how a change in ${a} affects ${b}, using evidence from the text.`,
        `Explicar cómo un cambio en "${a}" afecta a "${b}", con evidencia del texto.`,
      ],
    });
  if (rivals >= 1)
    out.push({
      keyUse: "Argue",
      text: [
        `Argue which explanation about ${a} the evidence supports.`,
        `Argumentar qué explicación sobre "${a}" apoya la evidencia.`,
      ],
    });
  out.push({
    keyUse: "Inform",
    text: [
      `Inform a listener about ${a} with accurate facts from the text.`,
      `Informar a alguien sobre "${a}" con datos exactos del texto.`,
    ],
  });
  return out;
}

/**
 * @param {string} text  cleaned source text (cleanSource)
 * @returns {{ ok, error?, title, text, words, sentences, concepts, vocabulary, facts, relations, entities, speakers, numbers, objectives }}
 */
export function extractSource(text, { title = "" } = {}) {
  const clean = cleanSource(text);
  const sents = splitSentences(clean).map((s, i) => ({ i, text: s.text.replace(/\s+/g, " ") }));
  const words = tokenize(clean).length;
  const vocabulary = vocabularyOf(sents);
  const concepts = conceptsOf(sents, vocabulary);
  const conceptStems = new Set(concepts.map((c) => c.stem));
  const relations = relationsOf(sents);
  const facts = sents
    .filter((s) => tokenize(s.text).length >= 5 && !/\?\s*$/.test(s.text))
    .map((s) => {
      const st = stemsOf(s.text);
      return {
        i: s.i,
        text: s.text,
        numbers: numbersIn(s.text).map((n) => n.value),
        concepts: [...new Set(st.filter((x) => conceptStems.has(x)))],
        quoted: /["“”]/.test(s.text) || SAID.test(s.text),
        cause: relations.some((r) => r.type === "cause" && r.i === s.i),
        evidence: relations.some((r) => r.type === "evidence" && r.i === s.i),
      };
    })
    .filter((f) => f.concepts.length || f.numbers.length);
  const numbers = sents.flatMap((s) =>
    numbersIn(s.text).map((n) => ({
      value: n.value,
      i: s.i,
      unit: (/^\s*([\p{L}%]+(?: per [\p{L}]+)?)/u.exec(s.text.slice(n.end)) || [])[1] || "",
    })),
  );
  const base = {
    title: String(title || "")
      .trim()
      .slice(0, 120),
    text: clean,
    words,
    sentences: sents,
    concepts,
    vocabulary,
    facts,
    relations,
    entities: entitiesOf(sents),
    speakers: speakersOf(sents),
    numbers,
    objectives: objectivesOf(relations, concepts),
  };
  if (words < MIN_SOURCE_WORDS) return { ok: false, error: "too-short", ...base };
  if (facts.length < 6) return { ok: false, error: "too-few-facts", ...base };
  return { ok: true, ...base };
}

/** Share (0..1) of a text's content stems that occur in the given source sentences — the traceability measure. */
export function overlap(text, sourceSentences) {
  const want = stemsOf(text);
  if (!want.length) return 1;
  const have = new Set(sourceSentences.flatMap((s) => stemsOf(typeof s === "string" ? s : s.text)));
  const nums = new Set(
    sourceSentences.flatMap((s) =>
      numbersIn(typeof s === "string" ? s : s.text).map((n) => n.value),
    ),
  );
  const numsWanted = numbersIn(text).map((n) => n.value);
  const hit = want.filter((w) => have.has(w)).length + numsWanted.filter((n) => nums.has(n)).length;
  return hit / (want.length + numsWanted.length);
}
