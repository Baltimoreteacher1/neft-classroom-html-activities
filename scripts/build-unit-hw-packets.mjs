#!/usr/bin/env node
import { execFileSync } from "node:child_process";
// Combine each unit's per-lesson student homework packets into one printable
// unit packet (PDF + Word), and register it beside the unit's other Reveal
// documents.
//
//   node scripts/build-unit-hw-packets.mjs          build + register (idempotent)
//   node scripts/build-unit-hw-packets.mjs --check  fail if a packet or its registration is stale
//
// SOURCE OF TRUTH: lessons/<id>/downloads/reveal/<u>.<n>-homework-packet.{pdf,docx}
// (the student sheets, NOT the teacher/ copies). This script concatenates them in
// Reveal lesson order and authors no content, so a unit packet can never drift
// from its lesson packets. Output naming follows Unit 3's packet:
//   curriculum/reveal-documents/unit-<u>/reveal-math-<u>.<first>-<u>.<last>-student-hw-packet.{pdf,docx}
// Unit 3's packet is a hand-authored original: it is registered but never rebuilt.
//
// PDF: poppler `pdfunite`. Word: each lesson's body becomes its own section (so its
// footer, margins and media survive) inside the first lesson's package. Packets are
// student-facing and public on purpose (no /teacher/ path) and carry no answer keys.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { CORE_ID_RE, lessonPath, listLessonDirs } from "../tools/lib/curriculum-source.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY = join(ROOT, "data/reveal-document-downloads.json");
const UNITS_PAGE = join(ROOT, "curriculum/units/index.html");
const BUILT_UNITS = [2, 4, 5, 6, 7, 8, 9];
// Unit 3's packet predates this script; only its registration is managed here.
const REGISTER_ONLY = {
  3: [
    "Reveal Math 3.1-3.7 HW Packet/Reveal_Math_3.1-3.7_Student_HW_Packet",
    "Unit 3/Reveal_Math_3.1-3.7_Student_HW_Packet",
  ],
};
const check = process.argv.includes("--check");
const problems = [];

const range = (unit, nums) => `${unit}.${nums[0]}-${unit}.${nums.at(-1)}`;
const slugName = (unit, nums) => `reveal-math-${range(unit, nums)}-student-hw-packet`;
const lessonPacketRe = (unit) => new RegExp(`^${unit}\\.(\\d+)-homework-packet\\.docx$`);

/** Every unit's student packets from the lesson folders, keyed by Reveal number. */
function collectLessonPackets(unit) {
  const found = new Map();
  for (const dir of listLessonDirs({ filter: CORE_ID_RE })) {
    const reveal = lessonPath(dir, "downloads/reveal");
    if (!existsSync(reveal)) continue;
    for (const name of readdirSync(reveal)) {
      const match = lessonPacketRe(unit).exec(name);
      if (!match) continue;
      const num = Number(match[1]);
      const base = join(reveal, name.replace(/\.docx$/, ""));
      if (found.has(num)) throw new Error(`Unit ${unit}: lesson ${unit}.${num} packet found twice`);
      if (!existsSync(`${base}.pdf`)) throw new Error(`Missing PDF beside ${base}.docx`);
      found.set(num, base);
    }
  }
  const nums = [...found.keys()].sort((a, b) => a - b);
  if (!nums.length) throw new Error(`Unit ${unit}: no lesson packets found`);
  nums.forEach((n, i) => {
    if (n !== nums[0] + i)
      throw new Error(`Unit ${unit}: packets skip from ${nums[i - 1]} to ${n}`);
  });
  return { nums, bases: nums.map((n) => found.get(n)) };
}

const pdfText = (file) =>
  execFileSync("pdftotext", ["-layout", file, "-"], { maxBuffer: 1 << 28 }).toString();
const docxText = async (file) =>
  [
    ...(
      await JSZip.loadAsync(readFileSync(file)).then((z) =>
        z.file("word/document.xml").async("string"),
      )
    ).matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g),
  ]
    .map((m) => m[1])
    .join("");

/** Staleness is judged by content (text and section count), because rebuilt bytes differ. */
async function contentProblems(bases, stem) {
  const out = [];
  const want = bases.map((b) => pdfText(`${b}.pdf`)).join("");
  if (pdfText(`${stem}.pdf`) !== want) out.push(`${stem}.pdf no longer matches its lesson packets`);
  const wantDocx = (await Promise.all(bases.map((b) => docxText(`${b}.docx`)))).join("");
  if ((await docxText(`${stem}.docx`)) !== wantDocx)
    out.push(`${stem}.docx no longer matches its lesson packets`);
  return out;
}

function buildPdf(bases, out) {
  mkdirSync(dirname(out), { recursive: true });
  execFileSync("pdfunite", [...bases.map((b) => `${b}.pdf`), out]);
}

