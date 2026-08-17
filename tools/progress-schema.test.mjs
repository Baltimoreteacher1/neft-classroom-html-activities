#!/usr/bin/env node
/* =============================================================================
 * progress-schema.test.mjs — lazy ALTER and formal migrations name the same columns.
 * -----------------------------------------------------------------------------
 * Two mechanisms evolve student_progress:
 *   migrations/0001 + 0007, and ensureSchema / ensureStudentLinkColumns in the
 *   progress API. They must not diverge. Admin columns and telemetry are
 *   runtime-only by design and must NOT appear in 0001/0007 (adding them there
 *   is a production-migration decision).
 * ============================================================================= */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  ADMIN_COLUMNS,
  STUDENT_LINK_COLUMNS,
  STUDENT_PROGRESS_BASE_COLUMNS,
  STUDENT_PROGRESS_TABLE,
  TELEMETRY_TABLE,
} from "../functions/_lib/progress-schema.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const m0001 = readFileSync(join(ROOT, "migrations/0001_student_progress.sql"), "utf8");
const m0007 = readFileSync(join(ROOT, "migrations/0007_progress_student_link.sql"), "utf8");
const api = readFileSync(join(ROOT, "functions/api/progress/[[path]].js"), "utf8");

test("the progress API imports the shared column lists", () => {
  assert.match(api, /from ["']\.\.\/\.\.\/_lib\/progress-schema\.js["']/);
  assert.match(api, /STUDENT_LINK_COLUMNS/);
});

test("0001 names every base column the runtime CREATE TABLE uses", () => {
  assert.match(m0001, new RegExp(`CREATE TABLE IF NOT EXISTS ${STUDENT_PROGRESS_TABLE}`));
  for (const col of STUDENT_PROGRESS_BASE_COLUMNS) {
    assert.match(m0001, new RegExp(`\\b${col}\\b`), `0001 is missing ${col}`);
  }
});

test("0007 names every student-link column the lazy ALTER adds", () => {
  for (const col of STUDENT_LINK_COLUMNS) {
    assert.match(
      m0007,
      new RegExp(`ADD COLUMN ${col}\\b`),
      `0007 is missing ALTER for ${col} — lazy path and migration would diverge`,
    );
  }
});

test("admin columns are runtime-only — not smuggled into 0001/0007", () => {
  for (const col of ADMIN_COLUMNS) {
    assert.doesNotMatch(m0001, new RegExp(`\\b${col}\\b`));
    assert.doesNotMatch(m0007, new RegExp(`\\b${col}\\b`));
  }
});

test("telemetry is runtime-only", () => {
  assert.doesNotMatch(m0001, new RegExp(`\\b${TELEMETRY_TABLE}\\b`));
  assert.doesNotMatch(m0007, new RegExp(`\\b${TELEMETRY_TABLE}\\b`));
  assert.match(api, /ensureTelemetrySchema/);
});
