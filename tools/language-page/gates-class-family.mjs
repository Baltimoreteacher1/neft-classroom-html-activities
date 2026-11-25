// G-81 class brief golden, G-82 weekly family plan, G-83 progress note, G-84 text tips, G-85 no-egress.
// Every gate has negative controls that drive the SAME check functions at known-bad input and must fail.
import fs from "node:fs";
import { buildFamilyGuide } from "../../functions/_lib/bcpss/family-guide.js";
import {
  buildWeeklyPlan,
  NOTE_BANNED,
  progressNote,
  SAFETY,
  SITTING_CAP_MINUTES,
  screenTask,
} from "../../shared/bcpss-family-plan.js";
import { buildTips, MAX_TIP_CHARS, tipLength } from "../../shared/bcpss-family-tips.js";
import { validateAlias } from "../../shared/class-platform/contract.js";
import { briefText, buildDashboard, unitSnapshot } from "../../shared/class-platform/week-brief.js";
import { clone } from "./dataset.mjs";

const ROOT = new URL("../../", import.meta.url);
const read = (rel) => fs.readFileSync(new URL(rel, ROOT), "utf8");
const readJson = (rel) => JSON.parse(read(rel));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Tokens no family- or student-facing text may carry: initials, accommodation labels, level codes. */
export const BANNED_TOKENS = [
  // Student initials, not the math word: Grade 8 "initial value" is ordinary content (an early draft of this pattern flagged it).
  [
    /\binitials\b|\b(?:student|child|his|her|their|your|my|first|last)(?:'s)? initial\b/i,
    "initials",
  ],
  [/\biniciales\b/i, "iniciales"],
  [/\bIEP\b/, "IEP"],
  [/\bSPED\b/i, "SPED"],
  [/\bspecial education\b/i, "special education"],
  [/\beducaci[oó]n especial\b/i, "educación especial"],
  [/\b(?:level|nivel)\s*[0-9]\b/i, "level code"],
  [/\bWIDA\s*[0-9]\b/i, "WIDA level code"],
  [/\bl[1-6]_[1-6]\b/i, "band code"],
];
const bannedIn = (text) => BANNED_TOKENS.filter(([re]) => re.test(text)).map(([, name]) => name);

let guidesPromise;
const guidesOf = (data) => {
  guidesPromise ??= Promise.all(data.summaries.map((s) => buildFamilyGuide(s.id)));
  return guidesPromise;
};

/* ── G-81 class dashboard brief: golden file ───────────────────────────────── */

const DEMO = "tools/language-page/fixtures/demo-class.json";
const GOLDEN = "tools/language-page/fixtures/demo-class.golden.json";
const BRIEF_MAX_WORDS = 150;
const words = (t) => t.split(/\s+/).filter(Boolean).length;

export function briefOf(fixture) {
  const dashboard = buildDashboard(fixture);
  return { dashboard, text: { en: briefText(dashboard, "en"), es: briefText(dashboard, "es") } };
}

/** Errors for a brief against the golden file and the brief's own rules. */
export function briefErrors(fixture, golden, brief = briefOf(fixture)) {
  const errors = [];
  if (!same(brief, golden)) {
    const keys = ["headline", "behind", "reteach", "celebrate"];
    const diff = keys.filter((k) => brief.text.en[k] !== golden.text.en[k]);
    errors.push(
      `brief differs from the golden file (${diff.join(", ") || "numbers in the dashboard model"})`,
    );
  }
  const aliases = new Set(fixture.students.map((s) => s.alias));
  const all = [...Object.values(brief.text.en), ...Object.values(brief.text.es)].join(" ");
  for (const s of fixture.students)
    if (/^s[0-9a-f]{10}$/.test(s.studentId) && all.includes(s.studentId))
      errors.push("brief leaks a student id");
  for (const name of all.match(/Star \d+/g) || [])
    if (!aliases.has(name)) errors.push(`brief names "${name}", not in the roster`);
  for (const alias of aliases)
    if (!validateAlias(alias).ok) errors.push(`roster alias "${alias}" fails the alias rule`);
  if (!/\d+%/.test(brief.text.en.headline)) errors.push("brief does not state the class average");
  const m = brief.dashboard.misconception;
  if (!m || !brief.text.en.reteach.includes(m.pattern))
    errors.push("brief does not state the dominant misconception");
  const n = brief.dashboard.nextActivity;
  if (!n || !brief.text.en.reteach.includes(n.title))
    errors.push("brief does not name a next activity");
  if (words(Object.values(brief.text.en).join(" ")) > BRIEF_MAX_WORDS)
    errors.push(`brief is over ${BRIEF_MAX_WORDS} words`);
  return errors;
}

/** Aliases that break the alias rule must never reach the brief. */
export function aliasLeakErrors(fixture) {
  const hostile = clone(fixture);
  hostile.students[0].alias = "Maria Elena Gonzalez";
  const text = Object.values(briefOf(hostile).text.en).join(" ");
  return text.includes("Gonzalez") || text.includes("Maria")
    ? ["a name that fails the alias rule reached the brief"]
    : [];
}

export const g81 = {
  id: "G-81",
  name: "class-brief-golden",
  async run({ data }) {
    const fixture = readJson(DEMO);
    const golden = readJson(GOLDEN);
    const errors = [...briefErrors(fixture, golden), ...aliasLeakErrors(fixture)];
    if (!same(briefOf(fixture), briefOf(clone(fixture)))) errors.push("brief is not deterministic");
    // Derived from live authored data: the engine reads common_language_misconception, not a copy.
    const liveUnits = Object.fromEntries(
      data.units.filter((u) => u.unit.id in fixture.units).map((u) => [u.unit.id, unitSnapshot(u)]),
    );
    const live = buildDashboard({ ...fixture, units: liveUnits });
    const target = live.misconception?.unitId;
    const authored = data.units.find((u) => u.unit.id === target)?.connections?.[0]
      ?.common_language_misconception;
    if (!authored || live.misconception.pattern !== authored.misconception_pattern)
      errors.push("misconception is not the unit's authored common_language_misconception");
    if (Object.keys(liveUnits).length !== Object.keys(fixture.units).length)
      errors.push("a fixture unit is missing from the dataset");
    return {
      errors,
      info: {
        students: fixture.students.length,
        assignments: live.assignments,
        words: words(Object.values(golden.text.en).join(" ")),
        misconceptionUnit: target,
      },
    };
  },
  async controls() {
    const fixture = readJson(DEMO);
    const golden = readJson(GOLDEN);
    const perturbed = clone(fixture);
    perturbed.board.assignments[0].students[4].state = "reviewed";
    const stale = clone(golden);
    stale.text.en.reteach = "Reteach: something else.";
    const leaky = briefOf(fixture);
    leaky.text.en.behind = "Behind: Maria Gonzalez (s0000000001).";
    const noMisconception = clone(fixture);
    for (const u of Object.values(noMisconception.units)) u.misconception = null;
    return [
      { name: "perturbed roster differs from golden", errors: briefErrors(perturbed, golden) },
      { name: "edited golden is caught", errors: briefErrors(fixture, stale) },
      { name: "leaked name and id are caught", errors: briefErrors(fixture, golden, leaky) },
      {
        name: "brief without a misconception is caught",
        errors: briefErrors(noMisconception, golden),
      },
    ];
  },
};

/* ── G-82 weekly family plan equals authored data ──────────────────────────── */

const WEEKS = [0, 1, 2, 3];
const inList = (list, item) => (list || []).some((x) => same(x, item));
const pairOk = (p) =>
  typeof p?.en === "string" && p.en.trim() && typeof p?.es === "string" && p.es.trim();

export function planErrors(guide, plan) {
  const id = guide.unit.id;
  const errors = [];
  const err = (m) => errors.push(`${id}: ${m}`);
  if (!plan) return [`${id}: no plan could be built`];
  const [say, ...rest] = plan.sittings;
  for (const s of say.say)
    if (!inList(guide.say_it, s)) err(`say-it phrase not in the authored data: ${s.en}`);
  for (const q of say.talk)
    if (!inList(guide.talk, q)) err(`talk question not in the authored data: ${q.en}`);
  for (const s of [...say.say, ...say.talk])
    if (!pairOk(s)) err("a phrase is missing one language");
  const tries = rest.filter((s) => s.task);
  if (!tries.length) err("no try-at-home sitting");
  for (const s of tries) {
    if (!inList(guide.try_at_home, s.task))
      err(`task not in the authored data: ${s.task.title?.en}`);
    if (!screenTask(s.task).ok) err(`task fails the safe-and-free screen: ${s.task.title?.en}`);
    if (!(s.from >= 0 && s.to <= s.task.steps.en.length && s.from < s.to))
      err("task steps out of range");
  }
  const last = plan.sittings.at(-1);
  if (!same(last.celebrate, guide.celebrate)) err("celebrate text is not the authored celebrate");
  if (last.goal && !(guide.goals?.en || []).includes(last.goal.en))
    err("goal is not an authored goal");
  if (last.goal && guide.goals?.es && !guide.goals.es.includes(last.goal.es))
    err("goal Spanish is not the authored Spanish");
  if (!pairOk(last.celebrate)) err("celebrate is missing one language");
  for (const s of plan.sittings)
    if (!(s.minutes > 0 && s.minutes <= SITTING_CAP_MINUTES))
      err(`sitting ${s.id} is ${s.minutes} minutes (cap ${SITTING_CAP_MINUTES})`);
  if (!same(plan.safety, SAFETY)) err("safety lines are not the shared safety lines");
  if (guide.provenance?.state !== "reviewed" && !plan.draft)
    err("an unreviewed unit's plan is not marked draft");
  const text = JSON.stringify(
    plan.sittings.map((s) => [s.say, s.talk, s.task, s.goal, s.celebrate]),
  );
  const hits = bannedIn(text);
  if (hits.length) err(`banned token in the plan: ${hits.join(", ")}`);
  return errors;
}

export const g82 = {
  id: "G-82",
  name: "family-plan-equals-authored",
  async run({ data }) {
    const guides = await guidesOf(data);
    const errors = [];
    if (bannedIn("The initial value is 3, so the function starts at 3.").length)
      errors.push("banned-token pattern flags the math phrase initial value");
    if (!bannedIn("Write your initials on the page.").length)
      errors.push("banned-token pattern misses student initials");
    let plans = 0;
    let split = 0;
    let screened = 0;
    for (const guide of guides) {
      for (const task of guide.try_at_home) if (!screenTask(task).ok) screened += 1;
      for (const week of WEEKS) {
        const plan = buildWeeklyPlan(guide, week);
        errors.push(...planErrors(guide, plan));
        if (plan) {
          plans += 1;
          if (plan.sittings.some((s) => s.part)) split += 1;
        }
      }
    }
    if (plans < guides.length * WEEKS.length)
      errors.push(`only ${plans} of ${guides.length * WEEKS.length} plans were built`);
    return {
      errors,
      info: {
        units: guides.length,
        plans,
        tasksScreenedOut: screened,
        plansSplitOverTwoDays: split,
      },
    };
  },
  async controls({ data }) {
    const guide = (await guidesOf(data))[0];
    const good = () => clone(buildWeeklyPlan(guide, 0));
    const invented = good();
    invented.sittings[0].say[0].en = "Invented phrase that is not in the unit.";
    const noSpanish = good();
    noSpanish.sittings[0].talk[0].es = "";
    const hazard = clone(guide);
    hazard.try_at_home = [
      {
        ...guide.try_at_home[0],
        steps: { en: ["Light a candle with a match."], es: ["Enciendan una vela."] },
        minutes: 5,
      },
    ];
    const hazardPlan = good();
    hazardPlan.sittings[1].task = hazard.try_at_home[0];
    const banned = good();
    banned.sittings.at(-1).celebrate = { en: `${guide.celebrate.en} IEP`, es: guide.celebrate.es };
    const long = good();
    long.sittings[1].minutes = 15;
    return [
      { name: "invented phrase", errors: planErrors(guide, invented) },
      { name: "missing Spanish", errors: planErrors(guide, noSpanish) },
      { name: "hazardous task", errors: planErrors(guide, hazardPlan) },
      { name: "banned token (IEP)", errors: planErrors(guide, banned) },
      { name: "sitting over the 10 minute cap", errors: planErrors(guide, long) },
    ];
  },
};

/* ── G-83 progress note: words only ────────────────────────────────────────── */

export function noteErrors(note, alias) {
  const errors = [];
  for (const lang of ["en", "es"]) {
    const text = String(note?.[lang] || "");
    if (!text) {
      errors.push(`${lang} note is empty`);
      continue;
    }
    const bare = text.split(alias).join("");
    if (NOTE_BANNED.test(bare))
      errors.push(
        `${lang} note has a number, score, level or comparison: ${bare.match(NOTE_BANNED)[0]}`,
      );
    const hits = bannedIn(bare);
    if (hits.length) errors.push(`${lang} note has a banned token: ${hits.join(", ")}`);
    if (!text.includes(alias)) errors.push(`${lang} note does not use the alias`);
  }
  if (note?.en && note?.es && note.en === note.es) errors.push("EN and ES notes are identical");
  return errors;
}

function noteInputs(fixture) {
  const out = fixture.students.map((s) => [s.alias, s.summary]);
  for (const weekDays of [0, 1, 2, 3, 4, 5, 6, 7])
    for (const counts of [
      [0, 0, 0, 0],
      [999, 0, 0, 0],
      [3, 3, 3, 3],
      [1, 8, 2, 40],
      [0, 0, 7, 0],
    ]) {
      const [listening, speaking, reading, writing] = counts;
      out.push(["Star 9", { weekDays, domains: { listening, speaking, reading, writing } }]);
    }
  out.push(["Star 9", {}], ["Star 9", undefined]);
  return out;
}

export const g83 = {
  id: "G-83",
  name: "progress-note-words-only",
  async run() {
    const inputs = noteInputs(readJson(DEMO));
    const errors = [];
    const seen = new Set();
    for (const [alias, summary] of inputs) {
      const note = progressNote(summary, alias);
      seen.add(note.en);
      for (const e of noteErrors(note, alias))
        errors.push(`${alias} ${JSON.stringify(summary)}: ${e}`);
    }
    if (seen.size < 6)
      errors.push(
        `only ${seen.size} distinct notes across ${inputs.length} inputs: the note ignores the summary`,
      );
    return { errors, info: { inputs: inputs.length, distinctNotes: seen.size } };
  },
  async controls() {
    const ok = progressNote({ weekDays: 3, domains: { reading: 4 } }, "Star 1");
    return [
      {
        name: "score in the note",
        errors: noteErrors({ ...ok, en: `${ok.en} Star 1 scored 85 percent.` }, "Star 1"),
      },
      {
        name: "level label",
        errors: noteErrors({ ...ok, en: `${ok.en} Star 1 is at level 2.` }, "Star 1"),
      },
      {
        name: "Spanish nivel",
        errors: noteErrors({ ...ok, es: `${ok.es} Está en el nivel 2.` }, "Star 1"),
      },
      {
        name: "digits for days",
        errors: noteErrors({ ...ok, en: "Star 1 practiced 3 days." }, "Star 1"),
      },
      {
        name: "comparison with the class",
        errors: noteErrors({ ...ok, en: `${ok.en} Star 1 is behind the class.` }, "Star 1"),
      },
      { name: "empty Spanish", errors: noteErrors({ ...ok, es: "" }, "Star 1") },
    ];
  },
};

/* ── G-84 text-message tips ────────────────────────────────────────────────── */

export function tipErrors(guideId, tip) {
  const errors = [];
  const err = (m) => errors.push(`${guideId}/${tip.id}: ${m}`);
  for (const lang of ["en", "es"]) {
    const text = tip[lang];
    if (typeof text !== "string" || !text.trim()) {
      err(`${lang} message is missing`);
      continue;
    }
    if (tipLength(text) > MAX_TIP_CHARS) err(`${lang} message is ${tipLength(text)} characters`);
    for (const piece of tip.source?.[lang] || [])
      if (!text.includes(piece)) err(`${lang} message does not quote its source "${piece}"`);
    if (!tip.source?.[lang]?.length) err(`${lang} message has no recorded source`);
    if (/https?:|www\.|@|\d{4,}/.test(text))
      err(`${lang} message has a link, address or long number`);
    const hits = bannedIn(text);
    if (hits.length) err(`${lang} message has a banned token: ${hits.join(", ")}`);
  }
  if (tip.en && tip.en === tip.es) err("EN and ES are identical");
  return errors;
}

export const g84 = {
  id: "G-84",
  name: "text-tips-160",
  async run({ data }) {
    const guides = await guidesOf(data);
    const errors = [];
    const kinds = {};
    let max = 0;
    let total = 0;
    for (const guide of guides) {
      const tips = buildTips(guide);
      if (!tips.length) errors.push(`${guide.unit.id}: no tips`);
      for (const tip of tips) {
        total += 1;
        kinds[tip.kind] = (kinds[tip.kind] || 0) + 1;
        max = Math.max(max, tipLength(tip.en), tipLength(tip.es));
        errors.push(...tipErrors(guide.unit.id, tip));
        if (tip.kind === "try") {
          const task = guide.try_at_home.find((t) => t.title.en === tip.source.en[0]);
          if (!task || !screenTask(task).ok)
            errors.push(`${guide.unit.id}/${tip.id}: tip is not from a safe-and-free task`);
        }
      }
    }
    return { errors, info: { units: guides.length, tips: total, kinds, longest: max } };
  },
  async controls({ data }) {
    const guide = (await guidesOf(data))[0];
    const tip = clone(buildTips(guide)[0]);
    return [
      {
        name: "161 characters",
        errors: tipErrors(guide.unit.id, { ...tip, en: tip.en + "x".repeat(MAX_TIP_CHARS) }),
      },
      { name: "missing Spanish", errors: tipErrors(guide.unit.id, { ...tip, es: "" }) },
      {
        name: "message that does not quote its source",
        errors: tipErrors(guide.unit.id, { ...tip, en: "Practice every day." }),
      },
      {
        name: "link in a message",
        errors: tipErrors(guide.unit.id, { ...tip, en: `${tip.en} https://x.test/a` }),
      },
      { name: "banned token", errors: tipErrors(guide.unit.id, { ...tip, es: `${tip.es} IEP` }) },
    ];
  },
};

/* ── G-85 no egress from the new surfaces ──────────────────────────────────── */

const PURE = [
  "shared/class-platform/week-brief.js",
  "shared/bcpss-family-plan.js",
  "shared/bcpss-family-tips.js",
];
const SURFACES = [
  ...PURE,
  "access-practice-lab/src/class/week-brief-panel.js",
  "family/bcpss/family-plan-view.js",
  "bcpss-teachers/family-tips.js",
];
const EGRESS = [
  [
    /\bsendBeacon\b|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b|\bimportScripts\b/,
    "network API",
  ],
  [/https?:\/\/(?!x\.test)/, "absolute URL"],
  [/\bmailto:|\bsms:|wa\.me/, "message deep link (the site sends nothing)"],
  [/model-call|anthropic|openai|\/api\/class\/ai/i, "model call"],
];
// A raw `fetch(` is allowed only as the injectable default parameter `(...a) => fetch(...a)`.
const RAW_FETCH = /(?<!\(\.\.\.a\) => )\bfetch\(/;

export function egressErrors(file, source, pure) {
  const errors = [];
  for (const [re, what] of EGRESS) if (re.test(source)) errors.push(`${file}: ${what}`);
  if (pure && /\bfetch\b|\bfetchImpl\b/.test(source))
    errors.push(`${file}: pure module touches fetch`);
  if (!pure && RAW_FETCH.test(source))
    errors.push(`${file}: raw fetch call (use the injected fetchImpl)`);
  for (const m of source.matchAll(/fetchImpl\(\s*([`"'])([^`"']*)/g))
    if (!m[2].startsWith("/api/"))
      errors.push(`${file}: fetch to a non-API path "${m[2].slice(0, 30)}"`);
  return errors;
}

export const g85 = {
  id: "G-85",
  name: "no-egress-new-surfaces",
  async run() {
    const errors = SURFACES.flatMap((f) =>
      egressErrors(f, read(f).replace(/^\s*\/\/.*$/gm, ""), PURE.includes(f)),
    );
    return { errors, info: { filesScanned: SURFACES.length } };
  },
  async controls() {
    return [
      {
        name: "absolute URL fetch",
        errors: egressErrors("bad.js", 'fetch("https://api.example.com/x")', false),
      },
      { name: "beacon", errors: egressErrors("bad.js", "navigator.sendBeacon('/api/x')", false) },
      {
        name: "pure module with fetch",
        errors: egressErrors("bad.js", "const f = fetchImpl;", true),
      },
      {
        name: "model call",
        errors: egressErrors("bad.js", 'import { x } from "./model-call.js";', false),
      },
      { name: "sms link", errors: egressErrors("bad.js", 'a.href = "sms:?body=hi";', false) },
      {
        name: "fetch outside /api/",
        errors: egressErrors("bad.js", 'fetchImpl("/elsewhere/x")', false),
      },
    ];
  },
};
