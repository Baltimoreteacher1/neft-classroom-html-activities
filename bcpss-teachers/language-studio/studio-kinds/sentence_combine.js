// sentence_combine: join short sentences with a connector, then compare with one possible model and self-check.
import { announce, h, starsFor, wordCount } from "../studio-core.js";
import { icon } from "../studio-icons.js";
import { checklist, insertAtCaret, speakButton } from "../studio-ui.js";

export default function mount(root, ctx) {
  const items = ctx.payload.items;
  let i = 0;
  let usedFirstTry = 0;
  const stage = h("div", { class: "sc" });
  const dots = h("div", { class: "st-dots", role: "img" });
  root.append(dots, stage);

  const paintDots = (current, results) => {
    dots.setAttribute("aria-label", `Sentence ${current + 1} of ${items.length}`);
    dots.replaceChildren(
      ...items.map((_, k) =>
        h("span", {
          class: `st-dot${k === current ? " is-now" : ""}${results[k] === true ? " is-ok" : ""}`,
        }),
      ),
    );
  };
  const results = [];

  function show() {
    const it = items[i];
    paintDots(i, results);
    const connector = it.connector;
    const area = h("textarea", {
      class: "ow-area",
      rows: "3",
      "aria-label": "Your combined sentence",
      placeholder: "Write one sentence…",
    });
    const feedback = h("p", { class: "st-feedback", hidden: true, role: "status" });
    const submit = h(
      "button",
      { type: "button", class: "st-btn st-btn--primary st-btn--lg" },
      icon("check", 20),
      "Check my sentence",
    );
    const modelBox = h("div", { class: "sc-model", hidden: true });
    const nextBtn = h(
      "button",
      { type: "button", class: "st-btn st-btn--primary st-btn--lg", hidden: true },
      i + 1 < items.length ? "Next sentence" : "Finish",
    );
    let attempts = 0;
    const usesConnector = () => area.value.toLowerCase().includes(connector.toLowerCase());
    const reveal = () => {
      const ticks = checklist(
        [
          `I used "${connector}".`,
          "It starts with a capital letter and ends with a period.",
          "It still makes sense.",
        ],
        {},
      );
      modelBox.replaceChildren(
        h("p", { class: "sh-eyebrow" }, "One possible answer"),
        h("p", { class: "sc-model__text" }, it.model),
        h("div", { class: "ow-bar" }, speakButton(it.model, "Read the model aloud")),
        h(
          "p",
          { class: "ow-lead" },
          "Compare it with yours. More than one answer can be right. Self-check:",
        ),
        ticks.el,
      );
      modelBox.hidden = false;
      submit.hidden = true;
      nextBtn.hidden = false;
      area.readOnly = true;
      nextBtn.focus();
    };
    submit.addEventListener("click", () => {
      const n = wordCount(area.value);
      if (n < 4) {
        feedback.className = "st-feedback";
        feedback.textContent =
          "Write the whole sentence first. Use all the ideas from both short sentences.";
        feedback.hidden = false;
        return;
      }
      attempts += 1;
      const ok = usesConnector();
      if (attempts === 1) {
        results[i] = ok;
        if (ok) usedFirstTry += 1;
      }
      if (!ok && attempts < 2) {
        feedback.className = "st-feedback st-feedback--no";
        feedback.textContent = `Your sentence does not use "${connector}" yet. Tap the connector and try again.`;
        feedback.hidden = false;
        announce(feedback.textContent);
        return;
      }
      feedback.className = `st-feedback ${ok ? "st-feedback--ok" : ""}`;
      feedback.textContent = ok
        ? `You used "${connector}". Nice joining!`
        : `Look at how the model uses "${connector}".`;
      feedback.hidden = false;
      announce(feedback.textContent);
      reveal();
    });
    nextBtn.addEventListener("click", () => {
      i += 1;
      if (i < items.length) return show();
      paintDots(-1, results);
      ctx.done({
        stars: starsFor(items.length - usedFirstTry, items.length),
        detail: `You used the connector on the first try in ${usedFirstTry} of ${items.length} sentences.`,
      });
    });
    const chip = h(
      "button",
      {
        type: "button",
        class: "st-chip sc-conn",
        "aria-label": `Insert the connector ${connector}`,
        onclick: () => insertAtCaret(area, connector),
      },
      connector,
    );
    stage.replaceChildren(
      h(
        "div",
        { class: "st-card sc-card" },
        h(
          "div",
          { class: "sc-pair" },
          it.sentences.map((s, k) =>
            h("p", { class: "sc-sent" }, h("span", { class: "sc-sent__n" }, String(k + 1)), s),
          ),
        ),
        h("div", { class: "sc-plus" }, h("span", null, "Join them with"), chip),
        area,
        feedback,
        h("div", { class: "ow-bar" }, submit, nextBtn),
        modelBox,
      ),
    );
    area.focus({ preventScroll: true });
  }
  show();
}
