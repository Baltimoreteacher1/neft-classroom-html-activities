// Vocabulary Academy — WIDA-informed supports. OWNER: Teacher agent. Spec: docs/vocab-academy/SPEC.md §5, §10.
//
// What this module is. A learner's support PROFILE is one support-intensity band per language domain (listening,
// speaking, reading, writing) plus per-support overrides and a fade. getSupportFlags(domain) turns it into the plain
// `ctx.supports` object (SUPPORT_KEYS booleans + `fade`) that every renderer reads. Renderers never see a band.
//
// What it is not. A band is a TEACHING CHOICE about how much scaffolding to offer. It is not an official WIDA level or
// score, it is never inferred from student work, and it never changes which grade's content is assigned: nothing in
// this file reads or writes a unit, a word list or a grade. Wording and numbering reuse the lab's Book Studio support
// model (src/book/lang/profiles.js): band 1 = most support ... band 5 = least. Class-set starting support (the lab's
// A Starting / B Growing / C Expanding stages, src/class/support.js) feeds the same bands when no profile is saved.
//
// This file is loaded by STUDENT pages, so it must never import anything under a path containing "teacher" (the
// site's teacher gate refuses those paths): teacher/* imports this file, never the other way round.
import { rememberAudience } from "../audience.js";
import { INTENSITY_LABEL, LEVELS, level } from "../book/lang/profiles.js";
import { loadLink } from "../class/link.js";
import { getPrefs } from "../store.js";
import { safeJson } from "../util.js";
import { DISCLAIMER, SUPPORT_DOMAINS, SUPPORT_KEYS, emptySupports } from "./contract.js";
import { isTeacherMode, loadProgress, saveProgress } from "./store.js";

export { DISCLAIMER, SUPPORT_DOMAINS, SUPPORT_KEYS };
export const BANDS = Object.freeze([1, 2, 3, 4, 5]);
export const DEFAULT_BAND = 4;

const readProgress = () => {
  try {
    return loadProgress();
  } catch {
    return {};
  }
};

/** [English, Spanish] for each support key (UI chips and the preview). */
export const SUPPORT_LABEL = Object.freeze({
  picture: ["Pictures", "Imágenes"],
  audio: ["Word audio", "Audio de palabras"],
  glossaryEs: ["Spanish glossary", "Glosario en español"],
  frames: ["Sentence frames", "Marcos de oraciones"],
  wordBank: ["Word bank", "Banco de palabras"],
  model: ["Worked model", "Modelo resuelto"],
  chunked: ["Text and steps in chunks", "Texto y pasos en partes"],
  rehearsal: ["Say it first (oral rehearsal)", "Dilo primero (ensayo oral)"],
  starters: ["Sentence starters", "Inicios de oración"],
  organizer: ["Graphic organizer", "Organizador gráfico"],
  readAloud: ["Read aloud", "Lectura en voz alta"],
  anyLanguageResponse: ["Respond in any language", "Responder en cualquier idioma"],
});
export const DOMAIN_LABEL = Object.freeze({
  listening: ["Listening", "Escuchar"],
  speaking: ["Speaking", "Hablar"],
  reading: ["Reading", "Leer"],
  writing: ["Writing", "Escribir"],
});

/**
 * The highest band at which each support is ON for a domain (0 = never). A support is on while band <= threshold, so
 * lower bands (more support) always show a superset of what higher bands show. Domain-sensitive on purpose: a learner
 * can need heavy speaking support and almost none for reading.
 */
export const THRESHOLD = Object.freeze({
  listening: {
    picture: 4,
    audio: 5,
    glossaryEs: 3,
    frames: 2,
    wordBank: 2,
    model: 2,
    chunked: 3,
    rehearsal: 0,
    starters: 0,
    organizer: 0,
    readAloud: 3,
    anyLanguageResponse: 2,
  },
  speaking: {
    picture: 3,
    audio: 4,
    glossaryEs: 3,
    frames: 4,
    wordBank: 3,
    model: 3,
    chunked: 0,
    rehearsal: 4,
    starters: 3,
    organizer: 2,
    readAloud: 0,
    anyLanguageResponse: 2,
  },
  reading: {
    picture: 4,
    audio: 3,
    glossaryEs: 4,
    frames: 2,
    wordBank: 2,
    model: 1,
    chunked: 3,
    rehearsal: 0,
    starters: 0,
    organizer: 2,
    readAloud: 3,
    anyLanguageResponse: 1,
  },
  writing: {
    picture: 3,
    audio: 2,
    glossaryEs: 3,
    frames: 4,
    wordBank: 4,
    model: 3,
    chunked: 2,
    rehearsal: 2,
    starters: 4,
    organizer: 3,
    readAloud: 2,
    anyLanguageResponse: 2,
  },
});

