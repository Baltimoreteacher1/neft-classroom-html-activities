#!/usr/bin/env node
/**
 * Gate G-30 (exports + route): the "My Week" Word / HTML (PDF source) / .ics exports, the stateless share link and
 * GET /api/bcpss/week-plan.
 *  - DOCX and HTML text equal the plan's document model, string for string, for all 162 units;
 *  - no page breaks anywhere (docx pageBreakBefore / w:br page / sectPr nextPage, html page-break-* / break-before/after);
 *  - margins >= 0.5in; palette stays navy/teal/neutral; paper-and-pencil wording only;
 *  - the share link (query string) regenerates a byte-identical plan; the .ics is well formed and matches the plan dates;
 *  - the route answers every format, refuses bad input with 400, an unknown unit with 404, and cal=1 reads the pacing file.
 * Negative controls run first (a docx with a page break, css with break-before, a text mismatch, a manipulative word
 * must all be caught). Exit 0 pass, 1 findings, 3 broken gate. Run: node tools/planner-export.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BCPSS_UNITS } from "../data/bcpss-curriculum-seed.mjs";
import { loadWeekInputs } from "../functions/_lib/bcpss/week-plan.js";
import { renderWeekPlanDocx } from "../functions/_lib/bcpss/week-plan-docx.js";
import { onRequest } from "../functions/api/bcpss/week-plan.js";
import { pickDates } from "../shared/planner/calendar.js";
import { checkPlan } from "../shared/planner/check.js";
import { encodeParams, parseSearch, shareHash } from "../shared/planner/params.js";
import { docStrings, PRINT_CSS, planDoc, planHtml, planIcs } from "../shared/planner/render.js";
import { planWeek } from "../shared/planner/solve.js";

const PAGE_BREAK_DOCX =
  /<w:pageBreakBefore\b|<w:br\b[^>]*w:type="(page|column)"|<w:lastRenderedPageBreak|<w:type w:val="(nextPage|oddPage|evenPage)"/;
const PAGE_BREAK_CSS =
  /page-break-(before|after|inside)|break-(before|after|inside)\s*:\s*(page|always|left|right|avoid-page)/i;
const MANIPULATIVE =
  /\b(manipulatives?|cubes?|spinners?|tiles?|beads?|abacus|dice|tokens?|counters? (blocks?|chips?)|base[- ]ten (blocks?|rods?))\b/i;
const NOT_PURPLE = /#([0-9a-f]{6})\b/gi;
// Existing unit content (not authored here) whose TITLE names a physical object. Reported, ratcheted: may only shrink.
const KNOWN_TITLE_HITS = new Set([
  "gk-math-u3:Cube Train Spies",
  "g7-math-u6:Fill the Gaps: Coin and Spinner",
]);

const un = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

function readZip(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = bytes.length - 22;
  while (eocd >= 0 && dv.getUint32(eocd, true) !== 0x06054b50) eocd -= 1;
  assert.ok(eocd >= 0, "zip end record");
  const count = dv.getUint16(eocd + 10, true);
  let at = dv.getUint32(eocd + 16, true);
  const files = {};
  for (let k = 0; k < count; k++) {
    const size = dv.getUint32(at + 24, true);
    const nameLen = dv.getUint16(at + 28, true);
    const skip = dv.getUint16(at + 30, true) + dv.getUint16(at + 32, true);
    const local = dv.getUint32(at + 42, true);
    assert.equal(dv.getUint16(at + 10, true), 0, "stored entry");
    const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLen));
    const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
    files[name] = new TextDecoder().decode(bytes.subarray(start, start + size));
    at += 46 + nameLen + skip;
  }
  return files;
}

const docxStrings = (xml) =>
  [...xml.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((m) => un(m[1]));
const htmlStrings = (html) => {
  const body = html.slice(html.indexOf("<body>") + 6, html.indexOf("</body>"));
  return [...body.matchAll(/>([^<]+)</g)]
    .map((m) => m[1])
    .filter((t) => t.trim())
    .map(un);
};

/** Findings for one rendered plan: text equality, page breaks, margins, palette, wording. */
function auditExports(plan, docxBytes, html) {
  const out = [];
  const want = docStrings(planDoc(plan));
  const files = readZip(docxBytes);
  const xml = files["word/document.xml"];
  if (JSON.stringify(docxStrings(xml)) !== JSON.stringify(want)) out.push("DOCX_TEXT");
  if (JSON.stringify(htmlStrings(html)) !== JSON.stringify(want)) out.push("HTML_TEXT");
  if (PAGE_BREAK_DOCX.test(xml) || PAGE_BREAK_DOCX.test(files["word/styles.xml"]))
    out.push("DOCX_PAGE_BREAK");
  if (PAGE_BREAK_CSS.test(html)) out.push("HTML_PAGE_BREAK");
  const mar = /<w:pgMar w:top="(\d+)" w:right="(\d+)" w:bottom="(\d+)" w:left="(\d+)"/.exec(xml);
  if (!mar || mar.slice(1, 5).some((v) => Number(v) < 720)) out.push("DOCX_MARGIN");
  if (!/@page\{[^}]*margin:\.6in/.test(html)) out.push("HTML_MARGIN");
  for (const [, hex] of PRINT_CSS.matchAll(NOT_PURPLE)) {
    const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
    if (b > r + 25 && b > g + 25 && r > g + 5) out.push(`PALETTE_${hex}`);
  }
  // Wording the planner itself authors (never unit titles): materials, headings, reasons, notes.
  const own = [
    plan.materials,
    plan.note,
    ...plan.dropped.map((d) => d.reason),
    ...plan.days.map((d) => `Day ${d.day}`),
  ];
  if (own.some((s) => MANIPULATIVE.test(s))) out.push("MANIPULATIVE_WORDING");
  if (!/paper and pencil/i.test(plan.materials)) out.push("MATERIALS");
  return out;
}