const RID = /(r:(?:id|embed)=")([^"]+)(")/g;
const RELS_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships";

/** Merge Word packets: one section per lesson, ids and parts renamed per lesson. */
async function buildDocx(bases, title, out) {
  const base = await JSZip.loadAsync(readFileSync(`${bases[0]}.docx`));
  const styles = await base.file("word/styles.xml").async("string");
  const merged = new JSZip();
  const rels = [];
  const overrides = [];
  const bodies = [];
  let docHead = "";
  let finalSect = "";
  for (const [i, path] of bases.entries()) {
    const zip = await JSZip.loadAsync(readFileSync(`${path}.docx`));
    const stylesHere = await zip.file("word/styles.xml").async("string");
    if (stylesHere !== styles) throw new Error(`${path}.docx has different styles; cannot merge`);
    const doc = await zip.file("word/document.xml").async("string");
    const bodyStart = doc.indexOf("<w:body>") + "<w:body>".length;
    const sectAt = doc.lastIndexOf("<w:sectPr>");
    if (sectAt < 0 || !doc.endsWith("</w:sectPr></w:body></w:document>"))
      throw new Error(`${path}.docx: unexpected end of body`);
    docHead = doc.slice(0, bodyStart);
    let content = doc.slice(bodyStart, sectAt);
    let sect = doc.slice(sectAt, doc.length - "</w:body></w:document>".length);
    const idMap = new Map();
    const tag = (id) => {
      if (!idMap.has(id)) idMap.set(id, `u${i}_${id}`);
      return idMap.get(id);
    };
    content = content.replace(RID, (_, a, id, z) => `${a}${tag(id)}${z}`);
    sect = sect.replace(RID, (_, a, id, z) => `${a}${tag(id)}${z}`);
    const relsXml = await zip.file("word/_rels/document.xml.rels").async("string");
    for (const [, id, type, target] of relsXml.matchAll(
      /<Relationship Id="([^"]+)" Type="([^"]+)" Target="([^"]+)"\/>/g,
    )) {
      if (/\/(styles|settings)$/.test(type)) continue;
      const renamed = `u${i}_${target.split("/").pop()}`;
      const newTarget = target.startsWith("media/") ? `media/${renamed}` : renamed;
      const part = `word/${newTarget}`;
      merged.file(part, await zip.file(`word/${target}`).async("nodebuffer"));
      if (/\/footer$/.test(type))
        overrides.push(
          `<Override PartName="/${part}" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>`,
        );
      rels.push(`<Relationship Id="${tag(id)}" Type="${type}" Target="${newTarget}"/>`);
    }
    if (i < bases.length - 1) {
      // Close the lesson's section inside its trailing (empty) paragraph so the
      // join adds no blank page.
      if (!content.endsWith("</w:pPr></w:p>"))
        throw new Error(`${path}.docx: last body paragraph is not an empty pPr paragraph`);
      content = `${content.slice(0, -"</w:pPr></w:p>".length)}${sect}</w:pPr></w:p>`;
    } else {
      finalSect = sect;
    }
    bodies.push(content);
  }
  const contentTypes = (await base.file("[Content_Types].xml").async("string")).replace(
    "</Types>",
    `${overrides.join("")}</Types>`,
  );
  const baseRels = (await base.file("word/_rels/document.xml.rels").async("string"))
    .match(/<Relationship [^>]*\/>/g)
    .filter((r) => /\/(styles|settings)"/.test(r));
  merged.file(
    "[Content_Types].xml",
    contentTypes.replace(/<Override PartName="\/word\/footer1\.xml"[^>]*\/>/, ""),
  );
  merged.file("_rels/.rels", await base.file("_rels/.rels").async("nodebuffer"));
  merged.file("word/styles.xml", styles);
  merged.file("word/settings.xml", await base.file("word/settings.xml").async("nodebuffer"));
  merged.file(
    "word/_rels/document.xml.rels",
    `${RELS_HEAD}<Relationships xmlns="${REL_NS}">${[...baseRels, ...rels].join("")}</Relationships>`,
  );
  merged.file(
    "word/document.xml",
    `${docHead}${bodies.join("")}${finalSect}</w:body></w:document>`,
  );
  const core = (await base.file("docProps/core.xml").async("string")).replace(
    /<dc:title>[^<]*<\/dc:title>/,
    `<dc:title>${title}</dc:title>`,
  );
  merged.file("docProps/core.xml", core);
  merged.file("docProps/app.xml", await base.file("docProps/app.xml").async("nodebuffer"));
  const buffer = await merged.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    // Fixed timestamps keep rebuilds byte-identical.
    platform: "UNIX",
  });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buffer);
}

const escape = (text) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function registryEntry(unit, nums, ext, sources) {
  const rel = `curriculum/reveal-documents/unit-${unit}/${slugName(unit, nums)}.${ext}`;
  const bytes = readFileSync(join(ROOT, rel));
  const label = `Reveal Math ${range(unit, nums)} Student HW Packet`;
  return {
    id: `reveal-unit-${unit}-student-hw-packet.${ext}`,
    unit,
    sourceLesson: null,
    targetLesson: null,
    filename: `${label.replace(/ /g, "_")}.${ext}`,
    title: label,
    category: "homework",
    teacherOnly: false,
    url: `/${rel}`,
    bytes: bytes.length,
    sha256: sha(bytes),
    sources,
  };
}

