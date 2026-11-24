// Language Studio print: teacher UNIT OVERVIEW (part "packet"). 4 pages, no scripts:
// goals + mentor sentence, vocabulary table, activity menu + exit ticket, watch-outs + quick tips.

import {
  B,
  b,
  frameRuns,
  gradeLabel,
  i,
  KIND_LABEL,
  LEVEL_LABEL,
  newDoc,
  section,
  subjectTone,
  t,
} from "./studio-doc.js";
import { EXIT_RUBRIC_LABELS, mentorLegend, mentorRuns } from "./studio-doc-book.js";

function page1(detail, ctx) {
  const { unit, studio: s } = detail;
  const move = detail.connections?.[0];
  const standards = (unit.core_standards || []).map((x) => ({
    text: x,
    tone: "Reading",
    sol: true,
  }));
  return section([
    B.hero({
      compact: true,
      tone: subjectTone(unit.subject),
      kicker: `Unit ${unit.unit_number} overview · ${gradeLabel(unit)} ${unit.subject}`,
      title: unit.unit_title,
      subtitle: s.essential_question,
    }),
    B.columns(
      [
        [
          B.callout("Reading", [B.para([t(s.can_do.content)])], {
            label: "I can (content)",
            icon: "book",
          }),
        ],
        [
          B.callout("Speaking", [B.para([t(s.can_do.language)])], {
            label: "I can (language)",
            icon: "speech",
          }),
        ],
      ],
      { widths: [48, 48] },
    ),
    B.chips(standards, { label: `Standards · ${unit.curriculum_name}`, tone: "Reading" }),
    ...(move
      ? [
          B.callout(
            "Game",
            [B.para([b(`${move.wida_klu}: `), t(move.move_name)], { size: "lg" })],
            { label: "Language move", icon: "speech" },
          ),
        ]
      : []),
    B.heading("Mentor sentence, unpacked", 2, { icon: "pencil", tone: "Writing" }),
    B.para(mentorRuns(s.mentor), { size: "lg" }),
    mentorLegend(s.mentor),
    B.callout("Reading", [B.para([t(s.mentor.gist)])], { label: "In plain words", icon: "book" }),
    B.callout(
      "Writing",
      s.frames[ctx.level].map((f) => B.para(frameRuns(f))),
      { label: `Sentence frames · ${LEVEL_LABEL[ctx.level]}`, icon: "pencil" },
    ),
  ]);
}

function page2(detail) {
  const noted = detail.studio.vocab.filter((v) => v.es_note);
  const noteParas = noted.map((v) => B.para([b(`${v.term}: `), t(v.es_note)], { size: "sm" }));
  const rows = detail.studio.vocab.map((v) => [
    {
      runs: [
        ...(v.icon ? [t(`${v.icon} `)] : []),
        b(v.term),
        { t: `  ${v.pos} · tier ${v.tier}`, i: true, small: true },
      ],
    },
    v.def,
    { runs: [i(v.example)] },
    v.nonexample,
    { runs: [b(v.es || "—")] },
  ]);
  return section([
    B.heading("Vocabulary", 1, { icon: "abc", tone: "Vocabulary" }),
    B.table(rows, {
      headers: ["Word", "What it means", "Example", "Not this", "Español"],
      widths: [17, 22, 25, 22, 14],
      zebra: true,
      tone: "Vocabulary",
    }),
    B.callout("Vocabulary", noteParas, {
      label: "Spanish notes: cognates and false friends",
      icon: "abc",
    }),
  ]);
}

function page3(detail) {
  const s = detail.studio;
  const total = s.activities.reduce((n, a) => n + a.minutes, 0);
  const rows = s.activities.map((a, k) => [
    { t: String(k + 1), bold: true, align: "center" },
    { runs: [b(a.title), { t: `  ${KIND_LABEL[a.kind] || a.kind}`, i: true, small: true }] },
    { t: a.domain, bold: true, tone: a.domain },
    { t: `${a.minutes}`, align: "center" },
    a.grouping,
    { runs: [t(a.mission), { t: `  Tip: ${a.tip}`, i: true, small: true }] },
  ]);
  return section([
    B.heading("Activity menu", 1, { icon: "game", tone: "Game" }),
    B.table(rows, {
      headers: ["#", "Activity", "Domain", "Min", "Grouping", "What students do"],
      widths: [4, 20, 11, 5, 10, 50],
      zebra: true,
      compact: true,
      tone: "Game",
    }),
    B.para(
      [
        i(
          `${s.activities.length} activities · about ${total} minutes in all. Mix and match across the week.`,
        ),
      ],
      { size: "sm" },
    ),
  ]);
}

function page4(detail) {
  const s = detail.studio;
  const e = s.exit_ticket;
  const materials = [...new Set(s.activities.flatMap((a) => a.materials || []))];
  return section([
    B.heading("Exit ticket", 1, { icon: "pencil", tone: "Writing" }),
    B.callout(
      "Writing",
      [B.para([b(e.prompt)]), B.para([i("Model: "), t(e.model)], { size: "sm" })],
      { label: "Prompt", icon: "pencil" },
    ),
    B.table([Object.keys(EXIT_RUBRIC_LABELS).map((k) => e.rubric[k])], {
      headers: Object.values(EXIT_RUBRIC_LABELS),
      widths: [34, 33, 33],
      tone: "Vocabulary",
      compact: true,
    }),
    B.heading("Watch-outs", 1, { icon: "bulb", tone: "Speaking" }),
    B.table(
      s.watchouts.map((w) => [{ t: w.group, bold: true, tone: "Speaking" }, w.issue, w.fix]),
      {
        headers: ["Who", "What you might see", "Try this"],
        widths: [18, 41, 41],
        tone: "Speaking",
      },
    ),
    B.callout(
      "Game",
      [
        B.para([b("You might hear: "), t(s.misconception.pattern)]),
        B.para([b("Say this: "), t(s.misconception.redirect)]),
      ],
      { label: "Common mix-up", icon: "bulb" },
    ),
    ...(materials.length
      ? [B.chips(materials, { label: "Materials to gather", tone: "Reading" })]
      : []),
  ]);
}

export function buildPacket(detail, opts) {
  const ctx = { level: opts.level };
  const sections = [page1(detail, ctx), page2(detail), page3(detail), page4(detail)];
  sections[0].pageBreakBefore = false;
  return newDoc(detail, opts, sections, { dense: true, titleSuffix: "" });
}
