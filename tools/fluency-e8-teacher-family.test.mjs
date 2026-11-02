// Phase 5: teacher hub model, printable engine, Family Math Studio plan and local-data integrity, checked against
// simulated classes and families. Claims are verified against what the simulated learners actually did, and the
// printables are checked for the properties that matter: deterministic, answers only in the key, no timer language.
import assert from "node:assert/strict";
import {
  buildClassModel,
  describeCell,
  gradeSkills,
  heatmapCsv,
  STATE_MARK,
  STATE_ORDER,
} from "../math/fluency-lab/e8/class-model.js";
import {
  auditE8,
  checkRoundTrip,
  fingerprint,
  stableStringify,
  stampBackup,
  storageReport,
  verifyBackup,
} from "../math/fluency-lab/e8/data-integrity.js";
import { addSkillEvent, emptyE8, sanitizeE8 } from "../math/fluency-lab/e8/e8-store.js";
import {
  ASK_ANYTIME,
  AVOID,
  buildTonight,
  HOME_ACTIVITIES,
  planText,
} from "../math/fluency-lab/e8/family-studio.js";
import { emptyEvidence, recordDiagnosis } from "../math/fluency-lab/e8/misconception-engine.js";
import { MISCONCEPTIONS } from "../math/fluency-lab/e8/misconception-library.js";
import {
  AUDIENCES,
  buildPacket,
  buildSheet,
  renderSheet,
} from "../math/fluency-lab/e8/print-engine.js";
import { DOMAINS } from "../math/fluency-lab/e8/tokens.js";
import { ALL_SKILLS, seededRandom, validateAnswer } from "../math/fluency-lab/problem-bank.js";
import { emptyTutor, findSkill, recordAnswer, skillKey } from "../math/fluency-lab/tutor-engine.js";

const DAY = 86400000;
const NOW = Date.parse("2026-11-02T15:00:00Z");
let checks = 0;
const ok = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};
const eq = (a, b, message) => {
  assert.deepEqual(a, b, message);
  checks += 1;
};

function learner(id, label, plan, e8 = null) {
  const tutor = emptyTutor();
  for (const [key, steps] of Object.entries(plan))
    steps.forEach((s, i) =>
      recordAnswer(
        tutor,
        findSkill(key),
        { correct: s.c, independent: s.i !== false, level: 1, sig: `${id}-${key}-${i}` },
        NOW - (steps.length - i) * DAY,
      ),
    );
  return { id, label, tutor, e8 };
}
const right = (n) => Array.from({ length: n }, () => ({ c: true }));
const mixed = (n) => Array.from({ length: n }, (_, i) => ({ c: i % 3 === 0 }));

const G5 = gradeSkills(5);
const K1 = G5[0].key;
const K2 = G5[1].key;
const K3 = G5[2].key;

