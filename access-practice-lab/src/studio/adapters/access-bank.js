// Adapter: ACCESS Practice Lab bank sets (content/bank/*.json: 40 sets, 320 items across Reading, Listening, Speaking and
// Writing). Every item becomes one editable question; the passage, table, audio script or task text it uses becomes a
// content block. The bank is "WIDA-aligned original practice": nothing here is, or is labelled as, official WIDA/ACCESS.

import { blocksForStimulus, STIMULUS_KINDS } from "./access-bank-stimuli.js";
import { questionFor } from "./access-bank-questions.js";
import { list, noteBlocks, shorten, t, text } from "./util.js";

const BANK = "/access-practice-lab/content/bank";
const ID = /^[a-z0-9][a-z0-9-]{0,40}$/i;
const NOTE_MAX = 2000;

/** Domain -> how the draft is shaped. Open-response domains become a check with an explain-and-revise flow. */
const SHAPE = {
  Reading: { kind: "interactive", template: "interactive-reading" },
  Listening: { kind: "interactive", template: "explore-practice" },
  Speaking: { kind: "check", template: "explain-revise" },
  Writing: { kind: "check", template: "explain-revise" },
};

const DOMAIN_NOTE = {
  Listening: (set) => {
    const plays = Math.max(0, ...list(set.stimuli).map((s) => Number(s.maxPlays) || 0));
    return `Listening: the original plays each clip at most ${plays || 2} times with no pausing, in ACCESS Practice Lab test-simulation mode. This copy is instructional practice: the read-aloud script and a transcript are both on the page.`;
  },
  Speaking: () =>
    "Speaking tasks are open responses. They are never auto-graded: use the self-check list and your own listening.",
  Writing: () =>
    "Writing tasks are open responses. They are never auto-graded: use the self-check list and your own reading.",
};

const unique = (values) => [...new Set(values.filter(Boolean))];

function teacherNote(set, items) {
  const prov = set.bank?.provenance || {};
  const review = text(set.bank?.reviewStatus);
  const lines = [
    `Copied from the ACCESS Practice Lab bank (${set.id}). WIDA-aligned original practice; not official WIDA or ACCESS material.`,
    `Provenance: ${text(prov.source) || "unknown"}${prov.author ? `, ${text(prov.author)}` : ""}${prov.created ? `, created ${text(prov.created)}` : ""}. Review status: ${review || "unknown"}${review === "automated-checks-only" ? " (no human review yet: check every answer before you share)" : ""}.`,
    DOMAIN_NOTE[set.domain]?.(set),
    `Language functions: ${unique(items.flatMap((i) => list(i.meta?.functions))).join("; ")}.`,
    `Language features: ${unique(items.flatMap((i) => list(i.meta?.features))).join("; ")}.`,
    `Bank standard families: ${unique(items.map((i) => i.meta?.standard)).join(", ")}.`,
  ].filter(Boolean);
  const kept = [];
  let size = 0;
  for (const line of lines) {
    if (size + line.length + 1 > NOTE_MAX) break;
    kept.push(line);
    size += line.length + 1;
  }
  return { teacher: kept.join("\n"), dropped: lines.length - kept.length };
}

function adapterNotes(set, flags, dropped) {
  const out = [
    t(
      "The bank's WIDA standard ids, bands, cognitive and language-demand labels are not carried. This copy is WIDA-aligned original practice, not an official ACCESS item.",
      "No se conservan los identificadores de estándares WIDA, las bandas ni las etiquetas de nivel cognitivo y de demanda lingüística del banco. Esta copia es práctica original alineada con WIDA, no un ítem oficial de ACCESS.",
    ),
    t(
      "The reference facts the bank uses for its own checks are not carried.",
      "No se conservan los datos de referencia que el banco usa en sus propias revisiones.",
    ),
    t(
      "Each mentor example is kept in a teacher-only note above its question; students do not see it.",
      "Cada ejemplo modelo se conserva en una nota solo para docentes sobre su pregunta; los estudiantes no lo ven.",
    ),
  ];
  if (set.domain === "Listening")
    out.push(
      t(
        "Controlled playback (a limited number of plays, no pausing) is not carried. Students can listen as often as they like and read the transcript.",
        "No se conserva la reproducción controlada (número limitado de reproducciones, sin pausar). Los estudiantes pueden escuchar las veces que quieran y leer la transcripción.",
      ),
    );
  if (set.domain === "Speaking")
    out.push(
      t(
        "Preparation and recording times, the number of takes and audio recording stay in the original practice mode. Students write or say their answer here.",
        "Los tiempos de preparación y grabación, el número de intentos y la grabación de audio permanecen en el modo de práctica original. Aquí los estudiantes escriben o dicen su respuesta.",
      ),
    );
  if (set.domain === "Writing")
    out.push(
      t(
        "The maximum word count is stated in each prompt but not enforced; the minimum is checked.",
        "El máximo de palabras se indica en cada consigna pero no se exige; el mínimo sí se verifica.",
      ),
    );
  if (flags.has("match-extra-dropped"))
    out.push(
      t(
        "Some matching items had extra right-hand choices that are too long to show as groups; they are listed in the teacher note above that question.",
        "Algunos ítems de emparejar tenían opciones adicionales demasiado largas para mostrarlas como grupos; aparecen en la nota para docentes sobre esa pregunta.",
      ),
    );
  if (flags.has("table-as-text"))
    out.push(
      t(
        "A table with long cells is shown as lines of text (one line per row) because table cells hold at most 80 characters.",
        "Una tabla con celdas largas se muestra como líneas de texto (una línea por fila) porque las celdas de una tabla admiten como máximo 80 caracteres.",
      ),
    );
  if (flags.has("dropdown-sanitized"))
    out.push(
      t(
        "A drop-down answer contained a character that fill-in-the-blank cannot hold; it was replaced with a plain one.",
        "Una respuesta de menú desplegable tenía un carácter que el espacio en blanco no admite; se reemplazó por uno sencillo.",
      ),
    );
  if (dropped)
    out.push(
      t(
        "Some background lines did not fit in the teacher notes and were left out.",
        "Algunas líneas de contexto no cabían en las notas para docentes y se omitieron.",
      ),
    );
  return out;
}

