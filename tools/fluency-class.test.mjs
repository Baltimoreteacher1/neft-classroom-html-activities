// Fluency Lab x class platform: the client half of docs/class-platform.md, driven against the REAL /api/class
// Function over node:sqlite (no mock server), plus JSDOM mounts of the My class card, the live room page, the
// teacher dashboard and the family digest. Covers #21 (opt-in join + cloud sync), #22 (who needs help now),
// #25 (class goal meter), #26 (family digest), #23/#24/#27 (live rooms).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://eduwonderlab.test/math/fluency-lab/",
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
globalThis.__FLUENCY_LIVE_TEST__ = true;
globalThis.__FLUENCY_CLASS_TEST__ = true;

const { onRequest } = await import("../functions/api/class/[[path]].js");
const link = await import("../math/fluency-lab/class-link.js");
const { mountClassLink } = await import("../math/fluency-lab/class-link-view.js");
const { mountLive, roomProblem } = await import("../math/fluency-lab/class/live.js");
const { needsHelpNow, rosterRowsHtml } = await import("../math/fluency-lab/class/teacher.js");
const { digestHtml, loadDigest } = await import("../math/fluency-lab/class/family.js");
const { setLang, ES } = await import("../math/fluency-lab/i18n.js");

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
/** fetch() routed into the real Pages Function. */
async function serverFetch(input, init = {}) {
  const url = new URL(input, "https://eduwonderlab.test");
  const headers = new Headers(init.headers || {});
  headers.set("CF-Connecting-IP", `10.9.0.${++ip % 250}`);
  const request = new Request(url, { method: init.method || "GET", headers, body: init.body });
  const parts = url.pathname.replace(/^\/api\/class\//, "").split("/");
  return onRequest({ request, env, params: { path: parts } });
}
const teacherCall = async (path, body) =>
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

const tick = () => new Promise((r) => setTimeout(r, 0));
const settle = async (n = 20) => {
  for (let i = 0; i < n; i++) await tick();
};

test("summary carries counts, mastered skills and needs-teacher hand-offs, never the work", () => {
  const now = Date.UTC(2026, 10, 6, 15);
  const day = 24 * 3600 * 1000;
  const recent = Array.from({ length: 10 }, (_, i) => ({
    at: now - (i % 3) * day - i * 1000,
    correct: true,
    independent: true,
    level: 1,
  }));
  const s = link.fluencySummary({
    now,
    grade: 3,
    activeSkill: "3:mul-0-5",
    tutor: {
      records: {
        "3:mul-0-5": { recent },
        "3:add-1": { recent: [{ at: now - 30 * day, correct: false, independent: true }] },
        junk: { recent },
      },
    },
    interventions: {
      states: {
        "3:add-1": {
          key: "3:add-1",
          stage: "needs-teacher",
          handoff: { reason: "reassess-failed" },
        },
        "3:x": { key: "3:x", stage: "guided-practice" },
      },
    },
  });
  assert.equal(s.grade, 3);
  assert.deepEqual(s.needsTeacher, [{ skill: "3:add-1", why: "reassess-failed" }]);
  assert.equal(s.weekIndependent, 10);
  assert.equal(s.weekDays, 3);
  assert.equal(s.practiced, 3);
  assert.equal(JSON.stringify(s).includes("recent"), false);
});

test("merge decision: silent restore only onto an empty device, otherwise ask", () => {
  assert.equal(link.mergeDecision({ remoteAt: 0, link: {}, hasLocalProgress: true }), "none");
  assert.equal(
    link.mergeDecision({ remoteAt: 50, link: { syncedAt: 50 }, hasLocalProgress: true }),
    "none",
  );
  assert.equal(
    link.mergeDecision({
      remoteAt: 90,
      link: { syncedAt: 50, dirtyAt: 40 },
      hasLocalProgress: false,
    }),
    "restore",
  );
  assert.equal(
    link.mergeDecision({
      remoteAt: 90,
      link: { syncedAt: 50, dirtyAt: 60 },
      hasLocalProgress: true,
    }),
    "ask",
  );
  assert.equal(
    link.mergeDecision({
      remoteAt: 90,
      link: { syncedAt: 50, dirtyAt: 95 },
      hasLocalProgress: true,
    }),
    "none",
  );
});

let classCode;
let passcode;
test("#21: join from the card, progress follows the learner to a second device", async () => {
  const created = await teacherCall("create", { app: "fluency", title: "Room 204" });
  classCode = created.code;
  passcode = created.teacherPasscode;
  await teacherCall("settings", {
    code: classCode,
    settings: { goal: { metric: "mastered-skills", target: 10, label: "Skills on our own" } },
  });

  // Device A: a learner with progress joins via the QR link.
  localStorage.clear();
  const host = document.createElement("aside");
  document.body.append(host);
  let backup = {
    grade: 3,
    tutor: { records: { "3:mul-0-5": { recent: [] } } },
    marker: "device-A",
  };
  const deps = {
    fetchImpl: serverFetch,
    location: new URL(
      `https://eduwonderlab.test/math/fluency-lab/?class=${classCode.toLowerCase()}`,
    ),
    getBackup: () => backup,
    getSummary: () => ({ grade: 3, mastered: ["3:mul-0-5"] }),
    hasLocalProgress: () => true,
    applyBackup: (raw) => {
      backup = raw;
    },
    downloadCurrent: () => {},
  };
  const sync = mountClassLink(host, deps);
  assert.equal(
    host.querySelector('input[name="code"]').value,
    classCode,
    "the QR link prefills the code",
  );
  host.querySelector('input[name="alias"]').value = "Comet";
  host.querySelector("form").dispatchEvent(new window.Event("submit", { cancelable: true }));
  await settle(60);
  const saved = link.loadLink();
  assert.equal(saved.alias, "Comet");
  assert.match(host.textContent, /Room 204/);
  assert.match(host.querySelector(".cl-key").textContent, /^[A-Z2-9]{8}$/);
  assert.match(host.textContent, /Skills on our own — 0 of 10/, "#25 goal meter shows on the card");
  sync.markDirty();
  await sync.push();
  assert.ok(link.loadLink().syncedAt > 0, "pushed");
  sync.stop();

  // Device B: empty, rejoins with nickname + student key -> class copy restores silently.
  const keyA = saved.studentKey;
  localStorage.clear();
  host.replaceChildren();
  let restored = null;
  const syncB = mountClassLink(host, {
    ...deps,
    location: new URL("https://eduwonderlab.test/math/fluency-lab/"),
    hasLocalProgress: () => false,
    applyBackup: (raw) => (restored = raw),
  });
  host.querySelector('input[name="code"]').value = classCode;
  host.querySelector('input[name="alias"]').value = "comet";
  host.querySelector('input[name="studentKey"]').value = keyA.toLowerCase();
  host.querySelector("form").dispatchEvent(new window.Event("submit", { cancelable: true }));
  await settle(80);
  assert.equal(restored?.marker, "device-A", "the class copy came to device B");
  assert.equal(link.loadLink().studentId, saved.studentId);
  syncB.stop();
});

test("#22 + #25: teacher roster shows who needs help now", async () => {
  const s = link.loadLink();
  await link.pushProgress(
    s,
    {
      updatedAt: Date.now(),
      data: { x: 1 },
      summary: {
        grade: 3,
        mastered: ["3:mul-0-5"],
        needsTeacher: [{ skill: "3:mul-0-5", why: "reassess-failed" }],
      },
    },
    serverFetch,
  );
  const roster = await (
    await serverFetch(`/api/class/roster?code=${classCode}`, {
      headers: { "x-class-teacher": passcode },
    })
  ).json();
  const help = needsHelpNow(roster.students);
  assert.equal(help[0].alias, "Comet");
  assert.match(rosterRowsHtml(roster.students), /Comet/);
  assert.equal(roster.goal.value, 1);
});

test("#26: the family digest renders from synced data in English and Spanish", async () => {
  const s = link.loadLink();
  const me = await link.whoAmI(s, serverFetch);
  const url = new URL(link.digestUrl("https://eduwonderlab.test", s, me.familyToken, "es"));
  assert.equal(url.pathname, "/math/fluency-lab/class/family.html");
  const d = await loadDigest(url.search, serverFetch);
  assert.equal(d.ok, true);
  setLang("en", { persist: false });
  const en = digestHtml(d);
  assert.match(en, /Comet/);
  assert.match(en, /The teacher is helping with/);
  setLang("es", { persist: false });
  const es = digestHtml(d);
  assert.match(es, /Comet/);
  assert.doesNotMatch(es, /The teacher is helping with|Can do on their own|Try at home/);
  setLang("en", { persist: false });
  const bad = await loadDigest("?code=AAAAAA&student=s0000000000&token=x", serverFetch);
  assert.equal(bad.ok, false);
});

test("#23/#24: live room page follows the teacher, generates the same problem, wall is anonymous", async () => {
  const open = await teacherCall("room/open", {
    code: classCode,
    kind: "game",
    config: { skill: "mul-0-5", grade: 3, count: 4, teams: 2 },
  });
  assert.equal(open.ok, true);
  const a = roomProblem(open.state.config, 2);
  const b = roomProblem(open.state.config, 2);
  assert.equal(a.question, b.question, "same problem on every device");
  document.body.innerHTML =
    '<main id="live-root"><p id="live-status"></p><div id="live-extra"></div><div id="live-stage"></div></main>';
  const live = mountLive(document.querySelector("#live-root"), {
    fetchImpl: serverFetch,
    location: new URL(`https://x.test/?room=${open.roomId}`),
  });
  await settle(40);
  assert.match(document.querySelector("#live-status").textContent, /Waiting for your teacher/);
  await teacherCall("room/control", { code: classCode, roomId: open.roomId, status: "live" });
  await live.tick();
  await settle(20);
  const item = roomProblem(open.state.config, 0);
  assert.equal(document.querySelector(".live-question").textContent, item.question);
  assert.equal(/second|timer|countdown/i.test(document.body.textContent), false, "untimed");
  document.querySelector("#live-answer").value = item.answers[0];
  document
    .querySelector("#live-stage form")
    .dispatchEvent(new window.Event("submit", { cancelable: true }));
  await settle(40);
  await teacherCall("room/control", { code: classCode, roomId: open.roomId, reveal: true });
  await live.tick();
  await settle(20);
  assert.match(document.querySelector("#live-extra").textContent, /Class score: 1/);
  assert.equal(document.querySelector("#live-extra").textContent.includes("Comet"), false);
  live.stop();
});

test("#27: workspace room sends the student's work to the teacher only", async () => {
  const open = await teacherCall("room/open", {
    code: classCode,
    kind: "workspace",
    config: { skill: "mul-0-5", grade: 3 },
  });
  await teacherCall("room/control", { code: classCode, roomId: open.roomId, status: "live" });
  const s = link.loadLink();
  const res = await link.roomWorkspace(
    s,
    { roomId: open.roomId, workspace: { item: 0, lines: ["3 x 4", "= 12"] } },
    serverFetch,
  );
  assert.equal(res.ok, true);
  const detail = await teacherCall(`room/detail?code=${classCode}&roomId=${open.roomId}`);
  assert.deepEqual(detail.responses[0].workspace.lines, ["3 x 4", "= 12"]);
});

test("every new learner-facing string has Spanish", () => {
  const files = [
    "class-link-view.js",
    "class/live.js",
    "class/teacher.js",
    "class/family.js",
    "class/teacher.html",
    "class/live.html",
    "class/family.html",
  ].map((f) => readFileSync(new URL(`../math/fluency-lab/${f}`, import.meta.url), "utf8"));
  const missing = [];
  for (const src of files) {
    for (const m of src.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g))
      if (!(m[1] in ES)) missing.push(m[1]);
    for (const m of src.matchAll(/data-i18n>([^<]+)</g))
      if (!(m[1].trim() in ES)) missing.push(m[1].trim());
  }
  assert.deepEqual(missing, []);
});
