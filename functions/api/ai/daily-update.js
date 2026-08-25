/* =============================================================================
 * POST /api/ai/daily-update — short student-facing daily checklist (Noam).
 * -----------------------------------------------------------------------------
 * Spends OPENAI_API_KEY. This is a student planner helper, not a teacher
 * surface, so it is not gated on TEACHER_KEY. The shared handler supplies the
 * floor every sibling AI route already had: per-IP rate limit, body cap, and
 * a JSON 500 that never echoes provider or exception text.
 * ============================================================================= */
import { handler, json } from "../../_lib/http.js";

const clip = (v, n) => String(v ?? "").slice(0, n);

export const onRequest = handler({
  methods: ["POST"],
  rateLimit: { max: 20, windowMs: 60_000 },
  maxBodyBytes: 32_000,
  async handle({ env, body }) {
    if (!env.OPENAI_API_KEY) return json({ error: "AI is not configured" }, 503);

    const incoming = body && typeof body === "object" ? body : {};
    const assignments = Array.isArray(incoming.assignments)
      ? incoming.assignments.slice(0, 12)
      : [];
    const classes = Array.isArray(incoming.classes) ? incoming.classes.slice(0, 20) : [];
    const settings =
      incoming.settings && typeof incoming.settings === "object" ? incoming.settings : {};
    const className = (id) =>
      clip((classes.find((c) => c && c.id === id) || {}).name, 80) || "Class";

    const safePayload = {
      studentName: clip(settings.studentName, 40) || "Noam",
      tone: clip(settings.aiTone, 40) || "calm",
      focus: clip(settings.aiFocus, 80) || "short checklist",
      goal: clip(incoming.goal, 200),
      classes: classes.map((c) => ({
        name: clip(c?.name, 80),
        teacher: clip(c?.teacher, 80),
      })),
      assignments: assignments.map((a) => ({
        title: clip(a?.title, 160),
        className: className(a?.classId),
        due: clip(a?.due, 40),
        priority: clip(a?.priority, 20) || "Medium",
        status: clip(a?.status, 40) || "Not Started",
        notes: clip(a?.notes, 240),
      })),
    };

    const prompt = `Create a very short, student-friendly daily school update for a middle-school student.\n\nRules:\n- Use calm, encouraging language.\n- Do not invent assignments.\n- Prioritize due today, overdue, and high priority work.\n- Output exactly 4 sections: Today First, Next, Ask For Help, Encouragement.\n- Keep it easy to read.\n\nData:\n${JSON.stringify(safePayload, null, 2)}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || "gpt-4.1-mini",
        input: prompt,
        max_output_tokens: 450,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return json({ error: "AI request failed" }, 502);

    const update = extractText(data) || "No update returned.";
    return { update };
  },
});

function extractText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}
