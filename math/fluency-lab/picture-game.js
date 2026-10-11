// Mystery Picture: solve a tile's problem to clear the fog from one piece of a hidden picture.
// The learner types every answer. A step is available on request and never includes the answer.
import { validateAnswer } from "./problem-bank.js";
import { SCENES } from "./scenes.js";
import { gameProblems } from "./game-pool.js";
import { mathText, stepsBlock } from "./trail-pictures.js";

const TILES = 12;
const pictureStars = (firstTry) => (firstTry >= 11 ? 3 : firstTry >= 8 ? 2 : 1);
const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function playPicture(host, { grade, stop, scene, finish, onFact }) {
  const art = SCENES[scene];
  const items = gameProblems(grade, stop, TILES);
  const cleared = new Set();
  const firstTry = new Set();
  const missedItems = new Map();
  let active = null;
  let misses = 0;
  let peek = 0;
  let note = "";

  const fog = (i) => {
    const done = cleared.has(i);
    return `<button type="button" class="gm-tile${done ? " clear" : ""}${active === i ? " on" : ""}" data-tile="${i}" ${done ? "disabled" : ""} aria-label="Tile ${i + 1}${done ? ", cleared" : ""}"><span>${done ? "" : i + 1}</span></button>`;
  };

  function panel() {
    if (active == null)
      return `<p class="gm-ask">Pick a tile to clear the fog. ${TILES - cleared.size} left.</p>`;
    const item = items[active];
    const steps = item.steps || [];
    return `<form class="gm-ask-form" autocomplete="off">
      <p class="gm-q" id="gm-q">${mathText(item.question)}</p>
      <div class="tr-answer">
        <label class="tr-sr" for="gm-input">Your answer</label>
        <input id="gm-input" class="tr-input" inputmode="${grade >= 6 ? "text" : "numeric"}" spellcheck="false" aria-describedby="gm-q" />
        <button type="submit" class="tr-check">Clear tile</button>
      </div>
      <p class="gm-note" role="status" aria-live="polite">${esc(note)}</p>
      ${misses ? `<p class="tr-tip">${mathText(item.hint)}</p>` : ""}
      ${steps.length > 1 && peek ? stepsBlock(steps, peek, { id: "gm-steps", cap: steps.length - 1 }) : ""}
      ${steps.length > 1 && !peek ? `<button type="button" class="tr-tool" data-gm-peek>Show a step</button>` : ""}
    </form>`;
  }

  function render() {
    host.innerHTML = `<div class="gm-play gm-picture">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>← Games</button><b>Mystery Picture</b><span>${cleared.size} of ${TILES} cleared</span></div>
      <div class="gm-stage">
        <div class="gm-scene" role="img" aria-label="${cleared.size === TILES ? art.title : "A hidden picture covered by fog tiles"}">
          <svg viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${art.svg}</svg>
          <div class="gm-fog">${Array.from({ length: TILES }, (_, i) => fog(i)).join("")}</div>
        </div>
        <div class="gm-side">${panel()}</div>
      </div></div>`;
    host.querySelector("#gm-input")?.focus();
  }

  function submit(value) {
    const item = items[active];
    if (!String(value).trim()) return;
    if (validateAnswer(value, item)) {
      if (!missedItems.has(active)) {
        firstTry.add(active);
        onFact?.(item, true);
      }
      cleared.add(active);
      active = null;
      misses = 0;
      peek = 0;
      note = "";
      if (cleared.size === TILES) {
        render();
        timer = setTimeout(
          () =>
            finish({
              game: "picture",
              stars: pictureStars(firstTry.size),
              scene,
              missed: [...missedItems.values()],
              line: art.title,
            }),
          1400,
        );
        return;
      }
      render();
      return;
    }
    if (!missedItems.has(active)) {
      missedItems.set(active, item);
      onFact?.(item, false);
    }
    misses += 1;
    note = "Not yet. Look at the clue and try again.";
    const typed = host.querySelector("#gm-input").value;
    render();
    host.querySelector("#gm-input").value = typed;
  }

  let timer = null;
  host.onclick = (event) => {
    const tile = event.target.closest("[data-tile]");
    if (tile && !tile.disabled) {
      active = Number(tile.dataset.tile);
      misses = 0;
      peek = 0;
      note = "";
      render();
      return;
    }
    if (event.target.closest("[data-gm-peek]")) {
      peek = 1;
      const typed = host.querySelector("#gm-input").value;
      render();
      host.querySelector("#gm-input").value = typed;
    } else if (event.target.closest('[data-step="gm-steps"]')) {
      peek += 1;
      const typed = host.querySelector("#gm-input").value;
      render();
      host.querySelector("#gm-input").value = typed;
    }
  };
  host.onsubmit = (event) => {
    event.preventDefault();
    submit(host.querySelector("#gm-input").value);
  };
  render();
  return () => {
    clearTimeout(timer);
    host.onclick = null;
    host.onsubmit = null;
  };
}
