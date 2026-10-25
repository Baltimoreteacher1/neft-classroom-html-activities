import { crumbsHTML } from "../components.js";
import { BASE, html, safeJson, storage } from "../util.js";
import { VOCABULARY_ITEMS } from "../content/vocabulary-items.js";

const KEY = "accessPracticeLab:v1:vocabulary-morphology";
const day = () => Math.floor(Date.now() / 86400000);
const readState = () => {
  const raw = safeJson(storage.get(KEY), {});
  return raw && typeof raw === "object" ? raw : {};
};
const bandKey = (band) => band === "3-5" ? "3-5" : "6-8";
const taskFor = (items, state) => {
  const due = items.filter((item) => (state.items?.[item.id]?.due ?? 0) <= day());
  const pool = due.length ? due : items;
  const idx = Math.max(0, Number(state.cursor || 0)) % pool.length;
  return pool[idx];
};

export async function render(ctx) {
  const band = bandKey(ctx.band);
  const items = VOCABULARY_ITEMS[band];
  const saved = readState();
  const state = saved[band] || {};
  const item = taskFor(items, state);
  const record = state.items?.[item.id] || {};
  const selected = Array.isArray(record.selected) ? record.selected : [];
  const checked = record.checked === true;
  const correct = record.correct === true;
  const dueCount = items.filter((row) => (state.items?.[row.id]?.due ?? 0) <= day()).length;
  const contextLine = item.context.replace(new RegExp(`\\b${item.word}\\b`, "i"), `<strong>${item.word}</strong>`);
  const selectedParts = selected.map((part) => html`<span class="vm-chip">${part}</span>`);
  const answerParts = item.parts.map((part) => html`<span class="vm-chip vm-chip-answer">${part}</span>`);
  const lettered = item.choices.map((part, i) => html`<button type="button" class="vm-part ${selected.includes(part) ? "is-selected" : ""}" data-vm-part="${part}" aria-pressed="${selected.includes(part)}"><span class="vm-part-letter">${String.fromCharCode(65+i)}</span><span>${part}</span><small>${item.meanings[part]}</small></button>`);

  return {
    title: "Word Builder · Vocabulary & Morphology",
    html: html`${crumbsHTML([["Lab", `${BASE}/?grades=${band}`], ["Vocabulary & Morphology", null]])}
      <main class="vm-studio">
        <header class="vm-hero">
          <div class="vm-hero-copy"><p class="vm-kicker">WORD STUDY · ${band === "3-5" ? "GRADES 3–5" : "GRADES 6–8"}</p>
            <h1 tabindex="-1">Word Builder</h1>
            <p>Investigate how meaningful word parts work together. Build an attested academic word, use its context, and return to it later for retrieval practice.</p>
            <div class="vm-hero-meta"><span>Today: <b>${dueCount} ${dueCount === 1 ? "word" : "words"} ready to review</b></span><span>Saved on this device</span></div>
          </div>
          <div class="vm-word-art" aria-hidden="true"><div class="vm-orbit orbit-a"></div><div class="vm-orbit orbit-b"></div><div class="vm-word-tile">re</div><div class="vm-word-plus">+</div><div class="vm-word-tile tile-b">play</div><span class="vm-art-caption">parts → meaning → use</span></div>
        </header>

        <section class="vm-workbench" aria-labelledby="vm-title">
          <div class="vm-progress-row"><span class="vm-step-label">WORD INVESTIGATION</span><span class="vm-step-detail">${item.focus} · ${item.keyUse}</span></div>
          <h2 id="vm-title">${item.prompt}</h2>
          <p class="vm-context">${html`${contextLine}`}</p>
          <div class="vm-build-area"><div class="vm-build-label">Your word</div><div class="vm-build-slots" aria-live="polite">${selectedParts.length ? selectedParts : html`<span class="vm-empty">Choose the parts that build the target word.</span>`}</div>
            <div class="vm-target">Meaning goal <span>${item.word.replace(/[a-z]/g,"•")}</span></div>
          </div>
          <fieldset class="vm-parts-field" ${checked ? "disabled" : ""}><legend>Choose and arrange the word parts</legend><div class="vm-parts-grid">${lettered}</div></fieldset>
          ${checked ? (correct ? html`<div class="vm-feedback is-correct" role="status"><b>That combination works.</b><p>${item.parts.join(" + ")} builds <strong>${item.word}</strong>. ${item.parts.map((part) => `${part} means “${item.meanings[part]}”`).join("; ")}. In this sentence, the word helps the reader understand the idea precisely.</p><p><b>Use it in ${item.domain}:</b> ${transferPrompt(item)}</p></div>` : html`<div class="vm-feedback is-try" role="status"><b>Check how each part changes the meaning.</b><p>${item.parts.map((part) => `“${part}” means ${item.meanings[part]}`).join("; ")}. Try again by choosing only parts that create the target meaning. One mistake is useful information; it does not define your language ability.</p></div>`) : ""}
          <div class="vm-actions">${checked ? html`<button class="btn btn-primary" type="button" data-vm-next>${correct ? "Next word" : "Try this word again"}</button>` : html`<button class="btn btn-primary" type="button" data-vm-check>Check my word</button><button class="btn" type="button" data-vm-clear>Clear</button>`}<button class="btn vm-hint" type="button" data-vm-hint aria-expanded="false">Show word-part clues</button></div>
          <div class="vm-hint-panel" data-vm-hint-panel hidden><b>Look closely at the context.</b> ${item.parts.map((part) => html`<span class="vm-hint-chip">${part}: ${item.meanings[part]}</span>`)}</div>
        </section>

        <section class="vm-bottom-grid" aria-label="Vocabulary connections"><article class="vm-card"><span class="vm-card-icon">↻</span><h2>Remember and reuse</h2><p>Words you miss return soon. Words you build correctly return after a longer interval. Your review history stays on this device.</p><div class="vm-review-track"><span class="vm-review-dot active"></span><span class="vm-review-line"></span><span class="vm-review-dot"></span><span class="vm-review-line"></span><span class="vm-review-dot"></span><span class="vm-review-caption">practice · revisit · retrieve</span></div></article>
          <article class="vm-card vm-link-card"><span class="vm-card-icon">↗</span><h2>Use the word in a domain</h2><p>Move from word parts to communication. Practice the domain connected to this example.</p><a class="btn vm-domain-link" href="${BASE}/${domainPath(item.domain)}?grades=${band}">Open ${item.domain} practice <span aria-hidden="true">→</span></a></article></section>
        <p class="vm-note">This activity gives feedback on a specific word-building task. It does not estimate an ACCESS result or a WIDA proficiency level.</p>
      </main>`
  };
}

