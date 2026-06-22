#!/usr/bin/env node
/**
 * One-time repair for injection-damaged print/report generators.
 *
 * The Save/Resume injector matched a literal </body> INSIDE a JS string in a
 * page's print/export generator and split the line. The later relocation fix
 * pulled the injected <script> back out of the string but left the line split,
 * leaving a string literal broken across a newline (a SyntaxError that kills
 * the whole inline script).
 *
 * This rejoins ONLY the `<quote>\n</body>` break, and ONLY when doing so turns a
 * failing inline <script> into a parsing one. Verify-after-fix: no blind edits.
 *
 * Usage: node tools/repair-injection-strings.mjs [--write]
 */
import { readFileSync, writeFileSync } from "fs";
import vm from "vm";

const WRITE = process.argv.includes("--write");
const files = process.argv.filter((a) => a.endsWith(".html"));
if (!files.length) {
  console.error("Pass the HTML files to repair.");
  process.exit(2);
}

const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const BREAK_RE = /(['"])\n[ \t]*(<\/body>)/g;

function parses(code) {
  try { new vm.Script(code); return true; } catch { return false; }
}

let changed = 0;
for (const file of files) {
  const html = readFileSync(file, "utf8");
  let out = "";
  let last = 0;
  let fileChanged = false;
  let m;
  SCRIPT_RE.lastIndex = 0;
  while ((m = SCRIPT_RE.exec(html))) {
    const attrs = m[1] || "";
    const body = m[2];
    const bodyStart = m.index + m[0].indexOf(body, attrs.length);
    const isClassic = !/\bsrc\s*=/.test(attrs) &&
      !/\btype\s*=\s*["']?(application\/json|text\/template|importmap|module)/i.test(attrs);
    if (isClassic && !parses(body) && BREAK_RE.test(body)) {
      const fixed = body.replace(BREAK_RE, "$1$2");
      if (parses(fixed)) {
        out += html.slice(last, bodyStart) + fixed;
        last = bodyStart + body.length;
        fileChanged = true;
        continue;
      }
    }
  }
  out += html.slice(last);
  if (fileChanged) {
    changed++;
    console.log(`${WRITE ? "fixed" : "would fix"}: ${file}`);
    if (WRITE) writeFileSync(file, out);
  } else {
    console.log(`no change: ${file}`);
  }
}
console.log(`\n${changed} file(s) ${WRITE ? "repaired" : "would be repaired"}.`);
