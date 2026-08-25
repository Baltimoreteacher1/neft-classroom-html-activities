#!/usr/bin/env node
import { execFileSync } from "node:child_process";
/**
 * self-host-fonts.mjs — every font this site serves comes from this origin.
 *
 * WHY. A render-blocking stylesheet on fonts.googleapis.com is not the slow
 * case when that host is BLOCKED — the request fails fast and paint proceeds.
 * It is catastrophic when a school network ACCEPTS the connection and never
 * answers: measured on this tree with the CDN hung, a converted worksheet
 * paints in 28ms and an unconverted printable takes 12,048ms. Kids on a bad
 * network stare at a white page for twelve seconds.
 *
 * THE CONTRACT. data/font-bundles.json maps a bundle name to the EXACT
 * request URL it was built from, and a bundle may only ever replace that
 * request. Weight sets are not decoration: give a page a real 800 where the
 * CDN supplied none and the browser stops synthesising one from 700 — the
 * glyphs widen, the line rewraps, the page moves. An earlier pass reverted
 * 941 printables for exactly that. Adding an UNUSED family or weight is free
 * (a face is only fetched when something matches it); changing a used one is
 * not, which is why substitution is by exact URL and never by "close enough".
 *
 * MODES
 *   --discover   scan the tree for fonts.googleapis.com requests and add any
 *                that have no bundle yet, naming them after their families
 *                plus a hash of the url. Writes data/font-bundles.json.
 *   --fetch      build public/assets/fonts/<name>.css for every manifest entry,
 *                downloading each woff2 once and sharing it by content hash.
 *   --rewrite    swap every known url in the tree for its bundle, and drop the
 *                preconnect hints from files that no longer call the CDN.
 *   --check      report what is still on the CDN and why. Changes nothing.
 *
 * Bundles live in public/, NOT in the source tree. vite.config.js sets
 * assetsInlineLimit: 100000, so a woff2 Vite can resolve is base64'd INTO the
 * CSS bundle — with the fonts in assets/, the shared stylesheet went from
 * 278 KB to 4.1 MB. Vite copies public/ verbatim and never resolves into it.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = resolve(ROOT, "data/font-bundles.json");
const OUT_DIR = resolve(ROOT, "public/assets/fonts");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const CDN_RE = /https:\/\/fonts\.googleapis\.com\/css2\?[^"')\s\\]+/g;

const load = () => JSON.parse(readFileSync(MANIFEST, "utf8"));
const save = (m) => {
  m.bundles = Object.fromEntries(Object.entries(m.bundles).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(MANIFEST, `${JSON.stringify(m, null, 2)}\n`);
};

/** Every tracked file that still asks the CDN for a stylesheet. */
function filesWithCdn() {
  const out = execFileSync(
    "rg",
    [
      "-l",
      "fonts\\.googleapis\\.com",
      "--glob",
      "!node_modules",
      "--glob",
      "!dist",
      "--glob",
      "!public/assets/fonts",
      "--glob",
      "!tools/self-host-fonts.mjs",
      "--glob",
      "!data/font-bundles.json",
      // Verification code is not a shipped surface. Two tests carry a CDN link
      // ON PURPOSE — one proves the SCORM packager flags it, one proves this
      // tool's own bundle contract — and rewriting their fixtures quietly
      // turned both into tests that could no longer fail.
      "--glob",
      "!**/*.test.mjs",
      "--glob",
      "!**/*.spec.ts",
      "--glob",
      "!**/*.spec.js",
      "--glob",
      "!tests/**",
      ".",
    ],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 64e6 },
  );
  return out
    .split("\n")
    .filter(Boolean)
    .map((f) => f.replace(/^\.\//, ""));
}

/** A readable, stable name: the families it carries plus a hash of the url. */
function nameFor(url) {
  const fams = [...url.matchAll(/family=([^:&]+)/g)]
    .map((m) => decodeURIComponent(m[1]).replace(/\+/g, "-").toLowerCase())
    .slice(0, 2)
    .join("-");
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 6);
  return `${fams || "fonts"}-${hash}`;
}

async function discover() {
  const m = load();
  const known = new Set(Object.values(m.bundles).map((b) => b.url));
  const found = new Map();
  for (const f of filesWithCdn()) {
    for (const url of readFileSync(resolve(ROOT, f), "utf8").match(CDN_RE) ?? []) {
      if (!found.has(url)) found.set(url, new Set());
      found.get(url).add(f);
    }
  }
  let added = 0;
  for (const [url, files] of [...found].sort((a, b) => b[1].size - a[1].size)) {
    if (known.has(url)) continue;
    const sample = [...files].slice(0, 3).join(", ");
    m.bundles[nameFor(url)] = {
      url,
      why: `${files.size} page(s) request this exact set — e.g. ${sample}`,
    };
    added++;
  }
  save(m);
  console.log(`discover: ${found.size} distinct request(s) in the tree, ${added} newly recorded.`);
  console.log(`          ${Object.keys(m.bundles).length} bundles in ${"data/font-bundles.json"}`);
}

