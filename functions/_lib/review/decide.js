// The review state machine as one pure function. The caller hands in the block the SERVER loaded and
// overlaid with stored review state; the content hash is recomputed from that block's own content here, so
// a hash that travelled through a client is never part of the decision.

import {
  COMMENT_MAX,
  COMMENT_REQUIRED_STATES,
  DECIDABLE_STATES,
  LANG_RE,
  MODEL_NAME_RE,
  NON_HUMAN_ACTORS,
  REVIEWER_NAME_MAX,
  REVIEWER_ROLES,
} from "../../../shared/content-schema/review-rules.js";
import {
  applyReview,
  contentHash,
  DIMENSIONS,
  effectiveState,
  requiredDimensions,
} from "../../../shared/content-schema/v2.mjs";

/** A refusal with a stable code; `status` is the HTTP status the API answers with. */
export class DecisionError extends Error {
  constructor(code, message, status = 422) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/** Reviewer object after checks: { name, role, date, actor:'human' }. `date` is the server's, never the client's. */
export function humanReviewer(input, today) {
  if (!input || typeof input !== "object")
    throw new DecisionError("reviewer-required", "reviewer is required", 400);
  const actor = String(input.actor ?? "").toLowerCase();
  if (NON_HUMAN_ACTORS.includes(actor)) {
    throw new DecisionError(
      "non-human-actor",
      "Only a human can review. Model and bot actors are refused.",
      403,
    );
  }
  if (actor !== "human") {
    throw new DecisionError("actor-required", 'reviewer.actor must be "human"', 400);
  }
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > REVIEWER_NAME_MAX) {
    throw new DecisionError(
      "reviewer-name",
      `reviewer.name is required, up to ${REVIEWER_NAME_MAX} characters`,
      400,
    );
  }
  if (MODEL_NAME_RE.test(name)) {
    throw new DecisionError(
      "non-human-actor",
      "reviewer.name must be a person, not a model or tool",
      403,
    );
  }
  if (!REVIEWER_ROLES.includes(input.role)) {
    throw new DecisionError(
      "reviewer-role",
      `reviewer.role must be one of ${REVIEWER_ROLES.join(", ")}`,
      400,
    );
  }
  return { name, role: input.role, date: today, actor: "human" };
}

/** Which dimension/lang pair a request names, validated against the block. */
export function checkTarget(block, { dimension, lang = null }, subject) {
  if (dimension === "translation") {
    if (!lang || !LANG_RE.test(lang))
      throw new DecisionError("lang-required", "translation reviews name a language", 400);
    if (!block.review.translation?.[lang]) {
      throw new DecisionError(
        "unknown-language",
        `block ${block.id} has no ${lang} translation to review`,
        404,
      );
    }
    return { dimension, lang };
  }
  if (!DIMENSIONS.includes(dimension))
    throw new DecisionError("unknown-dimension", `unknown dimension "${dimension}"`, 400);
  if (lang)
    throw new DecisionError("lang-not-allowed", "lang only applies to translation reviews", 400);
  if (!requiredDimensions(subject).dimensions.includes(dimension)) {
    throw new DecisionError(
      "dimension-not-required",
      `${dimension} is not reviewed for ${subject} content`,
      422,
    );
  }
  return { dimension, lang: null };
}

/**
 * Decide one (block, dimension[, lang]) move. Returns { block, event } or throws DecisionError.
 *   block   the server-loaded block with stored review state overlaid
 *   state   the target state
 *   reviewer  { name, role, actor } from the request (validated by humanReviewer)
 *   today   ISO date string the server stamps on the decision
 */
export async function decide({
  block,
  dimension,
  lang = null,
  state,
  reviewer,
  comment = "",
  subject,
  today,
}) {
  const human = humanReviewer(reviewer, today);
  if (!DECIDABLE_STATES.includes(state)) {
    throw new DecisionError(
      "unknown-state",
      `state must be one of ${DECIDABLE_STATES.join(", ")}`,
      400,
    );
  }
  if (typeof comment !== "string" || comment.length > COMMENT_MAX) {
    throw new DecisionError(
      "comment-too-long",
      `comment is at most ${COMMENT_MAX} characters`,
      400,
    );
  }
  const note = comment.trim();
  if (COMMENT_REQUIRED_STATES.includes(state) && !note) {
    throw new DecisionError(
      "comment-required",
      `a comment is required to move a block to ${state}`,
      400,
    );
  }
  const target = checkTarget(block, { dimension, lang }, subject);

  // The hash the decision binds to is recomputed from the content itself.
  const hash = await contentHash(block.content);
  if (hash !== block.provenance.contentHash) {
    throw new DecisionError("stale-block", "block content does not match its provenance hash", 409);
  }
  const from = effectiveState(
    block,
    target.dimension === "translation" ? null : target.dimension,
    target.lang,
  );
  let next;
  try {
    next = await applyReview(block, {
      dimension: target.dimension,
      lang: target.lang,
      state,
      reviewer: human,
    });
  } catch (err) {
    throw new DecisionError("illegal-transition", err.message.replace(/^.*?(illegal)/, "$1"), 409);
  }
  return {
    block: next,
    event: {
      blockId: block.id,
      dimension: target.dimension,
      lang: target.lang ?? "",
      fromState: from,
      toState: state,
      reviewer: human,
      contentHash: hash,
      snapshot: block.content,
      comment: note,
    },
  };
}

/**
 * Overlay stored review_state rows on a migrated block. A row is a dimension's latest decision; the
 * reviewer list holds that last reviewer (the full history is the review_event log).
 */
export function applyOverlay(block, rows) {
  if (!rows?.length) return block;
  const review = { ...block.review, translation: { ...block.review.translation } };
  for (const r of rows) {
    const dim = {
      state: r.state,
      reviewers: [
        { name: r.reviewer_name, role: r.reviewer_role, date: r.reviewer_date, actor: "human" },
      ],
      reviewedHash: r.reviewed_hash ?? null,
    };
    if (r.dimension === "translation") {
      if (r.lang in review.translation) review.translation[r.lang] = dim;
    } else review[r.dimension] = dim;
  }
  return { ...block, review };
}

/** A block's per-dimension effective states: { pedagogy: "draft", ..., translation: { es: "draft" } }. */
export function effectiveStates(block, subject) {
  const out = {};
  for (const d of requiredDimensions(subject).dimensions) out[d] = effectiveState(block, d);
  const translation = {};
  for (const lang of Object.keys(block.review.translation || {}))
    translation[lang] = effectiveState(block, null, lang);
  if (Object.keys(translation).length) out.translation = translation;
  return out;
}

/** One badge for a block: reviewed only when every required dimension is effectively reviewed. */
export function rollupBadge(states) {
  const all = [
    ...Object.entries(states).flatMap(([k, v]) => (k === "translation" ? Object.values(v) : [v])),
  ];
  if (all.length && all.every((s) => s === "reviewed")) return "reviewed";
  if (all.some((s) => s === "retired")) return "retired";
  if (all.every((s) => s === "draft")) return "draft";
  return "in_review";
}
