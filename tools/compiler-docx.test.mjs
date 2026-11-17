// Experience Builder additions: the dependency-free Word reader (src/compiler/docx.js) on REAL .docx files built
// here with the jszip devDependency (the lab itself never loads jszip), the upload path that uses it, and the
// editor side of "Suggest improvements" (built-in suggestions, the request, Accept through the editor ops).
// Synthetic data only.
import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import { compileExperience } from "../access-practice-lab/src/compiler/compile.js";
import {
  DOCX_LIMITS,
  documentText,
  readDocx,
  safeEntryName,
} from "../access-practice-lab/src/compiler/docx.js";
import { readUpload } from "../access-practice-lab/src/compiler/editor-inputs.js";
import { applyOp } from "../access-practice-lab/src/compiler/editor-ops.js";
import {
  builtInSuggestions,
  requestSuggestions,
  SUGGEST_API,
  suggestBody,
  suggestionOp,
} from "../access-practice-lab/src/compiler/editor-suggest.js";
import {
  checkUpload,
  MAX_DOCX_BYTES,
  MAX_UPLOAD_BYTES,
} from "../access-practice-lab/src/compiler/extract.js";
import { SAMPLE_TEXT, sampleInput } from "../access-practice-lab/src/compiler/sample-ecosystem.js";
import { validateExperience } from "../access-practice-lab/src/compiler/validate.js";

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const para = (text) =>
  `<w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
const documentXml = (body) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W}><w:body>${body}<w:sectPr/></w:body></w:document>`;

async function makeDocx(body, { compression = "DEFLATE", extra = {} } = {}) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", '<?xml version="1.0"?><Types/>');
  zip.file("_rels/.rels", '<?xml version="1.0"?><Relationships/>');
  zip.file("word/document.xml", documentXml(body));
  for (const [name, text] of Object.entries(extra)) zip.file(name, text);
  return zip.generateAsync({ type: "uint8array", compression });
}

/** Central-directory entry offsets by name, read independently of docx.js. */
function centralOffsets(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  while (v.getUint32(end, true) !== 0x06054b50) end--;
  const out = {};
  let p = v.getUint32(end + 16, true);
  for (let i = 0; i < v.getUint16(end + 10, true); i++) {
    const n = v.getUint16(p + 28, true);
    out[new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + n))] = p;
    p += 46 + n + v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
  }
  return out;
}

const SAMPLE_PARAS = SAMPLE_TEXT.split(/\n\n/);

test("docx: a real Word file (deflated and stored) gives its paragraph text, tabs as spaces, nothing else", async () => {
  const body = [
    para("Willow Pond"),
    "<w:p><w:r><w:t>Algae &amp; plants</w:t></w:r><w:r><w:tab/><w:t>need light.</w:t></w:r><w:r><w:drawing><w:t>box</w:t></w:drawing></w:r></w:p>",
    '<w:p><w:r><w:instrText>HYPERLINK "javascript:alert(1)"</w:instrText><w:delText>deleted words</w:delText><w:t>Kept &#233;&#x00F1; &lt;b&gt;</w:t></w:r></w:p>',
    "<w:p/>",
    "<w:tbl><w:tr><w:tc>" + para("In a table cell.") + "</w:tc></w:tr></w:tbl>",
  ].join("");
  for (const compression of ["DEFLATE", "STORE"]) {
    const res = await readDocx(
      await makeDocx(body, { compression, extra: { "word/media/x.png": "PNG" } }),
    );
    assert.equal(res.ok, true, compression);
    const paras = res.text.split("\n\n");
    assert.equal(paras[0], "Willow Pond");
    assert.equal(paras[1].startsWith("Algae & plants need light."), true, paras[1]);
    assert.equal(paras[2], "Kept éñ <b>");
    assert.equal(paras.at(-1), "In a table cell.");
    assert.doesNotMatch(res.text, /HYPERLINK|javascript|deleted words/);
  }
  assert.equal(
    documentText("<w:p><w:r><w:tabs/><w:t>a</w:t></w:r></w:p>"),
    "a",
    "w:tabs is not a tab",
  );
});

