// validateWorld(world) → string[] of errors: the ADVENTURE-SCHEMA.md contract for one world, plus the content rules
// (both bands, word ranges, every mission has input + thinking + production, the final mission ends with the
// demonstration, a model answer passes its own check, no timers/scores/levels). Pure; tools/adventures.test.mjs runs it
// on every world in WORLDS.
import { ART } from "../book/art.js";
import { TEMPLATES } from "../book/templates.js";
import { ADV_ART } from "./art.js";
import { checkRespond, countWords, CONNECTOR_WORDS } from "./checks.js";

export const WORLD_IDS = [
  "mystery-museum",
  "science-island",
  "city-of-conversations",
  "newsroom-studio",
  "community-design-lab",
  "storyverse",
  "lost-city",
];
export const KINDS = [
  "story",
  "read",
  "listen",
  "clues",
  "choice",
  "order",
  "respond",
  "checkpoint",
];
export const KEY_USES = ["Explain", "Narrate", "Inform", "Argue"];
export const DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];
export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);
export const READ_WORDS = { "3-5": [60, 180], "6-8": [120, 260] };
const ART_KEYS = new Set([...ART.map((a) => a.key), ...ADV_ART.map((a) => a.key)]);
const BANNED =
  /\b(timers?|countdowns?|beat the clock|leaderboards?|scores?|\d+\s+points|wida levels?|proficiency levels?|level [1-6])\b/i;

const str = (v) => typeof v === "string" && v.trim().length > 0;
const pair = (v) => v && str(v.en) && str(v.es);
const isHex = (v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);

/** Every string inside a value, with its path. */
function* strings(v, path) {
  if (typeof v === "string") yield [path, v];
  else if (Array.isArray(v)) for (const [i, x] of v.entries()) yield* strings(x, `${path}[${i}]`);
  else if (v && typeof v === "object")
    for (const [k, x] of Object.entries(v)) yield* strings(x, `${path}.${k}`);
}

function checkArt(list, where, errors) {
  if (list == null) return;
  if (!Array.isArray(list)) return errors.push(`${where}: art must be an array of art keys`);
  for (const k of list) if (!ART_KEYS.has(k)) errors.push(`${where}: unknown art key "${k}"`);
}

