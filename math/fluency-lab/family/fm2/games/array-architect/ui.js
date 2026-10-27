// Chooses the screen for a round's kind. Every screen returns { destroy(), setLang(lang) } so a language switch keeps
// the work in progress. @fm2 FM-011 FM-021
import { mountBoard } from "./ui-board.js";
import { mountModel } from "./ui-model.js";
import { mountTiles } from "./ui-tiles.js";

export function mount(root, ctx) {
  const kind = ctx.round.kind;
  const screen = kind === "model" ? mountModel : kind === "tiling" || kind === "tiles" ? mountTiles : mountBoard;
  return screen(root, ctx);
}
