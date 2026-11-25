// Scaffold Studio: logic tests (schema, fading, defaults, review gate, profile and export, grow-a-sentence, components).
// Pure node: no browser. The browser-side checks live in tools/verify-scaffold-browser.mjs.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const L = new URL("../access-practice-lab/", import.meta.url);
const imp = (p) => import(new URL(`src/scaffold/${p}`, L));
const schema = await imp("schema/v1.js");
const fading = await imp("fading.js");
const defaults = await imp("defaults.js");
const review = await imp("review.js");
const profile = await imp("profile.js");
const grow = await imp("grow.js");
const comps = await imp("components.js");
const pilot = JSON.parse(readFileSync(new URL("content/scaffold/pilot.json", L), "utf8"));
const clone = (o) => JSON.parse(JSON.stringify(o));

test("pilot support sets validate and every support states its purpose and can-do ids", () => {
  assert.equal(pilot.sets.length, 2);
  for (const set of pilot.sets) {
    const r = schema.validateSupportSet(set);
    assert.deepEqual(r.errors, []);
    for (const s of set.supports) assert.ok(s.purpose.length >= 12 && s.canDo.length);
  }
});

test("schema rejects each defect class", () => {
  const set = () => clone(pilot.sets[0]);
  const bad = (mutate, re) => {
    const s = set();
    mutate(s);
    const { ok, errors } = schema.validateSupportSet(s);
    assert.equal(ok, false);
    assert.ok(
      errors.some((e) => re.test(e)),
      `${re} not in ${errors.join("; ")}`,
    );
  };
  bad((s) => {
    s.schemaVersion = 2;
  }, /schemaVersion/);
  bad((s) => {
    s.band = "9-12";
  }, /band/);
  bad((s) => {
    s.supports[1].canDo = [];
  }, /canDo/);
  bad((s) => {
    s.supports[1].canDo = ["reading"];
  }, /valid descriptor/);
  bad((s) => {
    s.supports[1].widaTargets = [0, 7];
  }, /widaTargets/);
  bad((s) => {
    s.supports[1].review.status = "great";
  }, /review.status/);
  bad((s) => {
    s.supports[1].glosses.fr = { text: "x", review: { status: "draft", machineDrafted: true } };
  }, /not a supported language/);
  bad((s) => {
    s.supports[1].image = { src: "a.png", alt: "plant", license: "" };
  }, /license/);
  bad((s) => {
    s.supports.find((x) => x.type === "frame").steps.pop();
  }, /four fading/);
  bad((s) => {
    s.supports.find((x) => x.type === "briefing").keyWords.pop();
  }, /exactly 4/);
  bad((s) => {
    s.supports.push(clone(s.supports[1]));
  }, /repeated/);
  bad((s) => {
    s.supports[1].review.machineDrafted = true;
    s.supports[1].review.status = "approved";
  }, /reviewedBy/);
});

test("fading maps the lab's five rungs onto four steps and only ever suggests", () => {
  assert.deepEqual(fading.STEPS, ["full", "partial", "hint", "none"]);
  for (const r of fading.RUNGS) assert.ok(fading.STEPS.includes(fading.stepForRung(r)));
  assert.equal(fading.suggestStep([]).step, "full");
  assert.equal(fading.suggestStep([]).suggestedOnly, true);
  const strong = (step) => fading.makeRun({ step, requiredMet: true });
  // two strong runs at the same step suggest one step less support
  assert.equal(fading.suggestStep([strong("full"), strong("full")]).step, "partial");
  // one strong run is not enough
  assert.equal(fading.suggestStep([strong("full")]).step, "full");
  // a teacher pin or fade-off wins over the rule
  assert.equal(
    fading.suggestStep([strong("partial"), strong("partial")], { fade: false }).step,
    "partial",
  );
  assert.equal(fading.suggestStep([], { pin: "cue" }).step, "hint");
  // two help requests in a row at the same step suggest a little more support, still only a suggestion
  const helped = (step) => fading.makeRun({ step, helpAsked: true });
  assert.equal(fading.suggestStep([helped("partial"), helped("partial")]).step, "full");
});

test("I need more help moves one step up, always works, and never counts against the student", () => {
  assert.equal(fading.needMoreHelp("none").step, "hint");
  assert.equal(fading.needMoreHelp("hint").step, "partial");
  assert.equal(fading.needMoreHelp("partial").step, "full");
  assert.deepEqual(fading.needMoreHelp("full"), { step: "full", openModel: true });
  const run = fading.makeRun({ step: "hint", helpAsked: true, requiredMet: true });
  assert.equal(run.help, true);
  assert.ok(!("score" in run) && !("errors" in run));
});

