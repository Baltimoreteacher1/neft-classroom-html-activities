// "Start from an existing activity": one screen, two steps. 1) Pick a kind of platform activity (only those with a real
// adapter are offered). 2) Find one (grade, subject or topic, words) and press Customize. Nothing is made until then.
// The adapter registry is loaded when this screen opens, never on a student page.

import { distinct, filterSources } from "./customize-logic.js";
import { fetchJson } from "./source-banner.js";
import { append, button, clear, field, h, select, textInput } from "./ui.js";

const PAGE = 24;
const loc = (v, S) =>
  v && typeof v === "object" ? S(v.en ?? "", v.es ?? v.en ?? "") : String(v ?? "");
const famId = (f) => f.family || f.id;

/** The Studio home's entry point: a quiet card under the four kinds. */
export function customizeCallout({ S, onGo }) {
  return h(
    "section.st-callout",
    { "aria-labelledby": "st-callout-title" },
    h(
      "h2#st-callout-title",
      S("Start from an existing activity", "Empezar con una actividad existente"),
    ),
    h(
      "p",
      S(
        "Copy an activity from the platform, change it for your students, and keep the original as it is.",
        "Copie una actividad de la plataforma, cámbiela para sus estudiantes y deje el original como está.",
      ),
    ),
    button(S("Customize an activity", "Personalizar una actividad"), onGo, "", {
      "data-act": "customize-callout",
    }),
  );
}

/**
 * @param {{ S, onCustomize: (family: string, ref: string) => void, onScratch: () => void, registry?: object, deps?: object }} opts
 * `registry` is for tests; by default it is imported from ../adapters/registry.js.
 */
