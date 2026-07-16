const FORMATS = new Set(["phone", "video", "in-person"]);
const ACTIVE_SLOT_STATUSES = new Set(["open", "held", "booked"]);

function clean(value, maximum) {
  return String(value ?? "").trim().slice(0, maximum);
}

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function iso(value, label) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) fail(`${label} must be a valid date and time.`);
  return date.toISOString();
}

function randomValue(prefix) {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const value = [...bytes].map((item) => item.toString(16).padStart(2, "0")).join("");
  return `${prefix}-${value}`;
}

async function tokenHash(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)]
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
}

export function normalizeSlot(input, now = new Date()) {
  const startAt = iso(input?.startAt, "Start time");
  const durationMinutes = Math.floor(Number(input?.durationMinutes));
  if (![15, 20, 30, 45, 60].includes(durationMinutes))
    fail("Choose a supported meeting duration.");
  if (new Date(startAt).getTime() <= now.getTime() + 5 * 60_000)
    fail("Meeting times must be in the future.");
  const format = clean(input?.format, 20);
  if (!FORMATS.has(format)) fail("Choose a valid meeting format.");
  const locationLabel = clean(input?.locationLabel, 80);
  if (!locationLabel) fail("Add a family-safe location label.");
  return {
    startAt,
    endAt: new Date(new Date(startAt).getTime() + durationMinutes * 60_000).toISOString(),
    durationMinutes,
    format,
    locationLabel,
    status: "open",
  };
}

export function publicSlot(slot) {
  return {
    id: slot.id,
    startAt: slot.startAt,
    endAt: slot.endAt,
    durationMinutes: slot.durationMinutes,
    format: slot.format,
    locationLabel: slot.locationLabel,
  };
}

function normalizeContact(input) {
  const guardianName = clean(input?.guardianName, 80);
  const studentFirstName = clean(input?.studentFirstName, 40);
  const email = clean(input?.email, 160).toLowerCase();
  const note = clean(input?.note, 400);
  if (!guardianName || !studentFirstName) fail("Add the family and student's first name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Add a valid email address.");
  return { guardianName, studentFirstName, email, note };
}

function overlaps(a, b) {
  return new Date(a.startAt) < new Date(b.endAt) && new Date(b.startAt) < new Date(a.endAt);
}

