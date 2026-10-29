/**
 * lesson-identity.mjs: how a lesson names itself on paper, in every family-facing surface.
 *
 * ONE standard code per lesson: `lessons/<id>/config.json` `standard`, copied verbatim. The code that the publisher
 * Word files and the district pacing crosswalk (`curriculum/district_scope_sequence_crosswalk.json`) carry is a
 * different taxonomy (CCSS-style "6.RP.A.3c" for what the site calls "6.AT.4"). It is district-pacing data and is never
 * printed on a family surface. Mapping and rules: docs/family-homework-v3/standards.md.
 *
 * ONE name per lesson: ids stay `4-5` / `4-5-part2` (folders, URLs, storage keys); print says "Lesson 4.5" and, for
 * a second or third session, "Lesson 4.5 · Session 2".
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadLessonConfig, REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";

const NOTES_DIR = join(REPO_ROOT, "data", "family-homework-notes");
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
let titlesEs;

/** Pages that are not a numbered lesson: their own print names (EN, ES). */
const UNNUMBERED = {
  "1-practice": { en: "Unit 1 · Practice", es: "Unidad 1 · Práctica" },
  "1-review": { en: "Pre-Unit 1 · Review", es: "Antes de la Unidad 1 · Repaso" },
  "6-1-6-2-practice": {
    en: "Lessons 6.1–6.2 · Extra practice",
    es: "Lecciones 6.1–6.2 · Práctica adicional",
  },
};
const UNNUMBERED_TITLE = {
  "1-practice": { en: "Unit 1 Practice", es: "Práctica de la Unidad 1" },
  "1-review": { en: "Review Before Unit 1", es: "Repaso antes de la Unidad 1" },
  "6-1-6-2-practice": {
    en: "Fraction Division Practice",
    es: "Práctica de división de fracciones",
  },
};

/** `{ base, session }` for "4-5" (1), "4-5-part2" (2), "3-2-part3" (3). */
export function parseLessonId(id) {
  const m = /^(.*?)(?:-part(\d))?$/.exec(String(id));
  return { base: m[1], session: m[2] ? Number(m[2]) : 1 };
}

/** The lesson's one standard code, straight from its config. Throws when a lesson has none: no silent fallback. */
export function lessonStandard(id) {
  const code = String(loadLessonConfig(id).standard ?? "").trim();
  if (!code) throw new Error(`lesson ${id}: config.json has no "standard"`);
  return code;
}

/** "Lesson 4.5 · Session 2" / "Lección 4.5 · Sesión 2". */
export function lessonLabel(id, lang = "en") {
  const { base, session } = parseLessonId(id);
  const named = UNNUMBERED[base] ?? UNNUMBERED[`${base}`];
  const sessionWord = lang === "es" ? "Sesión" : "Session";
  const tail = session > 1 ? ` · ${sessionWord} ${session}` : "";
  if (named) return `${named[lang]}${tail}`;
  const m = /^(\d+)-(\d+)$/.exec(base);
  if (!m) throw new Error(`lessonLabel: cannot name lesson id ${JSON.stringify(id)}`);
  return `${lang === "es" ? "Lección" : "Lesson"} ${m[1]}.${m[2]}${tail}`;
}

/** The lesson's title in print: the base lesson's name in both languages (a session says its session in the label). */
export function lessonTitle(id, lang = "en") {
  const { base } = parseLessonId(id);
  if (UNNUMBERED_TITLE[base]) return UNNUMBERED_TITLE[base][lang];
  if (lang === "en") return String(loadLessonConfig(base).title);
  titlesEs ??= readJson(join(REPO_ROOT, "data", "family-homework-titles-es.json"));
  const es = titlesEs[id] ?? titlesEs[base];
  if (!es) throw new Error(`lessonTitle: no Spanish title for ${id}`);
  return es;
}

export const unitNumber = (id) => Number(/^(\d+)-/.exec(String(id))?.[1] ?? 0);

/** The family sidecar (`data/family-homework-notes/<id>.json`). */
export const familySidecar = (id) => readJson(join(NOTES_DIR, `${id}.json`));

/** The public address of the interactive page a printed sheet points to. */
export const SITE = "https://eduwonderlab.com";
export const interactiveUrl = (id) => `${SITE}/lessons/${id}/homework.html`;
/** The same address as a family would type or read it (no scheme). */
export const shortLink = (id) => interactiveUrl(id).replace(/^https:\/\//, "");
