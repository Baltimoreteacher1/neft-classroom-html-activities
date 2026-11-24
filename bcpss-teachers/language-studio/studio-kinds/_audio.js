// Lesson-companion kinds (flash_retrieval, listen_and_show, sentence_xray, speak_and_record, exit_check,
// point_and_say, tpr_cards, home_language_bridge): shared audio + small UI helpers. Not a kind itself.
// Audio: browser speechSynthesis at normal (0.95) and slow (0.7), word-by-word highlight from `boundary` events,
// text always visible as the caption, graceful fallback when speech is unavailable. No timers are shown to students.
import { ttsAvailable } from "../studio-core.js";
import { cap, createKit, h, icon } from "./_kit.js";

export const RATE = { normal: 0.95, slow: 0.7 };
export const audioAvailable = () => ttsAvailable();

let token = 0;
export function stopAudio() {
  token++;
  if (ttsAvailable()) window.speechSynthesis.cancel();
}

const wordsOf = (text) =>
  [...String(text).matchAll(/\S+/g)].map((m) => ({
    start: m.index,
    end: m.index + m[0].length,
    word: m[0],
  }));

/** Put `text` into `el` as one span per word (so a spoken word can be highlighted). Returns the spans. */
export function renderWords(el, text) {
  const spans = wordsOf(text).map((w) => h("span", { class: "sl-word", text: w.word }));
  el.replaceChildren(...spans.flatMap((s, i) => (i ? [" ", s] : [s])));
  return spans;
}

/** Speak `text`; highlight each word in `el` as it is spoken. Resolves true when finished, false if speech is unavailable or was interrupted. */
export function speakWithHighlight(text, el, { rate = RATE.normal, lang = "en-US" } = {}) {
  const words = wordsOf(text);
  const spans = el ? renderWords(el, text) : [];
  if (!ttsAvailable() || !words.length) return Promise.resolve(false);
  const mine = ++token;
  window.speechSynthesis.cancel();
  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(String(text));
    utter.rate = rate;
    utter.lang = lang;
    let done = false;
    const clear = () => {
      for (const s of spans) s.classList.remove("is-on");
    };
    // Safety net for browsers with no voices that never fire "end" (not a visible timer).
    const guard = window.setTimeout(() => finish(false), 4000 + (text.length * 110) / rate);
    function finish(ok) {
      if (done) return;
      done = true;
      window.clearTimeout(guard);
      clear();
      el?.classList.remove("is-reading");
      resolve(ok && mine === token);
    }
    utter.onboundary = (e) => {
      if (mine !== token || (e.name && e.name !== "word")) return;
      const i = words.findIndex((w) => e.charIndex >= w.start && e.charIndex < w.end);
      if (i < 0) return;
      clear();
      spans[i]?.classList.add("is-on");
    };
    utter.onend = () => finish(true);
    utter.onerror = () => finish(false);
    el?.classList.add("is-reading");
    window.speechSynthesis.speak(utter);
  });
}

// ---------- small UI helpers ----------
/** Standard button. opts: primary, ghost, label (aria-label), key (data-key), icon (kit icon name), cls, pressed, disabled. */
export function slBtn(text, o = {}) {
  const cls = `st-btn${o.primary ? " st-btn--primary st-btn--lg" : ""}${o.ghost ? " st-btn--ghost" : ""} sl-btn${o.cls ? ` ${o.cls}` : ""}`;
  const b = h(
    "button",
    {
      type: "button",
      class: cls,
      "data-key": o.key,
      "aria-label": o.label,
      "aria-pressed": o.pressed == null ? null : String(o.pressed),
      disabled: o.disabled ? true : null,
    },
    o.icon ? icon(o.icon) : null,
    text,
  );
  if (o.onclick) b.addEventListener("click", o.onclick);
  return b;
}

/** An emoji icon (or "" when the icon is an id we cannot draw, or missing). */
export const emojiOf = (value) => {
  const t = String(value || "").trim();
  return t && /[^\x00-\x7f]/.test(t) ? t : "";
};
export const iconNode = (value, cls = "sl-icon") =>
  emojiOf(value) ? h("span", { class: cls, "aria-hidden": "true", text: emojiOf(value) }) : null;

/** createKit + the lesson-kind root classes + projector mode (ctx.projector or class sl-projector). */
export function startKind(root, ctx, kind) {
  const kit = createKit(root, ctx, kind);
  root.classList.add("sl", `sl--${kind}`);
  if (ctx.projector) root.classList.add("sl-projector");
  const destroy = kit.destroy;
  kit.destroy = () => {
    stopAudio();
    destroy();
  };
  return kit;
}

/**
 * Listen (normal) + Listen slowly buttons for `text`. `caption` (optional) gets word-by-word highlight.
 * onHeard fires once, when the first listen starts (or at once if audio is unavailable, so text is never hidden).
 */
export function listenControls(text, caption, { label = "sentence", lang, onHeard } = {}) {
  const wrap = h("div", {
    class: "sl-listen",
    role: "group",
    "aria-label": `Listen to the ${label}`,
  });
  if (!audioAvailable()) {
    wrap.append(
      h("p", {
        class: "sl-note",
        text: "Audio is not available on this device. Read the words instead.",
      }),
    );
    onHeard?.();
    return { el: wrap, available: false };
  }
  let heard = false;
  const play = (rate) => {
    if (!heard) {
      heard = true;
      onHeard?.();
    }
    wrap.classList.add("is-speaking");
    speakWithHighlight(text, caption, { rate, lang }).finally(() =>
      wrap.classList.remove("is-speaking"),
    );
  };
  wrap.append(
    slBtn("Listen", {
      icon: "speaker",
      cls: "sl-listen__go",
      label: `Listen to the ${label}`,
      onclick: () => play(RATE.normal),
    }),
    slBtn("Listen slowly", {
      ghost: true,
      cls: "sl-listen__slow",
      label: `Listen slowly to the ${label}`,
      onclick: () => play(RATE.slow),
    }),
  );
  return { el: wrap, available: true };
}

