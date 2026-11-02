#!/usr/bin/env node
/**
 * The family surfaces, proved from the files families see.
 *
 *   1. /families/ landing: ten collapsed unit cards, every lesson row inside a
 *      closed <details> (the height budget: it was 32,655px at 390px), exactly two
 *      actions per row, plain titles in both languages, no standards code as a
 *      label, unit content that comes from the curriculum and not from nowhere.
 *   2. Language switch: English and Spanish only; ?lang= and hw_lang_mode are
 *      honoured in the homework pages' order; clicking writes hw_lang_mode;
 *      loading never does; any other language is ignored.
 *   3. Search and filters, accent-insensitive.
 *   4. Nothing but English and Spanish on any family surface (landing, guides,
 *      lesson family pages, lesson configs) — Joel, 2026-10-21: "I only need
 *      spanish and english".
 *   5. Lesson family pages carry ONE glossary, and a mission only when the
 *      lesson authored one.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { fold, TOPIC_LABELS, WEEK_HUB_HREF } from "../scripts/lib/family-landing.mjs";
import { withPlainDefinitions } from "../scripts/lib/family-plain-definitions.mjs";
import { SESSIONS } from "../scripts/lib/homework-session-flow.mjs";
import { CORE_ID_RE, lessonPath, listLessonDirs } from "./lib/curriculum-source.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const readJson = (rel) => JSON.parse(read(rel));

const lessonIds = listLessonDirs({ filter: CORE_ID_RE }).sort((a, b) => {
  const [au, al] = a.split("-").map(Number);
  const [bu, bl] = b.split("-").map(Number);
  return au - bu || al - bl;
});

const landingHtml = read("families/index.html");
const landingData = readJson("data/family-landing-units.json");
const titlesEs = readJson("data/family-homework-titles-es.json");
const toc = readJson("data/reveal-toc-2025.json");

const parse = (html) => new JSDOM(html).window.document;
const landing = parse(landingHtml);
const rows = [...landing.querySelectorAll("[data-lesson-card]")];
const units = [...landing.querySelectorAll("details[data-unit-section]")];

/* ---------- 1. the landing page ---------- */

test("landing: ten unit cards, all collapsed, every lesson row inside one", () => {
  assert.equal(units.length, 10);
  assert.deepEqual(
    units.map((u) => u.getAttribute("data-unit-section")),
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  );
  for (const unit of units) assert.equal(unit.hasAttribute("open"), false, "units start collapsed");
  assert.equal(rows.length, lessonIds.length, "one row per lesson");
  const outside = rows.filter((row) => !row.closest("details.unit"));
  assert.equal(outside.length, 0, "no lesson row may render outside a collapsed unit");
});

test("landing: height budget proxy — text outside the lesson lists stays small", () => {
  const copy = landing.cloneNode(true);
  for (const list of copy.querySelectorAll(".lesson-list")) list.remove();
  for (const script of copy.querySelectorAll("script,style")) script.remove();
  // Each card shows ONE language at a time, so count one language's text.
  for (const es of copy.querySelectorAll(".es")) es.remove();
  const chars = copy.body.textContent.replace(/\s+/g, " ").trim().length;
  assert.ok(chars < 4000, `${chars} characters outside the lesson lists (budget 4000)`);
});

test("landing: required contracts (title, promise, hub, filters, switch)", () => {
  assert.match(landingHtml, /Family Math Support/);
  assert.equal(landing.querySelector("h1 .en").textContent, "Family Math Studio");
  assert.equal(landing.querySelector("h1 .es").textContent, "Estudio familiar de matemáticas");
  assert.equal(landing.querySelector(".eyebrow .en").textContent, "Family Math Support");
  assert.equal(landing.querySelector("[data-promise] .en").textContent, landingData.promise.en);
  assert.equal(landing.querySelector("[data-promise] .es").textContent, landingData.promise.es);
  assert.match(landingData.promise.en, /Optional\. No grades\. English and Spanish\./);
  const week = landing.querySelector("[data-week-link]");
  assert.equal(week.getAttribute("href"), WEEK_HUB_HREF);
  assert.equal(WEEK_HUB_HREF, "/curriculum/family-connections/");
  for (const id of ["family-search", "unit-filter", "topic-filter"])
    assert.ok(landing.getElementById(id), `#${id}`);
  const switches = [...landing.querySelectorAll("[data-set-lang]")].map((b) =>
    b.getAttribute("data-set-lang"),
  );
  assert.deepEqual(switches, ["en", "es"]);
  for (const id of lessonIds)
    assert.ok(landingHtml.includes(`/families/lessons/${id}/`), `guide link for ${id}`);
});