const objectiveOf = (set, items) => {
  const uses = unique(items.map((i) => i.klu));
  return `${set.domain} practice across these language uses: ${uses.join(", ")}.`.slice(0, 400);
};

export default {
  family: "access-bank",
  label: t("ACCESS Practice Lab question sets", "Conjuntos de preguntas de ACCESS Practice Lab"),
  note: t(
    "Copies a reading, listening, speaking or writing practice set so you can reword questions, change choices, hints and frames, and add your own. The original set is never changed.",
    "Copia un conjunto de práctica de lectura, escucha, expresión oral o escritura para que pueda cambiar las preguntas, las opciones, las pistas y los marcos, y agregar las suyas. El conjunto original nunca cambia.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "passage",
    "table",
    "audio",
    "prompts",
    "choices",
    "pairs",
    "answerKeys",
    "hints",
    "frames",
    "explanations",
    "rubric",
    "samples",
    "openResponses",
    "teacherNotes",
    "supports",
  ],
  fixed: [
    {
      what: t(
        "Controlled listening playback (limited plays, no pausing)",
        "Reproducción controlada de la escucha (reproducciones limitadas, sin pausar)",
      ),
      why: t(
        "Official-style controlled playback is preserved only in the original ACCESS Practice Lab practice mode. The customized copy is instructional practice with the script and transcript on the page.",
        "La reproducción controlada al estilo oficial solo se conserva en el modo de práctica original de ACCESS Practice Lab. La copia personalizada es práctica de instrucción, con el guion y la transcripción en la página.",
      ),
    },
    {
      what: t(
        "Test-simulation mode, recording and preparation timers",
        "Modo de simulación de examen, grabación y temporizadores de preparación",
      ),
      why: t(
        "The Activity Studio never offers timers, and recordings stay in the original practice mode.",
        "Activity Studio nunca ofrece temporizadores, y las grabaciones permanecen en el modo de práctica original.",
      ),
    },
    {
      what: t("Scoring of speaking and writing", "Calificación de expresión oral y escrita"),
      why: t(
        "Open responses are never auto-graded. Students self-check with the list; the teacher reads or listens.",
        "Las respuestas abiertas nunca se califican automáticamente. Los estudiantes se autoevalúan con la lista; el docente lee o escucha.",
      ),
    },
  ],

  async list({ fetchJson }) {
    const index = await fetchJson(`${BANK}/index.json`);
    return list(index.sets).map((s) => ({
      id: s.id,
      title: s.title,
      grade: s.grade,
      subject: "",
      domain: s.domain,
      description: s.description,
      count: list(s.items).length,
    }));
  },

  url: (ref) => `/access-practice-lab/assess/${ref}`,

  async extract(ref, { fetchJson }) {
    if (!ID.test(String(ref))) throw new Error("bad-ref");
    const set = await fetchJson(`${BANK}/${ref}.json`);
    if (!set || set.id !== ref || !Array.isArray(set.items)) throw new Error("bad-source");
    const shape = SHAPE[set.domain] || SHAPE.Reading;
    const stims = new Map(list(set.stimuli).map((s) => [s.id, s]));
    const flags = new Set();
    const blocks = [];
    const shown = new Set();
    const misconceptions = [];
    set.items.forEach((item, i) => {
      const stim = stims.get(item.stimulus);
      if (stim && !shown.has(stim.id)) {
        shown.add(stim.id);
        blocks.push(...blocksForStimulus(stim, flags));
      }
      const made = questionFor(item, i + 1);
      for (const f of made.flags) flags.add(f);
      blocks.push(...noteBlocks(item.id, made.support), made.question);
      if (made.misconceptions)
        misconceptions.push(shorten(`Question ${i + 1}: ${made.misconceptions}`, 300));
    });
    const unused = [...stims.values()].filter(
      (s) => !shown.has(s.id) && STIMULUS_KINDS.includes(s.kind),
    );
    const lead = unused.flatMap((st) => blocksForStimulus(st, flags));
    const note = teacherNote(set, set.items);
    return {
      activity: {
        title: set.title,
        description: text(set.description),
        kind: shape.kind,
        template: shape.template,
        context: {
          grade: text(set.grade),
          subject: "",
          curriculum: "ACCESS Practice Lab (WIDA-aligned original practice)",
          objective: objectiveOf(set, set.items),
          standards: [],
          source: {
            origin: "teacher",
            note: `Copied from ACCESS Practice Lab bank set ${set.id}. WIDA-aligned original practice.`,
          },
        },
        supports: {
          wida: 0,
          hints: true,
          frames: true,
          readAloud: false,
          visuals: false,
          chunk: false,
          spanish: false,
        },
        options: { shuffle: false, revise: true, answerKey: true },
        blocks: [...lead, ...blocks],
        notes: { teacher: note.teacher, misconceptions: misconceptions.slice(0, 8) },
      },
      notes: adapterNotes(set, flags, note.dropped),
      source: set,
      url: `/access-practice-lab/assess/${set.id}`,
      sourceTitle: set.title,
    };
  },
};
