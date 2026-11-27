// Parallel differentiation workspace (an editor side tab). One button, "Make versions", lays out side-by-side cards:
// the standard activity and each version the differentiation engine really makes. Each card has a compact student
// preview (loaded only when it scrolls into view), what changed, what stayed the same, a warning when the rigor check
// objects, and Open / Duplicate / Discard. Open saves the version as its OWN draft with `lineage` pointing at this
// activity, so editing one version never overwrites another. "Another version of this" adds a seeded variant (new
// numbers, different order or a different story setting), always labeled "not claimed equivalent".
//
// Cards, changes, rigor and the same/different lists come from compare-model.js (the engine); saving is compare-save.js.

import { VARIANT_MODES } from "../x/variants.js";
import { makeCards, variantCard } from "./compare-model.js";
import { duplicateCard, saveCard } from "./compare-save.js";
import { button, clear, field, h, say, select } from "./ui.js";

const MODE_LABEL = {
  numbers: ["New numbers", "Números nuevos"],
  reorder: ["Different order", "Otro orden"],
  context: ["Different story setting", "Otro contexto del problema"],
};
const TIER_NAME = {
  emerging: ["Emerging", "Emergente"],
  developing: ["Developing", "En desarrollo"],
  expanding: ["Expanding", "En expansión"],
  extension: ["Extension", "Extensión"],
};

const GRID_STYLE =
  "display:grid;grid-auto-flow:column;grid-auto-columns:min(21rem,88%);gap:.75rem;overflow-x:auto;scroll-snap-type:x proximity;padding-block:.25rem .75rem";
const CARD_STYLE =
  "scroll-snap-align:start;display:grid;gap:.5rem;align-content:start;min-width:0;padding:.75rem;border:1.5px solid var(--line-control);border-radius:.75rem";
const FRAME_STYLE =
  "width:100%;height:15rem;border:1px solid var(--line-control);border-radius:.5rem;background:#fff";

