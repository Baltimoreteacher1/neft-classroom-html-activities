#!/usr/bin/env node
/**
 * Blood on the River — per-scene art generator.
 *
 * Uses THIS machine's existing image pipeline (the nano-banana / Gemini scripts under
 * ~/.claude/scripts) — no new provider is introduced. For each entry in scene-prompts.json
 * it generates a square 1:1 illustration, writes it as WebP to the entry's `image` path
 * (art/botr/ch{NN}-scene-{nn}.webp) and a colocated .jpg raster fallback that the page
 * loader falls back to.
 *
 * Pipeline per run:
 *   1. Build a nano-banana batch manifest from scene-prompts.json (negativePrompt folded
 *      into the prompt as an explicit AVOID clause — Gemini image models have no separate
 *      negative-prompt channel).
 *   2. nano-banana-generate.py batch  → PNG masters in a staging dir.
 *   3. Convert each PNG → WebP + JPG (cwebp / PIL) into art/botr/.
 *
 * Usage:
 *   GEMINI_API_KEY=... node generate-images.mjs --chapter 1      # quality-gate: Ch 1 only
 *   GEMINI_API_KEY=... node generate-images.mjs --all            # all 243
 *   node generate-images.mjs --chapter 1 --manifest-only         # write manifest, no API calls
 *
 * Flags: --chapter N | --all | --manifest-only | --model pro|flash | --delay 2 | --force
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ART_DIR = join(HERE, "botr");
const STAGE_DIR = join(HERE, ".staging-png");
const SCRIPTS = join(homedir(), ".claude", "scripts");
const GEN_PY = join(SCRIPTS, "nano-banana-generate.py");

function parseArgs(argv) {
  const a = { chapter: null, chapMin: null, chapMax: null, all: false, manifestOnly: false, model: "pro", delay: 2, force: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--all") a.all = true;
    else if (k === "--manifest-only") a.manifestOnly = true;
    else if (k === "--force") a.force = true;
    else if (k === "--chapter") a.chapter = parseInt(argv[++i], 10);
    else if (k === "--chapters") { const [lo, hi] = argv[++i].split("-"); a.chapMin = parseInt(lo, 10); a.chapMax = parseInt(hi ?? lo, 10); }
    else if (k === "--model") a.model = argv[++i];
    else if (k === "--delay") a.delay = parseFloat(argv[++i]);
  }
  return a;
}

function loadScenes() {
  const raw = JSON.parse(readFileSync(join(HERE, "scene-prompts.json"), "utf8"));
  const list = Array.isArray(raw) ? raw : raw.scenes || [];
  if (!list.length) throw new Error("scene-prompts.json has no entries");
  return list;
}

// nano-banana batch writes `{id}.png`; id == ch{NN}-scene-{nn} so it lines up with the page convention.
function idFor(s) {
  return `ch${String(s.chapter).padStart(2, "0")}-scene-${s.scene}`;
}

function buildManifest(scenes) {
  return scenes.map((s) => {
    const avoid = (s.negativePrompt || "").trim();
    const prompt = avoid ? `${s.prompt}\n\nAVOID — do not depict: ${avoid}` : s.prompt;
    return { id: idFor(s), prompt };
  });
}

function convert(pngPath, base) {
  const webp = join(ART_DIR, `${base}.webp`);
  const jpg = join(ART_DIR, `${base}.jpg`);
  try {
    execFileSync("cwebp", ["-q", "82", "-quiet", pngPath, "-o", webp], { stdio: "inherit" });
  } catch {
    execFileSync("python3", ["-c",
      `from PIL import Image;Image.open(${JSON.stringify(pngPath)}).convert("RGB").save(${JSON.stringify(webp)},"WEBP",quality=82,method=6)`]);
  }
  execFileSync("python3", ["-c",
    `from PIL import Image;Image.open(${JSON.stringify(pngPath)}).convert("RGB").save(${JSON.stringify(jpg)},"JPEG",quality=84,optimize=True)`]);
  return { webp, jpg };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.all && !args.chapter && args.chapMin == null) {
    console.error("Specify --chapter N, --chapters A-B (shard), or --all. See header for flags.");
    process.exit(2);
  }
  mkdirSync(ART_DIR, { recursive: true });
  mkdirSync(STAGE_DIR, { recursive: true });

  let scenes = loadScenes();
  if (args.chapter) scenes = scenes.filter((s) => Number(s.chapter) === args.chapter);
  else if (args.chapMin != null) scenes = scenes.filter((s) => Number(s.chapter) >= args.chapMin && Number(s.chapter) <= args.chapMax);
  if (!args.force) scenes = scenes.filter((s) => !existsSync(join(ART_DIR, `${idFor(s)}.webp`)));
  const tag = args.chapter ? `ch${args.chapter}` : args.chapMin != null ? `ch${args.chapMin}-${args.chapMax}` : "all";
  console.log(`Scenes to generate: ${scenes.length} (${tag})`);
  if (!scenes.length) return console.log("Nothing to do (all targets already exist; use --force to redo).");

  const manifest = buildManifest(scenes);
  const manifestPath = join(HERE, `.manifest-${tag}.json`);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Manifest written: ${manifestPath} (${manifest.length} items)`);
  if (args.manifestOnly) return console.log("--manifest-only: stopping before any API call.");

  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    console.error("\nBLOCKED: GEMINI_API_KEY (or GOOGLE_API_KEY) is not set — cannot call the image model.");
    console.error("Set it and re-run; the manifest above is ready.");
    process.exit(1);
  }

  // Existing pipeline: nano-banana batch → PNG masters.
  execFileSync("python3", [GEN_PY, "batch",
    "--manifest", manifestPath, "--output-dir", STAGE_DIR,
    "--model", args.model, "--aspect-ratio", "1:1",
    "--skip-existing", "--delay", String(args.delay)], { stdio: "inherit" });

  // Convert masters → WebP + JPG fallback.
  let made = 0;
  for (const id of new Set(manifest.map((m) => m.id))) {
    const png = join(STAGE_DIR, `${id}.png`);
    if (!existsSync(png)) { console.warn(`  missing master (generation failed?): ${id}`); continue; }
    convert(png, id);
    made++;
  }
  console.log(`\nConverted ${made} image(s) → ${ART_DIR} (.webp + .jpg).`);
  const total = readdirSync(ART_DIR).filter((f) => f.endsWith(".webp")).length;
  console.log(`Total WebP scenes present: ${total} / 243.`);
}

main();
