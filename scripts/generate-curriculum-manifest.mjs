#!/usr/bin/env node
/**
 * Curriculum Manifest Generator
 * --------------------------------------------------------------------------
 * Builds data/curriculum-manifest.json — the single source of truth for the
 * curriculum hub audit/badge system. One entry per lesson, derived from each
 * lessons/<id>/config.json plus on-disk resource existence checks.
 *
 * This file is GENERATED. Do not hand-edit data/curriculum-manifest.json;
 * edit a lesson's config.json (or the support-page generator) and re-run:
 *   node scripts/generate-curriculum-manifest.mjs
 *
 * It never writes into a lesson folder and never deletes anything.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const lessonsDir = join(root, "lessons");
const dataDir = join(root, "data");

const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

/** True if path (relative to repo root) exists and (for files) is non-empty. */
function present(...parts) {
  const p = join(root, ...parts);
  if (!existsSync(p)) return false;
  try {
    const st = statSync(p);
    if (st.isFile()) return st.size > 0;
    // a directory "exists" as a route if it has an index.html
    return existsSync(join(p, "index.html"));
  } catch {
    return false;
  }
}

/** Build the resources map for a lesson, with the route/path each would live at. */
function resourcesFor(id) {
  const dl = (suffix) => `lessons/${id}/downloads/${id}-${suffix}`;
  const res = {
    lesson: { path: `/lessons/${id}/`, file: `lessons/${id}/index.html`, applicable: true },
    guidedNotes: {
      path: `/lessons/${id}/notes.html`,
      file: `lessons/${id}/notes.html`,
      applicable: true,
    },
    guidedNotesPdf: {
      path: `/lessons/${id}/downloads/${id}-notes.pdf`,
      file: dl("notes.pdf"),
      applicable: true,
    },
    guidedNotesDocx: {
      path: `/lessons/${id}/downloads/${id}-notes.docx`,
      file: dl("notes.docx"),
      applicable: true,
    },
    handout: {
      path: `/lessons/${id}/handout.html`,
      file: `lessons/${id}/handout.html`,
      applicable: true,
    },
    /* The print practice sheet (Version A + Version B), written by
       generate-worksheets.mjs. It existed on disk for all 84 lessons and was
       named by no resource key at all, so every surface that asks the manifest
       what a lesson ships — the hub's lesson picker included — could not offer
       it. The sibling worksheet-answer-key.html is deliberately NOT a key here:
       `answer-key` is what marks a teacher surface. */
    worksheet: {
      path: `/lessons/${id}/worksheet.html`,
      file: `lessons/${id}/worksheet.html`,
      applicable: true,
    },
    /* Set B — the second practice form, for re-teach, homework, a retake or day
       two. Same reason it needs a key as `worksheet` above: a sheet the manifest
       does not name is a sheet the lesson picker cannot offer, however live it
       is. Its answer key is excluded for the same reason as Set A's. */
    worksheet2: {
      path: `/lessons/${id}/worksheet-2.html`,
      file: `lessons/${id}/worksheet-2.html`,
      applicable: true,
    },
    /* The printable MSTAR-style practice worksheet (generate-mstar-worksheets.mjs)
       — the per-lesson rehearsal of the state test's question formats. Same
       rule as worksheet/worksheet2: a sheet the manifest does not name is a
       sheet the lesson picker cannot offer. Only the 72 lessons that author
       mstarPractice items have one (units 1 and 10 do not), so presence is the
       file on disk. Its answer key is excluded like Set A's and Set B's. */
    mstarWorksheet: {
      path: `/lessons/${id}/mstar-worksheet.html`,
      file: `lessons/${id}/mstar-worksheet.html`,
      applicable: true,
    },
    homework: {
      path: `/lessons/${id}/homework.html`,
      file: `lessons/${id}/homework.html`,
      applicable: true,
    },
    homeworkDocx: {
      path: `/lessons/${id}/homework.docx`,
      file: `lessons/${id}/homework.docx`,
      applicable: true,
    },
    slides: {
      path: `/lessons/${id}/slides.html`,
      file: `lessons/${id}/slides.html`,
      applicable: true,
    },
    familyPage: {
      path: `/lessons/${id}/family/`,
      file: `lessons/${id}/family/index.html`,
      applicable: true,
    },
    teacherNotes: {
      path: `/lessons/${id}/teacher-notes/`,
      file: `lessons/${id}/teacher-notes/index.html`,
      applicable: true,
    },
    studentHelp: {
      path: `/lessons/${id}/student-help/`,
      file: `lessons/${id}/student-help/index.html`,
      applicable: true,
    },
    exitTicket: {
      path: `/lessons/${id}/#reflect`,
      file: `lessons/${id}/index.html`,
      applicable: true,
      inline: true,
    },
  };

  if (present(`lessons/${id}/bundle/interactive.html`)) {
    res.studentPractice = {
      path: `/lessons/${id}/bundle/student-practice.md`,
      file: `lessons/${id}/bundle/student-practice.md`,
      applicable: true,
    };
    res.printablePacket = {
      path: `/lessons/${id}/bundle/sub-packet.html`,
      file: `lessons/${id}/bundle/sub-packet.html`,
      applicable: true,
    };
    res.activityPack = {
      path: `/lessons/${id}/bundle/activity-pack.html`,
      file: `lessons/${id}/bundle/activity-pack.html`,
      applicable: true,
    };
    res.subPlan = {
      path: `/lessons/${id}/bundle/sub-packet.html`,
      file: `lessons/${id}/bundle/sub-packet.html`,
      applicable: true,
    };
    res.interactive = {
      path: `/lessons/${id}/bundle/interactive.html`,
      file: `lessons/${id}/bundle/interactive.html`,
      applicable: true,
    };
  }

  return res;
}

