// Byte-parity gate for the engine extraction (spec: docs/superpowers/specs/
// 2026-09-05-engine-extraction-design.md). Snapshots dist/ as {path: sha256}
// after normalizing bytes that legitimately differ between builds of the same
// source. Every normalization rule carries a reason; rules are added only from
// a double-build probe on one commit, never to make a failing compare pass.
//
//   node tools/parity/parity-check.mjs --snapshot <manifest.json>
//   node tools/parity/parity-check.mjs --compare  <manifest.json>
//
// PARITY_DIST overrides the dist directory (tests use fixture dirs).
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import process from "node:process";

// [pathMatcher, transform, reason]
const NORMALIZATIONS = [
  [
    (p) => p === "access-practice-lab/config.json" || p === "access-practice-lab/inventory/config.json",
    (text) => {
      // tools/stamp-build.mjs rewrites this stamp on every build by design.
      try {
        const o = JSON.parse(text);
        delete o.builtAt;
        delete o.commit;
        delete o.buildStamp;
        return JSON.stringify(o);
      } catch {
        return text;
      }
    },
    "stamp-build.mjs build stamp (varies per build by design)",
  ],
  [
    (p) => p.endsWith(".html") || p.endsWith("sw.js"),
    (text) =>
      text
        .replace(/data-build-stamp="[^"]*"/g, 'data-build-stamp=""')
        .replace(/BUILD_STAMP\s*=\s*["'][^"']*["']/g, 'BUILD_STAMP=""'),
    "HTML/service-worker build stamps re-stamped each build",
  ],
  [
    (p) => p.endsWith("sw.js"),
    (text) => text.replace(/nt-cache-\d+/g, "nt-cache-"),
    "service-worker cache name embeds a per-build epoch (M0 probe: sw.js x10)",
  ],
  [
    (p) => p.endsWith(".html"),
    (text) => text.replace(/\?v=[a-z0-9]+(["'])/g, "?v=$1"),
    "asset cache-buster query stamps regenerated per build (M0 probe: curriculum html x3)",
  ],
];

// Generated archives whose bytes differ per build only via zip entry metadata
// and OOXML dcterms timestamps (verified by unzip-and-diff in the M0 probe).
// Their manifest hash is taken over concatenated entry CONTENTS (unzip -p)
// with dcterms timestamps stripped, so real content drift still fails parity.
const ARCHIVE_RE = /\.(docx|zip)$/;

function archiveContentBuffer(fullPath) {
  const bytes = execFileSync("unzip", ["-p", fullPath], { maxBuffer: 1 << 28 });
  const text = bytes.toString("latin1").replace(
    /<dcterms:(created|modified)[^<]*<\/dcterms:\1>/g,
    "<dcterms:$1/>",
  );
  return Buffer.from(text, "latin1");
}

export function normalizeContent(relPath, text) {
  let out = text;
  for (const [match, transform] of NORMALIZATIONS) {
    if (match(relPath)) out = transform(out);
  }
  return out;
}

function walk(dir, root, acc) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, root, acc);
    else if (entry.isFile()) acc.push(relative(root, full));
  }
  return acc;
}

const TEXT_RE = /\.(html|js|mjs|css|json|svg|txt|xml|webmanifest|map)$/;

export function buildManifest(rootDir) {
  const manifest = {};
  for (const rel of walk(rootDir, rootDir, []).sort()) {
    let data;
    if (ARCHIVE_RE.test(rel)) {
      data = archiveContentBuffer(join(rootDir, rel));
    } else {
      const raw = readFileSync(join(rootDir, rel));
      data = TEXT_RE.test(rel) ? Buffer.from(normalizeContent(rel, raw.toString("utf8"))) : raw;
    }
    manifest[rel] = createHash("sha256").update(data).digest("hex");
  }
  return manifest;
}

export function diffManifests(baseline, candidate) {
  const diffs = [];
  for (const p of Object.keys(baseline)) {
    if (!(p in candidate)) diffs.push({ path: p, kind: "removed" });
    else if (candidate[p] !== baseline[p]) diffs.push({ path: p, kind: "changed" });
  }
  for (const p of Object.keys(candidate)) {
    if (!(p in baseline)) diffs.push({ path: p, kind: "added" });
  }
  return diffs.sort((x, y) => x.path.localeCompare(y.path));
}

const [, , mode, file] = process.argv;
if (mode === "--snapshot" || mode === "--compare") {
  if (!file) {
    console.error("usage: parity-check.mjs --snapshot|--compare <manifest.json>");
    process.exit(2);
  }
  const dist = process.env.PARITY_DIST ?? join(process.cwd(), "dist");
  const manifest = buildManifest(dist);
  if (mode === "--snapshot") {
    writeFileSync(file, JSON.stringify(manifest, null, 1));
    console.log(`snapshot: ${Object.keys(manifest).length} files -> ${file}`);
  } else {
    const baseline = JSON.parse(readFileSync(file, "utf8"));
    const diffs = diffManifests(baseline, manifest);
    if (diffs.length === 0) {
      console.log(`PARITY PASS — ${Object.keys(manifest).length} files identical to ${file}`);
    } else {
      console.error(`PARITY FAIL — ${diffs.length} difference(s) vs ${file}:`);
      for (const d of diffs) console.error(`  ${d.kind.padEnd(7)} ${d.path}`);
      process.exit(1);
    }
  }
} else if (mode !== undefined) {
  console.error(`unknown mode: ${mode}`);
  process.exit(2);
}
