#!/usr/bin/env node
/**
 * generate-lesson-novels.mjs  —  Neft Teacher
 * ---------------------------------------------------------------------------
 * Extends the per-UNIT graphic novels down to a finer per-LESSON grain.
 *
 * SINGLE ENGINE (2026 refactor): this generator NO LONGER inlines a second comic
 * engine. It now emits `window.GN_STORY` DATA FILES that the canonical engine
 * (graphic-novels/_engine/gn-engine.{js,css}) + build.py render — exactly like
 * the per-unit novels. That means lesson-grain novels automatically inherit every
 * engine upgrade (TTS, comprehension/reading scoring, misconception tags, vocab
 * popovers, escalating feedback, the Level-0 tier, the nt-results data-score-group
 * contract) with zero duplicate code.
 *
 * Pipeline:
 *   1. node scripts/generate-lesson-novels.mjs            # transform every active group
 *      node scripts/generate-lesson-novels.mjs <groupId>  # one group
 *      → writes graphic-novels/_engine/stories/lesson-<groupId>-{1,2}.story.js
 *   2. Build each emitted story into an offline HTML with the shared engine:
 *      python3 graphic-novels/_engine/build.py \
 *        graphic-novels/_engine/stories/lesson-<groupId>-1.story.js \
 *        graphic-novels/lessons/<groupId>/graphic-novel-1.html \
 *        --artbase ../../_art/lessons/<groupId>/ --home ../../index.html
 *      (build-lesson-novels below prints the exact per-file commands.)
 *
 * The manifest content (math, choices, feedback, Spanish, frames) is authored and
 * hand-verifiable; this transform only maps the manifest shape onto the GN_STORY
 * schema. It never invents numbers. Vocabulary/glossary is pulled live from each
 * lesson's config.json.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LESSONS_DIR = path.join(ROOT, "lessons");
const GN_DIR = path.join(ROOT, "graphic-novels");
const OUT_DIR = path.join(GN_DIR, "lessons");
const STORIES_DIR = path.join(GN_DIR, "_engine", "stories");
const MANIFEST = path.join(OUT_DIR, "manifest.json");

/* ------------------------------------------------------------------ helpers */

