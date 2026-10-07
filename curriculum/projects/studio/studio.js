import { PROJECTS, UNIT_NAMES, getProject, studioURL } from "./projects.mjs";
import { FAMILY, fieldsFor, model, matches, format, WORKED_EXAMPLES } from "./math.mjs";
import { fresh, clean, keyFor, progress } from "./state.mjs";
import { visualMarkup } from "./visuals.mjs";
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const main = $("#main");
const id = new URL(location.href).searchParams.get("project");
const project = getProject(id);
const stages = ["Choose", "Build", "Test", "Revise", "Publish"];
let state,
  storageOK = true,
  restoreMessage = "";
const action = (name, label, secondary = true) =>
  `<button type="button" data-action="${name}" class="${secondary ? "secondary" : ""}">${label}</button>`;
const frame = (s) =>
  `<details class="support" ${state?.supports ? "open" : ""}><summary>Need a starting point?</summary><p>${esc(s)}</p></details>`;
function textField(key, label, value, help = "") {
  return `<div class="evidence-field"><label for="${key}">${esc(label)}</label>${help ? `<p class="hint" id="${key}-help">${esc(help)}</p>` : ""}<textarea id="${key}" name="${key}" data-text="${key}" maxlength="6000" ${help ? `aria-describedby="${key}-help"` : ""}>${esc(value)}</textarea></div>`;
}
function catalog() {
  document.title = "Choose your mission — Project Studio";
  main.innerHTML = `<section class="hero"><div><p class="eyebrow">Grade 6 · Project Studio</p><h1>Make something.<br>Make the math matter.</h1><p class="lede">Choose a mission. Build a model, test your thinking and improve your design. Finish with something you can explain, share or print.</p><div class="meta"><span class="chip">30 missions</span><span class="chip">All 10 course units + Pre-Unit</span><span class="chip">2–3 class periods</span></div></div><aside class="hero-stamp"><strong>Your ideas. Your evidence.</strong><p>Every mission makes room for a different design. The math helps you defend yours.</p></aside></section><div class="catalog-controls"><label for="search">Find a mission<input id="search" type="search" placeholder="Try robots, data, design…"></label><label for="unit-filter">Course unit<select id="unit-filter"><option value="">All units</option>${UNIT_NAMES.map((n, i) => `<option value="${i}">${i ? `Unit ${i} · ` : ""}${esc(n)}</option>`).join("")}</select></label></div><p id="results" role="status"></p><div class="catalog-grid" id="cards"></div>`;
  const requested = new URL(location.href).searchParams.get("unit");
  if (requested !== null && /^\d+$/.test(requested) && Number(requested) <= 10)
    $("#unit-filter").value = requested;
  const show = () => {
    const search = $("#search").value.toLowerCase(),
      unit = $("#unit-filter").value;
    const list = PROJECTS.filter(
      (p) =>
        (unit === "" || String(p.unit) === unit) &&
        [p.title, p.role, p.question, p.family].join(" ").toLowerCase().includes(search),
    );
    $("#results").textContent = `${list.length} mission${list.length === 1 ? "" : "s"} to explore`;
    $("#cards").innerHTML =
      list
        .map(
          (p) =>
            `<article class="mission-card"><div class="number">${p.unit ? `Unit ${p.unit} · ` : ""}${esc(UNIT_NAMES[p.unit])}</div><div class="inside"><h2>${esc(p.title)}</h2><p>${esc(p.question)}</p><p><strong>You’ll make:</strong> ${esc(p.product)}</p><a class="button" href="${studioURL(p.id)}">Open ${esc(p.title)}</a>${p.classic ? `<details><summary>Earlier work and companion tools</summary><a href="${p.classic}">Continue earlier saved work</a></details>` : ""}</div></article>`,
        )
        .join("") || "<p>No matches. Try another topic or choose All units.</p>";
  };
  $("#search").addEventListener("input", show);
  $("#unit-filter").addEventListener("change", show);
  show();
}
function save() {
  try {
    localStorage.setItem(keyFor(project.id), JSON.stringify(state));
    storageOK = true;
  } catch {
    storageOK = false;
  }
  const el = $("#save-status");
  if (el) {
    el.classList.toggle("error", !storageOK);
    const message = storageOK
      ? "Saved on this device · Download a backup before switching devices."
      : "Device saving is unavailable. Keep this tab open and download a backup to keep your work.";
    if (el.textContent !== message) el.textContent = message;
  }
}
function load() {
  state = fresh(project);
  try {
    const raw = localStorage.getItem(keyFor(project.id));
    if (raw) {
      try {
        state = clean(project, JSON.parse(raw));
        restoreMessage = "Your saved project is ready to continue.";
      } catch {
        restoreMessage =
          "The saved record could not be read. A fresh workspace is open; your previous record has not been deleted.";
      }
    }
  } catch {
    storageOK = false;
    restoreMessage = "Device saving is unavailable. You can still work and download a backup.";
  }
}
function sidebar() {
  return `<aside class="sidebar"><section class="card soft"><h2 style="font-size:1.15rem">Make it yours</h2><p>${esc(project.product)}</p><p><strong>Time plan</strong><br>Day 1: choose, build, test.<br>Day 2: revise, explain, share.<br>Add a day for a physical model.</p><p>Work solo or with a partner. Each person explains the math.</p></section><section class="card"><h2 style="font-size:1.15rem">Words that help</h2><details ${state.supports ? "open" : ""}><summary>See a worked example</summary><p>${esc(WORKED_EXAMPLES[project.family])}</p><p>Use this strategy with your own numbers. All six math checks still belong to your project.</p></details>${FAMILY[project.family].vocab.map(([en, es, definition]) => `<p><strong>${esc(en)}</strong> · <span lang="es">${esc(es)}</span><br>${esc(definition)}</p>`).join("")}<details><summary>Language supports</summary><p>You may rehearse, label a drawing, or draft in your strongest language before writing.</p><p lang="es">Elegí ___ porque ___. Mi evidencia es ___. Cambié ___; por eso ___.</p><p>I chose ___ because ___. My evidence is ___. I changed ___, so ___.</p></details></section></aside>`;
}
function render(focus = false) {
  const p = progress(project, state);
  document.title = `${project.title} — Project Studio`;
  main.innerHTML = `<section class="hero"><div><p class="eyebrow">${project.unit ? `Unit ${project.unit} · ` : ""}${esc(UNIT_NAMES[project.unit])}</p><h1>${esc(project.title)}</h1><p class="lede">${esc(project.question)}</p><div class="meta"><span class="chip">${esc(FAMILY[project.family].label)}</span><span class="chip">${p.passed}/6 math checks</span></div></div><aside class="hero-stamp"><strong>You are the designer.</strong><p>${esc(project.role)} Make a choice, test it and show why it works.</p></aside></section>${restoreMessage ? `<p class="notice" role="status">${esc(restoreMessage)}</p>` : ""}<div class="toolbar"><span id="save-status" class="save-status ${storageOK ? "" : "error"}" role="status">${storageOK ? "Work stays on this device. Use Download backup to move it." : "Device saving is unavailable. Download a backup to keep your work."}</span><div class="toolbar-actions">${action("backup", "Download backup")}${action("restore", "Restore backup")}${action("supports", state.supports ? "Hide starting points" : "Show starting points")}</div></div><input id="import-file" hidden type="file" accept=".json,application/json" aria-label="Choose a project backup"><p id="file-status" role="status"></p><nav class="journey" aria-label="Project stages">${stages.map((s, i) => `<button type="button" data-stage="${i}" ${state.stage === i ? 'aria-current="step"' : ""}><span class="step-number">${i + 1}</span>${s}</button>`).join("")}</nav><div class="workspace"><section id="stage-panel" class="panel" aria-labelledby="stage-heading"><h2 id="stage-heading" tabindex="-1">${stageTitle()}</h2><div class="read-tools">${action("read", "Read directions aloud")}${action("stop-reading", "Stop reading")}</div>${stageContent()}<div class="stage-footer">${state.stage > 0 ? `<button class="secondary" type="button" data-stage="${state.stage - 1}">← ${stages[state.stage - 1]}</button>` : '<a href="/curriculum/projects/studio/">Choose another mission</a>'}${state.stage < 4 ? `<button type="button" data-stage="${state.stage + 1}">${stages[state.stage + 1]} →</button>` : ""}</div></section>${sidebar()}</div><details class="compact"><summary>Teacher notes, standards and companion tools</summary><p><strong>Essential standards:</strong> ${FAMILY[project.family].standards.map(esc).join(" · ")}. Unit placement follows the current curriculum; older companion folder numbers may differ.</p><p>Assess calculations, representations, reasoning and revision separately. On-screen checks verify numeric work only. Read the explanation and inspect the drawing or physical model before assessing mastery. Provide manipulatives, read-aloud and oral rehearsal as needed; the same core evidence applies to every student.</p><p>Use the supplied fictional data and prices. Optional outside research is never required. Drawings can stay on paper; attach them to the downloaded report when submitting.</p>${project.classic ? `<p><a href="${project.classic}">Open companion tools or continue earlier saved work</a>. Earlier work remains in that workspace; it is not automatically imported into this new mission.</p>` : ""}<p>No timer, ranking or automatic grade. Download and hand in your work using your teacher’s usual method.</p></details>`;
  bind();
  if (focus) {
    $("#stage-heading").focus();
    $("#stage-heading").scrollIntoView({ block: "start", behavior: "instant" });
  }
  restoreMessage = "";
}
function stageTitle() {
  return [
    "Choose a mission that matters to you",
    "Build your first design",
    "Test it. Explain the math.",
    "Change the design. Defend the change.",
    "Make your case. Share your work.",
  ][state.stage];
}
function stageContent() {
  const p = progress(project, state),
    m = p.m;
  if (state.stage === 0)
    return `<section class="card accent"><p class="eyebrow">The brief</p><h3>${esc(project.role)}</h3><p><strong>Your final product:</strong> ${esc(project.product)}</p><fieldset><legend>Choose your context</legend><div class="choice-grid">${project.choices.map((c, i) => `<label class="choice"><input name="context" type="radio" value="${esc(c)}" ${state.choice === c ? "checked" : ""}><span>${esc(c)}</span></label>`).join("")}</div></fieldset>${textField("vision", "Who is this for, and what would make your design successful?", state.vision, "Name your audience and at least one measurable goal. For example: fit everyone, stay below a cost, or explain variation honestly.")}${frame("My design is for ___. It succeeds if ___. I can check that by ___.")}<details><summary>What strong work looks like</summary><ol><li>A design with labeled quantities and units.</li><li>Six math checks, with reasoning and a representation.</li><li>A changed design and a comparison of the results.</li><li>A claim supported by math, plus one limitation.</li></ol></details></section><section class="card"><h3>Your evidence checklist</h3><ol>${project.evidence.map((s) => `<li>${esc(s)}</li>`).join("")}</ol><p>Use paper, a model, a digital drawing or labeled text. Keep it with your final report.</p></section>`;
  if (state.stage === 1)
    return `<section class="card accent"><p>Start with the supplied design or change its numbers. You own the choices. Fractions such as <strong>3/4</strong> and mixed numbers such as <strong>2 1/2</strong> are accepted.</p><form id="design-form"><fieldset><legend>Design inputs</legend><div class="field-grid">${fieldsFor(
      project,
    )
      .map(
        (f) =>
          `<label for="design-${f.key}">${esc(f.label)}<small>${f.text ? "These are fictional practice data. Do not enter names or personal records." : `${f.integer ? "Whole numbers" : "Numbers"} from ${f.min} to ${f.max}.`}</small><input id="design-${f.key}" name="${f.key}" data-design="${f.key}" type="text" ${f.text ? "" : 'inputmode="decimal"'} maxlength="200" value="${esc(state.design[f.key])}"></label>`,
      )
      .join(
        "",
      )}</div></fieldset><p class="actions compact"><button type="submit">Update my model</button></p></form><div id="model-preview">${modelView(m)}</div><p class="hint">Changing a design input clears its math checks. Your explanations stay available to revise.</p></section><section class="card"><h3>Choose a constraint</h3><p>${esc(m.decision || "Use the valid-input ranges to build a design you can test.")}</p><p>Your model is an estimate. State assumptions instead of treating simulated prices, constant growth or ideal shapes as exact descriptions of the world.</p></section>`;
  if (state.stage === 2) {
    if (m.errors.length)
      return `<div class="notice">Fix the design inputs before checking the math. ${action("build", "Return to Build")}</div>`;
    return `<div class="checkpoint-meter"><progress value="${p.passed}" max="6" aria-label="Math checks completed"></progress><strong>${p.passed} of 6 checks match your current design</strong></div><p>Work on paper first. Enter a number, fraction or mixed number. Round to hundredths unless the prompt says otherwise. Use the hints whenever they help.</p>${m.checks.map((q, i) => `<section class="card check-card ${state.checked[q.id] ? "passed" : ""}" id="card-${q.id}"><h3>${i + 1}. ${esc(q.prompt)}</h3><form data-check="${q.id}"><div class="answer-row"><label for="answer-${q.id}">Your answer${q.unit ? ` (${esc(q.unit)})` : ""}<input type="text" inputmode="decimal" name="answer" id="answer-${q.id}" data-answer="${q.id}" value="${esc(state.answers[q.id] || "")}" aria-describedby="feedback-${q.id}" maxlength="100"></label><button type="submit">Check answer ${i + 1}</button></div></form><p id="feedback-${q.id}" class="feedback ${state.checked[q.id] ? "correct" : ""}" role="status">${state.checked[q.id] ? "Matches this design. " + esc(q.reason) : ""}</p>${frame(q.hint)}<button type="button" class="secondary small" data-action="read-check" data-check-id="${q.id}">Read question ${i + 1} aloud</button></section>`).join("")}<section class="card accent"><h3>Make your thinking visible</h3>${project.evidence.map((e, i) => textField(`evidence-${i}`, e, state.evidence[i], "Describe your reasoning here. Keep drawings or physical models with your report.")).join("")}${frame("I represented ___ with ___. The calculation ___ shows ___. This makes sense because ___.")}</section>`;
  }
  if (state.stage === 3)
    return `<section class="card accent"><p class="eyebrow">Design update</p><h3>${esc(project.twist)}</h3><p>1. Save your first tested design.<br>2. Return to Build and change at least one input.<br>3. Recheck the new math, then explain the tradeoff here.</p>${state.baseline ? '<p class="notice good">Your first design is saved for comparison. It stays fixed while you revise.</p>' : action("baseline", "Save my tested first design", false)}<p id="baseline-status" role="status"></p><div class="actions compact">${action("build", "Change my design")}${action("test", "Recheck the math")}</div>${comparison(p)}${textField("critique", "Ask a partner—or be your own skeptical reviewer. What should be checked?", state.critique, "Try: Which assumption is weakest? Which unit could be confused? Would the design still work with different numbers?")}${frame("I can follow ___. I want to check ___ because ___. An example that would test it is ___.")}${textField("revision", "What changed, what happened, and why is the revised design better—or a useful tradeoff?", state.revision, "Use at least two before-and-after values. A revision can reveal that your first design was better; explain the evidence.")}${frame("I changed ___ from ___ to ___. As a result, ___ changed from ___ to ___. I gained ___ but gave up ___.")}</section><section class="card"><h3>Optional stretch: convince a skeptic</h3><p>Find a different design that works. Is yours always better, or only under your assumptions? Support your answer with a counterexample or a general argument.</p></section>`;
  return `<section class="card accent"><h3>Your recommendation</h3>${textField("claim", "What should your audience choose, and why?", state.claim, "Write a claim, support it with math from your design, explain how the evidence supports your claim, and name one limitation.")}${frame("I recommend ___ because ___. My evidence is ___ and ___. This supports my choice because ___. The model does not account for ___.")}<h3>Review before sharing</h3><ul class="review-list">${["My quantities, units and math match the current design.", "My drawing, table, graph or physical model is labeled and ready to include.", "I explained the original and revised designs with evidence.", "My recommendation includes a reason and a limitation."].map((s, i) => `<li><label><input type="checkbox" data-review="${i}" ${state.review[i] ? "checked" : ""}>${s}</label></li>`).join("")}</ul><div id="readiness">${readiness(p)}</div><div class="actions">${action("report", "Download my report", false)}${action("print", "Print / Save as PDF")}${action("backup", "Download editable backup")}</div><p class="hint">You can export a draft at any time. A complete checklist means ready for a human review, not an automatic grade. Attach your drawing and submit using your teacher’s usual method.</p></section><section class="card"><h3>What your teacher will look for</h3><div class="rubric-grid"><div><strong>Accurate mathematics</strong><p>Correct calculations, notation and units. Explain at least one check.</p></div><div><strong>Useful representations</strong><p>Labels connect the drawing, table, graph or model to the numbers.</p></div><div><strong>Reasoned decisions</strong><p>A claim uses specific evidence and acknowledges a limitation.</p></div><div><strong>Purposeful revision</strong><p>Compare both designs and explain the effect of your change.</p></div></div></section><details><summary>Preview the text report</summary><pre id="report-preview" class="report-preview">${esc(report())}</pre></details>`;
}
function modelView(m) {
  return m.errors.length
    ? `<div class="notice" role="alert"><strong>Check these inputs:</strong><ul>${m.errors.map((e) => `<li>${esc(e)}</li>`).join("")}</ul></div>`
    : `<p class="model-rule">${esc(m.rule)}</p>${visualMarkup(m)}`;
}
function comparison(p) {
  if (!state.baseline) return "";
  const old = model(project, state.baseline.design);
  const comparable = !p.m.errors.length && p.passed === p.total;
  return `<h3 class="compact">Your design comparison</h3><p>${p.changed ? "At least one design input changed." : "Change at least one input to test a revision."}</p><div class="table-scroll"><table><caption>First design → current design</caption><thead><tr><th scope="col">Quantity</th><th scope="col">First</th><th scope="col">Current</th></tr></thead><tbody>${fieldsFor(
    project,
  )
    .map(
      (f) =>
        `<tr><th scope="row">${esc(f.label)}</th><td>${esc(state.baseline.design[f.key])}</td><td>${esc(state.design[f.key])}</td></tr>`,
    )
    .join(
      "",
    )}</tbody></table></div>${comparable ? `<details open><summary>Compare checked outcomes</summary><div class="table-scroll"><table><caption>Use two of these outcomes in your explanation</caption><thead><tr><th scope="col">Math check</th><th scope="col">First</th><th scope="col">Current</th></tr></thead><tbody>${old.checks.map((q, i) => `<tr><th scope="row">${esc(q.unit || q.id)} · check ${i + 1}</th><td>${format(q.answer)}</td><td>${format(p.m.checks[i].answer)}</td></tr>`).join("")}</tbody></table></div></details>` : '<p class="notice">Recheck all current answers in Test to reveal the outcome comparison.</p>'}`;
}
function readiness(p) {
  const todo = [];
  if (!state.choice || !state.vision.trim()) todo.push("choose a context and describe your goal");
  if (p.m.errors.length || p.passed !== 6) todo.push("complete all six current math checks");
  if (state.evidence.some((s) => !s.trim())) todo.push("explain the three evidence prompts");
  if (!p.changed) todo.push("save a first design and change at least one input");
  if (!state.critique.trim() || !state.revision.trim())
    todo.push("add critique and revision reasoning");
  if (!state.claim.trim()) todo.push("write your recommendation");
  if (!state.review.every(Boolean)) todo.push("finish your self-review");
  return `<p class="notice ${p.ready ? "good" : ""}" role="status">${p.ready ? "Ready for teacher review. Your calculations match; your teacher will review the reasoning and product." : `Draft: ${esc(todo.join("; "))}.`}</p>`;
}
function updatePublish() {
  if ($("#readiness")) $("#readiness").innerHTML = readiness(progress(project, state));
  if ($("#report-preview")) $("#report-preview").textContent = report();
}
function bind() {
  document.querySelectorAll("[data-stage]").forEach((b) =>
    b.addEventListener("click", () => {
      state.stage = Number(b.dataset.stage);
      save();
      render(true);
    }),
  );
  document
    .querySelectorAll("[data-action]")
    .forEach((b) =>
      b.addEventListener("click", () => doAction(b.dataset.action, b.dataset.checkId)),
    );
  document.querySelectorAll("[name=context]").forEach((el) =>
    el.addEventListener("change", () => {
      state.choice = el.value;
      save();
    }),
  );
  document.querySelectorAll("[data-text]").forEach((el) =>
    el.addEventListener("input", () => {
      const k = el.dataset.text;
      if (k.startsWith("evidence-")) state.evidence[Number(k.split("-")[1])] = el.value;
      else state[k] = el.value;
      save();
      updatePublish();
    }),
  );
  document.querySelectorAll("[data-review]").forEach((el) =>
    el.addEventListener("change", () => {
      state.review[Number(el.dataset.review)] = el.checked;
      save();
      updatePublish();
    }),
  );
  document.querySelectorAll("[data-design]").forEach((el) =>
    el.addEventListener("input", () => {
      state.design[el.dataset.design] = el.value;
      state.checked = {};
      state.review[0] = false;
      save();
      if ($("#model-preview"))
        $("#model-preview").innerHTML =
          '<p class="notice">Inputs changed. Update your model, then recheck your answers in Test.</p>';
    }),
  );
  $("#design-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    $("#model-preview").innerHTML = modelView(model(project, state.design));
    save();
  });
  document.querySelectorAll("[data-answer]").forEach((el) =>
    el.addEventListener("input", () => {
      state.answers[el.dataset.answer] = el.value;
      delete state.checked[el.dataset.answer];
      state.review[0] = false;
      const feedback = $(`#feedback-${el.dataset.answer}`);
      feedback.textContent = "";
      feedback.className = "feedback";
      $(`#card-${el.dataset.answer}`).classList.remove("passed");
      save();
      refreshMeter();
    }),
  );
  document.querySelectorAll("[data-check]").forEach((form) =>
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = model(project, state.design).checks.find((q) => q.id === form.dataset.check);
      if (!q) return;
      const good = matches(state.answers[q.id], q.answer);
      state.checked[q.id] = good;
      const feedback = $(`#feedback-${q.id}`);
      feedback.textContent = good
        ? `Matches this design. ${q.reason}`
        : `Not yet. ${q.hint} Try again; your work stays here.`;
      feedback.className = `feedback ${good ? "correct" : "retry"}`;
      $(`#card-${q.id}`).classList.toggle("passed", good);
      save();
      refreshMeter();
    }),
  );
  $("#import-file").addEventListener("change", importBackup);
}
function refreshMeter() {
  const p = progress(project, state);
  const meter = $(".checkpoint-meter");
  if (meter) {
    meter.querySelector("progress").value = p.passed;
    meter.querySelector("strong").textContent = `${p.passed} of 6 checks match your current design`;
  }
  const chips = document.querySelectorAll(".meta .chip");
  if (chips[1]) chips[1].textContent = `${p.passed}/6 math checks`;
}
function download(name, body, type) {
  const url = URL.createObjectURL(new Blob([body], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("#file-status").textContent = `Downloaded ${name}. Keep the file with your project materials.`;
}
function doAction(name, checkId) {
  if (name === "build" || name === "test") {
    state.stage = name === "build" ? 1 : 2;
    save();
    render(true);
  }
  if (name === "backup")
    download(
      `${project.id}-project-backup.json`,
      JSON.stringify(state, null, 2),
      "application/json",
    );
  if (name === "restore") {
    $("#import-file").value = "";
    $("#import-file").click();
  }
  if (name === "supports") {
    state.supports = !state.supports;
    save();
    render();
  }
  if (name === "baseline") {
    const p = progress(project, state);
    if (p.passed !== 6 || p.m.errors.length) {
      $("#baseline-status").textContent =
        "Test all six answers for your first design before saving it for comparison.";
      return;
    }
    state.baseline = { design: { ...state.design } };
    save();
    render();
  }
  if (name === "report")
    download(`${project.id}-math-defense.txt`, report(), "text/plain;charset=utf-8");
  if (name === "print") {
    let pre = $("#print-report");
    if (!pre) {
      pre = document.createElement("pre");
      pre.id = "print-report";
      document.body.append(pre);
    }
    pre.textContent = report();
    window.print();
  }
  if (name === "read" || name === "read-check") {
    if (!("speechSynthesis" in window)) {
      $("#file-status").textContent =
        "Read-aloud is unavailable in this browser. Use your device’s reading tool or ask a partner to read with you.";
      return;
    }
    speechSynthesis.cancel();
    let spoken;
    if (name === "read-check") {
      const question = model(project, state.design).checks.find((q) => q.id === checkId);
      spoken = question
        ? `${question.prompt}. Answer in ${question.unit || "numbers"}. Strategy: ${question.hint}`
        : "";
    } else {
      const copy = $("#stage-panel").cloneNode(true);
      copy
        .querySelectorAll("button,input,textarea,select,details:not([open])")
        .forEach((el) => el.remove());
      spoken = copy.textContent;
    }
    const u = new SpeechSynthesisUtterance(spoken);
    u.lang = "en-US";
    u.rate = 0.88;
    speechSynthesis.speak(u);
  }
  if (name === "stop-reading" && "speechSynthesis" in window) speechSynthesis.cancel();
}
async function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const status = $("#file-status");
  if (file.size > 100000) {
    status.textContent =
      "This file is too large for a project backup. Choose the JSON file downloaded by this studio.";
    return;
  }
  try {
    const candidate = clean(project, JSON.parse(await file.text()));
    const hasWork =
      state.vision.trim() ||
      Object.keys(state.answers).length ||
      state.claim.trim() ||
      state.evidence.some((s) => s.trim());
    if (hasWork) {
      const keep = document.createElement("div");
      keep.className = "notice";
      keep.textContent =
        "Restoring replaces this studio’s current work. Download a backup first if you want to keep it. ";
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Replace with this backup";
      button.addEventListener("click", () => {
        state = candidate;
        save();
        restoreMessage = "Backup restored. Your work is ready to continue.";
        render(true);
      });
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "secondary";
      cancel.textContent = "Keep current work";
      cancel.addEventListener("click", () => keep.remove());
      keep.append(button, cancel);
      status.replaceChildren(keep);
    } else {
      state = candidate;
      save();
      restoreMessage = "Backup restored. Your work is ready to continue.";
      render(true);
    }
  } catch (error) {
    status.textContent = `Backup not restored. ${error instanceof Error ? error.message : "Choose a valid Project Studio JSON backup."} Your current work is unchanged.`;
  }
}
function report() {
  const p = progress(project, state),
    m = p.m;
  const lines = [
    `EDUWONDERLAB · ${project.title}`,
    `${project.unit ? `Unit ${project.unit} · ` : ""}${UNIT_NAMES[project.unit]}`,
    p.ready
      ? "READY FOR HUMAN REVIEW — numeric checks are not a grade."
      : "DRAFT — review the unfinished items before submitting.",
    "",
    `MY CONTEXT: ${state.choice || "[not chosen]"}`,
    `MY AUDIENCE AND GOAL: ${state.vision || "[not yet written]"}`,
    "",
    "MY CURRENT DESIGN",
    ...fieldsFor(project).map((f) => `${f.label}: ${state.design[f.key]}`),
    "",
    `MODEL: ${m.rule || "Inputs need attention"}`,
    "",
    "MY MATH CHECKS",
    ...m.checks.map(
      (q, i) =>
        `${i + 1}. ${q.prompt}\nMy answer: ${state.answers[q.id] || "[not answered]"} ${q.unit}\nCheck: ${state.checked[q.id] && matches(state.answers[q.id], q.answer) ? "matches current design" : "not yet checked successfully"}`,
    ),
    "",
    "MY EVIDENCE",
    ...project.evidence.map(
      (e, i) => `${i + 1}. ${e}\n${state.evidence[i] || "[not yet explained]"}`,
    ),
    "",
    "FIRST DESIGN",
    ...(state.baseline
      ? fieldsFor(project).map((f) => `${f.label}: ${state.baseline.design[f.key]}`)
      : ["[not yet saved]"]),
    "",
    `REVISION CHALLENGE: ${project.twist}`,
    `REVIEWER QUESTION: ${state.critique || "[not yet written]"}`,
    `MY REVISION AND TRADEOFF: ${state.revision || "[not yet written]"}`,
    "",
    `MY RECOMMENDATION: ${state.claim || "[not yet written]"}`,
    "",
    "ATTACHMENTS: Add your labeled drawing, graph, table or physical-model photo using your teacher’s normal submission method.",
    "SELF-REVIEW: " + state.review.filter(Boolean).length + "/4 checked.",
    "Teacher reviews accuracy, representations, reasoning and revision. No automatic mastery score.",
  ];
  return lines.join("\n");
}
if (!id) catalog();
else if (!project) {
  main.innerHTML =
    '<h1>Choose an available project</h1><p>This project link is not in the studio catalogue.</p><a class="button" href="/curriculum/projects/studio/">Browse all missions</a>';
} else {
  load();
  render();
}
