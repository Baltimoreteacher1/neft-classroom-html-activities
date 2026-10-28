// Weight, handler and layout-shift budgets for the family homework pages.
//
// Usage: node tools/validate-family-performance.mjs [--lesson=4-5,6-1] [--no-cls]
// Budgets live in data/family-performance-budget.json: `target` is the brief, `ratchet` is today's
// worst page and may only go down. Checked on EVERY generated page (no browser needed):
//   - inline on*= handlers (target 200; the delegated runtime replaced them, so today 0)
//   - first view = gzip(document) + gzip(render-blocking stylesheets), in KB
//   - scripts = gzip of every linked script, in KB
//   - delegated data-act attributes, capped so they cannot grow back into inline handlers
//   - no request to another origin; every /assets/homework file hashed and present (immutable cache)
// And in a real browser, on a sample (or every --lesson): cumulative layout shift <= 0.05 on load.
// Detectors are proved on seeded pages first; a sweep of zero pages FAILS.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonPath, listLessonDirs, REPO_ROOT } from "./lib/curriculum-source.mjs";
import { measurePage, readServed } from "./lib/family-performance.mjs";
import { launchBrowser, parseArgs, startStaticServer } from "./lib/lesson-gate-kit.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

const args = parseArgs(process.argv.slice(2));
const budget = JSON.parse(
  readFileSync(join(REPO_ROOT, "data/family-performance-budget.json"), "utf8"),
);
/** The limit in force: the target once met, else the ratchet (never above it). */
const limit = (b) =>
  Math.max(b.target ?? 0, 0) >= (b.ratchet ?? 0) ? b.target : (b.ratchet ?? b.target);

// ---- self-test: every detector must fire on its seeded defect and stay quiet on the clean twin
const clean = `<!doctype html><html><head><link rel="stylesheet" href="/assets/homework/homework-layer-0123456789.css"></head><body><button data-act="go">Go</button></body></html>`;
const files = { "/assets/homework/homework-layer-0123456789.css": "a{color:red}" };
const read = (p) => files[p] ?? null;
const cases = [
  [
    "inline handler",
    `<body><button onclick="go()">Go</button></body>`,
    (r) => r.inlineHandlers === 1,
    (r) => r.inlineHandlers === 0,
  ],
  [
    "handler word inside a value is not a handler",
    `<p title="x on y = z">a</p>`,
    (r) => r.inlineHandlers === 0,
    (r) => r.inlineHandlers === 0,
  ],
  [
    "handler inside a script string is not markup",
    `<script>var s='<b onclick=1>'</script>`,
    (r) => r.inlineHandlers === 0,
    (r) => r.inlineHandlers === 0,
  ],
  [
    "external request",
    `<script src="https://cdn.example.com/x.js"></script>`,
    (r) => r.external.length === 1,
    (r) => r.external.length === 0,
  ],
  [
    "unhashed shared file",
    `<link rel="stylesheet" href="/assets/homework/homework-layer.css">`,
    (r) => r.unhashed.length === 1,
    (r) => r.unhashed.length === 0,
  ],
  [
    "missing shared file",
    `<link rel="stylesheet" href="/assets/homework/homework-layer-ffffffffff.css">`,
    (r) => r.missing.length === 1,
    (r) => r.missing.length === 0,
  ],
  [
    "heavy stylesheet counts toward the first view",
    clean.replace("</head>", `<style>${"a{color:red}".repeat(200)}</style></head>`),
    (r) => r.cssGzip > 0,
    (r) => r.cssGzip > 0,
  ],
];
const broken = [];
for (const [name, bad, isCaught, cleanOk] of cases) {
  if (!isCaught(measurePage(bad, read))) broken.push(`${name}: not detected`);
  if (!cleanOk(measurePage(clean, read))) broken.push(`${name}: clean twin misreported`);
}
if (broken.length) {
  console.error(`FAIL self-test:\n  ${broken.join("\n  ")}`);
  process.exit(1);
}
console.log(`self-test: ${cases.length} detectors fire and stay quiet as designed`);

// ---- sweep
const ids = listLessonDirs()
  .filter((d) => existsSync(lessonPath(d, "homework.html")))
  .sort();
