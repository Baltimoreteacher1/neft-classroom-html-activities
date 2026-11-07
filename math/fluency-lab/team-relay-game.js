// Team Relay (inspired by team modes in live class games): two to four teams share one screen and take turns on one
// problem each. Teams talk it over, one answer is typed per turn. Untimed and cooperative: the class earns the stars
// together, and a team answer is not one learner's evidence, so it never writes to the personal fact chart.
import { feedbackAction, feedbackNoteHtml, phaseFor } from "./feedback-host.js";
import { answerText, gameProblems } from "./game-pool.js";
import { t } from "./i18n.js";
import { validateAnswer } from "./problem-bank.js";
import { addCodes, approvedCards, arithmeticCheck, decodeStudentProblem, encodeStudentProblem, loadDeck, saveDeck } from "./student-problems.js";
import { canSpeak, speak, syncLive } from "./speech.js";
import { peekCap } from "./step-leak.js";
import { mathText, stepsBlock } from "./trail-pictures.js";

// Colour is never the only cue: each team also has a symbol and a name.
export const TEAMS = [
  { id: "red", name: "Red team", symbol: "●", color: "#b3392f" },
  { id: "blue", name: "Blue team", symbol: "■", color: "#2a62a8" },
  { id: "green", name: "Green team", symbol: "▲", color: "#2f7d4f" },
  { id: "gold", name: "Gold team", symbol: "★", color: "#8a6410" },
];
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

// Turn order: team 1, team 2, ... then round again.
export const teamForTurn = (turn, teams) => turn % teams;
export const starsFor = (firstTry, total) => (firstTry === total ? 3 : firstTry * 2 >= total ? 2 : 1);

const CHECK_LABEL = () => ({
  ok: t("The answer matches the math."),
  mismatch: t("The answer does not match the math. Check it before approving."),
  unchecked: t("Read it and solve it yourself before approving."),
});

