// Objective + Sentence Frame Generator: instant, offline, deterministic (no AI).
import { $, copyText, escapeHtml, loadDraft, readJson, saveDraft, store } from "../lib.js";
import { buildFrames, framesToText } from "./frames-engine.js";

const banks = readJson("banks");
const form = $("[data-fg-form]");
const out = $("[data-fg-out]");
const LABELS = { "L1-2": "Levels 1–2", "L3-4": "Levels 3–4", "L5-6": "Levels 5–6" };
const CLS = { "L1-2": "b1", "L3-4": "b2", "L5-6": "b3" };

function read() {
  const fd = new FormData(form);
  return { area: fd.get("area"), grade: fd.get("grade"), topic: fd.get("topic") || "", terms: fd.get("terms") || "", klu: fd.get("klu"), bands: fd.getAll("bands") };
}
function write(v) {
  for (const [k, val] of Object.entries(v)) {
    if (k === "bands") for (const cb of form.querySelectorAll("[name=bands]")) cb.checked = val.includes(cb.value);
    else if (form.elements[k]) form.elements[k].value = val;
  }
}

function render() {
  const input = read();
  saveDraft("frame-generator", input);
  if (!input.bands.length) {
    out.innerHTML = '<div class="empty"><p>Choose at least one proficiency band.</p></div>';
    return;
  }
  const r = buildFrames(input, banks);

  out.innerHTML = `
  <div class="panel stack">
    <p class="muted">${escapeHtml(r.area)} · ${escapeHtml(r.eld)} · Key Language Use: ${escapeHtml(r.klu)} · Grades ${escapeHtml(input.grade)}</p>
    <h2 class="h4">Content objective</h2><p>${escapeHtml(r.contentObjective)}</p>
    <h2 class="h4">Language objectives</h2>
    <ul>${Object.entries(r.language).map(([b, l]) => `<li><strong>${LABELS[b]}:</strong> ${escapeHtml(l)}</li>`).join("")}</ul>
  </div>
  <h2 class="h4 section">Sentence frames</h2>
  <div class="grid cols-3">${Object.entries(r.frames).map(([b, fs]) => `<div class="band ${CLS[b]}"><h3 class="h4">${LABELS[b]}</h3><ul>${fs.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul></div>`).join("")}</div>
  <div class="panel section"><h2 class="h4">Word bank</h2><p class="btn-row">${r.wordBank.map((w) => `<span class="chip">${escapeHtml(w)}</span>`).join("")}</p></div>
  <div class="btn-row no-print section">
    <button type="button" class="btn" data-copy>Copy all</button>
    <button type="button" class="btn secondary" data-print>Print</button>
    <button type="button" class="btn secondary" data-send>Send to Activity Builder</button>
  </div>`;
  $("[data-copy]", out).addEventListener("click", () => copyText(framesToText(r, LABELS)));
  $("[data-send]", out).addEventListener("click", () => {
    store.set("handoff:frames", { title: `${input.topic}: talk and write`, frames: r.frames, prompt: `Use the frames to ${r.klu.toLowerCase()} ${input.topic}.`, words: r.wordBank });
    location.href = "/tools/activity-builder/?handoff=frames";
  });
}
const draft = loadDraft("frame-generator");
if (draft) write(draft);
form.addEventListener("input", render);
form.addEventListener("change", render);
render();
