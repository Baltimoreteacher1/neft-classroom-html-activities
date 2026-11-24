import { VOCAB } from "../data.js";
import { speak, cardOf, rememberCard, recordAnswer, awardXP, countSession, shuffle, byLevel, escapeHtml, levelName } from "../core.js";

export const meta = {
  id: "vocab",
  title: "Word Bank",
  skill: "Vocabulary",
  level: "Starter–Stretch",
  blurb: "Flip, hear and self-grade 44 everyday words. Spaced repetition quietly brings back the ones you need.",
  icon: "words",
  accent: "#0e7c66",
  time: "4 min"
};

const INTERVALS = [0, 1, 3, 7, 16];
const LEVEL_OPTIONS = ["All", "A1", "A2", "B1"];

export function mount(root) {
  let level = "All";
  let queue = [];
  let index = 0;
  let flipped = false;
  let known = 0;
  let roundXp = 0;
  let bonusGiven = false;

  const levelBar = () => `<div class="speed-row" role="group" aria-label="Choose level">Level
    ${LEVEL_OPTIONS.map((l) => `<button type="button" data-action="level" data-level="${l}" aria-pressed="${l === level}">${l === "All" ? "All" : levelName(l)}</button>`).join("")}
  </div>`;

  const dots = () => `<div class="progress-dots" aria-hidden="true">${queue
    .map((_, i) => `<i class="${i < index ? "done" : i === index ? "now" : ""}"></i>`)
    .join("")}</div>`;

  function pick() {
    const pool = byLevel(VOCAB, level);
    const now = Date.now();
    const fresh = [];
    const review = [];
    const later = [];
    pool.forEach((v) => {
      const c = cardOf(v.id);
      if (c.due <= now && !c.seen) fresh.push(v);
      else if (c.due <= now) review.push(v);
      else later.push(v);
    });
    queue = [...shuffle(fresh), ...shuffle(review), ...shuffle(later)].slice(0, 10);
    index = 0;
    flipped = false;
    known = 0;
    roundXp = 0;
    bonusGiven = false;
  }

  function summary() {
    if (!bonusGiven) {
      roundXp += awardXP(15);
      countSession();
      bonusGiven = true;
    }
    const total = queue.length || 1;
    const pct = Math.round((known / total) * 100);
    const verdict = pct >= 80 ? "Deck mastered — those words are moving into long-term memory."
      : pct >= 50 ? "Good round. The tricky cards will come back first next time."
        : "Useful round. The cards you marked “Again” are queued for tomorrow, not forgotten.";
    root.innerHTML = `<div class="act"><div class="result">
      <div class="score">${known}<small> / ${total} known</small></div>
      <h3>${pct >= 50 ? "Nice work." : "Every card counts."}</h3>
      <p>${verdict}</p>
      <p class="small muted" style="margin-top:10px">+${roundXp} XP this round</p>
      <div class="act-actions">
        <button class="btn btn-primary" data-action="again">Practise 10 more</button>
        <a class="btn" href="#activities">Choose another activity</a>
      </div>
    </div></div>`;
  }

  function render() {
    if (index >= queue.length) return summary();
    const item = queue[index];
    const c = cardOf(item.id);
    const pct = Math.round((index / queue.length) * 100);
    root.innerHTML = `<div class="act">
      <div class="act-head">
        ${dots()}
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          ${levelBar()}
          <span class="count">${index + 1} / ${queue.length}</span>
        </div>
      </div>
      <div class="flashcard-wrap">
        <div class="flashcard ${flipped ? "flipped" : ""}" role="button" tabindex="0" aria-pressed="${flipped}"
             aria-label="Flashcard: ${escapeHtml(item.w)}. Activate to reveal the meaning." data-action="flip">
          <div class="inner">
            <div class="face front">
              <span class="pos">${escapeHtml(item.pos)} · ${levelName(item.lvl)}</span>
              <span class="word">${escapeHtml(item.w)}</span>
              <span class="ipa">${escapeHtml(item.ipa)}</span>
              <button type="button" class="audio-btn" data-action="say-word" data-say="${escapeHtml(item.w)}">
                <span aria-hidden="true">🔊</span> Hear it
              </button>
              <span class="flip-hint">Tap the card to reveal</span>
            </div>
            <div class="face back">
              <span class="pos">Meaning</span>
              <span class="definition">${escapeHtml(item.def)}</span>
              <span class="translation">ES · ${escapeHtml(item.es)}</span>
              <span class="example">“${escapeHtml(item.ex)}”</span>
              <button type="button" class="audio-btn on-dark" data-action="say-word" data-say="${escapeHtml(item.ex)}">
                <span aria-hidden="true">🔊</span> Example
              </button>
            </div>
          </div>
        </div>
        <div class="grade-row" data-grade-row ${flipped ? "" : "hidden"}>
          <button class="btn" data-action="grade" data-known="no">Again <span class="small muted">· soon</span></button>
          <button class="btn btn-primary" data-action="grade" data-known="yes">Got it <span aria-hidden="true">✓</span></button>
        </div>
        <p class="small muted center">Card ${index + 1} · review box ${c.box + 1} of 5 · ${pct}% of this round done</p>
      </div>
    </div>`;
  }

  function grade(knownIt) {
    const item = queue[index];
    const prev = cardOf(item.id);
    const box = knownIt ? Math.min(4, prev.box + 1) : Math.max(0, prev.box - 1);
    rememberCard(item.id, box, knownIt ? INTERVALS[box] : 0);
    recordAnswer("vocab", item.id, knownIt);
    roundXp += awardXP(knownIt ? 6 : 3);
    if (knownIt) known += 1;
    index += 1;
    flipped = false;
    render();
  }

  function onClick(e) {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "level") {
      level = target.dataset.level;
      pick();
      render();
    } else if (action === "flip") {
      flipped = !flipped;
      const card = root.querySelector(".flashcard");
      card?.classList.toggle("flipped", flipped);
      card?.setAttribute("aria-pressed", String(flipped));
      const row = root.querySelector("[data-grade-row]");
      if (row) row.hidden = !flipped;
    } else if (action === "say-word") {
      e.stopPropagation();
      speak(target.dataset.say, { rate: 0.9 });
    } else if (action === "grade") {
      grade(target.dataset.known === "yes");
    } else if (action === "again") {
      pick();
      render();
    }
  }

  function onKey(e) {
    const card = e.target.closest?.(".flashcard");
    if (!card) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick({ target: card, stopPropagation() {} });
    }
  }

  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKey);
  pick();
  render();

  return {
    destroy() {
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKey);
    }
  };
}
