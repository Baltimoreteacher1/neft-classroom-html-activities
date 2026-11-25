/* Tests for /api/class/experience/* — publishing a compiled experience to a class. The REAL endpoint runs against a
 * REAL SQL engine (node:sqlite) behind the same thin D1 adapter as class.test.mjs, and the definition it stores is
 * the one the REAL compiler makes from the ecosystem sample. */

import assert from "node:assert/strict";
import test from "node:test";

import { compileExperience, studentCopy } from "../../../access-practice-lab/src/compiler/compile.js";
import { sampleInput } from "../../../access-practice-lab/src/compiler/sample-ecosystem.js";
import { validateMission } from "../../../access-practice-lab/src/sim/schema.js";
import { validateSettings } from "../../../shared/class-platform/contract.js";
import {
  EXPERIENCE_ID_RE,
  EXPERIENCE_LIMITS,
  experiencePath,
} from "../../_lib/class-platform/experiences.js";
import { onRequest } from "./[[path]].js";
import { freshDb } from "../../../tools/privacy-d1-fake.mjs";

function d1(sqlite) {
  const make = (sql, params) => ({
    bind: (...next) => make(sql, next),
    async first() {
      return sqlite.prepare(sql).get(...params) ?? null;
    },
    async all() {
      return { results: sqlite.prepare(sql).all(...params) };
    },
    async run() {
      const r = sqlite.prepare(sql).run(...params);
      return { success: true, meta: { changes: Number(r.changes) } };
    },
  });
  return {
    prepare: (sql) => make(sql, []),
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const out = [];
        for (const s of statements) out.push(await s.run());
        sqlite.exec("COMMIT");
        return out;
      } catch (err) {
        sqlite.exec("ROLLBACK");
        throw err;
      }
    },
  };
}

const KEY = "teacher-secret-for-tests";
let ip = 0;
const world = () => {
  const sqlite = freshDb();
  return { sqlite, env: { DB: d1(sqlite), TEACHER_KEY: KEY } };
};

