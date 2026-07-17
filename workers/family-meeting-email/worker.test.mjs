import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import worker from "./worker.js";

const sent = [];
const meetingRequest = {
  id: "request-123",
  guardianName: "Jordan Family",
  studentFirstName: "Sam",
  email: "family@example.com",
  note: "Please discuss study routines.",
  slot: {
    startAt: "2026-09-04T20:00:00.000Z",
    endAt: "2026-09-04T20:20:00.000Z",
    locationLabel: "Online meeting",
  },
};

const response = await worker.fetch(
  new Request("https://family-meeting-email.internal/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(meetingRequest),
  }),
  {
    FAMILY_MEETING_EMAIL: {
      async send(message) {
        sent.push(message);
        return { messageId: "email-123" };
      },
    },
  },
);
assert.equal(response.status, 200);
assert.deepEqual(await response.json(), { sent: true, messageId: "email-123" });
assert.equal(sent[0].to, "jdneft@bcps.k12.md.us");
assert.equal((await worker.fetch(new Request("https://family-meeting-email.internal/"), {})).status, 404);

const workerConfig = await readFile(new URL("./wrangler.toml", import.meta.url), "utf8");
assert.match(workerConfig, /workers_dev\s*=\s*false/);
assert.match(workerConfig, /name\s*=\s*"FAMILY_MEETING_EMAIL"/);
assert.match(workerConfig, /destination_address\s*=\s*"jdneft@bcps\.k12\.md\.us"/);

const pagesConfig = await readFile(new URL("../../wrangler.toml", import.meta.url), "utf8");
assert.match(pagesConfig, /binding\s*=\s*"FAMILY_MEETING_EMAIL_SERVICE"/);
assert.match(pagesConfig, /service\s*=\s*"neft-family-meeting-email"/);
assert.doesNotMatch(pagesConfig, /\[\[send_email\]\]/);

console.log("Family meeting email Worker tests passed.");
