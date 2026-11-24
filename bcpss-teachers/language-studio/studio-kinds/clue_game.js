// clue_game — flip clues one at a time and guess the mystery word. Fewer clues = more points. No clock.
import { createKit, h, withFocus } from "./_kit.js";

export default function mount(root, ctx) {
  const kit = createKit(root, ctx, "clue_game");
  const cards = ctx.shuffle(ctx.payload.cards, `${kit.seed}:deck`);
  const bank = [...new Set(ctx.payload.cards.map((c) => c.term))].sort((a, b) =>
    a.localeCompare(b),
  );
  const maxPoints = cards.length * 3;
  let idx = 0;
  let shown = 1;
  let total = 0;
  let wrong = new Set();
  let solved = false;
  let earned = 0;

  const dots = kit.dots(cards.length, "Cards");
  const score = h("p", { class: "sg-score", "aria-live": "off" });
  const worth = h("p", { class: "sg-worth" });
  const clueList = h("ol", { class: "sg-clues" });
  const more = h("button", {
    type: "button",
    class: "st-btn",
    "data-key": "more",
    text: "Show another clue",
  });
  const next = h("button", {
    type: "button",
    class: "st-btn st-btn--primary st-btn--lg sg-next",
    "data-key": "next",
  });
  const bankEl = h("div", {
    class: "sg-bank",
    role: "group",
    "aria-label": "Word bank: tap your guess",
  });
  const stage = h("div", { class: "sg-mystery" });
  const fb = kit.feedback("Read the clue, then pick your guess from the word bank.");

  more.addEventListener("click", () => {
    if (solved || shown >= 3) return;
    shown++;
    render();
    fb.set(
      `Clue ${shown}. This card is now worth ${4 - shown} ${4 - shown === 1 ? "point" : "points"}.`,
    );
  });
  next.addEventListener("click", () => {
    if (idx + 1 >= cards.length) {
      const stars = total >= maxPoints * 0.7 ? 3 : total >= maxPoints * 0.45 ? 2 : 1;
      ctx.done({ stars, detail: `${total} of ${maxPoints} points` });
      return;
    }
    idx++;
    shown = 1;
    wrong = new Set();
    solved = false;
    render();
    clueList.querySelector("li")?.focus();
    fb.set("");
  });

  function guess(term) {
    if (solved || wrong.has(term)) return;
    const card = cards[idx];
    if (term === card.term) {
      solved = true;
      earned = 4 - shown;
      total += earned;
      render();
      kit.fx(stage, "sg-pop");
      fb.set(
        `It's "${card.term}"! You earned ${earned} ${earned === 1 ? "point" : "points"}.`,
        "ok",
      );
      return;
    }
    wrong.add(term);
    if (shown < 3) {
      shown++;
      fb.set(`Not "${term}". Here is another clue.`, "no");
    } else fb.set(`Not "${term}". Read the clues once more and try another word.`, "no");
    render();
    kit.fx(bankEl.querySelector(`[data-term="${CSS.escape(term)}"]`), "sg-shake");
  }

  function render() {
    withFocus(root, () => {
      const card = cards[idx];
      cards.forEach((_, i) =>
        dots.set(i, i < idx || (i === idx && solved) ? "ok" : i === idx ? "now" : ""),
      );
      dots.label(`Card ${idx + 1} of ${cards.length}`);
      score.textContent = `Points: ${total}`;
      worth.textContent = solved
        ? `You earned ${earned} ${earned === 1 ? "point" : "points"} on this card.`
        : `Worth ${4 - shown} ${4 - shown === 1 ? "point" : "points"} right now`;
      worth.classList.toggle("is-low", !solved && shown === 3);
      clueList.replaceChildren(
        ...card.clues.map((clue, i) => {
          const open = i < shown;
          const li = h(
            "li",
            {
              class: `sg-clue${open ? " is-open" : ""}${open && i === shown - 1 && !solved ? " is-new" : ""}`,
              tabindex: open ? "0" : null,
            },
            h("span", { class: "sg-clue__n", "aria-hidden": "true", text: String(i + 1) }),
            h("span", { class: "sg-clue__text", text: open ? clue : `Clue ${i + 1} is hidden` }),
            open ? kit.speakBtn(clue, `Listen to clue ${i + 1}`) : null,
          );
          return li;
        }),
      );
      more.hidden = solved || shown >= 3;
      next.hidden = !solved;
      next.textContent = idx + 1 >= cards.length ? "See my score" : "Next card";
      stage.classList.toggle("is-solved", solved);
      bankEl.replaceChildren(
        ...bank.map((term) => {
          const ico = ctx.vocabIcon(term);
          const off = wrong.has(term);
          const right = solved && term === card.term;
          const b = h(
            "button",
            {
              type: "button",
              class: `st-chip sg-chip${right ? " st-chip--ok" : off ? " st-chip--no" : ""}`,
              "data-term": term,
              "data-key": `t-${term}`,
              "aria-disabled": off || solved ? "true" : null,
              "aria-label": off ? `${term}, not this one` : term,
            },
            ico ? h("span", { "aria-hidden": "true", text: ico }) : null,
            term,
          );
          b.addEventListener("click", () => guess(term));
          return b;
        }),
      );
      bankEl.classList.toggle("is-locked", solved);
    });
  }

  stage.append(
    h(
      "div",
      { class: "sg-mystery__top" },
      h("span", { class: "sg-mystery__tag", text: "Mystery word" }),
      worth,
    ),
    clueList,
    h("div", { class: "sg-actions" }, more),
  );
  root.append(
    h("div", { class: "sg-topbar" }, dots.el, score),
    stage,
    bankEl,
    h("div", { class: "sg-actions sg-actions--end" }, next),
  );
  render();
  kit.dock(fb.el);
  return () => kit.destroy();
}
