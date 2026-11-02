// The Family Math 2.0 URL contract (see docs/family-math-2-pages-notes.md): one place builds every link between its pages.
const query = (values) =>
  new URLSearchParams(
    Object.entries(values)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => [k, String(v)]),
  ).toString();

export function playUrl({
  game,
  skill,
  level,
  rounds,
  seed,
  plan,
  grade,
  profile,
  lang,
  mode,
  resume,
} = {}) {
  return `play.html?${query({ game, skill, level, rounds, seed, plan, grade, profile, lang, mode, resume: resume ? 1 : undefined })}`;
}
export const homeUrl = ({ grade, profile, lang } = {}) => `./?${query({ grade, profile, lang })}`;
export const progressUrl = ({ grade, profile, lang } = {}) =>
  `progress.html?${query({ grade, profile, lang })}`;
