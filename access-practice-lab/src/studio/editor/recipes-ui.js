// Recipes: the STRUCTURE of an activity a teacher liked (which parts, in which order, with which supports), reusable for
// another topic. A recipe never keeps a topic word, question, answer or passage, so nothing from one topic leaks into
// the next. Apply one (built-in or saved on this device) to a new topic and content; parts the content cannot fill are
// listed in plain words and stay empty. Nothing is substituted and nothing is sent anywhere.
//
//   recipesBox({ S, onBuilt, context?, store?, drafts?, newId? }) -> HTMLElement   apply (and, with `drafts`, save)
//   saveRecipeBox({ S, activity?, drafts?, store?, onSaved? }) -> HTMLElement      save a structure as a recipe
//   onBuilt({ activity, notes: [{en, es}] })

import {
  announce as say,
  ensureWireCss,
  focusEl,
  noteList,
  notesOf,
  uid,
  xarea,
  xbtn,
  xfield,
  xinput,
} from "../../create/wire-kit.js";
import { applyRecipe, builtinRecipes, recipeFromActivity } from "../x/recipes.js";
import { MAX_RECIPES, deleteRecipe, listRecipes, saveRecipe } from "./recipes-store.js";
import { append, h } from "./ui.js";

/** Append children, skipping null and flattening lists (DOM append would write the text "null"). */
const add = (el, ...kids) => append(el, kids);

const KIND_LABEL = {
  worksheet: ["Worksheet", "Hoja de trabajo"],
  interactive: ["Interactive activity", "Actividad interactiva"],
  game: ["Game", "Juego"],
  check: ["Quick check", "Revisión rápida"],
};

const STORE_WHY = {
  full: [
    `You already have ${MAX_RECIPES} saved recipes. Delete one to save another.`,
    `Ya tiene ${MAX_RECIPES} recetas guardadas. Elimine una para guardar otra.`,
  ],
  storage: [
    "This device could not save the recipe. Free some space and try again.",
    "Este dispositivo no pudo guardar la receta. Libere espacio e intente de nuevo.",
  ],
  invalid: [
    "That is not something I can save as a recipe.",
    "Eso no es algo que pueda guardar como receta.",
  ],
};

/** "6 parts · Worksheet" for a recipe. */
function recipeFacts(S, r) {
  const n = r.steps.length;
  return `${S(`${n} part${n === 1 ? "" : "s"}`, `${n} parte${n === 1 ? "" : "s"}`)} · ${S(...(KIND_LABEL[r.kind] || [r.kind, r.kind]))}`;
}

/** Save the structure of an activity as a recipe. Pass `activity`, or `drafts` (a list of { id, activity }) to choose. */
export function saveRecipeBox({ S, activity, drafts, store, onSaved }) {
  ensureWireCss();
  const state = { activity: activity || drafts?.[0]?.activity || null, name: "" };
  const live = h("p.xw-status", { role: "status", "aria-live": "polite" });
  const nameId = uid("xw-rn");
  const name = xinput("", (v) => (state.name = v), {
    id: nameId,
    maxlength: 80,
    placeholder: S(
      "For example: Words, practice, then write",
      "Por ejemplo: Palabras, práctica y escritura",
    ),
  });
  const root = h("div.xw-save", { "data-box": "save-recipe" });
  if (!state.activity && !drafts?.length) {
    add(root, 
      h(
        "p.xw-hint",
        S(
          "Make an activity first, then you can save its structure here.",
          "Primero cree una actividad y luego podrá guardar aquí su estructura.",
        ),
      ),
    );
    return root;
  }
  if (drafts?.length) {
    const pick = h(
      "select.xw-input",
      {
        onchange: (e) => (state.activity = drafts[Number(e.target.value)]?.activity || null),
      },
      drafts.map((d, i) =>
        h("option", { value: String(i) }, d.activity.title || S("Untitled", "Sin título")),
      ),
    );
    add(root, xfield(S("Which activity?", "¿Qué actividad?"), pick));
  }
  const save = () => {
    if (!state.activity) return;
    const label = state.name.trim() || state.activity.title || S("My recipe", "Mi receta");
    const res = saveRecipe(recipeFromActivity(state.activity, label), store);
    if (!res.ok) {
      live.textContent = S(...STORE_WHY[res.reason]);
      return;
    }
    live.textContent = S(
      `Saved "${res.recipe.name}" on this device (${res.recipes.length} of ${MAX_RECIPES}). It keeps the structure only, never the words or answers.`,
      `"${res.recipe.name}" guardada en este dispositivo (${res.recipes.length} de ${MAX_RECIPES}). Guarda solo la estructura, nunca las palabras ni las respuestas.`,
    );
    say(S("Recipe saved.", "Receta guardada."));
    onSaved?.(res.recipes);
  };
  add(root, 
    xfield(
      S("Recipe name", "Nombre de la receta"),
      name,
      S(
        "Optional. The activity's title is used if you leave it empty.",
        "Opcional. Si lo deja vacío se usa el título de la actividad.",
      ),
    ),
    h(
      "div.xw-row",
      xbtn(S("Save recipe", "Guardar receta"), save, "ghost", { "data-act": "save-recipe" }),
    ),
    live,
  );
  return root;
}