export function createMemorySchedulerStore(options = {}) {
  const now = options.now ?? (() => new Date());
  const id = options.id ?? randomValue;
  const makeToken = options.token ?? (() => randomValue("meeting"));
  const slots = structuredClone(options.slots ?? []);
  const requests = structuredClone(options.requests ?? []);

  const findSlot = (slotId) => slots.find((slot) => slot.id === slotId);
  const findRequest = (requestId) => requests.find((item) => item.id === requestId);
  const reopen = (request) => {
    const slot = findSlot(request.slotId);
    if (slot && new Date(slot.startAt) > now() && slot.status !== "cancelled") slot.status = "open";
  };

  return {
    async createSlot(input) {
      const candidate = input.endAt ? { ...input } : normalizeSlot(input, now());
      if (slots.some((item) => ACTIVE_SLOT_STATUSES.has(item.status) && overlaps(item, candidate)))
        fail("This time overlaps another active meeting slot.", 409);
      const slot = { ...candidate, id: id("slot"), createdAt: now().toISOString() };
      slots.push(slot);
      return structuredClone(slot);
    },
    async listPublic() {
      return slots
        .filter((slot) => slot.status === "open" && new Date(slot.startAt) > now())
        .sort((a, b) => a.startAt.localeCompare(b.startAt))
        .map(publicSlot);
    },
    async requestSlot(input) {
      if (input?.website) fail("Request could not be submitted.");
      const slot = findSlot(clean(input?.slotId, 80));
      if (!slot || slot.status !== "open" || new Date(slot.startAt) <= now())
        fail("That meeting time is no longer available.", 409);
      if (input?.consent !== true) fail("Please confirm the scheduling notice.");
      const request = {
        id: id("request"),
        slotId: slot.id,
        ...normalizeContact(input),
        source: "family",
        status: "pending",
        createdAt: now().toISOString(),
      };
      slot.status = "held";
      requests.push(request);
      return structuredClone(request);
    },
    async decide(requestId, action) {
      const request = findRequest(requestId);
      if (!request || !["pending", "confirmed"].includes(request.status))
        fail("Meeting request was not found.", 404);
      const slot = findSlot(request.slotId);
      if (action === "confirm") {
        request.status = "confirmed";
        if (slot) slot.status = "booked";
      } else if (action === "decline") {
        request.status = "declined";
        reopen(request);
      } else if (action === "cancel") {
        request.status = "cancelled";
        reopen(request);
      } else if (action === "complete" && request.status === "confirmed") {
        request.status = "completed";
        if (slot) slot.status = "completed";
      } else fail("Choose a valid meeting decision.");
      return structuredClone(request);
    },
    async cancelSlot(slotId) {
      const slot = findSlot(slotId);
      if (!slot || slot.status !== "open") fail("Only an open time can be cancelled.", 409);
      slot.status = "cancelled";
      return structuredClone(slot);
    },
    async invite(input) {
      const slot = findSlot(clean(input?.slotId, 80));
      if (!slot || slot.status !== "open") fail("That meeting time is no longer available.", 409);
      const token = makeToken();
      const request = {
        id: id("request"),
        slotId: slot.id,
        ...normalizeContact(input),
        source: "teacher",
        status: "invited",
        tokenHash: await tokenHash(token),
        tokenExpiresAt: new Date(now().getTime() + 7 * 86_400_000).toISOString(),
        tokenUsedAt: null,
        createdAt: now().toISOString(),
      };
      slot.status = "held";
      requests.push(request);
      return { ...structuredClone(request), token };
    },
    async respond(token, action) {
      const hash = await tokenHash(clean(token, 200));
      const request = requests.find((item) => item.tokenHash === hash);
      if (
        !request ||
        request.tokenUsedAt ||
        request.status !== "invited" ||
        new Date(request.tokenExpiresAt) <= now()
      )
        fail("This meeting link is invalid, expired, or already used.", 410);
      request.tokenUsedAt = now().toISOString();
      if (action === "accept") {
        request.status = "confirmed";
        findSlot(request.slotId).status = "booked";
      } else if (action === "decline") {
        request.status = "declined";
        reopen(request);
      } else fail("Choose accept or decline.");
      return { status: request.status, slot: publicSlot(findSlot(request.slotId)) };
    },
    async dashboard() {
      return structuredClone({ slots, requests });
    },
    exportState() {
      return structuredClone({ slots, requests });
    },
  };
}

async function readJson(request) {
  const source = await request.text();
  if (source.length > 16_000) fail("Request is too large.", 413);
  try {
    return JSON.parse(source || "{}");
  } catch {
    fail("Request must be valid JSON.");
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function handleSchedulerRequest(context, store, access) {
  const path = Array.isArray(context.params?.path) ? context.params.path[0] : context.params?.path;
  const method = context.request.method.toUpperCase();
  try {
    if (path === "schedule-availability" && method === "GET")
      return json({ ok: true, slots: await store.listPublic() });
    if (path === "schedule-request" && method === "POST") {
      const meetingRequest = await store.requestSlot(await readJson(context.request));
      return json(
        { ok: true, reference: meetingRequest.id, status: meetingRequest.status },
        201,
      );
    }
    if (path === "schedule-response" && method === "POST") {
      const body = await readJson(context.request);
      return json({ ok: true, ...(await store.respond(body.meeting, body.action)) });
    }
    if (!access?.accessConfigured)
      return json({ ok: false, error: "access-not-configured" }, 503);
    if (!access?.hasTeacherAccess) return json({ ok: false, error: "unauthorized" }, 401);
    if (path === "schedule-dashboard" && method === "GET")
      return json({ ok: true, ...(await store.dashboard()) });
    if (path === "schedule-slot" && method === "POST")
      return json({ ok: true, slot: await store.createSlot(await readJson(context.request)) }, 201);
    if (path === "schedule-decision" && method === "POST") {
      const body = await readJson(context.request);
      if (body.slotId)
        return json({ ok: true, slot: await store.cancelSlot(body.slotId) });
      return json({
        ok: true,
        request: await store.decide(body.requestId, body.action),
      });
    }
    if (path === "schedule-invitation" && method === "POST") {
      const invitation = await store.invite(await readJson(context.request));
      return json(
        {
          ok: true,
          requestId: invitation.id,
          responsePath: `/curriculum/family-connections/?meeting=${encodeURIComponent(invitation.token)}`,
        },
        201,
      );
    }
    return json({ ok: false, error: "method-not-allowed" }, 405);
  } catch (error) {
    return json({ ok: false, error: error.message }, error.status || 400);
  }
}
