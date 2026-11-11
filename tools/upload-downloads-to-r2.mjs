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
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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

// Direct R2 REST calls (what wrangler uses underneath): no process spawn per file, so it is far faster.
const api =
  Boolean(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID) && !local;
const objectUrl = (key) =>
  `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${encodeURIComponent(key)}`;
const auth = () => ({ authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` });

async function putObject(f) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(objectUrl(f.rel), {
      method: "PUT",
      headers: { ...auth(), "content-type": contentType(f.rel) },
      body: readFileSync(f.abs),
    });
    if (res.ok) return;
    if (attempt >= 10 || (res.status < 500 && res.status !== 429)) {
      throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
    }
    // 429 = account rate limit (~4 req/s): back off hard so the whole run converges instead of failing.
    await new Promise((r) => setTimeout(r, Math.min(30000, 1000 * 2 ** attempt)));
  }
}

// Verify by CONTENT HASH, not size: download every object and compare with the manifest.
async function verifyApi() {
  // Resumable: hashes already confirmed this session are remembered in a temp file (never in the repo).
  const stateFile = join(tmpdir(), "r2-verified.json");
  const seen = new Set(existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, "utf8")) : []);
  const keys = Object.keys(manifest.files).filter(
    (k) => !seen.has(`${k}:${manifest.files[k].sha256}`),
  );
  let bad = 0;
  let i = 0;
  const get = async (key) => {
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(objectUrl(key), { headers: auth() });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
      if (attempt >= 10 || (res.status < 500 && res.status !== 429))
        throw new Error(`HTTP ${res.status}`);
      await new Promise((r) => setTimeout(r, Math.min(30000, 1000 * 2 ** attempt)));
    }
  };
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (i < keys.length) {
        const key = keys[i++];
        try {
          const got = createHash("sha256")
            .update(await get(key))
            .digest("hex");
          if (got !== manifest.files[key].sha256) throw new Error("content differs from manifest");
          seen.add(`${key}:${got}`);
          if (seen.size % 200 === 0) writeFileSync(stateFile, JSON.stringify([...seen]));
        } catch (e) {
          bad++;
          console.error(`MISSING/WRONG in R2: ${key} (${e.message})`);
        }
      }
    }),
  );
  writeFileSync(stateFile, JSON.stringify([...seen]));
  const total = Object.keys(manifest.files).length;
  console.log(
    bad
      ? `verify: ${bad} problem(s); ${seen.size}/${total} confirmed so far (re-run to continue)`
      : `verify: all ${total} object(s) present, content hash matches`,
  );
  process.exit(bad ? 1 : 0);
}

async function verify() {
  if (api) return verifyApi();
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
          if (api) await putObject(f);
          else
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
