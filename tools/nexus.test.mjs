// Project Nexus — the Living Resource core (curriculum/nexus/*.mjs), proved
// without a browser. Each section pins a promise the product makes:
//  1. every flagship model is the lesson's own authored living-scene config
//     (the "verified" curriculum badge is earned, not asserted);
//  2. every answer is recomputed here INDEPENDENTLY of the kit and must agree,
//     across the flagship numbers and 300 random valid models per kit;
//  3. misconception answers are never the right answer and are detected;
//  4. no language support ever contains a question's answer (scaffold ≠ giveaway);
//  5. compatibility refuses weak conversions and explains why;
//  6. sync never overwrites a teacher's wording silently, and versions restore;
//  7. the response engine never calls supported work independent;
//  8. share links round-trip, reject tampering, and never carry teacher notes;
//  9. the Word file is a valid ZIP/OOXML package whose text equals the print text;
// 10. the offline HTML parses and carries no teacher notes.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { compatibility } from "../curriculum/nexus/compat.mjs";
import { docxBytes } from "../curriculum/nexus/docx.mjs";
import { KITS, validModel } from "../curriculum/nexus/kits.mjs";
import { overlay, overlayStrings } from "../curriculum/nexus/language.mjs";
import { sequence } from "../curriculum/nexus/orchestrate.mjs";
import { packet } from "../curriculum/nexus/packet.mjs";
import { offlineHtml, printHtml } from "../curriculum/nexus/render.mjs";
import {
  decode,
  encode,
  fromLibrary,
  judge,
  LIBRARY,
  parseAnswer,
  questions,
  transferQuestion,
} from "../curriculum/nexus/resource.mjs";
import { classify, record, respond, useSupport } from "../curriculum/nexus/response.mjs";
import { applySync, planSync, restore } from "../curriculum/nexus/sync.mjs";

const root = new URL("..", import.meta.url).pathname;
let checks = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  checks++;
};

// 1. curriculum provenance
for (const item of LIBRARY) {
  const cfg = JSON.parse(
    readFileSync(join(root, "lessons", item.curriculum.lesson, "config.json"), "utf8"),
  );
  const authored = { ...cfg.launch.conceptIntro.livingScene };
  delete authored.kind;
  delete authored.play;
  for (const [k, v] of Object.entries(item.model))
    assert.deepEqual(
      v,
      authored[k],
      `${item.id}.${k} must equal lesson ${item.curriculum.lesson}'s authored value`,
    );
  ok(
    cfg.launch.conceptIntro.livingScene.play === item.kit,
    `${item.id} uses the lesson's own play`,
  );
  const r = fromLibrary(item.id);
  ok(r && r.curriculum.status === "verified", `${item.id} starts verified`);
}

// 2. independent answer recomputation
const indep = {
  "ratio-scale": (m) => [m.a * m.k, m.b * m.k, m.b / m.a],
  "percent-whole": (m) => [
    m.whole / 10,
    (m.percent * m.whole) / 100,
    m.whole * (1 - m.percent / 100),
  ],
  "mean-balance": (m) => {
    const t = m.values.reduce((s, x) => s + x, 0);
    return [t, t / m.values.length, t / m.values.length];
  },
  "parallelogram-area": (m, env) => [
    m.base * m.height,
    m.base * m.height * env.price,
    2 * m.base * m.height,
  ],
  "integers-opposites": (m) => [-m.value, Math.abs(m.value), null],
};
const close = (a, b) => Math.abs(a - b) < 1e-9;
function checkAnswers(kit, model, env = {}) {
  const r = {
    kit,
    model,
    env,
    overrides: {},
    curriculum: {},
    vocab: [],
    title: { en: "x" },
    objective: { en: "x" },
    support: "light",
    goal: "practice",
  };
  const qs = questions(r);
  if (!qs.length) return false;
  const want = indep[kit](model, { price: 4, ...env });
  want.forEach((w, i) => {
    if (w !== null)
      ok(
        close(qs[i].answer, w),
        `${kit} ${qs[i].id}: ${qs[i].answer} vs ${w} for ${JSON.stringify(model)}`,
      );
  });
  for (const q of qs) {
    ok(judge(q, String(q.answer)).correct, `${kit} ${q.id} accepts its own answer`);
    for (const m of q.miscon) {
      ok(!close(m.answer, q.answer), `${kit} ${q.id} misconception differs from the answer`);
      const j = judge(q, String(m.answer));
      ok(!j.correct && j.miscon === m, `${kit} ${q.id} detects misconception ${m.answer}`);
    }
  }
  const t = transferQuestion(r, "seed");
  ok(
    t && Number.isFinite(t.answer) && judge(t, String(t.answer)).correct,
    `${kit} transfer is checkable`,
  );
  return true;
}
for (const item of LIBRARY) checkAnswers(item.kit, item.model, item.env);

