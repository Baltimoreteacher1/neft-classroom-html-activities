// Language Studio Player — small UI pieces shared by the open-ended kinds.
import { h, tts } from "./studio-core.js";
import { icon } from "./studio-icons.js";

/** Round speaker button that reads `text()` aloud. */
export function speakButton(text, label, { rate = 0.9, className = "sh-speak" } = {}) {
  const btn = h(
    "button",
    { type: "button", class: className, "aria-label": label, title: label },
    icon("speaker", 20),
  );
  btn.addEventListener("click", async () => {
    btn.classList.add("is-live");
    await tts(typeof text === "function" ? text() : text, { rate });
    btn.classList.remove("is-live");
  });
  return btn;
}

/** A numbered step card that can be unlocked later. */
export function stepCard(number, title, body, { locked = false, hint = "" } = {}) {
  const card = h(
    "section",
    { class: "ow-step", "aria-label": title },
    h(
      "header",
      { class: "ow-step__head" },
      h("span", { class: "ow-step__num", "aria-hidden": "true" }, String(number)),
      h("h2", null, title),
    ),
    h("div", { class: "ow-step__body" }, body),
  );
  if (hint)
    card.querySelector(".ow-step__head").append(h("span", { class: "ow-step__hint" }, hint));
  card.hidden = locked;
  return card;
}

/** Self-check list of checkboxes. `onChange(checkedCount)` fires on every change. */
export function checklist(items, { saved = [], onChange } = {}) {
  const boxes = items.map((text, i) => {
    const input = h("input", {
      type: "checkbox",
      id: `ow-ck-${Math.random().toString(36).slice(2, 8)}-${i}`,
    });
    input.checked = !!saved[i];
    return {
      input,
      row: h(
        "li",
        { class: "ow-check" },
        h(
          "label",
          null,
          input,
          h("span", { class: "ow-check__box", "aria-hidden": "true" }, icon("check", 16)),
          h("span", null, text),
        ),
      ),
    };
  });
  const state = () => boxes.map((b) => b.input.checked);
  for (const { input } of boxes) input.addEventListener("change", () => onChange?.(state()));
  return {
    el: h(
      "ul",
      { class: "ow-checks" },
      boxes.map((b) => b.row),
    ),
    state,
  };
}

/** Insert `text` into a textarea/input at the caret, keeping focus. */
export function insertAtCaret(field, text) {
  const start = field.selectionStart ?? field.value.length;
  const end = field.selectionEnd ?? start;
  const before = field.value.slice(0, start);
  const lead = before && !/\s$/.test(before) ? " " : "";
  field.value = `${before}${lead}${text} ${field.value.slice(end)}`.replace(/ +$/, " ");
  const caret = before.length + lead.length + text.length + 1;
  field.focus();
  field.setSelectionRange(caret, caret);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}
