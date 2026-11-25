#!/usr/bin/env node
/* =============================================================================
 * language-page-audio.test.mjs — the listening-audio manifest is current, and every registered recording is real, captioned and in step
 * with its script. With no recordings registered (today) it still proves the pipeline would refuse a bad one.
 * ========================================================================== */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildManifest,
  load,
  MANIFEST,
  recordingProblems,
  sha,
  statusOf,
} from "./generate-language-page-audio-manifest.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const checks = [];
const check = (name, fn) => {
  fn();
  checks.push(name);
};

const item = { id: "x-1", band: "g3-5", script: "Please put your book on the shelf." };
const good = {
  file: "access-practice-lab/audio/x-1.mp3",
  captions: "access-practice-lab/audio/x-1.vtt",
  scriptSha256: sha(item.script),
  speaker: "A. Teacher",
  recordedOn: "2026-12-01",
  licence: "owned",
};
const here = () => true;

// ---- self-tests: each defect the pipeline exists to refuse
check("a complete, matching recording is accepted and reads as recorded", () => {
  assert.deepEqual(recordingProblems([item], { "x-1": good }, here), []);
  assert.equal(statusOf(item, { "x-1": good }), "recorded");
});
check("a script edited after recording is stale and a problem", () => {
  const edited = { ...item, script: "Please put your book on the desk." };
  assert.equal(statusOf(edited, { "x-1": good }), "stale");
  assert.ok(
    recordingProblems([edited], { "x-1": good }, here).some((p) => p.includes("script changed")),
  );
});
check("a recording with no captions, a missing file, or a non-audio file is refused", () => {
  assert.ok(
    recordingProblems([item], { "x-1": { ...good, captions: "" } }, here).some((p) =>
      p.includes("captions"),
    ),
  );
  assert.ok(
    recordingProblems([item], { "x-1": good }, () => false).some((p) =>
      p.includes("does not exist"),
    ),
  );
  assert.ok(
    recordingProblems([item], { "x-1": { ...good, file: "a.txt" } }, here).some((p) =>
      p.includes("audio file"),
    ),
  );
  assert.ok(
    recordingProblems([item], { "x-1": { ...good, captions: "a.txt" } }, here).some((p) =>
      p.includes("WebVTT"),
    ),
  );
});
check("a recording for an unknown item, or one with no licence or speaker, is refused", () => {
  assert.ok(
    recordingProblems([item], { ghost: good }, here).some((p) => p.includes("does not exist")),
  );
  assert.ok(
    recordingProblems([item], { "x-1": { ...good, licence: "" } }, here).some((p) =>
      p.includes("licence"),
    ),
  );
  assert.ok(
    recordingProblems([item], { "x-1": { ...good, speaker: "" } }, here).some((p) =>
      p.includes("speaker"),
    ),
  );
});
check("hashing ignores surrounding whitespace but not a changed word", () => {
  assert.equal(sha(` ${item.script}\n`), sha(item.script));
  assert.notEqual(sha("The shelf."), sha("The desk."));
});
check("the manifest counts statuses", () => {
  const m = buildManifest(
    [item, { id: "x-2", band: "g1", script: "Hello." }, { id: "x-3", band: "g1", script: null }],
    { "x-1": good },
  );
  assert.deepEqual(m.totals, { items: 2, tts: 1, recorded: 1, stale: 0 });
  assert.deepEqual(m.noScript, ["x-3"]);
});

// ---- the real data
const { items, recordings, manifest } = load();
check("the sweep read the whole Listening bank", () => {
  assert.ok(manifest.totals.items >= 200, `only ${manifest.totals.items} scripts found`);
  assert.equal(new Set(items.map((i) => i.id)).size, items.length, "duplicate Listening ids");
});
check("every registered recording is real, captioned and matches its script", () => {
  assert.deepEqual(recordingProblems(items, recordings), []);
  assert.equal(manifest.totals.stale, 0);
});
check(`${MANIFEST} is current`, () => {
  assert.equal(
    readFileSync(join(ROOT, MANIFEST), "utf8"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    `${MANIFEST} is stale: run node tools/generate-language-page-audio-manifest.mjs`,
  );
});

console.log(
  `language-page-audio.test: ${checks.length} checks passed (${manifest.totals.recorded} of ${manifest.totals.items} scripts recorded)`,
);