const bandsOf = (l, s, r, w) => ({ listening: l, speaking: s, reading: r, writing: w });
/** Recommended starting points. Names echo the lab's Book Studio levels; none is a proficiency determination. */
export const PRESETS = Object.freeze([
  {
    id: "starting",
    bands: bandsOf(1, 1, 1, 1),
    label: ["Most support in every domain", "Más apoyo en todos los dominios"],
    note: [
      "For a student new to English: pictures, audio, Spanish glossary, frames, banks and models everywhere.",
      "Para un estudiante nuevo en inglés: imágenes, audio, glosario en español, marcos, bancos y modelos en todas partes.",
    ],
  },
  {
    id: "emerging",
    bands: bandsOf(2, 2, 2, 2),
    label: ["Heavy support, fewer models", "Apoyo fuerte, menos modelos"],
    note: [
      "Still heavy support, with the reading model removed so the student tries first.",
      "Todavía mucho apoyo, sin el modelo de lectura para que el estudiante lo intente primero.",
    ],
  },
  {
    id: "developing",
    bands: bandsOf(3, 3, 3, 3),
    label: ["Moderate support", "Apoyo moderado"],
    note: [
      "Pictures and glossary stay; frames and banks move to speaking and writing.",
      "Se mantienen imágenes y glosario; marcos y bancos pasan a hablar y escribir.",
    ],
  },
  {
    id: "expanding",
    bands: bandsOf(4, 4, 4, 4),
    label: [
      "Light support (starting point for most)",
      "Apoyo ligero (punto de partida para la mayoría)",
    ],
    note: [
      "Pictures, word audio and writing frames; everything else on request.",
      "Imágenes, audio de palabras y marcos de escritura; todo lo demás a pedido.",
    ],
  },
  {
    id: "bridging",
    bands: bandsOf(5, 5, 5, 5),
    label: ["Minimal support", "Apoyo mínimo"],
    note: [
      "Word audio for listening only; every other support is on request.",
      "Solo audio de palabras al escuchar; todo lo demás a pedido.",
    ],
  },
  {
    id: "oral-ahead",
    bands: bandsOf(4, 4, 2, 2),
    label: ["Strong speaker, early reader and writer", "Buen hablante, lector y escritor inicial"],
    note: [
      "Light listening and speaking support, heavy reading and writing support.",
      "Poco apoyo al escuchar y hablar, mucho apoyo al leer y escribir.",
    ],
  },
  {
    id: "literacy-ahead",
    bands: bandsOf(2, 2, 4, 4),
    label: ["Reads and writes ahead of speaking", "Lee y escribe mejor de lo que habla"],
    note: [
      "Heavy listening and speaking support, light reading and writing support.",
      "Mucho apoyo al escuchar y hablar, poco al leer y escribir.",
    ],
  },
]);
export const presetProfile = (id) => {
  const p = PRESETS.find((x) => x.id === id);
  return p ? normalizeProfile({ bands: p.bands, preset: p.id, source: "preset" }) : null;
};

// ── profile ───────────────────────────────────────────────────────────────────
const clampInt = (v, lo, hi, fb) =>
  Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Math.round(Number(v)))) : fb;
const clamp01 = (v, fb) =>
  Number.isFinite(Number(v)) ? Math.round(Math.min(1, Math.max(0, Number(v))) * 100) / 100 : fb;
export const SOURCES = Object.freeze(["teacher", "student", "preset", "class"]);

/** The one trusted profile shape. Unknown fields are dropped; every value is clamped. `fade` is strength remaining: 1 = full, 0 = faded out. */
export function normalizeProfile(raw = {}) {
  const r = raw && typeof raw === "object" ? raw : {};
  const bands = {};
  const overrides = {};
  for (const d of SUPPORT_DOMAINS) {
    bands[d] = clampInt(r.bands?.[d], 1, 5, DEFAULT_BAND);
    const row = {};
    for (const k of SUPPORT_KEYS)
      if (typeof r.overrides?.[d]?.[k] === "boolean") row[k] = r.overrides[d][k];
    if (Object.keys(row).length) overrides[d] = row;
  }
  const s = r.schedule && typeof r.schedule === "object" ? r.schedule : {};
  return {
    v: 1,
    name: String(r.name || "").slice(0, 40),
    preset: String(r.preset || "").slice(0, 24),
    source: SOURCES.includes(r.source) ? r.source : "teacher",
    bands,
    overrides,
    fade: clamp01(r.fade, 1),
    schedule: {
      mode: s.mode === "units" ? "units" : "manual",
      every: clampInt(s.every, 1, 20, 3),
      step: clamp01(s.step, 0.25) || 0.25,
      since: clampInt(s.since, 0, 100000, 0),
    },
  };
}
export const DEFAULT_PROFILE = Object.freeze(normalizeProfile({}));

