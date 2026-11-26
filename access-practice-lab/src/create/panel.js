// Project Studio · the Create panel. Three steps in one dialog: choose what to make, preview and adjust, use or
// download. It inherits the page's resource (an adapter source) and shows a REAL preview: the student page the
// Activity Studio player renders, or the printed page the worksheet renderer makes. Built with createElement only.

import { h } from "../studio/editor/ui.js";
import { ADJUST, buildResource, defaultFormat, formatStatus, outputsFor } from "./build.js";
import { saveBlob, slug, wordFile } from "./files.js";
import { openPacket } from "./packet.js";
import { addItem, lastChoiceFor, readSession, rememberChoice } from "./session.js";

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
      state.base = activity;
      const last = lastChoiceFor(io, source);
      state.format = last?.format || defaultFormat(activity, ["worksheet", "interactive"]);
      state.adjust = last?.adjust || {};
      render();
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
        "p.cr-lede",
        S(
          "Start from something already on The Language Page. You get an editable copy; the original never changes.",
          "Empiece con algo que ya está en The Language Page. Recibe una copia editable; el original nunca cambia.",
        ),
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
    state.built = buildResource(state.base, { format: state.format, adjust: state.adjust });
    rememberChoice(io, {
      source: state.source,
      format: state.built.format,
      adjust: state.built.adjust,
    });
  }

  function render() {
    rebuild();
    const b = state.built;
    const statuses = formatStatus(state.base);
    const can = statuses.filter((f) => f.can);
    const cannot = statuses.filter((f) => !f.can);
    const frame = h("iframe.cr-frame", {
      title: S("Preview", "Vista previa"),
      sandbox: "allow-scripts",
      referrerpolicy: "no-referrer",
    });
    const out = outputsFor(b.activity);
    const viewOpts = [{ id: "student", label: S("Student screen", "Pantalla del estudiante") }];
    if (out.print)
      viewOpts.push(
        { id: "print", label: S("Printed page", "Página impresa") },
        { id: "key", label: S("Answer key", "Clave de respuestas") },
      );
    // a printable format previews the printed page first; the teacher can switch to the student screen
    if (!viewOpts.some((v) => v.id === state.view)) state.view = out.print ? "print" : "student";

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
      h(
        "fieldset.cr-formats",
        h("legend.cr-sr", S("Format", "Formato")),
        can.map((f) =>
          h(
            "label.cr-format",
            h("input", {
              type: "radio",
              name: "cr-format",
              value: f.id,
              checked: f.id === b.format,
              onchange: () => ((state.format = f.id), (state.view = ""), render()),
            }),
            h("span.cr-format-t", S(f.label.en, f.label.es)),
            h("span.cr-format-h", S(f.hint.en, f.hint.es)),
          ),
        ),
      ),
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
        Object.entries(ADJUST).map(([key, spec]) =>
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
    );

    const actions = [
      h(
        "button.cr-btn.cr-primary",
        { type: "button", onclick: () => env.openStudio(b.activity) },
        S(
          "Open in Activity Studio to edit or share",
          "Abrir en el Estudio de actividades para editar o compartir",
        ),
      ),
      h(
        "button.cr-btn",
        { type: "button", onclick: () => addToPacket() },
        S("Add to packet", "Agregar al paquete"),
      ),
      h(
        "button.cr-btn",
        { type: "button", onclick: () => downloadHtml() },
        S("Download HTML (works offline)", "Descargar HTML (funciona sin conexión)"),
      ),
      out.print
        ? h(
            "button.cr-btn",
            { type: "button", onclick: () => printPart("student") },
            S("Print or save as PDF", "Imprimir o guardar como PDF"),
          )
        : null,
      out.docx
        ? h(
            "button.cr-btn",
            { type: "button", onclick: () => word("student") },
            S("Download editable Word file", "Descargar archivo de Word editable"),
          )
        : null,
      out.key
        ? h(
            "button.cr-btn",
            { type: "button", onclick: () => word("key") },
            S("Answer key (Word)", "Clave de respuestas (Word)"),
          )
        : null,
      out.key
        ? h(
            "button.cr-btn",
            { type: "button", onclick: () => printPart("key") },
            S("Print answer key", "Imprimir clave"),
          )
        : null,
    ];
    const step3 = h(
      "section.cr-step",
      { "aria-labelledby": "cr-s3" },
      h("h3", { id: "cr-s3" }, h("span.cr-n", "3"), S("Use it", "Úselo")),
      h("div.cr-actions", actions),
      out.print
        ? null
        : h(
            "p.cr-fine",
            S(
              "PDF and Word come from worksheets and exit tickets. Choose Worksheet in step 1 for a printable version.",
              "PDF y Word se hacen con hojas de trabajo y boletos de salida. Elija Hoja de trabajo en el paso 1 para una versión imprimible.",
            ),
          ),
    );
    body.replaceChildren(step1, step2, step3);

    async function paint() {
      try {
        const { studentHtml, printHtml } = await loaders.preview();
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
