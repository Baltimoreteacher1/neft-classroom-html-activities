// Warm-Up Generator: a projectable five-minute language warm-up from a type, topic and key words.
import { $, copyText, escapeHtml, loadDraft, readJson, saveDraft } from "../lib.js";
import { buildWarmup } from "./frames-engine.js";

const banks = readJson("banks");
const form = $("[data-wu-form]");
const out = $("[data-wu-out]");
let countdown = null;

function read() {
  const fd = new FormData(form);
  return { type: fd.get("type"), area: fd.get("area"), topic: fd.get("topic") || "", terms: fd.get("terms") || "", band: fd.get("band"), timer: fd.has("timer") };
}
function render() {
  const input = read();
  saveDraft("warm-ups", input);
  const w = buildWarmup(input, banks);
  clearInterval(countdown);
  out.innerHTML = `
    <p class="eyebrow">Warm-up · ${escapeHtml(w.klu)}</p>
    <h2>${escapeHtml(w.title)}</h2>
    <p class="lpg-big reading">${escapeHtml(w.prompt)}</p>
    ${w.display.length ? `<div class="btn-row">${w.display.map((d) => `<span class="chip amber">${escapeHtml(d)}</span>`).join("")}</div>` : ""}
    ${w.note ? `<p class="muted">${escapeHtml(w.note)}</p>` : ""}
    <h3 class="h4 section">Say it with a frame</h3>
    <ul class="reading">${w.frames.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>
    <p class="muted">Turn and talk for 2 minutes, then share one idea with the class.</p>
    ${input.timer ? `<p class="countdown" data-left aria-live="off">5:00</p><button type="button" class="btn small secondary no-print" data-start-timer>Start timer</button>` : ""}`;
  $("[data-start-timer]", out)?.addEventListener("click", () => {
    let left = 300;
    clearInterval(countdown);
    countdown = setInterval(() => {
      left -= 1;
      const el = $("[data-left]", out);
      if (el) el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
      if (left <= 0) clearInterval(countdown);
    }, 1000);
  });
  $("[data-wu-copy]").onclick = () => copyText(`${w.title}\n${w.prompt}\n${w.display.join(" · ")}\n${w.frames.map((f) => `- ${f}`).join("\n")}`);
}
const draft = loadDraft("warm-ups");
if (draft)
  for (const [k, v] of Object.entries(draft)) {
    if (k === "timer") form.elements.timer.checked = !!v;
    else if (form.elements[k]) form.elements[k].value = v;
  }
form.addEventListener("input", render);
form.addEventListener("change", render);
render();
