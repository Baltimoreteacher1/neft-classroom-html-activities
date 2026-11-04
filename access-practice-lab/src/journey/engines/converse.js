// Conversation Reality (engine key "converse"): a rule-based practice partner. Pure logic, no DOM, deterministic.
//
// This is NOT generated language. The partner chooses its next line from a short list the mission pack authors
// (task.lines, task.followUps) by reading what the learner actually wrote:
//   1. any valid line of reasoning is recognised (stem match on line.terms; the line with most hits wins);
//   2. the partner echoes a short quote of the learner's own words and asks THAT line's probe when evidence is thin;
//   3. when evidence is present it asks for the first required Key Language Use move the learner has not yet made;
//   4. a reply that is too short or off topic gets a clarification request that never counts as a turn;
//   5. after task.maxTurns substantive turns it closes by naming ONE real strength, quoting the learner. Never a score.
// Speech is never recognised: a speaking learner types or edits what they said, so the engine analyses exactly the
// words the learner confirmed. Accent cannot matter because audio never reaches this module.
import { analyzeResponse } from "../../lang/analyze.js";
import {
  findPhrase,
  isStop,
  numbersIn,
  sentences,
  stem,
  tokenize,
  wordCount,
} from "../../lang/text.js";

const DEFAULT_MAX_TURNS = 3;
const MIN_CONTENT_WORDS = 4;
const MAX_CLARIFIES_IN_A_ROW = 2;
// A number right after one of these words names a thing ("Bed 2"), it is not a measurement.
const LABEL_BEFORE_NUMBER =
  /\b(?:bed|beds|plot|row|group|part|unit|step|table|chart|figure|page|number|no|question|item|grade|class|day|week|chapter)\s*#?\s*$/i;
// Strength wording: `your answer ${label}` reads naturally for every move label in purpose.js.
const STRENGTH_ORDER = [
  "support",
  "evidence",
  "cause",
  "reason",
  "chain",
  "claim",
  "phenomenon",
  "topic",
  "details",
  "counter",
  "sequence",
  "events",
  "orient",
  "restate",
  "organize",
  "close",
  "response",
];

const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const isSpeak = (task) => task?.mode === "speak";
const contentWords = (text) => tokenize(text).filter((t) => !isStop(t.lower) && t.lower.length > 1);

/** The learner's turns, oldest first. */
export const learnerTurns = (state) => (state?.turns || []).filter((t) => t.who === "learner");
export const learnerTexts = (state) => learnerTurns(state).map((t) => t.text);

/** Everything the learner said, one paragraph per turn (paragraph breaks keep sentences from running together). */
export const finalText = (state) => learnerTexts(state).join("\n\n");

/** A short stretch of the learner's own words around a span: the clause that holds it, at most `maxWords` long (`centered` keeps the span in the middle when the clause is cut). */
export function quoteAround(text, start, end, maxWords = 18, centered = false) {
  const src = String(text || "");
  const sent = sentences(src).find((s) => start >= s.start && start < s.end) || {
    start: 0,
    end: src.length,
  };
  let from = sent.start;
  let to = sent.end;
  const body = src.slice(sent.start, sent.end);
  const breaks = [...body.matchAll(/[,;:]|\s[—–-]\s/g)].map((m) => ({
    at: sent.start + m.index,
    len: m[0].length,
  }));
  const before = breaks.filter((b) => b.at < start).at(-1);
  const after = breaks.find((b) => b.at >= end);
  if (before) from = before.at + before.len;
  if (after) to = after.at;
  const words = (a, b) => [...src.slice(a, b).matchAll(/\S+/g)];
  if (words(from, to).length < 4) [from, to] = [sent.start, sent.end];
  const toks = words(from, to).map((m) => ({
    start: from + m.index,
    end: from + m.index + m[0].length,
  }));
  let lo = 0;
  let hi = toks.length - 1;
  if (toks.length > maxWords) {
    const first = Math.max(
      0,
      toks.findIndex((t) => t.end > start),
    );
    const next = toks.findIndex((t) => t.start >= end);
    const last = next < 0 ? toks.length - 1 : Math.max(first, next - 1);
    const spanLen = last - first + 1;
    const keepStart = last < maxWords || (centered && spanLen > maxWords / 2);
    const room = Math.floor((maxWords - spanLen) / 2);
    lo = keepStart && !(centered && spanLen <= maxWords / 2)
      ? 0
      : Math.max(0, Math.min(centered ? first - room : first - 1, toks.length - maxWords));
    hi = Math.min(toks.length - 1, lo + maxWords - 1);
  }
  const a = toks[lo]?.start ?? from;
  const b = toks[hi]?.end ?? to;
  const quote = src
    .slice(a, b)
    .replace(/[\s.,;:]+$/, "")
    .trim();
  return { quote, start: a, end: a + quote.length, truncated: lo > 0 || hi < toks.length - 1 };
}

