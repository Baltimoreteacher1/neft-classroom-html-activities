// Wires the readiness pre-lessons into the site navigation. Idempotent.
//   1. Builds math/get-ready/index.html — a complete hub of all readiness
//      pre-lessons grouped by unit (skips -flagship duplicates).
//   2. Injects a "Get Ready first" link after each /lessons/<id>/ anchor in any
//      math/unit-*/index.html that lists the Reveal lessons.
//   3. Adds a "Get Ready" card to math/index.html.
//
// Run: node scripts/wire-readiness-links.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dataDir = join(__dirname, "readiness", "data");

const TEAL = "#0e8a7d";

// ---- load lesson metadata from readiness data ----
const lessons = readdirSync(dataDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(dataDir, f), "utf8")))
  .map((d) => ({ id: d.lessonId, title: d.title, standard: d.standard }));

const unitOf = (id) => parseInt(id.split("-")[0], 10);
const lessonNo = (id) => parseInt(id.split("-")[1], 10);
const isFlagship = (id) => id.includes("flagship");

// ---------- 1. Get Ready hub ----------
function buildHub() {
  const units = [...new Set(lessons.map((l) => unitOf(l.id)))].sort((a, b) => a - b);
  const groups = units
    .map((u) => {
      const items = lessons
        .filter((l) => unitOf(l.id) === u && !isFlagship(l.id))
        .sort((a, b) => lessonNo(a.id) - lessonNo(b.id))
        .map(
          (l) =>
            `            <a href="/lessons/${l.id}/readiness/">${u}.${lessonNo(l.id)} ${l.title} — ${l.standard}</a>`,
        )
        .join("\n");
      return `          <div class="folder-index-group">
            <h3>Unit ${u}</h3>
            <div class="folder-links">
${items}
            </div>
          </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Readiness pre-lessons for every Grade 6 Reveal Math lesson — a quick check that routes students to the right level, then prerequisite warm-up practice before the lesson." />
    <title>Get Ready: Readiness Pre-Lessons | Neft Teacher</title>
    <link rel="stylesheet" href="/assets/shared.css" />
  </head>
  <body>
    <main class="page-shell">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a><span>/</span><a href="/math/">Math</a><span>/</span><span>Get Ready</span>
      </nav>

      <section class="hero compact-hero">
        <p class="eyebrow">📚 Readiness Pre-Lessons</p>
        <h1>Get Ready Before Each Lesson</h1>
        <p class="hero-copy">
          Behind on the basics? Each lesson has a 10-minute readiness check that
          finds what you're missing and gives you practice at your level (with a
          printable packet) — so you walk into the lesson ready.
        </p>
      </section>

      <section aria-label="Readiness pre-lessons by unit">
        <div class="section-heading">
          <p class="eyebrow">Pick your lesson</p>
        </div>
        <div class="folder-index">
${groups}
        </div>
      </section>

      <footer class="site-footer">
        <p>Neft Teacher · Grade 6 Math · Readiness Pre-Lessons</p>
      </footer>
    </main>
  </body>
</html>
`;
}

const hubDir = join(root, "math", "get-ready");
if (!existsSync(hubDir)) mkdirSync(hubDir, { recursive: true });
writeFileSync(join(hubDir, "index.html"), buildHub());
console.log("Wrote math/get-ready/index.html");

// ---------- 2. Inject into unit hubs ----------
const reLessonAnchor = /(<a\s+href="\/lessons\/([0-9]+-[0-9]+)\/">[^<]*<\/a>)/g;
let hubsTouched = 0;
const mathDir = join(root, "math");
for (const dir of readdirSync(mathDir, { withFileTypes: true })) {
  if (!dir.isDirectory() || !/^unit-\d+$/.test(dir.name)) continue;
  const file = join(mathDir, dir.name, "index.html");
  if (!existsSync(file)) continue;
  const orig = readFileSync(file, "utf8");
  let html = orig;
  let changed = false;
  html = html.replace(reLessonAnchor, (full, anchor, id) => {
    // idempotent: skip if a readiness link for this id already exists
    if (orig.includes(`/lessons/${id}/readiness/`)) return full;
    if (!lessons.some((l) => l.id === id)) return full;
    changed = true;
    return `${anchor}\n            <a href="/lessons/${id}/readiness/" style="display:block;margin:-4px 0 10px;font-size:13px;font-weight:700;color:${TEAL};">↳ 📚 Get Ready first</a>`;
  });
  if (changed) {
    writeFileSync(file, html);
    hubsTouched++;
    console.log(`Injected readiness links into math/${dir.name}/index.html`);
  }
}
console.log(`Unit hubs updated: ${hubsTouched}`);

// ---------- 3. Add Get Ready card to math/index.html ----------
const mathIndex = join(mathDir, "index.html");
if (existsSync(mathIndex)) {
  let html = readFileSync(mathIndex, "utf8");
  if (!html.includes("/math/get-ready/")) {
    const card = `      <section aria-label="Readiness Pre-Lessons">
        <a class="activity-card" href="/math/get-ready/" style="display:block;border-left:6px solid ${TEAL};">
          <span class="card-kicker">📚 Behind on the basics?</span>
          <h3>Get Ready: Readiness Pre-Lessons</h3>
          <p>A 10-minute readiness check before each lesson — finds gaps, routes to the right level, and gives prerequisite practice (with a printable packet).</p>
          <span class="button-link">Open Get Ready</span>
        </a>
      </section>

`;
    const marker = '      <section aria-label="Activities Finder">';
    if (html.includes(marker)) {
      html = html.replace(marker, card + marker);
      writeFileSync(mathIndex, html);
      console.log("Added Get Ready card to math/index.html");
    } else {
      console.error("Could not find insertion marker in math/index.html");
    }
  } else {
    console.log("math/index.html already links Get Ready (skipped)");
  }
}
