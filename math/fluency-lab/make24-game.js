// Make 24 (inspired by the classic 24 Game): combine four numbers, two at a time, until one number is left and it is 24.
// Untimed. Hints narrow the search (a pair, then an operation) and never hand over the whole route unless the learner asks.
import { feedbackAction, feedbackNoteHtml, phaseFor } from "./feedback-host.js";
import { t } from "./i18n.js";
import { syncLive } from "./speech.js";
import { OPS, apply, dealCard, frac, showFrac, solve, stepText } from "./make24-core.js";

const TARGET = 24;
const ROUNDS = 3;
// Help counts: a hint is 1, showing the route is 3. No help is 3 stars.
const starsFor = (help) => (help === 0 ? 3 : help <= 3 ? 2 : 1);

export function playMake24(host, { grade, calm, finish }) {
  const total = calm ? 2 : ROUNDS;
  const wholeOnly = grade <= 5;
  let round = 0;
  let help = 0;
  let card = null;
  let tiles = [];
  let undo = [];
  let first = null;
  let op = null;
  let hints = 0;
  let note = "";
  let settled = false;
  let fb = null;

  const route = () =>
    solve(
      tiles.map((tile) => tile.value),
      { target: TARGET, wholeOnly },
    );

  function start() {
    card = dealCard(grade);
    tiles = card.values.map((n, id) => ({ id, value: frac(n) }));
    undo = [];
    first = null;
    op = null;
    hints = 0;
    note = "";
    settled = false;
    fb = null;
    render();
  }

  function render(focus) {
    const nextLabel = round + 1 >= total ? t("See results") : t("Next card");
    host.innerHTML = `<div class="gm-play gm-make24">
      <div class="gm-bar"><button type="button" class="tr-back" data-gm-menu>${t("← Games")}</button><b>${t("Make 24")}</b><span>${t("Card {a} of {b}", { a: round + 1, b: total })}</span></div>
      <div class="gm-target"><span>${t("Pick two numbers and a move. Keep going until one number is left. Make")}</span><strong>${TARGET}</strong></div>
      ${feedbackNoteHtml(note || (first == null ? t("Pick a number.") : op == null ? t("Now pick a move: +, −, ×, or ÷.") : t("Now pick the second number.")), fb ? { ...fb, ctx: { ...fb.ctx, next: nextLabel } } : null)}
      <div class="gm-cards cols-4" role="group" aria-label="${t("Number tiles")}">${tiles.map((tile, i) => `<button type="button" class="gm-card q${first === i ? " pick" : ""}" data-t="${i}" aria-pressed="${first === i}"${settled ? " disabled" : ""}><span>${showFrac(tile.value)}</span></button>`).join("")}</div>
      <div class="gm-ops" role="group" aria-label="${t("Moves")}">${OPS.map((symbol) => `<button type="button" class="tr-tool${op === symbol ? " pick" : ""}" data-op="${symbol}" aria-pressed="${op === symbol}"${first == null || settled ? " disabled" : ""}>${symbol}</button>`).join("")}</div>
      ${undo.length ? `<ul class="gm-pairs" aria-label="${t("Moves so far")}">${undo.map((entry) => `<li>${entry.text}</li>`).join("")}</ul>` : ""}
      <div class="gm-ops">
        <button type="button" class="tr-tool" data-undo${undo.length && !settled ? "" : " disabled"}>${t("Undo")}</button>
        <button type="button" class="tr-tool" data-restart${undo.length && !settled ? "" : " disabled"}>${t("Start this card over")}</button>
        <button type="button" class="tr-tool" data-hint${settled || tiles.length < 2 ? " disabled" : ""}>${hints >= 2 ? t("Show a way") : t("Give me a hint")}</button>
      </div></div>`;
    const target = focus != null ? host.querySelector(focus) : null;
    if (settled) host.querySelector("[data-gm-next]")?.focus();
    else target?.focus();
    syncLive(host);
  }

  const reveal = () => {
    const steps = solve(card.values, { target: TARGET, wholeOnly });
    help += 3;
    settled = true;
    note = t("Here is one way. Look for why it works, then try the next card.");
    fb = {
      phase: phaseFor("make24", "revealed"),
      ctx: { expected: steps.map(stepText).join(" · ") },
    };
    render();
  };

  function hint() {
    if (hints >= 2) return reveal();
    const steps = route();
    if (!steps) {
      note = t("These numbers cannot make 24 from here. Try Undo or start the card over.");
      return render("[data-undo]");
    }
    hints += 1;
    help += 1;
    const [{ a, b, op: move }] = steps;
    note =
      hints === 1
        ? t("Try using {a} and {b} together.", { a, b })
        : t("Try {a} {op} {b}.", { a, b, op: move });
    render("[data-hint]");
  }

  function combine(second) {
    const a = tiles[first];
    const b = tiles[second];
    const result = apply(a.value, b.value, op, wholeOnly);
    if (!result) {
      const uneven = op === "÷" && b.value.n !== 0;
      note = uneven
        ? t("That division does not come out even. Try another move.")
        : t("That move is not possible. Try another move.");
      fb = {
        phase: phaseFor("make24", "miss"),
        ctx: { submitted: `${showFrac(a.value)} ${op} ${showFrac(b.value)}` },
      };
      first = null;
      op = null;
      return render();
    }
    undo.push({
      tiles,
      text: `${showFrac(a.value)} ${op} ${showFrac(b.value)} = ${showFrac(result)}`,
    });
    tiles = [
      ...tiles.filter((_, i) => i !== first && i !== second),
      { id: Date.now() + undo.length, value: result },
    ];
    first = null;
    op = null;
    note = "";
    fb = null;
    if (tiles.length === 1) {
      if (tiles[0].value.d === 1 && tiles[0].value.n === TARGET) {
        settled = true;
        note = t("You made 24!");
        fb = {
          phase: phaseFor("make24", hints ? "right-after-miss" : "right"),
          ctx: { expected: undo.map((entry) => entry.text).join(" · ") },
        };
      } else {
        note = t("That makes {n}, not 24. Undo a move and try a different route.", {
          n: showFrac(tiles[0].value),
        });
        fb = { phase: phaseFor("make24", "miss"), ctx: { submitted: showFrac(tiles[0].value) } };
      }
    }
    render(settled ? null : "[data-undo]");
  }

  function nextRound() {
    round += 1;
    if (round >= total) {
      return finish({
        game: "make24",
        stars: starsFor(help),
        missed: [],
        line: help === 0 ? t("No hints needed") : t("{n} hint steps used", { n: help }),
      });
    }
    start();
  }

  host.onclick = (event) => {
    const action = feedbackAction(event);
    if (action === "next" && settled) return nextRound();
    if (action === "try-again") {
      fb = null;
      note = "";
      return render();
    }
    if (settled) return;
    const tile = event.target.closest("[data-t]");
    if (tile) {
      const i = Number(tile.dataset.t);
      if (first == null) first = i;
      else if (first === i) {
        first = null;
        op = null;
      } else if (op == null) {
        first = i;
      } else return combine(i);
      note = "";
      fb = null;
      return render(op == null ? `[data-t="${i}"]` : null);
    }
    const move = event.target.closest("[data-op]");
    if (move && first != null) {
      op = move.dataset.op;
      note = "";
      return render(`[data-t="${tiles.findIndex((_, i) => i !== first)}"]`);
    }
    if (event.target.closest("[data-undo]") && undo.length) {
      tiles = undo.pop().tiles;
      first = null;
      op = null;
      note = "";
      fb = null;
      return render("[data-t]");
    }
    if (event.target.closest("[data-restart]")) {
      const keep = hints;
      tiles = card.values.map((n, id) => ({ id, value: frac(n) }));
      undo = [];
      first = null;
      op = null;
      note = "";
      fb = null;
      hints = keep;
      return render("[data-t]");
    }
    if (event.target.closest("[data-hint]")) hint();
  };
  start();
  return () => {
    host.onclick = null;
  };
}
