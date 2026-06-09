// Two-column "connect the pairs" matcher.
//
// Replaces the former flip-card *memory* game: every term and every match is
// visible the whole time, so students never have to recall information from a
// hidden card (or from a previous page). Tap a term, tap its match — correct
// pairs lock in; wrong tries give immediate feedback. Same data contract as
// before — { pairs:[{term, match}], columns, label, onComplete } — so all
// lessons keep working without any config changes.
let MG_STYLE_INJECTED = false;

function injectStyle() {
  if (MG_STYLE_INJECTED) return;
  MG_STYLE_INJECTED = true;
  const css = `
  .mg-board { display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-3, 12px); align-items:start; }
  .mg-col { display:flex; flex-direction:column; gap:var(--sp-2, 8px); }
  .mg-col-head { font-size:0.78rem; font-weight:800; letter-spacing:0.04em; text-transform:uppercase; color:var(--muted, #5b6773); margin:0 0 2px 2px; }
  .mg-item { width:100%; text-align:left; font:inherit; font-weight:700; font-size:1rem; line-height:1.3;
    min-height:54px; padding:12px 14px; border:2px solid var(--line, #d8dfdc); border-radius:var(--radius-md, 12px);
    background:var(--surface, #fff); color:var(--ink, #17202a); cursor:pointer; display:flex; align-items:center;
    transition:border-color .15s ease, background .15s ease, transform .12s ease, box-shadow .15s ease; }
  .mg-item:hover:not([data-matched]) { border-color:var(--teal, #0f766e); box-shadow:0 4px 14px rgba(15,118,110,0.14); }
  .mg-item:focus-visible { outline:3px solid rgba(15,118,110,0.35); outline-offset:2px; }
  .mg-item[data-selected] { border-color:var(--teal, #0f766e); background:var(--surface-soft, #eef4f3); transform:translateY(-1px); }
  .mg-item[data-matched] { border-color:var(--success, #16a34a); background:var(--success-bg, #e7f6ef); color:var(--success, #166534); cursor:default; }
  .mg-item[data-matched]::after { content:"✓"; margin-left:auto; font-weight:900; }
  .mg-item[data-wrong] { border-color:var(--danger, #dc2626); background:#fdeced; animation:mg-shake .32s ease; }
  @keyframes mg-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
  @media (max-width:520px){ .mg-board{ grid-template-columns:1fr 1fr; gap:8px; } .mg-item{ font-size:0.9rem; min-height:48px; padding:10px; } }
  @media (prefers-reduced-motion:reduce){ .mg-item{ transition:none } .mg-item[data-wrong]{ animation:none } }
  `;
  const style = document.createElement("style");
  style.dataset.mg = "matching-game";
  style.textContent = css;
  document.head.append(style);
}

export function renderMatchingGame(
  container,
  { pairs, columns, label, onComplete },
) {
  injectStyle();

  const wrapper = document.createElement("div");
  wrapper.className = "card";

  if (label) {
    const lbl = document.createElement("p");
    lbl.style.cssText =
      "font-size:1rem; font-weight:600; margin:0 0 var(--sp-3); line-height:1.5;";
    lbl.textContent = label;
    wrapper.append(lbl);
  }

  const hint = document.createElement("p");
  hint.style.cssText =
    "font-size:0.85rem; color:var(--muted); margin:0 0 var(--sp-3);";
  hint.textContent = "Tap an item on the left, then its match on the right.";
  wrapper.append(hint);

  const statsBar = document.createElement("div");
  statsBar.style.cssText =
    "display:flex; justify-content:space-between; margin-bottom:var(--sp-3); font-size:0.85rem; font-weight:700; color:var(--muted);";
  const matchCount = document.createElement("span");
  matchCount.textContent = `0 / ${pairs.length} matched`;
  const attempts = document.createElement("span");
  attempts.textContent = "Attempts: 0";
  statsBar.append(matchCount, attempts);
  wrapper.append(statsBar);

  // Left column keeps prompt order; right column is shuffled.
  const left = pairs.map((p, i) => ({ pairId: i, text: p.term, side: "L" }));
  const right = pairs.map((p, i) => ({ pairId: i, text: p.match, side: "R" }));
  for (let i = right.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [right[i], right[j]] = [right[j], right[i]];
  }

  const board = document.createElement("div");
  board.className = "mg-board";

  const matched = new Set();
  let attemptCount = 0;
  let selected = null; // { el, card }

  function makeColumn(items, headText) {
    const col = document.createElement("div");
    col.className = "mg-col";
    const head = document.createElement("p");
    head.className = "mg-col-head";
    head.textContent = headText;
    col.append(head);
    items.forEach((card) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "mg-item";
      el.textContent = card.text;
      el.addEventListener("click", () => pick(el, card));
      card.el = el;
      col.append(el);
    });
    return col;
  }

  function clearSelection() {
    if (selected) delete selected.el.dataset.selected;
    selected = null;
  }

  function pick(el, card) {
    if (el.dataset.matched) return;

    // First pick, or re-pick on the same side: just (re)select.
    if (!selected || selected.card.side === card.side) {
      clearSelection();
      selected = { el, card };
      el.dataset.selected = "1";
      return;
    }

    // Second pick on the opposite side → evaluate the pair.
    const a = selected;
    const b = { el, card };
    clearSelection();
    attemptCount++;
    attempts.textContent = `Attempts: ${attemptCount}`;

    if (a.card.pairId === b.card.pairId) {
      [a.el, b.el].forEach((node) => {
        node.dataset.matched = "1";
        delete node.dataset.selected;
      });
      matched.add(a.card.pairId);
      matchCount.textContent = `${matched.size} / ${pairs.length} matched`;
      if (matched.size === pairs.length) finishGame();
    } else {
      [a.el, b.el].forEach((node) => {
        node.dataset.wrong = "1";
        setTimeout(() => delete node.dataset.wrong, 360);
      });
    }
  }

  board.append(
    makeColumn(left, "Match these…"),
    makeColumn(right, "…with these"),
  );
  wrapper.append(board);

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  wrapper.append(feedbackSlot);

  function finishGame() {
    const efficiency = pairs.length / Math.max(attemptCount, 1);
    const stars = efficiency >= 0.9 ? 3 : efficiency >= 0.65 ? 2 : 1;
    showFb(
      feedbackSlot,
      "success",
      `All matched in ${attemptCount} attempt${attemptCount === 1 ? "" : "s"}! ${
        stars === 3
          ? "Flawless!"
          : stars === 2
            ? "Nice work!"
            : "Keep practicing!"
      }`,
    );
    if (onComplete) onComplete(pairs.length, attemptCount);
  }

  // `columns` is accepted for backward compatibility; the two-column matcher
  // ignores it intentionally.
  void columns;

  container.append(wrapper);
}

function showFb(slot, type, msg) {
  const fb = document.createElement("div");
  fb.className = `feedback feedback-${type} visible`;
  fb.setAttribute("role", "alert");
  fb.innerHTML = `<span class="feedback-icon">${type === "success" ? "✓" : "💡"}</span><span>${msg}</span>`;
  slot.innerHTML = "";
  slot.append(fb);
}
