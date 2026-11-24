// flash_retrieval — spaced retrieval. See the prompt, say the answer out loud, reveal it, then self-rate.
// "Not yet" cards come back once at the end of the pile. Nothing is scored.
import { h } from "./_kit.js";
import { iconNode, slBtn, startKind } from "./_audio.js";

export default function mount(root, ctx) {
  const kit = startKind(root, ctx, "flash_retrieval");
  const { cards } = ctx.payload;
  const queue = cards.map((_, i) => i);
  const again = new Set(); // cards already given a second look
  let pos = 0;

  const dots = kit.dots(queue.length, "Card progress");
  const stage = h("div", { class: "sl-stage" });
  root.append(h("div", { class: "sg-topbar" }, dots.el), stage);

  function show() {
    const idx = queue[pos];
    const card = cards[idx];
    dots.resize(queue.length);
    queue.forEach((_, k) => dots.set(k, k < pos ? "ok" : k === pos ? "now" : ""));
    const label = `Card ${pos + 1} of ${queue.length}${pos >= cards.length ? ", another look" : ""}`;
    dots.label(label);
    const fb = kit.feedback("Say your answer out loud. Then press Show answer.");
    const answer = h("p", { class: "sl-answer", id: "slAnswer", tabindex: "-1", hidden: true }, h("b", { text: "Answer: " }), card.answer);
    const ratings = h("div", { class: "sl-ratings", role: "group", "aria-label": "How did it go?", hidden: true });
    const reveal = slBtn("Show answer", { primary: true, key: "reveal" });
    reveal.setAttribute("aria-expanded", "false");
    reveal.setAttribute("aria-controls", "slAnswer");
    reveal.addEventListener("click", () => {
      answer.hidden = false;
      ratings.hidden = false;
      reveal.hidden = true;
      fb.set("Was your answer close to this one?", "hint");
      answer.focus({ preventScroll: true });
    });
    const rate = (gotIt) => {
      if (!gotIt && !again.has(idx)) {
        again.add(idx);
        queue.push(idx);
        ctx.announce("Not yet. This card comes back at the end.");
      } else ctx.announce(gotIt ? "Got it." : "Not yet. We will practice it again later.");
      pos++;
      if (pos >= queue.length) return summary();
      show();
    };
    ratings.append(
      slBtn("Got it", { primary: true, key: "got", onclick: () => rate(true) }),
      slBtn("Not yet", { key: "not", onclick: () => rate(false) }),
    );
    const heading = h("h3", { class: "sl-card__prompt", tabindex: "-1", "data-focus": "", text: card.prompt });
    stage.replaceChildren(
      h("p", { class: "sl-count", text: label }),
      h("div", { class: "sl-card" }, iconNode(card.icon, "sl-icon sl-icon--big"), heading, kit.speakBtn(card.prompt, "Listen to the question"), answer),
      fb.el,
      h("div", { class: "sg-actions" }, reveal, ratings),
    );
    heading.focus({ preventScroll: true });
  }

  function summary() {
    dots.resize(queue.length);
    queue.forEach((_, k) => dots.set(k, "ok"));
    const second = again.size;
    const msg = second
      ? `You practiced ${cards.length} cards. ${second} ${second === 1 ? "card" : "cards"} got a second look. That is how remembering grows.`
      : `You practiced ${cards.length} cards and remembered them all. Nice work.`;
    const done = slBtn("Finish", { primary: true, key: "finish", onclick: () => kit.finish(0, cards.length, `You practiced ${cards.length} cards`) });
    stage.replaceChildren(h("p", { class: "sl-summary", tabindex: "-1", "data-focus": "", text: msg }), h("div", { class: "sg-actions" }, done));
    ctx.announce(msg);
    stage.querySelector("[data-focus]")?.focus({ preventScroll: true });
  }

  show();
  return () => kit.destroy();
}
