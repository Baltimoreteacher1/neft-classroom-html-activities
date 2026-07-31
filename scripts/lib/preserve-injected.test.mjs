#!/usr/bin/env node
// A generator must not be able to delete an injected layer.
//
// This is the regression that made the test necessary: re-running
// `scripts/generate-notes.mjs` rewrote all 74 lesson Learn It / Notes / Vocab
// pages and stripped every nsr / mobile-access / mwb / enthead block off them.
// `validate:injection` stayed green the whole time, because it only checks that
// begin/end sentinels are balanced and zero blocks balance perfectly.

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { preserveInjected, readInjectedBlocks, writeGenerated } from "./preserve-injected.mjs";

let failures = 0;
const check = (name, cond, detail) => {
  if (cond) return;
  failures++;
  console.error(`  FAIL ${name}${detail ? " — " + detail : ""}`);
};

const NSR_HEAD = `<!-- nsr-injected:begin (multi-day save/resume) -->
  <link rel="stylesheet" href="/shared/save-resume/save-resume-styles.css">
  <!-- nsr-injected:end -->`;
const MA_HEAD = `<!-- mobile-access-injected:begin -->
  <link rel="stylesheet" href="/assets/mobile-access.css">
  <!-- mobile-access-injected:end -->`;
const NSR_BODY = `<!-- nsr-injected:begin (multi-day save/resume) -->
  <script src="/shared/save-resume/save-resume.js"></script>
  <!-- nsr-injected:end -->`;

const injected = `<!doctype html><html><head><title>t</title>
${NSR_HEAD}
${MA_HEAD}
</head><body><main>old content</main>
${NSR_BODY}
</body></html>`;

const regenerated = `<!doctype html><html><head><title>t</title>
</head><body><main>NEW content</main>
</body></html>`;

/* ---------- reading ---------- */

const blocks = readInjectedBlocks(injected);
check("reads every block", blocks.length === 3, `got ${blocks.length}`);
check(
  "assigns zones from the </head> boundary",
  blocks.map((b) => `${b.family}/${b.zone}`).join(" ") === "nsr/head mobile-access/head nsr/body",
  blocks.map((b) => `${b.family}/${b.zone}`).join(" "),
);
check("a page with no blocks reads as none", readInjectedBlocks(regenerated).length === 0);

/* ---------- preserving ---------- */

const merged = preserveInjected(regenerated, blocks);
check("keeps the regenerated content", merged.includes("NEW content"));
check("drops the stale content", !merged.includes("old content"));
check("restores all three blocks", readInjectedBlocks(merged).length === 3);
check(
  "head blocks land in the head",
  merged.indexOf("mobile-access.css") < merged.search(/<\/head>/i),
);
check(
  "body blocks land in the body, after the head",
  merged.indexOf("save-resume.js") > merged.search(/<\/head>/i) &&
    merged.indexOf("save-resume.js") < merged.lastIndexOf("</body>"),
);
check("sentinels stay balanced", (merged.match(/-injected:begin/g) || []).length === 3);
check(
  "sentinels stay paired",
  (merged.match(/-injected:begin/g) || []).length === (merged.match(/-injected:end/g) || []).length,
);

/* ---------- idempotence and safety ---------- */

check(
  "re-preserving does not duplicate",
  readInjectedBlocks(preserveInjected(merged, blocks)).length === 3,
);
check("no blocks to preserve is a no-op", preserveInjected(regenerated, []) === regenerated);
check(
  "a family already present in a zone is left alone",
  (preserveInjected(injected, blocks).match(/nsr-injected:begin/g) || []).length === 2,
);
// A page with no anchors must never be corrupted by a blind splice.
const anchorless = "<div>fragment with no head or body</div>";
check(
  "an anchorless page is returned unchanged",
  preserveInjected(anchorless, blocks) === anchorless,
);
// An example page that prints a literal </body> inside a code sample must not
// have the block spliced into the sample.
const withSample = `<html><head></head><body><pre>&lt;/body&gt;</pre><p>x</p></body></html>`;
const sampled = preserveInjected(withSample, [blocks[2]]);
check(
  "splices before the LAST </body>",
  sampled.indexOf("save-resume.js") > sampled.indexOf("<p>x</p>"),
);

/* ---------- the drop-in writer ---------- */

const dir = mkdtempSync(join(tmpdir(), "preserve-injected-"));
const file = join(dir, "learn.html");
writeFileSync(file, injected);
writeGenerated(file, regenerated);
const onDisk = readFileSync(file, "utf8");
check("writeGenerated keeps the new content", onDisk.includes("NEW content"));
check("writeGenerated keeps the injected layers", readInjectedBlocks(onDisk).length === 3);

const fresh = join(dir, "new.html");
writeGenerated(fresh, regenerated);
check(
  "writeGenerated on a new file writes it verbatim",
  readFileSync(fresh, "utf8") === regenerated,
);

if (failures) {
  console.error(`\n✗ preserve-injected: ${failures} failure(s).`);
  process.exit(1);
}
console.log("preserve-injected: a regeneration cannot delete an injected layer.");