const fail3 = (msg) => {
  console.error(`BROKEN GATE planner-export: ${msg}`);
  return 3;
};

async function callRoute(query, env = {}) {
  const request = new Request(`https://example.test/api/bcpss/week-plan?${query}`);
  const { log, error } = console; // the handler logs one structured line per request
  console.log = () => {};
  console.error = () => {};
  try {
    return await onRequest({ request, env, params: {}, waitUntil() {} });
  } finally {
    console.log = log;
    console.error = error;
  }
}

async function main() {
  const inputs = new Map();
  for (const u of BCPSS_UNITS) inputs.set(u.id, await loadWeekInputs({}, u.id));
  const params = {
    unit: "g6-math-u1",
    bands: { "1_2": 6, "3_4": 12, "5_6": 6 },
    block: 60,
    days: 5,
    seed: 0,
    start: "2026-11-30",
    cal: false,
  };
  const { candidates, unit } = inputs.get(params.unit);
  const dates = pickDates(null, params.start, params.days);
  const plan = planWeek(candidates, params, { unit, dates });
  const docx = renderWeekPlanDocx(plan);
  const html = planHtml(plan);
  assert.deepEqual(auditExports(plan, docx, html), [], "baseline exports are clean");

  // -- negative controls --------------------------------------------------------------------------------------
  const xml = readZip(docx)["word/document.xml"];
  const controls = [
    [
      "docx page break",
      () => PAGE_BREAK_DOCX.test(xml.replace("<w:p>", "<w:p><w:pPr><w:pageBreakBefore/></w:pPr>")),
      true,
    ],
    ["docx br page", () => PAGE_BREAK_DOCX.test(`${xml}<w:r><w:br w:type="page"/></w:r>`), true],
    [
      "css break-before",
      () => PAGE_BREAK_CSS.test(`${html}<style>h2{break-before:page}</style>`),
      true,
    ],
    ["css page-break-after", () => PAGE_BREAK_CSS.test("p{page-break-after:always}"), true],
    [
      "text mismatch",
      () =>
        JSON.stringify(htmlStrings(html.replace("Day 1", "Day 9"))) !==
        JSON.stringify(docStrings(planDoc(plan))),
      true,
    ],
    ["manipulative word", () => MANIPULATIVE.test("Build it with snap cubes"), true],
    ["clean css passes", () => PAGE_BREAK_CSS.test(PRINT_CSS), false],
  ];
  for (const [name, probe, expected] of controls) {
    if (probe() !== expected)
      return fail3(`control "${name}" gave ${!expected}, expected ${expected}`);
  }
  console.log(
    "controls ok: page breaks, text mismatch and manipulative wording are caught; clean sheet passes",
  );

  // -- every unit: Word + HTML text, breaks, margins ----------------------------------------------------------
  const problems = [];
  const titleHits = new Set();
  for (const u of BCPSS_UNITS) {
    const i = inputs.get(u.id);
    for (const [block, days] of [
      [45, 3],
      [60, 5],
      [90, 5],
    ]) {
      const p = planWeek(
        i.candidates,
        { ...params, unit: u.id, block, days },
        { unit: i.unit, dates: pickDates(null, params.start, days) },
      );
      for (const code of auditExports(p, renderWeekPlanDocx(p), planHtml(p)))
        problems.push(`${u.id} ${block}x${days}: ${code}`);
      for (const c of i.candidates)
        if (MANIPULATIVE.test(c.title)) titleHits.add(`${u.id}:${c.title}`);
    }
  }
  const newHits = [...titleHits].filter((h) => !KNOWN_TITLE_HITS.has(h));
  for (const h of newHits) problems.push(`NEW_MANIPULATIVE_TITLE ${h}`);

  // -- share link: the query string regenerates the identical plan, no storage --------------------------------
  const link = shareHash(params);
  const reparsed = parseSearch(link.slice(link.indexOf("?")));
  assert.ok(reparsed.ok, "share link parses");
  assert.equal(encodeParams(reparsed.params), encodeParams(params), "canonical encode round-trips");
  const again = planWeek(candidates, reparsed.params, {
    unit,
    dates: pickDates(null, reparsed.params.start, reparsed.params.days),
  });
  if (JSON.stringify(again) !== JSON.stringify(plan)) problems.push("SHARE_LINK_DIFFERS");

  // -- .ics ---------------------------------------------------------------------------------------------------
  const ics = planIcs(plan);
  const lines = ics.split("\r\n");
  const enc = new TextEncoder();
  if (!ics.endsWith("\r\n") || ics.replace(/\r\n/g, "").includes("\n")) problems.push("ICS_CRLF");
  if (lines.some((l) => enc.encode(l).length > 75)) problems.push("ICS_FOLD");
  const unfolded = ics.replace(/\r\n /g, "");
  const starts = [...unfolded.matchAll(/DTSTART;VALUE=DATE:(\d{8})/g)].map((m) => m[1]);
  if (JSON.stringify(starts) !== JSON.stringify(dates.map((d) => d.replaceAll("-", ""))))
    problems.push("ICS_DATES");
  if (
    (unfolded.match(/BEGIN:VEVENT/g) || []).length !== params.days ||
    (unfolded.match(/END:VEVENT/g) || []).length !== params.days
  )
    problems.push("ICS_EVENTS");
  const uids = [...unfolded.matchAll(/UID:(\S+)/g)].map((m) => m[1]);
  if (new Set(uids).size !== uids.length) problems.push("ICS_UID");
  if (ics !== planIcs(plan)) problems.push("ICS_NONDETERMINISTIC");
  assert.throws(
    () => planIcs(planWeek(candidates, { ...params, start: null }, { unit })),
    /start date/,
    "ics refuses a plan with no dates",
  );

  // -- route --------------------------------------------------------------------------------------------------
  const q = encodeParams(params);
  const json = await (await callRoute(q)).json();
  if (json.ok !== true || JSON.stringify(json.plan) !== JSON.stringify(plan))
    problems.push("ROUTE_JSON");
  if (checkPlan(json.plan, candidates).length) problems.push("ROUTE_PLAN_CHECK");
  const routeHtml = await callRoute(`${q}&format=html`);
  if (routeHtml.status !== 200 || (await routeHtml.text()) !== html) problems.push("ROUTE_HTML");
  const routeDocx = await callRoute(`${q}&format=docx`);
  if (routeDocx.status !== 200 || !/wordprocessingml/.test(routeDocx.headers.get("Content-Type")))
    problems.push("ROUTE_DOCX");
  const routeIcs = await callRoute(`${q}&format=ics`);
  if (routeIcs.status !== 200 || (await routeIcs.text()) !== ics) problems.push("ROUTE_ICS");
  const routePdf = await callRoute(`${q}&format=pdf`);
  if (routePdf.status !== 200 || routePdf.headers.get("X-BCPSS-PDF-Fallback") !== "print-html")
    problems.push("ROUTE_PDF_FALLBACK");
  const withBrowser = await callRoute(`${q}&format=pdf`, {
    BROWSER: { quickAction: async () => new Response(new Uint8Array([37, 80, 68, 70])) },
  });
  if (withBrowser.headers.get("Content-Type") !== "application/pdf")
    problems.push("ROUTE_PDF_BROWSER");
  const bad = [
    ["unit=g6-math-u1&block=50", 400],
    ["unit=g6-math-u1&days=0", 400],
    ["unit=g6-math-u1&b12=0&b34=0&b56=0", 400],
    ["unit=g6-math-u1&evil=1", 400],
    ["unit=g6-math-u1&format=exe", 400],
    ["unit=g6-math-u1&format=ics", 400],
    ["unit=zz-nope-u9", 404],
    [`${q}&cal=1`, 503], // no ASSETS binding in this env: refused loudly, never silently weekdays
  ];
  for (const [query, status] of bad) {
    const res = await callRoute(query);
    if (res.status !== status)
      problems.push(`ROUTE_STATUS ${query} -> ${res.status}, want ${status}`);
  }
  const baseline = JSON.parse(
    readFileSync(new URL("../data/pacing-baseline-2026-27.json", import.meta.url), "utf8"),
  );
  const assets = {
    fetch: async () =>
      new Response(JSON.stringify(baseline), { headers: { "Content-Type": "application/json" } }),
  };
  const cal = await (
    await callRoute(`${encodeParams({ ...params, start: "2026-08-24", cal: true })}`, {
      ASSETS: assets,
    })
  ).json();
  const expected = pickDates(baseline.days, "2026-08-24", 5);
  if (!cal.ok || JSON.stringify(cal.plan.days.map((d) => d.date)) !== JSON.stringify(expected))
    problems.push("ROUTE_PACING_DATES");
  const late = await callRoute(encodeParams({ ...params, start: "2027-06-10", cal: true }), {
    ASSETS: assets,
  });
  if (late.status !== 422) problems.push("ROUTE_CALENDAR_RUNS_OUT");

  if (problems.length) {
    console.error(`FAIL planner-export: ${problems.length} problem(s). First 10:`);
    for (const p of problems.slice(0, 10)) console.error(`  ${p}`);
    return 1;
  }
  console.log(
    `PASS planner-export: 162 units x 3 shapes (docx + html text == model, no page breaks, margins >= 0.6in), share link, .ics, route (${bad.length + 8} cases)`,
  );
  console.log(
    `content note: ${titleHits.size} unit title(s) name a physical object (baseline ${KNOWN_TITLE_HITS.size}); reported, never edited`,
  );
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    if (err?.name === "AssertionError") {
      console.error(`FAIL planner-export: ${err.message}`);
      process.exit(1);
    }
    console.error("BROKEN GATE planner-export:", err);
    process.exit(3);
  },
);
