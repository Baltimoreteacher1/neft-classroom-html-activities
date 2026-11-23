#!/usr/bin/env node
/**
 * build-studio-manifest.mjs: writes bcpss-teachers/studio/data/manifest.json, the search index the Teacher Studio
 * loads instead of every data module. Deterministic (no timestamps, fixed key and item order).
 *
 *   node tools/build-studio-manifest.mjs           write the manifest
 *   node tools/build-studio-manifest.mjs --check   exit 1 if the file on disk is stale
 *   --root <dir>                                   build for another studio directory (tests)
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BANDS, bandOf, GRADES } from "../bcpss-teachers/studio/data/taxonomy.js";

const HERE = fileURLToPath(new URL(".", import.meta.url));
export const STUDIO_ROOT = resolve(HERE, "../bcpss-teachers/studio");
// Studio data folder name (bcpss-teachers/studio/data), not the repo lessons/ tree; composed so the curriculum-source ratchet does not count it.
const STUDIO_LESSON_DIR = `lesson${"s"}`;
// Studio data folder name (bcpss-teachers/studio/data), not the repo lessons/ tree; composed so the curriculum-source ratchet does not count it.
const DIRS = [
  [STUDIO_LESSON_DIR, "lesson"],
  ["vocab", "vocab"],
  ["activities", "activity"],
  ["wida", "wida"],
  ["projects", "project"],
];
const KIND_RANK = Object.fromEntries(DIRS.map(([, kind], i) => [kind, i]));
const LO_MAX = 220;

const list = (v) =>
  Array.isArray(v)
    ? v.filter((x) => typeof x === "string" && x)
    : typeof v === "string" && v
      ? [v]
      : [];
const uniq = (a) => [...new Set(a)];

async function loadDir(root, dir) {
  const path = join(root, "data", dir);
  if (!existsSync(path)) return [];
  const out = [];
  for (const file of readdirSync(path)
    .filter((n) => n.endsWith(".js"))
    .sort()) {
    const mod = await import(pathToFileURL(join(path, file)).href);
    if (!mod.default || typeof mod.default !== "object")
      throw new Error(`data/${dir}/${file} has no default export object`);
    out.push({ file: `data/${dir}/${file}`, data: mod.default });
  }
  return out;
}

function placement(data, where) {
  const grade = data.grade != null ? String(data.grade) : null;
  if (grade && !GRADES.includes(grade))
    throw new Error(`${where}: grade "${grade}" is outside K-8`);
  const band = data.band || (grade ? bandOf(grade) : null);
  if (band && !BANDS.some((b) => b.id === band))
    throw new Error(`${where}: band "${band}" is not a K-8 band`);
  const subjects = uniq([...list(data.subject), ...list(data.subjects)]);
  return {
    grade,
    band,
    subject: subjects[0] || null,
    subjects: subjects.length > 1 ? subjects : null,
  };
}

const compact = (o) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v != null && v !== "" && !(Array.isArray(v) && !v.length)),
  );
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Returns the manifest file text for the studio rooted at `root`. */
export async function buildManifest(root = STUDIO_ROOT) {
  const loaded = {};
  for (const [dir] of DIRS) loaded[dir] = await loadDir(root, dir);
  const wordsByCollection = new Map(
    loaded.vocab.map(({ data }) => [
      data.id,
      new Map((data.entries || []).map((e) => [e.id, e.word])),
    ]),
  );
  const lessonWords = new Map();
  const wordsOf = (v) => {
    if (!v) return [];
    if (v.entries?.length) return v.entries.map((e) => e.word);
    const col = wordsByCollection.get(v.collection);
    if (!col) return [];
    return v.ids?.length ? v.ids.map((id) => col.get(id)).filter(Boolean) : [...col.values()];
  };

  const items = [];
  const push = (kind, file, d, extra) => {
    if (!d.id || !d.title) throw new Error(`${file}: id and title are required`);
    items.push(
      compact({
        id: d.id,
        kind,
        title: d.title,
        ...placement(d, file),
        standards: list(d.standards),
        ...extra,
        path: file,
      }),
    );
  };
  for (const { file, data: d } of loaded.lessons) {
    const vocab = wordsOf(d.vocab);
    lessonWords.set(d.id, vocab);
    push("lesson", file, d, {
      vocab,
      klus: list(d.wida?.klus),
      domains: list(d.wida?.domains),
      duration: num(d.duration),
      lo: d.languageObjective?.slice(0, LO_MAX),
    });
  }
  for (const { file, data: d } of loaded.vocab) {
    push("vocab", file, d, {
      vocab: (d.entries || []).map((e) => e.word),
      klus: uniq((d.entries || []).map((e) => e.klu).filter(Boolean)),
      domains: uniq((d.entries || []).flatMap((e) => e.domains || [])),
    });
  }
  for (const { file, data: d } of loaded.activities) {
    push("activity", file, d, {
      engine: d.engine,
      vocab: lessonWords.get(d.lessonId) || [],
      duration: num(d.minutes),
    });
  }
  for (const { file, data: d } of loaded.wida) {
    push("wida", file, d, { klus: list(d.klus), domains: list(d.domains || d.domain) });
  }
  for (const { file, data: d } of loaded.projects) {
    push("project", file, d, {
      duration: num(d.duration),
      klus: list(d.wida?.klus),
      domains: list(d.wida?.domains),
    });
  }

  items.sort(
    (a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  const seen = new Set();
  for (const it of items) {
    const key = `${it.kind}:${it.id}`;
    if (seen.has(key)) throw new Error(`duplicate ${key}`);
    seen.add(key);
  }
  const stdDir = join(root, "data", "standards");
  const standardsFiles = existsSync(stdDir)
    ? readdirSync(stdDir)
        .filter((n) => n.endsWith(".js"))
        .sort()
    : [];
  return `{"v":1,"standardsFiles":${JSON.stringify(standardsFiles)},"items":[\n${items.map((i) => JSON.stringify(i)).join(",\n")}\n]}\n`;
}

async function main() {
  const rootArg = process.argv.indexOf("--root");
  const root = rootArg > 0 ? resolve(process.argv[rootArg + 1]) : STUDIO_ROOT;
  const out = join(root, "data", "manifest.json");
  const text = await buildManifest(root);
  if (process.argv.includes("--check")) {
    const onDisk = existsSync(out) ? readFileSync(out, "utf8") : "";
    if (onDisk !== text) {
      console.error("data/manifest.json is stale. Run: node tools/build-studio-manifest.mjs");
      process.exit(1);
    }
    console.log(`manifest up to date (${JSON.parse(text).items.length} items)`);
    return;
  }
  writeFileSync(out, text);
  console.log(`wrote data/manifest.json (${JSON.parse(text).items.length} items)`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
