// Language Time Machine — what changed between an earlier and a later piece of the learner's own language.
// The comparison itself comes from the Language Intelligence Engine (`compareWork` in src/intel/engine.js, passed in
// by the view); when it is not available the local comparer below does the same job from src/lang/analyze.js.
// Either way every statement passes the same guard before a learner or teacher reads it.
//
// Rules this module keeps:
//  * Every statement carries a quote that is a verbatim part of the earlier or the later text. No quote, no statement.
//  * Length is never growth: a statement about longer, shorter or how many words is dropped, and the page says so.
//  * Speaking is compared by its words only. Nothing here mentions accent, speed, pace or pauses.
//  * No score, level, percentage or label. A statement names what is on the page.
import { analyzeResponse } from "../lang/analyze.js";
import { sentences, stem } from "../lang/text.js";

/** The four things a change can be about. Engine statements that name none of them are shown as "change". */
export const DIMENSIONS = Object.freeze({
  clarity: ["Clarity", "Claridad"],
  specificity: ["Specific words", "Palabras específicas"],
  organization: ["Organization", "Organización"],
  control: ["Language control", "Control del lenguaje"],
  change: ["Change", "Cambio"],
});

export const LENGTH_WORDING =
  /\b(longer|shorter|lengthier|more words|fewer words|word count|number of words|length|wrote more|said more|más larg\w*|más cort\w*|más palabras|menos palabras|longitud|extens\w+|cantidad de palabras|escribi\w+ más|dij\w+ más)\b/i;
export const SPEECH_WORDING =
  /\b(accent\w*|acento\w*|pronunciation|pronounc\w+|pronunci\w+|speed|fast|faster|slow|slower|slowly|quick\w*|pace|pacing|paus\w+|fluen\w+|fluidez|fluid\w*|rápid\w+|lent\w+|velocidad|ritmo|hesitat\w+|titube\w+|despacio|deprisa)\b/i;

export const LENGTH_NOTE = [
  "Longer is not automatically better. This page never counts how much you wrote or said. It looks at what your words do.",
  "Más largo no es automáticamente mejor. Esta página nunca cuenta cuánto escribiste o dijiste. Mira lo que hacen tus palabras.",
];
export const TRANSCRIPT_NOTE = [
  "These words came from speech recognition, so some may be wrong. Listen to the recording to be sure.",
  "Estas palabras vienen del reconocimiento de voz, así que algunas pueden estar mal. Escucha la grabación para estar seguro.",
];

const has = (text, quote) => Boolean(quote) && String(text).includes(quote);
const sentenceAt = (text, span) =>
  sentences(text).find((s) => span && span.start >= s.start && span.start < s.end)?.text || "";

