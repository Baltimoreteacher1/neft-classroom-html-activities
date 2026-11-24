// word_sort — drag a word into its group, or tap the word and then tap the group. Checked on every placement.
import { createKit, enableDrag, h, withFocus } from "./_kit.js";

export default function mount(root, ctx) {
  const kit = createKit(root, ctx, "word_sort");
  const { categories, items: raw } = ctx.payload;
  const order = ctx.shuffle(
    raw.map((_, i) => i),
    `${kit.seed}:pool`,
  );
  const placed = new Map(); // item index -> category index
  const missesBy = new Map();
  let misses = 0;
  let sel = null;
  let finished = false;

  const meter = kit.meter(raw.length, "Words sorted");
  const fb = kit.feedback("Drag a word to its group, or tap the word and then the group.");
  const pool = h("div", { class: "sg-pool", role: "group", "aria-label": "Words to sort" });
  const bucketEls = categories.map((c, ci) => {
    const list = h("ul", { class: "sg-bucket__list", "aria-label": `Words in ${c.name}` });
    const btn = h(
      "button",
      { type: "button", class: "sg-bucket__btn", "data-key": `b${ci}` },
      h("span", { class: "sg-bucket__name", text: c.name }),
      h("span", { class: "sg-bucket__hint", text: "Drop a word here" }),
    );
    const el = h("section", { class: "sg-bucket", "data-cat": String(ci) }, btn, list);
    el.addEventListener("click", () => place(ci));
    return { el, list, btn };
  });

  const chipFor = (i) => {
    const text = raw[i].text;
    const ico = ctx.vocabIcon(text);
    const chip = h(
      "button",
      {
        type: "button",
        class: "st-chip sg-chip",
        "data-key": `w${i}`,
        "aria-pressed": String(sel === i),
      },
      ico ? h("span", { "aria-hidden": "true", text: ico }) : null,
      text,
    );
    chip.addEventListener("click", (e) => {
      e.stopPropagation();
      sel = sel === i ? null : i;
      render();
      fb.set(sel === null ? "" : `Where does "${text}" belong? Tap a group.`);
    });
    enableDrag(chip, {
      targets: () => bucketEls.map((b) => b.el),
      onDrop: (t) => {
        sel = i;
        place(Number(t.dataset.cat));
      },
      canDrag: () => !finished,
    });
    return chip;
  };

  function place(ci) {
    if (finished) return;
    if (sel === null) {
      fb.set("Tap a word first, then tap the group where it belongs.");
      return;
    }
    const i = sel;
    const text = raw[i].text;
    sel = null;
    if (raw[i].cat === ci) {
      placed.set(i, ci);
      render();
      const added = bucketEls[ci].list.querySelector(`[data-item="${i}"]`);
      kit.fx(added, "sg-pop");
      if (placed.size === raw.length) {
        finished = true;
        fb.set(
          `All sorted. You got ${raw.length - missCount()} of ${raw.length} on the first try.`,
          "ok",
        );
        kit.later(
          () =>
            kit.finish(
              misses,
              raw.length,
              `${raw.length} words sorted, ${misses} ${misses === 1 ? "retry" : "retries"}`,
            ),
          1300,
        );
      } else fb.set(`Yes! "${text}" belongs in "${categories[ci].name}".`, "ok");
      return;
    }
    misses++;
    const n = (missesBy.get(i) || 0) + 1;
    missesBy.set(i, n);
    render();
    kit.fx(pool.querySelector(`[data-key="w${i}"]`), "sg-shake");
    kit.fx(bucketEls[ci].el, "sg-shake");
    const def = n >= kit.hintAfter ? kit.vocabFor(text)?.def : "";
    fb.set(
      def
        ? `Not quite. Hint: "${text}" means ${def}.`
        : "Not quite. Look at how the word is used, then try another group.",
      "no",
    );
  }
  const missCount = () => missesBy.size;

  function render() {
    withFocus(root, () => {
      pool.replaceChildren(...order.filter((i) => !placed.has(i)).map(chipFor));
      pool.classList.toggle("is-empty", placed.size === raw.length);
      bucketEls.forEach((b, ci) => {
        const mine = order.filter((i) => placed.get(i) === ci);
        b.list.replaceChildren(
          ...mine.map((i) => {
            const ico = ctx.vocabIcon(raw[i].text);
            return h(
              "li",
              { class: "st-chip st-chip--ok sg-placed", "data-item": String(i) },
              ico ? h("span", { "aria-hidden": "true", text: ico }) : null,
              raw[i].text,
            );
          }),
        );
        b.el.classList.toggle("is-ready", sel !== null);
        b.btn.setAttribute(
          "aria-label",
          `${categories[ci].name}. ${mine.length} ${mine.length === 1 ? "word" : "words"} placed.${sel !== null ? ` Place "${raw[sel].text}" here.` : ""}`,
        );
      });
      meter.set(placed.size);
    });
  }

  const hints = kit.hints(() => {
    const i = sel ?? order.find((k) => !placed.has(k)) ?? 0;
    const text = raw[i].text;
    const v = kit.vocabFor(text);
    return [
      `Say “${text}” out loud. What does it mean here?`,
      v?.def ? `It means: ${v.def}.` : "Read the three group names again.",
      v?.nonexample
        ? `Careful: ${v.nonexample}`
        : `Say a sentence with “${text}”. Which group would that sentence live in?`,
    ];
  });
  root.append(
    h("div", { class: "sg-topbar" }, meter.el),
    hints,
    pool,
    h(
      "div",
      { class: "sg-buckets", style: `--sg-cols:${categories.length}` },
      ...bucketEls.map((b) => b.el),
    ),
  );
  render();
  kit.dock(fb.el);
  return () => kit.destroy();
}
