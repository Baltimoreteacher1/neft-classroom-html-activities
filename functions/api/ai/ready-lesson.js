import {
  buildLessonPrompt,
  extractStructuredPlan,
  lessonPlanSchema,
  validateLessonRequest,
} from "./lesson-plan.js";
import { buildWorkersLesson } from "../../_lib/workers-lesson.js";

export async function onRequestPost(context) {
  try {
    const apiKey = context.env.OPENAI_API_KEY;
    if (!apiKey && !context.env.AI) {
      return json({ error: "OPENAI_API_KEY is not configured in Cloudflare secrets yet." }, 500);
    }

    const body = await context.request.json().catch(() => null);
    const validation = validateLessonRequest(body);
    if (!validation.ok) return json({ error: validation.message }, 400);
    if (!apiKey) {
      try {
        return json(
          await buildWorkersLesson(
            context.env.AI,
            buildLessonPrompt(body),
            lessonPlanSchema,
          ),
        );
      } catch {
        return json(
          {
            error:
              "The AI could not fit this source into the lesson-plan format. Shorten the source slightly and try again.",
          },
          502,
        );
      }
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: context.env.OPENAI_LESSON_MODEL || "gpt-5.5",
        input: [
          {
            role: "system",
            content:
              "You are the Neft Teacher lesson-plan engine. Build rigorous, source-faithful, classroom-ready lessons and correct answer keys.",
          },
          { role: "user", content: buildLessonPrompt(body) },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "ready_lesson_plan",
            description:
              "A complete Neft Teacher Ready lesson plan for preview and DOCX export.",
            strict: true,
            schema: lessonPlanSchema,
          },
          verbosity: "medium",
        },
        reasoning: { effort: "medium" },
        max_output_tokens: 16_000,
        store: false,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return json({ error: data.error?.message || "OpenAI request failed." }, response.status);
    }

    return json({
      plan: extractStructuredPlan(data),
      model: data.model || context.env.OPENAI_LESSON_MODEL || "gpt-5.5",
    });
  } catch (err) {
    return json({ error: err.message || "AI lesson generation failed." }, 500);
  }
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