let rng = 7;
const rand = (lo, hi) => {
  rng = (rng * 1103515245 + 12345) & 0x7fffffff;
  return lo + (rng % (hi - lo + 1));
};
const gens = {
  "ratio-scale": () => ({ a: rand(1, 6), b: rand(1, 6), k: rand(2, 5) }),
  "percent-whole": () => ({ percent: rand(1, 99), whole: rand(2, 400) }),
  "mean-balance": () => ({ values: Array.from({ length: 4 }, () => rand(0, 8) * 5), unit: 5 }),
  "parallelogram-area": () => {
    const height = rand(2, 20);
    return { base: rand(3, 30), height, slant: rand(height + 1, 35) };
  },
  "integers-opposites": () => ({ value: rand(-99, 99) }),
};
for (const kit of Object.keys(KITS)) {
  let valid = 0;
  for (let i = 0; i < 300; i++) if (checkAnswers(kit, gens[kit]())) valid++;
  ok(valid >= 30, `${kit}: at least 30 of 300 random models validate (got ${valid})`);
}
ok(
  validModel("parallelogram-area", { base: 5, height: 9, slant: 3 }) === null,
  "a slant shorter than the height is refused",
);

// answer parsing
assert.equal(parseAnswer("$1,200.50"), 1200.5);
assert.equal(parseAnswer("3/2"), 1.5);
assert.equal(parseAnswer("1 1/2 cups"), 1.5);
assert.equal(parseAnswer("−86 m"), -86);
assert.equal(parseAnswer("abc"), null);
ok(judge({ answer: 2 / 3, miscon: [] }, "0.67").correct, "rounded repeating decimal accepted");
ok(!judge({ answer: 12, miscon: [] }, "12.004").correct, "an integer answer is exact");

// 4. supports never carry answers
for (const item of LIBRARY) {
  for (const support of ["light", "full"]) {
    const r = { ...fromLibrary(item.id), support };
    const strings = overlayStrings(overlay(r));
    ok(strings.length > 0, "overlay has frames");
    for (const q of [...questions(r), transferQuestion(r, "x")]) {
      const n = String(Math.round(q.answer * 1e4) / 1e4);
      for (const s of strings)
        ok(
          !new RegExp(`(^|[^\\d.])${n.replace(".", "\\.")}([^\\d]|$)`).test(s),
          `${item.id}: frame "${s}" leaks answer ${n}`,
        );
    }
  }
  ok(overlay({ ...fromLibrary(item.id), support: "off" }) === null, "off = independent version");
}

// 5. compatibility
{
  const r = fromLibrary("juice-bar");
  const c = Object.fromEntries(compatibility(r).map((x) => [x.id, x]));
  ok(
    c.mission.ok && c.docx.ok && c["vocab-match"].ok && c.spanish.ok && c["aligned-label"].ok,
    "flagship is fully compatible",
  );
  const thin = { ...r, vocab: r.vocab.slice(0, 2) };
  const t = Object.fromEntries(compatibility(thin).map((x) => [x.id, x]));
  ok(
    !t["vocab-match"].ok && /fewer than 4/.test(t["vocab-match"].reason),
    "2-word match game refused with a reason",
  );
  const edited = fromLibrary("juice-bar");
  edited.model = { ...edited.model, a: 4 };
  const e = Object.fromEntries(compatibility(decode(encode(edited))).map((x) => [x.id, x]));
  ok(
    !e["aligned-label"].ok && /adapted/.test(e["aligned-label"].reason),
    "edited numbers lose the aligned label",
  );
  const bad = { ...r, model: { ...r.model, a: 3, b: 3 } };
  ok(
    !Object.fromEntries(compatibility(bad).map((x) => [x.id, x])).mission.ok,
    "a model the play refuses has no mission",
  );
  const noEs = { ...r, title: { en: "Mix", es: "" } };
  ok(
    /title/.test(compatibility(noEs).find((x) => x.id === "spanish").reason),
    "missing Spanish is named, not faked",
  );
  ok(sequence({ ...r, goal: "practice" }).length <= 5, "practice stays short");
  ok(
    !sequence({ ...r, support: "light", goal: "explain" }).includes("speak"),
    "no empty speaking step without full support",
  );
  ok(
    sequence({ ...r, support: "off", goal: "understand" }).includes("write"),
    "the independent version still writes",
  );
}

// 6. sync
{
  const v1 = fromLibrary("juice-bar");
  v1.overrides = {
    "q1:stem": { text: { en: "My own wording for q1", es: "Mi texto" }, base: { en: "", es: "" } },
  };
  const v2 = structuredClone(v1);
  v2.model = { ...v2.model, k: 5 };
  const plan = planSync(v1, v2);
  ok(
    plan.changes.some((c) => c.where === "Q1" && c.what === "answer" && c.to === "10"),
    "the plan lists the recomputed answer",
  );
  ok(
    plan.conflicts.length === 1 && plan.conflicts[0].key === "q1:stem",
    "the overridden wording is a conflict, not a change",
  );
  const kept = applySync(v1, v2, plan, []);
  ok(
    kept.overrides["q1:stem"].text.en === "My own wording for q1" && kept.version === 2,
    "default keeps the teacher's wording",
  );
  const replaced = applySync(v1, v2, plan, ["q1:stem"]);
  ok(!replaced.overrides["q1:stem"], "the teacher can choose the new wording");
  ok(questions(kept)[0].answer === 10, "answers always follow the model");
  const back = restore(kept, 1);
  ok(
    back.model.k === 4 && back.version === 3 && back.history.length === 2,
    "restore makes a new version",
  );
  ok(planSync(v1, structuredClone(v1)).empty, "no edit, no plan");
}

