// Math Baseball (inspired by Funbrain's Math Baseball): one or two players take turns at bat on one screen. Pick a swing,
// answer a problem from the grade's facts, and run the bases. A right first try is a hit worth the swing's bases; a miss
// shows steps and allows one more try (a right second try is a single); a miss after that is an out. Untimed throughout.
import { animateField, fieldHtml } from "./baseball-field.js";
import { askFormHtml, esc, focusNext, starsByShare } from "./arcade-shared.js";
import { INNINGS, TIERS, halfOver, hit, makePitcher, newHalf, out } from "./baseball-core.js";
import { feedbackAction, feedbackNoteHtml, phaseFor } from "./feedback-host.js";
import { answerText, gameProblems } from "./game-pool.js";
import { t } from "./i18n.js";
import { validateAnswer } from "./problem-bank.js";
import { canSpeak, speak, syncLive } from "./speech.js";

// Colour is never the only cue: each player also has a number and a symbol.
export const PLAYERS = [
  { symbol: "●", color: "#b3392f" },
  { symbol: "■", color: "#2a62a8" },
];
const tierName = (i) => [t("Single"), t("Double"), t("Triple"), t("Home run")][i];
const tierHint = (i) =>
  [
    t("Easiest problem · 1 base"),
    t("Medium problem · 2 bases"),
    t("Harder problem · 3 bases"),
    t("Hardest problem · 4 bases"),
  ][i];
const hitText = (id) =>
  ({
    single: t("Single! Every runner moves up 1 base."),
    double: t("Double! Every runner moves up 2 bases."),
    triple: t("Triple! Every runner moves up 3 bases."),
    homerun: t("Home run! Everyone scores."),
  })[id];
const runsText = (n) =>
  n === 0 ? t("No runs yet.") : n === 1 ? t("1 run scores.") : t("{n} runs score.", { n });

