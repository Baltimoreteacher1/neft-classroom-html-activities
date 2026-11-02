// Moby avatar and learning environment: a data model, sanitizer, unlock rules and an original inline-SVG renderer.
//
// Identity is never gated: every skin tone, hair style and colour, the first outfits and the Meadow are free. What can
// be earned is accessories, special outfits, companions and learning environments, and each is earned by LEARNING
// (a milestone, a sticker, a rank, a pet hatched in Spell Duel) or, for the existing shop items, bought with the coins
// the Lab already gives for game stars. Nothing here is bought with, or speeds up, practice volume.
//
// Existing buddy items (buddy-items.js ITEMS and SHOP) keep their ids and slots (hat / face / back); this module derives
// an `unlockedBy` descriptor for each from its `unlock` field, so nothing in buddy-items.js had to change.
import { t } from "../i18n.js";
import { ITEMS } from "../buddy-items.js";
import { PETS } from "../duel-data.js";
import { earnedIds, rankIndex, summarize } from "../rewards.js";
import { profileKey, profiles, readLocal, writeLocal } from "../school-tools.js";
import {
  BACKS,
  COMPANIONS,
  ENVIRONMENTS,
  FACES,
  HAIR_COLORS,
  HAIR_STYLES,
  HATS,
  OUTFITS,
  OUTFIT_COLORS,
  SELF_COLORED,
  SKIN_TONES,
  hairBack,
  hairFront,
  mixHex,
} from "./avatar-art.js";
import { earnedMilestoneIds, milestoneTitle, milestones } from "./journey.js";

export const AVATAR_KEY = "ewl-fluency-moby-avatar-v1";
export const LOOKS = Object.freeze(["chunky", "character", "emblem"]);
export const lookForGrade = (grade) =>
  Number(grade) <= 2 ? "chunky" : Number(grade) <= 5 ? "character" : "emblem";

// Per-look geometry. r = head radius in px, cy = head centre, bw = torso half-width in head units, sw = outline in px.
const SHAPES = {
  chunky: {
    r: 34,
    cy: 54,
    bw: 30,
    sw: 4,
    neck: false,
    blush: true,
    brows: false,
    mute: false,
    pet: [94, 98, 1],
  },
  character: {
    r: 27,
    cy: 46,
    bw: 34,
    sw: 3,
    neck: true,
    blush: false,
    brows: true,
    mute: false,
    pet: [95, 100, 0.95],
  },
  emblem: {
    r: 21,
    cy: 54,
    bw: 38,
    sw: 2,
    neck: true,
    blush: false,
    brows: true,
    mute: true,
    pet: [92, 96, 0.8],
  },
};

const FREE_OUTFITS = ["tee", "hoodie", "overalls"];
const OUTFIT_NAMES = {
  tee: "T-shirt",
  hoodie: "Hoodie",
  overalls: "Overalls",
  labcoat: "Lab coat",
  vest: "Explorer vest",
  apron: "Fixer's apron",
  scarf: "Cozy scarf",
  sash: "Gold sash",
};
const ENV_NAMES = {
  meadow: "Meadow",
  library: "Library",
  workshop: "Workshop",
  observatory: "Observatory",
  garden: "Garden",
  harbor: "Harbor",
};
const HAIR_NAMES = {
  short: "Short",
  long: "Long",
  curly: "Curly",
  bun: "Bun",
  braids: "Braids",
  afro: "Big curls",
  none: "No hair",
};
export const COMPANION_IDS = Object.freeze(["buddy", ...PETS.map((pet) => pet.id)]);

