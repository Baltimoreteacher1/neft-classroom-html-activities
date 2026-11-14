// Language Page teacher tools (Package C): class heat map by Key Language Use, starting support + Road week from
// the class, the scoring queue, group -> playlist links, and whole-class family reports. Pure logic is tested
// directly; the panel and the student view are mounted in JSDOM against the REAL /api/class Function over
// node:sqlite (the language-class.test.mjs pattern, no mock server).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://thelanguagepage.test/access-practice-lab/class/teacher",
});
for (const k of [
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "navigator",
  "HTMLElement",
  "Event",
])
  Object.defineProperty(globalThis, k, {
    value: k === "window" ? dom.window : dom.window[k],
    configurable: true,
    writable: true,
  });
Object.defineProperty(globalThis, "location", { value: dom.window.location, configurable: true });

const { onRequest } = await import("../functions/api/class/[[path]].js");
const { RUBRIC_DIMS } = await import("../functions/_lib/class-platform/review.js");
const { validateSummary } = await import("../shared/class-platform/contract.js");
const { studentApi } = await import("../shared/class-platform/client.js");
const labLink = await import("../access-practice-lab/src/class/link.js");
const { heatGrid, heatStep, heatMapTable } = await import(
  "../access-practice-lab/src/class/heat-map.js"
);
const { applyClassSupport, classRoadWeek, SUPPORT_KEY } = await import(
  "../access-practice-lab/src/class/support.js"
);
const { officialStages } = await import("../access-practice-lab/src/class/support-editor.js");
const { classLetters, familyPages } = await import(
  "../access-practice-lab/src/class/family-reports.js"
);
const { mountClassPanel } = await import("../access-practice-lab/src/class/roster-panel.js");
const { feedbackCard, loadMyReviews } = await import(
  "../access-practice-lab/src/class/feedback-card.js"
);
const { currentWeek } = await import("../access-practice-lab/src/views/road.js");
const { getPrefs, setPrefs } = await import("../access-practice-lab/src/store.js");
const { LEDGER_KEY } = await import("../access-practice-lab/src/lang/ledger.js");
const { groupPlaylistIds, groupPlaylistUrl, groupBand } = await import(
  "../access-teacher/group-playlist.js"
);
const { bandRows } = await import("../access-practice-lab/src/content.js");

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
const KEY = "k-tools";
const env = { DB: d1(new DatabaseSync(":memory:")), TEACHER_KEY: KEY };
const ROOT = new URL("../", import.meta.url);
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
  return onRequest({
    request: new Request(url, { method: init.method || "GET", headers, body: init.body }),
    env,
    params: { path: url.pathname.replace(/^\/api\/class\//, "").split("/") },
  });
}
globalThis.fetch = serverFetch;
const teacher = async (path, body) =>
  (
    await serverFetch(
      `/api/class/${path}`,
      body
        ? {
            method: "POST",
            headers: { "x-teacher-key": KEY, "content-type": "application/json" },
            body: JSON.stringify(body),
          }
        : { headers: { "x-teacher-key": KEY } },
    )
  ).json();
const join = async (code, alias) =>
  (
    await serverFetch("/api/class/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, alias }),
    })
  ).json();
const settle = async (n = 40) => {
  for (let i = 0; i < n; i++) await new Promise((r) => setTimeout(r, 0));
};
const EN = (en) => en;
const ES = (_en, es) => es;
const NO_LEVEL = /\b(level|nivel|score|puntaje|placement|colocaci[oó]n)\s*\d/i;

test("the server's rubric dimension ids match the practice rubrics in content/rubrics", () => {
  for (const [id, dims] of Object.entries(RUBRIC_DIMS)) {
    const rubric = JSON.parse(
      readFileSync(
        new URL(`../access-practice-lab/content/rubrics/${id}.json`, import.meta.url),
        "utf8",
      ),
    );
    assert.deepEqual(
      dims,
      rubric.dimensions.map((d) => d.id),
      id,
    );
    assert.equal(rubric.ratings.length, 4);
  }
});

