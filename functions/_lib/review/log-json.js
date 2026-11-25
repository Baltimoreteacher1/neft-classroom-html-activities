// The review log as JSON, and the one schema both exports (CSV and JSON) are checked against. Same columns, same
// order, same values as the CSV; created_at is ISO. Snapshots stay out. No formula guard: JSON is not a spreadsheet,
// and a consumer that opens it in one is reading the CSV's guarded cells instead.
import { EVENT_DIMENSIONS, REVIEW_STATES } from "../../../shared/content-schema/review-rules.js";
import { LOG_COLUMNS } from "./csv.js";

export const LOG_JSON_SCHEMA = "ewl-review-log/1";
const HASH = /^[0-9a-f]{64}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Rows as read from review_event -> the export document. `next` is the paging cursor or null. */
export function logJson(rows, { next = null, now = Date.now() } = {}) {
  return {
    schema: LOG_JSON_SCHEMA,
    columns: [...LOG_COLUMNS],
    generated_at: new Date(now).toISOString(),
    count: rows.length,
    next_after_seq: next,
    events: rows.map((r) =>
      Object.fromEntries(
        LOG_COLUMNS.map((c) => [
          c,
          c === "created_at"
            ? new Date(Number(r.created_at)).toISOString()
            : c === "seq"
              ? Number(r.seq)
              : (r[c] ?? (c === "bulk_id" ? null : "")),
        ]),
      ),
    ),
  };
}

/** Problems with one event (values as strings or numbers, as either export yields them). [] = valid. */
export function checkEvent(e, at = "event") {
  const errors = [];
  const bad = (m) => errors.push(`${at}: ${m}`);
  for (const c of LOG_COLUMNS) if (!(c in e)) bad(`missing column ${c}`);
  if (errors.length) return errors;
  if (!Number.isInteger(Number(e.seq)) || Number(e.seq) < 1) bad("seq is not a positive integer");
  if (Number.isNaN(Date.parse(e.created_at))) bad("created_at is not a date");
  if (!EVENT_DIMENSIONS.includes(e.dimension)) bad(`unknown dimension ${e.dimension}`);
  for (const k of ["from_state", "to_state"])
    if (!REVIEW_STATES.includes(e[k])) bad(`unknown ${k} ${e[k]}`);
  if (e.actor !== "human") bad(`actor is "${e.actor}", not human`);
  if (!String(e.reviewer_name).trim()) bad("reviewer_name is empty");
  if (!DAY.test(String(e.reviewer_date))) bad("reviewer_date is not YYYY-MM-DD");
  if (!HASH.test(String(e.content_hash))) bad("content_hash is not sha256 hex");
  if (!HASH.test(String(e.digest))) bad("digest is not sha256 hex");
  if (e.prior_digest !== "" && !HASH.test(String(e.prior_digest)))
    bad("prior_digest is not sha256 hex");
  return errors;
}

/** Problems with a whole export document: shape, column order, every event, ascending seq, chain links. */
export function checkLogJson(doc) {
  const errors = [];
  if (doc?.schema !== LOG_JSON_SCHEMA)
    errors.push(`schema is ${doc?.schema}, want ${LOG_JSON_SCHEMA}`);
  if (JSON.stringify(doc?.columns) !== JSON.stringify(LOG_COLUMNS))
    errors.push("columns differ from LOG_COLUMNS");
  if (!Array.isArray(doc?.events)) return [...errors, "events is not an array"];
  if (doc.count !== doc.events.length)
    errors.push(`count ${doc.count} != ${doc.events.length} events`);
  let prev = null;
  for (const [i, e] of doc.events.entries()) {
    errors.push(...checkEvent(e, `events[${i}]`));
    if (
      JSON.stringify(Object.keys(e)) !== JSON.stringify(LOG_COLUMNS) &&
      !errors.some((m) => m.includes("missing"))
    )
      errors.push(`events[${i}]: key order differs from columns`);
    if (prev) {
      if (Number(e.seq) <= Number(prev.seq)) errors.push(`events[${i}]: seq not ascending`);
      if (e.prior_digest !== prev.digest)
        errors.push(`events[${i}]: prior_digest is not the previous digest`);
    }
    prev = e;
  }
  return errors;
}

/** Problems with CSV export text (parsed by the caller into objects): header line, tightness, every row. */
export function checkLogCsv(text, rows) {
  const errors = [];
  if (!text.startsWith(`${LOG_COLUMNS.join(",")}\n`))
    errors.push("header line differs from LOG_COLUMNS");
  if (!text.endsWith("\n") || text.endsWith("\n\n"))
    errors.push("not tight: need exactly one final newline");
  if (text.includes("\r")) errors.push("CR in output: rows must be LF");
  for (const [i, r] of rows.entries()) errors.push(...checkEvent(r, `row ${i}`));
  return errors;
}