// ── reading the learner's reply ───────────────────────────────────────────────
function termSpans(text, term) {
  const t = String(term || "").trim();
  if (!t) return [];
  if (/[\s\d-]/.test(t)) return findPhrase(text, t);
  const s = stem(t.toLowerCase());
  return tokenize(text)
    .filter((tok) => stem(tok.lower) === s)
    .map((tok) => ({ start: tok.start, end: tok.end, text: tok.text }));
}

/** Numbers that state a quantity (not "Bed 2"). */
export const quantityNumbers = (text) =>
  numbersIn(text).filter(
    (n) => !LABEL_BEFORE_NUMBER.test(text.slice(Math.max(0, n.start - 12), n.start)),
  );

/** Which authored line does this reply follow? Most distinct term hits wins; ties keep the line already in play, then the earliest mention. */
export function matchLine(task, text, current = null) {
  const scored = (task.lines || [])
    .map((line, order) => {
      const spans = [];
      let hits = 0;
      for (const term of line.terms || []) {
        const found = termSpans(text, term);
        if (found.length) {
          hits += 1;
          spans.push(found[0]);
        }
      }
      return {
        line,
        order,
        hits,
        first: spans.length ? Math.min(...spans.map((s) => s.start)) : Infinity,
        span: spans.sort((a, b) => a.start - b.start)[0] || null,
      };
    })
    .filter((x) => x.hits > 0);
  if (!scored.length) return null;
  scored.sort(
    (a, b) =>
      b.hits - a.hits ||
      (b.line.id === current) - (a.line.id === current) ||
      a.first - b.first ||
      a.order - b.order,
  );
  return scored[0];
}

/** Does this reply carry evidence for the matched line: its evidenceTerms, a source phrase that names a fact, or a quantity? */
export function hasEvidence(task, line, text) {
  if ((line?.evidenceTerms || []).some((t) => termSpans(text, t).length)) return true;
  if ((task.sourceTerms || []).some((t) => /[\s\d]/.test(t) && findPhrase(text, t).length))
    return true;
  return quantityNumbers(text).length > 0;
}

const topicStems = (task) =>
  new Set(
    [
      ...(task.topicTerms || []),
      ...(task.sourceTerms || []),
      ...(task.lines || []).flatMap((l) => l.terms || []),
    ].flatMap((t) => tokenize(t).map((w) => stem(w.lower))),
  );

function clarifyLine(task, text, topic) {
  const own = contentWords(text).find((w) => topic.has(stem(w.lower)));
  const names = own ? [own.text] : (task.topicTerms || []).slice(0, 3);
  const list = names.map((n) => `“${n}”`);
  const about =
    list.length > 1 ? `${list.slice(0, -1).join(", ")}, or ${list.at(-1)}` : list[0] || "your idea";
  return `I want to make sure I understand — can you say more about ${about}?`;
}

