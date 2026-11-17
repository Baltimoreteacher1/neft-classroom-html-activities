// Experience Builder: a small, dependency-free reader for Word (.docx) files. A .docx is a ZIP archive; the text lives
// in word/document.xml. This module reads the ZIP central directory with a DataView, inflates that ONE entry with the
// platform's DecompressionStream("deflate-raw") (stored entries are copied), and keeps only the paragraph text
// (w:p / w:t, w:tab and w:br as a space). Everything else in the file (styles, images, macros, links, fields) is
// ignored; nothing is executed, rendered or fetched. Runs in the browser and in Node 22+.
// Guards: file <= 2 MB, <= 400 entries, document.xml <= 4 MB uncompressed (the inflate stream is cut off past the
// cap, so a zip bomb never fills memory), no absolute or ".." entry paths, no encrypted entries, no ZIP64.
export const DOCX_LIMITS = Object.freeze({
  fileBytes: 2 * 1024 * 1024,
  entries: 400,
  documentBytes: 4 * 1024 * 1024,
});
const DOCUMENT = "word/document.xml";
const SIG = { eocd: 0x06054b50, central: 0x02014b50, local: 0x04034b50 };
// A password-protected Office file is not a ZIP at all: Word wraps it in an OLE compound file.
const OLE_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

class DocxError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
const fail = (code) => {
  throw new DocxError(code);
};

function findEnd(view) {
  const min = Math.max(0, view.byteLength - 22 - 0xffff);
  for (let i = view.byteLength - 22; i >= min; i--)
    if (view.getUint32(i, true) === SIG.eocd) return i;
  return -1;
}

/** Is this entry name safe to even consider? (absolute paths, drive letters and ".." segments are refused) */
export function safeEntryName(name) {
  const n = String(name);
  if (!n || n.startsWith("/") || n.startsWith("\\") || /^[a-z]:/i.test(n)) return false;
  return !n.split(/[\\/]/).some((part) => part === "..");
}

/** The central directory as [{ name, flags, method, compSize, size, offset }]. Throws DocxError on a bad archive. */
export function zipEntries(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength >= 8 && OLE_MAGIC.every((b, i) => bytes[i] === b)) fail("encrypted");
  if (bytes.byteLength < 22) fail("malformed");
  const end = findEnd(view);
  if (end < 0) fail("malformed");
  const count = view.getUint16(end + 10, true);
  const cdSize = view.getUint32(end + 12, true);
  const cdOffset = view.getUint32(end + 16, true);
  if (count === 0xffff || cdOffset === 0xffffffff) fail("malformed"); // ZIP64: never needed for a 2 MB file
  if (count > DOCX_LIMITS.entries) fail("too-many-entries");
  if (cdOffset + cdSize > end) fail("malformed");
  const names = new TextDecoder("utf-8");
  const out = [];
  let p = cdOffset;
  for (let i = 0; i < count; i++) {
    if (p + 46 > end || view.getUint32(p, true) !== SIG.central) fail("malformed");
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    if (p + 46 + nameLen > end) fail("malformed");
    const name = names.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    if (!safeEntryName(name)) fail("unsafe-path");
    out.push({
      name,
      flags: view.getUint16(p + 8, true),
      method: view.getUint16(p + 10, true),
      compSize: view.getUint32(p + 20, true),
      size: view.getUint32(p + 24, true),
      offset: view.getUint32(p + 42, true),
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

/** Inflate raw deflate bytes, refusing to produce more than `cap` bytes. */
async function inflateCapped(data, cap) {
  if (typeof DecompressionStream !== "function") fail("unsupported-platform");
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = stream.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > cap) {
        await reader.cancel().catch(() => {});
        fail("document-too-large");
      }
      chunks.push(value);
    }
  } catch (err) {
    if (err instanceof DocxError) throw err;
    fail("malformed");
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.byteLength;
  }
  return out;
}

/** The uncompressed bytes of one entry (stored or deflated), capped. */
async function entryBytes(bytes, entry, cap) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (entry.flags & 1) fail("encrypted");
  if (entry.size > cap) fail("document-too-large");
  const p = entry.offset;
  if (p + 30 > bytes.byteLength || view.getUint32(p, true) !== SIG.local) fail("malformed");
  const start = p + 30 + view.getUint16(p + 26, true) + view.getUint16(p + 28, true);
  if (start + entry.compSize > bytes.byteLength) fail("malformed");
  const data = bytes.subarray(start, start + entry.compSize);
  if (entry.method === 0) {
    if (data.byteLength > cap) fail("document-too-large");
    return data;
  }
  if (entry.method === 8) return inflateCapped(data, cap);
  fail("malformed");
}

const XML_ENTITIES = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };
const decodeXml = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] !== "#") return XML_ENTITIES[e] ?? " ";
    const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1));
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : " ";
  });

// One pass over the XML: paragraph starts and ends, text runs, tabs and breaks. Anything else is skipped.
const TOKENS =
  /<w:p(?=[\s>/])[^>]*>|<\/w:p>|<w:(?:tab|br|cr)(?=[\s>/])[^>]*>|<w:t(?=[\s>])[^>]*>([\s\S]*?)<\/w:t>/g;

/** Paragraph text from word/document.xml: paragraphs separated by a blank line, w:tab and w:br as a space. */
export function documentText(xml) {
  const paragraphs = [];
  let current = "";
  for (const m of String(xml).matchAll(TOKENS)) {
    const tag = m[0];
    // A paragraph start also ends any open text (a text box nests its paragraphs inside another one).
    if (tag.startsWith("<w:p") || tag === "</w:p>") {
      paragraphs.push(current);
      current = "";
    } else if (m[1] !== undefined) current += decodeXml(m[1]);
    else current += " ";
  }
  if (current) paragraphs.push(current);
  return paragraphs
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Read the text of a .docx file.
 * @param {ArrayBuffer | Uint8Array} input
 * @returns {Promise<{ ok: true, text: string } | { ok: false, error: string }>} error is one of: too-large,
 *   encrypted, malformed, too-many-entries, unsafe-path, no-document, document-too-large, unsupported-platform
 */
export async function readDocx(input) {
  try {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (bytes.byteLength > DOCX_LIMITS.fileBytes) return { ok: false, error: "too-large" };
    const entry = zipEntries(bytes).find((e) => e.name === DOCUMENT);
    if (!entry) return { ok: false, error: "no-document" };
    const xml = new TextDecoder("utf-8").decode(
      await entryBytes(bytes, entry, DOCX_LIMITS.documentBytes),
    );
    return { ok: true, text: documentText(xml) };
  } catch (err) {
    return { ok: false, error: err instanceof DocxError ? err.code : "malformed" };
  }
}
