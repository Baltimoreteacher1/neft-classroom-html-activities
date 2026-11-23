// Puzzle Adventure: every solved item earns one piece of a picture. Pick the piece up and choose where it fits;
// the pieces really are windows onto one scene, so a piece only fits where its colors and lines continue.
// "Place it for me" is always there, so the picture never depends on sharp eyes.

import { gridFor, fragment } from "./game-art.js";
import { renderBlocks } from "./blocks.js";
import { buildSteps } from "./flow.js";
import { icon } from "./icons.js";
import { mountQuestion } from "./question.js";
import { h, seeded, shuffled } from "./util.js";

export function mountPuzzle(area, ctx, { onFinish }) {
  const steps = buildSteps(ctx.activity).filter((s) => s.question);
  if (!steps.length) {
    onFinish();
    return {};
  }
  const n = steps.length;
  const { cols, rows } = gridFor(n);
  const cells = cols * rows;
  const st = (ctx.state.game.puzzle ||= (() => {
    const rand = seeded(ctx.activity.id);
    const free = shuffled(
      Array.from({ length: cells }, (_, i) => i).slice(0, n),
      rand,
    );
    const placed = Array.from({ length: cells }, (_, i) => i >= n);
    return { cellOf: free, placed, held: -1 };
  })());

  const board = h("div", { class: "sp-board", style: `--cols:${cols};--rows:${rows}`, role: "group", "aria-label": ctx.t("puzzleBoard") });
  const say = h("p", { class: "sp-say", role: "status", "aria-live": "polite" });
  const panel = h("div", { class: "sp-puzzle-panel" });
  area.replaceChildren(h("div", { class: "sp-puzzle" }, board, say, panel));

  const earned = () => steps.map((s, k) => k).filter((k) => ctx.session.isDone(steps[k].question));
  const inBin = () => earned().filter((k) => !st.placed[st.cellOf[k]]);
  const talk = (t) => {
    say.textContent = t;
  };

  function paintBoard() {
    board.replaceChildren();
    for (let c = 0; c < cells; c++) {
      const on = st.placed[c];
      const slot = h("button", { type: "button", class: `sp-cell${on ? " is-placed" : ""}`, "data-cell": c, "aria-label": on ? ctx.t("spaceFilled", { n: c + 1 }) : ctx.t("spaceEmpty", { n: c + 1 }), disabled: on }, fragment(c, cols, rows));
      slot.addEventListener("click", () => place(c));
      board.append(slot);
    }
  }

  function place(c, forced) {
    if (st.held < 0) return talk(ctx.t("pickPieceFirst"));
    if (st.cellOf[st.held] !== c && !forced) {
      const el = board.children[c];
      el.classList.add("is-nofit");
      setTimeout(() => el.classList.remove("is-nofit"), 500);
      return talk(ctx.t("noFitPiece"));
    }
    st.placed[st.cellOf[st.held]] = true;
    st.held = -1;
    talk(ctx.t("pieceFits"));
    render();
    panel.querySelector("h2")?.focus();
  }

  function render() {
    paintBoard();
    panel.replaceChildren();
    const bin = inBin();
    if (st.placed.every(Boolean)) return victory();
    if (!bin.length) return ask();
    const tray = h("div", { class: "sp-tray", role: "group", "aria-label": ctx.t("puzzleBin") });
    for (const k of bin) {
      const b = h("button", { type: "button", class: "sp-piece", "aria-pressed": String(st.held === k), "aria-label": ctx.t("pieceN", { n: k + 1 }) }, fragment(st.cellOf[k], cols, rows));
      b.addEventListener("click", () => {
        st.held = st.held === k ? -1 : k;
        talk(st.held === k ? ctx.t("pieceHeld") : "");
        render();
        panel.querySelectorAll(".sp-piece")[bin.indexOf(k)]?.focus();
      });
      tray.append(b);
    }
    const auto = h("button", { type: "button", class: "sp-btn sp-btn-quiet" }, icon("puzzle", 18), ctx.msg("placeForMe"));
    auto.addEventListener("click", () => {
      if (st.held < 0) st.held = bin[0];
      place(st.cellOf[st.held], true);
    });
    panel.append(h("h2", { class: "sp-round-title", tabindex: "-1" }, ctx.t("earnedPiece")), h("p", null, ctx.t("puzzleHelp")), tray, h("div", { class: "sp-actions" }, auto));
  }

  function ask() {
    const k = steps.findIndex((s) => !ctx.session.isDone(s.question));
    const step = steps[k];
    if (step.content.length) panel.append(h("div", { class: "sp-content" }, renderBlocks(step.content, ctx)));
    mountQuestion(panel, step.question, ctx, { index: k, total: n, last: false, onNext: render }).focus();
  }

  function victory() {
    const done = h("button", { type: "button", class: "sp-btn sp-btn-primary" }, ctx.msg("finish"));
    done.addEventListener("click", onFinish);
    const title = h("h2", { class: "sp-round-title", tabindex: "-1" }, icon("star", 22), ctx.t("pictureDone"));
    panel.append(title, h("p", null, ctx.t("pictureDoneBody")), done);
    board.classList.add("is-complete");
    talk(ctx.t("pictureDone"));
    ctx.focus(title);
  }

  render();
  return {};
}
