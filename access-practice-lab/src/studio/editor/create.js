// Steps 1 and 2: choose what to make, then give it what students should learn. One screen each, one primary
// button each. Curriculum context from the page the teacher came from fills the header; nothing is asked twice.

import { createActivity } from "../core/build.js";
import {
  GRADES,
  SUBJECTS,
  SUBJECT_LABELS,
  contextFromUnit,
  fetchUnit,
  fetchUnits,
  recommendForSubject,
  seedFromDetail,
} from "../core/curriculum.js";
import { button, clear, field, h, select, textArea } from "./ui.js";

const KINDS = [
  {
    id: "interactive",
    icon: "◐",
    en: "Interactive Activity",
    es: "Actividad interactiva",
    textEn: "Create something students can click, move, match, build, or explore.",
    textEs: "Cree algo que los estudiantes puedan tocar, mover, emparejar, armar o explorar.",
  },
  {
    id: "worksheet",
    icon: "▤",
    en: "Worksheet",
    es: "Hoja de trabajo",
    textEn: "Create a beautiful worksheet students can print or complete digitally.",
    textEs:
      "Cree una hoja de trabajo hermosa que los estudiantes puedan imprimir o completar en pantalla.",
  },
  {
    id: "game",
    icon: "◆",
    en: "Learning Game",
    es: "Juego de aprendizaje",
    textEn: "Turn your lesson into an engaging learning game.",
    textEs: "Convierta su lección en un juego de aprendizaje divertido.",
  },
  {
    id: "check",
    icon: "✓",
    en: "Quick Check",
    es: "Revisión rápida",
    textEn: "See what students understand with a quick activity or exit ticket.",
    textEs: "Vea lo que entienden los estudiantes con una actividad rápida o boleto de salida.",
  },
];
const MODES = [
  ["lesson", "Use This Lesson", "Usar esta lección"],
  ["content", "Add My Content", "Agregar mi contenido"],
  ["idea", "Describe My Idea", "Describir mi idea"],
];
const EXAMPLES = {
  content: [
    "habitat - the place where an animal lives\npredator - an animal that hunts other animals\n…",
    "habitat - el lugar donde vive un animal\ndepredador - un animal que caza a otros animales\n…",
  ],
  idea: [
    "Create an interactive Grade 6 activity about ratios with tables and visual models. Include six questions and Spanish vocabulary support.",
    "Cree una actividad interactiva de 6.º grado sobre razones con tablas y modelos visuales. Incluya seis preguntas y apoyo de vocabulario en español.",
  ],
};

export const KIND_IDS = KINDS.map((k) => k.id);

/** Step 1: four large choices. */
export function chooseScreen({ S, onPick, onSample, welcome, onDismissWelcome }) {
  const cards = KINDS.map((k) =>
    h(
      "button.st-kind",
      { type: "button", "data-kind": k.id, onclick: () => onPick(k.id) },
      h("span.st-kind-icon", { "aria-hidden": "true" }, k.icon),
      h("strong", S(k.en, k.es)),
      h("span", S(k.textEn, k.textEs)),
    ),
  );
  return h(
    "section.st-choose",
    welcome
      ? h(
          "div.st-welcome",
          h(
            "div",
            h("h2", S("Create an activity in minutes.", "Cree una actividad en minutos.")),
            h(
              "p",
              S(
                "Choose a type, add your lesson, and we'll build the activity. You can change anything before sharing.",
                "Elija un tipo, agregue su lección y nosotros armamos la actividad. Puede cambiar lo que quiera antes de compartir.",
              ),
            ),
          ),
          button(S("Got it", "Entendido"), onDismissWelcome, "small ghost"),
        )
      : null,
    h("h1", { tabindex: "-1" }, S("What would you like to create?", "¿Qué le gustaría crear?")),
    h("div.st-kinds", cards),
    h(
      "p.st-sample",
      S("Want to look around first? ", "¿Quiere mirar primero? "),
      button(
        S("Open a sample activity", "Abrir una actividad de ejemplo"),
        onSample,
        "ghost small",
      ),
    ),
  );
}

