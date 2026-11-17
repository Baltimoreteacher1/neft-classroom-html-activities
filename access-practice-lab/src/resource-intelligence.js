// Universal Resource Intelligence Layer (src/resource-intelligence.js)
// Connects existing activities, studios, worlds, books, simulations, pathways, and guides into one
// organized instructional system with transparent eligibility rules, explainable ranking, guided
// pathway composition (Introduce -> Explore -> Practice -> Apply -> Review), WIDA-sensitive scaffold
// differentiation, and contextual "What Next?" recommendations across Teacher, Family, and Student roles.
// Pure data and pure functions (no DOM), so Node unit tests and browser views share the exact same logic.

import { DESTINATIONS, KINDS, SKILLS } from "./sitemap.js";
import { BASE } from "./util.js";

export const SUPPORT_TIERS = Object.freeze({
  A: {
    id: "A",
    name: ["Starting support", "Apoyo inicial"],
    widaNote: [
      "High language support (visual vocabulary, audio, word banks, full sentence frames) while keeping the grade-level thinking goal.",
      "Alto apoyo lingüístico (vocabulario visual, audio, bancos de palabras, marcos de oración completos) manteniendo la meta de pensamiento del grado.",
    ],
    scaffolds: [
      "visual-vocabulary",
      "audio-directions",
      "word-bank",
      "sentence-frames",
      "model-response",
      "bilingual-glossary",
    ],
  },
  B: {
    id: "B",
    name: ["Growing support", "Apoyo en crecimiento"],
    widaNote: [
      "Moderate language support (sentence starters, academic connectors, optional hints) to connect and expand ideas.",
      "Apoyo lingüístico moderado (inicios de oración, conectores académicos, pistas opcionales) para conectar y ampliar ideas.",
    ],
    scaffolds: [
      "audio-directions",
      "sentence-starters",
      "bilingual-glossary",
      "oral-rehearsal",
      "interactive-feedback",
    ],
  },
  C: {
    id: "C",
    name: ["Expanding support", "Apoyo de ampliación"],
    widaNote: [
      "Light, fadeable language support (self-check rubric, precision word upgrade, revision check) for stretched academic discourse.",
      "Apoyo lingüístico ligero y gradual (rúbrica de autoevaluación, vocabulario preciso, revisión) para discurso académico avanzado.",
    ],
    scaffolds: [
      "audio-directions",
      "interactive-feedback",
      "revision-opportunity",
    ],
  },
  adaptive: {
    id: "adaptive",
    name: ["Flexible / learner-chosen support", "Apoyo flexible elegido por el estudiante"],
    widaNote: [
      "Students or teachers can toggle Starting, Growing, or On My Own inside the activity without changing the learning objective.",
      "Los estudiantes o docentes pueden elegir apoyo Inicial, En crecimiento o Por mi cuenta dentro de la actividad sin cambiar la meta.",
    ],
    scaffolds: [
      "visual-vocabulary",
      "audio-directions",
      "word-bank",
      "sentence-frames",
      "model-response",
      "bilingual-glossary",
      "interactive-feedback",
      "revision-opportunity",
    ],
  },
});

