/* =============================================================================
 * "Show my family" — the one definition of what a student may choose to share.
 * -----------------------------------------------------------------------------
 * Shared by three readers so the rules cannot drift apart:
 *   - assets/family-share/share-picker.js   (the student's choosing screen)
 *   - functions/api/family-broadcast.js     (the read-only broadcast)
 *   - curriculum/family-connections/broadcast/broadcast.js (the lead card)
 *
 * WHERE IT LIVES. Inside the student's existing save-code progress record
 * (student_progress.state_json), as a plain object under the key `familyShare`.
 * No table, no column, no migration: the state blob is already free-form JSON.
 * The engine's own saves put page state under `state.custom.<provider>`, so a
 * `{ familyShare }` object is read from `state.familyShare` or from any entry of
 * `state.custom` that carries one, and the NEWEST by `at` wins.
 *
 * WHAT A STUDENT MAY SHARE (everything is the student's own pick):
 *   skill  - up to 3 skills they grew in, by standard code (a closed list the
 *            server checks against its own standards table)
 *   words  - up to 1 explanation they wrote, in their own words (<= 280 chars)
 *   model  - up to 1 favorite math tool, from the closed list below
 * Nothing else. No score, no grade, no picture, no other student.
 *
 * DEFAULT IS OFF. A record with no `familyShare`, or `on: false`, shares nothing.
 * Turning it off writes `{ on: false, items: [] }`, which erases the picks.
 * ========================================================================== */

export const SHARE_VERSION = 1;
export const SHARE_MAX_SKILLS = 3;
export const SHARE_MAX_WORDS = 1;
export const SHARE_MAX_MODELS = 1;
export const SHARE_MAX_TEXT = 280;

/** Favorite-tool vocabulary. A closed list: a model name is never free text. */
export const SHARE_MODELS = Object.freeze({
  "tape-diagram": { en: "Tape diagram", es: "Diagrama de cinta" },
  "double-number-line": { en: "Double number line", es: "Recta numérica doble" },
  "ratio-table": { en: "Ratio table", es: "Tabla de razones" },
  "percent-bar": { en: "Percent bar", es: "Barra de porcentaje" },
  "number-line": { en: "Number line", es: "Recta numérica" },
  "area-model": { en: "Area model", es: "Modelo de área" },
  "coordinate-grid": { en: "Coordinate grid", es: "Cuadrícula de coordenadas" },
  "algebra-tiles": { en: "Algebra tiles", es: "Fichas de álgebra" },
  "dot-plot": { en: "Dot plot", es: "Diagrama de puntos" },
  histogram: { en: "Histogram", es: "Histograma" },
  "box-plot": { en: "Box plot", es: "Diagrama de caja" },
  "fraction-bar": { en: "Fraction bar", es: "Barra de fracciones" },
});

/* Words a family should not receive from a stranger's keyboard, and contact
   details a child should not publish by accident. Matching text is NOT sent. */
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
// 10+ digits in a phone shape, or a 7-digit local number such as 555-0199. Short
// numbers and decimals in an ordinary math sentence ("0.375", "12 + 15") pass.
const PHONE_RE = /(?:\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\b\d{3}[\s.-]\d{4}\b/;
const URL_RE = /https?:\/\/|www\./i;

/** True for a control character or a line/paragraph separator. */
function isControl(ch) {
  const code = ch.charCodeAt(0);
  return code < 32 || (code >= 127 && code <= 159) || code === 0x2028 || code === 0x2029;
}

/** Collapse whitespace, drop control characters, clamp the length. */
export function cleanText(raw) {
  return [...String(raw == null ? "" : raw)]
    .map((ch) => (isControl(ch) ? " " : ch))
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SHARE_MAX_TEXT);
}

/** True when the text is safe to hand to a family exactly as written. */
export function shareableText(text) {
  const t = cleanText(text);
  if (t.length < 3) return false;
  return !(EMAIL_RE.test(t) || PHONE_RE.test(t) || URL_RE.test(t));
}

const LESSON_ID = /^\d{1,2}-\d{1,2}$/;
const STANDARD_ID = /^[0-9A-Z]{1,3}\.[A-Z]{1,4}\.[0-9A-Za-z.]{1,6}$/;

