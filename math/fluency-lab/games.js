// Game Room: three untimed games on the grade's own fact trail, a sticker book, and a short review of misses.
import { TRAILS, loadTrail, recordFact, saveTrail } from "./fact-trail.js";
import { getGrade } from "./problem-bank.js";
import { ALL_STOPS, stopsFor } from "./game-pool.js";
import { playHunt, playMatch } from "./card-games.js";
import { playPicture } from "./picture-game.js";
import { SCENES, SCENE_IDS } from "./scenes.js";
import {
  celebrate,
  claimNewStickers,
  dailyGame,
  loadRewards,
  rankFor,
  recordGame,
  saveRewards,
  stickerShelf,
  stickerToast,
  summarize,
} from "./rewards.js";
import { mathText, stepsBlock } from "./trail-pictures.js";

const GAMES = [
  {
    id: "match",
    name: "Fact Match",
    icon: "🃏",
    blurb: "Flip cards to pair each problem with its answer.",
  },
  {
    id: "hunt",
    name: "Target Hunt",
    icon: "🎯",
    blurb: "Find every problem that equals the target number.",
  },
  {
    id: "picture",
    name: "Mystery Picture",
    icon: "🖼️",
    blurb: "Solve problems to clear the fog from a hidden picture.",
  },
];
const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const starRow = (count) =>
  `<span class="tr-stars big" aria-label="${count} of 3 stars">${[1, 2, 3].map((n) => `<span class="tr-star${n <= count ? " on" : ""}" aria-hidden="true">★</span>`).join("")}</span>`;

export function mountGames(container, { grade, autostart = null }) {
  const color = getGrade(grade).color;
  const stops = stopsFor(grade);
  let stop = ALL_STOPS;
  let stopGame = null;
  container.style.setProperty("--trail", color);

  const nextScene = (rewards) =>
    SCENE_IDS.find((id) => !rewards.scenes.includes(id)) ||
    SCENE_IDS[Math.floor(Math.random() * SCENE_IDS.length)];

  function renderMenu() {
    stopGame?.();
    stopGame = null;
    container.onclick = null;
    document.body.classList.remove("trail-playing");
    const rewards = loadRewards();
    const summary = summarize(loadTrail(), rewards);
    const rank = rankFor(summary);
    container.innerHTML = `
      <header class="gm-head">
        <div><p class="section-label">Grade ${grade}: ${esc(TRAILS[grade].focus)}</p><h2>Game Room</h2><p>No timers. Think it through, and play as long as you like.</p></div>
        <p class="gm-rank"><b aria-hidden="true">${rank.icon}</b><span>${rank.name}<small>${rank.next ? `${rank.next.at - rank.score} more points to ${rank.next.name}` : "Top rank reached"}</small></span></p>
      </header>
      <label class="gm-stop">Practice which facts?
        <select id="gm-stop">${[{ id: ALL_STOPS, name: "Everything on my trail" }, ...stops].map((s) => `<option value="${s.id}"${s.id === stop ? " selected" : ""}>${esc(s.name)}</option>`).join("")}</select>
      </label>
      <div class="gm-menu">${GAMES.map((game) => `<button type="button" class="gm-game${game.id === dailyGame() ? " today" : ""}" data-game="${game.id}">${game.id === dailyGame() ? `<em class="gm-today">Today’s pick</em>` : ""}<span class="gm-icon" aria-hidden="true">${game.icon}</span><b>${game.name}</b><small>${game.blurb}</small>${starRow(rewards.best[game.id] || 0)}</button>`).join("")}</div>
      <section class="gm-book" aria-labelledby="gm-book-title"><h3 id="gm-book-title">My sticker book</h3>${stickerShelf(summary)}</section>`;
    container.onclick = (event) => {
      const button = event.target.closest("[data-game]");
      if (button) start(button.dataset.game);
    };
    container.onchange = (event) => {
      if (event.target.id === "gm-stop") stop = event.target.value;
    };
  }

  function addFacts(item, right) {
    const data = loadTrail();
    recordFact(data, item, right);
    saveTrail(data);
  }

  function start(game) {
    const rewards = loadRewards();
    const scene = game === "picture" ? nextScene(rewards) : null;
    const host = container;
    document.body.classList.add("trail-playing");
    container.onchange = null;
    try {
      stopGame = { match: playMatch, hunt: playHunt, picture: playPicture }[game](host, {
        grade,
        stop,
        scene,
        onFact: addFacts,
        finish: (result) => renderResult(result, game),
      });
    } catch {
      // A stop with too few distinct facts for this game: go back to the menu and say so.
      renderMenu();
      container.querySelector(".gm-stop")?.insertAdjacentHTML("afterend", `<p class="gm-note" role="status">That set of facts is too small for this game. Try “Everything on my trail”.</p>`);
      return;
    }
    container.addEventListener("click", back);
    container.scrollIntoView?.({ block: "start" });
  }

  function back(event) {
    if (!event.target.closest("[data-gm-menu]")) return;
    container.removeEventListener("click", back);
    renderMenu();
  }

  function renderResult({ game, stars, missed, line, scene }, played) {
    container.removeEventListener("click", back);
    stopGame?.();
    stopGame = null;
    const rewards = loadRewards();
    recordGame(rewards, game, stars, scene);
    const fresh = claimNewStickers(rewards, summarize(loadTrail(), rewards));
    saveRewards(rewards);
    const info = GAMES.find((entry) => entry.id === game);
    const review = [...new Map(missed.map((item) => [item.question, item])).values()].slice(0, 4);
    container.innerHTML = `
      <div class="gm-result">
        ${scene ? `<div class="gm-final" role="img" aria-label="${SCENES[scene].title}"><svg viewBox="0 0 120 90" aria-hidden="true">${SCENES[scene].svg}</svg></div>` : ""}
        ${starRow(stars)}
        <h2>${stars === 3 ? "Amazing!" : stars === 2 ? "Great game!" : "Nice work!"}</h2>
        <p class="tr-score">${esc(info.name)}: ${esc(line)}</p>
        ${stickerToast(fresh)}
        ${review.length ? `<section class="gm-review"><h3>Facts to look at again</h3><div>${review.map((item) => `<article><p class="gm-review-q">${mathText(item.question)}</p>${stepsBlock(item.steps || [], (item.steps || []).length, { id: "gm-review" })}</article>`).join("")}</div></section>` : `<p class="tr-perfect">No misses this game.</p>`}
        <div class="tr-done-actions">
          <button type="button" class="tr-go" data-again>Play again</button>
          <button type="button" class="tr-link" data-gm-menu>Back to the Game Room</button>
        </div>
      </div>`;
    if (stars === 3 || fresh.length) celebrate(container);
    container.onclick = (event) => {
      if (event.target.closest("[data-again]")) start(played);
      else if (event.target.closest("[data-gm-menu]")) renderMenu();
    };
    container.querySelector("[data-again]").focus();
  }

  renderMenu();
  if (GAMES.some((game) => game.id === autostart)) start(autostart);
  return () => {
    stopGame?.();
    container.onclick = null;
    container.onchange = null;
    container.removeEventListener("click", back);
    document.body.classList.remove("trail-playing");
  };
}
