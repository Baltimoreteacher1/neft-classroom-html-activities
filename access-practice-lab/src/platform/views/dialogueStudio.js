/**
 * Dialogues, Cloze & Flashcard Player (/dialogue-studio)
 * Integrates Ellii-style Everyday Dialogues, Grammar Stories, Visual Flashcard Player
 * (with Teacher Elicit Mode) & 3-Min Warm-Ups + English Media Lab Interactive Cloze.
 */

import { BASE, html } from "../../util.js";
import {
  CLOZE_STORIES,
  DIALOGUE_ITEMS,
  VISUAL_FLASHCARDS,
  WARMUP_PROMPTS,
} from "../data/externalIntegrationsData.js";
import { getLanguageMeta } from "../data/platformData.js";
import { STORAGE_KEYS, readStorage, updateStorage } from "../services/storageService.js";

function speakText(text) {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text || ""));
    u.lang = "en-US";
    u.rate = 0.94;
    window.speechSynthesis.speak(u);
  } catch {}
}

let activeMount = null;

export async function render(ctx) {
  const { html: pageHtml, title, mountFn } = buildDialogueStudio(ctx);
  activeMount = mountFn;
  return { title, html: pageHtml };
}

export function mount(root, ctx) {
  if (activeMount) activeMount(root, ctx);
}

