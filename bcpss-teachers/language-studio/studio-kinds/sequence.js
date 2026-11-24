// sequence — put the steps in order (up/down buttons or drag), then add signal words to each step.
import { createKit, createPicker, enableDrag, h, icon, shuffleNotSame, withFocus } from "./_kit.js";

export default function mount(root, ctx) {
  const kit = createKit(root, ctx, "sequence");
  const { title, steps, signals } = ctx.payload;
  let order = shuffleNotSame(
    ctx,
    steps.map((_, i) => i),
    `${kit.seed}:steps`,
  ); // step indices in the student's order
  const need = Math.min(steps.length, signals.length);
  const signalOrder = ctx.shuffle(
    signals.map((_, i) => i),
    `${kit.seed}:signals`,
  );
  const slot = steps.map(() => null); // position -> signal index (phase 2)
  let phase = 1; // 1 = order, 2 = signals, 3 = done
  let misses = 0;
  let tries = 0;
  let marks = new Set();

  const fb = kit.feedback();
  const list = h("ol", { class: "sg-steps" });
  const bankEl = h("div", { class: "sg-bank", role: "group", "aria-label": "Signal words" });
  const actions = h("div", { class: "sg-actions" });
  const heading = h("h3", { class: "sg-seq__title", text: title });

  const picker = createPicker({
    place(chip, pos) {
      const old = slot.indexOf(chip);
      if (old >= 0) slot[old] = null;
      slot[pos] = chip;
    },
    remove(pos) {
      slot[pos] = null;
    },
    changed: render,
  });

  const swap = (from, to) => {
    if (to < 0 || to >= order.length || phase !== 1) return;
    const [v] = order.splice(from, 1);
    order.splice(to, 0, v);
    marks = new Set();
    fb.set("");
    render();
    list
      .querySelector(`[data-key="s${v}"]`)
      ?.closest("li")
      ?.querySelector(".sg-move")
      ?.focus?.({ preventScroll: true });
    ctx.announce(`Moved to position ${to + 1} of ${order.length}`);
  };

  function check() {
    if (phase === 1) {
      const bad = order.some((s, i) => s !== i);
      if (!bad) {
        phase = 2;
        tries = 0;
        marks = new Set();
        render();
        fb.set("Right order! Now add a signal word to each step.", "ok");
        return;
      }
      tries++;
      misses++;
      marks =
        tries >= 2
          ? new Set(order.map((s, i) => (s === i ? i : -1)).filter((i) => i >= 0))
          : new Set();
      render();
      kit.fx(list, "sg-shake");
      fb.set(
        tries >= 2
          ? "Not yet. Steps with a check are in the right place. What has to happen before the others?"
          : "Not quite. Think: what has to happen first? What can only happen last?",
        "no",
      );
      return;
    }
    const filled = slot.map((v, i) => [v, i]).filter(([v]) => v !== null);
    const ok = filled.length === need && filled.every(([v], k) => k === 0 || v > filled[k - 1][0]);
    if (!ok) {
      misses++;
      render();
      kit.fx(list, "sg-shake");
      fb.set(
        filled.length < need
          ? `Add ${need} signal words, one for each of the first ${need} steps.`
          : "Not quite. Which signal word starts a story? Which one ends it? Check that they go in time order.",
        "no",
      );
      return;
    }
    phase = 3;
    render();
    kit.fx(list, "sg-pop");
    fb.set("The sequence is ready. Read it out loud with your signal words!", "ok");
  }

  function render() {
    withFocus(root, () => {
      list.replaceChildren(
        ...order.map((s, pos) => {
          const locked = phase !== 1;
          const good = locked || marks.has(pos);
          const sig = slot[pos];
          const li = h("li", {
            class: `sg-step${good ? " is-right" : ""}`,
            "data-pos": String(pos),
          });
          const num = h("span", {
            class: "sg-step__num",
            "aria-hidden": "true",
            text: good ? "✓" : String(pos + 1),
          });
          const body = h("span", { class: "sg-step__text", text: steps[s] });
          li.append(num);
          if (phase >= 2) {
            const b = h(
              "button",
              {
                type: "button",
                class: `sg-blank sg-signal${sig !== null ? " is-filled" : " is-empty"}${picker.active === pos ? " is-active" : ""}${phase === 3 ? " is-locked" : ""}`,
                "data-key": `slot${pos}`,
                "aria-disabled": String(phase === 3),
                "aria-label": `Step ${pos + 1} signal word: ${sig !== null ? signals[sig] : "empty"}`,
              },
              sig !== null ? signals[sig] : "…",
            );
            if (pos >= need && sig === null) b.hidden = true;
            b.addEventListener("click", () => phase === 2 && picker.slot(pos, slot[pos] !== null));
            li.append(b);
          }
          li.append(body);
          if (phase === 1) {
            const up = h(
              "button",
              {
                type: "button",
                class: "st-btn st-btn--ghost st-btn--sm sg-move",
                "data-key": `up${s}`,
                "aria-label": `Move up: ${steps[s]}`,
                disabled: pos === 0 || null,
              },
              icon("up"),
            );
            const down = h(
              "button",
              {
                type: "button",
                class: "st-btn st-btn--ghost st-btn--sm sg-move",
                "data-key": `down${s}`,
                "aria-label": `Move down: ${steps[s]}`,
                disabled: pos === order.length - 1 || null,
              },
              icon("down"),
            );
            up.addEventListener("click", () => swap(pos, pos - 1));
            down.addEventListener("click", () => swap(pos, pos + 1));
            li.append(h("span", { class: "sg-step__moves" }, up, down));
            li.classList.add("is-draggable");
            enableDrag(li, {
              targets: () => [...list.children].filter((n) => n !== li),
              onDrop: (t) => swap(pos, Number(t.dataset.pos)),
            });
          }
          return li;
        }),
      );
      bankEl.hidden = phase !== 2;
      if (phase === 2) {
        bankEl.replaceChildren(
          ...signalOrder
            .filter((si) => !slot.includes(si))
            .map((si) => {
              const chip = h(
                "button",
                {
                  type: "button",
                  class: "st-chip sg-chip",
                  "data-key": `sg${si}`,
                  "aria-pressed": String(picker.sel === si),
                },
                signals[si],
              );
              chip.addEventListener("click", () => picker.chip(si));
              enableDrag(chip, {
                targets: () => [...list.querySelectorAll(".sg-signal")],
                onDrop: (t) => picker.drop(si, Number(t.closest("li").dataset.pos)),
              });
              return chip;
            }),
        );
      }
      fb.idle(
        phase === 1
          ? "Step 1 of 2: put the steps in order. Use the arrows or drag a step."
          : phase === 2
            ? "Step 2 of 2: tap a signal word, then tap the gap before a step."
            : "Done! Your sequence is complete.",
      );
      let btn = null;
      if (phase === 3) {
        btn = h("button", {
          type: "button",
          class: "st-btn st-btn--primary st-btn--lg",
          "data-key": "finish",
          text: "Finish",
        });
        btn.addEventListener("click", () =>
          kit.finish(
            misses,
            6,
            `${misses} ${misses === 1 ? "retry" : "retries"} to build the sequence`,
          ),
        );
      } else {
        btn = h("button", {
          type: "button",
          class: "st-btn st-btn--primary st-btn--lg",
          "data-key": "check",
          text: phase === 1 ? "Check the order" : "Check my signal words",
          disabled: phase === 2 && slot.filter((v) => v !== null).length < need ? true : null,
        });
        btn.addEventListener("click", check);
      }
      actions.replaceChildren(btn);
      if (phase === 3) btn.focus({ preventScroll: true });
    });
  }

  const hints = kit.hints(() =>
    phase === 1
      ? [
          "What has to happen first? Find the step that starts everything.",
          "Look for time words: first, next, then, last.",
          "Read your order out loud. Does every step make sense after the one before it?",
        ]
      : [
          "Signal words tell the reader where the step goes in time.",
          "Tap a signal word, then tap the gap in front of the step it belongs to.",
          "Read the whole sequence out loud with the signal words in place.",
        ],
  );
  root.append(h("div", { class: "sg-topbar" }, heading), hints, bankEl, list, actions);
  render();
  kit.dock(fb.el);
  return () => kit.destroy();
}
