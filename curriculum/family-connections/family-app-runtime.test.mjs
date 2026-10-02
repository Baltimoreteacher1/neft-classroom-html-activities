import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import * as model from "./shared/model.js";
import * as hub from "./shared/homework-hub.js";
import * as weeks from "./shared/homework-weeks.js";
import * as checks from "./shared/publication-checks.js";
import { weekStartFor } from "./shared/pacing-week.js";

const monday = weekStartFor(hub.schoolDate());
const manifest = { lessons: [{ id: "3-2", title: "Unit rates", homeworkPath: "/lessons/3-2/homework.html" }] };
function plan(start) {
  const value = model.createDefaultSnapshot();
  value.publishedAt = new Date().toISOString();
  value.sections[0].week.startDate = start;
  Object.assign(value.sections[0].week.days[0], { status: "lesson", lessonId: "3-2" });
  value.sections.push({ ...structuredClone(model.createDefaultSnapshot().sections[0]), id: "602", label: "602", isDefault: false });
  return value;
}
async function boot(path, state, query = "") {
  const html = await readFile(new URL(path === "family" ? "./index.html" : "./teacher/homework.html", import.meta.url), "utf8");
  const source = await readFile(new URL("./family-app.js", import.meta.url), "utf8");
  const dom = new JSDOM(html, { url: `https://eduwonderlab.com/curriculum/family-connections/${path === "family" ? "" : "teacher/homework"}${query}`, runScripts: "outside-only" });
  const previous = globalThis.document;
  globalThis.document = dom.window.document;
  Object.assign(dom.window, model, hub, weeks, checks, {
    loadDraft: async () => structuredClone(state),
    saveDraft: async (draft) => structuredClone(draft),
    publishDraft: async () => { throw new Error("Test must not publish"); },
  });
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  dom.window.fetch = async (url) => new Response(JSON.stringify(url.includes("manifest") ? manifest : {
    published: state, weeks: weeks.publicHomeworkWeeks(state, [plan(monday), plan(hub.addDays(monday, -7))]),
  }), { status: 200 });
  dom.window.eval(source.replace(/^import[\s\S]*?;\n/gm, ""));
  for (let i = 0; i < 4; i++) await new Promise((resolve) => setImmediate(resolve));
  return { window: dom.window, document: dom.window.document, close: () => { globalThis.document = previous; dom.window.close(); } };
}
function change(window, element, value) {
  element.value = value;
  element.dispatchEvent(new window.Event("change", { bubbles: true }));
}

test("actual family app defaults to current week, opens archive, keeps language/date links, and resets week on class change", async () => {
  const view = await boot("family", plan(hub.addDays(monday, 7)));
  try {
    const { document: d, window: w } = view;
    assert.equal(d.getElementById("family-status").textContent, "");
    assert.equal(d.getElementById("homework-week-select").options.length, 4);
    assert.match(d.querySelector("#family-week h2").textContent, /This week/);
    const previousWeek = hub.addDays(monday, -7);
    change(w, d.getElementById("homework-week-select"), previousWeek);
    assert.match(d.querySelector("#family-week h2").textContent, /Previous homework/);
    assert.equal(new URL(w.location.href).searchParams.get("week"), previousWeek);
    d.getElementById("language-toggle").click();
    assert.equal(new URL(w.location.href).searchParams.get("week"), previousWeek);
    assert.equal(d.querySelector(".homework-card a").getAttribute("href"), "/lessons/3-2/homework.html?route=core&lang=es&section=all-families");
    change(w, d.getElementById("section-select"), "602");
    assert.equal(new URL(w.location.href).searchParams.has("week"), false);
    assert.equal(d.getElementById("homework-week-select"), null);
  } finally { view.close(); }
});

test("old week bookmarks open previous homework and unavailable week bookmarks recover to the current plan", async () => {
  for (const date of [hub.addDays(monday, -7), "2000-01-03"]) {
    const view = await boot("family", plan(hub.addDays(monday, 7)), `?week=${date}`);
    try {
      assert.match(view.document.querySelector("#family-week h2").textContent, date === "2000-01-03" ? /This week/ : /Previous homework/);
    } finally { view.close(); }
  }
});

test("actual inline teacher editor shows all classes' publication checks, keeps confirmation gated, and invalidates it after edits", async () => {
  const view = await boot("teacher", plan(monday));
  try {
    const { document: d, window: w } = view;
    assert.equal(d.getElementById("teacher-inline").hidden, false);
    const select = d.getElementById("inline-day-select-1");
    assert.equal(select.options[0].textContent, "Not posted yet");
    change(w, select, "no-class");
    assert.equal(d.getElementById("inline-day-select-1").value, "no-class");
    d.getElementById("inline-week-form").dispatchEvent(new w.Event("submit", { cancelable: true }));
    assert.equal(d.getElementById("inline-publication-checks").hidden, false);
    assert.match(d.getElementById("inline-publication-checks").textContent, /602/);
    assert.match(d.getElementById("inline-publication-checks").textContent, /No dated plan/);
    assert.equal(d.getElementById("inline-publish-confirm").hidden, false);
    change(w, d.getElementById("inline-day-select-1"), "");
    assert.equal(d.getElementById("inline-publish-confirm").hidden, true);
    assert.equal(d.getElementById("inline-publication-checks").hidden, true);
  } finally { view.close(); }
});
