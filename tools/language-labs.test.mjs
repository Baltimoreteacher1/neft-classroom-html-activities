// Language Labs (/language-labs): checkers, content integrity, publisher-edition grade-band programs (3-5 and 6-8),
// and the feedback ladder (a first miss never states the answer). Browser journey: tools/language-labs-e2e.mjs.
import assert from "node:assert/strict";
import test from "node:test";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const K = await import(new URL("src/lang/labs-check.js", LAB));
const C = await import(new URL("src/content/language-labs.js", LAB));

test("verb forms and the tense a learner wrote", () => {
  assert.deepEqual(K.verbForms("go"), {
    base: "go",
    s: "goes",
    ed: "went",
    part: "gone",
    ing: "going",
  });
  assert.equal(K.verbForms("study").ed, "studied");
  assert.equal(K.verbForms("stop").ing, "stopping");
  assert.equal(K.tenseOf("will go", "go"), "future");
  assert.equal(K.tenseOf("had gone", "go"), "past-perfect");
  assert.equal(K.tenseOf("were testing", "test"), "past-progressive");
  assert.equal(K.tenseOf("goes", "go"), "present");
});

test("every verb item accepts its own answer, and the first two misses never state it", () => {
  for (const it of C.VERB_ITEMS) {
    assert.ok(K.checkVerb(it, it.accept[0], 0).ok, it.id);
    const wrong = K.verbForms(it.base).base === it.accept[0] ? `${it.base}ing` : it.base;
    for (const tries of [0, 1]) {
      const r = K.checkVerb(it, wrong, tries);
      assert.equal(r.ok, false, it.id);
      assert.ok(!r.reveal, `${it.id} reveals too early`);
      for (const a of it.accept)
        if (a !== it.base && a.length > 3)
          assert.ok(
            !new RegExp(`\\b${a}\\b`, "i").test(r.message.en),
            `${it.id}: try ${tries} states "${a}"`,
          );
    }
    assert.ok(K.checkVerb(it, wrong, 2).reveal, `${it.id}: third miss shows a model`);
  }
  assert.equal(C.VERB_ITEMS.filter((x) => x.band === "3-5").length, 6);
  assert.equal(C.VERB_ITEMS.filter((x) => x.band === "6-8").length, 6);
});

test("connector bridge: every item has a fitting connector on the palette; wrong jobs explain what they would mean", () => {
  for (const it of C.BRIDGE_ITEMS) {
    const fit = C.BRIDGE_PALETTE.find((w) => it.jobs.includes(K.jobOf(w)));
    assert.ok(fit, `${it.id} has no fitting palette connector`);
    assert.ok(K.checkBridge(it, fit, 0).ok, it.id);
    const wrong = C.BRIDGE_PALETTE.find((w) => !it.jobs.includes(K.jobOf(w)));
    const r = K.checkBridge(it, wrong, 0);
    assert.equal(r.ok, false);
    assert.match(r.message.en, new RegExp(wrong));
    assert.ok(!r.reveal);
  }
  for (const w of C.BRIDGE_PALETTE) assert.ok(K.jobOf(w), `palette word ${w} has a job`);
  const j = K.checkJoin("I forgot my lunch at home, so I was hungry all afternoon.", "cause");
  assert.equal(j.ok, true);
  assert.equal(K.checkJoin("I like math but science is hard for me.", "cause").ok, false);
});

test("paragraph x-ray: labels, order clues and the transfer paragraph", () => {
  for (const band of ["3-5", "6-8"]) {
    for (const p of [C.XRAY_MODEL[band], C.XRAY_PRACTICE[band]]) {
      assert.equal(p.sentences[0].job, "topic");
      assert.equal(p.sentences.at(-1).job, "conclude");
      for (const s of p.sentences)
        assert.ok(K.JOBS[s.job] && s.why.en && s.why.es && s.clue.en && s.clue.es, s.text);
    }
    const pr = C.XRAY_PRACTICE[band];
    assert.ok(
      K.checkLabels(
        pr,
        pr.sentences.map((s) => s.job),
      ).ok,
    );
    assert.ok(
      K.checkOrder(
        pr,
        pr.sentences.map((_, i) => i),
      ).ok,
    );
    const r = K.checkOrder(pr, [1, 0, 2, 3, 4]);
    assert.equal(r.ok, false);
    assert.equal(r.at, 0);
  }
  const good = K.checkParagraph(
    "Dogs make great pets for families. First, they are loyal and protect the house. Also, they need walks, so everyone gets exercise. That is why dogs are good pets for families.",
    ["pet", "animal"],
  );
  assert.equal(good.ok, true, JSON.stringify(good.next));
  assert.equal(K.checkParagraph("Dogs bark.", ["pet"]).ok, false);
});

test("timeline transfer needs before, later and time words", () => {
  assert.equal(
    K.checkTimeline("Yesterday I played soccer. Now I am reading. Tomorrow I will visit my aunt.")
      .ok,
    true,
  );
  assert.equal(K.checkTimeline("I play soccer. I read books. I like my aunt.").ok, false);
});

test("the hub lists six labs: three built here, three linked by their existing routes, each with WIDA use and dimension", () => {
  assert.equal(C.LABS.length, 6);
  assert.equal(C.LABS.filter((l) => l.here).length, 3);
  for (const l of C.LABS) {
    assert.ok(C.KEY_USES[l.use], `${l.id} has key language use`);
    assert.ok(C.DIMENSIONS[l.dimension], `${l.id} has language dimension`);
    assert.ok(
      l.bandNote?.["3-5"]?.length === 2 && l.bandNote?.["6-8"]?.length === 2,
      `${l.id} band notes`,
    );
    assert.ok(l.mentor?.["3-5"] && l.mentor?.["6-8"], `${l.id} mentor sentences`);
  }
  for (const l of C.LABS.filter((x) => !x.here))
    assert.match(l.href, /^scaffold\/(sentence-architecture|evidence-builder|language-upgrade)$/);
});

test("publisher programs: grades 3-5 and 6-8 have distinct titles, 5 inquiry stages, 4 craft mini-lessons, and Teacher/Family guides", () => {
  const p35 = C.programForLab("3-5");
  const p68 = C.programForLab("6-8");
  assert.NotEqual?.(p35.name[0], p68.name[0]);
  assert.notEqual(p35.name[0], p68.name[0]);
  for (const [band, p] of [
    ["3-5", p35],
    ["6-8", p68],
  ]) {
    assert.equal(p.stages.length, 5, `${band} stages`);
    assert.equal(p.craft.length, 4, `${band} craft lessons`);
    assert.ok(p.teacher.routines.length >= 3, `${band} teacher routines`);
    assert.ok(p.teacher.standards.length >= 2, `${band} standards`);
    assert.ok(p.family.prompts.length >= 3, `${band} family prompts`);
    assert.ok(
      C.VERB_MENTOR[band]?.passage && C.BRIDGE_MENTOR[band]?.passage,
      `${band} mentor passages`,
    );
    assert.ok(
      C.VERB_COMPARE[band]?.after && C.BRIDGE_COMPARE[band]?.after && C.XRAY_COMPARE[band]?.after,
      `${band} comparisons`,
    );
  }
});
