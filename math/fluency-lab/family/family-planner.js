import { GRADES } from "../problem-bank.js";

const STARTS = new Set(["daily", "mission", "practice", "checkup", "realworld"]);
const VIEWS = new Set(["games", "path"]);

// Family URLs carry only navigation choices. Learner answers, names, and progress stay local.
export function familyLaunch({ grade, profile, start, view, skill } = {}) {
  const gradeNumber = Number(grade);
  const profileNumber = Number(profile);
  if (!GRADES.some((entry) => entry.grade === gradeNumber)) throw new RangeError("Choose a supported Fluency Lab grade.");
  if (!Number.isInteger(profileNumber) || profileNumber < 0 || profileNumber > 5) throw new RangeError("Choose a valid local learner profile.");

  const params = new URLSearchParams({ grade: String(gradeNumber), profile: String(profileNumber) });
  if (view !== undefined) {
    if (!VIEWS.has(view)) throw new RangeError("This family view is not available.");
    params.set("view", view);
  } else if (start !== undefined) {
    if (!STARTS.has(start)) throw new RangeError("This family practice mode is not available.");
    params.set("start", start);
    if (start === "practice") {
      const selected = GRADES.find((entry) => entry.grade === gradeNumber).skills.find((entry) => entry.id === skill);
      if (!selected) throw new RangeError("Choose a skill in the selected grade.");
      params.set("skill", `${gradeNumber}:${selected.id}`);
    }
  }
  return `../?${params.toString()}`;
}

export function familySessionLaunch({ grade, profile, skill, lang = "en" } = {}) {
  const gradeNumber = Number(grade);
  const profileNumber = Number(profile);
  const selected = GRADES.find((entry) => entry.grade === gradeNumber)?.skills.find((entry) => entry.id === skill);
  if (!selected) throw new RangeError("Choose a skill in the selected grade.");
  if (!Number.isInteger(profileNumber) || profileNumber < 0 || profileNumber > 5) throw new RangeError("Choose a valid local learner profile.");
  const params = new URLSearchParams({ grade: String(gradeNumber), profile: String(profileNumber), skill: selected.id, lang: lang === "es" ? "es" : "en" });
  return `tonight.html?${params.toString()}`;
}

// Teacher-created family links contain activity settings only. Profile selection
// stays local to the device that opens the link.
export function familySessionShare({
  grade,
  skill,
  lang = "en",
  minutes = 5,
  challenge = "adaptive",
  support = "standard",
} = {}) {
  const gradeNumber = Number(grade);
  const selected = GRADES.find((entry) => entry.grade === gradeNumber)?.skills.find(
    (entry) => entry.id === skill,
  );
  if (!selected) throw new RangeError("Choose a skill in the selected grade.");
  if (![5, 10].includes(Number(minutes))) throw new RangeError("Choose a 5- or 10-minute session.");
  if (!new Set(["adaptive", "building", "grade-stretch"]).has(challenge))
    throw new RangeError("Choose a supported challenge range.");
  if (!new Set(["standard", "extra"]).has(support))
    throw new RangeError("Choose a supported help level.");
  const params = new URLSearchParams({
    grade: String(gradeNumber),
    skill: selected.id,
    lang: lang === "es" ? "es" : "en",
    minutes: String(Number(minutes)),
    challenge,
    support,
  });
  return `./family/tonight.html?${params.toString()}`;
}
