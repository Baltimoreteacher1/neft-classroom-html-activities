// Evidence Notebook: sentences and data points a learner pins from a source and tags as a claim, evidence
// or an example, plus the multi-source synthesis matrix and its criterion feedback.
//
// Rules this file keeps:
//  * Local only. The key sits OUTSIDE the `accessPracticeLab:v1:` progress prefix (like listening notes), so
//    neither a progress code nor a Save/Resume backup carries it. Nothing here touches the network.
//  * Pins hold source text only (a span and where it came from), never anything about the learner.
//  * Safe on corrupt, missing or blocked storage: a bad value reads as an empty notebook; a failed write keeps
//    the pins on screen for this visit (the storage wrapper's tab fallback).
//  * Synthesis feedback is a list of criteria, each met or not yet, built only from spans of the learner's own
//    text (analyze.js conventions). There is no score, level or count of criteria met.
import { analyzeResponse } from "./analyze.js";
import { CONNECTORS } from "./lexicon.js";
import { contentStems, findPhrase, numbersIn, sentences, stem, tokenize } from "./text.js";

export const NOTEBOOK_KEY = "accessPracticeLab:evidenceNotebook:v1";
export const NOTEBOOK_VERSION = 1;
export const MAX_ITEMS = 200;
const MAX_TEXT = 600;
const MAX_SYNTH = 4000;

export const TAGS = [
  { id: "claim", label: "Claim", hint: "the main point a source makes" },
  { id: "evidence", label: "Evidence", hint: "a fact or number that proves a point" },
  { id: "example", label: "Example", hint: "one specific case that shows the idea" },
];
const TAG_IDS = new Set(TAGS.map((t) => t.id));
export const tagLabel = (id) => TAGS.find((t) => t.id === id)?.label || "Evidence";

/** Matrix cells for a synthesis pair. */
export const CELLS = [
  { id: "agree", label: "Both sources agree" },
  { id: "text", label: "Only the text adds" },
  { id: "data", label: "Only the data adds" },
];
const CELL_IDS = new Set(CELLS.map((c) => c.id));

/** The same sentence split the reading passage uses, so a sentence index always names the same words. */
export const splitSentences = (para) =>
  String(para || "")
    .split(/(?<=[.?!])\s+/)
    .filter((s) => s.trim().length > 0);
/** Every sentence of a passage, in order, with its paragraph. Index = the passage's global sentence index. */
export const passageSentences = (paragraphs) =>
  (Array.isArray(paragraphs) ? paragraphs : paragraphs ? [paragraphs] : []).flatMap((p, para) =>
    splitSentences(p).map((text) => ({ text, para })),
  );

/** Data points of a chart or table as readable, pinnable text. */
export function dataPoints(chart, table) {
  const out = [];
  for (const c of Array.isArray(chart) ? chart : chart ? [chart] : [])
    for (const d of c.data || [])
      out.push(
        `${c.title ? `${c.title}: ` : ""}${d.label} — ${d.value}${c.unit ? ` ${c.unit}` : ""}`,
      );
  if (table?.rows)
    for (const r of table.rows)
      out.push(
        `${table.caption ? `${table.caption}: ` : ""}${r.map((v, i) => (table.headers?.[i] ? `${table.headers[i]} ${v}` : v)).join("; ")}`,
      );
  return out;
}

const empty = () => ({ v: NOTEBOOK_VERSION, items: [], synth: {} });
const clip = (s, n) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, n);
/** Deterministic id (FNV-1a) so the same pin from the same source is the same item. */
function hashId(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  return `p${h.toString(36)}`;
}

function cleanItem(x) {
  if (!x || typeof x !== "object") return null;
  const text = clip(x.text, MAX_TEXT);
  const sourceId = clip(x.source?.id, 120);
  if (!text || !sourceId || !TAG_IDS.has(x.tag)) return null;
  return {
    id: typeof x.id === "string" && x.id ? x.id.slice(0, 40) : hashId(`${sourceId}|${text}`),
    tag: x.tag,
    text,
    source: {
      id: sourceId,
      kind: ["activity", "passage", "data"].includes(x.source.kind) ? x.source.kind : "passage",
      title: clip(x.source.title, 160),
    },
    ...(CELL_IDS.has(x.cell) ? { cell: x.cell } : {}),
    ...(typeof x.pair === "string" ? { pair: x.pair.slice(0, 80) } : {}),
  };
}

/** Read the notebook. Anything unreadable becomes an empty notebook; bad items are dropped, good ones kept. */
export function loadNotebook(store) {
  let parsed = null;
  try {
    const raw = store?.get(NOTEBOOK_KEY);
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }
  const nb = empty();
  if (!parsed || typeof parsed !== "object" || parsed.v !== NOTEBOOK_VERSION) return nb;
  const seen = new Set();
  for (const x of Array.isArray(parsed.items) ? parsed.items : []) {
    const item = cleanItem(x);
    if (item && !seen.has(item.id) && nb.items.length < MAX_ITEMS)
      (seen.add(item.id), nb.items.push(item));
  }
  if (parsed.synth && typeof parsed.synth === "object")
    for (const [k, v] of Object.entries(parsed.synth))
      if (typeof v === "string") nb.synth[k.slice(0, 80)] = v.slice(0, MAX_SYNTH);
  return nb;
}

