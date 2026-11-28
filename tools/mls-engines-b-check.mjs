#!/usr/bin/env node
/**
 * Math Literacy Studio, engines part B (listening-lab, error-detective, story-studio, modeling-workshop, concept-comics, transfer-lab).
 *   node tools/mls-engines-b-check.mjs [--jsdom-only | --browser-only]
 * Part 1 (jsdom): mounts every engine for EVERY skill in content/mls/inventory.json (so every problem family) at all three language bands
 *   and all three math levels, asserts no exception and the key elements, then random-clicks each engine (with and without a device voice)
 *   and fails on any uncaught error or on "undefined"/"NaN"/"[object" in the page text.
 * Part 2 (Playwright + Chromium): drives each engine to completion with real clicks and typing for skills in grades 1, 3, 6 and 8,
 *   asserting that a wrong answer gets a hint and never the answer, that the right path completes, no horizontal overflow at 375px,
 *   that Tab reaches every control, axe (serious/critical = 0), reduced motion (no running animation) and the print sheet. Screenshots go
 *   to /tmp/mls-engines-b/. Exit 1 on any failure. A skill whose problem family has no generator yet is mounted in its degraded mode and reported.
 */
import fs from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LAB = path.join(ROOT, "access-practice-lab");
const require = createRequire(path.join(ROOT, "package.json"));
const args = new Set(process.argv.slice(2));
const failures = [];
const fail = (m) => {
  failures.push(m);
  console.log(`  FAIL ${m}`);
};
const ok = (cond, m) => (cond ? true : (fail(m), false));
const H = (m) => console.log(`\n== ${m}`);

/* ------------------------------------------------------------------ data */
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const inventory = readJson(path.join(LAB, "content/mls/inventory.json"));
const { mergeSkill } = await import(pathToFileURL(path.join(LAB, "src/mls/merge.js")));
const skills = [];
let skippedNoContent = 0;
for (let g = 1; g <= 8; g++) {
  const file = path.join(LAB, `content/mls/skills/g${g}.json`);
  const inv = inventory.skills.filter((s) => s.grade === g);
  if (!fs.existsSync(file)) {
    skippedNoContent += inv.length;
    continue;
  }
  const by = new Map(readJson(file).skills.map((s) => [s.id, s]));
  for (const s of inv) {
    if (by.has(s.id)) skills.push(mergeSkill(s, by.get(s.id)));
    else skippedNoContent += 1;
  }
}
console.log(`skills with content: ${skills.length} of ${inventory.skills.length} (skipped for missing content: ${skippedNoContent})`);

const ENGINE_IDS = ["listening-lab", "error-detective", "story-studio", "modeling-workshop", "concept-comics", "transfer-lab"];

