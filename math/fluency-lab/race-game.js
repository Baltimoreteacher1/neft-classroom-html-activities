// Math Race (inspired by Funbrain's MathCar Racing), untimed: a right answer moves your car one segment. The rival moves on
// a fixed plan per race (after every problem, right or wrong), never on a clock, so careful thinking always wins.
import { askFormHtml, esc, focusNext, starsByShare } from "./arcade-shared.js";
import { feedbackAction, feedbackNoteHtml, phaseFor } from "./feedback-host.js";
import { answerText, gameProblems } from "./game-pool.js";
import { t } from "./i18n.js";
import { validateAnswer } from "./problem-bank.js";
import { CALM_PACES, PACES, TRACK, missesAllowed, rivalAt, winner } from "./race-core.js";
import { canSpeak, speak, syncLive } from "./speech.js";

const LEFT = 52;
const CAR = 36;
const FINISH = 400;
const SEGMENT = (FINISH - LEFT - CAR) / TRACK;
const LANES = [22, 80];

// A car is a body, a cabin and two wheels. The rival also has a rear wing, so the two differ by shape as well as colour.
const car = (
  kind,
  y,
  color,
) => `<g class="rc-car rc-${kind}" data-car="${kind}" style="transform:translateX(0px)">
    <rect x="${LEFT}" y="${y + 18}" width="${CAR}" height="12" rx="4" fill="${color}"/>
    <path d="M${LEFT + 8} ${y + 18}l5-9h12l5 9z" fill="${color}"/>${kind === "rival" ? `<rect x="${LEFT}" y="${y + 11}" width="9" height="3" fill="${color}"/>` : ""}
    <circle cx="${LEFT + 9}" cy="${y + 31}" r="5" fill="#13233a" stroke="#fff" stroke-width="1.5"/><circle cx="${LEFT + 27}" cy="${y + 31}" r="5" fill="#13233a" stroke="#fff" stroke-width="1.5"/></g>`;

