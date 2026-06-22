/**
 * Blood on the River — Scene-Prompt Generator
 * -------------------------------------------------------------
 * Reads the 243 authoritative scene records straight from the live site
 * (each chapter page embeds renderChapter({...}) with the scene data),
 * applies the character bible + the rules in generation-rules.md, and
 * writes scene-prompts.json — one literal, character-consistent prompt
 * per scene, with explicit present/absent cast.
 *
 * Run:  node build-prompts.js
 * Out:  scene-prompts.json   (243 entries)
 *
 * NOTE: image generation itself is NOT done here. Feed scene-prompts.json
 * to your image pipeline (see generation-rules.md + the Claude Code prompt).
 */
const fs = require("fs");
const { CHARACTERS, GROUPS, NOT_PEOPLE } = require("./character-bible.js");

const CONFIG = {
  baseUrl: "https://eduwonderlab.com/blood-on-the-river",
  chapters: 27,
  // Where the generated images will live, relative to the site root.
  // {NN}=zero-padded chapter, {nn}=scene number ("01".."09")
  imagePathTemplate: "art/botr/ch{NN}-scene-{nn}.webp",
  style:
    "Realistic historical illustration in a painterly, richly detailed storybook style; muted natural earth-tone palette; period-accurate to 1607–1610 (early Jamestown era); classroom-appropriate for middle-school readers; square 1:1 composition; cinematic natural lighting",
  composition:
    "Clear single focal subject, balanced square composition, mid-shot showing faces and action, period-accurate clothing, environment and objects, no anachronisms",
  negativeBase:
    "text, words, letters, captions, title, watermark, signature, logo, frame, border, modern objects, modern clothing, plastic, contemporary buildings, cars, electric light, extra unrelated people, random background crowd, ghostly figures, symbolic figures, floating heads, surreal elements, collage, graphic gore, blood splatter, wounds, dismemberment, disturbing or frightening imagery, deformed hands, extra fingers, extra limbs, lowres, blurry, jpeg artifacts",
};

// ---------- source fetch + parse ----------
function parseChapter(html) {
  const m = html.indexOf("renderChapter(");
  if (m < 0) throw new Error("renderChapter not found");
  const firstBrace = html.indexOf("{", m);
  const close = html.indexOf(");", firstBrace);
  return JSON.parse(html.slice(firstBrace, html.lastIndexOf("}", close) + 1));
}
async function fetchRecords() {
  const recs = [];
  for (let n = 1; n <= CONFIG.chapters; n++) {
    const html = await fetch(`${CONFIG.baseUrl}/chapter-${n}/`).then((r) => r.text());
    const c = parseChapter(html);
    const sn = c.snapshot || [];
    const get = (l) => { const f = sn.find((x) => x[0] === l); return f ? f[1] : ""; };
    for (const s of c.scenes) {
      recs.push({
        ch: c.chapter, n: s.n, kind: s.kind, title: s.title, page: s.page,
        quote: (s.quote || "").replace(/[“”]/g, '"'), summary: s.summary,
        chSetting: get("Setting"), chWho: get("Who"), chKey: get("Key event"),
        heroArtLabel: c.heroArtLabel || "",
      });
    }
  }
  return recs;
}

