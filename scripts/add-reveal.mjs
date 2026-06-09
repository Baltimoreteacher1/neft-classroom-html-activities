/**
 * add-reveal.mjs — one-step helper to add official Reveal Math slides to a lesson.
 *
 * Point it at a lesson and a PDF (or a folder of images, or image files). It
 * converts/places the slides into lessons/<id>/reveal-slides/ and injects them
 * into BOTH decks (slides.html + slides.pptx) by running the integrate pipeline.
 *
 * Usage:
 *   npm run add-reveal -- <lesson> <file-or-folder>
 *
 * Examples:
 *   npm run add-reveal -- 3-1 ~/Downloads/reveal-lesson-3-1.pdf
 *   npm run add-reveal -- 8-5 ~/Desktop/reveal-8-5-images/
 *   npm run add-reveal -- 1-1 slide1.png slide2.png slide3.png
 *
 * Everything stays local. Nothing is uploaded. Re-running replaces the lesson's
 * existing Reveal slides (no duplicates).
 */
import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const lessonsDir = path.join(root, "lessons");
const REVEAL_DIRNAME = "reveal-slides";
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function die(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

function expandHome(p) {
  if (!p) return p;
  if (p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

function listLessonIds() {
  return fs
    .readdirSync(lessonsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "_template")
    .map((d) => d.name);
}

// Prefer an exact folder match; otherwise suggest close matches and stop.
function resolveLesson(input) {
  const ids = listLessonIds();
  if (ids.includes(input)) return input;
  const near = ids.filter((id) => id === input || id.startsWith(`${input}-`) || id.startsWith(input));
  if (near.length === 1) return near[0];
  if (near.length > 1) {
    die(
      `Lesson "${input}" is ambiguous. Did you mean one of:\n   ${near.join("   ")}\n` +
        `Re-run with the exact name, e.g. npm run add-reveal -- ${near[0]} <file>`
    );
  }
  die(`No lesson folder named "${input}" under lessons/. Check the lesson number.`);
}

// Natural sort so 2 comes before 10.
function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function gatherImageInputs(inputs) {
  const files = [];
  for (const raw of inputs) {
    const p = expandHome(raw);
    if (!fs.existsSync(p)) die(`Input not found: ${p}`);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      const inDir = fs
        .readdirSync(p)
        .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
        .sort(naturalSort)
        .map((f) => path.join(p, f));
      if (!inDir.length) die(`Folder has no images (.png/.jpg/.jpeg/.webp): ${p}`);
      files.push(...inDir);
    } else if (IMAGE_EXTS.has(path.extname(p).toLowerCase())) {
      files.push(p);
    } else {
      die(`Not a PDF, image, or folder of images: ${p}`);
    }
  }
  return files;
}

function pad(n, width) {
  return String(n).padStart(width, "0");
}

// Wipe & recreate the lesson's reveal-slides/ folder for a clean replace.
function freshRevealDir(lessonId) {
  const dir = path.join(lessonsDir, lessonId, REVEAL_DIRNAME);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function convertPdf(pdfPath, outDir) {
  const prefix = path.join(outDir, "page");
  try {
    // 150 DPI PNGs; pdftoppm zero-pads to the page-count width (e.g. page-01.png).
    execFileSync("pdftoppm", ["-png", "-r", "150", pdfPath, prefix], { stdio: "pipe" });
  } catch (e) {
    die(
      `PDF conversion failed (pdftoppm). Is it installed? (brew install poppler)\n   ${e.message || e}`
    );
  }
  const produced = fs
    .readdirSync(outDir)
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .sort(naturalSort);
  if (!produced.length) die("PDF produced no pages.");
  // Renumber to a clean 01.png, 02.png sequence.
  const width = Math.max(2, String(produced.length).length);
  produced.forEach((f, i) => {
    fs.renameSync(path.join(outDir, f), path.join(outDir, `${pad(i + 1, width)}.png`));
  });
  return produced.length;
}

function placeImages(files, outDir) {
  const width = Math.max(2, String(files.length).length);
  files.forEach((src, i) => {
    const ext = path.extname(src).toLowerCase();
    fs.copyFileSync(src, path.join(outDir, `${pad(i + 1, width)}${ext}`));
  });
  return files.length;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2 || args[0] === "--help" || args[0] === "-h") {
    console.log(
      [
        "",
        "Add official Reveal Math slides to a lesson (one step).",
        "",
        "  npm run add-reveal -- <lesson> <file-or-folder>",
        "",
        "Examples:",
        "  npm run add-reveal -- 3-1 ~/Downloads/reveal-lesson-3-1.pdf",
        "  npm run add-reveal -- 8-5 ~/Desktop/reveal-8-5-images/",
        "  npm run add-reveal -- 1-1 slide1.png slide2.png slide3.png",
        "",
      ].join("\n")
    );
    process.exit(args.length < 2 ? 1 : 0);
  }

  const lessonId = resolveLesson(args[0]);
  const inputs = args.slice(1).map(expandHome);

  const first = inputs[0];
  const isPdf = inputs.length === 1 && fs.statSync(first).isFile() && path.extname(first).toLowerCase() === ".pdf";

  console.log(`\n📚 Lesson: ${lessonId}`);
  const outDir = freshRevealDir(lessonId);
  let count;
  if (isPdf) {
    console.log(`📄 Converting PDF → images (150 DPI): ${first}`);
    count = convertPdf(first, outDir);
  } else {
    const files = gatherImageInputs(inputs);
    console.log(`🖼️  Placing ${files.length} image(s)`);
    count = placeImages(files, outDir);
  }
  console.log(`✅ ${count} slide image(s) → lessons/${lessonId}/${REVEAL_DIRNAME}/`);

  console.log(`🔗 Injecting into slides.html + slides.pptx + config.json (lesson page) …`);
  try {
    execFileSync(
      process.execPath,
      [path.join(__dirname, "integrate-reveal-slides.mjs"), "--lesson", lessonId],
      { stdio: "inherit" }
    );
  } catch (e) {
    die(`Injection step failed: ${e.message || e}`);
  }

  console.log(
    [
      "",
      "🎉 Done. Reveal slides are now in BOTH decks AND the HTML lesson page for lesson " + lessonId + ".",
      "   • slides.html + slides.pptx — Reveal slides injected into the decks.",
      "   • config.json (revealSlides) — the lesson app shows each slide in its matching section.",
      "",
      "Next:",
      "  • Preview:  npm run preview   (then open the lesson's slides.html / editable-slides.html)",
      "  • Lesson page: the index.html app is built from config.json, so a rebuild/deploy is",
      "    required for the new Reveal slides to appear on the live lesson page.",
      "  • Go live:  commit on a feature branch, merge to main, push  (Cloudflare auto-deploys",
      "    by running the Vite build, which regenerates the lesson app from config.json).",
      "",
      "Re-run this command anytime to replace the slides for this lesson.",
      "",
    ].join("\n")
  );
}

main();
