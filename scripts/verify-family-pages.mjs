import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const lessonDirPattern = /^(\d+)-(\d+)(-flagship)?$/;
const failures = [];

function fail(message) {
  failures.push(message);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function lessonSort(a, b) {
  const [, au, al, af] = a.match(lessonDirPattern);
  const [, bu, bl, bf] = b.match(lessonDirPattern);
  return Number(au) - Number(bu) || Number(al) - Number(bl) || (af ? 1 : 0) - (bf ? 1 : 0);
}

function expectedLessonIds() {
  const lessonsRoot = join(root, "lessons");
  return readdirSync(lessonsRoot)
    .filter((entry) => lessonDirPattern.test(entry))
    .filter((entry) => existsSync(join(lessonsRoot, entry, "config.json")))
    .sort(lessonSort);
}

function assertIncludes(text, needle, label) {
  if (!text.includes(needle)) {
    fail(`${label} is missing "${needle}"`);
  }
}

function localTargetExists(href) {
  if (!href.startsWith("/")) return true;
  const target = href.split("#")[0].split("?")[0];
  if (!target) return true;
  const relative = target.replace(/^\/+/, "");
  const fullPath = join(root, relative);
  if (target.endsWith("/")) {
    return existsSync(join(fullPath, "index.html"));
  }
  return existsSync(fullPath);
}

function checkLocalLinks(filePath, html, label) {
  const hrefPattern = /href="([^"]+)"/g;
  for (const match of html.matchAll(hrefPattern)) {
    const href = match[1];
    if (
      href.startsWith("#") ||
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      continue;
    }

    if (!localTargetExists(href)) {
      fail(`${label} has a broken local link: ${href} (${filePath})`);
    }
  }
}

const expectedIds = expectedLessonIds();
const dataPath = join(root, "src", "data", "family-lessons.json");
let familyLessons = [];

if (!existsSync(dataPath)) {
  fail("Missing src/data/family-lessons.json");
} else {
  familyLessons = readJson(dataPath);
  if (!Array.isArray(familyLessons)) {
    fail("src/data/family-lessons.json must contain an array");
  } else {
    const dataIds = new Set(familyLessons.map((lesson) => lesson.lessonId));
    if (familyLessons.length !== expectedIds.length) {
      fail(`Expected ${expectedIds.length} family lesson records, found ${familyLessons.length}`);
    }
    for (const lessonId of expectedIds) {
      if (!dataIds.has(lessonId)) {
        fail(`Missing family lesson data for ${lessonId}`);
      }
    }

    for (const lesson of familyLessons) {
      for (const field of ["lessonId", "title", "standard", "objective", "unit", "unitName", "topic", "resources"]) {
        if (lesson[field] === undefined || lesson[field] === null || lesson[field] === "") {
          fail(`Lesson ${lesson.lessonId || "(unknown)"} is missing data field ${field}`);
        }
      }
      if (!Array.isArray(lesson.resources)) {
        fail(`Lesson ${lesson.lessonId || "(unknown)"} resources must be an array`);
      }
      if (lesson.lessonId?.endsWith("-flagship") && lesson.variantLabel !== "Flagship / Enrichment Version") {
        fail(`Lesson ${lesson.lessonId} must use the exact flagship label`);
      }
    }
  }
}

const indexPath = join(root, "families", "index.html");
if (!existsSync(indexPath)) {
  fail("Missing families/index.html");
} else {
  const indexHtml = readFileSync(indexPath, "utf8");
  assertIncludes(indexHtml, "Family Math Support", "families/index.html");
  assertIncludes(indexHtml, "Grade 6 Math help for families, parents, and guardians.", "families/index.html");
  assertIncludes(indexHtml, "family-search", "families/index.html");
  assertIncludes(indexHtml, "unit-filter", "families/index.html");
  assertIncludes(indexHtml, "topic-filter", "families/index.html");
  for (const lessonId of expectedIds) {
    assertIncludes(indexHtml, `/families/lessons/${lessonId}/`, "families/index.html");
  }
  checkLocalLinks(indexPath, indexHtml, "families/index.html");
}

const requiredSections = [
  "What Your Child Is Learning",
  "Why This Matters",
  "What It May Look Like In Class",
  "How You Can Help At Home",
  "Apoyo para familias en español",
  "Qué está aprendiendo su hijo/a",
  "Por qué es importante",
  "Cómo puede ayudar en casa",
  "Key Vocabulary",
  "Try It Together",
];

const lessonsById = new Map(familyLessons.map((lesson) => [lesson.lessonId, lesson]));
for (const lessonId of expectedIds) {
  const pagePath = join(root, "families", "lessons", lessonId, "index.html");
  if (!existsSync(pagePath)) {
    fail(`Missing families/lessons/${lessonId}/index.html`);
    continue;
  }
  if (!statSync(pagePath).isFile()) {
    fail(`families/lessons/${lessonId}/index.html is not a file`);
    continue;
  }

  const pageHtml = readFileSync(pagePath, "utf8");
  for (const section of requiredSections) {
    assertIncludes(pageHtml, section, `families/lessons/${lessonId}/index.html`);
  }

  const data = lessonsById.get(lessonId);
  for (const resource of data?.resources || []) {
    assertIncludes(pageHtml, `href="${resource.href}"`, `families/lessons/${lessonId}/index.html`);
  }
  checkLocalLinks(pagePath, pageHtml, `families/lessons/${lessonId}/index.html`);
}

if (failures.length) {
  console.error("Family page verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Family page verification passed for ${expectedIds.length} lessons.`);
