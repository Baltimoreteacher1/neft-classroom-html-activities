// Book Studio 2.0 · the LanguageSupport model: types, trusted normalization, resolution for an audience, fading and the
// support-use record. Pure (no DOM, no storage) so Node can test it.
//
// One LanguageSupport is anchored to a target (whole book, a page, an element, a selected phrase or a story choice),
// tagged with who it is for (levels, grade clusters, domain, Key Language Use) and how strongly it is offered
// (intensity). The audience resolver decides, per learner, whether it is ASSIGNED, available on demand ("help"), or
// not shown. Teacher preview uses the same resolver with a chosen profile, so a teacher sees exactly what a student sees.
import {
  DOMAINS,
  GRADE_CLUSTER_IDS,
  INTENSITIES,
  INTENSITY_RANK,
  KEY_LANGUAGE_USES,
  MODES,
  intensityFor,
  normalizePlan,
} from "./profiles.js";

const rnd = () => Math.random().toString(36).slice(2, 8);
export const newSupportId = () => `sp${Date.now().toString(36)}${rnd()}`;
const str = (v, max = 400) => String(v ?? "").slice(0, max);
const idOk = (v) => /^[a-z0-9]{4,40}$/i.test(v || "");

/** [id, English, Spanish]. The kinds ARE the library categories A–F; a type's renderer handles every kind of it. */
const k = (...rows) => rows.map(([id, en, es]) => ({ id, en, es: es || en }));

