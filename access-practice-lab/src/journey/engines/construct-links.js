// Language Construction Engine, links: word identity, connectors by job, the clauses around a connector,
// the causal relationship a sentence builds, and the connector comparison behind the swap lab.
// Pure logic, no DOM. Every span points at the learner's own text. Contract: access-practice-lab/JOURNEY.md.
import { CONNECTORS, IRREGULAR } from "../../lang/lexicon.js";
import { findPhrase, isStop, sentences, stem, tokenize } from "../../lang/text.js";

export const T = (en, es) => [en, es];

// ── word identity ────────────────────────────────────────────────────────────
const IRREG_BACK = new Map();
for (const [base, [past, part]] of Object.entries(IRREGULAR)) {
  IRREG_BACK.set(past, base);
  IRREG_BACK.set(part, base);
}
/** Stem that folds irregular forms (grew, grown -> grow) so "The plant grew" matches "it is growing". */
export const norm = (w) => {
  const l = String(w).toLowerCase();
  return stem(IRREG_BACK.get(l) || l);
};
export const isContent = (t) => !isStop(t.lower) && t.lower.length > 2;
export const sameStem = (a, b) =>
  a === b || (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a)));
export const spanOf = (t) => ({ start: t.start, end: t.end, text: t.text });

/** Spans of one cue (word, phrase, number or symbol) in the learner's text. */
export function termHits(text, toks, term) {
  const t = String(term).trim();
  if (!t) return [];
  if (!/[\p{L}\p{N}]/u.test(t)) {
    const out = [];
    for (let i = text.indexOf(t); i >= 0; i = text.indexOf(t, i + 1))
      out.push({ start: i, end: i + t.length, text: t });
    return out;
  }
  if (/[\s-]/.test(t) || /\d/.test(t)) return findPhrase(text, t);
  const low = t.toLowerCase();
  const n = norm(low);
  return toks
    .filter(
      (k) =>
        norm(k.lower) === n ||
        (low.length >= 3 && k.lower.startsWith(low) && k.lower.length - low.length <= 3),
    )
    .map(spanOf);
}

// ── connectors ───────────────────────────────────────────────────────────────
// CONNECTORS (lexicon.js) is the shared list; these add the forms a learner writes that the list does not carry.
export const EXTRA = {
  cause: [
    "so",
    "and so",
    "which led to",
    "led to",
    "leading to",
    "which caused",
    "caused",
    "causing",
    "which resulted in",
    "resulted in",
    "resulting in",
    "because of",
    "as a result of",
    "owing to",
    "which means",
    "thus",
  ],
  sequence: ["after", "until", "when", "as soon as", "and then", "afterwards"],
  addition: ["and", "plus", "too", "as well", "along with"],
  contrast: ["though", "still", "in spite of"],
};
export const CAUSE_AFTER = new Set([
  "because",
  "since",
  "due to",
  "because of",
  "as a result of",
  "thanks to",
  "owing to",
]);
const PARTICIPLE = new Set(["causing", "leading to", "resulting in"]);
const PREP = new Set(["due to", "because of", "as a result of", "thanks to", "owing to", "despite", "in spite of"]);
const COORD = new Set(["and", "but", "so", "or", "yet", "and so", "and then"]);
const TRANSITION = new Set([
  "as a result",
  "consequently",
  "therefore",
  "thus",
  "for this reason",
  "however",
  "in addition",
  "furthermore",
  "moreover",
  "on the other hand",
  "in contrast",
  "nevertheless",
  "also",
  "additionally",
  "besides",
  "instead",
  "afterward",
  "afterwards",
  "after that",
  "then",
  "finally",
  "next",
  "later",
  "meanwhile",
  "this means",
  "even so",
  "still",
]);
const SUB = new Set([
  "because",
  "since",
  "although",
  "though",
  "even though",
  "while",
  "whereas",
  "after",
  "before",
  "until",
  "once",
  "when",
  "so that",
  "if",
  "unless",
  "as soon as",
]);
const VERBAL = new Set(["led to", "leads to", "leads", "results in", "caused", "causes"]);
const NEXT_OK = new Set(
  "it they he she we i you this that these those there the a an its their his her our my your".split(
    " ",
  ),
);

export function structureOf(word) {
  const w = String(word).toLowerCase();
  if (w.startsWith("which")) return "relative";
  if (PARTICIPLE.has(w)) return "participle";
  if (PREP.has(w)) return "prepositional";
  if (COORD.has(w)) return "coordination";
  if (TRANSITION.has(w)) return "transition";
  if (SUB.has(w)) return "subordination";
  if (VERBAL.has(w)) return "verb";
  return "other";
}
export const STRUCTURE_LABEL = {
  coordination: T(
    "Two ideas joined by a linking word (compound sentence)",
    "Dos ideas unidas por una palabra de enlace (oración compuesta)",
  ),
  subordination: T(
    "One idea depends on the other (complex sentence)",
    "Una idea depende de la otra (oración compleja)",
  ),
  relative: T("Extra information added with “which”", "Información extra agregada con “which”"),
  prepositional: T(
    "A phrase that starts with a linking phrase",
    "Una frase que empieza con una frase de enlace",
  ),
  transition: T(
    "Two sentences linked by a transition word",
    "Dos oraciones unidas por una palabra de transición",
  ),
  participle: T("An -ing phrase that tells the result", "Una frase con -ing que dice el resultado"),
  verb: T("A verb links the cause to the effect", "Un verbo une la causa con el efecto"),
  other: T("Ideas linked in one sentence", "Ideas unidas en una oración"),
};

