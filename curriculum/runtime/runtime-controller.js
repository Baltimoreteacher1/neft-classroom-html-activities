import { RUNTIME_CONFIG, selfTest, tutorLanguage } from "./runtime-config.js";
import { appendLocal, loadCurriculum, writeLocal } from "./runtime-repository.js";
import {
  adaptClassroom,
  clusterStrategies,
  compileRuntime,
  findLesson,
  forkRuntime,
  modelReasoning,
  proposeRevision,
  reviewLesson,
} from "./runtime-service.js";
import {
  activateStage,
  downloadJson,
  populateLessons,
  renderAdaptation,
  renderClusters,
  renderFork,
  renderReasoning,
  renderRevision,
  renderRuntime,
  setStatus,
} from "./runtime-ui.js";

let curriculum;
let currentRuntime;
let currentFork;
let latestRevision;
let strategyEntries = [];

const byId = (id) => document.getElementById(id);
const value = (id) => byId(id).value;

function counts() {
  return Object.fromEntries(["secure", "developing", "stuck"].map((name) => [name, Number(value(`${name}-count`)) || 0]));
}

function compose(event) {
  event.preventDefault();
  const lesson = findLesson(curriculum.launchData.lessons, value("lesson-select"));
  currentRuntime = compileRuntime({
    lesson,
    workflow: curriculum.teacherWorkflow,
    supports: curriculum.supportData,
    language: value("language-select"),
    minutes: value("minutes-select"),
    intent: value("teacher-intent"),
  });
  currentRuntime.reviews = reviewLesson(currentRuntime);
  writeLocal("current-session", currentRuntime);
  renderRuntime(currentRuntime);
  setStatus("Runtime compiled from canonical curriculum data.", "success");
  activateStage("run");
}

function updateEvidence() {
  if (!currentRuntime) return setStatus("Compose a runtime first.", "warning");
  const adaptation = adaptClassroom(counts(), currentRuntime.guidance);
  const reasoning = modelReasoning(value("reasoning-evidence"), currentRuntime.guidance);
  latestRevision = proposeRevision(currentRuntime, reasoning, adaptation);
  renderAdaptation(adaptation);
  renderReasoning(reasoning);
  renderRevision(latestRevision);
  appendLocal("evidence", { lessonId: currentRuntime.lesson.id, adaptation, reasoning, at: new Date().toISOString() });
  setStatus("Anonymous classroom evidence updated.", "success");
}

function addStrategy() {
  const entry = value("strategy-entry").trim();
  if (!entry) return;
  strategyEntries = [...strategyEntries, entry].slice(-30);
  byId("strategy-entry").value = "";
  renderClusters(clusterStrategies(strategyEntries));
  writeLocal("strategies", strategyEntries);
}

function createFork() {
  if (!currentRuntime) return setStatus("Compose a runtime first.", "warning");
  currentFork = forkRuntime(currentRuntime, value("fork-theme"));
  appendLocal("forks", currentFork);
  renderFork(currentFork);
  setStatus("Fork created. Standard, objective, and assessment were preserved.", "success");
}

async function askCopilot() {
  if (!currentRuntime) return setStatus("Compose a runtime first.", "warning");
  const prompt = value("copilot-prompt").trim();
  if (!prompt) return;
  const output = byId("copilot-output");
  output.textContent = "Thinking…";
  try {
    const response = await fetch(RUNTIME_CONFIG.tutorEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "teach",
        problem: `${currentRuntime.lesson.title}: ${prompt}`.slice(0, 900),
        replyLang: tutorLanguage(currentRuntime.language),
      }),
    });
    if (!response.ok) throw new Error("Tutor unavailable");
    const data = await response.json();
    output.textContent = data.response || data.message || currentRuntime.guidance.responseMove;
  } catch {
    output.textContent = `${currentRuntime.guidance.responseMove} Ask: ${currentRuntime.copy.notice}`;
  }
}

async function inspectPhoto() {
  if (!currentRuntime) return setStatus("Compose a runtime first.", "warning");
  const file = byId("work-photo").files[0];
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2_500_000) {
    return setStatus("Choose a JPG, PNG, or WebP under 2.5 MB. Remove names before uploading.", "warning");
  }
  const image = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const output = byId("vision-output");
  output.textContent = "Looking for mathematical reasoning…";
  try {
    const response = await fetch(RUNTIME_CONFIG.tutorEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "photo", image, studentWork: "Give one coaching move. Do not reveal the answer.", replyLang: tutorLanguage(currentRuntime.language) }),
    });
    if (!response.ok) throw new Error("Vision unavailable");
    const data = await response.json();
    output.textContent = data.response || data.message || currentRuntime.guidance.responseMove;
  } catch {
    output.textContent = `Photo coaching is temporarily unavailable. Try this move: ${currentRuntime.guidance.responseMove}`;
  } finally {
    byId("work-photo").value = "";
  }
}

function startVoice() {
  const Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  if (!Recognition) return setStatus("Voice input is not available in this browser. Type the observation instead.", "warning");
  const recognition = new Recognition();
  recognition.lang = currentRuntime?.language === "es" ? "es-US" : "en-US";
  recognition.onresult = (event) => { byId("reasoning-evidence").value = event.results[0][0].transcript; };
  recognition.onerror = () => setStatus("Voice input stopped. No recording was saved.", "warning");
  recognition.start();
  setStatus("Listening once. Speech stays in the browser unless you submit evidence.", "neutral");
}

function bindEvents() {
  byId("compose-form").addEventListener("submit", compose);
  byId("update-evidence").addEventListener("click", updateEvidence);
  byId("add-strategy").addEventListener("click", addStrategy);
  byId("create-fork").addEventListener("click", createFork);
  byId("ask-copilot").addEventListener("click", askCopilot);
  byId("inspect-photo").addEventListener("click", inspectPhoto);
  byId("voice-input").addEventListener("click", startVoice);
  byId("approve-revision").addEventListener("click", () => {
    if (!latestRevision) return;
    latestRevision.status = "teacher-approved";
    appendLocal("approved-revisions", latestRevision);
    renderRevision(latestRevision);
  });
  byId("export-fork").addEventListener("click", () => currentFork && downloadJson(`${currentFork.lesson.id}-fork.json`, currentFork));
  document.querySelectorAll("[data-stage-button]").forEach((button) => button.addEventListener("click", () => activateStage(button.dataset.stageButton)));
}

async function init() {
  if (!selfTest()) throw new Error("Runtime configuration self-test failed.");
  bindEvents();
  try {
    curriculum = await loadCurriculum();
    populateLessons(curriculum.launchData.lessons);
    setStatus(`${curriculum.launchData.lessons.length} canonical lessons ready. English / Español only.`, "success");
  } catch (error) {
    byId("compose-submit").disabled = true;
    setStatus(`${error.message} Refresh to try again; existing curriculum links still work.`, "danger");
  }
}

init();