export const SUPPORT_TYPES = Object.freeze({
  vocab: {
    en: "Vocabulary",
    es: "Vocabulario",
    domain: "reading",
    category: "A",
    kinds: k(
      ["bank", "Illustrated word bank", "Banco de palabras con imágenes"],
      ["bilingual", "Bilingual glossary", "Glosario bilingüe"],
      ["multilingual", "Multilingual word bank", "Banco de palabras multilingüe"],
      ["character", "Character words", "Palabras del personaje"],
      ["setting", "Setting words", "Palabras del escenario"],
      ["action", "Action verbs", "Verbos de acción"],
      ["emotion", "Feeling words", "Palabras de emociones"],
      ["academic", "Academic words", "Palabras académicas"],
      ["genre", "Genre words", "Palabras del género"],
      ["synonym", "Synonyms", "Sinónimos"],
      ["antonym", "Antonyms", "Antónimos"],
      ["cognate", "Cognates", "Cognados"],
      ["family", "Word family", "Familia de palabras"],
      ["affix", "Prefix, root, suffix", "Prefijo, raíz, sufijo"],
      ["collocation", "Words that go together", "Palabras que van juntas"],
      ["match", "Word-to-picture match", "Unir palabra e imagen"],
      ["wordmap", "Word map", "Mapa de palabras"],
      ["personal", "My word collection", "Mi colección de palabras"],
    ),
  },
  frame: {
    en: "Sentence starter",
    es: "Inicio de oración",
    domain: "writing",
    category: "B",
    kinds: k(
      ["starter", "Short sentence starter", "Inicio corto"],
      ["stem", "Open-ended stem", "Inicio abierto"],
      ["sentence", "Complete sentence frame", "Marco de oración completo"],
      ["descriptive", "Describe frame", "Marco para describir"],
      ["narrative", "Narrative frame", "Marco narrativo"],
      ["dialogue", "Dialogue frame", "Marco de diálogo"],
      ["prediction", "Prediction frame", "Marco de predicción"],
      ["causeEffect", "Cause and effect frame", "Marco de causa y efecto"],
      ["compare", "Compare and contrast frame", "Marco para comparar"],
      ["opinion", "Opinion frame", "Marco de opinión"],
      ["cer", "Claim, evidence, reasoning", "Afirmación, evidencia, razonamiento"],
      ["reflection", "Reflection frame", "Marco de reflexión"],
      ["character", "Character analysis frame", "Marco de análisis del personaje"],
      ["problemSolution", "Problem and solution frame", "Marco de problema y solución"],
      ["sequence", "Sequence frame", "Marco de secuencia"],
      ["paragraph", "Paragraph frame", "Marco de párrafo"],
      ["cloze", "Cloze paragraph", "Párrafo con espacios"],
      ["expansion", "Sentence expansion", "Ampliar la oración"],
      ["combining", "Sentence combining", "Combinar oraciones"],
      ["mentor", "Mentor sentence", "Oración modelo"],
      ["substitution", "Substitution table", "Tabla de sustitución"],
      ["transitions", "Transition phrases", "Frases de transición"],
      ["grammar", "Grammar revision prompt", "Pregunta de gramática"],
      ["variation", "Sentence variety challenge", "Reto de variedad"],
    ),
  },
  organizer: {
    en: "Organizer",
    es: "Organizador",
    domain: "writing",
    category: "C",
    kinds: k(
      ["bme", "Beginning, middle, end", "Principio, medio, final"],
      ["mountain", "Story mountain", "Montaña del cuento"],
      ["plot", "Plot planner", "Plan de la trama"],
      ["character", "Character profile", "Perfil del personaje"],
      ["relationships", "Character relationships", "Relaciones entre personajes"],
      ["setting", "Setting planner", "Plan del escenario"],
      ["problemSolution", "Problem and solution", "Problema y solución"],
      ["conflict", "Conflict and resolution", "Conflicto y resolución"],
      ["sequence", "Sequence cards", "Tarjetas de secuencia"],
      ["timeline", "Event timeline", "Línea de tiempo"],
      ["causeEffect", "Cause and effect map", "Mapa de causa y efecto"],
      ["dialogue", "Dialogue planner", "Plan del diálogo"],
      ["motivation", "Character motivation", "Motivación del personaje"],
      ["mainIdea", "Main idea and details", "Idea principal y detalles"],
      ["compare", "Compare and contrast map", "Mapa para comparar"],
      ["argument", "Argument planner", "Plan del argumento"],
      ["evidence", "Evidence organizer", "Organizador de evidencia"],
      ["paragraphOutline", "Paragraph outline", "Esquema del párrafo"],
      ["infoStructure", "Informational text structure", "Estructura del texto informativo"],
      ["branching", "Story branching planner", "Plan de ramas"],
      ["chapters", "Chapter planning board", "Tablero de capítulos"],
      ["storyboard", "Scene storyboard", "Guion gráfico"],
    ),
  },
  rehearsal: {
    en: "Speaking and listening",
    es: "Hablar y escuchar",
    domain: "speaking",
    category: "D",
    kinds: k(
      ["oral", "Oral rehearsal", "Ensayo oral"],
      ["recordFirst", "Record before writing", "Grabar antes de escribir"],
      ["listenRepeat", "Listen and repeat", "Escuchar y repetir"],
      ["narration", "Student narration", "Narración del estudiante"],
      ["dialogueRecord", "Character dialogue recording", "Grabar el diálogo"],
      ["partner", "Partner discussion", "Conversación con un compañero"],
      ["starters", "Conversation starters", "Para empezar a conversar"],
      ["turnTaking", "Turn-taking frames", "Turnos para hablar"],
      ["readersTheater", "Reader's theater practice", "Teatro de lectores"],
      ["retell", "Story retelling", "Volver a contar"],
      ["audioModel", "Audio model", "Modelo en audio"],
      ["feedbackAudio", "Teacher audio feedback", "Comentarios en audio"],
      ["listenRevise", "Listen and revise", "Escuchar y revisar"],
      ["reflect", "Speaking reflection", "Reflexión oral"],
      ["voice", "Character voice performance", "Voz del personaje"],
      ["explain", "Oral explanation", "Explicación oral"],
    ),
  },
  reading: {
    en: "Reading support",
    es: "Apoyo para leer",
    domain: "reading",
    category: "E",
    kinds: k(
      ["readAloud", "Read aloud", "Lectura en voz alta"],
      ["readAlong", "Highlighted read-along", "Lectura con resaltado"],
      ["chunked", "Chunked reading", "Lectura por partes"],
      ["highlight", "Key information", "Información clave"],
      ["inContext", "Vocabulary in context", "Vocabulario en contexto"],
      ["mainIdea", "Main idea prompt", "Pregunta de idea principal"],
      ["detail", "Supporting detail prompt", "Pregunta de detalles"],
      ["predict", "Prediction", "Predicción"],
      ["infer", "Inference prompt", "Pregunta de inferencia"],
      ["evidence", "Evidence selection", "Elegir evidencia"],
      ["motivation", "Character motivation prompt", "Motivación del personaje"],
      ["sequence", "Sequencing activity", "Actividad de secuencia"],
      ["contextClue", "Context clues", "Pistas del contexto"],
      ["recap", "Story recap", "Resumen del cuento"],
      ["connect", "Scene-to-scene connection", "Conectar escenas"],
      ["sideBySide", "Side-by-side translation", "Traducción lado a lado"],
      ["annotation", "Teacher annotation", "Anotación del docente"],
      ["reflectionCard", "Reader reflection card", "Tarjeta de reflexión"],
    ),
  },
  revision: {
    en: "Revision",
    es: "Revisión",
    domain: "writing",
    category: "F",
    kinds: k(
      ["elaborate", "Elaborate an idea", "Ampliar una idea"],
      ["details", "Add descriptive details", "Agregar detalles"],
      ["vague", "Replace vague language", "Cambiar palabras vagas"],
      ["clarity", "Improve clarity", "Mejorar la claridad"],
      ["combine", "Combine related ideas", "Unir ideas"],
      ["transitions", "Improve transitions", "Mejorar transiciones"],
      ["causeEffect", "Strengthen cause and effect", "Fortalecer causa y efecto"],
      ["pronoun", "Clarify pronouns", "Aclarar pronombres"],
      ["dialogue", "Develop dialogue", "Desarrollar el diálogo"],
      ["voice", "Strengthen character voice", "Fortalecer la voz"],
      ["evidence", "Improve evidence", "Mejorar la evidencia"],
      ["cohesion", "Improve cohesion", "Mejorar la cohesión"],
      ["argument", "Clarify argument", "Aclarar el argumento"],
      ["paragraph", "Improve paragraph organization", "Organizar el párrafo"],
      ["audience", "Consider audience", "Pensar en la audiencia"],
      ["genre", "Improve genre conventions", "Convenciones del género"],
      ["compare", "Compare original and revised", "Comparar original y revisado"],
      ["independent", "Name an independent improvement", "Mejora independiente"],
      ["applyFeedback", "Apply feedback to a new scene", "Aplicar comentarios a una escena nueva"],
      ["reflection", "Reflect on revision", "Reflexión sobre la revisión"],
    ),
  },
  model: {
    en: "Model example",
    es: "Ejemplo modelo",
    domain: "writing",
    category: "B",
    kinds: k(["example", "Model example", "Ejemplo modelo"]),
  },
  note: {
    en: "Teacher note",
    es: "Nota del docente",
    domain: "reading",
    category: "E",
    kinds: k(["note", "Teacher note", "Nota del docente"]),
  },
});
export const SUPPORT_TYPE_IDS = Object.freeze(Object.keys(SUPPORT_TYPES));
export const SCOPES = Object.freeze(["book", "page", "element", "selection", "choice"]);
export const PLACEMENTS = Object.freeze(["inline", "drawer", "before", "revision"]);

