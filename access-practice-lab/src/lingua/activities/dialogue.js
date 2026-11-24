import { DIALOGUES } from "../data.js";
import { recordAnswer, awardXP, countSession, escapeHtml, levelName } from "../core.js";

export const meta = {
  id: "dialogue",
  title: "Real Talk",
  skill: "Speaking & register",
  level: "Building–Stretch",
  blurb: "Three branching conversations — pharmacy, interview, neighbour — where the tone of your reply changes the outcome.",
  icon: "conversation",
  accent: "#b4761a",
  time: "6 min"
};

const QUALITY_LABEL = { great: "Natural and effective", ok: "Understandable, could be sharper", off: "Likely to land badly" };

export function mount(root) {
  let scenarioId = null;
  let nodeId = null;
  let history = [];
  let feedback = null;
  let score = 0;
  let answered = 0;
  let done = false;
  let xp = 0;
  let bonusGiven = false;

  const scenario = () => DIALOGUES.find((d) => d.id === scenarioId);

  function library() {
    root.innerHTML = `<div class="act">
      <p class="act-prompt">Pick a situation.</p>
      <p class="act-hint">Each reply is judged on tone, not just grammar. Choose what you would actually say — then read why it works.</p>
      <div class="activity-grid">
        ${DIALOGUES.map((d) => `<button type="button" class="activity-card" data-action="start" data-id="${d.id}" style="--accent-c:#b4761a">
          <span class="icon" aria-hidden="true">${d.id === "d1" ? "💊" : d.id === "d2" ? "🤝" : "🚪"}</span>
          <h3>${escapeHtml(d.title)}</h3>
          <p>${escapeHtml(d.setting)}</p>
          <span class="pill level">${levelName(d.lvl)}</span>
        </button>`).join("")}
      </div>
    </div>`;
  }

  function start(id) {
    scenarioId = id;
    nodeId = scenario().start;
    history = [];
    feedback = null;
    score = 0;
    answered = 0;
    done = false;
    bonusGiven = false;
    xp = 0;
    render();
  }

  function renderSummary() {
    const max = Math.max(1, answered * 2);
    const pct = Math.round((score / max) * 100);
    if (!bonusGiven) {
      bonusGiven = true;
      xp += awardXP(12);
      countSession();
    }
    const verdict = pct >= 80 ? "You handled that like a local." : pct >= 50 ? "The meaning got through — now polish the tone." : "A brave first run. The phrases below are the upgrade.";
    root.innerHTML = `<div class="act"><div class="result">
      <div class="score">${pct}<small>%</small></div>
      <h3>${verdict}</h3>
      <p>${escapeHtml(scenario().setting)}</p>
      <div class="review-list" style="margin-top:18px">
        <div><strong>Phrases worth keeping</strong></div>
        ${scenario().keyPhrases.map((p) => `<div>“${escapeHtml(p)}”</div>`).join("")}
      </div>
      <p class="small muted" style="margin-top:14px">+${xp} XP</p>
      <div class="act-actions">
        <button class="btn btn-primary" data-action="replay">Replay this situation</button>
        <button class="btn" data-action="back">Another situation</button>
      </div>
    </div></div>`;
  }

  function render() {
    const s = scenario();
    if (!s) return library();
    if (done) return renderSummary();
    const node = s.nodes[nodeId];
    const chat = history.map((m) => `<div class="bubble ${m.who === "you" ? "you" : "npc"}">${m.who === "npc" ? `<span class="who">${escapeHtml(s.who)}</span>` : ""}${escapeHtml(m.text)}</div>`).join("");
    const choices = node.choices.map((c, i) => `<button type="button" class="choice" data-action="choose" data-i="${i}" ${feedback ? "disabled" : ""}>${escapeHtml(c.text)}</button>`).join("");

    root.innerHTML = `<div class="act">
      <div class="act-head">
        <button class="btn btn-sm" data-action="back">← Situations</button>
        <span class="count">${levelName(s.lvl)} · ${escapeHtml(s.who)} · turn ${answered + 1}</span>
      </div>
      <p class="act-hint" style="margin-bottom:14px">${escapeHtml(s.setting)}</p>
      <div class="chat">
        ${chat}
        <div class="bubble npc"><span class="who">${escapeHtml(s.who)}</span>${escapeHtml(node.npc)}</div>
      </div>
      ${feedback ? `<div class="feedback ${feedback.quality === "great" ? "" : "wrong"}">
          <strong>${QUALITY_LABEL[feedback.quality]}</strong>${escapeHtml(feedback.text)}
        </div>
        <div class="act-actions"><button class="btn btn-primary" data-action="continue">Continue →</button></div>`
        : `<div class="chat">${choices}</div>`}
    </div>`;
  }

  function choose(i) {
    if (feedback) return;
    const s = scenario();
    const node = s.nodes[nodeId];
    const choice = node.choices[i];
    history.push({ who: "npc", text: node.npc });
    history.push({ who: "you", text: choice.text });
    feedback = choice;
    answered += 1;
    score += choice.quality === "great" ? 2 : choice.quality === "ok" ? 1 : 0;
    recordAnswer("dialogue", `${s.id}-${nodeId}`, choice.quality === "great");
    xp += awardXP(choice.quality === "great" ? 8 : choice.quality === "ok" ? 4 : 2);
    render();
  }

  function continueStory() {
    if (!feedback) return;
    const next = feedback.next;
    feedback = null;
    if (next) {
      nodeId = next;
      render();
    } else {
      done = true;
      render();
    }
  }

  function onClick(e) {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "start") start(target.dataset.id);
    else if (action === "replay") start(scenarioId);
    else if (action === "back") {
      scenarioId = null;
      library();
    } else if (action === "choose") choose(Number(target.dataset.i));
    else if (action === "continue") continueStory();
  }

  root.addEventListener("click", onClick);
  library();

  return { destroy() { root.removeEventListener("click", onClick); } };
}