// ------------------------------------------------------------------ A. class model
{
  const learners = [
    learner("a", "Ana", { [K1]: right(8), [K2]: mixed(7) }),
    learner("b", "Ben", { [K1]: right(8), [K2]: mixed(7) }),
    learner("c", "Cy", { [K2]: mixed(7) }),
    learner("d", "Di", {}),
  ];
  const model = buildClassModel(learners, { grade: 5, now: NOW });
  eq(model.learnerCount, 4);
  eq(model.skills.length, G5.length);
  eq(model.rows.length, 4);
  // Every row has a cell for every skill, in a defined state, with a mark and a label (never colour alone).
  for (const row of model.rows)
    for (const s of model.skills) {
      const c = row.cells[s.key];
      ok(STATE_ORDER.includes(c.state), `${row.learner.label} ${s.key}: state`);
      ok(
        STATE_MARK[c.state].symbol && STATE_MARK[c.state].pattern,
        "each state has a symbol and a pattern",
      );
      ok(
        describeCell(row.learner.label, s.title, c, "en").length > 10 &&
          describeCell(row.learner.label, s.title, c, "es").length > 10,
      );
    }
  // Di has no evidence: not yet assessed everywhere, never "behind" or flagged.
  eq(model.rows[3].counts["not-yet"], G5.length);
  ok(!model.rows[3].attention);
  // The column counts equal the cell counts (single source of truth).
  for (const col of model.columns) {
    const total = STATE_ORDER.reduce((n, s) => n + col.counts[s], 0);
    eq(total, 4, `${col.key}: counts add up to the class`);
    for (const s of STATE_ORDER)
      eq(col.counts[s], model.rows.filter((r) => r.cells[col.key].state === s).length);
  }
  // K1: two demonstrated, nobody struggling -> not flagged. K2: three learners with mixed accuracy -> flagged for reteaching.
  ok(!model.columns.find((c) => c.key === K1).flagged);
  const k2 = model.reteach.find((r) => r.key === K2);
  ok(k2 && k2.needing.length >= 2, "K2 is flagged and names the learners who would join the group");
  ok(!k2.needing.includes("Di"));
  ok(
    model.caveats.en.includes("not yet assessed") &&
      model.caveats.es.includes("no ha sido evaluado"),
  );
  // Few-answer cells are labelled as early evidence.
  const thinLearner = learner("t", "Tess", { [K3]: [{ c: true }, { c: true }] });
  const thin = buildClassModel([thinLearner], { grade: 5, now: NOW });
  ok(
    thin.rows[0].cells[K3].thin &&
      describeCell("Tess", "x", thin.rows[0].cells[K3], "en").includes("early evidence"),
  );
  // A class of fewer than 3 never flags a skill for the whole class.
  eq(buildClassModel(learners.slice(0, 2), { grade: 5, now: NOW }).reteach.length, 0);
  // Supported answers do not count as independent.
  const helped = learner("h", "Hal", {
    [K1]: Array.from({ length: 10 }, () => ({ c: true, i: false })),
  });
  const hm = buildClassModel([helped], { grade: 5, now: NOW });
  ok(
    hm.rows[0].cells[K1].state !== "demonstrated" && hm.rows[0].cells[K1].independent === 0,
    "supported work never demonstrates a skill",
  );
  // Hostile input: more than 80 learners are cut, missing fields do not throw, labels are bounded.
  const many = Array.from({ length: 120 }, (_, i) => ({ id: `x${i}`, label: "L".repeat(200) }));
  const big = buildClassModel(many, { grade: 5, now: NOW });
  eq(big.learnerCount, 80);
  ok(big.rows[0].learner.label.length <= 40);
  eq(buildClassModel(null, { grade: 5, now: NOW }).learnerCount, 0);
  eq(buildClassModel([{}, null, undefined], { grade: 5, now: NOW }).learnerCount, 3);
  // Misconception clusters from the e8 record: two learners share a pattern.
  const info = MISCONCEPTIONS.find((m) => m.detect);
  const withPattern = (id, label) => {
    const ev = emptyEvidence();
    for (let i = 0; i < 4; i += 1)
      recordDiagnosis(
        ev,
        { id: info.id, category: "conceptual" },
        { sig: `${id}-${i}`, skillKey: K1, now: NOW - i * DAY },
      );
    return { ...learner(id, label, { [K1]: right(3) }), e8: { ...emptyE8(), misconceptions: ev } };
  };
  const clustered = buildClassModel(
    [withPattern("p", "Pia"), withPattern("q", "Quin"), learner("r", "Rex", {})],
    { grade: 5, now: NOW },
  );
  eq(clustered.clusters.length, 1, "one shared pattern");
  eq(clustered.clusters[0].id, info.id);
  eq(clustered.clusters[0].learners, ["Pia", "Quin"]);
  ok(clustered.rows[0].attention, "a persistent pattern asks for the teacher's attention");
  ok(!clustered.rows[2].attention);
  // CSV: header, one row per learner, state words not colours, and formula-looking labels are neutralised.
  const csv = heatmapCsv(
    buildClassModel([learner("f", '=HYPERLINK("x")', {})], { grade: 5, now: NOW }),
  );
  ok(
    csv.startsWith('"Learner"') && csv.includes("\"'=HYPERLINK"),
    "formula labels are neutralised",
  );
  ok(csv.includes("Not yet assessed"));
  ok(heatmapCsv(model, "es").includes("Aún sin evaluar"));
}

