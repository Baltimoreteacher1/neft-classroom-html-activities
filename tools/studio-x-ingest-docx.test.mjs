// Source material workspace, Word files: structure, pictures reported by count, and refusal of corrupt, encrypted,
// oversized and zip-bomb files.
//   node --test tools/studio-x-ingest-docx.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
} from "docx";
import JSZip from "jszip";
import { buildActivityFromIngest } from "../access-practice-lab/src/studio/x/ingest.js";
import { ingestDocx } from "../access-practice-lab/src/studio/x/ingest-docx.js";

const ofType = (r, t) => r.blocks.filter((b) => b.type === t);
const codes = (r) => r.review.map((x) => x.code);
const newId = () => "s0123456789";
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

// ── Word files ──────────────────────────────────────────────────────────────

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const para = (text, { style = "", num = null } = {}) =>
  `<w:p><w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ""}${
    num ? `<w:numPr><w:ilvl w:val="${num[1]}"/><w:numId w:val="${num[0]}"/></w:numPr>` : ""
  }</w:pPr><w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
const rawPara = (xml) => `<w:p><w:r><w:t>${xml}</w:t></w:r></w:p>`;
const table = (rows) =>
  `<w:tbl><w:tblPr><w:tblStyle w:val="Grid"/></w:tblPr>${rows
    .map((r) => `<w:tr>${r.map((c) => `<w:tc>${para(c)}</w:tc>`).join("")}</w:tr>`)
    .join("")}</w:tbl>`;
const picture = `<w:p><w:r><w:drawing><wp:inline><a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:embed="rId9"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
const NUMBERING = `<w:numbering>
<w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="decimal"/></w:lvl><w:lvl w:ilvl="1"><w:numFmt w:val="lowerLetter"/></w:lvl></w:abstractNum>
<w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/></w:lvl></w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>`;

