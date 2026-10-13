#!/usr/bin/env node
/**
 * Behavior tests for the Math Workbench Reasoning Studio.
 *
 * The Studio is browser code split across several files, so this boots the real
 * files into a jsdom window with a stub of the Workbench's MathWorkbenchAPI and
 * drives it the way a student does. What it holds, each from a defect that was
 * observed on the live page:
 *
 *   - the Evidence view round trip (it threw and stranded the student),
 *   - the analyzer cannot be satisfied by clicking representation chips, by
 *     keyword stuffing, or by substring accidents ("per" inside "perimeter"),
 *   - a correct Spanish explanation is not penalised for being Spanish,
 *   - each representation stamps the object that really is that representation,
 *   - every string the code uses exists in English AND Spanish,
 *   - no teacher PIN is copied into the Studio; the view gates on the sticky flag,
 *   - the stylesheet keeps a valid font on the textarea students type into.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const root = "curriculum/math-workbench";
const FILES = [
  "reasoning-data.js",
  "reasoning-tags.js",
  "reasoning-exemplars.js",
  "reasoning-i18n.js",
  "reasoning-messages.js",
  "reasoning-analyze.js",
  "reasoning-store.js",
  "reasoning-tools.js",
  "reasoning-stamp.js",
  "reasoning-state.js",
  "reasoning-coach.js",
  "reasoning-panels.js",
  "reasoning-teacher.js",
  "reasoning-studio.js",
];
const source = (name) => readFileSync(`${root}/${name}`, "utf8");
const html = source("index.html");
const css = source("reasoning-studio.css");
const sw = source("sw.js");
const clone = (value) => JSON.parse(JSON.stringify(value));

/** A ratio table and a double number line, both really filled in. */
const FILLED = {
  page: 1,
  pageCount: 1,
  objectCount: 2,
  strokeCount: 0,
  items: [
    { id: "o1_a", type: "ratiotable", filled: true, top: ["2", "4", "6"], bottom: ["3", "6", "9"] },
    { id: "o2_b", type: "dblnumline", filled: true, top: ["", "2", "4"], bottom: ["", "3", "6"] },
  ],
  numbers: [2, 3, 4, 6, 9],
  hasEquationText: false,
};
const EMPTY = {
  page: 1,
  pageCount: 1,
  objectCount: 0,
  strokeCount: 0,
  items: [],
  numbers: [],
  hasEquationText: false,
};

function makeApi(digest) {
  const calls = { callouts: [] };
  return {
    calls,
    getBoardDigest: () => clone(digest),
    getSnapshot: () => ({ modelCount: digest.items.length }),
    getProblemText: () => "",
    getSelectedObject: () => null,
    getThumbnail: () => "",
    getInkReplay: () => ({ strokes: [], objects: [] }),
    supportsType: (type) => !["hundredgrid", "balance"].includes(type),
    addCallout: (id, text) => {
      calls.callouts.push([id, text]);
      return true;
    },
  };
}

async function boot({ digest = FILLED, teacher = false, lang = "", seed = {}, api } = {}) {
  const dom = new JSDOM(
    '<!doctype html><body><button id="reasoningStudioBtn">Studio</button></body>',
    {
      url: "http://localhost/curriculum/math-workbench/",
      runScripts: "outside-only",
      pretendToBeVisual: true,
    },
  );
  const w = dom.window;
  if (w.document.readyState !== "complete")
    await new Promise((resolve) => w.addEventListener("load", resolve));
  w.HTMLCanvasElement.prototype.getContext = () => ({
    fillRect() {},
    strokeRect() {},
    setLineDash() {},
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
  });
  w.URL.createObjectURL = () => "blob:test";
  w.confirm = () => true;
  for (const [k, v] of Object.entries(seed)) w.localStorage.setItem(k, v);
  if (teacher) w.localStorage.setItem("nt-teacher-mode", "1");
  if (lang) w.__mwbLang = lang;
  w.MathWorkbenchAPI = api || makeApi(digest);
  w.errors = [];
  w.addEventListener("error", (e) => w.errors.push(e.message || String(e.error)));
  for (const f of FILES) w.eval(source(f));
  return w;
}

