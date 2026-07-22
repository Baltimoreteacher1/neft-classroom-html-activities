const $ = (selector, root = document) => root.querySelector(selector);

export function setStatus(message, tone = "neutral") {
  const status = $("#runtime-status");
  status.textContent = message;
  status.dataset.tone = tone;
}

export function populateLessons(lessons) {
  const select = $("#lesson-select");
  select.replaceChildren(...lessons.map((lesson) => {
    const option = document.createElement("option");
    option.value = lesson.id;
    option.textContent = `Unit ${lesson.unit} · ${lesson.id} · ${lesson.title}`;
    return option;
  }));
}

function text(tag, value, className = "") {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
}

function labelledValue(label, value) {
  const item = document.createElement("div");
  item.className = "datum";
  item.append(text("dt", label), text("dd", value));
  return item;
}

function modelGraphic(family) {
  const wrapper = document.createElement("div");
  wrapper.className = "model-graphic";
  wrapper.setAttribute("role", "group");
  wrapper.setAttribute("aria-label", `Interactive ${family} model preview`);
  const cells = Array.from({ length: 12 }, (_, index) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "model-cell";
    cell.textContent = String(index + 1);
    cell.setAttribute("aria-pressed", "false");
    cell.addEventListener("click", () => {
      const pressed = cell.getAttribute("aria-pressed") === "true";
      cell.setAttribute("aria-pressed", String(!pressed));
    });
    return cell;
  });
  wrapper.replaceChildren(...cells);
  return wrapper;
}

export function renderRuntime(runtime) {
  $("#empty-state").hidden = true;
  $("#runtime-output").hidden = false;
  $("#runtime-title").textContent = runtime.lesson.title;
  $("#runtime-kicker").textContent = `${runtime.lesson.id} · ${runtime.lesson.standard} · ${runtime.language === "es" ? "Español" : "English"}`;
  $("#runtime-intent").textContent = runtime.intent;
  $("#runtime-data").replaceChildren(
    labelledValue("Objective", runtime.lesson.objective),
    labelledValue("Language objective", runtime.lesson.languageObjective),
    labelledValue("Success", runtime.guidance.successCriteria),
    labelledValue("Listen for", runtime.copy.listen),
  );
  const sequence = $("#runtime-sequence");
  sequence.replaceChildren(...runtime.sequence.map((step) => text("li", step)));
  $("#lab-name").textContent = runtime.lab.name;
  $("#lab-prompt").textContent = runtime.lab.prompt;
  $("#lab-frame").replaceChildren(modelGraphic(runtime.family));
  $("#student-prompt").textContent = runtime.copy.notice;
  $("#sentence-frame").textContent = runtime.copy.explain;
  $("#launch-lesson").href = runtime.lesson.resources.lesson;
  $("#family-link").href = runtime.lesson.resources.familyPage;
  renderReviews(runtime.reviews || []);
}

export function renderReviews(reviews) {
  const list = $("#agent-reviews");
  list.replaceChildren(...reviews.map((review) => {
    const item = document.createElement("li");
    item.className = "review-row";
    const marker = text("span", review.passed ? "Ready" : "Review", `review-state ${review.passed ? "pass" : "warn"}`);
    const body = document.createElement("div");
    body.append(text("strong", review.role), text("p", review.finding), text("small", `${Math.round(review.confidence * 100)}% confidence`));
    item.append(marker, body);
    return item;
  }));
}

export function renderAdaptation(adaptation) {
  $("#adaptation-level").textContent = adaptation.level;
  $("#adaptation-move").textContent = adaptation.move;
  $("#adaptation-total").textContent = `${adaptation.total} anonymous responses`;
}

export function renderReasoning(reasoning) {
  $("#reasoning-state").textContent = reasoning.status;
  $("#reasoning-confidence").textContent = `${Math.round(reasoning.confidence * 100)}% confidence`;
  $("#reasoning-inference").textContent = reasoning.inference;
  $("#reasoning-next").textContent = reasoning.nextPrompt;
}

export function renderClusters(clusters) {
  const list = $("#strategy-clusters");
  const items = clusters.length
    ? clusters.map((cluster) => {
        const item = document.createElement("li");
        item.append(
          text("strong", `${cluster.name} · ${cluster.count}`),
          text("p", cluster.examples.join(" · ")),
        );
        return item;
      })
    : [text("li", "Add anonymous strategy notes to reveal patterns.", "muted")];
  list.replaceChildren(...items);
}

export function renderRevision(revision) {
  $("#revision-status").textContent = revision.status;
  $("#revision-evidence").textContent = revision.evidence;
  $("#revision-proposal").textContent = revision.proposal;
  $("#approve-revision").disabled = false;
}

export function renderFork(fork) {
  $("#fork-output").hidden = false;
  $("#fork-theme-output").textContent = fork.fork.theme;
  $("#fork-changes").textContent = fork.fork.changed.join(", ");
  $("#fork-invariants").textContent = `${fork.invariants.standard} · ${fork.invariants.objective}`;
}

export function activateStage(stage) {
  document.querySelectorAll("[data-stage]").forEach((panel) => { panel.hidden = panel.dataset.stage !== stage; });
  document.querySelectorAll("[data-stage-button]").forEach((button) => {
    const active = button.dataset.stageButton === stage;
    button.setAttribute("aria-current", active ? "step" : "false");
  });
  $(`[data-stage="${stage}"]`)?.focus({ preventScroll: true });
}

export function downloadJson(filename, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
