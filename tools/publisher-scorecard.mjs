#!/usr/bin/env node
// Publisher scorecard: every core lesson scored 0-4 on nine dimensions, from MEASUREMENTS.
//
//   node tools/publisher-scorecard.mjs --label before --collect --base http://localhost:4499
//   node tools/publisher-scorecard.mjs --label after                # reuse reports/gate-*-after.json
//   node tools/publisher-scorecard.mjs --label after --floor 2.5 --floor-lesson 1.5 --floor-dim accessibility=2
//
// Static dimensions read lessons/<id>/config.json. Browser dimensions read the reports the five
// browser gates write (reports/gate-<name>-<label>.json), or collect them itself with --collect.
//
// HOW A SCORE IS BUILT (also printed in the markdown report, with every threshold):
//   * a dimension is a list of CRITERIA; each criterion yields 0..1 or null (no data)
//   * dimension score = 4 x mean(measured criteria)
//   * a dimension with fewer than 2 measured criteria is null - NEVER 4, never 0
//   * overall = mean of the non-null dimensions, null when fewer than 6 are measured
// Floors are options, not defaults: nothing is set to a number chosen to fail or to pass.
// Exit: 1 if a floor you passed is violated, 3 if --collect could not run, else 0.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { manifestLessonIds, parseArgs, runGates } from "./lib/lesson-gate-kit.mjs";
import { fleschKincaid } from "./lib/readability.mjs";

export const DIMENSIONS = [
  "instructional design",
  "interaction quality",
  "feedback quality",
  "content integrity",
  "language/readability",
  "visual design",
  "accessibility",
  "motivation/flow",
  "performance/robustness",
];
const KEY = (d) => d.split("/")[0].split(" ")[0]; // short key for --floor-dim

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ratio = (a, b) => (b > 0 ? a / b : null);
/** 0 -> 1.0 ; <=c0 -> 1.0 ; <=c1 -> .75 ; <=c2 -> .5 ; <=c3 -> .25 ; more -> 0 */
const band = (n, c) =>
  n == null ? null : n <= c[0] ? 1 : n <= c[1] ? 0.75 : n <= c[2] ? 0.5 : n <= c[3] ? 0.25 : 0;
const bandText = (c) =>
  `<=${c[0]} -> 1.0; <=${c[1]} -> 0.75; <=${c[2]} -> 0.5; <=${c[3]} -> 0.25; more -> 0`;
const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;

// ------------------------------------------------------------- config items
function collectItems(c) {
  const items = [];
  const add = (where, it) => {
    if (!it || typeof it !== "object") return;
    const choices = it.choices || it.options;
    items.push({
      where,
      type: it.type || (Array.isArray(choices) ? "multiple-choice" : "other"),
      raw: it,
      choices: Array.isArray(choices) ? choices : null,
      correct: it.correctIndex ?? it.answer ?? null,
      feedback: it.choiceFeedback,
      hints: it.hints || null,
      tags: it.misconceptionTags,
      explanation: it.explanation,
    });
  };
  for (const q of c.warmup?.questions || []) add("warmup", q);
  for (const t of ["approaching", "onLevel", "extending", "optional"])
    for (const it of c.practice?.[t] || []) add(`practice.${t}`, it);
  for (const it of c.connect?.check || []) add("connect", it);
  if (c.reflect?.exitTicket) add("exit", c.reflect.exitTicket);
  for (const it of c.reflect?.mstarPractice || []) {
    if (it.partA) add("mstar", it.partA);
    if (it.partB) add("mstar", it.partB);
    if (!it.partA) add("mstar", it);
  }
  return items;
}
const mcItems = (items) =>
  items.filter((i) => i.choices && i.correct != null && typeof i.correct === "number");

function instructionText(c) {
  const parts = [
    c.launch?.narrative,
    c.launch?.conceptIntro?.intro,
    c.explore?.instructions,
    c.connect?.scenario,
    c.connect?.prompt,
    ...(c.launch?.noticePrompts || []),
    ...(c.launch?.wonderPrompts || []),
  ];
  for (const t of ["approaching", "onLevel", "extending"])
    for (const it of c.practice?.[t] || []) parts.push(it.instructions, it.stem);
  for (const q of c.warmup?.questions || []) parts.push(q.stem);
  parts.push(c.reflect?.exitTicket?.stem);
  return parts.filter(nonEmpty).join(". ");
}

function walkStrings(o, fn, path = "") {
  if (typeof o === "string") fn(o, path);
  else if (Array.isArray(o)) o.forEach((v, i) => walkStrings(v, fn, `${path}[${i}]`));
  else if (o && typeof o === "object")
    for (const [k, v] of Object.entries(o)) walkStrings(v, fn, `${path}.${k}`);
}

