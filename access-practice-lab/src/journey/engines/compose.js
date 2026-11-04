// Living Writing (engine key "compose"): pure logic behind the writing studio. No DOM, deterministic, never rewrites the learner.
//
// Everything this module reports is a span of the learner's own draft (overlays), a question a reader might ask, or a
// plain-language note about what a revision changed and why that helps a reader. There is no score and no level.
import { compareDrafts, analyzeResponse } from "../../lang/analyze.js";
import { isStop, sentences, tokenize, wordCount } from "../../lang/text.js";
import { quantityNumbers, quoteAround } from "./converse.js";
import { BOXES, BOX_MOVE, JOB_LABEL, JOB_WHY, MOVE_KIND, WHY } from "./compose-notes.js";

export { BOXES };

const GENRE_KLU = {
  argument: "Argue",
  explanation: "Explain",
  description: "Inform",
  report: "Inform",
  narrative: "Narrate",
};
export const keyUseOf = (task, ctx = {}) =>
  ctx.keyUse || task.keyUse || GENRE_KLU[task.genre] || "Explain";

/** The Key Language Use move a box looks for. "evidence" is the support move when the task explains. */
export const moveForBox = (box, keyUse) =>
  box === "evidence" && keyUse === "Explain" ? "support" : BOX_MOVE[box] || box;
export const starterFor = (boxId) => BOXES[boxId]?.starter || "";

const optionsFor = (task, ctx = {}) => ({
  keyUse: keyUseOf(task, ctx),
  modality: "writing",
  stage: ctx.independent ? "independent" : "supported",
  sourceTerms: task.sourceTerms || [],
  sourceText: bankTexts(task),
  wordBank: task.topicTerms || [],
});
const bankItems = (task) =>
  (task.evidenceBank || []).map((b, i) =>
    typeof b === "string" ? { id: `b${i}`, text: b, kind: "fact" } : b,
  );
const bankTexts = (task) => bankItems(task).map((b) => b.text);

/** Runs of 3+ words (with a content word) that the draft copies from a bank entry. */
function copiedRuns(text, bankText) {
  const a = tokenize(text);
  const b = tokenize(bankText).map((t) => t.lower);
  const out = [];
  for (let i = 0; i < a.length;) {
    let best = 0;
    for (let j = 0; j < b.length; j++) {
      let n = 0;
      while (i + n < a.length && j + n < b.length && a[i + n].lower === b[j + n]) n++;
      best = Math.max(best, n);
    }
    const run = a.slice(i, i + best);
    if (best >= 3 && run.some((t) => !isStop(t.lower))) {
      out.push({
        start: run[0].start,
        end: run.at(-1).end,
        text: text.slice(run[0].start, run.at(-1).end),
      });
      i += best;
    } else i++;
  }
  return out;
}

/** Spans of the learner's own draft that show structure, links, evidence and precise words. */
export function analyze(task, text, ctx = {}) {
  const src = String(text || "");
  const keyUse = keyUseOf(task, ctx);
  const analysis = analyzeResponse(src, optionsFor(task, ctx));
  const overlays = [];
  const add = (kind, label, span, extra = {}) =>
    overlays.push({
      kind,
      label,
      start: span.start,
      end: span.end,
      text: src.slice(span.start, span.end),
      ...extra,
    });
  // bank overlays first: where a span is both a move cue and a copy from the evidence, the more specific label wins
  for (const item of bankItems(task)) {
    const nums = new Set(quantityNumbers(item.text).map((n) => n.value));
    for (const n of quantityNumbers(src))
      if (nums.has(n.value)) add("evidence", "Number from the evidence", n, { bankId: item.id });
    for (const run of copiedRuns(src, item.text))
      add(
        "evidence",
        item.kind === "quote" ? "Words from the quote" : "Words from the evidence",
        run,
        { bankId: item.id },
      );
  }
  for (const m of analysis.purpose.moves)
    if (m.present)
      for (const e of m.evidence) add(MOVE_KIND[m.id] || "claim", m.label, e, { moveId: m.id });
  for (const d of analysis.cohesion.devices)
    add("connector", `Linking word (${JOB_LABEL[d.job]})`, d, { job: d.job });
  for (const w of [...analysis.word.academic, ...analysis.word.domain])
    add("precise", "Precise subject word", w);
  for (const h of analysis.evidence.termHits) add("evidence", "Words from the source", h);
  const seen = new Set();
  const unique = overlays
    .sort((x, y) => x.start - y.start || y.end - x.end)
    .filter(
      (o) =>
        !seen.has(`${o.kind}:${o.start}:${o.end}`) && seen.add(`${o.kind}:${o.start}:${o.end}`),
    );
  const counts = unique.reduce((m, o) => ((m[o.kind] = (m[o.kind] || 0) + 1), m), {});
  return {
    text: src,
    keyUse,
    words: analysis.words,
    analysis,
    moves: analysis.purpose.moves,
    present: analysis.purpose.moves.filter((m) => m.present).map((m) => m.id),
    missing: analysis.purpose.missing,
    overlays: unique,
    counts,
  };
}

