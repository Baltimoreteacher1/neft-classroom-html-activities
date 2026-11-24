// Lesson Companion print: builds ONE lesson into the neutral document model (studio-doc.js) and renders it to HTML.
// Order: teacher card -> student pages (per level) -> newcomer page -> exit check -> answer key.
// Entry points: buildLessonDocument(lesson, opts), renderLessonHtml(lesson, opts), lessonFilename(lesson, opts).
// The Word twin lives in lesson-docx.js and consumes the same model.

import { BCPSS_UNITS } from "../../../data/bcpss-curriculum-seed.mjs";
import { keyBlocks, printActivity } from "./lesson-doc-kinds.js";
import { lessonCss } from "./lesson-print-css.js";
import {
  B,
  b,
  gradeLabel,
  i,
  LEVEL_LABEL,
  palette,
  section,
  subjectTone,
  t,
} from "./studio-doc.js";
import { renderDocumentHtml } from "./studio-print-html.js";

export const DISCLAIMER =
  "Not affiliated with or endorsed by Great Minds, McGraw Hill, Activate Learning, Studies Weekly, WIDA, or Baltimore City Public Schools.";

export const LEVELS = ["l1_2", "l3_4", "l5_6"];
export const LESSON_PARTS = ["lesson", "teacher", "student", "newcomer", "exit", "key"];

const STEP_LABEL = {
  warm_up: "Warm-up",
  input: "Input",
  notice: "Notice",
  interact: "Interact",
  produce: "Produce",
  check: "Check",
};
const MOVES = [
  { name: "Hear it", steps: ["warm_up", "input"], tone: "Listening" },
  { name: "Work with it", steps: ["notice", "interact"], tone: "Reading" },
  { name: "Make it yours", steps: ["produce", "check"], tone: "Writing" },
];

const UNIT_BY_ID = new Map(BCPSS_UNITS.map((u) => [u.id, u]));

/** "l3_4" | "3_4" | "all" -> canonical level or null. */
export function normalizeLevel(value) {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  if (v === "all") return "all";
  const m = v.match(/^l?([135])[_-]([246])$/);
  return m && LEVELS.includes(`l${m[1]}_${m[2]}`) ? `l${m[1]}_${m[2]}` : null;
}

const demandBand = (s) => (s < 0.4 ? "light" : s < 0.65 ? "moderate" : "heavy");
const arcStep = (lesson, step) => lesson.arc.find((s) => s.step === step);

// Generated lessons reuse the exit check as the arc's check step (printed once, as the exit page). An authored lesson may give
// the arc its own check activity: that one prints as the Check page and the exit check keeps its own page.
const arcSteps = (lesson) =>
  lesson.arc.filter(
    (s) => s.step !== "check" || JSON.stringify(s.activity) !== JSON.stringify(lesson.exit_check),
  );

// ---- page 1: teacher card -----------------------------------------------------------------------
// One table row per move: its name and minutes (tinted cell, text always present), then the steps with their teaching tip.
function moveRow(lesson, move) {
  const steps = move.steps.map((s) => arcStep(lesson, s)).filter(Boolean);
  const minutes = steps.reduce((n, s) => n + (s.minutes || s.activity.minutes || 0), 0);
  return [
    { runs: [b(move.name), t(`  ${minutes} min`)], tone: move.tone },
    {
      blocks: steps.map((s) =>
        B.para(
          [
            b(`${STEP_LABEL[s.step]}: ${s.activity.title}`),
            t(
              ` (${s.minutes || s.activity.minutes} min, ${s.activity.grouping}). ${s.activity.tip}`,
            ),
          ],
          { size: "sm" },
        ),
      ),
    },
  ];
}

