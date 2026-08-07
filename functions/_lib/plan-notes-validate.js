/* =============================================================================
 * plan-notes-validate.js — the gate on every annotation written.
 * -----------------------------------------------------------------------------
 * Plan Notes exists for two reasons: so Joel can read his own margin notes next
 * year, and so the structured ones can reach the curriculum nervous system. The
 * second reason is the fragile one. An annotation layer that accepts free text
 * everywhere degrades into forty spellings of "keeps the denominator" within a
 * term, and then nothing downstream can consume it.
 *
 * So: free text lives in `body` and `bodyAlt`. Every other field validates
 * against functions/_lib/plan-vocab.js, and an unknown value is a 400 — not a
 * silent insert, not a coerced best guess. The AI annotation pass runs through
 * this same function, which is the point: a model that invents a misconception
 * id gets its note rejected exactly like a hand-typed typo would.
 *
 * Imported by functions/api/plan-notes/[[path]].js and by the unit tests.
 * ========================================================================== */

import { ACTIVITY_PATHS, LESSON_IDS, MISCONCEPTION_IDS, STANDARD_IDS } from "./plan-vocab.js";

/* The five note kinds. The kind decides the shape, because what teachers write
 * in margins genuinely has five shapes and flattening them into one text field
 * is what makes an annotation tool useless after a week. */
export const NOTE_KINDS = ["timing", "watch-for", "swap", "resource", "note"];

export const MAX_BODY = 2000;
const MAX_TAGS = 8;
const MAX_TIMING_MIN = 240;

const isStr = (v) => typeof v === "string";
const trim = (v, n) => (isStr(v) ? v.slice(0, n).trim() : "");

function uniqueStrings(v, allowed, field, errors) {
  if (v == null) return [];
  if (!Array.isArray(v)) {
    errors.push(`${field} must be an array`);
    return [];
  }
  if (v.length > MAX_TAGS) {
    errors.push(`${field} accepts at most ${MAX_TAGS} entries`);
    return [];
  }
  const out = [];
  for (const raw of v) {
    if (!isStr(raw)) {
      errors.push(`${field} entries must be strings`);
      continue;
    }
    const id = raw.trim();
    if (!allowed.has(id)) {
      // Naming the offending value matters: this error is the one Joel will
      // actually see, and "unknown misconception id: denominatr" tells him what
      // to fix where "invalid request" does not.
      errors.push(`unknown ${field} value: ${id.slice(0, 60)}`);
      continue;
    }
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

/**
 * Validate and normalize one incoming note.
 *
 * @param {unknown} input   the raw note from the client or the AI pass
 * @returns {{ok: true, note: object} | {ok: false, errors: string[]}}
 */
export function validateNote(input) {
  const errors = [];
  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["note must be an object"] };
  }
  const n = /** @type {Record<string, unknown>} */ (input);

  const kind = isStr(n.kind) ? n.kind.trim() : "";
  if (!NOTE_KINDS.includes(kind)) {
    return { ok: false, errors: [`kind must be one of: ${NOTE_KINDS.join(", ")}`] };
  }

  const anchorKey = trim(n.anchorKey, 200);
  if (!anchorKey) errors.push("anchorKey is required");
  else if (!/^(lesson|doc):[A-Za-z0-9._:-]+$/.test(anchorKey)) {
    errors.push("anchorKey must look like lesson:<id> or doc:<sha256>");
  } else if (anchorKey.startsWith("lesson:") && !LESSON_IDS.has(anchorKey.slice(7))) {
    errors.push(`unknown lesson id: ${anchorKey.slice(7, 60)}`);
  }

  const body = trim(n.body, MAX_BODY);
  const bodyAlt = trim(n.bodyAlt, MAX_BODY);

  const misconceptionTags = uniqueStrings(
    n.misconceptionTags,
    MISCONCEPTION_IDS,
    "misconceptionTags",
    errors,
  );
  const standards = uniqueStrings(n.standards, STANDARD_IDS, "standards", errors);
  const activityRefs = uniqueStrings(n.activityRefs, ACTIVITY_PATHS, "activityRefs", errors);

  let level = null;
  if (n.level != null && n.level !== "") {
    const lv = Number(n.level);
    if (!Number.isInteger(lv) || lv < 0 || lv > 2) errors.push("level must be 0, 1 or 2");
    else level = lv;
  }

  let timingMin = null;
  if (n.timingMin != null && n.timingMin !== "") {
    const t = Number(n.timingMin);
    if (!Number.isFinite(t) || t < 0 || t > MAX_TIMING_MIN) {
      errors.push(`timingMin must be between 0 and ${MAX_TIMING_MIN}`);
    } else timingMin = Math.round(t);
  }

  /* Per-kind requirements. These are what make a kind mean something: a
   * watch-for with no misconception tag is just a note, and a swap with only
   * one body is the exact thing the two-body shape exists to prevent. */
  switch (kind) {
    case "timing":
      if (timingMin == null) errors.push("a timing note needs timingMin");
      break;
    case "watch-for":
      if (misconceptionTags.length === 0) {
        errors.push("a watch-for note needs at least one misconceptionTags entry");
      }
      if (!body) errors.push("a watch-for note needs a body");
      break;
    case "swap":
      if (!body) errors.push("a swap note needs a body (what the plan says)");
      if (!bodyAlt) errors.push("a swap note needs a bodyAlt (what you do instead)");
      if (level == null) errors.push("a swap note needs a level (0, 1 or 2)");
      break;
    case "resource":
      if (activityRefs.length === 0) {
        errors.push("a resource note needs at least one activityRefs entry");
      }
      break;
    case "note":
      if (!body) errors.push("a note needs a body");
      break;
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    note: {
      anchorKey,
      anchorRef: normalizeAnchorRef(n.anchorRef),
      kind,
      body,
      bodyAlt,
      misconceptionTags,
      standards,
      activityRefs,
      level,
      timingMin,
    },
  };
}

