/**
 * reveal-lesson.mjs — one-command curated Reveal Math → lesson integration.
 *
 * Drop a Reveal Math lesson deck (.pptx) for any lesson and this:
 *   1. Extracts the teaching pieces the HTML lesson engine renders:
 *        • Notice & Wonder data image + context  (config.noticeAndWonder)
 *        • Word problem image + text + title     (config.revealWordProblem)
 *      (Heuristics + image extraction live in scripts/lib/extract_reveal.py,
 *       which uses python-pptx; it picks the real DATA graphic, not the
 *       decorative "Be Curious Mindset" stock photo.)
 *   2. Saves the chosen images into lessons/<id>/reveal-assets/.
 *   3. Writes/replaces ONLY config.noticeAndWonder + config.revealWordProblem
 *      in lessons/<id>/config.json — every other key, the key order, the
 *      2-space indent, and the trailing newline are preserved. Idempotent:
 *      re-running replaces, never duplicates.
 *
 * Usage:
 *   npm run reveal-lesson -- <lesson-id> <path-to-reveal.pptx> [flags]
 *
 * Flags:
 *   --dry-run   Report what WOULD be extracted/written; touch nothing.
 *   --deploy    After wiring: build, commit on a NEW feature branch, fast-
 *               forward main, push origin main, delete the branch. (This repo
 *               blocks direct main commits, so a branch is required.)
 *
 * Without --deploy it wires + reports, then tells you to review and deploy.
 * Everything stays local until you push.
 */
import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const lessonsDir = path.join(root, "lessons");
const REVEAL_ASSETS_DIRNAME = "reveal-assets";
const EXTRACTOR = path.join(__dirname, "lib", "extract_reveal.py");

// Generic, reusable sentence starters. The Reveal decks rarely supply explicit
// I-notice / I-wonder stems, so we provide classroom-friendly defaults that
// work for any data-analysis Notice & Wonder.
const DEFAULT_NOTICE_STARTERS = [
  "I notice that…",
  "I notice ___, so…",
  "I see…",
];
const DEFAULT_WONDER_STARTERS = [
  "I wonder why…",
  "I wonder what would happen if…",
  "I wonder how…",
];

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

// Mirror add-reveal.mjs: exact match, else a single near match, else stop.
function resolveLesson(input) {
  const ids = listLessonIds();
  if (ids.includes(input)) return input;
  const near = ids.filter(
    (id) => id === input || id.startsWith(`${input}-`) || id.startsWith(input),
  );
  if (near.length === 1) return near[0];
  if (near.length > 1) {
    die(
      `Lesson "${input}" is ambiguous. Did you mean one of:\n   ${near.join("   ")}\n` +
        `Re-run with the exact name, e.g. npm run reveal-lesson -- ${near[0]} <reveal.pptx>`,
    );
  }
  die(`No lesson folder named "${input}" under lessons/. Check the lesson number.`);
}

function findPython() {
  for (const cmd of ["python3", "python"]) {
    try {
      execFileSync(cmd, ["--version"], { stdio: "pipe" });
      return cmd;
    } catch {
      /* try next */
    }
  }
  die("No python3 found on PATH. Install Python 3 with python-pptx + Pillow.");
}

function runExtractor({ python, pptx, nwOut, wpOut, write }) {
  const args = [
    EXTRACTOR,
    pptx,
    "--notice-wonder-out",
    nwOut,
    "--word-problem-out",
    wpOut,
  ];
  if (!write) args.push("--no-write");
  let stdout = "";
  try {
    // Suppress python/library warnings so stdout stays pure JSON.
    stdout = execFileSync(python, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PYTHONWARNINGS: "ignore" },
    }).toString();
  } catch (e) {
    // The extractor reports structured errors as JSON on stdout even when it
    // exits non-zero — prefer that over the raw stderr dump.
    stdout = (e.stdout && e.stdout.toString()) || "";
    const detail = stdout || (e.stderr && e.stderr.toString()) || e.message || String(e);
    if (!stdout.trim().startsWith("{")) die(`Reveal extraction failed:\n   ${detail}`);
  }
  let data;
  try {
    data = JSON.parse(stdout.trim()); // single JSON object
  } catch {
    try {
      data = JSON.parse(stdout.trim().split("\n").pop());
    } catch {
      die(`Extractor returned non-JSON output:\n${stdout}`);
    }
  }
  if (data.error) die(`Extractor error: ${data.error}`);
  return data;
}

