import { crumbsHTML } from "../components.js";
import { BASE, esc, html, icon, raw, safeJson, storage } from "../util.js";
import { VOCABULARY_ITEMS } from "../content/vocabulary-items.js";

const KEY = "accessPracticeLab:v1:vocabulary-morphology";
const day = () => Math.floor(Date.now() / 86400000);
const readState = () => {
  const raw = safeJson(storage.get(KEY), {});
  return raw && typeof raw === "object" ? raw : {};
};
const bandKey = (band) => band === "3-5" ? "3-5" : "6-8";
const taskFor = (items, state) => {
  // A word that was just checked stays on screen (with its feedback) until the learner moves on.
  const shown = items.find((item) => item.id === state.current);
  if (shown) return shown;
  const due = items.filter((item) => (state.items?.[item.id]?.due ?? 0) <= day());
  const pool = due.length ? due : items;
  const idx = Math.max(0, Number(state.cursor || 0)) % pool.length;
  return pool[idx];
};

const REVIEW_STEPS = [
  ["Tomorrow", "after a miss"],
  ["In 3 days", "first correct build"],
  ["In 7 days", "correct again"],
];

function reviewTrack(record, today) {
  const level = record.checked ? (record.correct ? Math.min(record.streak || 1, 2) : 0) : -1;
  const when = record.due != null && record.checked ? record.due - today : null;
  return html`<ol class="vm-review-track" aria-label="Review spacing">
      ${REVIEW_STEPS.map(([label, note], i) => html`<li class="${i === level ? "is-here" : ""}"><span class="vm-review-dot" aria-hidden="true"></span><strong>${label}</strong><small>${note}</small></li>`)}
    </ol>
    <p class="fine">${when == null ? "Your review history stays on this device." : `This word returns in ${when} ${when === 1 ? "day" : "days"}.`}</p>`;
}

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
  const contextLine = raw(esc(item.context).replace(new RegExp(`\\b${item.word}\\b`, "i"), `<strong>${item.word}</strong>`));
  const selectedParts = selected.map((part, i) => html`${i ? html`<span class="vm-join" aria-hidden="true">+</span>` : ""}<span class="vm-chip">${part}</span>`);
  const lettered = item.choices.map((part, i) => {
    const order = selected.indexOf(part);
    return html`<button type="button" class="vm-part ${order >= 0 ? "is-selected" : ""}" data-vm-part="${part}" aria-pressed="${order >= 0}">
      <span class="vm-part-letter">${order >= 0 ? order + 1 : String.fromCharCode(65 + i)}</span>
      <span class="vm-part-text">${part}</span>
      <small>${item.meanings[part]}</small>
    </button>`;
  });

  return {
    title: "Word Builder · Vocabulary & Morphology",
    html: html`${crumbsHTML([["Lab", `${BASE}/?grades=${band}`], ["Vocabulary & Morphology", null]])}
      <div class="vm-studio d-reading">
        <header class="vm-hero">
          <div class="vm-hero-copy"><p class="vm-kicker">${icon("words")} Word study · ${band === "3-5" ? "Grades 3–5" : "Grades 6–8"}</p>
            <h1 tabindex="-1">Word Builder</h1>
            <p>Investigate how meaningful word parts work together. Build an attested academic word, use its context, and return to it later for retrieval practice.</p>
            <div class="vm-hero-meta"><span>${icon("calendar")} Today: <b>${dueCount} ${dueCount === 1 ? "word" : "words"} ready to review</b></span><span>${icon("save")} Saved on this device</span></div>
          </div>
          <div class="vm-word-art" aria-hidden="true"><span class="vm-tile">prefix</span><span class="vm-word-plus">+</span><span class="vm-tile tile-b">root</span><span class="vm-word-plus">+</span><span class="vm-tile tile-c">suffix</span><span class="vm-art-caption">parts → meaning → use</span></div>
        </header>

        <section class="vm-workbench d-${item.domain.toLowerCase()}" aria-labelledby="vm-title">
          <div class="vm-progress-row"><span class="lx-pill">${icon(item.domain.toLowerCase())} Word investigation</span><span class="vm-step-detail">${item.focus} · ${item.keyUse} · ${item.domain}</span></div>
          <h2 id="vm-title">${item.prompt}</h2>
          <div class="vm-grid">
            <div class="vm-left">
              <p class="vm-label">In context</p>
              <p class="vm-context">${contextLine}</p>
              <div class="vm-hint-wrap"><button class="btn vm-hint" type="button" data-vm-hint aria-expanded="false">${icon("bulb")} Show word-part clues</button>
                <div class="vm-hint-panel" data-vm-hint-panel hidden><b>Look closely at the context.</b> ${item.parts.map((part) => html`<span class="vm-hint-chip">${part}: ${item.meanings[part]}</span>`)}</div></div>
            </div>
            <div class="vm-right">
              <div class="vm-build-area"><div class="vm-build-label">Your word</div><div class="vm-build-slots" aria-live="polite">${selectedParts.length ? selectedParts : html`<span class="vm-empty">Choose the parts that build the target word.</span>`}</div>
                <div class="vm-target">Meaning goal <span>${item.word.replace(/[a-z]/g, "•")}</span></div>
              </div>
              <fieldset class="vm-parts-field" ${checked ? "disabled" : ""}><legend>Choose and arrange the word parts</legend><div class="vm-parts-grid">${lettered}</div></fieldset>
              <div class="vm-actions">${checked ? html`<button class="btn btn-primary btn-domain" type="button" data-vm-next>${correct ? "Next word" : "Try this word again"} ${icon("arrow-right")}</button>` : html`<button class="btn btn-primary btn-domain" type="button" data-vm-check>Check my word</button><button class="btn" type="button" data-vm-clear>Clear</button>`}</div>
            </div>
          </div>
          ${
            checked
              ? correct
                ? html`<div class="feedback is-right" role="status"><p class="fb-title">${icon("check")} That combination works.</p><p>${item.parts.join(" + ")} builds <strong>${item.word}</strong>. ${item.parts.map((part) => `${part} means “${item.meanings[part]}”`).join("; ")}. In this sentence, the word helps the reader understand the idea precisely.</p><p><b>Use it in ${item.domain}:</b> ${transferPrompt(item)}</p></div>`
                : html`<div class="feedback is-hint" role="status"><p class="fb-title">${icon("bulb")} Check how each part changes the meaning.</p><p>${item.parts.map((part) => `“${part}” means ${item.meanings[part]}`).join("; ")}. Try again by choosing only parts that create the target meaning. One mistake is useful information; it does not define your language ability.</p></div>`
              : ""
          }
        </section>

        <section class="vm-bottom-grid" aria-label="Vocabulary connections"><article class="vm-card"><span class="vm-card-icon">${icon("retry")}</span><h2>Remember and reuse</h2><p>Words you miss return soon. Words you build correctly return after a longer interval. Your review history stays on this device.</p>${reviewTrack(record, day())}</article>
          <article class="vm-card vm-link-card"><span class="vm-card-icon">${icon(item.domain.toLowerCase())}</span><h2>Use the word in a domain</h2><p>Move from word parts to communication. Practice the domain connected to this example.</p><a class="btn vm-domain-link" href="${BASE}/${domainPath(item.domain)}?grades=${band}">Open ${item.domain} practice ${icon("arrow-right")}</a></article></section>
        <p class="vm-note">This activity gives feedback on a specific word-building task. It does not estimate an ACCESS result or a WIDA proficiency level.</p>
      </div>`
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
    state.current = item.id;
  } else if (button.hasAttribute("data-vm-next")) {
    // Leave the word ready for its next retrieval, then move on (a miss is offered again right away).
    const retry = rec.correct !== true;
    state.items[item.id] = { ...rec, selected: [], checked: false, correct: false };
    if (retry) state.current = item.id;
    else {
      delete state.current;
      state.cursor = ((state.cursor || 0) + 1) % items.length;
    }
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
