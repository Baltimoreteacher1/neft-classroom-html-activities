/* =============================================================================
 * mentor-roster.test.mjs — guards the design rules behind Unit 0.
 * -----------------------------------------------------------------------------
 * Everything valuable about this roster is an invariant that is invisible once
 * it breaks. A missing coverage bucket still renders a perfectly nice page. A
 * `rep` tag leaking into a template still looks fine to whoever wrote it and
 * sorts children by race in production. A mentor pointing at a deleted lab
 * silently disappears from the only screen that can reach them. A typo in a
 * portrait feature draws NOTHING and the face just quietly loses its hair.
 *
 * So each of those is asserted here rather than trusted — including actually
 * running the avatar renderer over all 44 mentors, because "the data has a
 * `hair` value" and "that value draws something" are different claims.
 *
 * Runs under plain node via tools/run-tests.mjs. Both modules are browser
 * IIFEs, so they are evaluated against a minimal window stub.
 * ========================================================================== */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

function loadBrowserModule(file, globalName) {
  const src = readFileSync(resolve(HERE, file), "utf8");
  const win = {};
  new Function("window", src)(win);
  assert.ok(win[globalName], `${file} did not define window.${globalName}`);
  return win[globalName];
}

const R = loadBrowserModule("mentor-roster.js", "NTMentorRoster");
const A = loadBrowserModule("mentor-avatar.js", "NTMentorAvatar");