/** Lessons this learner has finished (all eight sections done), read defensively from progress.units[*].lessons (model.js unitStatus shape). */
export function completedUnitCount(progress) {
  const units =
    progress?.units && typeof progress.units === "object" ? Object.values(progress.units) : [];
  return units.filter((u) =>
    ["a", "b", "c", "d", "e", "f", "g", "h"].every((l) => u?.lessons?.[l]?.done),
  ).length;
}

/** Fade strength (1 -> 0) now: the saved value, lowered one `step` every `every` finished units since the schedule began. */
export function effectiveFade(profile, completedUnits = 0) {
  const p = normalizeProfile(profile);
  if (p.schedule.mode !== "units") return p.fade;
  const steps = Math.floor(Math.max(0, completedUnits - p.schedule.since) / p.schedule.every);
  return clamp01(p.fade - steps * p.schedule.step, 0);
}

/**
 * ctx.supports for one domain. The band sets which supports are on; fade slides the band toward "no assigned supports"
 * (it can only turn supports off, never on); an override of `true` pins a support (never faded), `false` removes it.
 */
export function resolveFlags(profile, domain = "reading", { completedUnits = 0 } = {}) {
  const p = normalizeProfile(profile);
  const d = SUPPORT_DOMAINS.includes(domain) ? domain : "reading";
  const fade = effectiveFade(p, completedUnits);
  const band = p.bands[d];
  const effective = band + (1 - fade) * (6 - band);
  const out = emptySupports();
  for (const k of SUPPORT_KEYS) {
    const forced = p.overrides[d]?.[k];
    out[k] = typeof forced === "boolean" ? forced : effective <= THRESHOLD[d][k];
  }
  out.fade = fade;
  return out;
}

// ── class stages (the lab's A / B / C) → bands ───────────────────────────────
/** A Starting (more support) → 2, B Growing (some) → 3, C Expanding (more independence) → 4. Defaults only. */
export const STAGE_BAND = Object.freeze({ A: 2, B: 3, C: 4 });
export function profileFromStages(stages = {}) {
  const bands = {};
  for (const d of SUPPORT_DOMAINS) {
    const st = stages[d] ?? stages[d[0].toUpperCase() + d.slice(1)];
    if (STAGE_BAND[st]) bands[d] = STAGE_BAND[st];
  }
  return Object.keys(bands).length ? normalizeProfile({ bands, source: "class" }) : null;
}

/**
 * The profile for a learner. With no argument: this device's saved profile (progress.prefs.supportProfile), else the
 * starting support the class set (the lab's prefs.tiers), else the light default. With a student object
 * ({ profile } | { stages } | { tiers }, e.g. a roster entry): that student's, same fallbacks.
 */
export function profileFor(student) {
  if (student?.profile) return normalizeProfile(student.profile);
  const fromStages = profileFromStages(
    student?.stages || student?.tiers || (student ? {} : getPrefs().tiers),
  );
  if (student) return fromStages || DEFAULT_PROFILE;
  const saved = readProgress().prefs?.supportProfile;
  return saved ? normalizeProfile(saved) : fromStages || DEFAULT_PROFILE;
}

/** Save the active profile through the store API. Returns the store's { state }. */
export function saveProfile(profile) {
  const progress = readProgress();
  progress.prefs = { ...(progress.prefs || {}), supportProfile: normalizeProfile(profile) };
  return saveProgress(progress);
}
/** Teacher-saved presets of this device (progress.prefs.supportPresets), newest first, at most 12. */
export const savedPresets = () =>
  (readProgress().prefs?.supportPresets || [])
    .map((p) => ({ id: String(p.id || ""), profile: normalizeProfile(p.profile) }))
    .filter((p) => p.id && p.profile.name);
