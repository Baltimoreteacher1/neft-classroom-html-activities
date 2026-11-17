// The K–1 Teacher Tour (/start/tour-k1): its own tour for Kindergarten and Grade 1. Every activity it names is a
// real K or Grade 1 row in content/index.json (id, title, domain, level) or a real early page, every route resolves
// to a lab route in its own grade, every string is English and Spanish, no Grades 3–8 activity appears, the pages
// render in jsdom (English, Spanish, both grades) with one h1 and no duplicate ids, the quick-reference PDF is a real
// PDF with working links, and the Grades 3–8 Teacher Tour 2.0 keeps its bands and steps.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body><main id=app></main></body></html>", {
  url: "https://thelanguagepage.com/access-practice-lab/start/tour-k1",
});
for (const k of ["window", "document", "location", "localStorage", "sessionStorage", "history", "navigator", "HTMLElement", "Node", "CSS", "MutationObserver"])
  Object.defineProperty(globalThis, k, { value: dom.window[k], configurable: true, writable: true });

const ROOT = new URL("../", import.meta.url);
const LAB = "../access-practice-lab/src";
const index = JSON.parse(readFileSync(new URL("access-practice-lab/content/index.json", ROOT), "utf8"));
const D = await import(`${LAB}/intro/tour-k1-data.js`);
const view = await import(`${LAB}/intro/tour-k1.js`);
const start = await import(`${LAB}/intro/start.js`);
const { k1QuickrefPdf, quickrefRows } = await import(`${LAB}/intro/tour-k1-quickref.js`);
const { PAGES } = await import(`${LAB}/early/pages.js`);
const { extrasFor } = await import(`${LAB}/views/early-hub.js`);
const { normalizeBand } = await import(`${LAB}/bands.js`);
const model = await import(`${LAB}/intro/tour/model.js`);
const { toHtml } = await import(`${LAB}/util.js`);
const { RETURNS } = await import(`${LAB}/intro/return-bar.js`);
const { parseRoute } = await import(`${LAB}/main.js`).catch(() => ({}));

const rowOf = (a) =>
  index.bands[a.band]?.domains?.[a.domain]?.levels?.[a.level]?.activities?.find((r) => r[0] === a.id) || null;
const all = Object.entries(D.K1_ACTIVITIES);

test("every activity the K–1 tour names is a real K or Grade 1 activity in content/index.json", () => {
  const acts = all.filter(([, a]) => a.kind === "activity");
  assert.ok(acts.length >= 12, "the tour names real activities");
  for (const [key, a] of acts) {
    assert.ok(["K", "1"].includes(a.band), key);
    const row = rowOf(a);
    assert.ok(row, `${key}: ${a.band}/${a.domain}/${a.level}/${a.id} is not in content/index.json`);
    assert.equal(row[1], a.title, `${key}: title`);
    assert.match(a.id, a.band === "K" ? /^gk-/ : /^g1-/, `${key}: id prefix matches the band`);
  }
});

test("every early page the tour names exists for its grade", () => {
  for (const [key, a] of all.filter(([, x]) => x.kind === "page")) {
    if (a.id === "home") {
      assert.ok(a.route.startsWith("/early?"), key);
      continue;
    }
    const extras = extrasFor(a.band);
    const extra = extras.find((x) => x.id === a.id);
    assert.ok(extra, `${key}: ${a.id} is listed on the ${a.band} practice home`);
    assert.ok(a.id === "phonics-path" || PAGES[a.id], `${key}: page module exists`);
    assert.equal(a.title.en, extra.title, `${key}: English title is the home's own`);
    assert.equal(a.title.es, extra.es, `${key}: Spanish title is the home's own`);
    assert.equal(new URL(a.route, "https://x.test").pathname, `/${extra.href || `early/${extra.id}`}`, key);
  }
});

test("every route opens in its own grade and resolves to a lab route", () => {
  for (const [key, a] of all) {
    const u = new URL(a.route, "https://x.test");
    assert.equal(u.searchParams.get("grades"), a.band, key);
    assert.ok(normalizeBand(u.searchParams.get("grades")), key);
    if (parseRoute) {
      const r = parseRoute(`/access-practice-lab${u.pathname}`, u.search);
      assert.notEqual(r.view, "home", `${key}: ${a.route} must not fall back to home`);
      if (a.kind === "activity") assert.equal(r.view, "activity", key);
    } else {
      assert.match(u.pathname, a.kind === "activity" ? /^\/(Listening|Speaking|Reading|Writing)\/[ABC]\/[\w-]+$/ : /^\/(early(\/\w+)?|science-of-reading\/path)$/, key);
    }
  }
  if (parseRoute) {
    const r = parseRoute("/access-practice-lab/start/tour-k1", "?grades=1&stop=3");
    assert.deepEqual([r.view, r.id, r.stop, r.grades], ["start", "tour-k1", "3", "1"]);
  }
});

