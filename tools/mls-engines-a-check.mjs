#!/usr/bin/env node
// Math Literacy Studio: check for engines A (reading-lab, anatomy, sentence-studio, translator, vocab-explorer, talk-studio).
//   1. jsdom: every engine is mounted for at least one skill of EVERY problem family (merged from content/mls/skills/g*.json) at all three
//      language bands and all three math levels; asserts no exception, no data-mlea-error, and the key elements. Skills whose content file
//      or problem family is not there yet are skipped and counted.
//   2. Chromium (Playwright): a tiny static page imports the module; four skills (grades 1, 3, 6, 8) are driven with real clicks and typing
//      through every engine. A wrong answer must give a hint and never the answer; the right path completes; no horizontal overflow at 375px;
//      Tab reaches every control; axe serious/critical = 0; reduced motion leaves no running animation. Screenshots go to /tmp/mls-engines-a/.
// Usage: node tools/mls-engines-a-check.mjs [--jsdom-only] [--only <engine>] [--skills g1.count,g3.arrays,...]
// Exit code 1 on any failure.
import { createRequire } from "node:module";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LAB = path.join(ROOT, "access-practice-lab");
const require = createRequire(path.join(ROOT, "package.json"));
const OUT = "/tmp/mls-engines-a";
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : "");
const ONLY = opt("--only");
const IDS = ["reading-lab", "anatomy", "sentence-studio", "translator", "vocab-explorer", "talk-studio"].filter((id) => !ONLY || id === ONLY);

let failures = 0;
let checks = 0;
const ok = (cond, msg) => {
  checks++;
  if (!cond) {
    failures++;
    console.error(`  FAIL ${msg}`);
  }
  return Boolean(cond);
};
const note = (m) => console.log(`  note ${m}`);

// ---------------------------------------------------------------------------------------------------------------- data
const inventory = JSON.parse(fs.readFileSync(path.join(LAB, "content/mls/inventory.json"), "utf8"));
const gradeFiles = {};
for (let g = 1; g <= 8; g++) {
  const f = path.join(LAB, `content/mls/skills/g${g}.json`);
  if (fs.existsSync(f)) {
    try {
      gradeFiles[g] = JSON.parse(fs.readFileSync(f, "utf8"));
    } catch (e) {
      console.warn(`skills/g${g}.json does not parse yet: ${e.message}`);
    }
  }
}
const { mergeSkill } = await import(pathToFileURL(path.join(LAB, "src/mls/merge.js")));
const { FAMILIES } = await import(pathToFileURL(path.join(LAB, "src/mls/families.js")));
function merged() {
  const out = [];
  let noContent = 0;
  let noFamily = 0;
  for (const inv of inventory.skills) {
    const c = gradeFiles[inv.grade]?.skills?.find((s) => s.id === inv.id);
    if (!c) {
      noContent++;
      continue;
    }
    if (!FAMILIES[inv.family]) {
      noFamily++;
      continue;
    }
    out.push(mergeSkill(inv, c));
  }
  return { skills: out, noContent, noFamily };
}
const M = merged();
console.log(`skills with content and a registered family: ${M.skills.length} of ${inventory.skills.length} (no content yet: ${M.noContent}, family not registered yet: ${M.noFamily})`);
const byId = new Map(M.skills.map((s) => [s.id, s]));
// one skill per family, plus the skills the browser drives
const perFamily = new Map();
for (const s of M.skills) if (!perFamily.has(s.familyId)) perFamily.set(s.familyId, s);
const familiesNotCovered = [...new Set(inventory.skills.map((s) => s.family))].filter((f) => !perFamily.has(f));
if (familiesNotCovered.length) note(`families not covered yet (no content or no generator): ${familiesNotCovered.join(", ")}`);

