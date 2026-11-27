#!/usr/bin/env node
/**
 * Keep the ACCESS Practice Lab shell, its cache versions and its offline worker in step.
 *
 *  1. access-practice-lab/app-shell stays byte-identical to index.html. The Pages Function
 *     functions/access-practice-lab/[[path]].js serves `app-shell` (an extensionless file — ASSETS returns it 200
 *     directly, while `/index.html` 308-redirects to `/` and loops) for clean deep-link URLs like
 *     /access-practice-lab/Speaking/B/<id>. If it drifts, deep links render a stale build (the "Activity 2 of 6" +
 *     empty panel bug).
 *  2. Every module and stylesheet URL carries a hash of its own bytes (`?v=<8 hex>`, see `version` below). Hashed URLs are served with
 *     `immutable` caching (the Pages Function) and kept offline (sw.js), so a version string that is not a content
 *     hash would pin a stale file for a year. Relative module imports resolve through the import map, so a cached
 *     dependency can never mix with a newer entry point.
 *  3. Only the entry module's static import chain is announced with <link rel="modulepreload">. Route views use
 *     literal dynamic imports and are cached after the first meaningful paint, not pulled onto the critical path.
 *  4. access-practice-lab/sw.js gets its build hash and precache lists between its `build:` markers.
 *
 * Runs as part of `npm run build`; commit the result (tools/build-injectors-idempotent.test.mjs checks it is stable).
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";

const root = process.cwd();
const dir = join(root, "access-practice-lab");
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
// Module and stylesheet versions: the first 8 hex of the file's SHA-256. A version only has to change when that one
// file changes (a 1 in 4 billion chance per edit of repeating), and the import map carries one per src module, so
// every hex digit saved is ~0.5 KB gzip off the shell (validate-language-page-performance: shellHtmlGzipKB).
// functions/access-practice-lab/[[path]].js checks served bytes against this length.
const version = (buffer) => sha(buffer).slice(0, 8);

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
    return [url, `${url}?v=${version(readFileSync(join(dir, "src", relative)))}`];
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
// This shared contract is first used from lazy class/pathway routes, but the shell can request it during an offline
// reload when a device already has a class link. Keep it in the install cache just like static external imports.
const externalModules = new Set(["/shared/class-platform/contract.js"]);
// Static dependencies that live outside src/ (the shared platform code), in discovery order. They are not in the
// import map, so without a modulepreload each one is only discovered after its parent has downloaded and parsed:
// an extra round trip per level on the entry module's critical path.
const sharedChain = new Set();
const SHARED_PREFIX = "/shared/";
function staticChain(entry) {
  const seen = new Set();
  const visit = (url) => {
    if (seen.has(url)) return;
    let source;
    if (url in imports)
      source = readFileSync(join(dir, "src", url.slice(`${BASE}/src/`.length)), "utf8");
    else if (url.startsWith(SHARED_PREFIX) && existsSync(join(root, url.slice(1)))) {
      sharedChain.add(url);
      source = readFileSync(join(root, url.slice(1)), "utf8");
    } else return;
    seen.add(url);
    for (const [, spec] of source.matchAll(STATIC_IMPORT)) {
      const target = spec.startsWith("/")
        ? spec
        : spec.startsWith(".")
          ? posix.join(dirname(url), spec)
          : null;
      if (!target) continue;
      if (target in imports || target.startsWith(SHARED_PREFIX)) visit(target);
      else if (spec.startsWith("/")) externalModules.add(spec);
    }
  };
  visit(entry);
  return [...seen].filter((url) => url in imports);
}
const entryUrl = `${BASE}/src/main.js`;
const srcPreload = staticChain(entryUrl)
  .filter((url) => url !== entryUrl)
  .map((url) => `    <link rel="modulepreload" href="${imports[url]}" />`);
const preload = [
  ...srcPreload,
  ...[...sharedChain].map((url) => `    <link rel="modulepreload" href="${url}" />`),
].join("\n");
for (const url of sharedChain) externalModules.add(url);
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
const criticalSheetPaths = new Set(
  [...original.matchAll(/<link\b[^>]*data-lab-critical[^>]*>/g)]
    .map(
      ([tag]) =>
        tag.match(/href="(\/access-practice-lab\/[A-Za-z0-9._-]+\.css)(?:\?v=[^"]*)?"/)?.[1],
    )
    .filter(Boolean),
);
const sheets = [];
const criticalSheets = [];
index = index.replace(
  /href="(\/access-practice-lab\/[A-Za-z0-9._-]+\.css)(?:\?v=[^"]*)?"/g,
  (_, href) => {
    const versioned = `${href}?v=${version(readFileSync(join(dir, href.slice(`${BASE}/`.length))))}`;
    sheets.push(versioned);
    if (criticalSheetPaths.has(href)) criticalSheets.push(versioned);
    return `href="${versioned}"`;
  },
);
if (!criticalSheets.length) throw new Error("ACCESS shell has no data-lab-critical stylesheets.");

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
// Raster scene variants belong in the optional offline pack, never the critical install path.
const pictures = walk(join(dir, "pictures"), (n) => /\.(svg|png|jpe?g|webp|avif)$/i.test(n)).map(
  (f) => `${BASE}/pictures/${f}`,
);
// Route stylesheets: views load these with ensureStylesheet("<file>.css") (src/util.js) instead of the shell linking
// them, so they are found from those calls and kept offline at the exact URL the view requests.
const routeSheets = [
  ...new Set(
    modules.flatMap((relative) =>
      [
        ...readFileSync(join(dir, "src", relative), "utf8").matchAll(
          /ensureStylesheet\(\s*["']([A-Za-z0-9._-]+\.css)["']\s*\)/g,
        ),
      ].map(([, file]) => {
        if (!existsSync(join(dir, file)))
          throw new Error(`src/${relative} loads ${file}, which does not exist.`);
        return `${BASE}/${file}`;
      }),
    ),
  ),
].sort();
const staticUrls = staticChain(entryUrl);
const staticModules = new Set(staticUrls.map((url) => imports[url]));
const criticalStyles = new Set(criticalSheets);
const core = [...criticalSheets, ...staticModules, ...externalModules];
const more = [
  ...sheets.filter((url) => !criticalStyles.has(url)),
  ...routeSheets,
  ...Object.values(imports).filter((url) => !staticModules.has(url)),
  ...content,
  ...pictures,
];
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
    `sync-access-shell: sw.js build ${buildHash} (${core.length} critical, ${more.length} background assets).`,
  );
} else console.log("sync-access-shell: sw.js already current.");
