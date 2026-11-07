// The Language Page x class platform (docs/class-platform.md): join by code, cross-device sync of lab evidence,
// assignments, the live class quiz, voice notes and the teacher panel, driven against the REAL /api/class Function
// over node:sqlite with JSDOM mounts of the real views (no mock server).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://thelanguagepage.test/access-practice-lab/class?class=ZZZZZZ",
});
for (const k of [
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "navigator",
  "HTMLElement",
  "Event",
  "MediaRecorder",
]) {
  Object.defineProperty(globalThis, k, {
    value: k === "window" ? dom.window : dom.window[k],
    configurable: true,
    writable: true,
  });
}
Object.defineProperty(globalThis, "location", { value: dom.window.location, configurable: true });

const { onRequest } = await import("../functions/api/class/[[path]].js");
const labLink = await import("../access-practice-lab/src/class/link.js");
const classView = await import("../access-practice-lab/src/views/class.js");
const quizView = await import("../access-practice-lab/src/views/class-quiz.js");
const { mountClassPanel } = await import("../access-practice-lab/src/class/roster-panel.js");
const { sendTake, loadVoiceNotes } = await import("../access-practice-lab/src/class/voice.js");
const { saveRecord, PREFIX } = await import("../access-practice-lab/src/store.js");
const { loadQuizKey } = await import("../access-practice-lab/src/class/quiz-key.js");

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