function vocabTerms(cfg) {
  if (!Array.isArray(cfg.vocabulary)) return [];
  return cfg.vocabulary.map((v) => v.term).filter(Boolean);
}

function arcadeFor(cfg) {
  const projects = Array.isArray(cfg.projects) ? cfg.projects : [];
  const project = projects.find((item) => {
    const href = String(item?.href ?? "").split(/[?#]/)[0];
    return (
      /^\/(?!\/)/.test(href) &&
      /\/(?:games?(?:\/|$)|[^/]*game(?:\/|\.html|$))/i.test(href) &&
      !/graphic-novels|\/games\/3d\//i.test(href) &&
      present(href.slice(1))
    );
  });
  if (!project) return null;
  return {
    title: String(project.title ?? "Lesson arcade")
      .trim()
      .slice(0, 120),
    description: String(project.desc ?? "")
      .trim()
      .slice(0, 240),
    path: String(project.href).trim().slice(0, 240),
    emoji: String(project.emoji ?? "🎮")
      .trim()
      .slice(0, 8),
  };
}

const DEFAULT_SENTENCE_FRAMES = [
  "I know ___ because ___.",
  "First, I ___. Then, I ___.",
  "The answer is ___, so ___.",
];

function buildEntry(id, cfg) {
  const m = id.match(LESSON_DIR_RE);
  const unit = cfg.unit ?? Number(m[1]);
  const lesson = cfg.lesson ?? Number(m[2]);
  const resources = resourcesFor(id);

  // Resolve existence for each resource.
  const resolved = {};
  const missingResources = [];
  for (const [key, r] of Object.entries(resources)) {
    if (r.inline) {
      // Inline resources (exit ticket) live inside config, not a file.
      const ok = key === "exitTicket" ? Boolean(cfg.reflect?.exitTicket) : present(r.file);
      resolved[key] = { ...r, exists: ok };
      if (!ok) missingResources.push(key);
      continue;
    }
    const ok = present(r.file);
    resolved[key] = { ...r, exists: ok };
    if (!ok) missingResources.push(key);
  }

  const standard = cfg.standard || "";
  const needsReview = !standard || /needs review/i.test(standard);

  return {
    id,
    unit,
    lesson,
    title: cfg.title || id,
    flagship: id.endsWith("-flagship"),
    standard: standard || "Needs Review",
    topic: cfg.theme || "",
    objective: cfg.contentObjective || "",
    languageObjective: cfg.languageObjective || "",
    lessonPath: `/lessons/${id}/`,
    arcade: arcadeFor(cfg),
    timeEstimate: cfg.timeEstimate || "",
    resources: resolved,
    supports: {
      esol: Array.isArray(cfg.vocabulary) && cfg.vocabulary.some((v) => v.definitionEs || v.termEs),
      vocabulary: vocabTerms(cfg),
      sentenceFrames: DEFAULT_SENTENCE_FRAMES,
    },
    status: {
      ready: missingResources.length === 0 && !needsReview,
      needsReview,
      missingResources,
      protectedResources: [],
      brokenLinks: [],
    },
  };
}

function main() {
  const ids = readdirSync(lessonsDir)
    .filter((d) => LESSON_DIR_RE.test(d))
    .filter((d) => existsSync(join(lessonsDir, d, "config.json")))
    .sort((a, b) => {
      const ma = a.match(LESSON_DIR_RE);
      const mb = b.match(LESSON_DIR_RE);
      return (
        Number(ma[1]) - Number(mb[1]) ||
        Number(ma[2]) - Number(mb[2]) ||
        (a.endsWith("-flagship") ? 1 : 0) - (b.endsWith("-flagship") ? 1 : 0)
      );
    });

  const lessons = ids.map((id) => {
    const cfg = JSON.parse(readFileSync(join(lessonsDir, id, "config.json"), "utf8"));
    return buildEntry(id, cfg);
  });

  const manifest = {
    note: "GENERATED by scripts/generate-curriculum-manifest.mjs — do not hand-edit. Source: lessons/<id>/config.json.",
    schemaVersion: 1,
    total: lessons.length,
    units: [...new Set(lessons.map((l) => l.unit))].sort((a, b) => a - b),
    lessons,
  };

  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  const out = join(dataDir, "curriculum-manifest.json");
  writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`✓ Wrote ${manifest.total} lessons → data/curriculum-manifest.json`);
}

main();