/** Returns { el, render, destroy }. `onOpen(id)` opens a saved draft in the editor. */
export function createComparePanel(store, { S, lang = "en", onOpen }) {
  const el = h("div.st-panel-body.st-cmp");
  const text = (p) => S(p.en, p.es);
  let cards = [];
  let fading = null;
  let notes = [];
  let seed = 1;
  let mode = "numbers";
  let message = "";
  const html = new Map();
  let observers = [];

  const say2 = (en, es) => {
    message = S(en, es);
    say(message);
  };

  function loadHtml(activity) {
    if (!html.has(activity.id))
      html.set(
        activity.id,
        import("./preview.js").then((m) => m.studentHtml(activity, { lang, preview: true })),
      );
    return html.get(activity.id);
  }

  /** The student view in a sandboxed frame, created only when the holder is on screen. */
  function lazyPreview(card) {
    const title = S(`Student view: ${card.title.en}`, `Vista del estudiante: ${card.title.es}`);
    const holder = h("div.st-cmp-preview", { style: "min-height:15rem", "data-preview": "idle" });
    const load = async () => {
      holder.dataset.preview = "loading";
      try {
        const frame = h("iframe.st-frame", {
          title,
          sandbox: "allow-scripts allow-modals",
          referrerpolicy: "no-referrer",
          style: FRAME_STYLE,
        });
        frame.srcdoc = await loadHtml(card.activity);
        clear(holder).append(frame);
        holder.dataset.preview = "ready";
      } catch (err) {
        console.error("[studio] version preview failed", err);
        holder.dataset.preview = "error";
        clear(holder).append(
          h("p.st-hint", S("The preview could not load.", "No se pudo cargar la vista previa.")),
        );
      }
    };
    if (typeof IntersectionObserver === "function") {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          load();
        }
      });
      observers.push(io);
      io.observe(holder);
    } else queueMicrotask(load);
    return holder;
  }

  const list = (heading, items) =>
    items.length
      ? [
          h("h4.st-sub", heading),
          h(
            "ul",
            items.map((i) => h("li", typeof i === "string" ? i : text(i))),
          ),
        ]
      : [];

  function supportLine(c) {
    const s = c.support;
    const yes = (v) => (v ? S("on", "sí") : S("off", "no"));
    return S(
      `Frames shown: ${s.frameCount} · Word bank entries: ${s.wordBank} · Hints ${yes(s.hints)} · Read-aloud ${yes(s.readAloud)} · Spanish ${yes(s.spanish)}`,
      `Marcos visibles: ${s.frameCount} · Palabras en el banco: ${s.wordBank} · Pistas: ${yes(s.hints)} · Lectura en voz alta: ${yes(s.readAloud)} · Español: ${yes(s.spanish)}`,
    );
  }

  function actions(c, index) {
    if (c.kind === "standard") return null;
    const name = text(c.title);
    const row = h("div.st-add-row");
    row.append(
      button(
        c.saved ? S("Open saved draft", "Abrir borrador guardado") : S("Open", "Abrir"),
        () => open(c),
        "small primary",
        {
          "data-act": "open",
          "aria-label": S(`Open ${name} as its own draft`, `Abrir ${name} como su propio borrador`),
        },
      ),
      button(S("Duplicate", "Duplicar"), () => duplicate(c, index), "small ghost", {
        "data-act": "duplicate",
        "aria-label": S(`Duplicate ${name}`, `Duplicar ${name}`),
      }),
    );
    if (!c.saved)
      row.append(
        button(S("Discard", "Descartar"), () => discard(index), "small ghost", {
          "data-act": "discard",
          "aria-label": S(`Discard ${name}`, `Descartar ${name}`),
        }),
      );
    return row;
  }

  function card(c, index) {
    const id = `st-cmp-h-${index}`;
    const tier = c.tier ? TIER_NAME[c.tier] : null;
    const problems = c.rigor.ok ? [] : c.rigor.problems;
    return h(
      "article.st-cmp-card",
      {
        style: CARD_STYLE,
        "aria-labelledby": id,
        "data-card": c.key,
        "data-saved": c.saved ? "true" : "false",
      },
      h(
        "h3",
        { id, style: "margin:0" },
        text(c.title),
        tier ? h("small", ` (${S(...tier)})`) : null,
      ),
      c.about ? h("p.st-hint", text(c.about)) : null,
      c.kind === "variant"
        ? h(
            "p",
            h("strong", S(`Seed ${c.seed}`, `Semilla ${c.seed}`)),
            ` · ${S(...MODE_LABEL[c.mode])}`,
          )
        : null,
      lazyPreview(c),
      ...(c.kind === "standard"
        ? [
            h(
              "p.st-hint",
              S(
                "Your activity as it is now. Nothing changed.",
                "Tu actividad como está ahora. No cambió nada.",
              ),
            ),
          ]
        : [
            ...list(
              S("What changed", "Qué cambió"),
              c.changes.length
                ? c.changes
                : [S("Nothing else changed.", "No cambió nada más.")],
            ),
            ...list(S("What stayed the same", "Qué se mantuvo igual"), c.same),
          ]),
      c.kind === "variant"
        ? h(
            "div.st-needs",
            h(
              "p",
              h("strong", S("Not claimed equivalent. ", "Equivalencia no declarada. ")),
              text(c.note),
            ),
          )
        : null,
      ...(c.kind === "variant"
        ? [
            ...list(S("Not changed", "No se cambió"), c.skipped),
            ...list(S("Please check", "Por favor revisa"), c.review),
          ]
        : []),
      h("p.st-hint", supportLine(c)),
      problems.length
        ? h(
            "div.st-needs",
            { role: "alert" },
            h(
              "p",
              h("strong", S("Check before using. ", "Revisa antes de usar. ")),
              S(
                "This version differs from your activity in ways the rigor check flags (versions must never lower expectations):",
                "Esta versión difiere de tu actividad en puntos que la revisión de rigor señala (las versiones nunca deben bajar las expectativas):",
              ),
            ),
            h(
              "ul",
              problems.slice(0, 6).map((p) => h("li", text(p))),
            ),
          )
        : null,
      c.warnings.length
        ? h(
            "ul",
            c.warnings.map((w) => h("li.st-hint", text(w))),
          )
        : null,
      c.saved
        ? h(
            "p.st-confirm",
            { role: "status" },
            S(
              "Saved as its own draft in My activities.",
              "Guardada como su propio borrador en Mis actividades.",
            ),
          )
        : null,
      actions(c, index),
    );
  }

  function open(c) {
    const id = saveCard(c, store.get());
    if (!id) {
      say2(
        "Could not save this version on this device. Your activity is unchanged.",
        "No se pudo guardar esta versión en este dispositivo. Tu actividad no cambió.",
      );
      return render();
    }
    say2("Saved as its own draft. Opening it.", "Guardada como su propio borrador. Abriéndola.");
    render();
    onOpen?.(id);
  }

  function duplicate(c, index) {
    const copy = duplicateCard(c, S("Copy of", "Copia de"));
    if (!copy) {
      say2(
        "Could not save the copy on this device.",
        "No se pudo guardar la copia en este dispositivo.",
      );
      return render();
    }
    cards.splice(index + 1, 0, {
      ...c,
      key: `${c.key}-copy`,
      activity: copy.activity,
      saved: copy.id,
      kind: c.kind === "variant" ? "variant" : "copy",
    });
    say2("Duplicated and saved as a new draft.", "Duplicada y guardada como un borrador nuevo.");
    render();
  }

  function discard(index) {
    const [gone] = cards.splice(index, 1);
    say2(`Discarded: ${gone.title.en}.`, `Descartada: ${gone.title.es}.`);
    render();
    el.querySelector('[data-act="make"]')?.focus();
  }

  function make() {
    try {
      const made = makeCards(store.get());
      const keep = cards.filter((c) => c.kind !== "standard" && (c.saved || c.kind === "variant"));
      cards = [...made.cards, ...keep];
      fading = made.fading;
      notes = made.notes;
      say2(
        `${made.cards.length - 1} versions made. Nothing is saved until you press Open.`,
        `${made.cards.length - 1} versiones creadas. No se guarda nada hasta que presiones Abrir.`,
      );
    } catch (err) {
      console.error("[studio] versions failed", err);
      say2(
        "The versions could not be made. Your activity is unchanged.",
        "No se pudieron crear las versiones. Tu actividad no cambió.",
      );
    }
    render();
    el.querySelector(".st-cmp-grid")?.focus();
  }

  function another() {
    try {
      if (!cards.length) cards = makeCards(store.get()).cards.slice(0, 1);
      const c = variantCard(store.get(), { seed, mode });
      cards.push(c);
      say2(
        `Made another version with seed ${seed}.`,
        `Se creó otra versión con la semilla ${seed}.`,
      );
      seed += 1;
    } catch (err) {
      console.error("[studio] variant failed", err);
      say2(
        "A variant needs an activity with no errors. Open Check my work, fix what it lists, then try again.",
        "Una variante necesita una actividad sin errores. Abre Revisar mi trabajo, corrige lo que indica y vuelve a intentarlo.",
      );
    }
    render();
  }

  function variantForm() {
    const seedInput = h("input.st-input", {
      type: "number",
      min: "0",
      step: "1",
      value: String(seed),
      oninput: (e) => {
        const n = Number(e.target.value);
        if (Number.isInteger(n) && n >= 0) seed = n;
      },
    });
    return h(
      "fieldset.st-fieldset",
      h("legend", S("Another version of this", "Otra versión de esto")),
      h(
        "p.st-hint",
        S(
          "Same skill, different items. The same seed always gives the same version.",
          "La misma destreza, otros ítems. La misma semilla siempre da la misma versión.",
        ),
      ),
      field(
        S("What to change", "Qué cambiar"),
        select(
          VARIANT_MODES.map((m) => [m, S(...MODE_LABEL[m])]),
          mode,
          (v) => (mode = v),
        ),
      ),
      field(S("Seed (a whole number)", "Semilla (un número entero)"), seedInput),
      button(S("Make another version", "Crear otra versión"), another, "small", {
        "data-act": "variant",
      }),
      h(
        "p.st-hint",
        S(
          "A variant is not claimed to be equivalent: difficulty, reading load and wrong answers may differ.",
          "No se declara que una variante sea equivalente: la dificultad, la carga de lectura y las respuestas incorrectas pueden diferir.",
        ),
      ),
    );
  }

  function fadingNote() {
    if (!fading) return null;
    return h(
      "p.st-hint",
      S(
        "Scaffolds fade across the versions. Sentence frames shown: ",
        "Los apoyos se reducen entre versiones. Marcos de oraciones visibles: ",
      ),
      fading.frames.map((f) => `${text(f.title)} ${f.count}`).join(" → "),
    );
  }

  function render() {
    for (const io of observers) io.disconnect();
    observers = [];
    clear(el).append(
      h("h2.st-sub", S("Versions side by side", "Versiones lado a lado")),
      h(
        "p.st-hint",
        S(
          "Make versions for different learners and compare them. Each is a copy: your activity is not changed, and nothing is saved until you press Open.",
          "Crea versiones para distintos estudiantes y compáralas. Cada una es una copia: tu actividad no cambia y no se guarda nada hasta que presiones Abrir.",
        ),
      ),
      h(
        "div.st-add-row",
        button(
          cards.length
            ? S("Make versions again", "Crear versiones de nuevo")
            : S("Make versions", "Crear versiones"),
          make,
          "primary",
          { "data-act": "make" },
        ),
      ),
      h("p.st-status", { role: "status", "aria-live": "polite" }, message),
      fadingNote(),
      ...notes.map((n) =>
        h(
          "p.st-hint",
          S("Shorter practice was not made: ", "No se creó la práctica más corta: "),
          text(n),
        ),
      ),
      cards.length
        ? h(
            "div.st-cmp-grid",
            {
              style: GRID_STYLE,
              tabindex: "0",
              role: "region",
              "aria-label": S(
                "Versions side by side. Scroll sideways for more.",
                "Versiones lado a lado. Desplázate hacia un lado para ver más.",
              ),
            },
            cards.map(card),
          )
        : null,
      variantForm(),
    );
  }

  return {
    el,
    render,
    destroy() {
      for (const io of observers) io.disconnect();
    },
  };
}
