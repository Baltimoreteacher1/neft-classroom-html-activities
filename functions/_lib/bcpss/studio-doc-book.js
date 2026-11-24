// Language Studio print: Student Activity Book (part "book" and single-activity parts "activity-<n>").
// Cover, goals page, word wall, one activity per page, exit ticket slip.

import {
  B,
  b,
  DOMAINS,
  frameRuns,
  gradeLabel,
  hl,
  i,
  LEVEL_LABEL,
  newDoc,
  paginateCards,
  section,
  subjectTone,
  t,
} from "./studio-doc.js";
import { printable } from "./studio-doc-activities.js";

export const EXIT_RUBRIC_LABELS = {
  emerging: "Getting started",
  developing: "Almost there",
  proficient: "Got it!",
};

export function mentorRuns(mentor, { numbered = false } = {}) {
  const out = [];
  mentor.chunks.forEach((c, k) => {
    if (k) out.push(t(" "));
    out.push(hl(numbered ? `${c.text} ` : c.text, c.tone));
    if (numbered) out.push({ badge: k + 1 });
  });
  return out;
}

export function mentorLegend(mentor) {
  return B.table(
    mentor.chunks.map((c, k) => [
      { t: String(k + 1), bold: true, tone: c.tone, align: "center" },
      { t: c.role, bold: true },
      c.ask,
    ]),
    { headers: ["", "Part", "Ask yourself"], widths: [7, 28, 65], compact: true },
  );
}

function coverSection(detail) {
  const u = detail.unit;
  return {
    layout: "portrait",
    bleed: true,
    blocks: [
      B.hero({
        tone: subjectTone(u.subject),
        kicker: `Student Activity Book · Unit ${u.unit_number}`,
        title: u.unit_title,
        subtitle: detail.studio.essential_question,
        chips: [
          gradeLabel(u),
          u.subject,
          u.curriculum_name,
          `${detail.studio.activities.length} activities`,
        ],
        nameDate: true,
      }),
    ],
  };
}

function goalsSection(detail, ctx) {
  const s = detail.studio;
  const rows = ["Content goal", "Language goal"].map((label) => [
    { t: label, bold: true },
    { blocks: [B.boxRow(1, { size: "sm" })], align: "center" },
    { blocks: [B.boxRow(1, { size: "sm" })], align: "center" },
    { blocks: [B.boxRow(1, { size: "sm" })], align: "center" },
  ]);
  return section([
    B.heading("My goals for this unit", 1, { icon: "star", tone: "Reading" }),
    B.columns(
      [
        [
          B.callout("Reading", [B.para([t(s.can_do.content)])], {
            label: "Content goal",
            icon: "book",
          }),
        ],
        [
          B.callout("Speaking", [B.para([t(s.can_do.language)])], {
            label: "Language goal",
            icon: "speech",
          }),
        ],
      ],
      { widths: [48, 48] },
    ),
    B.callout("Game", [B.para([b(s.essential_question)], { size: "lg" })], {
      label: "The big question",
      icon: "bulb",
    }),
    B.heading("A sentence to steal", 2, { icon: "pencil", tone: "Writing" }),
    B.para(mentorRuns(s.mentor), { size: "lg" }),
    ctx.early
      ? B.chips(
          s.mentor.chunks.map((c, k) => ({ text: `${k + 1}  ${c.role}`, tone: c.tone, sol: true })),
          { label: "Sentence parts" },
        )
      : mentorLegend(s.mentor),
    B.callout(
      "Writing",
      s.frames[ctx.level].map((f) => B.para(frameRuns(f))),
      { label: `Sentence starters · ${LEVEL_LABEL[ctx.level]}`, icon: "pencil" },
    ),
    B.chips(s.connectors, { label: "Connecting words", tone: "Game" }),
    B.heading("How am I doing?", 3),
    B.table(rows, {
      headers: ["", "Not yet", "Almost", "I can!"],
      widths: [34, 22, 22, 22],
      compact: true,
      tone: "Reading",
    }),
  ]);
}

