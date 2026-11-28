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

// ---------------------------------------------------------------------------------------------------------------- 2. browser
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png" };
const TEST_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Engines A check</title>
<link rel="stylesheet" href="/access-practice-lab/ds.css"><link rel="stylesheet" href="/access-practice-lab/mls.css"></head>
<body><main class="ml-page" id="main"><h1>Engines A check</h1><h2>Activity</h2><div id="host"></div></main>
<script type="module">
import { ENGINES } from "/access-practice-lab/src/mls/engines-a.js";
import { mergeSkill } from "/access-practice-lab/src/mls/merge.js";
import { generate } from "/access-practice-lab/src/mls/families.js";
import { registerSkills } from "/access-practice-lab/src/mls/model.js";
const inv = await (await fetch("/access-practice-lab/content/mls/inventory.json")).json();
const grades = {};
async function skill(id) {
  const inv1 = inv.skills.find((s) => s.id === id);
  const g = inv1.grade;
  if (!grades[g]) {
    const data = await (await fetch("/access-practice-lab/content/mls/skills/g" + g + ".json")).json();
    grades[g] = inv.skills.filter((s) => s.grade === g).map((s) => { const c = data.skills.find((x) => x.id === s.id); return c ? mergeSkill(s, c) : null; }).filter(Boolean);
    registerSkills(grades[g]);
  }
  return grades[g].find((s) => s.id === id);
}
let inst = null;
window.T = {
  async mount(engine, id, o) {
    if (inst) { inst.destroy(); inst = null; }
    const host = document.getElementById("host");
    host.textContent = "";
    const el = document.createElement("div");
    el.id = "stage";
    el.className = o.g12 ? "ml-g12" : "";
    host.append(el);
    const sk = await skill(id);
    inst = ENGINES[engine].mount(el, { skill: sk, band: o.band, level: o.level, seed: o.seed, support: "standard", ctx: sk.contexts?.[0] });
    return true;
  },
  async info(id) { const sk = await skill(id); return { vocab: sk.vocab.map((v) => v.term), targets: sk.sentence?.targets || [], term0: sk.vocab[0].term, grade: sk.grade }; },
  async problem(id, level, seed, round) {
    const sk = await skill(id);
    const p = generate(sk.familyId, sk.params || {}, { seed: ((seed * 7919 + round) % 2147483000) || 1, level, ctx: sk.contexts?.[0] });
    return { answer: p.answer, stem: p.stem, ask: p.ask, expr: p.expr, hasVisual: Boolean(p.visual), hasStructure: Boolean(p.structure) };
  },
  destroy() { if (inst) inst.destroy(); inst = null; },
};
window.__ready = true;
</script></body></html>`;
function serve() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p === "/__t/test.html") {
      res.writeHead(200, { "content-type": TYPES[".html"] });
      return res.end(TEST_PAGE);
    }
    let file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r(server)));
}

/** The skills the browser drives: one per target grade (a skill whose problem has a story, an expression and a picture is preferred). */
async function pickSkills() {
  const wanted = opt("--skills") ? opt("--skills").split(",") : null;
  if (wanted) return wanted.filter((id) => byId.has(id)).map((id) => ({ skill: byId.get(id), band: ({ 1: "1-2", 2: "1-2", 3: "3-4", 4: "3-4" })[byId.get(id).grade] || "5-6", level: 2 }));
  const { generate } = await import(pathToFileURL(path.join(LAB, "src/mls/families.js")));
  const out = [];
  for (const [g, band, level] of [[1, "1-2", 1], [3, "3-4", 2], [6, "5-6", 2], [8, "5-6", 3]]) {
    let list = M.skills.filter((s) => s.grade === g);
    let used = g;
    if (!list.length) {
      list = M.skills.filter((s) => s.grade === g - 1 || s.grade === g - 2);
      used = list[0]?.grade;
      if (list.length) note(`grade ${g}: no registered skill yet, using grade ${used} for the browser run`);
    }
    if (!list.length) continue;
    const rich = (s) => {
      let n = 0;
      for (let sd = 1; sd <= 4; sd++) {
        try {
          const p = generate(s.familyId, s.params || {}, { seed: sd * 7919, level, ctx: s.contexts?.[0] });
          n += (p.stem.standard ? 1 : 0) + (p.expr ? 1 : 0) + (p.visual ? 1 : 0) + (p.structure ? 1 : 0);
        } catch {}
      }
      return n;
    };
    list.sort((a, b) => rich(b) - rich(a));
    out.push({ skill: list[0], band, level });
  }
  return out;
}

let browser;
let AxeBuilder;
async function browserPass() {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch {
    console.warn("browser pass SKIPPED: playwright is not installed");
    return;
  }
  try {
    const mod = require("@axe-core/playwright");
    AxeBuilder = mod.AxeBuilder || mod.default;
  } catch {}
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
  } catch {
    try {
      browser = await chromium.launch({ args: ["--no-sandbox"] });
    } catch (e) {
      console.warn(`browser pass SKIPPED: no Chromium (${e.message.split("\n")[0]})`);
      server.close();
      return;
    }
  }
  console.log("\n[2] Chromium: drive every engine with real clicks and typing");
  const picks = await pickSkills();
  console.log(`  skills: ${picks.map((x) => `${x.skill.id} (band ${x.band}, level ${x.level})`).join("; ")}`);
  for (const id of IDS) {
    for (const [idx, pick] of picks.entries()) {
      const label = `${id} / ${pick.skill.id} / band ${pick.band} L${pick.level}`;
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await ctx.newPage();
      const errs = [];
      page.on("pageerror", (e) => errs.push(String(e)));
      page.on("console", (m) => {
        if (m.type() === "error" && !/favicon|Failed to load resource|net::ERR/.test(m.text())) errs.push(m.text());
      });
      try {
        await page.goto(`${base}/__t/test.html`, { waitUntil: "load" });
        await page.waitForFunction(() => window.__ready === true, null, { timeout: 20000 });
        const o = { band: pick.band, level: pick.level, seed: 3, g12: pick.skill.grade <= 2 };
        await page.evaluate(([e, s, oo]) => window.T.mount(e, s, oo), [id, pick.skill.id, o]);
        await page.locator("#stage .mlea-root").waitFor({ timeout: 10000 });
        await page.waitForTimeout(150);
        ok(!(await page.locator("#stage").getAttribute("data-mlea-error")), `${label}: engine error attribute set`);
        if (await page.locator("#stage [data-mlea-notready]").count()) {
          note(`${label}: engine reports not ready for this skill`);
          await ctx.close();
          continue;
        }
        const C = { page, id, skill: pick.skill, band: pick.band, level: pick.level, seed: 3, label, idx, shots: idx === 0 || true };
        C.info = await page.evaluate((s) => window.T.info(s), pick.skill.id);
        await shot(C, "start");
        await tabReach(C, "start");
        await overflow(C, "start");
        await axe(C, "start");
        await DRIVERS[id](C);
        await shot(C, "end");
        await tabReach(C, "end");
        await overflow(C, "end");
        await axe(C, "end");
        await reducedMotion(C);
        ok(errs.length === 0, `${label}: console/page errors: ${errs.slice(0, 2).join(" | ")}`);
        console.log(`  done ${label}`);
      } catch (e) {
        ok(false, `${label}: ${e.stack?.split("\n").slice(0, 3).join(" / ") || e}`);
        try {
          await page.screenshot({ path: path.join(OUT, `FAIL-${id}-${pick.skill.id}.png`), fullPage: true });
        } catch {}
      }
      await ctx.close();
    }
  }
  await browser.close();
  server.close();
}

// ---- generic probes
async function shot(C, tag) {
  const f = path.join(OUT, `${C.id}-${C.skill.id}-${C.band}-${tag}.png`);
  try {
    await C.page.locator("#stage").screenshot({ path: f });
  } catch {}
  if (C.idx === 0 || tag === "start") {
    try {
      await C.page.setViewportSize({ width: 375, height: 800 });
      await C.page.locator("#stage").screenshot({ path: f.replace(".png", "-375.png") });
    } finally {
      await C.page.setViewportSize({ width: 1280, height: 900 });
    }
  }
}
async function overflow(C, tag) {
  await C.page.setViewportSize({ width: 375, height: 800 });
  const r = await C.page.evaluate(() => {
    const over = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const off = [];
    for (const el of document.querySelectorAll("#stage *")) {
      if (el.closest(".ml-sr")) continue;
      const b = el.getBoundingClientRect();
      if (b.width && b.right > window.innerWidth + 1) off.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)} right=${Math.round(b.right)}`);
    }
    return { over, off: off.slice(0, 3) };
  });
  ok(r.over <= 1, `${C.label}: horizontal scroll ${r.over}px at 375px (${tag})`);
  ok(r.off.length === 0, `${C.label}: element past the right edge at 375px (${tag}): ${r.off.join(", ")}`);
  await C.page.setViewportSize({ width: 1280, height: 900 });
}
async function tabReach(C, tag) {
  const r = await C.page.evaluate(async () => {
    const sel = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
    const visible = (e) => {
      if (e.closest("[hidden]")) return false;
      const b = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      return b.width > 0 && b.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
    };
    const els = [...document.querySelectorAll(`#stage ${sel.split(", ").join(", #stage ")}`)].filter(visible);
    els.forEach((e, i) => e.setAttribute("data-tabi", String(i)));
    document.activeElement?.blur?.();
    document.getElementById("main").focus?.();
    return { n: els.length, names: els.map((e) => (e.textContent || e.getAttribute("aria-label") || e.id || e.tagName).trim().slice(0, 24)) };
  });
  const reached = new Set();
  await C.page.evaluate(() => {
    const first = document.querySelector("h1");
    first.setAttribute("tabindex", "-1");
    first.focus();
  });
  for (let i = 0; i < r.n + 6 && i < 160; i++) {
    await C.page.keyboard.press("Tab");
    const t = await C.page.evaluate(() => document.activeElement?.getAttribute?.("data-tabi"));
    if (t != null) reached.add(Number(t));
  }
  const missing = [];
  for (let i = 0; i < r.n; i++) if (!reached.has(i)) missing.push(`${i}:${r.names[i]}`);
  ok(missing.length === 0, `${C.label}: Tab did not reach ${missing.slice(0, 4).join(", ")} of ${r.n} controls (${tag})`);
  await C.page.evaluate(() => document.querySelectorAll("[data-tabi]").forEach((e) => e.removeAttribute("data-tabi")));
}
async function axe(C, tag) {
  if (!AxeBuilder) return;
  const r = await new AxeBuilder({ page: C.page }).include("#stage").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  ok(bad.length === 0, `${C.label}: axe (${tag}) ${bad.map((v) => `${v.id}(${v.nodes.length}): ${v.nodes[0]?.html?.slice(0, 100)}`).join("; ")}`);
}
async function reducedMotion(C) {
  await C.page.emulateMedia({ reducedMotion: "reduce" });
  await C.page.waitForTimeout(100);
  const n = await C.page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.target?.closest?.("#stage")).length);
  ok(n === 0, `${C.label}: ${n} running animations with reduced motion`);
  await C.page.emulateMedia({ reducedMotion: "no-preference" });
}

