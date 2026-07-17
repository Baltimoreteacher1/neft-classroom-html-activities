import { sendMeetingNotification } from "../../functions/api/family-connections/meeting-notification.js";

const MAX_BODY_BYTES = 16_000;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/send") {
      return json({ ok: false, error: "not-found" }, 404);
    }
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > MAX_BODY_BYTES)
      return json({ ok: false, error: "request-too-large" }, 413);
    const source = await request.text();
    if (source.length > MAX_BODY_BYTES) return json({ ok: false, error: "request-too-large" }, 413);
    try {
      const meetingRequest = JSON.parse(source || "{}");
      return json(await sendMeetingNotification(env.FAMILY_MEETING_EMAIL, meetingRequest));
    } catch {
      return json({ ok: false, error: "notification-failed" }, 502);
    }
  },
};