async function call(w, route, { method = "GET", body, query = "", headers = {} } = {}) {
  const h = { "CF-Connecting-IP": `10.4.${Math.floor(++ip / 250)}.${ip % 250}`, ...headers };
  if (body !== undefined) h["Content-Type"] = "application/json";
  const request = new Request(`https://example.test/api/class/${route}${query}`, {
    method,
    headers: h,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const res = await onRequest({ request, env: w.env, params: { path: route.split("/") } });
  const type = res.headers.get("Content-Type") || "";
  return { status: res.status, json: type.includes("json") ? await res.json() : null };
}

const teacher = { "x-teacher-key": KEY };
const as = (s) => ({ "x-class-student": `${s.studentId}.${s.studentKey}` });
const post = (w, route, headers, body) => call(w, route, { method: "POST", headers, body });

async function setup() {
  const w = world();
  const c = await post(w, "create", teacher, { app: "language", title: "P4" });
  assert.equal(c.status, 200);
  const kid = (await post(w, "join", {}, { code: c.json.code, alias: "Comet" })).json;
  return { w, code: c.json.code, passcode: c.json.teacherPasscode, kid };
}

const sample = () => {
  const out = compileExperience(sampleInput());
  assert.equal(out.ok, true, JSON.stringify(out.report.errors));
  return out.def;
};

test("publish → get → unpublish round trip; the stored definition is the playable student copy", async () => {
  const { w, code } = await setup();
  const def = sample();
  const pub = await post(w, "experience/publish", teacher, { code, def });
  assert.equal(pub.status, 200, JSON.stringify(pub.json));
  const { id, path } = pub.json;
  assert.match(id, EXPERIENCE_ID_RE);
  assert.match(id, /^x[a-z0-9]{8,12}$/);
  assert.equal(path, experiencePath(id));

  // A learner reads it with no key at all (an assigned link opens before the device has joined).
  const got = await call(w, "experience/get", { query: `?id=${id}` });
  assert.equal(got.status, 200);
  assert.equal(got.json.def.id, `x-${id.slice(1)}`);
  assert.equal(validateMission(got.json.def).ok, true);
  assert.equal(got.json.def.scenes.length, def.scenes.length);
  assert.equal(got.json.def.source, undefined, "the instructor's raw text is not sent to learners");
  assert.equal(got.json.def.compiled, undefined, "the compiler's notes are not sent to learners");
  assert.doesNotMatch(JSON.stringify(got.json), new RegExp(KEY));

  const list = await call(w, "experience/list", { query: `?code=${code}`, headers: teacher });
  assert.deepEqual(list.json.experiences.map((e) => e.id), [id]);

  const gone = await post(w, "experience/unpublish", teacher, { code, id });
  assert.equal(gone.status, 200);
  assert.equal((await call(w, "experience/get", { query: `?id=${id}` })).status, 404);
  assert.equal((await post(w, "experience/unpublish", teacher, { code, id })).status, 404);
});

test("show source keeps the text; republishing the same id updates in place", async () => {
  const { w, code } = await setup();
  const def = sample();
  const first = await post(w, "experience/publish", teacher, { code, def, showSource: true });
  const got = await call(w, "experience/get", { query: `?id=${first.json.id}` });
  assert.equal(got.json.def.source.text, def.source.text);
  const edited = structuredClone(def);
  edited.title = ["Investigation: Edited", "Investigación: Editada"];
  const again = await post(w, "experience/publish", teacher, { code, def: edited, id: first.json.id });
  assert.equal(again.json.id, first.json.id);
  const after = await call(w, "experience/get", { query: `?id=${first.json.id}` });
  assert.equal(after.json.def.title[0], "Investigation: Edited");
  assert.equal(after.json.def.source, undefined);
  // A local draft id the server has never seen simply gets a server id.
  const fresh = await post(w, "experience/publish", teacher, { code, def, id: "xlocaldraft1" });
  assert.notEqual(fresh.json.id, "xlocaldraft1");
});

test("auth: a student cannot publish, unpublish or list; the class passcode can; another class cannot overwrite", async () => {
  const { w, code, passcode, kid } = await setup();
  const def = sample();
  assert.equal((await post(w, "experience/publish", as(kid), { code, def })).status, 401);
  assert.equal((await post(w, "experience/publish", {}, { code, def })).status, 401);
  assert.equal((await post(w, "experience/publish", { "x-teacher-key": "wrong" }, { code, def })).status, 401);
  const pub = await post(w, "experience/publish", { "x-class-teacher": passcode }, { code, def });
  assert.equal(pub.status, 200);
  assert.equal((await post(w, "experience/unpublish", as(kid), { code, id: pub.json.id })).status, 401);
  assert.equal((await call(w, "experience/list", { query: `?code=${code}`, headers: as(kid) })).status, 401);

  const other = await post(w, "create", teacher, { app: "language", title: "Other" });
  const steal = await post(w, "experience/publish", { "x-class-teacher": other.json.teacherPasscode }, { code: other.json.code, def, id: pub.json.id });
  assert.equal(steal.status, 403);
  assert.equal((await post(w, "experience/unpublish", { "x-class-teacher": other.json.teacherPasscode }, { code: other.json.code, id: pub.json.id })).status, 404);
});

test("refused: oversized, invalid, not an object, a bad id", async () => {
  const { w, code } = await setup();
  const def = sample();
  const big = structuredClone(def);
  big.evidence[0].body = ["x".repeat(EXPERIENCE_LIMITS.maxBytes), "x"];
  const tooBig = await post(w, "experience/publish", teacher, { code, def: big });
  assert.equal(tooBig.status, 413);
  assert.equal(tooBig.json.error, "definition-too-large");

  const broken = structuredClone(def);
  broken.scenes[0].hotspots[0].opens = { evidence: "ev-missing" };
  const bad = await post(w, "experience/publish", teacher, { code, def: broken });
  assert.equal(bad.status, 400);
  assert.equal(bad.json.error, "invalid-definition");
  assert.match(bad.json.details.join(" "), /ev-missing/);

  const noTask = structuredClone(def);
  noTask.tasks = noTask.tasks.filter((t) => !["speak", "write", "revise"].includes(t.type));
  assert.equal((await post(w, "experience/publish", teacher, { code, def: noTask })).status, 400);

  for (const junk of [null, "text", [], 7])
    assert.equal((await post(w, "experience/publish", teacher, { code, def: junk })).status, 400);
  assert.equal((await call(w, "experience/get", { query: "?id=../../etc" })).status, 400);
  assert.equal((await call(w, "experience/get", { query: "?id=xnotthere12" })).status, 404);
  assert.equal((await post(w, "experience/unpublish", teacher, { code, id: "nope" })).status, 400);
  const list = await call(w, "experience/list", { query: `?code=${code}`, headers: teacher });
  assert.equal(list.json.experiences.length, 0, "nothing refused was stored");
});

test("text is cleaned: control characters are removed before the definition is stored", async () => {
  const { w, code } = await setup();
  const def = sample();
  def.scenes[0].description = ["A pond\u0000 at dawn\u0007.", "Un estanque\u0000 al amanecer."];
  const pub = await post(w, "experience/publish", teacher, { code, def });
  const got = await call(w, "experience/get", { query: `?id=${pub.json.id}` });
  assert.equal(got.json.def.scenes[0].description[0], "A pond at dawn.");
});

test("assignment integration: the published id and path satisfy the class assignment contract", async () => {
  const { w, code } = await setup();
  const pub = await post(w, "experience/publish", teacher, { code, def: sample() });
  const assignment = { id: pub.json.id, title: pub.json.title, path: pub.json.path, due: null };
  assert.match(assignment.id, /^[a-z0-9][a-z0-9:_-]{0,39}$/);
  assert.match(assignment.path, /^\/[\w\-./?=&%]{0,200}$/);
  const checked = validateSettings({ assignments: [assignment] }, "language");
  assert.equal(checked.ok, true);
  assert.equal(checked.settings.assignments[0].path, pub.json.path);
  const saved = await post(w, "settings", teacher, { code, settings: { assignments: [assignment] } });
  assert.equal(saved.status, 200);
  const info = await call(w, "info", { query: `?code=${code}` });
  assert.equal(info.json.assignments[0].path, `/access-practice-lab/simulations/x/${pub.json.id}`);
});

test("deleting the class deletes its experiences; the student copy helper matches what the server stores", async () => {
  const { w, code } = await setup();
  const def = sample();
  const pub = await post(w, "experience/publish", teacher, { code, def });
  const stored = (await call(w, "experience/get", { query: `?id=${pub.json.id}` })).json.def;
  assert.deepEqual({ ...stored, id: def.id }, studentCopy(def));
  assert.equal((await post(w, "delete", teacher, { code, confirm: code })).status, 200);
  assert.equal((await call(w, "experience/get", { query: `?id=${pub.json.id}` })).status, 404);
  assert.equal(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_platform_experience").get().n, 0);
});