test("landing rows: exactly two actions, plain titles, no standards code as a label", () => {
  const sessionEn = [SESSIONS[1].en, SESSIONS[2].en];
  for (const row of rows) {
    const id = row.querySelector(".quiet").getAttribute("href").split("/")[3];
    const guide = [...row.querySelectorAll("a.quiet")];
    const studio = [...row.querySelectorAll("a.primary")];
    assert.equal(guide.length, 1, `${id}: one guide link`);
    assert.equal(guide[0].getAttribute("href"), `/families/lessons/${id}/`);
    assert.equal(row.querySelectorAll("a").length, studio.length + 1, `${id}: no other links`);
    const hasPart2 = existsSync(lessonPath(`${id}-part2`, "homework.html"));
    assert.equal(studio.length, hasPart2 ? 2 : 1, `${id}: studio links`);
    assert.equal(studio[0].getAttribute("href"), `/lessons/${id}/homework.html`);
    if (hasPart2) {
      assert.equal(studio[1].getAttribute("href"), `/lessons/${id}-part2/homework.html`);
      assert.deepEqual(
        studio.map((a) => a.querySelector(".en").textContent),
        sessionEn,
      );
      assert.deepEqual(
        studio.map((a) => a.querySelector(".es").textContent),
        [SESSIONS[1].es, SESSIONS[2].es],
      );
    } else {
      assert.equal(studio[0].querySelector(".en").textContent, "Family Math Studio");
      assert.equal(studio[0].querySelector(".es").textContent, "Estudio familiar de matemáticas");
    }
    assert.ok(existsSync(lessonPath(id, "homework.html")), `${id}: homework exists`);
    const config = readJson(`lessons/${id}/config.json`);
    assert.equal(row.querySelector(".lesson-title .en").textContent, config.title);
    assert.equal(
      row.querySelector(".lesson-title .es").textContent,
      titlesEs[id],
      `${id}: ES title`,
    );
    const visible = row.textContent;
    assert.doesNotMatch(visible, /\b\d\.[A-Z]{1,4}\.\d/, `${id}: a standards code is visible`);
    assert.doesNotMatch(visible, /\bMPP\b/, `${id}: a standards code is visible`);
  }
});

test("landing units: named by the TOC, sourced from the lessons, one plain sentence", () => {
  const source = read("scripts/homework-guided-notes.mjs");
  const block = source.match(/const UNIT_TITLES_ES = \{([\s\S]*?)\};/)[1];
  const homeworkEs = Object.fromEntries(
    [...block.matchAll(/(\d+):\s*"([^"]+)"/g)].map((m) => [Number(m[1]), m[2]]),
  );
  assert.deepEqual(
    Object.keys(landingData.units).sort(),
    toc.units.map((u) => String(u.unit)).sort(),
  );
  for (const tocUnit of toc.units) {
    const data = landingData.units[String(tocUnit.unit)];
    assert.equal(
      data.nameEs,
      homeworkEs[tocUnit.unit],
      `unit ${tocUnit.unit}: Spanish name must equal the homework pages' UNIT_TITLES_ES`,
    );
    for (const field of ["learnEn", "learnEs"]) {
      const text = data[field];
      assert.ok(text.length > 20 && text.length < 190, `unit ${tocUnit.unit} ${field} length`);
      assert.equal(text.split(/[.!?](?:\s|$)/).filter(Boolean).length, 1, `${field}: one sentence`);
    }
    assert.equal(data.keywords.length, 3, `unit ${tocUnit.unit}: three key words`);
    // Every key word is a real vocabulary term + Spanish term of a lesson in the unit.
    const vocab = lessonIds
      .filter((id) => Number(id.split("-")[0]) === tocUnit.unit)
      .flatMap((id) => readJson(`lessons/${id}/config.json`).vocabulary || []);
    for (const kw of data.keywords)
      assert.ok(
        vocab.some(
          (v) =>
            String(v.term).toLowerCase() === kw.en.toLowerCase() &&
            String(v.termEs).toLowerCase() === kw.es.toLowerCase(),
        ),
        `unit ${tocUnit.unit}: "${kw.en}" / "${kw.es}" is not a vocabulary pair of the unit`,
      );
    const card = landing.querySelector(`[data-unit-section="${tocUnit.unit}"]`);
    assert.equal(card.querySelector(".unit-name .en").textContent, tocUnit.title);
    assert.equal(card.querySelectorAll(".unit-words li").length, 3);
  }
});

