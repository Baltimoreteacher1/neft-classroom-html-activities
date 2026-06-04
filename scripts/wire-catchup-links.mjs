// Builds the Catch-Up & Bridge hub and wires it into the grade/unit pages.
// Idempotent.
//   1. math/catch-up/index.html — all remediation organized by strand, plus
//      bridge/summer/spiral resources and a link to per-lesson Get Ready.
//   2. "Behind grade level? Start here" banner injected after the breadcrumb in
//      every math/unit-N/index.html, mapped to the right remediation strands.
//   3. "Catch-Up & Bridge" card added to math/index.html.
//
// Run: node scripts/wire-catchup-links.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const TEAL = "#0e8a7d";

// ── remediation map (strand → lessons), from math/remediation/unit-rN ──
const REMEDIATION = [
  { id: "r1", name: "Whole Numbers & Operations", lessons: ["Place Value, Compare & Round","Add & Subtract Multi-Digit Numbers","Multiply Multi-Digit Numbers","Long Division","Order of Operations (PEMDAS)"] },
  { id: "r2", name: "Fraction Foundations", lessons: ["Understand Fractions","Equivalent Fractions & Simplifying","Compare & Order Fractions","Add & Subtract Fractions","Multiply Fractions & Mixed Numbers"] },
  { id: "r3", name: "Decimals & Money", lessons: ["Decimal Place Value, Compare & Round","Add & Subtract Decimals","Multiply Decimals","Divide Decimals","Fractions ↔ Decimals ↔ Percents"] },
  { id: "r4", name: "Factors, Multiples & Patterns", lessons: ["Factors & Divisibility","Prime & Composite · Prime Factorization","Greatest Common Factor (GCF)","Least Common Multiple (LCM)","Number Patterns & Sequences"] },
  { id: "r5", name: "Pre-Algebra & Geometry Readiness", lessons: ["Introduction to Ratios","Rates & Unit Rates","Perimeter & Area of Rectangles","Area of Triangles & Composite Shapes","Coordinate Plane & Intro to Integers"] },
];
const RNAME = Object.fromEntries(REMEDIATION.map((r) => [r.id, r.name]));

// Reveal unit → which remediation strands feed it
const UNIT_TO_R = {
  1: ["r1", "r3", "r4"], 2: ["r2"], 3: ["r5"], 4: ["r3", "r5"], 5: ["r5"],
  6: ["r1"], 7: ["r1", "r5"], 8: ["r1"], 9: ["r5"], 10: ["r5", "r1"],
};

