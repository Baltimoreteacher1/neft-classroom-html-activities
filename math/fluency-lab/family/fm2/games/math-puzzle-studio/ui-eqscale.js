// The equation balance scale: boxes of the same hidden weight x plus loose weights on two pans. The learner chooses an
// amount and a pan, then takes weights or x-boxes off, or splits both pans into equal groups. A legal move on both pans
// keeps the beam level; a move on one pan tips it by exactly what was removed; an impossible move is refused with the
// reason in words. The move list lives in `state`, so a language switch loses nothing. @fm2 FM-058 FM-059 FM-078
import { panDrop, scaleSvg, weightSvg } from "../../art/puzzles.js";
import { escapeHtml, tx } from "../../lang.js";
import { toMixedString } from "../../rational.js";
import { MOVE_MISTAKES } from "./copy-mistakes.js";
import { UI } from "./copy.js";
import { applyMove, difference, replay, tiltFor } from "./scale.js";
import { readingText } from "./ui-scale-view.js";

const esc = escapeHtml;
const SIDE_WORD = { l: UI.panLeftWord, r: UI.panRightWord };
const xText = (n) => (n === 1 ? "x" : `${n}x`);
const sideText = (pan) => {
  const k = toMixedString(pan.k);
  if (pan.x && pan.k.n) return `${xText(pan.x)} + ${k}`;
  return pan.x ? xText(pan.x) : k;
};
export const stateText = (s) => `${sideText(s.l)} = ${sideText(s.r)}`;

function looseHtml(pan, lang) {
  if (pan.k.n === 0) return "";
  const text = toMixedString(pan.k);
  const label =
    pan.k.d === 1 && pan.k.n === 1
      ? tx(UI.looseWeight, lang, { n: text })
      : tx(UI.looseWeightsN, lang, { n: text });
  const body =
    pan.k.d === 1 && pan.k.n <= 12
      ? `<span class="pz-cubes" aria-hidden="true">${"<i></i>".repeat(pan.k.n)}</span><span class="pz-num" aria-hidden="true">${text}</span>`
      : `<span class="pz-num" aria-hidden="true">${esc(text)}</span>`;
  return `<li class="pz-wt pz-wt-loose"><span class="pz-inner" role="img" aria-label="${esc(label)}">${body}</span></li>`;
}

function panHtml(side, pan, drop, lang) {
  const boxes = pan.x
    ? `<li class="pz-wt pz-boxes"><span class="pz-inner" role="img" aria-label="${esc(`${pan.x} ${tx(UI.boxes, lang)}`)}">${weightSvg("x").repeat(pan.x)}</span></li>`
    : "";
  const name = tx(side === "l" ? UI.leftPan : UI.rightPan, lang);
  const empty = !pan.x && pan.k.n === 0 ? `<li class="pz-wt pz-num">0</li>` : "";
  return `<div class="pz-pan pz-pan-${side}" style="--drop:${drop}"><p class="pz-pan-title">${esc(name)}</p><ul class="pz-items" aria-label="${esc(name)}">${boxes}${looseHtml(pan, lang)}${empty}</ul></div>`;
}

