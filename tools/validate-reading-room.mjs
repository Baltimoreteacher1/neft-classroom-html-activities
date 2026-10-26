import assert from "node:assert/strict";
import fs from "node:fs";

const doc = JSON.parse(
  fs.readFileSync("access-practice-lab/content/reading-room/lessons.json", "utf8"),
);
const alignment = JSON.parse(
  fs.readFileSync("access-practice-lab/content/alignment-index.json", "utf8"),
);
const expected = new Set(alignment.expectationCatalog.map((x) => x.id));
const catalog = JSON.parse(fs.readFileSync("access-practice-lab/content/index.json", "utf8"));
const sourceIds = new Set();
for (const band of Object.values(catalog.bands || {}))
  for (const domain of Object.values(band.domains || {}))
    for (const level of Object.values(domain.levels || {}))
      for (const row of level.activities || []) sourceIds.add(row[0]);
assert.equal(doc.schemaVersion, 1);
assert.ok(
  Array.isArray(doc.lessons) && doc.lessons.length >= 100,
  `library requires at least 100 full lesson packages; found ${doc.lessons?.length || 0}`,
);
const ids = new Set(),
  grades = new Set(["1", "2-3", "4-5", "6-8", "9-12"]),
  uses = new Set(["Narrate", "Inform", "Explain", "Argue"]);
const activityTypes = new Set([
  "choice",
  "connector",
  "multi",
  "hotText",
  "cloze",
  "short",
  "evidence",
  "order",
  "sort",
]);
for (const l of doc.lessons) {
  assert.ok(l.id && /^[a-z0-9-]+$/.test(l.id));
  assert.ok(!ids.has(l.id), `duplicate lesson ${l.id}`);
  ids.add(l.id);
  assert.ok(l.revision && l.title && l.summary, `${l.id}: missing identity`);
  if (l.gradeCluster === null)
    assert.equal(l.localGradeBand, "3-5", `${l.id}: unspecified cluster requires local 3-5 band`);
  else assert.ok(grades.has(l.gradeCluster), `${l.id}: invalid grade cluster`);
  assert.ok(uses.has(l.keyUse), `${l.id}: invalid Key Language Use`);
  assert.ok(
    l.objectives?.content &&
      l.objectives?.language &&
      l.beforeReading?.essentialQuestion &&
      l.beforeReading?.purpose,
    `${l.id}: missing objectives or pre-reading`,
  );
  assert.ok(Array.isArray(l.paragraphs) && l.paragraphs.length >= 2, `${l.id}: missing passage`);
  const pids = new Set(l.paragraphs.map((p) => p.id));
  assert.equal(pids.size, l.paragraphs.length, `${l.id}: duplicate paragraph IDs`);
  const words = l.paragraphs.reduce(
    (n, p) => n + p.text.trim().split(/\s+/).filter(Boolean).length,
    0,
  );
  const minimum = l.sourceActivityId
    ? 40
    : l.gradeCluster === "1"
      ? 70
      : l.gradeCluster === "2-3"
        ? 80
        : 100;
  assert.ok(words >= minimum, `${l.id}: passage too short (${words}; minimum ${minimum})`);
  assert.ok(l.vocabulary?.length >= 3, `${l.id}: needs at least 3 vocabulary entries`);
  for (const v of l.vocabulary)
    assert.ok(v.term && v.definition && v.example, `${l.id}: incomplete vocabulary`);
  if (l.table)
    assert.ok(
      l.table.headers?.length && l.table.rows?.length && l.table.description,
      `${l.id}: table needs headers, rows, and description`,
    );
  if (l.map)
    assert.ok(l.map.items?.length && l.map.description, `${l.id}: map needs items and description`);
  assert.ok(l.activities?.length >= 4, `${l.id}: needs multiple activities`);
  for (const a of l.activities) {
    assert.ok(a.id && a.prompt && a.phase && a.skill, `${l.id}: incomplete activity`);
    assert.ok(activityTypes.has(a.type), `${l.id}/${a.id}: unsupported type ${a.type}`);
    if (a.type === "choice" || a.type === "connector")
      assert.ok(
        a.choices?.length >= 3 && a.choices.some((c) => c.id === a.answerId) && a.rationale,
        `${l.id}/${a.id}: invalid choice key/feedback`,
      );
    if (a.type === "multi" || a.type === "hotText")
      assert.ok(
        a.choices?.length >= 2 &&
          a.answerIds?.length &&
          a.answerIds.every((id) => a.choices.some((c) => c.id === id)) &&
          a.rationale,
        `${l.id}/${a.id}: invalid multi key/feedback`,
      );
    if (a.type === "cloze")
      assert.ok(
        a.segments?.some((s) => s.blank) &&
          a.segments
            .filter((s) => s.blank)
            .every((s) => s.blank.answer && s.blank.options?.includes(s.blank.answer)) &&
          a.rationale,
        `${l.id}/${a.id}: invalid cloze key`,
      );
    if (a.type === "evidence")
      assert.ok(
        a.paragraphIds?.every((x) => pids.has(x)) &&
          a.answerIds?.length &&
          a.answerIds.every((x) => pids.has(x)) &&
          a.rationale,
        `${l.id}/${a.id}: invalid evidence reference`,
      );
    if (a.type === "order")
      assert.deepEqual(
        [...a.answerOrder].sort(),
        a.items.map((x) => x.id).sort(),
        `${l.id}/${a.id}: order key mismatch`,
      );
    if (a.type === "sort")
      assert.ok(
        a.items?.length &&
          a.categories?.length &&
          a.items.every((x) => a.categories.includes(x.answer)),
        `${l.id}/${a.id}: invalid category key`,
      );
    if (a.type === "short")
      assert.ok(
        a.lookFor?.length && (a.model || a.rubric?.length),
        `${l.id}/${a.id}: needs response criteria and optional example`,
      );
  }
  assert.ok(
    l.teacherGuide?.miniLesson &&
      l.teacherGuide?.answerNotes?.length &&
      l.teacherGuide?.modelResponse,
    `${l.id}: incomplete teacher guide`,
  );
  assert.ok(
    l.familySupport?.directions?.en && l.familySupport?.directions?.es,
    `${l.id}: missing bilingual family directions`,
  );
  assert.equal(
    l.editorial?.status,
    "authored-pending-independent-editorial-review",
    `${l.id}: review status must be transparent`,
  );
  assert.match(
    l.alignmentStatus,
    /(educator review required|needs educator review)/i,
    `${l.id}: alignment status must disclose review need`,
  );
  for (const x of l.languageExpectations || [])
    assert.ok(expected.has(x), `${l.id}: unknown Language Expectation ${x}`);
  if (l.sourceActivityId)
    assert.ok(
      sourceIds.has(l.sourceActivityId),
      `${l.id}: missing source activity ${l.sourceActivityId}`,
    );
}
const coverage = Object.fromEntries(
  [...grades].map((g) => [g, doc.lessons.filter((l) => l.gradeCluster === g).length]),
);
coverage["3-5-local-unspecified"] = doc.lessons.filter((l) => l.gradeCluster === null).length;
console.log(
  `Reading Room: ${doc.lessons.length} authored lesson packages passed structural, answer-key, reference, and cross-link checks; coverage ${JSON.stringify(coverage)}. Target 100; human editorial review remains pending.`,
);