/** Step 2: the single creation screen. `state` is mutated in place and redrawn through `redraw`. */
export function contentScreen({
  S,
  state,
  redraw,
  onCreate,
  onBack,
  aiAvailable,
  fetchImpl = (...a) => fetch(...a),
}) {
  const kind = KINDS.find((k) => k.id === state.kind);
  const ctx = state.context;
  const root = h("section.st-create");
  const status = h("p.st-status", { role: "status", "aria-live": "polite" });

  const gradeSel = select(
    [["", S("Grade…", "Grado…")], ...GRADES.map((g) => [g, S(`Grade ${g}`, `Grado ${g}`)])],
    ctx.grade || "",
    (v) => {
      ctx.grade = v;
      ctx.unitId = "";
      state.units = null;
      state.detail = null;
      redraw();
    },
    { "aria-label": S("Grade", "Grado") },
  );
  const subjSel = select(
    [["", S("Subject…", "Materia…")], ...SUBJECTS.map((s) => [s, S(...SUBJECT_LABELS[s])])],
    ctx.subject || "",
    (v) => {
      ctx.subject = v;
      ctx.unitId = "";
      state.units = null;
      state.detail = null;
      redraw();
    },
    { "aria-label": S("Subject", "Materia") },
  );
  const unitSel = select(
    [
      [
        "",
        state.units
          ? S("Unit…", "Unidad…")
          : S("Choose grade and subject", "Elija grado y materia"),
      ],
      ...(state.units || []).map((u) => [u.id, `${u.unit_number}. ${u.unit_title}`]),
    ],
    ctx.unitId || "",
    async (v) => {
      ctx.unitId = v;
      state.detail = null;
      if (v) await loadDetail();
      redraw();
    },
    { "aria-label": S("Unit", "Unidad"), disabled: !state.units },
  );

  async function loadUnits() {
    if (!ctx.grade || !ctx.subject || state.units) return;
    try {
      state.units = await fetchUnits(ctx.grade, ctx.subject, fetchImpl);
    } catch {
      state.units = [];
      state.unitsError = true;
    }
    redraw();
  }
  async function loadDetail() {
    if (!ctx.unitId) return;
    try {
      state.detail = await fetchUnit(ctx.unitId, fetchImpl);
    } catch {
      state.detail = null;
      state.unitsError = true;
    }
  }
  loadUnits();
  if (ctx.unitId && !state.detail && !state.detailLoading) {
    state.detailLoading = true;
    loadDetail().then(() => {
      state.detailLoading = false;
      redraw();
    });
  }

  const header = h(
    "div.st-context",
    { role: "group", "aria-label": S("Curriculum context", "Contexto del currículo") },
    gradeSel,
    subjSel,
    unitSel,
  );
  const tabs = h(
    "div.st-tabs",
    { role: "tablist" },
    MODES.map(([id, en, es]) =>
      h(
        "button.st-tab",
        {
          type: "button",
          role: "tab",
          id: `tab-${id}`,
          "aria-selected": String(state.mode === id),
          "aria-controls": "st-mode-panel",
          onclick: () => ((state.mode = id), redraw()),
        },
        S(en, es),
      ),
    ),
  );

  const panel = h("div#st-mode-panel.st-mode", {
    role: "tabpanel",
    "aria-labelledby": `tab-${state.mode}`,
  });
  if (state.mode === "lesson") {
    const unit = state.detail?.unit;
    if (!ctx.unitId)
      panel.append(
        h(
          "p",
          S(
            "Choose a grade, subject and unit above. We use its words, language frames and goals.",
            "Elija un grado, una materia y una unidad arriba. Usamos sus palabras, marcos de lenguaje y metas.",
          ),
        ),
      );
    else if (!unit)
      panel.append(
        h(
          "p",
          state.unitsError
            ? S(
                "That unit could not load. Try again, or use Add My Content.",
                "No se pudo cargar esa unidad. Intente de nuevo o use Agregar mi contenido.",
              )
            : S("Loading the unit…", "Cargando la unidad…"),
        ),
      );
    else {
      const seed = seedFromDetail(state.detail);
      const rec = recommendForSubject(unit.subject);
      panel.append(
        h("h3", unit.unit_title),
        h("p", unit.unit_summary),
        h(
          "p.st-hint",
          S(
            `${seed.vocab.length} vocabulary words and the unit's sentence frames are ready to use.`,
            `${seed.vocab.length} palabras de vocabulario y los marcos de oración de la unidad están listos.`,
          ),
        ),
        rec && state.kind !== rec.kind ? h("p.st-rec", S(...rec.why)) : null,
      );
    }
  } else {
    const [en, es] = EXAMPLES[state.mode];
    const label =
      state.mode === "content"
        ? S(
            "Paste or type your vocabulary, questions, a passage, or math problems",
            "Pegue o escriba su vocabulario, preguntas, un texto o problemas de matemáticas",
          )
        : S(
            "Describe what you want, in your own words",
            "Describa lo que quiere, con sus propias palabras",
          );
    const area = textArea(state.text, (v) => (state.text = v), {
      rows: 9,
      placeholder: S(en, es),
      maxlength: 12000,
    });
    panel.append(field(label, area));
    if (state.mode === "content")
      panel.append(
        h(
          "p.st-hint",
          S(
            "One word per line works: word - meaning. Questions can have choices a) b) c) with * before the right one. Math problems like 3/4 + 1/2 are calculated for you.",
            "Funciona una palabra por línea: palabra - significado. Las preguntas pueden tener opciones a) b) c) con * antes de la correcta. Los problemas como 3/4 + 1/2 se calculan solos.",
          ),
        ),
      );
    if (state.mode === "idea" && !aiAvailable)
      panel.append(
        h(
          "p.st-rec",
          S(
            "The drafting helper is not turned on here, so I will read your idea for the basics (type, number of questions, supports) and use your lesson or words. Add them for the best result.",
            "El asistente de redacción no está activado aquí, así que leeré su idea para lo básico (tipo, cantidad de preguntas, apoyos) y usaré su lección o sus palabras. Agréguelas para el mejor resultado.",
          ),
        ),
      );
  }

  const go = button(
    S("Create My Activity", "Crear mi actividad"),
    async () => {
      go.disabled = true;
      status.textContent = S("Building your activity…", "Armando su actividad…");
      const seed = state.detail ? seedFromDetail(state.detail) : null;
      const context = state.detail?.unit
        ? { ...contextFromUnit(state.detail.unit), ...(ctx.grade ? {} : {}) }
        : { grade: ctx.grade, subject: ctx.subject };
      const res = await createActivity({
        mode: state.mode,
        kind: state.kind,
        text: state.text,
        context,
        seed,
        ai: state.ai,
      });
      go.disabled = false;
      if (!res.activity) {
        status.textContent = "";
        state.needs = res.needs;
        return redraw();
      }
      onCreate(res);
    },
    "primary big",
  );

  clear(root);
  root.append(
    h("div.st-back", button(S("← Change type", "← Cambiar el tipo"), onBack, "ghost small")),
    h("h1", { tabindex: "-1" }, S(kind.en, kind.es)),
    h(
      "p.st-lead",
      S("Add what students should learn.", "Agregue lo que los estudiantes deben aprender."),
    ),
    header,
    tabs,
    panel,
    state.needs?.length
      ? h(
          "div.st-needs",
          { role: "alert" },
          state.needs.map((n) => h("p", n)),
        )
      : null,
    h("div.st-go", go, status),
  );
  return root;
}
