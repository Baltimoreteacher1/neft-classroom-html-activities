// The other two tabs and the hidden "More options": Look & Feel (four finished looks), Student Supports (plain
// switches), and More Options (everything a typical teacher never needs). Every setting writes straight into the
// activity model; nothing here is a separate configuration.

import { convertActivity } from "../core/convert.js";
import { KINDS, STYLES, TEMPLATES } from "../core/schema.js";
import { supportsForWida } from "../core/generate.js";
import { duplicateActivity, revisionActivity, revisions } from "../drafts.js";
import { button, disclosure, field, h, select, say, textArea, textInput, toggle } from "./ui.js";

const LOOKS = {
  classic: ["Clean & Classic", "Limpio y clásico", "Plain, paper-like, easy to read."],
  playful: ["Bright & Playful", "Brillante y divertido", "Friendly colors and rounded shapes."],
  calm: ["Calm & Focused", "Tranquilo y enfocado", "Soft colors, little motion."],
  adventure: ["Game Adventure", "Aventura de juego", "Bold, game-like and energetic."],
};
const ACCENTS = ["", "#0b6b6f", "#1d4ed8", "#9a3412", "#475569", "#166534", "#b42318"];
const KIND_LABEL = { interactive: ["Interactive activity", "Actividad interactiva"], worksheet: ["Worksheet", "Hoja de trabajo"], game: ["Learning game", "Juego de aprendizaje"], check: ["Quick check", "Revisión rápida"] };

const set = (store, mutate, key = "") => store.apply(mutate, { coalesce: key, reason: "structure" });

export function lookPanel(store, { S }) {
  const a = store.get();
  const group = h("div.st-looks", { role: "radiogroup", "aria-label": S("Look", "Aspecto") });
  for (const style of STYLES) {
    const [en, es, text] = LOOKS[style];
    group.append(h("label.st-look", { "data-style": style }, h("input", { type: "radio", name: "st-look", checked: a.look.style === style, onchange: () => set(store, (d) => (d.look.style = style)) }), h("span.st-swatch", { "aria-hidden": "true" }), h("strong", S(en, es)), h("small", text)));
  }
  const accent = h("div.st-accents", { role: "radiogroup", "aria-label": S("Accent color", "Color de acento") }, ACCENTS.map((c) => h("label.st-accent", h("input", { type: "radio", name: "st-accent", checked: a.look.accent === c, onchange: () => set(store, (d) => (d.look.accent = c)) }), h("span", { style: c ? `background:${c}` : "", "aria-hidden": "true" }), h("span.st-sr", c || S("Default", "Predeterminado")))));
  return h(
    "div.st-panel-body",
    group,
    field(S("Accent color (optional)", "Color de acento (opcional)"), accent, S("We keep text readable whatever you choose.", "Mantenemos el texto legible sea cual sea su elección.")),
    field(S("Change layout", "Cambiar el diseño"), select(TEMPLATES[a.kind].map((t) => [t.id, S(t.en, t.es)]), a.template, (v) => set(store, (d) => (d.template = v)))),
  );
}

