import { GRAMMAR } from "../data.js";
import { recordAnswer, awardXP, countSession, shuffle, byLevel, escapeHtml, levelName } from "../core.js";

export const meta = {
  id: "grammar",
  title: "Grammar Gym",
  skill: "Grammar",
  level: "Starter–Stretch",
  blurb: "Eight adaptive reps a round. Every answer comes with the rule, so the correction is the lesson.",
  icon: "language",
  accent: "#b0452f",
  time: "5 min"
};

const LEVEL_OPTIONS = ["All", "A1", "A2", "B1"];
const LETTERS = ["A", "B", "C", "D"];

export function mount(root) {
  let level = "All";
  let queue = [];
  let index = 0;
  let answered = false;
  let choice = null;
  let combo = 0;
  let bestCombo = 0;
  let correctCount = 0;
  let xp = 0;
  let missed = [];

  const levelBar = () => `<div class="speed-row" role="group" aria-label="Choose level">Level
    ${LEVEL_OPTIONS.map((l) => `<button type="button" data-action="level" data-level="${l}" aria-pressed="${l === level}">${l === "All" ? "All" : levelName(l)}</button>`).join("")}
  </div>`;

  function pick() {
    queue = shuffle(byLevel(GRAMMAR, level)).slice(0, 8);
    index = 0;
    answered = false;
    choice = null;
    combo = 0;
    bestCombo = 0;
    correctCount = 0;
    xp = 0;
    missed = [];
  }

  function summary() {
    xp += awardXP(12);
    countSession();
    const total = queue.length || 1;
    const pct = Math.round((correctCount / total) * 100);
    root.innerHTML = `<div class="act"><div class="result">
      <div class="score">${correctCount}<small> / ${total}</small></div>
      <h3>${pct >= 80 ? "Rule book: updated." : "Progress is built on reps."}</h3>
      <p>${missed.length ? "These are the rules to revisit — read them once, then say your own example out loud:" : "Flawless round. Raise the level or try the mixed review to keep it sharp."}</p>
      <div class="review-list">
        ${missed.map((m) => `<div><strong>${escapeHtml(m.rule)}</strong> — ${escapeHtml(m.why)}</div>`).join("")}
      </div>
      <p class="small muted" style="margin-top:14px">+${xp} XP · best streak ${bestCombo}</p>
      <div class="act-actions">
        <button class="btn btn-primary" data-action="again">Another eight</button>
        <a class="btn" href="#activities">Choose another activity</a>
      </div>
    </div></div>`;
  }

  function render() {
    if (index >= queue.length) return summary();
    const item = queue[index];
    const opts = item.options.map((opt, i) => {
      let cls = "option";
      if (answered) {
        if (i === item.answer) cls += " is-correct";
        else if (i === choice) cls += " is-wrong";
        else cls += " dim";
      }
      return `<button type="button" class="${cls}" data-action="answer" data-i="${i}" ${answered ? "disabled" : ""}>
        <span class="key">${LETTERS[i]}</span><span>${escapeHtml(opt)}</span></button>`;
    }).join("");
    const correct = answered && choice === item.answer;
    const stem = escapeHtml(item.stem).replace("___", '<em>___</em>');

    root.innerHTML = `<div class="act">
      <div class="act-head">
        <div class="progress-dots" aria-hidden="true">${queue.map((_, i) => `<i class="${i < index ? "done" : i === index ? "now" : ""}"></i>`).join("")}</div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          ${levelBar()}
          ${combo >= 2 ? `<span class="combo ${combo >= 4 ? "hot" : ""}">🔥 ${combo} in a row</span>` : ""}
          <span class="count">${index + 1} / ${queue.length}</span>
        </div>
      </div>
      <div class="q-card">
        <p class="act-hint" style="margin-bottom:10px">${levelName(item.lvl)} · Complete the sentence</p>
        <p class="q-stem">${stem}</p>
        <div class="options">${opts}</div>
        ${answered ? `<div class="feedback ${correct ? "" : "wrong"}">
          <strong>${correct ? "Correct." : "The answer is " + item.options[item.answer] + "."}</strong>
          ${escapeHtml(item.why)}
          <span class="rule">📐 ${escapeHtml(item.rule)}</span>
        </div>` : ""}
        <div class="act-actions">
          ${answered ? `<button class="btn btn-primary" data-action="next">${index + 1 === queue.length ? "See results" : "Next question"} →</button>` : `<span class="small muted">Choose one option.</span>`}
        </div>
      </div>
    </div>`;
  }

  function onClick(e) {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "level") {
      level = target.dataset.level;
      pick();
      render();
    } else if (action === "answer") {
      if (answered) return;
      const item = queue[index];
      choice = Number(target.dataset.i);
      answered = true;
      const correct = choice === item.answer;
      if (correct) {
        correctCount += 1;
        combo += 1;
        bestCombo = Math.max(bestCombo, combo);
        xp += awardXP(combo >= 4 ? 12 : 10);
      } else {
        combo = 0;
        missed.push({ rule: item.rule, why: item.why });
        xp += awardXP(3);
      }
      recordAnswer("grammar", item.id, correct);
      render();
    } else if (action === "next") {
      index += 1;
      answered = false;
      choice = null;
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
