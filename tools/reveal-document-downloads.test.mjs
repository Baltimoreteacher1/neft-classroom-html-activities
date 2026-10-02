import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { isTeacherSurface } from "../functions/_lib/teacher-surface.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  readFileSync(join(root, "data/reveal-document-downloads.json"), "utf8"),
);
const bulk = JSON.parse(readFileSync(join(root, "data/curriculum-download-manifest.json"), "utf8"));
const resources = bulk.units.flatMap((unit) => [
  ...unit.resources,
  ...unit.lessons.flatMap((lesson) => lesson.resources),
]);
const staticDom = new JSDOM(readFileSync(join(root, "curriculum/units/index.html"), "utf8"));
assert.equal(manifest.sourceFileCount, 571);
assert.equal(manifest.documents.length, 569);
assert.equal(
  manifest.documents.reduce((sum, doc) => sum + doc.sources.length, 0),
  571,
);
assert.equal(new Set(manifest.documents.map((doc) => doc.url)).size, 569);
assert.equal(new Set(manifest.documents.map((doc) => doc.sourceLesson).filter(Boolean)).size, 54);
for (const doc of manifest.documents) {
  const bytes = readFileSync(
    join(root, process.argv.includes("--dist") ? "dist" : "", doc.url.slice(1)),
  );
  assert.equal(bytes.length, doc.bytes, doc.url);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), doc.sha256, doc.url);
  assert.equal(isTeacherSurface(doc.url), doc.teacherOnly, doc.url);
  const links = [...staticDom.window.document.querySelectorAll("a[data-reveal-document]")].filter(
    (a) => a.getAttribute("href") === doc.url,
  );
  assert.ok(links.length, `discoverable original: ${doc.url}`);
  for (const link of links) {
    assert.equal(link.getAttribute("download"), doc.filename);
    if (doc.targetLesson)
      assert.ok(
        link
          .closest("details.lesson")
          .getAttribute("data-search")
          .startsWith(`${doc.targetLesson} `),
      );
  }
  const entries = resources.filter((resource) => resource.url === doc.url);
  assert.ok(entries.length, `bulk download inventory: ${doc.url}`);
  for (const entry of entries) {
    assert.equal(entry.type, "reveal-document");
    assert.equal(Boolean(entry.teacherOnly), doc.teacherOnly);
    assert.equal(entry.delivery, doc.teacherOnly ? "link" : "file");
    if (doc.teacherOnly) assert.equal(entry.file ?? null, null);
  }
}
const median = manifest.documents.filter((doc) => doc.sourceLesson === "2-6");
assert.equal(median.length, 10);
assert.ok(median.every((doc) => doc.targetLesson === "2-3" && doc.filename.startsWith("2.6")));
assert.equal(manifest.documents.filter((doc) => doc.targetLesson === "2-6").length, 0);
staticDom.window.close();

const source = readFileSync(join(root, "assets/reveal-document-links.js"), "utf8");
const dom = new JSDOM('<div id="nav-preview"></div>', {
  url: "https://eduwonderlab.com/curriculum/",
  runScripts: "outside-only",
});
const { window } = dom;
window.fetch = async () => ({ ok: true, json: async () => manifest });
window.eval(source);
const preview = window.document.getElementById("nav-preview");
const tick = () => new Promise((resolve) => setTimeout(resolve, 10));
function select(id) {
  preview.innerHTML = `<section class="cn-resource-group"><h4>Learn &amp; practice</h4><a href="/curriculum/student-launch/?lesson=${id}">Interactive lesson</a></section>`;
}
select("3-4");
await tick();
assert.equal(preview.querySelectorAll("[data-reveal-documents]").length, 1);
assert.equal(preview.firstElementChild.nextElementSibling.dataset.revealDocuments, "3-4");
const practice = preview.querySelector('a[href$="3.4-session-1.docx"]');
assert.ok(practice);
assert.equal(practice.download, "3.4 Session 1.docx");
const teacher = preview.querySelector('a[href*="/teacher/"]');
assert.ok(teacher.closest(".hub-teacher-only"));
assert.ok(preview.querySelector('a[href$="3.4-homework-packet.pdf"]').hasAttribute("download"));
select("2-3");
await tick();
assert.ok(preview.querySelector('a[href$="2.6-session-1.docx"]'));
assert.equal(preview.querySelectorAll("[data-reveal-documents]").length, 1);
select("2-6");
await tick();
assert.equal(preview.querySelector('a[href$="2.6-session-1.docx"]'), null);
const launch = window.document.createElement("a");
launch.target = "_blank";
launch.href = "/lessons/3-4/downloads/reveal/3.4-session-1.docx";
window.document.body.appendChild(launch);
await tick();
assert.equal(launch.download, "3.4 Session 1.docx");
assert.equal(launch.target, "");
launch.href = "/lessons/3-4/";
await tick();
assert.equal(launch.hasAttribute("download"), false);
assert.equal(launch.target, "_blank");
dom.window.close();
console.log(
  `Reveal downloads: all ${manifest.documents.length} files retain original bytes, filenames, lesson placement, and teacher access; lesson desk switches without stale links.`,
);
