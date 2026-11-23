// #/vocab/<id>/explore: the Visual Vocabulary Explorer. Word-in-context interaction chosen from the collection's subject.
import { h } from "../../core/dom.js";
import { collectionActions } from "./actions.js";
import { TEMPLATE_LABEL, templateFor } from "./explore-model.js";
import { mountArts, mountMovement } from "./explore-body.js";
import { mountEla } from "./explore-ela.js";
import { mountWordPictureSentence, mountTapToHear } from "./explore-language.js";
import { mountMath } from "./explore-math.js";
import { mountScience } from "./explore-science.js";
import { mountSocial } from "./explore-social.js";
import { collectionHref } from "./source.js";
import { chip, disclosure, speakButton } from "./ui.js";

const MOUNT = {
  "science-process": mountScience,
  "math-quantity": mountMath,
  "ela-context": mountEla,
  "social-relations": mountSocial,
  "arts-describe": mountArts,
  "movement-cues": mountMovement,
  "word-picture-sentence": mountWordPictureSentence,
  "tap-to-hear": mountTapToHear,
};

export function render({ root, params, shell, collection, student }) {
  let current = collection.entries.find((e) => e.id === params.entry) || collection.entries[0];
  const host = h("div", { class: "st-v-xhost" });
  const heading = h("div", { class: "st-v-xword" });
  const picker = h("div", { class: "st-v-picker", role: "group", "aria-label": "Choose a word to explore" });
  const tmpl = h("p", { class: "st-v-meta" });

  const paintPicker = () => {
    picker.replaceChildren(
      ...collection.entries.map((e) => {
        const b = h("button", { class: "st-v-fchip", type: "button", "aria-pressed": String(e.id === current.id), "data-eid": e.id }, e.word);
        b.addEventListener("click", () => {
          current = e;
          shell.replaceHash(collectionHref(collection.id, "explore", { entry: e.id, student: student ? 1 : "" }));
          paint();
          picker.querySelector(`[data-eid="${CSS.escape(e.id)}"]`)?.focus();
          shell.announce(`Exploring ${e.word}.`);
        });
        return b;
      }),
    );
  };

  function paint() {
    paintPicker();
    const template = templateFor(collection, current);
    tmpl.replaceChildren(chip(TEMPLATE_LABEL[template]), chip(`${collection.entries.indexOf(current) + 1} of ${collection.entries.length}`));
    const d = disclosure({ label: "Show the definition", openLabel: "Hide the definition", panelId: "st-v-xdef" });
    d.panel.append(h("p", { class: "st-v-def" }, current.def));
    heading.replaceChildren(h("h2", { class: "st-v-word" }, current.word, current.pos ? h("span", { class: "st-v-pos" }, ` ${current.pos}`) : null, " ", speakButton(current.word, { label: `Hear ${current.word}` })), current.pron ? h("p", { class: "st-v-pron-guide" }, current.pron) : null, d.button, d.panel);
    try {
      MOUNT[template](host, { collection, entry: current, student });
    } catch (err) {
      console.warn("[vocab] explorer template failed", template, err);
      mountWordPictureSentence(host, { collection, entry: current, student });
    }
  }

  root.replaceChildren(
    h(
      "div",
      { class: "st-v-page" },
      h("header", { class: "st-v-head" }, student ? null : h("p", { class: "st-v-crumb" }, h("a", { href: collectionHref(collection.id) }, `Back to ${collection.title}`)), h("h1", {}, `${collection.title}: explore the words`), h("p", { class: "st-v-lead" }, "Work with each word in context. Change it, sort it, say it and write it.")),
      student ? null : collectionActions(collection, shell, "explore"),
      picker,
      tmpl,
      heading,
      host,
      h("p", { class: "st-v-row" }, h("a", { class: "st-v-btn", href: collectionHref(collection.id, "wall", { student: student ? 1 : "" }) }, "Go to the word wall")),
    ),
  );
  paint();
  return () => {};
}
