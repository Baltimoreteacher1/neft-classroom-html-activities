#!/usr/bin/env node
// Compile the Practice / Family / Assignments (PFA) data for the 84 core lessons.
//
//   node scripts/pfa/compile-pfa-data.mjs            write data/practice, data/family, data/assignments.json
//   node scripts/pfa/compile-pfa-data.mjs --check    fail if any compiled file is stale
//   node scripts/pfa/compile-pfa-data.mjs --force    also rewrite files marked "authored": true
//
// Source of every word is AUTHORED content that already exists and is already gated:
//   lessons/<id>/config.json            practice tiers, worked example, vocabulary, standard
//   data/family-homework-notes/<id>.json family sidecar (v3), EN + ES
//   data/family-glossary.json           plain EN/ES definitions
//   data/misconception-taxonomy.json    the ONLY allowed misconception tags
// plus the seeded skill generators in functions/_lib/pfa/generators.js (stored as {gen, seed};
// the bundle builder expands them and tools/pfa/generators.test.mjs proves their math).
//
// Selection rules (why an item is or is not used) are recorded per lesson under `selection`, and
// an item without complete Spanish is never selected: the brief allows no missing ES strings.
// A file with "authored": true (hand-polished, e.g. 6-6) is left alone unless --force.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CHECK = process.argv.includes("--check");
const FORCE = process.argv.includes("--force");
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const { generate, parseNumber, tableTask, lineTask } = await import(
  pathToFileURL(join(ROOT, "functions/_lib/pfa/generators.js")).href
);

const manifest = read("data/curriculum-launch-manifest.json");
const curriculum = read("data/curriculum-manifest.json");
const standards = read("data/ccss-standards.json").standards;
const taxonomy = read("data/misconception-taxonomy.json").taxonomy;
const glossary = read("data/family-glossary.json").terms;
const titlesEs = read("data/family-homework-titles-es.json");
const objectivesEsReview = read("data/practice/_objectives-es.json");
// Spanish for the item-specific wrong-answer feedback the configs carry in English only
// (choiceFeedback without choiceFeedbackEs). Keyed by feedbackKey(); machine-assisted, so every
// use is counted as needs-review. An entry no item uses is a stale translation: validate:pfa fails.
const feedbackEs = read("data/practice/_feedback-es.json");
export const feedbackKey = (lessonId, stem, choice) =>
  `${lessonId}|${createHash("sha1")
    .update(`${String(stem).trim()}\u0000${String(choice).trim()}`)
    .digest("hex")
    .slice(0, 10)}`;
const feedbackEsUsed = new Set();
// Spanish objective: the lesson's own Practice Studio target, else a reviewed-pending translation.
function objectiveEs(id) {
  const studio = `data/practice-studio/${id}.json`;
  const own = existsSync(join(ROOT, studio)) ? read(studio).targetEs : null;
  if (own) return { es: own, review: false };
  return objectivesEsReview[id]
    ? { es: objectivesEsReview[id], review: true }
    : { es: null, review: false };
}