const click = (w, selector) => {
  const node = w.document.querySelector(selector);
  assert.ok(node, `missing ${selector}`);
  node.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
};
const type = (w, selector, value) => {
  const node = w.document.querySelector(selector);
  assert.ok(node, `missing ${selector}`);
  node.value = value;
  node.dispatchEvent(new w.Event("input", { bubbles: true }));
};
const heading = (w) => w.document.querySelector(".mwr-body h3")?.textContent || "";

/* ---------------------------------------------------------------- data */
{
  const w = await boot();
  const D = w.MWReasoningData;
  const skills = Object.keys(D.SKILLS);
  assert.equal(skills.length, 12, "twelve Grade 6 reasoning domains are available");
  const registry = JSON.parse(source("../../data/ccss-standards.json")).standards;
  for (const [id, skill] of Object.entries(D.SKILLS)) {
    assert.match(
      skill.standard,
      /^6\.(AT|NOS|GR|DS)\./,
      `${id} uses a 2025 MCCRS code, not a 2010 CCSS code`,
    );
    const first = skill.standard.split(/[–,]/)[0].trim();
    assert.ok(
      Object.keys(registry).some((k) => k === first || k.startsWith(first)),
      `${id}: ${first} exists in data/ccss-standards.json`,
    );
    assert.ok(
      skill.concepts.en.length && skill.concepts.es.length,
      `${id} has English and Spanish concept words`,
    );
    assert.ok(skill.reps.length === 4, `${id} offers four representations`);
    assert.equal("answer" in skill, false, "no hidden answer key is shipped in reasoning content");
    assert.equal("solution" in skill, false, "no hidden solution is shipped in reasoning content");
  }
  assert.deepEqual(
    Object.keys(D.STEMS.en),
    ["1", "2", "3", "4", "5"],
    "five scaffold levels in English",
  );
  assert.deepEqual(
    Object.keys(D.STEMS.es),
    ["1", "2", "3", "4", "5"],
    "five scaffold levels in Spanish",
  );
  for (const id of skills)
    assert.ok(w.MWReasoningExemplars[id], `${id} has a find-the-flaw warm-up`);
}

