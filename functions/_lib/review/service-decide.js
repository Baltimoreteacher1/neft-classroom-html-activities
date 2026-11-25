// Write path: one decision, a sample request and a bulk decision. Orchestrates blocks, overlay, decide() and
// the store. The server loads every block itself and recomputes its hash; request bodies are allow-listed.

import {
  BULK_MAX_ITEMS,
  BULK_SAMPLE_THRESHOLD,
  EVENT_DIMENSIONS,
  LANG_RE,
} from "../../../shared/content-schema/review-rules.js";
import { rejectIfPII } from "../../../shared/privacy/pii.mjs";
import { loadBlock, subjectKey } from "./blocks.js";
import { applyOverlay, DecisionError, decide } from "./decide.js";
import { allowFields } from "./endpoint.js";
import { chooseSample, cryptoRng, issueSampleToken, itemKey, verifySampleToken } from "./sample.js";
import { appendEvents, ChainConflict, individualDecision, stateRows } from "./store.js";

export const todayOf = (now) => new Date(now).toISOString().slice(0, 10);

async function withRetry(fn, attempts = 4) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof ChainConflict) || i >= attempts) {
        if (err instanceof ChainConflict)
          throw new DecisionError("chain-busy", "the review log is busy; try again", 409);
        throw err;
      }
    }
  }
}

/** The server-loaded block with stored review state laid over it, plus its unit. */
async function loadOverlaid(db, blockId) {
  const found = await loadBlock(blockId);
  if (!found) throw new DecisionError("block-not-found", `no block ${blockId}`, 404);
  return { ...found, block: applyOverlay(found.block, await stateRows(db, { blockId })) };
}

function checkComment(comment) {
  if (comment === undefined || comment === "") return null;
  if (typeof comment !== "string")
    throw new DecisionError("comment-invalid", "comment must be text", 400);
  return rejectIfPII(comment, "comment");
}

function checkItem(i, at) {
  if (!i || typeof i !== "object")
    throw new DecisionError("item-invalid", `${at}: item must be an object`, 400);
  allowFields(i, ["blockId", "dimension", "lang"]);
  if (typeof i.blockId !== "string" || !EVENT_DIMENSIONS.includes(i.dimension)) {
    throw new DecisionError(
      "item-invalid",
      `${at}: blockId and a known dimension are required`,
      400,
    );
  }
  if (i.lang !== undefined && i.lang !== null && !LANG_RE.test(i.lang)) {
    throw new DecisionError("item-invalid", `${at}: lang is invalid`, 400);
  }
  return { blockId: i.blockId, dimension: i.dimension, lang: i.lang || "" };
}

export async function decideOne({ db, body, now }) {
  allowFields(body, ["blockId", "dimension", "lang", "state", "comment", "reviewer"]);
  const pii = checkComment(body.comment);
  if (pii) return pii;
  const item = checkItem(
    { blockId: body.blockId, dimension: body.dimension, lang: body.lang },
    "request",
  );
  return withRetry(async () => {
    const { block, unit } = await loadOverlaid(db, item.blockId);
    const { event } = await decide({
      block,
      dimension: item.dimension,
      lang: item.lang || null,
      state: body.state,
      reviewer: body.reviewer,
      comment: body.comment ?? "",
      subject: subjectKey(unit),
      today: todayOf(now),
    });
    const [row] = await appendEvents(db, [event], { now });
    return {
      ok: true,
      event: {
        id: row.id,
        blockId: row.blockId,
        dimension: row.dimension,
        lang: row.lang,
        from: row.fromState,
        to: row.toState,
        contentHash: row.contentHash,
        digest: row.digest,
      },
    };
  });
}

function parseItems(body) {
  if (!Array.isArray(body.items) || body.items.length === 0)
    throw new DecisionError("items-required", "items must be a non-empty array", 400);
  if (body.items.length > BULK_MAX_ITEMS)
    throw new DecisionError("too-many-items", `at most ${BULK_MAX_ITEMS} items per request`, 400);
  const items = body.items.map((i, n) => checkItem(i, `items[${n}]`));
  if (new Set(items.map(itemKey)).size !== items.length)
    throw new DecisionError("items-duplicate", "items must be distinct", 400);
  return items;
}

