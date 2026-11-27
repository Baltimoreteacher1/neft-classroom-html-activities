// Create · the outputs beyond HTML/PDF/Word (slides, PowerPoint, SCORM, complete package) and the saved-recipe bar.
// Everything heavy is loaded on click: JSZip and PptxGenJS are the site's own self-hosted copies, so a teacher page
// never fetches code from another host and a student page never loads any of it.

import { h } from "../studio/editor/ui.js";
import { saveBlob, slug } from "./files.js";
import { icon } from "./icons.js";
import { deleteRecipe, listRecipes, saveRecipe } from "./my-recipes.js";

const PPTX_SRC = "/assets/vendor/pptxgenjs-4.0.1/pptxgen.min.js";

function loadScript(src, global) {
  if (globalThis[global]) return Promise.resolve(globalThis[global]);
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.onload = () =>
      globalThis[global] ? resolve(globalThis[global]) : reject(new Error(global));
    el.onerror = () => reject(new Error(global));
    document.head.append(el);
  });
}

async function jszip() {
  const { loadJSZip } = await import("../studio/editor/package-download.js");
  return loadJSZip();
}

/**
 * The extra outputs as step-3 tiles: { slides, pptx, scorm, zip }, each { icon, label, sub, onclick }.
 * @param {{S: Function, lang: string, get: () => object, say: (m: string) => void}} env  get() = the built activity
 */
export function moreActions(env) {
  const { S, lang, get, say } = env;
  const failed = S(
    "That file could not be made. Try again.",
    "No se pudo crear el archivo. Intente de nuevo.",
  );
  const run = (busy, done, fn) => async () => {
    say(busy);
    try {
      await fn(get());
      say(done);
    } catch (err) {
      console.warn("[create] output failed", err);
      say(failed);
    }
  };
  return {
    slides: {
      icon: "slides",
      label: S("Slides to present", "Diapositivas para presentar"),
      sub: S("One page, offline; A shows an answer", "Una página, sin conexión; A muestra la respuesta"),
      onclick: run(
        S("Preparing slides…", "Preparando diapositivas…"),
        S(
          "Downloaded. Open it and use the arrow keys; A shows an answer.",
          "Descargado. Ábralo y use las flechas; A muestra una respuesta.",
        ),
        async (a) => {
          const { deckHtml } = await import("./deck.js");
          saveBlob(
            new Blob([deckHtml(a, { lang })], { type: "text/html" }),
            `${slug(a.title)}-slides.html`,
          );
        },
      ),
    },
    pptx: {
      icon: "pptx",
      label: S("PowerPoint slides", "Diapositivas de PowerPoint"),
      sub: S("Editable; answers in speaker notes", "Editables; respuestas en las notas"),
      onclick: run(
        S("Building the PowerPoint…", "Creando el PowerPoint…"),
        S(
          "Downloaded. Answers are in the speaker notes.",
          "Descargado. Las respuestas están en las notas del orador.",
        ),
        async (a) => {
          await jszip();
          const [PptxGenJS, { deckPptx }] = await Promise.all([
            loadScript(PPTX_SRC, "PptxGenJS"),
            import("./deck.js"),
          ]);
          const bytes = await deckPptx(a, { PptxGenJS, lang });
          saveBlob(
            new Blob([bytes], {
              type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            }),
            `${slug(a.title)}.pptx`,
          );
        },
      ),
    },
    scorm: {
      icon: "scorm",
      label: S("SCORM package", "Paquete SCORM"),
      sub: S("Canvas and other LMS; marks completion", "Canvas y otros LMS; marca la finalización"),
      onclick: run(
        S("Building the SCORM package…", "Creando el paquete SCORM…"),
        S(
          "Downloaded. Upload the .zip to your LMS as a SCORM 1.2 package. It marks completion; it does not score.",
          "Descargado. Suba el .zip a su LMS como paquete SCORM 1.2. Marca la finalización; no califica.",
        ),
        async (a) => {
          const [{ studentHtml }, { buildScorm }, JSZip] = await Promise.all([
            import("../studio/editor/preview.js"),
            import("./scorm.js"),
            jszip(),
          ]);
          const html = await studentHtml(a, { lang, scorm: true });
          saveBlob(
            new Blob([await buildScorm(a, { html, JSZip })], { type: "application/zip" }),
            `${slug(a.title)}-scorm.zip`,
          );
        },
      ),
    },
    zip: {
      icon: "zip",
      label: S("Complete package (ZIP)", "Paquete completo (ZIP)"),
      sub: S("Page, print copy, Word and key", "Página, copia, Word y clave"),
      onclick: run(
        S("Building the package…", "Creando el paquete…"),
        S(
          "Downloaded: student page, printable copy, Word file and teacher key in one folder.",
          "Descargado: página del estudiante, copia imprimible, archivo de Word y clave en una carpeta.",
        ),
        async (a) => {
          const { downloadablePackage } = await import("../studio/editor/package-download.js");
          const pkg = await downloadablePackage(a, {
            lang,
            generatedAt: new Date().toISOString().slice(0, 10),
          });
          saveBlob(pkg.blob, `${slug(a.title)}-package.zip`);
        },
      ),
    },
  };
}