export function chooserScreen({ S, onCustomize, onScratch, registry, deps = { fetchJson } }) {
  const root = h("section.st-chooser");
  const state = {
    families: null,
    family: "",
    items: null,
    grade: "",
    domain: "",
    text: "",
    shown: PAGE,
    error: "",
  };
  let reg = registry || null;
  const live = h("p.st-status", { role: "status", "aria-live": "polite" });

  const scratch = h(
    "p.st-scratch",
    S("Nothing here fits? ", "¿Nada encaja? "),
    button(S("Start from scratch instead", "Empezar desde cero"), onScratch, "link", {
      "data-act": "scratch",
    }),
  );

  async function load() {
    try {
      reg ||= await import("../adapters/registry.js");
      state.families = reg.listFamilies();
    } catch {
      state.families = [];
      state.error = "registry";
    }
    draw();
  }

  async function pick(f) {
    state.family = famId(f);
    state.items = null;
    state.grade = state.domain = state.text = "";
    state.shown = PAGE;
    live.textContent = S("Loading activities…", "Cargando actividades…");
    draw();
    try {
      const adapter = reg.adapterFor(state.family);
      state.items = await adapter.list(deps);
    } catch {
      state.items = [];
      state.error = "list";
    }
    live.textContent = "";
    draw();
    root.querySelector("h1")?.focus();
  }

  function familyCards() {
    return h(
      "ul.st-families",
      state.families.map((f) =>
        h(
          "li",
          h(
            "button.st-family",
            { type: "button", "data-family": famId(f), onclick: () => pick(f) },
            h("strong", loc(f.label, S)),
            h("span", loc(f.note, S)),
            (f.fixed || []).length
              ? h(
                  "small",
                  S("Stays fixed: ", "Se mantiene fijo: "),
                  (f.fixed || []).map((x) => loc(x.what, S)).join("; "),
                )
              : null,
          ),
        ),
      ),
    );
  }

  function itemRow(it) {
    const meta = [
      it.grade && S(`Grade ${it.grade}`, `Grado ${it.grade}`),
      it.domain || it.subject,
      it.count && S(`${it.count} questions`, `${it.count} preguntas`),
    ]
      .filter(Boolean)
      .join(" · ");
    return h(
      "li.st-source-row",
      h(
        "div",
        h("strong", it.title),
        meta ? h("p.st-lib-ctx", meta) : null,
        it.description ? h("p.st-hint", it.description) : null,
      ),
      button(
        S("Customize", "Personalizar"),
        () => onCustomize(state.family, it.id),
        "primary small",
        {
          "aria-label": S(`Customize ${it.title}`, `Personalizar ${it.title}`),
          "data-ref": it.id,
        },
      ),
    );
  }

  function itemsStep() {
    const fam = state.families.find((f) => famId(f) === state.family);
    const back = button(
      S("← Choose a different kind", "← Elegir otro tipo"),
      () => ((state.family = ""), draw(), root.querySelector("h1")?.focus()),
      "link",
    );
    if (state.items === null)
      return [back, h("p", S("Loading activities…", "Cargando actividades…"))];
    const filters = h(
      "div.st-lib-filters",
      field(
        S("Search", "Buscar"),
        textInput(state.text, (v) => ((state.text = v), (state.shown = PAGE), drawList()), {
          type: "search",
          placeholder: S("Title or topic", "Título o tema"),
          id: "st-src-search",
        }),
      ),
      field(
        S("Grade", "Grado"),
        select(
          [["", S("All", "Todos")], ...distinct(state.items, (i) => i.grade).map((g) => [g, g])],
          state.grade,
          (v) => ((state.grade = v), (state.shown = PAGE), drawList()),
        ),
      ),
      field(
        S("Subject or topic", "Materia o tema"),
        select(
          [
            ["", S("All", "Todos")],
            ...distinct(state.items, (i) => i.domain || i.subject).map((g) => [g, g]),
          ],
          state.domain,
          (v) => ((state.domain = v), (state.shown = PAGE), drawList()),
        ),
      ),
    );
    const list = h("div.st-source-list");
    function drawList() {
      const found = filterSources(state.items, state);
      clear(list);
      if (!found.length)
        list.append(
          h(
            "p.st-empty",
            S(
              "Nothing matches. Clear the search or filters.",
              "Nada coincide. Borre la búsqueda o los filtros.",
            ),
          ),
        );
      else {
        list.append(
          h(
            "p.st-hint",
            { role: "status", "aria-live": "polite" },
            S(`${found.length} activities`, `${found.length} actividades`),
          ),
          h("ul.st-source-ul", found.slice(0, state.shown).map(itemRow)),
        );
        if (found.length > state.shown)
          list.append(
            button(
              S("Show more", "Mostrar más"),
              () => ((state.shown += PAGE), drawList()),
              "ghost small",
            ),
          );
      }
    }
    drawList();
    return [
      back,
      h("p.st-hint", loc(fam?.note, S)),
      state.error === "list"
        ? h(
            "p.st-needs",
            S(
              "The list could not be loaded. Try again in a moment.",
              "No se pudo cargar la lista. Intente de nuevo en un momento.",
            ),
          )
        : null,
      filters,
      list,
    ];
  }

  function draw() {
    clear(root);
    const head = h(
      "h1",
      { tabindex: "-1" },
      S("Start from an existing activity", "Empezar con una actividad existente"),
    );
    if (state.families === null)
      return root.append(head, h("p", { role: "status" }, S("Loading…", "Cargando…")));
    if (!state.families.length)
      return root.append(
        head,
        h(
          "p.st-empty",
          S("Customizing is not available right now.", "Personalizar no está disponible ahora."),
        ),
        scratch,
      );
    append(root, [
      head,
      h(
        "p.st-hint",
        state.family
          ? S("Step 2 of 2: find the activity", "Paso 2 de 2: encuentre la actividad")
          : S("Step 1 of 2: what kind of activity?", "Paso 1 de 2: ¿qué tipo de actividad?"),
      ),
      state.family ? itemsStep() : familyCards(),
      live,
      scratch,
    ]);
  }
  draw();
  load();
  return root;
}
