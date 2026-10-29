#!/usr/bin/env node
/**
 * Weekly Family Practice Sheet: weeks.json + one printable PDF per week and language.
 *
 *   node scripts/generate-weekly-sheets.mjs             # weeks.json, then the PDFs
 *   node scripts/generate-weekly-sheets.mjs --data-only # weeks.json only (no browser)
 *
 * The schedule is the Live Pacing Planner's baseline, turned into Mon-Fri weeks by
 * curriculum/family-connections/shared/pacing-week.js (the same code Family Connections
 * publishes from), so the sheet cannot disagree with the weekly overview.
 *
 * Output in curriculum/family-connections/weekly-sheet/:
 *   weeks.json                       what the digital page reads
 *   downloads/week-<start>[-es].pdf  one Letter page per week
 *   downloads/all-weeks[-es].pdf     the whole year, one page per week
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildWeekFromPacing,
  pacingWeekStarts,
} from "../curriculum/family-connections/shared/pacing-week.js";
import {
  COPY,
  LANGS,
  renderSheet,
} from "../curriculum/family-connections/weekly-sheet/sheet-render.js";
import { skipExit } from "../tools/lib/skip-exit.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "curriculum/family-connections/weekly-sheet");
const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), "utf8"));

/** Bonus rule: this many practice nights earns it (fewer when the week has fewer nights). */
const BONUS_NIGHTS = 3;
const SHEET_CSS = readFileSync(join(OUT, "sheet.css"), "utf8");

const baseline = readJson("data/pacing-baseline-2026-27.json");
const titlesEs = readJson("data/family-homework-titles-es.json");
const familyIds = readdirSync(join(ROOT, "families/lessons"));

const titleEn = (id) => readJson(`lessons/${id}/config.json`).title;
const label = (id) => id.replace(/-flagship$/, "").replace("-", ".");

export function buildWeeks() {
  const weeks = [];
  for (const { startDate } of pacingWeekStarts(baseline.days)) {
    const built = buildWeekFromPacing(baseline.days, startDate, familyIds);
    const days = built.days.map((entry, index) => {
      const date = new Date(`${startDate}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() + index);
      const iso = date.toISOString().slice(0, 10);
      const day = {
        date: iso,
        status: entry.status,
        note: { en: entry.note, es: entry.noteEs },
      };
      if (entry.status === "lesson") {
        Object.assign(day, {
          lessonId: entry.lessonId,
          label: label(entry.lessonId),
          title: { en: titleEn(entry.lessonId), es: titlesEs[entry.lessonId] ?? "" },
          url: `/families/lessons/${entry.lessonId}/`,
        });
      }
      return day;
    });
    const schoolDays = days.filter((day) => day.status !== "no-class");
    if (!schoolDays.length) continue;
    /* The last school day is the turn-in day; every school day before it is a practice night.
     * A one-day week has nothing before it, so that day is the night. */
    const nights = (schoolDays.length > 1 ? schoolDays.slice(0, -1) : schoolDays).map(
      (d) => d.date,
    );
    weeks.push({
      start: startDate,
      days,
      nights,
      turnIn: schoolDays[schoolDays.length - 1].date,
      goal: Math.min(BONUS_NIGHTS, nights.length),
    });
  }
  return weeks;
}

const weeks = buildWeeks();
mkdirSync(join(OUT, "downloads"), { recursive: true });
writeFileSync(
  join(OUT, "weeks.json"),
  `${JSON.stringify({ schoolYear: baseline.schoolYear, bonusNights: BONUS_NIGHTS, weeks }, null, 1)}\n`,
);
console.log(`weekly-sheet: ${weeks.length} weeks -> weeks.json`);
if (process.argv.includes("--data-only")) process.exit(0);

const document = (body, lang) =>
  `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${COPY[lang].title}</title><style>${SHEET_CSS}</style></head><body class="ws-print">${body}</body></html>`;

const { chromium } = await import("@playwright/test");
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  process.exit(
    skipExit(
      "no Chromium for Playwright",
      `install it (npx playwright install chromium) to build the PDFs: ${error.message.split("\n")[0]}`,
    ),
  );
}
const page = await browser.newPage();
const pdf = async (html, file) => {
  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({
    path: join(OUT, "downloads", file),
    format: "Letter",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });
};
for (const lang of LANGS) {
  const suffix = lang === "es" ? "-es" : "";
  for (const week of weeks)
    await pdf(document(renderSheet(week, lang), lang), `week-${week.start}${suffix}.pdf`);
  await pdf(
    document(weeks.map((week) => renderSheet(week, lang)).join(""), lang),
    `all-weeks${suffix}.pdf`,
  );
}
await browser.close();
console.log(`weekly-sheet: ${weeks.length * 2 + 2} PDFs -> downloads/`);
