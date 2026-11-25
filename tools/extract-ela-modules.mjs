// Extracts the district Wit & Wisdom pacing-guide facts (Modules 1-3, grades K-8) from the PDFs into
// data/ela-modules.json. The guides are weekly calendar tables, so only fields that read reliably are taken:
// module dates, introduction, end-of-module task, the Module line (title / question), and per week the number,
// date range, the "Texts" column and the whole week's words. Nothing is paraphrased: every stored string is a
// slice of the PDF text, and --check proves it (and that the committed JSON matches a fresh extraction).
//
// Usage: node tools/extract-ela-modules.mjs --src ~/Desktop [--out data/ela-modules.json] [--check]
//   Needs `pdftotext` (poppler). The PDFs are not in the repo, so CI cannot run this; the validator
//   (tools/validate-ela-modules.mjs) checks the committed JSON on its own.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const src = path.resolve((opt("--src", "~/Desktop") || "").replace(/^~(?=\/|$)/, os.homedir()));
const outFile = path.resolve(repo, opt("--out", "data/ela-modules.json"));
const check = args.includes("--check");

const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];
const DIRS = { 1: "Module 1", 2: "Module 2", 3: "Module 3" };

/** The guide PDF for a grade and module. Draft/District/FINAL variants are all the same guide; Strong Start copies and TWR resource packs are not. */
function guideFile(grade, module) {
  const dir = path.join(src, DIRS[module]);
  if (!existsSync(dir)) throw new Error(`missing folder ${dir}`);
  const want = new RegExp(`(^|[^0-9a-z])(grade|gr)[ _]*${grade}(?![0-9a-z])`, "i");
  const files = readdirSync(dir).filter(
    (f) => f.toLowerCase().endsWith(".pdf") && want.test(f) && !/resources/i.test(f),
  );
  // Module 1 has both a "District Pacing Guide" and a "TWR draft" for grades 3/6/K; prefer the one the district labels final.
  files.sort((a, b) => Number(/district|final/i.test(b)) - Number(/district|final/i.test(a)));
  if (!files.length) throw new Error(`no guide for grade ${grade} module ${module} in ${dir}`);
  return path.join(dir, files[0]);
}

const pdfText = (file) =>
  execFileSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8", maxBuffer: 64e6 });
const squash = (s) => s.replace(/\s+/g, " ").trim();

/**
 * Known defects in the district PDFs themselves (stray text pasted into the header, a grade copied from another
 * file). Each repair is explicit, applied to the squashed header text, and written to the output so nothing is
 * silently fixed.
 */
const REPAIRS = [
  {
    grade: "5",
    module: 2,
    find: " co A Hero’s Journey What is the significance and power of the hero’s journey? Narrative Writing fusion because",
    replace: " confusion because",
    why: "Grade 5 Module 2 header has the Grade 6 Module 2 title line pasted into the middle of the introduction.",
  },
];
/** Module lines that contradict the guide's own introduction (copied from another module). */
const BAD_MODULE_LINE = [
  {
    grade: "8",
    module: 2,
    why: "Module line says 'What Is Love?' (Module 3); the introduction is about World War I.",
  },
];

const MONTHS =
  "Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?";
const MONTH_NUM = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};
const monthNum = (m) => MONTH_NUM[m.slice(0, 3).toLowerCase()];

