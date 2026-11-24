// unscramble — build each sentence from shuffled phrase chips (tap, drag, or arrow keys). Correct sentences are read aloud.
import { createKit, enableDrag, h, shuffleNotSame, withFocus } from "./_kit.js";

export default function mount(root, ctx) {
  const kit = createKit(root, ctx, "unscramble");
  const items = ctx.payload.items;
  const dots = kit.dots(items.length, "Sentences");
  const fb = kit.feedback("Tap a chunk to place it. Tap it again to take it out. Arrow keys move a chunk.");
  const stage = h("div", { class: "sg-build" });
  let cur = 0;
  let answer = []; // part indices placed, in order
  let pool = []; // part indices still in the pool
  let tries = 0; // wrong checks on this sentence
  let solved = false;
  let marks = new Set(); // positions known to be right (shown after repeated misses)
  let firstTry = 0;
  let misses = 0;

  const begin = () => {
    const parts = items[cur].parts;
    answer = [];
    pool = shuffleNotSame(
      ctx,
      parts.map((_, i) => i),
      `${kit.seed}:${cur}`,
    );
    tries = 0;
    solved = false;
    marks = new Set();
    items.forEach((_, i) => dots.set(i, i < cur ? "ok" : i === cur ? "now" : ""));
    dots.label(`Sentence ${cur + 1} of ${items.length}`);
    render();
    fb.set("");
  };

  const move = (from, to) => {
    const [v] = answer.splice(from, 1);
    answer.splice(to, 0, v);
    marks = new Set();
    fb.set("");
    render();
  };
  const addAt = (part, pos) => {
    pool = pool.filter((p) => p !== part);
    answer.splice(pos === undefined ? answer.length : pos, 0, part);
    marks = new Set();
    fb.set("");
    render();
  };
  const returnPart = (part) => {
    answer = answer.filter((p) => p !== part);
    pool.push(part);
    marks = new Set();
    fb.set("");
    render();
  };

  function check() {
    const parts = items[cur].parts;
    if (answer.some((p, i) => parts[p] !== parts[i])) {
      tries++;
      misses++;
      marks =
        tries >= 2
          ? new Set(answer.map((p, i) => (parts[p] === parts[i] ? i : -1)).filter((i) => i >= 0))
          : new Set();
      render();
      kit.fx(stage.querySelector(".sg-line"), "sg-shake");
      fb.set(
        tries >= 2
          ? "Not quite yet. Chunks with a check are in the right spot. Read it out loud: does it sound right?"
          : "Not quite. Read your sentence out loud. Does it sound like a real sentence?",
        "no",
      );
      return;
    }
    solved = true;
    if (tries === 0) firstTry++;
    render();
    const sentence = parts.join(" ");
    kit.fx(stage.querySelector(".sg-line"), "sg-pop");
    fb.set("That sounds right! Listen to your sentence.", "ok");
    kit.reading(stage.querySelector(".sg-line"), sentence, 0.9);
  }

  function render() {
    withFocus(root, () => {
      const parts = items[cur].parts;
      const line = h("div", {
        class: "sg-line",
        "data-drop": "line",
        role: "group",
        "aria-label": "Your sentence",
      });
      const lineChips = [];
      answer.forEach((p, pos) => {
        const ok = solved || marks.has(pos);
        const chip = h(
          "button",
          {
            type: "button",
            class: `st-chip sg-chip sg-part${ok ? " is-right" : ""}`,
            "data-key": `p${p}`,
            "data-pos": String(pos),
            "aria-disabled": solved ? "true" : null,
            "aria-label": `${parts[p]}. Position ${pos + 1} of ${answer.length}.${solved ? "" : " Tap to take it out. Arrow keys move it."}`,
          },
          ok ? h("span", { class: "sg-tick", "aria-hidden": "true", text: "✓" }) : null,
          parts[p],
        );
        if (!solved) {
          chip.addEventListener("click", () => returnPart(p));
          chip.addEventListener("keydown", (e) => {
            const to = e.key === "ArrowLeft" ? pos - 1 : e.key === "ArrowRight" ? pos + 1 : -1;
            if (to < 0 || to >= answer.length) return;
            e.preventDefault();
            move(pos, to);
            ctx.announce(`Moved to position ${to + 1}`);
          });
          enableDrag(chip, {
            targets: () => [...lineChips.filter((c) => c !== chip), poolEl],
            onDrop: (t) => (t === poolEl ? returnPart(p) : move(pos, Number(t.dataset.pos))),
          });
        }
        lineChips.push(chip);
        line.append(chip);
      });
      if (!answer.length)
        line.append(
          h("span", {
            class: "sg-line__empty",
            text: "Tap the chunks in order, or drag them here.",
          }),
        );
      line.classList.toggle("is-solved", solved);
      const poolEl = h("div", {
        class: "sg-pool",
        "data-drop": "pool",
        role: "group",
        "aria-label": "Sentence chunks",
      });
      for (const p of pool) {
        const chip = h(
          "button",
          { type: "button", class: "st-chip sg-chip sg-part", "data-key": `p${p}` },
          parts[p],
        );
        chip.addEventListener("click", () => addAt(p));
        enableDrag(chip, {
          targets: () => [...lineChips, line],
          onDrop: (t) => (t === line ? addAt(p) : addAt(p, Number(t.dataset.pos))),
        });
        poolEl.append(chip);
      }
      poolEl.classList.toggle("is-empty", !pool.length);
      let action;
      if (solved) {
        action = h("button", {
          type: "button",
          class: "st-btn st-btn--primary st-btn--lg",
          "data-key": "next",
          text: cur + 1 >= items.length ? "Finish" : "Next sentence",
        });
        action.addEventListener("click", () => {
          if (cur + 1 >= items.length)
            kit.finish(
              misses,
              items.length,
              `${firstTry} of ${items.length} sentences on the first try`,
            );
          else {
            cur++;
            begin();
          }
        });
      } else {
        action = h("button", {
          type: "button",
          class: "st-btn st-btn--primary st-btn--lg",
          "data-key": "check",
          disabled: pool.length > 0 || null,
          text: "Check my sentence",
        });
        action.addEventListener("click", check);
      }
      stage.replaceChildren(...[
        h("p", { class: "sg-label", text: `Sentence ${cur + 1}` }),
        line,
        solved || !pool.length ? null : h("p", { class: "sg-label", text: "Chunks" }),
        solved || !pool.length ? null : poolEl,
        h("div", { class: "sg-actions" }, action),
      ].filter(Boolean));
      if (solved) action.focus({ preventScroll: true });
    });
  }

  root.append(
    h("div", { class: "sg-topbar" }, dots.el),
    stage,
  );
  begin();
  kit.dock(fb.el);
  return () => kit.destroy();
}
