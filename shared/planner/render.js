// One document model for every export (HTML, PDF source, DOCX, plain text) plus the .ics calendar. Pure.
// The model is the single source of the printed words: renderers only lay it out, and the export tests compare
// each renderer's text against docStrings(model).
import { BAND_KEYS, BAND_LABELS, SOURCE_LABELS } from "./constants.js";
import { PlannerError } from "./errors.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function dateLabel(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

const minutesWord = (n) => `${n} ${n === 1 ? "minute" : "minutes"}`;
const itemWord = (n) => `${n} ${n === 1 ? "item" : "items"}`;

/**
 * -> { title, blocks }. Block kinds: h1, h2, p, head {cells}, row {cells}.
 * Student-facing text: none. Band names appear here because this is a teacher planning sheet.
 */
export function planDoc(plan) {
  const { params, unit, summary } = plan;
  const bands = BAND_KEYS.filter((k) => params.bands[k] > 0)
    .map((k) => `${BAND_LABELS[k]}: ${params.bands[k]}`)
    .join(", ");
  const blocks = [
    { t: "h1", text: `My Week: ${unit?.title || params.unit}` },
    {
      t: "p",
      text: `${[unit?.grade ? `Grade ${unit.grade}` : "", unit?.subject || ""].filter(Boolean).join(" ")}. Groups: ${bands}. Block: ${minutesWord(params.block)}. Days: ${params.days}.`,
    },
    {
      t: "p",
      text: `Planned ${summary.plannedMinutes} of ${summary.capacity} minutes. Median ${summary.medianDayMinutes} minutes a day. Dropped ${itemWord(plan.dropped.length)}.`,
    },
    { t: "p", text: `Materials: ${plan.materials}` },
  ];
  for (const d of plan.days) {
    const when = d.date ? ` ${dateLabel(d.date)}` : "";
    blocks.push({ t: "h2", text: `Day ${d.day}${when}: ${d.minutes} of ${d.cap} minutes` });
    if (!d.items.length) {
      blocks.push({ t: "p", text: "Nothing fits this day." });
      continue;
    }
    blocks.push({ t: "head", cells: ["Minutes", "Activity", "Type"] });
    for (const it of d.items) {
      blocks.push({
        t: "row",
        cells: [String(it.minutes), it.title, `${SOURCE_LABELS[it.source]}, ${it.domain}`],
      });
    }
  }
  blocks.push({
    t: "h2",
    text: `Dropped: ${itemWord(plan.dropped.length)}, ${minutesWord(summary.droppedMinutes)}`,
  });
  if (!plan.dropped.length) blocks.push({ t: "p", text: "Nothing was dropped." });
  else {
    blocks.push({ t: "head", cells: ["Minutes", "Activity", "Why it was dropped"] });
    for (const it of plan.dropped)
      blocks.push({ t: "row", cells: [String(it.minutes), it.title, it.reason] });
  }
  blocks.push({ t: "p", text: plan.note });
  return { title: `My Week ${params.unit}`, blocks };
}

/** Every text string of the model in reading order (what any renderer must print, nothing more). */
export const docStrings = (doc) => doc.blocks.flatMap((b) => (b.cells ? b.cells : [b.text]));

export const planText = (plan) =>
  planDoc(plan)
    .blocks.map((b) => (b.cells ? b.cells.join(" | ") : b.text))
    .join("\n");

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Tight print sheet: Letter, 0.6in margins, navy + teal accents, grayscale-legible, no forced page breaks.
export const PRINT_CSS = `@page{size:letter;margin:.6in}
*{box-sizing:border-box}
body{margin:0;color:#1f2933;font:10pt/1.25 "Atkinson Hyperlegible","Segoe UI",Helvetica,Arial,sans-serif}
h1{margin:0 0 3pt;font-size:16pt;color:#1b365d}
h2{margin:7pt 0 2pt;padding-bottom:1pt;border-bottom:1.25pt solid #0f766e;font-size:11pt;color:#1b365d}
p{margin:0 0 2pt}
table{width:100%;border-collapse:collapse;margin:0 0 2pt}
th,td{padding:1.5pt 4pt;border-bottom:.5pt solid #9aa5b1;text-align:left;vertical-align:top}
th{font-size:8.5pt;color:#1b365d;border-bottom:.75pt solid #1b365d}
td:first-child,th:first-child{width:.7in}`;

export function planHtml(plan) {
  const doc = planDoc(plan);
  const out = [];
  let open = false;
  const close = () => {
    if (open) out.push("</tbody></table>");
    open = false;
  };
  for (const b of doc.blocks) {
    if (b.t === "head") {
      close();
      out.push(
        `<table><thead><tr>${b.cells.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead><tbody>`,
      );
      open = true;
    } else if (b.t === "row") {
      out.push(`<tr>${b.cells.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`);
    } else {
      close();
      out.push(`<${b.t}>${esc(b.text)}</${b.t}>`);
    }
  }
  close();
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(doc.title)}</title><style>${PRINT_CSS}</style></head><body>${out.join("\n")}</body></html>`;
}

// ---- .ics ---------------------------------------------------------------------------------------------------
const icsText = (s) =>
  String(s)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

/** RFC 5545 line folding at 75 octets (UTF-8 aware: never splits a character). */
function fold(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts = [];
  let cur = "";
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > limit) {
      parts.push(cur);
      cur = "";
      bytes = 0;
      limit = 74;
    }
    cur += ch;
    bytes += n;
  }
  parts.push(cur);
  return parts.join("\r\n ");
}

const compact = (iso) => iso.replaceAll("-", "");
const nextIso = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

/** One all-day event per planned day. Deterministic (no clock): DTSTAMP is midnight UTC of the event date. */
export function planIcs(plan) {
  if (plan.days.some((d) => !d.date))
    throw new PlannerError("the calendar export needs a start date");
  const { params, unit } = plan;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Language Page//My Week//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const d of plan.days) {
    const body = d.items.map((it) => `${it.minutes} min: ${it.title}`).join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${params.unit}-s${params.seed}-d${d.day}-${compact(d.date)}@my-week.language-page`,
      `DTSTAMP:${compact(d.date)}T000000Z`,
      `DTSTART;VALUE=DATE:${compact(d.date)}`,
      `DTEND;VALUE=DATE:${compact(nextIso(d.date))}`,
      `SUMMARY:${icsText(`My Week day ${d.day}: ${unit?.title || params.unit} (${d.minutes} min)`)}`,
      `DESCRIPTION:${icsText(`${body}\n${plan.materials}`)}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
}