export function mountEquationScale(root, ctx) {
  const round = ctx.round;
  let lang = ctx.lang;
  let alive = true;
  const state = { moves: [], amt: 1, pans: "both", msg: "", done: false };
  const t = (copy, vars) => tx(copy, lang, vars);
  const locked = () => state.done || Boolean(ctx.locked?.());
  const current = () => replay(round, state.moves).state;
  const canTakeBoxes = round.eq.l.x > 0 && round.eq.r.x > 0;

  function describe(move) {
    if (move.op === "split") return t(UI.moveSplit, { n: move.n });
    if (move.what === "x") return t(UI.moveTakeX, { n: move.n });
    const pans =
      move.side === "both" ? UI.pansBoth : move.side === "l" ? UI.pansLeft : UI.pansRight;
    return t(UI.moveTakeK, { n: move.n, pans: t(pans) });
  }

  function render(focus) {
    const key = focus ?? document.activeElement?.dataset?.pzKey;
    const now = current();
    const diff = difference(round, now);
    const tilt = tiltFor(diff, round.ref);
    const drop = (panDrop(tilt) / 6).toFixed(3);
    const off = locked() ? "disabled" : "";
    const pan = (id, label) =>
      `<button type="button" class="fm2-btn pz-pan-pick${state.pans === id ? " is-on" : ""}" data-pz-pans="${id}" data-pz-key="pans-${id}" aria-pressed="${state.pans === id}" ${off}>${esc(t(label))}</button>`;
    root.innerHTML = `<div class="pz pz-eqscale" data-pz data-layout="scale">
      <p class="pz-tip">${esc(t(UI.moveTip))}</p>
      <section class="pz-scale-wrap" aria-label="${esc(t(UI.board))}">
        <div class="pz-scale" data-pz-scale="0" data-tilt="${tilt.toFixed(2)}" style="--tilt:${tilt.toFixed(2)}deg">${scaleSvg(tilt)}<div class="pz-pans">${panHtml("l", now.l, drop, lang)}${panHtml("r", now.r, (-Number(drop)).toFixed(3), lang)}</div></div>
        <p class="pz-reading" data-pz-reading="0">${esc(readingText({ diff }, lang))}</p>
        <p class="pz-equation" data-pz-equation>${esc(t(UI.equationNow, { text: stateText(now) }))}</p>
      </section>
      <div class="pz-moves" role="group" aria-label="${esc(t(UI.movesLabel))}">
        <div class="pz-move-row"><label class="pz-amt-label" for="pz-amt">${esc(t(UI.amount))}</label>
          <button type="button" class="fm2-btn pz-xbtn" data-pz-less data-pz-key="less" aria-label="${esc(t(UI.lessAmount))}" ${off}>−</button>
          <input id="pz-amt" class="pz-amt" type="number" inputmode="numeric" min="1" max="99" step="1" value="${state.amt}" data-pz-amt data-pz-key="amt" ${off}>
          <button type="button" class="fm2-btn pz-xbtn" data-pz-more data-pz-key="more" aria-label="${esc(t(UI.moreAmount))}" ${off}>+</button></div>
        <div class="pz-move-row" role="group" aria-label="${esc(t(UI.whichPans))}">${pan("both", UI.bothPans)}${pan("l", UI.leftOnly)}${pan("r", UI.rightOnly)}</div>
        <div class="pz-move-row">
          <button type="button" class="fm2-btn" data-pz-take="k" data-pz-key="take-k" ${off}>${esc(t(UI.takeWeights))}</button>
          ${canTakeBoxes ? `<button type="button" class="fm2-btn" data-pz-take="x" data-pz-key="take-x" ${off}>${esc(t(UI.takeBoxes))}</button>` : ""}
          <button type="button" class="fm2-btn" data-pz-split data-pz-key="split" ${off}>${esc(t(UI.split))}</button></div>
      </div>
      <ol class="pz-history" aria-label="${esc(t(UI.history))}">${state.moves.length ? state.moves.map((m) => `<li>${esc(describe(m))}</li>`).join("") : `<li class="pz-none">${esc(t(UI.noMoves))}</li>`}</ol>
      <div class="pz-actions">
        <button type="button" class="fm2-btn" data-pz-undo data-pz-key="undo" ${off || !state.moves.length ? "disabled" : ""}>${esc(t(UI.undo))}</button>
        <button type="button" class="fm2-btn fm2-btn-quiet" data-pz-clear data-pz-key="clear" ${off}>${esc(t(UI.clear))}</button>
        <button type="button" class="fm2-btn fm2-btn-primary pz-check" data-pz-check data-pz-key="check" ${off}>${esc(t(UI.check))}</button>
      </div>
      <p class="pz-msg" role="status" data-pz-msg>${esc(state.msg)}</p>
    </div>`;
    if (key) root.querySelector(`[data-pz-key="${key}"]`)?.focus({ preventScroll: true });
  }

  const reading = () => readingText({ diff: difference(round, current()) }, lang);

  function attempt(move, focus) {
    const step = applyMove(current(), move);
    if (!step.ok) {
      const base = MOVE_MISTAKES[step.mistake] || MOVE_MISTAKES["bad-move"];
      const have = step.side
        ? step.mistake === "too-few-weights"
          ? toMixedString(current()[step.side].k)
          : current()[step.side].x
        : 0;
      state.msg = tx(base, lang, {
        pan: step.side ? t(SIDE_WORD[step.side]) : "",
        have,
        n: move.n,
      });
      render(focus);
      ctx.announce?.(state.msg);
      return;
    }
    state.moves.push(move);
    state.msg = "";
    render(focus);
    ctx.announce?.(
      `${describe(move)} ${reading()} ${t(UI.equationNow, { text: stateText(step.state) })}`,
    );
  }

  function onClick(event) {
    if (!alive || locked()) return;
    const hit = (selector) => event.target.closest(selector);
    const take = hit("[data-pz-take]");
    const pans = hit("[data-pz-pans]");
    if (take)
      attempt(
        { op: "take", what: take.dataset.pzTake, side: state.pans, n: state.amt },
        `take-${take.dataset.pzTake}`,
      );
    else if (hit("[data-pz-split]"))
      attempt({ op: "split", side: state.pans, n: state.amt }, "split");
    else if (pans) {
      state.pans = pans.dataset.pzPans;
      render(`pans-${state.pans}`);
    } else if (hit("[data-pz-more]")) {
      state.amt = Math.min(99, state.amt + 1);
      render("more");
    } else if (hit("[data-pz-less]")) {
      state.amt = Math.max(1, state.amt - 1);
      render("less");
    } else if (hit("[data-pz-undo]")) {
      if (state.moves.pop()) {
        state.msg = "";
        render("undo");
        ctx.announce?.(`${t(UI.undone)} ${reading()}`);
      }
    } else if (hit("[data-pz-clear]")) {
      if (state.moves.length) {
        state.moves = [];
        state.msg = "";
        render("clear");
        ctx.announce?.(t(UI.cleared));
      }
    } else if (hit("[data-pz-check]")) {
      const result = ctx.submit({ moves: [...state.moves] });
      if (result.correct) state.done = true;
      render(result.correct ? undefined : "check");
    }
  }

  const onInput = (event) => {
    const field = event.target.closest?.("[data-pz-amt]");
    if (!field) return;
    const n = Math.floor(Number(field.value));
    if (Number.isFinite(n) && n >= 1) state.amt = Math.min(99, n);
  };
  const onChange = (event) => {
    const field = event.target.closest?.("[data-pz-amt]");
    if (field) field.value = String(state.amt);
  };

  root.addEventListener("click", onClick);
  root.addEventListener("input", onInput);
  root.addEventListener("change", onChange);
  ctx.onLock?.(() => {
    if (!alive) return;
    state.done = true;
    render();
  });
  render();
  return {
    destroy() {
      alive = false;
      root.removeEventListener("click", onClick);
      root.removeEventListener("input", onInput);
      root.removeEventListener("change", onChange);
      root.innerHTML = "";
    },
    setLang(next) {
      lang = next;
      render();
    },
  };
}