// 7. response engine
{
  const qs = questions(fromLibrary("juice-bar"));
  let ev = {};
  ev = record(ev, "q1", { correct: true });
  ev = useSupport(ev, "q2", "hint");
  ev = record(ev, "q2", { correct: true });
  ev = record(ev, "q3", { correct: false, miscon: qs[2].miscon[0].why.en });
  ok(
    classify(ev.q1) === "independent" &&
      classify(ev.q2) === "supported" &&
      classify(ev.q3) === "not-yet",
    "levels",
  );
  const r1 = respond(ev, qs);
  ok(
    r1.next.kind === "vocab" && r1.possible.length === 1 && /Possible/.test(r1.possible[0].note),
    "misconception → targeted support, worded as possible",
  );
  ev = record(ev, "q3", { correct: true });
  ok(
    respond(ev, qs).next.kind === "fresh",
    "supported correct → fresh independent problem, not mastery",
  );
  const clean = qs.reduce((e, q) => record(e, q.id, { correct: true }), {});
  ok(respond(clean, qs).next.kind === "transfer", "all independent → transfer");
  ok(
    respond(clean, qs, { transferDone: true, transferIndependent: true }).next.kind === "explain",
    "transfer independent → explain",
  );
  ok(record(clean, "q1", { correct: false }).q1.correct, "solved items do not regress");
  ok(!/WIDA|disab|level [1-6]/i.test(JSON.stringify(r1)), "no proficiency or disability claims");
}

// 8. sharing
{
  const r = fromLibrary("discount-day");
  r.notes = { en: "PRIVATE TEACHER NOTE", es: "" };
  const s = encode(r);
  ok(
    !/PRIVATE/.test(Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()),
    "notes never enter a link",
  );
  const back = decode(s);
  ok(back && back.title.en === r.title.en && questions(back)[1].answer === 15, "link round-trips");
  ok(
    decode(`${s.slice(0, -6)}AAAAAA`) === null || decode(`${s.slice(0, -6)}AAAAAA`).kit === r.kit,
    "tampered link never throws",
  );
  ok(
    decode("not base64 !!") === null && decode("x".repeat(9000)) === null,
    "garbage and oversize refused",
  );
  const evil = encode({ ...r, title: { en: "<img src=x onerror=alert(1)>", es: "" } });
  ok(!/[<>]/.test(decode(evil).title.en), "markup stripped from shared text");
  ok(s.length < 3000, `flagship link is short (${s.length})`);
}

// 9. Word file
{
  const r = fromLibrary("patio-planner");
  const blocks = packet(r, { audience: "teacher" });
  const bytes = docxBytes(blocks, { title: "Patio" });
  ok(bytes[0] === 0x50 && bytes[1] === 0x4b, "ZIP signature");
  const text = Buffer.from(bytes).toString("utf8");
  for (const name of ["[Content_Types].xml", "word/document.xml", "word/styles.xml", "_rels/.rels"])
    ok(text.includes(name), `package has ${name}`);
  ok(
    text.includes("Answer: 126 square ft") && text.includes("Answer: 504 dollars"),
    "key answers present",
  );
  const html = printHtml(blocks, { title: "Patio" });
  for (const b of blocks.filter((x) => x.t === "q" || x.t === "key"))
    ok(
      html.includes(
        b.text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;"),
      ),
      `print has "${b.text.slice(0, 30)}"`,
    );
  ok(
    docxBytes(blocks, { title: "Patio" }).every((x, i) => x === bytes[i]),
    "byte-identical rebuild",
  );
  const student = packet(r, { audience: "student" });
  ok(!student.some((b) => b.t === "key"), "student version has no key");
  ok(
    !packet(r, { supported: false }).some((b) => b.t === "frame" || b.t === "words"),
    "independent version has no supports",
  );
  ok(packet(r, { lang: "es" })[0].text === r.title.es, "Spanish packet");
}

// 10. offline HTML
for (const item of LIBRARY) {
  const r = fromLibrary(item.id);
  r.notes = { en: "SECRET NOTE", es: "" };
  const html = offlineHtml(r, "en");
  ok(!html.includes("SECRET NOTE"), "offline file has no teacher notes");
  ok(!/<script[^>]+src=|https?:\/\//.test(html), "offline file loads nothing from a network");
  const js = html.match(/<script>([\s\S]*)<\/script>/)[1];
  new vm.Script(js);
  checks++;
}

console.log(`nexus: ${checks} checks passed`);