function teacherSection(lesson, unit) {
  const tc = lesson.teacher_card;
  const lo = lesson.language_objective;
  const draft = lesson.source === "draft_standards_based";
  const materials = [
    ...new Set([
      ...(tc.materials || []),
      ...lesson.arc.flatMap((s) => s.activity.materials || []),
      ...lesson.newcomer_path.flatMap((a) => a.materials || []),
    ]),
  ];
  const score = lesson.language_demand_score;
  const review = lesson.review || {};
  return section(
    [
      B.hero({
        compact: true,
        tone: subjectTone(unit?.subject),
        kicker: `Teacher card · Lesson ${lesson.sequence}${unit ? ` · ${gradeLabel(unit)} ${unit.subject}` : ""}`,
        title: lesson.title,
        subtitle: `${unit?.unit_title ? `${unit.unit_title} · ` : ""}about ${tc.minutes} min · language demand ${score.toFixed(2)} of 1 (${demandBand(score)}) · ${lesson.standards.join(", ")}`,
      }),
      ...(draft
        ? [
            B.callout(
              "Writing",
              [
                B.para(
                  [
                    b("Draft notice. "),
                    t(
                      `Generated from unit content: review before teaching (pedagogy ${review.pedagogy || "pending"}, language QA ${review.language_qa || "pending"}).`,
                    ),
                  ],
                  { size: "sm" },
                ),
              ],
              { plain: false },
            ),
          ]
        : []),
      B.columns(
        [
          [
            B.callout("Reading", [B.para([t(lesson.content_objective)])], {
              label: "Content objective",
              icon: "book",
            }),
          ],
          [
            B.callout(
              "Speaking",
              [
                B.para([b(`${lo.klu}: `), t(lo.function)]),
                B.para([i(`Forms: ${(lo.forms || []).join(", ")}`)], { size: "sm" }),
              ],
              { label: "Language objective", icon: "speech" },
            ),
          ],
        ],
        { widths: [48, 48] },
      ),
      B.table(
        [
          ...LEVELS.map((l) => [
            { t: LEVEL_LABEL[l], bold: true },
            lo.by_level[l],
            tc.differentiation[l],
          ]),
          [
            { t: "Newcomer", bold: true },
            "No reading needed: point, listen, say.",
            tc.differentiation.newcomer,
          ],
        ],
        {
          headers: ["Level", "Students can…", "How to support"],
          widths: [13, 44, 43],
          compact: true,
          tone: "Speaking",
        },
      ),
      B.heading("The 3 moves", 2, { icon: "game", tone: "Game" }),
      B.table(
        MOVES.map((m) => moveRow(lesson, m)),
        { widths: [20, 80], compact: true, tone: "Game" },
      ),
      B.columns(
        [
          [
            B.heading("What to listen for", 3),
            B.checklist(tc.listen_for, { style: "box", tone: "Listening" }),
          ],
          [
            B.heading("Watch-outs", 3),
            B.checklist(tc.watchouts, { style: "box", tone: "Speaking" }),
          ],
        ],
        { widths: [48, 48] },
      ),
      B.chips(materials, { label: "Materials", tone: "Reading" }),
    ],
    { pageBreakBefore: false, tone: "neutral" },
  );
}

// ---- student pages ------------------------------------------------------------------------------
const nameLine = () =>
  B.para([
    b("Name  "),
    t("________________________________      "),
    b("Date  "),
    t("______________"),
  ]);

// Directions: the one-sentence mission with the step's icon, then the level support line(s).
function directions(a, levels) {
  const lines = levels.map((l) =>
    B.para(
      levels.length > 1
        ? [b(`${LEVEL_LABEL[l]}: `), t(a.support[l])]
        : [b("Your level: "), t(a.support[levels[0]])],
      {
        size: "sm",
      },
    ),
  );
  return B.callout(a.domain, [B.para([t(a.mission)]), ...lines], {
    label: "Directions",
    icon: palette(a.domain).icon,
  });
}

function activityBlocks(a, label, number, levels, ctx) {
  const out = printActivity(a, ctx);
  return {
    blocks: [
      B.band({
        number,
        domain: a.domain,
        title: `${label}: ${a.title}`,
        minutes: a.minutes,
        grouping: a.grouping,
      }),
      directions(a, levels),
      ...out.blocks,
    ],
    extra: out.extra || [],
  };
}

function pushActivity(sections, a, label, number, levels, ctx, { withName = false } = {}) {
  const { blocks, extra } = activityBlocks(a, label, number, levels, ctx);
  sections.push(section(withName ? [nameLine(), ...blocks] : blocks));
  for (const e of extra) sections.push(section(e));
}

function studentSections(lesson, level) {
  const ctx = { level, early: false, answerKey: false };
  const sections = [];
  const steps = arcSteps(lesson);
  steps.forEach((s, k) => {
    pushActivity(sections, s.activity, STEP_LABEL[s.step], k + 1, [level], ctx, {
      withName: k === 0,
    });
  });
  if (level === "l5_6" && lesson.extension) {
    pushActivity(sections, lesson.extension, "Stretch", steps.length + 1, [level], ctx);
  }
  return sections;
}

