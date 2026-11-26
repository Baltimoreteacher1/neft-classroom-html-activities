// Customize Activity adapters: every source item of every family, extracted, normalized, validated, graded against its
// own key, stripped for students, and proven to leave the platform original untouched.
//   node --test tools/studio-customize-adapters.test.mjs
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  coverageRows,
  ROWS,
  STATUSES,
} from "../access-practice-lab/src/studio/adapters/coverage.js";
import {
  editableFor,
  PROPERTY_IDS,
  presentProperties,
} from "../access-practice-lab/src/studio/adapters/properties.js";
import {
  ADAPTERS,
  adapterFor,
  CustomizeError,
  customizeFrom,
  hashSource,
  listFamilies,
} from "../access-practice-lab/src/studio/adapters/registry.js";
import { stableStringify } from "../access-practice-lab/src/studio/adapters/util.js";
import { checkResponse, marksOf } from "../access-practice-lab/src/studio/core/check.js";
import { normalizeActivity } from "../access-practice-lab/src/studio/core/schema.js";
import { BCPSS_UNITS } from "../data/bcpss-curriculum-seed.mjs";
import { studentCopyFor } from "../access-practice-lab/src/studio/core/student-copy.js";
import {
  assertMatchCoversVocab,
  BEFORE,
  bankKey,
  bilingual,
  deps,
  draftKey,
  EXPECTED,
  fetchJson,
  GRADED,
  isSubset,
  keyResponse,
  LISTED,
  NOW,
  questions,
  ROOT,
  read,
  SAFE_PATH,
  sourceFingerprint,
  wrongResponse,
} from "./studio-customize-adapters-helpers.mjs";
import { renderMatrix, withMatrix } from "./studio-customize-coverage.mjs";

// ---- the sweeps ----
const present = new Map(); // family -> union of present properties over every draft
const warnings = new Map(); // family -> { code: count }
const results = new Map(); // family -> [{ ref, made }]

