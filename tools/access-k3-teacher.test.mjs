// K, 1 and 2-3 (and the 4-5 alias) are first-class in the teacher tooling: share codes, Passport check-ins, the Hub
// panels, the class assignment builder and the family setup. Older 3-5 / 6-8 codes keep decoding.
// Unit checks plus JSDOM mounts of the real Hub script and panels over the real class endpoint (node:sqlite).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { JSDOM } from "jsdom";

const ROOT = new URL("../", import.meta.url);
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://thelanguagepage.test/access-teacher/",
});
for (const k of [
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "navigator",
  "HTMLElement",
  "Event",
]) {
  Object.defineProperty(globalThis, k, {
    value: k === "window" ? dom.window : dom.window[k],
    configurable: true,
    writable: true,
  });
}
Object.defineProperty(globalThis, "location", { value: dom.window.location, configurable: true });

const read = (p) => readFileSync(new URL(p, ROOT), "utf8");
const index = JSON.parse(read("access-practice-lab/content/index.json"));
const { onRequest } = await import("../functions/api/class/[[path]].js");
const bands = await import("../access-practice-lab/src/bands.js");
const share = await import("../access-practice-lab/src/lang/share.js");
const checkin = await import("../access-practice-lab/src/checkin.js");
const roster = await import("../access-practice-lab/src/checkin-roster.js");
const assign = await import("../access-practice-lab/src/class/assign.js");
const { validateSettings } = await import("../shared/class-platform/contract.js");
const { mountClassPanel } = await import("../access-practice-lab/src/class/roster-panel.js");
const store = await import("../access-practice-lab/src/store.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");

const EARLY = ["K", "1", "2-3"];
const settle = async (n = 40) => {
  for (let i = 0; i < n; i++) await new Promise((r) => setTimeout(r, 0));
};

test("share codes carry K, 1, 2-3 and the 4-5 alias; older codes still decode", () => {
  const result = { skill: "word", ok: true, supportUsed: false, date: "2026-11-01" };
  for (const band of ["K", "1", "2-3", "3-5", "6-8"]) {
    localStorage.clear();
    store.saveRecord(band, "Listening", "A", {
      complete: ["x"],
      answers: {},
      results: { x: result },
    });
    const bundle = share.buildShare({ alias: "Mia", band });
    assert.equal(bundle.band, band);
    const back = share.decodeShare(share.encodeShare(bundle));
    assert.equal(back.band, band, `band ${band} survives the code`);
    const keys = Object.keys(back.records);
    assert.deepEqual(keys, [band === "6-8" ? "Listening:A" : `g${band}:Listening:A`]);
    assert.equal(back.records[keys[0]].band, band);
  }
  assert.equal(
    share.buildShare({ alias: "Mia", band: "4-5" }).band,
    "3-5",
    "4-5 opens the 3-5 content band",
  );
  // A code written before K-3 existed: only 3-5 and 6-8 keys, band "3-5".
  const old = {
    v: 1,
    kind: "share",
    alias: "Old",
    band: "3-5",
    ledger: { entries: [] },
    records: {
      "g3-5:Reading:B": { results: { y: { ok: false, skill: "s", date: "d" } } },
      "Reading:A": { results: { z: { ok: true } } },
    },
  };
  const decoded = share.decodeShare(share.encodeShare(old));
  assert.equal(decoded.band, "3-5");
  assert.equal(decoded.records["g3-5:Reading:B"].band, "3-5");
  assert.equal(decoded.records["Reading:A"].band, "6-8");
  assert.equal(share.decodeShare(JSON.stringify({ ...old, band: "4-5" })).band, "3-5");
  assert.equal(share.decodeShare(JSON.stringify({ ...old, band: "nonsense" })).band, "6-8");
});

test("a Passport progress code of K-3 work is read as that band", () => {
  localStorage.clear();
  store.saveRecord("2-3", "Reading", "A", {
    complete: ["a"],
    results: { a: { ok: true, date: "d" } },
  });
  const data = {};
  for (const key of Object.keys(localStorage)) data[key] = localStorage.getItem(key);
  const code = `ACCESS1.${btoa(unescape(encodeURIComponent(JSON.stringify({ data }))))}`;
  const student = share.decodeShare(code);
  assert.equal(student.band, "2-3");
  assert.ok(student.records["g2-3:Reading:A"]);
  assert.equal(share.decodeShare(`ACCESS1.${btoa(JSON.stringify({ data: {} }))}`).band, "6-8");
});