test("languageSummary carries Key Language Use x domain counts the server accepts", () => {
  localStorage.clear();
  const t = new Date().toISOString();
  localStorage.setItem(
    LEDGER_KEY,
    JSON.stringify({
      v: 1,
      entries: [
        { id: "1", t, src: "writing", domain: "Writing", use: "Argue" },
        { id: "2", t, src: "writing", domain: "Writing", use: "Argue" },
        { id: "3", t, src: "item", domain: "Reading", use: "Narrate" },
        { id: "4", t, src: "item", domain: "Reading", use: "" },
        { id: "5", t, src: "item", domain: "Math", use: "Argue" },
      ],
    }),
  );
  const sum = labLink.languageSummary();
  assert.deepEqual(sum.byUse, { Argue: { writing: 2 }, Narrate: { reading: 1 } });
  assert.equal(validateSummary("language", sum).ok, true);
});

test("heat grid: counts per use x domain, shading by class maximum, old summaries show no data instead of zero", () => {
  const students = [
    {
      studentId: "s0000000001",
      alias: "Luna",
      docs: {
        language: { summary: { byUse: { Argue: { writing: 4 }, Explain: { speaking: 1 } } } },
      },
    },
    {
      studentId: "s0000000002",
      alias: "Sol",
      docs: { language: { summary: { domains: { reading: 3 } } } },
    },
  ];
  const { rows, max } = heatGrid(students);
  assert.equal(max, 4);
  assert.equal(rows[0].cells.length, 16);
  assert.equal(rows[0].cells.find((c) => c.use === "Argue" && c.domain === "writing").count, 4);
  assert.equal(rows[0].cells.find((c) => c.use === "Narrate" && c.domain === "reading").count, 0);
  assert.ok(
    rows[1].cells.every((c) => c.count === null),
    "a summary without byUse is 'no data'",
  );
  assert.deepEqual(
    [0, 1, 2, 3, 4].map((n) => heatStep(n, 4)),
    [0, 1, 2, 3, 4],
  );
  let picked = null;
  const table = heatMapTable(EN, students, (id) => (picked = id)).querySelector("table");
  assert.ok(table.querySelector("caption"), "the table names itself");
  assert.equal(table.querySelectorAll("thead th[scope=colgroup]").length, 4);
  assert.equal(table.querySelectorAll("tbody th[scope=row]").length, 2);
  assert.equal(table.querySelector("td.cls-heat-4").textContent, "4");
  table.querySelector("tbody th button").click();
  assert.equal(picked, "s0000000001");
});

test("starting support applies once as a default; the learner can still change it; Road week overrides the date", () => {
  localStorage.clear();
  setPrefs({ tiers: { Reading: "C" } });
  assert.equal(
    applyClassSupport({ support: { stages: { writing: "A", speaking: "B" } }, roadWeek: 3 }),
    true,
  );
  assert.deepEqual(getPrefs().tiers, { Reading: "C", Writing: "A", Speaking: "B" });
  assert.equal(classRoadWeek(), 3);
  setPrefs({ tiers: { ...getPrefs().tiers, Writing: "B" } });
  assert.equal(
    applyClassSupport({ support: { stages: { writing: "A", speaking: "B" } }, roadWeek: 3 }),
    false,
    "same setting: the learner's own change stays",
  );
  assert.equal(getPrefs().tiers.Writing, "B");
  assert.equal(
    applyClassSupport({ support: { stages: { writing: "C" }, roadWeek: 7 }, roadWeek: 3 }),
    true,
  );
  assert.equal(getPrefs().tiers.Writing, "C");
  assert.equal(classRoadWeek(), 7, "a student's own week beats the class week");
  assert.doesNotMatch(localStorage.getItem(SUPPORT_KEY), /level|score/i);
  const plan = {
    weeks: [
      { n: 1, start: "2000-01-01" },
      { n: 2, start: "2000-01-08" },
      { n: 7, start: "2999-01-01" },
    ],
  };
  assert.equal(currentWeek(plan).n, 2, "by date");
  assert.equal(currentWeek(plan, 7).n, 7, "teacher override");
  assert.equal(currentWeek(plan, 40).n, 2, "an unknown week falls back to the date");
  applyClassSupport({});
  assert.equal(classRoadWeek(), null);
});

