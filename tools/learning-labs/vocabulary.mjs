// Lesson configs sometimes list the lesson's own title as a vocabulary word
// ("Understand Percent"). A lesson name is not a term, so it stays out of the
// word bank and the matching game. A title that is also a real term
// ("Least Common Multiple", "Prime Factorization") is kept.
const LESSON_NAME_RE =
  /^(?:add|apply|compare|convert|describe|determine|divide|find|graph|multiply|reflect|simplify|solve|understand|use|write)\b|\bproblem solving$/i;

export function isLessonName(term, lessonTitles) {
  const t = term.trim().toLowerCase();
  return lessonTitles.has(t) && (LESSON_NAME_RE.test(t) || t.split(/\s+/).length >= 4);
}

// "The Distributive Property" and "Distributive property" are one word-bank entry.
export const vocabKey = (term) =>
  term
    .trim()
    .toLowerCase()
    .replace(/^the\s+/, "");