export function recipesBox({ S, onBuilt, context = {}, store, drafts, newId }) {
  ensureWireCss();
  const builtin = builtinRecipes();
  const state = { id: builtin[0].recipe.id, topic: "", content: "" };
  const root = h("section.xw-box", { "data-box": "recipes" });
  const list = h("div.xw-recipes");
  const live = h("p.xw-status", { role: "status", "aria-live": "polite" });
  const out = h("div.xw-plan");

  const radio = (r, label, about, extra) =>
    h(
      "div.xw-recipe",
      h(
        "label.xw-radio",
        h("input", {
          type: "radio",
          name: "xw-recipe",
          value: r.id,
          checked: r.id === state.id,
          onchange: () => (state.id = r.id),
        }),
        h("span", h("strong", label), h("small", about)),
      ),
      extra,
    );

  function drawList() {
    const saved = listRecipes(store);
    const known = [...builtin.map((b) => b.recipe), ...saved];
    if (!known.some((r) => r.id === state.id)) state.id = builtin[0].recipe.id;
    list.replaceChildren(
      h(
        "fieldset.xw-radios",
        h("legend", S("Choose a recipe", "Elija una receta")),
        builtin.map((b) => radio(b.recipe, S(b.label.en, b.label.es), S(b.about.en, b.about.es))),
        saved.length
          ? h(
              "p.xw-sub",
              S(
                `My saved recipes (${saved.length} of ${MAX_RECIPES})`,
                `Mis recetas guardadas (${saved.length} de ${MAX_RECIPES})`,
              ),
            )
          : null,
        saved.map((r) =>
          radio(
            r,
            r.name,
            recipeFacts(S, r),
            xbtn(
              S("Delete", "Eliminar"),
              () => {
                deleteRecipe(r.id, store);
                drawList();
                live.textContent = S(`Deleted "${r.name}".`, `"${r.name}" eliminada.`);
                list.querySelector("input[type=radio]")?.focus();
              },
              "link",
              { "aria-label": S(`Delete recipe ${r.name}`, `Eliminar la receta ${r.name}`) },
            ),
          ),
        ),
      ),
    );
  }

  function show(res) {
    const notes = notesOf(res.review);
    out.replaceChildren();
    if (!res.activity) {
      add(out, 
        h(
          "h3",
          { tabindex: "-1" },
          S("I could not fill this recipe", "No pude completar esta receta"),
        ),
        notes.length ? noteList(S, notes) : null,
      );
      focusEl(out.querySelector("h3"));
      say(S("The recipe could not be filled.", "No se pudo completar la receta."));
      return;
    }
    add(out, 
      h(
        "h3",
        { tabindex: "-1" },
        S("Your first version is ready", "Su primera versión está lista"),
      ),
      notes.length
        ? h(
            "div.xw-gaps",
            h(
              "p.xw-callout",
              { "data-ok": "false" },
              S(
                "Some parts of the recipe could not be filled from your content. They stay empty; nothing was substituted.",
                "Algunas partes de la receta no se pudieron completar con su contenido. Quedan vacías; no se sustituyó nada.",
              ),
            ),
            noteList(S, notes),
          )
        : null,
      h(
        "div.xw-row",
        xbtn(
          S("Open it in the editor", "Abrir en el editor"),
          () => onBuilt({ activity: res.activity, notes }),
          "primary",
          {
            "data-act": "open-built",
          },
        ),
      ),
    );
    focusEl(out.querySelector("h3"));
    say(
      S(
        "Your first version is ready. Review the notes.",
        "Su primera versión está lista. Revise las notas.",
      ),
    );
  }

  function apply() {
    const recipe = [...builtin.map((b) => b.recipe), ...listRecipes(store)].find(
      (r) => r.id === state.id,
    );
    const topic = state.topic.trim();
    if (!recipe) return;
    if (!topic && !state.content.trim()) {
      live.textContent = S(
        "Add a topic or your own content first.",
        "Primero agregue un tema o su propio contenido.",
      );
      return;
    }
    live.textContent = "";
    show(
      applyRecipe(
        recipe,
        {
          topic,
          sourceText: state.content,
          ...(context.grade ? { grade: context.grade } : {}),
          ...(context.subject ? { subject: context.subject } : {}),
        },
        newId ? { newId } : {},
      ),
    );
  }

  const clearOut = () => out.replaceChildren();
  drawList();
  add(root, 
    h(
      "p.xw-lead",
      S(
        "A recipe is the shape of an activity: which parts, in which order, with which supports. Pick one, then give it your topic and your own words or questions.",
        "Una receta es la forma de una actividad: qué partes, en qué orden y con qué apoyos. Elija una y déle su tema y sus propias palabras o preguntas.",
      ),
    ),
    list,
    xfield(
      S("Topic", "Tema"),
      xinput("", (v) => ((state.topic = v), clearOut()), {
        maxlength: 80,
        placeholder: S("ecosystems", "ecosistemas"),
      }),
    ),
    xfield(
      S("Your words, questions or passage", "Sus palabras, preguntas o texto"),
      xarea("", (v) => ((state.content = v), clearOut()), {
        rows: 5,
        maxlength: 12000,
        placeholder: S(
          "habitat - the place where an animal lives",
          "habitat - el lugar donde vive un animal",
        ),
      }),
      S(
        "Only what you give here is used. Parts that need more stay empty and are listed.",
        "Solo se usa lo que usted ponga aquí. Las partes que necesitan más quedan vacías y se enumeran.",
      ),
    ),
    h(
      "div.xw-row",
      xbtn(S("Make it from this recipe", "Crear con esta receta"), apply, "primary", {
        "data-act": "apply",
      }),
    ),
    live,
    out,
    drafts?.length
      ? h(
          "details.xw-more",
          h(
            "summary",
            S(
              "Save a recipe from an activity I made",
              "Guardar una receta de una actividad que hice",
            ),
          ),
          saveRecipeBox({ S, drafts, store, onSaved: drawList }),
        )
      : null,
  );
  return root;
}