/** Everything a record or a published edition can say about what a support did. */
export const RECORD_ACTIONS = Object.freeze([
  "available",
  "opened",
  "used",
  "completed",
  "hidden",
  "required",
  "independent",
]);

const cleanList = (v, allowed, max = 12) =>
  (Array.isArray(v) ? v : []).filter((x) => allowed.includes(x)).slice(0, max);
const cleanWords = (v) =>
  (Array.isArray(v) ? v : []).slice(0, 60).map((w) => ({
    w: str(w?.w ?? w, 60),
    def: str(w?.def, 240),
    tr: Object.fromEntries(
      Object.entries(w?.tr && typeof w.tr === "object" ? w.tr : {})
        .slice(0, 8)
        .map(([code, text]) => [str(code, 12).toLowerCase(), str(text, 120)]),
    ),
    mt: w?.mt === true, // machine-translated: always labelled in the UI
    art: /^[a-z0-9-]{2,40}$/.test(w?.art || "") ? w.art : "",
    example: str(w?.example, 240),
    media: str(w?.media, 60), // a teacher-recorded pronunciation
  }));
const cleanCells = (v) =>
  (Array.isArray(v) ? v : []).slice(0, 16).map((c, i) => ({
    id: idOk(c?.id) ? c.id : `c${i + 1}${rnd()}`,
    label: str(c?.label, 80),
    prompt: str(c?.prompt, 200),
  }));
