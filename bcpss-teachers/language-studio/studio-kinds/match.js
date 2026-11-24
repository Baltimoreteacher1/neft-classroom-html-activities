// match — tap a word, tap its meaning (or drag a word onto a meaning). Wrong pairs bounce back.
import { createKit, enableDrag, h, shuffleNotSame } from "./_kit.js";

export default function mount(root, ctx) {
  const kit = createKit(root, ctx, "match");
  const { pairs, left_label: leftLabel, right_label: rightLabel } = ctx.payload;
  const order = shuffleNotSame(
    ctx,
    pairs.map((_, i) => i),
    `${kit.seed}:right`,
  );
  const matched = new Map(); // pair index -> badge number
  const missesBy = new Map();
  let misses = 0;
  let sel = null; // { side: "l" | "r", i }
  let finished = false;

  const meter = kit.meter(pairs.length, "Pairs matched");
  const fb = kit.feedback("Tap a word, then its meaning. You can also drag.");
  const nodes = { l: new Map(), r: new Map() };

  const termBtn = (i) => {
    const text = pairs[i].l;
    const ico = ctx.vocabIcon(text);
    const btn = h(
      "button",
      {
        type: "button",
        class: "sg-card sg-term",
        "data-key": `l${i}`,
        "data-side": "l",
        "aria-pressed": "false",
      },
      ico ? h("span", { class: "sg-term__icon", "aria-hidden": "true" }, ico) : null,
      h("span", { class: "sg-card__text", text }),
      h("span", { class: "sg-badge", "aria-hidden": "true" }),
    );
    btn.addEventListener("click", () => pick("l", i));
    enableDrag(btn, {
      targets: () => [...nodes.r].filter(([j]) => !matched.has(j)).map(([, n]) => n),
      onDrop: (t) => attempt(i, Number(t.dataset.i)),
      canDrag: () => !matched.has(i) && !finished,
    });
    const row = h(
      "div",
      { class: "sg-row" },
      btn,
      kit.speakBtn(text, `Listen to the word: ${text}`),
    );
    nodes.l.set(i, btn);
    return row;
  };
  const defBtn = (i) => {
    const btn = h(
      "button",
      {
        type: "button",
        class: "sg-card sg-def",
        "data-key": `r${i}`,
        "data-i": String(i),
        "aria-pressed": "false",
      },
      h("span", { class: "sg-card__text", text: pairs[i].r }),
      h("span", { class: "sg-badge", "aria-hidden": "true" }),
    );
    btn.addEventListener("click", () => pick("r", i));
    nodes.r.set(i, btn);
    return btn;
  };

  const paint = () => {
    for (const side of ["l", "r"]) {
      for (const [i, btn] of nodes[side]) {
        const done = matched.has(i);
        const on = sel?.side === side && sel.i === i;
        btn.classList.toggle("is-matched", done);
        btn.classList.toggle("is-selected", on);
        btn.setAttribute("aria-pressed", String(on));
        btn.setAttribute("aria-disabled", String(done));
        btn.querySelector(".sg-badge").textContent = done ? String(matched.get(i)) : "";
        const base = side === "l" ? pairs[i].l : pairs[i].r;
        btn.setAttribute("aria-label", done ? `${base}. Matched, pair ${matched.get(i)}.` : base);
      }
    }
    meter.set(matched.size);
  };

  function pick(side, i) {
    if (finished || matched.has(i)) return;
    if (sel && sel.side === side) {
      sel = sel.i === i ? null : { side, i };
      paint();
      fb.set(
        sel
          ? side === "l"
            ? "Now tap the meaning that fits this word."
            : "Now tap the word that fits this meaning."
          : "",
      );
      return;
    }
    if (!sel) {
      sel = { side, i };
      paint();
      fb.set(
        side === "l"
          ? "Now tap the meaning that fits this word."
          : "Now tap the word that fits this meaning.",
      );
      return;
    }
    const l = side === "l" ? i : sel.i;
    const r = side === "r" ? i : sel.i;
    attempt(l, r);
  }

  function attempt(l, r) {
    if (finished || matched.has(l) || matched.has(r)) return;
    const a = nodes.l.get(l);
    const b = nodes.r.get(r);
    sel = null;
    if (l === r) {
      matched.set(l, matched.size + 1);
      paint();
      kit.fx(a, "sg-pop");
      kit.fx(b, "sg-pop");
      if (matched.size === pairs.length) {
        finished = true;
        fb.set("All matched. You know these words!", "ok");
        kit.later(
          () =>
            kit.finish(
              misses,
              pairs.length,
              `${pairs.length} pairs matched, ${misses} ${misses === 1 ? "bounce" : "bounces"}`,
            ),
          1100,
        );
      } else fb.set(`Yes! "${pairs[l].l}" goes with that meaning.`, "ok");
      return;
    }
    misses++;
    const n = (missesBy.get(l) || 0) + 1;
    missesBy.set(l, n);
    paint();
    kit.fx(a, "sg-shake");
    kit.fx(b, "sg-shake");
    const cue = n >= kit.hintAfter ? kit.vocabFor(pairs[l].l)?.cue : "";
    fb.set(
      cue
        ? `Not a match. Picture it: ${cue}`
        : "Not a match. Say the word out loud, then read each meaning again.",
      "no",
    );
  }

  const colLabel = (text) => h("h3", { class: "sg-collabel", text });
  const leftCol = h(
    "div",
    { class: "sg-col", role: "group", "aria-label": leftLabel },
    colLabel(leftLabel),
    ...pairs.map((_, i) => termBtn(i)),
  );
  const rightCol = h(
    "div",
    { class: "sg-col", role: "group", "aria-label": rightLabel },
    colLabel(rightLabel),
    ...order.map((i) => defBtn(i)),
  );
  root.append(
    h("div", { class: "sg-topbar" }, meter.el),
    h("div", { class: "sg-match" }, leftCol, rightCol),
  );
  paint();
  kit.dock(fb.el);
  return () => kit.destroy();
}
