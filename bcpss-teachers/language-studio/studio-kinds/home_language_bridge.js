// home_language_bridge — newcomer: say the word in English and in your home language. The note shows
// how the two words are alike or different. Spanish is read aloud with a Spanish voice when one exists.
import { h } from "./_kit.js";
import { RATE, audioAvailable, slBtn, speakWithHighlight, startKind, stepThrough } from "./_audio.js";

const hear = (text, lang, label, key) =>
  audioAvailable()
    ? slBtn("Listen", { icon: "speaker", ghost: true, key, label, onclick: () => speakWithHighlight(text, null, { rate: RATE.normal, lang }) })
    : null;

export default function mount(root, ctx) {
  const kit = startKind(root, ctx, "home_language_bridge");
  return stepThrough(root, ctx, kit, {
    items: ctx.payload.items,
    noun: "word",
    confirmLabel: "I said it both ways",
    praise: (it) => `Wonderful! “${it.term}” and “${it.es}” are both yours.`,
    detail: (n) => `You said ${n} ${n === 1 ? "word" : "words"} in English and in your home language`,
    render(it) {
      return h(
        "div",
        { class: "sl-card sl-card--newcomer" },
        h("h3", { class: "sl-term", tabindex: "-1", "data-focus": "", text: "Say it two ways." }),
        h(
          "div",
          { class: "sl-pair" },
          h("div", { class: "sl-pair__side" }, h("p", { class: "sl-pair__label", text: "English" }), h("p", { class: "sl-pair__word", lang: "en", text: it.term }), hear(it.term, "en-US", `Listen to the English word: ${it.term}`, "en")),
          h("div", { class: "sl-pair__side" }, h("p", { class: "sl-pair__label", text: "Spanish (español)" }), h("p", { class: "sl-pair__word", lang: "es", text: it.es }), hear(it.es, "es-US", `Listen to the Spanish word: ${it.es}`, "es")),
        ),
        it.note ? h("p", { class: "sl-note sl-note--bridge", text: it.note }) : null,
        h("p", { class: "sl-steps", text: "Say it in English. Then say it in your home language." }),
      );
    },
  });
}
