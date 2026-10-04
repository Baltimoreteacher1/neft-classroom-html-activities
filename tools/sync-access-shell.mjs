#!/usr/bin/env node
/**
 * Keep access-practice-lab/app-shell byte-identical to access-practice-lab/index.html.
 *
 * The Pages Function functions/access-practice-lab/[[path]].js serves `app-shell`
 * (an extensionless file — ASSETS returns it 200 directly, while `/index.html`
 * 308-redirects to `/` and loops) for clean deep-link URLs like
 * /access-practice-lab/Speaking/B/<id>. If app-shell drifts from index.html,
 * deep links render a stale build (this caused the "Activity 2 of 6" + empty
 * panel bug while the hub was current). Runs as part of `npm run build`.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "access-practice-lab");
const indexPath = join(dir, "index.html");
const original = readFileSync(indexPath, "utf8");
const shellPath = join(dir, "app-shell");

// Relative module imports are resolved through this map, so a cached dependency
// cannot be mixed with a newer entry point. Hashing the source also keeps versions
// current when a dependency changes without an edit to main.js.
function sourceModules(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const relative = `${prefix}${entry.name}`;
      if (entry.isDirectory()) {
        return sourceModules(join(directory, entry.name), `${relative}/`);
      }
      return entry.isFile() && entry.name.endsWith(".js") ? [relative] : [];
    });
}

const imports = Object.fromEntries(
  sourceModules(join(dir, "src")).map((relative) => {
    const url = `/access-practice-lab/src/${relative}`;
    const hash = createHash("sha256")
      .update(readFileSync(join(dir, "src", relative)))
      .digest("hex")
      .slice(0, 12);
    return [url, `${url}?v=${hash}`];
  }),
);
const map = `<!-- lab-modules:begin -->\n    <script type="importmap">\n${JSON.stringify(
  { imports },
  null,
  2,
)
  .split("\n")
  .map((line) => `      ${line}`)
  .join("\n")}\n    </script>\n    <!-- lab-modules:end -->`;
const entryPattern =
  /<script type="module" src="\/access-practice-lab\/src\/main\.js(?:\?[^"\s]*)?"><\/script>/;
if (!entryPattern.test(original)) {
  throw new Error("ACCESS shell is missing its main module entry point.");
}
let index = original.includes("<!-- lab-modules:begin -->")
  ? original.replace(/<!-- lab-modules:begin -->[\s\S]*?<!-- lab-modules:end -->/, map)
  : original.replace(entryPattern, `${map}\n    $&`);
index = index.replace(
  entryPattern,
  `<script type="module" src="${imports["/access-practice-lab/src/main.js"]}"></script>`,
);
if (index !== original) {
  writeFileSync(indexPath, index);
  console.log("sync-access-shell: module versions updated in index.html.");
}

let current = "";
try {
  current = readFileSync(shellPath, "utf8");
} catch {}

if (current === index) {
  console.log("sync-access-shell: app-shell already matches index.html.");
} else {
  writeFileSync(shellPath, index);
  console.log("sync-access-shell: app-shell updated to mirror index.html.");
}