async function makeDocx(body, { numbering = NUMBERING, zip = new JSZip() } = {}) {
  zip.file("[Content_Types].xml", "<Types/>");
  zip.file(
    "word/document.xml",
    `<?xml version="1.0"?><w:document xmlns:w="w"><w:body>${body}</w:body></w:document>`,
  );
  if (numbering) zip.file("word/numbering.xml", numbering);
  zip.file(
    "word/_rels/document.xml.rels",
    '<Relationships><Relationship Id="rId9" Target="https://example.com/x.png" TargetMode="External"/></Relationships>',
  );
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

test("a DOCX with a heading, a numbered list with lettered choices, tables and pictures", async () => {
  const bytes = await makeDocx(
    [
      para("Photosynthesis Quiz", { style: "Heading1" }),
      para("Which gas do plants take in?", { num: [1, 0] }),
      para("Oxygen", { num: [1, 1] }),
      para("Carbon dioxide ✓", { num: [1, 1] }),
      para("What do plants make?", { num: [1, 0] }),
      para("Sugar", { num: [1, 1] }),
      para("Sand", { num: [1, 1] }),
      para("Answer: a"),
      para("Key words", { style: "Heading2" }),
      table([
        ["Word", "Meaning"],
        ["root", "takes in water"],
        ["leaf", "makes food"],
      ]),
      para("Data", { style: "Heading2" }),
      table([
        ["Part", "Count", "Unit"],
        ["leaf", "12", "each"],
      ]),
      para("Materials", { style: "Heading2" }),
      para("paper", { num: [2, 0] }),
      para("tape", { num: [2, 0] }),
      picture,
      picture,
    ].join(""),
  );
  const r = await ingestDocx(bytes, { filename: "quiz.docx" });
  assert.equal(r.ok, true, JSON.stringify(r.error));
  assert.deepEqual(
    r.blocks.filter((b) => b.type === "heading").map((b) => [b.text, b.level]),
    [
      ["Photosynthesis Quiz", 1],
      ["Key words", 2],
      ["Data", 2],
      ["Materials", 2],
    ],
  );
  const qs = ofType(r, "question");
  assert.equal(qs.length, 2);
  assert.deepEqual(
    qs.map((q) => q.answer),
    ["o2", "o1"],
  );
  assert.equal(qs[1].options[0].text, "Sugar", "lettering restarts under each question");
  const vocab = ofType(r, "vocab")[0];
  assert.deepEqual(
    vocab.items.map((i) => i.term),
    ["root", "leaf"],
  );
  const tbl = ofType(r, "table")[0];
  assert.deepEqual(tbl.headers, ["Part", "Count", "Unit"]);
  assert.deepEqual(ofType(r, "list")[0].items, ["paper", "tape"]);
  assert.equal(r.provenance.images, 2);
  assert.equal(r.provenance.type, "docx");
  assert.equal(r.provenance.bytes, bytes.length);
  const img = r.review.find((x) => x.code === "images");
  assert.match(img.reason.en, /2 pictures/);
  assert.match(img.reason.es, /2 imágenes/);
  assert.equal(
    JSON.stringify(r).includes("example.com"),
    false,
    "external relationships are ignored",
  );

  const built = buildActivityFromIngest(r, { kind: "check", template: "skill-check" }, { newId });
  assert.equal(built.ok, true, JSON.stringify(built.validation?.errors));
  const blocks = built.activity.blocks;
  assert.ok(blocks.some((b) => b.type === "table"));
  assert.ok(blocks.some((b) => b.type === "text" && b.role === "heading"));
  assert.equal(built.activity.title, "Photosynthesis Quiz");
});

test("a real Word file written by the docx package reads the same way", async () => {
  const cell = (t) => new TableCell({ children: [new Paragraph(t)] });
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "q",
          levels: [
            { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT },
            {
              level: 1,
              format: LevelFormat.LOWER_LETTER,
              text: "%2)",
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    sections: [
      {
        children: [
          new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Real Quiz" }),
          new Paragraph({ text: "Which is prime?", numbering: { reference: "q", level: 0 } }),
          new Paragraph({ text: "4", numbering: { reference: "q", level: 1 } }),
          new Paragraph({ text: "7 ✓", numbering: { reference: "q", level: 1 } }),
          new Paragraph({ text: "Which is even?", numbering: { reference: "q", level: 0 } }),
          new Paragraph({ text: "3", numbering: { reference: "q", level: 1 } }),
          new Paragraph({ text: "8 ✓", numbering: { reference: "q", level: 1 } }),
          new Table({
            rows: [
              new TableRow({ children: [cell("Term"), cell("Definition")] }),
              new TableRow({ children: [cell("prime"), cell("only two factors")] }),
              new TableRow({ children: [cell("even"), cell("divisible by 2")] }),
            ],
          }),
          new Paragraph({
            children: [
              new ImageRun({
                type: "png",
                data: PNG,
                transformation: { width: 10, height: 10 },
                altText: { name: "dot", description: "dot", title: "dot" },
              }),
            ],
          }),
        ],
      },
    ],
  });
  const r = await ingestDocx(await Packer.toBuffer(doc), { filename: "real.docx" });
  assert.equal(r.ok, true, JSON.stringify(r.error));
  assert.deepEqual(
    ofType(r, "question").map((q) => [q.prompt, q.answer]),
    [
      ["Which is prime?", "o2"],
      ["Which is even?", "o2"],
    ],
  );
  assert.equal(ofType(r, "vocab")[0].items.length, 2);
  assert.equal(r.provenance.images, 1);
  assert.ok(r.blocks.some((b) => b.type === "heading" && b.text === "Real Quiz"));
});

test("DOCX tables with uneven rows are flagged", async () => {
  const bytes = await makeDocx(
    table([
      ["A", "B", "C"],
      ["1", "2"],
      ["3", "4", "5"],
    ]),
    { numbering: "" },
  );
  const r = await ingestDocx(bytes);
  assert.ok(codes(r).includes("uneven-columns"));
});

// ── unsafe or unreadable files ──────────────────────────────────────────────

const refused = (r, code) => {
  assert.equal(r.ok, false);
  assert.equal(r.code, code);
  assert.ok(r.error.en && r.error.es && r.error.en !== r.error.es);
};

test("corrupt, empty, truncated and non-zip input is refused with a clear error", async () => {
  refused(await ingestDocx(new Uint8Array()), "no-file");
  refused(await ingestDocx(undefined), "no-file");
  refused(await ingestDocx(new TextEncoder().encode("just some text, not a zip")), "corrupt");
  const good = await makeDocx(para("hello there"));
  refused(await ingestDocx(good.slice(0, Math.floor(good.length / 2))), "corrupt");
  const plain = new JSZip();
  plain.file("readme.txt", "hi");
  refused(await ingestDocx(await plain.generateAsync({ type: "uint8array" })), "not-word");
  refused(await ingestDocx(await makeDocx("<w:p></w:p>")), "empty");
});

test("an OLE container (password-protected Word or an old .doc) is refused", async () => {
  const ole = new Uint8Array(2048);
  ole.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  refused(await ingestDocx(ole), "encrypted");
});

test("a zip entry flagged as encrypted is refused", async () => {
  const bytes = await makeDocx(para("hello there"));
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < bytes.length - 8; i++) {
    if (dv.getUint32(i, true) === 0x04034b50)
      dv.setUint16(i + 6, dv.getUint16(i + 6, true) | 1, true);
    if (dv.getUint32(i, true) === 0x02014b50)
      dv.setUint16(i + 8, dv.getUint16(i + 8, true) | 1, true);
  }
  refused(await ingestDocx(bytes), "encrypted");
});