// The newcomer path is 3-4 short activities: the first shares a page with the cover strip, the rest pair up.
function newcomerSections(lesson) {
  const ctx = { level: "l1_2", early: false, answerKey: false };
  const outs = lesson.newcomer_path.map((a, k) => activityBlocks(a, "Newcomer", k + 1, [], ctx));
  const cover = [
    B.hero({
      compact: true,
      tone: "Vocabulary",
      kicker: "Newcomer page",
      title: lesson.title,
      subtitle: "Point, listen, say. No reading needed.",
    }),
    nameLine(),
  ];
  const pages = [[...cover, ...outs[0].blocks]];
  for (let k = 1; k < outs.length; k += 2) {
    pages.push(outs.slice(k, k + 2).flatMap((o) => o.blocks));
  }
  return [
    ...pages.map((blocks) => section(blocks)),
    ...outs.flatMap((o) => o.extra.map((e) => section(e))),
  ];
}

function exitSection(lesson, levels) {
  const ctx = { level: levels[0], early: false, answerKey: false };
  const a = lesson.exit_check;
  return section([
    nameLine(),
    ...activityBlocks(
      a,
      "Exit check",
      arcSteps(lesson).length + 1,
      levels.length === 1 ? levels : [],
      ctx,
    ).blocks,
  ]);
}

// ---- answer key (last) --------------------------------------------------------------------------
function keySection(lesson) {
  const entries = [
    ...arcSteps(lesson).map((s) => [STEP_LABEL[s.step], s.activity]),
    ...lesson.newcomer_path.map((a) => ["Newcomer", a]),
    ...(lesson.extension ? [["Stretch", lesson.extension]] : []),
    ["Exit check", lesson.exit_check],
  ];
  const cards = entries.map(([label, a], k) =>
    B.callout(a.domain, keyBlocks(a), { label: `${k + 1} · ${label} · ${a.title}` }),
  );
  return section(
    [
      B.heading("Answer key", 1, { icon: "check", tone: "Vocabulary" }),
      B.para([i(`${lesson.title}. Every answer comes from the activity itself.`)], { size: "sm" }),
      ...cards,
    ],
    { tone: "neutral" },
  );
}

// ---- document -----------------------------------------------------------------------------------
export function buildLessonDocument(lesson, { level = "l3_4", part = "lesson" } = {}) {
  const lv = normalizeLevel(level);
  if (!lv) throw new Error(`invalid level "${level}"`);
  if (!LESSON_PARTS.includes(part)) throw new Error(`unknown part "${part}"`);
  const levels = lv === "all" ? LEVELS : [lv];
  const unit = UNIT_BY_ID.get(lesson.unit_id);
  const has = (p) => part === "lesson" || part === p;
  const sections = [
    ...(has("teacher") ? [teacherSection(lesson, unit)] : []),
    ...(has("student") ? levels.flatMap((l) => studentSections(lesson, l)) : []),
    ...(has("newcomer") ? newcomerSections(lesson) : []),
    ...(has("exit") ? [exitSection(lesson, levels)] : []),
    ...(has("key") ? [keySection(lesson)] : []),
  ];
  sections[0].pageBreakBefore = false;
  return {
    title: lesson.title,
    subtitle: unit ? `${gradeLabel(unit)} ${unit.subject} · ${unit.unit_title}` : "",
    unitTitle: lesson.title,
    early: false,
    dense: false,
    bodyClass: "lesson",
    level: lv,
    answerKey: false,
    partLabel: "Lesson Companion",
    sections,
  };
}

const FOOT = `<div class="pfoot">${DISCLAIMER}</div>`;

export function renderLessonHtml(lesson, options = {}) {
  const html = renderDocumentHtml(buildLessonDocument(lesson, options))
    .replace(/<\/section>/g, `${FOOT}</section>`)
    .replace("</head>", `<style>${lessonCss(DISCLAIMER)}</style>\n</head>`);
  return html;
}

export function lessonFilename(lesson, { level = "l3_4", part = "lesson" } = {}, ext = "html") {
  const lv = normalizeLevel(level) || "l3_4";
  const levelTag = lv === "all" ? "all-levels" : `WIDA-${lv.slice(1).replace("_", "-")}`;
  const partTag = part === "lesson" ? "" : `-${part}`;
  return `BCPSS-${lesson.id}-${levelTag}${partTag}.${ext}`;
}