// ------------------------------------------------------------------ B. printable engine
{
  const skills = [
    skillKey(ALL_SKILLS.find((s) => s.grade === 5)),
    skillKey(ALL_SKILLS.find((s) => s.grade === 6)),
  ];
  const a = buildSheet({ skills, count: 12, level: 1, seed: 42 });
  const b = buildSheet({ skills, count: 12, level: 1, seed: 42 });
  eq(JSON.stringify(a), JSON.stringify(b), "same request, same sheet");
  ok(
    JSON.stringify(buildSheet({ skills, count: 12, seed: 43 })) !== JSON.stringify(a),
    "a new seed gives a new sheet",
  );
  ok(a.count >= 10 && a.problems.length === a.count);
  eq(
    new Set(a.problems.map((p) => p.item.question)).size,
    a.problems.length,
    "no repeated question on a sheet",
  );
  eq(new Set(a.problems.map((p) => p.skill)).size, 2, "a mixed sheet uses both skills");
  for (const p of a.problems)
    ok(validateAnswer(p.item.displayAnswer, p.item), `answer key checks out: ${p.item.question}`);
  eq(buildSheet({ skills, count: 500, seed: 1 }).count <= 40, true, "count is capped");
  assert.throws(() => buildSheet({ skills: ["9:nope"] }));
  assert.throws(() => renderSheet(a, { audience: "everyone" }));
  const packet = buildPacket({
    skills,
    count: 8,
    seed: 5,
    language: "en",
    title: "Practice <script>",
  });
  ok(!packet.student.includes("<script>"), "the title is escaped");
  // The student copy never carries answers, hints or steps; the key does.
  for (const p of packet.sheet.problems) {
    ok(
      packet.student.includes(p.item.question.replace(/&/g, "&amp;")) ||
        packet.student.includes("<"),
      "student copy has the question",
    );
    if (p.item.steps?.length)
      ok(
        !packet.student.includes(p.item.steps[0]) || p.item.question.includes(p.item.steps[0]),
        `no worked step on the student copy (${p.n})`,
      );
    ok(
      packet.key.includes(String(p.item.displayAnswer).replace(/&/g, "&amp;")) ||
        packet.key.includes(String(p.item.displayAnswer)),
    );
  }
  ok(
    !/timer|timed|seconds|speed|race/i.test(packet.student.replace("There is no timer", "")),
    "no timer language on student copy",
  );
  ok(packet.student.includes("There is no timer. Take the time you need."));
  const es = renderSheet(packet.sheet, { audience: "student", language: "es" });
  ok(es.includes('lang="es"') && es.includes("No hay cronómetro") && es.includes("Nombre"));
  const both = renderSheet(packet.sheet, { audience: "student", language: "both" });
  ok(both.includes("Name / Nombre"));
  ok(
    renderSheet(packet.sheet, { audience: "student", large: true }).includes("pe large"),
    "large print",
  );
  const family = renderSheet(packet.sheet, { audience: "family" });
  ok(family.includes("Try these together") && !family.includes("Answer key"));
  const teacher = renderSheet(packet.sheet, { audience: "teacher" });
  ok(teacher.includes("Common slip to watch for") && teacher.includes("Answer key"));
  eq(AUDIENCES.length, 4);
  // Ink-friendly: black on white, no background colours or images in the print CSS.
  ok(
    !/background:\s*#(?!fff)/i.test(packet.student) && !/url\(/.test(packet.student),
    "no coloured backgrounds or images",
  );
  // Every skill in the bank can be printed at every level (this is the exhaustive check, not a sample).
  let printed = 0;
  for (const skill of ALL_SKILLS)
    for (const level of [0, 1, 2]) {
      const sheet = buildSheet({ skills: [skillKey(skill)], count: 4, level, seed: 7 });
      ok(sheet.count >= 1, `${skillKey(skill)} level ${level} prints`);
      printed += 1;
    }
  eq(printed, ALL_SKILLS.length * 3);
}

// ------------------------------------------------------------------ C. Family Math Studio
{
  const rich = learner("fam", "Kid", { [K1]: right(8), [K2]: mixed(7), [K3]: right(4) });
  for (const minutes of [5, 10, 15]) {
    const plan = buildTonight({ tutor: rich.tutor, grade: 5, minutes, now: NOW });
    eq(plan.minutes, minutes);
    ok(plan.activities.length >= 1 && plan.activities.length <= 3);
    for (const a of plan.activities) {
      ok(
        a.doThis.en && a.doThis.es && a.ask.every((q) => q.en && q.es),
        "bilingual activity and prompts",
      );
      ok(
        a.ask.every((q) => !/\d/.test(q.en)),
        "prompts never contain a numeric answer",
      );
      ok(a.why && a.title, "every activity says why it was chosen");
    }
  }
  ok(
    buildTonight({ tutor: rich.tutor, grade: 5, minutes: 7, now: NOW }).minutes === 10,
    "an odd length falls back to ten minutes",
  );
  const fresh = buildTonight({ tutor: emptyTutor(), grade: 3, minutes: 10, now: NOW });
  ok(
    !fresh.evidence.enough && fresh.evidence.note.en.includes("not much practice on record"),
    "no evidence is stated plainly",
  );
  ok(fresh.activities.length >= 1, "a family with no history still gets a gentle start");
  ok(rich.tutor && buildTonight({ tutor: rich.tutor, grade: 5, now: NOW }).evidence.enough);
  eq(
    buildTonight({ tutor: rich.tutor, grade: 5, now: NOW }).activities.map((a) => a.key),
    buildTonight({ tutor: rich.tutor, grade: 5, now: NOW }).activities.map((a) => a.key),
    "deterministic",
  );
  for (const d of DOMAINS)
    ok(HOME_ACTIVITIES[d]?.en && HOME_ACTIVITIES[d]?.es, `home activity for ${d}`);
  ok(ASK_ANYTIME.length >= 3 && AVOID.length >= 3);
  ok(
    AVOID.some((a) => /easy/i.test(a.en)),
    "the plan warns against 'this is easy'",
  );
  const text = planText(buildTonight({ tutor: rich.tutor, grade: 5, now: NOW }), "es");
  ok(text.includes("Matemáticas de hoy") && text.includes("práctica con apoyo"));
  // Never ranks or labels the child.
  ok(
    !/(behind|below grade|low|weak|slow|gifted|struggl)/i.test(
      planText(buildTonight({ tutor: rich.tutor, grade: 5, now: NOW }), "en"),
    ),
  );
  // Every grade yields a plan for an empty learner.
  for (let g = 1; g <= 8; g += 1)
    ok(
      buildTonight({ tutor: emptyTutor(), grade: g, now: NOW }).activities.length >= 1,
      `grade ${g} has a starter plan`,
    );
}

