// Create · the Supports panel in step 2: who the resource is for (level) and individual supports as icon toggles.
// A support that cannot apply to this page (no Spanish words, no pictures in the word list) is shown disabled with the
// reason, instead of being offered and then silently doing nothing.

import { h } from "../studio/editor/ui.js";
import { icon } from "./icons.js";
import { LEVELS, SUPPORTS } from "./supports.js";

/** What this activity has for supports that need data. */
export function supportData(activity) {
  const items = (activity?.blocks || []).filter((b) => b.type === "vocab").flatMap((b) => b.items);
  return {
    spanish: items.some((v) => v.es),
    visuals: items.some((v) => v.image?.src),
    chunk: (activity?.blocks || []).some((b) => b.type === "passage" && b.text.split(/\s+/).length > 80),
  };
}

/**
 * @param {{S: Function, value: {level: string, on: string[]}, data: object, onChange: (v) => void}} env
 */
export function supportsPanel(env) {
  const { S, value, data } = env;
  const set = (next) => env.onChange({ ...value, ...next });
  const levels = h(
    "fieldset.cr-seg.cr-levels",
    h("legend", icon("level", "cr-glyph"), S("Students", "Estudiantes")),
    LEVELS.map((l) =>
      h(
        "label.cr-seg-opt",
        { title: l.hint ? S(l.hint.en, l.hint.es) : "" },
        h("input", {
          type: "radio",
          name: "cr-level",
          value: l.id,
          checked: l.id === value.level,
          onchange: () => set({ level: l.id }),
        }),
        S(l.label.en, l.label.es),
      ),
    ),
  );
  const missing = {
    spanish: S("No Spanish words on this page yet", "Esta página aún no tiene palabras en español"),
    visuals: S("This word list has no pictures yet", "Esta lista de palabras aún no tiene imágenes"),
    chunk: S("The reading is already short", "La lectura ya es corta"),
  };
  const chips = h(
    "fieldset.cr-supports",
    h("legend", S("Supports", "Apoyos")),
    SUPPORTS.map((s) => {
      const blocked = s.id in data && !data[s.id];
      const on = value.on.includes(s.id) && !blocked;
      return h(
        `label.cr-support${on ? ".is-on" : ""}${blocked ? ".is-off" : ""}`,
        { title: blocked ? missing[s.id] : S(s.hint.en, s.hint.es) },
        h("input", {
          type: "checkbox",
          value: s.id,
          checked: on,
          disabled: blocked,
          onchange: (e) =>
            set({
              on: e.target.checked ? [...value.on, s.id] : value.on.filter((x) => x !== s.id),
            }),
        }),
        h("span.cr-support-ico", icon(s.icon)),
        h("span.cr-support-t", S(s.label.en, s.label.es)),
        h("span.cr-support-h", blocked ? missing[s.id] : S(s.hint.en, s.hint.es)),
      );
    }),
  );
  return h(
    "div.cr-support-panel",
    h("h4.cr-sub", S("Student supports", "Apoyos para estudiantes")),
    levels,
    chips,
    h(
      "p.cr-fine",
      S(
        "Supports change how the work is presented, never the questions or answers.",
        "Los apoyos cambian cómo se presenta el trabajo, nunca las preguntas ni las respuestas.",
      ),
    ),
  );
}