// Earnable parts that are not buddy items. `by` is the unlockedBy descriptor.
const EARNABLE = [
  {
    id: "labcoat",
    slot: "outfit",
    name: OUTFIT_NAMES.labcoat,
    by: { type: "milestone", id: "mastered:1" },
  },
  {
    id: "vest",
    slot: "outfit",
    name: OUTFIT_NAMES.vest,
    by: { type: "milestone", id: "proficient:3" },
  },
  {
    id: "apron",
    slot: "outfit",
    name: OUTFIT_NAMES.apron,
    by: { type: "milestone", id: "repaired:1" },
  },
  {
    id: "scarf",
    slot: "outfit",
    name: OUTFIT_NAMES.scarf,
    by: { type: "milestone", id: "explained:5" },
  },
  {
    id: "sash",
    slot: "outfit",
    name: OUTFIT_NAMES.sash,
    by: { type: "milestone", id: "proficient:10" },
  },
  {
    id: "library",
    slot: "environment",
    name: ENV_NAMES.library,
    by: { type: "milestone", id: "mastered:1" },
  },
  {
    id: "workshop",
    slot: "environment",
    name: ENV_NAMES.workshop,
    by: { type: "milestone", id: "repaired:1" },
  },
  {
    id: "observatory",
    slot: "environment",
    name: ENV_NAMES.observatory,
    by: { type: "milestone", id: "proficient:6" },
  },
  {
    id: "garden",
    slot: "environment",
    name: ENV_NAMES.garden,
    by: { type: "milestone", id: "quests:5" },
  },
  {
    id: "harbor",
    slot: "environment",
    name: ENV_NAMES.harbor,
    by: { type: "milestone", id: "mastered:5" },
  },
  ...PETS.map((pet) => ({
    id: pet.id,
    slot: "companion",
    name: pet.name,
    by: { type: "pet", id: pet.id },
  })),
];

// unlockedBy for an existing buddy item, read from its `unlock` field (sticker, rank or coins).
export const unlockedByOf = (item) =>
  "sticker" in item.unlock
    ? { type: "sticker", id: item.unlock.sticker }
    : "coins" in item.unlock
      ? { type: "purchase", coins: item.unlock.coins }
      : { type: "rank", rank: item.unlock.rank };

export const UNLOCKABLES = Object.freeze([
  ...ITEMS.map((item) => ({
    id: item.id,
    slot: item.slot,
    name: item.name,
    hint: item.hint,
    by: unlockedByOf(item),
  })),
  ...EARNABLE,
]);
const SLOT_OF = Object.fromEntries(UNLOCKABLES.map((entry) => [entry.id, entry.slot]));

export const AVATAR_PARTS = Object.freeze({
  skins: Object.keys(SKIN_TONES).map((id, index) => ({ id, hex: SKIN_TONES[id], n: index + 1, name: "Skin tone {n}" })),
  hairStyles: HAIR_STYLES.map((id) => ({ id, name: HAIR_NAMES[id] })),
  hairColors: Object.keys(HAIR_COLORS).map((id) => ({
    id,
    hex: HAIR_COLORS[id],
    name: id[0].toUpperCase() + id.slice(1),
  })),
  outfitColors: Object.keys(OUTFIT_COLORS).map((id) => ({
    id,
    hex: OUTFIT_COLORS[id],
    name: id[0].toUpperCase() + id.slice(1),
  })),
  outfits: Object.keys(OUTFITS).map((id) => ({
    id,
    name: OUTFIT_NAMES[id],
    free: FREE_OUTFITS.includes(id),
  })),
  companions: ["", ...COMPANION_IDS],
  environments: Object.keys(ENVIRONMENTS).map((id) => ({
    id,
    name: ENV_NAMES[id],
    free: id === "meadow",
  })),
});

// ---- model -----------------------------------------------------------------------------------------------------------
// New avatars start from what the learner already wears on their buddy (when still earned), else nothing.
export function defaultAvatar(grade = 4, rewards = null) {
  const buddy = rewards?.buddy || {};
  const wear = (slot) =>
    ITEMS.some((item) => item.slot === slot && item.id === buddy[slot]) ? buddy[slot] : "";
  return {
    look: lookForGrade(grade),
    skin: "tone3",
    hair: { style: "short", color: "brown" },
    outfit: { id: "tee", color: "teal" },
    hat: wear("hat"),
    face: wear("face"),
    back: wear("back"),
    companion: "",
    environment: "meadow",
  };
}

