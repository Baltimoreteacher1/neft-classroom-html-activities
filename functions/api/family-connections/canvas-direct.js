import { parseCanvasCourseUrl } from "../../../curriculum/family-connections/shared/model.js";

const FAMILY_URL = "https://eduwonderlab.com/curriculum/family-connections/#family-scheduler";

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

export function parseDirectCanvasTarget(value, allowedHosts = "") {
  const connection = parseCanvasCourseUrl(value);
  if (!connection) fail("Use a secure Canvas course URL.");
  const url = new URL(connection.courseUrl);
  const configured = String(allowedHosts)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const allowed = url.hostname.endsWith(".instructure.com") || configured.includes(url.hostname);
  if (!allowed) fail("This Canvas host is not in the allowed school host list.");
  if (url.port && url.port !== "443") fail("Canvas must use the standard secure port.");
  return { ...connection, origin: url.origin };
}

async function canvasRequest(target, accessToken, path, init = {}, fetchImpl = fetch) {
  const token = String(accessToken ?? "").trim();
  if (token.length < 10 || token.length > 4000) fail("Add a valid Canvas access token.");
  const response = await fetchImpl(`${target.origin}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) fail(body.message || `Canvas returned ${response.status}.`, response.status);
  return body;
}

export async function testCanvasConnection(target, accessToken, fetchImpl = fetch) {
  const course = await canvasRequest(
    target,
    accessToken,
    `/api/v1/courses/${encodeURIComponent(target.courseId)}`,
    {},
    fetchImpl,
  );
  return {
    id: String(course.id ?? target.courseId),
    name: String(course.name ?? "Canvas course").slice(0, 120),
    host: target.host,
  };
}

export async function publishCanvasAnnouncement(
  target,
  accessToken,
  announcement,
  fetchImpl = fetch,
) {
  const form = new URLSearchParams({
    title: String(announcement.title ?? "Family Connections update").slice(0, 120),
    message: String(announcement.message ?? "").slice(0, 8000),
    is_announcement: "true",
    published: "true",
    lock_comment: "true",
  });
  return canvasRequest(
    target,
    accessToken,
    `/api/v1/courses/${encodeURIComponent(target.courseId)}/discussion_topics`,
    { method: "POST", body: form },
    fetchImpl,
  );
}

export async function syncCanvasAvailability(
  target,
  accessToken,
  slots,
  existing = {},
  fetchImpl = fetch,
) {
  const mappings = { ...existing };
  const activeSlotIds = new Set(slots.map((slot) => slot.id));
  for (const [slotId, eventId] of Object.entries(existing)) {
    if (activeSlotIds.has(slotId)) continue;
    await canvasRequest(
      target,
      accessToken,
      `/api/v1/calendar_events/${encodeURIComponent(eventId)}`,
      { method: "DELETE" },
      fetchImpl,
    );
    delete mappings[slotId];
  }
  for (const slot of slots.slice(0, 40)) {
    const form = new URLSearchParams({
      "calendar_event[context_code]": `course_${target.courseId}`,
      "calendar_event[title]": "Family meeting availability",
      "calendar_event[description]": `Families can request this time at <a href="${FAMILY_URL}">Family Connections</a>. A request is not confirmed until the teacher approves it.`,
      "calendar_event[start_at]": slot.startAt,
      "calendar_event[end_at]": slot.endAt,
      "calendar_event[location_name]": slot.locationLabel,
      "calendar_event[time_zone_edited]": "America/New_York",
    });
    const eventId = existing[slot.id];
    const event = await canvasRequest(
      target,
      accessToken,
      eventId
        ? `/api/v1/calendar_events/${encodeURIComponent(eventId)}`
        : "/api/v1/calendar_events",
      { method: eventId ? "PUT" : "POST", body: form },
      fetchImpl,
    );
    mappings[slot.id] = String(event.id ?? eventId);
  }
  return mappings;
}

async function readBody(request) {
  const source = await request.text();
  if (source.length > 20_000) fail("Canvas request is too large.", 413);
  try {
    return JSON.parse(source || "{}");
  } catch {
    fail("Canvas request must be valid JSON.");
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function loadMappings(db) {
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS family_canvas_meeting_sync (slot_id TEXT PRIMARY KEY, canvas_event_id TEXT NOT NULL, updated_at TEXT NOT NULL)",
    )
    .run();
  const rows = await db
    .prepare("SELECT slot_id, canvas_event_id FROM family_canvas_meeting_sync")
    .all();
  return Object.fromEntries((rows.results ?? []).map((row) => [row.slot_id, row.canvas_event_id]));
}

async function saveMappings(db, mappings) {
  const statements = [db.prepare("DELETE FROM family_canvas_meeting_sync")];
  for (const [slotId, eventId] of Object.entries(mappings)) {
    statements.push(
      db
        .prepare(
          "INSERT INTO family_canvas_meeting_sync (slot_id, canvas_event_id, updated_at) VALUES (?,?,?)",
        )
        .bind(slotId, eventId, new Date().toISOString()),
    );
  }
  await db.batch(statements);
}

export async function handleCanvasDirectRequest(context, services, access) {
  if (!access?.accessConfigured) return json({ ok: false, error: "access-not-configured" }, 503);
  if (!access?.hasTeacherAccess) return json({ ok: false, error: "unauthorized" }, 401);
  try {
    const body = await readBody(context.request);
    const target = parseDirectCanvasTarget(body.courseUrl, context.env.CANVAS_ALLOWED_HOSTS);
    if (context.params.path[0] === "canvas-connect") {
      return json({
        ok: true,
        course: await testCanvasConnection(target, body.accessToken, services.fetchImpl),
      });
    }
    if (context.params.path[0] !== "canvas-sync")
      return json({ ok: false, error: "not-found" }, 404);
    if (body.action === "announcement") {
      const result = await publishCanvasAnnouncement(
        target,
        body.accessToken,
        { title: body.title, message: body.message },
        services.fetchImpl,
      );
      return json({ ok: true, action: "announcement", canvasId: String(result.id ?? "") });
    }
    if (body.action === "availability") {
      const slots = await services.schedulerStore.listPublic();
      const existing = await loadMappings(context.env.DB);
      const mappings = await syncCanvasAvailability(
        target,
        body.accessToken,
        slots,
        existing,
        services.fetchImpl,
      );
      await saveMappings(context.env.DB, mappings);
      return json({ ok: true, action: "availability", synced: slots.length });
    }
    return json({ ok: false, error: "unsupported-canvas-action" }, 400);
  } catch (error) {
    return json({ ok: false, error: error.message }, error.status || 400);
  }
}
