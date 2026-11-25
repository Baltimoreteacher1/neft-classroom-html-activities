// Tight CSV for the review log export: RFC 4180 quoting, LF-terminated rows, no BOM, no blank lines.
// A cell a spreadsheet would run as a formula gets a leading apostrophe on export; parseCsv undoes it for
// the free-text columns, so export -> parse returns exactly the stored values.

export const LOG_COLUMNS = Object.freeze([
  "seq",
  "id",
  "created_at",
  "block_id",
  "kind",
  "dimension",
  "lang",
  "from_state",
  "to_state",
  "reviewer_name",
  "reviewer_role",
  "reviewer_date",
  "actor",
  "content_hash",
  "comment",
  "bulk_id",
  "prior_digest",
  "digest",
]);
// Guarded when the value (after any leading apostrophes) starts like a formula; parse strips exactly one.
const NEEDS_GUARD = /^'*[=+\-@\t\r]/;
const WAS_GUARDED = /^'+[=+\-@\t\r]/;
const TEXT_COLUMNS = new Set(["reviewer_name", "comment"]);

function cell(column, value) {
  let s = value === null || value === undefined ? "" : String(value);
  if (TEXT_COLUMNS.has(column) && NEEDS_GUARD.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const isoOf = (ms) => new Date(Number(ms)).toISOString();

/** Rows as read from review_event (created_at in ms) -> CSV text with a header. */
export function logCsv(rows) {
  const lines = [LOG_COLUMNS.join(",")];
  for (const r of rows) {
    lines.push(
      LOG_COLUMNS.map((c) => cell(c, c === "created_at" ? isoOf(r.created_at) : r[c])).join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

/** Parse CSV text to an array of objects keyed by the header. Undoes the formula apostrophe. */
export function parseCsv(text) {
  const records = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      records.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    records.push(row);
  }
  const [header, ...body] = records;
  return body.map((r) =>
    Object.fromEntries(
      header.map((h, i) => [
        h,
        TEXT_COLUMNS.has(h) && WAS_GUARDED.test(r[i]) ? r[i].slice(1) : r[i],
      ]),
    ),
  );
}
