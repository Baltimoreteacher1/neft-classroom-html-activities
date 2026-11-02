// Tricky Facts: flash cards built from facts and problems the learner missed lately. The learner types the answer;
// a right answer retires the card, a wrong one shows steps up to (not including) the answer step, then they try again.
import { clearMiss, loadTrail, recordFact, saveTrail } from "./fact-trail.js";
import { feedbackAction, feedbackNoteHtml, phaseFor } from "./feedback-host.js";
import { shuffle } from "./game-pool.js";
import { t } from "./i18n.js";
import { validateAnswer } from "./problem-bank.js";
import { loadRewards, noteToday, saveRewards } from "./rewards.js";
import { canSpeak, speak, syncLive } from "./speech.js";
import { peekCap } from "./step-leak.js";
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
  let fb = null; // shared feedback panel state
  let solved = false;
  let shown = "";
  const missed = [];

  function render() {
    const card = deck[at];
    const steps = peekCap(card) > 0 ? card.steps : [];
    host.innerHTML = `<div class="gm-play gm-flip">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Tricky Facts")}</b><span>${t("Card {a} of {b}", { a: at + 1, b: deck.length })}</span></div>
      <form class="gm-ask-form" autocomplete="off"><p class="gm-q" id="gm-q">${mathText(card.question)}</p>${canSpeak() ? `<button type="button" class="tr-tool" data-gm-read>${t("Read to me")}</button>` : ""}
        <div class="tr-answer"><label class="tr-sr" for="gm-input">${t("Your answer")}</label><input id="gm-input" class="tr-input" inputmode="${card.kind === "number" ? "decimal" : "text"}" spellcheck="false" aria-describedby="gm-q" value="${esc(shown)}"${solved ? " disabled" : ""} /><button type="submit" class="tr-check"${solved ? " disabled" : ""}>${t("Check")}</button></div>
        ${steps.length && tries && !solved ? stepsBlock(steps, Math.max(1, peek), { id: "gm-steps", cap: peekCap(card) }) : ""}
        ${steps.length > 0 && !tries && !solved ? `<button type="button" class="tr-tool" data-gm-peek>${t("Show a step")}</button>` : ""}
        ${solved ? "" : `<button type="button" class="tr-link" data-skip>${t("Keep this card for later")}</button>`}</form>
      ${feedbackNoteHtml(esc(note), fb)}</div>`;
    if (solved) host.querySelector("[data-gm-next]")?.focus();
    else host.querySelector("#gm-input").focus();
    syncLive(host);
  }

  function next() {
    at += 1;
    tries = 0;
    peek = 0;
    note = "";
    fb = null;
    solved = false;
    shown = "";
    if (at >= deck.length) {
      finish({ game: "flip", stars: flipStars(firstTry, deck.length), missed, line: t("{a} of {b} on the first try", { a: firstTry, b: deck.length }) });
      return;
    }
    render();
  }

  host.onsubmit = (event) => {
    event.preventDefault();
    if (solved) return;
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
      const first = tries === 0;
      if (first) firstTry += 1;
      else missed.push(card);
      note = t("Got it! This card is retired.");
      solved = true;
      shown = typed;
      fb = { phase: phaseFor("flip", first ? "right" : "right-after-miss"), ctx: { expected: String(card.displayAnswer ?? card.answers?.[0] ?? ""), next: at + 1 >= deck.length ? t("See results") : t("Next") } };
      render();
      return;
    }
    tries += 1;
    peek = 1;
    note = t("Not yet. Look at the steps and try again.");
    fb = { phase: phaseFor("flip", "miss"), ctx: { submitted: typed.trim() } };
    render();
    host.querySelector("#gm-input").value = typed;
  };
  host.onclick = (event) => {
    const action = feedbackAction(event);
    if (action === "next") return solved ? next() : undefined;
    if (action === "try-again") return host.querySelector("#gm-input")?.focus();
    if (event.target.closest("[data-gm-read]")) return speak(deck[at].question);
    if (solved) return;
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
    host.onclick = null;
    host.onsubmit = null;
  };
}