test("every step names a real activity for both grades, and no Grades 3–8 activity appears", () => {
  assert.equal(new Set(D.K1_STEP_IDS).size, D.K1_STEPS.length);
  for (const s of D.K1_STEPS)
    for (const pick of D.K1_PICKS) {
      const main = D.stepTry(s, pick);
      assert.ok(main, `${s.id}/${pick}: try`);
      for (const a of [main, ...D.stepMore(s, pick)]) {
        assert.ok(a, `${s.id}/${pick}: more`);
        assert.equal(a.band, pick, `${s.id}/${pick}: ${a.id} is for this grade`);
      }
      for (const id of s.links || []) assert.ok(D.K1_LINKS[id], `${s.id}: link ${id}`);
    }
  const ids38 = new Set(
    ["2-3", "3-5", "6-8"].flatMap((b) =>
      Object.values(index.bands[b]?.domains || {}).flatMap((d) =>
        Object.values(d.levels || {}).flatMap((l) => (l.activities || []).map((r) => r[0])),
      ),
    ),
  );
  for (const [key, a] of all) assert.ok(!ids38.has(a.id), `${key}: ${a.id} belongs to an older band`);
});

test("every string a person reads is English and Spanish", () => {
  const pairs = [];
  const walk = (v, path) => {
    if (!v || typeof v !== "object") return;
    if ("en" in v && "es" in v && Object.keys(v).length === 2) return pairs.push([path, v]);
    for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
  };
  walk({ steps: D.K1_STEPS, copy: D.K1_COPY, links: D.K1_LINKS, picks: D.pickNames, acts: D.K1_ACTIVITIES }, "k1");
  assert.ok(pairs.length > 80, `found ${pairs.length} strings`);
  for (const [path, v] of pairs) {
    assert.ok(String(v.en).trim().length > 1, `${path}: English`);
    assert.ok(String(v.es).trim().length > 1, `${path}: Spanish`);
    assert.notEqual(v.en, v.es, `${path}: Spanish is not the English copied`);
    assert.doesNotMatch(v.es, /\b(usted|vosotros|tú)\b/i, `${path}: adults are "ustedes"`);
  }
  for (const s of D.K1_STEPS)
    for (const k of ["name", "title", "what", "neft"]) assert.ok(s[k]?.en && s[k]?.es, `${s.id}.${k}`);
  assert.ok(RETURNS.tourk1?.en && RETURNS.tourk1?.es && RETURNS.tourk1.to === D.K1_ROUTE);
});

test("no step claims a score, level, timer or AI", () => {
  const text = JSON.stringify(D.K1_STEPS);
  assert.doesNotMatch(text, /\byou (will )?(get|earn) (a )?(score|points)\b|\bstreak|\btimer\b|countdown|\bAI\b/i);
});

test("saved state and the grade choice", () => {
  assert.equal(D.k1PickFrom("k", "1"), "K");
  assert.equal(D.k1PickFrom("", "1"), "1");
  assert.equal(D.k1PickFrom("6-8", "nope"), "K");
  assert.deepEqual(D.normalizeK1({ step: 99, pick: "6-8" }), { v: 1, pick: "K", step: 0, furthest: 0, done: false });
  assert.deepEqual(D.normalizeK1({ step: 3, furthest: 5, pick: "1" }), { v: 1, pick: "1", step: 3, furthest: 5, done: false });
  assert.equal(D.k1Status({}).state, "start");
  assert.equal(D.k1Status({ tourK1: { step: 2, furthest: 2 } }).state, "continue");
});

const render = async (url, lang = "en") => {
  localStorage.clear();
  const u = new URL(url, "https://thelanguagepage.com");
  dom.reconfigure({ url: u.href });
  const route = parseRoute ? parseRoute(u.pathname, u.search) : { view: "start", id: u.pathname.split("/").pop(), grades: u.searchParams.get("grades") || "", stop: u.searchParams.get("stop") || "", skill: u.searchParams.get("skill") || "" };
  const ctx = { route, prefs: { lang }, band: "K", bands: [], rerender() {}, navigate() {} };
  const out = await start.render(ctx);
  const d = new JSDOM(`<main>${toHtml(out.html)}</main>`).window.document;
  return { d, title: out.title };
};