// Lesson -> skill generator ("name:mode"). Chosen from the lesson's standard and title.
export const SIMILAR = {
  "1-1": "estimateProduct",
  "1-2": "fracTimesWhole",
  "1-3": "decimalMultiply",
  "1-4": "volumePrism:whole",
  "1-5": "patternRule",
  "1-6": "estimateProduct",
  "2-1": "dataCount:dots",
  "2-2": "dataCount:hist",
  "2-3": "median",
  "2-4": "iqr:iqr",
  "2-5": "iqr:range",
  "2-6": "longDivision",
  "2-7": "decimalDivide",
  "2-8": "mean",
  "2-9": "mad",
  "2-10": "median",
  "2-11": "decimalAddSub",
  "2-12": "decimalMultiply",
  "3-1": "ratioTable:table",
  "3-2": "unitRate",
  "3-3": "ratioTable:table",
  "3-4": "ratioTable:graph",
  "3-5": "unitRate",
  "3-6": "convertUnits",
  "3-7": "convertUnits",
  "3-8": "unitRate",
  "3-9": "ratioTable:table",
  "3-10": "convertUnits",
  "4-1": "percentOf",
  "4-2": "fracToPercent",
  "4-3": "percentOf",
  "4-4": "percentOf",
  "4-5": "percentWhole",
  "5-1": "areaShape:parallelogram",
  "5-2": "areaShape:triangle",
  "5-3": "areaShape:trapezoid",
  "5-4": "areaComposite",
  "5-5": "volumePrism:half",
  "5-6": "surfaceArea:prism",
  "5-7": "surfaceArea:prism",
  "5-8": "surfaceArea:pyramid",
  "5-9": "areaRegularPolygon",
  "5-10": "volumePrism:half",
  "6-1": "wholeDivUnitFrac",
  "6-2": "fracDivide:mixed",
  "6-3": "evalNumeric:power",
  "6-4": "evalNumeric:order",
  "6-5": "evalExpression",
  "6-6": "expr:combine",
  "6-7": "gcf",
  "6-8": "expr:combine",
  "6-9": "wholeDivUnitFrac",
  "6-10": "fracDivide:mixed",
  "6-11": "fracDivide:frac",
  "6-12": "lcm",
  "6-13": "primeFactor",
  "6-14": "expr:distribute",
  "6-15": "expr:combine",
  "7-1": "signedValue:opposite",
  "7-2": "signedValue:opposite",
  "7-3": "signedValue:abs",
  "7-4": "compareRational",
  "7-5": "point:plot",
  "7-6": "coordDistance",
  "7-7": "coordDistance",
  "7-8": "point:plot",
  "7-9": "point:reflect",
  "8-1": "oneStep:check",
  "8-2": "oneStep:add",
  "8-3": "oneStep:mult",
  "8-4": "inequality:write",
  "8-5": "inequality:test",
  "8-6": "inequality:write",
  "8-7": "oneStep:mult",
  "9-1": "twoVar:table",
  "9-2": "twoVar:table",
  "9-3": "twoVar:equation",
  "9-4": "twoVar:table",
  "10-1": "estimateProduct",
  "10-2": "patternRule",
  "10-3": "patternRule",
  "10-4": "areaComposite",
  "10-5": "patternRule",
  "10-6": "estimateProduct",
};