function cleanItem(raw, isStandard) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.kind === "skill") {
    const std = String(raw.std || "")
      .trim()
      .toUpperCase()
      .slice(0, 20);
    if (!STANDARD_ID.test(std) || (isStandard && !isStandard(std))) return null;
    return { kind: "skill", std };
  }
  if (raw.kind === "words") {
    const text = cleanText(raw.text);
    if (!shareableText(text)) return null;
    const lesson = String(raw.lesson || "").trim();
    return LESSON_ID.test(lesson) ? { kind: "words", text, lesson } : { kind: "words", text };
  }
  if (raw.kind === "model") {
    const id = String(raw.id || "");
    return Object.hasOwn(SHARE_MODELS, id) ? { kind: "model", id } : null;
  }
  return null;
}

/**
 * Validate one raw `familyShare` object. Returns a clean, bounded object or
 * null. The result always has `on`, `items` and `at`; `on: false` has no items.
 * `isStandard(std)` lets the server restrict skills to its own standards table.
 */
export function sanitizeShare(raw, isStandard) {
  if (!raw || typeof raw !== "object" || Number(raw.v) !== SHARE_VERSION) return null;
  const at = typeof raw.at === "string" ? raw.at.slice(0, 30) : "";
  if (raw.on !== true) return { v: SHARE_VERSION, on: false, items: [], at };
  const counts = { skill: 0, words: 0, model: 0 };
  const limits = { skill: SHARE_MAX_SKILLS, words: SHARE_MAX_WORDS, model: SHARE_MAX_MODELS };
  const seen = new Set();
  const items = [];
  for (const entry of Array.isArray(raw.items) ? raw.items.slice(0, 12) : []) {
    const item = cleanItem(entry, isStandard);
    if (!item || counts[item.kind] >= limits[item.kind]) continue;
    const key = `${item.kind}:${item.std || item.id || item.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    counts[item.kind] += 1;
    items.push(item);
  }
  return { v: SHARE_VERSION, on: items.length > 0, items, at };
}

/** Find the student's newest valid choice anywhere in a saved state blob. */
export function findShare(state, isStandard) {
  if (!state || typeof state !== "object") return null;
  const candidates = [state.familyShare];
  const custom = state.custom && typeof state.custom === "object" ? state.custom : {};
  for (const entry of Object.values(custom)) {
    if (entry && typeof entry === "object") candidates.push(entry.familyShare);
  }
  let best = null;
  for (const raw of candidates) {
    const clean = sanitizeShare(raw, isStandard);
    if (clean && (!best || clean.at > best.at)) best = clean;
  }
  return best;
}

/**
 * Write a choice into a saved state blob WITHOUT touching anything else in it.
 * The canonical home is `state.custom.familyShare`; every other copy the engine
 * may have captured (under another provider key, or at the top level) is
 * overwritten with the same value, so turning sharing off erases old picks
 * everywhere instead of leaving a stale copy for findShare() to find.
 */
export function applyShare(state, share) {
  const next = state && typeof state === "object" ? state : {};
  const custom = next.custom && typeof next.custom === "object" ? next.custom : {};
  for (const [key, entry] of Object.entries(custom)) {
    if (entry && typeof entry === "object" && "familyShare" in entry) {
      custom[key] = { ...entry, familyShare: share };
    }
  }
  custom.familyShare = { familyShare: share };
  next.custom = custom;
  if ("familyShare" in next) next.familyShare = share;
  return next;
}

/* ------------------------------------------------------------------ copy --
 * Student-facing strings use "tú"; the family-facing broadcast uses "usted",
 * matching the rest of Family Connections.
 * ------------------------------------------------------------------------ */

/** The framing a family reads. `label` is already in the family's language. */
export const SHARE_FAMILY_COPY = Object.freeze({
  kicker: {
    en: (name) => (name ? `Chosen by ${name}` : "Chosen by your student"),
    es: (name) => (name ? `Elegido por ${name}` : "Elegido por su estudiante"),
  },
  title: {
    en: (name) => (name ? `${name} wants to show you` : "Your student wants to show you"),
    es: (name) => (name ? `${name} quiere mostrarle` : "Su estudiante quiere mostrarle"),
  },
  intro: {
    en: "Your student picked these themselves. Nothing here was chosen for them.",
    es: "Su estudiante eligió esto por sí mismo. Nada de esto se eligió por él o ella.",
  },
  skill: {
    en: (label) => `A skill I got stronger at: ${label}`,
    es: (label) => `Una destreza en la que mejoré: ${label}`,
  },
  words: {
    en: "In my own words",
    es: "En mis propias palabras",
  },
  model: {
    en: (label) => `My favorite math tool: ${label}`,
    es: (label) => `Mi herramienta de matemáticas favorita: ${label}`,
  },
  ask: {
    en: "A good question to ask: “Can you show me how you thought about it?”",
    es: "Una buena pregunta: «¿Puedes mostrarme cómo lo pensaste?»",
  },
});

/** What the student sees at the point of sharing. Plain, and honest about who reads it. */
export const SHARE_STUDENT_COPY = Object.freeze({
  en: {
    open: "Share with my family",
    title: "Show my family",
    why: "You choose what your family sees. It is off until you turn it on, and you can turn it off any time.",
    whoSees:
      "Your family sees only what you pick here, with your first name. They do not see a score or a grade.",
    toggleOn: "Yes, show my family what I picked",
    toggleOff: "Not sharing. Nothing is shown.",
    skillsHeading: "A skill I got stronger at (pick up to 3)",
    skillsNone: "Skills show up here after you practice a few times.",
    wordsHeading: "One explanation, in my own words",
    wordsHint: "Write it so your family can understand. Please leave out phone numbers and emails.",
    wordsLabel: "My explanation",
    wordsCount: (n) => `${n} of ${SHARE_MAX_TEXT} letters`,
    modelHeading: "My favorite math tool",
    modelNone: "No favorite",
    save: "Save my choices",
    saved: "Saved. Your family can see these picks.",
    savedOff: "Saved. Nothing is shared.",
    unshare: "Stop sharing",
    unshared: "Stopped. Your family sees nothing from this screen.",
    needCode:
      "Type your save code so we know whose picks these are. It is the code from your work.",
    codeLabel: "My save code",
    offline:
      "We could not reach the school just now. Your picks are kept on this device. Try again soon.",
    badText: "Please leave out phone numbers, emails, and web links.",
    preview: "What your family will read",
  },
  es: {
    open: "Compartir con mi familia",
    title: "Mostrar a mi familia",
    why: "Tú eliges lo que ve tu familia. Está apagado hasta que lo enciendas, y puedes apagarlo cuando quieras.",
    whoSees:
      "Tu familia solo ve lo que elijas aquí, con tu primer nombre. No ven una puntuación ni una calificación.",
    toggleOn: "Sí, mostrar a mi familia lo que elegí",
    toggleOff: "No comparto. No se muestra nada.",
    skillsHeading: "Una destreza en la que mejoré (elige hasta 3)",
    skillsNone: "Las destrezas aparecen aquí después de practicar varias veces.",
    wordsHeading: "Una explicación, en mis propias palabras",
    wordsHint:
      "Escríbela para que tu familia la entienda. Por favor no pongas teléfonos ni correos.",
    wordsLabel: "Mi explicación",
    wordsCount: (n) => `${n} de ${SHARE_MAX_TEXT} letras`,
    modelHeading: "Mi herramienta de matemáticas favorita",
    modelNone: "Ninguna favorita",
    save: "Guardar mis elecciones",
    saved: "Guardado. Tu familia puede ver lo que elegiste.",
    savedOff: "Guardado. No se comparte nada.",
    unshare: "Dejar de compartir",
    unshared: "Listo. Tu familia no ve nada de esta pantalla.",
    needCode:
      "Escribe tu código de guardado para saber de quién son estas elecciones. Es el código de tu trabajo.",
    codeLabel: "Mi código de guardado",
    offline:
      "No pudimos conectar con la escuela ahora. Tus elecciones se quedan en este dispositivo. Inténtalo pronto.",
    badText: "Por favor no pongas teléfonos, correos ni enlaces web.",
    preview: "Lo que leerá tu familia",
  },
});