/** POST /api/review/bulk/sample: the server picks 3 of the items; the reviewer must read them one by one. */
export async function requestSample({ body, secret, now, rng = cryptoRng() }) {
  allowFields(body, ["items", "reviewer"]);
  const items = parseItems(body);
  if (items.length <= BULK_SAMPLE_THRESHOLD) {
    return { ok: true, required: false, threshold: BULK_SAMPLE_THRESHOLD };
  }
  const name = typeof body.reviewer?.name === "string" ? body.reviewer.name.trim() : "";
  if (!name) throw new DecisionError("reviewer-name", "reviewer.name is required", 400);
  const sample = chooseSample(items, rng);
  const { token, payload } = await issueSampleToken({
    secret,
    items,
    sample,
    reviewerName: name,
    now,
  });
  return {
    ok: true,
    required: true,
    threshold: BULK_SAMPLE_THRESHOLD,
    token,
    sample,
    expiresAt: payload.exp,
  };
}

/** POST /api/review/bulk. Atomic: every item moves or none does. */
export async function bulkDecide({ db, body, secret, now }) {
  allowFields(body, ["items", "state", "comment", "reviewer", "sample"]);
  if (!["in_review", "reviewed"].includes(body.state)) {
    throw new DecisionError("unknown-state", "bulk moves to in_review or reviewed", 400);
  }
  const pii = checkComment(body.comment);
  if (pii) return pii;
  const items = parseItems(body);
  const reviewerName = typeof body.reviewer?.name === "string" ? body.reviewer.name.trim() : "";
  const needsSample = body.state === "reviewed" && items.length > BULK_SAMPLE_THRESHOLD;

  return withRetry(async () => {
    const loaded = new Map();
    for (const id of new Set(items.map((i) => i.blockId)))
      loaded.set(id, await loadOverlaid(db, id));

    if (needsSample) {
      allowFields(body.sample || {}, ["token", "reviewed"]);
      const payload = await verifySampleToken({
        secret,
        token: body.sample?.token,
        items,
        reviewerName,
        now,
      });
      const echoed = [...(body.sample?.reviewed ?? [])].sort();
      if (JSON.stringify(echoed) !== JSON.stringify([...payload.ids].sort())) {
        throw new DecisionError(
          "sample-mismatch",
          "sample.reviewed must list exactly the sampled items",
          422,
        );
      }
      for (const key of payload.ids) {
        const [blockId, dimension, lang] = key.split("|");
        const { block } = loaded.get(blockId);
        const last = await individualDecision(db, {
          blockId,
          dimension,
          lang,
          reviewerName,
          contentHash: block.provenance.contentHash,
          since: payload.iat,
        });
        if (!last)
          throw new DecisionError(
            "sample-unreviewed",
            `sampled item ${key} was not reviewed individually`,
            409,
          );
        if (last.to_state !== "reviewed")
          throw new DecisionError(
            "sample-flagged",
            `sampled item ${key} was not approved; resolve it first`,
            409,
          );
      }
    }

    const events = [];
    for (const [n, item] of items.entries()) {
      const { block, unit } = loaded.get(item.blockId);
      try {
        const { event } = await decide({
          block,
          dimension: item.dimension,
          lang: item.lang || null,
          state: body.state,
          reviewer: body.reviewer,
          comment: body.comment ?? "",
          subject: subjectKey(unit),
          today: todayOf(now),
        });
        if (event.fromState !== event.toState) events.push(event);
      } catch (err) {
        if (err instanceof DecisionError)
          throw new DecisionError(
            err.code,
            `items[${n}] ${item.blockId}: ${err.message}`,
            err.status,
          );
        throw err;
      }
    }
    if (!events.length) return { ok: true, count: 0, skipped: items.length, sampled: needsSample };
    const bulkId = crypto.randomUUID();
    const rows = await appendEvents(db, events, { now, kind: "bulk", bulkId });
    return {
      ok: true,
      bulkId,
      count: rows.length,
      skipped: items.length - rows.length,
      sampled: needsSample,
    };
  });
}
