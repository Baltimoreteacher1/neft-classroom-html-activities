// cloze — fill the gaps from the word bank (tap a word then a gap, tap a gap then a word, or drag). "Check" locks the right ones.
import { createKit, createPicker, enableDrag, h, withFocus } from "./_kit.js";

export default function mount(root, ctx) {
  const kit = createKit(root, ctx, "cloze");
  const { text, answers, bank } = ctx.payload;
  const bankOrder = ctx.shuffle(
    bank.map((_, i) => i),
    `${kit.seed}:bank`,
  );
  const filled = answers.map(() => null); // blank -> bank index
  const locked = answers.map(() => false);
  const flagged = answers.map(() => false);
  const missesBy = answers.map(() => 0);
  let misses = 0;
  let finished = false;

  const fb = kit.feedback("Tap a word, then tap a gap. Or drag the word.");
  const meter = kit.meter(answers.length, "Gaps filled correctly");
  const story = h("p", { class: "sg-story" });
  const bankEl = h("div", { class: "sg-bank", role: "group", "aria-label": "Word bank" });
  const check = h("button", {
    type: "button",
    class: "st-btn st-btn--primary st-btn--lg",
    "data-key": "check",
    text: "Check my answers",
  });
  const actions = h("div", { class: "sg-actions" }, check);
  const blankEls = [];

  const picker = createPicker({
    place(chip, slot) {
      if (locked[slot] || finished) return;
      const old = filled.indexOf(chip);
      if (old >= 0) filled[old] = null;
      filled[slot] = chip;
      flagged[slot] = false;
      picker.active = null;
      const next = filled.findIndex((v, i) => v === null && !locked[i]);
      if (next >= 0 && picker.sel === null) picker.active = null;
    },
    remove(slot) {
      if (!locked[slot]) filled[slot] = null;
    },
    changed: render,
  });

  const parts = String(text).split(/\{(\d+)\}/);
  parts.forEach((part, k) => {
    if (k % 2 === 0) {
      story.append(part);
      return;
    }
    const n = Number(part) - 1;
    const b = h("button", {
      type: "button",
      class: "sg-blank",
      "data-key": `blank${n}`,
      "data-blank": String(n),
    });
    b.addEventListener("click", () => {
      if (!locked[n] && !finished) picker.slot(n, filled[n] !== null);
    });
    blankEls[n] = b;
    story.append(b);
  });

  check.addEventListener("click", () => {
    if (finished) return;
    const wrongNow = [];
    answers.forEach((a, i) => {
      if (locked[i]) return;
      if (bank[filled[i]] === a) locked[i] = true;
      else wrongNow.push(i);
    });
    if (!wrongNow.length) {
      finished = true;
      render();
      kit.fx(story, "sg-pop");
      fb.set("Every gap fits. Read the whole story out loud!", "ok");
      showFinish();
      return;
    }
    wrongNow.forEach((i) => {
      misses++;
      missesBy[i]++;
      flagged[i] = true;
      filled[i] = null;
    });
    render();
    wrongNow.forEach((i) => kit.fx(blankEls[i], "sg-shake"));
    const hintI = wrongNow.find((i) => missesBy[i] >= kit.hintAfter);
    const pos = hintI !== undefined ? kit.vocabFor(answers[hintI])?.pos : "";
    const left = wrongNow.length;
    fb.set(
      `${left} ${left === 1 ? "gap needs" : "gaps need"} another look. Reread the sentence around ${left === 1 ? "it" : "them"}.${pos ? ` Hint for gap ${hintI + 1}: it is a ${pos}.` : ""}`,
      "no",
    );
  });

  function showFinish() {
    const full = String(text).replace(/\{(\d+)\}/g, (_, n) => answers[Number(n) - 1]);
    const extras = bank.filter((w, i) => !filled.includes(i) && !answers.includes(w));
    const listen = kit.speakBtn(full, "Listen to the whole story");
    if (listen) {
      listen.className = "st-btn";
      listen.append(" Listen to the story");
      listen.addEventListener("click", () => kit.reading(story, full, 0.9));
    }
    const done = h("button", {
      type: "button",
      class: "st-btn st-btn--primary st-btn--lg",
      "data-key": "finish",
      text: "Finish",
    });
    done.addEventListener("click", () =>
      kit.finish(
        misses,
        answers.length,
        `${answers.length} gaps, ${misses} ${misses === 1 ? "retry" : "retries"}`,
      ),
    );
    actions.replaceChildren(...[listen, done].filter(Boolean));
    done.focus({ preventScroll: true });
    if (extras.length)
      bankEl.replaceChildren(
        h("p", { class: "sg-extras" }, `Words that did not fit: ${extras.join(", ")}.`),
      );
  }

  function render() {
    withFocus(root, () => {
      const nLocked = locked.filter(Boolean).length;
      meter.set(nLocked);
      answers.forEach((_, i) => {
        const b = blankEls[i];
        const chipText = filled[i] === null ? "" : bank[filled[i]];
        b.textContent = locked[i] ? `${chipText}` : chipText || String(i + 1);
        b.className = `sg-blank${locked[i] ? " is-locked" : ""}${chipText && !locked[i] ? " is-filled" : ""}${flagged[i] ? " is-no" : ""}${picker.active === i ? " is-active" : ""}${!chipText ? " is-empty" : ""}`;
        b.setAttribute("aria-disabled", String(locked[i]));
        b.setAttribute(
          "aria-label",
          locked[i]
            ? `Gap ${i + 1}: ${chipText}, correct`
            : chipText
              ? `Gap ${i + 1}: ${chipText}. Tap to take it out.`
              : `Gap ${i + 1}, empty${flagged[i] ? ", try another word" : ""}`,
        );
      });
      if (finished) return;
      bankEl.replaceChildren(
        ...bankOrder
          .filter((bi) => !filled.includes(bi))
          .map((bi) => {
            const w = bank[bi];
            const ico = ctx.vocabIcon(w);
            const chip = h(
              "button",
              {
                type: "button",
                class: "st-chip sg-chip",
                "data-key": `c${bi}`,
                "aria-pressed": String(picker.sel === bi),
              },
              ico ? h("span", { "aria-hidden": "true", text: ico }) : null,
              w,
            );
            chip.addEventListener("click", () => picker.chip(bi));
            enableDrag(chip, {
              targets: () => blankEls.filter((_, i) => !locked[i]),
              onDrop: (t) => picker.drop(bi, Number(t.dataset.blank)),
            });
            return chip;
          }),
      );
      check.disabled = !answers.every((_, i) => locked[i] || filled[i] !== null);
    });
  }

  const hints = kit.hints(() => {
    const i = Math.max(0, answers.findIndex((_, k) => !locked[k]));
    const v = kit.vocabFor(answers[i]);
    const kindOfWord = {
      noun: "a word that names a thing or an idea",
      verb: "a word that names an action",
      adjective: "a word that describes something",
      adverb: "a word that tells how, when or where",
    }[v?.pos] || "a word from this unit";
    return [
      `Read the whole sentence around gap ${i + 1}, not just the gap.`,
      `Gap ${i + 1} needs ${kindOfWord}.`,
      "Say the sentence out loud with each bank word. Only one keeps the meaning.",
    ];
  });
  root.append(
    h("div", { class: "sg-topbar" }, meter.el),
    hints,
    h("div", { class: "st-card sg-storycard" }, story),
    bankEl,
    actions,
  );
  render();
  kit.dock(fb.el);
  return () => kit.destroy();
}