test("docx: guards — size, entries, unsafe paths, encryption, zip bomb, malformed", async () => {
  // too large a file
  assert.equal((await readDocx(new Uint8Array(DOCX_LIMITS.fileBytes + 1))).error, "too-large");
  // more than 400 entries
  const many = {};
  for (let i = 0; i <= DOCX_LIMITS.entries; i++) many[`word/x${i}.xml`] = "x";
  assert.equal(
    (await readDocx(await makeDocx(para("Hi."), { extra: many }))).error,
    "too-many-entries",
  );
  // a ".." entry name (patched in place, same length) and an absolute one
  for (const [from, to] of [
    ["aa/evil.txt", "../evil.txt"],
    ["xevil.txt", "/evil.txt"],
  ]) {
    const bytes = await makeDocx(para("Hi."), { compression: "STORE", extra: { [from]: "x" } });
    const src = Buffer.from(bytes);
    let at = src.indexOf(from);
    while (at >= 0) {
      Buffer.from(to.padEnd(from.length, "x").slice(0, from.length)).copy(src, at);
      at = src.indexOf(from, at + 1);
    }
    assert.equal((await readDocx(new Uint8Array(src))).error, "unsafe-path", to);
  }
  assert.equal(safeEntryName("word/document.xml"), true);
  for (const bad of ["../a", "a/../b", "/abs", "\\abs", "C:/x", "a\\..\\b"])
    assert.equal(safeEntryName(bad), false, bad);
  // encrypted: the entry flag, and a password-protected Office file (an OLE container, not a ZIP)
  const flagged = await makeDocx(para("Secret."));
  const off = centralOffsets(flagged)["word/document.xml"];
  new DataView(flagged.buffer).setUint16(off + 8, 1, true);
  assert.equal((await readDocx(flagged)).error, "encrypted");
  const ole = new Uint8Array(4096);
  ole.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  assert.equal((await readDocx(ole)).error, "encrypted");
  // zip bomb: ~5 MB of XML that compresses to a few KB. Declared honestly → refused before inflating; declared as
  // tiny (lying header) → the inflate stream is cut off at the 4 MB cap.
  const huge = "<w:p><w:r><w:t>aaaaaaaaaa</w:t></w:r></w:p>".repeat(130_000);
  const bomb = await makeDocx(huge);
  assert.ok(bomb.length < 200_000, `the bomb is small on disk (${bomb.length})`);
  assert.equal((await readDocx(bomb)).error, "document-too-large");
  const liar = bomb.slice();
  new DataView(liar.buffer).setUint32(centralOffsets(liar)["word/document.xml"] + 24, 100, true);
  assert.equal((await readDocx(liar)).error, "document-too-large");
  // malformed: not a zip, truncated, no document.xml, corrupt deflate data
  assert.equal((await readDocx(new TextEncoder().encode("PK just text"))).error, "malformed");
  const good = await makeDocx(para("Hello there."));
  assert.equal((await readDocx(good.slice(0, good.length - 30))).error, "malformed");
  const zip = new JSZip();
  zip.file("word/other.xml", "<x/>");
  assert.equal(
    (await readDocx(await zip.generateAsync({ type: "uint8array" }))).error,
    "no-document",
  );
  const corrupt = good.slice();
  const local = new DataView(corrupt.buffer).getUint32(
    centralOffsets(corrupt)["word/document.xml"] + 42,
    true,
  );
  const start = local + 30 + new DataView(corrupt.buffer).getUint16(local + 26, true);
  corrupt.fill(0xff, start, start + 12);
  assert.equal((await readDocx(corrupt)).ok, false);
});

test("upload: a .docx is read on the device, cleaned, and held to the 200 KB text cap; PDF stays refused", async () => {
  const asFile = (name, bytes) => ({
    name,
    size: bytes.length,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    text: async () => new TextDecoder().decode(bytes),
  });
  const docx = await makeDocx(SAMPLE_PARAS.map(para).join(""));
  const read = await readUpload(asFile("pond_unit.docx", docx));
  assert.equal(read.ok, true);
  assert.equal(read.source.title, "pond unit");
  assert.equal(read.source.text.startsWith("Willow Pond is a small ecosystem"), true);
  assert.match(read.source.text, /\n\n/, "paragraph breaks are kept");
  const out = compileExperience({ ...sampleInput(), source: read.source });
  assert.equal(out.ok, true, "the Word text compiles to a valid experience");

  const long = await makeDocx(para("word ".repeat(Math.ceil(MAX_UPLOAD_BYTES / 5) + 10)));
  assert.ok(long.length < MAX_DOCX_BYTES);
  const tooLong = await readUpload(asFile("long.docx", long));
  assert.equal(tooLong.ok, false);
  assert.match(tooLong.text[0], /longer than 200 KB/);
  const broken = await readUpload(asFile("broken.docx", new TextEncoder().encode("PK not really")));
  assert.match(broken.text[0], /could not be read/);
  assert.match(broken.text[1], /No se pudo leer/);
  const pdf = await readUpload(asFile("unit.pdf", new TextEncoder().encode("%PDF-1.7")));
  assert.equal(pdf.ok, false);
  assert.match(pdf.text[0], /copy and paste the text, or save it as a Word \.docx/);
  assert.equal(checkUpload({ name: "big.docx", size: MAX_DOCX_BYTES + 1 }).error, "too-large");
});

