// Activity Studio Word export: real editable content (headings, numbered questions, tables, borders as answer
// lines, page breaks, header/footer, language, core properties, alt text), no answers in the student part, and a
// LibreOffice round trip to PDF (skipped with a message when `soffice` is not installed).
//   node --test tools/studio-docx.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import JSZip from "jszip";
import { answerText, tableBlanks } from "../access-practice-lab/src/studio/core/check.js";
import { allFormats } from "../access-practice-lab/src/studio/core/fixtures.js";
import { normalizeActivity, questionsOf } from "../access-practice-lab/src/studio/core/schema.js";
import {
  richWorksheet,
  sentinelWorksheet,
} from "../access-practice-lab/src/studio/print/fixtures.js";
import { buildDocx } from "../functions/_lib/studio/docx.js";

const squash = (s) => String(s).replace(/\s+/g, "").replace(/⁄/g, "/");
const plainFrac = (s) => String(s).replace(/\{(-?[^{}/\s]+)\/([^{}/\s]+)\}/g, "$1/$2");
const unxml = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

async function open(bytes) {
  const zip = await JSZip.loadAsync(bytes);
  const xml = await zip.file("word/document.xml").async("string");
  const paragraphs = xml
    .split("</w:p>")
    .map((p) =>
      unxml([...p.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("")),
    );
  const tables = [...xml.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)].map((m) =>
    unxml([...m[0].matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((x) => x[1]).join(" ")),
  );
  return { zip, xml, paragraphs, tables, text: paragraphs.join("\n") };
}
const has = (text, needle) => squash(text).includes(squash(plainFrac(needle)));

const fixture = allFormats("worksheet");

describe("Word export structure", () => {
  test("student part: headings, numbered questions, real tables, glyphs, no page break", async () => {
    const doc = await open(await buildDocx(fixture, { part: "student", lang: "en" }));
    assert.ok(doc.xml.includes('<w:pStyle w:val="Title"/>'), "title style");
    assert.ok(doc.xml.includes('<w:pStyle w:val="Heading2"/>'), "heading style");
    // questions are a real numbered list: one numPr per question
    assert.equal((doc.xml.match(/<w:numPr>/g) || []).length, questionsOf(fixture).length);
    assert.ok(doc.zip.file("word/numbering.xml"));
    for (const q of questionsOf(fixture))
      assert.ok(has(doc.text, q.prompt), `prompt present: ${q.prompt}`);
    // editable runs: every prompt sits in w:t text, not an image
    assert.equal(
      (doc.xml.match(/<w:drawing>/g) || []).length,
      1,
      "only the hotspot picture is an image",
    );
    // real tables for match, sort, fillTable, plus number line, grid and writing lines
    const tableWith = (...words) => doc.tables.find((t) => words.every((w) => t.includes(w)));
    assert.ok(tableWith("unit rate", "compares two amounts"), "match table");
    assert.ok(tableWith("Even", "Odd"), "sort table");
    assert.ok(tableWith("Cups of flour", "Cookies", "12"), "fillTable table");
    assert.ok(tableWith("Step 1", "2 + 3 × 4"), "error steps table");
    assert.ok(doc.tables.length >= 9, `${doc.tables.length} tables`);
    assert.ok(doc.text.includes("○") && doc.text.includes("☐"), "bubble and checkbox glyphs");
    assert.ok(!/w:type="page"/.test(doc.xml), "student part has no page break");
    assert.match(doc.text, /Name: _+/);
    assert.match(doc.xml, /w:vertAlign w:val="superscript"/);
    assert.match(doc.xml, /w:vertAlign w:val="subscript"/);
    assert.ok(doc.text.includes("⁄"), "fraction slash");
  });

  test("key and all parts; page break before the teacher copy", async () => {
    const key = await open(await buildDocx(fixture, { part: "key" }));
    assert.match(key.text, /TEACHER COPY/);
    assert.ok(!/w:type="page"/.test(key.xml));
    for (const q of questionsOf(fixture)) {
      if (q.format === "short") assert.ok(has(key.text, q.sample));
      else if (q.format === "fillTable")
        for (const c of tableBlanks(q)) assert.ok(has(key.text, c.answer));
      else
        for (const frag of answerText(q)
          .split(/; | \| | → |, /)
          .filter(Boolean))
          assert.ok(has(key.text, frag), `${q.id}: ${frag}`);
      if (q.explanation) assert.ok(has(key.text, q.explanation), `${q.id} explanation`);
    }
    assert.match(key.text, /Watch for students who add instead of multiply/);
    const all = await open(await buildDocx(fixture, { part: "all" }));
    assert.ok(/<w:br w:type="page"\/>/.test(all.xml), "explicit page break");
    const at = all.xml.indexOf('w:type="page"');
    assert.ok(all.xml.indexOf("TEACHER COPY") > at, "teacher copy follows the break");
    assert.ok(
      !/The passage says seeds need water and sun/.test(all.xml.slice(0, at)),
      "no key before the break",
    );
    // the key's numbering restarts at 1 (its own list instance)
    const nums = [...all.xml.matchAll(/<w:numId w:val="(\d+)"\/>/g)].map((m) => m[1]);
    assert.equal(new Set(nums).size, 2);
  });

  test("header, footer with page numbers, language and core properties", async () => {
    for (const [lang, code] of [
      ["en", "en-US"],
      ["es", "es-US"],
      ["bi", "en-US"],
    ]) {
      const doc = await open(await buildDocx(fixture, { part: "student", lang }));
      const styles = await doc.zip.file("word/styles.xml").async("string");
      assert.ok(styles.includes(`w:lang w:val="${code}"`), `${lang} language ${code}`);
      const header = await doc.zip.file("word/header1.xml").async("string");
      assert.ok(header.includes("All question types"));
      const footer = await doc.zip.file("word/footer1.xml").async("string");
      assert.match(footer, /PAGE/);
      assert.match(footer, /NUMPAGES/);
      const core = await doc.zip.file("docProps/core.xml").async("string");
      assert.match(core, /<dc:title>All question types<\/dc:title>/);
      assert.match(core, /<dc:creator>The Language Page<\/dc:creator>/);
    }
  });

  test("Spanish and bilingual chrome; practice text stays English", async () => {
    const es = await open(await buildDocx(richWorksheet(), { part: "student", lang: "es" }));
    for (const w of [
      "Nombre",
      "Fecha",
      "Palabras clave",
      "Instrucciones",
      "Escribe tu respuesta en la línea",
    ])
      assert.ok(es.text.includes(w), w);
    assert.ok(es.text.includes("What is the ratio of flour to sugar?"));
    assert.ok(es.text.includes("razón"), "gloss from vocab es");
    const bi = await open(await buildDocx(richWorksheet(), { part: "student", lang: "bi" }));
    assert.ok(bi.text.includes("Name / Nombre") && bi.text.includes("Date / Fecha"));
    const noGloss = await open(
      await buildDocx(
        richWorksheet({ supports: { spanish: false, visuals: true, frames: true } }),
        { part: "student", lang: "es" },
      ),
    );
    assert.ok(!noGloss.text.includes("razón"));
  });

  test("images: data URLs embed with alt text; same-site paths become a visible placeholder", async () => {
    const doc = await open(await buildDocx(richWorksheet(), { part: "student" }));
    assert.match(doc.xml, /descr="A sunny field"/);
    assert.match(doc.xml, /descr="A field with a sun"/);
    assert.match(doc.xml, /descr="A cake"/);
    assert.ok((doc.xml.match(/<w:drawing>/g) || []).length >= 3);
    const files = Object.keys(doc.zip.files).filter((f) => f.startsWith("word/media/"));
    assert.ok(files.length >= 1);
    const sameSite = normalizeActivity({
      id: "p",
      title: "Paths",
      blocks: [{ type: "image", src: "/img/pond.png", alt: "A pond", caption: "Pond" }],
    });
    const p = await open(await buildDocx(sameSite, { part: "student" }));
    assert.ok(!/<w:drawing>/.test(p.xml));
    assert.ok(p.text.includes("[Picture not included: A pond]"));
    const none = await open(await buildDocx(sentinelWorksheet(), { part: "student" }));
    assert.ok(!/<w:drawing>/.test(none.xml), "no drawing without an image");
  });

  test("organizers, vocabulary, tables, math and audio blocks are present", async () => {
    const doc = await open(await buildDocx(richWorksheet(), { part: "student" }));
    for (const w of [
      "What I know",
      "What I want to know",
      "Ratio",
      "Both",
      "Cause",
      "More flour",
      "Claim",
      "Ana is right",
      "Evidence 1",
      "Reasoning",
      "Mix",
      "Bake",
      "Part A: Ratios",
      "The Bake Sale",
      "Key words",
      "60 miles per hour",
      "Recipe",
      "Sentence starter: Both amounts are ___ by ___.",
    ])
      assert.ok(has(doc.text, w) || doc.tables.some((t) => has(t, w)), w);
    assert.ok(has(doc.text, "3/4 + 1/8 = x2") || has(doc.text, "3/4 + 1/8 = x"), "math block");
    assert.ok(doc.text.includes("Your teacher will read this aloud"));
    assert.ok(
      !doc.text.includes("Ana mixes flour with sugar. Listen for the ratio."),
      "read-aloud script is teacher-only",
    );
  });
});

describe("the student part never carries answers", () => {
  for (const lang of ["en", "es", "bi"]) {
    test(`fixtures (${lang})`, async () => {
      for (const act of [fixture, richWorksheet(), sentinelWorksheet()]) {
        const doc = await open(await buildDocx(act, { part: "student", lang }));
        const text = doc.text + doc.tables.join("\n");
        assert.ok(!/TEACHER COPY|Answer key/i.test(text));
        for (const q of questionsOf(act)) {
          const printedHere = squash(
            plainFrac(
              JSON.stringify({
                ...q,
                answer: undefined,
                answers: undefined,
                explanation: undefined,
                hint: undefined,
                sample: undefined,
                misconception: undefined,
                rubric: undefined,
                accept: undefined,
              }),
            ),
          );
          for (const frag of [answerText(q), ...answerText(q).split(/; | \| | → |, /)]
            .map((x) => x.trim())
            .filter((x) => x.length >= 4)) {
            if (
              !printedHere.includes(squash(plainFrac(frag))) &&
              !squash(plainFrac(JSON.stringify(questionsOf(act).map((x) => x.prompt)))).includes(
                squash(plainFrac(frag)),
              )
            )
              assert.ok(!has(text, frag), `${act.id}/${q.id} printed answer "${frag}"`);
          }
          for (const field of [
            q.explanation,
            q.hint,
            q.sample,
            q.misconception,
            ...(q.rubric ?? []),
          ].filter(Boolean))
            assert.ok(!has(text, field), `${q.id}: ${field}`);
        }
        for (const note of [
          act.notes.teacher,
          ...act.notes.misconceptions,
          ...act.blocks.filter((b) => b.type === "note").map((b) => b.text),
          ...act.blocks.filter((b) => b.type === "audio").map((b) => b.say),
        ].filter(Boolean))
          assert.ok(!has(text, note), `note printed: ${note}`);
      }
      const xml = (await open(await buildDocx(sentinelWorksheet(), { part: "student", lang }))).xml;
      assert.ok(
        !/ZQ|zqalpha|zqbeta|zqalt|zqcell|98765|7\/8|0\.875/i.test(xml),
        "sentinel answers absent from document.xml",
      );
    });
  }
});

// ── LibreOffice round trip ───────────────────────────────────────────────────

const which = (cmd) => spawnSync("which", [cmd]).status === 0;

function convert(docxPath, outDir, profile) {
  for (let attempt = 0; attempt < 2; attempt++) {
    spawnSync(
      "soffice",
      [
        `-env:UserInstallation=file://${profile}`,
        "--headless",
        "--convert-to",
        "pdf",
        "--outdir",
        outDir,
        docxPath,
      ],
      { timeout: 180000, encoding: "utf8" },
    );
    const pdf = join(
      outDir,
      `${docxPath
        .split("/")
        .at(-1)
        .replace(/\.docx$/, "")}.pdf`,
    );
    if (existsSync(pdf) && statSync(pdf).size > 0) return pdf;
  }
  return null;
}

describe("LibreOffice renders the Word files", () => {
  test("docx -> pdf: pages, text and a page image for student, key and all", async (t) => {
    if (!which("soffice")) return t.skip("SKIP: soffice (LibreOffice) is not on PATH");
    if (!which("pdfinfo") || !which("pdftotext") || !which("pdftoppm"))
      return t.skip("SKIP: poppler tools are not installed");
    const dir = mkdtempSync(join(tmpdir(), "studio-docx-"));
    const profile = join(dir, "profile");
    for (const [name, act, part] of [
      ["student", fixture, "student"],
      ["key", fixture, "key"],
      ["all", fixture, "all"],
      ["rich", richWorksheet(), "student"],
    ]) {
      const file = join(dir, `${name}.docx`);
      writeFileSync(file, await buildDocx(act, { part }));
      const pdf = convert(file, dir, profile);
      assert.ok(pdf, `${name}: LibreOffice produced no PDF`);
      const pages = Number(
        /Pages:\s+(\d+)/.exec(spawnSync("pdfinfo", [pdf], { encoding: "utf8" }).stdout)[1],
      );
      assert.ok(pages >= (name === "key" ? 2 : 3) && pages <= 12, `${name}: ${pages} pages`);
      const text = spawnSync("pdftotext", ["-layout", pdf, "-"], { encoding: "utf8" }).stdout;
      for (const q of questionsOf(act).slice(0, 8)) {
        if (!/[{^]/.test(q.prompt))
          assert.ok(
            squash(text).includes(squash(q.prompt).slice(0, 20)),
            `${name}: "${q.prompt}" missing from the PDF`,
          );
      }
      assert.match(text, /Page \d+ \/ \d+/);
      if (name === "all") assert.match(text, /TEACHER COPY — Answer key/);
      const png = join(dir, `${name}-page`);
      spawnSync("pdftoppm", ["-r", "60", "-png", "-f", "1", "-l", "1", pdf, png]);
      const made = [`${png}-1.png`, `${png}-01.png`].find((f) => existsSync(f));
      assert.ok(made && statSync(made).size > 4000, `${name}: page image rendered`);
      if (process.env.STUDIO_KEEP_RENDERS) console.log(`kept ${dir}`);
    }
  });
});
