import { lessonLinkFields, loadLessonLinks } from "../../../../_lib/bcpss/lesson-links.js";
import { loadLessons, summarize } from "../../../../_lib/bcpss/lessons.js";
import { badRequest, handler, json, notFound } from "../../../../_lib/http.js";

export const onRequest = handler({
  methods: ["GET"],
  async handle({ params }) {
    const unitId = String(params?.unitId || "").trim();
    if (!/^[a-zA-Z0-9_-]{2,80}$/.test(unitId)) return badRequest("Invalid unitId parameter.");
    const set = await loadLessons(unitId);
    if (!set) return notFound(`No lessons for unit "${unitId}".`);
    const links = await loadLessonLinks(unitId);
    return json(
      {
        unit_id: unitId,
        version: set.version,
        source: set.source,
        draft_notice:
          set.source === "draft_standards_based" ? "Draft: align to your pacing guide" : null,
        lessons: set.lessons.map((l) => ({ ...summarize(l), ...lessonLinkFields(links, l.id) })),
      },
      200,
      { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    );
  },
});