export function supportsPanel(store, { S }) {
  const a = store.get();
  const s = a.supports;
  const flag = (key, en, es, hint) => toggle(S(en, es), s[key], (v) => set(store, (d) => (d.supports[key] = v)), hint ? S(...hint) : "");
  const level = select(
    [["0", S("Not set", "Sin definir")], ["1", S("Needs the most support (WIDA 1–2)", "Necesita más apoyo (WIDA 1–2)")], ["3", S("Some support (WIDA 3–4)", "Algo de apoyo (WIDA 3–4)")], ["5", S("Light support (WIDA 5–6)", "Poco apoyo (WIDA 5–6)")]],
    String(s.wida <= 0 ? 0 : s.wida <= 2 ? 1 : s.wida <= 4 ? 3 : 5),
    (v) => set(store, (d) => (d.supports = supportsForWida(Number(v), { spanish: d.supports.spanish }))),
    { "aria-label": S("Language support level", "Nivel de apoyo de lenguaje") },
  );
  return h(
    "div.st-panel-body",
    flag("visuals", "Show pictures with new words", "Mostrar imágenes con palabras nuevas"),
    flag("spanish", "Add Spanish support", "Añadir apoyo en español", ["Spanish appears beside English words. English stays the learning target.", "El español aparece junto a las palabras en inglés. El inglés sigue siendo la meta."]),
    flag("readAloud", "Read directions and questions aloud", "Leer en voz alta las instrucciones y preguntas", ["Uses the device's voice. It is not official ACCESS audio.", "Usa la voz del dispositivo. No es el audio oficial de ACCESS."]),
    flag("frames", "Add sentence frames", "Añadir marcos de oración"),
    flag("hints", "Allow hints", "Permitir pistas"),
    flag("chunk", "Show reading one part at a time", "Mostrar la lectura una parte a la vez"),
    field(S("Adjust language support", "Ajustar el apoyo de lenguaje"), level, S("This only changes the supports above. It never makes the learning easier.", "Esto solo cambia los apoyos de arriba. Nunca hace el aprendizaje más fácil.")),
    disclosure(S("Choose an exact WIDA level", "Elegir un nivel WIDA exacto"), select([["0", S("Not set", "Sin definir")], ["1", "1 · Entering"], ["2", "2 · Emerging"], ["3", "3 · Developing"], ["4", "4 · Expanding"], ["5", "5 · Bridging"], ["6", "6 · Reaching"]], String(s.wida), (v) => set(store, (d) => (d.supports = supportsForWida(Number(v), { spanish: d.supports.spanish }))), { "aria-label": "WIDA" })),
  );
}

/** More options: advanced, closed by default. `actions` = { onDuplicate, onSwitched, onRestore }. */
export function moreOptions(store, { S, notify }) {
  const a = store.get();
  const body = [];
  body.push(toggle(S("Let students fix and try again", "Permitir que los estudiantes corrijan e intenten de nuevo"), a.options.revise, (v) => set(store, (d) => (d.options.revise = v))));
  body.push(toggle(S("Mix up the order of choices", "Mezclar el orden de las opciones"), a.options.shuffle, (v) => set(store, (d) => (d.options.shuffle = v))));
  if (a.kind === "worksheet") body.push(toggle(S("Extra writing space", "Más espacio para escribir"), a.options.workspace === "roomy", (v) => set(store, (d) => (d.options.workspace = v ? "roomy" : "normal"))));
  body.push(field(S("Notes for me (students never see these)", "Notas para mí (los estudiantes no las ven)"), textArea(a.notes.teacher, (v) => store.apply((d) => (d.notes.teacher = v), { coalesce: "tnotes", reason: "type" }), { rows: 3 })));
  const std = h("input.st-input", { type: "text", placeholder: "6.RP.A.3", "aria-label": S("Standard code", "Código del estándar") });
  const addStandard = () => {
    const code = std.value.trim();
    if (!code) return;
    set(store, (d) => d.context.standards.push({ code, origin: "teacher" }));
    say(S("Standard added. It is labeled as your choice.", "Estándar añadido. Aparece como elección suya."));
  };
  const chips = a.context.standards.map((x) => h("li", `${x.code} · ${x.origin === "curriculum" ? S("from the curriculum", "del currículo") : S("added by you", "agregado por usted")}`));
  body.push(h("div.st-field", h("p.st-label", S("Standards", "Estándares")), h("ul.st-chips", chips), h("div.st-row", std, button(S("Add", "Añadir"), addStandard, "small"))));
  body.push(
    h(
      "div.st-field",
      h("p.st-label", S("Turn this into…", "Convertir en…")),
      h("div.st-add-row", KINDS.filter((k) => k !== a.kind).map((k) => button(S(...KIND_LABEL[k]), () => {
        const { activity, notes } = convertActivity(store.get(), k);
        store.replace(activity, "structure");
        notify?.(notes.map((n) => S(n.en, n.es)).join(" "));
      }, "small ghost"))),
    ),
  );
  const revs = revisions(a.id);
  if (revs.length) {
    body.push(h("div.st-field", h("p.st-label", S("Earlier versions on this device", "Versiones anteriores en este dispositivo")), h("ul.st-rows", revs.slice(0, 6).map((r) => h("li.st-row", h("span", new Date(r.at).toLocaleString()), button(S("Restore", "Restaurar"), () => {
      store.replace(revisionActivity(r), "structure");
      say(S("Earlier version restored. You can undo.", "Versión anterior restaurada. Puede deshacer."));
    }, "small ghost"))))));
  }
  return disclosure(S("More options", "Más opciones"), ...body);
}

export { duplicateActivity, textInput };