/** Whether a "so" or "since" really links ideas ("so big" and "since Monday" do not). */
function guard(text, h) {
  const w = h.word.toLowerCase();
  const next = tokenize(text.slice(h.end))[0];
  if (w === "so")
    return (
      text.slice(0, h.start).trimEnd().endsWith(",") || Boolean(next && NEXT_OK.has(next.lower))
    );
  if (w === "since")
    return !(
      next &&
      /^(\d|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|then|yesterday|last)/.test(
        next.lower,
      )
    );
  return true;
}

/** Connector hits for one job, longest phrase first, no overlaps: [{ start, end, text, word, job }]. */
export function findConnectors(text, job) {
  const list = [...new Set([...(CONNECTORS[job] || []), ...(EXTRA[job] || [])])].sort(
    (a, b) => b.length - a.length,
  );
  const hits = [];
  for (const word of list) for (const h of findPhrase(text, word)) hits.push({ ...h, word, job });
  hits.sort((a, b) => a.start - b.start || b.end - a.end);
  const out = [];
  for (const h of hits) if (!out.length || h.start >= out[out.length - 1].end) out.push(h);
  return out.filter((h) => guard(text, h));
}
export const connectorJobs = (text) =>
  Object.fromEntries(
    Object.keys({ ...CONNECTORS })
      .map((j) => [j, findConnectors(text, j)])
      .filter(([, v]) => v.length),
  );

