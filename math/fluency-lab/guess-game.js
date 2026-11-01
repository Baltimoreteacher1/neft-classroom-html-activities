// Guess the Number (inspired by Funbrain's Guess the Number): find the computer's secret whole number. A number line
// shades the numbers each guess rules out, and a smart-guess hint points at the middle, the move that halves the choices.
// Stars reward few guesses (compared with a halving plan), never speed.
import { esc } from "./arcade-shared.js";
import { feedbackAction, feedbackNoteHtml, phaseFor } from "./feedback-host.js";
import { t } from "./i18n.js";
import {
  ROUNDS,
  countLeft,
  inBand,
  judge,
  maxFor,
  midpoint,
  narrow,
  parFor,
  parseGuess,
  pickSecret,
  starsFor,
} from "./guess-core.js";
import { syncLive } from "./speech.js";

const X0 = 10;
const WIDTH = 380;
const px = (n) => `${Math.round(n * 100) / 100}px`;

export function playGuess(host, { grade, calm, finish }) {
  const max = maxFor(grade);
  const par = parFor(max);
  const total = calm ? 2 : ROUNDS;
  let round = 0;
  let secret = 0;
  let band = { lo: 1, hi: max };
  let guesses = [];
  let hinted = null;
  let solved = false;
  let note = "";
  let fb = null;
  let allGuesses = 0;

  // Where each shaded band sits: a full-width rectangle slid and squeezed with a transform, so it animates smoothly.
  const bandStyle = (kind) => {
    const cell = WIDTH / max;
    if (kind === "low") return `transform:translateX(${px(X0)}) scaleX(${(band.lo - 1) / max})`;
    if (kind === "high")
      return `transform:translateX(${px(X0 + band.hi * cell)}) scaleX(${(max - band.hi) / max})`;
    if (kind === "pin")
      return `transform:translateX(${px(X0 + ((band.lo - 1 + band.hi) / 2) * cell)})`;
    return `transform:translateX(${px(X0 + (band.lo - 1) * cell)}) scaleX(${countLeft(band) / max})`;
  };
  const markX = (n) => X0 + (n - 0.5) * (WIDTH / max);

  const leftText = () =>
    countLeft(band) === 1
      ? t("Only one number is left: {lo}", { lo: band.lo })
      : t("{n} numbers still possible: {lo} to {hi}", {
          n: countLeft(band),
          lo: band.lo,
          hi: band.hi,
        });
  const lineLabel = () =>
    t("Number line from 1 to {max}. Still possible: {lo} to {hi}.", {
      max,
      lo: band.lo,
      hi: band.hi,
    });

  function start() {
    secret = pickSecret(max);
    band = { lo: 1, hi: max };
    guesses = [];
    hinted = null;
    solved = false;
    note = "";
    fb = null;
    host.innerHTML = `<div class="gm-play gm-guess">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Guess the Number")}</b><span>${t("Round {a} of {b}", { a: round + 1, b: total })}</span></div>
      <p class="gm-ask">${t("I am thinking of a whole number from 1 to {max}. Guess it! The number line shows which numbers are still possible.", { max })}</p>
      <svg class="gn-line" viewBox="0 0 400 110" role="img" aria-label="${esc(lineLabel())}" data-gn-line>
        <defs><pattern id="gn-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#e6ebf2"/><rect width="3" height="8" fill="#9aa8bb"/></pattern></defs>
        <rect class="gn-track" x="${X0}" y="34" width="${WIDTH}" height="28" rx="5"/>
        <rect class="gn-band gn-out" data-band="low" x="0" y="34" width="${WIDTH}" height="28" style="${bandStyle("low")}"/>
        <rect class="gn-band gn-out" data-band="high" x="0" y="34" width="${WIDTH}" height="28" style="${bandStyle("high")}"/>
        <rect class="gn-band gn-live" data-band="live" x="0" y="34" width="${WIDTH}" height="28" style="${bandStyle("live")}"/>
        <path class="gn-pin gn-band" data-band="pin" d="M-7 14L7 14L0 29Z" style="${bandStyle("pin")}"/>
        <g data-gn-marks></g>
        <text class="gn-end" x="${X0}" y="80">1</text><text class="gn-end" x="${X0 + WIDTH}" y="80" text-anchor="end">${max}</text>
      </svg>
      <p class="gn-legend"><span class="gn-key gn-key-out" aria-hidden="true"></span>${t("Ruled out")} <span class="gn-key gn-key-live" aria-hidden="true"></span>${t("Still possible")}</p>
      <p class="gn-left" data-gn-left role="status"></p>
      <form class="gm-ask-form gn-form" autocomplete="off"><div class="tr-answer"><label class="tr-sr" for="gn-input">${t("Your guess")}</label><input id="gn-input" class="tr-input" inputmode="numeric" pattern="[0-9]*" spellcheck="false" /><button type="submit" class="tr-check" data-gn-guess>${t("Guess")}</button></div>
        <button type="button" class="tr-tool" data-gn-hint>${t("Smart guess hint")}</button></form>
      <div data-gn-panel></div>
      <ol class="gn-history" data-gn-history aria-label="${t("Your guesses")}"></ol></div>`;
    paint();
    host.querySelector("#gn-input").focus();
  }

  function paint() {
    for (const element of host.querySelectorAll("[data-band]"))
      element.setAttribute("style", bandStyle(element.dataset.band));
    host.querySelector("[data-gn-line]").setAttribute("aria-label", lineLabel());
    host.querySelector("[data-gn-left]").textContent = leftText();
    const last = guesses.at(-1);
    host.querySelector("[data-gn-marks]").innerHTML =
      guesses.map((g) => `<circle class="gn-mark" cx="${markX(g.n)}" cy="48" r="4"/>`).join("") +
      (hinted && !solved
        ? `<path class="gn-mid" d="M${markX(hinted)} 40l7 8-7 8-7-8z"/><text class="gn-end" x="${markX(hinted)}" y="100" text-anchor="middle">${t("middle")}</text>`
        : "") +
      (last
        ? `<text class="gn-last" x="${markX(last.n)}" y="26" text-anchor="middle">${last.n}</text>`
        : "");
    host.querySelector("[data-gn-history]").innerHTML = guesses
      .map(
        (g) =>
          `<li>${g.verdict === "low" ? t("{n}: too low, go higher", { n: g.n }) : g.verdict === "high" ? t("{n}: too high, go lower", { n: g.n }) : t("{n}: found it!", { n: g.n })}</li>`,
      )
      .join("");
    host.querySelector("[data-gn-panel]").innerHTML = feedbackNoteHtml(esc(note), fb);
    for (const control of host.querySelectorAll("#gn-input, [data-gn-guess], [data-gn-hint]"))
      control.disabled = solved;
    syncLive(host);
  }

  function guess(text) {
    const n = parseGuess(text, max);
    if (n === null) note = t("Type a whole number from 1 to {max}.", { max });
    else if (!inBand(band, n))
      note = t("{n} is already ruled out. Pick a number that is still possible.", { n });
    else {
      const verdict = judge(n, secret);
      guesses.push({ n, verdict });
      allGuesses += 1;
      band = narrow(band, n, secret);
      hinted = null;
      if (verdict === "found") {
        solved = true;
        const label = round + 1 >= total ? t("See results") : t("Next round");
        note = t(
          "You found it in {n} guesses! Halving the choices each time finds any number in {par} or fewer.",
          { n: guesses.length, par },
        );
        fb = { phase: phaseFor("guess", "right"), ctx: { expected: String(secret), next: label } };
      } else
        note =
          verdict === "low"
            ? t("{n} is too low. The number is higher.", { n })
            : t("{n} is too high. The number is lower.", { n });
    }
    paint();
    if (solved) host.querySelector("[data-gm-next]")?.focus();
    else {
      const input = host.querySelector("#gn-input");
      input.value = "";
      input.focus();
    }
  }

  host.onsubmit = (event) => {
    event.preventDefault();
    if (!solved) guess(host.querySelector("#gn-input").value);
  };

  host.onclick = (event) => {
    if (event.target.closest("[data-gn-hint]") && !solved) {
      hinted = midpoint(band);
      note = t(
        "Smart guess: try the middle, {n}. Each middle guess cuts the possible numbers in half.",
        { n: hinted },
      );
      paint();
      return host.querySelector("#gn-input").focus();
    }
    if (feedbackAction(event) !== "next" || !solved) return;
    round += 1;
    if (round >= total) {
      const stars = starsFor(allGuesses, par * total);
      return finish({
        game: "guess",
        stars,
        missed: [],
        line: t("Found {r} numbers in {n} guesses. Halving needs at most {par} each time.", {
          r: total,
          n: allGuesses,
          par,
        }),
      });
    }
    start();
  };

  start();
  return () => {
    host.onclick = null;
    host.onsubmit = null;
  };
}