export const SCAFFOLD_CATALOG = Object.freeze([
  {
    id: "visual-vocabulary",
    label: ["Visual vocabulary & picture cues", "Vocabulario visual e imágenes"],
    purpose: [
      "Anchors key nouns and actions visually so learners focus on meaning and relationships.",
      "Conecta sustantivos y acciones clave con imágenes para enfocarse en el significado.",
    ],
    fadeTip: [
      "Fade by keeping the illustration while hiding word labels during independent transfer.",
      "Retírelo gradualmente manteniendo la ilustración sin las etiquetas durante la práctica independiente.",
    ],
  },
  {
    id: "audio-directions",
    label: ["Audio directions & read-aloud", "Instrucciones con audio y lectura en voz alta"],
    purpose: [
      "Decouples decoding load from comprehension and task directions (normal or slow speed).",
      "Separa la carga de lectura de la comprensión de las instrucciones (velocidad normal o lenta).",
    ],
    fadeTip: [
      "Encourage learners to read along silently first, then use audio to verify key words.",
      "Invite a leer primero en silencio y usar el audio para confirmar palabras clave.",
    ],
  },
  {
    id: "word-bank",
    label: ["Academic word bank", "Banco de palabras académicas"],
    purpose: [
      "Surfaces content-specific terms and verbs so learners can build precise explanations.",
      "Muestra términos y verbos específicos del tema para construir explicaciones precisas.",
    ],
    fadeTip: [
      "Transition from a visible word bank to a self-check word checklist after drafting.",
      "Pase de un banco visible a una lista de verificación después de escribir el borrador.",
    ],
  },
  {
    id: "sentence-starters",
    label: ["Sentence starters", "Inicios de oración"],
    purpose: [
      "Helps learners launch an academic claim, description, or sequence without giving away the answer.",
      "Ayuda a iniciar una afirmación, descripción o secuencia académica sin dar la respuesta.",
    ],
    fadeTip: [
      "Offer two starter choices, then invite learners to open their second sentence on their own.",
      "Ofrezca dos opciones de inicio y luego invite a iniciar la segunda oración por su cuenta.",
    ],
  },
  {
    id: "sentence-frames",
    label: ["Sentence frames with connectors", "Marcos de oración con conectores"],
    purpose: [
      "Models how academic clauses link cause, evidence, and reasoning (e.g., 'The evidence shows ___ because ___').",
      "Modela cómo unir causa, evidencia y razonamiento (p. ej., 'The evidence shows ___ because ___').",
    ],
    fadeTip: [
      "Replace full frames with a connector bank ('because', 'therefore', 'for example') as learners gain fluency.",
      "Reemplace el marco completo por un banco de conectores a medida que ganan fluidez.",
    ],
  },
  {
    id: "model-response",
    label: ["Modeled exemplar response", "Respuesta modelo de ejemplo"],
    purpose: [
      "Shows what a strong response sounds and looks like on a parallel prompt before students produce their own.",
      "Muestra cómo suena y se ve una respuesta sólida antes de que el estudiante produzca la suya.",
    ],
    fadeTip: [
      "Ask students to name one move the model used, then close the model before drafting.",
      "Pida identificar una estrategia del modelo y cerrarlo antes de escribir.",
    ],
  },
  {
    id: "chunked-directions",
    label: ["Chunked step-by-step directions", "Instrucciones divididas paso a paso"],
    purpose: [
      "Breaks multi-part tasks into clear, sequential actions (Plan → Produce → Check → Revise).",
      "Divide tareas de varios pasos en acciones secuenciales claras (Planear → Producir → Revisar).",
    ],
    fadeTip: [
      "Collapse step hints into a single checklist once the routine is familiar.",
      "Convierta los pasos detallados en una lista breve cuando la rutina sea familiar.",
    ],
  },
  {
    id: "bilingual-glossary",
    label: ["Bilingual glossary & cognates (EN/ES)", "Glosario bilingüe y cognados (EN/ES)"],
    purpose: [
      "Connects English academic terms to home-language knowledge and Spanish cognates.",
      "Conecta términos académicos en inglés con el conocimiento en casa y cognados en español.",
    ],
    fadeTip: [
      "Have learners spot cognates first before opening the bilingual definition.",
      "Invite a identificar cognados primero antes de abrir la definición bilingüe.",
    ],
  },
  {
    id: "oral-rehearsal",
    label: ["Oral rehearsal before writing", "Ensayo oral antes de escribir"],
    purpose: [
      "Lets learners say their idea aloud, listen back, and organize thoughts before typing.",
      "Permite decir la idea en voz alta, escucharse y organizar pensamientos antes de escribir.",
    ],
    fadeTip: [
      "Shift from recorded rehearsal to a quick 15-second whisper rehearsal.",
      "Pase de grabar el ensayo a decirlo brevemente en voz baja antes de escribir.",
    ],
  },
  {
    id: "graphic-organizer",
    label: ["Claim–Evidence–Reasoning organizer", "Organizador de Afirmación–Evidencia–Razonamiento"],
    purpose: [
      "Separates gathering evidence from composing full sentences so cognitive load stays manageable.",
      "Separa la búsqueda de evidencia de la redacción de oraciones completas.",
    ],
    fadeTip: [
      "Move from pre-labeled boxes to quick margin notes in the Reading Room.",
      "Pase de cuadros guiados a notas breves al margen durante la lectura.",
    ],
  },
  {
    id: "interactive-feedback",
    label: ["Specific feedback quoting student words", "Comentarios específicos sobre sus propias palabras"],
    purpose: [
      "Highlights what the learner already did well and names one concrete next move without scoring.",
      "Destaca lo que ya hizo bien y sugiere un próximo paso concreto sin calificar con puntajes.",
    ],
    fadeTip: [
      "Ask learners to run the self-check rubric first before requesting feedback.",
      "Pida usar primero la lista de autoevaluación antes de pedir comentarios.",
    ],
  },
  {
    id: "revision-opportunity",
    label: ["Side-by-side revision & transfer", "Revisión comparada y transferencia"],
    purpose: [
      "Lets learners improve their first draft and compare earlier vs. later work in the Time Machine.",
      "Permite mejorar su primer borrador y comparar el antes y después.",
    ],
    fadeTip: [
      "Follow a supported revision with an independent transfer task on a fresh prompt.",
      "Después de una revisión con apoyo, invite a realizar una tarea nueva de forma independiente.",
    ],
  },
]);

