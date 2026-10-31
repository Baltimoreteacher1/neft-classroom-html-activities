// Fact Match and Target Hunt. Both are untimed: the only clock is the learner's own thinking.
import { feedbackAction, feedbackNoteHtml, phaseFor } from "./feedback-host.js";
import { answerOf, answerText, cardText, gameProblems, huntBoard, shuffle } from "./game-pool.js";
import { t } from "./i18n.js";
import { canSpeak, speak, syncLive } from "./speech.js";
import { mathText } from "./trail-pictures.js";

const pairStars = (tries) => (tries <= 8 ? 3 : tries <= 12 ? 2 : 1);
const huntStars = (wrong) => (wrong <= 2 ? 3 : wrong <= 5 ? 2 : 1);

// ---------- Fact Match: flip a problem card, then the card that holds its answer ----------
export function playMatch(host, { grade, stop, calm, finish, onFact }) {
  const pairs = calm ? 4 : 6;
  const items = gameProblems(grade, stop, pairs, { distinctAnswers: true });
  const cards = shuffle([
    ...items.map((item, id) => ({ id, side: "q", text: cardText(item) })),
    ...items.map((item, id) => ({ id, side: "a", text: answerText(item) })),
  ]);
  const matched = new Set();
  const missedIds = new Set();
  let open = [];
  let tries = 0;
  let locked = false;
  let done = false;
  let fb = null; // shared feedback panel state
  let timer = null;
  let note = t("Flip a problem card, then find the card with its answer.");

  function render(focusIndex) {
    host.innerHTML = `<div class="gm-play gm-match">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Fact Match")}</b><span>${t("{a} of {b} pairs · {n} tries", { a: matched.size, b: pairs, n: tries })}</span></div>
      ${feedbackNoteHtml(note, fb)}
      <div class="gm-cards cols-4" role="group" aria-label="${t("Fact Match cards")}">${cards
        .map((card, i) => {
          const faceUp = open.includes(i) || matched.has(card.id);
          const label = faceUp
            ? `${card.side === "q" ? t("Problem") : t("Answer")} ${card.text}${matched.has(card.id) ? t(", matched") : ""}`
            : t("Card {a} of {b}, face down", { a: i + 1, b: cards.length });
          return `<button type="button" class="gm-card ${card.side}${faceUp ? " up" : ""}${matched.has(card.id) ? " done" : ""}" data-i="${i}" aria-label="${label}" ${matched.has(card.id) ? "disabled" : ""}><span>${faceUp ? mathText(card.text) : "?"}</span></button>`;
        })
        .join("")}</div></div>`;
    if (done) host.querySelector("[data-gm-next]")?.focus();
    else if (focusIndex != null) host.querySelector(`[data-i="${focusIndex}"]`)?.focus();
    syncLive(host);
  }

  const showResult = () =>
    finish({
      game: "match",
      stars: pairStars(tries),
      missed: [...missedIds].map((id) => items[id]),
      line: t("{n} tries for {m} pairs", { n: tries, m: pairs }),
    });

  // Cards flip back on their own (the game's memory mechanic); "Try again" flips them right away.
  function flipBack(focusIndex) {
    clearTimeout(timer);
    open = [];
    locked = false;
    fb = null;
    note = t("Flip a problem card, then find the card with its answer.");
    render(focusIndex);
  }

  function pick(i) {
    if (locked || done || open.includes(i) || matched.has(cards[i].id)) return;
    open = [...open, i];
    fb = null;
    if (open.length < 2) {
      note = t("Now find its partner.");
      render(i);
      return;
    }
    tries += 1;
    const [a, b] = open.map((index) => cards[index]);
    if (a.id === b.id && a.side !== b.side) {
      matched.add(a.id);
      onFact?.(items[a.id], !missedIds.has(a.id));
      open = [];
      done = matched.size === items.length;
      note = t("Match!");
      fb = {
        phase: phaseFor("match", "right"),
        ctx: {
          expected: `${cardText(items[a.id])} = ${answerText(items[a.id])}`,
          next: done ? t("See results") : undefined,
        },
      };
      render(i);
      return;
    }
    for (const card of [a, b]) {
      if (card.side === "q") {
        missedIds.add(card.id);
        onFact?.(items[card.id], false);
      }
    }
    locked = true;
    note = t("Not a match. Look again.");
    fb = { phase: phaseFor("match", "miss"), ctx: { submitted: `${a.text} · ${b.text}` } };
    render(i);
    timer = setTimeout(() => flipBack(i), 1100);
  }

  host.onclick = (event) => {
    const action = feedbackAction(event);
    if (action === "next" && done) return showResult();
    if (action === "try-again" && locked) return flipBack();
    const card = event.target.closest("[data-i]");
    if (card) pick(Number(card.dataset.i));
  };
  render();
  return () => {
    clearTimeout(timer);
    host.onclick = null;
  };
}

