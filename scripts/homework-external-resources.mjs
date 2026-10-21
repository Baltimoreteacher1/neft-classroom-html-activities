/**
 * "Learn more online" links for the family homework pages.
 *
 * The promise on the page is "these links go to specific videos about tonight's
 * topic — not general math pages". This module is what keeps it true:
 *
 *   - data/homework-external-resources.json declares, per lesson, the topics the
 *     lesson teaches and the (at most two) resources that teach them;
 *   - a resource is only offered when its recorded verification says the page
 *     really exists (scripts/verify-family-resources.mjs);
 *   - a lesson with nothing on-topic gets no links, and then no sentence about
 *     links either: renderExternalResourcesSection() returns "" for no links.
 *
 * It replaces a topic guesser (detectVisualTopic) that sent the percent lessons
 * to "Intro to ratios" and 16 pages to a "Grade 6 math overview".
 *
 * Gate: tools/validate-family-resources.mjs.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const RESOURCES_PATH = join(root, "data", "homework-external-resources.json");
export const MAX_LINKS = 2;

/** "3-2-part3" / "4-3-part2" / "5-1-flagship" -> the core lesson that owns the links. */
export function resourceLessonId(lessonId) {
  return String(lessonId || "")
    .replace(/-flagship$/, "")
    .replace(/-part\d+$/, "");
}

let cache = null;
export function loadResources(path = RESOURCES_PATH) {
  if (path === RESOURCES_PATH && cache) return cache;
  const data = existsSync(path)
    ? JSON.parse(readFileSync(path, "utf8"))
    : { resources: {}, lessons: {} };
  if (path === RESOURCES_PATH) cache = data;
  return data;
}

/** A resource may be offered only when its recorded verification passed. */
export const isVerified = (resource) => resource?.verification?.ok === true;

/**
 * The links for one lesson, in display order: [{ source, kind, titleEn, titleEs,
 * url, urlEs }]. `urlEs` is the verified es.khanacademy.org page, or "" when
 * there is none (the Spanish-mode link then points at the English page).
 */
export function resourcesForLesson(lessonId, data = loadResources()) {
  const entry = data.lessons?.[resourceLessonId(lessonId)] ?? data.lessons?.[lessonId];
  if (!entry) return [];
  return (entry.resources || [])
    .map((id) => data.resources?.[id])
    .filter(isVerified)
    .slice(0, MAX_LINKS)
    .map((r) => ({
      source: r.source,
      kind: r.kind,
      titleEn: r.titleEn,
      titleEs: r.titleEs,
      url: r.url,
      urlEs: r.urlEs && r.verification?.es?.ok === true ? r.urlEs : "",
    }));
}

export function getExternalResources(config, lessonId) {
  return resourcesForLesson(lessonId || config?.lessonId || config?.id);
}

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

/**
 * The claim and the links, together or not at all. The sentence is rendered here
 * and only here, so it can never appear without a link under it.
 */
export function renderExternalResourcesSection(links) {
  if (!Array.isArray(links) || !links.length) return "";
  const items = links
    .map((l) => {
      const open = (cls, lang, href, source, title) =>
        `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" class="external-resource-link ${cls}"${lang ? ` lang="${lang}"` : ""}>` +
        `<span class="ext-source">${esc(source)}</span>` +
        `<span class="ext-title-${cls.slice(5)}">${esc(title)}</span></a>`;
      const es = l.urlEs
        ? open("lang-es", "es", l.urlEs, `${l.source} en español`, l.titleEs)
        : open("lang-es", "es", l.url, `${l.source} (en inglés)`, l.titleEs);
      return `
            <li>
              ${open("lang-en", "", l.url, l.source, l.titleEn)}
              ${es}
            </li>`;
    })
    .join("");
  return `
        <p class="bilingual-block external-resource-claim">
          <span class="lang-en">These links go to <strong>specific</strong> videos about tonight's topic — not general math pages.</span>
          <span class="lang-es" lang="es">Estos enlaces van a videos <strong>específicos</strong> sobre el tema de hoy — no a páginas generales.</span>
        </p>
        <ul class="external-resource-list">${items}
        </ul>`;
}