const LETTERS = ["A", "B", "C", "D"];
/**
 * Multiple choice for one item. Wrong picks teach (a nudge, never the answer); the `why` shows after the right pick.
 * o: { options: [string | {label, icon}], answer, why, hint, label, nextLabel, onNext({wrong}), retry, gate() -> string|"" }
 */
export function choiceStage(kit, o) {
  const wrong = new Set();
  const gone = new Set();
  let solved = false;
  const fb = kit.feedback();
  const labels = o.options.map((x) => (typeof x === "string" ? x : x.label));
  const btns = o.options.map((opt, k) => {
    const emoji = typeof opt === "object" ? iconNode(opt.icon, "sl-opt__icon") : null;
    const b = h(
      "button",
      { type: "button", class: "sl-opt", "data-key": `o${k}` },
      h("span", { class: "sl-opt__mark", "aria-hidden": "true" }),
      emoji,
      h("span", { class: "sl-opt__text", text: labels[k] }),
    );
    b.addEventListener("click", () => pick(k));
    return b;
  });
  const list = h(
    "div",
    { class: "sl-options", role: "group", "aria-label": o.label || "Choices" },
    ...btns,
  );
  const extra = h("div", { class: "sl-extra" });
  const actions = h("div", { class: "sg-actions" });
  const hintBtn = o.hint
    ? slBtn("Hint", {
        ghost: true,
        key: "hint",
        label: "Hint: take away one choice",
        onclick: useHint,
      })
    : null;
  if (hintBtn) actions.append(hintBtn);

  const open = () =>
    labels.map((_, k) => k).filter((k) => k !== o.answer && !wrong.has(k) && !gone.has(k));
  function paint() {
    btns.forEach((b, k) => {
      const bad = wrong.has(k);
      const out = gone.has(k);
      const good = solved && k === o.answer;
      b.classList.toggle("is-ok", good);
      b.classList.toggle("is-no", bad);
      b.classList.toggle("is-out", out);
      b.querySelector(".sl-opt__mark").textContent = good
        ? "✓"
        : bad
          ? "✕"
          : out
            ? "–"
            : LETTERS[k];
      b.setAttribute("aria-disabled", String(bad || out || solved));
      b.setAttribute(
        "aria-label",
        `${LETTERS[k]}. ${labels[k]}${good ? ". Correct." : bad ? ". Not this one." : out ? ". The hint says this does not fit." : ""}`,
      );
    });
    if (hintBtn) hintBtn.disabled = solved || open().length < 2;
  }
  function useHint() {
    const k = open()[0];
    if (solved || open().length < 2) return;
    gone.add(k);
    paint();
    fb.set("Hint: one choice does not fit. Read the others again.", "hint");
  }
  function pick(k) {
    if (solved || wrong.has(k) || gone.has(k)) return;
    const gate = o.gate?.();
    if (gate) return fb.set(gate, "hint");
    if (k === o.answer) {
      solved = true;
      paint();
      kit.fx(btns[k], "sg-pop");
      fb.set(wrong.size ? "You got it. Read why below." : "Yes! That is right.", "ok");
      extra.append(h("p", { class: "sl-why" }, h("b", { text: "Why: " }), o.why || ""));
      const next = slBtn(o.nextLabel || "Next", {
        primary: true,
        key: "next",
        onclick: () => o.onNext({ wrong: wrong.size }),
      });
      actions.replaceChildren(next);
      next.focus({ preventScroll: true });
      return;
    }
    wrong.add(k);
    paint();
    kit.fx(btns[k], "sg-shake");
    fb.set(o.retry || "Not this one yet. Read it again, then try another choice.", "no");
  }
  paint();
  return { el: h("div", { class: "sl-choice" }, list, fb.el, extra, actions) };
}

/**
 * One item at a time with a "done" confirmation button (point_and_say, tpr_cards, home_language_bridge).
 * o: { items, noun, confirmLabel, praise(item), render(item, i) -> element (put data-focus on its heading), detail(n) }
 */
export function stepThrough(root, ctx, kit, o) {
  const { items, noun } = o;
  const dots = kit.dots(items.length, `${cap(noun)} progress`);
  const stage = h("div", { class: "sl-stage" });
  root.append(h("div", { class: "sg-topbar" }, dots.el), stage);
  let i = 0;
  const show = () => {
    items.forEach((_, k) => dots.set(k, k < i ? "ok" : k === i ? "now" : ""));
    dots.label(`${cap(noun)} ${i + 1} of ${items.length}`);
    const fb = kit.feedback();
    const card = o.render(items[i], i);
    const last = i + 1 >= items.length;
    const actions = h("div", { class: "sg-actions" });
    actions.append(
      slBtn(o.confirmLabel, {
        primary: true,
        key: "confirm",
        onclick: () => {
          dots.set(i, "ok");
          fb.set(o.praise(items[i]), "ok");
          const next = slBtn(last ? "Finish" : "Next", {
            primary: true,
            key: "next",
            onclick: () => {
              if (last) return kit.finish(0, items.length, o.detail(items.length));
              i++;
              show();
            },
          });
          actions.replaceChildren(next);
          next.focus({ preventScroll: true });
        },
      }),
    );
    stage.replaceChildren(
      h("p", { class: "sl-count", text: `${cap(noun)} ${i + 1} of ${items.length}` }),
      card,
      fb.el,
      actions,
    );
    card.querySelector("[data-focus]")?.focus({ preventScroll: true });
  };
  show();
  return () => kit.destroy();
}
