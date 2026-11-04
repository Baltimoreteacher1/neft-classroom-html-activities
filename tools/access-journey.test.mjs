// Learning Journey content contract: the index, all twelve mission packs and the family companions.
//
//   node --test tools/access-journey.test.mjs
//
// Structure and references are validateMission()/validateIndex()/validateFamily() (src/journey/curriculum.js).
// This file adds the wording rules and the cross-pack rules those functions cannot hold: no score claims, no hint
// that states an answer, a spiral across units, real differences between the two grade bands, and listening
// tasks whose key covers every item. Every failure names the mission, band and path.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import {
  BANDS,
  ENVIRONMENTS,
  FEATURES,
  KLUS,
  MISSION_IDS,
  MISSIONS,
  UNITS,
  validateFamily,
  validateIndex,
  validateMission,
} from "../access-practice-lab/src/journey/curriculum.js";
import { fleschKincaid, tokenize } from "../access-practice-lab/src/lang/text.js";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";

const PACKS_DIR = join(REPO_ROOT, "access-practice-lab", "src", "content", "journey");
const packFile = (id) => join(PACKS_DIR, `${id}.js`);

// ── load everything once ──────────────────────────────────────────────────────
const missing = MISSION_IDS.filter((id) => !existsSync(packFile(id)));
const packs = {};
const loadErrors = [];
for (const id of MISSION_IDS.filter((x) => !missing.includes(x))) {
  try {
    packs[id] = (await import(pathToFileURL(packFile(id)).href)).default;
  } catch (e) {
    loadErrors.push(`${id}: ${e.message}`);
  }
}
let family = {};
let familyError = "";
try {
  family = (await import(pathToFileURL(join(PACKS_DIR, "family.js")).href)).default;
} catch (e) {
  familyError = e.message;
}
const present = Object.keys(packs);

// ── helpers ───────────────────────────────────────────────────────────────────
/** Every string under `node` as [path, text]. */
function* strings(node, path = []) {
  if (typeof node === "string") yield [path.join("."), node];
  else if (Array.isArray(node))
    for (let i = 0; i < node.length; i++) yield* strings(node[i], [...path, i]);
  else if (node && typeof node === "object")
    for (const [k, v] of Object.entries(node)) yield* strings(v, [...path, k]);
}
const bandsOf = (id) => BANDS.map((band) => [band, packs[id].bands?.[band]]).filter(([, x]) => x);
const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const words = (s) => tokenize(s).length;
const passageText = (read) => (read?.passage || []).map((s) => s.text).join(" ");
const meanSentenceLength = (read) => {
  const p = read?.passage || [];
  return p.length ? p.reduce((n, s) => n + words(s.text), 0) / p.length : 0;
};

// Hints and help text: the strings a learner can open. Scene `note`s are observations and are excluded.
const HELP_LAST = new Set([
  "probe",
  "good",
  "close",
  "ack",
  "noCause",
  "noEvidence",
  "thanks",
  "opening",
  "explainFrame",
  "def",
  "means",
  "note",
  "ask",
]);
const HELP_PARENT = new Set([
  "followUps",
  "readerQuestions",
  "visuals",
  "models",
  "notes",
  "altConnectors",
]);
function* helpStrings(band) {
  for (const [path, text] of strings(band)) {
    const segs = path.split(".");
    if (/^understand\.read\.(?:passage|challenge\.transfer\.passage)\./.test(path)) continue;
    if (segs.includes("objects")) continue;
    if (HELP_LAST.has(segs.at(-1)) || segs.some((s) => HELP_PARENT.has(s))) yield [path, text];
  }
}
const validSentences = (read) => {
  const c = read?.challenge;
  const text = (passage, ids) =>
    (ids || []).map((id) => (passage || []).find((s) => s.id === id)?.text).filter(Boolean);
  return [...text(read?.passage, c?.valid), ...text(c?.transfer?.passage, c?.transfer?.valid)];
};

// ── the index ─────────────────────────────────────────────────────────────────
test("four units of three missions, twelve in all, every Key Language Use, environment and feature covered", () => {
  assert.equal(UNITS.length, 4);
  for (const u of UNITS) assert.equal(u.missions.length, 3, `unit ${u.n} has 3 missions`);
  assert.equal(MISSION_IDS.length, 12);
  assert.deepEqual(
    MISSION_IDS,
    Array.from({ length: 12 }, (_, i) => `m${String(i + 1).padStart(2, "0")}`),
  );
  assert.deepEqual(Object.keys(MISSIONS), MISSION_IDS);
  assert.deepEqual(validateIndex(), []);
  for (const klu of KLUS)
    assert.ok(
      MISSION_IDS.some((id) => MISSIONS[id].klu === klu),
      `${klu} is the Key Language Use of a mission`,
    );
  for (const env of ENVIRONMENTS)
    assert.ok(
      MISSION_IDS.some((id) => MISSIONS[id].environment === env),
      `environment ${env} used`,
    );
  for (const f of Object.keys(FEATURES))
    assert.ok(
      MISSION_IDS.some((id) => MISSIONS[id].features.includes(f)),
      `feature ${f} taught`,
    );
});

test("the index makes no score, level or proficiency claim", () => {
  for (const [path, text] of strings(MISSIONS, ["MISSIONS"]))
    assert.ok(!SCORE_CLAIM.test(text), `${path}: score claim "${text.match(SCORE_CLAIM)?.[0]}"`);
});

