// Routine blocks: neutral content nodes. The browser (bcpss-teachers/routines/) and the print/Word builder
// (functions/_lib/bcpss/studio-doc-routines.js) both render these, so what a teacher sees on screen is what prints.
// Pure data, no DOM. A node is { t, ... }:
//   h      { text }                          small heading inside a block
//   p      { text, em? }                     paragraph (em = muted note)
//   list   { items:[str], ordered? }         bullets or numbers
//   kv     { rows:[[label, text]] }          label/value rows
//   chips  { items:[str], label? }           word bank / corner labels
//   cards  { cards:[{ title, lines:[str] }], cut? }  side-by-side cards (cut = cut apart on paper)
//   table  { headers:[str], rows:[[str]] }
//   mc     { items:[{ q, options:[str], answer? }] }  numbered choice items; answer (index) only in teacher views
//   lines  { n, label? }                     write-on lines for students

export const h = (text) => ({ t: "h", text: String(text) });
export const p = (text, em = false) => ({ t: "p", text: String(text), em });
export const list = (items, ordered = false) => ({ t: "list", items: items.map(String), ordered });
export const kv = (rows) => ({ t: "kv", rows: rows.map(([k, v]) => [String(k), String(v)]) });
export const chips = (items, label = "") => ({ t: "chips", items: items.map(String), label });
export const cards = (cardList, cut = false) => ({ t: "cards", cards: cardList, cut });
export const table = (headers, rows) => ({
  t: "table",
  headers: headers.map(String),
  rows: rows.map((r) => r.map(String)),
});
export const mc = (items) => ({ t: "mc", items });
export const lines = (n, label = "") => ({ t: "lines", n, label });