// ----------------------------------------------------------------- criteria
// Each: { id, dim, text (the explicit pass criterion), run(ctx) -> {score:0..1|null, observed} }
export const CRITERIA = [
  // ---- 1 instructional design (config)
  {
    id: "id.worked-example",
    dim: 0,
    text: "launch.conceptIntro carries all three release steps (iDo, weDo, youDo). Score = steps present / 3.",
    run: ({ c }) => {
      const ci = c.launch?.conceptIntro || {};
      const n = ["iDo", "weDo", "youDo"].filter(
        (k) =>
          ci[k] && (Array.isArray(ci[k].lines) ? ci[k].lines.length : Object.keys(ci[k]).length),
      ).length;
      return { score: n / 3, observed: `${n}/3` };
    },
  },
  {
    id: "id.arc",
    dim: 0,
    text: "The lesson has each arc section: warm-up, launch narrative, explore, practice, connect, exit ticket. Score = sections / 6.",
    run: ({ c }) => {
      const has = [
        c.warmup?.questions?.length,
        nonEmpty(c.launch?.narrative),
        c.explore && Object.keys(c.explore).length,
        c.practice && Object.keys(c.practice).length,
        c.connect && Object.keys(c.connect).length,
        c.reflect?.exitTicket,
      ].filter(Boolean).length;
      return { score: has / 6, observed: `${has}/6` };
    },
  },
  {
    id: "id.tiers",
    dim: 0,
    text: "Practice is differentiated: approaching, onLevel and extending each hold >= 3 items. Score = tiers meeting that / 3.",
    run: ({ c }) => {
      const n = ["approaching", "onLevel", "extending"].filter(
        (t) => (c.practice?.[t] || []).length >= 3,
      ).length;
      return { score: n / 3, observed: `${n}/3 tiers` };
    },
  },
  {
    id: "id.spiral",
    dim: 0,
    text: "Spiral / retrieval: the warm-up reviews an earlier lesson (warmup.reviews or prevLessonId set). 1 or 0.",
    run: ({ c }) => ({
      score: c.warmup && (c.warmup.reviews || c.warmup.prevLessonId) ? 1 : 0,
      observed: c.warmup?.reviews || c.warmup?.prevLessonId || "none",
    }),
  },
  {
    id: "id.error-analysis",
    dim: 0,
    text: "At least one error-analysis item in practice, or an authored practice.commonMistake. 1 or 0.",
    run: ({ items, c }) => {
      const n = items.filter((i) => i.type === "error-analysis").length;
      return {
        score: n > 0 || nonEmpty(c.practice?.commonMistake) ? 1 : 0,
        observed: `${n} item(s)${nonEmpty(c.practice?.commonMistake) ? " + commonMistake" : ""}`,
      };
    },
  },
  {
    id: "id.dok3",
    dim: 0,
    text: "A higher-order task: an open-response item, an MSTAR/EBSR item, or a connect prompt. 1 or 0.",
    run: ({ items, c }) => {
      const n =
        items.filter((i) => i.type === "open-response" || i.type === "ebsr" || i.where === "mstar")
          .length + (nonEmpty(c.connect?.prompt) ? 1 : 0);
      return { score: n > 0 ? 1 : 0, observed: `${n}` };
    },
  },
  // ---- 2 interaction quality (config)
  {
    id: "iq.types",
    dim: 1,
    text: "Variety of response types across practice: >= 3 distinct item types. Score = min(types / 3, 1).",
    run: ({ items }) => {
      const t = new Set(items.filter((i) => i.where.startsWith("practice")).map((i) => i.type));
      return { score: Math.min(t.size / 3, 1), observed: `${t.size} types` };
    },
  },
  {
    id: "iq.non-mc-share",
    dim: 1,
    text: "At least 30% of practice items are not multiple choice. Score = min(share / 0.3, 1).",
    run: ({ items }) => {
      const p = items.filter((i) => i.where.startsWith("practice"));
      const share = ratio(p.filter((i) => i.type !== "multiple-choice").length, p.length);
      return {
        score: share == null ? null : Math.min(share / 0.3, 1),
        observed: share == null ? "no items" : `${Math.round(share * 100)}%`,
      };
    },
  },
  {
    id: "iq.volume",
    dim: 1,
    text: "At least 12 practice items across tiers. Score = min(n / 12, 1).",
    run: ({ items }) => {
      const n = items.filter((i) => i.where.startsWith("practice")).length;
      return { score: Math.min(n / 12, 1), observed: `${n}` };
    },
  },
  {
    id: "iq.visuals",
    dim: 1,
    text: "Interactive visuals / manipulatives: >= 3 of {launch.visual, explore.diagram, connect.diagram, connect.simulator, any practice diagram}. Score = min(n / 3, 1).",
    run: ({ c, items }) => {
      const n =
        [c.launch?.visual, c.explore?.diagram, c.connect?.diagram, c.connect?.simulator].filter(
          Boolean,
        ).length +
        items.filter((i) => i.raw.diagram).length +
        (c.practice?.diagram?.length ? 1 : 0);
      return { score: Math.min(n / 3, 1), observed: `${n}` };
    },
  },
  {
    id: "iq.explore",
    dim: 1,
    text: "Explore is an interactive activity (explore.type set to a drag/sort/match/fill type). 1 or 0.",
    run: ({ c }) => ({
      score: nonEmpty(c.explore?.type) ? 1 : 0,
      observed: c.explore?.type || "none",
    }),
  },
  // ---- 3 feedback quality (config)
  {
    id: "fq.hints",
    dim: 2,
    text: "Hint ladder on practice and exit-ticket multiple choice: score per item = min(hint tiers / 3, 1); mean over those items.",
    run: ({ items }) => {
      const m = mcItems(items).filter((i) => i.where.startsWith("practice") || i.where === "exit");
      if (!m.length) return { score: null, observed: "no items" };
      const s =
        m.reduce(
          (n, i) =>
            n + Math.min((Array.isArray(i.hints) ? i.hints.filter(nonEmpty).length : 0) / 3, 1),
          0,
        ) / m.length;
      return { score: s, observed: `${(s * 3).toFixed(1)}/3 tiers avg over ${m.length}` };
    },
  },
  {
    id: "fq.choice-feedback",
    dim: 2,
    text: "Every WRONG choice has its own feedback text (>= 20 chars). Score = covered wrong choices / wrong choices, over all multiple-choice items.",
    run: ({ items }) => {
      let wrong = 0;
      let ok = 0;
      for (const i of mcItems(items))
        i.choices.forEach((_, k) => {
          if (k === i.correct) return;
          wrong++;
          if (
            Array.isArray(i.feedback) &&
            nonEmpty(i.feedback[k]) &&
            i.feedback[k].trim().length >= 20
          )
            ok++;
        });
      return { score: ratio(ok, wrong), observed: wrong ? `${ok}/${wrong}` : "no items" };
    },
  },
  {
    id: "fq.misconception-tags",
    dim: 2,
    text: "Multiple-choice items carry >= 1 misconception tag. Score = tagged items / items.",
    run: ({ items }) => {
      const m = mcItems(items);
      const ok = m.filter((i) => Array.isArray(i.tags) && i.tags.some(nonEmpty)).length;
      return { score: ratio(ok, m.length), observed: m.length ? `${ok}/${m.length}` : "no items" };
    },
  },
  {
    id: "fq.explanation",
    dim: 2,
    text: "Every multiple-choice item explains its answer (explanation >= 20 chars). Score = items with one / items.",
    run: ({ items }) => {
      const m = mcItems(items);
      const ok = m.filter(
        (i) => nonEmpty(i.explanation) && i.explanation.trim().length >= 20,
      ).length;
      return { score: ratio(ok, m.length), observed: m.length ? `${ok}/${m.length}` : "no items" };
    },
  },
  // ---- 4 content integrity (config)
  {
    id: "ci.keys",
    dim: 3,
    text: "Every multiple-choice item has an in-range correct index and no duplicate choices. Score = clean items / items.",
    run: ({ items }) => {
      const m = items.filter((i) => i.choices && i.correct != null);
      const ok = m.filter(
        (i) =>
          Number.isInteger(i.correct) &&
          i.correct >= 0 &&
          i.correct < i.choices.length &&
          new Set(i.choices.map((x) => String(x).trim().toLowerCase())).size === i.choices.length,
      ).length;
      return { score: ratio(ok, m.length), observed: m.length ? `${ok}/${m.length}` : "no items" };
    },
  },
  {
    id: "ci.feedback-shape",
    dim: 3,
    text: "choiceFeedback, when present, has exactly one entry per choice. Score = consistent items / items with feedback.",
    run: ({ items }) => {
      const m = items.filter((i) => i.choices && Array.isArray(i.feedback));
      const ok = m.filter((i) => i.feedback.length === i.choices.length).length;
      return { score: ratio(ok, m.length), observed: m.length ? `${ok}/${m.length}` : "no items" };
    },
  },
  {
    id: "ci.placeholders",
    dim: 3,
    text: "No placeholder text anywhere in the config (TODO, TBD, FIXME, XXX, lorem ipsum, undefined, [object, ???; Spanish *Es fields are skipped because TODO is the Spanish word for all). Score = 1 if none, else 0.",
    run: ({ c }) => {
      let hits = 0;
      walkStrings(c, (s, path) => {
        if (/Es(\[|\.|$)/.test(path)) return; // Spanish "TODO" means "all", not a marker
        if (
          /\b(TODO|TBD|FIXME|XXX)\b|\bundefined\b|\[object|\?\?\?/.test(s) ||
          /lorem ipsum/i.test(s)
        )
          hits++;
      });
      return { score: hits ? 0 : 1, observed: `${hits} hit(s)` };
    },
  },
  {
    id: "ci.answer-spread",
    dim: 3,
    text: "The correct answer is not parked in one slot: no position holds more than 50% of a lesson's >= 8 multiple-choice keys. Score = 1 or 0 (null under 8 items).",
    run: ({ items }) => {
      const m = mcItems(items);
      if (m.length < 8) return { score: null, observed: `${m.length} items` };
      const cnt = {};
      for (const i of m) cnt[i.correct] = (cnt[i.correct] || 0) + 1;
      const top = Math.max(...Object.values(cnt)) / m.length;
      return { score: top <= 0.5 ? 1 : 0, observed: `top slot ${Math.round(top * 100)}%` };
    },
  },
  {
    id: "ci.vocab-complete",
    dim: 3,
    text: "Every vocabulary entry has a definition (>= 8 chars) and a cloze or example. Score = complete entries / entries.",
    run: ({ c }) => {
      const v = c.vocabulary || [];
      const ok = v.filter(
        (x) =>
          nonEmpty(x.definition) &&
          x.definition.length >= 8 &&
          (nonEmpty(x.cloze) || (x.examples || []).length || nonEmpty(x.visual)),
      ).length;
      return {
        score: ratio(ok, v.length),
        observed: v.length ? `${ok}/${v.length}` : "no vocabulary",
      };
    },
  },
  // ---- 5 language/readability (config)
  {
    id: "lr.grade",
    dim: 4,
    text: "Flesch-Kincaid grade of instruction text (numbers and symbols removed). <= 6.0 -> 1.0, >= 9.0 -> 0, linear between.",
    run: ({ c }) => {
      const fk = fleschKincaid(instructionText(c));
      return fk
        ? { score: clamp01((9 - fk.grade) / 3), observed: `grade ${fk.grade} (${fk.words} words)` }
        : { score: null, observed: "too little text" };
    },
  },
  {
    id: "lr.sentence",
    dim: 4,
    text: "Average sentence length of instruction text. <= 12 words -> 1.0, >= 22 -> 0, linear between.",
    run: ({ c }) => {
      const fk = fleschKincaid(instructionText(c));
      return fk
        ? { score: clamp01((22 - fk.avgSentence) / 10), observed: `${fk.avgSentence} words` }
        : { score: null, observed: "too little text" };
    },
  },
  {
    id: "lr.bilingual",
    dim: 4,
    text: "Spanish parity: of the authored English fields that have a sibling <name>Es slot anywhere in the config (stem, intro, explanation, ...), the share where the Es field is filled. Score = filled / slots.",
    run: ({ c }) => {
      let slots = 0;
      let filled = 0;
      const rec = (o) => {
        if (Array.isArray(o)) o.forEach(rec);
        else if (o && typeof o === "object") {
          for (const [k, v] of Object.entries(o)) {
            if (k.endsWith("Es")) continue;
            if (
              (typeof v === "string" && v.length > 2) ||
              (Array.isArray(v) && v.length && typeof v[0] === "string")
            ) {
              if (
                /^(id|type|kind|standard|term|name|emoji|image|category|role|lessonId|theme)/.test(
                  k,
                )
              )
                continue;
              if (`${k}Es` in o) {
                slots++;
                const e = o[`${k}Es`];
                if (Array.isArray(e) ? e.some(nonEmpty) : nonEmpty(e)) filled++;
              }
            }
            rec(v);
          }
        }
      };
      rec(c);
      return {
        score: ratio(filled, slots),
        observed: slots ? `${filled}/${slots}` : "no Es slots",
      };
    },
  },
  {
    id: "lr.vocab-support",
    dim: 4,
    text: "Vocabulary has >= 5 terms, and each term has a Spanish term + Spanish definition. Score = 0.5 x min(terms/5,1) + 0.5 x share with both Spanish fields.",
    run: ({ c }) => {
      const v = c.vocabulary || [];
      if (!v.length) return { score: 0, observed: "no vocabulary" };
      const es = v.filter((x) => nonEmpty(x.termEs) && nonEmpty(x.definitionEs)).length / v.length;
      return {
        score: 0.5 * Math.min(v.length / 5, 1) + 0.5 * es,
        observed: `${v.length} terms, ${Math.round(es * 100)}% Spanish`,
      };
    },
  },
  // ---- 6 visual design (browser)
  {
    id: "vd.contrast",
    dim: 5,
    text: `Distinct components (selector + colours) failing computed text contrast (WCAG AA) anywhere in the lesson: ${bandText([0, 2, 5, 10])}.`,
    run: ({ g }) => ({
      score: g.contrast ? band(g.contrast.textFails, [0, 2, 5, 10]) : null,
      observed: g.contrast ? `${g.contrast.textFails}` : "no data",
    }),
  },
  {
    id: "vd.fonts",
    dim: 5,
    text: `Distinct components set outside the approved families (Baloo 2, Nunito): ${bandText([0, 2, 6, 15])}.`,
    run: ({ g }) => ({
      score: g.typography ? band(g.typography.offFamily, [0, 2, 6, 15]) : null,
      observed: g.typography ? `${g.typography.offFamily}` : "no data",
    }),
  },
  {
    id: "vd.scale",
    dim: 5,
    text: `Distinct font sizes in the lesson (type-scale discipline): ${bandText([10, 16, 24, 36])}.`,
    run: ({ g }) => ({
      score: g.typography ? band(g.typography.distinctSizes, [10, 16, 24, 36]) : null,
      observed: g.typography ? `${g.typography.distinctSizes}` : "no data",
    }),
  },
  {
    id: "vd.small-text",
    dim: 5,
    text: `Distinct components with text under 12px: ${bandText([0, 1, 3, 8])}.`,
    run: ({ g }) => ({
      score: g.typography ? band(g.typography.smallText, [0, 1, 3, 8]) : null,
      observed: g.typography ? `${g.typography.smallText}` : "no data",
    }),
  },
  // ---- 7 accessibility (browser)
  {
    id: "ax.serious",
    dim: 6,
    text: `axe serious+critical violations (WCAG 2.0-2.2 A/AA): ${bandText([0, 1, 3, 6])}.`,
    run: ({ g }) => ({
      score: g.axe ? band(g.axe.serious + g.axe.critical, [0, 1, 3, 6]) : null,
      observed: g.axe ? `${g.axe.serious + g.axe.critical}` : "no data",
    }),
  },
  {
    id: "ax.minor",
    dim: 6,
    text: `axe moderate+minor violations: ${bandText([0, 3, 8, 16])}.`,
    run: ({ g }) => ({
      score: g.axe ? band(g.axe.moderate + g.axe.minor, [0, 3, 8, 16]) : null,
      observed: g.axe ? `${g.axe.moderate + g.axe.minor}` : "no data",
    }),
  },
  {
    id: "ax.targets",
    dim: 6,
    text: `Distinct controls under 44px effective hit area, worst of the 4 viewports: ${bandText([0, 3, 8, 20])}.`,
    run: ({ g }) => {
      const r = g.responsive && Object.values(g.responsive);
      if (!r || !r.length) return { score: null, observed: "no data" };
      const worst = Math.max(...r.map((v) => v.smallTargets));
      return { score: band(worst, [0, 3, 8, 20]), observed: `${worst}` };
    },
  },
  {
    id: "ax.ui-contrast",
    dim: 6,
    text: `Non-text UI (form-field boundaries, custom radios) under 3:1: ${bandText([0, 1, 3, 6])}.`,
    run: ({ g }) => ({
      score: g.contrast ? band(g.contrast.uiFails, [0, 1, 3, 6]) : null,
      observed: g.contrast ? `${g.contrast.uiFails}` : "no data",
    }),
  },
  {
    id: "ax.feedback-contrast",
    dim: 6,
    text: "Correct/incorrect feedback banners all reach AA contrast. 1 if none fail, 0 otherwise (null when no banner was judged).",
    run: ({ g }) => ({
      score: g.contrast && g.contrast.feedbackJudged ? (g.contrast.feedbackFails ? 0 : 1) : null,
      observed: g.contrast
        ? `${g.contrast.feedbackFails}/${g.contrast.feedbackJudged} failing`
        : "no data",
    }),
  },
  // ---- 8 motivation/flow (config)
  {
    id: "mf.story",
    dim: 7,
    text: "A story frame: flagship.mission has a title and story. 1 or 0.",
    run: ({ c }) => ({
      score: nonEmpty(c.flagship?.mission?.title) && nonEmpty(c.flagship?.mission?.story) ? 1 : 0,
      observed: c.flagship?.mission?.title || "none",
    }),
  },
  {
    id: "mf.scenes",
    dim: 7,
    text: "Narrative progression: >= 4 flagship scenes and a finale. Score = 0.5 x min(scenes/4,1) + 0.5 x finale present.",
    run: ({ c }) => {
      const n = (c.flagship?.scenes || []).length;
      return {
        score: 0.5 * Math.min(n / 4, 1) + (c.flagship?.finale ? 0.5 : 0),
        observed: `${n} scenes${c.flagship?.finale ? " + finale" : ""}`,
      };
    },
  },
  {
    id: "mf.reward",
    dim: 7,
    text: "A reward is named: launch.badge set. 1 or 0.",
    run: ({ c }) => ({
      score: nonEmpty(c.launch?.badge) ? 1 : 0,
      observed: c.launch?.badge || "none",
    }),
  },
  {
    id: "mf.choice",
    dim: 7,
    text: "Student choice / play: a bonus activity (practice.optionalActivity) or optional practice items. 1 or 0.",
    run: ({ c }) => ({
      score: c.practice?.optionalActivity?.name || (c.practice?.optional || []).length ? 1 : 0,
      observed:
        c.practice?.optionalActivity?.name || `${(c.practice?.optional || []).length} optional`,
    }),
  },
  {
    id: "mf.curiosity",
    dim: 7,
    text: "A curiosity hook: >= 2 notice prompts and >= 1 wonder prompt. 1 or 0.",
    run: ({ c }) => ({
      score:
        (c.launch?.noticePrompts || []).length >= 2 && (c.launch?.wonderPrompts || []).length >= 1
          ? 1
          : 0,
      observed: `${(c.launch?.noticePrompts || []).length}/${(c.launch?.wonderPrompts || []).length}`,
    }),
  },
  // ---- 9 performance/robustness (browser)
  {
    id: "pr.console",
    dim: 8,
    text: `Console errors + page errors across entry, lesson, every phase and a warm-up submit: ${bandText([0, 1, 3, 6])}.`,
    run: ({ g }) => ({
      score: g.console ? band(g.console.errors, [0, 1, 3, 6]) : null,
      observed: g.console ? `${g.console.errors}` : "no data",
    }),
  },
  {
    id: "pr.reach",
    dim: 8,
    text: "Every sidebar phase could be opened by a click. Score = visited / listed (0 if the lesson could not be entered).",
    run: ({ g }) =>
      g.console
        ? {
            score: !g.console.entered
              ? 0
              : g.console.phases
                ? g.console.phasesVisited / g.console.phases
                : null,
            observed: `${g.console.phasesVisited}/${g.console.phases}`,
          }
        : { score: null, observed: "no data" },
  },
  {
    id: "pr.sideways",
    dim: 8,
    text: "No horizontal page scroll and no clipped text at 360, 768, 1366, 1440. Score = 1 - (affected viewports / 4).",
    run: ({ g }) => {
      const r = g.responsive && Object.values(g.responsive);
      if (!r || !r.length) return { score: null, observed: "no data" };
      const bad = r.filter((v) => v.overflowStates > 0 || v.clipped > 0).length;
      return { score: 1 - bad / r.length, observed: `${bad}/${r.length} viewports affected` };
    },
  },
  {
    id: "pr.font-shift",
    dim: 8,
    text: "Zero layout shift attributable to font loading (shift within 250ms after a font face loads, on a text node), and total CLS < 0.1. Score = 0.5 + 0.5.",
    run: ({ g }) =>
      g.typography
        ? {
            score: (g.typography.fontShift < 0.001 ? 0.5 : 0) + (g.typography.cls < 0.1 ? 0.5 : 0),
            observed: `font ${g.typography.fontShift}, CLS ${g.typography.cls}`,
          }
        : { score: null, observed: "no data" },
  },
  {
    id: "pr.load",
    dim: 8,
    text: "Load time on the local preview server (relative signal only, not a production number): <= 2500ms -> 1.0, >= 8000ms -> 0, linear between.",
    run: ({ g }) =>
      g.console && g.console.loadMs != null
        ? { score: clamp01((8000 - g.console.loadMs) / 5500), observed: `${g.console.loadMs}ms` }
        : { score: null, observed: "no data" },
  },
];

// ------------------------------------------------------------------ scoring
export function scoreLesson(c, g) {
  const items = collectItems(c);
  const ctx = { c, g, items };
  const dims = DIMENSIONS.map((name, d) => {
    const crits = CRITERIA.filter((x) => x.dim === d).map((x) => {
      let r;
      try {
        r = x.run(ctx);
      } catch (e) {
        r = { score: null, observed: `error: ${e.message}` };
      }
      return {
        id: x.id,
        score: r.score == null ? null : +clamp01(r.score).toFixed(3),
        observed: r.observed,
      };
    });
    const measured = crits.filter((x) => x.score != null);
    const score =
      measured.length >= 2
        ? +(4 * (measured.reduce((n, x) => n + x.score, 0) / measured.length)).toFixed(2)
        : null;
    return { dimension: name, score, measured: measured.length, of: crits.length, criteria: crits };
  });
  const have = dims.filter((x) => x.score != null);
  const overall =
    have.length >= 6 ? +(have.reduce((n, x) => n + x.score, 0) / have.length).toFixed(2) : null;
  return { overall, dimensions: dims };
}

function loadGate(dir, name, label) {
  const f = join(dir, `gate-${name}-${label}.json`);
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
}

const stats = (xs) => {
  const v = xs.filter((x) => x != null).sort((a, b) => a - b);
  if (!v.length) return { n: 0, mean: null, median: null, min: null, max: null };
  const r = (x) => +x.toFixed(2);
  return {
    n: v.length,
    mean: r(v.reduce((a, b) => a + b, 0) / v.length),
    median: r(v[Math.floor(v.length / 2)]),
    min: r(v[0]),
    max: r(v.at(-1)),
  };
};

export function buildScorecard({ ids, reportsDir, label, readConfig }) {
  const gates = {};
  for (const n of [
    "contrast-browser",
    "typography-browser",
    "responsive",
    "console-clean",
    "axe-lessons",
  ])
    gates[n] = loadGate(reportsDir, n, label);
  const lessons = [];
  for (const id of ids) {
    const c = readConfig(id);
    const g = {
      contrast: gates["contrast-browser"]?.perLesson?.[id],
      typography: gates["typography-browser"]?.perLesson?.[id],
      responsive: gates.responsive?.perLesson?.[id],
      console: gates["console-clean"]?.perLesson?.[id],
      axe: gates["axe-lessons"]?.perLesson?.[id],
    };
    lessons.push({ id, ...scoreLesson(c, g) });
  }
  const fleet = { overall: stats(lessons.map((l) => l.overall)), dimensions: {} };
  DIMENSIONS.forEach((name, d) => {
    const s = lessons.map((l) => l.dimensions[d].score);
    fleet.dimensions[name] = {
      ...stats(s),
      nullLessons: s.filter((x) => x == null).length,
      worst: lessons
        .filter((l) => l.dimensions[d].score != null)
        .sort((a, b) => a.dimensions[d].score - b.dimensions[d].score)
        .slice(0, 5)
        .map((l) => `${l.id}=${l.dimensions[d].score}`),
    };
  });
  const critFleet = {};
  for (const x of CRITERIA) {
    const v = lessons
      .map((l) => l.dimensions[x.dim].criteria.find((k) => k.id === x.id)?.score)
      .filter((s) => s != null);
    critFleet[x.id] = {
      measured: v.length,
      mean: v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(3) : null,
    };
  }
  const gateStatus = Object.fromEntries(
    Object.entries(gates).map(([k, v]) => [
      k,
      v ? { status: v.status, at: v.at, base: v.base, swept: v.swept } : null,
    ]),
  );
  return { label, lessons, fleet, criteriaFleet: critFleet, gateStatus };
}

function markdown(sc) {
  const L = [];
  L.push(`# Publisher scorecard - ${sc.label}`, "");
  L.push(
    `Generated ${new Date().toISOString()}. ${sc.lessons.length} core lessons, nine dimensions, scored 0-4 from measurements.`,
    "",
  );
  L.push("## How scores are made", "");
  L.push(
    "- A dimension is a list of criteria; each yields 0-1 or **null** (no data).",
    "- Dimension score = 4 x mean of the measured criteria. **Fewer than 2 measured criteria = null** (never 4, never 0).",
    "- Overall = mean of non-null dimensions; null if fewer than 6 are measured.",
    "- Browser criteria come from the five browser gates' reports. A missing report means null, not a pass.",
    "",
  );
  L.push("## Gate inputs", "");
  for (const [k, v] of Object.entries(sc.gateStatus))
    L.push(
      `- ${k}: ${v ? `${v.status} (${v.swept.lessons} lessons, ${v.swept.pageRuns} page runs, base ${v.base})` : "**no report - its criteria are null**"}`,
    );
  L.push("", "## Fleet", "");
  L.push(
    "| Dimension | mean | median | min | max | null lessons | worst 5 |",
    "|---|---:|---:|---:|---:|---:|---|",
  );
  L.push(
    `| **overall** | ${sc.fleet.overall.mean} | ${sc.fleet.overall.median} | ${sc.fleet.overall.min} | ${sc.fleet.overall.max} | ${sc.lessons.length - sc.fleet.overall.n} | |`,
  );
  for (const [k, v] of Object.entries(sc.fleet.dimensions))
    L.push(
      `| ${k} | ${v.mean} | ${v.median} | ${v.min} | ${v.max} | ${v.nullLessons} | ${v.worst.join(", ")} |`,
    );
  L.push("", "## Criteria (the explicit pass rules)", "");
  DIMENSIONS.forEach((name, d) => {
    L.push(
      `### ${d + 1}. ${name}`,
      "",
      "| criterion | rule | fleet mean (0-1) | lessons measured |",
      "|---|---|---:|---:|",
    );
    for (const x of CRITERIA.filter((c) => c.dim === d))
      L.push(
        `| ${x.id} | ${x.text.replace(/\|/g, "/")} | ${sc.criteriaFleet[x.id].mean} | ${sc.criteriaFleet[x.id].measured} |`,
      );
    L.push("");
  });
  L.push(
    "## Per lesson",
    "",
    `| lesson | overall | ${DIMENSIONS.map((x) => KEY(x)).join(" | ")} |`,
    `|---|---:|${DIMENSIONS.map(() => "---:").join("|")}|`,
  );
  for (const l of sc.lessons)
    L.push(
      `| ${l.id} | ${l.overall ?? "null"} | ${l.dimensions.map((x) => x.score ?? "null").join(" | ")} |`,
    );
  return L.join("\n");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  const label = args.label && args.label !== true ? String(args.label) : "latest";
  const dir = args["out-dir"] || "reports";
  mkdirSync(dir, { recursive: true });
  if (args.collect) {
    const { ALL_GATES } = await import("./run-browser-gates.mjs");
    const code = await runGates(
      ALL_GATES,
      process.argv
        .slice(2)
        .filter(
          (a, i, all) =>
            a !== "--collect" &&
            !(
              all[i - 1] === "--floor" ||
              all[i - 1] === "--floor-lesson" ||
              all[i - 1] === "--floor-dim"
            ),
        ),
    );
    if (code === 3) process.exit(3);
    // Gate FAILURES are expected findings in a baseline; they do not stop the scorecard.
  }
  const ids = args.lessons ? String(args.lessons).split(",") : manifestLessonIds();
  const sc = buildScorecard({
    ids,
    reportsDir: dir,
    label,
    readConfig: (id) => JSON.parse(readFileSync(`lessons/${id}/config.json`, "utf8")),
  });
  if (ids.length < 80 && !args.lessons) throw new Error("manifest shrank below 80 lessons");
  writeFileSync(join(dir, `publisher-scorecard-${label}.json`), JSON.stringify(sc, null, 1));
  writeFileSync(join(dir, `publisher-scorecard-${label}.md`), markdown(sc));
  console.log(`wrote ${join(dir, `publisher-scorecard-${label}.{json,md}`)}`);
  console.log(
    `overall: mean ${sc.fleet.overall.mean}, median ${sc.fleet.overall.median}, min ${sc.fleet.overall.min}, max ${sc.fleet.overall.max} (${sc.fleet.overall.n}/${sc.lessons.length} lessons scored)`,
  );
  for (const [k, v] of Object.entries(sc.fleet.dimensions))
    console.log(
      `  ${k.padEnd(24)} mean ${String(v.mean).padStart(5)}  min ${String(v.min).padStart(5)}  null ${v.nullLessons}  worst ${v.worst.slice(0, 3).join(", ")}`,
    );
  // Floors: only when asked for. Nothing here is a default number.
  const fails = [];
  if (args.floor && sc.fleet.overall.mean != null && sc.fleet.overall.mean < +args.floor)
    fails.push(`fleet overall mean ${sc.fleet.overall.mean} < floor ${args.floor}`);
  if (args["floor-lesson"]) {
    const below = sc.lessons.filter((l) => l.overall != null && l.overall < +args["floor-lesson"]);
    console.log(
      `lessons below the per-lesson floor ${args["floor-lesson"]}: ${below.length}${
        below.length
          ? ` (${below
              .slice(0, 10)
              .map((l) => `${l.id}=${l.overall}`)
              .join(", ")})`
          : ""
      }`,
    );
    if (below.length)
      fails.push(`${below.length} lesson(s) below per-lesson floor ${args["floor-lesson"]}`);
  }
  if (args["floor-dim"]) {
    for (const spec of String(args["floor-dim"]).split(",")) {
      const [k, n] = spec.split("=");
      const dn = DIMENSIONS.find((x) => KEY(x) === k || x === k);
      if (!dn) {
        fails.push(`--floor-dim: unknown dimension "${k}" (use ${DIMENSIONS.map(KEY).join(", ")})`);
        continue;
      }
      const m = sc.fleet.dimensions[dn].mean;
      if (m == null) fails.push(`${dn}: no data to compare against floor ${n}`);
      else if (m < +n) fails.push(`${dn} fleet mean ${m} < floor ${n}`);
    }
  }
  if (!args.floor && !args["floor-lesson"] && !args["floor-dim"])
    console.log(
      "no floors set (report only): pass --floor, --floor-lesson or --floor-dim to gate.",
    );
  for (const f of fails) console.error(`FLOOR FAIL: ${f}`);
  process.exit(fails.length ? 1 : 0);
}