const BRIDGE = [
  ["/bridge-to-grade-6/resources/student-workbook.html", "Student Workbook"],
  ["/bridge-to-grade-6/resources/fluency-drills.html", "Fluency Drills"],
  ["/bridge-to-grade-6/resources/assessments.html", "Diagnostic Assessments"],
  ["/bridge-to-grade-6/resources/family-practice.html", "Family Practice"],
  ["/bridge-to-grade-6/resources/teacher-guide.html", "Teacher Guide"],
];
const MORE = [
  ["/summer-bridge/skills-checkup.html", "Skills Check-Up (diagnostic)"],
  ["/spiral-review/", "Daily Spiral Review"],
  ["/summer-bridge/grade7-preview.html", "Grade 7 Preview"],
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ── 1. Catch-Up hub ──
function buildHub() {
  const strandGroups = REMEDIATION.map((r) => {
    const links = r.lessons
      .map((t, i) => `            <a href="/math/remediation/unit-${r.id}/lesson-${i + 1}/">${esc(t)}</a>`)
      .join("\n");
    return `          <div class="folder-index-group">
            <h3>${esc(r.name)}</h3>
            <div class="folder-links">
${links}
            </div>
          </div>`;
  }).join("\n");

  const linkList = (arr) => arr.map(([u, t]) => `            <a href="${u}">${esc(t)}</a>`).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Catch-Up & Bridge: grade-level prerequisite lessons, fluency drills, and diagnostics for Grade 6 students who are behind — organized by strand and tied to each unit." />
    <title>Catch-Up & Bridge | Neft Teacher</title>
    <link rel="stylesheet" href="/assets/shared.css" />
  </head>
  <body>
    <main class="page-shell">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a><span>/</span><a href="/math/">Math</a><span>/</span><span>Catch-Up &amp; Bridge</span>
      </nav>

      <section class="hero compact-hero">
        <p class="eyebrow">🧗 Catch-Up &amp; Bridge</p>
        <h1>Fill the Gaps, Then Step Into Grade Level</h1>
        <p class="hero-copy">
          For students working below grade level. Start with a diagnostic, then
          use the bridge lessons by strand to rebuild the foundations each Grade 6
          unit depends on. For a lesson-specific warm-up, use
          <a href="/math/get-ready/">Get Ready</a>.
        </p>
      </section>

      <section aria-label="Start here">
        <div class="section-heading"><p class="eyebrow">Step 1 · Find the gaps</p></div>
        <div class="folder-index">
          <div class="folder-index-group">
            <h3>Diagnose &amp; place</h3>
            <div class="folder-links">
${linkList(MORE)}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Bridge lessons by strand">
        <div class="section-heading"><p class="eyebrow">Step 2 · Bridge lessons by strand</p></div>
        <div class="folder-index">
${strandGroups}
        </div>
      </section>

      <section aria-label="Practice and supports">
        <div class="section-heading"><p class="eyebrow">Step 3 · Practice &amp; family supports</p></div>
        <div class="folder-index">
          <div class="folder-index-group">
            <h3>Workbooks, drills &amp; guides</h3>
            <div class="folder-links">
${linkList(BRIDGE)}
            </div>
          </div>
        </div>
      </section>

      <footer class="site-footer">
        <p>Neft Teacher · Grade 6 Math · Catch-Up &amp; Bridge · Pairs with <a href="/math/get-ready/">Get Ready</a> readiness pre-lessons.</p>
      </footer>
    </main>
  </body>
</html>
`;
}

const hubDir = join(root, "math", "catch-up");
if (!existsSync(hubDir)) mkdirSync(hubDir, { recursive: true });
writeFileSync(join(hubDir, "index.html"), buildHub());
console.log("Wrote math/catch-up/index.html");

// ── 2. Inject "Behind grade level?" banner into unit hubs ──
let hubsTouched = 0;
for (const dir of readdirSync(join(root, "math"), { withFileTypes: true })) {
  const m = dir.isDirectory() && dir.name.match(/^unit-(\d+)$/);
  if (!m) continue;
  const u = Number(m[1]);
  const file = join(root, "math", dir.name, "index.html");
  if (!existsSync(file)) continue;
  let html = readFileSync(file, "utf8");
  if (html.includes("/math/catch-up/")) continue; // idempotent
  const strands = (UNIT_TO_R[u] || []).map((r) => RNAME[r]).join(", ");
  const rLinks = (UNIT_TO_R[u] || [])
    .map((r) => `<a href="/math/remediation/unit-${r}/" style="font-weight:700;color:${TEAL};text-decoration:none">${esc(RNAME[r])}</a>`)
    .join(" · ");
  const banner = `
      <div class="notice" style="border-color:#EAD0BF;background:var(--clay-tint,#F7EADF);margin:16px 0">
        <strong>📚 Behind grade level?</strong> Start with
        <a href="/math/catch-up/" style="font-weight:800;color:${TEAL}">Catch-Up &amp; Bridge</a>
        to rebuild the foundations this unit needs${strands ? ` — most relevant: ${rLinks}` : ""}.
        For a quick per-lesson warm-up, use <a href="/math/get-ready/" style="font-weight:800;color:${TEAL}">Get Ready</a>.
      </div>`;
  // insert right after the breadcrumb </nav>
  const idx = html.indexOf("</nav>");
  if (idx === -1) continue;
  html = html.slice(0, idx + 6) + "\n" + banner + html.slice(idx + 6);
  writeFileSync(file, html);
  hubsTouched++;
  console.log(`Injected Catch-Up banner into math/${dir.name}/index.html`);
}
console.log(`Unit hubs updated: ${hubsTouched}`);

// ── 3. Catch-Up card on math/index.html ──
const mathIndex = join(root, "math", "index.html");
if (existsSync(mathIndex)) {
  let html = readFileSync(mathIndex, "utf8");
  if (!html.includes("/math/catch-up/")) {
    const card = `      <section aria-label="Catch-Up and Bridge">
        <a class="activity-card" href="/math/catch-up/" style="display:block;border-left:6px solid ${TEAL};">
          <span class="card-kicker">🧗 Working below grade level?</span>
          <h3>Catch-Up &amp; Bridge</h3>
          <p>Diagnostics + bridge lessons by strand (whole numbers, fractions, decimals, factors, pre-algebra) that rebuild the foundations each unit needs.</p>
          <span class="button-link">Open Catch-Up &amp; Bridge</span>
        </a>
      </section>

`;
    const marker = '      <section aria-label="Activities Finder">';
    if (html.includes(marker)) {
      html = html.replace(marker, card + marker);
      writeFileSync(mathIndex, html);
      console.log("Added Catch-Up card to math/index.html");
    } else {
      console.error("Marker not found in math/index.html");
    }
  } else {
    console.log("math/index.html already links Catch-Up (skipped)");
  }
}