/** The local comparer: the same shape as the engine's `compareWork`, built from spans of the two texts. */
export function localCompare(before, after, { keyUse = "Explain", domain = "Writing" } = {}) {
  const opts = { keyUse, modality: domain === "Speaking" ? "speaking" : "writing" };
  const x = analyzeResponse(before, opts);
  const y = analyzeResponse(after, opts);
  const changes = [];
  const kept = [];

  // Organization: a kind of linking the earlier text did not use.
  const jobsBefore = new Set(x.cohesion.jobs);
  const link = y.cohesion.devices.find((d) => !jobsBefore.has(d.job));
  if (link)
    changes.push({
      id: `link-${link.job}`,
      dimension: "organization",
      text: [
        `The later response links ideas with “${link.text}”. The earlier response has no link of that kind.`,
        `La respuesta posterior une ideas con “${link.text}”. La respuesta anterior no tiene un enlace de ese tipo.`,
      ],
      beforeQuote: "",
      afterQuote: sentenceAt(after, link),
    });
  const sameLink = y.cohesion.devices.find((d) => jobsBefore.has(d.job));
  const oldLink = sameLink && x.cohesion.devices.find((d) => d.job === sameLink.job);
  if (sameLink && oldLink)
    kept.push({
      id: `kept-link-${sameLink.job}`,
      text: [
        `Both responses link ideas (“${oldLink.text}”, “${sameLink.text}”).`,
        `Las dos respuestas unen ideas (“${oldLink.text}”, “${sameLink.text}”).`,
      ],
      beforeQuote: sentenceAt(before, oldLink),
      afterQuote: sentenceAt(after, sameLink),
    });

  // Clarity: a move of this kind of response that is now on the page.
  for (const m of y.purpose.moves) {
    const was = x.purpose.moves.find((n) => n.id === m.id);
    if (!m.present || !was || was.present || !m.evidence?.[0]) continue;
    changes.push({
      id: `move-${m.id}`,
      dimension: "clarity",
      text: [
        `New in the later response: ${m.label.toLowerCase()}.`,
        `Nuevo en la respuesta posterior (en inglés): ${m.label.toLowerCase()}.`,
      ],
      beforeQuote: "",
      afterQuote: sentenceAt(after, m.evidence[0]),
    });
    break;
  }

  // Specific words: an exact subject word that is new, or a broad word that is gone.
  const precise = (a) => [...a.word.academic, ...a.word.domain];
  const stemsBefore = new Set(precise(x).map((w) => stem(w.text.toLowerCase())));
  const word = precise(y).find((w) => !stemsBefore.has(stem(w.text.toLowerCase())));
  if (word)
    changes.push({
      id: "precise-word",
      dimension: "specificity",
      text: [
        `The later response uses the exact word “${word.text}”.`,
        `La respuesta posterior usa la palabra exacta “${word.text}”.`,
      ],
      beforeQuote: "",
      afterQuote: sentenceAt(after, word),
    });
  const vagueAfter = new Set(y.word.vague.map((v) => v.word));
  const vague = x.word.vague.find((v) => !vagueAfter.has(v.word));
  if (vague)
    changes.push({
      id: "broad-word",
      dimension: "specificity",
      text: [
        `The earlier response used the broad word “${vague.text}”. The later response does not.`,
        `La respuesta anterior usaba la palabra general “${vague.text}”. La respuesta posterior no la usa.`,
      ],
      beforeQuote: sentenceAt(before, vague),
      afterQuote: "",
    });

  // Language control: a pattern that was in the earlier text and is not in the later one; a first joined sentence.
  const high = (a) => a.errors.filter((e) => e.confidence !== "check");
  const idsAfter = new Set(high(y).map((e) => e.id));
  const fixed = high(x).find((e) => !idsAfter.has(e.id) && has(before, e.text));
  if (fixed)
    changes.push({
      id: `pattern-${fixed.id}`,
      dimension: "control",
      text: [
        `The earlier response has this pattern: ${fixed.name}. It does not appear in the later response.`,
        `La respuesta anterior tiene este patrón (en inglés): ${fixed.name}. No aparece en la respuesta posterior.`,
      ],
      beforeQuote: fixed.text,
      afterQuote: "",
    });
  const joined = y.sentenceStats.shapes.find((s) => s.complex);
  if (joined && !x.sentenceStats.shapes.some((s) => s.complex))
    changes.push({
      id: "joined-ideas",
      dimension: "control",
      text: [
        "The later response joins two ideas in one sentence. The earlier response keeps each idea in its own sentence.",
        "La respuesta posterior une dos ideas en una oración. La respuesta anterior deja cada idea en su propia oración.",
      ],
      beforeQuote: x.sentenceStats.shapes[0]?.text || "",
      afterQuote: joined.text,
    });
  return { changes, kept, caution: LENGTH_NOTE };
}

const pairText = (t) =>
  Array.isArray(t)
    ? [String(t[0] || ""), String(t[1] || t[0] || "")]
    : [String(t || ""), String(t || "")];

const DIMENSION_OF = { "language-control": "control", language: "control", sentence: "control", word: "specificity", discourse: "organization" };

/** Keep a statement only when it is grounded in the two texts and says nothing about length (or, for speech, delivery). */
export function guardStatements(list, before, after, { speaking = false } = {}) {
  const out = [];
  for (const c of Array.isArray(list) ? list : []) {
    const text = pairText(c?.text);
    if (!text[0]) continue;
    // The engine's "kept" statements carry one `quote`; it belongs to whichever text contains it.
    const beforeQuote = has(before, c.beforeQuote) ? c.beforeQuote : !c.afterQuote && !has(after, c.quote) && has(before, c.quote) ? c.quote : "";
    const afterQuote = has(after, c.afterQuote) ? c.afterQuote : has(after, c.quote) ? c.quote : "";
    if (!beforeQuote && !afterQuote) continue;
    const said = text.join(" ");
    if (LENGTH_WORDING.test(said)) continue;
    if (speaking && SPEECH_WORDING.test(said)) continue;
    const dim = c.dimension || c.kind;
    out.push({
      id: String(c.id || `c${out.length}`),
      dimension: Object.hasOwn(DIMENSIONS, dim) ? dim : DIMENSION_OF[dim] || "change",
      text,
      beforeQuote,
      afterQuote,
    });
  }
  return out;
}