export function playBaseball(host, { grade, stop, calm, finish, onFact }) {
  const innings = calm ? 2 : INNINGS;
  const pitcher = makePitcher(() => gameProblems(grade, stop, 24));
  const scores = [0, 0];
  const missed = new Map();
  let players = 0;
  let inning = 1;
  let who = 0;
  let half = newHalf();
  let phase = "setup";
  let tier = 0;
  let card = null;
  let tries = 0;
  let peek = 0;
  let shown = "";
  let note = "";
  let fb = null;
  let play = null;
  let swings = 0;
  let firstTry = 0;

  const playerLabel = (i) => (players === 1 ? t("You") : t("Player {n}", { n: i + 1 }));
  const lastHalf = () => inning === innings && who === players - 1;

  function renderSetup() {
    host.innerHTML = `<div class="gm-play gm-baseball">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Math Baseball")}</b></div>
      <p class="gm-ask">${t("Pick a swing, then answer a problem. A right answer on the first try is a hit, and a harder problem is worth more bases. A miss shows steps and gives one more try. Play alone, or take turns with a friend. There is no timer.")}</p>
      <form class="gm-ask-form" data-bb-form><fieldset class="team-choice"><legend>${t("How many players?")}</legend>
        <label class="gm-calm"><input type="radio" name="players" value="1" checked /> ${t("1 player")}</label>
        <label class="gm-calm"><input type="radio" name="players" value="2" /> ${t("2 players, taking turns")}</label></fieldset>
        <button type="submit" class="tr-check">${t("Play ball")}</button></form></div>`;
    host.querySelector("input[name='players']")?.focus();
    syncLive(host);
  }

  const scoreboard = () =>
    `<ol class="team-board bb-board" aria-label="${t("Scoreboard")}">${[...Array(players).keys()]
      .map(
        (i) =>
          `<li${i === who ? ' aria-current="step"' : ""} style="--team:${PLAYERS[i].color}"><span aria-hidden="true">${PLAYERS[i].symbol}</span> ${esc(playerLabel(i))}: <b>${scores[i]}</b> ${t("runs")}</li>`,
      )
      .join("")}</ol>`;

  function panelHtml() {
    if (phase === "choose")
      return `<p class="team-turn" role="status" style="--team:${PLAYERS[who].color}"><span aria-hidden="true">${PLAYERS[who].symbol}</span> ${t("{name}, you are up. Pick your swing.", { name: playerLabel(who) })}</p>
        <div class="bb-tiers" role="group" aria-label="${t("Pick your swing")}">${TIERS.map((_, i) => `<button type="button" class="bb-tier" data-tier="${i}"><b>${tierName(i)}</b><small>${tierHint(i)}</small></button>`).join("")}</div>
        ${feedbackNoteHtml(esc(note), null)}`;
    const solved = phase === "result";
    return `<p class="team-turn" style="--team:${PLAYERS[who].color}"><span aria-hidden="true">${PLAYERS[who].symbol}</span> ${t("{swing} swing", { swing: tierName(tier) })}</p>
      ${canSpeak() ? `<button type="button" class="tr-tool" data-gm-read>${t("Read to me")}</button>` : ""}
      ${askFormHtml(card, { solved, shown, tries, peek })}
      ${feedbackNoteHtml(esc(note), fb)}`;
  }

  function render() {
    if (phase === "setup") return renderSetup();
    const color = PLAYERS[who].color;
    host.innerHTML = `<div class="gm-play gm-baseball">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Math Baseball")}</b><span>${t("Inning {a} of {b}", { a: inning, b: innings })} · ${t("Outs: {n} of 3", { n: half.outs })}</span></div>
      ${scoreboard()}
      <div class="bb-field">${fieldHtml({ bases: half.bases, outs: half.outs, mark: String(who + 1), color, moves: play?.moves || [], outcome: play?.outcome || null })}</div>
      ${panelHtml()}</div>`;
    if (phase === "choose") host.querySelector("[data-tier]")?.focus();
    else focusNext(host, phase === "result");
    if (play) animateField(host);
    syncLive(host);
  }

  function begin(count) {
    players = count;
    phase = "choose";
    render();
  }

  function choose(index) {
    tier = index;
    card = pitcher.next(index);
    tries = 0;
    peek = 0;
    shown = "";
    note = "";
    fb = null;
    phase = "ask";
    render();
  }

  // The hit or out has been decided: update the field, the score and the message.
  function settle(outcome, first, typed) {
    swings += 1;
    if (players === 1) onFact?.(card, first);
    const nextLabel = halfOver(half)
      ? lastHalf()
        ? t("See results")
        : t("Next half-inning")
      : t("Next batter");
    play = { moves: outcome.moves, outcome: outcome.id };
    phase = "result";
    const over = halfOver(half)
      ? ` ${half.outs >= 3 ? t("Three outs. The half-inning is over.") : t("Five swings are used. The half-inning is over.")}`
      : "";
    if (outcome.id === "out") {
      missed.set(card.question, card);
      note = `${t("Out! Look at the answer and think about how to get there.")}${over}`;
      fb = {
        phase: phaseFor("baseball", "revealed"),
        ctx: { submitted: typed, expected: answerText(card), next: nextLabel },
      };
    } else {
      const lead = first ? hitText(outcome.id) : t("Good thinking. A single on the second try!");
      note = `${lead} ${runsText(outcome.scored)}${over}`;
      fb = {
        phase: phaseFor("baseball", first ? "right" : "right-after-miss"),
        ctx: { expected: answerText(card), next: nextLabel },
      };
    }
    render();
  }

  function submit(typed) {
    shown = typed;
    if (validateAnswer(typed, card)) {
      const first = tries === 0;
      const result = hit(half, first ? TIERS[tier].bases : 1);
      half = result.half;
      scores[who] += result.scored;
      if (first) firstTry += 1;
      return settle(
        { id: first ? TIERS[tier].id : "single", moves: result.moves, scored: result.scored },
        first,
        typed,
      );
    }
    tries += 1;
    if (tries === 1) {
      peek = 1;
      note = t("Not yet. Look at the steps, then try once more.");
      fb = { phase: phaseFor("baseball", "miss"), ctx: { submitted: typed } };
      shown = "";
      return render();
    }
    half = out(half);
    settle({ id: "out", moves: [], scored: 0 }, false, typed);
  }

  function advance() {
    if (halfOver(half)) {
      if (lastHalf()) return end();
      if (who === players - 1) {
        who = 0;
        inning += 1;
      } else who += 1;
      half = newHalf();
    }
    phase = "choose";
    play = null;
    note = "";
    fb = null;
    render();
  }

  function end() {
    const line =
      players === 1
        ? t("{runs} runs, {hits} of {n} hits on the first try", {
            runs: scores[0],
            hits: firstTry,
            n: swings,
          })
        : `${t("Player {n}", { n: 1 })} ${scores[0]} · ${t("Player {n}", { n: 2 })} ${scores[1]} · ${t("{hits} of {n} hits on the first try", { hits: firstTry, n: swings })}`;
    finish({
      game: "baseball",
      stars: starsByShare(firstTry, swings),
      missed: players === 1 ? [...missed.values()] : [],
      line,
    });
  }

  host.onsubmit = (event) => {
    event.preventDefault();
    if (event.target.matches("[data-bb-form]")) {
      const count = Number(host.querySelector("input[name='players']:checked")?.value);
      return count === 1 || count === 2 ? begin(count) : undefined;
    }
    if (phase !== "ask") return;
    const typed = host.querySelector("#gm-input")?.value || "";
    if (typed.trim()) submit(typed.trim());
  };

  host.onclick = (event) => {
    const swing = event.target.closest("[data-tier]");
    if (swing && phase === "choose") return choose(Number(swing.dataset.tier));
    const action = feedbackAction(event);
    if (action === "next" && phase === "result") return advance();
    if (action === "try-again") {
      fb = null;
      note = "";
      return render();
    }
    if (event.target.closest("[data-gm-read]")) return speak(card.question);
    if (event.target.closest("[data-step]") && phase === "ask") {
      peek += 1;
      render();
    }
  };

  render();
  return () => {
    host.onclick = null;
    host.onsubmit = null;
  };
}