/* ---------------------------------------------------------------- analyzer */
{
  const w = await boot();
  const analyze = (input) => clone(w.MWReasoningData.analyze(input));
  const good =
    "For every 2 cups there are 3 batches, so I scaled both quantities by 4 because the ratio table matches the number line.";

  const connected = analyze({
    skill: "ratio",
    response: good,
    digest: FILLED,
    prompt: "2 cups of flour for every 3 batches",
  });
  assert.equal(connected.status, "connected-reasoning-visible");
  assert.ok(connected.confidence < 1, "every inference stays provisional");
  assert.ok(connected.profile.link, "naming both representations counts as linking them");

  const short = analyze({ skill: "ratio", response: "I divided.", digest: FILLED });
  assert.equal(short.status, "reasoning-not-yet-visible", "short work receives a writing prompt");

  // Chip-only: the old analyzer counted clicked chips as board evidence.
  const chips = analyze({
    skill: "ratio",
    response: good,
    representations: ["ratio table", "double number line"],
    digest: EMPTY,
  });
  assert.equal(
    chips.status,
    "representation-connection-needed",
    "clicking chips on an empty board proves nothing",
  );
  assert.deepEqual(chips.unmetReps.sort(), ["double number line", "ratio table"]);

  // Keyword stuffing and a stem copied back with math words in the blanks.
  const stuffed = analyze({
    skill: "ratio",
    response: "per each scale for every because blah blah blah blah",
    digest: FILLED,
  });
  assert.equal(stuffed.status, "reasoning-not-yet-visible", "keywords alone are not reasoning");
  const frame = analyze({
    skill: "area",
    response: "First I base. Then I height because square units half.",
    digest: {
      items: [
        { type: "shape2d", filled: true },
        { type: "arraymodel", filled: true, rows: 2, cols: 3 },
      ],
    },
  });
  assert.equal(
    frame.status,
    "reasoning-not-yet-visible",
    "a frame filled with math words is not reasoning",
  );

  // "per" must not match inside "percent" or "perimeter".
  const accident = analyze({
    skill: "ratio",
    response: "I added perimeter and percent together because the answer was wrong anyway ok.",
    digest: FILLED,
  });
  assert.equal(accident.status, "concept-link-needed", "substring matches are gone");
  assert.equal(accident.profile.concept, false);

  // Correct Spanish is not penalised for being Spanish.
  const spanish = analyze({
    skill: "ratio",
    language: "es",
    response:
      "Mi tabla muestra que por cada 2 tazas hay 3 tandas, y escalé por 4 porque 3 por 4 es 12.",
    digest: FILLED,
  });
  assert.equal(
    spanish.status,
    "connected-reasoning-visible",
    "a correct Spanish explanation is recognised",
  );
  assert.match(spanish.signal, /modelo/, "the reply is in Spanish");

  // Correct math without a listed phrase: "times" and "multiply" now count.
  const times = analyze({
    skill: "ratio",
    response:
      "Twelve is four times three so I multiply two by four to get eight cups because the pattern holds.",
    digest: FILLED,
  });
  assert.equal(times.status, "connected-reasoning-visible");

  // A table whose columns do not scale together is flagged without stating a fix.
  const off = clone(FILLED);
  off.items[0].bottom = ["3", "6", "10"];
  const inconsistent = analyze({ skill: "ratio", response: good, digest: off });
  assert.equal(inconsistent.status, "model-consistency-check");
  assert.match(inconsistent.evidence, /Column 3/);
  assert.doesNotMatch(
    inconsistent.evidence,
    /\b9\b/,
    "the check never states the value that would fix it",
  );

  // The ratio check applies to ratio and percent only; a statistics table is not a ratio.
  const stats = analyze({
    skill: "statistics",
    response:
      "The data cluster near 7 so the median is a typical value because the outlier does not pull it, and the table shows the spread.",
    digest: {
      items: [
        { type: "dotplot", filled: true },
        { type: "ratiotable", filled: true, top: ["1", "2", "3"], bottom: ["5", "9", "2"] },
      ],
      numbers: [1, 2, 3, 5, 9],
      hasEquationText: false,
    },
  });
  assert.equal(
    stats.status,
    "connected-reasoning-visible",
    "value/frequency tables are not checked as ratios",
  );

  // Units: expected when the problem names one.
  const noUnit = analyze({
    skill: "ratio",
    response:
      "For every 2 there are 3 so I scaled both by 4 because the ratio table matches the number line.",
    digest: FILLED,
    prompt: "2 cups of flour for every 3 batches",
  });
  assert.equal(noUnit.status, "unit-meaning-needed");

  // Dimensions, practices and misconception keys come from the taxonomy.
  assert.ok(
    connected.smp.includes("MP4") && connected.smp.includes("MP7"),
    "math practices are tagged from the evidence",
  );
  const added = analyze({
    skill: "ratio",
    response: "I added the numbers up because that is how you do it right",
    digest: FILLED,
  });
  assert.deepEqual(added.tags, ["ratio-scaled-additively"]);
  assert.ok(w.MWReasoningTags["ratio-scaled-additively"].labelEs, "tags carry Spanish labels");

  // Revision diff and the optional second-strategy step.
  const diff = clone(w.MWRAnalyzer.diffWords("I scaled both", "I scaled both quantities because"));
  assert.deepEqual(
    diff.filter((d) => d.type === "add").map((d) => d.t),
    ["quantities", "because"],
  );
  assert.deepEqual(
    clone(
      w.MWRAnalyzer.analyzeCompare({
        second: "Use the unit rate instead",
        which: "The table is faster because I see every column",
      }),
    ),
    { present: true, justified: true },
  );
  assert.equal(w.MWRAnalyzer.analyzeCompare({ second: "", which: "" }).present, false);
}

