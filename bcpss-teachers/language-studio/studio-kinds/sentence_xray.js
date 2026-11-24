// sentence_xray — a sentence cut into colour-coded chunks. Tap to hear each chunk and what it does, then rebuild
// the sentence (drag, or select a chunk and press a slot; arrow keys move a placed chunk). Each tone also has a
// label and a shape, so colour is never the only cue. Done = rebuilt correctly.
import { createPicker, enableDrag, h, shuffleNotSame, withFocus } from "./_kit.js";
import { listenControls, slBtn, speakWithHighlight, startKind } from "./_audio.js";

const TONES = {
  concept: { label: "Concept", glyph: "◆" },
  connector: { label: "Connector", glyph: "●" },
  evidence: { label: "Evidence", glyph: "▲" },
  precision: { label: "Precision", glyph: "■" },
};
const toneOf = (c) => TONES[c.tone] || TONES.concept;

export default function mount(root, ctx) {
  const kit = startKind(root, ctx, "sentence_xray");
  const { text, chunks, ask } = ctx.payload;
  const n = chunks.length;
  const pool = shuffleNotSame(ctx, chunks.map((_, i) => i), `${kit.seed}:chunks`);
  const slots = chunks.map(() => null);
  let mode = "hear";
  let heard = null;
  let marks = null; // Set of correct slot positions after a check
  let tries = 0;
  let solved = false;

  const fb = kit.feedback();
  const stage = h("div", { class: "sl-stage" });
  const picker = createPicker({
    place(chip, pos) {
      const old = slots.indexOf(chip);
      if (old >= 0) slots[old] = null;
      slots[pos] = chip;
      marks = null;
    },
    remove(pos) {
      slots[pos] = null;
      marks = null;
    },
    changed: render,
  });

  const body = (i) => [
    h("span", { class: "sl-chunk__tag" }, h("span", { class: "sl-chunk__glyph", "aria-hidden": "true", text: toneOf(chunks[i]).glyph }), toneOf(chunks[i]).label),
    h("span", { class: "sl-chunk__text", text: chunks[i].text }),
  ];
  const chunkBtn = (i, extra = "") => h("button", { type: "button", class: `sl-chunk sl-tone-${chunks[i].tone}${extra}`, "data-key": `c${i}` }, ...body(i));

  function move(from, to) {
    if (to < 0 || to >= n || solved) return;
    [slots[from], slots[to]] = [slots[to], slots[from]];
    marks = null;
    render();
    stage.querySelector(`[data-key="slot${to}"]`)?.focus({ preventScroll: true });
    ctx.announce(`Moved to position ${to + 1} of ${n}.`);
  }

  function check() {
    const right = new Set(slots.map((c, i) => (c !== null && chunks[c].text === chunks[i].text ? i : -1)).filter((i) => i >= 0));
    tries++;
    if (right.size === n) {
      solved = true;
      render();
      fb.set("You rebuilt it. Every chunk is in the right place.", "ok");
      return;
    }
    marks = right;
    render();
    kit.fx(stage.querySelector(".sl-slots"), "sg-shake");
    fb.set(
      right.size
        ? `Not yet. ${right.size} of ${n} chunks are in the right place. Say the sentence in your head: what comes first?`
        : "Not yet. Say the sentence in your head: what does it start with?",
      "no",
    );
  }

  function hearMode() {
    const panel = h("div", { class: "sl-xpanel", "aria-live": "polite" });
    const paint = () => {
      panel.replaceChildren(
        heard === null
          ? h("p", { class: "sl-note", text: "Tap a chunk to hear it and learn its job." })
          : h("div", {}, h("p", { class: "sl-xpanel__role" }, h("b", { text: `${toneOf(chunks[heard]).label}: ` }), chunks[heard].role), chunks[heard].ask ? h("p", { class: "sl-xpanel__ask", text: chunks[heard].ask }) : null),
      );
    };
    const row = h("div", { class: "sl-xray", role: "group", "aria-label": "The sentence, in order" });
    chunks.forEach((c, i) => {
      const b = chunkBtn(i);
      b.setAttribute("aria-pressed", String(heard === i));
      b.addEventListener("click", () => {
        heard = i;
        for (const x of row.children) x.setAttribute("aria-pressed", String(x === b));
        paint();
        speakWithHighlight(c.text, b.querySelector(".sl-chunk__text"));
        ctx.announce(`${toneOf(c).label}: ${c.role}`);
      });
      row.append(b);
    });
    paint();
    return [
      ask ? h("p", { class: "sl-ask", text: ask }) : null,
      row,
      panel,
      listenControls(text, null, { label: "whole sentence" }).el,
      h("div", { class: "sg-actions" }, slBtn("Now rebuild the sentence", { primary: true, key: "to-build", onclick: () => setMode("build") })),
    ];
  }

  function buildMode() {
    const slotEls = slots.map((c, pos) => {
      const filled = c !== null;
      const good = solved || marks?.has(pos);
      const bad = marks && filled && !marks.has(pos);
      const b = h(
        "button",
        {
          type: "button",
          class: `sl-slot${filled ? ` sl-chunk sl-tone-${chunks[c].tone}` : " is-empty"}${picker.active === pos ? " is-active" : ""}${good ? " is-right" : ""}${bad ? " is-no" : ""}`,
          "data-key": `slot${pos}`,
          "data-pos": String(pos),
          "aria-disabled": String(solved),
          "aria-label": filled ? `Position ${pos + 1}. ${toneOf(chunks[c]).label} ${chunks[c].text}${good ? ". In the right place." : bad ? ". Not in the right place yet." : ""}` : `Position ${pos + 1}, empty`,
        },
        filled ? [h("span", { class: "sl-slot__num", "aria-hidden": "true", text: good ? "✓" : bad ? "✕" : String(pos + 1) }), ...body(c)] : [h("span", { class: "sl-slot__num", "aria-hidden": "true", text: String(pos + 1) })],
      );
      b.addEventListener("click", () => !solved && picker.slot(pos, filled));
      b.addEventListener("keydown", (e) => {
        if (!filled || solved || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
        e.preventDefault();
        move(pos, pos + (e.key === "ArrowRight" ? 1 : -1));
      });
      if (filled && !solved) {
        enableDrag(b, { targets: () => [...b.parentElement.children].filter((x) => x !== b), onDrop: (t) => move(pos, Number(t.dataset.pos)) });
      }
      return b;
    });
    const poolEls = pool
      .filter((i) => !slots.includes(i))
      .map((i) => {
        const b = chunkBtn(i);
        b.setAttribute("aria-pressed", String(picker.sel === i));
        b.addEventListener("click", () => picker.chip(i));
        enableDrag(b, { targets: () => [...stage.querySelectorAll(".sl-slot")], onDrop: (t) => picker.drop(i, Number(t.dataset.pos)) });
        return b;
      });
    const filledAll = slots.every((c) => c !== null);
    const actions = h("div", { class: "sg-actions" });
    if (solved) {
      actions.append(slBtn("Finish", { primary: true, key: "finish", onclick: () => kit.finish(tries - 1, n, tries === 1 ? "You rebuilt the sentence on the first try" : `You rebuilt the sentence after ${tries - 1} ${tries === 2 ? "retry" : "retries"}`) }));
    } else {
      actions.append(slBtn("Check my sentence", { primary: true, key: "check", disabled: !filledAll, onclick: check }), slBtn("Back to tap and hear", { ghost: true, key: "to-hear", onclick: () => setMode("hear") }));
    }
    return [
      h("p", { class: "sl-ask", text: solved ? "Read your sentence out loud." : "Select a chunk, then press the slot where it goes. You can also drag. Press a placed chunk to pick it up. Arrow keys move a placed chunk." }),
      h("div", { class: "sl-slots", role: "group", "aria-label": "Your sentence, in order" }, ...slotEls),
      poolEls.length ? h("div", { class: "sl-pool", role: "group", "aria-label": "Chunks to place" }, ...poolEls) : null,
      solved ? h("div", { class: "sl-built" }, h("p", { class: "sl-caption", text: chunks.map((c) => c.text).join(" ") }), listenControls(chunks.map((c) => c.text).join(" "), null, { label: "sentence" }).el, h("ul", { class: "sl-roles" }, ...chunks.map((c) => h("li", {}, h("b", { text: `${toneOf(c).label}: ` }), c.role)))) : null,
      actions,
    ];
  }

  function setMode(m) {
    mode = m;
    render();
  }

  function render() {
    withFocus(root, () => {
      const modes = h(
        "div",
        { class: "sl-modes", role: "group", "aria-label": "How do you want to practice?" },
        slBtn("Tap to hear", { key: "m-hear", pressed: mode === "hear", cls: "sl-mode", onclick: () => setMode("hear") }),
        slBtn("Rebuild it", { key: "m-build", pressed: mode === "build", cls: "sl-mode", onclick: () => setMode("build") }),
      );
      const legend = h("ul", { class: "sl-legend", "aria-label": "Chunk types" }, ...Object.entries(TONES).map(([k, t]) => h("li", { class: `sl-legend__item sl-tone-${k}` }, h("span", { "aria-hidden": "true", text: `${t.glyph} ` }), t.label)));
      stage.replaceChildren(modes, legend, ...(mode === "hear" ? hearMode() : buildMode()), fb.el);
    });
  }

  root.append(stage);
  render();
  return () => kit.destroy();
}
