// Rule-based checks for the three scaffold tools (Sentence Architecture, Evidence Builder, Language
// Upgrade Lab). Pure functions over an item from src/content/scaffold-items.js and the learner's work.
// Feedback names the part that is missing or the card that does not fit; it asks a question and never
// states the answer. Nothing here produces a score or a level: a check passes or names what to fix.
import { EVIDENCE_CONNECTORS, SENTENCE_CONNECTORS } from "../content/scaffold-items.js";

const QUESTION = Object.freeze({
  subject: "Who or what is the sentence about?",
  action: "What is it, or what does it do?",
  detail: "Which piece tells where, when or how?",
  connector: "Which connector does the job this sentence needs?",
  expansion: "Which idea should come after the connector?",
});

const escapeRe = (w) => String(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const hasPhrase = (text, phrase) =>
  new RegExp(`(^|[^a-z'])${escapeRe(phrase.toLowerCase())}($|[^a-z'])`).test(
    String(text).toLowerCase(),
  );
const startsWord = (text, stem) =>
  new RegExp(`(^|[^a-z])${escapeRe(stem.toLowerCase())}`).test(String(text).toLowerCase());
export const countWords = (text) => (String(text).match(/[A-Za-z0-9°']+/g) || []).length;
const lowerFirst = (x) => (x ? x.charAt(0).toLowerCase() + x.slice(1) : x);

/** The piece a slot holds: a tile from the item, or one of the four connector words. */
export function pieceFor(item, id) {
  if (!id) return null;
  if (Object.hasOwn(SENTENCE_CONNECTORS, id)) return { id, role: "connector", text: id };
  return item.tiles.find((x) => x.id === id) || null;
}

/** The sentence the placed pieces make, in slot order, with punctuation for the connector used. */
export function sentenceText(item, placed = {}) {
  let out = "";
  for (const sl of item.slots) {
    const p = pieceFor(item, placed[sl.id]);
    if (!p) continue;
    if (p.role === "connector") {
      out +=
        p.text === "however"
          ? "; however,"
          : p.text === "which" || p.text === "so"
            ? `, ${p.text}`
            : ` ${p.text}`;
    } else out += out ? ` ${p.text}` : p.text;
  }
  out = out.trim();
  return out ? `${out.charAt(0).toUpperCase()}${out.slice(1)}.` : "";
}

/**
 * Check a Sentence Architecture build. `placed` maps slot id → tile id (or connector word).
 * Returns per-slot results and ONE message about the first part to fix, in slot order.
 */
export function checkSentence(item, placed = {}) {
  const results = item.slots.map((sl) => {
    const p = pieceFor(item, placed[sl.id]);
    if (!p)
      return {
        slot: sl.id,
        ok: false,
        state: "empty",
        message: `The "${sl.label}" part is still empty. ${QUESTION[sl.role]}`,
      };
    if (p.role === "off-topic")
      return {
        slot: sl.id,
        ok: false,
        state: "off-topic",
        message: `"${p.text}" does not belong in this sentence. ${p.why}`,
      };
    if (p.role !== sl.role)
      return {
        slot: sl.id,
        ok: false,
        state: "wrong",
        message: `The piece in "${sl.label}" does not fit that part. ${QUESTION[sl.role]}`,
      };
    if (sl.role === "connector" && !item.connectors.includes(p.text)) {
      const need = SENTENCE_CONNECTORS[item.connectors[0]];
      return {
        slot: sl.id,
        ok: false,
        state: "connector",
        message: `"${p.text}" ${SENTENCE_CONNECTORS[p.text]}. This sentence needs a connector that ${need}.`,
      };
    }
    return { slot: sl.id, ok: true, state: "ok", message: "" };
  });
  const first = results.find((r) => !r.ok) || null;
  return {
    ok: !first,
    filled: results.filter((r) => r.state !== "empty").length,
    results,
    message: first ? first.message : "Every part is in place and the connector does the right job.",
    text: sentenceText(item, placed),
  };
}

/** The paragraph the chosen cards and connector make. */
export function evidenceText(item, selected = [], connector = "") {
  const cards = selected.map((id) => item.cards.find((c) => c.id === id)).filter(Boolean);
  if (!cards.length) return item.claim;
  const [first, ...rest] = cards.map((c) => c.text);
  const lead = connector ? `${connector} ${lowerFirst(first)}` : first;
  return [item.claim, lead, ...rest].join(" ");
}

/** Check an Evidence Builder answer: `selected` is the ordered list of card ids, `connector` the chosen phrase. */
export function checkEvidence(item, { selected = [], connector = "" } = {}) {
  const chosen = selected.map((id) => item.cards.find((c) => c.id === id)).filter(Boolean);
  const unsupported = chosen.filter((c) => !c.supports);
  const supporting = chosen.filter((c) => c.supports);
  const missing = Math.max(0, item.need - supporting.length);
  const orderOk =
    !item.ordered ||
    supporting.every((c, i) => i === 0 || (supporting[i - 1].order || 0) < (c.order || 0));
  const connectorOk = item.connectors.includes(connector);
  const messages = [
    ...unsupported.map((c) => `This card does not support the claim: "${c.text}" ${c.why}`),
    ...(missing
      ? [
          `Add ${missing} more card${missing === 1 ? "" : "s"} that ${missing === 1 ? "supports" : "support"} the claim.`,
        ]
      : []),
    ...(!orderOk ? ["Check the order: tell the events in the order they happened."] : []),
    ...(!connector
      ? ["Choose a connector to join the claim and the evidence."]
      : !connectorOk
        ? [
            `"${connector}" ${EVIDENCE_CONNECTORS[connector] || "does not link evidence to a claim"}. Choose a connector that adds support.`,
          ]
        : []),
  ];
  return {
    ok: messages.length === 0,
    unsupported: unsupported.map((c) => c.id),
    supporting: supporting.length,
    missing,
    orderOk,
    connectorOk,
    messages: messages.length
      ? messages
      : ["Every card supports the claim, and the connector adds support."],
    text: evidenceText(item, selected, connector),
  };
}

/** Check a Language Upgrade revision: a detail added, a precise word used (general words gone), two ideas connected. */
export function checkUpgrade(item, revised = "") {
  const text = String(revised).trim();
  const words = countWords(text);
  const base = countWords(item.informal);
  const changed =
    text.toLowerCase().replace(/\W+/g, " ").trim() !==
    item.informal.toLowerCase().replace(/\W+/g, " ").trim();
  const avoidLeft = item.avoid.filter((w) => hasPhrase(text, w));
  const precisionUsed = item.precision.filter((w) => startsWord(text, w));
  const connectorsUsed = item.connectors.filter((w) => hasPhrase(text, w));
  const checks = {
    detail: changed && words >= base + item.minAdded,
    precision: changed && precisionUsed.length > 0 && avoidLeft.length === 0,
    connector: changed && connectorsUsed.length > 0,
  };
  const messages = [];
  if (!changed)
    messages.push("Your revision is the same as the original. Change it to make it more precise.");
  else {
    if (!checks.detail) messages.push("Add a detail: what exactly, where, when, or how much?");
    if (avoidLeft.length)
      messages.push(`"${avoidLeft[0]}" is a general word. Choose a more exact word.`);
    else if (!precisionUsed.length)
      messages.push("Use a precise subject word that names exactly what you mean.");
    if (!checks.connector)
      messages.push("Join two ideas with a connector such as because, so or which.");
  }
  return {
    ok: Object.values(checks).every(Boolean),
    checks,
    words,
    added: Math.max(0, words - base),
    avoidLeft,
    precisionUsed,
    connectorsUsed,
    messages: messages.length
      ? messages
      : ["You added a detail, used a precise word and connected two ideas."],
  };
}