// Accepts a Set, an array of ids, or the list returned by unlocks(); anything else owns nothing.
export function earnedSet(earned) {
  if (earned instanceof Set) return earned;
  if (!Array.isArray(earned)) return new Set();
  return new Set(
    earned
      .map((entry) =>
        entry && typeof entry === "object" ? (entry.earned ? entry.id : null) : entry,
      )
      .filter((id) => typeof id === "string"),
  );
}

const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);

// Sanitizer. Unknown parts fall back to the default; a gated part the learner has not earned (not in `earned`) is dropped.
// With no `earned` argument every gated part is dropped, so a hand-edited or restored save can never wear unearned items.
export function cleanAvatar(saved, earned = null, { grade = 4 } = {}) {
  const base = defaultAvatar(grade);
  const own = earnedSet(earned);
  const src = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  const gated = (slot, id) =>
    typeof id === "string" && SLOT_OF[id] === slot && own.has(id) ? id : "";
  const outfitId = src.outfit?.id;
  const outfitOk =
    FREE_OUTFITS.includes(outfitId) ||
    (typeof outfitId === "string" && SLOT_OF[outfitId] === "outfit" && own.has(outfitId));
  const envId = src.environment;
  return {
    look: pick(src.look, LOOKS, base.look),
    skin: pick(src.skin, Object.keys(SKIN_TONES), base.skin),
    hair: {
      style: pick(src.hair?.style, HAIR_STYLES, base.hair.style),
      color: pick(src.hair?.color, Object.keys(HAIR_COLORS), base.hair.color),
    },
    outfit: {
      id: outfitOk ? outfitId : base.outfit.id,
      color: pick(src.outfit?.color, Object.keys(OUTFIT_COLORS), base.outfit.color),
    },
    hat: gated("hat", src.hat),
    face: gated("face", src.face),
    back: gated("back", src.back),
    companion: src.companion === "buddy" ? "buddy" : gated("companion", src.companion),
    environment: envId === "meadow" ? "meadow" : gated("environment", envId) || "meadow",
  };
}

const storeKey = (id = profiles().active) => profileKey(AVATAR_KEY, id);
export const loadAvatar = (earned, { grade = 4, id } = {}) =>
  cleanAvatar(readLocal(storeKey(id), null), earned, { grade });
export const saveAvatar = (avatar, earned, { grade = 4, id } = {}) =>
  writeLocal(storeKey(id), cleanAvatar(avatar, earned, { grade }));

// ---- unlocks ---------------------------------------------------------------------------------------------------------
const howText = (entry) => {
  const by = entry.by;
  if (by.type === "milestone")
    return t("Reach the milestone: {title}", { title: milestoneTitle(by.id) });
  if (by.type === "pet") return t("Hatch this pet in Spell Duel");
  return t(entry.hint);
};

// unlocks(tutor, rewards, ctx?) -> every earnable part with whether it is earned and by what.
// ctx: { grade, now, stats (quests questStats()), log (growth log), summary (rewards summarize()) }. Milestones that need
// evidence the caller did not pass (quest stats, growth log) stay locked rather than guessed.
export function unlocks(tutor, rewards, ctx = {}) {
  const now = ctx.now ?? Date.now();
  const summary = ctx.summary || summarize({ stations: {}, facts: {} }, rewards);
  const stickers = new Set(earnedIds(summary));
  const rank = rankIndex(summary);
  const bought = new Set(rewards?.shop || []);
  const pets = rewards?.duel?.pets || {};
  const done = new Set(
    earnedMilestoneIds(milestones(tutor, ctx.grade ?? 4, now, { stats: ctx.stats, log: ctx.log })),
  );
  const has = (by, id) =>
    by.type === "sticker"
      ? stickers.has(by.id)
      : by.type === "rank"
        ? rank >= by.rank
        : by.type === "purchase"
          ? bought.has(id)
          : by.type === "milestone"
            ? done.has(by.id)
            : by.type === "pet"
              ? by.id in pets
              : false;
  return UNLOCKABLES.map((entry) => ({
    id: entry.id,
    slot: entry.slot,
    name: t(entry.name),
    earned: has(entry.by, entry.id),
    free: false,
    unlockedBy: entry.by,
    how: howText(entry),
  }));
}

