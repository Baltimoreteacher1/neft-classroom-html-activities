// Small-group pathway — the ONE definition of the five-stage lesson every Group 1,
// Group 2 and catch-up studio runs: Launch & Notice → Build Understanding →
// Solve Together → Your Turn → Prove It. The renderer, the tab rail, the Teacher
// View and the evidence summary all read it; nothing else restates a stage name
// or a minute count.
//
// Pure (no DOM) so it is node-tested in small-group-pathway.test.mjs.

/** Stage ids are the saved-state tab ids already on student devices — never rename them. */
export const STAGES = [
  {
    id: "sg-tab-words",
    key: "launch",
    label: "Launch & Notice",
    labelEs: "Observa",
    sub: "Look, wonder, key words",
    minutes: { group1: 3, group2: 2, catchup: 3 },
  },
  {
    id: "sg-tab-learn",
    key: "build",
    label: "Build Understanding",
    labelEs: "Construye la idea",
    sub: "See it and move the model",
    minutes: { group1: 5, group2: 4, catchup: 5 },
  },
  {
    id: "sg-tab-together",
    key: "together",
    label: "Solve Together",
    labelEs: "Resuelvan juntos",
    sub: "Think, discuss, compare",
    minutes: { group1: 4, group2: 4, catchup: 4 },
  },
  {
    id: "sg-tab-own",
    key: "own",
    label: "Your Turn",
    labelEs: "Tu turno",
    sub: "Try it yourself",
    minutes: { group1: 4, group2: 5, catchup: 4 },
  },
  {
    id: "sg-tab-check",
    key: "prove",
    label: "Prove It",
    labelEs: "Demuéstralo",
    sub: "Show what you know",
    minutes: { group1: 3, group2: 4, catchup: 3 },
  },
];

/** Six-tab studios saved their place on these ids; Apply now lives inside Prove It. */
export const LEGACY_TAB = { "sg-tab-apply": "sg-tab-check" };

export const variantOf = (config) => {
  const id = String(config?.variant || config?.lessonId || "");
  if (/group2/.test(id)) return "group2";
  if (/catchup/.test(id)) return "catchup";
  return "group1";
};

export const stageById = (id) => STAGES.find((s) => s.id === (LEGACY_TAB[id] || id));

export function stageMinutes(variant) {
  return STAGES.map((s) => ({ id: s.id, key: s.key, label: s.label, minutes: s.minutes[variant] }));
}

export const totalMinutes = (variant) => STAGES.reduce((n, s) => n + s.minutes[variant], 0);

/** Restore a saved tab id, mapping retired ids onto the stage that absorbed them. */
export const restoreTab = (saved, available) => {
  const id = LEGACY_TAB[saved] || saved;
  return available.includes(id) ? id : null;
};

const MATERIALS = {
  ratioTable: "Ratio-table paper or a whiteboard grid",
  tape: "Strips of paper or square tiles for tape diagrams",
  numberLine: "A number-line strip (or ruler) and a marker",
  coordGrid: "Coordinate-grid paper and a straightedge",
  dotPlot: "Sticky dots or a marker for a dot plot",
  histogram: "Grid paper for a histogram",
  boxPlot: "Number-line paper for a box plot",
  hundredGrid: "A 10 × 10 grid and two colours",
  areaModel: "Grid paper for area models",
  prism: "Linking cubes for building prisms",
  balance: "Counters for an equation balance",
  fractionBars: "Fraction strips",
  factorTree: "Scrap paper for factor trees",
  longDivision: "Lined paper for the division algorithm",
  shape: "Ruler and grid paper for shapes",
  table: "Notebook for tables",
};

/** Materials a teacher should have at the table, read from the figures the lesson really draws. */
export function materialsFor(config) {
  const kinds = new Set();
  const walk = (o) => {
    if (!o || typeof o !== "object") return;
    if (typeof o.kind === "string" && MATERIALS[o.kind]) kinds.add(o.kind);
    for (const v of Object.values(o)) walk(v);
  };
  walk(config?.launch?.practice);
  walk(config?.launch?.build);
  return ["Student notebook and pencil", ...[...kinds].map((k) => MATERIALS[k])];
}

/** "I can write a ratio" → "How can we write a ratio?" Falls back to the objective itself. */
export function essentialQuestion(config) {
  const raw = String(config?.contentObjective || "")
    .replace(/^\s*(today:?\s*)?/i, "")
    .replace(/^I can\s+/i, "")
    .replace(/[.!]+$/, "")
    .trim();
  return raw ? `How can we ${raw.charAt(0).toLowerCase()}${raw.slice(1)}?` : "";
}

/**
 * Next-step instructional decision from a finished evidence summary. The thresholds
 * are on INDEPENDENT work only: a score earned with hints is support, not mastery.
 */
export function nextStep({ independent = 0, total = 0 } = {}) {
  if (!total) return { band: "none", student: "", teacher: "" };
  const share = independent / total;
  if (share >= 0.8)
    return {
      band: "secure",
      student: "Ready for the Challenge, or the next lesson.",
      studentEs: "Listo para el Desafío o la próxima lección.",
      teacher:
        "Independent and secure. Move to the Challenge investigation or release to the next lesson.",
    };
  if (share >= 0.5)
    return {
      band: "growing",
      student: "Practice one more problem like the ones you missed.",
      studentEs: "Practica un problema más como los que fallaste.",
      teacher:
        "Mostly independent. Re-teach the missed idea with the model, then give a fresh problem before moving on.",
    };
  return {
    band: "support",
    student: "Review the model with your teacher, then try again.",
    studentEs: "Repasa el modelo con tu maestro y vuelve a intentarlo.",
    teacher:
      "Most success needed support. Re-teach with a concrete model at the table and consider the catch-up lesson.",
  };
}
