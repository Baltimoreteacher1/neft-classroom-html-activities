import assert from "node:assert/strict";
import { test } from "node:test";
import { createDefaultSnapshot } from "../../../curriculum/family-connections/shared/model.js";
import { createMemoryStore, handleFamilyConnectionsRequest } from "./[[path]].js";

function invoke(store, method, path, body, authorized = false) {
  return handleFamilyConnectionsRequest({
    request: new Request(`https://eduwonderlab.com/api/family-connections/${path}`, {
      method, headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }), env: {}, params: { path: [path] },
  }, store, { accessConfigured: true, hasTeacherAccess: authorized });
}
async function save(store, snapshot) {
  snapshot.revision = (await store.read()).draft.revision;
  const response = await invoke(store, "PUT", "draft", snapshot, true);
  assert.equal(response.status, 200);
  return (await response.json()).draft;
}
function plan(start) {
  const value = createDefaultSnapshot();
  value.sections[0].week.startDate = start;
  Object.assign(value.sections[0].week.days[0], { status: "lesson", lessonId: "3-2" });
  return value;
}

test("public archive keeps current assignments through future-week revisions and never includes unsaved drafts", async () => {
  const store = createMemoryStore();
  await save(store, plan("2026-09-28"));
  assert.equal((await invoke(store, "POST", "publish", undefined, true)).status, 200);
  for (let i = 0; i < 7; i++) {
    const next = plan("2026-10-05");
    next.sections[0].week.note = `Published update ${i}`;
    await save(store, next);
    assert.equal((await invoke(store, "POST", "publish", undefined, true)).status, 200);
  }
  const privateDraft = plan("2026-10-12");
  privateDraft.sections[0].week.note = "Unpublished draft";
  await save(store, privateDraft);
  const body = await (await invoke(store, "GET", "published")).json();
  assert.deepEqual(body.weeks.map((item) => item.week.startDate), ["2026-10-05", "2026-09-28"]);
  assert.match(body.weeks[0].week.note, /update 6/);
  assert.doesNotMatch(JSON.stringify(body), /Unpublished draft/);
  assert.equal((await invoke(store, "GET", "history")).status, 401);
  assert.equal((await invoke(store, "GET", "draft")).status, 401);
});

test("server refuses invalid week starts and due dates even if preview is bypassed", async () => {
  const store = createMemoryStore();
  const invalid = plan("2026-09-29");
  await save(store, invalid);
  let response = await invoke(store, "POST", "publish", undefined, true);
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Monday/);
  invalid.sections[0].week.startDate = "2026-09-28";
  invalid.sections[0].week.days[0].dueDate = "2026-09-25";
  await save(store, invalid);
  response = await invoke(store, "POST", "publish", undefined, true);
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /cannot precede/);
  assert.equal((await store.read()).published.publishedAt, null);
});

test("pending and explicit no-homework statuses survive save/publication without losing revision protection", async () => {
  const store = createMemoryStore();
  const value = plan("2026-09-28");
  value.sections[0].week.days[1].status = "no-class";
  const draft = await save(store, value);
  assert.equal((await invoke(store, "POST", "publish", { expectedRevision: draft.revision - 1 }, true)).status, 409);
  assert.equal((await invoke(store, "POST", "publish", { expectedRevision: draft.revision }, true)).status, 200);
  const publicBody = await (await invoke(store, "GET", "published")).json();
  assert.equal(publicBody.weeks[0].week.days[1].status, "no-class");
  assert.equal(publicBody.weeks[0].week.days[2].status, "pending");
});
