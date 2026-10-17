#!/usr/bin/env node
// Preserve the original Reveal Word/PDF files and attach them to their lessons.
// Usage: node scripts/import-reveal-document-downloads.mjs [source-directory] [--language-support]
// --language-support imports only that folder and preserves every other download.
// --prerequisite does the same for each lesson's Prerequisite Practice folder.
// --refresh-existing updates retained bytes without changing routes or access.
// --check-existing checks that refresh without writing.
// --concept-checks snapshots the current authored conceptual tasks for labs.
// --include-new adds current Unit folders while retaining every established URL.
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { applyDocumentRefresh, planDocumentRefresh } from "./lib/reveal-document-refresh.mjs";
import {
  REVEAL_SUPPLEMENTAL_DESTINATIONS,
  UNMAPPED_REVEAL_LESSONS,
} from "./lib/worksheet-reveal.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const desktop = join(homedir(), "Desktop");
const languageOnly = process.argv.includes("--language-support");
const prerequisiteOnly = process.argv.includes("--prerequisite");
const includeNew = process.argv.includes("--include-new");
// A partial run keeps every other manifest entry and re-imports only its own folder.
const partial = languageOnly || prerequisiteOnly;
const partialFolder = languageOnly ? "/Language Support/" : "/Prerequisite Practice/";
const source =
  process.argv.slice(2).find((arg) => !arg.startsWith("--")) ||
  join(
    desktop,
    readdirSync(desktop).find((name) => name.trim() === "Reveal Math by Unit and Lesson") ||
      "Reveal Math by Unit and Lesson",
  );
if (!existsSync(source)) throw new Error("Reveal document source directory does not exist");
if (process.argv.includes("--concept-checks")) {
  const sourcePath = "Authoring/complete-concept-bank.json";
  const bytes = readFileSync(join(source, sourcePath));
  const lessons = JSON.parse(bytes.toString("utf8"));
  for (const [id, sessions] of Object.entries(lessons)) {
    if (
      !/^\d+\.\d+$/.test(id) ||
      sessions.length !== 2 ||
      sessions.some((session) => !session.check?.trim() || !session.check_key?.trim())
    )
      throw new Error(`Incomplete current conceptual checks: ${id}`);
  }
  const snapshot = {
    sourcePath,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    lessons,
  };
  writeFileSync(
    join(root, "tools/learning-labs/reveal-concept-source.json"),
    `${JSON.stringify(snapshot, null, 2)}\n`,
  );
  console.log(
    `Snapshotted ${Object.keys(lessons).length} authored two-session lesson concept sets.`,
  );
  process.exit(0);
}
// Refresh retained resources without changing their URLs or their access rules.
// Missing masters retain their existing downloadable copy and are reported.
if (process.argv.includes("--refresh-existing") || process.argv.includes("--check-existing")) {
  const path = join(root, "data/reveal-document-downloads.json");
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  const plan = planDocumentRefresh(manifest, source, root);
  const report = {
    checked: plan.checked,
    changed: plan.changes.length,
    retainedWithoutSource: plan.missing,
  };
  if (process.argv.includes("--check-existing")) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(plan.changes.length ? 1 : 0);
  }
  applyDocumentRefresh(plan);
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}
const catalog = JSON.parse(readFileSync(join(root, "data/curriculum-manifest.json"), "utf8"));
const lessonIds = new Set(catalog.lessons.map((lesson) => lesson.id));
// District 2.6 is Median and Outliers, while site 2-6 is long division.
// Its original number stays in the filename and label on the median lesson.
const supplemental = REVEAL_SUPPLEMENTAL_DESTINATIONS;
for (const id of UNMAPPED_REVEAL_LESSONS) {
  if (!supplemental[id]) throw new Error(`Reveal ${id} needs a reviewed document destination`);
}
const slug = (name) =>
  name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9.]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
const escape = (text) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }))
    .flatMap((entry) => {
      if (entry.name.startsWith(".") || entry.name.startsWith("~$")) return [];
      const file = join(dir, entry.name);
      return entry.isDirectory() ? walk(file) : /\.(docx|pdf)$/i.test(entry.name) ? [file] : [];
    });
}
const manifestPath = join(root, "data/reveal-document-downloads.json");
const documents = includeNew
  ? JSON.parse(readFileSync(manifestPath, "utf8")).documents
  : partial
    ? JSON.parse(readFileSync(manifestPath, "utf8")).documents.filter(
        (doc) => !doc.sources.some((path) => path.includes(partialFolder)),
      )
    : [];
