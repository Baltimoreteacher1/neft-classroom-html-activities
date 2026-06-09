/**
 * generate-reveal-math-nav.mjs — fill the homepage "Reveal Math" sidebar dropdown
 * with one link PER LESSON (grouped by unit). Each link opens that lesson's
 * editable-slides page (editable Google Slides + PowerPoint + Present-in-browser).
 *
 * Injects between the markers in index.html:
 *   <!-- reveal-math-nav:begin --> … <!-- reveal-math-nav:end -->
 *
 * Run: npm run generate-reveal-math-nav
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const lessonsDir = path.join(root, "lessons");
const indexFile = path.join(root, "index.html");

const BEGIN = "<!-- reveal-math-nav:begin -->";
const END = "<!-- reveal-math-nav:end -->";

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Collect lessons that have an editable-slides page (the dropdown target).
const lessons = [];
for (const id of fs.readdirSync(lessonsDir)) {
  if (id === "_template") continue;
  const dir = path.join(lessonsDir, id);
  if (!fs.statSync(dir).isDirectory()) continue;
  const cfgPath = path.join(dir, "config.json");
  const editable = path.join(dir, "editable-slides.html");
  if (!fs.existsSync(cfgPath) || !fs.existsSync(editable)) continue;
  let cfg = {};
  try {
    cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  } catch {
    continue;
  }
  lessons.push({
    id,
    unit: Number(cfg.unit) || 0,
    lesson: Number(cfg.lesson) || 0,
    title: cfg.title || id,
    flagship: /-flagship$/.test(id),
  });
}

// Alphabetical by lesson title (A–Z), so teachers can scan by name.
lessons.sort(
  (a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" }) ||
    a.id.localeCompare(b.id, undefined, { numeric: true }),
);

// One link per lesson; lead with the title (for A–Z scanning), lesson id after.
const lines = lessons.map((l) => {
  const label = `${esc(l.title)} (${l.id})`;
  return (
    `            <a class="sb-item" href="/lessons/${l.id}/editable-slides.html">` +
    `<span class="sb-emoji" aria-hidden="true">📊</span> ${label}</a>`
  );
});

const block = `${BEGIN}\n${lines.join("\n")}\n            ${END}`;

let html = fs.readFileSync(indexFile, "utf8");
if (!html.includes(BEGIN) || !html.includes(END)) {
  console.error(
    `ERROR: markers ${BEGIN} / ${END} not found in index.html. Add them inside the Reveal Math dropdown's .sb-items first.`,
  );
  process.exit(1);
}
const re = new RegExp(`${BEGIN}[\\s\\S]*?${END}`);
html = html.replace(re, block);
fs.writeFileSync(indexFile, html);
console.log(
  `Filled Reveal Math dropdown with ${lessons.length} lessons across ${new Set(lessons.map((l) => l.unit)).size} units.`,
);
