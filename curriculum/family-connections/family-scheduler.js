const API = "/api/family-connections";
const byId = (id) => document.getElementById(id);

const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "short",
  day: "numeric",
  timeZone: "America/New_York",
});
const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
});

function setStatus(message, tone = "") {
  const status = byId("meeting-status");
  status.textContent = message;
  status.dataset.tone = tone;
}

async function api(path, options = {}) {
  const response = await fetch(`${API}/${path}`, {
    cache: "no-store",
    headers: { accept: "application/json", "content-type": "application/json" },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "The scheduling service is unavailable.");
  return body;
}

function slotLabel(slot) {
  return `${dateFormat.format(new Date(slot.startAt))} at ${timeFormat.format(new Date(slot.startAt))}`;
}

function renderSlots(slots) {
  const root = byId("meeting-slots");
  root.replaceChildren();
  if (!slots.length) {
    setStatus("No meeting times are posted right now. Please use ClassDojo to suggest a time.");
    return;
  }
  setStatus(`${slots.length} ${slots.length === 1 ? "time is" : "times are"} available.`);
  for (const slot of slots) {
    const card = document.createElement("article");
    card.className = "meeting-slot-card";
    const date = document.createElement("strong");
    date.textContent = dateFormat.format(new Date(slot.startAt));
    const time = document.createElement("span");
    time.className = "meeting-slot-time";
    time.textContent = timeFormat.format(new Date(slot.startAt));
    const detail = document.createElement("span");
    detail.className = "meeting-slot-detail";
    detail.textContent = `${slot.durationMinutes} minutes · ${slot.locationLabel}`;
    const button = document.createElement("button");
    button.className = "button button-secondary";
    button.type = "button";
    button.textContent = "Request this time";
    button.addEventListener("click", () => selectSlot(slot));
    card.append(date, time, detail, button);
    root.append(card);
  }
}

function selectSlot(slot) {
  byId("meeting-slot-id").value = slot.id;
  byId("selected-meeting-time").textContent = slotLabel(slot);
  byId("meeting-request-panel").hidden = false;
  byId("meeting-request-panel").scrollIntoView({ behavior: "smooth", block: "center" });
  byId("meeting-request-form").elements.guardianName.focus({ preventScroll: true });
}

async function loadSlots() {
  try {
    renderSlots((await api("schedule-availability")).slots ?? []);
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function submitRequest(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  data.consent = form.elements.consent.checked;
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  setStatus("Sending your request…");
  try {
    const result = await api("schedule-request", { method: "POST", body: JSON.stringify(data) });
    form.reset();
    byId("meeting-request-panel").hidden = true;
    await loadSlots();
    setStatus(`Request sent. Your reference is ${result.reference}. Mr. Neft will confirm by email.`, "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    button.disabled = false;
  }
}

async function answerInvitation(action) {
  const meeting = new URL(location.href).searchParams.get("meeting");
  if (!meeting) return;
  for (const id of ["meeting-accept", "meeting-decline"]) byId(id).disabled = true;
  try {
    const result = await api("schedule-response", {
      method: "POST",
      body: JSON.stringify({ meeting, action }),
    });
    byId("meeting-response-panel").hidden = true;
    setStatus(
      result.status === "confirmed"
        ? "Meeting confirmed. Mr. Neft will share any final meeting details by email."
        : "Thank you. The time was declined and Mr. Neft will follow up with another option.",
      "success",
    );
  } catch (error) {
    setStatus(error.message, "error");
  }
}

byId("meeting-request-form").addEventListener("submit", submitRequest);
byId("meeting-request-cancel").addEventListener("click", () => {
  byId("meeting-request-panel").hidden = true;
  byId("meeting-slots").querySelector("button")?.focus();
});
byId("meeting-accept").addEventListener("click", () => answerInvitation("accept"));
byId("meeting-decline").addEventListener("click", () => answerInvitation("decline"));

if (new URL(location.href).searchParams.has("meeting")) {
  byId("meeting-response-panel").hidden = false;
  byId("family-scheduler").scrollIntoView({ block: "start" });
}
loadSlots();