const questionFor = (task, move) => task.readerQuestions?.[move.id] || move.ask;

/** The visible structure of the draft: what the plan has and what it does not yet (as questions, never answers). */
export function structureMap(task, analyzed) {
  const keyUse = analyzed.keyUse;
  const boxes = (task.organizer || []).map((id) => {
    const box = BOXES[id] || { label: [id, id], ask: ["What goes here?", "¿Qué va aquí?"] };
    const move = analyzed.moves.find((m) => m.id === moveForBox(id, keyUse));
    const span = move?.present ? move.evidence[0] : null;
    const q = span ? quoteAround(analyzed.text, span.start, span.end) : null;
    return {
      id,
      label: box.label,
      move: move?.id || null,
      present: Boolean(move?.present),
      quote: q?.quote || "",
      truncated: Boolean(q?.truncated),
      span: span ? { start: span.start, end: span.end } : null,
      question: move ? questionFor(task, move) : box.ask[0],
    };
  });
  return {
    genre: task.genre || "",
    shape: boxes.map((b) => b.label[0]).join(" → "),
    boxes,
    present: boxes.filter((b) => b.present).map((b) => b.id),
    notYet: boxes
      .filter((b) => !b.present)
      .map((b) => ({ id: b.id, label: b.label, question: b.question })),
  };
}

/**
 * A simulated reader's next question: the first required missing move not asked yet (else the first missing one),
 * phrased around the learner's own words when there are any. `moveId` is null when no required move is missing.
 */
export function readerQuestion(task, analyzed, { asked = [] } = {}) {
  const missing = analyzed.moves.filter((m) => m.required && !m.present);
  const move = missing.find((m) => !asked.includes(m.id)) || missing[0];
  if (!move)
    return {
      moveId: null,
      question:
        "I can follow each part. Read it once more as a stranger would: which sentence would they need explained?",
      anchor: null,
    };
  const idx = analyzed.moves.indexOf(move);
  const before = analyzed.moves
    .slice(0, idx)
    .filter((m) => m.present && m.evidence.length)
    .at(-1);
  const sents = sentences(analyzed.text);
  const span = before
    ? before.evidence[0]
    : sents[0]
      ? { start: sents[0].start, end: sents[0].end }
      : null;
  const q =
    span && analyzed.text.trim() ? quoteAround(analyzed.text, span.start, span.end, 14) : null;
  const anchor = q ? { quote: q.quote, start: q.start, end: q.end, truncated: q.truncated } : null;
  const lead = anchor ? `You wrote “${anchor.quote}${anchor.truncated ? "…" : ""}”. ` : "";
  return { moveId: move.id, question: `${lead}${questionFor(task, move)}`, anchor };
}

// ── state ─────────────────────────────────────────────────────────────────────
export const init = () => ({
  draft: "",
  versions: [],
  organizer: {},
  readerAsked: [],
  revisedFrom: null,
});
export const setDraft = (state, draft) => ({ ...state, draft: String(draft ?? "") });
export const useBox = (state, boxId) => ({
  ...state,
  organizer: { ...state.organizer, [boxId]: true },
});
export const markReaderAsked = (state, moveId) =>
  moveId && !state.readerAsked.includes(moveId)
    ? { ...state, readerAsked: [...state.readerAsked, moveId] }
    : state;

