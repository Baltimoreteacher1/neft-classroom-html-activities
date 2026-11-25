// Review workflow rules: the single definition of every limit and shape the review API, its tests and the
// Studio queue agree on. Browser safe, dependency free apart from the schema constants.
import { DIMENSIONS, REVIEW_STATES, REVIEWER_ROLES } from "./v2.mjs";

export { DIMENSIONS, REVIEW_STATES, REVIEWER_ROLES };

/** Dimension names as stored: the five fixed ones plus "translation" (which also carries a language). */
export const EVENT_DIMENSIONS = Object.freeze([...DIMENSIONS, "translation"]);
export const EVENT_KINDS = Object.freeze(["decide", "bulk"]);

export const COMMENT_MAX = 500;
export const REVIEWER_NAME_MAX = 80;
export const LANG_RE = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/;
/** Block ids: "<unit>-l01" for a lesson, "<unit>:studio" for a unit studio. */
export const BLOCK_ID_RE = /^g(?:k|[1-8])-(?:ela|math|sci|ss)-u\d{1,2}(?:-l\d{2}|:studio)$/;
export const UNIT_ID_RE = /^g(?:k|[1-8])-(?:ela|math|sci|ss)-u\d{1,2}$/;

/** More than this many items in one bulk approval needs a confirmed random sample. */
export const BULK_SAMPLE_THRESHOLD = 10;
export const BULK_SAMPLE_SIZE = 3;
export const BULK_MAX_ITEMS = 100;
/** A sample token is good for this long (milliseconds). */
export const SAMPLE_TTL_MS = 30 * 60 * 1000;

/** A reviewer name that names a model or tool, not a person. No model can approve. */
export const MODEL_NAME_RE =
  /\b(?:claude|gpt|chatgpt|gemini|copilot|llama|mistral|codex|anthropic|openai|llm|bot|robot|assistant|auto(?:mated|matic)?|model|ai)\b/i;
export const NON_HUMAN_ACTORS = Object.freeze([
  "model",
  "bot",
  "ai",
  "agent",
  "system",
  "tool",
  "automation",
]);

/** States a decision may move a dimension to. "draft" is only ever the starting point. */
export const DECIDABLE_STATES = Object.freeze([
  "in_review",
  "reviewed",
  "needs_changes",
  "retired",
]);
/** Moving to these states needs a written reason in the comment. */
export const COMMENT_REQUIRED_STATES = Object.freeze(["needs_changes", "retired"]);

export const RELEASE_ID_RE = /^content-\d{4}\.\d{1,2}\.\d{1,4}$/;
export const VERIFIER_NAME_RE = /^[a-z0-9][a-z0-9:_.-]{0,59}$/;
export const VERIFIERS_MAX = 30;

/** Roll a block's required dimensions up into the one badge a card shows. */
export const BADGE_STATES = Object.freeze(["draft", "in_review", "reviewed", "retired"]);
export const BADGE_LABEL = Object.freeze({
  draft: "Draft",
  in_review: "In review",
  reviewed: "Reviewed",
  retired: "Retired",
});
