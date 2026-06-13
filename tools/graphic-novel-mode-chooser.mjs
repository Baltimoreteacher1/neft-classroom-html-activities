#!/usr/bin/env node
/* =============================================================================
 * graphic-novel-mode-chooser.mjs — add a Student / Teacher entry screen to every
 * self-contained Axiom City graphic novel, idempotently and reversibly.
 *
 * WHY
 *   Novels render a #teacherBtn that opens a Teacher Guide (answers/notes).
 *   Instead of a hidden ?teacher=1 trick, every novel now opens to a clear
 *   two-button landing screen: "Student" (read the story) or "Teacher" (show the
 *   teaching guide). Students never reach teacher content by accident, and the
 *   teacher view is discoverable without typing a URL.
 *
 * WHAT
 *   Injects, immediately before the final </body>, a full-screen overlay + a
 *   classic <script> (runs AFTER the inline engine has wired #teacherBtn, so
 *   removing the button can't null its listener):
 *     - Student → removes #teacherBtn and the overlay (no teacher content).
 *     - Teacher → removes the overlay, leaves #teacherBtn visible.
 *     - ?teacher=1 in the URL → skips the overlay straight to teacher view
 *       (keeps existing teacher links working).
 *   The choice is per visit (not remembered) so a shared device always re-asks.
 *
 * USAGE
 *   node tools/graphic-novel-mode-chooser.mjs            # inject (writes)
 *   node tools/graphic-novel-mode-chooser.mjs --dry-run  # report only
 *   node tools/graphic-novel-mode-chooser.mjs --revert   # remove injected block
 *
 * SAFETY
 *   - Only touches *.html under graphic-novels/ that contain id="teacherBtn".
 *   - Idempotent via the sentinel marker; --revert strips exactly what it added.
 * ========================================================================== */

import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOVELS_DIR = join(ROOT, "graphic-novels");
const MARK = "nt-gn-mode-chooser";

const BLOCK = `<!-- ${MARK}:begin (Student/Teacher entry screen — tools/graphic-novel-mode-chooser.mjs) -->
<style>
.ntgn-chooser{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;background:linear-gradient(160deg,#0f2030,#1c3a52);color:#fff;text-align:center;padding:24px;font-family:'Segoe UI',system-ui,sans-serif}
.ntgn-chooser h1{font-size:1.5rem;margin:0;max-width:24ch;line-height:1.25}
.ntgn-chooser p{margin:0;opacity:.82;max-width:40ch}
.ntgn-row{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:6px}
.ntgn-btn{min-width:210px;padding:22px 26px;border-radius:16px;border:3px solid transparent;cursor:pointer;display:flex;flex-direction:column;gap:6px;align-items:center;font:800 1.15rem/1.2 'Segoe UI',system-ui,sans-serif;transition:transform .12s ease,box-shadow .12s ease}
.ntgn-btn small{font-weight:600;font-size:.82rem;opacity:.85}
.ntgn-btn:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,0,0,.3)}
.ntgn-btn:focus-visible{outline:3px solid #fff;outline-offset:3px}
.ntgn-student{background:#f2c15b;color:#12355b}
.ntgn-teacher{background:#1fa6a2;color:#fff}
@media (prefers-reduced-motion:reduce){.ntgn-btn{transition:none}.ntgn-btn:hover{transform:none}}
</style>
<div class="ntgn-chooser" id="ntgnChooser" role="dialog" aria-modal="true" aria-label="Choose how you are opening this story">
  <h1>How are you opening this story?</h1>
  <p>Students read and play the story. Teachers also get the teaching guide.</p>
  <div class="ntgn-row">
    <button type="button" class="ntgn-btn ntgn-student" id="ntgnStudent">📖 I'm a Student<small>Read the story</small></button>
    <button type="button" class="ntgn-btn ntgn-teacher" id="ntgnTeacher">🍎 I'm a Teacher<small>Show the teaching guide</small></button>
  </div>
</div>
<script>(function(){
  var box=document.getElementById("ntgnChooser");
  function removeTeacherBtn(){var b=document.getElementById("teacherBtn");if(b&&b.parentNode){b.parentNode.removeChild(b);}}
  function close(){if(box&&box.parentNode){box.parentNode.removeChild(box);}}
  try{
    if(new URLSearchParams(location.search).get("teacher")==="1"){close();return;}
  }catch(e){}
  var s=document.getElementById("ntgnStudent"),t=document.getElementById("ntgnTeacher");
  if(s){s.addEventListener("click",function(){removeTeacherBtn();close();});}
  if(t){t.addEventListener("click",function(){close();});}
  if(s){s.focus();}
})();</script>
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
  if (mode === "inject") {
    writeFileSync(file, html.slice(0, idx) + BLOCK + html.slice(idx));
  }
  injected++;
}

const tag = mode === "dry" ? " (dry-run: nothing written)" : "";
console.log(`Graphic-novel mode chooser — mode: ${mode}${tag}`);
if (mode === "revert") console.log(`  reverted        : ${reverted}`);
else {
  console.log(`  newly injected  : ${injected}`);
  console.log(`  already injected: ${already}`);
}
console.log(`  skipped (no btn): ${skipped}`);
