// Answer Sort: tap a problem, then tap the bin its answer belongs in. Works for any whole-number stop.
import { answerOf, cardText, gameProblems } from "./game-pool.js";

const fmt = (n) => n.toLocaleString("en-US", { maximumFractionDigits: 6 });
import { syncLive } from "./speech.js";
import { mathText } from "./trail-pictures.js";

const sortStars = (wrong) => (wrong <= 1 ? 3 : wrong <= 4 ? 2 : 1);

// Cards plus a dividing number: some answers are below it, some are at or above it.
const BENCHMARKS = [0.5, 1, 1.5, 2, 3];
const benchmarkLabel = (n) => (n < 1 ? "1/2" : Number.isInteger(n) ? String(n) : `${Math.floor(n)} 1/2`);

export function sortBoard(grade, stop, count, { comeback = true } = {}) {
  for (let tries = 0; tries < 30; tries += 1) {
    const cards = gameProblems(grade, stop, count, { comeback });
    // Fraction answers are sorted against a friendly benchmark (1/2, 1, 1 1/2 ...), never against 1.2222.
    if (cards.some((item) => item.kind === "fraction")) {
      const split = (line) => cards.filter((item) => answerOf(item) < line).length;
      const line = BENCHMARKS.find((b) => split(b) >= 2 && count - split(b) >= 2);
      if (line !== undefined) return { cards, line, lineText: benchmarkLabel(line) };
      continue;
    }
    const answers = cards.map(answerOf).sort((a, b) => a - b);
    const median = answers[Math.floor(count / 2)];
    // A rounder dividing number (660, not 662) makes sorting feel like estimating; keep it only if both bins stay full.
    const step = median >= 100 ? 10 ** (String(median).length - 2) : 1;
    const rounded = Math.round(median / step) * step;
    const split = (line) => cards.filter((item) => answerOf(item) < line).length;
    const line = split(rounded) >= 2 && count - split(rounded) >= 2 ? rounded : median;
    const below = split(line);
    if (below >= 2 && count - below >= 2) return { cards, line, lineText: fmt(line) };
  }
  throw new Error(`Could not build an Answer Sort board for grade ${grade} stop ${stop}`);
}

export function playSort(host, { grade, stop, calm, finish }) {
  const count = calm ? 6 : 8;
  const { cards, line, lineText } = sortBoard(grade, stop, count);
  const placed = { low: [], high: [] };
  const missed = new Map();
  let chosen = null;
  let wrong = 0;
  let nope = null;
  let timer = null;
  const left = () => cards.filter((item) => !placed.low.includes(item) && !placed.high.includes(item));
  const bin = (key, title) => `<button type="button" class="gm-bin" data-bin="${key}" ${chosen == null ? "disabled" : ""} aria-label="${title}${placed[key].length ? `, ${placed[key].length} placed` : ""}"><b>${title}</b><span>${placed[key].map((item) => mathText(cardText(item))).join(" · ")}</span></button>`;

  function render() {
    host.innerHTML = `<div class="gm-play gm-sort">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>← Games</button><b>Answer Sort</b><span>${count - left().length} of ${count} sorted</span></div>
      <p class="gm-note">${nope ? "Not that bin. Work it out again." : chosen == null ? "Pick a problem, then choose where its answer belongs." : "Where does its answer go?"}</p>
      <div class="gm-cards cols-4" role="group" aria-label="Problems to sort">${left().map((item, i) => `<button type="button" class="gm-card q${chosen === item ? " pick" : ""}${nope === item ? " nope" : ""}" data-s="${cards.indexOf(item)}" aria-pressed="${chosen === item}"><span>${mathText(cardText(item))}</span></button>`).join("")}</div>
      <div class="gm-bins">${bin("low", `Less than ${lineText}`)}${bin("high", `${lineText} or more`)}</div></div>`;
    host.querySelector(chosen != null ? `[data-s="${cards.indexOf(chosen)}"]` : "[data-s]")?.focus();
    syncLive(host);
  }

  function drop(key) {
    const item = chosen;
    const right = (answerOf(item) < line) === (key === "low");
    nope = null;
    if (!right) {
      wrong += 1;
      nope = item;
      missed.set(item.question, item);
      chosen = null;
      render();
      return;
    }
    placed[key].push(item);
    chosen = null;
    render();
    if (!left().length) timer = setTimeout(() => finish({ game: "sort", stars: sortStars(wrong), missed: [...missed.values()], line: `${wrong} wrong placement${wrong === 1 ? "" : "s"}` }), 900);
  }

  host.onclick = (event) => {
    const card = event.target.closest("[data-s]");
    if (card) {
      chosen = cards[Number(card.dataset.s)];
      nope = null;
      render();
      return;
    }
    const target = event.target.closest("[data-bin]");
    if (target && chosen != null) drop(target.dataset.bin);
  };
  render();
  return () => {
    clearTimeout(timer);
    host.onclick = null;
  };
}
