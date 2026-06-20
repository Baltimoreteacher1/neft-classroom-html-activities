const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

export async function buildWorkersLesson(ai, prompt, schema) {
  const result = await ai.run(MODEL, {
    messages: [
      {
        role: "system",
        content:
          "You are the Neft Teacher lesson-plan engine. Build rigorous, source-faithful, classroom-ready lessons and correct answer keys.",
      },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: schema,
    },
    max_tokens: 8_500,
    temperature: 0.2,
  });
  const plan =
    result?.response && typeof result.response === "object"
      ? result.response
      : JSON.parse(result?.response || "");
  return { plan, model: MODEL };
}