/* ---------------------------------------------------------------- stamp matrix */
{
  const w = await boot();
  const build = (skill, reps, api = makeApi(EMPTY), language = "en") =>
    clone(
      w.MWRStamp.build(
        {
          skill,
          level: "2",
          language,
          prompt: "",
          representations: reps,
          linked: { a: 2, b: 3, factor: 4 },
        },
        api,
      ),
    );
  const types = (specs) => specs.map((s) => s.type);

  assert.deepEqual(
    types(build("fraction", ["number line"])),
    ["numline"],
    "a fraction number line is a number line, not a double number line",
  );
  const statsTable = build("statistics", ["table"])[0];
  assert.equal(statsTable.type, "ratiotable");
  assert.deepEqual(
    [statsTable.props.topLabel, statsTable.props.botLabel],
    ["value", "frequency"],
    "a statistics table is labelled value/frequency, not ratio quantities",
  );
  assert.equal(build("twovar", ["table"])[0].props.topLabel, "input");
  assert.deepEqual(
    types(build("percent", ["hundred model"])),
    ["tape"],
    "no hundred grid on this board yet: a 10-part tape stands in",
  );
  assert.deepEqual(
    types(build("percent", ["hundred model"], { ...makeApi(EMPTY), supportsType: () => true })),
    ["hundredgrid"],
    "a hundred grid is used when the board has one",
  );
  assert.deepEqual(types(build("equation", ["balance model"])), ["algebra"]);
  assert.deepEqual(
    types(build("equation", ["balance model"], { ...makeApi(EMPTY), supportsType: () => true })),
    ["balance"],
  );
  assert.equal(build("area", ["shape model"])[0].type, "shape2d");
  assert.equal(build("volume", ["3-D model"])[0].type, "shape3d");

  // Equation frames are blanks for every skill except the ratio/percent lab the student set.
  for (const skill of Object.keys(w.MWReasoningData.SKILLS)) {
    const text = build(skill, ["equation"])[0].props.text;
    if (skill === "ratio") assert.equal(text, "2 : 3 = 8 : 12");
    else if (skill === "percent") assert.equal(text, "2/3 = 8/12");
    else assert.match(text, /_{3,}/, `${skill}: the equation frame has blanks`);
    if (skill !== "ratio")
      assert.doesNotMatch(text, /\d : \d/, `${skill}: no ratio colon on a non-ratio skill`);
  }

  // Tables and number lines carry only the given ratio, never a finished table.
  const table = build("ratio", ["ratio table"])[0];
  assert.deepEqual([table.props.top, table.props.bottom], [["2"], ["3"]]);
  const spanish = build("ratio", ["ratio table"], makeApi(EMPTY), "es")[0];
  assert.equal(spanish.props.topLabel, "primera cantidad");

  // The problem text is stamped once, never twice.
  const once = clone(
    w.MWRStamp.build(
      {
        skill: "ratio",
        level: "2",
        language: "en",
        prompt: "A recipe uses 2 cups for every 3 batches.",
        representations: [],
        linked: { a: 2, b: 3, factor: 4 },
      },
      { ...makeApi(EMPTY), getProblemText: () => "A recipe uses 2 cups for every 3 batches." },
    ),
  );
  assert.equal(once.length, 0);
}

