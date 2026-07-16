import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { onRequest as applySiteAccess } from "../../_middleware.js";
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
    {
      request: request(method, path, body),
      env: {},
      params: { path: [path.split("?")[0]] },
    },
    store,
    { accessConfigured: true, hasTeacherAccess },
  );
}

const publicResponse = await invoke("GET", "published");
assert.equal(publicResponse.status, 200);
assert.equal(publicResponse.headers.get("cache-control"), "no-store");
const publicBody = await publicResponse.json();
assert.deepEqual(Object.keys(publicBody).sort(), ["ok", "published"]);
assert.equal("draft" in publicBody, false);
assert.equal("history" in publicBody, false);

const canvasFeedResponse = await invoke("GET", "canvas-feed?section=all-families");
assert.equal(canvasFeedResponse.status, 200);
assert.match(canvasFeedResponse.headers.get("content-type"), /application\/rss\+xml/);
const canvasFeed = await canvasFeedResponse.text();
assert.match(canvasFeed, /<rss version="2\.0"/);
assert.match(canvasFeed, /Family Connections/);
assert.match(canvasFeed, /Optional family practice/);
assert.doesNotMatch(canvasFeed, /draft|history|studentRecords/);
assert.equal((await invoke("GET", "canvas-feed?section=missing-class")).status, 404);

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
const publicFeedThroughGate = await applySiteAccess({
  request: request("GET", "canvas-feed?section=all-families"),
  env: {},
  data: {},
  next: async () => new Response("next"),
});
assert.equal(publicFeedThroughGate.status, 200, "Canvas must be able to poll the published feed");
assert.match(middleware, /teacherAccessConfigured/);
assert.match(middleware, /teacherAuthorized/);

console.log("Family Connections API tests passed.");