const cleanStrings = (v, n, max) => (Array.isArray(v) ? v : []).slice(0, n).map((x) => str(x, max));

/** The type-specific payload, trusted. */
export function normalizeContent(type, raw = {}) {
  const c = raw && typeof raw === "object" ? raw : {};
  switch (type) {
    case "vocab":
      return { words: cleanWords(c.words), langs: cleanStrings(c.langs, 6, 12) };
    case "frame":
      return {
        frames: cleanStrings(c.frames, 12, 300),
        bank: cleanStrings(c.bank, 30, 60),
        table: (Array.isArray(c.table) ? c.table : [])
          .slice(0, 5)
          .map((col) => cleanStrings(col, 8, 60)),
      };
    case "organizer":
      return {
        cells: cleanCells(c.cells),
        layout: ["grid", "chain", "mountain", "map"].includes(c.layout) ? c.layout : "grid",
      };
    case "rehearsal":
      return {
        prompt: str(c.prompt, 400),
        steps: cleanStrings(c.steps, 6, 200),
        model: str(c.model, 500),
        allowText: c.allowText !== false, // a non-microphone path is always available
      };
    case "reading":
      return {
        prompts: cleanStrings(c.prompts, 8, 300),
        chunks: cleanStrings(c.chunks, 20, 400),
        highlights: cleanStrings(c.highlights, 20, 120),
      };
    case "revision":
      return { prompts: cleanStrings(c.prompts, 8, 300) };
    case "model":
      return { text: str(c.text, 800), note: str(c.note, 300) };
    case "note":
      return { text: str(c.text, 800) };
    default:
      return {};
  }
}

const ATTEMPT_AFTER = [0, 1, 2, 3, 4, 5];

/** Trusted shape of one support; unknown fields are dropped. Used on load, import, paste and every AI/rule proposal. */
export function normalizeSupport(raw = {}) {
  const type = SUPPORT_TYPES[raw.type] ? raw.type : "frame";
  const T = SUPPORT_TYPES[type];
  const kind = T.kinds.some((x) => x.id === raw.kind) ? raw.kind : T.kinds[0].id;
  const t = raw.target && typeof raw.target === "object" ? raw.target : {};
  const scope = SCOPES.includes(t.scope) ? t.scope : "book";
  const fade = raw.fade && typeof raw.fade === "object" ? raw.fade : {};
  return {
    id: idOk(raw.id) ? raw.id : newSupportId(),
    v: 1,
    type,
    kind,
    title: str(raw.title, 100) || T.kinds.find((x) => x.id === kind).en,
    teacherInstructions: str(raw.teacherInstructions, 600),
    studentInstructions: str(raw.studentInstructions, 300),
    target: {
      scope,
      pageId: scope === "book" ? "" : str(t.pageId, 40),
      elementId: scope === "element" || scope === "selection" ? str(t.elementId, 40) : "",
      text: scope === "selection" ? str(t.text, 200) : "",
      choiceId: scope === "choice" ? str(t.choiceId, 40) : "",
    },
    gradeClusters: cleanList(raw.gradeClusters, GRADE_CLUSTER_IDS),
    levels: (Array.isArray(raw.levels) ? raw.levels : [])
      .map(Number)
      .filter((n) => n >= 1 && n <= 6)
      .filter((n, i, a) => a.indexOf(n) === i)
      .sort(),
    domain: DOMAINS.includes(raw.domain) ? raw.domain : T.domain,
    mode: MODES.includes(raw.mode) ? raw.mode : "",
    keyUse: KEY_LANGUAGE_USES.includes(raw.keyUse) ? raw.keyUse : "",
    objective: str(raw.objective, 300),
    displayLang: str(raw.displayLang, 12) || "en",
    translate: raw.translate === true,
    audio: raw.audio === true,
    cue: /^[a-z0-9-]{2,40}$/.test(raw.cue || "") ? raw.cue : "",
    intensity: ["heavy", "moderate", "minimal"].includes(raw.intensity)
      ? raw.intensity
      : "moderate",
    canHide: raw.canHide !== false,
    required: raw.required === true,
    placement: PLACEMENTS.includes(raw.placement) ? raw.placement : "inline",
    fade: {
      enabled: fade.enabled === true,
      after: ATTEMPT_AFTER.includes(Number(fade.after)) ? Number(fade.after) : 2,
    },
    inPublished: raw.inPublished === true,
    authoringOnly: raw.authoringOnly === true,
    evidence: raw.evidence !== false,
    source: ["teacher", "library", "pack", "designer", "suggested"].includes(raw.source)
      ? raw.source
      : "teacher",
    packId: str(raw.packId, 40),
    reviewed: raw.reviewed !== false, // a rule/AI-suggested support is not required until a teacher reviews it
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 0,
    content: normalizeContent(type, raw.content),
  };
}