const stamp = (at) => at || new Date().toISOString();
/** Keep the current draft as a saved version (once) without changing it. */
export function snapshot(state, label = "first draft", at) {
  const last = state.versions.at(-1);
  if (!state.draft.trim() || last?.text === state.draft) return state;
  return { ...state, versions: [...state.versions, { text: state.draft, at: stamp(at), label }] };
}
/** Store a revision: the draft before it is kept as a version, the new text becomes the draft and the newest version. */
export function strengthen(state, newText, { label = "revision", at } = {}) {
  const text = String(newText ?? "");
  const kept = snapshot(state, "first draft", at);
  const from = kept.versions.length ? kept.versions.length - 1 : null;
  if (kept.versions.at(-1)?.text === text) return { ...kept, draft: text };
  return {
    ...kept,
    draft: text,
    versions: [...kept.versions, { text, at: stamp(at), label }],
    revisedFrom: from,
  };
}

// ── comparing two drafts ──────────────────────────────────────────────────────
/** Character spans of the words that were added (in `after`) and removed (in `before`). Word-level LCS, deterministic. */
export function changedSpans(before, after) {
  const words = (s) =>
    [...String(s || "").matchAll(/\S+/g)].map((m) => ({
      text: m[0],
      start: m.index,
      end: m.index + m[0].length,
    }));
  const a = words(before);
  const b = words(after);
  const dp = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] =
        a[i].text === b[j].text ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const removed = [];
  const added = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i].text === b[j].text) (i++, j++);
    else if (dp[i + 1][j] >= dp[i][j + 1]) removed.push(a[i++]);
    else added.push(b[j++]);
  }
  while (i < a.length) removed.push(a[i++]);
  while (j < b.length) added.push(b[j++]);
  const merge = (list, src) =>
    list
      .reduce((out, w) => {
        const last = out.at(-1);
        if (last && /^\s*$/.test(src.slice(last.end, w.start))) last.end = w.end;
        else out.push({ start: w.start, end: w.end });
        return out;
      }, [])
      .map((s) => ({ ...s, text: src.slice(s.start, s.end) }));
  return { before: merge(removed, String(before || "")), after: merge(added, String(after || "")) };
}

const note = (kind, id, quote, en, es, extra = {}) => ({
  kind,
  id,
  quote,
  en,
  es,
  text: en,
  ...extra,
});
const overlaps = (o, spans) => spans.some((s) => o.start < s.end && o.end > s.start);

/**
 * What changed between two drafts and why it helps a reader. Data-driven: a line appears only for a move, linking word,
 * piece of evidence or precise word that is in `after` and was not in `before`. Quotes are the learner's own words.
 * Wraps compareDrafts (counts) and adds `reasons`, `changed` spans and the two analyses. No score.
 */
