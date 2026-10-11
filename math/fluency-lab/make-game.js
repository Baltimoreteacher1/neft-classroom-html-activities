// Make It: tap two tiles that add (or multiply) to the target. Several pairs hide on each board, and a tile
// can only be used once, so the learner has to think about which pair goes where.
import { shuffle } from "./game-pool.js";
import { t } from "./i18n.js";
import { syncLive } from "./speech.js";

const ROUNDS = 3;
const makeStars = (wrong) => (wrong <= 2 ? 3 : wrong <= 5 ? 2 : 1);
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Grades 1-2 add small numbers, Grades 3-5 multiply facts, Grades 6-8 add bigger numbers.
export function rulesFor(grade) {
  if (grade <= 2) return { op: "+", targets: grade === 1 ? range(7, 10) : range(11, 20), low: 1, high: (target) => target - 1 };
  if (grade <= 5) return { op: "×", targets: [12, 16, 18, 20, 24, 30, 36, 48, 60, 72], low: 2, high: () => 12 };
  return { op: "+", targets: range(30, 150), low: 5, high: (target) => target - 5 };
}

const combine = (op, a, b) => (op === "+" ? a + b : a * b);

export function makeBoard(grade, pairsWanted = 3) {
  const { op, targets, low, high } = rulesFor(grade);
  for (let tries = 0; tries < 200; tries += 1) {
    const target = pick(targets);
    const max = high(target);
    const pairs = [];
    for (let a = low; a <= max; a += 1) for (let b = a; b <= max; b += 1) if (combine(op, a, b) === target) pairs.push([a, b]);
    if (pairs.length < pairsWanted) continue;
    const chosen = shuffle(pairs).slice(0, pairsWanted);
    const tiles = chosen.flat();
    for (let extra = 0; extra < 2; extra += 1) tiles.push(pick(range(low, Math.max(low + 1, max))));
    return { op, target, tiles: shuffle(tiles) };
  }
  throw new Error(`Could not build a Make It board for grade ${grade}`);
}

export function playMake(host, { grade, calm, finish }) {
  const total = calm ? 2 : ROUNDS;
  let round = 0;
  let board = null;
  let used = new Set();
  let chosen = null;
  let nope = null;
  let found = [];
  let wrong = 0;
  let timer = null;

  const anyLeft = () => {
    const free = board.tiles.map((value, i) => ({ value, i })).filter(({ i }) => !used.has(i));
    return free.some((x, i) => free.slice(i + 1).some((y) => combine(board.op, x.value, y.value) === board.target));
  };

  function start() {
    board = makeBoard(grade, calm ? 2 : 3);
    used = new Set();
    chosen = null;
    nope = null;
    found = [];
    render();
  }

  function render(focus) {
    const verb = board.op === "+" ? t("add to make") : t("multiply to make");
    host.innerHTML = `<div class="gm-play gm-make">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Make It")}</b><span>${t("Round {n} of {m}", { n: round + 1, m: total })}</span></div>
      <div class="gm-target"><span>${t("Tap two tiles that")} ${verb}</span><strong>${board.target}</strong></div>
      <p class="gm-note">${nope ? t("Those two do not make the target. Try another pair.") : chosen == null ? t("Pick a tile.") : t("Now pick a partner.")}</p>
      <div class="gm-cards cols-4" role="group" aria-label="${t("Number tiles")}">${board.tiles.map((value, i) => `<button type="button" class="gm-card q${chosen === i ? " pick" : ""}${used.has(i) ? " done" : ""}${nope === i ? " nope" : ""}" data-m="${i}" aria-pressed="${chosen === i}" ${used.has(i) ? "disabled" : ""}><span>${value}</span></button>`).join("")}</div>
      ${found.length ? `<ul class="gm-pairs" aria-label="${t("Pairs you found")}">${found.map((pair) => `<li>${pair}</li>`).join("")}</ul>` : ""}</div>`;
    if (focus != null) host.querySelector(`[data-m="${focus}"]`)?.focus();
    syncLive(host);
  }

  function pickTile(i) {
    if (used.has(i)) return;
    if (chosen == null) {
      chosen = i;
      nope = null;
      render(i);
      return;
    }
    if (chosen === i) {
      chosen = null;
      render(i);
      return;
    }
    const [a, b] = [board.tiles[chosen], board.tiles[i]];
    if (combine(board.op, a, b) === board.target) {
      used.add(chosen).add(i);
      found = [...found, `${a} ${board.op} ${b} = ${board.target}`];
      chosen = null;
      nope = null;
      render();
      if (!anyLeft()) {
        round += 1;
        if (round >= total) timer = setTimeout(() => finish({ game: "make", stars: makeStars(wrong), missed: [], line: wrong === 1 ? t("{n} wrong pair", { n: wrong }) : t("{n} wrong pairs", { n: wrong }) }), 900);
        else {
          host.querySelector(".gm-note").innerHTML = `<button type="button" class="tr-go" data-gm-next>${t("Next round")}</button>`;
          host.querySelector("[data-gm-next]").focus();
        }
      }
      return;
    }
    wrong += 1;
    nope = i;
    chosen = null;
    render(i);
  }

  host.onclick = (event) => {
    if (event.target.closest("[data-gm-next]")) return start();
    const tile = event.target.closest("[data-m]");
    if (tile) pickTile(Number(tile.dataset.m));
  };
  start();
  return () => {
    clearTimeout(timer);
    host.onclick = null;
  };
}
