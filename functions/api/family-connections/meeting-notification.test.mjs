import assert from "node:assert/strict";
import {
  FAMILY_MEETING_NOTIFICATION_RECIPIENT,
  buildMeetingNotification,
  sendMeetingNotification,
} from "./meeting-notification.js";

const meetingRequest = {
  id: "request-123",
  guardianName: "Jordan & <Family>",
  studentFirstName: "Sam",
  email: "family@example.com",
  note: "Please discuss <study routines> & homework.",
  slot: {
    startAt: "2026-09-04T20:00:00.000Z",
    endAt: "2026-09-04T20:20:00.000Z",
    locationLabel: "Online meeting",
  },
};

const message = buildMeetingNotification(meetingRequest);
assert.equal(FAMILY_MEETING_NOTIFICATION_RECIPIENT, "jdneft@bcps.k12.md.us");
assert.equal(message.to, FAMILY_MEETING_NOTIFICATION_RECIPIENT);
assert.equal(message.replyTo, "family@example.com");
assert.match(message.subject, /Family meeting booked/);
assert.match(message.subject, /Sep 4/);
assert.match(message.text, /Jordan & <Family>/);
assert.match(message.text, /Sam/);
assert.match(message.text, /4:00/);
assert.match(message.html, /Jordan &amp; &lt;Family&gt;/);
assert.match(message.html, /&lt;study routines&gt; &amp; homework/);
assert.doesNotMatch(message.html, /Jordan & <Family>/);

const sent = [];
const result = await sendMeetingNotification(
  {
    async send(payload) {
      sent.push(payload);
      return { messageId: "email-123" };
    },
  },
  meetingRequest,
);
assert.deepEqual(result, { sent: true, messageId: "email-123" });
assert.equal(sent.length, 1);
assert.deepEqual(await sendMeetingNotification(undefined, meetingRequest), {
  sent: false,
  reason: "email-binding-unavailable",
});

console.log("Family meeting notification tests passed.");