export function playRace(host, { grade, stop, calm, finish, onFact }) {
  const paces = calm ? CALM_PACES : PACES;
  const used = new Set();
  const missed = new Map();
  let deck = [];
  let raceIndex = 0;
  let pace = 0;
  let turn = 0;
  let me = 0;
  let rival = 0;
  let card = null;
  let tries = 0;
  let peek = 0;
  let shown = "";
  let note = "";
  let fb = null;
  let settled = false;
  let over = null;
  let wins = 0;
  let firstTry = 0;
  let problems = 0;

  function deal() {
    if (!deck.length) {
      let fresh = gameProblems(grade, stop, 14).filter((item) => !used.has(item.question));
      if (fresh.length < 4) {
        used.clear();
        fresh = gameProblems(grade, stop, 14);
      }
      if (fresh.length < 4) throw new Error("Not enough problems for Math Race");
      deck = fresh;
    }
    card = deck.shift();
    used.add(card.question);
  }
  deal();

  const positions = () => t("You: {a} of {n} · Rival: {b} of {n}", { a: me, b: rival, n: TRACK });

  function startRace() {
    pace = paces[raceIndex];
    turn = 0;
    me = 0;
    rival = 0;
    over = null;
    host.innerHTML = `<div class="gm-play gm-race">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Math Race")}</b><span>${t("Race {a} of {b}", { a: raceIndex + 1, b: paces.length })}</span></div>
      <p class="gm-ask">${t("Answer a problem to move your car one segment. After every problem the rival moves on its own set plan and finishes after {pace} problems. You need {track} right answers, so you can miss up to {k} and still win. There is no clock.", { pace, track: TRACK, k: missesAllowed(pace) })}</p>
      <svg class="rc-track" viewBox="0 0 420 150" role="img" aria-label="${esc(positions())}" data-rc-track>
        <defs><pattern id="rc-check" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#fff"/><rect width="6" height="6" fill="#13233a"/><rect x="6" y="6" width="6" height="6" fill="#13233a"/></pattern></defs>
        ${LANES.map((y) => `<rect class="rc-lane" x="${LEFT - 4}" y="${y}" width="${FINISH - LEFT + 4}" height="44" rx="4"/>`).join("")}
        ${[1, 2, 3, 4, 5].map((i) => `<line class="rc-tick" x1="${LEFT + CAR + i * SEGMENT}" y1="18" x2="${LEFT + CAR + i * SEGMENT}" y2="128"/>`).join("")}
        <rect x="${FINISH}" y="18" width="12" height="110" fill="url(#rc-check)"/>
        <text class="rc-name" x="4" y="${LANES[0] + 28}">${t("You")}</text><text class="rc-name" x="4" y="${LANES[1] + 28}">${t("Rival")}</text>
        ${car("you", LANES[0], "#2a62a8")}${car("rival", LANES[1], "#b3392f")}
      </svg>
      <p class="rc-pos" data-rc-pos>${positions()}</p>
      <div data-rc-panel></div></div>`;
    panel();
  }

  function paintCars() {
    host.querySelector("[data-car='you']").style.transform = `translateX(${me * SEGMENT}px)`;
    host.querySelector("[data-car='rival']").style.transform = `translateX(${rival * SEGMENT}px)`;
    host.querySelector("[data-rc-pos]").textContent = positions();
    host.querySelector("[data-rc-track]").setAttribute("aria-label", positions());
  }

  function panel() {
    host.querySelector("[data-rc-panel]").innerHTML =
      `${canSpeak() ? `<button type="button" class="tr-tool" data-gm-read>${t("Read to me")}</button>` : ""}
      ${askFormHtml(card, { solved: settled, shown, tries, peek })}
      ${feedbackNoteHtml(esc(note), fb)}`;
    focusNext(host, settled);
    syncLive(host);
  }

  function settle(right, first, typed) {
    settled = true;
    turn += 1;
    problems += 1;
    if (first) firstTry += 1;
    onFact?.(card, first);
    if (right) me += 1;
    else missed.set(card.question, card);
    rival = rivalAt(turn, pace);
    over = winner(me, rival);
    if (over === "you") wins += 1;
    const next = over
      ? raceIndex + 1 >= paces.length
        ? t("See results")
        : t("Next race")
      : t("Next problem");
    const move = right
      ? first
        ? t("Right! Your car moves up one segment.")
        : t("Good thinking. Your car moves up one segment.")
      : t("This one is tricky. Your car stays put this turn.");
    const end =
      over === "you"
        ? ` ${t("You crossed the finish line first! Careful thinking won the race.")}`
        : over === "rival"
          ? ` ${t("The rival finished first this time. It moves on a set plan, not a clock, so fewer misses wins.")}`
          : "";
    note = `${move}${end}`;
    fb = right
      ? {
          phase: phaseFor("race", first ? "right" : "right-after-miss"),
          ctx: { expected: answerText(card), next },
        }
      : {
          phase: phaseFor("race", "revealed"),
          ctx: { submitted: typed, expected: answerText(card), next },
        };
    paintCars();
    panel();
  }

  function nextStep() {
    if (over) {
      raceIndex += 1;
      if (raceIndex >= paces.length) {
        const line = t("Won {w} of {r} races, {a} of {b} right on the first try", { w: wins, r: paces.length, a: firstTry, b: problems });
        return finish({ game: "race", stars: starsByShare(firstTry, problems), missed: [...missed.values()], line });
      }
    }
    deal();
    tries = 0;
    peek = 0;
    shown = "";
    note = "";
    fb = null;
    settled = false;
    if (over) startRace();
    else panel();
  }

  host.onsubmit = (event) => {
    event.preventDefault();
    const typed = host.querySelector("#gm-input")?.value.trim();
    if (settled || !typed) return;
    shown = typed;
    if (validateAnswer(typed, card)) return settle(true, tries === 0, typed);
    tries += 1;
    if (tries >= 2) return settle(false, false, typed);
    peek = 1;
    note = t("Not yet. Look at the steps, then try once more.");
    fb = { phase: phaseFor("race", "miss"), ctx: { submitted: typed } };
    shown = "";
    panel();
  };

  host.onclick = (event) => {
    const action = feedbackAction(event);
    if (action === "next" && settled) return nextStep();
    if (action === "try-again") {
      fb = null;
      note = "";
      return panel();
    }
    if (event.target.closest("[data-gm-read]")) return speak(card.question);
    if (event.target.closest("[data-step]") && !settled) {
      peek += 1;
      panel();
    }
  };

  startRace();
  return () => {
    host.onclick = null;
    host.onsubmit = null;
  };
}
