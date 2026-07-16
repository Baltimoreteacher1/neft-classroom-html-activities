import { downloadCalendarEvent } from "./calendar-event.js";
import { formatMeetingSlot } from "./family-scheduler-format.js";

const API = "/api/family-connections";
const byId = (id) => document.getElementById(id);
let language = document.documentElement.lang === "es" ? "es" : "en";
let confirmedBooking = null;
const spanish = {
  quick: "Reunión",
  eyebrow: "Reuniones familiares",
  title: "Reúnase con el Sr. Neft",
  intro:
    "Elija una hora disponible para conversar brevemente sobre cómo podemos apoyar a su estudiante.",
  timezone: "Hora del Este",
  guardian: "Nombre del padre, madre o tutor",
  student: "Solo el primer nombre del estudiante",
  email: "Correo electrónico para la respuesta",
  note: "¿Hay algo que quiera que el Sr. Neft sepa? (opcional)",
  consent: "Estoy reservando esta hora y usaré solo el primer nombre del estudiante.",
  send: "Reservar reunión",
  chooseAnother: "Elegir otra hora",
  requestTime: "Reservar",
  bookedTitle: "Reunión reservada",
  addCalendar: "Agregar al calendario",
  backToTimes: "Ver otros horarios",
};

function applyLanguage(next) {
  language = next === "es" ? "es" : "en";
  document.querySelectorAll("[data-scheduler-key]").forEach((element) => {
    element.dataset.schedulerEn ??= element.textContent.trim();
    element.textContent =
      language === "es" ? spanish[element.dataset.schedulerKey] : element.dataset.schedulerEn;
  });
}

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
  return formatMeetingSlot(slot, language).label;
}

function renderSlots(slots) {
  const root = byId("meeting-slots");
  root.replaceChildren();
  if (!slots.length) {
    setStatus(
      language === "es"
        ? "No hay horarios publicados ahora. Use ClassDojo para sugerir una hora."
        : "No meeting times are posted right now. Please use ClassDojo to suggest a time.",
    );
    return;
  }
  setStatus(
    language === "es"
      ? `${slots.length} ${slots.length === 1 ? "horario disponible" : "horarios disponibles"}.`
      : `${slots.length} ${slots.length === 1 ? "time is" : "times are"} available.`,
  );
  for (const slot of slots) {
    const formatted = formatMeetingSlot(slot, language);
    const card = document.createElement("article");
    card.className = "meeting-slot-card";
    const when = document.createElement("div");
    when.className = "meeting-slot-when";
    const date = document.createElement("strong");
    date.className = "meeting-slot-date";
    date.textContent = formatted.date;
    const time = document.createElement("span");
    time.className = "meeting-slot-time";
    time.textContent = formatted.time;
    when.append(date, time);
    const detail = document.createElement("span");
    detail.className = "meeting-slot-detail";
    detail.textContent = slot.locationLabel;
    const button = document.createElement("button");
    button.className = "button button-secondary";
    button.type = "button";
    button.dataset.schedulerKey = "requestTime";
    button.dataset.schedulerEn = "Book";
    button.textContent = language === "es" ? spanish.requestTime : button.dataset.schedulerEn;
    button.setAttribute(
      "aria-label",
      language === "es" ? `Reservar ${formatted.label}` : `Request ${formatted.label}`,
    );
    button.addEventListener("click", () => selectSlot(slot));
    card.append(when, detail, button);
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
  setStatus(language === "es" ? "Reservando su reunión…" : "Booking your meeting…");
  try {
    const result = await api("schedule-request", { method: "POST", body: JSON.stringify(data) });
    form.reset();
    byId("meeting-request-panel").hidden = true;
    confirmedBooking = { slot: result.slot, reference: result.reference };
    byId("meeting-confirmation-detail").textContent =
      `${slotLabel(result.slot)} · ${result.slot.durationMinutes} minutes · ${result.slot.locationLabel} · Eastern Time`;
    byId("meeting-confirmation-reference").textContent = result.reference;
    byId("meeting-confirmation").hidden = false;
    await loadSlots();
    setStatus(
      language === "es" ? "Su reunión está confirmada." : "Your meeting is confirmed.",
      "success",
    );
    byId("meeting-confirmation-title").focus();
  } catch (error) {
    if (/no longer available|just booked/i.test(error.message)) {
      byId("meeting-request-panel").hidden = true;
      await loadSlots();
      byId("meeting-slots").querySelector("button")?.focus();
      setStatus(
        language === "es"
          ? "Ese horario acaba de reservarse. Elija otro."
          : "That time was just booked. Please choose another.",
        "error",
      );
      return;
    }
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
byId("add-meeting-calendar").addEventListener("click", () => {
  if (!confirmedBooking) return;
  downloadCalendarEvent(confirmedBooking.slot, {
    reference: confirmedBooking.reference,
    url: `${location.origin}/curriculum/family-connections/`,
  });
});
byId("meeting-confirmation-close").addEventListener("click", () => {
  byId("meeting-confirmation").hidden = true;
  byId("meeting-slots").querySelector("button")?.focus();
});
window.addEventListener("family-language-change", (event) => {
  applyLanguage(event.detail);
  loadSlots();
});

if (new URL(location.href).searchParams.has("meeting")) {
  byId("meeting-response-panel").hidden = false;
  byId("family-scheduler").scrollIntoView({ block: "start" });
}
applyLanguage(document.documentElement.lang);
loadSlots();
