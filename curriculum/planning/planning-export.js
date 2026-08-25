/* planning-export.js — editable exports of the LIVE plan.
 *
 * The August baseline already shipped as a printed DOCX and an XLSX workbook.
 * Those were built once, offline, from plan.json. Everything here rebuilds the
 * same two documents from the plan AS IT STANDS NOW, in the browser, so an
 * export taken in March reflects March's pacing rather than August's.
 *
 * NOTHING IS AN IMAGE. Both formats are native: real Word tables, headings and
 * paragraphs; real Excel cells, real dates, real column headers. Every value in
 * both is editable in the app that opens it. That was the strongest property of
 * the original documents and it is the one worth preserving exactly.
 *
 * DOCX reuses the docx UMD build already vendored for the lesson-plan generator
 * — one 1.1 MB library on this site, loaded on the first export click, not a
 * second copy. XLSX is written by hand over assets/lib/zip-store.js, the same
 * zero-dependency writer the SCORM packages and the bulk downloader use.
 */

import { pacingWorkbook } from "/shared/pacing/xlsx.js";
import { zipStore } from "/assets/lib/zip-store.js";
import { detailFor, titleFor } from "./planning-resources.js";
import { longDate, rangeDate, shortDate, statusWord, weekStart } from "./planning-views.js";

const DOCX_LIB = "/teacher-tools/lesson-plan-generator/vendor/docx.umd.js";
let libPromise = null;

function ensureDocx() {
  if (typeof window.docx !== "undefined") return Promise.resolve(window.docx);
  if (!libPromise) {
    libPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = DOCX_LIB;
      s.onload = () => resolve(window.docx);
      s.onerror = () => {
        libPromise = null;
        reject(
          new Error(
            "The Word export library could not load. Check your connection and try again, or use Print.",
          ),
        );
      };
      document.head.appendChild(s);
    });
  }
  return libPromise;
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const shifted = (d) =>
  d.plan.dayType !== d.original.dayType || d.plan.lessonId !== d.original.lessonId;

/* ── DOCX ──────────────────────────────────────────────────────────────────── */

