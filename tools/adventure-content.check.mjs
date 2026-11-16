#!/usr/bin/env node
// Standalone content check for four Adventure Worlds (City of Conversations, Newsroom Studio, Community Design Lab,
// Storyverse). Validates each world against the shared Adventure schema (ADVENTURE-SCHEMA.md) and proves that every
// `respond` scene's model answer passes its own check rules while an empty answer, a copied prompt, and the frames
// pasted together do not. The engine ships its own validator (src/adventures/validate.js); this script exists so
// the content can be verified before the engine lands. Usage: node tools/adventure-content.check.mjs
import { ART } from "../access-practice-lab/src/book/art.js";
import { connectorsIn } from "../access-practice-lab/src/lang/labs-check.js";
import { CONNECTORS } from "../access-practice-lab/src/lang/lexicon.js";

const ALL = ["city-of-conversations", "newsroom-studio", "community-design-lab", "storyverse"];
const FILES = process.argv.length > 2 ? process.argv.slice(2) : ALL;
const WORLD_IDS = [
  "mystery-museum",
  "science-island",
  "city-of-conversations",
  "newsroom-studio",
  "community-design-lab",
  "storyverse",
];
const BGS = [
  "bg-city",
  "bg-park",
  "bg-newsroom",
  "bg-market",
  "bg-classroom",
  "bg-forest",
  "bg-space",
  "bg-night",
  "bg-home",
  "bg-kitchen",
  "bg-beach",
  "bg-island",
  "bg-museum",
  "bg-lab",
];
const TEMPLATES = [
  "mission-report",
  "conversation-book",
  "informational-report",
  "evidence-argument",
  "comic-conversation",
  "mystery-story",
  "persuasive-book",
  "personal-narrative",
];
const KEY_USES = ["Explain", "Narrate", "Inform", "Argue"];
const DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];
const KINDS = ["story", "read", "listen", "clues", "choice", "order", "respond", "checkpoint"];
const BANDS = ["3-5", "6-8"];
const PASSAGE = { "3-5": [60, 180], "6-8": [120, 260] };
const ART_KEYS = new Set(ART.map((a) => a.key));
const BANNED = /\b(timers?|scores?|points|wida levels?|puntos|puntaje)\b/i;

