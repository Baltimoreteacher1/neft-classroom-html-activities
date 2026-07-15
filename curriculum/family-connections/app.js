import {
  ENGAGEMENT_ROUTINES,
  GLOBAL_RESOURCES,
  LANGUAGES,
  PURPOSES,
  buildOutlookUrl,
  composeMessage,
  normalizeLessons,
  sanitizePlannerItem,
} from "./templates.js";

const STORAGE_KEY = "neft.familyConnections.planner.v1";
const CLASSDOJO_URL = "https://teach.classdojo.com/";
const MAX_OUTLOOK_URL = 7500;
const QUICK_ICONS = {
  celebration: "🌟",
  "learning-check-in": "🧭",
  "missing-work": "🌱",
  homework: "🏠",
  conference: "🤝",
  "weekly-update": "🗓️",
};

const elements = {
  quickStart: select("[data-quick-start]"),
  messageForm: select("#message-form"),
  purpose: select("#purpose"),
  language: select("#language"),
  student: select("#student"),
  classLabel: select("#class-label"),
  lesson: select("#lesson"),
  dueDate: select("#due-date"),
  context: select("#context"),
  resource: select("#resource"),
  retryLessons: select("#retry-lessons"),
  lessonStatus: select("#lesson-status"),
  subject: select("[data-message-subject]"),
  body: select("[data-message-body]"),
  category: select("[data-message-category]"),
  reviewRow: select("#review-row"),
  review: select("#review-message"),
  copy: select("#copy-message"),
  outlook: select("#open-outlook"),
  classDojo: select("#open-classdojo"),
  print: select("#print-message"),
  resourceSearch: select("#resource-search"),
  resourceType: select("#resource-type"),
  resourceGrid: select("#resource-grid"),
  resourceStatus: select("#resource-results-status"),
  resourceEmpty: select("#resource-empty"),
  engagementGrid: select("#engagement-grid"),
  plannerForm: select("#planner-form"),
  plannerStudent: select("#planner-student"),
  plannerPurpose: select("#planner-purpose"),
  plannerDate: select("#planner-date"),
  plannerNote: select("#planner-note"),
  savePlanner: select("#save-planner"),
  clearPlanner: select("#clear-planner"),
  storageStatus: select("#storage-status"),
  plannerList: select("#planner-list"),
  plannerEmpty: select("#planner-empty"),
  balanceCounts: select("#balance-counts"),
  balancePrompt: select("#balance-prompt"),
  toast: select("#app-status"),
};

const state = {
  lessons: [],
  resources: [],
  resourceByKey: new Map(),
  planner: [],
  persistenceEnabled: false,
  statusTimer: 0,
};

initialize();

function initialize() {
  renderSelectOptions();
  renderQuickStart();
  renderEngagementRoutines();
  bindEvents();
  restorePlanner();
  refreshResourceChoices();
  renderResourceNavigator();
  renderPlanner();
  refreshMessage();
  loadLessons();
}

function renderSelectOptions() {
  elements.purpose.innerHTML = Object.entries(PURPOSES)
    .map(([id, purpose]) => option(id, purpose.label))
    .join("");
  elements.language.innerHTML = LANGUAGES.map((item) =>
    option(item.id, item.label),
  ).join("");
  elements.plannerPurpose.innerHTML = Object.entries(PURPOSES)
    .map(([id, purpose]) => option(id, purpose.label))
    .join("");
  elements.language.value = "plain";
}

function renderQuickStart() {
  elements.quickStart.innerHTML = Object.entries(PURPOSES)
    .map(
      ([id, purpose]) => `
        <button class="quick-card" type="button" data-quick-purpose="${id}">
          <span class="icon" aria-hidden="true">${QUICK_ICONS[id]}</span>
          <strong>${escapeHtml(purpose.label)}</strong>
          <span>${escapeHtml(quickDescription(id))}</span>
        </button>`,
    )
    .join("");
}

