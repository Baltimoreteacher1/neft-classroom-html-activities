// cognate_detective — sort English/Spanish word pairs into True cognate, False friend, or No look-alike.
// Each word has a Listen button (English or Spanish voice); choiceStage checks the answer and shows why.
import { h } from "./_kit.js";
import { RATE, audioAvailable, choiceStage, slBtn, speakWithHighlight, startKind } from "./_audio.js";

const OPTIONS = [
  { id: "true", label: "True cognate: looks alike and means the same", icon: "🤝" },
  { id: "false_friend", label: "False friend: looks alike, different meaning", icon: "⚠️" },
  { id: "none", label: "No look-alike: the two words look different", icon: "🔍" },
];

const hear = (text, lang, label, key) =>
  audioAvailable()
    ? slBtn("Listen", {
        icon: "speaker",
        ghost: true,
        key,
        label,
        onclick: () => speakWithHighlight(text, null, { rate: RATE.normal, lang }),
      })
    : null;

export default function mount(root, ctx) {
  const kit = startKind(root, ctx, "cognate_detective");
  const { items } = ctx.payload;
  let pos = 0;
  let missed = 0;

  const dots = kit.dots(items.length, "Pair progress");
  const stage = h("div", { class: "sl-stage" });
  root.append(h("div", { class: "sg-topbar" }, dots.el), stage);

  function show() {
    const it = items[pos];
    items.forEach((_, k) => dots.set(k, k < pos ? "ok" : k === pos ? "now" : ""));
    dots.label(`Pair ${pos + 1} of ${items.length}`);
    const ansIdx = Math.max(
      0,
      OPTIONS.findIndex((o) => o.id === it.status),
    );
    const prompt = h("h3", {
      class: "sl-prompt",
      tabindex: "-1",
      "data-focus": "",
      text: "Are these two words true cognates, false friends, or not look-alikes?",
    });
    const pair = h(
      "div",
      { class: "sl-pair" },
      h(
        "div",
        { class: "sl-pair__side" },
        h("p", { class: "sl-pair__label", text: "English" }),
        h("p", { class: "sl-pair__word", lang: "en", text: it.term }),
        hear(it.term, "en-US", `Listen to the English word: ${it.term}`, "en"),
      ),
      h(
        "div",
        { class: "sl-pair__side" },
        h("p", { class: "sl-pair__label", text: "Spanish (español)" }),
        h("p", { class: "sl-pair__word", lang: "es", text: it.es }),
        hear(it.es, "es-US", `Listen to the Spanish word: ${it.es}`, "es"),
      ),
    );
    const choice = choiceStage(kit, {
      options: OPTIONS.map((o) => ({ label: o.label, icon: o.icon })),
      answer: ansIdx,
      why: it.why,
      hint: true,
      label: `Sort "${it.term}" and "${it.es}"`,
      retry:
        "Not this one yet. Look closely at the spelling and think about what each word means, then try another choice.",
      nextLabel: pos + 1 >= items.length ? "Finish" : "Next",
      onNext: ({ wrong }) => {
        if (wrong) missed++;
        if (pos + 1 >= items.length) {
          return kit.finish(
            missed,
            items.length,
            `${items.length - missed} of ${items.length} word pairs sorted on the first try`,
          );
        }
        pos++;
        show();
      },
    });
    stage.replaceChildren(
      h("p", { class: "sl-count", text: `Pair ${pos + 1} of ${items.length}` }),
      prompt,
      pair,
      choice.el,
    );
    prompt.focus({ preventScroll: true });
  }

  show();
  return () => kit.destroy();
}