// ---- rendering -------------------------------------------------------------------------------------------------------
const partName = (slot, id) =>
  slot === "outfit"
    ? OUTFIT_NAMES[id]
    : slot === "environment"
      ? ENV_NAMES[id]
      : slot === "companion"
        ? id === "buddy"
          ? "Buddy"
          : PETS.find((pet) => pet.id === id)?.name
        : UNLOCKABLES.find((entry) => entry.id === id)?.name;
export function avatarLabel(avatar) {
  const a = cleanLook(avatar);
  const worn = [
    ["outfit", a.outfit.id],
    ["hat", a.hat],
    ["face", a.face],
    ["back", a.back],
    ["companion", a.companion],
    ["environment", a.environment],
  ]
    .filter(([, id]) => id)
    .map(([slot, id]) => t(partName(slot, id) || id));
  return `${t("Your avatar")}: ${worn.join(", ")}`;
}

export const SLOT_LABELS = Object.freeze({ skin: "Skin", hair: "Hair", outfit: "Outfit", hat: "Hat", face: "Face", back: "Back", companion: "Companion", environment: "Environment" });
export const slotLabel = (slot) => t(SLOT_LABELS[slot] || slot);
// Translated display name of one part, for the pickers: partLabel("hat", "crown"), partLabel("hairStyle", "curly").
export const partLabel = (slot, id) => {
  if (slot === "skin") return t("Skin tone {n}", { n: Object.keys(SKIN_TONES).indexOf(id) + 1 });
  if (slot === "hairStyle") return t(HAIR_NAMES[id] || id);
  if (slot === "hairColor" || slot === "outfitColor") return t(id[0].toUpperCase() + id.slice(1));
  return t(partName(slot, id) || id);
};

// Same shape as cleanAvatar without the ownership check: renders exactly what it is given, ignoring unknown ids.
function cleanLook(avatar) {
  const src = avatar && typeof avatar === "object" ? avatar : {};
  const base = defaultAvatar(4);
  return {
    look: pick(src.look, LOOKS, base.look),
    skin: pick(src.skin, Object.keys(SKIN_TONES), base.skin),
    hair: {
      style: pick(src.hair?.style, HAIR_STYLES, "short"),
      color: pick(src.hair?.color, Object.keys(HAIR_COLORS), "brown"),
    },
    outfit: {
      id: pick(src.outfit?.id, Object.keys(OUTFITS), "tee"),
      color: pick(src.outfit?.color, Object.keys(OUTFIT_COLORS), "teal"),
    },
    hat: HATS[src.hat] ? src.hat : "",
    face: FACES[src.face] ? src.face : "",
    back: BACKS[src.back] ? src.back : "",
    companion: COMPANIONS[src.companion] ? src.companion : "",
    environment: pick(src.environment, Object.keys(ENVIRONMENTS), "meadow"),
  };
}

const INK = "#17324D";
const hashOf = (text) => {
  let h = 5381;
  for (const char of text) h = ((h * 33) ^ char.charCodeAt(0)) >>> 0;
  return h.toString(36);
};
const esc = (text) =>
  String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// avatarSVG(avatar, size = 96) -> an inline <svg> string (original art, no emoji). Grades 1-2 are chunky and friendly,
