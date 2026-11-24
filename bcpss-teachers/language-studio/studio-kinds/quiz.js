// quiz — one question per screen. Wrong picks nudge (no answer given); the "why" teaches after the right pick.
// Missed questions come back in a short practice round. error_analysis.js reuses mountChoice().
import { createKit, h, withFocus } from "./_kit.js";

const LETTERS = ["A", "B", "C", "D"];

/**
 * opts: { kind, items: [{ options, answer, why }], prompt(item) -> Node, after(item) -> Node|null, word: "question"|"sentence" }
 */
export function mountChoice(root, ctx, opts) {
  const kit = createKit(root, ctx, opts.kind);
  const { items } = opts;
  const noun = opts.noun || "question";
  const missedFirst = new Set();
  let round = 1;
  let queue = items.map((_, i) => i);
  let pos = 0;
  let opt = []; // [{ text, ok }] for the current question
  let chosenWrong = new Set();
  let solved = false;
  let wrongHere = 0;

  const dots = kit.dots(items.length, "Progress");
  const banner = h("p", { class: "sg-round", hidden: true });
  const stage = h("div", { class: "sg-q" });
  const fb = kit.feedback();

  function start() {
    const i = queue[pos];
    const it = items[i];
    const base = it.options.map((text, k) => ({ text, ok: k === it.answer }));
    opt = round === 1 ? base : ctx.shuffle(base, `${kit.seed}:${i}:r${round}`);
    chosenWrong = new Set();
    solved = false;
    wrongHere = 0;
    queue.forEach((_, k) =>
      dots.set(
        k,
        k < pos
          ? missedFirst.has(queue[k]) && round === 1
            ? "miss"
            : "ok"
          : k === pos
            ? "now"
            : "",
      ),
    );
    dots.label(`${noun[0].toUpperCase()}${noun.slice(1)} ${pos + 1} of ${queue.length}`);
    fb.set("");
    render();
    stage.querySelector(".sg-q__prompt")?.focus({ preventScroll: true });
  }

  function choose(k) {
    if (solved || chosenWrong.has(k)) return;
    const i = queue[pos];
    if (opt[k].ok) {
      solved = true;
      if (wrongHere === 0 && round === 1) fb.set("Yes! That is right.", "ok");
      else fb.set("You got it. Read why below.", "ok");
      queue.forEach((_, q) =>
        dots.set(
          q,
          q < pos
            ? missedFirst.has(queue[q]) && round === 1
              ? "miss"
              : "ok"
            : q === pos
              ? "ok"
              : "",
        ),
      );
      render();
      kit.fx(stage.querySelector(".is-ok"), "sg-pop");
      return;
    }
    chosenWrong.add(k);
    wrongHere++;
    if (round === 1) missedFirst.add(i);
    render();
    kit.fx(stage.querySelector(`[data-k="${k}"]`), "sg-shake");
    fb.set(
      wrongHere >= kit.hintAfter + 1
        ? "Not that one either. Slow down and read every choice."
        : "Not quite. Read the question again, then try another choice.",
      "no",
    );
  }

  function advance() {
    if (pos + 1 < queue.length) {
      pos++;
      start();
      return;
    }
    if (round === 1 && missedFirst.size) {
      round = 2;
      queue = items.map((_, i) => i).filter((i) => missedFirst.has(i));
      pos = 0;
      dots.resize(queue.length);
      banner.hidden = false;
      banner.textContent = `Practice round: try the ${queue.length === 1 ? `${noun} you missed` : `${queue.length} ${noun}s you missed`} again.`;
      ctx.announce(banner.textContent);
      start();
      return;
    }
    kit.finish(
      missedFirst.size,
      items.length,
      `${items.length - missedFirst.size} of ${items.length} right on the first try`,
    );
  }

  function render() {
    withFocus(root, () => {
      const i = queue[pos];
      const it = items[i];
      const list = h(
        "div",
        { class: "sg-options", role: "group", "aria-labelledby": "sgQPrompt" },
        ...opt.map((o, k) => {
          const bad = chosenWrong.has(k);
          const good = solved && o.ok;
          const b = h(
            "button",
            {
              type: "button",
              class: `sg-option${good ? " is-ok" : ""}${bad ? " is-no" : ""}`,
              "data-k": String(k),
              "data-key": `o${k}`,
              "aria-disabled": bad || solved ? "true" : null,
              "aria-label": `${LETTERS[k]}. ${o.text}${good ? ". Correct." : bad ? ". Not this one." : ""}`,
            },
            h("span", {
              class: "sg-option__letter",
              "aria-hidden": "true",
              text: good ? "✓" : bad ? "✕" : LETTERS[k],
            }),
            h("span", { class: "sg-option__text", text: o.text }),
          );
          b.addEventListener("click", () => choose(k));
          return b;
        }),
      );
      const prompt = opts.prompt(it);
      prompt.id = "sgQPrompt";
      prompt.tabIndex = -1;
      prompt.classList.add("sg-q__prompt");
      const extra = solved
        ? h(
            "div",
            { class: "sg-why" },
            opts.after?.(it),
            h("p", { class: "sg-why__text" }, h("b", { text: "Why: " }), it.why),
          )
        : null;
      const next = solved
        ? h("button", {
            type: "button",
            class: "st-btn st-btn--primary st-btn--lg",
            "data-key": "next",
            text: pos + 1 >= queue.length && !(round === 1 && missedFirst.size) ? "Finish" : "Next",
          })
        : null;
      next?.addEventListener("click", advance);
      stage.replaceChildren(...[
        prompt,
        list,
        fb.el,
        extra,
        next ? h("div", { class: "sg-actions" }, next) : null,
      ].filter(Boolean));
      if (next && document.activeElement === document.body) next.focus({ preventScroll: true });
    });
  }

  root.append(h("div", { class: "sg-topbar" }, dots.el), banner, stage);
  start();
  return () => kit.destroy();
}

export default function mount(root, ctx) {
  return mountChoice(root, ctx, {
    kind: "quiz",
    items: ctx.payload.items,
    noun: "question",
    prompt: (it) => h("h3", { class: "sg-q__text", text: it.q }),
  });
}
