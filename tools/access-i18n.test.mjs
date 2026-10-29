/**
 * Family Experience 3.0 contracts that need no browser:
 *   - the keyed dictionary is bilingual, with matching {placeholders}, and every key the source uses exists
 *   - English / Español / bilingual rendering rules (lang tagging, escaping, plain-string form)
 *   - family-help.json and family-coach.json: shape, both languages everywhere, placeholders match `needs`,
 *     no score / mastery / level claims, no instruction to give answers
 *   - es-guide.json covers every activity and keeps blanks and numbers
 *   - Co-Pilot coaching: every activity gets all three phases, content-aware where the activity allows,
 *     never an unresolved {placeholder}, and different activities get different words
 *   - pure planner, summary, setup-state and help-search logic
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

const LAB = join(REPO_ROOT, "access-practice-lab");
const json = (p) => JSON.parse(readFileSync(join(LAB, p), "utf8"));
const walk = (dir, keep) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name), keep) : keep(e.name) ? [join(dir, e.name)] : [],
  );
const holders = (s) =>
  [...String(s).matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(",");

const { STRINGS } = await import(join(LAB, "src/strings.js"));
const { makeI18n, langMode, docLang, langSwitchHTML } = await import(join(LAB, "src/i18n.js"));
const { toHtml } = await import(join(LAB, "src/util.js"));
const coachData = json("content/family-coach.json");
const helpData = json("content/family-help.json");
const esGuide = json("content/es-guide.json").activities;

// ── dictionary ────────────────────────────────────────────────────────────────
test("every dictionary entry has English and Spanish with the same placeholders", () => {
  const SAME_OK = new Set(["common.minutes"]); // "{n} min" is the same word in both languages
  const bad = [];
  for (const [key, e] of Object.entries(STRINGS)) {
    if (!e.en?.trim() || !e.es?.trim()) bad.push(`${key}: missing a language`);
    else if (e.en === e.es && !SAME_OK.has(key)) bad.push(`${key}: Spanish is a copy of English`);
    if (holders(e.en) !== holders(e.es))
      bad.push(`${key}: placeholders differ (${holders(e.en)} vs ${holders(e.es)})`);
  }
  assert.deepEqual(bad, []);
});

test("every key the source asks for exists (static keys, and each dynamic family)", () => {
  const used = new Set();
  for (const file of walk(join(LAB, "src"), (n) => n.endsWith(".js")))
    for (const m of readFileSync(file, "utf8").matchAll(/\bL[S]?\(\s*["']([\w.]+)["']/g))
      used.add(m[1]);
  const missing = [...used].filter((k) => !(k in STRINGS));
  assert.deepEqual(missing, [], `unknown string keys: ${missing.join(", ")}`);
  const families = {
    "hub.skill.": ["Listening", "Reading", "Speaking", "Writing"],
    "hub.skill.name.": ["Listening", "Reading", "Speaking", "Writing"],
    "setup.time.": [5, 10, 15, 0],
    "setup.who.": ["together", "independent"],
    "plan.support.": ["A", "B", "C"],
    "prog.m.": ["completed", "independent", "help", "revised"],
    "help.walk.": [1, 2, 3, 4],
    "copilot.phase.": ["before", "during", "after"],
    "save.where.": [1, 2, 3, 4, 5],
  };
  for (const [prefix, suffixes] of Object.entries(families))
    for (const s of suffixes) assert.ok(`${prefix}${s}` in STRINGS, `missing ${prefix}${s}`);
  for (const m of ["completed", "independent", "help", "revised"])
    assert.ok(`prog.m.${m}.text` in STRINGS);
});

// ── language modes ────────────────────────────────────────────────────────────
test("English, Español and bilingual render as specified", () => {
  const en = makeI18n("en", "en");
  const es = makeI18n("es", "es");
  const esOnEnglishPage = makeI18n("es", "en");
  const bi = makeI18n("bi", "en");
  assert.equal(en.T("Practice", "Practicar"), "Practice");
  assert.equal(es.T("Practice", "Practicar"), "Practicar");
  assert.equal(
    toHtml(esOnEnglishPage.T("Practice", "Practicar")),
    '<span lang="es">Practicar</span>',
    "Spanish on an English page is tagged",
  );
  const pair = toHtml(bi.T("Practice", "Practicar"));
  assert.ok(
    pair.includes("Practice") && pair.includes('<span class="bi-es" lang="es">Practicar</span>'),
    pair,
  );
  assert.equal(bi.S("Practice", "Practicar"), "Practice / Practicar");
  assert.equal(es.S("Practice", "Practicar"), "Practicar");
  assert.equal(en.S("Practice", "Practicar"), "Practice");
  assert.equal(toHtml(bi.T("Alias", "Alias")), "Alias", "identical words are not doubled");
  assert.equal(
    toHtml(bi.T("<b>", "<i>")).includes("<b>"),
    false,
    "bilingual output escapes its text",
  );
  assert.equal(es.L("hub.cta.how"), "¿Cómo funciona?");
  assert.ok(toHtml(bi.L("hub.cta.how")).includes("How does this work?"));
  assert.equal(es.L("common.minutes", { n: 5 }), "5 min");
  assert.equal(bi.LS("setup.step", { n: 2, total: 4 }), "Step 2 of 4 / Paso 2 de 4");
});

test("the language preference is validated and the document language is honest", () => {
  assert.equal(langMode({ lang: "bi" }), "bi");
  assert.equal(langMode({ lang: "fr" }), "en", "an unsupported language is not claimed");
  assert.equal(langMode(undefined), "en");
  assert.equal(docLang("family", "es"), "es");
  assert.equal(
    docLang("activity", "es"),
    "en",
    "activity content is English, so the page stays lang=en",
  );
  assert.equal(docLang("family", "bi"), "en");
  const html = toHtml(langSwitchHTML("bi"));
  assert.ok(
    html.includes('data-lang-mode="en"') &&
      html.includes('data-lang-mode="es"') &&
      html.includes('data-lang-mode="bi"'),
  );
  assert.ok(
    html.includes('aria-pressed="true"') && html.split('aria-pressed="true"').length === 2,
    "exactly one mode is pressed",
  );
});

// ── content files ─────────────────────────────────────────────────────────────
const BANNED =
  /\b(smart|stupid|dumb|wrong answer|you failed|mastery|mastered|proficien|WIDA level|predict(s|ed)? (your|the) (score|result)|passing score|timer)\b|give (him|her|them|your child) the answer|tell (him|her|them) the answer/i;
const lines = (o) =>
  Array.isArray(o)
    ? o.flatMap(lines)
    : o && typeof o === "object"
      ? typeof o.en === "string" && typeof o.es === "string"
        ? [o]
        : Object.values(o).flatMap(lines)
      : [];

test("family-help.json has the required topics, tips and quick-start in both languages", () => {
  assert.deepEqual(
    helpData.tips.map((t) => t.id),
    [
      "help-without-answers",
      "when-stuck",
      "encourage-speaking",
      "limited-english",
      "no-microphone",
      "keep-and-resume",
    ],
  );
  assert.deepEqual(
    helpData.help.map((t) => t.id),
    [
      "getting-started",
      "choosing-activities",
      "english-learners-help",
      "using-microphone",
      "playing-audio",
      "saving-and-resuming",
      "shared-device",
      "printing",
      "understanding-results",
      "child-stuck",
      "practice-without-adult",
      "practice-offline",
    ],
  );
  assert.equal(helpData.steps.length, 3);
  assert.equal(helpData.quickstart.items.length, 8);
  for (const t of helpData.help) {
    assert.ok(t.steps.length >= 3 && t.steps.length <= 5, `${t.id} step count`);
    assert.ok(t.keywords.en.length >= 4 && t.keywords.es.length >= 4, `${t.id} keywords`);
  }
  for (const l of lines(helpData)) {
    assert.ok(l.en.trim() && l.es.trim(), "empty language");
    assert.notEqual(l.en, l.es, `Spanish copied from English: ${l.en}`);
    assert.doesNotMatch(`${l.en} ${l.es}`, BANNED, `banned claim in: ${l.en}`);
  }
});

test("family-coach.json: 3 variants per slot, placeholders match needs, no banned claims", () => {
  const slots = {
    before: ["ask", "success"],
    during: ["say", "listen", "stuck", "explain", "support"],
    after: ["praise", "reinforce", "ask", "away"],
  };
  for (const domain of ["Listening", "Reading", "Speaking", "Writing"])
    for (const [phase, names] of Object.entries(slots))
      for (const slot of names) {
        const variants = coachData.coach[domain]?.[phase]?.[slot];
        assert.equal(variants?.length, 3, `${domain}.${phase}.${slot} needs exactly 3 variants`);
        assert.equal(
          new Set(variants.map((v) => v.en)).size,
          3,
          `${domain}.${phase}.${slot} variants must differ`,
        );
      }
  for (const type of [
    "multipleChoice",
    "multiSelect",
    "cloze",
    "order",
    "sort",
    "hotText",
    "constructed",
    "worksheet",
  ])
    assert.equal(coachData.types[type]?.tip?.length, 3, `types.${type}.tip needs 3 variants`);
  const NEED = { frame: "frame", listenFor: "listenFor", word: "word", wordEs: "word" };
  for (const l of lines(coachData)) {
    assert.ok(l.en.trim() && l.es.trim());
    assert.notEqual(l.en, l.es);
    assert.equal(holders(l.en) === holders(l.es), true, `placeholders differ: ${l.en}`);
    const needs = new Set(l.needs || []);
    for (const h of holders(l.en).split(",").filter(Boolean)) {
      if (["skill", "title"].includes(h)) continue;
      assert.ok(NEED[h], `unknown placeholder {${h}}`);
      assert.ok(needs.has(NEED[h]), `{${h}} requires needs:["${NEED[h]}"] in: ${l.en}`);
    }
    assert.doesNotMatch(`${l.en} ${l.es}`, BANNED, `banned claim in: ${l.en}`);
  }
});

const activities = [];
for (const file of walk(join(LAB, "content"), (n) => n.endsWith(".json"))) {
  if (!/content\/g(3-5|6-8)\//.test(file)) continue;
  const d = JSON.parse(readFileSync(file, "utf8"));
  for (const level of Object.values(d.levels))
    for (const a of level.activities) activities.push({ ...a, domain: d.domain });
}

test("es-guide.json translates every activity's goal and directions and keeps blanks and numbers", () => {
  assert.ok(activities.length >= 500);
  const bad = [];
  for (const a of activities) {
    const es = esGuide[a.id];
    if (!es?.skill || !es?.directions) {
      bad.push(`${a.id}: missing`);
      continue;
    }
    if ((a.directions.match(/___/g) || []).length !== (es.directions.match(/___/g) || []).length)
      bad.push(`${a.id}: blank count differs`);
    const nums = new Set(a.directions.match(/\d+/g) || []);
    for (const n of nums) if (!es.directions.includes(n)) bad.push(`${a.id}: number ${n} dropped`);
    if (es.directions === a.directions) bad.push(`${a.id}: not translated`);
  }
  assert.deepEqual(bad, []);
  assert.equal(Object.keys(esGuide).length, activities.length, "no orphan translations");
});

// ── Co-Pilot ──────────────────────────────────────────────────────────────────
const { buildCoaching, coachFacts, hash } = await import(join(LAB, "src/family/coach.js"));

test("Co-Pilot gives every activity all three phases with no unresolved placeholders", () => {
  const phrases = new Set();
  let withFrame = 0;
  for (const a of activities) {
    const domain = ["Listening", "Reading", "Speaking", "Writing"].includes(a.domain)
      ? a.domain
      : null;
    if (!domain) continue;
    const c = buildCoaching(a, domain, coachData, esGuide[a.id]);
    assert.ok(c, a.id);
    for (const phase of ["before", "during", "after"])
      assert.ok(Object.keys(c.phases[phase]).length >= 2, `${a.id} ${phase} has too few lines`);
    for (const [phase, lines] of Object.entries(c.phases))
      for (const [slot, l] of Object.entries(lines)) {
        assert.doesNotMatch(
          `${l.en} ${l.es}`,
          /\{\w+\}/,
          `${a.id} ${phase}.${slot} left a placeholder`,
        );
        assert.ok(l.en && l.es);
        phrases.add(l.en);
      }
    assert.equal(c.contentAware, Boolean(a.skill));
    if (c.facts.frame) withFrame++;
  }
  assert.ok(
    phrases.size > 150,
    `coaching text must vary across activities; only ${phrases.size} distinct lines`,
  );
  assert.ok(withFrame > 100, "many activities should be able to quote a sentence frame");
});

test("Co-Pilot quotes the activity's own goal and is stable per activity", () => {
  const a = activities.find((x) => x.id === "g35-l-a-classroom-place");
  const c = buildCoaching(a, "Listening", coachData, esGuide[a.id]);
  const all = JSON.stringify(c.phases);
  assert.ok(/classroom direction|one-step/i.test(all), "the English goal appears");
  assert.ok(/instrucci/i.test(all), "the Spanish goal appears");
  assert.equal(
    JSON.stringify(buildCoaching(a, "Listening", coachData, esGuide[a.id]).phases),
    all,
    "same activity, same coaching",
  );
  assert.equal(hash("x"), hash("x"));
  // an activity with no goal gets general coaching and says so
  const bare = buildCoaching(
    { id: "no-goal", title: "T", type: "multipleChoice" },
    "Reading",
    coachData,
    {},
  );
  assert.equal(bare.contentAware, false);
  assert.doesNotMatch(JSON.stringify(bare.phases), /\{\w+\}/);
  assert.equal(coachFacts({ vocabulary: [["shelf", "d", "estante: tabla"]] }).wordEs, "estante");
});

// ── planner, summary, state, search ───────────────────────────────────────────
const { trimToMinutes } = await import(join(LAB, "src/family/plan.js"));
const { summarize } = await import(join(LAB, "src/family/summary.js"));
const { getFamily, familyPatch } = await import(join(LAB, "src/family/state.js"));
const { searchTopics } = await import(join(LAB, "src/family/help.js"));

test("sessions stop near the time estimate and always keep the first activity", () => {
  const row = (id, minutes) => ({ id, minutes, type: "multipleChoice", domain: "Reading" });
  const rows = [row("a", 4), row("b", 4), row("c", 4), row("d", 4)];
  assert.deepEqual(
    trimToMinutes(rows, 5).map((r) => r.id),
    ["a"],
    "two 4-minute activities would overshoot a 5-minute session",
  );
  assert.deepEqual(
    trimToMinutes(rows, 10).map((r) => r.id),
    ["a", "b", "c"],
  );
  assert.deepEqual(
    trimToMinutes([row("long", 9)], 5).map((r) => r.id),
    ["long"],
    "a single long activity is still offered",
  );
  assert.equal(
    trimToMinutes(rows, 0).length >= 2,
    true,
    "'choose my own' falls back to a default length",
  );
});

test("progress summary keeps completion, independence, help and revision apart and invents nothing", () => {
  const rec = (domain, complete, results) => ({
    band: "6-8",
    domain,
    level: "A",
    record: { complete, results },
  });
  const day = "2026-10-20T14:00:00.000Z";
  const s = summarize(
    [
      rec("Reading", ["r1", "r2"], {
        r1: { evidence: "independent", date: day, ok: true },
        r2: { evidence: "supported", date: day, ok: true },
        r3: { evidence: "draft", meaningful: false, date: day },
      }),
      rec("Writing", ["w1"], { w1: { evidence: "revised", date: "2026-10-21T10:00:00.000Z" } }),
    ],
    new Map([["w1", { title: "Describe", skill: "Writing a detail sentence" }]]),
    { w1: { skill: "Escribir una oración con detalles" } },
  );
  assert.equal(s.completed, 3);
  assert.equal(s.independent, 1);
  assert.equal(s.help, 1);
  assert.equal(s.revised, 1);
  assert.equal(s.byDomain.Reading.tried, 2, "a draft is not counted as practice");
  assert.equal(s.dayCount, 2);
  assert.equal(s.latest.day, "2026-10-21");
  assert.equal(s.latest.items[0].skillEs, "Escribir una oración con detalles");
  assert.equal(s.nextDomain, "Listening");
  assert.equal(s.nextKind, "try");
  const empty = summarize([]);
  assert.equal(empty.hasWork, false);
  assert.equal(empty.latest, null);
  assert.equal(empty.nextDomain, null);
});

test("setup answers are versioned, sanitized and never hold identity", () => {
  assert.deepEqual(getFamily(undefined), {
    v: 1,
    grade: "",
    who: "",
    minutes: 0,
    done: false,
    skipped: false,
    trip: null,
    tripWeeks: [],
  });
  assert.equal(
    getFamily({ family: { grade: "9-12", who: "x", minutes: 7, name: "Ana", email: "a@b.c" } })
      .grade,
    "",
  );
  assert.deepEqual(Object.keys(getFamily({ family: { name: "Ana" } })).sort(), [
    "done",
    "grade",
    "minutes",
    "skipped",
    "trip",
    "tripWeeks",
    "v",
    "who",
  ]);
  const next = familyPatch({ family: { grade: "3-5" } }, { minutes: 10 }).family;
  assert.deepEqual([next.grade, next.minutes, next.v], ["3-5", 10, 1]);
});

test("help search matches either language, every word, and returns all topics for an empty query", () => {
  const topics = helpData.help;
  assert.equal(searchTopics(topics, "").length, 12);
  assert.ok(searchTopics(topics, "microphone").some((t) => t.id === "using-microphone"));
  assert.ok(
    searchTopics(topics, "micrófono").some((t) => t.id === "using-microphone"),
    "Spanish query finds the topic",
  );
  assert.ok(searchTopics(topics, "imprimir").some((t) => t.id === "printing"));
  assert.equal(searchTopics(topics, "zzzzqq").length, 0);
  assert.ok(searchTopics(topics, "save backup").length <= searchTopics(topics, "save").length);
});

// ── engagement ────────────────────────────────────────────────────────────────
const { weekFor, weeklyChallenge, recognition, nextRecognition } = await import(
  join(LAB, "src/family/engage.js")
);
const road = json("content/road.json");

test("the weekly challenge is the current Road week, with its own authored family prompt", () => {
  for (const band of ["3-5", "6-8"]) {
    const plan = road[band];
    const first = plan.weeks[0];
    assert.equal(weekFor(plan, "1999-01-01").n, first.n, "before the plan starts, show week 1");
    const last = plan.weeks.at(-1);
    assert.equal(weekFor(plan, "2999-01-01").n, last.n, "after the plan ends, show the last week");
    const mid = plan.weeks[3];
    assert.equal(weekFor(plan, mid.start).n, mid.n);
    const done = weeklyChallenge(plan, [{ record: { complete: [mid.activities[0]] } }], mid.start);
    assert.equal(done.total, mid.activities.length);
    assert.equal(done.done, 1);
    assert.ok(done.prompt?.en && done.prompt?.es, "each week carries a bilingual family prompt");
    assert.equal(weeklyChallenge(plan, [], mid.start).done, 0);
  }
  assert.equal(weeklyChallenge({}, [], "2026-10-28"), null);
});

test("recognition rewards trying, retrying and revising, and only what the saved work shows", () => {
  const empty = {
    byDomain: {
      Listening: { tried: 0 },
      Reading: { tried: 0 },
      Speaking: { tried: 0 },
      Writing: { tried: 0 },
    },
    dayCount: 0,
    help: 0,
    revised: 0,
  };
  assert.deepEqual(recognition(empty), []);
  assert.deepEqual(nextRecognition(empty), { kind: "first", domain: "Listening" });
  const some = { ...empty, byDomain: { ...empty.byDomain, Reading: { tried: 2 } }, help: 1 };
  assert.deepEqual(
    recognition(some).map((r) => r.kind),
    ["first", "retry"],
  );
  const all = {
    byDomain: {
      Listening: { tried: 1 },
      Reading: { tried: 1 },
      Speaking: { tried: 1 },
      Writing: { tried: 1 },
    },
    dayCount: 3,
    help: 1,
    revised: 1,
  };
  assert.deepEqual(
    recognition(all).map((r) => r.kind),
    ["first", "first", "first", "first", "allFour", "days", "retry", "revised"],
  );
  assert.equal(nextRecognition(all), null);
  for (const kind of ["first", "allFour", "days", "retry", "revised"])
    assert.ok(`recog.${kind}` in STRINGS, kind);
  // Recognition copy never uses pressure language. The one place that says "no streak" is the reassurance itself.
  for (const [key, e] of Object.entries(STRINGS).filter(
    ([k]) => /^(recog|chal)\./.test(k) && k !== "chal.note",
  ))
    assert.doesNotMatch(
      e.en,
      /\b(streak|lose|lost|points?|rank|leaderboard|prize|hurry|fast)\b/i,
      key,
    );
});

test("pair() embeds one phrase inside another in both languages", () => {
  const bi = makeI18n("bi", "en");
  const es = makeI18n("es", "es");
  const what = es.pair("recog.first", { domain: { en: "reading", es: "lectura" } });
  assert.equal(what.en, "First reading activity done");
  assert.equal(what.es, "Primera actividad de lectura terminada");
  assert.equal(
    es.L("recog.next", { what }),
    "Para intentar después: Primera actividad de lectura terminada",
  );
  assert.ok(
    toHtml(bi.L("recog.next", { what })).includes("Next to try: First reading activity done"),
  );
});