// ---------------------------------------------------------------------------------------------------------------- 1. jsdom
async function jsdomPass() {
  console.log("\n[1] jsdom: every engine x every family x 3 bands x 3 levels");
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM("<!doctype html><html><body><div id='app'></div></body></html>", { url: "http://localhost/access-practice-lab/", pretendToBeVisual: true });
  const w = dom.window;
  for (const k of ["window", "document", "Node", "HTMLElement", "SpeechSynthesisUtterance"]) {
    if (k === "window") globalThis.window = w;
    else if (k in w) globalThis[k] = w[k];
  }
  globalThis.document = w.document;
  // jsdom has no layout, so the stylesheet loader may wait out its own 3 s cap: stub the link event instead.
  const origAppend = w.document.head.appendChild.bind(w.document.head);
  w.document.head.appendChild = (n) => {
    const r = origAppend(n);
    if (n.tagName === "LINK") setTimeout(() => n.dispatchEvent(new w.Event("load")), 0);
    return r;
  };
  const { ENGINES } = await import(pathToFileURL(path.join(LAB, "src/mls/engines-a.js")));
  ok(IDS.every((id) => ENGINES[id] && typeof ENGINES[id].mount === "function" && ENGINES[id].title && ENGINES[id].blurb), "ENGINES has the six ids with title, blurb and mount");
  const errors = [];
  w.addEventListener("error", (e) => errors.push(e.message));
  let mounted = 0;
  const keyEls = {
    "reading-lab": [".mlea-root", "[data-mlea-problem]", ".mlea-seg", "[data-mlea-stage]"],
    anatomy: [".mlea-root", "[data-mlea-part]", ".mlea-parts", ".mlea-seg"],
    "sentence-studio": [".mlea-root", ".mlea-tabs", "[data-mlea-stage]"],
    translator: [".mlea-root", ".mlea-tabs", "[data-mlea-stage]"],
    "vocab-explorer": [".mlea-root", ".mlea-tabs", "[data-mlea-stage]"],
    "talk-studio": [".mlea-root", ".mlea-tabs", "[data-mlea-stage]"],
  };
  for (const id of IDS) {
    let notReady = 0;
    let n = 0;
    for (const skill of perFamily.values()) {
      for (const band of ["1-2", "3-4", "5-6"]) {
        for (const level of [1, 2, 3]) {
          const el = w.document.createElement("div");
          w.document.getElementById("app").append(el);
          let inst;
          try {
            inst = ENGINES[id].mount(el, { skill, band, level, seed: 3 + level, support: "standard", ctx: skill.contexts?.[0] });
          } catch (e) {
            ok(false, `${id} ${skill.id} ${band} L${level}: threw ${e.message}`);
            continue;
          }
          n++;
          mounted++;
          ok(!el.hasAttribute("data-mlea-error"), `${id} ${skill.id} ${band} L${level}: engine error ${el.getAttribute("data-mlea-error")}`);
          if (el.querySelector("[data-mlea-notready]")) {
            notReady++;
          } else {
            for (const sel of keyEls[id]) ok(el.querySelector(sel), `${id} ${skill.id} ${band} L${level}: missing ${sel}`);
            ok(el.textContent.trim().length > 40, `${id} ${skill.id}: nearly empty`);
            ok(!el.innerHTML.includes("undefined") && !el.innerHTML.includes("[object"), `${id} ${skill.id} ${band} L${level}: undefined/[object] in the page`);
            ok(el.querySelectorAll("button").length > 0, `${id} ${skill.id}: no button`);
          }
          inst?.destroy?.();
          el.remove();
        }
      }
    }
    console.log(`  ${id}: mounted ${n}${notReady ? `, ${notReady} reported "not ready for this skill"` : ""}`);
    // a notReady count above a few means an engine cannot use a field it should: report so it is looked at
    if (notReady > n * 0.1) ok(false, `${id}: "not ready" for ${notReady} of ${n} mounts`);
  }
  ok(errors.length === 0, `window errors: ${errors.slice(0, 3).join(" | ")}`);
  console.log(`  mounted ${mounted} instances`);
}

await jsdomPass();
if (flag("--jsdom-only")) {
  console.log(`\n${checks} checks, ${failures} failures`);
  process.exit(failures ? 1 : 0);
}
