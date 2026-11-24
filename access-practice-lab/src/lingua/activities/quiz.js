import { VOCAB, GRAMMAR } from "../data.js";
import { recordAnswer, awardXP, countSession, shuffle, escapeHtml, toast } from "../core.js";

export const meta = {
  id: "quiz",
  title: "Mixed Review",
  skill: "Retrieval practice",
  level: "Starter–Stretch",
  blurb: "Eight mixed questions drawn from the word bank and grammar gym — the fastest way to find out what stuck.",
  icon: "medal",
  accent: "#7a4b8f",
  time: "4 min"
};

const LETTERS = ["A", "B", "C", "D"];

function buildQuestions() {
  const vocabQs = shuffle(VOCAB).slice(0, 5).map((v) => {
    const distractors = shuffle(VOCAB.filter((x) => x.id !== v.id && x.w !== v.w)).slice(0, 3).map((x) => x.w);
    const options = shuffle([v.w, ...distractors]);
    return {
      skill: "Vocabulary",
      id: v.id,
      prompt: `Which word means “${v.def}”?`,
      options,
      answer: options.indexOf(v.w),
      why: `“${v.w}” — ${v.def}`,
      rule: `Example: ${v.ex}`
    };
  });
  const grammarQs = shuffle(GRAMMAR).slice(0, 3).map((g) => {
    const opts = shuffle(g.options.map((o, i) => ({ o, i })));
    const answer = opts.findIndex((x) => x.i === g.answer);
    return {
      skill: "Grammar",
      id: g.id,
      prompt: g.stem,
      options: opts.map((x) => x.o),
      answer,
      why: g.why,
      rule: g.rule
    };
  });
  return shuffle([...vocabQs, ...grammarQs]);
}

export function mount(root) {
  let queue = [];
  let index = 0;
  let answered = false;
  let choice = null;
  let score = 0;
  let xp = 0;
  let results = [];
  let bonusGiven = false;

  function pick() {
    queue = buildQuestions();
    index = 0;
    answered = false;
    choice = null;
    score = 0;
    xp = 0;
    results = [];
    bonusGiven = false;
  }

  function summary() {
    if (!bonusGiven) {
      bonusGiven = true;
      xp += awardXP(15);
      countSession();
    }
    const total = queue.length || 1;
    const pct = Math.round((score / total) * 100);
    const vocabRight = results.filter((r) => r.skill === "Vocabulary" && r.correct).length;
    const vocabTotal = results.filter((r) => r.skill === "Vocabulary").length || 1;
    const grammarRight = results.filter((r) => r.skill === "Grammar" && r.correct).length;
    const grammarTotal = results.filter((r) => r.skill === "Grammar").length || 1;
    const focus = vocabRight / vocabTotal < grammarRight / grammarTotal ? "the Word Bank" : "the Grammar Gym";
    const wrong = results.filter((r) => !r.correct);

    root.innerHTML = `<div class="act"><div class="result">
      <div class="score">${pct}<small>%</small></div>
      <h3>${pct >= 80 ? "That knowledge is holding." : pct >= 50 ? "Solid — with clear next steps." : "Now you know where to aim."}</h3>
      <p>${score} of ${total} correct. Your next best move is a short round in <strong>${focus}</strong>.</p>
      <div class="review-list">
        <div><strong>Skill breakdown</strong></div>
        <div>Vocabulary: ${vocabRight}/${vocabTotal} · Grammar: ${grammarRight}/${grammarTotal}</div>
        ${wrong.length ? `<div><strong>Worth another look</strong></div>${wrong.map((w) => `<div>${escapeHtml(w.prompt)} — <em>${escapeHtml(w.rule)}</em></div>`).join("")}` : ""}
      </div>
      <p class="small muted" style="margin-top:14px">+${xp} XP</p>
      <div class="act-actions">
        <button class="btn btn-primary" data-action="again">Another mixed set</button>
        <a class="btn" href="#activities">Choose a focus</a>
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
    const promptText = item.skill === "Grammar" ? escapeHtml(item.prompt).replace("___", '<em>___</em>') : escapeHtml(item.prompt);

    root.innerHTML = `<div class="act">
      <div class="act-head">
        <div class="progress-dots" aria-hidden="true">${queue.map((_, i) => `<i class="${i < index ? "done" : i === index ? "now" : ""}"></i>`).join("")}</div>
        <span class="count">${index + 1} / ${queue.length} · ${escapeHtml(item.skill)}</span>
      </div>
      <div class="q-card">
        <p class="q-stem">${promptText}</p>
        <div class="options">${opts}</div>
        ${answered ? `<div class="feedback ${correct ? "" : "wrong"}">
          <strong>${correct ? "Correct." : "Not this time."}</strong>
          ${escapeHtml(item.why)}
          <span class="rule">${escapeHtml(item.rule)}</span>
        </div>` : ""}
        <div class="act-actions">
          ${answered ? `<button class="btn btn-primary" data-action="next">${index + 1 === queue.length ? "See results" : "Next"} →</button>` : `<span class="small muted">Retrieve it from memory — no scrolling back.</span>`}
        </div>
      </div>
    </div>`;
  }

  function onClick(e) {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "answer") {
      if (answered) return;
      const item = queue[index];
      choice = Number(target.dataset.i);
      answered = true;
      const correct = choice === item.answer;
      if (correct) score += 1;
      results.push({ skill: item.skill, correct, prompt: item.prompt, rule: item.rule });
      recordAnswer("quiz", `${item.skill}-${item.id}`, correct);
      xp += awardXP(correct ? 10 : 3);
      render();
      if (correct) toast("+10 XP");
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
