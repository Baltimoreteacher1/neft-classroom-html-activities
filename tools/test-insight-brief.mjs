#!/usr/bin/env node
/**
 * Unit tests for teacher-tools/insight-brief/insight-engine.js.
 * Pure-node (no DOM): feeds fixture payloads shaped exactly like the live
 * /api/progress responses and asserts tiers, priorities, groups, and links.
 * Run: node tools/test-insight-brief.mjs
 */
await import("../teacher-tools/insight-brief/insight-engine.js");
const engine = globalThis.NTInsightEngine;

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) {
    pass += 1;
  } else {
    fail += 1;
    console.error("FAIL:", label);
  }
}

const lessons = [
  { id: "1.1", title: "Prime Factorization", unit: "Unit 1 - Number Sense", standard: "6.NOS.4" },
  { id: "3.2", title: "Unit Rates", unit: "Unit 3 - Ratios", standard: "6.RP.2" },
  { id: "5.4", title: "Area of Triangles", unit: "Unit 5 - Geometry: Area", standard: "6.GM.1" },
];

const digest = {
  ok: true,
  students: [
    {
      studentName: "Ana",
      section: "601",
      activities: [
        { activityId: "l-3-2", activityTitle: "Unit Rates", progressPercent: 40, scorePct: 45 },
        {
          activityId: "l-1-1",
          activityTitle: "Prime Factorization",
          progressPercent: 100,
          scorePct: 55,
        },
      ],
      telemetryCounts: { struggle: 3, misconception: 2 },
      masteryReached: [],
    },
    {
      studentName: "Ben",
      section: "601",
      activities: [
        { activityId: "l-3-2", activityTitle: "Unit Rates", progressPercent: 100, scorePct: 96 },
      ],
      telemetryCounts: { mastery: 2 },
      masteryReached: ["6.RP.2"],
    },
    {
      studentName: "Cy",
      section: "602",
      activities: [
        {
          activityId: "l-5-4",
          activityTitle: "Area of Triangles",
          progressPercent: 80,
          scorePct: 78,
        },
      ],
      telemetryCounts: {},
      masteryReached: [],
    },
  ],
};

const rollup = {
  ok: true,
  sections: [
    {
      section: "601",
      standards: [
        {
          standard: "6.RP.2",
          attempts: 10,
          correctRate: 0.4,
          masteryCount: 1,
          struggleCount: 4,
          misconceptionCount: 3,
          topMisconceptions: [{ tag: "unit-rate-flip", count: 3 }],
        },
      ],
    },
    {
      section: "602",
      standards: [
        {
          standard: "6.GM.1",
          attempts: 6,
          correctRate: 0.85,
          masteryCount: 3,
          struggleCount: 0,
          misconceptionCount: 0,
          topMisconceptions: [],
        },
      ],
    },
  ],
};

const struggles = {
  ok: true,
  rows: [
    {
      at: "2026-07-15T13:00:00Z",
      signal: "struggle",
      studentName: "Ana",
      section: "601",
      standard: "6.RP.2",
      tag: "unit-rate-flip",
      source: "lesson",
    },
    {
      at: "2026-07-15T13:05:00Z",
      signal: "low-score",
      studentName: "Ana",
      section: "601",
      standard: "6.RP.2",
      tag: "",
      attempts: 3,
      correctRate: 0.33,
      source: "game",
    },
  ],
};

const grades = {
  ok: true,
  activities: ["Unit Rates"],
  headers: ["Student Name", "Class", "Unit Rates", "Average"],
  rows: [
    ["Ana", "601", 45, 50],
    ["Ben", "601", 96, 96],
    ["Dia", "603", "", 88],
  ],
};

const brief = engine.buildBrief({
  digest,
  rollup,
  struggles,
  grades,
  lessons,
  windowDays: 7,
  now: "2026-07-15T14:00:00Z",
});

// Tiers
const ana = brief.students.find((s) => s.name === "Ana");
const ben = brief.students.find((s) => s.name === "Ben");
const cy = brief.students.find((s) => s.name === "Cy");
ok(ana && ana.tier === "support", "Ana (struggles + misconceptions + low avg) is support tier");
ok(ana.weakStandards[0] === "6.RP.2", "Ana weakest standard is 6.RP.2");
ok(ben && ben.tier === "enrichment", "Ben (96 avg, mastery, no struggles) is enrichment tier");
ok(cy && cy.tier === "on-track", "Cy is on-track");
ok(
  brief.tiers.support.includes("Ana") && brief.tiers.enrichment.includes("Ben"),
  "tier lists populated",
);

// Grades-only student joins via pivot average
const dia = brief.students.find((s) => s.name === "Dia");
ok(dia && dia.avgScore === 88, "grades-pivot-only student (Dia) carried in with average");

// Standards ranking + links
ok(brief.standards[0].standard === "6.RP.2", "6.RP.2 ranks as top need");
ok(brief.standards[0].topTag === "unit-rate-flip", "top misconception tag surfaced");
const links = brief.standards[0].links.map((l) => l.href).join(" ");
ok(
  links.includes("/teacher-tools/lesson-plan-generator/?standard=6.RP.2"),
  "planner deep link present",
);
ok(links.includes("autogen=1"), "planner link autogenerates");
ok(links.includes("/lessons/3-4-catchup/"), "lesson 3.2 maps to 3-3 catch-up band");
ok(links.includes("/math/games/practice-arcade/?lesson=3-2"), "arcade link uses dashed id");
ok(links.includes("/lessons/3-3/"), "lesson link present");

// Idea cites the misconception
ok(brief.standards[0].idea.includes("unit-rate-flip"), "reteach idea names the misconception tag");

// Priorities
ok(
  brief.priorities.some((p) => p.kind === "reteach" && p.title.includes("6.RP.2")),
  "reteach priority for 6.RP.2",
);
ok(
  brief.priorities.some((p) => p.kind === "checkin" && p.title.includes("Ana")),
  "check-in priority names Ana",
);
ok(
  brief.priorities.some((p) => p.kind === "celebrate" && p.title.includes("Ben")),
  "celebrate priority names Ben",
);

// Groups
const g = brief.groups.find((x) => x.section === "601");
ok(g && g.students.includes("Ana") && g.standard === "6.RP.2", "Ana grouped on 6.RP.2");
ok(g && g.students.length <= 5, "group capped at 5");

// Headline + summary
ok(brief.headline.activeStudents === 4, "headline counts 4 active students");
ok(brief.headline.struggleSignals >= 4, "headline aggregates struggle signals");
ok(
  brief.summaryText.includes("INSIGHT BRIEF") && brief.summaryText.includes("PLAN 601"),
  "summary text renders",
);

// Section filter
const only601 = engine.buildBrief({ digest, rollup, struggles, grades, lessons, section: "601" });
ok(
  only601.students.every((s) => s.section === "601"),
  "section filter drops other classes",
);

// Empty inputs degrade gracefully
const empty = engine.buildBrief({});
ok(
  empty.students.length === 0 && empty.priorities.length === 0,
  "empty inputs -> empty brief, no throw",
);

// Catch-up band edges
ok(engine.catchupPath("1.1") === "/lessons/6-12-catchup/", "1.1 -> 1-3 band");
ok(engine.catchupPath("1.5") === "/lessons/2-7-catchup/", "1.5 -> 1-7 band");
ok(
  engine.catchupPath("2.9") === "/lessons/6-11-catchup/",
  "beyond last boundary falls back to last band",
);

console.log(`insight-brief tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
