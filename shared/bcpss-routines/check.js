// Routine blocks, family "check": retrieval set, double-duty words, exit-ticket quick rubric,
// common slip and teacher redirect, language routines, lesson arc.
// Also the unit's language goals, the home-practice plan, the "I can" passport, the newcomer menu and the cognate detective.
// Source data: esol_pack.retrieval, esol_pack.double_duty, esol_pack.routines, .objectives, .passport, .newcomer, .cognates,
// connections[0].language_exit_ticket_json, .common_language_misconception, .l1_watchouts, .lesson_arc.
import { chips, h, kv, list, mc, p, table } from "./nodes.js";

const conn = (d) => d?.connections?.[0] || null;

export const CHECK_BLOCKS = [
  {
    id: "goals",
    family: "check",
    title: "Language goals and look-fors",
    blurb: "The content goal, the language goal for this level and what to listen for.",
    audience: "teacher",
    part: "rt-goals",
    paths: ["esol_pack.objectives", "esol_pack.klu"],
    source: (d) => d?.esol_pack?.objectives && { ...d.esol_pack.objectives, klu: d.esol_pack.klu },
    build(s, band) {
      return [
        p(`Key language use: ${s.klu}`, true),
        kv([
          ["Content goal", s.content],
          ["Language goal", s.language[band]],
          ["Look for", s.look_fors[band]],
        ]),
        chips(s.standards || [], "Standards"),
      ];
    },
  },
  {
    id: "passport",
    family: "check",
    title: "I-can passport",
    blurb: "One can-do statement per language domain, at this level.",
    audience: "student",
    part: "rt-passport",
    paths: ["esol_pack.passport"],
    source: (d) => d?.esol_pack?.passport,
    build(s, band) {
      return [kv(Object.entries(s[band]))];
    },
  },
  {
    id: "newcomer",
    family: "check",
    title: "Newcomer menu",
    blurb: "Low-language ways to show what a new student knows about the unit words.",
    audience: "teacher",
    part: "rt-newcomer",
    paths: ["esol_pack.newcomer"],
    source: (d) => d?.esol_pack?.newcomer,
    build(items) {
      return [kv(items.map((x) => [x.label, x.text]))];
    },
  },
  {
    id: "cognates",
    family: "check",
    title: "Cognate detective",
    blurb: "Spanish-English word links, with a tip, a pronunciation note and any false friend.",
    audience: "student",
    part: "rt-cognates",
    paths: ["esol_pack.cognates"],
    source: (d) => d?.esol_pack?.cognates,
    build(items) {
      return [
        table(
          ["Word", "Spanish", "Type", "Tip", "Say it", "Careful"],
          items.map((x) => [
            `${x.term}: ${x.def}`,
            x.cognate_es,
            x.kind,
            x.tip,
            x.pronunciation || "",
            x.false_friend || "",
          ]),
        ),
      ];
    },
  },
  {
    id: "homeplan",
    family: "check",
    title: "Home practice (English and Spanish)",
    blurb: "Short family tasks for the week, side by side in English and Spanish.",
    audience: "student",
    part: "rt-homeplan",
    paths: ["esol_pack.family"],
    source: (d) => d?.esol_pack?.family,
    build(s) {
      const n = Math.max(s.en.length, s.es.length);
      const at = (list, k, f) => list[k]?.[f] || "";
      return [
        table(
          ["Day", "Try at home", "Día", "Para hacer en casa"],
          Array.from({ length: n }, (_, k) => [
            at(s.en, k, "day"),
            at(s.en, k, "text"),
            at(s.es, k, "day"),
            at(s.es, k, "text"),
          ]),
        ),
      ];
    },
  },
  {
    id: "retrieval",
    family: "check",
    title: "Retrieval set",
    blurb: "Five quick questions that revisit this unit's words and earlier ones.",
    audience: "student",
    part: "rt-retrieval",
    keyPart: "rt-retrkey",
    paths: ["esol_pack.retrieval"],
    skip: ["answer_index"],
    teacherOnly: ["from"],
    source: (d) => d?.esol_pack?.retrieval,
    build(items, _band, view) {
      const key = view !== "student";
      return [
        mc(
          items.map((x) => ({
            q: x.prompt,
            options: x.options,
            ...(key
              ? {
                  answer: x.answer_index,
                  note: [`From: ${x.from}${x.spiral ? " (earlier unit)" : ""}`],
                }
              : {}),
          })),
        ),
      ];
    },
  },
  {
    id: "doubleduty",
    family: "check",
    title: "Double-duty words",
    blurb: "Words that mean different things in math, science, social studies and everyday talk.",
    audience: "student",
    part: "rt-doubleduty",
    paths: ["esol_pack.double_duty"],
    skip: ["in_unit"],
    source: (d) => d?.esol_pack?.double_duty,
    build(items) {
      return [
        table(
          ["Word", "What it means where"],
          items.map((x) => [
            `${x.word}${x.in_unit ? " (in this unit)" : ""}`,
            x.senses.map((s) => `${s.ctx}: ${s.def}`).join(" · "),
          ]),
        ),
      ];
    },
  },
  {
    id: "exit",
    family: "check",
    title: "Exit ticket quick rubric",
    blurb: "Score the language exit ticket in under a minute.",
    audience: "teacher",
    part: "rt-exit",
    paths: ["connections[].language_exit_ticket_json"],
    skip: ["blueprint_id"],
    source: (d) => conn(d)?.language_exit_ticket_json,
    build(s) {
      return [
        p(`Key language use: ${s.wida_klu}`, true),
        kv([
          ["Prompt", s.prompt],
          ["Target frame", s.target_frame],
          ["Model answer", s.model],
        ]),
        chips(s.required_vocab || [], "Required words"),
        h("Look for"),
        list(s.look_fors),
        h("Quick rubric"),
        kv([
          ["Emerging", s.quick_rubric.emerging],
          ["Developing", s.quick_rubric.developing],
          ["Proficient", s.quick_rubric.proficient],
        ]),
      ];
    },
  },
  {
    id: "redirect",
    family: "check",
    title: "Common slip and redirect",
    blurb: "The language mistake to expect, what to say, and home-language watch-outs.",
    audience: "teacher",
    part: "rt-redirect",
    paths: ["connections[].common_language_misconception", "connections[].l1_watchouts"],
    source: (d) => ({
      slip: conn(d)?.common_language_misconception,
      watch: conn(d)?.l1_watchouts,
    }),
    build(s) {
      return [
        h("Common slip"),
        p(s.slip.misconception_pattern),
        p(`Teacher redirect: ${s.slip.teacher_redirect}`),
        ...(s.watch?.length
          ? [
              h("Watch-outs by home language"),
              table(
                ["Group", "What happens", "Quick fix"],
                s.watch.map((w) => [w.l1_group, w.friction_point, w.quick_fix]),
              ),
            ]
          : []),
      ];
    },
  },
  {
    id: "routines",
    family: "check",
    title: "Language routines",
    blurb: "Short, repeatable routines for this unit, with their source.",
    audience: "teacher",
    part: "rt-routines",
    paths: ["esol_pack.routines"],
    skip: ["id"],
    source: (d) => d?.esol_pack?.routines,
    build(items) {
      return items.flatMap((r) => [h(r.name), p(r.source, true), list(r.steps, true)]);
    },
  },
  {
    id: "arc",
    family: "check",
    title: "Lesson arc",
    blurb: "How the lesson moves: phase, minutes, focus and activities.",
    audience: "teacher",
    part: "rt-arc",
    paths: ["connections[].lesson_arc"],
    source: (d) => conn(d)?.lesson_arc,
    build(items) {
      return [
        table(
          ["Phase", "Minutes", "Focus", "Activities"],
          items.map((x) => [x.phase, x.minutes, x.focus, (x.activities || []).join(", ")]),
        ),
      ];
    },
  },
];