export function playTeamRelay(host, { grade, stop, calm, finish }) {
  let studentDeck = loadDeck();
  const perTeam = calm ? 3 : 4;
  let teams = 0;
  let deck = [];
  let turn = 0;
  let tries = 0;
  let peek = 0;
  let points = [];
  let firstTry = 0;
  let note = "";
  let solved = false;
  let fb = null;
  let shown = "";

  function renderSetup() {
    host.innerHTML = `<div class="gm-play gm-team">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Team Relay")}</b></div>
      <p class="gm-ask">${t("Teams take turns on one problem each. Talk it over as a team, then type one answer. Everyone helps, and the whole class earns the stars together. There is no timer.")}</p>
      <form class="gm-ask-form" data-team-form><fieldset class="team-choice"><legend>${t("How many teams?")}</legend>
        ${[2, 3, 4].map((n) => `<label class="gm-calm"><input type="radio" name="teams" value="${n}"${n === 2 ? " checked" : ""} /> ${t("{n} teams", { n })}</label>`).join("")}</fieldset>
        <button type="submit" class="tr-check">${t("Start")}</button></form>
      ${studentWriteHtml()}${studentDeckHtml()}</div>`;
    host.querySelector("input[name='teams']")?.focus();
    syncLive(host);
  }

  // A student writes a problem and gets a code to hand to the teacher; nothing leaves the device.
  const studentWriteHtml = () => `<details class="sp-write"><summary>${t("Write a problem for the class")}</summary>
      <form class="gm-ask-form" data-sp-write novalidate><label>${t("Your problem")}<textarea name="question" rows="3" maxlength="160" required></textarea></label>
        <label>${t("Its answer")}<input name="answer" maxlength="24" autocomplete="off" required></label>
        <p class="sp-error" role="alert" data-sp-error></p>
        <button type="submit" class="tr-check">${t("Make my code")}</button>
        <label class="sp-code" hidden>${t("Give this code to your teacher")}<input readonly data-sp-code></label></form></details>`;
  // The teacher pastes codes here and approves each problem; only approved ones can enter the deck.
  const studentDeckHtml = () => `<details class="sp-deck"><summary>${t("Student problems (the teacher approves each one)")}</summary>
      <form class="gm-ask-form" data-sp-add novalidate><label>${t("Paste student codes, one per line")}<textarea name="codes" rows="3"></textarea></label>
        <button type="submit" class="tr-check">${t("Add codes")}</button></form>
      <p class="sp-note" role="status" data-sp-note></p><ul class="sp-list" data-sp-list>${studentListHtml()}</ul></details>`;
  function studentListHtml() {
    const labels = CHECK_LABEL();
    return studentDeck
      .map((entry, index) => {
        const problem = decodeStudentProblem(entry.code);
        return `<li><label><input type="checkbox" data-sp-approve="${index}"${entry.approved ? " checked" : ""}> ${t("Approve")}</label>
          <p><b>${esc(problem.question)}</b></p><p>${t("Answer: {answer}", { answer: esc(problem.answer) })}</p><p class="sp-check">${esc(labels[arithmeticCheck(problem)])}</p>
          <button type="button" class="tr-tool" data-sp-remove="${index}">${t("Remove")}</button></li>`;
      })
      .join("");
  }
  const paintStudentDeck = (note = "") => {
    const list = host.querySelector("[data-sp-list]");
    if (list) list.innerHTML = studentListHtml();
    const out = host.querySelector("[data-sp-note]");
    if (out) out.textContent = note || t("{n} approved problems will be used first.", { n: studentDeck.filter((entry) => entry.approved).length });
  };

  function begin(count) {
    teams = count;
    const total = count * perTeam;
    const own = approvedCards(studentDeck).slice(0, total);
    deck = [...own, ...gameProblems(grade, stop, total - own.length)];
    if (deck.length < count) throw new Error("Not enough problems for Team Relay");
    points = Array(count).fill(0);
    turn = 0;
    renderTurn();
  }

  const scoreboard = (current) =>
    `<ol class="team-board" aria-label="${t("Team scores")}">${TEAMS.slice(0, teams)
      .map((team, i) => `<li${i === current && !solved ? ' aria-current="step"' : ""} style="--team:${team.color}"><span aria-hidden="true">${team.symbol}</span> ${esc(t(team.name))}: <b>${points[i]}</b></li>`)
      .join("")}</ol>`;

  function renderTurn() {
    const card = deck[turn];
    const current = teamForTurn(turn, teams);
    const team = TEAMS[current];
    const steps = peekCap(card) > 0 ? card.steps : [];
    host.innerHTML = `<div class="gm-play gm-team">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Team Relay")}</b><span>${t("Turn {a} of {b}", { a: turn + 1, b: deck.length })}</span></div>
      ${scoreboard(current)}
      <p class="team-turn" role="status" style="--team:${team.color}"><span aria-hidden="true">${team.symbol}</span> ${t("{team}, it is your turn.", { team: t(team.name) })}</p>
      <form class="gm-ask-form" autocomplete="off"><p class="gm-q" id="gm-q">${mathText(card.question)}</p>${canSpeak() ? `<button type="button" class="tr-tool" data-gm-read>${t("Read to me")}</button>` : ""}
        <div class="tr-answer"><label class="tr-sr" for="gm-input">${t("Your answer")}</label><input id="gm-input" class="tr-input" inputmode="${card.kind === "number" ? "decimal" : "text"}" spellcheck="false" aria-describedby="gm-q" value="${esc(shown)}"${solved ? " disabled" : ""} /><button type="submit" class="tr-check"${solved ? " disabled" : ""}>${t("Check")}</button></div>
        ${steps.length && tries && !solved ? stepsBlock(steps, Math.max(1, peek), { id: "gm-steps", cap: peekCap(card) }) : ""}</form>
      ${feedbackNoteHtml(esc(note), fb)}</div>`;
    if (solved) host.querySelector("[data-gm-next]")?.focus();
    else host.querySelector("#gm-input").focus();
    syncLive(host);
  }

  function advance() {
    turn += 1;
    tries = 0;
    peek = 0;
    note = "";
    fb = null;
    solved = false;
    shown = "";
    if (turn >= deck.length) {
      const line = TEAMS.slice(0, teams).map((team, i) => `${t(team.name)} ${points[i]}`).join(" · ");
      return finish({ game: "teamrelay", stars: starsFor(firstTry, deck.length), missed: [], line });
    }
    renderTurn();
  }

  host.onsubmit = (event) => {
    event.preventDefault();
    if (event.target.matches("[data-sp-write]")) {
      const data = new FormData(event.target);
      const code = encodeStudentProblem({ question: data.get("question"), answer: data.get("answer") });
      const error = host.querySelector("[data-sp-error]");
      const field = host.querySelector("[data-sp-code]");
      error.textContent = code ? "" : t("Write a problem of at least 8 characters and its answer.");
      field.closest("label").hidden = !code;
      if (code) {
        field.value = code;
        field.select();
      }
      return;
    }
    if (event.target.matches("[data-sp-add]")) {
      const result = addCodes(studentDeck, new FormData(event.target).get("codes"));
      studentDeck = result.deck;
      saveDeck(studentDeck);
      event.target.reset();
      return paintStudentDeck(t("{added} added, {skipped} skipped. Approve the ones you want.", { added: result.added, skipped: result.skipped }));
    }
    if (event.target.matches("[data-team-form]")) {
      const count = Number(host.querySelector("input[name='teams']:checked")?.value);
      return count >= 2 && count <= 4 ? begin(count) : undefined;
    }
    if (solved) return;
    const card = deck[turn];
    const typed = host.querySelector("#gm-input").value;
    if (!typed.trim()) return;
    shown = typed;
    const nextLabel = turn + 1 >= deck.length ? t("See results") : t("Next team");
    if (validateAnswer(typed, card)) {
      solved = true;
      if (tries === 0) {
        points[teamForTurn(turn, teams)] += 1;
        firstTry += 1;
      }
      note = tries === 0 ? t("Great teamwork!") : t("Good thinking. Talk about what changed.");
      fb = { phase: phaseFor("teamrelay", tries === 0 ? "right" : "right-after-miss"), ctx: { expected: answerText(card), next: nextLabel } };
      return renderTurn();
    }
    tries += 1;
    if (tries === 1) {
      peek = 1;
      note = t("Not yet. Look at the steps together, then try once more.");
      fb = { phase: phaseFor("teamrelay", "miss"), ctx: { submitted: typed.trim() } };
      shown = "";
      return renderTurn();
    }
    solved = true;
    note = t("This one is tricky. Talk about how to get there.");
    fb = { phase: phaseFor("teamrelay", "revealed"), ctx: { submitted: typed.trim(), expected: answerText(card), next: nextLabel } };
    renderTurn();
  };

  host.onchange = (event) => {
    const box = event.target.closest("[data-sp-approve]");
    if (!box) return;
    studentDeck[Number(box.dataset.spApprove)].approved = box.checked;
    saveDeck(studentDeck);
    paintStudentDeck();
  };
  host.onclick = (event) => {
    const remove = event.target.closest("[data-sp-remove]");
    if (remove) {
      studentDeck.splice(Number(remove.dataset.spRemove), 1);
      saveDeck(studentDeck);
      return paintStudentDeck();
    }
    const action = feedbackAction(event);
    if (action === "next" && solved) return advance();
    if (action === "try-again") {
      fb = null;
      note = "";
      return renderTurn();
    }
    if (event.target.closest("[data-gm-read]")) return speak(deck[turn].question);
    if (event.target.closest("[data-step]") && !solved) {
      peek += 1;
      renderTurn();
    }
  };
  renderSetup();
  paintStudentDeck();
  return () => {
    host.onclick = null;
    host.onsubmit = null;
    host.onchange = null;
  };
}
