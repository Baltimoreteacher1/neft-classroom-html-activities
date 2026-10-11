// Fact Match and Target Hunt. Both are untimed: the only clock is the learner's own thinking.
import { answerOf, cardText, gameProblems, huntBoard, shuffle } from "./game-pool.js";
import { canSpeak, speak } from "./speech.js";
import { mathText } from "./trail-pictures.js";

const pairStars = (tries) => (tries <= 8 ? 3 : tries <= 12 ? 2 : 1);
const huntStars = (wrong) => (wrong <= 2 ? 3 : wrong <= 5 ? 2 : 1);

// ---------- Fact Match: flip a problem card, then the card that holds its answer ----------
export function playMatch(host, { grade, stop, calm, finish }) {
  const pairs = calm ? 4 : 6;
  const items = gameProblems(grade, stop, pairs, { distinctAnswers: true });
  const cards = shuffle([
    ...items.map((item, id) => ({ id, side: "q", text: cardText(item) })),
    ...items.map((item, id) => ({ id, side: "a", text: String(answerOf(item)) })),
  ]);
  const matched = new Set();
  const missedIds = new Set();
  let open = [];
  let tries = 0;
  let locked = false;
  let timer = null;
  let note = "Flip a problem card, then find the card with its answer.";

  function render(focusIndex) {
    host.innerHTML = `<div class="gm-play gm-match">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>← Games</button><b>Fact Match</b><span>${matched.size} of ${pairs} pairs · ${tries} tries</span></div>
      <p class="gm-note" role="status" aria-live="polite">${note}</p>
      <div class="gm-cards cols-4" role="group" aria-label="Fact Match cards">${cards
        .map((card, i) => {
          const faceUp = open.includes(i) || matched.has(card.id);
          const label = faceUp
            ? `${card.side === "q" ? "Problem" : "Answer"} ${card.text}${matched.has(card.id) ? ", matched" : ""}`
            : "Face-down card";
          return `<button type="button" class="gm-card ${card.side}${faceUp ? " up" : ""}${matched.has(card.id) ? " done" : ""}" data-i="${i}" aria-label="${label}" ${matched.has(card.id) ? "disabled" : ""}><span>${faceUp ? mathText(card.text) : "?"}</span></button>`;
        })
        .join("")}</div></div>`;
    if (focusIndex != null) host.querySelector(`[data-i="${focusIndex}"]`)?.focus();
  }

  function pick(i) {
    if (locked || open.includes(i) || matched.has(cards[i].id)) return;
    open = [...open, i];
    if (open.length < 2) {
      note = "Now find its partner.";
      render(i);
      return;
    }
    tries += 1;
    const [a, b] = open.map((index) => cards[index]);
    if (a.id === b.id && a.side !== b.side) {
      matched.add(a.id);
      open = [];
      note = `Match! ${mathText(cardText(items[a.id]))} = ${answerOf(items[a.id])}`;
      render(i);
      if (matched.size === items.length)
        timer = setTimeout(
          () =>
            finish({
              game: "match",
              stars: pairStars(tries),
              missed: [...missedIds].map((id) => items[id]),
              line: `${tries} tries for ${pairs} pairs`,
            }),
          900,
        );
      return;
    }
    for (const card of [a, b]) if (card.side === "q") missedIds.add(card.id);
    locked = true;
    note = "Not a match. Look again.";
    render(i);
    timer = setTimeout(() => {
      open = [];
      locked = false;
      note = "Flip a problem card, then find the card with its answer.";
      render(i);
    }, 1100);
  }

  host.onclick = (event) => {
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

export function playHunt(host, { grade, stop, calm, finish }) {
  let round = 0;
  let board = null;
  let found = new Set();
  let tried = new Set();
  let wrong = 0;
  const missed = new Map();
  let timer = null;

  function start() {
    board = calm ? huntBoard(grade, stop, { size: 9, hits: 3 }) : huntBoard(grade, stop);
    found = new Set();
    tried = new Set();
    render();
  }

  const winners = () => board.cards.filter((item) => answerOf(item) === board.target).length;

  function render(focusIndex) {
    host.innerHTML = `<div class="gm-play gm-hunt">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>← Games</button><b>Target Hunt</b><span>Round ${round + 1} of ${HUNT_ROUNDS}</span></div>
      <div class="gm-target"><span>Find every problem that equals</span><strong>${board.target}</strong><em>${found.size} of ${winners()} found</em>${canSpeak() ? `<button type="button" class="tr-tool" data-gm-read>Read to me</button>` : ""}</div>
      <p class="gm-note" role="status" aria-live="polite">${tried.size && !found.size ? "Not that one. Work it out and try another." : "Tap a card when you know its answer is the target."}</p>
      <div class="gm-cards ${calm ? "cols-3" : "cols-4"}" role="group" aria-label="Problem cards">${board.cards
        .map((item, i) => {
          const state = found.has(i) ? " done" : tried.has(i) ? " nope" : "";
          return `<button type="button" class="gm-card q${state}" data-i="${i}" ${found.has(i) ? "disabled" : ""} aria-label="${cardText(item)}${found.has(i) ? ", found" : tried.has(i) ? ", not the target" : ""}"><span>${mathText(cardText(item))}</span></button>`;
        })
        .join("")}</div></div>`;
    if (focusIndex != null) host.querySelector(`[data-i="${focusIndex}"]`)?.focus();
  }

  function pick(i) {
    const item = board.cards[i];
    if (found.has(i)) return;
    if (answerOf(item) === board.target) {
      found.add(i);
      tried.clear();
      render(i);
      if (found.size === winners()) {
        round += 1;
        if (round >= HUNT_ROUNDS)
          timer = setTimeout(
            () =>
              finish({
                game: "hunt",
                stars: huntStars(wrong),
                missed: [...missed.values()],
                line: `${wrong} wrong tap${wrong === 1 ? "" : "s"}`,
              }),
            900,
          );
        else {
          host.querySelector(".gm-note").innerHTML =
            `<button type="button" class="tr-go" data-gm-next>Next round</button>`;
          host.querySelector("[data-gm-next]").focus();
        }
      }
      return;
    }
    wrong += 1;
    tried.add(i);
    missed.set(item.question, item);
    render(i);
  }

  host.onclick = (event) => {
    if (event.target.closest("[data-gm-next]")) return start();
    if (event.target.closest("[data-gm-read]")) return speak(`Find every problem that equals ${board.target}`);
    const card = event.target.closest("[data-i]");
    if (card) pick(Number(card.dataset.i));
  };
  start();
  return () => {
    clearTimeout(timer);
    host.onclick = null;
  };
}
