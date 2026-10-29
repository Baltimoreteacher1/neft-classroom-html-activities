import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import * as model from "./shared/model.js";
import * as hub from "./shared/homework-hub.js";
import * as weeks from "./shared/homework-weeks.js";
import * as checks from "./shared/publication-checks.js";
import * as welcomeModule from "./shared/family-welcome.js";
import * as hubLanguage from "./shared/hub-language.js";
import * as hubRoutes from "./shared/hub-routes.js";
import * as weeklySheetLinks from "./shared/weekly-sheet-links.js";
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
const cacheSource = await readFile(new URL("../../assets/curriculum-json-cache.js", import.meta.url), "utf8");
/* `options`: { welcome, stored: {key: value}, languages: [...], weeks: [snapshots] } */
async function boot(path, state, query = "", options = {}) {
  const html = await readFile(new URL(path === "family" ? "./index.html" : "./teacher/homework.html", import.meta.url), "utf8");
  const source = await readFile(new URL("./family-app.js", import.meta.url), "utf8");
  const dom = new JSDOM(html, { url: `https://eduwonderlab.com/curriculum/family-connections/${path === "family" ? "" : "teacher/homework"}${query}`, runScripts: "outside-only" });
  const previous = globalThis.document;
  globalThis.document = dom.window.document;
  for (const [name, value] of Object.entries(options.stored ?? {})) dom.window.localStorage.setItem(name, value);
  Object.defineProperty(dom.window.navigator, "languages", { value: options.languages ?? ["en-US", "en"], configurable: true });
  Object.assign(dom.window, model, hub, weeks, checks, welcomeModule, hubLanguage, hubRoutes, weeklySheetLinks, {
    loadDraft: async () => structuredClone(state),
    saveDraft: async (draft) => structuredClone(draft),
    publishDraft: async () => { throw new Error("Test must not publish"); },
  });
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  const requested = [];
  dom.window.fetch = async (url) => {
    requested.push(String(url));
    if (String(url).includes("family-welcome"))
      return options.welcome === undefined ? new Response("{}", { status: 404 }) : new Response(JSON.stringify(options.welcome), { status: 200 });
    return new Response(JSON.stringify(url.includes("manifest") ? manifest : {
      published: state, weeks: weeks.publicHomeworkWeeks(state, options.weeks ?? [plan(monday), plan(hub.addDays(monday, -7))]),
    }), { status: 200 });
  };
  dom.window.eval(cacheSource);
  dom.window.eval(source.replace(/^import[\s\S]*?;\n/gm, ""));
  for (let i = 0; i < 6; i++) await new Promise((resolve) => setImmediate(resolve));
  return { window: dom.window, document: dom.window.document, requested, close: () => { globalThis.document = previous; dom.window.close(); } };
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
    d.querySelector('#language-switch [data-lang="es"]').click();
    assert.equal(new URL(w.location.href).searchParams.get("week"), previousWeek);
    assert.equal(d.querySelector(".homework-card a").getAttribute("href"), "/lessons/3-2/homework.html?route=quick&lang=es&section=all-families");
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

const hrefs = (document) => [...document.querySelectorAll(".homework-card a")].map((a) => a.getAttribute("href"));
const welcomeFile = (entry) => ({ enabled: true, weeks: { [monday]: entry } });
const goodNote = { en: "Hi, families. Try one short route.", es: "Hola, familias. Prueben una ruta corta." };
const goodVideo = {
  src: "/curriculum/family-connections/welcome/w.mp4",
  captions: { en: "/curriculum/family-connections/welcome/w.en.vtt", es: "/curriculum/family-connections/welcome/w.es.vtt" },
};

test("the page is Family Math Studio from the first paint, in both languages, with the weekly-note kicker kept", async () => {
  const view = await boot("family", plan(monday));
  try {
    const { document: d } = view;
    assert.equal(d.getElementById("hub-title").textContent, "Family Math Studio");
    assert.equal(d.getElementById("hub-intro").textContent, "A few minutes of math at home. Optional. No grades.");
    assert.equal(d.getElementById("edition-label").textContent, "A weekly note from Mr. Neft");
    assert.equal(d.title, "Family Math Studio · EduWonderLab");
    const sheet = d.getElementById("weekly-sheet-links");
    assert.equal(sheet.hidden, false);
    assert.equal(sheet.querySelector("[data-ws=online]").textContent, "Fill it in online");
    assert.equal(sheet.querySelector("[data-ws=online]").getAttribute("href"), "./weekly-sheet/?lang=en");
    d.querySelector('#language-switch [data-lang="es"]').click();
    assert.equal(sheet.querySelector("[data-ws=online]").textContent, "Llenarla en línea");
    assert.equal(sheet.querySelector("[data-ws=print]").textContent, "Imprimir una copia (PDF)");
    assert.equal(sheet.querySelector("[data-ws=online]").getAttribute("href"), "./weekly-sheet/?lang=es");
    assert.equal(d.getElementById("hub-title").textContent, "Estudio familiar de matemáticas");
    assert.equal(d.getElementById("hub-intro").textContent, "Unos minutos de matemáticas en casa. Opcional. Sin calificaciones.");
    assert.equal(d.getElementById("edition-label").textContent, "Una nota semanal del Sr. Neft");
    assert.equal(d.title, "Estudio familiar de matemáticas · EduWonderLab");
    assert.equal(d.documentElement.lang, "es");
  } finally { view.close(); }
});

test("the language switch is the first control in the page body and writes hw_lang_mode for the lesson pages", async () => {
  const view = await boot("family", plan(monday));
  try {
    const { document: d, window: w } = view;
    const buttons = [...d.querySelectorAll("#language-switch button")];
    assert.deepEqual(buttons.map((b) => b.dataset.lang), ["en", "es"]);
    assert.equal(d.querySelector("#language-switch").compareDocumentPosition(d.getElementById("hub-title")) & w.Node.DOCUMENT_POSITION_FOLLOWING, w.Node.DOCUMENT_POSITION_FOLLOWING);
    assert.equal(w.localStorage.getItem("hw_lang_mode"), null, "opening the page must not record a choice nobody made");
    assert.equal(hrefs(d)[0], "/lessons/3-2/homework.html?route=quick&section=all-families", "no choice, no lang: the lesson page decides");
    buttons[1].click();
    assert.equal(w.localStorage.getItem("hw_lang_mode"), "es");
    assert.deepEqual(buttons.map((b) => b.getAttribute("aria-pressed")), ["false", "true"]);
    assert.ok(hrefs(d).every((href) => !href || href.includes("lang=es")), hrefs(d).join());
    assert.equal(new URL(w.location.href).searchParams.get("lang"), "es");
    buttons[0].click();
    assert.equal(w.localStorage.getItem("hw_lang_mode"), "en");
    assert.ok(hrefs(d).every((href) => !href || href.includes("lang=en")));
    assert.equal(new URL(w.location.href).searchParams.has("lang"), false);
    assert.equal(w.document.documentElement.lang, "en");
  } finally { view.close(); }
});

test("a language chosen on a lesson page opens the hub in that language; an address and a plain browser default are weaker", async () => {
  const cases = [
    [{ stored: { hw_lang_mode: "es" } }, "", "Estudio familiar de matemáticas", true],
    [{ stored: { hw_lang_mode: "es" } }, "?lang=en", "Family Math Studio", true],
    [{ stored: { hw_lang_mode: "bilingual" } }, "", "Family Math Studio", false],
    [{ languages: ["es-MX", "en"] }, "", "Estudio familiar de matemáticas", false],
  ];
  for (const [options, query, title, carriesLang] of cases) {
    const view = await boot("family", plan(monday), query, options);
    try {
      const { document: d, window: w } = view;
      assert.equal(d.getElementById("hub-title").textContent, title, JSON.stringify([options, query]));
      assert.equal(hrefs(d)[0].includes("lang="), carriesLang, hrefs(d)[0]);
      if (!carriesLang) assert.notEqual(w.localStorage.getItem("hw_lang_mode"), "es", "a detected default is not saved as a choice");
    } finally { view.close(); }
  }
});

test("first visit makes the class choice obvious and remembers it", async () => {
  const first = await boot("family", plan(monday));
  try {
    const { document: d, window: w } = first;
    const select = d.getElementById("section-select");
    assert.equal(d.getElementById("class-label").textContent, "Pick your class");
    assert.equal(select.selectedOptions[0].textContent, "Pick your class");
    assert.equal(select.selectedOptions[0].disabled, true);
    assert.deepEqual([...select.options].slice(1).map((o) => o.textContent), ["All Families", "602"]);
    assert.equal(d.getElementById("class-hint").hidden, false);
    assert.match(d.getElementById("class-hint").textContent, /Pick your class \(602\).*We remember your choice/);
    d.querySelector('#language-switch [data-lang="es"]').click();
    assert.match(d.getElementById("class-hint").textContent, /Elige tu clase \(602\).*Recordamos tu elección/);
    change(w, select, "602");
    assert.equal(d.getElementById("class-hint").hidden, true);
    assert.equal([...select.options].some((o) => o.value === ""), false);
    assert.equal(JSON.parse(w.localStorage.getItem("eduwonder.familyConnections.preferences.v1")).sectionChosen, true);
  } finally { first.close(); }
  const returning = await boot("family", plan(monday), "", {
    stored: { "eduwonder.familyConnections.preferences.v1": JSON.stringify({ sectionId: "602", sectionChosen: true }) },
  });
  try {
    assert.equal(returning.document.getElementById("class-hint").hidden, true);
    assert.equal(returning.document.getElementById("section-select").value, "602");
  } finally { returning.close(); }
});

test("Mr. Neft's note shows on a posted week in the family's language, and renders nothing when there is none", async () => {
  const shown = await boot("family", plan(monday), "", { welcome: welcomeFile({ ...goodNote, video: goodVideo }) });
  try {
    const { document: d } = shown;
    const card = d.querySelector("#family-week .welcome-note");
    assert.equal(card.querySelector("h3").textContent, "A note from Mr. Neft");
    assert.equal(card.querySelector(".welcome-text").textContent, goodNote.en);
    const video = card.querySelector("video");
    assert.equal(video.hasAttribute("controls") && video.hasAttribute("playsinline"), true);
    assert.equal(video.getAttribute("preload"), "none");
    assert.deepEqual([...video.querySelectorAll('track[kind="captions"]')].map((t) => [t.getAttribute("srclang"), t.hasAttribute("default")]), [["en", true], ["es", false]]);
    d.querySelector('#language-switch [data-lang="es"]').click();
    const spanish = d.querySelector("#family-week .welcome-note");
    assert.equal(spanish.querySelector("h3").textContent, "Una nota del Sr. Neft");
    assert.equal(spanish.querySelector(".welcome-text").textContent, goodNote.es);
    assert.deepEqual([...spanish.querySelectorAll("track")].map((t) => [t.getAttribute("srclang"), t.hasAttribute("default")]), [["es", true], ["en", false]]);
    assert.equal(shown.requested.filter((url) => url.includes("family-welcome")).length, 1, "one request, through the shared cache");
  } finally { shown.close(); }
  const absent = [
    ["no file served", undefined],
    ["enabled false", { enabled: false, weeks: { [monday]: goodNote } }],
    ["a different week", { enabled: true, weeks: { [hub.addDays(monday, 14)]: goodNote } }],
    ["a one-language note", welcomeFile({ en: goodNote.en })],
    ["malformed JSON shape", [1, 2]],
  ];
  for (const [name, welcome] of absent) {
    const view = await boot("family", plan(monday), "", { welcome });
    try {
      assert.equal(view.document.querySelector(".welcome-note"), null, name);
      assert.ok(view.document.querySelector(".homework-card"), `${name}: the week itself still renders`);
    } finally { view.close(); }
  }
});

test("a video without BOTH caption tracks is never shown; its text still is", async () => {
  for (const captions of [{ en: goodVideo.captions.en }, { es: goodVideo.captions.es }, {}]) {
    const view = await boot("family", plan(monday), "", { welcome: welcomeFile({ ...goodNote, video: { ...goodVideo, captions } }) });
    try {
      assert.equal(view.document.querySelector(".welcome-note .welcome-text").textContent, goodNote.en);
      assert.equal(view.document.querySelector("video"), null);
    } finally { view.close(); }
  }
});

test("when nothing is posted the family gets a Tonight anyway panel, not a dead end", async () => {
  const lastWeek = plan(hub.addDays(monday, -14));
  const past = await boot("family", lastWeek, "", { weeks: [lastWeek] });
  try {
    const { document: d, window: w } = past;
    assert.match(d.querySelector("#family-week h2").textContent, /Waiting for this week/);
    const panel = d.querySelector(".tonight-anyway");
    assert.equal(panel.querySelector("h3").textContent, "Tonight anyway");
    assert.match(panel.textContent, /No homework is posted yet\. Everything here is optional\./);
    const tiles = [...panel.querySelectorAll("a.tonight-tile")];
    assert.deepEqual(tiles.map((a) => a.getAttribute("href")), [
      "/math/practice-studio/boost/",
      "/curriculum/units/",
      `?section=all-families&week=${hub.addDays(monday, -14)}`,
    ]);
    assert.match(tiles[0].textContent, /5-minute Daily Boost/);
    assert.match(tiles[2].textContent, /Catch up on last week/);
    assert.match(d.querySelector(".message-panel").textContent, /ClassDojo/, "the contact block stays");
    assert.equal(d.querySelector(".homework-card"), null);
    d.querySelector('#language-switch [data-lang="es"]').click();
    assert.match(d.querySelector(".tonight-anyway").textContent, /Todavía no hay tarea publicada\. Todo lo que ves aquí es opcional\./);
    assert.equal(d.querySelector(".catch-up-link").getAttribute("href"), `?section=all-families&week=${hub.addDays(monday, -14)}&lang=es`);
    assert.equal(past.requested.filter((url) => !/manifest|published|family-welcome/.test(url)).length, 0, "the panel makes no network calls of its own");
  } finally { past.close(); }
  const nothing = await boot("family", model.createDefaultSnapshot(), "", { weeks: [] });
  try {
    const tiles = [...nothing.document.querySelectorAll("a.tonight-tile")];
    assert.deepEqual(tiles.map((a) => a.getAttribute("href")), ["/math/practice-studio/boost/", "/curriculum/units/"], "no earlier plan, no catch-up tile");
    assert.match(nothing.document.querySelector(".message-panel").textContent, /ClassDojo/);
  } finally { nothing.close(); }
});

test("the teacher editor still works with the new hub header and keeps its own wording", async () => {
  const view = await boot("teacher", plan(monday));
  try {
    const { document: d } = view;
    assert.equal(d.getElementById("hub-title").textContent, "Family homework");
    assert.equal(d.getElementById("class-label").textContent, "Class");
    assert.ok(d.getElementById("language-toggle"), "the editor keeps its single toggle");
    d.getElementById("language-toggle").click();
    assert.equal(d.getElementById("hub-title").textContent, "Tareas para la familia");
    assert.equal(view.window.localStorage.getItem("hw_lang_mode"), "es");
  } finally { view.close(); }
});
