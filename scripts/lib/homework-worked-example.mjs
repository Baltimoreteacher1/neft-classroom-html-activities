// The lesson's own worked example, offered to a family as Hint 2 on the homework page.
// Its own module so a test can import it without running the page generator.

const numbersIn = (s) => new Set(String(s).match(/\d+(?:\.\d+)?/g) || []);

/**
 * A config's worked example is sometimes another lesson's (1-2, 1-3 and 1-5-part2 all carried 1-1's
 * "estimate the peas" example). A family page must not print it as a hint. When the example states two or
 * more numbers and none of them appears anywhere in this lesson's own family sidecar (big idea, concept
 * steps, try-together, bridge), it is not this lesson's example.
 */
export function belongsToLesson(config, title, lines) {
  const notes = config.familyNotes;
  if (!notes) return true;
  const mine = numbersIn(`${title || ""} ${lines.join(" ")}`);
  if (mine.size < 2) return true;
  const theirs = numbersIn(
    JSON.stringify([
      notes.bigIdea,
      notes.conceptSteps,
      notes.tryTogether,
      notes.bridge,
      notes.learningTonight,
    ]),
  );
  return [...mine].some((n) => theirs.has(n));
}

/**
 * The lesson's own authored worked example (its "Watch Me"), offered to a family as Hint 2.
 * It is a DIFFERENT problem from tonight's practice by construction, and is dropped when any
 * practice stem appears inside it, so a hint can never print the problem it is hinting at.
 * Null when the lesson authored none.
 */
export function workedExampleFor(config, problems = []) {
  const iDo = config.launch?.conceptIntro?.iDo || config.explore?.conceptIntro?.iDo;
  if (!iDo || !Array.isArray(iDo.lines) || iDo.lines.length === 0) return null;
  const lines = iDo.lines.map(String);
  const squash = (t) =>
    String(t)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  const text = squash(`${iDo.title || ""} ${lines.join(" ")}`);
  const echoes = problems.some((q) => {
    const stem = squash(q?.stem || q?.question || "");
    return stem.length >= 12 && text.includes(stem);
  });
  if (echoes) return null;
  if (!belongsToLesson(config, iDo.title, lines)) return null;
  const linesEs =
    Array.isArray(iDo.linesEs) && iDo.linesEs.length === lines.length
      ? iDo.linesEs.map(String)
      : null;
  return {
    title: String(iDo.title || ""),
    titleEs: iDo.titleEs ? String(iDo.titleEs) : "",
    lines,
    linesEs,
  };
}