// 3-5 character-driven, 6-8 an understated emblem: a muted badge showing the avatar from the shoulders up.
export function avatarSVG(avatar, size = 96) {
  const a = cleanLook(avatar);
  const shape = SHAPES[a.look];
  const px = Math.max(24, Math.min(512, Math.round(Number(size) || 96)));
  const s = shape.r / 28;
  const id = `mq-av-${hashOf(`${JSON.stringify(a)}|${px}`)}`;
  const skin = SKIN_TONES[a.skin];
  const tone = (hex) => (shape.mute ? mixHex(hex, "#8A94A3", 0.25) : hex);
  const hair = tone(HAIR_COLORS[a.hair.color]);
  const coat = tone(OUTFIT_COLORS[a.outfit.color]);
  const stroke = `stroke="${INK}" stroke-width="${shape.sw / s}" stroke-linejoin="round"`;
  const place = (inner) => `<g transform="translate(60 ${shape.cy}) scale(${s})">${inner}</g>`;
  const bw = shape.bw;
  const torso = `<path d="M-${bw} 100V44Q-${bw} 30 -20 30H20Q${bw} 30 ${bw} 44V100Z" fill="${SELF_COLORED.has(a.outfit.id) ? "#F4F7FA" : coat}" ${stroke}/>${OUTFITS[a.outfit.id](coat)}`;
  const neck = shape.neck
    ? `<rect x="-7" y="18" width="14" height="16" fill="${skin}" ${stroke}/>`
    : "";
  const eyes =
    '<circle cx="-10" cy="-2" r="4.2" fill="#13233A"/><circle cx="10" cy="-2" r="4.2" fill="#13233A"/><circle cx="-8.8" cy="-3.4" r="1.3" fill="#fff"/><circle cx="11.2" cy="-3.4" r="1.3" fill="#fff"/>';
  const brows = shape.brows
    ? '<path d="M-15 -11Q-10 -14 -5 -11M5 -11Q10 -14 15 -11" fill="none" stroke="#13233A" stroke-width="2" stroke-linecap="round"/>'
    : "";
  const mouth =
    a.look === "chunky"
      ? '<path d="M-10 10Q0 25 10 10Z" fill="#13233A"/><path d="M-5 16Q0 20 5 16" fill="#D0674F"/>'
      : '<path d="M-8 11Q0 19 8 11" fill="none" stroke="#13233A" stroke-width="2.6" stroke-linecap="round"/>';
  const blush = shape.blush
    ? '<circle cx="-18" cy="8" r="4" fill="#E58A7B" fill-opacity=".55"/><circle cx="18" cy="8" r="4" fill="#E58A7B" fill-opacity=".55"/>'
    : "";
  const head = `<circle cx="-28" cy="2" r="5" fill="${skin}" ${stroke}/><circle cx="28" cy="2" r="5" fill="${skin}" ${stroke}/><circle r="28" fill="${skin}" ${stroke}/>${eyes}${brows}${mouth}${blush}`;
  const pet = a.companion
    ? `<g transform="translate(${shape.pet[0]} ${shape.pet[1]}) scale(${shape.pet[2]})">${COMPANIONS[a.companion]}</g>`
    : "";
  const frame =
    a.look === "emblem"
      ? `<circle cx="60" cy="60" r="58" fill="none" stroke="${INK}" stroke-width="3"/>`
      : `<rect x="1.5" y="1.5" width="117" height="117" rx="14" fill="none" stroke="${INK}" stroke-width="3"/>`;
  const clip =
    a.look === "emblem"
      ? '<circle cx="60" cy="60" r="58"/>'
      : '<rect x="1.5" y="1.5" width="117" height="117" rx="14"/>';
  const label = esc(avatarLabel(a));
  return `<svg class="mq-avatar mq-avatar--${a.look}" viewBox="0 0 120 120" width="${px}" height="${px}" role="img" aria-label="${label}" focusable="false"><title>${label}</title><defs><clipPath id="${id}">${clip}</clipPath></defs><g clip-path="url(#${id})">${ENVIRONMENTS[a.environment]}${a.back ? place(BACKS[a.back]) : ""}${place(`${hairBack(a.hair.style, hair)}${neck}${torso}${head}${hairFront(a.hair.style, hair)}${a.face ? FACES[a.face] : ""}${a.hat ? HATS[a.hat] : ""}`)}${pet}</g>${frame}</svg>`;
}
