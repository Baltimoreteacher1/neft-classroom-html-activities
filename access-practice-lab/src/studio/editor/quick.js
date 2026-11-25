// Quick Customize: the first tab of the editor. Plain choices for a busy teacher: a few quick changes, activity
// length, versions for different learners, an optional assistant, and a way to turn the activity into something
// else. Every change goes through the store, so each one can be undone, and nothing is applied silently.
// Differentiation and transformation logic is loaded only when this tab is used (dynamic import).

import { supportsForWida } from "../core/generate.js";
import { normalizeActivity } from "../core/schema.js";
import { newActivityId, saveLocal } from "../drafts.js";
import { LEVELS, SUPPORT_AMOUNTS, amountOf, isPlatform, levelOf } from "./customize-logic.js";
import { openProposal } from "./proposal.js";
import { TIER_LABEL, handoff, restoreOriginal } from "./source-banner.js";
import { button, clear, disclosure, field, h, say, select, textArea } from "./ui.js";
import { openVersions } from "./versions.js";

const QUICK_IDS = ["language-support", "simplify-directions", "increase-challenge"];
const LENGTH_IDS = ["shorten", "extend-practice"];
const LEVEL_TEXT = {
  emerging: ["Emerging: most support", "Emergente: más apoyo"],
  developing: ["Developing: some support", "En desarrollo: algo de apoyo"],
  expanding: ["Expanding: light support", "En expansión: poco apoyo"],
  extension: ["Extension: grade-level language", "Ampliación: lenguaje del grado"],
};
const AMOUNT_TEXT = {
  light: ["Light: hints only", "Poco: solo pistas"],
  standard: ["Standard: hints, frames, pictures", "Estándar: pistas, marcos, imágenes"],
  extra: [
    "Extra: also read aloud and one part at a time",
    "Extra: también lectura en voz alta y una parte a la vez",
  ],
};
const AI_ERRORS = {
  unauthorized: [
    "Open a class on this device to use suggestions.",
    "Abra una clase en este dispositivo para usar sugerencias.",
  ],
  "ai-unavailable": [
    "Suggestions are not available right now.",
    "Las sugerencias no están disponibles ahora.",
  ],
};

const asLabel = (v, S, fallback) =>
  v && typeof v === "object" ? S(v.en ?? fallback, v.es ?? v.en ?? fallback) : v || fallback;

