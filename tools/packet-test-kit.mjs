// Shared helpers for the class-packet tests: stored-zip reader, visible-text extraction from the HTML and Word exports,
// and the list of authored source pieces a spec prints (so the tests can prove export text equals source).
// Not a test file (no .test.): node --test tools/packet-*.test.mjs skips it.

const ENT = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&nbsp;": " ",
};
const decode = (s) => s.replace(/&(?:amp|lt|gt|quot|apos|#39|nbsp);/g, (m) => ENT[m]);

export const squash = (s) => String(s).replace(/[\s ]+/g, "");

/** Visible text of a packet HTML page: style and tags removed, entities decoded, whitespace collapsed. */
export function htmlText(html) {
  return decode(
    html
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<svg[\s\S]*?<\/svg>/g, " ")
      .replace(/<\/?(?:span|strong|em|b|i)\b[^>]*>/g, "")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[\s ]+/g, " ")
    .trim();
}

/** Files of a stored (uncompressed) zip, as text. */
export function readZip(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = bytes.length - 22;
  while (eocd >= 0 && dv.getUint32(eocd, true) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("not a zip");
  const count = dv.getUint16(eocd + 10, true);
  let at = dv.getUint32(eocd + 16, true);
  const files = {};
  for (let k = 0; k < count; k++) {
    const size = dv.getUint32(at + 24, true);
    const nameLen = dv.getUint16(at + 28, true);
    const extra = dv.getUint16(at + 30, true);
    const comment = dv.getUint16(at + 32, true);
    const local = dv.getUint32(at + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLen));
    const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
    files[name] = new TextDecoder().decode(bytes.subarray(start, start + size));
    at += 46 + nameLen + extra + comment;
  }
  return files;
}

/** Text of a Word part: every w:t, paragraphs separated by a space. */
export function xmlText(xml) {
  return decode(
    xml
      .replace(/<\/w:p>/g, " ")
      .replace(/<w:tab\/>/g, " ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[\s ]+/g, " ")
    .replace(/ ([.,;:!?)])/g, "$1") // Word draws a write-in blank as its own run, so a space precedes the punctuation
    .trim();
}

export const docxText = (bytes) => xmlText(readZip(bytes)["word/document.xml"]);

/** True when every piece occurs in the text, in order (whitespace ignored). Returns the first missing piece or null. */
export function firstMissing(text, pieces) {
  const flat = squash(text);
  let from = 0;
  for (const p of pieces) {
    const needle = squash(p);
    if (!needle) continue;
    const at = flat.indexOf(needle, from);
    if (at < 0) return p;
    from = at + needle.length;
  }
  return null;
}

const noBrackets = (s) => s.replace(/\[([^\]]+)\]/g, "$1");
const noBlanks = (s) => s.split("___").filter(Boolean);

/** The authored strings a student paper prints, in reading order, as the exports render them. */
export function paperPieces(spec) {
  return [
    spec.title,
    spec.subtitle,
    ...noBlanks(noBrackets(spec.goal)),
    ...spec.words.flatMap((w) => [
      w.term,
      w.def,
      w.practice.prefix,
      ...noBlanks(noBrackets(w.practice.text)),
    ]),
    ...spec.frames.map(noBrackets),
    spec.exit.prompt,
    spec.exit.help.lead,
    ...noBlanks(noBrackets(spec.exit.help.text)),
  ];
}

/** Block-type signature of a document model: equal signatures mean an identical layout. */
export function signature(doc) {
  const walk = (b) =>
    b.type === "table"
      ? `table[${b.rows.length}x${b.headers?.length}|${b.widths?.join(",")}]`
      : b.type === "lines"
        ? `lines${b.n}`
        : b.type === "callout"
          ? `callout(${(b.blocks || []).map(walk).join(",")})`
          : b.type;
  return doc.sections.map((s) => s.blocks.map(walk).join(";")).join("||");
}

/** HTML or Word xml containing any page-break construct. */
export const PAGE_BREAK_HTML =
  /page-break|break-(?:before|after):\s*(?:page|always|left|right|recto|verso|column)|pagebreak/i;
export const PAGE_BREAK_XML =
  /<w:br\b[^>]*w:type="page"|<w:pageBreakBefore\b|<w:lastRenderedPageBreak\b/;
