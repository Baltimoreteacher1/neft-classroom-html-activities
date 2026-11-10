#!/usr/bin/env node
/**
 * Upload lesson downloads (lessons/<id>/downloads/**) to the R2 bucket bound as DOWNLOADS and record each
 * success in data/r2-offload-manifest.json. Only uploaded files are ever dropped from dist/
 * (tools/offload-dist-downloads.mjs), so an interrupted run is harmless: re-run and it resumes.
 *
 *   CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… node tools/upload-downloads-to-r2.mjs
 *   node tools/upload-downloads-to-r2.mjs --dry-run      list what would upload
 *   node tools/upload-downloads-to-r2.mjs --local        wrangler's local simulator (no credentials; for tests)
 *   --limit N        upload at most N files    --concurrency N   (default 8)
 *   --verify         re-read every manifest entry from R2 and compare sizes (remote only)
 *
 * Needs a token with "Workers R2 Storage: Edit". Or run `npx wrangler login` once on your own computer.
 */
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { LESSONS_DIR } from "./lib/curriculum-source.mjs";
import { BUCKET, contentType, isOffloadable, MANIFEST, sha256 } from "./lib/r2-offload.mjs";

const run = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => (args.includes(n) ? Number(args[args.indexOf(n) + 1]) : d);
const dry = flag("--dry-run");
const local = flag("--local");
const limit = opt("--limit", Infinity);
const concurrency = opt("--concurrency", 8);
const where = local ? "--local" : "--remote";

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile()) out.push(p);
  }
  return out;
}

const manifestPath = join(ROOT, MANIFEST);
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, "utf8"))
  : { bucket: BUCKET, files: {} };
manifest.bucket = BUCKET;
const save = () => {
  mkdirSync(dirname(manifestPath), { recursive: true });
  const sorted = Object.fromEntries(
    Object.entries(manifest.files).sort(([a], [b]) => (a < b ? -1 : 1)),
  );
  writeFileSync(manifestPath, `${JSON.stringify({ ...manifest, files: sorted }, null, 1)}\n`);
};

const wrangler = (...a) =>
  run("npx", ["--yes", "wrangler@4", ...a], { cwd: ROOT, maxBuffer: 1 << 24 });

async function verify() {
  if (local) throw new Error("--verify reads the real bucket; drop --local");
  let bad = 0;
  const keys = Object.keys(manifest.files);
  let i = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (i < keys.length) {
        const key = keys[i++];
        const tmp = join(ROOT, ".r2-verify.tmp");
        try {
          await wrangler("r2", "object", "get", `${BUCKET}/${key}`, "--file", tmp, "--remote");
          if (statSync(tmp).size !== manifest.files[key].size) throw new Error("size mismatch");
        } catch (e) {
          bad++;
          console.error(`MISSING/WRONG in R2: ${key} (${e.message.split("\n")[0]})`);
        }
      }
    }),
  );
  console.log(
    bad
      ? `verify: ${bad} problem(s)`
      : `verify: all ${keys.length} object(s) present with matching size`,
  );
  process.exit(bad ? 1 : 0);
}

async function main() {
  if (flag("--verify")) return verify();
  if (!dry && !local && !process.env.CLOUDFLARE_API_TOKEN) {
    const { stdout } = await run("npx", ["--yes", "wrangler@4", "whoami"], { cwd: ROOT }).catch(
      (e) => e,
    );
    if (!/associated with the email|Account ID/i.test(String(stdout))) {
      console.error(
        "Not authenticated: set CLOUDFLARE_API_TOKEN (+ CLOUDFLARE_ACCOUNT_ID) or run `npx wrangler login`. Nothing uploaded.",
      );
      process.exit(2);
    }
  }
  const todo = [];
  for (const abs of walk(LESSONS_DIR)) {
    const rel = relative(ROOT, abs).split(sep).join("/");
    if (!isOffloadable(rel) || statSync(abs).size === 0) continue;
    const hash = sha256(abs);
    if (manifest.files[rel]?.sha256 === hash) continue;
    todo.push({ rel, abs, hash, size: statSync(abs).size });
  }
  const batch = todo.slice(0, limit);
  console.log(
    `${todo.length} file(s) to upload (${Object.keys(manifest.files).length} already in manifest)${dry ? " — dry run" : ""}`,
  );
  if (dry) return;

  let done = 0;
  let failed = 0;
  let i = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (i < batch.length) {
        const f = batch[i++];
        try {
          await wrangler(
            "r2",
            "object",
            "put",
            `${BUCKET}/${f.rel}`,
            "--file",
            f.abs,
            "--content-type",
            contentType(f.rel),
            where,
          );
          manifest.files[f.rel] = { sha256: f.hash, size: f.size };
          if (++done % 100 === 0) {
            save();
            console.log(`  ${done}/${batch.length}`);
          }
        } catch (e) {
          failed++;
          console.error(`FAILED ${f.rel}: ${String(e.stderr || e.message).split("\n")[0]}`);
        }
      }
    }),
  );
  save();
  console.log(`uploaded ${done}, failed ${failed}. Manifest: ${MANIFEST}`);
  process.exit(failed ? 1 : 0);
}

main();
