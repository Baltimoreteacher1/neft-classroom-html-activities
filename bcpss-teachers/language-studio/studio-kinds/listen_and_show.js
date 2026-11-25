// listen_and_show — hear a sentence, tap what it describes. Audio first (never autoplays); the text appears
// after the first listen. Wrong picks nudge; the "why" shows after the right pick. A hint button removes one choice.
// Listening Lab (payload.transcript === "toggle", payload.mode "choose" | "sort"): the words are shown from the start
// for WIDA levels 1-2 and hidden for levels 3-6, with a Show/Hide transcript button; a replay counter is shown.
// payload.prompt / groupLabel override the wording; the activity's derived.notice is shown as a draft note.
import { h, hintLadder } from "./_kit.js";
import { choiceStage, listenControls, startKind } from "./_audio.js";
import { playCounter, transcriptToggle } from "./_listen.js";

export default function mount(root, ctx) {
  const kit = startKind(root, ctx, "listen_and_show");
  const { items } = ctx.payload;
  const lab = ctx.payload.transcript === "toggle";
  let pos = 0;
  let missed = 0;

  const dots = kit.dots(items.length, "Progress");
  const stage = h("div", { class: "sl-stage" });
  // Lab: a three-step hint ladder (a nudge, a way to think, a way to narrow down), never the answer itself.
  const hints = lab
    ? hintLadder(ctx, () => [
        "Press Listen again, or Listen slowly. Catch the key words.",
        ctx.payload.mode === "sort"
          ? "Say it in your own words. What is it about? Which group is about that?"
          : "Say the meaning in your own words. Which word means that?",
        "Cross off a choice that cannot be right. Then compare the ones that are left.",
      ])
    : null;
  root.append(h("div", { class: "sg-topbar" }, dots.el), ...(hints ? [hints] : []), stage);

  function show() {
    const it = items[pos];
    items.forEach((_, k) => dots.set(k, k < pos ? "ok" : k === pos ? "now" : ""));
    dots.label(`Sentence ${pos + 1} of ${items.length}`);
    let heard = false;
    hints?.reset();
    const plays = lab ? playCounter() : null;
    const caption = h("p", { class: "sl-caption", id: "slCaption", hidden: true, text: it.say });
    const listen = listenControls(it.say, caption, {
      label: "sentence",
      onHeard: () => {
        heard = true;
        if (!lab) caption.hidden = false;
      },
      onPlay: plays?.set,
    });
    // Lab: the toggle owns the caption (default by level); with no speech on the device the words are always shown.
    const transcript = lab
      ? transcriptToggle({ text: it.say, level: ctx.level, available: listen.available, caption })
      : null;
    const prompt = h("h3", {
      class: "sl-prompt",
      tabindex: "-1",
      "data-focus": "",
      text: ctx.payload.prompt || "Listen. Then tap what the sentence is about.",
    });
    const choice = choiceStage(kit, {
      options: it.options,
      answer: it.answer,
      why: it.why,
      hint: !lab,
      label: lab ? ctx.payload.groupLabel || "Choices" : "What is the sentence about?",
      retry: "Not this one yet. Listen again, slowly if you like, then try another choice.",
      gate: () => (heard ? "" : "Press Listen first, then choose."),
      nextLabel: pos + 1 >= items.length ? "Finish" : "Next",
      onNext: ({ wrong }) => {
        if (wrong) missed++;
        if (pos + 1 >= items.length) {
          return kit.finish(missed, items.length, `${items.length - missed} of ${items.length} right on the first try`);
        }
        pos++;
        show();
      },
    });
    const draft = lab && ctx.activity?.derived?.notice ? h("p", { class: "sl-note ll-draft", text: ctx.activity.derived.notice }) : null;
    stage.replaceChildren(
      ...[
        h("p", {
          class: lab ? "sl-count ll-count" : "sl-count",
          text: `Sentence ${pos + 1} of ${items.length}`,
        }),
        prompt,
        listen.el,
        plays?.el,
        transcript ? transcript.el : caption,
        choice.el,
        draft,
      ].filter(Boolean),
    );
    prompt.focus({ preventScroll: true });
  }

  show();
  return () => kit.destroy();
}
