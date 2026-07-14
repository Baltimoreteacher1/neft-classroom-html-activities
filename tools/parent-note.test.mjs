#!/usr/bin/env node
// Assertions for the parent-note builder (scripts/lib/parent-note.mjs).

import assert from "node:assert/strict";
import { bandInfo, buildDocument, buildNoteHTML, buildWeeklyDigest, familyHomeworkFor, summarizeGrades } from "../scripts/lib/parent-note.mjs";

// Band thresholds match engine/core/grade.js
assert.equal(bandInfo(90).band, "Strong");
assert.equal(bandInfo(85).band, "Strong");
assert.equal(bandInfo(70).band, "Likely Ready");
assert.equal(bandInfo(60).band, "Approaching");
assert.equal(bandInfo(59).band, "Needs Practice");
assert.equal(bandInfo(null).band, "Getting Started");

const grades = {
  activities: ["Ratios Quiz", "GCF Practice", "Decimals Lab"],
  rows: [
    ["Ava Martinez", "601", 92, 88, 95, "92"],
    ["Diego Lopez", "601", 55, 60, 48, "54"],
    ["Sofia Chen", "602", "", "", "", ""],
  ],
};
const sums = summarizeGrades(grades);
assert.equal(sums.length, 3);

const ava = sums[0];
assert.equal(ava.average, 92);
assert.equal(ava.strengths.length, 3, "Ava strong in all three");
assert.equal(ava.practice.length, 0);

const diego = sums[1];
assert.equal(diego.practice.length, 3, "Diego needs practice in all three");
assert.equal(diego.strengths.length, 0);

const sofia = sums[2];
assert.equal(sofia.average, null, "no scored work → null average");
assert.equal(sofia.completed, 0);

// Note HTML is bilingual and escapes content
const html = buildNoteHTML(diego, { date: "2026-09-08" });
assert.ok(html.includes("🇺🇸 English") && html.includes("🇲🇽 Español"), "both languages present");
assert.ok(html.includes("Practiquemos en casa"), "Spanish practice heading");
assert.ok(html.includes("Diego"), "student first name used");

// XSS safety: a malicious activity title must be escaped, not rendered as a tag
const evil = summarizeGrades({ activities: ["<img src=x onerror=alert(1)>"], rows: [["Kid", "601", 40, "40"]] });
const evilHtml = buildNoteHTML(evil[0]);
assert.ok(!evilHtml.includes("<img src=x"), "activity title is escaped");
assert.ok(evilHtml.includes("&lt;img"), "escaped form present");

// Document wraps notes
const doc = buildDocument([html], { title: "Family Updates", date: "2026-09-08" });
assert.ok(doc.startsWith("<!doctype html>"), "full document");
assert.ok(doc.includes("keep private"), "PII warning present");

// ---- weekly digest ----
const student = {
  studentName: "Maria Gonzalez",
  section: "601",
  activities: [
    { activityId: "4-2", activityTitle: "Dividing Fractions", progressPercent: 100, scorePct: 55 },
    { activityId: "4-1", activityTitle: "Multiply Fractions", progressPercent: 80, scorePct: 92 },
  ],
  telemetryCounts: { "family-checkin": 2, misconception: 1 },
  masteryReached: ["6.AT.1"],
};
const hwMap = { "4-2": { text: "🏠 Family Homework", href: "/lessons/4-2/homework.html" } };
const dig = buildWeeklyDigest(student, { date: "2026-07-14", homeworkMap: hwMap });
assert.ok(dig.includes("🇺🇸 English") && dig.includes("🇲🇽 Español"), "digest bilingual");
assert.ok(dig.includes("Maria's week in math"), "first-name headline");
assert.ok(dig.includes("Dividing Fractions"), "activities listed");
assert.ok(dig.includes("6.AT.1"), "mastery listed");
assert.ok(dig.includes("walk you through one problem"), "ask targets weakest (<70)");
assert.ok(dig.includes("/lessons/4-2/homework.html"), "5-minute activity links weakest lesson homework");
assert.ok(dig.includes("Family practice logged ✅ 2×"), "check-in count shown");

// no activity → encouraging empty states, no checkin/hw blocks
const quiet = buildWeeklyDigest({ studentName: "Sam Lee", section: "602", activities: [], telemetryCounts: {}, masteryReached: [] });
assert.ok(quiet.includes("fresh week starts now"), "empty-week EN copy");
assert.ok(!quiet.includes("Family practice logged"), "no check-in row when zero");

// XSS: activity title escaped in digest
const evil2 = buildWeeklyDigest({ studentName: "Kid", section: "601", activities: [{ activityId: "x", activityTitle: "<img src=x onerror=alert(1)>", scorePct: 40, progressPercent: 10 }], telemetryCounts: {}, masteryReached: [] });
assert.ok(!evil2.includes("<img src=x"), "digest escapes titles");

// familyHomeworkFor fallbacks
assert.equal(familyHomeworkFor("lessons-4-2", hwMap).href, "/lessons/4-2/homework.html");
assert.equal(familyHomeworkFor("nope", hwMap), null);

console.log("parent-note.test.mjs: all assertions passed ✓");
