// Number Builder interaction. The pieces workspace lives here (ten-frames, base-ten blocks, discs and chips); digit
// tiles and the scientific-notation builder have their own files. The mat is redrawn from the counts after every
// action, and a language switch re-renders every label from the same state, so no work is lost. @fm2 FM-007 FM-021 FM-038 FM-039
import { matSvg, pieceIcon } from "../../art/place-value.js";
import { t } from "./copy.js";
import { recipe } from "./copy-recipe.js";
import { pieceFace, pieceName } from "./copy-text.js";
import { emptyCounts, liveValue, totalPieces } from "./logic.js";
import { mountChart } from "./ui-chart.js";
import { mountSci } from "./ui-sci.js";
import {
  actionsHtml,
  createFlow,
  esc,
  focusKey,
  keptHtml,
  lockWhenDone,
  restoreFocus,
  rulesHtml,
} from "./ui-shared.js";
import { fmtNum, wordsFor } from "./words.js";

const speak = (value, lang) => {
  try {
    return wordsFor(value, lang);
  } catch {
    return "";
  }
};

export function readoutText(value, lang) {
  const shown = fmtNum(value);
  const words = speak(value, lang);
  return `${t("worth", lang, { value: shown })}${words && words !== shown ? ` (${words})` : ""}`;
}

function mountPieces(root, ctx) {
  const round = ctx.round;
  let lang = ctx.lang;
  let counts = { ...emptyCounts(round), ...(round.start || {}) };
  let history = [];
  const piece = (id) => round.pieces.find((p) => p.id === id);
  const snapshot = () => history.push({ ...counts });
  const build = () => ({ counts: { ...counts } });
  const api = {
    build,
    blank: () => ({ counts: emptyCounts(round) }),
    load: (b) => {
      snapshot();
      counts = { ...b.counts };
    },
    refresh: () => update(),
  };
  const flow = createFlow(ctx, api);
  const lock = lockWhenDone(root, ctx);

  const matLabel = () =>
    totalPieces(counts) ? recipe(round, build(), lang) : t("worthEmpty", lang);
  const valueNow = () => liveValue(round, build());

  function update() {
    root.querySelector("[data-mat]").innerHTML = matSvg(
      round,
      counts,
      `${t("mat", lang)}: ${matLabel()}`,
    );
    root.querySelector("[data-readout]").textContent = totalPieces(counts)
      ? readoutText(valueNow(), lang)
      : t("worthEmpty", lang);
    for (const p of round.pieces) {
      const n = counts[p.id];
      const card = root.querySelector(`[data-piece="${p.id}"]`);
      card.querySelector("[data-count]").textContent = n;
      const add = card.querySelector("[data-add]");
      add.setAttribute(
        "aria-label",
        `${t("addPiece", lang, { name: pieceName(p, lang, 1) })}. ${t("count", lang, { n })}`,
      );
      add.setAttribute(
        "aria-disabled",
        String(n >= p.max || (round.cap && totalPieces(counts) >= round.cap) || false),
      );
      card.querySelector("[data-sub]").setAttribute("aria-disabled", String(n === 0));
    }
    root.querySelector("[data-rules]").innerHTML = rulesHtml(round, build(), flow.kept, lang);
    root.querySelector("[data-kept]").innerHTML = keptHtml(round, flow.kept, lang);
    root.querySelector('[data-act="check"]').textContent = flow.label(lang);
    lock.sync();
  }

  function render() {
    const focus = focusKey(root);
    const cards = round.pieces
      .map(
        (p, i) => `<li class="nb-card" data-piece="${esc(p.id)}">
          <button type="button" class="nb-add" data-add="${esc(p.id)}">${pieceIcon(p, i)}<span class="nb-name">${esc(pieceName(p, lang, 1))}</span><span class="nb-face">${esc(pieceFace(p))}</span></button>
          <div class="nb-step"><button type="button" class="nb-sub" data-sub="${esc(p.id)}" aria-label="${esc(t("removePiece", lang, { name: pieceName(p, lang, 1) }))}"><span aria-hidden="true">−</span></button><output class="nb-count" data-count>0</output></div>
        </li>`,
      )
      .join("");
    root.innerHTML = `<div class="nb" data-nb data-mode="pieces" data-kit="${round.kit}">
      <div class="nb-rules" data-rules></div>
      <div class="nb-mat-wrap"><div class="nb-mat" data-mat></div><p class="nb-readout" data-readout></p></div>
      <h3 class="nb-h">${esc(t("tray", lang))}</h3>
      <ul class="nb-tray">${cards}</ul>
      ${actionsHtml(lang, flow)}
      <div class="nb-kept" data-kept></div></div>`;
    update();
    restoreFocus(root, focus);
  }

  function add(id) {
    if (ctx.locked()) return;
    const p = piece(id);
    if (counts[id] >= p.max) return ctx.announce(t("maxed", lang));
    if (round.cap && totalPieces(counts) >= round.cap) return ctx.announce(t("full", lang));
    snapshot();
    counts[id] += 1;
    update();
    ctx.announce(t("added", lang, { name: pieceName(p, lang, 1), value: fmtNum(valueNow()) }));
  }

  function remove(id) {
    if (ctx.locked()) return;
    const p = piece(id);
    if (counts[id] === 0)
      return ctx.announce(t("nothingToRemove", lang, { name: pieceName(p, lang, 1) }));
    snapshot();
    counts[id] -= 1;
    update();
    ctx.announce(t("removed", lang, { name: pieceName(p, lang, 1), value: fmtNum(valueNow()) }));
  }

  const onClick = (event) => {
    const target = event.target.closest("button");
    if (!target || !root.contains(target)) return;
    if (target.dataset.add) add(target.dataset.add);
    else if (target.dataset.sub) remove(target.dataset.sub);
    else if (target.dataset.edit) flow.edit(Number(target.dataset.edit));
    else if (target.dataset.act === "check") flow.press(lang);
    else if (target.dataset.act === "clear") {
      if (ctx.locked()) return;
      snapshot();
      counts = emptyCounts(round);
      update();
      ctx.announce(t("cleared", lang));
    } else if (target.dataset.act === "undo") {
      if (ctx.locked()) return;
      if (!history.length) return ctx.announce(t("nothingToUndo", lang));
      counts = history.pop();
      update();
      ctx.announce(t("undone", lang, { value: fmtNum(valueNow()) }));
    }
  };
  // Arrow keys on a piece: up adds one, down takes one away.
  const onKey = (event) => {
    const card = event.target.closest("[data-piece]");
    if (!card) return;
    const id = card.dataset.piece;
    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      event.preventDefault();
      add(id);
    } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      event.preventDefault();
      remove(id);
    }
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

export function mount(root, ctx) {
  if (ctx.round.mode === "chart") return mountChart(root, ctx);
  if (ctx.round.mode === "sci") return mountSci(root, ctx);
  return mountPieces(root, ctx);
}
