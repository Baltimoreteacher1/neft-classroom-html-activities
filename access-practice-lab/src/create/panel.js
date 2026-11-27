// Project Studio · the Create panel. Three steps in one dialog: choose what to make, preview and adjust, use or
// download. It inherits the page's resource (an adapter source) and shows a REAL preview: the student page the
// Activity Studio player renders, or the printed page the worksheet renderer makes. Built with createElement only.

import { h } from "../studio/editor/ui.js";
import { ADJUST, buildResource, defaultFormat, formatStatus, outputsFor } from "./build.js";
import { saveBlob, slug, wordFile } from "./files.js";
import { moreActions, recipeBar, tileGroups } from "./extras.js";
import { icon } from "./icons.js";
import { openPacket } from "./packet.js";
import { WAYS, openWay } from "./ways.js";
import { addItem, lastChoiceFor, readSession, rememberChoice } from "./session.js";
import { supportData, supportsPanel } from "./supports-ui.js";
import { showUpload } from "./upload.js";

const FAMILY_LABEL = {
  "access-bank": ["ACCESS practice set", "Conjunto de práctica ACCESS"],
  "vocab-academy": ["Vocabulary Academy lesson", "Lección de la Academia de Vocabulario"],
  "reading-room": ["Reading Room lesson", "Lección de la Sala de Lectura"],
  "bcpss-unit": ["BCPSS unit", "Unidad de BCPSS"],
};

const loaders = {
  registry: () => import("../studio/adapters/registry.js"),
  preview: () => import("../studio/editor/preview.js"),
  print: () => import("../studio/print/open-print.js"),
};

/** A labelled radio group (fieldset + legend). Arrow keys move between options natively. */
function radios(name, legend, options, value, onChange) {
  return h(
    "fieldset.cr-seg",
    h("legend", legend),
    options.map((o) =>
      h(
        "label.cr-seg-opt",
        h("input", {
          type: "radio",
          name,
          value: o.id,
          checked: o.id === value,
          onchange: () => onChange(o.id),
        }),
        h("span", o.label),
      ),
    ),
  );
}

function summaryLine(S, activity, source) {
  const c = activity.context || {};
  const bits = [
    source ? S(...(FAMILY_LABEL[source.family] || ["Resource", "Recurso"])) : "",
    c.grade ? S(`Grade ${c.grade}`, `Grado ${c.grade}`) : "",
    c.subject || "",
    c.unitTitle || "",
  ].filter(Boolean);
  return bits.join(" · ");
}

/**
 * Open the Create panel.
 * @param {{ S, lang, io, fetchJson, source?: {family, ref, band?}, openStudio: (activity) => void, trigger?: Element }} env
 */