// Stable per-lesson seed so the printed page and the key never disagree.
export function lessonSeed(id, k) {
  let h = 2166136261;
  for (const ch of `${id}#${k}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0) % 100000;
}

const SENT = /(?<=[.!?])\s+(?=[A-Z0-9¿¡(“"])/u;
const sentences = (t) =>
  t
    ? String(t)
        .split(SENT)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
const bi = (en, es) => ({ en: String(en ?? "").trim(), es: String(es ?? "").trim() });
const hasBoth = (o) => !!(o && o.en && o.es);
const wordy = (s) =>
  (String(s).match(/[A-Za-zÁÉÍÓÚáéíóúñÑ]{3,}/g) || []).filter(
    (w) => !/^(sq|ft|in|cm|km|mph|lb|oz|gal|qt|hr|min|sec|and|the)$/i.test(w),
  ).length >= 2;
const validTag = (t) => (t && taxonomy[t] ? t : null);

const stats = {
  orphanTagsDropped: 0,
  itemsSkippedNoSpanish: 0,
  whyEsFromTaxonomy: 0,
  whyEsFromHint: 0,
  whyEsFromTranslation: 0,
};

function mcChoices(it, lessonId) {
  const choicesEs = it.choicesEs || it.choices.map((c) => (wordy(c) ? null : c));
  if (choicesEs.some((c) => c == null)) return null;
  return it.choices.map((c, i) => {
    const correct = i === it.correctIndex;
    const tagRaw = it.misconceptionTags?.[i];
    if (tagRaw && !taxonomy[tagRaw]) stats.orphanTagsDropped++;
    const tag = correct ? null : validTag(tagRaw);
    let whyEs = it.choiceFeedbackEs?.[i];
    let whyEsSource = "authored";
    const fbKey = feedbackKey(lessonId, it.stem, c);
    if (!correct && !whyEs && it.choiceFeedback?.[i] && feedbackEs[fbKey]) {
      // The English line names this exact mistake; its translation beats the general message.
      whyEs = feedbackEs[fbKey];
      whyEsSource = "translated";
      feedbackEsUsed.add(fbKey);
      stats.whyEsFromTranslation++;
    } else if (!correct && !whyEs) {
      if (tag && taxonomy[tag].studentEs) {
        whyEs = taxonomy[tag].studentEs;
        whyEsSource = "taxonomy";
        stats.whyEsFromTaxonomy++;
      } else {
        whyEs = `Pista: ${it.hintsEs?.[0] || it.explanationEs}`;
        whyEsSource = "hint";
        stats.whyEsFromHint++;
      }
    }
    const whyEn = correct
      ? ""
      : it.choiceFeedback?.[i] ||
        (tag ? taxonomy[tag].student : `Hint: ${it.hints?.[0] || it.explanation}`);
    return {
      text: bi(c, choicesEs[i]),
      correct,
      tag,
      why: correct ? null : bi(whyEn, whyEs),
      whyEsSource: correct ? undefined : whyEsSource,
    };
  });
}

function hintsOf(it) {
  const en = it.hints || (it.hint ? [it.hint] : []);
  const es = it.hintsEs || [];
  if (en.length < 1 || es.length < 1) return null;
  return {
    conceptual: bi(en[0], es[0]),
    procedural: bi(en[1] || en[en.length - 1], es[1] || es[es.length - 1]),
  };
}

// Convert one config practice item into a PFA problem, or null when it cannot be shown bilingually.
function convert(it, tier, std, lessonId, idx) {
  const hints = hintsOf(it);
  if (!hints) return { skip: "no Spanish hints" };
  const base = {
    tier,
    dok: tier === 1 ? 1 : tier === 2 ? 2 : 3,
    ccss: std.oldId || null,
    mccrs: std.code,
    hints,
    source: `lessons/${lessonId}/config.json`,
  };
  if (it.type === "multiple-choice") {
    if (!it.stemEs || !it.explanationEs) return { skip: "no Spanish stem/explanation" };
    const choices = mcChoices(it, lessonId);
    if (!choices) return { skip: "choices need Spanish" };
    const solution = { en: sentences(it.explanation), es: sentences(it.explanationEs) };
    const tags = choices.map((c) => c.tag).filter(Boolean);
    const correct = it.choices[it.correctIndex];
    const allNumeric = it.choices.every((c) => parseNumber(c) != null);
    // Numeric entry: every choice is a plain number and the stem asks for a value. The wrong choices
    // become KNOWN wrong answers with their misconception feedback.
    if (allNumeric && !/^\s*which/i.test(it.stem) && parseNumber(correct) != null) {
      return {
        ...base,
        type: "numeric",
        prompt: bi(it.stem, it.stemEs),
        answer: String(correct),
        answerType: "number",
        known: choices
          .filter((c) => !c.correct)
          .map((c) => ({ value: c.text.en, tag: c.tag, why: c.why, whyEsSource: c.whyEsSource })),
        solution,
        misconception: tags[0] || null,
        origin: `${tier}:${idx}:mc->numeric`,
      };
    }
    return {
      ...base,
      type: "mc",
      prompt: bi(it.stem, it.stemEs),
      choices,
      solution,
      misconception: tags[0] || null,
      origin: `${tier}:${idx}:mc`,
    };
  }
  if (it.type === "error-analysis") {
    const steps = it.workedExample || [];
    if (!it.titleEs || !it.correctWorkEs || steps.some((s) => !s.workEs || !s.labelEs))
      return { skip: "error analysis lacks Spanish" };
    return {
      ...base,
      dok: 3,
      type: "error",
      prompt: bi(
        `${it.title}: which step has the mistake?`,
        `${it.titleEs}: ¿en qué paso está el error?`,
      ),
      steps: steps.map((s) => ({ label: bi(s.label, s.labelEs), work: bi(s.work, s.workEs) })),
      errorStep: it.errorStep,
      fix: bi(it.correctWork, it.correctWorkEs),
      solution: {
        en: sentences(it.explanation || it.correctWork),
        es: sentences(it.explanationEs || it.correctWorkEs),
      },
      misconception: null,
      origin: `${tier}:${idx}:error`,
    };
  }
  if (
    it.type === "drag-sort" &&
    Array.isArray(it.items) &&
    it.items.length &&
    it.categories?.length === 2
  ) {
    if (
      it.items.some((x) => !x.textEs) ||
      it.categories.some((c) => !c.labelEs) ||
      !it.explanationEs
    )
      return { skip: "sort lacks Spanish" };
    const [a] = it.categories;
    const items = it.items.slice(0, 8);
    if (!items.some((x) => x.category === a.id) || items.every((x) => x.category === a.id))
      return { skip: "select-all needs both kinds" };
    return {
      ...base,
      type: "select",
      prompt: bi(
        `Select ALL that belong in "${a.label}".`,
        `Selecciona TODAS las que van en "${a.labelEs}".`,
      ),
      options: items.map((x) => ({ text: bi(x.text, x.textEs), correct: x.category === a.id })),
      solution: { en: sentences(it.explanation), es: sentences(it.explanationEs) },
      misconception: null,
      origin: `${tier}:${idx}:sort->select`,
    };
  }
  if (it.type === "matching-game" && Array.isArray(it.pairs) && it.pairs.length >= 3) {
    const pairs = it.pairs.slice(0, 5);
    if (pairs.some((p) => !p.term || !p.match) || !it.explanationEs)
      return { skip: "match lacks fields" };
    const termEs = (p) => p.termEs || (wordy(p.term) ? null : p.term);
    const matchEs = (p) => p.matchEs || (wordy(p.match) ? null : p.match);
    if (pairs.some((p) => !termEs(p) || !matchEs(p))) return { skip: "match lacks Spanish" };
    return {
      ...base,
      type: "match",
      prompt: bi(
        it.label || "Match each item to its partner.",
        it.labelEs || "Une cada elemento con su pareja.",
      ),
      pairs: pairs.map((p) => ({ left: bi(p.term, termEs(p)), right: bi(p.match, matchEs(p)) })),
      solution: { en: sentences(it.explanation), es: sentences(it.explanationEs) },
      misconception: null,
      origin: `${tier}:${idx}:match`,
    };
  }
  return { skip: `type ${it.type} not used` };
}

function genItem(spec, seed, tier) {
  const p = generate(spec, seed);
  return {
    type: "gen",
    gen: spec,
    seed,
    tier,
    dok: tier === 3 ? 2 : tier,
    misconception: p.distractors[0]?.tag || null,
    origin: `gen:${spec}@seed${seed}`,
  };
}

function frameFor(lang, _gen) {
  return lang === "en" ? "I know ___ because ___." : "Sé que ___ porque ___.";
}

function compilePractice(lesson, cfg) {
  const std = { ...(standards[cfg.standard] || {}), code: cfg.standard };
  const spec = SIMILAR[lesson.id];
  const p = cfg.practice || {};
  const pools = {
    1: p.approaching || [],
    2: [...(p.onLevel || []), ...(p.optional || [])],
    3: p.extending || [],
  };
  const pickFrom = (tier, want, typesOrder) => {
    const out = [];
    const skipped = [];
    const conv = pools[tier].map((it, i) => ({ it, i, c: convert(it, tier, std, lesson.id, i) }));
    for (const t of typesOrder) {
      for (const x of conv) {
        if (out.length >= want) break;
        if (x.c.skip || x.used || x.c.type !== t) continue;
        x.used = true;
        out.push(x.c);
      }
    }
    for (const x of conv) if (x.c.skip) skipped.push(`${tier}:${x.i} ${x.c.skip}`);
    stats.itemsSkippedNoSpanish += conv.filter((x) => x.c.skip && /Spanish/.test(x.c.skip)).length;
    const rest = conv.filter((x) => !x.used && !x.c.skip).map((x) => x.c);
    return { out, skipped, rest };
  };
  const t1 = pickFrom(1, 2, ["numeric", "mc", "select", "match"]);
  const t2 = pickFrom(2, 3, ["select", "match", "numeric", "mc"]);
  const t3 = pickFrom(3, 2, ["error", "mc", "numeric", "select"]);
  // A Stretch tier with no error-analysis borrows one from Build or Warm-up when one exists.
  if (!t3.out.some((x) => x.type === "error")) {
    const borrowed = [...t2.rest, ...t1.rest].find((x) => x.type === "error");
    if (borrowed) t3.out.unshift({ ...borrowed, tier: 3, dok: 3 });
  }
  // Interactive input types where the skill has a natural one: a number line to place a point on
  // (Warm up) and a table to complete (Build). Both come from the lesson's own generator.
  const taskItem = (kind, tier, key) => {
    const seed = lessonSeed(lesson.id, key);
    const t = kind === "table" ? tableTask(spec, seed) : lineTask(spec, seed);
    if (!t) return [];
    return [
      {
        type: kind,
        gen: spec,
        seed,
        tier,
        dok: tier === 1 ? 1 : 2,
        misconception: t.distractors?.[0]?.tag || null,
        origin: `${kind}:${spec}@seed${seed}`,
      },
    ];
  };
  const problems = [
    ...t1.out,
    genItem(spec, lessonSeed(lesson.id, "hw1"), 1),
    ...taskItem("line", 1, "line1"),
    ...t2.out,
    genItem(spec, lessonSeed(lesson.id, "hw2"), 2),
    ...taskItem("table", 2, "table1"),
    ...t3.out,
  ];
  // Every set has an error analysis. When the lesson's own items offer none with Spanish, a "fix
  // it" item shows a classmate's answer built from the generator's known misconception.
  if (!problems.some((x) => x.type === "error")) {
    problems.push({
      type: "fixit",
      gen: spec,
      seed: lessonSeed(lesson.id, "fix"),
      tier: 3,
      dok: 3,
      misconception: generate(spec, lessonSeed(lesson.id, "fix")).distractors[0]?.tag || null,
      origin: `fixit:${spec}`,
    });
  }
  // 8-12 problems: top up with verified generator items (Build first, then Warm-up).
  for (let k = 3; problems.length < 7; k++) {
    const tier = k % 2 ? 2 : 1;
    const item = genItem(spec, lessonSeed(lesson.id, `hw${k}`), tier);
    const at = problems.findIndex((x) => x.tier > tier);
    problems.splice(at < 0 ? problems.length : at, 0, item);
  }
  // Written explanation (DOK 3): explain the reasoning behind a Build item, with a frame.
  const anchor = [...t2.out, ...t1.out].find((x) => x.type === "mc" || x.type === "numeric");
  if (anchor) {
    problems.push({
      type: "explain",
      tier: 3,
      dok: 3,
      ccss: anchor.ccss,
      mccrs: anchor.mccrs,
      prompt: bi(
        `Look back at this problem: "${anchor.prompt.en}" Explain how you know your answer is right.`,
        `Vuelve a este problema: "${anchor.prompt.es}" Explica cómo sabes que tu respuesta es correcta.`,
      ),
      frame: bi(frameFor("en"), frameFor("es")),
      model: bi(anchor.solution.en.join(" "), anchor.solution.es.join(" ")),
      hints: anchor.hints,
      solution: anchor.solution,
      misconception: anchor.misconception,
      origin: `explain:${anchor.origin}`,
    });
  }
  // Every problem carries a taxonomy tag; when the source item has none, the lesson's generator
  // supplies the lesson's main misconception and the record says so.
  const lessonTag = generate(spec, 1).distractors[0]?.tag || null;
  problems.splice(12);
  problems.forEach((x, i) => {
    x.id = `${lesson.id}-p${i + 1}`;
    if (!x.misconception) {
      x.misconception = lessonTag;
      x.misconceptionSource = "lesson-default";
    } else x.misconceptionSource ||= "item";
  });
  // Assignment (class or homework sheet): different items from the same pools plus two fresh seeds.
  const assignment = [
    ...t1.rest.slice(0, 2),
    genItem(spec, lessonSeed(lesson.id, "as1"), 1),
    ...t2.rest.slice(0, 2),
    genItem(spec, lessonSeed(lesson.id, "as2"), 2),
    ...taskItem("table", 2, "astable"),
    ...taskItem("line", 2, "asline"),
    ...t3.rest.slice(0, 1),
    genItem(spec, lessonSeed(lesson.id, "as3"), 3),
  ].map((x, i) => ({
    ...x,
    id: `${lesson.id}-a${i + 1}`,
    misconception: x.misconception || lessonTag,
    misconceptionSource: x.misconceptionSource || (x.misconception ? "item" : "lesson-default"),
  }));

  const ci = cfg.launch?.conceptIntro || {};
  const iDo = ci.iDo || {};
  const refresher = {
    title: bi(ci.heading || "Quick Refresher", ci.headingEs || "Repaso rápido"),
    steps: (iDo.lines || []).map((en, i) => bi(en, iDo.linesEs?.[i])),
    visual: iDo.viz || null,
    vizAlt: bi(iDo.viz?.alt || "", iDo.viz?.altEs || ""),
  };
  if (refresher.title.es === "Repaso rápido" && ci.heading)
    refresher.title.es = ci.headingEs || ci.heading;

  const vocab = (cfg.vocabulary || []).slice(0, 5).map((v) => {
    const g = glossary[String(v.term).toLowerCase()];
    return {
      term: bi(v.term, v.termEs || g?.termEs || v.term),
      def: g ? bi(g.en, g.es) : bi(v.definition, v.definitionEs),
      source: g ? "data/family-glossary.json" : `lessons/${lesson.id}/config.json`,
    };
  });

  return {
    schema: "pfa-practice/1",
    lessonId: lesson.id,
    unit: lesson.unit,
    lesson: lesson.lesson,
    title: bi(lesson.title, titlesEs[lesson.id] || null),
    standard: cfg.standard,
    ccss: std.oldId || null,
    objective: {
      ...bi(cfg.contentObjective || lesson.objective, objectiveEs(lesson.id).es),
      ...(objectiveEs(lesson.id).review ? { translation: "needs-review" } : {}),
    },
    minutes: 20,
    similar: spec,
    refresher,
    vocab,
    problems,
    assignment,
    reflect: {
      frame: bi(
        "Today I learned ___. One thing I still wonder is ___.",
        "Hoy aprendí ___. Algo que todavía me pregunto es ___.",
      ),
    },
    selection: { skipped: [...t1.skipped, ...t2.skipped, ...t3.skipped] },
  };
}

function compileFamily(lesson, cfg, sidecar) {
  const v3 = sidecar.v3 || {};
  const say = sidecar.stuckTips?.say || [];
  const confused = v3.confused || [];
  const basic = (sidecar.basicPractice || []).filter((q) => q.stemEs && q.explanationEs);
  const tryIt = basic.slice(0, 4).map((q, i) => {
    const choicesEs = q.choicesEs || q.choices;
    return {
      id: `${lesson.id}-f${i + 1}`,
      prompt: bi(q.stem, q.stemEs),
      answer: bi(q.choices[q.correctIndex], choicesEs[q.correctIndex]),
      why: bi(q.explanation, q.explanationEs),
    };
  });
  // Lessons with no family skill items (the Unit 10 mindset lessons, by contract) use the sidecar's
  // own try-together steps; the "answer" is the authored hint, the "why" the authored help line.
  if (tryIt.length < 3) {
    for (const st of sidecar.tryTogether?.steps || []) {
      if (tryIt.length >= 4) break;
      if (!st.en || !st.es || !st.hint || !st.hintEs) continue;
      tryIt.push({
        id: `${lesson.id}-f${tryIt.length + 1}`,
        prompt: bi(st.en, st.es),
        answer: bi(st.hint, st.hintEs),
        why: bi(st.helpEn || st.hint, st.helpEs || st.hintEs),
      });
    }
  }
  if (tryIt.length < 3) {
    for (const c of v3.confused || []) {
      if (tryIt.length >= 4) break;
      if (!hasBoth(c.coach) || !hasBoth(c.why)) continue;
      tryIt.push({
        id: `${lesson.id}-f${tryIt.length + 1}`,
        prompt: bi(c.coach.en, c.coach.es),
        answer: bi(c.why.en, c.why.es),
        why: hasBoth(c.wrong)
          ? bi(`A common first idea: "${c.wrong.en}"`, `Una primera idea común: "${c.wrong.es}"`)
          : bi(c.why.en, c.why.es),
      });
    }
  }
  const words = (cfg.vocabulary || []).slice(0, 5).map((v) => {
    const g = glossary[String(v.term).toLowerCase()];
    return {
      term: bi(v.term, v.termEs || g?.termEs || v.term),
      def: g ? bi(g.en, g.es) : bi(v.definition, v.definitionEs),
    };
  });
  const conversation = [
    ...(v3.kitchenTable ? [bi(v3.kitchenTable.en, v3.kitchenTable.es)] : []),
    ...confused
      .map((c) => c.coach)
      .filter(hasBoth)
      .map((c) => bi(c.en, c.es)),
  ].slice(0, 3);
  while (conversation.length < 3) {
    conversation.push(
      [
        bi("How did you know where to start?", "¿Cómo supiste por dónde empezar?"),
        bi(
          "Can you show me a picture or table that explains it?",
          "¿Me puedes mostrar un dibujo o una tabla que lo explique?",
        ),
        bi("How could you check your answer?", "¿Cómo podrías comprobar tu respuesta?"),
      ][conversation.length],
    );
  }
  return {
    schema: "pfa-family/1",
    lessonId: lesson.id,
    unit: lesson.unit,
    title: bi(lesson.title, titlesEs[lesson.id] || null),
    standard: cfg.standard,
    learning: bi(sidecar.learningTonight?.en, sidecar.learningTonight?.es),
    whyItMatters:
      v3.hook && hasBoth(v3.hook)
        ? bi(v3.hook.en, v3.hook.es)
        : bi(sidecar.bigIdea?.en, sidecar.bigIdea?.es),
    bigIdea: bi(sidecar.bigIdea?.en, sidecar.bigIdea?.es),
    howItLooks: (sidecar.conceptSteps || []).map((s) => bi(s.en, s.es)),
    doThis: sidecar.bridge?.class ? bi(sidecar.bridge.class.en, sidecar.bridge.class.es) : null,
    notThat: sidecar.stuckTips?.dontSay?.[0]
      ? bi(sidecar.stuckTips.dontSay[0].en, sidecar.stuckTips.dontSay[0].es)
      : null,
    doWhy: sidecar.bridge?.why ? bi(sidecar.bridge.why.en, sidecar.bridge.why.es) : null,
    words,
    tryIt,
    conversation,
    stuck: say.slice(0, 3).map((s) => bi(s.en, s.es)),
    source: `data/family-homework-notes/${lesson.id}.json`,
  };
}

const out = new Map();
const unitNames = Object.fromEntries((curriculum.units || []).map((u) => [u.number, u.title]));
const map = {
  schema: "pfa-assignments/1",
  note: "Single source of truth for in-scope PFA pages. Read by the hub page, the generators and the gates. Generated by scripts/pfa/compile-pfa-data.mjs.",
  units: [],
  lessons: [],
};
for (const lesson of manifest.lessons) {
  const cfg = read(`lessons/${lesson.id}/config.json`);
  const sidecarPath = `data/family-homework-notes/${lesson.id}.json`;
  const sidecar = existsSync(join(ROOT, sidecarPath)) ? read(sidecarPath) : {};
  out.set(`data/practice/${lesson.id}.json`, compilePractice(lesson, cfg));
  out.set(`data/family/${lesson.id}.json`, compileFamily(lesson, cfg, sidecar));
  map.lessons.push({
    id: lesson.id,
    unit: lesson.unit,
    lesson: lesson.lesson,
    title: lesson.title,
    standard: lesson.standard,
    urls: {
      homework: `/lessons/${lesson.id}/practice`,
      family: `/lessons/${lesson.id}/family-guide`,
      assignment: `/lessons/${lesson.id}/assignment`,
      answerKey: `/lessons/${lesson.id}/assignment-answer-key`,
      familyHub: `/practice-hub/family/unit-${lesson.unit}`,
      lesson: `/lessons/${lesson.id}/`,
      familyMathStudio: `/lessons/${lesson.id}/homework`,
    },
  });
}
for (const n of [...new Set(manifest.lessons.map((l) => l.unit))].sort((a, b) => a - b)) {
  map.units.push({
    number: n,
    title: unitNames[n] || { en: `Unit ${n}`, es: `Unidad ${n}` },
    familyHub: `/practice-hub/family/unit-${n}`,
    lessons: manifest.lessons.filter((l) => l.unit === n).map((l) => l.id),
  });
}
out.set("data/assignments.json", map);

let stale = 0;
let wrote = 0;
for (const [rel, data] of out) {
  const abs = join(ROOT, rel);
  const text = `${JSON.stringify(data, null, 1)}\n`;
  const existing = existsSync(abs) ? readFileSync(abs, "utf8") : null;
  if (existing && !FORCE && JSON.parse(existing).authored === true) continue;
  if (existing === text) continue;
  if (CHECK) {
    stale++;
    console.error(`stale: ${rel}`);
    continue;
  }
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, text);
  wrote++;
}
if (CHECK) {
  if (stale) {
    console.error(
      `FAIL pfa-data: ${stale} compiled file(s) stale. Run: node scripts/pfa/compile-pfa-data.mjs`,
    );
    process.exit(1);
  }
  console.log(`PASS pfa-data: ${out.size} compiled files fresh`);
} else {
  console.log(`pfa-data: ${out.size} files, ${wrote} written.`, JSON.stringify(stats));
}
