// Academic Language Support panel (an editor side tab): the supports that make sense for THIS activity, each added
// with one click and undone with the store's own Undo. Unavailable supports say why instead of writing generic text.
// All wording and logic live in x/language-support.js; this file only draws them.

import { addLanguageSupport, languageSupportOptions } from "../x/language-support.js";
import { button, clear, h, say, toggle } from "./ui.js";

/** Returns { el, render, destroy }. Mount `el` in a tab and call render() when the tab opens. */
export function createLanguagePanel(store, { S }) {
  const el = h("div.st-panel-body.st-lang");
  let bilingual = null; // null = follow the activity's Spanish setting
  let last = null; // { label, review, count }: the most recent addition made in this panel
  const useSpanish = () => bilingual ?? store.get().supports.spanish === true;
  const text = (p) => S(p.en, p.es);

  function add(option) {
    const before = store.get();
    const result = addLanguageSupport(before, option.id, { bilingual: useSpanish() });
    if (!result.ok) {
      last = { label: text(option.label), review: result.review, failed: true };
    } else {
      store.replace(result.activity, "structure");
      last = { label: text(option.label), review: result.review, failed: false };
      say(
        S(
          `Added: ${option.label.en}. You can undo.`,
          `Agregado: ${option.label.es}. Puedes deshacer.`,
        ),
      );
    }
    render();
    el.querySelector(".st-lang-result")?.focus();
  }

  function undo() {
    if (store.undo()) say(S("Undone.", "Deshecho."));
    last = null;
    render();
  }

  function result() {
    if (!last) return null;
    return h(
      "div.st-lang-result",
      { tabindex: "-1", role: "status" },
      h(
        "p",
        h("strong", last.failed ? S("Not added: ", "No se agregó: ") : S("Added: ", "Agregado: ")),
        last.label,
      ),
      last.failed
        ? null
        : button(S("Undo", "Deshacer"), undo, "small", { "data-act": "lang-undo" }),
      h("h3.st-sub", S("Please review", "Por favor revisa")),
      h(
        "ul",
        last.review.map((r) => h("li", text(r))),
      ),
    );
  }

  function row(o) {
    const status = o.done
      ? h("span.st-hint", S("Added", "Agregado"))
      : o.available
        ? button(S("Add", "Agregar"), () => add(o), "small", {
            "data-option": o.id,
            "aria-label": S(`Add ${o.label.en}`, `Agregar ${o.label.es}`),
          })
        : null;
    return h(
      "li.st-row",
      { "data-option": o.id, "data-available": String(o.available) },
      h("div", h("strong", text(o.label)), h("p.st-hint", text(o.what))),
      status,
      !o.available && o.reason
        ? h("p.st-hint", S("Not available: ", "No disponible: "), text(o.reason))
        : null,
    );
  }

  function render() {
    const activity = store.get();
    const options = languageSupportOptions(activity, { bilingual: useSpanish() });
    clear(el).append(
      h("h2.st-sub", S("Academic language support", "Apoyo de lenguaje académico")),
      h(
        "p.st-hint",
        S(
          "Each support is built only from this activity's own words, reading and questions. It never changes your questions or answers, and it is marked as added so you can find it.",
          "Cada apoyo se crea solo con las palabras, la lectura y las preguntas de esta actividad. Nunca cambia tus preguntas ni tus respuestas, y queda marcado como agregado para que lo encuentres.",
        ),
      ),
      toggle(
        S("Add Spanish under the English", "Agregar español debajo del inglés"),
        useSpanish(),
        (v) => {
          bilingual = v;
          render();
        },
        S(
          "The Spanish is a draft and has not been reviewed by a native speaker.",
          "El español es un borrador y no lo ha revisado un hablante nativo.",
        ),
      ),
      result(),
      h("ul.st-rows", options.map(row)),
    );
  }

  const stop = store.subscribe((_a, reason) => {
    if (reason === "undo" || reason === "redo") last = null;
    if (el.isConnected && reason !== "type") render();
  });
  return { el, render, destroy: stop };
}
