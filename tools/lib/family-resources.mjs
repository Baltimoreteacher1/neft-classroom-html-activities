// Rules for data/homework-external-resources.json, shared by the gate
// (tools/validate-family-resources.mjs) and its unit test. Pure and offline: the gate never
// touches the network, it reads the verification that scripts/verify-family-resources.mjs recorded.
import {
  MAX_LINKS,
  renderExternalResourcesSection,
  resourceLessonId,
  resourcesForLesson,
} from "../../scripts/homework-external-resources.mjs";

export const MAX_AGE_DAYS = 180;
const DAY = 24 * 60 * 60 * 1000;

/** Titles that promise a whole course or a general page rather than a specific one. */
export const GENERIC_TITLE =
  /\b(overview|general|resumen|course|curso|all about|todo sobre|grade\s*\d|\d(st|nd|rd|th)\s+grade|\d\.?\s*º?\s*grado|cualquier|introduction to math|intro to math|math basics|matemáticas básicas)\b/i;

/** A Khan Academy content page ends /v/<slug> (video). A course, unit or lesson index does not. */
const VIDEO_PATH = /\/v\/[^/]+\/?$/;
const NOT_FOUND = /page not found|página no encontrada|oops|¡ups/i;

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const lastSlug = (u) => new URL(u).pathname.split("/").filter(Boolean).pop();
const parse = (u) => {
  try {
    return new URL(u);
  } catch {
    return null;
  }
};
const isIsoDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "") && !Number.isNaN(Date.parse(s));

/** One resource against every rule that does not depend on a lesson. */
export function checkResource(id, r, today) {
  const bad = [];
  if (!r || typeof r !== "object") return [`${id}: not an object`];
  if (r.source !== "Khan Academy") bad.push(`${id}: source must be "Khan Academy"`);
  if (r.kind !== "video")
    bad.push(`${id}: kind must be "video" (the page promises videos), got "${r.kind}"`);
  for (const f of ["titleEn", "titleEs"]) if (!isStr(r[f])) bad.push(`${id}: missing ${f}`);
  if (isStr(r.titleEs) && isStr(r.titleEn) && r.titleEs.trim() === r.titleEn.trim())
    bad.push(`${id}: the Spanish title is a copy of the English one`);
  for (const f of ["titleEn", "titleEs"])
    if (isStr(r[f]) && GENERIC_TITLE.test(r[f])) bad.push(`${id}: ${f} is generic ("${r[f]}")`);
  if (!Array.isArray(r.topics) || !r.topics.length || !r.topics.every(isStr))
    bad.push(`${id}: needs a non-empty topics list`);

  const url = parse(r.url);
  if (!url || url.protocol !== "https:" || !/^(www\.)?khanacademy\.org$/.test(url.hostname))
    bad.push(`${id}: url must be an https khanacademy.org page`);
  else if (!VIDEO_PATH.test(url.pathname))
    bad.push(
      `${id}: url is not a specific video page (a course, unit or lesson index is a general page): ${r.url}`,
    );

  const v = r.verification;
  if (!v || typeof v !== "object") {
    bad.push(`${id}: never verified`);
    return bad;
  }
  if (v.ok !== true) bad.push(`${id}: verification failed${v.error ? ` (${v.error})` : ""}`);
  if (v.status !== 200) bad.push(`${id}: recorded status is ${v.status}, not 200`);
  if (!isIsoDate(v.verifiedOn)) bad.push(`${id}: verifiedOn is not a date`);
  else {
    const age = (Date.parse(today) - Date.parse(v.verifiedOn)) / DAY;
    if (age < 0) bad.push(`${id}: verifiedOn ${v.verifiedOn} is in the future`);
    else if (age > MAX_AGE_DAYS)
      bad.push(
        `${id}: verified ${Math.floor(age)} days ago (max ${MAX_AGE_DAYS}); run scripts/verify-family-resources.mjs`,
      );
  }
  if (v.finalUrl !== r.url)
    bad.push(`${id}: url is not the page verification landed on (${v.finalUrl})`);
  if (!isStr(v.pageTitle) || NOT_FOUND.test(v.pageTitle))
    bad.push(`${id}: recorded page title is empty or a not-found page`);
  if (!isStr(v.heading) || NOT_FOUND.test(v.heading))
    bad.push(`${id}: recorded page heading is empty or a not-found page`);

  if (r.urlEs !== undefined) {
    const es = parse(r.urlEs);
    if (!es || es.hostname !== "es.khanacademy.org")
      bad.push(`${id}: urlEs must be on es.khanacademy.org`);
    else if (url && lastSlug(r.urlEs) !== lastSlug(r.url))
      bad.push(`${id}: urlEs is a different page than url`);
    if (!v.es || v.es.ok !== true || v.es.finalUrl !== r.urlEs)
      bad.push(`${id}: urlEs has no matching verification`);
    else if (
      isIsoDate(v.es.verifiedOn) &&
      (Date.parse(today) - Date.parse(v.es.verifiedOn)) / DAY > MAX_AGE_DAYS
    )
      bad.push(`${id}: Spanish page verification is stale`);
  }
  return bad;
}

