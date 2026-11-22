/**
 * Phonics, Sound & Trail Quest (/skill-arcade)
 * Integrates SplashLearn-style Phonics Word Building & Comprehension Micro-Drills
 * with English Media Lab-style Minimal Pairs & Untimed Trail Quest Board Game.
 */

import { BASE, html } from "../../util.js";
import {
  COMPREHENSION_ITEMS,
  MINIMAL_PAIR_ITEMS,
  PHONICS_ITEMS,
  TRAIL_QUESTIONS,
} from "../data/externalIntegrationsData.js";
import { getLanguageMeta } from "../data/platformData.js";
import { STORAGE_KEYS, readStorage, updateStorage } from "../services/storageService.js";

function speakWord(text, slow = false) {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text || ""));
    u.lang = "en-US";
    u.rate = slow ? 0.75 : 0.96;
    window.speechSynthesis.speak(u);
  } catch {}
}

const BOOSTS = { 3: 7, 9: 14, 13: 17 };

let activeMount = null;

export async function render(ctx) {
  const { html: pageHtml, title, mountFn } = buildSkillArcade(ctx);
  activeMount = mountFn;
  return { title, html: pageHtml };
}

export function mount(root, ctx) {
  if (activeMount) activeMount(root, ctx);
}

function buildSkillArcade(ctx) {
  const prefs = readStorage(STORAGE_KEYS.PREFS);
  const saved = readStorage(STORAGE_KEYS.ARCADE);
  const l1 = prefs.l1 || "es";
  const l1Meta = getLanguageMeta(l1);

  const initialTab = ["phonics", "pairs", "comprehension", "trail"].includes(ctx.tab) ? ctx.tab : "phonics";
  const state = {
    tab: initialTab,
    grade: "All",
    slowAudio: false,
    // Phonics
    phIndex: 0,
    builtTiles: [], // indices into current item's tiles
    phFeedback: null,
    // Minimal pairs
    mpIndex: 0,
    mpFeedback: null,
    // Comprehension
    compIndex: 0,
    compFeedback: null,
    // Trail Quest
    players: 1,
    turn: 0,
    positions: [1, 1],
    lastRoll: null,
    pendingChallenge: null,
    trailMsg: "Roll the die to move along the Language Trail.",
    trailQIndex: 0,
  };

  const filterByGrade = (list) => {
    if (state.grade === "All") return list;
    return list.filter((item) => item.grade === state.grade);
  };

  const renderPhonics = (root) => {
    const items = filterByGrade(PHONICS_ITEMS);
    const list = items.length ? items : PHONICS_ITEMS;
    const item = list[state.phIndex % list.length];
    const builtWord = state.builtTiles.map((i) => item.tiles[i]).join("");
    const l1Hint = l1 !== "en" && item.l1?.[l1] ? `${l1Meta.label}: ${item.l1[l1]}` : "";
    const solvedSet = new Set(readStorage(STORAGE_KEYS.ARCADE).solvedPhonics || []);

    const host = root.querySelector("#tlpArcadePanel");
    host.innerHTML = "";

    const card = document.createElement("div");
    card.className = "tlp-card tlp-stack";

    const header = document.createElement("div");
    header.className = "tlp-actions-row";
    header.style.justifyContent = "space-between";
    header.innerHTML = `
      <div>
        <span class="tlp-badge tlp-badge-accent">${item.category}</span>
        <span class="tlp-badge">${item.grade}</span>
        ${solvedSet.has(item.id) ? `<span class="tlp-badge tlp-badge-level-6">Mastered</span>` : ""}
      </div>
      <div class="tlp-actions-row">
        <button type="button" class="tlp-btn tlp-btn-primary" id="tlpPhListen">Listen</button>
        <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpPhSlow" aria-pressed="${state.slowAudio}">${state.slowAudio ? "Slow: On" : "Slow: Off"}</button>
      </div>
    `;
    card.appendChild(header);

    const clue = document.createElement("p");
    clue.style.margin = "0";
    clue.style.fontSize = "1.05rem";
    clue.innerHTML = `<strong>Clue:</strong> `;
    clue.appendChild(document.createTextNode(item.clue));
    card.appendChild(clue);

    if (l1Hint) {
      const l1El = document.createElement("p");
      l1El.className = "tlp-muted";
      l1El.style.margin = "0";
      l1El.textContent = l1Hint;
      card.appendChild(l1El);
    }

    const slotRow = document.createElement("div");
    slotRow.className = "tlp-tile-row";
    slotRow.setAttribute("aria-label", "Built word");
    const slot = document.createElement("div");
    slot.className = `tlp-word-slot${builtWord ? " is-filled" : ""}`;
    slot.style.minWidth = "160px";
    slot.textContent = builtWord || "Tap tiles below";
    slotRow.appendChild(slot);
    card.appendChild(slotRow);

    const tileRow = document.createElement("div");
    tileRow.className = "tlp-tile-row";
    tileRow.setAttribute("role", "group");
    tileRow.setAttribute("aria-label", "Letter and sound tiles");
    item.tiles.forEach((tile, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tlp-letter-tile";
      btn.textContent = tile;
      btn.disabled = state.builtTiles.includes(idx);
      btn.addEventListener("click", () => {
        state.builtTiles.push(idx);
        state.phFeedback = null;
        speakWord(tile, state.slowAudio);
        renderPhonics(root);
      });
      tileRow.appendChild(btn);
    });
    card.appendChild(tileRow);

    const actions = document.createElement("div");
    actions.className = "tlp-actions-row";
    actions.innerHTML = `
      <button type="button" class="tlp-btn tlp-btn-primary" id="tlpPhCheck">Check Word</button>
      <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpPhClear">Clear</button>
      <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpPhNext">Next Word →</button>
    `;
    card.appendChild(actions);

    if (state.phFeedback) {
      const fb = document.createElement("div");
      fb.className = `tlp-feedback-box ${state.phFeedback.ok ? "is-ok" : "is-warn"}`;
      fb.setAttribute("aria-live", "polite");
      fb.textContent = state.phFeedback.msg;
      card.appendChild(fb);
    }

    host.appendChild(card);

    host.querySelector("#tlpPhListen").addEventListener("click", () => speakWord(`${item.word}. ${item.sentence}`, state.slowAudio));
    host.querySelector("#tlpPhSlow").addEventListener("click", () => {
      state.slowAudio = !state.slowAudio;
      renderPhonics(root);
    });
    host.querySelector("#tlpPhClear").addEventListener("click", () => {
      state.builtTiles = [];
      state.phFeedback = null;
      renderPhonics(root);
    });
    host.querySelector("#tlpPhCheck").addEventListener("click", () => {
      if (!builtWord) {
        state.phFeedback = { ok: false, msg: "Tap the sound tiles above to build the word first." };
      } else if (builtWord.toLowerCase() === item.word.toLowerCase()) {
        state.phFeedback = { ok: true, msg: `Nice! "${item.word}" — ${item.sentence}` };
        speakWord(item.word, false);
        updateStorage(STORAGE_KEYS.ARCADE, (prev) => ({
          ...prev,
          solvedPhonics: Array.from(new Set([...(prev.solvedPhonics || []), item.id])),
        }));
      } else {
        state.phFeedback = { ok: false, msg: `"${builtWord}" does not match the clue yet. Listen again and check the vowel sound.` };
      }
      renderPhonics(root);
    });
    host.querySelector("#tlpPhNext").addEventListener("click", () => {
      state.phIndex = (state.phIndex + 1) % list.length;
      state.builtTiles = [];
      state.phFeedback = null;
      renderPhonics(root);
    });
  };

  const renderPairs = (root) => {
    const items = filterByGrade(MINIMAL_PAIR_ITEMS);
    const list = items.length ? items : MINIMAL_PAIR_ITEMS;
    const item = list[state.mpIndex % list.length];
    const solvedSet = new Set(readStorage(STORAGE_KEYS.ARCADE).solvedPairs || []);

    const host = root.querySelector("#tlpArcadePanel");
    host.innerHTML = "";

    const card = document.createElement("div");
    card.className = "tlp-card tlp-stack";
    card.innerHTML = `
      <div class="tlp-actions-row" style="justify-content:space-between">
        <div>
          <span class="tlp-badge tlp-badge-accent">${item.category}</span>
          <span class="tlp-badge">${item.grade}</span>
          ${solvedSet.has(item.id) ? `<span class="tlp-badge tlp-badge-level-6">Checked</span>` : ""}
        </div>
        <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpMpNext">Next Pair →</button>
      </div>
      <div class="tlp-grid-2">
        <div class="tlp-card" style="background:var(--tlp-surface-2)">
          <div class="tlp-actions-row" style="justify-content:space-between">
            <strong style="font-size:1.35rem">${item.wordA}</strong>
            <span class="tlp-muted">${item.ipaA}</span>
          </div>
          <p class="tlp-muted" style="margin:0.4rem 0 0.75rem">${item.exampleA}</p>
          <button type="button" class="tlp-btn tlp-btn-ghost" data-mp-say="A">Listen: ${item.wordA}</button>
        </div>
        <div class="tlp-card" style="background:var(--tlp-surface-2)">
          <div class="tlp-actions-row" style="justify-content:space-between">
            <strong style="font-size:1.35rem">${item.wordB}</strong>
            <span class="tlp-muted">${item.ipaB}</span>
          </div>
          <p class="tlp-muted" style="margin:0.4rem 0 0.75rem">${item.exampleB}</p>
          <button type="button" class="tlp-btn tlp-btn-ghost" data-mp-say="B">Listen: ${item.wordB}</button>
        </div>
      </div>
      <p class="tlp-muted" style="margin:0"><strong>Sound Tip:</strong> ${item.tip}</p>
      <div class="tlp-stack" style="padding-top:0.5rem;border-top:1px solid var(--tlp-border)">
        <p style="margin:0;font-weight:600">${item.quizPrompt}</p>
        <div class="tlp-actions-row">
          <button type="button" class="tlp-btn tlp-btn-primary" data-mp-pick="${item.wordA}">${item.wordA}</button>
          <button type="button" class="tlp-btn tlp-btn-primary" data-mp-pick="${item.wordB}">${item.wordB}</button>
        </div>
      </div>
    `;
    if (state.mpFeedback) {
      const fb = document.createElement("div");
      fb.className = `tlp-feedback-box ${state.mpFeedback.ok ? "is-ok" : "is-warn"}`;
      fb.setAttribute("aria-live", "polite");
      fb.textContent = state.mpFeedback.msg;
      card.appendChild(fb);
    }
    host.appendChild(card);

    host.querySelector('[data-mp-say="A"]').addEventListener("click", () => speakWord(`${item.wordA}. ${item.exampleA}`, false));
    host.querySelector('[data-mp-say="B"]').addEventListener("click", () => speakWord(`${item.wordB}. ${item.exampleB}`, false));
    host.querySelectorAll("[data-mp-pick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pick = btn.dataset.mpPick;
        if (pick === item.correct) {
          state.mpFeedback = { ok: true, msg: `Correct! "${item.correct}" fits this meaning.` };
          updateStorage(STORAGE_KEYS.ARCADE, (prev) => ({
            ...prev,
            solvedPairs: Array.from(new Set([...(prev.solvedPairs || []), item.id])),
          }));
        } else {
          state.mpFeedback = { ok: false, msg: `Not quite—listen to both examples again and check the Sound Tip.` };
        }
        renderPairs(root);
      });
    });
    host.querySelector("#tlpMpNext").addEventListener("click", () => {
      state.mpIndex = (state.mpIndex + 1) % list.length;
      state.mpFeedback = null;
      renderPairs(root);
    });
  };

  const renderComp = (root) => {
    const items = filterByGrade(COMPREHENSION_ITEMS);
    const list = items.length ? items : COMPREHENSION_ITEMS;
    const item = list[state.compIndex % list.length];
    const solvedSet = new Set(readStorage(STORAGE_KEYS.ARCADE).solvedComp || []);

    const host = root.querySelector("#tlpArcadePanel");
    host.innerHTML = "";

    const card = document.createElement("div");
    card.className = "tlp-card tlp-stack";

    const top = document.createElement("div");
    top.className = "tlp-actions-row";
    top.style.justifyContent = "space-between";
    top.innerHTML = `
      <div>
        <span class="tlp-badge tlp-badge-accent">${item.skill}</span>
        <span class="tlp-badge">${item.grade}</span>
        ${solvedSet.has(item.id) ? `<span class="tlp-badge tlp-badge-level-6">Mastered</span>` : ""}
      </div>
      <div class="tlp-actions-row">
        <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpCompRead">Read Aloud</button>
        <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpCompNext">Next Passage →</button>
      </div>
    `;
    card.appendChild(top);

    const passage = document.createElement("blockquote");
    passage.style.margin = "0";
    passage.style.padding = "1rem";
    passage.style.borderRadius = "var(--tlp-radius-sm)";
    passage.style.background = "var(--tlp-surface-2)";
    passage.style.fontSize = "1.05rem";
    passage.textContent = item.passage;
    card.appendChild(passage);

    const q = document.createElement("p");
    q.style.margin = "0";
    q.style.fontWeight = "700";
    q.textContent = item.question;
    card.appendChild(q);

    const choicesBox = document.createElement("div");
    choicesBox.className = "tlp-stack";
    item.choices.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tlp-btn tlp-btn-ghost";
      btn.style.justifyContent = "flex-start";
      btn.style.textAlign = "left";
      btn.textContent = c.text;
      btn.addEventListener("click", () => {
        state.compFeedback = { ok: c.correct, msg: c.feedback };
        if (c.correct) {
          updateStorage(STORAGE_KEYS.ARCADE, (prev) => ({
            ...prev,
            solvedComp: Array.from(new Set([...(prev.solvedComp || []), item.id])),
          }));
        }
        renderComp(root);
      });
      choicesBox.appendChild(btn);
    });
    card.appendChild(choicesBox);

    if (state.compFeedback) {
      const fb = document.createElement("div");
      fb.className = `tlp-feedback-box ${state.compFeedback.ok ? "is-ok" : "is-warn"}`;
      fb.setAttribute("aria-live", "polite");
      fb.textContent = state.compFeedback.msg;
      card.appendChild(fb);
    }

    host.appendChild(card);

    host.querySelector("#tlpCompRead").addEventListener("click", () => speakWord(item.passage, false));
    host.querySelector("#tlpCompNext").addEventListener("click", () => {
      state.compIndex = (state.compIndex + 1) % list.length;
      state.compFeedback = null;
      renderComp(root);
    });
  };

  const renderTrail = (root) => {
    const host = root.querySelector("#tlpArcadePanel");
    host.innerHTML = "";
    const card = document.createElement("div");
    card.className = "tlp-card tlp-stack";

    const ctrl = document.createElement("div");
    ctrl.className = "tlp-actions-row";
    ctrl.style.justifyContent = "space-between";
    ctrl.innerHTML = `
      <div class="tlp-actions-row">
        <button type="button" class="tlp-tab" data-trail-p="1" aria-selected="${state.players === 1}">1 Player</button>
        <button type="button" class="tlp-tab" data-trail-p="2" aria-selected="${state.players === 2}">2 Players (Pass & Play)</button>
      </div>
      <div class="tlp-actions-row">
        <button type="button" class="tlp-btn tlp-btn-primary" id="tlpTrailRoll" ${state.pendingChallenge ? "disabled" : ""}>Roll Die (Untimed)</button>
        <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpTrailReset">New Game</button>
      </div>
    `;
    card.appendChild(ctrl);

    const status = document.createElement("p");
    status.style.margin = "0";
    status.style.fontWeight = "600";
    status.setAttribute("aria-live", "polite");
    status.textContent = state.trailMsg;
    card.appendChild(status);

    if (state.pendingChallenge) {
      const q = state.pendingChallenge.question;
      const cBox = document.createElement("div");
      cBox.className = "tlp-card tlp-stack";
      cBox.style.background = "var(--tlp-surface-2)";
      cBox.innerHTML = `
        <div><span class="tlp-badge tlp-badge-accent">${q.domain} Challenge</span></div>
        <p style="margin:0;font-weight:700">${q.prompt}</p>
      `;
      const row = document.createElement("div");
      row.className = "tlp-actions-row";
      q.choices.forEach((ch, idx) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "tlp-btn tlp-btn-primary";
        b.textContent = ch;
        b.addEventListener("click", () => {
          const pIdx = state.turn;
          if (idx === q.correct) {
            let nextPos = Math.min(20, state.positions[pIdx] + state.pendingChallenge.steps);
            let boostMsg = "";
            if (BOOSTS[nextPos]) {
              boostMsg = ` Ladder boost to tile ${BOOSTS[nextPos]}!`;
              nextPos = BOOSTS[nextPos];
            }
            state.positions[pIdx] = nextPos;
            if (nextPos >= 20) {
              state.trailMsg = `Player ${pIdx + 1} reached Finish! ${q.rule}`;
              updateStorage(STORAGE_KEYS.ARCADE, (prev) => ({ ...prev, trailWins: (prev.trailWins || 0) + 1 }));
            } else {
              state.trailMsg = `Correct! Player ${pIdx + 1} moves to tile ${nextPos}.${boostMsg} ${q.rule}`;
            }
          } else {
            state.trailMsg = `Good try! ${q.rule} Player ${pIdx + 1} stays on tile ${state.positions[pIdx]}.`;
          }
          state.pendingChallenge = null;
          if (state.players === 2) state.turn = state.turn === 0 ? 1 : 0;
          renderTrail(root);
        });
        row.appendChild(b);
      });
      cBox.appendChild(row);
      card.appendChild(cBox);
    }

    const grid = document.createElement("div");
    grid.className = "tlp-trail-grid";
    for (let n = 1; n <= 20; n++) {
      const cell = document.createElement("div");
      const isBoost = Boolean(BOOSTS[n]);
      cell.className = `tlp-trail-cell${isBoost ? " is-boost" : ""}${n === 20 ? " is-finish" : ""}`;
      const label = n === 1 ? "Start" : n === 20 ? "20 · Finish" : isBoost ? `${n} → ${BOOSTS[n]}` : String(n);
      cell.innerHTML = `<span>${label}</span>`;
      const tokens = document.createElement("div");
      tokens.className = "tlp-trail-tokens";
      if (state.positions[0] === n) {
        const t1 = document.createElement("span");
        t1.className = "tlp-trail-token";
        t1.textContent = "P1";
        tokens.appendChild(t1);
      }
      if (state.players === 2 && state.positions[1] === n) {
        const t2 = document.createElement("span");
        t2.className = "tlp-trail-token is-p2";
        t2.textContent = "P2";
        tokens.appendChild(t2);
      }
      cell.appendChild(tokens);
      grid.appendChild(cell);
    }
    card.appendChild(grid);
    host.appendChild(card);

    host.querySelectorAll("[data-trail-p]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.players = Number(btn.dataset.trailP);
        state.positions = [1, 1];
        state.turn = 0;
        state.pendingChallenge = null;
        state.trailMsg = state.players === 2 ? "2-Player Pass & Play ready. Player 1 rolls first!" : "Solo Trail Quest ready. Roll the die!";
        renderTrail(root);
      });
    });

    host.querySelector("#tlpTrailRoll").addEventListener("click", () => {
      if (state.positions[state.turn] >= 20) return;
      const steps = Math.floor(Math.random() * 4) + 1;
      const q = TRAIL_QUESTIONS[state.trailQIndex % TRAIL_QUESTIONS.length];
      state.trailQIndex += 1;
      state.pendingChallenge = { steps, question: q };
      state.trailMsg = `Player ${state.turn + 1} rolled a ${steps}! Answer to advance ${steps} spaces.`;
      renderTrail(root);
    });

    host.querySelector("#tlpTrailReset").addEventListener("click", () => {
      state.positions = [1, 1];
      state.turn = 0;
      state.pendingChallenge = null;
      state.trailMsg = "New Trail Quest started. Roll the die!";
      renderTrail(root);
    });
  };

  const renderActiveTab = (root) => {
    root.querySelectorAll("[data-arcade-tab]").forEach((btn) => {
      btn.setAttribute("aria-selected", btn.dataset.arcadeTab === state.tab ? "true" : "false");
    });
    root.querySelectorAll("[data-arcade-grade]").forEach((btn) => {
      btn.setAttribute("aria-selected", btn.dataset.arcadeGrade === state.grade ? "true" : "false");
    });
    if (state.tab === "phonics") renderPhonics(root);
    else if (state.tab === "pairs") renderPairs(root);
    else if (state.tab === "comprehension") renderComp(root);
    else renderTrail(root);
  };

  const mountFn = (root) => {
    root.querySelectorAll("[data-arcade-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.tab = btn.dataset.arcadeTab;
        renderActiveTab(root);
      });
    });
    root.querySelectorAll("[data-arcade-grade]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.grade = btn.dataset.arcadeGrade;
        state.phIndex = 0;
        state.mpIndex = 0;
        state.compIndex = 0;
        state.builtTiles = [];
        state.phFeedback = null;
        state.mpFeedback = null;
        state.compFeedback = null;
        renderActiveTab(root);
      });
    });
    renderActiveTab(root);
  };

  return {
    title: "Phonics, Sound & Trail Quest — The Language Page",
    mountFn,
    html: html`
      <section class="tlp-page">
        <header class="tlp-hero">
          <div>
            <p class="tlp-eyebrow">Practice · Phonics, Pronunciation & Reading</p>
            <h1>Phonics, Sound & Trail Quest</h1>
            <p class="tlp-muted tlp-measure">
              Build words from sound tiles, contrast minimal pairs, practice comprehension skills, and play an untimed Trail Quest board game.
            </p>
          </div>
          <div class="tlp-actions-row">
            <a class="tlp-btn tlp-btn-ghost" href="${BASE}/">← Back to Hub</a>
          </div>
        </header>

        <div class="tlp-actions-row" style="justify-content:space-between;margin-bottom:1rem">
          <div class="tlp-actions-row" role="tablist" aria-label="Skill Arcade modes">
            <button type="button" class="tlp-tab" role="tab" data-arcade-tab="phonics" aria-selected="true">Phonics Builder</button>
            <button type="button" class="tlp-tab" role="tab" data-arcade-tab="pairs" aria-selected="false">Minimal Pairs</button>
            <button type="button" class="tlp-tab" role="tab" data-arcade-tab="comprehension" aria-selected="false">Comprehension</button>
            <button type="button" class="tlp-tab" role="tab" data-arcade-tab="trail" aria-selected="false">Trail Quest</button>
          </div>
          <div class="tlp-actions-row" role="group" aria-label="Filter by grade band">
            ${["All", "K–2", "3–5", "6–8"].map(
              (g) => html`<button type="button" class="tlp-tab" data-arcade-grade="${g}" aria-selected="${g === "All" ? "true" : "false"}">${g}</button>`,
            )}
          </div>
        </div>

        <div id="tlpArcadePanel"></div>
      </section>
    `,
  };
}
