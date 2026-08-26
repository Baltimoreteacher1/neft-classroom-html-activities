// Auto-derive thin lesson content from config.json where authored fields are missing.

/** Derive a common-mistake callout from keyIdea, conceptIntro, or vocabulary. */
export function deriveCommonMistake(config) {
  const explicit = config.practice?.commonMistake || config.commonMistake || null;
  if (explicit) {
    return typeof explicit === "string" ? explicit : explicit.text || explicit.message || "";
  }

  const keyIdea = config.launch?.conceptIntro?.keyIdea || config.conceptIntro?.keyIdea || "";
  if (keyIdea) {
    return `A common mistake is to skip the key idea: "${keyIdea}" — always check your work against this rule.`;
  }

  const firstTerm = config.vocabulary?.[0];
  if (firstTerm?.term && firstTerm?.definition) {
    return `Students often confuse "${firstTerm.term}" with everyday words. Remember: ${firstTerm.definition}`;
  }

  return "";
}

/**
 * Find a concrete flawed worked example the student can critique, from the
 * lesson's `error-analysis` practice item (every lesson authors one). Returns
 * `{ steps:[{label,work}], fix, errorStep }` or null. Used to turn the exit
 * ticket's "Spot the mistake" from an open question into a shown error to find.
 */
export function deriveErrorExample(config) {
  const p = config.practice || {};
  const tiers = [p.approaching, p.onLevel, p.extending];
  for (const tier of tiers) {
    if (!Array.isArray(tier)) continue;
    const item = tier.find(
      (it) => it && it.type === "error-analysis" && Array.isArray(it.workedExample),
    );
    if (item && item.workedExample.length) {
      return {
        steps: item.workedExample
          .filter((s) => s && (s.work || s.label))
          .map((s) => ({ label: String(s.label || ""), work: String(s.work || "") })),
        fix: String(item.correctWork || ""),
        // Normalize to a 0-based index into `steps`; clamp to range, null if absent.
        errorStep:
          typeof item.errorStep === "number"
            ? Math.max(0, Math.min(item.workedExample.length - 1, item.errorStep))
            : null,
      };
    }
  }
  return null;
}

/** Split launch narrative into tap-to-reveal story beats. */
export function deriveLaunchBeats(config) {
  const narrative = config.launch?.narrative || "";
  if (!narrative) return [];

  const sentences = narrative
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  if (sentences.length <= 2) {
    return [{ text: narrative, label: "The Story" }];
  }

  const labels = ["Set the Scene", "The Challenge", "What Happens Next", "Your Role"];
  return sentences.map((text, i) => ({
    text,
    label: labels[i] || `Part ${i + 1}`,
  }));
}

/**
 * Phase time breakdown for the cover screen + teacher pacing guide.
 *
 * Order and icons MUST stay aligned with app.js `phaseConfigs` and i18n
 * `phaseName(0..4)`: Launch, Explore, Practice, Connect, Reflect. Consumers label
 * each row by index via `phaseName(i)`, so an extra entry shifts every label.
 * (The old "Vocab" phase was removed — vocabulary now lives in its own tab — so
 * it is intentionally not listed here.)
 */
export const PHASE_TIME_ESTIMATES = [
  { name: "Launch & Focus", icon: "🚀", minutes: 11 },
  { name: "Lesson", icon: "📐", minutes: 28 },
  { name: "Exit Ticket", icon: "📝", minutes: 5 },
];

/** Count practice problems across tiers. */
export function countPracticeProblems(config) {
  const p = config.practice || {};
  const buckets = ["approaching", "onLevel", "extending", "optional"];
  let total = 0;
  for (const b of buckets) {
    if (Array.isArray(p[b])) total += p[b].length;
  }
  return total;
}