export function makeSupport(type, kind, props = {}) {
  return normalizeSupport({ ...props, type, kind });
}

/** The set of supports in a book, normalized and ordered. */
export const supportsOf = (book) =>
  (Array.isArray(book?.supports) ? book.supports : [])
    .map(normalizeSupport)
    .sort((a, b) => a.order - b.order);

/** Does `support` anchor to this page/element/selection? Book-level supports match every page. */
export function targets(support, { pageId = "", elementId = "", choiceId = "" } = {}) {
  const t = support.target;
  if (t.scope === "book") return true;
  if (t.scope === "page") return !pageId || t.pageId === pageId;
  if (t.scope === "choice") return !choiceId || t.choiceId === choiceId;
  return (!pageId || t.pageId === pageId) && (!elementId || t.elementId === elementId);
}

/** Records for one support, newest last. A record is { supportId, action, at, attempt? }. */
export const recordsFor = (records, supportId) =>
  (Array.isArray(records) ? records : []).filter((r) => r.supportId === supportId);

/** How many times a learner completed the target task independently (without opening or using this support). */
export const independentCount = (records, supportId) =>
  recordsFor(records, supportId).filter((r) => r.action === "independent").length;

/** True when the teacher turned fading on for this support and the learner has met the teacher's threshold. */
export const isFaded = (support, records) =>
  support.fade.enabled &&
  !support.required &&
  independentCount(records, support.id) >= support.fade.after;

/**
 * Resolve which supports one learner sees, and how.
 *  audience: { profile: 0..6, plan?, records?, grade?, mode: "student" | "author" | "reader" | "publish" }
 *  where:    { pageId, elementId, choiceId }
 * Returns [{ support, tier: "assigned" | "help", required, faded }]. "help" supports sit behind the Help button.
 * Never throws; an unknown profile behaves as "help on demand".
 */
export function resolveSupports(book, audience = {}, where = {}) {
  const plan = normalizePlan(audience.plan || { profile: audience.profile || 0 });
  const profile = audience.profile ?? plan.profile;
  const mode = audience.mode || "student";
  const cluster = audience.grade || book?.gradeCluster || "";
  const out = [];
  for (const s of supportsOf(book)) {
    if (!targets(s, where)) continue;
    if (mode === "publish" && !s.inPublished) continue;
    if (mode !== "author" && s.authoringOnly) continue;
    if (mode === "reader") {
      // A reader of a published edition never has a profile: every allowed support is simply there on request.
      if (s.inPublished) out.push({ support: s, tier: "help", required: false, faded: false });
      continue;
    }
    if (s.gradeClusters.length && cluster && !s.gradeClusters.includes(cluster)) continue;
    // "Help on demand" with no profile offers every written support when asked; it assigns none.
    const forLevel = !s.levels.length || (profile > 0 && s.levels.includes(profile)) || (profile === 0 && plan.intensity === "help");
    if (s.required && forLevel) {
      out.push({ support: s, tier: "assigned", required: true, faded: false });
      continue;
    }
    if (!forLevel) continue;
    const faded = isFaded(s, audience.records);
    const want = INTENSITY_RANK[intensityFor(plan, s.domain)];
    const assignedNow = want > 0 && INTENSITY_RANK[s.intensity] <= want && !faded && plan.intensity !== "none";
    if (assignedNow) out.push({ support: s, tier: "assigned", required: false, faded: false });
    else if (plan.intensity !== "none" || mode === "author") out.push({ support: s, tier: "help", required: false, faded });
  }
  return out;
}

