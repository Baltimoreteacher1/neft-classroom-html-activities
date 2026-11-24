// point_and_say — newcomer, no reading needed. A big picture and audio; the student points, says it, then confirms.
import { h } from "./_kit.js";
import { iconNode, listenControls, speakWithHighlight, startKind, stepThrough } from "./_audio.js";

export default function mount(root, ctx) {
  const kit = startKind(root, ctx, "point_and_say");
  return stepThrough(root, ctx, kit, {
    items: ctx.payload.items,
    noun: "word",
    confirmLabel: "I said it",
    praise: (it) => `Great! You said “${it.term}” out loud.`,
    detail: (n) => `You pointed and said ${n} ${n === 1 ? "word" : "words"} out loud`,
    render(it) {
      const caption = h("p", { class: "sl-caption", text: it.say });
      const picture = h("div", { class: "sl-picture", role: "img", "aria-label": `${it.term}. ${it.cue || ""}`.trim() }, iconNode(it.icon, "sl-icon sl-icon--huge"));
      const word = h("button", { type: "button", class: "sl-word-btn st-btn", "aria-label": `Hear the word: ${it.term}` }, h("span", { class: "sl-word-btn__text", text: it.term }));
      word.addEventListener("click", () => speakWithHighlight(it.term, null));
      return h(
        "div",
        { class: "sl-card sl-card--newcomer" },
        picture,
        h("h3", { class: "sl-term", tabindex: "-1", "data-focus": "", "aria-label": `Point to the picture for ${it.term}` }, word),
        it.es ? h("p", { class: "sl-es" }, h("span", { class: "sl-es__label", text: "In Spanish: " }), h("span", { lang: "es", text: it.es })) : null,
        listenControls(it.say, caption, { label: "sentence" }).el,
        caption,
        it.cue ? h("p", { class: "sl-cue", text: it.cue }) : null,
        h("p", { class: "sl-steps", text: "1. Point to the picture.  2. Listen.  3. Say it." }),
      );
    },
  });
}
