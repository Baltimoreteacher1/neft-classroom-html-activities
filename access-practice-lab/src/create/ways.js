// Project Studio · "Describe it", the one extra way to start a Create session besides a lab page's own resource. The box
// (src/studio/editor/describe-box.js) returns a valid activity; this file hosts it inside the Create dialog. Own files and
// saved recipes already have their own entries in the panel (upload.js, my-recipes.js); the Activity Studio chooser carries
// the structure recipes and own-material boxes. The box code loads when first opened. Built with createElement only.

import { h } from "../studio/editor/ui.js";

export const WAYS = [
  {
    id: "describe",
    en: "Describe it",
    es: "Describirlo",
    load: () => import("../studio/editor/describe-box.js").then((m) => m.describeBox),
  },
];

/**
 * Show one way inside the dialog body. The box builds a valid activity; any notes (what could not be filled, what was
 * left out) are shown BEFORE it opens in the Studio, because opening reloads the page. Recipes show their own notes.
 * @param {{ S, body: HTMLElement, env: { openStudio: (activity) => void }, way: object, back: () => void }} o
 */
export async function openWay({ S, body, env, way, back }) {
  body.replaceChildren(h("p.cr-loading", { role: "status" }, S("Loading…", "Cargando…")));
  const backBtn = h(
    "button.cr-link",
    { type: "button", onclick: () => back() },
    S("← Choose another way to start", "← Elegir otra forma de empezar"),
  );
  try {
    const make = await way.load();
    const showsOwnNotes = way.id === "recipe";
    const box = make({
      S,
      context: {},
      onBuilt: ({ activity, notes = [] }) => {
        if (showsOwnNotes || !notes.length) return env.openStudio(activity);
        body.replaceChildren(
          h(
            "h3",
            { tabindex: "-1", id: "cr-notes-h" },
            S("Your first version is ready", "Su primera versión está lista"),
          ),
          h("p", S("Look at these notes first.", "Primero lea estas notas.")),
          h(
            "ul",
            notes.map((n) => h("li", S(n.en, n.es))),
          ),
          h(
            "button.cr-btn.cr-primary",
            { type: "button", onclick: () => env.openStudio(activity) },
            S(
              "Open in Activity Studio to edit or share",
              "Abrir en el Estudio de actividades para editar o compartir",
            ),
          ),
        );
        body.querySelector("#cr-notes-h")?.focus();
      },
    });
    const { ensureWireCss } = await import("./wire-kit.js");
    ensureWireCss();
    body.replaceChildren(h("h3", { tabindex: "-1" }, S(way.en, way.es)), box, h("p", backBtn));
    body.querySelector("h3")?.focus();
  } catch (err) {
    console.warn("[create] could not open", way.id, err?.code || err);
    body.replaceChildren(
      h(
        "p.cr-error",
        S("This could not load. Nothing was changed.", "No se pudo cargar. No se cambió nada."),
      ),
      backBtn,
    );
  }
}
