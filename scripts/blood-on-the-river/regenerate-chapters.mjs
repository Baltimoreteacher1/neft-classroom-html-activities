// Rebuild every Blood on the River chapter page with the simplified
// 3-card scaffold (Characters / Main Events / Important Things).
// The embedded renderChapter({...}) data is preserved verbatim — this only
// swaps the HTML shell and bumps the cache-busting asset version.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// chapters live in <repo>/blood-on-the-river relative to this script
const dir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../blood-on-the-river",
);
const V = "20260615b";

const template = (n, dataLiteral) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Blood on the River — Chapter ${n}</title>
<link rel="stylesheet" href="/blood-on-the-river/chapter.css?v=${V}">
<!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
<link rel="stylesheet" href="/shared/save-resume/save-resume-styles.css">
<!-- nsr-injected:end -->
</head>
<body>
<div class="shell">
<header class="hero"><div class="hero-inner">
<p class="eyebrow" data-hero-kicker></p>
<h1>Blood on the River <span data-chapter-title></span></h1>
<p class="hero-copy" data-hero-copy></p>
<div class="hero-actions">
<a class="btn clear" href="/blood-on-the-river/">◂ All chapters</a>
<button id="printBtn" class="btn gold" type="button">Print this chapter</button>
</div>
</div></header>
<main class="card-deck" id="cardDeck"></main>
</div>
<div class="tools">
<button id="largeTextBtn" type="button">Large Text</button>
<button id="contrastBtn" type="button">High Contrast</button>
<button id="topBtn" type="button">Top</button>
</div>
<div class="status" id="status">Saved</div>
<script src="/blood-on-the-river/chapter.js?v=${V}"></script>
<script>
renderChapter(${dataLiteral});
</script>
<script src="/assets/nt-page-enhance.js" defer></script>
<!-- nsr-injected:begin (multi-day save/resume — tools/inject-save-resume.js) -->
<script src="/shared/save-resume/save-resume-engine.js" defer></script>
<!-- nsr-injected:end -->
</body></html>
`;

let count = 0;
for (let n = 1; n <= 27; n++) {
  const file = path.join(dir, `chapter-${n}`, "index.html");
  if (!fs.existsSync(file)) {
    console.error(`SKIP chapter-${n}: missing`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const m = html.match(/renderChapter\((\{[\s\S]*?\})\);?\s*<\/script>/);
  if (!m) {
    console.error(`FAIL chapter-${n}: no renderChapter data found`);
    process.exitCode = 1;
    continue;
  }
  const dataLiteral = m[1];
  // Validate the data is parseable JSON before writing.
  JSON.parse(dataLiteral);
  fs.writeFileSync(file, template(n, dataLiteral), "utf8");
  count++;
}
console.log(`Rebuilt ${count} chapter pages at v=${V}`);
