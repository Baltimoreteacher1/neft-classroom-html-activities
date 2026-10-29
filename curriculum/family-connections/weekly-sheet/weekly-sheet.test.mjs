/* Weekly Family Practice Sheet: weeks.json is a faithful, linkable, printable view of the pacing plan. */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { COPY, LANGS, renderSheet, weekRange } from "./sheet-render.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../../..");
const { weeks, bonusNights } = JSON.parse(readFileSync(join(HERE, "weeks.json"), "utf8"));
const baseline = JSON.parse(readFileSync(join(ROOT, "data/pacing-baseline-2026-27.json"), "utf8"));
const schoolDates = new Set(baseline.days.filter((d) => d.schoolStatus === "school").map((d) => d.date));

test("every night is a real school day, the turn-in day is not a night, and the goal is reachable", () => {
  for (const week of weeks) {
    assert.ok(week.nights.length >= 1, `${week.start} has no practice night`);
    for (const date of week.nights) assert.ok(schoolDates.has(date), `${date} is not a school day`);
    if (week.nights.length < week.days.filter((d) => d.status !== "no-class").length)
      assert.ok(!week.nights.includes(week.turnIn), `${week.start} counts its turn-in day as a night`);
    assert.equal(week.goal, Math.min(bonusNights, week.nights.length));
  }
});

test("every lesson night links a family page that exists and has a Spanish title", () => {
  for (const week of weeks)
    for (const day of week.days.filter((d) => d.status === "lesson")) {
      assert.ok(existsSync(join(ROOT, day.url, "index.html")), `${day.url} has no page`);
      assert.ok(day.title.en && day.title.es, `${day.lessonId} lacks a title in both languages`);
    }
});

test("every week has a PDF in both languages, and the whole-year files exist", () => {
  for (const week of weeks)
    for (const lang of LANGS) {
      const suffix = lang === "es" ? "-es" : "";
      assert.ok(existsSync(join(HERE, "downloads", `week-${week.start}${suffix}.pdf`)), `${week.start} ${lang}`);
    }
  for (const lang of LANGS) assert.ok(existsSync(join(HERE, "downloads", `all-weeks${lang === "es" ? "-es" : ""}.pdf`)));
});

test("English and Spanish copy carry the same keys", () => {
  assert.deepEqual(Object.keys(COPY.en).sort(), Object.keys(COPY.es).sort());
});

test("the sheet renders one checkbox per night, escapes student text, and keeps saved checks", () => {
  const week = weeks.find((w) => w.nights.length === 3);
  const html = renderSheet(week, "en", { name: '"><img src=x>', done: { [week.nights[0]]: true } });
  assert.equal((html.match(/class="ws-check"/g) ?? []).length, week.nights.length);
  assert.equal((html.match(/ checked/g) ?? []).length, 1);
  assert.ok(!html.includes("<img src=x>"));
  assert.match(weekRange(week, "es"), /de \d{4}$/);
});
