// "Verifiably safe" gate for any question the customizer adds or keeps: it must pass the studio's own validation and
// its own answer key must be accepted by the studio's own checker.

import { checkResponse } from "./check.js";
import { keyResponse } from "./differentiate-rigor.js";
import { cleanBlock, normalizeActivity } from "./schema.js";
import { validateActivity } from "./validate.js";

/** Identity of a question for duplicate detection (format, wording, steps, table cells). */
export const dupKey = (q) =>
  [
    q.format,
    q.prompt,
    q.text || "",
    (q.steps || []).map((s) => s.text).join("/"),
    (q.rows || []).map((r) => r.map((c) => c.answer ?? c).join(",")).join("/"),
  ].join("|");

/** True when the (normalized) question's own key is accepted by the checker. Written responses are never auto-graded. */
export const keyChecks = (q) =>
  q.format === "short" || checkResponse(q, keyResponse(q)).status === "correct";

/** A raw question block as a normalized, valid, key-checked question, or null. */
export function safeQuestion(raw) {
  const block = cleanBlock({ ...raw, type: "question" });
  if (!block) return null;
  const probe = normalizeActivity({
    kind: "interactive",
    context: { grade: "6", subject: "x" },
    blocks: [block],
  });
  if (!validateActivity(probe).ok) return null;
  const q = probe.blocks[0];
  return keyChecks(q) ? q : null;
}
