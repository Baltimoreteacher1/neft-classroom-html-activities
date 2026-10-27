// Names for the interactive spots and tiles, so every control has a real text label in both languages. @fm2 FM-040
import { tx } from "../../lang.js";
import { UI } from "./copy.js";
import { openCells, show } from "./rules.js";

export const tileLabel = (tile) => show(tile.v, tile.label);

export function tileAria(tile, lang) {
  if (tile.kind === "op") return `${tx(UI.operation, lang)}: ${tx(UI.opNames[tile.v], lang)}`;
  const text = tileLabel(tile);
  return text;
}

// Which pan and which spot-on-that-pan an open cell is, for scales ("Right pan, spot 1").
function panSpot(round, cell, lang) {
  for (const scale of round.scales || []) {
    for (const [side, terms] of [
      ["l", scale.l],
      ["r", scale.r],
    ]) {
      const slots = terms.filter((t) => "c" in t && !t.box);
      const at = slots.findIndex((t) => t.c === cell);
      if (at >= 0) {
        const pan = tx(side === "l" ? UI.leftPan : UI.rightPan, lang);
        return slots.length > 1 ? tx(UI.panSpot, lang, { pan, n: at + 1 }) : pan;
      }
    }
  }
  return null;
}

export function slotName(round, cell, lang) {
  const open = openCells(round);
  const order = open.indexOf(cell) + 1;
  switch (round.layout) {
    case "bond":
      return tx(UI.bond[cell], lang);
    case "grid":
      return tx(UI.cell, lang, { r: Math.floor(cell / round.n) + 1, c: (cell % round.n) + 1 });
    case "magic":
      return tx(UI.cell, lang, { r: Math.floor(cell / 3) + 1, c: (cell % 3) + 1 });
    case "cage": {
      const cage = round.cages.find((c) => c.cells.includes(cell));
      const vars = {
        r: Math.floor(cell / round.n) + 1,
        c: (cell % round.n) + 1,
        label: cage ? `${cage.to}${cage.op}` : "",
      };
      return tx(cage ? UI.cageCell : UI.cell, lang, vars);
    }
    case "triangle":
      return tx(UI.triangle[cell], lang);
    case "factor": {
      if (cell < round.cols) return tx(UI.colFactor, lang, { c: cell + 1 });
      if (cell < round.cols + round.rows)
        return tx(UI.rowFactor, lang, { r: cell - round.cols + 1 });
      const p = cell - round.cols - round.rows;
      return tx(UI.product, lang, { r: Math.floor(p / round.cols) + 1, c: (p % round.cols) + 1 });
    }
    case "pairs":
      return tx(cell === 0 ? UI.first : UI.second, lang);
    case "expr":
      return round.cells[cell].type === "op"
        ? tx(UI.opSpot, lang, { n: Math.ceil(cell / 2) })
        : tx(UI.numberSpot, lang, { n: cell / 2 + 1 });
    case "eq":
      return tx(UI.blank, lang);
    case "balance": {
      const box = (round.scales || [])
        .flatMap((s) => [...s.l, ...s.r])
        .find((t) => t.c === cell && t.box);
      if (box)
        return tx(box.box === "cube" ? UI.cube : box.box === "ball" ? UI.ball : UI.xSpot, lang);
      return panSpot(round, cell, lang) || tx(UI.spot, lang, { n: order });
    }
    default:
      return tx(UI.spot, lang, { n: order });
  }
}