// ── config.json surgical edit ────────────────────────────────────────────────
// We rewrite ONLY config.noticeAndWonder + config.revealWordProblem, preserving
// every other key, the key order, the 2-space indent, and the trailing newline.
// When a managed key already exists it is replaced in place (idempotent); when
// absent it is inserted right after `languageObjective` (the engine renders the
// Notice & Wonder card after Objectives), matching the working 8-2 layout.
function readConfig(lessonId) {
  const file = path.join(lessonsDir, lessonId, "config.json");
  if (!fs.existsSync(file)) die(`No config.json for lesson ${lessonId} at ${file}`);
  const raw = fs.readFileSync(file, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    die(`config.json for ${lessonId} is not valid JSON: ${e.message}`);
  }
  return { file, raw, parsed };
}

// Rebuild the object preserving order; replace managed keys in place, or insert
// after `languageObjective` (fallback: after the first key) when new.
function applyManagedFields(parsed, { noticeAndWonder, revealWordProblem }) {
  const managed = { noticeAndWonder, revealWordProblem };
  const out = {};
  const keys = Object.keys(parsed);
  const hasNW = keys.includes("noticeAndWonder");
  const hasWP = keys.includes("revealWordProblem");

  // Decide the anchor for inserting NEW managed keys.
  const anchor = keys.includes("languageObjective")
    ? "languageObjective"
    : keys[0];

  for (const k of keys) {
    if (k === "noticeAndWonder") {
      out.noticeAndWonder = managed.noticeAndWonder;
      continue;
    }
    if (k === "revealWordProblem") {
      out.revealWordProblem = managed.revealWordProblem;
      continue;
    }
    out[k] = parsed[k];
    if (k === anchor) {
      if (!hasNW) out.noticeAndWonder = managed.noticeAndWonder;
      if (!hasWP) out.revealWordProblem = managed.revealWordProblem;
    }
  }
  return out;
}

function serializeConfig(obj) {
  return `${JSON.stringify(obj, null, 2)}\n`;
}

// ── piece builders ───────────────────────────────────────────────────────────
function buildNoticeAndWonder(lessonId, nw) {
  if (!nw) return null;
  const imgName = nw.image && nw.image.filename;
  const field = {
    image: imgName
      ? `/lessons/${lessonId}/${REVEAL_ASSETS_DIRNAME}/${imgName}`
      : undefined,
    context: nw.context || "",
    noticeStarters: DEFAULT_NOTICE_STARTERS,
    wonderStarters: DEFAULT_WONDER_STARTERS,
  };
  // Drop an empty image key so the renderer's `if (nw.image)` stays clean.
  if (!field.image) delete field.image;
  return field;
}

function buildWordProblem(lessonId, wp) {
  if (!wp) return null;
  const field = {
    title: wp.title || "Apply",
    text: wp.text || "",
  };
  if (wp.image && wp.image.filename) {
    field.image = `/lessons/${lessonId}/${REVEAL_ASSETS_DIRNAME}/${wp.image.filename}`;
  }
  return field;
}

// ── reporting ────────────────────────────────────────────────────────────────
function reportImage(label, img) {
  if (!img) {
    console.log(`   ${label}: (none found)`);
    return;
  }
  const dims = img.width && img.height ? `${img.width}×${img.height}` : "?×?";
  const kb = (img.bytes / 1024).toFixed(1);
  console.log(
    `   ${label}: ${img.partname} → ${dims}px, ${kb}KB → ${path.relative(root, img.out)}`,
  );
}

