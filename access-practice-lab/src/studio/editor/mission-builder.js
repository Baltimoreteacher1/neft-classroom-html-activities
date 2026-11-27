// The mission builder: three plain steps (pick a mission, add your topic and source, preview) that compile ONE
// activity from the teacher's own content (x/missions.js). Stages the source cannot fill are left out and listed, never
// filled with generic text. "Use this mission" goes through store.replace, so Undo restores the previous activity.
//
//   createMissionBuilder({ S, store, onBuilt }) -> { el, render, destroy }
//   S(en, es) the editor's language picker; onBuilt(activity) after it is used (default action: store.replace)

import { button, clear, field, h, say, select, textArea, textInput } from "./ui.js";
import { ensureBrowserStyles } from "./component-browser.js";
import { studentHtml } from "./preview.js";

const SUPPORT = [
  ["light", ["Light: no extra supports", "Ligero: sin apoyos adicionales"]],
  ["guided", ["Guided: sentence frames", "Guiado: marcos de oración"]],
  [
    "full",
    [
      "Full: frames, read-aloud, short reading parts, picture words",
      "Completo: marcos, lectura en voz alta, partes cortas de lectura, imágenes de palabras",
    ],
  ],
];

export function createMissionBuilder({ S, store, onBuilt } = {}) {
  ensureBrowserStyles();
  const lang = S("en", "es") === "es" ? "es" : "en";
  const el = h("div.cb.mb");
  const form = {
    type: "",
    topic: "",
    objective: "",
    question: "",
    task: "",
    rubric: "",
    reflection: "",
    support: "light",
    sourceMode: store?.get().blocks.length ? "activity" : "none",
    pasted: "",
  };
  let step = 1;
  let result = null;
  let missions = null;
  const load = async () => (missions ||= await import("../x/missions.js"));
  const text = (t) => S(t.en, t.es);

  const heading = (n, en, es) =>
    h(
      "h3",
      { tabindex: "-1", "data-step-heading": String(n) },
      `${S("Step", "Paso")} ${n} ${S("of", "de")} 3: ${S(en, es)}`,
    );
  const error = h("p.st-hint", { role: "alert", "data-error": "" });
  const nav = (...btns) => h("div.cb-actions", ...btns);

  function pickStep(mod) {
    const group = h(
      "fieldset.st-fieldset",
      h("legend", S("Which mission do you want?", "¿Qué misión quiere?")),
    );
    for (const t of mod.missionTypes()) {
      const id = `mb-type-${t.id}`;
      const radio = h("input", {
        type: "radio",
        name: "mb-type",
        id,
        value: t.id,
        onchange: () => (form.type = t.id),
      });
      radio.checked = form.type === t.id;
      group.append(
        h(
          "div.st-toggle",
          radio,
          h("label", { for: id }, h("strong", text(t.label)), " — ", text(t.purpose)),
        ),
      );
    }
    return [
      heading(1, "Pick a mission", "Elija una misión"),
      group,
      error,
      nav(
        button(
          S("Next", "Siguiente"),
          () => (form.type ? go(2) : fail(S("Pick a mission first.", "Primero elija una misión."))),
          "primary",
        ),
      ),
    ];
  }

  function sourceStep(mod) {
    const hasContent = Boolean(store?.get().blocks.length);
    const paste = textArea(form.pasted, (v) => (form.pasted = v), {
      rows: 6,
      hidden: form.sourceMode !== "paste",
      placeholder: S(
        "word - meaning, a passage, or numbered questions with answers",
        "palabra - significado, un texto, o preguntas numeradas con respuestas",
      ),
    });
    const modes = h(
      "fieldset.st-fieldset",
      h(
        "legend",
        S(
          "Where should the mission's content come from?",
          "¿De dónde debe salir el contenido de la misión?",
        ),
      ),
    );
    for (const [value, en, es, off] of [
      [
        "activity",
        "Use what is already in my activity",
        "Usar lo que ya está en mi actividad",
        !hasContent,
      ],
      ["paste", "Paste my text", "Pegar mi texto", false],
      ["none", "Nothing yet: I will type a task", "Nada todavía: escribiré una tarea", false],
    ]) {
      const id = `mb-src-${value}`;
      const radio = h("input", {
        type: "radio",
        name: "mb-src",
        id,
        value,
        disabled: off,
        onchange: () => {
          form.sourceMode = value;
          paste.hidden = value !== "paste";
        },
      });
      radio.checked = form.sourceMode === value;
      modes.append(h("div.st-toggle", radio, h("label", { for: id }, S(en, es))));
    }
    const needs = mod.missionNeeds(form.type);
    return [
      heading(2, "Add your topic and source", "Agregue su tema y fuente"),
      field(
        S("Topic", "Tema"),
        textInput(form.topic, (v) => (form.topic = v), { maxlength: "80", required: "" }),
      ),
      field(
        S(
          "Objective (what students will do or learn)",
          "Objetivo (lo que los estudiantes harán o aprenderán)",
        ),
        textArea(form.objective, (v) => (form.objective = v), { rows: 2 }),
      ),
      field(
        S("A driving question (optional)", "Una pregunta guía (opcional)"),
        textInput(form.question, (v) => (form.question = v)),
      ),
      modes,
      paste,
      field(
        S("Speaking or writing task (optional)", "Tarea oral o escrita (opcional)"),
        textArea(form.task, (v) => (form.task = v), { rows: 2 }),
      ),
      field(
        S(
          "Success points students can read (optional, one per line)",
          "Criterios de éxito que los estudiantes pueden leer (opcional, uno por línea)",
        ),
        textArea(form.rubric, (v) => (form.rubric = v), { rows: 3 }),
      ),
      field(
        S("Reflection question (optional)", "Pregunta de reflexión (opcional)"),
        textInput(form.reflection, (v) => (form.reflection = v)),
      ),
      field(
        S("Language support", "Apoyo de lenguaje"),
        select(
          SUPPORT.map(([v, t]) => [v, S(...t)]),
          form.support,
          (v) => (form.support = v),
        ),
      ),
      h(
        "details.st-more",
        h("summary", S("What each stage needs from you", "Lo que cada etapa necesita de usted")),
        h(
          "div.st-more-body",
          h(
            "ol",
            needs.map((n) => h("li", h("strong", text(n.label)), ": ", text(n.needs))),
          ),
        ),
      ),
      h(
        "p.st-hint",
        S(
          "A stage with nothing to build it from is left out and listed on the next step. Nothing is made up.",
          "Una etapa sin contenido para crearla se omite y aparece en el siguiente paso. No se inventa nada.",
        ),
      ),
      error,
      nav(
        button(S("Back", "Atrás"), () => go(1), "ghost"),
        button(S("Preview my mission", "Ver mi misión"), preview, "primary"),
      ),
    ];
  }

  async function preview() {
    if (!form.topic.trim()) {
      fail(S("Type the topic of your mission.", "Escriba el tema de su misión."));
      return el.querySelector("input[required]")?.focus();
    }
    const mod = await load();
    const source = {};
    if (form.sourceMode === "activity" && store) source.activity = store.get();
    if (form.sourceMode === "paste" && form.pasted.trim())
      source.ingest = (await import("../x/ingest.js")).ingestText(form.pasted);
    result = mod.buildMission({ ...form, lang, source }, {});
    go(3);
  }

  async function previewStep() {
    const r = result;
    const frame = h("div");
    const list = h(
      "ul.cb-list",
      { "aria-label": S("Stages", "Etapas") },
      r.stages.map((s) => {
        const why = r.review.find((x) => x.code === "stage-omitted" && x.stage === s.id);
        return h(
          "li.cb-item",
          h(
            "strong",
            `${s.built ? S("Built", "Creada") : S("Left out", "Omitida")}: ${missions.stageLabel(s.id)[lang]}`,
          ),
          why ? h("p.cb-why", why[lang]) : null,
        );
      }),
    );
    const notes = r.review.filter((x) => x.code !== "stage-omitted");
    const useBtn = button(
      store?.get().blocks.length
        ? S(
            "Use this mission (replaces what is here; you can undo)",
            "Usar esta misión (reemplaza lo que hay; puede deshacer)",
          )
        : S("Use this mission", "Usar esta misión"),
      use,
      "primary",
      { disabled: !r.activity || !r.ok, "data-act": "use-mission" },
    );
    if (r.activity) mountFrame(frame);
    return [
      heading(3, "Preview", "Vista previa"),
      h(
        "p.cb-status",
        { role: "status" },
        r.activity
          ? r.ok
            ? S(
                "Your mission is ready to preview as students will see it.",
                "Su misión está lista para ver como la verán los estudiantes.",
              )
            : S(
                "The mission has problems to fix first.",
                "La misión tiene problemas por corregir primero.",
              )
          : S("The mission could not be built yet.", "La misión aún no se pudo crear."),
      ),
      list,
      notes.length
        ? h(
            "ul",
            notes.map((x) => h("li.st-hint", x[lang])),
          )
        : null,
      frame,
      nav(
        button(S("Back", "Atrás"), () => go(2), "ghost"),
        useBtn,
      ),
    ];
  }

  async function mountFrame(host) {
    host.replaceChildren(h("p.st-hint", S("Loading preview…", "Cargando vista previa…")));
    try {
      host.replaceChildren(
        h("iframe.cb-frame", {
          title: S("Student view of your mission", "Vista del estudiante de su misión"),
          sandbox: "allow-scripts allow-modals",
          referrerpolicy: "no-referrer",
          srcdoc: await studentHtml(result.activity, { lang, preview: true }),
        }),
      );
    } catch (err) {
      console.error("[studio] mission preview failed", err);
      host.replaceChildren(
        h(
          "p.st-hint",
          S(
            "The preview could not load. You can still use the mission.",
            "No se pudo cargar la vista previa. Aun así puede usar la misión.",
          ),
        ),
      );
    }
  }

  function use() {
    if (!result?.activity) return;
    store?.replace(result.activity, "structure");
    say(S("Mission added. You can undo this.", "Misión agregada. Puede deshacerlo."));
    onBuilt?.(result.activity);
  }

  function fail(message) {
    error.textContent = message;
  }

  async function go(n) {
    step = n;
    await paint(true);
  }

  async function paint(focus = false) {
    const mod = await load();
    clear(el);
    error.textContent = "";
    const body = step === 1 ? pickStep(mod) : step === 2 ? sourceStep(mod) : await previewStep();
    el.append(...body);
    if (focus) el.querySelector("[data-step-heading]")?.focus();
  }

  return { el, render: () => paint(false), destroy() {} };
}