function validateScene(s, i, scenes, band, where, errors, world = {}, mission = null) {
  const at = `${where}[${i}]`;
  if (!s || !KINDS.includes(s.kind)) return errors.push(`${at}: unknown kind "${s?.kind}"`);
  if (s.kind === "story") {
    if (!pair(s.text)) errors.push(`${at}: story needs text {en, es}`);
    if (s.speaker != null && !str(s.speaker)) errors.push(`${at}: speaker must be a name`);
    if (s.listen != null && typeof s.listen !== "boolean")
      errors.push(`${at}: listen must be true/false`);
    checkArt(s.art, at, errors);
  } else if (s.kind === "read") {
    if (!pair(s.title)) errors.push(`${at}: read needs title {en, es}`);
    if (!str(s.text?.en)) errors.push(`${at}: read needs text.en`);
    const n = countWords(s.text?.en);
    const [lo, hi] = READ_WORDS[band];
    if (n < lo || n > hi) errors.push(`${at}: passage is ${n} words; ${band} needs ${lo}-${hi}`);
    for (const g of s.glossary || []) {
      if (!str(g.word) || !str(g.en) || !str(g.es))
        errors.push(`${at}: glossary entries need word, en, es`);
      else if (
        !String(s.text?.en || "")
          .toLowerCase()
          .includes(g.word.toLowerCase().replace(/(es|ed|ing|e|s)$/, ""))
      )
        errors.push(`${at}: glossary word "${g.word}" is not in the passage`);
    }
    checkArt(s.art, at, errors);
  } else if (s.kind === "listen") {
    if (!str(s.script?.en)) errors.push(`${at}: listen needs script.en`);
    if (!pair(s.transcriptLabel)) errors.push(`${at}: listen needs transcriptLabel {en, es}`);
  } else if (s.kind === "clues") {
    if (!pair(s.prompt)) errors.push(`${at}: clues needs prompt {en, es}`);
    const clues = Array.isArray(s.clues) ? s.clues : [];
    const ids = new Set();
    for (const c of clues) {
      if (!str(c.id) || ids.has(c.id)) errors.push(`${at}: clue ids must be unique (${c.id})`);
      ids.add(c.id);
      if (!str(c.text?.en)) errors.push(`${at}: clue ${c.id} needs text.en`);
      if (typeof c.relevant !== "boolean")
        errors.push(`${at}: clue ${c.id} needs relevant true/false`);
      if (!pair(c.why)) errors.push(`${at}: clue ${c.id} needs why {en, es}`);
    }
    const relevant = clues.filter((c) => c.relevant).length;
    const need = s.need ?? 3;
    if (!Number.isInteger(need) || need < 1)
      errors.push(`${at}: need must be a positive whole number`);
    if (relevant < need) errors.push(`${at}: needs ${need} relevant clues but has ${relevant}`);
    if (clues.length - relevant < 1)
      errors.push(`${at}: needs at least one clue that is not relevant`);
  } else if (s.kind === "choice") {
    if (!pair(s.prompt)) errors.push(`${at}: choice needs prompt {en, es}`);
    const opts = Array.isArray(s.options) ? s.options : [];
    if (opts.length < 2) errors.push(`${at}: choice needs at least two options`);
    if (!opts.some((o) => o.correct === true)) errors.push(`${at}: choice needs a correct option`);
    if (!opts.some((o) => o.correct === false))
      errors.push(`${at}: choice needs a wrong option to reason about`);
    for (const [k, o] of opts.entries()) {
      if (!str(o.text?.en)) errors.push(`${at}: option ${k} needs text.en`);
      if (typeof o.correct !== "boolean")
        errors.push(`${at}: option ${k} needs correct true/false`);
      if (!pair(o.feedback)) errors.push(`${at}: option ${k} needs feedback {en, es}`);
      if (o.next != null && (!Number.isInteger(o.next) || o.next <= i || o.next >= scenes.length))
        errors.push(`${at}: option ${k} next must be a later scene index in this band`);
      if (o.next != null && !o.correct)
        errors.push(`${at}: option ${k}: only a correct option may branch`);
      if (!o.correct)
        for (const c of opts.filter((x) => x.correct))
          if (str(c.text?.en) && String(o.feedback?.en || "").includes(c.text.en))
            errors.push(`${at}: option ${k} feedback states the answer`);
    }
  } else if (s.kind === "order") {
    if (!pair(s.prompt)) errors.push(`${at}: order needs prompt {en, es}`);
    const items = Array.isArray(s.items) ? s.items : [];
    if (items.length < 3) errors.push(`${at}: order needs at least three items`);
    if (items.some((x) => !str(x?.en))) errors.push(`${at}: order items need en`);
    if (new Set(items.map((x) => x?.en)).size !== items.length)
      errors.push(`${at}: order items must differ`);
  } else if (s.kind === "respond") {
    if (!pair(s.prompt)) errors.push(`${at}: respond needs prompt {en, es}`);
    if (!["write", "say"].includes(s.mode)) errors.push(`${at}: respond mode must be write or say`);
    if (!Array.isArray(s.frames) || !s.frames.length || s.frames.some((f) => !str(f?.en)))
      errors.push(`${at}: respond needs frames [{ en }]`);
    if (!Array.isArray(s.wordBank) || !s.wordBank.length || s.wordBank.some((w) => !str(w)))
      errors.push(`${at}: respond needs a wordBank of strings`);
    if (!str(s.model?.en)) errors.push(`${at}: respond needs model.en`);
    const c = s.check || {};
    if (!s.check || typeof s.check !== "object") errors.push(`${at}: respond needs check`);
    if (c.minWords != null && (!Number.isInteger(c.minWords) || c.minWords < 1))
      errors.push(`${at}: minWords must be a positive whole number`);
    for (const j of c.needConnectors || [])
      if (!CONNECTOR_WORDS[j]) errors.push(`${at}: unknown connector job "${j}"`);
    if (c.needAny && !c.needAny.every((g) => Array.isArray(g) && g.length && g.every(str)))
      errors.push(`${at}: needAny must be a list of word lists`);
    if (c.evidenceFrom != null && c.evidenceFrom !== "clues")
      errors.push(`${at}: evidenceFrom must be "clues"`);
    // Evidence comes from this mission's clues scenes before it, or (a mission with none) from the world's others.
    const own = scenes.some((x) => x?.kind === "clues");
    const earlier = own
      ? scenes.slice(0, i).filter((x) => x.kind === "clues")
      : (world.missions || [])
          .filter((x) => x !== mission)
          .flatMap((x) => (x?.bands?.[band] || []).filter((y) => y?.kind === "clues"));
    if (c.evidenceFrom === "clues" && !earlier.length)
      errors.push(`${at}: evidenceFrom "clues" needs a clues scene before it`);
    if (str(s.model?.en)) {
      const clues = earlier.flatMap((x) => (x.clues || []).filter((k) => k.relevant));
      const r = checkRespond(s.model.en, c, clues);
      if (!r.ok)
        errors.push(
          `${at}: the model does not pass its own check (${r.items
            .filter((x) => !x.ok)
            .map((x) => x.id)
            .join(", ")})`,
        );
    }
  } else if (s.kind === "checkpoint") {
    if (!pair(s.text)) errors.push(`${at}: checkpoint needs text {en, es}`);
  }
}