async function fetchAll() {
  const m = load();
  mkdirSync(OUT_DIR, { recursive: true });
  const seen = new Map();
  let downloaded = 0;
  for (const [name, { url }] of Object.entries(m.bundles)) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok)
      throw new Error(`${name}: CDN answered ${res.status} — refusing to write a partial bundle`);
    const css = await res.text();
    let local = css;
    for (const hit of css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)) {
      const remote = hit[1];
      let file = seen.get(remote);
      if (!file) {
        const buf = Buffer.from(
          await (await fetch(remote, { headers: { "User-Agent": UA } })).arrayBuffer(),
        );
        const fam =
          (css.slice(0, hit.index).match(/font-family:\s*'([^']+)'/g) || []).pop() || "font";
        const slug = fam
          .replace(/font-family:\s*'/, "")
          .replace(/'/, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
        file = `${slug}-${createHash("sha1").update(buf).digest("hex").slice(0, 8)}.woff2`;
        if (!existsSync(resolve(OUT_DIR, file))) {
          writeFileSync(resolve(OUT_DIR, file), buf);
          downloaded += buf.length;
        }
        seen.set(remote, file);
      }
      local = local.split(remote).join(`/assets/fonts/${file}`);
    }
    writeFileSync(
      resolve(OUT_DIR, `${name}.css`),
      `/* Generated by tools/self-host-fonts.mjs from:\n   ${url}\n   Same families, weights and styles the CDN served; font-display: swap is\n   preserved from the source. No family, weight, size or line-height changed. */\n${local}`,
    );
    console.log(`  ${name.padEnd(34)} ${(local.match(/@font-face/g) || []).length} faces`);
  }
  console.log(
    `fetch: ${seen.size} unique woff2, ${(downloaded / 1024).toFixed(0)} KB newly downloaded`,
  );
}

function rewrite() {
  const m = load();
  const byUrl = new Map(
    Object.entries(m.bundles).map(([name, b]) => [b.url, `/assets/fonts/${name}.css`]),
  );
  let changed = 0;
  const stillCdn = new Map();
  for (const f of filesWithCdn()) {
    const p = resolve(ROOT, f);
    const before = readFileSync(p, "utf8");
    // Match the WHOLE url and look it up, never substring-replace. One page
    // requests a bare `family=Inter`, which is a strict prefix of eight other
    // requests — replacing by substring turned
    //   .../css2?family=Inter:wght@400;500&family=Outfit:...
    // into
    //   /assets/fonts/inter-1033a1.css:wght@400;500&family=Outfit:...
    // in 30 files, a dead stylesheet link on every game it touched.
    let text = before.replace(CDN_RE, (hit) => byUrl.get(hit) ?? hit);
    const left = text.match(CDN_RE) ?? [];
    if (!left.length) {
      // Nothing calls the CDN from this file any more, so the hints are dead
      // weight — a preconnect to a host you never contact still costs a DNS
      // lookup and a TLS handshake. Not line-anchored: several of these pages
      // are minified onto a single line, and an anchored strip silently left
      // their hints behind.
      text = text.replace(
        /[ \t]*<link\s+rel="preconnect"\s+href="https:\/\/fonts\.(?:googleapis|gstatic)\.com"[^>]*>\r?\n?/g,
        "",
      );
    }
    for (const u of left) stillCdn.set(u, (stillCdn.get(u) ?? 0) + 1);
    if (text !== before) {
      writeFileSync(p, text);
      changed++;
    }
  }
  console.log(`rewrite: ${changed} file(s) converted.`);
  if (stillCdn.size) {
    console.log(`still on the CDN — no bundle recorded for these (run --discover then --fetch):`);
    for (const [u, n] of [...stillCdn].sort((a, b) => b[1] - a[1]))
      console.log(`  ${String(n).padStart(4)}x  ${u.slice(0, 100)}`);
  }
}

function check() {
  const files = filesWithCdn();
  const byUrl = new Map();
  for (const f of files)
    for (const u of readFileSync(resolve(ROOT, f), "utf8").match(CDN_RE) ?? [])
      byUrl.set(u, (byUrl.get(u) ?? 0) + 1);
  console.log(
    `check: ${files.length} file(s) still reference the font CDN, ${byUrl.size} distinct request(s).`,
  );
  for (const [u, n] of [...byUrl].sort((a, b) => b[1] - a[1]).slice(0, 40))
    console.log(`  ${String(n).padStart(4)}x  ${u.slice(0, 110)}`);
}

const mode = process.argv.find((a) => a.startsWith("--")) ?? "--check";
if (mode === "--discover") await discover();
else if (mode === "--fetch") await fetchAll();
else if (mode === "--rewrite") rewrite();
else if (mode === "--check") check();
else {
  console.error(`unknown mode ${mode} — expected --discover, --fetch, --rewrite or --check`);
  process.exit(1);
}