function buildDialogueStudio(ctx) {
  const prefs = readStorage(STORAGE_KEYS.PREFS);
  const l1 = prefs.l1 || "es";
  const l1Meta = getLanguageMeta(l1);

  const initialTab = ["dialogues", "cloze", "flashcards", "warmups"].includes(ctx.tab) ? ctx.tab : "dialogues";
  const state = {
    tab: initialTab,
    grade: "All",
    // Dialogues
    dlgIndex: 0,
    dlgFeedback: null,
    // Cloze
    clzIndex: 0,
    clzAnswers: {}, // blankIndex -> chosen word
    clzActiveBlank: 0,
    clzFeedback: null,
    // Flashcards
    fcIndex: 0,
    fcElicit: false,
    fcRevealed: false,
    // Warm-ups
    wuProjectId: null,
  };

  const filterByGrade = (list) => {
    if (state.grade === "All") return list;
    return list.filter((item) => item.grade === state.grade || item.grade === "3–8");
  };

  const renderDialogues = (root) => {
    const items = filterByGrade(DIALOGUE_ITEMS);
    const list = items.length ? items : DIALOGUE_ITEMS;
    const item = list[state.dlgIndex % list.length];
    const doneSet = new Set(readStorage(STORAGE_KEYS.DIALOGUE).completedDialogues || []);

    const host = root.querySelector("#tlpDialoguePanel");
    host.innerHTML = "";

    const card = document.createElement("div");
    card.className = "tlp-card tlp-stack";

    const head = document.createElement("div");
    head.className = "tlp-actions-row";
    head.style.justifyContent = "space-between";
    head.innerHTML = `
      <div>
        <span class="tlp-badge tlp-badge-accent">${item.klu}</span>
        <span class="tlp-badge">${item.grade}</span>
        ${doneSet.has(item.id) ? `<span class="tlp-badge tlp-badge-level-6">Practiced</span>` : ""}
      </div>
      <div class="tlp-actions-row">
        <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpDlgListenAll">Listen Full Dialogue</button>
        <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpDlgNext">Next Dialogue →</button>
      </div>
    `;
    card.appendChild(head);

    const title = document.createElement("h2");
    title.style.margin = "0";
    title.style.fontFamily = "var(--tlp-font-serif)";
    title.textContent = item.title;
    card.appendChild(title);

    const turnsBox = document.createElement("div");
    turnsBox.className = "tlp-stack";
    item.turns.forEach((t) => {
      const row = document.createElement("div");
      row.className = `tlp-dialogue-turn${t.speaker === "B" ? " is-b" : ""}`;
      const txt = document.createElement("div");
      txt.innerHTML = `<strong style="font-size:0.84rem">${t.name}:</strong> `;
      txt.appendChild(document.createTextNode(t.text));
      const listenBtn = document.createElement("button");
      listenBtn.type = "button";
      listenBtn.className = "tlp-btn tlp-btn-ghost";
      listenBtn.style.minHeight = "34px";
      listenBtn.style.padding = "0.25rem 0.7rem";
      listenBtn.textContent = "Listen";
      listenBtn.addEventListener("click", () => speakText(t.text));
      row.appendChild(txt);
      row.appendChild(listenBtn);
      turnsBox.appendChild(row);
    });
    card.appendChild(turnsBox);

    const phrases = document.createElement("div");
    phrases.className = "tlp-tile-row";
    item.keyPhrases.forEach((kp) => {
      const chip = document.createElement("span");
      chip.className = "tlp-badge";
      chip.textContent = `${kp.phrase} — ${kp.meaning}`;
      phrases.appendChild(chip);
    });
    card.appendChild(phrases);

    const rpBox = document.createElement("div");
    rpBox.className = "tlp-stack";
    rpBox.style.paddingTop = "0.75rem";
    rpBox.style.borderTop = "1px solid var(--tlp-border)";
    const rpPrompt = document.createElement("p");
    rpPrompt.style.margin = "0";
    rpPrompt.style.fontWeight = "700";
    rpPrompt.textContent = `Your Turn (Role-Play): ${item.rolePlayPrompt}`;
    rpBox.appendChild(rpPrompt);

    item.rolePlayChoices.forEach((ch) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tlp-btn tlp-btn-ghost";
      btn.style.justifyContent = "flex-start";
      btn.style.textAlign = "left";
      btn.textContent = ch.text;
      btn.addEventListener("click", () => {
        state.dlgFeedback = { ok: ch.correct, msg: ch.feedback };
        if (ch.correct) {
          speakText(ch.text);
          updateStorage(STORAGE_KEYS.DIALOGUE, (prev) => ({
            ...prev,
            completedDialogues: Array.from(new Set([...(prev.completedDialogues || []), item.id])),
          }));
        }
        renderDialogues(root);
      });
      rpBox.appendChild(btn);
    });
    card.appendChild(rpBox);

    if (state.dlgFeedback) {
      const fb = document.createElement("div");
      fb.className = `tlp-feedback-box ${state.dlgFeedback.ok ? "is-ok" : "is-warn"}`;
      fb.setAttribute("aria-live", "polite");
      fb.textContent = state.dlgFeedback.msg;
      card.appendChild(fb);
    }

    host.appendChild(card);

    host.querySelector("#tlpDlgListenAll").addEventListener("click", () => {
      speakText(item.turns.map((t) => `${t.name}: ${t.text}`).join(" "));
    });
    host.querySelector("#tlpDlgNext").addEventListener("click", () => {
      state.dlgIndex = (state.dlgIndex + 1) % list.length;
      state.dlgFeedback = null;
      renderDialogues(root);
    });
  };

  const renderCloze = (root) => {
    const items = filterByGrade(CLOZE_STORIES);
    const list = items.length ? items : CLOZE_STORIES;
    const item = list[state.clzIndex % list.length];
    const blanks = item.segments.filter((s) => typeof s === "object");
    const doneSet = new Set(readStorage(STORAGE_KEYS.DIALOGUE).completedCloze || []);

    const host = root.querySelector("#tlpDialoguePanel");
    host.innerHTML = "";

    const card = document.createElement("div");
    card.className = "tlp-card tlp-stack";

    const head = document.createElement("div");
    head.className = "tlp-actions-row";
    head.style.justifyContent = "space-between";
    head.innerHTML = `
      <div>
        <span class="tlp-badge tlp-badge-accent">${item.grammarFocus}</span>
        <span class="tlp-badge">${item.grade}</span>
        ${doneSet.has(item.id) ? `<span class="tlp-badge tlp-badge-level-6">Completed</span>` : ""}
      </div>
      <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpClzNext">Next Story →</button>
    `;
    card.appendChild(head);

    const title = document.createElement("h2");
    title.style.margin = "0";
    title.style.fontFamily = "var(--tlp-font-serif)";
    title.textContent = item.title;
    card.appendChild(title);

    const story = document.createElement("p");
    story.style.margin = "0";
    story.style.fontSize = "1.08rem";
    story.style.lineHeight = "2";
    item.segments.forEach((seg) => {
      if (typeof seg === "string") {
        story.appendChild(document.createTextNode(seg));
      } else {
        const bBtn = document.createElement("button");
        bBtn.type = "button";
        bBtn.className = `tlp-cloze-blank${state.clzActiveBlank === seg.blank ? " is-selected" : ""}`;
        bBtn.textContent = state.clzAnswers[seg.blank] || `(${seg.blank + 1}) ___`;
        bBtn.setAttribute("aria-label", `Blank ${seg.blank + 1}`);
        bBtn.addEventListener("click", () => {
          state.clzActiveBlank = seg.blank;
          renderCloze(root);
        });
        story.appendChild(bBtn);
      }
    });
    card.appendChild(story);

    const activeBlank = blanks.find((b) => b.blank === state.clzActiveBlank) || blanks[0];
    if (activeBlank) {
      const bank = document.createElement("div");
      bank.className = "tlp-stack";
      const bankLabel = document.createElement("p");
      bankLabel.className = "tlp-muted";
      bankLabel.style.margin = "0";
      bankLabel.textContent = `Choose the best fit for Blank (${activeBlank.blank + 1}):`;
      bank.appendChild(bankLabel);

      const opts = document.createElement("div");
      opts.className = "tlp-tile-row";
      activeBlank.options.forEach((opt) => {
        const ob = document.createElement("button");
        ob.type = "button";
        ob.className = "tlp-letter-tile";
        ob.textContent = opt;
        ob.addEventListener("click", () => {
          state.clzAnswers[activeBlank.blank] = opt;
          state.clzFeedback = null;
          if (activeBlank.blank + 1 < blanks.length) {
            state.clzActiveBlank = activeBlank.blank + 1;
          }
          renderCloze(root);
        });
        opts.appendChild(ob);
      });
      bank.appendChild(opts);
      card.appendChild(bank);
    }

    const actions = document.createElement("div");
    actions.className = "tlp-actions-row";
    actions.innerHTML = `
      <button type="button" class="tlp-btn tlp-btn-primary" id="tlpClzCheck">Check Story</button>
      <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpClzReset">Clear Blanks</button>
    `;
    card.appendChild(actions);

    if (state.clzFeedback) {
      const fb = document.createElement("div");
      fb.className = `tlp-feedback-box ${state.clzFeedback.ok ? "is-ok" : "is-warn"}`;
      fb.setAttribute("aria-live", "polite");
      fb.textContent = state.clzFeedback.msg;
      card.appendChild(fb);
    }

    host.appendChild(card);

    host.querySelector("#tlpClzCheck").addEventListener("click", () => {
      const missing = blanks.filter((b) => !state.clzAnswers[b.blank]);
      if (missing.length) {
        state.clzFeedback = { ok: false, msg: `Fill in all ${blanks.length} blanks before checking.` };
      } else {
        const wrong = blanks.filter((b) => state.clzAnswers[b.blank] !== b.answer);
        if (wrong.length === 0) {
          state.clzFeedback = { ok: true, msg: `All ${blanks.length} blanks are accurate! Grammar Rule: ${item.rule}` };
          updateStorage(STORAGE_KEYS.DIALOGUE, (prev) => ({
            ...prev,
            completedCloze: Array.from(new Set([...(prev.completedCloze || []), item.id])),
          }));
        } else {
          state.clzFeedback = { ok: false, msg: `${blanks.length - wrong.length} of ${blanks.length} match. Check blank (${wrong[0].blank + 1}). Hint: ${item.rule}` };
        }
      }
      renderCloze(root);
    });
    host.querySelector("#tlpClzReset").addEventListener("click", () => {
      state.clzAnswers = {};
      state.clzActiveBlank = 0;
      state.clzFeedback = null;
      renderCloze(root);
    });
    host.querySelector("#tlpClzNext").addEventListener("click", () => {
      state.clzIndex = (state.clzIndex + 1) % list.length;
      state.clzAnswers = {};
      state.clzActiveBlank = 0;
      state.clzFeedback = null;
      renderCloze(root);
    });
  };

  const renderFlashcards = (root) => {
    const cardItem = VISUAL_FLASHCARDS[state.fcIndex % VISUAL_FLASHCARDS.length];
    const l1Text = l1 !== "en" && cardItem.l1?.[l1] ? `${l1Meta.label}: ${cardItem.l1[l1]}` : "";
    const hideWord = state.fcElicit && !state.fcRevealed;

    const host = root.querySelector("#tlpDialoguePanel");
    host.innerHTML = "";

    const card = document.createElement("div");
    card.className = "tlp-card tlp-stack";

    const ctrl = document.createElement("div");
    ctrl.className = "tlp-actions-row";
    ctrl.style.justifyContent = "space-between";
    ctrl.innerHTML = `
      <div>
        <span class="tlp-badge tlp-badge-accent">${cardItem.category}</span>
        <span class="tlp-badge tlp-tabular">${(state.fcIndex % VISUAL_FLASHCARDS.length) + 1} / ${VISUAL_FLASHCARDS.length}</span>
      </div>
      <div class="tlp-actions-row">
        <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpFcElicit" aria-pressed="${state.fcElicit}">
          ${state.fcElicit ? "Teacher Elicit Mode: On" : "Teacher Elicit Mode: Off"}
        </button>
      </div>
    `;
    card.appendChild(ctrl);

    const stage = document.createElement("div");
    stage.className = "tlp-flashcard-stage";
    stage.innerHTML = `
      <div class="tlp-flashcard-icon">${cardItem.svg}</div>
      <h2 style="margin:0;font-family:var(--tlp-font-serif);font-size:2rem">${hideWord ? "Name this concept..." : cardItem.word}</h2>
      <p class="tlp-muted" style="margin:0">${hideWord ? "Use the picture and definition clue below." : cardItem.phonetic}</p>
      <p style="margin:0;max-width:48ch">${cardItem.meaning}</p>
      ${!hideWord ? `<p class="tlp-muted" style="margin:0"><em>"${cardItem.sentence}"</em></p>` : ""}
      ${!hideWord && l1Text ? `<span class="tlp-badge">${l1Text}</span>` : ""}
    `;
    card.appendChild(stage);

    const nav = document.createElement("div");
    nav.className = "tlp-actions-row";
    nav.style.justifyContent = "space-between";
    nav.innerHTML = `
      <div class="tlp-actions-row">
        <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpFcPrev">← Previous</button>
        <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpFcNext">Next →</button>
      </div>
      <div class="tlp-actions-row">
        ${hideWord ? `<button type="button" class="tlp-btn tlp-btn-primary" id="tlpFcReveal">Reveal Word</button>` : ""}
        <button type="button" class="tlp-btn tlp-btn-primary" id="tlpFcListen">Pronounce & Sentence</button>
      </div>
    `;
    card.appendChild(nav);
    host.appendChild(card);

    host.querySelector("#tlpFcElicit").addEventListener("click", () => {
      state.fcElicit = !state.fcElicit;
      state.fcRevealed = false;
      renderFlashcards(root);
    });
    const rev = host.querySelector("#tlpFcReveal");
    if (rev) {
      rev.addEventListener("click", () => {
        state.fcRevealed = true;
        renderFlashcards(root);
      });
    }
    host.querySelector("#tlpFcListen").addEventListener("click", () => {
      speakText(`${cardItem.word}. ${cardItem.sentence}`);
      updateStorage(STORAGE_KEYS.DIALOGUE, (prev) => ({
        ...prev,
        reviewedCards: Array.from(new Set([...(prev.reviewedCards || []), cardItem.id])),
      }));
    });
    host.querySelector("#tlpFcPrev").addEventListener("click", () => {
      state.fcIndex = (state.fcIndex - 1 + VISUAL_FLASHCARDS.length) % VISUAL_FLASHCARDS.length;
      state.fcRevealed = false;
      renderFlashcards(root);
    });
    host.querySelector("#tlpFcNext").addEventListener("click", () => {
      state.fcIndex = (state.fcIndex + 1) % VISUAL_FLASHCARDS.length;
      state.fcRevealed = false;
      renderFlashcards(root);
    });
  };

  const renderWarmups = (root) => {
    const items = state.grade === "All" ? WARMUP_PROMPTS : WARMUP_PROMPTS.filter((w) => w.grade === state.grade);
    const list = items.length ? items : WARMUP_PROMPTS;
    const host = root.querySelector("#tlpDialoguePanel");
    host.innerHTML = "";

    if (state.wuProjectId) {
      const wu = WARMUP_PROMPTS.find((w) => w.id === state.wuProjectId);
      if (wu) {
        const proj = document.createElement("div");
        proj.className = "tlp-card tlp-stack";
        proj.style.padding = "2rem";
        proj.innerHTML = `
          <div class="tlp-actions-row" style="justify-content:space-between">
            <span class="tlp-badge tlp-badge-accent">Projected Warm-Up · ${wu.grade}</span>
            <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpWuClose">Exit Project View</button>
          </div>
          <h2 style="margin:0;font-family:var(--tlp-font-serif);font-size:2rem">${wu.title}</h2>
          <p style="margin:0;font-size:1.35rem;line-height:1.5">${wu.prompt}</p>
          <div class="tlp-feedback-box is-ok" style="font-size:1.15rem">
            <strong>Sentence Frame:</strong> ${wu.frame}
          </div>
        `;
        host.appendChild(proj);
        proj.querySelector("#tlpWuClose").addEventListener("click", () => {
          state.wuProjectId = null;
          renderWarmups(root);
        });
        return;
      }
    }

    const grid = document.createElement("div");
    grid.className = "tlp-grid-3";
    list.forEach((wu) => {
      const c = document.createElement("article");
      c.className = "tlp-resource-card";
      c.innerHTML = `
        <div>
          <div class="tlp-actions-row" style="justify-content:space-between;margin-bottom:0.45rem">
            <span class="tlp-badge tlp-badge-accent">${wu.focus}</span>
            <span class="tlp-muted" style="font-size:0.8rem">${wu.grade}</span>
          </div>
          <h3 style="margin:0 0 0.35rem">${wu.title}</h3>
          <p class="tlp-muted" style="margin:0;font-size:0.88rem">${wu.prompt}</p>
        </div>
        <div class="tlp-actions-row">
          <button type="button" class="tlp-btn tlp-btn-primary" data-wu-proj="${wu.id}">Project Prompt</button>
        </div>
      `;
      grid.appendChild(c);
    });
    host.appendChild(grid);

    host.querySelectorAll("[data-wu-proj]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.wuProjectId = btn.dataset.wuProj;
        renderWarmups(root);
      });
    });
  };

  const renderActiveTab = (root) => {
    root.querySelectorAll("[data-dlg-tab]").forEach((btn) => {
      btn.setAttribute("aria-selected", btn.dataset.dlgTab === state.tab ? "true" : "false");
    });
    root.querySelectorAll("[data-dlg-grade]").forEach((btn) => {
      btn.setAttribute("aria-selected", btn.dataset.dlgGrade === state.grade ? "true" : "false");
    });
    if (state.tab === "dialogues") renderDialogues(root);
    else if (state.tab === "cloze") renderCloze(root);
    else if (state.tab === "flashcards") renderFlashcards(root);
    else renderWarmups(root);
  };

  const mountFn = (root) => {
    root.querySelectorAll("[data-dlg-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.tab = btn.dataset.dlgTab;
        state.wuProjectId = null;
        renderActiveTab(root);
      });
    });
    root.querySelectorAll("[data-dlg-grade]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.grade = btn.dataset.dlgGrade;
        state.dlgIndex = 0;
        state.clzIndex = 0;
        state.clzAnswers = {};
        state.clzActiveBlank = 0;
        state.dlgFeedback = null;
        state.clzFeedback = null;
        renderActiveTab(root);
      });
    });
    renderActiveTab(root);
  };

  return {
    title: "Dialogues, Cloze & Flashcards — The Language Page",
    mountFn,
    html: html`
      <section class="tlp-page">
        <header class="tlp-hero">
          <div>
            <p class="tlp-eyebrow">Prepare & Practice · Discourse, Grammar & Visuals</p>
            <h1>Dialogues, Cloze & Flashcards</h1>
            <p class="tlp-muted tlp-measure">
              Rehearse everyday school dialogues, complete grammar-in-context cloze stories, run the visual flashcard player, and project 3-minute warm-ups.
            </p>
          </div>
          <div class="tlp-actions-row">
            <a class="tlp-btn tlp-btn-ghost" href="${BASE}/">← Back to Hub</a>
          </div>
        </header>

        <div class="tlp-actions-row" style="justify-content:space-between;margin-bottom:1rem">
          <div class="tlp-actions-row" role="tablist" aria-label="Dialogue Studio modes">
            <button type="button" class="tlp-tab" role="tab" data-dlg-tab="dialogues" aria-selected="true">Everyday Dialogues</button>
            <button type="button" class="tlp-tab" role="tab" data-dlg-tab="cloze" aria-selected="false">Grammar Stories & Cloze</button>
            <button type="button" class="tlp-tab" role="tab" data-dlg-tab="flashcards" aria-selected="false">Flashcard Player</button>
            <button type="button" class="tlp-tab" role="tab" data-dlg-tab="warmups" aria-selected="false">3-Min Warm-Ups</button>
          </div>
          <div class="tlp-actions-row" role="group" aria-label="Filter by grade band">
            ${["All", "K–2", "3–5", "6–8"].map(
              (g) => html`<button type="button" class="tlp-tab" data-dlg-grade="${g}" aria-selected="${g === "All" ? "true" : "false"}">${g}</button>`,
            )}
          </div>
        </div>

        <div id="tlpDialoguePanel"></div>
      </section>
    `,
  };
}
