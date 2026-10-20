import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../curriculum/index.html", import.meta.url), "utf8");
const script = readFileSync(
  new URL("../assets/curriculum-teacher-bar.js", import.meta.url),
  "utf8",
);
const bar = html.slice(
  html.indexOf('<section id="hub-teacher-bar"'),
  html.indexOf("</section>", html.indexOf('<section id="hub-teacher-bar"')) + 10,
);
assert.ok(bar.includes('role="tablist"'), "bar markup present in curriculum/index.html");

let passed = 0;
function setup({ teacher, saved } = {}) {
  const dom = new JSDOM(
    `<body class="${teacher ? "teacher-mode" : ""}"><main id="main">${bar}
      <section id="hub-now"><h2>This week</h2></section>
      <details id="lib"><section id="district-pacing-console"></section>
      <div id="hub-planning-workspace"></div></details></main></body>`,
    { url: "https://eduwonderlab.com/curriculum/", runScripts: "outside-only" },
  );
  if (saved) dom.window.localStorage.setItem("nt-hub-teacher-bar-tab", saved);
  dom.window.eval(script);
  return dom.window;
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const selected = (w) =>
  [...w.document.querySelectorAll(".htb-tab")]
    .filter((t) => t.getAttribute("aria-selected") === "true")
    .map((t) => t.id);
const test = async (name, fn) => {
  await fn();
  passed++;
  console.log(`PASS ${name}`);
};

await test("student mode leaves every console where it was and the bar hidden", async () => {
  const w = setup({ teacher: false });
  assert.equal(w.document.getElementById("hub-teacher-bar").hidden, true);
  assert.equal(w.document.getElementById("hub-now").parentElement.id, "main");
  assert.equal(w.document.querySelectorAll('[role="tabpanel"] > *').length, 0);
});

await test("teacher mode adopts the consoles and restores them for students", async () => {
  const w = setup({ teacher: true });
  const d = w.document;
  assert.equal(d.getElementById("hub-teacher-bar").hidden, false);
  assert.equal(d.getElementById("hub-now").parentElement.id, "htb-panel-week");
  assert.equal(d.getElementById("district-pacing-console").parentElement.id, "htb-panel-pacing");
  assert.equal(d.getElementById("hub-planning-workspace").parentElement.id, "htb-panel-workflow");
  d.body.classList.remove("teacher-mode");
  await tick();
  assert.equal(d.getElementById("hub-now").parentElement.id, "main");
  assert.equal(d.getElementById("district-pacing-console").parentElement.id, "lib");
  assert.equal(d.getElementById("hub-teacher-bar").hidden, true);
});

await test("a console built later is adopted when it announces itself", async () => {
  const w = setup({ teacher: true });
  const panel = w.document.createElement("section");
  panel.id = "curriculum-teacher-workflow";
  w.document.getElementById("lib").appendChild(panel);
  w.document.dispatchEvent(new w.CustomEvent("ctw:panel-ready"));
  assert.equal(panel.parentElement.id, "htb-panel-workflow");
});

await test("tabs keep ARIA state, one visible panel, and arrow/Home/End keys", async () => {
  const w = setup({ teacher: true });
  const d = w.document;
  const key = (id, k) =>
    d
      .getElementById(id)
      .dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  assert.deepEqual(selected(w), ["htb-tab-week"]);
  key("htb-tab-week", "ArrowRight");
  assert.deepEqual(selected(w), ["htb-tab-pacing"]);
  assert.equal(d.activeElement.id, "htb-tab-pacing");
  key("htb-tab-pacing", "End");
  assert.deepEqual(selected(w), ["htb-tab-workflow"]);
  key("htb-tab-workflow", "ArrowRight");
  assert.deepEqual(selected(w), ["htb-tab-week"]);
  key("htb-tab-week", "ArrowLeft");
  assert.deepEqual(selected(w), ["htb-tab-workflow"]);
  key("htb-tab-workflow", "Home");
  assert.deepEqual(selected(w), ["htb-tab-week"]);
  const visible = [...d.querySelectorAll('[role="tabpanel"]')].filter((p) => !p.hidden);
  assert.equal(visible.length, 1);
  assert.equal(d.getElementById("htb-tab-pacing").tabIndex, -1);
});

await test("the chosen tab is remembered, and reveal() opens the tab holding a console", async () => {
  const first = setup({ teacher: true });
  first.document.getElementById("htb-tab-pacing").click();
  assert.equal(first.localStorage.getItem("nt-hub-teacher-bar-tab"), "pacing");
  const w = setup({ teacher: true, saved: "pacing" });
  assert.deepEqual(selected(w), ["htb-tab-pacing"]);
  w.CurriculumTeacherBar.reveal(w.document.getElementById("hub-planning-workspace"));
  assert.deepEqual(selected(w), ["htb-tab-workflow"]);
});

await test("an unusable saved tab falls back to This week", async () => {
  assert.deepEqual(selected(setup({ teacher: true, saved: "nope" })), ["htb-tab-week"]);
});

console.log(`${passed} passed`);
