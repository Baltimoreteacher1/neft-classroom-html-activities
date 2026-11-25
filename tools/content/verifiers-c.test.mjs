// Tests for content verifiers C (no-manipulatives, duplicates, sensitivity, alt-text) and the verifier-counts publisher that feeds
// the review queue. Run: node --test tools/content/verifiers-c.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { indexRows } from "../../functions/_lib/review/blocks.js";
import { onRequest as queueRoute } from "../../functions/api/review/queue.js";
import { VERIFIER_COUNTS } from "../../shared/content-schema/review-verifier-counts.js";
import { call, newEnv } from "../review-test-kit.mjs";
import {
  blockIdOf,
  countFindings,
  isStale,
  mappingControl,
  render,
} from "./publish-verifier-counts.mjs";
import { REGISTRY } from "./registry.mjs";
import * as altText from "./verifiers/alt-text.mjs";
import * as duplicates from "./verifiers/duplicates.mjs";
import { loadTarget } from "./verifiers/lib/targets.mjs";
import * as manips from "./verifiers/no-manipulatives.mjs";
import * as sensitivity from "./verifiers/sensitivity.mjs";
import { runControls } from "./verify.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const NAMES = ["alt-text", "duplicates", "no-manipulatives", "sensitivity"];
const node = (script, args, env = {}) =>
  spawnSync(process.execPath, [path.join(HERE, script), ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
const loud = (findings) => findings.filter((f) => f.severity !== "info");
const codesOf = (findings) => new Set(loud(findings).map((f) => f.code));
const mathUnit = (studio, lessons = []) => ({
  id: "t-math",
  grade: "K",
  subject: "Math",
  studio,
  lessons,
});

test("every C verifier is registered and passes its own negative and positive controls", async () => {
  for (const name of NAMES) {
    assert.ok(REGISTRY[name], `${name} registered`);
    const mod = await REGISTRY[name]();
    assert.equal(mod.name, name);
    const problems = await runControls(name, mod);
    assert.deepEqual(problems, [], problems.join("\n"));
  }
});

test("a detector that stops firing makes the CLI exit 3 (negative control trips)", () => {
  const drops = {
    "no-manipulatives": "MANIP_DIRECTIVE",
    duplicates: "DUP_GENERIC_BOILERPLATE",
    sensitivity: "SENS_VIOLENCE_K5",
    "alt-text": "ALT_MISSING",
  };
  for (const [name, code] of Object.entries(drops)) {
    const r = node("verify.mjs", [`--verifier=${name}`, "--unit=gk-math-u1"], {
      CONTENT_VERIFY_FAULT_DROP: code,
    });
    assert.equal(r.status, 3, `${name}: ${r.stderr}`);
    assert.match(r.stderr, /negative control/);
  }
});

test("ratchet: a baseline lowered below the measured count makes the CLI exit 1; the committed one passes", () => {
  const unit = "gk-math-u2";
  const pass = node("verify.mjs", ["--verifier=no-manipulatives", `--unit=${unit}`]);
  assert.equal(pass.status, 0, pass.stdout + pass.stderr);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vc-base-"));
  try {
    for (const f of fs.readdirSync(path.join(HERE, "baselines")))
      fs.copyFileSync(path.join(HERE, "baselines", f), path.join(dir, f));
    const file = path.join(dir, "no-manipulatives.json");
    const base = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.ok(base.units[unit].MANIP_MATERIAL > 0);
    base.units[unit].MANIP_MATERIAL -= 1;
    fs.writeFileSync(file, JSON.stringify(base));
    const r = node("verify.mjs", ["--verifier=no-manipulatives", `--unit=${unit}`], {
      CONTENT_VERIFY_BASELINE_DIR: dir,
    });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /NEW gk-math-u2 MANIP_MATERIAL/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("no-manipulatives: handling is flagged, drawing and look-alike words are not", () => {
  const v = (mission) => codesOf(manips.verify(mathUnit({ activities: [{ mission }] })));
  assert.ok(v("Put 4 red cubes on your desk.").has("MANIP_DIRECTIVE"));
  assert.ok(
    v("Listen to each command and show it with your red and blue cubes.").has("MANIP_DIRECTIVE"),
  );
  assert.ok(v("Act it out with the counters.").has("MANIP_DIRECTIVE"));
  assert.equal(v("Show how 5 + 3 can be written as a sentence about cubes.").size, 0); // "show" without "with" is ordinary
  assert.ok(v("Use counters to show the boats you hear.").has("MANIP_DIRECTIVE"));
  assert.ok(v("Build 352 with blocks.").has("MANIP_DIRECTIVE"));
  assert.ok(v("Roll two dice and add them.").has("MANIP_DIRECTIVE"));
  assert.ok(
    v("Flipping a coin and spinning a spinner is a compound event.").has("MANIP_ACTION_MENTION"),
  );
  assert.equal(v("Draw 7 counters on the ten frame.").size, 0);
  assert.equal(v("Bed 2 has 5 bean plants and 8 squash plants.").size, 0);
  assert.equal(v("Tap the audio button and say the word.").size, 0);
  assert.equal(v("The ice cube melts and the cubic unit is small.").size, 0);
  const material = manips.verify(mathUnit({ activities: [{ materials: ["Counters"] }] }));
  assert.ok(codesOf(material).has("MANIP_MATERIAL"));
  // weak nouns only count in math and science
  const ela = {
    ...mathUnit({ activities: [{ mission: "Put the chips on the plate." }] }),
    subject: "ELA",
  };
  assert.equal(codesOf(manips.verify(ela)).size, 0);
  // quoted card text is judged where it is authored
  assert.equal(v("Say the sentence “Put 4 cubes on the desk” aloud.").size, 0);
});

test("no-manipulatives recall: a directive planted in a real unit and a real lesson is flagged at its path", async () => {
  const target = await loadTarget("g6-math-u2");
  const before = loud(manips.verify(target)).length;
  target.studio.activities[0].mission = "Put 4 red cubes on your desk.";
  target.lessons[2].arc[0].activity.mission = "Line up the counters in two rows.";
  const after = loud(manips.verify(target));
  assert.equal(after.length, before + 2);
  const paths = after.map((f) => f.path);
  assert.ok(paths.includes("studio.activities[0].mission"));
  assert.ok(paths.includes("lessons[2].arc[0].activity.mission"));
});

test("real content: manipulative text is reported where the K math and grade 6 ratio units hold it", async () => {
  const hit = async (id) => loud(manips.verify(await loadTarget(id))).length;
  assert.ok((await hit("gk-math-u2")) > 0);
  assert.ok((await hit("g6-math-u2")) > 0);
  assert.equal(await hit("gk-ela-u1"), 0);
});

test("duplicates: exact and near twins across units, template-bound text, residue and title leaks", async () => {
  const mission = "Read the clues carefully before you choose the answer that fits best.";
  const unit = (id, text, extra = {}) => ({
    id,
    grade: "3",
    subject: "ELA",
    unitTitle: "Cause and Effect",
    studio: { vocab: [{ term: "cause" }], activities: [{ mission: text }] },
    lessons: [],
    ...extra,
  });
  const peer = (n, text) =>
    Array.from({ length: n }, (_, i) => unit(`p${i}`, text, { unitTitle: "Maps" }));
  const three = codesOf(await duplicates.verify(unit("a", mission, { peers: peer(3, mission) })));
  assert.ok(three.has("DUP_GENERIC_BOILERPLATE"));
  const two = codesOf(await duplicates.verify(unit("a", mission, { peers: peer(2, mission) })));
  assert.ok(two.has("DUP_NEAR_IDENTICAL") && !two.has("DUP_GENERIC_BOILERPLATE"));
  const none = codesOf(await duplicates.verify(unit("a", mission, { peers: [] })));
  assert.equal(none.size, 0);
  // a quoted slot makes the string a template, not boilerplate
  const slotted =
    "Point to the picture clue “A red barn beside a tall silo”, say the word, then say the sentence.";
  assert.equal(
    codesOf(await duplicates.verify(unit("a", slotted, { peers: peer(5, slotted) }))).size,
    0,
  );
  // exempt scaffold paths are not compared
  const scaffold = unit("a", "x", {
    studio: { vocab: [], activities: [{ support: { l1_2: mission } }] },
    peers: peer(5, mission),
  });
  assert.equal(codesOf(await duplicates.verify(scaffold)).size, 0);
  const leak = unit(
    "a",
    "Cards for Cause and Effect help you learn. Find the {name} here and the [slot] there.",
  );
  const found = codesOf(await duplicates.verify(leak));
  assert.ok(found.has("LEAK_TITLE_TEMPLATE") && found.has("LEAK_TEMPLATE_RESIDUE"));
  const cloze = unit("a", "He has 8 {2} buttons and {3} more in the box.");
  assert.equal(codesOf(await duplicates.verify(cloze)).size, 0);
});

test("duplicates: every real unit is compared and the checked count is large", async () => {
  const f = await duplicates.verify(await loadTarget("g3-math-u3"));
  const checked = f.find((x) => x.code === "DUP_CHECKED");
  assert.ok(checked.evidence.n > 100);
});

test("sensitivity: assists only on the lists it documents, never on look-alikes", () => {
  const t = (grade, subject, text) => ({
    id: "s",
    grade,
    subject,
    studio: { activities: [{ mission: text }] },
    lessons: [],
  });
  const c = (grade, subject, text) => codesOf(sensitivity.verify(t(grade, subject, text)));
  assert.ok(c("2", "ELA", "The man pulled a knife.").has("SENS_VIOLENCE_K5"));
  assert.equal(c("7", "ELA", "The man pulled a knife.").size, 0); // K-5 only
  assert.equal(
    c("2", "Science", "Plant shoots grow fast. He will shoot a basketball. Kill time.").size,
    0,
  );
  assert.ok(c("4", "ELA", "All girls are bad at science.").has("SENS_STEREOTYPE"));
  assert.equal(c("5", "Social Studies", "All men are created equal.").size, 0);
  assert.ok(c("3", "Math", "Dad fixes the car every day.").has("SENS_GENDER_ROLE"));
  assert.equal(c("3", "Math", "He fixes the car and she cooks dinner.").size, 0); // pronouns are characters, not claims
  assert.ok(c("3", "Math", "Bring 12 hot dogs to the picnic.").has("SENS_CULTURAL_NARROW"));
  assert.equal(
    c("3", "ELA", "Bring 12 hot dogs to the picnic.").has("SENS_CULTURAL_NARROW"),
    false,
  );
});

test("sensitivity: name skew uses the closed list, gender only, and needs enough mentions", () => {
  const tally = (names) => sensitivity.nameTally(names.map((n) => `${n} has 3 pencils.`));
  assert.equal(sensitivity.nameSkew(tally(["Marcus", "Marcus", "Marcus"])), null); // too few mentions
  assert.match(sensitivity.nameSkew(tally(Array(14).fill("Marcus"))), /1 distinct name/);
  const mixed = [
    "Mia",
    "Marcus",
    "Zoe",
    "Dev",
    "Rosa",
    "Kai",
    "Ana",
    "Jordan",
    "Eli",
    "Nia",
    "Lee",
    "Sam",
  ];
  assert.equal(sensitivity.nameSkew(tally([...mixed, ...mixed])), null);
  const boys = ["Marcus", "Dev", "Kai", "Eli", "Sam", "Leo", "Ben"];
  assert.match(sensitivity.nameSkew(tally([...boys, ...boys, ...boys])), /one gender is 100%/);
  assert.equal(sensitivity.nameTally(["Bay and Summer and Harbor"]).total, 0); // not on the list
});

test("alt-text: missing, weak, external, decorative and icon-only references", () => {
  const t = (studio, lessons = []) => ({ id: "a", grade: "3", subject: "ELA", studio, lessons });
  const c = (studio, lessons) => codesOf(altText.verify(t(studio, lessons)));
  assert.ok(c({ f: { src: "/images/a.png" } }).has("ALT_MISSING"));
  assert.ok(c({ f: { src: "/images/a.png", alt: "photo" } }).has("ALT_WEAK"));
  assert.ok(c({ f: { src: "/images/a.png", alt: "a.png" } }).has("ALT_WEAK"));
  assert.ok(
    c({ f: { src: "//cdn.example.com/a.png", alt: "A red barn" } }).has("ALT_EXTERNAL_IMAGE"),
  );
  assert.ok(
    c({ f: { src: "/images/a.svg", decorative: true, alt: "frame" } }).has(
      "ALT_DECORATIVE_HAS_ALT",
    ),
  );
  assert.ok(c({ o: [{ icon: "x" }] }).has("ALT_ICON_ONLY"));
  assert.ok(c({}, [{ id: "l", media: { images: ["/a.png"] } }]).has("ALT_MISSING"));
  assert.ok(c({ n: '<img src="/a.png">' }).has("ALT_MISSING"));
  assert.equal(
    c({
      f: { src: "/images/a.png", alt: "A red barn in a field" },
      g: { src: "/b.svg", decorative: true },
    }).size,
    0,
  );
  assert.equal(c({ f: { href: "/downloads/worksheet.pdf" } }).size, 0);
  assert.equal(c({ n: '<img src="/a.png" alt="A cow">' }).size, 0);
});

test("alt-text: the real content has picture cues and no inline images, and the sweep reports so", async () => {
  const f = altText.verify(await loadTarget("g4-sci-u2"));
  assert.ok(f.find((x) => x.code === "ALT_CUES_CHECKED").evidence.n > 10);
  assert.equal(f.find((x) => x.code === "ALT_REFS_CHECKED").evidence.n, 0);
  assert.equal(loud(f).length, 0);
});

test("publisher: findings land in the lesson block or the unit studio block, info is not counted", () => {
  const target = { id: "u1", lessons: [{ id: "u1-l01" }, { id: "u1-l02" }] };
  assert.equal(blockIdOf(target, "lessons[1].arc[0]"), "u1-l02");
  assert.equal(blockIdOf(target, "studio.vocab[0]"), "u1:studio");
  assert.equal(blockIdOf(target, ""), "u1:studio");
  assert.equal(blockIdOf(target, "lessons[9]"), "u1:studio");
  assert.deepEqual(
    countFindings(target, [
      { severity: "warn", path: "lessons[0]" },
      { severity: "error", path: "lessons[0].x" },
      { severity: "info", path: "lessons[0]" },
    ]),
    { "u1-l01": 2 },
  );
  assert.deepEqual(mappingControl(), []);
});

test("publisher: output is deterministic and a changed table is stale", () => {
  const table = { b: { "u1:studio": 2 }, a: {}, "alt-text": { "u1-l01": 1 } };
  const text = render(table);
  assert.equal(text, render({ "alt-text": { "u1-l01": 1 }, a: {}, b: { "u1:studio": 2 } }));
  assert.match(text, /export default \{/);
  assert.ok(!/\//.test(text.replace(/^\/\/.*$/gm, "")), "no path-like text outside comments");
  assert.equal(isStale(text, table), false);
  assert.equal(isStale(text, { ...table, b: { "u1:studio": 3 } }), true);
});

test("publisher: --check exits 1 on a tampered copy and on a missing file (the committed file is gated by validate:content-verifier-counts)", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vc-counts-"));
  try {
    const live = path.join(HERE, "../../functions/_lib/review-generated/verifier-counts.js");
    const copy = path.join(dir, "verifier-counts.js");
    fs.writeFileSync(
      copy,
      fs
        .readFileSync(live, "utf8")
        .replace("export default {", "export default {\n  fake: { x: 1 },"),
    );
    const stale = node("publish-verifier-counts.mjs", ["--check"], { CONTENT_COUNTS_FILE: copy });
    assert.equal(stale.status, 1, stale.stdout + stale.stderr);
    assert.match(stale.stderr, /STALE/);
    const missing = node("publish-verifier-counts.mjs", ["--check"], {
      CONTENT_COUNTS_FILE: path.join(dir, "nope.js"),
    });
    assert.equal(missing.status, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("queue with the REAL generated counts: the verifier filter returns exactly the blocks that failed", async () => {
  const names = Object.keys(VERIFIER_COUNTS);
  for (const v of [
    "alt-text",
    ...NAMES,
    "cognate",
    "frames",
    "spanish",
    "standards",
    "arithmetic",
    "readability",
    "vocab-tier",
  ])
    assert.ok(names.includes(v), `${v} published`);
  const rows = await indexRows({});
  const ids = new Set(rows.map((r) => r.id));
  for (const [v, byBlock] of Object.entries(VERIFIER_COUNTS))
    for (const id of Object.keys(byBlock)) assert.ok(ids.has(id), `${v}: ${id} is a real block`);
  const { env } = newEnv();
  for (const v of ["no-manipulatives", "sensitivity", "duplicates"]) {
    const want = Object.keys(VERIFIER_COUNTS[v]).sort();
    assert.ok(want.length > 0, `${v} has failing blocks`);
    const res = await call(queueRoute, env, { path: `/api/review/queue?verifier=${v}&limit=200` });
    assert.equal(res.status, 200);
    assert.equal(res.json.total, want.length);
    const got = res.json.items.map((i) => i.id).sort();
    assert.deepEqual(
      got,
      want.slice(0, 200).length === got.length ? want.slice(0, got.length) : got,
    );
    for (const item of res.json.items) {
      assert.equal(item.verifierFailures[v], VERIFIER_COUNTS[v][item.id]);
      assert.ok(item.verifierFailureTotal >= item.verifierFailures[v]);
    }
  }
  const none = await call(queueRoute, env, {
    path: "/api/review/queue?verifier=arithmetic&limit=200",
  });
  assert.equal(none.json.total, Object.keys(VERIFIER_COUNTS.arithmetic).length);
  const unknown = await call(queueRoute, env, {
    path: "/api/review/queue?verifier=no-such-verifier",
  });
  assert.equal(unknown.json.total, 0);
});
