import { SENTENCES } from "../data.js";
import { recordAnswer, awardXP, countSession, shuffle, byLevel, norm, escapeHtml, levelName } from "../core.js";

export const meta = {
  id: "sentence",
  title: "Word Order Workshop",
  skill: "Grammar & writing",
  level: "Starter–Stretch",
  blurb: "Rebuild real sentences — requests, apologies, small talk — with distractors and the rule behind each order.",
  icon: "construction",
  accent: "#5b4bd6",
  time: "5 min"
};

const LEVEL_OPTIONS = ["All", "A1", "A2", "B1"];

export function mount(root) {
  let level = "All";
  let queue = [];
  let index = 0;
  let tokens = [];
  let selected = [];
  let attempts = 0;
  let solved = false;
  let revealed = false;
  let xp = 0;
  let correctCount = 0;

  const levelBar = () => `<div class="speed-row" role="group" aria-label="Choose level">Level
    ${LEVEL_OPTIONS.map((l) => `<button type="button" data-action="level" data-level="${l}" aria-pressed="${l === level}">${l === "All" ? "All" : levelName(l)}</button>`).join("")}
  </div>`;

  function loadItem() {
    const item = queue[index];
    selected = [];
    attempts = 0;
    solved = false;
    revealed = false;
    const base = item.parts.map((w, i) => ({ id: `${item.id}-p${i}`, w }));
    const extra = item.extra.map((w, i) => ({ id: `${item.id}-x${i}`, w }));
    tokens = shuffle([...base, ...extra]);
  }

  function pick() {
    queue = shuffle(byLevel(SENTENCES, level)).slice(0, 5);
    index = 0;
    xp = 0;
    correctCount = 0;
    loadItem();
  }

  function summary() {
    xp += awardXP(10);
    countSession();
    root.innerHTML = `<div class="act"><div class="result">
      <div class="score">${correctCount}<small> / ${queue.length}</small></div>
      <h3>Word order, sorted.</h3>
      <p>${correctCount === queue.length ? "Every sentence landed first time — that is real control, not luck." : "The patterns you missed are the ones to say out loud tonight. Word order lives in the mouth, not the page."}</p>
      <p class="small muted" style="margin-top:10px">+${xp} XP</p>
      <div class="act-actions">
        <button class="btn btn-primary" data-action="again">New sentences</button>
        <a class="btn" href="#activities">Choose another activity</a>
      </div>
    </div></div>`;
  }

  function render() {
    if (index >= queue.length) return summary();
    const item = queue[index];
    const byId = Object.fromEntries(tokens.map((t) => [t.id, t]));
    const used = new Set(selected);
    const buildTokens = selected.map((id) => `<button type="button" class="token in-build" data-action="unpick" data-id="${id}">${escapeHtml(byId[id].w)}</button>`).join("");
    const bankTokens = tokens.map((t) => `<button type="button" class="token" data-action="pick" data-id="${t.id}" ${used.has(t.id) ? "disabled" : ""}>${escapeHtml(t.w)}</button>`).join("");
    const attempt = selected.map((id) => byId[id].w).join(" ");
    const target = item.parts.join(" ");
    const isRight = norm(attempt) === norm(target);
    const showAnswer = revealed;

    root.innerHTML = `<div class="act">
      <div class="act-head">
        <div class="progress-dots" aria-hidden="true">${queue.map((_, i) => `<i class="${i < index ? "done" : i === index ? "now" : ""}"></i>`).join("")}</div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">${levelBar()}<span class="count">${index + 1} / ${queue.length}</span></div>
      </div>
      <p class="act-prompt">${escapeHtml(item.ctx)}</p>
      <p class="act-hint">Tap the words in the order you would say them. Not every word is needed.</p>
      <div class="build-area ${selected.length ? "filled" : ""}" aria-live="polite" aria-label="Your sentence">
        ${buildTokens || `<span class="placeholder-line">Your sentence will appear here…</span>`}
      </div>
      <div class="bank" aria-label="Word options">${bankTokens}</div>

      ${solved ? `<div class="feedback">
          <strong>Perfect word order.</strong>
          <span class="answer-line">${escapeHtml(target)}</span>
          <span class="rule">💡 ${escapeHtml(item.tip)}</span>
        </div>` : ""}
      ${showAnswer && !solved ? `<div class="feedback wrong">
          <strong>Not quite — here is the sentence.</strong>
          <span class="answer-line">${escapeHtml(target)}</span>
          <span class="rule">💡 ${escapeHtml(item.tip)}</span>
        </div>` : ""}
      ${!solved && !showAnswer && attempts > 0 ? `<div class="feedback wrong">
          <strong>Try again — you are close.</strong>
          ${attempts === 1 ? "Read your line aloud. Does the verb come in the right place?" : escapeHtml(item.tip)}
        </div>` : ""}

      <div class="act-actions">
        ${solved || showAnswer
          ? `<button class="btn btn-primary" data-action="next">Next sentence →</button>`
          : `<button class="btn btn-primary" data-action="check" ${selected.length ? "" : "disabled"}>Check sentence</button>`}
        <button class="btn btn-sm" data-action="clear" ${selected.length ? "" : "disabled"}>Clear</button>
        <button class="btn btn-ghost btn-sm" data-action="hint" ${solved || showAnswer ? "disabled" : ""}>Need a hint?</button>
        ${revealed && !solved ? `<span class="small muted">The sentence is above — say it once before moving on.</span>` : ""}
      </div>
    </div>`;
  }

  function check() {
    if (solved || revealed) return;
    const item = queue[index];
    const byId = Object.fromEntries(tokens.map((t) => [t.id, t]));
    const attempt = selected.map((id) => byId[id].w).join(" ");
    if (norm(attempt) === norm(item.parts.join(" "))) {
      solved = true;
      correctCount += 1;
      recordAnswer("sentence", item.id, true);
      xp += awardXP(10);
    } else {
      attempts += 1;
      recordAnswer("sentence", item.id, false);
      if (attempts >= 2) {
        revealed = true;
        xp += awardXP(3);
      }
    }
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
    } else if (action === "pick") {
      if (selected.includes(target.dataset.id)) return;
      selected.push(target.dataset.id);
      render();
    } else if (action === "unpick") {
      selected = selected.filter((id) => id !== target.dataset.id);
      render();
    } else if (action === "clear") {
      selected = [];
      render();
    } else if (action === "check") {
      check();
    } else if (action === "hint") {
      const item = queue[index];
      attempts = Math.max(attempts, 1);
      target.insertAdjacentHTML("afterend", `<span class="small muted"> Try starting with “${escapeHtml(item.parts[0])}”.</span>`);
    } else if (action === "next") {
      index += 1;
      if (index < queue.length) loadItem();
      render();
    } else if (action === "again") {
      pick();
      render();
    }
  }

  root.addEventListener("click", onClick);
  pick();
  render();

  return { destroy() { root.removeEventListener("click", onClick); } };
}