/* ---------------------------------------------------------------- store */
{
  const w = await boot();
  const S = w.MWRStore;
  const session = (over = {}) => ({
    id: `s${Math.random()}`,
    at: new Date().toISOString(),
    skill: "ratio",
    standard: "6.AT.1–3",
    level: "2",
    language: "en",
    firstDraft: "I scaled both",
    revised: "I scaled both quantities because it stays equal",
    beforeConfidence: "2",
    afterConfidence: "3",
    firstAnalysis: { status: "justification-link-needed", profile: { claim: true } },
    analysis: {
      status: "connected-reasoning-visible",
      profile: { claim: true, reason: true },
      tags: ["ratio-scaled-additively"],
      smp: ["MP3"],
    },
    ...over,
  });
  S.saveSessions([session(), session({ at: "2020-01-01T00:00:00.000Z" })]);
  assert.equal(
    S.loadSessions().length,
    1,
    "cycles older than the retention setting are removed (default 90 days)",
  );
  S.setPref("retentionDays", 0);
  S.saveSessions([session(), session({ at: "2020-01-01T00:00:00.000Z" })]);
  assert.equal(S.loadSessions().length, 2, "retention can be turned off");

  const list = S.loadSessions();
  const research = JSON.stringify(S.researchExport(list));
  assert.doesNotMatch(
    research,
    /I scaled both/,
    "the de-identified research export carries no writing",
  );
  assert.doesNotMatch(research, /thumb|prompt|homeLanguage/);
  const share = JSON.stringify(S.shareExport(list));
  assert.match(
    share,
    /I scaled both quantities/,
    "a file a student chooses to share includes the writing",
  );
  assert.doesNotMatch(share, /"name"|studentId|"email"/i, "and never a name or id");
  const csv = S.toCsv(list);
  assert.match(csv.split("\n")[0], /first_signal,final_signal/);
  assert.doesNotMatch(csv, /I scaled/);

  const agg = S.aggregate(list);
  assert.equal(agg.total, 2);
  assert.equal(agg.growth.improved, 2, "first-draft and final signals show growth");
  assert.equal(agg.byStatus["connected-reasoning-visible"], 2);
  assert.ok(agg.exemplars.length === 2);

  const bad = S.parseImport({
    sessions: [
      { skill: "ratio", analysis: { status: "<script>" }, firstDraft: "x".repeat(5000) },
      null,
      7,
    ],
  });
  assert.equal(bad.sessions.length, 1, "malformed rows are dropped");
  assert.equal(
    bad.sessions[0].finalStatus,
    "not-yet-observed",
    "an unknown status cannot be injected",
  );
  assert.ok(bad.sessions[0].firstDraft.length <= 1500, "imported text is clamped");
  assert.equal(S.parseImport({ nope: 1 }).error, "shape");

  // A student's shared file survives the teacher's import: same signals, same writing.
  const roundTrip = S.parseImport(JSON.parse(share)).sessions;
  assert.equal(roundTrip.length, 2);
  assert.deepEqual(
    S.aggregate(roundTrip).byStatus,
    agg.byStatus,
    "importing a shared file keeps the signals",
  );
  assert.deepEqual(S.aggregate(roundTrip).growth, agg.growth);
  assert.equal(roundTrip[0].revised, list[0].revised, "and the writing, for the exemplar pairs");
  assert.deepEqual(
    S.aggregate(S.parseImport(JSON.parse(research)).sessions).byStatus,
    agg.byStatus,
    "the research export imports too",
  );

  // Scaffold fade: two connected cycles in a row at one level move it up.
  S.resetFade(2);
  assert.equal(S.recordOutcome(2, true), false);
  assert.equal(S.recordOutcome(2, true), true);
  assert.equal(S.recordOutcome(2, false), false, "a miss resets the run");
}