export function compareVersions(before, after, { task, keyUse, independent = false } = {}) {
  const ctx = { keyUse, independent };
  const A = analyze(task, before, ctx);
  const B = analyze(task, after, ctx);
  const base = compareDrafts(before, after, optionsFor(task, ctx));
  const reasons = [];
  const taken = [];
  for (const m of B.moves) {
    if (!m.present || A.present.includes(m.id) || !WHY[m.id]) continue;
    const e = m.evidence[0];
    const q = quoteAround(after, e.start, e.end, m.id === "phenomenon" ? 18 : 9, true);
    const [does, why] = WHY[m.id];
    reasons.push(
      note(
        "move",
        m.id,
        q.quote,
        `New: “${q.quote}”. Your draft now ${does[0]}. This helps because a reader ${why[0]}.`,
        `Nuevo: “${q.quote}”. Tu borrador ahora ${does[1]}. Esto ayuda porque el lector ${why[1]}.`,
        { start: q.start, end: q.end },
      ),
    );
    taken.push({ start: q.start, end: q.end });
  }
  const jobsBefore = new Set(A.analysis.cohesion.jobs);
  for (const d of B.analysis.cohesion.devices) {
    if (
      jobsBefore.has(d.job) ||
      overlaps(d, taken) ||
      reasons.some((r) => r.id === `link:${d.job}`)
    )
      continue;
    const q = quoteAround(after, d.start, d.end);
    const [does, why] = JOB_WHY[d.job];
    reasons.push(
      note(
        "connector",
        `link:${d.job}`,
        q.quote,
        `New linking word “${d.text}”: “${q.quote}”. It ${does[0]}. This helps because a reader ${why[0]}.`,
        `Nueva palabra de enlace «${d.text}»: “${q.quote}”. ${does[1].replace(/^./, (c) => c.toUpperCase())}. Esto ayuda porque el lector ${why[1]}.`,
      ),
    );
  }
  const evidenceBefore = new Set(
    A.overlays.filter((o) => o.kind === "evidence").map((o) => o.text.toLowerCase()),
  );
  const freshEvidence = B.overlays
    .filter(
      (o) =>
        o.kind === "evidence" && !evidenceBefore.has(o.text.toLowerCase()) && !overlaps(o, taken),
    )
    .slice(0, 2);
  for (const o of freshEvidence) {
    const q = quoteAround(after, o.start, o.end);
    reasons.push(
      note(
        "evidence",
        `evidence:${o.start}`,
        q.quote,
        `You brought in “${o.text}”: “${q.quote}”. This helps because a reader can check your idea against something real.`,
        `Incluiste «${o.text}»: “${q.quote}”. Esto ayuda porque el lector puede comprobar tu idea con algo real.`,
      ),
    );
  }
  const wordsBefore = new Set(
    A.overlays.filter((o) => o.kind === "precise").map((o) => o.text.toLowerCase()),
  );
  const precise = [
    ...new Set(
      B.overlays
        .filter((o) => o.kind === "precise" && !wordsBefore.has(o.text.toLowerCase()))
        .map((o) => o.text.toLowerCase()),
    ),
  ].slice(0, 3);
  if (precise.length) {
    const list = precise.map((w) => `“${w}”`).join(", ");
    reasons.push(
      note(
        "words",
        "words",
        precise[0],
        `New precise words: ${list}. Exact words help because a reader can picture your idea.`,
        `Palabras precisas nuevas: ${list}. Las palabras exactas ayudan porque el lector puede imaginar tu idea.`,
      ),
    );
  }
  for (const m of A.moves.filter((x) => x.present && !B.present.includes(x.id)))
    reasons.push(
      note(
        "check",
        `lost:${m.id}`,
        "",
        `Your new draft no longer shows “${m.label.toLowerCase()}”. Is it still there?`,
        `Tu nuevo borrador ya no muestra «${m.label.toLowerCase()}». ¿Sigue ahí?`,
      ),
    );
  const unchanged =
    before === after ||
    (wordCount(before) === wordCount(after) && String(before).trim() === String(after).trim());
  return {
    ...base,
    beforeView: A,
    afterView: B,
    reasons,
    changed: changedSpans(before, after),
    unchanged,
  };
}

/** Enough words in the draft. `needWords` is how many more would reach the minimum (0 when met). */
export function doneCriteria(task, state) {
  const words = wordCount(state?.draft || "");
  const minWords = task.minWords || 0;
  return {
    ok: words >= minWords && words > 0,
    words,
    minWords,
    needWords: Math.max(0, minWords - words),
  };
}

const SUPPORT_KEYS = { frames: "frames", evidence: "bank", structure: "coach", reader: "coach" };
const supportFlags = (supports) =>
  Array.isArray(supports)
    ? Object.fromEntries(supports.map((id) => [SUPPORT_KEYS[id] || id, true]))
    : supports || {};

/** The partial entry for the evidence ledger. Counts and flags only. kind: first | revision | transfer. */
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
  const a = analysis || analyze(task, state.draft, { keyUse, independent }).analysis;
  const flags = supportFlags(supports);
  const used = Object.values(flags).some(Boolean);
  return {
    src: "writing",
    task: `${missionId}.${step}`,
    band,
    domain: "Writing",
    use: keyUse || keyUseOf(task),
    stage: independent && !used ? "independent" : "supported",
    kind: step === "show" ? "transfer" : state.versions.length > 1 ? "revision" : "first",
    supports: flags,
    m: a.ledger,
  };
}