export function createQuickPanel(store, { S, ai, nav, goTo, saver, goContent, openAdvanced }) {
  const el = h("div.st-quick");
  let last = null; // { changes, warnings, label } of the latest quick change, shown until something else happens
  let aiState = "checking";
  let aiText = "";
  let aiNote = "";
  let mods = null; // { diff, transforms }, loaded when the tab is first drawn

  Promise.resolve(ai?.available)
    .then((ok) => (aiState = ok ? "yes" : "no"))
    .catch(() => (aiState = "no"))
    .then(() => render());
  Promise.all([
    import("../core/differentiate.js").catch(() => null),
    import("../core/transforms.js").catch(() => null),
  ]).then(([diff, transforms]) => ((mods = { diff, transforms }), render()));

  const result = h("div.st-quick-result", {
    role: "status",
    "aria-live": "polite",
    tabindex: "-1",
  });

  function drawResult() {
    clear(result);
    if (!last) return;
    result.append(
      h("p", h("strong", last.label)),
      last.changes.length
        ? h(
            "ul",
            last.changes.map((c) => h("li", S(c.en ?? c, c.es ?? c.en ?? c))),
          )
        : h("p", S("Nothing needed to change.", "No hacía falta cambiar nada.")),
      last.warnings.length
        ? h(
            "ul.st-warn-list",
            last.warnings.map((c) => h("li", S(c.en ?? c, c.es ?? c.en ?? c))),
          )
        : null,
      last.changes.length
        ? button(
            S("Undo", "Deshacer"),
            () => (store.undo(), (last = null), render(), say(S("Undone.", "Deshecho."))),
            "small",
          )
        : null,
    );
  }

  const presetInfo = (id) => mods?.diff?.PRESETS?.find((p) => p.id === id);
  const presetLabel = (id) => {
    const p = presetInfo(id);
    return p ? S(p.label.en, p.label.es) : id;
  };

  function preset(id) {
    if (!mods?.diff?.applyPreset) return;
    const label = presetLabel(id);
    let res = null;
    try {
      res = mods.diff.applyPreset(store.get(), id);
    } catch (err) {
      console.error("[studio] preset failed", err);
      return say(S("That change could not be made. Your activity is unchanged.", "No se pudo hacer ese cambio. Su actividad no cambió."));
    }
    if (res?.activity) store.replace(res.activity, "structure");
    last = { label, changes: res?.changes || [], warnings: res?.warnings || [] };
    render();
    result.focus();
    say(
      `${label}. ${last.changes.length ? S(`${last.changes.length} changes.`, `${last.changes.length} cambios.`) : S("Nothing needed to change.", "No hacía falta cambiar nada.")}`,
    );
  }

  const presetButton = (id) => {
    const info = presetInfo(id);
    return h(
      "button.btn.st-preset",
      { type: "button", "data-preset": id, onclick: () => preset(id) },
      h("strong", presetLabel(id)),
      info ? h("span", S(info.description.en, info.description.es)) : null,
    );
  };

  function fineTune() {
    const a = store.get();
    const set = (fn) => store.apply(fn, { reason: "structure" });
    const level = select(
      [
        ["", S("Keep as it is", "Dejar como está")],
        ...LEVELS.map((l) => [l.id, S(...LEVEL_TEXT[l.id])]),
      ],
      levelOf(a.supports),
      (v) =>
        v &&
        (set(
          (d) =>
            (d.supports = supportsForWida(LEVELS.find((l) => l.id === v).wida, {
              spanish: d.supports.spanish,
            })),
        ),
        say(S("Language level updated.", "Nivel de lenguaje actualizado."))),
      { "aria-label": S("Language level", "Nivel de lenguaje") },
    );
    const amount = select(
      [
        ["", S("Keep as it is", "Dejar como está")],
        ...Object.keys(SUPPORT_AMOUNTS).map((k) => [k, S(...AMOUNT_TEXT[k])]),
      ],
      amountOf(a.supports),
      (v) =>
        v &&
        (set((d) => Object.assign(d.supports, SUPPORT_AMOUNTS[v])),
        say(S("Amount of support updated.", "Cantidad de apoyo actualizada."))),
      { "aria-label": S("Amount of support", "Cantidad de apoyo") },
    );
    return disclosure(
      S("Fine-tune supports", "Ajustar los apoyos"),
      field(
        S("Language level", "Nivel de lenguaje"),
        level,
        S(
          "How much language help students get. It never changes the task.",
          "Cuánta ayuda de lenguaje reciben los estudiantes. Nunca cambia la tarea.",
        ),
      ),
      field(
        S("Amount of support", "Cantidad de apoyo"),
        amount,
        S(
          "Hints, frames and read-aloud. Spanish support is set in Student Supports.",
          "Pistas, marcos y lectura en voz alta. El apoyo en español se ajusta en Apoyos para estudiantes.",
        ),
      ),
    );
  }

  function assistant() {
    const status = h(
      "p.st-hint",
      { id: "st-ai-note", role: "status", "aria-live": "polite" },
      aiNote,
    );
    const box = textArea(aiText, (v) => (aiText = v), {
      rows: 3,
      disabled: aiState !== "yes",
      "aria-describedby": "st-ai-note",
    });
    const go = button(
      S("Suggest changes", "Sugerir cambios"),
      async () => {
        const prompt = box.value.trim();
        if (!prompt) {
          aiNote = S(
            "Say what you would like to change first.",
            "Primero diga qué le gustaría cambiar.",
          );
          status.textContent = aiNote;
          return;
        }
        go.disabled = true;
        aiNote = S("Thinking…", "Pensando…");
        status.textContent = aiNote;
        const res = await ai
          .edit({ prompt, activity: store.get() })
          .catch(() => ({ ok: false, error: "failed" }));
        go.disabled = false;
        if (!res?.ok || !res.activity) {
          aiNote = S(
            ...(AI_ERRORS[res?.error] || [
              "Suggestions could not be made. Your activity is unchanged.",
              "No se pudieron hacer sugerencias. Su actividad no cambió.",
            ]),
          );
          status.textContent = aiNote;
          return;
        }
        aiNote = "";
        status.textContent = "";
        openProposal({
          S,
          base: store.get(),
          proposed: normalizeActivity(res.activity),
          onApply: (next, n) => {
            store.replace(next, "structure");
            last = {
              label: S("Suggested changes applied", "Cambios sugeridos aplicados"),
              changes: [
                {
                  en: `${n} change${n === 1 ? "" : "s"} applied.`,
                  es: `${n} cambio${n === 1 ? "" : "s"} aplicado${n === 1 ? "" : "s"}.`,
                },
              ],
              warnings: [],
            };
            render();
            result.focus();
          },
        });
      },
      "",
      { disabled: aiState !== "yes", "data-act": "suggest" },
    );
    const why =
      aiState === "yes"
        ? S(
            "You will see every change and choose what to apply.",
            "Verá cada cambio y elegirá qué aplicar.",
          )
        : aiState === "checking"
          ? S(
              "Checking whether suggestions are available…",
              "Comprobando si hay sugerencias disponibles…",
            )
          : S(
              "Suggestions are not available right now. Use the quick changes above or edit the content yourself.",
              "Las sugerencias no están disponibles ahora. Use los cambios rápidos de arriba o edite el contenido usted.",
            );
    return h(
      "section.st-quick-sec",
      h("h3", S("Ask for a change", "Pedir un cambio")),
      field(S("What would you like to change?", "¿Qué le gustaría cambiar?"), box),
      h("div.st-add-row", go),
      h("p.st-hint", { "data-ai": aiState }, why),
      status,
    );
  }

  async function transform(entry, label) {
    await saver.flush();
    const src = store.get();
    let res = null;
    try {
      res = mods.transforms.runTransform(src, entry.id);
    } catch (err) {
      console.error("[studio] transform failed", err);
    }
    if (!res?.activity || res.ran === false) {
      last = {
        label,
        changes: [],
        warnings: res?.notes?.length
          ? res.notes
          : [{ en: "That could not be made. Your activity is unchanged.", es: "No se pudo crear. Su actividad no cambió." }],
      };
      render();
      return result.focus();
    }
    const now = Date.now();
    // A change of kind edits in place; here it always becomes a new draft, so give it its own title.
    const retitled = res.activity.title === src.title ? `${src.title} (${label})`.slice(0, 120) : res.activity.title;
    const next = normalizeActivity({
      ...res.activity,
      title: retitled,
      id: newActivityId(),
      rev: 0,
      createdAt: now,
      updatedAt: now,
    });
    saveLocal(next, null);
    handoff.set(next.id, [
      ...(res.notes || []),
      {
        en: `Made from "${src.title}". The original is unchanged.`,
        es: `Creada a partir de «${src.title}». El original no cambió.`,
      },
    ]);
    nav(goTo.edit(next.id));
    say(label);
  }

  function transformsSection() {
    const list = mods?.transforms?.availableTransforms
      ? mods.transforms.availableTransforms(store.get())
      : [];
    if (!list.length) return null;
    return disclosure(
      S("Turn this into something else", "Convertir en otra cosa"),
      h(
        "p.st-hint",
        S(
          "This makes a new draft. Your current activity stays as it is.",
          "Esto crea un borrador nuevo. Su actividad actual no cambia.",
        ),
      ),
      h(
        "div.st-add-row",
        list.map((e) => {
          const label = asLabel(e.label, S, e.id);
          return button(label, () => transform(e, label), "small ghost", {
            "data-transform": e.id,
          });
        }),
      ),
    );
  }

  function render() {
    const a = store.get();
    const lin = a.lineage;
    drawResult();
    clear(el).append(
      h(
        "h2.st-quick-title",
        { tabindex: "-1", id: "st-quick-title" },
        S("Customize this activity", "Personalizar esta actividad"),
      ),
      h(
        "p.st-hint",
        S(
          "Pick a change. Nothing is saved over your original, and every change can be undone.",
          "Elija un cambio. Nada se guarda sobre su original y cada cambio se puede deshacer.",
        ),
      ),
      result,
      h(
        "section.st-quick-sec",
        h("h3", S("Quick changes", "Cambios rápidos")),
        mods?.diff
          ? h("div.st-presets", QUICK_IDS.map(presetButton))
          : h("p.st-hint", S("Loading…", "Cargando…")),
        isPlatform(lin) && !lin.variantOf
          ? h(
              "p",
              button(
                S("Restore original", "Restaurar el original"),
                () => restoreOriginal({ store, S }),
                "link",
              ),
            )
          : null,
      ),
      h(
        "section.st-quick-sec",
        h("h3", S("Activity length", "Longitud de la actividad")),
        h(
          "div.st-add-row",
          LENGTH_IDS.map((id) =>
            button(presetLabel(id), () => preset(id), "small", {
              disabled: !mods?.diff,
              "data-preset": id,
            }),
          ),
        ),
      ),
      h(
        "section.st-quick-sec",
        h("h3", S("Versions for different learners", "Versiones para distintos estudiantes")),
        h(
          "p.st-hint",
          S(
            `Make ${Object.values(TIER_LABEL)
              .map((t) => t.en)
              .join(", ")} versions side by side.`,
            `Cree versiones ${Object.values(TIER_LABEL)
              .map((t) => t.es)
              .join(", ")} lado a lado.`,
          ),
        ),
        button(
          S("Make versions", "Crear versiones"),
          () => openVersions({ store, saver, S, nav, goTo }),
          "primary",
          { disabled: !mods?.diff, "data-act": "make-versions" },
        ),
      ),
      assistant(),
      fineTune(),
      transformsSection(),
      h(
        "div.st-quick-foot",
        button(S("Edit content", "Editar el contenido"), goContent, "ghost small", {
          "data-act": "edit-content",
        }),
        button(S("Advanced options", "Opciones avanzadas"), openAdvanced, "ghost small", {
          "data-act": "advanced",
        }),
      ),
    );
  }
  render();
  return { el, render, focus: () => el.querySelector("#st-quick-title")?.focus() };
}