function renderEngagementRoutines() {
  elements.engagementGrid.innerHTML = ENGAGEMENT_ROUTINES.map(
    (routine) => `
      <article class="engagement-card">
        <p class="meta">${escapeHtml(routine.time)} · Family as ${escapeHtml(routine.familyRole)}</p>
        <h3>${escapeHtml(routine.title)}</h3>
        <p><strong>At home:</strong> ${escapeHtml(routine.directions)}</p>
        <p><strong>Back in class:</strong> ${escapeHtml(routine.classroomReturn)}</p>
        <p><strong>In-school option:</strong> ${escapeHtml(routine.schoolAlternative)}</p>
        <div class="card-actions">
          <button type="button" data-routine="${routine.id}">Create family invitation</button>
        </div>
      </article>`,
  ).join("");
}

function bindEvents() {
  elements.messageForm.addEventListener("input", refreshMessage);
  elements.messageForm.addEventListener("change", (event) => {
    if (event.target === elements.lesson) refreshResourceChoices();
    refreshMessage();
  });
  elements.review.addEventListener("change", updateDeliveryGate);
  elements.retryLessons.addEventListener("click", loadLessons);
  elements.quickStart.addEventListener("click", handleQuickStart);
  elements.copy.addEventListener("click", copyPreparedMessage);
  elements.outlook.addEventListener("click", openOutlook);
  elements.classDojo.addEventListener("click", openClassDojo);
  elements.print.addEventListener("click", () => window.print());
  elements.resourceSearch.addEventListener("input", renderResourceNavigator);
  elements.resourceType.addEventListener("change", renderResourceNavigator);
  elements.resourceGrid.addEventListener("click", handleResourceAction);
  elements.engagementGrid.addEventListener("click", handleRoutineAction);
  elements.plannerForm.addEventListener("submit", addPlannerItem);
  elements.savePlanner.addEventListener("click", enablePlannerPersistence);
  elements.clearPlanner.addEventListener("click", clearPlanner);
  elements.plannerList.addEventListener("click", handlePlannerAction);
}

