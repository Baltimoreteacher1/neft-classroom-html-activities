import { LISTENING } from "../data.js";
import { speak, stopSpeaking, recordAnswer, awardXP, countSession, shuffle, byLevel, escapeHtml, toast, levelName } from "../core.js";

export const meta = {
  id: "listening",
  title: "Listen Lab",
  skill: "Listening",
  level: "Starter–Stretch",
  blurb: "Hear natural speech at three speeds, choose what was really said, then see the connected-speech trick behind it.",
  icon: "listening",
  accent: "#d64b7c",
  time: "5 min"
};

const LEVEL_OPTIONS = ["All", "A1", "A2", "B1"];
const RATES = [0.75, 1, 1.15];
const LETTERS = ["A", "B", "C", "D"];

export function mount(root) {
  let level = "All";
  let queue = [];
  let index = 0;
  let answered = false;
  let choice = null;
  let plays = 0;
  let rate = 1;
  let correctCount = 0;
  let xp = 0;

  const levelBar = () => `<div class="speed-row" role="group" aria-label="Choose level">Level
    ${LEVEL_OPTIONS.map((l) => `<button type="button" data-action="level" data-level="${l}" aria-pressed="${l === level}">${l === "All" ? "All" : levelName(l)}</button>`).join("")}
  </div>`;

  function pick() {
    queue = shuffle(byLevel(LISTENING, level)).slice(0, 5);
    index = 0;
    answered = false;
    choice = null;
    plays = 0;
    correctCount = 0;
    xp = 0;
  }

  function renderSummary() {
    xp += awardXP(10);
    countSession();
    const total = queue.length || 1;
    const pct = Math.round((correctCount / total) * 100);
    root.innerHTML = `<div class="act"><div class="result">
      <div class="score">${pct}<small>%</small></div>
      <h3>${pct >= 80 ? "Your ear is tuning in." : pct >= 50 ? "Solid listening." : "Good practice — replay is allowed."}</h3>
      <p>${correctCount} of ${total} correct. Real conversations give you a second chance too: asking “Sorry, could you say that again?” is a skill, not a failure.</p>
      <p class="small muted" style="margin-top:10px">+${xp} XP</p>
      <div class="act-actions">
        <button class="btn btn-primary" data-action="again">New listening set</button>
        <a class="btn" href="#activities">Choose another activity</a>
      </div>
    </div></div>`;
  }

  function render() {
    if (index >= queue.length) return renderSummary();
    const item = queue[index];
    const dots = queue.map((_, i) => `<i class="${i < index ? "done" : i === index ? "now" : ""}"></i>`).join("");
    const chosen = choice;
    const options = item.options.map((opt, i) => {
      let cls = "option";
      let key = `<span class="key">${LETTERS[i]}</span>`;
      if (answered) {
        if (i === item.answer) cls += " is-correct";
        else if (i === chosen) cls += " is-wrong";
        else cls += " dim";
      }
      return `<button type="button" class="${cls}" data-action="answer" data-i="${i}" ${answered ? "disabled" : ""}>${key}<span>${escapeHtml(opt)}</span></button>`;
    }).join("");

    root.innerHTML = `<div class="act">
      <div class="act-head">
        <div class="progress-dots" aria-hidden="true">${dots}</div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">${levelBar()}<span class="count">${index + 1} / ${queue.length}</span></div>
      </div>
      <div class="q-card">
        <div class="listen-hero">
          <button type="button" class="play-big" data-action="play" aria-label="Play the recording">
            <span aria-hidden="true">▶</span>
          </button>
          <div class="speed-row" role="group" aria-label="Playback speed">Speed
            ${RATES.map((r) => `<button type="button" data-action="rate" data-rate="${r}" aria-pressed="${r === rate}">${r}×</button>`).join("")}
          </div>
          <p class="small muted" data-plays>Played ${plays} time${plays === 1 ? "" : "s"} · ${levelName(item.lvl)}</p>
        </div>
        <p class="act-hint" style="margin-top:16px">You will hear one sentence. Listen once at normal speed, then check the question.</p>
        <p class="q-stem">${escapeHtml(item.question)}</p>
        <div class="options">${options}</div>
        ${answered ? `<div class="feedback ${chosen === item.answer ? "" : "wrong"}">
            <strong>${chosen === item.answer ? "That's it." : "Not quite — here's the line."}</strong>
            “${escapeHtml(item.script)}”
            <span class="rule">👂 ${escapeHtml(item.focus)}</span>
          </div>` : ""}
        <div class="act-actions">
          ${answered ? `<button class="btn btn-primary" data-action="next">Next →</button>` : `<span class="small muted">Choose the answer you heard.</span>`}
          <span class="spacer"></span>
          ${answered ? "" : `<button class="btn btn-ghost btn-sm" data-action="play">Replay</button>`}
        </div>
      </div>
    </div>`;
  }

  function play() {
    const item = queue[index];
    if (!item) return;
    plays += 1;
    const btn = root.querySelector(".play-big");
    btn?.classList.add("speaking");
    const counter = root.querySelector("[data-plays]");
    if (counter) counter.textContent = `Played ${plays} time${plays === 1 ? "" : "s"} · ${levelName(item.lvl)}`;
    speak(item.script, { rate }).then(() => btn?.classList.remove("speaking"));
  }

  function onClick(e) {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "level") {
      level = target.dataset.level;
      pick();
      render();
    } else if (action === "play") {
      play();
    } else if (action === "rate") {
      rate = Number(target.dataset.rate);
      root.querySelectorAll('[data-action="rate"]').forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.rate) === rate)));
      play();
    } else if (action === "answer") {
      if (answered) return;
      const i = Number(target.dataset.i);
      const item = queue[index];
      choice = i;
      answered = true;
      const correct = i === item.answer;
      if (correct) correctCount += 1;
      recordAnswer("listening", item.id, correct);
      xp += awardXP(correct ? 10 : 4);
      render();
      if (correct) toast("Good ear — +10 XP");
    } else if (action === "next") {
      index += 1;
      answered = false;
      choice = null;
      plays = 0;
      render();
    } else if (action === "again") {
      pick();
      render();
    }
  }

  root.addEventListener("click", onClick);
  pick();
  render();

  return {
    destroy() {
      root.removeEventListener("click", onClick);
      stopSpeaking();
    }
  };
}
