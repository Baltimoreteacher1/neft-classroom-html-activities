/**
 * The introduction handouts (access-practice-lab/guides/) and the data behind them.
 *
 *   node --test tools/access-intro-guide.test.mjs
 *
 * Pure logic (model, presenter notes, file names) always runs. File checks read the committed outputs of
 * `npm run generate:intro-guide`: page counts, tagged PDFs with a language and a title, embedded fonts, no text under
 * 11 pt, every link a /URI that equals the intended public URL, Word files with real hyperlinks and the a11y rules of
 * tools/validate-docx-a11y.mjs, and the ONE QR code decoded back to ENTRANCE.url from the PNG, the SVG, and a
 * rasterized page of every PDF and Word file. Missing poppler / LibreOffice / a Swift toolchain SKIP locally, FAIL in CI.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Resvg } from "@resvg/resvg-js";
import JSZip from "jszip";
import { ACTIVITY_GUIDE } from "../access-practice-lab/src/intro/activity-guide-data.js";
import {
  buildActivityGuideModel,
  GUIDE_ORDER,
  guideOrder,
} from "../access-practice-lab/src/intro/activity-guide-model.js";
import {
  ACTIVITY_BY_ID,
  absUrl,
  DOWNLOADS,
  ENTRANCE,
  FEATURED_LESSON,
  PRESENTER_SCHEDULE,
  ROUTES,
} from "../access-practice-lab/src/intro/data.js";
import { buildBackupModel } from "../access-practice-lab/src/intro/lesson-backup-model.js";
import {
  BACKUP_ALL,
  DOWNLOAD_NAMES,
  HANDOFF,
  PRESENTER_NOTES,
  ROOM_SETUP,
} from "../access-practice-lab/src/intro/presenter-notes.js";
import { QR_START_URL, qrStartSvg } from "../access-practice-lab/src/intro/qr-start-svg.js";
import {
  buildDirectory,
  countIndexActivities,
  ROUTE_SHAPE,
} from "../access-practice-lab/src/intro/site-directory-model.js";
import { directoryModel } from "../scripts/lib/intro-directory-build.mjs";

const INDEX = JSON.parse(
  readFileSync(new URL("../access-practice-lab/content/index.json", import.meta.url), "utf8"),
);
const DIRECTORY = directoryModel("test");
const directoryRows = (m) =>
  m.bands.flatMap((b) => b.domains.flatMap((d) => d.levels.flatMap((l) => l.rows)));
const directoryUrls = (m = DIRECTORY) => [
  ...directoryRows(m).map((r) => r.url),
  ...m.tests.map((t) => t.url),
  ...m.places.flatMap((g) => g.items.map((i) => i.url)),
];
const activityGuideUrls = () => [
  ENTRANCE.url,
  ...buildActivityGuideModel().cards.map((c) => c.link.url),
];

import {
  buildGuideModel,
  GUIDE_FILES,
  guideUrls,
} from "../access-practice-lab/src/intro/quick-guide-model.js";
import { minTextSize } from "../scripts/lib/pdf-text-sizes.mjs";
import { qrSvg } from "../shared/qr/qr-code.mjs";
import { readQrCodes } from "./lib/access-intro-qr-read.mjs";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";
import { auditDocx } from "./validate-docx-a11y.mjs";

const GUIDES = join(REPO_ROOT, "access-practice-lab", "guides");
// The presenter notes are generated off-site (docs/languageos/pd/): the PD session is not published (Joel 2026-11-11).
const PD_DIR = join(REPO_ROOT, "docs", "languageos", "pd");
const inGuides = (f) => join(String(f).startsWith("presenter-notes") ? PD_DIR : GUIDES, f);
const SCRATCH = mkdtempSync(join(tmpdir(), "intro-guide-test-"));
const need = (tool) => {
  try {
    execFileSync("which", [tool], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
const tools = {
  poppler: need("pdfinfo") && need("pdftoppm") && need("pdffonts"),
  office: need("soffice"),
};
const skip = (ok, what) => (ok ? false : process.env.CI ? false : `${what} is not installed`);
const pdfPages = (file) =>
  Number(/Pages:\s+(\d+)/.exec(execFileSync("pdfinfo", [file], { encoding: "utf8" }))[1]);

function docxToPdf(file) {
  const dir = mkdtempSync(join(SCRATCH, "lo-"));
  execFileSync(
    "soffice",
    [
      `-env:UserInstallation=file://${join(SCRATCH, "profile")}`,
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      dir,
      file,
    ],
    { stdio: "ignore", timeout: 180000 },
  );
  return join(
    dir,
    `${file
      .split("/")
      .pop()
      .replace(/\.docx$/, "")}.pdf`,
  );
}
function rasterize(pdf, dpi = 150) {
  const dir = mkdtempSync(join(SCRATCH, "png-"));
  execFileSync("pdftoppm", ["-r", String(dpi), "-png", pdf, join(dir, "p")]);
  return readdirSync(dir)
    .sort()
    .map((f) => join(dir, f));
}

// ── data and model ────────────────────────────────────────────────────────────────────────────────────────────────
test("quick guide model (Grades 6–8): the four domains in order, one activity each, every link a public URL", () => {
  const m = buildGuideModel();
  assert.deepEqual(
    m.page1.pathways.map((p) => p.id),
    ["listening", "speaking", "reading", "writing"],
  );
  for (const p of m.page1.pathways) assert.equal(p.activities.length, 1);
  for (const id of ["hallway", "upgrade"]) {
    const a = m.page1.pathways.flatMap((p) => p.activities).find((x) => x.id === id);
    assert.equal(a.link.url, absUrl(ACTIVITY_BY_ID[id].route));
    assert.equal(a.tryNow, ACTIVITY_BY_ID[id].tryNow);
    assert.equal(a.classroomUse, ACTIVITY_BY_ID[id].classroomUse);
  }
  assert.equal(m.page1.start.link.url, ENTRANCE.url);
  assert.equal(m.page1.planning.prompts.length, 5);
  assert.deepEqual(
    m.page2.steps.map((s) => [s.name, s.minutes]),
    [
      ["Notice", 1],
      ["Speak", 2],
      ["Write", 3],
      ["Improve", 2],
      ["Share", 2],
    ],
  );
  assert.equal(m.page2.prompt, FEATURED_LESSON.prompt);
  assert.equal(m.page2.sample.first, FEATURED_LESSON.sample.first);
  assert.equal(m.page2.supports.length, 3);
  assert.match(m.page2.fade, /Supports fade; the task stays the same/);
  assert.ok(
    guideUrls(m).every((u) => u.startsWith("https://thelanguagepage.com/access-practice-lab/")),
  );
});

test("lesson backup: page 1 is the student page and carries no teacher guidance", () => {
  const m = buildBackupModel();
  const student = JSON.stringify(m.student);
  assert.equal(m.student.prompt, FEATURED_LESSON.prompt);
  assert.equal(m.student.frame, FEATURED_LESSON.frame);
  assert.equal(m.student.picture.src, FEATURED_LESSON.picture.src);
  assert.ok(
    existsSync(join(REPO_ROOT, m.student.picture.src.replace(/^\//, ""))),
    "hallway picture file",
  );
  assert.ok(m.student.picture.alt.length > 20);
  for (const teacherLine of FEATURED_LESSON.steps
    .map((s) => s.teacher)
    .concat(
      FEATURED_LESSON.cue,
      FEATURED_LESSON.check,
      FEATURED_LESSON.followUp,
      FEATURED_LESSON.sample.improved,
    ))
    assert.ok(
      !student.includes(teacherLine.slice(0, 40)),
      `teacher text on the student page: ${teacherLine.slice(0, 40)}`,
    );
  assert.doesNotMatch(student, /teacher|answer key|support choices/i);
  assert.equal(m.teacher.steps.length, 5);
});

test("presenter notes: six rows in the exact pacing, verified routes, backups that make no offline claim", () => {
  assert.deepEqual(
    PRESENTER_NOTES.map((r) => r.range),
    PRESENTER_SCHEDULE.map((r) => r.range),
  );
  const known = new Set([
    ...Object.values(ROUTES),
    ...Object.values(ACTIVITY_BY_ID).map((a) => a.route),
  ]);
  for (const r of PRESENTER_NOTES) {
    for (const k of [
      "range",
      "title",
      "route",
      "openLabel",
      "say",
      "presenterDoes",
      "teachersDo",
      "watchFor",
      "backup",
    ])
      assert.ok(r[k]?.length, `${r.range} lacks ${k}`);
    assert.ok(known.has(r.route), `${r.range}: route ${r.route} is not a known route`);
    assert.ok(r.say.length >= 1 && r.say.length <= 3, `${r.range}: say is 1-3 sentences`);
  }
  assert.equal(HANDOFF.route, ROUTES.explore);
  assert.ok(HANDOFF.say.length && HANDOFF.chooseFocus.length && HANDOFF.downloads);
  assert.deepEqual(Object.keys(BACKUP_ALL), ["audio", "microphones", "network"]);
  assert.ok(ROOM_SETUP.length >= 5);
  const all = JSON.stringify({ PRESENTER_NOTES, HANDOFF, BACKUP_ALL, ROOM_SETUP });
  assert.doesNotMatch(
    all,
    /offline mode (is|works)|works offline|without wi-?fi|service worker/i,
    "no offline claim",
  );
  assert.match(BACKUP_ALL.network.steps.join(" "), /Featured Lesson backup/);
  for (const d of DOWNLOAD_NAMES)
    assert.ok(
      JSON.stringify({ HANDOFF, ROOM_SETUP }).includes(d.name) || d.name === "Presenter notes",
      d.name,
    );
});

test("file names never contain the substring that Pages gates behind the teacher password", () => {
  const names = [
    ...Object.values(DOWNLOADS).flatMap((o) => Object.values(o)),
    GUIDE_FILES.qrStart,
    ...GUIDE_FILES.downloads.flatMap((d) => [d.pdf, d.docx]),
  ];
  for (const n of names) assert.doesNotMatch(n, /teacher/i, n);
  for (const f of readdirSync(GUIDES)) assert.doesNotMatch(f, /teacher/i, f);
  for (const f of readdirSync(GUIDES))
    assert.doesNotMatch(f, /presenter/i, `${f}: presenter files are not published`);
});

test("activity guide (Grades 6–8): every curated card in Joel's order, plus that grade's Listening and Reading", () => {
  const m = buildActivityGuideModel();
  assert.deepEqual(
    m.cards.filter((c) => ACTIVITY_GUIDE.some((g) => g.id === c.id)).map((c) => c.id),
    GUIDE_ORDER,
  );
  assert.deepEqual(
    m.cards.map((c) => c.id),
    guideOrder("6-8"),
  );
  assert.equal(m.cards.length, ACTIVITY_GUIDE.length + 2);
  assert.deepEqual(GUIDE_ORDER.slice(0, 4), ["hallway", "board", "upgrade", "paragraph"]);
  for (const c of m.cards) {
    for (const k of ["name", "kind", "icon", "does", "why", "time", "open", "feedback"])
      assert.ok(c[k], `${c.id} lacks ${k}`);
    if (ACTIVITY_BY_ID[c.id]) assert.equal(c.link.url, absUrl(ACTIVITY_BY_ID[c.id].route));
    assert.ok(
      c.steps.length >= 3 && c.builtIn.length >= 1 && c.stuck.length >= 1,
      `${c.id} steps, help, fixes`,
    );
    assert.ok(c.teach.before && c.teach.during && c.teach.after, `${c.id} before, during, after`);
  }
  assert.equal(m.howTo.points.length, 5);
});

test("site directory: every index activity once, every link in a route shape parseRoute knows", () => {
  const rows = directoryRows(DIRECTORY);
  assert.equal(DIRECTORY.total, countIndexActivities(INDEX));
  assert.equal(rows.length, countIndexActivities(INDEX));
  assert.equal(new Set(rows.map((r) => r.url)).size, rows.length, "no activity listed twice");
  for (const r of rows) assert.match(r.route, ROUTE_SHAPE, r.route);
  for (const t of DIRECTORY.tests) assert.match(t.route, ROUTE_SHAPE, t.route);
  assert.equal(DIRECTORY.tests.length, INDEX.tests.length);
  assert.deepEqual(
    DIRECTORY.bands.map((b) => b.id),
    ["K", "1", "2-3", "3-5", "6-8"].filter((b) => INDEX.bands[b]),
  );
  assert.ok(DIRECTORY.places.length >= 5 && DIRECTORY.places.every((g) => g.items.length));
  for (const i of DIRECTORY.places.flatMap((g) => g.items)) {
    assert.match(i.url, /^https:\/\/(thelanguagepage|eduwonderlab)\.com\//, i.url);
    if (/teacher/i.test(i.url)) assert.ok(i.gated, `${i.label} is marked password required`);
  }
  // the model is pure: the same index gives the same directory
  assert.deepEqual(
    buildDirectory(INDEX, { generated: "x" }).bands,
    buildDirectory(INDEX, { generated: "x" }).bands,
  );
});

// ── the one QR code ───────────────────────────────────────────────────────────────────────────────────────────────
test("the QR files are the single code for ENTRANCE.url, and the importable module matches", () => {
  const svg = readFileSync(inGuides("qr-start.svg"), "utf8").trim();
  assert.equal(
    svg,
    qrSvg(ENTRANCE.url, { px: 144 }),
    "qr-start.svg is stale: run npm run generate:intro-guide",
  );
  assert.equal(QR_START_URL, ENTRANCE.url);
  assert.match(
    qrStartSvg({ px: 200, label: "Scan" }),
    /width="200" height="200" shape-rendering="crispEdges" role="img" aria-label="Scan"/,
  );
  assert.equal(
    readdirSync(GUIDES)
      .filter((f) => /^qr-/.test(f))
      .sort()
      .join(),
    "qr-family.png,qr-family.svg,qr-start.png,qr-start.svg",
    "one QR code for teachers (start) and one for families (practice-together), nothing else",
  );
  assert.equal(ENTRANCE.url, "https://thelanguagepage.com/access-practice-lab/start");
});

test("a scanner decodes the QR PNG and SVG back to ENTRANCE.url", {
  skip: process.platform !== "darwin" && !process.env.CI && "CoreImage decoder needs macOS",
}, () => {
  const fromSvg = join(SCRATCH, "svg-render.png");
  const svg = readFileSync(inGuides("qr-start.svg"), "utf8");
  mkdirSync(SCRATCH, { recursive: true });
  execFileSync("node", [
    "-e",
    `require("fs").writeFileSync(${JSON.stringify(fromSvg)}, Buffer.from(${JSON.stringify([...new Resvg(svg, { fitTo: { mode: "width", value: 600 } }).render().asPng()])}))`,
  ]);
  const read = readQrCodes([inGuides("qr-start.png"), fromSvg]);
  assert.ok(read, "no decoder available");
  assert.deepEqual(Object.values(read), [[ENTRANCE.url], [ENTRANCE.url]]);
});

// ── PDFs ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const LAB_PREFIX = "https://thelanguagepage.com/access-practice-lab/";
const PDFS = [
  { file: "quick-guide.pdf", pages: [2, 2], urls: () => guideUrls(), qr: true },
  { file: "activity-guide.pdf", pages: [9, 9], urls: activityGuideUrls, qr: true },
  {
    file: "site-directory.pdf",
    pages: [10, 90],
    urls: () => directoryUrls(),
    exact: true,
    outline: true,
    maxBytes: 2 * 1024 * 1024,
    prefixes: ["https://thelanguagepage.com/", "https://eduwonderlab.com/"],
  },
  {
    file: "featured-lesson-backup.pdf",
    pages: [2, 2],
    urls: () => [absUrl(ACTIVITY_BY_ID[FEATURED_LESSON.anchor].route), ENTRANCE.url],
    qr: false,
  },
  {
    file: "presenter-notes.pdf",
    pages: [1, 4],
    urls: () => [ENTRANCE.url, absUrl(ROUTES.lesson), absUrl(ROUTES.guide), absUrl(ROUTES.explore)],
    qr: true,
  },
];
for (const spec of PDFS) {
  test(`${spec.file}: pages, tagging, language, title, fonts, size, links`, {
    skip: skip(tools.poppler, "poppler"),
  }, () => {
    const path = inGuides(spec.file);
    const bytes = readFileSync(path);
    assert.ok(
      bytes.length < (spec.maxBytes || 1024 * 1024),
      `${spec.file} is ${bytes.length} bytes`,
    );
    const pages = pdfPages(path);
    assert.ok(pages >= spec.pages[0] && pages <= spec.pages[1], `${spec.file} has ${pages} pages`);
    const info = execFileSync("pdfinfo", [path], { encoding: "utf8" });
    assert.match(info, /Tagged:\s+yes/);
    assert.match(info, /Title:\s+\S+/);
    const raw = bytes.toString("latin1");
    assert.match(raw, /\/Lang\s*\(en/);
    assert.match(raw, /\/StructTreeRoot/);
    const fonts = execFileSync("pdffonts", [path], { encoding: "utf8" })
      .trim()
      .split("\n")
      .slice(2);
    assert.ok(
      fonts.length > 0 &&
        fonts.every((l) => /\s(yes)\s+(yes|no)\s+(yes|no)\s+\d+\s+\d+\s*$/.test(l)),
      `every font embedded:\n${fonts.join("\n")}`,
    );
    const min = minTextSize(bytes);
    assert.ok(min >= 10.99, `${spec.file}: smallest text is ${min} pt, must be 11 pt or more`);
    const uris = new Set([...raw.matchAll(/\/URI \(([^)]*)\)/g)].map((m) => m[1]));
    for (const u of spec.urls()) assert.ok(uris.has(u), `${spec.file} lacks a link to ${u}`);
    for (const u of uris)
      assert.ok(
        (spec.prefixes || [LAB_PREFIX]).some((p) => u.startsWith(p)),
        `${spec.file}: stray link ${u}`,
      );
    if (spec.exact)
      assert.equal(uris.size, new Set(spec.urls()).size, `${spec.file}: one link per listed page`);
    if (spec.outline) assert.match(raw, /\/Outlines/, `${spec.file} has PDF bookmarks`);
    assert.ok(
      ![...uris].some((u) => /[?&]intro=/.test(u)),
      "the print copy carries plain URLs, not the on-screen return parameter",
    );
  });
}

test("the PDFs show no text outside the page and every page has content (rasterized and inspected for ink)", {
  skip: skip(tools.poppler, "poppler"),
}, () => {
  for (const f of [
    "quick-guide.pdf",
    "featured-lesson-backup.pdf",
    "presenter-notes.pdf",
    "activity-guide.pdf",
  ]) {
    const pngs = rasterize(inGuides(f), 40);
    for (const p of pngs) assert.ok(statSync(p).size > 3000, `${f}: ${p} looks blank`);
  }
});

// ── Word files ────────────────────────────────────────────────────────────────────────────────────────────────────
const DOCXS = [
  { file: "quick-guide.docx", pages: [2, 2], urls: () => guideUrls() },
  { file: "activity-guide.docx", pages: [9, 9], urls: activityGuideUrls },
  { file: "site-directory.docx", pages: [5, 90], urls: () => directoryUrls() },
  {
    file: "featured-lesson-backup.docx",
    pages: [2, 2],
    urls: () => [absUrl(ACTIVITY_BY_ID[FEATURED_LESSON.anchor].route), ENTRANCE.url],
  },
  {
    file: "presenter-notes.docx",
    pages: [1, 4],
    urls: () => [ENTRANCE.url, absUrl(ROUTES.lesson), absUrl(ROUTES.guide), absUrl(ROUTES.explore)],
  },
];
for (const spec of DOCXS) {
  test(`${spec.file}: accessibility rules, real hyperlinks, editable`, async () => {
    const buf = readFileSync(inGuides(spec.file));
    assert.ok(buf.length < 1024 * 1024, "under 1 MB");
    assert.deepEqual(await auditDocx(buf), [], `${spec.file} fails the Word accessibility rules`);
    const zip = await JSZip.loadAsync(buf);
    const rels = await zip.file("word/_rels/document.xml.rels").async("string");
    const targets = new Set(
      [...rels.matchAll(/Target="(https:[^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&")),
    );
    for (const u of spec.urls())
      assert.ok(targets.has(u), `${spec.file} lacks a hyperlink to ${u}`);
    const doc = await zip.file("word/document.xml").async("string");
    assert.ok(/<w:hyperlink /.test(doc), "real hyperlink elements");
    assert.ok(
      !/w:sz w:val="(\d|1\d|20)"/.test(doc),
      "no run smaller than 11 pt (size values are half-points)",
    );
    // docx always writes footnote and endnote styles at 10 pt; the guides contain no notes, so they are never used.
    const styles = (await zip.file("word/styles.xml").async("string")).replace(
      /<w:style [^>]*w:styleId="(?:Footnote|Endnote)Text(?:Char)?"[\s\S]*?<\/w:style>/g,
      "",
    );
    assert.ok(!/<w:sz w:val="(\d|1\d|20)"\/>/.test(styles), "no style smaller than 11 pt");
  });

  test(`${spec.file}: renders in LibreOffice to the right number of pages`, {
    skip: skip(tools.office && tools.poppler, "LibreOffice or poppler"),
  }, () => {
    const pdf = docxToPdf(inGuides(spec.file));
    const pages = pdfPages(pdf);
    assert.ok(
      pages >= spec.pages[0] && pages <= spec.pages[1],
      `${spec.file} renders to ${pages} pages`,
    );
  });
}

// ── the QR on paper, read back from rendered pages ────────────────────────────────────────────────────────────────
test("every printed QR scans to ENTRANCE.url (PDF pages and Word pages, rasterized)", {
  skip: skip(
    tools.office && tools.poppler && process.platform === "darwin",
    "LibreOffice, poppler or CoreImage",
  ),
}, () => {
  const pages = [];
  for (const f of ["quick-guide", "presenter-notes", "activity-guide"]) {
    pages.push(rasterize(inGuides(`${f}.pdf`))[0]);
    pages.push(rasterize(docxToPdf(inGuides(`${f}.docx`)))[0]);
  }
  const read = readQrCodes(pages);
  assert.ok(read, "no decoder available");
  for (const p of pages)
    assert.deepEqual(read[p], [ENTRANCE.url], `${p} does not scan to ${ENTRANCE.url}`);
});
