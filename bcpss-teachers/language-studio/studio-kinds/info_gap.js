// info_gap: two partner cards (hide/show), ask/tell frames, fill in the needs, check against the other card.
import { announce, h, sameAnswer, starsFor } from "../studio-core.js";
import { icon } from "../studio-icons.js";
import { speakButton } from "../studio-ui.js";
import { hintLadder } from "./_kit.js";

export default function mount(root, ctx) {
  const p = ctx.payload;
  const sides = [p.a, p.b];
  const other = [p.b, p.a];
  const saved = ctx.loadState() || {};
  const answers = saved.answers || [{}, {}];
  let checks = 0;
  let firstTryRight = 0;
  let firstChecked = false;
  const cards = [];

  const showOnly = (idx) => {
    cards.forEach((c, i) => c.setShown(i === idx));
    announce(idx == null ? "Cards hidden." : `${sides[idx].title} card shown. Keep it private.`);
  };

  sides.forEach((side, idx) => {
    const inputs = {};
    const facts = h(
      "dl",
      { class: "ig-facts" },
      side.has.flatMap((f) => [h("dt", null, f.k), h("dd", null, f.v)]),
    );
    const body = h(
      "div",
      { class: "ig-private" },
      h("p", { class: "ig-label" }, "Only you can see this"),
      facts,
    );
    const veil = h(
      "div",
      { class: "ig-veil" },
      icon("lock", 28),
      h("p", null, "Your clues are hidden."),
      h("p", { class: "ig-muted" }, "Tap Show my card. Do not let your partner look!"),
    );
    const toggle = h(
      "button",
      { type: "button", class: "st-btn st-btn--sm", "aria-expanded": "false" },
      icon("eye", 18),
      "Show my card",
    );
    const needs = side.needs.map((need, i) => {
      const input = h("input", {
        type: "text",
        class: "ow-input",
        id: `ig-${idx}-${i}`,
        autocomplete: "off",
        spellcheck: "false",
      });
      input.value = answers[idx][need] || "";
      input.addEventListener("input", () => {
        answers[idx][need] = input.value;
        ctx.saveState({ answers });
        input.closest(".ig-need").classList.remove("is-ok", "is-no");
        input.removeAttribute("aria-invalid");
      });
      inputs[need] = input;
      return h(
        "div",
        { class: "ig-need" },
        h("label", { for: input.id }, need),
        input,
        h("span", { class: "ig-mark", "aria-hidden": "true" }),
      );
    });
    const frames = (list, label) =>
      h(
        "div",
        { class: "ig-frames" },
        h("span", { class: "ig-label" }, label),
        list.map((t) =>
          h(
            "button",
            {
              type: "button",
              class: "st-chip st-chip--sm",
              onclick: () => ctx.tts(t.replace(/_{2,}/g, "blank"), { rate: 0.9 }),
            },
            t,
          ),
        ),
      );
    const el = h(
      "article",
      { class: "ig-card", "data-side": idx === 0 ? "a" : "b" },
      h(
        "header",
        { class: "ig-head" },
        h("span", { class: "ig-badge", "aria-hidden": "true" }, idx === 0 ? "A" : "B"),
        h("h2", null, side.title),
        toggle,
      ),
      h("div", { class: "ig-secret" }, body, veil),
      h("div", { class: "ig-needs" }, h("p", { class: "ig-label" }, "Find out"), needs),
      frames(p.ask_frames, "Ask"),
      frames(p.tell_frames, "Tell"),
    );
    const setShown = (on) => {
      el.classList.toggle("is-shown", on);
      body.inert = !on;
      veil.hidden = on;
      toggle.setAttribute("aria-expanded", String(on));
      toggle.lastChild.textContent = on ? "Hide my card" : "Show my card";
      toggle.firstChild.replaceWith(icon(on ? "eyeOff" : "eye", 18));
    };
    toggle.addEventListener("click", () =>
      el.classList.contains("is-shown") ? showOnly(null) : showOnly(idx),
    );
    cards.push({ el, setShown, inputs });
    setShown(false);
  });

  const feedback = h("p", { class: "st-feedback", role: "status" });
  const checkBtn = h(
    "button",
    { type: "button", class: "st-btn st-btn--primary st-btn--lg" },
    icon("check", 20),
    "Check our answers",
  );
  checkBtn.addEventListener("click", () => {
    checks += 1;
    let right = 0;
    let total = 0;
    sides.forEach((side, idx) => {
      for (const need of side.needs) {
        total += 1;
        const truth = other[idx].has.find((f) => f.k === need)?.v ?? "";
        const input = cards[idx].inputs[need];
        const ok = input.value.trim() !== "" && sameAnswer(input.value, truth);
        const row = input.closest(".ig-need");
        row.classList.toggle("is-ok", ok);
        row.classList.toggle("is-no", !ok);
        row.querySelector(".ig-mark").textContent = ok ? "✓ Matches" : "Ask again";
        if (!ok) input.setAttribute("aria-invalid", "true");
        if (ok) right += 1;
      }
    });
    if (!firstChecked) {
      firstChecked = true;
      firstTryRight = right;
    }
    if (right === total) {
      feedback.className = "st-feedback st-feedback--ok";
      feedback.textContent = "Every fact matches. Great asking and telling!";
      announce(feedback.textContent);
      ctx.done({
        stars: starsFor(checks - 1, 2),
        detail: "You and your partner shared every missing fact.",
      });
    } else {
      feedback.className = "st-feedback st-feedback--no";
      feedback.textContent = `${right} of ${total} match. Ask your partner again about the ones marked "Ask again" — listen for the exact number and unit.`;
      announce(feedback.textContent);
    }
  });

  // Built from your own "Find out" list and the ask/tell frames; it never shows what your partner's card says.
  const openNeed = () => {
    for (const [idx, side] of sides.entries())
      for (const need of side.needs)
        if (!cards[idx].inputs[need]?.value.trim()) return { need, who: side.title };
    return null;
  };
  const hints = hintLadder(ctx, () => {
    const open = openNeed();
    const what = open ? `“${open.need}”` : "the facts you still need";
    return [
      `Choose one fact you still need: ${what}.${open ? ` It is on ${open.who}'s “Find out” list.` : ""}`,
      `Ask your partner with an Ask frame: “${p.ask_frames[0]}” Put ${what} in the blank.`,
      `Your partner answers with a Tell frame: “${p.tell_frames[0]}” Listen for the exact number and the unit, then type it.`,
    ];
  });

  root.append(
    h(
      "div",
      { class: "ig" },
      h(
        "div",
        { class: "ig-goal st-card st-card--flat" },
        h("span", { class: "sh-eyebrow" }, "Your goal"),
        h("p", null, p.goal),
        speakButton(p.goal, "Read the goal aloud"),
      ),
      hints,
      h(
        "div",
        { class: "ig-pair" },
        cards.map((c) => c.el),
      ),
      h("div", { class: "ig-actions" }, checkBtn),
      feedback,
    ),
  );
}
