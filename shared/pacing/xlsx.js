/* shared/pacing/xlsx.js — the pacing workbook, as OOXML parts.
 *
 * Pure: strings in, a { path -> text } map out. It never touches the DOM, never
 * zips, and never downloads, so `npm test` can build the whole workbook and
 * assert what is in it. The browser wrapper in curriculum/planning/
 * planning-export.js does the zipping (assets/lib/zip-store.js) and the save.
 *
 * WHY BY HAND rather than a library: the site already carries a zero-dependency
 * stored-ZIP writer for SCORM and the bulk downloader, and an .xlsx is a ZIP of
 * XML. Adding a spreadsheet library to ship five sheets would be a megabyte of
 * new dependency for markup that fits on one screen.
 *
 * REAL DATES, NOT TEXT. Every date cell is an Excel serial with a date format
 * applied. A text date sorts alphabetically, which puts 2027-01-04 before
 * 2026-12-01 and makes the sheet quietly wrong the first time anyone sorts it.
 */

export const xmlEscape = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function colName(i) {
  let n = i + 1;
  let out = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(65 + r) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
export const toSerial = (iso) =>
  Math.round((Date.parse(`${iso}T00:00:00Z`) - EXCEL_EPOCH) / 86400000);

/** `{d: iso}` writes a real date, a number writes a number, else inline text. */
export function cellXml(ref, value) {
  if (value == null || value === "") return "";
  if (typeof value === "object" && value.d)
    return `<c r="${ref}" s="1"><v>${toSerial(value.d)}</v></c>`;
  if (typeof value === "number") return `<c r="${ref}"><v>${value}</v></c>`;
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
}

export function sheetXml(rows) {
  const body = rows
    .map((row, r) => {
      const cells = row.map((v, c) => cellXml(`${colName(c)}${r + 1}`, v)).join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>${body}</sheetData></worksheet>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy\\-mm\\-dd"/></numFmts><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>`;

/** Wrap named sheets into the full set of OOXML parts. */
export function workbookFiles(sheets) {
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join("")}</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
      .map(
        ([name], i) => `<sheet name="${xmlEscape(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
      )
      .join("")}</sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join(
        "",
      )}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    "xl/styles.xml": STYLES,
  };
  sheets.forEach(([, rows], i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = sheetXml(rows);
  });
  return files;
}

/* ── The five sheets ───────────────────────────────────────────────────────────
 * `ctx` supplies the four labelling functions the browser already has, so the
 * workbook and the screen cannot disagree about what a day is called:
 *   title(day)  statusWord(day)  detail(day)  unitLabel(day) */

export function yearPacingRows(days, ctx) {
  const rows = [
    [
      "Date",
      "Day",
      "Week",
      "Quarter",
      "School Status",
      "Half Day",
      "MCAP Window",
      "Unit",
      "Day Type",
      "Lesson ID",
      "Lesson Title",
      "Standard",
      "Objective",
      "Original Day Type",
      "Original Lesson ID",
      "Actual",
      "Locked",
      "Calendar Note",
      "Planning Note",
    ],
  ];
  for (const day of days) {
    const detail = ctx.detail(day);
    const teaching = day.schoolStatus === "school";
    rows.push([
      { d: day.date },
      day.weekday,
      day.week,
      day.quarter,
      day.statusLabel,
      day.earlyRelease ? "Yes" : "",
      day.mcapWindow ? "Yes" : "",
      ctx.unitLabel(day),
      day.plan.dayType,
      day.plan.lessonId || "",
      teaching ? ctx.title(day) : "",
      detail?.standard || "",
      detail?.objective || "",
      day.original.dayType,
      day.original.lessonId || "",
      teaching ? ctx.statusWord(day) : "",
      day.locked ? "Yes" : "",
      day.calendarNote || "",
      day.note || "",
    ]);
  }
  return rows;
}

export function unitSummaryRows(days, units) {
  const rows = [
    [
      "Unit",
      "Sequence",
      "Quarter",
      "Start",
      "End",
      "Scheduled Days",
      "S&S Budget",
      "Lessons",
      "Assessments",
      "Project Days",
      "Flex/Catch-Up",
      "Recorded",
    ],
  ];
  for (const u of units) {
    const mine = days.filter((x) => x.plan.unitKey === u.key && x.schoolStatus === "school");
    if (!mine.length) continue;
    const count = (t) => mine.filter((x) => x.plan.dayType === t).length;
    rows.push([
      u.districtLabel,
      u.sequence,
      mine[0].quarter,
      { d: mine[0].date },
      { d: mine[mine.length - 1].date },
      mine.length,
      u.budgetDays,
      count("Core Lesson"),
      count("Assessment"),
      count("Project"),
      count("Flex") + count("Catch-Up"),
      mine.filter((x) => x.actual).length,
    ]);
  }
  return rows;
}

export function calendarEventRows(days) {
  const rows = [["Date", "Day", "Status", "Event", "Half Day", "Quarter"]];
  for (const day of days) {
    if (day.schoolStatus === "school" && !day.earlyRelease && !day.calendarNote) continue;
    rows.push([
      { d: day.date },
      day.weekday,
      day.statusLabel,
      day.calendarNote || "",
      day.earlyRelease ? "Yes" : "",
      day.quarter,
    ]);
  }
  return rows;
}

export function flexRows(days, ctx) {
  const rows = [["Date", "Day Type", "Unit", "Purpose", "Recorded"]];
  for (const day of days) {
    if (!["Flex", "Catch-Up", "Review", "Lost Day"].includes(day.plan.dayType)) continue;
    rows.push([
      { d: day.date },
      day.plan.dayType,
      ctx.unitLabel(day),
      ctx.title(day),
      ctx.statusWord(day),
    ]);
  }
  return rows;
}

export const planShifted = (d) =>
  d.plan.dayType !== d.original.dayType || d.plan.lessonId !== d.original.lessonId;

export function adjustmentRows(days, ctx) {
  const rows = [
    [
      "Date",
      "Original Day Type",
      "Original Lesson",
      "Current Day Type",
      "Current Lesson",
      "Current Title",
      "Recorded",
      "Note",
    ],
  ];
  for (const day of days) {
    if (!planShifted(day)) continue;
    rows.push([
      { d: day.date },
      day.original.dayType,
      day.original.lessonId || "",
      day.plan.dayType,
      day.plan.lessonId || "",
      ctx.title(day),
      ctx.statusWord(day),
      day.note || "",
    ]);
  }
  return rows;
}

/** The whole workbook: five named sheets in the order a teacher reads them. */
export function pacingWorkbook(days, units, ctx) {
  return workbookFiles([
    ["Year Pacing", yearPacingRows(days, ctx)],
    ["Unit Summary", unitSummaryRows(days, units)],
    ["Calendar Events", calendarEventRows(days)],
    ["Flex Days", flexRows(days, ctx)],
    ["Adjustment Log", adjustmentRows(days, ctx)],
  ]);
}