export function saveNotebook(store, nb) {
  try {
    if (!nb.items.length && !Object.values(nb.synth).some((v) => v.trim()))
      store?.remove(NOTEBOOK_KEY);
    else store?.set(NOTEBOOK_KEY, JSON.stringify(nb));
  } catch {
    /* storage unavailable: the notebook stays on screen for this visit */
  }
  return nb;
}

/**
 * Pin a span. The same text from the same source is one item: pinning it again with another tag re-tags it.
 * @returns {{ notebook, item, status: "added"|"retagged"|"unchanged"|"full"|"invalid" }}
 */
export function pinItem(store, { tag, text, source, pair } = {}) {
  const nb = loadNotebook(store);
  const item = cleanItem({ tag, text, source, pair });
  if (!item) return { notebook: nb, item: null, status: "invalid" };
  const existing = nb.items.find((x) => x.id === item.id);
  if (existing) {
    if (existing.tag === item.tag) return { notebook: nb, item: existing, status: "unchanged" };
    existing.tag = item.tag;
    return { notebook: saveNotebook(store, nb), item: existing, status: "retagged" };
  }
  if (nb.items.length >= MAX_ITEMS) return { notebook: nb, item: null, status: "full" };
  nb.items.push(item);
  return { notebook: saveNotebook(store, nb), item, status: "added" };
}

export function removeItem(store, id) {
  const nb = loadNotebook(store);
  const item = nb.items.find((x) => x.id === id) || null;
  nb.items = nb.items.filter((x) => x.id !== id);
  return { notebook: saveNotebook(store, nb), item };
}

/** Put a pin in a matrix cell (or take it out with cell = null). */
export function placeItem(store, id, cell) {
  const nb = loadNotebook(store);
  const item = nb.items.find((x) => x.id === id);
  if (item) {
    if (CELL_IDS.has(cell) && item.cell !== cell) item.cell = cell;
    else delete item.cell;
    saveNotebook(store, nb);
  }
  return { notebook: nb, item: item || null };
}

export function saveSynthesis(store, pairId, text) {
  const nb = loadNotebook(store);
  nb.synth[String(pairId).slice(0, 80)] = String(text ?? "").slice(0, MAX_SYNTH);
  return saveNotebook(store, nb);
}

export function clearNotebook(store) {
  try {
    store?.remove(NOTEBOOK_KEY);
  } catch {
    /* nothing to clear */
  }
  return empty();
}

export const itemsFrom = (nb, sourceIds) => {
  const ids = new Set(Array.isArray(sourceIds) ? sourceIds : [sourceIds]);
  return nb.items.filter((x) => ids.has(x.source.id));
};
/** Sentence index → tag for one passage, so the passage can show what is already pinned. */
export function pinnedIndex(nb, sourceId, list) {
  const out = new Map();
  for (const x of itemsFrom(nb, sourceId)) {
    const i = list.findIndex((s) => clip(s, MAX_TEXT) === x.text);
    if (i >= 0) out.set(i, x.tag);
  }
  return out;
}

// ── synthesis ────────────────────────────────────────────────────────────────

/**
 * Two complementary sources from authored content: an informational passage and a chart about the same topic.
 * `text`/`data` point at an activity (passage + chart in one Reading activity) or at a mission's named sources.
 */
export const SYNTHESIS_PAIRS = [
  {
    id: "syn-monarchs",
    band: "3-5",
    from: { kind: "activity", id: "g35-r-c-monarchs" },
    question: "How did the number of monarchs in the garden change, and why did it change?",
  },
  {
    id: "syn-power-down",
    band: "3-5",
    from: { kind: "activity", id: "g35-r-c-power-down" },
    question: "Did the Lights Out, Power Down campaign work? How do you know?",
  },
  {
    id: "syn-watershed",
    band: "6-8",
    from: { kind: "mission", id: "watershed-mystery", text: "report", data: "oxygen" },
    question: "Which station is most likely the hypoxic zone, and what caused it?",
  },
  {
    id: "syn-lunch-waste",
    band: "6-8",
    from: { kind: "activity", id: "68c-r-lunch-waste-chart" },
    question: "Which plan would cut the most waste, and why?",
  },
];
export const pairsForBand = (band) => SYNTHESIS_PAIRS.filter((p) => p.band === band);
/** Source ids for a pair's two sources (pins are filed under these). */
export const pairSourceIds = (pair) => ({ text: `${pair.id}:text`, data: `${pair.id}:data` });