test("check-in links carry every band, and 3-5 / 6-8 links written earlier still decode", () => {
  const routes = [{ domain: "Reading", level: "A", stopsDone: 2, stops: [true, true, false] }];
  for (const band of ["K", "1", "2-3", "3-5", "6-8"]) {
    const c = checkin.buildCheckin({ alias: "Mia", band, date: "2026-11-06", routes });
    const back = checkin.decodeCheckin(checkin.checkinUrl(c, "https://x.test"));
    assert.equal(back.band, band);
    assert.deepEqual(back.routes[0].stops, [true, true, false]);
  }
  assert.equal(
    checkin.buildCheckin({ alias: "Mia", band: "4-5", date: "2026-11-06", routes }).b,
    "3-5",
  );
  const enc = (o) => checkin.encodeCheckin(o);
  const good = {
    v: 1,
    kind: "checkin",
    a: "Mia",
    b: "3-5",
    t: "2026-10-29",
    r: [{ d: "Reading", l: "A", s: "110" }],
  };
  assert.equal(checkin.decodeCheckin(enc(good)).band, "3-5");
  assert.equal(checkin.decodeCheckin(enc({ ...good, b: "4-5" })).band, "3-5");
  for (const b of ["9-9", "", "K-1", undefined])
    assert.throws(() => checkin.decodeCheckin(enc({ ...good, b })), Error, String(b));
});

test("the Hub's check-in roster keeps K-3 students and still drops unknown bands", () => {
  const c = (alias, band) =>
    checkin.decodeCheckin(
      checkin.encodeCheckin({
        v: 1,
        kind: "checkin",
        a: alias,
        b: band,
        t: "2026-11-06",
        r: [{ d: "Reading", l: "A", s: "11" }],
      }),
    );
  let r = roster.emptyRoster();
  for (const band of ["K", "1", "2-3", "3-5"])
    r = roster.addCheckin(r, c(`Kid ${band}`, band)).roster;
  const clean = roster.sanitizeRoster(JSON.parse(JSON.stringify(r)));
  assert.equal(Object.keys(clean.students).length, 4);
  clean.students["Z|bad"] = { alias: "Bad", band: "12", routes: {} };
  assert.equal(Object.keys(roster.sanitizeRoster(clean).students).length, 4);
});

test("the assignment builder lists K, 1 and 2-3 activities with their band and audio-first, and the class server accepts them", () => {
  for (const band of EARLY) {
    let total = 0;
    for (const domain of assign.ASSIGN_DOMAINS) {
      for (const row of assign.assignableActivities(index, band, domain)) {
        total++;
        assert.equal(row.band, band);
        assert.equal(row.audioFirst, true);
        assert.equal(
          row.path,
          `/access-practice-lab/${domain}/${row.level}/${row.id}?grades=${band}`,
        );
        assert.equal(assign.assignmentBand(row.path), band);
        const ok = validateSettings({ assignments: [assign.toAssignment(row)] }, "language");
        assert.equal(ok.ok, true, row.id);
        assert.equal(ok.settings.assignments[0].path, row.path, "the server keeps the link");
      }
    }
    assert.ok(total >= 5, `${band} has assignable activities`);
  }
  const later = assign.assignableActivities(index, "6-8", "Reading")[0];
  assert.equal(later.audioFirst, false);
  assert.ok(!later.path.includes("?grades="), "grades 6-8 keep the older link");
  assert.equal(assign.assignmentBand("/access-practice-lab/Reading/A/x"), "6-8");
  assert.equal(assign.assignmentBand("/access-practice-lab/Reading/A/x?grades=4-5"), "3-5");
  const S = (_en, es) => es;
  assert.match(
    assign.assignmentLabel(S, assign.assignableActivities(index, "K", "Listening")[0]),
    /Kínder · Nivel A · .+ · con audio primero/,
  );
});

test("small-group speaking routines never mix grade bands", async () => {
  const { suggestGroups } = await import("../access-practice-lab/src/lang/speaking-groups.js");
  const entry = { src: "speaking", kind: "first", stage: "supported", use: "Narrate" };
  const kid = (alias, band) => ({ alias, band, ledger: { entries: [entry] } });
  const { groups } = suggestGroups([
    kid("Ana", "K"),
    kid("Ben", "K"),
    kid("Cy", "6-8"),
    kid("Di", "2-3"),
  ]);
  for (const g of groups) assert.ok(g.members.every((m) => m.band === g.band));
  assert.deepEqual([...new Set(groups.map((g) => g.band))].sort(), ["2-3", "6-8", "K"]);
});

