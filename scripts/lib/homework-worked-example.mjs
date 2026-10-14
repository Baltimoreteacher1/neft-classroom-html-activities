// The lesson's own worked example, offered to a family as Hint 2 on the homework page.
// Its own module so a test can import it without running the page generator.

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
