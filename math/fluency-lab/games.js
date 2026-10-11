// Game Room: four untimed games on the grade's own fact trail, a sticker book, and a short review of misses.
import { TRAILS, loadTrail, recordFact, saveTrail } from "./fact-trail.js";
import { getGrade } from "./problem-bank.js";
import { ALL_STOPS, stopOptions, stopsFor } from "./game-pool.js";
import { playHunt, playMatch } from "./card-games.js";
import { playSort } from "./sort-game.js";
import { playMistake } from "./mistake-game.js";
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

export const GAMES = [
  {
    id: "match",
    name: "Fact Match",
    icon: "🃏",
    blurb: "Flip cards to pair each problem with its answer.",
    run: playMatch,
  },
  {
    id: "hunt",
    name: "Target Hunt",
    icon: "🎯",
    blurb: "Find every problem that equals the target number.",
    run: playHunt,
  },
  {
    id: "sort",
    name: "Answer Sort",
    icon: "🗂️",
    blurb: "Sort problems by whether their answer is less than a number.",
    run: playSort,
  },
  {
    id: "mistake",
    name: "Spot the Mistake",
    icon: "🔍",
    blurb: "Find the wrong step in a solution, then fix it.",
    run: playMistake,
  },
  {
    id: "picture",
    name: "Mystery Picture",
    icon: "🖼️",
    blurb: "Solve problems to clear the fog from a hidden picture.",
    run: playPicture,
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

// The review after a game shows the steps up to, but not including, the one that names the answer.
function reviewBody(item, id, shown) {
  const steps = item.steps || [];
  return `<p class="gm-review-q">${mathText(item.question)}</p>${stepsBlock(steps, shown, { id, cap: steps.length })}`;
}

export function mountGames(container, { grade, autostart = null, assignedStop = null }) {
  const stops = stopsFor(grade);
  let stop =
    assignedStop && stops.some((entry) => entry.id === assignedStop) ? assignedStop : ALL_STOPS;
  let scenePick = "next";
  let stopGame = null;
  let reviewItems = [];
  container.style.setProperty("--trail", getGrade(grade).color);

  const nextScene = (rewards) =>
    scenePick !== "next" && SCENES[scenePick]
      ? scenePick
      : SCENE_IDS.find((id) => !rewards.scenes.includes(id)) ||
        SCENE_IDS[Math.floor(Math.random() * SCENE_IDS.length)];

  function renderMenu(notice = "") {
    stopGame?.();
    stopGame = null;
    container.onclick = null;
    document.body.classList.remove("trail-playing");
    const rewards = loadRewards();
    const summary = summarize(loadTrail(), rewards);
    const rank = rankFor(summary);
    container.innerHTML = `
      <header class="gm-head">
        <div><p class="section-label">Grade ${grade}: ${esc(TRAILS[grade].focus)}</p><h2>Game Room</h2><p>No timers. Think it through, and play as long as you like. Facts you missed lately come back in mixed play.</p></div>
        <p class="gm-rank"><b aria-hidden="true">${rank.icon}</b><span>${rank.name}<small>${rank.next ? `${rank.next.at - rank.score} more points to ${rank.next.name}` : "Top rank reached"}</small></span></p>
      </header>
      <div class="gm-options">
        <label class="gm-stop">Practice which facts?
          <select id="gm-stop">${stopOptions(stops, stop)}</select>
        </label>
        <label class="gm-stop">Mystery Picture
          <select id="gm-scene"><option value="next"${scenePick === "next" ? " selected" : ""}>Next new picture</option>${SCENE_IDS.map((id) => `<option value="${id}"${scenePick === id ? " selected" : ""}>${esc(SCENES[id].title)}${rewards.scenes.includes(id) ? " ✓" : ""}</option>`).join("")}</select>
        </label>
        <label class="gm-calm"><input type="checkbox" id="gm-calm"${rewards.calm ? " checked" : ""} /> Calm mode <small>Fewer cards, a head start on the picture</small></label>
      </div>
      ${notice ? `<p class="gm-note" role="status">${esc(notice)}</p>` : ""}
      <div class="gm-menu">${GAMES.map((game) => `<button type="button" class="gm-game${game.id === dailyGame() ? " today" : ""}" data-game="${game.id}">${game.id === dailyGame() ? `<em class="gm-today">Today’s pick</em>` : ""}<span class="gm-icon" aria-hidden="true">${game.icon}</span><b>${game.name}</b><small>${game.blurb}</small>${starRow(rewards.best[game.id] || 0)}</button>`).join("")}</div>
      <section class="gm-book" aria-labelledby="gm-book-title"><h3 id="gm-book-title">My sticker book</h3>${stickerShelf(summary)}</section>`;
    container.onclick = (event) => {
      const button = event.target.closest("[data-game]");
      if (button) start(button.dataset.game);
    };
    container.onchange = (event) => {
      if (event.target.id === "gm-stop") stop = event.target.value;
      if (event.target.id === "gm-scene") scenePick = event.target.value;
      if (event.target.id === "gm-calm") {
        const data = loadRewards();
        data.calm = event.target.checked;
        saveRewards(data);
      }
    };
  }

  function addFacts(item, right) {
    const data = loadTrail();
    recordFact(data, item, right);
    saveTrail(data);
  }

  function start(gameId) {
    const rewards = loadRewards();
    const scene = gameId === "picture" ? nextScene(rewards) : null;
    document.body.classList.add("trail-playing");
    container.onchange = null;
    try {
      stopGame = GAMES.find((game) => game.id === gameId).run(container, {
        grade,
        stop,
        scene,
        calm: rewards.calm,
        onFact: addFacts,
        finish: (result) => renderResult(result, gameId),
      });
    } catch {
      // A stop with too few distinct facts for this game: go back to the menu and say so.
      renderMenu("That set of facts is too small for this game. Try “Everything on my trail”.");
      return;
    }
    container.addEventListener("click", back);
    focusHeading(".gm-bar b");
    container.scrollIntoView?.({ block: "start" });
  }

  // Re-rendering removes the button that was focused, so put focus on a heading in the new screen.
  function focusHeading(selector) {
    const heading = container.querySelector(selector);
    heading?.setAttribute("tabindex", "-1");
    heading?.focus();
  }

  function back(event) {
    if (!event.target.closest("[data-gm-menu]")) return;
    container.removeEventListener("click", back);
    renderMenu();
    focusHeading(".gm-head h2");
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
    reviewItems = [...new Map(missed.map((item) => [item.question, item])).values()].slice(0, 4);
    container.innerHTML = `
      <div class="gm-result">
        ${scene ? `<div class="gm-final" role="img" aria-label="${SCENES[scene].title}"><svg viewBox="0 0 120 90" aria-hidden="true">${SCENES[scene].svg}</svg></div>` : ""}
        ${starRow(stars)}
        <h2>${stars === 3 ? "Amazing!" : stars === 2 ? "Great game!" : "Nice work!"}</h2>
        <p class="tr-score">${esc(info.name)}: ${esc(line)}</p>
        ${stickerToast(fresh)}
        ${reviewItems.length ? `<section class="gm-review"><h3>Facts to look at again</h3><p>Tap “Next step” to work through each one. Try to finish it before the last step.</p><div>${reviewItems.map((item, i) => `<article data-review="${i}">${reviewBody(item, `gm-review-${i}`, Math.max(1, (item.steps || []).length - 1))}</article>`).join("")}</div></section>` : `<p class="tr-perfect">No misses this game.</p>`}
        <div class="tr-done-actions">
          <button type="button" class="tr-go" data-again>Play again</button>
          <button type="button" class="tr-link" data-gm-menu>Back to the Game Room</button>
        </div>
      </div>`;
    if (stars === 3 || fresh.length) celebrate(container);
    container.onclick = (event) => {
      const next = event.target.closest("[data-step]");
      if (next) {
        const card = next.closest("[data-review]");
        const index = Number(card.dataset.review);
        card.innerHTML = reviewBody(
          reviewItems[index],
          `gm-review-${index}`,
          card.querySelectorAll("li").length + 1,
        );
        card.querySelector("[data-step]")?.focus();
      } else if (event.target.closest("[data-again]")) start(played);
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