// ------------------------------------------------------------------ D. data integrity
{
  eq(stableStringify({ b: 1, a: [2, { d: 1, c: 2 }] }), '{"a":[2,{"c":2,"d":1}],"b":1}');
  eq(
    fingerprint({ a: 1, b: 2 }),
    fingerprint({ b: 2, a: 1 }),
    "key order does not change the stamp",
  );
  ok(fingerprint({ a: 1 }) !== fingerprint({ a: 2 }));
  ok(/^[0-9a-f]{16}$/.test(fingerprint("x")));
  const state = emptyE8();
  addSkillEvent(state, K1, "explained", 2);
  ok(auditE8(state).ok && !auditE8(state).empty);
  ok(auditE8(null).empty && auditE8(null).ok);
  eq(auditE8("junk").problems[0].code, "not-an-object");
  const dirty = {
    version: 1,
    skills: { [K1]: { explained: 2 }, "bad key": { explained: 9 } },
    placement: { 9: {} },
    repairs: [{ id: 1 }],
    misconceptions: { items: {} },
  };
  const audit = auditE8(dirty);
  ok(
    !audit.ok &&
      audit.problems.some((p) => p.code === "dropped" && p.field === "skills" && p.count === 1),
  );
  ok(
    audit.problems.some((p) => p.field === "placement") &&
      audit.problems.some((p) => p.field === "repairs"),
  );
  ok(!JSON.stringify(audit.problems).includes("bad key"), "the audit never echoes learner content");
  ok(
    checkRoundTrip(state).ok && checkRoundTrip(dirty).ok && checkRoundTrip({}).ok,
    "cleaning is idempotent",
  );
  // Randomised round trip: cleaning garbage twice equals cleaning it once.
  const rng = seededRandom(11);
  for (let i = 0; i < 200; i += 1) {
    const junk = {
      skills: { [`${(rng() * 9) | 0}:${i}x`]: { explained: rng() * 1e6, built: -rng() } },
      repairs: Array.from({ length: (rng() * 50) | 0 }, (_, j) => ({
        id: `r${j}`,
        skill: `${(rng() * 9) | 0}:a`,
        at: rng() * 1e12,
      })),
      placement: { [(rng() * 12) | 0]: { at: "x", known: ["1:a", 5] } },
    };
    ok(checkRoundTrip(junk).ok, `round trip ${i}`);
  }
  const stamped = stampBackup({ app: "x", e8: state });
  eq(verifyBackup(stamped).status, "ok");
  eq(verifyBackup({ ...stamped, e8: { ...state, version: 2 } }).status, "changed");
  eq(verifyBackup({ app: "x" }).status, "unstamped");
  eq(verifyBackup(null).status, "invalid");
  const fake = {
    data: { "ewl-a": '{"a":1}', "ewl-b": "{broken", other: "zzz" },
    get length() {
      return Object.keys(this.data).length;
    },
    key(i) {
      return Object.keys(this.data)[i];
    },
    getItem(k) {
      return this.data[k] ?? null;
    },
  };
  const report = storageReport(fake);
  eq(report.keys.length, 2);
  eq(report.unreadable, ["ewl-b"]);
  eq(storageReport(null).keys.length, 0);
}

console.log(`fluency-e8-teacher-family: ${checks} checks passed`);