function validateMission(m, mi, world, errors) {
  const where = `missions[${mi}] ${m?.id || ""}`.trim();
  if (!str(m?.id) || !/^[a-z0-9-]+$/.test(m.id))
    errors.push(`${where}: id must be lowercase-dashed`);
  if (!pair(m?.title)) errors.push(`${where}: title {en, es}`);
  if (!pair(m?.goal)) errors.push(`${where}: goal {en, es}`);
  if (!KEY_USES.includes(m?.keyUse))
    errors.push(`${where}: keyUse must be one of ${KEY_USES.join(", ")}`);
  if (
    !Array.isArray(m?.domains) ||
    !m.domains.length ||
    m.domains.some((d) => !DOMAINS.includes(d))
  )
    errors.push(`${where}: domains must come from ${DOMAINS.join(", ")}`);
  if (typeof m?.final !== "boolean") errors.push(`${where}: final must be true/false`);
  if (m?.book != null && (!TEMPLATE_IDS.includes(m.book.templateId) || !pair(m.book.title)))
    errors.push(`${where}: book needs a known templateId and title {en, es}`);
  for (const band of ["3-5", "6-8"]) {
    const scenes = m?.bands?.[band];
    const at = `${where} ${band}`;
    if (!Array.isArray(scenes)) {
      errors.push(`${at}: band missing`);
      continue;
    }
    if (scenes.length < 5 || scenes.length > 9)
      errors.push(`${at}: ${scenes.length} scenes; needs 5-9`);
    scenes.forEach((s, i) => validateScene(s, i, scenes, band, at, errors, world, m));
    const kinds = new Set(scenes.map((s) => s?.kind));
    if (!kinds.has("respond")) errors.push(`${at}: needs a respond scene`);
    if (!["clues", "choice", "order"].some((k) => kinds.has(k)))
      errors.push(`${at}: needs clues, choice or order`);
    if (!["read", "listen"].some((k) => kinds.has(k))) errors.push(`${at}: needs read or listen`);
    if (m?.final && scenes.at(-1)?.kind !== "respond")
      errors.push(`${at}: the final mission must end with respond`);
  }
}

export function validateWorld(world) {
  const errors = [];
  if (!world || typeof world !== "object") return ["world is not an object"];
  if (!WORLD_IDS.includes(world.id))
    errors.push(`id "${world.id}" is not one of ${WORLD_IDS.join(", ")}`);
  for (const k of ["title", "tagline", "intro"]) if (!pair(world[k])) errors.push(`${k} {en, es}`);
  const th = world.theme || {};
  if (!ART_KEYS.has(th.bg)) errors.push(`theme.bg "${th.bg}" is not an art key`);
  for (const k of ["accent", "soft", "ink"])
    if (!isHex(th[k])) errors.push(`theme.${k} must be a #rrggbb colour`);
  checkArt(th.hero, "theme.hero", errors);
  if (!str(world.guide?.name) || !ART_KEYS.has(world.guide?.art))
    errors.push("guide needs name and a known art key");
  const missions = Array.isArray(world.missions) ? world.missions : [];
  if (missions.length < 3) errors.push("needs at least 3 missions");
  if (new Set(missions.map((m) => m?.id)).size !== missions.length)
    errors.push("mission ids must be unique");
  missions.forEach((m, i) => validateMission(m, i, world, errors));
  const finals = missions.filter((m) => m?.final);
  if (finals.length !== 1 || !missions.at(-1)?.final)
    errors.push("exactly one final mission, and it is the last");
  if (!missions.some((m) => m?.book)) errors.push("at least one mission needs a book link");
  for (const [path, s] of strings(world, "world"))
    if (BANNED.test(s))
      errors.push(`${path}: uses "${s.match(BANNED)[0]}" (no timers, scores or levels)`);
  return errors;
}