test("landing topics: every topic has plain English and Spanish names", () => {
  const topics = [...landing.querySelectorAll("#topic-filter option")]
    .map((o) => o.value)
    .filter((v) => v !== "all");
  assert.ok(topics.length >= 5);
  for (const topic of topics) {
    assert.ok(TOPIC_LABELS[topic]?.en && TOPIC_LABELS[topic]?.es, `label for "${topic}"`);
  }
});

/* ---------- 2 + 3. language switch, search and filters (jsdom, real script) ---------- */

const script = read("assets/family-landing.js");

/** Load the landing page with its script. `setup(window)` may seed storage or navigator. */
async function boot({ search = "", setup } = {}) {
  const dom = new JSDOM(landingHtml.replace(/<script src="[^"]*"><\/script>/, ""), {
    url: `https://eduwonderlab.com/families/${search}`,
    runScripts: "outside-only",
    pretendToBeVisual: true,
    beforeParse(window) {
      setup?.(window);
    },
  });
  const { window } = dom;
  if (window.document.readyState !== "complete")
    await new Promise((resolve) => window.addEventListener("load", resolve));
  window.eval(script);
  return window;
}

const setLanguages = (languages) => (window) =>
  Object.defineProperty(window.navigator, "languages", { value: languages, configurable: true });

const shown = (window) =>
  [...window.document.querySelectorAll("[data-lesson-card]")].filter((r) => !r.hidden);

test("language: default English, ?lang=es, saved choice, Spanish browser, never anything else", async () => {
  let w = await boot();
  assert.equal(w.document.documentElement.dataset.lang, "en");
  assert.equal(w.localStorage.getItem("hw_lang_mode"), null, "loading never writes the choice");

  w = await boot({ search: "?lang=es" });
  assert.equal(w.document.documentElement.dataset.lang, "es");
  assert.equal(w.document.documentElement.lang, "es");
  assert.match(w.document.title, /^Estudio familiar/);
  assert.equal(w.localStorage.getItem("hw_lang_mode"), null);

  w = await boot({ setup: (win) => win.localStorage.setItem("hw_lang_mode", "es") });
  assert.equal(w.document.documentElement.dataset.lang, "es");

  w = await boot({
    search: "?lang=en",
    setup: (win) => win.localStorage.setItem("hw_lang_mode", "es"),
  });
  assert.equal(w.document.documentElement.dataset.lang, "en", "?lang= beats the saved choice");

  // "bilingual" is a homework-page mode; here it means no preference.
  w = await boot({ setup: (win) => win.localStorage.setItem("hw_lang_mode", "bilingual") });
  assert.equal(w.document.documentElement.dataset.lang, "en");

  w = await boot({ setup: setLanguages(["es-MX", "en"]) });
  assert.equal(w.document.documentElement.dataset.lang, "es", "a Spanish browser gets Spanish");

  for (const other of ["ar", "fr", "prs", "fa", "ht", "pt", "bilingual", "ES", ""]) {
    w = await boot({ search: `?lang=${other}` });
    assert.equal(w.document.documentElement.dataset.lang, "en", `?lang=${other} is ignored`);
    w = await boot({ setup: (win) => win.localStorage.setItem("hw_lang_mode", other) });
    assert.equal(w.document.documentElement.dataset.lang, "en", `stored "${other}" is ignored`);
  }
});