export const EDUCATIONAL_SYNONYMS = Object.freeze({
  oral: ["speaking", "speak", "voice", "talk", "hablar"],
  speaking: ["speak", "voice", "oral", "talk", "pronunciation", "retell", "hablar"],
  talk: ["speaking", "speak", "conversation", "scenarios", "dialog", "hablar"],
  pronunciation: ["voice", "sounds", "speaking", "phonics"],
  listen: ["listening", "audio", "hear", "sound", "escuchar"],
  listening: ["listen", "audio", "hear", "details", "escuchar"],
  read: ["reading", "story", "stories", "passage", "text", "comprehension", "leer"],
  reading: ["read", "story", "stories", "passage", "evidence", "comprehension", "phonics", "leer"],
  comprehension: ["reading", "evidence", "main", "idea", "details", "story"],
  phonics: ["decoding", "sounds", "letters", "reading", "sor", "early"],
  decoding: ["phonics", "reading", "sounds", "words"],
  write: ["writing", "sentence", "sentences", "paragraph", "draft", "essay", "book", "escribir"],
  writing: ["write", "sentence", "sentences", "paragraph", "essay", "argue", "explain", "escribir"],
  essay: ["writing", "write", "argument", "arena", "paragraph", "evidence"],
  paragraph: ["writing", "sentences", "write", "scaffold"],
  grammar: ["sentences", "detective", "words", "patterns", "verbs", "gramatica"],
  vocab: ["vocabulary", "words", "wordlab", "glossary", "flashcards", "vocabulario"],
  vocabulary: ["words", "wordlab", "vocab", "flashcards", "morphology", "cognates", "vocabulario"],
  morphology: ["vocabulary", "wordlab", "prefix", "root", "words"],
  cognates: ["wordlab", "vocabulary", "spanish", "words"],
  story: ["stories", "book", "reading", "adventures", "narrative", "cuento", "cuentos"],
  stories: ["story", "book", "reading", "adventures", "cuento", "cuentos"],
  book: ["book-studio", "create", "writing", "stories", "comic", "libro", "libros"],
  comic: ["book-studio", "book", "create", "story"],
  game: ["games", "play", "arcade", "quest", "puzzle", "juego", "juegos"],
  games: ["game", "play", "arcade", "quest", "puzzles", "juego", "juegos"],
  wida: ["access", "prep", "test", "tests", "studios", "practice"],
  access: ["wida", "prep", "test", "tests", "road", "practice"],
  test: ["tests", "assess", "prep", "access", "diagnostic", "prueba", "pruebas"],
  scaffold: ["support", "frames", "builder", "differentiate", "tier", "apoyo"],
  scaffolds: ["support", "frames", "builder", "differentiate", "apoyo"],
  differentiate: ["support", "scaffold", "tier", "level", "starting", "growing", "expanding"],
  family: ["families", "home", "parents", "caregiver", "together", "familia", "familias", "casa"],
  parent: ["family", "families", "home", "together", "familia", "padres"],
  teacher: ["teach", "assign", "lesson", "class", "evidence", "docente", "maestro"],
  lesson: ["plan", "pathway", "pathways", "units", "builder", "leccion"],
  debate: ["arena", "argument", "argue", "evidence", "speaking"],
  science: ["science-lab", "exhibition", "investigation", "evidence", "ciencias"],
  mystery: ["simulations", "adventures", "detective", "quest", "misterio"],
});

export const normText = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const expandQueryWords = (query) => {
  const base = normText(query).split(/\s+/).filter(Boolean);
  return base.map((w) => {
    const alts = new Set([w, ...(EDUCATIONAL_SYNONYMS[w] || [])]);
    return [...alts];
  });
};

const PURPOSE_BY_KIND = {
  warmup: ["introduce", "review"],
  guide: ["introduce"],
  story: ["introduce", "explore", "practice"],
  world: ["explore", "apply"],
  game: ["explore", "practice", "review"],
  practice: ["practice", "review"],
  studio: ["practice", "apply"],
  tool: ["introduce", "practice", "review"],
  test: ["review", "apply"],
  progress: ["review"],
};