async function sweep(family) {
  const adapter = adapterFor(family);
  const listed = await adapter.list({ fetchJson });
  assert.equal(listed.length, LISTED[family], `${family}: listed ${listed.length}`);
  assert.equal(
    new Set(listed.map((l) => l.id)).size,
    listed.length,
    `${family}: duplicate ids in the listing`,
  );
  const union = new Set();
  const warn = {};
  const out = [];
  for (const entry of listed) {
    assert.ok(entry.id && entry.title, `${family}: a listing entry has no id or title`);
    const made = await customizeFrom(family, entry.id, deps);
    out.push({ ref: entry.id, made, entry });
    const a = made.activity;
    const at = `${family}/${entry.id}`;
    assert.match(a.id, /^s[a-f0-9]{10}$/, `${at}: id`);
    assert.equal(a.rev, 0, `${at}: rev`);
    assert.equal(a.createdAt, NOW);
    assert.equal(a.updatedAt, NOW);
    assert.deepEqual(normalizeActivity(a), a, `${at}: normalize is not idempotent`);
    assert.deepEqual(made.validation.errors, [], `${at}: validation errors`);
    for (const w of made.validation.warnings) warn[w.code] = (warn[w.code] || 0) + 1;
    // lineage
    assert.equal(a.lineage.family, family);
    assert.equal(a.lineage.ref, entry.id);
    assert.ok(a.lineage.title, `${at}: lineage title`);
    assert.match(a.lineage.sourceHash, /^[0-9a-f]{14}$/);
    assert.ok(a.lineage.url === "" || SAFE_PATH.test(a.lineage.url), `${at}: lineage url`);
    // no clipping, no dropped fields: every value the adapter wrote survived normalization
    const raw = (await adapter.extract(entry.id, deps)).activity;
    const { standards: _s, ...rawContext } = raw.context;
    isSubset(
      { blocks: raw.blocks, notes: raw.notes, context: rawContext },
      { blocks: a.blocks, notes: a.notes, context: a.context },
      at,
    );
    // one question per item
    assert.equal(questions(a).length, await EXPECTED[family](entry.id), `${at}: question count`);
    // draft is deterministic
    assert.equal(
      stableStringify((await customizeFrom(family, entry.id, deps)).activity),
      stableStringify(a),
      `${at}: not deterministic`,
    );
    // editable properties are real
    const props = presentProperties(a);
    for (const p of props) union.add(p);
    for (const p of made.editable)
      assert.ok(props.includes(p), `${at}: editable lists ${p}, which the draft lacks`);
    assert.deepEqual(made.editable, editableFor(adapter, a));
    // every graded question accepts its key and rejects a wrong answer
    for (const q of questions(a)) {
      if (GRADED.has(q.format)) {
        assert.equal(
          checkResponse(q, keyResponse(q)).status,
          "correct",
          `${at}/${q.id}: key rejected`,
        );
        assert.equal(
          checkResponse(q, wrongResponse(q)).status,
          "incorrect",
          `${at}/${q.id}: wrong answer accepted`,
        );
        assert.equal(
          checkResponse(
            q,
            q.format === "multi"
              ? []
              : q.format === "blank"
                ? [""]
                : q.format === "choice"
                  ? ""
                  : {},
          ).status,
          "empty",
        );
      } else {
        assert.equal(q.format, "short", `${at}/${q.id}: unexpected format ${q.format}`);
        assert.equal(checkResponse(q, "").status, "empty");
        const long = Array.from({ length: Math.max(q.minWords || 0, 5) }, () => "word").join(" ");
        assert.equal(
          checkResponse(q, long).status,
          "review",
          `${at}/${q.id}: open response must never be auto-graded`,
        );
      }
    }
    // student copies: a worksheet has no keys; every copy has no teacher text
    const teacherText = [
      a.notes.teacher,
      ...a.blocks.filter((b) => b.type === "note").map((b) => b.text),
    ].filter(Boolean);
    for (const kind of ["worksheet", "interactive", "check"]) {
      const copy = studentCopyFor({
        ...a,
        kind,
        template: kind === "worksheet" ? "guided" : kind === "check" ? "exit-ticket" : a.template,
      });
      assert.equal(copy.notes.teacher, "");
      assert.deepEqual(copy.notes.misconceptions, []);
      assert.ok(!copy.blocks.some((b) => b.type === "note"), `${at}: note block in a student copy`);
      const json = JSON.stringify(copy);
      for (const tx of teacherText)
        assert.ok(
          !json.includes(JSON.stringify(tx).slice(1, -1)),
          `${at}: teacher text leaked into a ${kind} copy`,
        );
      if (kind !== "worksheet") continue;
      for (const q of questions(copy)) {
        assert.equal(
          q.hint + q.explanation + q.misconception,
          "",
          `${at}/${q.id}: help text in worksheet copy`,
        );
        if (q.format === "choice") assert.equal(q.answer, "");
        if (q.format === "multi") assert.deepEqual(q.answers, []);
        if (q.format === "sort") assert.ok(q.items.every((i) => i.category === ""));
        if (q.format === "short") assert.ok(!q.sample && !q.rubric.length);
        if (q.format === "blank")
          assert.ok(!/\[\[\s*[^\]\s]/.test(q.text), `${at}/${q.id}: blank answer leaked`);
        if (q.format === "match") {
          const orig = questions(a).find((x) => x.id === q.id);
          assert.ok(
            q.pairs.every((p, i) => p.right !== orig.pairs[i].right),
            `${at}/${q.id}: match key readable`,
          );
        }
        if (q.format === "order") {
          const orig = questions(a).find((x) => x.id === q.id);
          assert.notDeepEqual(
            q.items.map((i) => i.id),
            orig.items.map((i) => i.id),
            `${at}/${q.id}: order key readable`,
          );
        }
      }
    }
    // never an official WIDA/ACCESS claim: "official" may appear only as a denial
    const claimText = [
      a.notes.teacher.split("\n")[0],
      a.context.curriculum,
      a.context.source.note,
      ...made.notes.map((n) => n.en),
    ];
    for (const s of claimText)
      for (const m of s.matchAll(/official/gi))
        assert.match(
          s.slice(Math.max(0, m.index - 8), m.index),
          /\b(not|no)( an?)? $/i,
          `${at}: unqualified "official" in: ${s.slice(0, 80)}`,
        );
    for (const n of made.notes) bilingual(n, `${at} note`);
  }
  present.set(family, union);
  warnings.set(family, warn);
  results.set(family, out);
}

for (const family of Object.keys(ADAPTERS))
  test(`${family}: every source item extracts, validates, grades and strips`, {
    timeout: 600_000,
  }, async () => {
    await sweep(family);
  });

test("access-bank: the key of every item is carried faithfully, and every stimulus and item type is mapped", async () => {
  const idx = read("access-practice-lab/content/bank/index.json");
  let items = 0;
  for (const { ref, made } of results.get("access-bank")) {
    const set = read(`access-practice-lab/content/bank/${ref}.json`);
    const qs = new Map(questions(made.activity).map((q) => [q.id, q]));
    for (const item of set.items) {
      items += 1;
      const q = qs.get(item.id);
      assert.ok(q, `${ref}/${item.id}: question missing`);
      const want = bankKey(item);
      if (want !== null)
        assert.deepEqual(draftKey(q), want, `${ref}/${item.id}: key differs from the bank`);
      assert.equal(q.prompt.startsWith(item.stem.trim()), true, `${ref}/${item.id}: stem`);
      assert.equal(q.hint, item.support.clue.trim());
      assert.ok(
        q.frame === item.support.frame.trim() ||
          made.activity.blocks.some(
            (b) => b.type === "note" && b.text.includes(item.support.frame.trim()),
          ),
        `${ref}/${item.id}: frame lost`,
      );
      if (item.type === "speaking-response") assert.equal(q.format, "short");
      if (item.type === "constructed-response") assert.equal(q.minWords, item.constructed.minWords);
      if (item.type === "multiple-choice" || item.type === "listening-response") {
        for (const [id, why] of Object.entries(item.distractors))
          assert.ok(
            q.explanation.includes(why.trim()) ||
              made.activity.blocks.some((b) => b.type === "note" && b.text.includes(why.trim())),
            `${ref}/${item.id}: distractor ${id} lost`,
          );
      }
      if (item.meta.support?.model || item.support.model)
        assert.ok(
          made.activity.blocks.some(
            (b) => b.type === "note" && b.text.includes(item.support.model.trim().slice(0, 60)),
          ),
          `${ref}/${item.id}: mentor example lost`,
        );
    }
    // stimuli: every one appears, audio keeps the whole script and a transcript
    for (const s of set.stimuli) {
      const b = made.activity.blocks;
      if (s.kind === "passage")
        assert.ok(
          b.some((x) => x.type === "passage" && x.title === s.title.trim()),
          `${ref}/${s.id}: passage`,
        );
      if (s.kind === "table") {
        const asTable = b.some(
          (x) =>
            x.type === "table" &&
            x.headers.join() === s.columns.join() &&
            JSON.stringify(x.rows) === JSON.stringify(s.rows),
        );
        const asText = b.some(
          (x) =>
            x.type === "text" && s.rows.every((r) => r.every((c) => x.text.includes(c.trim()))),
        );
        assert.ok(asTable || asText, `${ref}/${s.id}: table text lost`);
      }
      if (s.kind === "prompt")
        assert.ok(
          b.some((x) => x.type === "text" && x.text.includes(s.paragraphs[0].trim())),
          `${ref}/${s.id}: prompt`,
        );
      if (s.kind === "audio") {
        const words = (t) => t.replace(/\s+/g, " ").trim();
        const spoken = words(
          b
            .filter((x) => x.type === "audio" && x.label.startsWith(s.title.slice(0, 20)))
            .map((x) => x.say)
            .join(" "),
        );
        const heard = words(
          s.turns
            .map((tn) => (s.turns.length === 1 ? tn.text : `${tn.speaker}: ${tn.text}`))
            .join(" "),
        );
        assert.equal(spoken, heard, `${ref}/${s.id}: read-aloud script differs from the clip`);
        assert.ok(
          b.some(
            (x) =>
              x.type === "passage" && x.title.startsWith("Transcript:") && words(x.text) === heard,
          ),
          `${ref}/${s.id}: transcript missing`,
        );
      }
    }
    const a = made.activity;
    assert.match(
      a.notes.teacher,
      /WIDA-aligned original practice; not official WIDA or ACCESS material/,
    );
    assert.match(a.notes.teacher, new RegExp(`Review status: ${set.bank.reviewStatus}`));
    assert.match(a.notes.teacher, new RegExp(`Provenance: ${set.bank.provenance.source}`));
    assert.equal(a.options.timer, false);
    if (set.domain === "Listening")
      assert.match(a.notes.teacher, /at most \d+ times with no pausing/);
    if (set.domain === "Speaking") assert.match(a.notes.teacher, /never auto-graded/);
    assert.equal(idx.sets.find((s) => s.id === ref).items.length, set.items.length);
  }
  assert.equal(items, 320);
  const listening = ADAPTERS["access-bank"].fixed.find((f) =>
    /listening playback/i.test(f.what.en),
  );
  assert.match(
    listening.why.en,
    /preserved only in the original ACCESS Practice Lab practice mode/,
  );
  assert.match(listening.why.en, /instructional practice/);
});

test("bcpss-unit: context comes from the real unit record, standards are curriculum metadata", async () => {
  for (const { ref, made } of results.get("bcpss-unit")) {
    const u = BCPSS_UNITS.find((x) => x.id === ref);
    const c = made.activity.context;
    assert.equal(c.grade, String(u.grade));
    assert.equal(c.subject, u.subject);
    assert.equal(c.unitId, u.id);
    assert.equal(c.unitNumber, Number(u.unit_number));
    assert.equal(c.unitTitle, u.unit_title);
    assert.equal(c.curriculum, u.curriculum_name);
    assert.deepEqual(
      c.standards,
      u.core_standards.map((code) => ({ code, origin: "curriculum" })),
    );
    assert.equal(c.source.origin, "curriculum");
    const vocab = made.activity.blocks.find((b) => b.type === "vocab");
    assertMatchCoversVocab(made, ref);
    const conn = (await fetchJson(`/api/bcpss/units/${ref}`)).connections[0];
    assert.deepEqual(
      vocab.items.map((v) => v.term),
      conn.tier2_tier3_vocab.map((v) => v.term.trim()),
      `${ref}: vocabulary terms`,
    );
    const detail = await fetchJson(`/api/bcpss/units/${ref}`);
    const choices = questions(made.activity).filter(
      (q) => q.format === "choice" && /^c\d+$/.test(q.id),
    );
    assert.deepEqual(
      choices.map((q) => q.options.find((o) => o.id === q.answer).text),
      conn.interactive_cloze_items.map((c) => c.answer.trim()),
      `${ref}: cloze answers`,
    );
    for (const [i, c] of conn.interactive_cloze_items.entries())
      assert.deepEqual(
        choices[i].options.map((o) => o.text).sort(),
        [c.answer, ...c.distractor_pool].map((x) => x.trim()).sort(),
        `${ref}: cloze options`,
      );
    for (const [i, rq] of detail.reading.questions.entries()) {
      const q = questions(made.activity).find((x) => x.id === `r${i + 1}`);
      assert.equal(
        q.options.find((o) => o.id === q.answer).text,
        rq.options[rq.answer].trim(),
        `${ref}: reading key`,
      );
    }
    assert.equal(
      questions(made.activity).find((q) => q.id === "exit").prompt,
      conn.language_exit_ticket_json.prompt.trim(),
    );
  }
  assert.equal(results.get("bcpss-unit").length, BCPSS_UNITS.length);
});

test("vocab-academy and reading-room: words and keys come from the source unchanged", async () => {
  for (const { ref, made } of results.get("vocab-academy")) {
    const m = /^g(K|[1-8])-u(\d{2})$/.exec(ref);
    const unit = read(`access-practice-lab/content/vocab-academy/g${m[1]}/u${m[2]}.json`);
    const vocab = made.activity.blocks.find((b) => b.type === "vocab");
    assertMatchCoversVocab(made, ref);
    const fills = questions(made.activity)
      .filter((q) => q.format === "blank")
      .map((q) => marksOf(q.text)[0].answers[0]);
    assert.deepEqual(
      fills,
      unit.words.map((w) => w.cloze.f.trim()),
      `${ref}: cloze answers`,
    );
    assert.deepEqual(
      vocab.items.map((v) => [v.term, v.def, v.es, v.example]),
      unit.words.map((w) => [w.hw.trim(), w.def.trim(), w.es.gloss.trim(), w.ex.trim()]),
      `${ref}: vocab block`,
    );
    for (const q of unit.passage.qs) {
      const draft = made.activity.blocks.find(
        (b) => b.type === "question" && b.prompt === q.q.trim(),
      );
      assert.equal(
        draft.options.find((o) => o.id === draft.answer).text,
        q.choices[q.a].trim(),
        `${ref}: passage key`,
      );
    }
  }
  const file = read("access-practice-lab/content/reading-room/lessons.json");
  for (const { ref, made } of results.get("reading-room")) {
    const lesson = file.lessons.find((l) => l.id === ref);
    const qs = new Map(questions(made.activity).map((q) => [q.id, q]));
    lesson.activities.forEach((a, i) => {
      const q = qs.get(`q${i + 1}-${a.id}`.slice(0, 32));
      assert.ok(q, `${ref}/${a.id}: question missing`);
      if (a.type === "choice")
        assert.equal(
          q.options.find((o) => o.id === q.answer).text,
          a.choices.find((c) => c.id === a.answerId).text.trim(),
        );
      if (a.type === "order")
        assert.deepEqual(
          q.items.map((x) => x.text),
          a.answerOrder.map((id) => a.items.find((x) => x.id === id).text.trim()),
        );
      if (a.type === "evidence")
        assert.deepEqual([q.answer ?? q.answers].flat().sort(), [...a.answerIds].sort());
    });
    assert.equal(
      made.activity.blocks
        .find((b) => b.type === "passage" && b.id === "reading")
        .text.split(/\n\n/).length,
      lesson.paragraphs.length,
    );
  }
});

test("registry: listing, lookup, errors, hash", async () => {
  assert.deepEqual(
    listFamilies().map((f) => f.family),
    Object.keys(ADAPTERS),
  );
  assert.equal(adapterFor("nope"), null);
  assert.equal(adapterFor("__proto__"), null);
  await assert.rejects(
    () => customizeFrom("nope", "x", deps),
    (e) => e instanceof CustomizeError && e.code === "unknown-family",
  );
  await assert.rejects(
    () => customizeFrom("access-bank", "no-such-set", deps),
    (e) => e.code === "not-found",
  );
  await assert.rejects(
    () => customizeFrom("access-bank", "../../etc/passwd", deps),
    (e) => e.code === "not-found",
  );
  await assert.rejects(
    () => customizeFrom("bcpss-unit", "no-such-unit", deps),
    (e) => e.code === "not-found",
  );
  await assert.rejects(
    () => customizeFrom("vocab-academy", "g9-u01", deps),
    (e) => e.code === "not-found",
  );
  await assert.rejects(
    () => customizeFrom("access-bank", "b35-read-01", { ...deps, newId: () => "bad" }),
    (e) => e.code === "bad-id",
  );
  assert.equal(hashSource({ a: 1, b: [1, 2] }), hashSource({ b: [1, 2], a: 1 }));
  assert.notEqual(hashSource({ a: 1 }), hashSource({ a: 2 }));
  assert.ok(hashSource("x").length <= 24);
  // a changed source changes the lineage hash
  const a = await customizeFrom("access-bank", "b35-read-01", deps);
  const b = await customizeFrom("access-bank", "b35-read-02", deps);
  assert.notEqual(a.activity.lineage.sourceHash, b.activity.lineage.sourceHash);
  // fresh id per call without an injected one
  const c1 = await customizeFrom("access-bank", "b35-read-01", { fetchJson });
  const c2 = await customizeFrom("access-bank", "b35-read-01", { fetchJson });
  assert.notEqual(c1.activity.id, c2.activity.id);
  // the bcpss listing filters by grade and subject through the same endpoint
  const six = await ADAPTERS["bcpss-unit"].list({ fetchJson, grade: "6", subject: "Math" });
  assert.deepEqual(
    six.map((u) => u.id),
    BCPSS_UNITS.filter((u) => String(u.grade) === "6" && u.subject === "Math")
      .sort((x, y) => x.unit_number - y.unit_number)
      .map((u) => u.id),
  );
});

test("adapters: metadata is bilingual and editable lists only real properties", async () => {
  for (const f of listFamilies()) {
    bilingual(f.label, `${f.family} label`);
    bilingual(f.note, `${f.family} note`);
    assert.ok(f.fixed.length > 0, `${f.family}: say what is fixed`);
    for (const x of f.fixed) {
      bilingual(x.what, `${f.family} fixed.what`);
      bilingual(x.why, `${f.family} fixed.why`);
    }
    assert.equal(new Set(f.editable).size, f.editable.length);
    for (const p of f.editable) {
      assert.ok(PROPERTY_IDS.includes(p), `${f.family}: unknown property ${p}`);
      assert.ok(
        present.get(f.family).has(p),
        `${f.family}: lists ${p} but no extracted draft has it`,
      );
    }
  }
});

test("coverage: complete rows, honest statuses, adapters and rows agree", async () => {
  const rows = coverageRows();
  assert.equal(new Set(rows.map((r) => r.family)).size, rows.length, "duplicate coverage row");
  for (const r of rows) {
    assert.ok(STATUSES.includes(r.status), `${r.family}: status ${r.status}`);
    bilingual(r.label, `${r.family} label`);
    bilingual(r.reason, `${r.family} reason`);
    assert.ok(r.evidence, `${r.family}: evidence`);
    assert.ok(r.source.length > 0, `${r.family}: sources`);
    for (const s of r.source)
      assert.ok(existsSync(join(ROOT, s)), `${r.family}: ${s} does not exist`);
    if (r.status === "adapter") {
      assert.ok(ADAPTERS[r.family], `${r.family}: row says adapter but none is registered`);
      assert.ok(r.editable.length > 0);
      assert.match(r.evidence, /adapter test/);
    } else {
      assert.ok(!ADAPTERS[r.family], `${r.family}: has an adapter but its row says ${r.status}`);
      assert.doesNotMatch(r.evidence, /adapter test/);
    }
    if (r.status === "not-supported") assert.deepEqual(r.editable, []);
  }
  for (const family of Object.keys(ADAPTERS))
    assert.ok(
      rows.some((r) => r.family === family && r.status === "adapter"),
      `${family}: adapter without a coverage row`,
    );
  // numbers the rows state are the numbers on disk
  const stated = ROWS.map((r) => r.reason.en).join(" ");
  assert.match(stated, /320 items of the 40 sets/);
  assert.match(stated, /all 157 units/i);
  assert.match(stated, /all 183 lessons/i);
  assert.match(stated, /all 162 units/i);
  assert.equal(
    readdirSync(join(ROOT, "bcpss-teachers/studio/data/activities")).filter((n) =>
      n.endsWith(".js"),
    ).length,
    87,
  );
  const engines = new Set();
  for (const n of readdirSync(join(ROOT, "bcpss-teachers/studio/data/activities")).filter((x) =>
    x.endsWith(".js"),
  ))
    engines.add(
      (await import(join(ROOT, "bcpss-teachers/studio/data/activities", n))).default.engine,
    );
  assert.equal(engines.size, 8);
  assert.match(stated, /87 activities run on eight engines/);
  // honest limits: nothing outside the adapters claims to be tested
  assert.equal(rows.filter((r) => r.status === "adapter").length, Object.keys(ADAPTERS).length);
});

test("coverage table in CUSTOMIZE.md is current, and a stale one is detected", () => {
  const doc = readFileSync(join(ROOT, "access-practice-lab/CUSTOMIZE.md"), "utf8");
  const body = renderMatrix();
  assert.equal(
    withMatrix(doc, body),
    doc,
    "CUSTOMIZE.md coverage table is stale: run node tools/studio-customize-coverage.mjs",
  );
  for (const row of coverageRows())
    assert.ok(body.includes(`\`${row.family}\``), `${row.family} missing from the table`);
  assert.notEqual(
    withMatrix(doc, `${body}\n- extra`),
    doc,
    "a changed table must not look current",
  );
  assert.equal(withMatrix("no markers here", body), null);
  const edited = doc.replace(
    /\| `access-bank` \([^|]*\| adapter \|/,
    "| `access-bank` (x) | not-supported |",
  );
  assert.notEqual(
    withMatrix(edited, body),
    edited,
    "a hand-edited row must be overwritten, so --check fails on it",
  );
});

test("report: warnings per family (informational) and the sources are unchanged", () => {
  for (const [family, w] of warnings)
    console.log(`# ${family}: ${results.get(family).length} drafts, warnings ${JSON.stringify(w)}`);
  assert.equal(sourceFingerprint(), BEFORE, "an adapter changed a platform source file");
});