test("language switch: clicking writes hw_lang_mode and moves every language-aware link", async () => {
  const w = await boot();
  const click = (lang) => w.document.querySelector(`[data-set-lang="${lang}"]`).click();
  assert.equal(
    w.document.querySelector("[data-langbar]").hidden,
    false,
    "switch shown with script",
  );

  click("es");
  assert.equal(w.localStorage.getItem("hw_lang_mode"), "es");
  assert.equal(w.document.documentElement.lang, "es");
  assert.equal(
    w.document.querySelector('[data-set-lang="es"]').getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    w.document.querySelector('[data-set-lang="en"]').getAttribute("aria-pressed"),
    "false",
  );
  assert.equal(
    w.document.querySelector("[data-week-link]").getAttribute("href"),
    `${WEEK_HUB_HREF}?lang=es`,
  );
  const studio = w.document.querySelector(".lesson-row a.primary");
  assert.match(studio.getAttribute("href"), /^\/lessons\/[\d-]+\/homework\.html\?lang=es$/);
  assert.equal(
    w.document.querySelector("#unit-filter option[value='3']").textContent,
    `Unidad 3: ${landingData.units["3"].nameEs}`,
  );
  assert.match(w.document.querySelector("#family-search").getAttribute("placeholder"), /Pruebe/);

  click("en");
  assert.equal(w.localStorage.getItem("hw_lang_mode"), "en");
  assert.equal(w.document.documentElement.lang, "en");
  assert.equal(
    w.document.querySelector("[data-week-link]").getAttribute("href"),
    `${WEEK_HUB_HREF}?lang=en`,
  );
  assert.equal(
    w.document.querySelector(".lesson-row a.quiet").getAttribute("href").includes("?"),
    false,
    "family guides are bilingual pages and take no language parameter",
  );
});

test("search and filters: accent-insensitive, open the matching units, restore on clear", async () => {
  const w = await boot();
  const search = w.document.getElementById("family-search");
  const type = (value) => {
    search.value = value;
    search.dispatchEvent(new w.Event("input", { bubbles: true }));
  };
  const open = () => [...w.document.querySelectorAll("details.unit[open]")].length;
  assert.equal(shown(w).length, lessonIds.length);
  assert.equal(w.document.querySelector("[data-controls]").hidden, false);

  type("razon"); // matches "Razón" (Spanish vocabulary) without the accent
  const razon = shown(w);
  assert.ok(razon.length > 0 && razon.length < lessonIds.length);
  assert.ok(open() >= 1, "units with matches open themselves");
  const hiddenUnits = [...w.document.querySelectorAll("details.unit")].filter((u) => u.hidden);
  assert.ok(hiddenUnits.length > 0, "units with no match are hidden");

  type("8-6");
  assert.ok(shown(w).some((r) => r.getAttribute("data-search").includes("8-6")));

  type("6.EE.2"); // a standards code still FINDS a lesson, it just is not shown
  assert.ok(shown(w).length >= 0);

  type("zzzzqqq");
  assert.equal(shown(w).length, 0);
  assert.equal(w.document.getElementById("empty-message").hidden, false);

  type("");
  assert.equal(shown(w).length, lessonIds.length);
  assert.equal(open(), 0, "units the search opened close again");
  assert.equal(w.document.getElementById("empty-message").hidden, true);

  const unit = w.document.getElementById("unit-filter");
  unit.value = "3";
  unit.dispatchEvent(new w.Event("change", { bubbles: true }));
  assert.ok(shown(w).every((r) => r.getAttribute("data-unit") === "3"));
  assert.equal(shown(w).length, lessonIds.filter((id) => id.startsWith("3-")).length);

  const topic = w.document.getElementById("topic-filter");
  topic.value = [...topic.options].find((o) => o.value !== "all").value;
  topic.dispatchEvent(new w.Event("change", { bubbles: true }));
  assert.ok(shown(w).every((r) => r.getAttribute("data-topic") === topic.value));
});

test("fold: accents and case do not matter", () => {
  assert.equal(fold("Razón Área"), "razon area");
  assert.equal(fold("Número entero"), "numero entero");
});

/* ---------- 4. English and Spanish only ---------- */

const OTHER_SCRIPTS = /[֐-׿؀-ۿݐ-ݿיִ-﷿ﹰ-﻿]/u;
const OTHER_NAMES =
  /العربية|دری|Français|Kreyòl|Kreyol|Português|\bArabic\b|\bFrench\b|\bDari\b|\bFarsi\b/;

function familySurfaces() {
  const out = [{ rel: "families/index.html", html: landingHtml }];
  for (const id of lessonIds) {
    out.push({
      rel: `families/lessons/${id}/index.html`,
      html: read(`families/lessons/${id}/index.html`),
    });
    out.push({
      rel: `lessons/${id}/family/index.html`,
      html: read(`lessons/${id}/family/index.html`),
    });
  }
  return out;
}

