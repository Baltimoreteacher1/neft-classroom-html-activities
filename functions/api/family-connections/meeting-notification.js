export const FAMILY_MEETING_NOTIFICATION_RECIPIENT = "jdneft@bcps.k12.md.us";

const SENDER = {
  email: "family-connections@eduwonderlab.com",
  name: "EduWonderLab Family Connections",
};
const TIME_ZONE = "America/New_York";
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function meetingTime(slot) {
  const start = new Date(slot.startAt);
  const end = new Date(slot.endAt);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    throw new Error("Meeting notification requires a valid start and end time.");
  }
  return {
    date: dateFormatter.format(start),
    time: `${timeFormatter.format(start)}–${timeFormatter.format(end)} ET`,
  };
}

export function buildMeetingNotification(meetingRequest) {
  const { date, time } = meetingTime(meetingRequest.slot);
  const note = meetingRequest.note || "No note provided.";
  const fields = [
    ["When", `${date}, ${time}`],
    ["Location", meetingRequest.slot.locationLabel],
    ["Parent or guardian", meetingRequest.guardianName],
    ["Student", meetingRequest.studentFirstName],
    ["Family email", meetingRequest.email],
    ["Note", note],
    ["Confirmation", meetingRequest.id],
  ];
  const text = [
    "A family meeting was booked.",
    "",
    ...fields.map(([label, value]) => `${label}: ${value}`),
    "",
    "Reply to this message to contact the family.",
  ].join("\n");
  const htmlRows = fields
    .map(
      ([label, value]) =>
        `<tr><th align="left" valign="top" style="padding:4px 12px 4px 0">${escapeHtml(label)}</th><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return {
    to: FAMILY_MEETING_NOTIFICATION_RECIPIENT,
    from: SENDER,
    replyTo: meetingRequest.email,
    subject: `Family meeting booked — ${date} at ${timeFormatter.format(new Date(meetingRequest.slot.startAt))}`,
    text,
    html: `<p>A family meeting was booked.</p><table>${htmlRows}</table><p>Reply to this message to contact the family.</p>`,
  };
}

export async function sendMeetingNotification(emailBinding, meetingRequest) {
  if (!emailBinding || typeof emailBinding.send !== "function") {
    return { sent: false, reason: "email-binding-unavailable" };
  }
  const result = await emailBinding.send(buildMeetingNotification(meetingRequest));
  return { sent: true, messageId: result.messageId };
}

export async function requestMeetingNotification(emailService, meetingRequest) {
  if (!emailService || typeof emailService.fetch !== "function") {
    return { sent: false, reason: "email-service-unavailable" };
  }
  const response = await emailService.fetch(
    new Request("https://family-meeting-email.internal/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(meetingRequest),
    }),
  );
  if (!response.ok) throw new Error("Meeting notification service rejected the request.");
  return response.json();
}