// ── the packs ─────────────────────────────────────────────────────────────────
test("all twelve mission packs exist and load", () => {
  assert.deepEqual(
    missing,
    [],
    `missing mission packs (src/content/journey/): ${missing.join(", ")}`,
  );
  assert.deepEqual(loadErrors, [], "packs that fail to load");
  for (const id of present)
    assert.equal(packs[id]?.id, id, `${id}: pack id must equal its file name`);
});

test("every pack satisfies validateMission", () => {
  const problems = present.flatMap((id) => validateMission(packs[id]).map((e) => `${id}: ${e}`));
  assert.deepEqual(problems, []);
});

test("no pack string makes a score, level or proficiency claim", () => {
  const found = [];
  for (const id of present)
    for (const [path, text] of strings(packs[id], [id]))
      if (SCORE_CLAIM.test(text)) found.push(`${path}: "${text.match(SCORE_CLAIM)[0]}"`);
  assert.deepEqual(found, []);
});

test("hints and probes never state an answer: no help string contains a valid reading sentence", () => {
  const leaks = [];
  for (const id of present)
    for (const [band, x] of bandsOf(id)) {
      const valid = validSentences(x.understand?.read)
        .map((t) => [t, norm(t)])
        .filter(([, n]) => n.split(" ").length >= 3);
      for (const [path, text] of helpStrings(x)) {
        const n = norm(text);
        for (const [original, v] of valid)
          if (n.includes(v))
            leaks.push(`${id}.${band}.${path} contains the valid sentence "${original}"`);
      }
    }
  assert.deepEqual(leaks, []);
});

test("each mission's two grade bands differ in task, passage and difficulty", () => {
  const found = [];
  for (const id of present) {
    const [low, high] = BANDS.map((b) => packs[id].bands?.[b]);
    if (!low || !high) continue; // validateMission reports a missing band
    if (low.communicate?.prompt === high.communicate?.prompt)
      found.push(`${id}: communicate.prompt is identical in 3-5 and 6-8`);
    if (low.show?.prompt === high.show?.prompt)
      found.push(`${id}: show.prompt is identical in 3-5 and 6-8`);
    if (passageText(low.understand?.read) === passageText(high.understand?.read))
      found.push(`${id}: read.passage is identical in 3-5 and 6-8`);
    const [m35, m68] = [low, high].map((x) => meanSentenceLength(x.understand?.read));
    if (!(m68 >= m35))
      found.push(
        `${id}: 6-8 passage mean sentence length ${m68.toFixed(1)} is below 3-5 (${m35.toFixed(1)}) words`,
      );
    const [fk35, fk68] = [low, high].map((x) => fleschKincaid(passageText(x.understand?.read)));
    if (!(fk68 >= fk35))
      found.push(
        `${id}: 6-8 passage Flesch-Kincaid ${fk68.toFixed(1)} is below 3-5 (${fk35.toFixed(1)})`,
      );
    if (!((high.show?.minWords ?? 0) >= (low.show?.minWords ?? 0)))
      found.push(
        `${id}: show.minWords 6-8 (${high.show?.minWords}) is below 3-5 (${low.show?.minWords})`,
      );
  }
  assert.deepEqual(found, []);
});

test("every listening key covers every item at least once, including the independent final sequence", () => {
  const found = [];
  const cover = (t, at) => {
    const used = new Set((t.expect || []).map((e) => e.item));
    for (const item of t.items || [])
      if (!used.has(item.id)) found.push(`${at}: item ${item.id} is never expected`);
  };
  for (const id of present)
    for (const [band, x] of bandsOf(id)) {
      const listen = x.understand?.listen;
      if (!listen) continue;
      cover(listen, `${id}.${band}.understand.listen`);
      if (listen.final)
        cover({ ...listen, ...listen.final }, `${id}.${band}.understand.listen.final`);
    }
  assert.deepEqual(found, []);
});

// ── the family companions ─────────────────────────────────────────────────────
test("a family companion exists for every mission and satisfies validateFamily", () => {
  assert.equal(familyError, "", "src/content/journey/family.js must load");
  const absent = MISSION_IDS.filter((id) => !family[id]);
  assert.deepEqual(absent, [], `family.js has no companion for: ${absent.join(", ")}`);
  assert.deepEqual(
    Object.keys(family).filter((id) => !MISSION_IDS.includes(id)),
    [],
    "family.js has entries for unknown missions",
  );
  const problems = MISSION_IDS.filter((id) => family[id]).flatMap((id) =>
    validateFamily(family[id], id),
  );
  assert.deepEqual(problems, []);
});

test("family text makes no score claim and uses no WIDA terms", () => {
  const found = [];
  for (const [path, text] of strings(family, ["family"])) {
    if (SCORE_CLAIM.test(text)) found.push(`${path}: score claim "${text.match(SCORE_CLAIM)[0]}"`);
    const term = text.match(
      /\bWIDA\b|\bELD-[A-Z]{2}\b|Key Language Use|Proficiency Level|Language Expectation/,
    );
    if (term) found.push(`${path}: WIDA term "${term[0]}" in family-facing text`);
  }
  assert.deepEqual(found, []);
});

test("the family companion's talk and five-minute prompts differ between the grade bands", () => {
  const found = [];
  for (const id of MISSION_IDS.filter((x) => family[x]))
    for (const k of ["fiveMinute", "talk"])
      if (family[id][k]?.["3-5"]?.[0] === family[id][k]?.["6-8"]?.[0])
        found.push(`family.${id}.${k}: identical English in both bands`);
  assert.deepEqual(found, []);
});