export async function buildDocx(days, index, baseline) {
  const d = await ensureDocx();
  const {
    AlignmentType,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = d;

  const P = (text, opts = {}) =>
    new Paragraph({ children: [new TextRun({ text: String(text ?? ""), ...opts.run })], ...opts });
  const H = (text, level) => new Paragraph({ text, heading: level });

  /* cantSplit on every row and a repeating header: the print QA on the original
   * document found calendar rows breaking across pages, and these two settings
   * are what fixed it. */
  const cell = (text, opts = {}) =>
    new TableCell({
      children: Array.isArray(text) ? text : [P(text, opts)],
      shading: opts.shading ? { fill: opts.shading } : undefined,
      width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    });

  const table = (headers, rows, widths) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          cantSplit: true,
          children: headers.map((h, i) =>
            cell(h, { shading: "EEF2F6", width: widths?.[i], run: { bold: true } }),
          ),
        }),
        ...rows.map(
          (r) =>
            new TableRow({
              cantSplit: true,
              children: r.map((c, i) => cell(c, { width: widths?.[i] })),
            }),
        ),
      ],
    });

  const children = [];

  /* 1 — Year at a Glance */
  children.push(H("SY 2026–27 Grade 6 Math — Pacing Calendar", HeadingLevel.HEADING_1));
  children.push(
    P(`Exported ${new Date().toLocaleString()} from the live pacing planner.`, {
      alignment: AlignmentType.LEFT,
    }),
  );
  children.push(H("1. Year at a Glance", HeadingLevel.HEADING_2));
  children.push(
    table(
      ["Unit", "Quarter", "Dates", "Days", "Lessons", "Assessment", "Project", "Flex"],
      baseline.units
        .map((u) => {
          const mine = days.filter((x) => x.plan.unitKey === u.key && x.schoolStatus === "school");
          if (!mine.length) return null;
          const count = (t) => mine.filter((x) => x.plan.dayType === t).length;
          return [
            u.districtLabel,
            mine[0].quarter,
            `${rangeDate(mine[0].date)} – ${rangeDate(mine[mine.length - 1].date)}`,
            String(mine.length),
            String(count("Core Lesson")),
            String(count("Assessment")),
            String(count("Project")),
            String(count("Flex") + count("Catch-Up")),
          ];
        })
        .filter(Boolean),
    ),
  );

  /* 2 — Monthly calendars */
  children.push(H("2. Monthly Calendars", HeadingLevel.HEADING_2));
  for (const [key, monthDays] of groupByMonth(days)) {
    children.push(H(key, HeadingLevel.HEADING_3));
    children.push(
      table(
        ["Date", "School status", "Unit", "Lesson", "Planned", "Actual"],
        monthDays.map((day) => [
          shortDate(day.date),
          day.statusLabel + (day.calendarNote ? ` — ${day.calendarNote}` : ""),
          day.schoolStatus === "school" ? unitLabelFor(baseline, day) : "",
          day.plan.lessonId || "",
          day.schoolStatus === "school" ? titleFor(index, day) : "",
          day.schoolStatus === "school" ? statusWord(day) : "",
        ]),
        [10, 22, 18, 10, 27, 13],
      ),
    );
  }

  /* 3 — Weekly planning pages, with the two columns left deliberately empty */
  children.push(H("3. Weekly Planning", HeadingLevel.HEADING_2));
  for (const [monday, week] of groupByWeek(days)) {
    children.push(H(`Week of ${longDate(monday)}`, HeadingLevel.HEADING_3));
    children.push(
      table(
        ["Day", "Lesson", "Standard", "Objective", "Small group / differentiation", "Notes"],
        week.map((day) => {
          const detail = detailFor(index, day);
          return [
            shortDate(day.date),
            day.schoolStatus === "school" ? titleFor(index, day) : day.statusLabel,
            detail?.standard || "",
            detail?.objective || "",
            "",
            day.note || "",
          ];
        }),
        [8, 22, 12, 28, 18, 12],
      ),
    );
  }

  /* 4 — Unit pacing */
  children.push(H("4. Unit Pacing", HeadingLevel.HEADING_2));
  for (const u of baseline.units) {
    const mine = days.filter((x) => x.plan.unitKey === u.key && x.schoolStatus === "school");
    if (!mine.length) continue;
    children.push(H(u.districtLabel, HeadingLevel.HEADING_3));
    children.push(
      P(
        `Scope and sequence budget ${u.budgetDays} days · scheduled ${mine.length} days · ${rangeDate(mine[0].date)} to ${rangeDate(mine[mine.length - 1].date)}`,
      ),
    );
    children.push(
      table(
        ["Date", "Day type", "Lesson", "Title", "Recorded"],
        mine.map((day) => [
          shortDate(day.date),
          day.plan.dayType,
          day.plan.lessonId || "",
          titleFor(index, day),
          statusWord(day),
        ]),
        [12, 18, 12, 40, 18],
      ),
    );
  }

  /* 5 — Adjustment log: every day whose plan no longer matches the baseline */
  children.push(H("5. Adjustment Log", HeadingLevel.HEADING_2));
  const moved = days.filter(shifted);
  if (!moved.length) {
    children.push(P("No pacing adjustments have been made yet."));
  } else {
    children.push(
      table(
        ["Date", "Original plan", "Current plan", "Recorded", "Note"],
        moved.map((day) => [
          shortDate(day.date),
          `${day.original.dayType}${day.original.lessonId ? ` · ${day.original.lessonId}` : ""}`,
          `${day.plan.dayType}${day.plan.lessonId ? ` · ${day.plan.lessonId}` : ""}`,
          statusWord(day),
          day.note || "",
        ]),
        [12, 24, 24, 18, 22],
      ),
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: "landscape" },
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  download(
    blob,
    `SY26-27 Grade 6 Math Planning Calendar — ${new Date().toISOString().slice(0, 10)}.docx`,
  );
}

function unitLabelFor(baseline, day) {
  const u = baseline.units.find((x) => x.key === day.plan.unitKey);
  return u ? u.districtLabel : "";
}

function groupByMonth(days) {
  const map = new Map();
  for (const d of days) {
    const key = new Date(`${d.date}T12:00:00Z`).toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "long",
      year: "numeric",
    });
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(d);
  }
  return map;
}

function groupByWeek(days) {
  const map = new Map();
  for (const d of days) {
    const key = weekStart(d.date);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(d);
  }
  return map;
}

/* ── XLSX ──────────────────────────────────────────────────────────────────────
 * The workbook itself is built by shared/pacing/xlsx.js, which is pure and
 * therefore covered by npm test. This wrapper supplies the four labelling
 * functions the screen already uses — so the sheet and the page can never
 * disagree about what a day is called — then zips and saves. */

export async function buildXlsx(days, index, baseline) {
  const ctx = {
    title: (day) => titleFor(index, day),
    statusWord,
    detail: (day) => detailFor(index, day),
    unitLabel: (day) => unitLabelFor(baseline, day),
  };
  const bytes = zipStore(pacingWorkbook(days, baseline.units, ctx));
  download(
    new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `SY26-27 Grade 6 Math Pacing Map — ${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}
