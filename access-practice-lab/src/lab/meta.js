// Shared vocabulary for the Language Lab v2 layer: WIDA domains, content areas, scaffold tiers and the
// per-game metadata the HUD, the state store, the routing layer and the teacher/family summaries all read.
// One source of truth: nothing else in src/lab/ spells a domain, tier or content area.
//
// Honesty rules (PLATFORM.md): a tier is a classroom SUPPORT choice, never a WIDA proficiency level, and
// every number built from this metadata is practice coverage, never a predicted ACCESS score.
import { GAMES } from "../games/registry.js";
import { WORLD_DOMAINS } from "../adventures/worlds/domains.js";

export const DOMAINS = Object.freeze(["Listening", "Reading", "Speaking", "Writing"]);
export const DOMAIN_CODE = Object.freeze({
  Listening: "L",
  Reading: "R",
  Speaking: "S",
  Writing: "W",
});
export const DOMAIN_NAME_ES = Object.freeze({
  Listening: "Escuchar",
  Reading: "Leer",
  Speaking: "Hablar",
  Writing: "Escribir",
});

/** WIDA ELD Standards content areas. LoMA is the only one that shows the Math Workbench. */
export const CONTENT_AREAS = Object.freeze(["LoELA", "LoMA", "LoSc", "LoSS", "SI"]);
export const MATH_AREA = "LoMA";

/** Scaffold tiers. Each maps onto one of the engine's support modes (A = most help, C = least). */
export const TIERS = Object.freeze({
  independent: {
    id: "independent",
    support: "C",
    en: "Independent",
    es: "Independiente",
    replays: 2,
  },
  guided: { id: "guided", support: "B", en: "Guided", es: "Guiado", replays: Infinity },
  "hands-on": {
    id: "hands-on",
    support: "A",
    en: "Hands-on",
    es: "Con apoyo total",
    replays: Infinity,
  },
});
export const TIER_IDS = Object.freeze(Object.keys(TIERS));
export const tierOfSupport = (support) =>
  TIER_IDS.find((id) => TIERS[id].support === support) || "hands-on";
export const supportOfTier = (tier) => TIERS[tier]?.support || "A";
/** Accepts "guided", "Guided", "hands_on", "B": returns a tier id or "". */
export function normalizeTier(value) {
  const v = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
  if (TIERS[v]) return v;
  const bySupport = TIER_IDS.find((id) => TIERS[id].support.toLowerCase() === v);
  return bySupport || "";
}

export const BANDS = Object.freeze(["3-5", "6-8"]);
export const normalizeLabBand = (value) => {
  const v = String(value ?? "")
    .replace(/[–—_]/g, "-")
    .trim();
  return BANDS.includes(v) ? v : "";
};

/** UI language chrome: "en" | "es" | "bi". The URL spelling for bilingual is "en-es". */
export const LANG_URL = Object.freeze({ en: "en", es: "es", bi: "en-es" });
export function normalizeLang(value) {
  const v = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[+_\s]/g, "-");
  if (v === "en" || v === "es") return v;
  if (v === "en-es" || v === "bi" || v === "bilingual") return "bi";
  return "";
}

// Content area is a property of the task, not of the grade band. Most games practice the Language of
// English Language Arts; the ones whose texts are science or social-studies passages say so here, and a
// game that carries math language (none ships today) would be tagged LoMA and bring the Math Workbench.
const AREA_OVERRIDES = Object.freeze({
  "escape-room": "LoSc",
  "word-search-adventure": "LoSc",
  "direction-dash": "LoSc",
  "story-world": "LoELA",
});

const domainsOf = (g) => {
  const list = (g.skills || [g.skill]).filter((s) => DOMAINS.includes(s));
  return list.length ? list : [...DOMAINS];
};

/** The metadata row for one game: what the HUD badge, the telemetry and the remediation links need. */
/** The four Language Worlds (/worlds/:id) each practice one WIDA domain. */
export const LANGUAGE_WORLD_DOMAIN = Object.freeze({ "signal-station": "Listening", "evidence-city": "Reading", "conversation-quest": "Speaking", storyworks: "Writing" });

export function gameMeta(id) {
  const lw = LANGUAGE_WORLD_DOMAIN[String(id).replace(/^world:/, "")];
  if (lw && String(id).startsWith("world:"))
    return { id, skill: lw, primaryDomain: lw, domains: [lw], contentArea: "LoELA", mechanic: "mission-chain" };
  if (String(id).startsWith("world:")) {
    const worldId = String(id).slice("world:".length);
    if (!Object.hasOwn(WORLD_DOMAINS, worldId)) return null;
    const domains = WORLD_DOMAINS[worldId].filter((d) => DOMAINS.includes(d));
    return { id, skill: "Integrated", primaryDomain: domains[0] || "Reading", domains: domains.length ? domains : [...DOMAINS], contentArea: "LoELA", mechanic: "mission-chain" };
  }
  const g = GAMES.find((x) => x.id === id);
  if (!g) return null;
  return {
    id: g.id,
    skill: g.skill,
    primaryDomain: DOMAINS.includes(g.skill) ? g.skill : domainsOf(g)[0],
    domains: domainsOf(g),
    contentArea: AREA_OVERRIDES[g.id] || "LoELA",
    mechanic: g.mechanic,
  };
}

export const ALL_GAME_META = Object.freeze(GAMES.map((g) => gameMeta(g.id)));

/** The content area of whatever the learner is looking at now. Drives the Math Workbench. */
export function contentAreaOfRoute(route = {}) {
  if (route.mathBridge) return MATH_AREA;
  if (route.view === "games" && route.id) return gameMeta(route.id)?.contentArea || "LoELA";
  if (route.view === "language-studios" && route.id === "math") return MATH_AREA;
  if (route.contentArea && CONTENT_AREAS.includes(route.contentArea)) return route.contentArea;
  return "LoELA";
}
