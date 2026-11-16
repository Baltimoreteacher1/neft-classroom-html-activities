// Culture & Communication Explorer (/communication): content integrity, framing rules and the rule-based checker.
// The checker may only report what it observes; these tests pin that it notices register mismatches, accepts every
// authored model answer, and never passes an empty or bare reply.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const C = await import(new URL("src/content/communication.js", LAB));
const K = await import(new URL("src/lang/communication-check.js", LAB));
const pair = (p) =>
  Array.isArray(p) && p.length === 2 && p.every((s) => typeof s === "string" && s.trim());

test("eight complete scenarios per band, one per theme, unique ids", () => {
  const ids = new Set();
  for (const band of ["3-5", "6-8"]) {
    const list = C.scenariosFor(band);
    assert.equal(list.length, 8, band);
    assert.deepEqual(
      list.map((s) => s.theme).sort(),
      Object.keys(C.THEMES).sort(),
      `${band} covers every theme once`,
    );
    for (const s of list) {
      assert.ok(!ids.has(s.id), `duplicate id ${s.id}`);
      ids.add(s.id);
      assert.match(s.id, /^[a-z0-9-]+$/);
      assert.ok(s.id.endsWith(band === "3-5" ? "-35" : "-68"), s.id);
    }
  }
  assert.equal(C.scenarioById("teacher-or-friend-35").band, "3-5");
  assert.equal(C.scenarioById("nope"), null);
});

test("every bilingual field has English and Spanish, and Spanish is not a copy", () => {
  const bad = [];
  const check = (where, p) => {
    if (!pair(p)) bad.push(`${where}: missing a language`);
    else if (p[0] === p[1]) bad.push(`${where}: Spanish copies English`);
  };
  for (const s of C.SCENARIOS) {
    check(`${s.id}.title`, s.title);
    check(`${s.id}.situation`, s.situation);
    for (const k of ["audience", "purpose", "setting", "relationship", "medium"])
      check(`${s.id}.card.${k}`, s.card[k]);
    assert.ok(C.REGISTERS[s.card.register], `${s.id} register`);
    for (const v of s.versions) {
      check(`${s.id}.${v.id}.why`, v.why);
      if (!v.best) check(`${s.id}.${v.id}.when`, v.when);
    }
    check(`${s.id}.shift.change`, s.shift.change);
    for (const [i, it] of s.shift.items.entries()) {
      check(`${s.id}.shift.${i}.why`, it.why);
      if (!pair(it.part)) bad.push(`${s.id}.shift.${i}.part`);
    }
    check(`${s.id}.reflect`, s.reflect);
    check(`${s.id}.task.prompt`, s.task.prompt);
    for (const w of s.task.words) if (!w.w || !w.es) bad.push(`${s.id}.word ${w.w}`);
  }
  for (const d of C.DIALS) {
    check(`dial ${d.id}.name`, d.name);
    check(`dial ${d.id}.text`, d.text);
  }
  for (const p of C.PRINCIPLES) check("principle", p);
  assert.deepEqual(bad, []);
});

test("compare and shift steps are well formed", () => {
  for (const s of C.SCENARIOS) {
    assert.ok(s.versions.length >= 2 && s.versions.length <= 3, s.id);
    assert.equal(s.versions.filter((v) => v.best).length, 1, `${s.id}: exactly one best fit`);
    assert.equal(new Set(s.versions.map((v) => v.id)).size, s.versions.length);
    assert.notEqual(s.versions[0].best, true, `${s.id}: the best fit is not always first`);
    assert.equal(s.shift.items.length, 4, s.id);
    const kinds = new Set(s.shift.items.map((x) => x.changes));
    assert.equal(kinds.size, 2, `${s.id}: shift has both "changes" and "stays"`);
    assert.equal(K.checkPick(s, s.versions.find((v) => v.best).id).ok, true);
    assert.equal(K.checkPick(s, s.versions.find((v) => !v.best).id).ok, false);
    const right = Object.fromEntries(
      s.shift.items.map((x, i) => [i, x.changes ? "changes" : "stays"]),
    );
    assert.equal(K.checkShift(s, right).right, 4);
    assert.equal(K.checkShift(s, { 0: "changes" }).complete, false);
  }
});

test("framing: no superiority, stereotype or deficit language anywhere in the content", () => {
  const files = [
    "communication.js",
    "communication-35a.js",
    "communication-35b.js",
    "communication-68a.js",
    "communication-68b.js",
  ];
  const banned = [
    /\bsuperior\b/i,
    /\bproper (English|Spanish|way)\b/i,
    /\b(correct|bad|broken|real|good) English\b/i,
    /\bbetter than\b/i,
    /\ball [A-Z][a-z]+ (people|families|kids)\b/,
    /\bin [A-Z][a-z]+ culture\b/,
    /\b(Americans|Latinos|Asians|Africans|Hispanics|Mexicans|Chinese people) (always|never|are)\b/,
    /\bunprofessional\b/i,
    /\brude\b/i,
  ];
  for (const f of files) {
    const text = readFileSync(new URL(`src/content/${f}`, LAB), "utf8");
    for (const re of banned) assert.ok(!re.test(text), `${f} contains ${re}`);
  }
  for (const s of C.SCENARIOS)
    assert.match(
      s.reflect[0],
      /language|home|family|communit/i,
      `${s.id}: reflection invites the student's own languages or community`,
    );
});