// ── clauses around a connector ───────────────────────────────────────────────
export const trimSpan = (text, a, b) => {
  let s = a;
  let e = b;
  while (s < e && /[\s,;:.!?"'()-]/.test(text[s])) s++;
  while (e > s && /[\s,;:.!?"'()-]/.test(text[e - 1])) e--;
  return s < e ? { start: s, end: e, text: text.slice(s, e) } : null;
};
export const hasContent = (span) => Boolean(span) && tokenize(span.text).some(isContent);

/** The text written before and after a connector: { pos: "mid"|"initial"|"transition", first, second }. */
export function clausesAround(text, hit) {
  const sents = sentences(text);
  const si = Math.max(
    0,
    sents.findIndex((s) => hit.start >= s.start && hit.start < s.end),
  );
  const s = sents[si] || { start: 0, end: text.length };
  const before = trimSpan(text, s.start, hit.start);
  const after = trimSpan(text, hit.end, s.end);
  if (before && tokenize(before.text).length)
    return { pos: "mid", first: before, second: after, sentence: si };
  const st = structureOf(hit.word);
  if (st === "subordination" || st === "prepositional") {
    if (!after) return { pos: "initial", first: null, second: null, sentence: si };
    const comma = text.indexOf(",", after.start);
    if (comma >= 0 && comma < after.end)
      return {
        pos: "initial",
        first: trimSpan(text, after.start, comma),
        second: trimSpan(text, comma + 1, s.end),
        sentence: si,
      };
    const toks = tokenize(text.slice(after.start, after.end));
    const k = toks.findIndex((t, i) => i >= 3 && NEXT_OK.has(t.lower));
    if (k > 0) {
      const cut = after.start + toks[k].start;
      return {
        pos: "initial",
        first: trimSpan(text, after.start, cut),
        second: trimSpan(text, cut, s.end),
        sentence: si,
      };
    }
    return { pos: "initial", first: after, second: null, sentence: si };
  }
  const prev = si > 0 ? trimSpan(text, sents[si - 1].start, sents[si - 1].end) : null;
  return { pos: "transition", first: prev, second: after, sentence: si };
}

/** The causal relationship a connector builds: which clause is the cause and which the effect, by position. */
export function relationship(text, hit) {
  const c = clausesAround(text, hit);
  const after = CAUSE_AFTER.has(hit.word);
  let cause;
  let effect;
  if (after && c.pos === "initial") [cause, effect] = [c.first, c.second];
  else if (after) [effect, cause] = [c.first, c.second];
  else [cause, effect] = [c.first, c.second];
  return {
    connector: { word: hit.word, start: hit.start, end: hit.end, text: hit.text },
    structure: structureOf(hit.word),
    pos: c.pos,
    kind: after ? "causeAfter" : "effectAfter",
    cause,
    effect,
    complete: hasContent(cause) && hasContent(effect),
    order:
      c.pos === "transition"
        ? "two-sentences"
        : after && c.pos !== "initial"
          ? "effect-first"
          : "cause-first",
  };
}


// ── connector comparison (swap lab data) ─────────────────────────────────────
const FAMILY = [
  ["because", "since", "due to", "because of", "thanks to", "owing to"],
  ["so", "so that", "and so"],
  ["as a result", "consequently", "therefore", "for this reason", "thus"],
  [
    "which led to",
    "led to",
    "which caused",
    "caused",
    "which resulted in",
    "resulted in",
    "which leads to",
    "leads to",
    "results in",
    "leading to",
    "causing",
    "resulting in",
    "which means",
  ],
];
const familyOf = (w) =>
  FAMILY.find((f) => f.includes(String(w).toLowerCase())) || [String(w).toLowerCase()];

/** Which of the task's altConnectors a sentence uses: { used: { word, family, note }|null, others, prompt, relationship }. */
export function compareConnectors(task, text) {
  const alts = task.altConnectors || [];
  const hits = findConnectors(String(text || ""), "cause");
  const rel = hits.length
    ? relationship(text, hits.find((h) => relationship(text, h).complete) || hits[0])
    : null;
  const detected = rel?.connector.word || null;
  const alt = detected ? alts.find((a) => familyOf(a.word).includes(detected.toLowerCase())) : null;
  const used = detected
    ? {
        word: detected,
        family: alt?.word || detected,
        note: alt?.note || null,
        span: rel.connector,
      }
    : null;
  const others = alts.filter((a) => !alt || a.word !== alt.word);
  const list = others.map((a) => a.word).join(", ");
  const prompt = used
    ? T(
        `You used “${used.word}”. Rewrite the same idea with a different connector${list ? `: ${list}` : ""}.`,
        `Usaste “${used.word}”. Reescribe la misma idea con otro conector${list ? `: ${list}` : ""}.`,
      )
    : T(
        "Add a cause connector first, then try a different one.",
        "Primero agrega un conector de causa y luego prueba con otro.",
      );
  return { used, others, prompt, relationship: rel };
}

const ORDER_WORDS = {
  "effect-first": T(
    "the result comes first, then the reason",
    "primero va el resultado y luego la razón",
  ),
  "cause-first": T(
    "the reason comes first, then the result",
    "primero va la razón y luego el resultado",
  ),
  "two-sentences": T(
    "the reason and the result are in two sentences",
    "la razón y el resultado están en dos oraciones",
  ),
};
const stemSet = (text) =>
  new Set(
    tokenize(text)
      .filter(isContent)
      .map((t) => norm(t.lower)),
  );

/** How meaning and emphasis changed when a learner swapped connectors, taken from the task's own altConnectors notes. */
export function meaningChange(task, fromText, toText) {
  const a = compareConnectors(task, fromText);
  const b = compareConnectors(task, toText);
  const sa = stemSet(fromText);
  const sb = stemSet(toText);
  const shared = [...sa].filter((x) => [...sb].some((y) => sameStem(x, y))).length;
  const keptIdea = sa.size > 0 && shared / sa.size >= 0.5;
  const same = Boolean(a.used && b.used && a.used.family === b.used.family);
  const orderChanged = Boolean(
    a.relationship && b.relationship && a.relationship.order !== b.relationship.order,
  );
  const messages = [];
  if (!b.used)
    messages.push(
      T(
        "Your new sentence has no cause connector. Add one to compare.",
        "Tu oración nueva no tiene un conector de causa. Agrega uno para comparar.",
      ),
    );
  else if (same)
    messages.push(
      T(
        `You used the same kind of connector again (“${b.used.word}”). Choose a different one to see what changes.`,
        `Usaste otra vez el mismo tipo de conector (“${b.used.word}”). Elige uno distinto para ver qué cambia.`,
      ),
    );
  else {
    if (!keptIdea)
      messages.push(
        T(
          "The new sentence tells a different idea. Keep the same cause and effect so you can compare.",
          "La oración nueva cuenta otra idea. Mantén la misma causa y el mismo efecto para comparar.",
        ),
      );
    if (orderChanged) {
      const [p, q] = [ORDER_WORDS[a.relationship.order], ORDER_WORDS[b.relationship.order]];
      messages.push(T(`Before: ${p[0]}. Now: ${q[0]}.`, `Antes: ${p[1]}. Ahora: ${q[1]}.`));
    }
    if (b.used.note) messages.push(T(b.used.note, b.used.note));
  }
  return {
    from: a.used,
    to: b.used,
    same,
    keptIdea,
    orderChanged,
    noteFrom: a.used?.note || null,
    noteTo: b.used?.note || null,
    messages,
  };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const low = (s) => (/^I\b/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
const PREVIEW = {
  because: (c, e) => `${cap(e)} because ${low(c)}.`,
  since: (c, e) => `Since ${low(c)}, ${low(e)}.`,
  so: (c, e) => `${cap(c)}, so ${low(e)}.`,
  "as a result": (c, e) => `${cap(c)}. As a result, ${low(e)}.`,
};

/** Re-order the learner's own cause and effect clauses with another connector (display only). null when it cannot be done honestly. */
export function swapPreview(text, word) {
  const make = PREVIEW[String(word).toLowerCase()];
  const hits = findConnectors(String(text || ""), "cause");
  const rel = hits.map((h) => relationship(text, h)).find((r) => r.complete);
  if (!make || !rel) return null;
  return make(rel.cause.text, rel.effect.text);
}