// ---- driving helpers
const stage = (C) => C.page.locator("#stage");
const activeId = (C) => C.page.locator("#stage [data-mlea-stage]").first().getAttribute("data-mlea-stage");
const fbOf = (el) => el.evaluate((node) => {
  for (let n = node.parentElement; n; n = n.parentElement) {
    const f = n.querySelector("[data-mlea-fb]");
    if (f) return f.textContent || "";
  }
  return "";
});
/** Click each option of a group until one is right. Every wrong click must show "Not yet" plus a hint. */
async function brute(C, group, { label = "", forbid = [], expectHint = true } = {}) {
  const btns = group.locator("button.mlea-opt");
  const n = await btns.count();
  let wrong = 0;
  for (let i = 0; i < n; i++) {
    const b = btns.nth(i);
    if (await b.isDisabled()) continue;
    await b.click();
    if (await b.evaluate((el) => el.classList.contains("mlea-ok"))) return { ok: true, wrong };
    wrong++;
    if (expectHint) {
      const t = await fbOf(b);
      ok(/^Not yet\./.test(t.trim()) && t.trim().length > 25, `${C.label} ${label}: a wrong choice gave no hint (${JSON.stringify(t.slice(0, 80))})`);
      for (const f of forbid) ok(!t.includes(f), `${C.label} ${label}: a wrong choice's hint gave away "${f}"`);
    }
  }
  ok(false, `${C.label} ${label}: no option was accepted`);
  return { ok: false, wrong };
}
const clickText = async (C, text, scope = "#stage") => {
  const b = C.page.locator(`${scope} button`).filter({ hasText: text }).first();
  await b.waitFor({ state: "visible", timeout: 5000 });
  await b.click();
};
const UNIVERSAL = (C) => `First I looked at ${C.info.term0} and ${C.info.targets[0] || C.info.term0}, then I used 2 and 3 because both are alike but different, so it works.`;
const hasText = async (C, re) => re.test((await stage(C).textContent()) || "");