export function openCreate(env) {
  const { S, lang, io, fetchJson } = env;
  const dlg = h("dialog.cr-dialog", { "aria-labelledby": "cr-title" });
  const status = h("p.cr-status", { role: "status", "aria-live": "polite" });
  const body = h("div.cr-body");
  const say = (msg) => {
    status.textContent = msg;
  };
  const close = () => dlg.close();
  const packetBtn = h(
    "button.cr-btn.cr-quiet",
    { type: "button", onclick: () => openPacket(env) },
    packetLabel(S, io),
  );
  dlg.append(
    h(
      "div.cr-head",
      h("h2", { id: "cr-title" }, S("Create", "Crear")),
      packetBtn,
      h("button.cr-x", { type: "button", "aria-label": S("Close", "Cerrar"), onclick: close }, "✕"),
    ),
    body,
    status,
  );
  dlg.addEventListener("close", () => {
    dlg.remove();
    env.trigger?.focus?.();
  });
  document.body.append(dlg);
  dlg.showModal();

  const state = {
    source: env.source || null,
    base: null,
    format: "",
    adjust: {},
    supports: { level: "grade", on: [] },
    built: null,
    view: "",
  };

  async function load(source) {
    state.source = source;
    body.replaceChildren(
      h(
        "p.cr-loading",
        { role: "status" },
        S("Reading this page's content…", "Leyendo el contenido de esta página…"),
      ),
    );
    try {
      const { customizeFrom } = await loaders.registry();
      const { activity } = await customizeFrom(source.family, source.ref, {
        fetchJson,
        ...(source.band ? { band: source.band } : {}),
      });
      useBase(activity, source);
    } catch (err) {
      console.warn("[create] could not read source", err?.code || err);
      body.replaceChildren(
        h(
          "p.cr-error",
          S(
            "This page's content could not be read for Create. Nothing was changed.",
            "No se pudo leer el contenido de esta página para Crear. No se cambió nada.",
          ),
        ),
        h(
          "button.cr-btn",
          { type: "button", onclick: () => picker() },
          S("Choose another resource", "Elegir otro recurso"),
        ),
      );
    }
  }

  /** Start from an activity already in hand (a page's content, or the teacher's own file). */
  function useBase(activity, source, review = []) {
    state.source = source;
    state.base = activity;
    state.review = review;
    const last = lastChoiceFor(io, source);
    state.format = last?.format || defaultFormat(activity, ["worksheet", "interactive"]);
    state.adjust = last?.adjust || {};
    state.supports = last?.supports || { level: "grade", on: [] };
    render();
  }

  async function picker() {
    const { listFamilies, adapterFor } = await loaders.registry();
    const fams = listFamilies();
    let family = state.source?.family || fams[0].family;
    let rows = [];
    const list = h("ul.cr-pick-list");
    const search = h("input.cr-input", {
      type: "search",
      "aria-label": S("Search", "Buscar"),
      placeholder: S("Search by title or grade", "Buscar por título o grado"),
    });
    const draw = () => {
      const q = search.value.trim().toLowerCase();
      const hits = rows.filter(
        (r) =>
          !q ||
          `${r.title} ${r.grade || ""} ${r.subject || ""} ${r.domain || ""}`
            .toLowerCase()
            .includes(q),
      );
      list.replaceChildren(
        ...hits
          .slice(0, 60)
          .map((r) =>
            h(
              "li",
              h(
                "button.cr-pick",
                { type: "button", onclick: () => load({ family, ref: r.id }) },
                h("strong", r.title),
                h(
                  "span",
                  [
                    r.grade ? S(`Grade ${r.grade}`, `Grado ${r.grade}`) : "",
                    r.subject || r.domain || "",
                  ]
                    .filter(Boolean)
                    .join(" · "),
                ),
              ),
            ),
          ),
        hits.length > 60
          ? h(
              "li.cr-fine",
              S(
                `${hits.length - 60} more: search to narrow.`,
                `${hits.length - 60} más: busque para filtrar.`,
              ),
            )
          : null,
        hits.length ? null : h("li.cr-fine", S("Nothing matches.", "Nada coincide.")),
      );
    };
    const pickFamily = async (id) => {
      family = id;
      list.replaceChildren(h("li.cr-fine", { role: "status" }, S("Loading…", "Cargando…")));
      try {
        rows = await adapterFor(id).list({ fetchJson });
      } catch {
        rows = [];
      }
      draw();
    };
    search.addEventListener("input", draw);
    body.replaceChildren(
      h(
        "div.cr-ways",
        { role: "group", "aria-label": S("Other ways to start", "Otras formas de empezar") },
        WAYS.map((way) =>
          h(
            "button.cr-btn",
            { type: "button", "data-way": way.id, onclick: () => openWay({ S, body, env, way, back: picker }) },
            S(way.en, way.es),
          ),
        ),
      ),
      h(
        "p.cr-lede",
        S(
          "Start from something already on The Language Page. You get an editable copy; the original never changes.",
          "Empiece con algo que ya está en The Language Page. Recibe una copia editable; el original nunca cambia.",
        ),
      ),
      h(
        "button.cr-btn",
        {
          type: "button",
          onclick: () => showUpload({ S, lang, body, onActivity: useBase, back: picker }),
        },
        icon("upload", "cr-glyph"),
        S("Use your own file or text", "Usar su propio archivo o texto"),
      ),
      radios(
        "cr-family",
        S("Start from", "Empezar con"),
        fams.map((f) => ({ id: f.family, label: S(f.label.en, f.label.es) })),
        family,
        pickFamily,
      ),
      search,
      list,
    );
    pickFamily(family);
  }

  function rebuild() {
    state.built = buildResource(state.base, {
      format: state.format,
      adjust: state.adjust,
      supports: state.supports,
    });
    rememberChoice(io, {
      source: state.source,
      format: state.built.format,
      adjust: state.built.adjust,
      supports: state.built.supports,
    });
  }

  function render() {
    rebuild();
    const b = state.built;
    const statuses = formatStatus(state.base);
    const can = statuses.filter((f) => f.can && !f.recipe);
    const recipes = statuses.filter((f) => f.can && f.recipe);
    const cannot = statuses.filter((f) => !f.can);
    const frame = h("iframe.cr-frame", {
      title: S("Preview", "Vista previa"),
      sandbox: "allow-scripts",
      referrerpolicy: "no-referrer",
    });
    const out = outputsFor(b.activity);
    const viewOpts = [{ id: "student", label: S("Student screen", "Pantalla del estudiante") }];
    const slidesView = { id: "slides", label: S("Slides", "Diapositivas") };
    if (out.print)
      viewOpts.push(
        { id: "print", label: S("Printed page", "Página impresa") },
        { id: "key", label: S("Answer key", "Clave de respuestas") },
      );
    // a printable format previews the printed page first; the teacher can switch to the student screen
    viewOpts.push(slidesView);
    if (!viewOpts.some((v) => v.id === state.view)) state.view = out.print ? "print" : "student";

    // one radio group (name cr-format) across the core formats and the recipes, so exactly one is ever chosen
    const formatCards = (legend, list, chosen) =>
      h(
        "fieldset.cr-formats",
        h("legend.cr-sr", legend),
        list.map((f) =>
          h(
            "label.cr-format",
            { "data-tone": f.recipe ? "recipe" : f.id },
            h("span.cr-format-ico", icon(f.recipe ? "recipe" : f.id)),
            h("input", {
              type: "radio",
              name: "cr-format",
              value: f.id,
              checked: f.id === chosen,
              onchange: () => ((state.format = f.id), (state.view = ""), render()),
            }),
            h("span.cr-format-t", S(f.label.en, f.label.es)),
            h("span.cr-format-h", S(f.hint.en, f.hint.es)),
          ),
        ),
      );

    const step1 = h(
      "section.cr-step",
      { "aria-labelledby": "cr-s1" },
      h("h3", { id: "cr-s1" }, h("span.cr-n", "1"), S("What do you want to make?", "¿Qué quiere crear?")),
      h(
        "p.cr-context",
        h("span.cr-from", S("From this page:", "De esta página:")),
        " ",
        h("strong", state.base.lineage?.title || state.base.title),
        h("span.cr-fine", ` ${summaryLine(S, state.base, state.source)}`),
        " ",
        h(
          "button.cr-link",
          { type: "button", onclick: picker },
          S("Use something else", "Usar otra cosa"),
        ),
      ),
      formatCards(S("Format", "Formato"), can, b.format),
      recipes.length
        ? h(
            "details.cr-more.cr-recipes-ready",
            { open: recipes.some((f) => f.id === b.format) },
            h(
              "summary",
              S(
                `Ready-made recipes (${recipes.length}): a proven order of parts, filled from this page`,
                `Recetas listas (${recipes.length}): un orden probado de partes, con el contenido de esta página`,
              ),
            ),
            formatCards(S("Recipe", "Receta"), recipes, b.format),
          )
        : null,
      cannot.length
        ? h(
            "details.cr-more",
            h(
              "summary",
              S(
                `Why ${cannot.length} other format${cannot.length === 1 ? " is" : "s are"} not offered`,
                `Por qué no se ofrecen ${cannot.length} formatos más`,
              ),
            ),
            h(
              "ul",
              cannot.map((f) =>
                h(
                  "li",
                  h("strong", S(f.label.en, f.label.es)),
                  ": ",
                  f.reason ? S(f.reason.en, f.reason.es) : "",
                ),
              ),
            ),
          )
        : null,
    );

    const step2 = h(
      "section.cr-step",
      { "aria-labelledby": "cr-s2" },
      h("h3", { id: "cr-s2" }, h("span.cr-n", "2"), S("Preview and adjust", "Vista previa y ajustes")),
      h(
        "div.cr-adjust",
        // language support is the Supports panel below; the older preset stays readable for saved choices
        Object.entries(ADJUST)
          .filter(([key]) => key !== "support")
          .map(([key, spec]) =>
          radios(
            `cr-${key}`,
            S(spec.label.en, spec.label.es),
            spec.values.map((v) => ({ id: v.id, label: S(v.label.en, v.label.es) })),
            b.adjust[key],
            (id) => {
              state.adjust = { ...state.adjust, [key]: id };
              render();
            },
          ),
        ),
      ),
      supportsPanel({
        S,
        value: state.supports,
        data: supportData(state.base),
        onChange: (v) => {
          state.supports = v;
          render();
        },
      }),
      viewOpts.length > 1
        ? radios(
            "cr-view",
            S("Show", "Mostrar"),
            viewOpts,
            state.view,
            (id) => ((state.view = id), paint()),
          )
        : null,
      h("div.cr-stage", frame),
      notes(S, b),
      state.review?.length
        ? h(
            "details.cr-more",
            h(
              "summary",
              S(
                `${state.review.length} thing${state.review.length === 1 ? "" : "s"} in your file to check (left out, never guessed)`,
                `${state.review.length} cosa${state.review.length === 1 ? "" : "s"} de su archivo para revisar (se omitieron, nunca se adivinan)`,
              ),
            ),
            h("ul", state.review.slice(0, 20).map((r) => h("li", r))),
          )
        : null,
      recipeBar({
        S,
        io,
        say,
        current: () => ({
          format: state.built.format,
          adjust: state.built.adjust,
          supports: state.built.supports,
        }),
        can: (id) => statuses.some((f) => f.id === id && f.can),
        apply: (r) => {
          state.format = r.format;
          state.adjust = r.adjust;
          state.supports = r.supports;
          state.view = "";
          render();
          say(S(`Recipe "${r.name}" applied.`, `Se aplicó la receta "${r.name}".`));
        },
      }),
    );

    const words = (state.base.blocks || []).filter((x) => x.type === "vocab").reduce((n, x) => n + x.items.length, 0);
    const more = moreActions({ S, lang, say, get: () => state.built.activity });
    const tile = (ic, label, sub, onclick, primary = false) => ({ icon: ic, label, sub, onclick, primary });
    const groups = [
      {
        title: S("Use with students", "Usar con estudiantes"),
        items: [
          tile("open", S("Open in Activity Studio", "Abrir en el Estudio de actividades"), S("Edit, assign or share a link", "Editar, asignar o compartir un enlace"), () => env.openStudio(b.activity), true),
          tile("html", S("Download HTML", "Descargar HTML"), S("Works offline in any browser", "Funciona sin conexión"), () => downloadHtml()),
          more.slides,
          more.pptx,
        ],
      },
      {
        title: S("Print and edit", "Imprimir y editar"),
        items: [
          ...(out.print
          ? [
              tile("print", S("Print or save as PDF", "Imprimir o guardar como PDF"), S("Student copy, US Letter", "Copia del estudiante, carta"), () => printPart("student")),
              out.docx ? tile("word", S("Editable Word file", "Archivo de Word editable"), S("Change anything in Word", "Cambie lo que quiera en Word"), () => word("student")) : null,
              out.key ? tile("key", S("Answer key (Word)", "Clave de respuestas (Word)"), S("Teacher copy only", "Solo para el docente"), () => word("key")) : null,
              out.key ? tile("print", S("Print answer key", "Imprimir clave"), S("Teacher copy only", "Solo para el docente"), () => printPart("key")) : null,
            ]
          : []),
          words
            ? tile("cards", S("Word cards to print", "Tarjetas de palabras"), S(`${words} words: meaning, example, draw it`, `${words} palabras: significado, ejemplo, dibujo`), () => printCards())
            : null,
        ],
        note: out.print ? null : S(
          "PDF and Word come from worksheets and exit tickets. Choose Worksheet in step 1 for a printable version.",
          "PDF y Word se hacen con hojas de trabajo y boletos de salida. Elija Hoja de trabajo en el paso 1 para una versión imprimible.",
        ),
      },
      {
        title: S("Share and bundle", "Compartir y agrupar"),
        items: [
          tile("packet", S("Add to packet", "Agregar al paquete"), S("Combine pages into one PDF or Word file", "Una varias páginas en un PDF o Word"), () => addToPacket()),
          more.scorm,
          more.zip,
        ],
      },
    ];
    const step3 = h(
      "section.cr-step",
      { "aria-labelledby": "cr-s3" },
      h("h3", { id: "cr-s3" }, h("span.cr-n", "3"), S("Use it", "Úselo")),
      tileGroups(groups),
    );
    body.replaceChildren(step1, step2, step3);

    async function paint() {
      try {
        const { studentHtml, printHtml } = await loaders.preview();
        if (state.view === "slides") {
          const { deckHtml } = await import("./deck.js");
          frame.srcdoc = deckHtml(b.activity, { lang });
          return;
        }
        frame.srcdoc =
          state.view === "student"
            ? await studentHtml(b.activity, { lang, preview: true })
            : (
                await printHtml(b.activity, {
                  lang,
                  part: state.view === "key" ? "key" : "student",
                })
              ).html;
      } catch (err) {
        console.error("[create] preview failed", err);
        say(
          S(
            "The preview could not load. Your choices are kept.",
            "No se pudo cargar la vista previa. Sus opciones se guardaron.",
          ),
        );
      }
    }
    paint();
  }

  function addToPacket() {
    const b = state.built;
    const r = addItem(io, {
      title: b.activity.title,
      source: state.source,
      format: b.format,
      adjust: b.adjust,
      activity: b.activity,
    });
    packetBtn.textContent = packetLabel(S, io);
    env.onPacketChange?.();
    if (r.ok)
      say(
        S(
          `Added. The packet has ${r.session.items.length} part${r.session.items.length === 1 ? "" : "s"}. Keep browsing and add more from other pages.`,
          `Agregado. El paquete tiene ${r.session.items.length} parte(s). Siga navegando y agregue más desde otras páginas.`,
        ),
      );
    else if (r.reason === "full")
      say(
        S(
          "The packet is full (12 parts). Print or clear it first.",
          "El paquete está lleno (12 partes). Imprímalo o vacíelo primero.",
        ),
      );
    else
      say(
        S(
          "This device could not save the packet. Free some space or print what you have.",
          "Este dispositivo no pudo guardar el paquete. Libere espacio o imprima lo que tiene.",
        ),
      );
  }

  async function downloadHtml() {
    say(S("Preparing…", "Preparando…"));
    try {
      const { studentHtml } = await loaders.preview();
      saveBlob(
        new Blob([await studentHtml(state.built.activity, { lang })], { type: "text/html" }),
        `${slug(state.built.activity.title)}.html`,
      );
      say(
        S(
          "Downloaded. It opens in any browser, with no internet.",
          "Descargado. Se abre en cualquier navegador, sin internet.",
        ),
      );
    } catch {
      say(
        S(
          "The file could not be made. Try again.",
          "No se pudo crear el archivo. Intente de nuevo.",
        ),
      );
    }
  }

  /** Word cards from the page's own word list (the base: a format such as an exit ticket may drop the list). */
  async function printCards() {
    const { wordCardsHtml } = await import("./word-cards.js");
    const { html } = wordCardsHtml(state.base, { lang });
    (await loaders.print()).openPrint(html, { lang, onFallback: say });
  }

  async function printPart(part) {
    const { printHtml } = await loaders.preview();
    const { html: doc } = await printHtml(state.built.activity, { lang, part });
    (await loaders.print()).openPrint(doc, { lang, onFallback: say });
  }

  async function word(part) {
    say(S("Building the Word file…", "Creando el archivo de Word…"));
    const ok = await wordFile(state.built.activity, part, lang);
    say(
      ok
        ? S("Downloaded.", "Descargado.")
        : S(
            "The Word file could not be made. Try again.",
            "No se pudo crear el archivo de Word. Intente de nuevo.",
          ),
    );
  }

  if (state.source) load(state.source);
  else picker();
  return { close };
}

function notes(S, b) {
  const errs = b.validation?.errors || [];
  const items = [
    ...errs.map((e) =>
      h("li.cr-warn", typeof e === "string" ? e : S(e.en || e.message || "", e.es || e.en || "")),
    ),
    ...b.warnings.map((w) => h("li.cr-warn", S(w.en, w.es))),
    ...b.changes.map((c) => h("li", S(c.en, c.es))),
  ];
  if (!items.length)
    return h(
      "p.cr-fine",
      S(
        "Made from this page's own content. Nothing was invented.",
        "Hecho con el contenido de esta página. No se inventó nada.",
      ),
    );
  return h(
    "details.cr-more",
    { open: errs.length > 0 || b.warnings.length > 0 },
    h(
      "summary",
      S(
        `What was changed and what to review (${items.length})`,
        `Qué cambió y qué revisar (${items.length})`,
      ),
    ),
    h("ul", items),
  );
}

export function packetLabel(S, io) {
  const n = readSession(io).items.length;
  return n ? S(`Packet (${n})`, `Paquete (${n})`) : S("Packet", "Paquete");
}