export function savePreset(profile) {
  const p = normalizeProfile({ ...profile, source: "teacher" });
  if (!p.name) return { state: "error-recoverable", reason: "no-name" };
  const progress = readProgress();
  const id = `sp-${
    p.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "preset"
  }`;
  const list = (progress.prefs?.supportPresets || []).filter((x) => x.id !== id);
  progress.prefs = {
    ...(progress.prefs || {}),
    supportPresets: [{ id, profile: p }, ...list].slice(0, 12),
  };
  return { ...saveProgress(progress), id };
}
export function removePreset(id) {
  const progress = readProgress();
  progress.prefs = {
    ...(progress.prefs || {}),
    supportPresets: (progress.prefs?.supportPresets || []).filter((x) => x.id !== id),
  };
  return saveProgress(progress);
}

// ── teacher detection (the lab's existing audience memory) ───────────────────
/**
 * A teacher on this device: Core's isTeacherMode() (the lab's remembered "teacher" audience, or the site teacher key typed
 * in this tab) AND the device is not a class student's (no class link). Convenience, not authentication: the server's
 * teacher password gate and the class passcode are the real boundaries.
 */
export const isTeacherSession = ({ teacher = isTeacherMode(), link = loadLink() } = {}) =>
  Boolean(teacher) && !link;
/** Teacher chooses "I am a teacher" on this device. Refused on a device linked to a class as a student. */
export const declareTeacher = () => !loadLink() && rememberAudience("teacher");

// ── preview as a student (teacher only; tab-scoped) ──────────────────────────
const PREVIEW_KEY = "vaSupportPreview";
const session = () => {
  try {
    return globalThis.sessionStorage || null;
  } catch {
    return null;
  }
};
/**
 * Preview a profile: every getSupportFlags call in this tab resolves it until previewAs(null). Teacher sessions only.
 * Returns { profile, flags: {domain: ctx.supports}, on: {domain: [keys]} } so a UI can draw exactly what a student sees.
 */
export function previewAs(profile, { start = true } = {}) {
  if (!profile) {
    session()?.removeItem(PREVIEW_KEY);
    return null;
  }
  const p = normalizeProfile(profile);
  if (start && isTeacherSession()) session()?.setItem(PREVIEW_KEY, JSON.stringify(p));
  const flags = Object.fromEntries(
    SUPPORT_DOMAINS.map((d) => [
      d,
      resolveFlags(p, d, { completedUnits: completedUnitCount(readProgress()) }),
    ]),
  );
  return {
    profile: p,
    flags,
    on: Object.fromEntries(
      SUPPORT_DOMAINS.map((d) => [d, SUPPORT_KEYS.filter((k) => flags[d][k])]),
    ),
  };
}
export function activePreview() {
  if (!isTeacherSession()) return null;
  const saved = safeJson(session()?.getItem(PREVIEW_KEY), null);
  return saved ? normalizeProfile(saved) : null;
}

// ── assignment variants (an assignment carries a supports override and/or a smaller word set) ──
// Encoded in the assignment path's query because the class server stores only id/title/path/due and a path may
// hold [\w-./?=&%] only:  sup=3322 (bands L,S,R,W)  sf=50 (fade %)  son=picture.audio  soff=frames  w=1.3.5 (word positions)
const STASH_KEY = "vaVariantStash";
const num = (n) => (Number.isFinite(Number(n)) ? Number(n) : Number.NaN);
export function encodeVariant({ bands, fade, on = [], off = [], words = [] } = {}) {
  const q = new URLSearchParams();
  if (bands)
    q.set("sup", SUPPORT_DOMAINS.map((d) => clampInt(bands[d], 1, 5, DEFAULT_BAND)).join(""));
  if (Number.isFinite(num(fade)) && fade !== null)
    q.set("sf", String(Math.round(clamp01(fade, 1) * 100)));
  const keys = (list) => [...new Set(list)].filter((k) => SUPPORT_KEYS.includes(k)).join(".");
  if (keys(on)) q.set("son", keys(on));
  if (keys(off)) q.set("soff", keys(off));
  const ws = [...new Set(words.map(Number))]
    .filter((n) => Number.isInteger(n) && n > 0 && n < 100)
    .sort((a, b) => a - b);
  if (ws.length) q.set("w", ws.join("."));
  return q.toString();
}
/** The variant in a query string, or null when it carries none. */
export function parseVariant(search = "") {
  const q = new URLSearchParams(String(search).replace(/^\?/, ""));
  const sup = /^[1-5]{4}$/.test(q.get("sup") || "") ? q.get("sup") : "";
  const sf =
    q.get("sf") !== null && /^\d{1,3}$/.test(q.get("sf"))
      ? clamp01(Number(q.get("sf")) / 100, 1)
      : null;
  const keys = (v) =>
    String(v || "")
      .split(".")
      .filter((k) => SUPPORT_KEYS.includes(k));
  const on = keys(q.get("son"));
  const off = keys(q.get("soff"));
  const words = String(q.get("w") || "")
    .split(".")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0 && n < 100);
  if (!sup && sf === null && !on.length && !off.length && !words.length) return null;
  return {
    bands: sup ? Object.fromEntries(SUPPORT_DOMAINS.map((d, i) => [d, Number(sup[i])])) : null,
    fade: sf,
    on,
    off,
    words,
  };
}
/** Keep only the words a variant names (1-based positions in the unit's word list); no variant or no `w` keeps them all. */
export const variantWords = (words, variant) =>
  variant?.words?.length ? words.filter((_, i) => variant.words.includes(i + 1)) : words;
