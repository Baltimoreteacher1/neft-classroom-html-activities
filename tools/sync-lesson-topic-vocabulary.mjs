#!/usr/bin/env node
/** Synchronize complete topic phrases into every interactive lesson config. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const lessonsDir = path.join(root, "lessons");
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, "data", "lesson-topic-vocabulary.json"), "utf8"),
);
const checkOnly = process.argv.includes("--check");
const fields = ["term", "termEs", "definition", "definitionEs", "visual"];
const termKey = (value) =>
  String(value || "")
    .trim()
    .toLocaleLowerCase("en-US");
const clone = (value) => JSON.parse(JSON.stringify(value));

function sourceLessonIds(lessonId) {
  const match = lessonId.match(/^(\d+)-(\d+)/);
  if (!match) return [];
  const unit = Number(match[1]);
  const lesson = Number(match[2]);
  if (!lessonId.endsWith("-catchup")) return [`${unit}-${lesson}`];
  const first = lesson <= 3 ? 1 : 4;
  return Array.from({ length: lesson - first + 1 }, (_, index) => `${unit}-${first + index}`);
}

function saveConfig(file, config) {
  if (!checkOnly) fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
}

for (const [lessonId, entries] of Object.entries(catalog)) {
  if (!/^\d+-\d+$/.test(lessonId) || !Array.isArray(entries) || !entries.length) {
    throw new Error("Topic vocabulary catalog has an invalid lesson entry");
  }
  if (!fs.existsSync(path.join(lessonsDir, lessonId, "config.json"))) {
    throw new Error("Topic vocabulary catalog references a missing core lesson");
  }
  for (const entry of entries) {
    for (const field of fields) {
      if (!String(entry[field] || "").trim()) {
        throw new Error("Topic vocabulary catalog has an incomplete phrase entry");
      }
    }
  }
}

for (const dirent of fs.readdirSync(lessonsDir, { withFileTypes: true })) {
  if (!dirent.isDirectory()) continue;
  const file = path.join(lessonsDir, dirent.name, "config.json");
  if (!fs.existsSync(file)) continue;
  const config = JSON.parse(fs.readFileSync(file, "utf8"));
  const desired = sourceLessonIds(config.lessonId || dirent.name).flatMap((lessonId) =>
    clone(catalog[lessonId] || []),
  );
  if (!desired.length) throw new Error("An interactive lesson has no topic vocabulary entry");
  const revisedVocabulary = [];
  for (const phrase of desired) {
    const previous = (config.vocabulary || []).find(
      (entry) => termKey(entry.term) === termKey(phrase.term),
    );
    revisedVocabulary.push({ ...(previous || {}), ...phrase });
  }
  for (const entry of config.vocabulary || []) {
    const duplicate = desired.some((item) => termKey(item.term) === termKey(entry.term));
    if (!duplicate) revisedVocabulary.push(entry);
  }
  if (checkOnly && JSON.stringify(config.vocabulary || []) !== JSON.stringify(revisedVocabulary)) {
    throw new Error("Interactive lesson topic vocabulary is out of sync");
  }
  config.vocabulary = revisedVocabulary;
  saveConfig(file, config);
  const currentByTerm = new Map(
    (config.vocabulary || []).map((entry) => [termKey(entry.term), entry]),
  );
  for (const entry of desired) {
    const actual = currentByTerm.get(termKey(entry.term));
    if (!actual || fields.some((field) => actual[field] !== entry[field])) {
      throw new Error("Interactive lesson topic vocabulary is out of sync");
    }
  }
}
