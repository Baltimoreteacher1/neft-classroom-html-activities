// Plays a game shared as a link: the whole game is in the URL hash (#g=...), nothing is fetched from a server.
import { $, decodeShare } from "../lib.js";

const root = $("[data-game-root]");
const code = /#g=([A-Za-z0-9_-]+)/.exec(location.hash)?.[1];
(async () => {
  const game = code && (await decodeShare(code));
  if (!game) {
    root.innerHTML = '<p class="empty">This link does not contain a game. <a href="/tools/game-maker/">Make a game</a>.</p>';
    return;
  }
  document.title = `${game.title} · The Language Page`;
  $("[data-game-title]").textContent = game.title;
  $("[data-edit-game]").href = `/tools/game-maker/#g=${code}`;
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/lp/assets/game/game.css";
  document.head.append(css);
  const s = document.createElement("script");
  s.src = "/lp/assets/game/runtime.js";
  s.onload = () => window.LPGame.mount(root, game);
  document.head.append(s);
})();
