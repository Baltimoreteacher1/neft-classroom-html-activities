// Studio chrome (assets/studio/chrome.js): the lesson-data validator, the activity state machine, the pathway and settings
// key rules, the silent-by-default logger, and the boot self-test on every real studio page.
//   node tools/studio-chrome.test.mjs
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");
const js = (dir) =>
  readdirSync(join(REPO_ROOT, dir))
    .filter((f) => f.endsWith(".js"))
    .sort((a, b) => (a === "core.js" ? -1 : b === "core.js" ? 1 : a.localeCompare(b)));

function makeWindow(url = "https://eduwonderlab.com/math/practice-studio/5-8/") {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    runScripts: "outside-only",
    url,
  });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false });
  const logs = { debug: 0, warn: 0, error: 0 };
  w.console.debug = () => logs.debug++;
  w.console.warn = () => logs.warn++;
  w.console.error = () => logs.error++;
  for (const f of js("assets/studio-gen")) w.eval(read(`assets/studio-gen/${f}`));
  for (const f of js("assets/studio-act")) w.eval(read(`assets/studio-act/${f}`));
  for (const f of ["studio-viz.js", "studio-viz-geo.js", "studio-viz-model.js"])
    w.eval(read(`assets/${f}`));
  w.eval(read("assets/studio/store.js"));
  return { w, logs };
}
const chromeSrc = read("assets/studio/chrome.js");
function boot(w, pageHtml) {
  const doc = new JSDOM(pageHtml).window.document;
  w.document.body.innerHTML = doc.body.innerHTML;
  w.document.body.dataset.theme = doc.body.dataset.theme;
  w.eval(chromeSrc);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  return w.EWLChrome;
}
const dataOf = (html) => JSON.parse(/id="studio-data">([\s\S]*?)<\/script>/.exec(html)[1]);

// ---- every real page: valid data, mounts present, self-test passes, bar built --------------------------------------
const { w, logs } = makeWindow();
const pages = [];
for (const dir of readdirSync(join(REPO_ROOT, "math/practice-studio")).filter((d) =>
  /^\d+-\d+$/.test(d),
))
  for (const sub of ["", "challenge/"]) {
    const rel = `math/practice-studio/${dir}/${sub}index.html`;
    if (existsSync(join(REPO_ROOT, rel))) pages.push([rel, read(rel)]);
  }
assert.ok(pages.length >= 134, `found ${pages.length} studio pages`);
for (const [rel, html] of pages) {
  const c = boot(w, html);
  assert.ok(c, `${rel}: chrome did not start`);
  const p = c.validateConfig(dataOf(html));
  assert.equal(p.length, 0, `${rel}: ${p[0]}`);
  const r = c.selfTest();
  assert.ok(r.ok, `${rel}: ${JSON.stringify(r.results.filter((x) => !x.ok))}`);
  assert.ok(w.document.getElementById("ewl-hud"), `${rel}: no status bar`);
  assert.equal(w.document.querySelectorAll(".ewl-hud-opt").length, 3, `${rel}: three pathways`);
  assert.match(c.key, /^ewl_u[2-9]_l\d+_v2$/, `${rel}: settings key`);
  assert.equal(c.pathway.id, /challenge\/index/.test(rel) ? 3 : 2, `${rel}: default pathway`);
  assert.match(
    w.document.querySelector(".ewl-brand")?.textContent || "",
    /Neft · EduWonderLab/,
    `${rel}: branding`,
  );
  assert.equal(
    w.document.body.dataset.theme,
    /challenge\/index/.test(rel) ? "dark" : "light",
    `${rel}: native theme`,
  );
  w.document.getElementById("ewl-hud")?.remove();
}
assert.equal(logs.debug, 0, "the logger is silent without ?debug=true");

// ---- validator negative controls ----------------------------------------------------------------------------------------
const sample = pages.find(([r]) => r.includes("/5-8/index.html"))[1];
const good = dataOf(sample);
const c0 = boot(w, sample);
const bad = (mut) => {
  const d = structuredClone(good);
  mut(d);
  return c0.validateConfig(d);
};
assert.match(bad((d) => (d.lesson = "five")).join(), /not unit-lesson/);
assert.match(bad((d) => (d.mode = "exam")).join(), /not practice or challenge/);
assert.match(bad((d) => d.sections.pop()).join(), /exactly 5 sections/);
assert.match(bad((d) => (d.sections[0].items = [])).join(), /has no items/);
assert.match(bad((d) => (d.sections[1].items[0] = { k: "magic" })).join(), /unknown kind/);
assert.match(
  bad(
    (d) =>
      (d.sections[0].items[0] = {
        ...d.sections[0].items[0],
        id: "dup",
        k: "gen",
        g: "nope",
        level: 1,
      }),
  ).join(),
  /not registered/,
);
const mcAt = (d) =>
  d.sections
    .flatMap((s, si) => s.items.map((it, ii) => [si, ii, it]))
    .find(([, , it]) => it.k === "mc");
