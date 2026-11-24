// dictogloss: listen (slow, then natural) -> jot key words -> rebuild -> self-check -> reveal the text.
import { h, tts, ttsAvailable, wordCount, announce } from "../studio-core.js";
import { icon } from "../studio-icons.js";
import { checklist, stepCard } from "../studio-ui.js";
import { hintLadder } from "./_kit.js";

const pause = (ms) => new Promise((r) => window.setTimeout(r, ms));

export default function mount(root, ctx) {
  const p = ctx.payload;
  const saved = ctx.loadState() || {};
  const st = {
    heard: saved.heard || 0,
    chips: saved.chips || [],
    notes: saved.notes || "",
    rebuild: saved.rebuild || "",
    checks: saved.checks || [],
  };
  const persist = () => ctx.saveState(st);
  let alive = true;
  const canSpeak = ttsAvailable();

  // 1. Listen
  const status = h("p", { class: "ow-status", "aria-live": "polite" });
  const listenBtn = h(
    "button",
    { type: "button", class: "st-btn st-btn--primary st-btn--lg" },
    icon("speaker", 22),
    "Listen",
  );
  const wave = h(
    "div",
    { class: "ow-wave", "aria-hidden": "true" },
    Array.from({ length: 9 }, (_, i) => h("i", { style: `--i:${i}` })),
  );
  // One step at a time: Next / Back move between the four parts. Next from Listen unlocks after the first listen.
  const cards = [];
  const goTo = (i, { focus = true } = {}) => {
    cards.forEach((c, k) => {
      c.hidden = k !== i;
    });
    if (!focus) return;
    const head = cards[i].querySelector("h2");
    head.focus({ preventScroll: true });
    cards[i].scrollIntoView({ block: "start", behavior: "smooth" });
  };
  const navBtn = (label, onclick, { primary = false, forward = false } = {}) => {
    const b = h(
      "button",
      { type: "button", class: `st-btn${primary ? " st-btn--primary st-btn--lg" : ""}` },
      label,
      forward ? icon("arrow", 20) : null,
    );
    b.addEventListener("click", onclick);
    return b;
  };
  const backBtn = (to) => navBtn("Back", () => goTo(to));
  const nextListen = navBtn("Next: Jot key words", () => goTo(1), { primary: true, forward: true });
  nextListen.disabled = !st.heard;
  const unlock = () => {
    nextListen.disabled = false;
  };
  const play = async () => {
    listenBtn.disabled = true;
    wave.classList.add("is-live");
    status.textContent = st.heard === 0 ? "Listening… (slow)" : "Listening… (natural speed)";
    const ok = await tts(p.text, { rate: st.heard === 0 ? 0.8 : 1 });
    wave.classList.remove("is-live");
    if (!alive) return;
    if (!ok)
      status.textContent =
        "Audio did not play. Ask a partner or your teacher to read the story aloud.";
    else {
      st.heard += 1;
      persist();
      status.textContent =
        st.heard === 1
          ? "Heard once. Jot some words, then listen again!"
          : `Heard ${st.heard} times. Great listening!`;
    }
    listenBtn.disabled = false;
    listenBtn.lastChild.textContent = st.heard ? "Listen again" : "Listen";
    unlock();
    announce(status.textContent);
  };
  listenBtn.addEventListener("click", play);
  const fallback = canSpeak
    ? null
    : h(
        "div",
        { class: "st-feedback" },
        h(
          "span",
          null,
          "Your device cannot read aloud. Your teacher or partner reads the story twice. ",
          h(
            "button",
            {
              type: "button",
              class: "st-btn st-btn--sm",
              onclick: () => {
                st.heard = Math.max(st.heard, 1);
                persist();
                unlock();
              },
            },
            "I listened",
          ),
        ),
      );
  const stepListen = stepCard(1, "Listen", [
    h(
      "p",
      { class: "ow-lead" },
      "Listen to the story two times. Do not write whole sentences — just catch the important words.",
    ),
    h("div", { class: "ow-listen" }, listenBtn, wave),
    status,
    fallback,
    h("div", { class: "ow-bar" }, nextListen),
  ]);

  // 2. Jot
  const chipBtns = p.key_words.map((w, i) => {
    const b = h(
      "button",
      { type: "button", class: "st-chip", "aria-pressed": String(st.chips.includes(i)) },
      w,
    );
    b.addEventListener("click", () => {
      const on = !st.chips.includes(i);
      st.chips = on ? [...st.chips, i] : st.chips.filter((x) => x !== i);
      b.setAttribute("aria-pressed", String(on));
      persist();
    });
    return b;
  });
  const notes = h("textarea", {
    class: "ow-area",
    rows: "3",
    "aria-label": "My notes",
    placeholder: "Jot key words and numbers here…",
  });
  notes.value = st.notes;
  notes.addEventListener("input", () => {
    st.notes = notes.value;
    persist();
  });
  const stepJot = stepCard(
    2,
    "Jot key words",
    [
      h("p", { class: "ow-lead" }, "Tap the words you heard."),
      h("div", { class: "ow-chips" }, chipBtns),
      notes,
      h(
        "div",
        { class: "ow-bar" },
        backBtn(0),
        navBtn("Next: Rebuild the story", () => goTo(2), { primary: true, forward: true }),
      ),
    ],
    { locked: true },
  );

  // 3. Rebuild
  const rebuild = h("textarea", {
    class: "ow-area ow-area--big",
    rows: "6",
    "aria-label": "My retelling",
  });
  rebuild.value = st.rebuild;
  const count = h("span", { class: "ow-count" });
  const revealBtn = h(
    "button",
    { type: "button", class: "st-btn", disabled: true },
    icon("eye", 18),
    "Next: Check my ideas",
  );
  const refreshCount = () => {
    const n = wordCount(rebuild.value);
    count.textContent = `${n} word${n === 1 ? "" : "s"}`;
    revealBtn.disabled = n < 8;
  };
  rebuild.addEventListener("input", () => {
    st.rebuild = rebuild.value;
    persist();
    refreshCount();
  });
  const stepRebuild = stepCard(
    3,
    "Rebuild the story",
    [
      h(
        "p",
        { class: "ow-lead" },
        "Write the story again in your own words. Use the frame to start.",
      ),
      h("p", { class: "ow-frame" }, h("span", null, "Frame"), p.frame),
      rebuild,
      h("div", { class: "ow-bar" }, backBtn(1), count, revealBtn),
    ],
    { locked: true },
  );
  refreshCount();

  // 4. Check + reveal
  const finish = h(
    "button",
    { type: "button", class: "st-btn st-btn--primary st-btn--lg" },
    "I'm done",
  );
  const list = checklist(p.checks, {
    saved: st.checks,
    onChange: (s) => {
      st.checks = s;
      persist();
    },
  });
  const textBox = h(
    "div",
    { class: "ow-reveal", hidden: true },
    h("p", { class: "sh-eyebrow" }, "The original text"),
    h("p", null, p.text),
  );
  const textBtn = h(
    "button",
    { type: "button", class: "st-btn" },
    icon("eye", 18),
    "Reveal the text",
  );
  textBtn.addEventListener("click", () => {
    textBox.hidden = !textBox.hidden;
    textBtn.lastChild.textContent = textBox.hidden ? "Reveal the text" : "Hide the text";
  });
  const stepCheck = stepCard(
    4,
    "Check my ideas",
    [
      h(
        "p",
        { class: "ow-lead" },
        "Did your retelling include each idea? Tick the ones you wrote.",
      ),
      list.el,
      h("div", { class: "ow-bar" }, backBtn(2), textBtn, finish),
      textBox,
    ],
    { locked: true },
  );
  revealBtn.addEventListener("click", () => goTo(3));
  finish.addEventListener("click", () => {
    const ticked = list.state().filter(Boolean).length;
    const ratio = ticked / p.checks.length;
    ctx.done({
      stars: ratio === 1 ? 3 : ratio >= 0.5 ? 2 : 1,
      detail: `You included ${ticked} of ${p.checks.length} key ideas.`,
    });
  });

  // Never the story: how to listen, what to look for, and the frame the rebuild already shows.
  const hints = hintLadder(ctx, () => [
    "Listen for numbers, names and action words. You do not need every word.",
    `Look at the ${p.key_words.length} key words in step 2. Tap each one you hear, then add numbers to your notes.`,
    `Start your retelling with the frame: “${p.frame}” Add one idea at a time, then read it back.`,
  ]);
  cards.push(stepListen, stepJot, stepRebuild, stepCheck);
  for (const c of cards) c.querySelector("h2").tabIndex = -1;
  root.append(h("div", { class: "ow-steps" }, hints, ...cards));
  goTo(0, { focus: false });
  return () => {
    alive = false;
  };
}
