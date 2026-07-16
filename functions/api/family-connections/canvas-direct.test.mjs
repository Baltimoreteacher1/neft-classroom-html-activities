import assert from "node:assert/strict";
import {
  parseDirectCanvasTarget,
  handleCanvasDirectRequest,
  publishCanvasAnnouncement,
  syncCanvasAvailability,
  testCanvasConnection,
} from "./canvas-direct.js";

const target = parseDirectCanvasTarget("https://school.instructure.com/courses/2468/modules");
assert.equal(target.host, "school.instructure.com");
assert.equal(target.courseId, "2468");
assert.throws(() => parseDirectCanvasTarget("https://example.com/courses/1"), /allowed/i);
assert.throws(() => parseDirectCanvasTarget("http://school.instructure.com/courses/1"), /secure/i);

const calls = [];
const fakeFetch = async (url, init = {}) => {
  calls.push({ url: String(url), init });
  const body = String(url).includes("calendar_events") ? { id: 909 } : { id: 2468, name: "Math 6" };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

const connected = await testCanvasConnection(target, "session-token", fakeFetch);
assert.deepEqual(connected, { id: "2468", name: "Math 6", host: "school.instructure.com" });
assert.equal(calls[0].init.headers.authorization, "Bearer session-token");

await publishCanvasAnnouncement(
  target,
  "session-token",
  { title: "Family update", message: "This week's learning is ready." },
  fakeFetch,
);
assert.match(calls[1].url, /courses\/2468\/discussion_topics$/);
assert.match(calls[1].init.body.toString(), /is_announcement=true/);
assert.match(calls[1].init.body.toString(), /published=true/);

const mappings = await syncCanvasAvailability(
  target,
  "session-token",
  [
    {
      id: "slot-1",
      startAt: "2026-09-03T20:00:00.000Z",
      endAt: "2026-09-03T20:20:00.000Z",
      locationLabel: "Online meeting",
    },
  ],
  {},
  fakeFetch,
);
assert.deepEqual(mappings, { "slot-1": "909" });
assert.match(calls[2].init.body.toString(), /calendar_event%5Bcontext_code%5D=course_2468/);
assert.doesNotMatch(JSON.stringify({ connected, mappings }), /session-token/);

const connectResponse = await handleCanvasDirectRequest(
  {
    request: new Request("https://eduwonderlab.com/api/family-connections/canvas-connect", {
      method: "POST",
      body: JSON.stringify({
        courseUrl: "https://school.instructure.com/courses/2468",
        accessToken: "session-token",
      }),
    }),
    params: { path: ["canvas-connect"] },
    env: {},
  },
  { fetchImpl: fakeFetch },
  { accessConfigured: true, hasTeacherAccess: true },
);
assert.equal(connectResponse.status, 200);
assert.doesNotMatch(await connectResponse.text(), /session-token/);

console.log("Direct Canvas connection tests passed.");