const lessons = args.lesson ? String(args.lesson).split(",") : ids;
const problems = [];
const worst = { handlers: 0, view: 0, scripts: 0, actions: 0 };
const kb = (n) => Math.round((n / 1024) * 10) / 10;
const readFile = readServed(REPO_ROOT);
for (const id of lessons) {
  const m = measurePage(readFileSync(lessonPath(id, "homework.html"), "utf8"), readFile);
  worst.handlers = Math.max(worst.handlers, m.inlineHandlers);
  worst.view = Math.max(worst.view, m.firstViewGzip);
  worst.scripts = Math.max(worst.scripts, m.scriptGzip);
  worst.actions = Math.max(worst.actions, m.actions);
  const at = `lessons/${id}/homework.html`;
  if (m.inlineHandlers > limit(budget.inlineHandlers))
    problems.push(
      `${at}: ${m.inlineHandlers} inline handlers (limit ${limit(budget.inlineHandlers)})`,
    );
  if (m.firstViewGzip / 1024 > limit(budget.firstViewGzipKB))
    problems.push(
      `${at}: first view ${kb(m.firstViewGzip)} KB gzip (limit ${limit(budget.firstViewGzipKB)}, target ${budget.firstViewGzipKB.target})`,
    );
  if (m.scriptGzip / 1024 > limit(budget.scriptGzipKB))
    problems.push(
      `${at}: scripts ${kb(m.scriptGzip)} KB gzip (limit ${limit(budget.scriptGzipKB)})`,
    );
  if (m.actions > limit(budget.actions))
    problems.push(`${at}: ${m.actions} data-act attributes (limit ${limit(budget.actions)})`);
  for (const e of m.external) problems.push(`${at}: request to another origin: ${e}`);
  for (const f of m.missing) problems.push(`${at}: ${f} is linked but missing`);
  for (const f of m.unhashed)
    problems.push(`${at}: ${f} is not content-hashed, so it cannot be cached immutably`);
}
if (!lessons.length)
  problems.push("swept zero pages; a sweep that measured nothing proves nothing");
if (!args.lesson && lessons.length < 150)
  problems.push(`only ${lessons.length} pages swept (floor 150)`);
console.log(
  `${lessons.length} page(s): worst first view ${kb(worst.view)} KB gzip (target ${budget.firstViewGzipKB.target}, limit ${limit(budget.firstViewGzipKB)}), scripts ${kb(worst.scripts)} KB, inline handlers ${worst.handlers}, data-act ${worst.actions}`,
);

// ---- layout shift in a real browser (sample unless --lesson)
let cls = "not run";
let skipped = null;
if (!args["no-cls"] && !problems.length) {
  const browser = await launchBrowser();
  if (!browser)
    skipped = skipExit(
      "no Chromium available, so layout shift was not measured",
      "Set PW_CHROMIUM_PATH to a system Chromium",
    );
  else {
    const server = await startStaticServer(REPO_ROOT);
    const sample = args.lesson
      ? lessons
      : ["1-1", "3-3", "4-5", "6-5", "8-2"].filter((l) => ids.includes(l));
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
    let max = 0;
    for (const id of sample) {
      const page = await phone.newPage();
      await page.addInitScript(() => {
        window.__cls = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto(`${server.base}/lessons/${id}/homework.html`, { waitUntil: "load" });
      await page.waitForTimeout(1500);
      const value = await page.evaluate(() => window.__cls);
      max = Math.max(max, value);
      if (value > budget.layoutShift.target)
        problems.push(
          `lessons/${id}/homework.html: layout shift ${value.toFixed(3)} (limit ${budget.layoutShift.target})`,
        );
      await page.close();
    }
    cls = `max ${max.toFixed(3)} over ${sample.length} page(s)`;
    await browser.close();
    await server.close();
  }
}
console.log(`layout shift: ${cls}`);

if (problems.length) {
  console.error(`FAIL validate:family-performance: ${problems.length} problem(s)`);
  for (const p of problems.slice(0, 25)) console.error(`  ${p}`);
  process.exit(1);
}
if (skipped) process.exit(skipped);
console.log("PASS validate:family-performance");
