// write_scaffold: prompt, labeled frame boxes, word bank, checklist, live count, read aloud, model after ~15 words, copy/print.
import { announce, copyText, h, tts, wordCount } from "../studio-core.js";
import { icon } from "../studio-icons.js";
import { checklist, insertAtCaret } from "../studio-ui.js";

const MODEL_UNLOCK = 15;

export default function mount(root, ctx) {
  const p = ctx.payload;
  const saved = ctx.loadState() || {};
  const parts = saved.parts || p.structure.map(() => "");
  let focused = null;

  const boxes = p.structure.map((s, i) => {
    const area = h("textarea", {
      class: "ow-area",
      rows: "3",
      id: `ws-${i}`,
      "aria-describedby": `ws-f-${i}`,
    });
    area.value = parts[i] || "";
    area.addEventListener("focus", () => {
      focused = area;
    });
    area.addEventListener("input", () => {
      parts[i] = area.value;
      ctx.saveState({ parts });
      refresh();
    });
    return {
      area,
      el: h(
        "div",
        { class: "ws-box" },
        h("label", { for: area.id }, h("span", { class: "ws-box__part" }, s.part)),
        h("p", { class: "ws-box__frame", id: `ws-f-${i}` }, s.frame),
        area,
      ),
    };
  });
  focused = boxes[0].area;

  const count = h("span", { class: "ow-count", "aria-live": "polite" });
  const modelBtn = h(
    "button",
    { type: "button", class: "st-btn", disabled: true },
    icon("eye", 18),
    "Show a model",
  );
  const model = h(
    "div",
    { class: "ws-model", hidden: true },
    h("p", { class: "sh-eyebrow" }, "A strong example"),
    h("p", null, p.model),
  );
  const hint = h("p", { class: "ow-hint" });
  const finish = h(
    "button",
    { type: "button", class: "st-btn st-btn--primary st-btn--lg", disabled: true },
    "I'm done",
  );
  const total = () => parts.reduce((n, t) => n + wordCount(t), 0);
  const joined = () =>
    parts
      .map((t) => t.trim())
      .filter(Boolean)
      .join(" ");
  const list = checklist(p.checklist, {
    saved: saved.checks || [],
    onChange: (s) => ctx.saveState({ parts, checks: s }),
  });

  function refresh() {
    const n = total();
    count.textContent = `${n} word${n === 1 ? "" : "s"}`;
    modelBtn.disabled = n < MODEL_UNLOCK;
    finish.disabled = n < MODEL_UNLOCK;
    hint.textContent =
      n < MODEL_UNLOCK ? `Write at least ${MODEL_UNLOCK} words to unlock a model and finish.` : "";
  }
  modelBtn.addEventListener("click", () => {
    model.hidden = !model.hidden;
    modelBtn.lastChild.textContent = model.hidden ? "Show a model" : "Hide the model";
  });

  const bank = h(
    "div",
    { class: "ws-bank" },
    h("p", { class: "ig-label" }, "Word bank — tap to add"),
    h(
      "div",
      { class: "ow-chips" },
      p.word_bank.map((w) =>
        h(
          "button",
          { type: "button", class: "st-chip", onclick: () => insertAtCaret(focused, w) },
          w,
        ),
      ),
    ),
  );

  const readBtn = h(
    "button",
    { type: "button", class: "st-btn" },
    icon("speaker", 18),
    "Read aloud",
  );
  readBtn.addEventListener("click", async () => {
    if (!joined()) return announce("Write something first, then listen to it.");
    readBtn.disabled = true;
    await tts(joined(), { rate: 0.9 });
    readBtn.disabled = false;
  });
  const copyBtn = h("button", { type: "button", class: "st-btn" }, icon("book", 18), "Copy");
  copyBtn.addEventListener("click", async () =>
    announce(
      (await copyText(joined())) ? "Copied." : "Copy did not work. Select the text and copy it.",
    ),
  );
  const printBtn = h(
    "button",
    { type: "button", class: "st-btn" },
    icon("print", 18),
    "Print my writing",
  );
  printBtn.addEventListener("click", () => {
    const area = h(
      "div",
      { id: "stPrintArea" },
      h("h1", null, ctx.activity.title),
      h("p", null, h("b", null, ctx.activity.mission)),
      ...parts
        .filter((t) => t.trim())
        .map((t, i) => h("p", null, h("b", null, `${p.structure[i].part}: `), t)),
    );
    document.body.append(area);
    document.body.classList.add("st-print-writing");
    const cleanup = () => {
      document.body.classList.remove("st-print-writing");
      area.remove();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  });

  finish.addEventListener("click", () => {
    const ticked = list.state().filter(Boolean).length;
    const ratio = ticked / p.checklist.length;
    ctx.done({
      stars: ratio === 1 ? 3 : ratio >= 0.5 ? 2 : 1,
      detail: `You wrote ${total()} words and checked ${ticked} of ${p.checklist.length} things.`,
    });
  });

  root.append(
    h(
      "div",
      { class: "ws" },
      h(
        "div",
        { class: "ws-prompt st-card st-card--flat" },
        h("span", { class: "sh-eyebrow" }, "Your task"),
        h("p", null, p.prompt),
      ),
      h(
        "div",
        { class: "ws-grid" },
        h(
          "div",
          { class: "ws-main" },
          boxes.map((b) => b.el),
          h("div", { class: "ow-bar" }, count, readBtn, copyBtn, printBtn),
        ),
        h(
          "aside",
          { class: "ws-side" },
          bank,
          h(
            "div",
            { class: "ws-check st-card st-card--flat" },
            h("p", { class: "ig-label" }, "Check your writing"),
            list.el,
          ),
        ),
      ),
      h("div", { class: "ow-bar ws-end" }, modelBtn, finish),
      hint,
      model,
    ),
  );
  refresh();
}