const compiled = () => compileExperience(sampleInput()).def;

test("suggestions (built in): unused source sentences, traceable, applied by ONE topic.add that stays valid", () => {
  const def = compiled();
  const items = builtInSuggestions(def);
  assert.ok(items.length >= 1 && items.length <= 6);
  for (const item of items) {
    assert.equal(item.origin, "built-in");
    assert.ok(def.characters.some((c) => c.id === item.character));
    const op = suggestionOp(def, item);
    assert.equal(op.type, "topic.add");
    const res = applyOp(def, op);
    assert.equal(res.error, undefined);
    const c = res.def.characters.find((x) => x.id === item.character);
    assert.equal(
      c.topics.length,
      def.characters.find((x) => x.id === item.character).topics.length + 1,
    );
    assert.equal(c.topics.at(-1).answer[0], item.text);
    const report = validateExperience(res.def);
    assert.equal(report.ok, true, JSON.stringify(report.errors));
    assert.equal(report.trace[`answer:${c.id}:${c.topics.at(-1).id}`].ok, true);
  }
  // a question gets the best source sentence as its answer, so it is traceable at once
  const q = {
    kind: "question",
    character: "c-expert",
    ask: "Why did the oxygen in the water drop?",
    keywords: ["oxygen"],
  };
  const op = suggestionOp(def, q);
  assert.match(op.answer, /oxygen/i);
  assert.equal(validateExperience(applyOp(def, op).def).ok, true);
});

test("suggestions (request): only text, settings and character names leave; replies are re-checked; failures fall back", async () => {
  const def = compiled();
  def.compiled.notes = "COMPILER-NOTE";
  const body = suggestBody(def, { ...sampleInput().settings, extra: "x" }, "ABC234");
  assert.deepEqual(Object.keys(body).sort(), ["code", "def", "settings", "source"]);
  assert.deepEqual(Object.keys(body.def), ["characters"]);
  assert.deepEqual(Object.keys(body.def.characters[0]).sort(), ["id", "name", "role"]);
  assert.doesNotMatch(JSON.stringify(body), /COMPILER-NOTE|"extra"/);

  const calls = [];
  const fake = (status, data) => async (url, init) => {
    calls.push({ url, init });
    return { status, ok: status < 300, json: async () => data };
  };
  const good = await requestSuggestions(def, sampleInput().settings, {
    key: "k",
    fetchImpl: fake(200, {
      ok: true,
      questions: [
        { character: "c-witness", ask: "What did the pond look like?", keywords: ["pond"] },
      ],
      lines: [
        { character: "c-expert", text: "Minnows eat the zooplankton, and herons eat the minnows." },
        { character: "c-expert", text: "A dragon drank the whole pond in one night." },
      ],
    }),
  });
  assert.equal(calls[0].url, SUGGEST_API);
  assert.equal(calls[0].init.headers["x-teacher-key"], "k");
  assert.equal(good.ok, true);
  assert.deepEqual(
    good.items.map((i) => i.kind),
    ["question", "line"],
    "the client drops the untraceable line too",
  );
  assert.equal(
    (await requestSuggestions(def, {}, { fetchImpl: fake(503, { ok: false, offline: true }) }))
      .reason,
    "offline",
  );
  assert.equal(
    (await requestSuggestions(def, {}, { fetchImpl: fake(401, { ok: false }) })).reason,
    "unauthorized",
  );
  assert.equal(
    (await requestSuggestions(def, {}, { fetchImpl: fake(429, { ok: false }) })).reason,
    "limited",
  );
  const thrown = await requestSuggestions(
    def,
    {},
    {
      fetchImpl: async () => {
        throw new Error("offline");
      },
    },
  );
  assert.equal(thrown.reason, "offline");
});