const SCAFFOLDS_BY_KIND = {
  practice: ["audio-directions", "visual-vocabulary", "word-bank", "sentence-frames", "bilingual-glossary", "interactive-feedback"],
  studio: ["audio-directions", "sentence-frames", "model-response", "oral-rehearsal", "interactive-feedback", "revision-opportunity"],
  world: ["visual-vocabulary", "audio-directions", "word-bank", "sentence-frames", "interactive-feedback"],
  story: ["audio-directions", "visual-vocabulary", "bilingual-glossary"],
  game: ["visual-vocabulary", "audio-directions", "interactive-feedback"],
  tool: ["sentence-frames", "word-bank", "bilingual-glossary"],
  test: ["audio-directions"],
  guide: ["bilingual-glossary"],
  progress: ["revision-opportunity"],
};

const MINUTES_BY_KIND = {
  practice: 5,
  studio: 12,
  world: 15,
  story: 8,
  game: 8,
  tool: 5,
  test: 15,
  guide: 5,
  progress: 5,
};

function destHref(d, band = "6-8") {
  if (d.href.startsWith("/")) return d.href;
  const [p, qs] = d.href.split("?");
  const q = new URLSearchParams(qs || "");
  if (band && !q.has("grades")) q.set("grades", band);
  return `${BASE}/${p}?${q.toString()}`;
}

/**
 * Build one unified resource registry from the site's canonical sources (`DESTINATIONS` in `src/sitemap.js`
 * and `content/index.json`). Every entry points to the real existing URL and carries only metadata justified by
 * the resource's actual behavior and content.
 */
