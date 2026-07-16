const ROOT = "/api/family-connections";
const byId = (id) => document.getElementById(id);
let dashboard = { slots: [], requests: [] };

const dateTime = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
});

function status(message, tone = "") {
  byId("teacher-meeting-status").textContent = message;
  byId("teacher-meeting-status").dataset.tone = tone;
}

async function api(path, options = {}) {
  const response = await fetch(`${ROOT}/${path}`, {
    cache: "no-store",
    headers: { accept: "application/json", "content-type": "application/json" },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Scheduling request failed.");
  return body;
}

const node = (tag, className, text) => {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
};

function actionButton(label, action, requestId) {
  const button = node("button", "text-button", label);
  button.type = "button";
  button.addEventListener("click", () => decide({ requestId, action }));
  return button;
}

function renderDashboard() {
  const root = byId("teacher-meeting-dashboard");
  root.replaceChildren();
  const slotById = new Map(dashboard.slots.map((slot) => [slot.id, slot]));
  for (const request of dashboard.requests) {
    const slot = slotById.get(request.slotId);
    const card = node("article", "teacher-meeting-card");
    const heading = node("div", "meeting-card-heading");
    heading.append(
      node("strong", "", slot ? dateTime.format(new Date(slot.startAt)) : "Time unavailable"),
      node("span", `meeting-status-badge status-${request.status}`, request.status),
    );
    card.append(
      heading,
      node("h4", "", `${request.guardianName} · ${request.studentFirstName}`),
      node("a", "meeting-contact", request.email),
    );
    card.querySelector("a").href = `mailto:${request.email}`;
    if (request.note) card.append(node("p", "meeting-note-text", request.note));
    const actions = node("div", "meeting-card-actions");
    if (request.status === "pending")
      actions.append(
        actionButton("Confirm", "confirm", request.id),
        actionButton("Decline", "decline", request.id),
      );
    if (request.status === "confirmed")
      actions.append(
        actionButton("Complete", "complete", request.id),
        actionButton("Cancel", "cancel", request.id),
      );
    card.append(actions);
    root.append(card);
  }
  for (const slot of dashboard.slots.filter((item) => item.status === "open")) {
    const card = node("article", "teacher-meeting-card open-slot-card");
    card.append(
      node("span", "meeting-status-badge status-open", "open"),
      node("h4", "", dateTime.format(new Date(slot.startAt))),
      node("p", "", `${slot.durationMinutes} minutes · ${slot.locationLabel}`),
    );
    const cancel = node("button", "text-button", "Remove available time");
    cancel.type = "button";
    cancel.addEventListener("click", () => decide({ slotId: slot.id }));
    card.append(cancel);
    root.append(card);
  }
  if (!root.childElementCount)
    root.append(node("p", "schedule-empty", "No meeting times or requests yet."));

  const select = byId("teacher-invitation-slot");
  select.replaceChildren();
  const open = dashboard.slots.filter((slot) => slot.status === "open");
  for (const slot of open) {
    const option = node("option", "", dateTime.format(new Date(slot.startAt)));
    option.value = slot.id;
    select.append(option);
  }
  select.disabled = !open.length;
  byId("teacher-invitation-form").querySelector('[type="submit"]').disabled = !open.length;
}

async function loadDashboard() {
  try {
    dashboard = await api("schedule-dashboard");
    renderDashboard();
    status("Meeting desk is up to date.", "success");
  } catch (error) {
    status(error.message, "error");
  }
}

async function decide(body) {
  status("Updating meeting…");
  try {
    await api("schedule-decision", { method: "POST", body: JSON.stringify(body) });
    await loadDashboard();
  } catch (error) {
    status(error.message, "error");
  }
}

byId("teacher-slot-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  data.startAt = new Date(`${data.date}T${data.time}`).toISOString();
  delete data.date;
  delete data.time;
  data.durationMinutes = Number(data.durationMinutes);
  try {
    await api("schedule-slot", { method: "POST", body: JSON.stringify(data) });
    form.reset();
    status("Available time posted.", "success");
    await loadDashboard();
  } catch (error) {
    status(error.message, "error");
  }
});

byId("teacher-invitation-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const result = await api("schedule-invitation", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    byId("teacher-invitation-link").value = new URL(result.responsePath, location.origin).href;
    byId("teacher-invitation-result").hidden = false;
    status("Private invitation link created. Copy it into ClassDojo or email.", "success");
    await loadDashboard();
  } catch (error) {
    status(error.message, "error");
  }
});

byId("copy-teacher-invitation").addEventListener("click", async () => {
  const input = byId("teacher-invitation-link");
  try {
    await navigator.clipboard.writeText(input.value);
    status("Invitation link copied.", "success");
  } catch {
    input.select();
    status("Invitation link selected. Use your device's copy command.");
  }
});

byId("refresh-meeting-dashboard").addEventListener("click", loadDashboard);
loadDashboard();