test("prefill: official results saved in the Teacher Hub on this device propose support stages via decideSupport", () => {
  const roster = [{ id: "P1|Luna|6-8", alias: "Luna" }];
  const official = {
    "P1|Luna|6-8": [{ year: "2024-25", levels: { Writing: 1.4, Speaking: 4.6 }, overall: null }],
  };
  const stages = officialStages("luna", { roster, official });
  assert.ok(stages.writing && stages.speaking);
  assert.ok(["A", "B", "C"].includes(stages.writing));
  assert.notEqual(stages.writing, stages.speaking, "a lower level starts with more support");
  assert.equal(stages.listening, undefined, "no result, no proposal");
  assert.equal(officialStages("Sol", { roster, official }), null);
});

test("group -> playlist: activities matching the need, in the playlist builder's URL format", async () => {
  const rows = await bandRows("6-8");
  for (const kind of ["pattern", "fade", "trap", "evidence"]) {
    const ids = groupPlaylistIds(kind, rows);
    assert.ok(ids.length > 0 && ids.length <= 5, kind);
    assert.equal(new Set(ids).size, ids.length);
    const domains = new Set(ids.map((id) => rows.find((r) => r.id === id).domain));
    assert.ok(
      [...domains].every((d) => ["Writing", "Reading", "Listening"].includes(d)),
      kind,
    );
  }
  assert.equal(
    groupPlaylistUrl(["a", "b"], "Fade supports", "3-5"),
    "/access-practice-lab/play?ids=a,b&t=Fade%20supports&grades=3-5",
  );
  assert.equal(
    groupBand(
      ["A", "B"],
      [
        { alias: "A", band: "3-5" },
        { alias: "B", band: "3-5" },
      ],
    ),
    "3-5",
  );
  assert.equal(groupBand(["Z"], []), "6-8");
  const hub = readFileSync(new URL("../access-teacher/evidence.js", import.meta.url), "utf8");
  assert.match(
    hub,
    /data-group-playlist="\$\{g\.kind\}"/,
    "the Groups tab renders the button for each group",
  );
});

test("family reports: one page per student, EN/ES/both, counts only, no level or score", () => {
  const students = [
    {
      studentId: "s0000000001",
      alias: "Luna",
      docs: { language: { summary: { domains: { writing: 3, speaking: 1 }, weekDays: 2 } } },
    },
    { studentId: "s0000000002", alias: "Sol", docs: {} },
  ];
  const letters = classLetters(students, new Date("2026-11-14T12:00:00Z"));
  assert.equal(letters.length, 2);
  assert.match(JSON.stringify(letters[0].en), /Writing: 3/);
  assert.match(JSON.stringify(letters[0].es), /Escribir: 3/);
  assert.match(letters[0].en.sections[1].p[0], /2 days/);
  for (const l of letters)
    for (const lang of ["en", "es"]) assert.doesNotMatch(JSON.stringify(l[lang]), NO_LEVEL);
  const both = familyPages(students, ["en", "es"]);
  assert.equal(both.querySelectorAll(".cls-family-page").length, 2);
  assert.equal(both.querySelectorAll(".cls-family-page .cls-letter").length, 4);
  assert.equal(familyPages(students, ["es"]).querySelectorAll("[lang=en]").length, 0);
  const css = readFileSync(new URL("../access-practice-lab/class.css", import.meta.url), "utf8");
  assert.match(css, /@media print[\s\S]*cls-family-page[\s\S]*break-after: page/);
});

