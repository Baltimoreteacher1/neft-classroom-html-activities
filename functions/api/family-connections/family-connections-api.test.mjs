import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createDefaultSnapshot } from "../../../curriculum/family-connections/shared/model.js";
import { createMemoryStore, handleFamilyConnectionsRequest } from "./[[path]].js";

const store = createMemoryStore();

function request(method, path, body) {
  return new Request(`https://eduwonderlab.com/api/family-connections/${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function invoke(method, path, body, hasTeacherAccess = false) {
  return handleFamilyConnectionsRequest(
    { request: request(method, path, body), env: {}, params: { path: [path] } },
    store,
    { accessConfigured: true, hasTeacherAccess },
  );
}

const publicResponse = await invoke("GET", "published");
assert.equal(publicResponse.status, 200);
const publicBody = await publicResponse.json();
assert.deepEqual(Object.keys(publicBody).sort(), ["ok", "published"]);
assert.equal("draft" in publicBody, false);
assert.equal("history" in publicBody, false);

assert.equal((await invoke("GET", "draft")).status, 401);
assert.equal((await invoke("GET", "history")).status, 401);
assert.equal((await invoke("PUT", "draft", createDefaultSnapshot())).status, 401);
assert.equal((await invoke("POST", "publish")).status, 401);

const invalid = createDefaultSnapshot();
invalid.sections[0].week.days[0].lessonId = "not-a-lesson";
invalid.sections[0].week.days[0].status = "lesson";
assert.equal((await invoke("PUT", "draft", invalid, true)).status, 400);

const unsafe = createDefaultSnapshot();
unsafe.integrations.classDojoUrl = "javascript:alert(1)";
assert.equal((await invoke("PUT", "draft", unsafe, true)).status, 400);

const unsafeResource = createDefaultSnapshot();
unsafeResource.resources = [{ id: "bad", title: "Unsafe", url: "javascript:alert(1)", visible: true }];
assert.equal((await invoke("PUT", "draft", unsafeResource, true)).status, 400);

const unknownFields = createDefaultSnapshot();
unknownFields.studentRecords = [{ name: "Must not persist" }];
assert.equal((await invoke("PUT", "draft", unknownFields, true)).status, 400);

const draft = createDefaultSnapshot();
draft.sections[0].week.label = "September 8-12";
draft.sections[0].week.days[0] = {
  day: "Monday",
  status: "lesson",
  lessonId: "1-1",
  note: "Prime factorization",
};
const saveResponse = await invoke("PUT", "draft", draft, true);
assert.equal(saveResponse.status, 200);
const saved = await saveResponse.json();
assert.equal(saved.draft.revision, 1);

const stale = structuredClone(draft);
stale.revision = 0;
assert.equal((await invoke("PUT", "draft", stale, true)).status, 409);

const publishResponse = await invoke("POST", "publish", undefined, true);
assert.equal(publishResponse.status, 200);
const published = (await publishResponse.json()).published;
assert.equal(published.revision, 2);
assert.ok(published.publishedAt);

const afterPublish = await (await invoke("GET", "published")).json();
assert.equal(afterPublish.published.sections[0].week.label, "September 8-12");
assert.equal("draft" in afterPublish, false);

const history = await (await invoke("GET", "history", undefined, true)).json();
assert.equal(history.history.length, 1);
assert.equal(history.history[0].revision, 0);

const noGate = await handleFamilyConnectionsRequest(
  { request: request("PUT", "draft", draft), env: {}, params: { path: ["draft"] } },
  createMemoryStore(),
  { accessConfigured: false, hasTeacherAccess: false },
);
assert.equal(noGate.status, 503, "protected writes must fail closed without access control");

const middleware = await readFile(new URL("../../_middleware.js", import.meta.url), "utf8");
assert.match(middleware, /isFamilyPublishingApi/);
assert.match(middleware, /teacherAccessConfigured/);
assert.match(middleware, /teacherAuthorized/);

console.log("Family Connections API tests passed.");