test("every task uses known checks, and its own model answer passes the checker", () => {
  for (const s of C.SCENARIOS) {
    const t = s.task;
    assert.ok(t.needs.length >= 3, s.id);
    for (const id of t.needs) assert.ok(K.CHECKS[id], `${s.id}: unknown check ${id}`);
    if (t.needs.includes("purpose")) assert.ok(t.purposeWords?.length, `${s.id} purposeWords`);
    if (t.needs.includes("address")) assert.ok(t.audienceWords?.length, `${s.id} audienceWords`);
    if (t.needs.includes("academic"))
      assert.ok(t.academicWords?.length >= 3, `${s.id} academicWords`);
    assert.ok(t.frames.length >= 3 && t.words.length >= 5, `${s.id} supports`);
    const r = K.checkMessage(t.model, t);
    assert.equal(
      r.ok,
      true,
      `${s.id} model fails: ${JSON.stringify(r.results.filter((x) => !x.met))} ${r.words}/${r.minWords}`,
    );
    const bare = K.checkMessage("ok", t);
    assert.equal(bare.ok, false, `${s.id}: a bare reply passes`);
    assert.ok(bare.next?.en && bare.next?.es);
    assert.equal(K.checkMessage("", t).empty, true);
  }
});

test("register: casual greetings, closings and chat spellings are noticed only where the task is formal", () => {
  assert.deepEqual(K.greetingOf("Hey Ms. Rivera, I forgot it.", "formal"), {
    word: "Hey",
    fits: false,
    casual: true,
  });
  assert.equal(K.greetingOf("Hey Sam, guess what", "informal").fits, true);
  assert.equal(K.greetingOf("Dear Dr. Hassan,", "formal").fits, true);
  assert.equal(K.greetingOf("I forgot my folder.", "formal").word, "");
  assert.equal(K.closingOf("Can we meet?\nThanks,\nAna", "formal").fits, true);
  assert.equal(K.closingOf("Can we meet?\nttyl", "formal").fits, false);
  assert.deepEqual(K.casualMarkers("can u help pls?? 😬"), ["u", "pls", "😬", "??"]);
  assert.deepEqual(K.casualMarkers("Could you help me, please?"), []);
  const email = C.scenarioById("garden-club-message-35").task;
  const r = K.checkMessage(
    "hey principal johnson can we have a reading picnic outside on friday because we read a lot lol?? bye",
    email,
  );
  assert.equal(r.ok, false);
  const g = r.results.find((x) => x.id === "greeting");
  assert.equal(g.met, false);
  assert.match(g.note[0], /fits a friend/);
  assert.match(r.results.find((x) => x.id === "casual").note[0], /lol/);
  assert.equal(r.results.find((x) => x.id === "closing").met, false);
  assert.match(
    r.next.en,
    /fits a friend/,
    "the first tip names the observed greeting, not a generic rule",
  );
});

test("audience checks: short sentences for a young child, precise words for a judge, open questions for interviews", () => {
  const kid = C.scenarioById("water-cycle-audiences-35").task;
  const long =
    "The seed is planted in the soil and then it absorbs water through its outer coat and eventually the embryo inside begins germination and sends a radicle downward while the shoot grows upward toward the sun.";
  const rl = K.checkMessage(long, kid);
  assert.equal(rl.results.find((x) => x.id === "simple").met, false);
  const judge = C.scenarioById("judge-or-sister-68").task;
  const vague = K.runCheck(
    "academic",
    "We did paper towels and one was the best at water stuff.",
    judge,
  );
  assert.equal(vague.met, false);
  assert.equal(
    K.runCheck("academic", "We tested three towels and measured the results.", judge).met,
    true,
  );
  const interview = C.scenarioById("bakery-oral-history-68").task;
  assert.equal(K.runCheck("questions", "Hello. What do you remember?", interview).met, false);
  assert.equal(K.runCheck("permission", "Is it okay if I record our talk?", interview).met, true);
  assert.equal(K.runCheck("permission", "Is it okay if I sit here?", interview).met, false);
});

test("feedback is observation only: no level, score or proficiency claims in the checker", () => {
  const src = readFileSync(new URL("src/lang/communication-check.js", LAB), "utf8");
  const strings = [...src.matchAll(/"([^"\n]{12,})"/g)].map((m) => m[1]).join("\n");
  assert.doesNotMatch(
    strings,
    /\b(proficien|fluent|level \d|score|grade level|native speaker|mastery)/i,
  );
  assert.throws(() => K.runCheck("nonsense", "hi", {}), /Unknown communication check/);
});
