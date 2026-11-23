// Response controls for vocab-quest items. Each builder returns {el, resp(), ready(), focus(), onReady(fn), lock()}.
// resp() is what quest-logic.checkItem expects: a choice index, typed text, an array of parts, or {text, meaningCheck}.
import { h } from "../../core/dom.js";
import { btn, choiceGroup } from "../e4-kit.js";

const FRAME_COUNT = { ee: 3, dev: 2, exp: 1, br: 0 };

function base(el, getResp, ready, focus, lock) {
  const subs = [];
  return {
    el,
    resp: getResp,
    ready,
    focus,
    lock,
    subs,
    onReady: (fn) => subs.push(fn),
    fire: () => subs.forEach((f) => f(ready())),
  };
}

/** picture-word, meaning, cloze, sentence-choice */
export function choiceControl({ item, ctx, entries, tier }) {
  const aids = tier === "ee" || tier === "dev";
  let c;
  const group = choiceGroup({
    legend: item.prompt,
    options: item.choices,
    legendHidden: true,
    onSpeak: aids ? (t) => ctx.speak(t) : null,
    onChange: () => c.fire(),
  });
  const wrap = h("div", { class: "st-vq-choice" }, group.el);
  if (tier === "ee" && (item.kind === "picture-word" || item.kind === "cloze")) {
    const list = h(
      "ul",
      { class: "st-vq-meanings", hidden: true },
      item.choices.map((w) => {
        const e = entries.find((x) => x.word === w);
        return h("li", {}, h("strong", {}, `${w}: `), e ? e.def : "");
      }),
    );
    const toggle = btn(
      "See the meanings",
      "",
      () => {
        list.hidden = !list.hidden;
        toggle.setAttribute("aria-expanded", String(!list.hidden));
      },
      { "aria-expanded": "false" },
    );
    wrap.append(toggle, list);
  }
  c = base(
    wrap,
    () => group.value(),
    () => group.value() != null,
    () => group.focus(),
    (on) => group.lock(on),
  );
  c.group = group;
  c.wrong = (i) => {
    group.mark(i, "Not this one");
    group.reset();
    c.fire();
  };
  return c;
}

/** type-word: typed text with a word bank at ee, and at dev after the first hint. */
export function typeControl({ item, tier, hintsUsed }) {
  let c;
  const input = h("input", {
    type: "text",
    class: "st-vq-type",
    autocomplete: "off",
    autocapitalize: "none",
    spellcheck: "false",
    "aria-label": "Type the word",
  });
  input.addEventListener("input", () => c.fire());
  const bankHost = h("div", { class: "st-vq-bank" });
  const bank = [...new Set(item.bank)].sort((a, b) => a.localeCompare(b));
  function paintBank() {
    const show = tier === "ee" || (tier === "dev" && hintsUsed() >= 1);
    bankHost.replaceChildren();
    if (!show) return;
    bankHost.append(
      h("p", { class: "st-note" }, "Word bank. Choose a word to put it in the box."),
      h(
        "ul",
        { class: "st-wordbank", "aria-label": "Word bank" },
        bank.map((w) =>
          h(
            "li",
            {},
            h(
              "button",
              {
                type: "button",
                class: "st-chip",
                onclick: () => {
                  input.value = w;
                  c.fire();
                  input.focus();
                },
              },
              w,
            ),
          ),
        ),
      ),
    );
  }
  paintBank();
  const el = h(
    "div",
    { class: "st-vq-typewrap" },
    h("label", { class: "st-vq-typelabel" }, "Your word", input),
    bankHost,
  );
  c = base(
    el,
    () => input.value,
    () => input.value.trim().length > 0,
    () => input.focus(),
    (on) => {
      input.disabled = !!on;
    },
  );
  c.refreshBank = paintBank;
  c.wrong = () => {
    input.select();
  };
  return c;
}