test("teacher panel + student view: heat map, starting support, scoring queue and feedback, end to end", async () => {
  localStorage.clear();
  const created = await teacher("create", { app: "language", title: "Period 4" });
  const code = created.code;
  const a = await join(code, "Luna");
  const b = await join(code, "Sol");
  const linkA = { code, studentId: a.studentId, studentKey: a.studentKey, alias: "Luna" };
  const api = studentApi("language");
  await api.push(
    linkA,
    {
      updatedAt: Date.now() - 1000,
      data: { accessLab: 1, data: {} },
      summary: { domains: { writing: 2 }, byUse: { Argue: { writing: 2 } } },
    },
    serverFetch,
  );
  await api.reviewShare(
    linkA,
    { label: "Argue task", text: "Recess should be longer because we focus better." },
    serverFetch,
  );
  localStorage.setItem("accessTeacher:v1:roster", JSON.stringify([{ id: "x|Sol", alias: "Sol" }]));
  localStorage.setItem(
    "accessTeacher:v1:officialResults",
    JSON.stringify({ "x|Sol": [{ year: "2024-25", levels: { Reading: 2.1 }, overall: null }] }),
  );
  localStorage.setItem(
    "accessPracticeLabClass:v1:teacher-classes",
    JSON.stringify([{ code, passcode: created.teacherPasscode, title: "Period 4" }]),
  );

  document.body.innerHTML = '<div id="p"></div>';
  const panel = mountClassPanel(document.querySelector("#p"), {
    S: EN,
    fetchImpl: serverFetch,
    origin: "https://thelanguagepage.test",
  });
  try {
    document.querySelector(".cls-list button").click();
    await settle(120);
    const heat = document.querySelector(".cls-heat-table");
    assert.ok(heat, "heat map table");
    assert.equal(heat.querySelectorAll("tbody tr").length, 2);
    [...heat.querySelectorAll("tbody th button")].find((x) => x.textContent === "Luna").click();
    assert.equal(
      document.querySelector(`[data-student="${a.studentId}"]`).open,
      true,
      "clicking a student opens their details",
    );

    const sol = document.querySelector(`[data-student="${b.studentId}"]`);
    assert.match(sol.textContent, /Prefilled from official results/);
    assert.doesNotMatch(sol.textContent, /2\.1/, "the level is not shown or sent");
    const reading = [...sol.querySelectorAll("select")].find((s) =>
      /Reading/.test(s.getAttribute("aria-label")),
    );
    assert.ok(reading.value, "a stage is proposed");
    const luna = document.querySelector(`[data-student="${a.studentId}"]`);
    const writing = [...luna.querySelectorAll("select")].find((s) =>
      /Writing/.test(s.getAttribute("aria-label")),
    );
    writing.value = "B";
    luna.querySelector("input[type=number]").value = "5";
    [...luna.querySelectorAll("button")]
      .find((x) => /Save starting support/.test(x.textContent))
      .click();
    await settle(80);
    const me = await api.whoAmI(linkA, serverFetch);
    assert.deepEqual(me.support, { stages: { writing: "B" }, roadWeek: 5 });

    const item = document.querySelector(".cls-queue [data-item]");
    assert.ok(item, "the shared writing is in the queue");
    assert.match(item.textContent, /Awaiting feedback/);
    assert.match(item.querySelector("blockquote").textContent, /Recess should be longer/);
    item.querySelector('input[data-dim="task"][value="2"]').checked = true;
    item.querySelector("textarea").value = "Strong reason. Add an example.";
    [...item.querySelectorAll("button")].find((x) => /Mark reviewed/.test(x.textContent)).click();
    await settle(120);
    assert.match(document.querySelector(".cls-queue").textContent, /Reviewed/);
    assert.ok(document.querySelector(".cls-family-print") === null, "nothing printed until asked");
  } finally {
    panel.unmount();
  }

  const reviews = await loadMyReviews({ reviewMine: (l) => api.reviewMine(l, serverFetch) }, linkA);
  assert.equal(reviews.length, 1);
  const card = await feedbackCard(ES, reviews);
  assert.match(card.textContent, /Comentarios de mi maestro/);
  assert.match(card.textContent, /Strong reason\. Add an example\./);
  assert.match(
    card.textContent,
    /Lo que mostraste/,
    "a chip at 'Shows' reads as a strength descriptor",
  );
  assert.doesNotMatch(card.textContent, NO_LEVEL);
  assert.doesNotMatch(card.textContent, /\b[0-3]\s*\/\s*[34]\b/, "no rating number is shown");
});
