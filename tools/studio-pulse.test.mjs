// Class Pulse code (assets/studio/pulse-core.js): the anonymous checksummed string a student copies from a studio and a teacher
// pastes into /teacher-tools/class-pulse/.
//   node tools/studio-pulse.test.mjs
// Holds: an exact round trip; a worst-case student fits 120 characters; every single-character typo and every adjacent swap is
// rejected; an unknown version is rejected; the policy picks the top three NAMED traps; no two real traps share a hash; every real
// trap yields Family Window text in both languages.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const ctx = {};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync(join(REPO_ROOT, "assets/studio/pulse-core.js"), "utf8"), ctx);
const raw = ctx.StudioPulseCore;
// results cross the vm realm: clone them so deepEqual compares plain objects
const plain = (x) => JSON.parse(JSON.stringify(x));
const C = {
  ...raw,
  decode: (s) => plain(raw.decode(s)),
  fromSnapshot: (s) => plain(raw.fromSnapshot(s)),
  askAtHome: (a, b) => plain(raw.askAtHome(a, b)),
};
assert.ok(raw, "StudioPulseCore loads");
const { traps } = JSON.parse(
  readFileSync(join(REPO_ROOT, "data/practice-studio/misconceptions.json"), "utf8"),
);
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const sample = {
  lesson: "4-3",
  mode: "challenge",
  u4: false,
  done: [4, 8, 3, 5, 10],
  clean: 14,
  assisted: 9,
  guessed: 2,
  certain: 3,
  fTeacher: 1,
  fNoTwin: 0,
  seals: [2, 1, 0],
  traps: [
    { id: "stat-mean-out-of-range", n: 5 },
    { id: "rate-not-per-one", n: 3 },
    { id: "coord-xy-swapped", n: 1 },
  ],
  focus: [
    { kind: "teacher", tab: 3, i: 2 },
    { kind: "certain", tab: 2, i: 7 },
  ],
};

// ---- round trip --------------------------------------------------------------------------------------------------
const code = C.encode(sample);
assert.match(
  code,
  /^[0-9A-Z]{5}(-[0-9A-Z]{1,5})*$/,
  `a readable code in groups of five (got ${code})`,
);
const back = C.decode(code);
assert.equal(back.ok, true, "a fresh code decodes");
const p = back.pulse;
assert.equal(p.lesson, "4-3");
assert.equal(p.mode, "challenge");
assert.deepEqual(p.done, sample.done);
assert.deepEqual([p.clean, p.assisted, p.guessed], [14, 9, 2]);
assert.deepEqual([p.certain, p.fTeacher, p.fNoTwin], [3, 1, 0]);
assert.deepEqual(p.seals, [2, 1, 0]);
assert.deepEqual(
  p.traps,
  sample.traps.map((t) => ({ h: C.trapHash(t.id), n: t.n })),
);
assert.deepEqual(p.focus, sample.focus);
assert.equal(C.encode(p), code, "decode then encode reproduces the same code");

// a code survives the ways people paste it
for (const variant of [
  code.toLowerCase(),
  ` ${code} `,
  code.replace(/-/g, ""),
  code.replace(/-/g, " "),
  code.replace(/0/g, "o").replace(/1/g, "l"),
])
  assert.equal(C.decode(variant).ok, true, `pasted as "${variant}"`);

// ---- a student who has done nothing, and the Daily Boost id -----------------------------------------------------------
const empty = C.decode(C.encode({ lesson: "0-0", mode: "practice" }));
assert.equal(empty.ok, true);
assert.deepEqual(empty.pulse.traps, []);
assert.deepEqual(empty.pulse.done, [0, 0, 0, 0, 0]);
assert.throws(() => C.encode({ lesson: "banana", mode: "practice" }), /not a lesson id/);
assert.throws(() => C.encode({ lesson: "16-1", mode: "practice" }), /not a lesson id/);

// ---- worst case fits the limit ---------------------------------------------------------------------------------------
const worst = C.encode({
  lesson: "15-63",
  mode: "challenge",
  u4: true,
  done: [99, 99, 99, 99, 99],
  clean: 999,
  assisted: 999,
  guessed: 999,
  certain: 99,
  fTeacher: 99,
  fNoTwin: 99,
  seals: [99, 99, 99],
  traps: Object.keys(traps)
    .slice(0, 9)
    .map((id) => ({ id, n: 999 })),
  focus: [1, 2, 3, 4, 5].map((tab) => ({ kind: "guessed", tab, i: 99 })),
});
assert.ok(
  worst.length <= C.MAX_CHARS,
  `worst case is ${worst.length} characters (limit ${C.MAX_CHARS})`,
);
const w = C.decode(worst).pulse;
assert.equal(w.traps.length, 3, "at most three traps travel");
assert.equal(w.focus.length, 3, "at most three places travel");
assert.deepEqual(w.done, [63, 63, 63, 63, 63], "counts are capped, never wrapped");
assert.equal(w.clean, 127);
assert.equal(w.traps[0].n, 63);
console.log(
  `sample code ${code.length} chars, worst case ${worst.length} chars (limit ${C.MAX_CHARS})`,
);