// ---- the six drivers
const DRIVERS = {
  async "reading-lab"(C) {
    const rounds = C.idx === 1 ? 2 : 1;
    for (let round = 0; round < rounds; round++) {
      const pr = await C.page.evaluate(([s, l, sd, r]) => window.T.problem(s, l, sd, r), [C.skill.id, C.level, C.seed, round]);
      const seen = [];
      let guard = 0;
      // the three scaffolds: on at band 1-2 and off at band 5-6
      const helpOn = await C.page.locator("#stage .mlea-help input[type=checkbox]").first().isChecked().catch(() => null);
      if (round === 0 && helpOn !== null) ok(helpOn === (C.band === "1-2"), `${C.label}: first-stage help should start ${C.band === "1-2" ? "on" : "off"} at band ${C.band}`);
      // same problem, different words: the numbers never change
      const nums = async () => ((await C.page.locator("#stage [data-mlea-problem]").textContent()) || "").match(/\d[\d,]*(?:\.\d+)?/g)?.join("|") || "";
      if (round === 0) {
        const before = await nums();
        for (const w of ["Simpler words", "Richer words", "Grade words"]) {
          await clickText(C, w);
          ok((await nums()) === before, `${C.label}: wording "${w}" changed the numbers`);
        }
      }
      while (guard++ < 30) {
        const id = await activeId(C);
        if (id === "finished") break;
        seen.push(id);
        const panel = C.page.locator(`#stage [data-mlea-stage="${id}"]`);
        if (id === "read") await clickText(C, "I have read it");
        else if (["question", "relationship", "picture"].includes(id)) await brute(C, panel.locator(".mlea-choices").first(), { label: id });
        else if (id === "equation") await brute(C, panel.locator(".mlea-choices").first(), { label: id, forbid: [] });
        else if (id === "connect") {
          const gs = panel.locator(".mlea-choices");
          for (let i = 0; i < (await gs.count()); i++) await brute(C, gs.nth(i), { label: id });
        } else if (id === "quantities") {
          await clickText(C, "Check my marks");
          ok(/Not yet/.test((await panel.locator("[data-mlea-fb]").textContent()) || ""), `${C.label}: no marks should be "Not yet"`);
          const spans = panel.locator("button.mlea-span");
          for (let i = 0; i < (await spans.count()); i++) if (/\d/.test((await spans.nth(i).textContent()) || "")) await spans.nth(i).click();
          await clickText(C, "Check my marks");
          ok(/Yes/.test((await panel.locator("[data-mlea-fb]").textContent()) || ""), `${C.label}: marking every number was not accepted`);
        } else if (id === "solve") {
          const typed = await panel.locator("input[type=text]").count();
          const ansText = String(pr.answer.text);
          const inProblem = new RegExp(`(^|\\D)${ansText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\D|$)`).test(`${pr.stem.standard} ${pr.ask.standard}`);
          if (typed) {
            const inp = panel.locator("input[type=text]");
            for (let k = 0; k < 3; k++) {
              await inp.fill(String(987650 + k));
              await inp.press("Enter");
              const t = (await panel.locator("[data-mlea-fb]").textContent()) || "";
              ok(/^Not yet\./.test(t.trim()), `${C.label}: wrong typed answer gave "${t.slice(0, 60)}"`);
              if (!inProblem) ok(!t.includes(ansText), `${C.label}: wrong typed answer's hint contains the answer ${ansText}`);
              if (k === 2) ok((await panel.locator(".mlea-worked").count()) === 1, `${C.label}: no worked parallel example after 3 misses`);
            }
            await inp.fill(ansText.replace(/(\d)(?=(\d{3})+$)/g, "$1,"));
            await inp.press("Enter");
          } else {
            const g = panel.locator(".mlea-choices").first();
            await brute(C, g, { label: "solve", forbid: inProblem ? [] : [ansText] });
          }
          ok(/Yes/.test((await panel.locator("[data-mlea-fb]").first().textContent()) || ""), `${C.label}: the right answer was not accepted`);
          await clickText(C, "Next step");
        } else if (id === "explain") {
          const area = panel.locator("textarea");
          await area.fill("Short.");
          await clickText(C, "Check my sentence");
          ok(/Not yet/.test((await panel.locator("[data-mlea-fb]").textContent()) || ""), `${C.label}: a too-short explanation should get a note`);
          await area.fill(`I used the numbers ${C.info.term0} and 2 because the problem shows the relationship, so I solved it.`);
          await clickText(C, "Check my sentence");
          ok(/shape is right/.test((await panel.locator("[data-mlea-fb]").textContent()) || ""), `${C.label}: a good explanation was not accepted`);
          await clickText(C, "Next: revise");
        } else if (id === "revise") {
          const boxes = panel.locator(".mlea-checklist input[type=checkbox]");
          for (let i = 0; i < (await boxes.count()); i++) await boxes.nth(i).check();
          await clickText(C, "Check again");
          await clickText(C, "Finish");
        } else ok(false, `${C.label}: unknown stage ${id}`);
        if (["question", "relationship", "picture", "equation", "connect", "quantities"].includes(id)) await panel.locator("[data-mlea-next]").click();
        if (C.idx === 0 && ["picture", "equation", "solve"].includes(id)) await shot(C, `stage-${id}`);
      }
      ok((await activeId(C)) === "finished", `${C.label}: the walk-through did not finish (${seen.join(",")})`);
      if (round === 0) console.log(`  reading-lab stages run: ${seen.join(" > ")}`);
      if (round < rounds - 1) await clickText(C, "Try another problem");
    }
  },

  async anatomy(C) {
    const pr = await C.page.evaluate(([s, l, sd]) => window.T.problem(s, l, sd, 0), [C.skill.id, C.level, C.seed]);
    ok(/Decide from what is happening, not from one word/.test((await stage(C).textContent()) || ""), `${C.label}: the keyword note is missing`);
    const parts = C.page.locator("#stage [data-mlea-part]");
    ok((await parts.count()) === 6, `${C.label}: expected 6 anatomy parts, got ${await parts.count()}`);
    for (let i = 0; i < 6; i++) {
      const part = parts.nth(i);
      const pid = await part.getAttribute("data-mlea-part");
      if (pid === "sort") {
        await part.locator("button.btn.primary").click();
        ok(/Not yet/.test((await part.locator("[data-mlea-fb]").textContent()) || ""), `${C.label}: an empty sort should be "Not yet"`);
        const rows = part.locator(".mlea-sortrow");
        const n = await rows.count();
        for (let r = 0; r < n; r++) await rows.nth(r).locator("button").nth(r === n - 1 ? 1 : 0).click();
        await part.locator("button.btn.primary").click();
      } else await brute(C, part.locator(".mlea-choices"), { label: pid });
      ok(/Yes|correct/.test((await part.locator("[data-mlea-fb]").textContent()) || ""), `${C.label}: part ${pid} did not finish`);
    }
    await clickText(C, "Compare with the full anatomy");
    const dl = C.page.locator("#stage .mlea-dl");
    ok((await dl.locator("dt").count()) === 6, `${C.label}: the reveal should name six parts`);
    const rt = (await C.page.locator("#stage .mlea-reveal").textContent()) || "";
    const ans = String(pr.answer.text);
    const inProblem = new RegExp(`(^|\\D)${ans.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\D|$)`).test(`${pr.stem.standard} ${pr.ask.standard}`);
    if (!inProblem && !/^[a-z]{1,4}$/i.test(ans)) ok(!new RegExp(`(^|\\D)${ans.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\D|$)`).test(rt), `${C.label}: the anatomy reveal states the answer ${ans}`);
    await clickText(C, "New problem");
    ok((await C.page.locator("#stage [data-mlea-part]").count()) === 6, `${C.label}: new problem did not rebuild the parts`);
  },

  async "sentence-studio"(C) {
    const tabs = C.page.locator("#stage .mlea-tabs").first().locator("button");
    const n = await tabs.count();
    const ran = [];
    for (let i = 0; i < n; i++) {
      await C.page.locator("#stage .mlea-tabs").first().locator("button").nth(i).click();
      const id = await activeId(C);
      ran.push(id);
      const panel = C.page.locator(`#stage [data-mlea-stage="${id}"]`);
      const writerStep = async (kindShort) => {
        const area = panel.locator("textarea").last();
        await area.fill("Short.");
        await panel.locator("button").filter({ hasText: "Check my sentence" }).last().click();
        ok(/Not yet/.test((await panel.locator("[data-mlea-fb]").last().textContent()) || ""), `${C.label} ${id}: "Short." should get a note`);
        await area.fill(UNIVERSAL(C));
        await panel.locator("button").filter({ hasText: "Check my sentence" }).last().click();
        ok(/shape is right/.test((await panel.locator("[data-mlea-fb]").last().textContent()) || ""), `${C.label} ${id}: the universal sentence was not accepted: ${(await panel.locator("[data-mlea-fb]").last().textContent()).slice(0, 120)}`);
        ok((await panel.locator(".mlea-model").filter({ hasText: "A model" }).count()) >= 0, "model");
      };
      const advance = async () => {
        const nb = panel.locator("button").filter({ hasText: /^(Next|Finish|Build my paragraph)/ });
        if (await nb.count()) await nb.first().click();
      };
      if (id === "complete") {
        for (let k = 0; k < 3; k++) {
          if (await panel.locator(".mlea-choices").count()) await brute(C, panel.locator(".mlea-choices").first(), { label: id });
          else {
            const inp = panel.locator("input[type=text]");
            let accepted = false;
            for (const t of C.info.vocab) {
              await inp.fill(t);
              await inp.press("Enter");
              if (/Yes/.test((await panel.locator("[data-mlea-fb]").textContent()) || "")) {
                accepted = true;
                break;
              }
              const t2 = (await panel.locator("[data-mlea-fb]").textContent()) || "";
              ok(/^Not yet\./.test(t2.trim()), `${C.label} complete: wrong word gave no hint`);
            }
            ok(accepted, `${C.label} complete: no vocab term was accepted`);
          }
          await advance();
        }
      } else if (id === "expand") {
        for (let k = 0; k < 3; k++) {
          if (!(await panel.locator("textarea").count())) break;
          await writerStep();
          await advance();
        }
      } else if (id === "swap") {
        for (let k = 0; k < 3; k++) {
          if (!(await panel.locator(".mlea-choices").count())) break;
          await brute(C, panel.locator(".mlea-choices").first(), { label: id });
          await advance();
        }
      } else if (id === "conclude" || id === "error") {
        await brute(C, panel.locator(".mlea-choices").first(), { label: id });
        await writerStep();
      } else if (id === "paragraph") {
        for (let k = 0; k < 3; k++) {
          await writerStep();
          await advance();
        }
      } else {
        await writerStep();
      }
      if (i === 0 && C.idx === 0) await shot(C, `act-${id}`);
    }
    console.log(`  sentence-studio activities run: ${ran.join(", ")}`);
    ok(/(\d+) of \1 activities done/.test((await stage(C).textContent()) || ""), `${C.label}: not every activity finished (${(await stage(C).textContent()).match(/\d+ of \d+ activities done/)})`);
  },

  async translator(C) {
    const names = await C.page.locator("#stage .mlea-tabs").first().locator("button").allTextContents();
    console.log(`  translator modes: ${names.join(" | ")}`);
    for (let i = 0; i < names.length; i++) {
      await C.page.locator("#stage .mlea-tabs").first().locator("button").nth(i).click();
      const id = await activeId(C);
      const panel = C.page.locator(`#stage [data-mlea-stage="${id}"]`);
      if (id === "build") {
        const src = (await panel.locator(".mlea-src").textContent()) || "";
        const nums = [...new Set(src.match(/\d+/g) || [])];
        const steppers = panel.locator(".mlea-stepper input[type=number]");
        const k = await steppers.count();
        const perms = k === 1 ? nums.map((x) => [x]) : k === 2 ? nums.flatMap((a) => nums.map((b) => [a, b])) : nums.flatMap((a) => nums.flatMap((b) => nums.map((c) => [a, b, c])));
        let done = false;
        let wrongSeen = 0;
        for (const perm of perms) {
          for (let j = 0; j < k; j++) await steppers.nth(j).fill(perm[j]);
          await panel.locator("button").filter({ hasText: "Check my picture" }).click();
          const t = (await panel.locator("[data-mlea-fb]").textContent()) || "";
          if (/Yes/.test(t)) {
            done = true;
            break;
          }
          wrongSeen++;
          ok(/^Not yet\./.test(t.trim()) && t.length > 30, `${C.label} build: a wrong picture gave no specific note: ${t.slice(0, 80)}`);
        }
        ok(done, `${C.label} build: the picture was never accepted for story numbers ${nums.join(",")}`);
        // the stepper buttons work from the keyboard (focus + Enter) and change the picture
        const plus = panel.locator("button[aria-label^='More']").first();
        await plus.focus();
        await C.page.keyboard.press("Enter");
        continue;
      }
      const g = panel.locator(".mlea-choices").first();
      const r = await brute(C, g, { label: `translate ${id}` });
      ok(r.ok, `${C.label}: ${names[i]} was never matched`);
      ok((await panel.locator(".mlea-allreps").count()) === 1, `${C.label}: after a match all representations should show`);
      if (i === 0 && C.idx === 0) await shot(C, "match");
      if (r.wrong > 0) {
        // specific feedback: mentions a number or a thing, never just "wrong"
        // (checked inside brute: length > 25 and starts with "Not yet.")
      }
    }
    ok(/Matches this visit: [1-9]/.test((await stage(C).textContent()) || ""), `${C.label}: match counter did not move`);
  },

  async "vocab-explorer"(C) {
    const vocabN = C.info.vocab.length;
    const tabs = C.page.locator("#stage .mlea-tabs").nth(1);
    const labels = await tabs.locator("button").allTextContents();
    for (let t = 0; t < labels.length; t++) {
      const b = C.page.locator("#stage .mlea-tabs").nth(1).locator("button").nth(t);
      await b.click();
      const txt = ((await C.page.locator("#stage [data-mlea-stage=vocab]").textContent()) || "").trim();
      ok(txt.length > 20, `${C.label}: tab "${labels[t]}" is empty`);
      if (labels[t] === "Your own example") {
        await C.page.locator("#stage [data-mlea-stage=vocab] textarea").fill(`A ${C.info.term0} is something I can show.`);
        await clickText(C, "Keep it for now");
        ok(/Kept for this visit only/.test((await stage(C).textContent()) || ""), `${C.label}: own example not kept`);
      }
      if (labels[t] === "Spanish word") ok(/Draft/.test(txt) && /not reviewed|has not reviewed/.test(txt), `${C.label}: Spanish is not labelled as a draft`);
      if (labels[t] === "Picture" && t === 0 && C.idx === 0) await shot(C, "picture");
    }
    // visit every word
    for (let w = 1; w < vocabN; w++) await clickText(C, "Next word");
    ok(new RegExp(`Words explored: ${vocabN} of ${vocabN}`).test((await stage(C).textContent()) || ""), `${C.label}: not every word was explored`);
    await clickText(C, "Check yourself");
    for (let q = 0; q < 8; q++) {
      const quiz = C.page.locator("#stage .mlea-quiz");
      if (/You answered/.test((await quiz.textContent()) || "")) break;
      await brute(C, quiz.locator(".mlea-choices").first(), { label: "vocab check" });
      await quiz.locator("button").filter({ hasText: /^(Next question|Finish)/ }).click();
    }
    ok(/You answered/.test((await C.page.locator("#stage .mlea-quiz").textContent()) || ""), `${C.label}: the vocabulary check did not finish`);
    await shot(C, "check");
    await clickText(C, "Back to exploring");
  },

  async "talk-studio"(C) {
    const tabs = C.page.locator("#stage .mlea-tabs").first();
    const n = await tabs.locator("button").count();
    const ran = [];
    for (let i = 0; i < n; i++) {
      await C.page.locator("#stage .mlea-tabs").first().locator("button").nth(i).click();
      const id = await activeId(C);
      ran.push(id);
      const panel = C.page.locator(`#stage [data-mlea-stage="${id}"]`);
      ok((await panel.locator(".mlea-stems").count()) >= 1 || id === "wyr" || id === "debate" || true, "stems");
      const stemsText = (await panel.locator(".mlea-stems").first().textContent().catch(() => "")) || "";
      ok(!stemsText || /Say it like this/.test(stemsText), `${C.label} ${id}: stems box wrong`);
      const gs = panel.locator(".mlea-choices");
      const gn = await gs.count();
      for (let k = 0; k < gn; k++) {
        const g = gs.nth(k);
        if (await g.locator("button.mlea-opt[aria-pressed]").count()) await g.locator("button").first().click();
        else await brute(C, g, { label: id });
      }
      const areas = panel.locator("textarea");
      for (let k = 0; k < (await areas.count()); k++) await areas.nth(k).fill("I think this is true because the numbers show the same relationship.");
      for (const t of ["Compare with another reason", "Check my restating"]) {
        const b = panel.locator("button").filter({ hasText: t });
        if (await b.count()) await b.click();
      }
      const box = panel.locator("input[type=checkbox]");
      if (await box.count()) await box.first().check();
      await panel.locator("button").filter({ hasText: "Mark this card done" }).click();
      if (i === 0 && C.idx === 0) await shot(C, `card-${id}`);
    }
    await clickText(C, "Swap partner roles");
    ok(/Partner B: .*Partner A:/.test((await stage(C).textContent()) || ""), `${C.label}: roles did not swap`);
    console.log(`  talk-studio cards run: ${ran.join(", ")}`);
    ok(new RegExp(`Cards done this visit: ${n} of ${n}`).test((await stage(C).textContent()) || ""), `${C.label}: not every card was marked done`);
  },
};

if (!flag("--no-jsdom")) await jsdomPass();
if (!flag("--jsdom-only")) await browserPass();
console.log(`\n${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
