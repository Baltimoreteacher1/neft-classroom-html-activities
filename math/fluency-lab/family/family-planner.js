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