function linkLine(doc) {
  const format = doc.url.endsWith(".docx") ? "Word" : "PDF";
  return `                <a class="res reveal-document-link" href="${escape(doc.url)}" download="${escape(doc.filename)}" data-reveal-document="${doc.category}">${escape(`${doc.title} · ${format}`)}</a>`;
}

const isUnitPacket = (doc) => /-student-hw-packet\.(docx|pdf)$/.test(doc.url);

function register(entriesByUnit) {
  const manifest = JSON.parse(readFileSync(REGISTRY, "utf8"));
  const kept = manifest.documents.filter((doc) => !isUnitPacket(doc));
  const documents = [];
  const placed = new Set();
  for (const doc of kept) {
    // Public packets lead their unit's list, ahead of the teacher documents.
    if (doc.unit && !doc.targetLesson && entriesByUnit.has(doc.unit) && !placed.has(doc.unit)) {
      documents.push(...entriesByUnit.get(doc.unit));
      placed.add(doc.unit);
    }
    documents.push(doc);
  }
  for (const unit of entriesByUnit.keys())
    if (!placed.has(unit)) throw new Error(`Registry has no unit-level documents for Unit ${unit}`);
  const next = {
    version: manifest.version,
    sourceFileCount: documents.reduce((sum, doc) => sum + doc.sources.length, 0),
    documents,
  };
  return { next, text: `${JSON.stringify(next, null, 2)}\n` };
}

function updateUnitsPage(html, entriesByUnit) {
  let out = html;
  for (const [unit, docs] of entriesByUnit) {
    const block = new RegExp(
      `(<!-- REVEAL-DOCUMENTS:unit-${unit} -->\\n[^\\n]*\\n[^\\n]*\\n[^\\n]*<div class="res-row">\\n)((?:[^\\n]*\\n)*?)([ \\t]*<\\/div>\\n[ \\t]*<\\/div>\\n[ \\t]*<!-- \\/REVEAL-DOCUMENTS -->)`,
    );
    if (!block.test(out))
      throw new Error(`Units page has no Reveal documents block for Unit ${unit}`);
    out = out.replace(block, (_, head, rows, tail) => {
      const rest = rows.split("\n").filter((line) => line && !line.includes("-student-hw-packet."));
      return `${head}${[...docs.map(linkLine), ...rest].join("\n")}\n${tail}`;
    });
  }
  return out;
}

const entriesByUnit = new Map();
for (const unit of BUILT_UNITS) {
  const { nums, bases } = collectLessonPackets(unit);
  const stem = join(ROOT, `curriculum/reveal-documents/unit-${unit}/${slugName(unit, nums)}`);
  const title = `Reveal Math ${range(unit, nums)} Student HW Packet`;
  const sources = bases.flatMap((b) => [`${relative(ROOT, b)}.docx`, `${relative(ROOT, b)}.pdf`]);
  if (check) {
    const stale = [];
    for (const ext of ["pdf", "docx"])
      if (!existsSync(`${stem}.${ext}`)) stale.push(`${stem}.${ext} missing`);
    if (!stale.length) stale.push(...(await contentProblems(bases, stem)));
    problems.push(...stale);
    if (stale.length) continue;
  } else {
    buildPdf(bases, `${stem}.pdf`);
    await buildDocx(bases, title, `${stem}.docx`);
  }
  entriesByUnit.set(unit, [
    registryEntry(
      unit,
      nums,
      "docx",
      sources.filter((s) => s.endsWith(".docx")),
    ),
    registryEntry(
      unit,
      nums,
      "pdf",
      sources.filter((s) => s.endsWith(".pdf")),
    ),
  ]);
}
for (const [unit, sources] of Object.entries(REGISTER_ONLY)) {
  const nums = [1, 2, 3, 4, 5, 6, 7];
  const names = ["docx", "pdf"].map((ext) => {
    const entry = registryEntry(
      Number(unit),
      nums,
      ext,
      sources.map((s) => `${s}.${ext}`),
    );
    return { ...entry, filename: `${sources[0].split("/").pop()}.${ext}` };
  });
  entriesByUnit.set(Number(unit), names);
}

const { text } = register(entriesByUnit);
const page = updateUnitsPage(readFileSync(UNITS_PAGE, "utf8"), entriesByUnit);
if (check) {
  if (readFileSync(REGISTRY, "utf8") !== text)
    problems.push("data/reveal-document-downloads.json is stale");
  if (readFileSync(UNITS_PAGE, "utf8") !== page)
    problems.push("curriculum/units/index.html is stale");
  if (problems.length) {
    console.error(
      `build-unit-hw-packets --check failed:\n${problems.map((p) => `  - ${p}`).join("\n")}`,
    );
    process.exit(1);
  }
  console.log("unit homework packets: registered and current");
} else {
  writeFileSync(REGISTRY, text);
  writeFileSync(UNITS_PAGE, page);
  console.log(`Built and registered ${entriesByUnit.size} unit student homework packets.`);
}