test("benchmark windows exist only for the bands with practice forms; the panel hides itself for K-3", async () => {
  const bm = await import("../access-practice-lab/src/lang/benchmark.js");
  for (const band of EARLY) {
    assert.equal(bm.hasBenchmarkForms(band), false);
    assert.deepEqual(bm.windowsFor(band), []);
    assert.deepEqual(bm.benchmarkGrowth(band, bm.normalizeSnapshots({})).windows, []);
  }
  assert.equal(bm.windowsFor("4-5")[0].testId, "g35-form-a");
  const { benchmarkPanelHTML } = await import(
    "../access-practice-lab/src/views/benchmark-panel.js"
  );
  const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
  assert.equal(benchmarkPanelHTML(makeI18n("en"), "K"), "");
  assert.match(toHtml(benchmarkPanelHTML(makeI18n("en"), "3-5")), /Benchmark windows/);
});

test("the WIDA alignment inventory maps each band without inventing a cluster", () => {
  const al = JSON.parse(read("access-practice-lab/content/alignment-index.json"));
  assert.deepEqual(al.localBandMapping["2-3"].gradeClusterCandidates, ["2-3"]);
  assert.deepEqual(al.localBandMapping["3-5"].gradeClusterCandidates, ["2-3", "4-5"]);
  for (const band of ["K", "1"]) {
    assert.deepEqual(al.localBandMapping[band].gradeClusterCandidates, [], band);
    assert.equal(al.byGradeBand[band] > 0, true);
  }
  for (const r of al.records.filter((x) => x.localGradeBand === "2-3"))
    assert.deepEqual(r.gradeClusterCandidates, ["2-3"]);
});

test("family setup offers every band and keeps saved answers", async () => {
  const { getFamily } = await import("../access-practice-lab/src/family/state.js");
  for (const grade of ["K", "1", "2-3", "3-5", "6-8"])
    assert.equal(getFamily({ family: { grade } }).grade, grade);
  assert.equal(getFamily({ family: { grade: "9" } }).grade, "");
  const strings = read("access-practice-lab/src/strings.js");
  for (const key of ["K", "1", "23", "35", "68"])
    assert.match(strings, new RegExp(`"setup\\.grade\\.${key}\\.sub"`));
  const setup = await import("../access-practice-lab/src/family/setup.js");
  const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
  for (const mode of ["en", "es"]) {
    const page = await setup.render(
      { band: "K", prefs: { lang: mode, family: { grade: "K" } } },
      makeI18n(mode),
    );
    assert.ok(page.title);
    setup.reset?.();
  }
});

