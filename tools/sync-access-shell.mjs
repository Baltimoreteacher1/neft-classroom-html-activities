#!/usr/bin/env node
/**
 * Keep the ACCESS Practice Lab shell, its cache versions and its offline worker in step.
 *
 *  1. access-practice-lab/app-shell stays byte-identical to index.html. The Pages Function
 *     functions/access-practice-lab/[[path]].js serves `app-shell` (an extensionless file — ASSETS returns it 200
 *     directly, while `/index.html` 308-redirects to `/` and loops) for clean deep-link URLs like
 *     /access-practice-lab/Speaking/B/<id>. If it drifts, deep links render a stale build (the "Activity 2 of 6" +
 *     empty panel bug).
 *  2. Every module and stylesheet URL carries a hash of its own bytes (`?v=<12 hex>`). Hashed URLs are served with
 *     `immutable` caching (the Pages Function) and kept offline (sw.js), so a version string that is not a content
 *     hash would pin a stale file for a year. Relative module imports resolve through the import map, so a cached
 *     dependency can never mix with a newer entry point.
 *  3. The entry module's static import chain is announced with <link rel="modulepreload"> so the browser fetches the
 *     whole chain in parallel instead of discovering it one import at a time.
 *  4. access-practice-lab/sw.js gets its build hash and precache lists between its `build:` markers.
 *
 * Runs as part of `npm run build`; commit the result (tools/build-injectors-idempotent.test.mjs checks it is stable).
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";

const dir = join(process.cwd(), "access-practice-lab");
const BASE = "/access-practice-lab";
const indexPath = join(dir, "index.html");
const shellPath = join(dir, "app-shell");
const swPath = join(dir, "sw.js");
const original = readFileSync(indexPath, "utf8");

const sha = (...buffers) => {
  const h = createHash("sha256");
  for (const b of buffers) h.update(b);
  return h.digest("hex").slice(0, 12);
};

function walk(directory, keep, prefix = "") {
  return readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const relative = `${prefix}${entry.name}`;
      if (entry.isDirectory()) return walk(join(directory, entry.name), keep, `${relative}/`);
      return entry.isFile() && keep(entry.name) ? [relative] : [];
    });
}

// ── module versions ───────────────────────────────────────────────────────────
const modules = walk(join(dir, "src"), (n) => n.endsWith(".js"));
const imports = Object.fromEntries(
  modules.map((relative) => {
    const url = `${BASE}/src/${relative}`;
    return [url, `${url}?v=${sha(readFileSync(join(dir, "src", relative)))}`];
  }),
);
const importMap = `<!-- lab-modules:begin -->\n    <script type="importmap">\n${JSON.stringify(
  { imports },
  null,
  2,
)
  .split("\n")
  .map((line) => `      ${line}`)
  .join("\n")}\n    </script>\n    <!-- lab-modules:end -->`;

// ── static import chain of the entry module ───────────────────────────────────
const STATIC_IMPORT = /(?:^|\n)\s*(?:import|export)\s+(?:[^'"()]*?\s+from\s+)?["']([^"']+)["']/g;
function staticChain(entry) {
  const seen = new Set();
  const visit = (url) => {
    if (seen.has(url) || !(url in imports)) return;
    seen.add(url);
    const source = readFileSync(join(dir, "src", url.slice(`${BASE}/src/`.length)), "utf8");
    for (const [, spec] of source.matchAll(STATIC_IMPORT)) {
      if (spec.startsWith("/")) visit(spec);
      else if (spec.startsWith(".")) visit(posix.join(dirname(url), spec));
    }
  };
  visit(entry);
  return [...seen];
}
const entryUrl = `${BASE}/src/main.js`;
const preload = staticChain(entryUrl)
  .filter((url) => url !== entryUrl)
  .map((url) => `    <link rel="modulepreload" href="${imports[url]}" />`)
  .join("\n");
const block = `${importMap}\n${preload ? `    <!-- lab-preload:begin -->\n${preload}\n    <!-- lab-preload:end -->\n` : ""}`;

const entryPattern =
  /<script type="module" src="\/access-practice-lab\/src\/main\.js(?:\?[^"\s]*)?"><\/script>/;
if (!entryPattern.test(original))
  throw new Error("ACCESS shell is missing its main module entry point.");

let index = original.includes("<!-- lab-modules:begin -->")
  ? original.replace(
      /<!-- lab-modules:begin -->[\s\S]*?<!-- lab-modules:end -->\n(?:    <!-- lab-preload:begin -->[\s\S]*?<!-- lab-preload:end -->\n)?/,
      block,
    )
  : original.replace(entryPattern, `${block}    $&`);
index = index.replace(entryPattern, `<script type="module" src="${imports[entryUrl]}"></script>`);

// ── stylesheet versions ───────────────────────────────────────────────────────
const sheets = [];
index = index.replace(
  /href="(\/access-practice-lab\/[A-Za-z0-9._-]+\.css)\?v=[^"]*"/g,
  (_, href) => {
    const versioned = `${href}?v=${sha(readFileSync(join(dir, href.slice(`${BASE}/`.length))))}`;
    sheets.push(versioned);
    return `href="${versioned}"`;
  },
);

if (index !== original) {
  writeFileSync(indexPath, index);
  console.log("sync-access-shell: module and stylesheet versions updated in index.html.");
}

let current = "";
try {
  current = readFileSync(shellPath, "utf8");
} catch {}
if (current === index) console.log("sync-access-shell: app-shell already matches index.html.");
else {
  writeFileSync(shellPath, index);
  console.log("sync-access-shell: app-shell updated to mirror index.html.");
}

// ── offline worker ────────────────────────────────────────────────────────────
const content = walk(join(dir, "content"), (n) => n.endsWith(".json")).map(
  (f) => `${BASE}/content/${f}`,
);
const pictures = walk(join(dir, "pictures"), (n) => n.endsWith(".svg")).map(
  (f) => `${BASE}/pictures/${f}`,
);
const core = [...sheets, ...Object.values(imports)];
const more = [...content, ...pictures];
const buildHash = sha(
  index,
  ...[...content, ...pictures].map((u) => readFileSync(join(dir, u.slice(`${BASE}/`.length)))),
);
const list = (urls) => `[\n${urls.map((u) => `  ${JSON.stringify(u)},`).join("\n")}\n]`;
const swBlock = `/* build:begin */\nconst BUILD_HASH = ${JSON.stringify(buildHash)};\nconst PRECACHE_CORE = ${list(core)};\nconst PRECACHE_MORE = ${list(more)};\n/* build:end */`;
const sw = readFileSync(swPath, "utf8");
if (!/\/\* build:begin \*\/[\s\S]*?\/\* build:end \*\//.test(sw))
  throw new Error("sw.js is missing its build markers.");
const nextSw = sw.replace(/\/\* build:begin \*\/[\s\S]*?\/\* build:end \*\//, () => swBlock);
if (nextSw !== sw) {
  writeFileSync(swPath, nextSw);
  console.log(
    `sync-access-shell: sw.js build ${buildHash} (${core.length} core, ${more.length} content files).`,
  );
} else console.log("sync-access-shell: sw.js already current.");
