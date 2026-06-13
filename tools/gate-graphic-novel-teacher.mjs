#!/usr/bin/env node
/* =============================================================================
 * gate-graphic-novel-teacher.mjs — hide the graphic-novel "Teacher" button from
 * students, idempotently and reversibly.
 *
 * WHY
 *   Each self-contained Axiom City graphic novel renders a `#teacherBtn` HUD
 *   button that opens a Teacher Guide modal (answers/teaching notes). It was
 *   shown to everyone. Lessons gate teacher content behind `?teacher=1`; the
 *   novels did not. This brings them in line.
 *
 * WHAT
 *   Injects, immediately before the final </body>, a tiny classic <script> that
 *   removes #teacherBtn unless the URL has `?teacher=1`. It runs AFTER the inline
 *   engine has wired the button's click handler (the engine scripts are classic
 *   and appear earlier in the document), so removal never nulls the listener.
 *   The Teacher Guide modal is only ever opened by that button, so removing it
 *   fully gates the teacher content. Teachers append `?teacher=1` to see it.
 *
 * USAGE
 *   node tools/gate-graphic-novel-teacher.mjs            # inject (writes)
 *   node tools/gate-graphic-novel-teacher.mjs --dry-run  # report only
 *   node tools/gate-graphic-novel-teacher.mjs --revert   # remove injected gate
 *
 * SAFETY
 *   - Only touches *.html under graphic-novels/ that contain id="teacherBtn".
 *   - Idempotent via the sentinel marker; --revert strips exactly what it added.
 *   - Never touches node_modules/dist/.git.
 * ========================================================================== */

import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOVELS_DIR = join(ROOT, "graphic-novels");
const MARK = "nt-gn-teacher-gate";
const BLOCK = `<!-- ${MARK}:begin (hide Teacher button from students — tools/gate-graphic-novel-teacher.mjs) -->
<script>(function(){try{if(new URLSearchParams(location.search).get("teacher")!=="1"){var b=document.getElementById("teacherBtn");if(b&&b.parentNode){b.parentNode.removeChild(b);}}}catch(e){}})();</script>
<!-- ${MARK}:end -->
`;
const BLOCK_RE = new RegExp(
  `\\n?<!-- ${MARK}:begin[\\s\\S]*?${MARK}:end -->\\n?`,
  "g",
);

const mode = process.argv.includes("--revert")
  ? "revert"
  : process.argv.includes("--dry-run")
    ? "dry"
    : "inject";

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name.startsWith(".")) {
      continue;
    }
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

let injected = 0;
let already = 0;
let reverted = 0;
let skipped = 0;

for (const file of walk(NOVELS_DIR)) {
  let html = readFileSync(file, "utf8");
  if (!/id="teacherBtn"/.test(html)) {
    skipped++;
    continue;
  }

  if (mode === "revert") {
    if (html.includes(MARK)) {
      writeFileSync(file, html.replace(BLOCK_RE, "\n"));
      reverted++;
    }
    continue;
  }

  if (html.includes(MARK)) {
    already++;
    continue;
  }

  const idx = html.lastIndexOf("</body>");
  if (idx === -1) {
    skipped++;
    continue;
  }
  const next = html.slice(0, idx) + BLOCK + html.slice(idx);
  if (mode === "inject") writeFileSync(file, next);
  injected++;
}

const tag = mode === "dry" ? " (dry-run: nothing written)" : "";
console.log(`Graphic-novel teacher-gate — mode: ${mode}${tag}`);
if (mode === "revert") {
  console.log(`  reverted        : ${reverted}`);
} else {
  console.log(`  newly gated     : ${injected}`);
  console.log(`  already gated   : ${already}`);
}
console.log(`  skipped (no btn): ${skipped}`);
