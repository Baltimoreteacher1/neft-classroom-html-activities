// early-sort: shared pieces for the five K-2 modes (calm feedback, big picture cards, help button, ordinals).
import { h } from "../core/dom.js";
import { speakBtn, visualEl } from "./st1-ui.js";

export const DEFAULT_HINTS = ["Try another spot.", "Listen again. Take your time.", "Let's look together."];
export const DEFAULT_MODEL = "Let's do this one together.";
const WARM = ["Yes!", "You did it.", "That's right.", "Nice thinking.", "Good looking."];
export const warm = (n) => WARM[Math.abs(n) % WARM.length];
export const ORDINAL = ["first", "next", "then", "last"];

/** Calm feedback: text only (no "Correct/Wrong" label), spoken aloud, never a failure sound. */
export function calm(ctx) {
  const el = h("div", { class: "st-feedback st-es-fb", role: "status", "aria-live": "polite", hidden: true });
  return {
    el,
    show(kind, text, { say = true } = {}) {
      el.hidden = false;
      el.dataset.kind = kind;
      el.textContent = text;
      if (say) ctx.speak(text);
    },
    hide() {
      el.hidden = true;
      el.textContent = "";
    },
  };
}

/** Loop item for createItemLoop with calm defaults filled in. */
export function loopItem(item, extra = {}) {
  return { id: item.id, hints: item.hints || DEFAULT_HINTS, misconceptions: item.misconceptions || [], model: item.model || DEFAULT_MODEL, transfer: item.transfer, ...extra };
}

/**
 * Text for a miss. A retry shows the authored misconception hint, else a gentle line that varies with tries.
 * The third miss shows the model: the misconception's own model, else the item's model. A misconception hint is
 * never presented as the model (it is shown first, then the model), so a hint-only misconception stays honest.
 * `pick` is the id the learner chose, used to find the matching misconception.
 */
export function retryText(r, loopItemSpec, pick) {
  const m = loopItemSpec.misconceptions?.find((x) => pick != null && x.pick === pick);
  if (r.kind === "model") {
    const model = m?.model || loopItemSpec.model || DEFAULT_MODEL;
    return m?.hint ? `${m.hint} ${model}` : model;
  }
  const authored = loopItemSpec.misconceptions?.some((x) => x.hint && x.hint === r.text);
  if (authored) return r.text;
  return r.tries > 1 ? "Listen again, then try another spot." : "Try another spot.";
}

/** Append only the nodes that exist (grownUpBox returns null when there is nothing to ask). */
export const appendAll = (parent, ...nodes) => parent.append(...nodes.filter(Boolean));

/** Big picture + word + listen button. */
export function pictureCard(ctx, item, { listenText = item.say || item.word, size = "lg" } = {}) {
  return h(
    "div",
    { class: `st-es-picture st-es-${size}` },
    visualEl(item.visual, "st-es-pic"),
    item.word ? h("p", { class: "st-es-word", "aria-hidden": "false" }, item.word) : null,
    listenText ? speakBtn(ctx, listenText, { label: `Listen: ${listenText}`, iconOnly: true, cls: "st-es-listen" }) : null,
  );
}

/** "Help me": graduated hints, spoken and shown. `getLoop()` returns the current item loop. */
export function helpButton(ctx, getLoop, fb) {
  return h(
    "button",
    {
      type: "button",
      class: "st-btn st-es-help",
      onclick: () => {
        const text = getLoop().nextHint() || DEFAULT_HINTS[0];
        fb.show("hint", text);
      },
    },
    "Help me",
  );
}

export function bigButton(label, onclick, { primary = true } = {}) {
  return h("button", { type: "button", class: `st-btn st-es-big-btn ${primary ? "st-primary" : ""}`.trim(), onclick }, label);
}

export const grownUpBox = (...asks) => {
  const list = asks.filter(Boolean);
  if (!list.length) return null;
  return h("div", { class: "st-es-grownup", role: "note" }, h("strong", {}, "Grown-up: "), list.map((a) => h("span", {}, `${a.ask}${a.notice ? ` Notice: ${a.notice}` : ""} `)));
};
