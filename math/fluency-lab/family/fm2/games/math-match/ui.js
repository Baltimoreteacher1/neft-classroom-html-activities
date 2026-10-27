// Math Match interaction: a memory board. Cards are real buttons; turning one over shows its face, two (or three) turned
// cards that disagree stay up until the learner presses "Got it", and matched sets stay face up. Hidden faces are not in
// the page at all (not even in the accessibility tree) until a card is turned. Arrow keys move between cards.
// @fm2 FM-008 FM-038 FM-039 FM-021 FM-037 FM-020
import { drawFace, GRAPHIC_TYPES } from "../../art/representations.js";
import { tx } from "../../lang.js";
import { UI } from "./copy.js";
import { cardKey, cardLabel } from "./logic.js";
import { RATIO_CTX } from "./reps.js";

const letter = (index) => String.fromCharCode(65 + index);

export function mount(root, ctx) {
  const { round } = ctx;
  let lang = ctx.lang;
  const size = round.setSize;
  const total = round.keys.length;
  const keys = round.cards.map(cardKey);
  const state = {
    up: [],
    groups: [],
    pending: false,
    done: false,
    shown: false,
    turns: 0,
    focus: 0,
  };
  const wide = round.cards.some(
    (card) => cardLabel(card, "en").length > 24 || cardLabel(card, "es").length > 28,
  );
  const groupOf = (id) => state.groups.findIndex((group) => group.includes(id));

  root.innerHTML = `<div class="mm-board" data-cards="${round.cards.length}" ${wide ? "data-wide" : ""}>
    <p class="mm-status" data-mm-status></p>
    <div class="mm-grid" role="group" data-mm-grid>${round.cards
      .map(
        (card) =>
          `<button type="button" class="mm-card" data-id="${card.id}" tabindex="${card.id === 0 ? 0 : -1}"><span class="mm-back" aria-hidden="true">${card.id + 1}</span><span class="mm-front" aria-hidden="true"></span></button>`,
      )
      .join("")}</div>
    <div class="mm-pending" data-mm-pending hidden><p data-mm-note></p><button type="button" class="fm2-btn fm2-btn-primary" data-mm-gotit></button></div>
  </div>`;
  const $ = (name) => root.querySelector(`[data-mm-${name}]`);
  const grid = $("grid");
  const buttons = [...grid.querySelectorAll(".mm-card")];

  const headings = (rep) =>
    rep.t === "ratiotable"
      ? [RATIO_CTX[rep.ctx].den[lang][1], RATIO_CTX[rep.ctx].num[lang][1]]
      : [];

  function paint(card) {
    const button = buttons[card.id];
    const id = card.id;
    const group = groupOf(id);
    const mode = state.shown
      ? "shown"
      : group >= 0
        ? "matched"
        : state.up.includes(id)
          ? "up"
          : "down";
    button.dataset.state = mode;
    button.setAttribute("aria-disabled", mode === "matched" || mode === "shown" ? "true" : "false");
    const front = button.querySelector(".mm-front");
    if (mode === "down") {
      front.innerHTML = "";
      button.setAttribute("aria-label", tx(UI.down, lang, { n: id + 1 }));
      return;
    }
    const face = cardLabel(card, lang);
    button.toggleAttribute("data-long", face.length > 16 && !GRAPHIC_TYPES.includes(card.rep.t));
    const mark = mode === "shown" ? letter(card.set) : mode === "matched" ? letter(group) : "";
    front.innerHTML = `${drawFace(card.rep, face, { uid: id, head: headings(card.rep) })}${mark ? `<span class="mm-badge">${mode === "matched" ? "✓ " : ""}${mark}</span>` : ""}`;
    const key = mode === "up" ? UI.up : mode === "matched" ? UI.matched : UI.shown;
    button.setAttribute("aria-label", tx(key, lang, { n: id + 1, face, set: mark }));
  }

  function paintStatus() {
    $("status").textContent = state.shown
      ? tx(UI.shownAll, lang)
      : tx(UI.progress, lang, { found: state.groups.length, total, turns: state.turns });
    grid.setAttribute("aria-label", tx(UI.group, lang));
    $("gotit").textContent = tx(UI.gotIt, lang);
    $("note").textContent = tx(UI.noMatch, lang);
    $("pending").hidden = !state.pending;
  }
  const refresh = () => {
    round.cards.forEach(paint);
    paintStatus();
  };

  const focusCard = (id) => {
    state.focus = id;
    buttons.forEach((button, i) => button.setAttribute("tabindex", i === id ? "0" : "-1"));
    buttons[id].focus();
  };

  function flip(id) {
    if (state.done || state.shown || state.pending || ctx.locked?.()) return;
    if (state.up.includes(id) || groupOf(id) >= 0) return;
    state.up.push(id);
    state.focus = id;
    paint(round.cards[id]);
    ctx.announce(tx(UI.flipped, lang, { n: id + 1, face: cardLabel(round.cards[id], lang) }));
    const first = keys[state.up[0]];
    if (state.up.some((up) => keys[up] !== first)) {
      state.pending = true;
      state.turns += 1;
      paintStatus();
      $("gotit").focus();
      ctx.submit({
        groups: state.groups.map((g) => [...g]),
        tried: [...state.up],
        turns: state.turns,
      });
      return;
    }
    if (state.up.length < size) return;
    state.groups.push([...state.up]);
    state.up.forEach((up) => paint(round.cards[up]));
    state.up = [];
    state.turns += 1;
    paintStatus();
    if (state.groups.length === total) {
      const result = ctx.submit({ groups: state.groups.map((g) => [...g]), turns: state.turns });
      state.done = Boolean(result?.correct);
    } else {
      ctx.announce(tx(UI.match, lang, { found: state.groups.length, total }));
    }
  }

  function gotIt() {
    if (!state.pending) return;
    const back = state.up;
    state.up = [];
    state.pending = false;
    back.forEach((id) => paint(round.cards[id]));
    paintStatus();
    ctx.announce(tx(UI.turnedBack, lang));
    focusCard(back[0]);
  }

  function showAll() {
    state.shown = true;
    state.pending = false;
    state.up = [];
    refresh();
  }

  function move(event) {
    const current = buttons.indexOf(document.activeElement);
    if (current < 0) return;
    const top = buttons[0].getBoundingClientRect().top;
    const columns = Math.max(
      1,
      buttons.filter((b) => Math.abs(b.getBoundingClientRect().top - top) < 4).length,
    );
    const target = {
      ArrowRight: current + 1,
      ArrowLeft: current - 1,
      ArrowDown: current + columns,
      ArrowUp: current - columns,
      Home: 0,
      End: buttons.length - 1,
    }[event.key];
    if (target === undefined || target < 0 || target >= buttons.length) return;
    event.preventDefault();
    focusCard(target);
  }

  const onClick = (event) => {
    const button = event.target.closest(".mm-card");
    if (button) {
      state.focus = Number(button.dataset.id);
      flip(state.focus);
    }
  };
  const onKey = (event) => {
    if (event.key === "Escape" && state.pending) gotIt();
    else move(event);
  };
  grid.addEventListener("click", onClick);
  grid.addEventListener("keydown", onKey);
  $("gotit").addEventListener("click", gotIt);
  $("pending").addEventListener("keydown", (event) => event.key === "Escape" && gotIt());

  // "Show me" ends the round from the shell without a submit from here; when the shell reveals Next unsolved, the
  // sets are shown (grouped by letter, so color is never the only cue).
  const next = root.closest("[data-fm2-shell]")?.querySelector("[data-fm2-next]");
  const watcher = next
    ? new MutationObserver(() => {
        if (!next.hidden && !state.done && !state.shown) showAll();
      })
    : null;
  watcher?.observe(next, { attributes: true, attributeFilter: ["hidden"] });

  refresh();
  return {
    destroy() {
      watcher?.disconnect();
      grid.removeEventListener("click", onClick);
      grid.removeEventListener("keydown", onKey);
      root.innerHTML = "";
    },
    setLang(to) {
      lang = to;
      refresh();
    },
  };
}
