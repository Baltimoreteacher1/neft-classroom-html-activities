// Class Code Challenge (inspired by shared-code live games): one short code deals the same set of problems to everyone
// who enters it at the same grade, so a class can play side by side and compare results without accounts or a server.
// Untimed: two tries per problem, steps (never the answer) after a first miss, no ranking by speed.
import { feedbackAction, feedbackNoteHtml, phaseFor } from "./feedback-host.js";
import { ALL_STOPS, answerText, gameProblem } from "./game-pool.js";
import { t } from "./i18n.js";
import { seededRandom, validateAnswer } from "./problem-bank.js";
import { canSpeak, speak, syncLive } from "./speech.js";
import { peekCap } from "./step-leak.js";
import { mathText, stepsBlock } from "./trail-pictures.js";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const PROBLEMS = 8;
const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const starsFor = (first, total) => (first === total ? 3 : first * 2 >= total ? 2 : 1);

export const newCode = (rng = Math.random) =>
  Array.from({ length: CODE_LENGTH }, () => ALPHABET[Math.floor(rng() * ALPHABET.length)]).join("");

// Letters and digits only, upper case; look-alikes are folded (O to 0, I and L to 1).
export const cleanCode = (value) =>
  String(value)
    .toUpperCase()
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, CODE_LENGTH);

export const validCode = (code) =>
  code.length === CODE_LENGTH &&
  [...code].every((ch) => ALPHABET.includes(ch) || "01".includes(ch));

function seedFor(grade, code) {
  let hash = 2166136261;
  for (const ch of `${grade}:${code}`) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  return hash >>> 0;
}

// The same grade and code always give the same problems in the same order.
export function challengeSet(grade, code, count = PROBLEMS) {
  const rng = seededRandom(seedFor(grade, code));
  const items = [];
  const seen = new Set();
  for (let tries = 0; items.length < count && tries < 400; tries += 1) {
    const item = gameProblem(grade, ALL_STOPS, rng);
    if (seen.has(item.question)) continue;
    seen.add(item.question);
    items.push(item);
  }
  return items;
}

export function playChallenge(host, { grade, calm, finish, onFact }) {
  const count = calm ? 5 : PROBLEMS;
  let code = "";
  let deck = [];
  let at = 0;
  let tries = 0;
  let peek = 0;
  let firstTry = 0;
  let note = "";
  let solved = false;
  let fb = null;
  let shown = "";
  const missed = [];

  function renderIntro(message = "") {
    const suggestion = newCode();
    host.innerHTML = `<div class="gm-play gm-challenge">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Class Code Challenge")}</b></div>
      <p class="gm-ask">${t("Everyone who enters the same code gets the same problems. Your teacher can say a code out loud or write it on the board. There is no timer and no ranking by speed.")}</p>
      <form class="gm-ask-form" data-code-form autocomplete="off">
        <label for="gm-code">${t("Class code")}</label>
        <div class="tr-answer"><input id="gm-code" class="tr-input" maxlength="${CODE_LENGTH}" spellcheck="false" autocapitalize="characters" value="${suggestion}" aria-describedby="gm-code-note" /><button type="submit" class="tr-check">${t("Start")}</button></div>
        <p class="gm-note" id="gm-code-note" role="status">${esc(message || t("This code is new. Type your teacher's code instead to match your class."))}</p>
        <button type="button" class="tr-link" data-new-code>${t("Make a different code")}</button>
      </form></div>`;
    host.querySelector("#gm-code").select();
    syncLive(host);
  }

  function begin(chosen) {
    code = chosen;
    deck = challengeSet(grade, code, count);
    at = 0;
    renderCard();
  }

  function renderCard() {
    const card = deck[at];
    const steps = peekCap(card) > 0 ? card.steps : [];
    host.innerHTML = `<div class="gm-play gm-challenge">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Class Code Challenge")}</b><span>${t("Code {code}", { code })} · ${t("Problem {a} of {b}", { a: at + 1, b: deck.length })}</span></div>
      <form class="gm-ask-form" autocomplete="off"><p class="gm-q" id="gm-q">${mathText(card.question)}</p>${canSpeak() ? `<button type="button" class="tr-tool" data-gm-read>${t("Read to me")}</button>` : ""}
        <div class="tr-answer"><label class="tr-sr" for="gm-input">${t("Your answer")}</label><input id="gm-input" class="tr-input" inputmode="${card.kind === "number" ? "decimal" : "text"}" spellcheck="false" aria-describedby="gm-q" value="${esc(shown)}"${solved ? " disabled" : ""} /><button type="submit" class="tr-check"${solved ? " disabled" : ""}>${t("Check")}</button></div>
        ${steps.length && tries && !solved ? stepsBlock(steps, Math.max(1, peek), { id: "gm-steps", cap: peekCap(card) }) : ""}</form>
      ${feedbackNoteHtml(esc(note), fb)}</div>`;
    if (solved) host.querySelector("[data-gm-next]")?.focus();
    else host.querySelector("#gm-input").focus();
    syncLive(host);
  }

  function advance() {
    at += 1;
    tries = 0;
    peek = 0;
    note = "";
    fb = null;
    solved = false;
    shown = "";
    if (at >= deck.length) {
      return finish({
        game: "challenge",
        stars: starsFor(firstTry, deck.length),
        missed,
        line: `${t("{a} of {b} on the first try", { a: firstTry, b: deck.length })} · ${t("Code {code}", { code })}`,
      });
    }
    renderCard();
  }

  host.onsubmit = (event) => {
    event.preventDefault();
    if (event.target.matches("[data-code-form]")) {
      const chosen = cleanCode(host.querySelector("#gm-code").value);
      return validCode(chosen)
        ? begin(chosen)
        : renderIntro(t("A class code has 6 letters and numbers. Check it and try again."));
    }
    if (solved) return;
    const card = deck[at];
    const typed = host.querySelector("#gm-input").value;
    if (!typed.trim()) return;
    shown = typed;
    const nextLabel = at + 1 >= deck.length ? t("See results") : t("Next problem");
    if (validateAnswer(typed, card)) {
      solved = true;
      onFact?.(card, tries === 0);
      if (tries === 0) firstTry += 1;
      note = t("Nice thinking.");
      fb = {
        phase: phaseFor("challenge", tries === 0 ? "right" : "right-after-miss"),
        ctx: { expected: answerText(card), next: nextLabel },
      };
      return renderCard();
    }
    tries += 1;
    if (tries === 1) {
      peek = 1;
      note = t("Not yet. Look at the steps, then try once more.");
      fb = { phase: phaseFor("challenge", "miss"), ctx: { submitted: typed.trim() } };
      shown = "";
      return renderCard();
    }
    solved = true;
    onFact?.(card, false);
    missed.push(card);
    note = t("This one is tricky. It will wait for you in the review.");
    fb = {
      phase: phaseFor("challenge", "revealed"),
      ctx: { submitted: typed.trim(), expected: answerText(card), next: nextLabel },
    };
    renderCard();
  };

  host.onclick = (event) => {
    const action = feedbackAction(event);
    if (action === "next" && solved) return advance();
    if (action === "try-again") {
      fb = null;
      note = "";
      return renderCard();
    }
    if (event.target.closest("[data-new-code]")) {
      host.querySelector("#gm-code").value = newCode();
      return host.querySelector("#gm-code").select();
    }
    if (event.target.closest("[data-gm-read]")) return speak(deck[at].question);
    if (event.target.closest("[data-step]") && !solved) {
      peek += 1;
      renderCard();
    }
  };
  renderIntro();
  return () => {
    host.onclick = null;
    host.onsubmit = null;
  };
}
