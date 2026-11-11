/**
 * The per-grade introduction handouts and the data behind them: for every grade choice (Kindergarten, Grade 1,
 * Grades 2–3, Grades 4–5, Grades 6–8) the Quick Guide, the Activity Guide and the Featured Lesson backup exist as PDF
 * and Word files, say their grade, are tagged and in one language (English), carry fonts embedded and no text under
 * 11 pt, link only to public lab URLs (every activity and teacher page of that grade), render to the right number of
 * pages in LibreOffice, and print the ONE QR code that scans back to ENTRANCE.url.
 *
 *   node --test tools/access-intro-guide-bands.test.mjs
 *
 * Grades 6–8 keeps the unsuffixed files (tools/access-intro-guide.test.mjs checks those in depth too). Missing poppler,
 * LibreOffice or a Swift toolchain SKIP locally and FAIL in CI.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import JSZip from "jszip";
import { buildActivityGuideModel } from "../access-practice-lab/src/intro/activity-guide-model.js";
import { absUrl, ENTRANCE, ROUTES } from "../access-practice-lab/src/intro/data.js";
import {
  EXPLORE_STEPS,
  exploreActivities,
} from "../access-practice-lab/src/intro/explore-bands.js";
import { buildBackupModel } from "../access-practice-lab/src/intro/lesson-backup-model.js";
import { cueChecks, lessonFor } from "../access-practice-lab/src/intro/lesson-bands.js";
import {
  gradeName,
  PICK_IDS,
  pickSuffix,
  printFiles,
} from "../access-practice-lab/src/intro/quick-guide-files.js";
import { buildGuideModel, guideUrls } from "../access-practice-lab/src/intro/quick-guide-model.js";
import { DOMAINS, tourActivities, tourRoute } from "../access-practice-lab/src/intro/tour-bands.js";
import { minTextSize } from "../scripts/lib/pdf-text-sizes.mjs";
import { readQrCodes } from "./lib/access-intro-qr-read.mjs";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";
import { auditDocx } from "./validate-docx-a11y.mjs";

const PREFIX = "https://thelanguagepage.com/access-practice-lab/";
const SCRATCH = mkdtempSync(join(tmpdir(), "intro-guide-bands-"));
const onDisk = (href) => join(REPO_ROOT, href.replace(/^\//, ""));
const has = (tool) => {
  try {
    execFileSync("which", [tool], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
const tools = { poppler: has("pdfinfo") && has("pdftoppm"), office: has("soffice") };
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
const firstPagePng = (pdf) => {
  const dir = mkdtempSync(join(SCRATCH, "png-"));
  execFileSync("pdftoppm", ["-r", "150", "-f", "1", "-l", "1", "-png", pdf, join(dir, "p")]);
  return join(dir, readdirSync(dir)[0]);
};

/** The files and the links each must carry, per grade choice. */
function specs(pick) {
  const files = printFiles(pick);
  const cards = buildActivityGuideModel(pick).cards;
  const lesson = lessonFor(pick);
  return [
    {
      kind: "quick guide",
      file: files.quickGuide,
      pages: [2, 2],
      urls: guideUrls(buildGuideModel(pick)),
      qr: true,
    },
    {
      kind: "activity guide",
      file: files.activityGuide,
      pages: [cards.length + 1, cards.length + 1],
      urls: [ENTRANCE.url, ...cards.map((c) => c.link.url)],
      qr: true,
    },
    {
      kind: "lesson backup",
      file: files.lessonBackup,
      pages: [2, 2],
      urls: [absUrl(lesson.use.studentRoute), ENTRANCE.url],
      qr: false,
    },
  ];
}

// ── data ──────────────────────────────────────────────────────────────────────────────────────────────────────────
test("every grade choice has its own file names; Grades 6–8 keeps the unsuffixed names", () => {
  assert.deepEqual(PICK_IDS, ["K", "1", "2-3", "4-5", "6-8"]);
  assert.equal(printFiles("6-8").quickGuide.pdf, "/access-practice-lab/guides/quick-guide.pdf");
  assert.equal(
    printFiles("2-3").activityGuide.docx,
    "/access-practice-lab/guides/activity-guide-2-3.docx",
  );
  const all = PICK_IDS.flatMap((p) =>
    ["quickGuide", "activityGuide", "lessonBackup"].flatMap((k) => Object.values(printFiles(p)[k])),
  );
  assert.equal(new Set(all).size, all.length, "no two grades share a file");
  for (const f of all) {
    assert.doesNotMatch(f, /teacher|presenter/i, f);
    assert.ok(existsSync(onDisk(f)), `${f} exists: run node scripts/generate-intro-guide.mjs`);
  }
  for (const p of PICK_IDS) assert.equal(pickSuffix(p) === "", p === "6-8", p);
});

