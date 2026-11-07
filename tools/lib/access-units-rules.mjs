// Contract for the thematic-unit content (access-practice-lab/content/units/g<band>.json).
// Pure functions: validateUnitsFile(data, { band, activities }) returns a list of problems.
// `activities` is a Map id -> { band, domain, level } built from the activity bank (see tools/validate-access-units.mjs).
// Read by the validator, the unit tests and by anyone authoring a unit part-file (`node tools/validate-access-units.mjs --file <path> --band <band>`).

import { SCORE_CLAIM } from "./access-studio-rules.mjs";
import { fleschKincaid } from "./readability.mjs";

export const UNIT_COUNTS = { "6-8": 8, "3-5": 6 };
export const DOMAINS = ["Listening", "Speaking", "Reading", "Writing"];
export const ACCENTS = ["teal", "blue", "rose", "amber", "green", "indigo", "coral", "slate"];
export const UNIT_ICONS = [
  "sparkle",
  "worlds",
  "evidence",
  "construction",
  "growth",
  "medal",
  "library",
  "mission",
  "road",
  "language",
  "bulb",
  "flag",
  "classroom",
  "conversation",
  "tools",
  "detective",
];
export const TEXT_KEYS = ["anchor", "s1", "s2", "s3", "s4"];
export const STEP_TYPES = ["read", "listen", "vocab", "activity", "speak", "write", "reflect"];
export const PURPOSES = ["Inform", "Explain", "Argue", "Narrate"];
export const RUBRIC_LEVELS = 3; // practice bands: early / building / strong
export const FK_RANGE = { "6-8": [5, 10.5], "3-5": [2.5, 6.5] };
export const ANCHOR_WORDS = { "6-8": [120, 240], "3-5": [85, 175] };