/* ---------------------------------------------------------------- strings */
{
  const w = await boot();
  const { EN, ES } = w.MWRI18n;
  assert.deepEqual(
    Object.keys(ES).sort(),
    Object.keys(EN).sort(),
    "Spanish and English have exactly the same keys",
  );
  const used = new Set();
  for (const f of FILES.filter(
    (x) => !x.includes("i18n") && !x.includes("data") && !x.includes("messages"),
  )) {
    const text = source(f);
    for (const m of text.matchAll(/\bt\(\s*"([a-z0-9]+\.[a-zA-Z0-9]+|title|subtitle|privacy)"/g))
      used.add(m[1]);
    for (const m of text.matchAll(/button\(c, "[a-z-]+", "([a-zA-Z0-9.]+)"/g)) used.add(m[1]);
    for (const m of text.matchAll(
      /(?:[ ?:]|^)"((?:tv|sig|s[1-6]|dim|conf|tour|lab|nav|msg|resume|fade|frames|ex|anc|dictate|rate|coach|replay|refl|pf|home|hd|steps|ev)\.[a-zA-Z0-9]+)"/gm,
    ))
      used.add(m[1]);
  }
  for (let n = 1; n <= 4; n++) used.add(`conf.${n}`);
  for (let n = 1; n <= 5; n++) used.add(`tour.${n}`);
  for (let n = 1; n <= 6; n++) used.add(`step.${n}`);
  for (const d of ["claim", "reason", "concept", "model", "link", "units"]) used.add(`dim.${d}`);
  for (const key of used) {
    assert.ok(Object.hasOwn(EN, key), `English string missing: ${key}`);
    assert.ok(Object.hasOwn(ES, key), `Spanish string missing: ${key}`);
  }
  assert.ok(used.size > 120, "the key scan actually found the strings");
  for (const status of Object.keys(w.MWRStore.RANK)) {
    assert.notEqual(
      w.MWRI18n.statusLabel("es", status),
      w.MWRI18n.statusLabel("en", status),
      `${status} has a Spanish label`,
    );
  }
}

/* ---------------------------------------------------------------- the student flow */
{
  const w = await boot();
  const stamped = [];
  w.addEventListener("mwb:reasoning-stamp", (e) => stamped.push(clone(e.detail.objects)));

  click(w, "#reasoningStudioBtn");
  assert.ok(w.document.querySelector("#reasoningStudio").classList.contains("is-open"));
  assert.equal(
    w.document.activeElement.dataset.field,
    "prompt",
    "focus starts on the first task field, not a teacher control",
  );

  click(w, '[data-action="next"]');
  assert.match(
    w.document.querySelector(".mwr-live").textContent,
    /problem/i,
    "an empty problem keeps the student on step 1",
  );
  click(w, '[data-action="tour-done"]');
  type(
    w,
    'textarea[data-field="prompt"]',
    "A recipe uses 2 cups of flour for every 3 batches. How much flour for 12 batches?",
  );
  click(w, '[data-action="next"]');
  assert.match(heading(w), /Model/);
  click(w, '[data-value="ratio table"]');
  click(w, '[data-action="stamp"]');
  assert.equal(stamped.length, 1);
  assert.ok(stamped[0].some((o) => o.type === "ratiotable"));

  click(w, '[data-action="next"]');
  type(
    w,
    'textarea[data-field="firstDraft"]',
    "For every 2 cups there are 3 batches so I scaled both by 4 because the ratio table matches the double number line",
  );
  click(w, '[data-action="analyze"]');
  assert.ok(w.document.querySelector(".mwr-signal"), "Check shows a signal");
  type(
    w,
    'textarea[data-field="firstDraft"]',
    "For every 2 cups there are 3 batches so I scaled both by 4",
  );
  assert.equal(
    w.document.querySelector(".mwr-signal"),
    null,
    "editing the draft clears the stale signal",
  );
  type(
    w,
    'textarea[data-field="firstDraft"]',
    "For every 2 cups there are 3 batches so I scaled both by 4 because the ratio table matches the double number line",
  );

  click(w, '[data-action="next"]');
  assert.match(
    heading(w),
    /Revise/,
    "Continue advances in one press (it used to run the checker first)",
  );
  type(
    w,
    'textarea[data-field="revised"]',
    "For every 2 cups there are 3 batches, so I scaled both quantities by 4 because the ratio table matches the double number line and the answer is in cups.",
  );
  click(w, '[data-action="next"]');
  assert.match(heading(w), /Compare/);
  click(w, '[data-action="next"]');
  assert.match(
    heading(w),
    /Evidence/,
    "Save evidence works on the first press even when the revision was not edited again",
  );

  const saved = JSON.parse(w.localStorage.getItem("neft.mathWorkbench.reasoning.v1"));
  assert.equal(saved.length, 1);
  assert.ok(
    saved[0].firstAnalysis && saved[0].analysis,
    "both the first-draft and the final signal are stored",
  );
  assert.equal(saved[0].analysis.status, "connected-reasoning-visible");
  assert.equal(saved[0].rounds.length, 1, "the revision is recorded as a round");
  assert.equal(
    w.localStorage.getItem("neft.mathWorkbench.reasoning.draft"),
    null,
    "the draft is cleared once the cycle is saved",
  );

  // Teacher view: locked for a student, and the round trip no longer strands anyone.
  click(w, '[data-action="view-toggle"]');
  assert.match(heading(w), /needs Teacher Mode/);
  assert.equal(w.document.querySelector(".mwr-body").textContent.includes("What I wrote"), false);
  click(w, '[data-action="view-toggle"]');
  assert.match(heading(w), /Evidence/, "Student view returns to the cycle");
  click(w, '[data-action="view-toggle"]');
  click(w, '[data-action="close"]');
  click(w, "#reasoningStudioBtn");
  assert.match(heading(w), /Evidence/, "reopening lands on the student view, not the teacher view");
  assert.deepEqual(w.errors, [], "no uncaught errors in the whole flow");

  // Shortcuts: a keydown inside the Studio never reaches the Workbench's window handler.
  let reached = false;
  w.addEventListener("keydown", () => {
    reached = true;
  });
  w.document
    .querySelector(".mwr-btn")
    .dispatchEvent(new w.KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));
  assert.equal(
    reached,
    false,
    "Ctrl+Z / Delete / tool letters stay out of the board while the Studio has focus",
  );
}

/* ---------------------------------------------------------------- teacher gate + class dashboard */
{
  const w = await boot({ teacher: true });
  click(w, "#reasoningStudioBtn");
  click(w, '[data-action="view-toggle"]');
  assert.match(
    heading(w),
    /^Teacher view$/,
    "Teacher Mode (the sticky flag) opens the teacher view",
  );
  assert.ok(w.document.querySelector("#mwrImport"), "teachers can import student files");
  click(w, '[data-action="view-toggle"]');
  assert.match(heading(w), /Understand/);

  const forced = await boot({ teacher: true });
  forced.history.replaceState({}, "", "/curriculum/math-workbench/?student=1");
  assert.equal(
    forced.MWRTeacher.unlocked(),
    false,
    "?student=1 forces the student view, as in Teacher Mode",
  );
}

/* ---------------------------------------------------------------- language and layout */
{
  const w = await boot();
  click(w, "#reasoningStudioBtn");
  assert.equal(w.document.querySelector("#mwrTitle").textContent, "Reasoning Studio");
  w.dispatchEvent(new w.CustomEvent("mwb:lang", { detail: { lang: "es" } }));
  assert.equal(
    w.document.querySelector("#mwrTitle").textContent,
    "Estudio de razonamiento",
    "the Workbench's Español switch carries into the Studio",
  );
  assert.match(w.document.querySelector(".mwr-body").textContent, /Entender la tarea/);
  assert.match(
    w.document.querySelector(".mwr-step").textContent,
    /Entender/,
    "step names are Spanish too",
  );

  const dock = await boot();
  click(dock, "#reasoningStudioBtn");
  const before = dock.document.querySelector("#reasoningStudio").classList.contains("is-docked");
  click(dock, "#mwrDock");
  assert.notEqual(
    dock.document.querySelector("#reasoningStudio").classList.contains("is-docked"),
    before,
    "dock mode toggles",
  );
  assert.equal(
    dock.document.querySelector(".mwr-dialog").getAttribute("aria-modal"),
    before ? "true" : "false",
    "only the full-screen mode is modal",
  );
}

/* ---------------------------------------------------------------- unfinished cycle */
{
  const first = await boot();
  click(first, "#reasoningStudioBtn");
  type(
    first,
    'textarea[data-field="prompt"]',
    "A recipe uses 2 cups of flour for every 3 batches.",
  );
  const draft = await new Promise((resolve) =>
    setTimeout(
      () => resolve(first.localStorage.getItem("neft.mathWorkbench.reasoning.draft")),
      700,
    ),
  );
  assert.ok(draft, "typing saves an unfinished cycle");
  const again = await boot({ seed: { "neft.mathWorkbench.reasoning.draft": draft } });
  click(again, "#reasoningStudioBtn");
  assert.equal(
    again.document.querySelector('textarea[data-field="prompt"]').value,
    "A recipe uses 2 cups of flour for every 3 batches.",
    "the draft survives a reload",
  );
  assert.match(again.document.querySelector(".mwr-notice").textContent, /unfinished/);
  click(again, '[data-action="new"]');
  assert.equal(
    again.document.querySelector('textarea[data-field="prompt"]').value,
    "",
    "Start over clears it",
  );
}

/* ---------------------------------------------------------------- source facts */
const studioSources = FILES.map(source).join("\n");
assert.doesNotMatch(
  studioSources,
  /TeacherNeft|TeacherAlba|BlueHeron|RiverStone/,
  "no teacher PIN is copied into the Studio",
);
assert.doesNotMatch(
  source("reasoning-coach.js"),
  /answerShown\s*:/,
  "the client never sends a hidden answer",
);
assert.match(
  source("reasoning-coach.js"),
  /\/api\/reasoning\/review/,
  "bounded reasoning endpoint is canonical",
);
assert.match(
  studioSources,
  /No roster, name, or student ID|No name or account is needed/,
  "privacy boundary is visible",
);
assert.doesNotMatch(
  css,
  /font:[^;]*\binherit\s*;/,
  "font shorthand with `inherit` is invalid CSS and falls back to monospace",
);
assert.match(
  css,
  /\.mwr-textarea[\s\S]*?font:\s*700 1rem\/1\.45 "Atkinson Hyperlegible"/,
  "writing boxes use the page font",
);
assert.match(css, /:focus-visible/, "keyboard focus receives a visible treatment");
assert.match(css, /prefers-reduced-motion/, "reduced motion is respected");
assert.match(html, /id="reasoningStudioBtn"/, "Workbench exposes the Reasoning Studio launch");
assert.doesNotMatch(html, /openGoogleStudioModal/, "undefined Google Studio handler is removed");
assert.match(html, /window\.MathWorkbenchAPI = Object\.freeze/, "semantic board API is present");
assert.match(html, /mwb:reasoning-stamp/, "representations are stamped through a typed event");
assert.match(html, /getBoardDigest/, "the board exposes a structural digest");

let last = -1;
for (const f of FILES) {
  const at = html.indexOf(`/curriculum/math-workbench/${f}"`);
  assert.ok(at > last, `${f} is loaded, in dependency order`);
  last = at;
  assert.ok(sw.includes(`"./${f}"`), `offline cache includes ${f}`);
}
assert.match(sw, /reasoning-studio\.css/);
assert.doesNotMatch(
  sw,
  /CACHE = "mwb-v2"/,
  "the offline cache name was bumped so the new files replace the old ones",
);

console.log("Math Workbench Reasoning Studio: behavior tests passed");
