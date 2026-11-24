import { loadLesson } from "../../../_lib/bcpss/lessons.js";
import { badRequest, handler, json, notFound } from "../../../_lib/http.js";

export const onRequest = handler({
  methods: ["GET"],
  async handle({ params }) {
    const lessonId = String(params?.lessonId || "").trim();
    if (!/^[a-z0-9-]{6,40}$/.test(lessonId)) return badRequest("Invalid lessonId parameter.");
    const lesson = await loadLesson(lessonId);
    if (!lesson) return notFound(`Lesson "${lessonId}" not found.`);
    return json(lesson, 200, {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    });
  },
});
