#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const BEGIN = "<!-- ewl-supports-injected:begin -->";
const END = "<!-- ewl-supports-injected:end -->";
const HEAD = `${BEGIN}\n    <link rel="stylesheet" href="/assets/learning-supports/learning-supports.css" />\n    ${END}`;
const BODY = `${BEGIN}\n    <script src="/assets/learning-supports/learning-supports.js" defer></script>\n    ${END}`;
const args = new Set(process.argv.slice(2));

function ids() {
  return readdirSync(LESSONS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+-\d+$/.test(entry.name))
    .filter((entry) => existsSync(join(LESSONS, entry.name, "config.json")))
    .map((entry) => entry.name);
}

function removeIntegration(html) {
  return html
    .replace(
      /\s*<!-- ewl-supports-injected:begin -->[\s\S]*?<!-- ewl-supports-injected:end -->/g,
      "",
    )
    .replace(/\sdata-ewl-supports-lesson="\d+-\d+"/, "");
}

function integrated(html, id) {
  return (
    html.includes(`data-ewl-supports-lesson="${id}"`) &&
    html.includes("/assets/learning-supports/learning-supports.css") &&
    html.includes("/assets/learning-supports/learning-supports.js")
  );
}

let changed = 0;
let missing = 0;
for (const id of ids()) {
  const path = join(LESSONS, id, "index.html");
  const original = readFileSync(path, "utf8");
  if (args.has("--check")) {
    if (!integrated(original, id)) missing++;
    continue;
  }
  if (args.has("--revert")) {
    const reverted = removeIntegration(original);
    if (reverted !== original) {
      writeFileSync(path, reverted);
      changed++;
    }
    continue;
  }
  if (integrated(original, id)) continue;
  let html = removeIntegration(original);
  html = html.replace(/<html(\s[^>]*)?>/i, function (tag) {
    return tag.replace(/>$/, ` data-ewl-supports-lesson="${id}">`);
  });
  html = html.replace(/<\/head>/i, `    ${HEAD}\n</head>`);
  html = html.replace(/<\/body>/i, `    ${BODY}\n</body>`);
  if (!integrated(html, id)) throw new Error(`Could not integrate Learning Supports into ${id}`);
  writeFileSync(path, html);
  changed++;
}

if (args.has("--check") && missing) {
  console.error(`Learning Supports integration check FAIL — ${missing} canonical lessons missing`);
  process.exit(1);
}
console.log(
  `Learning Supports ${args.has("--check") ? "check" : args.has("--revert") ? "revert" : "injection"} PASS — ${changed || 64} canonical lessons`,
);
