/**
 * The Learning Journey teacher mission guide (src/journey/ui/guide*.js, route /journey/guide) and its Teacher Hub panel
 * (access-teacher/journey-panel.js), driven under jsdom.
 *   - all 12 missions render for both bands, in English, Español and bilingual, each with six steps
 *   - filters (band, Key Language Use, domain, mission) narrow the list; the URL query round-trips
 *   - every direct student link resolves to a real mission + step route and carries assigned=1; assigning writes no storage
 *   - WIDA rows come from the framework catalog and the "locally developed, not official" limits statement is present
 *   - no score or level claim in any rendered text; no storage, network or roster access in the guide modules
 *   - the Spanish render leaves none of the guide's English strings behind; every Key Language Use move has a response
 *   - printable links point only at files tools/generate-access-printables.mjs writes
 *   - mount: filters redraw, Copy link works with and without the clipboard, Details loads the lazy pack
 *   - the Teacher Hub panel mounts the same missions and adds teacher packets
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";
import { BANDS as CONTENT_BANDS, loadBand, REPO_ROOT } from "./lib/access-lab-content.mjs";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";

const LAB = join(REPO_ROOT, "access-practice-lab");
const BASE_URL = "https://example.test/access-practice-lab/journey/guide";
const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  url: BASE_URL,
});
for (const k of ["window", "document", "location", "history", "FormData", "Event", "HTMLElement"])
  Object.defineProperty(globalThis, k, {
    value: dom.window[k],
    configurable: true,
    writable: true,
  });
let clipboard = { writeText: async () => {} };
Object.defineProperty(globalThis, "navigator", { get: () => ({ clipboard }), configurable: true });
const writes = [];
for (const k of ["setItem", "removeItem", "clear"]) {
  const orig = dom.window.Storage.prototype[k];
  dom.window.Storage.prototype[k] = function (...a) {
    writes.push([k, ...a]);
    return orig.apply(this, a);
  };
}

const lab = (p) => import(pathToFileURL(join(LAB, p)).href);
const { makeI18n } = await lab("src/i18n.js");
const { toHtml, BASE } = await lab("src/util.js");
const cur = await lab("src/journey/curriculum.js");
const { MISSION_IDS, MISSIONS, STEP_IDS, BANDS, loadMission } = cur;
const guide = await lab("src/journey/ui/guide.js");
const data = await lab("src/journey/ui/guide-data.js");
const mission = await lab("src/journey/ui/guide-mission.js");
const { WIDA_LIMITS } = await lab("src/journey/wida.js");
const { WIDA_LANGUAGE_EXPECTATIONS } = await lab("src/acc/wida/catalog.js");
const { MOVES } = await lab("src/lang/purpose.js");
const journeyView = await lab("src/views/journey.js");

const render = (mode, opts = {}) => toHtml(guide.guideHTML(makeI18n(mode, "en"), opts));
const parse = (markup) => new JSDOM(`<body>${markup}</body>`).window.document;
const all = (root, sel) => [...root.querySelectorAll(sel)];
const idsOf = (doc) => all(doc, "article[data-gd-mission]").map((a) => a.dataset.gdMission);
const MODES = await data.loadModes(loadMission);
const flush = () => new Promise((r) => setTimeout(r, 25));

test("all 12 missions render for both bands in every language mode, each with six steps", () => {
  for (const mode of ["en", "es", "bi"])
    for (const band of BANDS) {
      const doc = parse(render(mode, { band }));
      assert.deepEqual(idsOf(doc), MISSION_IDS, `${mode} ${band}`);
      for (const art of all(doc, "article[data-gd-mission]")) {
        assert.equal(art.querySelectorAll(".jg-step").length, STEP_IDS.length, art.id);
        assert.ok(art.querySelector("h3").textContent.trim(), `${art.id} title`);
        assert.ok(art.querySelector(".jg-goals"), `${art.id} goals for both bands`);
        assert.ok(art.querySelector(".jg-feat li"), `${art.id} features`);
        assert.ok(art.querySelector("[data-gd-details]"), `${art.id} details button`);
      }
      assert.equal(all(doc, ".jg-unit").length, 4);
    }
});

test("each mission names its Key Language Use, environment, features and review edges", () => {
  const doc = parse(render("en", { band: "6-8" }));
  for (const id of MISSION_IDS) {
    const m = MISSIONS[id];
    const art = doc.getElementById(id);
    assert.equal(art.dataset.klu, m.klu);
    assert.match(art.querySelector(".jg-eyebrow").textContent, new RegExp(m.klu));
    for (const f of m.features)
      assert.ok(art.textContent.includes(cur.FEATURES[f].label[0]), `${id} ${f}`);
    for (const r of m.reviews)
      assert.ok(art.querySelector(`a[href="#${r}"]`), `${id} reviews ${r}`);
    assert.ok(
      art.textContent.includes(m.goal["3-5"][0]) && art.textContent.includes(m.goal["6-8"][0]),
      `${id} goals`,
    );
  }
});

test("filters narrow the list: Key Language Use, mission, band, and domain from the loaded packs", () => {
  const klu = idsOf(parse(render("en", { band: "6-8", klu: "Explain" })));
  assert.deepEqual(klu, ["m07", "m08", "m09"]);
  assert.deepEqual(idsOf(parse(render("en", { band: "6-8", mission: "m05" }))), ["m05"]);
  assert.deepEqual(idsOf(parse(render("en", { band: "6-8", klu: "Argue", mission: "m02" }))), []);
  assert.match(
    parse(render("en", { band: "6-8", klu: "Argue", mission: "m02" })).body.textContent,
    /No mission matches/,
  );
  for (const band of BANDS) {
    const doc = parse(render("en", { band, mission: "m08" }));
    for (const a of all(doc, "a[href*='/journey/m08/']"))
      assert.match(a.getAttribute("href"), new RegExp(`grades=${band}&assigned=1`));
  }
  for (const domain of ["Speaking", "Writing"])
    for (const band of BANDS) {
      const got = idsOf(parse(render("en", { band, domain, modes: MODES })));
      assert.ok(got.length > 0, `${domain} ${band}`);
      for (const id of got) {
        const m = MODES[id][band];
        assert.ok(
          [m.communicate, m.show].some((k) => data.KIND_DOMAIN[k] === domain),
          `${id} ${domain} ${band}`,
        );
      }
    }
  for (const band of BANDS) {
    const s = new Set(idsOf(parse(render("en", { band, domain: "Speaking", modes: MODES }))));
    const w = new Set(idsOf(parse(render("en", { band, domain: "Writing", modes: MODES }))));
    for (const id of MISSION_IDS)
      assert.ok(s.has(id) || w.has(id), `${id} ${band} is Speaking or Writing`);
  }
  assert.equal(
    idsOf(parse(render("en", { band: "6-8", domain: "Listening" }))).length,
    12,
    "Listening is in every mission",
  );
  const q = data.parseFilters("?band=3-5&klu=Inform&domain=Reading&mission=m05&junk=1", "6-8");
  assert.deepEqual(q, { band: "3-5", klu: "Inform", domain: "Reading", mission: "m05" });
  assert.deepEqual(data.parseFilters("?band=9&klu=Shout&domain=Math&mission=m99", "3-5"), {
    band: "3-5",
    klu: "",
    domain: "",
    mission: "",
  });
  assert.deepEqual(data.parseFilters(`?${data.filterQuery(q)}`), q);
});

test("every direct student link is a real mission step, carries assigned=1 and resolves in the route", () => {
  for (const band of BANDS) {
    const doc = parse(render("en", { band }));
    const links = new Set([
      ...all(doc, "a[href*='assigned=1']").map((a) => a.getAttribute("href")),
      ...all(doc, "[data-gd-copy]").map((b) => b.dataset.gdCopy),
    ]);
    assert.equal(
      links.size,
      MISSION_IDS.length * STEP_IDS.length,
      `${band}: one link per mission step`,
    );
    for (const href of links) {
      const m = href.match(
        new RegExp(`^${BASE}/journey/(m\\d\\d)/([a-z]+)\\?grades=${band}&assigned=1$`),
      );
      assert.ok(m, href);
      const url = new URL(href, "https://example.test");
      const p = journeyView.resolveJourney(
        journeyView.journeyParams(url.pathname, url.search),
        cur,
      );
      assert.deepEqual([p.kind, p.mission, p.step, p.assigned], ["step", m[1], m[2], true], href);
    }
    for (const id of MISSION_IDS)
      assert.ok(
        doc.querySelector(`#${id} a[href='${BASE}/family?mission=${id}&grades=${band}']`),
        `${id} family companion`,
      );
  }
  assert.equal(
    journeyView.resolveJourney(journeyView.journeyParams(`${BASE}/journey/guide`, ""), cur).kind,
    "guide",
  );
  assert.equal(
    journeyView.resolveJourney(journeyView.journeyParams(`${BASE}/journey/teacher`, ""), cur).kind,
    "redirect",
  );
  assert.equal(writes.length, 0, "rendering and assigning write nothing to device storage");
});

test("WIDA references come from the catalog; the limits statement is always visible", () => {
  const known = new Set(WIDA_LANGUAGE_EXPECTATIONS.map((r) => r.id));
  for (const band of BANDS) {
    const doc = parse(render("en", { band }));
    for (const id of MISSION_IDS) {
      const wida = doc.querySelector(`#${id} .jg-wida`);
      assert.ok(wida, `${id} WIDA block`);
      const rows = all(wida, ".jg-rows code").map((c) => c.textContent);
      assert.ok(rows.length > 0, `${id} ${band} has catalog rows`);
      for (const r of rows) assert.ok(known.has(r), `${id} ${band}: ${r} is not in the catalog`);
      assert.match(wida.textContent, new RegExp(MISSIONS[id].wida[band].standard));
      assert.equal(
        all(wida, ".jg-dims dt").length,
        MISSIONS[id].wida[band].dimensions.length,
        `${id} dimensions`,
      );
    }
  }
  for (const [mode, i] of [
    ["en", 0],
    ["es", 1],
  ]) {
    assert.ok(
      parse(render(mode, { band: "6-8", compact: true }))
        .body.textContent.replace(/\s+/g, " ")
        .includes(WIDA_LIMITS[i]),
      `${mode} limits statement (compact)`,
    );
    assert.ok(
      parse(render(mode, { band: "6-8" }))
        .body.textContent.replace(/\s+/g, " ")
        .includes(WIDA_LIMITS[i]),
      `${mode} limits statement (full)`,
    );
  }
});

test("the page states pacing, supports, evidence rules, limits and a response for every Key Language Use move", () => {
  const text = parse(render("en", { band: "6-8" })).body.textContent.replace(/\s+/g, " ");
  for (const d of [1, 2, 3, 4, 5]) assert.match(text, new RegExp(`Day ${d}\\.`));
  for (const s of cur.STEPS) assert.ok(text.includes(`about ${s.minutes} min`), `${s.id} minutes`);
  assert.match(text, /completed with support/);
  assert.match(text, /on my own/i);
  assert.match(text, /renders no supports/);
  for (const k of [
    "Auto-scored by answer key",
    "Rule-based observation",
    "Teacher-reviewed",
    "Not scored by the lab",
  ])
    assert.ok(text.includes(k), k);
  assert.match(text, /What this guide does not do/);
  for (const w of [
    "no roster",
    "no cloud class management",
    "Nothing leaves this device",
    "not an official WIDA report",
  ])
    assert.ok(text.toLowerCase().includes(w.toLowerCase()), w);
  const moveIds = Object.values(MOVES)
    .flat()
    .map((m) => m.id);
  assert.equal(moveIds.length, 17);
  for (const id of moveIds) {
    const g = data.MOVE_GUIDE[id];
    assert.ok(
      g?.every((x) => typeof x === "string" && x.trim()),
      `move ${id} has a bilingual label and response`,
    );
    assert.ok(text.includes(g[2]), `move ${id} response shown`);
    assert.ok(
      g[2].split(/\s+/).length >= 12 && g[2].split(". ").length <= 3,
      `${id} is a short teaching move`,
    );
  }
  const only = parse(render("en", { band: "6-8", klu: "Explain" })).body.textContent;
  assert.ok(
    only.includes(data.MOVE_GUIDE.cause[2]) && !only.includes(data.MOVE_GUIDE.claim[2]),
    "responses follow the Key Language Use filter",
  );
  assert.equal(data.SUPPORT_CHECK, true, "A, B, C are the lab's Starting, Growing, Expanding");
  const listed = new Set(Object.values(data.STEP_SCAFFOLDS).flat());
  for (const id of listed) assert.ok(data.SCAFFOLDS[id], `scaffold ${id}`);
  assert.deepEqual(data.STEP_SCAFFOLDS.show, [], "show opens no supports");
});

test("no score or level claim in any rendered text, any language, any band", async () => {
  for (const mode of ["en", "es", "bi"])
    for (const band of BANDS)
      for (const compact of [false, true]) {
        const t = parse(render(mode, { band, compact, hub: compact })).body.textContent;
        assert.ok(
          !SCORE_CLAIM.test(t),
          `${mode} ${band} compact=${compact}: ${t.match(SCORE_CLAIM)?.[0]}`,
        );
      }
  for (const id of MISSION_IDS) {
    const pack = await loadMission(id);
    for (const band of BANDS) {
      const t = parse(toHtml(mission.packDetailsHTML(makeI18n("en", "en"), id, band, pack))).body
        .textContent;
      assert.ok(!SCORE_CLAIM.test(t), `${id} ${band} details`);
      assert.match(t, /Answer keys are not shown/);
    }
  }
});

test("the guide modules read no storage, network or roster and ship no answer keys", async () => {
  for (const f of ["guide.js", "guide-data.js", "guide-mission.js"]) {
    const src = (await readFile(join(LAB, "src/journey/ui", f), "utf8")).replace(
      /\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm,
      "",
    );
    assert.ok(
      !/\b(?:localStorage|sessionStorage|indexedDB)\b|document\.cookie|\bstorage\.|\bfetch\(|XMLHttpRequest|sendBeacon|loadJourney|saveJourney|loadLedger|\bassign\(/.test(
        src,
      ),
      `${f} touches storage, the network or progress`,
    );
    assert.ok(!/\.expect\b|\.valid\b|correctIndex|\.ok\b/.test(src), `${f} reads an answer field`);
  }
  for (const f of ["guide.js", "guide-data.js", "guide-mission.js"])
    assert.ok(!/teacher/i.test(f), "path avoids the gated word");
});

test("Spanish render leaves none of the guide's English strings behind", () => {
  const pairs = new Map();
  const base = makeI18n("es", "en");
  const rec = {
    ...base,
    T: (en, es) => (pairs.set(en, es), base.T(en, es)),
    S: (en, es) => (pairs.set(en, es), base.S(en, es)),
  };
  const markup = [];
  for (const band of BANDS)
    markup.push(
      toHtml(guide.guideHTML(rec, { band, hub: true })),
      toHtml(guide.guideHTML(rec, { band, compact: true })),
    );
  const doc = parse(markup.join("\n"));
  for (const el of all(doc, "[lang='en']")) el.remove();
  for (const el of all(doc, "code")) el.remove();
  const text = doc.body.textContent.replace(/\s+/g, " ");
  assert.ok(pairs.size > 150, `recorded ${pairs.size} pairs`);
  const sameOk = /^(?:Debate|Detalles|[\d\s()·.,:%/-]+)$/;
  for (const [en, es] of pairs) {
    assert.ok(es && es.trim(), `Spanish missing for: ${en}`);
    if (en !== es) continue;
    assert.match(en, sameOk, `Spanish equals English: ${en}`);
  }
  for (const [en, es] of pairs)
    if (en !== es && en.split(/\s+/).length >= 3)
      assert.ok(!text.includes(en), `English left on the Spanish page: ${en}`);
  assert.ok(!all(doc, "html,body").some((e) => e.getAttribute("lang") === "en"));
});

test("printable links point only at files the generator writes", () => {
  const written = new Set();
  const base = (band, domain, level) =>
    (band === "6-8" ? `${domain}-${level}` : `g3-5-${domain}-${level}`).replace(/\s+/g, "");
  for (const band of CONTENT_BANDS)
    for (const { domain, data: d } of loadBand(band))
      for (const [level, L] of Object.entries(d.levels || {}))
        if ((L.activities || []).length) written.add(base(band, domain, level));
  for (const band of BANDS) {
    const doc = parse(render("en", { band }));
    const hrefs = all(doc, "#printables a").map((a) => a.getAttribute("href"));
    assert.equal(hrefs.length, 12, `${band}: 4 domains x 3 levels`);
    for (const h of hrefs) {
      assert.match(h, new RegExp(`^${BASE}/printables/[^/]+$`));
      assert.ok(
        written.has(h.split("/").pop()),
        `${h} is not written by tools/generate-access-printables.mjs`,
      );
    }
    assert.ok(
      !all(doc, "a").some((a) => a.getAttribute("href").startsWith("/access-teacher/")),
      "the public guide links no teacher packets",
    );
    const one = all(parse(render("en", { band, domain: "Speaking" })), "#printables a");
    assert.equal(one.length, 3);
  }
});

test("mount: filters redraw and update the URL, Copy link works with and without the clipboard, Details loads the pack", async () => {
  dom.reconfigure({ url: `${BASE_URL}?band=6-8` });
  const I = makeI18n("en", "en");
  const root = document.createElement("div");
  document.body.append(root);
  const opts = { band: "6-8" };
  root.innerHTML = render("en", opts);
  const dispose = guide.mountGuide(root, { I, opts });
  const set = (name, value) => {
    const s = root.querySelector(`select[name=${name}]`);
    s.value = value;
    s.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  };
  set("klu", "Argue");
  await flush();
  assert.deepEqual(idsOf(root), ["m10", "m11", "m12"]);
  assert.match(location.search, /band=6-8/);
  assert.match(location.search, /klu=Argue/);
  assert.match(root.querySelector("[data-gd-count]").textContent, /Showing 3 of 12/);
  set("band", "3-5");
  await flush();
  assert.ok(root.querySelector("#m11 a[href*='grades=3-5&assigned=1']"));
  set("domain", "Writing");
  await flush();
  assert.ok(idsOf(root).every((id) => ["m10", "m11", "m12"].includes(id)));
  assert.match(location.search, /domain=Writing/);
  root.querySelector("[data-gd-clear]").click();
  await flush();
  assert.equal(idsOf(root).length, 12);
  assert.ok(!/klu=/.test(location.search));

  const copies = [];
  clipboard = { writeText: async (t) => copies.push(t) };
  const btn = root.querySelector("#m08 [data-gd-copy]");
  btn.click();
  await flush();
  assert.equal(copies.length, 1);
  assert.match(
    copies[0],
    new RegExp(`^https://example\\.test${BASE}/journey/m08/discover\\?grades=3-5&assigned=1$`),
  );
  assert.equal(btn.parentElement.querySelector("[data-gd-copied]").textContent, "Copied");
  clipboard = { writeText: async () => Promise.reject(new Error("denied")) };
  btn.click();
  await flush();
  const field = btn.parentElement.querySelector("input.jg-fallback");
  assert.ok(
    field && field.readOnly && field.value.endsWith("assigned=1"),
    "fallback shows the link",
  );

  const details = root.querySelector("#m08 [data-gd-details]");
  details.click();
  await flush();
  await flush();
  const panel = root.querySelector("#gd-pack-m08");
  assert.equal(panel.hidden, false);
  assert.equal(details.getAttribute("aria-expanded"), "true");
  assert.ok(panel.querySelector(".jg-packbody dl"), "pack details rendered");
  assert.match(panel.textContent, /Answer keys are not shown/);
  details.click();
  assert.equal(panel.hidden, true);
  assert.equal(writes.length, 0, "no storage writes while using the guide");
  dispose();
  root.remove();
});

test("the route view renders from the query and /journey/teacher is only a redirect to guide", async () => {
  dom.reconfigure({ url: `${BASE_URL}?klu=Explain&domain=Writing&band=3-5` });
  const ctx = { prefs: { lang: "en" }, band: "6-8", route: { view: "journey" } };
  const out = await guide.render(ctx);
  assert.equal(out.title, "Journey teacher guide");
  const doc = parse(toHtml(out.html));
  assert.ok(doc.querySelector("h1"));
  const ids = idsOf(doc);
  assert.ok(ids.length > 0 && ids.every((id) => ["m07", "m08", "m09"].includes(id)));
  assert.match(doc.querySelector("#jg-band option[selected]").value, /3-5/);
  assert.ok(doc.querySelector("[data-gd-print]"));
  const es = await guide.render({ ...ctx, prefs: { lang: "es" } });
  assert.equal(es.title, "Guía docente del viaje");
  dom.reconfigure({ url: BASE_URL });
});

test("the Teacher Hub panel mounts the same missions and adds teacher packets", async () => {
  const src = (
    await readFile(join(REPO_ROOT, "access-teacher/journey-panel.js"), "utf8")
  ).replaceAll("/access-practice-lab/", `${pathToFileURL(LAB).href}/`);
  const panel = await import(`data:text/javascript;base64,${Buffer.from(src).toString("base64")}`);
  const root = document.createElement("div");
  document.body.append(root);
  panel.mountJourneyPanel(root);
  assert.deepEqual(idsOf(root), MISSION_IDS);
  assert.ok(root.querySelector("#journeyGuideBody, [data-gd]"));
  assert.ok(!root.querySelector("#pacing"), "the hub panel is the compact guide");
  assert.equal(
    root.querySelectorAll("a[href*='assigned=1']").length >= MISSION_IDS.length * STEP_IDS.length,
    true,
  );
  const select = root.querySelector("select[name=klu]");
  select.value = "Inform";
  select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  await flush();
  assert.deepEqual(idsOf(root), ["m04", "m05", "m06"]);
  assert.ok(!/klu=Inform/.test(location.search), "the hub keeps its own address");
  const hub = parse(toHtml(guide.guideHTML(makeI18n("en", "en"), { band: "6-8", hub: true })));
  assert.ok(
    all(hub, "#printables a").some((a) =>
      a.getAttribute("href").startsWith("/access-teacher/packets/"),
    ),
  );
  root.remove();
  const html = await readFile(join(REPO_ROOT, "access-teacher/index.html"), "utf8");
  assert.match(html, /<a href="#journeyGuide">Journey mission guide<\/a>/);
  assert.match(
    html,
    /<section id="journeyGuide" class="th-sec lab-main" aria-labelledby="journeyGuideTitle">/,
  );
  assert.match(html, /<h2 id="journeyGuideTitle"[^>]*>Learning Journey: mission guide<\/h2>/);
  assert.match(html, /href="\/access-practice-lab\/journey-guide\.css"/);
  assert.match(
    html,
    /import\("\/access-teacher\/journey-panel\.js"\)\.then\(\(m\) => m\.mountJourneyPanel\(/,
  );
});

test("Teacher Hub journey evidence counts only real local actions and distinguishes independent transfer", async () => {
  const src = (
    await readFile(join(REPO_ROOT, "access-teacher/journey-panel.js"), "utf8")
  ).replaceAll("/access-practice-lab/", `${pathToFileURL(LAB).href}/`);
  const panel = await import(`data:text/javascript;base64,${Buffer.from(src).toString("base64")}`);
  const { completeStep, emptyState } = await lab("src/journey/state.js");
  const I = makeI18n("en", "en");
  const empty = parse(
    toHtml(
      panel.journeyEvidenceHTML(I, {
        state: emptyState(),
        ledger: { v: 1, entries: [] },
        band: "6-8",
      }),
    ),
  );
  assert.match(empty.body.textContent, /No Journey evidence has been saved/);
  assert.doesNotMatch(
    empty.body.textContent,
    /\b(?:mastery|proficiency score|predicted ACCESS)\b/i,
  );

  const state = completeStep(emptyState(), "6-8", "m09", "discover", {
    independent: false,
    now: "2026-11-07T10:00:00Z",
  });
  const ledger = {
    v: 1,
    entries: [
      {
        src: "mission",
        task: "m09.discover",
        band: "6-8",
        domain: "Reading",
        kind: "first",
        stage: "supported",
        t: "2026-11-07T10:00:00Z",
      },
      {
        src: "mission",
        task: "m09.improve",
        band: "6-8",
        domain: "Writing",
        kind: "revision",
        stage: "supported",
        t: "2026-11-07T10:02:00Z",
      },
      {
        src: "mission",
        task: "m09.show",
        band: "6-8",
        domain: "Writing",
        kind: "transfer",
        stage: "independent",
        t: "2026-11-07T10:03:00Z",
      },
      {
        src: "mission",
        task: "m09.show",
        band: "6-8",
        domain: "Writing",
        kind: "transfer",
        stage: "supported",
        t: "2026-11-07T10:03:30Z",
      },
      {
        src: "mission",
        task: "m09.show",
        band: "3-5",
        domain: "Writing",
        kind: "transfer",
        stage: "independent",
        t: "2026-11-07T10:04:00Z",
      },
    ],
  };
  const doc = parse(toHtml(panel.journeyEvidenceHTML(I, { state, ledger, band: "6-8" })));
  const rows = all(doc, "[data-journey-evidence] tbody tr");
  const reading = rows.find((r) => r.querySelector("th").textContent === "Reading");
  const writing = rows.find((r) => r.querySelector("th").textContent === "Writing");
  assert.match(reading.textContent, /1 \(0 independent\)/);
  assert.deepEqual(
    all(writing, "td").map((cell) => cell.textContent.trim()),
    ["0 (0 independent)", "1", "1"],
  );
  assert.match(doc.body.textContent, /Solve the Mystery/);
  assert.match(doc.body.textContent, /1 \/ 6 steps done; 4 recorded responses/);
  assert.ok(doc.querySelector("a[href*='assigned=1']"));
});

test("print rules give a clean one-column guide and the stylesheet stays off purple", async () => {
  const css = await readFile(join(LAB, "journey-guide.css"), "utf8");
  assert.match(css, /@media print/);
  assert.match(css, /\.jg-filters,[\s\S]*display: none !important/);
  assert.match(css, /min-height: 44px/);
  assert.ok(
    !/purple|violet|magenta|#(?:7c3aed|8b5cf6|a855f7|c026d3)/i.test(
      css.replace(/\/\*[\s\S]*?\*\//g, ""),
    ),
  );
});
