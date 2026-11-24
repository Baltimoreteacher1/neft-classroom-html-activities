// morph_lab — build words from their parts (prefix, stem, suffix). Select a part and press a slot, or drag;
// arrow keys move a placed part. After building each word, hear it aloud and read what the parts mean together.
import { createPicker, enableDrag, h, shuffleNotSame, withFocus } from "./_kit.js";
import { listenControls, slBtn, startKind } from "./_audio.js";

export default function mount(root, ctx) {
  const kit = startKind(root, ctx, "morph_lab");
  const { items } = ctx.payload;
  let pos = 0;
  let missed = 0;
  let itemTries = 0;
  let solved = false;
  let marks = null;
  let pool = [];
  let slots = [];

  const dots = kit.dots(items.length, "Word progress");
  const fb = kit.feedback();
  const stage = h("div", { class: "sl-stage" });
  root.append(h("div", { class: "sg-topbar" }, dots.el), stage);

  const picker = createPicker({
    place(chip, slotPos) {
      const old = slots.indexOf(chip);
      if (old >= 0) slots[old] = null;
      slots[slotPos] = chip;
      marks = null;
    },
    remove(slotPos) {
      slots[slotPos] = null;
      marks = null;
    },
    changed: render,
  });

  function begin() {
    const it = items[pos];
    pool = shuffleNotSame(
      ctx,
      it.parts.map((_, i) => i),
      `${kit.seed}:w${pos}`,
    );
    slots = it.parts.map(() => null);
    picker.sel = null;
    picker.active = null;
    marks = null;
    itemTries = 0;
    solved = false;
    items.forEach((_, k) => dots.set(k, k < pos ? "ok" : k === pos ? "now" : ""));
    dots.label(`Word ${pos + 1} of ${items.length}`);
    fb.set("Select each word part in order to build the word matching the meaning.");
    render();
    stage.querySelector("[data-focus]")?.focus({ preventScroll: true });
  }

  function move(from, to) {
    const n = items[pos].parts.length;
    if (to < 0 || to >= n || solved) return;
    [slots[from], slots[to]] = [slots[to], slots[from]];
    marks = null;
    render();
    stage.querySelector(`[data-key="slot${to}"]`)?.focus({ preventScroll: true });
    ctx.announce(`Moved to part ${to + 1} of ${n}.`);
  }

  function check() {
    const it = items[pos];
    const n = it.parts.length;
    const right = new Set(
      slots
        .map((c, i) => (c !== null && it.parts[c] === it.parts[i] ? i : -1))
        .filter((i) => i >= 0),
    );
    itemTries++;
    if (right.size === n && slots.map((c) => it.parts[c]).join("") === it.word) {
      solved = true;
      dots.set(pos, "ok");
      render();
      fb.set(`You built "${it.word}" (${it.parts.join(" + ")}).`, "ok");
      stage.querySelector('[data-key="next"]')?.focus({ preventScroll: true });
      return;
    }
    marks = right;
    render();
    kit.fx(stage.querySelector(".sl-slots"), "sg-shake");
    fb.set(
      right.size
        ? `Not yet. ${right.size} of ${n} parts are in the right place. Check which part comes first.`
        : "Not yet. Look at the meaning and check which word part goes at the start.",
      "no",
    );
  }

  function nextWord() {
    if (itemTries > 1) missed++;
    if (pos + 1 >= items.length) {
      return kit.finish(
        missed,
        items.length,
        `${items.length - missed} of ${items.length} words built on the first try`,
      );
    }
    pos++;
    begin();
  }

  function partBtn(i) {
    const it = items[pos];
    const b = h(
      "button",
      {
        type: "button",
        class: "sl-chunk sl-tone-concept",
        "data-key": `p${i}`,
        "aria-pressed": String(picker.sel === i),
        "aria-label": `Word part: ${it.parts[i]}`,
      },
      h("span", { class: "sl-chunk__tag", text: "Part" }),
      h("span", { class: "sl-chunk__text", text: it.parts[i] }),
    );
    b.addEventListener("click", () => picker.chip(i));
    enableDrag(b, {
      targets: () => [...stage.querySelectorAll(".sl-slot")],
      onDrop: (t) => picker.drop(i, Number(t.dataset.pos)),
    });
    return b;
  }

  function render() {
    withFocus(root, () => {
      const it = items[pos];
      const n = it.parts.length;
      const slotEls = slots.map((c, sPos) => {
        const filled = c !== null;
        const good = solved || marks?.has(sPos);
        const bad = marks && filled && !marks.has(sPos);
        const b = h(
          "button",
          {
            type: "button",
            class: `sl-slot${filled ? " sl-chunk sl-tone-precision" : " is-empty"}${picker.active === sPos ? " is-active" : ""}${good ? " is-right" : ""}${bad ? " is-no" : ""}`,
            "data-key": `slot${sPos}`,
            "data-pos": String(sPos),
            "aria-disabled": String(solved),
            "aria-label": filled
              ? `Part ${sPos + 1}. ${it.parts[c]}${good ? ". In the right place." : bad ? ". Not in the right place yet." : ""}`
              : `Part ${sPos + 1}, empty`,
          },
          filled
            ? [
                h("span", {
                  class: "sl-slot__num",
                  "aria-hidden": "true",
                  text: good ? "✓" : bad ? "✕" : String(sPos + 1),
                }),
                h("span", { class: "sl-chunk__tag", text: `Part ${sPos + 1}` }),
                h("span", { class: "sl-chunk__text", text: it.parts[c] }),
              ]
            : [h("span", { class: "sl-slot__num", "aria-hidden": "true", text: String(sPos + 1) })],
        );
        b.addEventListener("click", () => !solved && picker.slot(sPos, filled));
        b.addEventListener("keydown", (e) => {
          if (!filled || solved || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
          e.preventDefault();
          move(sPos, sPos + (e.key === "ArrowRight" ? 1 : -1));
        });
        if (filled && !solved) {
          enableDrag(b, {
            targets: () => [...b.parentElement.children].filter((x) => x !== b),
            onDrop: (t) => move(sPos, Number(t.dataset.pos)),
          });
        }
        return b;
      });
      const poolEls = pool.filter((i) => !slots.includes(i)).map(partBtn);
      const filledAll = slots.every((c) => c !== null);
      const actions = h("div", { class: "sg-actions" });
      if (solved) {
        actions.append(
          slBtn(pos + 1 >= items.length ? "Finish" : "Next word", {
            primary: true,
            key: "next",
            onclick: nextWord,
          }),
        );
      } else {
        actions.append(
          slBtn("Check my word", {
            primary: true,
            key: "check",
            disabled: !filledAll,
            onclick: check,
          }),
        );
      }
      const caption = h("p", {
        class: "sl-caption",
        text: `${it.word} (${it.parts.join(" + ")}): ${it.meaning}.`,
      });
      stage.replaceChildren(
        h("p", { class: "sl-count", text: `Word ${pos + 1} of ${items.length}` }),
        h("h3", {
          class: "sl-prompt",
          tabindex: "-1",
          "data-focus": "",
          text: `Meaning: ${it.meaning}`,
        }),
        h("p", {
          class: "sl-ask",
          text: solved
            ? "Listen to the word you built."
            : "Select a part, then press the slot where it goes. Arrow keys move a placed part.",
        }),
        h("div", { class: "sl-slots", role: "group", "aria-label": "Word parts in order" }, ...slotEls),
        poolEls.length
          ? h("div", { class: "sl-pool", role: "group", "aria-label": "Word parts to place" }, ...poolEls)
          : null,
        solved
          ? h(
              "div",
              { class: "sl-built" },
              caption,
              listenControls(it.word, caption, { label: "word" }).el,
            )
          : null,
        fb.el,
        actions,
      );
    });
  }

  begin();
  return () => kit.destroy();
}