function summarize(data, nwField, wpField) {
  console.log(`\n📊 Extracted from ${data.slide_count}-slide deck:`);
  if (data.noticeAndWonder) {
    console.log(`\n  👀 Notice & Wonder (slide ${data.noticeAndWonder.slide_number}):`);
    console.log(`   context: ${data.noticeAndWonder.context || "(none)"}`);
    reportImage("data image", data.noticeAndWonder.image);
  } else {
    console.log("\n  👀 Notice & Wonder: (not found — needs teacher review)");
  }
  if (data.wordProblem) {
    console.log(`\n  ✏️  Word problem (slide ${data.wordProblem.slide_number}):`);
    console.log(`   title:   ${data.wordProblem.title}`);
    console.log(`   text:    ${truncate(data.wordProblem.text, 120)}`);
    reportImage("image", data.wordProblem.image);
  } else {
    console.log("\n  ✏️  Word problem: (not found — needs teacher review)");
  }
  console.log("");
}

function truncate(s, n) {
  s = String(s || "");
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

// ── deploy (mirrors repo's branch → ff main → push flow) ─────────────────────
function git(args, opts = {}) {
  return execFileSync("git", args, {
    cwd: root,
    stdio: opts.capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
}

function currentBranch() {
  try {
    return git(["rev-parse", "--abbrev-ref", "HEAD"], { capture: true }).toString().trim();
  } catch {
    return null;
  }
}

// Deploy by staging ONLY the files this run wrote (never -A / never the whole
// reveal-assets dir), committing on a feature branch, then ff-merging main and
// pushing. Transactional: on any failure we restore the starting branch and
// keep the user's work on the feature branch rather than stranding them on main.
function deploy(lessonId, writtenFiles) {
  console.log("\n🏗️  Building (npm run build) …");
  execFileSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" });

  const startBranch = currentBranch();
  const branch = `reveal-lesson-${lessonId}-${Date.now()}`;
  let committed = false;
  try {
    console.log(`\n🌿 Committing on feature branch ${branch} …`);
    git(["switch", "-c", branch]);
    git(["add", "--", ...writtenFiles]);
    git(["commit", "-m", `feat(${lessonId}): wire curated Reveal Notice & Wonder + word problem`]);
    committed = true;

    console.log("\n⏩ Fast-forwarding main and pushing …");
    git(["switch", "main"]);
    git(["pull", "--ff-only"]);
    git(["merge", "--ff-only", branch]);
    git(["push", "origin", "main"]);
    git(["branch", "-d", branch]);
    console.log("\n🚀 Pushed to main. Cloudflare Pages will rebuild & deploy in ~1-2 min.");
  } catch (e) {
    try {
      if (currentBranch() !== startBranch) git(["switch", startBranch || "main"]);
    } catch {
      /* best-effort */
    }
    die(
      `Deploy failed mid-flow: ${e.message || e}\n` +
        (committed
          ? `   Your changes are safe on branch "${branch}" — finish with: ` +
            `git switch main && git pull --ff-only && git merge --ff-only ${branch} && git push origin main`
          : "   No commit was made; re-run when ready."),
    );
  }
}

// ── main ─────────────────────────────────────────────────────────────────────
function main() {
  const argv = process.argv.slice(2);
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const positionals = argv.filter((a) => !a.startsWith("--"));

  if (positionals.length < 2 || flags.has("--help") || flags.has("-h")) {
    console.log(
      [
        "",
        "Curated Reveal Math → lesson integration (one command).",
        "",
        "  npm run reveal-lesson -- <lesson-id> <reveal.pptx> [--dry-run] [--deploy]",
        "",
        "Examples:",
        "  npm run reveal-lesson -- 8-2 ~/Downloads/reveal-median.pptx --dry-run",
        "  npm run reveal-lesson -- 8-2 ~/Downloads/reveal-median.pptx",
        "  npm run reveal-lesson -- 8-2 ~/Downloads/reveal-median.pptx --deploy",
        "",
      ].join("\n"),
    );
    process.exit(positionals.length < 2 ? 1 : 0);
  }

  const dryRun = flags.has("--dry-run");
  const wantDeploy = flags.has("--deploy");
  if (dryRun && wantDeploy) die("Use either --dry-run or --deploy, not both.");

  const lessonId = resolveLesson(positionals[0]);
  const pptx = expandHome(positionals[1]);
  if (!fs.existsSync(pptx)) die(`Reveal deck not found: ${pptx}`);
  if (path.extname(pptx).toLowerCase() !== ".pptx")
    die(`Expected a .pptx Reveal deck, got: ${pptx}`);

  const python = findPython();
  const assetsDir = path.join(lessonsDir, lessonId, REVEAL_ASSETS_DIRNAME);
  const nwOut = path.join(assetsDir, "notice-wonder.png");
  const wpOut = path.join(assetsDir, "word-problem.png");

  console.log(`\n📚 Lesson: ${lessonId}`);
  console.log(`📄 Deck:   ${pptx}`);
  if (dryRun) console.log("🔎 DRY RUN — no files will be written.");

  if (!dryRun) {
    fs.mkdirSync(assetsDir, { recursive: true });
    // Remove any prior notice-wonder.*/word-problem.* so a new format (e.g. a
    // .jpg photo replacing a .png) never leaves a stale asset behind.
    for (const f of fs.readdirSync(assetsDir)) {
      if (/^(notice-wonder|word-problem)\.[a-z0-9]+$/i.test(f)) {
        fs.rmSync(path.join(assetsDir, f), { force: true });
      }
    }
  }

  const data = runExtractor({ python, pptx, nwOut, wpOut, write: !dryRun });

  const nwField = buildNoticeAndWonder(
    lessonId,
    data.noticeAndWonder
      ? { context: data.noticeAndWonder.context, image: data.noticeAndWonder.image }
      : null,
  );
  const wpField = buildWordProblem(
    lessonId,
    data.wordProblem
      ? { title: data.wordProblem.title, text: data.wordProblem.text, image: data.wordProblem.image }
      : null,
  );

  summarize(data, nwField, wpField);

  if (!nwField && !wpField) die("Nothing extractable from this deck — check that it is a Reveal lesson deck.");

  const { file, parsed } = readConfig(lessonId);
  const next = applyManagedFields(parsed, {
    noticeAndWonder: nwField || parsed.noticeAndWonder,
    revealWordProblem: wpField || parsed.revealWordProblem,
  });
  const serialized = serializeConfig(next);

  if (dryRun) {
    console.log("📝 Would write these managed fields to config.json:");
    console.log(JSON.stringify({ noticeAndWonder: next.noticeAndWonder, revealWordProblem: next.revealWordProblem }, null, 2));
    console.log("\n✅ Dry run complete. Re-run without --dry-run to apply.\n");
    return;
  }

  // Atomic write: validate it round-trips, write a temp file, then rename so a
  // crash mid-write can never leave a truncated/invalid config.json.
  JSON.parse(serialized);
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, serialized);
  fs.renameSync(tmp, file);
  console.log(`✅ Wired lessons/${lessonId}/config.json (noticeAndWonder + revealWordProblem).`);

  // Exact files this run wrote — used to scope the deploy commit (never -A).
  const writtenFiles = [path.relative(root, file)];
  for (const f of [nwField, wpField]) {
    if (f && f.image) writtenFiles.push(f.image.replace(/^\//, ""));
  }
  console.log(`🖼️  Assets → ${writtenFiles.filter((p) => p.includes(REVEAL_ASSETS_DIRNAME)).join(", ") || "(none)"}`);

  if (wantDeploy) {
    deploy(lessonId, writtenFiles);
    return;
  }

  console.log(
    [
      "",
      "Next:",
      "  • Review:  npm run preview  (open the lesson — check the Notice & Wonder card",
      "    after Objectives and the Apply word problem after Vocabulary).",
      "  • Eyeball the two images in lessons/" + lessonId + "/reveal-assets/.",
      "  • Go live: re-run with --deploy, OR commit on a branch, ff main, push.",
      "",
    ].join("\n"),
  );
}

main();