const norm = (s) =>
  ` ${String(s || "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
const words = (s) =>
  String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
const has = (text, w) => norm(text).includes(norm(w));
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;

/** The respond rules (minus evidenceFrom), as the engine applies them. Returns the list of unmet rules. */
export function unmet(check, text) {
  const miss = [];
  if (check.minWords && words(text) < check.minWords) miss.push(`minWords ${check.minWords}`);
  const jobs = new Set(connectorsIn(text).map((c) => c.job));
  for (const job of check.needConnectors || []) if (!jobs.has(job)) miss.push(`connector:${job}`);
  for (const w of check.needWords || []) if (!has(text, w)) miss.push(`word:${w}`);
  for (const group of check.needAny || [])
    if (!group.some((w) => has(text, w))) miss.push(`any:${group.join("|")}`);
  return miss;
}

// Contrast (WCAG relative luminance).
const lum = (hex) => {
  const c = hex
    .replace("#", "")
    .match(/../g)
    .map((h) => parseInt(h, 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const HEX = /^#[0-9a-f]{6}$/i;

function validateWorld(world) {
  const errs = [];
  const err = (where, msg) => errs.push(`${world?.id || "?"} ${where}: ${msg}`);
  const bi = (where, v, need = ["en", "es"]) => {
    if (!isObj(v)) return err(where, "missing {en, es}");
    for (const k of need) if (!nonEmpty(v[k])) err(where, `missing ${k}`);
  };
  const enOnly = (where, v) => {
    if (!isObj(v) || !nonEmpty(v.en)) err(where, "missing {en}");
  };

  if (!WORLD_IDS.includes(world.id)) err("id", `unknown world id ${world.id}`);
  bi("title", world.title);
  bi("tagline", world.tagline);
  bi("intro", world.intro);
  if (isObj(world.intro) && nonEmpty(world.intro.en)) {
    const n = world.intro.en.split(/(?<=[.!?])\s+/).filter(Boolean).length;
    if (n < 2 || n > 4) err("intro", `intro should be 2-4 sentences (has ${n})`);
  }
  const t = world.theme || {};
  if (!BGS.includes(t.bg)) err("theme.bg", `bad bg ${t.bg}`);
  for (const k of ["accent", "soft", "ink"])
    if (!HEX.test(t[k] || "")) err(`theme.${k}`, "not a #rrggbb hex");
  if (HEX.test(t.ink || "") && HEX.test(t.soft || "") && contrast(t.ink, t.soft) < 4.5)
    err("theme", `ink on soft contrast ${contrast(t.ink, t.soft).toFixed(2)} < 4.5`);
  if (!Array.isArray(t.hero) || !t.hero.length || t.hero.some((k) => !ART_KEYS.has(k)))
    err("theme.hero", "bad art keys");
  if (!isObj(world.guide) || !nonEmpty(world.guide.name) || !ART_KEYS.has(world.guide.art))
    err("guide", "needs name + valid art");

  const ms = world.missions;
  if (!Array.isArray(ms) || ms.length < 3) return [...errs, `${world.id}: needs >= 3 missions`];
  const ids = new Set();
  let books = 0;
  ms.forEach((m, mi) => {
    const W = `mission[${mi}] ${m.id}`;
    if (!/^[a-z0-9-]+$/.test(m.id || "")) err(W, "bad id");
    if (ids.has(m.id)) err(W, "duplicate id");
    ids.add(m.id);
    bi(`${W} title`, m.title);
    bi(`${W} goal`, m.goal);
    if (!KEY_USES.includes(m.keyUse)) err(W, `bad keyUse ${m.keyUse}`);
    if (
      !Array.isArray(m.domains) ||
      !m.domains.length ||
      m.domains.some((d) => !DOMAINS.includes(d))
    )
      err(W, "bad domains");
    if (typeof m.final !== "boolean") err(W, "final must be boolean");
    const isLast = mi === ms.length - 1;
    if (m.final !== isLast)
      err(W, isLast ? "last mission must be final" : "only the last mission may be final");
    if (m.book !== null) {
      if (!isObj(m.book) || !TEMPLATES.includes(m.book.templateId)) err(W, "bad book templateId");
      else books++;
      bi(`${W} book.title`, m.book?.title);
    }
    if (!isObj(m.bands)) return err(W, "missing bands");
    for (const extra of Object.keys(m.bands))
      if (!BANDS.includes(extra)) err(W, `unknown band ${extra}`);
    const used = new Set();
    for (const band of BANDS) {
      const scenes = m.bands[band];
      const B = `${W} [${band}]`;
      if (!Array.isArray(scenes)) {
        err(B, "band missing");
        continue;
      }
      if (scenes.length < 5 || scenes.length > 9) err(B, `needs 5-9 scenes (has ${scenes.length})`);
      const kinds = scenes.map((s) => s.kind);
      if (!kinds.includes("respond")) err(B, "needs a respond");
      if (!kinds.some((k) => ["clues", "choice", "order"].includes(k)))
        err(B, "needs clues/choice/order");
      if (!kinds.some((k) => ["read", "listen"].includes(k))) err(B, "needs read or listen");
      if (m.final && kinds.at(-1) !== "respond") err(B, "final mission must end with respond");
      scenes.forEach((s, si) =>
        validateScene(s, `${B} scene ${si}`, band, scenes.length, used, { err, bi, enOnly }),
      );
    }
    // Domains must match what the scenes ask of the learner.
    for (const d of used) if (!m.domains.includes(d)) err(W, `scenes use ${d} but domains omit it`);
    for (const d of m.domains || [])
      if (!used.has(d)) err(W, `domains list ${d} but no scene uses it`);
  });
  if (!books) err("missions", "needs >= 1 mission with a book link");

  // Banned product words anywhere in the content.
  const walk = (v, path) => {
    if (typeof v === "string") {
      if (BANNED.test(v)) err(path, `banned word "${v.match(BANNED)[0]}"`);
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (isObj(v)) for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
  };
  walk(world, "world");
  return errs;
}

function validateScene(s, S, band, count, used, { err, bi, enOnly }) {
  if (!KINDS.includes(s.kind)) return err(S, `bad kind ${s.kind}`);
  const artOk = (a) => a === undefined || (Array.isArray(a) && a.every((k) => ART_KEYS.has(k)));
  if (!artOk(s.art)) err(S, "bad art keys");
  switch (s.kind) {
    case "story":
      bi(S, s.text);
      if (!nonEmpty(s.speaker)) err(S, "story needs speaker");
      if (!Array.isArray(s.art) || !s.art.length) err(S, "story needs art");
      if (s.listen) used.add("Listening");
      break;
    case "read": {
      bi(`${S} title`, s.title);
      enOnly(`${S} text`, s.text);
      const n = words(s.text?.en);
      const [lo, hi] = PASSAGE[band];
      if (n < lo || n > hi) err(S, `passage ${n} words, needs ${lo}-${hi}`);
      if (!Array.isArray(s.glossary)) err(S, "glossary must be an array");
      for (const g of s.glossary || []) {
        if (!nonEmpty(g.word) || !nonEmpty(g.en) || !nonEmpty(g.es))
          err(S, "glossary entry needs word/en/es");
        else if (!has(s.text?.en, g.word)) err(S, `glossary word "${g.word}" not in passage`);
      }
      used.add("Reading");
      break;
    }
    case "listen":
      enOnly(`${S} script`, s.script);
      bi(`${S} transcriptLabel`, s.transcriptLabel);
      if (words(s.script?.en) < 25) err(S, "listen script too short");
      used.add("Listening");
      break;
    case "clues": {
      bi(`${S} prompt`, s.prompt);
      const clues = s.clues || [];
      const rel = clues.filter((c) => c.relevant === true).length;
      if (!Number.isInteger(s.need) || s.need < 1) err(S, "need must be a positive integer");
      if (rel < s.need) err(S, `only ${rel} relevant clues for need ${s.need}`);
      if (!clues.some((c) => c.relevant === false)) err(S, "needs at least one irrelevant clue");
      const cid = new Set();
      for (const c of clues) {
        if (!nonEmpty(c.id) || cid.has(c.id)) err(S, `bad/duplicate clue id ${c.id}`);
        cid.add(c.id);
        enOnly(`${S} clue ${c.id}`, c.text);
        if (typeof c.relevant !== "boolean") err(S, `clue ${c.id} relevant must be boolean`);
        bi(`${S} clue ${c.id} why`, c.why);
      }
      used.add("Reading");
      break;
    }
    case "choice": {
      bi(`${S} prompt`, s.prompt);
      const opts = s.options || [];
      if (opts.length < 2) err(S, "needs >= 2 options");
      if (!opts.some((o) => o.correct === true)) err(S, "needs a correct option");
      for (const [oi, o] of opts.entries()) {
        enOnly(`${S} option ${oi}`, o.text);
        bi(`${S} option ${oi} feedback`, o.feedback);
        if (typeof o.correct !== "boolean") err(S, `option ${oi} correct must be boolean`);
        if (o.next !== undefined && (!Number.isInteger(o.next) || o.next < 0 || o.next >= count))
          err(S, `option ${oi} next ${o.next} out of range`);
      }
      used.add("Reading");
      break;
    }
    case "order":
      bi(`${S} prompt`, s.prompt);
      if (!Array.isArray(s.items) || s.items.length < 3) err(S, "order needs >= 3 items");
      for (const it of s.items || []) if (!nonEmpty(it?.en)) err(S, "order item needs en");
      used.add("Reading");
      break;
    case "respond": {
      bi(`${S} prompt`, s.prompt);
      if (!["write", "say"].includes(s.mode)) err(S, `bad mode ${s.mode}`);
      used.add(s.mode === "say" ? "Speaking" : "Writing");
      if (!Array.isArray(s.frames) || !s.frames.length || s.frames.some((f) => !nonEmpty(f?.en)))
        err(S, "needs frames [{en}]");
      if (!Array.isArray(s.wordBank) || !s.wordBank.length || s.wordBank.some((w) => !nonEmpty(w)))
        err(S, "needs wordBank");
      enOnly(`${S} model`, s.model);
      const c = s.check;
      if (!isObj(c)) {
        err(S, "needs check");
        break;
      }
      if (!Number.isInteger(c.minWords) || c.minWords < 5)
        err(S, "check.minWords must be an integer >= 5");
      for (const j of c.needConnectors || [])
        if (!CONNECTORS[j]) err(S, `unknown connector job ${j}`);
      if (c.needWords && !Array.isArray(c.needWords)) err(S, "needWords must be an array");
      if (
        c.needAny &&
        (!Array.isArray(c.needAny) || c.needAny.some((g) => !Array.isArray(g) || !g.length))
      )
        err(S, "needAny must be [[...]]");
      if (c.evidenceFrom !== undefined && c.evidenceFrom !== "clues")
        err(S, "evidenceFrom must be 'clues'");
      const modelMiss = unmet(c, s.model?.en);
      if (modelMiss.length) err(S, `model fails its own check: ${modelMiss.join(", ")}`);
      if (!unmet(c, "").length) err(S, "an empty answer passes");
      if (!unmet(c, s.prompt?.en).length) err(S, "a copied prompt passes");
      if (!unmet(c, (s.frames || []).map((f) => f.en).join(" ")).length)
        err(S, "the frames pasted together pass");
      break;
    }
    case "checkpoint":
      bi(S, s.text);
      break;
  }
}

const stats = [];
let total = 0;
for (const f of FILES) {
  const mod = await import(`../access-practice-lab/src/adventures/worlds/${f}.js`);
  const world = mod.default;
  if (!world || world.id !== f) {
    console.error(`FAIL ${f}: default export missing or id mismatch`);
    total++;
    continue;
  }
  const errs = validateWorld(world);
  total += errs.length;
  for (const e of errs) console.error(`FAIL ${e}`);
  const read = { "3-5": [], "6-8": [] };
  let scenes = 0;
  for (const m of world.missions)
    for (const b of BANDS)
      for (const s of m.bands[b] || []) {
        scenes++;
        if (s.kind === "read") read[b].push(words(s.text?.en));
      }
  stats.push(
    `${world.id}: ${world.missions.length} missions, ${scenes} scenes, passages 3-5 [${read["3-5"].join(", ")}] 6-8 [${read["6-8"].join(", ")}]` +
      `\n  ${world.missions.map((m) => `${m.final ? "★ " : ""}${m.title.en}${m.book ? ` (book: ${m.book.templateId})` : ""}`).join(" · ")}`,
  );
}
console.log(stats.join("\n"));
if (total) {
  console.error(`\n${total} problem(s).`);
  process.exit(1);
}
console.log(
  `\nOK: ${FILES.length} worlds pass every schema rule; every model answer passes its own check.`,
);
