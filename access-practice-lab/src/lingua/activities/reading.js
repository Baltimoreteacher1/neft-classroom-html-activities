import { READINGS } from "../data.js";
import { recordAnswer, awardXP, countSession, escapeHtml, levelName } from "../core.js";

export const meta = {
  id: "reading",
  title: "Reading Room",
  skill: "Reading",
  level: "Building–Stretch",
  blurb: "Three short texts — a story, an explainer and a set of building notices — with tap-to-gloss words and inference questions.",
  icon: "reading",
  accent: "#24578f",
  time: "6 min"
};

const LETTERS = ["A", "B", "C", "D"];

export function mount(root) {
  let passageId = null;
  let answers = {};
  let bonusGiven = false;
  let xp = 0;

  const passage = () => READINGS.find((r) => r.id === passageId);

  function library() {
    root.innerHTML = `<div class="act">
      <p class="act-prompt">Choose a text.</p>
      <p class="act-hint">Read once for the gist, then answer. Words with a dotted underline can be tapped for a quick gloss.</p>
      <div class="activity-grid">
        ${READINGS.map((r) => `<button type="button" class="activity-card" data-action="open" data-id="${r.id}" style="--accent-c:#24578f">
          <span class="icon" aria-hidden="true">${r.lvl === "A2" ? "📄" : "📰"}</span>
          <h3>${escapeHtml(r.title)}</h3>
          <p>${escapeHtml(r.source)} · ${r.questions.length} questions</p>
          <span class="pill level">${levelName(r.lvl)}</span>
        </button>`).join("")}
      </div>
    </div>`;
  }

  function render() {
    const p = passage();
    if (!p) return library();
    const answeredCount = Object.keys(answers).length;

    const questions = p.questions.map((q, qi) => {
      const chosen = answers[qi];
      const isAnswered = chosen !== undefined;
      const isRight = chosen === q.answer;
      const opts = q.options.map((opt, oi) => {
        let cls = "option";
        if (isAnswered) {
          if (oi === q.answer) cls += " is-correct";
          else if (oi === chosen) cls += " is-wrong";
          else cls += " dim";
        }
        return `<button type="button" class="${cls}" data-action="answer" data-q="${qi}" data-i="${oi}" ${isAnswered ? "disabled" : ""}>
          <span class="key">${LETTERS[oi]}</span><span>${escapeHtml(opt)}</span></button>`;
      }).join("");
      return `<div class="q-card" style="margin-top:14px">
        <p class="q-stem">${qi + 1}. ${escapeHtml(q.stem)}</p>
        <div class="options">${opts}</div>
        ${isAnswered ? `<div class="feedback ${isRight ? "" : "wrong"}">
          <strong>${isRight ? "Correct." : "Look again at the text."}</strong>${escapeHtml(q.why)}
        </div>` : ""}
      </div>`;
    }).join("");

    if (answeredCount === p.questions.length && !bonusGiven) {
      bonusGiven = true;
      xp += awardXP(12);
      countSession();
    }

    root.innerHTML = `<div class="act">
      <div class="act-head">
        <button class="btn btn-sm" data-action="back">← All texts</button>
        <span class="count">${levelName(p.lvl)} · ${answeredCount}/${p.questions.length} answered</span>
      </div>
      <article class="passage">
        <h3>${escapeHtml(p.title)}</h3>
        <div class="source">${escapeHtml(p.source)}</div>
        ${p.body.map((para) => `<p>${para}</p>`).join("")}
      </article>
      <h3 style="margin:26px 0 4px;font-size:1.3rem">Comprehension</h3>
      <p class="act-hint">Answer in your own head first, then check. Every option is explained.</p>
      ${questions}
      ${answeredCount === p.questions.length ? `<div class="result" style="padding-top:24px">
          <h3>Text finished.</h3>
          <p>Read it once more tomorrow — the second reading is where fluency grows.</p>
          <div class="act-actions">
            <button class="btn btn-primary" data-action="back">Choose another text</button>
            <a class="btn" href="#activities">Other activities</a>
          </div>
        </div>` : ""}
    </div>`;
  }

  function onClick(e) {
    const gloss = e.target.closest(".gloss");
    if (gloss) {
      const p = gloss.closest("p");
      const existing = p.querySelector(".gloss-note");
      if (existing) existing.remove();
      else {
        const note = document.createElement("span");
        note.className = "gloss-note";
        note.textContent = `${gloss.textContent}: ${gloss.dataset.gloss}`;
        p.appendChild(note);
      }
      return;
    }

    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "open") {
      passageId = target.dataset.id;
      answers = {};
      bonusGiven = false;
      render();
      root.closest(".studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (action === "back") {
      passageId = null;
      library();
    } else if (action === "answer") {
      const qi = Number(target.dataset.q);
      if (answers[qi] !== undefined) return;
      const p = passage();
      const i = Number(target.dataset.i);
      answers[qi] = i;
      const correct = i === p.questions[qi].answer;
      recordAnswer("reading", `${p.id}-q${qi}`, correct);
      xp += awardXP(correct ? 8 : 3);
      render();
    }
  }

  root.addEventListener("click", onClick);
  library();

  return { destroy() { root.removeEventListener("click", onClick); } };
}