/** Which unit/practice the variant belongs to, so it follows the learner through that unit's lessons and no further. */
const variantScope = (pathname = "") =>
  /\/grade\/([^/]+)\/lesson\/([^/]+)/.exec(pathname)?.slice(1, 3).join("-") ||
  (/\/practice\b/.test(pathname) ? "practice" : "");
/** The variant in force for this page: its own query, else the one stashed for the same unit earlier in this tab. */
export function activeVariant({
  search = globalThis.location?.search || "",
  pathname = globalThis.location?.pathname || "",
} = {}) {
  const scope = variantScope(pathname);
  const here = parseVariant(search);
  const ss = session();
  if (here) {
    if (scope) ss?.setItem(STASH_KEY, JSON.stringify({ scope, search: encodeVariant(here) }));
    return here;
  }
  const stash = safeJson(ss?.getItem(STASH_KEY), null);
  return scope && stash?.scope === scope ? parseVariant(stash.search) : null;
}
const applyVariant = (profile, v) => {
  if (!v) return profile;
  const overrides = {};
  for (const d of SUPPORT_DOMAINS)
    overrides[d] = {
      ...profile.overrides[d],
      ...Object.fromEntries(v.on.map((k) => [k, true])),
      ...Object.fromEntries(v.off.map((k) => [k, false])),
    };
  return normalizeProfile({
    ...profile,
    bands: v.bands || profile.bands,
    fade: v.fade ?? profile.fade,
    overrides,
    schedule: { ...profile.schedule, mode: v.fade !== null ? "manual" : profile.schedule.mode },
  });
};

/**
 * THE function every renderer calls: ctx.supports for a domain. Order of authority: a teacher's preview (this tab) >
 * an assignment variant (this unit) > this learner's profile. Pure reads; never throws.
 */
export function getSupportFlags(domain = "reading", opts = {}) {
  try {
    const progress = readProgress();
    const base = opts.profile
      ? normalizeProfile(opts.profile)
      : activePreview() || applyVariant(profileFor(), activeVariant(opts));
    return resolveFlags(base, domain, { completedUnits: completedUnitCount(progress) });
  } catch {
    return resolveFlags(DEFAULT_PROFILE, domain);
  }
}

// ── copy ──────────────────────────────────────────────────────────────────────
/** "Support intensity 3 · Developing · Moderate support" in the reader's language (S = I.S). */
export function bandText(n, S = (en) => en) {
  const l = level(n);
  if (!l || n > 5) return S("Support intensity not set", "Intensidad de apoyo sin definir");
  const [en, es] = INTENSITY_LABEL[l.intensity];
  return `${S("Support intensity", "Intensidad de apoyo")} ${l.n} · ${S(l.en, l.es)} · ${S(en, es)}`;
}
export const BAND_NAMES = Object.freeze(
  LEVELS.filter((l) => l.n <= 5).map((l) => ({
    n: l.n,
    en: l.en,
    es: l.es,
    intensity: l.intensity,
  })),
);
export const SUPPORT_NOTE = Object.freeze({
  en: `Support intensity is a teaching choice about scaffolding. It is not an official WIDA level or score and does not change the grade-level learning goal. ${DISCLAIMER.en}`,
  es: `La intensidad de apoyo es una decisión de enseñanza sobre los andamios. No es un nivel ni un puntaje oficial de WIDA y no cambia la meta de aprendizaje del grado. ${DISCLAIMER.es}`,
});
