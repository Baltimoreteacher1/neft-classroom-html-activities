// listen_and_show — hear a sentence, tap what it describes. Audio first (never autoplays); the text appears
// after the first listen. Wrong picks nudge; the "why" shows after the right pick. A hint button removes one choice.
import { h } from "./_kit.js";
import { choiceStage, listenControls, startKind } from "./_audio.js";

export default function mount(root, ctx) {
  const kit = startKind(root, ctx, "listen_and_show");
  const { items } = ctx.payload;
  let pos = 0;
  let missed = 0;

  const dots = kit.dots(items.length, "Progress");
  const stage = h("div", { class: "sl-stage" });
  root.append(h("div", { class: "sg-topbar" }, dots.el), stage);

  function show() {
    const it = items[pos];
    items.forEach((_, k) => dots.set(k, k < pos ? "ok" : k === pos ? "now" : ""));
    dots.label(`Sentence ${pos + 1} of ${items.length}`);
    let heard = false;
    const caption = h("p", { class: "sl-caption", id: "slCaption", hidden: true, text: it.say });
    const listen = listenControls(it.say, caption, {
      label: "sentence",
      onHeard: () => {
        heard = true;
        caption.hidden = false;
      },
    });
    const prompt = h("h3", { class: "sl-prompt", tabindex: "-1", "data-focus": "", text: "Listen. Then tap what the sentence is about." });
    const choice = choiceStage(kit, {
      options: it.options,
      answer: it.answer,
      why: it.why,
      hint: true,
      label: "What is the sentence about?",
      retry: "Not this one yet. Listen again, slowly if you like, then try another choice.",
      gate: () => (heard ? "" : "Press Listen first, then choose."),
      nextLabel: pos + 1 >= items.length ? "Finish" : "Next",
      onNext: ({ wrong }) => {
        if (wrong) missed++;
        if (pos + 1 >= items.length) {
          return kit.finish(missed, items.length, `${items.length - missed} of ${items.length} right on the first try`);
        }
        pos++;
        show();
      },
    });
    stage.replaceChildren(h("p", { class: "sl-count", text: `Sentence ${pos + 1} of ${items.length}` }), prompt, listen.el, caption, choice.el);
    prompt.focus({ preventScroll: true });
  }

  show();
  return () => kit.destroy();
}