// ---------- Target Hunt: tap every problem whose answer is the target number ----------
const HUNT_ROUNDS = 3;

export function playHunt(host, { grade, stop, calm, finish, onFact }) {
  let round = 0;
  let board = null;
  let found = new Set();
  let tried = new Set();
  let wrong = 0;
  let fb = null; // shared feedback panel state
  const missed = new Map();

  function start() {
    fb = null;
    board = calm ? huntBoard(grade, stop, { size: 9, hits: 3 }) : huntBoard(grade, stop);
    found = new Set();
    tried = new Set();
    render();
  }

  const targetText = () => board.targetText;
  const roundDone = () => found.size === winners();
  const winners = () => board.cards.filter((item) => answerOf(item) === board.target).length;

  function render(focusIndex) {
    host.innerHTML = `<div class="gm-play gm-hunt">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Target Hunt")}</b><span>${t("Round {n} of {m}", { n: round + 1, m: HUNT_ROUNDS })}</span></div>
      <div class="gm-target"><span>${t("Find every problem whose answer is")}</span><strong>${targetText()}</strong><em>${t("{n} of {m} found", { n: found.size, m: winners() })}</em>${canSpeak() ? `<button type="button" class="tr-tool" data-gm-read>${t("Read to me")}</button>` : ""}</div>
      ${feedbackNoteHtml(roundDone() ? t("{n} of {m} found", { n: found.size, m: winners() }) : tried.size && !found.size ? t("Not that one. Work it out and try another.") : t("Tap a card when you know its answer is the target."), fb)}
      <div class="gm-cards ${calm ? "cols-3" : "cols-4"}" role="group" aria-label="${t("Problem cards")}">${board.cards
        .map((item, i) => {
          const state = found.has(i) ? " done" : tried.has(i) ? " nope" : "";
          return `<button type="button" class="gm-card q${state}" data-i="${i}" ${found.has(i) ? "disabled" : ""} aria-label="${cardText(item)}${found.has(i) ? t(", found") : tried.has(i) ? t(", not the target") : ""}"><span>${mathText(cardText(item))}</span></button>`;
        })
        .join("")}</div></div>`;
    if (roundDone()) host.querySelector("[data-gm-next]")?.focus();
    else if (focusIndex != null) host.querySelector(`[data-i="${focusIndex}"]`)?.focus();
    syncLive(host);
  }

  function nextRound() {
    round += 1;
    if (round >= HUNT_ROUNDS)
      return finish({
        game: "hunt",
        stars: huntStars(wrong),
        missed: [...missed.values()],
        line: wrong === 1 ? t("{n} wrong tap", { n: wrong }) : t("{n} wrong taps", { n: wrong }),
      });
    start();
  }

  function pick(i) {
    const item = board.cards[i];
    if (found.has(i) || roundDone()) return;
    if (answerOf(item) === board.target) {
      found.add(i);
      onFact?.(item, !tried.has(i));
      tried.clear();
      fb = {
        phase: phaseFor("hunt", "right"),
        ctx: {
          expected: `${cardText(item)} = ${answerText(item)}`,
          next: roundDone() ? (round + 1 >= HUNT_ROUNDS ? t("See results") : t("Next round")) : undefined,
        },
      };
      render(i);
      return;
    }
    wrong += 1;
    tried.add(i);
    missed.set(item.question, item);
    onFact?.(item, false);
    fb = { phase: phaseFor("hunt", "miss"), ctx: { submitted: cardText(item) } };
    render(i);
  }

  host.onclick = (event) => {
    const action = feedbackAction(event);
    if (action === "next" && roundDone()) return nextRound();
    if (action === "try-again") {
      fb = null;
      return render();
    }
    if (event.target.closest("[data-gm-read]")) return speak(`${t("Find every problem whose answer is")} ${targetText()}`);
    const card = event.target.closest("[data-i]");
    if (card) pick(Number(card.dataset.i));
  };
  start();
  return () => {
    host.onclick = null;
  };
}
