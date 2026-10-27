export const CONFIG = Object.freeze({
  manifestUrl: "/data/curriculum-manifest.json",
  standardsUrl: "/data/standards-taxonomy.json",
  defaultLessonId: "1-1",
  lessonConfigPath: (lessonId) => `/lessons/${encodeURIComponent(lessonId)}/config.json`,
});
const text = (value) => typeof value === "string" ? value : value?.en || "";
const normalizeStandard = (value) => String(value || "").toUpperCase().replace(/^(\d+\.[A-Z]+)\.([A-Z])\.(.+)$/, "$1.$3").replace(/([0-9])[A-Z]$/, "$1");
export function validateConfig(manifest) {
  if (!manifest || !Array.isArray(manifest.units) || !Array.isArray(manifest.lessons)) throw new TypeError("Curriculum manifest is missing units or lessons.");
  const ids = new Set();
  for (const lesson of manifest.lessons) {
    if (!lesson.id || !lesson.title || !lesson.lessonPath || !Number.isInteger(lesson.unit)) throw new TypeError(`Invalid lesson record: ${lesson.id || "unnamed"}`);
    if (ids.has(lesson.id)) throw new TypeError(`Duplicate lesson id: ${lesson.id}`);
    ids.add(lesson.id);
  }
  return true;
}
export const Repository = Object.freeze({
  async load(signal) {
    const [response, standardsResponse] = await Promise.all([
      fetch(CONFIG.manifestUrl, { signal, credentials: "same-origin", headers: { Accept: "application/json" } }),
      fetch(CONFIG.standardsUrl, { signal, credentials: "same-origin", headers: { Accept: "application/json" } }),
    ]);
    if (!response.ok) throw new Error(`Curriculum manifest unavailable (${response.status}).`);
    const manifest = await response.json(); validateConfig(manifest);
    const aliases = new Map();
    if (standardsResponse.ok) {
      const taxonomy = await standardsResponse.json();
      for (const entry of taxonomy.standards || []) if (entry.oldId && entry.id) {
        const key = normalizeStandard(entry.id); if (!aliases.has(key)) aliases.set(key, new Set()); aliases.get(key).add(entry.oldId);
      }
    }
    for (const lesson of manifest.lessons) lesson.searchAliases = (lesson.standards || [lesson.standard]).filter(Boolean).flatMap((standard) => [...(aliases.get(normalizeStandard(standard)) || [])]);
    return manifest;
  },
  lessonTitle: text,
  standard(lesson) { return (lesson?.standards || [lesson?.standard]).filter(Boolean).join(" · "); },
  resources(lesson) {
    const r = lesson?.resources || {};
    return [
      { title: "Student notebook", note: "Guided notes · student copy", href: r.guidedNotes?.path || lesson?.printables?.guidedNotes?.en, kind: "notes" },
      { title: "Teacher edition", note: "Teacher notes and facilitation", href: r.teacherNotes?.path || `/lessons/${lesson?.id}/teacher-notes/`, kind: "teacher" },
      { title: "Interactive HTML lab", note: "Lesson experience", href: lesson?.tools?.missionLab || lesson?.lessonPath, kind: "lab" },
      { title: "Printable exit ticket", note: "Lesson reflection and check", href: r.exitTicket?.path || `${lesson?.lessonPath}#reflect`, kind: "print" },
      { title: "Slides", note: "Presentation view", href: r.slides?.path || `/lessons/${lesson?.id}/slides.html`, kind: "slides" },
    ].filter((item) => item.href);
  },
  find(manifest, id) { return manifest?.lessons.find((lesson) => lesson.id === id) || manifest?.lessons.find((lesson) => lesson.id === CONFIG.defaultLessonId) || manifest?.lessons[0] || null; },
  async loadLessonDetail(lessonId, signal) {
    const response = await fetch(CONFIG.lessonConfigPath(lessonId), { signal, credentials: "same-origin", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Lesson resources unavailable (${response.status}).`);
    const detail = await response.json();
    return { vocabulary: Array.isArray(detail.vocabulary) ? detail.vocabulary : [] };
  },
  search(manifest, query, limit = 9) {
    const q = String(query || "").trim().toLowerCase(); if (!q) return [];
    const tokens = q.split(/\s+/);
    return manifest.lessons.map((lesson) => {
      const content = [lesson.id, text(lesson.title), text(lesson.titleEs), lesson.standard, ...(lesson.standards || []), ...(lesson.searchAliases || []), ...(lesson.supports?.vocabulary || []), ...(lesson.teacher?.misconceptions || []), lesson.topic, lesson.objective].join(" ").toLowerCase();
      const score = tokens.reduce((n, t) => n + (content.includes(t) ? (lesson.id === t ? 6 : 1) : 0), 0);
      return { lesson, score };
    }).filter((x) => x.score).sort((a, b) => b.score - a.score || a.lesson.unit - b.lesson.unit || a.lesson.lesson - b.lesson.lesson).slice(0, limit).map((x) => x.lesson);
  },
});