/** A learner's support-use record, as plain counts for the teacher. Fewer clicks never means more proficiency. */
export function usageSummary(records, supports) {
  const rows = supports.map((s) => {
    const r = recordsFor(records, s.id);
    const count = (a) => r.filter((x) => x.action === a).length;
    return {
      supportId: s.id,
      title: s.title,
      required: s.required,
      opened: count("opened"),
      used: count("used"),
      completed: count("completed"),
      hidden: count("hidden"),
      independent: count("independent"),
    };
  });
  return rows;
}

/**
 * A recommendation to change a support plan, ALWAYS with its evidence, NEVER applied here. A teacher approves it.
 * It never produces or changes an official proficiency level.
 */
export function recommendAdjustment(records, support) {
  const r = recordsFor(records, support.id);
  const indep = r.filter((x) => x.action === "independent");
  const used = r.filter((x) => x.action === "used" || x.action === "completed");
  const evidence = [
    `${indep.length} task${indep.length === 1 ? "" : "s"} finished without opening this support`,
    `${used.length} time${used.length === 1 ? "" : "s"} used or completed with it`,
    `${r.filter((x) => x.action === "hidden").length} time(s) hidden by the student`,
  ];
  if (support.required) return { kind: "keep", reason: "Required by the teacher.", evidence };
  if (indep.length >= 3 && indep.length > used.length)
    return {
      kind: "reduce",
      reason:
        "Three or more independent attempts. Consider one step less support, then look at the next piece of writing.",
      evidence,
    };
  if (r.filter((x) => x.action === "opened").length >= 3 && !used.length && !indep.length)
    return {
      kind: "check",
      reason:
        "Opened several times but not used. Check whether the support fits the task or needs another form (audio, picture, bilingual).",
      evidence,
    };
  return { kind: "keep", reason: "Not enough work yet to suggest a change.", evidence };
}

/** The step down for fading: heavy -> moderate -> minimal -> help -> none. Returns the same value at the ends. */
export const stepIntensity = (current, dir) => {
  const order = ["heavy", "moderate", "minimal", "help"];
  const i = order.indexOf(current);
  if (i < 0) return current;
  return order[Math.max(0, Math.min(order.length - 1, i + (dir === "reduce" ? 1 : -1)))];
};

export const INTENSITY_VALUES = INTENSITIES;

/**
 * A copy of the assignment book for ONE group: only the supports that group's profile can see, the group's plan,
 * and no other group's recipe. Device-mode enforcement is by content (other groups' supports are simply not in the
 * file). Class-server delivery (class-sync.js) is the enforced path.
 */
export function groupCopy(book, group) {
  const copy = JSON.parse(JSON.stringify(book));
  const profile = group.plan?.profile || 0;
  copy.supports = supportsOf(book).filter((s) => !s.levels.length || s.levels.includes(profile) || s.required);
  copy.plan = normalizePlan(group.plan);
  copy.groups = [];
  copy.planLog = [];
  copy.work = undefined;
  copy.id = "";
  copy.status = "draft";
  return copy;
}

/**
 * What a reader of a shared or published edition receives: the story and ONLY supports the teacher allowed to travel
 * with it. Plans, groups, the support-use record, revisions and teacher notes never leave the author's device.
 */
export function publicCopy(book) {
  const copy = JSON.parse(JSON.stringify(book));
  copy.supports = supportsOf(book).filter((s) => s.inPublished && !s.authoringOnly);
  copy.plan = normalizePlan({});
  copy.groups = [];
  copy.planLog = [];
  copy.work = undefined;
  copy.assignment = null;
  return copy;
}