/** word-parts: tap parts in order. Part meanings are always visible. */
export function partsControl({ item, ctx }) {
  let c;
  let built = [];
  const live = h("p", { class: "st-sr-only", role: "status", "aria-live": "polite" });
  const out = h("p", { class: "st-vq-built", "aria-label": "Word you built" });
  const tray = h("ul", { class: "st-vq-parts", "aria-label": "Word parts" });
  const buttons = item.parts.map((p, i) => {
    const b = h(
      "button",
      { type: "button", class: "st-btn st-vq-part", onclick: () => add(i) },
      h("strong", {}, p.shown),
      h("span", { class: "st-vq-partmean" }, p.meaning),
    );
    tray.append(h("li", {}, b));
    return b;
  });
  function paint(msg) {
    out.textContent = built.length
      ? built.map((i) => item.parts[i].text).join("")
      : "Tap parts below to build the word.";
    buttons.forEach((b, i) => {
      b.disabled = built.includes(i);
    });
    live.textContent = msg || "";
    c.fire();
  }
  function add(i) {
    if (built.length >= item.count) return;
    built.push(i);
    paint(
      `Added ${item.parts[i].shown}. Built so far: ${built.map((k) => item.parts[k].text).join("")}.`,
    );
  }
  const undo = btn("Undo last part", "", () => {
    built.pop();
    paint("Removed the last part.");
  });
  const clear = btn("Clear", "", () => {
    built = [];
    paint("Cleared.");
  });
  const el = h(
    "div",
    { class: "st-vq-partswrap" },
    out,
    tray,
    h(
      "div",
      { class: "st-e4-actions" },
      undo,
      clear,
      btn("Hear it", "st-btn-quiet", () =>
        ctx.speak(built.map((i) => item.parts[i].text).join("")),
      ),
    ),
    live,
  );
  c = base(
    el,
    () => built.map((i) => item.parts[i].text),
    () => built.length >= item.count,
    () => buttons[0].focus(),
    (on) => {
      buttons.forEach((b, i) => (b.disabled = on || built.includes(i)));
      undo.disabled = clear.disabled = !!on;
    },
  );
  c.wrong = () => {
    built = [];
    paint("Cleared. Try a different order or different parts.");
  };
  paint();
  return c;
}

/** say-write: frames by tier, a sentence box, and the learner's own check that it shows the meaning. */
export function writeControl({ item, ctx, tier }) {
  let c;
  const ta = h("textarea", {
    class: "st-textarea st-vq-write",
    rows: "3",
    maxlength: "400",
    "aria-label": "Write your sentence",
  });
  const meaning = h("input", { type: "checkbox", id: `vq-m-${item.id}` });
  const supports = {};
  for (const t of Object.keys(FRAME_COUNT))
    supports[t] = {
      frames: (item.frames?.[t] || []).slice(0, FRAME_COUNT[t]),
      oral:
        t === "ee"
          ? "Say your sentence to a partner first. Then write it."
          : t === "dev"
            ? "Say it to a partner, then write it."
            : undefined,
    };
  const panel = ctx.supportPanel({ id: item.id, supports });
  const note = h(
    "p",
    { class: "st-note" },
    "Say your sentence out loud first if you can. Then write it here.",
  );
  ta.addEventListener("input", () => c.fire());
  meaning.addEventListener("change", () => c.fire());
  const el = h(
    "div",
    { class: "st-vq-writewrap" },
    note,
    panel.el,
    ta,
    h(
      "label",
      { class: "st-vq-meaning", for: meaning.id },
      meaning,
      " My sentence shows what the word means.",
    ),
  );
  c = base(
    el,
    () => ({ text: ta.value, meaningCheck: meaning.checked }),
    () => ta.value.trim().length > 0,
    () => ta.focus(),
    (on) => {
      ta.disabled = meaning.disabled = !!on;
    },
  );
  c.wrong = () => ta.focus();
  return c;
}