/** ONE thing done well, from the analysis, with the learner's own words. Never a score or a level. */
export function pickStrength(task, text, analysis, line) {
  // A bare "2" in "Bed 2" is a label, not data: moves counted only on such numbers are not offered as a strength.
  const real = (s) =>
    !/^\d/.test(s.text) ||
    !LABEL_BEFORE_NUMBER.test(text.slice(Math.max(0, s.start - 12), s.start));
  const moves = analysis.purpose.moves
    .map((m) => ({ ...m, evidence: m.evidence.filter(real) }))
    .filter((m) => m.present && m.evidence.length);
  const ranked = [...moves].sort(
    (a, b) => STRENGTH_ORDER.indexOf(a.id) - STRENGTH_ORDER.indexOf(b.id),
  );
  const move = ranked[0];
  if (move) {
    const span = move.evidence[0];
    const q = quoteAround(text, span.start, span.end);
    return {
      id: move.id,
      quote: q.quote,
      text: `your answer ${lowerFirst(move.label)}: “${q.quote}”`,
    };
  }
  const link = analysis.cohesion.devices[0];
  if (link) {
    const q = quoteAround(text, link.start, link.end);
    return {
      id: "link",
      quote: q.quote,
      text: `you linked your ideas with “${link.text}”: “${q.quote}”`,
    };
  }
  const word = [...analysis.word.academic, ...analysis.word.domain][0];
  if (word) {
    const q = quoteAround(text, word.start, word.end);
    return {
      id: "words",
      quote: q.quote,
      text: `you used a precise subject word, “${word.text}”: “${q.quote}”`,
    };
  }
  const span = line
    ? termSpans(
        text,
        (line.terms || []).find((t) => termSpans(text, t).length),
      )[0]
    : null;
  const first = span
    ? quoteAround(text, span.start, span.end)
    : quoteAround(text, 0, Math.min(text.length, 1));
  return {
    id: "idea",
    quote: first.quote,
    text: `you gave a clear idea to talk about: “${first.quote}”`,
  };
}

// ── state ─────────────────────────────────────────────────────────────────────
/** A new conversation: the partner's opening line and nothing else. */
export function init(task) {
  return {
    turns: [{ who: "partner", text: task.partner?.opening || "", kind: "opening" }],
    matched: null,
    covered: [],
    turnCount: 0,
    ended: false,
    drafts: [],
    clarifies: 0,
    asked: [],
  };
}

const analysisOptions = (task, opts) => ({
  keyUse: opts.keyUse || task.keyUse || "Explain",
  modality: isSpeak(task) ? "speaking" : "writing",
  stage: opts.independent ? "independent" : "supported",
  sourceTerms: task.sourceTerms || [],
  topicTerms: task.topicTerms || [],
  wordBank: task.topicTerms || [],
});

/** Analysis of everything the learner has said (analyzeResponse over finalText). */
export const analyze = (task, state, opts = {}) =>
  analyzeResponse(finalText(state), analysisOptions(task, opts));

/**
 * The partner's answer to one learner reply.
 * @returns {{ state, partnerLine, kind: "ack+probe"|"followUp"|"clarify"|"close", matchedLine: string|null, quote: string, analysis, movesMissing: string[], countsTurn: boolean }}
 *   `analysis` covers the learner's whole conversation so far, including this reply.
 */