const KEY = "k-test";
const env = { DB: d1(new DatabaseSync(":memory:")), TEACHER_KEY: KEY };
let ip = 0;
const ROOT = new URL("../", import.meta.url);
/** fetch(): /api/class goes to the real Function, everything else is served from the repo. */
async function serverFetch(input, init = {}) {
  const url = new URL(input, "https://thelanguagepage.test");
  if (!url.pathname.startsWith("/api/class/")) {
    try {
      const body = readFileSync(new URL(`.${decodeURIComponent(url.pathname)}`, ROOT));
      return new Response(body, { headers: { "content-type": "application/json" } });
    } catch {
      return new Response("not found", { status: 404 });
    }
  }
  const headers = new Headers(init.headers || {});
  headers.set("CF-Connecting-IP", `10.8.0.${++ip % 250}`);
  const request = new Request(url, { method: init.method || "GET", headers, body: init.body });
  return onRequest({
    request,
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

const settle = async (n = 30) => {
  for (let i = 0; i < n; i++) await new Promise((r) => setTimeout(r, 0));
};
const ctx = { prefs: { lang: "en" }, band: "6-8", route: { view: "class" } };
const ctxEs = { ...ctx, prefs: { lang: "es" } };
const mountView = async (view, c = ctx) => {
  document.body.innerHTML = view
    .render(c)
    .html.toString()
    .replace(/^\[object Object\]/, "");
  const out = view.render(c);
  const { toHtml } = await import("../access-practice-lab/src/util.js");
  document.body.innerHTML = toHtml(out.html);
  view.mount(document.body, c);
  await settle();
};
const type = (sel, value) => {
  const node = document.querySelector(sel);
  node.value = value;
  return node;
};

let code;
let record;

test("join by code (from the QR link) and an alias, then the student key is shown once", async () => {
  const created = await teacher("create", { app: "language", title: "Period 3 ELD" });
  code = created.code;
  dom.reconfigure({ url: `https://thelanguagepage.test/access-practice-lab/class?class=${code}` });
  await mountView(classView);
  assert.equal(document.querySelector("#clsCode").value, code, "the QR link prefills the code");
  type("#clsAlias", "Maria Luz Gonzalez Perez");
  document
    .querySelector(".cls-join")
    .dispatchEvent(new dom.window.Event("submit", { cancelable: true }));
  await settle();
  assert.match(
    document.querySelector(".cls-error")?.textContent || "x",
    /two words|dos palabras/i === 0 ? /x/ : /nickname/i,
  );
  type("#clsAlias", "Orbit");
  document
    .querySelector(".cls-join")
    .dispatchEvent(new dom.window.Event("submit", { cancelable: true }));
  await settle(60);
  const link = labLink.loadLink();
  assert.equal(link.code, code);
  assert.match(document.body.textContent, new RegExp(link.studentKey), "the key is shown once");
  assert.equal(
    localStorage.getItem("accessPracticeLabClass:v1:link").includes(link.studentKey),
    true,
  );
  assert.equal(
    Object.keys(labLink.makeBackup().data).some((k) => k.includes("Class")),
    false,
    "the key never enters the progress copy",
  );
});

test("local progress syncs to the class and a second device merges it (cross-device evidence)", async () => {
  record = {
    complete: ["read-main-idea"],
    answers: { "read-main-idea": "a" },
    results: {
      "read-main-idea": { date: new Date().toISOString(), correct: true, practiced: true },
    },
  };
  saveRecord("6-8", "Reading", "A", record);
  await teacher("settings", {
    code,
    settings: {
      assignments: [
        {
          id: "read-main-idea",
          title: "Main idea",
          path: "/access-practice-lab/Reading/A/read-main-idea",
        },
      ],
    },
  });
  const link = labLink.loadLink();
  const sync = labLink.startSync({});
  labLink.setAssignments([{ id: "read-main-idea" }]);
  sync.markDirty();
  await sync.push();
  await settle();
  const roster = await teacher(`roster?code=${code}`);
  const summary = roster.students[0].docs.language.summary;
  assert.deepEqual(summary.assignmentsDone, ["read-main-idea"]);
  assert.equal(summary.domains.reading, 1);
  // Second device: empty storage, rejoin with alias + key, pull.
  labLink.stopSync();
  localStorage.clear();
  const { joinClass } = await import("../shared/class-platform/client.js");
  const again = await joinClass({ code, alias: "Orbit", studentKey: link.studentKey });
  assert.equal(again.ok, true);
  labLink.saveLink({
    code,
    studentId: again.studentId,
    studentKey: link.studentKey,
    alias: "Orbit",
  });
  const second = labLink.startSync({});
  assert.equal(await second.pull(), "restore");
  assert.deepEqual(
    JSON.parse(
      localStorage.getItem(`${PREFIX}:6-8:Reading:A`) ||
        localStorage.getItem(`${PREFIX}:Reading:A`),
    ).complete,
    ["read-main-idea"],
  );
  labLink.stopSync();
});

test("the student view lists assignments with Done marks and Spanish copy", async () => {
  await mountView(classView, ctxEs);
  assert.match(document.body.textContent, /Práctica asignada/);
  assert.match(document.body.textContent, /Hecho/);
  assert.match(document.body.textContent, /Salir de la clase/);
  classView.unmount();
});

test("live quiz: the learner answers once, the server judges, the class sees accuracy only", async () => {
  const key = await loadQuizKey();
  const ids = Object.keys(key.items)
    .filter((id) => key.items[id].domain === "Reading")
    .slice(0, 2);
  const opened = await teacher("room/open", {
    code,
    kind: "quiz",
    config: { title: "Reading", itemIds: ids },
  });
  await teacher("room/control", { code, roomId: opened.roomId, status: "live" });
  await mountView(quizView);
  await settle(80);
  const buttons = [...document.querySelectorAll(".cls-option")];
  assert.ok(buttons.length >= 2, "the bank item renders its options");
  const right = key.items[ids[0]].answer;
  buttons.find((b) => b.dataset.opt === right).click();
  await settle(60);
  assert.match(document.querySelector(".cls-feedback").textContent, /Right\./);
  assert.ok(
    [...document.querySelectorAll(".cls-option")].every((b) => b.disabled),
    "an answer is final",
  );
  const state = await teacher(`room/detail?code=${code}&roomId=${opened.roomId}`);
  assert.equal(state.classScore, 1);
  assert.equal(
    /seconds|deadline|countdown/i.test(document.querySelector("[data-cls-progress]").textContent),
    false,
    "untimed",
  );
  assert.equal(
    document.querySelectorAll("time, [role=timer], progress").length,
    0,
    "no clock or countdown on the page",
  );
  quizView.unmount();
  await teacher("room/control", { code, roomId: opened.roomId, status: "ended" });
});

test("voice notes: the learner sends a recording, the teacher answers, the learner hears it on their device", async () => {
  const link = labLink.loadLink();
  const bytes = new Uint8Array(2000).fill(7);
  const sent = await sendTake(link, {
    blob: new Blob([bytes], { type: "audio/webm" }),
    type: "audio/webm",
    label: "Speaking task",
  });
  assert.equal(sent.ok, true, JSON.stringify(sent));
  const { createTeacherClient } = await import("../shared/class-platform/client.js");
  const t = createTeacherClient({ code, siteKey: () => KEY });
  const listed = await t.audioList();
  assert.equal(listed.items.length, 1);
  assert.equal((await t.audioBlob(sent.audioId)).size, 2000);
  const { toBase64 } = await import("../access-practice-lab/src/class/dom.js");
  const note = await t.audioNote({
    parentId: sent.audioId,
    label: "Nice linking words",
    mime: "audio/webm",
    data: await toBase64(new Blob([bytes])),
  });
  assert.equal(note.ok, true, JSON.stringify(note));
  const mine = await loadVoiceNotes(link);
  assert.deepEqual(mine.map((i) => i.kind).sort(), ["note", "recording"]);
  await mountView(classView);
  await settle(60);
  assert.match(document.body.textContent, /Nice linking words/);
  assert.ok(document.querySelector(".cls-note audio"), "a player for the teacher's note");
  classView.unmount();
});

test("teacher panel: create a class with the teacher key, see the roster and the quiz and voice sections", async () => {
  document.body.innerHTML = '<div id="p"></div>';
  const panel = mountClassPanel(document.querySelector("#p"), {
    S: (en, es) => es,
    fetchImpl: serverFetch,
    origin: "https://thelanguagepage.test",
  });
  assert.match(document.body.textContent, /Crear una clase/, "Spanish copy");
  type("#ctKey", KEY);
  type("#ctTitle", "Period 5");
  document
    .querySelector("#ctTitle")
    .form.dispatchEvent(new dom.window.Event("submit", { cancelable: true }));
  await settle(80);
  assert.match(document.body.textContent, /Cuestionario de clase en vivo/);
  assert.match(document.body.textContent, /Grabaciones y notas de voz/);
  assert.ok(document.querySelector(".cls-qr svg"), "a join QR");
  assert.match(document.body.textContent, /Todavía no hay estudiantes/);
  panel.unmount();
});

test("AI second look: authored categories only, rule-based fallback when no model answers", async () => {
  const { askSecondLook } = await import("../access-practice-lab/src/class/ai-feedback.js");
  const { MOVES } = await import("../access-practice-lab/src/lang/purpose.js");
  const draft =
    "Plants need water because they drink it. The soil was dry and he goed home yesterday.";
  const none = await askSecondLook(draft, "Explain", serverFetch);
  assert.deepEqual(
    none,
    { ok: false, offline: true },
    "no model: the browser keeps the rule-based coach",
  );
  const move = MOVES.Explain[0];
  env.AI = {
    run: async () => ({ response: `{"move":"${move.id}","patterns":["not-a-pattern"]}` }),
  };
  try {
    const out = await askSecondLook(draft, "Explain", serverFetch);
    assert.equal(out.ok, true);
    assert.equal(out.move.ask, move.ask, "the learner reads the lab's own wording");
    assert.deepEqual(out.patterns, [], "an id the lab never authored is dropped");
  } finally {
    env.AI = undefined;
  }
});
