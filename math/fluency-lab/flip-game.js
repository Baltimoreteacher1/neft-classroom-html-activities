// Tricky Facts: flash cards built from facts and problems the learner missed lately. The learner types the answer;
// a right answer retires the card, a wrong one shows steps up to (not including) the answer step, then they try again.
import { clearMiss, loadTrail, recordFact, saveTrail } from "./fact-trail.js";
import { shuffle } from "./game-pool.js";
import { t } from "./i18n.js";
import { validateAnswer } from "./problem-bank.js";
import { loadRewards, noteToday, saveRewards } from "./rewards.js";
import { canSpeak, speak, syncLive } from "./speech.js";
import { mathText, stepsBlock } from "./trail-pictures.js";

const flipStars = (first, total) => (first === total ? 3 : first * 2 >= total ? 2 : 1);
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export function deckFor(trail, grade, size) {
  const own = trail.recent.filter((entry) => entry.grade === grade);
  return shuffle(own).slice(0, size);
}

export function playFlip(host, { grade, calm, finish }) {
  const data = loadTrail();
  const deck = deckFor(data, grade, calm ? 4 : 6);
  if (!deck.length) {
    host.innerHTML = `<div class="gm-play"><div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Tricky Facts")}</b></div><p class="gm-ask">${t("No tricky facts right now. Play a game or a trail round, and any fact you miss will wait for you here.")}</p></div>`;
    host.querySelector("[data-gm-menu]")?.focus();
    return () => {};
  }
  let at = 0;
  let tries = 0;
  let peek = 0;
  let note = "";
  let firstTry = 0;
  const missed = [];
  let timer = null;

  function render() {
    const card = deck[at];
    const steps = card.steps.length > 1 ? card.steps : [];
    host.innerHTML = `<div class="gm-play gm-flip">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Tricky Facts")}</b><span>${t("Card {a} of {b}", { a: at + 1, b: deck.length })}</span></div>
      <form class="gm-ask-form" autocomplete="off"><p class="gm-q" id="gm-q">${mathText(card.question)}</p>${canSpeak() ? `<button type="button" class="tr-tool" data-gm-read>${t("Read to me")}</button>` : ""}
        <div class="tr-answer"><label class="tr-sr" for="gm-input">${t("Your answer")}</label><input id="gm-input" class="tr-input" inputmode="${card.kind === "number" ? "decimal" : "text"}" spellcheck="false" aria-describedby="gm-q" /><button type="submit" class="tr-check">${t("Check")}</button></div>
        ${steps.length && tries ? stepsBlock(steps, Math.max(1, peek), { id: "gm-steps", cap: steps.length - 1 }) : ""}
        ${steps.length > 1 && !tries ? `<button type="button" class="tr-tool" data-gm-peek>${t("Show a step")}</button>` : ""}
        <button type="button" class="tr-link" data-skip>${t("Keep this card for later")}</button></form>
      <p class="gm-note">${esc(note)}</p></div>`;
    host.querySelector("#gm-input").focus();
    syncLive(host);
  }

  function next() {
    at += 1;
    tries = 0;
    peek = 0;
    note = "";
    if (at >= deck.length) {
      timer = setTimeout(() => finish({ game: "flip", stars: flipStars(firstTry, deck.length), missed, line: t("{a} of {b} on the first try", { a: firstTry, b: deck.length }) }), 500);
      return;
    }
    render();
  }

  host.onsubmit = (event) => {
    event.preventDefault();
    const card = deck[at];
    const typed = host.querySelector("#gm-input").value;
    if (!typed.trim()) return;
    if (validateAnswer(typed, card)) {
      const fresh = loadTrail();
      recordFact(fresh, card, tries === 0);
      clearMiss(fresh, card.question);
      saveTrail(fresh);
      const rewards = loadRewards();
      rewards.retired += 1;
      noteToday(rewards);
      saveRewards(rewards);
      if (tries === 0) firstTry += 1;
      else missed.push(card);
      note = t("Got it! This card is retired.");
      render();
      timer = setTimeout(next, 700);
      return;
    }
    tries += 1;
    peek = 1;
    note = t("Not yet. Look at the steps and try again.");
    render();
    host.querySelector("#gm-input").value = typed;
  };
  host.onclick = (event) => {
    if (event.target.closest("[data-gm-read]")) return speak(deck[at].question);
    if (event.target.closest("[data-skip]")) {
      missed.push(deck[at]);
      return next();
    }
    const advance = event.target.closest("[data-step]") || event.target.closest("[data-gm-peek]");
    if (advance) {
      peek += 1;
      const typed = host.querySelector("#gm-input").value;
      tries = Math.max(tries, 1);
      render();
      host.querySelector("#gm-input").value = typed;
    }
  };
  render();
  return () => {
    clearTimeout(timer);
    host.onclick = null;
    host.onsubmit = null;
  };
}
