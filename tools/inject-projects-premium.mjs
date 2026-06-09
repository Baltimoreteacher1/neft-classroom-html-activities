#!/usr/bin/env node
/**
 * Inject the Projects PREMIUM design layer into every unit-project page.
 *
 * - Version pages (math/unit-N/projects/version-{a,b}/index.html): already use
 *   <body class="pk">, so we only add the premium stylesheet <link>.
 * - Index/hub pages (math/unit-N/projects/index.html): add the <link> AND tag
 *   <body> with `pk-hub` so the storefront premium rules apply.
 *
 * Idempotent: safe to re-run. Edits source files in place (Cloudflare rebuilds
 * dist/ from source on push to main).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LINK =
  '<link rel="stylesheet" href="/shared/projects/projects-premium.css" />';
const TABS_CSS =
  '<link rel="stylesheet" href="/shared/projects/projects-tabs.css" />';
const TABS_JS =
  '<script src="/shared/projects/projects-tabs.js" defer></script>';

const UNITS = Array.from({ length: 10 }, (_, i) => i + 1);
let changed = 0;
const touched = [];

function addLink(html) {
  if (html.includes("projects-premium.css")) return html;
  // Insert just before </head>, matching the indentation style already in use.
  return html.replace(/([ \t]*)<\/head>/i, `$1  ${LINK}\n$1</head>`);
}

function addHubClass(html) {
  if (/<body[^>]*\bpk-hub\b/.test(html)) return html;
  if (/<body class="[^"]*"/.test(html)) {
    return html.replace(/<body class="([^"]*)"/, '<body class="$1 pk-hub"');
  }
  return html.replace(/<body(\s|>)/, '<body class="pk-hub"$1');
}

// Version pages (with .phase sections) get the tabbed-stepper enhancement.
function addTabsAssets(html) {
  if (!html.includes("projects-tabs.css")) {
    html = html.replace(/([ \t]*)<\/head>/i, `$1  ${TABS_CSS}\n$1</head>`);
  }
  if (!html.includes("projects-tabs.js")) {
    html = html.replace(/([ \t]*)<\/body>/i, `$1  ${TABS_JS}\n$1</body>`);
  }
  return html;
}

function process(rel, { hub, tabs } = {}) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    console.warn("  skip (missing):", rel);
    return;
  }
  const before = fs.readFileSync(file, "utf8");
  let after = addLink(before);
  if (hub) after = addHubClass(after);
  if (tabs) after = addTabsAssets(after);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed++;
    touched.push(rel);
  }
}

const DIRS = [
  ...UNITS.map((u) => `math/unit-${u}/projects`),
  "math/statistics/projects",
];

for (const dir of DIRS) {
  process(`${dir}/index.html`, { hub: true });
  process(`${dir}/version-a/index.html`, { tabs: true });
  process(`${dir}/version-b/index.html`, { tabs: true });
}

console.log(`Projects premium injection: ${changed} file(s) updated.`);
touched.forEach((t) => console.log("  +", t));
