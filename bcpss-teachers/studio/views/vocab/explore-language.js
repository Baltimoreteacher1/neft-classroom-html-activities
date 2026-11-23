// Language-first templates: word-picture-sentence (world languages, ESOL, inclusion) and tap-to-hear (kindergarten and grade 1).
import { announce, h } from "../../core/dom.js";
import { cloze, pictureOptions } from "./explore-model.js";
import { choiceTask, feedbackLine, panel, useWord } from "./explore-common.js";
import { visualSvg } from "./visual.js";
import { speakButton } from "./ui.js";
import { spanishFor } from "./model.js";

function pictureChoice(e, collection) {
  const opts = pictureOptions(e, collection);
  const fb = feedbackLine();
  let solved = false;
  const row = h("div", { class: "st-v-reps", role: "group", "aria-label": "Pictures to choose from" });
  opts.forEach((o, i) => {
    const b = h("button", { class: "st-v-rep", type: "button", "aria-label": `Picture ${i + 1}: ${o.visual.alt}` }, h("span", { class: "st-v-rep-art", html: visualSvg(o.visual), "aria-hidden": "true" }), h("span", { class: "st-v-rep-label" }, `Picture ${i + 1}`));
    b.addEventListener("click", () => {
      if (solved) return;
      if (o.ok) {
        solved = true;
        b.dataset.state = "right";
        fb.show("right", `That is ${e.word}: ${e.def}`);
        announce(`Correct. ${e.word}.`);
      } else {
        b.dataset.state = "wrong";
        b.disabled = true;
        fb.show("retry", "Listen to the word again, then look at each picture.");
      }
    });
    row.append(b);
  });
  return h("div", { class: "st-v-task" }, h("p", { class: "st-v-prompt" }, `Which picture shows "${e.word}"?`), row, fb.el);
}

export function mountWordPictureSentence(host, { collection, entry: e, student }) {
  const es = spanishFor(e, { student });
  const panels = [
    panel(
      "Hear the word",
      "Press the speaker, then say the word out loud.",
      h("div", { class: "st-v-hearword" }, h("p", { class: "st-v-bigword" }, e.word, " ", speakButton(e.word, { label: `Hear ${e.word}`, cls: "st-v-big" })), e.pron ? h("p", { class: "st-v-pron-guide" }, e.pron) : null, es ? h("p", { class: "st-v-bigword-es", lang: "es" }, es.word, " ", speakButton(es.word, { label: `Hear ${es.word} in Spanish`, lang: "es-US" })) : null),
    ),
  ];
  if (e.visual && collection.entries.filter((x) => x.visual).length >= 2) panels.push(panel("Match the word to a picture", "", pictureChoice(e, collection)));
  const c = cloze(e, collection);
  if (c) {
    panels.push(
      panel(
        "Finish the sentence",
        "Choose the word that fits.",
        choiceTask({ prompt: c.sentence, choices: c.options.map((o) => ({ ...o, feedback: "Read the sentence again. Which word makes sense?" })), explanation: e.context }),
      ),
    );
  }
  panels.push(panel("Say it and write it", "", useWord(e)));
  host.replaceChildren(...panels);
}

export function mountTapToHear(host, { collection, entry: e }) {
  const tiles = h("div", { class: "st-v-taptiles", role: "group", "aria-label": "Words. Tap one to hear it." });
  const live = h("p", { class: "st-v-fb", role: "status", "aria-live": "polite" }, "Tap a picture to hear its word.");
  for (const x of collection.entries) {
    const b = h("button", { class: "st-v-taptile", type: "button", "aria-label": `${x.word}. Tap to hear.` }, x.visual ? h("span", { class: "st-v-rep-art", html: visualSvg(x.visual), "aria-hidden": "true" }) : null, h("span", { class: "st-v-taplabel" }, x.word));
    b.addEventListener("click", async () => {
      live.textContent = `${x.word}`;
      const { speak, canSpeak } = await import("../../core/speech.js");
      if (canSpeak()) speak(x.word, { rate: 0.8 });
    });
    tiles.append(b);
  }
  const game = h("div", {});
  const render = () => {
    if (!e.visual) return game.replaceChildren();
    const opts = pictureOptions(e, collection, 3);
    const fb = feedbackLine();
    let solved = false;
    const row = h("div", { class: "st-v-reps", role: "group", "aria-label": "Pictures to choose from" });
    opts.forEach((o, i) => {
      const b = h("button", { class: "st-v-rep", type: "button", "aria-label": `Picture ${i + 1}: ${o.visual.alt}` }, h("span", { class: "st-v-rep-art", html: visualSvg(o.visual), "aria-hidden": "true" }));
      b.addEventListener("click", () => {
        if (solved) return;
        if (o.ok) {
          solved = true;
          b.dataset.state = "right";
          fb.show("right", `That is ${e.word}.`);
        } else {
          b.dataset.state = "wrong";
          b.disabled = true;
          fb.show("retry", "Listen again and try another picture.");
        }
      });
      row.append(b);
    });
    game.replaceChildren(h("div", { class: "st-v-task" }, h("p", { class: "st-v-prompt" }, "Press the speaker. Tap the picture you hear."), h("p", {}, speakButton(e.word, { label: "Hear the word", cls: "st-v-big" })), row, fb.el));
  };
  render();
  host.replaceChildren(panel("Tap to hear", "Every picture says its word.", tiles, live), panel("Find the picture", "", game), panel("Say it", "", useWord(e)));
}