export function buildResourceRegistry({ index = null, destinations = DESTINATIONS } = {}) {
  const list = [];
  const seen = new Set();

  for (const d of destinations) {
    const id = `dest:${d.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const domain = d.skill || "Mixed";
    const purposes = PURPOSE_BY_KIND[d.kind] || ["practice"];
    if (d.id === "warmup" || d.id === "learn" || d.id === "mentor") {
      if (!purposes.includes("introduce")) purposes.unshift("introduce");
    }
    if (d.id === "book-studio" || d.id === "simulations" || d.id === "arena" || d.id === "exhibition") {
      if (!purposes.includes("apply")) purposes.push("apply");
    }
    const isBook = d.id === "book-studio" || d.id === "book-templates";
    list.push({
      id,
      slug: d.id,
      title: d.title[0],
      titleEs: d.title[1],
      description: d.text[0],
      descriptionEs: d.text[1],
      route: d.href,
      urlFor: (band = "6-8") => destHref(d, band),
      type: isBook ? "book" : d.kind,
      section: d.section,
      domain,
      bands: d.bands || ["K", "1", "2-3", "3-5", "6-8"],
      objective: d.text[0],
      objectiveEs: d.text[1],
      supportSuitability: "adaptive",
      scaffolds: SCAFFOLDS_BY_KIND[d.kind] || ["audio-directions"],
      minutes: MINUTES_BY_KIND[d.kind] || 10,
      contexts: d.for || ["student"],
      purposes,
      capabilities: {
        assign: !d.external && d.section !== "help",
        saveProgress: ["practice", "studio", "world", "progress"].includes(d.kind) || isBook,
        customize: isBook || ["experience-builder", "lesson-builder", "pathways", "launch"].includes(d.id),
        audio: true,
        bilingual: d.for.includes("family") || d.section === "practice" || d.section === "play",
        printable: ["practice", "studio", "guide"].includes(d.kind) || isBook,
      },
    });
  }

  for (const [band, b] of Object.entries(index?.bands || {})) {
    for (const [domain, domData] of Object.entries(b.domains || {})) {
      if (domain === "Model-Test") continue;
      for (const [level, lv] of Object.entries(domData.levels || {})) {
        for (const row of lv.activities || []) {
          const [actId, title, itemType, skill, minutes] = row;
          const id = `act:${band}:${actId}`;
          if (seen.has(id)) continue;
          seen.add(id);
          const mins = Number(minutes) || 5;
          const purposes =
            mins <= 5
              ? ["introduce", "practice", "review"]
              : level === "C"
                ? ["practice", "apply", "review"]
                : ["explore", "practice", "review"];
          const route = `${domain}/${level}/${actId}`;
          list.push({
            id,
            slug: actId,
            activityId: actId,
            title,
            titleEs: title,
            description: `${skill || domain} (${lv.tier?.name || `Level ${level}`}, ~${mins} min)`,
            descriptionEs: `${skill || domain} (${lv.tier?.es || `Nivel ${level}`}, ~${mins} min)`,
            route,
            urlFor: (g = band) => `${BASE}/${route}?grades=${g || band}`,
            type: "activity",
            itemType: itemType || "multipleChoice",
            section: "practice",
            domain,
            bands: [band],
            objective: skill || `${domain} practice`,
            objectiveEs: skill || `Práctica de ${domain}`,
            supportSuitability: level,
            scaffolds: SUPPORT_TIERS[level]?.scaffolds || SUPPORT_TIERS.A.scaffolds,
            minutes: mins,
            contexts: ["student", "teacher", "family"],
            purposes,
            capabilities: {
              assign: true,
              saveProgress: true,
              customize: false,
              audio: true,
              bilingual: true,
              printable: true,
            },
          });
        }
      }
    }
  }

  return list;
}

/**
 * Explainable search & filter over the unified resource registry.
 * Ranks by direct relevance (title, skill/objective, synonym match, purpose/support fit) and explains why each
 * item matched in plain English and Spanish.
 */
export function discoverResources(
  registry,
  {
    q = "",
    band = "",
    domain = "",
    support = "",
    maxMinutes = 0,
    type = "",
    context = "",
    purpose = "",
    scaffold = "",
    limit = 24,
  } = {},
) {
  const queryGroups = expandQueryWords(q);
  const out = [];

  for (const item of registry) {
    if (band && item.bands && !item.bands.includes(band)) continue;
    if (domain && item.domain !== domain && item.domain !== "Mixed") continue;
    if (
      support &&
      support !== "any" &&
      item.supportSuitability !== support &&
      item.supportSuitability !== "adaptive"
    )
      continue;
    if (maxMinutes > 0 && item.minutes > maxMinutes) continue;
    if (type && item.type !== type) continue;
    if (context && !item.contexts.includes(context)) continue;
    if (purpose && !item.purposes.includes(purpose)) continue;
    if (scaffold && !item.scaffolds.includes(scaffold)) continue;

    let score = item.type === "activity" ? 8 : 10;
    if (domain && item.domain === domain) score += 6;
    if (support && item.supportSuitability === support) score += 4;
    if (purpose && item.purposes[0] === purpose) score += 3;

    if (queryGroups.length) {
      const titleNorm = normText(`${item.title} ${item.titleEs || ""}`);
      const bodyNorm = normText(
        `${item.description} ${item.descriptionEs || ""} ${item.objective || ""} ${item.domain} ${item.type}`,
      );
      let matchedAll = true;
      for (const alts of queryGroups) {
        let groupScore = 0;
        for (const w of alts) {
          if (titleNorm.includes(w)) groupScore = Math.max(groupScore, w === alts[0] ? 12 : 8);
          else if (bodyNorm.includes(w)) groupScore = Math.max(groupScore, w === alts[0] ? 6 : 4);
        }
        if (!groupScore) {
          matchedAll = false;
          break;
        }
        score += groupScore;
      }
      if (!matchedAll) continue;
    }

    const domLabelEs =
      {
        Listening: "Comprensión auditiva",
        Speaking: "Expresión oral",
        Reading: "Lectura",
        Writing: "Escritura",
        Words: "Palabras y gramática",
        Mixed: "Cuatro destrezas",
      }[item.domain] || item.domain;
    const tierInfo = SUPPORT_TIERS[item.supportSuitability] || SUPPORT_TIERS.adaptive;
    const whyEn = `${item.domain} · ${tierInfo.name[0]} · ~${item.minutes} min${item.objective ? ` · Focus: ${item.objective}` : ""}`;
    const whyEs = `${domLabelEs} · ${tierInfo.name[1]} · ~${item.minutes} min${item.objectiveEs ? ` · Enfoque: ${item.objectiveEs}` : ""}`;

    out.push({
      item,
      score,
      why: [whyEn, whyEs],
    });
  }

  out.sort((a, b) => b.score - a.score || a.item.minutes - b.item.minutes || a.item.title.localeCompare(b.item.title));
  return out.slice(0, limit);
}

export const LESSON_STAGES = Object.freeze([
  {
    id: "introduce",
    name: ["Introduce", "Presentar"],
    purpose: [
      "Activate background knowledge, preview key vocabulary, and model the target language move.",
      "Activar conocimientos previos, presentar vocabulario clave y modelar la estrategia lingüística.",
    ],
    teacherTip: [
      "Project or play the prompt together; ask students what words or clues they notice first.",
      "Proyecte o escuche la consigna juntos; pregunte qué palabras o pistas notan primero.",
    ],
  },
  {
    id: "explore",
    name: ["Explore", "Explorar"],
    purpose: [
      "Notice how the language works in context with visual, audio, or mentor-text support.",
      "Observar cómo funciona el lenguaje en contexto con apoyo visual, auditivo o de textos modelo.",
    ],
    teacherTip: [
      "Let partners test an idea and point to one piece of evidence or language pattern.",
      "Permita que en parejas prueben una idea y señalen una pista o patrón del lenguaje.",
    ],
  },
  {
    id: "practice",
    name: ["Practice", "Practicar"],
    purpose: [
      "Guided skill practice with proficiency-sensitive scaffolds (frames, word bank, audio).",
      "Práctica guiada de la destreza con apoyos ajustables (marcos, banco de palabras, audio).",
    ],
    teacherTip: [
      "Circulate while students complete the activity; encourage them to try a sentence frame or record a second take.",
      "Circule mientras completan la actividad; anímelos a usar un marco de oración o grabar un segundo intento.",
    ],
  },
  {
    id: "apply",
    name: ["Apply", "Aplicar"],
    purpose: [
      "Use the language move in an authentic studio, story, book, or simulation task.",
      "Usar la estrategia lingüística en un estudio, cuento, libro o simulación auténtica.",
    ],
    teacherTip: [
      "Fade one support (for example, move from full sentence frames to a connector word bank) so students stretch their own voice.",
      "Retire gradualmente un apoyo para que los estudiantes expresen la idea con sus propias palabras.",
    ],
  },
  {
    id: "review",
    name: ["Review", "Repasar"],
    purpose: [
      "Quick formative check and reflection to see what stuck and what to revisit next.",
      "Chequeo formativo rápido y reflexión para ver qué aprendieron y qué repasar después.",
    ],
    teacherTip: [
      "Have students compare their response against the success criteria or share with family.",
      "Pida comparar su respuesta con los criterios de éxito o compartirla en casa.",
    ],
  },
]);

/**
 * Compose a coordinated 5-stage instructional pathway (Introduce -> Explore -> Practice -> Apply -> Review)
 * from real existing resources in the registry, with explainable selection reasons and swap alternatives.
 */
export function composeLessonPathway(
  registry,
  {
    band = "6-8",
    domain = "Speaking",
    skill = "",
    support = "B",
    minutes = 30,
    needs = [],
  } = {},
) {
  const usedIds = new Set();
  const pickPool = (stageId, preferredTypes, tierOverride = support) => {
    const matches = discoverResources(registry, {
      q: skill,
      band,
      domain,
      support: tierOverride,
      limit: 60,
    });
    const fallbackMatches =
      matches.length >= 5
        ? matches
        : discoverResources(registry, {
            band,
            domain,
            limit: 60,
          });
    const ranked = fallbackMatches
      .map((r) => {
        let bonus = 0;
        if (preferredTypes.includes(r.item.type)) bonus += 10;
        if (r.item.purposes.includes(stageId)) bonus += 6;
        if (stageId === "introduce" && r.item.minutes <= 6) bonus += 5;
        if (stageId === "review" && r.item.minutes <= 6) bonus += 5;
        if (stageId === "apply" && ["studio", "book", "world"].includes(r.item.type)) bonus += 8;
        if (needs.includes("visual-vocabulary") && r.item.scaffolds.includes("visual-vocabulary")) bonus += 3;
        if (needs.includes("sentence-frames") && r.item.scaffolds.includes("sentence-frames")) bonus += 3;
        return { ...r, stageScore: r.score + bonus };
      })
      .sort((a, b) => b.stageScore - a.stageScore);
    return ranked;
  };

  const stageConfigs = [
    { id: "introduce", types: ["activity", "tool", "story"], tier: support === "C" ? "B" : "A" },
    { id: "explore", types: ["story", "studio", "activity", "world"], tier: support },
    { id: "practice", types: ["activity"], tier: support },
    { id: "apply", types: ["studio", "book", "world", "activity"], tier: support === "A" ? "B" : support },
    { id: "review", types: ["activity", "progress", "tool"], tier: support === "A" ? "B" : "C" },
  ];

  // For shorter lessons (e.g. 15 min), keep all 5 stages available or mark optional so teachers can adapt freely.
  const stages = stageConfigs.map((cfg) => {
    const meta = LESSON_STAGES.find((s) => s.id === cfg.id);
    const candidates = pickPool(cfg.id, cfg.types, cfg.tier).filter((c) => !usedIds.has(c.item.id));
    const chosen = candidates[0]?.item || pickPool(cfg.id, cfg.types, "")[0]?.item || registry[0];
    if (chosen) usedIds.add(chosen.id);
    const alternatives = candidates
      .slice(1, 5)
      .map((c) => c.item)
      .filter((it) => it && it.id !== chosen?.id);

    const tierMeta = SUPPORT_TIERS[chosen?.supportSuitability] || SUPPORT_TIERS[support] || SUPPORT_TIERS.B;
    return {
      stageId: cfg.id,
      stageName: meta.name,
      purpose: meta.purpose,
      teacherGuidance: meta.teacherTip,
      resource: chosen,
      whySelected: [
        `Selected for ${meta.name[0]}: matches ${domain} (${band}) with ${tierMeta.name[0].toLowerCase()}.`,
        `Elegido para ${meta.name[1]}: coincide con ${domain} (${band}) con ${tierMeta.name[1].toLowerCase()}.`,
      ],
      whatStudentsDo: [
        chosen?.description || `Complete ${chosen?.title || "the activity"}.`,
        chosen?.descriptionEs || `Completar ${chosen?.titleEs || chosen?.title || "la actividad"}.`,
      ],
      scaffolds: chosen?.scaffolds || tierMeta.scaffolds,
      minutes: chosen?.minutes || 5,
      alternatives,
    };
  });

  const totalMinutes = stages.reduce((sum, s) => sum + (s.minutes || 5), 0);
  const activityIds = stages
    .map((s) => s.resource?.activityId)
    .filter(Boolean);
  const playlistUrl = activityIds.length
    ? `${BASE}/play?ids=${activityIds.join(",")}&t=${encodeURIComponent(`${domain} Lesson Pathway`)}&grades=${band}`
    : `${BASE}/pathways?grades=${band}`;

  return {
    band,
    domain,
    skill,
    support,
    requestedMinutes: minutes,
    totalMinutes,
    stages,
    playlistUrl,
  };
}

/**
 * Recommend a pedagogical differentiation plan for a student or small group.
 * Preserves the grade-level cognitive demand and learning objective while differentiating language access.
 */
export function recommendDifferentiation({
  band = "6-8",
  domain = "Writing",
  support = "A",
  skill = "",
  observedNeeds = [],
  registry = [],
} = {}) {
  const tier = SUPPORT_TIERS[support] || SUPPORT_TIERS.B;
  const recommendedIds = new Set([...tier.scaffolds, ...observedNeeds]);
  if (domain === "Speaking" || domain === "Listening") recommendedIds.add("oral-rehearsal");
  if (domain === "Reading" || domain === "Writing") recommendedIds.add("graphic-organizer");

  const scaffolds = SCAFFOLD_CATALOG.filter((s) => recommendedIds.has(s.id));
  const matchingActivities = discoverResources(registry, {
    q: skill,
    band,
    domain,
    support,
    type: "activity",
    limit: 3,
  }).map((r) => r.item);

  return {
    band,
    domain,
    support,
    tierName: tier.name,
    pedagogicalPrinciple: [
      "Keep the grade-level thinking goal and cognitive demand unchanged. Adjust the language access (visuals, audio, frames, and rehearsal) and fade supports as learners show independence.",
      "Mantenga intacta la meta de pensamiento del grado. Ajuste el acceso al lenguaje (imágenes, audio, marcos y ensayo oral) y retire los apoyos gradualmente a medida que muestren independencia.",
    ],
    widaGuidance: tier.widaNote,
    scaffolds,
    recommendedActivities: matchingActivities,
  };
}

/**
 * Contextual "What Next?" recommendations across Teacher, Family, and Student experiences.
 * Uses only genuine resource metadata and observed local state; never claims hidden algorithmic knowledge
 * and always provides a clear exit/return action.
 */
export function whatNextRecommendations({
  role = "student",
  band = "6-8",
  domain = "Reading",
  trigger = "idle",
  hasSavedWork = false,
  recurringPattern = null,
} = {}) {
  if (role === "teacher") {
    if (trigger === "pathway-created") {
      return [
        {
          id: "preview-student",
          title: ["Preview the student experience", "Ver la experiencia del estudiante"],
          detail: [
            "Open the first activity or playlist as a student to verify scaffolds and directions.",
            "Abra la primera actividad o lista como estudiante para verificar los apoyos e instrucciones.",
          ],
          href: `${BASE}/${domain}/B?grades=${band}`,
        },
        {
          id: "share-class",
          title: ["Assign or copy the share link", "Asignar o copiar el enlace para compartir"],
          detail: [
            "Post the direct link or QR code in your classroom or send a Family Companion link home.",
            "Publique el enlace directo o código QR en clase o envíe un enlace familiar a casa.",
          ],
          href: `/access-teacher/#accAssign`,
        },
      ];
    }
    if (trigger === "evidence-pattern" && recurringPattern) {
      return [
        {
          id: "reteach-pattern",
          title: [
            `Review reteaching activities for ${recurringPattern}`,
            `Revisar actividades de refuerzo para ${recurringPattern}`,
          ],
          detail: [
            "Observed in 3 or more responses on this device. Open targeted Error Detective or scaffold practice.",
            "Observado en 3 o más respuestas en este dispositivo. Abra práctica específica.",
          ],
          href: `${BASE}/detective?grades=${band}`,
        },
      ];
    }
    return [
      {
        id: "plan-lesson",
        title: ["Plan a 5-stage lesson pathway", "Planificar una ruta de lección de 5 etapas"],
        detail: [
          "Combine Introduce, Explore, Practice, Apply, and Review around one language goal.",
          "Combine Presentar, Explorar, Practicar, Aplicar y Repasar en torno a una meta.",
        ],
        href: `/access-teacher/#tcPlan`,
      },
      {
        id: "check-evidence",
        title: ["Review class evidence & WIDA Data Studio", "Revisar evidencia de la clase y Estudio de Datos WIDA"],
        detail: [
          "Inspect saved student responses or explore longitudinal growth in the Data Studio.",
          "Revise las respuestas guardadas o explore el crecimiento en el Estudio de Datos.",
        ],
        href: `/access-teacher/predictive/?demo=1`,
      },
    ];
  }

  if (role === "family") {
    const items = [];
    if (hasSavedWork) {
      items.push({
        id: "family-continue",
        title: ["Continue your previous activity", "Continuar su actividad anterior"],
        detail: [
          "Pick up right where your child left off on this device.",
          "Retome exactamente donde su hijo o hija se quedó en este dispositivo.",
        ],
        href: `${BASE}/family/practice?grades=${band}`,
      });
    }
    items.push(
      {
        id: "family-talk",
        title: ["Talk together about a story", "Conversar juntos sobre un cuento"],
        detail: [
          "Ask: 'What do you notice first?' and 'What detail proves your idea?' in any language.",
          "Pregunte: '¿Qué notas primero?' y '¿Qué detalle demuestra tu idea?' en cualquier idioma.",
        ],
        href: `${BASE}/reading-room?grades=${band}`,
      },
      {
        id: "family-words",
        title: ["Try using today's words in a sentence", "Usar las palabras de hoy en una oración"],
        detail: [
          "Open picture word cards and take turns making a sentence together.",
          "Abran las tarjetas de palabras y túrnense para crear una oración juntos.",
        ],
        href: `${BASE}/flashcards?grades=${band}`,
      },
    );
    return items;
  }

  // Student
  if (trigger === "after-miss") {
    return [
      {
        id: "student-hint",
        title: ["Look at the clue and try again", "Mira la pista e inténtalo de nuevo"],
        detail: [
          "Open the sentence frame or word bank for extra support—trying again helps your brain grow.",
          "Abre el marco de oración o el banco de palabras para recibir apoyo extra.",
        ],
        href: `${BASE}/${domain}/A?grades=${band}`,
      },
    ];
  }
  if (trigger === "after-story") {
    return [
      {
        id: "student-book",
        title: ["Create your own ending in Book Studio", "Crea tu propio final en Book Studio"],
        detail: [
          "Turn what you read into your own illustrated book or comic.",
          "Convierte lo que leíste en tu propio libro ilustrado o cómic.",
        ],
        href: `${BASE}/book-studio?grades=${band}`,
      },
      {
        id: "student-quest",
        title: ["Use what you learned in a new challenge", "Usa lo que aprendiste en un nuevo reto"],
        detail: [
          "Step into Language Quest and solve a mission with your words.",
          "Entra en Language Quest y resuelve una misión con tus palabras.",
        ],
        href: `${BASE}/quest?grades=${band}`,
      },
    ];
  }
  return [
    {
      id: "student-quest",
      title: ["Continue your Language Quest adventure", "Continúa tu aventura en Language Quest"],
      detail: [
        "Explore a world, practice a skill, or create a book.",
        "Explora un mundo, practica una destreza o crea un libro.",
      ],
      href: `${BASE}/quest?grades=${band}`,
    },
    {
      id: "student-book",
      title: ["Create a book in Book Studio", "Crea un libro en Book Studio"],
      detail: [
        "Write, illustrate, and record your own story.",
        "Escribe, ilustra y graba tu propia historia.",
      ],
      href: `${BASE}/book-studio?grades=${band}`,
    },
  ];
}