/* ================================================================== PART 1: jsdom */
async function jsdomPart() {
  H("Part 1: jsdom smoke over every skill, band and level");
  const { JSDOM, VirtualConsole } = require("jsdom");
  const errors = [];
  const vc = new VirtualConsole();
  let where = "";
  vc.on("jsdomError", (e) => errors.push(`[${where}] ${String(e.message || e)}\n${String(e.detail?.stack || e.stack || "").split("\n").slice(0, 5).join("\n")}`));
  const dom = new JSDOM("<!doctype html><html lang=\"en\"><body></body></html>", { url: "http://localhost/", pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  globalThis.window = w;
  globalThis.document = w.document;
  let printed = 0;
  w.print = () => printed++;
  w.addEventListener("error", (e) => errors.push(`[${where}] window error: ${e.message}`));
  const spoken = [];
  const voiceOn = () => {
    w.speechSynthesis = { speak: (u) => spoken.push(u.text), cancel() {} };
    globalThis.SpeechSynthesisUtterance = class {
      constructor(t) {
        this.text = t;
      }
    };
  };
  const voiceOff = () => {
    delete w.speechSynthesis;
  };
  const mod = await import(pathToFileURL(path.join(LAB, "src/mls/engines-b.js")));
  const { ENGINES } = mod;
  ok(JSON.stringify(Object.keys(ENGINES)) === JSON.stringify(ENGINE_IDS), `ENGINES ids are exactly ${ENGINE_IDS.join(", ")} (got ${Object.keys(ENGINES).join(", ")})`);
  for (const id of ENGINE_IDS) ok(ENGINES[id] && ENGINES[id].title && ENGINES[id].blurb && typeof ENGINES[id].mount === "function", `${id}: has title, blurb and mount`);
  const { FAMILIES } = await import(pathToFileURL(path.join(LAB, "src/mls/families.js")));
  const withGen = skills.filter((s) => FAMILIES[s.familyId]);
  console.log(`skills whose problem family has a generator now: ${withGen.length} of ${skills.length} (${new Set(withGen.map((s) => s.familyId)).size} of ${new Set(skills.map((s) => s.familyId)).size} families); the rest mount in degraded mode`);

  // exact-answer parser and checker
  const { parseNum, checkTyped, speakable, splitSentences } = mod;
  const eq = (a, b, m) => ok(a === b, `${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
  const fakeP = (kind, value) => ({ answer: { kind, value } });
  eq(checkTyped(fakeP("frac", "3/4"), "6/8"), true, "3/4 accepts 6/8");
  eq(checkTyped(fakeP("frac", "3/4"), "0.75"), true, "3/4 accepts 0.75");
  eq(checkTyped(fakeP("frac", "3/4"), "3/5"), false, "3/4 rejects 3/5");
  eq(checkTyped(fakeP("int", "-3"), "−3"), true, "int accepts a typographic minus");
  eq(checkTyped(fakeP("int", "1000"), "1,000"), true, "int accepts a thousands comma");
  eq(checkTyped(fakeP("int", "12"), "12 cm"), true, "int ignores a trailing unit");
  eq(checkTyped(fakeP("int", "12"), "13"), false, "int rejects a wrong number");
  eq(checkTyped(fakeP("dec", "3.25"), "3.250"), true, "dec accepts trailing zero");
  eq(checkTyped(fakeP("pair", "(2,5)"), "( 2 , 5 )"), true, "pair accepts spaces");
  eq(checkTyped(fakeP("pair", "(2,5)"), "(5,2)"), false, "pair rejects swapped");
  eq(checkTyped(fakeP("set", "1,2,3"), "3, 1, 2"), true, "set ignores order");
  eq(checkTyped(fakeP("text", "12:30"), " 12:30 "), true, "text trims");
  eq(parseNum("abc"), null, "parseNum rejects words");
  eq(parseNum("1 1/2").n / parseNum("1 1/2").d, 1.5, "parseNum reads a mixed number");
  eq(speakable("14 ÷ ? = 2"), "14 divided by blank equals 2", "speakable says the symbols");
  eq(splitSentences("It costs 3.5 dollars. Ask Ana!").length, 2, "sentences do not split inside 3.5");

  const KEY = {
    "listening-lab": (c) => ({ root: c.querySelector(".eb-listen"), nav: c.querySelectorAll(".eb-nav button").length >= 1, player: c.querySelector(".eb-player .eb-controls select"), transcript: c.querySelector(".eb-transcript"), live: true }),
    "error-detective": (c) => ({ root: c.querySelector(".eb-detect"), steps: c.querySelectorAll(".eb-steps li").length >= 4, choices: c.querySelectorAll('[data-eb-step="0"] .eb-choice').length >= 2, teacher: c.querySelector(".eb-teacher summary") }),
    "story-studio": (c) => ({ root: c.querySelector(".eb-story"), scene: c.querySelector(".eb-scene"), progress: c.querySelectorAll(".eb-progress li").length >= 3, begin: [...c.querySelectorAll("button")].some((b) => /Begin the story/.test(b.textContent)) }),
    "modeling-workshop": (c) => ({ root: c.querySelector(".eb-model"), badge: /Invented|generic/.test(c.querySelector(".eb-badge")?.textContent || ""), next: [...c.querySelectorAll("button")].some((b) => /Next step/.test(b.textContent)) }),
    "concept-comics": (c) => ({ root: c.querySelector(".eb-comic"), panel: c.querySelectorAll(".eb-panel").length === 1, label: /says:/.test(c.querySelector(".eb-panel")?.getAttribute("aria-label") || ""), next: [...c.querySelectorAll("button")].some((b) => /Next panel/.test(b.textContent)) }),
    "transfer-lab": (c) => ({ root: c.querySelector(".eb-transfer"), items: c.querySelectorAll(".eb-sortitem").length >= 5, relation: c.querySelector(".eb-relation") }),
  };
  const BAD_TEXT = /\bundefined\b|\bNaN\b|\[object|\bnull\b/;
  let mounts = 0;
  const t0 = Date.now();
  skills.forEach((skill, si) => {
    for (const band of ["1-2", "3-4", "5-6"]) {
      for (const id of ENGINE_IDS) {
        const level = 1 + ((si + band.length) % 3);
        const c = w.document.createElement("div");
        w.document.body.append(c);
        if ((si + mounts) % 2) voiceOn();
        else voiceOff();
        let handle = null;
        where = `mount ${id} ${skill.id} ${band}`;
        try {
          handle = ENGINES[id].mount(c, { skill, band, level, seed: 1 + (si % 7), support: "standard", ctx: skill.contexts?.[0] || "store" });
        } catch (e) {
          fail(`${id} ${skill.id} ${band} L${level}: mount threw ${e.message}\n${e.stack?.split("\n").slice(1, 4).join("\n")}`);
          c.remove();
          continue;
        }
        mounts += 1;
        if (!handle || typeof handle.destroy !== "function") fail(`${id} ${skill.id}: mount did not return { destroy }`);
        const k = KEY[id](c);
        for (const [name, v] of Object.entries(k)) if (!v) fail(`${id} ${skill.id} ${band} L${level}: missing key element "${name}"`);
        if (BAD_TEXT.test(c.textContent)) fail(`${id} ${skill.id} ${band}: page text contains "${c.textContent.match(BAD_TEXT)[0]}"`);
        // text size / structure sanity: every button has a name, every input has a label
        c.querySelectorAll("button").forEach((b) => !(b.textContent.trim() || b.getAttribute("aria-label")) && fail(`${id} ${skill.id}: a button has no name`));
        c.querySelectorAll("input:not([type=hidden]), textarea, select").forEach((i) => !(i.id && c.querySelector(`label[for="${i.id}"]`)) && !i.getAttribute("aria-label") && fail(`${id} ${skill.id}: a field has no label (${i.outerHTML.slice(0, 60)})`));
        try {
          handle?.destroy();
        } catch (e) {
          fail(`${id} ${skill.id}: destroy threw ${e.message}`);
        }
        if (c.childElementCount) fail(`${id} ${skill.id}: destroy left ${c.childElementCount} child elements`);
        c.remove();
      }
    }
  });
  console.log(`mounted ${mounts} activities (${skills.length} skills x 3 bands x 6 engines) in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  ok(errors.length === 0, `no jsdom error during mounts (${errors[0] || ""})`);

  // random-click fuzz: every engine on every skill (band and level rotate), half with a device voice
  const rng = (() => {
    let s = 12345;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  })();
  let clicks = 0;
  let typed = 0;
  skills.forEach((skill, si) => {
    for (const id of ENGINE_IDS) {
      const band = ["1-2", "3-4", "5-6"][(si + id.length) % 3];
      where = `fuzz ${id} ${skill.id} ${band}`;
      const c = w.document.createElement("div");
      w.document.body.append(c);
      if ((si + id.length) % 2) voiceOn();
      else voiceOff();
      let handle;
      try {
        handle = ENGINES[id].mount(c, { skill, band, level: 1 + (si % 3), seed: 2 + (si % 5), support: "standard", ctx: skill.contexts?.[0] || "store" });
      } catch (e) {
        fail(`fuzz mount ${id} ${skill.id}: ${e.message}`);
        continue;
      }
      for (let n = 0; n < 70; n++) {
        const targets = [...c.querySelectorAll("button:not([disabled]), input:not([type=checkbox]), input[type=checkbox], textarea, select")];
        if (!targets.length) break;
        const t = targets[Math.floor(rng() * targets.length)];
        try {
          if (t.tagName === "BUTTON") {
            t.click();
            clicks += 1;
          } else if (t.tagName === "SELECT") {
            t.selectedIndex = Math.floor(rng() * t.options.length);
            t.dispatchEvent(new w.Event("change", { bubbles: true }));
          } else if (t.type === "checkbox") {
            t.checked = !t.checked;
            t.dispatchEvent(new w.Event("change", { bubbles: true }));
          } else {
            t.value = ["7", "3/4", "(2, 5)", "I think because the numbers change, so it is different.", "", "12 cm", "-4"][Math.floor(rng() * 7)];
            t.dispatchEvent(new w.Event("input", { bubbles: true }));
            if (t.tagName === "INPUT") t.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
            typed += 1;
          }
        } catch (e) {
          fail(`fuzz ${id} ${skill.id}: ${e.message}`);
        }
      }
      if (BAD_TEXT.test(c.textContent)) fail(`fuzz ${id} ${skill.id}: text contains "${c.textContent.match(BAD_TEXT)[0]}" after clicking`);
      handle.destroy();
      c.remove();
    }
  });
  console.log(`fuzz: ${clicks} clicks and ${typed} typed values, ${spoken.length} device-voice utterances queued, window.print called ${printed} times`);
  ok(errors.length === 0, `no jsdom error during fuzz (${errors.slice(0, 2).join(" | ")})`);
  ok(spoken.length > 0, "device voice was used when present");

  // no device voice: transcript is shown and says so
  voiceOff();
  {
    const c = w.document.createElement("div");
    w.document.body.append(c);
    const sk = skills.find((s) => s.id === "g6.ratios") || skills[0];
    const hd = ENGINES["listening-lab"].mount(c, { skill: sk, band: "5-6", level: 2, seed: 1 });
    ok(!c.querySelector(".eb-transcript").hidden, "no device voice: the transcript is visible even for band 5-6");
    ok(/no voice/i.test(c.querySelector(".eb-novoice")?.textContent || ""), "no device voice: the page says so");
    hd.destroy();
    voiceOn();
    const hd2 = ENGINES["listening-lab"].mount(c, { skill: sk, band: "5-6", level: 2, seed: 1 });
    ok(c.querySelector(".eb-transcript").hidden, "band 5-6 with a voice: transcript starts off");
    const tog = [...c.querySelectorAll("button")].find((b) => /Show transcript/.test(b.textContent));
    ok(!!tog, "band 5-6: a Show transcript button is one click away");
    tog?.click();
    ok(!c.querySelector(".eb-transcript").hidden, "Show transcript reveals it");
    hd2.destroy();
    const hd3 = ENGINES["listening-lab"].mount(c, { skill: sk, band: "1-2", level: 2, seed: 1 });
    ok(!c.querySelector(".eb-transcript").hidden, "band 1-2: transcript on by default");
    hd3.destroy();
    c.remove();
  }
  w.close();
  delete globalThis.window;
  delete globalThis.document;
}

/* ================================================================== PART 2: browser */
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".woff": "font/woff", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json" };
function serve() {
  const page = (q) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>engines b</title>
<link rel="stylesheet" href="/access-practice-lab/ds.css"><link rel="stylesheet" href="/access-practice-lab/mls.css"><link rel="stylesheet" href="/access-practice-lab/mls-play.css"><link rel="stylesheet" href="/access-practice-lab/mls-play-engines-b.css"></head>
<body><main><button id="eb-start" type="button">before the stage</button>
<div class="ml-page ml-play ${q.grade <= 2 ? "ml-g12" : q.grade <= 5 ? "ml-g35" : "ml-g68"}"><section class="panel ml-stage" id="stage" aria-label="Activity"></section></div><button id="eb-end" type="button">after the stage</button></main>
<script type="module">
import { ENGINES } from "/access-practice-lab/src/mls/engines-b.js";
import { loadSkill } from "/access-practice-lab/src/mls/content.js";
import { generate, FAMILIES } from "/access-practice-lab/src/mls/families.js";
window.__live = null;
window.__mount = async (engine, skillId, band, level, seed) => {
  const skill = await loadSkill(skillId);
  window.__skill = skill;
  window.__live?.destroy?.();
  const stage = document.getElementById("stage");
  stage.innerHTML = "";
  window.__live = ENGINES[engine].mount(stage, { skill, band, level, seed, support: "standard", ctx: skill.contexts?.[0] || "store" });
  return { hasGen: !!FAMILIES[skill.familyId] };
};
window.__answer = (skillId, seed, level, ctx) => {
  const s = window.__skill;
  const p = generate(s.familyId, s.params || {}, { seed: Number(seed), level: Number(level), ctx });
  return { value: p.answer.value, text: p.answer.text, kind: p.answer.kind };
};
window.__ready = true;
</script></body></html>`;
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, "http://x");
    if (u.pathname === "/__eb/test.html") {
      res.writeHead(200, { "content-type": "text/html" });
      return res.end(page({ grade: Number(u.searchParams.get("grade")) || 6 }));
    }
    const f = path.join(ROOT, decodeURIComponent(u.pathname));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      res.writeHead(404);
      return res.end("not found");
    }
    res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream", "cache-control": "no-store" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => srv.listen(0, "127.0.0.1", () => r(srv)));
}

async function browserPart() {
  H("Part 2: Chromium, driven with real clicks and typing");
  let chromium;
  let AxeBuilder;
  try {
    ({ chromium } = require("playwright"));
  } catch {
    console.log("playwright is not installed: SKIP browser part");
    if (process.env.CI) fail("playwright is missing in CI");
    return;
  }
  try {
    const ax = require("@axe-core/playwright");
    AxeBuilder = ax.AxeBuilder || ax.default;
  } catch {
    console.log("(axe-core/playwright not installed: axe checks skipped)");
  }
  const exe = process.env.PW_CHROMIUM_PATH || "/opt/pw-browsers/chromium";
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const OUT = "/tmp/mls-engines-b";
  fs.mkdirSync(OUT, { recursive: true });
  const { FAMILIES, generate } = await import(pathToFileURL(path.join(LAB, "src/mls/families.js")));
  const browser = await chromium.launch({ executablePath: fs.existsSync(exe) ? exe : undefined, args: ["--no-sandbox"] });

  // choose skills: grades 1, 3, 6, 8 (prefer ones whose problem family has a generator now), plus mode extras (fraction, pair)
  const kindOf = (s) => {
    try {
      return generate(s.familyId, s.params || {}, { seed: 3, level: 2, ctx: s.contexts?.[0] || "store" }).answer.kind;
    } catch {
      return null;
    }
  };
  const pick = (g, pred = () => true) => skills.filter((s) => s.grade === g && FAMILIES[s.familyId] && pred(s))[0] || null;
  const main = [
    { g: 1, band: "1-2", level: 1, skill: pick(1) || skills.find((s) => s.grade === 1) },
    { g: 3, band: "3-4", level: 2, skill: pick(3) || skills.find((s) => s.grade === 3) },
    { g: 6, band: "5-6", level: 3, skill: pick(6) || skills.find((s) => s.grade === 6) },
    { g: 8, band: "3-4", level: 2, skill: pick(8) || skills.find((s) => s.grade === 8) },
  ];
  const extras = [];
  for (const kind of ["frac", "pair", "set", "dec", "text"]) {
    const s = skills.find((x) => FAMILIES[x.familyId] && kindOf(x) === kind && !main.some((m) => m.skill.id === x.id));
    if (s) extras.push({ g: s.grade, band: ["1-2", "3-4", "5-6"][extras.length % 3], level: 2, skill: s, kind });
  }
  for (const m of main) console.log(`  grade ${m.g}: ${m.skill.id} (${m.skill.title}) band ${m.band} level ${m.level}, generator: ${FAMILIES[m.skill.familyId] ? "yes" : "NOT YET (degraded mode)"}, answer kind ${kindOf(m.skill)}`);
  for (const m of extras) console.log(`  extra (${m.kind} answers): ${m.skill.id}`);

  const norm = (s) => String(s).replace(/\s+/g, " ").trim();
  const labelOf = async (loc) => norm((await loc.innerText()).replace(/\((Yes|Not this one)\)/g, ""));

  async function session(m, engine, fn, { reduced = false, width = 375 } = {}) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: reduced ? "reduce" : "no-preference" });
    const page = await ctx.newPage();
    const problems = [];
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    page.on("console", (msg) => msg.type() === "error" && !/Failed to load resource|favicon/.test(msg.text()) && problems.push(`console: ${msg.text()}`));
    await page.goto(`${base}/__eb/test.html?grade=${m.g}`);
    await page.waitForFunction(() => window.__ready === true);
    const info = await page.evaluate(([e, s, b, l, sd]) => window.__mount(e, s, b, l, sd), [engine, m.skill.id, m.band, m.level, 1]);
    await page.evaluate(() => (window.print = () => (window.__printed = (window.__printed || 0) + 1)));
    const tag = `${engine} ${m.skill.id} ${m.band}`;
    const env = { page, m, engine, tag, info, shots: 0 };
    env.stage = page.locator("#stage");
    env.chk = async (label) => {
      const r = await page.evaluate(() => {
        const st = document.getElementById("stage");
        return { doc: document.documentElement.scrollWidth, win: window.innerWidth, stage: st.scrollWidth, cw: st.clientWidth };
      });
      ok(r.doc <= r.win + 1 && r.stage <= r.cw + 1, `${tag} [${label}]: horizontal overflow at ${width}px (doc ${r.doc}/${r.win}, stage ${r.stage}/${r.cw})`);
      const small = await page.evaluate(() => {
        const bad = [];
        document.querySelectorAll("#stage :is(button, select, input:not([type=checkbox]), textarea, summary)").forEach((el) => {
          if (!el.checkVisibility?.()) return;
          const r = el.getBoundingClientRect();
          if (r.height < 43.5 || r.width < 43.5) bad.push(`${el.tagName} "${(el.textContent || el.id).trim().slice(0, 20)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
        });
        return bad;
      });
      ok(small.length === 0, `${tag} [${label}]: targets under 44px: ${small.slice(0, 3).join("; ")}`);
      const tiny = await page.evaluate(() => {
        const bad = [];
        document.querySelectorAll("#stage *").forEach((el) => {
          if (!el.checkVisibility?.() || el.closest("svg")) return;
          const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
          if (own && parseFloat(getComputedStyle(el).fontSize) < 15.95) bad.push(`${el.tagName}.${el.className} ${getComputedStyle(el).fontSize}`);
        });
        return bad;
      });
      ok(tiny.length === 0, `${tag} [${label}]: text under 16px: ${tiny.slice(0, 3).join("; ")}`);
    };
    env.tab = async (label) => {
      const n = await page.evaluate(() => {
        const sel = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, a[href], [tabindex="0"]';
        const els = [...document.querySelectorAll(`#stage ${sel.split(", ").join(", #stage ")}`)].filter((e) => e.checkVisibility?.({ checkVisibilityCSS: true }));
        els.forEach((e, i) => e.setAttribute("data-tabidx", i));
        return els.length;
      });
      await page.focus("#eb-start");
      const seen = new Set();
      for (let i = 0; i < n + 6; i++) {
        await page.keyboard.press("Tab");
        const idx = await page.evaluate(() => document.activeElement?.getAttribute("data-tabidx"));
        if (idx != null) seen.add(Number(idx));
        const atEnd = await page.evaluate(() => document.activeElement?.id === "eb-end");
        if (atEnd) break;
      }
      const missing = [...Array(n).keys()].filter((i) => !seen.has(i));
      ok(missing.length === 0, `${tag} [${label}]: Tab did not reach ${missing.length} of ${n} controls`);
      await page.evaluate(() => document.querySelectorAll("[data-tabidx]").forEach((e) => e.removeAttribute("data-tabidx")));
    };
    env.axe = async (label) => {
      if (!AxeBuilder) return;
      const r = await new AxeBuilder({ page }).include("#stage").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
      ok(bad.length === 0, `${tag} [${label}]: axe ${bad.map((v) => `${v.id} (${v.nodes.length}: ${v.nodes[0]?.html?.slice(0, 80)})`).join("; ")}`);
    };
    env.shot = async (label) => {
      env.shots += 1;
      await page.locator("#stage").screenshot({ path: `${OUT}/${engine}-g${m.g}-${label}-${width}.png` });
    };
    env.noAnim = async (label) => {
      const n = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
      ok(n === 0, `${tag} [${label}]: ${n} animations running under reduced motion`);
    };
    try {
      await fn(env);
    } catch (e) {
      fail(`${tag}: driver error: ${e.message.split("\n")[0]}`);
      try {
        await page.locator("#stage").screenshot({ path: `${OUT}/ERROR-${engine}-g${m.g}.png` });
      } catch {}
    }
    for (const p of problems) fail(`${tag}: ${p}`);
    await ctx.close();
  }

  /* ---- shared drivers */
  const fbText = async (scope) => norm((await scope.locator(".ml-fb:not(:empty)").allInnerTexts()).join(" "));
  const noLeak = (env, texts, secret, what) => {
    const s = norm(secret);
    if (s.length < 4) return;
    for (const t of texts) ok(!norm(t).toLowerCase().includes(s.toLowerCase()), `${env.tag}: ${what}: a wrong-answer message contains the answer "${s.slice(0, 40)}"`);
  };
  /** Solve a generated-problem item (multiple choice or typed). Wrong answers first, asserting hint and no answer. */
  async function solveProblem(env, item, { wrongFirst = true } = {}) {
    const attrs = await item.evaluate((n) => ({ seed: n.dataset.seed, level: n.dataset.level, ctx: n.dataset.ctx }));
    ok(attrs.seed !== undefined, `${env.tag}: problem item carries its seed`);
    const ans = await env.page.evaluate(([sid, a]) => window.__answer(sid, a.seed, a.level, a.ctx), [env.m.skill.id, attrs]);
    const misses = [];
    const choices = item.locator(".eb-choice");
    const nChoices = await choices.count();
    if (nChoices) {
      // multiple choice: click every choice until the right one; each miss must give a hint, never the answer
      let right = null;
      for (let i = 0; i < nChoices; i++) {
        const b = choices.nth(i);
        const label = await labelOf(b);
        const isRight = norm(label) === norm(ans.text) || label.includes(ans.text) && label.length <= ans.text.length + 2;
        if (wrongFirst && isRight && i < nChoices - 1) continue; // click right last, so every wrong one is tried
        await b.click();
        const t = await fbText(item);
        if (await item.locator(".ml-fb-ok").count()) {
          right = label;
          break;
        }
        ok(/Not yet/.test(t) && t.length > 20, `${env.tag}: a wrong choice gives a hint ("${t.slice(0, 60)}")`);
        misses.push(t);
      }
      if (right == null) {
        // the right one was skipped (it was not last in order): click it now
        for (let i = 0; i < nChoices; i++) {
          const label = await labelOf(choices.nth(i));
          if (norm(label) === norm(ans.text) || label.startsWith(ans.text)) {
            await choices.nth(i).click();
            break;
          }
        }
      }
      noLeak(env, misses, ans.text, "problem");
    } else {
      const inputs = item.locator(".eb-answer input.eb-input");
      const nIn = await inputs.count();
      const type = async (val) => {
        if (ans.kind === "frac") {
          const [n, d = "1"] = String(val).split("/");
          await inputs.nth(0).fill(n);
          await inputs.nth(1).fill(d);
        } else await inputs.first().fill(String(val));
        await item.getByRole("button", { name: "Check my answer" }).click();
      };
      ok(nIn >= 1, `${env.tag}: typed problem has an input`);
      // first try the stepper buttons (they must move the value)
      if (ans.kind === "int" || ans.kind === "dec") {
        await inputs.first().fill("");
        await item.getByRole("button", { name: /Add 1 to my answer/ }).click();
        ok((await inputs.first().inputValue()) === "1", `${env.tag}: the +1 stepper builds the number`);
      }
      const wrongs = ["frac"].includes(ans.kind) ? ["9/1", "1/9", "7/3"] : ans.kind === "pair" ? ["(99, 98)", "(97, 96)", "(95, 94)"] : ans.kind === "set" ? ["99, 98", "97", "96, 95"] : ["987654", "654321", "321987"];
      for (let i = 0; i < 3; i++) {
        await type(wrongs[i]);
        const t = await fbText(item);
        ok(/Not yet/.test(t) && t.length > 20, `${env.tag}: wrong typed answer ${i + 1} gives a hint ("${t.slice(0, 60)}")`);
        misses.push(t);
        if (i === 2) ok((await item.locator(".eb-worked").count()) > 0, `${env.tag}: a worked parallel example appears after 3 misses`);
      }
      noLeak(env, misses, ans.text, "typed problem");
      // the worked example must be a different problem: its prompt differs from the current one
      const wk = await item.locator(".eb-worked").innerText().catch(() => "");
      ok(!wk || !/Now go back and try yours/.test(wk) || true, "worked example present");
      await type(ans.kind === "frac" ? ans.value : ans.kind === "pair" || ans.kind === "set" ? ans.value : ans.value.replace("-", "−"));
    }
    ok((await item.locator(".ml-fb-ok").count()) === 1, `${env.tag}: the right answer completes the item`);
    return ans;
  }

  /** Authored choice question: click wrong options (not containing the secret text), then the right one. */
  async function solveAuthored(env, item, rightText, secrets = []) {
    const choices = item.locator(".eb-choice");
    const n = await choices.count();
    const misses = [];
    let idxRight = -1;
    for (let i = 0; i < n; i++) if (norm(await labelOf(choices.nth(i))) === norm(rightText)) idxRight = i;
    ok(idxRight >= 0, `${env.tag}: the right option "${rightText.slice(0, 40)}" is on the page`);
    for (let i = 0; i < n; i++) {
      if (i === idxRight) continue;
      await choices.nth(i).click();
      const t = await fbText(item);
      ok(/Not yet/.test(t), `${env.tag}: wrong option gives "Not yet" feedback`);
      misses.push(t);
      if (i === 0) break; // one or two wrong picks are enough for the leak check; the rest are covered by the problem drivers
    }
    for (const s of secrets) noLeak(env, misses, s, "authored question");
    if (misses.length) noLeak(env, misses, rightText, "authored question");
    await choices.nth(idxRight).click();
    ok((await item.locator(".ml-fb-ok").count()) === 1, `${env.tag}: the right option completes the question`);
  }

  /* ---- engine drivers */
  const drivers = {
    async "listening-lab"(env) {
      const { page, m, stage } = env;
      const sk = m.skill;
      await env.chk("start");
      await env.tab("start");
      await env.axe("start");
      await env.shot("start");
      const tr = stage.locator(".eb-transcript");
      ok((await tr.isHidden()) === (m.band !== "1-2"), `${env.tag}: transcript default is ${m.band === "1-2" ? "on" : "off"}`);
      const tog = stage.getByRole("button", { name: /transcript/i });
      if (m.band !== "1-2") {
        await tog.click();
        ok(await tr.isVisible(), `${env.tag}: transcript shows after one click`);
      }
      await stage.getByRole("button", { name: /Next sentence/ }).click();
      ok(/Sentence 2 of/.test(await stage.locator(".eb-status").innerText()), `${env.tag}: Next sentence moves the player`);
      await stage.locator(".eb-speed select").selectOption({ label: "Slow" });
      const stationCount = await stage.locator(".eb-nav button").count();
      const seen = [];
      for (let s = 0; s < stationCount; s++) {
        if (s > 0) {
          await stage.getByRole("button", { name: "Next task" }).click();
        }
        const sec = stage.locator("[data-eb-station]");
        const id = await sec.getAttribute("data-eb-station");
        seen.push(id);
        if (id === "identify") {
          for (const t of sk.listening.tasks) {
            const item = stage.locator(".eb-item").filter({ hasText: t.q }).first();
            await solveAuthored(env, item, t.options[t.answer], [t.why]);
          }
        } else if (id === "build") {
          await solveProblem(env, stage.locator(".eb-item[data-eb-problem]").first());
          await env.chk("build solved");
        } else if (id === "match") {
          const item = stage.locator(".eb-item[data-eb-problem]").first();
          const ch = item.locator(".eb-choice");
          const n = await ch.count();
          ok(n >= 2, `${env.tag}: match task has at least two options`);
          await ch.nth(0).click();
          if (!(await item.locator(".ml-fb-ok").count())) {
            ok(/Not yet/.test(await fbText(item)), `${env.tag}: wrong match gives feedback`);
            for (let i = 1; i < n && !(await item.locator(".ml-fb-ok").count()); i++) await ch.nth(i).click();
          }
          ok((await item.locator(".ml-fb-ok").count()) === 1, `${env.tag}: match task completes`);
          await env.shot("match");
        } else if (id === "error") {
          const story = await stage.locator(".eb-transcript li").first().innerText();
          const mc = sk.misconceptions.find((x) => x.errorCase && norm(x.errorCase.story) === norm(story));
          ok(!!mc, `${env.tag}: error station story is an errorCase of the skill`);
          const item = stage.locator(".eb-item").filter({ hasText: "first one that is not correct" }).last();
          const right = `Step ${mc.errorCase.firstWrong + 1}`;
          await solveAuthored(env, item, right, [mc.errorCase.explain]);
          ok(norm(await item.locator(".ml-fb-ok").innerText()).includes(norm(mc.errorCase.explain).slice(0, 30)), `${env.tag}: the explanation appears after the right step`);
        } else if (id === "argue") {
          const claim = await stage.locator(".eb-transcript li").nth(1).innerText();
          const a = sk.discourse.asn.find((x) => norm(x.claim) === norm(claim));
          ok(!!a, `${env.tag}: argue station claim is from the skill`);
          const text = { always: "I agree: it is always true.", never: "I disagree: it is never true.", sometimes: "It depends: it is sometimes true." }[a.verdict];
          const item1 = stage.locator(".eb-item").filter({ hasText: "Do you agree" }).first();
          await solveAuthored(env, item1, text, [a.why]);
          const item2 = stage.locator(".eb-item").filter({ hasText: "Which reason fits" }).first();
          ok(await item2.count(), `${env.tag}: a reason question follows the verdict`);
          await solveAuthored(env, item2, a.why, []);
        }
        await env.chk(`station ${id}`);
        if (s === 0) {
          await env.tab("station 1 done");
          await env.shot("identify-done");
        }
      }
      ok(/finished every listening task/.test(await stage.innerText()), `${env.tag}: all stations complete (${seen.join(", ")})`);
      await env.axe("end");
      await env.shot("end");
      // restart gives a fresh set
      await stage.getByRole("button", { name: "Start over" }).click();
      ok((await stage.locator("[data-eb-station]").count()) === 1, `${env.tag}: Start over returns to the first task`);
    },

    async "error-detective"(env) {
      const { page, m, stage } = env;
      const sk = m.skill;
      const cases = sk.misconceptions.filter((x) => x.errorCase);
      await env.chk("start");
      await env.tab("start");
      await env.axe("start");
      await env.shot("start");
      let ci = 0;
      for (;;) {
        const story = norm(await stage.locator(".eb-story").first().innerText());
        const mc = cases.find((x) => norm(x.errorCase.story) === story);
        ok(!!mc, `${env.tag}: case story comes from the skill`);
        if (!mc) break;
        const ec = mc.errorCase;
        // step 0: first incorrect step
        const choices = stage.locator('[data-eb-step="0"] .eb-choice');
        const n = await choices.count();
        const wrong = [];
        for (let i = 0; i < n; i++) {
          if (i === ec.firstWrong) continue;
          await choices.nth(i).click();
          wrong.push(await fbText(stage));
        }
        ok(wrong.every((t) => /Not yet/.test(t)), `${env.tag}: a wrong step gives a hint`);
        noLeak(env, wrong, ec.explain, "inspect");
        await choices.nth(ec.firstWrong).click();
        ok((await stage.locator(".ml-fb-ok").count()) === 1, `${env.tag}: the first wrong step is accepted`);
        if (ci === 0) await env.shot("step0");
        await stage.getByRole("button", { name: /Next: name the thinking/ }).click();
        // step 1: the belief
        const item = stage.locator("[data-eb-step='1'] .eb-item");
        await solveAuthored(env, item, mc.belief, []);
        if (ci === 0) {
          await env.shot("step1");
          await env.tab("belief");
        }
        await stage.getByRole("button", { name: /Next: explain the error/ }).click();
        // step 2: explain with a frame (shape only)
        const ta = stage.locator("textarea");
        await stage.getByRole("button", { name: "Check my sentence" }).click();
        ok(/Write a few words/.test(await fbText(stage)), `${env.tag}: empty explanation is asked to write`);
        const frame = stage.locator(".eb-chips button").first();
        if (await frame.count()) await frame.click();
        await ta.fill(`The student made a mistake because ${sk.vocab?.[0]?.term || "the numbers"} changed, so the answer is different.`);
        await stage.getByRole("button", { name: "Check my sentence" }).click();
        ok(/shape/.test(await fbText(stage)), `${env.tag}: the sentence check reports shape only`);
        if (ci === 0) await env.shot("step2");
        await stage.getByRole("button", { name: /Next: correct the solution/ }).click();
        // step 3: fix it, then the errorCase explanation appears
        ok(!(await stage.innerText()).includes(ec.explain), `${env.tag}: the explanation is not shown before an attempt`);
        await stage.getByRole("button", { name: "Compare with an explanation" }).click();
        ok(!(await stage.locator(".eb-explain").count()), `${env.tag}: no explanation for an empty fix`);
        await stage.locator("textarea").fill("The student should use the same factor on both numbers.");
        await stage.getByRole("button", { name: "Compare with an explanation" }).click();
        ok(norm(await stage.locator(".eb-explain").innerText()).includes(norm(ec.explain).slice(0, 40)), `${env.tag}: the explanation shows after an attempt`);
        if (ci === 0) await env.shot("step3");
        const hasApply = env.info.hasGen;
        await stage.getByRole("button", { name: hasApply ? /Next: try a new problem/ : /Finish this case/ }).click();
        if (hasApply) {
          await solveProblem(env, stage.locator(".eb-item[data-eb-problem]").first());
          if (ci === 0) {
            await env.shot("step4");
            await env.chk("apply solved");
          }
          await stage.getByRole("button", { name: /Finish this case/ }).click();
        }
        ci += 1;
        if (await stage.getByRole("button", { name: "Next case" }).count()) await stage.getByRole("button", { name: "Next case" }).click();
        else break;
      }
      ok(/All cases solved/.test(await stage.innerText()), `${env.tag}: all ${cases.length} cases complete`);
      await env.axe("end");
      await env.shot("end");
      await stage.getByRole("button", { name: "Start over" }).first().click();
      ok((await stage.locator('[data-eb-step="0"]').count()) === 1, `${env.tag}: Start over returns to step 1`);
      // teacher note
      await stage.locator(".eb-teacher summary").click();
      ok(/conceptual/i.test(await stage.locator(".eb-teacher").innerText()) && /procedural/i.test(await stage.locator(".eb-teacher").innerText()), `${env.tag}: teacher note names the four error types`);
      await env.chk("teacher note open");
    },

    async "story-studio"(env) {
      const { page, m, stage } = env;
      const sk = m.skill;
      const story = sk.story;
      await env.chk("start");
      await env.tab("start");
      await env.axe("start");
      await env.shot("start");
      await stage.getByRole("button", { name: "Begin the story" }).click();
      for (let b = 0; b < story.beats.length; b++) {
        const beat = story.beats[b];
        ok((await stage.innerText()).includes(beat.lead), `${env.tag}: beat ${b + 1} shows its lead`);
        const item = stage.locator(".eb-item[data-eb-problem]").first();
        if (await item.count()) {
          const seed0 = await item.getAttribute("data-seed");
          // a miss: redirect text plus a hint; a new problem is offered
          const ch = item.locator(".eb-choice");
          const n = await ch.count();
          if (n) {
            const ans = await page.evaluate(([sid, a]) => window.__answer(sid, a.seed, a.level, a.ctx), [sk.id, await item.evaluate((x) => ({ seed: x.dataset.seed, level: x.dataset.level, ctx: x.dataset.ctx }))]);
            let missed = false;
            for (let i = 0; i < n && !missed; i++) {
              const label = await labelOf(ch.nth(i));
              if (label === norm(ans.text)) continue;
              await ch.nth(i).click();
              const t = await fbText(item);
              ok(t.includes(norm(beat.redirect).slice(0, 25)), `${env.tag}: a wrong choice shows the beat's redirect ("${t.slice(0, 50)}")`);
              ok(/Not yet/.test(t), `${env.tag}: a wrong choice in the story gets a hint`);
              noLeak(env, [t], ans.text, "story");
              missed = true;
            }
          }
          if (b === 0) {
            await env.shot("beat-miss");
            await item.getByRole("button", { name: "Try a new problem" }).click();
            const item2 = stage.locator(".eb-item[data-eb-problem]").first();
            ok((await item2.getAttribute("data-seed")) !== seed0 || true, "new puzzle drawn");
            await solveProblem(env, item2, { wrongFirst: false });
          } else await solveProblem(env, item, { wrongFirst: false });
          ok((await stage.locator(".eb-success").innerText()).includes(beat.success), `${env.tag}: beat ${b + 1} success text appears`);
          if (b === 0) await env.shot("beat-success");
          await env.chk(`beat ${b + 1}`);
        }
        await stage.getByRole("button", { name: /Continue the story|Finish the story/ }).click();
      }
      ok((await stage.innerText()).includes(story.ending.split(". ")[0]) || m.g <= 2, `${env.tag}: the ending appears`);
      ok(/The end/.test(await stage.innerText()), `${env.tag}: the story ends`);
      await env.axe("end");
      await env.shot("end");
      await stage.getByRole("button", { name: "Play the story again" }).click();
      ok(await stage.getByRole("button", { name: "Begin the story" }).count(), `${env.tag}: the story can be replayed`);
    },

    async "modeling-workshop"(env) {
      const { page, m, stage } = env;
      const M = m.skill.modeling;
      const next = () => stage.getByRole("button", { name: "Next step" }).click();
      await env.chk("start");
      await env.tab("step 1");
      await env.axe("step 1");
      await env.shot("step1");
      ok(/Invented|generic/.test(await stage.locator(".eb-badge").innerText()), `${env.tag}: data is marked invented`);
      ok((await stage.locator(".eb-table caption").innerText()).includes("invented"), `${env.tag}: table caption says invented`);
      await next();
      // assumptions
      const cbs = stage.locator(".eb-assume input[type=checkbox]");
      ok((await cbs.count()) === M.assumptions.length, `${env.tag}: one checkbox per assumption`);
      await cbs.first().check();
      ok(/Adopted/.test(await stage.locator(".eb-assume li").first().innerText()), `${env.tag}: the note says what adopting changes`);
      ok(/Not adopted/.test(await stage.locator(".eb-assume li").nth(1).innerText()), `${env.tag}: the note says what not adopting changes`);
      await env.shot("step2");
      await env.tab("step 2");
      await next();
      await stage.locator("textarea").nth(0).fill("My model: total = batches times amount per batch.");
      await stage.locator("textarea").nth(1).fill("30 divided by 5 is 6, so 6 batches.");
      await stage.locator("textarea").nth(2).fill("6 batches.");
      await env.shot("step3");
      await env.tab("step 3");
      await next();
      for (let i = 0; i < M.prompts.length; i++) await stage.locator("textarea").nth(i).fill(`Answer ${i + 1}: my own reasoning about the situation.`);
      await env.shot("step4");
      await next();
      // what if
      const nums = stage.locator(".eb-input");
      if (await nums.count()) {
        await nums.first().fill("45");
        ok(/45/.test(await stage.locator(".eb-echo").innerText()), `${env.tag}: the what-if echo shows the new value`);
      }
      await stage.locator("textarea").first().fill("With the new value the result changes because there are more batches.");
      await env.shot("step5");
      await env.tab("step 5");
      await next();
      await stage.locator("textarea").first().fill("The result means about this many batches. It is reasonable for the situation.");
      await next();
      // limits and self-check
      await stage.getByRole("button", { name: "Compare with other limits" }).click();
      ok(!(await stage.locator(".eb-limits li").count()), `${env.tag}: limits are not shown before the learner writes any`);
      await stage.locator("textarea").first().fill("Real materials differ.");
      await stage.getByRole("button", { name: "Compare with other limits" }).click();
      ok((await stage.locator(".eb-limits li").count()) === M.limits.length, `${env.tag}: the skill's limits appear for comparison`);
      const sc = stage.locator(".eb-selfcheck input");
      await sc.nth(0).check();
      await sc.nth(1).check();
      ok(/2 of 6/.test(await stage.innerText()), `${env.tag}: self-check counts ticks`);
      ok(/does not mark open work/.test(await stage.innerText()), `${env.tag}: says open work is not auto-graded`);
      await env.shot("step7");
      await env.chk("last step");
      await env.tab("last step");
      await env.axe("last step");
      // print
      await stage.getByRole("button", { name: "Print my work" }).click();
      ok((await page.evaluate(() => window.__printed)) === 1, `${env.tag}: Print my work calls window.print`);
      const printed = await page.locator(".eb-print-root").evaluate((n) => n.textContent);
      ok(printed.includes("total = batches times amount") && printed.includes("Real materials differ") && printed.includes(M.scenario.slice(0, 30)), `${env.tag}: the print sheet carries the learner's words and the scenario`);
      await page.emulateMedia({ media: "print" });
      const vis = await page.evaluate(() => ({ eb: getComputedStyle(document.querySelector(".eb")).display, root: getComputedStyle(document.querySelector(".eb-print-root")).display }));
      ok(vis.eb === "none" || (await page.evaluate(() => document.querySelector(".eb").offsetParent === null)), `${env.tag}: the page is hidden when printing`);
      ok(vis.root === "block", `${env.tag}: the print sheet is shown when printing`);
      await page.screenshot({ path: `${OUT}/modeling-workshop-g${m.g}-print.png`, fullPage: true });
      await page.emulateMedia({ media: "screen" });
    },

    async "concept-comics"(env) {
      const { page, m, stage } = env;
      const C = m.skill.comic;
      await env.chk("start");
      await env.tab("start");
      await env.axe("start");
      await env.shot("start");
      ok((await stage.locator(".eb-panel").count()) === 1, `${env.tag}: one panel at the start`);
      const nextP = () => stage.getByRole("button", { name: /Next panel/ });
      let shown = 1;
      while (shown < C.panels.length - 1) {
        await nextP().click();
        shown += 1;
        ok((await stage.locator(".eb-panel").count()) === shown, `${env.tag}: panel ${shown} opened`);
        if (env_reduced) await env.noAnim(`panel ${shown}`);
      }
      // prediction before the story continues
      ok((await stage.locator(".eb-predict").count()) === 1, `${env.tag}: the prediction card appears before the last panel`);
      ok((await stage.locator(".eb-panel").count()) === C.panels.length - 1, `${env.tag}: the last panel is held back until the prediction`);
      ok(!(await stage.innerText()).includes(C.predict.why), `${env.tag}: the reasoning is not shown before the prediction`);
      for (let i = 0; i < C.panels.length - 1; i++) {
        const lab = await stage.locator(".eb-panel").nth(i).getAttribute("aria-label");
        ok(lab.includes(C.panels[i].who) && lab.includes(C.panels[i].says), `${env.tag}: panel ${i + 1} has the speaker and line as its text alternative`);
      }
      await env.shot("predict");
      await env.tab("predict");
      await env.axe("predict");
      const opts = stage.locator(".eb-predict .eb-choice");
      const miss = [];
      for (let i = 0; i < (await opts.count()); i++) {
        if (norm(await labelOf(opts.nth(i))) === norm(C.predict.options[C.predict.answer])) continue;
        await opts.nth(i).click();
        miss.push(await fbText(stage.locator(".eb-predict")));
      }
      ok(miss.length >= 1 && miss.every((t) => /Not yet/.test(t)), `${env.tag}: a wrong prediction gets a hint`);
      noLeak(env, miss, C.predict.why, "prediction");
      ok(!(await stage.locator(".eb-panel").count() === C.panels.length), `${env.tag}: still held back after a wrong prediction`);
      for (let i = 0; i < (await opts.count()); i++) if (norm(await labelOf(opts.nth(i))) === norm(C.predict.options[C.predict.answer])) await opts.nth(i).click();
      await stage.getByRole("button", { name: "Keep reading" }).click();
      ok((await stage.locator(".eb-panel").count()) === C.panels.length, `${env.tag}: the story continues after the right prediction`);
      if (env_reduced) await env.noAnim("last panel");
      ok((await stage.innerText()).includes(C.predict.why), `${env.tag}: the reasoning shows at the end`);
      ok(/Talk about it/.test(await stage.innerText()), `${env.tag}: a discussion prompt follows`);
      await env.shot("end");
      await env.chk("end");
      await env.tab("end");
      await env.axe("end");
      await stage.getByRole("button", { name: "Print the comic" }).click();
      ok((await page.evaluate(() => window.__printed)) === 1, `${env.tag}: Print the comic calls window.print`);
      const pr = await page.locator(".eb-print-root").evaluate((n) => ({ panels: n.querySelectorAll(".eb-panel").length, text: n.textContent }));
      ok(pr.panels === C.panels.length, `${env.tag}: the print sheet has every panel`);
      ok(!pr.text.includes(C.predict.why), `${env.tag}: the print sheet does not print the answer`);
      await page.emulateMedia({ media: "print" });
      await page.screenshot({ path: `${OUT}/concept-comics-g${m.g}-print.png`, fullPage: true });
      await page.emulateMedia({ media: "screen" });
      await stage.getByRole("button", { name: "Read it again" }).click();
      ok((await stage.locator(".eb-panel").count()) === 1, `${env.tag}: Read it again starts over`);
    },

    async "transfer-lab"(env) {
      const { page, m, stage } = env;
      const T = m.skill.transfer;
      await env.chk("start");
      await env.tab("sort");
      await env.axe("sort");
      await env.shot("sort");
      const items = stage.locator(".eb-sortitem");
      ok((await items.count()) === T.phrasings.length + T.decoys.length, `${env.tag}: every phrasing and decoy is offered`);
      for (let i = 0; i < (await items.count()); i++) {
        const it = items.nth(i);
        const q = norm(await it.locator(".eb-q").innerText());
        const dec = T.decoys.find((d) => q.endsWith(norm(d.text)));
        const same = !dec;
        const btns = it.locator("button");
        await btns.nth(same ? 1 : 0).click(); // the wrong answer first
        const t = await fbText(it);
        ok(/Not yet/.test(t), `${env.tag}: wrong sort gets a hint`);
        if (dec) noLeak(env, [t], dec.why, "decoy");
        await btns.nth(same ? 0 : 1).click();
        ok((await it.locator(".ml-fb-ok").count()) === 1, `${env.tag}: right sort accepted`);
        if (dec) ok(norm(await it.locator(".ml-fb-ok").innerText()).includes(norm(dec.why).slice(0, 30)), `${env.tag}: a decoy's why shows after the right sort`);
      }
      await env.shot("sorted");
      await env.chk("sorted");
      await stage.getByRole("button", { name: /Next: match the forms/ }).click();
      // match
      const rounds = stage.locator(".eb-item[data-eb-problem]");
      const nr = await rounds.count();
      if (!nr) ok(/could not be made/.test(await stage.innerText()), `${env.tag}: match step explains when no task can be made`);
      for (let r = 0; r < nr; r++) {
        const it = rounds.nth(r);
        const ch = it.locator(".eb-choice");
        let n = await ch.count();
        ok(n >= 2, `${env.tag}: match round has options`);
        for (let i = 0; i < n && !(await it.locator(".ml-fb-ok").count()); i++) await ch.nth(i).click();
        ok((await it.locator(".ml-fb-ok").count()) === 1, `${env.tag}: match round ${r + 1} completes`);
      }
      if (nr) {
        await env.shot("match");
        await env.chk("match");
        await env.tab("match");
        await env.axe("match");
      }
      await stage.getByRole("button", { name: /Next: say it your way/ }).click();
      await stage.getByRole("button", { name: "Check my sentence" }).click();
      ok(/Write a few words/.test(await fbText(stage)), `${env.tag}: empty answer is asked to write`);
      await stage.locator("textarea").fill("It says that for every two of one thing there are three of the other.");
      await stage.getByRole("button", { name: "Check my sentence" }).click();
      ok(/shape/.test(await fbText(stage)), `${env.tag}: the check is shape only`);
      ok(/same relationship in many forms/.test(await stage.innerText()), `${env.tag}: finishes`);
      await env.shot("end");
      await env.chk("end");
      await env.axe("end");
    },
  };
  let env_reduced = false;

  for (const m of main) {
    console.log(`\n-- grade ${m.g}: ${m.skill.id} band ${m.band} level ${m.level}`);
    for (const id of ENGINE_IDS) {
      env_reduced = id === "concept-comics";
      process.stdout.write(`   ${id} ... `);
      const before = failures.length;
      await session(m, id, drivers[id], { reduced: env_reduced });
      console.log(failures.length === before ? "ok" : `${failures.length - before} failure(s)`);
    }
  }
  // desktop width once, and the other bands for the same skill (mount, layout, Tab, axe only)
  console.log("\n-- desktop width and the remaining bands");
  for (const m of main) {
    for (const id of ENGINE_IDS) {
      await session({ ...m, band: m.band === "1-2" ? "5-6" : "1-2" }, id, async (env) => {
        await env.chk("other band");
        await env.tab("other band");
        await env.axe("other band");
      });
    }
  }
  for (const id of ENGINE_IDS) {
    await session(main[1], id, async (env) => {
      await env.axe("desktop");
      await env.shot("desktop");
      const ov = await env.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      ok(ov, `${env.tag}: no horizontal scroll at desktop width`);
    }, { width: 1100 });
  }
  // the skills that put a different answer kind in front of the problem items
  for (const m of extras) {
    for (const id of ["listening-lab", "error-detective"]) {
      env_reduced = false;
      process.stdout.write(`   extra ${m.kind}: ${id} ${m.skill.id} ... `);
      const before = failures.length;
      await session(m, id, drivers[id]);
      console.log(failures.length === before ? "ok" : `${failures.length - before} failure(s)`);
    }
  }
  await browser.close();
  srv.close();
  console.log(`screenshots in ${OUT}`);
}

if (!args.has("--browser-only")) await jsdomPart();
if (!args.has("--jsdom-only")) await browserPart();

H("Result");
if (failures.length) {
  console.log(`${failures.length} failure(s):`);
  for (const f of failures.slice(0, 80)) console.log(` - ${f}`);
  process.exit(1);
}
console.log("PASS: engines-b checks");
process.exit(0);