test("level-aware defaults cover WIDA 1-6 for both bands and never put pictures on grades 6-8 by default", () => {
  for (const level of defaults.WIDA_LEVELS)
    for (const band of schema.BANDS) {
      const d = defaults.defaultsFor(level, band);
      assert.ok(fading.STEPS.includes(d.step));
      if (band === "6-8") assert.equal(d.wordHelp.image, false);
    }
  // support goes down as the starting point goes up
  const idx = (l) => fading.stepIndex(defaults.defaultsFor(l, "3-5").step);
  for (let l = 1; l < 6; l++) assert.ok(idx(l + 1) >= idx(l));
  assert.equal(defaults.defaultsFor(3, "3-5", { step: "hint" }).step, "hint");
  assert.throws(() => defaults.defaultsFor(7, "3-5"), RangeError);
  assert.throws(() => defaults.defaultsFor(1, "K"), RangeError);
});

test("review gate: only approved content reaches students in production; legacy is carried, teachers see all", () => {
  const m = review.mayShow;
  assert.equal(m({ status: "draft" }), false);
  assert.equal(m({ status: "native-reviewed" }), false);
  assert.equal(m({ status: "wida-reviewed" }), false);
  assert.equal(m({ status: "approved" }), true);
  assert.equal(m({ status: "legacy-unreviewed" }), true);
  assert.equal(m({ status: "legacy-unreviewed" }, { strict: true }), false);
  assert.equal(m({ status: "draft" }, { audience: "teacher" }), true);
  assert.equal(m({ status: "draft" }, { production: false }), true);
  assert.equal(m(undefined), false);
  assert.match(review.statusLabel("draft", true).en, /Needs human review/);
});

test("word popover hides an unapproved home-language gloss from students and labels it for teachers", () => {
  const word = clone(pilot.sets[0].supports.find((s) => s.type === "word"));
  word.glosses.es.review = { status: "draft", machineDrafted: true };
  const student = comps.wordPopoverHTML(word, { home: "es", audience: "student" });
  assert.ok(!student.includes(word.glosses.es.text));
  const teacher = comps.wordPopoverHTML(word, { home: "es", audience: "teacher" });
  assert.ok(teacher.includes(word.glosses.es.text));
  assert.match(teacher, /Needs human review/);
  word.glosses.es.review = { status: "approved", machineDrafted: false };
  assert.ok(comps.wordPopoverHTML(word, { home: "es" }).includes(word.glosses.es.text));
  assert.match(comps.wordPopoverHTML(word, { home: "es" }), /data-ss-speak=/);
});

test("chunk overlay labels every part with a word, not only a colour, and explains in plain language", () => {
  const chunk = pilot.sets[0].supports.find((s) => s.type === "chunk");
  const out = comps.chunkOverlayHTML(chunk);
  for (const c of chunk.chunks) assert.ok(out.includes(c.text.replace(/\.$/, "")));
  assert.equal((out.match(/<small>/g) || []).length, chunk.chunks.length);
  assert.ok(out.includes(chunk.explain.en.slice(0, 20)));
});

test("grow-a-sentence builds in a fixed order and tells what is new", () => {
  const base = "The scientist measured the plant.";
  assert.equal(grow.growSentence(base).text, base);
  const g = grow.growSentence(base, {
    why: "because she needed data",
    where: "in the lab",
    when: "on Monday",
    how: "carefully",
  });
  assert.equal(
    g.text,
    "The scientist measured the plant carefully in the lab on Monday, because she needed data.",
  );
  assert.deepEqual(
    g.segments.map((s) => s.part),
    ["how", "where", "when", "why"],
  );
  assert.equal(grow.growProgress({ where: "x", how: " " }), 1);
  assert.match(comps.growSentenceHTML(base, { where: "in the lab" }), /aria-live="polite"/);
});

test("frame tray shows the frame at the current step and never an answer", () => {
  const frame = pilot.sets[0].supports.find((s) => s.type === "frame");
  assert.match(comps.frameTrayHTML(frame, "full"), /ss-blank/);
  assert.ok(comps.frameTrayHTML(frame, "full").length > comps.frameTrayHTML(frame, "hint").length);
  assert.match(comps.frameTrayHTML(frame, "none"), /on your own/);
});

test("support dial offers all four steps and a no-penalty help button; progress ring shows counts not percentages", () => {
  const dial = comps.supportDialHTML("partial");
  for (const s of fading.STEPS) assert.ok(dial.includes(`value="${s}"`));
  assert.match(dial, /value="partial" checked/);
  assert.match(dial, /data-ss-more-help/);
  const ring = comps.progressRingHTML(3, 5, "Words");
  assert.match(ring, /3 of 5/);
  assert.ok(!/%/.test(ring));
  assert.match(comps.progressRingHTML(0, 0, "x"), /0 of 0/);
});