/** Derive 3-tier hint ladder from a problem definition. */
export function deriveHintLadder(prob) {
  if (!prob) return [];
  const authored = Array.isArray(prob.hints) ? prob.hints.filter(Boolean) : [];
  // `hintsEs` is indexed against the RAW `hints` array, so it must be read
  // before `filter(Boolean)` shifts the positions — a blank hint in the middle
  // would otherwise pair every later hint with the wrong translation.
  const authoredEs = Array.isArray(prob.hintsEs) ? prob.hintsEs : [];
  const esFor = (h) => {
    const at = Array.isArray(prob.hints) ? prob.hints.indexOf(h) : -1;
    return at >= 0 ? authoredEs[at] : undefined;
  };
  if (authored.length >= 3) {
    return authored.slice(0, 3).map((h, i) => ({
      level: i + 1,
      label: ["💡 Tip", "🧭 Strategy", "👀 Show me how"][i],
      text: String(h),
      // Undefined when this item has no Spanish; the ladder renders English
      // alone in that case rather than an empty second line.
      textEs: esFor(h) ? String(esFor(h)) : undefined,
    }));
  }

  const scaffold = prob.scaffold || prob.hint || "";

  // Pull the problem's own labels into the generic hints so the ladder talks
  // about THIS problem, not problems in general. Names categories/headers only
  // — never the placement or answer.
  const catNames = Array.isArray(prob.categories)
    ? prob.categories
        .map((c) => (typeof c === "string" ? c : c?.label || c?.name || ""))
        .filter(Boolean)
        .slice(0, 4)
    : [];
  // fill-table configs use either `headers` or `columns` for the header row.
  const headerSource = Array.isArray(prob.headers) ? prob.headers : prob.columns;
  const headerNames = Array.isArray(headerSource)
    ? headerSource.filter((h) => typeof h === "string").slice(0, 4)
    : [];

  // Every generic rung carries both lanes: the ladder was English-only for any
  // item without authored hints, which in practice meant EVERY game item
  // (drag-sort, matching-game) — the exact place a student who reads Spanish
  // gets stuck with no authored support. Interpolated category/header names
  // are authored lesson text and appear verbatim in both lanes. An authored
  // `scaffold` replaces the third rung; its Spanish comes from `scaffoldEs`
  // when authored, else the rung falls back to English alone (the stack
  // renderer's contract for missing translations).
  const scaffoldRung = (fallbackEn, fallbackEs) =>
    scaffold
      ? { en: scaffold, es: prob.scaffoldEs || prob.hintEs || undefined }
      : { en: fallbackEn, es: fallbackEs };
  const matchingHints = [
    {
      en: "Read every item in BOTH columns before you tap anything.",
      es: "Lee todos los elementos de AMBAS columnas antes de tocar nada.",
    },
    {
      en: "Match the pairs you are sure about first — fewer choices are left for the hard ones.",
      es: "Empareja primero los que estés seguro — quedarán menos opciones para los difíciles.",
    },
    scaffoldRung(
      "Stuck on one? Rule out the matches already taken, then compare what's left.",
      "¿Atascado en uno? Descarta las parejas ya usadas y compara lo que queda.",
    ),
  ];
  const typeHints = {
    "multiple-choice": [
      {
        en: "Read the question twice. What is it really asking?",
        es: "Lee la pregunta dos veces. ¿Qué te pide realmente?",
      },
      {
        en: "Cross out choices that clearly don't fit. Compare what's left.",
        es: "Tacha las opciones que claramente no encajan. Compara las que quedan.",
      },
      scaffoldRung(
        "Pick the choice that matches the math rule you learned today.",
        "Elige la opción que sigue la regla matemática que aprendiste hoy.",
      ),
    ],
    "drag-sort": [
      catNames.length
        ? {
            en: `Read each category out loud first: ${catNames.join(" · ")}. Ask: what makes them different?`,
            es: `Primero lee cada categoría en voz alta: ${catNames.join(" · ")}. Pregúntate: ¿en qué se diferencian?`,
          }
        : {
            en: "Read every category label before you drag.",
            es: "Lee la etiqueta de cada categoría antes de arrastrar.",
          },
      {
        en: "Sort the easiest cards first — use them as clues for the rest.",
        es: "Clasifica primero las tarjetas más fáciles — úsalas como pistas para las demás.",
      },
      scaffoldRung(
        catNames.length
          ? `For each card, test it against every category (${catNames.join(", ")}) before you drop it.`
          : "One card belongs in each category. Match the math vocabulary.",
        catNames.length
          ? `Antes de soltar cada tarjeta, pruébala contra cada categoría (${catNames.join(", ")}).`
          : "Cada tarjeta pertenece a una categoría. Fíjate en el vocabulario matemático.",
      ),
    ],
    "matching-game": matchingHints,
    // Legacy alias for "matching-game" (same renderer).
    matching: matchingHints,
    "fill-table": [
      headerNames.length
        ? {
            en: `Look at the column headings — ${headerNames.join(" · ")}. How does each row connect them?`,
            es: `Mira los títulos de las columnas — ${headerNames.join(" · ")}. ¿Cómo los conecta cada fila?`,
          }
        : {
            en: "Fill cells you already know. Look for a pattern between rows.",
            es: "Llena las celdas que ya sabes. Busca un patrón entre las filas.",
          },
      {
        en: "Check if each row grows by the same amount or follows a ratio.",
        es: "Revisa si cada fila crece por la misma cantidad o sigue una razón.",
      },
      scaffoldRung(
        "Use the pattern to find missing values one cell at a time.",
        "Usa el patrón para encontrar los valores que faltan, celda por celda.",
      ),
    ],
    "error-analysis": [
      {
        en: "Read each step in order. Which step breaks the rule?",
        es: "Lee cada paso en orden. ¿Qué paso rompe la regla?",
      },
      {
        en: "Check the operation in each step — add, subtract, multiply, or divide?",
        es: "Revisa la operación de cada paso — ¿suma, resta, multiplicación o división?",
      },
      scaffoldRung(
        "Find the first step where the math stops being true.",
        "Encuentra el primer paso donde la matemática deja de ser verdadera.",
      ),
    ],
    default: [
      {
        en: "Re-read the question. Underline what it's asking.",
        es: "Vuelve a leer la pregunta. Subraya lo que te pide.",
      },
      {
        en: "What math tool or vocabulary word fits this problem?",
        es: "¿Qué herramienta matemática o palabra de vocabulario encaja con este problema?",
      },
      scaffoldRung(
        "Plan your first step before you answer.",
        "Planea tu primer paso antes de responder.",
      ),
    ],
  };

  const hints = typeHints[prob.type] || typeHints.default;
  return hints.map((h, i) => ({
    level: i + 1,
    label: ["💡 Tip", "🧭 Strategy", "👀 Show me how"][i],
    text: String(h.en),
    textEs: h.es ? String(h.es) : undefined,
  }));
}