async function loadLessons() {
  elements.lesson.disabled = true;
  elements.retryLessons.hidden = true;
  elements.lessonStatus.textContent = "Loading the live curriculum resource list…";
  try {
    const response = await fetch("/data/curriculum-manifest.json", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Curriculum request failed (${response.status})`);
    state.lessons = normalizeLessons(await response.json());
    elements.lesson.innerHTML = [
      option("", "Choose a lesson (optional)"),
      ...state.lessons.map((lesson) => option(lesson.id, lesson.label)),
    ].join("");
    elements.lesson.disabled = false;
    elements.lessonStatus.textContent = `${state.lessons.length} lessons ready. Choose one to see its family supports.`;
    refreshResourceChoices();
    renderResourceNavigator();
  } catch (error) {
    console.warn("Family Connections could not load the curriculum manifest.", error);
    elements.lesson.innerHTML = option("", "Lesson list unavailable");
    elements.lessonStatus.textContent =
      "The lesson list could not load. Global family resources and every other tool still work.";
    elements.retryLessons.hidden = false;
    showStatus("Lesson resources are offline. You can retry without losing your message.");
  }
}

function refreshResourceChoices() {
  const selectedLesson = getSelectedLesson();
  const resources = selectedLesson ? selectedLesson.familyResources : GLOBAL_RESOURCES;
  state.resourceByKey.clear();
  const options = [option("", "No resource attached")];
  resources.forEach((resource, index) => {
    const value = `${selectedLesson?.id || "global"}:${resource.kind}:${index}`;
    state.resourceByKey.set(value, resource);
    options.push(option(value, resource.label));
  });
  elements.resource.innerHTML = options.join("");
}

function refreshMessage() {
  const lesson = getSelectedLesson();
  const resource = state.resourceByKey.get(elements.resource.value) || null;
  const message = composeMessage({
    purpose: elements.purpose.value,
    language: elements.language.value,
    student: elements.student.value,
    classLabel: elements.classLabel.value,
    lessonLabel: lesson?.label || "",
    dueDate: friendlyDate(elements.dueDate.value),
    context: elements.context.value,
    resource,
  });
  elements.subject.value = message.subject;
  elements.body.value = message.body;
  elements.category.textContent = message.category;
  elements.category.className = `status-pill ${message.category}`;
  elements.reviewRow.hidden = !message.requiresReview;
  if (!message.requiresReview) elements.review.checked = false;
  updateDeliveryGate();
}

function updateDeliveryGate() {
  const requiresReview = !elements.reviewRow.hidden;
  const blocked = requiresReview && !elements.review.checked;
  elements.outlook.disabled = blocked;
  elements.classDojo.disabled = blocked;
  const label = blocked
    ? "Review this support or concern message before opening an external service."
    : "Message is ready for your deliberate handoff.";
  elements.outlook.title = label;
  elements.classDojo.title = label;
}

async function copyPreparedMessage() {
  const copied = await copyText(preparedText());
  if (copied) {
    showStatus("Message copied. Paste it into any family communication channel.");
  }
}

function openOutlook() {
  if (!externalHandoffAllowed()) return;
  const outlookUrl = buildOutlookUrl(currentMessage());
  if (outlookUrl.length <= MAX_OUTLOOK_URL) {
    window.open(outlookUrl, "_blank", "noopener,noreferrer");
    showStatus("Outlook opened with your subject and message prepared. Nothing was sent.");
    return;
  }
  const outlookWindow = window.open(
    "https://outlook.office.com/mail/deeplink/compose",
    "_blank",
    "noopener,noreferrer",
  );
  copyText(preparedText()).then((copied) => {
    showStatus(
      copied
        ? "The message was too long for a prefilled link, so it was copied and a blank Outlook message was opened."
        : "A blank Outlook message opened. Copy the visible preview manually before continuing.",
    );
    if (!outlookWindow) elements.body.focus();
  });
}

function openClassDojo() {
  if (!externalHandoffAllowed()) return;
  const dojoWindow = window.open("about:blank", "_blank");
  copyText(preparedText()).then((copied) => {
    if (dojoWindow) {
      dojoWindow.opener = null;
      dojoWindow.location.replace(CLASSDOJO_URL);
    } else {
      window.open(CLASSDOJO_URL, "_blank", "noopener,noreferrer");
    }
    showStatus(
      copied
        ? "Message copied and ClassDojo opened. Choose the family and paste the message."
        : "ClassDojo opened. Copy the message preview manually before pasting.",
    );
  });
}

function externalHandoffAllowed() {
  if (elements.reviewRow.hidden || elements.review.checked) return true;
  elements.review.focus();
  showStatus("Review and confirm this message before opening Outlook or ClassDojo.");
  return false;
}

function renderResourceNavigator() {
  const lessonResources = state.lessons.flatMap((lesson) =>
    lesson.familyResources.map((resource) => ({
      ...resource,
      ref: `${lesson.id}:${resource.kind}:${resource.url}`,
      lessonId: lesson.id,
      standard: lesson.standard || "",
      description: `${lesson.label}${lesson.standard ? ` · ${lesson.standard}` : ""}`,
    })),
  );
  const globalResources = GLOBAL_RESOURCES.map((resource) => ({
    ...resource,
    ref: `global:${resource.id}`,
  }));
  state.resources = [...globalResources, ...lessonResources];
  const query = normalize(elements.resourceSearch.value);
  const type = elements.resourceType.value;
  const matches = state.resources.filter((resource) => {
    const haystack = normalize(
      `${resource.label} ${resource.description} ${resource.lessonId || ""} ${resource.standard || ""} ${resource.tags || ""}`,
    );
    return (
      (!query || haystack.includes(query)) &&
      (type === "all" || resource.kind === type)
    );
  });
  const visible = matches.slice(0, 24);
  elements.resourceGrid.innerHTML = visible.map(resourceCard).join("");
  elements.resourceEmpty.hidden = matches.length !== 0;
  elements.resourceStatus.textContent = matches.length
    ? `Showing ${visible.length} of ${matches.length} matching resources.${matches.length > visible.length ? " Add a lesson number or keyword to narrow the list." : ""}`
    : "No resources match the current search.";
}

function resourceCard(resource) {
  return `
    <article class="resource-card">
      <p class="meta">${escapeHtml(typeLabel(resource.kind))}</p>
      <h3>${escapeHtml(resource.label)}</h3>
      <p>${escapeHtml(resource.description || "Family-ready lesson support")}</p>
      <div class="card-actions">
        <a href="${escapeAttribute(resource.url)}" target="_blank" rel="noopener">Open resource</a>
        <button type="button" data-use-resource="${escapeAttribute(resource.ref)}">Use in message</button>
      </div>
    </article>`;
}

function handleResourceAction(event) {
  const button = event.target.closest("[data-use-resource]");
  if (!button) return;
  const resource = state.resources.find(
    (item) => item.ref === button.dataset.useResource,
  );
  if (!resource) return;
  elements.lesson.value = resource.lessonId || "";
  refreshResourceChoices();
  const match = [...state.resourceByKey.entries()].find(
    ([, item]) => item.url === resource.url,
  );
  if (match) elements.resource.value = match[0];
  refreshMessage();
  elements.resource.focus();
  elements.resource.scrollIntoView({ behavior: "smooth", block: "center" });
  showStatus(`${resource.label} added to the prepared message.`);
}

function handleQuickStart(event) {
  const button = event.target.closest("[data-quick-purpose]");
  if (!button) return;
  elements.purpose.value = button.dataset.quickPurpose;
  elements.review.checked = false;
  refreshMessage();
  elements.student.focus();
  elements.messageForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleRoutineAction(event) {
  const button = event.target.closest("[data-routine]");
  if (!button) return;
  const routine = ENGAGEMENT_ROUTINES.find(
    (item) => item.id === button.dataset.routine,
  );
  if (!routine) return;
  elements.purpose.value = routine.messagePurpose;
  elements.context.value = `${routine.title}: ${routine.directions} Back in class: ${routine.classroomReturn}`;
  elements.review.checked = false;
  refreshMessage();
  elements.student.focus();
  elements.messageForm.scrollIntoView({ behavior: "smooth", block: "start" });
  showStatus(`${routine.title} invitation prepared. Add a student name and review it.`);
}

function addPlannerItem(event) {
  event.preventDefault();
  const item = sanitizePlannerItem({
    id: globalThis.crypto?.randomUUID?.() || `plan-${Date.now()}`,
    student: elements.plannerStudent.value,
    purpose: elements.plannerPurpose.value,
    nextDate: elements.plannerDate.value,
    note: elements.plannerNote.value,
    completed: false,
  });
  if (!item.student || !item.nextDate) {
    showStatus("Add first name or initials and a valid next-contact date.");
    (!item.student ? elements.plannerStudent : elements.plannerDate).focus();
    return;
  }
  state.planner.push(item);
  elements.plannerForm.reset();
  elements.plannerPurpose.value = "celebration";
  persistPlannerIfEnabled();
  renderPlanner();
  showStatus("Follow-up added to this session's planner.");
}

function enablePlannerPersistence() {
  state.persistenceEnabled = true;
  if (writePlanner()) {
    renderStorageStatus();
    showStatus("Planner saved only on this device.");
  }
}

function restorePlanner() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return;
    state.planner = parsed.map(sanitizePlannerItem);
    state.persistenceEnabled = true;
  } catch (error) {
    console.warn("Saved Family Connections planning could not be restored.", error);
  }
  renderStorageStatus();
}

function clearPlanner() {
  if (!state.planner.length && !state.persistenceEnabled) return;
  if (
    !window.confirm(
      "Clear this session and all Family Connections planning saved on this device?",
    )
  ) {
    return;
  }
  state.planner = [];
  state.persistenceEnabled = false;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Local planner storage could not be cleared.", error);
  }
  renderStorageStatus();
  renderPlanner();
  showStatus("Saved planning cleared from this device.");
}

function handlePlannerAction(event) {
  const button = event.target.closest("[data-plan-action]");
  if (!button) return;
  const item = state.planner.find((plan) => plan.id === button.dataset.planId);
  if (!item) return;
  if (button.dataset.planAction === "toggle") item.completed = !item.completed;
  if (button.dataset.planAction === "remove") {
    state.planner = state.planner.filter((plan) => plan.id !== item.id);
  }
  persistPlannerIfEnabled();
  renderPlanner();
}

function renderPlanner() {
  const sorted = [...state.planner].sort(
    (a, b) =>
      Number(a.completed) - Number(b.completed) ||
      a.nextDate.localeCompare(b.nextDate),
  );
  elements.plannerList.innerHTML = sorted
    .map((item) => {
      const purpose = PURPOSES[item.purpose];
      return `
        <article class="planner-item ${item.completed ? "done" : ""}">
          <button type="button" data-plan-action="toggle" data-plan-id="${escapeAttribute(item.id)}" aria-label="${item.completed ? "Mark active" : "Mark complete"}">${item.completed ? "↩" : "✓"}</button>
          <div>
            <p><strong>${escapeHtml(item.student)}</strong> · ${escapeHtml(purpose.label)}</p>
            <p class="item-meta">${escapeHtml(friendlyDate(item.nextDate))}${item.note ? ` · ${escapeHtml(item.note)}` : ""}</p>
          </div>
          <button type="button" data-plan-action="remove" data-plan-id="${escapeAttribute(item.id)}" aria-label="Remove planned connection">×</button>
        </article>`;
    })
    .join("");
  elements.plannerEmpty.hidden = state.planner.length !== 0;
  renderBalance();
  renderStorageStatus();
}

function renderBalance() {
  const counts = { positive: 0, support: 0, concern: 0 };
  state.planner
    .filter((item) => !item.completed)
    .forEach((item) => {
      counts[PURPOSES[item.purpose].category] += 1;
    });
  elements.balanceCounts.innerHTML = Object.entries(counts)
    .map(
      ([category, count]) =>
        `<div><strong>${count}</strong><span>${escapeHtml(category)}</span></div>`,
    )
    .join("");
  elements.balancePrompt.textContent =
    counts.concern > counts.positive
      ? "Consider adding one positive connection so families also hear about progress and strengths."
      : "A steady mix of celebration and support helps build trust before difficult conversations.";
}

function persistPlannerIfEnabled() {
  if (state.persistenceEnabled) writePlanner();
}

function writePlanner() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state.planner.map(sanitizePlannerItem)),
    );
    return true;
  } catch (error) {
    state.persistenceEnabled = false;
    console.warn("Local planner storage is unavailable.", error);
    showStatus("This browser blocked local saving. The planner still works for this session.");
    return false;
  }
}

function renderStorageStatus() {
  elements.storageStatus.textContent = state.persistenceEnabled
    ? "Stored only on this device. No contact details or message bodies are saved."
    : "Current session only. Nothing is saved after you leave.";
  elements.savePlanner.textContent = state.persistenceEnabled
    ? "Saved on this device"
    : "Save on this device";
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    elements.body.focus();
    elements.body.select();
    try {
      return document.execCommand("copy");
    } catch {
      showStatus("Copy was blocked. The message is selected for manual copying.");
      return false;
    }
  }
}

function currentMessage() {
  return {
    subject: elements.subject.value.trim(),
    body: elements.body.value.trim(),
  };
}

function preparedText() {
  const message = currentMessage();
  return `Subject: ${message.subject}\n\n${message.body}`;
}

function getSelectedLesson() {
  return (
    state.lessons.find((lesson) => lesson.id === elements.lesson.value) || null
  );
}

function showStatus(message) {
  clearTimeout(state.statusTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  state.statusTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 6000);
}

function option(value, label) {
  return `<option value="${escapeAttribute(value)}">${escapeHtml(label)}</option>`;
}

function select(selector) {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Family Connections is missing ${selector}`);
  return element;
}

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function friendlyDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function typeLabel(kind) {
  return String(kind || "resource").replaceAll("-", " ");
}

function quickDescription(id) {
  const descriptions = {
    celebration: "Share a specific strength or improvement.",
    "learning-check-in": "Ask for one question and plan the next support.",
    "missing-work": "Offer a calm, manageable restart.",
    homework: "Invite a short family learning routine.",
    conference: "Coordinate a time and preferred way to talk.",
    "weekly-update": "Share this week's learning and one family prompt.",
  };
  return descriptions[id];
}