/**
 * Compare one pair. `compareWork` is the engine's function when the view has it; anything it returns is guarded.
 * @returns {{changes:object[], kept:object[], caution:[string,string], notes:[string,string][], engine:"engine"|"local", comparable:boolean}}
 */
export function comparePair(pair, { compareWork = null } = {}) {
  const before = pair.earlier.text;
  const after = pair.later.text;
  const speaking = pair.kind === "speaking";
  const notes = [];
  if (speaking && [pair.earlier, pair.later].some((x) => x.source === "transcript" && !x.verified))
    notes.push(TRANSCRIPT_NOTE);
  if (!before || !after)
    return {
      changes: [],
      kept: [],
      caution: LENGTH_NOTE,
      notes,
      engine: "local",
      comparable: false,
    };
  const opts = {
    keyUse: pair.keyUse || "Explain",
    domain: pair.domain,
    source: speaking && [pair.earlier, pair.later].some((x) => x.source === "transcript") ? "transcript" : "typed",
    sameTask: pair.reason === "same-task",
  };
  let res = null;
  let engine = "local";
  if (typeof compareWork === "function") {
    try {
      res = compareWork(before, after, opts);
      if (res && Array.isArray(res.changes)) engine = "engine";
      else res = null;
    } catch {
      res = null;
    }
  }
  if (!res) res = localCompare(before, after, opts);
  // The engine may add its own caution (for example that the two versions are the same); it is shown as a note.
  const extra = engine === "engine" && Array.isArray(res.caution) && res.caution[0] ? pairText(res.caution) : null;
  if (extra && !(speaking && SPEECH_WORDING.test(extra.join(" ")))) notes.push(extra);
  return {
    changes: guardStatements(res.changes, before, after, { speaking }),
    kept: guardStatements(res.kept, before, after, { speaking }),
    caution: LENGTH_NOTE,
    notes,
    engine,
    comparable: true,
  };
}

/** Split a text into plain and quoted runs so the page can mark each quote where it sits: [{ text, mark }]. */
export function markQuotes(text, quotes = []) {
  const src = String(text || "");
  const spans = [];
  quotes.forEach((q, n) => {
    const at = q?.quote ? src.indexOf(q.quote) : -1;
    if (at < 0) return;
    if (spans.some((s) => at < s.end && at + q.quote.length > s.start)) return;
    spans.push({ start: at, end: at + q.quote.length, mark: q.id ?? n });
  });
  spans.sort((a, b) => a.start - b.start);
  const out = [];
  let i = 0;
  for (const s of spans) {
    if (s.start > i) out.push({ text: src.slice(i, s.start), mark: null });
    out.push({ text: src.slice(s.start, s.end), mark: s.mark });
    i = s.end;
  }
  if (i < src.length) out.push({ text: src.slice(i), mark: null });
  return out;
}

const SUPPORT_WORDS = {
  frames: ["sentence frames", "marcos de oraciones"],
  bank: ["a word bank", "un banco de palabras"],
  model: ["a model answer", "una respuesta modelo"],
  help: ["help opened", "ayuda abierta"],
  spanish: ["Spanish help", "ayuda en español"],
  coach: ["feedback first", "comentarios antes"],
};

/** The support context in the lab's words: "on my own", "with sentence frames", "a revision after feedback". */
export function supportLabel(ctx) {
  if (ctx?.independent) return ["on my own", "por mi cuenta"];
  const used = (ctx?.used || []).filter((k) => k !== "coach");
  const en = used.map((k) => SUPPORT_WORDS[k]?.[0] || "supports");
  const es = used.map((k) => SUPPORT_WORDS[k]?.[1] || "apoyos");
  const list = (a, and) => [...new Set(a)].join(` ${and} `);
  if (ctx?.stage === "revision")
    return [
      `a revision after feedback (supported)${en.length ? `, with ${list(en, "and")}` : ""}`,
      `una revisión después de los comentarios (con apoyo)${es.length ? `, con ${list(es, "y")}` : ""}`,
    ];
  return en.length
    ? [`with ${list(en, "and")}`, `con ${list(es, "y")}`]
    : ["with supports", "con apoyos"];
}

export const STAGE_LABEL = Object.freeze({
  first: ["First response", "Primera respuesta"],
  revision: ["Revision", "Revisión"],
  transfer: ["New context", "Contexto nuevo"],
});
export const REASON_LABEL = Object.freeze({
  "same-task": ["Same task", "La misma tarea"],
  "same-goal": ["Same goal, new context", "La misma meta, contexto nuevo"],
});
