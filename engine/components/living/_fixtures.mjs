// Shared by the plane-* tests: the authored configs of the coordinate cluster, read from the lessons.
import { readFileSync } from "node:fs";

export const lessonScene = (id) =>
  JSON.parse(readFileSync(new URL(`../../../lessons/${id}/config.json`, import.meta.url), "utf8"))
    .launch.conceptIntro.livingScene;

/** Every {en, es} copy a play can produce, as flat strings, with functions called on sample args. */
export function strings(value, lang, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) strings(v, lang, out);
  else if (value && typeof value === "object") {
    if (typeof value.en === "string" && typeof value.es === "string") out.push(value[lang]);
    else for (const v of Object.values(value)) strings(v, lang, out);
  }
  return out;
}

/** English words that must never survive in Spanish text. */
export const ENGLISH = /\b(the|and|your|which|how far|units?|steps?|right|left|axis|sits|lands|reflection)\b/i;
