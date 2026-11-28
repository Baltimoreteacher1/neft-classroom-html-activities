// Search scoring shared by /search/ and Quick Find (one implementation). A separate module, not lib.js, so a
// visitor whose service worker still holds an older lib.js never gets a module that lacks these exports.
export const normText = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[–—]/g, "-");
/** Split a query into tokens; "grades 6-8" and "6-8" both match the index's "grades-6-8" cluster key. */
export const tokenize = (q) =>
  normText(q)
    .split(/[\s,]+/)
    .filter((x) => x.length > 1)
    .map((x) => x.replace(/^grades?$/, "").replace(/^(\d)-(\d)$/, "grades-$1-$2"))
    .filter(Boolean);
/** Every token must appear somewhere; title hits weigh 3, other fields 1. 0 = no match. */
export function searchScore(entry, tokens, kindLabel = "") {
  const title = normText(entry.t);
  const hay = `${title} ${normText(entry.d)} ${normText(entry.g)} ${normText(entry.dom)} ${normText(entry.a)} ${normText(entry.klu)} ${normText(kindLabel)}`;
  let s = 0;
  for (const tok of tokens) {
    if (!hay.includes(tok)) return 0;
    s += title.includes(tok) ? 3 : 1;
  }
  return s || 1;
}