test("explore and Quick Guide use the grade's four activities, one per domain, in domain order", () => {
  assert.equal(EXPLORE_STEPS[0].detail, "Listening, speaking, reading or writing.");
  for (const pick of PICK_IDS) {
    const acts = exploreActivities(pick);
    assert.deepEqual(
      acts.map((a) => a.domain.id),
      DOMAINS.map((d) => d.id),
    );
    assert.deepEqual(
      acts.map((a) => a.id),
      tourActivities(pick).map((a) => a.id),
    );
    for (const a of acts) {
      assert.ok(
        a.plan && Object.values(a.plan).every(Boolean),
        `${pick}/${a.id} has planning samples`,
      );
      assert.ok(a.tryNow.length > 20 && a.tryNow.length <= 160, `${pick}/${a.id} printed try`);
      if (!a.curated)
        assert.equal(a.route, tourRoute(tourActivities(pick).find((t) => t.id === a.id)));
    }
    const m = buildGuideModel(pick);
    assert.match(m.title, new RegExp(gradeName(pick)));
    assert.deepEqual(
      m.page1.pathways.map((p) => p.activities[0].id),
      acts.map((a) => a.id),
    );
    for (const u of guideUrls(m)) assert.ok(u.startsWith(PREFIX), u);
  }
});

test("the Featured Lesson for each grade: five steps in 10 minutes, a real picture, samples the cue check agrees with", () => {
  const titles = new Set();
  for (const pick of PICK_IDS) {
    const L = lessonFor(pick);
    titles.add(L.title);
    assert.equal(L.grade, gradeName(pick));
    assert.deepEqual(
      L.steps.map((s) => [s.name, s.minutes]),
      [
        ["Notice", 1],
        ["Speak", 2],
        ["Write", 3],
        ["Improve", 2],
        ["Share", 2],
      ],
    );
    assert.ok(L.picture.alt.length > 20 && L.picture.name, `${pick} picture alt`);
    if (L.picture.src.startsWith("data:image/svg+xml"))
      assert.match(decodeURIComponent(L.picture.src.split(",")[1]), /^<svg [^>]*viewBox/);
    else assert.ok(existsSync(onDisk(L.picture.src)), `${pick}: ${L.picture.src}`);
    assert.ok(
      cueChecks(L, L.sample.improved).every((c) => c.found),
      `${pick}: improved sample meets the cue`,
    );
    assert.ok(
      cueChecks(L, L.sample.first).some((c) => !c.found),
      `${pick}: first sample is missing the cue`,
    );
    assert.ok(L.anchor.route && L.use.studentRoute === L.anchor.route, `${pick} anchor link`);
    assert.deepEqual(L.files, printFiles(pick).lessonBackup);
    for (const s of Object.values(L.supports)) assert.ok(s.items.length >= 2);
    assert.doesNotMatch(
      JSON.stringify({ ...L, picture: null }),
      /\b(WIDA level [1-6]|score of|proficien)/i,
    );
  }
  assert.equal(
    titles.size,
    4,
    "Kindergarten and Grade 1 share one lesson; every other grade has its own",
  );
});

test("lesson backups: page 1 is for students and carries no teacher guidance, for every grade", () => {
  for (const pick of PICK_IDS) {
    const m = buildBackupModel(pick);
    const student = JSON.stringify({ ...m.student, picture: null });
    for (const line of m.teacher.steps
      .map((s) => s.direction)
      .concat(m.teacher.cue, m.teacher.check))
      assert.ok(!student.includes(line.slice(0, 40)), `${pick}: teacher text on the student page`);
    assert.doesNotMatch(student, /teacher|answer key|support choices/i, pick);
    assert.match(m.title, new RegExp(gradeName(pick)));
    assert.equal(m.teacher.steps.length, 5);
  }
});

test("activity guide models: complete cards for every grade, linked to the grade's own routes", () => {
  for (const pick of PICK_IDS) {
    const m = buildActivityGuideModel(pick);
    assert.match(m.title, new RegExp(gradeName(pick)));
    assert.equal(m.howTo.points.length, 5);
    const ids = m.cards.map((c) => c.id);
    for (const a of tourActivities(pick)) assert.ok(ids.includes(a.id), `${pick} covers ${a.id}`);
    for (const c of m.cards) {
      for (const k of ["name", "kind", "icon", "does", "why", "time", "open", "feedback"])
        assert.ok(c[k], `${pick}/${c.id} lacks ${k}`);
      if (c.group !== "Explore later") assert.ok(c.limits, `${pick}/${c.id} lacks limits`);
      assert.ok(
        c.steps.length >= 3 &&
          c.builtIn.length >= (c.group === "Explore later" ? 1 : 2) &&
          c.stuck.length >= 1,
        `${pick}/${c.id}`,
      );
      assert.ok(c.teach.before && c.teach.during && c.teach.after, `${pick}/${c.id} teach`);
      assert.ok(c.link.url.startsWith(PREFIX), c.link.url);
      assert.doesNotMatch(JSON.stringify(c), /\b(WIDA level [1-6]|score of|proficiency level)/i);
    }
  }
});

