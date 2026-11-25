#!/usr/bin/env node
/**
 * validate-scaffold-content.mjs: the content gates for Scaffold Studio.
 *
 *  SCHEMA     every support set validates against schema v1 (purpose, can-do ids, review status, chunks that rebuild
 *             their sentence, four-step frames, four-word briefings).
 *  GLOSSES    every key word has a Spanish gloss that is not a placeholder ("spanish", the term itself) and is labelled
 *             with a review status. Arabic and Haitian Creole are reported, not failed: none are authored yet.
 *  AUDIO      every key word has an entry in content/scaffold/audio-manifest.json. `tts` entries are an explicit,
 *             flagged fallback; a `human` entry needs its file on disk and a measured loudness within the target.
 *  IMAGES     every image a support uses is listed in image-manifest.json with an allowed license. No image, no problem.
 *  RELEASE    while release.json says studentRelease is false, unapproved content is allowed (students cannot see it in
 *             production). The moment it is true, any support or gloss that is not `approved` FAILS the build.
 *
 * Scope is the pilot units in release.json. Everything else in the lab keeps its own gates. Self-tests run first, and a
 * sweep below its floor fails, so a gate that stopped finding content cannot pass.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateSupportSet } from "../access-practice-lab/src/scaffold/schema/v1.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LAB = join(ROOT, "access-practice-lab");
const read = (rel) => JSON.parse(readFileSync(join(LAB, rel), "utf8"));
const PLACEHOLDER = /^(spanish|español|arabic|haitian creole|tbd|todo|n\/a|\?+)$/i;

export function check(
  { pilot, release, audio, images },
  { fileExists = (p) => existsSync(join(ROOT, p)) } = {},
) {
  const failures = [];
  const stats = {
    sets: 0,
    words: 0,
    supports: 0,
    notApproved: 0,
    glossNotApproved: 0,
    tts: 0,
    human: 0,
    ar: 0,
    ht: 0,
  };
  const audioById = new Map((audio.entries || []).map((e) => [e.id, e]));
  const imageBySrc = new Map((images.assets || []).map((a) => [a.src, a]));
  const bands = new Set();
  const units = new Set();

  for (const set of pilot.sets) {
    stats.sets++;
    bands.add(set.band);
    units.add(set.unit);
    const v = validateSupportSet(set);
    for (const e of v.errors) failures.push(`SCHEMA ${set.id}: ${e}`);
    for (const s of set.supports || []) {
      stats.supports++;
      if (s.review?.status !== "approved") stats.notApproved++;
      if (release.studentRelease && s.review?.status !== "approved")
        failures.push(`RELEASE ${s.id}: ${s.review?.status} content cannot reach students`);
      if (s.type !== "word") continue;
      stats.words++;
      const es = s.glosses?.es;
      if (!es?.text) failures.push(`GLOSSES ${s.id}: no Spanish gloss`);
      else if (
        PLACEHOLDER.test(es.text.trim()) ||
        es.text.trim().toLowerCase() === s.term.toLowerCase()
      )
        failures.push(`GLOSSES ${s.id}: Spanish gloss "${es.text}" is a placeholder`);
      if (es && es.review?.status !== "approved") stats.glossNotApproved++;
      if (release.studentRelease && es && es.review?.status !== "approved")
        failures.push(`RELEASE ${s.id}: Spanish gloss is ${es.review?.status}`);
      if (s.glosses?.ar) stats.ar++;
      if (s.glosses?.ht) stats.ht++;
      const a = audioById.get(s.id);
      if (!a) failures.push(`AUDIO ${s.id}: no entry in audio-manifest.json`);
      else if (a.source === "tts") {
        stats.tts++;
        if (a.needsHumanRecording !== true)
          failures.push(`AUDIO ${s.id}: tts fallback must be flagged needsHumanRecording`);
      } else if (a.source === "human") {
        stats.human++;
        if (!a.src || !fileExists(a.src))
          failures.push(`AUDIO ${s.id}: human recording file ${a.src} is missing`);
        const t = audio.loudnessTargetLUFS;
        if (typeof a.lufs !== "number" || Math.abs(a.lufs - t) > audio.tolerance)
          failures.push(
            `AUDIO ${s.id}: loudness ${a.lufs} LUFS is outside ${t} +/- ${audio.tolerance}`,
          );
        if (!a.recordedBy) failures.push(`AUDIO ${s.id}: human recording needs recordedBy`);
      } else failures.push(`AUDIO ${s.id}: source must be human or tts`);
      if (s.image) {
        const m = imageBySrc.get(s.image.src);
        if (!m) failures.push(`IMAGES ${s.id}: ${s.image.src} is not in image-manifest.json`);
        else if (!images.allowedLicenses.includes(m.license))
          failures.push(`IMAGES ${s.id}: license "${m.license}" is not allowed`);
      }
    }
  }
  for (const u of release.pilotUnits || [])
    if (!units.has(u)) failures.push(`pilot unit "${u}" has no support set`);
  for (const b of ["3-5", "6-8"])
    if (!bands.has(b)) failures.push(`no pilot support set for band ${b}`);
  for (const a of images.assets || [])
    if (!a.license) failures.push(`IMAGES ${a.src}: no license recorded`);
  return { failures, stats };
}

function selfTest() {
  const base = () =>
    JSON.parse(
      JSON.stringify({
        pilot: read("content/scaffold/pilot.json"),
        release: read("content/scaffold/release.json"),
        audio: read("content/scaffold/audio-manifest.json"),
        images: read("content/scaffold/image-manifest.json"),
      }),
    );
  const expect = (name, mutate, re) => {
    const d = base();
    mutate(d);
    const { failures } = check(d);
    if (!failures.some((f) => re.test(f))) throw new Error(`self-test: "${name}" was not caught`);
  };
  const w = (d) => d.pilot.sets[0].supports.find((s) => s.type === "word");
  expect(
    "released but unapproved",
    (d) => {
      d.release.studentRelease = true;
    },
    /RELEASE/,
  );
  expect(
    "placeholder gloss",
    (d) => {
      w(d).glosses.es.text = "spanish";
    },
    /placeholder/,
  );
  expect(
    "no gloss",
    (d) => {
      delete w(d).glosses;
    },
    /no Spanish gloss/,
  );
  expect(
    "no audio entry",
    (d) => {
      d.audio.entries = d.audio.entries.filter((e) => e.id !== w(d).id);
    },
    /no entry/,
  );
  expect(
    "tts not flagged",
    (d) => {
      d.audio.entries[0].needsHumanRecording = false;
    },
    /flagged/,
  );
  expect(
    "human audio file missing",
    (d) => {
      Object.assign(d.audio.entries[0], {
        source: "human",
        src: "nope.mp3",
        lufs: -16,
        recordedBy: "x",
      });
    },
    /missing/,
  );
  expect(
    "human audio too loud",
    (d) => {
      Object.assign(d.audio.entries[0], {
        source: "human",
        src: "package.json",
        lufs: -9,
        recordedBy: "x",
      });
    },
    /loudness/,
  );
  expect(
    "unlicensed image",
    (d) => {
      w(d).image = { src: "a.png", alt: "a plant", license: "x" };
    },
    /not in image-manifest/,
  );
  expect(
    "chunks that do not rebuild",
    (d) => {
      d.pilot.sets[0].supports.find((s) => s.type === "chunk").chunks[0].text = "Nope";
    },
    /rebuild/,
  );
  expect(
    "support with no purpose",
    (d) => {
      w(d).purpose = "";
    },
    /purpose/,
  );
  if (check(base()).failures.length)
    throw new Error("self-test: the committed content was rejected by its own baseline");
}

function main() {
  selfTest();
  const data = {
    pilot: read("content/scaffold/pilot.json"),
    release: read("content/scaffold/release.json"),
    audio: read("content/scaffold/audio-manifest.json"),
    images: read("content/scaffold/image-manifest.json"),
  };
  const { failures, stats } = check(data);
  if (stats.words < 16) failures.push(`only ${stats.words} key words swept, expected at least 16`);
  console.log(
    `scaffold content: ${stats.sets} sets, ${stats.supports} supports, ${stats.words} key words`,
  );
  console.log(
    `  needs human review: ${stats.notApproved} supports not approved, ${stats.glossNotApproved} Spanish glosses not approved`,
  );
  console.log(
    `  audio: ${stats.human} human, ${stats.tts} speech-synthesis fallback (flagged); glosses ar=${stats.ar} ht=${stats.ht} (not yet authored)`,
  );
  console.log(
    `  student release: ${data.release.studentRelease ? "ON" : "off (students see none of this in production)"}`,
  );
  if (failures.length) {
    console.error(`FAIL validate-scaffold-content: ${failures.length} problem(s)`);
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log("PASS validate-scaffold-content");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