// ---------- cast detection ----------
function neutralizeExcludes(text, excludes) {
  let t = text;
  for (const ex of excludes || []) t = t.replace(new RegExp(ex, "gi"), " ");
  return t;
}
function mentions(text, aliases) {
  return (aliases || []).some((a) =>
    new RegExp("\\b" + a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(text)
  );
}
const ABSENT_PATTERNS = [
  (nm) => new RegExp("before\\s+" + nm + "\\s+(ever\\s+|even\\s+)?(appears?|arrives?|comes?|enters?|is born|shows up|reaches)", "i"),
  (nm) => new RegExp(nm + "\\s+(does not|doesn't|did not|didn't|has not|hasn't|is not|isn't|will not|won't)\\s+\\w*\\s*(appear|arrive|come|return|show)", "i"),
  (nm) => new RegExp(nm + "\\s+(is|was)\\s+(away|gone|absent|missing|not present)", "i"),
  (nm) => new RegExp("without\\s+" + nm + "\\b", "i"),
  (nm) => new RegExp("(in|during)\\s+" + nm + "['’]s\\s+absence", "i"),
];
function detectCast(rec) {
  const text = [rec.title, rec.summary, rec.quote].join("  ");
  const present = [];
  const absent = [];
  for (const key in CHARACTERS) {
    const ch = CHARACTERS[key];
    const cleaned = neutralizeExcludes(text, ch.exclude);
    if (!mentions(cleaned, ch.aliases)) continue;
    // present unless an absence pattern fires for one of its aliases
    let isAbsent = false;
    for (const a of ch.aliases) {
      for (const pf of ABSENT_PATTERNS) {
        if (pf(a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(cleaned)) { isAbsent = true; break; }
      }
      if (isAbsent) break;
    }
    (isAbsent ? absent : present).push(key);
  }
  // groups (collective casts) — only as secondary background
  const groups = [];
  for (const g in GROUPS) {
    if (mentions(text, GROUPS[g].aliases)) groups.push(g);
  }
  return { present, absent, groups };
}

// ---------- setting inference (scene facts override chapter context) ----------
const LOC_RULES = [
  [/prophecy|Chesapeake/i, "the quiet wooded shore of the Chesapeake Bay in Tidewater Virginia, long before any English ships arrive, morning light"],
  [/pawnshop|three gold balls|beaver felt/i, "inside a dim, cluttered early-1600s London pawnshop lit by candlelight"],
  [/London Bridge/i, "on crowded old London Bridge, lined with leaning timber houses, 1607"],
  [/jail|prison|cell|gaol|dungeon/i, "in a grim, cramped stone London jail cell, 1607"],
  [/gallows|gibbet|hang(ed|ing)?|noose/i, "beside a rough wooden gallows"],
  [/cobblestone|alley|street|run.*London|barefoot.*London/i, "on a dark, wet cobbled London street at night, 1607"],
  [/docks?|wharf|quay|Thames/i, "at the busy London docks on the river Thames, wooden ships moored, 1607"],
  [/orphan|poorhouse|poor house/i, "outside a bleak London poorhouse, 1607"],
  [/'tween deck|below deck|belowdecks|in the hold|cramped.*deck|crowded.*deck/i, "in the cramped, dark below-deck ('tween deck) of a small wooden ship, crowded with passengers, barrels and hammocks"],
  [/storm|tempest|gale|high waves|lightning/i, "in a violent storm at sea — dark clouds, driving rain and towering waves around a small wooden ship"],
  [/(on )?deck|aboard|rigging|mast|sail|set sail|voyage|crossing/i, "on the wooden deck of a small 1607 English sailing ship at sea, rigging and canvas sails overhead"],
  [/open (sea|ocean)|blue (sea|ocean|water)|Atlantic/i, "the open Atlantic Ocean seen from the deck of a wooden ship"],
  [/Dominica|Caribbean|island|Nevis|tropical/i, "a lush green Caribbean island shore, the English fleet anchored offshore under bright sun"],
  [/longhouse|Werowocomoco|Powhatan('s)? (village|capital|town)|mats|woven mat/i, "inside a Powhatan longhouse at Werowocomoco, woven-reed-mat walls and a low fire"],
  [/forest|woods|woodland|hunt|trees|wilderness/i, "in the dense Tidewater Virginia woodland of tall trees and underbrush"],
  [/palisade|fort|stockade|wall.*timber|triangular fort/i, "inside the triangular wooden palisade fort of James Town, Virginia"],
  [/James River|up ?river|down ?river|canoe|paddl|the river/i, "on the wide, forested James River in Virginia, calm brown water"],
  [/Point Comfort/i, "at Point Comfort, a small fortified English outpost at the mouth of the James River"],
  [/James ?Town|settlement|camp|clearing|colony/i, "the rough early James Town settlement — a clearing of tents and half-built timber shelters beside the river"],
];
function settingPhrase(rec) {
  const hay = [rec.summary, rec.title, rec.quote].join("  ");
  for (const [re, phrase] of LOC_RULES) if (re.test(hay)) return phrase;
  if (rec.chSetting) return rec.chSetting.replace(/\s+/g, " ").trim();
  return rec.heroArtLabel || "an early-1600s historical setting";
}

// ---------- prompt assembly ----------
function castDescriptors(present, groups) {
  const parts = present.map((k) => CHARACTERS[k].descriptor);
  for (const g of groups) {
    // only add a group if it isn't already represented by a named member
    parts.push(GROUPS[g].descriptor);
  }
  return parts;
}
function cleanSummary(s) {
  // strip pedagogical / meta phrasing that isn't visual
  let t = s
    .replace(/\bbefore\s+\w+\s+(ever\s+|even\s+)?(appears?|arrives?|comes?|enters?|describes?|narrates?|is born|shows up)[^.;]*[,.;]?/gi, "")
    .replace(/\b(readers?|students?)\s+(learn|see|notice|track|understand)[^.]*\.?/gi, "")
    .replace(/\bthe (epigraph|chapter|narration)[^.]*\.?/gi, "")
    .replace(/\bThe novel opens with\b/gi, "The scene shows")
    .replace(/\bthis (scene|chapter|framing device|quote)\b/gi, "the moment")
    .replace(/\s+([,.;])/g, "$1")
    .replace(/[,;]\s*$/,".")
    .replace(/\s{2,}/g, " ")
    .trim();
  if(!/[.!?]$/.test(t)) t += ".";
  return t;
}
function buildPrompt(rec, cast) {
  const setting = settingPhrase(rec);
  const figures = castDescriptors(cast.present, cast.groups);
  const figuresLine = figures.length
    ? "Figures in frame: " + figures.join("; ") + "."
    : "No named people in frame; show only the setting and objects described.";
  const moment = "Depict this exact moment: " + cleanSummary(rec.summary);
  const prompt = [
    CONFIG.style + ".",
    moment,
    "Setting: " + setting + ".",
    figuresLine,
    CONFIG.composition + ".",
  ].join(" ");
  const absentNames = cast.absent.map((k) => CHARACTERS[k].name);
  const negative =
    CONFIG.negativeBase +
    (absentNames.length ? ", " + absentNames.map((n) => "do not depict " + n).join(", ") : "");
  return { prompt, negative };
}
function imagePath(rec) {
  return CONFIG.imagePathTemplate
    .replace("{NN}", String(rec.ch).padStart(2, "0"))
    .replace("{nn}", rec.n);
}

// ---------- main ----------
(async () => {
  const recs = await fetchRecords();
  const out = recs.map((rec) => {
    const cast = detectCast(rec);
    const { prompt, negative } = buildPrompt(rec, cast);
    return {
      id: `ch${String(rec.ch).padStart(2, "0")}-s${rec.n}`,
      chapter: rec.ch,
      scene: rec.n,
      kind: rec.kind,
      title: rec.title,
      page: rec.page,
      quote: rec.quote,
      summary: rec.summary,
      setting: settingPhrase(rec),
      charactersPresent: cast.present.map((k) => CHARACTERS[k].name),
      charactersAbsent: cast.absent.map((k) => CHARACTERS[k].name),
      groupsPresent: cast.groups,
      image: imagePath(rec),
      prompt,
      negativePrompt: negative,
    };
  });
  fs.writeFileSync("scene-prompts.json", JSON.stringify(out, null, 2));
  console.log("Wrote scene-prompts.json with", out.length, "scenes.");
})();