function readLesson(id) {
  const file = path.join(LESSONS_DIR, id, "config.json");
  if (!fs.existsSync(file)) {
    throw new Error(`Lesson config not found for "${id}": ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** Merged, de-duplicated glossary for a group from its lessons' vocabulary. */
function buildGlossary(lessons) {
  const seen = new Set();
  const out = [];
  for (const lc of lessons) {
    for (const v of lc.vocabulary || []) {
      const key = (v.term || "").toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({
        ico: "📘",
        en: v.term,
        es: v.termEs || "",
        def: v.definition || "",
      });
    }
  }
  // Engine requires a non-empty glossary; supply a gentle fallback if a group's
  // lessons carry no vocabulary.
  if (!out.length) {
    out.push({
      ico: "📘",
      en: "Word bank",
      es: "banco de palabras",
      def: "Key math words for this mission appear in the story bubbles.",
    });
  }
  return out;
}

/** Synthesize a GN_STORY cast from the distinct speaker display names used in a
 *  novel's dialogue. The protagonist (the reader's stand-in, "Cadet"/"You"-type)
 *  speaks the answer choices; a guide companion voices the misconception; caption
 *  lines (cap:true) come from a narrator. Keys are slugified display names so the
 *  same speaker reuses one cast entry. */
function buildCast(novel) {
  const cast = {};
  const slug = (name) =>
    String(name || "narrator")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 24) || "voice";

  const PROTAGONIST = /(cadet|you|hero|captain|explorer|agent|builder|chef)/i;
  const COMPANION_COLOR = "#3da5ff";
  const PROTAGONIST_COLOR = "#ff8a3d";

  let sawProtagonist = false;
  let sawNarrator = false;

  for (const act of novel.acts || []) {
    const lines = (act.dialogue || []).concat(
      act.interlude ? [act.interlude] : [],
    );
    for (const l of lines) {
      const key = slug(l.who);
      if (cast[key]) continue;
      if (l.cap) {
        cast[key] = { name: l.who, role: "narrator", color: COMPANION_COLOR };
        sawNarrator = true;
      } else if (PROTAGONIST.test(l.who) && !sawProtagonist) {
        cast[key] = {
          name: l.who,
          role: "protagonist",
          color: PROTAGONIST_COLOR,
          avatar: null,
          blurb: "You",
        };
        sawProtagonist = true;
      } else {
        cast[key] = {
          name: l.who,
          role: "companion",
          color: COMPANION_COLOR,
          avatar: null,
        };
      }
    }
  }
  // Guarantee a protagonist exists so choices read as the reader's reply.
  if (!sawProtagonist) {
    cast["you"] = {
      name: "You",
      role: "protagonist",
      color: PROTAGONIST_COLOR,
      avatar: null,
      blurb: "You",
    };
  }
  if (!sawNarrator) {
    cast["log"] = { name: "Mission Log", role: "narrator", color: COMPANION_COLOR };
  }
  return cast;
}

function castKeyFor(cast, displayName, fallback) {
  const slug = String(displayName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
  if (cast[slug]) return slug;
  return fallback;
}

/* ------------------------------------------------- manifest → GN_STORY map */

/** Map one manifest challenge → a GN_STORY "challenge" step. Manifest choices are
 *  `{text, correct}`; GN_STORY choices are `{en, es?, correct}`. The manifest's
 *  single `badEn/badEs` becomes the fallback; the schema's escalating-feedback
 *  fields (`help`, per-choice `why`) are available for later hand-authoring. */
function mapChallenge(ch, stepId) {
  const choices = (ch.choices || []).map((c) => ({
    en: c.text,
    correct: c.correct === true,
  }));
  const step = {
    type: "challenge",
    id: stepId,
    ask: {
      who: "__ASK__", // resolved to a cast key by the caller
      en: ch.prompt,
      es: ch.promptEs || "",
    },
    choices,
    goodEn: ch.goodEn || "✓ Correct!",
    goodEs: ch.goodEs || "",
    badEn: ch.badEn || "Not quite — look back and try again.",
    badEs: ch.badEs || "",
  };
  if (ch.hint) step.hint = { en: ch.hint, es: ch.hintEs || "" };
  if (ch.frame) step.frame = { en: ch.frame, es: ch.frameEs || "" };
  return step;
}

/** Map one manifest act → a GN_STORY act: a beats step (the dialogue) followed by
 *  its 1–2 challenge steps, with the interlude becoming a solveBeat on the first
 *  challenge so the story reads continuously. */
function mapAct(act, idx, cast) {
  const isFinal = act.kind === "final";
  const id = isFinal ? "final" : "act" + (idx + 1);

  // A caption line maps to whatever speaker key was created for its display name
  // (buildCast turns cap:true lines into narrator-role cast entries under that
  // name's slug). Fall back to any narrator-role key, else "you".
  const narratorKey =
    Object.keys(cast).find((k) => cast[k].role === "narrator") || "you";
  const beats = (act.dialogue || []).map((l) => {
    const beat = {
      who: castKeyFor(cast, l.who, l.cap ? narratorKey : "you"),
      en: l.en,
      es: l.es || "",
    };
    if (l.cap) beat.caption = true;
    return beat;
  });

  const steps = [
    {
      type: "beats",
      art: path.basename(act.art || id + ".png"),
      alt: act.artAlt || act.title || "",
      beats: beats.length
        ? beats
        : [{ who: narratorKey, caption: true, en: act.title || "", es: "" }],
    },
  ];

  const ch0 = (act.challenges || [])[0];
  const ch1 = (act.challenges || [])[1];
  if (ch0) {
    const s0 = mapChallenge(ch0, isFinal ? "F" : id + "a");
    // Voice the question with the first companion/protagonist speaker available.
    s0.ask.who = pickAsker(cast);
    if (act.interlude && ch1) {
      s0.solveBeat = {
        who: castKeyFor(cast, act.interlude.who, "you"),
        en: act.interlude.en,
        es: act.interlude.es || "",
      };
    }
    steps.push(s0);
  }
  if (ch1) {
    const s1 = mapChallenge(ch1, isFinal ? "F2" : id + "b");
    s1.ask.who = pickAsker(cast);
    steps.push(s1);
  }

  return {
    id,
    tab: act.tabLabel || act.title,
    kicker: (isFinal ? "Final · " : "Act " + (idx + 1) + " · ") + (act.lessonRef || ""),
    title: act.title,
    advanceLabel: act.advanceLabel || "Continue ▶",
    steps,
  };
}

/** Choose who voices a question: prefer the companion (so the math is a
 *  conversation), else the protagonist, else any speaker. */
function pickAsker(cast) {
  const companion = Object.keys(cast).find((k) => cast[k].role === "companion");
  if (companion) return companion;
  const protagonist = Object.keys(cast).find(
    (k) => cast[k].role === "protagonist",
  );
  return protagonist || Object.keys(cast)[0];
}

/** Map a manifest novel (tier 1 or 2) → a full GN_STORY object. */
function buildStory(group, novel, lessons) {
  const cast = buildCast(novel);
  const acts = (novel.acts || []).map((a, i) => mapAct(a, i, cast));

  const c = novel.complete || {};
  const complete = {
    art: "complete.png",
    alt: c.artAlt || "The hero celebrates a job well done",
    badge: "🎉⭐",
    titleEn: c.heading || "You did it!",
    en: c.text || "",
    es: c.textEs || "",
  };
  if (c.bonus) {
    complete.master = {
      headingEn: "Master Rank Challenge — for mastery, not required.",
      promptEn: c.bonus.prompt,
      promptEs: c.bonus.promptEs || "",
      choices: (c.bonus.choices || []).map((bc) => ({
        en: bc.text,
        correct: bc.correct === true,
      })),
      goodEn: "🏆 <b>Master Rank!</b> Excellent work — you have mastered this skill. ⭐",
      badEn: "❌ Not quite. Review your work and try another option.",
      certifyTitle: "🏆 Master Certified!",
    };
  }

  const cover = novel.cover || {};
  return {
    meta: {
      unit: group.unit,
      version: novel.tier,
      level: novel.levelWord || (novel.tier === 1 ? "Support" : "Enrichment"),
      title: novel.title,
      standard: group.standard || "",
      readingStandard: "RL.6.1",
      assessment:
        "Graphic Novel " +
        group.groupId +
        " #" +
        novel.tier +
        ": " +
        novel.title,
      artBase: `../_art/lessons/${group.groupId}/`,
      home: "../index.html",
    },
    cast,
    cover: {
      art: "cover.png",
      alt: cover.artAlt || novel.title,
      blurbEn: cover.blurb || "",
      blurbEs: cover.blurbEs || "",
      startLabel: cover.startLabel || "Start ▶",
    },
    acts,
    glossary: buildGlossary(lessons),
    complete,
  };
}

/** Serialize a GN_STORY object to a `window.GN_STORY = {...};` data file. */
function serializeStory(story, group, tier) {
  const header =
    `/* STORY · ${group.groupId} · Graphic Novel #${tier} (${story.meta.level})` +
    ` · ${story.meta.title}\n` +
    `   GENERATED from graphic-novels/lessons/manifest.json by\n` +
    `   scripts/generate-lesson-novels.mjs. Do not hand-edit — edit the manifest\n` +
    `   and re-run the generator. Rendered by the shared gn-engine via build.py. */\n`;
  return header + "window.GN_STORY = " + JSON.stringify(story, null, 2) + ";\n";
}

/* ----------------------------------------------------------------- driver */

function transformGroup(group) {
  const lessons = group.lessons.map(readLesson);
  fs.mkdirSync(STORIES_DIR, { recursive: true });
  const written = [];
  for (const novel of group.novels) {
    const story = buildStory(group, novel, lessons);
    const file = path.join(
      STORIES_DIR,
      `lesson-${group.groupId}-${novel.tier}.story.js`,
    );
    fs.writeFileSync(file, serializeStory(story, group, novel.tier), "utf8");
    written.push({ file, tier: novel.tier });
    console.log(`  wrote ${path.relative(ROOT, file)}`);
  }
  return written;
}

/** Print the exact build.py commands so Joel can render the data files to HTML
 *  with the shared engine (matching the per-unit novel layout/depth). */
function printBuildCommands(group, written) {
  for (const w of written) {
    const out = path.join(OUT_DIR, group.groupId, `graphic-novel-${w.tier}.html`);
    console.log(
      `    python3 ${path.relative(ROOT, path.join(GN_DIR, "_engine", "build.py"))} ` +
        `${path.relative(ROOT, w.file)} ${path.relative(ROOT, out)} ` +
        `--artbase ../../_art/lessons/${group.groupId}/ --home ../../index.html`,
    );
  }
}

function main() {
  if (!fs.existsSync(MANIFEST)) {
    console.error(`Manifest not found: ${MANIFEST}`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const only = process.argv[2];
  const groups = (manifest.groups || []).filter((g) => g.generate !== false);
  const target = only ? groups.filter((g) => g.groupId === only) : groups;

  if (only && target.length === 0) {
    console.error(
      `No group with groupId "${only}" (or it is not flagged generate:true).`,
    );
    process.exit(1);
  }

  console.log(
    `Manifest defines ${manifest.groups.length} groups; ${target.length} flagged for generation.`,
  );
  const allBuild = [];
  for (const g of target) {
    console.log(`Group ${g.groupId} — "${g.title}" (lessons ${g.lessons.join(", ")})`);
    const written = transformGroup(g);
    allBuild.push({ group: g, written });
  }
  console.log("\nData files written. Render them to HTML with the shared engine:");
  for (const { group, written } of allBuild) printBuildCommands(group, written);
  console.log("Done.");
}

main();
