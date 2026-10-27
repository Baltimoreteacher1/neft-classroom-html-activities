// Digit tiles in a place-value chart (grade 4). Tap a tile to put it in the selected place; tap a filled place to
// take its tile back. Arrow keys move between places. @fm2 FM-007 FM-021 FM-038 FM-039
import { PLACE_NAMES, t } from "./copy.js";
import {
  createFlow,
  esc,
  focusKey,
  keptHtml,
  lockWhenDone,
  restoreFocus,
  actionsHtml,
} from "./ui-shared.js";
import { fmtNum } from "./words.js";

export function mountChart(root, ctx) {
  const round = ctx.round;
  const n = round.tiles.length;
  let lang = ctx.lang;
  let slots = Array(n).fill(null); // tile index per place, left to right
  let selected = 0;
  let history = [];
  const place = (j) => PLACE_NAMES[lang][n - 1 - j];
  const digit = (i) => round.tiles[i];
  const build = () => ({ slots: slots.map((i) => (i === null ? null : digit(i))) });
  const snapshot = () => history.push({ slots: [...slots], selected });
  const firstEmpty = () => slots.findIndex((s) => s === null);
  const api = {
    build,
    blank: () => ({ slots: Array(n).fill(null) }),
    load: (b) => {
      snapshot();
      const used = new Set();
      slots = b.slots.map((d) => {
        if (d === null) return null;
        const i = round.tiles.findIndex((x, k) => x === d && !used.has(k));
        used.add(i);
        return i;
      });
      selected = Math.max(0, firstEmpty());
    },
    refresh: () => update(),
  };
  const flow = createFlow(ctx, api);
  const lock = lockWhenDone(root, ctx);

  function update() {
    const full = slots.every((s) => s !== null);
    root.querySelectorAll("[data-slot]").forEach((button) => {
      const j = Number(button.dataset.slot);
      const tile = slots[j];
      button.textContent = tile === null ? "" : digit(tile);
      button.setAttribute(
        "aria-label",
        tile === null
          ? t("slotEmpty", lang, { place: place(j) })
          : t("slotFilled", lang, { place: place(j), d: digit(tile) }),
      );
      button.classList.toggle("nb-selected", j === selected && tile === null);
      if (j === selected && tile === null) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    root.querySelectorAll("[data-tile]").forEach((button) => {
      const i = Number(button.dataset.tile);
      const used = slots.includes(i);
      button.setAttribute("aria-label", t(used ? "tileUsed" : "tileFree", lang, { d: digit(i) }));
      button.setAttribute("aria-disabled", String(used));
      button.classList.toggle("nb-used", used);
    });
    root.querySelector("[data-readout]").textContent = full
      ? t("chartValue", lang, { value: fmtNum(slots.map(digit).join("")) })
      : t("chartValueOpen", lang);
    root.querySelector('[data-act="check"]').textContent = flow.label(lang);
    root.querySelector("[data-kept]").innerHTML = keptHtml(round, flow.kept, lang);
    lock.sync();
  }

  function render() {
    const focus = focusKey(root);
    const slotHtml = slots
      .map(
        (_, j) =>
          `<li class="nb-slot-wrap${(n - 1 - j) % 3 === 2 && j > 0 ? " nb-group" : ""}"><button type="button" class="nb-slot" data-slot="${j}"></button><span class="nb-place"><span class="nb-pname">${esc(place(j))}</span><span class="nb-pnum" aria-hidden="true">${(10 ** (n - 1 - j)).toLocaleString("en-US")}</span></span></li>`,
      )
      .join("");
    const tileHtml = round.tiles
      .map(
        (_, i) =>
          `<li><button type="button" class="nb-tile" data-tile="${i}"><span aria-hidden="true">${digit(i)}</span></button></li>`,
      )
      .join("");
    root.innerHTML = `<div class="nb" data-nb data-mode="chart">
      <h3 class="nb-h">${esc(t("chartTitle", lang))}</h3>
      <ol class="nb-slots">${slotHtml}</ol>
      <p class="nb-readout" data-readout></p>
      <h3 class="nb-h">${esc(t("tilesTitle", lang))}</h3>
      <ul class="nb-tiles">${tileHtml}</ul>
      ${actionsHtml(lang, flow)}
      <div class="nb-kept" data-kept></div></div>`;
    update();
    restoreFocus(root, focus);
  }

  function putTile(i) {
    if (ctx.locked() || slots.includes(i)) return;
    const target = slots[selected] === null ? selected : firstEmpty();
    if (target < 0) return;
    snapshot();
    slots[target] = i;
    const next = firstEmpty();
    selected = next < 0 ? target : next;
    update();
    const value = slots.every((s) => s !== null) ? fmtNum(slots.map(digit).join("")) : "";
    ctx.announce(
      t("placed", lang, {
        d: digit(i),
        place: place(target),
        value: value ? t("chartValue", lang, { value }) : "",
      }).trim(),
    );
  }

  function slotPress(j) {
    if (ctx.locked()) return;
    if (slots[j] === null) {
      selected = j;
      update();
      return;
    }
    snapshot();
    const lifted = slots[j];
    slots[j] = null;
    selected = j;
    update();
    ctx.announce(t("lifted", lang, { d: digit(lifted), place: place(j) }));
  }

  const onClick = (event) => {
    const target = event.target.closest("button");
    if (!target || !root.contains(target)) return;
    if (target.dataset.tile !== undefined) putTile(Number(target.dataset.tile));
    else if (target.dataset.slot !== undefined) slotPress(Number(target.dataset.slot));
    else if (target.dataset.edit) flow.edit(Number(target.dataset.edit));
    else if (target.dataset.act === "check") flow.press(lang);
    else if (target.dataset.act === "clear") {
      if (ctx.locked()) return;
      snapshot();
      slots = Array(n).fill(null);
      selected = 0;
      update();
      ctx.announce(t("cleared", lang));
    } else if (target.dataset.act === "undo") {
      if (ctx.locked()) return;
      if (!history.length) return ctx.announce(t("nothingToUndo", lang));
      ({ slots, selected } = history.pop());
      update();
      ctx.announce(
        t("undone", lang, {
          value: slots.every((s) => s !== null) ? fmtNum(slots.map(digit).join("")) : "…",
        }),
      );
    }
  };
  const onKey = (event) => {
    const slot = event.target.closest("[data-slot]");
    if (!slot || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const j = Number(slot.dataset.slot) + (event.key === "ArrowRight" ? 1 : -1);
    root.querySelector(`[data-slot="${j}"]`)?.focus();
  };
  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKey);
  render();
  return {
    destroy() {
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKey);
      lock.destroy();
      root.innerHTML = "";
    },
    setLang(next) {
      lang = next;
      render();
    },
  };
}