// ── the class endpoint, teacher panel and student view ────────────────────────
function d1(sqlite) {
  const make = (sql, params) => ({
    bind: (...next) => make(sql, next),
    first: async () => sqlite.prepare(sql).get(...params) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...params) }),
    run: async () => ({
      success: true,
      meta: { changes: Number(sqlite.prepare(sql).run(...params).changes) },
    }),
  });
  return {
    prepare: (sql) => make(sql, []),
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        for (const s of statements) await s.run();
        sqlite.exec("COMMIT");
      } catch (err) {
        sqlite.exec("ROLLBACK");
        throw err;
      }
    },
  };
}
const KEY = "k3-test";
const env = { DB: d1(new DatabaseSync(":memory:")), TEACHER_KEY: KEY };
let ip = 0;
async function serverFetch(input, init = {}) {
  const url = new URL(input, "https://thelanguagepage.test");
  if (!url.pathname.startsWith("/api/class/")) {
    try {
      return new Response(readFileSync(new URL(`.${decodeURIComponent(url.pathname)}`, ROOT)), {
        headers: { "content-type": "application/json" },
      });
    } catch {
      return new Response("not found", { status: 404 });
    }
  }
  const headers = new Headers(init.headers || {});
  headers.set("CF-Connecting-IP", `10.9.0.${++ip % 250}`);
  const request = new Request(url, { method: init.method || "GET", headers, body: init.body });
  return onRequest({
    request,
    env,
    params: { path: url.pathname.replace(/^\/api\/class\//, "").split("/") },
  });
}
globalThis.fetch = serverFetch;
test("class panel: pick Kindergarten, Listening, assign an audio-first activity; the student list names the band", async () => {
  document.body.innerHTML = '<div id="p"></div>';
  const panel = mountClassPanel(document.querySelector("#p"), {
    S: (en) => en,
    fetchImpl: serverFetch,
    origin: "https://thelanguagepage.test",
  });
  const set = (sel, v) => {
    const n = document.querySelector(sel);
    n.value = v;
    return n;
  };
  set("#ctKey", KEY);
  set("#ctTitle", "Room 4 early listeners");
  document
    .querySelector("#ctTitle")
    .form.dispatchEvent(new dom.window.Event("submit", { cancelable: true }));
  await settle(120);
  const selects = [...document.querySelectorAll("select")];
  const bandSel = selects.find(
    (s) =>
      s.getAttribute("aria-label") === "Grade band" &&
      [...s.options].some((o) => o.value === "K") &&
      [...s.options].some((o) => o.textContent === "Kindergarten") &&
      s.closest(".row-actions")?.querySelector('[aria-label="Activity"]'),
  );
  assert.ok(bandSel, "the assignment builder offers Kindergarten");
  assert.deepEqual(
    [...bandSel.options].map((o) => o.value),
    ["K", "1", "2-3", "3-5", "6-8"],
  );
  assert.equal(bandSel.value, "6-8", "grades 6-8 stay the default");
  const row = bandSel.closest(".row-actions");
  bandSel.value = "K";
  bandSel.dispatchEvent(new dom.window.Event("change"));
  const skill = row.querySelector('[aria-label="Skill"]');
  skill.value = "Listening";
  skill.dispatchEvent(new dom.window.Event("change"));
  const pick = row.querySelector('[aria-label="Activity"]');
  assert.ok(pick.options.length >= 1);
  assert.match(pick.options[0].textContent, /^Kindergarten · Level A · .+ · audio-first$/);
  [...row.querySelectorAll("button")].find((b) => /Assign/.test(b.textContent)).click();
  await settle(80);
  const classes = JSON.parse(localStorage.getItem("accessPracticeLabClass:v1:teacher-classes"));
  const info = await (await serverFetch(`/api/class/info?code=${classes[0].code}`)).json();
  assert.equal(info.assignments.length, 1);
  assert.match(
    info.assignments[0].path,
    /^\/access-practice-lab\/Listening\/A\/gk-[\w-]+\?grades=K$/,
  );
  assert.match(
    document.querySelector("#p").textContent,
    /Kindergarten/,
    "the saved assignment names its band",
  );
  panel.unmount();
});

test("class quiz picker only offers bands and skills that have quiz questions", async () => {
  const { itemsFor, loadQuizKey } = await import("../access-practice-lab/src/class/quiz-key.js");
  const key = await loadQuizKey(serverFetch);
  const withItems = bands.CONTENT_BANDS.filter((b) => itemsFor(key, { band: b }).length);
  assert.ok(withItems.includes("K") && withItems.includes("6-8"), withItems.join(","));
});

// ── the real Hub script (grade-band switch) and the engine panels ─────────────
const labUrl = new URL("access-practice-lab/", ROOT).href;
const teacherUrl = new URL("access-teacher/", ROOT).href;
async function importHub(file) {
  const src = read(`access-teacher/${file}`)
    .replaceAll("/access-practice-lab/", labUrl)
    .replaceAll('"./early-activities.js"', `"${teacherUrl}early-activities.js"`);
  const early = read("access-teacher/early-activities.js").replaceAll(
    "/access-practice-lab/",
    labUrl,
  );
  const earlyUrl = `data:text/javascript;base64,${Buffer.from(early).toString("base64")}`;
  return import(
    `data:text/javascript;base64,${Buffer.from(src.replaceAll(`${teacherUrl}early-activities.js`, earlyUrl)).toString("base64")}#${file}${Math.random()}`
  );
}

test("Teacher Hub: the band switch lists K to 6-8, K-3 rows show band and audio-first, packets and tests give way to a print note", async () => {
  document.body.innerHTML = '<main id="hub"></main>';
  await importHub("teacher.js");
  await settle(200);
  const hub = document.querySelector("#hub");
  const labels = [...hub.querySelectorAll("[data-hub-band]")].map((b) => b.dataset.hubBand);
  assert.deepEqual(labels, ["K", "1", "2-3", "3-5", "6-8"], "youngest first");
  assert.deepEqual(
    [...hub.querySelectorAll("[data-trip-grade] option")].map((o) => o.value),
    ["K", "1", "2-3", "3-5", "6-8"],
  );
  assert.ok(hub.querySelector("#printables .th-pgroups"), "6-8 has packets");
  hub.querySelector('[data-hub-band="2-3"]').click();
  await settle(200);
  assert.equal(hub.querySelector('[data-hub-band="2-3"]').getAttribute("aria-pressed"), "true");
  assert.ok(hub.querySelector("[data-early-note]"));
  const chips = [...hub.querySelectorAll("[data-band-chip]")];
  assert.ok(chips.length > 0 && chips.every((c) => c.textContent.trim() === "Grades 2–3"));
  assert.ok(hub.querySelectorAll(".th-chip.is-audio").length === chips.length);
  assert.match(hub.querySelector(".t-title a").getAttribute("href"), /\?grades=2-3$/);
  assert.equal(hub.querySelector("#printables .th-pgroups"), null, "no packets are built for K-3");
  assert.match(hub.querySelector("#printables").textContent, /prints from its own paper page/);
  assert.equal(hub.querySelector("#tests"), null);
});

test("early-activities: browse and assign views carry band, audio-first and a link that names the band", async () => {
  const early = await import(
    `data:text/javascript;base64,${Buffer.from(read("access-teacher/early-activities.js").replaceAll("/access-practice-lab/", labUrl)).toString("base64")}`
  );
  const doc = document;
  const browse = early.earlyBrowse(doc, index, "K", "Reading", () => {});
  assert.match(
    browse.querySelector("[data-early-note]").textContent,
    /Kindergarten practice is audio-first.*adult-hosted/,
  );
  const items = [...browse.querySelectorAll(".acc-item-row")];
  assert.ok(items.length >= 1);
  assert.match(
    items[0].querySelector(".acc-hint").textContent,
    /^Kindergarten · audio-first · Level A · Reading$/,
  );
  assert.match(items[0].querySelector("a").getAttribute("href"), /\?grades=K$/);
  const saved = [];
  const state = { earlyDomain: "Speaking", earlyPick: 0 };
  const status = doc.createElement("p");
  const nodes = early.earlyAssign(doc, index, "2-3", state, {
    draw: () => {},
    status,
    save: (a) => saved.push(a),
  });
  const host = doc.createElement("div");
  host.append(...nodes);
  host.querySelector('[data-act="save-assign"]').click();
  assert.equal(saved.length, 1);
  assert.match(
    saved[0].link,
    /^https:\/\/thelanguagepage\.test\/access-practice-lab\/Speaking\/[A-C]\/g23-[\w-]+\?grades=2-3$/,
  );
  assert.match(
    host.querySelector("#asCountMsg").textContent,
    /^Grades 2–3 · audio-first · Level [ABC] · Speaking$/,
  );
});

test("every Hub and lab label for the new strings has a Spanish form", async () => {
  const { P6_EXACT, P6_PATTERNS } = await import(
    "../access-practice-lab/src/acc/i18n/locales/es-phase6.js"
  );
  for (const t of [
    "Kindergarten",
    "Grade 1",
    "Grades 2–3",
    "Skill",
    "Activity",
    "Open activity",
    "All grade bands",
    "No activities for this skill.",
  ])
    assert.ok(P6_EXACT[t], t);
  const es = (text) => {
    for (const [re, fn] of P6_PATTERNS) {
      const m = re.exec(text);
      if (m) return fn(...m.slice(1));
    }
    return "";
  };
  assert.match(
    es("Kindergarten · audio-first · Level A · Reading"),
    /Kínder · con audio primero · Nivel A · Lectura/,
  );
  assert.match(es("Grade 1: 3 Writing activities."), /1\.º grado: 3 actividades de escritura\./);
  assert.match(
    es(
      "Kindergarten practice is audio-first: learners hear each question and every choice. It is made of lab activities, not assessment-engine sets, so it is listed here from the activity index. Kindergarten is adult-hosted.",
    ),
    /Kínder lo dirige un adulto/,
  );
});
