// talk_cards: a deck of conversation cards, whose-turn roles, talk-moves tray, shuffle, discussed counter.
import { announce, h, reducedMotion } from "../studio-core.js";
import { icon } from "../studio-icons.js";
import { speakButton } from "../studio-ui.js";
import { hintLadder } from "./_kit.js";

export default function mount(root, ctx) {
  const p = ctx.payload;
  const total = p.cards.length;
  let order = ctx.shuffle(
    p.cards.map((_, i) => i),
    `${ctx.activity.title}-0`,
  );
  let pos = -1; // -1 = nobody has drawn yet
  let explainer = 0; // 0 = Partner 1 explains, 1 = Partner 2
  let discussed = 0;
  let round = 0;

  const turn = h("div", { class: "tc-turn", role: "status", "aria-live": "polite" });
  const names = ["Partner 1", "Partner 2"];
  const paintTurn = () => {
    turn.replaceChildren(
      ...[explainer, 1 - explainer].map((who, i) =>
        h(
          "p",
          { class: `tc-role${i === 0 ? " is-explainer" : ""}` },
          h("span", { class: "tc-role__who" }, names[who]),
          h("span", { class: "tc-role__job" }, i === 0 ? p.roles.a : p.roles.b),
        ),
      ),
    );
  };

  const card = h("div", { class: "tc-card", "data-state": "deck" });
  const counter = h("p", { class: "tc-count" });
  const drawBtn = h(
    "button",
    { type: "button", class: "st-btn st-btn--primary st-btn--lg" },
    icon("cards", 20),
    "Draw a card",
  );
  const swapBtn = h("button", { type: "button", class: "st-btn" }, icon("flip", 18), "Swap roles");
  const shuffleBtn = h(
    "button",
    { type: "button", class: "st-btn st-btn--ghost" },
    icon("shuffle", 18),
    "Shuffle deck",
  );
  const doneBtn = h(
    "button",
    { type: "button", class: "st-btn st-btn--primary", hidden: true },
    "We're done",
  );

  const paintCounter = () => {
    counter.textContent = `${discussed} of ${total} cards talked about`;
    doneBtn.hidden = discussed < Math.min(3, total);
  };
  const face = () => {
    if (pos < 0) {
      card.dataset.state = "deck";
      card.replaceChildren(
        h(
          "div",
          { class: "tc-deck" },
          h("span", { class: "tc-deck__stack", "aria-hidden": "true" }),
          h("p", null, "Tap Draw a card to start your conversation."),
        ),
      );
      return;
    }
    const c = p.cards[order[pos]];
    card.dataset.state = "open";
    card.classList.remove("is-flipping");
    if (!reducedMotion()) void card.offsetWidth;
    card.classList.add("is-flipping");
    card.replaceChildren(
      h("p", { class: "ow-count" }, `Card ${(pos % total) + 1} of ${total}`),
      h("h2", { class: "tc-prompt" }, c.prompt),
      h(
        "div",
        { class: "tc-starter" },
        h("span", null, `${p.roles.a} starts`),
        h("p", null, c.starter),
        speakButton(c.starter.replace(/_{2,}/g, "blank"), "Read the sentence starter aloud"),
      ),
      h(
        "div",
        { class: "tc-follow" },
        h("span", null, `${p.roles.b} asks`),
        h("p", null, c.follow_up),
      ),
    );
  };

  // About the card on the table now; talk has no single right answer, so these only help a partner start and keep going.
  const hints = hintLadder(ctx, () => {
    const c = pos >= 0 ? p.cards[order[pos]] : null;
    const move = p.moves[0];
    return c
      ? [
          `Read the card out loud together: “${c.prompt}” What is it really asking?`,
          `${p.roles.a} starts. Finish the starter in your own words: “${c.starter}”`,
          `${p.roles.b} asks: “${c.follow_up}” Then try a talk move: ${move.label}, “${move.stem}”`,
        ]
      : [
          "Tap “Draw a card” to start. Then ask for a hint about your card.",
          `Each card has a starter. ${p.roles.a} finishes it in their own words.`,
          `Talk moves help you keep going: ${p.moves.map((m) => m.label).join(", ")}.`,
        ];
  });

  let drawn = 0;
  const draw = () => {
    hints.reset();
    pos += 1;
    if (pos >= total) {
      round += 1;
      pos = 0;
      order = ctx.shuffle(order, `${ctx.activity.title}-${round}`);
    }
    if (drawn > 0) explainer = 1 - explainer;
    drawn += 1;
    discussed = Math.min(total, drawn);
    face();
    paintTurn();
    paintCounter();
    drawBtn.lastChild.textContent = "Next card";
    announce(`${p.roles[explainer === 0 ? "a" : "b"]}: ${names[explainer]} goes first.`);
  };
  drawBtn.addEventListener("click", draw);
  swapBtn.addEventListener("click", () => {
    explainer = 1 - explainer;
    paintTurn();
    announce("Roles swapped.");
  });
  shuffleBtn.addEventListener("click", () => {
    round += 1;
    order = ctx.shuffle(order, `${ctx.activity.title}-${round}`);
    pos = -1;
    drawBtn.lastChild.textContent = "Draw a card";
    face();
    announce("Deck shuffled.");
  });
  doneBtn.addEventListener("click", () => {
    const stars = discussed >= total ? 3 : discussed >= Math.ceil(total * 0.6) ? 2 : 1;
    ctx.done({ stars, detail: `You talked about ${discussed} of ${total} cards.` });
  });

  const moves = h(
    "div",
    { class: "tc-moves" },
    h("p", { class: "ig-label" }, "Talk moves — tap to hear one"),
    h(
      "div",
      { class: "tc-moves__row" },
      p.moves.map((m) =>
        h(
          "button",
          {
            type: "button",
            class: "tc-move",
            onclick: () => ctx.tts(m.stem.replace(/_{2,}/g, "blank"), { rate: 0.9 }),
          },
          h("b", null, m.label),
          h("span", null, m.stem),
        ),
      ),
    ),
  );

  paintTurn();
  face();
  paintCounter();
  root.append(
    h(
      "div",
      { class: "tc" },
      turn,
      card,
      h("div", { class: "tc-actions" }, drawBtn, swapBtn, shuffleBtn),
      hints,
      counter,
      doneBtn,
      moves,
    ),
  );
}
