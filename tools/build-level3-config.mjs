#!/usr/bin/env node
/*!
 * tools/build-level3-config.mjs — compile the Level 3 authoring source into
 * the shipped configuration.
 *
 *   tools/level3-source.mjs   plaintext answers   (never shipped — tools/ is in
 *                                                  vite.config.js SKIP_DIRS)
 *        ↓  node tools/build-level3-config.mjs
 *   data/level3-adaptive.json salted digests only (shipped, student-readable)
 *
 * Rigor fields (`learningTarget`, `standard`) are copied from the LESSON's own
 * config.json, so a Level 3 session can never drift from the grade-level target
 * the lesson is teaching. If a lesson id has no config on disk, the build fails
 * rather than inventing one.
 *
 * Run with --check to verify the committed JSON is up to date (CI/validate).
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeResponse } from "../assets/level3/checker.js";
import { LESSONS } from "./level3-source.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "data", "level3-adaptive.json");

const digest = (salt, response) =>
  createHash("sha256")
    .update(`${salt}::${normalizeResponse(response)}`, "utf8")
    .digest("hex");

function lessonRigor(lessonId) {
  const file = path.join(ROOT, "lessons", lessonId, "config.json");
  let doc;
  try {
    doc = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new Error(
      `level3: lessons/${lessonId}/config.json not found — cannot pin the rigor fields`,
    );
  }
  if (!doc.standard) throw new Error(`level3: lessons/${lessonId} has no standard`);
  return {
    learningTarget: doc.contentObjective || "",
    languageObjective: doc.languageObjective || "",
    standard: doc.standard,
    title: doc.title || "",
    vocabulary: (doc.vocabulary || []).map((v) => v.term).filter(Boolean),
  };
}

/** Compile one authored item into its shipped (answer-free) form. */
function compileItem(item, lessonId) {
  const salt = `${lessonId}:${item.id}`;
  const answers = item.answers || [];
  if (item.kind !== "explanation" && answers.length === 0) {
    throw new Error(`level3: item ${item.id} has no accepted answers`);
  }
  const out = {
    id: item.id,
    salt,
    prompt: item.prompt,
    kind: item.kind || "response",
    representation: item.representation || null,
    targets: item.targets || [],
    hints: item.hints || [],
  };
  if (item.prerequisite) out.prerequisite = item.prerequisite;
  if (item.frames) out.frames = item.frames;
  if (item.vocab) out.vocab = item.vocab;
  if (answers.length) out.answer = { hashes: answers.map((a) => digest(salt, a)) };
  if (item.distractors && item.distractors.length) {
    out.distractors = item.distractors.map((d) => ({
      hash: digest(salt, d.response),
      misconception: d.misconception,
    }));
  }
  return out;
}

function compile() {
  const lessons = {};
  for (const src of LESSONS) {
    const rigor = lessonRigor(src.lessonId);
    lessons[src.lessonId] = {
      lessonId: src.lessonId,
      title: rigor.title || src.title,
      // Fixed rigor, copied from the lesson. Never authored in level3-source.
      learningTarget: rigor.learningTarget,
      languageObjective: rigor.languageObjective,
      standard: rigor.standard,
      vocabulary: rigor.vocabulary,
      representations: src.representations || [],
      misconceptions: src.misconceptions || [],
      prerequisites: (src.prerequisites || []).map((p) => ({
        id: p.id,
        label: p.label,
        why: p.why,
        bridge: (p.bridge || []).map((i) => compileItem(i, src.lessonId)),
      })),
      diagnostic: (src.diagnostic || []).map((i) => compileItem(i, src.lessonId)),
      bank: (src.bank || []).map((i) => compileItem(i, src.lessonId)),
      transfer: (src.transfer || []).map((i) => compileItem(i, src.lessonId)),
    };
  }
  return { version: 1, generatedBy: "tools/build-level3-config.mjs", lessons };
}

const built = compile();
const text = `${JSON.stringify(built, null, 2)}\n`;

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(OUT, "utf8");
  } catch {
    console.error(
      "✗ data/level3-adaptive.json is missing — run: node tools/build-level3-config.mjs",
    );
    process.exit(1);
  }
  if (current !== text) {
    console.error("✗ data/level3-adaptive.json is stale — run: node tools/build-level3-config.mjs");
    process.exit(1);
  }
  console.log(`✓ level3 config is current (${Object.keys(built.lessons).length} lessons)`);
} else {
  writeFileSync(OUT, text);
  const n = Object.keys(built.lessons).length;
  const items = Object.values(built.lessons).reduce(
    (a, l) => a + l.diagnostic.length + l.bank.length + l.transfer.length,
    0,
  );
  console.log(`✓ wrote data/level3-adaptive.json — ${n} lessons, ${items} items, answers hashed`);
}
