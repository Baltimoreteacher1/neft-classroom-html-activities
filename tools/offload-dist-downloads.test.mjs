// The R2 offload only drops what is provably in R2, and the Function and the build agree on which paths count.
import assert from "node:assert/strict";
import { basename } from "node:path";
import { downloadKey } from "../functions/lessons/[[path]].js";
import { LESSONS_DIR } from "./lib/curriculum-source.mjs";
import { isOffloadable, planOffload } from "./lib/r2-offload.mjs";

const L = basename(LESSONS_DIR);
const P = (rest) => `${L}/${rest}`;
const keep = [
  P("1-1/downloads/1-1-notes-l1.docx"),
  P("2-3-group1/downloads/reveal/x.pdf"),
  P("5-6/downloads/deck.PPTX"),
  // Lesson-level binaries the build copies beside index.html, and readiness worksheets.
  P("1-1/homework.docx"),
  P("1-1/homework-answer-key.docx"),
  P("1-1/homework-es.docx"),
  P("1-1/slides.pptx"),
  P("2-1/readiness/2-1-readiness-practice.docx"),
];
const notOffloadable = [
  P("1-1/index.html"),
  P("1-1/config.json"),
  P("1-1/homework.html"), // a page, never a download
  P("1-1/handout.docx"), // lesson root, but not one of the named binaries
  P("2-1/readiness/index.html"),
  P("2-1/readiness/nested/x.docx"), // readiness is one level only
  P("1-1/downloads/readme.txt"),
  "curriculum/x/downloads/a.pdf",
  P("1-1/downloads/../../secret.pdf"),
];
for (const p of keep) assert.ok(isOffloadable(p), p);
for (const p of notOffloadable) assert.ok(!isOffloadable(p), p);

// The Function and the build must answer the same question for every path.
for (const p of [...keep, ...notOffloadable]) {
  assert.equal(downloadKey(`/${p}`) !== null, isOffloadable(p), `function/build disagree on ${p}`);
}
assert.equal(downloadKey(`/${P("1-1/downloads/a%20b.pdf")}`), P("1-1/downloads/a b.pdf"));
assert.equal(downloadKey(`/${P("1-1/downloads/%2e%2e/x.pdf")}`), null);
assert.equal(downloadKey(`/${P("1-1/downloads/%E0%A4%A.pdf")}`), null); // malformed escape

// planOffload: no manifest entry -> keep; same hash -> drop; changed bytes -> keep and report stale.
const files = [
  { rel: P("1-1/downloads/a.pdf"), hash: "h1" },
  { rel: P("1-1/downloads/b.pdf"), hash: "h2" },
  { rel: P("1-1/downloads/c.pdf"), hash: "h3" },
  { rel: P("1-1/index.html"), hash: "h4" },
];
const uploaded = {
  [P("1-1/downloads/a.pdf")]: { sha256: "h1" },
  [P("1-1/downloads/b.pdf")]: { sha256: "OLD" },
  [P("1-1/index.html")]: { sha256: "h4" }, // never droppable even if listed
};
const { drop, stale } = planOffload(files, uploaded);
assert.deepEqual(drop, [P("1-1/downloads/a.pdf")]);
assert.deepEqual(stale, [P("1-1/downloads/b.pdf")]);
assert.deepEqual(planOffload(files, {}).drop, [], "empty manifest drops nothing");

console.log(
  "offload-dist-downloads: 3 invariants hold (path agreement, hash gate, empty manifest).",
);