const ENGLISH_WORDS = new Set(
  "the and of is are with to for that this from they their because which was were have has".split(
    " ",
  ),
);
const EMOJI = /\p{Extended_Pictographic}/u;
const CLOCK =
  /\b(countdown|timer|timed|beat the clock|hurry|as fast as|words per minute|race against)\b/i;
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const str = (v, min = 1) => typeof v === "string" && v.trim().length >= min;
const bi = (v, min = 1) => isObj(v) && str(v.en, min) && str(v.es, min);
const words = (t) => (String(t).match(/[\p{L}'’-]+/gu) || []).length;

/** Every string in a value, with a path, for the cross-cutting checks. */
export function* strings(value, path = "") {
  if (typeof value === "string") yield [path, value];
  else if (Array.isArray(value))
    for (const [i, v] of value.entries()) yield* strings(v, `${path}[${i}]`);
  else if (isObj(value))
    for (const [k, v] of Object.entries(value)) yield* strings(v, path ? `${path}.${k}` : k);
}

function checkStep(step, where, unit, textKeys, vocabN, bandActs, err) {
  if (!isObj(step) || !STEP_TYPES.includes(step.t))
    return err(`${where}: step.t must be one of ${STEP_TYPES.join(", ")}`);
  if (step.why !== undefined && !bi(step.why)) err(`${where}: why must be {en, es}`);
  if (step.t === "read" || step.t === "listen") {
    if (!textKeys.includes(step.text))
      err(`${where}: text "${step.text}" is not one of ${textKeys.join(", ")}`);
  } else if (step.t === "vocab") {
    const ok =
      Array.isArray(step.terms) &&
      step.terms.length >= 3 &&
      step.terms.length <= 5 &&
      step.terms.every((i) => Number.isInteger(i) && i >= 0 && i < vocabN);
    if (!ok) err(`${where}: vocab terms must be 3-5 indexes into the unit vocabulary`);
  } else if (step.t === "activity") {
    const row = bandActs.get(step.id);
    if (!row) return err(`${where}: activity "${step.id}" does not exist in this band's bank`);
    if (row.type === "worksheet")
      err(`${where}: "${step.id}" is a printable worksheet; sequence on-screen activities only`);
    for (const key of ["easier", "stretch"]) {
      if (step[key] === undefined) continue;
      const alt = bandActs.get(step[key]);
      if (!alt) err(`${where}: ${key} "${step[key]}" does not exist in this band's bank`);
      else if (alt.domain !== row.domain)
        err(`${where}: ${key} "${step[key]}" is ${alt.domain}, the main activity is ${row.domain}`);
    }
    if (!bi(step.why))
      err(`${where}: an activity step needs why {en, es} (what it practises in this unit)`);
  } else if (step.t === "speak") {
    if (!unit.speaking?.some((t) => t.id === step.task))
      err(`${where}: speaking task "${step.task}" is not defined`);
  } else if (step.t === "write") {
    if (!unit.writing?.some((t) => t.id === step.task))
      err(`${where}: writing task "${step.task}" is not defined`);
  } else if (step.t === "reflect") {
    if (!bi(step.q)) err(`${where}: reflect needs q {en, es}`);
  }
}

function checkQuestion(q, where, err) {
  if (!isObj(q)) return err(`${where}: question must be an object`);
  if (
    !["detail", "inference", "main-idea", "word", "evidence", "sequence", "cause"].includes(q.kind)
  )
    err(`${where}: kind is not recognised`);
  if (!bi(q.q, 8)) err(`${where}: q must be {en, es}`);
  if (
    !Array.isArray(q.choices) ||
    q.choices.length < 3 ||
    q.choices.length > 4 ||
    !q.choices.every((c) => bi(c))
  )
    err(`${where}: 3-4 choices, each {en, es}`);
  else {
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length)
      err(`${where}: answer must index a choice`);
    if (new Set(q.choices.map((c) => c.en.trim().toLowerCase())).size !== q.choices.length)
      err(`${where}: duplicate choices`);
    const longest = q.choices.reduce(
      (m, c, i) => (c.en.length > q.choices[m].en.length ? i : m),
      0,
    );
    const lens = q.choices.map((c) => c.en.length).sort((a, b) => a - b);
    if (longest === q.answer && lens.at(-1) > lens.at(-2) * 1.8)
      err(`${where}: the right answer is much longer than every other choice (a test-taking cue)`);
  }
  if (!bi(q.why, 10)) err(`${where}: why must be {en, es} feedback that explains the answer`);
}

function checkTaskLike(t, where, kind, err) {
  if (!isObj(t)) return err(`${where}: must be an object`);
  if (!str(t.id) || !KEBAB.test(t.id)) err(`${where}: id must be kebab-case`);
  if (!PURPOSES.includes(t.purpose)) err(`${where}: purpose must be one of ${PURPOSES.join(", ")}`);
  for (const f of ["title", "prompt"]) if (!bi(t[f])) err(`${where}: ${f} must be {en, es}`);
  if (!Array.isArray(t.frames) || t.frames.length < 3 || !t.frames.every((f) => bi(f)))
    err(`${where}: at least 3 frames {en, es}`);
  if (!bi(t.model, 20)) err(`${where}: model must be a sample {en, es}`);
  if (!Array.isArray(t.checks) || t.checks.length < 3 || !t.checks.every((f) => bi(f)))
    err(`${where}: at least 3 checks {en, es}`);
  if (kind === "write") {
    if (!Array.isArray(t.bank) || t.bank.length < 6 || !t.bank.every((f) => bi(f)))
      err(`${where}: bank needs 6+ words {en, es}`);
    if (!Number.isInteger(t.goalWords) || t.goalWords < 15 || t.goalWords > 400)
      err(`${where}: goalWords must be a whole number from 15 to 400`);
  }
}

export function validateUnit(unit, { band, activities, index = 0 }) {
  const problems = [];
  const id = unit?.id || `#${index}`;
  const err = (m) => problems.push(`${id}: ${m}`);
  if (!isObj(unit)) return [`unit ${index} is not an object`];
  if (!str(unit.id) || !KEBAB.test(unit.id)) err("id must be kebab-case");
  if (unit.n !== index + 1) err(`n must be ${index + 1}`);
  if (!UNIT_ICONS.includes(unit.icon)) err(`icon must be one of ${UNIT_ICONS.join(", ")}`);
  if (!ACCENTS.includes(unit.accent)) err(`accent must be one of ${ACCENTS.join(", ")}`);
  for (const f of ["title", "tagline", "bigIdea", "question"])
    if (!bi(unit[f], 4)) err(`${f} must be {en, es}`);
  if (unit.question?.en && !/\?$/.test(unit.question.en.trim()))
    err("question.en must be a question");
  if (!isObj(unit.goals) || !DOMAINS.every((d) => bi(unit.goals[d], 10)))
    err("goals needs Listening, Speaking, Reading, Writing, each {en, es} (an 'I can' statement)");
  else if (!DOMAINS.every((d) => /^I can /.test(unit.goals[d].en)))
    err("every goal.en starts with 'I can '");

  // vocabulary
  const vocab = unit.vocab;
  if (!Array.isArray(vocab) || vocab.length !== 8) err("vocab must hold exactly 8 entries");
  else
    for (const [i, v] of vocab.entries()) {
      if (!str(v.term) || !str(v.es) || !bi(v.def, 6) || !bi(v.ex, 12))
        err(`vocab[${i}] needs term, es, def {en, es}, ex {en, es}`);
      else if (v.term.trim().toLowerCase() === v.es.trim().toLowerCase() && v.term.length > 5)
        err(
          `vocab[${i}] ("${v.term}"): Spanish term equals the English one; use the natural Spanish word`,
        );
    }

  // texts
  const texts = unit.texts;
  const textKeys = isObj(texts) ? TEXT_KEYS.filter((k) => texts[k]) : [];
  if (!isObj(texts) || textKeys.length !== TEXT_KEYS.length)
    err("texts needs anchor, s1, s2, s3, s4");
  else {
    const a = texts.anchor;
    if (!bi(a.title) || !["easier", "on", "richer", "es"].every((k) => str(a[k], 60)))
      err("anchor needs title {en, es}, easier, on, richer, es");
    else {
      const [lo, hi] = ANCHOR_WORDS[band];
      const w = { easier: words(a.easier), on: words(a.on), richer: words(a.richer) };
      if (w.on < lo || w.on > hi)
        err(`anchor.on is ${w.on} words; the ${band} range is ${lo}-${hi}`);
      if (!(w.easier < w.on && w.on < w.richer))
        err(`anchor must grow easier < on < richer in length (${w.easier}/${w.on}/${w.richer})`);
      if (w.easier < w.on * 0.45) err("anchor.easier is too short to keep the same facts");
      const fk = {
        easier: fleschKincaid(a.easier),
        on: fleschKincaid(a.on),
        richer: fleschKincaid(a.richer),
      };
      const [flo, fhi] = FK_RANGE[band];
      if (fk.on && (fk.on.grade < flo || fk.on.grade > fhi))
        err(`anchor.on reads at about grade ${fk.on.grade}; the ${band} range is ${flo}-${fhi}`);
      if (fk.easier && fk.on && fk.easier.grade > fk.on.grade + 0.3)
        err(
          `anchor.easier (${fk.easier.grade}) must not read harder than on level (${fk.on.grade})`,
        );
      if (fk.richer && fk.on && fk.richer.grade < fk.on.grade - 0.3)
        err(
          `anchor.richer (${fk.richer.grade}) must not read easier than on level (${fk.on.grade})`,
        );
      const ratio = words(a.es) / w.on;
      if (ratio < 0.8 || ratio > 1.5)
        err(`anchor.es length (${words(a.es)}) is not a faithful parallel of anchor.on (${w.on})`);
    }
    if (!Array.isArray(a.questions) || a.questions.length < 3)
      err("anchor needs at least 3 questions");
    else {
      a.questions.forEach((q, i) => checkQuestion(q, `texts.anchor.questions[${i}]`, err));
      if (new Set(a.questions.map((q) => q.answer)).size < 2)
        err("anchor questions: vary the position of the right answer");
      if (!a.questions.some((q) => q.kind === "inference" || q.kind === "evidence"))
        err("anchor questions need one inference or evidence question");
    }
    for (const k of TEXT_KEYS.slice(1)) {
      const t = texts[k];
      const [lo, hi] = band === "6-8" ? [45, 130] : [35, 100];
      if (!bi(t.title) || !str(t.kind) || !str(t.en, 40) || !str(t.es, 40))
        err(`texts.${k} needs title {en, es}, kind, en, es`);
      else {
        const w = words(t.en);
        if (w < lo || w > hi) err(`texts.${k} is ${w} words; supporting texts run ${lo}-${hi}`);
      }
      if (!Array.isArray(t.questions) || t.questions.length < 1)
        err(`texts.${k} needs at least 1 question`);
      else t.questions.forEach((q, i) => checkQuestion(q, `texts.${k}.questions[${i}]`, err));
    }
    // vocabulary is used in the unit's own English texts
    const corpus = textKeys
      .map((k) =>
        k === "anchor"
          ? `${texts.anchor.easier} ${texts.anchor.on} ${texts.anchor.richer}`
          : texts[k].en,
      )
      .join(" ")
      .toLowerCase();
    if (Array.isArray(vocab))
      for (const v of vocab)
        if (
          str(v.term) &&
          !corpus.includes(
            v.term
              .trim()
              .toLowerCase()
              .slice(0, Math.max(4, v.term.length - 3)),
          )
        )
          err(`vocab "${v.term}" never appears in the unit's texts`);
  }

  // speaking and writing tasks
  if (!Array.isArray(unit.speaking) || unit.speaking.length !== 3)
    err("speaking needs exactly 3 tasks");
  else unit.speaking.forEach((t, i) => checkTaskLike(t, `speaking[${i}]`, "speak", err));
  if (!Array.isArray(unit.writing) || unit.writing.length !== 3)
    err("writing needs exactly 3 tasks");
  else unit.writing.forEach((t, i) => checkTaskLike(t, `writing[${i}]`, "write", err));
  const taskIds = [
    ...(unit.speaking || []),
    ...(unit.writing || []),
    unit.task?.speak,
    unit.task?.write,
  ]
    .filter(Boolean)
    .map((t) => t.id);
  if (new Set(taskIds).size !== taskIds.length)
    err("speaking/writing/task ids must be unique within the unit");

  // lessons
  const bandActs = new Map([...activities].filter(([, r]) => r.band === band));
  const lessons = unit.lessons;
  const usedDomains = new Set();
  const usedActs = [];
  const usedTasks = new Set();
  if (!Array.isArray(lessons) || lessons.length !== 5) err("lessons must hold exactly 5 lessons");
  else
    for (const [i, L] of lessons.entries()) {
      const w = `lessons[${i}]`;
      if (L.id !== String(i + 1)) err(`${w}.id must be "${i + 1}"`);
      if (!bi(L.title) || !bi(L.goal, 10) || !bi(L.warmup, 10) || !bi(L.teacher, 20))
        err(`${w} needs title, goal, warmup and teacher {en, es}`);
      else if (!/^I can /.test(L.goal.en)) err(`${w}.goal.en starts with 'I can '`);
      if (!Array.isArray(L.focus) || !L.focus.length || !L.focus.every((d) => DOMAINS.includes(d)))
        err(`${w}.focus must list domains`);
      if (!Number.isInteger(L.minutes) || L.minutes < 30 || L.minutes > 60)
        err(`${w}.minutes must be 30-60`);
      if (!Array.isArray(L.steps) || L.steps.length < 5 || L.steps.length > 9)
        err(`${w} needs 5-9 steps`);
      else {
        for (const [j, s] of L.steps.entries()) {
          checkStep(
            s,
            `${w}.steps[${j}]`,
            unit,
            textKeys,
            Array.isArray(vocab) ? vocab.length : 0,
            bandActs,
            err,
          );
          if (s.t === "activity" && bandActs.get(s.id)) {
            usedDomains.add(bandActs.get(s.id).domain);
            usedActs.push(s.id);
          }
          if (s.t === "speak" || s.t === "write") usedTasks.add(s.task);
        }
        if (!L.steps.some((s) => s.t === "activity"))
          err(`${w} must sequence at least one existing activity`);
        if (!L.steps.some((s) => s.t === "read" || s.t === "listen"))
          err(`${w} needs a read or listen step (unit text)`);
        if (L.steps.at(-1)?.t !== "reflect")
          err(`${w} must end with a reflect step (the exit prompt)`);
      }
    }
  for (const d of ["Listening", "Reading", "Speaking", "Writing"])
    if (!usedDomains.has(d)) err(`no ${d} activity from the bank is sequenced in this unit`);
  if (new Set(usedActs).size !== usedActs.length) err("an activity appears twice in the same unit");
  for (const t of [...(unit.speaking || []), ...(unit.writing || [])])
    if (!usedTasks.has(t.id)) err(`task "${t.id}" is never used by a lesson`);
  const textUse = new Set(
    (lessons || []).flatMap((L) =>
      (L.steps || []).filter((s) => s.t === "read" || s.t === "listen").map((s) => s.text),
    ),
  );
  for (const k of TEXT_KEYS) if (!textUse.has(k)) err(`text "${k}" is never used by a lesson`);
  const vocabUse = new Set(
    (lessons || []).flatMap((L) =>
      (L.steps || []).filter((s) => s.t === "vocab").flatMap((s) => s.terms),
    ),
  );
  if (Array.isArray(vocab) && vocabUse.size < 8)
    err("every vocabulary word must be studied in some lesson (vocab steps)");

  // performance task
  const task = unit.task;
  if (!isObj(task)) err("task is missing");
  else {
    for (const f of ["title", "product", "audience", "prompt", "share"])
      if (!bi(task[f], 4)) err(`task.${f} must be {en, es}`);
    if (!Array.isArray(task.steps) || task.steps.length < 4 || !task.steps.every((s) => bi(s)))
      err("task.steps needs 4+ steps {en, es}");
    checkTaskLike(task.write, "task.write", "write", err);
    checkTaskLike(task.speak, "task.speak", "speak", err);
    if (!Array.isArray(task.rubric) || task.rubric.length !== 4)
      err("task.rubric needs 4 criteria");
    else
      for (const [i, r] of task.rubric.entries()) {
        if (
          !bi(r.name) ||
          !Array.isArray(r.levels) ||
          r.levels.length !== RUBRIC_LEVELS ||
          !r.levels.every((l) => bi(l, 8))
        )
          err(
            `task.rubric[${i}] needs name {en, es} and ${RUBRIC_LEVELS} level descriptors {en, es} (early, building, strong)`,
          );
      }
  }

  // pacing, assessment, family
  const pacing = unit.pacing;
  if (!Array.isArray(pacing) || pacing.length < 10 || pacing.length > 15)
    err("pacing needs 10-15 days (a 2-3 week unit)");
  else {
    pacing.forEach((p, i) => {
      if (
        p.day !== i + 1 ||
        !["1", "2", "3", "4", "5", "task", "flex", "review", "share"].includes(p.ref) ||
        !bi(p.note, 8)
      )
        err(`pacing[${i}] needs day ${i + 1}, a known ref and note {en, es}`);
    });
    for (const r of ["1", "2", "3", "4", "5"])
      if (!pacing.some((p) => p.ref === r)) err(`pacing never reaches lesson ${r}`);
    if (pacing.filter((p) => p.ref === "task").length < 2) err("pacing needs 2+ task days");
  }
  const A = unit.assessment;
  if (
    !isObj(A) ||
    !Array.isArray(A.formative) ||
    A.formative.length < 3 ||
    !A.formative.every((x) => bi(x, 8)) ||
    !bi(A.performance, 10) ||
    !bi(A.selfCheck, 10)
  )
    err("assessment needs formative (3+ {en, es}), performance and selfCheck");
  const F = unit.family;
  if (
    !isObj(F) ||
    !bi(F.letter, 200) ||
    !Array.isArray(F.talk) ||
    F.talk.length < 3 ||
    !F.talk.every((x) => bi(x, 10))
  )
    err("family needs letter {en, es} (200+ characters each) and 3+ talk prompts");
  else if (/\S\n\n\S/.test(F.letter.en) !== /\S\n\n\S/.test(F.letter.es))
    err("family letter paragraphs (blank lines) must match in both languages");

  // cross-cutting content rules
  for (const [path, s] of strings(unit)) {
    if (EMOJI.test(s)) err(`${path}: no emoji in unit content`);
    if (CLOCK.test(s)) err(`${path}: no timer or speed language`);
    if (SCORE_CLAIM.test(s)) err(`${path}: no WIDA level, score or proficiency claim`);
    if (/\blexile\b|\bwida level\b/i.test(s)) err(`${path}: no Lexile or WIDA level claims`);
    if (path.endsWith(".es") || path === "texts.anchor.es") {
      const toks = (s.toLowerCase().match(/[a-z']+/g) || []).filter((w) => ENGLISH_WORDS.has(w));
      if (toks.length >= 2)
        err(`${path}: Spanish text contains English words (${[...new Set(toks)].join(", ")})`);
    }
  }
  const all = new Map(strings(unit));
  for (const [path, s] of all) {
    if (!path.endsWith(".es") || path === "texts.anchor.es") continue;
    const en = all.get(path.replace(/\.es$/, ".en"));
    if (en && words(s) > 3 && en.trim().toLowerCase() === s.trim().toLowerCase())
      err(`${path}: Spanish is a copy of the English`);
  }
  return problems;
}

/** All problems in one band file. `activities` is a Map of id -> { band, domain, level }. */
export function validateUnitsFile(data, { band, activities, partial = false }) {
  const problems = [];
  if (!isObj(data) || data.schema !== 1 || data.band !== band || !Array.isArray(data.units))
    return [`${band}: file must be { schema: 1, band: "${band}", units: [...] }`];
  if (!partial && data.units.length !== UNIT_COUNTS[band])
    problems.push(`${band}: ${UNIT_COUNTS[band]} units expected, found ${data.units.length}`);
  const ids = new Set();
  for (const [i, unit] of data.units.entries()) {
    if (ids.has(unit?.id)) problems.push(`${band}: duplicate unit id ${unit.id}`);
    ids.add(unit?.id);
    problems.push(
      ...validateUnit(unit, { band, activities, index: partial ? (unit?.n || 1) - 1 : i }),
    );
  }
  return problems;
}