/** "August 25, 2025- November 19, 2025", "Dec 1, 2025 - March 4, 2026", "December 1- March 4, 2026", "Dates: March 9, 2026- June 5, 2026". */
function parseDates(header) {
  const re = new RegExp(
    `(${MONTHS})\\.?\\s+(\\d{1,2})(?:,?\\s*(\\d{4}))?\\s*[-–—]\\s*(${MONTHS})\\.?\\s+(\\d{1,2}),?\\s*(\\d{4})`,
    "i",
  );
  const m = re.exec(header);
  if (!m) return null;
  const endYear = Number(m[6]);
  const [sm, em] = [monthNum(m[1]), monthNum(m[4])];
  const startYear = m[3] ? Number(m[3]) : sm > em ? endYear - 1 : endYear;
  const iso = (y, mo, d) => `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { start: iso(startYear, sm, Number(m[2])), end: iso(endYear, em, Number(m[5])) };
}

/** Text of the first page block before the weekly table: everything up to the "Texts Monday ..." header row. */
function headerText(text) {
  const cut = text.search(/^\s*(Texts\s+)?Monday\s+Tuesday/m);
  return cut < 0 ? text.slice(0, 6000) : text.slice(0, cut);
}

function between(squashed, startRe, endRes) {
  const m = startRe.exec(squashed);
  if (!m) return null;
  const rest = squashed.slice(m.index + m[0].length);
  let end = rest.length;
  for (const re of endRes) {
    const e = re.exec(rest);
    if (e && e.index < end) end = e.index;
  }
  return rest.slice(0, end).trim();
}

const ENDS = [
  /\bEOM Task:/,
  /\bNote:/,
  /\bTeacher’s Note:/,
  /\bAssessments (?:are NOT|for Module)/,
  /\bModule O:/,
  /\bModule 0:/,
  /\bTWR (?:Lessons|LESSONS)\b/,
  /\bSchool-base\b/,
  /\bModule: /,
];

/** The "Module: <Title> <Question?> <Writing type>" line, present on Modules 2 and 3 only. */
function moduleLine(squashed) {
  const raw = between(squashed, /\bModule: /, [/\bStrategies,/, /\bTexts\b/, /\bGrade \d?\s*Wit/]);
  return raw
    ? raw
        .replace(/^[“"]|[”"]$/g, "")
        .replace(/^[“"]\s*/, "")
        .replace(/\s*[”"]$/, "")
    : null;
}

/** Header rows and page furniture that repeat on every page and are not week content. */
const FURNITURE = [
  /^\s*Grade\b.*Wit & Wisdom Pacing Guide.*$/i,
  /^\s*Module \d\s*$/,
  /^\s*Grade \d?\s*[:,-]?\s*(Wit & Wisdom Pacing Guide)?\s*Module \d.*$/i,
  /^\s*(Dates: )?[A-Z][a-z]{2,8}\.? \d{1,2},? ?(\d{4})?\s*[-–—]\s*[A-Z][a-z]{2,8}\.? \d{1,2},? \d{4}\s*$/,
  /^\s*Grade ?[K0-9]?\s*$/,
  /^\s*(Texts\s+)?Monday\s+Tuesday\s+Wednesday\s+Thursday\s+Friday.*$/,
  /^\s*Strategies,\s*$/,
  /^\s*Assessments,? ?&? ?(Handouts)?\s*$/,
  /^\s*, & Handouts\s*$/,
  /^\s*& Handouts\s*$/,
  /^\s*Handouts\s*$/,
  /^\s*TWR (Lessons|LESSONS)\s*$/,
];
const WEEK_HEAD = /^\s{0,12}Week (\d{1,2})\b\s*(.*)$/;
const RANGE_LINE = new RegExp(
  `^\\s{0,14}((?:${MONTHS})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?\\s*(?:[-–—]\\s*(?:(?:${MONTHS})\\.?\\s*)?\\d{1,2}(?:st|nd|rd|th)?|[-–—])?)\\s*$`,
  "i",
);
const STOPWORDS = new Set(
  "about after again also because before being could does each from have into just like make many more most much only other over same some such than that their them then there these they this those very what when where which while with would your you are and the for was were will can its not but out how why who min mins lesson lessons learn land wrap welcome launch handout students student text texts".split(
    " ",
  ),
);

/** "April 27-May 1", "September 29- October 3", "August 25-29th" -> { label, start, end } (school year from the module's own dates). */
function weekRange(label, modDates) {
  const m = new RegExp(
    `^(${MONTHS})\\.?\\s+(\\d{1,2})\\w*\\s*(?:[-–—]\\s*(?:(${MONTHS})\\.?\\s*)?(\\d{1,2})\\w*)?$`,
    "i",
  ).exec(label);
  label = label.replace(/([-–—])\s+/g, "$1");
  if (!m || !modDates) return { label, start: null, end: null };
  const startYear = Number(modDates.start.slice(0, 4));
  const endYear = Number(modDates.end.slice(0, 4));
  const startMonth = Number(modDates.start.slice(5, 7));
  const year = (mo) => (mo >= startMonth ? startYear : endYear);
  const sm = monthNum(m[1]);
  const em = m[3] ? monthNum(m[3]) : sm;
  const iso = (mo, d) => `${year(mo)}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { label, start: iso(sm, Number(m[2])), end: iso(em, Number(m[4] || m[2])) };
}