test("teacher pages that open at a grade are lab routes without the gated word", () => {
  for (const pick of PICK_IDS) {
    const l = buildGuideModel(pick).page2.links.lesson;
    assert.ok(l.route.startsWith(ROUTES.lesson), l.route);
    if (pick !== "6-8") assert.equal(new URL(l.url).searchParams.get("grades"), pick);
    assert.doesNotMatch(l.url, /teacher/i);
  }
});

// ── the files ─────────────────────────────────────────────────────────────────────────────────────────────────────
for (const pick of PICK_IDS) {
  for (const spec of specs(pick)) {
    test(`${pick} ${spec.kind} PDF: pages, tagged, English only, grade in the title, fonts, 11 pt, links`, {
      skip: skip(tools.poppler, "poppler"),
    }, () => {
      const path = onDisk(spec.file.pdf);
      const bytes = readFileSync(path);
      assert.ok(bytes.length < 1024 * 1024, `${spec.file.pdf} is ${bytes.length} bytes`);
      const pages = pdfPages(path);
      assert.ok(
        pages >= spec.pages[0] && pages <= spec.pages[1],
        `${spec.file.pdf} has ${pages} pages`,
      );
      const info = execFileSync("pdfinfo", [path], { encoding: "utf8" });
      assert.match(info, /Tagged:\s+yes/);
      assert.match(
        /Title:\s+(.*)/.exec(info)[1],
        new RegExp(gradeName(pick)),
        "the title says the grade",
      );
      const raw = bytes.toString("latin1");
      const langs = new Set(
        [...raw.matchAll(/\/Lang\s*\(([^)]*)\)/g)].map((m) => m[1].slice(0, 2)),
      );
      assert.deepEqual([...langs], ["en"], `one language: ${[...langs]}`);
      assert.match(raw, /\/StructTreeRoot/);
      const fonts = execFileSync("pdffonts", [path], { encoding: "utf8" })
        .trim()
        .split("\n")
        .slice(2);
      assert.ok(
        fonts.length && fonts.every((l) => /\s(yes)\s+(yes|no)\s+(yes|no)\s+\d+\s+\d+\s*$/.test(l)),
      );
      assert.ok(minTextSize(bytes) >= 10.99, `${spec.file.pdf}: text under 11 pt`);
      const uris = new Set([...raw.matchAll(/\/URI \(([^)]*)\)/g)].map((m) => m[1]));
      for (const u of spec.urls) assert.ok(uris.has(u), `${spec.file.pdf} lacks ${u}`);
      for (const u of uris) assert.ok(u.startsWith(PREFIX), `${spec.file.pdf}: stray link ${u}`);
      assert.ok(![...uris].some((u) => /[?&]intro=/.test(u)), "print carries plain URLs");
    });

    test(`${pick} ${spec.kind} Word file: accessibility rules, real hyperlinks, 11 pt`, async () => {
      const buf = readFileSync(onDisk(spec.file.docx));
      assert.deepEqual(
        await auditDocx(buf),
        [],
        `${spec.file.docx} fails the Word accessibility rules`,
      );
      const zip = await JSZip.loadAsync(buf);
      const rels = await zip.file("word/_rels/document.xml.rels").async("string");
      const targets = new Set(
        [...rels.matchAll(/Target="(https:[^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&")),
      );
      for (const u of spec.urls) assert.ok(targets.has(u), `${spec.file.docx} lacks ${u}`);
      const doc = await zip.file("word/document.xml").async("string");
      assert.ok(!/w:sz w:val="(\d|1\d|20)"/.test(doc), "no run under 11 pt");
      const core = await zip.file("docProps/core.xml").async("string");
      assert.match(core, new RegExp(gradeName(pick)), "the document title says the grade");
    });

    test(`${pick} ${spec.kind} Word file renders to the right number of pages`, {
      skip: skip(tools.office && tools.poppler, "LibreOffice or poppler"),
    }, () => {
      const pages = pdfPages(docxToPdf(onDisk(spec.file.docx)));
      assert.ok(
        pages >= spec.pages[0] && pages <= spec.pages[1],
        `${spec.file.docx}: ${pages} pages`,
      );
    });
  }
}

test("every grade's printed QR (PDF and Word, first page) scans to ENTRANCE.url", {
  skip: skip(
    tools.office && tools.poppler && process.platform === "darwin",
    "LibreOffice, poppler or CoreImage",
  ),
}, () => {
  const pages = [];
  for (const pick of PICK_IDS)
    for (const spec of specs(pick).filter((s) => s.qr)) {
      pages.push(firstPagePng(onDisk(spec.file.pdf)));
      pages.push(firstPagePng(docxToPdf(onDisk(spec.file.docx))));
    }
  const read = readQrCodes(pages);
  assert.ok(read, "no decoder available");
  for (const p of pages) assert.deepEqual(read[p], [ENTRANCE.url], `${p} does not scan`);
});
