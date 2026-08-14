/**
 * zip-store.js — zero-dependency stored (uncompressed) ZIP writer.
 *
 * ONE implementation, three callers: the on-demand SCORM endpoint
 * (functions/api/scorm.js), the bulk SCORM endpoint (functions/api/scorm-bundle.js),
 * and the browser-side bulk downloader (assets/curriculum-download.js). It lived
 * inside functions/_lib/scorm.js first; the downloader needs the identical byte
 * layout, and a second copy of a hand-rolled archive format is how two archives
 * quietly stop agreeing.
 *
 * Stored, not deflated, on purpose: the payloads are PDFs, DOCX and nested .zip
 * packages, all already compressed, and it keeps the writer dependency-free in
 * both a Worker and a browser.
 *
 * Web-runtime only: TextEncoder / Uint8Array / DataView (Workers, browsers, Node 18+).
 * No ZIP64 — entries and archives must stay under 4 GB, which a curriculum
 * package is by three orders of magnitude.
 */

function crc32(bytes) {
  let crc = ~0;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

/**
 * Reject an entry path that would escape the extraction directory or that no
 * archiver can represent portably. A ZIP is just a list of names — nothing in
 * the format stops `../../etc/passwd`, and "Zip Slip" is exactly that hole. The
 * check lives HERE, in the one writer, so no caller can forget it.
 *
 * Duplicate names are rejected for a quieter reason: a repeated path is a
 * packaging bug that most unzip tools resolve by silently keeping the last
 * copy, which is how a 10-lesson bundle ships 9 lessons and looks complete.
 */
export function assertSafeZipPath(name) {
  const n = String(name);
  if (!n) throw new Error("zipStore: empty entry name");
  if (n.length > 240) throw new Error(`zipStore: entry name too long: ${n.slice(0, 60)}…`);
  if (n.includes("\\")) throw new Error(`zipStore: backslash in entry name: ${n}`);
  if (n.startsWith("/")) throw new Error(`zipStore: absolute entry path: ${n}`);
  if (/^[A-Za-z]:/.test(n)) throw new Error(`zipStore: drive-letter entry path: ${n}`);
  if (n.split("/").some((seg) => seg === ".." || seg === "."))
    throw new Error(`zipStore: path traversal in entry: ${n}`);
  // Encoded traversal — some extractors decode before writing.
  if (/%2e%2e|%2f|%5c/i.test(n)) throw new Error(`zipStore: encoded traversal in entry: ${n}`);
  // Regex-free on purpose: a control-character class cannot be written here
  // without putting literal control bytes in this file.
  for (let i = 0; i < n.length; i++) {
    const c = n.charCodeAt(i);
    if (c < 0x20 || c === 0x7f)
      throw new Error(`zipStore: control character in entry: ${JSON.stringify(n)}`);
  }
  return n;
}

/** files: { name: string } → Uint8Array of a valid (uncompressed) .zip. */
export function zipStore(files) {
  const enc = new TextEncoder();
  const seen = new Set();
  const DOS_DATE = 0x21; // 1980-01-01, fixed for reproducible output
  const locals = [];
  const centrals = [];
  let offset = 0;
  let count = 0;

  for (const name of Object.keys(files)) {
    assertSafeZipPath(name);
    if (seen.has(name)) throw new Error(`zipStore: duplicate entry: ${name}`);
    seen.add(name);
    const nameBytes = enc.encode(name);
    // Values may be text (the SCO's index.html / imsmanifest.xml) or raw bytes.
    // Bytes are what lets a zip hold other zips, which is how the bundle
    // endpoint ships one download containing one ready-to-upload package per
    // lesson — Canvas imports SCORM one package per assignment, so they must
    // stay separate archives inside the outer one.
    const value = files[name];
    const data = value instanceof Uint8Array ? value : enc.encode(value);
    const crc = crc32(data);

    const lh = new Uint8Array(30 + nameBytes.length);
    const ld = new DataView(lh.buffer);
    ld.setUint32(0, 0x04034b50, true);
    ld.setUint16(4, 20, true);
    ld.setUint16(6, 0, true);
    ld.setUint16(8, 0, true); // store
    ld.setUint16(10, 0, true);
    ld.setUint16(12, DOS_DATE, true);
    ld.setUint32(14, crc, true);
    ld.setUint32(18, data.length, true);
    ld.setUint32(22, data.length, true);
    ld.setUint16(26, nameBytes.length, true);
    ld.setUint16(28, 0, true);
    lh.set(nameBytes, 30);
    locals.push(lh, data);

    const ch = new Uint8Array(46 + nameBytes.length);
    const cd = new DataView(ch.buffer);
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, 0, true);
    cd.setUint16(14, DOS_DATE, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, nameBytes.length, true);
    cd.setUint16(30, 0, true);
    cd.setUint16(32, 0, true);
    cd.setUint16(34, 0, true);
    cd.setUint16(36, 0, true);
    cd.setUint32(38, 0, true);
    cd.setUint32(42, offset, true);
    ch.set(nameBytes, 46);
    centrals.push(ch);

    offset += lh.length + data.length;
    count++;
  }

  const cdSize = centrals.reduce((a, b) => a + b.length, 0);
  const eocd = new Uint8Array(22);
  const ed = new DataView(eocd.buffer);
  ed.setUint32(0, 0x06054b50, true);
  ed.setUint16(4, 0, true);
  ed.setUint16(6, 0, true);
  ed.setUint16(8, count, true);
  ed.setUint16(10, count, true);
  ed.setUint32(12, cdSize, true);
  ed.setUint32(16, offset, true);
  ed.setUint16(20, 0, true);

  const all = [...locals, ...centrals, eocd];
  const total = all.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const part of all) {
    out.set(part, p);
    p += part.length;
  }
  return out;
}