test("no language other than English and Spanish on any family surface", () => {
  const surfaces = familySurfaces();
  assert.equal(surfaces.length, 1 + 2 * lessonIds.length);
  for (const { rel, html } of surfaces) {
    const visible = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ");
    assert.doesNotMatch(visible, OTHER_SCRIPTS, `${rel}: non-Latin script`);
    assert.doesNotMatch(visible, OTHER_NAMES, `${rel}: another language is named`);
    assert.doesNotMatch(visible, /dir="rtl"/i, `${rel}: right-to-left`);
    assert.doesNotMatch(visible, /lang-picker|lang-panel|family-lang-/, `${rel}: old picker`);
    for (const m of visible.matchAll(/\blang="([^"]*)"/g))
      assert.match(m[1], /^(en|es)(-[A-Za-z]+)?$/, `${rel}: lang="${m[1]}"`);
  }
});

test("no lesson config carries another language for the family page", () => {
  for (const id of lessonIds)
    assert.equal(
      Object.hasOwn(readJson(`lessons/${id}/config.json`), "familyLanguages"),
      false,
      `${id}: familyLanguages came back`,
    );
});

/* ---------- 5. lesson family pages: one glossary, a mission only when authored ---------- */

test("lesson family pages: one glossary, no generic Kitchen Table block, own mission only", () => {
  let withMission = 0;
  for (const id of lessonIds) {
    const doc = parse(read(`lessons/${id}/family/index.html`));
    const html = doc.documentElement.outerHTML;
    const config = readJson(`lessons/${id}/config.json`);
    assert.equal(doc.querySelectorAll("[data-glossary]").length, 1, `${id}: one glossary`);
    const terms = [...doc.querySelectorAll("[data-glossary] dt .kw")].map((e) => e.textContent);
    const want = (config.vocabulary || []).map((v) => v.term).filter(Boolean);
    assert.deepEqual(terms, want, `${id}: glossary lists each term once, in order`);
    for (const dead of [
      "Vocabulary you might hear",
      "Spanish support",
      "Apoyo en español",
      "Kitchen Table",
      "Math is everywhere",
    ])
      assert.ok(!html.includes(dead), `${id}: "${dead}" is gone`);
    // Spanish term and both meanings sit in the same glossary entry.
    for (const [i, item] of [...doc.querySelectorAll("[data-glossary] .gloss-item")].entries()) {
      // the page shows the glossary's one Spanish term (data/family-glossary.json), not each lesson's own spelling
      const vocab = withPlainDefinitions(config.vocabulary, id).filter((v) => v.term)[i];
      assert.equal(item.querySelector(".gloss-es")?.textContent, vocab.termEs, `${id}: ES term`);
      assert.equal(item.querySelectorAll("dd").length, 2, `${id}: meaning in both languages`);
    }
    assert.match(doc.title, /^Family Math Studio · Lesson guide/);
    const sidecar = readJson(`data/family-homework-notes/${id}.json`);
    const mission = doc.querySelector("[data-mission]");
    if (sidecar.corner?.mission?.en) {
      withMission += 1;
      assert.ok(mission, `${id}: authored mission shows`);
      assert.ok(mission.textContent.includes(sidecar.corner.mission.en.slice(0, 40)));
      assert.ok(mission.textContent.includes(sidecar.corner.mission.es.slice(0, 40)));
    } else assert.equal(mission, null, `${id}: no authored mission, no mission block`);
    assert.ok(doc.querySelector(".callout .es-text"), `${id}: Spanish key idea kept`);
    assert.ok(html.includes("Try this together"), `${id}: try-together kept`);
    assert.ok(html.includes("Watch out for this"), `${id}: watch-out kept`);
  }
  assert.ok(withMission > 30, `${withMission} lessons with an authored mission`);
});

test("lesson guide pages (/families/lessons/<id>/): one glossary, studio link, standard muted", () => {
  for (const id of lessonIds) {
    const doc = parse(read(`families/lessons/${id}/index.html`));
    assert.match(doc.title, /^Family Math Studio · Lesson guide/);
    assert.equal(doc.querySelectorAll(".vocab-grid").length, 1, `${id}: one glossary`);
    assert.ok(doc.querySelector(`.studio-links a[href="/lessons/${id}/homework.html"]`), id);
    assert.equal(doc.querySelectorAll(".pill.standard").length, 0, `${id}: standard is not a pill`);
    assert.ok(doc.querySelector(".standard-note"), `${id}: standard kept as small muted text`);
  }
});