/* ── labs ──────────────────────────────────────────────────────────────── */
{
  assert.equal(R.labs.length, 8, "expected exactly 8 labs (one browse screen)");

  const seen = new Set();
  for (const lab of R.labs) {
    for (const field of ["id", "name", "move", "blurb", "sounds", "color", "emblem"]) {
      assert.ok(
        typeof lab[field] === "string" && lab[field].length > 0,
        `lab ${lab.id}: missing/empty "${field}"`,
      );
    }
    assert.ok(/^#[0-9a-f]{6}$/i.test(lab.color), `lab ${lab.id}: color must be #rrggbb`);
    assert.ok(lab.tryIt && lab.tryIt.prompt && lab.tryIt.answer, `lab ${lab.id}: missing tryIt`);
    assert.ok(!seen.has(lab.id), `duplicate lab id: ${lab.id}`);
    seen.add(lab.id);

    // Spanish for every short string a student reads on a lab card.
    for (const field of ["name", "move", "blurb", "sounds"]) {
      assert.ok(
        lab.es && typeof lab.es[field] === "string" && lab.es[field].length > 0,
        `lab ${lab.id}: missing Spanish "${field}"`,
      );
    }

    // Vocab-first is required on this surface, not optional.
    assert.ok(Array.isArray(lab.vocab) && lab.vocab.length >= 2, `lab ${lab.id}: needs 2+ vocab`);
    for (const w of lab.vocab) {
      for (const field of ["word", "def", "es"]) {
        assert.ok(
          typeof w[field] === "string" && w[field].length > 0,
          `lab ${lab.id}: vocab entry missing "${field}"`,
        );
      }
    }
  }
}

/* ── mentors: schema, uniqueness, lab resolution, ESOL fields ──────────── */
const REQUIRED = [
  "id",
  "name",
  "say",
  "years",
  "where",
  "lab",
  "rep",
  "thought",
  "simple",
  "did",
  "struggle",
];
{
  const ids = new Set();
  const labIds = new Set(R.labs.map((l) => l.id));

  for (const m of R.mentors) {
    for (const field of REQUIRED) {
      assert.ok(
        typeof m[field] === "string" && m[field].trim().length > 0,
        `mentor ${m.id || "(no id)"}: missing/empty "${field}"`,
      );
    }
    assert.ok(!ids.has(m.id), `duplicate mentor id: ${m.id}`);
    ids.add(m.id);
    assert.ok(labIds.has(m.lab), `mentor ${m.id}: lab "${m.lab}" does not exist`);

    // A struggle story that is one line is an achievement story wearing a hat.
    assert.ok(
      m.struggle.split(/\s+/).length >= 30,
      `mentor ${m.id}: struggle story too short to be a real one`,
    );

    // `simple` is the plain-language line. If it grows into a paragraph it has
    // stopped being the ESOL entry point.
    const simpleWords = m.simple.split(/\s+/).length;
    assert.ok(
      simpleWords <= 16,
      `mentor ${m.id}: "simple" is ${simpleWords} words — must stay <= 16`,
    );

    // FULL Spanish — the long story too. A student reading in Spanish must not
    // hit an English wall at the one paragraph that matters most.
    for (const field of ["thought", "simple", "did", "struggle"]) {
      assert.ok(
        m.es && typeof m.es[field] === "string" && m.es[field].length > 0,
        `mentor ${m.id}: missing Spanish "${field}"`,
      );
    }
    assert.ok(
      m.es.struggle.split(/\s+/).length >= 25,
      `mentor ${m.id}: Spanish struggle story looks truncated`,
    );
  }
}

/* ── portrait features must be real, drawable values ───────────────────── */
{
  const skins = new Set(Object.keys(A.SKIN));
  const hairColors = new Set(Object.keys(A.HAIR));
  const hairStyles = new Set(A.STYLES.hair);
  const beards = new Set(A.STYLES.beard);
  const glasses = new Set(A.STYLES.glasses);
  const clothes = new Set(A.STYLES.clothes);

  for (const m of R.mentors) {
    const f = m.face;
    assert.ok(f && typeof f === "object", `mentor ${m.id}: missing face`);
    assert.ok(skins.has(f.skin), `mentor ${m.id}: unknown skin "${f.skin}"`);
    assert.ok(hairColors.has(f.hairColor), `mentor ${m.id}: unknown hairColor "${f.hairColor}"`);
    assert.ok(hairStyles.has(f.hair), `mentor ${m.id}: unknown hair "${f.hair}"`);
    assert.ok(beards.has(f.beard), `mentor ${m.id}: unknown beard "${f.beard}"`);
    assert.ok(glasses.has(f.glasses), `mentor ${m.id}: unknown glasses "${f.glasses}"`);
    assert.ok(clothes.has(f.clothes), `mentor ${m.id}: unknown clothes "${f.clothes}"`);
  }
}

/* ── every portrait actually draws ─────────────────────────────────────────
 * A bad feature value renders an empty string rather than throwing, so the
 * only way to catch it is to render and look at the output.
 */
{
  for (const m of R.mentors) {
    const lab = R.getLab(m.lab);
    const svg = A.svg(m, lab, 72);
    assert.ok(typeof svg === "string" && svg.startsWith("<svg"), `${m.id}: no SVG produced`);
    assert.ok(svg.length > 900, `${m.id}: SVG suspiciously short (${svg.length} chars)`);
    assert.ok(svg.includes(m.name), `${m.id}: portrait missing its aria-label`);
    // the face itself, the eyes, and the mouth are non-negotiable
    assert.ok(svg.includes(A.SKIN[m.face.skin].base), `${m.id}: no skin fill in portrait`);
    assert.match(svg, /<ellipse cx="41"/, `${m.id}: portrait has no eyes`);
    assert.ok(svg.includes("#96574a"), `${m.id}: portrait has no mouth`);
  }
}

/* ── every lab is reachable with a real choice ─────────────────────────── */
{
  for (const lab of R.labs) {
    const inLab = R.mentorsInLab(lab.id);
    assert.ok(
      inLab.length >= 3,
      `lab ${lab.id} has only ${inLab.length} mentors — a student picking it gets a thin screen`,
    );
  }
}

/* ── coverage floors ───────────────────────────────────────────────────────
 * The roster is diverse BY CONSTRUCTION. This keeps it that way through future
 * edits. It is a build-time fact, never a UI feature.
 */
{
  const FLOOR = 6;
  const BUCKETS = [
    "black-men",
    "black-women",
    "hispanic-men",
    "hispanic-women",
    "white-men",
    "white-women",
    "additional",
  ];

  const counts = Object.fromEntries(BUCKETS.map((b) => [b, 0]));
  for (const m of R.mentors) {
    assert.ok(m.rep in counts, `mentor ${m.id}: unknown rep bucket "${m.rep}"`);
    counts[m.rep]++;
  }
  for (const b of BUCKETS) {
    assert.ok(counts[b] >= FLOOR, `coverage bucket "${b}" has ${counts[b]}, needs >= ${FLOOR}`);
  }
}

/* ── `rep` must never reach a student ──────────────────────────────────────
 * The whole point of the tag is that it is invisible. If any student-facing
 * surface reads it, the roster has become a way to sort children by race.
 */
{
  const SURFACES = [
    "assets/lesson-mentor.js",
    "assets/mentor-avatar.js",
    "mentor-lab/index.html",
    "mentor-lab/mentor-lab.js",
  ];
  for (const rel of SURFACES) {
    const full = resolve(ROOT, rel);
    assert.ok(existsSync(full), `expected surface missing: ${rel}`);
    const src = readFileSync(full, "utf8");
    const hit = src.match(/\.rep\b|\["rep"\]|'rep'|"rep"|\brep\s*:/);
    assert.equal(
      hit,
      null,
      `${rel} references the internal \`rep\` coverage tag (${hit && hit[0]}) — ` +
        `it must never be rendered, sorted on, or filtered by`,
    );
  }
}

/* ── ordering shown to students is alphabetical, never by bucket ───────── */
{
  const names = R.allMentors().map((m) => m.name);
  const sorted = names.slice().sort((a, b) => a.localeCompare(b));
  assert.deepEqual(names, sorted, "allMentors() must return A-Z by name");
  assert.equal(names.length, R.mentors.length, "allMentors() dropped or added entries");
}

/* ── the layer must not claim progress it did not grant ────────────────────
 * A mentor's lab is granted at selection, so awarding it again on mastery is a
 * reward animation for a no-op. Moves are collected by practising a Try-It in
 * Unit 0. Guard both halves of that contract.
 */
{
  const layer = readFileSync(resolve(ROOT, "assets/lesson-mentor.js"), "utf8");
  assert.ok(
    !/mastery_reached[\s\S]{0,200}earnMove/.test(layer),
    "lesson-mentor.js awards a move on mastery_reached — the mentor's own lab is " +
      "already held at selection, so this grants nothing while looking like progress",
  );
  const unit0 = readFileSync(resolve(ROOT, "mentor-lab/mentor-lab.js"), "utf8");
  assert.ok(
    /collectMove/.test(unit0) && /ml-tryit/.test(unit0),
    "mentor-lab.js must collect a move when a lab's Try-It is practised — " +
      "otherwise the 8-move collection can never grow",
  );
}

/* ── the long story must be rendered through the language helpers ──────────
 * Reading `m.struggle` / `m.did` directly is how a Spanish page silently falls
 * back to English on its most important paragraph.
 */
{
  const surfaces = {
    "mentor-lab/mentor-lab.js": ["mStruggle", "mDid"],
    "assets/lesson-mentor.js": ["mField"],
  };
  for (const [rel, helpers] of Object.entries(surfaces)) {
    const src = readFileSync(resolve(ROOT, rel), "utf8");
    for (const h of helpers) {
      assert.ok(src.includes(h), `${rel}: missing language helper ${h}()`);
    }
    for (const raw of ["m.struggle", "m.did", "mentor.struggle", "mentor.did"]) {
      assert.ok(
        !src.includes("esc(" + raw + ")"),
        `${rel} renders ${raw} directly — Spanish readers would get English there`,
      );
    }
  }
}

console.log(
  `mentor-roster: ${R.mentors.length} mentors across ${R.labs.length} labs, ` +
    `${R.mentors.length} portraits rendered, full EN+ES text — all checks passed`,
);