/**
 * Judge `data` against `ctx`.
 *   ctx.manifestIds   every lesson in the launch manifest
 *   ctx.pageIds       every lesson folder that has a homework page
 *   ctx.unit10        ids of the lessons that are not taught
 *   ctx.templateSource  text of the homework page template, for the claim check
 *   ctx.render(links) the renderer under test (defaults to the real one)
 */
export function evaluateResources(
  data,
  ctx,
  { today, render = renderExternalResourcesSection } = {},
) {
  const problems = [];
  const resources = data?.resources || {};
  const lessons = data?.lessons || {};
  if (data?.schemaVersion !== 1) problems.push("schemaVersion must be 1");

  for (const [id, r] of Object.entries(resources)) problems.push(...checkResource(id, r, today));

  // Coverage: every lesson says what it teaches, even when nothing is linked.
  for (const id of ctx.manifestIds)
    if (!lessons[id]) problems.push(`lesson ${id} declares no topics or resources`);
  for (const id of ctx.pageIds)
    if (!lessons[id] && !lessons[resourceLessonId(id)])
      problems.push(`homework page ${id} has no entry for ${resourceLessonId(id)}`);
  const known = new Set([...ctx.manifestIds, ...ctx.pageIds]);
  for (const id of Object.keys(lessons))
    if (!known.has(id)) problems.push(`lesson ${id} is declared but is not a lesson`);

  const linked = new Set();
  for (const [id, lesson] of Object.entries(lessons)) {
    if (!Array.isArray(lesson.topics) || !lesson.topics.length || !lesson.topics.every(isStr))
      problems.push(`lesson ${id}: needs a non-empty topics list`);
    const list = lesson.resources;
    if (!Array.isArray(list)) {
      problems.push(`lesson ${id}: resources must be a list`);
      continue;
    }
    if (list.length > MAX_LINKS)
      problems.push(`lesson ${id}: ${list.length} links (max ${MAX_LINKS})`);
    if (new Set(list).size !== list.length)
      problems.push(`lesson ${id}: the same resource is listed twice`);
    if (!list.length && !(isStr(lesson.reason) && lesson.reason.trim().length >= 20))
      problems.push(`lesson ${id}: no links needs a written reason (20+ characters)`);
    if (ctx.unit10?.has(id) && list.length)
      problems.push(`lesson ${id}: Unit 10 is not taught and must not link`);
    for (const rid of list) {
      const r = resources[rid];
      if (!r) {
        problems.push(`lesson ${id}: unknown resource ${rid}`);
        continue;
      }
      linked.add(rid);
      const share = (r.topics || []).filter((t) => (lesson.topics || []).includes(t));
      if (!share.length)
        problems.push(
          `lesson ${id} (${(lesson.topics || []).join(", ")}) links "${r.titleEn}" which teaches ${(r.topics || []).join(", ")}: topic mismatch`,
        );
    }
  }
  for (const rid of Object.keys(resources))
    if (!linked.has(rid)) problems.push(`resource ${rid} is linked by no lesson`);

  // What a family sees: the claim and the links stand or fall together.
  for (const id of Object.keys(lessons)) {
    const links = resourcesForLesson(id, data);
    const html = render(links);
    const claim = /specific<\/strong> videos/.test(html);
    const anchors = (html.match(/class="external-resource-link/g) || []).length;
    if (!links.length && html.trim() !== "")
      problems.push(`lesson ${id}: renders a links section with no links`);
    if (!links.length && claim)
      problems.push(`lesson ${id}: renders the "specific videos" claim with no link`);
    if (links.length && !claim) problems.push(`lesson ${id}: links render without the claim`);
    if (links.length && anchors !== links.length * 2)
      problems.push(
        `lesson ${id}: ${anchors} anchors for ${links.length} links (one per language each)`,
      );
  }

  // The template must use the one renderer, not carry its own copy of the promise.
  if (ctx.templateSource !== undefined) {
    if (/These links go to/.test(ctx.templateSource))
      problems.push(
        'the page template writes the "specific videos" claim itself; it belongs to renderExternalResourcesSection',
      );
    if (!/renderExternalResourcesSection\(/.test(ctx.templateSource))
      problems.push("the page template does not call renderExternalResourcesSection");
  }

  const stats = {
    resources: Object.keys(resources).length,
    withSpanish: Object.values(resources).filter((r) => r.urlEs).length,
    lessons: Object.keys(lessons).length,
    linkedLessons: Object.values(lessons).filter((l) => l.resources?.length).length,
    links: Object.values(lessons).reduce((n, l) => n + (l.resources?.length || 0), 0),
    unlinked: Object.entries(lessons)
      .filter(([, l]) => !l.resources?.length)
      .map(([id]) => id),
  };
  return { problems, stats };
}