const byIdentity = new Map(documents.map((doc) => [`${doc.filename}|${doc.sha256}`, doc]));
const destinations = new Set(documents.map((doc) => doc.url.slice(1)));
const files = walk(source).filter(
  (file) =>
    (!includeNew || /^Unit \d+\//.test(relative(source, file))) &&
    (!partial || relative(source, file).includes(partialFolder)),
);
if (partial && !files.length) throw new Error(`No files found in ${partialFolder}`);
for (const file of files) {
  const rel = relative(source, file);
  const filename = basename(file);
  const bytes = readFileSync(file);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const identity = `${filename}|${sha256}`;
  if (byIdentity.has(identity)) {
    if (!byIdentity.get(identity).sources.includes(rel)) byIdentity.get(identity).sources.push(rel);
    continue;
  }
  const unitMatch = /(?:^|\/)Unit (\d+)(?:\/|$)/.exec(rel);
  const lessonMatch =
    /(?:^|\/)Lesson (\d+)\.(\d+)(?:\/|$)/.exec(rel) ||
    /^(\d+)\.(\d+) Homework Packet\./.exec(filename);
  const sourceLesson = lessonMatch ? `${lessonMatch[1]}-${lessonMatch[2]}` : null;
  const unit = unitMatch ? Number(unitMatch[1]) : /3\.1-3\.7/.test(filename) ? 3 : null;
  const targetLesson = sourceLesson ? supplemental[sourceLesson] || sourceLesson : null;
  if (targetLesson && !lessonIds.has(targetLesson))
    throw new Error(`No curriculum lesson for ${rel}`);
  const category = /\/Language Support\//.test(rel)
    ? "language-support"
    : /Answer Key|Warm-Up Key|Teacher Key/i.test(rel)
      ? "answer-key"
      : /\/Assessments\//.test(rel) || /test\.pdf$/i.test(filename)
        ? "assessment"
        : /(?:^|\/)Prerequisite Practice\//.test(rel)
          ? "prerequisite"
          : /Homework Packets|\/HW\/|HW_Packet/.test(rel)
            ? "homework"
            : /\/Warm-Up\//.test(rel)
              ? "warm-up"
              : /\/(?:Practice|Visual Practice)\//.test(rel)
                ? "practice"
                : "guide";
  const teacherOnly = ["answer-key", "assessment", "guide"].includes(category);
  const folder = targetLesson
    ? `lessons/${targetLesson}/downloads/reveal`
    : `curriculum/reveal-documents/${unit ? `unit-${unit}` : "shared"}`;
  const destination = `${folder}/${teacherOnly ? "teacher/" : ""}${slug(filename)}`;
  if (destinations.has(destination)) {
    const retained = documents.find((doc) => doc.url === `/${destination}`);
    if (
      !includeNew ||
      retained.filename !== filename ||
      retained.unit !== unit ||
      retained.sourceLesson !== sourceLesson ||
      retained.teacherOnly !== teacherOnly
    )
      throw new Error(`Conflicting document destination: ${destination}`);
    // A master was moved into a new folder. Keep its established URL and
    // access rule, record the current source path, and refresh its bytes.
    copyFileSync(file, join(root, destination));
    retained.sha256 = sha256;
    retained.bytes = bytes.length;
    if (!retained.sources.includes(rel)) retained.sources.push(rel);
    byIdentity.set(identity, retained);
    continue;
  }
  destinations.add(destination);
  mkdirSync(dirname(join(root, destination)), { recursive: true });
  copyFileSync(file, join(root, destination));
  const title = filename.slice(0, -extname(filename).length).replace(/_/g, " ");
  const doc = {
    id: `reveal-${slug(rel)}`,
    unit,
    sourceLesson,
    targetLesson,
    filename,
    title,
    category,
    teacherOnly,
    url: `/${destination}`,
    bytes: bytes.length,
    sha256,
    sources: [rel],
  };
  documents.push(doc);
  byIdentity.set(identity, doc);
}
// A partial run appends its files last; restore the walk order so the manifest stays stable.
if (partial) {
  const byPath = (a, b) => {
    const x = a.sources[0].split("/");
    const y = b.sources[0].split("/");
    for (let i = 0; i < Math.min(x.length, y.length); i++) {
      const order = x[i].localeCompare(y[i], "en", { numeric: true });
      if (order) return order;
    }
    return x.length - y.length;
  };
  documents.sort(byPath);
}
const manifest = {
  version: 1,
  sourceFileCount: documents.reduce((sum, doc) => sum + doc.sources.length, 0),
  documents,
};
writeFileSync(
  join(root, "data/reveal-document-downloads.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

function links(docs) {
  return docs
    .map((doc) => {
      const format = extname(doc.filename).toLowerCase() === ".docx" ? "Word" : "PDF";
      const prefix = doc.teacherOnly ? "Teacher · " : "";
      return `                <a class="res reveal-document-link${doc.teacherOnly ? " hub-teacher-only" : ""}" href="${escape(doc.url)}" download="${escape(doc.filename)}" data-reveal-document="${escape(doc.category)}">${escape(`${prefix}${doc.title} · ${format}`)}</a>`;
    })
    .join("\n");
}
let html = readFileSync(join(root, "curriculum/units/index.html"), "utf8");
html = html.replace(
  partial
    ? /\n[ \t]*<!-- REVEAL-DOCUMENTS:lesson-[^>]+ -->[\s\S]*?<!-- \/REVEAL-DOCUMENTS -->/g
    : /\n[ \t]*<!-- REVEAL-DOCUMENTS:[^>]+ -->[\s\S]*?<!-- \/REVEAL-DOCUMENTS -->/g,
  "",
);
for (const id of new Set(documents.map((doc) => doc.targetLesson).filter(Boolean))) {
  const docs = documents.filter((doc) => doc.targetLesson === id);
  const anchor = new RegExp(
    `(data-search="${id} [\\s\\S]*?<div class="lesson-body">[\\s\\S]*?<div class="res-row">[\\s\\S]*?<\\/div>)`,
  );
  if (!anchor.test(html)) throw new Error(`Units browser has no row for ${id}`);
  const languageDocs = docs.filter((doc) => doc.category === "language-support");
  // Prerequisite practice gets its own group so it is not buried among the lesson sheets.
  const prerequisiteDocs = docs.filter((doc) => doc.category === "prerequisite");
  const publicDocs = docs.filter(
    (doc) =>
      !doc.teacherOnly && doc.category !== "language-support" && doc.category !== "prerequisite",
  );
  const teacherDocs = docs.filter((doc) => doc.teacherOnly);
  const prerequisiteMarkup = prerequisiteDocs.length
    ? `\n              <details class="reveal-document-downloads prerequisite-practice-downloads">\n                <summary>Prerequisite practice · Word &amp; PDF (${prerequisiteDocs.length})</summary>\n                <div class="res-row">\n${links(prerequisiteDocs)}\n                </div>\n              </details>`
    : "";
  const markup = `\n              <!-- REVEAL-DOCUMENTS:lesson-${id} -->${prerequisiteMarkup}\n              <details class="reveal-document-downloads">\n                <summary>Reveal documents · Word &amp; PDF (${publicDocs.length})</summary>\n                <div class="res-row">\n${links(publicDocs)}\n                </div>\n              </details>${languageDocs.length ? `\n              <details class="reveal-document-downloads">\n                <summary>Language support · Word &amp; PDF (${languageDocs.length})</summary>\n                <div class="res-row">\n${links(languageDocs)}\n                </div>\n              </details>` : ""}${teacherDocs.length ? `\n              <details class="reveal-document-downloads hub-teacher-only">\n                <summary>Teacher answer keys (${teacherDocs.length})</summary>\n                <div class="res-row">\n${links(teacherDocs)}\n                </div>\n              </details>` : ""}\n              <!-- /REVEAL-DOCUMENTS -->`;
  const sourceNumbers = [
    ...new Set(
      docs
        .filter((doc) => doc.sourceLesson && doc.sourceLesson !== id)
        .map((doc) => doc.sourceLesson),
    ),
  ];
  const mappedMarkup = sourceNumbers.length
    ? markup.replace(
        `<!-- REVEAL-DOCUMENTS:lesson-${id} -->`,
        (marker) =>
          `${marker}<p class="reveal-source-mapping">Source numbering: Reveal Lesson ${sourceNumbers.join(", ")} provides supplemental material for site Lesson ${id}. Original source numbers are retained in the files.</p>`,
      )
    : markup;
  html = html.replace(anchor, (match) => match + mappedMarkup);
}
for (const unit of partial
  ? []
  : new Set([1, ...documents.map((doc) => doc.unit).filter(Boolean)])) {
  const docs = documents.filter(
    (doc) => !doc.targetLesson && (doc.unit === unit || (unit === 1 && doc.unit === null)),
  );
  const anchor = new RegExp(
    `(<span class="unit-num">Unit ${unit}<\\/span>[\\s\\S]*?<div class="unit-body">)`,
  );
  if (!anchor.test(html)) throw new Error(`Units browser has no Unit ${unit}`);
  const markup = `\n          <!-- REVEAL-DOCUMENTS:unit-${unit} -->\n          <div class="unit-res reveal-document-unit-downloads">\n            <span class="unit-res-label">Reveal ${unit === 1 ? "course guides" : "unit documents"} · Word &amp; PDF</span>\n            <div class="res-row">\n${links(docs)}\n            </div>\n          </div>\n          <!-- /REVEAL-DOCUMENTS -->`;
  html = html.replace(anchor, (match) => match + markup);
}
writeFileSync(join(root, "curriculum/units/index.html"), html);
console.log(
  `Imported ${documents.length} original documents from ${manifest.sourceFileCount} source files; ${new Set(documents.map((doc) => doc.sourceLesson).filter(Boolean)).size} Reveal lessons. Exact duplicate copies share one download.`,
);