/** Publisher lesson numbers printed in a week's cells ("Lesson 14", "Lessons 14-15"); a TWR lesson is a different series and is skipped. */
function lessonNumbers(words) {
  const out = new Set();
  const re = /\bLessons? (\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?(?!\d)(?!\s*TWR)/g;
  for (const m of words.matchAll(re)) {
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    if (b >= a && b - a <= 4) for (let n = a; n <= b; n++) out.add(n);
  }
  return [...out].sort((x, y) => x - y);
}

/** Distinct content words of a week (4+ letters, lower-case), for matching a lesson's vocabulary to the week that teaches it. */
function weekTerms(words) {
  const seen = new Set();
  for (const w of words.toLowerCase().split(/[^a-z']+/))
    if (w.length >= 4 && !STOPWORDS.has(w)) seen.add(w.replace(/^'+|'+$/g, ""));
  return [...seen].sort().join(" ");
}

/** The first run of words on a line (words at most 3 spaces apart), keeping its indent when asked. */
function leadOf(line, keepIndent = false) {
  const m = /^(\s*)(\S+(?: {1,3}\S+)*)/.exec(line);
  return m ? (keepIndent ? m[1] + m[2] : m[2]) : "";
}

/** Split the weekly table into weeks: number, date range, the left "Texts" column, publisher lesson numbers and the week's words. */
function parseWeeks(text, modDates) {
  const weeks = [];
  let cur = null;
  const headerNumbers = new Set(
    [...text.matchAll(/^\s{0,12}Week (\d{1,2})\b/gm)].map((m) => Number(m[1])),
  );
  for (const page of text.split("\f")) {
    const lines = page.split("\n");
    const head = lines.find((l) => /\bMonday\b/.test(l) && /Tuesday/.test(l));
    const monday = head ? head.indexOf("Monday") : 40;
    // The Texts column ends at the first blank gutter running down the page left of "Monday" (a column almost no line reaches).
    const used = lines.filter((l) => l.trim());
    const reach = (c) => used.filter((l) => l[c] && l[c] !== " ").length;
    let boundary = Math.max(20, monday - 1);
    for (let c = 12; c <= monday + 1; c++) {
      if (
        reach(c) <= Math.max(1, Math.floor(used.length * 0.03)) &&
        reach(c - 1) <= Math.max(2, Math.floor(used.length * 0.06))
      ) {
        boundary = c;
        break;
      }
    }
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      if (/\bMonday\b/.test(line) && /Tuesday/.test(line)) continue;
      if (FURNITURE.some((re) => re.test(line))) continue;
      const wk = WEEK_HEAD.exec(line);
      if (wk && line.indexOf("Week") < monday - 8) {
        cur = { n: Number(wk[1]), label: null, left: [], all: [] };
        weeks.push(cur);
        const rest = leadOf(wk[2]);
        if (RANGE_LINE.test(rest)) cur.label = squash(rest);
        continue;
      }
      if (!cur) continue;
      // A date range sits alone at the left margin; stray cells from other columns can share the line, so read only the lead.
      const lead = leadOf(line, true);
      const range = RANGE_LINE.exec(lead);
      if (range && line.indexOf(range[1]) < 14) {
        let label = squash(range[1]);
        if (/[-–—]$/.test(label)) {
          const next = leadOf(lines[li + 1] || "", true);
          if (
            new RegExp(`^\\s{0,14}(?:${MONTHS})?\\.?\\s*\\d{1,2}(?:st|nd|rd|th)?\\s*$`, "i").test(
              next,
            )
          ) {
            label = squash(`${label} ${next}`);
            li++;
          }
        }
        if (!cur.label && !cur.sawText) {
          cur.label = label;
          continue;
        }
        // A range at the left margin with no "Week N" above it is a week whose label the PDF dropped (Module 3, week 10),
        // but only where the numbering has a hole: otherwise it is a date inside a cell.
        if (cur.sawText && !headerNumbers.has(cur.n + 1)) {
          cur = { n: cur.n + 1, label, left: [], all: [], unlabeled: true };
          weeks.push(cur);
          continue;
        }
        if (/[-–—]$/.test(squash(range[1]))) li--; // the continuation was only a date fragment of a cell; reread it
      }
      if (!line.trim()) {
        if (cur.sawText) cur.left.push("");
        continue;
      }
      cur.sawText = true;
      cur.left.push(line.slice(0, boundary).trim());
      cur.all.push(squash(line));
    }
  }
  return weeks.map((w) => {
    const words = squash(w.all.join(" "));
    const groups = w.left
      .join("\n")
      .split(/\n\s*\n/)
      .map((g) => squash(g.replace(/\n/g, " ")))
      .filter(Boolean);
    return {
      n: w.n,
      ...(w.label ? weekRange(w.label, modDates) : { label: null, start: null, end: null }),
      ...(w.unlabeled ? { numberInferred: true } : {}),
      texts: groups,
      lessonNumbers: lessonNumbers(words),
      terms: weekTerms(words),
      _words: words,
    };
  });
}

/** Words of a page with their positions, from `pdftotext -bbox-layout`. */
function pageWords(file) {
  const xml = execFileSync("pdftotext", ["-bbox-layout", file, "-"], {
    encoding: "utf8",
    maxBuffer: 256e6,
  });
  return xml
    .split("<page ")
    .slice(1)
    .map((page) => {
      const words = [];
      for (const m of page.matchAll(
        /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="[\d.]+">([^<]*)<\/word>/g,
      ))
        words.push({
          x: Number(m[1]),
          x2: Number(m[3]),
          y: Number(m[2]),
          t: m[4]
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">"),
        });
      return words;
    });
}

/**
 * The "Texts" column of each week, read by position: a table column starts where many words start, so the Texts
 * column is every word left of the second such start. Returns one array of text entries per week, in page order.
 */
function weekTexts(file) {
  const blocks = [];
  let cur = null;
  let lastCols = { first: 33, second: 135 };
  for (const words of pageWords(file)) {
    const bins = new Map();
    for (const w of words) bins.set(Math.round(w.x), (bins.get(Math.round(w.x)) || 0) + 1);
    const peaks = [...bins]
      .filter(([, n]) => n >= 6)
      .map(([x]) => x)
      .sort((a, b) => a - b);
    // A sparse page has too few words to show its columns; it reuses the previous page's.
    const found = words.length >= 60 ? peaks : [];
    const first = found[0] ?? lastCols.first;
    const second = found.find((x) => x > first + 45) ?? lastCols.second;
    lastCols = { first, second };
    const left = words.filter((w) => w.x < second - 2).sort((a, b) => a.y - b.y || a.x - b.x);
    // Lines: words within 3pt vertically.
    const lines = [];
    for (const w of left) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.y - w.y) < 3) last.w.push(w);
      else lines.push({ y: w.y, w: [w] });
    }
    let prevY = null;
    let prevHeaderY = -1e9;
    const lineText = (l) =>
      squash(
        l.w
          .sort((a, b) => a.x - b.x)
          .map((w) => w.t)
          .join(" "),
      );
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      let text = lineText(l);
      // A narrow header cell can wrap "Week" and its number onto two lines.
      if (text === "Week" && lines[i + 1] && /^\d{1,2}$/.test(lineText(lines[i + 1])))
        text = `Week ${lineText(lines[++i])}`;
      if (/^Week \d{1,2}\b/.test(text)) {
        const n = Number(/^Week (\d{1,2})/.exec(text)[1]);
        prevHeaderY = l.y;
        prevY = null;
        if (cur?.n === n) continue; // the same week's header repeated at the top of its next page
        cur = { n, entries: [], lines: [] };
        blocks.push(cur);
        continue;
      }
      if (RANGE_LINE.test(text) && cur && l.y - prevHeaderY < 60 && l.y >= prevHeaderY) continue; // the week's date line
      if (
        RANGE_LINE.test(text) &&
        cur &&
        cur.lines.length &&
        !blocks.some((b) => b.n === cur.n + 1)
      ) {
        cur = { n: cur.n + 1, entries: [], lines: [], unlabeled: true };
        blocks.push(cur);
        prevHeaderY = l.y;
        prevY = null;
        continue;
      }
      if (
        /^(Texts|Strategies,?|Assessments|& Handouts|, & Handouts|Handouts|Grade .*Pacing Guide.*|Module \d|Dates:.*|Grade \d?)$/.test(
          text,
        ) ||
        /Wit & Wisdom Pacing Guide/.test(text)
      )
        continue;
      if (!cur) continue;
      if (prevY !== null && l.y - prevY > 19 && cur.lines.length) {
        cur.entries.push(squash(cur.lines.join(" ")));
        cur.lines = [];
      }
      cur.lines.push(text);
      prevY = l.y;
    }
  }
  for (const b of blocks) if (b.lines.length) b.entries.push(squash(b.lines.join(" ")));
  return blocks;
}