assert.match(
  bad((d) => {
    const [si, ii] = mcAt(d);
    d.sections[si].items[ii].a = 99;
  }).join(),
  /answer index/,
);
assert.match(
  bad((d) => {
    d.sections[0].items[0].id = "same";
    d.sections[0].items[1].id = "same";
  }).join(),
  /duplicate item id/,
);
assert.equal(c0.validateConfig(null).join(), "the lesson data is missing");

// ---- state machine, pathway, record, theme, reset ------------------------------------------------------------------------
{
  const { w: v } = makeWindow("https://eduwonderlab.com/math/practice-studio/5-8/?path=1");
  const c = boot(v, sample);
  assert.equal(c.pathway.id, 1);
  assert.equal(c.pathway.scaffold, true);
  assert.equal(c.state(), "IDLE");
  const bus = v.StudioBus;
  // a wrong answer: VALIDATING, then FEEDBACK_DIAGNOSTIC
  bus.emit("answer", { itemId: "x", ok: false, tries: 1, tag: "trap" });
  assert.equal(c.state(), "FEEDBACK_DIAGNOSTIC");
  // a right answer: TASK_COMPLETE, then back to IDLE
  bus.emit("answer", { itemId: "x", ok: true, tries: 2 });
  assert.equal(c.state(), "IDLE");
  bus.emit("complete", {});
  assert.equal(c.state(), "LESSON_MASTERED");
  // an event that is not allowed from LESSON_MASTERED is ignored, never thrown on
  bus.emit("answer", { itemId: "y", ok: false, tries: 1 });
  assert.equal(c.state(), "LESSON_MASTERED");
  bus.emit("section", {});
  assert.equal(c.state(), "IDLE");
  const rec = JSON.parse(v.localStorage.getItem("ewl_u5_l8_v2"));
  assert.equal(rec.v, 2);
  assert.equal(rec.pathway, 1);
  assert.equal(rec.mastered, true);
  // a hostile or corrupt record never breaks the page
  const { w: u } = makeWindow();
  u.localStorage.setItem(
    "ewl_u5_l8_v2",
    JSON.stringify({ v: 2, lesson: "5-8", pathway: 9, stats: "no" }),
  );
  assert.equal(
    boot(u, sample).pathway.id,
    2,
    "an out-of-range stored pathway falls back to on-grade",
  );
  u.localStorage.setItem("ewl_u5_l8_v2", "{not json");
  assert.ok(boot(u, sample), "a corrupt record never stops the page");
  // the hud button toggles the theme and persists the choice
  v.document.getElementById("ewl-theme-btn").click();
  assert.equal(v.document.body.dataset.theme, "dark");
  assert.equal(JSON.parse(v.localStorage.getItem("ewl_u5_l8_v2")).theme, "dark");
}
{
  // the challenge twin is always pathway 3, whatever the URL asks
  const ch = pages.find(([r]) => r.endsWith("5-8/challenge/index.html"))[1];
  const { w: v } = makeWindow(
    "https://eduwonderlab.com/math/practice-studio/5-8/challenge/?path=1",
  );
  assert.equal(boot(v, ch).pathway.id, 3);
}
{
  // ?debug=true turns the logger and the inspector on; Ctrl+Shift+D toggles it
  const { w: v, logs: l } = makeWindow(
    "https://eduwonderlab.com/math/practice-studio/5-8/?debug=true",
  );
  boot(v, sample);
  assert.ok(
    v.document.getElementById("ewl-debug") && !v.document.getElementById("ewl-debug").hidden,
  );
  v.StudioBus.emit("answer", { itemId: "z", ok: false, tries: 1, tag: "t" });
  assert.ok(l.debug > 0, "debug mode logs");
  v.document.dispatchEvent(
    new v.KeyboardEvent("keydown", { key: "D", ctrlKey: true, shiftKey: true, bubbles: true }),
  );
  assert.ok(v.document.getElementById("ewl-debug").hidden, "Ctrl+Shift+D closes it");
}
console.log(
  `studio-chrome: ${pages.length} pages validated (data, mounts, self-test, bar); 9 negative controls; state machine, pathway, record, theme and debug rules ok.`,
);
