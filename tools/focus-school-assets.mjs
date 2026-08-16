/* Focus School — deployed-artifact integrity.
 *
 * Local tests cannot catch this class of bug: a <script> whose URL exists in
 * the repo but NOT in the deployed Pages project. Cloudflare answers with the
 * SPA HTML fallback, the browser refuses it on strict MIME checking, and the
 * feature is silently dead. That is exactly how /assets/formula-popup.js broke.
 *
 *   node tools/focus-school-assets.mjs [baseUrl]
 *
 * With no URL it audits the local files (references resolve on disk); with a
 * URL it fetches every referenced asset and checks the real content type.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const BASE = process.argv[2] || "";
const DIR = "focus-school";
const results = [];
let failed = 0;
const ok = (name, cond, detail = "") => {
  results.push([cond, name, detail]);
  if (!cond) failed++;
};

const index = readFileSync(path.join(DIR, "index.html"), "utf8");
const sw = readFileSync(path.join(DIR, "sw.js"), "utf8");

// --- Collect every runtime reference ---------------------------------------
const refs = new Set();
for (const m of index.matchAll(/<script[^>]+src="([^"]+)"/g)) refs.add(m[1]);
for (const m of index.matchAll(/<link[^>]+href="([^"]+)"/g)) refs.add(m[1]);
// Service-worker precache list.
const coreBlock = /const CORE = \[([\s\S]*?)\];/.exec(sw);
// Strip // comments first: the CORE block explains itself with filenames in
// prose ("unit-1.html"), which would otherwise be read as precache entries.
const coreBody = coreBlock ? coreBlock[1].replace(/^\s*\/\/.*$/gm, "") : "";
const precache = [...coreBody.matchAll(/"([^"]+)"/g)].map((m) => m[1]);

const EXPECTED_TYPE = [
  [/\.js(\?|$)/, /javascript|ecmascript/],
  [/\.css(\?|$)/, /text\/css/],
  [/\.webmanifest(\?|$)/, /manifest|json/],
  [/\.svg(\?|$)/, /svg/],
  [/\.png(\?|$)/, /image\/png/],
];

function expectedFor(url) {
  for (const [re, type] of EXPECTED_TYPE) if (re.test(url)) return type;
  return null;
}

ok(
  "index.html references at least one script and one stylesheet",
  refs.size >= 2,
  `${refs.size} refs`,
);
ok("the service worker has a precache list", precache.length > 0, `${precache.length} entries`);

// --- Version agreement (a stale PWA shell is the classic failure) ----------
for (const asset of ["app.js", "styles.css", "planner-core.js"]) {
  const re = new RegExp(`${asset.replace(".", "\\.")}\\?v=(\\d+)`);
  const a = re.exec(index);
  const b = re.exec(sw);
  ok(`${asset} is versioned in index.html`, !!a, a ? `v=${a[1]}` : "missing");
  ok(`${asset} is precached by the service worker`, !!b, b ? `v=${b[1]}` : "missing");
  if (a && b)
    ok(`${asset} versions agree between shell and worker`, a[1] === b[1], `${a[1]} vs ${b[1]}`);
}

if (!BASE) {
  // --- Local mode: every reference must resolve to a real file -------------
  for (const ref of [...refs, ...precache]) {
    if (/^(https?:)?\/\//.test(ref) || ref.startsWith("data:")) continue;
    const clean = ref.split("?")[0];
    // Root-relative paths are served from the repo root at deploy time and
    // vendored into the app dir by scripts/deploy-noam.sh.
    const candidates = clean.startsWith("/")
      ? [path.join(".", clean.slice(1)), path.join(DIR, clean.slice(1))]
      : [path.join(DIR, clean)];
    // Directory-style entries ("./", "hebrew/") resolve to an index page.
    const found =
      candidates.some((c) => existsSync(c)) ||
      candidates.some((c) => existsSync(`${c}index.html`) || existsSync(`${c}.html`));
    ok(`local: ${ref} resolves to a real file`, found, candidates.join(" | "));
  }
} else {
  // --- Production mode: fetch and verify the real content type -------------
  const root = BASE.replace(/\/$/, "");
  const seen = new Set();
  for (const ref of [...refs, ...precache]) {
    if (/^(https?:)?\/\//.test(ref) || ref.startsWith("data:")) continue;
    const url = ref.startsWith("/") ? `${root}${ref}` : `${root}/${ref.replace(/^\.\//, "")}`;
    if (seen.has(url)) continue;
    seen.add(url);
    let res;
    try {
      res = await fetch(`${url}${url.includes("?") ? "&" : "?"}cb=${Date.now()}`);
    } catch (err) {
      ok(`prod: ${ref} is reachable`, false, String(err.message));
      continue;
    }
    const type = (res.headers.get("content-type") || "").toLowerCase();
    ok(`prod: ${ref} responds 200`, res.ok, `${res.status}`);
    const want = expectedFor(ref);
    if (want && res.ok) {
      // THE bug this tool exists for: a .js URL served as text/html means the
      // file is missing and Pages returned the SPA fallback.
      ok(`prod: ${ref} is served as the right type (not an HTML fallback)`, want.test(type), type);
    }
  }
  // Manifest icons must actually exist, or install shows a broken app.
  try {
    const mres = await fetch(`${root}/manifest.webmanifest?cb=${Date.now()}`);
    const manifest = await mres.json();
    ok("prod: manifest parses as JSON", true);
    ok("prod: manifest declares a name", !!(manifest.name || manifest.short_name), manifest.name);
    for (const icon of manifest.icons || []) {
      const iurl = icon.src.startsWith("/") ? `${root}${icon.src}` : `${root}/${icon.src}`;
      const ir = await fetch(`${iurl}?cb=${Date.now()}`);
      ok(
        `prod: manifest icon ${icon.src} exists`,
        ir.ok && /image\//.test(ir.headers.get("content-type") || ""),
        `${ir.status} ${ir.headers.get("content-type")}`,
      );
    }
  } catch (err) {
    ok("prod: manifest is valid", false, String(err.message));
  }
}

for (const [pass, name, detail] of results) {
  if (!pass || process.env.VERBOSE) {
    console.log(`${pass ? "  ✓" : "  ✗"} ${name}${detail ? `  — ${detail}` : ""}`);
  }
}
console.log(
  `\nasset integrity${BASE ? ` (${BASE})` : " (local)"}: ${results.length - failed}/${results.length} passed`,
);
process.exit(failed ? 1 : 0);