const TEXT_NAMES = [
  "the passage",
  "the text",
  "the article",
  "the report",
  "the author",
  "the story",
  "the writer",
  "it says",
  "reading",
];
const DATA_NAMES = [
  "the chart",
  "the graph",
  "the bar graph",
  "the bar chart",
  "the table",
  "the data",
  "the numbers",
  "the survey",
  "the results",
  "chart",
  "graph",
];
const LINKS = [
  ...CONNECTORS.addition,
  ...CONNECTORS.contrast,
  ...CONNECTORS.cause,
  "both",
  "together",
  "agree",
  "agrees",
  "matches",
  "match",
  "also shows",
  "adds",
  "supports",
  "confirms",
];

const spansOf = (text, phrases) => {
  const out = [];
  for (const p of phrases)
    for (const h of findPhrase(text, p))
      if (!out.some((o) => h.start < o.end && h.end > o.start)) out.push(h);
  return out.sort((a, b) => a.start - b.start);
};

/** Where the learner's text uses a pinned item: a shared number, or 3+ of its content words in one sentence. */
export function citedSpans(text, pinText) {
  const pinNums = new Set(numbersIn(pinText).map((n) => n.value.replace(/%$/, "")));
  const nums = numbersIn(text).filter((n) => pinNums.has(n.value.replace(/%$/, "")));
  if (nums.length) return nums.map(({ start, end, text: t }) => ({ start, end, text: t }));
  const pinStems = new Set(contentStems(pinText));
  for (const s of sentences(text)) {
    const hits = tokenize(s.text).filter((t) => t.lower.length > 2 && pinStems.has(stem(t.lower)));
    if (new Set(hits.map((t) => stem(t.lower))).size >= 3)
      return hits.map((t) => ({ start: s.start + t.start, end: s.start + t.end, text: t.text }));
  }
  return [];
}

/**
 * Criterion-specific feedback for a synthesis. Every "met" criterion carries the learner's spans that met it;
 * every "not yet" carries a question, never a model answer.
 * @param {string} text the learner's synthesis
 * @param {{ pins: Array<{text:string, source:{id:string}}>, textId:string, dataId:string, sourceText:string[] }} ctx
 */
export function synthesisFeedback(text, { pins = [], textId, dataId, sourceText = [] } = {}) {
  const src = String(text || "");
  const words = tokenize(src).length;
  if (!words) return { words: 0, criteria: [] };
  const cites = pins
    .map((p) => ({ pin: p, spans: citedSpans(src, p.text) }))
    .filter((c) => c.spans.length);
  const fromText = cites.filter((c) => c.pin.source.id === textId);
  const fromData = cites.filter((c) => c.pin.source.id === dataId);
  const textNames = spansOf(src, TEXT_NAMES);
  const dataNames = spansOf(src, DATA_NAMES);
  const links = spansOf(src, LINKS);
  const a = analyzeResponse(src, { keyUse: "Explain", sourceText, stage: "supported" });
  const outside = a.evidence.numbersOutsideSource;
  const nums = numbersIn(src).map(({ start, end, text: t }) => ({ start, end, text: t }));
  const crit = (id, label, met, spans, ask) => ({
    id,
    label,
    met,
    spans: met ? spans.slice(0, 4) : [],
    ask: met ? "" : ask,
  });
  return {
    words,
    criteria: [
      crit(
        "cites-pin",
        "Uses a pinned item as evidence",
        cites.length > 0,
        cites.flatMap((c) => c.spans),
        pins.length
          ? "Which pinned sentence or number proves your point? Put its exact words or number in your synthesis."
          : "Pin at least one sentence or data point first, then use its words or number.",
      ),
      crit(
        "both-sources",
        "Uses evidence from both sources",
        fromText.length > 0 && fromData.length > 0,
        [...(fromText[0]?.spans || []), ...(fromData[0]?.spans || [])],
        fromText.length
          ? "You used the text. Which number or label from the chart adds to it?"
          : fromData.length
            ? "You used the chart. Which sentence from the text explains the numbers?"
            : "Choose one pinned item from the text and one from the chart.",
      ),
      crit(
        "names-sources",
        "Names both sources",
        textNames.length > 0 && dataNames.length > 0,
        [...textNames, ...dataNames],
        textNames.length
          ? "Tell the reader where the numbers come from: the chart, the graph or the data."
          : dataNames.length
            ? "Tell the reader where the explanation comes from: the text, the passage or the report."
            : "Name each source, for example the text and the chart.",
      ),
      crit(
        "connects",
        "Connects the two sources",
        links.length > 0 &&
          (fromText.length > 0 || fromData.length > 0 || textNames.length + dataNames.length > 1),
        links,
        "How do the sources fit together? Do they agree, or does one add a detail the other leaves out? Use a linking word such as both, also, because or however.",
      ),
      // Only judged when the synthesis states a number: no numbers is not "every number matches".
      ...(nums.length
        ? [
            crit(
              "numbers-match",
              "Every number matches a source",
              outside.length === 0,
              nums,
              `Check ${outside[0]?.text ?? "a number"} against the sources. Is it copied exactly, or did you calculate it?`,
            ),
          ]
        : []),
    ],
  };
}