// ---- the checksum: every typo, every swap -----------------------------------------------------------------------------
const flat = code.replace(/-/g, "");
let tried = 0;
for (let i = 0; i < flat.length; i++)
  for (const ch of ALPHABET) {
    if (ch === flat[i]) continue;
    const typo = flat.slice(0, i) + ch + flat.slice(i + 1);
    tried++;
    assert.equal(
      C.decode(typo).ok,
      false,
      `a typo at ${i} ("${flat[i]}" -> "${ch}") must be rejected`,
    );
  }
for (let i = 0; i + 1 < flat.length; i++) {
  if (flat[i] === flat[i + 1]) continue;
  const swapped = flat.slice(0, i) + flat[i + 1] + flat[i] + flat.slice(i + 2);
  tried++;
  assert.equal(
    C.decode(swapped).ok,
    false,
    `swapping characters ${i} and ${i + 1} must be rejected`,
  );
}
assert.equal(C.decode(flat.slice(0, -1)).ok, false, "a truncated code is rejected");
assert.equal(C.decode(`${flat}0`).ok, false, "a code with a stray character is rejected");
assert.equal(C.decode(`${flat}${flat}`).ok, false, "two codes run together are rejected");
assert.equal(C.decode("").error, "empty");
assert.equal(C.decode("hello world!").error, "chars");
assert.equal(C.decode(flat.replace(/^./, "U")).error, "chars", "U is not in the alphabet");
console.log(`rejected all ${tried} single typos and swaps`);

// an unknown version is rejected as a version, not read as garbage
for (const first of ALPHABET.replace("1", "")) {
  const other = first + flat.slice(1);
  const d = C.decode(other);
  assert.equal(d.ok, false, `version character ${first} must not decode`);
}
assert.equal(C.decode(`2${flat.slice(1)}`).error, "version");

// ---- policy ---------------------------------------------------------------------------------------------------------
const snap = C.fromSnapshot({
  lesson: "2-4",
  mode: "practice",
  done: [4, 3, 0, 0, 0],
  tiers: { clean: 5, assisted: 2, guessed: 1 },
  misses: {
    "stat-mean-out-of-range": { n: 4 },
    "rate-not-per-one": { n: 4 },
    "coord-xy-swapped": { n: 2 },
    "ratio-as-difference": { n: 1 },
    "skill:a sentence signature": { n: 9 },
    "untagged-but-auto": { n: 9, auto: true },
  },
  certain: [{ tab: 2, i: 3 }],
  flags: [
    { kind: "no-twin", tab: 3, i: 1 },
    { kind: "teacher", tab: 2, i: 3 },
  ],
  guessed: [
    { tab: 2, i: 3 },
    { tab: 4, i: 2 },
    { tab: 5, i: 1 },
  ],
  seals: [1, 0, 0],
});
assert.deepEqual(
  snap.traps.map((t) => t.id),
  ["rate-not-per-one", "stat-mean-out-of-range", "coord-xy-swapped"],
  "top three NAMED traps by count, ties by id; signatures and auto-keyed misses never travel",
);
assert.deepEqual(
  snap.focus.map((f) => `${f.kind}:${f.tab}.${f.i}`),
  ["teacher:2.3", "no-twin:3.1", "guessed:4.2"],
  "teacher flags first, one entry per place, at most three",
);
assert.equal(snap.certain, 1);
assert.equal(snap.fTeacher, 1);
assert.equal(snap.fNoTwin, 1);
assert.equal(C.decode(C.encode(snap)).ok, true, "a policy result always encodes");

// ---- trap hashes: no two real traps collide --------------------------------------------------------------------------
const ids = Object.keys(traps);
const byHash = new Map();
for (const id of ids) {
  const h = C.trapHash(id);
  assert.ok(h >= 0 && h <= 0xffffff, `${id}: hash fits 24 bits`);
  assert.ok(!byHash.has(h), `${id} and ${byHash.get(h)} share hash ${h}: rename one`);
  byHash.set(h, id);
}
assert.equal(C.trapHash("rate-not-per-one"), C.trapHash("rate-not-per-one"), "stable");
console.log(`${ids.length} traps, ${byHash.size} distinct hashes`);

// ---- Family Window ----------------------------------------------------------------------------------------------------
for (const [id, t] of Object.entries(traps)) {
  const a = C.askAtHome(t.fix, t.fixEs);
  assert.ok(
    a.q.endsWith("?") && a.qEs.startsWith("¿") && a.qEs.endsWith("?"),
    `${id}: both questions are questions`,
  );
  assert.equal(a.idea, t.fix, `${id}: the idea is the trap's own quick fix`);
  assert.equal(a.ideaEs, t.fixEs);
  assert.ok(a.q.length <= 140 && a.qEs.length <= 160, `${id}: the question is short`);
  assert.ok(!/\b(misconception|trap|algorithm)\b/i.test(a.q), `${id}: no jargon in the question`);
}
const asked = C.askAtHome(
  "Ask: would different people or cases give different answers? If everyone gets the same answer, it is not statistical.",
  "Pregunta: ¿darían respuestas diferentes distintas personas o casos? Si todos dan la misma, no es estadística.",
);
assert.equal(asked.q, "Would different people or cases give different answers?");
assert.equal(asked.qEs, "¿Darían respuestas diferentes distintas personas o casos?");
const generic = C.askAtHome("Check each step.", "Revisa cada paso.");
assert.equal(generic.q, "Can you explain this idea to me in your own words?");

console.log("studio pulse: OK");