function wallSection(detail, ctx) {
  const vocab = detail.studio.vocab;
  const cards = vocab.map((v, k) => ({
    tone: DOMAINS[k % DOMAINS.length],
    blocks: [
      B.para(
        [
          ...(v.icon ? [{ t: `${v.icon}  `, small: true }] : []),
          { t: v.term, b: true },
          { t: `  ${v.pos}`, i: true, small: true },
        ],
        { size: "lg" },
      ),
      B.para([t(v.def)]),
      B.para([i(v.example)], { size: "sm" }),
      ...(v.es ? [B.para([{ t: "En español: ", b: true }, t(v.es)], { size: "sm" })] : []),
    ],
  }));
  return section(
    [
      B.heading("Word wall", 1, { icon: "abc", tone: "Vocabulary" }),
      B.cardGrid(cards, { cols: 2, rowH: ctx.early ? 1.74 : 1.7, cut: false }),
    ],
    { tone: "Vocabulary" },
  );
}

function activitySections(a, n, ctx) {
  const { blocks, extra } = printable(a, { ...ctx, domain: a.domain });
  const done = B.checklist([[b("I did it! "), t("I can explain my answers to a partner.")]], {
    tone: a.domain,
  });
  const strip = B.callout(a.domain, [B.para([t(a.support[ctx.level])]), done], {
    label: `Your level · ${LEVEL_LABEL[ctx.level]}`,
    icon: "bulb",
    strip: true,
  });
  const head = [
    B.band({
      number: n,
      domain: a.domain,
      title: a.title,
      minutes: a.minutes,
      grouping: a.grouping,
    }),
    B.para([t(a.mission)], { mission: true }),
  ];
  const first = section([...head, ...blocks, strip], { tone: a.domain });
  const more = extra.map((bl) => section([...bl, strip], { tone: a.domain }));
  return [first, ...more];
}

function exitSection(detail, ctx) {
  const e = detail.studio.exit_ticket;
  const rub = e.rubric;
  return section(
    [
      B.heading("Exit ticket", 1, { icon: "pencil", tone: "Writing" }),
      B.callout(
        "Writing",
        [
          B.para([b(e.prompt)], { size: "lg" }),
          B.para(frameRuns(e.frame.replace(/___/g, "[…]")), { size: "sm" }),
          B.lines(ctx.level === "l1_2" ? 4 : 6, { fill: ctx.answerKey ? [e.model] : undefined }),
        ],
        { label: "Show what you know", icon: "pencil" },
      ),
      B.rule({ icon: "scissors", label: "Hand this in" }),
      B.table([Object.keys(EXIT_RUBRIC_LABELS).map((k) => rub[k])], {
        headers: Object.values(EXIT_RUBRIC_LABELS),
        widths: [34, 33, 33],
        tone: "Vocabulary",
        compact: true,
      }),
      B.footerNote("Your teacher circles the box that shows how you did."),
    ],
    { tone: "Writing" },
  );
}

export function buildBook(detail, opts) {
  const ctx = {
    level: opts.level,
    answerKey: opts.answerKey,
    early: ["K", "1", "2"].includes(String(detail.unit.grade)),
  };
  const acts = detail.studio.activities;
  if (opts.only) {
    const a = acts[opts.only - 1];
    if (!a) throw new Error(`activity ${opts.only} not found`);
    return newDoc(detail, opts, activitySections(a, opts.only, ctx), {
      titleSuffix: ` · ${a.title}`,
    });
  }
  const sections = [
    coverSection(detail),
    goalsSection(detail, ctx),
    wallSection(detail, ctx),
    ...acts.flatMap((a, k) => activitySections(a, k + 1, ctx)),
    exitSection(detail, ctx),
  ];
  sections[0].pageBreakBefore = false;
  return newDoc(detail, opts, sections);
}