function transferPrompt(item) {
  const prompts = {
    Listening: `Listen for the word “${item.word}” in directions or an explanation. What does it help you understand?`,
    Reading: `Find or imagine another sentence with “${item.word}.” What context clue would help a reader infer its meaning?`,
    Speaking: `Say a sentence with “${item.word}” that explains or supports an idea.`,
    Writing: `Write one sentence with “${item.word}” that explains the context above.`
  };
  return prompts[item.domain];
}
function domainPath(domain) { return ({ Listening:"listen", Reading:"read", Speaking:"speak", Writing:"write" })[domain]; }

export function onClick(event, ctx) {
  const button = event.target.closest("button");
  if (!button) return false;
  const band = bandKey(ctx.band);
  const items = VOCABULARY_ITEMS[band];
  const saved = readState();
  const state = saved[band] || { cursor: 0, items: {} };
  state.items ||= {};
  const item = taskFor(items, state);
  const rec = state.items[item.id] || { selected: [] };
  if (button.hasAttribute("data-vm-part") && !rec.checked) {
    const part = button.dataset.vmPart;
    rec.selected = rec.selected.includes(part) ? rec.selected.filter((p) => p !== part) : [...rec.selected, part];
    state.items[item.id] = rec;
  } else if (button.hasAttribute("data-vm-clear")) {
    rec.selected = [];
    state.items[item.id] = rec;
  } else if (button.hasAttribute("data-vm-check")) {
    const answer = item.parts;
    const selected = rec.selected || [];
    const correct = selected.length === answer.length && selected.every((part, idx) => part === answer[idx]);
    rec.checked = true;
    rec.correct = correct;
    rec.attempts = (rec.attempts || 0) + 1;
    rec.lastSeen = day();
    // Simple, inspectable retrieval spacing: a miss returns tomorrow; successful
    // retrievals expand to 3, then 7 days. Not a proficiency score.
    rec.streak = correct ? (rec.streak || 0) + 1 : 0;
    rec.due = day() + (correct ? (rec.streak === 1 ? 3 : 7) : 1);
    state.items[item.id] = rec;
  } else if (button.hasAttribute("data-vm-next")) {
    state.cursor = ((state.cursor || 0) + 1) % items.length;
  } else if (button.hasAttribute("data-vm-hint")) {
    const panel = document.querySelector("[data-vm-hint-panel]");
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    if (panel) panel.hidden = !open;
    return true;
  } else return false;
  saved[band] = state;
  storage.set(KEY, JSON.stringify(saved));
  ctx.rerender();
  return true;
}