/** Step 3 as titled groups of icon tiles. groups: [{ title, items: [tile|null], empty? }] */
export function tileGroups(groups) {
  return h(
    "div.cr-groups",
    groups.map((g) => {
      const items = g.items.filter(Boolean);
      return h(
        "section.cr-group",
        h("h4.cr-sub", g.title),
        g.note ? h("p.cr-fine", g.note) : null,
        items.length
          ? h(
              "div.cr-tiles",
              items.map((t) =>
                h(
                  `button.cr-tile${t.primary ? ".cr-tile-primary" : ""}`,
                  { type: "button", onclick: t.onclick },
                  h("span.cr-tile-ico", icon(t.icon)),
                  h("span.cr-tile-t", t.label),
                  t.sub ? h("span.cr-tile-s", t.sub) : null,
                ),
              ),
            )
          : g.empty
            ? h("p.cr-fine", g.empty)
            : null,
      );
    }),
  );
}

/**
 * The saved-recipe bar for step 2.
 * @param {{S: Function, io: object, current: () => {format: string, adjust: object}, can: (id: string) => boolean,
 *   apply: (recipe) => void, say: (m: string) => void}} env
 */
export function recipeBar(env) {
  const { S, io, say } = env;
  const box = h("div.cr-recipes");
  const draw = () => {
    const saved = listRecipes(io);
    const input = h("input.cr-input.cr-recipe-name", {
      type: "text",
      maxlength: 60,
      "aria-label": S("Recipe name", "Nombre de la receta"),
      placeholder: S(
        "Name these choices, e.g. Friday exit ticket",
        "Nombre para estas opciones, p. ej. Boleto del viernes",
      ),
    });
    const save = () => {
      const r = saveRecipe(io, { name: input.value, ...env.current() });
      if (r.ok) {
        say(
          S(
            `Saved "${r.recipe.name}". Use it on any page.`,
            `Se guardó "${r.recipe.name}". Úsela en cualquier página.`,
          ),
        );
        draw();
      } else
        say(
          r.reason === "name"
            ? S("Type a name for the recipe first.", "Primero escriba un nombre para la receta.")
            : S(
                "The recipe could not be saved on this device.",
                "No se pudo guardar la receta en este dispositivo.",
              ),
        );
    };
    box.replaceChildren(
      h("h4.cr-sub", S("My recipes", "Mis recetas")),
      saved.length
        ? h(
            "ul.cr-recipe-list",
            saved.map((r) =>
              h(
                "li",
                h(
                  "button.cr-btn.cr-chip",
                  {
                    type: "button",
                    disabled: !env.can(r.format),
                    title: env.can(r.format)
                      ? ""
                      : S("Not available for this page", "No disponible para esta página"),
                    onclick: () => env.apply(r),
                  },
                  r.name,
                ),
                h(
                  "button.cr-x.cr-chip-x",
                  {
                    type: "button",
                    "aria-label": S(`Delete recipe ${r.name}`, `Eliminar receta ${r.name}`),
                    onclick: () => {
                      deleteRecipe(io, r.id);
                      draw();
                    },
                  },
                  "✕",
                ),
              ),
            ),
          )
        : h(
            "p.cr-fine",
            S(
              "Save the format and adjustments you chose to reuse them on any page.",
              "Guarde el formato y los ajustes que eligió para usarlos en cualquier página.",
            ),
          ),
      h(
        "div.cr-recipe-save",
        input,
        h(
          "button.cr-btn",
          { type: "button", onclick: save },
          S("Save as recipe", "Guardar como receta"),
        ),
      ),
    );
  };
  draw();
  return box;
}
