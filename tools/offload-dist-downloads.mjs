#!/usr/bin/env node
/**
 * Build step (runs after `vite build`, before the dedupe step): drop lesson downloads from dist/ that are
 * already in R2, so they stop counting against Cloudflare Pages' 20,000-file limit.
 *
 * Safe by construction: a file leaves dist/ ONLY if data/r2-offload-manifest.json (written by
 * tools/upload-downloads-to-r2.mjs after a successful upload) lists it with an identical sha256.
 * No manifest, or an empty one, removes nothing. The Pages Function functions/lessons/[[path]].js
 * serves the same URL from the DOWNLOADS bucket.
 *
 *   node tools/offload-dist-downloads.mjs            apply
 *   node tools/offload-dist-downloads.mjs --dry-run  report only
 */
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { LESSONS_DIR } from "./lib/curriculum-source.mjs";
import { MANIFEST, planOffload, sha256 } from "./lib/r2-offload.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile()) out.push(p);
  }
  return out;
}

function main() {
  const dry = process.argv.includes("--dry-run");
  const manifestPath = join(ROOT, MANIFEST);
  if (!existsSync(manifestPath)) {
    console.log("offload-dist-downloads: no R2 manifest — nothing offloaded");
    return;
  }
  const uploaded = JSON.parse(readFileSync(manifestPath, "utf8")).files ?? {};
  if (!Object.keys(uploaded).length) {
    console.log("offload-dist-downloads: R2 manifest is empty — nothing offloaded");
    return;
  }
  const lessons = join(DIST, basename(LESSONS_DIR));
  if (!existsSync(lessons))
    throw new Error("offload-dist-downloads: dist/lessons missing — run vite build first");
  const files = walk(lessons)
    .filter((p) => statSync(p).size > 0)
    .map((p) => {
      const rel = relative(DIST, p).split(sep).join("/");
      return { rel, abs: p, hash: /\/downloads\//.test(rel) ? sha256(p) : "" };
    });
  const { drop, stale } = planOffload(files, uploaded);
  if (stale.length) {
    console.warn(
      `offload-dist-downloads: ${stale.length} file(s) changed since upload — kept in dist (re-run upload): ${stale.slice(0, 3).join(", ")}${stale.length > 3 ? ", …" : ""}`,
    );
  }
  if (dry) {
    console.log(`offload-dist-downloads (dry run): ${drop.length} file(s) would be served from R2`);
    return;
  }
  for (const rel of drop) rmSync(join(DIST, rel));
  console.log(`offload-dist-downloads: ${drop.length} lesson download(s) now served from R2`);
}

main();