test("the tour renders for both grades in English and Spanish with one h1, no duplicate ids and real links", async () => {
  for (const pick of D.K1_PICKS)
    for (const lang of ["en", "es"])
      for (let n = 1; n <= D.K1_STEPS.length; n++) {
        const { d, title } = await render(`/access-practice-lab/start/tour-k1?grades=${pick}&stop=${n}`, lang);
        const where = `${pick}/${lang}/step ${n}`;
        assert.match(title, lang === "es" ? /Recorrido/ : /K–1 Teacher Tour/, where);
        assert.equal(d.querySelectorAll("h1").length, 1, where);
        const ids = [...d.querySelectorAll("[id]")].map((e) => e.id);
        assert.equal(new Set(ids).size, ids.length, `${where}: duplicate ids`);
        assert.equal(d.querySelector("[data-k1t-root]").dataset.k1tStep, D.K1_STEPS[n - 1].id, where);
        assert.equal(d.querySelector('[data-k1t-pick][aria-pressed="true"]').dataset.k1tPick, pick, where);
        const step = D.K1_STEPS[n - 1];
        assert.ok(d.querySelector(`[data-k1t-try="${step.try[pick]}"]`), `${where}: Try it`);
        for (const a of d.querySelectorAll(".k1t-act a[href]")) {
          const href = a.getAttribute("href");
          assert.match(href, /intro=tourk1/, `${where}: activity link offers a way back`);
          assert.doesNotMatch(href, /\/(Listening|Speaking|Reading|Writing)\/[ABC]\/(?!gk-|g1-)/, `${where}: ${href}`);
        }
        const say = d.querySelector(".k1t-coach .nb-say").textContent.trim();
        assert.equal(say, lang === "es" ? step.neft.es : step.neft.en, `${where}: Mr. Neft's scripted line`);
        assert.equal(d.querySelector("[data-pg]"), null, `${where}: no AI question box`);
      }
});

test("Start-page links for Kindergarten and Grade 1 open the K–1 tour; Grades 3–8 links are unchanged", async () => {
  const k = await render("/access-practice-lab/start/tour?part=2&skill=speaking&grades=K");
  assert.equal(k.d.querySelector("[data-k1t-root]").dataset.k1tStep, "talk");
  const one = await render("/access-practice-lab/start/tour?grades=1");
  assert.equal(one.d.querySelector("[data-k1t-root]").dataset.k1tGrade, "1");
  const hub = await render("/access-practice-lab/start?grades=K");
  assert.match(hub.d.querySelector(".in-choice.is-tour").getAttribute("href"), /\/start\/tour-k1\?grades=K$/);
  assert.match(hub.d.querySelector(".in-choice.is-tour").textContent, /K–1 Teacher Tour/);
  const older = await render("/access-practice-lab/start?grades=6-8");
  assert.match(older.d.querySelector(".in-choice.is-tour").getAttribute("href"), /\/start\/tour\?grades=6-8$/);
  assert.match(older.d.querySelector(".k1t-start-link a").getAttribute("href"), /\/start\/tour-k1$/);
});

test("the quick reference is a real PDF in English and Spanish with clickable activity links", () => {
  for (const pick of D.K1_PICKS)
    for (const lang of ["en", "es"]) {
      const bytes = k1QuickrefPdf(pick, lang);
      const text = Buffer.from(bytes).toString("latin1");
      assert.ok(text.startsWith("%PDF-1.4"), `${pick}/${lang}`);
      assert.ok(text.trimEnd().endsWith("%%EOF"));
      assert.ok(text.includes(`/URI (https://thelanguagepage.com/access-practice-lab/start/tour-k1?grades=${pick})`));
      const rows = quickrefRows(pick, lang);
      assert.equal(rows.length, D.K1_STEPS.length);
      for (const r of rows) for (const l of r.links) assert.ok(text.includes(`/URI (${l.url})`), l.url);
      assert.ok(!text.includes("?)"), `${pick}/${lang}: no character fell outside the PDF font`);
    }
});

test("the Grades 3–8 Teacher Tour keeps its bands and steps", () => {
  assert.deepEqual(model.BANDS.map((b) => b.id), ["3-5", "6-8"]);
  assert.deepEqual(model.STEP_IDS, ["welcome", "experience", "support", "implement", "prepare", "studio", "kit"]);
  assert.equal(model.TOUR_STEPS, 5);
  assert.equal(model.normalizeState({ v: 1, band: "K" }).band, "6-8", "the 3–8 tour never takes K or 1");
  for (const r of model.buildRegistry(index)) assert.ok(["3-5", "6-8"].includes(r.band));
});