/**
 * An anchor is how a note finds its way back to the right spot in a plan that
 * may have been re-exported since. `quote` is the primary key on reopen; `page`
 * is the fallback. A note whose anchor resolves to neither is never dropped —
 * the client surfaces it in an unpinned tray — so a malformed ref here is
 * survivable and does not reject the write.
 */
export function normalizeAnchorRef(ref) {
  if (!ref || typeof ref !== "object") return { page: null, quote: "", quoteStart: null };
  const r = /** @type {Record<string, unknown>} */ (ref);
  const page =
    Number.isFinite(Number(r.page)) && Number(r.page) > 0 ? Math.round(Number(r.page)) : null;
  const quoteStart =
    Number.isFinite(Number(r.quoteStart)) && Number(r.quoteStart) >= 0
      ? Math.round(Number(r.quoteStart))
      : null;
  return {
    page,
    // Long enough to be unique in a lesson plan, short enough that a reflowed
    // paragraph still matches.
    quote: trim(r.quote, 300),
    quoteStart,
    section: trim(r.section, 80),
  };
}

/**
 * Relocate a note in a document that may have changed since it was written.
 * Exact quote match wins; page is the fallback; neither means unpinned.
 *
 * Returns the resolution rather than mutating, so the caller decides what an
 * unpinned note looks like. The one rule this function enforces is that it
 * never returns "gone".
 *
 * @param {{page: number|null, quote: string}} anchorRef
 * @param {{text: string, page: number}[]} pages
 */
export function relocate(anchorRef, pages) {
  const ref = normalizeAnchorRef(anchorRef);
  if (ref.quote) {
    for (const p of pages) {
      const idx = typeof p.text === "string" ? p.text.indexOf(ref.quote) : -1;
      if (idx !== -1) return { status: "quote", page: p.page, offset: idx };
    }
    // Whitespace in a re-exported PDF is not stable. Try once more with runs of
    // whitespace collapsed before giving up on the quote.
    const loose = ref.quote.replace(/\s+/g, " ").trim();
    if (loose) {
      for (const p of pages) {
        const flat = String(p.text || "").replace(/\s+/g, " ");
        const idx = flat.indexOf(loose);
        if (idx !== -1) return { status: "quote-loose", page: p.page, offset: idx };
      }
    }
  }
  if (ref.page != null && pages.some((p) => p.page === ref.page)) {
    return { status: "page", page: ref.page, offset: null };
  }
  return { status: "unpinned", page: null, offset: null };
}
