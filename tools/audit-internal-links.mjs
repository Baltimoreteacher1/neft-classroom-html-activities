#!/usr/bin/env node
/**
 * Internal-link auditor — verifies every internal href/src in the site's source
 * HTML resolves to a real file/dir or a `_redirects` rule. Catches broken
 * navigation before it ships. Run with `npm run audit:links` (exits non-zero on
 * any unresolved link). Skips external URLs and JS-templated links (`${...}`).
 *
 * Note: this is a dev tool and is NOT published (tools/ is excluded from dist).
 */
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, dirname, resolve, extname } from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  "node_modules", "dist", ".git", ".github", ".claude", ".wrangler",
  ".qa-logs", ".playwright-mcp", "reports",
]);

// ---- gather source HTML files ----
const htmlFiles = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(p);
    } else if (e.isFile() && e.name.endsWith(".html")) {
      htmlFiles.push(p);
    }
  }
})(ROOT);

// ---- load _redirects source patterns ----
const redirects = [];
const redirPath = join(ROOT, "_redirects");
if (existsSync(redirPath)) {
  for (const line of readFileSync(redirPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const src = t.split(/\s+/)[0];
    if (src) redirects.push(src);
  }
}
function redirectCovers(pathname) {
  const bare = pathname.replace(/\/$/, "");
  for (const src of redirects) {
    if (src.endsWith("/*")) {
      if (pathname.startsWith(src.slice(0, -1))) return true;
    } else if (src.includes(":")) {
      const a = src.split("/"), b = pathname.split("/");
      if (a.length === b.length && a.every((seg, i) => seg.startsWith(":") || seg === b[i])) return true;
    } else if (src === pathname || src === bare) {
      return true;
    }
  }
  return false;
}

function existsTarget(fsPath) {
  if (existsSync(fsPath)) {
    try { return statSync(fsPath).isDirectory() ? existsSync(join(fsPath, "index.html")) : true; }
    catch { return false; }
  }
  if (!extname(fsPath) && existsSync(fsPath + ".html")) return true;
  return false;
}

const LINK_RE = /(?:href|src)\s*=\s*["']([^"'#]+)["']/gi;
const problems = [];
let linkCount = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const fileDir = dirname(file);
  const seen = new Set();
  let m;
  while ((m = LINK_RE.exec(html))) {
    let url = m[1].trim();
    if (!url) continue;
    if (/^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(url)) continue;
    if (url.includes("${") || url.includes("{{")) continue; // template literal
    // JS string-concatenation fragment, e.g. '<a href="/x/" + id + "/">' —
    // the captured value is a partial URL; the next non-space char is `+`.
    if (html.slice(m.index + m[0].length).trimStart().startsWith("+")) continue;
    url = url.split("#")[0].split("?")[0];
    if (!url || seen.has(url)) continue;
    seen.add(url);
    linkCount++;

    let pathname, fsPath;
    if (url.startsWith("/")) { pathname = url; fsPath = join(ROOT, url); }
    else { fsPath = resolve(fileDir, url); pathname = "/" + fsPath.slice(ROOT.length + 1); }

    if (existsTarget(fsPath)) continue;
    if (url.startsWith("/") && redirectCovers(pathname)) continue;
    problems.push({ file: file.slice(ROOT.length + 1), url });
  }
}

console.log(`audit:links — scanned ${htmlFiles.length} HTML files, ${linkCount} unique internal links.`);
if (!problems.length) {
  console.log("✓ All internal links resolve.");
  process.exit(0);
}
console.log(`✗ ${problems.length} unresolved internal link(s):`);
const byFile = {};
for (const p of problems) (byFile[p.file] ||= []).push(p.url);
for (const [f, urls] of Object.entries(byFile).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n${f}  (${urls.length})`);
  for (const u of [...new Set(urls)]) console.log(`   ✗ ${u}`);
}
process.exit(1);