export function reply(task, state, text, opts = {}) {
  const cur = state || init(task);
  const clean = String(text ?? "").trim();
  const maxTurns = task.maxTurns || DEFAULT_MAX_TURNS;
  const keyUse = opts.keyUse || task.keyUse || "Explain";
  if (cur.ended || !clean)
    return {
      state: cur,
      partnerLine: "",
      kind: cur.ended ? "close" : "clarify",
      matchedLine: cur.matched,
      quote: "",
      analysis: analyze(task, cur, opts),
      movesMissing: [],
      countsTurn: false,
    };

  const all = [...learnerTexts(cur), clean].join("\n\n");
  const analysis = analyzeResponse(all, analysisOptions(task, opts));
  const hit = matchLine(task, clean, cur.matched);
  const line = hit?.line || null;
  const onTopic =
    Boolean(line) || contentWords(clean).some((w) => topicStems(task).has(stem(w.lower)));
  const unclear = contentWords(clean).length < MIN_CONTENT_WORDS || !onTopic;
  const turnNo = learnerTurns(cur).length;
  const learnerTurn = { who: "learner", text: clean, turn: turnNo };

  // A clarification request is never a penalty and never uses up a turn (after two in a row the next reply counts so nobody is stuck).
  if (unclear && cur.clarifies < MAX_CLARIFIES_IN_A_ROW) {
    const partnerLine = clarifyLine(task, clean, topicStems(task));
    const next = {
      ...cur,
      turns: [
        ...cur.turns,
        { ...learnerTurn, counted: false },
        { who: "partner", text: partnerLine, kind: "clarify" },
      ],
      clarifies: cur.clarifies + 1,
    };
    return {
      state: next,
      partnerLine,
      kind: "clarify",
      matchedLine: cur.matched,
      quote: "",
      analysis,
      movesMissing: analysis.purpose.missing,
      countsTurn: false,
    };
  }

  const turnCount = cur.turnCount + 1;
  const covered = [
    ...new Set([
      ...cur.covered,
      ...analysis.purpose.moves.filter((m) => m.present && m.required).map((m) => m.id),
    ]),
  ];
  const base = { ...cur, matched: line?.id ?? cur.matched, covered, turnCount, clarifies: 0 };
  const span = hit?.span || { start: 0, end: Math.min(clean.length, 1) };
  const q = quoteAround(clean, span.start, span.end, 18);
  const learnerCounted = { ...learnerTurn, counted: true };
  const out = (kind, partnerLine, extra = {}) => ({
    state: {
      ...base,
      ...extra,
      ended: kind === "close",
      turns: [...cur.turns, learnerCounted, { who: "partner", text: partnerLine, kind }],
    },
    partnerLine,
    kind,
    matchedLine: base.matched,
    quote: q.quote,
    analysis,
    movesMissing: analysis.purpose.missing,
    countsTurn: true,
  });

  if (turnCount >= maxTurns) {
    const strength = pickStrength(task, all, analysis, line);
    return {
      ...out(
        "close",
        `Thank you, that helps me explain it. One thing you did well: ${strength.text}.`,
      ),
      strength,
    };
  }

  const ack = line ? `${line.ack} You said “${q.quote}”.` : `I heard “${q.quote}”.`;
  const asked = cur.asked;
  const probeKey = `probe:${line?.id}`;
  if (line && !hasEvidence(task, line, clean) && !asked.includes(probeKey))
    return out("ack+probe", `${ack} ${line.probe}`, { asked: [...asked, probeKey] });

  const missing = analysis.purpose.moves.filter((m) => m.required && !m.present);
  const next = missing.find((m) => !asked.includes(`move:${m.id}`)) || missing[0];
  if (next) {
    const ask = task.followUps?.[next.id] || next.ask;
    return out("followUp", `${ack} ${ask}`, { asked: [...asked, `move:${next.id}`] });
  }
  return out(
    "followUp",
    `${ack} Is there anything a listener would still need to know to follow you?`,
    { asked: [...asked, "move:none"] },
  );
}

/**
 * "Try saying it again": replace the learner's last reply. The conversation is replayed from the start without it (replies are
 * deterministic), then the new text is sent. The replaced text stays in `drafts` so the Growth Mirror can compare both tries.
 */
export function retry(task, state, text, opts = {}) {
  const turns = learnerTurns(state);
  if (!turns.length) return reply(task, state || init(task), text, opts);
  const last = turns.at(-1);
  let s = init(task);
  for (const t of turns.slice(0, -1)) s = reply(task, s, t.text, opts).state;
  const out = reply(task, s, text, opts);
  const drafts = [...(state.drafts || []), { turn: turns.length - 1, text: last.text }];
  return { ...out, state: { ...out.state, drafts }, replaced: last.text };
}

/** Finished exchange AND enough words. `needWords` is how many more words would complete the minimum (0 when met). */
export function doneCriteria(task, state) {
  const words = wordCount(finalText(state));
  const minWords = task.minWords || 0;
  return {
    ok: Boolean(state?.ended) && words >= minWords,
    ended: Boolean(state?.ended),
    words,
    minWords,
    needWords: Math.max(0, minWords - words),
  };
}

const SUPPORT_KEYS = { frames: "frames", evidence: "bank" };
const supportFlags = (supports) => {
  if (Array.isArray(supports))
    return Object.fromEntries(supports.map((id) => [SUPPORT_KEYS[id] || id, true]));
  return supports || {};
};

/** The partial entry for the evidence ledger (`appendEntry`). Counts and flags only, never the learner's words. */
export function ledgerEntry({
  task,
  state,
  missionId,
  step = "communicate",
  band,
  keyUse,
  independent = false,
  supports = [],
  analysis = null,
} = {}) {
  const a = analysis || analyze(task, state, { keyUse, independent });
  const flags = supportFlags(supports);
  const used = Object.values(flags).some(Boolean);
  return {
    src: isSpeak(task) ? "speaking" : "mission",
    task: `${missionId}.${step}`,
    band,
    domain: "Speaking",
    use: keyUse || task.keyUse || "Explain",
    stage: independent && !used ? "independent" : "supported",
    kind: step === "show" ? "transfer" : "first",
    supports: flags,
    m: a.ledger,
  };
}
