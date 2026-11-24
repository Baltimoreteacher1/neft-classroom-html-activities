// paragraph_builder — KLU organizer (slots with frames + connector chips) that joins into a paragraph.
// Includes self-check checkboxes, live word count, read-aloud, and a model paragraph. Everything stays on device.
import { wordCount } from "../studio-core.js";
import { insertAtCaret } from "../studio-ui.js";
import { h } from "./_kit.js";
import { listenControls, slBtn, speakWithHighlight, startKind } from "./_audio.js";

export default function mount(root, ctx) {
  const kit = startKind(root, ctx, "paragraph_builder");
  const { klu, slots, connectors, checklist, model } = ctx.payload;
  const saved = ctx.loadState?.() || {};
  const values = Array.isArray(saved.values) && saved.values.length === slots.length
    ? [...saved.values]
    : slots.map(() => "");
  const checked = new Set(Array.isArray(saved.checked) ? saved.checked : []);
  let activeField = null;

  const fb = kit.feedback(`Fill each part of your ${klu} paragraph, then read it out loud.`);
  const preview = h("p", { class: "sl-caption", id: "slParaPreview" });
  const count = h("p", { class: "sl-note", id: "slParaCount" });
  const finish = slBtn("Finish", { primary: true, key: "finish", disabled: true });

  const save = () => ctx.saveState?.({ values, checked: [...checked] });
  const joined = () =>
    values
      .map((v) => String(v || "").trim())
      .filter(Boolean)
      .join(" ");

  function refresh() {
    const text = joined();
    const words = wordCount(text);
    const filledCount = values.filter((v) => String(v || "").trim().length > 0).length;
    preview.textContent = text || "Your paragraph will appear here as you type in each part.";
    count.textContent = `${filledCount} of ${slots.length} parts filled · ${words} ${words === 1 ? "word" : "words"}`;
    finish.disabled = filledCount === 0;
  }

  const slotCards = slots.map((s, i) => {
    const id = `slSlotArea${i}`;
    const frameId = `slSlotFrame${i}`;
    const starter = String(s.frame || "").replace(/\s*(?:___|\[[^\]]+\]).*$/, "").trim();
    const area = h("textarea", {
      class: "ow-area",
      rows: "2",
      id,
      "data-key": `slot${i}`,
      "aria-describedby": frameId,
      placeholder: s.frame,
    });
    area.value = values[i] || "";
    area.addEventListener("focus", () => {
      activeField = area;
    });
    area.addEventListener("input", () => {
      values[i] = area.value;
      save();
      refresh();
    });
    const useFrame = starter
      ? slBtn("Use frame starter", {
          ghost: true,
          key: `use${i}`,
          label: `Insert frame starter for ${s.label}`,
          onclick: () => {
            if (!area.value.trim()) {
              area.value = `${starter} `;
              area.dispatchEvent(new Event("input", { bubbles: true }));
            } else {
              insertAtCaret(area, starter);
            }
            area.focus({ preventScroll: true });
          },
        })
      : null;
    return {
      area,
      el: h(
        "div",
        { class: "sl-card" },
        h("label", { class: "sl-prompt", for: id, text: `${i + 1}. ${s.label}` }),
        h(
          "p",
          { class: "sl-frame", id: frameId },
          h("span", { class: "sl-frame__label", text: "Frame: " }),
          s.frame,
        ),
        area,
        useFrame ? h("div", { class: "sg-actions" }, useFrame) : null,
      ),
    };
  });
  activeField = slotCards[0]?.area || null;

  const connectorGroup = h(
    "div",
    { class: "sl-pool", role: "group", "aria-label": "Joining words: press to insert" },
    ...connectors.map((c, i) =>
      slBtn(c, {
        ghost: true,
        key: `conn${i}`,
        label: `Insert joining word: ${c}`,
        onclick: () => {
          const target = activeField || slotCards[0]?.area;
          if (!target) return;
          insertAtCaret(target, c);
          fb.set(`Added "${c}" to your paragraph.`, "ok");
        },
      }),
    ),
  );

  const modelCaption = h("p", { class: "sl-caption", id: "slParaModel", text: model });
  const modelBox = h(
    "div",
    { class: "sl-model", hidden: true },
    modelCaption,
    listenControls(model, modelCaption, { label: "model paragraph" }).el,
  );
  const modelBtn = slBtn("Show a model paragraph", {
    ghost: true,
    key: "model",
    onclick: () => {
      modelBox.hidden = !modelBox.hidden;
      modelBtn.setAttribute("aria-expanded", String(!modelBox.hidden));
      modelBtn.lastChild.textContent = modelBox.hidden
        ? "Show a model paragraph"
        : "Hide the model paragraph";
    },
  });
  modelBtn.setAttribute("aria-expanded", "false");
  modelBtn.setAttribute("aria-controls", "slParaModel");

  const readBtn = slBtn("Listen to my paragraph", {
    icon: "speaker",
    ghost: true,
    key: "read",
    onclick: () => {
      const text = joined();
      if (!text) return fb.set("Write at least one part first, then listen to it.", "hint");
      speakWithHighlight(text, preview);
    },
  });

  const list = h(
    "fieldset",
    { class: "sl-checklist" },
    h("legend", { text: "Check your paragraph" }),
    ...checklist.map((item, i) => {
      const box = h("input", { type: "checkbox", id: `slParaCheck${i}`, "data-key": `ck${i}` });
      box.checked = checked.has(i);
      box.addEventListener("change", () => {
        if (box.checked) checked.add(i);
        else checked.delete(i);
        save();
        fb.set(box.checked ? "Good. You checked that part." : "", "ok");
      });
      return h(
        "label",
        { class: "sl-check", for: `slParaCheck${i}` },
        box,
        h("span", { text: item }),
      );
    }),
  );

  finish.addEventListener("click", () => {
    const filledCount = values.filter((v) => String(v || "").trim().length > 0).length;
    const misses = Math.max(0, slots.length - filledCount);
    kit.finish(
      misses,
      slots.length,
      `You built ${filledCount} of ${slots.length} parts (${wordCount(joined())} words) and checked ${checked.size} of ${checklist.length} items.`,
    );
  });

  root.append(
    h(
      "div",
      { class: "sl-stage" },
      h("h3", {
        class: "sl-prompt",
        tabindex: "-1",
        "data-focus": "",
        text: `Build your ${klu} paragraph step by step.`,
      }),
      h("p", { class: "sl-ask", text: "Tap a joining word to add it to the box you are writing in." }),
      connectorGroup,
      ...slotCards.map((c) => c.el),
      h("div", { class: "sl-built" }, h("b", { text: "Your paragraph together:" }), preview, count),
      h("div", { class: "sg-actions" }, readBtn, modelBtn),
      modelBox,
      fb.el,
      list,
      h("div", { class: "sg-actions" }, finish),
    ),
  );
  refresh();
  return () => kit.destroy();
}
