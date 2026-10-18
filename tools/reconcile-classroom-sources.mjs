// Read all packaged classroom PowerPoints in presentation order. Never rewrite a deck.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join, posix } from "node:path";
import { JSDOM } from "jsdom";
import JSZip from "jszip";
import { loadLessonConfig, REPO_ROOT } from "./lib/curriculum-source.mjs";

const hash = (b) => createHash("sha256").update(b).digest("hex");
const load = (p) => JSON.parse(readFileSync(join(REPO_ROOT, p), "utf8"));
const manifest = load("data/reveal-document-downloads.json");
const applications = load("tools/reveal-source-applications.json");
const xml = (s) => new JSDOM(s, { contentType: "application/xml" });
const ns = "http://schemas.openxmlformats.org/presentationml/2006/main";
const relns = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const ordered = [];
const records = [];
for (const doc of manifest.documents.filter((d) => d.category === "source-slides")) {
  const bytes = readFileSync(join(REPO_ROOT, doc.url));
  assert.equal(hash(bytes), doc.sha256, doc.url);
  const zip = await JSZip.loadAsync(bytes);
  const pres = xml(await zip.file("ppt/presentation.xml").async("string"));
  const rel = xml(await zip.file("ppt/_rels/presentation.xml.rels").async("string"));
  const targets = new Map(
    [...rel.window.document.documentElement.children].map((el) => [
      el.getAttribute("Id"),
      el.getAttribute("Target"),
    ]),
  );
  const slides = [];
  for (const slide of pres.window.document.getElementsByTagNameNS(ns, "sldId")) {
    const target = targets.get(slide.getAttributeNS(relns, "id"));
    assert.ok(target);
    const part = target.startsWith("/") ? target.slice(1) : posix.normalize("ppt/" + target);
    assert.ok(zip.file(part), part);
    const raw = await zip.file(part).async("string");
    const dom = xml(raw);
    const paragraphs = [
      ...dom.window.document.getElementsByTagNameNS(
        "http://schemas.openxmlformats.org/drawingml/2006/main",
        "p",
      ),
    ]
      .map((p) =>
        [...p.getElementsByTagNameNS("*", "t")]
          .map((t) => t.textContent)
          .join("")
          .trim(),
      )
      .filter(Boolean);
    slides.push({ number: slides.length + 1, part, sha256: hash(raw), paragraphs });
    dom.window.close();
  }
  pres.window.close();
  rel.window.close();
  assert.ok(slides.length, doc.url);
  assert.equal(new Set(slides.map((s) => s.part)).size, slides.length);
  ordered.push({ source: doc.sources[0], url: doc.url, sha256: doc.sha256, slides });
  const app = applications.find((a) => doc.sources.includes(a.path));
  if (app) assert.equal(app.sourceSha256, doc.sha256, "re-extract application after a source edit");
  const config = doc.targetLesson ? loadLessonConfig(doc.targetLesson) : null;
  const concept = config?.launch?.conceptIntro;
  const examples = concept
    ? ["iDo", "weDo", "youDo"]
        .filter((k) => concept[k])
        .map((k) => ({
          role: k,
          sha256: hash(JSON.stringify(concept[k])),
          relationship:
            "Additional guided lesson example; current classroom application is identified separately",
        }))
    : [];
  const task = config?.revealWordProblem;
  records.push({
    source: doc.sources[0],
    sourceLesson: doc.sourceLesson,
    targetLesson: doc.targetLesson,
    relationship:
      doc.sourceLesson !== doc.targetLesson
        ? "Supplemental original source numbering"
        : "Same numbered lesson",
    url: doc.url,
    sha256: doc.sha256,
    slideCount: slides.length,
    orderedSlideHashes: slides.map((s) => s.sha256),
    application: app?.source
      ? {
          slide: app.source.slide_number,
          title: app.source.title,
          sourceTextSha256: hash(app.source.text),
          onlineTaskSha256: hash(JSON.stringify(task)),
          alignment:
            doc.sourceLesson === "2-6"
              ? "Supplemental median application on site 2-3"
              : "Same classroom application; online text retains complete data and accessible figure descriptions",
        }
      : null,
    onlineExamples: examples,
  });
}
assert.equal(records.length, 55);
assert.equal(
  records.reduce((n, d) => n + d.slideCount, 0),
  2591,
);
const outputs = [
  [
    "data/reveal-classroom-alignment.json",
    { version: 1, deckCount: records.length, slideCount: 2591, decks: records },
  ],
  ["tools/reveal-classroom-slide-text.json", { version: 1, decks: ordered }],
];
for (const [file, data] of outputs) {
  const value = JSON.stringify(data, null, 2) + "\n";
  if (process.argv.includes("--check"))
    assert.equal(
      readFileSync(join(REPO_ROOT, file), "utf8"),
      value,
      `${file} stale; run node tools/reconcile-classroom-sources.mjs`,
    );
  else writeFileSync(join(REPO_ROOT, file), value);
}
console.log(
  "Classroom reconciliation: 55 current decks, 2,591 ordered slides, 54 lesson sources + unit review, explicit supplemental mapping and online-example fingerprints.",
);