/**
 * The Texts column shares the page with clipped cell text the PDF itself garbles ("Less", "Welc"), so an entry is kept
 * only when it reads like a title and credit: a comma or quotation marks, no lesson-cell vocabulary, no stray fragments.
 */
const CELL_WORDS =
  /\b(min|mins|Learn|Lessons?|Students?|Welcome|Land|Wrap|Handouts?|Display|Distribute|Participate|Share|Examine|Read|Reread|Write|Complete|Discuss|Review|Create|Launch|Strategies|Assessments?|Exit|Ticket|Facilitate|Introduce|Provide|Explain|Identify|Analyze|Notice|Wonder|TWR|School’s|Closed|Holiday|Labor|Texts|Monday|Grade|Memorial|Offices|question|carefully|Resources)\b/;
function looksLikeTexts(entries) {
  return [
    ...new Set(
      entries.filter((e) => {
        if (e.length < 6 || e.length > 110 || CELL_WORDS.test(e)) return false;
        if (!/,\s|[“"]/.test(e)) return false;
        const stray = e
          .split(" ")
          .filter(
            (w) =>
              w.length <= 2 &&
              !/^(of|to|in|by|a|A|on|an|My|me|Mr|Ms|Dr|St|J\.|E\.|K\.|L\.|M\.|R\.|S\.|T\.|W\.|H\.|D\.|B\.|C\.|F\.|G\.|N\.|P\.)$/.test(
                w,
              ),
          );
        return stray.length === 0;
      }),
    ),
  ];
}

/** The module's texts: every clean entry once, in first-seen order, dropping an entry another one extends ("X, Author" vs "X, Author, pages 8-13"). */
function anchorTexts(weeks) {
  const all = [...new Set(weeks.flatMap((w) => w.texts))];
  const key = (t) =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  return all
    .filter(
      (t) =>
        !all.some((u) => u !== t && key(u).startsWith(key(t)) && key(u).length > key(t).length),
    )
    .slice(0, 16);
}

function extract(grade, module) {
  const file = guideFile(grade, module);
  const text = pdfText(file);
  let head = squash(headerText(text));
  const repairs = [];
  for (const r of REPAIRS) {
    if (r.grade === grade && r.module === module && head.includes(r.find)) {
      head = head.replace(r.find, r.replace);
      repairs.push({ find: r.find.trim(), replace: r.replace.trim(), why: r.why });
    }
  }
  const intro = between(
    head,
    /Module Introduction:\s*/,
    ENDS.filter((re) => !/Module: /.test(re.source)).concat([/\bEOM Task:/]),
  );
  const eom = between(
    head,
    /EOM Task:\s*/,
    ENDS.filter((re) => !/EOM Task/.test(re.source)),
  );
  const dates = parseDates(head) || parseDates(squash(text.slice(0, 3000)));
  let line = moduleLine(head);
  const badLine = BAD_MODULE_LINE.find((b) => b.grade === grade && b.module === module);
  if (badLine) {
    repairs.push({ find: line, replace: null, why: badLine.why });
    line = null;
  }
  const weeks = parseWeeks(text, dates);
  const blocks = weekTexts(file);
  // Weeks line up by number; a week whose header the position reader missed simply has no texts.
  for (const w of weeks) w.texts = looksLikeTexts(blocks.find((b) => b.n === w.n)?.entries || []);
  return {
    grade,
    module,
    file: path.relative(src, file),
    dates,
    moduleLine: line,
    introduction: intro,
    endOfModuleTask: eom,
    weeks,
    anchorTexts: anchorTexts(weeks),
    moduleZeroInWeeks: weeks
      .filter((w) => /\bModule 0\b|\bModule O\b/.test(w._words))
      .map((w) => w.n),
    repairs,
    _head: head,
    _text: text,
  };
}

/** Provenance: every stored string is a squashed slice of its PDF text (after any listed repair). */
function provenance(rec) {
  const hay = squash(rec._text);
  const headHay = rec._head;
  const bad = [];
  const inText = (s) => !s || hay.includes(s) || headHay.includes(s);
  if (!inText(rec.introduction)) bad.push("introduction");
  if (!inText(rec.endOfModuleTask)) bad.push("endOfModuleTask");
  if (rec.moduleLine && !inText(rec.moduleLine)) bad.push("moduleLine");
  for (const t of rec.anchorTexts)
    for (const word of t.split(" ")) if (word && !hay.includes(word)) bad.push(`anchor: ${word}`);
  for (const w of rec.weeks) {
    for (const word of w._words.split(" "))
      if (word && !hay.includes(word)) bad.push(`week ${w.n}: ${word}`);
    for (const t of w.texts)
      for (const word of t.split(" "))
        if (word && !hay.includes(word)) bad.push(`week ${w.n} text: ${word}`);
  }
  return bad;
}

const records = [];
for (const module of [1, 2, 3])
  for (const grade of GRADES) {
    const rec = extract(grade, module);
    const bad = provenance(rec);
    if (bad.length)
      throw new Error(
        `provenance failed for grade ${grade} module ${module}: ${bad.slice(0, 5).join("; ")}`,
      );
    records.push(rec);
  }

const data = {
  generated_by: "tools/extract-ela-modules.mjs",
  source: "District Wit & Wisdom pacing guides SY 2025-26 (Modules 1-3, grades K-8)",
  note: "Module 0 (Start Strong) is the first weeks of the Module 1 guide; Module 4 was not provided.",
  modules: records.map(({ _head, _text, ...r }) => ({
    ...r,
    weeks: r.weeks.map(({ _words, ...w }) => w),
  })),
};
const body = `${JSON.stringify(data, null, 1)}\n`;
if (check) {
  const have = existsSync(outFile) ? readFileSync(outFile, "utf8") : "";
  if (have !== body) {
    console.error(
      "data/ela-modules.json is stale: run node tools/extract-ela-modules.mjs --src <folder>",
    );
    process.exit(1);
  }
  console.log(`ela-modules.json matches a fresh extraction (${records.length} modules)`);
} else {
  writeFileSync(outFile, body);
  console.log(
    `wrote ${records.length} modules, ${records.reduce((n, r) => n + r.weeks.length, 0)} weeks to ${path.relative(repo, outFile)}`,
  );
}
