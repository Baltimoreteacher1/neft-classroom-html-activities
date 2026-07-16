import { downloadCalendarEvent } from "../calendar-event.js";

const ROOT = "/api/family-connections";
const byId = (id) => document.getElementById(id);
let dashboard = { availabilityRules: [], slots: [], requests: [] };

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

function appendEmpty(root, message) {
  if (!root.childElementCount) root.append(node("p", "schedule-empty", message));
}

function meetingCard(request, slot) {
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
      actionButton("Mark complete", "complete", request.id),
      actionButton("Cancel meeting", "cancel", request.id),
    );
  if (request.status === "confirmed" && slot) {
    const calendar = node("button", "text-button", "Add to calendar");
    calendar.type = "button";
    calendar.addEventListener("click", () =>
      downloadCalendarEvent(slot, {
        reference: request.id,
        url: `${location.origin}/curriculum/family-connections/teacher/`,
      }),
    );
    actions.append(calendar);
  }
  card.append(actions);
  return card;
}

function editRule(rule) {
  const form = byId("availability-rule-form");
  for (const [key, value] of Object.entries(rule)) {
    if (!form.elements[key] || key === "weekdays") continue;
    if (form.elements[key].type === "checkbox") form.elements[key].checked = Boolean(value);
    else form.elements[key].value = value;
  }
  for (const checkbox of form.querySelectorAll('[name="weekdays"]'))
    checkbox.checked = rule.weekdays.includes(Number(checkbox.value));
  byId("cancel-rule-edit").hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "center" });
  form.querySelector('[name="startTime"]').focus({ preventScroll: true });
}

async function mutateRule(method, body, message) {
  status("Updating availability…");
  try {
    await api("schedule-rule", { method, body: JSON.stringify(body) });
    resetRuleForm();
    await loadDashboard();
    status(message, "success");
  } catch (error) {
    status(error.message, "error");
  }
}

function renderRules() {
  const root = byId("availability-rules");
  root.replaceChildren();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (const rule of dashboard.availabilityRules ?? []) {
    const card = node("article", "availability-rule-card");
    card.append(
      node("span", `meeting-status-badge status-${rule.enabled ? "open" : "cancelled"}`, rule.enabled ? "active" : "paused"),
      node("h4", "", rule.weekdays.map((day) => dayNames[day]).join(", ")),
      node("p", "", `${rule.startTime}–${rule.endTime} Eastern · ${rule.durationMinutes} min + ${rule.bufferMinutes} min buffer`),
      node("p", "", `${rule.activeStartDate} through ${rule.activeEndDate} · ${rule.locationLabel}`),
    );
    const actions = node("div", "meeting-card-actions");
    const edit = node("button", "text-button", "Edit");
    edit.type = "button";
    edit.addEventListener("click", () => editRule(rule));
    const toggle = node("button", "text-button", rule.enabled ? "Pause" : "Resume");
    toggle.type = "button";
    toggle.addEventListener("click", () =>
      mutateRule("PUT", { ...rule, enabled: !rule.enabled }, rule.enabled ? "Rule paused." : "Rule resumed."),
    );
    const remove = node("button", "text-button destructive-action", "Delete rule");
    remove.type = "button";
    remove.addEventListener("click", () => {
      if (window.confirm(`Delete availability for ${rule.weekdays.map((day) => dayNames[day]).join(", ")}? Confirmed meetings will stay scheduled.`))
        mutateRule("DELETE", { id: rule.id }, "Availability rule deleted.");
    });
    actions.append(edit, toggle, remove);
    card.append(actions);
    root.append(card);
  }
  appendEmpty(root, "No repeating availability yet. Add your first rule above.");
}

function renderDashboard() {
  renderRules();
  const upcoming = byId("meeting-upcoming");
  const openRoot = byId("meeting-open");
  const history = byId("meeting-history");
  upcoming.replaceChildren();
  openRoot.replaceChildren();
  history.replaceChildren();
  const slotById = new Map(dashboard.slots.map((slot) => [slot.id, slot]));
  for (const request of dashboard.requests) {
    const slot = slotById.get(request.slotId);
    const isUpcoming = request.status === "confirmed" && slot && new Date(slot.startAt) > new Date();
    (isUpcoming ? upcoming : history).append(meetingCard(request, slot));
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
    openRoot.append(card);
  }
  appendEmpty(upcoming, "No upcoming confirmed meetings.");
  appendEmpty(openRoot, "No open times. Refresh your rules or add availability.");
  appendEmpty(history, "No past or closed meetings.");

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

function inputDate(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function resetRuleForm() {
  const form = byId("availability-rule-form");
  form.reset();
  form.elements.id.value = "";
  form.elements.startTime.value = "16:00";
  form.elements.endTime.value = "18:00";
  form.elements.locationLabel.value = "Online meeting";
  form.elements.activeStartDate.value = inputDate(new Date());
  form.elements.activeEndDate.value = inputDate(new Date(Date.now() + 42 * 86_400_000));
  byId("cancel-rule-edit").hidden = true;
}

byId("availability-rule-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  data.weekdays = [...form.querySelectorAll('[name="weekdays"]:checked')].map((item) =>
    Number(item.value),
  );
  data.durationMinutes = Number(data.durationMinutes);
  data.bufferMinutes = Number(data.bufferMinutes);
  data.enabled = form.elements.enabled.checked;
  await mutateRule(data.id ? "PUT" : "POST", data, data.id ? "Availability rule updated." : "Availability rule added.");
});

byId("cancel-rule-edit").addEventListener("click", resetRuleForm);
byId("refresh-generated-slots").addEventListener("click", async () => {
  status("Refreshing the next 42 days…");
  try {
    const result = await api("schedule-refresh", { method: "POST", body: "{}" });
    await loadDashboard();
    status(`${result.generatedCount} open times are ready.`, "success");
  } catch (error) {
    status(error.message, "error");
  }
});

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
    await loadDashboard();
    status("Available time posted.", "success");
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
    await loadDashboard();
    status("Private invitation link created. Copy it into ClassDojo or email.", "success");
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
resetRuleForm();
loadDashboard();