test("rehearsal states the privacy rule and never promises accent scoring", () => {
  const priv = comps.rehearsalHTML("own", { privateMode: true });
  assert.match(priv, /nothing is scored and nothing is kept/);
  assert.match(comps.rehearsalHTML("repeat"), /not saved or sent/);
  assert.ok(!/accent|score:|points/i.test(comps.rehearsalHTML("model")));
});

test("profile: runs are recorded, outgrown supports are found, and export carries counts only", () => {
  let p = profile.emptyProfile();
  const day = (n) => `2026-11-${String(n).padStart(2, "0")}`;
  p = profile.recordRun(p, {
    unit: "growing-things",
    domain: "Reading",
    step: "full",
    supports: ["gloss", "chunk", "audio"],
    at: day(1),
  });
  p = profile.recordRun(p, {
    unit: "growing-things",
    domain: "Reading",
    step: "partial",
    supports: ["gloss", "audio"],
    at: day(2),
  });
  for (let i = 3; i <= 5; i++)
    p = profile.recordRun(p, {
      unit: "growing-things",
      domain: "Reading",
      step: "none",
      supports: ["audio"],
      at: day(i),
    });
  assert.deepEqual(profile.outgrown(p, "Reading"), ["chunk", "gloss"]);
  assert.deepEqual(profile.outgrown(p, "Writing"), []);
  const [row] = profile.evidenceRows(p);
  assert.equal(row.runs, 5);
  assert.equal(row.onOwn, 3);
  assert.equal(row.direction, "less support over time");
  const csv = profile.toCsv([row]);
  assert.equal(csv.split("\r\n")[0], profile.EXPORT_COLUMNS.join(","));
  assert.ok(!/percent|score|level/i.test(csv.split("\r\n")[0]));
  const json = JSON.parse(profile.toJson(p, { generatedAt: "2026-11-24" }));
  assert.match(json.note, /Not a score, level or placement/);
  assert.equal(json.rows.length, 1);
});

test("profile: asking for more help is neutral bookkeeping, stored as a flag only", () => {
  const p = profile.recordRun(profile.emptyProfile(), {
    unit: "u",
    domain: "Writing",
    step: "hint",
    help: true,
    at: "2026-11-24",
  });
  const run = p.units.u.Writing[0];
  assert.deepEqual(Object.keys(run).sort(), ["at", "help", "step", "supports"]);
  assert.equal(profile.evidenceRows(p)[0].askedForMoreHelp, 1);
});

test("profile is defensive: junk storage is no evidence, bad runs are ignored, csv cannot run formulas", () => {
  const mem = new Map();
  const store = { get: (k) => mem.get(k) ?? null, set: (k, v) => mem.set(k, v) };
  assert.deepEqual(profile.load(store), profile.emptyProfile());
  mem.set(profile.PROFILE_KEY, "{not json");
  assert.deepEqual(profile.load(store), profile.emptyProfile());
  mem.set(
    profile.PROFILE_KEY,
    JSON.stringify({ v: 99, units: { u: { Reading: [{ step: "full" }] } } }),
  );
  assert.deepEqual(profile.load(store), profile.emptyProfile());
  const p = profile.recordRun(profile.emptyProfile(), {
    unit: "u",
    domain: "Reading",
    step: "full",
    at: "2026-11-24",
  });
  assert.equal(profile.save(store, p), true);
  assert.equal(profile.load(store).units.u.Reading.length, 1);
  assert.equal(profile.recordRun(p, { unit: "u", domain: "Math", step: "full" }), p);
  assert.equal(profile.recordRun(p, { unit: "u", domain: "Reading", step: "bogus" }), p);
  let capped = profile.emptyProfile();
  for (let i = 0; i < profile.MAX_RUNS + 10; i++)
    capped = profile.recordRun(capped, {
      unit: "u",
      domain: "Reading",
      step: "full",
      at: "2026-11-24",
    });
  assert.equal(capped.units.u.Reading.length, profile.MAX_RUNS);
  const evil = profile.toCsv([{ unit: '=HYPERLINK("x")', domain: "Reading", runs: 1 }]);
  assert.ok(evil.includes("'=HYPERLINK"));
});

test("the scaffold stylesheet has no purple and respects reduced motion", () => {
  const css = readFileSync(new URL("scaffold-studio.css", L), "utf8");
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /data-comfort-motion="calm"/);
  assert.match(css, /--ss-target: 44px/);
});
