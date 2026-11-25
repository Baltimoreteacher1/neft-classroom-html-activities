// Regenerates the SYNTHETIC demo class (demo-class.json) and its golden brief (demo-class.golden.json).
//   node tools/language-page/fixtures/build-demo-class.mjs
// Aliases are Star 1..Star 8: no real student data. Unit snapshots come from the authored unit data, so run this and
// read the diff when a unit's activities or common_language_misconception change on purpose; G-81 fails until you do.
import fs from "node:fs";
import {
  activityItem,
  studioItem,
  toClassAssignment,
  writingItem,
} from "../../../shared/class-platform/bcpss-assignments.js";
import {
  briefText,
  buildDashboard,
  unitSnapshot,
} from "../../../shared/class-platform/week-brief.js";
import { loadDataset } from "../dataset.mjs";

const here = new URL("./", import.meta.url);
const UNITS = ["g6-ela-u1", "g3-sci-u1"];
const data = await loadDataset();
const byId = Object.fromEntries(data.units.map((u) => [u.unit.id, u]));
const units = Object.fromEntries(UNITS.map((id) => [id, unitSnapshot(byId[id])]));
const act = (id, n) => ({ title: units[id].activities[n - 1].title });

const items = [
  studioItem("g6-ela-u1"),
  activityItem("g6-ela-u1", 1, act("g6-ela-u1", 1)),
  activityItem("g6-ela-u1", 3, act("g6-ela-u1", 3)),
  writingItem("g6-ela-u1"),
  activityItem("g3-sci-u1", 2, act("g3-sci-u1", 2)),
  activityItem("g3-sci-u1", 5, act("g3-sci-u1", 5)),
];
const dues = ["2026-11-20", "2026-11-20", "2026-11-27", "2026-11-27", "2026-11-23", "2026-12-04"];
const assignments = items.map((it, i) => toClassAssignment(it, { due: dues[i] }));

// One row per student, one letter per assignment: a assigned, p in progress, s turned in, r reviewed.
const grid = ["rrrrrr", "rsrsrp", "srpaas", "psaapaa", "aaaaaaa", "srrrsr", "rrsaaa", "ssssss"];
const STATE = { a: "assigned", p: "in_progress", s: "submitted", r: "reviewed" };
const summaries = [
  [6, 4, 9, 5, 5],
  [3, 1, 6, 4, 4],
  [2, 2, 5, 1, 3],
  [1, 0, 3, 0, 2],
  [0, 0, 1, 0, 1],
  [5, 3, 7, 6, 5],
  [4, 2, 4, 2, 3],
  [7, 5, 8, 7, 5],
];
const students = summaries.map(([listening, speaking, reading, writing, weekDays], i) => ({
  studentId: `s${String(i + 1).padStart(10, "0")}`,
  alias: `Star ${i + 1}`,
  summary: {
    domains: { listening, speaking, reading, writing },
    weekDays,
    weekEvidence: listening + speaking + reading + writing,
  },
}));
const board = {
  assignments: assignments.map((a, j) => ({
    id: a.id,
    students: students.map((s, i) => ({
      studentId: s.studentId,
      state: STATE[grid[i][j]] || "assigned",
      late: false,
    })),
  })),
};

const fixture = {
  note: "SYNTHETIC demo class: aliases Star 1..Star 8, no real student data. Unit snapshots are unitSnapshot() of the authored unit data.",
  now: Date.parse("2026-11-24T15:00:00Z"),
  settings: { goal: { metric: "evidence", target: 120, label: "practice evidence" }, assignments },
  students,
  board,
  units,
};
const dashboard = buildDashboard(fixture);
const golden = {
  dashboard,
  text: { en: briefText(dashboard, "en"), es: briefText(dashboard, "es") },
};
fs.writeFileSync(new URL("demo-class.json", here), `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(new URL("demo-class.golden.json", here), `${JSON.stringify(golden, null, 2)}\n`);
console.log("wrote demo-class.json and demo-class.golden.json");