const bombDocx = async (mb = 30) => {
  const filler = "a".repeat(1024 * 1024);
  const zip = new JSZip();
  zip.file("[Content_Types].xml", "<Types/>");
  zip.file(
    "word/document.xml",
    `<w:document><w:body><w:p><w:r><w:t>${filler.repeat(mb)}</w:t></w:r></w:p></w:body></w:document>`,
  );
  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
};

test("a zip bomb (30 MB of XML in a few KB) is refused before it is expanded", async () => {
  const bytes = await bombDocx();
  assert.ok(bytes.length < 200 * 1024, `fixture is small (${bytes.length} bytes)`);
  refused(await ingestDocx(bytes), "zip-bomb");
});

test("a zip that LIES about its decompressed size is still stopped by the running cap", async () => {
  const bytes = await bombDocx(6);
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let lied = 0;
  for (let i = 0; i < bytes.length - 30; i++)
    if (dv.getUint32(i, true) === 0x02014b50 && dv.getUint32(i + 24, true) > 1024 * 1024) {
      dv.setUint32(i + 24, 4096, true);
      lied++;
    }
  assert.equal(lied, 1);
  const r = await ingestDocx(bytes, { limits: { documentBytes: 2 * 1024 * 1024 } });
  refused(r, "zip-bomb");
});

test("too many entries, an oversized input and XML entity tricks are refused", async () => {
  const many = new JSZip();
  many.file("word/document.xml", "<w:document/>");
  for (let i = 0; i < 40; i++) many.file(`x/${i}.txt`, "x");
  refused(
    await ingestDocx(await many.generateAsync({ type: "uint8array" }), { limits: { entries: 20 } }),
    "zip-bomb",
  );
  refused(
    await ingestDocx(await makeDocx(para("hello")), { limits: { inputBytes: 100 } }),
    "too-big",
  );
  const evil = '<!DOCTYPE d [<!ENTITY a "aaaa"><!ENTITY b "&a;&a;&a;">]>';
  const zip = new JSZip();
  zip.file("word/document.xml", `${evil}<w:document><w:body>${para("&b;")}</w:body></w:document>`);
  refused(await ingestDocx(await zip.generateAsync({ type: "uint8array" })), "unsafe-xml");
});

test("XML entities in text are decoded, never expanded or evaluated", async () => {
  const r = await ingestDocx(
    await makeDocx(
      rawPara("fish &amp; chips - a meal &#x41;&#66; &lt;b&gt;") +
        rawPara("tea - a hot drink &amp;&amp; more"),
    ),
  );
  assert.equal(r.ok, true);
  const text = JSON.stringify(r.blocks);
  assert.match(text, /fish & chips/);
  assert.match(text, /AB <b>/);
});
